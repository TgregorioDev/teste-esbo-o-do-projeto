// @ts-check

/**
 * Tela de login do Fluig.
 *
 * Duas particularidades da plataforma definem os locators e as assertions desta tela:
 *
 * 1. **O login é servido na MESMA URL da home** (`/portal/p/1/home`). A URL não distingue
 *    autenticado de anônimo — validar sessão por URL passaria mesmo sem sessão. O critério
 *    correto é o título do documento somado à presença/ausência do formulário.
 *
 * 2. **Os rótulos são traduzidos pelo locale do navegador.** Em `pt-BR` (o que o usuário
 *    real da Cassi recebe, e o que o `playwright.config.js` fixa) os campos são
 *    "Digite seu login" / "Digite sua senha" / "Acessar". Em `en-US` a mesma tela renderiza
 *    "Enter your login" / "Access". O locale é fixado no config de propósito: sem isso, a
 *    suíte quebraria conforme a máquina que a executa.
 */
export class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.campoUsuario = page.getByRole('textbox', { name: 'Digite seu login' });
    this.campoSenha = page.getByRole('textbox', { name: 'Digite sua senha' });
    this.botaoAcessar = page.getByRole('button', { name: 'Acessar' });
    this.linkEsqueciSenha = page.getByRole('link', { name: 'Esqueceu sua senha?' });
    this.mensagemErro = page.getByText('Usuário ou senha inválidos');
  }

  async goto() {
    await this.page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
  }

  /** Pré-condição: confirma que o formulário de login está disponível. */
  async expectLoaded() {
    await this.campoUsuario.waitFor({ state: 'visible' });
  }

  /**
   * @param {string} usuario
   * @param {string} senha
   */
  async autenticar(usuario, senha) {
    await this.campoUsuario.fill(usuario);
    await this.campoSenha.fill(senha);
    await this.botaoAcessar.click();
  }

  /** @returns {import('@playwright/test').Locator} */
  getMensagemErro() {
    return this.mensagemErro;
  }
}
