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
