// @ts-check
import { faltaPreCondicao } from '../utils/pre-condicao.js';

/** Rota de abertura/movimentação de processo por URL. */
const ROTA_WORKFLOW_VIEW = '/portal/p/1/pageworkflowview';

/**
 * Tarefa de movimentação da Solicitação de Compras
 * (`/portal/p/1/pageworkflowview?app_ecm_workflowview_processInstanceId=<N>`).
 *
 * Mecanismo confirmado em campo (leitura, sem submeter nada):
 *
 * - O formulário da tarefa vive dentro de um `<iframe>` cujo `src` contém `streamcontrol`
 *   (`webdesk/streamcontrol/...`) — a página externa só traz o cabeçalho (breadcrumb, abas
 *   Formulário/Informações/Histórico/Anexos) e o botão **Enviar**, que fica FORA do iframe.
 * - Dentro do iframe, a etapa "Validação do Gestor" expõe um grupo de rádio
 *   `tbmanag_aprovadoValid` com dois valores — `Aprovado` (rótulo "Sim") e `Reprovado`
 *   (rótulo "Não") — e um `textarea` `tbmanag_justificativa`, obrigatório nos dois casos.
 *   O HTML do formulário DUPLICA os `id` desses campos (uma cópia oculta sem sufixo e a
 *   cópia ativa com sufixo `___N`, onde N é a sequência de movimentação) — por isso os
 *   locators aqui ancoram por `name` (prefixo, ignorando o sufixo) + `:visible`, nunca por
 *   `id`, que resolveria para a cópia errada.
 * - "Assumir" uma tarefa em POOL (grupo "Validação do Gestor Imediato da Req. de Compras")
 *   acontece em Central de Tarefas > Mais opções > Tarefas em pool > (grupo) > botão/link
 *   "Assumir" no card da tarefa — distinto de "Selecionar", que só abre para leitura.
 *
 * ⚠️ Mecanismo documentado a partir de uma tarefa PRÉ-EXISTENTE no ambiente (leitura, sem
 * envio) — nenhuma spec desta suíte usa uma tarefa que não tenha sido criada por ela mesma.
 * As SCs que este projeto cria pela Acompanhamento de Contratos nunca chegam a esta etapa
 * (D-01: nascem presas no marco de Início, atribuídas à conta de integração) — os testes que
 * usam esta Page Object documentam esse bloqueio explicitamente quando ele se confirma.
 */
export class TarefaSolicitacaoCompraPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.botaoEnviar = page.getByRole('button', { name: 'Enviar', exact: true });
    this.frame = page.frameLocator('iframe[src*="streamcontrol"]');
    this.abaHistorico = page.getByRole('link', { name: /Histórico/ });
  }

  /** @param {number|string} processInstanceId */
  async abrirPorProcessInstanceId(processInstanceId) {
    await this.page.goto(
      `${ROTA_WORKFLOW_VIEW}?app_ecm_workflowview_processInstanceId=${encodeURIComponent(String(processInstanceId))}`,
      { waitUntil: 'domcontentloaded' },
    );
    await this.botaoEnviar.waitFor({ state: 'visible' });
  }

  /**
   * Abre uma tarefa que JÁ ESTÁ com o usuário, na URL completa que a própria Central de
   * Tarefas usa.
   *
   * ## Por que `abrirPorProcessInstanceId` não serve para tarefa assumida
   *
   * Medido em 27/08/2026 (SC 112762, tarefa de "Validação do Gestor" assumida do pool e
   * comprovadamente com `TOTVS-FS` na API): abrir só com
   * `app_ecm_workflowview_processInstanceId=<id>` — com ou sem um `...movto=<n>` inventado —
   * devolve o modal *"Esta tarefa não está mais sob sua responsabilidade!"* e a tela nunca
   * monta o botão Enviar. Não é permissão nem D-01: é a URL faltando contexto.
   *
   * A URL correta foi capturada clicando um cartão real na Central de Tarefas:
   *
   * ```
   * /portal/p/1/pageworkflowview
   *   ?app_ecm_workflowview_processInstanceId=<id>
   *   &app_ecm_workflowview_currentMovto=<movimento>
   *   &app_ecm_workflowview_taskUserId=<login>
   *   &app_ecm_workflowview_managerMode=false
   * ```
   *
   * O `movimento` é o `movementSequence` da tarefa `NOT_COMPLETED` — vem de
   * `GET /process-management/api/v2/requests/<id>/tasks` ou do campo homônimo em
   * `centralTasks/getTasks/open/<login>`.
   *
   * ⚠️ O método antigo continua existindo e não foi alterado: as specs que o usam nunca
   * chegam a ter tarefa assumida (D-01 as prende antes), e mudá-lo trocaria o motivo pelo qual
   * elas reprovam.
   *
   * @param {{ processInstanceId: number|string, movimento: number|string, login: string }} tarefa
   */
  async abrirTarefaAtribuida({ processInstanceId, movimento, login }) {
    const url =
      `${ROTA_WORKFLOW_VIEW}?app_ecm_workflowview_processInstanceId=${encodeURIComponent(String(processInstanceId))}` +
      `&app_ecm_workflowview_currentMovto=${encodeURIComponent(String(movimento))}` +
      `&app_ecm_workflowview_taskUserId=${encodeURIComponent(login)}` +
      '&app_ecm_workflowview_managerMode=false';

    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.botaoEnviar.waitFor({ state: 'visible', timeout: 60_000 }).catch(async () => {
      const modais = await this.page
        .locator('.container-modal')
        .allInnerTexts()
        .catch(() => []);
      faltaPreCondicao(
        `a tarefa ${processInstanceId} (movimento ${movimento}) não abriu ` +
          'em modo de movimentação — o botão "Enviar" nunca apareceu. ' +
          (modais.length
            ? `Diálogo(s) na tela: ${JSON.stringify(modais.map((m) => m.replace(/\s+/g, ' ').slice(0, 160)))}. ` +
              '"Esta tarefa não está mais sob sua responsabilidade!" significa que ela não está ' +
              'com este usuário (assumir do pool falhou, ou o fluxo já andou).'
            : 'Nenhum diálogo foi exibido — a tela simplesmente não montou.') +
          ` URL: ${url}`,
      );
    });
  }

  /**
   * Assume, a partir do pool do grupo "Validação do Gestor Imediato", a tarefa do processo
   * informado. Só se aplica enquanto a tarefa ainda está no POOL (não atribuída a ninguém) —
   * uma vez assumida ela passa a aparecer em "Tarefas a concluir" (individual), não mais aqui.
   * @param {number|string} processInstanceId
   */
  async assumirDoPool(processInstanceId) {
    await this.page.goto('/portal/p/1/pagecentraltask', { waitUntil: 'domcontentloaded' });
    await this.page.getByRole('heading', { name: 'Central de tarefas' }).waitFor({ state: 'visible' });
    await this.page.getByRole('link', { name: 'Mais opções' }).click();
    await this.page.getByRole('link', { name: /^Tarefas em pool/ }).click();
    await this.page.getByRole('link', { name: /Validação do Gestor Imediato/ }).click();

    const cartao = this.page.locator('task-card-component').filter({ hasText: String(processInstanceId) });
    await cartao.waitFor({ state: 'visible' });
    // "Assumir" não tem papel (role) próprio identificado em campo — gancho por texto dentro
    // do card, mesma limitação de nome acessível já registrada para outros controles do portal.
    await cartao.getByText('Assumir', { exact: true }).click();
  }

  /** @returns {import('@playwright/test').Locator} */
  radioAprovar() {
    return this.frame.locator('input[name^="tbmanag_aprovadoValid"][value="Aprovado"]:visible');
  }

  /** @returns {import('@playwright/test').Locator} */
  radioReprovar() {
    return this.frame.locator('input[name^="tbmanag_aprovadoValid"][value="Reprovado"]:visible');
  }

  /** @returns {import('@playwright/test').Locator} */
  campoJustificativaGestor() {
    return this.frame.locator('textarea[name^="tbmanag_justificativa"]:visible');
  }

  /**
   * Marca "Sim" (Aprovado), preenche a justificativa obrigatória e envia.
   * @param {string} justificativa
   */
  async aprovar(justificativa) {
    await this.radioAprovar().check();
    await this.campoJustificativaGestor().fill(justificativa);
    await this.botaoEnviar.click();
  }

  /**
   * Marca "Não" (Reprovado), preenche a justificativa obrigatória e envia.
   * @param {string} justificativa
   */
  async reprovar(justificativa) {
    await this.radioReprovar().check();
    await this.campoJustificativaGestor().fill(justificativa);
    await this.botaoEnviar.click();
  }
}
