// Executa os testes @destrutivo UM POR INVOCAÇÃO, com 60 s de separação entre eles.
// Uso: node relatorios-2026-09-03/rodar-destrutivos.mjs <de> <ate>   (índices 1-based em destrutivos.tsv)
// Cada teste gera relatorios-2026-09-03/destrutivo-NN.json e test-results-0903/destrutivos/NN/.
import { spawnSync } from 'node:child_process';
import { readFileSync, appendFileSync } from 'node:fs';

const lista = readFileSync('relatorios-2026-09-03/destrutivos.tsv', 'utf8').split('\n').filter(Boolean)
  .map((l) => { const [projeto, alvo, titulo] = l.split('\t'); return { projeto, alvo, titulo }; });
const de = Number(process.argv[2]), ate = Number(process.argv[3] ?? process.argv[2]);
const ESPERA_MS = 60_000;
const LOG = 'relatorios-2026-09-03/destrutivos.log';

for (let i = de; i <= ate; i++) {
  const t = lista[i - 1];
  const nn = String(i).padStart(2, '0');
  const inicio = new Date();
  appendFileSync(LOG, `${inicio.toISOString()}\tINICIO\t${nn}\t${t.alvo}\n`);
  const r = spawnSync('npx', ['playwright', 'test', `tests/${t.alvo}`, '--reporter=line,json', `--output=test-results-0903/destrutivos/${nn}`], {
    stdio: 'inherit',
    env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: `relatorios-2026-09-03/destrutivo-${nn}.json`, PLAYWRIGHT_JSON_OUTPUT_NAME: `relatorios-2026-09-03/destrutivo-${nn}.json` },
  });
  const seg = Math.round((Date.now() - inicio.getTime()) / 1000);
  appendFileSync(LOG, `${new Date().toISOString()}\tFIM\t${nn}\texit=${r.status}\t${seg}s\t${t.alvo}\n`);
  console.log(`\n[destrutivo ${nn}/${lista.length}] exit=${r.status} em ${seg}s — ${t.alvo}`);
  if (i < lista.length) {
    console.log(`[espera] 60 s antes do próximo destrutivo…`);
    await new Promise((res) => setTimeout(res, ESPERA_MS));
  }
}
