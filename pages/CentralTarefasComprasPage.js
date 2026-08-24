// @ts-check

/**
 * Extensão da Central de Tarefas (`/portal/p/1/pagecentraltask`) para o ciclo de aprovação
 * de Solicitação de Compras — "Tarefas em pool" → assumir → aprovar/reprovar.
 *
 * Não duplica `pages/CentralTarefasPage.js` (Resumo de Tarefas, Minhas Solicitações): este
 * Page Object cobre exclusivamente a sub-aba de POOL, que aquela classe não modela.
 *
 * ## O que foi confirmado em campo (investigação desta suíte)
 *
 * - A sub-aba "Tarefas em pool" lista os GRUPOS aos quais o usuário pertence, cada um como
 *   um link `"<nome do grupo> (<quantidade>)"` — só aparece grupo com pelo menos 1 tarefa
 *   pendente. O usuário de automação pertence confirmadamente a
 *   `Grupo de Compras - Validação do Gestor Imediato da Req. de Compras`.
 * - Clicar no grupo lista as tarefas (uma por Solicitação de Compras), cada uma com um
 *   botão "Assumir".
 * - "Assumir" navega para `pageworkflowview?...taskUserId=<usuário>` — o MESMO template de
 *   "Movimentar Solicitação" usado para abrir a SC, mas agora com uma seção adicional
 *   referente à ETAPA atual (ex.: "Validação do Gestor"), contendo radio "Aprovar? Sim/Não"
 *   e uma "Justificativa para a Aprovação/Reprovação" obrigatória. O rodapé mantém o mesmo
 *   botão "Enviar" (fora do iframe) usado para criar a SC.
 * - Quando o Fluig não encontra o gestor imediato do solicitante, a tarefa NÃO trava: cai
 *   para o GRUPO (fallback), com o comentário automático "Atenção! Não foi possivel obter as
 *   informações do Superior Responsável pelo Colaborador requerente da Solicitação de
 *   Compras." registrado no Histórico — por isso o pool sempre tem massa disponível para
 *   testar, independentemente de cadastro de gestor no Protheus.
 */
