// @ts-check

/**
 * O serviço do ERP está no ar? — pergunta feita ao Fluig, do jeito que o próprio produto pergunta.
 *
 * ## De onde veio
 *
 * Do desenvolvedor do projeto, em 10/09/2026, depois de uma execução inteira ter sido lida como
 * defeito quando era queda de serviço: *"tem que pedir para ele, antes de fazer os teste,
 * verificar se o serviço está no ar"*. A rota é a de teste de cliente autorizado do Fluig:
 *
 * ```
 * GET /api/public/2.0/authorize/client/test?serviceCode=apiRESTProtheusCompras
 * ```
 *
 * ## ⚠️ O status HTTP não diz nada — e essa é a parte que engana
 *
 * Medido: a rota devolve **200 sempre**, inclusive para um `serviceCode` que não existe. O
 * veredito está no corpo, em `content.description`:
 *
 * | `content.description` | significado |
 * |---|---|
 * | `apiRESTProtheusCompras:SUCCESS` | serviço no ar |
 * | `ERROR CALLING SERVICE: apiRESTProtheusCompras` | serviço fora (o `result` traz a stack) |
 *
 * Ler `resposta.ok` aqui daria "no ar" com o Protheus fora — o mesmo erro que já custou caro
 * nesta suíte com `dsProtheus_getCompradores_restGetAll`, que responde 200 com uma linha
 * `{"error": ...}`. Por isso este utilitário existe: para que ninguém precise lembrar disso.
 *
 * O campo `content.result` **varia conforme o endpoint que o serviço usa por baixo** (o próprio
 * desenvolvedor avisou: *"o result pode ser diferente dependendo do endpoint usado"*), então não
 * se afirma nada sobre ele — só sobre o `description`.
 *
 * ## Por que `page.evaluate` e não `page.request`
 *
 * Consistência com o resto da suíte: o WAF deste ambiente recusa o contexto de requisição do
 * Playwright em algumas rotas por falta de `User-Agent` e `Referer` de navegador. Chamar de
 * dentro da página nunca dá esse falso negativo.
 */

/**
 * Código do serviço de Compras — o único que existe neste ambiente (medido em 10/09/2026;
 * `apiRESTProtheusContratos`, por exemplo, responde "Serviço não encontrado com o código
 * informado").
 *
 * `SERVICO_ERP` sobrescreve. Existe por dois motivos: o código pode mudar do lado do cliente, e
 * é assim que se **prova que o portão reprova** sem precisar derrubar serviço nenhum —
 * `SERVICO_ERP=servicoQueNaoExiste npx playwright test` deve abortar a execução.
 */
export const SERVICO_COMPRAS = process.env.SERVICO_ERP ?? 'apiRESTProtheusCompras';

/**
 * @typedef {Object} VereditoDoServico
 * @property {boolean} noAr  `true` só quando `content.description` termina em `:SUCCESS`
 * @property {string} servico código consultado
 * @property {string} descricao o `content.description` cru, para a mensagem de erro
 * @property {string} detalhe primeira linha de `content.result` quando há falha (a stack do Fluig)
 */

/**
 * Pergunta ao Fluig se o serviço do ERP responde.
 *
 * Nunca lança por falha de serviço — devolve o veredito e deixa quem chama decidir o que fazer
 * (abortar a execução, declarar pré-condição, apenas registrar). Só propaga erro se a própria
 * chamada não completar.
 *
 * @param {import('@playwright/test').Page} page página já autenticada
 * @param {string} [servico] código do serviço
 * @returns {Promise<VereditoDoServico>}
 */
export async function verificarServicoErp(page, servico = SERVICO_COMPRAS) {
  // `fetch` com caminho relativo precisa de uma origem para resolver, e uma aba recém-criada
  // está em `about:blank` — o canário chamava esta função antes de qualquer navegação e recebia
  // "Failed to parse URL". Navegar aqui é seguro porque só acontece quando não há origem
  // nenhuma: em teste, a página sempre já está em alguma URL, e este ramo nunca dispara.
  if (!/^https?:/.test(page.url())) {
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
  }

  const bruto = await page.evaluate(async (codigo) => {
    const resposta = await fetch(`/api/public/2.0/authorize/client/test?serviceCode=${encodeURIComponent(codigo)}`, {
      headers: { Accept: 'application/json' },
    });
    const texto = await resposta.text();
    try {
      return { corpo: JSON.parse(texto), textoBruto: null };
    } catch {
      return { corpo: null, textoBruto: texto.slice(0, 300) };
    }
  }, servico);

  const descricao = bruto.corpo?.content?.description ?? bruto.textoBruto ?? '(resposta sem `content.description`)';
  const resultado = String(bruto.corpo?.content?.result ?? '');

  return {
    noAr: /:SUCCESS$/.test(descricao.trim()),
    servico,
    descricao,
    detalhe: resultado.split('\n')[0].slice(0, 220),
  };
}

/**
 * Mensagem única para quem precisa reprovar por causa do serviço — para que o texto seja o
 * mesmo no `globalSetup`, no canário e em qualquer teste.
 * @param {VereditoDoServico} veredito
 * @returns {string}
 */
export function explicarServicoFora(veredito) {
  return (
    `o serviço "${veredito.servico}" NÃO está respondendo neste ambiente.\n` +
    `  GET /api/public/2.0/authorize/client/test?serviceCode=${veredito.servico}\n` +
    `  content.description = ${veredito.descricao}\n` +
    (veredito.detalhe ? `  content.result      = ${veredito.detalhe}\n` : '') +
    '\nSem o ERP, nada do módulo de Compras funciona no Fluig, e um relatório gerado agora ' +
    'mediria a queda do serviço em vez do produto.'
  );
}
