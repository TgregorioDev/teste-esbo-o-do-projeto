import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config({ path: '/home/dev1/cassi-e2e/.env.test', quiet: true });
const BASE = process.env.BASE_URL;
const IDS = [112096, 112101, 112111, 112113, 112301, 112302];

const b = await chromium.launch();
const ctx = await b.newContext({
  baseURL: BASE,
  storageState: '/home/dev1/cassi-e2e/playwright/.auth/usuario.json',
  locale: 'pt-BR', viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();
for (const id of IDS) {
  await page.goto(`/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=${id}`, { waitUntil: 'domcontentloaded' });
  // espera o iframe do formulário aparecer e carregar
  try {
    await page.waitForSelector('iframe', { timeout: 30000 });
    await page.waitForTimeout(9000);
  } catch {}
  let qa = [];
  for (const f of page.frames()) {
    const vals = await f.evaluate(() => [...document.querySelectorAll('input,textarea')].map(e=>e.value||'').filter(v=>/^QA\b/.test(v)).slice(0,2)).catch(()=>[]);
    qa.push(...vals);
  }
  console.log(id, '→ QA:', JSON.stringify(qa.slice(0,2)), '| frames:', page.frames().length);
}
await b.close();
