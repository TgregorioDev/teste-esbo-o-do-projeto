// @ts-check
import { expect } from '@playwright/test';

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

  /**
   * Troca a visão do Tracker e espera o painel de filtros se remontar.
   *
   * Cada visão traz filtros próprios — a de Faturamento, por exemplo, exige período
   * (`dataSolicitacaoDeFC`/`AteFC`) e não devolve nada sem ele. Trocar a visão e pesquisar na
   * sequência, sem esperar, pesquisa com o formulário da visão anterior.
   *
   * @param {string} rotulo
   */
  async selecionarVisao(rotulo) {
    await this.comboFiltrarPor.selectOption({ label: rotulo });
    await this.page.locator('#filterTipo').waitFor({ state: 'visible' });
  }

  /**
   * Preenche o período da visão *Faturamento de Contratos*.
   * Os campos são `<input type="date">` — só aceitam ISO (`aaaa-mm-dd`).
   *
   * @param {string} de aaaa-mm-dd
   * @param {string} ate aaaa-mm-dd
   */
  async filtrarPeriodoDeFaturamento(de, ate) {
    await this.page.locator('#dataSolicitacaoDeFC').fill(de);
    await this.page.locator('#dataSolicitacaoAteFC').fill(ate);
  }

  /** Rótulos das visões oferecidas em "Filtrar por:". @returns {Promise<string[]>} */
  async listarVisoes() {
    return (await this.comboFiltrarPor.locator('option').allInnerTexts()).map((o) => o.trim());
  }

  /**
   * Todas as linhas do resultado, percorrendo as páginas da grade.
   *
   * A grade é uma DataTables de 10 linhas por página e **não oferece seletor de tamanho** —
   * ler só a primeira página é ler 10 de 171. Foi exatamente esse recorte que fez o teste de
   * duplicata do disparo automático não achar nenhuma FC do Integrador: a única visível na
   * página 1 estava cancelada, e as 151 abertas vinham depois.
   *
   * O botão "Próximo" (`.dt-paging-button.next`) ganha a classe `disabled` na última página —
   * é esse o critério de parada, não uma contagem estimada.
   *
   * @returns {Promise<Array<Record<string,string>>>}
   */
  async lerTodasAsLinhasComoMapa() {
    const proximo = this.page.locator('.dt-paging-button.next');
    /** @type {Array<Record<string,string>>} */
    const todas = [];

    // Teto de segurança: a grade tem paginação finita, mas um "Próximo" que nunca desabilita
    // (defeito de tela) travaria a suíte em laço infinito em vez de reprovar.
    for (let pagina = 0; pagina < 60; pagina += 1) {
      todas.push(...(await this.lerLinhasComoMapa()));

      const classe = (await proximo.getAttribute('class')) ?? '';
      if (classe.includes('disabled')) return todas;

      const primeiraAntes = await this.getLinhasDoResultado().first().innerText();
      await proximo.click();
      await expect
        .poll(async () => this.getLinhasDoResultado().first().innerText(), { timeout: 15_000 })
        .not.toBe(primeiraAntes);
    }

    throw new Error(
      'A paginação do Tracker não terminou em 60 páginas — "Próximo" nunca ficou desabilitado.',
    );
  }

  /**
   * Linhas do resultado como mapas `cabeçalho → valor`.
   *
   * Por índice de coluna o teste quebra na primeira coluna nova — e esta grade tem 18. Mapear
   * pelo cabeçalho é o que sobrevive à evolução da tela.
   *
   * @returns {Promise<Array<Record<string,string>>>}
   */
  async lerLinhasComoMapa() {
    const tabela = this.getTabelaResultado();
    const cabecalhos = (await tabela.locator('thead th').allInnerTexts()).map((c) => c.trim());
    return tabela.locator('tbody tr').evaluateAll(
      (linhas, cabs) =>
        linhas.map((tr) => {
          /** @type {Record<string,string>} */
          const mapa = {};
          const celulas = [...tr.querySelectorAll('td')];
          cabs.forEach((h, i) => {
            if (h) mapa[h] = (celulas[i]?.textContent ?? '').trim();
          });
          return mapa;
        }),
      cabecalhos,
    );
  }
}
