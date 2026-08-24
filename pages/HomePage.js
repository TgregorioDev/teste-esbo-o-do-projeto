// @ts-check

/** Rota da Home — mesma URL serve o login (ver `pages/LoginPage.js`). */
const ROTA_HOME = '/portal/p/1/home';

/**
 * Home do portal (`/portal/p/1/home`).
 *
 * Expõe o ponto de entrada de navegação usado pela suíte de Plataforma: o menu lateral
 * "Processos", que abre um painel/flyout NA MESMA URL, sem navegar — confirmado em campo:
 * o clique não muda a URL, só injeta o painel — por isso `abrirMenuProcessos` espera pelo
 * heading do painel, não por navegação.
 */
export class HomePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.headingMeusApps = page.getByRole('heading', { name: 'Meus Apps', exact: true });
    this.headingProcessosFavoritos = page.getByRole('heading', {
      name: 'Processos favoritos',
      exact: true,
    });

    // DEFEITO REAL CONFIRMADO EM CAMPO (novo — ainda não catalogado): o `<a role="tab">`
    // de cada aba envolve um `<div><li>` (bloco dentro de elemento inline, HTML inválido).
    // O Chromium renderiza o `<a>` com bounding box 0x0 — o rótulo (ícone + texto) fica
    // visível na tela porque o clique borbulha do filho pro `<a>`, mas QUALQUER locator
    // baseado no `<a role="tab">` (inclusive `getByRole('tab', ...)`, a opção preferencial
    // da hierarquia) falha em `.toBeVisible()`/`.click()` — o elemento é, de fato,
    // inacessível a teclado/leitor de tela apesar de aparecer visualmente ao mouse.
    // Locator aqui aponta pro rótulo de texto realmente renderizado, ainda escopado pelo
    // `role=tablist` (o `<ul>` correto), para refletir o que o usuário efetivamente vê.
    const tablist = page.getByRole('tablist');
    this.abaRhConecta = tablist.getByText('RH Conecta', { exact: true });
    this.abaGestao = tablist.getByText('Gestão', { exact: true });
    this.abaCompras = tablist.getByText('Compras', { exact: true });
    this.abaContratos = tablist.getByText('Contratos', { exact: true });

    this.linkMenuProcessos = page.getByRole('link', { name: 'Processos', exact: true });
    this.headingPainelProcessos = page.getByRole('heading', { name: 'Processos', exact: true });

    this.linkIniciarSolicitacoes = page.getByRole('link', {
      name: 'Iniciar Solicitações',
      exact: true,
    });
  }

  async goto() {
    await this.page.goto(ROTA_HOME, { waitUntil: 'domcontentloaded' });
  }

  /** Pré-condição: apps e contadores carregados. */
  async expectCarregada() {
    await this.headingMeusApps.waitFor({ state: 'visible' });
    await this.headingProcessosFavoritos.waitFor({ state: 'visible' });
  }

  /** Abre o painel de ações do menu "Processos" (flyout, sem navegar). */
  async abrirMenuProcessos() {
    await this.linkMenuProcessos.click();
    await this.headingPainelProcessos.waitFor({ state: 'visible' });
  }

  /**
   * Registra um coletor de erros de console/página não tratados. Precisa ser chamado
   * ANTES de `goto()` para capturar os erros disparados durante o carregamento inicial —
   * assim como `bloquearCriacaoDeSolicitacao`, a instalação tem que preceder a navegação.
   * @returns {{ erros: () => string[] }}
   */
  escutarErrosDeConsole() {
    /** @type {string[]} */
    const erros = [];

    this.page.on('console', (msg) => {
      if (msg.type() === 'error') erros.push(msg.text());
    });
    this.page.on('pageerror', (err) => {
      erros.push(err.message);
    });

    return { erros: () => [...erros] };
  }
}
