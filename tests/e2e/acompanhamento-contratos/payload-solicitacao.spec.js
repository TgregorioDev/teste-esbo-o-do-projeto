// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { envObrigatoria } from '../../../config/ambiente.js';
import { descobrirContratoVigente } from '../../../utils/massa-contratos.js';
import { criarSolicitacaoCompra } from '../../../factories/solicitacao-compra.js';
import {
  capturarEnvioSolicitacao,
  extrairItens,
  extrairRateio,
  normalizarLinhaRateio,
  paraNumero,
} from '../../../utils/captura-payload.js';

/**
 * Payload de start da Solicitação de Compra — capturado, afirmado e SEMPRE abortado.
 *
 * Vários defeitos críticos só eram observáveis na SC já criada, o que exigiria gravar
 * registro permanente na base do cliente (sem exclusão disponível — ver README). Não é mais
 * necessário: ao clicar Confirmar, o widget faz
 *   POST .../process-management/api/v2/processes/wf_solicitacao_compras/start
 * com o payload completo. Interceptar, guardar o corpo, afirmar sobre ele e ABORTAR prova o
 * defeito sem que nada seja criado — `utils/captura-payload.js` garante isso.
 *
 * REGRA DE OURO: nenhuma requisição de escrita chega ao servidor. Toda spec instala a
 * interceptação ANTES de qualquer clique, e cada teste reconfirma `captura.tentativas()`.
 */

/**
 * Abre o modal a partir do contrato informado, preenche os campos obrigatórios com massa da
 * factory e confirma. A interceptação já precisa estar instalada em `page` antes de chamar
 * isto — os testes fazem isso explicitamente, para deixar claro o momento em que a guarda
 * entra em vigor.
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('../../../pages/AcompanhamentoContratosPage.js').AcompanhamentoContratosPage} contratosPage
 * @param {import('../../../components/SolicitacaoCompraModal.js').SolicitacaoCompraModal} solicitacaoModal
 * @param {import('../../../utils/massa-contratos.js').CriterioDeContrato} [criterio] característica exigida do contrato
 * @param {Partial<import('../../../factories/solicitacao-compra.js').SolicitacaoCompra>} [overrides]
 * @returns {Promise<import('../../../pages/AcompanhamentoContratosPage.js').LinhaDeContrato>} o contrato efetivamente usado
 */
async function abrirPreencherEConfirmar(page, contratosPage, solicitacaoModal, criterio = {}, overrides = {}) {
  await contratosPage.goto();
  await contratosPage.expectCarregada();

  // Massa descoberta em tempo de execução: o teste declara a característica de que precisa e
  // a suíte escolhe da grade um contrato que sirva. Ver utils/massa-contratos.js.
  const contrato = await descobrirContratoVigente(contratosPage, criterio);
  await contratosPage.filtrarPorContrato(contrato.contrato);
  await contratosPage.abrirSolicitacaoCompra();
  await solicitacaoModal.expectAberto();

  await solicitacaoModal.preencher(criarSolicitacaoCompra(overrides));
  await solicitacaoModal.confirmar();

  return contrato;
}

test.describe('Payload de start — targetState e targetAssignee (D-01 / CT-E2E-01-H)', () => {
  test('a SC deve nascer numa etapa de trabalho atribuída ao solicitante, não presa no marco de Início da conta de integração', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    const captura = await capturarEnvioSolicitacao(page);

    await abrirPreencherEConfirmar(page, contratosPage, solicitacaoModal);
    const payload = await captura.aguardarPayload(0);

    expect(captura.tentativas(), `houve mais de uma tentativa de escrita: ${captura.urls().join(', ')}`).toBe(1);

    // Confirmado em campo (contrato 2101 / rev 001): o widget sempre envia targetState=6.
    // 6 é o marco de Início do BPMN — não uma etapa de trabalho. A SC entra "presa" ali e
    // nunca chega ao Protheus.
    expect(payload.targetState, 'a SC nasceu presa no marco de Início do BPMN (targetState=6)').not.toBe(6);

    // Confirmado em campo: targetAssignee é sempre a conta de integração ("consumerkeycompras"),
    // nunca o solicitante logado — mesmo o formFields carregando corretamente a matrícula de
    // quem pediu (matriculaSolicitante). É a ROTEAMENTO do processo que ignora o solicitante.
    expect(
      payload.targetAssignee,
      'a etapa deveria ser atribuída ao solicitante logado, não a uma conta de integração fixa',
    ).toBe(envObrigatoria('QA_USERNAME'));
  });
});

