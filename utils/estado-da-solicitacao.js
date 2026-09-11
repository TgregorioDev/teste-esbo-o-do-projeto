// @ts-check
import { expect } from '@playwright/test';
import { faltaPreCondicao } from './pre-condicao.js';

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
 * Todas as tarefas da solicitação, como a API devolve (`items` de `/requests/{id}/tasks`).
 * Lança quando a leitura em si falha.
 *
 * @param {import('@playwright/test').Page} page página em alguma URL do portal
 * @param {string | number} processInstanceId
 * @returns {Promise<any[]>}
 */
export async function lerTarefas(page, processInstanceId) {
  return page.evaluate(async (id) => {
    const resposta = await fetch(`/process-management/api/v2/requests/${id}/tasks?pageSize=60`, {
      headers: { Accept: 'application/json' },
    });
    if (!resposta.ok) throw new Error(`GET /requests/${id}/tasks respondeu ${resposta.status}`);
    return (await resposta.json()).items ?? [];
  }, String(processInstanceId));
}

/**
 * Campos do formulário da solicitação (`expand=formFields`), como `{ campo: valor }`. Valor nulo
 * vira `''` — "campo ausente" fica `undefined`, e as duas coisas não se confundem.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string | number} processInstanceId
 * @returns {Promise<Record<string, string>>}
 */
export async function lerCamposDoFormulario(page, processInstanceId) {
  return page.evaluate(async (id) => {
    const resposta = await fetch(`/process-management/api/v2/requests/${id}?expand=formFields`, {
      headers: { Accept: 'application/json' },
    });
    if (!resposta.ok) throw new Error(`GET /requests/${id}?expand=formFields respondeu ${resposta.status}`);
    const corpo = await resposta.json();
    return Object.fromEntries(
      (corpo.formFields ?? []).map((/** @type {any} */ c) => [c.field, c.value ?? '']),
    );
  }, String(processInstanceId));
}

/**
 * Espera, por polling no servidor, a solicitação chegar a um estado — e declara PRÉ-CONDIÇÃO de
 * ambiente, com a última leitura, quando o prazo acaba.
 *
 * Só serve onde o prazo estourado é AMBIENTE: a integração com o Protheus que não concluiu, por
 * exemplo. Onde o estado é o próprio comportamento sob teste (o roteamento de uma medição), use
 * `expect.poll` direto como assertion — estourar ali é reprovação, não ambiente.
 *
 * Substitui os laços `while` + `setTimeout` que rodavam dentro de `page.evaluate`: o prazo e a
 * última leitura chegam ao relatório em vez de sumirem dentro do navegador.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string | number} processInstanceId
 * @param {(tarefas: any[]) => boolean} chegou
 * @param {{ timeout: number, oQueSeEspera: string }} opcoes
 * @returns {Promise<any[]>} as tarefas da leitura em que o estado foi alcançado
 */
export async function aguardarEstadoNoServidor(page, processInstanceId, chegou, { timeout, oQueSeEspera }) {
  /** @type {any[]} */
  let tarefas = [];
  let falhaDeLeitura = '';
  try {
    await expect
      .poll(
        async () => {
          try {
            tarefas = await lerTarefas(page, processInstanceId);
            falhaDeLeitura = '';
          } catch (erro) {
            // Esta volta não leu; a próxima tenta de novo, e o motivo vai para a mensagem final.
            falhaDeLeitura = erro instanceof Error ? erro.message.split('\n')[0] : String(erro);
            return false;
          }
          return chegou(tarefas);
        },
        { timeout, intervals: [5_000] },
      )
      .toBe(true);
  } catch {
    const abertas = tarefas.filter((t) => t.status === 'NOT_COMPLETED').map((t) => t.state?.stateName);
    faltaPreCondicao(
      `(ambiente): a solicitação ${processInstanceId} não chegou a ${oQueSeEspera} em ` +
        `${Math.round(timeout / 1000)}s. Última leitura — atividades abertas: ${JSON.stringify(abertas)}` +
        (falhaDeLeitura ? `; a leitura falhou: ${falhaDeLeitura}` : ''),
    );
  }
  return tarefas;
}

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
  const itens = await lerTarefas(page, processInstanceId);

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
 * A SC saiu da integração com o Protheus? Sim quando há tarefa ABERTA com responsável humano —
 * pool (`Pool:Group:…`) ou login: a Validação do Gestor, a Correção ou "Ajustar Informações".
 *
 * ⚠️ "Existe tarefa 'Grava SC e Anexos' COMPLETED" NÃO serve. Medido em 11/09/2026, SC 96487: a 233
 * conclui um primeiro movimento em 1 s e abre um segundo, que segue integrando. Com aquele critério
 * o teste de SLA registrava "levou 1s" com a SC ainda na 233 e sem número no ERP — e passava.
 *
 * @param {any[]} tarefas leitura de `lerTarefas`
 * @returns {boolean}
 */
