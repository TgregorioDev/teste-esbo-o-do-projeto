// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { CentralTarefasComprasPage } from '../../../pages/CentralTarefasComprasPage.js';
import { CentralTarefasPage } from '../../../pages/CentralTarefasPage.js';
import { PoolTarefasPage } from '../../../pages/PoolTarefasPage.js';
import { FormularioSolicitacaoCompraPage } from '../../../pages/FormularioSolicitacaoCompraPage.js';
import { criarProdutoCompra, criarJustificativaDecisao } from '../../../factories/produto-compra.js';
import { classificarAlvosDoLivro } from '../../../utils/cancelamento-fluig.js';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ANEXO_VALIDO = path.join(__dirname, '../../../fixtures/anexos/documento-valido.pdf');

/**
 * CT-CMP-04-H, CT-CMP-04-S1 e CT-CMP-05-S1 — ciclo de APROVAÇÃO da Solicitação de Compras,
 * a partir da Central de Tarefas → Tarefas em pool.
 *
 * O caso CT-CMP-06 (Validação dos Compradores) também NÃO é coberto aqui: a SC precisa
 * atravessar a Validação Orçamentária, de responsável nominal, para chegar à seq 119/257 —
 * fora do alcance desta conta. Assumir massa compartilhada daquele pool interferiria em
 * outros testes; o motivo está declarado em `scripts/gerar-cobertura.mjs`.
 *
 * O caso CT-CMP-05 (Validação Orçamentária dentro da alçada) NÃO é coberto aqui: a etapa tem
 * responsável nominal e não é alcançável por esta conta. O motivo está declarado em
 * `scripts/gerar-cobertura.mjs`; o teste que resta sobre ela afirma justamente a regra de
 * atribuição nominal, não o caso de negócio.
 *
 * ## Cada teste cria a própria massa — e por que isso exige esperar, não só descobrir
 *
 * Diferente de "contrato" (`utils/massa-contratos.js`, pré-condição que a automação não tem
 * como criar), a SC de origem AQUI é criada pelo próprio teste (`criarSolicitacaoCompletaEEnviar`,
 * cópia local da mesma função de `ciclo-solicitacao-compras.spec.js`) — mas entre o Enviar e
 * a tarefa ficar assumível existe uma cadeia de atividades automáticas do BPMN (decisão
 * "Compra Centralizada?", integração de sistema "Grava SC e Anexos" — ~76s observados em
 * campo) sem nenhum evento de rede estável para aguardar diretamente.
 * `criarEAssumirNoPoolGestorImediato` resolve isso com polling por CONDIÇÃO OBSERVÁVEL, nunca
 * tempo fixo.
 *
 * Achado de campo importante: o painel-resumo "Tarefas em pool" da Central de Tarefas pode
 * mostrar contagem desatualizada/zerada por latência de cache mesmo com a tarefa já real e
 * assumível — confirmado comparando o resumo com a tela de detalhe da própria SC no mesmo
 * instante. Por isso o polling usa a tela de detalhe da solicitação
 * (`abrirDetalheDaSolicitacao(numeroProcesso)` + botão "Assumir tarefa"), que é a fonte de
 * verdade, em vez de navegar pela Central de Tarefas — o que também identifica A PRÓPRIA
 * tarefa por número, sem ambiguidade com outras execuções concorrentes populando o mesmo pool.
 *
 * Confirmado em campo: o usuário de automação pertence ao grupo `Grupo de Compras -
 * Validação do Gestor Imediato da Req. de Compras`. Quando o Fluig não encontra o gestor
 * imediato do solicitante (sempre o caso neste ambiente de homologação, usuário sem gestor
 * cadastrado), a tarefa cai para esse GRUPO em vez de travar, com o comentário automático
 * "Atenção! Não foi possivel obter as informações do Superior Responsável pelo Colaborador
 * requerente da Solicitação de Compras." registrado no Histórico — é assim que toda SC
 * criada por este formulário vira massa de pool, de forma previsível.
 *
 * Se o polling esgotar o tempo (BPMN mais lento que o normal, ou indisponibilidade), o teste
 * falha com "PRÉ-CONDIÇÃO AUSENTE" — ambiente, não defeito.
 */

