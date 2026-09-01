// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { FormularioSolicitacaoCompraPage } from '../../../pages/FormularioSolicitacaoCompraPage.js';
import { aguardarDataset, derrubarDataset } from '../../../utils/dataset-fluig.js';

/**
 * CT-CMP-07-S1 — regressão do **fail-open** do formulário clássico de Solicitação de Compras.
 *
 * ## O defeito
 *
 * Enquanto a montagem do formulário não termina, o clique em "Enviar" **não passa por
 * validação nenhuma**: o Fluig dispara `POST /ecm/api/rest/ecm/workflowView/send` direto e o
 * servidor cria uma **Solicitação de Compras a partir de um formulário vazio** — sem produto,
 * sem filial, sem justificativa, sem rateio e sem anexo. É o defeito mais severo da tabela do
 * README (`docs/estado-do-gate.md`, seção "Defeito de produto novo, achado por rodar os
 * destrutivos") e era o único sem teste próprio: foi descoberto de raspão e a janela é
 * probabilística, então ninguém o reencontra por acaso.
 *
 * Risco concreto: uma SC em branco chega ao Gestor Imediato e ao Protheus. É corrupção de dado
 * de negócio, não incômodo de interface.
 *
 * ## Por que este teste NÃO é o CT-CMP-02-S1
 *
 * `CT-CMP-02-S1` (`validacoes-solicitacao-compras.spec.js`) cobre "campos obrigatórios vazios"
 * com o formulário **já montado** — e lá o produto se comporta: recusa antes de qualquer
 * escrita, com diálogo nomeando o obrigatório pendente. O fenômeno aqui é outro: a validação
 * de cliente ainda **não foi registrada** quando o clique acontece.
 *
 * ## Como a janela vira determinística (medido em 27/08/2026)
 *
 * Sem interceptação, o fail-open aparece em 2 de 9 cargas — um teste escrito assim seria flaky
 * por construção e não deveria existir. Forçando `ds_protheus_getMatriculaTitular_rest` a
 * responder **500** (o erro real observado em campo: `WFLYEJB0054: Failed to marshal EJB
 * parameters`), a janela é permanente. Medido em três cargas seguidas:
 *
 * - o dataset da matrícula é o **primeiro** da montagem, e é `POST /api/public/ecm/dataset/datasets`
 *   (por isso `derrubarDataset` serve — diferente dos combos de zoom, que usam outra rota);
 * - com ele em 500, **nenhuma** das outras três chamadas de inicialização chega a sair, e a
 *   resposta que fecha a montagem (`ds_getFormDistribuicaoAreas` … `tbAreasDist`) nunca vem;
 * - o clique em Enviar dispara o `send` e **nenhum diálogo de validação aparece**.
 *
 * ⚠️ Detalhe medido que corrige o enunciado do caso: nesta configuração o overlay `blockUI` do
 * iframe **já saiu** quando o heading fica visível (`.blockUI.blockOverlay` e
 * `.loading-message` em 0 nas seis amostras de 5 em 5 segundos). Ou seja, o usuário **não tem
 * pista visual** de que a tela não terminou de montar — o que torna o defeito pior, não melhor.
 * Por isso a pré-condição observável deste teste é "a resposta que fecha a montagem não
 * chegou", nunca "o overlay está visível".
 *
 * ## O oráculo
 *
 * **Contar as requisições de start que saíram** — nunca o que a tela mostra depois. Duas razões,
 * as duas já pagas por esta suíte:
 *
 * 1. abortar o `send` muda o comportamento do widget (armadilha registrada no `CLAUDE.md`), e
 *    a mudez da tela sob a guarda de escrita seria artefato do teste, não do produto;
 * 2. `CT-CMP-02-S4` já provou que a confirmação de sucesso do Fluig é **verdadeira** — a SC
 *    nasce mesmo. Olhar para a tela não distingue "criou" de "fingiu que criou".
 *
 * ## O que o servidor faz com essa submissão (medido em 27/08/2026)
 *
 * Nesta configuração — matrícula em 500, formulário **vazio** — o `send` sai e o servidor
 * **recusa** com HTTP 500. Ou seja: o que este teste reproduz de forma determinística é a metade
 * de CLIENTE do defeito (submeter sem validar), e nesta execução nada é gravado.
 *
 * Isso **não** enfraquece o caso, e a mensagem da falha diz isso explicitamente: o fail-open
 * original foi observado com o formulário já PREENCHIDO, quando a montagem falha depois de os
 * campos terem valor — e aí o servidor aceita e a SC nasce (`docs/estado-do-gate.md`). A
 * recusa do servidor aqui é acidente do formulário vazio, não proteção.
 *
 * Por isso a tag `@destrutivo` fica: o caminho exercitado **pode** criar, e cria quando a
 * montagem falha noutro ponto. Quando criar, o `globalTeardown` cancela pelo livro-razão
 * (`fixtures/fixtures.js` escuta as respostas de `/workflowView/send` e registra o
 * `processInstanceId` sozinho).
 *
 * ⚠️ **Vermelho intencional** enquanto o defeito existir. Não ajuste a assertion para passar:
 * o dia em que o produto mantiver o Enviar inerte até a montagem terminar, este teste fica
 * verde sozinho.
 */

