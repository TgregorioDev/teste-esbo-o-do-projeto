import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
dotenv.config({ path: '/home/dev1/cassi-e2e/.env.test', quiet: true });
const BASE = process.env.BASE_URL;

const b = await chromium.launch();
const ctx = await b.newContext({
  baseURL: BASE,
  storageState: '/home/dev1/cassi-e2e/playwright/.auth/usuario.json',
  locale: 'pt-BR', viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();
const traffic = []; const resps = [];
page.on('request', r => {
  const u = r.url();
  if (r.method() !== 'GET' && !u.includes('google-analytics') && !/usageFeedback|alertpopover|usepolicy|session\/setAttribute/.test(u))
    traffic.push({ m: r.method(), u: u.replace(BASE, '').slice(0,300), body: r.postData()?.slice(0,800), ct: r.headers()['content-type'] });
});
page.on('response', async r => {
  if (r.request().method() !== 'GET' && !r.url().includes('google-analytics') && !/usageFeedback|alertpopover|usepolicy|session\/setAttribute/.test(r.url())) {
    let body=''; try { body=(await r.text()).slice(0,2000); } catch {}
    resps.push({ status: r.status(), u: r.url().replace(BASE,'').slice(0,300), body });
  }
});
page.on('dialog', async d => { console.log('DIALOG NATIVO:', d.type(), d.message()); await d.accept(); });

await page.goto('/portal/p/1/pageprocessdelete', { waitUntil: 'domcontentloaded' });
await page.locator('#ecm-processDelete-selectProcess').waitFor({ timeout: 40000 });
await page.waitForTimeout(3000);
await page.locator('#ecm-processDelete-initialInstance').fill('112302');
await page.locator('#ecm-processDelete-finalInstance').fill('112302');
await page.locator('#ecm-processDelete-selectProcess').selectOption('wf_solicitacao_compras');
await page.getByRole('button', { name: 'Pesquisar' }).click();
const cb = page.locator('#jqg_ecm-processDelete-table_112302');
await cb.waitFor({ timeout: 30000 });
await cb.check();
traffic.length = 0; resps.length = 0;
await page.locator('#panel-button-wcmid4-0').click();
await page.waitForTimeout(4000);
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/eliminar-confirmacao.png' });
// modal de confirmação custom?
const modal = await page.evaluate(() => {
  const vis = el => { const r = el.getBoundingClientRect(); return r.width>0&&r.height>0; };
  const m = [...document.querySelectorAll('.modal, [role=dialog], .fluig-style-guide.container-modal, [class*=message]')].filter(vis);
  return m.map(x => ({ cls: x.className.toString().slice(0,80), text: x.textContent.trim().replace(/\s+/g,' ').slice(0,300),
    buttons: [...x.querySelectorAll('button')].filter(vis).map(e=>({id:e.id, text:e.textContent.trim().slice(0,30), attrs: [...e.attributes].map(a=>a.name).filter(n=>n.startsWith('data-'))})) }));
});
console.log('MODAL CONF:', JSON.stringify(modal, null, 1));
// confirma
const yesBtn = page.locator('.fluig-style-guide.container-modal button, .modal:visible button').filter({ hasText: /Sim|Confirmar|OK|Eliminar/i }).last();
if (await yesBtn.count()) { console.log('clicando:', await yesBtn.textContent()); await yesBtn.click(); }
await page.waitForTimeout(10000);
console.log('--- ESCRITAS ---'); console.log(JSON.stringify(traffic, null, 1));
console.log('--- RESPOSTAS ---'); console.log(JSON.stringify(resps, null, 1));
fs.writeFileSync('/home/dev1/cassi-e2e/tmp-cancel/traffic-eliminar-112302.json', JSON.stringify({ traffic, resps }, null, 1));
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/eliminar-apos.png' });

// existe ainda?
const depois = await page.evaluate(async () => {
  const r = await fetch('/process-management/api/v2/requests/112302');
  return { status: r.status, body: (await r.text()).slice(0, 250) };
});
console.log('GET /requests/112302 DEPOIS:', JSON.stringify(depois));
await b.close();