test.describe('Payload de start — valor multiplicado (D-02 / CT-ACC-06-S1)', () => {
  // Sem oráculo externo, de propósito.
  //
  // O payload não traz nenhum campo com o valor total do contrato, e a grade também não o
  // exibe — não há de onde ler o "valor correto" para comparar. Fixar o valor de um contrato
  // específico numa constante resolveria isso e criaria um problema pior: o teste passaria a
  // depender daquele contrato existir e continuar valendo aquilo, e quebraria por motivo que
  // não é defeito no dia em que a base mudasse.
  //
  // A saída é afirmar sobre a INCOERÊNCIA INTERNA do próprio payload, que é a assinatura do
  // defeito e não precisa de referência de fora: itens com quantidades diferentes trazendo o
  // mesmo valor total, e item de quantidade 1 repetindo o total de outro item. Vale para
  // qualquer contrato, hoje e depois.

  test('itens com quantidades diferentes não devem trazer o mesmo valor total', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    const captura = await capturarEnvioSolicitacao(page);

    const contrato = await abrirPreencherEConfirmar(page, contratosPage, solicitacaoModal);
    const payload = await captura.aguardarPayload(0);

    expect(captura.tentativas()).toBe(1);

    const itens = extrairItens(payload.formFields);
    expect(
      itens.length,
      `contrato ${contrato.contrato} deveria trazer itens no payload`,
    ).toBeGreaterThan(0);

    /** @type {string[]} */
    const colisoes = [];
    for (let i = 0; i < itens.length; i += 1) {
      for (let j = i + 1; j < itens.length; j += 1) {
        const a = itens[i];
        const b = itens[j];
        const quantidadesDiferentes = Number(a.tbprod_quantidade) !== Number(b.tbprod_quantidade);
        const mesmoTotal = paraNumero(a.tbprod_valorTotal) === paraNumero(b.tbprod_valorTotal);
        if (quantidadesDiferentes && mesmoTotal) {
          colisoes.push(
            `#${a.indice}(qtd=${a.tbprod_quantidade}) e #${b.indice}(qtd=${b.tbprod_quantidade}) ` +
              `compartilham total=${a.tbprod_valorTotal}`,
          );
        }
      }
    }

    expect(
      colisoes,
      `contrato ${contrato.contrato}: o valor do contrato está sendo replicado em cada item ` +
        `em vez de dividido entre eles — ${colisoes.join(' | ')}`,
    ).toHaveLength(0);
  });

  test('não deve existir item de quantidade 1 repetindo o valor total de outro item', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    const captura = await capturarEnvioSolicitacao(page);

    const contrato = await abrirPreencherEConfirmar(page, contratosPage, solicitacaoModal);
    const payload = await captura.aguardarPayload(0);

    expect(captura.tentativas()).toBe(1);

    const itens = extrairItens(payload.formFields);
    const totaisDeOutros = new Map(
      itens.map((item) => [item.indice, paraNumero(item.tbprod_valorTotal)]),
    );

    const fantasmas = itens.filter((item) => {
      if (Number(item.tbprod_quantidade) !== 1) return false;
      const meuTotal = paraNumero(item.tbprod_valorTotal);
      return [...totaisDeOutros.entries()].some(
        ([indice, total]) => indice !== item.indice && total === meuTotal,
      );
    });

    expect(
      fantasmas.map((f) => `#${f.indice} (qtd=1, valorTotal=${f.tbprod_valorTotal})`),
      `contrato ${contrato.contrato}: item-fantasma replicando o valor cheio como se fosse ` +
        'produto próprio',
    ).toHaveLength(0);
  });

  test('itens com quantidade e preço diferentes não deveriam compartilhar o mesmo valor total', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    // Evidência independente do mesmo defeito (D-02), sem depender de um valor de contrato
    // conhecido de antemão: nenhum oráculo externo é necessário aqui — a suspeita nasce da
    // MESMA soma total aparecer em itens com quantidade/preço genuinamente diferentes, o que
    // só acontece se o widget estiver repetindo o valor do contrato inteiro por item.
    const captura = await capturarEnvioSolicitacao(page);

    await abrirPreencherEConfirmar(page, contratosPage, solicitacaoModal);
    const payload = await captura.aguardarPayload(0);

    expect(captura.tentativas()).toBe(1);

    const itens = extrairItens(payload.formFields);
    expect(itens.length, 'o contrato deveria trazer múltiplos itens no payload').toBeGreaterThan(1);

    /** @type {Map<number, typeof itens>} */
    const porValorTotal = new Map();
    for (const item of itens) {
      const total = paraNumero(item.tbprod_valorTotal);
      const lista = porValorTotal.get(total) ?? [];
      lista.push(item);
      porValorTotal.set(total, lista);
    }

    const suspeitos = [...porValorTotal.entries()].filter(([, lista]) => {
      if (lista.length < 2) return false;
      const assinaturas = new Set(lista.map((i) => `${i.tbprod_quantidade}|${i.tbprod_precoUnitario}`));
      return assinaturas.size > 1;
    });

    expect(
      suspeitos.map(
        ([total, lista]) =>
          `R$ ${total.toFixed(2)} repetido em ${lista.length} itens (#${lista.map((i) => i.indice).join(', #')}) com quantidade/preço distintos`,
      ),
      'itens com quantidade/preço diferentes não deveriam compartilhar o mesmo valor total — cada item deveria valer sua própria fração do contrato',
    ).toHaveLength(0);
  });
});

