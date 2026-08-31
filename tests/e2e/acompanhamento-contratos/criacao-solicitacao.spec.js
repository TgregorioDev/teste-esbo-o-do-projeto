// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { descobrirContratoVigente } from '../../../utils/massa-contratos.js';
import { criarSolicitacaoCompra, QUALQUER_TIPO_VALIDO } from '../../../factories/solicitacao-compra.js';
import { capturarEnvioSolicitacao, extrairItens } from '../../../utils/captura-payload.js';
import { MinhasSolicitacoesPage } from '../../../pages/MinhasSolicitacoesPage.js';
import { esperarStartDaSolicitacao } from '../../../utils/espera-start.js';

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
  // 15 tentativas, e não 8: desde que `descobrirContratoVigente` distribui a escolha entre os
  // 554 contratos vigentes (em vez de devolver sempre os primeiros da grade), a amostra deixou
  // de cair sistematicamente nos mesmos candidatos. Cada tentativa é uma leitura de dataset
  // (~0,1s, sem abrir modal), então ampliar a amostra custa pouco e evita `PRÉ-CONDIÇÃO
  // AUSENTE` por azar de sorteio.
  const MAX_TENTATIVAS = 15;
  for (let tentativa = 0; tentativa < MAX_TENTATIVAS; tentativa += 1) {
    const candidato = await descobrirContratoVigente(contratosPage, { ...criterio, excluirContratos: [...excluir] });
    const itens = await buscarItensSemAbrirModal(page, candidato);
    excluir.add(candidato.contrato);
    if (itens.length > 0 && itens.length <= LIMITE_ITENS_SEGURO) {
      return { contrato: candidato, itens };
    }
  }
  throw new Error(
    `PRÉ-CONDIÇÃO AUSENTE: não foi possível achar, em ${MAX_TENTATIVAS} tentativas, um contrato vigente com até ` +
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
    await solicitacaoModal.preencher(criarSolicitacaoCompra({ tipo: QUALQUER_TIPO_VALIDO }));

    const resposta = await esperarStartDaSolicitacao(page, () => solicitacaoModal.confirmar());

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
    // aparecer" (o que aqui SERIA um sintoma ainda mais grave de D-01). Ver
    // `MinhasSolicitacoesPage`: a varredura é DECRESCENTE por `processInstanceId` porque a
    // listagem pagina por cursor e, em ordem crescente, uma SC recém-criada nunca é alcançada —
    // foi o que produzia `Received: null` aqui sem dizer a causa.
    // O resultado é guardado numa propriedade (e não numa variável solta) porque o `checkJs`
    // não enxerga a atribuição feita dentro do callback do poll e estreitaria o tipo para `never`.
    /** @type {{ solicitacao: Record<string, any> | null }} */
    const achado = { solicitacao: null };
    await expect
      .poll(
        async () => {
          achado.solicitacao = await minhasSolicitacoes.localizarPorProcessInstanceId(processInstanceId);
          return achado.solicitacao !== null;
        },
        {
        message:
          `SC ${processInstanceId} não apareceu em "Solicitadas por mim" em 60s. A varredura é ` +
          'decrescente por `processInstanceId` (a SC recém-criada é a de maior id, então estaria ' +
          'nas primeiras páginas) e só devolve `null` depois de a listagem já ter descido abaixo ' +
          'desse id — logo, não é limitação de paginação da leitura. Resta: ou o servidor ainda ' +
          'não indexou a solicitação, ou ela não foi registrada como solicitação DESTE usuário',
          timeout: 60_000,
        },
      )
      .toBe(true);

    const registro = achado.solicitacao;

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

/**
 * CT-ACC-06-S1 — item sem quantidade e sem valor no contrato não pode virar item da SC.
 *
 * ⚠️ O nome deste bloco já foi "Itens zerados descartados silenciosamente", herdado do
 * enunciado do catálogo. Ele descrevia o comportamento que a revisão de código previa
 * (regra R8: `quant <= 0 || vlunit <= 0` é filtrado e os itens são reindexados) — e dizia o
 * OPOSTO do que a assertion cobra. Medido em campo em 26/08/2026, o descarte não acontece, e
 * a causa é a interação de duas regras do próprio serviço:
 *
 *   R9 `resolveQuant` resolve a quantidade em cascata:
 *       CNB_QUANT → CNB_QTDORI → CNB_QTRDRZ → **fallback 1 (serviços)**
 *   R8 filtra depois: `quant > 0 && vlunit > 0`
 *
 * No contrato 000000000000001 (SERVICOS TELEFONICOS, portanto serviços) há dois itens com
 * CNB_QUANT, CNB_QTDORI e CNB_QTRDRZ **todos vazios** e CNB_VLUNIT = 1. A R9 fabrica
 * quantidade 1 para eles; a R8 então vê `1 > 0 && 1 > 0` e os aprova. O filtro nunca chega a
 * descartar nada — a cascata preencheu o campo que o filtro iria reprovar.
 *
 * Evidência direta, capturando o payload do start sem criar SC: dos 7 itens enviados, cinco
 * vão com `tbprod_quantidade: "29"` (os reais) e **dois com `"1"`** (os fabricados).
 *
 * Por que é defeito e não detalhe: a SC chega ao comprador com duas linhas do mesmo produto
 * sem valor no contrato e com quantidade inventada. Ou alguém percebe e apaga à mão, ou o
 * pedido nasce com linhas que não existem no contrato de origem. Some-se a D-02 (valor
 * replicado por item) e nem a contagem de linhas nem os valores da SC batem com o contrato.
 *
 * Este é também o caminho do caso irmão do catálogo, o que trata do fallback do `resolveQuant`
 * (seção CT-ACC-06 em `docs/catalogo-casos.md`): a massa para exercitá-lo EXISTE, é este
 * contrato. O ID não é citado aqui de propósito — `scripts/gerar-cobertura.mjs` conta menção em
 * arquivo de teste como cobertura, e escrevê-lo faria a matriz declarar coberto um caso que não
 * tem teste. O motivo está registrado em MOTIVOS, no próprio script.
 */
test.describe('Item sem quantidade e sem valor no contrato não pode virar item da SC (CT-ACC-06-S1)', () => {
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
    await solicitacaoModal.preencher(criarSolicitacaoCompra({ tipo: QUALQUER_TIPO_VALIDO }));

    /** @type {Record<string, any> | null} */
    let corpoEnviado = null;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/wf_solicitacao_compras/start')) {
        corpoEnviado = req.postDataJSON();
      }
    });

    const resposta = await esperarStartDaSolicitacao(page, () => solicitacaoModal.confirmar());
    expect(resposta.status()).toBe(200);
    const processInstanceId = (await resposta.json()).processInstanceId;
    testInfo.annotations.push({ type: 'sc-criada', description: String(processInstanceId) });

    expect(corpoEnviado, 'o corpo do start deveria ter sido capturado antes de ir ao servidor').toBeTruthy();
    const itensNaSC = extrairItens(/** @type {any} */ (corpoEnviado).formFields);

    expect(
      itensNaSC.length,
      `contrato ${alvo.contrato.contrato}: o Protheus tem ${alvo.itens.length} itens ` +
        `(${itensValidos.length} com quantidade e valor + ${itensZerados.length} sem nenhum dos dois), ` +
        `mas a SC nasceu com ${itensNaSC.length}. Os itens sem quantidade não foram descartados: o ` +
        'serviço FABRICA quantidade para eles (cascata `resolveQuant` → fallback 1 em contrato de ' +
        `serviços) e com isso eles passam pelo filtro \`quant > 0\`. Quantidades enviadas: ` +
        `${JSON.stringify(itensNaSC.map((i) => i.tbprod_quantidade))}`,
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
    await solicitacaoModal.preencher(criarSolicitacaoCompra({ tipo: QUALQUER_TIPO_VALIDO }));

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

    // ⚠️ NESTE TESTE A TELA NÃO É O ORÁCULO — e a captura de tela induz ao erro se lida sem
    // contexto. Os dois disparos acima são `fetch` crus, feitos por `page.evaluate`: não passam
    // pelo widget, então não renderizam nada. O alerta "Erro ao iniciar processo" que aparece na
    // screenshot é resíduo do passo 1, quando `capturarEnvioSolicitacao` ABORTOU de propósito o
    // envio do widget para roubar o template. Ele não tem relação com o 200 que reprova o teste.
    //
    // A evidência real é o par requisição/resposta, e ela vai anexada abaixo. (No relatório
    // nativo ela também está na aba Network do trace: as três chamadas ao `/start` aparecem com
    // status -1 — a abortada —, 200 e 500.)
    await testInfo.attach('starts-diretos', {
      body: JSON.stringify(
        {
          'o que este teste mede':
            'se o SERVIDOR valida os campos que o modal marca como obrigatórios, quando o start ' +
            'é disparado direto, sem passar pela tela',
          'atenção':
            'a screenshot deste teste mostra um alerta de erro do passo de captura, que foi ' +
            'abortado de propósito. Ela não é evidência do resultado.',
          'tipoSolicitacao vazio': {
            status: resultadoTipoVazio.status,
            esperado: 'recusa (4xx/5xx)',
            corpo: resultadoTipoVazio.body.slice(0, 1200),
          },
          'motivoSolCompra vazio': {
            status: resultadoMotivoVazio.status,
            esperado: 500,
            corpo: resultadoMotivoVazio.body.slice(0, 1200),
          },
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });

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
    await solicitacaoModal.preencher(criarSolicitacaoCompra({ tipo: QUALQUER_TIPO_VALIDO }));

    const resposta1 = await esperarStartDaSolicitacao(page, () => solicitacaoModal.confirmar(), {
      contexto: 'primeira SC do par que testa o alerta de duplicidade',
    });
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

/**
 * "25.920,00" → 25920 — o payload da SC usa BR-money para não corromper a máscara do form.
 * @param {unknown} texto
 * @returns {number}
 */
function lerBrMoney(texto) {
  return Number(String(texto ?? '').replace(/\./g, '').replace(',', '.'));
}

/**
 * Contrato de serviço com item que exercita a CASCATA de quantidade: `CNB_QUANT` vazio e
 * `CNB_QTDORI` preenchido. Descoberto pela característica, nunca fixado por número — contrato
 * é massa de leitura e pode ser finalizado/revisado a qualquer momento.
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('../../../pages/AcompanhamentoContratosPage.js').AcompanhamentoContratosPage} contratosPage
 */
async function descobrirContratoComCascataDeQuantidade(page, contratosPage) {
  const excluir = new Set();
  for (let tentativa = 0; tentativa < 15; tentativa += 1) {
    const candidato = await descobrirContratoVigente(contratosPage, { excluirContratos: [...excluir] });
    excluir.add(candidato.contrato);

    const itens = await buscarItensSemAbrirModal(page, candidato);
    if (itens.length === 0 || itens.length > LIMITE_ITENS_SEGURO) continue;

    const comCascata = itens.find(
      (i) => !(Number(i.CNB_QUANT) > 0) && Number(i.CNB_QTDORI) > 0,
    );
    if (comCascata) return { contrato: candidato, itens, itemComCascata: comCascata };
  }
  return null;
}

/**
 * CT-ACC-06-S2 — contrato de serviço sem quantidade.
 *
 * O catálogo pede duas coisas do serviço quando `CNB_QUANT` vem vazio:
 *  1. resolver a quantidade pela cascata `CNB_QUANT → CNB_QTDORI → CNB_QTRDRZ → 1 (serviços)`;
 *  2. **não** deixar o item nascer valendo R$ 1,00 quando o contrato tem valor relevante — o
 *     `CNB_VLUNIT = 1` desses itens é preenchimento provisório, não preço. Levar o 1,00 adiante
 *     contamina o Total Estimado a Aprovar da Validação Orçamentária.
 *
 * Medido em 26/08/2026 (contrato de HIGIENIZAÇÃO/LAVANDERIA, item com `CNB_QUANT` vazio,
 * `CNB_QTDORI` = 36 e `CNB_VLUNIT` = 1): o payload sai com `tbprod_quantidade: "36"`,
 * `tbprod_precoUnitario: "720,00"` e `tbprod_valorTotal: "25.920,00"`. Ou seja, **as duas
 * exigências são atendidas hoje** — este teste é guarda de regressão, e fica verde.
 *
 * Não escreve: o start é capturado e ABORTADO (`capturarEnvioSolicitacao`), então a afirmação
 * é sobre o payload que o cliente monta, sem criar SC nenhuma.
 */
test.describe('Quantidade e valor em contrato de serviço sem CNB_QUANT (CT-ACC-06-S2)', () => {
  test('CT-ACC-06-S2 — item sem quantidade no contrato deve herdar a cascata e o preço real, nunca R$ 1,00', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    const alvo = await descobrirContratoComCascataDeQuantidade(page, contratosPage);
    expect(
      alvo,
      'PRÉ-CONDIÇÃO AUSENTE: nenhum contrato vigente pequeno com item de `CNB_QUANT` vazio e ' +
        '`CNB_QTDORI` preenchido foi encontrado em 15 tentativas — sem essa massa não há como ' +
        'exercitar a cascata de quantidade. Não é defeito do produto.',
    ).toBeTruthy();
    if (!alvo) return; // apenas para o checkJs

    const quantidadeEsperada = String(Number(alvo.itemComCascata.CNB_QTDORI));

    await contratosPage.filtrarPorContrato(alvo.contrato.contrato);
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();
    await solicitacaoModal.preencher(criarSolicitacaoCompra({ tipo: QUALQUER_TIPO_VALIDO }));

    const captura = await capturarEnvioSolicitacao(page);
    await solicitacaoModal.confirmar();
    const payload = await captura.aguardarPayload();
    const itens = extrairItens(payload.formFields);

    const item = itens.find((i) => String(i.tbprod_quantidade) === quantidadeEsperada);
    expect(
      item,
      `contrato ${alvo.contrato.contrato}: o item tem CNB_QUANT vazio e CNB_QTDORI=` +
        `${quantidadeEsperada}, então a SC deveria trazer essa quantidade pela cascata ` +
        '(CNB_QUANT → CNB_QTDORI → CNB_QTRDRZ → 1). Quantidades enviadas: ' +
        `${JSON.stringify(itens.map((i) => i.tbprod_quantidade))}`,
    ).toBeDefined();
    if (!item) return; // apenas para o checkJs

    // O `CNB_VLUNIT = 1` do contrato é preenchimento provisório. Se ele vazar para a SC, o item
    // nasce valendo R$ 1,00 e a Validação Orçamentária aprova um total que não é o do contrato.
    expect(
      String(item.tbprod_precoUnitario),
      `contrato ${alvo.contrato.contrato}: o item nasceu na SC valendo R$ 1,00 — o CNB_VLUNIT=1 ` +
        'do contrato é preenchimento provisório e não pode ser usado como preço. Isso contamina ' +
        'o Total Estimado a Aprovar da Validação Orçamentária',
    ).not.toBe('1,00');

    // Coerência interna, que vale para qualquer contrato: não existe oráculo externo para o
    // valor (nem a grade nem o payload expõem o total do contrato), então a afirmação é que
    // total = quantidade × preço unitário. Ver a regra no CLAUDE.md.
    const esperado = Number(item.tbprod_quantidade) * lerBrMoney(item.tbprod_precoUnitario);
    expect(
      lerBrMoney(item.tbprod_valorTotal),
      `contrato ${alvo.contrato.contrato}: valor total incoerente — ` +
        `${item.tbprod_quantidade} × ${item.tbprod_precoUnitario} deveria dar ${esperado}, ` +
        `mas o payload trouxe ${item.tbprod_valorTotal}`,
    ).toBeCloseTo(esperado, 2);
  });

  /**
   * ⚠️ QUESTÃO EM ABERTO, deliberadamente NÃO virou assertion (26/08/2026).
   *
   * Este contrato aparece na grade com **revisão vazia**. Consultando
   * `dsProtheus_getItensPlanilha_restGetAll` com `CNB_REVISA=""` — que é o que a grade oferece e
   * o que o widget usa — vêm **1 item**. Consultando a mesma chave com `CNB_REVISA="001"` vêm
   * **2**: o segundo tem `CNB_QUANT`, `CNB_QTDORI` e `CNB_QTRDRZ` vazios e `CNB_VLUNIT` = 60.
   * A massa M4 do catálogo descreve justamente "4101 / 000000000000002 / rev 001".
   *
   * Chegamos a escrever um teste afirmando "item do contrato sumiu da SC em silêncio". Ele
   * PASSAVA — e por tautologia: comparava o payload contra um baseline vindo da MESMA consulta
   * de revisão vazia, então os dois eram 1. Um teste que só pode concordar consigo mesmo não
   * prova nada, e foi removido.
   *
   * O que precisa ser respondido antes de virar teste: revisão vazia significa "sem revisão
   * vigente" (e aí 1 item é o conjunto correto) ou a grade é que não expõe a revisão (e aí a SC
   * nasce cobrindo menos que o contrato)? A segunda hipótese conversa com o defeito já
   * catalogado de `revisaContrato` sair vazio no payload. Enquanto não houver resposta da Cassi,
   * afirmar qualquer um dos dois seria inventar oráculo.
   */
});
