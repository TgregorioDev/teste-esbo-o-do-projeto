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
const cancelBtn = page.getByRole('button', { name: 'Cancelar Solicitação' }).first();
await cancelBtn.waitFor({ timeout: 40000 });
await page.waitForTimeout(3000);

const traffic = []; const resps = [];
page.on('request', r => {
  const u = r.url();
  if (r.method() !== 'GET' && !u.includes('google-analytics') && !/usageFeedback|alertpopover|usepolicy/.test(u))
    traffic.push({ m: r.method(), u: u.replace(BASE, ''), body: r.postData(), ct: r.headers()['content-type'] });
});
page.on('response', async r => {
  const u = r.url(); const m = r.request().method();
  if ((m !== 'GET' || /cancel/i.test(u)) && !u.includes('google-analytics') && !/usageFeedback|alertpopover|usepolicy/.test(u)) {
    let body = ''; try { body = (await r.text()).slice(0, 2500); } catch {}
    resps.push({ status: r.status(), m, u: u.replace(BASE, ''), body });
  }
});

await cancelBtn.click();
const ta = page.locator('#workflowview-detail-cancelText');
await ta.waitFor({ timeout: 15000 });

// fecha modal de alerta se estiver aberto (residual improvável em sessão nova, mas por garantia)
async function fecharAlerta() {
  const m = page.locator('.fluig-style-guide.container-modal').filter({ visible: true }).first();
  if (await m.count() && await m.isVisible().catch(()=>false)) {
    console.log('ALERTA:', (await m.textContent()).trim().replace(/\s+/g,' ').slice(0,200));
    const okb = m.locator('button').last();
    await okb.click().catch(()=>{});
    await page.waitForTimeout(1000);
  }
}
await fecharAlerta();

await ta.fill('QA cancelamento automatizado - engenharia reversa do botao Cancelar Solicitacao (Consultar Solicitacoes) 26/08');
traffic.length = 0; resps.length = 0;
await page.locator('#moviment-button').click({ timeout: 15000 });
await page.waitForTimeout(12000);
console.log('--- ESCRITAS ---'); console.log(JSON.stringify(traffic, null, 1));
console.log('--- RESPOSTAS ---'); console.log(JSON.stringify(resps, null, 1));
fs.writeFileSync('/home/dev1/cassi-e2e/tmp-cancel/traffic-cancel-112300.json', JSON.stringify({ traffic, resps }, null, 1));
console.log('URL agora:', page.url());
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/apos-cancelar-112300.png' });
const toasts = await page.evaluate(() => {
  const vis = el => { const r = el.getBoundingClientRect(); return r.width>0&&r.height>0; };
  return [...document.querySelectorAll('[class*=toast], [class*=alert-]')].filter(vis).map(e=>e.textContent.trim().replace(/\s+/g,' ').slice(0,150)).filter(Boolean).slice(0,5);
});
console.log('toasts:', JSON.stringify(toasts));

const depois = await page.evaluate(async () => {
  const r = await fetch(`/process-management/api/v2/requests?&initialProcessInstanceId=112300&finalProcessInstanceId=112300&initialStartDate=2026-07-01T00:00:00.000Z&finalStartDate=2026-08-27T23:59:59.000Z&expand=currentMovements&order=processInstanceId&page=1&pageSize=5`);
  const j = await r.json().catch(()=>null);
  const it = j?.items?.[0];
  const r2 = await fetch('/process-management/api/v2/requests/112300');
  const j2 = await r2.json().catch(()=>null);
  return { list: it && { status: it.status, active: it.active, mov: it.currentMovements?.map(m=>m.stateDescription||m.state) }, single: j2 && { status: j2.status, active: j2.active, endDate: j2.endDate } };
});
console.log('DEPOIS:', JSON.stringify(depois, null, 1));
await b.close();
