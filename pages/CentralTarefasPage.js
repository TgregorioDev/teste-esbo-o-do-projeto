// @ts-check

/**
 * Central de Tarefas (`/portal/p/1/pagecentraltask`).
 *
 * O Resumo de Tarefas (aba padrão ao carregar) é o widget "TaskChart", com cinco painéis
 * fixos. O `id` de cada painel leva um sufixo numérico atribuído por sessão/carga de
 * página (`panelChart_206`, por exemplo) — por isso os locators ancoram pela CLASSE, que é
 * estável entre cargas:
 *   - `.panel-task-chart-open`      — Tarefas a concluir (minhas)
 *   - `.panel-task-chart-pool`      — Tarefas em pool (grupos/papéis)
 *   - `.panel-task-chart-documents` — Documentos
 *   - `.panel-task-chart-requests`  — Solicitações
 *   - `.panel-task-chart-agreement` — Tarefas em consenso
 *
 * Cada painel anuncia um total no heading ("Nome do painel (N)") e decompõe esse total em
 * itens que também têm atributo semântico estável (`data-sort-type-label`,
 * `data-go-to-docs`, `data-go-to-request`) — não IDs dinâmicos. É o que permite validar
 * "o contador bate com a soma dos itens" sem fixar nenhum valor literal.
 *
 * "Minhas Solicitações" vive sob Mais opções → Solicitações → Minhas solicitações: uma
 * lista de `<task-card-component>` com filtro de Status (Abertas/Canceladas/Finalizadas).
 * Trocar o filtro dispara `GET /ecm/api/rest/ecm/centralTasks/getTasks/requests/...`.
 */
