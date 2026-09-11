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
 * agregado por teste, inclusive `flaky`). A regra de classificação — precedência das classes, o que
 * bloqueia — mora em `scripts/classificacao-do-gate.mjs`, testada por `unit/classificacao-do-gate.test.mjs`;
 * este arquivo só lê, grava e imprime.
 *
 * Saída: tabela no console; markdown em `GITHUB_STEP_SUMMARY` quando existir; e um
 * `veredito.json` compacto ao lado do relatório, que é o registro por execução.
 *
 * Uso: node scripts/veredito-do-gate.mjs [relatorio.json] [veredito.json]
 *   padrão: test-results/relatorio.json → test-results/veredito.json
 * Exit 1 com regressão, pulado, erro de execução do runner ou relatório com ZERO testes.
 * Relatório inexistente: `::warning::` e exit 0 (mesma convenção de `alerta-bug-corrigido.mjs`).
 */
import { readFileSync, existsSync, appendFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { classificarRelatorio } from './classificacao-do-gate.mjs';

const arquivo = process.argv[2] ?? 'test-results/relatorio.json';
const saida = process.argv[3] ?? 'test-results/veredito.json';

if (!existsSync(arquivo)) {
  console.log(`::warning::Relatório JSON não encontrado em ${arquivo} — nada a classificar.`);
  process.exit(0);
}

const { testes, errosDeExecucao, totais, bloqueia } = classificarRelatorio(JSON.parse(readFileSync(arquivo, 'utf8')));

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
