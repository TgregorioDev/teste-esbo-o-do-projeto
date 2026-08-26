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
  if (r.method() !== 'GET' && !u.includes('google-analytics') && !/usageFeedback|alertpopover|usepolicy|session\/setAttribute|partial/.test(u))
    traffic.push({ m: r.method(), u: u.replace(BASE, '').slice(0,300), body: r.postData()?.slice(0,800), ct: r.headers()['content-type'] });
});
page.on('response', async r => {
  if (r.request().method() !== 'GET' && !r.url().includes('google-analytics') && !/usageFeedback|alertpopover|usepolicy|session\/setAttribute|partial/.test(r.url())) {
    let body=''; try { body=(await r.text()).slice(0,2000); } catch {}
    resps.push({ status: r.status(), u: r.url().replace(BASE,'').slice(0,300), body });
  }
});

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
await page.locator('#panel-button-wcmid4-0').click();
await page.getByText('Confirmar exclusão?').waitFor({ timeout: 15000 });
// dump da estrutura do messageBox
const boxHtml = await page.evaluate(() => {
  const t = [...document.querySelectorAll('*')].find(e => e.children.length===0 && e.textContent.trim()==='Confirmar exclusão?');
  let root = t; for (let i=0;i<8 && root && !root.querySelector('button');i++) root = root.parentElement;
  return root?.outerHTML?.slice(0,2000);
});
console.log('BOX:', boxHtml);
traffic.length = 0; resps.length = 0;
// o botão Confirmar do dialog é o mais recente/último visível
const confirmDlg = page.locator('button:visible', { hasText: 'Confirmar' }).last();
await confirmDlg.click();
await page.waitForTimeout(12000);
console.log('--- ESCRITAS ---'); console.log(JSON.stringify(traffic, null, 1));
console.log('--- RESPOSTAS ---'); console.log(JSON.stringify(resps, null, 1));
fs.writeFileSync('/home/dev1/cassi-e2e/tmp-cancel/traffic-eliminar-112302.json', JSON.stringify({ traffic, resps }, null, 1));
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/eliminar-apos.png' });
const depois = await page.evaluate(async () => {
  const r = await fetch('/process-management/api/v2/requests/112302');
  return { status: r.status, body: (await r.text()).slice(0, 250) };
});
console.log('GET /requests/112302 DEPOIS:', JSON.stringify(depois));
// e no grid?
const gridDepois = await page.evaluate(() => [...document.querySelectorAll('table tbody tr')].map(e=>e.textContent.trim().replace(/\s+/g,' ')).filter(Boolean));
console.log('grid depois:', JSON.stringify(gridDepois));
await b.close();
