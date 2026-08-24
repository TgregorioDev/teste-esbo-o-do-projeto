// @ts-check

/** Rota da página de Gerência de Compras. */
const ROTA_GERENCIA_COMPRAS = '/portal/p/1/gerenciaCompras';

/**
 * Gerência de Compras (`/portal/p/1/gerenciaCompras`).
 *
 * Duas abas: "Atribuir" (associa um comprador a uma SC) e "Transferir" (move a SC para
 * outro comprador). A suíte é somente leitura — nenhum teste clica nos botões de ação por
 * linha ("Transferir", "Transferir em Lote") nem preenche "Selecione um comprador".
 *
 * Particularidades observadas em campo (repetido em várias cargas de página):
 *
 * - Nenhuma das duas abas vem `aria-selected="true"` por padrão — o painel só aparece
 *   depois de um clique explícito na aba. As DUAS tabelas (uma por painel) já existem no
 *   DOM desde o início, mas ocultas; por isso a leitura é sempre pela tabela `:visible`.
 *
 * - **Defeito confirmado**: a grade da aba "Atribuir" nunca renderizou dados nos testes de
 *   campo (múltiplas cargas, até ~30s de observação, inclusive clicando na aba uma segunda
 *   vez) — fica presa em "Nenhum dado encontrado". A rede confirma que só duas chamadas a
 *   `ds_getSolicsGerenciaCompras` saem, ambas no carregamento da página (nenhuma nova sai ao
 *   clicar na aba); uma responde em poucos segundos e a outra em ~20-25s, mas mesmo depois
 *   de as duas responderem, a tabela de "Atribuir" continua vazia. A de "Transferir"
 *   carrega corretamente, só que devagar (~20-25s).
 */
export class GerenciaComprasPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.titulo = page.getByRole('heading', { name: 'Gerência de Compras' });
    this.abaAtribuir = page.getByRole('tab', { name: 'Atribuir' });
    this.abaTransferir = page.getByRole('tab', { name: 'Transferir' });
  }

  async goto() {
    await this.page.goto(ROTA_GERENCIA_COMPRAS, { waitUntil: 'domcontentloaded' });
  }

  /** Pré-condição: cabeçalho e as duas abas estão disponíveis. */
  async expectCarregada() {
    await this.titulo.waitFor({ state: 'visible' });
    await this.abaAtribuir.waitFor({ state: 'visible' });
    await this.abaTransferir.waitFor({ state: 'visible' });
  }

  async abrirAbaAtribuir() {
    await this.abaAtribuir.click();
  }

  async abrirAbaTransferir() {
    await this.abaTransferir.click();
  }

  /**
   * Tabela do painel atualmente visível (a da aba ativa). As duas tabelas (Atribuir e
   * Transferir) existem sempre no DOM — só uma fica visível por vez.
   * @returns {import('@playwright/test').Locator}
   */
  getTabelaAtiva() {
    return this.page.locator('table:visible').first();
  }

  /** Mensagem de grade vazia, dentro da tabela atualmente visível. */
  getMensagemSemDados() {
    return this.getTabelaAtiva().getByText('Nenhum dado encontrado');
  }

  /** Linhas de dados (exclui a linha de "Nenhum dado encontrado") da tabela visível. */
  getLinhasDaTabelaAtiva() {
    return this.getTabelaAtiva().locator('tbody tr');
  }
}
