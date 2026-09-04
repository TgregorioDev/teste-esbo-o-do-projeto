// Gera o documento final da execução de 02/09/2026: injeta a camada de análise
// (relatorios/analise.mjs) no HTML produzido por scripts/relatorio-falhas.mjs e emite
// também a versão Markdown.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { NATUREZAS, GRUPOS, ANALISES } from './analise.mjs';

const ler = (p) => JSON.parse(readFileSync(p, 'utf8'));
const falhas = ler('relatorios/falhas.json');
const extraAditivo = ler('relatorios/falhas-extra.json');
const base = readFileSync('relatorios/base.html', 'utf8');

const FATIAS = [
  ['auth', 'autenticacao (login real)', 'tests/e2e/auth'],
  ['api', 'api', 'tests/api'],
  ['acomp', 'acompanhamento-contratos', 'tests/e2e/acompanhamento-contratos'],
  ['financeiro', 'financeiro', 'tests/e2e/financeiro'],
  ['saude', 'saude', 'tests/e2e/saude'],
  ['notificacoes', 'notificacoes', 'tests/e2e/notificacoes'],
  ['fiscal', 'fiscal', 'tests/e2e/fiscal'],
  ['juridico', 'juridico', 'tests/e2e/juridico'],
  ['seguranca', 'seguranca', 'tests/e2e/seguranca'],
  ['contratos', 'contratos', 'tests/e2e/contratos'],
  ['tarefas', 'tarefas', 'tests/e2e/tarefas'],
  ['documentos', 'documentos', 'tests/e2e/documentos'],
  ['rh', 'rh', 'tests/e2e/rh'],
  ['compras', 'compras', 'tests/e2e/compras'],
  ['portais', 'portais', 'tests/e2e/portais'],
  ['plataforma', 'plataforma', 'tests/e2e/plataforma'],
];
const stats = FATIAS.map(([k, nome, pasta]) => {
  const s = ler(`relatorios/${k}.json`).stats;
  return { k, nome, pasta, ...s, total: s.expected + s.unexpected + s.flaky };
});
const totais = stats.reduce(
  (a, s) => ({ total: a.total + s.total, ok: a.ok + s.expected, falhas: a.falhas + s.unexpected }),
  { total: 0, ok: 0, falhas: 0 },
);
if (totais.falhas !== falhas.length) throw new Error(`stats ${totais.falhas} ≠ falhas.json ${falhas.length}`);

const escapar = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Markdown mínimo (negrito, código, quebra de parágrafo) → HTML. */
const md2html = (t) =>
  escapar(t)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

function analiseDe(f) {
  const chave = `${f.arquivo}:${f.linha}`;
  if (ANALISES[chave]) return ANALISES[chave];
  for (const [k, v] of Object.entries(ANALISES)) {
    const [base, frag] = k.split('|');
    if (base === chave && frag && f.titulo.includes(frag)) return v;
  }
  throw new Error(`sem análise para ${chave} › ${f.titulo}`);
}
for (const f of falhas) f.analise = analiseDe(f);

const porNatureza = {};
const porGrupo = {};
for (const f of falhas) {
  porNatureza[f.analise.natureza] = (porNatureza[f.analise.natureza] ?? 0) + 1;
  porGrupo[f.analise.grupo] = (porGrupo[f.analise.grupo] ?? 0) + 1;
}
const grupoDe = (id) => GRUPOS.find((g) => g.id === id);

const hora = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
const anexo = (f, nome) => f.anexos.find((a) => a.nome === nome)?.path;
const cmdRepro = (f) =>
  `${f.anotacoes.find((a) => a.startsWith('faker-seed')) ? `FAKER_SEED=${f.anotacoes.find((a) => a.startsWith('faker-seed')).split(': ')[1]} ` : ''}npx playwright test ${f.arquivo.replace(/^e2e\//, 'tests/e2e/').replace(/^api\//, 'tests/api/')} -g ${JSON.stringify(f.titulo)}`;

// ids dos cartões no base.html: #f0, #f1… na ordem arquivo/linha
const ordenadas = [...falhas].sort((a, b) => a.arquivo.localeCompare(b.arquivo) || a.linha - b.linha);
function idCartao(f) {
  return `f${ordenadas.indexOf(f)}`;
}

