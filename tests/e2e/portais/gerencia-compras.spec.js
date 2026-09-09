// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { GerenciaComprasPage } from '../../../pages/GerenciaComprasPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * Gerência de Compras — caso CT-E2E-05-H (parcial, somente leitura).
 *
 * Cobre: as abas Atribuir/Transferir estão disponíveis e listam SCs. NÃO cobre: atribuir um
 * comprador a uma SC — é escrita real e não tem exclusão disponível no ambiente do cliente.
 * Nenhum teste clica em "Transferir", "Transferir em Lote" nem preenche "Selecione um
 * comprador"; `bloquearCriacaoDeSolicitacao` fica de guarda contra qualquer clique acidental
 * que caia em `process-management`.
 */
test.describe('Gerência de Compras', () => {
  test('deve oferecer as abas Atribuir e Transferir ao carregar', async ({ page }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const gerenciaCompras = new GerenciaComprasPage(page);

    await gerenciaCompras.goto();
    await gerenciaCompras.expectCarregada();

    await expect(page).toHaveTitle('Cassi - Fluig Plataforma - Gerencia Compras');
    await expect(gerenciaCompras.titulo).toBeVisible();
    await expect(gerenciaCompras.abaAtribuir).toBeVisible();
    await expect(gerenciaCompras.abaTransferir).toBeVisible();

    expect(guarda.tentativas()).toBe(0);
  });

  /**
   * ## A tag `@bug` saiu daqui em 09/09/2026 — e o motivo é o ciclo previsto, não conveniência
   *
   * No ambiente anterior (`caixade182374`) esta aba nunca renderizou dados: ficava presa em
   * "Nenhum dado encontrado" mesmo com o dataset já respondido, e o teste era `@bug` escrito
   * contra o comportamento esperado.
   *
   * No `caixade213859` o defeito **não reproduz**: a aba lista 17 SCs reais, cada uma com o
   * combo "Selecione um comprador". Medido três vezes seguidas, resultado idêntico.
   *
   * `@bug` verde é o sinal de que o defeito acabou — e a resposta prevista pelo CLAUDE.md é
   * tirar a tag, não deixá-la mentindo. O que a assertion cobra continua o mesmo; o que mudou é
   * que agora o produto entrega.
   *
   * ⚠️ Detalhe que custou uma investigação: **as tabelas só renderizam depois de a aba ser
   * ativada**. Esperar por `table:visible` antes do clique dá "sem tabela em 90s" e leva a
   * concluir, errado, que a página está quebrada.
   */
  test('deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const gerenciaCompras = new GerenciaComprasPage(page);

    await gerenciaCompras.goto();
    await gerenciaCompras.expectCarregada();
    await gerenciaCompras.abrirAbaAtribuir();

    // A tabela precisa existir antes de qualquer leitura — sem isso, um locator vazio faria a
    // assertion passar por vacuidade. E quando ela não vem, o motivo é ambiente, não defeito:
    // `expectGradeDisponivel` separa os dois em vez de deixar o `@bug` oscilar com a maré.
    await gerenciaCompras.expectGradeDisponivel('Atribuir');

    // Linha 1 é sempre o estado "Nenhum dado encontrado"; dado real exige mais de uma linha.
    await expect
      .poll(() => gerenciaCompras.getLinhasDaTabelaAtiva().count(), {
        message: 'aba Atribuir deveria listar as SCs pendentes de atribuição',
        timeout: 30_000,
      })
      .toBeGreaterThan(1);

    expect(guarda.tentativas()).toBe(0);
  });

  test('deve listar as solicitações pendentes de transferência ao abrir a aba Transferir', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const gerenciaCompras = new GerenciaComprasPage(page);

    await gerenciaCompras.goto();
    await gerenciaCompras.expectCarregada();
    await gerenciaCompras.abrirAbaTransferir();

    await gerenciaCompras.expectGradeDisponivel('Transferir');

    // Confirmado em campo: esta aba carrega, mas devagar (~20-25s) — o dataset que a
    // alimenta é o mais lento dos dois que a página dispara. Timeout maior que o default do
    // projeto (30s) por margem, documentado aqui e não escondido: não é flakiness, é a
    // latência real medida no ambiente. Linha 1 é sempre o estado "Nenhum dado encontrado";
    // dado real exige mais de uma linha.
    await expect
      .poll(() => gerenciaCompras.getLinhasDaTabelaAtiva().count(), { timeout: 45_000 })
      .toBeGreaterThan(1);

    await expect(gerenciaCompras.getLinhasDaTabelaAtiva().first()).toBeVisible();

    // O ponto do caso: leitura, não escrita — nenhuma transferência foi disparada.
    expect(guarda.tentativas()).toBe(0);
  });

  /**
   * FSWTBC-4537 — as colunas da Gerência de Compras, nas duas abas.
   *
   * A causa registrada pelo cliente no incidente SD810592 não foi lógica de negócio: foi
   * *"divergência entre o código-fonte e a versão atualmente aplicada no ambiente"* — sexta
   * ocorrência de widget desatualizada nesta base. Uma widget de outra versão muda o conjunto
   * de colunas, e é por isso que o conjunto é o oráculo aqui: ele detecta a troca de versão
   * ainda que a grade continue listando alguma coisa.
   *
   * Que a aba Atribuir venha vazia e a Transferir venha cheia é assunto dos dois testes acima —
   * este afirma sobre a estrutura, que existe nas duas independentemente de haver linha.
   *
   * Leitura pura: nenhum comprador é selecionado, nenhuma transferência é disparada.
   */
  test('FSWTBC-4537 — as duas abas expõem as colunas de distribuição da SC', async ({ page }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const gerenciaCompras = new GerenciaComprasPage(page);

    const COLUNAS = ['Processo', 'Filial', 'Comprador', 'Solicitante', 'Num SC', 'Grupos de Produto'];

    await gerenciaCompras.goto();
    await gerenciaCompras.expectCarregada();

    // A sub-aba é herdada da sessão no servidor (particularidade registrada em CLAUDE.md), por
    // isso cada aba é clicada explicitamente em vez de se confiar no estado inicial.
    await gerenciaCompras.abrirAbaAtribuir();
    await expect(gerenciaCompras.getTabelaAtiva()).toBeVisible();
    expect(
      (await gerenciaCompras.getTabelaAtiva().locator('thead th').allInnerTexts())
        .map((c) => c.trim())
        .filter(Boolean),
      'colunas da aba Atribuir',
    ).toEqual(COLUNAS);

    await gerenciaCompras.abrirAbaTransferir();
    await expect(gerenciaCompras.getTabelaAtiva()).toBeVisible();
    expect(
      (await gerenciaCompras.getTabelaAtiva().locator('thead th').allInnerTexts())
        .map((c) => c.trim())
        .filter(Boolean),
      'colunas da aba Transferir',
    ).toEqual(COLUNAS);

    expect(guarda.tentativas()).toBe(0);
  });
});
