// @ts-check
import { GerenciaComprasPage } from './GerenciaComprasPage.js';

/**
 * Gerência de Compras (`/portal/p/1/gerenciaCompras`) — aba **Atribuir**, foco na ação de
 * escrita que `GerenciaComprasPage` deliberadamente não cobre: selecionar um comprador para
 * uma SC pendente e confirmar (CT-E2E-05-H).
 *
 * Compõe `GerenciaComprasPage` para a navegação/leitura já validada em campo (abas, tabela
 * ativa, mensagem de "Nenhum dado encontrado") e acrescenta só o que é próprio da escrita.
 *
 * ## O controle de atribuição, confirmado em campo — mas não na aba Atribuir
 *
 * A aba **Atribuir** nunca teve, em nenhuma medição desta suíte, uma linha real disponível
 * para a conta autenticada (ver `atribuicao-comprador.spec.js` para a medição exata: a consulta
 * ao dataset que a alimenta, com o filtro que o próprio widget usa, devolve zero registros para
 * esta conta). Por isso o controle de atribuição em si foi confirmado observando a aba **irmã**
 * Transferir, que usa o MESMO componente por linha (`wg_gerenciaComprasV1`) e tem massa real:
 * um `po-lookup` rotulado "Selecione um comprador" (campo de busca + botão de lupa
 * `aria-label="Pesquisar"`) e, ao final da linha, um botão de confirmação com o nome da aba
 * (`"Transferir"` na aba Transferir; por simetria de componente, `"Atribuir"` é o esperado
 * aqui). Como a aba Atribuir nunca teve linha para exercitar isso ao vivo, os métodos abaixo
 * documentam o mecanismo tal como observado na aba irmã — nenhum teste desta suíte afirma que
 * eles disparam com sucesso na aba Atribuir, porque isso nunca foi observável.
 */
export class AtribuicaoCompradorPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.gerencia = new GerenciaComprasPage(page);
  }

  async goto() {
    await this.gerencia.goto();
  }

  async expectCarregada() {
    await this.gerencia.expectCarregada();
  }

  async abrirAbaAtribuir() {
    await this.gerencia.abrirAbaAtribuir();
  }

  async abrirAbaTransferir() {
    await this.gerencia.abrirAbaTransferir();
  }

  /** @returns {import('@playwright/test').Locator} */
  getTabelaAtiva() {
    return this.gerencia.getTabelaAtiva();
  }

  getLinhas() {
    return this.gerencia.getLinhasDaTabelaAtiva();
  }

  /** @returns {Promise<boolean>} true quando a tabela ativa tem pelo menos um registro real. */
  async possuiDados() {
    return (await this.getLinhas().count()) > 1;
  }

  /**
   * Localiza, na tabela ativa, a linha cujo texto contém o número de SC/processo informado.
   * @param {string | number} numero
   * @returns {import('@playwright/test').Locator}
   */
  localizarLinhaPorNumero(numero) {
    return this.getLinhas().filter({ hasText: String(numero) });
  }

  /**
   * O `po-lookup` "Selecione um comprador" dentro de uma linha — mecanismo confirmado na aba
   * Transferir (mesmo componente); ver nota da classe.
   * @param {import('@playwright/test').Locator} linha
   * @returns {import('@playwright/test').Locator}
   */
  getSeletorCompradorDaLinha(linha) {
    return linha.locator('input.po-lookup-input');
  }

  /**
   * Botão de confirmação ao final da linha — `"Transferir"` na aba irmã; nesta aba, por
   * simetria do mesmo componente, o esperado é `"Atribuir"`.
   * @param {import('@playwright/test').Locator} linha
   * @param {string} rotulo
   * @returns {import('@playwright/test').Locator}
   */
  getBotaoConfirmarDaLinha(linha, rotulo) {
    return linha.getByRole('button', { name: rotulo, exact: true });
  }
}