test.describe('Payload de start — campos chumbados (D-04 / CT-ACC-07-S1)', () => {
  test('classeOrca, classificação e o descritor deveriam refletir o contrato de origem, não vir fixos para todos', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    const capturaLimpo = await capturarEnvioSolicitacao(page);
    const primeiroContrato = await abrirPreencherEConfirmar(page, contratosPage, solicitacaoModal);
    const payloadLimpo = await capturaLimpo.aguardarPayload(0);
    expect(capturaLimpo.tentativas()).toBe(1);

    await solicitacaoModal.botaoFechar.click();
    await expect(solicitacaoModal.getDialog()).toBeHidden();

    // Nova interceptação: instalada ANTES do próximo clique em Confirmar, como a regra de
    // ouro exige. `page.route` empilha (LIFO) — este handler passa a ser o único acionado
    // daqui em diante, então `capturaLimpo` não é afetado pelo segundo fluxo.
    const capturaMedio = await capturarEnvioSolicitacao(page);
    // Segundo contrato precisa ser de OUTRA filial — senão "vir igual" seria coincidência.
    await abrirPreencherEConfirmar(page, contratosPage, solicitacaoModal, {
      filialDiferenteDe: primeiroContrato.filial,
      excluirContratos: [primeiroContrato.contrato],
    });
    const payloadMedio = await capturaMedio.aguardarPayload(0);
    expect(capturaMedio.tentativas()).toBe(1);

    // Pré-condição do achado: os dois contratos precisam ser genuinamente diferentes —
    // senão "vir igual" seria coincidência, não defeito.
    expect(payloadMedio.formFields.zoomNomeFilial).not.toBe(payloadLimpo.formFields.zoomNomeFilial);
    expect(payloadMedio.formFields.codFilial).not.toBe(payloadLimpo.formFields.codFilial);

    // Confirmado em campo: campoDescritor vem igual ("Sol. Compras - CASSI SEDE") nos dois
    // contratos, mesmo a filial real sendo outra unidade (CLINICASSI SÃO LUÍS-MA vs.
    // CLINICASSI ARACAJU-SE). O descritor deveria refletir a filial do contrato.
    expect(
      payloadMedio.formFields.campoDescritor,
      `campoDescritor não acompanha a filial: LIMPO="${payloadLimpo.formFields.campoDescritor}" (${payloadLimpo.formFields.zoomNomeFilial}), ` +
        `MEDIO="${payloadMedio.formFields.campoDescritor}" (${payloadMedio.formFields.zoomNomeFilial})`,
    ).not.toBe(payloadLimpo.formFields.campoDescritor);

    // Confirmado em campo: classeOrca=133017 e classificacao="Tecnologia" em TODO item dos
    // DOIS contratos — produtos completamente diferentes (manutenção de elevador vs.
    // dedetização) recebendo a mesma classificação orçamentária fixa.
    const itensLimpo = extrairItens(payloadLimpo.formFields);
    const itensMedio = extrairItens(payloadMedio.formFields);

    const classificacoesLimpo = new Set(itensLimpo.map((i) => `${i.tbprod_classeOrca}|${i.tbprod_classificacao}`));
    const classificacoesMedio = new Set(itensMedio.map((i) => `${i.tbprod_classeOrca}|${i.tbprod_classificacao}`));

    expect(
      [...classificacoesMedio],
      `classeOrca/classificacao deveriam variar com o contrato — LIMPO usa sempre ${[...classificacoesLimpo].join(', ')}`,
    ).not.toEqual([...classificacoesLimpo]);
  });
});

