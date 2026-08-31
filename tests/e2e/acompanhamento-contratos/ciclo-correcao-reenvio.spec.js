// @ts-check
import { randomUUID } from 'node:crypto';
import { test, expect } from '../../../fixtures/fixtures.js';
import { descobrirContratoVigente } from '../../../utils/massa-contratos.js';
import { criarSolicitacaoCompra, QUALQUER_TIPO_VALIDO } from '../../../factories/solicitacao-compra.js';
import { capturarEnvioSolicitacao } from '../../../utils/captura-payload.js';
import { criarJustificativaDecisao } from '../../../factories/produto-compra.js';
import { TarefaSolicitacaoCompraPage } from '../../../pages/TarefaSolicitacaoCompraPage.js';
import { envObrigatoria } from '../../../config/ambiente.js';

/**
 * CT-CMP-08-H — fechar o ciclo de retorno: reprovação → Correção → reenvio.
 *
 * ## O buraco que este caso tapa
 *
 * `CT-E2E-02-S1` e `CT-CMP-04-S1` provam que a reprovação **devolve** a SC. Ninguém provava
 * que dá para **corrigir e reenviar** — metade do processo estava sem oráculo. É o exemplo
 * canônico de "fluxo que a suíte toca mas não fecha".
 *
 * **Risco concreto:** o solicitante reprovado fica com a SC presa; os dados do contrato se
 * perdem no retorno; ou o reenvio volta para o Início em vez do Gestor. É defeito de altíssimo
 * impacto operacional, vizinho direto do D-01 (que é exatamente um problema de
 * para-onde-a-tarefa-vai).
 *
 * ## Por que este teste NÃO usa o caminho do widget
 *
 * O D-01 prende no marco "Início" toda SC criada pelo widget do Portal de Contratos
 * (`targetState: 6`, `targetAssignee: consumerkeycompras`) — o cenário deste caso simplesmente
 * não existe por ali. A saída, medida e registrada na skill `cassi-fluig-master`, é o **start
 * corrigido**: o MESMO payload que o widget monta, com `targetState: 0` (o gateway) em vez de
 * `6`. Medido em 27/08/2026, SC 112762:
 *
 * ```
 * mov1 294:Compra Centralizada?  COMPLETED     TOTVS-FS
 * mov2 233:Grava SC e Anexos     COMPLETED     System:Auto
 * mov3 7:Validação do Gestor     COMPLETED     System:Auto
 * mov4 7:Validação do Gestor     NOT_COMPLETED Pool:Group:G.P.Requisicao_de_Compras_Gestor_Imediato
 * ```
 *
 * — ou seja, a SC chega ao pool do Gestor Imediato em ~75s. O payload é capturado do widget
 * (e **abortado**, sem criar nada) e reenviado por `fetch` de dentro da página, porque só ali
 * ele herda o `Authorization: Bearer` do cookie `jwt.token` — sem esse header o gateway
 * responde 403 antes de olhar o corpo (técnica já usada em `criacao-solicitacao.spec.js`).
 *
 * ## O que foi medido do ciclo de retorno (27/08/2026, SC 112762)
 *
 * - **Assumir do pool pela API funciona**: `POST /api/public/2.0/workflows/assumeProcessTasks`
 *   responde `successCount: 1` e a tarefa passa de `Pool:Group:...` para `TOTVS-FS`.
 * - **Abrir a tarefa exige a URL completa** (`currentMovto` + `taskUserId` + `managerMode`).
 *   Só com o `processInstanceId` o Fluig devolve *"Esta tarefa não está mais sob sua
 *   responsabilidade!"* mesmo com a tarefa comprovadamente sua — ver
 *   `TarefaSolicitacaoCompraPage.abrirTarefaAtribuida`.
 * - **A reprovação devolve para `11:Ajustar Informações`** (não para a etapa 236 "Correção"
 *   que o catálogo cita), com o próprio solicitante.
 * - **O reenvio a partir dali foi RECUSADO**: *"Existem campos de rateio sem preenchimento.
 *   Preencha todos os campos e tente novamente."* — numa SC cujo rateio veio do contrato e
 *   nunca foi tocado por ninguém. É o defeito que este teste documenta.
 *
 * ⚠️ **Vermelho intencional** enquanto o reenvio não fechar o ciclo. Não ajuste a assertion:
 * quando o produto permitir corrigir e reenviar, o teste fica verde sozinho.
 *
 * ## Custo
 *
 * `@destrutivo`, e é o caso mais caro da lista: uma SC criada, ~4 movimentações e uma **tarefa
 * assumida de pool que não tem devolução** (confirmado por menu, por bundle e pela ausência de
 * inverso da API). O resíduo na caixa "Tarefas a concluir" é custo do cenário, não algo a
 * desfazer no teardown — que cancela a solicitação normalmente pelo livro-razão.
 */

