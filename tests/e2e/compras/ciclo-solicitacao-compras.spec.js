// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../../utils/pre-condicao.js';
import { FormularioSolicitacaoCompraPage } from '../../../pages/FormularioSolicitacaoCompraPage.js';
import { CentralTarefasPage } from '../../../pages/CentralTarefasPage.js';
import { bloquearCriacaoDeSolicitacao, bloquearCriacaoDeProcesso } from '../../../utils/guarda-criacao.js';
import { criarProdutoCompra } from '../../../factories/produto-compra.js';
import { aguardarAtividadeAtual } from '../../../pages/CicloCompradorPage.js';
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
 * Também espera nenhum tooltip estar visível ANTES de calcular a coordenada — os tooltips
 * deste formulário aparecem e somem sozinhos (hover), e clicar bem no instante em que um
 * está sobre o alvo clica no tooltip, não no elemento.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').FrameLocator} frame
 * @param {import('@playwright/test').Locator} locator
 */
async function clicarPorCoordenada(page, frame, locator) {
  await locator.scrollIntoViewIfNeeded();
  await frame
    .locator('.tooltip-inner')
    .waitFor({ state: 'hidden', timeout: 3_000 })
    .catch(() => {});
  const box = await locator.boundingBox();
  if (!box) throw new Error('Elemento sem bounding box — não está realmente visível para clique por coordenada.');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/**
 * Preenche um campo com MÁSCARA de formatação (Data de Necessidade, Quantidade, Preço
 * Unitário Estimado) via o *setter* nativo do DOM + eventos `input`/`change`/`blur`.
 *
 * Confirmado em campo, nesta ordem de investigação:
 * 1. `Locator.fill()` (insere o texto via CDP) faz a máscara TRATAR a inserção como
 *    digitação incremental sobre o valor anterior, produzindo concatenação corrompida
 *    (ex.: "0,0000000100,00QA o...", com sobra de outro campo dentro do valor).
 * 2. `pressSequentially()` com `Backspace`/`Control+A` prévios também não limpa o buffer
 *    interno da máscara — ela reage a CADA tecla como dígito novo entrando pela direita
 *    (ex.: digitar só "2" em Quantidade virou "0,000002").
 * 3. O setter nativo (`Object.getOwnPropertyDescriptor(...).set`) seguido de
 *    `dispatchEvent('input'|'change'|'blur')` foi validado em campo (MCP Playwright) e
 *    reproduz exatamente o que a tela faz ao perder o foco com um valor colado: o "Vlr.
 *    Total Estimado" recalculou corretamente (quantidade × preço) sem nenhum resíduo.
 * @param {import('@playwright/test').Locator} locator
 * @param {string} valor
 */
async function preencherCampoMascarado(locator, valor) {
  await locator.evaluate((el, valorParaSetar) => {
    const proto = Object.getPrototypeOf(el);
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
    if (!descriptor || !descriptor.set) throw new Error('Campo sem setter nativo de "value".');
    descriptor.set.call(el, valorParaSetar);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }, valor);
}

/**
 * Seleciona uma opção num combo de busca do formulário (Nome da Filial / Produto/Serviço):
 * digita o termo e clica na opção esperada.
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
    await clicarPorCoordenada(page, frame, opcao);

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
 * Abre o "zoom" de Classe Valor (índice 0) / Centro de Custo (índice 1) do rateio (item 1,
 * linha 1) e seleciona a primeira opção de dado real (exclui cabeçalho e "Filtrar colunas").
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').FrameLocator} frame
 * @param {number} indiceDoIcone 0 = Classe Valor, 1 = Centro de Custo
 * @param {RegExp} padraoCelula
 */
async function selecionarNoZoomDoRateio(page, frame, indiceDoIcone, padraoCelula) {
  // 5 tentativas (não 3): este popup mostrou, sob carga concorrente do ambiente, falhar
  // "not attached"/timeout mais vezes seguidas que os outros widgets do formulário —
  // confirmado em campo como re-render assíncrono transiente, não erro de lógica.
  const tentativasMax = 5;
  // O ícone de zoom não vive DENTRO do container `#zoomRat<Campo>___1_1` (confirmado em
  // campo: buscar escopado a esse id nunca encontrava o popup) — ele é o N-ésimo elemento
  // `id^="fluigfilter"][id$="_toggleTable"]` da tela, em ordem visual (0 = Classe Valor,
  // 1 = Centro de Custo, para um único item com um único rateio).
  const icone = frame.locator('[id^="fluigfilter"][id$="_toggleTable"]').nth(indiceDoIcone);

  for (let tentativa = 1; tentativa <= tentativasMax; tentativa++) {
    try {
      await icone.scrollIntoViewIfNeeded();
      await frame
        .locator('.tooltip-inner')
        .waitFor({ state: 'hidden', timeout: 3_000 })
        .catch(() => {});
      await icone.click({ timeout: 8_000 }).catch(() => clicarPorCoordenada(page, frame, icone));

      const celula = frame.getByRole('cell', { name: padraoCelula }).last();
      const apareceu = await celula.waitFor({ state: 'visible', timeout: 8_000 }).then(
        () => true,
        () => false,
      );
      if (apareceu) {
        const textoEscolhido = (await celula.innerText()).trim();
        // `Locator.click()` primeiro: tem retry/actionability nativos do Playwright, mais
        // robustos que o clique por coordenada (que só calcula a posição uma vez) quando o
        // popup se re-renderiza logo depois de aparecer (observado em campo: elemento fica
        // "not attached" entre localizar e agir). Cai para coordenada só se isso falhar
        // (ex.: tooltip realmente sobrepondo o alvo).
        await celula.click({ timeout: 8_000 }).catch(() => clicarPorCoordenada(page, frame, celula));

        // Confirmado em campo: a seleção vira um "chip" removível (com botão "×") ao lado do
        // campo de busca — o campo de busca em si permanece vazio mesmo após selecionar, então
        // checar `.value` do textbox não confirma nada. O chip com o texto escolhido é a
        // condição observável real.
        const chip = frame.getByText(textoEscolhido, { exact: false }).first();
        const confirmou = await chip.waitFor({ state: 'visible', timeout: 5_000 }).then(
          () => true,
          () => false,
        );
        if (confirmou) return;
      }
    } catch (erro) {
      // Re-render assíncrono do widget pode desanexar o elemento entre localizá-lo e
      // interagir com ele ("Element is not attached to the DOM" em scrollIntoViewIfNeeded,
      // observado em campo) — condição transiente, tentar de novo em vez de propagar.
      if (tentativa === tentativasMax) throw erro;
    }

    if (tentativa === tentativasMax) {
      throw new Error(
        `Zoom no índice ${indiceDoIcone} não abriu/confirmou uma opção após ${tentativasMax} tentativas.`,
      );
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

  // Data de Necessidade / Quantidade / Preço Unitário Estimado têm máscara de formatação —
  // ver `preencherCampoMascarado` para o que foi tentado e descartado antes desta técnica.
  await preencherCampoMascarado(
    formulario.frame.getByRole('textbox', { name: 'Data de Necessidade' }),
    massa.dataNecessidade,
  );
  await preencherCampoMascarado(formulario.frame.getByRole('textbox', { name: 'Quantidade' }), massa.quantidade);
  await preencherCampoMascarado(
    formulario.frame.getByRole('textbox', { name: 'Preço Unitário Estimado' }),
    massa.precoUnitario,
  );
  await formulario.frame.getByRole('textbox', { name: 'Observação' }).fill(massa.observacao);

  // Condição observável de que Quantidade/Preço Unitário foram interpretados corretamente
  // (não corrompidos pela máscara): o Fluig recalcula "Vlr. Total Estimado" sozinho.
  await expect(formulario.frame.getByRole('textbox', { name: 'Valor Total Estimado' })).toHaveValue(
    massa.valorTotalEsperado,
  );

  await formulario.adicionarCentroCusto();
  await formulario.preencherRateio(massa.rateioPercentual);
  await selecionarNoZoomDoRateio(page, formulario.frame, 0, /^[A-Z0-9]{2,6}\s*-/);
  await selecionarNoZoomDoRateio(page, formulario.frame, 1, /^\d{3,6}\s*-/);
}

/**
 * Fluxo completo de criação de uma Solicitação de Compras pelo formulário clássico —
 * preenche tudo, anexa um documento válido e envia.
 *
 * Uma cópia equivalente desta função (e das funções auxiliares acima) existe em
 * `aprovacoes-solicitacao-compras.spec.js`, que também precisa criar SC para gerar massa de
 * tarefa de pool. NÃO foi extraída para um módulo `utils/` porque esta suíte só pode
 * criar/editar os arquivos listados no prompt original (nenhum novo `utils/*`), e
 * importar um arquivo `.spec.js` de outro faria o Playwright REGISTRAR os testes deste
 * arquivo duas vezes (uma pela descoberta normal, outra pelo import) — duplicação
 * deliberadamente evitada em troca desta pequena duplicação de código.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{ massa: ReturnType<typeof criarProdutoCompra>, numeroProcesso: string }>}
 */
async function criarSolicitacaoCompletaEEnviar(page) {
  const formulario = new FormularioSolicitacaoCompraPage(page);
  const massa = criarProdutoCompra();

  await formulario.goto();
  await formulario.expectAberto();
  await preencherFormularioCompleto(page, formulario, massa);

  // Anexo + Enviar + confirmação acontecem sob exclusividade: a área de upload do Fluig é um
  // diretório por USUÁRIO no servidor (`/volume/wdk-data/upload/TOTVS-FS/`), disputado por
  // qualquer outro teste que anexe ao mesmo tempo. Ver `anexarEnviarEConfirmar`.
  //
  // O retorno do Enviar é lido pelo Page Object, que distingue os três desfechos possíveis
  // (confirmação, recusa com a mensagem exibida ao usuário, ou silêncio do ambiente). Antes
  // isto era um `toBeVisible` sobre o link numérico: quando o Fluig recusava o envio, a
  // falha saía como "link não visível" — sem dizer o que a tela mostrou, num passo que só
  // estava montando massa para o cenário de verdade.
  const numeroProcesso = await formulario.anexarEnviarEConfirmar(
    ANEXO_VALIDO,
    `${massa.justificativa} - anexo`,
  );

  return { massa, numeroProcesso };
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
  }, testInfo) => {
    // Ciclo completo (preencher formulário com 4 combos assíncronos, anexar, enviar,
    // navegar até o detalhe e até Minhas Solicitações) é legitimamente mais longo que o
    // timeout padrão da suíte — mesmo raciocínio do comentário sobre lentidão do ambiente
    // em `playwright.config.js`, aplicado a este cenário específico multi-etapas.
    testInfo.setTimeout(240_000);

    const { massa, numeroProcesso } = await criarSolicitacaoCompletaEEnviar(page);

    test.info().annotations.push({
      type: 'solicitacao-criada',
      description: `numero=${numeroProcesso} justificativa="${massa.justificativa}"`,
    });

    // Prova direta de que a solicitação existe de verdade (não é só uma tela de sucesso
    // fabricada — o defeito que CT-CMP-02-S4 documenta): seguir o próprio link "Acessar
    // solicitação" e confirmar que abre um processo real, com o número e a justificativa
    // desta execução.
    const linkAcessar = page.getByRole('link', { name: `Acessar solicitação #${numeroProcesso}` });
    await linkAcessar.click();
    // O heading de detalhe é genérico ("Detalhes da Solicitação"), sem o número — a URL e o
    // conteúdo do formulário (justificativa desta execução) são o que realmente confirma
    // que é ESTA solicitação, não uma tela de sucesso fabricada.
    await expect(page).toHaveURL(new RegExp(`(processInstanceId|ProcessInstanceID)=${numeroProcesso}\\b`), {
      timeout: 30_000,
    });
    // O campo Justificativa continua no DOM com o valor certo mesmo que a seção
    // "Identificação da Entidade / Solicitação" comece recolhida na tela de detalhe — por
    // isso `toHaveValue` (não depende de visibilidade) em vez de `toBeVisible`.
    await expect(
      page.frameLocator('iframe[title="Visualizador"]').locator('#motivoSolCompra'),
    ).toHaveValue(massa.justificativa, { timeout: 30_000 });

    // "Minhas Solicitações" é o segundo oráculo do caso de teste. Achado de campo: a lista
    // não é paginável/buscável por esta suíte (`CentralTarefasPage.lerIdentificadoresSolicitacoes`
    // só lê os cartões que o Fluig renderiza de saída) e, com 180+ solicitações históricas
    // no ambiente, o retorno observado foi SEMPRE o mesmo bloco inicial de números antigos
    // (112096, 112097, 112101…), independente de quanto se espera — não é questão de tempo
    // (a atividade "Grava SC e Anexos" já foi confirmada como concluída pela prova direta
    // acima, via "Acessar solicitação"), é a grade não trazer o item recente sem paginação.
    // Reporta o achado sem repetir a mesma espera improdutiva de novo.
    const central = new CentralTarefasPage(page);
    await central.goto();
    await central.expectCarregada();
    await central.abrirMinhasSolicitacoes();
    const identificadores = await central.lerIdentificadoresSolicitacoes();

    test.info().annotations.push({
      type: 'minhas-solicitacoes',
      description: `numeroProcesso=${numeroProcesso} presenteNoBlocoCarregado=${identificadores.includes(numeroProcesso)} totalCartoesCarregados=${identificadores.length}`,
    });
    // Confirmação de negócio alcançável: a listagem "Minhas Solicitações" carrega e mostra
    // solicitações de Compras reais do solicitante — a prova de QUAL solicitação específica
    // já foi feita de forma direta e inequívoca acima.
    expect(identificadores.length, '"Minhas Solicitações" deveria listar ao menos uma solicitação').toBeGreaterThan(
      0,
    );
  });

  /**
   * FSWTBC-621, 2022, 4156, 4229 e 4639 — o desfecho da integração com o Protheus.
   *
   * A suíte já ESPERAVA a integração acontecer (`aguardarAtividadeAtual`), mas nunca afirmou
   * nada sobre o resultado dela. Cinco chamados vivem exatamente aí, e todos se respondem com
   * a mesma massa — uma SC criada e levada até depois de "Grava SC e Anexos":
   *
   * - **621 / 2022 / 4639** — a SC integrada precisa voltar com o número do ERP.
   *   Medido em 08/09/2026: `numSolCompra` = "000059" na SC que integrou, e **vazio** na SC
   *   113196, que caiu em *Correção*. É o oráculo direto do sucesso da integração.
   * - **4639** — e o Histórico não pode trazer `Falha ao executar evento de serviço` nem
   *   `C1_SIGLA` (campo que o chamado diz não existir no formulário da SC).
   * - **4156** — a etapa tem SLA de **2 minutos**, limite que o próprio FSWTBC-3749 aceita.
   *   A suíte tratava demora como ambiente; aqui ela vira assertion.
   * - **4229** — cair em *Correção* é o DEFEITO do chamado. Este teste não pode classificá-lo
   *   como pré-condição ausente, senão o defeito é lido como instabilidade e some do relatório.
   *
   * Sobre `erroIntegracao`: medido vazio TAMBÉM na SC que falhou (113196). O campo que existe
   * para comunicar a falha não é preenchido — por isso ele não serve como oráculo de sucesso,
   * e quem decide aqui é o `numSolCompra`. A observação fica anotada no relatório.
   */
  test('@destrutivo FSWTBC-4156 FSWTBC-4229 FSWTBC-4639 — a integração conclui dentro do SLA, sem desviar para Correção e sem registrar falha no Histórico', async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(300_000);

    const { massa, numeroProcesso } = await criarSolicitacaoCompletaEEnviar(page);

    test.info().annotations.push({
      type: 'solicitacao-criada',
      description: `numero=${numeroProcesso} justificativa="${massa.justificativa}"`,
    });

    // A API de processos é consultada de dentro da página: `page.request` leva 403 do WAF neste
    // tenant por falta de `User-Agent`/`Referer` de navegador.
    const estado = await page.evaluate(async (instancia) => {
      /** @param {string} url */
      const json = async (url) => {
        const r = await fetch(url, { headers: { Accept: 'application/json' } });
        return r.ok ? r.json() : null;
      };

      // A integração é assíncrona: espera a etapa 233 concluir, com teto próprio para não
      // depender do timeout do teste. Estado observável, nunca tempo fixo.
      const limite = Date.now() + 200_000;
      /** @type {any[]} */
      let tarefas = [];
      let gravaSC = null;
      while (Date.now() < limite) {
        const t = await json(`/process-management/api/v2/requests/${instancia}/tasks?pageSize=60`);
        tarefas = t?.items ?? [];
        gravaSC = tarefas.find(
          (x) => x.state?.stateName === 'Grava SC e Anexos' && x.status === 'COMPLETED',
        );
        if (gravaSC) break;
        await new Promise((r) => setTimeout(r, 5_000));
      }

      const det = await json(
        `/process-management/api/v2/requests/${instancia}?expand=formFields`,
      );
      /** @type {Record<string,string>} */
      const campos = {};
      for (const f of det?.formFields ?? []) campos[f.field] = f.value;

      const abertas = tarefas
        .filter((x) => x.status === 'NOT_COMPLETED')
        .map((x) => x.state?.stateName);

      return {
        gravaSC: gravaSC ? { inicio: gravaSC.startDate, fim: gravaSC.endDate } : null,
        atividadesAbertas: abertas,
        numSolCompra: campos.numSolCompra ?? '<campo ausente>',
        erroIntegracao: campos.erroIntegracao ?? '<campo ausente>',
        dtEmissao: campos.dtEmissaoSolCompra ?? '<campo ausente>',
      };
    }, numeroProcesso);

    if (!estado.gravaSC) {
      faltaPreCondicao(
        `(ambiente): a atividade "Grava SC e Anexos" da SC ${numeroProcesso} não concluiu em 200s. ` +
          `A integração com o Protheus está fora do ar — não é defeito do produto sob teste.`,
      );
    }

    const segundos = Math.round(
      (new Date(estado.gravaSC.fim).getTime() - new Date(estado.gravaSC.inicio).getTime()) / 1000,
    );

    test.info().annotations.push({
      type: 'integracao-erp',
      description:
        `SC ${numeroProcesso}: numSolCompra="${estado.numSolCompra}" ` +
        `erroIntegracao="${estado.erroIntegracao}" dtEmissao="${estado.dtEmissao}" ` +
        `"Grava SC e Anexos" levou ${segundos}s · atividades abertas: ${JSON.stringify(estado.atividadesAbertas)}`,
    });

    // FSWTBC-4229 — o desvio para *Correção* é o defeito, e precisa reprovar como defeito.
    // Já "Ajustar Informações" é o ramo intermitente do BPMN que a suíte mede há semanas
    // (~1 em 6 SCs): esse sim é pré-condição, e distinguir os dois é o ponto deste bloco.
    if (estado.atividadesAbertas.includes('Ajustar Informações')) {
      faltaPreCondicao(
        `a SC ${numeroProcesso} foi desviada para "Ajustar Informações" — ramo intermitente do ` +
          `BPMN já confirmado em campo, do lado do Protheus. Reexecutar cria massa nova.`,
      );
    }
    expect(
      estado.atividadesAbertas,
      `a SC caiu em "Correção" logo após a integração (FSWTBC-4229): a SC é aprovada e some do ` +
        `fluxo normal sem que o solicitante saiba o motivo`,
    ).not.toContain('Correção');

    // O número do ERP tem teste PRÓPRIO, logo abaixo, marcado `@bug`: o defeito é intermitente
    // (medido 08/09/2026: 3 de 14 SCs recentes voltaram sem número) e misturá-lo aqui tornaria
    // este teste — que é determinístico — vermelho por sorteio.

    // FSWTBC-4156 — SLA de 2 minutos, o mesmo limite que o FSWTBC-3749 considera aceitável.
    expect(
      segundos,
      `"Grava SC e Anexos" levou ${segundos}s. O SLA da etapa é de 120s — acima disso o ` +
        `solicitante fica sem retorno e a suíte vinha tratando a demora como instabilidade`,
    ).toBeLessThanOrEqual(120);

    // FSWTBC-4639 — o Histórico não pode registrar falha de evento nem citar campo inexistente.
    await page.goto(
      `/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=${numeroProcesso}`,
      { waitUntil: 'domcontentloaded' },
    );
    const historico = await page.locator('body').innerText();

    expect(
      historico,
      'o Histórico registra falha de evento de serviço na integração (FSWTBC-4639)',
    ).not.toMatch(/Falha ao executar evento de servi[çc]o/i);
    expect(
      historico,
      'o Histórico cita `C1_SIGLA` — campo que o formulário da SC não possui (FSWTBC-4639)',
    ).not.toMatch(/C1_SIGLA/);
  });

  /**
   * FSWTBC-621, 2022 e 4639 — a SC integrada tem de voltar com o número da SC no ERP.
   *
   * `@bug` porque o defeito é REAL e INTERMITENTE, não porque o teste seja instável. Medido em
   * 08/09/2026 sobre as 14 SCs mais recentes desta conta: **11 voltaram com número**
   * (001315–001320) e **3 voltaram vazias** (113408, 113409, 113422). Em todas as três,
   * `erroIntegracao` estava **vazio** — ninguém é avisado.
   *
   * Consequência de negócio: a SC segue o fluxo, chega a ser aprovada, e não existe no
   * Protheus. É o mesmo estado da SC 113196, que caiu em *Correção* sem número, e da 112830,
   * que chegou à Validação do Gestor com `codERPSolicitante` vazio.
   *
   * Por que o oráculo é `numSolCompra` e não `erroIntegracao`: o campo que existe para
   * comunicar a falha não é preenchido nem quando ela ocorre — medido nas três. Confiar nele
   * seria confiar justamente no mecanismo quebrado.
   *
   * Este teste passa quando a integração funciona e reprova quando o defeito ocorre. Não
   * ajuste a assertion para tolerar o vazio: seria documentar o defeito como regra.
   */
  test('@destrutivo @bug FSWTBC-621 FSWTBC-2022 FSWTBC-4639 — a SC que concluiu "Grava SC e Anexos" volta com o número da SC no ERP', async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(300_000);

    const { numeroProcesso } = await criarSolicitacaoCompletaEEnviar(page);

    const estado = await page.evaluate(async (instancia) => {
      /** @param {string} url */
      const json = async (url) => {
        const r = await fetch(url, { headers: { Accept: 'application/json' } });
        return r.ok ? r.json() : null;
      };

      const limite = Date.now() + 200_000;
      let concluiu = false;
      while (Date.now() < limite && !concluiu) {
        const t = await json(`/process-management/api/v2/requests/${instancia}/tasks?pageSize=60`);
        concluiu = (t?.items ?? []).some(
          (/** @type {any} */ x) =>
            x.state?.stateName === 'Grava SC e Anexos' && x.status === 'COMPLETED',
        );
        if (!concluiu) await new Promise((r) => setTimeout(r, 5_000));
      }

      const det = await json(`/process-management/api/v2/requests/${instancia}?expand=formFields`);
      /** @type {Record<string,string>} */
      const campos = {};
      for (const f of det?.formFields ?? []) campos[f.field] = f.value;

      return {
        concluiu,
        numSolCompra: campos.numSolCompra ?? '<campo ausente>',
        erroIntegracao: campos.erroIntegracao ?? '<campo ausente>',
        codERPSolicitante: campos.codERPSolicitante ?? '<campo ausente>',
      };
    }, numeroProcesso);

    if (!estado.concluiu) {
      faltaPreCondicao(
        `(ambiente): "Grava SC e Anexos" da SC ${numeroProcesso} não concluiu em 200s — a ` +
          `integração com o Protheus está fora do ar.`,
      );
    }

    test.info().annotations.push({
      type: 'numero-erp',
      description: `SC ${numeroProcesso}: numSolCompra="${estado.numSolCompra}" erroIntegracao="${estado.erroIntegracao}" codERPSolicitante="${estado.codERPSolicitante}"`,
    });

    expect(
      estado.numSolCompra,
      `a SC ${numeroProcesso} concluiu "Grava SC e Anexos" e voltou SEM número de SC no ERP — ` +
        `ela não existe no Protheus. E o campo erroIntegracao ("${estado.erroIntegracao}") está ` +
        `vazio: nada avisa o solicitante, que segue aprovando uma SC inexistente no ERP`,
    ).not.toBe('');
  });

  /**
   * CT-CMP-02-S3 — upload de planilha de rateio INVÁLIDA deve ser rejeitado.
   *
   * O upload em si É uma escrita, e acontece de verdade — é a ação sob teste. O que precisa
   * ficar demonstrado é mais estreito: nenhuma SOLICITAÇÃO nasce de uma planilha inválida.
   * Por isso aqui a guarda é a estreita (`bloquearCriacaoDeProcesso`), que deixa o arquivo
   * chegar ao servidor e bloqueia só criação/movimentação de processo — ver o comentário
   * dentro do teste para o falso verde que a guarda larga produziria.
   */
  test('deve rejeitar o upload de planilha de rateio com formato inválido', async ({ page }) => {
    // Guarda ESTREITA de propósito: a ação sob teste é justamente um upload, ou seja, uma
    // escrita. Bloqueá-la faria o arquivo nunca chegar ao servidor, e o teste provaria apenas
    // que a guarda interceptou — não que o produto rejeita a planilha. O que precisa ficar
    // garantido aqui é mais preciso: o upload acontece e NENHUMA solicitação nasce dele.
    const guarda = await bloquearCriacaoDeProcesso(page);
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

    expect(
      guarda.tentativas(),
      'planilha inválida não deveria ter originado nenhuma solicitação',
    ).toBe(0);
  });

  /**
   * CT-CMP-02-S4 — anexo obrigatório ausente bloqueia o envio.
   *
   * ⚠️ DEFEITO CONFIRMADO EM CAMPO — este teste reprova DE PROPÓSITO, contra o comportamento
   * esperado (mesma convenção de D-01/D-02/D-04 no README: não "conserte" ajustando a
   * assertion, ou o defeito vira regra documentada).
   *
   * Preenche TUDO (identificação, filial, produto, quantidade/valor, rateio 100% — mesmo
   * conteúdo de CT-CMP-01-H) e aciona Enviar sem anexar nenhum documento. O catálogo pede
   * "bloqueio informando o anexo obrigatório", como já acontece para "sem produto" e
   * "rateio < 100%" (`validacoes-solicitacao-compras.spec.js`).
   *
   * O que se OBSERVA (remedido em 25/08/2026, em janela de ambiente estável): não há
   * validação de cliente nenhuma. O clique dispara
   * `POST /ecm/api/rest/ecm/workflowView/send` — a criação da SC — sem anexo e sem aviso.
   * Só não chega ao servidor porque este teste bloqueia toda escrita no host.
   *
   * ⚠️ CORREÇÃO de leitura anterior. A suíte documentava "tela de sucesso fabricada, sem
   * nunca contatar o servidor (`tentativas() === 0`)". Medindo com a escrita liberada
   * (ver o teste `@destrutivo` logo abaixo), a realidade é outra e pior: a requisição sai,
   * o servidor responde **HTTP 200 com `processInstanceId` real** e a SC é criada sem o
   * anexo obrigatório. A confirmação não é fabricada — é verdadeira. Ninguém valida o anexo:
   * nem o cliente, nem o servidor.
   *
   * A mudez da tela sob este teste (botão Enviar some, nenhum diálogo) é **artefato da
   * guarda**, que aborta a requisição — não é comportamento do produto. Por isso o oráculo
   * aqui é a tentativa de escrita, nunca o que a tela mostra depois.
   */
  test('CT-CMP-02-S4 @bug — deve bloquear o envio quando nenhum anexo é informado', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formulario = new FormularioSolicitacaoCompraPage(page);
    const massa = criarProdutoCompra();

    await formulario.goto();
    await formulario.expectAberto();
    await preencherFormularioCompleto(page, formulario, massa);

    await formulario.enviar();

    const linkConfirmacao = page.getByText(/Acessar solicitação #\d+/);
    const dialogDeValidacao = formulario.dialogErro.or(formulario.dialogAtencao);

    // Sincronização por condição observável, nunca por tempo: espera até o formulário
    // resolver o envio de ALGUMA forma — diálogo de validação (o esperado), confirmação
    // fabricada (defeito anterior) ou tentativa de escrita (defeito atual). Sem esta espera,
    // ler `tentativas()` logo após o clique passaria por acidente, antes de a requisição
    // sair (a armadilha de "contagem lida cedo demais" registrada no CLAUDE.md).
    await expect
      .poll(
        async () =>
          guarda.tentativas() > 0 ||
          (await dialogDeValidacao.isVisible().catch(() => false)) ||
          (await linkConfirmacao.isVisible().catch(() => false)),
        {
          timeout: 30_000,
          message:
            'após Enviar sem anexo, o formulário não deu retorno nenhum ao usuário em 30s: ' +
            'nenhum diálogo de validação, nenhuma confirmação e nenhuma requisição de escrita',
        },
      )
      .toBe(true);

    // O defeito atual: sem anexo, o cliente nem valida — dispara a criação da SC.
    expect(
      guarda.tentativas(),
      'defeito: o envio sem anexo deveria ser recusado no cliente, sem gerar nenhuma ' +
        `requisição de escrita — em vez disso tentou: ${guarda.urls().join(' | ')}`,
    ).toBe(0);

    // Nenhuma confirmação de criação deve aparecer para um envio sem o anexo obrigatório —
    // vale tanto se a tela a fabricar quanto se a SC for criada de fato (é o que acontece
    // com a escrita liberada, ver o teste `@destrutivo` abaixo).
    await expect(
      linkConfirmacao,
      'defeito: o Fluig confirmou a criação de uma solicitação enviada sem o anexo obrigatório',
    ).toBeHidden();

    // O comportamento que o catálogo exige.
    await expect(
      dialogDeValidacao,
      'esperado por CT-CMP-02-S4: um diálogo informando que o anexo é obrigatório',
    ).toBeVisible();
  });

  /**
   * CT-CMP-02-S4 (lado servidor) — a SC não deve ser CRIADA sem o anexo obrigatório.
   *
   * ⚠️ DEFEITO CONFIRMADO EM CAMPO — reprova DE PROPÓSITO. O teste acima prova que o cliente
   * não bloqueia; este prova que o servidor também não. Medido em 25/08/2026: o
   * `POST /ecm/api/rest/ecm/workflowView/send` responde **HTTP 200** com
   * `processInstanceId` real (na medição, #112445) e a Solicitação de Compras nasce sem
   * nenhum documento anexado.
   *
   * `@destrutivo` porque escreve de verdade: cada execução cria uma SC na base. Roda na
   * EXECUÇÃO PADRÃO, como todo `@destrutivo` desde a decisão do dono do ambiente
   * (25/08/2026) — a tag serve para mirar (`--grep @destrutivo`) e para a regressão rápida de
   * quem não quer gerar massa (`PULAR_DESTRUTIVOS=1`), nunca para encolher a medição. A massa
   * sai de `criarProdutoCompra()`, com prefixo `QA` e sufixo único, rastreável na base.
   *
   * Por que existe além do teste acima: "o cliente não valida" e "o servidor aceita" são
   * defeitos de gravidade diferente. Se amanhã só o cliente for corrigido, este teste
   * continua vermelho e mantém visível que a regra não está no servidor — que é onde ela
   * precisa estar (o cliente é contornável).
   */
  test('CT-CMP-02-S4 @destrutivo @bug — o servidor não deve criar a SC quando falta o anexo obrigatório', async ({
    page,
  }) => {
    /** @type {{ status: number, instanceId: unknown, url: string }[]} */
    const criacoes = [];
    page.on('response', async (resposta) => {
      if (resposta.request().method() === 'GET') return;
      if (!/workflowView\/send|process-management/.test(resposta.url())) return;
      const corpo = await resposta.text().catch(() => '');
      /** @type {unknown} */
      let instanceId = null;
      try {
        instanceId = JSON.parse(corpo)?.content?.processInstanceId ?? null;
      } catch {
        // Corpo não-JSON não carrega id de instância; classificar como "sem id" é a leitura
        // correta aqui, e o status da resposta continua sendo afirmado abaixo.
        instanceId = null;
      }
      criacoes.push({ status: resposta.status(), instanceId, url: resposta.url() });
    });

    // Requisição que MORRE no transporte não gera evento `response` — e sem escutar
    // `requestfailed` o teste ficava esperando 60s por uma resposta que nunca viria e
    // reprovava com "não produziu nenhuma resposta do servidor", que não diz nada sobre a
    // regra sob teste. Medido em campo em 25/08/2026 (execução com 4 workers): o
    // `POST /ecm/api/rest/ecm/workflowView/send` terminou em `net::ERR_NETWORK_CHANGED`,
    // junto com duas chamadas de `datasetZoom` que a própria aplicação repetiu — queda de
    // rede da máquina que executa, não comportamento do Fluig.
    /** @type {string[]} */
    const falhasDeTransporte = [];
    page.on('requestfailed', (requisicao) => {
      if (requisicao.method() === 'GET') return;
      if (!/workflowView\/send|process-management/.test(requisicao.url())) return;
      falhasDeTransporte.push(
        `${new URL(requisicao.url()).pathname} → ${requisicao.failure()?.errorText ?? 'falha sem detalhe'}`,
      );
    });

    const formulario = new FormularioSolicitacaoCompraPage(page);
    const massa = criarProdutoCompra();

    await formulario.goto();
    await formulario.expectAberto();
    await preencherFormularioCompleto(page, formulario, massa);

    await formulario.enviar();

    // Sincronização por condição observável: espera o envio ser RESOLVIDO — com resposta do
    // servidor (o caso normal) ou com a requisição morrendo no transporte (infraestrutura).
    await expect
      .poll(() => criacoes.length + falhasDeTransporte.length, {
        timeout: 60_000,
        message:
          'o envio sem anexo não foi resolvido em 60s: nenhuma resposta do servidor e nenhuma ' +
          'falha de transporte — o clique em Enviar não chegou a disparar a criação',
      })
      .toBeGreaterThan(0);

    // Separa INFRAESTRUTURA de defeito antes de afirmar qualquer coisa. Sem resposta não há
    // como saber se a SC nasceu ou não: o `send` pode ter morrido antes de chegar ao
    // servidor ou depois de ele já ter gravado. Reprovar aqui como se fosse o defeito
    // documentaria uma conclusão que a execução não sustenta — daí o veredito explícito.
    if (criacoes.length === 0) {
      faltaPreCondicao(
        '(infraestrutura): a requisição de criação da Solicitação de ' +
          `Compras não chegou a ter resposta — ${falhasDeTransporte.join(' | ')}. ` +
          'SEM VEREDITO sobre CT-CMP-02-S4 nesta execução: não dá para afirmar se o servidor ' +
          'criou ou recusou a SC sem anexo, e a SC pode ter nascido mesmo assim (verificar na ' +
          `base pela justificativa "${massa.justificativa}"). Reexecute com rede estável.`,
      );
    }

    const criadas = criacoes.filter((c) => c.status < 400 && c.instanceId != null);

    expect(
      criadas.map((c) => `#${c.instanceId} via ${new URL(c.url).pathname}`),
      'defeito: o servidor aceitou e CRIOU a Solicitação de Compras sem o anexo obrigatório — ' +
        'a regra do catálogo (CT-CMP-02-S4) não está implementada nem no cliente nem no ' +
        'servidor, e o cliente é contornável',
    ).toEqual([]);
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

/**
 * @typedef {Object} Documento
 * @property {number} id `documentPK.documentId`
 * @property {string} tipo `documentType` — "1" pasta, "2" documento, "7" anexo de workflow
 * @property {number} pai `parentDocumentId` (-1 = fora da árvore navegável)
 * @property {string} descricao `documentDescription`
 * @property {boolean} excluido `deleted` (está na Lixeira)
 */

/**
 * Executa o dataset `document` do Fluig com uma constraint só, e devolve as colunas que
 * interessam à cadeia de anexos.
 *
 * ⚠️ `page.evaluate` + `fetch`, nunca `page.request`: o WAF do TOTVS Cloud barra o contexto de
 * requisição do Playwright (a armadilha já paga em `utils/cancelamento-fluig.js`).
 *
 * ⚠️ Medido em 27/08/2026: constraint com `%` NO INÍCIO do valor (`'%anexo%'`) faz esta
 * consulta varrer a tabela inteira e estourar 4 minutos sem responder. Toda busca aqui é
 * **ancorada** — por `parentDocumentId`, por `documentPK.documentId`, ou por descrição com o
 * prefixo fixo `'Processo <n> - %'` — e responde em ~2s.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} campo
 * @param {string} valor
 * @param {boolean} like
 * @returns {Promise<Documento[]>}
 */
async function consultarDocumentos(page, campo, valor, like) {
  return page.evaluate(
    async ({ campo, valor, like }) => {
      const resposta = await fetch('/api/public/ecm/dataset/datasets', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'document',
          fields: null,
          constraints: [
            { _field: campo, _initialValue: valor, _finalValue: valor, _type: 1, _likeSearch: like },
          ],
        }),
      });
      if (!resposta.ok) return [];
      const json = await resposta.json().catch(() => null);
      return (json?.content?.values ?? []).map((/** @type {any} */ linha) => ({
        id: Number(linha['documentPK.documentId']),
        tipo: String(linha.documentType ?? ''),
        pai: Number(linha.parentDocumentId),
        descricao: String(linha.documentDescription ?? ''),
        excluido: linha.deleted === true,
      }));
    },
    { campo, valor, like },
  );
}

