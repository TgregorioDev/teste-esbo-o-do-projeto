// @ts-check
import { localizarNaListagemPaginada } from '../utils/central-tarefas-paginacao.js';

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
 * ## Como esta listagem realmente pagina (medido em 25/08/2026 — corrige o que estava aqui antes)
 *
 * O endpoint é `GET /ecm/api/rest/ecm/centralTasks/getTasks/requests/<login>`, e a UI o chama com
 * `sidx=processInstanceId&sord=asc&rows=15`. Três comportamentos que decidem o desenho deste
 * Page Object, todos confirmados em campo:
 *
 * 1. **`totalpages` e `totalrecords` NÃO são o total.** Eles descrevem só o que já foi paginado:
 *    na página 1 vêm `totalpages: 2 / totalrecords: 16`; na página 2, `3 / 31`; na página 10,
 *    `11 / 151`. A paginação é por cursor (`firstValue` + `pageDirection` no filtro), e o número
 *    de páginas cresce a cada requisição. Confiar em `totalpages` limita a varredura a duas
 *    páginas.
 * 2. **Em `sord=asc` a varredura começa pelas solicitações MAIS ANTIGAS.** Uma SC recém-criada,
 *    que tem o maior `processInstanceId`, fica no fim da fila — inalcançável na prática. Foi
 *    exatamente esta a causa de `SC <N> deveria aparecer em "Solicitadas por mim" → Received: null`
 *    após 60s de poll: a SC ESTAVA na listagem (medido: 112475 e 112477, ambas em "Início" com
 *    responsável "Usuário Integrador Fluig"), mas a leitura só olhava os 31 registros mais antigos
 *    (112096–112183).
 * 3. **As páginas se sobrepõem em um registro**: o último id da página N reaparece como primeiro
 *    da página N+1, e cada página traz 16 registros com `rows=15`.
 *
 * Daí a estratégia: paginar em `sord=desc` (do maior id para o menor), o que coloca a SC
 * recém-criada nas primeiras páginas, e parar assim que a página já tiver descido abaixo do id
 * procurado — em ordem decrescente, ele não pode aparecer mais adiante. Isso dá uma resposta
 * EXATA ("não está na listagem") em vez de um limite arbitrário de páginas.
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
   * Localiza um processo pelo `processInstanceId`, varrendo a listagem em ordem DECRESCENTE de
   * id (ver a nota da classe: em ordem crescente uma SC recém-criada nunca é alcançada).
   *
   * Devolve `null` quando o processo não está na listagem — o que aqui é uma resposta medida, e
   * não um limite de varredura: em ordem decrescente, se a página já desceu abaixo do id
   * procurado, ele não aparece mais adiante. Quem chama decide se isso é falha (a SC deveria
   * estar lá) ou espera legítima (o servidor ainda não indexou).
   *
   * @param {number|string} processInstanceId
   * @param {{ maxPaginas?: number }} [opcoes] teto de segurança contra paginação que não avança
   * @returns {Promise<Record<string, any> | null>}
   */
  async localizarPorProcessInstanceId(processInstanceId, opcoes = {}) {
    // Recarrega a Central de Tarefas antes de abrir "Minhas Solicitações" — necessário para
    // chamar este método repetidamente (poll/retry): sem reload, uma segunda chamada encontra
    // a sub-aba já aberta, o clique em "Minhas solicitações" não dispara requisição nova, e
    // `abrir()` fica esperando por uma resposta que nunca chega.
    await this.goto();
    const primeiraResposta = await this.abrir();

    // A varredura em si vive em `utils/central-tarefas-paginacao.js`: "Tarefas a concluir"
    // (`getTasks/open`) pagina exatamente igual, e duplicar esta lógica sutil aqui e lá seria
    // convite para as duas divergirem.
    return localizarNaListagemPaginada(this.page, primeiraResposta.url(), processInstanceId, opcoes);
  }
}
