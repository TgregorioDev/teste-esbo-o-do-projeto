// @ts-check

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
 *   favoritar) ou `POST .../removeFavorites?processId=<id>` (para desfavoritar) — ambos
 *   200. É a condição observável usada para sincronizar, em vez de tempo fixo.
 * - A Home (`/portal/p/1/home`) tem o widget "Processos favoritos" (`EcmProcessFavorites`),
 *   uma grade com uma linha por processo favoritado:
 *   `<span data-open-favorite-process="<id>">Nome (<id>)</span>`. Clicar na linha navega
 *   para `pageworkflowview?processID=<id>` — é o "acessar por Favoritos" do caso.
 * - Processo recém-iniciado (`Último iniciado` != "Nunca") pode aparecer DUAS vezes no
 *   catálogo ("Últimos processos iniciados" + "Todos os processos"), duplicando o ícone no
 *   DOM. `listarCandidatosSeguros` descarta esses (mantém só `data-process-id` com 1 única
 *   ocorrência), para nunca operar sobre um card ambíguo.
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
    return this.page.locator(`em[data-process-id="${processId}"]`);
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
   * Favorita o processo — idempotente: não clica (nem espera requisição) se já estiver
   * favoritado, evitando alternar para o estado oposto por engano.
   * @param {string} processId
   */
  async favoritar(processId) {
    if (await this.estaFavoritado(processId)) return;
    const resposta = this.page.waitForResponse(
      (r) =>
        r.url().includes('/ecm/api/rest/ecm/processStart/addFavorites') &&
        r.url().includes(`processId=${processId}`) &&
        r.request().method() === 'POST',
    );
    await this.estrelaDoProcesso(processId).click();
    await resposta;
  }

  /**
   * Desfavorita o processo — idempotente, espelhando `favoritar`.
   * @param {string} processId
   */
  async desfavoritar(processId) {
    if (!(await this.estaFavoritado(processId))) return;
    const resposta = this.page.waitForResponse(
      (r) =>
        r.url().includes('/ecm/api/rest/ecm/processStart/removeFavorites') &&
        r.url().includes(`processId=${processId}`) &&
        r.request().method() === 'POST',
    );
    await this.estrelaDoProcesso(processId).click();
    await resposta;
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
   * Descobre, no catálogo já carregado, os processos com ícone de favorito em UMA única
   * ocorrência no DOM (descarta os duplicados por aparecerem em "Últimos processos
   * iniciados" + "Todos os processos" ao mesmo tempo — ver doc da classe).
   * @returns {Promise<string[]>}
   */
  async listarCandidatosSeguros() {
    const estrelas = this.page.locator('em[data-process-id]');
    const total = await estrelas.count();
    /** @type {Record<string, number>} */
    const ocorrencias = {};
    for (let i = 0; i < total; i++) {
      const id = await estrelas.nth(i).getAttribute('data-process-id');
      if (!id) continue;
      ocorrencias[id] = (ocorrencias[id] ?? 0) + 1;
    }
    return Object.entries(ocorrencias)
      .filter(([, vezes]) => vezes === 1)
      .map(([id]) => id);
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
    throw new Error(
      'PRÉ-CONDIÇÃO AUSENTE: o catálogo "Iniciar Solicitações" não listou nenhum processo ' +
        'com ícone de favorito em ocorrência única no DOM. Isto NÃO é defeito do produto sob ' +
        'teste — confirme que o catálogo carregou processos antes de reexecutar.',
    );
  }
  const chave = testInfo.repeatEachIndex * 1000 + testInfo.parallelIndex;
  return candidatos[chave % candidatos.length];
}
