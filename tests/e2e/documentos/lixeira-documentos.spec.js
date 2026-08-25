// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { DocumentosGedPage } from '../../../pages/DocumentosGedPage.js';
import { criarDocumento } from '../../../factories/documento.js';

/**
 * Documentos / GED — lixeira (CT-GED-05).
 *
 * Escrita é autorizada nesta base de homologação (ver docs/politica-de-escrita.md). O teste
 * cria o próprio documento, exclui SÓ ele (nunca um documento pré-existente) e restaura pela
 * Lixeira. Leva `@destrutivo` e fica fora da execução padrão.
 *
 * A Lixeira desta instalação não é localizável por busca nem por ordenação de coluna — ver
 * `pages/DocumentosGedPage.js` para a evidência. A localização aqui é por paginação, pelo
 * `documentId` capturado no momento da exclusão.
 *
 * A exclusão em si (documento sai da pasta) é rápida e determinística — verificada abaixo sem
 * ressalvas. A RESTAURAÇÃO depende da Lixeira indexar a exclusão, e essa indexação, em campo,
 * não aconteceu de forma confiável dentro de uma janela de teste razoável (varredura contínua
 * por mais de 5 minutos não encontrou uma exclusão feita minutos antes, embora exclusões de
 * horas antes já estivessem lá). Se este teste ficar vermelho na etapa de restauração, é esse
 * atraso de indexação sendo documentado — não um defeito de sincronização do teste. Ver o
 * relatório da suíte para os números medidos.
 */

test.afterEach(async ({ page }) => {
  // Mesma cautela de `gestao-documentos.spec.js`: a pasta/página atual do GED é lembrada no
  // servidor por usuário. Sem este reset, deixar a sessão presa na Lixeira ou dentro de uma
  // pasta quebraria a próxima spec (`navegacao-documentos.spec.js`, não editável) ao assumir
  // que `goto()` aterrissa na Raiz. Roda mesmo se o teste falhou.
  const documentosPage = new DocumentosGedPage(page);
  await documentosPage.goto();
  await documentosPage.expectCarregada();
  await documentosPage.voltarParaRaiz();
});

test.describe('Documentos — lixeira (CT-GED-05)', () => {
  test('CT-GED-05-H excluir documento próprio e restaurar à pasta de origem pela Lixeira @destrutivo', async ({
    page,
  }) => {
    // A busca pelo item recém-removido na Lixeira roda por até 90s dentro de `restaurarDaLixeira`
    // (ver o Page Object) — o teste precisa de mais que o timeout padrão para caber essa espera.
    test.setTimeout(150_000);

    const documentosPage = new DocumentosGedPage(page);
    const documento = criarDocumento();

    await documentosPage.irParaRaizGarantido();
    await documentosPage.abrirPasta('Meus Documentos');

    await documentosPage.enviarDocumento({
      descricao: documento.descricao,
      caminhoArquivo: 'fixtures/anexos/documento-valido.pdf',
    });
    await expect(
      documentosPage.localizarLinha(documento.descricao),
      'pré-condição: o documento precisa existir em "Meus Documentos" antes de ser excluído',
    ).toBeVisible();

    // Só o documento que ESTA execução criou é excluído — nunca um documento pré-existente.
    const documentId = await documentosPage.excluirDocumento(documento.descricao);
    await expect(
      documentosPage.localizarLinha(documento.descricao),
      'documento deveria ter saído da listagem de "Meus Documentos" após a exclusão',
    ).toHaveCount(0);

    await documentosPage.restaurarDaLixeira(documentId);

    await documentosPage.irParaRaizGarantido();
    await documentosPage.abrirPasta('Meus Documentos');
    await expect(
      documentosPage.localizarLinha(documento.descricao),
      'documento restaurado não voltou a aparecer na pasta de origem ("Meus Documentos")',
    ).toBeVisible();
  });
});