const extraPassaram = extraAditivo.filter((x) => x.status === 'passed').length;
const extraFalharam = extraAditivo.filter((x) => x.status !== 'passed').length;

// ───────────────────────────── sumário (HTML) ─────────────────────────────
const sumarioHtml = `
<section class="sumario" id="sumario">
  <h2>Sumário executivo</h2>
  <dl class="meta">
    <div><dt>Data</dt><dd>02/09/2026, 14h55–15h40 (BRT)</dd></div>
    <div><dt>Ambiente</dt><dd><code>https://caixade182374.fluig.cloudtotvs.com.br</code> · usuário <code>TOTVS-FS</code></dd></div>
    <div><dt>Commit</dt><dd><code>aab374b</code> (branch <code>emdash/teste-2-jxzxn</code>)</dd></div>
    <div><dt>Runtime</dt><dd>Playwright 1.62.1 · Node 22.22.2 · Chromium (Desktop Chrome, pt-BR)</dd></div>
    <div><dt>Modo</dt><dd>execução completa, <b>destrutivos incluídos</b>, sem retry, 16 fatias sequenciais (uma pasta por invocação)</dd></div>
  </dl>
  <div class="numeros">
    <div class="numero"><b>${totais.total}</b><span>testes</span></div>
    <div class="numero"><b>${totais.ok}</b><span>verdes</span></div>
    <div class="numero"><b>${totais.falhas}</b><span>vermelhos</span></div>
    ${Object.entries(porNatureza)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `<div class="numero"><b>${v}</b><span>${escapar(NATUREZAS[k].rotulo)}</span></div>`)
      .join('')}
  </div>

  <h3>Leitura em uma frase</h3>
  <p>Das <b>${totais.falhas}</b> falhas, <b>24</b> são uma única divergência de ambiente (o combo "Tipo de Solicitação"
  perdeu a opção que a suíte usa) e mascaram o veredito real — reexecutadas com a opção existente, <b>9 passam e 15
  reprovam por defeito próprio</b>. Das demais <b>57</b>, <b>${porNatureza.catalogado - 0}</b> são defeitos já catalogados no README
  (vermelhos intencionais), <b>${porNatureza.novo}</b> são defeitos não catalogados, <b>${porNatureza.precondicao}</b> são pré-condição
  ausente (latência do BPMN e filas vazias), <b>${porNatureza.divergencia - 24}</b> são outras divergências de ambiente
  (catálogo de processos mudou, lista de tipos), e <b>${(porNatureza.semVeredito ?? 0) + (porNatureza.naoDeterministico ?? 0)}</b> ficaram sem veredito / não determinísticas.
  Nenhuma falha foi atribuída a erro de código da suíte.</p>

  <h3>Por causa raiz</h3>
  <table>
    <thead><tr><th>Grupo</th><th>Causa raiz</th><th>Natureza</th><th>Testes</th></tr></thead>
    <tbody>
    ${GRUPOS.map(
      (g) => `<tr><td><a href="#${g.id}">${g.id}</a></td><td>${md2html(g.titulo)}</td><td><span class="badge ${NATUREZAS[g.natureza].cor}">${escapar(NATUREZAS[g.natureza].rotulo)}</span></td><td>${porGrupo[g.id] ?? 0}${g.nota ? `<br><span class="g">${escapar(g.nota)}</span>` : ''}</td></tr>`,
    ).join('')}
    </tbody>
  </table>

  <h3>Por fatia de execução</h3>
  <table>
    <thead><tr><th>Fatia</th><th>Início</th><th>Duração</th><th>Testes</th><th>Verdes</th><th>Vermelhos</th></tr></thead>
    <tbody>
    ${stats.map((s) => `<tr><td><code>${s.pasta}</code></td><td>${hora(s.startTime)}</td><td>${(s.duration / 1000 / 60).toFixed(1)} min</td><td>${s.total}</td><td>${s.expected}</td><td>${s.unexpected ? `<b>${s.unexpected}</b>` : 0}</td></tr>`).join('')}
    <tr><td><b>Total</b></td><td></td><td>${(stats.reduce((a, s) => a + s.duration, 0) / 1000 / 60).toFixed(1)} min</td><td><b>${totais.total}</b></td><td><b>${totais.ok}</b></td><td><b>${totais.falhas}</b></td></tr>
    </tbody>
  </table>

  <h3>Medições suplementares (fora da execução principal)</h3>
  <ul>
    <li><b>Reexecução de <code>acompanhamento-contratos</code> com tipo "Aditivo Contratual"</b> (15h23, factory editada
    temporariamente e revertida; nada commitado): 41 testes, <b>${extraPassaram} verdes, ${extraFalharam} vermelhos</b>. Os 3 vermelhos que já não
    dependiam do combo repetiram; dos 24 mascarados, 9 passaram e 15 reprovaram com veredito próprio — registrado em cada cartão.</li>
    <li><b>Reexecução isolada dos 6 testes de pré-condição</b> (15h35, sem carga concorrente): os 6 reprovaram de novo pelo mesmo motivo
    (SCs 113187–113191 presas em "Grava SC e Anexos" por 180 s; pool com 0 tarefas).</li>
    <li><b><code>.bat</code> (CT-GED-02-S2)</b>: 1ª execução caiu por <code>net::ERR_NETWORK_CHANGED</code> (infra); 2ª esbarrou em linhas
    residuais do publicador; 3ª <b>confirmou o defeito</b> (publicado sem bloqueio).</li>
  </ul>

  <h3>Massa criada e limpeza</h3>
  <p>O livro-razão <code>test-results/criados.jsonl</code> registrou 34 registros criados pelos testes destrutivos ao longo
  das invocações (SCs #113162–#113191, medição, documentos no GED, favoritos). O <code>globalTeardown</code> rodou ao fim de cada
  invocação e cancelou o que aquela invocação criou; o que o cancelamento não alcança está descrito em
  <code>docs/cancelamento-de-massa.md</code>.</p>

  <h3>Como ler os cartões</h3>
  <p>Cada cartão abaixo traz, além do que o gerador padrão já mostra (mensagem, trecho de código, screenshot, contexto,
  call log, aria-snapshot e comando de reprodução com a seed), uma seção <b>Análise</b> com: grupo de causa raiz, natureza,
  o que acontece, por que falha, onde falha e — quando houve — o resultado da reexecução. Trace e vídeo de cada falha estão
  gravados em <code>test-results/&lt;fatia&gt;/…</code> (caminho no rodapé do cartão); abra com
  <code>npx playwright show-trace &lt;trace.zip&gt;</code>.</p>
</section>

<section class="sumario" id="grupos">
  <h2>Causas raiz, em detalhe</h2>
  ${GRUPOS.map(
    (g) => `<article class="grupo" id="${g.id}">
    <h3><span class="gid">${g.id}</span> ${md2html(g.titulo).replace(/^<p>|<\/p>$/g, '')}</h3>
    <p class="suave"><span class="badge ${NATUREZAS[g.natureza].cor}">${escapar(NATUREZAS[g.natureza].rotulo)}</span> · ${porGrupo[g.id] ?? 0} teste(s)</p>
    ${md2html(g.resumo)}
    <ul class="lista-testes">${falhas
      .filter((f) => f.analise.grupo === g.id)
      .map((f) => `<li><a href="#${idCartao(f)}"><code>${escapar(f.arquivo)}:${f.linha}</code></a> — ${escapar(f.titulo)}</li>`)
      .join('')}</ul>
    ${g.reexec ? `<p class="suave">Testes deste grupo mascarados por G1 na execução principal (veredito obtido na reexecução com "Aditivo Contratual"):</p><ul class="lista-testes">${g.reexec
      .map((k) => { const f = falhas.find((x) => `${x.arquivo}:${x.linha}` === k); return `<li><a href="#${idCartao(f)}"><code>${escapar(k)}</code></a> — ${escapar(f.titulo)}<br><span class="g">${md2html(f.analise.rerun).replace(/^<p>|<\/p>$/g, '')}</span></li>`; })
      .join('')}</ul>` : ''}
  </article>`,
  ).join('')}
</section>`;


