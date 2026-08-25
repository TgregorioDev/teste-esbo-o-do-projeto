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
 * ressalvas. A RESTAURAÇÃO era dada como bloqueada por indexação lenta da Lixeira ("mais de 5
 * minutos sem o item aparecer"). **Isso foi remedido em 25/08/2026 e não se confirmou**: com a
 * paginação da grade corrigida (o documento publicado caía na página 2 e a pré-condição abaixo
 * nem chegava a vê-lo) e com o clique no paginador da Lixeira esperando o overlay do blockUI
 * sair, o ciclo completo — publicar, excluir, achar na Lixeira, restaurar e reencontrar na pasta
 * — fechou verde em 5 execuções seguidas, entre 64s e 84s cada. O que reprovava era nosso.
 *
 * Se este teste voltar a ficar vermelho na etapa de restauração, aí sim vale investigar a
 * indexação — mas comece conferindo em que página da grade o documento está.
 */

test.afterEach(async ({ page }) => {
  // Mesma cautela de `gestao-documentos.spec.js`: a pasta/página atual do GED é lembrada no
  // servidor por usuário. Sem este reset, deixar a sessão presa na Lixeira ou dentro de uma
  // pasta quebraria a próxima spec (`navegacao-documentos.spec.js`, não editável) ao assumir
  // que `goto()` aterrissa na Raiz. Roda mesmo se o teste falhou.
  // `irParaRaizGarantido()` clica na Raiz ANTES de exigir a grade: quando a pasta corrente da
  // conta não vale mais, a página renderiza o breadcrumb e não renderiza a grade, e exigir a
  // grade primeiro queimava 45s num `columnheader` inexistente — reprovando o teste pelo
  // afterEach, não pelo cenário. Ver `DocumentosPage`.
  const documentosPage = new DocumentosGedPage(page);
  await documentosPage.irParaRaizGarantido();
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
    // "Meus Documentos" passa de 50 documentos e a grade pagina em 30: sem posicionar a grade
    // na página certa, a pré-condição reprova conforme a inicial que o faker sorteou.
    await documentosPage.irParaPaginaComDocumento(documento.descricao);
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
    await documentosPage.irParaPaginaComDocumento(documento.descricao);
    await expect(
      documentosPage.localizarLinha(documento.descricao),
      'documento restaurado não voltou a aparecer na pasta de origem ("Meus Documentos")',
    ).toBeVisible();
  });
});
