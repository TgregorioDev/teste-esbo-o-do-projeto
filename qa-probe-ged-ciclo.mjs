// Probe: ciclo de vida GED — publicar, excluir (lixeira), excluir DEFINITIVO.
// Loga o contrato HTTP de cada operação. Só toca no documento que ELE cria (prefixo QA).
import { chromium, expect } from '@playwright/test';
import { DocumentosGedPage } from './pages/DocumentosGedPage.js';
import { criarDocumento } from './factories/documento.js';
import { appendFileSync } from 'node:fs';

const LOG = '/home/dev1/cassi-e2e/qa-probe-ged-ciclo.log';
const log = (...a) => { const s = a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '); console.log(s); appendFileSync(LOG, s + '\n'); };
const pausa = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch();
const ctx = await browser.newContext({
  baseURL: 'https://caixade182374.fluig.cloudtotvs.com.br',
  storageState: '/home/dev1/cassi-e2e/playwright/.auth/usuario.json',
  locale: 'pt-BR',
});
const page = await ctx.newPage();

// ---- logger de rede: só chamadas de API relevantes, com corpo e status
const interesse = /\/ecm\/api\/|\/api\/public\/|\/process-management\/|documentPublisher|recycleBin|navigation\//;
page.on('request', (r) => {
  if (r.method() !== 'GET' && interesse.test(r.url())) {
    const body = (r.postData() ?? '').slice(0, 800);
    log(`>> ${r.method()} ${r.url().replace('https://caixade182374.fluig.cloudtotvs.com.br','')}`, body ? `BODY: ${body}` : '');
  }
});
page.on('response', async (r) => {
  const req = r.request();
  if (req.method() !== 'GET' && interesse.test(r.url())) {
    let t = '';
    try { t = (await r.text()).slice(0, 500); } catch {}
    log(`<< ${r.status()} ${r.url().replace('https://caixade182374.fluig.cloudtotvs.com.br','')} RESP: ${t}`);
  }
});

try {
  const ged = new DocumentosGedPage(page);
  const documento = criarDocumento();
  log('=== DOC:', documento.descricao);

  // 1) publicar
  await ged.irParaRaizGarantido();
  await ged.abrirPasta('Meus Documentos');
  log('--- PUBLICANDO ---');
  await ged.enviarDocumento({ descricao: documento.descricao, caminhoArquivo: 'fixtures/anexos/documento-valido.pdf' });
  await ged.irParaPaginaComDocumento(documento.descricao);
  await expect(ged.localizarLinha(documento.descricao)).toBeVisible();
  log('publicado OK');

  await pausa(30_000);

  // 2) excluir -> lixeira
  log('--- EXCLUINDO (para a lixeira) ---');
  await ged.irParaPaginaComDocumento(documento.descricao);
  const documentId = await ged.excluirDocumento(documento.descricao);
  log('excluido OK, documentId =', documentId);

  await pausa(30_000);

  // 3) lixeira: achar o item por paginação
  log('--- LIXEIRA: localizando item ---');
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
  log('item encontrado na lixeira');

  // 3a) inventário das ações disponíveis na linha
  const linha = checkbox.locator('xpath=ancestor::tr[1]');
  const titles = await linha.locator('[title]').evaluateAll(els => els.map(e => `${e.tagName}[title="${e.getAttribute('title')}"] onclick=${(e.getAttribute('onclick')||'').slice(0,120)}`));
  log('ACOES NA LINHA DA LIXEIRA:', titles);
  const botoesTopo = await page.locator('button:visible').evaluateAll(els => els.map(e => e.textContent.trim()).filter(Boolean));
  log('BOTOES VISIVEIS NA LIXEIRA:', botoesTopo);

  // 3b) "Esvaziar lixeira": abrir o modal SÓ para ler o texto, e CANCELAR
  log('--- ESVAZIAR LIXEIRA (só inspeção, vai CANCELAR) ---');
  await page.getByRole('button', { name: 'Esvaziar lixeira', exact: true }).click();
  await pausa(1500);
  const modal = page.locator('.modal:visible, [role="dialog"]:visible').first();
  if (await modal.count()) {
    log('MODAL ESVAZIAR:', (await modal.innerText()).replace(/\s+/g, ' ').slice(0, 600));
    const btns = await modal.locator('button:visible, a.btn:visible').evaluateAll(els => els.map(e => e.textContent.trim()));
    log('BOTOES DO MODAL:', btns);
    // cancela — NUNCA confirmar
    const cancelar = modal.locator('button, a.btn').filter({ hasText: /Cancelar|Fechar|Não/ }).first();
    await cancelar.click();
    await pausa(1000);
  } else {
    log('nenhum modal visivel apos clicar em Esvaziar lixeira');
    await page.keyboard.press('Escape');
  }

  await pausa(30_000);

  // 4) exclusão DEFINITIVA do NOSSO item (checkbox + botão/ícone da linha)
  log('--- EXCLUSAO DEFINITIVA do item proprio ---');
  // reencontra (o modal pode ter recarregado a lista)
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
  if (!(await checkbox.count())) throw new Error('item sumiu da lixeira antes da exclusao definitiva');
  const linha2 = checkbox.locator('xpath=ancestor::tr[1]');
  // tenta o ícone de excluir na própria linha
  const iconeExcluir = linha2.locator('[title*="xcluir"], [title*="eletar"], [title*="emover"]').first();
  if (await iconeExcluir.count()) {
    log('usando icone da linha:', await iconeExcluir.getAttribute('title'));
    await iconeExcluir.click();
  } else {
    // fallback: marca o checkbox e procura botão de excluir no topo
    await checkbox.check();
    const btnTopo = page.getByRole('button', { name: /Excluir|Remover|Apagar/ }).first();
    log('usando botao do topo:', await btnTopo.textContent());
    await btnTopo.click();
  }
  await pausa(1500);
  const modal2 = page.locator('.modal:visible, [role="dialog"]:visible').first();
  if (await modal2.count()) {
    log('MODAL EXCLUSAO DEFINITIVA:', (await modal2.innerText()).replace(/\s+/g, ' ').slice(0, 600));
    const confirmar = modal2.locator('button, a.btn').filter({ hasText: /Excluir|Confirmar|Sim|Remover/ }).first();
    await confirmar.click();
  }
  await pausa(3000);
  await expect(checkbox).toHaveCount(0, { timeout: 20_000 });
  log('item NAO esta mais na lixeira');

  // 5) confirma que não voltou para a pasta
  await ged.irParaRaizGarantido();
  await ged.abrirPasta('Meus Documentos');
  await ged.irParaPaginaComDocumento(documento.descricao, { tentativas: 1 });
  const aindaNaPasta = await ged.localizarLinha(documento.descricao).count();
  log('documento ainda na pasta apos exclusao definitiva?', aindaNaPasta > 0);

  await ged.irParaRaizGarantido();
  log('=== PROBE OK ===');
} catch (e) {
  log('!!! ERRO:', String(e).slice(0, 2000));
  try { await page.screenshot({ path: '/home/dev1/cassi-e2e/qa-probe-ged-erro.png', fullPage: true }); } catch {}
} finally {
  await browser.close();
}
