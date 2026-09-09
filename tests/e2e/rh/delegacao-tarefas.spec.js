// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { DelegacaoTarefasPage } from '../../../pages/DelegacaoTarefasPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * CT-SUB-02-H — Delegação de Tarefas (`wf_SubstituiçãoCargosFluig`): abertura do formulário.
 *
 * A família `CT-SUB` do catálogo cobria *Substituição de Cargos* (`wf_substituicaocargos`, RH) —
 * processo **diferente**, apesar do nome técnico quase idêntico. A *Delegação de Tarefas* é de
 * categoria **Compras**, está no catálogo `onlyCanStart`, abre, e **nunca foi iniciada por
 * ninguém**: passou despercebida pela semelhança de nome. Fica neste diretório para manter a
 * família CT-SUB junta com `substituicao-cargos.spec.js`, que é onde alguém vai procurar.
 *
 * Importa porque o mecanismo de delegação é o que destrava o comprador no ciclo de Compras — e
 * até aqui não tinha nenhuma verificação.
 *
 * Caso PARCIAL por definição, no padrão de `cadastro-fornecedor.spec.js`: abre, espelha os
 * campos e **nunca** aciona *Enviar* — enviar criaria uma delegação real, que muda a quem as
 * tarefas de outra pessoa são atribuídas.
 *
 * ⚠️ "Último iniciado: Nunca" é CONTEXTO, não critério: o teste afirma sobre a estrutura do
 * formulário, não sobre o histórico do processo.
 */
