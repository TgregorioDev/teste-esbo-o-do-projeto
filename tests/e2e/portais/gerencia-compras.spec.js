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

  test('deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir @bug', async ({
    page,
  }) => {
    // Defeito confirmado em campo: ver docstring de GerenciaComprasPage. A tabela da aba
    // Atribuir nunca renderizou dados nos testes de campo (múltiplas cargas, ~30s de
    // observação, inclusive com um segundo clique na aba) — fica presa em "Nenhum dado
    // encontrado" mesmo depois de o dataset que a alimenta já ter respondido. A assertion
    // abaixo é escrita contra o comportamento ESPERADO (a tabela deveria listar as SCs
    // pendentes de atribuição); o produto hoje não entrega isso, e o teste deve reprovar.
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const gerenciaCompras = new GerenciaComprasPage(page);

    await gerenciaCompras.goto();
    await gerenciaCompras.expectCarregada();
    await gerenciaCompras.abrirAbaAtribuir();

    // A tabela do painel precisa existir e estar visível antes de qualquer leitura de
    // conteúdo — sem isso, um locator vazio (0 elementos) faria `toBeHidden()` passar por
    // vacuidade, mascarando o defeito em vez de expô-lo.
    await expect(gerenciaCompras.getTabelaAtiva()).toBeVisible();

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

    await expect(gerenciaCompras.getTabelaAtiva()).toBeVisible();

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
});
