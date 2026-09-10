// @ts-check
/**
 * Empurra a massa semeada que está parada em pool: assume a tarefa e movimenta.
 *
 * ## Para que serve
 *
 * A SC semeada por `scripts/semear-massa.mjs` para na atividade **236 "Correção"** sempre que a
 * integração do ERP falha em *Grava SC e Anexos* (233). Correção é uma tarefa de POOL do grupo
 * `G.P.Requisicao_de_Compras_Correcoes`, do qual a conta de automação participa — reenviá-la
 * devolve a SC para 233, ou seja, **é uma nova tentativa de gravar no ERP**.
 *
 * Então o ciclo de vida da massa neste ambiente é: semear → (ERP fora) → Correção → esperar o
 * serviço voltar → empurrar → 233 de novo → seguir o fluxo.
 *
 * ## O caminho, e por que é pela interface
 *
 * `GET /ecm/api/rest/ecm/workflowView/takeTask` responde 500
 * (`javax.persistence.NoResultException`) — o "Assumir" do produto é tratado no cliente e não
 * passa por essa rota. Então assumir é pela Central de Tarefas mesmo:
 *
 * Central de Tarefas → **Mais opções** → **Tarefas em pool** → link do grupo → **Assumir**.
 *
 * ⚠️ O link do grupo tem **duas cópias no DOM** e só uma é visível; clicar na primeira dá
 * "element is not visible". Por isso a busca abaixo percorre os candidatos.
 *
 * Movimentar, aí sim, é direto: abrir a tarefa em modo de movimentação e clicar **Enviar**,
 * que dispara `POST /ecm/api/rest/ecm/workflowView/send`.
 *
 * ## Uso
 *
 * ```bash
 * node scripts/empurrar-massa.mjs                 # todas as do livro que estiverem em pool
 * node scripts/empurrar-massa.mjs 96363 96369     # só estas
 * ```
 */
import dotenv from 'dotenv';
import { chromium } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

import { ARQUIVO_AUTENTICACAO } from '../fixtures/global-setup.js';
import { verificarServicoErp } from '../utils/servico-erp.js';

dotenv.config({ path: process.env.ENV_FILE ?? '.env.test', quiet: true });

/**
 * Livro-razão da massa semeada.
 *
 * **Não** pode viver em `test-results/`: aquele é o `outputDir` do Playwright, e toda execução
 * o apaga. Custou duas reconstruções em 10/09/2026 até eu perceber. Fica ao lado de
 * `playwright/.auth`, que sobrevive às execuções pelo mesmo motivo.
 */
const LIVRO = 'playwright/.massa/semeada.jsonl';
const GRUPO_CORRECOES = 'G.P.Requisicao_de_Compras_Correcoes';

