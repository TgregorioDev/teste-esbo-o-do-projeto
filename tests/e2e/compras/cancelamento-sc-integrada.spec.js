// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../../utils/pre-condicao.js';
import { cancelarSolicitacoes, conferirCancelamento } from '../../../utils/cancelamento-fluig.js';
import { lerTarefaPendente, descreverTarefa } from '../../../utils/estado-da-solicitacao.js';
import { criarMassaSolicitacaoCompra } from '../../../factories/massa-solicitacao-compra.js';
import { criarJustificativaDecisao } from '../../../factories/produto-compra.js';

/**
 * Cancelamento de uma Solicitação de Compras que já existe no Protheus e ainda não tem cotação.
 *
 * ## O defeito (medido em 11/09/2026)
 *
 * Ao cancelar, o evento `beforeCancelProcess` de `wf_solicitacao_compras` pede ao ERP a exclusão
 * das cotações da SC. Sem nenhuma cotação, o ERP responde 404 e o evento aborta:
 *
 * ```
 * BPMBeforeCancelException — Falha na Integração com ERP.
 *   code: 404 message: Não foram encontradas contações para exclusão
 * ```
 *
 * Os DOIS caminhos de cancelamento falham igual — `POST /api/public/2.0/workflows/cancelInstances`
 * (Central de Tarefas) e `POST /ecm/api/rest/ecm/workflowView/cancelInstance/` (detalhe). Na
 * limpeza das 14 SCs órfãs de 10/09/2026, as 5 sem `numSolCompra` cancelaram e as 9 com número
 * (`000937`–`000957`) foram recusadas. Ou seja: entre "Grava SC e Anexos" e a geração da
 * cotação, **ninguém cancela a SC — nem o próprio solicitante**.
 *
 * O comportamento esperado é o que este teste afirma: "não há cotação" significa "nada a
 * excluir", e o cancelamento segue. Enviado ao desenvolvedor em 11/09/2026; o teste leva `@bug`
 * enquanto a correção (ou a explicação de que é intencional) não vier.
 *
 * ## Por que a massa é criada por API
 *
 * O que se mede é o CANCELAMENTO, e a pré-condição é exata: SC gravada no ERP (`numSolCompra`
 * preenchido), parada antes da cotação. O `POST /start` com `targetState: 0` produz a mesma SC
 * que o widget criaria — ela percorre o BPMN, grava no Protheus e cai na Validação do Gestor
 * (`docs/massa-de-dados-no-ambiente-dev.md`) — sem os minutos e as falhas alheias do formulário
 * clássico. `tests/e2e/tarefas/cancelamento-solicitacao.spec.js` usa questionário para NÃO
 * depender do Protheus; aqui a dependência é o próprio cenário.
 *
 * ## Resíduo
 *
 * Com o defeito presente, a SC deste teste não pode ser cancelada — nem pelo teardown, que usa o
 * mesmo endpoint. Ela fica aberta, com o carimbo `QA-MASSA` da factory. É o custo de medir o
 * defeito, e deixa de existir quando o produto for corrigido.
 */

/** Atividade do BPMN em que a SC recém-gravada no ERP passa a esperar decisão humana. */
const ATIVIDADE_VALIDACAO_DO_GESTOR = 7;

/**
 * Cria a SC pela API de start, com a massa da factory.
 *
 * Falha com `faltaPreCondicao` quando o motor não devolve a instância: o que se mede aqui é o
 * cancelamento, e "não consegui criar a massa" não pode sair como defeito dele.
 *
 * @param {import('@playwright/test').Page} page página em alguma rota do portal
 * @returns {Promise<number>} `processInstanceId`
 */
async function criarScPorApi(page) {
  const massa = criarMassaSolicitacaoCompra();
  const resposta = await page.evaluate(
    async ({ formFields, marca }) => {
      const r = await fetch('/process-management/api/v2/processes/wf_solicitacao_compras/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ targetState: 0, targetAssignee: '', comment: `${marca} — cancelamento de SC integrada`, formFields }),
      });
      const texto = await r.text();
      /** @type {any} */
      let corpo = null;
      try {
        corpo = JSON.parse(texto);
      } catch {
        // corpo não-JSON: o motivo vai inteiro na pré-condição abaixo
      }
      return { status: r.status, id: corpo?.processInstanceId, trecho: texto.slice(0, 300) };
    },
    { formFields: massa.formFields, marca: massa.marca },
  );

  if (resposta.status !== 200 || typeof resposta.id !== 'number') {
    faltaPreCondicao(
      '(ambiente): não foi possível criar a SC que serve de massa. ' +
        `POST /processes/wf_solicitacao_compras/start respondeu HTTP ${resposta.status}: ${resposta.trecho}`,
    );
  }
  return resposta.id;
}

