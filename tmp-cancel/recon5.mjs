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
  if (/api|rest|process|workflow|dataset/i.test(u) && !/\.(js|css|png|svg|woff|gif|jpg)/.test(u)) {
    reqs.push({ m: r.method(), u: u.replace(process.env.BASE_URL, '').slice(0,220), body: r.postData()?.slice(0, 1200) });
  }
});

await page.goto('/portal/p/1/pageprocesssearch', { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'Buscar' }).waitFor({ timeout: 30000 });
await page.locator('#filter_requests_type_all').check();
await page.locator('#filter_initialProcessInstanceId').fill('112300');
await page.getByRole('button', { name: 'Buscar' }).click();
await page.getByRole('cell', { name: '112300', exact: true }).first().waitFor({ timeout: 30000 }).catch(()=>{});
reqs.length = 0;

// clica na linha da 112300
const row = page.locator('table tbody tr', { hasText: '112300' }).first();
await row.click();
await page.waitForTimeout(8000);
console.log('URL após clique:', page.url());
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/detalhe-112300.png', fullPage: true });

// botões visíveis
const btns = await page.evaluate(() => {
  const vis = el => { const r = el.getBoundingClientRect(); return r.width>0 && r.height>0; };
  return [...document.querySelectorAll('button, a.btn, input[type=button], input[type=submit]')].filter(vis)
    .map(e => ({ tag: e.tagName, id: e.id, cls: e.className.toString().slice(0,80), text: (e.textContent||e.value||'').trim().replace(/\s+/g,' ').slice(0,60) }))
    .filter(x => x.text || x.id);
});
console.log('--- BOTÕES ---'); console.log(JSON.stringify(btns, null, 1));

// procura campo justificativa no formulário (pode estar em iframe)
for (const f of page.frames()) {
  const just = await f.evaluate(() => {
    const el = [...document.querySelectorAll('input,textarea')].find(e => /justif/i.test(e.name||'') || /justif/i.test(e.id||''));
    return el ? { frame: location.pathname, name: el.name||el.id, value: (el.value||'').slice(0,120) } : null;
  }).catch(()=>null);
  if (just) console.log('JUSTIFICATIVA:', JSON.stringify(just));
}

console.log('--- REQS do detalhe ---');
console.log(JSON.stringify(reqs.filter(r=>!/countUnread|picture|breadcrumb|menus\?|tenants|nps|usageFeedback|alertpopover|usepolicy|isadmin|isEditableProfile|rocketChat|Intelligence/i.test(r.u)), null, 1));

// clica em Cancelar Solicitação (se existir) só para ver o modal — NÃO confirma
const cancelBtn = page.getByRole('button', { name: /Cancelar Solicitação/i }).first();
if (await cancelBtn.count()) {
  reqs.length = 0;
  await cancelBtn.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/modal-cancelar.png' });
  const modal = await page.evaluate(() => {
    const vis = el => { const r = el.getBoundingClientRect(); return r.width>0 && r.height>0; };
    const m = [...document.querySelectorAll('.modal, [role=dialog], .fluig-style-modal')].filter(vis)[0];
    if (!m) return null;
    return {
      text: m.textContent.trim().replace(/\s+/g,' ').slice(0,500),
      fields: [...m.querySelectorAll('input,textarea,select')].map(e=>({tag:e.tagName,id:e.id,name:e.name,ph:e.placeholder,required:e.required})),
      buttons: [...m.querySelectorAll('button')].map(e=>({id:e.id,text:e.textContent.trim().slice(0,40)}))
    };
  });
  console.log('--- MODAL ---'); console.log(JSON.stringify(modal, null, 1));
  console.log('--- REQS pós-clique (sem confirmar) ---'); console.log(JSON.stringify(reqs, null, 1));
} else {
  console.log('BOTÃO Cancelar Solicitação NÃO encontrado');
}
await b.close();
