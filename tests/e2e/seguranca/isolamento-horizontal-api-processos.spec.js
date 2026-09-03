// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../../utils/pre-condicao.js';
import { envObrigatoria } from '../../../config/ambiente.js';

/**
 * CT-SEG-07-S1 — Isolamento horizontal na API v2 de processos (BOLA / IDOR interno).
 *
 * Classe do achado: *Broken Object Level Authorization*. A suíte já cobre o eixo VERTICAL
 * (`CT-SEG-05-S1`: painel admin negado a não-admin) e o vazamento do dataset `colleague`
 * (`CT-SEG-01-S1`). Faltava o eixo HORIZONTAL: um usuário autenticado lendo o objeto de
 * outro. Este é o caso.
 *
 * DEFEITO MEDIDO (27/08/2026, sessão de `TOTVS-FS`, perfil Compras/Contratos, não-admin):
 *
 *     GET /process-management/api/v2/requests/<id>?expand=formFields  → 200
 *
 * para uma instância de `bpm_recepcao_documentos_fiscais_*` — processo que o próprio ambiente
 * BARRA esta conta de iniciar — conduzida pela conta de integração
 * `integration-cass-0000-0000-0001-1`, em que `TOTVS-FS` nunca participou de etapa alguma.
 * O corpo devolve os `formFields` completos (123 campos), incluindo `nomeSolicitante` (razão
 * social) e `cpfCnpj` do fornecedor, chave da Pré-Nota, nº da SC, itens e valores.
 *
 * Como o `processInstanceId` é sequencial, qualquer sessão autenticada enumera a base inteira
 * de documentos fiscais com um laço. É o irmão do vazamento `colleague`, mas sobre dado de
 * transação, não de cadastro.
 *
 * COMPORTAMENTO ESPERADO (critério objetivo): para uma instância em que o usuário não é
 * requisitante, responsável atual nem participante histórico, o passo 4 deve NEGAR o objeto —
 * 403, ou 404, ou 200 com `formFields: null`. Hoje responde 200 com o formulário inteiro, e
 * por isso este teste REPROVA de propósito (vermelho intencional, como os demais da suíte).
 *
 * A assertion é sobre o STATUS e a AUSÊNCIA do objeto — nunca sobre "não contém CNPJ", que
 * viraria teste de string.
 *
 * Regras seguidas:
 * - A instância é DESCOBERTA em runtime (varredura por `processId` da classe RDFC), nunca
 *   fixada num número — a regra de massa da suíte vale aqui igual.
 * - Requisição autenticada via `page.evaluate` + `fetch`: o WAF barra `page.request` com 403
 *   por falta de `User-Agent`/`Referer` de navegador (ver `cassi-fluig-master`).
 * - Leitura pura, sem `@destrutivo`: ~3 GETs.
 */

/**
 * Os cinco `processId` da classe RDFC — o processo de negócio que a conta de Compras NÃO tem
 * permissão de iniciar (bloqueio comprovado em `tests/e2e/fiscal/recepcao-documentos-fiscais.spec.js`
 * e `tests/e2e/plataforma/inicio-processo-bloqueado.spec.js`) e do qual nunca participa. É a
 * CLASSE do processo, não uma instância: citá-la é o análogo de declarar a característica da
 * massa, não fixar um registro.
 */
const PROCESSOS_RDFC = [
  'bpm_recepcao_documentos_fiscais_compras',
  'bpm_recepcao_documentos_fiscais_contratos',
  'bpm_recepcao_documentos_fiscais_comprador_compras',
  'bpm_recepcao_documentos_fiscais_demandante_compras',
  'bpm_recepcao_documentos_fiscais_fiscais_contratos',
];