/**
 * Campos do formulário da SC, lidos do servidor.
 * @param {import('@playwright/test').Page} page
 * @param {number} processInstanceId
 * @returns {Promise<Record<string, string>>}
 */
async function lerCamposDaSc(page, processInstanceId) {
  return page.evaluate(async (id) => {
    const r = await fetch(`/process-management/api/v2/requests/${id}?expand=formFields`, {
      headers: { Accept: 'application/json' },
    });
    const j = await r.json();
    return Object.fromEntries((j.formFields ?? []).map((/** @type {any} */ c) => [c.field, c.value ?? '']));
  }, processInstanceId);
}

test.describe('Cancelamento de SC integrada ao Protheus', () => {
  test('@destrutivo @bug SC já gravada no Protheus e ainda sem cotação deveria poder ser cancelada pelo solicitante', async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(300_000);
    const login = process.env.QA_USERNAME;
    if (!login) throw new Error('Variável de ambiente obrigatória não definida: QA_USERNAME');

    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
    const processInstanceId = await criarScPorApi(page);
    testInfo.annotations.push({ type: 'sc-criada', description: String(processInstanceId) });

    // ── Pré-condição, verificada no servidor: gravada no ERP e parada antes da cotação ─────
    // A atividade 233 conclui em 10–27s neste tenant (mediana 14s, medido em 10/09/2026) e
    // passa de 260s nas janelas de degradação do ERP. 180s é o mesmo prazo que o resto da suíte
    // usa para esta transição; estourar é ambiente, não defeito do cancelamento.
    try {
      await expect(async () => {
        const campos = await lerCamposDaSc(page, processInstanceId);
        const tarefa = await lerTarefaPendente(page, processInstanceId);
        expect(campos.numSolCompra, 'a SC ainda não foi gravada no Protheus').not.toBe('');
        expect(tarefa?.atividade, `a SC ainda não chegou à Validação do Gestor: ${descreverTarefa(tarefa)}`).toBe(
          ATIVIDADE_VALIDACAO_DO_GESTOR,
        );
      }).toPass({ timeout: 180_000, intervals: [5_000, 10_000] });
    } catch (erroDoPoll) {
      faltaPreCondicao(
        `(ambiente): a SC ${processInstanceId} não chegou ao estado que o caso exige (gravada no ` +
          'Protheus e na Validação do Gestor) em 180s. Sem isso não há o que cancelar. ' +
          `Causa do polling: ${erroDoPoll instanceof Error ? erroDoPoll.message.split('\n')[0] : erroDoPoll}`,
      );
    }

    const campos = await lerCamposDaSc(page, processInstanceId);
    expect(campos.numCotacao, 'o cenário exige SC ainda sem cotação').toBe('');
    const [antes] = await conferirCancelamento(page, [processInstanceId]);
    expect(
      antes,
      `a SC ${processInstanceId} deveria estar ABERTA antes do cancelamento — sem isso não se mede efeito`,
    ).toMatchObject({ status: 'OPEN', active: true });

    // ── Ação: o mesmo endpoint da Central de Tarefas ────────────────────────────────────
    const [resultado] = await cancelarSolicitacoes(page, [processInstanceId], {
      motivo: criarJustificativaDecisao('cancelamento'),
      login,
    });
    testInfo.annotations.push({
      type: 'resultado-cancelamento',
      description: `${resultado?.status}: ${String(resultado?.mensagem ?? '').replace(/<[^>]+>/g, ' ').slice(0, 300)}`,
    });

    expect(
      resultado?.status,
      `o solicitante deveria conseguir cancelar a própria SC ${processInstanceId} (Nº ERP ` +
        `${campos.numSolCompra}, sem cotação). O servidor recusou: ` +
        `${String(resultado?.mensagem ?? '(sem mensagem)').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}. ` +
        'Não haver cotação para excluir no ERP deveria significar "nada a excluir", não abortar o cancelamento',
    ).toBe('SUCCESS');

    const [depois] = await conferirCancelamento(page, [processInstanceId]);
    expect(
      depois,
      `a SC ${processInstanceId} deveria estar CANCELED e inativa no servidor depois do cancelamento`,
    ).toMatchObject({ status: 'CANCELED', active: false });
  });
});
