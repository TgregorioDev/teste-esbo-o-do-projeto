// Coleta formFields + activities das SCs de interesse. Apagar ao terminar.
import dotenv from 'dotenv';
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
dotenv.config({ path: '.env.test', quiet: true });

const OUT = process.argv[2];
const IDS = process.argv.slice(3).map(Number);
mkdirSync(OUT, { recursive: true });

const navegador = await chromium.launch();
const ctx = await navegador.newContext({
  storageState: JSON.parse(readFileSync('playwright/.auth/usuario.json', 'utf8')),
  locale: 'pt-BR', baseURL: process.env.BASE_URL,
});
const page = await ctx.newPage();
await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded', timeout: 90_000 });
console.log('titulo:', await page.title());

const ler = (rota) => page.evaluate(async (r) => {
  const resp = await fetch(r, { headers: { Accept: 'application/json' } });
  const t = await resp.text();
  try { return { status: resp.status, corpo: JSON.parse(t) }; } catch { return { status: resp.status, corpo: { textoBruto: t.slice(0, 500) } }; }
}, rota);

const erp = await ler('/api/public/2.0/authorize/client/test?serviceCode=apiRESTProtheusCompras');
console.log('ERP:', erp.corpo?.content?.description, '| result:', String(erp.corpo?.content?.result ?? '').slice(0, 120));

for (const id of IDS) {
  const req = await ler(`/process-management/api/v2/requests/${id}?expand=formFields`);
  const atv = await ler(`/process-management/api/v2/requests/${id}/activities`);
  writeFileSync(`${OUT}/${id}.form.json`, JSON.stringify(req.corpo, null, 1));
  writeFileSync(`${OUT}/${id}.atv.json`, JSON.stringify(atv.corpo, null, 1));
  const c = req.corpo;
  console.log(id, 'form', req.status, 'active=', c?.active, 'campos=', Object.keys(c?.formFields ?? {}).length, '| atv', atv.status, 'itens=', (atv.corpo?.items ?? []).length);
}
await navegador.close();