const GRUPO_GESTOR_IMEDIATO = /Validação do Gestor Imediato/;
const GRUPO_COMPRADOR = /Valida[çc][ãa]o (d[eo]s?)? ?Comprador/i;
const GRUPO_ORCAMENTARIA = /Or[çc]ament[áa]ria/i;

// ---------------------------------------------------------------------------------------
// Criação de Solicitação de Compras (massa própria desta suíte de aprovação).
//
// Cópia equivalente das mesmas funções de `ciclo-solicitacao-compras.spec.js` — NÃO
// extraída para `utils/` porque esta suíte só pode criar/editar os arquivos listados no
// prompt original (nenhum novo módulo em `utils/`), e importar um `.spec.js` de outro faria
// o Playwright registrar os testes daquele arquivo duas vezes (descoberta normal + import).
// Pequena duplicação de código em troca de nenhuma duplicação de execução de teste.
// Comentários explicativos completos (o "porquê" de cada técnica) ficam no arquivo de
// origem; aqui só o necessário para rastrear que é a MESMA lógica.
// ---------------------------------------------------------------------------------------

/** @param {import('@playwright/test').Page} page @param {import('@playwright/test').FrameLocator} frame @param {import('@playwright/test').Locator} locator */
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

/** @param {import('@playwright/test').Locator} locator @param {string} valor */
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
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').FrameLocator} frame
 * @param {string} nomeCampoBusca
 * @param {string} termoBusca
 * @param {RegExp} opcaoEsperada
 * @param {import('@playwright/test').Locator} [campoDeConfirmacao]
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
    }
  }
}

/**
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

        const chip = frame.getByText(textoEscolhido, { exact: false }).first();
        const confirmou = await chip.waitFor({ state: 'visible', timeout: 5_000 }).then(
          () => true,
          () => false,
        );
        if (confirmou) return;
      }
    } catch (erro) {
      // Re-render assíncrono do widget pode desanexar o elemento entre localizá-lo e
      // interagir com ele (observado em campo: "Element is not attached to the DOM" em
      // scrollIntoViewIfNeeded) — condição transiente, tentar de novo em vez de propagar.
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

  await expect(formulario.frame.getByRole('textbox', { name: 'Valor Total Estimado' })).toHaveValue(
    massa.valorTotalEsperado,
  );

  await formulario.adicionarCentroCusto();
  await formulario.preencherRateio(massa.rateioPercentual);
  await selecionarNoZoomDoRateio(page, formulario.frame, 0, /^[A-Z0-9]{2,6}\s*-/);
  await selecionarNoZoomDoRateio(page, formulario.frame, 1, /^\d{3,6}\s*-/);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {Partial<ReturnType<typeof criarProdutoCompra>>} [overridesMassa] o que o teste
 *   precisa VALIDAR (ex.: valor alto para tentar alçada) entra aqui, explícito
 * @returns {Promise<{ massa: ReturnType<typeof criarProdutoCompra>, numeroProcesso: string }>}
 */
