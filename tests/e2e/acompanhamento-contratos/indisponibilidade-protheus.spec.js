// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { DATASET } from '../../../config/ambiente.js';
import { CONTRATO_LIMPO } from '../../../config/massa-contratos.js';
import { criarSolicitacaoCompra } from '../../../factories/solicitacao-compra.js';
import { derrubarDataset } from '../../../utils/dataset-fluig.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * Comportamento do modal quando o Protheus não responde — casos CT-ACC-03-S2 e CT-ACC-04-S2.
 *
 * O que está sob teste é o pior desfecho possível deste fluxo: a solicitação nascer sem
 * filial e sem itens e seguir para aprovação como se fosse legítima. O sistema tem que
 * avisar e barrar.
 *
 * A indisponibilidade é simulada no navegador porque a alternativa seria derrubar o serviço
 * de integração do cliente. O trecho de código exercitado é o mesmo.
 */
test.describe('Indisponibilidade do Protheus ao abrir a Solicitação de Compra', () => {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {import('../../../pages/AcompanhamentoContratosPage.js').AcompanhamentoContratosPage} contratosPage
   */
  async function abrirSolicitacaoComProtheusFora(page, contratosPage) {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    await derrubarDataset(page, DATASET.FILIAL);
    await derrubarDataset(page, DATASET.ITENS_PLANILHA);

    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato(CONTRATO_LIMPO());
    await contratosPage.abrirSolicitacaoCompra();
    return guarda;
  }

  test('deve avisar o usuário quando os dados do contrato não podem ser obtidos', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    await abrirSolicitacaoComProtheusFora(page, contratosPage);
    await solicitacaoModal.expectAberto();

    await expect(solicitacaoModal.getAlertasErro().first()).toContainText(
      /Erro ao buscar dados da filial/i,
    );
  });

  test('deve apresentar o erro de indisponibilidade uma única vez', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    // Defeito conhecido D-11, em aberto: o mesmo erro é renderizado duas vezes seguidas.
    // O teste é escrito contra o comportamento esperado e por isso REPROVA hoje.
    //
    // A espera pelo modal pronto NÃO é decoração: sem ela a contagem é lida antes do
    // segundo alerta existir e o teste passa por acidente — falso verde. Medido em campo:
    // o segundo alerta chega junto com o modal (~170ms), e a partir daí a contagem é
    // estável em 2. Cada dataset é chamado UMA vez, então a duplicação está na renderização
    // do aviso, não em requisição repetida.
    await abrirSolicitacaoComProtheusFora(page, contratosPage);
    await solicitacaoModal.expectAberto();

    await expect(solicitacaoModal.getAlertasErro()).toHaveCount(1);
  });

  test('não deve enviar solicitação alguma quando o contrato não trouxe itens', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    // Esta é a assertion que protege o negócio: sem itens não há o que comprar, e uma
    // solicitação vazia entrando no fluxo de aprovação é o pior desfecho possível.
    //
    // Ver README > Divergências abertas: o roteiro previa a mensagem "Nenhum item de
    // contrato foi carregado" neste ponto. Com o Protheus fora, o Confirmar não produz
    // mensagem nova — apenas não envia nada. O bloqueio (que é o essencial) acontece; o
    // aviso ao usuário está em aberto com o time.
    const guarda = await abrirSolicitacaoComProtheusFora(page, contratosPage);
    await solicitacaoModal.expectAberto();

    const solicitacao = criarSolicitacaoCompra();
    await solicitacaoModal.preencher(solicitacao);
    await solicitacaoModal.confirmar();

    expect(
      guarda.tentativas(),
      `solicitação chegou a ser enviada mesmo sem itens: ${guarda.urls().join(', ')}`,
    ).toBe(0);

    // O modal permanece aberto: não pode haver falso sucesso nem fechamento silencioso
    await expect(solicitacaoModal.getDialog()).toBeVisible();
    await expect(page.getByText(/iniciado com sucesso/i)).toHaveCount(0);
  });
});
