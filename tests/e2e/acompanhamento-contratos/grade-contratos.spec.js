// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { descobrirContratoVigente } from '../../../utils/massa-contratos.js';

/**
 * Grade de contratos e ações da linha — casos CT-ACC-02.
 */

/** Rótulos completos de situação do contrato (CN9_SITUAC), como o negócio espera lê-los. */
const SITUACOES_LEGIVEIS = [
  'Em digitação',
  'Vigente',
  'Paralisado',
  'Sol. Finalização',
  'Finalizado',
  'Revisão',
  'Cancelado',
];

test.describe('Grade de contratos', () => {
  test('CT-ACC-02-H — deve oferecer Planilha, Solicitação de Compra e Informações na linha do contrato', async ({
    contratosPage,
  }) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato((await descobrirContratoVigente(contratosPage)).contrato);

    const acoes = contratosPage.acoesDaLinha;

    await expect(acoes.planilha).toBeVisible();
    await expect(acoes.solicitacaoCompra).toBeVisible();
    await expect(acoes.informacoes).toBeVisible();
  });

  test('deve filtrar a grade pelo número do contrato', async ({ contratosPage }) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato((await descobrirContratoVigente(contratosPage)).contrato);

    await expect(contratosPage.getInformacaoDaGrade()).toHaveText(
      /Mostrando de 1 até 1 de 1 registros \(Filtrados de \d+ registros\)/,
    );
  });

  test('CT-ACC-02-S1 @bug — deve exibir a situação do contrato por extenso, sem truncar', async ({ contratosPage }) => {
    // Defeito conhecido D-08, em aberto: a grade corta o rótulo ("Finali" no lugar de
    // "Finalizado"), sem reticências e sem dica ao passar o mouse.
    // O teste é escrito contra o comportamento ESPERADO e por isso REPROVA hoje.
    // Ajustá-lo para aceitar o texto cortado documentaria o defeito como se fosse regra.
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    const exibidos = await contratosPage.lerStatusExibidos();

    expect(exibidos.length, 'a grade não trouxe nenhuma situação para avaliar').toBeGreaterThan(0);

    const truncados = exibidos.filter((situacao) => !SITUACOES_LEGIVEIS.includes(situacao));

    expect(
      truncados,
      `situações exibidas de forma truncada/ilegível na grade: ${JSON.stringify(truncados)}`,
    ).toEqual([]);
  });
});
