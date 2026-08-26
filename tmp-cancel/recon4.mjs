import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
dotenv.config({ path: '/home/dev1/cassi-e2e/.env.test', quiet: true });

const b = await chromium.launch();
const ctx = await b.newContext({
  baseURL: process.env.BASE_URL,
  storageState: '/home/dev1/cassi-e2e/playwright/.auth/usuario.json',
  locale: 'pt-BR',
  viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();
const reqs = [];
page.on('request', r => {
  const u = r.url();
  if (/process-management|processSearch|cancel|workflow|ecm\/api/i.test(u) && !/\.(js|css|png|svg|woff)/.test(u)) {
    reqs.push({ m: r.method(), u: u.replace(process.env.BASE_URL, ''), body: r.postData()?.slice(0, 1500) });
  }
});
let searchJson = null;
page.on('response', async r => {
  if (/process-management\/api\/v2\/requests\?/.test(r.url())) {
    try { searchJson = JSON.parse(await r.text()); } catch {}
  }
});

await page.goto('/portal/p/1/pageprocesssearch', { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'Buscar' }).waitFor({ timeout: 30000 });
await page.locator('#filter_requests_type_all').check();
await page.locator('#filter_initialProcessInstanceId').fill('112300');
await page.getByRole('button', { name: 'Buscar' }).click();
await page.waitForTimeout(6000);
fs.writeFileSync('/home/dev1/cassi-e2e/tmp-cancel/busca-112300.json', JSON.stringify(searchJson, null, 1));
const items = (searchJson?.items || []).map(i => ({
  id: i.processInstanceId, proc: i.processId, active: i.active,
  status: i.status, state: i.stateDescription,
  requester: i.requester?.name, req_login: i.requester?.login,
  desc: (i.description || '').slice(0, 80),
}));
console.log('hasNext:', searchJson?.hasNext, 'total items:', items.length);
console.log(JSON.stringify(items, null, 1));

// abre a primeira linha visível de wf_solicitacao_compras da automação, se houver
const rowsTxt = await page.evaluate(() =>
  [...document.querySelectorAll('table tbody tr')].filter(e=>e.offsetParent!==null).map((e,i)=>({ i, text: e.textContent.trim().replace(/\s+/g,' ').slice(0,180) }))
);
console.log('--- ROWS ---'); console.log(JSON.stringify(rowsTxt, null, 1));
await b.close();