/** `targetState` do gateway "Compra Centralizada?" — a correção comprovada do D-01. */
const TARGET_STATE_GATEWAY = 0;

/** Etapa em que a SC deve esperar o Gestor Imediato. */
const ETAPA_GESTOR = 'Validação do Gestor';

/** Pool do Gestor Imediato. */
const POOL_GESTOR = 'Pool:Group:G.P.Requisicao_de_Compras_Gestor_Imediato';

/**
 * Etapas aceitáveis para o retorno ao solicitante depois da reprovação. São duas porque o BPMN
 * tem as duas: `11:Ajustar Informações` (medida em campo) e `236:Correção` (a que o catálogo
 * cita). O que o caso exige é que a SC volte para UMA delas COM O SOLICITANTE — não qual das
 * duas.
 */
const ETAPAS_DE_CORRECAO = ['Ajustar Informações', 'Correção'];

/**
 * @typedef {Object} EstadoDaSolicitacao
 * @property {string} status `OPEN` / `FINALIZED` / `CANCELED`
 * @property {{ movimento: number, sequencia: number, etapa: string, responsavel: string } | null} tarefaCorrente
 * @property {string[]} historico uma linha por tarefa, na ordem em que o servidor devolve
 * @property {Record<string, string>} campos `formFields` achatado em `campo -> valor`
 */

/**
 * Lê do servidor o estado completo de uma solicitação.
 *
 * ⚠️ `page.evaluate` + `fetch`, nunca `page.request`: o WAF do TOTVS Cloud devolve 403 para
 * `/process-management/api/v2/**` sem `User-Agent` de navegador e `Referer` do portal.
 * ⚠️ `expand` aceita **um único valor** por chamada — dois devolvem tudo `null` em silêncio.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} processInstanceId
 * @returns {Promise<EstadoDaSolicitacao>}
 */
async function lerEstado(page, processInstanceId) {
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

    const itens = tarefas?.items ?? [];
    const corrente = itens.find((/** @type {any} */ t) => t.status === 'NOT_COMPLETED') ?? null;

    return {
      status: String(movimentos?.status ?? '?'),
      tarefaCorrente: corrente
        ? {
            movimento: Number(corrente.movementSequence),
            sequencia: Number(corrente.state?.sequence),
            etapa: String(corrente.state?.stateName ?? ''),
            responsavel: String(corrente.assignee?.code ?? ''),
          }
        : null,
      historico: itens.map(
        (/** @type {any} */ t) =>
          `mov${t.movementSequence}|${t.state?.sequence}:${t.state?.stateName}|${t.status}|${t.assignee?.code}`,
      ),
      campos,
    };
  }, processInstanceId);
}

/**
 * Dispara o start da SC direto no servidor, com o payload do widget corrigido.
 *
 * O `fetch` roda no contexto da própria página porque só assim herda o
 * `Authorization: Bearer <jwt.token>` que o gateway exige — mesma técnica de
 * `criacao-solicitacao.spec.js` (CT-ACC-04-S6).
 *
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, any>} payload
 * @returns {Promise<{ status: number, corpo: string }>}
 */
async function dispararStartCorrigido(page, payload) {
  return page.evaluate(async (corpo) => {
    const jwt = document.cookie
      .split('; ')
      .find((c) => c.startsWith('jwt.token='))
      ?.split('=')[1];
    const resposta = await fetch('/process-management/api/v2/processes/wf_solicitacao_compras/start', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: jwt ? `Bearer ${jwt}` : '',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(corpo),
    });
    return { status: resposta.status, corpo: (await resposta.text()).slice(0, 800) };
  }, payload);
}

/**
 * Assume a tarefa do pool pela API pública.
 *
 * Pela API, e não pela Central de Tarefas, por uma razão medida: a listagem da Central pagina
 * por cursor com `rows=15` em ordem CRESCENTE de `processInstanceId`, e a tarefa recém-criada
 * — que tem o maior id — fica fora do lote renderizado (é a armadilha documentada em
 * `utils/central-tarefas-paginacao.js`). Dirigir a tela aqui mediria a paginação, não o ciclo
 * de retorno.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ processInstanceId: number, movimento: number, login: string }} tarefa
 * @returns {Promise<{ status: number, sucesso: number, corpo: string }>}
 */
