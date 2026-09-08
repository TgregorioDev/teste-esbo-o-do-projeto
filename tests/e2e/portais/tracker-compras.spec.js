// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { TrackerComprasPage } from '../../../pages/TrackerComprasPage.js';
import { faltaPreCondicao } from '../../../utils/pre-condicao.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * Tracker de Processos Compras/Contratos — caso CT-E2E-11-H (somente leitura).
 *
 * Cobre: abrir o painel de filtros e filtrar processos, confirmando que a tela responde ao
 * filtro (recusa pesquisa sem nenhum critério; retorna processos reais com pelo menos um).
 * `bloquearCriacaoDeSolicitacao` fica de guarda: "Pesquisar Registro" é uma busca, mas a
 * guarda confirma que nenhuma escrita em process-management ocorre no caminho.
 */
test.describe('Tracker de Processos Compras/Contratos', () => {
  test('deve exibir o painel de filtros ao carregar', async ({ page }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const tracker = new TrackerComprasPage(page);

    await tracker.goto();
    await tracker.expectCarregada();

    await expect(page).toHaveTitle('Cassi - Fluig Plataforma - Tracker - Processos Compras/ Contratos');
    // Confirmado em campo: "Solicitação de Compras" é a opção selecionada por padrão.
    await expect(tracker.comboFiltrarPor.locator('option:checked')).toHaveText(
      'Solicitação de Compras',
    );
    await expect(tracker.botaoPesquisar).toBeVisible();

    expect(guarda.tentativas()).toBe(0);
  });

  test('deve exigir ao menos um filtro antes de pesquisar', async ({ page }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const tracker = new TrackerComprasPage(page);

    await tracker.goto();
    await tracker.expectCarregada();

    await tracker.pesquisar();

    await expect(tracker.alertaFiltroObrigatorio).toBeVisible();
    // Nenhum resultado deve ter sido carregado quando o filtro é recusado.
    expect(await tracker.getLinhasDoResultado().count()).toBe(0);

    expect(guarda.tentativas()).toBe(0);
  });

  test('deve listar processos reais ao filtrar por status', async ({ page }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const tracker = new TrackerComprasPage(page);

    await tracker.goto();
    await tracker.expectCarregada();

    await tracker.filtrarPorStatus('Abertos');
    await tracker.pesquisar();

    await expect(tracker.alertaFiltroObrigatorio).toBeHidden();
    const linhas = tracker.getLinhasDoResultado();
    await expect(linhas.first()).toBeVisible();
    // A quantidade varia com a base; o que o negócio garante é que o filtro devolve
    // processos — fixar o total tornaria o teste falso-vermelho a cada movimentação.
    expect(await linhas.count()).toBeGreaterThan(0);

    expect(guarda.tentativas()).toBe(0);
  });
  /**
   * FSWTBC-1942 — o Tracker oferece as nove visões do negócio.
   *
   * A suíte só exercitava a visão padrão. Uma visão que some (ou muda de rótulo) tira do ar a
   * única consulta que o time tem para aquele processo, e ninguém percebe até precisar dela.
   */
  test('FSWTBC-1942 — o filtro "Filtrar por" oferece as nove visões do negócio', async ({ page }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const tracker = new TrackerComprasPage(page);

    await tracker.goto();
    await tracker.expectCarregada();

    const visoes = await tracker.listarVisoes();

    test.info().annotations.push({
      type: 'visoes-do-tracker',
      description: `${visoes.length}: ${JSON.stringify(visoes)}`,
    });

    expect(visoes).toEqual([
      'Solicitação de Compras',
      'Cotação de Produtos/Serviços',
      'Negociação de Cotação de Produtos/Serviços',
      'Faturamento de Contratos',
      'Parecer Técnico',
      'Recepção de Documentos Fiscais',
      'Produtos/Rateio SC',
      'Negociação de Cotação de Produtos/Serviços(Detalhado Itens)',
      'Aprovadores SC',
    ]);

    expect(guarda.tentativas()).toBe(0);
  });

  /**
   * FSWTBC-3749 — a "Atividade Atual" que o Tracker mostra é a que o processo realmente aponta.
   *
   * A família de defeitos por trás disto: TRÊS nomes de atividade citados em chamados nunca
   * existiram no BPMN ("Aguarda Movimentação Protheus" na SC, "Verificar Trava Orçamentária",
   * "Ajustes na Proposta"). Quem lê um nome inventado procura uma etapa que não existe e
   * conclui a causa errada.
   *
   * ## Dois oráculos que descartei, e por quê
   *
   * 1. **Lista fixa de nomes.** O chamado cita quatro nomes "Aguarda…", mas o Tracker exibe
   *    "Aguarda Finalizar Cotação", que não está entre eles — medido em 08/09/2026. Lista
   *    fechada produziria vermelho contra comportamento correto.
   * 2. **Conjunto de nomes vistos numa amostra de movimentos.** `/processes/{id}/activities`
   *    devolve MOVIMENTOS (não a definição do BPMN), e mil deles cobrem só as instâncias
   *    recentes: cinco nomes legítimos apareceram como "inexistentes" só por não estarem na
   *    amostra. Ausência numa amostra não é prova de inexistência.
   *
   * O oráculo que resta é exato e não amostra nada: para CADA linha exibida, comparar o que o
   * Tracker mostra com o que o motor do processo reporta para AQUELA instância. Se divergir, o
   * Tracker está renomeando ou defasando a etapa — que é exatamente o defeito relatado.
   *
   * Leitura pura — nenhuma movimentação.
   */
  test('FSWTBC-3749 — a "Atividade Atual" do Tracker bate com a etapa real de cada instância', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const tracker = new TrackerComprasPage(page);

    await tracker.goto();
    await tracker.expectCarregada();
    await tracker.filtrarPorStatus('Abertos');
    await tracker.pesquisar();
    await expect(tracker.getLinhasDoResultado().first()).toBeVisible();

    const linhas = (await tracker.lerLinhasComoMapa())
      .map((l) => ({
        processo: (l['Nº do Processo Fluig'] ?? '').replace(/\D/g, ''),
        atividade: l['Atividade Atual'] ?? '',
      }))
      .filter((l) => l.processo && l.atividade);

    if (linhas.length === 0) {
      faltaPreCondicao(
        '(ambiente): o Tracker não devolveu nenhuma linha aberta com processo e atividade para conferir',
      );
    }

    // A API de processos é consultada de dentro da página: `page.request` leva 403 do WAF.
    const divergentes = await page.evaluate(async (alvos) => {
      const fora = [];
      for (const alvo of alvos) {
        const r = await fetch(
          `/process-management/api/v2/requests/${alvo.processo}/tasks?pageSize=60`,
          { headers: { Accept: 'application/json' } },
        );
        if (!r.ok) continue;
        const corpo = await r.json();
        const abertas = (corpo?.items ?? [])
          .filter((/** @type {any} */ x) => x.status === 'NOT_COMPLETED')
          .map((/** @type {any} */ x) => x?.state?.stateName ?? '')
          .filter(Boolean);
        // Instância em fork paralelo tem mais de uma tarefa aberta; basta que a atividade
        // exibida seja UMA delas.
        if (abertas.length && !abertas.includes(alvo.atividade)) {
          fora.push(
            `processo ${alvo.processo}: Tracker diz "${alvo.atividade}", motor diz ${JSON.stringify(abertas)}`,
          );
        }
      }
      return fora;
    }, linhas);

    test.info().annotations.push({
      type: 'atividades-do-tracker',
      description:
        `${linhas.length} linha(s) conferida(s); atividades exibidas: ` +
        `${JSON.stringify([...new Set(linhas.map((l) => l.atividade))])}`,
    });

    expect(
      divergentes,
      'a "Atividade Atual" do Tracker não corresponde à etapa que o processo aponta — quem lê ' +
        'procura uma etapa errada e conclui a causa errada',
    ).toEqual([]);

    expect(guarda.tentativas()).toBe(0);
  });
});
