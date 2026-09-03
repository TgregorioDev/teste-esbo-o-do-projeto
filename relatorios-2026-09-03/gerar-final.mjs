// Gera o documento final da execução de 03/09/2026: injeta a camada de análise
// (relatorios-2026-09-03/analise.mjs) no HTML produzido por scripts/relatorio-falhas.mjs e emite
// também a versão Markdown. Mesma estrutura do relatório de 02/09/2026 (relatorios/gerar-final.mjs).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { NATUREZAS, GRUPOS, ANALISES, META, LEITURA, SUPLEMENTARES, MASSA, REEXEC, nomeDoCaso } from './analise.mjs';
import { EVIDENCIAS } from './evidencias.mjs';

const DATA = '2026-09-03';
const DIR = `relatorios-${DATA}`;
const ler = (p) => JSON.parse(readFileSync(p, 'utf8'));
const falhas = ler(`${DIR}/falhas.json`);
const base = readFileSync(`${DIR}/base.html`, 'utf8');

// Fatias não destrutivas (uma pasta por invocação, PULAR_DESTRUTIVOS=1) …
const FATIAS = [
  ['auth', 'tests/e2e/auth'], ['api', 'tests/api'], ['acomp', 'tests/e2e/acompanhamento-contratos'],
  ['financeiro', 'tests/e2e/financeiro'], ['saude', 'tests/e2e/saude'], ['notificacoes', 'tests/e2e/notificacoes'],
  ['fiscal', 'tests/e2e/fiscal'], ['juridico', 'tests/e2e/juridico'], ['seguranca', 'tests/e2e/seguranca'],
  ['contratos', 'tests/e2e/contratos'], ['tarefas', 'tests/e2e/tarefas'], ['documentos', 'tests/e2e/documentos'],
  ['rh', 'tests/e2e/rh'], ['compras', 'tests/e2e/compras'], ['portais', 'tests/e2e/portais'], ['plataforma', 'tests/e2e/plataforma'],
];
const stats = FATIAS.map(([k, pasta]) => {
  const s = ler(`${DIR}/${k}.json`).stats;
  return { k, pasta: `${pasta} (não destrutivos)`, ...s, total: s.expected + s.unexpected + s.flaky };
});
// … e os destrutivos, UM por invocação com 60 s de intervalo, agregados por pasta na tabela.
const destrutivos = readdirSync(DIR).filter((f) => /^destrutivo-\d+\.json$/.test(f)).sort().map((f) => {
  const r = ler(`${DIR}/${f}`);
  const spec = (function achar(s) { for (const sp of s.specs || []) return sp; for (const c of s.suites || []) { const x = achar(c); if (x) return x; } })(r.suites[0]);
  return { arquivo: r.suites[0].file, stats: r.stats, spec };
});
const porPastaDestr = {};
for (const d of destrutivos) {
  const pasta = 'tests/' + d.arquivo.split('/').slice(0, -1).join('/');
  const p = (porPastaDestr[pasta] ??= { k: pasta, pasta: `${pasta} (destrutivos, 1 por invocação, 60 s entre eles)`, startTime: d.stats.startTime, duration: 0, expected: 0, unexpected: 0, flaky: 0, total: 0 });
  p.duration += d.stats.duration; p.expected += d.stats.expected; p.unexpected += d.stats.unexpected; p.flaky += d.stats.flaky; p.total += d.stats.expected + d.stats.unexpected + d.stats.flaky;
  if (d.stats.startTime < p.startTime) p.startTime = d.stats.startTime;
}
const linhas = [...stats, ...Object.values(porPastaDestr)];
const totais = linhas.reduce((a, s) => ({ total: a.total + s.total, ok: a.ok + s.expected, falhas: a.falhas + s.unexpected }), { total: 0, ok: 0, falhas: 0 });
if (totais.falhas !== falhas.length) throw new Error(`stats ${totais.falhas} ≠ falhas.json ${falhas.length}`);
if (destrutivos.length !== 47) throw new Error(`esperava 47 destrutivos, li ${destrutivos.length}`);

