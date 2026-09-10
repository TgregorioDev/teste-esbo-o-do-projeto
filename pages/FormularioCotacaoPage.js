// @ts-check
import { faltaPreCondicao } from '../utils/pre-condicao.js';

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
    await this.expectSemFalhaDeErp();
  }

  /**
   * Declara pré-condição quando o formulário abre com a falha de integração do ERP.
   *
   * Medido em 09/09/2026 no ambiente `caixade213859`: o formulário renderiza a faixa
   * *"Não foi possível estabelecer comunicação com o ERP. Por favor verifique os serviços de
   * API e tente novamente."* e, como consequência, **todos** os campos de total (Sub Total,
   * IPI, Frete, Descontos, Valor total do Pedido) ficam vazios em vez de "0,00".
   *
   * Sem esta verificação o sintoma vira um vermelho enganoso — `toHaveValue('0,00')` recebendo
   * `""` parece defeito de cálculo da tela, quando a causa é a integração fora do ar. O mesmo
   * acontece com "Sub Total deveria ser readonly": readonly é o estado normal, e o teste
   * reprovava por um efeito colateral da falha, não pelo que se propôs a medir.
   */
  async expectSemFalhaDeErp() {
    // A faixa NÃO vem junto com os headings: medido, ela aparece ~8s depois deles, quando a
    // chamada ao ERP finalmente falha. Checar uma vez só (como a primeira versão fazia) lia a
    // tela antes do veredito e deixava o teste seguir para reprovar pelo sintoma — Sub Total
    // vazio em vez de "0,00".
    //
    // O padrão é FROUXO de propósito: casar a frase inteira não funciona porque o texto vem com
    // espaços não separáveis entre as palavras. `/comunica…/` basta e foi medido casando.
    //
    // Custo: até 15s a mais quando o formulário está saudável. É o preço de distinguir
    // "integração fora do ar" de "a tela calcula errado", que é a diferença entre ambiente e
    // defeito neste relatório.
    const falhou = await this.frame
      .getByText(/comunica[çc][ãa]o com o ERP/i)
      .first()
      .waitFor({ state: 'visible', timeout: 30_000 })
      .then(() => true)
      .catch(() => false);

    if (falhou) {
      faltaPreCondicao(
        '(ambiente): o formulário de Cotação abriu com a falha de integração do ERP ("Não foi ' +
          'possível estabelecer comunicação com o ERP"). Com ela, os oito campos de total ' +
          'nascem vazios e nada do que este formulário calcula é observável.',
      );
    }
  }
}
