// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { CicloCompradorPage, criarSolicitacaoCompraClassica, aprovarValidacaoDoGestor, aguardarAtividadeAtual } from '../../../pages/CicloCompradorPage.js';
import { TrackerComprasPage } from '../../../pages/TrackerComprasPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * Ciclo do Comprador — o que a conta de automação alcança, e onde para.
 *
 * A investigação desta suíte mediu, com massa própria, exatamente onde o ciclo do comprador
 * consegue chegar hoje:
 *
 * - **Validação Inicial** (CT-E2E-06-H) não exige delegação e lista SCs reais — inclusive a que
 *   esta suíte cria e aprova, com a Etapa avançando de verdade.
 * - **Controle de Cotações, Avaliação de Propostas e Definir Vencedor Cotação** exigem a
 *   delegação "Atuar como". A delegação FUNCIONA — troca a sessão para o comprador substituído
 *   com sucesso observável ("Bem vindo, ‹nome›") — mas as três filas continuam vazias mesmo
 *   delegadas, porque nenhuma SC (nem as desta suíte, nem as ~55 que já têm comprador atribuído
 *   na aba Transferir da Gerência de Compras) chegou a gerar cotação: todas ficam presas na
 *   Validação Orçamentária (`alcadas-orcamentaria.spec.js`) antes de alcançar esse ponto.
 *   "Atuar como" destrava a VISÃO; não destrava a FALTA DE MASSA corrente.
 * - **Retorno ao ERP**: o pedido no Protheus não existe porque a SC nunca passa da alçada.
 * - **Tracker** (CT-E2E-11-H): a rastreabilidade em si funciona perfeitamente para o trecho que
 *   a SC de fato percorre.
 *
 * ## O que mudou nesta revisão
 *
 * As etapas 7, 8, 9 e 10 eram declaradas COBERTAS por testes que afirmavam a fila vazia e o
 * pedido inexistente — o resultado esperado de cada caso, negado e registrado como aprovação.
 * Ficavam verdes e a matriz contava as quatro. Agora: os testes que restam medem o que de fato
 * medem (delegação, filtros, colunas, teto do ciclo), a falta de massa virou
 * PRÉ-CONDIÇÃO AUSENTE em vez de assertion, e os quatro casos estão declarados como lacuna,
 * com motivo, em `scripts/gerar-cobertura.mjs`.
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

    // `possuiDados()` (mais de UMA linha), não `count() > 0`: a grade vazia renderiza uma
    // `tbody tr` com o placeholder "Nenhum dado encontrado", então `> 0` era satisfeito por
    // uma fila VAZIA — falso verde medido em 28/08/2026 — e o título ("lista SCs reais")
    // ficava falso. A fila em si é pré-condição: depende de haver SC designada a esta conta.
    if (!(await ciclo.possuiDados())) {
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE: a Validação Inicial não lista nenhuma solicitação para a conta ' +
          'autenticada no momento da execução (só a linha de placeholder). A sub-tela mostra as ' +
          'SCs do COMPRADOR DESIGNADO, e a designação vem da SY1 do Protheus. Isto NÃO é ' +
          'defeito do produto sob teste — o teste irmão `@destrutivo` desta describe cria a ' +
          'própria massa e é ele quem exercita o fluxo.',
      );
    }

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

/**
 * Filas delegadas do Portal do Comprador — Controle de Cotações, Avaliação de Propostas e
 * Definir Vencedor Cotação.
 *
 * ## Por que estes testes não citam mais CT-E2E-07, 08 e 09
 *
 * Eles afirmavam que a fila vem VAZIA — `getByText('Nenhum dado encontrado')).toBeVisible()`
 * e `possuiDados()).toBe(false)` — e ficavam verdes. Mas o resultado esperado dos três casos
 * é o oposto: a cotação nasce com os itens da SC e número gerado (etapa 7), a SC é rastreável
 * pelo Nº SC / Proc. Fluig com propostas comparáveis (etapa 8), o vencedor é registrado
 * (etapa 9). Com os IDs no título, `docs/cobertura.md` marcava as três etapas centrais do
 * ciclo como ✅ enquanto a suíte provava justamente que elas não acontecem.
 *
 * O que sobra aqui é real e vale como regressão: a delegação "Atuar como" funciona, as
 * sub-telas abrem e a grade traz exatamente as colunas esperadas. Isso é medição de UI, não
 * cobertura do caso de negócio — por isso os títulos passam a dizer o que medem.
 *
 * A ausência de massa deixou de ser assertion e virou PRÉ-CONDIÇÃO AUSENTE: nenhuma SC
 * atravessa a Validação Orçamentária (seq 14, responsável NOMINAL fora do alcance da conta de
 * automação — ver `alcadas-orcamentaria.spec.js`), então nenhuma chega a gerar cotação.
 * É limitação de ambiente, não defeito do produto, e o relatório passa a dizer isso em vez de
 * reportar verde. Os três casos estão declarados como lacuna, com motivo, em
 * `scripts/gerar-cobertura.mjs`.
 */