export class CentralTarefasComprasPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.rota = '/portal/p/1/pagecentraltask';

    this.titulo = page.getByRole('heading', { name: 'Central de tarefas' });
    // A Central de Tarefas guarda a sub-aba ativa por SESSÃO no servidor (não por carga de
    // página) — um `goto()` novo pode aterrissar em qualquer sub-aba visitada da última vez
    // (confirmado em `docs/mapa-do-ambiente.md`). "Tarefas em pool" só existe no DOM quando
    // a sub-aba "Resumo de Tarefas" está ativa, por isso ela é clicada explicitamente antes.
    this.abaResumo = page.getByRole('tab', { name: 'Resumo de Tarefas' });
    this.abaTarefasEmPool = page.getByRole('link', { name: /^Tarefas em pool/ });

    /** O formulário de aprovação, como o de criação, vive dentro do iframe "Visualizador". */
    this.frame = page.frameLocator('iframe[title="Visualizador"]');
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar' });
  }

  async goto() {
    await this.page.goto(this.rota, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Pré-condição: a sub-aba "Tarefas em pool" está ativa e os grupos já carregaram —
   * quando há pelo menos uma tarefa em algum grupo.
   *
   * Confirmado em campo: o painel "Tarefas em pool (N)" só é um `link` clicável quando
   * N > 0; com pool total vazio (N = 0) ele fica como texto inerte, sem navegação. Não é
   * erro — é a MESMA semântica de "só aparece grupo com tarefa pendente" documentada na
   * classe. Por isso este método NÃO lança quando o pool está vazio: `listarGrupos()`
   * simplesmente devolve `[]` depois, e quem chama decide como reportar ausência de massa.
   */
  async abrirTarefasEmPool() {
    await this.titulo.waitFor({ state: 'visible' });
    await this.abaResumo.click();

    const linkClicavel = await this.abaTarefasEmPool
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    if (!linkClicavel) return;

    await this.abaTarefasEmPool.click();
    // "Grupos (N)" é a única sub-aba hoje, mas esperar por ela (em vez de tempo) confirma
    // que a lista de grupos terminou de renderizar.
    await this.page.getByRole('tab', { name: /^Grupos/ }).waitFor({ state: 'visible' });
  }

  /**
   * Lê os grupos de pool disponíveis para o usuário autenticado, com a quantidade de
   * tarefas pendentes anunciada em cada um. Só aparecem grupos com pelo menos 1 tarefa.
   * @returns {Promise<Array<{ nome: string, quantidade: number, link: import('@playwright/test').Locator }>>}
   */
  async listarGrupos() {
    const links = this.page.getByRole('link').filter({ hasText: /\(\d+\)$/ });
    const textos = await links.allInnerTexts();
    const grupos = [];
    for (let i = 0; i < textos.length; i++) {
      const m = textos[i].match(/^(.*)\((\d+)\)\s*$/s);
      if (!m) continue;
      grupos.push({ nome: m[1].trim(), quantidade: Number(m[2]), link: links.nth(i) });
    }
    return grupos;
  }

  /**
   * Localiza, dentre os grupos com tarefa pendente, o primeiro cujo nome bate com o
   * padrão informado. Não lança: quem chama decide como reportar ausência de massa
   * (ver `PRÉ-CONDIÇÃO AUSENTE` em `utils/massa-contratos.js`, mesmo padrão do projeto).
   * @param {RegExp} padraoNomeGrupo
   * @returns {Promise<{ nome: string, quantidade: number, link: import('@playwright/test').Locator } | undefined>}
   */
  async encontrarGrupo(padraoNomeGrupo) {
    const grupos = await this.listarGrupos();
    return grupos.find((g) => padraoNomeGrupo.test(g.nome));
  }

  /**
   * Abre um grupo de pool e espera a lista de tarefas (cartões com botão "Assumir")
   * terminar de carregar.
   * @param {import('@playwright/test').Locator} linkDoGrupo
   */
  async abrirGrupo(linkDoGrupo) {
    await linkDoGrupo.click();
    await this.page.getByRole('button', { name: 'Assumir' }).first().waitFor({ state: 'visible' });
  }

  /** Quantidade de tarefas com botão "Assumir" visíveis no grupo atualmente aberto. */
  async contarTarefasAssumiveis() {
    return this.page.getByRole('button', { name: 'Assumir' }).count();
  }

  /**
   * Assume a tarefa de índice informado (0 = primeira) dentro do grupo já aberto e espera
   * a tela de "Movimentar Solicitação" (com a seção de decisão da etapa) carregar.
   * @param {number} [indice]
   * @returns {Promise<number>} número do processo assumido, lido do heading da tela
   */
  async assumirTarefa(indice = 0) {
    const botaoAssumir = this.page.getByRole('button', { name: 'Assumir' }).nth(indice);
    await botaoAssumir.click();

    const heading = this.page.getByRole('heading', { level: 2 }).filter({ hasText: /^\d+\s*-/ });
    await heading.waitFor({ state: 'visible' });
    const texto = await heading.innerText();
    const numero = texto.match(/^(\d+)\s*-/)?.[1];
    if (!numero) {
      throw new Error(`Não foi possível ler o número do processo assumido no heading: "${texto}"`);
    }
    return Number(numero);
  }

  /**
   * Localiza, na tela de decisão de uma etapa já assumida (ex.: "Validação do Gestor"),
   * o radiogroup "Aprovar?" e o campo de justificativa. Genérico o bastante para qualquer
   * etapa que siga o mesmo padrão de UI (Sim/Não + Justificativa).
   */
  radioAprovarSim() {
    return this.frame.getByRole('radio', { name: 'Sim' });
  }

  radioAprovarNao() {
    return this.frame.getByRole('radio', { name: 'Não' });
  }

  campoJustificativaDecisao() {
    return this.frame.getByRole('textbox', { name: /Justificativa para a Aprovação\/Reprovação/ });
  }

  /**
   * Preenche a decisão (Sim/Não) e a justificativa da etapa atual, e aciona o Enviar do
   * rodapé (fora do iframe) — o mesmo botão usado para criar a SC.
   * @param {{ aprovar: boolean, justificativa: string }} decisao
   */
  async decidirEEnviar(decisao) {
    const radio = decisao.aprovar ? this.radioAprovarSim() : this.radioAprovarNao();
    await radio.check();
    await this.campoJustificativaDecisao().fill(decisao.justificativa);
    await this.botaoEnviar.click();
  }

  /** Heading level 2 da tela atual (ex.: "112097 - Validação do Gestor"). */
  headingAtual() {
    return this.page.getByRole('heading', { level: 2 });
  }

  /** Aba/heading "Histórico N" da tela de detalhe — usado para confirmar movimentação. */
  headingHistorico() {
    return this.page.getByRole('link', { name: /^\s*Histórico/ });
  }
}
