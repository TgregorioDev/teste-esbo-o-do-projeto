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

  test('deve abrir o modal já vinculado ao contrato de origem', async ({
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

  test('deve impedir a digitação do número do contrato no modal', async ({
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

  test('deve abrir o modal com os campos do solicitante em branco', async ({
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

  test('deve oferecer os tipos contratuais de solicitação', async ({
    contratosPage,
    solicitacaoModal,
  }) => {
    // ⚠️ Assertion sobre a lista EXATA, não `toContain` de alguns itens.
    //
    // Histórico: o roteiro de 20/08 registrava "Nova Solicitação", que sumiu; em 28/08/2026
    // sumiu também "Renovação Contratual" e apareceu "Nova Contratação". A versão anterior
    // usava `toContain` do "que é regra estável", o que deixa remoção e adição passarem em
    // silêncio — e foi caro: "Renovação Contratual" era o valor DEFAULT de
    // `factories/solicitacao-compra.js`, então ~20 testes de `acompanhamento-contratos`
    // passaram a reprovar com `TimeoutError: locator.selectOption` (o Playwright esperando
    // por uma opção inexistente), sem que nada apontasse a causa.
    //
    // Fixar a lista inteira é o que transforma este teste em guarda de regressão de verdade:
    // qualquer mudança no combo — para mais ou para menos — reprova aqui, com a lista lida
    // na mensagem, em vez de virar timeout opaco vinte arquivos adiante.
    //
    // O ambiente serve o placeholder DUAS vezes (medido) — `[...new Set()]` normaliza isso,
    // que é ruído de template e não regra de negócio.
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato((await descobrirContratoVigente(contratosPage)).contrato);
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();

    // `\s+` (que em JS cobre o `U+00A0` destes rótulos), não só `trim()` — ver a nota de
    // NBSP em `components/SolicitacaoCompraModal.js`.
    const opcoes = (await solicitacaoModal.getOpcoesDeTipo().allInnerTexts()).map((t) =>
      t.replace(/\s+/g, ' ').trim(),
    );

    expect(
      [...new Set(opcoes)],
      'a lista de tipos do combo mudou no ambiente. Se a mudança for intencional, atualize ' +
        '`TIPO_SOLICITACAO` em `factories/solicitacao-compra.js` (é de lá que sai o valor ' +
        'default usado por toda a suíte) e registre nas divergências do README',
    ).toEqual([
      TIPO_SOLICITACAO.PLACEHOLDER,
      TIPO_SOLICITACAO.ADITIVO,
      TIPO_SOLICITACAO.NOVA_CONTRATACAO,
    ]);
  });

  test('deve fechar o modal sem criar solicitação', async ({
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
