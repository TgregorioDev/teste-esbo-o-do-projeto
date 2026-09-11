// @ts-check
/**
 * Relatório do RESÍDUO de massa ainda aberto na base, e do que cada solicitação precisa.
 *
 * ## Por que existe
 *
 * SC que já foi gravada no Protheus (`numSolCompra` preenchido) e ainda não tem cotação não cancela
 * por nenhum dos dois endpoints: o `beforeCancelProcess` de `wf_solicitacao_compras` pede ao ERP a
 * exclusão das cotações, recebe 404 "Não foram encontradas contações para exclusão" e aborta
 * (medido em 11/09/2026, `docs/execucoes/relatorio-destrutivos-2026-09-10.md`). Toda execução com
 * destrutivos deixa algumas abertas, com o carimbo `QA`. Sem este relatório elas só aparecem quando
 * alguém tropeça nelas na base; com ele, a lista sai pronta para mandar ao desenvolvedor ou para
 * cancelar no dia em que o defeito for corrigido.
 *
 * ⚠️ **O E6 foi corrigido em 11/09/2026 (tarde).** Remedido: SC com `numSolCompra` e sem cotação
 * cancela (`cancelamento-sc-integrada` verde, SC 96501; e as 9 SCs de massa do dia canceladas pelo
 * teardown). A classe `aberta-no-erp-sem-cotacao` deixou de significar "não cancela": é o que ficou
 * aberto de antes da correção, e sai com `scripts/limpar-massa.mjs --alvos=`.
 *
 * ## O que lê
 *
 *   node scripts/residuo-de-massa.mjs               # livro-razão das execuções + massa semeada
 *   node scripts/residuo-de-massa.mjs --ids=1,2,3   # só os ids informados
 *
 * Fontes: `playwright/.massa/criados.jsonl` (fixture `evidence`, `utils/livro-razao.js`) e `playwright/.massa/semeada.jsonl`
 * (`scripts/semear-massa.mjs`). Só LÊ: nada é cancelado aqui — cancelar é `scripts/limpar-massa.mjs`.
 *
 * ## Classes
 *
 * - `aberta-no-erp-sem-cotacao`: SC aberta, com `numSolCompra` e sem `numCotacao` — o que o E6 prendia;
 * - `aberta-cancelavel`: aberta por outro motivo (sem número no ERP, ou outro processo);
 * - `encerrada`: cancelada ou finalizada — nada a fazer.
 *
 * Grava `test-results/residuo-de-massa.json` (ignorado pelo git) e imprime a tabela.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import { repetirSeFalhaDeRede } from '../utils/rede.js';
import { LIVRO_DE_CRIADOS } from '../utils/livro-razao.js';

dotenv.config({ path: '.env.test', quiet: true });

const LIVRO_DA_EXECUCAO = LIVRO_DE_CRIADOS;
const LIVRO_DA_MASSA = 'playwright/.massa/semeada.jsonl';
const SAIDA = 'test-results/residuo-de-massa.json';

const BASE_URL = process.env.BASE_URL;
const USUARIO = process.env.QA_USERNAME;
const SENHA = process.env.QA_PASSWORD;
if (!BASE_URL || !USUARIO || !SENHA) {
  throw new Error('Faltam variáveis: BASE_URL, QA_USERNAME e QA_PASSWORD. Configure `.env.test`.');
}

/**
 * Linhas JSON de um livro-razão, tolerando linha truncada (teste morto no meio da escrita).
 * @param {string} arquivo
 * @returns {any[]}
 */
function lerLinhas(arquivo) {
  if (!existsSync(arquivo)) return [];
  const registros = [];
  for (const linha of readFileSync(arquivo, 'utf8').split('\n').filter(Boolean)) {
    try {
      registros.push(JSON.parse(linha));
    } catch {
      // Uma linha truncada não invalida o relatório; o id perdido segue rastreável pelo carimbo.
    }
  }
  return registros;
}

const argIds = process.argv.slice(2).find((a) => a.startsWith('--ids='));
const ids = argIds
  ? argIds.slice('--ids='.length).split(',').map((x) => Number(x.trim())).filter(Boolean)
  : [
      ...new Set([
        ...lerLinhas(LIVRO_DA_EXECUCAO).filter((r) => r.tipo === 'solicitacao').map((r) => Number(r.id)),
        ...lerLinhas(LIVRO_DA_MASSA).map((r) => Number(r.processInstanceId)),
      ]),
    ].filter(Boolean);

