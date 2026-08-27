// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { DocumentosGedPage } from '../../../pages/DocumentosGedPage.js';
import { criarDocumento, criarNivelAprovacao } from '../../../factories/documento.js';
import { criarJustificativaDecisao } from '../../../factories/produto-compra.js';
import { envObrigatoria } from '../../../config/ambiente.js';

/**
 * CT-GED-04-S1 — rejeitar documento pendente de aprovação.
 *
 * `CT-GED-04-H` (`gestao-documentos.spec.js`) cobre **aprovar**. Rejeitar não tinha teste, e a
 * investigação de campo mediu dois fatos que merecem guarda permanente:
 *
 * 1. **A rejeição apaga o documento para todos os efeitos.** Ele não vai para a Lixeira: some
 *    da pasta e todas as rotas de leitura passam a responder `NotFoundException`. É a única
 *    operação de limpeza do GED que não deixa resíduo nenhum — e é bom que continue assim.
 *    ⚠️ Precisão medida em 27/08/2026 (id 707014), que corrige a nota da skill: a **linha de
 *    metadados sobrevive** no dataset `document`, com `approved: false`, `activeVersion: false`
 *    e `deleted: false`. Não é contradição — é a diferença entre "o registro sumiu da tabela" e
 *    "o documento deixou de existir para quem lê". O oráculo deste teste é o segundo.
 * 2. **A resposta da API MENTE.** `POST /ecm/api/rest/ecm/documentView/approveDocument` com
 *    `{"approved": false}` responde `{"msgId":"Novo documento publicado: <descrição>"}` — o
 *    mesmo texto de uma publicação bem-sucedida.
 *
 * ⚠️ **O risco que este teste existe para impedir:** alguém escrever (ou "consertar") um teste
 * futuro usando esse `msgId` como oráculo de rejeição. Ele seria um falso verde PERMANENTE —
 * passaria inclusive se a rejeição parasse de funcionar. Por isso o oráculo aqui é, e tem de
 * continuar sendo, o **estado do documento no servidor**: ele deixou de existir?
 *
 * ## O oráculo, e por que o dataset `document` responde as duas perguntas de uma vez
 *
 * O caso pede duas provas — "não existe" e "não está na Lixeira". O dataset `document` dá as
 * duas numa consulta: um documento **na Lixeira continua no dataset**, com `deleted: true`
 * (medido na massa QA acumulada da base). Então basta ler a linha do id: `deleted: false`
 * responde "não está na Lixeira", e `approved: false` + `activeVersion: false` respondem
 * "não existe mais como documento". Nada disso exige varrer as ~30 páginas da Lixeira, que é
 * lenta e cuja busca textual comprovadamente não encontra item presente.
 *
 * A prova é fechada por uma SEGUNDA rota de leitura, independente do dataset
 * (`GET /api/public/2.0/documents/getDocument/<id>` → HTTP 500 `NotFoundException`): uma rota
 * só não separa "o documento sumiu" de "esta consulta não o enxerga".
 *
 * Uma consulta de CONTROLE acompanha a assertion: o mesmo dataset, com o mesmo formato de
 * constraint, pedindo a pasta "Parecer Técnico" (343011), que existe. Sem ela, um resultado
 * vazio seria indistinguível de "a consulta está errada" — e o teste ficaria verde por
 * acidente, que é exatamente o defeito de teste que este caso denuncia.
 *
 * ## Cuidados do ambiente
 *
 * - Precisa do lock `fluig-upload-staging` (`enviarDocumento` já o segura): a área de upload é
 *   um diretório por USUÁRIO no servidor, compartilhado com o anexo da Solicitação de Compras.
 * - Abrir "Documentos a aprovar" **muda estado de sessão no servidor**
 *   (`POST /portal/api/rest/session/setAttribute?name=centralTaskType&value=toapprove`): a
 *   Central pode aterrissar em outra sub-aba depois. Quem depender da Central em seguida tem
 *   de clicar na aba desejada em vez de confiar no estado herdado.
 * - "Compras e Contratação > Parecer Técnico" é a única pasta confirmada com o recurso de
 *   aprovação habilitado — a aba "Aprovação" do publicador não existe em "Meus Documentos".
 *
 * `@destrutivo` porque publica de verdade. **Resíduo: nenhum** — a rejeição é a limpeza
 * perfeita, e é por isso que este é o caso mais barato da lista.
 */
test.afterEach(async ({ page }) => {
  // A pasta atual do GED é lembrada no SERVIDOR, por usuário. Sem este reset a próxima spec
  // aterrissa fora da Raiz. `irParaRaizGarantido()` clica na Raiz ANTES de exigir a grade —
  // exigir a grade primeiro faz o afterEach gastar 45s num `columnheader` inexistente quando a
  // pasta corrente da conta não vale mais, e afterEach vermelho reprova o teste inteiro.
  const documentosPage = new DocumentosGedPage(page);
  await documentosPage.irParaRaizGarantido();
});

