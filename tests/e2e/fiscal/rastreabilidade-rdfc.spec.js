// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';

/**
 * CT-RDF-02-H — Rastreabilidade pai↔filho do RDFC (contrato de dados / integração).
 *
 * O RDFC (Recepção de Documentos Fiscais) é o único subprocesso Fluig genuíno do ambiente. O
 * elo pai→filho NÃO vive em `parentRequestId` — esse campo vem `null` mesmo para filhos reais
 * (confirmado em 27/08/2026: a instância 111901, filha de 111694, traz `parentRequestId: null`).
 *
 * O elo REAL, medido em campo:
 * - no FILHO: o formField `WKNumProcesPai` guarda o `processInstanceId` do pai;
 * - no PAI: os formFields `COM_SOLICITACAO_FLUIG___n` / `DEM_SOLICITACAO_FLUIG___n` listam os
 *   `processInstanceId` dos filhos;
 * - a etapa de serviço "Atualiza solicitação principal" do filho fica `COMPLETED` quando o
 *   filho é finalizado — é ela que propaga o resultado do filho de volta ao pai.
 *
 * Risco concreto: a criação de subprocessos falha parcialmente (pai aponta para filho que não
 * existe, ou o filho responde e o pai não é atualizado) e o processo fiscal trava sem sinal.
 * Hoje isso só se descobre por reclamação — este teste é o oráculo que faltava.
 *
 * COMPORTAMENTO ESPERADO: para todo par pai/filho encontrado, o elo é bidirecional e
 * consistente. Se a base não tiver nenhum par, o teste FALHA com `PRÉ-CONDIÇÃO AUSENTE` — nunca
 * passa vazio (o falso-verde que o estudo de determinismo já pegou uma vez).
 *
 * ⚠️ DEPENDÊNCIA de `CT-SEG-07-S1`: hoje esta leitura só é possível porque o isolamento
 * horizontal na API v2 está QUEBRADO (a conta de Compras lê instâncias RDFC de que não
 * participa — ver `tests/e2e/seguranca/isolamento-horizontal-api-processos.spec.js`). Se o BOLA
 * for corrigido no produto, este teste perde o acesso e passará a exigir uma conta com perfil
 * fiscal. Registrado ao implementar.
 *
 * Leitura pura, via `page.evaluate` + `fetch` (o WAF barra `page.request`). Sem `@destrutivo`.
 */

/** As cinco classes de processo RDFC — de onde saem pais e filhos. */
const PROCESSOS_RDFC = [
  'bpm_recepcao_documentos_fiscais_compras',
  'bpm_recepcao_documentos_fiscais_contratos',
  'bpm_recepcao_documentos_fiscais_comprador_compras',
  'bpm_recepcao_documentos_fiscais_demandante_compras',
  'bpm_recepcao_documentos_fiscais_fiscais_contratos',
];

/** Quantos filhos, no máximo, inspecionar — mantém o teste em segundos sem varrer a base toda. */
const MAX_FILHOS = 5;

