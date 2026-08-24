// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { CentralTarefasPage } from '../../../pages/CentralTarefasPage.js';

/**
 * Central de Tarefas — Minhas Solicitações (CT-TSK-03-H e CT-TSK-04-H).
 *
 * ⚠️ CT-TSK-02-H (assumir tarefa do pool) e CT-TSK-02-S1 (concorrência) alteram estado do
 * workflow do cliente e não estão implementados (ver README/relatório).
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
