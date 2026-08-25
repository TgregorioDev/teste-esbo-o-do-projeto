// @ts-check

/**
 * Trava de escrita no ambiente.
 *
 * ## Por que ela existe
 *
 * Casos negativos afirmam "o sistema NÃO deve criar X quando falta campo obrigatório". Isso só é
 * demonstrável provando que **nenhuma requisição de escrita saiu** — a ausência de um registro na
 * tela não prova nada, porque a criação pode ter acontecido e a tela não ter atualizado.
 *
 * ## A lição que gerou a versão atual
 *
 * A primeira versão interceptava só `**` + `/process-management/**`. Parecia suficiente, porque
 * é por ali que a Solicitação de Compra é criada. Não era: os formulários avulsos (Cotação,
 * Negociação, Parecer) enviam por `POST /ecm/api/rest/ecm/workflowView/send`, que passava direto.
 * O resultado foi duplo e grave:
 *
 * 1. um processo foi criado por acidente num teste que se dizia não-destrutivo;
 * 2. pior — vários testes afirmavam `expect(guarda.tentativas()).toBe(0)` e **passavam sem provar
 *    nada**, porque a escrita saía por um caminho que a guarda não via.
 *
 * Por isso a lógica agora é **invertida**: bloqueia toda requisição de escrita no host da
 * aplicação, EXCETO uma lista explícita de rotas que são leitura. Se um endpoint novo aparecer,
 * ele é bloqueado e o teste falha alto — o oposto do falso verde silencioso.
 *
 * ## Cuidado que o Fluig impõe
 *
 * Nem todo POST é escrita. A execução de dataset é `POST /api/public/ecm/dataset/datasets`, e os
 * fragmentos de renderização do portal também são POST. Bloqueá-los quebraria a própria carga da
 * página. Daí a lista `ROTAS_DE_LEITURA`.
 */

/** Rotas que usam método de escrita mas são LEITURA — precisam passar. */
const ROTAS_DE_LEITURA = [
  '/api/public/ecm/dataset/datasets', // execução de dataset (consulta)
  '/portal/api/rest/wcm/', // fragmentos de renderização do portal
  '/api/public/2.0/', // consultas públicas da plataforma

  // Autenticação de sessão do Portal do Fornecedor. São POST, mas emitem/validam token de
  // sessão para a tela RENDERIZAR — não criam registro de negócio. Bloqueá-los fazia a landing
  // do portal nunca montar, derrubando testes que estavam corretos.
  '/cassi_rest/api/rest/cassi/compras/1/geratoken',
  '/cassi_rest/api/rest/cassi/compras/1/verifyAutenticateToken',
];

/**
 * @typedef {Object} GuardaEscrita
 * @property {() => number} tentativas quantas requisições de escrita foram bloqueadas
 * @property {() => string[]} urls as URLs bloqueadas, para diagnóstico na falha
 */

/**
 * @param {string} url
 * @returns {boolean}
 */
function ehLeitura(url) {
  return ROTAS_DE_LEITURA.some((rota) => url.includes(rota));
}

/**
 * Host de uma URL, ou string vazia se não for absoluta.
 * @param {string} url
 * @returns {string}
 */
function hostDa(url) {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

/**
 * Host da aplicação sob teste, resolvido uma vez a partir do ambiente.
 *
 * Derivar isto de `page.url()` a cada requisição é frágil: no início da navegação a página ainda
 * é `about:blank`, e o host sai vazio — o que faria a comparação casar com tudo.
 *
 * @returns {string}
 */
function hostDaAplicacao() {
  const base = process.env.BASE_URL;
  if (!base) throw new Error('Variável de ambiente obrigatória não definida: BASE_URL');
  return new URL(base).host;
}

/**
 * Bloqueia toda escrita no ambiente e conta as tentativas.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<GuardaEscrita>}
 */
export async function bloquearEscritaNoAmbiente(page) {
  /** @type {string[]} */
  const bloqueadas = [];
  const host = hostDaAplicacao();

  await page.route('**/*', async (route, request) => {
    const metodo = request.method();
    if (metodo === 'GET' || metodo === 'HEAD' || metodo === 'OPTIONS') return route.fallback();

    const url = request.url();

    // Host externo (telemetria, fontes) não é escrita no ambiente sob teste.
    //
    // Comparação por HOST, não por substring: as requisições do Google Analytics carregam a URL
    // da página navegada dentro do query string, então o host da aplicação aparece literalmente
    // dentro delas. Um `url.includes(host)` classificava telemetria externa como escrita no
    // ambiente e inflava a contagem, derrubando testes que estavam corretos.
    if (hostDa(url) !== host) return route.fallback();

    if (ehLeitura(url)) return route.fallback();

    bloqueadas.push(`${metodo} ${url}`);
    await route.abort('blockedbyclient');
  });

  return {
    tentativas: () => bloqueadas.length,
    urls: () => [...bloqueadas],
  };
}

/**
 * Nome histórico, mantido porque dezenas de specs já o usam.
 *
 * ⚠️ O nome ficou estreito demais: hoje a guarda bloqueia **toda** escrita, não só a criação de
 * solicitação. Prefira `bloquearEscritaNoAmbiente` em código novo.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<GuardaEscrita>}
 */
export async function bloquearCriacaoDeSolicitacao(page) {
  return bloquearEscritaNoAmbiente(page);
}

/** Rotas que criam ou movimentam PROCESSO (solicitação, tarefa) — o registro de negócio. */
const ROTAS_DE_PROCESSO = ['/process-management/', '/workflowView/send', '/workflowView/takeTask'];

/**
 * Bloqueia apenas a criação/movimentação de PROCESSO, deixando passar as demais escritas.
 *
 * Existe porque nem todo teste negativo pode ser "escrita zero". Há casos cuja própria ação
 * SOB TESTE é uma escrita — subir uma planilha de rateio inválida, por exemplo. Bloquear o
 * upload faria a requisição nunca chegar ao servidor, e aí o teste não provaria que o produto
 * rejeita o arquivo: provaria que a guarda o interceptou. Falso verde de outro tipo.
 *
 * Nesses casos o que precisa ser garantido é mais estreito e mais preciso: a ação acontece, e
 * **nenhuma solicitação nasce dela**.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<GuardaEscrita>}
 */
export async function bloquearCriacaoDeProcesso(page) {
  /** @type {string[]} */
  const bloqueadas = [];
  const host = hostDaAplicacao();

  await page.route('**/*', async (route, request) => {
    const metodo = request.method();
    if (metodo === 'GET' || metodo === 'HEAD' || metodo === 'OPTIONS') return route.fallback();

    const url = request.url();
    if (hostDa(url) !== host) return route.fallback();
    if (!ROTAS_DE_PROCESSO.some((rota) => url.includes(rota))) return route.fallback();

    bloqueadas.push(`${metodo} ${url}`);
    await route.abort('blockedbyclient');
  });

  return {
    tentativas: () => bloqueadas.length,
    urls: () => [...bloqueadas],
  };
}
