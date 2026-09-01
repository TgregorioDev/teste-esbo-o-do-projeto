// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';

/**
 * CT-PLT-06-S1 — erro de console fora da Home.
 *
 * Até aqui, uma única tela da suíte tinha guarda de console: `home.spec.js` ("deve carregar
 * os apps e contadores sem erro de console"). O `NPS 403` vive de carona nessa assertion, e
 * nenhuma das outras telas principais tinha guarda nenhuma — uma exceção de JS numa tela de
 * Compras degradaria o widget em silêncio, e a suíte só perceberia se a degradação atingisse
 * o elemento que algum outro teste já espera.
 *
 * ## O desenho: lista de exceções NOMEADA e DATADA, nunca filtro por regex genérica
 *
 * Um filtro do tipo "ignore tudo que contenha 403" esconderia os erros novos junto com os
 * conhecidos. Aqui cada exceção é uma entrada com id, data e o motivo de estar catalogada — e
 * casa por RECURSO (a URL que falhou), não pelo texto genérico do navegador. Erro que não
 * estiver nesta lista reprova, nomeando o recurso e a mensagem.
 *
 * ## Como o erro é capturado (e por que o recurso importa)
 *
 * `console.error` de falha de carregamento traz sempre o mesmo texto — *"Failed to load
 * resource: the server responded with a status of 403 (Forbidden)"* — sem dizer QUAL recurso.
 * A URL vive em `msg.location().url`. Sem ela, catalogar exceção seria catalogar o texto, o
 * que equivaleria a ignorar todo 403 do produto.
 *
 * ## Ruído de rede × ruído de JS
 *
 * A suíte tem um teste que BLOQUEIA `google-analytics` (`CT-SEG-06-S1`,
 * `tests/e2e/seguranca/lgpd-envio-google-analytics.spec.js`). Esse bloqueio é local àquele
 * teste (`page.route` da página dele) e não alcança este arquivo — aqui nada é interceptado,
 * justamente para que o que se meça seja o comportamento real da página. Se algum dia alguém
 * mover aquele bloqueio para uma fixture global, este teste passará a ver
 * `net::ERR_FAILED` do GA e a lista de exceções abaixo terá de dizer isso explicitamente,
 * em vez de silenciar por regex.
 *
 * ## Medição de 27/08/2026
 *
 * Sete das oito rotas carregam sem erro não catalogado. O **Portal do Comprador** carrega com
 * dois erros ainda não catalogados em lugar nenhum — é o achado que este caso existe para
 * encontrar, e por isso o teste dessa rota fica VERMELHO de propósito.
 */

/**
 * @typedef {Object} ErroDeConsole
 * @property {string} mensagem texto do console/exceção
 * @property {string} recurso URL do recurso que falhou (vazio quando o erro não é de rede)
 */

/**
 * @typedef {Object} ExcecaoCatalogada
 * @property {string} id como o defeito é chamado no README
 * @property {string} desde data em que foi medido e catalogado
 * @property {string} motivo por que é aceito aqui em vez de reprovar
 * @property {(erro: ErroDeConsole) => boolean} casa
 */

/**
 * Erros de console já catalogados como defeito conhecido do ambiente.
 *
 * ⚠️ Esta lista é a fronteira entre "conhecido" e "novo". Acrescentar entrada aqui é decisão
 * consciente de aceitar um erro em produção — cada linha precisa de id, data e motivo, e o
 * defeito precisa existir na tabela do README. Nunca alargue um `casa` para calar um erro novo.
 *
 * @type {ExcecaoCatalogada[]}
 */
const EXCECOES_CATALOGADAS = [
  {
    id: 'NPS 403',
    desde: '26/08/2026',
    motivo:
      'toda carga do portal dispara `GET /nps/api/v1/surveys?productLine=TOTVS Fluig`, que ' +
      'responde 403 e gera console.error determinístico. Está na tabela de defeitos do README ' +
      '(NPS 403) e é do widget de pesquisa da TOTVS, não do produto da Cassi. Medido em ' +
      '27/08/2026: aparece de forma intermitente entre as cargas, então a lista só pode ' +
      'TOLERÁ-LO — nunca exigir a presença dele.',
    casa: (erro) => erro.recurso.includes('/nps/api/v1/surveys'),
  },
];

/** Rotas-chave do portal, com o título que prova que a carga terminou. */
const ROTAS_CHAVE = [
  { nome: 'Home', rota: '/portal/p/1/home', titulo: 'Cassi - Fluig Plataforma - Home' },
  {
    nome: 'catálogo "Iniciar Solicitações"',
    rota: '/portal/p/1/pageprocessstart',
    titulo: 'Cassi - Fluig Plataforma - Iniciar Solicitações',
  },
  {
    nome: 'Central de Tarefas',
    rota: '/portal/p/1/pagecentraltask',
    titulo: 'Cassi - Fluig Plataforma - Central de Tarefas',
  },
  {
    nome: 'Portal de Acompanhamento de Contratos',
    rota: '/portal/p/1/acompanhamentoContrato',
    titulo: 'Cassi - Fluig Plataforma - Acompanhamento de Contratos',
  },
  {
    nome: 'Portal do Comprador',
    rota: '/portal/p/1/portal-do-comprador',
    titulo: 'Cassi - Fluig Plataforma - Portal do Comprador',
  },
  {
    nome: 'Gerência de Compras',
    rota: '/portal/p/1/gerenciaCompras',
    titulo: 'Cassi - Fluig Plataforma - Gerencia Compras',
  },
  {
    nome: 'Tracker de Compras/Contratos',
    rota: '/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS',
    titulo: 'Cassi - Fluig Plataforma - Tracker - Processos Compras/ Contratos',
  },
  {
    nome: 'GED — Documentos',
    rota: '/portal/p/1/ecmnavigation',
    titulo: 'Cassi - Fluig Plataforma - Documentos',
  },
];

