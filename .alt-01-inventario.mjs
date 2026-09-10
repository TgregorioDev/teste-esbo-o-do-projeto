import { chromium } from '@playwright/test';
import dotenv from 'dotenv'; dotenv.config({ path: '.env.test', quiet: true });
import fs from 'node:fs';
const b = await chromium.launch();
const ctx = await b.newContext({ baseURL: process.env.BASE_URL, storageState: 'playwright/.auth/usuario.json', locale: 'pt-BR' });
const p = await ctx.newPage();
await p.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3000);
console.log('title:', await p.title());
const out = {};
async function get(url) {
  return p.evaluate(async (u) => { const r = await fetch(u, { credentials: 'include' }); const t = await r.text(); return { status: r.status, body: t.slice(0, 200000) }; }, url);
}
// 1. ERP service
out.erp = await get('/api/public/2.0/authorize/client/test?serviceCode=apiRESTProtheusCompras');
console.log('ERP', out.erp.status, out.erp.body.slice(0, 400));
for (const sc of ['apiRESTProtheusContratos','apiRESTProtheus','apiRESTProtheusRH','apiRESTProtheusFaturamento']) {
  const r = await get('/api/public/2.0/authorize/client/test?serviceCode=' + sc);
  console.log('svc', sc, r.body.slice(0, 200));
}
// 2. Pages: try WCM APIs
const pageApis = [
  '/api/public/2.0/pages/listAll',
  '/api/public/2.0/pages/list',
  '/api/public/wcm/pages',
  '/portal/api/rest/wcm/page/list',
  '/portal/api/rest/wcm/page/findAll',
  '/api/public/2.0/menus/list',
  '/api/public/wcm/menu',
  '/api/public/2.0/portal/pages',
  '/api/public/2.0/pageadmin/pages',
  '/portal/api/rest/wcm/menu/portal',
  '/api/public/2.0/pages/findAllPages',
  '/api/public/2.0/pages/community',
  '/api/public/2.0/pages/tenant/list',
  '/api/public/2.0/pages/tenant/listAll',
  '/api/public/2.0/community/pages',
];
out.pages = {};
for (const u of pageApis) { const r = await get(u); out.pages[u] = r; console.log('PAGE-API', r.status, u, r.body.slice(0, 160).replace(/\s+/g,' ')); }
// 3. menu links from home DOM
out.menuLinks = await p.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => ({ href: a.getAttribute('href'), text: (a.textContent||'').trim().slice(0,60) })).filter(x => /portal\/p\/1\//.test(x.href)));
console.log('MENU LINKS', JSON.stringify([...new Set(out.menuLinks.map(x=>x.href))]));
fs.writeFileSync('.alt-01-out.json', JSON.stringify(out, null, 1));
await b.close();
