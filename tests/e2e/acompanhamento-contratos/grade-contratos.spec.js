// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { descobrirContratoVigente } from '../../../utils/massa-contratos.js';
import { faltaPreCondicao } from '../../../utils/pre-condicao.js';

/**
 * Grade de contratos e ações da linha — casos CT-ACC-02.
 */

/** Rótulos completos de situação do contrato (CN9_SITUAC), como o negócio espera lê-los. */
const SITUACOES_LEGIVEIS = [
  'Em digitação',
  'Vigente',
  'Paralisado',
  'Sol. Finalização',
  'Finalizado',
  'Revisão',
  'Cancelado',
];

test.describe('Grade de contratos', () => {
  test('CT-ACC-02-H — deve oferecer Planilha, Solicitação de Compra e Informações na linha do contrato', async ({
    contratosPage,
  }) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato((await descobrirContratoVigente(contratosPage)).contrato);

    const acoes = contratosPage.acoesDaLinha;

    await expect(acoes.planilha).toBeVisible();
    await expect(acoes.solicitacaoCompra).toBeVisible();
    await expect(acoes.informacoes).toBeVisible();
  });

  test('deve filtrar a grade pelo número do contrato', async ({ contratosPage }) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato((await descobrirContratoVigente(contratosPage)).contrato);

    await expect(contratosPage.getInformacaoDaGrade()).toHaveText(
      /Mostrando de 1 até 1 de 1 registros \(Filtrados de \d+ registros\)/,
    );
  });

  /**
   * FSWTBC-4898 — as três ações têm de existir em TODA linha, não só na primeira.
   *
   * `CT-ACC-02-H` afirma que os três ícones estão visíveis — mas na linha que o filtro deixou
   * na tela. Uma linha sem o ícone de Planilha (contrato sem planilha, filial órfã) passaria
   * despercebida, e é justamente o caso que o chamado descreve.
   */
  test('FSWTBC-4898 — toda linha da grade oferece as três ações do contrato', async ({
    contratosPage,
  }) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    const linhas = await contratosPage.lerLinhasDaGrade();
    if (linhas.length === 0) {
      faltaPreCondicao('(ambiente): a grade de contratos não retornou nenhuma linha');
    }

    const acoes = contratosPage.acoesDaLinha;
    const [planilha, solicitacao, informacoes] = await Promise.all([
      acoes.planilha.count(),
      acoes.solicitacaoCompra.count(),
      acoes.informacoes.count(),
    ]);

    test.info().annotations.push({
      type: 'acoes-por-linha',
      description: `${linhas.length} linha(s) · Planilha ${planilha} · Solicitação ${solicitacao} · Informações ${informacoes}`,
    });

    expect(
      { planilha, solicitacao, informacoes },
      `a grade tem ${linhas.length} linha(s) e cada uma deveria oferecer as três ações`,
    ).toEqual({
      planilha: linhas.length,
      solicitacao: linhas.length,
      informacoes: linhas.length,
    });
  });

  /**
   * FSWTBC-4073 — a grade não pode repetir o mesmo contrato.
   *
   * ATENÇÃO ao que se afirma aqui, porque a leitura ingênua produz falso vermelho: o número do
   * contrato **não é necessariamente único entre filiais**, e isso é do negócio, não defeito.
   * A chave real é o **par (filial, contrato)** — é ele que este teste afirma ser único.
   *
   * Duas populações diferentes, e confundi-las já me levou a escrever um comentário errado:
   * a GRADE traz 845 linhas e, medida em 08/09/2026, **nenhum** número repetido entre filiais;
   * o DATASET `dsProtheus_getContratosxFornecedores` traz 963 linhas e ali foram observados 9
   * números repetidos (`000000000000010` em 5 filiais). A grade é um subconjunto — este teste
   * mede a grade, que é o que o usuário vê.
   *
   * A contagem de repetidos vai para a anotação em vez de virar assertion: se a numeração
   * deveria ou não ser global é decisão do time, não conclusão que eu possa sustentar.
   */
  test('FSWTBC-4073 — a grade não lista o mesmo contrato da mesma filial duas vezes', async ({
    contratosPage,
  }) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    const linhas = await contratosPage.lerLinhasDaGrade();
    if (linhas.length === 0) {
      faltaPreCondicao('(ambiente): a grade de contratos não retornou nenhuma linha');
    }

    const pares = linhas.map((l) => `${l.filial}|${l.contrato}`);
    const duplicados = pares.filter((p, i) => pares.indexOf(p) !== i);

    const porNumero = new Map();
    for (const l of linhas) porNumero.set(l.contrato, (porNumero.get(l.contrato) ?? 0) + 1);
    const repetidosEntreFiliais = [...porNumero.entries()].filter(([, n]) => n > 1);

    test.info().annotations.push({
      type: 'unicidade-da-grade',
      description:
        `${linhas.length} linha(s); ${new Set(pares).size} par(es) (filial, contrato) distintos; ` +
        `${repetidosEntreFiliais.length} número(s) de contrato repetido(s) entre filiais ` +
        `(ex.: ${repetidosEntreFiliais.slice(0, 3).map(([c, n]) => `${c}×${n}`).join(', ') || 'nenhum'})`,
    });

    expect(
      [...new Set(duplicados)],
      'a grade listou o mesmo contrato da mesma filial mais de uma vez',
    ).toEqual([]);
  });

  /**
   * FSWTBC-4986 — o campo Pesquisar precisa RESTRINGIR, não só reordenar.
   *
   * Hoje a suíte afirma que filtrar por número de contrato deixa aquele contrato na tela. Não
   * afirma o inverso: que o que sobra na grade corresponde ao termo. Um filtro que devolve a
   * base inteira "com o item no topo" passaria — e é o modo de falha que o chamado descreve.
   */
  test('FSWTBC-4986 — filtrar pela filial restringe a grade às linhas daquela filial', async ({
    contratosPage,
  }) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    const todas = await contratosPage.lerLinhasDaGrade();
    if (todas.length === 0) {
      faltaPreCondicao('(ambiente): a grade de contratos não retornou nenhuma linha');
    }

    // Filial descoberta da própria grade — nunca fixada em constante, pela mesma razão que
    // vale para contrato: o que existe na base muda.
    const filial = todas.find((l) => /^\d{3,5}$/.test(l.filial))?.filial;
    if (!filial) {
      faltaPreCondicao(
        `nenhuma linha da grade traz código de filial numérico para usar como termo de busca`,
      );
    }

    await contratosPage.filtrarPorContrato(filial);
    const filtradas = await contratosPage.lerLinhasDaGrade();

    test.info().annotations.push({
      type: 'filtro-por-filial',
      description: `termo "${filial}": ${filtradas.length} de ${todas.length} linha(s)`,
    });

    expect(filtradas.length, `filtrar por "${filial}" não deixou nenhuma linha`).toBeGreaterThan(0);

    // Toda linha que sobrou tem de conter o termo em ALGUM campo visível — é o que caracteriza
    // filtro. O DataTables busca em todas as colunas, então a checagem é sobre a linha inteira.
    const forasteiras = filtradas.filter(
      (l) => !Object.values(l).some((v) => String(v).includes(filial)),
    );
    expect(
      forasteiras.map((l) => `${l.filial}/${l.contrato}`),
      `linhas que sobraram no filtro "${filial}" sem conter o termo em nenhuma coluna`,
    ).toEqual([]);
  });

  test('CT-ACC-02-S1 @bug — deve exibir a situação do contrato por extenso, sem truncar', async ({ contratosPage }) => {
    // Defeito conhecido D-08, em aberto: a grade corta o rótulo ("Finali" no lugar de
    // "Finalizado"), sem reticências e sem dica ao passar o mouse.
    // O teste é escrito contra o comportamento ESPERADO e por isso REPROVA hoje.
    // Ajustá-lo para aceitar o texto cortado documentaria o defeito como se fosse regra.
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    const exibidos = await contratosPage.lerStatusExibidos();

    expect(exibidos.length, 'a grade não trouxe nenhuma situação para avaliar').toBeGreaterThan(0);

    const truncados = exibidos.filter((situacao) => !SITUACOES_LEGIVEIS.includes(situacao));

    expect(
      truncados,
      `situações exibidas de forma truncada/ilegível na grade: ${JSON.stringify(truncados)}`,
    ).toEqual([]);
  });
});
