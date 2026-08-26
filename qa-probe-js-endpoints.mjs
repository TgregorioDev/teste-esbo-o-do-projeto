// Somente leitura: baixa os JS da página da Lixeira e greppa os endpoints do recycleBin.
import { request } from '@playwright/test';
const BASE = 'https://caixade182374.fluig.cloudtotvs.com.br';
const ctx = await request.newContext({ baseURL: BASE, storageState: '/home/dev1/cassi-e2e/playwright/.auth/usuario.json' });

const html = await (await ctx.get('/portal/p/1/pagerecyclebin')).text();
const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
console.log('scripts:', srcs.length);
const vistos = new Set();
for (const src of srcs) {
  const url = src.startsWith('http') ? src : (src.startsWith('/') ? src : '/' + src);
  try {
    const r = await ctx.get(url);
    if (r.status() !== 200) continue;
    const t = await r.text();
    for (const m of t.matchAll(/[\w./-]*recycleBin[\w./-]*/gi)) {
      const s = m[0];
      if (!vistos.has(s)) { vistos.add(s); console.log('recycleBin ref em', url.slice(0, 90), '->', s); }
    }
    // método HTTP próximo às refs
    for (const m of t.matchAll(/(?:type|method)\s*:\s*['"](GET|POST|PUT|DELETE)['"][^}]{0,200}?recycleBin\/(\w+)|recycleBin\/(\w+)['"][^}]{0,200}?(?:type|method)\s*:\s*['"](GET|POST|PUT|DELETE)['"]/gi)) {
      console.log('METODO:', m[0].replace(/\s+/g, ' ').slice(0, 200));
    }
  } catch {}
}
await ctx.dispose();
