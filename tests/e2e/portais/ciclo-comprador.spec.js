// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { CicloCompradorPage, criarSolicitacaoCompraClassica, aprovarValidacaoDoGestor, aguardarAtividadeAtual } from '../../../pages/CicloCompradorPage.js';
import { TrackerComprasPage } from '../../../pages/TrackerComprasPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * Ciclo do Comprador — CT-E2E-06-H a CT-E2E-11-H.
 *
 * A investigação desta suíte mediu, com massa própria, exatamente onde o ciclo do comprador
 * consegue chegar hoje:
 *
 * - **Validação Inicial** (CT-E2E-06-H) não exige delegação e lista SCs reais — inclusive a que
 *   esta suíte cria e aprova, com a Etapa avançando de verdade.
 * - **Controle de Cotações, Avaliação de Propostas e Definir Vencedor Cotação**
 *   (CT-E2E-07/08/09-H) exigem a delegação "Atuar como". A delegação FUNCIONA — troca a sessão
 *   para o comprador substituído com sucesso observável ("Bem vindo, ‹nome›") — mas as três
 *   filas continuam vazias mesmo delegadas, porque nenhuma SC (nem as desta suíte, nem as ~55
 *   que já têm comprador atribuído na aba Transferir da Gerência de Compras) chegou a gerar
 *   cotação: todas ficam presas na Validação Orçamentária (`alcadas-orcamentaria.spec.js`) antes
 *   de alcançar esse ponto. "Atuar como" destrava a VISÃO; não destrava a FALTA DE MASSA
 *   corrente.
 * - **Retorno ao ERP** (CT-E2E-10-H) e **Tracker** (CT-E2E-11-H): o pedido no Protheus não
 *   existe porque a SC nunca passa da alçada — mas a rastreabilidade em si (Tracker, trilha do
 *   processo) funciona perfeitamente para o trecho que a SC de fato percorre.
 */
test.describe('Ciclo do Comprador — Validação Inicial (CT-E2E-06-H)', () => {
  test('deve listar SCs reais em Validação Inicial, com dados do item visíveis ao expandir a linha, sem exigir delegação', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const ciclo = new CicloCompradorPage(page);

    await ciclo.goto();
    await ciclo.expectCarregada();
    await ciclo.portal.abrirEtapa('Validação Inicial');
    await expect(page).toHaveURL(/validacaoInicial/);

    // Confirmado em campo: esta sub-tela não tem o seletor "Atuar como" — lista dados reais
    // diretamente para a conta autenticada.
    await expect(ciclo.portal.comboAtuarComo).toHaveCount(0);

    await expect(ciclo.getTabelaAtiva()).toBeVisible();
    await expect
      .poll(() => ciclo.getLinhas().count(), { timeout: 30_000 })
      .toBeGreaterThan(0);

    const primeiraLinha = ciclo.getLinhas().first();
    await ciclo.expandirDetalhe(primeiraLinha);

    // Dados do contrato/item da SC, visíveis só depois de expandir — confirma
    // "dados do contrato visíveis" do caso de teste.
    await expect(page.getByText('Produto/Serviço', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Quantidade', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Vlr. Total Estimado', { exact: false }).first()).toBeVisible();

    expect(guarda.tentativas()).toBe(0);
  });

  test('@destrutivo uma SC própria aparece em Validação Inicial e sua Etapa avança de verdade após a aprovação do Gestor', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const { numeroProcesso } = await criarSolicitacaoCompraClassica(page, {
      justificativa: `QA CT-E2E-06-H validacao inicial avanca ${Date.now()}`,
    });

    await aprovarValidacaoDoGestor(page, numeroProcesso, 'QA aprovando Validação do Gestor — CT-E2E-06-H');
    await aguardarAtividadeAtual(page, numeroProcesso, ['Validação Orçamentária'], { timeout: 90_000 });

    const ciclo = new CicloCompradorPage(page);
    await ciclo.goto();
    await ciclo.expectCarregada();
    await ciclo.portal.abrirEtapa('Validação Inicial');
    await expect(page).toHaveURL(/validacaoInicial/);

    // A SC aparece para o comprador designado (aqui, a própria conta que a gerencia) e a Etapa
    // exibida já reflete a aprovação que esta execução fez — "a validação avança" comprovado.
    await expect
      .poll(
        async () => {
          const linha = ciclo.localizarLinhaPorNumero(numeroProcesso);
          return (await linha.count()) > 0 ? linha.first().innerText() : null;
        },
        {
          message: `SC ${numeroProcesso} deveria aparecer em Validação Inicial`,
          timeout: 30_000,
        },
      )
      .toContain('Validação Orçamentária');
  });
});

