// @ts-check

/**
 * Formulário clássico de Cotação de Produtos e Serviços, iniciado direto por URL
 * (`/portal/p/1/pageworkflowview?processID=wf_cotacao_produtos_servicos`).
 *
 * Confirmado em campo:
 * - Título do documento: `Cassi - Fluig Plataforma - Movimentar Solicitação` (mesmo título
 *   compartilhado por qualquer processo iniciado por `pageworkflowview`).
 * - O formulário vive DENTRO de um iframe (`iframe[title="Visualizador"]`), igual ao
 *   formulário de Solicitação de Compras.
 * - Ao contrário da Solicitação de Compras, aqui NENHUM campo de
 *   "Identificação do Processo / Solicitante" vem pré-preenchido — nascem vazios.
 * - Bloco "Informações do Fornecedor": CNPJ/CPF, Razão Social, Nome Fantasia e todos os
 *   campos de endereço/contato são renderizados como `readonly`, e não existe nenhum botão
 *   de busca/seleção de fornecedor na tela. Não há caminho de UI para digitar ou alterar
 *   esses campos neste ponto de entrada — eles só existiriam preenchidos se o processo
 *   tivesse nascido vinculado a uma Solicitação de Compras já cotada.
 * - Bloco "Identificação do(s) Produto(s)/Serviço(s)": Nº da Cotação, Nº da SC do Fluig,
 *   Nº da SC do ERP, Código/Nome da Filial, Comprador, Validade da Cotação (também
 *   `readonly`), Tipo de Frete e a "Lista de Produtos/Serviços" com os totais
 *   (Sub Total, IPI, Frete, Desconto, Pedido).
 */
export const ROTA_COTACAO = '/portal/p/1/pageworkflowview?processID=wf_cotacao_produtos_servicos';

export class FormularioCotacaoPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    /** O formulário renderiza dentro de um iframe — todo locator de campo vive aqui dentro. */
    this.frame = page.frameLocator('iframe[title="Visualizador"]');

    this.headingInicio = page.getByRole('heading', { name: 'Início', level: 2 });
    this.headingFormulario = this.frame.getByRole('heading', { name: 'Cotação de Produtos/Serviços', level: 1 });

    // Informações do Fornecedor — somente leitura, sem botão de busca nesta rota.
    this.headingFornecedor = this.frame.getByRole('heading', { name: 'Informações do Fornecedor' });
    this.campoCnpjCpf = this.frame.getByRole('textbox', { name: 'CNPJ/CPF *' });
    this.campoRazaoSocial = this.frame.getByRole('textbox', { name: 'Razão social *' });
    this.campoNomeFantasia = this.frame.getByRole('textbox', { name: 'Nome Fantasia*' });

    // Identificação do(s) Produto(s)/Serviço(s).
    this.headingProdutos = this.frame.getByRole('heading', { name: 'Identificação do(s) Produto(s)/Serviço(s)' });
    this.campoNumeroCotacao = this.frame.getByRole('textbox', { name: 'Nº da Cotação *' });
    this.campoValidadeCotacao = this.frame.getByRole('textbox', { name: 'Validade da Cotação *' });
    this.headingListaProdutos = this.frame.getByRole('heading', { name: 'Lista de Produtos/Serviços' });
    this.campoSubTotal = this.frame.getByRole('textbox', { name: 'Sub Total *' });
    this.campoValorTotalPedido = this.frame.getByRole('textbox', { name: 'Valor total do Pedido *' });

    // Rodapé — FORA do iframe.
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar' });
  }

  async goto() {
    await this.page.goto(ROTA_COTACAO, { waitUntil: 'domcontentloaded' });
  }

  /** Pré-condição: o formulário de Cotação abriu completo. */
  async expectAberto() {
    await this.headingInicio.waitFor({ state: 'visible' });
    await this.headingFormulario.waitFor({ state: 'visible' });
    await this.headingFornecedor.waitFor({ state: 'visible' });
    await this.headingProdutos.waitFor({ state: 'visible' });
  }
}
