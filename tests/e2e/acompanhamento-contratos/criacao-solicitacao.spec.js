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

/**
 * CT-ACC-04-S4 (dois contratos clicados em sequência rápida) foi INVESTIGADO e NÃO foi
 * implementado — motivo técnico: reproduzido com clique NATIVO duplo (DOM `.click()` nos dois
 * ícones no mesmo tick, já que um clique gerenciado pelo Playwright no primeiro dispara um
 * overlay que impede fisicamente um segundo clique noutra linha), o desfecho da corrida é
 * genuinamente NÃO-DETERMINÍSTICO no próprio produto — confirmado com `--repeat-each=3`
 * (2 reprovações e 1 aprovação da mesma execução, mesmo código). Uma tentativa de tornar o
 * cenário determinístico substituindo a resposta do dataset de itens (devolvendo os itens de
 * um contrato diferente do exibido) mostrou que o widget filtra client-side por `CNB_CONTRA` —
 * item substituído nunca chegou ao payload — ou seja, essa substituição testa uma proteção que
 * FUNCIONA, não o defeito observado ao vivo. Sem uma forma de forçar deterministicamente qual
 * clique “vence” a corrida real, qualquer teste fiel ao cenário descrito fica flaky por
 * construção — o que a suíte não aceita. Ver relatório final para detalhe completo.
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

    // A listagem pode levar alguns segundos para indexar uma SC recém-criada — poll limitado
    // e observável, nunca `waitForTimeout` fixo, distingue "ainda não indexou" de "nunca vai
    // aparecer" (o que aqui SERIA um sintoma ainda mais grave de D-01).
    await expect
      .poll(() => minhasSolicitacoes.localizarPorProcessInstanceId(processInstanceId), {
        message: `SC ${processInstanceId} deveria aparecer em "Solicitadas por mim"`,
        timeout: 60_000,
      })
      .toBeTruthy();
    const registro = await minhasSolicitacoes.localizarPorProcessInstanceId(processInstanceId);

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

    // `capturarEnvioSolicitacao` deixa a interceptação de `process-management` ativa (aborta
    // tudo) — sem remover, os dois disparos diretos abaixo seriam abortados também, e nunca
    // chegariam ao servidor de verdade.
    await page.unroute('**/process-management/**');

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