test.describe('Payload de start — integridade dos valores e do rateio (CT-ACC-08-S1 / CT-ACC-08-S2)', () => {
  test('os valores monetários devem ser numericamente coerentes, sem NaN, sem casa perdida e sem inflação', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    const captura = await capturarEnvioSolicitacao(page);

    await abrirPreencherEConfirmar(page, contratosPage, solicitacaoModal);
    const payload = await captura.aguardarPayload(0);
    expect(captura.tentativas()).toBe(1);

    const itens = extrairItens(payload.formFields);
    expect(itens.length).toBeGreaterThan(0);

    for (const item of itens) {
      const precoUnitario = paraNumero(item.tbprod_precoUnitario);
      const valorTotal = paraNumero(item.tbprod_valorTotal);
      const quantidade = Number(item.tbprod_quantidade);

      expect(Number.isFinite(precoUnitario), `item #${item.indice}: precoUnitario inválido ("${item.tbprod_precoUnitario}")`).toBe(
        true,
      );
      expect(Number.isFinite(valorTotal), `item #${item.indice}: valorTotal inválido ("${item.tbprod_valorTotal}")`).toBe(true);
      expect(Number.isFinite(quantidade), `item #${item.indice}: quantidade inválida ("${item.tbprod_quantidade}")`).toBe(true);

      // quantidade × preço unitário precisa bater com o total do PRÓPRIO item (a máscara
      // BR não pode ter corrompido casas decimais nem inflado o valor na conversão).
      expect(
        valorTotal,
        `item #${item.indice}: quantidade(${quantidade}) × precoUnitario(${precoUnitario}) ≠ valorTotal(${valorTotal})`,
      ).toBeCloseTo(precoUnitario * quantidade, 1);
    }
  });

  test('as linhas de rateio devem trazer percentual, centro de custo e classe de valor preenchidos, somando 100%', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    const captura = await capturarEnvioSolicitacao(page);

    await abrirPreencherEConfirmar(page, contratosPage, solicitacaoModal);
    const payload = await captura.aguardarPayload(0);
    expect(captura.tentativas()).toBe(1);

    const itens = extrairItens(payload.formFields);
    expect(itens.length).toBeGreaterThan(0);

    for (const item of itens) {
      const linhasRateio = extrairRateio(item.tbprod_jsonrateio).map(normalizarLinhaRateio);
      expect(linhasRateio.length, `item #${item.indice} não trouxe nenhuma linha de rateio`).toBeGreaterThan(0);

      let somaPercentual = 0;
      for (const linha of linhasRateio) {
        expect(linha.tbRatCC_codCCusto, `item #${item.indice}: linha de rateio sem centro de custo`).toBeTruthy();
        expect(linha.tbRatCC_classeValor, `item #${item.indice}: linha de rateio sem classe de valor`).toBeTruthy();
        expect(linha.tbRatCC_Rateio, `item #${item.indice}: linha de rateio sem percentual`).toBeTruthy();
        somaPercentual += Number(linha.tbRatCC_Rateio);
      }

      expect(somaPercentual, `item #${item.indice}: rateio soma ${somaPercentual}%, deveria somar 100%`).toBeCloseTo(100, 1);
    }
  });

  test('classeValor do item deveria vir preenchido junto com classeOrca e classificação', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    // Achado adicional observado na captura (fora da checagem de rateio acima): o campo de
    // classificação de valor NO NÍVEL DO ITEM (`tbprod_classeValor`, irmão de
    // `tbprod_classeOrca`/`tbprod_classificacao` — não a classeValor de cada LINHA de
    // rateio, que vem preenchida) chega sempre vazio, nos dois contratos observados.
    const captura = await capturarEnvioSolicitacao(page);

    await abrirPreencherEConfirmar(page, contratosPage, solicitacaoModal);
    const payload = await captura.aguardarPayload(0);
    expect(captura.tentativas()).toBe(1);

    const itens = extrairItens(payload.formFields);
    const semClasseValor = itens.filter((item) => !item.tbprod_classeValor || String(item.tbprod_classeValor).trim() === '');

    expect(
      semClasseValor.map((i) => `#${i.indice}`),
      'tbprod_classeValor do item veio vazio (classeOrca e classificacao vieram preenchidos no mesmo item)',
    ).toHaveLength(0);
  });
});

