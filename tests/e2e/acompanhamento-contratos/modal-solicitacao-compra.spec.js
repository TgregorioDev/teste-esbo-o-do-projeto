// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { descobrirContratoVigente } from '../../../utils/massa-contratos.js';
import { TIPO_SOLICITACAO } from '../../../factories/solicitacao-compra.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * Abertura do modal de Solicitação de Compra a partir do contrato — caso CT-ACC-03-H,
 * o caso-âncora do pedido do desenvolvedor.
 *
 * Toda spec deste arquivo instala a guarda de escrita: o ambiente é o do cliente, e
 * solicitação criada por engano não tem exclusão disponível.
 */
test.describe('Abertura da Solicitação de Compra a partir do contrato', () => {
  test.beforeEach(async ({ page }) => {
    await bloquearCriacaoDeSolicitacao(page);
  });

  test('deve abrir o modal já vinculado ao contrato de origem @bug', async ({
    contratosPage,
    solicitacaoModal,
  }) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    const contrato = await descobrirContratoVigente(contratosPage);
    await contratosPage.filtrarPorContrato(contrato.contrato);
    await contratosPage.abrirSolicitacaoCompra();

    await solicitacaoModal.expectAberto();

    await expect(solicitacaoModal.getDialog()).toBeVisible();
    await expect(solicitacaoModal.campoContrato).toHaveValue(contrato.contrato);
  });

  test('deve impedir a digitação do número do contrato no modal @bug', async ({
    contratosPage,
    solicitacaoModal,
  }) => {
    // O contrato é a origem da solicitação: quem escolhe é a linha da grade, não o usuário.
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato((await descobrirContratoVigente(contratosPage)).contrato);
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();

    await expect(solicitacaoModal.campoContrato).toBeDisabled();
  });

  test('deve abrir o modal com os campos do solicitante em branco @bug', async ({
    contratosPage,
    solicitacaoModal,
  }) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato((await descobrirContratoVigente(contratosPage)).contrato);
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();

    await expect(solicitacaoModal.campoMotivo).toHaveValue('');
    await expect(solicitacaoModal.campoDataNecessidade).toHaveValue('');
    await expect(solicitacaoModal.campoTipo).toHaveValue('');
  });

  test('deve oferecer os tipos contratuais de solicitação @bug', async ({
    contratosPage,
    solicitacaoModal,
  }) => {
    // GUARDIÃO DO CATÁLOGO. O dono do ambiente confirmou em 31/08/2026 que a composição
    // atual ("Aditivo Contratual" + "Nova Contratação") é mudança INTENCIONAL da Cassi —
    // por isso a assertion volta a fixar a lista EXATA, e não um "contém".
    //
    // Fixar a lista é deliberado: o catálogo mudou três vezes em 11 dias sem aviso, e foi
    // essa mudança silenciosa que derrubou 8 casos destrutivos em 31/08. Este teste é o
    // único da suíte cujo propósito é reprovar quando o catálogo muda. Se ele ficar
    // vermelho, a resposta NÃO é atualizar a lista e seguir — é confirmar com a Cassi se a
    // mudança foi intencional, e só então atualizar aqui e em `TIPO_SOLICITACAO`.
    //
    // A assertion cobre apenas as opções HABILITADAS, de propósito: o widget renderiza o
    // placeholder "Selecione..." DUPLICADO (defeito D-13, no HTML estático do bundle).
    // Afirmar a lista crua congelaria esse defeito e faria este teste reprovar no dia em
    // que ele for corrigido — o placeholder é verificado à parte, pela presença.
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato((await descobrirContratoVigente(contratosPage)).contrato);
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();

    const todas = (await solicitacaoModal.getOpcoesDeTipo().allInnerTexts()).map((t) =>
      t.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim(),
    );
    expect(
      todas,
      'o combo deveria oferecer o placeholder "Selecione..." como opção não-selecionável',
    ).toContain(TIPO_SOLICITACAO.PLACEHOLDER);

    const selecionaveis = (await solicitacaoModal.listarTiposDisponiveis()).map((o) => o.rotulo);

    expect(
      selecionaveis,
      'CATÁLOGO DIVERGENTE: os tipos selecionáveis do combo mudaram em relação ao que a Cassi ' +
        'confirmou em 31/08/2026. NÃO atualize esta lista para o teste passar — confirme antes ' +
        'com o dono do ambiente se a mudança foi intencional e, se for, atualize também ' +
        '`TIPO_SOLICITACAO` em factories/solicitacao-compra.js.',
    ).toEqual([TIPO_SOLICITACAO.ADITIVO, TIPO_SOLICITACAO.NOVA_CONTRATACAO]);
  });

  test('deve fechar o modal sem criar solicitação @bug', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);

    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato((await descobrirContratoVigente(contratosPage)).contrato);
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();

    await solicitacaoModal.botaoFechar.click();

    await expect(solicitacaoModal.getDialog()).toBeHidden();
    expect(guarda.tentativas(), `houve tentativa de escrita: ${guarda.urls().join(', ')}`).toBe(0);
  });
});