/**
 * Consulta o dataset `document` por `documentPK.documentId`.
 *
 * ⚠️ `page.evaluate` + `fetch`, nunca `page.request`: o WAF do TOTVS Cloud barra o contexto de
 * requisição do Playwright (armadilha já paga em `utils/cancelamento-fluig.js`).
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} documentId
 * @returns {Promise<Array<{ id: number, descricao: string, excluido: boolean, pai: number, aprovado: boolean, versaoAtiva: boolean }>>}
 */
async function consultarDocumentoPorId(page, documentId) {
  return page.evaluate(async (id) => {
    const resposta = await fetch('/api/public/ecm/dataset/datasets', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'document',
        fields: null,
        constraints: [
          { _field: 'documentPK.documentId', _initialValue: id, _finalValue: id, _type: 1, _likeSearch: false },
        ],
      }),
    });
    if (!resposta.ok) return [];
    const json = await resposta.json().catch(() => null);
    return (json?.content?.values ?? []).map((/** @type {any} */ linha) => ({
      id: Number(linha['documentPK.documentId']),
      descricao: String(linha.documentDescription ?? ''),
      excluido: linha.deleted === true,
      pai: Number(linha.parentDocumentId),
      aprovado: linha.approved === true,
      versaoAtiva: linha.activeVersion === true,
    }));
  }, documentId);
}

/**
 * Segunda rota de leitura, independente do dataset: a API pública de documentos.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} documentId
 * @returns {Promise<{ status: number, code: string, corpo: string }>}
 */
async function lerDocumentoPelaApiPublica(page, documentId) {
  return page.evaluate(async (id) => {
    const resposta = await fetch(`/api/public/2.0/documents/getDocument/${id}`, {
      credentials: 'include',
      headers: { Referer: `${location.origin}/portal/p/1/home` },
    });
    const corpo = await resposta.text();
    /** @type {string} */
    let code = '';
    try {
      code = String(JSON.parse(corpo)?.code ?? '');
    } catch {
      // Corpo não-JSON (o ambiente devolve texto puro em alguns erros) — o status e o corpo
      // cru já bastam para a assertion, e nada é engolido: os dois vão para a mensagem.
      code = '';
    }
    return { status: resposta.status, code, corpo: corpo.slice(0, 300) };
  }, documentId);
}

/** Pasta "Compras e Contratação > Parecer Técnico" — a única com aprovação habilitada. */
const PASTA_PARECER_TECNICO = '343011';

