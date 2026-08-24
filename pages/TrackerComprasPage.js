// @ts-check

/** Rota do Tracker de Processos de Compras/Contratos. */
const ROTA_TRACKER = '/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS';

/**
 * Tracker de Processos de Compras/Contratos (`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`).
 *
 * Painel de filtros por tipo de processo (Solicitação de Compras, Cotação, Faturamento de
 * Contratos etc.) mais um conjunto de filtros específicos (processo, solicitante, status,
 * datas, fornecedor). Confirmado em campo: pesquisar sem nenhum filtro preenchido devolve o
 * alerta "Necessário informar pelo menos um filtro" (sem consultar nada); com pelo menos um
 * filtro (ex.: Status = Abertos) a grade responde com processos reais.
 *
 * Suíte somente leitura — só usa "Pesquisar Registro" (busca) e "Limpar" (limpa o
 * formulário), nunca ações de linha.
 */
export class TrackerComprasPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.tituloFiltros = page.getByRole('heading', { name: /Filtros/ });
    this.comboFiltrarPor = page.getByRole('combobox', { name: 'Filtrar por:' });
    this.comboStatus = page.getByRole('combobox', { name: 'Status' });
    this.botaoPesquisar = page.getByRole('button', { name: 'Pesquisar Registro' });
    this.botaoLimpar = page.getByRole('button', { name: 'Limpar' });
    this.alertaFiltroObrigatorio = page.getByText('Necessário informar pelo menos um filtro');
  }

  async goto() {
    await this.page.goto(ROTA_TRACKER, { waitUntil: 'domcontentloaded' });
  }

  async expectCarregada() {
    await this.tituloFiltros.waitFor({ state: 'visible' });
    await this.comboFiltrarPor.waitFor({ state: 'visible' });
    await this.botaoPesquisar.waitFor({ state: 'visible' });
  }

  async pesquisar() {
    await this.botaoPesquisar.click();
  }

  /**
   * @param {'Todos' | 'Abertos' | 'Finalizados' | 'Cancelados'} status
   */
  async filtrarPorStatus(status) {
    await this.comboStatus.selectOption({ label: status });
  }

  /** @returns {import('@playwright/test').Locator} */
  getTabelaResultado() {
    return this.page.locator('table:visible').first();
  }

  getLinhasDoResultado() {
    return this.getTabelaResultado().locator('tbody tr');
  }
}
