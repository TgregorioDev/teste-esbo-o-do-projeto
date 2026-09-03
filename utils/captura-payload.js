// @ts-check

/**
 * Captura do payload de start da Solicitação de Compra.
 *
 * Extensão de `utils/guarda-criacao.js` para a suíte que precisa LER o corpo da requisição
 * de escrita antes de bloqueá-la — não basta provar que nada foi criado, é preciso provar
 * O QUE seria enviado.
 *
 * Ao clicar Confirmar com os quatro campos válidos, o widget dispara
 *   POST .../process-management/api/v2/processes/wf_solicitacao_compras/start
 * com o payload completo da Solicitação de Compra: `targetState`, `targetAssignee`,
 * `subProcessTargetState`, `comment` e um `formFields` com ~100 campos (contrato, filial,
 * itens `tbprod_*___N` e o rateio de cada item embutido em `tbprod_jsonrateio___N`).
 *
 * A REGRA DE OURO desta suíte: nenhuma requisição de escrita pode chegar ao servidor.
 * `capturarEnvioSolicitacao` guarda o corpo e SEMPRE aborta — a mesma garantia de
 * `bloquearCriacaoDeSolicitacao`, com o corpo disponível para assertion.
 * `responderEnvioSolicitacaoCom` também nunca toca o servidor: fulfilla localmente uma
 * resposta simulada (sucesso ou erro), usada para observar como a aplicação reage.
 */

/**
 * @typedef {Object} CapturaPayload
 * @property {() => number} tentativas quantas requisições de escrita foram capturadas
 * @property {() => string[]} urls URLs capturadas (com método), para diagnóstico na falha
 * @property {() => Record<string, any> | null} payload corpo JSON da PRIMEIRA requisição capturada
 * @property {() => Record<string, any>[]} payloads corpo JSON de TODAS as requisições, na ordem de chegada
 * @property {(indice?: number, timeoutMs?: number) => Promise<Record<string, any>>} aguardarPayload
 *   espera deterministicamente pelo corpo JSON da requisição de índice `indice` (default 0).
 *   Resolve assim que a requisição correspondente é interceptada — nunca por tempo. O
 *   `timeoutMs` (default 30s) NÃO é espera arbitrária: é o limite a partir do qual se conclui
 *   que o start não vai sair, para reprovar com PRÉ-CONDIÇÃO AUSENTE legível em vez de pendurar
 *   o teste até o timeout global e morrer sem explicar nada.
 */

/**
 * Intercepta toda escrita em `process-management`, guarda o corpo (JSON) e ABORTA — nada
 * chega ao servidor. Leitura (GET) segue normalmente.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<CapturaPayload>}
 */
export async function capturarEnvioSolicitacao(page) {
  return interceptarEnvioSolicitacao(page, async (route) => {
    await route.abort('blockedbyclient');
  });
}

/**
 * Responde a requisição de start com um resultado SIMULADO, localmente — nunca chega ao
 * servidor real, mas o widget recebe uma resposta como se tivesse chegado. Usada para
 * observar a reação da aplicação a erro (5xx) ou a sucesso fabricado, sem qualquer efeito
 * no ambiente do cliente.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ status: number, body: Record<string, any> }} resposta
 * @returns {Promise<CapturaPayload>}
 */