test.describe('GED — rejeitar documento pendente de aprovação (CT-GED-04-S1)', () => {
  test('CT-GED-04-S1 @destrutivo — o documento rejeitado deveria deixar de existir, e não ir para a Lixeira', async ({
    page,
  }) => {
    // Publicar com aprovação + achar a tarefa na Central (que só traz dado novo reabrindo a
    // categoria) é legitimamente longo — mesmo orçamento de CT-GED-04-H.
    test.setTimeout(180_000);

    const documentosPage = new DocumentosGedPage(page);
    const documento = criarDocumento();
    const nivel = criarNivelAprovacao();
    const justificativa = criarJustificativaDecisao('rejeicao-documento');
    const usuarioAutomacao = envObrigatoria('QA_USERNAME');

    await documentosPage.irParaRaizGarantido();
    await documentosPage.abrirPasta('Compras e Contratação');
    await documentosPage.abrirPasta('Parecer Técnico');

    await documentosPage.enviarDocumento({
      descricao: documento.descricao,
      caminhoArquivo: 'fixtures/anexos/documento-valido.pdf',
      antesDeConfirmar: () =>
        documentosPage.configurarAprovacaoComResponsavel({
          nomeNivel: nivel.nome,
          loginAprovador: usuarioAutomacao,
        }),
    });

    // ── Rejeitar como aprovador ──────────────────────────────────────────────────────────
    // O `documentId` é lido do cartão ANTES da rejeição: depois dela não há mais de onde
    // tirá-lo, e sem ele não existe oráculo.
    const documentId = await documentosPage.rejeitarDocumento(documento.descricao, justificativa);

    // ── Prova de que a consulta funciona (anti falso verde) ──────────────────────────────
    // Sem esta âncora, "zero linhas" para o documento rejeitado seria indistinguível de "a
    // constraint está errada" — e o teste passaria mesmo se a rejeição não funcionasse.
    const controle = await consultarDocumentoPorId(page, PASTA_PARECER_TECNICO);
    expect(
      controle.map((doc) => doc.id),
      'PRÉ-CONDIÇÃO AUSENTE: a consulta de controle ao dataset `document` não achou a pasta ' +
        `"Parecer Técnico" (${PASTA_PARECER_TECNICO}), que existe. A consulta está quebrada ou o ` +
        'ambiente não respondeu — sem ela, um resultado vazio para o documento rejeitado não ' +
        'prova nada',
    ).toEqual([Number(PASTA_PARECER_TECNICO)]);

    // ── Oráculo 1: o documento não sobrevive como documento, e NÃO foi para a Lixeira ───
    //
    // ⚠️ Correção de campo (27/08/2026) sobre a nota da skill "rejeitar DESTRÓI o documento":
    // a LINHA de metadados sobrevive no dataset `document` — medido no id 707014, que continua
    // consultável com `parentDocumentId: 343011`. O que muda é o que ela carrega:
    // `approved: false`, `activeVersion: false`, `deleted: false`. Ou seja, o documento fica
    // INERTE (nenhuma versão ativa, nunca aprovado) e, ao mesmo tempo, **não está na Lixeira**
    // — um item da Lixeira aparece neste mesmo dataset com `deleted: true`.
    //
    // O caso pede duas provas, e as duas saem desta consulta: "não está na Lixeira" é
    // `deleted: false`, e "deixou de existir como documento" é não ter versão ativa nem
    // aprovação. A primeira versão deste teste exigia zero linhas e reprovava por medir a
    // linha de metadados em vez do estado do documento — que é justamente o erro de leitura
    // que este caso denuncia noutro lugar (o `msgId`).
    const apos = await consultarDocumentoPorId(page, documentId);
    const situacao =
      apos.length === 0
        ? 'inexistente'
        : apos[0].excluido
          ? 'na-lixeira'
          : apos[0].aprovado || apos[0].versaoAtiva
            ? 'vivo-na-pasta'
            : 'inerte';

    expect(
      [situacao],
      `documento ${documentId} ("${documento.descricao}") depois de REJEITADO: situação ` +
        `"${situacao}" (linhas no dataset: ` +
        `${JSON.stringify(apos.map((doc) => ({ pai: doc.pai, deleted: doc.excluido, approved: doc.aprovado, activeVersion: doc.versaoAtiva })))}). ` +
        'Os únicos desfechos aceitáveis são "inexistente" (a linha some) e "inerte" (a linha ' +
        'fica, sem versão ativa e sem aprovação, e todas as rotas de leitura respondem ' +
        'NotFoundException). "na-lixeira" significa que a rejeição virou exclusão comum — o ' +
        'documento recusado ficaria restaurável por qualquer um. "vivo-na-pasta" significa que ' +
        'a rejeição publicou o documento, o oposto do que ela quer dizer',
    ).toEqual([expect.stringMatching(/^(inexistente|inerte)$/)]);

    // ── Oráculo 2: segunda rota de leitura, independente do dataset ──────────────────────
    // Duas rotas porque uma só não separa "o documento sumiu" de "esta consulta não o enxerga".
    const pelaApi = await lerDocumentoPelaApiPublica(page, documentId);
    expect(
      `HTTP ${pelaApi.status} code=${pelaApi.code}`,
      `a API pública ainda serve o documento ${documentId} depois de rejeitado. Este ambiente ` +
        'não usa 404 para recurso inexistente: responde HTTP 500 com `code: NotFoundException` ' +
        `(ver a skill cassi-fluig-master). Corpo recebido: ${pelaApi.corpo}`,
    ).toBe('HTTP 500 code=NotFoundException');

    // ── Oráculo 3: e ele não apareceu na pasta de destino ────────────────────────────────
    // Enquanto pendente ele já não aparecia; rejeitado, muito menos. Afirmado sobre a pasta
    // INTEIRA (a grade pagina em 30 por Descrição), com `tentativas: 1` porque não há o que
    // esperar aparecer.
    await documentosPage.irParaRaizGarantido();
    await documentosPage.abrirPasta('Compras e Contratação');
    await documentosPage.abrirPasta('Parecer Técnico');
    await documentosPage.irParaPaginaComDocumento(documento.descricao, { tentativas: 1 });
    await expect(
      documentosPage.localizarLinha(documento.descricao),
      `o documento rejeitado "${documento.descricao}" apareceu em "Parecer Técnico" — rejeitar ` +
        'não pode publicar',
    ).toHaveCount(0);

    // ⚠️ Nenhuma assertion acima olha o `msgId` da resposta de `approveDocument`, e isso é
    // deliberado: com `approved:false` ele vem como "Novo documento publicado: …". Usá-lo como
    // oráculo criaria um falso verde permanente. O oráculo é o ESTADO do documento.
  });
});
