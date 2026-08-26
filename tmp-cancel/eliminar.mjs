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
  if (/processdelete|deleteInstance|process-management|workflow/i.test(u) && !/\.(js|css|png|svg|woff2?)(\?|$)/.test(u))
    traffic.push({ m: r.method(), u: u.replace(BASE, '').slice(0,300), body: r.postData()?.slice(0,800) });
});
page.on('response', async r => {
  if (/processdelete|deleteInstance/i.test(r.url())) {
    let body=''; try { body=(await r.text()).slice(0,2000); } catch {}
    resps.push({ status: r.status(), m: r.request().method(), u: r.url().replace(BASE,'').slice(0,300), body });
  }
});
await page.goto('/portal/p/1/pageprocessdelete', { waitUntil: 'domcontentloaded' });
await page.locator('#ecm-processDelete-selectProcess').waitFor({ timeout: 40000 });
await page.waitForTimeout(3000);

await page.locator('#ecm-processDelete-initialInstance').fill('112302');
await page.locator('#ecm-processDelete-finalInstance').fill('112302');
await page.locator('#ecm-processDelete-selectProcess').selectOption('wf_solicitacao_compras').catch(async e => {
  console.log('selectOption por value falhou:', e.message.split('\n')[0]);
  await page.locator('#ecm-processDelete-selectProcess').selectOption({ label: 'Solicitação de Compras' });
});
traffic.length = 0; resps.length = 0;
await page.getByRole('button', { name: 'Pesquisar' }).click();
await page.waitForTimeout(6000);
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/eliminar-resultado.png', fullPage: true });
console.log('REQS pesquisa:', JSON.stringify(traffic, null, 1));
console.log('RESPS pesquisa:', JSON.stringify(resps, null, 1));

// estrutura do resultado
const grid = await page.evaluate(() => {
  const vis = el => el.offsetParent !== null;
  return {
    rows: [...document.querySelectorAll('table tbody tr')].filter(vis).map(e=>({ text: e.textContent.trim().replace(/\s+/g,' ').slice(0,180), html: e.innerHTML.slice(0,400) })).slice(0,5),
    buttons: [...document.querySelectorAll('button, input[type=button]')].filter(vis).map(e=>({ id: e.id, text: (e.textContent||e.value||'').trim().slice(0,50), cls: e.className.toString().slice(0,60) })),
    checks: [...document.querySelectorAll('input[type=checkbox]')].filter(vis).map(e=>({ id: e.id, cls: e.className.slice(0,50), checked: e.checked })),
  };
});
console.log('GRID:', JSON.stringify(grid, null, 1));
await b.close();
