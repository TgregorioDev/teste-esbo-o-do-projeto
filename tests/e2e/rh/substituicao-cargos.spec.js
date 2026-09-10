// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { ANOTACAO_PRE_CONDICAO, faltaPreCondicao } from '../../../utils/pre-condicao.js';
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
        type: ANOTACAO_PRE_CONDICAO,
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

    // O ponto central do caso: os campos de SUBSTITUTO nunca ficam acionáveis — é do que os
    // três subcasos atribuídos (CT-SUB-01-H/01-S1/01-S2) dependem.
    //
    // O que se afirma é isso, e não a mensagem de bloqueio. O motivo é circunstância de
    // ambiente: no `caixade182374` a tela dizia "Funcionário não localizado"; no
    // `caixade213859` diz "Não foi possível estabelecer comunicação com o ERP" — e o mesmo
    // formulário alterna entre esse aviso e uma carga sem aviso nenhum. Exigir a primeira
    // mensagem fazia este `@achado` reprovar por motivo diferente do que declara, que é o pior
    // desfecho possível para um achado: manda investigar a coisa errada.
    const acesso = await substituicaoPage.lerAcessoAosCamposDeSubstituto();

    testInfo.annotations.push({
      type: 'campos-de-substituto',
      description:
        `motivo do bloqueio: ${acesso.motivo} · ${acesso.noDom.length} campo(s) de substituto no ` +
        `DOM, ${acesso.acionaveis.length} acionável(is)${acesso.acionaveis.length ? ': ' + acesso.acionaveis.join(', ') : ''}`,
    });

    // Sem os campos no DOM não há o que julgar: medido em 09/09/2026, o formulário alterna
    // entre renderizar seus 74 campos (16 deles de substituto) e não renderizar nenhum. Chamar
    // isso de "o achado mudou" seria conclusão errada — é a tela que não carregou.
    if (acesso.noDom.length === 0) {
      faltaPreCondicao(
        '(ambiente): o formulário de Substituição de Cargos não renderizou campo algum de ' +
          'substituto no DOM. Sem eles não dá para afirmar se estão ou não acionáveis, que é o ' +
          'que este achado observa.',
      );
    }

    expect(
      acesso.acionaveis,
      'os campos de substituto ficaram ACIONÁVEIS — o achado mudou. Se a identificação do ' +
        'solicitante passou a resolver, CT-SUB-01-H, 01-S1 e 01-S2 podem ter deixado de ser ' +
        'bloqueados e valem ser reavaliados. Reabra o assunto; não "conserte" este teste',
    ).toEqual([]);
  });
});
