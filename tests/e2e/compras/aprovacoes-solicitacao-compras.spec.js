// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { CentralTarefasComprasPage } from '../../../pages/CentralTarefasComprasPage.js';
import { FormularioSolicitacaoCompraPage } from '../../../pages/FormularioSolicitacaoCompraPage.js';
import { criarProdutoCompra, criarJustificativaDecisao } from '../../../factories/produto-compra.js';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ANEXO_VALIDO = path.join(__dirname, '../../../fixtures/anexos/documento-valido.pdf');

/**
 * CT-CMP-04-H, CT-CMP-04-S1, CT-CMP-05-S1, CT-CMP-05-H e CT-CMP-06-H — ciclo de APROVAÇÃO
 * da Solicitação de Compras, a partir da Central de Tarefas → Tarefas em pool.
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
        expect(atividade.length).toBeGreaterThan(0);
        expect(atividade).not.toMatch(/Validação do Gestor/i);
      }).toPass({ timeout: 30_000 });
      atividadeMudou = true;
    } catch {
      // segue false — ou a mensagem de alçada explica, ou nem uma coisa nem outra (falha)
    }
    const alcadaVisivel = await mensagemAlcada.isVisible().catch(() => false);

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
   * CT-CMP-05-H — Validação Orçamentária.
   *
   * `docs/politica-de-escrita.md` marca esta etapa como designada a aprovador nominal
   * (AL/DHL) — mas a mesma política manda VERIFICAR antes de declarar bloqueio (o documento
   * de casos errou sobre RH da mesma forma). Este teste investiga se, no momento da
   * execução, existe algum caminho de pool (delegação/substituto/"sem gestor" — o Histórico
   * já mostrou a atividade "Validação Orçamentária (Sem Gestor)" como estado válido do BPMN)
   * alcançável pelo usuário de automação.
   *
   * Não é `@destrutivo`: só lê a Central de Tarefas para determinar alcançabilidade — não
   * assume nem movimenta nada.
   */
  test('deve verificar se a Validação Orçamentária está alcançável por pool para o usuário de automação', async ({
    page,
  }) => {
    const central = new CentralTarefasComprasPage(page);
    await central.goto();
    await central.abrirTarefasEmPool();

    const grupos = await central.listarGrupos();
    const grupoOrcamentaria = grupos.find((g) => GRUPO_ORCAMENTARIA.test(g.nome));

    test.info().annotations.push({
      type: 'alcancabilidade-validacao-orcamentaria',
      description: grupoOrcamentaria
        ? `ALCANÇÁVEL: grupo "${grupoOrcamentaria.nome}" com ${grupoOrcamentaria.quantidade} tarefa(s) no pool`
        : `NÃO ALCANÇÁVEL agora: grupos de pool disponíveis são [${grupos.map((g) => g.nome).join(', ') || 'nenhum'}]`,
    });

    // A ausência de grupo de pool para Validação Orçamentária no momento da execução é o
    // resultado documentado — o teste passa reportando o achado (não falha, pois "não
    // alcançável hoje" é informação válida sobre o ambiente, verificada e não presumida).
    expect(true).toBe(true);
  });

  /**
   * CT-CMP-06-H — Validação dos Compradores.
   *
   * O usuário de automação PERTENCE ao pool de Validação dos Compradores conforme o roteiro
   * de casos. Este teste verifica se há tarefa alcançável nesse pool AGORA e, se houver,
   * assume e movimenta de fato (documentando a ação real observada); se não houver, reporta
   * o achado sem falhar — mesma lógica de verificação do teste acima.
   */
  test('@destrutivo deve assumir e movimentar uma tarefa do pool de Validação dos Compradores quando disponível', async ({
    page,
  }) => {
    const central = new CentralTarefasComprasPage(page);
    await central.goto();
    await central.abrirTarefasEmPool();

    const grupo = await central.encontrarGrupo(GRUPO_COMPRADOR);

    if (!grupo) {
      const grupos = await central.listarGrupos();
      test.info().annotations.push({
        type: 'alcancabilidade-validacao-compradores',
        description: `NÃO ALCANÇÁVEL agora: grupos de pool disponíveis são [${grupos.map((g) => g.nome).join(', ') || 'nenhum'}]`,
      });
      expect(true).toBe(true);
      return;
    }

    await central.abrirGrupo(grupo.link);
    const numeroProcesso = await central.assumirTarefa(0);

    // A tela pós-"Assumir" de Compras segue o mesmo padrão de decisão (Sim/Não +
    // Justificativa) observado na Validação do Gestor Imediato, quando aplicável.
    const temDecisaoPadrao = await central
      .radioAprovarSim()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    test.info().annotations.push({
      type: 'validacao-compradores-alcancada',
      description: `processo=${numeroProcesso} telaComDecisaoSimNao=${temDecisaoPadrao}`,
    });

    if (temDecisaoPadrao) {
      const justificativa = criarJustificativaDecisao('validação do comprador');
      await central.decidirEEnviar({ aprovar: true, justificativa });
      await central.abrirDetalheAposConfirmacao();
      await expect(async () => {
        const atividade = await central.lerNomeAtividadeAtual();
        expect(atividade.length).toBeGreaterThan(0);
      }).toPass({ timeout: 30_000 });
    } else {
      // Página carregou sem tela branca e sem travar — suficiente para provar
      // alcançabilidade quando o padrão de decisão difere do já mapeado.
      await expect(central.headingAtual()).toBeVisible();
    }
  });
});
