// @ts-check
import { CentralTarefasPage } from './CentralTarefasPage.js';

/**
 * Cancelamento de solicitação pela Central de Tarefas → "Minhas solicitações"
 * (`/portal/p/1/pagecentraltask`).
 *
 * É o caminho de UI que o usuário real usa e, por baixo, o MESMO endpoint de que a limpeza da
 * suíte depende (`POST /api/public/2.0/workflows/cancelInstances` — ver
 * `utils/cancelamento-fluig.js` e a skill `cassi-fluig-master`,
 * `references/cancelamento-de-solicitacoes.md`). Compõe `CentralTarefasPage` em vez de
 * duplicá-la: a navegação até a sub-aba já vive lá.
 *
 * ## O que foi medido em campo (27/08/2026) e decide o desenho
 *
 * - **A listagem nasce CRESCENTE (`sord=asc`, `rows=15`) e o scroll infinito traz 15 por vez.**
 *   Uma solicitação recém-criada tem o MAIOR id: com 250+ abertas, ela fica a ~17 rolagens de
 *   distância. O controle "Classificar por" resolve isso de vez — é um menu de rádios com
 *   `#processInstanceId_desc` ("Decrescente"), que refaz a chamada com `sord=desc` e coloca a
 *   solicitação recém-criada no PRIMEIRO cartão. É por isso que `ordenarPorSolicitacaoDecrescente`
 *   existe: sem ela, achar o próprio cartão pela UI é impraticável (a mesma armadilha de
 *   `utils/central-tarefas-paginacao.js`, aqui resolvida pela própria tela).
 * - Cada cartão é `task-card-component[data-process-key="<id>.<movto>"]` — o `id` interno do
 *   botão (`task-action-<id>-<timestamp>-<rand>`) muda a cada renderização e não serve de
 *   âncora; o par cartão + nome do botão serve.
 * - O botão do cartão em "Minhas solicitações" é **"Cancelar"**; ele abre um drawer lateral
 *   (não um `.modal`) com o textarea de motivo (`#ecm-centralTask-areaCancelText`, placeholder
 *   "Motivo do cancelamento") e o botão de confirmação **"Cancelar solicitação"** (com "s"
 *   minúsculo — o botão de MESMO nome com "S" maiúsculo é o da tela de detalhe, outro
 *   endpoint).
 * - O campo `cancelable` do JSON do cartão vem `false` mesmo em cartões cujo botão funciona —
 *   não serve de pré-condição (medido na engenharia reversa do ambiente).
 */
export class CancelamentoCentralTarefasPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.central = new CentralTarefasPage(page);

    /** Menu "Classificar por: <campo>" da listagem. */
    this.linkClassificarPor = page.getByRole('link', { name: /Classificar por/ });
    /** Rádio "Decrescente" do bloco "Solicitação" dentro do menu de ordenação. */
    this.radioSolicitacaoDecrescente = page.locator('#processInstanceId_desc');

    /** Drawer de cancelamento. */
    this.campoMotivo = page.locator('#ecm-centralTask-areaCancelText');
    this.botaoConfirmarCancelamento = page.getByRole('button', {
      name: 'Cancelar solicitação',
      exact: true,
    });
  }

  /** Abre a Central de Tarefas e a sub-aba "Minhas solicitações". */
  async abrirMinhasSolicitacoes() {
    await this.central.goto();
    await this.central.expectCarregada();
    await this.central.abrirMinhasSolicitacoes();
  }

  /**
   * Troca a ordenação da listagem para `processInstanceId` DECRESCENTE e espera o servidor
   * responder com a nova ordenação — condição observável (a URL da chamada carrega
   * `sord=desc`), não tempo fixo.
   */
  async ordenarPorSolicitacaoDecrescente() {
    await this.linkClassificarPor.click();
    await this.radioSolicitacaoDecrescente.waitFor({ state: 'visible' });
    const resposta = this.page.waitForResponse(
      (r) =>
        r.url().includes('/ecm/api/rest/ecm/centralTasks/getTasks/requests/') &&
        r.url().includes('sord=desc'),
    );
    // O clique é no `<label>`: o `<input type=radio>` está sob um `custom-radio` estilizado e
    // não é o alvo de clique da tela.
    await this.page.locator('label[for="processInstanceId_desc"]').click();
    await resposta;
    await this.central.cartoesDeSolicitacao.first().waitFor({ state: 'visible' });
  }

  /**
   * Cartão da solicitação informada. `data-process-key` é `"<processInstanceId>.<movto>"`, e o
   * movto varia — daí o seletor por prefixo.
   * @param {number|string} processInstanceId
   */
  cartao(processInstanceId) {
    return this.page.locator(`task-card-component[data-process-key^="${processInstanceId}."]`);
  }

  /**
   * Botão "Cancelar" do cartão da solicitação informada — o controle cuja ausência é
   * exatamente o risco que CT-TSK-05-H cobre ("o botão some da Central e ninguém percebe").
   * @param {number|string} processInstanceId
   */
  botaoCancelarDoCartao(processInstanceId) {
    return this.cartao(processInstanceId).getByRole('button', { name: 'Cancelar', exact: true });
  }

  /**
   * Aciona "Cancelar" no cartão, informa o motivo e confirma. Devolve a resposta HTTP do
   * endpoint de cancelamento — para o teste poder afirmar sobre o CONTRATO, além de reler o
   * estado no servidor depois.
   *
   * @param {number|string} processInstanceId
   * @param {string} motivo texto obrigatório (o servidor estoura NPE 500 com `cancelText` nulo)
   * @returns {Promise<import('@playwright/test').Response>}
   */
  async cancelarPeloCartao(processInstanceId, motivo) {
    await this.botaoCancelarDoCartao(processInstanceId).click();
    await this.campoMotivo.waitFor({ state: 'visible' });
    await this.campoMotivo.fill(motivo);

    const resposta = this.page.waitForResponse(
      (r) =>
        r.url().includes('/api/public/2.0/workflows/cancelInstances') &&
        r.request().method() === 'POST',
    );
    await this.botaoConfirmarCancelamento.click();
    return resposta;
  }
}
