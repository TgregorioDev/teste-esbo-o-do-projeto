// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { CONTRATO_LIMPO } from '../../../config/massa-contratos.js';
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

  test('deve abrir o modal já vinculado ao contrato de origem', async ({
    contratosPage,
    solicitacaoModal,
  }) => {
    const contrato = CONTRATO_LIMPO();

    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato(contrato);
    await contratosPage.abrirSolicitacaoCompra();

    await solicitacaoModal.expectAberto();

    await expect(solicitacaoModal.getDialog()).toBeVisible();
    await expect(solicitacaoModal.campoContrato).toHaveValue(contrato);
  });

  test('deve impedir a digitação do número do contrato no modal', async ({
    contratosPage,
    solicitacaoModal,
  }) => {
    // O contrato é a origem da solicitação: quem escolhe é a linha da grade, não o usuário.
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato(CONTRATO_LIMPO());
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();

    await expect(solicitacaoModal.campoContrato).toBeDisabled();
  });

  test('deve abrir o modal com os campos do solicitante em branco', async ({
    contratosPage,
    solicitacaoModal,
  }) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato(CONTRATO_LIMPO());
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();

    await expect(solicitacaoModal.campoMotivo).toHaveValue('');
    await expect(solicitacaoModal.campoDataNecessidade).toHaveValue('');
    await expect(solicitacaoModal.campoTipo).toHaveValue('');
  });

  test('deve oferecer os tipos contratuais de solicitação', async ({
    contratosPage,
    solicitacaoModal,
  }) => {
    // Ver README > Divergências abertas: o roteiro de 20/08 registrava também
    // "Nova Solicitação", que não é mais oferecida pelo ambiente. Enquanto o time não
    // confirmar se a remoção foi intencional, a assertion cobre o que é regra estável —
    // o placeholder e os dois tipos contratuais — em vez de fixar a lista inteira.
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato(CONTRATO_LIMPO());
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();

    const opcoes = (await solicitacaoModal.getOpcoesDeTipo().allInnerTexts()).map((t) => t.trim());

    expect(opcoes).toContain(TIPO_SOLICITACAO.PLACEHOLDER);
    expect(opcoes).toContain(TIPO_SOLICITACAO.RENOVACAO);
    expect(opcoes).toContain(TIPO_SOLICITACAO.ADITIVO);
  });

  test('deve fechar o modal sem criar solicitação', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);

    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato(CONTRATO_LIMPO());
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();

    await solicitacaoModal.botaoFechar.click();

    await expect(solicitacaoModal.getDialog()).toBeHidden();
    expect(guarda.tentativas(), `houve tentativa de escrita: ${guarda.urls().join(', ')}`).toBe(0);
  });
});