// ───────────────────────────── injeção por cartão ─────────────────────────────
let html = base;

// cabeçalho da capa
html = html.replace(/<div class="numeros">[\s\S]*?<\/div>\n<\/div>\n<main>/, '</div>\n<main>');
html = html.replace(/Execução de [^·]+· \d+ testes, \d+ reprovados · destrutivos incluídos/, `Execução de 02/09/2026 · ${totais.total} testes, ${totais.falhas} reprovados · destrutivos incluídos · com análise de causa raiz`);
html = html.replace('<title>Falhas da suíte E2E — Fluig Cassi</title>', '<title>Falhas da suíte E2E — Fluig Cassi — 02/09/2026</title>');

// CSS extra
html = html.replace(
  '</style>',
  `  .badge.divergencia { background:#0ea5e9; color:#06202b; }
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
</style>`,
);

// sumário logo após <main>
html = html.replace('<main>\n', `<main>\n${sumarioHtml}\n`);

// filtros por natureza
const botoesNatureza = Object.entries(porNatureza)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `<button data-filtro="classe:${k}" aria-pressed="false">${escapar(NATUREZAS[k].rotulo)} (${v})</button>`)
  .join('');
html = html.replace('<div class="filtros" id="filtros">', `<h2 id="cartoes">Os ${totais.falhas} testes que reprovaram, um a um</h2>\n  <div class="filtros" id="filtros">${botoesNatureza}`);
html = html.replace(
  "const mostrar = filtro === 'todos' || cartao.dataset.area === filtro.slice(5);",
  "const mostrar = filtro === 'todos' || (filtro.startsWith('area:') && cartao.dataset.area === filtro.slice(5)) || (filtro.startsWith('classe:') && cartao.dataset.classe === filtro.slice(7));",
);

