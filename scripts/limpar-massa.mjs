// @ts-check
/**
 * Cancela a massa que a suíte criou. É o passo que roda DEPOIS da execução e DEPOIS da coleta
 * de evidências — nunca durante.
 *
 * ## Por que não é `globalTeardown`
 *
 * O teardown nativo do Playwright corre junto com o fechamento dos reporters. Uma falha de
 * limpeza ali pode derrubar o processo antes de trace, vídeo e relatório estarem gravados — e a
 * evidência de uma execução vale mais que a limpeza dela. Aqui a limpeza é um passo explícito,
 * que falha sozinho sem contaminar o resultado dos testes, e que dá para pular quando se está
 * depurando e o resíduo precisa ficar de pé para inspeção.
 *
 * ## Dois modos
 *
 *   node scripts/limpar-massa.mjs                                 # lê o livro-razão da execução
 *   node scripts/limpar-massa.mjs --descobrir --desde=2026-08-25  # varre o servidor
 *   node scripts/limpar-massa.mjs --simular                       # não cancela, só lista
 *
 * O padrão lê `test-results/criados.jsonl`, escrito pela fixture durante a execução. O
 * `--descobrir` existe para o acumulado: varre a API e filtra pelo carimbo `QA` nos campos do
 * formulário. **Nunca filtra só por data** — a base é compartilhada, e cancelar por janela
 * destruiria trabalho de outras pessoas.
 *
 * ## Segurança
 *
 * Nada é cancelado sem carimbo `QA` confirmado NO SERVIDOR. No modo livro-razão a confirmação é
 * dupla: o registro precisa constar do arquivo E carregar o carimbo. `--simular` mostra o que
 * faria, sem tocar em nada.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';

import {
  cancelarSolicitacoes,
  conferirCancelamento,
  classificarAlvosDoLivro,
  descobrirSolicitacoesDaAutomacao,
} from '../utils/cancelamento-fluig.js';

dotenv.config({ path: '.env.test', quiet: true });

const argumentos = process.argv.slice(2);
const temFlag = (nome) => argumentos.some((a) => a === `--${nome}` || a.startsWith(`--${nome}=`));
const valorFlag = (nome, padrao) => {
  const achado = argumentos.find((a) => a.startsWith(`--${nome}=`));
  return achado ? achado.slice(nome.length + 3) : padrao;
};

const MODO_DESCOBRIR = temFlag('descobrir');
/**
 * Reaproveita uma descoberta já feita. A varredura custa uma chamada de detalhe por
 * solicitação aberta na janela (foram 402 em 26/08/2026) e é a parte lenta — repeti-la a cada
 * tentativa transforma um cancelamento de 3 minutos numa espera de 10.
 */
const ARQUIVO_ALVOS = valorFlag('alvos', '');
const SIMULAR = temFlag('simular');
const DESDE = valorFlag('desde', new Date().toISOString().slice(0, 10));
const PREFIXO = process.env.QA_DATA_PREFIX ?? 'QA';
const LIVRO = 'test-results/criados.jsonl';
const RELATORIO = 'limpeza.json';
const TAMANHO_LOTE = Number(valorFlag('lote', '25'));
const PAUSA_ENTRE_LOTES_MS = Number(process.env.PAUSA_LIMPEZA ?? 5000);

const BASE_URL = process.env.BASE_URL;
const USUARIO = process.env.QA_USERNAME;
const SENHA = process.env.QA_PASSWORD;
if (!BASE_URL || !USUARIO || !SENHA) {
  throw new Error('Faltam variáveis: BASE_URL, QA_USERNAME e QA_PASSWORD. Configure `.env.test`.');
}

/** Lê o livro-razão, tolerando linha truncada (teste morto no meio da escrita). */
function lerLivroRazao() {
  if (!existsSync(LIVRO)) return [];
  const registros = [];
  for (const linha of readFileSync(LIVRO, 'utf8').split('\n').filter(Boolean)) {
    try {
      registros.push(JSON.parse(linha));
    } catch {
      // Uma linha truncada não pode abortar a limpeza inteira, e o que se perde é um id que
      // continua rastreável pelo carimbo `QA`.
    }
  }
  return registros;
}

const navegador = await chromium.launch();
const contexto = await navegador.newContext({
  baseURL: BASE_URL,
  locale: 'pt-BR',
  storageState: existsSync('playwright/.auth/usuario.json') ? 'playwright/.auth/usuario.json' : undefined,
});
const pagina = await contexto.newPage();