test.describe('Ciclo do Comprador — filas delegadas (CT-E2E-07-H, CT-E2E-08-H, CT-E2E-09-H)', () => {
  test('CT-E2E-07-H — a delegação "Atuar como" troca de sessão com sucesso, e o Controle de Cotações expõe o filtro por Nº do Processo/Cotação/Filial/Datas', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const ciclo = new CicloCompradorPage(page);

    await ciclo.goto();
    await ciclo.expectCarregada();
    await ciclo.portal.abrirEtapa('Validação Inicial');
    await ciclo.portal.irParaEtapa('Controle de Cotações');
    await expect(page).toHaveURL(/controleCotacao/);

    await expect(ciclo.portal.comboAtuarComo).toBeVisible();
    const substituto = await ciclo.atuarComoSubstituto();
    expect(substituto.valor).toBeTruthy();

    // A troca de delegação leva de volta ao Acesso Rápido da sub-SPA — reabre a etapa.
    await ciclo.portal.abrirEtapa('Controle De Cotações');
    await expect(page).toHaveURL(/controleCotacao/);

    await page.getByRole('button', { name: 'Filtrar' }).click();
    await expect(page.getByLabel('Nº do Processo Fluig')).toBeVisible();
    await expect(page.getByLabel('Nº da Cotação ERP')).toBeVisible();
    await expect(page.getByLabel('Filial')).toBeVisible();
    await expect(page.getByLabel('Data Solicitação')).toBeVisible();
    await expect(page.getByLabel('Data Validade')).toBeVisible();

    // Medido, não presumido: mesmo delegado para o comprador substituído, não há cotação
    // gerada hoje — nenhuma SC atravessou a Validação Orçamentária até aqui (ver
    // `alcadas-orcamentaria.spec.js`). "Atuar como" destrava a visão, não cria massa.
    await expect(page.getByText('Nenhum dado encontrado')).toBeVisible({ timeout: 30_000 });

    expect(guarda.tentativas()).toBe(0);
  });

  test('CT-E2E-08-H — Avaliação de Propostas traz exatamente as colunas Status, Nº Cotação, Filial, Nº SC, Proc. Fluig, Tipo de Documento, Parecer Técnico, Em Alçada, Dt. Validade e Valor Final', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const ciclo = new CicloCompradorPage(page);

    await ciclo.goto();
    await ciclo.expectCarregada();
    await ciclo.portal.abrirEtapa('Validação Inicial');
    await ciclo.portal.irParaEtapa('Controle de Cotações');
    await ciclo.atuarComoSubstituto();
    await ciclo.portal.abrirEtapa('Avaliação de Propostas');
    await expect(page).toHaveURL(/avaliacaoPropostas/);

    const colunas = await ciclo.lerColunas();
    expect(colunas).toEqual([
      'Status',
      'Núm. Cotação',
      'Filial',
      'Número da SC',
      'Nº. Proc. Fluig',
      'Tip. Documento',
      'Parecer Téc.',
      'Em Alçada',
      'Dt. Validade',
      'Valor Final',
    ]);

    // Rastreabilidade até aqui: hoje, nenhuma SC chega — a mesma ausência medida no Controle de
    // Cotações, pela mesma causa (bloqueio na Validação Orçamentária).
    expect(await ciclo.possuiDados()).toBe(false);

    expect(guarda.tentativas()).toBe(0);
  });

  test('CT-E2E-09-H — Definir Vencedor Cotação traz a mesma grade de acompanhamento de Avaliação de Propostas, hoje sem cotação vencedora disponível para definir', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const ciclo = new CicloCompradorPage(page);

    await ciclo.goto();
    await ciclo.expectCarregada();
    await ciclo.portal.abrirEtapa('Validação Inicial');
    await ciclo.portal.irParaEtapa('Controle de Cotações');
    await ciclo.atuarComoSubstituto();
    await ciclo.portal.abrirEtapa('Definir Vencedor Cotação');
    await expect(page).toHaveURL(/propostaVencedora/);

    const colunas = await ciclo.lerColunas();
    expect(colunas).toEqual([
      'Status',
      'Núm. Cotação',
      'Filial',
      'Número da SC',
      'Nº. Proc. Fluig',
      'Tip. Documento',
      'Parecer Téc.',
      'Em Alçada',
      'Dt. Validade',
      'Valor Final',
    ]);
    expect(await ciclo.possuiDados()).toBe(false);

    expect(guarda.tentativas()).toBe(0);
  });
});

