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
    await expect(tracker.getLinhasDoResultado()).toHaveCount(0);

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

  /**
   * FSWTBC-2158 e FSWTBC-4804 — o disparo automático de Faturamento não pode duplicar.
   *
   * O contrato com medição automática deve gerar **um** processo de Faturamento por competência.
   * Duplicata significa medição em dobro, e o cliente só percebe no pagamento.
   *
   * ## O que a medição impôs a este teste
   *
   * A chave NÃO é (contrato, competência). O disparo abre **um processo por FILIAL** do
   * contrato — 50 filiais, 50 processos, e isso é o desenho, não defeito (`cassi-fluig-master`).
   * Além disso, um levantamento anterior já quase reportou duplicidade falsa aqui: 60 processos
   * para 7 contratos num único lote pareciam duplicata, e o diff campo a campo mostrou que
   * diferiam em planilha e medição. A chave real é
   * **(Nº Contrato, Competência, Filial da Medição, Nº Planilha)**.
   *
   * Só entram as FCs abertas pelo **Usuário Integrador** — as manuais e as criadas por esta
   * suíte não são o objeto do chamado — e as canceladas ficam de fora.
   *
   * ## O que este teste NÃO cobre, e fica declarado
   *
   * O caso pede conferir contra a **lista de contratos vigentes com medição automática** do
   * cliente (`CN1_MEDAUT`), para provar que nenhum contrato ficou SEM FC. Essa lista não está
   * disponível e o campo não é exposto ao Fluig; sem ela só dá para afirmar a ausência de
   * duplicata, não a completude. O disparo em si é schedule do Protheus, fora de alcance.
   *
   * Leitura pura.
   */
  test('FSWTBC-2158 FSWTBC-4804 — o disparo automático não abre Faturamento duplicado no período', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const tracker = new TrackerComprasPage(page);

    await tracker.goto();
    await tracker.expectCarregada();
    await tracker.selecionarVisao('Faturamento de Contratos');

    // A busca é por MÊS-CALENDÁRIO, e não por uma janela larga de dias, por uma razão medida:
    // a grade pagina de 10 em 10 sem seletor de tamanho, e 40 dias passam de 600 linhas — mais
    // de 60 cliques de paginação. Um mês fica em ~170 linhas / 18 páginas. Como o disparo é
    // MENSAL (skill: 01:00, um processo por filial do contrato), o mês corrente basta; nos
    // primeiros dias do mês, antes de ele rodar, o mês anterior é quem tem a massa.
    const hoje = new Date();
    const iso = (/** @type {Date} */ d) => d.toISOString().slice(0, 10);
    /** @type {Array<{de: string, ate: string}>} */
    const janelas = [0, -1].map((deslocamento) => {
      const primeiro = new Date(hoje.getFullYear(), hoje.getMonth() + deslocamento, 1);
      const ultimo = new Date(hoje.getFullYear(), hoje.getMonth() + deslocamento + 1, 0);
      return { de: iso(primeiro), ate: iso(ultimo < hoje ? ultimo : hoje) };
    });

    /** @type {Array<Record<string,string>>} */
    let automaticas = [];
    /** @type {{de: string, ate: string}} */
    let janelaUsada = janelas[0];
    for (const janela of janelas) {
      await tracker.filtrarPeriodoDeFaturamento(janela.de, janela.ate);
      await tracker.pesquisar();
      await expect(tracker.alertaFiltroObrigatorio).toBeHidden();

      // Paginado: o disparo de 03/09/2026 sozinho abriu 151 FCs, e a página 1 mostra 10.
      const linhas = await tracker.lerTodasAsLinhasComoMapa();
      const doDisparo = linhas.filter(
        (l) => /integrador/i.test(l['Solicitante'] ?? '') && !/CANCELAD/i.test(l['Status'] ?? ''),
      );

      test.info().annotations.push({
        type: 'faturamento-no-periodo',
        description:
          `${janela.de}..${janela.ate}: ${linhas.length} FC no período, ` +
          `${doDisparo.length} abertas pelo Usuário Integrador e não canceladas`,
      });

      if (doDisparo.length > 0) {
        automaticas = doDisparo;
        janelaUsada = janela;
        break;
      }
    }

    if (automaticas.length === 0) {
      faltaPreCondicao(
        '(ambiente): nenhuma FC aberta pelo Usuário Integrador nos meses ' +
          `${janelas.map((j) => `${j.de}..${j.ate}`).join(' e ')} — sem massa do disparo ` +
          'automático não há duplicata a procurar.',
      );
    }

    const chave = (/** @type {Record<string,string>} */ l) =>
      [
        l['Nº Contrato'],
        l['Competência do Contrato'],
        l['Código da Filial Medição'],
        l['Nº Planilha'],
      ].join(' | ');

    const vistas = new Map();
    /** @type {string[]} */
    const duplicadas = [];
    for (const l of automaticas) {
      const k = chave(l);
      if (vistas.has(k)) {
        duplicadas.push(`${k} → processos ${vistas.get(k)} e ${l['Nº do Processo Fluig']}`);
      } else {
        vistas.set(k, l['Nº do Processo Fluig']);
      }
    }

    expect(
      duplicadas,
      `em ${janelaUsada.de}..${janelaUsada.ate}, o disparo automático abriu mais de um ` +
        'Faturamento para o mesmo contrato/competência/filial/planilha — medição em dobro, ' +
        'percebida só no pagamento',
    ).toEqual([]);

    // FSWTBC-4804, metade verificável: a FC do disparo nasce identificada. Sem contrato ou sem
    // competência, ninguém sabe o que ela mede — e foi assim que uma FC apareceu no Tracker
    // com Competência e Nº Medição em branco durante o levantamento.
    const semIdentificacao = automaticas
      .filter((l) => !l['Nº Contrato'] || !l['Competência do Contrato'])
      .map((l) => `processo ${l['Nº do Processo Fluig']}`);

    expect(
      semIdentificacao,
      'FC aberta pelo disparo automático sem Nº Contrato ou sem Competência — não dá para ' +
        'saber o que ela mede',
    ).toEqual([]);

    expect(guarda.tentativas()).toBe(0);
  });

  /**
   * FSWTBC-1934 — o disparo automático da madrugada abre medições sadias, não resíduo.
   *
   * O chamado ("Erro no disparo automático de medições") não tem descrição além do título: é
   * caso de caracterização. O que se pode afirmar sobre o disparo, sem ser fiscal e sem
   * movimentar nada, é o **estado em que as instâncias nascem** — e é justamente aí que o
   * defeito aparecia: instância em *Correção*, ou presa sem responsável, ou sem número de
   * medição, é resíduo que ninguém consegue tocar e que só é notado no fechamento do mês.
   *
   * Complementar ao teste de duplicidade acima: aquele afirma que o disparo não abre a mesma
   * medição duas vezes; este, que as que ele abre estão utilizáveis.
   *
   * Medido em 09/09/2026 — as 151 FCs do disparo de 03/09 nasceram todas às 03h, em *Realizar
   * Medição do Contrato*, com responsável, Nº Medição e Fiscal de Contrato preenchidos.
   */
  test('FSWTBC-1934 — as medições do disparo automático nascem na etapa do fiscal, com responsável e número', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const tracker = new TrackerComprasPage(page);

    await tracker.goto();
    await tracker.expectCarregada();
    await tracker.selecionarVisao('Faturamento de Contratos');

    const hoje = new Date();
    const iso = (/** @type {Date} */ d) => d.toISOString().slice(0, 10);
    /** @type {Array<Record<string,string>>} */
    let automaticas = [];
    for (const deslocamento of [0, -1]) {
      const primeiro = new Date(hoje.getFullYear(), hoje.getMonth() + deslocamento, 1);
      const ultimoDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + deslocamento + 1, 0);
      await tracker.filtrarPeriodoDeFaturamento(
        iso(primeiro),
        iso(ultimoDoMes < hoje ? ultimoDoMes : hoje),
      );
      await tracker.pesquisar();
      await expect(tracker.alertaFiltroObrigatorio).toBeHidden();

      automaticas = (await tracker.lerTodasAsLinhasComoMapa()).filter(
        (l) => /integrador/i.test(l['Solicitante'] ?? '') && !/CANCELAD/i.test(l['Status'] ?? ''),
      );
      if (automaticas.length > 0) break;
    }

    if (automaticas.length === 0) {
      faltaPreCondicao(
        '(ambiente): nenhuma FC aberta pelo Usuário Integrador no mês corrente nem no anterior ' +
          '— sem massa do disparo automático não há o que caracterizar.',
      );
    }

    /** @param {Record<string,string>} l */
    const identificar = (l) => `processo ${l['Nº do Processo Fluig']} (${l['Nº Contrato']})`;

    // Nascer na etapa do fiscal é o desfecho são. Correção — ou qualquer atividade de
    // tratamento de erro — é o resíduo que o chamado descreve.
    const foraDaEtapaDoFiscal = automaticas
      .filter((l) => !/Realizar Medição do Contrato/i.test(l['Atividade Atual'] ?? ''))
      .map((l) => `${identificar(l)} em "${l['Atividade Atual']}"`);

    const semResponsavel = automaticas
      .filter((l) => !(l['Responsável Atual'] ?? '').trim())
      .map(identificar);

    const semNumeroDeMedicao = automaticas
      .filter((l) => !(l['Nº Medição'] ?? '').trim())
      .map(identificar);

    test.info().annotations.push({
      type: 'disparo-automatico',
      description:
        `${automaticas.length} FCs do disparo · fora da etapa do fiscal: ` +
        `${foraDaEtapaDoFiscal.length} · sem responsável: ${semResponsavel.length} · ` +
        `sem Nº Medição: ${semNumeroDeMedicao.length}`,
    });

    expect(
      foraDaEtapaDoFiscal,
      'medição aberta pelo disparo automático que não está em "Realizar Medição do Contrato" ' +
        '— instância em correção ou desviada é o sintoma do FSWTBC-1934',
    ).toEqual([]);

    expect(
      semResponsavel,
      'medição do disparo sem responsável atual — ninguém consegue movimentá-la',
    ).toEqual([]);

    expect(
      semNumeroDeMedicao,
      'medição do disparo sem Nº Medição — não dá para conciliar com o Protheus',
    ).toEqual([]);

    expect(guarda.tentativas()).toBe(0);
  });
});
