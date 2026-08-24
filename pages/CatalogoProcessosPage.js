// @ts-check

/** Rota do catálogo de início de processos. */
const ROTA_CATALOGO_PROCESSOS = '/portal/p/1/pageprocessstart';

/**
 * Catálogo "Iniciar Solicitações" (`/portal/p/1/pageprocessstart`).
 *
 * Notas de locator observadas no ambiente:
 * - O campo de busca (`placeholder="Buscar processo"`) fica oculto até o ícone de lupa
 *   (`[data-toggle-search-input]`, um `<i>` sem role/nome acessível) ser clicado.
 * - O catálogo já vem FILTRADO por permissão: um processo bloqueado para o usuário não
 *   aparece na busca, mesmo pelo nome completo — comportamento coberto em
 *   `tests/e2e/plataforma/inicio-processo-bloqueado.spec.js` (Caminho A).
 * - Um processo com "Último iniciado: Nunca" aparece só na seção "Todos os processos".
 *   Já um processo recém-iniciado (ex.: `wf_solicitacao_compras`) aparece TAMBÉM no atalho
 *   "Últimos processos iniciados" — o mesmo `data-process-id` existe duas vezes na página
 *   nesse caso, o que ambiguaria qualquer locator baseado nesse atributo.
 */
export class CatalogoProcessosPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.headingUltimosProcessos = page.getByRole('heading', {
      name: 'Últimos processos iniciados',
      exact: true,
    });
    this.headingTodosOsProcessos = page.getByRole('heading', {
      name: 'Todos os processos',
      exact: true,
    });
    this.headingNenhumProcessoEncontrado = page.getByRole('heading', {
      name: 'Nenhum processo encontrado',
      exact: true,
    });

    this.botaoAbrirBusca = page.locator('[data-toggle-search-input]');
    this.campoBusca = page.getByPlaceholder('Buscar processo');
  }

  async goto() {
    await this.page.goto(ROTA_CATALOGO_PROCESSOS, { waitUntil: 'domcontentloaded' });
  }

  /** Pré-condição: catálogo carregado — as duas seções e ao menos um card renderizados. */
  async expectCarregada() {
    await this.headingUltimosProcessos.waitFor({ state: 'visible' });
    await this.headingTodosOsProcessos.waitFor({ state: 'visible' });
  }

  /**
   * Filtra "Todos os processos" pelo termo informado. Abre o campo de busca se ainda
   * estiver oculto. O filtro NÃO afeta o atalho "Últimos processos iniciados".
   * @param {string} termo
   */
  async buscarProcesso(termo) {
    if (!(await this.campoBusca.isVisible())) {
      await this.botaoAbrirBusca.click();
      await this.campoBusca.waitFor({ state: 'visible' });
    }
    await this.campoBusca.fill(termo);
  }

  /**
   * Link do card de um processo pelo nome visível no catálogo.
   * @param {string} nome
   * @returns {import('@playwright/test').Locator}
   */
  linkDoProcesso(nome) {
    return this.page.getByRole('link', { name: new RegExp(nome) });
  }
}
