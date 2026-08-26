import { request } from '@playwright/test';
const ctx = await request.newContext({ baseURL: 'https://caixade182374.fluig.cloudtotvs.com.br', storageState: '/home/dev1/cassi-e2e/playwright/.auth/usuario.json' });
const pausa = (ms) => new Promise(r => setTimeout(r, ms));
const j = async (r) => { const t = await r.text(); try { return JSON.parse(t); } catch { return t.slice(0, 300); } };

// ---------- 1) FAVORITOS DE PROCESSO ----------
console.log('===== favoritos de processo =====');
const lista = () => ctx.get(`/ecm/api/rest/ecm/favorites/getProcessFavotiresList?_search=false&nd=${Date.now()}&rows=30&page=1&sidx=&sord=asc`);
let r = await lista();
let antes = await j(r);
console.log('GET getProcessFavotiresList ->', r.status(), JSON.stringify(antes).slice(0, 400));
const idsAntes = (antes?.content?.rows ?? antes?.rows ?? []).map(x => x.processId ?? x.id ?? JSON.stringify(x));
console.log('favoritos ANTES:', idsAntes);

const alvo = 'wf_cadastro_fornecedor';
if (idsAntes.includes(alvo)) {
  console.log('alvo ja favoritado — pulando o add para nao mexer em estado alheio');
} else {
  r = await ctx.post(`/ecm/api/rest/ecm/processStart/addFavorites?processId=${alvo}`, { headers: { 'Content-Type': 'application/json' } });
  console.log('POST addFavorites ->', r.status(), JSON.stringify(await j(r)).slice(0, 300));
  r = await lista();
  const meio = await j(r);
  console.log('lista DEPOIS do add:', JSON.stringify(meio).slice(0, 400));
  await pausa(30_000);
  r = await ctx.post(`/ecm/api/rest/ecm/processStart/removeFavorites?processId=${alvo}`, { headers: { 'Content-Type': 'application/json' } });
  console.log('POST removeFavorites ->', r.status(), JSON.stringify(await j(r)).slice(0, 300));
  r = await lista();
  const depois = await j(r);
  const idsDepois = (depois?.content?.rows ?? depois?.rows ?? []).map(x => x.processId ?? x.id);
  console.log('favoritos DEPOIS do remove:', idsDepois);
}

// favoritos de DOCUMENTO — só leitura da lista
r = await ctx.get(`/ecm/api/rest/ecm/favorites/getFavotiresList?_search=false&nd=${Date.now()}&rows=30&page=1&sidx=&sord=asc`);
console.log('GET getFavotiresList (docs) ->', r.status(), JSON.stringify(await j(r)).slice(0, 400));

// ---------- 2) NOTIFICACOES ----------
console.log('\n===== notificacoes =====');
for (const u of ['/notification/api/v1/notifications?offset=0&limit=5', '/api/public/alert/alerts?limit=5', '/notification/api/v2/notifications?limit=5']) {
  r = await ctx.get(u);
  console.log('GET', u, '->', r.status(), JSON.stringify(await j(r)).slice(0, 500));
}

// ---------- 3) ANEXOS DE SC NO GED (dataset document, LIKE 'QA%') ----------
console.log('\n===== dataset document: documentos QA =====');
r = await ctx.post('/api/public/ecm/dataset/datasets', {
  headers: { 'Content-Type': 'application/json' },
  data: {
    name: 'document',
    fields: ['documentPK.documentId', 'documentDescription', 'parentDocumentId', 'documentTypeId', 'activeVersion', 'deleted', 'colleagueId'],
    constraints: [
      { _field: 'documentDescription', _initialValue: 'QA%', _finalValue: 'QA%', _type: 1, _likeSearch: true },
    ],
    order: [],
  },
});
const ds = await j(r);
const vals = ds?.content?.values ?? [];
console.log('status', r.status(), 'registros QA%:', vals.length);
const porPasta = {};
for (const v of vals) { porPasta[v.parentDocumentId] = (porPasta[v.parentDocumentId] ?? 0) + 1; }
console.log('por pasta (parentDocumentId -> qtde):', porPasta);
console.log('amostra:', JSON.stringify(vals.slice(0, 5)));

// nomes das pastas-mae
for (const pid of Object.keys(porPasta).slice(0, 10)) {
  const rr = await ctx.post('/api/public/ecm/dataset/datasets', {
    headers: { 'Content-Type': 'application/json' },
    data: { name: 'document', fields: ['documentPK.documentId', 'documentDescription', 'parentDocumentId', 'documentTypeId'], constraints: [{ _field: 'documentPK.documentId', _initialValue: pid, _finalValue: pid, _type: 1 }], order: [] },
  });
  const dd = await j(rr);
  const v = dd?.content?.values?.[0];
  console.log('pasta', pid, '->', v ? `${v.documentDescription} (tipo ${v.documentTypeId}, pai ${v.parentDocumentId})` : 'nao encontrada');
}
await ctx.dispose();