// cartões
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
  const a = f.analise;
  const nat = NATUREZAS[a.natureza];
  const g = grupoDe(a.grupo);

  p = p.replace(/^ id="(f\d+)" data-classe="[^"]*"/, ` id="$1" data-classe="${a.natureza}"`);
  p = p.replace(/<span class="badge [^"]*">[^<]*<\/span>/, `<span class="badge ${nat.cor}">${escapar(nat.rotulo)}</span>`);

  const bloco = `
  <section class="bloco analise">
    <h3>Análise</h3>
    <p class="g"><b>Causa raiz:</b> <a href="#${g.id}">${g.id}</a> — ${md2html(g.titulo).replace(/^<p>|<\/p>$/g, '')}${a.id ? ` · <b>Referência:</b> ${escapar(a.id)}` : ''}</p>
    <p><b>O que acontece:</b> ${md2html(a.oQueAcontece).replace(/^<p>|<\/p>$/g, '')}</p>
    <p><b>Por que falha:</b> ${md2html(a.porQue).replace(/^<p>|<\/p>$/g, '')}</p>
    <p><b>Onde falha:</b> ${md2html(a.onde).replace(/^<p>|<\/p>$/g, '')}${f.erroLocal ? ` <span class="g">(local exato registrado pelo Playwright: <code>${escapar(f.erroLocal.file.replace(process.cwd() + '/', ''))}:${f.erroLocal.line}</code>)</span>` : ''}</p>
    ${a.rerun ? `<p><b>Reexecução com "Aditivo Contratual":</b> ${md2html(a.rerun).replace(/^<p>|<\/p>$/g, '')}</p>` : ''}
  </section>`;
  p = p.replace('</header>', `</header>${bloco}`);

  const trace = anexo(f, 'trace');
  const video = anexo(f, 'video');
  const shot = anexo(f, 'screenshot');
  const ctx = anexo(f, 'error-context');
  const evid = `<p class="dica"><b>Artefatos desta falha:</b>${shot ? ` screenshot <code>${escapar(shot)}</code> ·` : ''}${trace ? ` trace <code>${escapar(trace)}</code> ·` : ''}${video ? ` vídeo <code>${escapar(video)}</code> ·` : ''}${ctx ? ` aria-snapshot <code>${escapar(ctx)}</code>` : ''}</p>`;
  p = p.replace(/<p class="dica">\s*(Trace|Vídeo|vídeo|sem trace)[\s\S]*?<\/p>/, evid);

  partes[i] = p;
  injetados++;
}
if (injetados !== falhas.length) throw new Error(`injetados ${injetados} ≠ ${falhas.length}`);
html = partes.join('<article class="falha"');