export class CentralTarefasPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.rota = '/portal/p/1/pagecentraltask';

    this.titulo = page.getByRole('heading', { name: 'Central de tarefas' });
    this.botaoVoce = page.getByRole('button', { name: 'Você' });

    // O widget lembra, por SESSÃO DO USUÁRIO (não por carga de página), qual sub-aba
    // estava aberta da última vez (Resumo, Tarefas a concluir, Minhas Solicitações...).
    // Um `goto()` novo pode aterrissar em qualquer uma delas — por isso `expectCarregada`
    // sempre clica nesta aba antes de validar os painéis do Resumo.
    this.abaResumo = page.getByRole('tab', { name: 'Resumo de Tarefas' });

    this.linkMaisOpcoes = page.getByRole('link', { name: 'Mais opções' });
    this.linkAbaSolicitacoes = page.getByRole('link', { name: /^Solicitações/ });
    this.linkMinhasSolicitacoes = page.getByRole('link', { name: /^Minhas solicitações/ });

    // Painéis do Resumo — âncoras por classe estável (o id numérico é da sessão/carga).
    this.painelTarefasAConcluir = page.locator('.panel-task-chart-open');
    this.painelTarefasEmPool = page.locator('.panel-task-chart-pool');
    this.painelDocumentos = page.locator('.panel-task-chart-documents');
    this.painelSolicitacoes = page.locator('.panel-task-chart-requests');
    this.painelConsenso = page.locator('.panel-task-chart-agreement');

    this.avisoSemConsenso = page.getByText('Você não possui tarefas em consenso');

    // Minhas Solicitações
    this.cartoesDeSolicitacao = page.locator('task-card-component');
    // Só é válido enquanto "Abertas" (padrão inicial) estiver selecionado.
    this.filtroStatusAbertas = page.getByRole('link', { name: 'Abertas', exact: true });
  }

  async goto() {
    await this.page.goto(this.rota, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Pré-condição: a aba "Resumo de Tarefas" está ativa e os cinco painéis terminaram de
   * carregar. Clica na aba explicitamente porque o widget reabre na última sub-aba
   * visitada pelo usuário na sessão anterior, não necessariamente no Resumo.
   */
  async expectCarregada() {
    await this.titulo.waitFor({ state: 'visible' });
    await this.botaoVoce.waitFor({ state: 'visible' });
    await this.abaResumo.click();
    await this.painelTarefasAConcluir
      .getByRole('heading', { name: /Tarefas a concluir/ })
      .waitFor({ state: 'visible' });
    await this.painelSolicitacoes
      .getByRole('heading', { name: /^Solicitações/ })
      .waitFor({ state: 'visible' });
  }

  /**
   * Lê o primeiro número presente no texto do locator.
   * @param {import('@playwright/test').Locator} locator
   * @returns {Promise<number>}
   */
  async lerNumero(locator) {
    const texto = await locator.innerText();
    const numero = texto.match(/\d+/);
    if (!numero) throw new Error(`Não foi possível ler um número em: "${texto}"`);
    return Number(numero[0]);
  }

  /**
   * Total anunciado em "Tarefas a concluir (N)" vs. a soma de No prazo + Próx. a vencer +
   * Atrasadas — os três `<li data-sort-type-label>` da legenda do doughnut chart.
   * @returns {Promise<{ total: number, soma: number }>}
   */
  async resumoTarefasAConcluir() {
    const total = await this.lerNumero(
      this.painelTarefasAConcluir.getByRole('heading', { name: /Tarefas a concluir/ }),
    );
    const noPrazo = await this.lerNumero(
      this.painelTarefasAConcluir.locator('li[data-sort-type-label="ON_TIME"] b'),
    );
    const proxVencer = await this.lerNumero(
      this.painelTarefasAConcluir.locator('li[data-sort-type-label="APPROACHING_EXPIRATION"] b'),
    );
    const atrasadas = await this.lerNumero(
      this.painelTarefasAConcluir.locator('li[data-sort-type-label="EXPIRED"] b'),
    );
    return { total, soma: noPrazo + proxVencer + atrasadas };
  }

  /**
   * Total anunciado em "Tarefas em pool (N)" vs. a soma dos itens da lista horizontal
   * (No prazo / Próximas a vencer / Atrasadas).
   * @returns {Promise<{ total: number, soma: number }>}
   */
  async resumoTarefasEmPool() {
    const total = await this.lerNumero(
      this.painelTarefasEmPool.getByRole('heading', { name: /Tarefas em pool/ }),
    );
    const itens = this.painelTarefasEmPool.locator('.pool-horizontal-list-item');
    const quantidade = await itens.count();
    let soma = 0;
    for (let i = 0; i < quantidade; i++) {
      soma += await this.lerNumero(itens.nth(i));
    }
    return { total, soma };
  }

  /**
   * Total anunciado em "Documentos (N)" vs. a soma dos quatro contadores
   * (Para aprovar / Meus documentos / Documentos em consenso / Documentos em checkout).
   * @returns {Promise<{ total: number, soma: number }>}
   */
  async resumoDocumentos() {
    const total = await this.lerNumero(
      this.painelDocumentos.getByRole('heading', { name: /^Documentos/ }),
    );
    const paraAprovar = await this.lerNumero(
      this.painelDocumentos.locator('li[data-go-to-docs="toapprove"] h2'),
    );
    const meusDocumentos = await this.lerNumero(
      this.painelDocumentos.locator('li[data-go-to-docs="mydocs"] h2'),
    );
    const emConsenso = await this.lerNumero(
      this.painelDocumentos.locator('li[data-go-to-docs="consensus"] h2'),
    );
    const emCheckout = await this.lerNumero(
      this.painelDocumentos.locator('li[data-go-to-docs="checkout"] h2'),
    );
    return { total, soma: paraAprovar + meusDocumentos + emConsenso + emCheckout };
  }

  /**
   * Total anunciado em "Solicitações (N)" vs. a soma de "Solicitadas por mim" +
   * "Sob minha gerência".
   * @returns {Promise<{ total: number, soma: number }>}
   */
  async resumoSolicitacoes() {
    const total = await this.lerNumero(
      this.painelSolicitacoes.getByRole('heading', { name: /^Solicitações/ }),
    );
    const porMim = await this.lerNumero(
      this.painelSolicitacoes.locator('[data-go-to-request="myRequests"] label.taskChar-requests'),
    );
    const gerencia = await this.lerNumero(
      this.painelSolicitacoes.locator(
        '[data-go-to-request="myManagement"] label.taskChar-requests',
      ),
    );
    return { total, soma: porMim + gerencia };
  }

  /**
   * Total anunciado em "Tarefas em consenso (N)".
   * @returns {Promise<{ total: number }>}
   */
  async resumoConsenso() {
    const total = await this.lerNumero(
      this.painelConsenso.getByRole('heading', { name: /Tarefas em consenso/ }),
    );
    return { total };
  }

  /** Abre Mais opções → Solicitações → Minhas solicitações e espera a lista carregar. */
  async abrirMinhasSolicitacoes() {
    await this.linkMaisOpcoes.click();
    await this.linkAbaSolicitacoes.click();
    const resposta = this.page.waitForResponse((r) =>
      r.url().includes('/ecm/api/rest/ecm/centralTasks/getTasks/requests/'),
    );
    await this.linkMinhasSolicitacoes.click();
    await resposta;
    await this.cartoesDeSolicitacao.first().waitFor({ state: 'visible' });
  }

  /** Identificadores (número da solicitação) exibidos nos cartões atualmente visíveis. */
  async lerIdentificadoresSolicitacoes() {
    const textos = await this.cartoesDeSolicitacao.allInnerTexts();
    return /** @type {string[]} */ (
      textos.map((t) => t.match(/Selecionar\s+(\d+)/)?.[1]).filter((id) => id !== undefined)
    );
  }

  /**
   * Troca o filtro de Status (a partir de "Abertas", padrão inicial) e aguarda a resposta
   * do endpoint que decide o novo conjunto de solicitações listadas.
   * @param {'Canceladas' | 'Finalizadas'} status
   */
  async filtrarSolicitacoesPorStatus(status) {
    await this.filtroStatusAbertas.click();
    const resposta = this.page.waitForResponse((r) =>
      r.url().includes('/ecm/api/rest/ecm/centralTasks/getTasks/requests/'),
    );
    await this.page.getByRole('menuitem', { name: status }).click();
    await resposta;
  }

  /** Cartões de "Minhas solicitações" cujo texto sinaliza atraso ("Atrasada há ..."). */
  get cartoesAtrasados() {
    return this.cartoesDeSolicitacao.filter({ hasText: /Atrasada há/ });
  }
}
