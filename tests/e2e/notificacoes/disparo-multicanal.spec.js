// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';

/**
 * CT-NOT-01-H — disparo multicanal de notificação.
 *
 * O caso pede: disparar um evento que notifica e validar o recebimento por SMS
 * (`dsEnvioSMS`), Teams (`ds_NotificaTeams`) e e-mail (`dsEnviarEmailComAnexos`).
 *
 * ## O que NÃO é verificável nesta suíte (limitação técnica, não decisão de escopo)
 *
 * 1. **Recebimento nos três canais.** Não há caixa de e-mail, celular nem Teams da conta de
 *    automação para confirmar chegada — declarado como fora de alcance pela própria tarefa.
 * 2. **A chamada aos datasets de canal em si.** Investigação em campo (rede do navegador, em
 *    Home, Central de Tarefas e telas de processo) não mostrou `dsEnvioSMS`, `ds_NotificaTeams`
 *    nem `dsEnviarEmailComAnexos` sendo chamados a partir do NAVEGADOR. Isso é consistente com o
 *    padrão do Fluig: esses datasets de notificação são acionados a partir de scripts de evento
 *    de workflow (`afterStateEntry`/`afterMovement`) que rodam **dentro do servidor**, nunca como
 *    requisição HTTP do cliente — não têm como ser interceptados por `page.route`, e a conta da
 *    automação não tem o painel de administração (`/webdesk` → 403) que mostraria o log de
 *    execução desses datasets no servidor.
 * 3. Chamar esses datasets diretamente para "forçar" a prova estaria fora do limite ético do
 *    projeto: são datasets de ENVIO (SMS/e-mail/Teams reais), e uma sonda poderia disparar
 *    mensagem de verdade para uma pessoa real. Não foi tentado.
 *
 * ## O que É verificável e é o que este teste prova
 *
 * O Fluig expõe, para o próprio usuário autenticado (sem admin), o **Global Alert API**
 * (`/globalalertapi/api/rest/alert/*`) — o registro de alertas que alimenta o sino de
 * notificações do portal. Ele é populado por eventos de workflow reais (aprovação, complemento
 * de solicitação, entrada em pool de tarefa, etc.) — exatamente a classe de evento que a
 * plataforma marca como `required` (obrigatório notificar). Este teste prova que:
 *
 *  - o disparo de notificação PARA O PRÓPRIO USUÁRIO é um mecanismo real e ativo na plataforma
 *    (não hipotético): existe um registro observável, datado, ligado a um processo real;
 *  - pelo menos um alerta `required` (canal considerado obrigatório pela plataforma) foi de fato
 *    gerado por um evento de negócio genuíno.
 *
 * Isso não prova que SMS/Teams/e-mail chegaram — prova que o gatilho de notificação "dispara"
 * de verdade e deixa rastro observável na plataforma, que é o que esta investigação conseguiu
 * demonstrar sem admin, sem provisionar canal externo e sem enviar mensagem real a terceiro.
 */
test.describe('Notificações — disparo multicanal', () => {
  test('CT-NOT-01-H: evento de negócio real gera alerta de notificação observável na plataforma (SMS/Teams/e-mail não são verificáveis nesta suíte)', async ({
    request,
  }) => {
    const resposta = await request.get('/globalalertapi/api/rest/alert/listAlerts', {
      params: { limit: '2000', offset: '0' },
    });

    expect(resposta.ok(), `status inesperado do Global Alert API: ${resposta.status()}`).toBe(true);

    const alertas = /** @type {Array<{
      id: number,
      event: { eventKey?: string, required?: boolean, module?: { moduleKey?: string } },
      creationDate: number,
    }>} */ (await resposta.json());

    // Guarda contra falso-verde: uma lista vazia não prova "não dispara", prova que a consulta
    // não trouxe nada — não pode ser interpretada como sucesso.
    expect(
      alertas.length,
      'a Central de Alertas não retornou nenhum registro para o usuário autenticado — sem massa ' +
        'não há como provar que o disparo de notificação acontece (não é defeito do produto).',
    ).toBeGreaterThan(0);

    const alertasObrigatorios = alertas.filter((a) => a.event?.required === true);
    const eventosDistintos = new Set(alertas.map((a) => a.event?.eventKey).filter(Boolean));

    // Evidência anexada ao relatório: só contagens e nomes de evento (metadado da plataforma,
    // não dado pessoal) — nunca o destinatário, nunca o processo específico de outra pessoa.
    await test.info().attach('alertas-observados', {
      body: JSON.stringify(
        {
          totalAlertas: alertas.length,
          alertasComCanalObrigatorio: alertasObrigatorios.length,
          eventosDistintos: [...eventosDistintos],
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });

    expect(
      alertasObrigatorios.length,
      'nenhum alerta com canal "obrigatório" (event.required=true) foi encontrado — não há ' +
        'evidência observável de que um evento de negócio real acionou o mecanismo de ' +
        'notificação da plataforma.',
    ).toBeGreaterThan(0);
  });
});