test.describe('Payload de start — duplo clique (CT-ACC-04-S3)', () => {
  test('duplo clique em Confirmar não deve disparar duas requisições de start', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    // Este caso NÃO pode usar a captura padrão, e a razão importa.
    //
    // A proteção antiduplo-clique do widget é: desabilitar o botão, enviar, e reabilitar se
    // der erro. Uma interceptação que ABORTA a requisição faz o widget tratar como erro e
    // reabilitar o botão na hora — destruindo justamente o estado que se quer observar.
    // Foi o que aconteceu nas duas primeiras versões deste teste: o vermelho era artefato do
    // método, não defeito do produto.
    //
    // A forma fiel é SEGURAR a requisição "em voo": o handler registra a tentativa e fica
    // pendente, exatamente como uma chamada real que ainda não respondeu. Nada é enviado ao
    // servidor — a requisição morre dentro do Playwright quando liberamos com abort.
    /** @type {string[]} */
    const tentativas = [];
    /** @type {() => void} */
    let liberar = () => {};
    const emVoo = new Promise((resolve) => {
      liberar = /** @type {() => void} */ (resolve);
    });

    await page.route('**/process-management/**', async (route, req) => {
      if (req.method() === 'GET') return route.fallback();

      // Segurar TODA escrita em process-management travaria a própria carga do portal (ele
      // faz chamadas de contagem no load) e o teste falharia antes de chegar ao modal.
      // Só a criação da SC fica pendurada; o resto é abortado na hora, sem chegar ao servidor.
      if (!req.url().includes('/start')) return route.abort('blockedbyclient');

      tentativas.push(`${req.method()} ${req.url()}`);
      await emVoo;
      await route.abort('blockedbyclient');
    });

    try {
      await contratosPage.goto();
      await contratosPage.expectCarregada();
      const contrato = await descobrirContratoVigente(contratosPage);
      await contratosPage.filtrarPorContrato(contrato.contrato);
      await contratosPage.abrirSolicitacaoCompra();
      await solicitacaoModal.expectAberto();
      await solicitacaoModal.preencher(criarSolicitacaoCompra());

      await solicitacaoModal.botaoConfirmar.click();

      // Com a criação de fato em voo, a proteção fica observável: o botão vai a
      // `disabled`, e um segundo clique do usuário simplesmente não é aceito.
      // (Confirmado no trace: o HTML passa a `disabled="disabled"` e o Playwright recusa
      // o clique com "element is not enabled" — que é o comportamento correto.)
      await expect(solicitacaoModal.botaoConfirmar).toBeDisabled();

      // E o efeito que protege o negócio: uma única tentativa de criação saiu.
      await expect
        .poll(() => tentativas.length, {
          message: `tentativas de start capturadas: ${tentativas.join(', ') || '(nenhuma)'}`,
          timeout: 20_000,
        })
        .toBe(1);
    } finally {
      // Libera o handler mesmo se a assertion falhar, para não travar o teardown.
      liberar();
    }
  });
});

