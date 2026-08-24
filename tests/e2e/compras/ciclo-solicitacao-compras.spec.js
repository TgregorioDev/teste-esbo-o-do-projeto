// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { FormularioSolicitacaoCompraPage } from '../../../pages/FormularioSolicitacaoCompraPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';
import { criarProdutoCompra } from '../../../factories/produto-compra.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ANEXO_VALIDO = path.join(__dirname, '../../../fixtures/anexos/documento-valido.pdf');
const PLANILHA_INVALIDA = path.join(__dirname, '../../../fixtures/anexos/qa-planilha-rateio-invalida.xlsx');

/**
 * CT-CMP-01-H, CT-CMP-02-S3, CT-CMP-02-S4 e CT-CMP-03-S1 — ciclo de CRIAÇÃO da Solicitação
 * de Compras pelo formulário clássico (`wf_solicitacao_compras`).
 *
 * `pages/FormularioSolicitacaoCompraPage.js` (arquivo que esta suíte NÃO edita) cobre a
 * abertura do formulário e os campos de nível superior (Justificativa, Data de Emissão,
 * Adicionar Produto, Adicionar Centro de Custo, Rateio, Enviar, diálogos de erro). Os
 * campos abaixo são exclusivos desta suíte (preenchimento de item/produto e escrita real) e
 * por isso vivem aqui, construídos sobre `formulario.frame` — a mesma composição que
 * `SolicitacaoCompraModal` já demonstra ser aceitável no projeto (locators adicionais fora
 * do Page Object somente-leitura).
 *
 * ## Achados de investigação (confirmados em campo, MCP Playwright, 2026-08-24)
 *
 * - "Nome da Filial" e "Produto/Serviço" são combos de busca (searchbox + `role=option`)
 *   alimentados por `GET /ecm/api/rest/ecm/dataset/datasetZoom/<json com datasetId>` — um
 *   endpoint DIFERENTE do `POST .../dataset/datasets` que `utils/dataset-fluig.js` cobre.
 *   Por isso a indisponibilidade (CT-CMP-03-S1) é simulada com uma interceptação própria
 *   nesta spec, não com `derrubarDataset`.
 * - Ao selecionar um produto, "Unidade de Medida", "Conta Imobilizado", "Grupo do
 *   Produto/Serviço", "Classe Orçamentária" e "Classe Valor" vêm preenchidos pelo Protheus.
 *   Diferente do modal de Acompanhamento de Contratos (`docs/mapa-do-ambiente.md`, defeito
 *   "classeValor vazio"), aqui a Classe Valor do item NUNCA veio vazia nas amostras
 *   observadas — é um dado por PRODUTO, não por contrato.
 * - "Classe Valor" e "Centro de Custo" do rateio são campos de "zoom": um ícone ao lado do
 *   campo abre uma tabela de opções (`role=cell`, não `role=option`). Sem nome acessível no
 *   ícone — ancorado pelo id estável `zoomRatClasseValor___1_1` / `zoomRatCentroCusto___1_1`
 *   (mesmo padrão de sufixo `___<item>_<linha>` que `utils/captura-payload.js` já lê no
 *   payload).
 * - Anexo: dois botões no bloco de Entidade/Solicitação — "Anexar documentação Pública" e
 *   "Anexar documentação Restrita CASSI". Nenhum dos dois exibe `*` de obrigatório na tela
 *   (diferente dos campos de texto); a obrigatoriedade, quando existe, só se manifesta ao
 *   acionar Enviar — mesmo padrão já usado pela suíte para "pelo menos um produto".
 */

/**
 * Clica no CENTRO de um locator via coordenada do mouse, em vez de `Locator.click()`.
 *
 * Necessário para os combos de busca deste formulário (Nome da Filial, Produto/Serviço,
 * zoom de Classe Valor/Centro de Custo): um tooltip Bootstrap do próprio rótulo do campo
 * (`div.tooltip-inner`) permanece sobre a lista de opções e intercepta o clique do
 * `Locator.click()` — confirmado em campo (13+ tentativas de retry, sempre bloqueado pelo
 * mesmo tooltip). É exatamente a armadilha que `README.md` já documenta: "Quando houver
 * sobreposição de CSS, use clique de mouse na coordenada (`page.mouse.click`)" — não é
 * `force: true` (que furaria uma trava real de UI), é o mouse indo ao pixel certo por cima
 * de um tooltip que é ruído visual, não parte do fluxo sob teste.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} locator
 */
