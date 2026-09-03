// @ts-check
/**
 * Converte um documento Markdown deste repositório em PDF.
 *
 * Usa o Chromium que o Playwright já instala — nenhuma dependência nova. A regra da skill
 * `playwright-test-creator` vale aqui também: antes de adicionar dependência, verificar se o
 * que já existe resolve. Um `pandoc` ou um `markdown-it` a mais seria custo sem retorno para
 * o subconjunto de Markdown que os documentos de `docs/` usam.
 *
 * O renderizador cobre exatamente esse subconjunto: títulos, tabelas, blocos de código,
 * listas (inclusive `- [ ]`), citações, regra horizontal, negrito, itálico e código inline.
 * Qualquer construção fora disso sai como parágrafo — de propósito: falhar em silêncio numa
 * conversão é pior que sair feio e visível.
 *
 * Uso: node scripts/gerar-pdf.mjs docs/arquivo.md [saida.pdf]
 */
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const entrada = process.argv[2];
if (!entrada) {
  console.error('Uso: node scripts/gerar-pdf.mjs <arquivo.md> [saida.pdf]');
  process.exit(1);
}
const saida = process.argv[3] ?? entrada.replace(/\.md$/, '.pdf');

/** @param {string} s */
const escapar = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Formatação inline: código, negrito, itálico e link.
 *
 * O código inline é extraído ANTES das demais regras e reinserido no fim. Sem isso, um
 * asterisco dentro de crase (`probe-*.mjs`) é consumido pela regra de itálico, que casa
 * atravessando a tag `<code>` e engole o texto entre dois trechos de código — aconteceu na
 * primeira versão deste script, ao renderizar o item M-04. O marcador é `\u0000`, que não
 * pode existir no texto de origem nem colidir com nenhuma das regras seguintes.
 *
 * @param {string} s
 */
function inline(s) {
  /** @type {string[]} */
  const codigos = [];
  return escapar(s)
    .replace(/`([^`]+)`/g, (_, c) => `\u0000${codigos.push(c) - 1}\u0000`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codigos[Number(i)]}</code>`);
}

/** @param {string} linha */
const celulas = (linha) =>
  linha.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

