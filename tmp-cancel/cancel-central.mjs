import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
dotenv.config({ path: '/home/dev1/cassi-e2e/.env.test', quiet: true });
const BASE = process.env.BASE_URL;
const ALVO = 112111;

const b = await chromium.launch();
const ctx = await b.newContext({
  baseURL: BASE,
  storageState: '/home/dev1/cassi-e2e/playwright/.auth/usuario.json',
  locale: 'pt-BR',
  viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();

// 1. verifica QA na justificativa via detalhe
await page.goto(`/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=${ALVO}`, { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'Cancelar Solicitação' }).first().waitFor({ timeout: 40000 });
await page.waitForTimeout(3000);
let qa = [];
for (const f of page.frames()) {
  const vals = await f.evaluate(() => [...document.querySelectorAll('input,textarea')].map(e=>e.value||'').filter(v=>/^QA\b/.test(v)).slice(0,3)).catch(()=>[]);
  qa.push(...vals);
}
console.log('QA em', ALVO, ':', JSON.stringify(qa));
if (!qa.length) { console.log('ABORTA: sem QA'); await b.close(); process.exit(2); }

// 2. Central de Tarefas → Minhas solicitações
await page.goto('/portal/p/1/pagecentraltask', { waitUntil: 'domcontentloaded' });
await page.getByRole('heading', { name: 'Central de tarefas' }).waitFor({ timeout: 40000 });
await page.getByRole('link', { name: 'Mais opções' }).click();
await page.getByRole('link', { name: /^Solicitações/ }).click();
await page.getByRole('link', { name: /^Minhas solicitações/ }).click();
const card = page.locator(`task-card-component[data-process-key^="${ALVO}."]`);
await card.waitFor({ timeout: 30000 });

const traffic = []; const resps = [];
page.on('request', r => {
  if (r.method() !== 'GET' && !r.url().includes('google-analytics') && !/usageFeedback|alertpopover|usepolicy/.test(r.url()))
    traffic.push({ m: r.method(), u: r.url().replace(BASE, ''), body: r.postData(), ct: r.headers()['content-type'] });
});
page.on('response', async r => {
  if (r.request().method() !== 'GET' && !r.url().includes('google-analytics') && !/usageFeedback|alertpopover|usepolicy/.test(r.url())) {
    let body=''; try { body=(await r.text()).slice(0,2000); } catch {}
    resps.push({ status: r.status(), u: r.url().replace(BASE,''), body });
  }
});

// 3. clica Cancelar no card
await card.getByRole('button', { name: 'Cancelar' }).click();
await page.waitForTimeout(3000);
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/central-modal-cancelar.png' });
// dump do que abriu (modal/drawer)
const dlg = await page.evaluate(() => {
  const vis = el => { const r = el.getBoundingClientRect(); return r.width>0&&r.height>0; };
  const cands = [...document.querySelectorAll('.modal, [role=dialog], .fluig-style-guide.container-modal, [class*=rightbar], [class*=drawer]')].filter(vis);
  return cands.map(m => ({
    cls: m.className.toString().slice(0,80),
    text: m.textContent.trim().replace(/\s+/g,' ').slice(0,300),
    fields: [...m.querySelectorAll('textarea, input')].filter(vis).map(e=>({tag:e.tagName,id:e.id,name:e.name,val:(e.value||'').slice(0,50)})),
    buttons: [...m.querySelectorAll('button')].filter(vis).map(e=>({id:e.id,text:e.textContent.trim().slice(0,40),cls:e.className.slice(0,50)})),
  }));
});
console.log('DIALOGO:', JSON.stringify(dlg, null, 1));

// 4. preenche motivo (se houver campo) e confirma
const taModal = page.locator('.modal:visible textarea, [role=dialog] textarea, #workflowview-detail-cancelText').filter({ visible: true }).first();
if (await taModal.count()) {
  await taModal.fill('QA cancelamento automatizado - engenharia reversa do botao Cancelar (Central de Tarefas) 26/08');
  console.log('motivo preenchido');
}
traffic.length = 0; resps.length = 0;
const btnConfirm = page.locator('.modal, [role=dialog]').filter({ visible: true }).last().locator('button', { hasText: /Confirmar|Sim|Cancelar/ }).last();
const btxt = await btnConfirm.textContent().catch(()=>null);
console.log('botão de confirmação:', btxt);
await btnConfirm.click({ timeout: 15000 }).catch(async e => {
  console.log('fallback #moviment-button:', e.message.split('\n')[0]);
  await page.locator('#moviment-button').click({ timeout: 15000 });
});
await page.waitForTimeout(10000);
console.log('--- ESCRITAS ---'); console.log(JSON.stringify(traffic, null, 1));
console.log('--- RESPOSTAS ---'); console.log(JSON.stringify(resps, null, 1));
fs.writeFileSync(`/home/dev1/cassi-e2e/tmp-cancel/traffic-central-${ALVO}.json`, JSON.stringify({ traffic, resps }, null, 1));
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/central-apos-cancelar.png' });

// 5. estado depois + card sumiu?
const cardAinda = await card.count();
console.log('card ainda na lista?', cardAinda);
const depois = await page.evaluate(async (id) => {
  const r = await fetch(`/process-management/api/v2/requests/${id}`);
  const j = await r.json().catch(()=>null);
  return j && { status: j.status, active: j.active, endDate: j.endDate };
}, ALVO);
console.log('DEPOIS:', JSON.stringify(depois));
await b.close();