test.describe('Segurança — isolamento horizontal na API v2 de processos (BOLA)', () => {
  test('CT-SEG-07-S1 @bug — não deve entregar o objeto de um processo em que o usuário não participa', async ({
    page,
  }) => {
    const login = envObrigatoria('QA_USERNAME');

    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

    /**
     * Descobre, em runtime, uma instância RDFC em que a conta da automação comprovadamente não
     * participa (nem `assignee` nem `requester` das tarefas), e mede o acesso ao objeto.
     *
     * @type {{
     *   encontrada: boolean,
     *   motivo: string,
     *   instancia: null | {
     *     processInstanceId: number,
     *     processId: string,
     *     tarefasInspecionadas: number,
     *     acesso: { status: number, formFieldsAusente: boolean, qtdFormFields: number },
     *   },
     * }}
     */
    const resultado = await page.evaluate(
      async ({ login, processosRdfc }) => {
        const headers = { Referer: `${location.origin}/portal/p/1/home` };

        /** @param {string} url */
        const getJson = async (url) => {
          const r = await fetch(url, { credentials: 'include', headers });
          const corpo = await r.json().catch(() => ({}));
          return { status: r.status, corpo };
        };

        for (const processId of processosRdfc) {
          const lista = await getJson(
            `/process-management/api/v2/requests?pageSize=100&processId=${processId}`,
          );
          const itens = Array.isArray(lista.corpo?.items) ? lista.corpo.items : [];

          for (const item of itens) {
            const id = item.processInstanceId;

            // Passo 3 — confirmar NÃO-participação: nenhuma tarefa da instância pode ter a
            // conta como responsável ou requisitante.
            const tarefas = await getJson(
              `/process-management/api/v2/requests/${id}/tasks?pageSize=60`,
            );
            const listaTarefas = Array.isArray(tarefas.corpo?.items) ? tarefas.corpo.items : [];
            if (listaTarefas.length === 0) continue;

            const participa = listaTarefas.some(
              (/** @type {any} */ t) =>
                t?.assignee?.code === login || t?.requester?.code === login,
            );
            if (participa) continue;

            // Passo 4 — medir o acesso ao objeto completo.
            const alvo = await getJson(
              `/process-management/api/v2/requests/${id}?expand=formFields`,
            );
            const formFields = alvo.corpo?.formFields;
            const formFieldsAusente = formFields === null || formFields === undefined;
            const qtdFormFields = Array.isArray(formFields) ? formFields.length : 0;

            return {
              encontrada: true,
              motivo: '',
              instancia: {
                processInstanceId: Number(id),
                processId: String(item.processId ?? processId),
                tarefasInspecionadas: listaTarefas.length,
                acesso: { status: alvo.status, formFieldsAusente, qtdFormFields },
              },
            };
          }
        }

        return {
          encontrada: false,
          motivo:
            'nenhuma instância RDFC com tarefas legíveis e sem participação da conta foi ' +
            'encontrada na varredura por processId',
          instancia: null,
        };
      },
      { login, processosRdfc: PROCESSOS_RDFC },
    );

    // Pré-condição de massa: sem uma instância alheia legível, o teste não pode concluir nada —
    // falha explícita (separa ambiente de defeito no relatório), nunca timeout opaco nem verde
    // vazio.
    if (!resultado.encontrada) {
      faltaPreCondicao(
        `${resultado.motivo}. O caso exige ao menos uma instância de ` +
          `processo RDFC (classes: ${PROCESSOS_RDFC.join(', ')}) conduzida por outra conta, para ` +
          'medir o isolamento horizontal. Confirme que a base tem documentos fiscais e que a ' +
          'integração com o Protheus estava de pé.',
      );
    }

    const instancia = /** @type {NonNullable<typeof resultado.instancia>} */ (resultado.instancia);
    const { status, formFieldsAusente, qtdFormFields } = instancia.acesso;

    // Critério objetivo: o acesso deve ser NEGADO — 403, 404, ou 200 com o objeto ausente
    // (`formFields: null`). É sobre o status e a presença do objeto, não sobre o conteúdo.
    const acessoNegado =
      status === 403 || status === 404 || (status === 200 && formFieldsAusente);

    expect(
      acessoNegado,
      `BOLA / isolamento horizontal violado: a conta '${login}' (que NÃO é requisitante, ` +
        `responsável nem participante — ${instancia.tarefasInspecionadas} tarefa(s) da ` +
        `instância inspecionadas, nenhuma sua) leu o objeto da instância ` +
        `${instancia.processInstanceId} do processo '${instancia.processId}' — um processo que ` +
        `esta conta nem sequer pode INICIAR. Esperado: 403/404, ou 200 com formFields:null. ` +
        `Obtido: HTTP ${status} com ${qtdFormFields} formField(s) do formulário completo ` +
        '(que inclui razão social e CNPJ do fornecedor). A ausência de 403 aqui significa que ' +
        'qualquer sessão autenticada enumera a base inteira de documentos fiscais pelo ' +
        'processInstanceId sequencial. Vermelho intencional — ver CT-SEG-07-S1.',
    ).toBe(true);
  });
});
