import { chromium } from '@playwright/test';
import dotenv from 'dotenv'; dotenv.config({ path: '.env.test', quiet: true });
const b = await chromium.launch();
const ctx = await b.newContext({ baseURL: process.env.BASE_URL, storageState: 'playwright/.auth/usuario.json', locale: 'pt-BR' });
const p = await ctx.newPage();
let payload = null;
p.on('request', (r) => {
  if (!r.url().includes('/api/public/ecm/dataset/datasets')) return;
  const d = r.postData() ?? '';
  if (d.includes('getContratosxFornecedores')) payload = d;
});
await p.goto('/portal/p/1/acompanhamentoContrato', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(20000);
console.log('PAYLOAD COMPLETO QUE O WIDGET ENVIA:\n' + (payload ?? '<nao capturado>'));
await b.close();
