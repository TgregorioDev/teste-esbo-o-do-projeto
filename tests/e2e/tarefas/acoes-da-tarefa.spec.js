// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../../utils/pre-condicao.js';
import { AcoesDaTarefaPage } from '../../../pages/AcoesDaTarefaPage.js';
import { CentralTarefasComprasPage } from '../../../pages/CentralTarefasComprasPage.js';
import { TarefaSolicitacaoCompraPage } from '../../../pages/TarefaSolicitacaoCompraPage.js';
import { criarSolicitacaoCompletaEEnviar } from '../../../pages/PreenchimentoSolicitacaoCompraPage.js';
import { criarProdutoCompra, criarJustificativaDecisao } from '../../../factories/produto-compra.js';
import { envObrigatoria } from '../../../config/ambiente.js';

/**
 * CT-TSK-07-H e CT-TSK-08-H — as ações da tarefa que a suíte nunca exercitou.
 *
 * O menu do rodapé de "Movimentar Solicitação" tem QUATRO saídas: Enviar, Somente salvar,
 * Cancelar Solicitação e Transferir. A suíte inteira só exercitava a primeira. Aqui entram a
 * segunda (rascunho — o que o usuário real usa o dia inteiro para não perder trabalho) e a
 * quarta (transferência — o mecanismo de continuidade quando alguém sai de férias).
 *
 * ## A massa: SC própria, assumida na "Validação do Gestor"
 *
 * Estes dois casos exigem uma tarefa que seja **do próprio usuário**, com `currentMovto > 1` e
 * com **campo editável** para provar persistência. Medido em 27/08/2026, nenhum atalho serve:
 *
 * - `prc_questionario_v2` cria solicitação em ~6s e a tarefa cai no próprio solicitante, mas a
 *   etapa "Acompanhamento Status" **não tem um único campo editável visível** (só `input`
 *   `hidden`), então não há rascunho a salvar; e ao acionar Transferir o servidor responde
 *   *"Não foi encontrado nenhum usuário habilitado para ser movimentada a tarefa Acompanhamento
 *   Status"* — a atividade é atribuída por "Executor Atividade", sem destino alternativo.
 * - `SIGAJURI_Contencioso` nasce em pool de um grupo do jurídico, do qual a conta não participa.
 *
 * Sobra o caminho real: criar a SC pelo formulário clássico e assumi-la no pool "Validação do
 * Gestor Imediato" — a etapa tem `radio` "Aprovar?" + `textarea` "Justificativa" (campo
 * editável, e o rascunho de verdade que o usuário perderia) e um GRUPO por trás, que é o que dá
 * candidatos à transferência.
 *
 * Cada teste cria a SUA SC: solicitação transferida ou movimentada não pode ser reaproveitada,
 * e depender de estado entre testes quebraria a independência.
 *
 * ## Limpeza
 *
 * Automática. `fixtures/fixtures.js` escuta as respostas de `/start` e `/workflowView/send` e
 * registra o `processInstanceId` no livro-razão; `fixtures/global-teardown.js` cancela ao fim
 * da invocação. Vale inclusive para a SC de CT-TSK-08-H **depois de transferida**: a tarefa sai
 * da conta da automação, mas o cancelamento é prerrogativa do REQUISITANTE (medido na skill
 * `cassi-fluig-master`: a 112302 foi cancelada com a tarefa em posse de outro usuário).
 */

/**
 * Login da conta de automação — o `assignee` que a transferência tem de deixar de apontar.
 * Lido do ambiente em tempo de execução (`envObrigatoria` falha alto se faltar), nunca fixado
 * numa constante: é credencial, e vive só em `.env.test`.
 * @returns {string}
 */
function loginDaAutomacao() {
  return envObrigatoria('QA_USERNAME');
}

/** Grupo de pool em que toda SC criada por este formulário estaciona (fallback do gestor). */
const GRUPO_GESTOR_IMEDIATO = /Validação do Gestor Imediato/;