test.describe('RDFC — rastreabilidade pai↔filho (contrato de dados)', () => {
  test('CT-RDF-02-H — o elo pai↔filho é bidirecional e consistente para todo par encontrado', async ({
    page,
  }) => {
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

    /**
     * Descobre pares pai/filho em runtime (nunca fixa ids) e mede a consistência de cada elo.
     *
     * @type {{
     *   filhosEncontrados: number,
     *   pares: Array<{
     *     filho: number,
     *     filhoProcessId: string,
     *     filhoStatus: string,
     *     pai: number,
     *     paiStatus: number,
     *     filhoListadoNoPai: boolean,
     *     linksDoPai: number,
     *     etapaAtualizaPrincipal: null | { presente: boolean, status: string },
     *   }>,
     * }}
     */
    const medicao = await page.evaluate(
      async ({ processosRdfc, maxFilhos }) => {
        const headers = { Referer: `${location.origin}/portal/p/1/home` };

        /** @param {string} url */
        const getJson = async (url) => {
          const r = await fetch(url, { credentials: 'include', headers });
          const corpo = await r.json().catch(() => ({}));
          return { status: r.status, corpo };
        };

        /**
         * @param {any} corpo
         * @returns {Array<{ field: string, value: string }>}
         */
        const camposDe = (corpo) =>
          Array.isArray(corpo?.formFields) ? corpo.formFields : [];

        /** @param {Array<{ field: string, value: string }>} campos @param {string} nome */
        const valorCampo = (campos, nome) =>
          campos.find((c) => c?.field === nome && String(c?.value ?? '').trim())?.value ?? '';

        /** @type {any[]} */
        const pares = [];

        for (const processId of processosRdfc) {
          if (pares.length >= maxFilhos) break;

          const lista = await getJson(
            `/process-management/api/v2/requests?pageSize=100&processId=${processId}`,
          );
          const itens = Array.isArray(lista.corpo?.items) ? lista.corpo.items : [];

          for (const item of itens) {
            if (pares.length >= maxFilhos) break;

            const filhoId = item.processInstanceId;
            const filhoDet = await getJson(
              `/process-management/api/v2/requests/${filhoId}?expand=formFields`,
            );
            const camposFilho = camposDe(filhoDet.corpo);
            const paiRef = valorCampo(camposFilho, 'WKNumProcesPai');
            if (!paiRef) continue; // não é filho: sem elo para o pai

            // Lê o pai e coleta os filhos que ele declara.
            const paiDet = await getJson(
              `/process-management/api/v2/requests/${paiRef}?expand=formFields`,
            );
            const camposPai = camposDe(paiDet.corpo);
            const linksDoPai = camposPai
              .filter(
                (c) =>
                  /_SOLICITACAO_FLUIG___/i.test(c?.field ?? '') && String(c?.value ?? '').trim(),
              )
              .map((c) => String(c.value));
            const filhoListadoNoPai = linksDoPai.some((v) => v === String(filhoId));

            const filhoStatus = String(filhoDet.corpo?.status ?? '?');

            // Etapa de serviço "Atualiza solicitação principal" do filho — só relevante quando
            // o filho já está finalizado (é o que fecha o elo de volta ao pai).
            /** @type {null | { presente: boolean, status: string }} */
            let etapaAtualizaPrincipal = null;
            if (filhoStatus === 'FINALIZED') {
              const tarefas = await getJson(
                `/process-management/api/v2/requests/${filhoId}/tasks?pageSize=60`,
              );
              const listaTarefas = Array.isArray(tarefas.corpo?.items) ? tarefas.corpo.items : [];
              const etapa = listaTarefas.find(
                (/** @type {any} */ t) =>
                  t?.state?.stateName === 'Atualiza solicitação principal',
              );
              etapaAtualizaPrincipal = {
                presente: Boolean(etapa),
                status: String(etapa?.status ?? '(ausente)'),
              };
            }

            pares.push({
              filho: Number(filhoId),
              filhoProcessId: String(filhoDet.corpo?.processId ?? processId),
              filhoStatus,
              pai: Number(paiRef),
              paiStatus: paiDet.status,
              filhoListadoNoPai,
              linksDoPai: linksDoPai.length,
              etapaAtualizaPrincipal,
            });
          }
        }

        return { filhosEncontrados: pares.length, pares };
      },
      { processosRdfc: PROCESSOS_RDFC, maxFilhos: MAX_FILHOS },
    );

    // Pré-condição de massa: sem nenhum par, não há o que afirmar — falha explícita, nunca
    // verde vazio.
    expect(
      medicao.filhosEncontrados,
      'PRÉ-CONDIÇÃO AUSENTE: nenhum par pai/filho RDFC encontrado na base (nenhuma instância ' +
        `das classes ${PROCESSOS_RDFC.join(', ')} traz o formField 'WKNumProcesPai' preenchido). ` +
        'O caso exige ao menos um subprocesso RDFC criado. Confirme que a base tem documentos ' +
        'fiscais com subprocessos e que a integração com o Protheus estava de pé.',
    ).toBeGreaterThan(0);

    for (const par of medicao.pares) {
      const contexto = `filho ${par.filho} (${par.filhoProcessId}, ${par.filhoStatus}) → pai ${par.pai}`;

      // 1) O pai referenciado pelo filho tem de ser legível.
      expect(
        par.paiStatus,
        `${contexto}: o pai apontado por WKNumProcesPai respondeu HTTP ${par.paiStatus} — ` +
          'o filho referencia um pai que não pôde ser lido. Elo pai→filho quebrado.',
      ).toBe(200);

      // 2) O elo é BIDIRECIONAL: o pai tem de listar o filho em `*_SOLICITACAO_FLUIG___n`.
      expect(
        par.filhoListadoNoPai,
        `${contexto}: o filho aponta para o pai (WKNumProcesPai=${par.pai}), mas o pai NÃO ` +
          `lista este filho em nenhum campo *_SOLICITACAO_FLUIG___n (${par.linksDoPai} link(s) ` +
          'no pai). Elo unidirecional — o pai não foi atualizado com o filho, exatamente a ' +
          'falha parcial de criação de subprocesso que trava o processo fiscal sem sinal.',
      ).toBe(true);

      // 3) Filho finalizado: a etapa de serviço que propaga o resultado ao pai tem de estar
      //    COMPLETED. Se o filho terminou mas a etapa não fechou, o pai fica dessincronizado.
      if (par.filhoStatus === 'FINALIZED') {
        const etapa = par.etapaAtualizaPrincipal;
        expect(
          etapa?.presente,
          `${contexto}: filho FINALIZED sem a etapa "Atualiza solicitação principal" no ` +
            'histórico de tarefas — a propagação do resultado ao pai não existe nesta instância.',
        ).toBe(true);
        expect(
          etapa?.status,
          `${contexto}: filho FINALIZED, mas a etapa "Atualiza solicitação principal" está ` +
            `'${etapa?.status}' em vez de COMPLETED — o filho respondeu e o pai pode não ter ` +
            'sido atualizado.',
        ).toBe('COMPLETED');
      }
    }
  });
});
