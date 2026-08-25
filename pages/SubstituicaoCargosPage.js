// @ts-check

/** ID do processo de Substituição de Cargos, usado por `pageworkflowview`. */
export const PROCESSO_SUBSTITUICAO_CARGOS = 'wf_substituicaocargos';

/**
 * Início do processo "Substituição de Cargos" (`pageworkflowview?processID=wf_substituicaocargos`).
 *
 * Comportamento observado em campo (rodada de implementação de CT-SUB), confirmado de
 * forma determinística (via `waitFor` sobre o texto real do erro, nunca por tempo
 * arbitrário) em múltiplas execuções isoladas: a casca externa abre normalmente (heading
 * *Início*, botão *Enviar*) e o formulário interno chega a montar a seção de
 * identificação do solicitante e as opções "Cadastrar/Alterar/Excluir Substituição" —
 * mas, pouco depois de o formulário montar, uma validação assíncrona resolve o e-mail da
 * sessão contra o cadastro de funcionários do Protheus e falha: *"Erro 401 --> Funcionario
 * não localizado através do email &lt;email&gt;"*. Quando isso acontece, um overlay de
 * bloqueio (`blockUI`) cobre a área do formulário e os campos deixam de estar visíveis —
 * confirmado por inspeção do DOM (todos os inputs do documento do iframe ficam com
 * `offsetParent === null` after o erro).
 *
 * Consequência prática: **nenhum dos três casos atribuídos a este processo (01-H
 * substituto válido, 01-S1 substituto sem vínculo ativo, 01-S2 período retroativo) é
 * alcançável** por esta conta — todos dependem de passar da etapa de identificação do
 * SOLICITANTE, que aqui já falha antes de qualquer campo de substituto aparecer. A causa é
 * a mesma pré-condição de CT-DEP: a conta de automação (e-mail
 * `fabricasoftware@totvs.com.br`) não corresponde a um funcionário ativo no Protheus.
 */
export class SubstituicaoCargosPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.frame = page.frameLocator('iframe').first();

    this.headingInicio = page.getByRole('heading', { name: 'Início', exact: true });
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar', exact: true });

    // Seção de identificação do solicitante, visível brevemente antes da validação assíncrona.
    this.radioCadastrarSubstituicao = this.frame.locator('#cadastrarSubstituicao');

    // Erro assíncrono que bloqueia o formulário — trecho estável, sem acoplar ao e-mail
    // (dado de ambiente, não literal de código).
    this.erroFuncionarioNaoLocalizado = this.frame.getByText(/Funcionario não localizado|Funcionário não localizado/);
  }

  async goto() {
    await this.page.goto(
      `/portal/p/1/pageworkflowview?processID=${PROCESSO_SUBSTITUICAO_CARGOS}`,
      { waitUntil: 'domcontentloaded' },
    );
  }

  /** Pré-condição comum aos casos: a casca externa do processo abriu (não é bloqueio de perfil). */
  async expectFormularioAberto() {
    await this.headingInicio.waitFor({ state: 'visible' });
  }

  /**
   * Confirma o bloqueio real: a validação assíncrona de funcionário falha e o formulário
   * fica bloqueado antes de expor qualquer campo de substituto.
   */
  async expectBloqueadoPorFuncionarioNaoLocalizado() {
    await this.erroFuncionarioNaoLocalizado.waitFor({ state: 'visible' });
  }

  /**
   * Quantidade de campos de formulário (`input`/`select`/`textarea`) VISÍVEIS no
   * documento do iframe — usado para provar que, após o bloqueio, nenhum campo continua
   * acionável (mesmo que ainda exista no DOM, coberto pelo overlay).
   * @returns {Promise<number>}
   */
  async contarCamposVisiveis() {
    const frameElement = await this.page.locator('iframe').first().elementHandle();
    if (!frameElement) return 0;
    const frame = await frameElement.contentFrame();
    if (!frame) return 0;
    return frame.evaluate(() =>
      Array.from(document.querySelectorAll('input, select, textarea')).filter(
        (el) => /** @type {HTMLElement} */ (el).offsetParent !== null,
      ).length,
    );
  }
}
