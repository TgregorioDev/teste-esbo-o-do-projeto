// @ts-check
import { test, expect } from '../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../utils/pre-condicao.js';

/**
 * FSWTBC-648 (severidade Alta) — a árvore hierárquica não deve trazer pessoas desligadas.
 *
 * Por que isto importa: é esta árvore que resolve o superior responsável e alimenta o
 * roteamento de aprovação. Um desligado na árvore significa aprovação encaminhada para quem
 * não trabalha mais na empresa — e a solicitação parada sem que ninguém perceba.
 *
 * Por que é testável HOJE, sem perfil nenhum: o dataset responde a `GET
 * /api/public/ecm/dataset/search` para uma sessão comum, como já explorado em
 * `tests/e2e/seguranca/auditoria-datasets.spec.js`. O widget usa `POST .../datasets`, que
 * neste tenant devolve corpo vazio para este dataset — por isso o teste vai pelo `search`.
 *
 * O que a medição de 08/09/2026 mostrou, e que separa os dois testes deste arquivo:
 *
 *   RA_SITFOLH → A: 6 · F: 2 · vazio: 19  (de 27 nós)
 *
 * Ou seja: nenhum demitido hoje, mas **70% dos nós não declaram situação alguma**. O primeiro
 * teste é a guarda de regressão (verde hoje, vermelho no dia em que um `D` aparecer). O
 * segundo afirma que a guarda precisa ser verificável — e reprova hoje.
 */

/** Situação na folha (`RA_SITFOLH`) de quem está desligado. */
const DEMITIDO = 'D';

/**
 * @typedef {Object} NoDaArvore
 * @property {string} [RA_MAT]
 * @property {string} [RA_NOME]
 * @property {string} [RA_EMAIL]
 * @property {string} [RA_SITFOLH]
 * @property {string} [RA_POSTO]
 */

/**
 * Lê a árvore hierárquica pelo endpoint público de dataset.
 * @param {import('@playwright/test').APIRequestContext} request
 * @returns {Promise<NoDaArvore[]>}
 */
async function lerArvore(request) {
  const resposta = await request.get('/api/public/ecm/dataset/search', {
    params: { datasetId: 'dsProtheus_getArvoreHierarquica_restGetAll' },
  });

  if (!resposta.ok()) {
    faltaPreCondicao(
      `(ambiente): o dataset da árvore hierárquica respondeu ${resposta.status()}. ` +
        `A integração com o Protheus está indisponível — não é defeito do produto sob teste.`,
    );
  }

  const corpo = /** @type {{ content?: NoDaArvore[] }} */ (await resposta.json());
  const nos = corpo.content ?? [];

  if (nos.length === 0) {
    faltaPreCondicao(
      '(ambiente): a árvore hierárquica voltou sem nenhum nó. Sem árvore não há o que auditar.',
    );
  }
  return nos;
}

test.describe('Árvore hierárquica — pessoas desligadas (FSWTBC-648)', () => {
  test('nenhum nó da árvore hierárquica pode estar com a situação de desligado', async ({
    request,
  }) => {
    const nos = await lerArvore(request);

    const desligados = nos
      .filter((no) => (no.RA_SITFOLH ?? '').trim().toUpperCase() === DEMITIDO)
      .map((no) => `${no.RA_MAT ?? '?'} ${no.RA_NOME ?? '?'} (posto ${no.RA_POSTO ?? '?'})`);

    test.info().annotations.push({
      type: 'arvore-hierarquica',
      description: `${nos.length} nó(s); situações: ${JSON.stringify(
        nos.reduce((acc, no) => {
          const s = (no.RA_SITFOLH ?? '').trim() || '(vazio)';
          acc[s] = (acc[s] ?? 0) + 1;
          return acc;
        }, /** @type {Record<string, number>} */ ({})),
      )}`,
    });

    // Guarda de regressão: verde hoje (nenhum `D` na base), vermelho no dia em que um
    // desligado voltar a aparecer. É o oposto de congelar o estado atual — a asserção é sobre
    // a REGRA, e o verde de hoje é consequência dela estar sendo cumprida.
    expect(
      desligados,
      `a árvore que decide o roteamento de aprovação trouxe pessoa(s) desligada(s). ` +
        `Aprovação encaminhada a quem saiu da empresa fica parada sem dono: ` +
        `${JSON.stringify(desligados)}`,
    ).toEqual([]);
  });

  test('@bug todo nó da árvore deve declarar a situação na folha, senão excluir desligados não é verificável', async ({
    request,
  }) => {
    const nos = await lerArvore(request);

    const semSituacao = nos.filter((no) => (no.RA_SITFOLH ?? '').trim() === '');

    // Medido em 08/09/2026: 19 de 27 nós (70%) vêm com `RA_SITFOLH` vazio, e o front do widget
    // de Gestão de Equipes tem o filtro `case 'D' //Demitidos` COMENTADO. Com o campo vazio, o
    // teste acima não distingue "não está desligado" de "não dá para saber" — a guarda existe,
    // mas é cega em 70% da árvore.
    //
    // Este teste afirma o comportamento esperado (situação sempre declarada) e por isso
    // REPROVA hoje. Se o time decidir que vazio equivale a ativo, a correção NÃO é afrouxar
    // esta asserção: é o dataset passar a devolver o valor explicitamente, senão a regra fica
    // dependendo de convenção não escrita.
    expect(
      semSituacao.map((no) => `${no.RA_MAT ?? '?'} ${no.RA_NOME ?? '?'}`),
      `${semSituacao.length} de ${nos.length} nós não declaram RA_SITFOLH — nesses, a exclusão ` +
        `de desligados não é demonstrável`,
    ).toEqual([]);
  });
});
