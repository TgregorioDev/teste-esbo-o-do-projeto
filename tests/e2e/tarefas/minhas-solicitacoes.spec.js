// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { CentralTarefasPage } from '../../../pages/CentralTarefasPage.js';

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
  test('a lista deve responder à troca do filtro de Status', async ({ page }) => {
    const tarefasPage = new CentralTarefasPage(page);
    await tarefasPage.goto();
    await tarefasPage.expectCarregada();
    await tarefasPage.abrirMinhasSolicitacoes();

    const idsAbertas = await tarefasPage.lerIdentificadoresSolicitacoes();
    expect(
      idsAbertas.length,
      'a listagem inicial de "Minhas solicitações" (status Abertas) não trouxe nenhum item para comparar',
    ).toBeGreaterThan(0);

    await tarefasPage.filtrarSolicitacoesPorStatus('Finalizadas');

    // O endpoint já respondeu (aguardado dentro de filtrarSolicitacoesPorStatus); resta a
    // UI aplicar o novo conjunto de cartões — condição observável, não tempo fixo.
    await expect(async () => {
      const idsFinalizadas = await tarefasPage.lerIdentificadoresSolicitacoes();
      expect(idsFinalizadas).not.toEqual(idsAbertas);
    }).toPass({ timeout: 15_000 });
  });
});
