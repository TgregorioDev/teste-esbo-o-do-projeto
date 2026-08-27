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
});