export function saiuDaIntegracao(tarefas) {
  return tarefas.some(
    (t) => t.status === 'NOT_COMPLETED' && !String(t.assignee?.code ?? '').startsWith('System:'),
  );
}

/**
 * Quanto a integração levou, do jeito que o solicitante percebe: da entrada na 233 até a primeira
 * tarefa humana aberta. Na SC 96474 (11/09/2026) a 233 fecha em 0 s e os 29 s reais ficam num
 * movimento automático seguinte — medir só a 233 dava zero.
 *
 * @param {any[]} tarefas leitura em que `saiuDaIntegracao(tarefas)` é verdadeiro
 * @returns {{ inicio: string, fim: string, segundos: number, atividadesAbertas: string[] }}
 */
export function medirIntegracao(tarefas) {
  const porMovimento = [...tarefas].sort((a, b) => a.movementSequence - b.movementSequence);
  const entrada = porMovimento.find((t) => t.state?.sequence === 233);
  const humana = porMovimento.find(
    (t) => t.status === 'NOT_COMPLETED' && !String(t.assignee?.code ?? '').startsWith('System:'),
  );
  if (!entrada || !humana) {
    throw new Error(
      'medirIntegracao exige uma leitura com a entrada na 233 e uma tarefa humana aberta — ' +
        `movimentos: ${JSON.stringify(porMovimento.map((t) => [t.state?.sequence, t.status]))}`,
    );
  }
  return {
    inicio: entrada.startDate,
    fim: humana.startDate,
    segundos: Math.round((new Date(humana.startDate).getTime() - new Date(entrada.startDate).getTime()) / 1000),
    atividadesAbertas: tarefas.filter((t) => t.status === 'NOT_COMPLETED').map((t) => t.state?.stateName),
  };
}

/**
 * Quanto a integração (atividade 233) levou numa SC — ou há quanto tempo ela segue lá.
 *
 * Diferente de `medirIntegracao`, que serve ao teste de SLA e exige a tarefa humana ABERTA, esta aceita
 * SC já encerrada: a saída é o primeiro movimento depois da entrada na 233 que não é do `System:`, esteja
 * ele aberto ou não. É o que o canário precisa para ler a saúde da integração nas SCs mais recentes da
 * base, de qualquer autor, sem criar nada.
 *
 * * @param {any[]} tarefas leitura em que `saiuDaIntegracao(tarefas)` é verdadeiro
 * @param {Date} [agora] fim da conta quando a SC ainda não saiu
 * @returns {{ segundos: number, saiu: boolean } | null} `null` quando a SC nem passou pela 233
 */
export function duracaoDaIntegracao(tarefas, agora = new Date()) {
  const porMovimento = [...tarefas].sort((a, b) => a.movementSequence - b.movementSequence);
  const entrada = porMovimento.find((t) => t.state?.sequence === 233);
  if (!entrada) return null;
  const saida = porMovimento.find(
    (t) => t.movementSequence > entrada.movementSequence && !String(t.assignee?.code ?? '').startsWith('System:'),
  );
  const fim = saida ? new Date(saida.startDate) : agora;
  return { segundos: Math.round((fim.getTime() - new Date(entrada.startDate).getTime()) / 1000), saiu: Boolean(saida) };
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
