// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { PortalCompradorPage } from '../../../pages/PortalCompradorPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';
import { faltaPreCondicao } from '../../../utils/pre-condicao.js';

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

  /**
   * FSWTBC-4317 — as listas de seleção do portal vêm ordenadas.
   *
   * O ticket ("a lista não seguia nenhum padrão de ordenação, dificultando localizar e
   * selecionar o item") está **Concluído**, e não identifica a tela nem o campo. As listas de
   * seleção que o Portal do Comprador tem hoje são as quatro do painel *Buscar* da Validação
   * Inicial — é sobre elas que a expectativa do ticket é verificável.
   *
   * O oráculo é generoso de propósito: basta a lista estar ordenada por **alguma** de suas
   * colunas. Uma lista ordenada por código é navegável; a que não segue coluna nenhuma é a
   * situação que o chamado descreve.
   *
   * Medido em 09/09/2026 — Grupo de Produto e Centro de Custo ordenam por Código; Filial
   * (5301, 5302, 1101, 1201, 1301, 1401) e Produto (04000014, 00000212, 00000218) quebram a
   * ordem exatamente no fim da página, como se um segundo bloco fosse anexado sem reordenar.
   * Por isso o teste é `@bug`: reprova até o produto entregar o que o ticket diz ter entregue.
   */
  test('@bug FSWTBC-4317 — as listas de busca da Validação Inicial vêm ordenadas por alguma coluna', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const portalComprador = new PortalCompradorPage(page);

    await portalComprador.goto();
    await portalComprador.expectCarregada();
    await portalComprador.abrirEtapa('Validação Inicial');
    await expect(page).toHaveURL(/validacaoInicial/);

    await portalComprador.botaoBuscar.click();
    await expect(portalComprador.getLookup('Filial')).toBeAttached();

    /** @type {Array<'Filial' | 'Produto' | 'Grupo de Produto' | 'Centro de Custo'>} */
    const listas = ['Filial', 'Produto', 'Grupo de Produto', 'Centro de Custo'];
    /** @type {string[]} */
    const desordenadas = [];
    /** @type {string[]} */
    const semDado = [];

    for (const lista of listas) {
      const veioDado = await portalComprador.abrirLookup(lista);
      if (!veioDado) {
        semDado.push(lista);
        await portalComprador.fecharLookup();
        continue;
      }

      const { cabecalhos, linhas } = await portalComprador.lerGradeDoLookup();
      // Só a primeira página é julgada: a modal traz "Carregar mais resultados", e paginar o
      // ERP inteiro por quatro listas não cabe num teste — a desordem, quando existe, já
      // aparece aqui.
      const ordenadaPor = cabecalhos.filter((_, coluna) => {
        const valores = linhas.map((l) => l[coluna] ?? '');
        // Coluna vazia em todas as linhas é trivialmente "ordenada" e daria falso verde: a
        // lookup de Filial tem uma terceira coluna sem conteúdo, e foi ela que fez a primeira
        // versão deste teste absolver a lista mais desordenada das quatro.
        if (valores.every((v) => v === '')) return false;
        const emOrdem = [...valores].sort((a, b) => a.localeCompare(b, 'pt-BR'));
        return valores.join('|') === emOrdem.join('|');
      });

      test.info().annotations.push({
        type: `lookup-${lista}`,
        description:
          `${linhas.length} entradas; colunas ${cabecalhos.join('/')}; ordenada por: ` +
          `${ordenadaPor.join(', ') || 'NENHUMA'}`,
      });

      if (ordenadaPor.length === 0) {
        desordenadas.push(`${lista} (${linhas.map((l) => l[0]).join(', ')})`);
      }
      await portalComprador.fecharLookup();
    }

    if (semDado.length === listas.length) {
      faltaPreCondicao(
        `(ambiente): nenhuma das listas ${listas.join(', ')} devolveu dado do ERP — ` +
          'sem entradas não há ordenação a julgar.',
      );
    }

    expect(
      desordenadas,
      'lista de seleção do Portal do Comprador sem ordenação por nenhuma de suas colunas — ' +
        'localizar a entrada exige varredura visual item a item (FSWTBC-4317)',
    ).toEqual([]);

    expect(guarda.tentativas()).toBe(0);
  });

  /**
   * FSWTBC-3884, metade executável — a grade da Validação Inicial identifica a origem de cada
   * solicitação, e centralizar sem seleção é criticado em vez de prosseguir.
   *
   * O pedido do chamado (SC nascida de centralização trazer o número da SC original e a filial)
   * não é verificável de ponta a ponta com esta conta: concluir uma centralização é **escrita
   * sobre SCs de terceiros** — as 25 listadas são de outros solicitantes. O que é verificável
   * sem escrever: as colunas de identificação que sustentam a centralização (Nº Solic, Cod.
   * Filial, Filial, Nº Solic ERP) e a crítica que protege a ação contra seleção vazia.
   */
  test('FSWTBC-3884 — a Validação Inicial identifica origem e filial, e critica centralização sem seleção', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const portalComprador = new PortalCompradorPage(page);

    await portalComprador.goto();
    await portalComprador.expectCarregada();
    await portalComprador.abrirEtapa('Validação Inicial');
    await expect(page).toHaveURL(/validacaoInicial/);
    await expect(portalComprador.getTabelaAtiva().locator('tbody tr').first()).toBeVisible();

    const cabecalhos = await portalComprador.lerCabecalhosDaGrade();
    expect(cabecalhos).toEqual([
      'Nº Solic',
      'Solicitante',
      'Data Solicitação',
      'Cod. Filial',
      'Filial',
      'Data Emissão',
      'Nº Solic ERP',
      'Justificativa',
      'Etapa',
      'Status',
    ]);

    // Sem marcar nenhuma linha: a ação tem de criticar, e não abrir o formulário de
    // centralização. É o único ponto do fluxo de centralização exercitável sem escrever.
    await portalComprador.botaoCentralizar.click();
    await expect(portalComprador.dialogo).toContainText(
      'Não foi identificado nenhuma solicitação selecionada',
    );
    await expect(page).toHaveURL(/validacaoInicial/);

    expect(guarda.tentativas()).toBe(0);
  });
});
