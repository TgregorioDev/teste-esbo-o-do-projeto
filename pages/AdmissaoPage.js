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

  /**
   * Título do formulário efetivamente montado dentro do iframe.
   *
   * ## Corrida encontrada (determinismo do conjunto, 25/08/2026)
   *
   * Este caso era intermitente APENAS quando executado junto com a suíte de contratos:
   * reprovava 3/3 isolado (o defeito é real e estável) e passava 1 em 3 no conjunto — ou
   * seja, o VERDE é que era falso, e um teste que documenta defeito ficava verde sozinho.
   *
   * Causa raiz medida: durante a carga, o iframe do formulário NAVEGA QUATRO VEZES —
   * três `about:blank` por volta de 3s e só então o formulário real, por volta de 5,5s.
   * `frameLocator(...)` é re-resolvido a cada uso, e `expect(...).not.toBeVisible()`
   * é satisfeito no PRIMEIRO poll em que o elemento não está visível. Se esse poll cai
   * numa das janelas de documento em branco (mais prováveis sob concorrência, quando a
   * navegação do iframe demora mais), a assertion negativa passa instantaneamente sem
   * nada ter sido observado — falso verde.
   *
   * Correção pela causa raiz: em vez de esperar por AUSÊNCIA (satisfeita por qualquer
   * estado transitório), lê-se o valor JÁ ESTABILIZADO e compara-se. A espera só termina
   * quando o formulário está realmente montado (heading E campos presentes no documento
   * do iframe); documento em branco não satisfaz a condição, ele continua aguardando e,
   * se nunca montar, falha alto em vez de passar caladamente.
   *
   * @returns {Promise<string>} texto do heading do formulário realmente servido
   */
  async lerTituloDoFormularioInterno() {
    const handle = await this.page.waitForFunction(
      () => {
        const iframe = document.querySelectorAll('iframe')[0];
        const doc = iframe instanceof HTMLIFrameElement ? iframe.contentDocument : null;
        if (!doc) return null;
        // Campos montados é o sinal de que o formulário terminou de renderizar — um
        // documento em branco (ou ainda em `about:blank`) nunca satisfaz esta condição.
        if (doc.querySelectorAll('input, select, textarea').length === 0) return null;
        // O heading separa as palavras com ESPAÇO NÃO-SEPARÁVEL (U+00A0), não espaço
        // comum: comparar o texto cru contra um literal digitado nunca casaria, e a
        // comparação silenciosamente "passaria" sempre. `getByRole(name:)` escondia isso
        // porque o cálculo de nome acessível já normaliza espaços em branco.
        const texto = (doc.querySelector('h1')?.textContent ?? '').replace(/\s+/g, ' ').trim();
        return texto === '' ? null : texto;
      },
      undefined,
      // Mesmo orçamento de tempo que o `waitFor` anterior usava — não é afrouxamento.
      { timeout: 30_000 },
    );

    const titulo = await handle.jsonValue();
    // `waitForFunction` só resolve com retorno truthy, então `null` é inalcançável aqui;
    // a guarda existe para o verificador de tipos e falha alto caso isso mude.
    if (titulo === null) {
      throw new Error('o formulário interno do processo de Admissão não montou nenhum título');
    }
    return titulo;
  }
}
