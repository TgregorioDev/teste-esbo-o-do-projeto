// @ts-check
import { localizarNaListagemPaginada } from '../utils/central-tarefas-paginacao.js';

/**
 * Central de Tarefas (`/portal/p/1/pagecentraltask`) — sub-fluxo de "Tarefas em pool".
 *
 * Não duplica `pages/CentralTarefasPage.js` (Resumo, Minhas Solicitações): este Page Object
 * cobre exclusivamente o caminho "Mais opções → Tarefas em pool → grupo → Assumir",
 * confirmado em campo — na plataforma real, via execução real do Playwright (não por
 * inspeção manual do DOM, que levou a uma leitura errada na primeira tentativa; ver nota
 * abaixo) — durante a implementação de CT-TSK-02-H.
 *
 * ## O que foi confirmado em campo
 *
 * - "Tarefas em pool" só aparece como aba de primeiro nível DEPOIS de abrir "Mais opções"
 *   (que, ao ser clicado, substitui "Tarefas a concluir" no tablist principal por "Tarefas
 *   em pool N") — por isso `abrirGruposDoPool` clica em "Mais opções" antes de clicar na
 *   categoria "Tarefas em pool".
 * - Cada grupo aparece como um link `"<nome do grupo> (<quantidade>)"` com um atributo
 *   `data-node` (JSON) trazendo `taskId`, `description` e `totalTask` — só existe grupo com
 *   pelo menos 1 tarefa pendente.
 * - Clicar no grupo NÃO navega — troca o conteúdo da própria Central de Tarefas para uma
 *   listagem in-page ("Exibindo: Tarefas em pool do grupo \"<nome>\""), com um
 *   `task-card-component` por tarefa (mesmo componente de "Minhas Solicitações"/"Tarefas a
 *   concluir"), cada um com um botão **"Assumir"** próprio.
 * - Clicar em "Assumir" abre um DIÁLOGO de confirmação: heading
 *   `"Você assumiu a solicitação <N>"`, parágrafo "Ela pode ser encontrada na lista de
 *   tarefas a concluir." e dois botões, "Fechar" e "Acessar tarefa". "Acessar tarefa" navega
 *   para a tela de "Movimentar Solicitação" da MESMA solicitação, agora como responsável.
 *   (A hipótese inicial — de que "Assumir" chamaria diretamente
 *   `GET .../workflowView/takeTask` e a navegação seria automática, sem diálogo — não se
 *   confirmou: o `waitForResponse` correspondente nunca resolvia porque o clique é tratado
 *   inteiramente no cliente até o diálogo aparecer. A condição observável correta é o
 *   diálogo, não uma chamada de rede específica.)
 * - Assumir uma tarefa move a solicitação assumida para os cartões de "Tarefas a concluir"
 *   (prova específica, por identificador). O contador agregado de "Tarefas em pool"/
 *   "Tarefas a concluir" no Resumo NÃO é uma prova confiável disso neste ambiente: é
 *   homologação compartilhada com fluxo contínuo de novas tarefas de pool chegando por
 *   conta própria — o total pode subir entre o "antes" e o "depois" de um teste mesmo com a
 *   assunção funcionando perfeitamente, porque chegou massa nova no meio do caminho
 *   (confirmado em campo nesta implementação). Testes desta suíte não devem assertar sobre
 *   esse contador antes/depois pelo mesmo motivo que não fixam o valor de um contrato (ver
 *   `utils/massa-contratos.js`).
 *
 * ### Correção de rota registrada durante a implementação
 *
 * Uma investigação manual anterior (fora do Playwright, manipulando o DOM via
 * `element.click()`/CSS forçado para contornar um menu que parecia depender de `:hover`)
 * levou à leitura errada de que o clique no grupo abria diretamente uma tela de "Detalhes da
 * Solicitação" com um botão "Assumir tarefa" — e que só existiria UMA tarefa por grupo. A
 * PRIMEIRA execução real do Playwright Test contra este Page Object provou o contrário: o
 * clique no grupo é 100% estável via `locator.click()` normal (sem hack nenhum) e leva à
 * listagem in-page acima. A causa provável do engano: a manipulação manual do DOM abriu um
 * caminho alternativo (a query de "detalhes" por `processInstanceId`), não o fluxo real do
 * usuário. Fica registrado para quem investigar comportamento similar não confiar em clique
 * disparado fora do Playwright real para inferir o fluxo de UI.
 */
