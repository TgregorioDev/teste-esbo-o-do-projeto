// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { descobrirContratoVigente } from '../../../utils/massa-contratos.js';
import { faltaPreCondicao } from '../../../utils/pre-condicao.js';

/**
 * Modais da coluna "Ação" do Acompanhamento de Contratos.
 *
 * Por que este arquivo existe: `grade-contratos.spec.js :: CT-ACC-02-H` afirmava apenas que os
 * três ícones da linha estão VISÍVEIS, sem nunca abrir nenhum deles. A comparação entre a suíte
 * e os chamados (`docs/comparacao-automacao-x-chamados.md`) mostrou que esse único ponto era o
 * gargalo de 13 casos: fiscais, status, valores, fornecedor, planilhas e filtros só são
 * observáveis dentro destes modais.
 *
 * Tudo aqui é LEITURA — nenhum teste escreve, movimenta ou cancela registro.
 *
 * Três fatos do ambiente, medidos em 08/09/2026, que decidem o desenho:
 *
 * - `Escape` NÃO fecha os modais; fechar é pelo botão "Fechar" (ver `fecharModal`).
 * - Os modais EMPILHAM: "Detalhes da Planilha" abre por cima de "Informações da Planilha".
 * - A ficha do contrato tem 103 rótulos e TODOS vêm preenchidos, usando `-` para vazio. Logo,
 *   `toBeVisible()` num campo não prova nada; o que prova é o VALOR.
 */

/** Máscara monetária pt-BR usada pelo portal: `R$ 1.234,56`. */
const MOEDA_BR = /^R\$ ?\d{1,3}(\.\d{3})*,\d{2}$/;

/** CNPJ mascarado: `26.628.497/0001-80`. */
const CNPJ_MASCARADO = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

/** Situações do contrato por extenso — as mesmas de `grade-contratos.spec.js`. */
const SITUACOES_LEGIVEIS = [
  'Em digitação',
  'Vigente',
  'Paralisado',
  'Sol. Finalização',
  'Finalizado',
  'Revisão',
  'Cancelado',
];

/**
 * Abre o portal, escolhe um contrato vigente pela grade e filtra por ele.
 * @param {import('../../../pages/AcompanhamentoContratosPage.js').AcompanhamentoContratosPage} contratosPage
 */
async function abrirContrato(contratosPage) {
  await contratosPage.goto();
  await contratosPage.expectCarregada();
  const linha = await descobrirContratoVigente(contratosPage);
  await contratosPage.filtrarPorContrato(linha.contrato);
  return linha;
}

