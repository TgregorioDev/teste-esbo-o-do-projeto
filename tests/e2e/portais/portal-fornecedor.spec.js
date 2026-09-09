// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { TITULO_LOGIN } from '../../../config/ambiente.js';
import { PortalFornecedorPage } from '../../../pages/PortalFornecedorPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * Portal do Fornecedor — caso CT-PFN-01-H (parcial) + controle de acesso.
 *
 * ## Reescrito em 09/09/2026 para o modelo de acesso deste ambiente
 *
 * A versão anterior afirmava sobre **três níveis de acesso** — *Acesso Normal*, *Acesso
 * Administrador* e *Acesso via Representatividade*, atrás de um heading "Selecione o tipo de
 * acesso.". Medido no ambiente `caixade213859`: esse heading e os dois primeiros botões não
 * existem mais. A landing traz um **login único** (CPF/CNPJ + Senha) e mantém apenas a
 * Representatividade como acesso à parte.
 *
 * Os testes foram reescritos contra o que a tela é hoje, e não corrigidos para "ficar verdes":
 * o que se afirma continua sendo o mesmo em substância — que os caminhos de entrada do
 * fornecedor existem e pedem o que devem pedir.
 *
 * Continua FORA de escopo, e por motivo de política, não de tela: preencher senha, clicar em
 * "Entrar"/"Representar"/"Enviar link". Não há credencial de fornecedor, e simular uma seria
 * tentativa de autenticação contra o ambiente do cliente. CT-PFN-01-S1/S2, CT-PFN-02 a
 * CT-PFN-07 seguem exigindo essa credencial.
 */
test.describe('Acesso ao Portal do Fornecedor (autenticado na plataforma)', () => {
  test('a landing oferece o login único do fornecedor e os caminhos de cadastro e recuperação', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const portalFornecedor = new PortalFornecedorPage(page);

    await portalFornecedor.goto();
    await portalFornecedor.expectCarregada();

    await expect(page).toHaveTitle('Cassi - Fluig Plataforma - Portal do Fornecedor');
    await expect(portalFornecedor.titulo).toBeVisible();
    await expect(portalFornecedor.subtitulo).toBeVisible();
    await expect(portalFornecedor.instrucaoDeLogin).toBeVisible();

    // O que o fornecedor precisa para entrar, e as duas saídas para quem ainda não consegue.
    await expect(portalFornecedor.campoCpfCnpj).toBeVisible();
    await expect(portalFornecedor.campoSenha).toBeVisible();
    await expect(portalFornecedor.botaoEntrar).toBeVisible();
    await expect(
      portalFornecedor.linkCadastrar,
      'quem ainda não é cadastrado precisa chegar ao cadastro a partir daqui',
    ).toBeVisible();
    await expect(
      portalFornecedor.botaoPrimeiroAcesso,
      'quem é cadastrado mas nunca acessou (ou esqueceu a senha) precisa deste caminho',
    ).toBeVisible();
    await expect(portalFornecedor.botaoAcessoRepresentatividade).toBeVisible();

    expect(guarda.tentativas()).toBe(0);
  });

  test('o diálogo de Primeiro acesso / Redefinir Senha pede o CPF ou CNPJ e envia link', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const portalFornecedor = new PortalFornecedorPage(page);

    await portalFornecedor.goto();
    await portalFornecedor.expectCarregada();
    await portalFornecedor.botaoPrimeiroAcesso.click();

    const dialogo = portalFornecedor.getDialogoPrimeiroAcesso();
    await expect(dialogo.dialogo).toBeVisible();
    await expect(dialogo.campoCpfCnpj).toBeVisible();
    await expect(dialogo.botaoEnviarLink).toBeVisible();
    await expect(dialogo.botaoCancelar).toBeVisible();

    // Abre SOBRE a landing, sem navegar — a tela de trás continua ali.
    await expect(portalFornecedor.titulo).toBeVisible();

    // Nada é enviado: o link de redefinição dispararia e-mail para o titular do documento.
    expect(guarda.tentativas()).toBe(0);
  });

  test('o diálogo de Acesso via Representatividade pede o CPF/CNPJ a ser representado', async ({
    page,
  }) => {
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

    await expect(portalFornecedor.titulo).toBeVisible();

    expect(guarda.tentativas()).toBe(0);
  });

  /**
   * O captcha da entrada do fornecedor.
   *
   * Medido em 09/09/2026: o `iframe` do reCAPTCHA da landing renderiza *"ERRO para o
   * proprietário do site: domínio inválido para a chave do site"* — a chave do captcha não está
   * registrada para o domínio `caixade213859`. Um captcha que não valida é uma porta fechada: o
   * fornecedor não tem como provar que não é robô e, portanto, não entra.
   *
   * ⚠️ A mensagem sai no IDIOMA DO NAVEGADOR. A primeira versão deste teste procurava só o
   * texto em inglês ("Invalid domain for site key"), que é o que se vê num navegador em `en`, e
   * passava verde contra um captcha quebrado — a suíte roda em `pt-BR` por decisão do config.
   * O padrão abaixo cobre as duas formas.
   *
   * `@bug`: escrito contra o comportamento esperado (o captcha da tela de entrada precisa
   * funcionar no domínio em que está publicado), reprova hoje, fica verde sozinho quando a
   * chave for registrada para este domínio.
   */
  test('@bug o reCAPTCHA da entrada do fornecedor deve estar configurado para este domínio', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const portalFornecedor = new PortalFornecedorPage(page);

    await portalFornecedor.goto();
    await portalFornecedor.expectCarregada();
    await expect(portalFornecedor.iframeCaptcha.first()).toBeAttached();

    const textoDoCaptcha = await portalFornecedor.captcha
      .locator('body')
      .innerText()
      .catch(() => '(não foi possível ler o conteúdo do captcha)');

    test.info().annotations.push({
      type: 'captcha-portal-fornecedor',
      description: textoDoCaptcha.replace(/\s+/g, ' ').slice(0, 200),
    });

    expect(
      textoDoCaptcha.replace(/\s+/g, ' '),
      'o reCAPTCHA da landing recusa o domínio em que o portal está publicado — sem captcha ' +
        'válido o fornecedor não consegue autenticar, e o portal inteiro fica inacessível a ele',
    ).not.toMatch(/Invalid domain for site key|ERROR for site owner|dom[íi]nio inv[áa]lido|ERRO para o propriet[áa]rio/i);

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
    await expect(portalFornecedor.campoCpfCnpj).toHaveCount(0);
  });
});