if (ids.length === 0) {
  console.log(`nenhum id em ${LIVRO_DA_EXECUCAO} nem em ${LIVRO_DA_MASSA} — nada a relatar.`);
  process.exit(0);
}

const navegador = await chromium.launch();
const contexto = await navegador.newContext({
  baseURL: BASE_URL,
  locale: 'pt-BR',
  storageState: existsSync('playwright/.auth/usuario.json') ? 'playwright/.auth/usuario.json' : undefined,
});
const pagina = await contexto.newPage();

try {
  await pagina.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
  // Sessão viva se decide pelo TÍTULO, não pela URL: o login é servido na MESMA rota da home.
  if (!(await pagina.title()).includes('Home')) {
    await pagina.getByRole('textbox', { name: 'Digite seu login' }).fill(USUARIO);
    await pagina.getByRole('textbox', { name: 'Digite sua senha' }).fill(SENHA);
    await pagina.getByRole('button', { name: 'Acessar' }).click();
    await pagina.waitForFunction(() => document.title.includes('Home'), null, { timeout: 30_000 });
  }

  const linhas = await repetirSeFalhaDeRede(
    () =>
      pagina.evaluate(async (lista) => {
        /** @type {any[]} */
        const saida = [];
        for (const id of lista) {
          const r = await fetch(`/process-management/api/v2/requests/${id}`, { headers: { Accept: 'application/json' } });
          if (!r.ok) {
            saida.push({ id, status: `HTTP ${r.status}`, ativa: false, processo: '', numSolCompra: '', numCotacao: '', marca: '' });
            continue;
          }
          const req = await r.json();
          const linha = { id, status: String(req.status ?? '?'), ativa: req.active === true, processo: String(req.processId ?? ''), numSolCompra: '', numCotacao: '', marca: '' };
          if (linha.ativa && linha.processo === 'wf_solicitacao_compras') {
            const f = await fetch(`/process-management/api/v2/requests/${id}?expand=formFields`, { headers: { Accept: 'application/json' } });
            const campos = Object.fromEntries(((f.ok ? await f.json() : {}).formFields ?? []).map((/** @type {any} */ c) => [c.field, c.value ?? '']));
            linha.numSolCompra = String(campos.numSolCompra ?? '');
            linha.numCotacao = String(campos.numCotacao ?? '');
            linha.marca = String(campos.motivoSolCompra ?? '').match(/QA[-\w]*/)?.[0] ?? '';
          }
          saida.push(linha);
        }
        return saida;
      }, ids),
    { rotulo: 'leitura do resíduo' },
  );

  const classificadas = linhas.map((l) => ({
    ...l,
    classe: !l.ativa
      ? 'encerrada'
      : l.processo === 'wf_solicitacao_compras' && l.numSolCompra && !l.numCotacao
        ? 'aberta-no-erp-sem-cotacao'
        : 'aberta-cancelavel',
  }));

  const presas = classificadas.filter((l) => l.classe === 'aberta-no-erp-sem-cotacao');
  const abertas = classificadas.filter((l) => l.classe === 'aberta-cancelavel');
  console.log(`${ids.length} solicitação(ões) conferida(s): ${presas.length} aberta(s) no ERP sem cotação · ${abertas.length} aberta(s) cancelável(is) · ${classificadas.length - presas.length - abertas.length} encerrada(s)`);
  for (const l of presas) console.log(`  ERP ${l.id}  Nº SC ERP ${l.numSolCompra}  ${l.marca}  (rode scripts/limpar-massa.mjs --alvos=)`);
  for (const l of abertas) console.log(`  --  ${l.id}  ${l.processo}  ${l.status}  (rode scripts/limpar-massa.mjs)`);

  mkdirSync('test-results', { recursive: true });
  writeFileSync(SAIDA, JSON.stringify({ conferidoEm: new Date().toISOString(), solicitacoes: classificadas }, null, 2));
  console.log(`relatório em ${SAIDA}`);
} finally {
  await navegador.close();
}
