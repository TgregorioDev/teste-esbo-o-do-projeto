// @ts-check
import { expect } from '@playwright/test';
import { faltaPreCondicao } from '../utils/pre-condicao.js';
import { PortalCompradorPage } from './PortalCompradorPage.js';
import { FormularioSolicitacaoCompraPage } from './FormularioSolicitacaoCompraPage.js';
import { CentralTarefasComprasPage } from './CentralTarefasComprasPage.js';
import { criarProdutoCompra, FILIAL_PADRAO, PRODUTO_PADRAO } from '../factories/produto-compra.js';
import { paraNumero } from '../utils/captura-payload.js';

/**
 * Ciclo do Comprador — etapas 6 a 11 do E2E de Compras, dentro do Portal do Comprador
 * (`/portal/p/1/portal-do-comprador`) e o que alimenta a sua massa (a SC clássica).
 *
 * Duas responsabilidades desta Page Object:
 *
 * 1. **Navegação delegada** — as sub-telas Controle de Cotações, Avaliação de Propostas e
 *    Definir Vencedor Cotação só listam dado real depois de trocar "Atuar como" para um
 *    comprador substituído (confirmado em campo: a conta autenticada, sem delegação, nunca
 *    tem SC atribuída a si mesma nessas três filas). Compõe `PortalCompradorPage` em vez de
 *    duplicar locators de navegação.
 *
 * 2. **Massa própria do ciclo** — as funções exportadas no rodapé (`criarSolicitacaoCompraClassica`,
 *    `aprovarValidacaoDoGestor`, `aguardarAtividadeAtual`) criam uma Solicitação de Compras real
 *    pelo formulário clássico (`FormularioSolicitacaoCompraPage`) e avançam sua primeira etapa de
 *    aprovação (`CentralTarefasComprasPage`). É o único caminho, confirmado em campo, por onde uma
 *    SC criada por esta suíte chega a existir de verdade no ambiente e a ser rastreável no Tracker,
 *    na Central de Tarefas e no próprio Portal do Comprador — a via do Portal de Acompanhamento de
 *    Contratos fica presa na conta de integração (D-01) e nunca chega lá.
 *
 * ## Mecânica de preenchimento confirmada em campo (o que não está óbvio no DOM)
 *
 * - **Combos "Nome da Filial" e "Produto/Serviço"** são `select2`: a busca é um `searchbox` comum
 *   (`fill()` funciona), mas a lista de opções tem uma linha de cabeçalho `aria-disabled="true"`
 *   antes da opção real — por isso todo filtro de opção exclui `[aria-disabled="true"]`.
 * - **"Classe Valor" e "Centro de Custo"** (dentro do rateio) são widgets `typeahead.js`
 *   (`.tt-input`/`.tt-suggestion`), não `select2` — precisam de `pressSequentially`, não `fill()`,
 *   para disparar a busca. **A ordem importa**: preencher Classe Valor ANTES de Centro de Custo —
 *   na ordem inversa, o tooltip de ajuda da própria linha de Centro de Custo intercepta o clique
 *   na sugestão de Classe Valor (elemento sobreposto, confirmado em campo).
 * - **"Quantidade" e "Preço Unitário Estimado"** usam uma máscara monetária de DIGITAÇÃO EM TEMPO
 *   REAL com 6 casas decimais fixas — cada tecla empurra os dígitos já digitados uma casa para a
 *   esquerda (como um visor de caixa registradora), e `fill()` não aciona essa máscara
 *   corretamente (o valor final sai concatenado/incorreto). Para obter o valor `V`, digita-se a
 *   string de dígitos de `V * 1_000_000` via `pressSequentially`. O campo "Rateio" (percentual) e
 *   os campos de texto livre usam `fill()` normalmente — só os dois campos monetários do item
 *   exigem essa técnica.
 */

/** Centro de Custo confirmado em campo: casa com a Filial padrão ("5303 - CASSI SEDE"). */
const CENTRO_CUSTO_PADRAO = {
  termoBusca: 'SEDE',
  opcaoEsperada: /9000\s*-\s*CASSI SEDE/,
};

