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
  locale: 'pt-BR', viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();
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
await card.getByRole('button', { name: 'Cancelar' }).click();
const ta = page.getByPlaceholder('Motivo do cancelamento');
await ta.waitFor({ timeout: 15000 });
// info do drawer
const info = await page.evaluate(() => {
  const ta = [...document.querySelectorAll('textarea')].find(e => e.placeholder === 'Motivo do cancelamento');
  let root = ta; for (let i=0;i<12 && root && !/rightbar|drawer|slid/i.test(root.className);i++) root = root.parentElement;
  return { taId: ta.id, taName: ta.name, rootCls: root?.className?.toString().slice(0,100) };
});
console.log('drawer info:', JSON.stringify(info));
await ta.fill('QA cancelamento automatizado - engenharia reversa do botao Cancelar (Central de Tarefas) 26/08');
traffic.length = 0; resps.length = 0;
await page.getByRole('button', { name: 'Cancelar solicitação', exact: true }).click();
await page.waitForTimeout(10000);
console.log('--- ESCRITAS ---'); console.log(JSON.stringify(traffic, null, 1));
console.log('--- RESPOSTAS ---'); console.log(JSON.stringify(resps, null, 1));
fs.writeFileSync(`/home/dev1/cassi-e2e/tmp-cancel/traffic-central-${ALVO}.json`, JSON.stringify({ traffic, resps }, null, 1));
await page.screenshot({ path: '/home/dev1/cassi-e2e/tmp-cancel/central-apos-cancelar.png' });
console.log('card ainda na lista?', await card.count());
const depois = await page.evaluate(async (id) => {
  const r = await fetch(`/process-management/api/v2/requests/${id}`);
  const j = await r.json().catch(()=>null);
  return j && { status: j.status, active: j.active, endDate: j.endDate };
}, ALVO);
console.log('DEPOIS:', JSON.stringify(depois));
await b.close();
