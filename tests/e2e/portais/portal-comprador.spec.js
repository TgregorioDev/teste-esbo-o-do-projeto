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

    // `> 1`, não `> 0`: a grade vazia renderiza uma `tbody tr` com o placeholder "Nenhum dado
    // encontrado", então `> 0` era satisfeito por uma fila VAZIA — falso verde medido em
    // 28/08/2026 (a fila tinha exatamente 1 linha, e era o placeholder), enquanto o título
    // prometia "solicitações reais". Mesmo critério de `CicloCompradorPage.possuiDados()`.
    const linhas = portalComprador.getTabelaAtiva().locator('tbody tr');
    await expect(linhas.first()).toBeVisible();

    if ((await linhas.count()) <= 1) {
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE: a Validação Inicial não lista nenhuma solicitação para a conta ' +
          'autenticada no momento da execução (só a linha de placeholder). A sub-tela mostra as ' +
          'SCs do COMPRADOR DESIGNADO, e a designação vem da SY1 do Protheus — sem SC atribuída ' +
          'a esta conta não há o que listar. Isto NÃO é defeito do produto sob teste.',
      );
    }

    expect(guarda.tentativas()).toBe(0);
  });

  /**
   * ⚠️ Título corrigido. Ele dizia *"deve exigir delegação em 'Atuar como' para listar
   * Controle de Cotações"* — uma regra CAUSAL que este teste nunca exerceu: ele não troca a
   * delegação em momento nenhum, então não podia comparar "com" contra "sem". O que ele fazia
   * era afirmar `getByText('Nenhum dado encontrado')).toBeVisible()`, ou seja, registrar a
   * fila vazia como resultado esperado — e ficar verde.
   *
   * A metade que faltava existe em `tests/e2e/portais/ciclo-comprador.spec.js`, que troca a
   * delegação de verdade e trata a fila vazia como PRÉ-CONDIÇÃO AUSENTE. Aqui fica só o que
   * é medido e positivo: a sub-tela expõe o seletor de delegação com opções além da própria
   * conta.
   */
  test('o Controle de Cotações expõe o seletor "Atuar como" com opções além da própria conta', async ({
    page,
  }) => {
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

    expect(guarda.tentativas()).toBe(0);
  });
});
