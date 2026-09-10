import { chromium } from '@playwright/test';
import dotenv from 'dotenv'; dotenv.config({ path: '.env.test', quiet: true });
import fs from 'node:fs';
const b = await chromium.launch();
const ctx = await b.newContext({ baseURL: process.env.BASE_URL, storageState: 'playwright/.auth/usuario.json', locale: 'pt-BR' });
const p = await ctx.newPage();
await p.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
async function ds(name, constraints = []) {
  return p.evaluate(async ({ name, constraints }) => {
    const t0 = Date.now();
    const r = await fetch('/api/public/ecm/dataset/datasets', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, fields: [], constraints, order: [] }) });
    const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch {}
    const values = j?.content?.values ?? null;
    return { status: r.status, ms: Date.now() - t0, columns: j?.content?.columns ?? null, count: Array.isArray(values) ? values.length : null, first: Array.isArray(values) ? values.slice(0, 2) : null, raw: values ? undefined : txt.slice(0, 400), message: j?.message ?? undefined };
  }, { name, constraints });
}
const names = ['dsProtheus_getContratos_restGetAll','dsProtheus_getFornecedores_restGetAll','dsProtheus_getContratosxFornecedores_restGet','dsProtheus_getTipoContratos_restGetAll','dsProtheus_getCampoCombo_restGetAll','dsProtheus_getItensPlanilha_restGetAll','dsProtheus_getInfoPlanilhaxContrato_restGetAll','dsProtheus_getInformaPlanxContrato_restGetAll','dsProtheus_getRateiosContratos_restGetAll','dsProtheus_getPlanilha_restGetAll','dsProtheus_getProdxPlanContxContOrc_restGetAll','dsProtheus_getFiscaisPorTipoContrato','ds_get_fiscalServico','ds_get_fiscalContrato','ds_fatcon_get_competencia','ds_fatcon_get_info_medicoes','dsProtheus_getCronogramaFinanceiro','dsProtheus_getCentroCusto_restGetAll','dsFluig_getClasseValor','dsProtheus_getPrecoHistorico','dsProtheus_getGestorOrcamentario_restGet','dsProtheus_validaSegregacaoFiscal','dsProtheus_getBranches_restGetAll','dsProtheus_getCompradores_restGetAll','colleagueGroup','dsProtheus_getProdutos_restGetAll','dsProtheus_getFornecedores','dsProtheus_getContratos','dsFluig_getRateioSC','dsProtheus_getGrupoDeProduto_restGetAll','ds_getSolicsGerenciaCompras','dsProtheus_getSQB_restGetAll'];
const out = {};
for (const n of names) { const r = await ds(n); out[n] = r; console.log(n, r.status, r.ms + 'ms', 'count=' + r.count, r.columns ? 'cols=' + r.columns.slice(0, 12).join(',') : (r.raw||'').slice(0, 160).replace(/\s+/g,' ')); }
fs.writeFileSync('.alt-02-out.json', JSON.stringify(out, null, 1));
await b.close();
