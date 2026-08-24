// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { descobrirContratoVigente } from '../../../utils/massa-contratos.js';
import { criarSolicitacaoCompra } from '../../../factories/solicitacao-compra.js';
import { capturarEnvioSolicitacao, extrairItens } from '../../../utils/captura-payload.js';
import { MinhasSolicitacoesPage } from '../../../pages/MinhasSolicitacoesPage.js';

/**
 * Casos destrutivos do Portal de Acompanhamento de Contratos que só existem CRIANDO de
 * verdade — diferente de `payload-solicitacao.spec.js`, que prova D-01/D-02/D-04 capturando e
 * ABORTANDO o `start`. Aqui a escrita é deliberada e autorizada (`docs/politica-de-escrita.md`):
 * ambiente de homologação, não usado pelo cliente.
 *
 * Todo teste que chega a clicar Confirmar leva `@destrutivo` no título e cria uma SC real e
 * rastreável (motivo com prefixo `QA` + sufixo único, vindo de `factories/solicitacao-compra.js`).
 * O número de cada SC criada é anotado no relatório da execução (`testInfo.annotations`).
 *
 * ⚠️ D-03 (contrato de 177 itens que já travou o navegador) é o motivo de todo teste aqui usar
 * `descobrirContratoVigentePequeno` em vez de `descobrirContratoVigente` puro: o tamanho do
 * contrato é medido por uma chamada direta ao MESMO dataset que o modal consome
 * (`dsProtheus_getItensPlanilha_restGetAll`, via `fetch` na própria página) — sem nunca abrir
 * um modal para descobrir o tamanho. Só depois de confirmado "pequeno" é que a UI é acionada.
 */

/** Acima disso, o contrato é tratado como arriscado (ver D-03) e descartado do candidato. */
const LIMITE_ITENS_SEGURO = 50;

/**
 * Busca os itens de um contrato diretamente no dataset do Protheus, sem passar pela UI —
 * a mesma chamada que o modal de Solicitação de Compra dispara ao abrir
 * (`dsProtheus_getItensPlanilha_restGetAll`), mas feita de propósito ANTES de qualquer clique
 * que abriria/renderizaria o modal. É o que permite medir o tamanho de um contrato (D-03) e
 * inspecionar itens zerados (CT-ACC-06-S1) sem nunca arriscar renderizar um contrato gigante.
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('../../../pages/AcompanhamentoContratosPage.js').LinhaDeContrato} linha
 * @returns {Promise<Array<Record<string, any>>>}
 */
async function buscarItensSemAbrirModal(page, linha) {
  return page.evaluate(
    async ({ contrato, filial, revisao }) => {
      const constraints = [
        { _field: 'CorporateId', _initialValue: '01', _finalValue: '01', _type: 1, _likeSearch: false },
        { _field: 'BranchId', _initialValue: filial, _finalValue: filial, _type: 1, _likeSearch: false },
        { _field: 'CNB_FILIAL', _initialValue: filial, _finalValue: filial, _type: 1, _likeSearch: false },
        { _field: 'CNB_CONTRA', _initialValue: contrato, _finalValue: contrato, _type: 1, _likeSearch: false },
        { _field: 'CNB_REVISA', _initialValue: revisao, _finalValue: revisao, _type: 1, _likeSearch: false },
      ];
      const resp = await fetch('/api/public/ecm/dataset/datasets', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'dsProtheus_getItensPlanilha_restGetAll', constraints }),
      });
      if (!resp.ok) return [];
      const json = await resp.json().catch(() => null);
      return json?.content?.values ?? [];
    },
    { contrato: linha.contrato, filial: linha.filial, revisao: linha.revisao },
  );
}

/**
 * `descobrirContratoVigente` + verificação de tamanho ANTES de tocar a UI (ver D-03). Tenta
 * algumas vezes, excluindo candidatos grandes ou vazios, até achar um contrato pequeno.
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('../../../pages/AcompanhamentoContratosPage.js').AcompanhamentoContratosPage} contratosPage
 * @param {import('../../../utils/massa-contratos.js').CriterioDeContrato} [criterio]
 * @returns {Promise<{ contrato: import('../../../pages/AcompanhamentoContratosPage.js').LinhaDeContrato, itens: Array<Record<string, any>> }>}
 */