export class PoolTarefasPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.linkMaisOpcoes = page.getByRole('link', { name: 'Mais opções' });

    /** Categoria "Tarefas em pool", promovida a aba de primeiro nível após abrir "Mais opções". */
    this.linkCategoriaTarefasEmPool = page.getByRole('link', { name: /^Tarefas em pool/ });

    /** Links de grupo do pool (um por grupo com tarefa pendente), lidos por `data-node`. */
    this.linksDeGrupo = page.locator('a[data-change-tab-view][data-params-type-group="POOL"]:visible');

    /** Rótulo "Exibindo: Tarefas em pool do grupo "..."" que confirma a listagem carregada. */
    this.rotuloListaDoGrupo = page.getByText(/^Tarefas em pool do grupo/);

    /** Cartões de tarefa da listagem in-page (grupo aberto, "Minhas Solicitações", etc.). */
    this.cartoesDeTarefa = page.locator('task-card-component');

    /** Botão "Assumir" dentro de cada cartão de tarefa da listagem do grupo. */
    this.botoesAssumir = page.getByRole('button', { name: 'Assumir', exact: true });

    /** Diálogo de confirmação exibido após "Assumir" ter sucesso. */
    this.headingConfirmacaoAssumir = page.getByRole('heading', {
      level: 5,
      name: /^Você assumiu a solicitação/,
    });
    this.botaoAcessarTarefaAssumida = page.getByRole('button', { name: 'Acessar tarefa' });
    this.botaoFecharConfirmacao = page.getByRole('button', { name: 'Fechar', exact: true });

    /** Aba de primeiro nível "Tarefas a concluir", usada para confirmar a tarefa assumida. */
    this.abaTarefasAConcluir = page.getByRole('tab', { name: /^Tarefas a concluir/ });
  }

  /**
   * Abre o flyout "Mais opções" e a categoria "Tarefas em pool", esperando os links de
   * grupo terminarem de renderizar. Pré-condição: já está na Central de Tarefas.
   */
  async abrirGruposDoPool() {
    await this.linkMaisOpcoes.click();
    await this.linkCategoriaTarefasEmPool.click();
    await this.linksDeGrupo.first().waitFor({ state: 'visible' });
  }

  /**
   * Lê os grupos de pool anunciados no flyout, com a quantidade de tarefas de cada um —
   * extraída do atributo `data-node` (JSON), não do texto, que também traz o nome do grupo.
   * @returns {Promise<Array<{ indice: number, taskId: string, descricao: string, total: number }>>}
   */
  async listarGrupos() {
    const quantidade = await this.linksDeGrupo.count();
    /** @type {Array<{ indice: number, taskId: string, descricao: string, total: number }>} */
    const grupos = [];
    for (let indice = 0; indice < quantidade; indice++) {
      const dataNode = await this.linksDeGrupo.nth(indice).getAttribute('data-node');
      if (!dataNode) continue;
      const info = /** @type {{ taskId: string, description: string, totalTask?: number, count?: number }} */ (
        JSON.parse(dataNode)
      );
      grupos.push({
        indice,
        taskId: info.taskId,
        descricao: info.description,
        total: info.totalTask ?? info.count ?? 0,
      });
    }
    return grupos;
  }

  /**
   * Abre o grupo de índice informado — troca o conteúdo da Central de Tarefas para a
   * listagem in-page das tarefas desse grupo, cada uma com botão "Assumir".
   *
   * O link do grupo é injetado dinamicamente (flyout "Mais opções" → categoria "Tarefas em
   * pool", ambos via JS) e, como o ícone de favorito do catálogo (ver
   * `pages/FavoritosPage.js`), fica VISÍVEL antes do handler de clique estar de fato ligado
   * — confirmado em campo nesta implementação: o primeiro clique às vezes não navega para
   * lugar nenhum, sem erro. Por isso o clique é reemitido até o rótulo da listagem aparecer,
   * em vez de confiar num único disparo.
   * @param {number} indice
   */
  async abrirGrupo(indice) {
    const tentativas = 4;
    for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
      await this.linksDeGrupo.nth(indice).click();
      try {
        await this.rotuloListaDoGrupo.waitFor({ state: 'visible', timeout: 5_000 });
        break;
      } catch (erro) {
        if (tentativa === tentativas) throw erro;
      }
    }
    await this.botoesAssumir.first().waitFor({ state: 'visible' });
  }

  /**
   * Identificadores (número da solicitação) dos cartões atualmente listados — mesmo padrão
   * de `CentralTarefasPage.lerIdentificadoresSolicitacoes`, mas o cartão de pool não
   * concatena "Selecionar" e o número no mesmo nó de texto, então lê o texto do cartão
   * inteiro e casa o primeiro grupo de dígitos isolado.
   * @returns {Promise<string[]>}
   */
  async listarIdentificadoresDoGrupo() {
    const textos = await this.cartoesDeTarefa.allInnerTexts();
    return /** @type {string[]} */ (
      textos.map((t) => t.match(/\b(\d{5,})\b/)?.[1]).filter((id) => id !== undefined)
    );
  }

  /**
   * Clica no botão "Assumir" do cartão de índice informado e espera o diálogo de
   * confirmação — condição observável real (ver nota na doc da classe sobre por que não é
   * uma resposta de rede específica). Retorna o identificador da solicitação assumida, lido
   * do próprio heading de confirmação.
   * @param {number} [indiceTarefa]
   * @returns {Promise<string>}
   */
  async assumirTarefa(indiceTarefa = 0) {
    await this.botoesAssumir.nth(indiceTarefa).click();
    await this.headingConfirmacaoAssumir.waitFor({ state: 'visible', timeout: 30_000 });
    const texto = await this.headingConfirmacaoAssumir.innerText();
    const id = texto.match(/(\d+)/)?.[1];
    if (!id) {
      throw new Error(`Não foi possível ler o identificador da solicitação no diálogo de confirmação: "${texto}"`);
    }
    return id;
  }

  /**
   * No diálogo de confirmação já aberto (após `assumirTarefa`), clica em "Acessar tarefa" e
   * espera a navegação para a tela de "Movimentar Solicitação" da tarefa assumida.
   *
   * O botão abre a tarefa em NOVA ABA (mesmo padrão dos cards do catálogo de processos,
   * `target="_blank"`) — por isso não navega a própria `page`; devolve a página nova.
   * @returns {Promise<import('@playwright/test').Page>}
   */
  async acessarTarefaAssumida() {
    const [novaAba] = await Promise.all([
      this.page.context().waitForEvent('page', { timeout: 30_000 }),
      this.botaoAcessarTarefaAssumida.click(),
    ]);
    await novaAba.waitForURL((url) => url.pathname.includes('pageworkflowview'), { timeout: 30_000 });
    return novaAba;
  }

  /** Fecha o diálogo de confirmação exibido após `assumirTarefa`, sem sair da Central de Tarefas. */
  async fecharConfirmacao() {
    await this.botaoFecharConfirmacao.click();
    await this.headingConfirmacaoAssumir.waitFor({ state: 'hidden' });
  }

  /**
   * Abre "Tarefas a concluir" e lista os cartões de tarefas minhas.
   *
   * A Central de Tarefas guarda a sub-aba ativa por SESSÃO (`docs/mapa-do-ambiente.md`):
   * como este fluxo acabou de visitar "Tarefas em pool" via "Mais opções", ela toma o lugar
   * de "Tarefas a concluir" nas duas abas de primeiro nível — "Tarefas a concluir" passa a
   * viver dentro do próprio "Mais opções". Por isso tenta a aba de primeiro nível primeiro
   * e cai para o flyout quando ela não está visível.
   */
  async abrirTarefasAConcluir() {
    // A resposta é o que permite varrer a listagem inteira depois (ver
    // `localizarTarefaAConcluirPorId`): dela sai a URL exata que a UI usou, com a mesma
    // sessão e o mesmo filtro.
    const resposta = this.page.waitForResponse(
      (r) => /centralTasks\/getTasks\/open\//.test(r.url()) && r.request().method() === 'GET',
    );
    if (await this.abaTarefasAConcluir.isVisible().catch(() => false)) {
      await this.abaTarefasAConcluir.click();
    } else {
      await this.linkMaisOpcoes.click();
      await this.page.getByRole('link', { name: /^Tarefas a concluir/ }).click();
    }
    return resposta;
  }

  /**
   * Procura uma tarefa em "Tarefas a concluir" pelo `processInstanceId`, varrendo a listagem
   * INTEIRA.
   *
   * ⚠️ Por que não basta ler os cartões da tela: a UI chama
   * `GET /ecm/api/rest/ecm/centralTasks/getTasks/open/<login>` com `rows=15&sord=asc` e
   * renderiza só esse lote. Uma tarefa recém-assumida tem o MAIOR `processInstanceId`, então
   * fica no fim da fila e nunca aparece nos 15 primeiros cartões. Medido em 25/08/2026: o
   * teste reprovava com `identificadores ([112097…112307]) deveriam incluir 112312` — a
   * tarefa ESTAVA lá, a leitura é que enxergava só o começo. Mesmo defeito que existia em
   * "Minhas Solicitações"; a varredura é compartilhada por isso.
   *
   * @param {string|number} processInstanceId
   * @returns {Promise<Record<string, any> | null>} o registro, ou `null` se não está na listagem
   */
  async localizarTarefaAConcluirPorId(processInstanceId) {
    const primeiraResposta = await this.abrirTarefasAConcluir();
    return localizarNaListagemPaginada(this.page, primeiraResposta.url(), processInstanceId);
  }
}

