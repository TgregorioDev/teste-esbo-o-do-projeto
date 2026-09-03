// Extrai as falhas de TODOS os JSONs da execução de 03/09/2026 (fatias não destrutivas + um JSON por
// destrutivo) para relatorios-2026-09-03/falhas.json, no mesmo formato da execução de 02/09.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const DIR = 'relatorios-2026-09-03';
const strip = (s) => (s || '').replace(/\x1b\[[0-9;]*m/g, '');
const out = [];
const arquivos = readdirSync(DIR).filter((f) => f.endsWith('.json') && !/^(falhas|merged|extra|nomes)/.test(f));
for (const f of arquivos) {
  const r = JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8'));
  const fatia = f.replace('.json', '');
  const walk = (s, path) => {
    const p = [...path, s.title].filter(Boolean);
    for (const spec of s.specs || []) {
      for (const t of spec.tests || []) {
        for (const res of t.results || []) {
          if (res.status === 'passed' || res.status === 'skipped') continue;
          out.push({
            fatia, projeto: t.projectName, arquivo: spec.file, linha: spec.line,
            suite: p.slice(1).join(' › '), titulo: spec.title, status: res.status,
            duracaoMs: res.duration, tags: spec.tags || [],
            anotacoes: (t.annotations || []).map((a) => `${a.type}: ${a.description ?? ''}`),
            erro: strip(res.error?.message), erroLocal: res.error?.location,
            erros: (res.errors || []).map((e) => strip(e.message)),
            snippet: strip(res.error?.snippet),
            anexos: (res.attachments || []).map((a) => ({ nome: a.name, tipo: a.contentType, path: a.path, corpo: a.body ? Buffer.from(a.body, 'base64').toString('utf8').slice(0, 4000) : undefined })),
            stdout: (res.stdout || []).map((x) => strip(x.text)).join(''),
            stderr: (res.stderr || []).map((x) => strip(x.text)).join(''),
          });
        }
      }
    }
    for (const c of s.suites || []) walk(c, p);
  };
  for (const s of r.suites) walk(s, []);
}
out.sort((a, b) => a.arquivo.localeCompare(b.arquivo) || a.linha - b.linha);
writeFileSync(`${DIR}/falhas.json`, JSON.stringify(out, null, 2));
console.log('arquivos:', arquivos.length, 'falhas:', out.length);
for (const x of out) console.log(`${x.fatia}\t${x.arquivo}:${x.linha}\t${x.status}\t${x.titulo.slice(0, 90)}`);
