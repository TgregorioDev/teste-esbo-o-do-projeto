// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { CONTRATO_LIMPO } from '../../../config/massa-contratos.js';
import { criarSolicitacaoCompra } from '../../../factories/solicitacao-compra.js';
import { derrubarTransferenciaDeTarefa, responderEnvioSolicitacaoCom } from '../../../utils/captura-payload.js';

/**
 * Reação da aplicação a respostas SIMULADAS do start da Solicitação de Compra.
 *
 * Diferente de `payload-solicitacao.spec.js` (que sempre ABORTA a requisição),
 * aqui a resposta é FULFILLED localmente — o widget recebe um corpo/status fabricado como
 * se tivesse vindo do servidor. A requisição real nunca sai da máquina de teste: nenhum
 * cenário aqui cria SC de verdade nem toca o Protheus.
 *
 * REGRA DE OURO: a interceptação é instalada ANTES de qualquer clique, e cada teste
 * reconfirma que houve exatamente uma tentativa de start.
 */

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('../../../pages/AcompanhamentoContratosPage.js').AcompanhamentoContratosPage} contratosPage
 * @param {import('../../../components/SolicitacaoCompraModal.js').SolicitacaoCompraModal} solicitacaoModal
 */
async function abrirEPreencher(page, contratosPage, solicitacaoModal) {
  await contratosPage.goto();
  await contratosPage.expectCarregada();
  await contratosPage.filtrarPorContrato(CONTRATO_LIMPO());
  await contratosPage.abrirSolicitacaoCompra();
  await solicitacaoModal.expectAberto();
  await solicitacaoModal.preencher(criarSolicitacaoCompra());
}

test.describe('Erro no start — HTTP 500 (CT-ACC-05-S2)', () => {
  test('deve avisar o usuário e permitir nova tentativa quando o start falha', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    const MENSAGEM_ERRO_SIMULADO = 'Falha simulada no start — CT-ACC-05-S2';

    const captura = await responderEnvioSolicitacaoCom(page, {
      status: 500,
      body: { message: MENSAGEM_ERRO_SIMULADO },
    });

    await abrirEPreencher(page, contratosPage, solicitacaoModal);
    await solicitacaoModal.confirmar();
    await captura.aguardarPayload(0);

    expect(captura.tentativas(), `mais de uma tentativa de start: ${captura.urls().join(', ')}`).toBe(1);

    // Confirmado em campo: a aplicação mostra um toast de erro (role=alert, único) com a
    // mensagem devolvida pelo servidor.
    await expect(page.getByRole('alert').filter({ hasText: MENSAGEM_ERRO_SIMULADO })).toBeVisible();

    // O modal permanece aberto e o botão Confirmar volta a ficar disponível: o usuário
    // pode tentar de novo sem perder o que já preencheu.
    await expect(solicitacaoModal.getDialog()).toBeVisible();
    await expect(solicitacaoModal.botaoConfirmar).toBeEnabled();

    // Nenhuma SC parcial: nenhum outro alerta de sucesso apareceu.
    await expect(page.getByText(/iniciado com sucesso/i)).toHaveCount(0);
  });
});

test.describe('Sucesso simulado com falha na transferência da tarefa (D-01 / CT-ACC-05-S1)', () => {
  test('deve avisar quando a SC é criada mas não pôde ser atribuída ao solicitante, em vez de anunciar sucesso pleno', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    // O start é respondido com sucesso simulado (200 + processInstanceId fictício — nada
    // toca o servidor real), e o dataset que transfere a tarefa da conta de integração para
    // o solicitante (`dsFluig_postProcessesTransfer`) é forçado a falhar.
    const captura = await responderEnvioSolicitacaoCom(page, {
      status: 200,
      body: { processInstanceId: 999999, content: { processInstanceId: 999999 } },
    });
    await derrubarTransferenciaDeTarefa(page);

    await abrirEPreencher(page, contratosPage, solicitacaoModal);
    await solicitacaoModal.confirmar();
    await captura.aguardarPayload(0);

    expect(captura.tentativas(), `mais de uma tentativa de start: ${captura.urls().join(', ')}`).toBe(1);

    // Esperado (comportamento correto): a SC foi de fato iniciada, mas a atribuição ao
    // solicitante falhou — o usuário precisa ser avisado disso especificamente, e não ver
    // apenas uma confirmação de sucesso.
    //
    // Observado em campo: a aplicação exibe SOMENTE o toast de sucesso ("Processo 999999
    // iniciado com sucesso!") e nenhum aviso sobre a falha da transferência — o erro é
    // engolido. Este é o sintoma de superfície do D-01: a tarefa fica presa com a conta de
    // integração e o usuário não tem como saber.
    await expect(page.getByText(/n(ã|a)o p(ô|o)de ser atribu(í|i)da/i)).toBeVisible();
  });
});