/** Dataset da montagem cuja falha torna a janela do fail-open determinística. */
const DATASET_MATRICULA = 'ds_protheus_getMatriculaTitular_rest';

/** Resposta que FECHA a inicialização do formulário — ver `FormularioSolicitacaoCompraPage`. */
const RESPOSTA_FIM_DA_MONTAGEM = /datasetId=ds_getFormDistribuicaoAreas.*tbAreasDist/;

/** Endpoint que cria a Solicitação de Compras a partir do formulário clássico. */
const ROTA_SEND = /\/ecm\/api\/rest\/ecm\/workflowView\/send$/;

/**
 * Descreve, para a mensagem da falha, o que o SERVIDOR fez com a submissão que o cliente não
 * deveria ter deixado sair.
 *
 * Os três desfechos têm gravidades diferentes e a mensagem precisa distingui-los — dizer "uma
 * SC foi criada" quando o servidor recusou seria documentar uma conclusão que a execução não
 * sustenta, e é o tipo de imprecisão que faz alguém "consertar" o teste errado.
 *
 * @param {{ status: number, processInstanceId: unknown, corpo: string } | null} criacao
 * @returns {string}
 */
function descreverDesfechoDoServidor(criacao) {
  if (!criacao) {
    return (
      '. A resposta do servidor não chegou a ser observada em 60s (falha de transporte ou ' +
      'ambiente), mas a tentativa saiu — e é a tentativa que este caso proíbe'
    );
  }
  if (criacao.processInstanceId) {
    return (
      `. O servidor respondeu HTTP ${criacao.status} e devolveu processInstanceId=` +
      `${JSON.stringify(criacao.processInstanceId)} — ou seja, existe agora na base uma SC sem ` +
      'produto, sem filial, sem justificativa, sem rateio e sem anexo, a caminho do Gestor ' +
      'Imediato e do Protheus'
    );
  }
  return (
    `. O servidor recusou esta submissão (HTTP ${criacao.status}, corpo: ` +
    `${JSON.stringify(criacao.corpo)}) e NENHUMA solicitação nasceu desta execução — o defeito ` +
    'documentado aqui é do CLIENTE: ele submeteu um formulário não montado sem rodar validação ' +
    'nenhuma. A recusa do servidor é acidental (o formulário estava vazio); quando a montagem ' +
    'falha depois de os campos já terem valor, a MESMA janela cria a SC de verdade — foi assim ' +
    'que o defeito foi descoberto (ver `docs/estado-do-gate.md`). Não trate a recusa como se o ' +
    'produto estivesse protegido'
  );
}

