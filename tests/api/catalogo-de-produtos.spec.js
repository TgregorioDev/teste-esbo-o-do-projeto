// @ts-check
import { test, expect } from '../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../utils/pre-condicao.js';

/**
 * FSWTBC-4316 — o catálogo de produtos oferecido na SC não pode trazer o grupo 3300.
 *
 * O grupo 3300 foi retirado do que o solicitante pode pedir; produto dele aparecendo na busca
 * leva a SC a nascer com item que o comprador vai ter de recusar depois.
 *
 * Medido em 08/09/2026: o dataset devolve **3146 produtos** e **nenhum** do grupo 3300 — a
 * regra está cumprida. Este teste é a guarda contra a reintrodução, não a reprodução do
 * defeito.
 *
 * O que este teste NÃO faz, e é deliberado: comparar código e descrição com o cadastro SB1 do
 * Protheus. O chamado pede isso, mas exige credencial de ERP; sem ela, uma divergência não
 * seria distinguível de defasagem da sincronização.
 */

/** Grupo que não pode ser oferecido na busca de produto da Solicitação de Compras. */
const GRUPO_VEDADO = '3300';

test.describe('Catálogo de produtos da SC (FSWTBC-4316)', () => {
  test('a busca de produto não oferece itens do grupo vedado', async ({ request }) => {
    const resposta = await request.get('/api/public/ecm/dataset/search', {
      params: { datasetId: 'dsProtheus_getProdutos_restGetAll' },
    });
    if (!resposta.ok()) {
      faltaPreCondicao(
        `(ambiente): o dataset de produtos respondeu ${resposta.status()} — integração com o ` +
          `Protheus indisponível`,
      );
    }

    const produtos = /** @type {Array<Record<string,string>>} */ (
      (await resposta.json())?.content ?? []
    );
    if (produtos.length === 0) {
      faltaPreCondicao('(ambiente): o catálogo de produtos voltou vazio');
    }

    const doGrupoVedado = produtos
      .filter((p) => String(p.B1_GRUPO ?? '').trim() === GRUPO_VEDADO)
      .map((p) => `${p.B1_COD ?? '?'} ${String(p.B1_DESC ?? p.B1_ESPECIF ?? '').slice(0, 40)}`);

    test.info().annotations.push({
      type: 'catalogo-de-produtos',
      description: `${produtos.length} produto(s); ${doGrupoVedado.length} do grupo ${GRUPO_VEDADO}`,
    });

    expect(
      doGrupoVedado,
      `o catálogo oferece produto(s) do grupo ${GRUPO_VEDADO}, que foi retirado do que o ` +
        `solicitante pode pedir — a SC nasce com item que o comprador terá de recusar`,
    ).toEqual([]);
  });
});
