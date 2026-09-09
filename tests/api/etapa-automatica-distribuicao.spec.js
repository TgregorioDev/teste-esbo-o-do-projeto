// @ts-check
import { test, expect } from '../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../utils/pre-condicao.js';

/**
 * FSWTBC-3617 — a etapa automática *Distribuição Gestor Orçamentário* conclui sozinha.
 *
 * O caso pede percorrer uma SC centralizada até essa atividade e conferir que a integração
 * conclui sem erro. A atividade é **automática**: ninguém a movimenta, e o resultado dela se lê
 * no Histórico. Por isso ela não precisa de perfil nenhum para ser verificada — precisa de
 * instâncias que já passaram por lá, e a base tem muitas.
 *
 * ## O oráculo, e por que ele tem um relógio dentro
 *
 * Atividade automática que fica *aberta* é atividade que não rodou. Mas uma instância que
 * acabou de entrar nela está legitimamente aberta por alguns segundos — afirmar sobre isso daria
 * vermelho por corrida, não por defeito. Então o critério é o mesmo já usado na fila de
 * Faturamento: só conta como travada a que está aberta **há mais de 30 minutos**.
 *
 * Medido em 09/09/2026: entre as SCs recentes, todas as passagens por essa etapa estavam
 * `COMPLETED`.
 *
 * ## Detalhe do ambiente que decide o locator
 *
 * O nome da atividade no BPM é **"Distribuição Gestor Orçamentario"** — sem acento no último
 * "a". Comparar com o nome "correto" não casa nada, e o teste passaria vazio para sempre. Por
 * isso a busca é por prefixo, e o teste **exige** ter encontrado massa antes de afirmar.
 *
 * `page.request` leva 403 do WAF em `/process-management/**`; a leitura é `fetch` de dentro da
 * página.
 */

/** Prefixo do nome da atividade no BPM (o nome completo não tem acento no último "a"). */
const ETAPA = 'Distribuição Gestor Or';

/** Aberta por mais que isto, a etapa automática não rodou — é o mesmo limite da fila de FC. */
const LIMITE_MINUTOS = 30;

/** Páginas de 100 solicitações varridas em busca de SCs. */
const MAX_PAGINAS = 4;

/** SCs inspecionadas em detalhe. */
const MAX_SCS = 20;

test.describe('Etapas automáticas da Solicitação de Compras', () => {
  test('FSWTBC-3617 — a Distribuição Gestor Orçamentário não deixa solicitação parada', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

    const resultado = await page.evaluate(
      async ({ etapa, maxPaginas, maxScs }) => {
        /** @type {number[]} */
        const scs = [];
        for (let pagina = 1; pagina <= maxPaginas; pagina += 1) {
          const resposta = await fetch(
            `/process-management/api/v2/requests?pageSize=100&page=${pagina}`,
            { headers: { Accept: 'application/json' } },
          );
          if (!resposta.ok) break;
          const itens = /** @type {any[]} */ ((await resposta.json()).items ?? []);
          for (const item of itens) {
            if (item.processId === 'wf_solicitacao_compras') scs.push(item.processInstanceId);
          }
          if (scs.length >= maxScs || itens.length < 100) break;
        }

        /** @type {Array<{instancia: number, status: string, inicio: string|null}>} */
        const passagens = [];
        for (const id of scs.slice(0, maxScs)) {
          const resposta = await fetch(`/process-management/api/v2/requests/${id}/tasks`, {
            headers: { Accept: 'application/json' },
          });
          if (!resposta.ok) continue;
          const itens = /** @type {any[]} */ ((await resposta.json()).items ?? []);
          for (const tarefa of itens) {
            const nome = String(tarefa.state?.stateName ?? '');
            if (!nome.startsWith(etapa)) continue;
            passagens.push({
              instancia: id,
              status: String(tarefa.status ?? '?'),
              inicio: tarefa.startDate ?? null,
            });
          }
        }
        return { scsInspecionadas: scs.slice(0, maxScs).length, passagens };
      },
      { etapa: ETAPA, maxPaginas: MAX_PAGINAS, maxScs: MAX_SCS },
    );

    if (resultado.passagens.length === 0) {
      faltaPreCondicao(
        `(ambiente): nenhuma das ${resultado.scsInspecionadas} solicitações inspecionadas passou ` +
          `por uma atividade começando em "${ETAPA}" — sem passagem não há o que verificar.`,
      );
    }

    const agora = Date.now();
    const travadas = resultado.passagens
      .filter((p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED')
      .filter((p) => {
        const inicio = p.inicio ? new Date(p.inicio).getTime() : agora;
        return agora - inicio > LIMITE_MINUTOS * 60 * 1000;
      })
      .map((p) => `SC ${p.instancia} (${p.status}, desde ${p.inicio})`);

    test.info().annotations.push({
      type: 'distribuicao-gestor-orcamentario',
      description:
        `${resultado.scsInspecionadas} SCs inspecionadas · ${resultado.passagens.length} passagens ` +
        `pela etapa · abertas há mais de ${LIMITE_MINUTOS} min: ${travadas.length}`,
    });

    expect(
      travadas,
      `solicitação parada na etapa automática "${ETAPA}…" há mais de ${LIMITE_MINUTOS} minutos. ` +
        'Ninguém movimenta essa atividade: aberta é sinal de que a integração não concluiu, que ' +
        'é o cenário do FSWTBC-3617',
    ).toEqual([]);
  });
});
