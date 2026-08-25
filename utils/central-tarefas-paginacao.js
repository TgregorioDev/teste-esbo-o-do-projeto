// @ts-check

/**
 * Varredura paginada das listagens da Central de Tarefas do Fluig.
 *
 * As duas listagens que a suíte consulta — `getTasks/requests/<login>` ("Minhas Solicitações")
 * e `getTasks/open/<login>` ("Tarefas a concluir") — têm o MESMO comportamento, medido em
 * 25/08/2026, e ele derruba a leitura ingênua de três formas:
 *
 * 1. **A UI renderiza um lote só** (`rows=15`). Ler os cartões do DOM devolve a primeira
 *    página, não a listagem. Foi essa a causa de dois falsos vermelhos: a Solicitação de
 *    Compras recém-criada e a tarefa recém-assumida ESTAVAM na listagem, e a leitura só
 *    enxergava o começo dela.
 * 2. **`sord=asc`**: a UI ordena crescente por `processInstanceId`, então o registro
 *    recém-criado — que tem o MAIOR id — fica no fim da fila, inalcançável na prática.
 * 3. **`totalpages` e `totalrecords` NÃO são o total.** Descrevem só o que já foi paginado
 *    (página 1 diz `2/16`; página 10 diz `11/151`), porque a paginação é por cursor.
 *    Confiar neles limita a varredura a duas páginas.
 *
 * Daí a estratégia: reaproveitar a URL que a própria UI acabou de usar (mesma sessão, mesmo
 * filtro), trocar a ordenação para `desc` e paginar até achar o alvo ou até a página já ter
 * descido abaixo dele — em ordem decrescente ele não pode reaparecer adiante. Isso dá
 * resposta EXATA ("não está na listagem") em vez de um teto arbitrário de páginas.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} urlDaPrimeiraResposta URL exata que a UI usou ao abrir a listagem
 * @param {string|number} processInstanceId
 * @param {{ maxPaginas?: number }} [opcoes]
 * @returns {Promise<Record<string, any> | null>} o registro, ou `null` se não está na listagem
 */
export async function localizarNaListagemPaginada(
  page,
  urlDaPrimeiraResposta,
  processInstanceId,
  opcoes = {},
) {
  const maxPaginas = opcoes.maxPaginas ?? 40;
  const alvo = Number(processInstanceId);

  const url = new URL(urlDaPrimeiraResposta);
  url.searchParams.set('sidx', 'processInstanceId');
  url.searchParams.set('sord', 'desc');

  let menorIdDaPaginaAnterior = Number.POSITIVE_INFINITY;

  for (let pagina = 1; pagina <= maxPaginas; pagina += 1) {
    url.searchParams.set('page', String(pagina));
    const resposta = await page.request.get(url.toString());
    const json = await resposta.json();
    /** @type {Record<string, any>[]} */
    const registros = json.invdata ?? [];
    if (registros.length === 0) return null;

    const achou = registros.find((r) => Number(r.processInstanceId) === alvo);
    if (achou) return achou;

    const menorIdDaPagina = Math.min(...registros.map((r) => Number(r.processInstanceId)));

    // Ordem decrescente: passou do alvo, ele não está na listagem.
    if (menorIdDaPagina < alvo) return null;

    // Proteção contra paginação que não avança (as páginas se sobrepõem em um registro, então
    // o critério é o menor id DIMINUIR de uma página para a seguinte).
    if (menorIdDaPagina >= menorIdDaPaginaAnterior) return null;
    menorIdDaPaginaAnterior = menorIdDaPagina;
  }

  return null;
}
