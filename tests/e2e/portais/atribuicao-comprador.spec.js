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
 * própria) por a SC nunca ter avançado o suficiente para chegar lá. CT-E2E-05-H fica vermelho
 * por essa causa, documentada, não por suposição.
 */
test.describe('Gerência de Compras — Atribuir comprador (CT-E2E-05-H)', () => {
  test('a aba Atribuir não lista SCs para a conta autenticada, embora o mesmo mecanismo renderize dados reais na aba Transferir', async ({
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
    // ⚠️ VERMELHO INTENCIONAL — não "conserte" para verde.
    //
    // A versão anterior afirmava `getByText('Nenhum dado encontrado')).toBeVisible()` e
    // `possuiDados()).toBe(false)`: registrava o defeito COMO SE FOSSE A REGRA e passava. Pior,
    // contradizia `tests/e2e/portais/gerencia-compras.spec.js`, que afirma o oposto sobre esta
    // mesma aba — a suíte tinha um verde e um vermelho permanentes sobre o mesmo fato, e o
    // leitor do relatório não tinha como saber qual era o comportamento esperado.
    //
    // O resultado esperado de CT-E2E-05-H é explícito (`docs/catalogo-casos.md`): a SC passa a
    // constar para o comprador escolhido, e a aba Transferir permite trocá-lo depois. Logo a
    // Atribuir tem de listar as SCs pendentes de atribuição. Enquanto o `etapa=257` devolver
    // vazio para esta conta, este teste reprova — que é a convenção da suíte.
    //
    // As duas chamadas a `ds_getSolicsGerenciaCompras` (etapa=257 e etapa=119) disparam juntas
    // no carregamento da página; a essa altura (já esperamos a Transferir acima) a resposta de
    // etapa=257 já chegou, então isto mede o estado final renderizado, não uma corrida.
    expect(
      await atribuicao.possuiDados(),
      'defeito: a aba Atribuir deveria listar as SCs pendentes de atribuição (CT-E2E-05-H), e ' +
        'está vazia — enquanto a aba irmã Transferir, carregada pelo MESMO mecanismo na mesma ' +
        'página, renderizou dados reais logo acima. Isso isola a causa no `etapa=257` filtrado ' +
        'pela matrícula da conta autenticada, não no pipeline de carga da grade',
    ).toBe(true);

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

    // A alçada é quem barra o caminho — não a UI. Ancorar num estado POSITIVO da tela antes de
    // afirmar a ausência do controle: assertion de ausência é satisfeita no primeiro poll, e
    // sem essa âncora "o botão não está lá" seria indistinguível de "a tela ainda não montou"
    // (armadilha registrada em `docs/mapa-do-ambiente.md`, onda 3).
    await expect(page.getByText('Atividade atual: Validação Orçamentária')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Assumir tarefa' }),
      `a SC ${numeroProcesso} parou em Validação Orçamentária, que é etapa de responsável ` +
        'NOMINAL — não deve oferecer "Assumir tarefa" para a conta de automação',
    ).toHaveCount(0);

    // A segunda metade do teste original ("a SC não aparece na aba Atribuir") foi REMOVIDA: o
    // teste irmão desta describe já prova que a aba Atribuir está vazia para qualquer SC, então
    // afirmar que ESTA não está lá era verdade por construção — não podia falhar, e não
    // acrescentava informação nenhuma. O que este teste prova é o teto: a SC para na etapa
    // anterior, e é por isso que nunca chega à fila de atribuição.
  });
});
