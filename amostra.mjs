import { chromium } from '@playwright/test';
import dotenv from 'dotenv'; dotenv.config({ path: '.env.test', quiet: true });
const b = await chromium.launch();
const ctx = await b.newContext({ baseURL: process.env.BASE_URL, storageState: 'playwright/.auth/usuario.json', locale: 'pt-BR' });
const p = await ctx.newPage();
await p.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
const ids = [];
for (let i = Number(process.argv[2]); i <= Number(process.argv[3]); i++) ids.push(i);
const r = await p.evaluate(async (lista) => {
  const out = [];
  for (const id of lista) {
    try {
      const x = await fetch(`/process-management/api/v2/requests/${id}?expand=currentMovements`);
      if (x.status !== 200) continue;
      const j = await x.json();
      if (j.processId !== 'wf_solicitacao_compras') continue;
      const mv = (j.currentMovements ?? [])[0];
      out.push({ id, status: j.status, etapa: mv?.stateDescription ?? mv?.state?.stateName ?? '-', inicio: (j.startDate ?? '').slice(0, 16) });
    } catch {}
  }
  return out;
}, ids);
for (const x of r) console.log(`${x.id} ${x.status.padEnd(9)} ${String(x.etapa).slice(0,32).padEnd(34)} ${x.inicio}`);
await b.close();