const escapar = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const md2html = (t) => escapar(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>').split(/\n\n+/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
const semP = (h) => h.replace(/^<p>|<\/p>$/g, '');

function analiseDe(f) {
  const chave = `${f.arquivo}:${f.linha}`;
  if (ANALISES[chave]) return ANALISES[chave];
  for (const [k, v] of Object.entries(ANALISES)) {
    const [b, frag] = k.split('|');
    if (b === chave && frag && f.titulo.includes(frag)) return v;
  }
  throw new Error(`sem análise para ${chave} › ${f.titulo}`);
}
function evidenciaDe(f) {
  const chave = `${f.arquivo}:${f.linha}`;
  if (EVIDENCIAS[chave]) return EVIDENCIAS[chave];
  for (const [k, v] of Object.entries(EVIDENCIAS)) {
    const [b, frag] = k.split('|');
    if (b === chave && frag && f.titulo.includes(frag)) return v;
  }
  throw new Error(`sem classificação de evidência para ${chave} › ${f.titulo}`);
}
for (const f of falhas) { f.analise = analiseDe(f); f.evidencia = evidenciaDe(f); }

const porNatureza = {}; const porGrupo = {};
for (const f of falhas) { porNatureza[f.analise.natureza] = (porNatureza[f.analise.natureza] ?? 0) + 1; porGrupo[f.analise.grupo] = (porGrupo[f.analise.grupo] ?? 0) + 1; }
const grupoDe = (id) => GRUPOS.find((g) => g.id === id);
const hora = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
const anexo = (f, nome) => f.anexos.find((a) => a.nome === nome)?.path;
const seedDe = (f) => f.anotacoes.find((a) => a.startsWith('faker-seed'))?.split(': ')[1];
const cmdRepro = (f) => `${seedDe(f) ? `FAKER_SEED=${seedDe(f)} ` : ''}npx playwright test ${f.arquivo.replace(/^e2e\//, 'tests/e2e/').replace(/^api\//, 'tests/api/')} -g ${JSON.stringify(f.titulo)}`;
const ordenadas = [...falhas].sort((a, b) => a.arquivo.localeCompare(b.arquivo) || a.linha - b.linha);
const idCartao = (f) => `f${ordenadas.indexOf(f)}`;
const leitura = LEITURA({ totais, porNatureza });

const linhaTabela = (s) => `<tr><td><code>${escapar(s.pasta)}</code></td><td>${hora(s.startTime)}</td><td>${(s.duration / 60000).toFixed(1)} min</td><td>${s.total}</td><td>${s.expected}</td><td>${s.unexpected ? `<b>${s.unexpected}</b>` : 0}</td></tr>`;

const sumarioHtml = `
<section class="sumario" id="sumario">
  <h2>Sumário executivo</h2>
  <dl class="meta">
    ${META.map(([k, v]) => `<div><dt>${escapar(k)}</dt><dd>${md2html(v).replace(/^<p>|<\/p>$/g, '')}</dd></div>`).join('\n    ')}
  </dl>
  <div class="numeros">
    <div class="numero"><b>${totais.total}</b><span>testes</span></div>
    <div class="numero"><b>${totais.ok}</b><span>verdes</span></div>
    <div class="numero"><b>${totais.falhas}</b><span>vermelhos</span></div>
    ${Object.entries(porNatureza).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="numero"><b>${v}</b><span>${escapar(NATUREZAS[k].rotulo)}</span></div>`).join('')}
  </div>

  <h3>Leitura em uma frase</h3>
  ${md2html(leitura)}

  <h3>Por causa raiz</h3>
  <table>
    <thead><tr><th>Grupo</th><th>Causa raiz</th><th>Natureza</th><th>Testes</th></tr></thead>
    <tbody>
    ${GRUPOS.map((g) => `<tr><td><a href="#${g.id}">${g.id}</a></td><td>${semP(md2html(g.titulo))}</td><td><span class="badge ${NATUREZAS[g.natureza].cor}">${escapar(NATUREZAS[g.natureza].rotulo)}</span></td><td>${porGrupo[g.id] ?? 0}${g.nota ? `<br><span class="g">${escapar(g.nota)}</span>` : ''}</td></tr>`).join('')}
    </tbody>
  </table>

  <h3>Por fatia de execução</h3>
  <table>
    <thead><tr><th>Fatia</th><th>Início</th><th>Duração</th><th>Testes</th><th>Verdes</th><th>Vermelhos</th></tr></thead>
    <tbody>
    ${linhas.map(linhaTabela).join('')}
    <tr><td><b>Total</b></td><td></td><td>${(linhas.reduce((a, s) => a + s.duration, 0) / 60000).toFixed(1)} min</td><td><b>${totais.total}</b></td><td><b>${totais.ok}</b></td><td><b>${totais.falhas}</b></td></tr>
    </tbody>
  </table>

  <h3>Medições suplementares (fora da execução principal)</h3>
  <ul>${SUPLEMENTARES.map((s) => `<li>${semP(md2html(s))}</li>`).join('\n')}</ul>

  <h3>Massa criada e limpeza</h3>
  ${md2html(MASSA)}

  <h3>Como ler os cartões</h3>
  <p>Cada cartão abaixo traz, além do que o gerador padrão já mostra (mensagem, trecho de código, screenshot, contexto,
  call log, aria-snapshot e comando de reprodução com a seed), uma seção <b>Análise</b> com: grupo de causa raiz, natureza,
  o que acontece, por que falha, onde falha e — quando houve — o resultado da reexecução. Trace e vídeo de cada falha estão
  gravados em <code>test-results-0903/&lt;fatia&gt;/…</code> (caminho no rodapé do cartão); abra com
  <code>npx playwright show-trace &lt;trace.zip&gt;</code>.</p>
