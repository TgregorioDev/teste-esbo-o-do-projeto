// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { QuestionarioClinicassiPage } from '../../../pages/QuestionarioClinicassiPage.js';
import { bloquearEscritaNoAmbiente } from '../../../utils/guarda-criacao.js';
import { envObrigatoria } from '../../../config/ambiente.js';

/**
 * Etapa em que o Questionário DEVE parar depois de criado — medida em campo em 27/08/2026
 * (instância 112741, criada por este mesmo teste) e reconfirmada nas quatro instâncias mais
 * recentes da base (112733, 112703, 112672, 112625): todas em `5:Acompanhamento Status`, com
 * o próprio solicitante e `status: OPEN`.
 */
const ETAPA_INICIAL_ESPERADA = 'Acompanhamento Status';
const SEQUENCIA_INICIAL_ESPERADA = 5;

/**
 * Lê, do servidor, a etapa corrente e a tarefa em aberto de uma solicitação.
 *
 * ⚠️ `page.evaluate` + `fetch`, nunca `page.request`: o WAF do TOTVS Cloud devolve 403 para
 * `/process-management/api/v2/**` sem `User-Agent` de navegador e `Referer` do portal (a
 * mesma armadilha já paga em `utils/cancelamento-fluig.js`).
 *
 * ⚠️ `expand` aceita **um único valor** por chamada — dois devolvem tudo `null` em silêncio.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} processInstanceId
 * @returns {Promise<{ status: string, etapas: string[], tarefaCorrente: { assignee: string, etapa: string, sequencia: number } | null }>}
 */
async function lerEstadoDaSolicitacao(page, processInstanceId) {
  return page.evaluate(async (id) => {
    const opcoes = {
      credentials: /** @type {RequestCredentials} */ ('include'),
      headers: { Referer: `${location.origin}/portal/p/1/home` },
    };
    const movimentos = await (
      await fetch(`/process-management/api/v2/requests/${id}?expand=currentMovements`, opcoes)
    ).json();
    const tarefas = await (
      await fetch(`/process-management/api/v2/requests/${id}/tasks?pageSize=60`, opcoes)
    ).json();

    const corrente = (tarefas?.items ?? []).find((/** @type {any} */ t) => t.status === 'NOT_COMPLETED') ?? null;

    return {
      status: String(movimentos?.status ?? '?'),
      etapas: (movimentos?.currentMovements ?? []).map(
        (/** @type {any} */ m) => `${m?.state?.sequence}:${m?.state?.stateName}`,
      ),
      tarefaCorrente: corrente
        ? {
            assignee: String(corrente.assignee?.code ?? ''),
            etapa: String(corrente.state?.stateName ?? ''),
            sequencia: Number(corrente.state?.sequence),
          }
        : null,
    };
  }, processInstanceId);
}