/**
 * Classe Valor confirmada em campo: única opção que o typeahead oferece para este contexto
 * (constraint `CTH_CLVL_IN,AS00` embutida no próprio widget).
 */
const CLASSE_VALOR_PADRAO = {
  termoBusca: 'A',
  opcaoEsperada: /AS00/,
};

export class CicloCompradorPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.portal = new PortalCompradorPage(page);

    /** Painel de resultado das sub-telas do ciclo (Validação Inicial / Cotações / Avaliação / Vencedor). */
    this.mensagemSemDados = page.getByText('Nenhum dado encontrado');
  }

  async goto() {
    await this.portal.goto();
  }

  async expectCarregada() {
    await this.portal.expectCarregada();
  }

  /**
   * Troca a delegação "Atuar como" para o comprador substituído informado (valor da `<option>`,
   * não o rótulo — confirmado em campo, ex.: `arthur.de.cassi.com.br.1`). A troca navega de volta
   * ao painel "Acesso Rápido" da sub-SPA — quem chama precisa reabrir a etapa desejada depois.
   * @param {string} valorComprador
   * @param {string} nomeEsperado nome exibido em "Bem vindo, <nome>" após a troca, para confirmar
   */
  async atuarComo(valorComprador, nomeEsperado) {
    await this.portal.comboAtuarComo.selectOption(valorComprador);
    await this.page.getByText(nomeEsperado, { exact: false }).first().waitFor({ state: 'visible' });
  }

  /**
   * Opções oferecidas pelo seletor "Atuar como", como `{ valor, rotulo }` — `valor` é o que
   * `selectOption()` espera (login do comprador substituído), `rotulo` é o texto exibido.
   * @returns {Promise<Array<{ valor: string, rotulo: string }>>}
   */
  async listarOpcoesAtuarComo() {
    return this.portal.comboAtuarComo.locator('option').evaluateAll((els) =>
      els.map((el) => ({
        valor: /** @type {HTMLOptionElement} */ (el).value,
        rotulo: (el.textContent ?? '').trim(),
      })),
    );
  }

  /**
   * Descobre e aplica a primeira delegação oferecida que NÃO seja a própria conta autenticada
   * — nunca fixa QUEM é o comprador substituído numa constante, pelo mesmo motivo que
   * `utils/massa-contratos.js` não fixa qual contrato usar: a lista de substitutos é
   * configuração do ambiente, não dado que esta suíte controle.
   *
   * "Própria conta" é determinado pelo VALOR atualmente selecionado no combo antes de qualquer
   * troca — confirmado em campo: esse valor inicial é a própria conta, mas seu literal é o
   * NOME de exibição ("Usuário TBC (TOTVS)"), não o login (`QA_USERNAME`/"TOTVS-FS"). O combo
   * repete essa mesma conta uma segunda vez como opção normal (login como valor) — por isso
   * comparar contra o login sozinho não bastava e escolhia a si mesma pelo valor errado.
   *
   * Falha com diagnóstico claro quando não há nenhuma opção além da própria conta.
   * @returns {Promise<{ valor: string, rotulo: string }>}
   */
  async atuarComoSubstituto() {
    const valorProprio = await this.portal.comboAtuarComo.inputValue();
    const opcoes = await this.listarOpcoesAtuarComo();
    const substituto = opcoes.find((o) => o.valor && o.valor !== valorProprio && o.rotulo !== valorProprio);
    if (!substituto) {
      faltaPreCondicao(
        'o seletor "Atuar como" não oferece nenhuma delegação além da ' +
          `própria conta autenticada (opções encontradas: ${JSON.stringify(opcoes)}). Sem um ` +
          'comprador substituído, as filas de Controle de Cotações / Avaliação de Propostas / ' +
          'Definir Vencedor Cotação não são alcançáveis por esta suíte.',
      );
    }
    await this.atuarComo(substituto.valor, substituto.rotulo);
    return substituto;
  }

  /** @returns {import('@playwright/test').Locator} */
  getTabelaAtiva() {
    return this.portal.getTabelaAtiva();
  }

  /** Cabeçalhos da tabela atualmente visível, normalizados (sem quebras de linha). */
  async lerColunas() {
    const textos = await this.getTabelaAtiva().locator('thead th').allInnerTexts();
    return textos.map((t) => t.replace(/\s+/g, ' ').trim()).filter((t) => t.length > 0);
  }

  /**
   * Linhas de dados da tabela ativa. A primeira linha é sempre o placeholder "Nenhum dado
   * encontrado" quando a grade está vazia (mesmo padrão de `GerenciaComprasPage`) — por isso
   * `possuiDados()` exige mais de uma linha.
   */
  getLinhas() {
    return this.getTabelaAtiva().locator('tbody tr');
  }

  /** @returns {Promise<boolean>} true quando a grade tem pelo menos um registro real */
  async possuiDados() {
    return (await this.getLinhas().count()) > 1;
  }

  /**
   * Localiza, na tabela ativa, a linha cujo texto contém o número de processo/SC informado.
   * @param {string | number} numero
   * @returns {import('@playwright/test').Locator}
   */
  localizarLinhaPorNumero(numero) {
    return this.getLinhas().filter({ hasText: String(numero) });
  }

  /**
   * Expande o detalhe de item (Produto/Serviço, Quantidade, Preço, Observação…) de uma linha da
   * grade — confirmado na Validação Inicial, que não exige delegação. Cada linha tem um ícone
   * de alternância (`po-table-column-detail-toggle`) próprio, sem nome acessível.
   * @param {import('@playwright/test').Locator} linha
   */
  async expandirDetalhe(linha) {
    await linha.locator('td.po-table-column-detail-toggle po-icon').click();
  }
}

