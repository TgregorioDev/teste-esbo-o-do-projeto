// @ts-check
import { faltaPreCondicao } from '../utils/pre-condicao.js';

const ROTA_CATALOGO = '/portal/p/1/pageprocessstart';
const ROTA_HOME = '/portal/p/1/home';

/**
 * Favoritar processo e acessá-lo por Favoritos (CT-PLT-05-H).
 *
 * ## O que foi confirmado em campo
 *
 * - O catálogo "Iniciar Solicitações" (`/portal/p/1/pageprocessstart`) tem, em cada card de
 *   processo, um ícone `<em class="flaticon-star" data-process-id="...">` que alterna o
 *   favorito. **Defeito de acessibilidade** (mesma família dos já catalogados no projeto):
 *   o ícone é `aria-hidden="true"` e não tem `role`/nome acessível — `getByRole` não
 *   resolve; o gancho estável é o atributo `data-process-id`.
 * - O estado vive no atributo `data-favorite-process` (`"true"`/`"false"`) e na CLASSE do
 *   ícone (`flaticon-star` quando não favoritado, `flaticon-star-active` quando favoritado)
 *   — por isso os locators desta classe usam só `data-process-id`, estável nos dois estados.
 * - Clicar dispara `POST /ecm/api/rest/ecm/processStart/addFavorites?processId=<id>` (para
 *   favoritar) ou `POST .../removeFavorites?processId=<id>` (para desfavoritar), conforme a
 *   classe ATUAL do ícone no navegador — não conforme o que este script leu por último.
 *   `favoritar`/`desfavoritar` **não** esperam uma dessas chamadas por URL fixa: uma leitura
 *   de estado um instante desatualizada faz o clique disparar a chamada OPOSTA da esperada,
 *   e esperar a URL errada trava até o timeout (reproduzido em campo nesta implementação,
 *   sob `--workers=2`). A condição observável correta é o próprio atributo
 *   `data-favorite-process` alcançar o valor alvo — reconsultado via locator, não via rede.
 * - A Home (`/portal/p/1/home`) tem o widget "Processos favoritos" (`EcmProcessFavorites`),
 *   uma grade com uma linha por processo favoritado:
 *   `<span data-open-favorite-process="<id>">Nome (<id>)</span>`. Clicar na linha navega
 *   para `pageworkflowview?processID=<id>` — é o "acessar por Favoritos" do caso.
 * - Processo recém-iniciado (`Último iniciado` != "Nunca") pode aparecer DUAS vezes no
 *   catálogo — uma vez em "Últimos processos iniciados", outra em "Todos os processos" —
 *   duplicando o ícone no DOM. As duas seções vivem como irmãs dentro do MESMO container
 *   `[id^="processListView_"]` (sufixo numérico dinâmico, igual ao dos menus da Central de
 *   Tarefas): o primeiro filho é `div.row` ("Últimos processos iniciados"), o segundo é
 *   `div.page-divider` ("Todos os processos"). **"Todos os processos" contém cada processo
 *   exatamente uma vez** (confirmado em campo) — por isso todo locator de estrela desta
 *   classe é escopado a essa segunda `div`, em vez de tentar detectar/descartar duplicata:
 *   um filtro de "ocorrência única" no documento inteiro é frágil (quanto mais processos o
 *   usuário inicia ao longo da suíte, mais duplicatas aparecem, podendo esvaziar o pool de
 *   candidatos — foi exatamente o que aconteceu numa rodada desta implementação).
 *
 * ## Por que este caso foi removido antes (e como este desenho evita repetir o erro)
 *
 * Favoritar é estado GLOBAL de uma conta única — `test.describe.configure({mode:'serial'})`
 * não serializa entre repetições de `--repeat-each`, e duas instâncias tocando o mesmo
 * processo produzem falso vermelho. Em vez de serializar, cada execução deve operar sobre um
 * processo DIFERENTE das demais instâncias concorrentes da mesma rodada — ver
 * `escolherCandidatoParaEsteWorker` — e o teste é idempotente/tolerante ao estado inicial
 * (favorita só se não estiver favoritado; desfavorita no teardown só se foi quem favoritou).
 */
