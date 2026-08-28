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

    // O alerta de filtro obrigatório É a prova de que a pesquisa foi recusada.
    //
    // ⚠️ Saiu daqui `getLinhasDoResultado().count()).toBe(0)`. `getTabelaResultado()` é
    // `page.locator('table:visible').first()`: quando nenhuma tabela está visível — que é
    // exatamente o estado após a recusa — o locator resolve zero elementos e a contagem dá 0
    // por VACUIDADE, não por a pesquisa ter sido bloqueada. A assertion passaria igual se a
    // tela nunca tivesse montado, e não acrescentava nada ao alerta acima.
    await expect(tracker.alertaFiltroObrigatorio).toBeVisible();

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
    //
    // `> 1` e não `> 0`: a grade vazia do portal renderiza UMA linha de placeholder
    // ("Nenhum dado encontrado"), então `> 0` seria satisfeito por um resultado VAZIO — e o
    // título promete "processos reais". Mesmo critério de `CicloCompradorPage.possuiDados()`.
    expect(
      await linhas.count(),
      'o filtro por status "Abertos" deveria devolver processos reais — só a linha de ' +
        'placeholder não sustenta o que este teste afirma',
    ).toBeGreaterThan(1);

    expect(guarda.tentativas()).toBe(0);
  });
});
