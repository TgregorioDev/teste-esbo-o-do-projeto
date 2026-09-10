// Helper de investigação — apagar ao fim.
import dotenv from 'dotenv';
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
dotenv.config({ path: '.env.test', quiet: true });

export const OUT = '/tmp/claude-1000/-home-dev1-emdash-worktrees-teste-esbo-o-do-projeto-a4e20f05-emdash-projeto-automacao-de-testes-c82gf/1f3db328-28d9-46ed-a810-2f7d71288e5d/scratchpad';
mkdirSync(OUT, { recursive: true });

export async function abrir() {
  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({
    storageState: JSON.parse(readFileSync('playwright/.auth/usuario.json', 'utf8')),
    locale: 'pt-BR',
    baseURL: process.env.BASE_URL,
  });
  const pagina = await contexto.newPage();
  await pagina.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  const titulo = await pagina.title();
  if (!/Home/.test(titulo)) throw new Error(`Sessão inválida: título "${titulo}"`);
  return { navegador, pagina };
}

export function chamar(pagina, rota, init) {
  return pagina.evaluate(async ({ r, init }) => {
    const resposta = await fetch(r, {
      credentials: 'include',
      ...init,
      headers: { Accept: 'application/json', Referer: `${location.origin}/portal/p/1/home`, ...(init?.headers ?? {}) },
    });
    const texto = await resposta.text();
    let corpo;
    try { corpo = JSON.parse(texto); } catch { corpo = { textoBruto: texto.slice(0, 2000) }; }
    return { status: resposta.status, tipo: resposta.headers.get('content-type'), corpo };
  }, { r: rota, init });
}
export const ler = (pagina, rota) => chamar(pagina, rota);
export const postar = (pagina, rota, body) =>
  chamar(pagina, rota, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const dataset = (pagina, name, constraints = [], fields = []) =>
  postar(pagina, '/api/public/ecm/dataset/datasets', { name, fields, constraints, order: [] });

export function salvar(nome, dado) {
  writeFileSync(`${OUT}/${nome}`, JSON.stringify(dado, null, 2));
  console.log(`  [salvo] ${nome}`);
}
export function campos(form) {
  const m = {};
  for (const c of form?.formFields ?? []) m[c.field] = c.value;
  return m;
}