/**
 * Cria uma SC (massa própria do teste) e espera, por condição observável, até que ela chegue
 * assumível ao pool "Validação do Gestor Imediato"; devolve com a tarefa já ASSUMIDA.
 *
 * Equivalente ao helper homônimo de `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js`
 * — mesma técnica e mesmos porquês, aqui reduzido ao que estes dois casos precisam. Entre o
 * Enviar e a tarefa ficar assumível existe uma cadeia de atividades automáticas do BPMN
 * (~76s observados em campo) sem evento de rede estável para aguardar: o polling é sobre a
 * tela de detalhe da PRÓPRIA solicitação (fonte de verdade), não sobre o painel-resumo da
 * Central, que pode vir com contagem de cache desatualizada.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{ massa: ReturnType<typeof criarProdutoCompra>, numeroProcesso: string }>}
 */
async function criarEAssumirNoPoolGestorImediato(page) {
  const massa = criarProdutoCompra();
  const numeroProcesso = await criarSolicitacaoCompletaEEnviar(page, massa);
  const central = new CentralTarefasComprasPage(page);

  try {
    await expect(async () => {
      await central.abrirDetalheDaSolicitacao(numeroProcesso);
      await expect(central.botaoAssumirTarefaAtual()).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 180_000, intervals: [10_000, 15_000, 20_000, 30_000] });
  } catch (erroDePoll) {
    const atividadeObservada = await central.lerNomeAtividadeAtual().catch(() => '(não foi possível ler)');
    faltaPreCondicao(
      `a SC #${numeroProcesso}, criada por este teste, não ficou assumível ` +
        `("Assumir tarefa") em ${GRUPO_GESTOR_IMEDIATO.source} dentro de 180s. Isto NÃO é defeito ` +
        'da ação sob teste (Somente salvar / Transferir) — pode ser lentidão do BPMN acima do ' +
        'observado em campo (~76s), ou a tarefa ter sido assumida por outra execução concorrente ' +
        'que pega a primeira do pool (tests/e2e/tarefas/assumir-tarefa-pool.spec.js). ' +
        `Atividade atual observada: "${atividadeObservada}". ` +
        `Causa do polling: ${erroDePoll instanceof Error ? erroDePoll.message : erroDePoll}`,
    );
  }

  await central.assumirTarefaAtual(numeroProcesso);
  return { massa, numeroProcesso };
}

/**
 * Lê da URL corrente os parâmetros que identificam a tarefa aberta — o Fluig os coloca na
 * navegação ao assumir (`app_ecm_workflowview_currentMovto`, `..._taskUserId`), e é assim que
 * o teste consegue REABRIR a mesma tarefa depois, sem inventar o movto.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {{ processInstanceId: string, currentMovto: string, taskUserId: string }}
 */
function lerIdentificacaoDaTarefa(page) {
  const p = new URL(page.url()).searchParams;
  const processInstanceId = p.get('app_ecm_workflowview_processInstanceId') ?? '';
  const currentMovto = p.get('app_ecm_workflowview_currentMovto') ?? '';
  const taskUserId = p.get('app_ecm_workflowview_taskUserId') ?? '';
  if (!processInstanceId || !currentMovto || !taskUserId) {
    throw new Error(
      'Não foi possível identificar a tarefa a partir da URL da tela de movimentação ' +
        `(${page.url()}) — esperados processInstanceId, currentMovto e taskUserId.`,
    );
  }
  return { processInstanceId, currentMovto, taskUserId };
}

/**
 * Estado da solicitação NO SERVIDOR: etapa corrente e responsável pela tarefa aberta.
 *
 * Duas chamadas porque `expand` aceita **um único valor** por vez neste ambiente (dois
 * devolvem `null` em silêncio), e porque o responsável só aparece na coleção de tarefas.
 * Sempre por `page.evaluate` + `fetch`: `page.request` leva 403 do WAF em
 * `/process-management/api/v2/**`.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number|string} processInstanceId
 * @returns {Promise<{ etapa: string, sequencia: number, movto: number, responsaveis: string[], historico: Array<{ movto: number, etapa: string, status: string, assignee: string }> }>}
 */