export class FavoritosPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async abrirCatalogo() {
    await this.page.goto(ROTA_CATALOGO, { waitUntil: 'domcontentloaded' });
    await this.page.getByRole('heading', { name: 'Todos os processos', exact: true }).waitFor({ state: 'visible' });
    await this.regiaoTodosOsProcessos().locator('em[data-process-id]').first().waitFor({ state: 'visible' });
    // O ícone de favorito é interativo (handler de clique ligado via JS) só depois que as
    // chamadas assíncronas da carga terminam — o card já está VISÍVEL antes disso, então
    // clicar cedo demais não lança erro nenhum, só não faz nada (nenhuma requisição de
    // favorito sai). Confirmado em campo nesta implementação: o mesmo padrão de
    // `tests/e2e/plataforma/home.spec.js` (rede estabilizada, não tempo fixo) resolve.
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Escopo da seção "Todos os processos" do catálogo — a segunda `div` filha do container
   * `[id^="processListView_"]` (a primeira é "Últimos processos iniciados"). Único lugar do
   * catálogo onde cada processo aparece exatamente uma vez (ver doc da classe).
   * @returns {import('@playwright/test').Locator}
   */
  regiaoTodosOsProcessos() {
    return this.page.locator('[id^="processListView_"] > div.page-divider');
  }

  async abrirHome() {
    await this.page.goto(ROTA_HOME, { waitUntil: 'domcontentloaded' });
    await this.page.getByRole('heading', { name: 'Processos favoritos', exact: true }).waitFor({ state: 'visible' });
  }

  /**
   * Ícone de favorito do processo no catálogo. Âncora por `data-process-id` (estável nos
   * dois estados) — ver nota de acessibilidade na doc da classe.
   * @param {string} processId
   * @returns {import('@playwright/test').Locator}
   */
  estrelaDoProcesso(processId) {
    return this.regiaoTodosOsProcessos().locator(`em[data-process-id="${processId}"]`);
  }

  /**
   * @param {string} processId
   * @returns {Promise<boolean>}
   */
  async estaFavoritado(processId) {
    const valor = await this.estrelaDoProcesso(processId).getAttribute('data-favorite-process');
    return valor === 'true';
  }

  /**
   * Favorita o processo — idempotente: não clica se já estiver favoritado, evitando
   * alternar para o estado oposto por engano.
   *
   * A condição observável não é uma resposta de rede específica: o clique dispara
   * `addFavorites` OU `removeFavorites` conforme a CLASSE atual do ícone no navegador (fora
   * do controle deste script), então esperar por uma URL fixa arriscava esperar para sempre
   * se a leitura de `estaFavoritado` estivesse um instante desatualizada. A condição real é
   * o próprio atributo alcançar o valor esperado — um locator escopado a
   * `data-favorite-process="true"` faz Playwright reconsultar o DOM até isso acontecer.
   * @param {string} processId
   */
  async favoritar(processId) {
    if (await this.estaFavoritado(processId)) return;
    await this.#clicarEEsperarEstado(processId, 'true');
  }

  /**
   * Desfavorita o processo — idempotente, espelhando `favoritar` (mesma nota sobre a
   * condição observável ser o atributo, não uma resposta de rede específica).
   * @param {string} processId
   */
  async desfavoritar(processId) {
    if (!(await this.estaFavoritado(processId))) return;
    await this.#clicarEEsperarEstado(processId, 'false');
  }

