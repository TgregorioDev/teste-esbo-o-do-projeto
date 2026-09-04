// Deriva, a partir de relatorio-falhas-2026-09-03.html (gerado por gerar-final.mjs):
//   - relatorio-falhas-2026-09-03-leve.html   (sem screenshots embutidas)
//   - relatorio-2026-09-03/                     (fatiado por área, com index.html = sumário + causas raiz)
//   - relatorio-falhas-2026-09-03.pdf           (impressão do HTML completo)
//   - relatorio-falhas-2026-09-03.zip           (html, md, JSONs crus e evidências das falhas)
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const DATA = '2026-09-03';
const FULL = `relatorio-falhas-${DATA}.html`;
const html = readFileSync(FULL, 'utf8');
const LIMITE_FATIA = 4 * 1024 * 1024;

// ───────── versão leve ─────────
const leve = html
  .replace(/<figure>[\s\S]*?<\/figure>/g, '')
  .replace('<title>Falhas da suíte E2E — Fluig Cassi — 03/09/2026</title>', '<title>Falhas da suíte E2E — Fluig Cassi — 03/09/2026 (versão leve, sem screenshots embutidas)</title>')
  .replace(/<section class="bloco">\s*<h3>Tela no momento da falha<\/h3>\s*<\/section>/g,
    '<section class="bloco"><h3>Tela no momento da falha</h3><p class="dica">Screenshot omitida nesta versão leve — está embutida em <code>' + FULL + '</code> e gravada no caminho indicado em "Artefatos desta falha".</p></section>');
writeFileSync(`relatorio-falhas-${DATA}-leve.html`, leve);

// ───────── fatiado por área ─────────
const DIR = `relatorio-${DATA}`;
rmSync(DIR, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });
const iMain = html.indexOf('<main>\n') + '<main>\n'.length;
const cabeca = html.slice(0, iMain);
const iFim = html.lastIndexOf('</main>');
const corpo = html.slice(iMain, iFim);
const rodape = html.slice(iFim).replace(/<script>[\s\S]*?<\/script>/, '');
const iCartoes = corpo.indexOf('<h2 id="cartoes">');
const sumario = corpo.slice(0, iCartoes);
const cartoesHtml = corpo.slice(iCartoes).replace(/^[\s\S]*?<div class="filtros" id="filtros">[\s\S]*?<\/div>\n/, '');
const cartoes = cartoesHtml.split('<article class="falha"').slice(1).map((p) => '<article class="falha"' + p);
const areaDe = (c) => c.match(/data-area="([^"]+)"/)[1];
const arquivoDe = (c) => c.match(/<code>([^<]+?):\d+<\/code>/)[1];
const porArea = {};
for (const c of cartoes) (porArea[areaDe(c)] ??= []).push(c);
const nomeArquivo = {};
const paginas = {}; // arquivo → html do miolo
for (const [area, lista] of Object.entries(porArea)) {
  const junto = lista.join('\n');
  if (Buffer.byteLength(junto) <= LIMITE_FATIA) {
    nomeArquivo[area] = `area-${area}.html`;
    paginas[nomeArquivo[area]] = junto;
  } else {
    // área grande: uma página por spec, mais um índice da área
    const porSpec = {};
    for (const c of lista) (porSpec[arquivoDe(c).split('/').pop().replace('.spec.js', '')] ??= []).push(c);
    nomeArquivo[area] = `area-${area}.html`;
    const idx = Object.entries(porSpec).map(([spec, cs]) => `<li><a href="area-${area}--${spec}.html">${spec}</a> (${cs.length})</li>`).join('');
    paginas[nomeArquivo[area]] = `<section class="sumario"><h2>${area}</h2><p>Área com muitas evidências — fatiada por arquivo de spec:</p><ul>${idx}</ul></section>`;
    for (const [spec, cs] of Object.entries(porSpec)) paginas[`area-${area}--${spec}.html`] = cs.join('\n');
  }
}
const areas = Object.keys(porArea).sort();
const nav = (ativo) => `<nav class="filtros" style="margin:16px 0"><a href="index.html" style="background:var(--cartao);border:1px solid var(--borda);border-radius:999px;padding:6px 14px;text-decoration:none;font-size:13px;${ativo === 'index' ? 'font-weight:700;border-color:var(--texto)' : ''}">Sumário</a> ${areas.map((a) => `<a href="${nomeArquivo[a]}" style="background:var(--cartao);border:1px solid var(--borda);border-radius:999px;padding:6px 14px;text-decoration:none;font-size:13px;${ativo === a ? 'font-weight:700;border-color:var(--texto)' : ''}">${a} (${porArea[a].length})</a>`).join(' ')}</nav>\n`;
// no sumário, links de cartão (#fN) apontam para a página da área; nos cartões, links de grupo (#Gn) apontam para o index
const paginaDoCartao = {};
for (const [nome, miolo] of Object.entries(paginas)) for (const m of miolo.matchAll(/<article class="falha" id="(f\d+)"/g)) paginaDoCartao[m[1]] = nome;
const sumarioLinkado = sumario.replace(/href="#(f\d+)"/g, (_, id) => `href="${paginaDoCartao[id]}#${id}"`);
writeFileSync(`${DIR}/index.html`, cabeca + nav('index') + sumarioLinkado + rodape);
for (const [nome, miolo] of Object.entries(paginas)) {
  const area = nome.replace(/^area-/, '').replace(/--.*$/, '').replace(/\.html$/, '');
  writeFileSync(`${DIR}/${nome}`, cabeca + nav(area) + miolo.replace(/href="#(G\d+)"/g, 'href="index.html#$1"') + rodape);
}
console.log(`fatiado: ${Object.keys(paginas).length + 1} páginas em ${DIR}/`);

// ───────── PDF ─────────
const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.emulateMedia({ colorScheme: 'light', media: 'print' });
await pagina.goto('file://' + process.cwd() + '/' + FULL, { waitUntil: 'load', timeout: 300_000 });
await pagina.pdf({ path: `relatorio-falhas-${DATA}.pdf`, format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' } });
await navegador.close();

// ───────── ZIP ─────────
const falhas = JSON.parse(readFileSync(`relatorios-${DATA}/falhas.json`, 'utf8'));
rmSync('evidencias', { recursive: true, force: true });
for (const f of falhas) {
  const area = f.arquivo.replace(/^e2e\//, '').split('/')[0];
  for (const a of f.anexos) {
    if (!a.path || !/(test-failed-1\.png|error-context\.md)$/.test(a.path) || !existsSync(a.path)) continue;
    const pasta = `evidencias/${area}/${a.path.split('/').slice(-2, -1)[0]}`;
    mkdirSync(pasta, { recursive: true });
    copyFileSync(a.path, `${pasta}/${a.path.split('/').pop()}`);
  }
}
rmSync(`relatorio-falhas-${DATA}.zip`, { force: true });
execSync(`python3 -c "import zipfile,glob,os
z=zipfile.ZipFile('relatorio-falhas-${DATA}.zip','w',zipfile.ZIP_DEFLATED)
for f in ['relatorio-falhas-${DATA}.html','relatorio-falhas-${DATA}.md','relatorio-falhas-${DATA}-leve.html']+glob.glob('relatorios-${DATA}/*.json'): z.write(f)
for r,d,fs in os.walk('evidencias'):
  for f in fs: z.write(os.path.join(r,f))
z.close()"`);
rmSync('evidencias', { recursive: true, force: true });
console.log('derivados prontos');