/**
 * Cria uma Solicitação de Compras real pelo formulário clássico
 * (`/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`), com um item, rateio 100% e
 * todos os campos obrigatórios preenchidos. É uma escrita real no ambiente de homologação — só é
 * chamada por cenários `@destrutivo`.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Partial<import('../factories/produto-compra.js').ProdutoCompra>} [overrides]
 * @returns {Promise<{ numeroProcesso: string, item: import('../factories/produto-compra.js').ProdutoCompra }>}
 */
export async function criarSolicitacaoCompraClassica(page, overrides = {}) {
  const item = criarProdutoCompra(overrides);
  const formulario = new FormularioSolicitacaoCompraPage(page);

  await formulario.goto();
  await formulario.expectAberto();

  // "Nome da Filial" — select2, primeiro searchbox do formulário.
  const filialSearch = formulario.frame.getByRole('searchbox').first();
  await selecionarOpcaoSelect2(formulario.frame, filialSearch, FILIAL_PADRAO.termoBusca, FILIAL_PADRAO.opcaoEsperada);

  await formulario.campoJustificativa.fill(item.justificativa);

  await formulario.adicionarProduto();
  await selecionarOpcaoSelect2(
    formulario.frame,
    formulario.campoProdutoServico,
    PRODUTO_PADRAO.termoBusca,
    PRODUTO_PADRAO.opcaoEsperada,
  );

  await formulario.frame.locator('#tbprod_dtNecessidade___1').fill(item.dataNecessidade);
  await preencherCampoMascarado6Casas(formulario.frame.locator('#tbprod_quantidade___1'), Number(item.quantidade));
  await preencherCampoMascarado6Casas(
    formulario.frame.locator('#tbprod_precoUnitario___1'),
    paraNumero(item.precoUnitario),
  );
  await formulario.frame.locator('#tbprod_precoUnitario___1').blur();
  await formulario.frame.locator('#tbprod_observacao___1').fill(item.observacao);

  await formulario.adicionarCentroCusto();
  await formulario.preencherRateio(item.rateioPercentual);

  // Classe Valor ANTES de Centro de Custo — ver nota de mecânica no topo do arquivo.
  await selecionarTypeahead(
    formulario.frame,
    'zoomRatClasseValor___1_1',
    CLASSE_VALOR_PADRAO.termoBusca,
    CLASSE_VALOR_PADRAO.opcaoEsperada,
  );
  await selecionarTypeahead(
    formulario.frame,
    'zoomRatCentroCusto___1_1',
    CENTRO_CUSTO_PADRAO.termoBusca,
    CENTRO_CUSTO_PADRAO.opcaoEsperada,
  );

  await formulario.enviar();

  await page.waitForFunction(
    () => /iniciada com sucesso|Erro/.test(document.body.innerText),
    undefined,
    { timeout: 30_000 },
  );
  const texto = await page.locator('body').innerText();
  const numero = texto.match(/Solicitação (\d+) iniciada com sucesso/)?.[1];
  if (!numero) {
    throw new Error(`Falha ao criar a Solicitação de Compras clássica: ${texto.slice(0, 400)}`);
  }

  return { numeroProcesso: numero, item };
}