test.describe('Delegação de Tarefas (CT-SUB-02-H)', () => {
  test('CT-SUB-02-H: deve abrir o formulário de início com os campos de delegante, delegado e período', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const delegacao = new DelegacaoTarefasPage(page);

    // ⚠️ O `processId` tem cedilha e til; `DelegacaoTarefasPage.goto` faz `encodeURIComponent`.
    // Sem isso a abertura falha e PARECE bloqueio de permissão — é só codificação de URL.
    await delegacao.goto();
    await delegacao.expectAberto();

    await expect(page).toHaveTitle('Cassi - Fluig Plataforma - Movimentar Solicitação');
    await expect(
      delegacao.dialogErro,
      'o processo está no catálogo de início da conta — nenhum diálogo de erro deveria aparecer ' +
        'ao abri-lo. Se apareceu, a permissão mudou (ver CT-PLT-10-H) ou a URL perdeu o ' +
        'encode do processId (cedilha e til)',
    ).toHaveCount(0);

    // Casca do processo.
    await expect(delegacao.headingInicio).toBeVisible();
    await expect(delegacao.abaFormulario).toBeVisible();
    await expect(delegacao.abaInformacoes).toBeVisible();
    await expect(delegacao.abaHistorico).toBeVisible();
    await expect(delegacao.abaAnexos).toBeVisible();
    await expect(delegacao.botaoEnviar).toBeVisible();

    // O card trouxe ESTE processo, e não o homônimo de RH (`wf_substituicaocargos`, cujo
    // formulário responde "Funcionário não localizado" para esta conta). É a assertion que
    // separa os dois processos de nome parecido.
    await expect(
      delegacao.tituloFormulario,
      'o card deveria trazer o formulário de "Delegação de Tarefas". Título diferente significa ' +
        'que o processo está servindo o template de outro processo — provavelmente o de ' +
        'Substituição de Cargos, com quem ele é confundido pelo nome técnico',
    ).toBeVisible();
    await expect(delegacao.secaoIdentificacao).toBeVisible();

    // Identificação: preenchida pela plataforma, não pelo usuário.
    await expect(delegacao.campoNumeroProcesso).toBeVisible();
    await expect(delegacao.campoNumeroProcesso).not.toBeEditable();
    await expect(delegacao.campoSolicitante).toBeVisible();
    await expect(delegacao.campoSolicitante).not.toBeEditable();
    await expect(delegacao.campoEmailSolicitante).toBeVisible();
    await expect(delegacao.campoDataSolicitacao).toBeVisible();
    await expect(delegacao.campoHoraSolicitacao).toBeVisible();

    // ── O domínio da delegação ────────────────────────────────────────────────────────────
    // Delegar é dizer QUEM passa, PARA QUEM passa e POR QUANTO TEMPO. Faltando qualquer um dos
    // três, o formulário não descreve uma delegação — e é isso que estas assertions guardam.
    await expect(
      delegacao.campoDelegante,
      'o formulário deveria oferecer o zoom "Usuário Responsável Pela Atividade" (o delegante) — ' +
        'sem ele não há de quem delegar',
    ).toBeVisible();
    await expect(
      delegacao.campoDelegado,
      'o formulário deveria oferecer o zoom "Usuário Delegado" — sem ele não há para quem delegar',
    ).toBeVisible();
    await expect(
      delegacao.campoDataInicial,
      'o formulário deveria oferecer "Data Inicial": delegação sem início não tem vigência',
    ).toBeEditable();
    await expect(
      delegacao.campoDataFinal,
      'o formulário deveria oferecer "Data Final": delegação sem fim é transferência permanente, ' +
        'não delegação',
    ).toBeEditable();
    await expect(delegacao.campoObservacao).toBeEditable();

    // Delegante e delegado precisam ser campos DISTINTOS — se o formulário reaproveitasse o
    // mesmo controle, os dois papéis colapsariam num só e a delegação não teria destino.
    await expect(delegacao.campoDelegante).toHaveCount(1);
    await expect(delegacao.campoDelegado).toHaveCount(1);

    // ⚠️ Abrir e ler é leitura; NUNCA clicar em Enviar aqui — criaria uma delegação real.
    expect(
      guarda.tentativas(),
      `abrir e ler o formulário não deveria escrever nada — tentou: ${JSON.stringify(guarda.urls())}`,
    ).toBe(0);
  });

  /**
   * FSWTBC-3918 — delegação não deveria poder ser enviada com período em aberto.
   *
   * O chamado é literal: a tela do ato de delegação estava incompleta e faltava, nominalmente, a
   * **data final** — sem ela o período fica em aberto, e o que era para ser delegação temporária
   * vira transferência permanente de responsabilidade. Corrigido em 26/02 e homologado pela área
   * em 18/03/2026.
   *
   * O teste acima já afirma que o campo existe e é editável. O que este cobra é o efeito
   * prático: que ele seja **exigido**.
   *
   * ## O que foi medido em 09/09/2026
   *
   * Com apenas a Data Inicial preenchida e a Data Final vazia, o formulário **não exibe crítica
   * nenhuma** — nem no host, nem dentro do iframe — e dispara
   * `POST /ecm/api/rest/ecm/workflowView/send`. Quem impediu a delegação de nascer foi a guarda
   * de escrita desta suíte, não a tela.
   *
   * ## O limite desta medição, declarado em vez de escondido
   *
   * Não se sabe se o **servidor** recusaria esse envio: descobrir exigiria deixar a requisição
   * passar, e uma delegação criada por engano redireciona tarefas de um colaborador real — não é
   * massa `QA` descartável como uma SC. O que o teste afirma é o que o caso pede e o que a
   * medição sustenta: a tela deixa sair um envio sem período de fim.
   *
   * `@bug`: escrito contra o comportamento esperado, reprova hoje. Se um dia passar, ou a
   * validação de campo obrigatório voltou, ou o botão parou de submeter — nos dois casos alguém
   * precisa olhar.
   */
  test('@bug FSWTBC-3918 — o envio deveria ser recusado na tela com "Data Final" em branco', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const delegacao = new DelegacaoTarefasPage(page);

    await delegacao.goto();
    await delegacao.expectAberto();

    // Só o início do período. É `<input type="date">`: aceita exclusivamente ISO.
    const hoje = new Date().toISOString().slice(0, 10);
    await delegacao.campoDataInicial.fill(hoje);
    await expect(delegacao.campoDataFinal).toHaveValue('');

    await delegacao.botaoEnviar.click();

    // Espera pelo desfecho em vez de afirmar de imediato: ou uma crítica aparece (o que o caso
    // espera), ou uma escrita é tentada (o que foi medido). Sem esta espera, a assertion abaixo
    // leria a guarda antes de o clique produzir qualquer efeito e passaria por acidente.
    await expect
      .poll(async () => guarda.tentativas() > 0 || (await delegacao.dialogErro.count()) > 0, {
        timeout: 30_000,
      })
      .toBe(true);

    const critica = await delegacao.dialogErro
      .first()
      .innerText()
      .catch(() => '(nenhuma crítica em tela)');

    test.info().annotations.push({
      type: 'delegacao-sem-data-final',
      description:
        `crítica em tela: ${critica.replace(/\s+/g, ' ').slice(0, 160)} · ` +
        `escritas tentadas: ${JSON.stringify(guarda.urls())}`,
    });

    expect(
      guarda.tentativas(),
      'o formulário deixou sair um envio de delegação SEM data final — período em aberto é ' +
        'transferência permanente de responsabilidade, e é isso que o FSWTBC-3918 corrigiu. ' +
        'A escrita foi impedida pela guarda desta suíte, não pela tela',
    ).toBe(0);
  });
});