test.describe('Ficha do contrato — modal "Informações Complementares do Contrato"', () => {
  test('CT-ACC-02-H — a ficha abre para a linha filtrada e identifica o MESMO contrato da grade', async ({
    contratosPage,
  }) => {
    const linha = await abrirContrato(contratosPage);

    await contratosPage.abrirInformacoesDoContrato();
    const campos = await contratosPage.lerCamposDoModal('Informações Complementares do Contrato');

    // A coerência entre a linha clicada e a ficha aberta é o que garante que o modal não abre
    // sempre o mesmo contrato — defeito que já ocorreu neste portal com filtro por coluna.
    expect(
      campos['Número do Contrato'],
      `a ficha deveria ser do contrato clicado (${linha.contrato}) — se divergir, o modal está ` +
        `abrindo outro registro, e toda asserção sobre ele mede o contrato errado`,
    ).toBe(linha.contrato);
    expect(campos['Filial']).toBe(linha.filial);

    // A ficha tem 103 rótulos; conferir a ordem de grandeza protege contra o modal abrir
    // "vazio mas visível", que é o modo de falha real quando o dataset não responde.
    expect(Object.keys(campos).length).toBeGreaterThan(90);
  });

  test('a ficha traz Fiscal de Contrato e Fiscal de Serviço identificados (FSWTBC-1702, FSWTBC-4987)', async ({
    contratosPage,
  }) => {
    await abrirContrato(contratosPage);
    await contratosPage.abrirInformacoesDoContrato();
    const campos = await contratosPage.lerCamposDoModal('Informações Complementares do Contrato');

    // Os dois campos existem em TODO contrato — o que varia é vir preenchido ou `-`.
    expect(campos).toHaveProperty('Fiscal de Contrato');
    expect(campos).toHaveProperty('Fiscal de Serviço');

    // Quando preenchido, o portal escreve "Nome (email)". A forma importa: os chamados de
    // fiscal reclamam de nome sem e-mail e de e-mail sem nome, que é o que esta regex pega.
    for (const campo of ['Fiscal de Contrato', 'Fiscal de Serviço']) {
      const valor = campos[campo];
      if (valor === '-' || valor === '') continue;
      expect(valor, `${campo} preenchido deve trazer "Nome (email)" — veio "${valor}"`).toMatch(
        /^.+\s\(\S+@\S+\.\S+\)$/,
      );
    }
  });

  test('os valores do contrato saem com máscara monetária pt-BR (FSWTBC-4982)', async ({
    contratosPage,
  }) => {
    await abrirContrato(contratosPage);
    await contratosPage.abrirInformacoesDoContrato();
    const campos = await contratosPage.lerCamposDoModal('Informações Complementares do Contrato');

    const monetarios = [
      'Valor Inicial do Contrato',
      'Valor Atual do Contrato',
      'Saldo do Contrato',
      'Medição Acumulada',
    ];

    const preenchidos = monetarios.filter((c) => campos[c] && campos[c] !== '-');
    if (preenchidos.length === 0) {
      faltaPreCondicao(
        `o contrato escolhido não tem nenhum valor monetário preenchido na ficha ` +
          `(todos vieram "-"): ${monetarios.join(', ')}. Sem valor não há máscara a verificar.`,
      );
    }

    for (const campo of preenchidos) {
      expect(campos[campo], `${campo} deveria vir mascarado como R$ 1.234,56`).toMatch(MOEDA_BR);
    }
  });

  test('o fornecedor é identificado com CNPJ mascarado e código com loja (FSWTBC-4983, FSWTBC-4076)', async ({
    contratosPage,
  }) => {
    await abrirContrato(contratosPage);
    await contratosPage.abrirInformacoesDoContrato();
    const campos = await contratosPage.lerCamposDoModal('Informações Complementares do Contrato');

    const cnpj = campos['CNPJ do Fornecedor'];
    if (!cnpj || cnpj === '-') {
      faltaPreCondicao('o contrato escolhido não tem CNPJ de fornecedor preenchido na ficha');
    }
    expect(cnpj, 'o CNPJ deveria vir mascarado, não como 14 dígitos crus').toMatch(CNPJ_MASCARADO);

    // Medido: o portal escreve "26628497 / 0001" — código e loja no mesmo campo, separados.
    // O teste afirma que a loja está presente, que é a informação que os chamados dizem faltar.
    expect(
      campos['Cód. Fornecedor'],
      'o código do fornecedor deveria trazer também a loja (formato "codigo / loja")',
    ).toMatch(/\S+\s*[/-]\s*\d+/);
  });

  test('a ficha expõe a superfície de integração com o ERP (Status da Integração GCT e Erro de Integração)', async ({
    contratosPage,
  }) => {
    await abrirContrato(contratosPage);
    await contratosPage.abrirInformacoesDoContrato();
    const campos = await contratosPage.lerCamposDoModal('Informações Complementares do Contrato');

    // Estes dois campos são a ÚNICA superfície do Fluig onde o resultado da integração GCT
    // aparece para um contrato. Vários chamados de "contrato não integrou" dependem deles
    // existirem — se sumirem numa versão, o diagnóstico em tela deixa de ser possível.
    expect(campos).toHaveProperty('Status da Integração GCT');
    expect(campos).toHaveProperty('Erro de Integração');

    test.info().annotations.push({
      type: 'integracao-gct',
      description: `Status="${campos['Status da Integração GCT']}" Erro="${campos['Erro de Integração']}"`,
    });
  });

  test('CT-ACC-02-S1 @bug — a situação do contrato também vem truncada DENTRO da ficha, não só na grade', async ({
    contratosPage,
  }) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    // Este teste NÃO pode usar `descobrirContratoVigente`: ele só devolve contratos vigentes,
    // e "Vigente" cabe na coluna sem cortar. Escolhido assim, o teste ficava VERDE sem nunca
    // exercitar o defeito — que é o modo de falha mais caro possível num teste `@bug`.
    // Aqui a massa precisa ser exatamente um contrato cuja situação JÁ aparece truncada.
    const linhas = await contratosPage.lerLinhasDaGrade();
    const truncado = linhas.find(
      (l) => l.status !== '' && !SITUACOES_LEGIVEIS.includes(l.status),
    );

    if (!truncado) {
      faltaPreCondicao(
        `nenhum contrato da grade está com a situação truncada no momento — sem essa massa não ` +
          `há como verificar se a ficha repete o corte. Situações vistas: ` +
          `${JSON.stringify([...new Set(linhas.map((l) => l.status))])}`,
      );
    }

    await contratosPage.filtrarPorContrato(truncado.contrato);
    await contratosPage.abrirInformacoesDoContrato();
    const campos = await contratosPage.lerCamposDoModal('Informações Complementares do Contrato');

    // Medido em 08/09/2026 no contrato 0000-2025-2501-: a grade mostra "Finali" e a ficha
    // mostra "Finali" também. Ou seja, NÃO é largura de coluna — o valor chega truncado do
    // dataset, e nenhuma correção de CSS resolveria. O teste afirma o comportamento correto e
    // por isso REPROVA hoje; ajustá-lo para aceitar o corte documentaria o defeito como regra.
    expect(
      SITUACOES_LEGIVEIS,
      `a ficha do contrato ${truncado.contrato} deveria mostrar a situação por extenso; ` +
        `a grade mostra "${truncado.status}" e a ficha mostra "${campos['Status']}"`,
    ).toContain(campos['Status']);
  });
});