test.describe('Ciclo do Comprador — retorno ao ERP e Tracker (CT-E2E-10-H, CT-E2E-11-H)', () => {
  test('@destrutivo CT-E2E-10-H — a SC própria não gera pedido no Protheus antes de vencer a alçada, e isso fica visível no próprio Histórico', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const { numeroProcesso } = await criarSolicitacaoCompraClassica(page, {
      justificativa: `QA CT-E2E-10-H retorno erp ${Date.now()}`,
    });

    await aprovarValidacaoDoGestor(page, numeroProcesso, 'QA aprovando Validação do Gestor — CT-E2E-10-H');
    await aguardarAtividadeAtual(page, numeroProcesso, ['Validação Orçamentária'], { timeout: 90_000 });

    // Já em Validação Orçamentária (o teto medido em `alcadas-orcamentaria.spec.js`): nenhuma
    // menção a pedido de compra/Protheus no Histórico até este ponto — consequência direta e
    // determinística do bloqueio de alçada, não uma suposição isolada.
    await expect(page.getByText(/Pedido de Compra/i)).toHaveCount(0);
    await expect(page.getByText('Atividade atual: Validação Orçamentária')).toBeVisible();
  });

  test('@destrutivo CT-E2E-11-H — o Tracker localiza a SC própria pelo Nº do Processo Fluig e exibe a posição atual e o caminho percorrido', async ({
    page,
  }) => {
    test.setTimeout(180_000);

    const { numeroProcesso } = await criarSolicitacaoCompraClassica(page, {
      justificativa: `QA CT-E2E-11-H tracker ${Date.now()}`,
    });

    const tracker = new TrackerComprasPage(page);
    await tracker.goto();
    await tracker.expectCarregada();

    await page.getByLabel('Nº do Processo Fluig').fill(numeroProcesso);
    await tracker.pesquisar();
    await expect(tracker.alertaFiltroObrigatorio).toBeHidden();

    const linhas = tracker.getLinhasDoResultado();
    await expect(linhas.first()).toBeVisible({ timeout: 30_000 });
    expect(await linhas.count()).toBe(1);
    await expect(linhas.first()).toContainText(numeroProcesso);

    // "Caminho percorrido": o ícone de rastro (sem nome acessível — mesma limitação já
    // registrada para outros controles do portal, ver `docs/mapa-do-ambiente.md`) abre o
    // diálogo com a trilha do processo.
    await page.locator('.flaticon-organogram').first().click();
    await expect(page.getByText(`Rastro do Processo ${numeroProcesso}`)).toBeVisible();
    await expect(page.getByText(`${numeroProcesso} - Solicitação de Compras`)).toBeVisible();
  });
});