/**
 * Escolhe, dentre os grupos de pool anunciados, o primeiro com pelo menos 1 tarefa.
 *
 * Falha com mensagem explícita quando não há nenhum — separando "não há tarefa de pool
 * disponível agora" de "defeito do produto", no mesmo padrão de
 * `utils/massa-contratos.js` (`descobrirContratoVigente`).
 *
 * @param {Array<{ indice: number, taskId: string, descricao: string, total: number }>} grupos
 * @returns {{ indice: number, taskId: string, descricao: string, total: number }}
 */
export function descobrirGrupoComTarefas(grupos) {
  const disponivel = grupos.find((g) => g.total > 0);
  if (!disponivel) {
    throw new Error(
      'PRÉ-CONDIÇÃO AUSENTE: o flyout "Mais opções → Tarefas em pool" não anunciou nenhum ' +
        `grupo com tarefa pendente (grupos encontrados: ${JSON.stringify(grupos)}). ` +
        'Não há tarefa de pool disponível para assumir agora — isto NÃO é defeito do produto ' +
        'sob teste. Confirme que o usuário TOTVS-FS pertence a algum pool com tarefas ' +
        'pendentes (ex.: "Validação do Gestor Imediato", "Validação dos Compradores") antes ' +
        'de reexecutar.',
    );
  }
  return disponivel;
}