export async function responderEnvioSolicitacaoCom(page, resposta) {
  return interceptarEnvioSolicitacao(page, async (route) => {
    await route.fulfill({
      status: resposta.status,
      contentType: 'application/json',
      body: JSON.stringify(resposta.body),
    });
  });
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {(route: import('@playwright/test').Route) => Promise<void>} finalizar
 * @returns {Promise<CapturaPayload>}
 */
async function interceptarEnvioSolicitacao(page, finalizar) {
  /** @type {string[]} */
  const urls = [];
  /** @type {Record<string, any>[]} */
  const corpos = [];
  /** @type {{ indice: number, resolve: (valor: Record<string, any>) => void }[]} */
  const aguardando = [];

  await page.route('**/process-management/**', async (route, request) => {
    if (request.method() === 'GET') return route.fallback();

    urls.push(`${request.method()} ${request.url()}`);

    const corpo = request.postDataJSON();
    if (corpo) {
      corpos.push(corpo);
      const indiceRecemChegado = corpos.length - 1;
      for (let i = aguardando.length - 1; i >= 0; i -= 1) {
        if (aguardando[i].indice === indiceRecemChegado) {
          aguardando[i].resolve(corpo);
          aguardando.splice(i, 1);
        }
      }
    }

    await finalizar(route);
  });

  return {
    tentativas: () => urls.length,
    urls: () => [...urls],
    payload: () => corpos[0] ?? null,
    payloads: () => [...corpos],
    aguardarPayload: (indice = 0, timeoutMs = 30_000) => {
      if (corpos[indice]) return Promise.resolve(corpos[indice]);

      // Espera LIMITADA, de propósito. Antes de 01/09/2026 esta Promise nunca rejeitava: se o
      // Confirmar não disparasse o start, o teste ficava pendurado até o timeout de 120s do
      // Playwright e morria com "Test timeout exceeded" — mensagem que não diz nada sobre a
      // causa. Medido em campo: o contrato 00044-2023-5303 traz 1 item de planilha mas ZERO
      // produtos e ZERO rateios, o modal renderiza nenhum item, e o widget CORRETAMENTE não
      // envia (é o mesmo comportamento que `indisponibilidade-protheus.spec.js` documenta como
      // esperado). Ou seja: a causa quase sempre é massa, não defeito — e o relatório precisa
      // dizer isso em vez de exibir um timeout mudo.
      return new Promise((resolve, reject) => {
        /** @type {{ indice: number, resolve: (valor: Record<string, any>) => void }} */
        const entrada = { indice, resolve };
        aguardando.push(entrada);

        const temporizador = setTimeout(() => {
          const posicao = aguardando.indexOf(entrada);
          if (posicao !== -1) aguardando.splice(posicao, 1);
          reject(
            new Error(
              `PRÉ-CONDIÇÃO AUSENTE: passaram-se ${timeoutMs}ms desde o Confirmar e a requisição ` +
                `de start de índice ${indice} nunca foi disparada (${corpos.length} capturada(s) ` +
                'até aqui). O widget só envia quando o contrato traz ITENS: se a planilha do ' +
                'contrato escolhido vier sem produtos ou sem rateios, o modal abre, aceita o ' +
                'preenchimento e o Confirmar não faz nada — comportamento correto, já documentado ' +
                'em indisponibilidade-protheus.spec.js. Isto NÃO é defeito do produto nem falha da ' +
                'automação: é massa inadequada para este caso. Confira os itens do contrato antes ' +
                'de interpretar o resultado.',
            ),
          );
        }, timeoutMs);

        entrada.resolve = (valor) => {
          clearTimeout(temporizador);
          resolve(valor);
        };
      });
    },
  };
}

/**
 * Faz o dataset de transferência de tarefa (`dsFluig_postProcessesTransfer`) falhar.
 *
 * Esse dataset NÃO passa pelo endpoint único de execução (`POST .../dataset/datasets`, o
 * que `utils/dataset-fluig.js` intercepta) — é consultado pelo endpoint de busca
 * (`GET .../dataset/search?datasetId=...`), confirmado em campo. Por isso a interceptação
 * própria aqui, em vez de reaproveitar `derrubarDataset`.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} [status]
 * @returns {Promise<void>}
 */
export async function derrubarTransferenciaDeTarefa(page, status = 500) {
  await page.route('**/api/public/ecm/dataset/search**', async (route, request) => {
    if (!/datasetId=dsFluig_postProcessesTransfer/i.test(request.url())) return route.fallback();

    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Falha simulada na transferência da tarefa' }),
    });
  });
}

/**
 * Converte um valor monetário no formato BR (ex.: "40.560,00") para number.
 * Todo valor do payload de start vem nesse formato.
 *
 * @param {string | undefined} valorBR
 * @returns {number} `NaN` quando `valorBR` não é uma string preenchida
 */
export function paraNumero(valorBR) {
  if (typeof valorBR !== 'string' || valorBR.trim() === '') return NaN;
  return Number(valorBR.replace(/\./g, '').replace(',', '.'));
}

/**
 * Extrai os itens (`tbprod_*___N`) do `formFields` do payload de start, num array indexado.
 * Cada item é um objeto "achatado", com as chaves sem o sufixo `___N`, mais o próprio
 * índice numérico em `indice`.
 *
 * @param {Record<string, any>} formFields
 * @returns {Array<Record<string, any> & { indice: number }>}
 */
export function extrairItens(formFields) {
  /** @type {Set<number>} */
  const indices = new Set();
  for (const chave of Object.keys(formFields)) {
    const m = chave.match(/___(\d+)$/);
    if (m) indices.add(Number(m[1]));
  }

  return [...indices]
    .sort((a, b) => a - b)
    .map((indice) => {
      const sufixo = `___${indice}`;
      /** @type {Record<string, any> & { indice: number }} */
      const item = { indice };
      for (const [chave, valor] of Object.entries(formFields)) {
        if (chave.endsWith(sufixo)) item[chave.slice(0, -sufixo.length)] = valor;
      }
      return item;
    });
}

/**
 * Extrai as linhas de rateio de um item, a partir do campo `tbprod_jsonrateio___N`
 * (string JSON aninhada dentro do próprio `formFields`).
 *
 * @param {string | undefined} jsonRateio
 * @returns {Array<Record<string, any>>}
 */
export function extrairRateio(jsonRateio) {
  if (!jsonRateio) return [];
  try {
    const valor = JSON.parse(jsonRateio);
    return Array.isArray(valor) ? valor : [];
  } catch {
    // Rateio malformado não é uma lista de linhas válida — o teste que consumir isto vai
    // acusar "sem rateio", que é o comportamento correto a reportar.
    return [];
  }
}

/**
 * Normaliza uma linha de rateio, removendo o sufixo `___<itemIndex>_<linhaIndex>` de cada
 * chave (ex.: `tbRatCC_classeValor___1_2` → `tbRatCC_classeValor`). O mesmo campo aparece
 * com sufixo diferente em cada linha — sem normalizar, o acesso por chave literal seria frágil.
 *
 * @param {Record<string, any>} linha
 * @returns {Record<string, any>}
 */
export function normalizarLinhaRateio(linha) {
  /** @type {Record<string, any>} */
  const normalizada = {};
  for (const [chave, valor] of Object.entries(linha)) {
    normalizada[chave.replace(/___\d+_\d+$/, '')] = valor;
  }
  return normalizada;
}
