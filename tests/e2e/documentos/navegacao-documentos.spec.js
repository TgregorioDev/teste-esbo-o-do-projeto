// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { DocumentosPage } from '../../../pages/DocumentosPage.js';

/**
 * Documentos / GED — CT-GED-01-H e cobertura não destrutiva da árvore de pastas.
 *
 * Somente leitura: nenhum cenário aqui faz upload, remove, aprova ou move documento.
 * CT-GED-02 (upload), CT-GED-03 (check-out/in), CT-GED-04 (aprovação) e CT-GED-05
 * (lixeira) escrevem no ambiente do cliente e não estão implementados (ver README/relatório).
 */

test.describe('Documentos — árvore de pastas (CT-GED-01-H)', () => {
  test('deve carregar a listagem com as colunas Descrição, Atualização e Código', async ({
    page,
  }) => {
    const documentosPage = new DocumentosPage(page);
    await documentosPage.irParaRaizGarantido();

    await expect(documentosPage.colunaDescricao).toBeVisible();
    await expect(documentosPage.colunaAtualizacao).toBeVisible();
    await expect(documentosPage.colunaCodigo).toBeVisible();

    const totalLinhas = await documentosPage.contarLinhasDeConteudo();
    expect(totalLinhas, 'a Raiz não trouxe nenhuma pasta/documento para avaliar').toBeGreaterThan(0);
  });

  test('deve alterar a quantidade de resultados por página sem quebrar a listagem', async ({
    page,
  }) => {
    const documentosPage = new DocumentosPage(page);
    await documentosPage.irParaRaizGarantido();

    await expect(documentosPage.seletorResultadosPorPagina).toHaveValue('30');
    const descricoesAntes = await documentosPage.lerDescricoes();

    await documentosPage.alterarResultadosPorPagina(50);

    await expect(documentosPage.seletorResultadosPorPagina).toHaveValue('50');
    // A troca de página não pode esvaziar a grade nem alterar o conjunto de pastas da Raiz.
    await expect(documentosPage.colunaDescricao).toBeVisible();
    const descricoesDepois = await documentosPage.lerDescricoes();
    expect(descricoesDepois.sort()).toEqual(descricoesAntes.sort());
  });
});

test.describe('Documentos — barra de ações (presença, sem interação)', () => {
  test('deve oferecer Novo, Copiar, Colar, Recortar, Remover e Filtrar na barra de ações', async ({
    page,
  }) => {
    const documentosPage = new DocumentosPage(page);
    await documentosPage.irParaRaizGarantido();

    await expect(documentosPage.acoes.novo).toBeVisible();
    await expect(documentosPage.acoes.copiar).toBeVisible();
    await expect(documentosPage.acoes.colar).toBeVisible();
    await expect(documentosPage.acoes.recortar).toBeVisible();
    await expect(documentosPage.acoes.remover).toBeVisible();
    await expect(documentosPage.acoes.filtrar).toBeVisible();
    await expect(documentosPage.acoes.mais).toBeVisible();
  });
});

test.describe('Documentos — navegação de pasta', () => {
  test('deve navegar para "Meus Documentos" e retornar para a Raiz preservando a listagem', async ({
    page,
  }) => {
    const documentosPage = new DocumentosPage(page);
    await documentosPage.irParaRaizGarantido();

    const descricoesNaRaiz = await documentosPage.lerDescricoes();
    expect(descricoesNaRaiz).toContain('Meus Documentos');

    await documentosPage.abrirPasta('Meus Documentos');

    await expect(documentosPage.breadcrumb).toContainText('Meus Documentos');
    await expect(page).toHaveURL(/app_ecm_navigation_doc=/);

    await documentosPage.voltarParaRaiz();

    await expect(documentosPage.breadcrumb).not.toContainText('Meus Documentos');
    const descricoesDeVolta = await documentosPage.lerDescricoes();
    expect(descricoesDeVolta.sort()).toEqual(descricoesNaRaiz.sort());
  });
});
