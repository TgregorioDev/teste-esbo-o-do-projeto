// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { CentralTarefasPage } from '../../../pages/CentralTarefasPage.js';

/**
 * Central de Tarefas — Resumo de Tarefas (CT-TSK-01-H).
 *
 * O contador muda com o tempo (a massa é o ambiente real do cliente), então nenhuma
 * assertion aqui fixa um valor literal. A validação é estrutural: o total anunciado no
 * heading de cada painel precisa bater com a soma dos itens que o compõem.
 */

test.describe('Resumo de Tarefas — coerência dos contadores (CT-TSK-01-H)', () => {
  test('"Tarefas a concluir": total do painel deve bater com a soma de No prazo + Próx. a vencer + Atrasadas', async ({
    page,
  }) => {
    const tarefasPage = new CentralTarefasPage(page);
    await tarefasPage.goto();
    await tarefasPage.expectCarregada();

    const { total, soma } = await tarefasPage.resumoTarefasAConcluir();
    expect(
      soma,
      `soma dos itens (No prazo + Próx. a vencer + Atrasadas) = ${soma}, mas o painel anuncia (${total})`,
    ).toBe(total);
  });

  test('"Tarefas em pool": total do painel deve bater com a soma de No prazo + Próximas a vencer + Atrasadas', async ({
    page,
  }) => {
    const tarefasPage = new CentralTarefasPage(page);
    await tarefasPage.goto();
    await tarefasPage.expectCarregada();

    const { total, soma } = await tarefasPage.resumoTarefasEmPool();
    expect(
      soma,
      `soma dos itens da lista horizontal = ${soma}, mas o painel anuncia (${total})`,
    ).toBe(total);
  });

  test('"Documentos": total do painel deve bater com a soma dos quatro contadores', async ({
    page,
  }) => {
    const tarefasPage = new CentralTarefasPage(page);
    await tarefasPage.goto();
    await tarefasPage.expectCarregada();

    const { total, soma } = await tarefasPage.resumoDocumentos();
    expect(
      soma,
      `soma de Para aprovar + Meus documentos + Documentos em consenso + Documentos em checkout = ${soma}, mas o painel anuncia (${total})`,
    ).toBe(total);
  });

  test('"Solicitações": total do painel deve bater com a soma de Solicitadas por mim + Sob minha gerência', async ({
    page,
  }) => {
    const tarefasPage = new CentralTarefasPage(page);
    await tarefasPage.goto();
    await tarefasPage.expectCarregada();

    const { total, soma } = await tarefasPage.resumoSolicitacoes();
    expect(
      soma,
      `soma de Solicitadas por mim + Sob minha gerência = ${soma}, mas o painel anuncia (${total})`,
    ).toBe(total);
  });

  test('"Tarefas em consenso": a mensagem de lista vazia aparece exatamente quando o total é zero', async ({
    page,
  }) => {
    const tarefasPage = new CentralTarefasPage(page);
    await tarefasPage.goto();
    await tarefasPage.expectCarregada();

    const { total } = await tarefasPage.resumoConsenso();
    const mensagemVazioVisivel = await tarefasPage.avisoSemConsenso.isVisible();

    expect(
      mensagemVazioVisivel,
      `painel anuncia total (${total}), mas a mensagem de "sem tarefas em consenso" ${
        mensagemVazioVisivel ? 'está visível' : 'não está visível'
      } — os dois precisam ser coerentes (total zero ⇔ mensagem visível)`,
    ).toBe(total === 0);
  });
});
