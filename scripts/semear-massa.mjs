// @ts-check
/**
 * Semeia — e acompanha — massa de Solicitação de Compras na base de DEV.
 *
 * ## Por que existe
 *
 * Metade dos vermelhos "de ambiente" desta suíte no `caixade213859` não é tela quebrada: é
 * **fila vazia**. A Gerência de Compras não lista SC porque não há SC parada na atividade
 * *257 - Gerência de Compras*; o Portal do Comprador não lista cotação porque não há cotação
 * atribuída à conta. O dono do ambiente autorizou criar essa massa ("é apenas uma base de
 * DEV"), e este script é o caminho.
 *
 * ## O que ele NÃO é
 *
 * Não é teste, e não roda dentro da suíte. Massa semeada aqui é **residual de propósito**:
 * fica viva, marcada `QA-MASSA-<uuid>` na justificativa e na observação do item, para que
 * qualquer pessoa saiba, olhando a SC no Fluig, que ela veio da automação. Nada aqui passa
 * pelo `global-teardown` — quem quiser limpar usa `scripts/limpar-massa.mjs --descobrir`.
 *
 * ## Como a SC nasce
 *
 * `POST /process-management/api/v2/processes/wf_solicitacao_compras/start` com
 * `targetState: 0` (o motor decide o destino) e o `formFields` de
 * `factories/massa-solicitacao-compra.js`. **Sempre `page.evaluate` + `fetch`**: o contexto de
 * requisição do Playwright leva 403 do WAF em `/process-management/**` por falta de
 * `User-Agent` e `Referer` de navegador.
 *
 * Medido em 10/09/2026, criando a SC 96363: o `/start` devolve 200 com `nextState: 233` e a
 * solicitação percorre *Início* → *Compra Centralizada?* → *Grava SC e Anexos* sozinha. Ou
 * seja, a API não pula etapa nem burla regra — é a mesma SC que o widget criaria.
 *
 * ## O que ainda trava, e onde
 *
 * *Grava SC e Anexos* (atividade 233) é a integração que abre a SC no Protheus. Quando ela
 * falha, o processo cai — por desenho — na atividade **236 - Correção**, no pool
 * `G.P.Requisicao_de_Compras_Correcoes`, do qual esta conta participa: dá para assumir,
 * reenviar e a SC volta para 233. Enquanto o ERP não gravar, a SC não passa daí e portanto
 * **não chega à Gerência de Compras**. Isso é ambiente, não script — e é exatamente o que o
 * `--acompanhar` mostra.
 *
 * ## Uso
 *
 * ```bash
 * node scripts/semear-massa.mjs --quantidade=3   # semeia 3 SCs e registra o livro
 * node scripts/semear-massa.mjs --acompanhar     # diz onde cada SC semeada parou
 * ```
 */
import dotenv from 'dotenv';
import { chromium } from '@playwright/test';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';

import { ARQUIVO_AUTENTICACAO } from '../fixtures/global-setup.js';
import { criarMassaSolicitacaoCompra } from '../factories/massa-solicitacao-compra.js';

dotenv.config({ path: process.env.ENV_FILE ?? '.env.test', quiet: true });

const LIVRO = 'test-results/massa-semeada.jsonl';
const PROCESSO = 'wf_solicitacao_compras';

const argumentos = process.argv.slice(2);
const acompanhar = argumentos.includes('--acompanhar');
const quantidade = Number(argumentos.find((a) => a.startsWith('--quantidade='))?.split('=')[1] ?? 1);

if (!process.env.BASE_URL) {
  console.error('BASE_URL não definida — confira o .env.test.');
  process.exit(1);
}
if (!existsSync(ARQUIVO_AUTENTICACAO)) {
  console.error(
    `Estado de sessão não encontrado em ${ARQUIVO_AUTENTICACAO}.\n` +
      'Rode qualquer execução da suíte uma vez (o globalSetup grava o arquivo) e repita.',
  );
  process.exit(1);
}

/**
 * Lê o livro de massa já semeada.
 * @returns {Array<{ processInstanceId: number, marca: string, semeadaEm: string }>}
 */
