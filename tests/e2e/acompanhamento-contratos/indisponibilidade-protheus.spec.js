// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { DATASET } from '../../../config/ambiente.js';
import { descobrirContratoVigente } from '../../../utils/massa-contratos.js';
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
   * @param {string[]} [datasetsFora] quais datasets do Protheus devem falhar. O default derruba
   *   os dois que alimentam o modal; passar um único dataset isola a reação a UMA falha.
   */
  async function abrirSolicitacaoComProtheusFora(
    page,
    contratosPage,
    datasetsFora = [DATASET.FILIAL, DATASET.ITENS_PLANILHA],
  ) {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    for (const dataset of datasetsFora) await derrubarDataset(page, dataset);

    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato((await descobrirContratoVigente(contratosPage)).contrato);
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

  test('deve exibir um alerta por dado indisponível, nomeando o dado que faltou', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    // ⚠️ CORREÇÃO DE LEITURA — medido em 25/08/2026, e contradiz o D-11 como está registrado
    // no README e no mapa do ambiente ("o mesmo alerta renderiza duas vezes; a duplicação é de
    // renderização"). Três medições, isolando os datasets:
    //
    //   | datasets derrubados            | alertas | texto                                        |
    //   |--------------------------------|---------|----------------------------------------------|
    //   | só `...getBranches_restGetAll` |    1    | "Erro ao buscar dados da filial: <erro>"      |
    //   | só `...getItensPlanilha_...`   |    1    | "Erro ao buscar dados da filial: <erro>"      |
    //   | os dois                        |    2    | um alerta por dataset, ambos com o MESMO rótulo |
    //
    // Ou seja: NÃO existe duplicação de renderização. O widget exibe exatamente um alerta por
    // falha. O que existe é um alerta MAL ROTULADO: a falha ao carregar os itens da planilha é
    // anunciada como "Erro ao buscar dados da filial". Com o Protheus realmente fora, os dois
    // alertas trazem o mesmo texto do servidor e ficam indistinguíveis — foi isso que se leu
    // antes como "o mesmo alerta duas vezes".
    //
    // O teste anterior derrubava os DOIS datasets e exigia UM alerta: reprovava com
    // `Expected 1 / Received 2` medindo o próprio cenário, não um defeito. Aqui derruba-se um
    // único dataset, o que separa as duas afirmações: (1) uma falha gera um alerta — passa, e
    // protege contra uma duplicação futura; (2) o alerta precisa dizer QUAL dado faltou —
    // reprova, e é o defeito real a levar ao time (substitui o D-11 como está escrito).
    await abrirSolicitacaoComProtheusFora(page, contratosPage, [DATASET.ITENS_PLANILHA]);
    await solicitacaoModal.expectAberto();

    const alertas = solicitacaoModal.getAlertasErro();

    // `toHaveCount(1)` sozinho passaria no primeiro poll em que a contagem fosse 1 — inclusive
    // antes de um eventual segundo alerta existir. É a armadilha de "contagem lida cedo demais"
    // do CLAUDE.md. Por isso a contagem é lida só depois de ESTABILIZAR (3 leituras iguais
    // consecutivas, ~1s), e então comparada.
    let contagemAnterior = -1;
    let leiturasIguaisSeguidas = 0;
    await expect
      .poll(
        async () => {
          const atual = await alertas.count();
          leiturasIguaisSeguidas = atual > 0 && atual === contagemAnterior ? leiturasIguaisSeguidas + 1 : 0;
          contagemAnterior = atual;
          return leiturasIguaisSeguidas;
        },
        {
          timeout: 30_000,
          intervals: Array(60).fill(500),
          message:
            'com o dataset de itens da planilha fora, o modal não chegou a exibir nenhum alerta de ' +
            'erro estável em 30s — sem alerta não há veredito: ou o aviso sumiu, ou o modal não ' +
            'reagiu à indisponibilidade',
        },
      )
      .toBeGreaterThanOrEqual(3);

    const textosDosAlertas = (await alertas.allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());

    expect(
      textosDosAlertas.length,
      'UMA falha de dataset tem que produzir UM alerta. Mais de um significa duplicação de ' +
        `renderização (o que o D-11 afirmava). Alertas exibidos: ${JSON.stringify(textosDosAlertas)}`,
    ).toBe(1);

    // ⚠️ FALSO VERDE JÁ PAGO (visto na execução de 25/08/2026): a assertion abaixo não pode ser
    // aplicada ao texto INTEIRO do alerta. O corpo simulado por `derrubarDataset` é
    // "Falha simulada no dataset <nome>", o widget concatena esse texto ao próprio rótulo, e o
    // nome do dataset (`...getItensPlanilha...`) casaria com /iten|planilha/ sozinho — o teste
    // passaria por causa da massa injetada pela automação, não do produto. O oráculo é o rótulo
    // que o PRODUTO escreve, isto é, o trecho anterior à mensagem simulada.
    const alerta = textosDosAlertas[0];
    expect(
      alerta,
      `o alerta exibido não é o da indisponibilidade simulada — texto na tela: ${JSON.stringify(alerta)}`,
    ).toContain('Falha simulada');

    const rotuloDoProduto = alerta.split('Falha simulada')[0];

    // Defeito real, aberto: o alerta da falha ao carregar os ITENS DA PLANILHA é rotulado como
    // erro "ao buscar dados da filial". O usuário não tem como saber qual dado faltou — e é o
    // que faz duas falhas distintas parecerem o mesmo aviso repetido.
    expect(
      rotuloDoProduto,
      'defeito: o alerta não nomeia o dado que faltou — a falha do dataset ' +
        `\`${DATASET.ITENS_PLANILHA}\` (itens da planilha do contrato) é anunciada ao usuário ` +
        'com o rótulo "Erro ao buscar dados da filial". Rótulo errado, e é a origem da leitura ' +
        'de que o "mesmo alerta aparece duas vezes" quando os dois datasets caem juntos',
    ).toMatch(/iten|planilha/i);
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
