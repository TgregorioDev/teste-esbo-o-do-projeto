import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
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

// estado ANTES via API
async function estado(id) {
  const r1 = await page.request.get(BASE + `/process-management/api/v2/requests/${id}`);
  const t1 = await r1.text();
  const r2 = await page.request.get(BASE + `/process-management/api/v2/requests?&initialProcessInstanceId=${id}&finalProcessInstanceId=${id}&initialStartDate=2026-07-01T00:00:00.000Z&finalStartDate=2026-08-27T23:59:59.000Z&expand=requester&expand=currentMovements&order=processInstanceId&page=1&pageSize=5`);
  const t2 = await r2.text();
  let item = null; try { item = JSON.parse(t2).items?.[0]; } catch {}
  return { single: { status: r1.status(), body: t1.slice(0,200) }, list: { status: r2.status(), item: item && { id: item.processInstanceId, status: item.status, active: item.active, mov: item.currentMovements?.map(m=>m.stateDescription||m.state||m.stateSequence) } } };
}
console.log('ANTES:', JSON.stringify(await estado(112300), null, 1));

const traffic = [];
page.on('request', r => {
  const u = r.url();
  if (!/\.(js|css|png|svg|woff2?|gif|jpg|ico)(\?|$)/.test(u) && !u.includes('google-analytics') && !/countUnread|picture|breadcrumb|getResumeTasks|nps\/|tenants\/|isadmin|isEditableProfile|usageFeedback|alertpopover|usepolicy|menus\?|rocketChat|permissions\/params/i.test(u))
    traffic.push({ m: r.method(), u: u.replace(BASE, ''), body: r.postData(), hdr: { 'content-type': r.headers()['content-type'] } });
});
const resps = [];
page.on('response', async r => {
  const u = r.url();
  const m = r.request().method();
  if (m !== 'GET' || /cancel/i.test(u)) {
    let body = ''; try { body = (await r.text()).slice(0, 2500); } catch {}
    if (!u.includes('google-analytics') && !/usageFeedback|alertpopover|usepolicy/.test(u))
      resps.push({ status: r.status(), m, u: u.replace(BASE, ''), body });
  }
});

await cancelBtn.click();
const drawerTa = page.locator('textarea[placeholder*="Motivo"], textarea').filter({ visible: true }).last();
await drawerTa.waitFor({ timeout: 15000 });

// dump do drawer
const drawer = await page.evaluate(() => {
  const ta = [...document.querySelectorAll('textarea')].filter(e => (e.placeholder||'').includes('Motivo'))[0];
  let root = ta; for (let i=0;i<8 && root && !/drawer|panel|slid|cancel/i.test(root.className);i++) root = root.parentElement;
  const cont = root || document.body;
  return {
    taInfo: { id: ta.id, name: ta.name, placeholder: ta.placeholder, required: ta.required, cls: ta.className.slice(0,80) },
    contCls: cont.className.toString().slice(0,120), contTag: cont.tagName,
    buttons: [...cont.querySelectorAll('button')].map(e => ({ id: e.id, disabled: e.disabled, cls: e.className.slice(0,60), text: e.textContent.trim().slice(0,40) })),
  };
});
console.log('--- DRAWER ---'); console.log(JSON.stringify(drawer, null, 1));

// motivo é obrigatório? tenta confirmar com textarea VAZIA
const confirm = page.locator('button.btn-primary', { hasText: 'Cancelar Solicitação' }).filter({ visible: true }).last();
console.log('confirm disabled com motivo vazio?', await confirm.isDisabled());
resps.length = 0; traffic.length = 0;
await confirm.click().catch(e => console.log('click vazio falhou:', e.message));
await page.waitForTimeout(3000);
const vazioMsg = await page.evaluate(() => {
  const vis = el => { const r = el.getBoundingClientRect(); return r.width>0&&r.height>0; };
  return [...document.querySelectorAll('.text-danger, .has-error, .help-block, [class*=error], [class*=toast], [class*=alert]')].filter(vis).map(e=>e.textContent.trim().replace(/\s+/g,' ').slice(0,150)).filter(Boolean).slice(0,5);
});
console.log('tentativa com motivo VAZIO → msgs:', JSON.stringify(vazioMsg), '| escritas disparadas:', JSON.stringify(resps));
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/motivo-vazio.png' });

// preenche o motivo e confirma de verdade
await drawerTa.fill('QA cancelamento automatizado - engenharia reversa do botão Cancelar Solicitação (Consultar Solicitações)');
resps.length = 0; traffic.length = 0;
await confirm.click();
await page.waitForTimeout(10000);
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/apos-cancelar-112300.png', fullPage: false });
console.log('--- ESCRITAS ---'); console.log(JSON.stringify(traffic.filter(t=>t.m!=='GET'), null, 1));
console.log('--- RESPOSTAS ---'); console.log(JSON.stringify(resps, null, 1));
fs.writeFileSync('/home/dev1/cassi-e2e/tmp-cancel/traffic-cancel-112300.json', JSON.stringify({ traffic, resps }, null, 1));

// estado DEPOIS
await page.waitForTimeout(3000);
console.log('DEPOIS:', JSON.stringify(await estado(112300), null, 1));
await b.close();
