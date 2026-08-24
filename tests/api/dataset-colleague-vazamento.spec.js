// @ts-check
import { test, expect } from '../../fixtures/fixtures.js';
import { envObrigatoria } from '../../config/ambiente.js';

/**
 * CT-SEG-01-S1 — constraint ignorada no endpoint de busca de dataset.
 *
 * `GET /api/public/ecm/dataset/search?datasetId=colleague&constraintFields=colleagueId&constraintValues=<login>`
 * deveria devolver SOMENTE o registro do login informado. Em campo, confirmado que a
 * constraint é ignorada: com e sem `constraintFields`/`constraintValues` o endpoint devolve
 * o MESMO total de registros — a base inteira de colaboradores. Ver mapa-do-ambiente.md.
 *
 * Este teste é escrito contra o comportamento CORRETO (deve filtrar) e por isso REPROVA
 * hoje — é a forma de manter o defeito visível na suíte sem reescrevê-lo como regra.
 *
 * Cuidado de privacidade: o corpo da resposta contém dados pessoais reais de milhares de
 * colaboradores. As assertions comparam apenas CONTAGENS (números), nunca o array de
 * registros — assim, mesmo em caso de falha, o relatório do Playwright não recebe dado
 * pessoal algum no diff do erro.
 */
test.describe('Vazamento de dados — dataset colleague sem aplicar constraint', () => {
  test('deve retornar somente o registro do login filtrado, não a base inteira', async ({
    request,
  }) => {
    const login = envObrigatoria('QA_USERNAME');

    const semConstraint = await request.get('/api/public/ecm/dataset/search', {
      params: { datasetId: 'colleague' },
    });
    expect(semConstraint.ok(), `status inesperado sem constraint: ${semConstraint.status()}`).toBe(
      true,
    );
    const corpoSemConstraint = /** @type {{ content: unknown[] }} */ (
      await semConstraint.json()
    );
    const totalSemConstraint = corpoSemConstraint.content.length;

    const comConstraint = await request.get('/api/public/ecm/dataset/search', {
      params: {
        datasetId: 'colleague',
        constraintFields: 'colleagueId',
        constraintValues: login,
      },
    });
    expect(comConstraint.ok(), `status inesperado com constraint: ${comConstraint.status()}`).toBe(
      true,
    );
    const corpoComConstraint = /** @type {{ content: unknown[] }} */ (
      await comConstraint.json()
    );
    const totalComConstraint = corpoComConstraint.content.length;

    // Evidência objetiva do defeito, sem expor os registros: os dois totais são iguais,
    // provando que a constraint não reduziu nada.
    expect(
      totalComConstraint,
      `a constraint 'colleagueId' não filtrou o resultado: retornou ${totalComConstraint} ` +
        `registros, o MESMO total obtido sem nenhuma constraint (${totalSemConstraint}). ` +
        'O endpoint expõe a base inteira de colaboradores. Ver CT-SEG-01-S1 / mapa-do-ambiente.md.',
    ).toBe(1);
  });
});
