import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
dotenv.config({ path: '/home/dev1/cassi-e2e/.env.test', quiet: true });
const BASE = process.env.BASE_URL;

const b = await chromium.launch();
const ctx = await b.newContext({
  baseURL: BASE,
  storageState: '/home/dev1/cassi-e2e/playwright/.auth/usuario.json',
  locale: 'pt-BR',
  viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();

// 1. acesso DIRETO ao detalhe funciona?
await page.goto('/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=112300', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(10000);
console.log('URL direto:', page.url());
const cancelBtn = page.getByRole('button', { name: 'Cancelar Solicitação' });
console.log('botão presente no acesso direto?', await cancelBtn.count());

// 2. confirma QA na justificativa (varre iframes por valor começando com QA)
let qaOk = false;
for (const f of page.frames()) {
  const vals = await f.evaluate(() =>
    [...document.querySelectorAll('input,textarea')].map(e => e.value || '').filter(v => /^QA\b/.test(v)).slice(0, 5)
  ).catch(() => []);
  if (vals.length) { qaOk = true; console.log('Campos com prefixo QA:', JSON.stringify(vals)); }
}
console.log('QA confirmado?', qaOk);
if (!qaOk) { console.log('ABORTANDO: sem prefixo QA'); await b.close(); process.exit(2); }

// 3. captura de rede ampla
const traffic = [];
page.on('request', r => {
  const u = r.url();
  if (/^https?/.test(u) && !/\.(js|css|png|svg|woff2?|gif|jpg|ico)(\?|$)/.test(u) && !u.includes('google-analytics'))
    traffic.push({ t: Date.now(), m: r.method(), u: u.replace(BASE, ''), body: r.postData() });
});
page.on('response', async r => {
  const u = r.url();
  if (/cancel/i.test(u) || (r.request().method() !== 'GET' && /api|rest|ecm|process/i.test(u))) {
    let body = ''; try { body = (await r.text()).slice(0, 2000); } catch {}
    traffic.push({ t: Date.now(), RESP: r.status(), u: u.replace(BASE, ''), body });
  }
});

// 4. clica em Cancelar Solicitação
traffic.length = 0;
await cancelBtn.click();
await page.waitForTimeout(3000);
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/modal-cancelar-112300.png' });
const modal = await page.evaluate(() => {
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const m = [...document.querySelectorAll('.modal, [role=dialog], .fluig-style-modal, .swal2-popup')].filter(vis)[0];
  if (!m) return null;
  return {
    text: m.textContent.trim().replace(/\s+/g, ' ').slice(0, 600),
    fields: [...m.querySelectorAll('input,textarea,select')].filter(vis).map(e => ({ tag: e.tagName, id: e.id, name: e.name, ph: e.placeholder, required: e.required })),
    buttons: [...m.querySelectorAll('button')].filter(vis).map(e => ({ id: e.id, cls: e.className.slice(0, 50), text: e.textContent.trim().slice(0, 40) })),
  };
});
console.log('--- MODAL ---'); console.log(JSON.stringify(modal, null, 1));

// 5. preenche textarea (se houver) e confirma
const dlg = page.locator('.modal, [role=dialog], .fluig-style-modal, .swal2-popup').filter({ visible: true }).first();
const ta = dlg.locator('textarea, input[type=text]').first();
if (await ta.count() && await ta.isVisible()) {
  await ta.fill('QA cancelamento automatizado - engenharia reversa 26/08');
  console.log('textarea preenchida');
}
const confirmBtn = dlg.getByRole('button', { name: /^(Confirmar|Sim|OK|Cancelar Solicitação|Salvar)$/i }).first();
console.log('confirm candidato:', await confirmBtn.count() ? await confirmBtn.textContent() : 'NENHUM');
if (!(await confirmBtn.count())) { console.log('sem botão de confirmação claro — parando antes de confirmar'); await b.close(); process.exit(3); }
await confirmBtn.click();
await page.waitForTimeout(8000);
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/apos-cancelar-112300.png' });

fs.writeFileSync('/home/dev1/cassi-e2e/tmp-cancel/traffic-cancel-112300.json', JSON.stringify(traffic, null, 1));
console.log('--- TRÁFEGO (escritas e cancel) ---');
console.log(JSON.stringify(traffic.filter(x => x.RESP || x.m !== 'GET' || /cancel/i.test(x.u)), null, 1));

// 6. verifica estado via API
const check = await page.request.get(BASE + '/process-management/api/v2/requests/112300');
console.log('GET /requests/112300 →', check.status());
const cj = await check.json().catch(() => null);
if (cj) console.log(JSON.stringify({ id: cj.processInstanceId, status: cj.status, active: cj.active, requester: cj.requester }, null, 1));
await b.close();
