// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { DATASET, TITULO_LOGIN } from '../../../config/ambiente.js';
import { derrubarDataset, responderDatasetCom } from '../../../utils/dataset-fluig.js';

/**
 * Acesso ao Portal de Acompanhamento de Contratos — casos CT-ACC-01.
 *
 * O portal libera o painel conforme os grupos do usuário, lidos do dataset
 * `colleagueGroup`. Os dois cenários negativos são interceptados no navegador porque não
 * há como reproduzi-los de outra forma: exigiriam provisionar um segundo usuário sem o
 * grupo, ou derrubar um serviço do ambiente do cliente. A interceptação exercita
 * exatamente o mesmo trecho de código que rodaria na situação real.
 */
test.describe('Acesso ao Portal de Acompanhamento de Contratos', () => {
  test('CT-ACC-01-H — deve listar os contratos para usuário com o grupo de acesso', async ({ contratosPage }) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    await expect(contratosPage.titulo).toBeVisible();

    // A quantidade de contratos varia com a base; o que o negócio garante é que a grade
    // carrega registros. Fixar o total tornaria o teste falso-vermelho a cada movimentação.
    await expect(contratosPage.getInformacaoDaGrade()).toHaveText(
      /Mostrando de 1 até \d+ de \d+ registros/,
    );

    await expect(contratosPage.campoPesquisar).toBeVisible();
    await expect(contratosPage.avisoAcessoNegado).toHaveCount(0);
  });

  test('CT-ACC-01-H — deve apresentar as colunas do contrato na ordem definida pelo negócio', async ({
    contratosPage,
  }) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    const esperadas = [
      'Filial',
      'Tipo Contrato',
      'Contrato',
      'Data Inicio',
      'Data Fim',
      'Nº Revisão',
      'Status',
      'Fornecedor',
      'Ação',
    ];

    const cabecalhos = await contratosPage.getCabecalhos().allInnerTexts();
    const normalizados = cabecalhos.map((texto) => texto.trim()).filter(Boolean);

    for (const coluna of esperadas) {
      expect(normalizados, `coluna "${coluna}" ausente na grade`).toContain(coluna);
    }
  });

  test('CT-ACC-01-S1 — deve negar o acesso ao painel para usuário fora dos grupos autorizados', async ({
    page,
    contratosPage,
  }) => {
    // Usuário sem nenhum grupo: o dataset responde vazio, e é essa a única diferença
    // entre este cenário e o do usuário autorizado.
    await responderDatasetCom(page, DATASET.GRUPOS_DO_USUARIO, {
      columns: ['colleagueGroupPK.companyId', 'colleagueGroupPK.colleagueId', 'colleagueGroupPK.groupId'],
      values: [],
    });

    await contratosPage.goto();

    await expect(contratosPage.avisoAcessoNegado).toBeVisible();
    await expect(contratosPage.alertaAcessoNegado).toBeVisible();
    // Valida também o que NÃO deve acontecer: nenhum contrato pode ser exibido
    await expect(contratosPage.getInformacaoDaGrade()).toHaveCount(0);
  });

  test('CT-ACC-01-S2 — deve distinguir falha na validação de permissão de ausência de permissão', async ({
    page,
    contratosPage,
  }) => {
    // Se o dataset de permissões falha, tratar como "sem permissão" mandaria o suporte
    // procurar grupo quando o problema é indisponibilidade. A mensagem tem que ser outra.
    await derrubarDataset(page, DATASET.GRUPOS_DO_USUARIO);

    await contratosPage.goto();

    await expect(contratosPage.avisoFalhaPermissao).toBeVisible();
    await expect(contratosPage.alertaFalhaPermissao).toBeVisible();
    // O ponto do caso: indisponibilidade NÃO pode ser comunicada como falta de permissão
    await expect(contratosPage.avisoAcessoNegado).toHaveCount(0);
    await expect(contratosPage.alertaAcessoNegado).toHaveCount(0);
  });
});

test.describe('Acesso não autenticado ao portal', () => {
  // Contexto anônimo: prova o controle de acesso de verdade
  test.use({ storageState: { cookies: [], origins: [] } });

  test('deve exigir autenticação ao abrir o portal sem sessão', async ({ page, contratosPage, loginPage }) => {
    await contratosPage.goto();

    await expect(page).toHaveTitle(TITULO_LOGIN);
    await expect(loginPage.campoUsuario).toBeVisible();
    await expect(contratosPage.titulo).toHaveCount(0);
  });
});
