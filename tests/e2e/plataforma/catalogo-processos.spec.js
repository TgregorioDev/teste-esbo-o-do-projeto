// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { HomePage } from '../../../pages/HomePage.js';
import { CatalogoProcessosPage } from '../../../pages/CatalogoProcessosPage.js';

/** Menu Processos e catálogo "Iniciar Solicitações" — caso CT-PLT-02-H. */
test.describe('Menu Processos e catálogo de início de solicitações', () => {
  test('deve abrir o painel do menu Processos e navegar até o catálogo', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.expectCarregada();

    await homePage.abrirMenuProcessos();
    await expect(homePage.headingPainelProcessos).toBeVisible();
    await expect(homePage.linkIniciarSolicitacoes).toBeVisible();

    await homePage.linkIniciarSolicitacoes.click();

    await expect(page).toHaveURL(/pageprocessstart/);
    await expect(page).toHaveTitle('Cassi - Fluig Plataforma - Iniciar Solicitações');
  });

  test('deve listar os processos e responder à busca', async ({ page }) => {
    const catalogoPage = new CatalogoProcessosPage(page);
    await catalogoPage.goto();
    await catalogoPage.expectCarregada();

    await expect(catalogoPage.headingUltimosProcessos).toBeVisible();
    await expect(catalogoPage.headingTodosOsProcessos).toBeVisible();

    // Processo que só existe em "Todos os processos" (nunca iniciado, então não tem
    // atalho em "Últimos processos iniciados") — garante que a asserção prova o filtro
    // da BUSCA, não um atalho que ficaria visível de qualquer forma.
    await catalogoPage.buscarProcesso('Cadastro de Fornecedor');
    await expect(catalogoPage.linkDoProcesso('Cadastro de Fornecedor')).toBeVisible();

    await catalogoPage.campoBusca.fill('termo-sem-correspondencia-xyz-999');
    await expect(catalogoPage.headingNenhumProcessoEncontrado).toBeVisible();
  });
});
