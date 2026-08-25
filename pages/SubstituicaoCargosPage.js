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
   *
   * ## Não-determinismo MEDIDO no produto (25/08/2026)
   *
   * Este caso é intermitente e a intermitência é DO PRODUTO, não da automação. Medido em
   * 8 cargas sequenciais da tela, sem concorrência e sem interceptação: em 7 delas o
   * formulário bloqueia (0 campos visíveis) e em 1 ele **não bloqueia** — 10 campos ficam
   * visíveis e utilizáveis. Nas 8 execuções o dataset `ds_protheus_getMatriculaTitular_rest`
   * devolveu exatamente a MESMA resposta (0 registros): a entrada da validação é idêntica e
   * o desfecho da tela não é. Ou seja, o bloqueio depende de uma corrida interna do
   * JavaScript do formulário (a validação assíncrona concluir antes ou depois de o
   * formulário terminar de montar e reabilitar os campos), não do dado do ERP.
   *
   * Consequência de negócio: de forma intermitente, um solicitante que o ERP NÃO conseguiu
   * identificar recebe o formulário liberado. É defeito de validação, e este teste reprova
   * exatamente quando isso acontece — comportamento correto, não deve ser "estabilizado".
   *
   * Há ainda um terceiro desfecho, com o ERP fora: o formulário bloqueia com outra mensagem
   * ("Não foi possível estabelecer comunicação com o ERP"). Também é bloqueio, mas por outra
   * causa, e o teste não o aceita como equivalente.
   *
   * O `catch` abaixo apenas ENRIQUECE o diagnóstico e relança: sem ele a falha chega como um
   * timeout opaco de 30s, que não distingue "produto não bloqueou" de "ambiente fora".
   */
  async expectBloqueadoPorFuncionarioNaoLocalizado() {
    try {
      await this.erroFuncionarioNaoLocalizado.waitFor({ state: 'visible' });
    } catch (erro) {
      const observado = await this.descreverDesfechoDaValidacao();
      throw new Error(
        `o formulário NÃO apresentou o bloqueio de identificação do solicitante. Estado observado: ${observado}. ` +
          'Não-determinismo conhecido do produto (ver comentário em SubstituicaoCargosPage): ' +
          'com a MESMA resposta do ERP, a tela às vezes bloqueia e às vezes libera os campos. ' +
          `Erro original: ${erro instanceof Error ? erro.message : String(erro)}`,
      );
    }
  }

  /**
   * Descreve qual dos desfechos conhecidos a tela apresentou — usado só para tornar a
   * falha legível no relatório.
   * @returns {Promise<string>}
   */
  async descreverDesfechoDaValidacao() {
    const frameElement = await this.page.locator('iframe').first().elementHandle();
    const frame = frameElement ? await frameElement.contentFrame() : null;
    if (!frame) return 'iframe do formulário não disponível';

    return frame.evaluate(() => {
      const texto = (document.body?.innerText ?? '').replace(/\s+/g, ' ');
      const visiveis = Array.from(document.querySelectorAll('input, select, textarea')).filter(
        (el) => /** @type {HTMLElement} */ (el).offsetParent !== null,
      ).length;
      if (/Não foi possível estabelecer comunicação com o ERP/.test(texto)) {
        return `bloqueado por INDISPONIBILIDADE DO ERP (outra mensagem), ${visiveis} campo(s) visível(is)`;
      }
      return `SEM bloqueio algum, ${visiveis} campo(s) visível(is) e utilizável(is)`;
    });
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
