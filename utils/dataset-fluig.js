// @ts-check
import { ROTA_DATASET } from '../config/ambiente.js';

/**
 * Interceptação de dataset do Fluig.
 *
 * No Fluig, TODO dataset — interno ou customizado — é executado pelo mesmo endpoint
 * (`POST /api/public/ecm/dataset/datasets`); o dataset chamado vai no corpo, em `name`.
 * Por isso não dá para interceptar por URL: é preciso ler o corpo da requisição.
 *
 * Usado nos cenários de erro e permissão, que não são reproduzíveis de outra forma sem
 * derrubar serviço do cliente ou provisionar um segundo usuário.
 */

/**
 * @param {import('@playwright/test').Request} request
 * @returns {string} nome do dataset chamado, ou string vazia quando não é chamada de dataset
 */
function nomeDoDataset(request) {
  const corpo = request.postData();
  if (!corpo) return '';
  try {
    const json = /** @type {{ name?: string }} */ (JSON.parse(corpo));
    return json.name ?? '';
  } catch {
    // Corpo não-JSON não é chamada de dataset: segue o fluxo normal.
    return '';
  }
}

/**
 * Responde um dataset específico com o conteúdo informado, deixando todos os demais
 * seguirem para o servidor real.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} dataset nome do dataset a interceptar
 * @param {{ columns: string[], values: Record<string, unknown>[] }} conteudo
 * @returns {Promise<void>}
 */
export async function responderDatasetCom(page, dataset, conteudo) {
  await page.route(ROTA_DATASET, async (route, request) => {
    if (nomeDoDataset(request) !== dataset) return route.fallback();

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: conteudo }),
    });
  });
}

/**
 * Faz um dataset específico falhar, simulando indisponibilidade do serviço que o alimenta
 * (tipicamente o REST do Protheus). Os demais datasets seguem normais.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} dataset nome do dataset que deve falhar
 * @param {number} [status] código HTTP devolvido (default 500)
 * @returns {Promise<void>}
 */
export async function derrubarDataset(page, dataset, status = 500) {
  await page.route(ROTA_DATASET, async (route, request) => {
    if (nomeDoDataset(request) !== dataset) return route.fallback();

    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ message: `Falha simulada no dataset ${dataset}` }),
    });
  });
}

/**
 * Aguarda a resposta de um dataset específico — condição observável do sistema,
 * usada no lugar de espera por tempo arbitrário.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} dataset
 * @returns {Promise<import('@playwright/test').Response>}
 */
export function aguardarDataset(page, dataset) {
  return page.waitForResponse(
    (response) =>
      response.url().includes('/api/public/ecm/dataset/datasets') &&
      response.request().method() === 'POST' &&
      nomeDoDataset(response.request()) === dataset,
  );
}
