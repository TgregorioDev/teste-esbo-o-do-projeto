// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { SigajuriPage } from '../../../pages/SigajuriPage.js';
import { criarSolicitacaoContencioso } from '../../../factories/juridico.js';
import { bloquearEscritaNoAmbiente } from '../../../utils/guarda-criacao.js';

const PROCESS_ID = 'SIGAJURI_Contencioso';

/**
 * Etapa e pool em que o Contencioso DEVE nascer — medidos em campo em 27/08/2026 na
 * instância 112737, criada por este mesmo teste (`GET /requests/<id>?expand=currentMovements`
 * e `GET /requests/<id>/tasks?pageSize=60`).
 */
const ETAPA_INICIAL_ESPERADA = '7-Resposta';
const SEQUENCIA_INICIAL_ESPERADA = 7;
/** Pool que o formulário grava para "Responsável pela Demanda" = `CASSI Sede`. */
const POOL_ESPERADO = 'Pool:Group:GRUPO_GEJUR_9';

/**
 * Lê, do servidor, o estado resultante de uma solicitação: etapa corrente, tarefas e os
 * campos do formulário.
 *
 * ⚠️ `page.evaluate` + `fetch`, nunca `page.request`: o WAF do TOTVS Cloud devolve 403 para
 * `/process-management/api/v2/**` sem `User-Agent` de navegador e `Referer` do portal (ver
 * `utils/cancelamento-fluig.js`, que paga a mesma armadilha).
 *
 * ⚠️ `expand` aceita **um único valor** por chamada — dois devolvem tudo `null` em silêncio,
 * por isso são três requisições e não uma.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} processInstanceId
 * @returns {Promise<{ status: string, etapas: Array<{ sequencia: number, nome: string }>, tarefaCorrente: { status: string, assignee: string, etapa: string, sequencia: number } | null, campos: Record<string, string> }>}
 */
async function lerEstadoDaSolicitacao(page, processInstanceId) {
  return page.evaluate(async (id) => {
    const opcoes = {
      credentials: /** @type {RequestCredentials} */ ('include'),
      headers: { Referer: `${location.origin}/portal/p/1/home` },
    };
    const movimentos = await (
      await fetch(`/process-management/api/v2/requests/${id}?expand=currentMovements`, opcoes)
    ).json();
    const tarefas = await (
      await fetch(`/process-management/api/v2/requests/${id}/tasks?pageSize=60`, opcoes)
    ).json();
    const formulario = await (
      await fetch(`/process-management/api/v2/requests/${id}?expand=formFields`, opcoes)
    ).json();

    /** @type {Record<string, string>} */
    const campos = {};
    for (const campo of formulario?.formFields ?? []) campos[campo.field] = String(campo.value ?? '');

    const corrente = (tarefas?.items ?? []).find((/** @type {any} */ t) => t.status === 'NOT_COMPLETED') ?? null;

    return {
      status: String(movimentos?.status ?? '?'),
      etapas: (movimentos?.currentMovements ?? []).map((/** @type {any} */ m) => ({
        sequencia: Number(m?.state?.sequence),
        nome: String(m?.state?.stateName ?? ''),
      })),
      tarefaCorrente: corrente
        ? {
            status: String(corrente.status),
            assignee: String(corrente.assignee?.code ?? ''),
            etapa: String(corrente.state?.stateName ?? ''),
            sequencia: Number(corrente.state?.sequence),
          }
        : null,
      campos,
    };
  }, processInstanceId);
}

