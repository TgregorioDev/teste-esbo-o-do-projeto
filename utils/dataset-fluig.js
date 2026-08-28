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
 * Faz um dataset específico falhar, na FORMA que este ambiente realmente produz. Os demais
 * datasets seguem normais.
 *
 * ## Por que a forma importa, e o que foi medido
 *
 * Esta função fabricava `status: 500` com corpo `{ message }`. **O gateway nunca responde
 * assim.** Medido em 28/08/2026, chamando `POST /api/public/ecm/dataset/datasets` de dentro
 * da página, em quatro cenários:
 *
 * | Cenário | HTTP | Corpo |
 * |---|---|---|
 * | dataset válido (`colleague`) | 200 | `{content:{columns,values}}` |
 * | nome inexistente | **200** | `{"content":{},"message":null}` |
 * | erro de negócio do Protheus | **200** | `{"content":{"columns":["error"],"values":[{"error":"Erro 401 --> ..."}]}}` |
 * | dataset de sync quebrado | **200** | `{"content":{},"message":null}` |
 *
 * Ou seja: o gateway **sempre responde 200** e o erro vem no corpo — exatamente como a skill
 * `cassi-fluig-master` (`references/apis-de-workflow.md`) descreve. O mock antigo exercitava
 * o ramo de erro de REDE do widget, não o de erro de DATASET: teste passando contra ficção.
 *
 * O 500 existe, mas na rota IRMÃ `GET /api/public/ecm/dataset/search`, com outro corpo
 * (`{"content":"ERROR","message":{...,"errorCode":"ECMException"}}`). Era daí que vinha a
 * nota de `docs/mapa-do-ambiente.md` dizendo que "devolver 500 reproduz indisponibilidade" —
 * observação correta, rota errada. Por isso `servidor-fora` continua disponível, agora com o
 * corpo medido e com o nome dizendo o que é.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} dataset nome do dataset que deve falhar
 * @param {{ forma?: 'erro-de-negocio' | 'vazio' | 'servidor-fora', mensagem?: string }} [opcoes]
 *   `erro-de-negocio` (padrão) — 200 com a pseudo-coluna `error`, como o Protheus devolve
 *   quando a chamada chega mas o negócio recusa. `vazio` — 200 com `content` vazio, que é o
 *   que o gateway devolve para dataset inexistente ou sem dados, e é indistinguível de
 *   "consulta sem resultado" (a indistinguibilidade é do produto, não do mock).
 *   `servidor-fora` — 500 no formato da rota `/dataset/search`.
 * @returns {Promise<void>}
 */
export async function derrubarDataset(page, dataset, opcoes = {}) {
  const { forma = 'erro-de-negocio', mensagem = `Falha simulada no dataset ${dataset}` } = opcoes;

  await page.route(ROTA_DATASET, async (route, request) => {
    if (nomeDoDataset(request) !== dataset) return route.fallback();

    if (forma === 'servidor-fora') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          content: 'ERROR',
          message: {
            message: mensagem,
            detail: mensagem,
            type: 'ERROR',
            param: null,
            errorCode: 'ECMException',
          },
        }),
      });
      return;
    }

    const corpo =
      forma === 'vazio'
        ? { content: {}, message: null }
        : { content: { columns: ['error'], values: [{ error: mensagem }] }, message: null };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(corpo),
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