async function lerEstadoNoServidor(page, processInstanceId) {
  return page.evaluate(async (id) => {
    const h = { Referer: `${location.origin}/portal/p/1/home` };
    const rMov = await fetch(`/process-management/api/v2/requests/${id}?expand=currentMovements`, {
      credentials: 'include',
      headers: h,
    });
    const jMov = await rMov.json().catch(() => ({}));
    const movimentos = Array.isArray(jMov.currentMovements) ? jMov.currentMovements : [];
    const atual = movimentos.find((/** @type {any} */ m) => m.active === true) ?? movimentos[0] ?? {};

    const rTasks = await fetch(`/process-management/api/v2/requests/${id}/tasks?pageSize=60`, {
      credentials: 'include',
      headers: h,
    });
    const jTasks = await rTasks.json().catch(() => ({}));
    const tarefas = Array.isArray(jTasks.items) ? jTasks.items : [];
    // Só `NOT_COMPLETED` é tarefa EM ABERTO. Medido em 27/08/2026: uma transferência deixa no
    // histórico linhas `TRANSFERRED` — o registro de quem tinha a tarefa antes e para onde ela
    // foi —, e contá-las como abertas faz o responsável ANTIGO parecer ainda responsável
    // (foi exatamente o falso vermelho da primeira execução de CT-TSK-08-H).
    const abertas = tarefas.filter((/** @type {any} */ t) => String(t.status ?? '') === 'NOT_COMPLETED');

    return {
      etapa: String(atual?.state?.stateName ?? atual?.state?.stateDescription ?? '?'),
      sequencia: Number(atual?.state?.sequence ?? -1),
      movto: Number(atual?.movementSequence ?? -1),
      responsaveis: abertas.map((/** @type {any} */ t) =>
        String(t.assignee?.code ?? t.assignee?.login ?? t.colleagueId ?? t.userId ?? '?'),
      ),
      historico: tarefas.map((/** @type {any} */ t) => ({
        movto: Number(t.movementSequence ?? -1),
        etapa: String(t.state?.stateName ?? '?'),
        status: String(t.status ?? '?'),
        assignee: String(t.assignee?.code ?? '?'),
      })),
    };
  }, processInstanceId);
}

