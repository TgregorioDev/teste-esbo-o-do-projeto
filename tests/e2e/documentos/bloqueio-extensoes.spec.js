// @ts-check
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { test, expect } from '../../../fixtures/fixtures.js';
import { DocumentosGedPage } from '../../../pages/DocumentosGedPage.js';
import { criarDocumento } from '../../../factories/documento.js';

/**
 * CT-GED-02-S2 — bloqueio de extensão no GED tem de ser **allowlist**, não uma lista negra do
 * `.exe`.
 *
 * ## Por que este caso existe
 *
 * `CT-GED-02-S1` (`gestao-documentos.spec.js`) já prova, vermelho, que o GED **aceita e publica
 * um `.exe`** sem nenhuma validação de extensão e com o mesmo toast de sucesso de um upload
 * válido. O caminho de correção mais provável — e o mais errado — é acrescentar `.exe` a uma
 * lista negra: a suíte ficaria verde e o GED continuaria aceitando `.bat`, `.sh`, `.pdf.exe` e
 * o clássico executável renomeado para `.pdf`.
 *
 * Sem este caso, a correção é **declarada e não verificada**. Com ele, só fica verde quem
 * implementar a regra certa: aceitar o que está na lista de permitidos, recusar o resto.
 *
 * ## Desenho
 *
 * Um teste por arquivo, cada um com massa própria (`factories/documento.js`: prefixo `QA` +
 * sufixo único) — nada de um teste percorrendo quatro extensões, que esconderia qual delas
 * passou. Os quatro afirmam a MESMA regra e por isso ficam vermelhos juntos hoje.
 *
 * O último caso é diferente dos outros três e por isso tem mensagem própria: um executável
 * (magic bytes `MZ`) **renomeado para `.pdf`**. Se o produto validar só a extensão do nome, ele
 * passa nesse caso mesmo com uma allowlist correta — e a mensagem da falha precisa dizer isso,
 * para que quem lê o relatório saiba que a validação é **sintática**, não de conteúdo.
 *
 * ## Cuidados do ambiente (herdados de CT-GED-02-S1, não redescobertos)
 *
 * - `enviarDocumento` segura o lock `fluig-upload-staging` de `utils/exclusividade.js`: a área
 *   de upload é um diretório **por usuário no servidor** (`/volume/wdk-data/upload/<login>/`),
 *   compartilhado com o anexo da Solicitação de Compras. Nome de arquivo único não resolve — a
 *   disputa é pelo diretório.
 * - `esperaPublicacao: false`: o comportamento do publicador é parte do que se testa. Se o
 *   Fluig passar a barrar a extensão, o modal pode legitimamente continuar aberto exibindo o
 *   erro, e exigir que ele feche transformaria o conserto do produto num vermelho pelo motivo
 *   errado.
 * - "Nada foi gravado" é afirmado sobre a pasta INTEIRA (`irParaPaginaComDocumento` com
 *   `tentativas: 1`): a grade pagina em 30 por Descrição e olhar só a página corrente daria um
 *   falso verde justamente no caso negativo.
 *
 * ## Massa e resíduo
 *
 * Os arquivos são escritos em diretório temporário do sistema **no momento do teste**, em vez
 * de virarem fixtures versionados: `.bat`, `.sh` e um binário com cabeçalho `MZ` no repositório
 * são exatamente o que uma varredura de segurança sinaliza, e o conteúdo aqui é irrelevante
 * para o caso — o que importa é o NOME e os magic bytes.
 *
 * ⚠️ **Resíduo**: enquanto o defeito existir, cada execução publica quatro documentos em "Meus
 * Documentos". É o mesmo custo que `CT-GED-02-S1` já paga, e a limpeza pós-execução da suíte
 * (`scripts/limpar-massa.mjs`) só cancela solicitação — não apaga documento do GED. A remoção é
 * manual, pela dupla `navigation/removeDoc` → `recycleBin/removeDocument` documentada na skill
 * `cassi-fluig-master`. Todos nascem com o carimbo `QA` da factory, que é o que os torna
 * localizáveis depois.
 */

