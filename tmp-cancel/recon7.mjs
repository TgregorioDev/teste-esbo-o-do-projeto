import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config({ path: '/home/dev1/cassi-e2e/.env.test', quiet: true });

const b = await chromium.launch();
const ctx = await b.newContext({
  baseURL: process.env.BASE_URL,
  storageState: '/home/dev1/cassi-e2e/playwright/.auth/usuario.json',
  locale: 'pt-BR',
  viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();
await page.goto('/portal/p/1/pageprocesssearch', { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'Buscar' }).waitFor({ timeout: 30000 });
await page.locator('#filter_requests_type_all').check();
await page.locator('#filter_initialProcessInstanceId').fill('112300');
await page.getByRole('button', { name: 'Buscar' }).click();
await page.waitForTimeout(5000);

const popupP = ctx.waitForEvent('page', { timeout: 15000 }).catch(() => null);
await page.locator('tr[data-process-instance="112300"] td').first().click();
let detail = await popupP;
if (!detail) { console.log('sem popup; url atual:', page.url()); detail = page; }
else { console.log('POPUP aberto:', detail.url()); }

const reqs = [];
detail.on('request', r => {
  const u = r.url();
  if (!/\.(js|css|png|svg|woff|gif|jpg)/.test(u) && !u.includes('google-analytics'))
    reqs.push({ m: r.method(), u: u.replace(process.env.BASE_URL, '').slice(0,250), body: r.postData()?.slice(0, 1200) });
});
await detail.waitForLoadState('domcontentloaded').catch(()=>{});
await detail.waitForTimeout(12000);
console.log('URL final do detalhe:', detail.url());
await detail.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/detalhe-112300.png', fullPage: true }).catch(e=>console.log('shot err', e.message));

const btns = await detail.evaluate(() => {
  const vis = el => { const r = el.getBoundingClientRect(); return r.width>0 && r.height>0; };
  return [...document.querySelectorAll('button, a.btn, input[type=button], input[type=submit], [data-action]')].filter(vis)
    .map(e => ({ tag: e.tagName, id: e.id, action: e.getAttribute('data-action'), cls: e.className.toString().slice(0,70), text: (e.textContent||e.value||'').trim().replace(/\s+/g,' ').slice(0,60) }))
    .filter(x => x.text || x.id || x.action);
}).catch(e=>('evalerr '+e.message));
console.log('--- BOTÕES do detalhe ---'); console.log(JSON.stringify(btns, null, 1));
console.log('--- FRAMES ---', detail.frames().map(f=>f.url().replace(process.env.BASE_URL,'').slice(0,120)));
// justificativa QA?
for (const f of detail.frames()) {
  const just = await f.evaluate(() => {
    const els = [...document.querySelectorAll('input,textarea')].filter(e => /justif/i.test(e.name||'') || /justif/i.test(e.id||''));
    return els.map(el => ({ name: el.name||el.id, value: (el.value||'').slice(0,150) }));
  }).catch(()=>null);
  if (just && just.length) console.log('JUSTIFICATIVA:', JSON.stringify(just));
}
await b.close();
