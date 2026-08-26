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
await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
// espaçamento de escrita: 30s parado antes da primeira escrita
await page.waitForTimeout(30000);

const callCancel = (id, texto) => page.evaluate(async ({ id, texto }) => {
  const r = await fetch('/ecm/api/rest/ecm/workflowView/cancelInstance/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ processInstanceId: id, taskUserId: 'TOTVS-FS', cancelText: texto }),
  });
  return { status: r.status, body: (await r.text()).slice(0, 1000) };
}, { id, texto });

const getState = (id) => page.evaluate(async (id) => {
  const r = await fetch(`/process-management/api/v2/requests/${id}`);
  const j = await r.json().catch(()=>null);
  return j && { status: j.status, active: j.active, endDate: j.endDate };
}, id);

// 1. cancela 112302 (tarefa atual com Erlon Cesar Dengo — TOTVS-FS é só o solicitante)
console.log('112302 ANTES:', JSON.stringify(await getState(112302)));
const r1 = await callCancel(112302, 'QA cancelamento automatizado via API direta (fetch, sem UI) - engenharia reversa 26/08');
console.log('cancelInstance(112302) →', JSON.stringify(r1));
await page.waitForTimeout(5000);
console.log('112302 DEPOIS:', JSON.stringify(await getState(112302)));

await page.waitForTimeout(30000);

// 2. duplo cancelamento: 112300 já está CANCELED
const r2 = await callCancel(112300, 'QA tentativa de duplo cancelamento - deve falhar');
console.log('cancelInstance(112300 já cancelada) →', JSON.stringify(r2));

await page.waitForTimeout(30000);

// 3. cancelText null na 112301 (QA) — validação server-side?
const r3 = await callCancel(112301, null);
console.log('cancelInstance(112301, cancelText null) →', JSON.stringify(r3));
console.log('112301 estado:', JSON.stringify(await getState(112301)));
await b.close();