</section>

<section class="sumario" id="grupos">
  <h2>Causas raiz, em detalhe</h2>
  ${GRUPOS.map((g) => `<article class="grupo" id="${g.id}">
    <h3><span class="gid">${g.id}</span> ${semP(md2html(g.titulo))}</h3>
    <p class="suave"><span class="badge ${NATUREZAS[g.natureza].cor}">${escapar(NATUREZAS[g.natureza].rotulo)}</span> · ${porGrupo[g.id] ?? 0} teste(s)</p>
    ${md2html(g.resumo)}
    <ul class="lista-testes">${falhas.filter((f) => f.analise.grupo === g.id).map((f) => `<li>${f.analise.id ? `<b>${escapar(nomeDoCaso(f.analise.id))}</b><br>` : ''}<a href="#${idCartao(f)}"><code>${escapar(f.arquivo)}:${f.linha}</code></a> — ${escapar(f.titulo)}${f.analise.rerun ? `<br><span class="g"><b>${escapar(REEXEC)}:</b> ${semP(md2html(f.analise.rerun))}</span>` : ''}</li>`).join('')}</ul>
  </article>`).join('')}
</section>`;

let html = base;
html = html.replace(/<div class="numeros">[\s\S]*?<\/div>\n<\/div>\n<main>/, '</div>\n<main>');
html = html.replace(/Execução de [^·]+· \d+ testes, \d+ reprovados · destrutivos incluídos/, `Execução de 03/09/2026 · ${totais.total} testes, ${totais.falhas} reprovados · destrutivos incluídos · com análise de causa raiz`);
html = html.replace('<title>Falhas da suíte E2E — Fluig Cassi</title>', '<title>Falhas da suíte E2E — Fluig Cassi — 03/09/2026</title>');
html = html.replace('</style>', `  .badge.divergencia { background:#0ea5e9; color:#06202b; }
  .sumario { background:var(--cartao); border:1px solid var(--borda); border-radius:14px; padding:20px 24px; margin-bottom:22px; }
  .sumario h2 { margin:0 0 12px; font-size:20px; }
  .sumario h3 { margin:18px 0 8px; font-size:14px; text-transform:uppercase; letter-spacing:.05em; color:var(--suave); }
  .sumario table { border-collapse:collapse; width:100%; font-size:13.5px; }
  .sumario th, .sumario td { border-bottom:1px solid var(--borda); padding:6px 8px; text-align:left; vertical-align:top; }
  .sumario th { color:var(--suave); font-size:12px; text-transform:uppercase; letter-spacing:.04em; }
  .grupo { border-top:1px solid var(--borda); padding-top:14px; margin-top:14px; }
  .grupo h3 { text-transform:none; letter-spacing:0; font-size:16px; color:var(--texto); margin:0 0 6px; }
  .gid { display:inline-block; background:var(--codigo); border:1px solid var(--borda); border-radius:6px; padding:0 6px; font-size:12px; margin-right:6px; }
  .suave { color:var(--suave); font-size:13px; margin:0 0 8px; }
  .lista-testes { font-size:13px; color:var(--suave); }
  .analise { border-left:3px solid #0ea5e9; padding-left:14px; }
  .analise p { margin:0 0 8px; }
  .analise .g, .g { color:var(--suave); font-size:13px; }
  .evid-prova { background:rgba(34,197,94,.10); border-left:3px solid #22c55e; border-radius:8px; padding:8px 12px; margin:10px 0 0; font-size:13px; }
  .evid-ctx { background:rgba(245,158,11,.10); border-left:3px solid #f59e0b; border-radius:8px; padding:8px 12px; margin:10px 0 0; font-size:13px; }
  .caso { background:var(--codigo); border:1px solid var(--borda); border-left:3px solid #0ea5e9; border-radius:8px; padding:8px 12px; margin:0 0 10px; font-size:13.5px; }
</style>`);
html = html.replace('<main>\n', `<main>\n${sumarioHtml}\n`);
const botoesNatureza = Object.entries(porNatureza).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<button data-filtro="classe:${k}" aria-pressed="false">${escapar(NATUREZAS[k].rotulo)} (${v})</button>`).join('');
html = html.replace('<div class="filtros" id="filtros">', `<h2 id="cartoes">Os ${totais.falhas} testes que reprovaram, um a um</h2>\n  <div class="filtros" id="filtros">${botoesNatureza}`);
html = html.replace("const mostrar = filtro === 'todos' || cartao.dataset.area === filtro.slice(5);", "const mostrar = filtro === 'todos' || (filtro.startsWith('area:') && cartao.dataset.area === filtro.slice(5)) || (filtro.startsWith('classe:') && cartao.dataset.classe === filtro.slice(7));");

const partes = html.split('<article class="falha"');
let injetados = 0;
for (let i = 1; i < partes.length; i++) {
  let p = partes[i];
  const m = p.match(/<code>([^<]+?):(\d+)<\/code>/);
  const t = p.match(/<h2>([\s\S]*?)<\/h2>/);
  if (!m || !t) throw new Error('cartão sem arquivo/título');
  const titulo = t[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const f = falhas.find((x) => x.arquivo === m[1] && x.linha === Number(m[2]) && x.titulo === titulo);
  if (!f) throw new Error(`cartão sem falha correspondente: ${m[1]}:${m[2]} ${titulo}`);
  const a = f.analise; const nat = NATUREZAS[a.natureza]; const g = grupoDe(a.grupo);
  p = p.replace(/^ id="(f\d+)" data-classe="[^"]*"/, ` id="$1" data-classe="${a.natureza}"`);
  p = p.replace(/<span class="badge [^"]*">[^<]*<\/span>/, `<span class="badge ${nat.cor}">${escapar(nat.rotulo)}</span>`);
  const bloco = `
  <section class="bloco analise">
    <h3>Análise</h3>
    ${a.id ? `<p class="caso"><b>Caso de teste:</b> ${semP(md2html(nomeDoCaso(a.id)))}</p>` : ''}
    <p class="g"><b>Causa raiz:</b> <a href="#${g.id}">${g.id}</a> — ${semP(md2html(g.titulo))}</p>
    <p><b>O que acontece:</b> ${semP(md2html(a.oQueAcontece))}</p>
    <p><b>Por que falha:</b> ${semP(md2html(a.porQue))}</p>
    <p><b>Onde falha:</b> ${semP(md2html(a.onde))}${f.erroLocal ? ` <span class="g">(local exato registrado pelo Playwright: <code>${escapar(f.erroLocal.file.replace(process.cwd() + '/', ''))}:${f.erroLocal.line}</code>)</span>` : ''}</p>
    ${a.rerun ? `<p><b>${escapar(REEXEC)}:</b> ${semP(md2html(a.rerun))}</p>` : ''}
    <p class="${f.evidencia.tipo === 'tela' ? 'evid-prova' : 'evid-ctx'}"><b>${f.evidencia.tipo === 'tela' ? 'A screenshot abaixo É a evidência' : 'Atenção — a screenshot abaixo é CONTEXTO, não a prova'}:</b> ${f.evidencia.tipo === 'tela' ? 'o defeito descrito acima é visível na captura.' : `o defeito descrito acima não é visualmente observável. A prova é ${semP(md2html(f.evidencia.prova))}`}</p>
  </section>`;
  p = p.replace('</header>', `</header>${bloco}`);
  p = p.replace(/<h3>Tela no momento da falha<\/h3>/g, f.evidencia.tipo === 'tela'
    ? '<h3>Tela no momento da falha — esta é a evidência do defeito</h3>'
    : '<h3>Tela no momento da falha — contexto, não prova</h3>');
  const trace = anexo(f, 'trace'), video = anexo(f, 'video'), shot = anexo(f, 'screenshot'), ctx = anexo(f, 'error-context');
  const evid = `<p class="dica"><b>Artefatos desta falha:</b>${shot ? ` screenshot <code>${escapar(shot)}</code> ·` : ''}${trace ? ` trace <code>${escapar(trace)}</code> ·` : ''}${video ? ` vídeo <code>${escapar(video)}</code> ·` : ''}${ctx ? ` aria-snapshot <code>${escapar(ctx)}</code>` : ''}</p>`;
  p = p.replace(/<p class="dica">\s*(Trace|Vídeo|vídeo|sem trace)[\s\S]*?<\/p>/, evid);
  partes[i] = p; injetados++;
}
if (injetados !== falhas.length) throw new Error(`injetados ${injetados} ≠ ${falhas.length}`);
html = partes.join('<article class="falha"');
html = html.replace(/<footer>[\s\S]*?<\/footer>/, `<footer>
  <p>Relatório da execução de 03/09/2026 — gerado por <code>scripts/relatorio-falhas.mjs</code> (evidências) +
  <code>relatorios-2026-09-03/gerar-final.mjs</code> (análise). Screenshots e aria-snapshots estão embutidos; trace e vídeo de cada
  falha ficam em <code>test-results-0903/&lt;fatia&gt;/</code> nos caminhos indicados em cada cartão
  (<code>npx playwright show-trace &lt;trace.zip&gt;</code>).</p>
</footer>`);
writeFileSync(`relatorio-falhas-${DATA}.html`, html);

// ───────────────────────────── Markdown ─────────────────────────────
const mdErro = (f) => { const e = (f.erro || '').split('\n'); const idx = e.findIndex((l) => l.startsWith('Call log:')); const corpo = (idx === -1 ? e : e.slice(0, idx)).join('\n').trim(); return corpo.length > 1600 ? corpo.slice(0, 1600) + '\n…' : corpo; };
let mdTxt = `# Falhas da suíte E2E — TOTVS Fluig Cassi — execução de 03/09/2026

| | |
|---|---|
${META.map(([k, v]) => `| **${k}** | ${v} |`).join('\n')}
| **Resultado** | **${totais.total} testes · ${totais.ok} verdes · ${totais.falhas} vermelhos** |

> A versão HTML deste documento (\`relatorio-falhas-${DATA}.html\`) traz as screenshots, o trecho de código,
> o aria-snapshot e o call log embutidos em cada cartão. Este Markdown tem a mesma análise e aponta os artefatos por caminho.

## Leitura em uma frase

${leitura}

## Por natureza

| Natureza | Testes |
|---|---|
${Object.entries(porNatureza).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${NATUREZAS[k].rotulo} | ${v} |`).join('\n')}

## Por causa raiz

| Grupo | Causa raiz | Natureza | Testes |
|---|---|---|---|
${GRUPOS.map((g) => `| ${g.id} | ${g.titulo} | ${NATUREZAS[g.natureza].rotulo} | ${porGrupo[g.id] ?? 0}${g.nota ? ` (${g.nota})` : ''} |`).join('\n')}

## Por fatia de execução

| Fatia | Início | Duração | Testes | Verdes | Vermelhos |
|---|---|---|---|---|---|
${linhas.map((s) => `| \`${s.pasta}\` | ${hora(s.startTime)} | ${(s.duration / 60000).toFixed(1)} min | ${s.total} | ${s.expected} | ${s.unexpected} |`).join('\n')}
| **Total** | | ${(linhas.reduce((a, s) => a + s.duration, 0) / 60000).toFixed(1)} min | **${totais.total}** | **${totais.ok}** | **${totais.falhas}** |

## Medições suplementares (fora da execução principal)

${SUPLEMENTARES.map((s) => `- ${s}`).join('\n')}

## Massa criada e limpeza

${MASSA}

## Causas raiz, em detalhe

${GRUPOS.map((g) => `### ${g.id} — ${g.titulo}

*${NATUREZAS[g.natureza].rotulo} · ${porGrupo[g.id] ?? 0} teste(s)*

${g.resumo}

Testes:
${falhas.filter((f) => f.analise.grupo === g.id).map((f) => `- ${f.analise.id ? `**${nomeDoCaso(f.analise.id)}**\n  - ` : ''}\`${f.arquivo}:${f.linha}\` — ${f.titulo}${f.analise.rerun ? `\n  - ${REEXEC}: ${f.analise.rerun}` : ''}`).join('\n') || '- (nenhum na execução principal)'}
`).join('\n')}

## Os ${totais.falhas} testes que reprovaram, um a um

${ordenadas.map((f, i) => { const a = f.analise; return `### ${i + 1}. ${f.titulo}

- **Arquivo:** \`${f.arquivo}:${f.linha}\` · **Suíte:** ${f.suite} · **Duração:** ${(f.duracaoMs / 1000).toFixed(1)} s${f.tags.length ? ` · **Tags:** ${f.tags.join(', ')}` : ''}
- **Natureza:** ${NATUREZAS[a.natureza].rotulo}
${a.id ? `- **Caso de teste:** ${nomeDoCaso(a.id)}\n` : ''}- **Causa raiz:** ${a.grupo} — ${grupoDe(a.grupo).titulo}
- **O que acontece:** ${a.oQueAcontece}
- **Por que falha:** ${a.porQue}
- **Onde falha:** ${a.onde}${f.erroLocal ? ` (local exato: \`${f.erroLocal.file.replace(process.cwd() + '/', '')}:${f.erroLocal.line}\`)` : ''}
${a.rerun ? `- **${REEXEC}:** ${a.rerun}\n` : ''}- **Valor da screenshot:** ${f.evidencia.tipo === 'tela' ? '**é a evidência** — o defeito é visível na captura.' : `**contexto, não prova** — o defeito não é visualmente observável. A prova é ${f.evidencia.prova}`}

**Mensagem da falha:**

\`\`\`
${mdErro(f)}
\`\`\`

**Evidências:**${anexo(f, 'screenshot') ? `\n- screenshot: \`${anexo(f, 'screenshot')}\`` : '\n- (teste de API — sem tela; a evidência é a resposta do endpoint na mensagem acima)'}${anexo(f, 'trace') ? `\n- trace: \`${anexo(f, 'trace')}\`` : ''}${anexo(f, 'video') ? `\n- vídeo: \`${anexo(f, 'video')}\`` : ''}${anexo(f, 'error-context') ? `\n- aria-snapshot: \`${anexo(f, 'error-context')}\`` : ''}
${f.anexos.filter((x) => x.corpo && !/screenshot|video|trace|contexto-da-falha|sem-captura|error-context/.test(x.nome)).map((x) => `- anexo do teste \`${x.nome}\`:\n\n  \`\`\`json\n  ${x.corpo.slice(0, 1200).replace(/\n/g, '\n  ')}\n  \`\`\``).join('\n')}
**Reproduzir:** \`${cmdRepro(f)}\`
`; }).join('\n---\n\n')}
`;
writeFileSync(`relatorio-falhas-${DATA}.md`, mdTxt);
console.log(`HTML ${(Buffer.byteLength(html) / 1048576).toFixed(1)} MB · MD ${(Buffer.byteLength(mdTxt) / 1024).toFixed(0)} KB · ${falhas.length} falhas · naturezas ${JSON.stringify(porNatureza)} · grupos ${JSON.stringify(porGrupo)}`);