test.describe('Ações da tarefa — Somente salvar e Transferir (CT-TSK-07/08)', () => {
  /**
   * CT-TSK-07-H — "Somente salvar" salva sem movimentar.
   *
   * As duas metades importam, e por isso são duas assertions distintas: **salvar que perde** é
   * defeito (o usuário perde o preenchimento de um formulário de 20 campos, e a tela confirmou
   * o salvamento); **salvar que movimenta** é defeito igual (a tarefa some da mão de quem
   * estava trabalhando nela).
   */
  test('CT-TSK-07-H @destrutivo — "Somente salvar" deve persistir o rascunho sem movimentar a atividade', async ({
    page,
  }, testInfo) => {
    // Criar a SC (quatro combos assíncronos + anexo) + aguardar a cadeia automática do BPMN
    // (~76s) + assumir + salvar + reabrir: legitimamente mais longo que o timeout padrão.
    testInfo.setTimeout(420_000);

    const { numeroProcesso } = await criarEAssumirNoPoolGestorImediato(page);
    testInfo.annotations.push({
      type: 'sc-criada',
      description: `numeroProcesso=${numeroProcesso} (massa própria de CT-TSK-07-H)`,
    });

    const tarefa = lerIdentificacaoDaTarefa(page);
    const antes = await lerEstadoNoServidor(page, numeroProcesso);
    testInfo.annotations.push({
      type: 'estado-antes-do-salvar',
      description: JSON.stringify({ ...tarefa, etapa: antes.etapa, sequencia: antes.sequencia, responsaveis: antes.responsaveis }),
    });

    const formularioDaEtapa = new TarefaSolicitacaoCompraPage(page);
    const acoes = new AcoesDaTarefaPage(page);

    const rascunho = criarJustificativaDecisao('rascunho');
    const campo = formularioDaEtapa.campoJustificativaGestor();
    await campo.waitFor({ state: 'visible' });
    // Convergência sobre estado observável: a seção da etapa re-renderiza depois de montada
    // (armadilha já paga em `CentralTarefasComprasPage.decidirEEnviar`), e um `fill` aplicado
    // no meio disso se perde.
    await expect(async () => {
      if ((await campo.inputValue()) !== rascunho) await campo.fill(rascunho);
      await expect(campo).toHaveValue(rascunho, { timeout: 2_000 });
    }).toPass({ timeout: 30_000, intervals: [500, 1_000, 2_000, 5_000] });

    const resposta = await acoes.somenteSalvar();
    const corpoSalvar = await resposta.text();
    testInfo.annotations.push({
      type: 'resposta-somente-salvar',
      description: `HTTP ${resposta.status()} — ${corpoSalvar.slice(0, 200)}`,
    });
    expect(
      resposta.status(),
      '"Somente salvar" deveria ser aceito pelo servidor — é a ação de rascunho, o usuário ' +
        `ainda não terminou de decidir. Resposta: HTTP ${resposta.status()} — ${corpoSalvar.slice(0, 300)}`,
    ).toBe(200);
    await expect(
      acoes.dialogErro,
      'nenhum diálogo de erro deveria aparecer ao salvar um rascunho',
    ).toHaveCount(0);

    // "Recarregar a página e reabrir a tarefa": navegação nova para a MESMA tarefa, não um
    // `reload()` — o que se quer provar é que o rascunho está no SERVIDOR, não na página.
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
    await acoes.abrirTarefa({ ...tarefa, processInstanceId: numeroProcesso });

    const campoReaberto = new TarefaSolicitacaoCompraPage(page).campoJustificativaGestor();
    await expect(
      campoReaberto,
      `o rascunho salvo em "Somente salvar" deveria estar lá ao reabrir a tarefa da SC ` +
        `#${numeroProcesso}. Se sumiu, o usuário perde o preenchimento depois de a tela ter ` +
        'confirmado o salvamento — falha silenciosa, o pior desfecho possível para esta ação',
    ).toHaveValue(rascunho, { timeout: 60_000 });

    // Segunda metade: salvar NÃO pode movimentar.
    const depois = await lerEstadoNoServidor(page, numeroProcesso);
    testInfo.annotations.push({
      type: 'estado-depois-do-salvar',
      description: JSON.stringify({ etapa: depois.etapa, sequencia: depois.sequencia, responsaveis: depois.responsaveis }),
    });
    expect(
      { etapa: depois.etapa, sequencia: depois.sequencia },
      `"Somente salvar" não pode movimentar a atividade: a SC #${numeroProcesso} tem de seguir ` +
        `em "${antes.etapa}" (sequência ${antes.sequencia}). Observado: "${depois.etapa}" ` +
        `(sequência ${depois.sequencia})`,
    ).toEqual({ etapa: antes.etapa, sequencia: antes.sequencia });
    expect(
      depois.responsaveis,
      `o responsável pela tarefa não pode mudar ao salvar um rascunho (antes: ` +
        `${JSON.stringify(antes.responsaveis)}, depois: ${JSON.stringify(depois.responsaveis)})`,
    ).toEqual(antes.responsaveis);
  });

  /**
   * CT-TSK-08-H — Transferir atividade.
   *
   * ⚠️ **Irreversível, e é o ponto do caso.** Depois de transferida, a tarefa não é mais da
   * conta da automação e não há devolução por ela (a mensagem do servidor para quem tenta
   * movimentar depois é *"Esta tarefa não está mais sob sua responsabilidade!"*). O resíduo
   * continua GERENCIÁVEL porque cancelar é prerrogativa do REQUISITANTE, não do dono da
   * tarefa: o `global-teardown` cancela a SC no fim da invocação e a tarefa transferida
   * desaparece da caixa do destinatário junto com ela. Enquanto a execução dura, o destino
   * recebe uma tarefa `QA` — é o custo assimétrico registrado no catálogo, e por isso o destino
   * é DESCOBERTO em execução (nunca um login fixado em constante).
   *
   * ## Como a transferência funciona aqui (medido em 27/08/2026)
   *
   * O rótulo do menu promete "Selecione um usuário para transferir a tarefa", mas o clique
   * **já dispara a transferência**: sai um `POST .../workflowView/send` com `completeTask: false`
   * (auto-save do formulário) e, na sequência, outro com `completeTask: true` e
   * `selectedColleague: []` — quem escolhe o destino é o SERVIDOR, pelo mecanismo de atribuição
   * da própria atividade. A prova é a stack de uma recusa capturada em campo:
   * `BPMUserResponsibleNotInformedException ... WorkflowEngine.transferTask(WorkflowEngine.java:3849)`
   * — *"Não foi encontrado nenhum usuário habilitado para ser movimentada a tarefa
   * Acompanhamento Status. Verifique o mecanismo de atribuição: Executor Atividade"* (é o que
   * acontece numa atividade cujo executor é o próprio solicitante: não há para quem transferir).
   *
   * Numa atividade atribuída a GRUPO — o caso da "Validação do Gestor" — há destino, e o
   * histórico de tarefas confirma o efeito: a tarefa fica com `status: TRANSFERRED` e o
   * `assignee` passa de `TOTVS-FS` para `Pool:Group:G.P.Requisicao_de_Compras_Gestor_Imediato`,
   * na MESMA atividade (medido na 112097). Por isso a assertion é sobre o par
   * *(atividade preservada, responsável trocado)*, lido do servidor — e não sobre um nome de
   * usuário escolhido numa tela que este produto não chega a oferecer.
   */
  test('CT-TSK-08-H @destrutivo — transferir deve trocar o responsável mantendo a mesma atividade', async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(420_000);

    const { numeroProcesso } = await criarEAssumirNoPoolGestorImediato(page);
    testInfo.annotations.push({
      type: 'sc-criada',
      description: `numeroProcesso=${numeroProcesso} (massa própria de CT-TSK-08-H)`,
    });

    const antes = await lerEstadoNoServidor(page, numeroProcesso);
    testInfo.annotations.push({
      type: 'estado-antes-da-transferencia',
      description: JSON.stringify({ etapa: antes.etapa, sequencia: antes.sequencia, movto: antes.movto, responsaveis: antes.responsaveis }),
    });
    expect(
      antes.responsaveis,
      `pré-condição do caso: a tarefa tem de estar sob responsabilidade da conta da automação ` +
        `antes de transferir (responsáveis lidos: ${JSON.stringify(antes.responsaveis)})`,
    ).toContain(loginDaAutomacao());
    expect(
      antes.movto,
      `pré-condição do caso: \`currentMovto > 1\` (movto lido: ${antes.movto}) — é o que faz a ` +
        'opção Transferir existir para a tarefa',
    ).toBeGreaterThan(1);

    const acoes = new AcoesDaTarefaPage(page);
    await acoes.acionarTransferir();

    // Diagnóstico anexado ao relatório: sem ele, "a transferência não aconteceu" e "aconteceu
    // por um caminho de UI diferente do medido" produzem exatamente a mesma falha opaca.
    const diagnostico = await page.evaluate(() => ({
      dialogos: [...document.querySelectorAll('[role=dialog]')].map((d) =>
        (d.textContent ?? '').replace(/\s+/g, ' ').slice(0, 400),
      ),
      inputsVisiveis: [...document.querySelectorAll('input, select, textarea')]
        .filter((e) => /** @type {HTMLElement} */ (e).offsetParent !== null)
        .map((e) => ({ id: e.id, nome: /** @type {any} */ (e).name, placeholder: /** @type {any} */ (e).placeholder })),
      botoesVisiveis: [...document.querySelectorAll('button')]
        .filter((e) => e.offsetParent !== null)
        .map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim())
        .filter(Boolean),
    }));
    await testInfo.attach('tela-apos-acionar-transferir', {
      body: JSON.stringify(diagnostico, null, 2),
      contentType: 'application/json',
    });

    const textoDoErro = await acoes.dialogErro
      .innerText({ timeout: 5_000 })
      .then((t) => t.replace(/\s+/g, ' ').trim())
      .catch(() => '');
    expect(
      textoDoErro,
      `acionar "Transferir" numa tarefa do próprio usuário, em "${antes.etapa}" (movto ` +
        `${antes.movto} > 1), não deveria recusar: a atividade é atribuída a um GRUPO, então há ` +
        `destino habilitado. Mensagem exibida ao usuário: "${textoDoErro}"`,
    ).toBe('');

    // A confirmação vem do SERVIDOR. A transferência é assíncrona do ponto de vista da tela:
    // espera-se pela CONDIÇÃO (o responsável mudou), nunca por tempo fixo.
    /** @type {Awaited<ReturnType<typeof lerEstadoNoServidor>>} */
    let depois = antes;
    try {
      await expect(async () => {
        depois = await lerEstadoNoServidor(page, numeroProcesso);
        expect(depois.responsaveis).not.toEqual(antes.responsaveis);
      }).toPass({ timeout: 90_000, intervals: [3_000, 5_000, 10_000] });
    } catch {
      throw new Error(
        `"Transferir" não trocou o responsável da tarefa da SC #${numeroProcesso} em 90s. ` +
          `Antes: ${JSON.stringify(antes.responsaveis)} — agora: ${JSON.stringify(depois.responsaveis)}. ` +
          'Ou a ação não teve efeito (defeito: a tarefa fica presa com quem não pode mais ' +
          'tratá-la), ou a tela passou a oferecer uma escolha de destino que este teste não ' +
          'preenche — o anexo "tela-apos-acionar-transferir" do relatório distingue os dois casos.',
      );
    }

    testInfo.annotations.push({
      type: 'estado-depois-da-transferencia',
      description: JSON.stringify({
        etapa: depois.etapa,
        sequencia: depois.sequencia,
        responsaveis: depois.responsaveis,
        historicoDaEtapa: depois.historico.filter((t) => t.movto === antes.movto),
      }),
    });

    // Metade 1: a solicitação NÃO pode andar. Transferir é troca de responsável, não decisão.
    expect(
      { etapa: depois.etapa, sequencia: depois.sequencia },
      `transferir não pode movimentar a solicitação: a SC #${numeroProcesso} tem de seguir em ` +
        `"${antes.etapa}" (sequência ${antes.sequencia}). Observado: "${depois.etapa}" ` +
        `(sequência ${depois.sequencia})`,
    ).toEqual({ etapa: antes.etapa, sequencia: antes.sequencia });

    // Metade 2: o responsável passou a ser OUTRO — e a tarefa saiu mesmo da conta da automação.
    // É aqui que se pega o risco concreto do caso: "a tarefa some para os dois lados".
    expect(
      depois.responsaveis.length,
      `depois de transferida, a tarefa tem de continuar existindo com um responsável — se ela ` +
        'sumir dos dois lados (nenhuma tarefa aberta), o trabalho ficou órfão. ' +
        `Responsáveis lidos: ${JSON.stringify(depois.responsaveis)}`,
    ).toBeGreaterThan(0);
    expect(
      depois.responsaveis,
      `depois de transferida, a tarefa não pode continuar com a conta que a transferiu ` +
        `(${loginDaAutomacao()}). Responsáveis lidos: ${JSON.stringify(depois.responsaveis)}`,
    ).not.toContain(loginDaAutomacao());
  });
});
