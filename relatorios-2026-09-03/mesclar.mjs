// Junta os 63 JSONs desta execução (16 fatias não destrutivas + 47 invocações destrutivas) em um
// único relatório no formato do reporter JSON do Playwright, que é o que scripts/relatorio-falhas.mjs consome.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const DIR = 'relatorios-2026-09-03';
const arquivos = readdirSync(DIR).filter((f) => f.endsWith('.json') && !/^(falhas|nomes|merged)/.test(f)).sort();
const suites = [];
let stats = { startTime: null, duration: 0, expected: 0, unexpected: 0, flaky: 0, skipped: 0 };
let config = null;
for (const a of arquivos) {
  const r = JSON.parse(readFileSync(`${DIR}/${a}`, 'utf8'));
  config ??= r.config;
  suites.push(...r.suites);
  stats.duration += r.stats.duration;
  for (const k of ['expected', 'unexpected', 'flaky', 'skipped']) stats[k] += r.stats[k];
  if (!stats.startTime || r.stats.startTime < stats.startTime) stats.startTime = r.stats.startTime;
}
writeFileSync(`${DIR}/merged.json`, JSON.stringify({ config, suites, errors: [], stats }));
const contar = (s) => (s.specs?.length ?? 0) + (s.suites ?? []).reduce((a, c) => a + contar(c), 0);
console.log('arquivos', arquivos.length, '· specs', suites.reduce((a, s) => a + contar(s), 0), '·', JSON.stringify(stats));
