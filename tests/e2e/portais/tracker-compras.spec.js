// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { TrackerComprasPage } from '../../../pages/TrackerComprasPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * Tracker de Processos Compras/Contratos — caso CT-E2E-11-H (somente leitura).
 *
 * Cobre: abrir o painel de filtros e filtrar processos, confirmando que a tela responde ao
 * filtro (recusa pesquisa sem nenhum critério; retorna processos reais com pelo menos um).
 * `bloquearCriacaoDeSolicitacao` fica de guarda: "Pesquisar Registro" é uma busca, mas a
 * guarda confirma que nenhuma escrita em process-management ocorre no caminho.
 */
test.describe('Tracker de Processos Compras/Contratos', () => {
  test('deve exibir o painel de filtros ao carregar', async ({ page }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const tracker = new TrackerComprasPage(page);

    await tracker.goto();
    await tracker.expectCarregada();

    await expect(page).toHaveTitle('Cassi - Fluig Plataforma - Tracker - Processos Compras/ Contratos');
    // Confirmado em campo: "Solicitação de Compras" é a opção selecionada por padrão.
    await expect(tracker.comboFiltrarPor.locator('option:checked')).toHaveText(
      'Solicitação de Compras',
    );
    await expect(tracker.botaoPesquisar).toBeVisible();

    expect(guarda.tentativas()).toBe(0);
  });

  test('deve exigir ao menos um filtro antes de pesquisar', async ({ page }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const tracker = new TrackerComprasPage(page);

    await tracker.goto();
    await tracker.expectCarregada();

    await tracker.pesquisar();

    await expect(tracker.alertaFiltroObrigatorio).toBeVisible();
    // Nenhum resultado deve ter sido carregado quando o filtro é recusado.
    expect(await tracker.getLinhasDoResultado().count()).toBe(0);

    expect(guarda.tentativas()).toBe(0);
  });

  test('deve listar processos reais ao filtrar por status', async ({ page }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const tracker = new TrackerComprasPage(page);

    await tracker.goto();
    await tracker.expectCarregada();

    await tracker.filtrarPorStatus('Abertos');
    await tracker.pesquisar();

    await expect(tracker.alertaFiltroObrigatorio).toBeHidden();
    const linhas = tracker.getLinhasDoResultado();
    await expect(linhas.first()).toBeVisible();
    // A quantidade varia com a base; o que o negócio garante é que o filtro devolve
    // processos — fixar o total tornaria o teste falso-vermelho a cada movimentação.
    expect(await linhas.count()).toBeGreaterThan(0);

    expect(guarda.tentativas()).toBe(0);
  });
});
