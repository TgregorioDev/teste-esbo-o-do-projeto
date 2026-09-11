// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../../utils/pre-condicao.js';
import { repetirSeFalhaDeRede } from '../../../utils/rede.js';

/**
 * FSWTBC-4816 e família (SDCASSI-300 / 450 / 462 / 536) — a fila de integração do Faturamento
 * de Contratos não pode reter instância indefinidamente.
 *
 * Os chamados desta família constam todos FECHADOS, e a fila continua travando: medido em
 * 04/09/2026 e reconferido em 08/09, as instâncias 111973, 111977 e 111980 estão em
 * *Aguarda processamento Fila Protheus* (sequência 182) desde 14–17/08 — 22 a 25 dias — contra
 * um SLA real de 7 minutos numa instância saudável. Este teste é o oráculo que faltava: ele
 * reprova enquanto houver instância presa, e fica verde sozinho quando a fila drenar.
 *
 * Por que é executável hoje, sem perfil nenhum: tudo é LEITURA da API v2 de processos, que
 * responde para a sessão comum. Nada é criado, movimentado ou cancelado.
 *
 * Duas observações da medição que explicam por que o defeito passa despercebido em produção:
 *
 * - a tarefa presa fica com `assignee.login = "admin"` e `chosenAssignees = null` — é uma
 *   tarefa órfã, ninguém a vê como sua;
 * - `slaStatus` responde **ON_TIME** mesmo depois de 22 dias, porque a atividade não tem
 *   `deadlineSpecification`. Sem prazo configurado, nenhum alerta do Fluig dispara.
 */

/** Sequência da atividade de fila no `wf_faturamento_contratos`, confirmada por movimento real. */
const SEQUENCIA_FILA = 182;

/**
 * Teto de permanência aceitável na fila. O SLA observado numa instância saudável é de ~7 min;
 * 30 min dá folga de sobra para lentidão de integração sem esconder travamento.
 */
const LIMITE_MINUTOS = 30;

/**
 * Quantas páginas de 200 instâncias varrer.
 *
 * A paginação NÃO é opcional aqui, e isso custou uma execução: a primeira versão deste teste
 * lia só a primeira página (as 200 mais recentes, de 112087 em diante) e passava VERDE, porque
 * as instâncias travadas — 111973, 111977 e 111980 — estão na segunda página. Um teste de fila
 * que só olha o começo da fila mede exatamente o que não interessa.
 */
const MAX_PAGINAS = 10;

test.describe('Fila de integração do Faturamento de Contratos (FSWTBC-4816)', () => {
  // `@bug`: reprova hoje por defeito NUNCA corrigido, não por regressão desta execução. A tag
  // mantém o gate desbloqueado (a família SDCASSI-300/450/462/536 consta fechada, mas a fila
  // segue travando) sem esconder o vermelho — quando a fila drenar, fica verde sozinho.
  test('@bug nenhuma instância pode ficar presa em "Aguarda processamento Fila Protheus"', async ({
    page,
  }) => {
    test.info().setTimeout(180_000);

    // A API de processos é consultada de dentro da página: `page.request` já levou 403 do WAF
    // neste tenant por falta de `User-Agent`/`Referer` de navegador (ver `docs/mapa-do-ambiente.md`).
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

    const resultado = await repetirSeFalhaDeRede(() => page.evaluate(
      async ({ sequencia, maxPaginas }) => {
        /** @param {string} url */
        const json = async (url) => {
          const r = await fetch(url, { headers: { Accept: 'application/json' } });
          return { status: r.status, corpo: await r.json().catch(() => null) };
        };

        const presas = [];
        let inspecionadas = 0;
        let paginas = 0;
        let temMais = true;

        // `expand=currentMovements` traz a atividade corrente (com `state.sequence` e
        // `startDate`) dentro da própria listagem. Sem isso seria uma chamada por instância —
        // centenas de requisições para responder a mesma pergunta.
        for (let pagina = 1; pagina <= maxPaginas && temMais; pagina += 1) {
          const lista = await json(
            `/process-management/api/v2/requests?pageSize=200&page=${pagina}` +
              `&processId=wf_faturamento_contratos&expand=currentMovements`,
          );
          if (lista.status !== 200) return { erro: `lista respondeu ${lista.status}` };

          const itens = lista.corpo?.items ?? [];
          if (itens.length === 0) break;
          paginas = pagina;
          temMais = Boolean(lista.corpo?.hasNext);

          for (const inst of itens) {
            if (inst.status !== 'OPEN') continue;
            inspecionadas += 1;
            for (const mov of inst.currentMovements ?? []) {
              if (mov.state?.sequence !== sequencia) continue;
              presas.push({
                instancia: inst.processInstanceId,
                atividade: mov.state?.stateName,
                desde: mov.startDate,
                minutos: Math.round((Date.now() - new Date(mov.startDate).getTime()) / 60000),
                requisitante: mov.requester?.login ?? null,
                slaStatus: mov.slaStatus,
                temPrazo: Boolean(mov.deadlineDate),
              });
            }
          }
        }
        return { inspecionadas, paginas, aindaTemMais: temMais, presas };
      },
      { sequencia: SEQUENCIA_FILA, maxPaginas: MAX_PAGINAS },
    ));

    if (resultado.erro) {
      faltaPreCondicao(`(ambiente): ${resultado.erro} ao listar instâncias do Faturamento`);
    }
    if (resultado.inspecionadas === 0) {
      faltaPreCondicao(
        '(ambiente): nenhuma instância aberta de Faturamento de Contratos para inspecionar',
      );
    }

    const presas = resultado.presas ?? [];
    const travadas = presas.filter((p) => p.minutos > LIMITE_MINUTOS);

    test.info().annotations.push({
      type: 'fila-faturamento',
      description:
        `${resultado.inspecionadas} instância(s) aberta(s) em ${resultado.paginas} página(s)` +
        `${resultado.aindaTemMais ? ' (há mais páginas além do teto varrido)' : ''}; ` +
        `${presas.length} na fila (${SEQUENCIA_FILA}); ${travadas.length} acima de ${LIMITE_MINUTOS} min. ` +
        (travadas.length
          ? `Sem prazo configurado em ${travadas.filter((t) => !t.temPrazo).length} delas.`
          : ''),
    });

    const detalhe = travadas
      .sort((a, b) => b.minutos - a.minutos)
      .map(
        (t) =>
          `instância ${t.instancia}: ${Math.floor(t.minutos / 1440)}d ${Math.floor(
            (t.minutos % 1440) / 60,
          )}h na fila (desde ${t.desde}), aberta por "${t.requisitante}", slaStatus=${t.slaStatus}`,
      );

    expect(
      detalhe,
      `instância(s) retida(s) na fila de integração acima de ${LIMITE_MINUTOS} min. O SLA real ` +
        `desta atividade é de ~7 min — acima disso não é lentidão, é travamento, e a medição ` +
        `não chega ao Protheus até alguém intervir manualmente`,
    ).toEqual([]);
  });
});