async function criarSolicitacaoCompletaEEnviar(page, overridesMassa = {}) {
  const formulario = new FormularioSolicitacaoCompraPage(page);
  const massa = criarProdutoCompra(overridesMassa);

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



/**
 * Cria uma Solicitação de Compras (massa própria deste teste) e espera, por polling
 * (condição observável: o grupo do pool aparece com a SC específica), até que ela chegue ao
 * pool "Validação do Gestor Imediato". Retorna com a tarefa já ASSUMIDA (pronta para
 * decidir), evitando reabrir a Central de Tarefas mais uma vez.
 * @param {import('@playwright/test').Page} page
 * @param {Partial<ReturnType<typeof criarProdutoCompra>>} [overridesMassa]
 * @returns {Promise<{ massa: Awaited<ReturnType<typeof criarSolicitacaoCompletaEEnviar>>['massa'], numeroProcesso: string }>}
 */
async function criarEAssumirNoPoolGestorImediato(page, overridesMassa = {}) {
  const { massa, numeroProcesso } = await criarSolicitacaoCompletaEEnviar(page, overridesMassa);
  const central = new CentralTarefasComprasPage(page);

  // Achado de campo: o painel-resumo "Tarefas em pool" da Central de Tarefas pode mostrar
  // contagem zerada/desatualizada mesmo com a tarefa já real e assumível (latência de
  // cache do widget) — confirmado comparando o resumo com a tela de detalhe da própria SC
  // no mesmo instante. Por isso o polling usa a tela de detalhe (`abrirDetalheDaSolicitacao`),
  // que é a fonte de verdade, e não a Central de Tarefas.
  try {
    await expect(async () => {
      await central.abrirDetalheDaSolicitacao(numeroProcesso);
      await expect(central.botaoAssumirTarefaAtual()).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 180_000, intervals: [10_000, 15_000, 20_000, 30_000] });
  } catch (erroDePoll) {
    // Diagnóstico, não assertion: sem ele as duas causas possíveis (BPMN lento x tarefa
    // assumida por outro teste) produzem exatamente a mesma mensagem, e a distinção só sai
    // reabrindo a tela à mão. `tests/e2e/tarefas/assumir-tarefa-pool.spec.js` assume "a
    // PRIMEIRA tarefa disponível" de um grupo do pool, sem identificá-la por número — se
    // rodar em paralelo com este teste, pode assumir justamente esta SC, e aí "Assumir
    // tarefa" some da tela porque a tarefa já é do usuário, não porque não chegou.
    const atividadeObservada = await central.lerNomeAtividadeAtual().catch(() => '(não foi possível ler)');
    throw new Error(
      `PRÉ-CONDIÇÃO AUSENTE: a SC #${numeroProcesso}, criada por este teste, não ficou assumível ` +
        '("Assumir tarefa") na Validação do Gestor dentro de 180s. Isto NÃO é defeito do produto ' +
        'confirmado — pode ser lentidão do BPMN acima do observado em campo (~76s), ou a tarefa ' +
        'ter sido assumida por outra execução concorrente que pega a primeira do pool ' +
        '(tests/e2e/tarefas/assumir-tarefa-pool.spec.js). ' +
        `Atividade atual observada na tela de detalhe: "${atividadeObservada}". ` +
        `Causa do polling: ${erroDePoll instanceof Error ? erroDePoll.message : erroDePoll}`,
    );
  }

  await central.assumirTarefaAtual(numeroProcesso);

  return { massa, numeroProcesso };
}

test.describe('Validação do Gestor Imediato (Tarefas em pool)', () => {
  /**
   * CT-CMP-04-H — Gestor Imediato aprova.
   *
   * Central de Tarefas → Tarefas em pool → assumir → aprovar (Sim) com justificativa.
   * Esperado: o Histórico registra a decisão do aprovador (rastro de movimentação) — a
   * confirmação de negócio disponível nesta tela, já que o próximo estado ("Validação
   * Orçamentária") depende de configuração de alçada que esta suíte não controla (ver
   * CT-CMP-05-S1 abaixo, no mesmo describe, para o que acontece quando essa configuração
   * falta).
   */
  test('@destrutivo deve assumir e aprovar uma tarefa do pool do Gestor Imediato', async ({ page }, testInfo) => {
    // Criar a SC + aguardar chegar ao pool (~76s+) + assumir + decidir: mais longo que o
    // timeout padrão da suíte, pela mesma razão do teste de criação em
    // `ciclo-solicitacao-compras.spec.js`.
    testInfo.setTimeout(300_000);

    const central = new CentralTarefasComprasPage(page);
    const { numeroProcesso } = await criarEAssumirNoPoolGestorImediato(page);

    const justificativa = criarJustificativaDecisao('aprovação');
    await central.decidirEEnviar({ aprovar: true, justificativa });

    // Confirmação de negócio: a atividade atual do processo deixou de ser "Validação do
    // Gestor" — a aprovação MOVIMENTOU o processo para a próxima etapa (observado em campo:
    // "Distribuição Gestor Orçamentario"). A linha "Atividade atual" fica fixa no topo do
    // Histórico (sem precisar rolar uma lista potencialmente virtualizada para achar a
    // justificativa entre dezenas de eventos automáticos do sistema).
    await central.abrirDetalheAposConfirmacao();
    let atividade = '';
    await expect(async () => {
      atividade = await central.lerNomeAtividadeAtual();
      expect(atividade.length).toBeGreaterThan(0);
    }).toPass({ timeout: 30_000 });
    expect(atividade, 'aprovar deveria avançar a atividade para além de "Validação do Gestor"').not.toMatch(
      /Validação do Gestor/i,
    );

    test.info().annotations.push({
      type: 'solicitacao-aprovada',
      description: `processo=${numeroProcesso} justificativa="${justificativa}" novaAtividade="${atividade}"`,
    });
  });

  /**
   * CT-CMP-04-S1 — Gestor Imediato reprova com justificativa.
   *
   * Esperado: a reprovação é registrada com a justificativa (o caso de teste descreve
   * "volta para correção com o solicitante, dados preservados" — o Histórico é o oráculo
   * verificável nesta tela; a etapa de correção em si é uma tarefa nova do solicitante, fora
   * do escopo do pool do Gestor Imediato que este teste exercita).
   */
  test('@destrutivo deve assumir e reprovar uma tarefa do pool do Gestor Imediato com justificativa', async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(300_000);

    const central = new CentralTarefasComprasPage(page);
    const { numeroProcesso } = await criarEAssumirNoPoolGestorImediato(page);

    const justificativa = criarJustificativaDecisao('reprovação');
    await central.decidirEEnviar({ aprovar: false, justificativa });

    // Mesma técnica de confirmação de CT-CMP-04-H: a atividade atual muda de "Validação do
    // Gestor" — aqui espera-se ir para uma etapa de correção/ajuste com o solicitante, não
    // para a etapa seguinte de aprovação (o caso de teste descreve "volta para correção").
    await central.abrirDetalheAposConfirmacao();
    let atividade = '';
    await expect(async () => {
      atividade = await central.lerNomeAtividadeAtual();
      expect(atividade.length).toBeGreaterThan(0);
    }).toPass({ timeout: 30_000 });
    expect(atividade, 'reprovar deveria tirar a atividade de "Validação do Gestor"').not.toMatch(
      /Validação do Gestor/i,
    );

    test.info().annotations.push({
      type: 'solicitacao-reprovada',
      description: `processo=${numeroProcesso} justificativa="${justificativa}" novaAtividade="${atividade}" pareceCorrecao=${/ajust|correç/i.test(atividade)}`,
    });
  });

  /**
   * CT-CMP-05-S1 — valor acima da alçada sem aprovador configurado deve ser sinalizado
   * explicitamente, nunca travar em silêncio. O erro de campo documentado é: "Não foi
   * encontrado nenhum usuário habilitado para ser movimentada a tarefa...".
   *
   * Esta suíte não controla QUAL Solicitação de Compras do pool tem valor acima de alçada
   * sem aprovador — é característica do dado descoberto, não algo que o teste possa fixar.
   * Por isso o teste aprova a tarefa (mesma ação de CT-CMP-04-H) e verifica, de forma
   * incondicional, que o sistema NUNCA fica em um estado ambíguo: ou a movimentação avança
   * (Histórico ganha o registro da decisão) OU o sistema sinaliza explicitamente a
   * indisponibilidade de aprovador — nunca as duas coisas ausentes ao mesmo tempo (tela
   * branca / trava silenciosa).
   */
  test('@destrutivo deve sinalizar explicitamente quando não há aprovador habilitado para a próxima etapa', async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(300_000);

    const central = new CentralTarefasComprasPage(page);
    // Valor deliberadamente alto (500 × R$ 50.000,00 = R$ 25.000.000,00) tentando cruzar um
    // limite de alçada — a massa padrão (R$ 200,00) nunca reproduziu o cenário em execuções
    // anteriores desta suíte (a decisão sempre avançou normalmente para "Distribuição Gestor
    // Orçamentario"). Mesmo assim a assertion abaixo continua incondicional: ou a mensagem
    // de alçada aparece, ou a atividade avança — o teste não presume qual das duas.
    const { numeroProcesso } = await criarEAssumirNoPoolGestorImediato(page, {
      quantidade: '500',
      precoUnitario: '50000,00',
      valorTotalEsperado: '25.000.000,00',
    });

    const justificativa = criarJustificativaDecisao('aprovação (alçada)');
    await central.decidirEEnviar({ aprovar: true, justificativa });

    const mensagemAlcada = page.getByText(/N[ãa]o foi encontrado nenhum usu[áa]rio habilitado/i);
    await central.abrirDetalheAposConfirmacao();

    // Condição incondicional: OU a mensagem de alçada aparece explicitamente, OU a
    // atividade avança normalmente (prova de que não há trava silenciosa) — nunca as duas
    // ausentes (nem mensagem, nem avanço).
    let atividadeMudou = false;
    try {
      await expect(async () => {
        const atividade = await central.lerNomeAtividadeAtual();
        // Destino ESPECÍFICO, não "mudou de alguma forma": aprovar na Validação do Gestor
        // (seq 7) encaminha para a Validação Orçamentária (seq 14) — é a transição medida em
        // `catalogo-de-processos.md`. A versão anterior aceitava qualquer etapa diferente de
        // "Validação do Gestor", inclusive Correção, Cancelamento ou um estado de erro.
        expect(atividade).toMatch(/Or[çc]ament/i);
      }).toPass({ timeout: 30_000 });
      atividadeMudou = true;
    } catch {
      // segue false — ou a mensagem de alçada explica, ou nem uma coisa nem outra (falha)
    }

    // Leitura COM espera: `isVisible()` não tem retry, e a mensagem de alçada (quando existe)
    // chega junto com o desfecho assíncrono da decisão. Lida instantaneamente, dava sempre
    // `false` e o ramo virava código morto — a disjunção passava só pelo `atividadeMudou`.
    const alcadaVisivel = await mensagemAlcada
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false);

    expect(
      alcadaVisivel || atividadeMudou,
      'esperado: mensagem explícita de alçada OU avanço real da atividade — não os dois ausentes',
    ).toBeTruthy();

    const atividade = atividadeMudou ? await central.lerNomeAtividadeAtual() : null;
    test.info().annotations.push({
      type: 'alcada-sem-aprovador',
      description: `processo=${numeroProcesso} mensagemAlcadaObservada=${alcadaVisivel} atividadeAposDecisao="${atividade}"`,
    });
  });
});

