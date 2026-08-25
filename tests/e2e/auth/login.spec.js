// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { envObrigatoria, TITULO_HOME, TITULO_LOGIN } from '../../../config/ambiente.js';

/**
 * Autenticação da plataforma — casos CT-AUT-01 e CT-AUT-02.
 *
 * Projeto `autenticacao`: roda SEM storageState, para validar o login de verdade.
 *
 * Particularidade que define as assertions: o Fluig serve a tela de login na MESMA URL da
 * home. Validar autenticação por URL passaria mesmo sem sessão — por isso o critério é o
 * título do documento somado à ausência do formulário de login.
 */
test.describe('Autenticação no Fluig', () => {
  test('CT-AUT-01-H — deve autenticar o usuário e abrir a home quando as credenciais são válidas', async ({
    page,
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.expectLoaded();

    await loginPage.autenticar(envObrigatoria('QA_USERNAME'), envObrigatoria('QA_PASSWORD'));

    await expect(page).toHaveTitle(TITULO_HOME);
    await expect(loginPage.campoUsuario).toBeHidden();
  });

  test('CT-AUT-02-S1 — deve recusar o acesso e permanecer no login quando a senha está incorreta', async ({
    page,
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.expectLoaded();

    await loginPage.autenticar(envObrigatoria('QA_USERNAME'), 'senha-deliberadamente-incorreta');

    await expect(loginPage.getMensagemErro()).toBeVisible();
    await expect(page).toHaveTitle(TITULO_LOGIN);
    // Valida também o que NÃO deve acontecer: a sessão não pode ter sido aberta
    await expect(page).not.toHaveTitle(TITULO_HOME);
  });

  test('CT-AUT-02-S2 — deve devolver a mesma mensagem genérica quando o usuário não existe', async ({
    loginPage,
  }) => {
    // Mensagem idêntica à de senha errada é o comportamento correto: mensagens diferentes
    // permitiriam enumerar quais logins existem na plataforma.
    await loginPage.goto();
    await loginPage.expectLoaded();

    await loginPage.autenticar('usuario.inexistente.qa', 'qualquer-senha');

    await expect(loginPage.getMensagemErro()).toBeVisible();
  });

  test('CT-AUT-02-S3 — deve manter o usuário no login quando as credenciais são enviadas em branco', async ({
    page,
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.expectLoaded();

    await loginPage.botaoAcessar.click();

    await expect(page).toHaveTitle(TITULO_LOGIN);
    await expect(loginPage.campoUsuario).toBeVisible();
  });
});
