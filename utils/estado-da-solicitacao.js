// @ts-check

/**
 * Estado de uma solicitação lido do SERVIDOR — para CLASSIFICAR o que a tela não mostrou.
 *
 * ## Por que existe
 *
 * Na execução dos destrutivos de 10/09/2026, sete vermelhos diziam que a tela "não confirmou"
 * ou "não abriu" em 30s — e o servidor mostrava que a ação tinha acontecido: SCs criadas com a
 * atividade 233 concluída em 12–17s, tarefa assumida (movimento novo na atividade 7), aprovação
 * registrada e SC já na 14. Os testes reprovavam com `Error` cru, que o gate lê como regressão.
 *
 * ## O que ele NÃO é
 *
 * **Não é oráculo substituto da tela.** O que o usuário vê continua sendo afirmado na tela —
 * trocar a verificação da tela pela do servidor esconderia um Fluig que de fato não confirma
 * nada ao usuário. Este módulo só entra DEPOIS que a tela falhou, para decidir se o vermelho é
 * do ambiente (a ação aconteceu, a tela não chegou a tempo → `faltaPreCondicao` com a evidência)
 * ou do fluxo (a ação não aconteceu → falha de verdade).
 *
 * Sempre `page.evaluate` + `fetch`: `page.request` leva 403 do WAF em `/process-management/**`.
 */

/**
 * @typedef {Object} TarefaPendente
 * @property {number} movimento `movementSequence` da tarefa
 * @property {number} atividade número da atividade no BPMN (ex.: 7 = Validação do Gestor)
 * @property {string} nomeDaAtividade
 * @property {string} responsavel `assignee.code` — login do usuário ou `Pool:Group:<grupo>`
 */

/**
 * Tarefa ainda não concluída da solicitação.
 *
 * Devolve `null` quando não há tarefa pendente (processo encerrado, ou parado numa atividade
 * automática). Lança quando a leitura em si falha — quem chama decide como relatar isso.
 *
 * @param {import('@playwright/test').Page} page página em alguma URL do portal
 * @param {string | number} processInstanceId
 * @returns {Promise<TarefaPendente | null>}
 */
export async function lerTarefaPendente(page, processInstanceId) {
  const itens = await page.evaluate(async (id) => {
    const resposta = await fetch(`/process-management/api/v2/requests/${id}/tasks`, {
      headers: { Accept: 'application/json' },
    });
    if (!resposta.ok) throw new Error(`GET /requests/${id}/tasks respondeu ${resposta.status}`);
    return (await resposta.json()).items ?? [];
  }, String(processInstanceId));

  const pendente = itens.find(
    (/** @type {any} */ t) => t.status !== 'COMPLETED' && t.status !== 'TRANSFERRED',
  );
  if (!pendente) return null;

  return {
    movimento: pendente.movementSequence,
    atividade: pendente.state?.sequence,
    nomeDaAtividade: pendente.state?.stateName ?? '',
    responsavel: pendente.assignee?.code ?? '',
  };
}

/**
 * Lê a tarefa pendente sem deixar a CONSULTA mascarar o erro original: se o servidor não
 * responder (página em navegação, rede do tenant caindo), devolve `undefined` e o motivo, para
 * que quem chama relance o erro da tela com essa informação junto.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string | number} processInstanceId
 * @returns {Promise<{ tarefa: TarefaPendente | null | undefined, motivo: string }>}
 */
export async function consultarTarefaPendente(page, processInstanceId) {
  try {
    return { tarefa: await lerTarefaPendente(page, processInstanceId), motivo: '' };
  } catch (erro) {
    return {
      tarefa: undefined,
      motivo: `servidor não consultado: ${erro instanceof Error ? erro.message.split('\n')[0] : String(erro)}`,
    };
  }
}

/**
 * Descrição curta da tarefa, para mensagens de erro e de pré-condição.
 * @param {TarefaPendente | null | undefined} tarefa
 * @returns {string}
 */
export function descreverTarefa(tarefa) {
  if (tarefa === undefined) return '(servidor não consultado)';
  if (tarefa === null) return 'sem tarefa pendente (processo encerrado ou em atividade automática)';
  return `atividade ${tarefa.atividade} "${tarefa.nomeDaAtividade}", movimento ${tarefa.movimento}, responsável ${tarefa.responsavel}`;
}