async function descobrirContratoVigentePequeno(page, contratosPage, criterio = {}) {
  const excluir = new Set(criterio.excluirContratos ?? []);
  for (let tentativa = 0; tentativa < 8; tentativa += 1) {
    const candidato = await descobrirContratoVigente(contratosPage, { ...criterio, excluirContratos: [...excluir] });
    const itens = await buscarItensSemAbrirModal(page, candidato);
    excluir.add(candidato.contrato);
    if (itens.length > 0 && itens.length <= LIMITE_ITENS_SEGURO) {
      return { contrato: candidato, itens };
    }
  }
  throw new Error(
    `PRÉ-CONDIÇÃO AUSENTE: não foi possível achar, em 8 tentativas, um contrato vigente com até ` +
      `${LIMITE_ITENS_SEGURO} itens (medido sem abrir modal). Isto NÃO é o defeito D-03 sendo ` +
      'reproduzido — é a suíte se recusando a arriscar abrir um contrato potencialmente gigante.',
  );
}

test.describe('Confirmar cria a SC e ela deveria chegar ao solicitante (CT-ACC-05-H / D-01)', () => {
  test('@destrutivo a SC deveria nascer atribuída ao solicitante logado, não à conta de integração', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }, testInfo) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    const { contrato } = await descobrirContratoVigentePequeno(page, contratosPage);
    await contratosPage.filtrarPorContrato(contrato.contrato);
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();
    await solicitacaoModal.preencher(criarSolicitacaoCompra());

    const respostaPromise = page.waitForResponse((r) => r.url().includes('/wf_solicitacao_compras/start'));
    await solicitacaoModal.confirmar();
    const resposta = await respostaPromise;

    expect(resposta.status(), 'o start deveria responder 200').toBe(200);
    const corpoResposta = await resposta.json();
    const processInstanceId = corpoResposta.processInstanceId;
    expect(processInstanceId, 'a resposta deveria trazer processInstanceId').toBeTruthy();
    testInfo.annotations.push({ type: 'sc-criada', description: String(processInstanceId) });

    // Toast "Processo N iniciado com sucesso!"
    await expect(
      page.getByText(new RegExp(`Processo ${processInstanceId} iniciado com sucesso`)),
    ).toBeVisible();

    // O modal fecha.
    await expect(solicitacaoModal.getDialog()).toBeHidden();

    // A SC deveria aparecer em Central de Tarefas > Solicitações > Solicitadas por mim, com
    // o USUÁRIO como responsável — não a conta de integração (D-01).
    const minhasSolicitacoes = new MinhasSolicitacoesPage(page);
    await minhasSolicitacoes.goto();
    const registro = await minhasSolicitacoes.localizarPorProcessInstanceId(processInstanceId);

    expect(registro, `SC ${processInstanceId} deveria aparecer em "Solicitadas por mim"`).toBeTruthy();

    expect(
      registro?.colleagueName,
      `a SC ${processInstanceId} nasceu com responsável "${registro?.colleagueName}" — deveria ser ` +
        'o solicitante logado (ou uma etapa/pool legítima), não a conta de integração',
    ).not.toBe('Usuário Integrador Fluig');

    expect(
      registro?.stateDescription,
      `a SC ${processInstanceId} ficou parada em "${registro?.stateDescription}" (marco de Início do ` +
        'BPMN) — deveria avançar para uma etapa de trabalho',
    ).not.toBe('Início');
  });
});

