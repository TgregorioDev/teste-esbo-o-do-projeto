// @ts-check
/**
 * Gera `relatorio-falhas.html` — um arquivo único, autossuficiente, com TODOS os testes que
 * reprovaram na última execução e as evidências de cada um.
 *
 * Por que existe, se já há o relatório nativo do Playwright: o nativo é excelente para navegar
 * um teste por vez, mas não responde "o que quebrou nesta execução e por quê" numa página só,
 * nem enriquece a causa. Este agrupa e acrescenta o que o nativo não mostra: o trecho de código
 * exato que falhou, o estado da tela em aria-snapshot, a classificação da causa e o comando de
 * reprodução com a seed. Para trace, vídeo e passos, ele aponta para o relatório nativo, que é
 * onde essas coisas se navegam de verdade.
 *
 * Uso:
 *   npx playwright merge-reports --reporter=json ./blob-todos > /tmp/merged.json
 *   node scripts/relatorio-falhas.mjs /tmp/merged.json
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';

const entrada = process.argv[2] ?? '/tmp/merged.json';
const saida = process.argv[3] ?? 'relatorio-falhas.html';

const relatorio = JSON.parse(readFileSync(entrada, 'utf8'));

/** Remove códigos de cor ANSI que o Playwright grava na mensagem. */
const semAnsi = (t) => String(t ?? '').replace(/\x1b\[[0-9;]*m/g, '');

const escapar = (t) =>
  String(t ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** Percorre a árvore de suites acumulando o caminho de títulos. */
function* percorrer(suite, prefixo = '') {
  const titulo = [prefixo, suite.title].filter(Boolean).join(' › ');
  for (const spec of suite.specs ?? []) yield { caminho: titulo, spec };
  for (const filha of suite.suites ?? []) yield* percorrer(filha, titulo);
}

/**
 * Classifica a causa pelo texto da falha. As três categorias são as que a suíte usa para
 * separar "o produto está errado" de "o ambiente não colaborou" — ver docs/estado-do-gate.md.
 */
function classificar(mensagem) {
  const m = mensagem.toLowerCase();
  if (m.includes('pré-condição ausente') && m.includes('infraestrutura'))
    return { chave: 'infra', rotulo: 'Infraestrutura', cor: 'infra' };
  if (m.includes('pré-condição ausente'))
    return { chave: 'ambiente', rotulo: 'Ambiente / massa', cor: 'ambiente' };

  // "Sem veredito" é o teste que estourou sem dizer NADA de domínio — o vermelho que não
  // ensina nada a quem lê o relatório. O sinal é a PRIMEIRA linha: quando a assertion recebe
  // mensagem customizada, o Playwright a coloca ali; sem ela, a linha é o erro cru da API.
  // Olhar a mensagem inteira dava falso positivo, porque o call log de qualquer falha cita
  // `locator.` e `Timeout` mesmo quando a causa está bem explicada na primeira linha.
  const primeiraLinha = mensagem.split('\n')[0].trim();
  const cru =
    /^(TimeoutError:|Error:\s*(expect\(|locator\.|page\.|element\(s\) not found|$))/i.test(primeiraLinha);
  if (cru) return { chave: 'sem-veredito', rotulo: 'Sem veredito', cor: 'sem-veredito' };

  return { chave: 'produto', rotulo: 'Defeito de produto', cor: 'produto' };
}

/** Separa a mensagem em resumo, corpo e call log — o call log é longo e vai recolhido. */
function fatiarMensagem(mensagem) {
  const idx = mensagem.indexOf('Call log:');
  const principal = idx === -1 ? mensagem : mensagem.slice(0, idx).trim();
  const callLog = idx === -1 ? '' : mensagem.slice(idx).trim();
  const [resumo, ...resto] = principal.split('\n');
  return { resumo: resumo.trim(), corpo: resto.join('\n').trim(), callLog };
}

/**
 * Monta o trecho de código em volta da linha que falhou. O JSON do Playwright traz só
 * `location`; o code frame que aparece no terminal não vem junto — reconstruir aqui é o que
 * torna a causa legível sem abrir o editor.
 */
function trechoDeCodigo(location) {
  if (!location?.file || !existsSync(location.file)) return null;
  const linhas = readFileSync(location.file, 'utf8').split('\n');
  const alvo = location.line;
  const de = Math.max(1, alvo - 6);
  const ate = Math.min(linhas.length, alvo + 4);
  const saida = [];
  for (let n = de; n <= ate; n++) {
    saida.push({ n, texto: linhas[n - 1] ?? '', destaque: n === alvo });
  }
  return { arquivo: location.file.replace(process.cwd() + '/', ''), linha: alvo, linhas: saida };
}

/** Lê um anexo como base64, venha ele de arquivo (`path`) ou embutido (`body`). */
function anexoBase64(anexo) {
  if (anexo.body) return anexo.body;
  if (anexo.path && existsSync(anexo.path)) return readFileSync(anexo.path).toString('base64');
  return null;
}

function anexoTexto(anexo) {
  if (anexo.body) return Buffer.from(anexo.body, 'base64').toString('utf8');
  if (anexo.path && existsSync(anexo.path)) return readFileSync(anexo.path, 'utf8');
  return null;
}

const falhas = [];
let total = 0;

for (const suite of relatorio.suites ?? []) {
  for (const { caminho, spec } of percorrer(suite)) {
    total += 1;
    const teste = spec.tests[0];
    const resultado = teste.results[teste.results.length - 1];
    if (resultado.status === 'passed') continue;

    const mensagem = semAnsi(resultado.error?.message ?? '');
    const anexos = resultado.attachments ?? [];
    const pegar = (nome) => anexos.find((a) => a.name === nome);

    const seed = (teste.annotations ?? []).find((a) => a.type === 'faker-seed')?.description;
    const contextoBruto = pegar('contexto-da-falha');
    let contexto = null;
    if (contextoBruto) {
      const texto = anexoTexto(contextoBruto);
      try {
        contexto = JSON.parse(texto ?? '');
      } catch {
        // O anexo é JSON por contrato da fixture; se um dia deixar de ser, o texto cru ainda
        // serve de evidência — não vale derrubar o relatório inteiro por isso.
        contexto = { bruto: texto };
      }
    }

    const capturaConfig = pegar('screenshot');
    const capturaFixture = pegar('screenshot-da-falha');
    const capturas = [capturaConfig, capturaFixture]
      .filter(Boolean)
      .map((a) => ({ nome: a.name, b64: anexoBase64(a) }))
      .filter((c) => c.b64);

    falhas.push({
      id: spec.id,
      titulo: spec.title,
      suite: caminho,
      arquivo: spec.file,
      linha: spec.line,
      projeto: teste.projectName,
      duracao: resultado.duration,
      tags: spec.tags ?? [],
      seed,
      classificacao: classificar(mensagem),
      ...fatiarMensagem(mensagem),
      mensagemCompleta: mensagem,
      codigo: trechoDeCodigo(resultado.error?.location ?? resultado.errorLocation),
      contexto,
      capturas,
      ariaSnapshot: pegar('error-context') ? anexoTexto(pegar('error-context')) : null,
      temTrace: Boolean(pegar('trace')),
      temVideo: Boolean(pegar('video')),
      stdout: (resultado.stdout ?? []).map((s) => s.text ?? s).join(''),
      stderr: (resultado.stderr ?? []).map((s) => s.text ?? s).join(''),
    });
  }
}

falhas.sort((a, b) => a.arquivo.localeCompare(b.arquivo) || a.linha - b.linha);

const porArea = {};
const porClasse = {};
for (const f of falhas) {
  const area = f.arquivo.replace(/^e2e\//, '').split('/')[0];
  porArea[area] = (porArea[area] ?? 0) + 1;
  porClasse[f.classificacao.rotulo] = (porClasse[f.classificacao.rotulo] ?? 0) + 1;
}

const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

const cartao = (f, i) => `
<article class="falha" id="f${i}" data-classe="${f.classificacao.chave}" data-area="${escapar(f.arquivo.replace(/^e2e\//, '').split('/')[0])}">
  <header>
    <div class="cabecalho">
      <span class="badge ${f.classificacao.cor}">${f.classificacao.rotulo}</span>
      <span class="ordem">#${i + 1}</span>
    </div>
    <h2>${escapar(f.titulo)}</h2>
    <p class="suite">${escapar(f.suite)}</p>
    <dl class="meta">
      <div><dt>Arquivo</dt><dd><code>${escapar(f.arquivo)}:${f.linha}</code></dd></div>
      <div><dt>Projeto</dt><dd>${escapar(f.projeto)}</dd></div>
      <div><dt>Duração</dt><dd>${(f.duracao / 1000).toFixed(1)}s</dd></div>
      ${f.tags.length ? `<div><dt>Tags</dt><dd>${f.tags.map((t) => `<code>${escapar(t)}</code>`).join(' ')}</dd></div>` : ''}
      ${f.seed ? `<div><dt>Seed do faker</dt><dd><code>${escapar(f.seed)}</code></dd></div>` : ''}
    </dl>
  </header>

  <section class="bloco">
    <h3>A falha</h3>
    <p class="resumo">${escapar(f.resumo)}</p>
    ${f.corpo ? `<pre class="detalhe">${escapar(f.corpo)}</pre>` : ''}
  </section>

  ${
    f.codigo
      ? `<section class="bloco">
    <h3>Onde falhou</h3>
    <pre class="codigo">${f.codigo.linhas
      .map(
        (l) =>
          `<span class="linha${l.destaque ? ' alvo' : ''}"><span class="num">${l.n}</span>${escapar(l.texto)}</span>`,
      )
      .join('\n')}</pre>
  </section>`
      : ''
  }

  ${
    f.capturas.length
      ? `<section class="bloco">
    <h3>Tela no momento da falha</h3>
    ${f.capturas
      .map(
        (c) =>
          `<figure><img loading="lazy" alt="Captura: ${escapar(c.nome)}" src="data:image/png;base64,${c.b64}"><figcaption>${escapar(c.nome)}</figcaption></figure>`,
      )
      .join('')}
  </section>`
      : ''
  }

  ${
    f.contexto
      ? `<section class="bloco">
    <h3>Contexto capturado pela suíte</h3>
    <pre class="detalhe">${escapar(JSON.stringify(f.contexto, null, 2))}</pre>
  </section>`
      : ''
  }

  ${
    f.callLog
      ? `<details class="bloco"><summary>Call log do Playwright — o que ele esperou, e por quanto tempo</summary>
    <pre class="detalhe">${escapar(f.callLog)}</pre></details>`
      : ''
  }

  ${
    f.ariaSnapshot
      ? `<details class="bloco"><summary>Estado da página em aria-snapshot (o que estava na tela)</summary>
    <pre class="detalhe">${escapar(f.ariaSnapshot)}</pre></details>`
      : ''
  }

  ${
    f.stdout || f.stderr
      ? `<details class="bloco"><summary>Saída do teste (stdout / stderr)</summary>
    <pre class="detalhe">${escapar(f.stdout + (f.stderr ? '\n--- stderr ---\n' + f.stderr : ''))}</pre></details>`
      : ''
  }

  <section class="bloco reproduzir">
    <h3>Reproduzir e aprofundar</h3>
    <pre class="cmd">${escapar(
      `${f.seed ? `FAKER_SEED=${f.seed} ` : ''}npx playwright test ${f.arquivo.replace(/^e2e\//, 'tests/e2e/').replace(/^api\//, 'tests/api/')} -g ${JSON.stringify(f.titulo)}`,
    )}</pre>
    <p class="dica">
      ${f.temTrace ? 'Trace' : ''}${f.temTrace && f.temVideo ? ' e ' : ''}${f.temVideo ? 'vídeo' : ''}
      ${f.temTrace || f.temVideo ? 'desta execução estão no relatório nativo:' : 'sem trace/vídeo nesta execução.'}
      ${
        f.temTrace || f.temVideo
          ? `<a href="playwright-report/index.html#?testId=${escapar(f.id)}" target="_blank" rel="noreferrer">abrir este teste no relatório do Playwright</a>`
          : ''
      }
    </p>
  </section>
</article>`;

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Falhas da suíte E2E — Fluig Cassi</title>
<style>
  :root {
    --fundo: #0f1115; --cartao: #171a21; --borda: #262b36; --texto: #e6e9ef;
    --suave: #9aa4b2; --codigo: #0b0d11;
    --produto: #ef4444; --ambiente: #f59e0b; --infra: #8b5cf6; --sem-veredito: #64748b;
  }
  @media (prefers-color-scheme: light) {
    :root { --fundo:#f6f7f9; --cartao:#fff; --borda:#e2e5ea; --texto:#1b1f27; --suave:#5b6472; --codigo:#f1f3f6; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--fundo); color:var(--texto);
         font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
  .capa { padding:32px 24px 20px; border-bottom:1px solid var(--borda); }
  .capa h1 { margin:0 0 6px; font-size:26px; }
  .capa p { margin:0; color:var(--suave); }
  .numeros { display:flex; flex-wrap:wrap; gap:10px; margin-top:18px; }
  .numero { background:var(--cartao); border:1px solid var(--borda); border-radius:10px; padding:10px 14px; }
  .numero b { display:block; font-size:22px; }
  .numero span { color:var(--suave); font-size:12px; text-transform:uppercase; letter-spacing:.04em; }
  main { padding:24px; max-width:1100px; margin:0 auto; }
  .filtros { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:22px; }
  .filtros button { background:var(--cartao); color:var(--texto); border:1px solid var(--borda);
                    border-radius:999px; padding:6px 14px; cursor:pointer; font-size:13px; }
  .filtros button[aria-pressed="true"] { border-color:var(--texto); font-weight:600; }
  .falha { background:var(--cartao); border:1px solid var(--borda); border-radius:14px;
           padding:20px; margin-bottom:20px; }
  .falha[hidden] { display:none; }
  .cabecalho { display:flex; justify-content:space-between; align-items:center; }
  .ordem { color:var(--suave); font-size:13px; }
  .badge { display:inline-block; padding:3px 10px; border-radius:999px; font-size:12px;
           font-weight:600; color:#fff; }
  .badge.produto { background:var(--produto); }
  .badge.ambiente { background:var(--ambiente); color:#231a05; }
  .badge.infra { background:var(--infra); }
  .badge.sem-veredito { background:var(--sem-veredito); }
  .falha h2 { margin:12px 0 4px; font-size:18px; line-height:1.35; }
  .suite { margin:0 0 14px; color:var(--suave); font-size:13px; }
  .meta { display:flex; flex-wrap:wrap; gap:18px; margin:0 0 4px; }
  .meta div { display:flex; flex-direction:column; }
  .meta dt { color:var(--suave); font-size:11px; text-transform:uppercase; letter-spacing:.04em; }
  .meta dd { margin:2px 0 0; font-size:13px; }
  .bloco { margin-top:18px; }
  .bloco h3 { margin:0 0 8px; font-size:13px; text-transform:uppercase;
              letter-spacing:.05em; color:var(--suave); }
  .resumo { margin:0 0 8px; font-weight:600; }
  pre { background:var(--codigo); border:1px solid var(--borda); border-radius:10px;
        padding:12px 14px; overflow-x:auto; font-size:12.5px; line-height:1.5; margin:0;
        white-space:pre-wrap; word-break:break-word; }
  pre.codigo, pre.cmd { white-space:pre; }
  code { background:var(--codigo); padding:1px 5px; border-radius:5px; font-size:12.5px; }
  .codigo .linha { display:block; }
  .codigo .num { display:inline-block; width:44px; color:var(--suave); user-select:none; }
  .codigo .alvo { background:rgba(239,68,68,.16); font-weight:600; }
  figure { margin:0 0 12px; }
  figure img { max-width:100%; border:1px solid var(--borda); border-radius:10px; display:block; }
  figcaption { color:var(--suave); font-size:12px; margin-top:5px; }
  details > summary { cursor:pointer; color:var(--suave); font-size:13px; padding:6px 0; }
  details[open] > summary { margin-bottom:8px; }
  .dica { color:var(--suave); font-size:13px; margin:8px 0 0; }
  a { color:inherit; }
  footer { padding:20px 24px 44px; color:var(--suave); font-size:13px; max-width:1100px; margin:0 auto; }
</style>
</head>
<body>
<div class="capa">
  <h1>Falhas da suíte E2E — TOTVS Fluig Cassi</h1>
  <p>Execução de ${escapar(agora)} · ${total} testes, ${falhas.length} reprovados · destrutivos incluídos</p>
  <div class="numeros">
    <div class="numero"><b>${total}</b><span>testes</span></div>
    <div class="numero"><b>${total - falhas.length}</b><span>verdes</span></div>
    <div class="numero"><b>${falhas.length}</b><span>vermelhos</span></div>
    ${Object.entries(porClasse)
      .map(([k, v]) => `<div class="numero"><b>${v}</b><span>${escapar(k)}</span></div>`)
      .join('')}
  </div>
</div>
<main>
  <p class="dica">
    Vermelho aqui não significa suíte quebrada: nesta suíte, teste escrito contra o comportamento
    esperado <strong>reprova de propósito</strong> enquanto o produto não o entrega. A etiqueta de
    cada cartão diz de que natureza é a falha. Trace, vídeo e passos ficam no relatório nativo,
    linkado em cada cartão.
  </p>
  <div class="filtros" id="filtros">
    <button data-filtro="todos" aria-pressed="true">Todos (${falhas.length})</button>
    ${Object.entries(porArea)
      .sort((a, b) => b[1] - a[1])
      .map(([a, n]) => `<button data-filtro="area:${escapar(a)}" aria-pressed="false">${escapar(a)} (${n})</button>`)
      .join('')}
  </div>
  ${falhas.map(cartao).join('\n')}
</main>
<footer>
  <p>Gerado por <code>node scripts/relatorio-falhas.mjs</code> a partir do relatório mesclado do
  Playwright. Screenshots e aria-snapshots estão <strong>embutidos neste arquivo</strong> — ele se
  abre sozinho, sem servidor e sem dependência externa.</p>
  <p><strong>Os links "abrir no relatório do Playwright" precisam do relatório nativo ao lado.</strong>
  Ele não é versionado (287&nbsp;MB, quase tudo trace e vídeo). Para recriá-lo a partir dos blobs
  de uma execução:</p>
  <pre class="cmd">npx playwright merge-reports --reporter=html ./blob-todos
npx playwright show-report</pre>
</footer>
<script>
  const filtros = document.getElementById('filtros');
  filtros.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button');
    if (!botao) return;
    for (const b of filtros.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b === botao));
    const filtro = botao.dataset.filtro;
    for (const cartao of document.querySelectorAll('.falha')) {
      const mostrar = filtro === 'todos' || cartao.dataset.area === filtro.slice(5);
      cartao.hidden = !mostrar;
    }
  });
</script>
</body>
</html>`;

writeFileSync(saida, html);
console.log(
  `${saida} · ${falhas.length} falhas de ${total} testes · ${(Buffer.byteLength(html) / 1048576).toFixed(1)} MB`,
);