async function assumirTarefaDoPool(page, { processInstanceId, movimento, login }) {
  return page.evaluate(async ({ processInstanceId, movimento, login }) => {
    const resposta = await fetch('/api/public/2.0/workflows/assumeProcessTasks', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assumeProcessTaskList: [{ colleagueId: login, processInstanceId, movementSequence: movimento }],
      }),
    });
    const corpo = await resposta.text();
    /** @type {number} */
    let sucesso = 0;
    try {
      sucesso = Number(JSON.parse(corpo)?.content?.successCount ?? 0);
    } catch {
      // Corpo não-JSON: `sucesso: 0` é a leitura correta, e o corpo cru vai para a mensagem.
      sucesso = 0;
    }
    return { status: resposta.status, sucesso, corpo: corpo.slice(0, 400) };
  }, { processInstanceId, movimento, login });
}

/**
 * Espera, por condição observável no servidor, a solicitação chegar a uma etapa esperada.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} processInstanceId
 * @param {{ etapas: string[], timeout: number, oQueSeEsperava: string }} criterio
 * @returns {Promise<EstadoDaSolicitacao>}
 */
async function esperarEtapa(page, processInstanceId, { etapas, timeout, oQueSeEsperava }) {
  /** @type {{ ultimo: EstadoDaSolicitacao | null }} */
  const observado = { ultimo: null };

  await expect(async () => {
    observado.ultimo = await lerEstado(page, processInstanceId);
    expect(
      etapas.includes(observado.ultimo.tarefaCorrente?.etapa ?? ''),
      `SC ${processInstanceId}: ${oQueSeEsperava}. Estado atual: ` +
        `"${observado.ultimo.tarefaCorrente?.etapa ?? '(nenhuma tarefa em aberto)'}" com ` +
        `"${observado.ultimo.tarefaCorrente?.responsavel ?? '—'}" (status ${observado.ultimo.status}). ` +
        `Histórico: ${JSON.stringify(observado.ultimo.historico)}`,
    ).toBe(true);
  }).toPass({ timeout, intervals: [5_000, 5_000, 10_000, 15_000] });

  return /** @type {EstadoDaSolicitacao} */ (observado.ultimo);
}

