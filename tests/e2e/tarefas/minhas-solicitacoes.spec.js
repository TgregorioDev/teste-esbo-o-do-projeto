// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { CentralTarefasPage } from '../../../pages/CentralTarefasPage.js';
import { MinhasSolicitacoesPage } from '../../../pages/MinhasSolicitacoesPage.js';
import { criarSolicitacaoCompraClassica } from '../../../pages/CicloCompradorPage.js';

/**
 * Central de Tarefas — Minhas Solicitações (CT-TSK-03-H e CT-TSK-04-H).
 *
 * ⚠️ Nota antiga, revogada: este cabeçalho dizia que assumir tarefa do pool e o cenário de
 * concorrência "alteram estado do workflow do cliente e não estão implementados". As duas
 * metades ficaram falsas. A premissa caiu com a decisão do dono do ambiente em 25/08/2026
 * (`docs/politica-de-escrita.md`: escrever é o propósito da base de homologação), e o caso
 * CT-TSK-02 cenário H **está implementado** em `tests/e2e/tarefas/assumir-tarefa-pool.spec.js`,
 * agora com procedência QA verificada antes de assumir e devolução ao pool no teardown.
 * O cenário S1 (concorrência) segue sem teste, com o motivo declarado em
 * `scripts/gerar-cobertura.mjs` — não por política, mas porque só existe uma conta de
 * automação e dois contextos são a mesma identidade para o servidor.
 */

test.describe('Minhas Solicitações — sinalização de atraso (CT-TSK-03-H)', () => {
  test('deve sinalizar visualmente a solicitação atrasada', async ({ page }) => {
    // Massa confirmada em campo no momento da implementação: há pelo menos uma
    // solicitação "Atrasada" em "Minhas solicitações". Se a massa mudar e não houver mais
    // nenhuma atrasada, este teste falha de propósito — não deve virar assertion condicional.
    const tarefasPage = new CentralTarefasPage(page);
    await tarefasPage.goto();
    await tarefasPage.expectCarregada();
    await tarefasPage.abrirMinhasSolicitacoes();

    await expect(tarefasPage.cartoesAtrasados.first()).toBeVisible();
    await expect(tarefasPage.cartoesAtrasados.first()).toContainText(/Atrasada há/);
  });
});

test.describe('Minhas Solicitações — filtro por status (CT-TSK-04-H)', () => {
  /**
   * ⚠️ Este teste passou a criar a PRÓPRIA SC.
   *
   * A versão anterior lia a listagem e exigia `idsAbertas.length > 0` — ou seja, dependia de
   * já existir alguma solicitação aberta na conta. Isso viola "cada teste monta seus próprios
   * pré-requisitos" (skill `playwright-test-creator`) por duas razões concretas, não teóricas:
   *
   * 1. Outro teste pode encerrar ou cancelar essa massa entre a leitura e a asserção.
   * 2. O `globalTeardown` da PRÓPRIA suíte cancela as solicitações que a execução criou —
   *    então a suíte é capaz de destruir a pré-condição de um teste dela mesma.
   *
   * E o oráculo antigo era fraco de todo jeito: comparava apenas se os dois conjuntos eram
   * DIFERENTES. Com o filtro "Finalizadas" quebrado devolvendo zero, `[]` continua diferente
   * de `[ids...]` e o teste passava.
   *
   * Agora o oráculo é a própria SC: ela nasce ABERTA, então tem de aparecer sob "Abertas" e
   * NÃO aparecer sob "Finalizadas". Isso prova o filtro com um dado cujo estado o teste
   * conhece, em vez de comparar dois conjuntos anônimos.
   *
   * A busca usa `MinhasSolicitacoesPage.localizarPorProcessInstanceId`, que pagina em ordem
   * decrescente — a listagem traz `rows=15` em ordem CRESCENTE, e a SC recém-criada tem o
   * maior id, logo nunca estaria no primeiro lote.
   */
  test('@destrutivo a SC própria deve aparecer sob "Abertas" e sumir sob "Finalizadas"', async ({
    page,
  }, testInfo) => {
    test.setTimeout(300_000);

    const { numeroProcesso } = await criarSolicitacaoCompraClassica(page, {
      justificativa: `QA CT-TSK-04-H filtro de status ${Date.now()}`,
    });
    testInfo.annotations.push({ type: 'sc-criada', description: String(numeroProcesso) });

    const minhas = new MinhasSolicitacoesPage(page);

    // Sob "Abertas" (padrão da tela): a SC recém-criada TEM de estar lá. Poll porque a
    // listagem leva alguns segundos para indexar — condição observável, nunca tempo fixo.
    await expect
      .poll(async () => (await minhas.localizarPorProcessInstanceId(numeroProcesso)) !== null, {
        message:
          `a SC ${numeroProcesso}, criada por este teste e portanto ABERTA, deveria aparecer ` +
          'na listagem "Minhas solicitações" com o filtro de status em "Abertas"',
        timeout: 90_000,
        intervals: [5_000, 10_000],
      })
      .toBe(true);

    // Sob "Finalizadas": a MESMA SC não pode aparecer — ela está aberta.
    //
    // ⚠️ A seleção do filtro é feita explicitamente, sem herdar estado: a Central guarda a
    // sub-aba e o filtro por SESSÃO no servidor (`setAttribute centralTaskType`), então
    // confiar no que a tela trouxe da execução anterior é receita de falso resultado.
    const tarefasPage = new CentralTarefasPage(page);
    await tarefasPage.goto();
    await tarefasPage.expectCarregada();
    await tarefasPage.abrirMinhasSolicitacoes();
    await tarefasPage.filtrarSolicitacoesPorStatus('Finalizadas');

    await expect(async () => {
      const ids = await tarefasPage.lerIdentificadoresSolicitacoes();
      expect(
        ids,
        `a SC ${numeroProcesso} está ABERTA (foi criada por este teste agora) e não pode ` +
          'aparecer sob o filtro "Finalizadas" — se aparece, o filtro de status não filtra',
      ).not.toContain(String(numeroProcesso));
    }).toPass({ timeout: 15_000 });
  });
});
