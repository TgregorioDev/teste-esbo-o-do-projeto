// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { PortalCompradorPage } from '../../../pages/PortalCompradorPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * Portal do Comprador — caso CT-E2E-06-H (parcial, somente leitura).
 *
 * Cobre: as quatro etapas do ciclo (Validação Inicial, Controle De Cotações, Avaliação de
 * Propostas, Definir Vencedor Cotação) são oferecidas e abrem a fila correspondente. NÃO
 * cobre nenhuma ação de linha (validar, avaliar proposta, definir vencedor) — é escrita.
 * `bloquearCriacaoDeSolicitacao` fica de guarda contra clique acidental em process-management.
 */
test.describe('Portal do Comprador', () => {
  test('deve oferecer as quatro etapas do ciclo de compras no Acesso Rápido', async ({ page }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const portalComprador = new PortalCompradorPage(page);

    await portalComprador.goto();
    await portalComprador.expectCarregada();

    await expect(page).toHaveTitle('Cassi - Fluig Plataforma - Portal do Comprador');
    await expect(portalComprador.titulo).toBeVisible();

    /** @type {Array<'Validação Inicial' | 'Controle De Cotações' | 'Avaliação de Propostas' | 'Definir Vencedor Cotação'>} */
    const etapas = [
      'Validação Inicial',
      'Controle De Cotações',
      'Avaliação de Propostas',
      'Definir Vencedor Cotação',
    ];
    for (const etapa of etapas) {
      await expect(portalComprador.getTile(etapa)).toBeVisible();
    }

    expect(guarda.tentativas()).toBe(0);
  });

  test('deve listar as solicitações reais em Validação Inicial, sem exigir delegação', async ({
    page,
  }) => {
    // Confirmado em campo (3 execuções limpas): esta sub-tela NÃO tem o seletor "Atuar
    // como" e mostra as SCs do próprio usuário autenticado diretamente.
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const portalComprador = new PortalCompradorPage(page);

    await portalComprador.goto();
    await portalComprador.expectCarregada();
    await portalComprador.abrirEtapa('Validação Inicial');

    await expect(page).toHaveURL(/validacaoInicial/);
    await expect(portalComprador.comboAtuarComo).toHaveCount(0);

    const linhas = portalComprador.getTabelaAtiva().locator('tbody tr');
    await expect(linhas.first()).toBeVisible();
    expect(await linhas.count()).toBeGreaterThan(0);

    expect(guarda.tentativas()).toBe(0);
  });

  test('deve exigir delegação em "Atuar como" para listar Controle de Cotações', async ({
    page,
  }) => {
    // Confirmado em campo: esta sub-tela expõe o seletor "Atuar como:", default no próprio
    // usuário autenticado (sem delegação). Nesse estado a fila vem vazia — comportamento
    // consistente com "opera por delegação" do contexto da task. A suíte NÃO troca a
    // delegação: isso significaria assumir a fila de outro colaborador real, fora do escopo
    // de leitura desta automação.
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const portalComprador = new PortalCompradorPage(page);

    await portalComprador.goto();
    await portalComprador.expectCarregada();
    await portalComprador.abrirEtapa('Validação Inicial');
    await expect(page).toHaveURL(/validacaoInicial/);

    await portalComprador.irParaEtapa('Controle de Cotações');
    await expect(page).toHaveURL(/controleCotacao/);

    await expect(portalComprador.comboAtuarComo).toBeVisible();
    const opcoes = await portalComprador.comboAtuarComo.locator('option').allInnerTexts();
    expect(opcoes.length).toBeGreaterThan(1);

    // Confirmado em campo: nesta sub-tela a mensagem de grade vazia é texto solto da
    // página (não uma linha de <table>) — por isso a leitura aqui não passa por
    // getTabelaAtiva().
    await expect(page.getByText('Nenhum dado encontrado')).toBeVisible();

    expect(guarda.tentativas()).toBe(0);
  });
});
