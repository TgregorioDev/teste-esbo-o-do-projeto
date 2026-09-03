// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { HomePage } from '../../../pages/HomePage.js';

/** Home da plataforma — caso CT-PLT-01-H. */
test.describe('Home da plataforma', () => {
  test('deve carregar os apps e contadores sem erro de console @bug', async ({ page }) => {
    const homePage = new HomePage(page);
    // Precisa ser instalado ANTES do goto() para capturar erros do carregamento inicial.
    const console_ = homePage.escutarErrosDeConsole();

    await homePage.goto();
    await homePage.expectCarregada();

    await expect(homePage.headingMeusApps).toBeVisible();
    await expect(homePage.headingProcessosFavoritos).toBeVisible();

    await expect(homePage.abaRhConecta).toBeVisible();
    await expect(homePage.abaGestao).toBeVisible();
    await expect(homePage.abaCompras).toBeVisible();
    await expect(homePage.abaContratos).toBeVisible();

    // Estado observável (rede estabilizada), não tempo fixo: garante que chamadas
    // assíncronas disparadas na carga (analytics, widgets) já tiveram chance de responder
    // antes de avaliar o coletor de erros de console.
    await page.waitForLoadState('networkidle');

    // DEFEITO REAL CONFIRMADO EM CAMPO (novo — ainda não catalogado em
    // docs/mapa-do-ambiente.md): toda carga da Home dispara
    // `GET .../nps/api/v1/surveys?productLine=TOTVS%20Fluig`, que responde 403 e gera um
    // console.error determinístico no navegador ("Failed to load resource: the server
    // responded with a status of 403 (Forbidden)"). Reproduzido de forma estável em
    // múltiplas execuções. Este teste está escrito contra o comportamento esperado (zero
    // erro de console) e REPROVA de propósito até o widget de NPS ser corrigido ou
    // removido da Home — não ajuste esta assertion para acomodar o erro.
    expect(
      console_.erros(),
      `erro(s) de console na Home: ${JSON.stringify(console_.erros())}`,
    ).toEqual([]);
  });
});
