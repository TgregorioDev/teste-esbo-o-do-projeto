// @ts-check

/** ID do processo de Automação de Admissão, usado por `pageworkflowview`. */
export const PROCESSO_AUTOMACAO_ADMISSAO = 'wf_automacao_admissao';

/**
 * Início do processo "Automação Admissão" (`pageworkflowview?processID=wf_automacao_admissao`).
 *
 * Achado confirmado em campo, de forma determinística e repetida (via `waitFor` sobre
 * heading real, nunca por tempo arbitrário, em execuções isoladas independentes): a casca
 * externa abre normalmente (heading *Início*, botão *Enviar*), mas o formulário interno
 * carregado dentro do iframe **não é um formulário de admissão** — é, campo por campo, o
 * MESMO formulário do processo `rh_gbeneficios_planosaude` ("Gestão de Benefícios - Plano
 * de Saúde"): mesmo heading, mesmos nomes de campo (`actionPlanoSaude`,
 * `termoConsentimento`), e o mesmo alerta de bloqueio: *"O Benefício 'Plano de Saúde' não
 * esta liberado para o seu usuário."*
 *
 * Isso é um DEFEITO de associação processo↔formulário, não uma segregação de perfil: o
 * processo de Admissão está servindo o template de outro processo. Nenhum campo de
 * admissão (nome do admitido, CPF, cargo, data de admissão) jamais aparece, então os três
 * casos atribuídos (01-H integração de novo funcionário, 01-S1 dados obrigatórios
 * ausentes, 01-S2 reprocessamento após falha) não são alcançáveis por esta rota.
 */
export class AdmissaoPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.frame = page.frameLocator('iframe').first();

    this.headingInicio = page.getByRole('heading', { name: 'Início', exact: true });
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar', exact: true });

    // Qualquer heading de nível 1 dentro do iframe — âncora genérica usada só para
    // confirmar que o CONTEÚDO interno terminou de carregar, seja ele qual for. Necessário
    // para nunca afirmar a ausência do heading de Plano de Saúde cedo demais (antes do
    // iframe montar) e produzir falso verde — mesma armadilha documentada no mapa do
    // ambiente ("contagem lida cedo demais passa por acidente").
    this.headingDoFormularioInterno = this.frame.locator('h1').first();

    // Heading do formulário REALMENTE servido — o de Plano de Saúde, não o de Admissão.
    this.headingPlanoSaudeInesperado = this.frame.getByRole('heading', {
      name: 'Gestão de Benefícios - Plano de Saúde',
    });
    this.alertaBeneficioNaoLiberado = this.frame.getByText(
      'não esta liberado para o seu usuário',
    );
  }

  async goto() {
    await this.page.goto(
      `/portal/p/1/pageworkflowview?processID=${PROCESSO_AUTOMACAO_ADMISSAO}`,
      { waitUntil: 'domcontentloaded' },
    );
  }

  /** Pré-condição comum aos casos: a casca externa do processo abriu (não é bloqueio de perfil). */
  async expectFormularioAberto() {
    await this.headingInicio.waitFor({ state: 'visible' });
  }

  /**
   * Aguarda o formulário INTERNO (dentro do iframe) terminar de montar, condição real e
   * observável — nunca tempo arbitrário. Pré-requisito para qualquer assertion negativa
   * sobre o conteúdo do iframe: sem isso, `.not.toBeVisible()` poderia passar cedo demais,
   * antes do iframe sequer montar o heading que o teste quer reprovar.
   */
  async aguardarFormularioInternoCarregado() {
    await this.headingDoFormularioInterno.waitFor({ state: 'visible' });
  }
}
