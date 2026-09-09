// @ts-check
import { test, expect } from '../../fixtures/fixtures.js';

/**
 * FSWTBC-4669 — o caminho de dados do Parecer Técnico responde.
 *
 * O chamado relata o fluxo quebrando com `"dsTechnicalProcess" is not defined`. Concluir o
 * parecer exige perfil de comprador e das áreas emissoras, que esta conta não tem — mas o
 * **smoke test do caminho de dados** é executável hoje, e é ele que separa "o BPM não achou o
 * dataset" de "o parecer não foi emitido".
 *
 * ## A armadilha que este teste evita
 *
 * O endpoint de dataset do Fluig responde **500 `NullPointerException` para nome inexistente**
 * — foi assim que se descobriu, em 08/09/2026, que `dsTechnicalProcess` **não é um dataset**:
 * é variável do script do BPM. Um teste que varresse "todo nome citado no fonte" e exigisse 200
 * reprovaria por causa dele, apontando defeito onde não há.
 *
 * Por isso a lista abaixo é a dos datasets **confirmados como datasets** por medição. Ao
 * acrescentar um nome novo aqui, confirme antes com o `GET search`: 200 significa que existe;
 * 500 NPE significa que o nome não é dataset — e aí o lugar dele não é esta lista.
 */

/** Datasets do caminho de parecer, confirmados existentes em 08/09/2026. */
const DATASETS = ['dsFluig_getProcessoParecerTecSql', 'ds_getFormDistribuicaoAreas'];

/** Nome citado no BPM que NÃO é dataset — 500 aqui é o esperado, não defeito. */
const NAO_E_DATASET = 'dsTechnicalProcess';

test.describe('Parecer Técnico — caminho de dados (FSWTBC-4669)', () => {
  for (const dataset of DATASETS) {
    test(`o dataset ${dataset} responde sem erro de servidor`, async ({ request }) => {
      const resposta = await request.get('/api/public/ecm/dataset/search', {
        params: { datasetId: dataset },
      });
      const corpo = await resposta.text();

      test.info().annotations.push({
        type: 'dataset-parecer',
        description: `${dataset}: ${resposta.status()} · ${corpo.slice(0, 120)}`,
      });

      expect(
        resposta.status(),
        `${dataset} respondeu ${resposta.status()} — se for 500 NullPointerException, o nome ` +
          `deixou de existir como dataset e o BPM do parecer quebra ao referenciá-lo`,
      ).toBe(200);

      // Lista vazia é resultado legítimo (não há parecer instanciado). O que não pode é erro.
      expect(corpo, `${dataset} respondeu 200 mas com erro no corpo`).not.toMatch(
        /NullPointerException/i,
      );
    });
  }

  test(`@achado ${NAO_E_DATASET} não é um dataset — o 500 aqui é esperado, não defeito`, async ({
    request,
  }) => {
    // Polaridade invertida: afirma o comportamento REAL medido. Se um dia este nome PASSAR a
    // ser um dataset de verdade, o teste fica vermelho e o assunto volta à mesa — que é
    // exatamente o sinal desejado, porque hoje há código do BPM referenciando este nome.
    const resposta = await request.get('/api/public/ecm/dataset/search', {
      params: { datasetId: NAO_E_DATASET },
    });

    expect(
      resposta.status(),
      `${NAO_E_DATASET} passou a responder ${resposta.status()}. Ele era variável de script do ` +
        `BPM, não dataset — se virou dataset, reabra o FSWTBC-4669 e reveja este teste`,
    ).toBe(500);
  });
});
