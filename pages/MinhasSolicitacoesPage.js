// @ts-check

/** Rota da Central de Tarefas. */
const ROTA_CENTRAL_TAREFAS = '/portal/p/1/pagecentraltask';

/**
 * "Minhas Solicitações" — Central de Tarefas > Mais opções > Solicitações > Minhas solicitações
 * (`/portal/p/1/pagecentraltask`).
 *
 * Serve à cadeia E2E que precisa CONFIRMAR onde uma SC recém-criada realmente pousou: estado
 * (`stateDescription`) e responsável (`colleagueName`) — os dois campos que expõem D-01 na
 * prática (SC presa em "Início", responsável "Usuário Integrador Fluig" em vez do solicitante).
 *
 * Particularidade observada em campo: a listagem pagina por `processInstanceId` crescente
 * (15 registros por página) — uma SC recém-criada, por ter o maior id, tipicamente cai numa
 * página adiante da primeira. `localizarPorProcessInstanceId` varre as páginas seguintes
 * reaproveitando a MESMA URL/parâmetros que a UI já usou (troca só `page`), em vez de repetir a
 * navegação de UI a cada página — mais rápido e igualmente autenticado (mesma sessão do browser).
 */
export class MinhasSolicitacoesPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.tituloCentral = page.getByRole('heading', { name: 'Central de tarefas' });
    this.linkMaisOpcoes = page.getByRole('link', { name: 'Mais opções' });
    this.linkAbaSolicitacoes = page.getByRole('link', { name: /^Solicitações/ });
    this.linkMinhasSolicitacoes = page.getByRole('link', { name: /^Minhas solicitações/ });
  }

  async goto() {
    await this.page.goto(ROTA_CENTRAL_TAREFAS, { waitUntil: 'domcontentloaded' });
    await this.tituloCentral.waitFor({ state: 'visible' });
  }

  /**
   * Abre "Minhas Solicitações" pela UI e devolve a resposta da PRIMEIRA página — a mesma
   * chamada que `CentralTarefasPage.abrirMinhasSolicitacoes` aguarda, mas aqui o corpo da
   * resposta é o que interessa (não só a UI carregada).
   * @returns {Promise<import('@playwright/test').Response>}
   */
  async abrir() {
    await this.linkMaisOpcoes.click();
    await this.linkAbaSolicitacoes.click();
    const respostaPromise = this.page.waitForResponse((r) =>
      r.url().includes('/ecm/api/rest/ecm/centralTasks/getTasks/requests/'),
    );
    await this.linkMinhasSolicitacoes.click();
    return respostaPromise;
  }

  /**
   * Localiza um processo pelo `processInstanceId`, varrendo as páginas da listagem.
   * Devolve `null` quando não encontrado dentro do limite de páginas — quem chama decide se
   * isso é falha (SC deveria estar lá) ou espera legítima (ainda não propagou).
   *
   * @param {number|string} processInstanceId
   * @param {{ maxPaginas?: number }} [opcoes]
   * @returns {Promise<Record<string, any> | null>}
   */
  async localizarPorProcessInstanceId(processInstanceId, opcoes = {}) {
    const maxPaginas = opcoes.maxPaginas ?? 6;
    const alvo = String(processInstanceId);

    // Recarrega a Central de Tarefas antes de abrir "Minhas Solicitações" — necessário para
    // chamar este método repetidamente (poll/retry): sem reload, uma segunda chamada encontra
    // a sub-aba já aberta, o clique em "Minhas solicitações" não dispara requisição nova, e
    // `abrir()` fica esperando por uma resposta que nunca chega.
    await this.goto();
    const primeiraResposta = await this.abrir();
    const primeiroJson = await primeiraResposta.json();

    /** @type {Record<string, any> | undefined} */
    let achou = primeiroJson.invdata?.find((/** @type {any} */ r) => String(r.processInstanceId) === alvo);
    if (achou) return achou;

    const totalPaginas = Math.min(primeiroJson.totalpages ?? 1, maxPaginas);
    const url = new URL(primeiraResposta.url());

    for (let pagina = 2; pagina <= totalPaginas; pagina += 1) {
      url.searchParams.set('page', String(pagina));
      // GET direto (mesma sessão/cookies do browser) — evita repetir a navegação de UI por
      // página só para paginar uma busca.
      const resposta = await this.page.request.get(url.toString());
      const json = await resposta.json();
      achou = json.invdata?.find((/** @type {any} */ r) => String(r.processInstanceId) === alvo);
      if (achou) return achou;
    }

    return null;
  }
}
