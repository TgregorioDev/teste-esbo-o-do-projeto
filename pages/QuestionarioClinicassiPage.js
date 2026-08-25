// @ts-check

/** Rota de abertura/movimentação de processo por URL — igual a `FormularioProcessoPage`. */
const ROTA_WORKFLOW_VIEW = '/portal/p/1/pageworkflowview';

/** Valores de avaliação oferecidos em cada questão, na ordem em que os `radio` aparecem no DOM. */
export const AVALIACAO = /** @type {const} */ (['Não', 'Parcial', 'Total']);

/**
 * Questionário de Diagnóstico CliniCASSI V2 (`prc_questionario_v2`), aberto por
 * `/portal/p/1/pageworkflowview?processID=prc_questionario_v2`.
 *
 * ## Confirmado em campo
 *
 * - O formulário abre completo e monta as 10 questões reais (`Questão 001`..`Questão 010`),
 *   cada uma com os campos somente-leitura `Fonte`/`Pergunta` e três `radio` (`Não`/
 *   `Parcial`/`Total`) — os ÚNICOS campos editáveis do formulário inteiro.
 * - O bloco de contexto (`Clínica`, `Gestor Clínica`, `Unidade`, `Gestor Unidade`, `Periodo
 *   de`/`Periodo Até`) nasce **sempre vazio e `readonly`**, sem zoom nem busca disponível —
 *   não há como a automação (nem o usuário) preencher qual clínica/unidade o questionário se
 *   refere. `Descrição` vem fixa em "Perguntas 2022".
 * - Clicar Enviar dispara `POST /ecm/api/rest/ecm/workflowView/send`. Em TODA tentativa
 *   observada — com 4/10 ou 10/10 questões respondidas — o servidor responde **500** e a UI
 *   abre um `role=dialog` com heading "Erro" e a mensagem de negócio
 *   `"A pergunta >>001<< não tem nenhuma ação cadastrada!!"`: falta de configuração de ação
 *   de workflow associada à primeira questão, não relacionada à completude do preenchimento.
 * - Nenhuma tentativa de envio faz o processo aparecer como iniciado.
 */
export class QuestionarioClinicassiPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.frame = page.frameLocator('iframe[title="Visualizador"]');

    this.headingInicio = page.getByRole('heading', { name: 'Início', exact: true });
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar', exact: true });

    this.headingQuestionario = this.frame.getByRole('heading', {
      name: 'Questionário de Diagnóstico - CliniCASSI',
    });
    // Campos de contexto — confirmados em campo como sempre vazios e `readonly` (sem zoom
    // nem busca disponível). Ancorados por `id` porque não têm rótulo `<label for>` associado.
    this.campoClinica = this.frame.locator('#clinica');
    this.campoUnidade = this.frame.locator('#unidade');
    this.campoPeriodoDe = this.frame.locator('#periodo_de');
    this.campoPeriodoAte = this.frame.locator('#periodo_ate');

    this.dialogErro = this.page
      .getByRole('dialog')
      .filter({ has: this.page.getByRole('heading', { name: 'Erro', exact: true }) });
    this.botaoOkErro = this.dialogErro.getByRole('button', { name: 'Ok, entendi', exact: true });
  }

  async goto() {
    await this.page.goto(`${ROTA_WORKFLOW_VIEW}?processID=prc_questionario_v2`, {
      waitUntil: 'domcontentloaded',
    });
  }

  /** Pré-condição: o formulário abriu. */
  async expectFormularioAberto() {
    await this.headingInicio.waitFor({ state: 'visible' });
  }

  /**
   * Quantidade de questões (grupos de `radio`) realmente montadas no formulário — medida no
   * DOM, nunca fixada em constante (o roteiro pode mudar a base de perguntas sem aviso).
   *
   * @returns {Promise<number>}
   */
  async contarQuestoes() {
    return this.frame.locator('input[type="radio"][name^="mp_avaliacao___"]').evaluateAll((radios) => {
      const nomes = new Set(radios.map((r) => /** @type {HTMLInputElement} */ (r).name));
      return nomes.size;
    });
  }

  /**
   * Responde a questão de número `indice` (1-based, correspondendo a `mp_avaliacao___<indice>`)
   * com o valor de `AVALIACAO` informado.
   *
   * @param {number} indice
   * @param {typeof AVALIACAO[number]} avaliacao
   */
  async responder(indice, avaliacao) {
    const posicao = AVALIACAO.indexOf(avaliacao);
    if (posicao === -1) throw new Error(`Avaliação desconhecida: ${avaliacao}`);
    await this.frame
      .locator(`input[type="radio"][name="mp_avaliacao___${indice}"]`)
      .nth(posicao)
      .check();
  }

  /**
   * Responde TODAS as questões montadas com o mesmo valor de avaliação.
   * @param {typeof AVALIACAO[number]} avaliacao
   */
  async responderTodas(avaliacao) {
    const total = await this.contarQuestoes();
    for (let indice = 1; indice <= total; indice += 1) {
      await this.responder(indice, avaliacao);
    }
  }

  /**
   * Clica Enviar e devolve a resposta de `POST .../workflowView/send`.
   * @returns {Promise<import('@playwright/test').Response>}
   */
  async enviarECapturarResposta() {
    const respostaPromise = this.page.waitForResponse(
      (r) => r.url().includes('/ecm/api/rest/ecm/workflowView/send') && r.request().method() === 'POST',
    );
    await this.botaoEnviar.click();
    return respostaPromise;
  }
}
