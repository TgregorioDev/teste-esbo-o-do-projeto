import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config({ path: '/home/dev1/cassi-e2e/.env.test', quiet: true });
const BASE = process.env.BASE_URL;

const b = await chromium.launch();
const ctx = await b.newContext({
  baseURL: BASE,
  storageState: '/home/dev1/cassi-e2e/playwright/.auth/usuario.json',
  locale: 'pt-BR', viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();

// A) solicitação de OUTRO usuário: botão aparece?
await page.goto('/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=112328', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(12000);
const btnOutro = await page.getByRole('button', { name: 'Cancelar Solicitação' }).count();
const btnMov = await page.getByRole('button', { name: 'Movimentar' }).count();
const bodyTxt = await page.evaluate(() => document.body.innerText.replace(/\s+/g,' ').slice(0, 300));
console.log('112328 (solicitante Geise): botão Cancelar?', btnOutro, '| Movimentar?', btnMov);
console.log('trecho da página:', bodyTxt);
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/detalhe-112328-outro-usuario.png' });

// B) Eliminar Solicitações
const reqs = [];
page.on('request', r => {
  const u = r.url();
  if (/api|rest/.test(u) && !/\.(js|css|png|svg|woff2?|gif|jpg|ico)(\?|$)/.test(u) && !u.includes('google-analytics') && !/countUnread|picture|breadcrumb|nps|tenants|isadmin|isEditable|usageFeedback|alertpopover|usepolicy|menus\?|rocketChat|permissions/.test(u))
    reqs.push({ m: r.method(), u: u.replace(BASE, '').slice(0,250), body: r.postData()?.slice(0,400) });
});
await page.goto('/portal/p/1/pageprocessdelete', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);
console.log('URL:', page.url());
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/eliminar-filtro.png', fullPage: true });
const form = await page.evaluate(() => {
  const vis = el => el.offsetParent !== null;
  return {
    headings: [...document.querySelectorAll('h1,h2,h3,h4,legend,label')].filter(vis).map(e=>e.textContent.trim().replace(/\s+/g,' ')).filter(Boolean).slice(0,30),
    inputs: [...document.querySelectorAll('input,select,textarea,button')].filter(vis).map(e => ({
      tag: e.tagName, type: e.type, id: e.id, ph: e.placeholder,
      text: ['BUTTON','SELECT'].includes(e.tagName) ? e.textContent.trim().replace(/\s+/g,' ').slice(0,100) : undefined,
      value: e.value?.slice?.(0,30), checked: e.checked
    })),
  };
});
console.log(JSON.stringify(form, null, 1));
console.log('REQS da tela:', JSON.stringify(reqs, null, 1));
await b.close();
