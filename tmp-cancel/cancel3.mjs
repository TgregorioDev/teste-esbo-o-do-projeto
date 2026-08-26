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
await page.goto('/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=112300', { waitUntil: 'domcontentloaded' });
const cancelBtn = page.getByRole('button', { name: 'Cancelar Solicitação' });
await cancelBtn.waitFor({ timeout: 40000 });

// estado ANTES via fetch no contexto da página
const estado = (id) => page.evaluate(async (id) => {
  const r = await fetch(`/process-management/api/v2/requests?&initialProcessInstanceId=${id}&finalProcessInstanceId=${id}&initialStartDate=2026-07-01T00:00:00.000Z&finalStartDate=2026-08-27T23:59:59.000Z&expand=requester&expand=currentMovements&order=processInstanceId&page=1&pageSize=5`);
  const j = await r.json().catch(()=>null);
  const it = j?.items?.[0];
  const r2 = await fetch(`/process-management/api/v2/requests/${id}`);
  return { list: it && { status: it.status, active: it.active }, singleStatus: r2.status, single: (await r2.text()).slice(0,300) };
}, id);
console.log('ANTES:', JSON.stringify(await estado(112300), null, 1));

await cancelBtn.click();
await page.waitForTimeout(4000);
// todos os textareas de todos os frames
for (const f of page.frames()) {
  const tas = await f.evaluate(() => {
    const vis = el => { const r = el.getBoundingClientRect(); return r.width>0 && r.height>0; };
    return [...document.querySelectorAll('textarea, input[type=text]')].filter(vis).map(e => ({
      tag: e.tagName, id: e.id, name: e.name, ph: e.placeholder, cls: e.className.toString().slice(0,80),
      ariaLabel: e.getAttribute('aria-label'), val: (e.value||'').slice(0,40)
    }));
  }).catch(()=>[]);
  if (tas.length) console.log('FRAME', f.url().replace(BASE,'').slice(0,80), JSON.stringify(tas, null, 1));
}
// botões visíveis agora
const btns = await page.evaluate(() => {
  const vis = el => { const r = el.getBoundingClientRect(); return r.width>0 && r.height>0; };
  return [...document.querySelectorAll('button')].filter(vis).map(e => ({ id: e.id, disabled: e.disabled, cls: e.className.slice(0,70), text: e.textContent.trim().replace(/\s+/g,' ').slice(0,40) }));
});
console.log('BOTÕES:', JSON.stringify(btns, null, 1));
// html do drawer (elemento que contém o heading Cancelar Solicitação)
const dHtml = await page.evaluate(() => {
  const h = [...document.querySelectorAll('*')].find(e => e.children.length===0 && e.textContent.trim()==='Cancelar Solicitação' && e.closest('button')===null);
  let root = h; for (let i=0;i<10 && root && root.parentElement && root.parentElement.querySelectorAll('textarea,input').length===0;i++) root = root.parentElement;
  root = root?.parentElement || root;
  return root ? root.outerHTML.slice(0, 3500) : 'nao achei';
});
console.log('DRAWER HTML:', dHtml);
await b.close();