  /**
   * Clica na estrela e espera o atributo alcançar o valor alvo, reemitindo o clique se o
   * primeiro não surtir efeito.
   *
   * Confirmado em campo (reproduzido de forma isolada, fora deste método, com o mesmo
   * `data-process-id` que ora falhava ora funcionava): o clique nesse ícone só é tratado
   * DEPOIS que o binding assíncrono do handler de clique deste widget termina — o card já
   * está visível e clicável antes disso, então o clique não lança erro nenhum, só não faz
   * nada. `abrirCatalogo` já espera a rede estabilizar, mas isso não é garantia suficiente
   * quando a suíte roda com captura de vídeo/trace ativada (mais carga de CPU concorrente
   * no navegador) — por isso o clique é reemitido em vez de confiar num único disparo.
   * @param {string} processId
   * @param {'true' | 'false'} valorAlvo
   */
  async #clicarEEsperarEstado(processId, valorAlvo) {
    const estrelaNoEstadoAlvo = this.regiaoTodosOsProcessos().locator(
      `em[data-process-id="${processId}"][data-favorite-process="${valorAlvo}"]`,
    );
    const tentativas = 4;
    for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
      await this.estrelaDoProcesso(processId).click();
      try {
        await estrelaNoEstadoAlvo.waitFor({ state: 'attached', timeout: 5_000 });
        return;
      } catch (erro) {
        if (tentativa === tentativas) throw erro;
      }
    }
  }

  /**
   * Linha do widget "Processos favoritos" na Home referente ao processo.
   * @param {string} processId
   * @returns {import('@playwright/test').Locator}
   */
  linhaDoProcessoFavorito(processId) {
    return this.page.locator(`[data-open-favorite-process="${processId}"]`);
  }

  /**
   * Clica na linha do processo no widget de Favoritos da Home e espera a navegação para a
   * tela de movimentação do processo — é o "acessar por Favoritos" do caso.
   * @param {string} processId
   */
  async abrirProcessoPorFavoritos(processId) {
    await this.linhaDoProcessoFavorito(processId).click();
    await this.page.waitForURL(new RegExp(`processID=${processId}(&|$)`), { timeout: 30_000 });
  }

  /**
   * Descobre, na seção "Todos os processos" do catálogo já carregado, os processos
   * disponíveis para favoritar — cada um em ocorrência única nessa seção (ver doc da
   * classe), então não precisa filtrar duplicata.
   * @returns {Promise<string[]>}
   */
  async listarCandidatosSeguros() {
    const ids = await this.regiaoTodosOsProcessos()
      .locator('em[data-process-id]')
      .evaluateAll((elementos) => elementos.map((el) => el.getAttribute('data-process-id')));
    return /** @type {string[]} */ (ids.filter((id) => id !== null));
  }
}

/**
 * Escolhe, de forma determinística, um candidato diferente por instância concorrente da
 * MESMA execução (`--workers` × `--repeat-each`) — evita que duas instâncias favoritem/
 * desfavoritem o mesmo processo ao mesmo tempo, que foi a causa raiz da remoção anterior
 * deste caso (estado global de conta única não sobrevive a `describe.serial` entre
 * repetições).
 *
 * Não é aleatório de propósito: aleatório reduz a chance de colisão mas não a elimina, e
 * "geralmente passa" não é o padrão de determinismo exigido pelo projeto.
 *
 * @param {string[]} candidatos
 * @param {{ parallelIndex: number, repeatEachIndex: number }} testInfo
 * @returns {string}
 */
export function escolherCandidatoParaEsteWorker(candidatos, testInfo) {
  if (candidatos.length === 0) {
    faltaPreCondicao(
      'o catálogo "Iniciar Solicitações" não listou nenhum processo ' +
        'com ícone de favorito em ocorrência única no DOM. Isto NÃO é defeito do produto sob ' +
        'teste — confirme que o catálogo carregou processos antes de reexecutar.',
    );
  }
  const chave = testInfo.repeatEachIndex * 1000 + testInfo.parallelIndex;
  return candidatos[chave % candidatos.length];
}
