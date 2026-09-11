// @ts-check
import { test, expect } from '../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../utils/pre-condicao.js';
import { repetirSeFalhaDeRede } from '../../utils/rede.js';

/**
 * FSWTBC-4263 — a etapa que espera o retorno do ERP chama-se "Verificar retorno Protheus".
 *
 * Esta é a família de defeitos mais insidiosa que a análise dos 643 chamados encontrou: **três
 * nomes de atividade citados em chamados nunca existiram no processo**. "Verificar Trava
 * Orçamentária" é um deles — o nome real da sequência 317 é *Verificar retorno Protheus*, e ela
 * recebe QUALQUER erro do ERP, não só trava orçamentária. Quem lê o nome antigo procura uma
 * etapa que não existe e conclui a causa errada.
 *
 * O oráculo é a população ABERTA, não uma amostra do histórico: para cada instância aberta da
 * SC, o nome da atividade corrente vem do próprio motor. Um nome fantasma ali é defeito de
 * verdade; ausência num recorte do histórico não provaria nada (ver a nota em
 * `tests/e2e/portais/tracker-compras.spec.js`, onde essa armadilha custou uma iteração).
 *
 * Leitura pura — nada é movimentado.
 */

/** Nomes que aparecem em chamados e que a medição não encontrou no processo. */
const NOMES_FANTASMA = [/Verificar\s+Trava\s+Or[çc]ament[áa]ria/i, /Ajustes\s+na\s+Proposta/i];

/** Sequência da etapa de retorno do ERP, confirmada por movimento real. */
const SEQ_RETORNO_ERP = 317;

test.describe('Nomes de atividade da Solicitação de Compras (FSWTBC-4263)', () => {
  test('nenhuma instância aberta exibe nome de atividade que não existe no processo', async ({
    page,
  }) => {
    test.info().setTimeout(120_000);

    // `page.request` leva 403 do WAF em `/process-management` neste tenant.
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

    const observado = await repetirSeFalhaDeRede(() => page.evaluate(async (sequenciaRetorno) => {
      /** @type {Array<{ instancia: number, sequencia: number, nome: string }>} */
      const atividades = [];
      let temMais = true;
      for (let pagina = 1; pagina <= 3 && temMais; pagina += 1) {
        const r = await fetch(
          `/process-management/api/v2/requests?pageSize=200&page=${pagina}` +
            '&processId=wf_solicitacao_compras&expand=currentMovements',
          { headers: { Accept: 'application/json' } },
        );
        if (!r.ok) return null;
        const corpo = await r.json();
        temMais = Boolean(corpo?.hasNext);
        for (const inst of corpo?.items ?? []) {
          if (inst.status !== 'OPEN') continue;
          for (const mov of inst.currentMovements ?? []) {
            if (!mov?.state?.stateName) continue;
            atividades.push({
              instancia: inst.processInstanceId,
              sequencia: mov.state.sequence,
              nome: mov.state.stateName,
            });
          }
        }
      }
      return {
        atividades,
        naSequenciaDeRetorno: atividades.filter((a) => a.sequencia === sequenciaRetorno),
      };
    }, SEQ_RETORNO_ERP));

    if (!observado) {
      faltaPreCondicao('(ambiente): a API de solicitações não respondeu');
    }
    if (observado.atividades.length === 0) {
      faltaPreCondicao(
        '(ambiente): nenhuma instância aberta de Solicitação de Compras para auditar os nomes',
      );
    }

    const distintos = [...new Set(observado.atividades.map((a) => `${a.sequencia} ${a.nome}`))];

    test.info().annotations.push({
      type: 'nomes-de-atividade',
      description:
        `${observado.atividades.length} atividade(s) aberta(s), ${distintos.length} distinta(s): ` +
        `${JSON.stringify(distintos)}`,
    });

    const fantasmas = observado.atividades
      .filter((a) => NOMES_FANTASMA.some((re) => re.test(a.nome)))
      .map((a) => `instância ${a.instancia}: "${a.nome}" (seq ${a.sequencia})`);

    expect(
      fantasmas,
      'instância aberta exibindo nome de atividade que a medição não encontrou no processo — ' +
        'quem lê procura uma etapa inexistente',
    ).toEqual([]);

    // E onde a sequência de retorno do ERP aparecer, o nome tem de ser o real.
    for (const a of observado.naSequenciaDeRetorno) {
      expect(
        a.nome,
        `a sequência ${SEQ_RETORNO_ERP} da instância ${a.instancia} deveria se chamar ` +
          `"Verificar retorno Protheus"`,
      ).toBe('Verificar retorno Protheus');
    }
  });
});