/** @param {string} md */
function renderizar(md) {
  const linhas = md.split('\n');
  /** @type {string[]} */
  const out = [];
  let i = 0;

  while (i < linhas.length) {
    const linha = linhas[i];

    // Bloco de código cercado
    if (/^```/.test(linha)) {
      const corpo = [];
      i += 1;
      while (i < linhas.length && !/^```/.test(linhas[i])) corpo.push(linhas[i++]);
      i += 1;
      out.push(`<pre><code>${escapar(corpo.join('\n'))}</code></pre>`);
      continue;
    }

    // Tabela: cabeçalho + separador + corpo
    if (/^\|/.test(linha) && /^\|[\s:|-]+\|$/.test(linhas[i + 1] ?? '')) {
      const cab = celulas(linha);
      i += 2;
      const corpo = [];
      while (i < linhas.length && /^\|/.test(linhas[i])) corpo.push(celulas(linhas[i++]));
      out.push(
        '<table><thead><tr>' +
          cab.map((c) => `<th>${inline(c)}</th>`).join('') +
          '</tr></thead><tbody>' +
          corpo
            .map((l) => '<tr>' + l.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>')
            .join('') +
          '</tbody></table>',
      );
      continue;
    }

    // Citação (pode conter tabela dentro — renderiza recursivamente)
    if (/^>\s?/.test(linha)) {
      const corpo = [];
      while (i < linhas.length && /^>/.test(linhas[i])) corpo.push(linhas[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${renderizar(corpo.join('\n'))}</blockquote>`);
      continue;
    }

    // Lista (itens de checklist viram caixa desmarcada, legível impressa)
    if (/^\s*[-*]\s+/.test(linha)) {
      const itens = [];
      while (i < linhas.length && (/^\s*[-*]\s+/.test(linhas[i]) || /^\s{4,}\S/.test(linhas[i]))) {
        if (/^\s*[-*]\s+/.test(linhas[i])) itens.push(linhas[i].replace(/^\s*[-*]\s+/, ''));
        else itens[itens.length - 1] += ' ' + linhas[i].trim();
        i += 1;
      }
      out.push(
        '<ul>' +
          itens
            .map((t) => {
              const check = /^\[( |x)\]\s*/.exec(t);
              const texto = check ? t.slice(check[0].length) : t;
              const marca = check ? `<span class="cx">${check[1] === 'x' ? '&#10003;' : ''}</span>` : '';
              return `<li class="${check ? 'todo' : ''}">${marca}${inline(texto)}</li>`;
            })
            .join('') +
          '</ul>',
      );
      continue;
    }

    if (/^#{1,6}\s/.test(linha)) {
      const n = (/^#+/.exec(linha) ?? [''])[0].length;
      out.push(`<h${n}>${inline(linha.replace(/^#+\s*/, ''))}</h${n}>`);
      i += 1;
      continue;
    }

    if (/^---+$/.test(linha)) {
      out.push('<hr>');
      i += 1;
      continue;
    }

    if (linha.trim() === '') {
      i += 1;
      continue;
    }

    // Parágrafo: junta linhas até a próxima em branco ou início de outro bloco
    const par = [];
    while (
      i < linhas.length &&
      linhas[i].trim() !== '' &&
      !/^(#{1,6}\s|```|\||>|---+$|\s*[-*]\s)/.test(linhas[i])
    ) {
      par.push(linhas[i++]);
    }
    out.push(`<p>${inline(par.join(' '))}</p>`);
  }

  return out.join('\n');
}

const ESTILO = `
  @page { size: A4; margin: 16mm 14mm 18mm; }
  * { box-sizing: border-box; }
  body { font: 10.5pt/1.55 "DejaVu Sans", "Liberation Sans", Arial, sans-serif;
         color: #1c2024; margin: 0; }
  h1 { font-size: 21pt; margin: 0 0 .4em; padding-bottom: .25em;
       border-bottom: 3px solid #1c2024; letter-spacing: -.01em; }
  h1:not(:first-of-type) { margin-top: 1.6em; page-break-before: always; }
  h2 { font-size: 15pt; margin: 1.5em 0 .5em; padding-bottom: .2em;
       border-bottom: 1px solid #c9ced6; page-break-after: avoid; }
  h3 { font-size: 12pt; margin: 1.3em 0 .45em; color: #0b3d63; page-break-after: avoid; }
  h4 { font-size: 11pt; margin: 1em 0 .35em; page-break-after: avoid; }
  p { margin: .5em 0; }
  hr { border: 0; border-top: 1px solid #dfe3e8; margin: 1.4em 0; }
  code { font-family: "DejaVu Sans Mono", "Liberation Mono", monospace; font-size: .87em;
         background: #f1f3f5; padding: .1em .32em; border-radius: 3px; }
  pre { background: #f7f8fa; border: 1px solid #e1e5ea; border-left: 3px solid #6c7a89;
        border-radius: 4px; padding: .7em .9em; overflow-wrap: break-word;
        white-space: pre-wrap; page-break-inside: avoid; margin: .7em 0; }
  pre code { background: none; padding: 0; font-size: .82em; line-height: 1.45; }
  table { border-collapse: collapse; width: 100%; margin: .8em 0; font-size: 9.2pt;
          page-break-inside: avoid; }
  th, td { border: 1px solid #d6dbe1; padding: .4em .55em; text-align: left;
           vertical-align: top; }
  th { background: #eef1f4; font-weight: 600; }
  tbody tr:nth-child(even) { background: #fafbfc; }
  blockquote { margin: 1em 0; padding: .7em 1em; background: #f5f8fb;
               border-left: 4px solid #4a7fb5; border-radius: 0 4px 4px 0;
               page-break-inside: avoid; }
  blockquote > :first-child { margin-top: 0; }
  blockquote > :last-child { margin-bottom: 0; }
  ul { margin: .5em 0; padding-left: 1.4em; }
  li { margin: .28em 0; }
  li.todo { list-style: none; margin-left: -1.15em; }
  .cx { display: inline-block; width: 1.05em; height: 1.05em; margin-right: .5em;
        border: 1.3px solid #6c7a89; border-radius: 2px; vertical-align: -.16em;
        text-align: center; line-height: 1em; font-size: .9em; }
  strong { font-weight: 600; }
  a { color: #0b3d63; text-decoration: none; }
`;

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${escapar(entrada)}</title><style>${ESTILO}</style></head>
<body>${renderizar(readFileSync(entrada, 'utf8'))}</body></html>`;

const navegador = await chromium.launch();
try {
  const pagina = await navegador.newPage();
  await pagina.setContent(html, { waitUntil: 'load' });
  await pagina.pdf({
    path: saida,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="width:100%;font:8pt \'DejaVu Sans\',sans-serif;color:#8a9199;' +
      'padding:0 14mm;display:flex;justify-content:space-between;">' +
      `<span>${escapar(entrada)}</span>` +
      '<span class="pageNumber"></span>/<span class="totalPages"></span></div>',
    margin: { top: '16mm', bottom: '18mm', left: '14mm', right: '14mm' },
  });
} finally {
  await navegador.close();
}

console.log(`PDF gerado: ${saida}`);
