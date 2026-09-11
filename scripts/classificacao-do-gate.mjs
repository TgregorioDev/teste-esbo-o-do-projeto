// @ts-check
/**
 * A regra do gate, sem entrada nem saída: recebe o relatório JSON do Playwright já lido e devolve a
 * classificação de cada teste. `scripts/veredito-do-gate.mjs` é só a casca de linha de comando.
 *
 * Separado em 11/09/2026 (etapa 7 de `docs/plano-de-evolucao-2026-09-11.md`) para ser testado com
 * `node:test` (`unit/classificacao-do-gate.test.mjs`): é a peça que decide se um vermelho bloqueia o
 * merge, e até aqui só era exercitada rodando a suíte inteira.
 *
 * Precedência, nesta ordem:
 *
 * | Classe                | Critério                                                          | Bloqueia? |
 * |-----------------------|-------------------------------------------------------------------|-----------|
 * | conhecido             | título contém `@bug` ou `@achado` (defesa: não deveria estar aqui) | não       |
 * | ok                    | `status === 'expected'`                                           | não       |
 * | pré-condição ausente  | não passou E tem anotação `pre-condicao-ausente`                  | não       |
 * | flaky                 | `status === 'flaky'` (passou só no retry)                         | não — "investigar" |
 * | regressão             | `status === 'unexpected'` sem nada acima                          | SIM       |
 * | pulado                | `status === 'skipped'` — a suíte PROÍBE skip; skip é falha do gate | SIM       |
 *
 * A anotação só conta quando o teste NÃO passou: três specs de RH anotam a pré-condição e PASSAM
 * (provam o bloqueio) — teste verde com anotação continua sendo verde.
 *
 * As anotações são lidas do agregado E de cada resultado, porque a de pré-condição é empurrada em tempo
 * de execução e pode viver só no resultado que falhou.
 */

export const ANOTACAO_PRE_CONDICAO = 'pre-condicao-ausente';

/**
 * @typedef {{ arquivo: string, linha: number, titulo: string, status: string, classe: string, motivo: string }} Veredito
 * @typedef {{ ok: number, conhecido: number, 'pre-condicao': number, flaky: number, regressao: number, pulado: number }} Totais
 */

/**
 * Primeira linha, sem códigos ANSI: é o que cabe numa tabela e o que a assertion diz.
 * @param {unknown} texto
 */
export function resumir(texto) {
  if (!texto) return '';
  return String(texto).replace(/\x1b\[[0-9;]*m/g, '').split('\n')[0].trim().slice(0, 240);
}

/**
 * @param {any} spec
 * @param {any} teste
 * @param {string[]} titlePath
 * @returns {Veredito}
 */
export function classificar(spec, teste, titlePath) {
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

/**
 * Classifica o relatório inteiro.
 *
 * Bloqueia com regressão, pulado, erro de execução do runner (`errors` no relatório — "No tests found"
 * é o caso clássico) ou relatório com ZERO testes: um gate que "passa" sem ter medido nada é o falso
 * verde mais barato que existe.
 *
 * @param {any} relatorio o JSON do reporter `json` do Playwright
 * @returns {{ testes: Veredito[], errosDeExecucao: string[], totais: Totais, bloqueia: boolean }}
 */
export function classificarRelatorio(relatorio) {
  /** @type {Veredito[]} */
  const testes = [];

  /**
   * @param {any} suite
   * @param {string[]} caminho títulos das suítes acima (o `titlePath` sem o nome do projeto)
   */
  const percorrer = (suite, caminho) => {
    const titulos = suite.title ? [...caminho, suite.title] : caminho;
    for (const spec of suite.specs ?? []) {
      for (const teste of spec.tests ?? []) testes.push(classificar(spec, teste, [...titulos, spec.title]));
    }
    for (const filha of suite.suites ?? []) percorrer(filha, titulos);
  };
  for (const suite of relatorio?.suites ?? []) percorrer(suite, []);

  /** Erros fora de qualquer teste: "No tests found", falha no globalSetup, spec que não compila. */
  const errosDeExecucao = /** @type {string[]} */ (
    (relatorio?.errors ?? []).map((/** @type {any} */ e) => resumir(e?.message ?? e)).filter(Boolean)
  );
  if (testes.length === 0 && errosDeExecucao.length === 0) {
    errosDeExecucao.push('o relatório não contém nenhum teste — nada foi medido');
  }

  /** @type {Totais} */
  const totais = { ok: 0, conhecido: 0, 'pre-condicao': 0, flaky: 0, regressao: 0, pulado: 0 };
  for (const t of testes) totais[/** @type {keyof Totais} */ (t.classe)]++;
  const bloqueia = totais.regressao + totais.pulado + errosDeExecucao.length > 0;

  return { testes, errosDeExecucao, totais, bloqueia };
}
