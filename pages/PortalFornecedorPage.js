// @ts-check

/** Rota do Portal do Fornecedor. */
const ROTA_PORTAL_FORNECEDOR = '/portal/p/1/portal_fornecedor';

/**
 * Portal do Fornecedor (`/portal/p/1/portal_fornecedor`).
 *
 * Confirmado em campo: a rota exige sessão da PLATAFORMA — anônimo cai na tela de Login
 * (título `Login`, sem nenhum conteúdo do portal). Autenticado, a landing oferece três
 * níveis de acesso de FORNECEDOR (uma credencial totalmente diferente da sessão da
 * plataforma, que a automação não possui):
 *
 * - **Acesso Normal** → formulário com CNPJ da empresa / CPF do usuário / Senha.
 * - **Acesso Administrador** → formulário com CPF/CNPJ / Senha, mais os links
 *   "Cadastrar" e "Primeiro acesso / Redefinir Senha".
 * - **Acesso via Representatividade** → abre um DIÁLOGO (não navega) pedindo o CPF/CNPJ a
 *   ser representado, com os botões "Representar" e "Cancelar".
 *
 * A suíte cobre só a parte de LEITURA — confirma que cada botão leva ao formulário certo,
 * com os campos certos. Nenhum teste preenche CPF/CNPJ/senha nem clica em "Entrar" ou
 * "Representar": não há credencial de fornecedor real disponível, e simular uma seria uma
 * tentativa de autenticação contra o ambiente do cliente.
 */
export class PortalFornecedorPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.titulo = page.getByRole('heading', { name: 'Bem vindo ao Portal de Compras e Contratações!' });
    this.subtitulo = page.getByRole('heading', { name: 'Somos a CASSI' });
    this.tituloSelecaoAcesso = page.getByRole('heading', { name: 'Selecione o tipo de acesso.' });

    this.botaoAcessoNormal = page.getByRole('button', { name: 'Acesso Normal' });
    this.botaoAcessoAdministrador = page.getByRole('button', { name: 'Acesso Administrador' });
    this.botaoAcessoRepresentatividade = page.getByRole('button', { name: 'Acesso via Representatividade' });
  }

  async goto() {
    await this.page.goto(ROTA_PORTAL_FORNECEDOR, { waitUntil: 'domcontentloaded' });
  }

  /** Pré-condição: landing do portal (sessão de plataforma autenticada) carregou. */
  async expectCarregada() {
    await this.titulo.waitFor({ state: 'visible' });
  }

  /** Formulário aberto por "Acesso Normal". */
  getFormularioAcessoNormal() {
    return {
      cnpjEmpresa: this.page.getByRole('textbox', { name: 'CNPJ da empresa:' }),
      cpfUsuario: this.page.getByRole('textbox', { name: 'CPF do usuário:' }),
      senha: this.page.getByRole('textbox', { name: 'Senha:' }),
      botaoEntrar: this.page.getByRole('button', { name: 'Entrar' }),
      botaoVoltar: this.page.getByRole('button', { name: 'Voltar para tela inicial de Login' }),
    };
  }

  /** Formulário aberto por "Acesso Administrador". */
  getFormularioAcessoAdministrador() {
    return {
      cpfCnpj: this.page.getByRole('textbox', { name: 'CPF/CNPJ:' }),
      senha: this.page.getByRole('textbox', { name: 'Senha:' }),
      botaoEntrar: this.page.getByRole('button', { name: 'Entrar' }),
      linkCadastrar: this.page.getByRole('link', { name: 'Cadastrar' }),
      botaoPrimeiroAcesso: this.page.getByRole('button', { name: 'Primeiro acesso / Redefinir Senha' }),
      botaoVoltar: this.page.getByRole('button', { name: 'Voltar para tela inicial de Login' }),
    };
  }

  /** Diálogo aberto por "Acesso via Representatividade". */
  getDialogoRepresentatividade() {
    const dialogo = this.page.getByRole('dialog');
    return {
      dialogo,
      campoCpfCnpjRepresentado: dialogo.getByRole('textbox', {
        name: 'Informe o CPF ou CNPJ a ser representado.',
      }),
      botaoRepresentar: dialogo.getByRole('button', { name: 'Representar' }),
      botaoCancelar: dialogo.getByRole('button', { name: 'Cancelar' }),
    };
  }
}
