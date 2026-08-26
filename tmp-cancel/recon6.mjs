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
const html = await page.evaluate(() => {
  const tr = [...document.querySelectorAll('table tbody tr')].find(e => e.textContent.includes('112300'));
  return tr ? tr.outerHTML : 'not found';
});
console.log(html.slice(0, 4000));
// também o thead e atributos da tabela
const thead = await page.evaluate(() => document.querySelector('table thead')?.outerHTML?.slice(0,1500));
console.log('--- THEAD ---'); console.log(thead);
await b.close();