test.describe('Payload de start — número de contrato incoerente (CT-ACC-04-S5)', () => {
  test('não deve permitir que nrContrato divirja do contrato real da revisão/filial/itens enviados', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    // Passo 1: captura o payload GENUÍNO do contrato de referência — é a base para provar a
    // incoerência sem precisar de nenhum valor hardcoded (revisão, filial e itens reais
    // continuam sendo o que o ambiente já define para esse contrato).
    const capturaReferencia = await capturarEnvioSolicitacao(page);
    const contratoReferencia = await abrirPreencherEConfirmar(page, contratosPage, solicitacaoModal);
    const payloadReferencia = await capturaReferencia.aguardarPayload(0);
    expect(capturaReferencia.tentativas()).toBe(1);

    await solicitacaoModal.botaoFechar.click();
    await expect(solicitacaoModal.getDialog()).toBeHidden();

    // Passo 2: abre a SC em OUTRO contrato e força via JS o campo `numeroContrato`
    // (disabled) para o número do contrato de referência — simula o único jeito de a interface
    // enviar um valor que ela nunca permitiria digitar.
    const capturaIncoerente = await capturarEnvioSolicitacao(page);
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    const outroContrato = await descobrirContratoVigente(contratosPage, {
      filialDiferenteDe: contratoReferencia.filial,
      excluirContratos: [contratoReferencia.contrato],
    });
    await contratosPage.filtrarPorContrato(outroContrato.contrato);
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();

    await solicitacaoModal.campoContrato.evaluate((/** @type {HTMLInputElement} */ el, novoValor) => {
      el.disabled = false;
      el.value = novoValor;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.disabled = true;
    }, contratoReferencia.contrato);

    await solicitacaoModal.preencher(criarSolicitacaoCompra());
    await solicitacaoModal.confirmar();
    const payloadIncoerente = await capturaIncoerente.aguardarPayload(0);
    expect(capturaIncoerente.tentativas()).toBe(1);

    // A força via JS precisa ter "pegado": nrContrato saiu com o número do MEDIO.
    expect(payloadIncoerente.formFields.nrContrato).toBe(contratoReferencia.contrato);

    // Esperado (coerência): se o servidor recebe nrContrato de um contrato, a revisão, a
    // filial e os itens devem ser DESSE MESMO contrato — nunca uma mistura. Comparado
    // contra o payload genuíno do MEDIO capturado no passo 1.
    expect(
      payloadIncoerente.formFields.revisaContrato,
      `nrContrato aponta para o MEDIO (revisão real "${payloadReferencia.formFields.revisaContrato}"), ` +
        `mas revisaContrato enviado foi "${payloadIncoerente.formFields.revisaContrato}"`,
    ).toBe(payloadReferencia.formFields.revisaContrato);

    expect(
      payloadIncoerente.formFields.codFilial,
      `nrContrato aponta para o MEDIO (filial real "${payloadReferencia.formFields.codFilial}"), ` +
        `mas codFilial enviado foi "${payloadIncoerente.formFields.codFilial}"`,
    ).toBe(payloadReferencia.formFields.codFilial);

    const itensReferencia = extrairItens(payloadReferencia.formFields);
    const itensIncoerente = extrairItens(payloadIncoerente.formFields);

    expect(
      itensIncoerente.length,
      `nrContrato aponta para o MEDIO (${itensReferencia.length} itens reais), mas o payload enviou ${itensIncoerente.length} itens`,
    ).toBe(itensReferencia.length);
  });
});
