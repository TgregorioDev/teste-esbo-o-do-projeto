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
const reqs = [];
page.on('request', r => {
  const u = r.url();
  if (/process-management|processSearch|cancel|workflow\/api/i.test(u)) {
    reqs.push({ m: r.method(), u: u.replace(process.env.BASE_URL, ''), body: r.postData()?.slice(0, 800) });
  }
});
const resps = [];
page.on('response', async r => {
  const u = r.url();
  if (/process-management\/api\/v2\/requests\?/.test(u)) {
    try { resps.push({ u: u.replace(process.env.BASE_URL,''), status: r.status(), body: (await r.text()).slice(0, 6000) }); } catch {}
  }
});

// teste: acesso DIRETO por URL funciona para pageprocesssearch?
await page.goto('/portal/p/1/pageprocesssearch', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);
console.log('DIRETO URL:', page.url());
const is404 = page.url().includes('404') || (await page.getByText(/404|não encontrada/i).count()) > 0;
console.log('DIRETO caiu em 404?', is404);
if (is404) {
  await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: 'Processos', exact: true }).click();
  await page.getByRole('link', { name: 'Consultar Solicitações' }).click();
  await page.waitForTimeout(5000);
}

// marca "Todas as solicitações" e busca
reqs.length = 0; resps.length = 0;
await page.locator('#filter_requests_type_all').check();
await page.getByRole('button', { name: 'Buscar' }).click();
await page.waitForTimeout(6000);
console.log('--- REQ da busca (Todas) ---');
console.log(JSON.stringify(reqs, null, 1));
const parsed = resps.map(r => {
  let j; try { j = JSON.parse(r.body); } catch { return { u: r.u, raw: r.body.slice(0,300) }; }
  return { u: r.u, status: r.status, items: (j.items||[]).map(i => ({
    id: i.processInstanceId, proc: i.processId, state: i.status ?? i.stateDescription ?? i.state,
    requester: i.requester ? (i.requester.name || i.requester.id) : i.requester,
    desc: (i.description||'').slice(0,60), active: i.active, canceled: i.canceled
  })) };
});
console.log('--- RESP da busca ---');
console.log(JSON.stringify(parsed, null, 1));
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/consultar-resultados.png', fullPage: true });

// estrutura das linhas de resultado
const rows = await page.evaluate(() => {
  const vis = el => el.offsetParent !== null;
  const cands = [...document.querySelectorAll('table tbody tr, [class*="result"] li, [class*="request"]')].filter(vis).slice(0, 8);
  return cands.map(e => ({ tag: e.tagName, cls: e.className.toString().slice(0,80), text: e.textContent.trim().replace(/\s+/g,' ').slice(0,200) }));
});
console.log('--- ROWS ---');
console.log(JSON.stringify(rows, null, 1));
await b.close();
