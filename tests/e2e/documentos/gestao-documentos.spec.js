// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { DocumentosGedPage } from '../../../pages/DocumentosGedPage.js';
import { criarDocumento, criarNivelAprovacao } from '../../../factories/documento.js';
import { envObrigatoria } from '../../../config/ambiente.js';

/**
 * Documentos / GED — cenários que escrevem no ambiente (upload, aprovação).
 *
 * Escrita é autorizada nesta base de homologação (ver docs/politica-de-escrita.md): cada teste
 * cria o próprio documento, com nome vindo de `factories/documento.js` (prefixo `QA` + sufixo
 * único). Todo cenário aqui leva `@destrutivo` e fica fora da execução padrão — roda com
 * `INCLUIR_DESTRUTIVOS=1 npx playwright test --grep @destrutivo`.
 *
 * CT-GED-03 (check-out/check-in) NÃO está aqui: investigado a fundo (ver
 * `pages/DocumentosGedPage.js` e o relatório da suíte), o check-out real depende de um cliente
 * WebDAV/Office nativo que o Chromium não aciona — nem em headless nem em headed, com uma
 * sessão ou com duas. Não é um caso de "não tentei"; é uma integração fora do alcance de
 * automação de navegador.
 */

test.afterEach(async ({ page }) => {
  // A pasta atual do GED é lembrada no SERVIDOR, por usuário — não por sessão de navegador
  // (ver `DocumentosGedPage`). Sem este reset, um teste que navega para dentro de uma pasta
  // deixa a próxima spec da suíte (ex.: `navegacao-documentos.spec.js`, que não pode ser
  // editada) aterrissando fora da Raiz ao chamar `goto()`. Roda mesmo se o teste falhou.
  const documentosPage = new DocumentosGedPage(page);
  await documentosPage.goto();
  await documentosPage.expectCarregada();
  await documentosPage.voltarParaRaiz();
});

test.describe('Documentos — upload (CT-GED-02)', () => {
  test('CT-GED-02-H upload de documento cria, versiona (v1000) e lista o documento @destrutivo', async ({
    page,
  }) => {
    const documentosPage = new DocumentosGedPage(page);
    const documento = criarDocumento();

    await documentosPage.irParaRaizGarantido();
    await documentosPage.abrirPasta('Meus Documentos');

    await documentosPage.enviarDocumento({
      descricao: documento.descricao,
      caminhoArquivo: 'fixtures/anexos/documento-valido.pdf',
    });

    const linha = documentosPage.localizarLinha(documento.descricao);
    await expect(linha, 'documento não apareceu na listagem de "Meus Documentos" após o upload').toBeVisible();
    await expect(
      linha.locator('[aria-describedby="ecm-navigation-grid_version"]'),
      'documento não nasceu na versão 1000',
    ).toHaveText('1000');
  });

  test('CT-GED-02-S1 upload de extensão bloqueada é rejeitado e nada é gravado @destrutivo', async ({
    page,
  }) => {
    const documentosPage = new DocumentosGedPage(page);
    const documento = criarDocumento();

    await documentosPage.irParaRaizGarantido();
    await documentosPage.abrirPasta('Meus Documentos');

    await documentosPage.enviarDocumento({
      descricao: documento.descricao,
      caminhoArquivo: 'fixtures/anexos/arquivo-bloqueado.exe',
    });

    // Comportamento esperado: o Fluig bloqueia a extensão não permitida com mensagem clara e
    // nada é gravado. DEFEITO CONFIRMADO EM CAMPO: nenhuma validação de extensão ocorre — o
    // .exe é aceito e publicado normalmente, com o mesmo toast de sucesso de um upload válido
    // ("Novo documento publicado: ..."). Este teste fica vermelho de propósito, documentando o
    // defeito — não ajuste a assertion para "passar".
    await expect(
      page.getByText(/extensão não permitida|tipo de arquivo não permitido|arquivo não permitido/i),
      'esperada mensagem de bloqueio para extensão não permitida — nenhuma mensagem de bloqueio foi exibida (defeito confirmado: o upload de .exe é aceito sem validação)',
    ).toBeVisible();
    await expect(
      documentosPage.localizarLinha(documento.descricao),
      'esperado que nada fosse gravado — o documento de extensão bloqueada foi publicado normalmente',
    ).toHaveCount(0);
  });
});

test.describe('Documentos — aprovação (CT-GED-04)', () => {
  test('CT-GED-04-H submeter documento com aprovação e aprovar como responsável @destrutivo', async ({
    page,
  }) => {
    // A tarefa de aprovação recém-criada pode demorar a aparecer na Central de Tarefas —
    // `aprovarDocumento` tenta por até 75s (ver o Page Object).
    test.setTimeout(150_000);

    const documentosPage = new DocumentosGedPage(page);
    const documento = criarDocumento();
    const nivel = criarNivelAprovacao();
    const usuarioAutomacao = envObrigatoria('QA_USERNAME');

    // "Compras e Contratação > Parecer Técnico" é a pasta confirmada com o recurso de aprovação
    // habilitado (a aba "Aprovação" só aparece no publicador dentro dela — "Meus Documentos" e
    // a "Check-out" virtual não a oferecem).
    await documentosPage.irParaRaizGarantido();
    await documentosPage.abrirPasta('Compras e Contratação');
    await documentosPage.abrirPasta('Parecer Técnico');

    await documentosPage.enviarDocumento({
      descricao: documento.descricao,
      caminhoArquivo: 'fixtures/anexos/documento-valido.pdf',
      antesDeConfirmar: () =>
        documentosPage.configurarAprovacaoComResponsavel({
          nomeNivel: nivel.nome,
          loginAprovador: usuarioAutomacao,
        }),
    });

    // Enquanto pendente de aprovação, o documento ainda não aparece na listagem da pasta.
    await expect(
      documentosPage.localizarLinha(documento.descricao),
      'documento com aprovação pendente não deveria aparecer na pasta antes de ser aprovado',
    ).toHaveCount(0);

    await documentosPage.aprovarDocumento(documento.descricao);

    await documentosPage.irParaRaizGarantido();
    await documentosPage.abrirPasta('Compras e Contratação');
    await documentosPage.abrirPasta('Parecer Técnico');
    await expect(
      documentosPage.localizarLinha(documento.descricao),
      'documento aprovado não apareceu na pasta de destino',
    ).toBeVisible();
  });
});
