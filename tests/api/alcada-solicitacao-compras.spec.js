// @ts-check
import { test, expect } from '../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../utils/pre-condicao.js';

/**
 * FSWTBC-5118 — a alçada é tarefa de gente com nome, não de pool.
 *
 * O chamado nasceu de "a SC 105487 não caiu para o gestor" e foi apurado como **não-defeito**: o
 * Protheus devolveu `CR_USER = 001170` (Daniele Ramos Oliveira) e o Fluig atribuiu a ela; a
 * proposta somava R$ 244.000.000,00 e por isso subiu à Gerente Executiva. Medido em 09/09/2026,
 * a SC 105487 continua com a tarefa de *Aprovação de Alçadas* aberta e nominalmente atribuída a
 * essa mesma pessoa — o caminho descrito no chamado segue valendo.
 *
 * O que este teste protege não é aquele número de SC (fixar instância é o que a suíte evita em
 * toda parte), e sim o **invariante**: nenhuma tarefa aberta de alçada pode estar num grupo.
 *
 * ## Por que "num grupo" é o oráculo certo
 *
 * Alçada em pool significa tarefa em consenso para todo mundo do grupo — exatamente o que o
 * FSWTBC-3957 descreve como o comportamento antigo, que *"amplia indevidamente o público
 * envolvido"* e deixa uma alçada ser tratada por quem não tem competência para ela. Aquele
 * chamado não é coberto aqui (forçar a falha do `mc_aprovadoresPorAlcadas` exigiria indisponibilizar
 * o ERP do cliente), mas a consequência que ele produzia é observável, e é ela que fica guardada.
 *
 * ## O que distingue pessoa de grupo, medido
 *
 * O `assignee` de um grupo tem `code` prefixado por `Pool:Group:` e **não traz** `mail` nem
 * `login`; o de uma pessoa traz os dois. Comparar pelo `name` não serve: nada impede um grupo
 * chamado sem a palavra "Grupo".
 *
 * ## Sobre a leitura por API
 *
 * `page.request` leva 403 do WAF em `/process-management/**` (falta `User-Agent` e `Referer` de
 * navegador), então a consulta é `fetch` de dentro da página. `expand` aceita **um** valor por
 * chamada.
 */

/** Estado do BPM em que a alçada é decidida. */
const ETAPA_ALCADA = 'Aprovação de Alçadas';

/** Páginas de 100 varridas em busca de massa. A primeira instância em alçada apareceu na 8ª. */
const MAX_PAGINAS = 15;

/** Quantas instâncias inspecionar em detalhe — o suficiente para o invariante, sem varrer a base. */
const MAX_INSTANCIAS = 5;

test.describe('Aprovação de Alçadas — atribuição', () => {
  test('FSWTBC-5118 — toda tarefa aberta de alçada tem responsável nominal, nunca um pool', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

    /** @type {number[]} */
    const emAlcada = await page.evaluate(
      async ({ etapa, maxPaginas, maxInstancias }) => {
        /** @type {number[]} */
        const achadas = [];
        for (let pagina = 1; pagina <= maxPaginas; pagina += 1) {
          const resposta = await fetch(
            `/process-management/api/v2/requests?pageSize=100&page=${pagina}&expand=currentMovements`,
            { headers: { Accept: 'application/json' } },
          );
          if (!resposta.ok) break;
          const corpo = await resposta.json();
          const itens = /** @type {any[]} */ (corpo.items ?? []);
          for (const item of itens) {
            const movimentos = /** @type {any[]} */ (item.currentMovements ?? []);
            const estados = movimentos.map((m) => m.state?.stateName ?? '');
            if (estados.includes(etapa)) achadas.push(item.processInstanceId);
          }
          if (achadas.length >= maxInstancias || itens.length < 100) break;
        }
        return achadas.slice(0, maxInstancias);
      },
      { etapa: ETAPA_ALCADA, maxPaginas: MAX_PAGINAS, maxInstancias: MAX_INSTANCIAS },
    );

    if (emAlcada.length === 0) {
      faltaPreCondicao(
        `(ambiente): nenhuma solicitação parada em "${ETAPA_ALCADA}" nas ${MAX_PAGINAS} primeiras ` +
          'páginas de solicitações — sem alçada aberta não há atribuição a verificar.',
      );
    }

    const inspecao = await page.evaluate(
      async ({ ids, etapa }) => {
        /** @type {Array<{instancia: number, aberturas: Array<{assignee: string, code: string, temLogin: boolean}>, escolhidos: string[]}>} */
        const resultado = [];
        for (const id of ids) {
          const resposta = await fetch(
            `/process-management/api/v2/requests/${id}/tasks?expand=chosenAssignees`,
            { headers: { Accept: 'application/json' } },
          );
          if (!resposta.ok) continue;
          const itens = /** @type {any[]} */ ((await resposta.json()).items ?? []);
          const daEtapa = itens.filter((t) => (t.state?.stateName ?? '') === etapa);
          resultado.push({
            instancia: id,
            aberturas: daEtapa
              .filter((t) => t.status === 'NOT_COMPLETED')
              .map((t) => ({
                assignee: t.assignee?.name ?? '(sem responsável)',
                code: t.assignee?.code ?? '',
                temLogin: Boolean(t.assignee?.login && t.assignee?.mail),
              })),
            escolhidos: daEtapa.flatMap((t) =>
              /** @type {any[]} */ (t.chosenAssignees ?? []).map((c) => c.code ?? c.name ?? ''),
            ),
          });
        }
        return resultado;
      },
      { ids: emAlcada, etapa: ETAPA_ALCADA },
    );

    test.info().annotations.push({
      type: 'alcada-atribuicao',
      description: inspecao
        .map(
          (i) =>
            `${i.instancia}: abertas=[${i.aberturas
              .map((a) => `${a.assignee}${a.temLogin ? '' : ' (SEM login/mail)'}`)
              .join('; ')}] escolhidos=[${i.escolhidos.join('; ')}]`,
        )
        .join(' · '),
    });

    const comAlcadaAberta = inspecao.filter((i) => i.aberturas.length > 0);
    if (comAlcadaAberta.length === 0) {
      faltaPreCondicao(
        `(ambiente): as instâncias ${emAlcada.join(', ')} passaram por "${ETAPA_ALCADA}" mas não ` +
          'têm tarefa aberta nessa etapa neste momento.',
      );
    }

    // O invariante. `Pool:` no code é a assinatura da atribuição a grupo — o caminho que o
    // FSWTBC-3957 descreve como indevido, e que o FSWTBC-5118 confirma não ser o que acontece
    // quando o Protheus devolve um CR_USER válido.
    const emPool = comAlcadaAberta.flatMap((i) =>
      i.aberturas
        .filter((a) => a.code.startsWith('Pool:') || !a.temLogin)
        .map((a) => `instância ${i.instancia} → "${a.assignee}" (${a.code || 'sem code'})`),
    );

    expect(
      emPool,
      'tarefa de Aprovação de Alçadas atribuída a um pool/grupo em vez de a um aprovador ' +
        'nominal. Duas leituras possíveis, e as duas pedem atenção: ou o Protheus não devolveu ' +
        'CR_USER válido e o fluxo caiu no grupo (o cenário do FSWTBC-3957, que deveria ir para ' +
        'Correção), ou a atribuição individual do FSWTBC-5118 regrediu',
    ).toEqual([]);
  });
});
