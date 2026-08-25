// @ts-check

/** ID do processo de Gestão de Dependentes, usado por `pageworkflowview`. */
export const PROCESSO_GESTAO_DEPENDENTES = 'GestaoDependentes';

/**
 * Início do processo "Gestão de Dependentes" (`pageworkflowview?processID=GestaoDependentes`).
 *
 * Comportamento observado em campo (rodada de implementação de CT-DEP), estável e
 * reproduzido em execuções isoladas: a tela externa abre normalmente (heading *Início*,
 * abas Formulário/Informações/Histórico/Anexos, botão *Enviar* — confirmado por
 * `tests/e2e/rh/bloqueio-processos-rh.spec.js`, não duplicado aqui), mas o FORMULÁRIO
 * interno (dentro do iframe) nunca chega a montar nenhum campo. Em vez disso, ele
 * consulta a matrícula do titular pelo e-mail da sessão autenticada e, quando a consulta
 * não encontra vínculo, renderiza um único alerta e para — nenhum `<input>`, `<select>`
 * ou `<textarea>` chega a existir no DOM (confirmado via inspeção do documento do iframe:
 * `0` campos).
 *
 * Isso faz de **CT-DEP-02-S1 ("titular sem matrícula")** o único caso, dos cinco
 * atribuídos a este processo, alcançável pela conta de automação: é exatamente o
 * comportamento que a tela produz por padrão, de forma determinística. Cadastrar
 * dependente (01-H), duplicidade (01-S1), parentesco incompatível (01-S2) e CPF inválido
 * (01-S3) exigem um titular COM matrícula — pré-condição que esta conta não tem e que a
 * automação não pode criar (cadastro de vínculo empregatício no Protheus está fora do
 * escopo desta suíte, no mesmo sentido em que a criação de contrato está).
 */
export class DependentesPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.frame = page.frameLocator('iframe').first();

    this.headingInicio = page.getByRole('heading', { name: 'Início', exact: true });
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar', exact: true });

    // Alerta interno do formulário (dentro do iframe) — trecho estável da mensagem, sem
    // acoplar ao e-mail da conta (dado de ambiente, não literal de código).
    this.erroTitularSemMatricula = this.frame.getByText(
      'não foi possível determinar a matrícula do titular',
    );
  }

  async goto() {
    await this.page.goto(`/portal/p/1/pageworkflowview?processID=${PROCESSO_GESTAO_DEPENDENTES}`, {
      waitUntil: 'domcontentloaded',
    });
  }

  /** Pré-condição comum aos casos: a casca externa do processo abriu (não é bloqueio de perfil). */
  async expectFormularioAberto() {
    await this.headingInicio.waitFor({ state: 'visible' });
  }

  /**
   * CT-DEP-02-S1 — confirma o bloqueio real e determinístico: o titular (usuário
   * autenticado) não tem matrícula localizada, então o formulário nunca expõe campo
   * algum de cadastro de dependente.
   */
  async expectBloqueadoPorTitularSemMatricula() {
    await this.erroTitularSemMatricula.waitFor({ state: 'visible' });
  }

  /**
   * Quantidade de campos de formulário (`input`/`select`/`textarea`) presentes no
   * documento do iframe — usado para provar, sem depender de texto, que nenhum campo de
   * cadastro chegou a ser montado.
   * @returns {Promise<number>}
   */
  async contarCamposDoFormulario() {
    const frameElement = await this.page.locator('iframe').first().elementHandle();
    if (!frameElement) return 0;
    const frame = await frameElement.contentFrame();
    if (!frame) return 0;
    return frame.locator('input, select, textarea').count();
  }
}
