// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { TrackerComprasPage } from '../../../pages/TrackerComprasPage.js';
import { criarSolicitacaoCompraClassica } from '../../../pages/CicloCompradorPage.js';
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

  /**
   * ⚠️ Este teste passou a criar a PRÓPRIA SC.
   *
   * A versão anterior filtrava por status "Abertos" e exigia mais de uma linha — dependendo
   * de já existir processo aberto na base. Duas fragilidades reais nisso: outro teste podia
   * encerrar essa massa, e o `globalTeardown` da própria suíte cancela solicitações, então a
   * suíte podia destruir a pré-condição de um teste dela mesma. A norma da skill é "cada
   * teste monta seus próprios pré-requisitos".
   *
   * O oráculo agora é a SC deste teste: ela nasce ABERTA, então o filtro "Abertos" tem de
   * devolvê-la. Os dois filtros são combinados de propósito — status E Nº do Processo Fluig.
   * Isso não enfraquece a afirmação, fortalece: com o filtro de status quebrado (devolvendo
   * vazio ou ignorando o critério), a consulta combinada não traria a SC, e o teste reprova.
   * E evita paginar sobre os 800+ processos da base atrás de um id conhecido.
   *
   * O teste irmão `CT-E2E-11-H` (`portais/ciclo-comprador.spec.js`) já usava exatamente esse
   * padrão de massa própria — aqui ele passa a valer também para o filtro de status.
   */
  test('@destrutivo o filtro por status "Abertos" deve devolver a SC própria recém-criada', async ({
    page,
  }, testInfo) => {
    test.setTimeout(300_000);

    const { numeroProcesso } = await criarSolicitacaoCompraClassica(page, {
      justificativa: `QA tracker filtro por status ${Date.now()}`,
    });
    testInfo.annotations.push({ type: 'sc-criada', description: String(numeroProcesso) });

    const tracker = new TrackerComprasPage(page);
    await tracker.goto();
    await tracker.expectCarregada();

    await tracker.filtrarPorStatus('Abertos');
    await page.getByLabel('Nº do Processo Fluig').fill(numeroProcesso);
    await tracker.pesquisar();

    await expect(tracker.alertaFiltroObrigatorio).toBeHidden();

    const linhas = tracker.getLinhasDoResultado();
    await expect(
      linhas.first(),
      `a SC ${numeroProcesso} foi criada agora e está ABERTA — o filtro por status "Abertos" ` +
        'combinado com o número do processo tem de devolvê-la',
    ).toBeVisible({ timeout: 30_000 });

    expect(await linhas.count(), 'a consulta por número deveria devolver exatamente uma linha').toBe(1);
    await expect(linhas.first()).toContainText(numeroProcesso);
  });
});
