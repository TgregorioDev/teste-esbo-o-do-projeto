// @ts-check

/**
 * Onde mora o livro-razão do que a suíte CRIOU — um lugar só, para que quem escreve (a fixture
 * `evidence`) e quem lê (o `globalTeardown`, `scripts/limpar-massa.mjs`,
 * `scripts/residuo-de-massa.mjs`) nunca divirjam.
 *
 * ## Por que fora de `test-results/`
 *
 * Até 11/09/2026 o livro era `test-results/criados.jsonl` — e o Playwright apaga `test-results/` no
 * começo de cada invocação. Medido: depois de várias execuções seguidas o arquivo tinha só a linha da
 * última. O teardown documentava o livro como "append-only, sobrevive entre invocações", e ele não
 * sobrevivia: no fluxo fatiado, o resíduo das fatias anteriores sumia do `limpar-massa` e do relatório
 * de resíduo. `playwright/.massa/` sobrevive, como o livro da massa semeada. Este arquivo é ignorado
 * pelo git.
 */
export const LIVRO_DE_CRIADOS = 'playwright/.massa/criados.jsonl';