test.describe('Itens zerados descartados silenciosamente (CT-ACC-06-S1)', () => {
  test('@destrutivo item de quantidade/valor zerado no contrato não deveria virar item extra na SC criada', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }, testInfo) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    // Descobre, sem abrir nenhum modal, um contrato pequeno com pelo menos um item de
    // quantidade ou valor zerado/vazio no Protheus.
    /** @type {{ contrato: import('../../../pages/AcompanhamentoContratosPage.js').LinhaDeContrato, itens: Array<Record<string, any>> } | null} */
    let alvo = null;
    const excluir = new Set();
    for (let tentativa = 0; tentativa < 15 && !alvo; tentativa += 1) {
      const candidato = await descobrirContratoVigente(contratosPage, { excluirContratos: [...excluir] });
      excluir.add(candidato.contrato);
      const itensBrutos = await buscarItensSemAbrirModal(page, candidato);
      if (itensBrutos.length === 0 || itensBrutos.length > LIMITE_ITENS_SEGURO) continue;

      const temZerado = itensBrutos.some((i) => !(Number(i.CNB_QUANT) > 0) || !(Number(i.CNB_VLTOT) > 0));
      if (temZerado) alvo = { contrato: candidato, itens: itensBrutos };
    }

    expect(
      alvo,
      'PRÉ-CONDIÇÃO AUSENTE: nenhum contrato vigente pequeno com item de quantidade/valor ' +
        'zerado foi encontrado em 15 tentativas — não é defeito, é ausência de massa hoje.',
    ).toBeTruthy();
    if (!alvo) return; // apenas para o checkJs — a linha acima já falhou o teste

    const itensValidos = alvo.itens.filter((i) => Number(i.CNB_QUANT) > 0 && Number(i.CNB_VLTOT) > 0);
    const itensZerados = alvo.itens.filter((i) => !(Number(i.CNB_QUANT) > 0 && Number(i.CNB_VLTOT) > 0));
    expect(itensZerados.length, 'o contrato escolhido deveria ter ao menos 1 item zerado').toBeGreaterThan(0);

    await contratosPage.filtrarPorContrato(alvo.contrato.contrato);
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();
    await solicitacaoModal.preencher(criarSolicitacaoCompra());

    /** @type {Record<string, any> | null} */
    let corpoEnviado = null;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/wf_solicitacao_compras/start')) {
        corpoEnviado = req.postDataJSON();
      }
    });

    const respostaPromise = page.waitForResponse((r) => r.url().includes('/wf_solicitacao_compras/start'));
    await solicitacaoModal.confirmar();
    const resposta = await respostaPromise;
    expect(resposta.status()).toBe(200);
    const processInstanceId = (await resposta.json()).processInstanceId;
    testInfo.annotations.push({ type: 'sc-criada', description: String(processInstanceId) });

    expect(corpoEnviado, 'o corpo do start deveria ter sido capturado antes de ir ao servidor').toBeTruthy();
    const itensNaSC = extrairItens(/** @type {any} */ (corpoEnviado).formFields);

    expect(
      itensNaSC.length,
      `contrato ${alvo.contrato.contrato}: Protheus tem ${alvo.itens.length} itens ` +
        `(${itensValidos.length} válidos + ${itensZerados.length} zerados), mas a SC criada trouxe ` +
        `${itensNaSC.length} — item(ns) zerado(s) deveria(m) ter sido descartado(s), não repassado(s) ` +
        'como item da solicitação',
    ).toBe(itensValidos.length);
  });
});

