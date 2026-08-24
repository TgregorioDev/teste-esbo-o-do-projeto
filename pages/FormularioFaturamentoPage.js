// @ts-check

/** Rota de início do processo "Faturamento de Contratos", confirmada em campo. */
const ROTA_FATURAMENTO_CONTRATOS = '/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos';

/**
 * Formulário "Faturamento de Contratos" (`wf_faturamento_contratos`), iniciado via
 * `/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos`.
 *
 * Observado em campo (ver `docs/mapa-do-ambiente.md` > Início de processo por URL): título
 * `Cassi - Fluig Plataforma - Movimentar Solicitação`, heading "Início", abas
 * Formulário/Informações/Histórico/Anexos e botão "Enviar" — tudo na página HOSPEDEIRA
 * (fora do iframe). O formulário de negócio em si (zooms do Protheus, itens, rateio) vive
 * dentro de um iframe próprio: `#workflowView-cardViewer`
 * (`webdesk/streamcontrol/<id>/...`).
 *
 * ⚠️ Descoberta em campo (não estava no mapa do ambiente): as áreas "Itens da Medição" e a
 * aba "Rateio Contábil" (dentro do mesmo painel) EXISTEM no DOM já na abertura, mas ficam
 * ocultas (`style="display: none"`) até que Fornecedor, Nº do Contrato, Competência e
 * Filial da Medição sejam selecionados nos zooms — não renderizam já ao abrir o formulário.
 * Revelar essas áreas de verdade exigiria selecionar fornecedor/contrato REAIS do Protheus
 * por um widget de busca (zoom) que não devolveu resultado determinístico na exploração de
 * campo (buscas genéricas ficaram presas em "Buscando…"); por isso esta suíte cobre a
 * abertura e os cinco campos de seleção, e valida que o painel de Itens/Rateio está
 * presente porém oculto — não a cadeia de preenchimento completa.
 */
export class FormularioFaturamentoPage {
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
      name: 'Faturamento de Contratos',
      level: 1,
    });

    // Campos de seleção (zooms do Protheus) — painel "Informações da Medição"
    this.campoFornecedor = this.frame.getByRole('searchbox', { name: 'Fornecedor' });
    this.campoNumContrato = this.frame.getByRole('searchbox', { name: 'Nº do Contrato' });
    this.campoRevisao = this.frame.getByRole('textbox', { name: 'Revisão' });
    this.campoCompetencia = this.frame.getByRole('searchbox', { name: 'Competência do Contrato' });
    this.campoFilialMedicao = this.frame.getByRole('searchbox', { name: 'Filial da Medição' });

    // Painel "Itens da Medição" (contém as abas "Itens" e "Rateio Contábil"). Presente no
    // DOM desde a abertura, porém oculto até a seleção acima ser concluída — ver nota da
    // classe.
    this.painelItensMedicao = this.frame.getByText('Itens da Medição', { exact: true });
  }

  async goto() {
    await this.page.goto(ROTA_FATURAMENTO_CONTRATOS, { waitUntil: 'domcontentloaded' });
  }

  /** Pré-condição: a casca do processo e o formulário dentro do iframe carregaram. */
  async expectAberto() {
    await this.headingInicio.waitFor({ state: 'visible' });
    await this.botaoEnviar.waitFor({ state: 'visible' });
    await this.tituloFormulario.waitFor({ state: 'visible' });
  }
}