/**
 * Assume, pela Central de Tarefas, a etapa "Validação do Gestor" da SC informada e aprova com a
 * justificativa dada. A tarefa só fica assumível depois que o passo automático "Grava SC e
 * Anexos" termina (integração com o Protheus, ~70-100s medidos em campo) — por isso o polling com
 * timeout generoso em vez de uma espera fixa.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string | number} numeroProcesso
 * @param {string} justificativa
 * @returns {Promise<CentralTarefasComprasPage>}
 */
export async function aprovarValidacaoDoGestor(page, numeroProcesso, justificativa) {
  const central = new CentralTarefasComprasPage(page);

  await expect(async () => {
    await central.abrirDetalheDaSolicitacao(numeroProcesso);
    await expect(central.botaoAssumirTarefaAtual().first()).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 150_000, intervals: [5_000, 10_000] });

  await central.assumirTarefaAtual(numeroProcesso);
  await aprovarComRetentativa(page, central, justificativa);
  await central.abrirDetalheAposConfirmacao();

  return central;
}

/**
 * Confirma "Aprovar? Sim" e envia, com nova tentativa quando o próprio Fluig recusa a
 * submissão. Confirmado em execução real: `CentralTarefasComprasPage.decidirEEnviar` (existente,
 * não editável por esta suíte) marca o rádio e clica Enviar, mas o servidor às vezes responde com
 * o diálogo `Erro ao salvar dados do formulário: - O campo "Aprovar? - Linha 1" é obrigatório!` —
 * o clique em "Sim" não chegou a registrar a tempo do clique em Enviar (timing do formulário
 * dentro do iframe, não falta de preenchimento real). Fechar o diálogo e repetir a marcação +
 * envio resolve — tratado aqui como nova tentativa, não como falha silenciosa: se as 3
 * tentativas esgotarem, o erro sobe.
 * @param {import('@playwright/test').Page} page
 * @param {CentralTarefasComprasPage} central
 * @param {string} justificativa
 */
async function aprovarComRetentativa(page, central, justificativa) {
  const dialogoErro = page.getByRole('heading', { name: 'Erro', exact: true });
  const maxTentativas = 3;

  for (let tentativa = 1; tentativa <= maxTentativas; tentativa += 1) {
    const radio = central.radioAprovarSim();
    await radio.check();
    await expect(radio).toBeChecked();
    await central.campoJustificativaDecisao().fill(justificativa);
    await central.botaoEnviar.click();

    const resultado = await Promise.race([
      page
        .waitForFunction(() => /movimentada com sucesso/.test(document.body.innerText), undefined, {
          timeout: 30_000,
        })
        .then(() => /** @type {const} */ ('sucesso')),
      dialogoErro.waitFor({ state: 'visible', timeout: 30_000 }).then(() => /** @type {const} */ ('erro')),
    ]).catch(() => /** @type {const} */ ('nenhum'));

    if (resultado === 'sucesso') return;

    if (resultado === 'erro' && tentativa < maxTentativas) {
      await page.getByRole('button', { name: 'Ok, entendi' }).click();
      await dialogoErro.waitFor({ state: 'hidden' });
      continue;
    }

    throw new Error(
      `Falha ao submeter a aprovação da Validação do Gestor após ${tentativa} tentativa(s) ` +
        `(resultado: ${resultado}).`,
    );
  }
}