function lerLivro() {
  if (!existsSync(LIVRO)) return [];
  return readFileSync(LIVRO, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((linha) => JSON.parse(linha));
}

const navegador = await chromium.launch();
const contexto = await navegador.newContext({
  storageState: JSON.parse(readFileSync(ARQUIVO_AUTENTICACAO, 'utf8')),
  locale: 'pt-BR',
  baseURL: process.env.BASE_URL,
});
const pagina = await contexto.newPage();
await pagina.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded', timeout: 90_000 });

/**
 * GET de dentro da página (o WAF recusa `page.request` em `/process-management/**`).
 * @param {string} rota
 * @returns {Promise<any>}
 */
function ler(rota) {
  return pagina.evaluate(async (r) => {
    const resposta = await fetch(r, { headers: { Accept: 'application/json' } });
    const texto = await resposta.text();
    try {
      return JSON.parse(texto);
    } catch {
      return { textoBruto: texto.slice(0, 300) };
    }
  }, rota);
}

if (acompanhar) {
  const livro = lerLivro();
  if (livro.length === 0) {
    console.log(`\nNenhuma massa registrada em ${LIVRO}. Semeie com --quantidade=N.\n`);
  } else {
    console.log(`\nMassa semeada — ${livro.length} solicitação(ões)\n${'='.repeat(78)}`);
    for (const registro of livro) {
      const atividades = await ler(`/process-management/api/v2/requests/${registro.processInstanceId}/activities`);
      const ativas = (atividades.items ?? [])
        .filter((/** @type {any} */ item) => item.active)
        .map((/** @type {any} */ item) => `${item.state?.sequence}=${item.state?.stateName}`);
      const detalhe = await ler(`/process-management/api/v2/requests/${registro.processInstanceId}`);
      console.log(
        `${registro.processInstanceId}  ${registro.marca}  ` +
          `${detalhe.active ? 'ABERTA' : 'ENCERRADA'}  →  ${ativas.join(', ') || '(sem atividade ativa)'}`,
      );
    }
    console.log('');
  }
} else {
  mkdirSync('test-results', { recursive: true });
  console.log(`\nSemeando ${quantidade} solicitação(ões) em ${process.env.BASE_URL}\n${'='.repeat(78)}`);

  for (let i = 0; i < quantidade; i++) {
    const massa = criarMassaSolicitacaoCompra();
    const resultado = await pagina.evaluate(
      async ({ processo, formFields, marca }) => {
        const resposta = await fetch(`/process-management/api/v2/processes/${processo}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ targetState: 0, targetAssignee: '', comment: `${marca} — massa de dados`, formFields }),
        });
        const texto = await resposta.text();
        try {
          return { status: resposta.status, corpo: JSON.parse(texto) };
        } catch {
          return { status: resposta.status, corpo: { textoBruto: texto.slice(0, 300) } };
        }
      },
      { processo: PROCESSO, formFields: massa.formFields, marca: massa.marca },
    );

    if (resultado.status !== 200 || !resultado.corpo?.processInstanceId) {
      console.log(`[falhou] ${massa.marca} — HTTP ${resultado.status}: ${JSON.stringify(resultado.corpo).slice(0, 300)}`);
      continue;
    }

    const registro = {
      processInstanceId: resultado.corpo.processInstanceId,
      marca: massa.marca,
      semeadaEm: new Date().toISOString(),
      proximoEstado: resultado.corpo.nextState,
    };
    appendFileSync(LIVRO, JSON.stringify(registro) + '\n');
    console.log(`[ok] ${registro.processInstanceId}  ${massa.marca}  → próxima atividade ${registro.proximoEstado}`);

    // Espaçamento entre criações: o Fluig tem proteção contra volume de requisições. Isto é
    // limitação de RITMO de escrita, não sincronização — a única espera por tempo que esta
    // base de código admite.
    if (i < quantidade - 1) await pagina.waitForTimeout(3_000);
  }

  console.log(
    `\nLivro: ${LIVRO}. Onde cada uma parou: node scripts/semear-massa.mjs --acompanhar\n` +
      'A massa fica VIVA de propósito — marcada QA-MASSA na justificativa e na observação do item.\n',
  );
}

await navegador.close();
