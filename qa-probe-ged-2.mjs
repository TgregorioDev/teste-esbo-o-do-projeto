// Probe 2: (A) contrato de restaurar da Lixeira; (B) documento com aprovação pendente -> rejeitar.
import { chromium, expect } from '@playwright/test';
import { DocumentosGedPage } from './pages/DocumentosGedPage.js';
import { criarDocumento, criarNivelAprovacao } from './factories/documento.js';
import { appendFileSync } from 'node:fs';

const LOG = '/home/dev1/cassi-e2e/qa-probe-ged-2.log';
const log = (...a) => { const s = a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '); console.log(s); appendFileSync(LOG, s + '\n'); };
const pausa = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch();
const ctx = await browser.newContext({
  baseURL: 'https://caixade182374.fluig.cloudtotvs.com.br',
  storageState: '/home/dev1/cassi-e2e/playwright/.auth/usuario.json',
  locale: 'pt-BR',
});
const page = await ctx.newPage();
const interesse = /\/ecm\/api\/|\/api\/public\/|documentPublisher|recycleBin|navigation\/|centralTask|approve/i;
page.on('request', (r) => {
  if (r.method() !== 'GET' && interesse.test(r.url())) {
    const body = (r.postData() ?? '').slice(0, 700);
    log(`>> ${r.method()} ${r.url().replace(/^https:\/\/[^/]+/, '')}`, body ? `BODY: ${body}` : '');
  }
});
page.on('response', async (r) => {
  if (r.request().method() !== 'GET' && interesse.test(r.url())) {
    let t = ''; try { t = (await r.text()).slice(0, 400); } catch {}
    log(`<< ${r.status()} ${r.url().replace(/^https:\/\/[^/]+/, '')} RESP: ${t}`);
  }
});

async function acharNaLixeira(ged, documentId) {
  const checkbox = page.locator(`#cb-item-${documentId}`);
  await expect(async () => {
    await ged.gotoLixeira();
    await ged.ampliarPaginaDaLixeira();
    for (let p = 1; p <= 30; p++) {
      await ged.aguardarLixeiraOciosa();
      if (await checkbox.count()) break;
      const prox = ged.lixeira.botaoProximaPagina;
      if (await prox.isDisabled()) break;
      const resp = page.waitForResponse((r) => r.url().includes('recycleBin/getRecycledDocuments'));
      await prox.click();
      await resp;
    }
    expect(await checkbox.count()).toBeGreaterThan(0);
  }).toPass({ timeout: 90_000, intervals: [5_000, 10_000, 15_000] });
  return checkbox;
}

async function excluirDefinitivo(ged, documentId) {
  const checkbox = await acharNaLixeira(ged, documentId);
  const linha = checkbox.locator('xpath=ancestor::tr[1]');
  await linha.locator('[title="Excluir Documento"]').click();
  await pausa(1000);
  const modal = page.locator('.modal:visible, [role="dialog"]:visible').first();
  if (await modal.count()) await modal.locator('button, a.btn').filter({ hasText: /^Excluir$/ }).first().click();
  await expect(checkbox).toHaveCount(0, { timeout: 20_000 });
}

try {
  const ged = new DocumentosGedPage(page);

  // ===================== PARTE A: contrato de RESTAURAR =====================
  const docA = criarDocumento();
  log('=== PARTE A (restaurar). DOC:', docA.descricao);
  await ged.irParaRaizGarantido();
  await ged.abrirPasta('Meus Documentos');
  await ged.enviarDocumento({ descricao: docA.descricao, caminhoArquivo: 'fixtures/anexos/documento-valido.pdf' });
  await ged.irParaPaginaComDocumento(docA.descricao);
  await expect(ged.localizarLinha(docA.descricao)).toBeVisible();
  await pausa(30_000);

  await ged.irParaPaginaComDocumento(docA.descricao);
  const idA = await ged.excluirDocumento(docA.descricao);
  log('excluido, id =', idA);
  await pausa(30_000);

  log('--- RESTAURANDO (capturar contrato) ---');
  await ged.restaurarDaLixeira(idA);
  await pausa(3_000);
  await ged.irParaRaizGarantido();
  await ged.abrirPasta('Meus Documentos');
  await ged.irParaPaginaComDocumento(docA.descricao);
  await expect(ged.localizarLinha(docA.descricao)).toBeVisible();
  log('restaurado OK — voltou para Meus Documentos');
  await pausa(30_000);

  // limpeza: excluir de novo + definitivo
  await ged.irParaPaginaComDocumento(docA.descricao);
  await ged.excluirDocumento(docA.descricao);
  await pausa(30_000);
  await excluirDefinitivo(ged, idA);
  log('PARTE A limpa (excluido definitivo).');

  // ===================== PARTE B: aprovação pendente -> REJEITAR =====================
  const docB = criarDocumento();
  const nivel = criarNivelAprovacao();
  log('=== PARTE B (aprovacao pendente -> rejeitar). DOC:', docB.descricao);
  await pausa(30_000);
  await ged.irParaRaizGarantido();
  await ged.abrirPasta('Compras e Contratação');
  await ged.abrirPasta('Parecer Técnico');
  await ged.enviarDocumento({
    descricao: docB.descricao,
    caminhoArquivo: 'fixtures/anexos/documento-valido.pdf',
    antesDeConfirmar: () => ged.configurarAprovacaoComResponsavel({ nomeNivel: nivel.nome, loginAprovador: 'TOTVS-FS' }),
  });
  log('publicado com aprovacao pendente');

  // não aparece na pasta enquanto pendente
  await ged.irParaPaginaComDocumento(docB.descricao, { tentativas: 1 });
  log('pendente aparece na pasta?', (await ged.localizarLinha(docB.descricao).count()) > 0);

  // achar a tarefa e REJEITAR
  const descElemento = page.getByText(docB.descricao, { exact: true });
  const cartao = descElemento.locator('xpath=ancestor::*[.//button[normalize-space()="Aprovar"]][1]');
  let idB = null;
  await expect(async () => {
    await ged.abrirDocumentosAAprovar();
    await expect(descElemento).toBeVisible({ timeout: 5_000 });
    // id do documento no botão de download do cartão
    const dl = cartao.locator('[data-document-action^="download-"]').first();
    if (await dl.count()) {
      idB = (await dl.getAttribute('data-document-action')).replace('download-', '');
    }
    // inventário de ações do cartão
    const acoes = await cartao.locator('button:visible, a:visible').evaluateAll(els => [...new Set(els.map(e => e.textContent.trim()).filter(Boolean))]);
    log('ACOES DO CARTAO:', acoes, 'docId:', idB);
    await cartao.getByRole('button', { name: 'Rejeitar', exact: true }).click({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /Rejeitar documento/i })).toBeVisible({ timeout: 10_000 });
  }).toPass({ timeout: 90_000, intervals: [3_000, 5_000, 8_000] });

  const modalRej = page.locator('.modal:visible, [role="dialog"]:visible').first();
  log('MODAL REJEITAR:', (await modalRej.innerText()).replace(/\s+/g, ' ').slice(0, 500));
  const obs = modalRej.locator('textarea:visible, input[type="text"]:visible').first();
  if (await obs.count()) await obs.fill('QA probe - rejeicao para mapear ciclo de vida');
  log('--- REJEITANDO (capturar contrato) ---');
  await modalRej.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await pausa(4_000);
  const toast = await page.locator('.alert:visible, .toast:visible, [class*="flash"]:visible').allInnerTexts().catch(() => []);
  log('mensagens pos-rejeicao:', toast);

  // residuo? pasta e lixeira
  await ged.irParaRaizGarantido();
  await ged.abrirPasta('Compras e Contratação');
  await ged.abrirPasta('Parecer Técnico');
  await ged.irParaPaginaComDocumento(docB.descricao, { tentativas: 1 });
  log('rejeitado aparece na pasta?', (await ged.localizarLinha(docB.descricao).count()) > 0);
  if (idB) {
    await ged.gotoLixeira();
    await ged.ampliarPaginaDaLixeira();
    let achou = false;
    for (let p = 1; p <= 30; p++) {
      await ged.aguardarLixeiraOciosa();
      if (await page.locator(`#cb-item-${idB}`).count()) { achou = true; break; }
      const prox = ged.lixeira.botaoProximaPagina;
      if (await prox.isDisabled()) break;
      const resp = page.waitForResponse((r) => r.url().includes('recycleBin/getRecycledDocuments'));
      await prox.click();
      await resp;
    }
    log('rejeitado esta na LIXEIRA?', achou, '(id', idB + ')');
    if (achou) {
      await pausa(30_000);
      await excluirDefinitivo(ged, idB);
      log('rejeitado excluido definitivamente da lixeira');
    }
  } else {
    log('AVISO: nao capturei o docId do pendente — verificar residuo manualmente');
  }

  await ged.irParaRaizGarantido();
  log('=== PROBE 2 OK ===');
} catch (e) {
  log('!!! ERRO:', String(e).slice(0, 2000));
  try { await page.screenshot({ path: '/home/dev1/cassi-e2e/qa-probe-ged-2-erro.png', fullPage: true }); } catch {}
} finally {
  await browser.close();
}
