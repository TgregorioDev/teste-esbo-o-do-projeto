// @ts-check

/** Rota de movimentação de tarefa por URL. */
const ROTA_WORKFLOW_VIEW = '/portal/p/1/pageworkflowview';

/**
 * Menu de ações da tela "Movimentar Solicitação" (`pageworkflowview`) — as quatro saídas de
 * uma tarefa no Fluig.
 *
 * A suíte inteira só exercitava a primeira (Enviar). Este Page Object cobre as outras três,
 * que ficam escondidas atrás do `caret` ao lado do botão Enviar.
 *
 * ## Estrutura confirmada em campo (27/08/2026)
 *
 * O rodapé é um `div#workflowActions` com um `btn-group`:
 *
 * ```html
 * <button id="send-process-button" data-send>Enviar</button>
 * <button id="dd-options" data-toggle="dropdown" aria-label="Opções">▼</button>
 * <ul id="optionList" role="menu">
 *   <li data-send>Enviar — Salva e movimenta a atividade</li>
 *   <li data-save>Somente salvar — Salva as alterações, sem movimentar a atividade</li>
 *   <li data-cancel-workflow-request>Cancelar Solicitação — ...</li>
 *   <li data-transfer>Transferir — Selecione um usuário para transferir a tarefa</li>
 * </ul>
 * ```
 *
 * Os `<li>` são ancorados pelo ATRIBUTO de ação (`data-save`, `data-transfer`), não pelo
 * texto: o texto é rótulo de UI traduzível, e os dois primeiros itens começam com a mesma
 * palavra ("Enviar"/"Somente salvar" ambos falam em "Salva"), o que torna `hasText` ambíguo.
 *
 * ⚠️ **Armadilha paga**: o `<ul>` fica no DOM mesmo fechado. Clicar num `<li>` sem o menu
 * aberto acerta o que estiver por baixo — na primeira tentativa isso disparou o **Enviar** de
 * uma solicitação que não era massa deste teste. Por isso `abrirMenuDeAcoes()` só retorna
 * depois que o item alvo está de fato visível, e todo clique passa por ele.
 *
 * ⚠️ **Transferir não é reversível.** Depois de transferida, a tarefa sai da conta da
 * automação e o servidor recusa qualquer nova movimentação por ela ("Esta tarefa não está mais
 * sob sua responsabilidade!"). A solicitação continua cancelável pelo requisitante — que é
 * como a limpeza da suíte recolhe o resíduo —, mas a tarefa em si não volta.
 */
export class AcoesDaTarefaPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.botaoEnviar = page.getByRole('button', { name: 'Enviar', exact: true });
    this.caretDeOpcoes = page.locator('#dd-options');
    this.menuDeOpcoes = page.locator('#optionList');

    this.itemEnviar = this.menuDeOpcoes.locator('li[data-send]');
    this.itemSomenteSalvar = this.menuDeOpcoes.locator('li[data-save]');
    this.itemCancelarSolicitacao = this.menuDeOpcoes.locator('li[data-cancel-workflow-request]');
    this.itemTransferir = this.menuDeOpcoes.locator('li[data-transfer]');

    /** Diálogo de erro do Fluig (heading "Erro" + "Ok, entendi"). */
    this.dialogErro = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'Erro', exact: true }) });

    /** Formulário da tarefa (o mesmo iframe "Visualizador" das demais telas de processo). */
    this.frame = page.frameLocator('iframe[title="Visualizador"]');
  }

  /**
   * URL canônica da tela de movimentação de UMA tarefa. Reconstruída (em vez de guardada da
   * navegação anterior) para o passo "recarregar e reabrir a tarefa" ser uma abertura nova de
   * verdade, e não um `reload()` que poderia reaproveitar estado de página.
   *
   * @param {{ processInstanceId: number|string, currentMovto: number|string, taskUserId: string }} tarefa
   * @returns {string}
   */
  static urlDaTarefa(tarefa) {
    const p = new URLSearchParams({
      app_ecm_workflowview_processInstanceId: String(tarefa.processInstanceId),
      app_ecm_workflowview_currentMovto: String(tarefa.currentMovto),
      app_ecm_workflowview_taskUserId: tarefa.taskUserId,
      app_ecm_workflowview_managerMode: 'false',
    });
    return `${ROTA_WORKFLOW_VIEW}?${p.toString()}`;
  }

  /**
   * Abre a tela de movimentação da tarefa e espera o rodapé de ações existir.
   * @param {{ processInstanceId: number|string, currentMovto: number|string, taskUserId: string }} tarefa
   */
  async abrirTarefa(tarefa) {
    await this.page.goto(AcoesDaTarefaPage.urlDaTarefa(tarefa), { waitUntil: 'domcontentloaded' });
    await this.botaoEnviar.waitFor({ state: 'visible' });
    await this.caretDeOpcoes.waitFor({ state: 'visible' });
  }

  /**
   * Abre o menu de ações e só devolve quando o item pedido está clicável — ver a armadilha
   * documentada na classe.
   * @param {import('@playwright/test').Locator} item
   */
  async abrirMenuDeAcoes(item) {
    await this.caretDeOpcoes.click();
    await item.waitFor({ state: 'visible' });
  }

  /**
   * Aciona "Somente salvar" e devolve a resposta do servidor.
   *
   * A ação usa o MESMO endpoint do Enviar (`POST /ecm/api/rest/ecm/workflowView/send`) — o que
   * distingue as duas é `completeTask`: `false` salva sem movimentar, `true` movimenta. Por
   * isso a espera filtra pelo corpo da requisição, e não só pela URL: sem esse filtro, um
   * Enviar acidental satisfaria a mesma espera.
   *
   * @returns {Promise<import('@playwright/test').Response>}
   */
  async somenteSalvar() {
    await this.abrirMenuDeAcoes(this.itemSomenteSalvar);
    const resposta = this.page.waitForResponse((r) => {
      if (!r.url().includes('/ecm/api/rest/ecm/workflowView/send')) return false;
      if (r.request().method() !== 'POST') return false;
      try {
        return JSON.parse(r.request().postData() ?? '{}').completeTask === false;
      } catch {
        return false;
      }
    });
    await this.itemSomenteSalvar.click();
    return resposta;
  }

  /**
   * Aciona "Transferir".
   *
   * Medido em 27/08/2026: apesar do rótulo ("Selecione um usuário para transferir a tarefa"),
   * o clique **já dispara a transferência** — saem dois `POST .../workflowView/send`, o
   * primeiro com `completeTask: false` (auto-save do formulário) e o segundo com
   * `completeTask: true` e `selectedColleague: []`; quem escolhe o destino é o servidor, pelo
   * mecanismo de atribuição da atividade. A prova está na stack de uma recusa capturada:
   * `BPMUserResponsibleNotInformedException ... WorkflowEngine.transferTask`.
   *
   * Por isso este método NÃO espera por painel nenhum: o desfecho (transferiu / recusou) é
   * observável no servidor e no diálogo de erro, e é lá que o teste afirma. Se um dia a tela
   * passar a oferecer a escolha do destino, o teste de CT-TSK-08-H falha com o DOM anexado ao
   * relatório, que é o gatilho para estender esta classe.
   */
  async acionarTransferir() {
    await this.abrirMenuDeAcoes(this.itemTransferir);
    await this.itemTransferir.click();
  }
}