test.describe('Fail-open do formulário clássico de Solicitação de Compras (CT-CMP-07-S1)', () => {
  test('CT-CMP-07-S1 @destrutivo @bug — Enviar não deveria criar solicitação antes de o formulário terminar de montar', async ({
    page,
  }, testInfo) => {
    // Carga do formulário (~10s) + prazo para o servidor resolver o `send`.
    testInfo.setTimeout(180_000);

    // Torna a janela determinística. Sem isto o cenário é 2-em-9 e o teste seria flaky por
    // construção — ver o cabeçalho.
    await derrubarDataset(page, DATASET_MATRICULA, 500);

    // ── Oráculo: as requisições de criação que SAÍRAM ────────────────────────────────────
    // Registradas antes da navegação, e nunca abortadas: o teste conta a tentativa e deixa o
    // servidor responder o que responder.
    /** @type {string[]} */
    const startsEnviados = [];
    page.on('request', (requisicao) => {
      if (requisicao.method() !== 'POST') return;
      if (ROTA_SEND.test(requisicao.url())) startsEnviados.push(requisicao.url());
    });

    // Marco POSITIVO da montagem. Espelha `RESPOSTA_FIM_DA_INICIALIZACAO` do Page Object:
    // é a última das chamadas de inicialização, e é a condição observável que separa "o
    // formulário apareceu" de "o formulário está pronto para ser usado".
    const montagem = { concluida: false };
    page.on('response', (resposta) => {
      if (RESPOSTA_FIM_DA_MONTAGEM.test(resposta.url())) montagem.concluida = true;
    });

    const formulario = new FormularioSolicitacaoCompraPage(page);

    // `goto()` (e não `expectAberto()`): `expectAberto` exige a montagem CONCLUÍDA e falharia
    // com `PRÉ-CONDIÇÃO AUSENTE` — que é exatamente o estado que este teste precisa exercitar.
    const respostaMatricula = aguardarDataset(page, DATASET_MATRICULA);
    await formulario.goto();

    // Pré-condição 1: a interceptação pegou de fato. Sem esta confirmação, um teste verde
    // poderia significar apenas "o dataset não foi chamado nesta carga".
    const matricula = await respostaMatricula;
    expect(
      matricula.status(),
      `PRÉ-CONDIÇÃO AUSENTE: ${DATASET_MATRICULA} deveria ter respondido 500 pela interceptação ` +
        'deste teste — sem isso a janela do fail-open não é determinística e o resultado não ' +
        'diz nada sobre o defeito',
    ).toBe(500);

    // Pré-condição 2: o formulário APARECEU (o usuário vê a tela e o botão Enviar).
    await formulario.headingFormulario.waitFor({ state: 'visible', timeout: 60_000 }).catch(() => {
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE (ambiente): o iframe não renderizou o heading "Solicitação de ' +
          `Compras" em 60s, então não houve tela onde clicar em Enviar. URL: ${page.url()}`,
      );
    });
    await expect(
      formulario.botaoEnviar,
      'PRÉ-CONDIÇÃO AUSENTE: o botão "Enviar" não está visível — sem ele não há como exercitar ' +
        'o clique prematuro que este caso investiga',
    ).toBeVisible();

    // Pré-condição 3: e a montagem NÃO terminou. É o estado sob teste, afirmado por condição
    // observável (a resposta que fecha a inicialização não chegou), não por tempo.
    expect(
      montagem.concluida,
      'PRÉ-CONDIÇÃO AUSENTE: a montagem do formulário terminou apesar de ' +
        `${DATASET_MATRICULA} ter respondido 500 — o cenário deste caso (clicar em Enviar com o ` +
        'formulário ainda não montado) não chegou a existir nesta execução',
    ).toBe(false);

    // ── A ação: Enviar com o formulário VAZIO e ainda não montado ────────────────────────
    //
    // A escuta da resposta é registrada ANTES do clique: registrá-la depois perderia uma
    // resposta rápida. O par `(resposta, null)` é explícito — "não observada" é um desfecho
    // possível (falha de transporte) e a mensagem da assertion o distingue, em vez de o
    // engolir.
    const respostaDoSend = page
      .waitForResponse((r) => r.request().method() === 'POST' && ROTA_SEND.test(r.url()), {
        timeout: 60_000,
      })
      .then(
        (r) => r,
        () => null,
      );

    await formulario.enviar();

    // Sincronização por condição observável, nunca por tempo: espera o formulário resolver o
    // clique de ALGUMA forma — a requisição de criação saindo (o defeito) ou um diálogo de
    // validação (o comportamento correto). Ler a contagem logo após o clique passaria por
    // acidente, antes de a requisição sair — a armadilha de "contagem lida cedo demais" já
    // registrada no `CLAUDE.md`.
    const dialogoDeValidacao = formulario.dialogErro.or(page.getByRole('dialog'));
    await expect
      .poll(
        async () =>
          startsEnviados.length > 0 || (await dialogoDeValidacao.first().isVisible().catch(() => false)),
        {
          timeout: 45_000,
          message:
            'após o clique em Enviar, o formulário não deu retorno nenhum em 45s: nenhum diálogo ' +
            'de validação e nenhuma requisição de criação. Sem um dos dois não há veredito ' +
            'sobre CT-CMP-07-S1 — o clique pode simplesmente não ter sido registrado',
        },
      )
      .toBe(true);

    // Só espera pela resposta quando uma requisição de fato saiu — não há o que esperar
    // quando o produto se comporta e recusa no cliente.
    const resposta = startsEnviados.length > 0 ? await respostaDoSend : null;
    /** @type {{ status: number, processInstanceId: unknown, corpo: string } | null} */
    let criacao = null;
    if (resposta) {
      const corpo = await resposta.text().catch(() => '');
      /** @type {unknown} */
      let id = null;
      try {
        id = JSON.parse(corpo)?.content?.processInstanceId ?? null;
      } catch {
        // Corpo não-JSON não carrega id de instância. A contagem de tentativas continua sendo
        // o oráculo, e o status entra na mensagem do mesmo jeito — nada é engolido.
        id = null;
      }
      criacao = { status: resposta.status(), processInstanceId: id, corpo: corpo.slice(0, 300) };
      if (id) {
        testInfo.annotations.push({
          type: 'sc-criada',
          description: `${id} (SC de FORMULÁRIO VAZIO criada pelo fail-open — HTTP ${resposta.status()})`,
        });
      }
    }

    // ── O oráculo do caso ────────────────────────────────────────────────────────────────
    expect(
      startsEnviados.length,
      'DEFEITO (fail-open, CT-CMP-07-S1): o Fluig aceitou submeter um formulário de Solicitação ' +
        'de Compras que ainda NÃO terminou de montar — nenhuma validação de cliente rodou e ' +
        `${startsEnviados.length} requisição(ões) de criação saíram para ` +
        `\`${ROTA_SEND.source}\`` +
        descreverDesfechoDoServidor(criacao) +
        '. O esperado é ZERO: enquanto a montagem não termina, o Enviar tem de ficar inerte ' +
        '(ou desabilitado), e submissão de formulário não montado nunca pode ser aceita',
    ).toBe(0);
  });
});
