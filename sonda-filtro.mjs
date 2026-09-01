import { chromium } from '@playwright/test';
import dotenv from 'dotenv'; dotenv.config({ path: '.env.test', quiet: true });
const b = await chromium.launch();
const ctx = await b.newContext({ baseURL: process.env.BASE_URL, storageState: 'playwright/.auth/usuario.json', locale: 'pt-BR' });
const p = await ctx.newPage();
await p.goto('/portal/p/1/acompanhamentoContrato', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(8000);
const c = (f, v, t = 1) => ({ _field: f, _initialValue: v, _finalValue: v, _type: t, _likeSearch: false });
const casos = {
  'como o widget envia (com fiscal)': [c('BranchId','*'), c('page','1'), c('pagesize','50'), c('CN9_SITUAC','01,05,06,07,08',2), c('CN9_XFISCA','fabricasoftware@totvs.com.br')],
  'SEM o filtro de fiscal':            [c('BranchId','*'), c('page','1'), c('pagesize','50'), c('CN9_SITUAC','01,05,06,07,08',2)],
  'SEM fiscal e SEM situacao':         [c('BranchId','*'), c('page','1'), c('pagesize','50')],
};
for (const [rotulo, constraints] of Object.entries(casos)) {
  const r = await p.evaluate(async (cs) => {
    const resp = await fetch('/api/public/ecm/dataset/datasets', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'dsProtheus_getContratosxFornecedores_restGet', fields: [], constraints: cs, order: null }),
    });
    const j = await resp.json();
    return { status: resp.status, n: (j?.content?.values ?? []).length };
  }, constraints);
  console.log(`${rotulo.padEnd(34)} -> HTTP ${r.status} | ${r.n} contratos`);
}
await b.close();