/**
 * CT-JUR-04-H / CT-JUR-04-S1 — Contencioso (`SIGAJURI_Contencioso`).
 *
 * Diferente dos outros três processos SIGAJURI, este formulário é FUNCIONAL: `UF`,
 * `Responsável pela Demanda` (roteamento por área/escritório/GEJUR) e `Tipo da Consulta` vêm
 * populados com valores reais — nenhum `ServiceNotFoundException` aqui. Confirmado em campo:
 * submeter com dados válidos responde `200 OK` em `POST /ecm/api/rest/ecm/workflowView/send`
 * com `processInstanceId` preenchido — processo criado de verdade, roteado pela combinação
 * UF + Responsável pela Demanda escolhida.
 *
 * O bloco "Envolvidos:" (onde se esperaria registrar a parte contrária de um processo
 * contencioso) existe no HTML do formulário mas nasce e permanece SEM nenhum campo — nem
 * mesmo trocando para tipos de consulta claramente contenciosos (`Liminar`, testado em
 * campo). Uma solicitação foi submetida e aceita (200, processo criado) sem nenhuma parte
 * contrária informada, porque não existe onde informá-la nesta tela.
 *
 * ## CT-JUR-06-H — onde a solicitação PARA (acrescentado em 27/08/2026)
 *
 * `CT-JUR-04-H` afirmava só sobre a RESPOSTA do envio ("criado com sucesso"). Isso é
 * precisamente o falso positivo do D-01 vestido de outra área: em Compras o servidor também
 * responde 200 e a SC mesmo assim nasce presa no marco de Início. Por isso o mesmo teste
 * destrutivo passou a ler o ESTADO RESULTANTE no servidor — sem criar massa nova, que é o
 * ponto do caso.
 *
 * Medido em campo em 27/08/2026 (instância 112737): etapa `7-Resposta` (sequência 7), tarefa
 * `NOT_COMPLETED` no pool `Pool:Group:GRUPO_GEJUR_9`, `status: OPEN`, e o campo `grupo` do
 * formulário gravado com o MESMO pool.
 *
 * ⚠️ **Achado de campo que corrige o enunciado do caso.** O catálogo fala em "roteamento pela
 * UF"; medindo a tela (leitura pura, 4 UFs — MA, SP, RJ, DF), a lista de "Responsável pela
 * Demanda" é **idêntica em todas as UFs** e o campo oculto `grupo` depende **só** do
 * Responsável escolhido — a UF não influencia o pool e não há validação de coerência entre as
 * duas escolhas (é possível abrir uma demanda com `UF = MA` e `Responsável = Advogado SP -
 * GEJUR`, que cai no `GRUPO_GEJUR_4`). Por isso o oráculo de roteamento aqui é a coerência
 * `grupo do formulário` × `pool da tarefa`: é o que pega um BPM que ignore a escolha do
 * solicitante e mande tudo para um grupo padrão.
 */
