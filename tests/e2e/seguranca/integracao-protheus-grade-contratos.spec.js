// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { DATASET } from '../../../config/ambiente.js';
import { aguardarDataset, derrubarDataset } from '../../../utils/dataset-fluig.js';

/**
 * Integração com o Protheus na carga do Portal de Acompanhamento de Contratos.
 *
 * Datasets confirmados no ambiente (ver mapa-do-ambiente.md > Datasets):
 *   - `dsProtheus_getContratosxFornecedores_restGet` (grade de contratos)
 *   - `dsProtheus_getTipoContratos_restGetAll` (tipos de contrato)
 *
 * `dsProtheus_getTipoContratos_restGetAll` ainda não está em `config/ambiente.js` — usado
 * aqui como literal, com o nome confirmado em campo, sem alterar o arquivo compartilhado.
 */
const DATASET_TIPO_CONTRATOS = 'dsProtheus_getTipoContratos_restGetAll';

test.describe('Integração Protheus — carga da grade de contratos', () => {
  test('CT-INT-01-H: deve carregar contratos e tipos de contrato consultados no Protheus', async ({
    page,
    contratosPage,
  }) => {
    const respostaContratos = aguardarDataset(page, DATASET.CONTRATOS);
    const respostaTipos = aguardarDataset(page, DATASET_TIPO_CONTRATOS);

    await contratosPage.goto();

    const [contratosResp, tiposResp] = await Promise.all([respostaContratos, respostaTipos]);

    expect(contratosResp.ok(), `dataset de contratos respondeu ${contratosResp.status()}`).toBe(
      true,
    );
    expect(tiposResp.ok(), `dataset de tipos de contrato respondeu ${tiposResp.status()}`).toBe(
      true,
    );

    const corpoContratos = /** @type {{ content: { columns: string[], values: Record<string, unknown>[] } }} */ (
      await contratosResp.json()
    );
    const corpoTipos = /** @type {{ content: { columns: string[], values: Record<string, unknown>[] } }} */ (
      await tiposResp.json()
    );

    // Dado coerente: veio com colunas e ao menos um registro — não é payload vazio nem
    // formato inesperado.
    expect(corpoContratos.content.columns.length).toBeGreaterThan(0);
    expect(
      corpoContratos.content.values.length,
      'dataset de contratos respondeu sem nenhum registro',
    ).toBeGreaterThan(0);

    expect(corpoTipos.content.columns.length).toBeGreaterThan(0);
    expect(
      corpoTipos.content.values.length,
      'dataset de tipos de contrato respondeu sem nenhum registro',
    ).toBeGreaterThan(0);

    // O dado chega até a tela: a grade renderiza registros de verdade a partir da resposta.
    await contratosPage.expectCarregada();
    await expect(contratosPage.getInformacaoDaGrade()).toHaveText(
      /Mostrando de 1 até \d+ de \d+ registros/,
    );
  });

  test('CT-INT-01-S1: deve comunicar indisponibilidade quando o Protheus não responde na carga da grade', async ({
    page,
    contratosPage,
  }) => {
    // Ponto diferente do já coberto em indisponibilidade-protheus.spec.js (que derruba os
    // datasets do MODAL de Solicitação de Compra). Aqui o dataset derrubado é o da GRADE,
    // consultado na carga da própria página do portal.
    await derrubarDataset(page, DATASET.CONTRATOS);

    await contratosPage.goto();

    // Não pode travar: o título continua alcançável dentro do timeout padrão de ação —
    // se a tela congelasse, esta espera estouraria e o teste reprovaria por si só, sem
    // precisar de wait arbitrário. Não é tela branca: o cabeçalho da página está presente.
    await expect(contratosPage.titulo).toBeVisible();

    // Comportamento observado em campo (não é hipótese): o Fluig renderiza um alerta
    // visível ("ERRO:") com a mensagem devolvida pelo dataset que falhou — a assertion
    // usa o heading genérico "ERRO:", não o texto específico da falha simulada, porque é
    // esse o comportamento de tratamento de erro do próprio app (mesmo trecho de código
    // rodaria com uma falha real do Protheus, com outra mensagem no corpo).
    const alertaErro = page.getByRole('alert').filter({ hasText: 'ERRO' });
    await expect(alertaErro).toBeVisible();
    await expect(alertaErro.getByRole('heading', { name: 'ERRO:', level: 2 })).toBeVisible();

    // Não é combo/grade vazia silenciosa: sem dado, o DataTables nem chega a inicializar
    // — a linha de informação ("Mostrando de X até Y de Z registros") não existe, então
    // não há como simular sucesso com zero registros como se fosse resultado legítimo.
    await expect(contratosPage.getInformacaoDaGrade()).toHaveCount(0);
  });
});