test.describe('Portal do Comprador — filas delegadas (estrutura das sub-telas)', () => {
  test('a delegação "Atuar como" troca de sessão, e o Controle de Cotações expõe o filtro por Nº do Processo/Cotação/Filial/Datas', async ({
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

    // A fila em si é pré-condição, não resultado: "Atuar como" destrava a VISÃO, não cria
    // massa. Sem cotação nenhuma, não há o que controlar — e isso é ambiente, não defeito.
    if (!(await ciclo.possuiDados())) {
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE: o Controle de Cotações está vazio mesmo com a delegação ' +
          `aplicada (substituto "${substituto.rotulo ?? substituto.valor}"). Nenhuma SC ` +
          'atravessou a Validação Orçamentária (seq 14, responsável NOMINAL fora do alcance ' +
          'da conta de automação — ver `alcadas-orcamentaria.spec.js`), então nenhuma chegou ' +
          'a gerar cotação. Isto NÃO é defeito do produto sob teste: é falta de massa nesta ' +
          'etapa do ciclo.',
      );
    }

    expect(guarda.tentativas()).toBe(0);
  });

  test('Avaliação de Propostas traz exatamente as colunas Status, Nº Cotação, Filial, Nº SC, Proc. Fluig, Tipo de Documento, Parecer Técnico, Em Alçada, Dt. Validade e Valor Final', async ({
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

    if (!(await ciclo.possuiDados())) {
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE: a Avaliação de Propostas está vazia mesmo com a delegação ' +
          'aplicada — nenhuma SC atravessou a Validação Orçamentária, logo não há cotação nem ' +
          'proposta a comparar. Isto NÃO é defeito do produto sob teste; as colunas da grade, ' +
          'que é o que este teste mede, foram verificadas acima.',
      );
    }

    expect(guarda.tentativas()).toBe(0);
  });

  test('Definir Vencedor Cotação traz a mesma grade de acompanhamento de Avaliação de Propostas', async ({
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

    if (!(await ciclo.possuiDados())) {
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE: Definir Vencedor Cotação está vazia mesmo com a delegação ' +
          'aplicada — sem cotação analisada não há vencedor a definir. Isto NÃO é defeito do ' +
          'produto sob teste; as colunas da grade, que é o que este teste mede, foram ' +
          'verificadas acima.',
      );
    }

    expect(guarda.tentativas()).toBe(0);
  });
});

test.describe('Ciclo do Comprador — teto do ciclo e Tracker (CT-E2E-11-H)', () => {
  /**
   * Teto medido do ciclo para a conta de automação.
   *
   * ## Por que não cita mais CT-E2E-10
   *
   * O resultado esperado da etapa 10 é *"processo encerrado; pedido gerado no Protheus
   * vinculado à SC"*. A versão anterior afirmava `getByText(/Pedido de Compra/i)` com
   * `toHaveCount(0)` — o resultado esperado NEGADO, registrado como aprovação, e ainda por
   * cima numa assertion de ausência sobre a página inteira, satisfeita no primeiro poll
   * (antes de o Histórico terminar de carregar ela seria verdadeira de qualquer jeito).
   * `docs/cobertura.md` creditava a etapa 10 do ciclo a esse teste.
   *
   * O que este teste realmente mede, e que vale como regressão: a SC própria percorre até a
   * Validação Orçamentária e PARA lá — o teto que a conta de automação alcança. A afirmação
   * é positiva e específica; se um dia a SC passar dali, este teste reprova e o time descobre
   * que o teto mudou. A etapa 10 em si está declarada como lacuna, com motivo, em
   * `scripts/gerar-cobertura.mjs`.
   */
  test('@destrutivo a SC própria percorre até a Validação Orçamentária e para lá — o teto do ciclo para esta conta', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const { numeroProcesso } = await criarSolicitacaoCompraClassica(page, {
      justificativa: `QA teto do ciclo — Validação Orçamentária ${Date.now()}`,
    });

    await aprovarValidacaoDoGestor(page, numeroProcesso, 'QA aprovando Validação do Gestor — teto do ciclo');
    await aguardarAtividadeAtual(page, numeroProcesso, ['Validação Orçamentária'], { timeout: 90_000 });

    await expect(
      page.getByText('Atividade atual: Validação Orçamentária'),
      `a SC ${numeroProcesso} deveria estar parada na Validação Orçamentária — é o teto medido ` +
        'do ciclo para a conta de automação (seq 14, responsável nominal)',
    ).toBeVisible();
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
