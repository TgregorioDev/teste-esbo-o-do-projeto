// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { QuestionarioClinicassiPage } from '../../../pages/QuestionarioClinicassiPage.js';
import { bloquearEscritaNoAmbiente } from '../../../utils/guarda-criacao.js';

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
 */
test.describe('Questionário CliniCASSI — envio, D-CLI-01', () => {
  test('CT-CLI-01-H questionário completo deveria ser aceito e criar o processo @destrutivo', async ({
    page,
  }) => {
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
      'um questionário respondido por completo deveria ser aceito (200) — o servidor ' +
        'responde 500 porque a questão 001 não tem nenhuma ação de workflow cadastrada ' +
        '(D-CLI-01, "A pergunta >>001<< não tem nenhuma ação cadastrada!!"), independente ' +
        'de o questionário estar completo',
    ).toBe(200);
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
  test('Clínica/Unidade deveriam identificar a clínica do diagnóstico e não nascer vazias', async ({
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