/**
 * CT-CLI-01-H / CT-CLI-01-S2 / CT-CLI-02-S1 — Questionário de Diagnóstico CliniCASSI V2
 * (`prc_questionario_v2`).
 *
 * ## O que foi confirmado em campo
 *
 * O documento de casos não previa bloqueio de perfil aqui, e de fato não há: o formulário
 * abre completo, monta as 10 questões reais (`Questão 001`..`Questão 010`, cada uma com
 * `Fonte`/`Pergunta` somente-leitura e três `radio` Não/Parcial/Total) — os ÚNICOS campos
 * editáveis do formulário inteiro.
 *
 * Toda tentativa de Enviar — testada com 4/10 e com 10/10 questões respondidas — recebe
 * **500** de `POST /ecm/api/rest/ecm/workflowView/send`, e a UI abre um `role=dialog` com
 * heading "Erro" mostrando a mensagem de negócio:
 * `"A pergunta >>001<< não tem nenhuma ação cadastrada!!"`. É um erro de CONFIGURAÇÃO de
 * workflow (falta a ação associada à questão 001 no BPM), não uma validação de completude —
 * o mesmo erro aparece tanto com o questionário parcial quanto completo. Por isso CT-CLI-01-H
 * (completo, deveria criar) fica vermelho documentando o defeito (D-CLI-01), e CT-CLI-01-S2
 * (incompleto, não deveria finalizar) passa hoje — mas por essa causa, não por uma validação
 * de completude que o produto de fato tenha.
 *
 * CT-CLI-01-S1 (fora da janela/periodicidade deve bloquear) **não foi implementado**: os
 * campos `Periodo de`/`Periodo Até` nascem `readonly` e vazios, sem zoom nem forma de a
 * automação (ou o usuário) escolher uma janela — não há como a suíte simular "fora da
 * janela" nesta tela.
 *
 * ## CT-CLI-03-H — onde a instância para (acrescentado em 27/08/2026)
 *
 * O caso pede a verificação do ESTADO pós-criação, que nunca existiu aqui: a suíte criava a
 * instância e nunca conferia onde ela parou. É acréscimo de assertion ao destrutivo que já
 * roda — custo de massa zero.
 *
 * ⚠️ **Medição de 27/08/2026 diverge do que este cabeçalho registrava.** Com as 10 questões
 * respondidas, `POST .../workflowView/send` respondeu **200** e criou a instância 112741,
 * parada em `5:Acompanhamento Status` com o próprio `TOTVS-FS` e `status: OPEN` — o mesmo
 * estado das quatro instâncias anteriores da base (112733, 112703, 112672, 112625). Ou seja,
 * na janela medida o D-CLI-01 **não reproduziu**. A mensagem da assertion de status foi
 * reescrita para incluir o corpo da resposta, para que uma volta do 500 apareça com a
 * mensagem do servidor em vez de só "esperado 200".
 *
 * ⚠️ Consequência para a limpeza: o 500 do D-CLI-01 **cria a instância mesmo assim** em parte
 * dos casos (as instâncias OPEN acumuladas na base são a evidência), e o livro-razão de
 * `fixtures/fixtures.js` só registra respostas `ok()` — por isso o questionário acumulou
 * resíduo. Com a resposta 200 o teardown cancela normalmente (confirmado nesta medição).
 */
test.describe('Questionário CliniCASSI — envio, D-CLI-01', () => {
  test('CT-CLI-01-H / CT-CLI-03-H questionário completo deveria ser aceito, criar o processo e pará-lo em Acompanhamento Status com o solicitante @destrutivo', async ({
    page,
  }, testInfo) => {
    const questionario = new QuestionarioClinicassiPage(page);

    await questionario.goto();
    await questionario.expectFormularioAberto();
    await expect(questionario.headingQuestionario).toBeVisible();

    const totalQuestoes = await questionario.contarQuestoes();
    expect(totalQuestoes, 'o questionário deveria montar ao menos uma questão').toBeGreaterThan(0);

    await questionario.responderTodas('Total');

    const resposta = await questionario.enviarECapturarResposta();

    expect(
      resposta.status(),
      'um questionário respondido por completo deveria ser aceito (200) — houve janela em que ' +
        'o servidor respondia 500 porque a questão 001 não tinha ação de workflow cadastrada ' +
        '(D-CLI-01, "A pergunta >>001<< não tem nenhuma ação cadastrada!!"), independente de o ' +
        `questionário estar completo. Corpo recebido: ${(await resposta.text()).slice(0, 400)}`,
    ).toBe(200);

    // ── CT-CLI-03-H — onde a instância PARA, que nunca foi verificado ─────────────────────
    //
    // Até aqui o teste afirmava só sobre o status da resposta. É o mesmo falso positivo que
    // o D-01 produz em Compras: o servidor responde 200 e a solicitação pode ter nascido em
    // qualquer etapa, com qualquer responsável. Custo de massa ZERO — a instância já foi
    // criada pela assertion acima, isto só a lê.
    const corpo = await resposta.json();
    const processInstanceId = corpo?.content?.processInstanceId;
    expect(
      typeof processInstanceId === 'number' && processInstanceId > 0,
      `a resposta de um envio aceito deveria trazer o processInstanceId da instância criada ` +
        `(recebido: ${JSON.stringify(processInstanceId)})`,
    ).toBe(true);
    testInfo.annotations.push({ type: 'questionario-criado', description: String(processInstanceId) });

    const estado = await lerEstadoDaSolicitacao(page, processInstanceId);

    expect(
      estado.status,
      `Questionário ${processInstanceId}: deveria ficar ABERTO depois de criado ` +
        `(status observado: "${estado.status}")`,
    ).toBe('OPEN');

    expect(
      estado.etapas,
      `Questionário ${processInstanceId}: deveria parar em ` +
        `${SEQUENCIA_INICIAL_ESPERADA}:${ETAPA_INICIAL_ESPERADA}. Outra etapa significa que o ` +
        'desenho do processo mudou e o acompanhamento do diagnóstico deixou de existir',
    ).toEqual([`${SEQUENCIA_INICIAL_ESPERADA}:${ETAPA_INICIAL_ESPERADA}`]);

    expect(
      estado.tarefaCorrente?.assignee,
      `Questionário ${processInstanceId}: a tarefa em aberto deveria ficar com o PRÓPRIO ` +
        'solicitante — é ele quem acompanha o status do diagnóstico. Responsável observado: ' +
        `"${estado.tarefaCorrente?.assignee ?? '(nenhuma tarefa NOT_COMPLETED)'}"`,
    ).toBe(envObrigatoria('QA_USERNAME'));
  });

  test('CT-CLI-01-S2 questionário incompleto não deveria finalizar/criar o processo @destrutivo', async ({
    page,
  }) => {
    const questionario = new QuestionarioClinicassiPage(page);

    await questionario.goto();
    await questionario.expectFormularioAberto();
    await expect(questionario.headingQuestionario).toBeVisible();

    const totalQuestoes = await questionario.contarQuestoes();
    expect(totalQuestoes, 'pré-condição: precisa haver mais de uma questão para deixar parte sem responder').toBeGreaterThan(1);

    // Responde só a primeira questão — todas as demais ficam sem seleção.
    await questionario.responder(1, 'Total');

    const resposta = await questionario.enviarECapturarResposta();

    expect(
      resposta.status(),
      'questionário incompleto não deveria ser aceito com sucesso',
    ).not.toBe(200);

    const corpo = await resposta.json();
    expect(
      corpo?.content?.processInstanceId,
      'a resposta a um envio incompleto não deveria trazer um processInstanceId de um ' +
        'processo criado',
    ).toBeFalsy();

    // Diálogo de erro visível ao usuário — não é uma falha silenciosa.
    await expect(questionario.dialogErro.getByRole('heading', { name: 'Erro', exact: true })).toBeVisible();
  });
});

