// @ts-check
import { test, expect } from '@playwright/test';
import { FALHA_DE_REDE } from './rede.js';
import { criarMassaSolicitacaoCompra } from '../factories/massa-solicitacao-compra.js';
import { CentralTarefasComprasPage } from '../pages/CentralTarefasComprasPage.js';
import { aguardarEstadoNoServidor, saiuDaIntegracao } from './estado-da-solicitacao.js';
import { faltaPreCondicao } from './pre-condicao.js';

/**
 * Solicitação de Compras de MASSA, criada por API — para os testes em que a SC é pré-requisito, e
 * não o comportamento sob teste.
 *
 * ## Por que por API
 *
 * A skill manda preparar dado por API quando a tela não é o que se testa. Os testes de tarefa e de
 * aprovação criavam a SC pelo formulário clássico — anexo, zooms de produto e de rateio, ~4 minutos —
 * só para ter uma tarefa no pool, e herdavam cada instabilidade do formulário como vermelho alheio ao
 * que mediam. O `POST /start` com `targetState: 0` produz a mesma SC que o widget criaria: percorre o
 * BPMN, grava no Protheus e cai no pool da Validação do Gestor (medido em 10/09/2026, SCs 96363 e
 * seguintes — `scripts/semear-massa.mjs`). É a etapa 4 de `docs/plano-de-evolucao-2026-09-11.md`.
 *
 * Quem testa o FORMULÁRIO continua criando pela tela (`ciclo-solicitacao-compras`,
 * `validacoes-solicitacao-compras`): lá a tela é o comportamento.
 *
 * ## Rastreabilidade e limpeza
 *
 * O carimbo `QA-MASSA-<uuid>` da factory vai na justificativa e na observação do item, e a anotação
 * `sc-criada` entra no livro-razão da fixture `evidence`. O teardown tenta cancelar; SC que já passou
 * da 233 não cancela (defeito E6 — `beforeCancelProcess` recebe 404 "sem cotação") e fica aberta, com
 * o carimbo.
 */

/** Validação do Gestor no BPMN de `wf_solicitacao_compras`. */
const ATIVIDADE_VALIDACAO_DO_GESTOR = 7;

/**
 * @typedef {Object} ScDeMassa
 * @property {string} numeroProcesso `processInstanceId`, como texto — a forma que as telas usam
 * @property {string} marca carimbo `QA-MASSA-xxxxxxxx`
 */

/**
 * Cria a SC pelo `/start`. Declara PRÉ-CONDIÇÃO quando o motor não devolve a instância: o que se
 * mede nos consumidores é a tarefa, e "não consegui criar a massa" não pode sair como defeito dela.
 *
 * Não repete por falha de rede: é escrita, e repetir um `/start` que chegou ao servidor duplicaria
 * a SC (`utils/rede.js`). Mas também não deixa a falha de transporte sair como erro do teste: medido em
 * 11/09/2026, o CT-CMP-04-S1 morreu em 720 ms com `Failed to fetch` no `/start`, antes de haver SC, e o
 * gate leu isso como regressão da REPROVAÇÃO. É infraestrutura — vira pré-condição com a marca, para
 * rastrear a SC caso o pedido tenha chegado ao servidor.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ quantidade?: number, precoUnitario?: number }} [overrides] o que o teste precisa VALIDAR
 * @returns {Promise<ScDeMassa>}
 */