/** Cabeçalho de executável PE/DOS — o que uma validação por CONTEÚDO reconheceria. */
const MAGIC_BYTES_EXECUTAVEL = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);

/**
 * Escreve um arquivo de massa em diretório temporário e devolve o caminho.
 *
 * @param {string} nomeDoArquivo nome COM extensão — é ele que o caso investiga
 * @param {Buffer | string} conteudo
 * @returns {Promise<string>}
 */
async function arquivoTemporario(nomeDoArquivo, conteudo) {
  const diretorio = await mkdtemp(join(tmpdir(), `cassi-e2e-ged-${randomUUID().slice(0, 8)}-`));
  const caminho = join(diretorio, nomeDoArquivo);
  await writeFile(caminho, conteudo);
  return caminho;
}

test.afterEach(async ({ page }) => {
  // A pasta atual do GED é lembrada no SERVIDOR, por usuário — não por sessão de navegador.
  // Sem este reset, a próxima spec da suíte aterrissa fora da Raiz ao chamar `goto()`.
  // `irParaRaizGarantido()` clica na Raiz ANTES de exigir a grade: exigir a grade primeiro faz
  // o afterEach gastar 45s esperando um `columnheader` inexistente quando a pasta corrente da
  // conta não vale mais — e afterEach vermelho reprova o teste inteiro, mesmo com o corpo do
  // teste verde (armadilha já paga em `gestao-documentos.spec.js`).
  const documentosPage = new DocumentosGedPage(page);
  await documentosPage.irParaRaizGarantido();
});

/**
 * Publica um arquivo em "Meus Documentos" e afirma a regra de allowlist: mensagem de bloqueio
 * na tela e nada gravado na pasta.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ caminhoArquivo: string, nomeDoArquivo: string, porQue: string }} caso
 */
async function expectPublicacaoBloqueada(page, { caminhoArquivo, nomeDoArquivo, porQue }) {
  const documentosPage = new DocumentosGedPage(page);
  const documento = criarDocumento();

  await documentosPage.irParaRaizGarantido();
  await documentosPage.abrirPasta('Meus Documentos');

  await documentosPage.enviarDocumento({
    descricao: documento.descricao,
    caminhoArquivo,
    esperaPublicacao: false,
  });

  await expect(
    page.getByText(/extensão não permitida|tipo de arquivo não permitido|arquivo não permitido/i),
    `esperada uma mensagem de bloqueio ao publicar "${nomeDoArquivo}": ${porQue}. Nenhuma ` +
      'mensagem de bloqueio foi exibida — o GED não valida extensão (mesmo defeito que ' +
      'CT-GED-02-S1 documenta para o .exe). Uma correção que só coloque ".exe" numa lista ' +
      'negra deixa este caso vermelho, que é exatamente o ponto dele',
  ).toBeVisible();

  // Afirmado sobre a pasta INTEIRA: a grade pagina em 30 por Descrição e o documento pode
  // estar numa página seguinte. `tentativas: 1` porque aqui não se espera nada aparecer.
  await documentosPage.irParaPaginaComDocumento(documento.descricao, { tentativas: 1 });
  await expect(
    documentosPage.localizarLinha(documento.descricao),
    `esperado que nada fosse gravado ao publicar "${nomeDoArquivo}" — o documento foi publicado ` +
      `normalmente em "Meus Documentos" como "${documento.descricao}", e precisa ser removido à ` +
      'mão (navigation/removeDoc → recycleBin/removeDocument)',
  ).toHaveCount(0);
}

