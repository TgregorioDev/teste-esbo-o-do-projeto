// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { SubstituicaoCargosPage } from '../../../pages/SubstituicaoCargosPage.js';
import { criarSubstituto } from '../../../factories/pessoa.js';

/**
 * Substituição de Cargos (`wf_substituicaocargos`) — casos CT-SUB.
 *
 * O documento de casos supunha o processo bloqueado por perfil. Medido em campo (ver
 * `tests/e2e/rh/bloqueio-processos-rh.spec.js`): o processo ABRE normalmente — heading
 * *Início*, botão *Enviar* presentes, e o formulário interno chega a montar a seção de
 * identificação do solicitante e as opções Cadastrar/Alterar/Excluir Substituição.
 *
 * Pouco depois de montar, porém, uma validação assíncrona resolve o e-mail da sessão
 * contra o cadastro de funcionários do Protheus e falha de forma estável e determinística
 * (confirmado por `waitFor` sobre o texto real do erro — nunca por tempo arbitrário — em
 * execuções isoladas repetidas): *"Erro 401 --> Funcionario não localizado através do
 * email..."*. Um overlay de bloqueio cobre o formulário e todo campo deixa de estar
 * visível (confirmado por contagem de DOM com `offsetParent`, não apenas por texto).
 *
 * Consequência: os três casos atribuídos (01-H substituto válido, 01-S1 substituto sem
 * vínculo ativo, 01-S2 período retroativo/inválido) exigem passar da identificação do
 * SOLICITANTE — que já falha aqui, antes de qualquer campo de SUBSTITUTO aparecer. Mesma
 * causa raiz de CT-DEP: a conta de automação não corresponde a um funcionário ativo no
 * Protheus. Não são fabricados como testes fantasmas: documentados na anotação abaixo e no
 * relatório final da tarefa.
 *
 * `criarSubstituto()` (`factories/pessoa.js`) fica pronta para uso assim que essa
 * pré-condição for resolvida.
 */
test.describe('Substituição de Cargos', () => {
  test('CT-SUB @achado — bloqueia a identificação do solicitante antes de expor campos de substituto', async ({
    page,
  }, testInfo) => {
    const substituto = criarSubstituto();
    testInfo.annotations.push(
      {
        type: 'massa-pronta-para-uso-futuro',
        description: `criarSubstituto() geraria ${JSON.stringify(substituto)} — não preenchido em tela porque o formulário bloqueia antes de expor campo de substituto.`,
      },
      {
        type: 'pre-condicao-ausente',
        description:
          'CT-SUB-01-H (substituto válido), 01-S1 (substituto sem vínculo ativo) e 01-S2 (período ' +
          'retroativo/inválido) exigem passar da identificação do SOLICITANTE, que falha para esta ' +
          'conta antes de qualquer campo de substituto ser exibido. Mesma causa raiz de CT-DEP-02-S1: ' +
          'a conta de automação não corresponde a um funcionário ativo no Protheus.',
      },
    );

    const substituicaoPage = new SubstituicaoCargosPage(page);
    await substituicaoPage.goto();

    // Pré-condição do caso: o processo abre (não é bloqueio de perfil).
    await substituicaoPage.expectFormularioAberto();

    // O ponto central do caso: a identificação do solicitante bloqueia o formulário antes
    // de qualquer campo de substituto (que os três subcasos atribuídos dependem).
    await substituicaoPage.expectBloqueadoPorFuncionarioNaoLocalizado();

    // Reforça por contagem de DOM, não só por texto: nenhum campo segue visível/acionável
    // depois do bloqueio.
    expect(await substituicaoPage.contarCamposVisiveis()).toBe(0);
  });
});
