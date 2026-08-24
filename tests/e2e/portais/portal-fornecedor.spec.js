// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { TITULO_LOGIN } from '../../../config/ambiente.js';
import { PortalFornecedorPage } from '../../../pages/PortalFornecedorPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * Portal do Fornecedor — caso CT-PFN-01-H (parcial) + controle de acesso.
 *
 * Cobre: a landing oferece os três níveis de acesso, cada botão leva ao respectivo
 * formulário/diálogo de autenticação de fornecedor, e a rota exige sessão da plataforma
 * (anônimo não alcança o portal).
 *
 * NÃO cobre (fora de escopo desta suíte, ver README/relatório): CT-PFN-01-S1/S2 (credencial
 * inválida, força bruta), CT-PFN-02 (reset de senha), CT-PFN-03 (primeiro acesso),
 * CT-PFN-04 (cotações), CT-PFN-05 (documentos fiscais), CT-PFN-06 (XSS no chat), CT-PFN-07
 * (IDOR) — exigem credencial de fornecedor real que a automação não possui, e/ou seriam
 * ataque real contra o ambiente do cliente. Nenhum teste preenche CPF/CNPJ/senha nem clica
 * em "Entrar"/"Representar".
 */
test.describe('Acesso ao Portal do Fornecedor (autenticado na plataforma)', () => {
  test('deve oferecer os três níveis de acesso ao fornecedor', async ({ page }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const portalFornecedor = new PortalFornecedorPage(page);

    await portalFornecedor.goto();
    await portalFornecedor.expectCarregada();

    await expect(page).toHaveTitle('Cassi - Fluig Plataforma - Portal do Fornecedor');
    await expect(portalFornecedor.titulo).toBeVisible();
    await expect(portalFornecedor.subtitulo).toBeVisible();
    await expect(portalFornecedor.tituloSelecaoAcesso).toBeVisible();

    await expect(portalFornecedor.botaoAcessoNormal).toBeVisible();
    await expect(portalFornecedor.botaoAcessoAdministrador).toBeVisible();
    await expect(portalFornecedor.botaoAcessoRepresentatividade).toBeVisible();

    expect(guarda.tentativas()).toBe(0);
  });

  test('deve abrir o formulário de Acesso Normal com CNPJ, CPF e senha', async ({ page }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const portalFornecedor = new PortalFornecedorPage(page);

    await portalFornecedor.goto();
    await portalFornecedor.expectCarregada();
    await portalFornecedor.botaoAcessoNormal.click();

    const form = portalFornecedor.getFormularioAcessoNormal();
    await expect(form.cnpjEmpresa).toBeVisible();
    await expect(form.cpfUsuario).toBeVisible();
    await expect(form.senha).toBeVisible();
    await expect(form.botaoEntrar).toBeVisible();
    await expect(form.botaoVoltar).toBeVisible();

    expect(guarda.tentativas()).toBe(0);
  });

  test('deve abrir o formulário de Acesso Administrador com cadastro e recuperação de senha', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const portalFornecedor = new PortalFornecedorPage(page);

    await portalFornecedor.goto();
    await portalFornecedor.expectCarregada();
    await portalFornecedor.botaoAcessoAdministrador.click();

    const form = portalFornecedor.getFormularioAcessoAdministrador();
    await expect(form.cpfCnpj).toBeVisible();
    await expect(form.senha).toBeVisible();
    await expect(form.botaoEntrar).toBeVisible();
    await expect(form.linkCadastrar).toBeVisible();
    await expect(form.botaoPrimeiroAcesso).toBeVisible();

    expect(guarda.tentativas()).toBe(0);
  });

  test('deve abrir o diálogo de Acesso via Representatividade', async ({ page }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const portalFornecedor = new PortalFornecedorPage(page);

    await portalFornecedor.goto();
    await portalFornecedor.expectCarregada();
    await portalFornecedor.botaoAcessoRepresentatividade.click();

    const dialogo = portalFornecedor.getDialogoRepresentatividade();
    await expect(dialogo.dialogo).toBeVisible();
    await expect(dialogo.campoCpfCnpjRepresentado).toBeVisible();
    await expect(dialogo.botaoRepresentar).toBeVisible();
    await expect(dialogo.botaoCancelar).toBeVisible();

    // Diferente dos outros dois acessos, este NÃO navega — permanece na mesma landing por
    // trás do diálogo.
    await expect(portalFornecedor.titulo).toBeVisible();

    expect(guarda.tentativas()).toBe(0);
  });
});

test.describe('Acesso não autenticado ao Portal do Fornecedor', () => {
  // Contexto anônimo: prova o controle de acesso de verdade — a rota exige sessão da
  // PLATAFORMA, não apenas credencial de fornecedor.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('deve exigir autenticação da plataforma e não expor o portal do fornecedor', async ({
    page,
    loginPage,
  }) => {
    const portalFornecedor = new PortalFornecedorPage(page);

    await portalFornecedor.goto();

    await expect(page).toHaveTitle(TITULO_LOGIN);
    await expect(loginPage.campoUsuario).toBeVisible();
    await expect(portalFornecedor.titulo).toHaveCount(0);
    await expect(portalFornecedor.botaoAcessoNormal).toHaveCount(0);
  });
});