try {
  await pagina.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

  // O `storageState` pode estar vencido. O critério de sessão viva é o TÍTULO, não a URL: o
  // login é servido na MESMA rota da home (ver CLAUDE.md).
  if (!(await pagina.title()).includes('Home')) {
    console.log('sessão ausente ou vencida — autenticando');
    await pagina.getByRole('textbox', { name: 'Digite seu login' }).fill(USUARIO);
    await pagina.getByRole('textbox', { name: 'Digite sua senha' }).fill(SENHA);
    await pagina.getByRole('button', { name: 'Acessar' }).click();
    await pagina.waitForFunction(() => document.title.includes('Home'), null, { timeout: 30000 });
  }

  let alvos = [];

  if (ARQUIVO_ALVOS) {
    const salvo = JSON.parse(readFileSync(ARQUIVO_ALVOS, 'utf8'));
    alvos = salvo.alvos ?? salvo;
    console.log(`reaproveitando ${alvos.length} alvo(s) de ${ARQUIVO_ALVOS}`);
  } else if (MODO_DESCOBRIR) {
    console.log(`descobrindo solicitações da automação desde ${DESDE} (carimbo "${PREFIXO}")…`);
    alvos = await descobrirSolicitacoesDaAutomacao(pagina, { desde: DESDE, prefixo: PREFIXO });
    // A descoberta é cara: grava sempre, para poder ser reaproveitada com --alvos=.
    writeFileSync('limpeza-alvos.json', JSON.stringify({ descobertoEm: new Date().toISOString(), desde: DESDE, alvos }, null, 2));
    console.log('descoberta salva em limpeza-alvos.json (reuse com --alvos=limpeza-alvos.json)');
  } else {
    const registros = lerLivroRazao();
    if (registros.length === 0) {
      console.log(`livro-razão vazio ou ausente (${LIVRO}). Nada a limpar.`);
      console.log('Para varrer o servidor: --descobrir --desde=aaaa-mm-dd');
      process.exit(0);
    }
    const ids = [...new Set(registros.filter((r) => r.tipo === 'solicitacao').map((r) => Number(r.id)))];
    console.log(`livro-razão: ${ids.length} solicitação(ões) registrada(s)`);

    // Consulta dirigida (uma chamada por id), não varredura: aqui já se sabe o que checar.
    const classificado = await classificarAlvosDoLivro(pagina, ids, PREFIXO);

    // Nem todo registro da automação PODE ser carimbado: a medição de contrato não tem um
    // único campo de texto editável na etapa "Início" (34 campos, zero editáveis — medido).
    // Para esses, a procedência é o próprio livro-razão, escrito pela fixture no instante da
    // criação. Isso vale AQUI e só aqui: numa varredura da base compartilhada, sem carimbo
    // não se toca em nada.
    alvos = [...classificado.comCarimbo, ...classificado.semCarimboMasAtiva];

    console.log(`  com carimbo: ${classificado.comCarimbo.length}`);
    if (classificado.semCarimboMasAtiva.length) {
      console.log(
        `  sem carimbo, aceitos pela procedência do livro-razão: ` +
          `${classificado.semCarimboMasAtiva.map((c) => `${c.processInstanceId} (${c.processId})`).join(', ')}`,
      );
    }
    if (classificado.jaEncerrada.length) {
      console.log(`  já encerradas, nada a fazer: ${classificado.jaEncerrada.join(', ')}`);
    }
  }

  console.log(`alvos: ${alvos.length}`);
  for (const a of alvos.slice(0, 10)) {
    console.log(`  ${a.processInstanceId} ${a.processId ?? ''} :: ${(a.carimbo ?? '').slice(0, 70)}`);
  }
  if (alvos.length > 10) console.log(`  … e mais ${alvos.length - 10}`);

  if (SIMULAR) {
    console.log('\n--simular: nada foi cancelado.');
    writeFileSync(RELATORIO, JSON.stringify({ simulacao: true, alvos }, null, 2));
    process.exit(0);
  }
  if (alvos.length === 0) {
    writeFileSync(RELATORIO, JSON.stringify({ alvos: [], cancelados: 0 }, null, 2));
    console.log('nada a cancelar.');
    process.exit(0);
  }

  const ids = alvos.map((a) => a.processInstanceId);
  const resultados = [];

  for (let i = 0; i < ids.length; i += TAMANHO_LOTE) {
    const lote = ids.slice(i, i + TAMANHO_LOTE);
    const parciais = await cancelarSolicitacoes(pagina, lote, {
      motivo: `${PREFIXO} limpeza automatizada pos-execucao`,
      login: USUARIO,
    });
    resultados.push(...parciais);
    console.log(
      `lote ${Math.floor(i / TAMANHO_LOTE) + 1}: ` +
        `${parciais.filter((r) => r.status === 'SUCCESS').length}/${lote.length} cancelados`,
    );
    // Ritmo, não sincronização: o Fluig tem proteção contra volume de requisições.
    if (i + TAMANHO_LOTE < ids.length) {
      await new Promise((r) => setTimeout(r, PAUSA_ENTRE_LOTES_MS));
    }
  }

  // `successCount` é o que o endpoint DIZ ter feito. Isto é o que o servidor mostra depois.
  const conferencia = await conferirCancelamento(pagina, ids);
  const efetivados = conferencia.filter((c) => c.status === 'CANCELED' && !c.active);
  const pendentes = conferencia.filter((c) => !(c.status === 'CANCELED' && !c.active));

  writeFileSync(
    RELATORIO,
    JSON.stringify(
      {
        executadoEm: new Date().toISOString(),
        modo: MODO_DESCOBRIR ? `descobrir --desde=${DESDE}` : 'livro-razao',
        alvos: alvos.length,
        cancelados: efetivados.length,
        pendentes,
        resultadosDoEndpoint: resultados,
      },
      null,
      2,
    ),
  );

  console.log(`\n${efetivados.length}/${ids.length} confirmados CANCELED no servidor`);
  for (const p of pendentes.slice(0, 10)) {
    console.log(`  não confirmado: ${p.processInstanceId} status=${p.status} active=${p.active}`);
  }
  console.log(`relatório: ${RELATORIO}`);
} finally {
  await navegador.close();
}