test.describe('SIGAJURI_Contencioso — roteamento por área e parte contrária', () => {
  test('CT-JUR-04-H / CT-JUR-06-H deveria criar e rotear a solicitação pela UF e Responsável pela Demanda escolhidos, parando no pool certo @destrutivo', async ({
    page,
  }, testInfo) => {
    const sigajuri = new SigajuriPage(page);
    const dados = criarSolicitacaoContencioso({
      uf: 'MA',
      responsavel: 'CASSI Sede',
      tipoConsulta: 'Orientação processual',
    });

    await sigajuri.goto(PROCESS_ID);
    await sigajuri.expectFormularioAberto();
    await sigajuri.preencherContencioso(dados);

    const resposta = await sigajuri.enviarECapturarResposta();

    expect(resposta.status(), 'o envio deveria ser aceito (200) para dados válidos').toBe(200);
    const corpo = await resposta.json();
    const processInstanceId = corpo?.content?.processInstanceId;
    expect(
      typeof processInstanceId === 'number' && processInstanceId > 0,
      `a resposta deveria trazer um processInstanceId numérico positivo (recebido: ${JSON.stringify(processInstanceId)})`,
    ).toBe(true);

    testInfo.annotations.push({ type: 'contencioso-criado', description: String(processInstanceId) });

    // Nenhum diálogo de erro deveria aparecer para um envio aceito.
    await expect(
      page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Erro', exact: true }) }),
    ).toHaveCount(0);

    // ── CT-JUR-06-H — o que a tela diz não é o que o servidor fez ──────────────────────────
    //
    // Até aqui o teste só afirma sobre a RESPOSTA do envio ("criado com sucesso"). É
    // exatamente o falso positivo do D-01 em outra área: a SC de Compras também responde
    // 200 e mesmo assim nasce presa no marco de Início, com a conta de integração. As
    // assertions abaixo leem o ESTADO RESULTANTE no servidor.
    const estado = await lerEstadoDaSolicitacao(page, processInstanceId);

    expect(
      estado.status,
      `Contencioso ${processInstanceId}: a solicitação deveria ficar ABERTA depois de criada ` +
        `(status observado: "${estado.status}")`,
    ).toBe('OPEN');

    expect(
      estado.etapas.map((e) => `${e.sequencia}:${e.nome}`),
      `Contencioso ${processInstanceId}: deveria parar na etapa ` +
        `${SEQUENCIA_INICIAL_ESPERADA}:${ETAPA_INICIAL_ESPERADA}. Outra etapa aqui significa ` +
        'que o desenho do processo mudou — e quem depende dela (o jurídico que responde) ' +
        'deixa de receber a demanda',
    ).toEqual([`${SEQUENCIA_INICIAL_ESPERADA}:${ETAPA_INICIAL_ESPERADA}`]);

    expect(
      estado.tarefaCorrente,
      `Contencioso ${processInstanceId}: nenhuma tarefa NOT_COMPLETED — a solicitação foi ` +
        'criada mas não deixou trabalho para ninguém',
    ).not.toBeNull();

    expect(
      estado.tarefaCorrente?.assignee,
      `Contencioso ${processInstanceId}: a tarefa corrente deveria estar no pool ` +
        `"${POOL_ESPERADO}" (grupo do "Responsável pela Demanda" = "${dados.responsavel}"). ` +
        'Cair em outro grupo é a demanda chegando ao jurídico errado',
    ).toBe(POOL_ESPERADO);

    // O oráculo do ROTEAMENTO: o pool em que a tarefa parou tem de ser exatamente o que o
    // formulário calculou e gravou no campo `grupo` a partir do "Responsável pela Demanda".
    // Sem esta assertion, um BPM que ignorasse o campo e mandasse tudo para um grupo padrão
    // passaria despercebido enquanto esse padrão fosse o GRUPO_GEJUR_9.
    expect(
      estado.tarefaCorrente?.assignee,
      `Contencioso ${processInstanceId}: o pool da tarefa deveria ser o mesmo que o formulário ` +
        `gravou em "grupo" ("${estado.campos.grupo}") — divergência aqui significa que o BPM ` +
        'ignorou a escolha do solicitante e roteou por outro critério',
    ).toBe(estado.campos.grupo);

    expect(
      estado.campos.uf,
      `Contencioso ${processInstanceId}: a UF escolhida deveria ser gravada na solicitação`,
    ).toBe(dados.uf);
  });

  test('CT-JUR-04-S1 deveria oferecer campo para registrar a parte contrária em consultas contenciosas @bug', async ({
    page,
  }) => {
    const guarda = await bloquearEscritaNoAmbiente(page);
    const sigajuri = new SigajuriPage(page);

    await sigajuri.goto(PROCESS_ID);
    await sigajuri.expectFormularioAberto();

    // "Liminar" é o tipo de consulta mais claramente contencioso do catálogo — se algum tipo
    // revelasse o controle de parte contrária ao ser escolhido, seria este.
    await sigajuri.comboTipoConsultaContencioso.selectOption('Liminar');
    await expect(sigajuri.grupoEnvolvidos).toBeVisible();

    // Prova de campo: o grupo "Envolvidos:" contém uma tabela (`tabEnvolvidos`) com um botão
    // "Novo Envolvido" (`wdkAddChild`) — o único caminho real para registrar uma parte. A
    // ÚNICA linha da tabela é um MODELO oculto (`style="display:none"`, usado pelo widget
    // para clonar linhas novas), então contar `input`/`select` dentro do grupo sem filtrar
    // essa linha (a primeira versão deste teste fazia isso) apontava 7 campos que ninguém
    // consegue ver nem preencher — falso positivo. A pergunta certa é: existe um caminho
    // VISÍVEL para adicionar uma parte?
    const botaoVisivelPorPadrao = await sigajuri.botaoNovoEnvolvido.isVisible();

    // "Não possui processo." reage de fato (desmarca `readonly` da linha-modelo — confirmado
    // em campo), então testamos também com ela marcada antes de concluir.
    await sigajuri.checkboxNaoPossuiProcesso.check();
    const botaoVisivelSemProcesso = await sigajuri.botaoNovoEnvolvido.isVisible();

    expect(
      botaoVisivelPorPadrao || botaoVisivelSemProcesso,
      'deveria existir um caminho visível para registrar a parte contrária (botão "Novo ' +
        'Envolvido") em uma consulta do tipo "Liminar" — testado com o formulário no estado ' +
        'padrão e com "Não possui processo." marcado, o botão fica oculto (classe CSS ' +
        '`sem-processo-hide`) nos dois casos',
    ).toBe(true);

    // Investigação ficou só na leitura — nenhum Enviar foi acionado neste caso.
    expect(guarda.tentativas(), `tentativa(s) de escrita bloqueada(s): ${JSON.stringify(guarda.urls())}`).toBe(0);
  });
});
