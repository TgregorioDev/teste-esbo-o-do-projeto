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
  if (/\/(api|ecm|process|bpm|workflow)/i.test(u) && !/\.(js|css|png|svg|woff|gif)/.test(u)) {
    reqs.push({ m: r.method(), u: u.replace(process.env.BASE_URL, ''), body: r.postData()?.slice(0, 500) });
  }
});

// navegação SPA: home -> menu Processos -> Consultar Solicitações
await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
await page.getByRole('link', { name: 'Processos', exact: true }).click();
await page.getByRole('link', { name: 'Consultar Solicitações' }).click();
await page.waitForTimeout(5000);
console.log('URL:', page.url());
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/consultar-filtro.png' });

// dump dos campos de filtro
const form = await page.evaluate(() => {
  const vis = el => el.offsetParent !== null;
  const inputs = [...document.querySelectorAll('input,select,textarea,button')].filter(vis).map(e => ({
    tag: e.tagName, type: e.type, id: e.id, name: e.name, placeholder: e.placeholder,
    label: e.labels?.[0]?.textContent?.trim(), text: e.tagName==='BUTTON'||e.tagName==='SELECT' ? e.textContent.trim().replace(/\s+/g,' ').slice(0,120) : undefined,
    value: e.value?.slice?.(0,40)
  }));
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,legend,label')].filter(vis).map(e=>e.textContent.trim().replace(/\s+/g,' ')).filter(Boolean);
  return { headings: headings.slice(0,40), inputs };
});
console.log(JSON.stringify(form, null, 1));
console.log('--- REQS ---');
console.log(JSON.stringify(reqs, null, 1));
await b.close();
