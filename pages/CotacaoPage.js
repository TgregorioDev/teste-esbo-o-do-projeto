// @ts-check
import { expect } from '@playwright/test';

/**
 * Formulário clássico de Cotação de Produtos e Serviços, iniciado direto por URL
 * (`/portal/p/1/pageworkflowview?processID=wf_cotacao_produtos_servicos`).
 *
 * Complementa `pages/FormularioCotacaoPage.js` (que só abre/lê e nunca aciona Enviar) com o
 * que este projeto precisa para tentar exercitar CT-COT-01/02: os controles de decisão
 * (Tipo de Frete, "Enviar para parecer técnico?") e o próprio Enviar.
 *
 * ## Achado de campo desta rodada (confirmado por inspeção do DOM, não por suposição)
 *
 * Inspecionando `readOnly`/`disabled` de TODOS os `input`/`textarea`/`select` do iframe
 * (`iframe[title="Visualizador"]`), o formulário avulso tem **três únicos controles
 * editáveis**: `sl_tipoDeFrete` (select "Tipo de Frete"), o radio `sw_parecerTecnico`
 * ("Enviar para parecer técnico? Sim/Não") e o radio `sw_devolveForn` ("Devolver ao
 * Fornecedor? Sim/Não"). TODOS os demais campos de negócio — CNPJ/CPF, Razão Social, Nome
 * Fantasia, endereço/contato do fornecedor, Nº da Cotação, Nº da SC do Fluig, Nº da SC do
 * ERP, Código/Nome da Filial, Comprador, Validade da Cotação, Validade da Proposta, a lista
 * de itens e os totais (Sub Total, IPI, Frete, Desconto, Pedido) — são `readonly` e nascem
 * vazios. Não existe nenhum botão de busca/seleção de fornecedor nesta tela.
 *
 * Isso confirma o que `docs/mapa-do-ambiente.md` e `pages/FormularioCotacaoPage.js` já
 * registravam: este ponto de entrada é um shell fora de contexto (ver
 * `cassi-portais-compras-urls` na memória do projeto) — não há caminho de UI, aqui, para
 * compor fornecedor, vínculos, itens ou totais de uma Cotação real.
 */
export const ROTA_COTACAO = '/portal/p/1/pageworkflowview?processID=wf_cotacao_produtos_servicos';

export class CotacaoPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    /** O formulário renderiza dentro de um iframe — todo locator de campo vive aqui dentro. */
    this.frame = page.frameLocator('iframe[title="Visualizador"]');

    this.headingInicio = page.getByRole('heading', { name: 'Início', level: 2 });
    this.headingFormulario = this.frame.getByRole('heading', { name: 'Cotação de Produtos/Serviços', level: 1 });

    // Bloco "Informações do Fornecedor" — todos confirmadamente readonly e vazios.
    this.campoCnpjCpf = this.frame.getByRole('textbox', { name: 'CNPJ/CPF *' });
    this.campoRazaoSocial = this.frame.getByRole('textbox', { name: 'Razão social *' });
    this.campoNomeFantasia = this.frame.getByRole('textbox', { name: 'Nome Fantasia*' });

    // Bloco "Identificação do(s) Produto(s)/Serviço(s)" — vínculos, também readonly/vazios.
    this.campoNumeroCotacao = this.frame.getByRole('textbox', { name: 'Nº da Cotação *' });
    this.campoNumeroScFluig = this.frame.getByRole('textbox', { name: 'Nº da SC do Fluig *' });
    this.campoNumeroScErp = this.frame.getByRole('textbox', { name: 'Nº da SC do ERP *' });
    this.campoCodigoFilial = this.frame.getByRole('textbox', { name: 'Código da Filial *' });
    this.campoComprador = this.frame.getByRole('textbox', { name: 'Comprador *', exact: true });
    this.campoValidadeCotacao = this.frame.getByRole('textbox', { name: 'Validade da Cotação *' });
    this.campoSubTotal = this.frame.getByRole('textbox', { name: 'Sub Total *' });
    this.campoValorTotalPedido = this.frame.getByRole('textbox', { name: 'Valor total do Pedido *' });

    // Únicos controles editáveis do shell.
    this.selectTipoFrete = this.frame.getByRole('combobox', { name: 'Tipo de Frete *' });
    this.radioParecerTecnicoSim = this.frame.getByRole('radio', { name: 'Sim' }).first();
    this.radioParecerTecnicoNao = this.frame.getByRole('radio', { name: 'Não' }).first();
    // O radio em si fica coberto pelo `<label>` estilizado — clicar no input diretamente
    // trava em "intercepts pointer events" (confirmado em execução real). O rótulo é o alvo
    // clicável de fato, e aciona o mesmo radio via `for`.
    this.rotuloParecerTecnicoSim = this.frame.locator('label[for="sw_parecerTecnicoSim"]');
    this.rotuloParecerTecnicoNao = this.frame.locator('label[for="sw_parecerTecnicoNao"]');

    // Rodapé e diálogo de validação — FORA do iframe, mesmo padrão de
    // `FormularioSolicitacaoCompraPage`.
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar' });
    this.dialogErro = page.getByRole('dialog').filter({ hasText: 'Erro' });
    this.botaoOkErro = this.dialogErro.getByRole('button', { name: 'Ok, entendi' });
  }

  async goto() {
    await this.page.goto(ROTA_COTACAO, { waitUntil: 'domcontentloaded' });
  }

  /** Pré-condição: o formulário de Cotação abriu completo. */
  async expectAberto() {
    await this.headingInicio.waitFor({ state: 'visible' });
    await this.headingFormulario.waitFor({ state: 'visible' });
  }

  /**
   * Marca o radio "Enviar para parecer técnico?".
   * @param {boolean} sim
   */
  async marcarEnviarParaParecerTecnico(sim) {
    await (sim ? this.rotuloParecerTecnicoSim : this.rotuloParecerTecnicoNao).click();
    await expect(sim ? this.radioParecerTecnicoSim : this.radioParecerTecnicoNao).toBeChecked();
  }

  /**
   * Aciona Enviar.
   *
   * ⚠️ Como o bloco de Fornecedor/vínculos/totais é `readonly` e nasce vazio, não há como
   * este método representar o caminho feliz (CT-COT-01-H/S1) — o que ele exercita é o
   * comportamento do Fluig diante de um envio sem esses obrigatórios preenchidos.
   */
  async enviar() {
    await this.botaoEnviar.click();
  }
}
