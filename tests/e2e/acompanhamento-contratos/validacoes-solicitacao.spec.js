// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { descobrirContratoVigente } from '../../../utils/massa-contratos.js';
import { criarSolicitacaoCompra, QUALQUER_TIPO_VALIDO } from '../../../factories/solicitacao-compra.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * Travas de campo obrigatório do modal — caso CT-ACC-04-S1.
 *
 * Nenhum destes cenários chega a criar solicitação: em todos, a validação bloqueia antes.
 * A guarda de escrita comprova isso a cada teste, em vez de presumir.
 *
 * A massa preenchida vem da factory (faker + sufixo único + prefixo QA); o que cada teste
 * VALIDA entra por override explícito.
 */
test.describe('Campos obrigatórios da Solicitação de Compra', () => {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {import('../../../pages/AcompanhamentoContratosPage.js').AcompanhamentoContratosPage} contratosPage
   * @param {import('../../../components/SolicitacaoCompraModal.js').SolicitacaoCompraModal} solicitacaoModal
   */
  async function abrirModal(page, contratosPage, solicitacaoModal) {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato((await descobrirContratoVigente(contratosPage)).contrato);
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();
    return guarda;
  }

  test('deve listar os três campos pendentes quando nada é preenchido', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    const guarda = await abrirModal(page, contratosPage, solicitacaoModal);

    await solicitacaoModal.confirmar();

    await expect(solicitacaoModal.getAlertaCamposObrigatorios()).toContainText(
      'Por favor, preencha: Tipo de Solicitação, Motivo da Solicitação, Data de Necessidade',
    );
    await expect(solicitacaoModal.getDialog()).toBeVisible();
    expect(guarda.tentativas(), 'nada deveria ter sido enviado ao servidor').toBe(0);
  });

  test('deve cobrar apenas os campos restantes quando o tipo já foi informado', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    const guarda = await abrirModal(page, contratosPage, solicitacaoModal);
    const solicitacao = criarSolicitacaoCompra({ tipo: QUALQUER_TIPO_VALIDO });

    await solicitacaoModal.preencher({ tipo: solicitacao.tipo });
    await solicitacaoModal.confirmar();

    await expect(solicitacaoModal.getAlertaCamposObrigatorios()).toContainText(
      'Por favor, preencha: Motivo da Solicitação, Data de Necessidade',
    );
    expect(guarda.tentativas()).toBe(0);
  });

  test('deve cobrar somente o motivo quando tipo e data já foram informados', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    const guarda = await abrirModal(page, contratosPage, solicitacaoModal);
    const solicitacao = criarSolicitacaoCompra({ tipo: QUALQUER_TIPO_VALIDO });

    await solicitacaoModal.preencher({
      tipo: solicitacao.tipo,
      dataNecessidade: solicitacao.dataNecessidade,
    });
    await solicitacaoModal.confirmar();

    await expect(solicitacaoModal.getAlertaCamposObrigatorios()).toContainText(
      'Por favor, preencha: Motivo da Solicitação',
    );
    expect(guarda.tentativas()).toBe(0);
  });

  test('deve cobrar o tipo de solicitação quando somente ele fica sem preencher', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    // O tipo define a natureza do pedido (renovação ou aditivo) e governa o roteamento
    // seguinte — não pode ser opcional. Este caso testa exatamente a AUSÊNCIA do tipo, então
    // `tipo` nunca entra no override: declarar `QUALQUER_TIPO_VALIDO` aqui seria uma intenção
    // que o teste nunca usa.
    const guarda = await abrirModal(page, contratosPage, solicitacaoModal);
    const solicitacao = criarSolicitacaoCompra();

    await solicitacaoModal.preencher({
      motivo: solicitacao.motivo,
      dataNecessidade: solicitacao.dataNecessidade,
    });
    await solicitacaoModal.confirmar();

    await expect(solicitacaoModal.getAlertaCamposObrigatorios()).toContainText(
      'Por favor, preencha: Tipo de Solicitação',
    );
    expect(guarda.tentativas()).toBe(0);
  });
});
