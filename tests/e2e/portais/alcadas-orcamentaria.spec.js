// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import {
  criarSolicitacaoCompraClassica,
  aprovarValidacaoDoGestor,
  aguardarAtividadeAtual,
} from '../../../pages/CicloCompradorPage.js';
import { CentralTarefasComprasPage } from '../../../pages/CentralTarefasComprasPage.js';

/**
 * Validação Orçamentária e Alçadas — CT-E2E-03-H, CT-E2E-03-S1, CT-E2E-04-H.
 *
 * `docs/politica-de-escrita.md` registrava, de campo anterior, que estas etapas são
 * "designadas a aprovador nominal pelas tabelas AL/DHL do Protheus, não são pool, e a conta da
 * automação não estaria nelas" — mas também alertava para não aceitar isso sem medir (o mesmo
 * documento já errou ao afirmar bloqueio de processos de RH que na verdade abrem). As três
 * specs abaixo fazem essa medição com massa própria: cada uma cria uma Solicitação de Compras
 * real pelo formulário clássico e a leva, pela única aprovação que esta conta consegue fazer
 * (Validação do Gestor, via pool "Grupo de Compras"), até a Validação Orçamentária.
 *
 * O que a medição confirma:
 *
 * - A SC avança sozinha por um trecho automático do BPMN (`Compra Centralizada?` →
 *   `Grava SC e Anexos`, integração com o Protheus, ~70-100s) até parar em "Validação do
 *   Gestor", que ESTA conta consegue assumir e aprovar — não é pool vazio, é pool real
 *   (`Grupo de Compras - Validação do Gestor Imediato da Req. de Compras`).
 * - Depois de aprovada, mais um trecho automático (`Distribuição Gestor Orçamentario` →
 *   fork paralelo) leva a SC a "Validação Orçamentária" — e é aqui, e só aqui, que a conta
 *   para: não há botão "Assumir tarefa" nesta atividade para esta conta, e a atividade se
 *   anuncia como consenso ("esta atividade requer um consenso de: 100%"), não como tarefa
 *   individual ou de pool. Isso bate com a hipótese AL/DHL, agora com massa própria e
 *   reproduzível — não com suposição.
 *
 * Nenhuma destas specs tenta contornar a alçada (não haveria como, sem credencial de
 * aprovador nominal) — elas provam, com massa criada e movimentada de verdade, exatamente
 * onde e por que a conta da automação para.
 */
