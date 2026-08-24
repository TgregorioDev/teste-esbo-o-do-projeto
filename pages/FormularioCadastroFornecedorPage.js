// @ts-check

/** Rota de início do processo "Cadastro de Fornecedor", confirmada em campo. */
const ROTA_CADASTRO_FORNECEDOR = '/portal/p/1/pageworkflowview?processID=wf_cadastro_fornecedor';

/**
 * Formulário "Cadastro de Fornecedor" (`wf_cadastro_fornecedor`), iniciado via
 * `/portal/p/1/pageworkflowview?processID=wf_cadastro_fornecedor`.
 *
 * Mesma casca dos demais processos (ver `docs/mapa-do-ambiente.md` > Início de processo por
 * URL): título `Cassi - Fluig Plataforma - Movimentar Solicitação`, heading "Início", abas
 * Formulário/Informações/Histórico/Anexos e botão "Enviar" na página hospedeira; o
 * formulário de negócio vive no iframe `#workflowView-cardViewer`.
 *
 * Campos confirmados já visíveis na abertura (sem precisar selecionar nada antes — ao
 * contrário do Faturamento de Contratos): documento (CNPJ/CPF), razão social, nome
 * fantasia, endereço completo e contato. Código/Loja/Tipo do Fornecedor vêm somente
 * leitura; Razão Social, Nome Fantasia e os campos de endereço/contato são editáveis.
 */
export class FormularioCadastroFornecedorPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.frame = page.frameLocator('#workflowView-cardViewer');

    // Casca do processo (página hospedeira, fora do iframe)
    this.headingInicio = page.getByRole('heading', { name: 'Início', level: 2 });
    this.abaFormulario = page.getByRole('link', { name: 'Formulário' });
    this.abaInformacoes = page.getByRole('link', { name: 'Informações' });
    this.abaHistorico = page.getByRole('link', { name: /Histórico/ });
    this.abaAnexos = page.getByRole('link', { name: /Anexos/ });
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar' });

    // Título do formulário dentro do iframe — sinal de que o form de negócio carregou
    this.tituloFormulario = this.frame.getByRole('heading', {
      name: 'Cadastro de Fornecedor',
      level: 1,
    });

    // Documento — o campo espelho (`_txt_cgc_infForn`) não tem <label> associado; o
    // gancho estável observado em campo é o placeholder mascarado.
    this.campoDocumento = this.frame.getByPlaceholder('99.999.999/9999-99');

    // Informações do Fornecedor
    this.campoRazaoSocial = this.frame.getByRole('textbox', { name: /Razão.*social/i });
    this.campoNomeFantasia = this.frame.getByRole('textbox', { name: /Nome.*Fantasia/i });

    // Endereço
    this.campoLogradouro = this.frame.getByRole('textbox', { name: 'Logradouro' });
    this.campoBairro = this.frame.getByRole('textbox', { name: 'Bairro' });
    this.campoEstado = this.frame.getByRole('combobox', { name: 'Estado' });
    this.campoMunicipio = this.frame.getByRole('textbox', { name: 'Munícipio' });
    this.campoCep = this.frame.getByRole('textbox', { name: 'CEP' });

    // Contato
    this.campoTelefone = this.frame.getByRole('textbox', { name: 'Telefone' });
    this.campoCelular = this.frame.getByRole('textbox', { name: 'Celular' });
    this.campoEmail = this.frame.getByRole('textbox', { name: 'E-mail' });
  }

  async goto() {
    await this.page.goto(ROTA_CADASTRO_FORNECEDOR, { waitUntil: 'domcontentloaded' });
  }

  /** Pré-condição: a casca do processo e o formulário dentro do iframe carregaram. */
  async expectAberto() {
    await this.headingInicio.waitFor({ state: 'visible' });
    await this.botaoEnviar.waitFor({ state: 'visible' });
    await this.tituloFormulario.waitFor({ state: 'visible' });
  }
}