/**
 * CT-CLI-02-S1 — job `dsQDC000` parado desde 06/10/2023 (achado U-14).
 *
 * Sem acesso de administrador, a suíte não alcança o painel de scheduler para confirmar o
 * job diretamente. O que dá para observar SEM esse acesso: o bloco de contexto do
 * questionário (`Clínica`, `Gestor Clínica`, `Unidade`, `Gestor Unidade`) — que deveria
 * identificar a QUAL clínica/unidade o diagnóstico se refere — nasce e permanece vazio,
 * mesmo depois do formulário terminar de carregar, para o usuário desta suíte.
 *
 * Isto é um SINTOMA compatível com uma fonte de dados desatualizada/parada (consistente com
 * U-14), não uma prova direta do job — a suíte não tem visibilidade do scheduler para afirmar
 * causalidade. Registrado como teste porque é o observável mais próximo do achado que a conta
 * de automação alcança.
 */
test.describe('Questionário CliniCASSI — contexto da clínica (CT-CLI-02-S1, achado U-14)', () => {
  test('Clínica/Unidade deveriam identificar a clínica do diagnóstico e não nascer vazias @bug', async ({
    page,
  }) => {
    const guarda = await bloquearEscritaNoAmbiente(page);
    const questionario = new QuestionarioClinicassiPage(page);

    await questionario.goto();
    await questionario.expectFormularioAberto();
    await expect(questionario.headingQuestionario).toBeVisible();

    expect(
      await questionario.campoClinica.inputValue(),
      'o campo "Clínica" deveria vir preenchido com a clínica do diagnóstico — sintoma ' +
        'compatível com o achado U-14 (job dsQDC000 parado); sem acesso admin, a suíte não ' +
        'confirma a causa, só o sintoma',
    ).not.toBe('');
    expect(
      await questionario.campoUnidade.inputValue(),
      'o campo "Unidade" deveria vir preenchido — mesmo sintoma do campo Clínica',
    ).not.toBe('');

    expect(guarda.tentativas(), `tentativa(s) de escrita bloqueada(s): ${JSON.stringify(guarda.urls())}`).toBe(0);
  });
});
