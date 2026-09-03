import { chromium } from '@playwright/test';
import dotenv from 'dotenv'; dotenv.config({ path: '.env.test', quiet: true });
const b = await chromium.launch();
const ctx = await b.newContext({ baseURL: process.env.BASE_URL, storageState: 'playwright/.auth/usuario.json', locale: 'pt-BR' });
const p = await ctx.newPage(); let n = 0;
try {
  await p.goto('/portal/p/1/acompanhamentoContrato', { waitUntil: 'domcontentloaded' });
  const s = p.getByRole('status').filter({ hasText: /Mostrando/ }).first();
  await s.waitFor({ timeout: 60000 });
  const m = (await s.innerText()).match(/de ([\d.]+) registros/);
  n = m ? Number(m[1].replace(/\./g, '')) : 0;
} catch { n = -1; }
await b.close();
process.stdout.write(String(n) + '\n');
process.exit(n > 0 ? 0 : 1);
