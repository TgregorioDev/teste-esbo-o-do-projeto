// Escuta as chamadas REAIS de dataset que o widget do portal dispara e mostra a resposta.
import { chromium } from '@playwright/test';
import dotenv from 'dotenv'; dotenv.config({ path: '.env.test', quiet: true });
const b = await chromium.launch();
const ctx = await b.newContext({ baseURL: process.env.BASE_URL, storageState: 'playwright/.auth/usuario.json', locale: 'pt-BR' });
const p = await ctx.newPage();
p.on('response', async (r) => {
  if (!r.url().includes('/api/public/ecm/dataset/datasets')) return;
  let nome = '?';
  nome = (r.request().postData() ?? '').slice(0, 200);
  let corpo = '';
  try { corpo = (await r.text()).slice(0, 300); } catch { corpo = '<sem corpo>'; }
  console.log(`\n[${r.status()}] ${nome}\n${corpo}`);
});
await p.goto('/portal/p/1/acompanhamentoContrato', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(25000);
await b.close();