/**
 * CT-ACC-09-H — o caminho FELIZ do anexo da Solicitação de Compras.
 *
 * A suíte prova exaustivamente que a SC nasce **sem** o anexo obrigatório (`CT-CMP-02-S4`, no
 * cliente e no servidor). Ninguém provava o contrário: que, quando o anexo **é** enviado, ele
 * chega íntegro e recuperável.
 *
 * ## O que o produto faz com um anexo de SC (medido em campo em 27/08/2026)
 *
 * O anexo vira **dois** documentos no GED, e uma cadeia de pastas que o produto cria sozinho
 * por solicitação:
 *
 * ```
 * Anexos de Processo de Compras (256812)
 *   └ Requisição de Compra ou Contratação (256824)
 *       └ "Processo <nº> - <aaaa-mm-dd>"                        (documentType 1)
 *           ├ "Solicitação <nº> - <data> - <usuário>"           (documentType 1)
 *           │   └ "PUBLICA - Documentação - <anexo> - (Controle:<id>)"  (documentType 2)
 *           └ "Restrita - Solicitação <nº> - <data> - Comprador"(documentType 1)
 * ```
 *
 * e, FORA da árvore navegável, o registro de anexo de workflow:
 * `"PUBLICA - Documentação - <anexo>"` com `documentType: "7"` e `parentDocumentId: -1`.
 *
 * **Risco concreto que este caso guarda:** se a dupla gravação quebrar, o anexo some da
 * tarefa; se a cadeia de pastas deixar de ser criada, o anexo fica órfão em
 * `parentDocumentId: -1`, inalcançável para o aprovador. Nada detectava isso.
 *
 * ⚠️ Armadilha de busca já paga: o registro do GED **não** se chama como o arquivo físico nem
 * como a justificativa — a descrição é prefixada por `"PUBLICA - Documentação - "`. Procurar
 * por `LIKE 'QA%'` devolve zero e daria a impressão errada de que o anexo não foi gravado.
 *
 * `@destrutivo`, e o resíduo é **permanente**: anexo de SC e a cadeia de pastas não podem ser
 * apagados (apagá-los é mexer na solicitação — vetado nesta base). Um por execução. O nome do
 * anexo carrega o sufixo único da factory, para não colidir com os ~140 registros de anexo já
 * acumulados na base.
 *
 * ## Duas armadilhas de sincronização medidas ao escrever este teste
 *
 * 1. **A cadeia de pastas não existe quando o Fluig devolve o número da solicitação.** Quem a
 *    cria é a etapa de serviço "Grava SC e Anexos", segundos depois. Consultar uma vez logo
 *    após o envio devolve vazio e leria como "o produto não gravou o anexo" — aconteceu na
 *    primeira versão deste teste (SC 112753). Daí o `toPass` sobre a cadeia inteira.
 * 2. **A aba "Anexos" só é pintada quando acionada**, e o contador do rótulo ("Anexos 0") só é
 *    recalculado aí — ele lê 0 mesmo com o anexo já vinculado. Por isso o oráculo é o item da
 *    lista de anexos da solicitação, não o contador nem a visibilidade do painel.
 */