/**
 * Ramo intermitente do próprio BPMN, confirmado em campo (1 em 6 SCs criadas nesta
 * investigação): a decisão automática "Sol. Validação do Gestor", que normalmente segue direto
 * para "Distribuição Gestor Orçamentario", às vezes devolve a SC para "Ajustar Informações" —
 * uma repetição de todo o formulário, incluindo a seção de aprovação (agora com os campos
 * prefixados por `_` em vez do sufixo `___N` da tela de pool, e já preenchida/`readonly` com a
 * decisão anterior). Não há, nesta investigação, um campo obrigatório vazio nem mensagem de erro
 * visível que explique O QUE precisa ser ajustado — é uma condição do lado do Protheus/BPMN, não
 * um formulário mal preenchido por esta suíte. Resolver esse ramo (descobrir o que ele
 * realmente exige) é investigação nova, fora do escopo desta tarefa; por isso esta função
 * apenas RECONHECE o ramo e falha com diagnóstico claro, em vez de um timeout genérico.
 */
const ATIVIDADE_AJUSTAR_INFORMACOES = 'Ajustar Informações';

/**
 * Espera, via polling determinístico (sem tempo arbitrário), que a "Atividade atual" do processo
 * informado se torne uma das esperadas — usado depois de uma aprovação para confirmar até onde o
 * fluxo automático avança sozinho.
 *
 * Não usa `CentralTarefasComprasPage.lerNomeAtividadeAtual()` (existente, não editável por esta
 * suíte): confirmado em execução real que o regex daquele método extrai texto incorreto quando o
 * bloco da atividade atual carrega conteúdo extra além de "(Em progresso)" — é exatamente o caso
 * de "Validação Orçamentária", que soma o requisito de consenso ("esta atividade requer um
 * consenso de: 100%…") e o link "Visualizar diagrama" no mesmo bloco. Em vez disso, procura o
 * texto exato `Atividade atual: <nome>` diretamente — a mesma técnica confirmada manualmente
 * contra o ambiente real.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string | number} numeroProcesso
 * @param {string[]} atividadesEsperadas
 * @param {{ timeout?: number }} [opcoes]
 * @returns {Promise<string>} a atividade efetivamente encontrada
 */
export async function aguardarAtividadeAtual(page, numeroProcesso, atividadesEsperadas, opcoes = {}) {
  const timeout = opcoes.timeout ?? 90_000;
  const central = new CentralTarefasComprasPage(page);

  /** @type {string} */
  let encontrada = '';
  await expect(async () => {
    await central.abrirDetalheDaSolicitacao(numeroProcesso);
    // Cada navegação para a tela de detalhe carrega o Histórico via AJAX — confirmado em
    // execução real que uma checagem instantânea (`isVisible()`, sem espera) lê a página ainda
    // em "Histórico 0" e falha por corrida, não porque o estado esperado não chegou. Por isso
    // cada candidato usa `waitFor` (espera de verdade, não tempo arbitrário) DENTRO desta
    // navegação, antes de decidir se tenta a próxima.
    for (const nome of atividadesEsperadas) {
      const achou = await page
        .getByText(`Atividade atual: ${nome}`, { exact: false })
        .first()
        .waitFor({ state: 'visible', timeout: 10_000 })
        .then(() => true)
        .catch(() => false);
      if (achou) {
        encontrada = nome;
        return;
      }
    }

    if (!atividadesEsperadas.includes(ATIVIDADE_AJUSTAR_INFORMACOES)) {
      const desviouParaAjuste = await page
        .getByText(`Atividade atual: ${ATIVIDADE_AJUSTAR_INFORMACOES}`, { exact: false })
        .first()
        .isVisible()
        .catch(() => false);
      if (desviouParaAjuste) {
        // PRÉ-CONDIÇÃO AUSENTE (ambiente, não código): ver nota acima. `toPass` ainda tenta
        // de novo até o timeout (o desvio é terminal, então as tentativas seguintes repetem o
        // mesmo diagnóstico) — mas a mensagem final que chega ao relatório já diz o motivo.
        faltaPreCondicao(
          `o processo ${numeroProcesso} foi desviado pelo próprio BPMN para ` +
            `"${ATIVIDADE_AJUSTAR_INFORMACOES}" em vez de avançar para ${atividadesEsperadas.join(' / ')}. ` +
            'Ramo intermitente confirmado em campo (~1 em 6 SCs), do lado do Protheus/BPMN — ' +
            'reexecutar o teste cria massa nova e tipicamente segue o caminho direto.',
        );
      }
    }

    throw new Error(
      `Nenhuma das atividades esperadas (${atividadesEsperadas.join(', ')}) está visível para o processo ${numeroProcesso}.`,
    );
  }).toPass({ timeout, intervals: [5_000, 10_000] });

  return encontrada;
}