test.describe('GED — allowlist de extensão, não lista negra do .exe (CT-GED-02-S2)', () => {
  test('CT-GED-02-S2 @destrutivo — script de lote (.bat) deveria ser rejeitado', async ({ page }) => {
    const nomeDoArquivo = 'qa-script-lote.bat';
    const caminhoArquivo = await arquivoTemporario(
      nomeDoArquivo,
      '@echo off\r\nREM QA — massa de teste de allowlist do GED\r\n',
    );

    await expectPublicacaoBloqueada(page, {
      caminhoArquivo,
      nomeDoArquivo,
      porQue:
        'um .bat é executável no Windows e não pertence a nenhuma allowlist razoável de um GED ' +
        'documental',
    });
  });

  test('CT-GED-02-S2 @destrutivo — shell script (.sh) deveria ser rejeitado', async ({ page }) => {
    const nomeDoArquivo = 'qa-script-shell.sh';
    const caminhoArquivo = await arquivoTemporario(
      nomeDoArquivo,
      '#!/bin/sh\n# QA — massa de teste de allowlist do GED\n',
    );

    await expectPublicacaoBloqueada(page, {
      caminhoArquivo,
      nomeDoArquivo,
      porQue: 'um .sh é executável e não pertence a uma allowlist de documentos',
    });
  });

  test('CT-GED-02-S2 @destrutivo — dupla extensão (.pdf.exe) deveria ser rejeitada', async ({ page }) => {
    const nomeDoArquivo = 'qa-relatorio.pdf.exe';
    const caminhoArquivo = await arquivoTemporario(nomeDoArquivo, MAGIC_BYTES_EXECUTAVEL);

    await expectPublicacaoBloqueada(page, {
      caminhoArquivo,
      nomeDoArquivo,
      porQue:
        'é o disfarce clássico — o nome sugere um PDF, a extensão REAL é .exe, e uma validação ' +
        'que olhe só o começo do nome (ou que procure ".pdf" em qualquer posição) deixa passar',
    });
  });

  test('CT-GED-02-S2 @destrutivo — executável renomeado para .pdf deveria ser rejeitado pelo conteúdo', async ({
    page,
  }) => {
    const nomeDoArquivo = 'qa-executavel-disfarcado.pdf';
    const caminhoArquivo = await arquivoTemporario(nomeDoArquivo, MAGIC_BYTES_EXECUTAVEL);

    const documentosPage = new DocumentosGedPage(page);
    const documento = criarDocumento();

    await documentosPage.irParaRaizGarantido();
    await documentosPage.abrirPasta('Meus Documentos');

    await documentosPage.enviarDocumento({
      descricao: documento.descricao,
      caminhoArquivo,
      esperaPublicacao: false,
    });

    // Mensagem PRÓPRIA, diferente dos três casos acima: este é o único que uma allowlist
    // correta, sozinha, NÃO pega. O arquivo se chama `.pdf` e o conteúdo é um executável
    // (`MZ`). Se este caso continuar vermelho depois de os outros três ficarem verdes, a
    // leitura é precisa: a validação implementada é SINTÁTICA (olha o nome) e o produto segue
    // aceitando binário arbitrário com extensão permitida.
    await expect(
      page.getByText(
        /extensão não permitida|tipo de arquivo não permitido|arquivo não permitido|conteúdo não corresponde|arquivo inválido/i,
      ),
      `esperada mensagem de bloqueio ao publicar "${nomeDoArquivo}": o nome diz ".pdf" mas o ` +
        'conteúdo começa com os magic bytes "MZ" de um executável PE/DOS. Nenhuma mensagem foi ' +
        'exibida. ⚠️ LEITURA CORRETA DESTE VERMELHO: se os outros três casos de CT-GED-02-S2 ' +
        'estiverem VERDES e só este reprovar, a allowlist foi implementada mas valida apenas a ' +
        'EXTENSÃO DO NOME — nunca o conteúdo —, e renomear o arquivo continua sendo suficiente ' +
        'para subir um binário ao GED',
    ).toBeVisible();

    await documentosPage.irParaPaginaComDocumento(documento.descricao, { tentativas: 1 });
    await expect(
      documentosPage.localizarLinha(documento.descricao),
      `esperado que nada fosse gravado ao publicar "${nomeDoArquivo}" — o executável disfarçado ` +
        `foi publicado em "Meus Documentos" como "${documento.descricao}"`,
    ).toHaveCount(0);
  });
});