test.describe('Planilhas do contrato — modais "Informações da Planilha" e "Detalhes da Planilha"', () => {
  test('a lista de planilhas do contrato abre com as colunas do negócio (FSWTBC-4068, FSWTBC-4078)', async ({
    contratosPage,
  }) => {
    const linha = await abrirContrato(contratosPage);
    const modal = await contratosPage.abrirPlanilhas();

    // Colunas exatas, na ordem — é o que distingue "a lista carregou" de "a lista veio com o
    // layout de outra tela", que é o sintoma dos chamados de planilha não encontrada.
    const cabecalhos = await modal.locator('table thead').first().locator('th').allInnerTexts();
    expect(cabecalhos.map((c) => c.trim())).toEqual([
      'Filial',
      'Contrato',
      'Planilha',
      'Revisão',
      'Cod. Fornecedor',
      'Fornecedor',
      'Loja Forn.',
      'Ações',
    ]);

    const linhas = modal.locator('table tbody tr');
    const total = await linhas.count();
    if (total === 0) {
      faltaPreCondicao(
        `o contrato ${linha.contrato} não tem planilha cadastrada — sem planilha não há o que ` +
          `listar. Destrava usar um contrato com ao menos uma planilha no Protheus.`,
      );
    }

    // Toda planilha listada pertence ao contrato filtrado.
    const contratosNaLista = await linhas.evaluateAll((trs) =>
      trs.map((tr) => (tr.querySelectorAll('td')[1]?.textContent || '').trim()),
    );
    for (const c of contratosNaLista) {
      expect(c, 'a lista trouxe planilha de OUTRO contrato').toBe(linha.contrato);
    }
  });

  test('o detalhe da planilha é coerente com a linha escolhida e traz tipo, valor e saldo', async ({
    contratosPage,
  }) => {
    const linha = await abrirContrato(contratosPage);
    const lista = await contratosPage.abrirPlanilhas();

    if ((await lista.locator('table tbody tr').count()) === 0) {
      faltaPreCondicao(`o contrato ${linha.contrato} não tem planilha cadastrada`);
    }

    const numeroNaLista = (
      await lista.locator('table tbody tr').first().locator('td').nth(2).innerText()
    ).trim();

    await contratosPage.abrirDetalhesDaPlanilha(0);
    const campos = await contratosPage.lerCamposDoModal('Detalhes da Planilha');

    expect(campos['Numero do Contrato'], 'o detalhe abriu outro contrato').toBe(linha.contrato);
    expect(campos['Numero da Planilha'], 'o detalhe abriu outra planilha').toBe(numeroNaLista);

    // Campos que os chamados de medição citam como origem do problema.
    for (const campo of ['Tipo da Planilha', 'Valor Total', 'Saldo da Planilha']) {
      expect(campos, `o detalhe deveria expor "${campo}"`).toHaveProperty(campo);
    }

    if (campos['Valor Total'] && campos['Valor Total'] !== '-') {
      // eslint-disable-next-line playwright/no-conditional-expect -- medido em 11/09/2026: ~2% das planilhas da filial 5303 vêm com CNA_VLTOT vazio (20 de 1.000), nunca zero; torná-la obrigatória exige decidir se vazio é dado ou defeito (docs/plano-de-evolucao-2026-09-11.md)
      expect(campos['Valor Total']).toMatch(MOEDA_BR);
    }

    // Medido em 08/09/2026: planilha sem medição traz `Saldo da Planilha` = "-", não "R$ 0,00".
    // Registrado como observação — a decisão de tratar isso como defeito é do dono do produto.
    test.info().annotations.push({
      type: 'saldo-da-planilha',
      description: `planilha ${numeroNaLista}: Valor Total="${campos['Valor Total']}" Saldo="${campos['Saldo da Planilha']}"`,
    });
  });

  /**
   * FSWTBC-4820 — os dados da planilha CARREGAM, não só as caixas aparecem.
   *
   * O chamado é "dados da planilha não são carregados na rotina de Acompanhamento de Contratos":
   * a planilha vinculada abria, mas vazia, e a consulta durante o acompanhamento ficava
   * inviável. O modo de falhar importa — o modal abre igual nos dois casos, com os mesmos
   * rótulos; o que muda é haver ou não valor atrás deles.
   *
   * Daí o oráculo desta suíte, registrado no cabeçalho: a ficha usa `-` para vazio, então
   * `toBeVisible()` num campo não prova nada. Aqui se afirma sobre os campos de IDENTIFICAÇÃO
   * da planilha — os que não podem estar vazios em planilha nenhuma, porque são a chave dela no
   * ERP. Valores de negócio (saldo, condição de pagamento) podem legitimamente vir `-`, e por
   * isso ficam fora da assertion e vão para a anotação.
   */
  test('FSWTBC-4820 — o detalhe da planilha vem com valor nos campos de identificação, não em branco', async ({
    contratosPage,
  }) => {
    const linha = await abrirContrato(contratosPage);
    const lista = await contratosPage.abrirPlanilhas();

    if ((await lista.locator('table tbody tr').count()) === 0) {
      faltaPreCondicao(
        `o contrato ${linha.contrato} não tem planilha cadastrada — sem planilha não há dado a ` +
          'carregar. Destrava usar um contrato com ao menos uma planilha no Protheus.',
      );
    }

    await contratosPage.abrirDetalhesDaPlanilha(0);
    const campos = await contratosPage.lerCamposDoModal('Detalhes da Planilha');

    // Os campos que identificam a planilha e o fornecedor dela. Vazio ou `-` em qualquer um
    // deles é o sintoma do chamado: o modal abriu sem os dados.
    const IDENTIFICACAO = [
      'Filial do Sistema',
      'Numero do Contrato',
      'Numero da Planilha',
      'Tipo da Planilha',
      'Codigo do Fornecedor',
      'CNPJ Fornecedor',
      'Nome Fornecedor',
    ];

    const semValor = IDENTIFICACAO.filter((campo) => {
      const valor = (campos[campo] ?? '').trim();
      return valor === '' || valor === '-';
    });

    test.info().annotations.push({
      type: 'detalhe-da-planilha',
      description:
        `${Object.keys(campos).length} campos lidos · sem valor na identificação: ` +
        `${semValor.join(', ') || 'nenhum'} · ` +
        IDENTIFICACAO.map((c) => `${c}="${campos[c] ?? '(ausente)'}"`).join(' '),
    });

    expect(
      semValor,
      'o modal "Detalhes da Planilha" abriu sem os dados de identificação da planilha — é ' +
        'exatamente o sintoma do FSWTBC-4820, e a tela não distingue isso de "planilha sem ' +
        'movimento", porque usa o mesmo `-` para os dois',
    ).toEqual([]);

    // O CNPJ do fornecedor vem mascarado, como no resto do portal — mesma convenção já guardada
    // na ficha do contrato.
    expect(campos['CNPJ Fornecedor']).toMatch(CNPJ_MASCARADO);
  });
});