test.describe('Ciclo de retorno da SC: reprovação → Correção → reenvio (CT-CMP-08-H)', () => {
  test('CT-CMP-08-H @destrutivo — reprovada e corrigida, a SC deveria voltar para a Validação do Gestor com o contrato de origem íntegro', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }, testInfo) => {
    // Quatro movimentações, duas delas com etapas de serviço que levam ~75s cada. É o caso
    // mais caro da suíte e o orçamento reflete isso — não é folga para esconder falha.
    testInfo.setTimeout(600_000);

    const login = envObrigatoria('QA_USERNAME');
    const sufixo = randomUUID().slice(0, 8);

    // ── 1. Massa própria, a partir de um contrato descoberto em tempo de execução ────────
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    const contrato = await descobrirContratoVigente(contratosPage);
    await contratosPage.filtrarPorContrato(contrato.contrato);
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();
    await solicitacaoModal.preencher(criarSolicitacaoCompra({ tipo: QUALQUER_TIPO_VALIDO }));

    // Captura o payload genuíno do widget como TEMPLATE. `capturarEnvioSolicitacao` ABORTA a
    // requisição: nada é criado aqui.
    const captura = await capturarEnvioSolicitacao(page);
    await solicitacaoModal.confirmar();
    const template = await captura.aguardarPayload(0);
    expect(captura.tentativas(), 'o widget deveria ter disparado exatamente um start').toBe(1);
    await solicitacaoModal.botaoFechar.click();

    // Sem remover a interceptação, o start corrigido abaixo também seria abortado.
    await page.unroute('**/process-management/**');

    // ── 2. Start corrigido: mesmo payload, `targetState` do gateway ─────────────────────
    const payload = JSON.parse(JSON.stringify(template));
    payload.targetState = TARGET_STATE_GATEWAY;

    const criacao = await dispararStartCorrigido(page, payload);
    expect(
      criacao.status,
      'PRÉ-CONDIÇÃO AUSENTE: o start corrigido não foi aceito, então o ciclo de retorno não ' +
        `chega a existir nesta execução. Resposta: ${criacao.corpo}`,
    ).toBe(200);

    const processInstanceId = Number(JSON.parse(criacao.corpo)?.processInstanceId);
    expect(
      Number.isFinite(processInstanceId) && processInstanceId > 0,
      `PRÉ-CONDIÇÃO AUSENTE: o start corrigido respondeu 200 sem processInstanceId. Corpo: ${criacao.corpo}`,
    ).toBe(true);
    testInfo.annotations.push({ type: 'sc-criada', description: String(processInstanceId) });

    // ── 3. A SC chega ao pool do Gestor Imediato ────────────────────────────────────────
    const noGestor = await esperarEtapa(page, processInstanceId, {
      etapas: [ETAPA_GESTOR],
      timeout: 180_000,
      oQueSeEsperava:
        `deveria chegar a "${ETAPA_GESTOR}" depois do start corrigido (percorrendo "Compra ` +
        'Centralizada?" e "Grava SC e Anexos"), em até 180s',
    });
    expect(
      noGestor.tarefaCorrente?.responsavel,
      `SC ${processInstanceId}: a validação do gestor deveria nascer no pool do Gestor Imediato`,
    ).toBe(POOL_GESTOR);

    // Guarda os dados do contrato como o servidor os gravou, ANTES de qualquer movimentação —
    // é contra isto que a integridade do fim do teste é comparada.
    const contratoNoStart = {
      nrContrato: noGestor.campos.nrContrato,
      revisaContrato: noGestor.campos.revisaContrato,
      codFilial: noGestor.campos.codFilial,
      itens: Object.keys(noGestor.campos).filter((campo) => /^tbprod_codigo___\d+$/.test(campo)).length,
    };
    expect(
      contratoNoStart.nrContrato,
      `PRÉ-CONDIÇÃO AUSENTE: a SC ${processInstanceId} nasceu sem número de contrato, então não ` +
        'há integridade de origem para verificar no fim do ciclo',
    ).toBe(contrato.contrato);

    // ── 4. Assumir do pool e REPROVAR ───────────────────────────────────────────────────
    const assumida = await assumirTarefaDoPool(page, {
      processInstanceId,
      movimento: /** @type {number} */ (noGestor.tarefaCorrente?.movimento),
      login,
    });
    expect(
      assumida.sucesso,
      `PRÉ-CONDIÇÃO AUSENTE: não foi possível assumir a tarefa do pool ${POOL_GESTOR} ` +
        `(HTTP ${assumida.status}). Sem assumir, não há como reprovar. Resposta: ${assumida.corpo}`,
    ).toBe(1);

    const comOGestor = await esperarEtapa(page, processInstanceId, {
      etapas: [ETAPA_GESTOR],
      timeout: 60_000,
      oQueSeEsperava: 'depois de assumida, a tarefa deveria continuar na Validação do Gestor',
    });
    expect(
      comOGestor.tarefaCorrente?.responsavel,
      `SC ${processInstanceId}: depois de assumida, a tarefa deveria estar com ${login}`,
    ).toBe(login);

    const tarefa = new TarefaSolicitacaoCompraPage(page);
    await tarefa.abrirTarefaAtribuida({
      processInstanceId,
      movimento: /** @type {number} */ (comOGestor.tarefaCorrente?.movimento),
      login,
    });
    await tarefa.reprovar(criarJustificativaDecisao(`reprovacao-gestor-${sufixo}`));

    // ── 5. A SC volta para a etapa de correção, COM O SOLICITANTE ───────────────────────
    const naCorrecao = await esperarEtapa(page, processInstanceId, {
      etapas: ETAPAS_DE_CORRECAO,
      timeout: 120_000,
      oQueSeEsperava:
        `reprovada, deveria voltar para uma etapa de correção (${ETAPAS_DE_CORRECAO.join(' ou ')}) ` +
        'para o solicitante ajustar — ficar parada na Validação do Gestor, seguir adiante no ' +
        'fluxo ou voltar ao "Início" seriam três defeitos diferentes, e todos prendem a SC',
    });
    expect(
      naCorrecao.tarefaCorrente?.responsavel,
      `SC ${processInstanceId}: a tarefa de correção deveria ficar com o SOLICITANTE (${login}) — ` +
        'é ele quem tem de ajustar o que o gestor reprovou',
    ).toBe(login);

    // ── 6. Abrir a correção, alterar um campo identificável e REENVIAR ──────────────────
    await tarefa.abrirTarefaAtribuida({
      processInstanceId,
      movimento: /** @type {number} */ (naCorrecao.tarefaCorrente?.movimento),
      login,
    });

    const justificativaCorrigida = `QA-CORR-${sufixo}`;
    const campoJustificativa = tarefa.frame
      .locator('textarea[name^="motivoSolCompra"], input[name^="motivoSolCompra"], #motivoSolCompra')
      .first();

    // Se a tarefa de correção não deixa NADA ser corrigido, o ciclo de retorno já morreu aqui:
    // o solicitante recebe a SC de volta e não tem o que fazer com ela.
    await expect(
      campoJustificativa,
      `SC ${processInstanceId}: a tarefa "${naCorrecao.tarefaCorrente?.etapa}" deveria permitir ` +
        'editar a Justificativa da Solicitação — é o campo que o gestor mandou corrigir. Se ele ' +
        'não é editável, o retorno é um beco sem saída: a SC volta ao solicitante e não há o que ' +
        'ajustar',
    ).toBeEditable({ timeout: 45_000 });
    await campoJustificativa.fill(justificativaCorrigida);

    await tarefa.botaoEnviar.click();

    // ── 7. Depois do reenvio: de volta ao Gestor, com tudo íntegro ──────────────────────
    //
    // Primeiro o desfecho IMEDIATO: o Fluig recusa a movimentação num diálogo de erro. Olhar
    // para ele antes de esperar a etapa não é atalho — é o que separa "o fluxo demorou" de "o
    // produto recusou", e evita gastar 180s de espera por uma etapa que o servidor já disse
    // que não vai acontecer. Medido em 27/08/2026 (SC 112769): a recusa aparece em segundos.
    const dialogoDeErro = page.locator('.container-modal').filter({ hasText: 'Erro' }).first();
    const recusou = await dialogoDeErro.waitFor({ state: 'visible', timeout: 30_000 }).then(
      () => true,
      () => false,
    );

    if (recusou) {
      const texto = (await dialogoDeErro.innerText().catch(() => '(texto indisponível)'))
        .replace(/\s+/g, ' ')
        .trim();
      const estado = await lerEstado(page, processInstanceId);
      throw new Error(
        `DEFEITO (CT-CMP-08-H): a SC ${processInstanceId} não pode ser reenviada depois de ` +
          `corrigida. O Fluig RECUSOU a movimentação da etapa ` +
          `"${naCorrecao.tarefaCorrente?.etapa}" com: "${texto}". A SC continua em ` +
          `"${estado.tarefaCorrente?.etapa}" com "${estado.tarefaCorrente?.responsavel}" — ou ` +
          'seja, o caminho de retorno é um beco sem saída: o gestor reprova, a solicitação volta ' +
          'para o solicitante e ele não consegue devolvê-la ao fluxo. ' +
          `Histórico: ${JSON.stringify(estado.historico)}`,
      );
    }

    // Sem recusa imediata, o desfecho é a etapa — e aí a espera longa se justifica, porque a
    // volta ao Gestor passa por etapas de serviço que levam ~75s.
    /** @type {{ estado: EstadoDaSolicitacao | null }} */
    const reenvio = { estado: null };
    reenvio.estado = await esperarEtapa(page, processInstanceId, {
      etapas: [ETAPA_GESTOR],
      timeout: 180_000,
      oQueSeEsperava:
        `corrigida e reenviada, deveria voltar para "${ETAPA_GESTOR}" — nunca para o marco de ` +
        '"Início" e nunca ficar presa na correção',
    });

    const estadoFinal = /** @type {EstadoDaSolicitacao} */ (reenvio.estado);

    expect(
      estadoFinal.campos.motivoSolCompra,
      `SC ${processInstanceId}: a justificativa corrigida não persistiu depois do reenvio — o ` +
        'ajuste que o solicitante fez foi perdido no caminho de volta',
    ).toBe(justificativaCorrigida);

    expect(
      {
        nrContrato: estadoFinal.campos.nrContrato,
        revisaContrato: estadoFinal.campos.revisaContrato,
        codFilial: estadoFinal.campos.codFilial,
        itens: Object.keys(estadoFinal.campos).filter((campo) => /^tbprod_codigo___\d+$/.test(campo)).length,
      },
      `SC ${processInstanceId}: os dados do contrato de origem mudaram na ida e volta pela ` +
        'correção. Nº do contrato, revisão, filial e a quantidade de itens têm de sair da ' +
        'correção iguais aos do start — divergência aqui é compra errada chegando ao Protheus',
    ).toEqual(contratoNoStart);

    // O histórico é a prova de que a SC realmente passou pela correção, e não voltou ao Gestor
    // por outro caminho (um reprocessamento, por exemplo).
    expect(
      estadoFinal.historico.filter((linha) =>
        ETAPAS_DE_CORRECAO.some((etapa) => linha.includes(`:${etapa}|`)),
      ),
      `SC ${processInstanceId}: o histórico não registra a passagem pela etapa de correção. ` +
        `Histórico completo: ${JSON.stringify(estadoFinal.historico)}`,
    ).not.toEqual([]);
  });
});
