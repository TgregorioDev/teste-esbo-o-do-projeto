// @ts-check

/**
 * Formulário clássico de Solicitação de Compras, iniciado direto por URL
 * (`/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`).
 *
 * É um ponto de entrada DIFERENTE do modal aberto a partir do Portal de Acompanhamento de
 * Contratos (`components/SolicitacaoCompraModal.js`): aqui o formulário nasce em branco e é
 * preenchido à mão, sem contrato de origem.
 *
 * Confirmado em campo:
 * - Título do documento: `Cassi - Fluig Plataforma - Movimentar Solicitação` (compartilhado
 *   por qualquer processo iniciado por essa rota — não distingue Compras de Cotação).
 * - O formulário em si vive DENTRO de um iframe (`iframe[title="Visualizador"]`); os botões
 *   de rodapé (Enviar/Opções) ficam FORA do iframe, na página host.
 * - Bloco "Identificação do Processo / Solicitante": Solicitante, Email do Solicitante,
 *   Data da Solicitação e Hora da Solicitação vêm PRÉ-PREENCHIDOS e são somente leitura.
 *   Nº do Processo Fluig é a exceção: nasce vazio (placeholder "Gerado ao Movimentar") —
 *   só é atribuído quando o processo é efetivamente movimentado.
 * - Bloco "Identificação da Entidade / Solicitação": Nº da Solicitação ERP, Nº da Cotação
 *   ERP, Código da Filial, Nome da Filial (combobox pesquisável) e Data de Emissão nascem
 *   vazios; Justificativa para a Solicitação é o campo de texto livre.
 * - Bloco de produtos: "Adicionar Produto" insere uma linha com combobox de Produto/Serviço
 *   e, dentro dela, "Adicionar Centro de Custo" abre o rateio (Item, Rateio %, Classe Valor,
 *   Centro de Custo) do item — alcançável sem nunca acionar Enviar.
 */
export const ROTA_SOLICITACAO_COMPRAS = '/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras';

/** Título do documento para qualquer processo iniciado por `pageworkflowview`. */
export const TITULO_MOVIMENTAR_SOLICITACAO = 'Cassi - Fluig Plataforma - Movimentar Solicitação';

export class FormularioSolicitacaoCompraPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    /** O formulário renderiza dentro de um iframe — todo locator de campo vive aqui dentro. */
    this.frame = page.frameLocator('iframe[title="Visualizador"]');

    this.headingInicio = page.getByRole('heading', { name: 'Início', level: 2 });
    this.headingFormulario = this.frame.getByRole('heading', { name: 'Solicitação de Compras', level: 1 });

    // Identificação do Processo / Solicitante — pré-preenchidos, somente leitura.
    this.campoNumeroProcesso = this.frame.getByRole('spinbutton', { name: /Nº do Processo Fluig/ });
    this.campoSolicitante = this.frame.getByRole('textbox', { name: 'Solicitante *', exact: true });
    this.campoEmailSolicitante = this.frame.getByRole('textbox', { name: 'Email do Solicitante *' });
    this.campoDataSolicitacao = this.frame.getByRole('textbox', { name: 'Data da Solicitação *' });
    this.campoHoraSolicitacao = this.frame.getByRole('textbox', { name: 'Hora da Solicitação *' });

    // Identificação da Entidade / Solicitação — nascem vazios.
    this.headingEntidade = this.frame.getByRole('heading', { name: 'Identificação da Entidade / Solicitação' });
    this.campoNumeroSolicitacaoErp = this.frame.getByRole('textbox', { name: 'Nº da Solicitação ERP *' });
    this.campoNumeroCotacaoErp = this.frame.getByRole('textbox', { name: 'Nº da Cotação ERP *' });
    this.campoCodigoFilial = this.frame.getByRole('textbox', { name: 'Código da Filial *' });
    this.campoDataEmissao = this.frame.getByRole('textbox', { name: 'Data de Emissão *' });
    this.campoJustificativa = this.frame.getByRole('textbox', { name: 'Justificativa para a Solicitação *' });

    // Identificação do(s) Produto(s)/Serviço(s).
    this.headingProdutos = this.frame.getByRole('heading', { name: 'Produtos/Serviços da Solicitação' });
    this.botaoAdicionarProduto = this.frame.getByRole('button', { name: 'Adicionar Produto' });
    this.botaoDownloadPlanilhaRateio = this.frame.getByRole('button', { name: 'Download Planilha de Rateio Modelo' });
    this.botaoUploadPlanilhaRateio = this.frame.getByRole('button', { name: 'Upload Planilha de Rateio Preenchida' });

    // Linha de produto, criada por `adicionarProduto()`.
    this.campoProdutoServico = this.frame.getByRole('searchbox', { name: 'Produto/Serviço' });
    this.botaoAdicionarCentroCusto = this.frame.getByRole('button', { name: 'Adicionar Centro de Custo' });

    // Rateio do item, criado por `adicionarCentroCusto()`.
    this.headingRateio = this.frame.getByRole('heading', { name: /Rateio por Centro de Custo/ });
    this.campoRateio = this.frame.getByRole('textbox', { name: 'Rateio *' });

    // Rodapé — FORA do iframe.
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar' });

    // Diálogo de erro de validação ao Enviar — renderizado no HOST da página, fora do
    // iframe do formulário. Confirmado em campo: com o formulário vazio, o Fluig valida
    // ANTES de qualquer requisição de escrita e recusa com esta mensagem exata.
    this.dialogErro = page.getByRole('dialog').filter({ hasText: 'Erro' });
    this.botaoOkErro = this.dialogErro.getByRole('button', { name: 'Ok, entendi' });

    // Segundo diálogo, DENTRO do iframe: algumas validações (ex.: rateio) mostram, além do
    // "Erro" do host, um segundo aviso "Atenção:" (SweetAlert do próprio formulário) depois
    // que o primeiro é fechado. Confirmado em campo: o texto NÃO é idêntico ao do primeiro
    // diálogo ("deve ser igual a 100%" vs. "não podem ser inferior a 100%") — são dois
    // avisos distintos para a mesma causa, não uma duplicação do mesmo texto.
    this.dialogAtencao = this.frame.getByRole('dialog').filter({ hasText: 'Atenção:' });
    this.botaoOkAtencao = this.dialogAtencao.getByRole('button', { name: 'OK', exact: true });
  }

  async goto() {
    await this.page.goto(ROTA_SOLICITACAO_COMPRAS, { waitUntil: 'domcontentloaded' });
  }

  /** Pré-condição: o formulário abriu e os campos pré-preenchidos já carregaram. */
  async expectAberto() {
    await this.headingInicio.waitFor({ state: 'visible' });
    await this.headingFormulario.waitFor({ state: 'visible' });
    // "Solicitante" só vem preenchido depois que o Fluig resolve o usuário logado —
    // esperar pelo valor, não por tempo, evita ler o campo ainda vazio.
    await this.page.waitForFunction(
      () => {
        const iframe = document.querySelector('iframe[title="Visualizador"]');
        const doc = /** @type {HTMLIFrameElement} */ (iframe)?.contentDocument;
        const campo = /** @type {HTMLInputElement | null} */ (doc?.getElementById('usuarioSolicitante'));
        return !!campo?.value;
      },
      { timeout: 30_000 },
    );
  }

  /**
   * Insere uma linha de Produto/Serviço. Não requer nenhum salvamento prévio — o item vive
   * apenas no DOM até o Enviar (que esta suíte nunca aciona com dados suficientes para passar).
   */
  async adicionarProduto() {
    await this.botaoAdicionarProduto.click();
    await this.campoProdutoServico.waitFor({ state: 'visible' });
  }

  /** Abre o rateio por Centro de Custo do item recém-adicionado. */
  async adicionarCentroCusto() {
    await this.botaoAdicionarCentroCusto.click();
    await this.headingRateio.waitFor({ state: 'visible' });
    await this.campoRateio.waitFor({ state: 'visible' });
  }

  /** @param {string} percentual ex.: "90" */
  async preencherRateio(percentual) {
    await this.campoRateio.fill(percentual);
  }

  /**
   * Aciona Enviar.
   *
   * ⚠️ Com todos os campos obrigatórios válidos e rateio fechando 100%, isto CRIA uma
   * solicitação real no ambiente — registro que não tem exclusão disponível. Toda spec desta
   * suíte que chama `enviar()` faz isso justamente para provar que a validação BLOQUEIA antes
   * da escrita, com `bloquearCriacaoDeSolicitacao` instalado e `guarda.tentativas()` afirmado.
   */
  async enviar() {
    await this.botaoEnviar.click();
  }
}
