// Sonda leve: o Portal de Acompanhamento voltou a listar contratos?
// Usa o storageState que o global-setup da suite ja gerou. Sai 0 quando ha registros.
import { chromium } from '@playwright/test';
import dotenv from 'dotenv'; dotenv.config({ path: '.env.test', quiet: true });
const BASE = process.env.BASE_URL;
const ESTADO = process.env.ARQUIVO_AUTH;
const b = await chromium.launch();
let total = 0;
let erro = null;
try {
  const ctx = await b.newContext({ baseURL: BASE, storageState: ESTADO, locale: 'pt-BR' });
  const p = await ctx.newPage();
  await p.goto('/portal/p/1/acompanhamentoContrato', { waitUntil: 'domcontentloaded' });
  const status = p.getByRole('status').filter({ hasText: /Mostrando/ }).first();
  await status.waitFor({ timeout: 45000 });
  const m = (await status.innerText()).match(/de ([\d.]+) registros/);
  total = m ? Number(m[1].replace(/\./g, '')) : 0;
  await ctx.close();
} catch (e) { erro = String(e && e.message || e).split('\n')[0]; }
await b.close();
process.stdout.write((erro ? "ERRO: " + erro : String(total)) + "\n");
process.exit(!erro && total > 0 ? 0 : 1);