/**
 * Coletor de erros de console e de exceções não tratadas, com o recurso que falhou.
 *
 * Precisa ser instalado ANTES do `goto()` — os erros que mais interessam são os da carga
 * inicial, e um listener registrado depois já os perdeu (mesma disciplina de
 * `bloquearCriacaoDeSolicitacao` e de `HomePage.escutarErrosDeConsole`).
 *
 * Não reaproveita `HomePage.escutarErrosDeConsole` de propósito: aquele devolve só o texto, e
 * sem a URL do recurso não há como catalogar exceção sem calar erro novo. Alterar o método da
 * `HomePage` mudaria o contrato de um Page Object usado por outra suíte.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {{ erros: () => ErroDeConsole[] }}
 */
function escutarErrosDeConsole(page) {
  /** @type {ErroDeConsole[]} */
  const erros = [];

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    erros.push({ mensagem: msg.text(), recurso: msg.location()?.url ?? '' });
  });
  page.on('pageerror', (erro) => {
    erros.push({ mensagem: `exceção não tratada: ${erro.message}`, recurso: '' });
  });

  return { erros: () => [...erros] };
}

test.describe('Plataforma — erro de console nas rotas-chave (CT-PLT-06-S1)', () => {
  for (const { nome, rota, titulo } of ROTAS_CHAVE) {
    test(`CT-PLT-06-S1 @bug: ${nome} (${rota}) deve carregar sem erro de console não catalogado`, async ({
      page,
    }) => {
      const console_ = escutarErrosDeConsole(page);

      await page.goto(rota, { waitUntil: 'domcontentloaded' });

      // Duas condições OBSERVÁVEIS, nunca tempo fixo: a página é a esperada (título) e as
      // chamadas assíncronas da carga já tiveram chance de responder (rede estabilizada) —
      // mesmo padrão de `home.spec.js`. Avaliar o coletor antes disso mede menos do que
      // parece e produz verde por acidente.
      await expect(
        page,
        `PRÉ-CONDIÇÃO AUSENTE: ${rota} não abriu a tela esperada — sem a página carregada não há ` +
          'o que medir de console, e um coletor vazio pareceria sucesso',
      ).toHaveTitle(titulo);
      await page.waitForLoadState('networkidle');

      const naoCatalogados = console_
        .erros()
        .filter((erro) => !EXCECOES_CATALOGADAS.some((excecao) => excecao.casa(erro)));

      await test.info().attach('console-observado', {
        body: JSON.stringify(
          {
            rota,
            todosOsErros: console_.erros(),
            catalogados: EXCECOES_CATALOGADAS.map((e) => `${e.id} (desde ${e.desde})`),
            naoCatalogados,
          },
          null,
          2,
        ),
        contentType: 'application/json',
      });

      // ACHADO MEDIDO EM 27/08/2026 — o Portal do Comprador reprova aqui com dois erros:
      //
      //  1. `404` em `/style-guide/css/fluig-style-guide.min.css` — folha de estilo do
      //     style-guide da plataforma que a página pede e o servidor não tem. Defeito de
      //     produto: a tela renderiza com o CSS faltando.
      //  2. `console.error` "Erro ao buscar as informações do colaborador na lista de usuários
      //     do ERP Protheus. Error: Error: Comprador não encontrado." (de
      //     `wg_portalCompradores/.../main.js`). A conta da automação não está cadastrada como
      //     comprador na SY1 do Protheus — condição de negócio LEGÍTIMA e esperada, que o
      //     widget trata jogando exceção no console em vez de avisar quem está na tela. Um
      //     comprador real sem cadastro vê a mesma página, sem explicação nenhuma.
      //
      // Nenhum dos dois está catalogado no README, e por isso NENHUM entra na lista de
      // exceções: este vermelho é o achado. Não acrescente entrada em EXCECOES_CATALOGADAS
      // para deixá-lo verde — isso documentaria o defeito como se fosse regra.
      expect(
        naoCatalogados,
        `${naoCatalogados.length} erro(s) de console NÃO catalogado(s) em ${rota} (${nome}): ` +
          `${JSON.stringify(naoCatalogados)}. Erro de JS/rede na carga degrada o widget em ` +
          'silêncio — a tela continua "abrindo" e só quebra na função que ninguém testou. Se o ' +
          'erro for conhecido e aceito, catalogue-o em EXCECOES_CATALOGADAS com id, data e motivo, ' +
          'e registre-o na tabela de defeitos do README; nunca alargue um filtro para calá-lo.',
      ).toEqual([]);
    });
  }
});
