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

  test('a Validação Inicial abre sem exigir delegação e renderiza a grade', async ({
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

    // ⚠️ A afirmação "lista solicitações reais" saiu daqui.
    //
    // Ela dependia de já existir SC atribuída ao comprador — massa que este teste não cria.
    // Outro teste podia encerrá-la, e o `globalTeardown` da própria suíte cancela
    // solicitações, então a suíte era capaz de destruir a pré-condição de um teste dela
    // mesma. A norma da skill é "cada teste monta seus próprios pré-requisitos".
    //
    // Quem faz essa afirmação com massa própria é o teste `@destrutivo` desta mesma suíte,
    // que cria a SC, aprova a Validação do Gestor e a localiza aqui pelo número. A cobertura
    // não se perde — muda de dono, e passa a ser independente.
    //
    // O que resta aqui é o que o teste de fato mede sem depender de ninguém: a sub-tela abre,
    // responde pela URL certa e não exige delegação.
    await expect(portalComprador.getTabelaAtiva()).toBeVisible();

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
