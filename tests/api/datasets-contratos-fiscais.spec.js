// @ts-check
import { test, expect } from '../../fixtures/fixtures.js';

/**
 * Smoke dos datasets de contratos que já sumiram de um deploy — FSWTBC-4503 e FSWTBC-4176.
 *
 * Os dois chamados têm a mesma forma: o artefato de dados não estava lá, e quem descobriu foi
 * o usuário, semanas depois. No FSWTBC-4503 o `dsProtheus_getFiscaisPorTipoContrato` entrou em
 * produção com a demanda de 24/04 **faltando**, e o Ato de Delegação passou a listar zero
 * fiscais — quarta ocorrência de artefato não publicado na base. No FSWTBC-4176, entre as três
 * causas da revisão salva indevidamente, uma foi o `dsRevisaoContratos` quebrado.
 *
 * As telas dos dois casos não são alcançáveis por esta conta (a escolha do fiscal exige gestor
 * com tarefa de delegação; a revisão é no Protheus). O caminho de dados é — e é ele que separa
 * "o dataset não existe" de "não há fiscal/medição para listar", que é a confusão que fez o
 * defeito do 4503 demorar dez dias para ser identificado.
 *
 * ## Por que o teste de controle é obrigatório aqui
 *
 * `GET /api/public/ecm/dataset/search` responde **200 `{"content":[]}`** para dataset que
 * existe sem linhas e **500 `java.lang.NullPointerException`** para nome inexistente. Sem
 * exercitar o nome inexistente na mesma execução, um 200 não prova nada: poderia ser um "200
 * genérico" de um endpoint que aceita qualquer coisa. É a diferença que o próprio caso pede.
 */

/** Datasets cuja ausência já derrubou um fluxo em produção. */
const DATASETS = [
  { nome: 'dsProtheus_getFiscaisPorTipoContrato', chamado: 'FSWTBC-4503' },
  { nome: 'dsRevisaoContratos', chamado: 'FSWTBC-4176' },
];

/** Nome propositalmente inexistente, para calibrar o que "ausente" responde. */
const NOME_AUSENTE = 'dsProtheus_getFiscaisPorTipoContrato_NAO_EXISTE';

test.describe('Datasets de contratos e fiscais', () => {
  for (const { nome, chamado } of DATASETS) {
    test(`${chamado} — o dataset ${nome} existe e responde`, async ({ request }) => {
      const resposta = await request.get('/api/public/ecm/dataset/search', {
        params: { datasetId: nome },
      });
      const corpo = await resposta.text();

      test.info().annotations.push({
        type: 'dataset',
        description: `${nome}: ${resposta.status()} · ${corpo.slice(0, 140)}`,
      });

      expect(
        resposta.status(),
        `${nome} respondeu ${resposta.status()} — 500 aqui significa que o dataset não está ` +
          'publicado neste ambiente, e o fluxo que depende dele falha em silêncio na tela',
      ).toBe(200);

      // Lista vazia é resultado legítimo (pode não haver linha elegível). Erro de servidor no
      // corpo de um 200, não: é a forma que o dataset quebrado assume.
      expect(corpo, `${nome} respondeu 200 mas com erro no corpo`).not.toMatch(
        /NullPointerException/i,
      );
    });
  }

  test('FSWTBC-4503 FSWTBC-4176 — nome inexistente responde 500, o que dá sentido ao 200 acima', async ({
    request,
  }) => {
    const resposta = await request.get('/api/public/ecm/dataset/search', {
      params: { datasetId: NOME_AUSENTE },
    });
    const corpo = await resposta.text();

    test.info().annotations.push({
      type: 'dataset-controle',
      description: `${NOME_AUSENTE}: ${resposta.status()} · ${corpo.slice(0, 140)}`,
    });

    expect(
      resposta.status(),
      'o endpoint deixou de distinguir dataset ausente de dataset vazio — sem essa distinção, ' +
        'os smokes acima param de provar qualquer coisa e o defeito do FSWTBC-4503 volta a ' +
        'aparecer só na tela do usuário',
    ).toBe(500);
    expect(corpo).toMatch(/NullPointerException/i);
  });

  /**
   * FSWTBC-4176, o que é medível e o que não é.
   *
   * O caso espera que `dsRevisaoContratos` devolva **colunas definidas** e as linhas da medição
   * aberta. Medido em 09/09/2026 pelo `POST /api/public/ecm/dataset/datasets`: ele responde 200
   * com `columns: []` e `values: []` para **todo** filtro tentado (sem filtro, `CONTRATO`,
   * `CN9_NUMERO`, `NUMERO`, `numeroContrato`), inclusive para um contrato que tem Faturamento
   * ABERTO no Tracker — enquanto um dataset de referência (`dsProtheus_getBranches_restGetAll`)
   * devolve 32 colunas na mesma chamada.
   *
   * Isso **não** basta para afirmar defeito, e o teste não afirma: o chamado não registra o
   * nome do parâmetro que o Protheus envia, e um dataset construído por `DatasetBuilder` só
   * declara colunas quando há linha casada. Zero coluna com filtro que não casa é indistinguível
   * de zero coluna por dataset quebrado — e chamar isso de bug seria apontar defeito onde a
   * medição não alcança.
   *
   * O que fica afirmado é o que a medição sustenta: a chamada responde, com corpo JSON e sem
   * erro de servidor. A forma exata da resposta vai para a anotação, para que a próxima pessoa
   * que descobrir o parâmetro certo tenha o ponto de partida.
   */
  test('FSWTBC-4176 — a consulta de revisão de contratos responde sem erro de servidor', async ({
    page,
  }) => {
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

    const resultado = await page.evaluate(async () => {
      const resposta = await fetch('/api/public/ecm/dataset/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'dsRevisaoContratos', fields: [], constraints: [], order: [] }),
      });
      return { status: resposta.status, corpo: (await resposta.text()).slice(0, 400) };
    });

    test.info().annotations.push({
      type: 'ds-revisao-contratos',
      description: `${resultado.status} · ${resultado.corpo}`,
    });

    expect(
      resultado.status,
      'a consulta que sustenta a trava de revisão do contrato parou de responder — foi uma das ' +
        'três causas da revisão 003 do 00015-2026-5303 ter sido salva com medição aberta',
    ).toBe(200);
    expect(resultado.corpo).not.toMatch(/NullPointerException|ECMException/i);
  });
});
