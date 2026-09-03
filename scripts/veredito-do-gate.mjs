// @ts-check
/**
 * Veredito do gate: há regressão NOVA nesta execução?
 *
 * O runner só sabe dizer "passou" ou "falhou". Nesta suíte isso não basta: parte dos vermelhos
 * é `PRÉ-CONDIÇÃO AUSENTE` (massa, serviço ou permissão que o ambiente não entregou — ver
 * `docs/excecoes-de-pre-condicao.md` e `docs/estabilidade-do-ambiente.md`), e um gate que
 * fica vermelho por isso deixa de informar qualquer coisa. A convenção existia só na MENSAGEM;
 * desde 03/09/2026 `utils/pre-condicao.js` a grava também como anotação
 * (`type: 'pre-condicao-ausente'`), e este script é quem a lê.
 *
 * Lê o relatório JSON do Playwright (não o JUnit — o JSON traz anotações e o `status`
 * agregado por teste, inclusive `flaky`) e classifica cada teste, nesta ordem de precedência:
 *
 * | Classe                | Critério                                                          | Bloqueia? |
 * |-----------------------|-------------------------------------------------------------------|-----------|
 * | conhecido             | título contém `@bug` ou `@achado` (defesa: não deveria estar aqui) | não       |
 * | pré-condição ausente  | não passou E tem anotação `pre-condicao-ausente`                  | não       |
 * | flaky                 | `status === 'flaky'` (passou só no retry)                         | não — "investigar" |
 * | regressão             | `status === 'unexpected'` sem nada acima                          | SIM       |
 * | pulado                | `status === 'skipped'` — a suíte PROÍBE skip; skip é falha do gate | SIM       |
 *
 * A anotação só conta quando o teste NÃO passou: três specs de RH anotam a pré-condição e
 * PASSAM (provam o bloqueio) — teste verde com anotação continua sendo verde ("ok").
 *
 * Teste com vários `results` (retries): o `status` agregado do Playwright já resume
 * (`flaky` = falhou e depois passou; `unexpected` = falhou em todas). As anotações são lidas
 * do agregado E de cada resultado, porque a anotação de pré-condição é empurrada em tempo de
 * execução e pode viver só no resultado que falhou.
 *
 * Saída: tabela no console; markdown em `GITHUB_STEP_SUMMARY` quando existir; e um
 * `veredito.json` compacto ao lado do relatório, que é o registro por execução de que a
 * Etapa 3 do plano depende.
 *
 * Uso: node scripts/veredito-do-gate.mjs [relatorio.json] [veredito.json]
 *   padrão: test-results/relatorio.json → test-results/veredito.json
 * Exit 1 com regressão, pulado, erro de execução do runner (`errors` no relatório — "No tests
 * found" é o caso clássico: um erro de sintaxe num spec faz o Playwright não achar teste nenhum,
 * ver CLAUDE.md) ou relatório com ZERO testes (um gate que "passa" sem ter medido nada é o
 * falso verde mais barato que existe). Relatório inexistente: `::warning::` e exit 0 (mesma
 * convenção de `alerta-bug-corrigido.mjs`).
 */
