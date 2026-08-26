import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
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
await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
await page.getByRole('link', { name: 'Processos', exact: true }).waitFor({ timeout: 30000 });
console.log('home ok, url=', page.url());

// abre o flyout Processos
await page.getByRole('link', { name: 'Processos', exact: true }).click();
await page.waitForTimeout(2000);

// dump de todos os links visíveis no flyout/painel
const links = await page.evaluate(() => {
  return [...document.querySelectorAll('a')]
    .filter(a => a.offsetParent !== null)
    .map(a => ({ text: a.textContent.trim().replace(/\s+/g,' ').slice(0,80), href: a.getAttribute('href'), cls: a.className.slice(0,60), id: a.id }))
    .filter(x => x.text);
});
console.log(JSON.stringify(links, null, 1));
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/menu-processos.png', fullPage: false });
await b.close();