test.describe('Dois contratos clicados em sequência rápida (CT-ACC-04-S4)', () => {
  test('@destrutivo a SC criada deveria conter os itens e o nrContrato do ÚLTIMO contrato clicado', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }, testInfo) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    const primeiro = await descobrirContratoVigentePequeno(page, contratosPage);
    const segundo = await descobrirContratoVigentePequeno(page, contratosPage, {
      excluirContratos: [primeiro.contrato.contrato],
      filialDiferenteDe: primeiro.contrato.filial,
    });

    const indices = await page.evaluate(
      ([contratoA, contratoB]) => {
        const trs = [...document.querySelectorAll('tbody tr')];
        const acha = (/** @type {string} */ c) => trs.findIndex((tr) => (tr.textContent ?? '').includes(c));
        return { idxA: acha(contratoA), idxB: acha(contratoB) };
      },
      [primeiro.contrato.contrato, segundo.contrato.contrato],
    );
    expect(indices.idxA, `linha do contrato ${primeiro.contrato.contrato} não encontrada na grade`).toBeGreaterThanOrEqual(0);
    expect(indices.idxB, `linha do contrato ${segundo.contrato.contrato} não encontrada na grade`).toBeGreaterThanOrEqual(0);

    // Clique NATIVO (DOM .click(), não o clique gerenciado pelo Playwright) nos dois ícones,
    // disparado no mesmo tick. É a única forma de reproduzir "sequência muito rápida": um
    // clique normal do Playwright no primeiro já dispara um overlay bloqueante (efeito
    // colateral da abertura do modal) que IMPEDE fisicamente um segundo clique numa outra
    // linha — confirmado em campo (segundo clique trava em "element intercepts pointer events").
    await page.evaluate(
      ([idxA, idxB]) => {
        const linhas = document.querySelectorAll('tbody tr');
        /** @type {HTMLElement | null} */ (linhas[idxA]?.querySelector('[title="Solicitação de Compra"]'))?.click();
        /** @type {HTMLElement | null} */ (linhas[idxB]?.querySelector('[title="Solicitação de Compra"]'))?.click();
      },
      [indices.idxA, indices.idxB],
    );

    await solicitacaoModal.expectAberto();
    await expect(solicitacaoModal.campoContrato).not.toHaveValue('');
    await solicitacaoModal.preencher(criarSolicitacaoCompra());

    /** @type {Record<string, any> | null} */
    let corpoEnviado = null;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/wf_solicitacao_compras/start')) {
        corpoEnviado = req.postDataJSON();
      }
    });

    const respostaPromise = page.waitForResponse((r) => r.url().includes('/wf_solicitacao_compras/start'));
    await solicitacaoModal.confirmar();
    const resposta = await respostaPromise;
    expect(resposta.status()).toBe(200);
    const processInstanceId = (await resposta.json()).processInstanceId;
    testInfo.annotations.push({ type: 'sc-criada', description: String(processInstanceId) });

    expect(corpoEnviado, 'o corpo do start deveria ter sido capturado').toBeTruthy();
    const formFields = /** @type {any} */ (corpoEnviado).formFields;
    const nrContratoEnviado = formFields.nrContrato;

    expect(
      [primeiro.contrato.contrato, segundo.contrato.contrato],
      'nrContrato enviado deveria ser um dos dois contratos clicados',
    ).toContain(nrContratoEnviado);

    // Esperado: o ÚLTIMO clicado (segundo) — é o que a mensagem da tarefa exige.
    expect(
      nrContratoEnviado,
      `esperado nrContrato do ÚLTIMO clicado (${segundo.contrato.contrato}), mas a SC foi enviada ` +
        `com nrContrato="${nrContratoEnviado}"`,
    ).toBe(segundo.contrato.contrato);

    // Coerência: os PRODUTOS efetivamente enviados devem pertencer ao contrato declarado em
    // nrContrato — nunca uma mistura entre o que foi buscado (itensPlanilha) e o que foi
    // exibido/enviado como número de contrato.
    const itensEnviados = extrairItens(formFields);
    const produtosEnviados = itensEnviados.map((i) => i.tbprod_produto).filter(Boolean);
    const dadosDoContratoDeclarado = nrContratoEnviado === primeiro.contrato.contrato ? primeiro : segundo;
    const produtosEsperados = new Set(dadosDoContratoDeclarado.itens.map((i) => i.CNB_PRODUT));
    const produtosInesperados = produtosEnviados.filter((p) => !produtosEsperados.has(p));

    expect(
      produtosInesperados,
      `nrContrato enviado foi ${nrContratoEnviado}, mas os produtos enviados incluem ` +
        `${JSON.stringify(produtosInesperados)}, que não pertencem a esse contrato no Protheus ` +
        `(produtos esperados: ${JSON.stringify([...produtosEsperados])})`,
    ).toHaveLength(0);
  });
});