test.describe('Etapas designadas nominalmente (verificação de alcançabilidade)', () => {
  /**
   * Validação Orçamentária — a etapa NÃO cai em pool para esta conta.
   *
   * ## Por que este teste não cobre mais o caso CT-CMP-05 (cenário H)
   *
   * A versão anterior terminava em `expect(true).toBe(true)`: media a alcançabilidade,
   * anotava o resultado e passava em qualquer cenário. Uma medição sem critério de
   * aprovação não é teste — e, pior, `docs/cobertura.md` creditava a ela o caso
   * o caso CT-CMP-05 ("Validação Orçamentária dentro da alçada"), que nunca foi exercitado.
   * O caso está agora declarado como lacuna, com motivo, em `scripts/gerar-cobertura.mjs`.
   *
   * ## O que este teste passa a afirmar
   *
   * A regra documentada: a **seq 14 "Validação Orçamentária" tem responsável NOMINAL**,
   * vindo de API do Protheus amarrada a conta contábil e centro de custo do produto
   * (`regras-de-negocio-compras.md` §3; `catalogo-de-processos.md`, âncoras de etapa).
   * Só há desvio para GRUPO quando o produto não tem gestor único, e, não havendo gestor
   * nenhum, a solicitação cai na Gerência de Compras (seq 257) — nunca num pool
   * "Orçamentária" para a conta de automação.
   *
   * O teste afirma exatamente isso, e reprova se um grupo de Orçamentária aparecer no pool
   * desta conta: aí a regra de atribuição mudou no ERP e a suíte precisa saber.
   *
   * A assertion só é significativa com o pool efetivamente carregado — daí a pré-condição
   * de haver ao menos um grupo listado. Sem isso, "nenhum grupo de Orçamentária" seria
   * verdade por vacuidade, que é a armadilha de assertion de ausência já paga pelo projeto
   * (ver `docs/mapa-do-ambiente.md`, onda 3).
   *
   * ## O seletor de grupos que esta correção consertou
   *
   * Medido ao implementar isto: com o resumo anunciando "Tarefas em pool (1)" e o grupo
   * "Validação dos Compradores" presente, `CentralTarefasComprasPage.listarGrupos()`
   * devolvia `[]` — ela filtrava `getByRole('link')` por texto terminado em "(N)", o que não
   * se sustenta nesta tela. A versão anterior deste teste não percebia: `[]` caía no ramo
   * "NÃO ALCANÇÁVEL" e passava. O Page Object foi corrigido para ancorar em atributo
   * (`a[data-change-tab-view][data-params-type-group="POOL"]`, lido por `data-node`), o
   * mesmo gancho de `PoolTarefasPage` exercitado por CT-TSK-02.
   *
   * Ainda assim a pré-condição aqui usa o RESUMO da Central, não a listagem: "há massa de
   * pool" é pergunta de contagem, e o resumo é a fonte que
   * `tests/e2e/tarefas/assumir-tarefa-pool.spec.js` já usa para a mesma decisão.
   *
   * Não é `@destrutivo`: só lê a Central de Tarefas — não assume nem movimenta nada.
   */
  test('a Validação Orçamentária não deve aparecer como grupo de pool — é etapa de responsável nominal', async ({
    page,
  }) => {
    const tarefasPage = new CentralTarefasPage(page);
    const poolPage = new PoolTarefasPage(page);

    await tarefasPage.goto();
    await tarefasPage.expectCarregada();

    const resumo = await tarefasPage.resumoTarefasEmPool();
    if (resumo.total === 0) {
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE: o Resumo de Tarefas anuncia "Tarefas em pool (0)" no momento ' +
          'da execução. Sem pool carregado, afirmar que a "Validação Orçamentária" está ' +
          'ausente dele seria verdade por vacuidade — isto NÃO é defeito do produto sob ' +
          'teste. Reexecute quando houver massa de pool (o usuário pertence a "Validação do ' +
          'Gestor Imediato" e "Validação dos Compradores").',
      );
    }

    await poolPage.abrirGruposDoPool();
    const grupos = await poolPage.listarGrupos();
    const nomes = grupos.map((g) => g.descricao);
    test.info().annotations.push({
      type: 'grupos-de-pool-observados',
      description: nomes.join(' | '),
    });

    expect(
      nomes.filter((nome) => GRUPO_ORCAMENTARIA.test(nome)),
      'a Validação Orçamentária (seq 14) é etapa de responsável NOMINAL, vinda de API do ' +
        'Protheus por conta contábil e centro de custo (regras-de-negocio-compras.md §3): ela ' +
        'não deve cair em pool para a conta de automação. Se apareceu, a regra de atribuição ' +
        `mudou no ERP e o caso CT-CMP-05 passa a ser alcançável. Grupos lidos: [${nomes.join(', ')}]`,
    ).toEqual([]);
  });

  /**
   * Validação dos Compradores — alcançabilidade do pool, sem assumir nada.
   *
   * ## Por que este teste não assume mais tarefa, e não cita mais CT-CMP-06
   *
   * A versão anterior escolhia `comCarimbo[0]` — a primeira tarefa com carimbo `QA` do pool.
   * Isso resolveu o risco grave (não pega mais a solicitação de um colaborador real), mas
   * parou na metade: "uma tarefa QA" não é "a MINHA tarefa". As SCs que os outros testes
   * desta suíte criam também carregam carimbo `QA` e chegam a este mesmo pool — então este
   * teste assumia a massa do vizinho, que ficava esperando por uma tarefa que já não estava
   * mais lá.
   *
   * A regra da skill `playwright-test-creator` é "cada teste monta seus próprios
   * pré-requisitos". O teste do pool do Gestor Imediato
   * (`tests/e2e/tarefas/assumir-tarefa-pool.spec.js`) foi reescrito exatamente assim: cria a
   * SC, espera ELA chegar ao pool e assume ELA, por id.
   *
   * **Aqui isso não é possível.** Para uma SC alcançar a "Validação dos Compradores"
   * (seq 119/257) ela precisa atravessar a Validação Orçamentária (seq 14), que é etapa de
   * responsável NOMINAL fora do alcance da conta de automação — é o teto medido em
   * `tests/e2e/portais/alcadas-orcamentaria.spec.js`. Medido em 28/08/2026: SCs desta suíte
   * chegaram ao pool "Validação dos Compradores" por conta própria, mas por roteamento do
   * BPMN em tempo não determinístico, não por uma ação que o teste possa executar.
   *
   * Entre assumir massa compartilhada (interferindo em outro teste) e não cobrir o caso, a
   * segunda é a única compatível com a norma. O caso CT-CMP-06 passa a lacuna declarada, com
   * motivo, em `scripts/gerar-cobertura.mjs`.
   *
   * O que resta é medição real e útil: o pool de Validação dos Compradores existe e é
   * alcançável para esta conta, com tarefas pendentes. Leitura pura — não assume, não
   * movimenta, não toca a massa de ninguém.
   */
  test('o pool de Validação dos Compradores é alcançável e lista tarefas pendentes', async ({
    page,
  }, testInfo) => {
    const tarefasPage = new CentralTarefasPage(page);
    const poolPage = new PoolTarefasPage(page);

    await tarefasPage.goto();
    await tarefasPage.expectCarregada();

    const resumo = await tarefasPage.resumoTarefasEmPool();
    if (resumo.total === 0) {
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE: o Resumo de Tarefas anuncia "Tarefas em pool (0)" no momento ' +
          'da execução — não há tarefa de pool em etapa nenhuma. Isto NÃO é defeito do ' +
          'produto sob teste.',
      );
    }

    await poolPage.abrirGruposDoPool();
    const grupos = await poolPage.listarGrupos();
    const grupo = grupos.find((g) => GRUPO_COMPRADOR.test(g.descricao));

    if (!grupo) {
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE: nenhum grupo de "Validação dos Compradores" no pool do usuário ' +
          `de automação no momento da execução (grupos disponíveis: [${grupos.map((g) => g.descricao).join(', ') || 'nenhum'}]). ` +
          'Isto NÃO é defeito do produto sob teste — é falta de massa nessa etapa, que a ' +
          'automação não consegue produzir sob demanda (a SC precisa atravessar a Validação ' +
          'Orçamentária, de responsável nominal).',
      );
    }

    await poolPage.abrirGrupo(grupo.indice);
    const numeros = await poolPage.listarIdentificadoresDoGrupo();

    expect(
      numeros.length,
      `o grupo "${grupo.descricao}" anuncia ${grupo.total} tarefa(s), mas nenhum número de ` +
        'solicitação foi lido nos cartões — o layout do cartão pode ter mudado.',
    ).toBeGreaterThan(0);

    testInfo.annotations.push({
      type: 'pool-validacao-compradores',
      description: `grupo="${grupo.descricao}" total=${grupo.total} ids=${JSON.stringify(numeros)}`,
    });
  });
});