test.describe('Validação Orçamentária e Alçadas', () => {
  test('@destrutivo CT-E2E-03-H — SC própria aprovada na Validação do Gestor para em Validação Orçamentária, sem controle de ação para a conta autenticada', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const { numeroProcesso } = await criarSolicitacaoCompraClassica(page, {
      justificativa: `QA CT-E2E-03-H validacao orcamentaria alcada ${Date.now()}`,
    });

    await aprovarValidacaoDoGestor(page, numeroProcesso, 'QA aprovando Validação do Gestor — CT-E2E-03-H');

    const atividade = await aguardarAtividadeAtual(page, numeroProcesso, ['Validação Orçamentária'], {
      timeout: 90_000,
    });
    expect(atividade).toBe('Validação Orçamentária');

    // A alçada nominal (AL/DHL): nenhuma ação de assumir/aprovar disponível para esta conta na
    // atividade em que a SC efetivamente parou.
    await expect(page.getByRole('button', { name: 'Assumir tarefa' })).toHaveCount(0);
  });

  test('@destrutivo CT-E2E-03-S1 — a Validação Orçamentária se anuncia como consenso de aprovadores nominais, não como tarefa individual ou de pool', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const { numeroProcesso } = await criarSolicitacaoCompraClassica(page, {
      justificativa: `QA CT-E2E-03-S1 consenso alcada ${Date.now()}`,
    });

    await aprovarValidacaoDoGestor(page, numeroProcesso, 'QA aprovando Validação do Gestor — CT-E2E-03-S1');
    await aguardarAtividadeAtual(page, numeroProcesso, ['Validação Orçamentária'], { timeout: 90_000 });

    // O próprio texto da tela é quem descreve o mecanismo: consenso percentual entre
    // aprovadores nominais — a assinatura do desenho AL/DHL, não de fila de pool.
    await expect(page.getByText('esta atividade requer um consenso de: 100%')).toBeVisible();
    await expect(
      page.getByText('Número de aprovações insuficiente para gerar percentual de consenso'),
    ).toBeVisible();

    // Confirmação cruzada: a conta autenticada não tem NENHUMA tarefa de consenso pendente —
    // se ela fosse uma das aprovadoras nominais desta SC, o painel "Tarefas em consenso" da
    // Central de Tarefas listaria pelo menos uma.
    await page.goto('/portal/p/1/pagecentraltask', { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Central de tarefas' }).waitFor({ state: 'visible' });
    await page.getByRole('tab', { name: 'Resumo de Tarefas' }).click();
    const painelConsenso = page.locator('.panel-task-chart-agreement');
    await expect(painelConsenso.getByRole('heading', { name: /Tarefas em consenso/ })).toBeVisible();
    await expect(painelConsenso.getByText('Você não possui tarefas em consenso')).toBeVisible();
  });

  /**
   * FSWTBC-622 e FSWTBC-4821 — a grade do gestor orçamentário e o total que ele aprova.
   *
   * Até aqui a suíte chegava na Validação Orçamentária e afirmava só a AUSÊNCIA de "Assumir
   * tarefa". O painel que o gestor orçamentário usa para decidir nunca era aberto — e é dele
   * que tratam 13 chamados.
   *
   * Medido em 08/09/2026: o formulário é legível em modo consulta mesmo sem a tarefa ser da
   * conta, então a grade `tbItemOrcamentario` é observável sem credencial de aprovador.
   *
   * A assertion central é de **coerência interna**: o *Total Estimado a Aprovar (R$)* tem de
   * bater com a soma dos itens lida da PRÓPRIA tela. Fixar o valor numa constante seria inútil
   * — cada SC tem o seu — e é exatamente o que o `CLAUDE.md` proíbe para contrato.
   *
   * Regra de negócio (`cassi-fluig-master`): o Fluig não é dono de regra financeira — cálculo e
   * arredondamento são do Protheus. Divergência aqui é sintoma de integração, e é isso que o
   * FSWTBC-4821 relata ("valor estimado incorreto na exibição").
   */
  test('@destrutivo FSWTBC-622 FSWTBC-4821 — a grade do item orçamentário identifica o aprovador e o Total Estimado a Aprovar soma os itens com máscara pt-BR', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const { numeroProcesso } = await criarSolicitacaoCompraClassica(page, {
      justificativa: `QA FSWTBC-622 painel orcamentario ${Date.now()}`,
    });
    await aprovarValidacaoDoGestor(
      page,
      numeroProcesso,
      'QA aprovando Validação do Gestor — FSWTBC-622',
    );
    await aguardarAtividadeAtual(page, numeroProcesso, ['Validação Orçamentária'], {
      timeout: 90_000,
    });

    const central = new CentralTarefasComprasPage(page);
    await central.abrirDetalheDaSolicitacao(numeroProcesso);
    const formulario = await central.abrirFormularioDaSolicitacao();
    const painel = await central.lerPainelOrcamentario(formulario);

    test.info().annotations.push({
      type: 'painel-orcamentario',
      description: `SC ${numeroProcesso}: ${painel.aprovadores.length} aprovador(es), ${painel.itens.length} item(ns) — ${JSON.stringify(painel.aprovadores.map((a) => ({ resp: a.responsavel, total: a.total })))}`,
    });

    // FSWTBC-622: "os itens da solicitação são carregados e listados na grade". Sem linha, o
    // gestor decide sem ver o que aprova — que é o defeito relatado.
    expect(
      painel.aprovadores.length,
      'a grade Validação do Item Orçamentário não trouxe nenhuma linha de aprovador — o gestor ' +
        'orçamentário abriria a etapa sem ver o que está aprovando',
    ).toBeGreaterThan(0);

    for (const aprovador of painel.aprovadores) {
      expect(aprovador.responsavel, 'linha da grade sem responsável identificado').not.toBe('');
      expect(
        aprovador.email,
        `responsável "${aprovador.responsavel}" sem e-mail — a notificação da alçada não chega`,
      ).toMatch(/^\S+@\S+\.\S+$/);
      // FSWTBC-4821: máscara brasileira, não o número cru do ERP.
      expect(
        aprovador.total,
        `Total Estimado a Aprovar veio "${aprovador.total}" — esperado no formato 1.234,56`,
      ).toMatch(/^\d{1,3}(\.\d{3})*,\d{2}$/);
    }

    // Coerência: a soma dos itens da SC tem de bater com o total que o aprovador vê.
    // Quando há um único aprovador, ele responde por todos os itens.
    const paraNumero = (/** @type {string} */ v) => Number(v.replace(/\./g, '').replace(',', '.'));
    const somaDosItens = painel.itens.reduce((acc, v) => acc + paraNumero(v), 0);

    if (painel.aprovadores.length === 1) {
      expect(
        paraNumero(painel.aprovadores[0].total),
        `o Total Estimado a Aprovar (${painel.aprovadores[0].total}) diverge da soma dos ` +
          `${painel.itens.length} itens da SC (${somaDosItens.toFixed(2)}). O cálculo é do ` +
          `Protheus — divergência aqui é sintoma de integração, não de tela`,
      ).toBeCloseTo(somaDosItens, 2);
    } else {
      // Vários aprovadores: cada um responde por parte, e a soma das partes é o todo.
      const somaDosAprovadores = painel.aprovadores.reduce(
        (acc, a) => acc + paraNumero(a.total),
        0,
      );
      expect(
        somaDosAprovadores,
        `a soma dos totais por aprovador (${somaDosAprovadores.toFixed(2)}) diverge da soma dos ` +
          `itens da SC (${somaDosItens.toFixed(2)}) — item sem aprovador, ou item contado duas vezes`,
      ).toBeCloseTo(somaDosItens, 2);
    }
  });

  /**
   * FSWTBC-3489 e FSWTBC-2737 — os campos que a etapa precisa ter para ser auditável.
   *
   * O 3489 relata que a **data da validação não era salva** (perda de trilha de auditoria) e
   * que os itens não eram listados. O 2737 relata que **não aparecia o campo para o gestor
   * orçamentário registrar o parecer**. Os dois foram corrigidos; este teste é a regressão.
   *
   * O que se afirma aqui é a EXISTÊNCIA dos campos na etapa, não o preenchimento: a SC recém
   * chegada ainda não foi decidida, então data, hora e justificativa vazias são o estado
   * correto. Afirmar preenchimento seria transformar um teste de regressão em falso vermelho.
   */
  test('@destrutivo FSWTBC-3489 FSWTBC-2737 — a etapa orçamentária expõe trilha de auditoria (data/hora) e campo de parecer do gestor', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const { numeroProcesso } = await criarSolicitacaoCompraClassica(page, {
      justificativa: `QA FSWTBC-3489 trilha orcamentaria ${Date.now()}`,
    });
    await aprovarValidacaoDoGestor(
      page,
      numeroProcesso,
      'QA aprovando Validação do Gestor — FSWTBC-3489',
    );
    await aguardarAtividadeAtual(page, numeroProcesso, ['Validação Orçamentária'], {
      timeout: 90_000,
    });

    const central = new CentralTarefasComprasPage(page);
    await central.abrirDetalheDaSolicitacao(numeroProcesso);
    const formulario = await central.abrirFormularioDaSolicitacao();
    const painel = await central.lerPainelOrcamentario(formulario);

    expect(
      painel.temCamposDeTrilha,
      'a etapa não expõe Data e Hora da Validação — sem eles a aprovação orçamentária fica sem ' +
        'trilha de auditoria, que é o defeito do FSWTBC-3489',
    ).toBe(true);

    expect(
      painel.temCampoJustificativa,
      'a etapa não expõe o campo de parecer do gestor orçamentário (FSWTBC-2737) — o aprovador ' +
        'decide sem poder registrar o porquê',
    ).toBe(true);

    // Estado correto para uma SC que acabou de chegar: ainda não decidida.
    for (const aprovador of painel.aprovadores) {
      expect(
        aprovador.dataValidacao,
        `a SC acabou de chegar à etapa e já traz data de validação ("${aprovador.dataValidacao}") ` +
          `— trilha de auditoria com data anterior à decisão não é rastro, é ruído`,
      ).toBe('');
    }
  });

  test('@destrutivo CT-E2E-04-H — o histórico da SC permanece integralmente rastreável até o ponto em que a alçada bloqueia a conta autenticada', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const { numeroProcesso } = await criarSolicitacaoCompraClassica(page, {
      justificativa: `QA CT-E2E-04-H rastreabilidade alcada ${Date.now()}`,
    });

    await aprovarValidacaoDoGestor(page, numeroProcesso, `QA aprovando Validação do Gestor — CT-E2E-04-H ${Date.now()}`);
    await aguardarAtividadeAtual(page, numeroProcesso, ['Validação Orçamentária'], { timeout: 90_000 });

    // A cadeia inteira do BPMN, do Início até o ponto de bloqueio, continua no Histórico —
    // rastreabilidade não é vítima do bloqueio de alçada.
    const central = new CentralTarefasComprasPage(page);
    await central.abrirDetalheDaSolicitacao(numeroProcesso);

    const historico = page.locator('body');
    await expect(historico.getByText(`iniciou a solicitação ${numeroProcesso}`).first()).toBeVisible();
    await expect(historico.getByText('Compra Centralizada?').first()).toBeVisible();
    await expect(historico.getByText('Grava SC e Anexos').first()).toBeVisible();
    // Confirmado em campo: o texto da justificativa preenchida em `decidirEEnviar` não é
    // ecoado literalmente no feed do Histórico (só o comentário automático do sistema é). A
    // prova causal que FICA observável é quem assumiu e movimentou a etapa — a própria conta
    // desta automação, "Usuário TBC (TOTVS)" — não uma coincidência de outro processo.
    await expect(historico.getByText('assumiu a tarefa Validação do Gestor').first()).toBeVisible();
    await expect(
      historico.getByText('Usuário TBC (TOTVS) movimentou a atividade Validação do Gestor').first(),
    ).toBeVisible();
    await expect(historico.getByText('Distribuição Gestor Orçamentario').first()).toBeVisible();
    await expect(page.getByText('Atividade atual: Validação Orçamentária').first()).toBeVisible();
  });
});