test.describe('Bypass da validação de cliente no start direto (CT-ACC-04-S6 / D-10)', () => {
  test('@destrutivo o servidor deveria recusar tipoSolicitacao vazio tanto quanto recusa motivoSolCompra vazio', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }, testInfo) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    const { contrato } = await descobrirContratoVigentePequeno(page, contratosPage);
    await contratosPage.filtrarPorContrato(contrato.contrato);
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();
    await solicitacaoModal.preencher(criarSolicitacaoCompra());

    // Captura o payload genuíno como TEMPLATE — capturado e ABORTADO, não cria nada aqui.
    const captura = await capturarEnvioSolicitacao(page);
    await solicitacaoModal.confirmar();
    const template = await captura.aguardarPayload(0);
    expect(captura.tentativas()).toBe(1);

    await solicitacaoModal.botaoFechar.click();
    await expect(solicitacaoModal.getDialog()).toBeHidden();

    const startUrl = '/process-management/api/v2/processes/wf_solicitacao_compras/start';

    /**
     * Dispara o start DIRETO, no contexto da própria página (fetch same-origin herda os
     * headers reais que o widget usa, inclusive o `Authorization: Bearer` lido do cookie
     * `jwt.token` — sem ele o gateway responde 403 antes mesmo de validar o corpo).
     * @param {Record<string, any>} payload
     */
    async function dispararStart(payload) {
      return page.evaluate(
        async ({ url, payload }) => {
          const jwt = document.cookie
            .split('; ')
            .find((c) => c.startsWith('jwt.token='))
            ?.split('=')[1];
          const resp = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Authorization: jwt ? `Bearer ${jwt}` : '',
              'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify(payload),
          });
          return { status: resp.status, body: await resp.text() };
        },
        { url: startUrl, payload },
      );
    }

    // CASO 1: tipoSolicitacao vazio — a UI já bloqueia isso como obrigatório.
    const payloadTipoVazio = JSON.parse(JSON.stringify(template));
    payloadTipoVazio.formFields.tipoSolicitacao = '';
    const resultadoTipoVazio = await dispararStart(payloadTipoVazio);
    if (resultadoTipoVazio.status === 200) {
      const idCriado = JSON.parse(resultadoTipoVazio.body)?.processInstanceId;
      testInfo.annotations.push({ type: 'sc-criada (bypass tipoSolicitacao vazio)', description: String(idCriado) });
    }

    // CASO 2: motivoSolCompra vazio — mesma obrigatoriedade na UI.
    const payloadMotivoVazio = JSON.parse(JSON.stringify(template));
    payloadMotivoVazio.formFields.motivoSolCompra = '';
    const resultadoMotivoVazio = await dispararStart(payloadMotivoVazio);
    if (resultadoMotivoVazio.status === 200) {
      const idCriado = JSON.parse(resultadoMotivoVazio.body)?.processInstanceId;
      testInfo.annotations.push({ type: 'sc-criada (bypass motivoSolCompra vazio)', description: String(idCriado) });
    }

    // Confirmado em campo: motivoSolCompra vazio é recusado pelo servidor com 500 e mensagem
    // clara ("O campo Justificativa para a Solicitação é obrigatório!"). tipoSolicitacao
    // vazio NÃO é — o servidor aceita com 200 e cria a SC mesmo assim (D-10): a validação de
    // cliente do modal não tem contraparte no servidor para este campo.
    expect(
      resultadoTipoVazio.status,
      'tipoSolicitacao vazio deveria ser recusado pelo servidor (como motivoSolCompra vazio é), ' +
        `mas respondeu ${resultadoTipoVazio.status}: ${resultadoTipoVazio.body.slice(0, 300)}`,
    ).not.toBe(200);

    expect(
      resultadoMotivoVazio.status,
      `motivoSolCompra vazio deveria ser recusado — respondeu ${resultadoMotivoVazio.status}: ` +
        resultadoMotivoVazio.body.slice(0, 300),
    ).toBe(500);
  });
});

test.describe('Segunda SC para o mesmo contrato/revisão sem alerta de duplicidade (CT-E2E-12-S1)', () => {
  test('@destrutivo o portal deveria alertar sobre a SC já em andamento para o mesmo contrato/revisão', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }, testInfo) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    const { contrato } = await descobrirContratoVigentePequeno(page, contratosPage);
    await contratosPage.filtrarPorContrato(contrato.contrato);
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();
    await solicitacaoModal.preencher(criarSolicitacaoCompra());

    const resposta1Promise = page.waitForResponse((r) => r.url().includes('/wf_solicitacao_compras/start'));
    await solicitacaoModal.confirmar();
    const resposta1 = await resposta1Promise;
    expect(resposta1.status()).toBe(200);
    const processInstanceId1 = (await resposta1.json()).processInstanceId;
    testInfo.annotations.push({ type: 'sc-criada', description: String(processInstanceId1) });
    await expect(solicitacaoModal.getDialog()).toBeHidden();

    // Reabre o modal do MESMO contrato/revisão logo em seguida.
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    await contratosPage.filtrarPorContrato(contrato.contrato);
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();

    // Esperado: algum aviso mencionando a SC já em andamento. Hoje não há nenhum —
    // verificado em campo, o portal deixa abrir e criar uma segunda sem avisar.
    const algumAviso = page.getByText(new RegExp(`${processInstanceId1}|em andamento|já existe|já possui`, 'i'));
    await expect(
      algumAviso,
      `nenhum aviso apareceu ao reabrir a SC do contrato ${contrato.contrato}, mesmo já existindo ` +
        `a solicitação ${processInstanceId1} em andamento para o mesmo contrato/revisão`,
    ).toBeVisible({ timeout: 5_000 });
  });
});
