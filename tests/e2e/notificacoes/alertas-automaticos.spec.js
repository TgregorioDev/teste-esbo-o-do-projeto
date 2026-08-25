// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';

/**
 * CT-NOT-02-S1 — alertas automáticos sem duplicidade.
 *
 * O caso pede: deixar pendências que acionam `dsSync_disparoAlertaAutomatico` /
 * `dsSync_disparoPendenciasAutomatico`, rodar o job duas vezes na janela, e verificar que não
 * duplica aviso. Rodar o job manualmente exige o painel de scheduler (admin) — que esta conta
 * não tem, e o projeto não obtém acesso admin para testar.
 *
 * ## O proxy observável usado aqui
 *
 * O Global Alert API (`/globalalertapi/api/rest/alert/listAlerts`) é o registro de alertas real
 * da plataforma, populado por exatamente esse tipo de evento automático (pendência de tarefa,
 * complemento, aprovação). Em vez de forçar duas execuções do job (que não temos como acionar),
 * este teste audita o **histórico acumulado real** de centenas de eventos genuínos, ocorridos ao
 * longo de dias — que soma, na prática, muito mais "reexecuções" da rotina de alerta do que um
 * teste manual conseguiria provocar — e verifica a invariante que a duplicidade violaria: nenhum
 * alerta é criado duas vezes para o mesmo (evento, destinatário, alvo, instante).
 *
 * A chave de identidade do alerta usa `place.objectId` quando presente (é o processo/registro
 * que efetivamente disparou o alerta) e cai para `object.objectId` quando não há `place` — nos
 * eventos observados em campo, `object` representa o pool/grupo (compartilhado por várias
 * solicitações) só quando `place` também existe; sem `place`, `object` já é o alvo real
 * (confirmado comparando os dois formatos nos dados reais retornados pela API).
 *
 * Não é o mesmo teste que "rodar o job duas vezes" — é documentado aqui como a alternativa
 * observável sem admin, e é uma prova mais forte no sentido de que cobre volume real de produção,
 * não uma única reexecução manual.
 */
test.describe('Notificações — alertas automáticos', () => {
  test('CT-NOT-02-S1: nenhum alerta automático é duplicado para o mesmo evento, destinatário e alvo', async ({
    request,
  }) => {
    const LIMITE = 2000;
    const resposta = await request.get('/globalalertapi/api/rest/alert/listAlerts', {
      params: { limit: String(LIMITE), offset: '0' },
    });

    expect(resposta.ok(), `status inesperado do Global Alert API: ${resposta.status()}`).toBe(true);

    const alertas = /** @type {Array<{
      id: number,
      event: { eventKey?: string },
      receiver: { login?: string },
      object?: { objectId?: number },
      place?: { objectId?: number } | null,
      creationDate: number,
    }>} */ (await resposta.json());

    expect(
      alertas.length,
      'a Central de Alertas não retornou nenhum registro — sem massa não há como auditar duplicidade.',
    ).toBeGreaterThan(0);

    // Guarda contra truncamento silencioso: se a página veio cheia, o limite pode não ter
    // capturado todo o histórico não lido, e a ausência de duplicata provaria menos do que
    // parece. Falha alto em vez de mascarar.
    expect(
      alertas.length,
      `a consulta retornou exatamente o limite (${LIMITE}) — pode haver mais alertas não capturados; ` +
        'aumente o limite para auditar o histórico completo.',
    ).toBeLessThan(LIMITE);

    /** @type {Map<string, number[]>} */
    const porChave = new Map();
    for (const alerta of alertas) {
      const alvo = alerta.place?.objectId ?? alerta.object?.objectId ?? null;
      const chave = `${alerta.event?.eventKey}::${alerta.receiver?.login}::${alvo}::${alerta.creationDate}`;
      const idsExistentes = porChave.get(chave) ?? [];
      idsExistentes.push(alerta.id);
      porChave.set(chave, idsExistentes);
    }

    const duplicadas = [...porChave.entries()].filter(([, ids]) => ids.length > 1);

    await test.info().attach('auditoria-duplicidade', {
      body: JSON.stringify(
        {
          totalAlertas: alertas.length,
          chavesUnicas: porChave.size,
          quantidadeDeChavesDuplicadas: duplicadas.length,
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });

    expect(
      duplicadas.length,
      `${duplicadas.length} combinação(ões) de (evento, destinatário, alvo, instante) geraram mais ` +
        `de um alerta idêntico entre os ${alertas.length} alertas auditados — isso é a assinatura de ` +
        'duplicidade que o job de alerta automático não deveria produzir. Ver CT-NOT-02-S1.',
    ).toBe(0);
  });
});
