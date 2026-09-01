// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { descobrirContratoVigente } from '../../../utils/massa-contratos.js';
import { criarSolicitacaoCompra, QUALQUER_TIPO_VALIDO } from '../../../factories/solicitacao-compra.js';
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
  await contratosPage.filtrarPorContrato((await descobrirContratoVigente(contratosPage)).contrato);
  await contratosPage.abrirSolicitacaoCompra();
  await solicitacaoModal.expectAberto();
  await solicitacaoModal.preencher(criarSolicitacaoCompra({ tipo: QUALQUER_TIPO_VALIDO }));
}

test.describe('Erro no start — HTTP 500 (CT-ACC-05-S2)', () => {
  test('deve avisar o usuário e permitir nova tentativa quando o start falha @bug', async ({
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
  test('@bug deve avisar quando a SC é criada mas não pôde ser atribuída ao solicitante, em vez de anunciar sucesso pleno', async ({
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
    // Observado em campo (medido em 25/08/2026): a aplicação exibe SOMENTE o toast de sucesso
    // ("Sucesso! Processo 999999 iniciado com sucesso!", `role=alert`, ~2,1s após o Confirmar)
    // e fecha o modal. Nenhum aviso sobre a falha da transferência — o erro é engolido. Este é
    // o sintoma de superfície do D-01: a tarefa fica presa com a conta de integração e o
    // usuário não tem como saber.
    //
    // POR QUE A LEITURA É POR COLETA CONTÍNUA, e não por um `toBeVisible` no aviso esperado:
    // o toast do Fluig some sozinho depois de alguns segundos. Uma assertion que espera 30s
    // por um elemento que nunca existe termina em `Locator: getByText(...)  Timeout` — e nessa
    // altura o toast que o produto REALMENTE mostrou já saiu da tela, então o relatório não
    // distingue "o produto anunciou sucesso pleno" (o defeito) de "o produto não respondeu
    // nada" (ambiente). É a mesma lição de CT-CMP-02-S4: o vermelho tem que nomear o que foi
    // medido. Coletando todos os `role=alert` durante a janela, o `Received` da falha traz
    // exatamente os avisos exibidos.
    const alertas = page.getByRole('alert');
    /** @type {Set<string>} */
    const avisosObservados = new Set();
    const coletarAvisos = async () => {
      for (const texto of await alertas.allInnerTexts()) {
        const normalizado = texto.replace(/\s+/g, ' ').trim();
        if (normalizado) avisosObservados.add(normalizado);
      }
      return [...avisosObservados];
    };

    // Sincronização por condição observável: o widget precisa dar ALGUM retorno ao usuário.
    // Sem retorno nenhum não há veredito sobre o aviso — e isso precisa aparecer dito assim.
    await expect
      .poll(async () => (await coletarAvisos()).length, {
        timeout: 30_000,
        intervals: Array(60).fill(500),
        message:
          'após Confirmar (start respondido com 200 e transferência da tarefa forçada a HTTP 500), ' +
          'a aplicação não exibiu retorno nenhum em 30s — nenhum `role=alert` na tela. Sem retorno ' +
          'não é possível afirmar se o usuário foi ou não avisado da falha na atribuição',
      })
      .toBeGreaterThan(0);

    // A assertion de negócio. Reprova de propósito enquanto o D-01 estiver aberto: o `Received`
    // lista os avisos que o produto realmente exibiu na janela observada.
    await expect
      .poll(coletarAvisos, {
        timeout: 15_000,
        intervals: Array(30).fill(500),
        message:
          'defeito D-01 (sintoma): a transferência da tarefa falhou (dsFluig_postProcessesTransfer ' +
          '→ HTTP 500) e a aplicação deveria avisar que a SC não pôde ser atribuída ao solicitante. ' +
          'Abaixo, TODOS os avisos que ela exibiu — se aparecer apenas o toast de sucesso, o erro ' +
          'foi engolido e a tarefa fica presa na conta de integração sem o usuário saber',
      })
      .toEqual(expect.arrayContaining([expect.stringMatching(/n(ã|a)o p(ô|o)de ser atribu(í|i)da/i)]));
  });
});