/**
 * Seleciona uma opção num combo `select2` (Nome da Filial / Produto/Serviço): digita o termo de
 * busca no `searchbox` e confirma pelo TECLADO (`Enter`), não por clique.
 *
 * Clique foi a primeira tentativa e falhou de forma reprodutível: o próprio campo tem um
 * tooltip Bootstrap (`title="Nome da Filial."`, por exemplo) que aparece assim que o mouse se
 * aproxima da área e intercepta o clique na opção logo abaixo — confirmado em execução real
 * (13+ tentativas de clique, todas bloqueadas pelo `tooltip-inner`). O select2 mantém a
 * primeira opção não desabilitada sempre destacada (`select2-results__option--highlighted`)
 * assim que a busca resolve; a spec que chama esta função usa termos de busca específicos o
 * bastante (nome completo da filial/produto) para que a opção destacada seja sempre a
 * esperada — por isso espera-se por ela antes de confirmar, para nunca confirmar às cegas.
 * @param {import('@playwright/test').FrameLocator} frame
 * @param {import('@playwright/test').Locator} searchbox
 * @param {string} termoBusca
 * @param {RegExp} opcaoEsperada
 */
async function selecionarOpcaoSelect2(frame, searchbox, termoBusca, opcaoEsperada) {
  await searchbox.click();
  await searchbox.fill(termoBusca);
  const opcao = frame
    .locator('.select2-results__options li[role="option"]:not([aria-disabled="true"])')
    .filter({ hasText: opcaoEsperada });
  await opcao.first().waitFor({ state: 'visible', timeout: 15_000 });
  await expect(
    frame.locator('.select2-results__options li.select2-results__option--highlighted'),
  ).toHaveText(opcaoEsperada, { timeout: 15_000 });
  await searchbox.press('Enter');
}

/**
 * Seleciona uma opção num widget `typeahead.js` (Classe Valor / Centro de Custo do rateio):
 * digita via `pressSequentially` (obrigatório — `fill()` não dispara a busca deste widget) e
 * clica a sugestão que bate com o padrão.
 * @param {import('@playwright/test').FrameLocator} frame
 * @param {string} containerId id do `div.fluig-filter` que envolve o campo
 * @param {string} termoBusca
 * @param {RegExp} opcaoEsperada
 */
async function selecionarTypeahead(frame, containerId, termoBusca, opcaoEsperada) {
  const input = frame.locator(`#${containerId} .tt-input`);
  await input.click();
  await input.pressSequentially(termoBusca, { delay: 60 });
  const opcao = frame.locator(`#${containerId} .tt-suggestion`).filter({ hasText: opcaoEsperada });
  await opcao.first().waitFor({ state: 'visible', timeout: 15_000 });
  await opcao.first().click();
}

/**
 * Preenche um campo monetário/numérico com máscara de digitação em tempo real e 6 casas
 * decimais fixas (confirmado em campo em "Quantidade" e "Preço Unitário Estimado" do item da SC
 * clássica). Cada tecla desloca os dígitos já digitados uma casa para a esquerda — para obter o
 * valor `valorNumerico`, digita-se a string de dígitos de `valorNumerico * 1_000_000`.
 * @param {import('@playwright/test').Locator} campo
 * @param {number} valorNumerico
 */
async function preencherCampoMascarado6Casas(campo, valorNumerico) {
  const digitos = String(Math.round(valorNumerico * 1_000_000));
  await campo.click();
  await campo.pressSequentially(digitos, { delay: 30 });
}
