// @ts-check

/** Rota de início do processo "Delegação de Fiscais de Contrato/Serviço". */
const ROTA_DELEGACAO_FISCAIS =
  '/portal/p/1/pageworkflowview?processID=wf_delegacaoFiscalContratoServico';

/**
 * Formulário "Delegação de Fiscais de Contratos e Serviços"
 * (`wf_delegacaoFiscalContratoServico`), iniciado via
 * `/portal/p/1/pageworkflowview?processID=wf_delegacaoFiscalContratoServico`.
 *
 * ⚠️ Descoberta em campo: no mapa do ambiente esta rota estava marcada como "ainda NÃO
 * verificada, pode estar bloqueada por permissão". Em campo, para o usuário desta
 * automação, ela NÃO está bloqueada — abre normalmente com a mesma casca dos demais
 * processos (heading "Início", abas Formulário/Informações/Histórico/Anexos, botão
 * "Enviar"), então este caso permanece de ABERTURA, não vira caso de autorização.
 *
 * ⚠️ Segunda descoberta: os campos que o roteiro original esperava ("contrato, fiscal
 * substituto e período") não correspondem 1:1 ao que a tela realmente oferece ao iniciar
 * sem um processo de origem:
 *   - "Identificação do Contrato/Serviço" existe, mas TODOS os campos vêm em branco e
 *     somente leitura (Filial/Número do Contrato, Filial/Número da Planilha, Filial da
 *     Medição, Objeto) — não há zoom para o solicitante escolher um contrato aqui.
 *   - Não existe um campo "Fiscal Substituto" para escolha: o único campo de fiscal
 *     ("Fiscal *") também é somente leitura.
 *   - Não existe nenhum campo de período (data início/fim da delegação) no formulário —
 *     os únicos campos de data são carimbos de resposta de aprovação ("Data/Hora da
 *     Resposta"), preenchidos por etapas posteriores do fluxo, não pelo solicitante.
 * Isso sugere que este processo é iniciado a partir de um contexto (outro processo ou
 * tarefa) que preenche esses dados — não como solicitação autônoma pelo usuário desta
 * automação. Ver relatório da suíte para o registro completo.
 */
export class FormularioDelegacaoFiscaisPage {
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
      name: 'Delegação de Fiscais de Contratos e Serviços',
      level: 1,
    });

    // "Identificação do Contrato/Serviço" — somente leitura nesta etapa
    this.campoFilialContrato = this.frame.getByRole('textbox', { name: 'Filial Contrato' });
    this.campoNumeroContrato = this.frame.getByRole('textbox', { name: 'Número Contrato' });
    this.campoNumeroPlanilha = this.frame.getByRole('textbox', { name: 'Número Planilha' });
    this.campoFilialMedicao = this.frame.getByRole('textbox', { name: 'Filial Medição' });
    this.campoObjetoContrato = this.frame.getByRole('textbox', { name: 'Objeto do Contrato' });

    // "Identificação do Fiscal" — somente leitura; não é um seletor de "fiscal substituto".
    // Âncora por início de string: "Email do Fiscal *" também contém a palavra "Fiscal".
    this.campoFiscal = this.frame.getByRole('textbox', { name: /^Fiscal/ });
  }

  async goto() {
    await this.page.goto(ROTA_DELEGACAO_FISCAIS, { waitUntil: 'domcontentloaded' });
  }

  /** Pré-condição: a casca do processo e o formulário dentro do iframe carregaram. */
  async expectAberto() {
    await this.headingInicio.waitFor({ state: 'visible' });
    await this.botaoEnviar.waitFor({ state: 'visible' });
    await this.tituloFormulario.waitFor({ state: 'visible' });
  }
}
