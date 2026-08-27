// @ts-check

/** Rota de início do processo "Rejeições de Pagamentos", confirmada em campo. */
const ROTA_REJEICOES_PAGAMENTOS =
  '/portal/p/1/pageworkflowview?processID=bpm_financeiro_rejeicoes_bancarias';

/**
 * Formulário "Rejeições de Pagamentos" (`bpm_financeiro_rejeicoes_bancarias`, categoria
 * **Financeiro**) — CT-FIN-01-H.
 *
 * Mesma casca dos demais processos (ver `docs/mapa-do-ambiente.md` > Início de processo por
 * URL): título `Cassi - Fluig Plataforma - Movimentar Solicitação`, heading "Início", abas
 * Formulário/Informações/Histórico/Anexos e botão *Enviar* na página hospedeira; o formulário
 * de negócio vive no iframe `#workflowView-cardViewer`.
 *
 * ## Medido em 27/08/2026
 *
 * O formulário monta com os campos do domínio — **não** vem vazio nem serve o template de
 * outro processo (ao contrário de `wf_automacao_admissao`, que serve o do Plano de Saúde):
 *
 * - identificação, toda `readonly`: Nº do Processo, Solicitante, Email do Solicitante,
 *   Data e Hora da Solicitação;
 * - **Motivo da Rejeição** — `<select class="zoom">` com campo de busca ao lado (padrão de zoom
 *   do Fluig, o mesmo do Cadastro de Fornecedor);
 * - **Observação da Rejeição** (`textarea`, editável) e **Finalizar?** (`select`, editável);
 * - bloco de resposta do responsável, todo `readonly` e vazio: Responsável, Email do
 *   Responsável, Data, Hora e "Resposta do Fiscal/Comprador".
 *
 * ⚠️ **Ids duplicados no DOM (8 deles, medidos).** O `id` do campo é repetido no
 * `div.has-feedback` que o embrulha — `#emailSolicitante` chega a casar **três** elementos (dois
 * wrappers e o input) — e o formulário ainda traz campos herdados do RDFC (`cpfCnpjPai`,
 * `nomeSolicitantePai`, `emissaoNF`, `nrSolicitacao`) e uma seção OCULTA intitulada
 * *"Identificação do Processo / Solicitante - Recepção de Documentos Fiscais"*. Por isso todo
 * locator desta classe é qualificado pela TAG (`input#…`, `select#…`, `textarea#…`): sem isso,
 * o modo estrito do Playwright derruba o teste em cima de um defeito de HTML do produto, e não
 * do comportamento sob teste.
 *
 * ⚠️ Abrir o formulário é leitura, mas o botão *Enviar* SUBMETE de verdade — nenhum método
 * desta classe o aciona.
 */
export class FormularioRejeicoesPagamentosPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.frame = page.frameLocator('#workflowView-cardViewer');

    // Casca do processo (página hospedeira, fora do iframe).
    this.headingInicio = page.getByRole('heading', { name: 'Início', exact: true });
    this.abaFormulario = page.getByRole('link', { name: /Formulário/ });
    this.abaInformacoes = page.getByRole('link', { name: /Informações/ });
    this.abaHistorico = page.getByRole('link', { name: /Histórico/ });
    this.abaAnexos = page.getByRole('link', { name: /Anexos/ });
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar', exact: true });
    this.dialogErro = page.getByRole('dialog');

    // Título do formulário de negócio — sinal de que o card carregou o processo CERTO.
    this.tituloFormulario = this.frame.getByRole('heading', {
      name: 'Financeiro - Rejeições de Pagamentos',
      exact: true,
    });
    this.secaoIdentificacao = this.frame.getByRole('heading', {
      name: 'Identificação do Processo / Solicitante',
      exact: true,
    });

    // Identificação (readonly). Locators QUALIFICADOS PELA TAG (`input#…`) porque o `id` do
    // campo é repetido no `div.has-feedback` que o embrulha — ver doc da classe.
    this.campoNumeroProcesso = this.frame.locator('input#WKNumProces');
    this.campoSolicitante = this.frame.locator('input#nomeSolicitante');
    this.campoEmailSolicitante = this.frame.locator('input#emailSolicitante');
    this.campoDataSolicitacao = this.frame.locator('input#dataSolicitacao');
    this.campoHoraSolicitacao = this.frame.locator('input#horaSolicitacao');

    // Domínio da rejeição — o que faz este processo ser este processo.
    this.campoMotivoRejeicao = this.frame.locator('select#zoomMotivo');
    this.campoObservacaoRejeicao = this.frame.locator('textarea#obsRejeicao');
    this.campoFinalizar = this.frame.locator('select#_finalizaRejeicao');

    // Resposta do responsável (readonly, nasce vazia).
    this.campoResponsavel = this.frame.locator('input#nomeSolicitanteResp');
    this.campoEmailResponsavel = this.frame.locator('input#emailSolicitanteResp');
    this.campoRespostaFiscalComprador = this.frame.locator('textarea#_obsResponsavel');

    /**
     * Seção fantasma do RDFC — existe no DOM e nasce oculta. Locator exposto de propósito:
     * é o achado, e um teste que o afirme documenta melhor do que um comentário.
     */
    this.secaoHerdadaDoRdfc = this.frame.locator(
      'h3:has-text("Identificação do Processo / Solicitante - Recepção de Documentos Fiscais")',
    );
  }

  async goto() {
    await this.page.goto(ROTA_REJEICOES_PAGAMENTOS, { waitUntil: 'domcontentloaded' });
  }

  /** Pré-condição: a casca do processo e o formulário dentro do iframe carregaram. */
  async expectAberto() {
    await this.headingInicio.waitFor({ state: 'visible' });
    await this.botaoEnviar.waitFor({ state: 'visible' });
    await this.tituloFormulario.waitFor({ state: 'visible' });
  }
}