html = html.replace(
  /<footer>[\s\S]*?<\/footer>/,
  `<footer>
  <p>Relatório da execução de 02/09/2026 — gerado por <code>scripts/relatorio-falhas.mjs</code> (evidências) +
  <code>relatorios/gerar-final.mjs</code> (análise). Screenshots e aria-snapshots estão embutidos; trace e vídeo de cada
  falha ficam em <code>test-results/&lt;fatia&gt;/</code> nos caminhos indicados em cada cartão
  (<code>npx playwright show-trace &lt;trace.zip&gt;</code>).</p>
</footer>`,
);

writeFileSync('relatorio-falhas-2026-09-02.html', html);

// ───────────────────────────── Markdown ─────────────────────────────
const mdErro = (f) => {
  const e = (f.erro || '').split('\n');
  const idx = e.findIndex((l) => l.startsWith('Call log:'));
  const corpo = (idx === -1 ? e : e.slice(0, idx)).join('\n').trim();
  return corpo.length > 1600 ? corpo.slice(0, 1600) + '\n…' : corpo;
};
let mdTxt = `# Falhas da suíte E2E — TOTVS Fluig Cassi — execução de 02/09/2026

| | |
|---|---|
| **Data** | 02/09/2026, 14h55–15h40 (BRT) |
| **Ambiente** | \`https://caixade182374.fluig.cloudtotvs.com.br\` · usuário \`TOTVS-FS\` |
| **Commit** | \`aab374b\` (branch \`emdash/teste-2-jxzxn\`) |
| **Runtime** | Playwright 1.62.1 · Node 22.22.2 · Chromium (Desktop Chrome, pt-BR) |
| **Modo** | execução completa, **destrutivos incluídos**, sem retry, 16 fatias sequenciais |
| **Resultado** | **${totais.total} testes · ${totais.ok} verdes · ${totais.falhas} vermelhos** |

> A versão HTML deste documento (\`relatorio-falhas-2026-09-02.html\`) traz as screenshots, o trecho de código,
> o aria-snapshot e o call log embutidos em cada cartão. Este Markdown tem a mesma análise e aponta os artefatos por caminho.

## Leitura em uma frase

Das **${totais.falhas}** falhas, **24** são uma única divergência de ambiente (o combo "Tipo de Solicitação" perdeu a opção
"Renovação Contratual", que a suíte usa) e mascaram o veredito real — reexecutadas com "Aditivo Contratual", **9 passam e
15 reprovam por defeito próprio**. Das demais **57**: **${porNatureza.catalogado}** defeitos já catalogados no README (vermelhos
intencionais), **${porNatureza.novo}** defeitos não catalogados, **${porNatureza.precondicao}** pré-condições ausentes (latência do BPMN, filas vazias),
**${porNatureza.divergencia - 24}** outras divergências de ambiente (catálogo de processos mudou; lista de tipos do modal) e
**${(porNatureza.semVeredito ?? 0) + (porNatureza.naoDeterministico ?? 0)}** sem veredito / não determinísticas. Nenhuma falha foi atribuída a erro de código da suíte.

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
${stats.map((s) => `| \`${s.pasta}\` | ${hora(s.startTime)} | ${(s.duration / 60000).toFixed(1)} min | ${s.total} | ${s.expected} | ${s.unexpected} |`).join('\n')}
| **Total** | | ${(stats.reduce((a, s) => a + s.duration, 0) / 60000).toFixed(1)} min | **${totais.total}** | **${totais.ok}** | **${totais.falhas}** |

## Medições suplementares (fora da execução principal)

