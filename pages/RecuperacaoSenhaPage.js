// @ts-check

/**
 * Fluxo de recuperação de senha da tela de login do Fluig.
 *
 * Na prática é o MESMO card de login (`fluig-card`) alternando entre formulários ocultos
 * via classe `fs-display-none`: pedir login/e-mail, aviso de e-mail enviado, redefinição
 * (só alcançável com token válido) e link expirado. Nenhuma dessas transições é navegação
 * de página — a URL e o título (`Login`) não mudam; por isso os locators dependem de
 * estado visível, nunca de URL.
 *
 * Particularidade que define o caso de token inválido/adulterado: o link de redefinição
 * enviado por e-mail aponta para a MESMA URL da tela de login
 * (`/portal/p/1/home?token=<token>&user=<login>`). Ao carregar, um script inline dispara
 * `GET /authentication/api/v1/tokens/valid?token=...`; a resposta `{ "valid": false }`
 * (confirmada em campo — HTTP 200, nunca 4xx) troca o formulário de login pelo aviso de
 * link expirado e NUNCA exibe o formulário de nova senha. Consumir um token de verdade
 * trocaria a senha do usuário de teste — por isso este Page Object só cobre o caminho do
 * token inválido/adulterado.
 */
export class RecuperacaoSenhaPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.linkEsqueciSenha = page.getByRole('link', { name: 'Esqueceu sua senha?' });

    // Formulário "Esqueceu sua senha?" — pede login ou e-mail.
    this.headingEsqueciSenha = page.getByRole('heading', { name: 'Esqueceu sua senha?' });
    this.campoLoginEmail = page.getByRole('textbox', { name: 'Login/e-mail' });
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar' });
    // Mensagem de campo obrigatório: um <p> sem role próprio (sem role=alert) — o único
    // gancho estável é o texto, que é semanticamente apropriado aqui (getByText).
    this.mensagemCampoObrigatorio = page.getByText('Digite seu login antes de enviar');

    // Confirmação "Verifique seu e-mail" — exibida após o envio bem-sucedido do token.
    this.headingVerifiqueEmail = page.getByRole('heading', { name: 'Verifique seu e-mail' });
    this.mensagemVerificacaoEmail = page.getByText(
      'Se esse login está associado à uma conta, você receberá um e-mail com instruções.',
    );

    // Aviso "Link expirado" — exibido quando o token da URL é inválido/expirado/adulterado.
    this.headingLinkExpirado = page.getByRole('heading', { name: 'Link expirado' });
    this.mensagemLinkExpirado = page.getByText(
      'Este acesso ultrapassou o limite de 24 horas.',
    );

    // Formulário de nova senha — só deve ficar VISÍVEL com token válido. Existe sempre no
    // DOM (o card é um único template estático com todos os formulários pré-renderizados),
    // então a prova de que o token inválido não libera a troca é visibilidade, não presença.
    this.campoNovaSenha = page.getByPlaceholder('Nova senha');
  }

  /** Abre a tela de login e navega para o formulário "Esqueceu sua senha?". */
  async abrirFluxoRecuperacao() {
    await this.page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
    await this.linkEsqueciSenha.waitFor({ state: 'visible' });
    await this.linkEsqueciSenha.click();
    await this.headingEsqueciSenha.waitFor({ state: 'visible' });
  }

  /**
   * Preenche o login/e-mail e envia, aguardando a resposta real do endpoint de emissão de
   * token — nunca tempo fixo.
   *
   * @param {string} loginOuEmail
   * @returns {Promise<import('@playwright/test').Response>}
   */
  async solicitarToken(loginOuEmail) {
    await this.campoLoginEmail.fill(loginOuEmail);

    const [resposta] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          /\/authentication\/api\/v1\/tokens$/.test(new URL(response.url()).pathname),
      ),
      this.botaoEnviar.click(),
    ]);

    return resposta;
  }

  /** Clica em Enviar sem preencher o campo — dispara a validação client-side. */
  async enviarComCampoVazio() {
    await this.botaoEnviar.click();
  }

  /**
   * Acessa a tela de login com um token de redefinição na URL (o formato exato do link
   * enviado por e-mail), aguardando a resposta real da validação do token.
   *
   * @param {string} token
   * @param {string} usuario
   * @returns {Promise<import('@playwright/test').Response>}
   */
  async acessarComToken(token, usuario) {
    const url = `/portal/p/1/home?token=${encodeURIComponent(token)}&user=${encodeURIComponent(usuario)}`;

    const [resposta] = await Promise.all([
      this.page.waitForResponse((response) =>
        response.url().includes('/authentication/api/v1/tokens/valid'),
      ),
      this.page.goto(url, { waitUntil: 'domcontentloaded' }),
    ]);

    return resposta;
  }
}