const pedidos = process.argv.slice(2).filter((a) => /^\d+$/.test(a));
const alvos = pedidos.length
  ? pedidos
  : existsSync(LIVRO)
    ? readFileSync(LIVRO, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((l) => String(JSON.parse(l).processInstanceId))
    : [];

if (alvos.length === 0) {
  console.error(`Nada a empurrar: nenhum id informado e ${LIVRO} vazio ou inexistente.`);
  process.exit(1);
}

const navegador = await chromium.launch();
const contexto = await navegador.newContext({
  storageState: JSON.parse(readFileSync(ARQUIVO_AUTENTICACAO, 'utf8')),
  locale: 'pt-BR',
  baseURL: process.env.BASE_URL,
});
const pagina = await contexto.newPage();
await pagina.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded', timeout: 90_000 });

// Empurrar com o ERP fora só gasta tempo: a SC volta para a Correção pelo mesmo motivo.
const servico = await verificarServicoErp(pagina);
console.log(`\nServiço do ERP: ${servico.noAr ? 'NO AR' : 'FORA'} — ${servico.descricao}`);
if (!servico.noAr && !process.env.PULAR_GATE_ERP) {
  console.error('\nNão vou empurrar com o serviço fora — a SC voltaria para a Correção pelo mesmo motivo.');
  console.error('Para insistir mesmo assim: PULAR_GATE_ERP=1 node scripts/empurrar-massa.mjs');
  await navegador.close();
  process.exit(1);
}

/**
 * @param {string} rota
 * @returns {Promise<any>}
 */
function ler(rota) {
  return pagina.evaluate(async (r) => {
    const resposta = await fetch(r, { headers: { Accept: 'application/json' } });
    return JSON.parse(await resposta.text());
  }, rota);
}

/**
 * Tarefa pendente da solicitação, se houver.
 * @param {string} id
 */
async function tarefaPendente(id) {
  const tarefas = await ler(`/process-management/api/v2/requests/${id}/tasks`);
  return (tarefas.items ?? []).find(
    (/** @type {any} */ t) => t.status !== 'COMPLETED' && t.status !== 'TRANSFERRED',
  );
}

/** Abre a listagem de pool do grupo de Correções. */
async function abrirPoolDeCorrecoes() {
  await pagina.goto('/portal/p/1/pagecentraltask', { waitUntil: 'domcontentloaded' });
  await pagina.getByRole('heading', { name: 'Central de tarefas' }).waitFor({ state: 'visible', timeout: 60_000 });
  const maisOpcoes = pagina.getByRole('link', { name: 'Mais opções' });
  if (await maisOpcoes.isVisible().catch(() => false)) await maisOpcoes.click();
  await pagina.getByRole('link', { name: /^Tarefas em pool/ }).click();
  await pagina.waitForTimeout(3_000);

  for (const candidato of await pagina.locator(`a[data-node*="${GRUPO_CORRECOES}"]`).all()) {
    if (await candidato.isVisible().catch(() => false)) {
      await candidato.click();
      await pagina.waitForTimeout(4_000);
      return true;
    }
  }
  return false;
}

console.log(`\nEmpurrando ${alvos.length} solicitação(ões)\n${'='.repeat(78)}`);

/** @type {Array<{id: string, desfecho: string}>} */
const relatorio = [];

for (const id of alvos) {
  const antes = await tarefaPendente(id);
  if (!antes) {
    relatorio.push({ id, desfecho: 'sem tarefa pendente (encerrada ou em atividade automática)' });
    continue;
  }

  // 1) Assumir, se ainda estiver no pool. A listagem é reaberta a cada volta porque a volta
  //    anterior deixou a página na tela da tarefa movimentada.
  const abriu = String(antes.assignee?.code ?? '').startsWith('Pool:Group:')
    ? await abrirPoolDeCorrecoes()
    : false;
  if (String(antes.assignee?.code ?? '').startsWith('Pool:Group:') && abriu) {
    const cartao = pagina.locator('task-card-component').filter({ hasText: id }).first();
    if (await cartao.isVisible().catch(() => false)) {
      await cartao.getByText('Assumir', { exact: true }).click();
      await pagina
        .getByRole('heading', { name: new RegExp(`assumiu a solicitação ${id}`, 'i') })
        .waitFor({ state: 'visible', timeout: 30_000 })
        .catch(() => {});
      const fechar = pagina.getByRole('button', { name: 'Fechar' });
      if (await fechar.isVisible().catch(() => false)) await fechar.click();
      await pagina.waitForTimeout(2_000);
    } else {
      relatorio.push({ id, desfecho: `cartão não encontrado no pool (tarefa em ${antes.state?.stateName})` });
      continue;
    }
  }

  // 2) Movimentar. Esperar a atribuição aparecer no servidor: logo depois do "Assumir" a
  //    consulta ainda devolve o pool, e montar a URL com isso leva à tela que não abre.
  let agora = await tarefaPendente(id);
  for (let volta = 0; volta < 10 && String(agora?.assignee?.code ?? '').startsWith('Pool:Group:'); volta += 1) {
    await pagina.waitForTimeout(3_000);
    agora = await tarefaPendente(id);
  }
  const url =
    `/portal/p/1/pageworkflowview?app_ecm_workflowview_processInstanceId=${id}` +
    `&app_ecm_workflowview_currentMovto=${agora?.movementSequence}` +
    `&app_ecm_workflowview_taskUserId=${encodeURIComponent(String(process.env.QA_USERNAME ?? 'TOTVS-FS'))}` +
    '&app_ecm_workflowview_managerMode=false';

  await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  // `isVisible()` NÃO espera — devolve o estado do instante. Com o ERP no ar o formulário passou
  // a montar de verdade (antes só exibia a faixa de erro), e a montagem leva bem mais que a
  // leitura instantânea: as duas primeiras tentativas relataram "botão Enviar não apareceu" em
  // tarefas que abriam normalmente. Quem espera é `waitFor`.
  const enviar = pagina.getByRole('button', { name: /^Enviar$/ });
  const apareceu = await enviar
    .waitFor({ state: 'visible', timeout: 120_000 })
    .then(() => true)
    .catch(() => false);
  if (!apareceu) {
    relatorio.push({ id, desfecho: 'a tarefa não abriu em modo de movimentação (botão Enviar não apareceu)' });
    continue;
  }

  const resposta = pagina
    .waitForResponse((r) => r.url().includes('/workflowView/send') && r.request().method() === 'POST', {
      timeout: 120_000,
    })
    .catch(() => null);
  await enviar.click();
  const r = await resposta;
  relatorio.push({ id, desfecho: r ? `movimentada (send HTTP ${r.status()})` : 'clicou em Enviar, mas nenhum send saiu' });

  // Ritmo de escrita, não sincronização: o Fluig tem proteção contra volume de requisições.
  await pagina.waitForTimeout(3_000);
}

console.log('');
for (const linha of relatorio) console.log(`${linha.id}  ${linha.desfecho}`);
console.log(`\nOnde cada uma parou agora: node scripts/semear-massa.mjs --acompanhar\n`);

await navegador.close();
