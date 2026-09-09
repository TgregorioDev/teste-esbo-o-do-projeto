// @ts-check

/** Rota do Portal do Fornecedor. */
const ROTA_PORTAL_FORNECEDOR = '/portal/p/1/portal_fornecedor';

/**
 * Portal do Fornecedor (`/portal/p/1/portal_fornecedor`).
 *
 * Confirmado em campo: a rota exige sessão da PLATAFORMA — anônimo cai na tela de Login
 * (título `Login`, sem nenhum conteúdo do portal). A credencial de FORNECEDOR é outra coisa,
 * e a automação não a possui.
 *
 * ## O modelo de acesso MUDOU (medido em 09/09/2026, ambiente `caixade213859`)
 *
 * A tela anterior tinha um heading *"Selecione o tipo de acesso."* e três botões — **Acesso
 * Normal** (CNPJ da empresa + CPF do usuário + senha), **Acesso Administrador** (CPF/CNPJ +
 * senha) e **Acesso via Representatividade**. Nada disso existe mais.
 *
 * Hoje a landing traz **um login único**: o alerta *"Informe o seu CPF/CNPJ e senha."*, os
 * campos `CPF/CNPJ:` (`#txt_login`) e `Senha:` (`#txt_senha`), o botão **Entrar**, o link
 * **Cadastrar** (que aponta para o cadastro público) e dois botões que abrem DIÁLOGO sem
 * navegar:
 *
 * - **Primeiro acesso / Redefinir Senha** → *"Informe seu CPF ou CNPJ"* + **Enviar link**.
 * - **Acesso via Representatividade** → *"Informe o CPF ou CNPJ a ser representado."* +
 *   **Representar**. Este é o único dos três acessos antigos que sobreviveu com a mesma forma.
 *
 * A leitura de negócio importa para quem for escrever caso novo: a distinção
 * empresa × usuário (CNPJ da empresa + CPF de quem opera) **desapareceu da tela de entrada**.
 * Onde um caso do catálogo falar em "Acesso Normal" ou "Acesso Administrador", é este login
 * único que ele encontra agora.
 *
 * ## A landing depende de um POST que a guarda precisa deixar passar
 *
 * O portal só monta depois de `POST /java_gestao_contrato/rest-acesso/request/geratoken`
 * (neste ambiente; era `/cassi_rest/api/rest/cassi/compras/1/geratoken` no anterior).
 * `utils/guarda-criacao.js` lista os dois caminhos como leitura — sem isso a guarda aborta a
 * chamada, a landing nunca aparece e o teste reprova por um timeout que ele mesmo causou.
 *
 * A suíte cobre só a parte de LEITURA: que os caminhos de entrada existem e pedem o que devem
 * pedir. Nenhum teste preenche senha nem clica em "Entrar"/"Representar" — não há credencial
 * de fornecedor, e simular uma seria tentativa de autenticação contra o ambiente do cliente.
 */
export class PortalFornecedorPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.titulo = page.getByRole('heading', { name: 'Bem vindo ao Portal de Compras e Contratações!' });
    this.subtitulo = page.getByRole('heading', { name: 'Somos a CASSI' });

    /** Alerta que instrui o fornecedor sobre o que informar. */
    this.instrucaoDeLogin = page.getByText(/Informe o seu CPF\/CNPJ e senha/i);

    // Login único. Os ids são o gancho estável: os rótulos são `<generic>` fora de `<label>`,
    // então `getByRole('textbox', { name })` depende de aria-label que a tela nem sempre traz.
    this.campoCpfCnpj = page.locator('#txt_login');
    this.campoSenha = page.locator('#txt_senha');
    this.botaoEntrar = page.getByRole('button', { name: 'Entrar' });
    this.linkCadastrar = page.getByRole('link', { name: 'Cadastrar' });

    this.botaoPrimeiroAcesso = page.getByRole('button', { name: 'Primeiro acesso / Redefinir Senha' });
    this.botaoAcessoRepresentatividade = page.getByRole('button', { name: 'Acesso via Representatividade' });

    /**
     * O reCAPTCHA da tela de entrada. Fica exposto de propósito: é ele que decide se um
     * fornecedor consegue autenticar, e neste ambiente ele responde *"ERROR for site owner:
     * Invalid domain for site key"*.
     */
    this.captcha = page.frameLocator('iframe[title*="reCAPTCHA" i], iframe[src*="recaptcha"]');
    this.iframeCaptcha = page.locator('iframe[src*="recaptcha"], iframe[title*="reCAPTCHA" i]');
  }

  async goto() {
    await this.page.goto(ROTA_PORTAL_FORNECEDOR, { waitUntil: 'domcontentloaded' });
  }

  /** Pré-condição: landing do portal (sessão de plataforma autenticada) carregou. */
  async expectCarregada() {
    await this.titulo.waitFor({ state: 'visible' });
  }

  /**
   * Diálogo de "Primeiro acesso / Redefinir Senha" — abre sobre a landing, sem navegar.
   * @returns {{ dialogo: import('@playwright/test').Locator, campoCpfCnpj: import('@playwright/test').Locator, botaoEnviarLink: import('@playwright/test').Locator, botaoCancelar: import('@playwright/test').Locator }}
   */
  getDialogoPrimeiroAcesso() {
    const dialogo = this.page.getByRole('dialog').filter({ hasText: /Primeiro acesso/i });
    return {
      dialogo,
      campoCpfCnpj: dialogo.locator('#_cnpjCpf'),
      botaoEnviarLink: dialogo.getByRole('button', { name: 'Enviar link' }),
      botaoCancelar: dialogo.getByRole('button', { name: 'Cancelar' }),
    };
  }

  /**
   * Diálogo de "Acesso via Representatividade" — o único dos três acessos antigos que
   * sobreviveu com a mesma forma.
   * @returns {{ dialogo: import('@playwright/test').Locator, campoCpfCnpjRepresentado: import('@playwright/test').Locator, botaoRepresentar: import('@playwright/test').Locator, botaoCancelar: import('@playwright/test').Locator }}
   */
  getDialogoRepresentatividade() {
    const dialogo = this.page.getByRole('dialog').filter({ hasText: /Representatividade/i });
    return {
      dialogo,
      campoCpfCnpjRepresentado: dialogo.locator('#_cnpjCpf'),
      botaoRepresentar: dialogo.getByRole('button', { name: 'Representar' }),
      botaoCancelar: dialogo.getByRole('button', { name: 'Cancelar' }),
    };
  }
}
