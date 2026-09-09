// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../../utils/pre-condicao.js';
import { CentralTarefasPage } from '../../../pages/CentralTarefasPage.js';

/**
 * Central de Tarefas — Minhas Solicitações (CT-TSK-03-H e CT-TSK-04-H).
 *
 * ⚠️ CT-TSK-02-H (assumir tarefa do pool) e CT-TSK-02-S1 (concorrência) alteram estado do
 * workflow do cliente e não estão implementados (ver README/relatório).
 */

test.describe('Minhas Solicitações — sinalização de atraso (CT-TSK-03-H)', () => {
  test('deve sinalizar visualmente a solicitação atrasada', async ({ page }) => {
    // A nota original dizia: se não houver mais nenhuma atrasada, o teste falha de propósito,
    // e NÃO deve virar assertion condicional. A regra continua valendo, e não é o que se faz
    // abaixo — `faltaPreCondicao` não é um `if` em volta do `expect`: ele interrompe o teste,
    // anota `pre-condicao-ausente` e aparece no relatório como AMBIENTE, que é o que "a conta
    // não tem solicitação atrasada agora" de fato é. O que a nota proíbe — passar em silêncio —
    // continua proibido.
    //
    // No ambiente `caixade213859` a lista oscila entre alguns cartões e nenhum, e nenhum deles
    // esteve atrasado nas medições de 09/09/2026.
    const tarefasPage = new CentralTarefasPage(page);
    await tarefasPage.goto();
    await tarefasPage.expectCarregada();
    await tarefasPage.abrirMinhasSolicitacoes();
    await tarefasPage.expectComSolicitacoes();

    const totalDeCartoes = await tarefasPage.cartoesDeSolicitacao.count();
    if ((await tarefasPage.cartoesAtrasados.count()) === 0) {
      faltaPreCondicao(
        `(ambiente): "Minhas solicitações" tem ${totalDeCartoes} cartão(ões), mas nenhum ` +
          'marcado como atrasado — sem solicitação em atraso não há sinalização a conferir.',
      );
    }

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
    await tarefasPage.expectComSolicitacoes();

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
