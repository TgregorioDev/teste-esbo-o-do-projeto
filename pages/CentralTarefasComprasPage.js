// @ts-check
import { expect } from '@playwright/test';

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
    // ⚠️ Ancorado em ATRIBUTO, não em texto. A versão anterior era
    // `getByRole('link').filter({ hasText: /\(\d+\)$/ })` — dependia de o grupo ser exposto
    // como `link` com o contador "(N)" no fim do texto. Medido em 27/08/2026: com o resumo
    // anunciando "Tarefas em pool (1)" e o grupo "Validação dos Compradores" presente, este
    // método devolvia `[]`. O efeito era silencioso porque quem chamava tratava lista vazia
    // como "grupo não disponível" — e um teste chegou a reportar VERDE em cima disso.
    //
    // `a[data-change-tab-view][data-params-type-group="POOL"]`, lido pelo `data-node`, é o
    // mesmo gancho de `PoolTarefasPage.listarGrupos()`, exercitado por CT-TSK-02.
    const links = this.page.locator(
      'a[data-change-tab-view][data-params-type-group="POOL"]:visible',
    );
    const quantidade = await links.count();
    /** @type {Array<{ nome: string, quantidade: number, link: import('@playwright/test').Locator }>} */
    const grupos = [];
    for (let i = 0; i < quantidade; i++) {
      const dataNode = await links.nth(i).getAttribute('data-node');
      if (!dataNode) continue;
      const info = /** @type {{ description?: string, totalTask?: number, count?: number }} */ (
        JSON.parse(dataNode)
      );
      grupos.push({
        nome: String(info.description ?? '').trim(),
        quantidade: info.totalTask ?? info.count ?? 0,
        link: links.nth(i),
      });
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
   * Assume a tarefa cujo cartão mostra o número de processo informado (não apenas "a
   * primeira disponível") — usado quando o teste criou a própria massa e precisa
   * distinguir a SC dele de outras que outra execução concorrente possa ter posto no pool.
   * Cada cartão renderiza o número como texto puro seguido do botão "Assumir" no mesmo
   * cartão (confirmado em campo); por isso localizar o texto do número e pegar o PRIMEIRO
   * botão "Assumir" que vem depois dele, na ordem do documento.
   * @param {string | number} numeroProcesso
   * @returns {Promise<number>} o próprio número assumido, confirmado pelo heading da tela
   */
  async assumirTarefaPorNumero(numeroProcesso) {
    const numero = String(numeroProcesso);
    const textoNumero = this.page.getByText(numero, { exact: true }).first();
    await textoNumero.waitFor({ state: 'visible' });
    const botaoAssumir = textoNumero.locator(
      'xpath=following::button[contains(normalize-space(.), "Assumir")][1]',
    );
    await botaoAssumir.click();

    const heading = this.page.getByRole('heading', { level: 2 }).filter({ hasText: /^\d+\s*-/ });
    await heading.waitFor({ state: 'visible' });
    const texto = await heading.innerText();
    const numeroAssumido = texto.match(/^(\d+)\s*-/)?.[1];
    if (numeroAssumido !== numero) {
      throw new Error(
        `Assumiu a tarefa "${numeroAssumido}", mas o esperado era "${numero}" — o cartão pode ter mudado de posição entre localizar o texto e clicar.`,
      );
    }
    return Number(numeroAssumido);
  }

  /**
   * Abre diretamente a tela de detalhe de uma solicitação pelo número do processo — sem
   * passar pela Central de Tarefas. Confirmado em campo: o painel-resumo "Tarefas em pool"
   * pode mostrar contagem desatualizada/zerada (latência de cache) mesmo com uma tarefa
   * real e assumível esperando; a tela de detalhe da própria solicitação é a fonte de
   * verdade — ela expõe "Assumir tarefa" assim que a atividade atual permite.
   * @param {string | number} numeroProcesso
   */
  async abrirDetalheDaSolicitacao(numeroProcesso) {
    await this.page.goto(
      `/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=${numeroProcesso}`,
      { waitUntil: 'domcontentloaded' },
    );
  }

  botaoAssumirTarefaAtual() {
    return this.page.getByRole('button', { name: 'Assumir tarefa' });
  }

  /**
   * Assume a tarefa atual a partir da tela de detalhe já aberta (`abrirDetalheDaSolicitacao`)
   * e espera a seção de decisão da etapa (Sim/Não + Justificativa) aparecer.
   * @param {string | number} numeroProcesso usado só para a mensagem de erro
   */
  async assumirTarefaAtual(numeroProcesso) {
    await this.botaoAssumirTarefaAtual().click();
    const heading = this.page.getByRole('heading', { level: 2 }).filter({ hasText: /^\d+\s*-/ });
    await heading.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {
      throw new Error(`Assumir tarefa da solicitação #${numeroProcesso} não abriu a tela de decisão esperada.`);
    });
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
    const campo = this.campoJustificativaDecisao();

    // PRÉ-CONDIÇÃO: a seção de decisão terminou de montar. Confirmar só que o rádio ficou
    // marcado não bastava — medido em campo em 25/08/2026 (4 workers): a tela de decisão
    // ainda estava carregando (`getLastVersionDocument` em voo) quando o Enviar saiu, e o
    // Fluig respondeu HTTP 500 com "O campo \"Aprovar? - Linha 1\" é obrigatório!". O que
    // acontece nessa janela é o formulário RE-RENDERIZAR a seção depois do `check()`,
    // desmarcando o rádio: a assertion passou no instante certo e o estado se perdeu logo
    // depois. Esperar os controles existirem e o overlay do iframe sair é o que fecha a
    // janela — nesta ordem, porque exigir a ausência do overlay primeiro é satisfeito no
    // primeiro poll em que ele ainda nem foi criado (armadilha registrada no CLAUDE.md).
    await radio.waitFor({ state: 'visible' });
    await campo.waitFor({ state: 'visible' });
    await expect(
      this.frame.locator('.loading-message'),
      'o overlay de carregamento do iframe não saiu — a tela de decisão ainda está montando',
    ).toHaveCount(0, { timeout: 30_000 });

    // Convergência sobre estado observável (não retry cego, não tempo fixo): reaplica o que
    // um re-render tenha desfeito e só sai quando os DOIS campos estão com o valor esperado.
    await expect(async () => {
      if (!(await radio.isChecked())) await radio.check();
      if ((await campo.inputValue()) !== decisao.justificativa) await campo.fill(decisao.justificativa);
      await expect(radio).toBeChecked({ timeout: 2_000 });
      await expect(campo).toHaveValue(decisao.justificativa, { timeout: 2_000 });
    }).toPass({ timeout: 30_000, intervals: [500, 1_000, 2_000, 5_000] });

    await this.botaoEnviar.click();
  }

  /**
   * Após `decidirEEnviar`, o Enviar leva à MESMA tela de confirmação genérica usada na
   * criação da SC ("Solicitação NNNNNN movimentada com sucesso." + link "Acessar
   * solicitação #NNNNNN") — não à tela de detalhe com abas Histórico/Anexos diretamente.
   * Este método segue esse link e espera a tela de detalhe (com a aba Histórico) carregar.
   */
  async abrirDetalheAposConfirmacao() {
    const linkConfirmacao = this.page.getByRole('link', { name: /^\d+$/ }).first();
    // O Fluig pode RECUSAR a movimentação em vez de confirmá-la (medido: HTTP 500 com
    // "Erro ao salvar dados do formulário: - O campo \"Aprovar? - Linha 1\" é obrigatório!").
    // Esperar só pelo link de confirmação transformava essa recusa — que traz a causa escrita
    // na tela — num `locator.waitFor: Timeout 30000ms` sem veredito nenhum.
    const dialogErro = this.page.getByRole('dialog').filter({ hasText: 'Erro' });

    const desfecho = await Promise.any([
      linkConfirmacao.waitFor({ state: 'visible', timeout: 60_000 }).then(() => 'confirmou'),
      dialogErro.waitFor({ state: 'visible', timeout: 60_000 }).then(() => 'recusou'),
    ]).catch(() => 'semRetorno');

    if (desfecho === 'recusou') {
      const texto = (await dialogErro.innerText().catch(() => '(texto indisponível)'))
        .replace(/\s+/g, ' ')
        .trim();
      throw new Error(
        `O Fluig RECUSOU a movimentação da tarefa em vez de confirmá-la. Mensagem exibida ao usuário: "${texto}"`,
      );
    }
    if (desfecho === 'semRetorno') {
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE (ambiente): 60s após acionar Enviar na tela de decisão, o Fluig ' +
          'não deu retorno nenhum — nem a confirmação da movimentação, nem diálogo de erro. ' +
          `URL: ${this.page.url()}`,
      );
    }

    await linkConfirmacao.click();
    await this.headingHistorico().waitFor({ state: 'visible', timeout: 60_000 });
  }

  /** Heading level 2 da tela atual (ex.: "112097 - Validação do Gestor"). */
  headingAtual() {
    return this.page.getByRole('heading', { level: 2 });
  }

  /** Aba/heading "Histórico N" da tela de detalhe — usado para confirmar movimentação. */
  /**
   * A aba "Histórico" troca de papel semântico conforme a tela: `role=link` no formulário
   * recém-aberto (`FormularioSolicitacaoCompraPage`), mas `role=tab` na tela "Detalhes da
   * Solicitação" alcançada após decidir uma etapa — confirmado em campo. `getByText` cobre
   * as duas sem depender de qual papel a tela escolheu.
   */
  headingHistorico() {
    return this.page.getByText(/^\s*Histórico\s*\d*\s*$/).first();
  }

  /**
   * Linha "Atividade atual: <nome da etapa> (<status>)" do Histórico — sempre visível sem
   * rolar a lista (fica fixa no topo do feed). Usada para confirmar que uma decisão
   * (aprovar/reprovar) realmente MOVIMENTOU o processo, sem depender de encontrar a
   * justificativa no feed histórico (que é rolável/pode não estar tudo no DOM de uma vez).
   */
  atividadeAtual() {
    // O rótulo "Atividade atual:" é um <strong class="info-title"> separado do nome da
    // etapa (texto irmão) — por isso o locator localiza esse rótulo e sobe para o `<div>`
    // ancestral mais próximo, que contém o bloco inteiro (rótulo + nome da etapa + status).
    // Tentativas anteriores (filtrar `div, li, p` por `hasText` direto) devolviam texto
    // vazio em campo — o `<strong>` isolado é um alvo mais estável para localizar primeiro.
    return this.page
      .getByText('Atividade atual', { exact: false })
      .first()
      .locator('xpath=ancestor::div[1]');
  }

  /** @returns {Promise<string>} nome da etapa (ex.: "Distribuição Gestor Orçamentario") */
  async lerNomeAtividadeAtual() {
    const texto = (await this.atividadeAtual().textContent()) ?? '';

    // O bloco da atividade atual pode carregar texto extra além do nome — foi observado em
    // "Validação Orçamentária", que soma o aviso de consenso e o link "Visualizar diagrama".
    // Um recorte até o primeiro "(" devolvia esse ruído como se fosse o nome da atividade.
    // Ancorar no rótulo e parar na primeira quebra de linha é o que isola o nome de verdade.
    const m = texto.match(/Atividade atual:?\s*([^\n(]+)/);
    return (m ? m[1] : texto).trim();
  }
}