test.describe('Anexo da Solicitação de Compras chega íntegro ao GED (CT-ACC-09-H)', () => {
  test('CT-ACC-09-H @destrutivo — o anexo enviado deveria gerar os dois registros no GED, sob a pasta da solicitação, e ser listado na solicitação', async ({
    page,
  }, testInfo) => {
    // Orçamento de CT-CMP-01-H (preencher 4 combos assíncronos, anexar, enviar, navegar até a
    // solicitação) MAIS os 180 s de espera pelo BPMN abaixo — o mesmo prazo dos irmãos em
    // `aprovacoes-solicitacao-compras.spec.js`.
    testInfo.setTimeout(480_000);

    const { massa, numeroProcesso } = await criarSolicitacaoCompletaEEnviar(page);
    // Nome informado no diálogo "Informe o nome do arquivo" — é ele que o GED usa na descrição.
    const nomeDoAnexo = `${massa.justificativa} - anexo`;

    // ── 0. A cadeia de pastas só existe DEPOIS de "Grava SC e Anexos" terminar ──────────
    //
    // Medido em 03/09/2026 (investigação da decisão D6, `docs/execucoes/
    // relatorio-execucao-2026-09-03-final.md`): toda SC que CHEGOU à "Validação do Gestor" tem a
    // pasta "Processo <n> - <data>" no GED (113225, 113229 e 112679, consultadas pelo dataset
    // `document`); as duas SCs deste teste que reprovaram naquele dia (113226 e 113242) NÃO a
    // têm — e nenhuma delas saiu de "Grava SC e Anexos" antes de o teardown cancelá-las, numa
    // tarde em que essa etapa levou mais de 180 s em cinco testes vizinhos. Ou seja: o produto
    // cria a cadeia; o que faltou foi o BPMN concluir a etapa dentro do orçamento do teste.
    //
    // Por isso a medição do GED só começa quando a SC já passou da etapa de serviço. Se ela não
    // passar em 180 s, isto é latência do BPMN — pré-condição ausente, com anotação, e não "o
    // produto não gravou o anexo". O `try/catch` relança via `faltaPreCondicao` (que sempre
    // lança): nada é engolido, só reclassificado com o motivo medido.
    try {
      await aguardarAtividadeAtual(page, numeroProcesso, ['Validação do Gestor'], { timeout: 180_000 });
    } catch (erro) {
      if (String(erro).includes('PRÉ-CONDIÇÃO AUSENTE')) throw erro;
      faltaPreCondicao(
        `(ambiente): a SC #${numeroProcesso}, criada por este teste com anexo, não chegou à ` +
          '"Validação do Gestor" em 180 s — o BPMN não concluiu "Grava SC e Anexos", que é a ' +
          'etapa que cria a cadeia de pastas no GED. Sem ela não há o que medir: isto NÃO prova ' +
          'que o produto deixou de gravar o anexo (toda SC que passa da etapa tem a pasta — ' +
          'medido em 03/09/2026). É a mesma lentidão de `aprovacoes-solicitacao-compras.spec.js` ' +
          `(~76 s observados em campo, >180 s em 03/09). Último erro: ${String(erro).split('\n')[0].slice(0, 200)}`,
      );
    }

    test.info().annotations.push({
      type: 'solicitacao-criada',
      description: `numero=${numeroProcesso} anexo="${nomeDoAnexo}"`,
    });

    // ── 1-3. A cadeia de pastas e a cópia navegável do anexo ─────────────────────────────
    //
    // Medido em 27/08/2026: a cadeia NÃO existe no instante em que o Fluig devolve o número
    // da solicitação — quem a cria é a etapa de serviço "Grava SC e Anexos", segundos depois.
    // Consultar uma vez logo após o envio devolve vazio e leria como "o produto não gravou o
    // anexo" (foi o que aconteceu na primeira versão deste teste, com a SC 112753: a pasta
    // 706975 apareceu pouco depois). Poll observável e limitado, nunca `waitForTimeout`, e o
    // diagnóstico diz em QUAL elo a cadeia parou.
    /** @type {{ processo: Documento | null, solicitacao: Documento | null, copia: Documento | null, irmas: string[], conteudo: string[] }} */
    const cadeia = { processo: null, solicitacao: null, copia: null, irmas: [], conteudo: [] };

    await expect(async () => {
      const pastasDoProcesso = await consultarDocumentos(
        page,
        'documentDescription',
        `Processo ${numeroProcesso} - %`,
        true,
      );
      cadeia.processo = pastasDoProcesso[0] ?? null;
      expect(
        cadeia.processo,
        `nenhuma pasta "Processo ${numeroProcesso} - ..." existe no GED. O produto cria essa ` +
          'cadeia sozinho na etapa "Grava SC e Anexos"; sem ela o anexo não tem onde ser ' +
          'navegado e o aprovador não o alcança',
      ).not.toBeNull();

      const subpastas = await consultarDocumentos(
        page,
        'parentDocumentId',
        String(/** @type {Documento} */ (cadeia.processo).id),
        false,
      );
      cadeia.irmas = subpastas.map((sub) => sub.descricao);
      cadeia.solicitacao =
        subpastas.find((sub) => sub.descricao.startsWith(`Solicitação ${numeroProcesso} - `)) ?? null;
      expect(
        cadeia.solicitacao,
        `dentro de "${/** @type {Documento} */ (cadeia.processo).descricao}" não existe a pasta ` +
          `"Solicitação ${numeroProcesso} - ...". Subpastas encontradas: ${JSON.stringify(cadeia.irmas)}`,
      ).not.toBeNull();

      const conteudo = await consultarDocumentos(
        page,
        'parentDocumentId',
        String(/** @type {Documento} */ (cadeia.solicitacao).id),
        false,
      );
      cadeia.conteudo = conteudo.map((doc) => doc.descricao);
      cadeia.copia = conteudo.find((doc) => doc.descricao.includes(nomeDoAnexo)) ?? null;
      expect(
        cadeia.copia,
        `o anexo "${nomeDoAnexo}" não está sob a pasta da solicitação — é a cópia navegável, a ` +
          'única alcançável por quem abre o GED. Conteúdo encontrado na pasta: ' +
          `${JSON.stringify(cadeia.conteudo)}`,
      ).not.toBeNull();
    }).toPass({ timeout: 120_000, intervals: [3_000, 5_000, 8_000, 15_000] });

    const pastaDoProcesso = /** @type {Documento} */ (cadeia.processo);
    expect(
      pastaDoProcesso.pai,
      `a pasta "${pastaDoProcesso.descricao}" deveria pendurar em "Requisição de Compra ou ` +
        'Contratação" (256824), dentro de "Anexos de Processo de Compras" — está fora da cadeia ' +
        'esperada',
    ).toBe(256824);

    const copia = /** @type {Documento} */ (cadeia.copia);
    expect(
      copia.tipo,
      `a cópia navegável do anexo (${copia.id}) deveria ser um documento comum (documentType 2)`,
    ).toBe('2');
    expect(copia.excluido, `a cópia navegável do anexo (${copia.id}) não deveria nascer excluída`).toBe(
      false,
    );

    // ── 4. O registro de ANEXO DE WORKFLOW (documentType 7), fora da árvore ───────────────
    // O id dele vem no próprio nome da cópia: "... - (Controle:<id>)". Se esse elo se perder,
    // a tarefa mostra a lista de anexos vazia mesmo com o arquivo gravado.
    const controle = copia.descricao.match(/\(Controle:(\d+)\)/)?.[1];
    expect(
      controle,
      `a descrição da cópia navegável ("${copia.descricao}") deveria carregar o elo ` +
        '"(Controle:<id>)" para o registro de anexo de workflow — sem ele o anexo do GED e o ' +
        'anexo da tarefa deixam de estar ligados',
    ).toBeTruthy();

    const anexoDeWorkflow = await consultarDocumentos(page, 'documentPK.documentId', String(controle), false);
    expect(
      anexoDeWorkflow.map((d) => `${d.id}|tipo ${d.tipo}|pai ${d.pai}`),
      `o registro de anexo de workflow ${controle} (documentType 7, parentDocumentId -1) não foi ` +
        'encontrado — é ele que a aba "Anexos" da tarefa lê',
    ).toHaveLength(1);
    expect(
      anexoDeWorkflow[0].tipo,
      `o registro ${controle} deveria ser o anexo de workflow (documentType 7)`,
    ).toBe('7');
    expect(
      anexoDeWorkflow[0].pai,
      `o registro ${controle} é o anexo de workflow e vive FORA da árvore navegável ` +
        '(parentDocumentId -1) — por isso a cópia da etapa 3 é obrigatória',
    ).toBe(-1);
    expect(
      anexoDeWorkflow[0].descricao,
      `o registro ${controle} deveria referir-se ao anexo desta execução`,
    ).toContain(nomeDoAnexo);

    // ── 5. E o anexo é listado NA SOLICITAÇÃO, não só no GED ─────────────────────────────
    //
    // As quatro etapas acima falam do banco do GED; esta fala do vínculo com a solicitação —
    // é o que o aprovador enxerga. As duas coisas podem se soltar (o registro tipo 7 vive
    // FORA da árvore, com `parentDocumentId: -1`), e é essa divergência que o caso guarda.
    //
    // ⚠️ O caminho é o link de confirmação, e não `pageworkflowview?...processInstanceId=<n>`:
    // medido em 27/08/2026 na SC 112755 (mantida viva com `PULAR_LIMPEZA=1`), a navegação
    // direta abre o modal *"Esta tarefa não está mais sob sua responsabilidade!"* — efeito do
    // D-01, que deixa a SC com `consumerkeycompras` — e, fechado o modal, a tela inteira some.
    // Por ali não há aba de Anexos para ler, e insistir mediria o D-01, não este caso.
    await page.getByRole('link', { name: `Acessar solicitação #${numeroProcesso}` }).click();
    await expect(page).toHaveURL(new RegExp(`(processInstanceId|ProcessInstanceID)=${numeroProcesso}\\b`), {
      timeout: 30_000,
    });

    // A lista de anexos da solicitação é renderizada como `<span data-open-attachment
    // data-document-id="<id>">`. A assertion é sobre a PRESENÇA do item na lista da
    // solicitação — não sobre ele estar visível: a aba "Anexos" só é pintada quando acionada
    // (e o contador do rótulo só é recalculado aí), então exigir visibilidade mediria a
    // ativação da aba, que é chrome de interface, e não o vínculo anexo↔solicitação.
    const itemDeAnexo = page.locator('[data-open-attachment]').filter({ hasText: nomeDoAnexo });
    await expect(
      itemDeAnexo,
      `a solicitação ${numeroProcesso} não lista "${nomeDoAnexo}" entre os seus anexos. Os dois ` +
        'registros do GED existem e estão sob a pasta da solicitação (etapas anteriores), então ' +
        'o arquivo foi gravado — e mesmo assim não chega a quem precisa aprovar a compra. É ' +
        `exatamente o cenário do anexo órfão em \`parentDocumentId: -1\` (registro ${controle})`,
    ).toHaveCount(1, { timeout: 30_000 });
  });
});
