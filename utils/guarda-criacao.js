// @ts-check

/**
 * Trava de segurança contra escrita no ambiente do cliente.
 *
 * O ambiente sob teste é o Fluig real da Cassi, integrado ao Protheus. Uma Solicitação de
 * Compra criada por engano é um registro que **não tem exclusão disponível** — sobra na
 * base do cliente para sempre.
 *
 * Esta guarda intercepta a criação/movimentação de processo e a bloqueia, contando as
 * tentativas. Ela cumpre dois papéis:
 *
 * 1. **Segurança** — nenhuma spec da suíte padrão consegue escrever, mesmo se um seletor
 *    mudar e o teste clicar onde não devia.
 * 2. **Assertion** — "o sistema NÃO deve criar a solicitação" deixa de ser presunção e
 *    passa a ser verificável: basta afirmar que nenhuma tentativa saiu.
 *
 * Leitura (GET) segue normalmente — só a escrita é bloqueada.
 */

/**
 * @typedef {Object} GuardaCriacao
 * @property {() => number} tentativas quantas requisições de escrita foram bloqueadas
 * @property {() => string[]} urls as URLs bloqueadas, para diagnóstico na falha
 */

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<GuardaCriacao>}
 */
export async function bloquearCriacaoDeSolicitacao(page) {
  /** @type {string[]} */
  const bloqueadas = [];

  await page.route('**/process-management/**', async (route, request) => {
    if (request.method() === 'GET') return route.fallback();

    bloqueadas.push(`${request.method()} ${request.url()}`);
    await route.abort('blockedbyclient');
  });

  return {
    tentativas: () => bloqueadas.length,
    urls: () => [...bloqueadas],
  };
}