- **Reexecução de \`acompanhamento-contratos\` com tipo "Aditivo Contratual"** (15h23; factory editada temporariamente e revertida, nada commitado): 41 testes, **${extraPassaram} verdes, ${extraFalharam} vermelhos**. Dos 24 mascarados pelo combo, 9 passaram e 15 reprovaram com veredito próprio (ver campo "Reexecução" em cada caso).
- **Reexecução isolada dos 6 testes de pré-condição** (15h35, sem carga concorrente): os 6 reprovaram de novo pelo mesmo motivo (SCs 113187–113191 presas em "Grava SC e Anexos" por 180 s; pool com 0 tarefas).
- **\`.bat\` (CT-GED-02-S2)**: 1ª execução caiu por \`net::ERR_NETWORK_CHANGED\` (infra); 2ª esbarrou em linhas residuais do publicador; 3ª **confirmou o defeito** (publicado sem bloqueio).

## Massa criada e limpeza

O livro-razão \`test-results/criados.jsonl\` registrou 34 registros criados pelos testes destrutivos (SCs #113162–#113191, medição, documentos no GED, favoritos). O \`globalTeardown\` rodou ao fim de cada invocação e cancelou o que aquela invocação criou; o que o cancelamento não alcança está em \`docs/cancelamento-de-massa.md\`.

## Causas raiz, em detalhe

${GRUPOS.map(
  (g) => `### ${g.id} — ${g.titulo}

*${NATUREZAS[g.natureza].rotulo} · ${porGrupo[g.id] ?? 0} teste(s)*

${g.resumo}

Testes:
${falhas.filter((f) => f.analise.grupo === g.id).map((f) => `- \`${f.arquivo}:${f.linha}\` — ${f.titulo}`).join('\n') || '- (nenhum na execução principal)'}
${g.reexec ? `\nTestes deste grupo mascarados por G1 na execução principal (veredito da reexecução com "Aditivo Contratual"):\n${g.reexec.map((k) => { const f = falhas.find((x) => `${x.arquivo}:${x.linha}` === k); return `- \`${k}\` — ${f.titulo}\n  - ${f.analise.rerun}`; }).join('\n')}\n` : ''}`,
).join('\n')}

## Os ${totais.falhas} testes que reprovaram, um a um

${ordenadas
  .map((f, i) => {
    const a = f.analise;
    return `### ${i + 1}. ${f.titulo}

- **Arquivo:** \`${f.arquivo}:${f.linha}\` · **Suíte:** ${f.suite} · **Duração:** ${(f.duracaoMs / 1000).toFixed(1)} s${f.tags.length ? ` · **Tags:** ${f.tags.join(', ')}` : ''}
- **Natureza:** ${NATUREZAS[a.natureza].rotulo}
- **Causa raiz:** ${a.grupo} — ${grupoDe(a.grupo).titulo}${a.id ? ` · **Referência:** ${a.id}` : ''}
- **O que acontece:** ${a.oQueAcontece}
- **Por que falha:** ${a.porQue}
- **Onde falha:** ${a.onde}${f.erroLocal ? ` (local exato: \`${f.erroLocal.file.replace(process.cwd() + '/', '')}:${f.erroLocal.line}\`)` : ''}
${a.rerun ? `- **Reexecução com "Aditivo Contratual":** ${a.rerun}\n` : ''}
**Mensagem da falha:**

\`\`\`
${mdErro(f)}
\`\`\`

**Evidências:**${anexo(f, 'screenshot') ? `\n- screenshot: \`${anexo(f, 'screenshot')}\`` : '\n- (teste de API — sem tela; a evidência é a resposta do endpoint na mensagem acima)'}${anexo(f, 'trace') ? `\n- trace: \`${anexo(f, 'trace')}\`` : ''}${anexo(f, 'video') ? `\n- vídeo: \`${anexo(f, 'video')}\`` : ''}${anexo(f, 'error-context') ? `\n- aria-snapshot: \`${anexo(f, 'error-context')}\`` : ''}
${f.anexos.filter((x) => x.corpo && !/screenshot|video|trace|contexto-da-falha|sem-captura|error-context/.test(x.nome)).map((x) => `- anexo do teste \`${x.nome}\`:\n\n  \`\`\`json\n  ${x.corpo.slice(0, 1200).replace(/\n/g, '\n  ')}\n  \`\`\``).join('\n')}
**Reproduzir:** \`${cmdRepro(f)}\`
`;
  })
  .join('\n---\n\n')}
`;
writeFileSync('relatorio-falhas-2026-09-02.md', mdTxt);
console.log(`HTML ${(Buffer.byteLength(html) / 1048576).toFixed(1)} MB · MD ${(Buffer.byteLength(mdTxt) / 1024).toFixed(0)} KB · ${falhas.length} falhas · naturezas ${JSON.stringify(porNatureza)} · grupos ${JSON.stringify(porGrupo)}`);
