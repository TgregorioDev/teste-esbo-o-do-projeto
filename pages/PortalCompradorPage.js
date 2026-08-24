// @ts-check

/** Rota do Portal do Comprador. */
const ROTA_PORTAL_COMPRADOR = '/portal/p/1/portal-do-comprador';

/**
 * Portal do Comprador (`/portal/p/1/portal-do-comprador`).
 *
 * Painel "Acesso Rápido" com as quatro etapas do ciclo de compras: Validação Inicial,
 * Controle De Cotações, Avaliação de Propostas e Definir Vencedor Cotação. A suíte é
 * somente leitura — nenhum teste clica em "Buscar", "Centralizar Solicitações" nem em ações
 * de linha.
 *
 * Nota de locator: cada etapa é renderizada DUAS vezes no DOM — como item do menu lateral
 * colapsado (`span.po-menu-icon-label`, oculto) e como o "tile" clicável do painel principal
 * (`p`, visível). Por isso os tiles são ancorados por `p:visible`, e não por texto solto.
 *
 * Particularidade observada em campo sobre "Atuar como": três das quatro sub-telas
 * (Controle de Cotações, Avaliação de Propostas, Definir Vencedor Cotação) expõem um
 * `<select>` nativo "Atuar como:" — o usuário da automação opera essas filas por
 * delegação. Confirmado repetidamente: sem trocar a delegação (o valor default é o próprio
 * usuário autenticado, sem nenhuma SC atribuída a ele nessas filas) as três telas vêm vazias
 * ("Nenhum dado encontrado" / grade sem linhas). A quarta sub-tela, Validação Inicial, NÃO
 * tem esse seletor e mostra dados reais diretamente — não depende de delegação. A suíte não
 * troca a delegação: fazer isso significaria operar a fila em nome de outro colaborador real
 * (`Arthur de Almeida Santos`), fora do escopo de leitura desta automação.
 */
export class PortalCompradorPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.titulo = page.getByRole('heading', { name: 'Acesso Rápido' });
    this.comboAtuarComo = page.locator('select');
  }

  async goto() {
    await this.page.goto(ROTA_PORTAL_COMPRADOR, { waitUntil: 'domcontentloaded' });
  }

  async expectCarregada() {
    await this.titulo.waitFor({ state: 'visible' });
  }

  /**
   * Tile clicável de uma etapa no painel "Acesso Rápido".
   * @param {'Validação Inicial' | 'Controle De Cotações' | 'Avaliação de Propostas' | 'Definir Vencedor Cotação'} nome
   * @returns {import('@playwright/test').Locator}
   */
  getTile(nome) {
    return this.page.locator('p:visible').filter({ hasText: nome });
  }

  /**
   * Abre uma etapa a partir do painel "Acesso Rápido" (primeira navegação da sub-SPA).
   * @param {'Validação Inicial' | 'Controle De Cotações' | 'Avaliação de Propostas' | 'Definir Vencedor Cotação'} nome
   */
  async abrirEtapa(nome) {
    await this.getTile(nome).click();
  }

  /**
   * Troca de etapa já dentro da sub-SPA, pelo menu lateral que aparece após a primeira
   * navegação. Mais estável que forçar a URL com hash, que não dispara o roteador Angular.
   * @param {'Validação Inicial' | 'Controle de Cotações' | 'Avaliação de Propostas' | 'Definir Vencedor Cotação'} nome
   */
  async irParaEtapa(nome) {
    await this.page.getByRole('menuitem', { name: nome, exact: true }).click();
  }

  /** @returns {import('@playwright/test').Locator} */
  getTabelaAtiva() {
    return this.page.locator('table:visible').first();
  }
}
