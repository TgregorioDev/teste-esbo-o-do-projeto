// Chama o endpoint de dataset do Fluig direto, com a sessao do storageState,
// e mostra STATUS HTTP + corpo cru. Distingue "ERP devolveu vazio" de "chamada falhou".
import { chromium } from '@playwright/test';
import dotenv from 'dotenv'; dotenv.config({ path: '.env.test', quiet: true });
const b = await chromium.launch();
const ctx = await b.newContext({ baseURL: process.env.BASE_URL, storageState: 'playwright/.auth/usuario.json', locale: 'pt-BR' });
const p = await ctx.newPage();
await p.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
for (const ds of ['dsProtheus_getContratosxFornecedores_restGet', 'dsProtheus_getTipoContratos_restGetAll', 'colleague']) {
  const r = await p.evaluate(async (nome) => {
    try {
      const resp = await fetch('/api/public/ecm/dataset/datasets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: nome, constraints: [], fields: [], order: [] }),
      });
      const txt = await resp.text();
      return { status: resp.status, tamanho: txt.length, inicio: txt.slice(0, 260) };
    } catch (e) { return { status: 'EXCECAO', tamanho: 0, inicio: String(e).slice(0, 260) }; }
  }, ds);
  console.log(`\n--- ${ds} ---\nHTTP ${r.status} | bytes=${r.tamanho}\n${r.inicio}`);
}
await b.close();