import { readFileSync, existsSync, appendFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const ANOTACAO_PRE_CONDICAO = 'pre-condicao-ausente';
const arquivo = process.argv[2] ?? 'test-results/relatorio.json';
const saida = process.argv[3] ?? 'test-results/veredito.json';

if (!existsSync(arquivo)) {
  console.log(`::warning::Relatório JSON não encontrado em ${arquivo} — nada a classificar.`);
  process.exit(0);
}

/** @type {any} */
const relatorio = JSON.parse(readFileSync(arquivo, 'utf8'));

/**
 * @typedef {{ arquivo: string, linha: number, titulo: string, status: string, classe: string, motivo: string }} Veredito
 */

/** @type {Veredito[]} */
const testes = [];

/**
 * @param {any} suite
 * @param {string[]} caminho títulos das suítes acima (o `titlePath` sem o nome do projeto)
 */
function percorrer(suite, caminho) {
  const titulos = suite.title ? [...caminho, suite.title] : caminho;
  for (const spec of suite.specs ?? []) {
    for (const teste of spec.tests ?? []) {
      testes.push(classificar(spec, teste, [...titulos, spec.title]));
    }
  }
  for (const filha of suite.suites ?? []) percorrer(filha, titulos);
}

/**
 * @param {any} spec
 * @param {any} teste
 * @param {string[]} titlePath
 * @returns {Veredito}
 */
function classificar(spec, teste, titlePath) {
  const titulo = titlePath.filter(Boolean).join(' › ');
  const status = String(teste.status ?? 'unexpected');
  const base = { arquivo: String(spec.file ?? ''), linha: Number(spec.line ?? 0), titulo, status };

  /** @type {Array<{ type?: string, description?: string }>} */
  const anotacoes = [
    ...(teste.annotations ?? []),
    ...(teste.results ?? []).flatMap((/** @type {any} */ r) => r.annotations ?? []),
  ];
  const preCondicao = anotacoes.find((a) => a.type === ANOTACAO_PRE_CONDICAO);
  const ultimoErro = (teste.results ?? [])
    .map((/** @type {any} */ r) => r.error?.message)
    .filter(Boolean)
    .at(-1);

  if (/@bug\b|@achado\b/.test(titulo)) {
    return { ...base, classe: 'conhecido', motivo: 'tag @bug/@achado — não deveria estar no escopo do gate' };
  }
  if (status === 'expected') return { ...base, classe: 'ok', motivo: '' };
  if (preCondicao) {
    return { ...base, classe: 'pre-condicao', motivo: String(preCondicao.description ?? '') };
  }
  if (status === 'flaky') {
    return { ...base, classe: 'flaky', motivo: `passou só no retry — investigar. Último erro: ${resumir(ultimoErro)}` };
  }
  if (status === 'skipped') {
    return { ...base, classe: 'pulado', motivo: 'teste pulado — a suíte proíbe skip; conta como falha do gate' };
  }
  return { ...base, classe: 'regressao', motivo: resumir(ultimoErro) || 'sem mensagem de erro no relatório' };
}

/** @param {unknown} texto */
function resumir(texto) {
  if (!texto) return '';
  // Primeira linha, sem códigos ANSI: é o que cabe numa tabela e o que a assertion diz.
  return String(texto).replace(/\x1b\[[0-9;]*m/g, '').split('\n')[0].trim().slice(0, 240);
}

for (const suite of relatorio.suites ?? []) percorrer(suite, []);

/** Erros fora de qualquer teste: "No tests found", falha no globalSetup, spec que não compila. */
const errosDeExecucao = /** @type {string[]} */ (
  (relatorio.errors ?? []).map((/** @type {any} */ e) => resumir(e?.message ?? e)).filter(Boolean)
);
if (testes.length === 0 && errosDeExecucao.length === 0) {
  errosDeExecucao.push('o relatório não contém nenhum teste — nada foi medido');
}

const totais = { ok: 0, conhecido: 0, 'pre-condicao': 0, flaky: 0, regressao: 0, pulado: 0 };
for (const t of testes) totais[/** @type {keyof typeof totais} */ (t.classe)]++;
const bloqueia = totais.regressao + totais.pulado + errosDeExecucao.length > 0;

// ── registro por execução ──────────────────────────────────────────────────────────────────
const ordem = ['regressao', 'pulado', 'pre-condicao', 'flaky', 'conhecido', 'ok'];
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(
  saida,
  JSON.stringify(
    {
      geradoEm: new Date().toISOString(),
      relatorio: arquivo,
      veredito: bloqueia ? 'REGRESSAO' : 'SEM_REGRESSAO',
      errosDeExecucao,
      totais: { ...totais, total: testes.length },
      testes: [...testes].sort((a, b) => ordem.indexOf(a.classe) - ordem.indexOf(b.classe)),
    },
    null,
    1,
  ) + '\n',
);

// ── console + summary ──────────────────────────────────────────────────────────────────────
const ROTULO = {
  regressao: 'REGRESSÃO — bloqueia',
  pulado: 'PULADO — bloqueia (skip é proibido)',
  'pre-condicao': 'Pré-condição ausente — ambiente, não bloqueia',
  flaky: 'Flaky — passou no retry, investigar',
  conhecido: 'Conhecido (@bug/@achado) — fora do escopo',
};

/** @type {string[]} */
const linhas = [
  bloqueia ? '### ❌ Veredito do gate: HÁ regressão nova' : '### ✅ Veredito do gate: sem regressão nova',
  '',
  `${testes.length} teste(s): ${totais.ok} ok · ${totais.regressao} regressão · ${totais.pulado} pulado · ` +
    `${totais['pre-condicao']} pré-condição ausente · ${totais.flaky} flaky · ${totais.conhecido} conhecido`,
  '',
];
if (errosDeExecucao.length > 0) {
  linhas.push(`#### ERRO DE EXECUÇÃO — bloqueia (${errosDeExecucao.length})`, '', ...errosDeExecucao.map((e) => `- ${e}`), '');
}
for (const classe of /** @type {const} */ (['regressao', 'pulado', 'pre-condicao', 'flaky', 'conhecido'])) {
  const lista = testes.filter((t) => t.classe === classe);
  if (lista.length === 0) continue;
  linhas.push(`#### ${ROTULO[classe]} (${lista.length})`, '', '| Teste | Motivo |', '|---|---|');
  for (const t of lista) {
    linhas.push(
      `| \`${t.arquivo}:${t.linha}\` ${t.titulo.replace(/\|/g, '\\|')} | ${t.motivo.replace(/\|/g, '\\|').slice(0, 400)} |`,
    );
  }
  linhas.push('');
}
linhas.push(`Registro desta execução: \`${saida}\``);

console.log(linhas.join('\n'));
for (const e of errosDeExecucao) console.log(`::error::Erro de execução: ${e}`);
for (const t of testes) {
  if (t.classe === 'regressao' || t.classe === 'pulado') {
    console.log(`::error file=${t.arquivo},line=${t.linha}::${t.classe === 'pulado' ? 'Teste pulado' : 'Regressão'}: ${t.titulo}`);
  } else if (t.classe === 'flaky') {
    console.log(`::warning file=${t.arquivo},line=${t.linha}::Flaky (passou no retry): ${t.titulo}`);
  }
}
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, linhas.join('\n') + '\n');

process.exit(bloqueia ? 1 : 0);