export async function criarScPorApi(page, overrides = {}) {
  if (!/^https?:/.test(page.url())) {
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
  }
  const massa = criarMassaSolicitacaoCompra(overrides);
  const resposta = await page.evaluate(
    async ({ formFields, marca }) => {
      const r = await fetch('/process-management/api/v2/processes/wf_solicitacao_compras/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ targetState: 0, targetAssignee: '', comment: `${marca} — massa por API`, formFields }),
      });
      const texto = await r.text();
      /** @type {any} */
      let corpo = null;
      try {
        corpo = JSON.parse(texto);
      } catch {
        // corpo não-JSON: o trecho vai inteiro na pré-condição abaixo
      }
      return { status: r.status, id: corpo?.processInstanceId, trecho: texto.slice(0, 300) };
    },
    { formFields: massa.formFields, marca: massa.marca },
  ).catch((/** @type {unknown} */ erro) => {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    if (!FALHA_DE_REDE.test(mensagem)) throw erro;
    return faltaPreCondicao(
      `(infraestrutura): o POST /start da SC de massa morreu no transporte (${mensagem.split('\n')[0]}) — não ` +
        `repetido, porque um /start que tenha chegado ao servidor duplicaria a SC. Se ela foi criada, está ` +
        `marcada ${massa.marca}.`,
    );
  });

  if (resposta.status !== 200 || typeof resposta.id !== 'number') {
    faltaPreCondicao(
      '(ambiente): não foi possível criar a SC de massa — POST /processes/wf_solicitacao_compras/start ' +
        `respondeu HTTP ${resposta.status}: ${resposta.trecho}`,
    );
  }

  const sc = { numeroProcesso: String(resposta.id), marca: massa.marca };
  try {
    test.info().annotations.push({ type: 'sc-criada', description: `${sc.numeroProcesso} (${sc.marca}, por API)` });
  } catch {
    // Fora de um teste (script de manutenção) não há relatório para anotar.
  }
  return sc;
}

/**
 * Cria a SC e espera, NO SERVIDOR, ela cair no pool da Validação do Gestor.
 *
 * Pré-condição de ambiente quando a integração não sai em 200 s, ou quando a SC sai dela para outro
 * lugar: "Correção" (236) é o ERP recusando a SC; "Ajustar Informações" (11) é o ramo intermitente do
 * BPMN (`docs/investigacoes/bpmn-desvio-ajustar-informacoes.md`).
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ quantidade?: number, precoUnitario?: number }} [overrides]
 * @returns {Promise<ScDeMassa>}
 */
export async function criarScNoPoolDoGestor(page, overrides = {}) {
  const sc = await criarScPorApi(page, overrides);
  const tarefas = await aguardarEstadoNoServidor(page, sc.numeroProcesso, saiuDaIntegracao, {
    timeout: 200_000,
    oQueSeEspera: 'sair da integração com o Protheus (tarefa humana aberta)',
  });

  const humana = tarefas.find(
    (t) => t.status === 'NOT_COMPLETED' && !String(t.assignee?.code ?? '').startsWith('System:'),
  );
  if (humana?.state?.sequence !== ATIVIDADE_VALIDACAO_DO_GESTOR) {
    faltaPreCondicao(
      `(ambiente): a SC de massa ${sc.numeroProcesso} saiu da integração para "${humana?.state?.stateName}" ` +
        `(atividade ${humana?.state?.sequence}, responsável ${humana?.assignee?.code}), e não para a ` +
        'Validação do Gestor. Correção (236) é o ERP recusando a SC; "Ajustar Informações" (11) é o ramo ' +
        'intermitente do BPMN.',
    );
  }
  return sc;
}

/**
 * Cria a SC, espera o pool da Validação do Gestor e ASSUME a tarefa pela tela de detalhe — a tela de
 * decisão fica aberta, como ficava quando a massa vinha do formulário clássico.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ quantidade?: number, precoUnitario?: number }} [overrides]
 * @returns {Promise<ScDeMassa>}
 */
export async function criarEAssumirNoPoolDoGestor(page, overrides = {}) {
  const sc = await criarScNoPoolDoGestor(page, overrides);
  const central = new CentralTarefasComprasPage(page);

  // O servidor já tem a tarefa no pool. A tela de detalhe pode demorar a oferecer "Assumir tarefa"
  // (cache do widget, medido em 25/08/2026) — reabre até o botão aparecer. Estourar aqui, com o
  // servidor dizendo "no pool", é a tela de outro portal atrasada, não o que os consumidores medem.
  try {
    await expect(async () => {
      await central.abrirDetalheDaSolicitacao(sc.numeroProcesso);
      await expect(central.botaoAssumirTarefaAtual()).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 90_000, intervals: [5_000, 10_000] });
  } catch (erro) {
    faltaPreCondicao(
      `(ambiente): a SC de massa ${sc.numeroProcesso} está no pool da Validação do Gestor no servidor, ` +
        'mas a tela de detalhe não ofereceu "Assumir tarefa" em 90s. ' +
        `Causa: ${erro instanceof Error ? erro.message.split('\n')[0] : String(erro)}`,
    );
  }

  await central.assumirTarefaAtual(sc.numeroProcesso);
  return sc;
}
