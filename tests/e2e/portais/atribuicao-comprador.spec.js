// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { AtribuicaoCompradorPage } from '../../../pages/AtribuicaoCompradorPage.js';
import { criarSolicitacaoCompraClassica, aprovarValidacaoDoGestor, aguardarAtividadeAtual } from '../../../pages/CicloCompradorPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * Gerência de Compras → aba Atribuir — CT-E2E-05-H (Gerência de Compras atribui a SC a um
 * comprador).
 *
 * A tarefa desta suíte era medir, não presumir, o que o mapa do ambiente registrava como
 * "a aba Atribuir nunca renderiza dados". As duas specs abaixo fazem exatamente essa medição,
 * com dois ângulos complementares:
 *
 * 1. **Sem criar massa** — comparar a aba Atribuir com a aba irmã Transferir (que usa o MESMO
 *    mecanismo de carga: duas chamadas a `ds_getSolicsGerenciaCompras`, uma por aba, disparadas
 *    juntas no carregamento da página). A Transferir renderiza 50+ linhas reais para esta conta;
 *    a Atribuir não renderiza nenhuma. Isso refina o diagnóstico: o pipeline
 *    requisição → resposta → renderização FUNCIONA (prova é a própria Transferir) — o que dá
 *    zero é a consulta `etapa=257` (Atribuir) filtrada pela matrícula da conta autenticada, não
 *    um clique que não dispara nada.
 *
 * 2. **Criando massa própria** — abrir uma SC nova pelo formulário clássico, aprovar a
 *    "Validação do Gestor" (a única etapa que esta conta consegue mover) e confirmar que a SC
 *    para exatamente em "Validação Orçamentária" — a alçada nominal (AL/DHL) que
 *    `docs/politica-de-escrita.md` já registrava como bloqueio, agora medido com massa própria e
 *    determinística: a SC nunca chega perto da fila de Atribuir porque não passa da etapa
 *    anterior.
 *
 * As duas medições juntas respondem à pergunta do relatório: a aba Atribuir não é alcançável
 * por esta conta — nem por ausência de registro que bata com o filtro de hoje, nem (com massa
 * própria) por a SC nunca ter avançado o suficiente para chegar lá.
 *
 * ## Por que `@achado` e não `@bug` (corrigido em 03/09/2026)
 *
 * As duas specs deste arquivo afirmam o comportamento **REAL medido** e por isso estão
 * **VERDES** — não são vermelhos intencionais. O primeiro teste levava `@bug` por engano, o
 * que fazia `--grep-invert @bug` esconder uma medição válida e `--grep @bug` devolver um verde
 * que o alarme de "defeito corrigido" não sabe ler. A tag correta é `@achado`, com a polaridade
 * invertida de sempre: no dia em que a aba Atribuir passar a listar SCs para esta conta, este
 * teste fica **vermelho** — e isso não é regressão da suíte, é sinal de que o comportamento
 * mudou e alguém precisa decidir se a mudança foi intencional.
 *
 * O vermelho de CT-E2E-05-H — o caso escrito contra o comportamento ESPERADO, "a aba deve
 * listar as solicitações pendentes de atribuição" — vive em
 * `tests/e2e/portais/gerencia-compras.spec.js` (`@bug`). Aqui só se documenta a causa.
 */
test.describe('Gerência de Compras — Atribuir comprador (CT-E2E-05-H)', () => {
  test('a aba Atribuir não lista SCs para a conta autenticada, embora o mesmo mecanismo renderize dados reais na aba Transferir @achado', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const atribuicao = new AtribuicaoCompradorPage(page);

    await atribuicao.goto();
    await atribuicao.expectCarregada();

    // Transferir primeiro: prova que o pipeline de carga/renderização da grade FUNCIONA para
    // esta conta, com massa real — isola a causa da ausência de dados na Atribuir.
    await atribuicao.abrirAbaTransferir();
    await expect(
      atribuicao.getTabelaAtiva(),
      'a aba Transferir não renderizou a tabela. Ela é a PRÉ-CONDIÇÃO deste teste: serve para ' +
        'provar que o pipeline de carga da grade funciona para esta conta, isolando a causa da ' +
        'ausência de dados na aba Atribuir. Sem ela, o teste não tem o que comparar',
    ).toBeVisible();
    await expect
      .poll(() => atribuicao.getLinhas().count(), {
        message: 'aba Transferir deveria listar SCs reais para esta conta (etapa=119)',
        timeout: 45_000,
      })
      .toBeGreaterThan(1);

    // Atribuir: mesma página, mesmo carregamento, dataset irmão (etapa=257) — sem dado real.
    await atribuicao.abrirAbaAtribuir();
    await expect(
      atribuicao.getTabelaAtiva(),
      'a aba Atribuir não renderizou nem a tabela vazia. O caso afirma sobre a AUSÊNCIA de ' +
        'dados nela; sem a tabela na tela não dá para distinguir "veio vazia" (o defeito) de ' +
        '"a aba não carregou" (outro problema)',
    ).toBeVisible();
    // As duas chamadas a `ds_getSolicsGerenciaCompras` (etapa=257 e etapa=119) disparam juntas
    // no carregamento da página — a essa altura (já esperamos a Transferir acima) a resposta de
    // etapa=257 já chegou; a assertion abaixo só confirma o estado final renderizado.
    await expect(
      atribuicao.getTabelaAtiva().getByText('Nenhum dado encontrado'),
      'defeito: a aba Atribuir deveria listar as SCs pendentes de atribuição, e o esperado hoje ' +
        'é o vazio ("Nenhum dado encontrado"). Se nem esse aviso aparece, a aba está num terceiro ' +
        'estado — nem com dado, nem com vazio declarado',
    ).toBeVisible({ timeout: 30_000 });
    expect(await atribuicao.possuiDados()).toBe(false);

    expect(guarda.tentativas()).toBe(0);
  });

  test('@destrutivo uma SC própria aprovada na Validação do Gestor para em Validação Orçamentária, sem nunca chegar à fila de Atribuir', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const { numeroProcesso } = await criarSolicitacaoCompraClassica(page, {
      justificativa: `QA CT-E2E-05-H atribuicao comprador ${Date.now()}`,
    });

    await aprovarValidacaoDoGestor(page, numeroProcesso, 'QA aprovando Validação do Gestor — CT-E2E-05-H');

    const atividade = await aguardarAtividadeAtual(page, numeroProcesso, ['Validação Orçamentária'], {
      timeout: 90_000,
    });
    expect(atividade).toBe('Validação Orçamentária');

    // A alçada é quem barra o caminho — não a UI. Confirmado: nenhum "Assumir tarefa" para esta
    // conta na atividade em que a SC efetivamente parou.
    await expect(page.getByRole('button', { name: 'Assumir tarefa' })).toHaveCount(0);

    // E, coerente com o achado acima: a SC recém-criada não aparece na aba Atribuir — nunca
    // avançou até lá.
    const atribuicao = new AtribuicaoCompradorPage(page);
    await atribuicao.goto();
    await atribuicao.expectCarregada();
    await atribuicao.abrirAbaAtribuir();
    await expect(atribuicao.getTabelaAtiva()).toBeVisible();
    await expect(atribuicao.localizarLinhaPorNumero(numeroProcesso)).toHaveCount(0);
  });
});