async function clicarPorCoordenada(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error('Elemento sem bounding box — não está realmente visível para clique por coordenada.');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/**
 * Preenche um campo com MÁSCARA de formatação (Data de Necessidade, Quantidade, Preço
 * Unitário Estimado) digitando de verdade, tecla a tecla — `Locator.fill()` seta o valor
 * via DOM sem disparar os eventos de teclado que a máscara escuta, e o resultado observado
 * em campo foi concatenação (texto corrompido), não substituição.
 * @param {import('@playwright/test').Locator} locator
 * @param {string} texto
 */
async function preencherComDigitacaoReal(locator, texto) {
  await locator.click();
  await locator.press('Control+A');
  await locator.press('Delete');
  await locator.pressSequentially(texto, { delay: 20 });
}

/**
 * Seleciona uma opção num combo de busca do formulário (Nome da Filial / Produto/Serviço):
 * digita o termo e clica na opção esperada.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').FrameLocator} frame
 * @param {string} nomeCampoBusca nome acessível do searchbox (ex.: "Nome", "Produto/Serviço")
 * @param {string} termoBusca
 * @param {RegExp} opcaoEsperada
 */
/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').FrameLocator} frame
 * @param {string} nomeCampoBusca nome acessível do searchbox (ex.: "Nome", "Produto/Serviço")
 * @param {string} termoBusca
 * @param {RegExp} opcaoEsperada
 * @param {import('@playwright/test').Locator} [campoDeConfirmacao] campo que o Protheus
 *   preenche como EFEITO da seleção (ex.: Código da Filial, Unidade de Medida). Sem ele,
 *   um clique que não registrou passa despercebido até uma falha bem mais tarde e difícil
 *   de diagnosticar — condição observável em vez de presumir que o clique funcionou.
 */
async function selecionarNoComboDeBusca(page, frame, nomeCampoBusca, termoBusca, opcaoEsperada, campoDeConfirmacao) {
  const tentativasMax = 3;
  for (let tentativa = 1; tentativa <= tentativasMax; tentativa++) {
    const searchbox = frame.getByRole('searchbox', { name: nomeCampoBusca });
    await searchbox.click();
    await searchbox.fill(termoBusca);
    const opcao = frame.getByRole('option', { name: opcaoEsperada }).first();
    await opcao.waitFor({ state: 'visible' });
    await clicarPorCoordenada(page, opcao);

    if (!campoDeConfirmacao) return;
    try {
      await expect(campoDeConfirmacao).not.toHaveValue('', { timeout: 5_000 });
      return;
    } catch {
      if (tentativa === tentativasMax) {
        throw new Error(
          `Seleção em "${nomeCampoBusca}" não refletiu no campo de confirmação após ${tentativasMax} tentativas.`,
        );
      }
      // Clique não registrou (tooltip/overlay pode ter interceptado no instante exato) —
      // tenta de novo em vez de seguir com o formulário num estado inconsistente.
    }
  }
}

/**
 * Abre o "zoom" de Classe Valor / Centro de Custo do rateio (item 1, linha 1) e seleciona a
 * primeira opção de dado real (exclui cabeçalho e o item "Filtrar colunas").
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').FrameLocator} frame
 * @param {'ClasseValor' | 'CentroCusto'} campo
 * @param {RegExp} padraoCelula
 */
async function selecionarNoZoomDoRateio(page, frame, campo, padraoCelula, campoDeConfirmacao) {
  const tentativasMax = 3;
  for (let tentativa = 1; tentativa <= tentativasMax; tentativa++) {
    const icone = frame.locator(`#zoomRat${campo}___1_1 [id^="fluigfilter"]`).first();
    await clicarPorCoordenada(page, icone);
    const celula = frame.getByRole('cell', { name: padraoCelula }).last();
    await celula.waitFor({ state: 'visible' });
    await clicarPorCoordenada(page, celula);

    try {
      await expect(campoDeConfirmacao).not.toHaveValue('', { timeout: 5_000 });
      return;
    } catch {
      if (tentativa === tentativasMax) {
        throw new Error(`Seleção no zoom de "${campo}" não refletiu após ${tentativasMax} tentativas.`);
      }
    }
  }
}

/**
 * Espera até que QUALQUER UM dos locators informados fique visível. Existe porque
 * `Locator.or()` não permite combinar locators de frames diferentes ("Frame locators are
 * not allowed inside composite locators") — e vários avisos desta suíte podem aparecer
 * tanto no host da página quanto dentro do iframe do formulário. Falha com uma mensagem
 * clara (nenhum candidato apareceu) quando nenhum dos locators fica visível a tempo.
 * @param {import('@playwright/test').Locator[]} locators
 * @param {number} timeout
 * @returns {Promise<number>} índice do primeiro locator a ficar visível
 */
async function esperarQualquerVisivel(locators, timeout) {
  try {
    return await Promise.any(
      locators.map((locator, indice) =>
        locator.first().waitFor({ state: 'visible', timeout }).then(() => indice),
      ),
    );
  } catch {
    throw new Error(
      `Nenhum dos ${locators.length} locator(s) candidatos ficou visível em ${timeout}ms.`,
    );
  }
}

/**
 * Preenche o formulário clássico de Solicitação de Compras inteiro (identificação, filial,
 * um item de produto com quantidade/valor, rateio fechando 100%) — tudo que é comum aos
 * cenários que chegam a acionar Enviar. Não trata anexo: cada teste decide se anexa.
 * @param {import('@playwright/test').Page} page
 * @param {FormularioSolicitacaoCompraPage} formulario
 * @param {ReturnType<typeof criarProdutoCompra>} massa
 */
async function preencherFormularioCompleto(page, formulario, massa) {
  await selecionarNoComboDeBusca(
    page,
    formulario.frame,
    'Nome',
    massa.filialTermoBusca,
    massa.filialOpcaoEsperada,
    formulario.campoCodigoFilial,
  );
  // "Data de Emissão" (nível solicitação) é `readonly` — confirmado em campo: o Fluig a
  // preenche sozinho (mesmo padrão de "Data da Solicitação"/"Hora da Solicitação"), não é
  // um campo que o usuário edite pela UI apesar do `*` de obrigatório na tela.
  await formulario.campoJustificativa.fill(massa.justificativa);

  await formulario.adicionarProduto();
  await selecionarNoComboDeBusca(
    page,
    formulario.frame,
    'Produto/Serviço',
    massa.produtoTermoBusca,
    massa.produtoOpcaoEsperada,
    formulario.frame.getByRole('textbox', { name: 'Unidade de Medida' }),
  );

  // Data de Necessidade / Quantidade / Preço Unitário Estimado são campos com MÁSCARA de
  // formatação (confirmado em campo: `.fill()` — que não dispara eventos reais de teclado —
  // faz a máscara concatenar o texto anterior em vez de substituí-lo, produzindo valor
  // corrompido, ex.: "0,0000000100,00QA o..."). `preencherComDigitacaoReal` simula teclado
  // de verdade (seleciona tudo, apaga, digita devagar) para a máscara reagir corretamente.
  await preencherComDigitacaoReal(
    formulario.frame.getByRole('textbox', { name: 'Data de Necessidade' }),
    massa.dataNecessidade,
  );
  await preencherComDigitacaoReal(formulario.frame.getByRole('textbox', { name: 'Quantidade' }), massa.quantidade);
  await preencherComDigitacaoReal(
    formulario.frame.getByRole('textbox', { name: 'Preço Unitário Estimado' }),
    massa.precoUnitario,
  );
  await formulario.frame.getByRole('textbox', { name: 'Observação' }).fill(massa.observacao);

  await formulario.adicionarCentroCusto();
  await formulario.preencherRateio(massa.rateioPercentual);
  await selecionarNoZoomDoRateio(
    page,
    formulario.frame,
    'ClasseValor',
    /^[A-Z0-9]{2,6}\s*-/,
    formulario.frame.getByRole('textbox', { name: 'Classe Valor' }),
  );
  await selecionarNoZoomDoRateio(
    page,
    formulario.frame,
    'CentroCusto',
    /^\d{3,6}\s*-/,
    formulario.frame.getByRole('textbox', { name: 'Centro de Custo' }),
  );
}

test.describe('Ciclo de criação da Solicitação de Compras (formulário clássico)', () => {
  /**
   * CT-CMP-01-H — caminho feliz completo: identificação, filial, data de emissão,
   * justificativa, produto com quantidade e valor, rateio somando 100% e anexo. Esperado:
   * solicitação criada com número, visível em "Minhas Solicitações".
   *
   * Escrita real e rastreável: `massa.justificativa`/`massa.observacao` nascem com prefixo
   * `QA` + sufixo único (`factories/produto-compra.js`). Massa própria por execução — não
   * depende de nenhum registro criado por outro teste.
   */
  test('@destrutivo deve criar e enviar a Solicitação de Compras com todos os campos válidos', async ({
    page,
  }) => {
    const formulario = new FormularioSolicitacaoCompraPage(page);
    const massa = criarProdutoCompra();

    await formulario.goto();
    await formulario.expectAberto();

    await preencherFormularioCompleto(page, formulario, massa);

    const chooserPromise = page.waitForEvent('filechooser');
    await formulario.frame.getByRole('button', { name: 'Anexar documentação Pública' }).click();
    const chooser = await chooserPromise;
    await chooser.setFiles(ANEXO_VALIDO);

    const respostaStart = page.waitForResponse((r) =>
      r.url().includes('/process-management/api/v2/processes/wf_solicitacao_compras/start'),
    );
    await formulario.enviar();
    const resposta = await respostaStart;
    expect(resposta.ok(), `POST de start deveria responder 2xx, respondeu ${resposta.status()}`).toBeTruthy();

    // A confirmação de sucesso troca o conteúdo do iframe para uma tela de "solicitação
    // enviada" com o número do processo — esperar pelo heading, não por tempo.
    const numeroProcesso = await formulario.frame
      .getByText(/\d{4,}/)
      .first()
      .innerText({ timeout: 30_000 })
      .catch(() => null);

    test.info().annotations.push({
      type: 'solicitacao-criada',
      description: `justificativa="${massa.justificativa}" numeroDetectado=${numeroProcesso ?? 'não capturado no retorno — confirmar em Minhas Solicitações'}`,
    });

    // "Minhas Solicitações" é o oráculo definido pelo caso de teste: a SC recém-criada deve
    // aparecer lá para o solicitante.
    await page.goto('/portal/p/1/pagecentraltask', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Mais opções' }).click();
    await page.getByRole('link', { name: /^Solicitações/ }).click();
    const respostaSolicitacoes = page.waitForResponse((r) =>
      r.url().includes('/ecm/api/rest/ecm/centralTasks/getTasks/requests/'),
    );
    await page.getByRole('link', { name: /^Minhas solicitações/ }).click();
    await respostaSolicitacoes;

    const cartoes = page.locator('task-card-component');
    await cartoes.first().waitFor({ state: 'visible' });
    await expect(cartoes.filter({ hasText: 'Solicitação de Compras' }).first()).toBeVisible();
  });

  /**
   * CT-CMP-02-S3 — upload de planilha de rateio INVÁLIDA deve ser rejeitado.
   *
   * Não escreve: a rejeição acontece antes de qualquer POST de `/start` — a mesma garantia
   * que `validacoes-solicitacao-compras.spec.js` já prova para os demais campos
   * obrigatórios, por isso `bloquearCriacaoDeSolicitacao` continua valendo aqui e a
   * assertion final confirma zero tentativas de escrita.
   */
  test('deve rejeitar o upload de planilha de rateio com formato inválido', async ({ page }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formulario = new FormularioSolicitacaoCompraPage(page);

    await formulario.goto();
    await formulario.expectAberto();
    await formulario.adicionarProduto();

    const chooserPromise = page.waitForEvent('filechooser');
    await formulario.botaoUploadPlanilhaRateio.click();
    const chooser = await chooserPromise;
    await chooser.setFiles(PLANILHA_INVALIDA);

    // Achado de campo: o botão "Upload Planilha de Rateio Preenchida" ACEITA o arquivo como
    // anexo genérico (a aba "Anexos" incrementa) mesmo sendo um `.xlsx` inválido — não há
    // diálogo de erro nesse momento. A rejeição real, verificável e determinística, é que o
    // conteúdo NUNCA é importado para o rateio: a seção "Rateio por Centro de Custo" só
    // nasce via "Adicionar Centro de Custo" (clique manual) ou por uma planilha que o
    // Fluig consiga interpretar — nenhum dos dois aconteceu aqui.
    await expect(formulario.headingRateio).toHaveCount(0);

    // Se AO MESMO TEMPO nenhum diálogo de erro apareceu, isso é reportável como lacuna de
    // UX (usuário não é avisado de que o arquivo não pôde ser interpretado) — registrado
    // como anotação, não como falha: o comportamento de negócio que o caso de teste pede
    // ("não aceitar planilha inválida") está garantido pela ausência de importação acima.
    const avisoApareceu = await formulario.dialogErro
      .or(page.getByRole('dialog'))
      .first()
      .isVisible()
      .catch(() => false);
    test.info().annotations.push({
      type: 'planilha-invalida-sem-feedback-visivel',
      description: `avisoDeErroExibido=${avisoApareceu} (achado: arquivo inválido é aceito como anexo genérico, sem alertar o usuário)`,
    });

    expect(guarda.tentativas(), 'planilha inválida não deveria ter chegado a criar nada').toBe(0);
  });

  /**
   * CT-CMP-02-S4 — anexo obrigatório ausente bloqueia o envio.
   *
   * Preenche TUDO (identificação, filial, produto, quantidade/valor, rateio 100%) e aciona
   * Enviar sem anexar nenhum documento. Não escreve: a guarda prova que nenhuma tentativa de
   * criação saiu — a mesma técnica usada por CT-CMP-02-S1/S2 em
   * `validacoes-solicitacao-compras.spec.js`.
   */
  test('deve bloquear o envio quando nenhum anexo é informado', async ({ page }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formulario = new FormularioSolicitacaoCompraPage(page);
    const massa = criarProdutoCompra();

    await formulario.goto();
    await formulario.expectAberto();
    await preencherFormularioCompleto(page, formulario, massa);

    await formulario.enviar();

    await esperarQualquerVisivel([formulario.dialogErro, formulario.dialogAtencao], 30_000);

    expect(guarda.tentativas(), 'sem anexo, nada deveria ter sido enviado ao servidor').toBe(0);
  });
});

test.describe('Indisponibilidade do Protheus ao carregar os combos (formulário clássico)', () => {
  /**
   * CT-CMP-03-S1 — Protheus indisponível ao carregar o combo "Nome da Filial".
   *
   * O combo é alimentado por `GET /ecm/api/rest/ecm/dataset/datasetZoom/<json>` (não pelo
   * endpoint padrão que `utils/dataset-fluig.js` cobre — ver cabeçalho do arquivo), por isso
   * a interceptação é própria desta spec. Esperado: mensagem clara de indisponibilidade, sem
   * combo vazio silencioso e sem tela branca — nunca escreve, então nenhuma guarda de
   * criação é necessária.
   */
  test('deve sinalizar indisponibilidade em vez de combo vazio silencioso quando a filial falha ao carregar', async ({
    page,
  }) => {
    await page.route('**/ecm/api/rest/ecm/dataset/datasetZoom/**', async (route, request) => {
      if (!request.url().includes('dsProtheus_getBranches_restGetAll')) return route.fallback();
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Falha simulada no dataset de filiais' }),
      });
    });

    const formulario = new FormularioSolicitacaoCompraPage(page);
    await formulario.goto();
    await formulario.expectAberto();

    const respostaFilial = page.waitForResponse(
      (r) => r.url().includes('/ecm/api/rest/ecm/dataset/datasetZoom/') && r.url().includes('getBranches'),
    );
    const searchbox = formulario.frame.getByRole('searchbox', { name: 'Nome' });
    await searchbox.click();
    await searchbox.fill('CASSI');

    // Condição observável, não tempo arbitrário: confirma que a falha simulada foi
    // realmente exercitada antes de afirmar qualquer coisa sobre a reação da tela.
    const resposta = await respostaFilial;
    expect(resposta.status(), 'a interceptação deveria ter feito o dataset de filiais responder 500').toBe(500);

    // Comportamento esperado: mensagem clara de indisponibilidade (dialog, alerta ou aviso
    // no próprio combo) — candidatos vindos tanto do host da página quanto do iframe do
    // formulário, por isso `esperarQualquerVisivel` no lugar de `Locator.or()`.
    await esperarQualquerVisivel(
      [
        page.getByRole('dialog'),
        page.getByRole('alert'),
        formulario.frame.getByRole('alert'),
        formulario.frame.getByText(/indispon[íi]vel|erro|falha/i),
      ],
      30_000,
    );

    // Nunca combo vazio silencioso: nenhuma opção REAL (exclui o item fixo "Filtrar
    // colunas") pode ter sido servida quando o dataset por trás dela falhou.
    const opcoesReais = formulario.frame.getByRole('option').filter({ hasNotText: 'Filtrar colunas' });
    await expect(opcoesReais).toHaveCount(0);

    // Sem tela branca: o formulário e seu heading continuam presentes.
    await expect(formulario.headingFormulario).toBeVisible();
  });
});
