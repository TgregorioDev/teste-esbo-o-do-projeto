// @ts-check

/** Rota de início do processo "Faturamento de Contratos", confirmada em campo. */
const ROTA_FATURAMENTO_CONTRATOS = '/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos';

/**
 * @param {string} texto
 * @returns {string} `texto` com os caracteres especiais de regex escapados
 */
function escapeRegExp(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Ciclo completo (não apenas abertura) do formulário "Faturamento de Contratos"
 * (`wf_faturamento_contratos`) — complementa `pages/FormularioFaturamentoPage.js`, que cobre
 * só a abertura e os cinco campos de seleção. Esta classe modela a cadeia de zooms do
 * Protheus até o fim (incluindo Nº da Planilha, que `FormularioFaturamentoPage` não alcança)
 * e a leitura do desfecho do Enviar.
 *
 * ## O que foi confirmado em campo nesta investigação
 *
 * **A cadeia de zooms é sequencial e cada elo libera o próximo**: Fornecedor → Nº do
 * Contrato → Competência do Contrato → Filial da Medição → Nº da Planilha. Só depois de
 * escolher Fornecedor+Loja o zoom de Contrato passa a listar algo; só depois do Contrato o
 * de Competência; e assim por diante. Revisão, Filial do Contrato, Tipo, Situação, Datas,
 * Nº da Medição e Objeto são todos AUTO-PREENCHIDOS assim que a cadeia resolve — não são
 * preenchidos pelo solicitante.
 *
 * **O zoom usa `select2` e tem um item "Buscando…" enquanto a busca está em voo** —
 * `aria-disabled="true"` nesse item — que precisa ser excluído das opções reais, e um item
 * fixo "Filtrar colunas" que também não é uma opção selecionável. `opcoesZoom` já filtra os
 * dois.
 *
 * **Escolher uma competência sem saldo em aberto (ou um contrato com revisão pendente de
 * aprovação) faz o Protheus devolver, de forma SÍNCRONA, um diálogo de erro genérico** — o
 * mesmo padrão de heading "Erro:" usado em outras integrações desta suíte — ANTES de
 * qualquer envio. Nenhuma medição é criada nessas tentativas: é bloqueio de negócio real,
 * não falha de rede. Mensagens observadas:
 *   - "Não há planilha disponível no contrato/competência selecionados. Verifique
 *     permissões, saldo, vigência e a existência de medições em aberto."
 *   - "CNTA120_REV: Existe revisão pendente de aprovação para este contrato, não é permitido
 *     medir contratos em revisão."
 *
 * **O painel "Itens da Medição" (`#panel_MeasurementItens`, contém os campos de quantidade,
 * a aba "Rateio Contábil" e o rádio "Houve Prestação de Serviço?") existe no DOM com
 * `style="display: none"` inline mesmo quando a cadeia de zooms resolve SEM erro** — não é
 * revelado pela seleção em si. Lendo o JavaScript do formulário
 * (`App/ViewHandler.js`, método `handlePerformMeasurement`), esse painel só é populado e
 * mostrado quando `controlField === 'GRAVA_MED'`, condição que só passa a valer na etapa
 * seguinte do workflow ("Realizar Medição do Contrato"), assumida por quem consta como
 * Fiscal/CSE do contrato no Protheus — não pelo solicitante que preenche o "Início". Por
 * isso esta classe NÃO expõe métodos para preencher quantidade/rateio/observação: eles não
 * são alcançáveis a partir do formulário de abertura, com NENHUM contrato testado.
 *
 * **O botão Enviar fica FORA do iframe**, igual aos demais processos desta suíte.
 */
export class MedicaoContratoPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.frame = page.frameLocator('#workflowView-cardViewer');

    this.headingInicio = page.getByRole('heading', { name: 'Início', level: 2 });
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar', exact: true });

    this.campoFornecedor = this.frame.getByRole('searchbox', { name: 'Fornecedor' });
    this.campoNumContrato = this.frame.getByRole('searchbox', { name: 'Nº do Contrato' });
    this.campoCompetencia = this.frame.getByRole('searchbox', { name: 'Competência do Contrato' });
    this.campoFilialMedicao = this.frame.getByRole('searchbox', { name: 'Filial da Medição' });
    this.campoNumPlanilha = this.frame.getByRole('searchbox', { name: 'Nº da Planilha' });

    /** Opções reais do dropdown `select2` aberto no momento — exclui "Filtrar colunas" e "Buscando…". */
    this.opcoesZoom = this.frame
      .locator('li.select2-results__option')
      .filter({ hasNotText: 'Filtrar colunas' })
      .filter({ hasNotText: 'Buscando' });

    /** Diálogo de erro síncrono do Protheus (fora do iframe, na página hospedeira). */
    this.dialogoErro = page.getByText('Erro:', { exact: true });
    this.mensagemErro = page.getByText(/Mensagem do erro/);
    this.botaoOkErro = page.getByRole('button', { name: 'OK', exact: true });

    /** Confirmação genérica de criação de processo (mesmo padrão usado após aprovar tarefas). */
    this.mensagemConfirmacao = page.getByText(/iniciada com sucesso\./);
  }

  async goto() {
    await this.page.goto(ROTA_FATURAMENTO_CONTRATOS, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Clica num campo de zoom, tirando o mouse do caminho antes.
   *
   * Armadilha já documentada nesta suíte (ver README > "Armadilhas já pagas"): um tooltip
   * Bootstrap (`data-toggle="tooltip"`, presente em cada campo deste formulário) fica visível
   * por cima de campos vizinhos depois que o mouse passa perto deles (ex.: ao clicar num
   * campo auto-preenchido ao lado), e intercepta o clique do Playwright no campo seguinte —
   * ele re-tenta por até 30s (`actionTimeout`) e falha. Mover o mouse para um canto neutro da
   * página ANTES do clique dá tempo do tooltip (que só fica visível em cima do elemento
   * "hovered") sumir sozinho — sem recorrer a `force: true`, que só dispara o handler sem
   * provar que o clique alcançou o elemento de verdade.
   * @param {import('@playwright/test').Locator} campo
   */
  async #clicarSemTooltip(campo) {
    await campo.waitFor({ state: 'visible' });
    await this.page.mouse.move(0, 0);
    await this.page.waitForTimeout(300);
    await campo.click();
  }

  /** Pré-condição: a casca do processo e o formulário dentro do iframe carregaram. */
  async expectAberto() {
    await this.headingInicio.waitFor({ state: 'visible' });
    await this.botaoEnviar.waitFor({ state: 'visible' });
    await this.campoFornecedor.waitFor({ state: 'visible' });
  }

  /**
   * Espera as opções REAIS do zoom aberto no momento aparecerem (substituindo o placeholder
   * "Buscando…"). Condição observável do sistema — nunca tempo fixo — porque o zoom do
   * Protheus é legitimamente lento (rede confirma isso em campo, ver relatório da suíte).
   *
   * Devolve se opções realmente apareceram: um zoom pode legitimamente ficar vazio (ex.:
   * fornecedor sem contrato algum na filial selecionada) — quem chama decide se isso é
   * "PRÉ-CONDIÇÃO AUSENTE" (tenta outro registro) sem esperar um timeout cheio de ação por
   * cima (`.first().innerText()` sobre zero elementos re-espera o `actionTimeout` inteiro).
   * @param {number} [timeoutMs]
   * @returns {Promise<boolean>}
   */
  async esperarOpcoesZoom(timeoutMs = 20000) {
    const inicio = Date.now();
    while (Date.now() - inicio < timeoutMs) {
      if ((await this.opcoesZoom.count()) > 0) return true;
      await this.page.waitForTimeout(250);
    }
    return (await this.opcoesZoom.count()) > 0;
  }

  /**
   * Localiza, dentre as opções reais do zoom aberto, o índice da primeira cujo texto bate
   * com o padrão informado.
   *
   * ⚠️ Não usa `locator.filter({ hasText: regex })` para isto: confirmado em campo que, para
   * as opções deste zoom (texto composto por vários nós `\n`-separados, ex.:
   * `"CÓDIGO\n05395624\nLOJA\n0001"`), o `hasText` com `RegExp` do Playwright devolve ZERO
   * elementos mesmo quando `regex.test(textoRealDaOpcao)` é `true` fora do Playwright — uma
   * divergência entre a normalização de texto que o `hasText` aplica e o texto que
   * `innerText()` devolve. Ler todos os textos e testar a regex em JavaScript puro é o
   * caminho confiável.
   * @param {RegExp} padrao
   * @returns {Promise<number>} índice encontrado, ou -1
   */
  async #indiceDaOpcao(padrao) {
    const textos = await this.opcoesZoom.allInnerTexts();
    return textos.findIndex((t) => padrao.test(t));
  }

  /**
   * Seleciona o Fornecedor pelo código Protheus (6+ dígitos) e loja, digitados no campo de
   * busca do zoom. Espera a resposta de rede da busca (`datasetZoom` com o padrão digitado)
   * antes de procurar a opção — sincronização real, não tempo arbitrário.
   *
   * A busca do zoom (`searchField: A2_NOMECGC`) é textual e pode devolver mais de um
   * fornecedor cujo nome/CNPJ contém o código digitado como substring — por isso a opção é
   * localizada pelo texto exato `CÓDIGO\n<codigo>...LOJA\n<loja>` (não apenas por conter a
   * loja, que sozinha pode casar com fornecedores errados quando a loja é um valor comum
   * como "0001").
   * @param {string} codigo
   * @param {string} loja
   */
  async selecionarFornecedorPorCodigoLoja(codigo, loja) {
    await this.#clicarSemTooltip(this.campoFornecedor);
    await this.campoFornecedor.pressSequentially(codigo, { delay: 50 });
    await this.page.waitForResponse(
      (r) => r.url().includes('datasetZoom') && r.url().includes(`pattern=${codigo}`),
      { timeout: 20000 },
    );
    await this.esperarOpcoesZoom();

    const padrao = new RegExp(`CÓDIGO\\s*${codigo}\\s*LOJA\\s*${loja}\\b`);
    let indice = await this.#indiceDaOpcao(padrao);
    if (indice === -1) {
      // A resposta pode ainda não ter renderizado no DOM no instante da leitura acima
      // (a rede já respondeu, mas o `select2` está terminando de montar a lista) — tenta
      // mais algumas vezes antes de desistir.
      for (let tentativa = 0; tentativa < 10 && indice === -1; tentativa++) {
        await this.page.waitForTimeout(300);
        indice = await this.#indiceDaOpcao(padrao);
      }
    }
    if (indice === -1) {
      const textos = await this.opcoesZoom.allInnerTexts();
      throw new Error(
        `Nenhuma opção de Fornecedor bateu com código "${codigo}" e loja "${loja}". ` +
          `Opções oferecidas: ${JSON.stringify(textos)}`,
      );
    }
    await this.opcoesZoom.nth(indice).click();
    await this.#aguardarCascataDeHabilitacao();
  }

  /**
   * Depois de escolher uma opção num zoom, o formulário libera o PRÓXIMO campo da cadeia de
   * forma assíncrona: `App/ViewHandler.js` faz isso via um `setInterval` de 100ms
   * (`handleEnableStartProcessManual` → `checkZoomStatus`) que lê o valor recém-selecionado,
   * chama `ZoomHandler.reloadZoom(...)` no campo seguinte e só então o habilita
   * (`window[...].disable(false)`). Clicar no próximo campo ANTES desse ciclo terminar
   * encontra um zoom ainda desabilitado/não recarregado — o clique não abre nada, e
   * `esperarOpcoesZoom()` fica esperando por opções que nunca chegam a aparecer, porque a
   * busca nem foi disparada. Não é um problema de sincronização do lado do teste (não há
   * requisição em voo para aguardar): é o formulário aguardando o próprio ciclo interno.
   * Uma pequena folga fixa aqui é o que o próprio código-fonte do formulário usa como
   * intervalo de poll — não uma tentativa de mascarar flakiness deste lado.
   */
  async #aguardarCascataDeHabilitacao() {
    await this.page.waitForTimeout(1200);
  }

  /**
   * Abre o zoom "Nº do Contrato" (já filtrado pelo fornecedor selecionado) e escolhe a
   * primeira opção oferecida.
   * @returns {Promise<string>} texto da opção escolhida, para diagnóstico
   */
  async selecionarPrimeiroContrato() {
    await this.#clicarSemTooltip(this.campoNumContrato);
    const apareceram = await this.esperarOpcoesZoom();
    if (!apareceram) {
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE: o fornecedor selecionado não ofereceu nenhum contrato no zoom ' +
          '"Nº do Contrato" — isto NÃO é defeito do produto sob teste; escolha outro fornecedor.',
      );
    }
    const texto = await this.opcoesZoom.first().innerText();
    await this.opcoesZoom.first().click();
    await this.#aguardarCascataDeHabilitacao();
    return texto;
  }

  /**
   * Lê os rótulos de competência oferecidos pelo zoom (já filtrado por fornecedor+contrato),
   * sem selecionar nenhum — usado para decidir a ordem de tentativa
   * (`factories/medicao.js#ordemDeTentativaDeCompetencias`).
   * @returns {Promise<string[]>}
   */
  async listarCompetencias() {
    await this.#clicarSemTooltip(this.campoCompetencia);
    const apareceram = await this.esperarOpcoesZoom();
    if (!apareceram) {
      await this.page.keyboard.press('Escape');
      return [];
    }
    const textos = await this.opcoesZoom.allInnerTexts();
    // Deixa o dropdown FECHADO ao sair: `selecionarCompetencia()` sempre clica no campo para
    // abri-lo — se este método o deixasse aberto, aquele clique alternaria (toggle) para
    // fechado em vez de abrir, e a competência nunca seria selecionada.
    await this.page.keyboard.press('Escape');
    return textos;
  }

  /**
   * Seleciona a competência cujo rótulo exato bate com o informado (rótulo obtido de
   * `listarCompetencias`). Reabre o zoom a cada chamada — necessário porque, ao trocar de
   * competência após um erro, os zooms de Filial da Medição e Nº da Planilha são recarregados
   * do zero pelo formulário.
   *
   * Localiza a opção pelo índice em `allInnerTexts()`, não por `.filter({ hasText })`: ver
   * `#indiceDaOpcao` — o filtro por regex do Playwright não confiável para o texto
   * `\n`-separado destas opções, e mesmo o filtro por string (substring) evita repetir aqui a
   * mesma classe de problema.
   * @param {string} rotuloCompetencia
   */
  async selecionarCompetencia(rotuloCompetencia) {
    await this.#clicarSemTooltip(this.campoCompetencia);
    const apareceram = await this.esperarOpcoesZoom();
    if (!apareceram) {
      throw new Error(
        `PRÉ-CONDIÇÃO AUSENTE: o zoom de Competência não ofereceu nenhuma opção ao tentar ` +
          `selecionar "${rotuloCompetencia}".`,
      );
    }
    const indice = await this.#indiceDaOpcao(new RegExp(escapeRegExp(rotuloCompetencia)));
    if (indice === -1) {
      const textos = await this.opcoesZoom.allInnerTexts();
      throw new Error(
        `Competência "${rotuloCompetencia}" não encontrada entre as opções oferecidas: ${JSON.stringify(textos)}`,
      );
    }
    await this.opcoesZoom.nth(indice).click();
    await this.#aguardarCascataDeHabilitacao();
  }

  /**
   * Abre o zoom "Filial da Medição" (já filtrado) e escolhe a primeira opção oferecida.
   * @returns {Promise<boolean>} se havia alguma opção para escolher
   */
  async selecionarPrimeiraFilialMedicao() {
    await this.#clicarSemTooltip(this.campoFilialMedicao);
    const apareceram = await this.esperarOpcoesZoom();
    if (!apareceram) return false;
    await this.opcoesZoom.first().click();
    await this.#aguardarCascataDeHabilitacao();
    return true;
  }

  /**
   * Abre o zoom "Nº da Planilha" (já filtrado) e escolhe a primeira opção oferecida. É esta
   * seleção que dispara a consulta síncrona de saldo em aberto no Protheus
   * (`ds_fatcon_get_info_medicoes`) — devolvendo ou o diálogo de erro ou o desbloqueio dos
   * campos auto-preenchidos (Tipo, Situação, Datas, Nº da Medição, Objeto).
   * @returns {Promise<string>} texto da planilha escolhida, ou string vazia se não havia opção
   */
  async selecionarPrimeiraPlanilha() {
    await this.#clicarSemTooltip(this.campoNumPlanilha);
    const apareceram = await this.esperarOpcoesZoom();
    if (!apareceram) return '';
    const texto = await this.opcoesZoom.first().innerText();
    await this.opcoesZoom.first().click();
    return texto;
  }

  /**
   * Aguarda a resposta síncrona do Protheus após selecionar a planilha (`ds_fatcon_get_info_medicoes`)
   * e diz se ela veio como erro de negócio (sem saldo/revisão pendente) ou seguiu sem erro.
   * @returns {Promise<{ comErro: boolean, mensagem: string }>}
   */
  async aguardarResultadoDaConsultaDeSaldo() {
    await this.page
      .waitForResponse((r) => r.url().includes('ds_fatcon_get_info_medicoes'), { timeout: 20000 })
      .catch(() => {
        // A consulta pode já ter respondido antes deste await começar (corrida entre o
        // clique e o listener) — o diálogo de erro abaixo é a fonte de verdade real.
      });

    const comErro = await this.dialogoErro.isVisible({ timeout: 8000 }).catch(() => false);
    if (!comErro) return { comErro: false, mensagem: '' };

    const mensagem = await this.mensagemErro.innerText().catch(() => '');
    return { comErro: true, mensagem };
  }

  /** Fecha o diálogo de erro síncrono, deixando o formulário pronto para nova tentativa. */
  async fecharErro() {
    await this.botaoOkErro.click();
    await this.dialogoErro.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Encadeia Fornecedor → Contrato → Competência → Filial da Medição → Planilha e tenta,
   * em ordem, as competências oferecidas até encontrar uma sem erro de saldo/revisão — ou
   * esgotar as tentativas. Não há como saber de antemão qual competência tem saldo aberto
   * (varia por contrato/mês e é consumido por execuções concorrentes desta suíte); tentar e
   * descartar é o único caminho determinístico disponível.
   *
   * @param {{ codigo: string, loja: string }} fornecedor
   * @param {number} [maxTentativas]
   * @returns {Promise<{ sucesso: true, competencia: string, planilha: string, contrato: string } | { sucesso: false, tentativas: Array<{ competencia: string, mensagem: string }> }>}
   */
  async montarMedicaoComSaldoEmAberto(fornecedor, maxTentativas = 6) {
    await this.selecionarFornecedorPorCodigoLoja(fornecedor.codigo, fornecedor.loja);
    const contrato = await this.selecionarPrimeiroContrato();

    const competencias = await this.listarCompetencias();
    if (competencias.length === 0) {
      throw new Error(
        `PRÉ-CONDIÇÃO AUSENTE: o fornecedor ${fornecedor.codigo}-${fornecedor.loja} não ofereceu ` +
          'nenhuma competência para o contrato selecionado.',
      );
    }

    /** @type {Array<{ competencia: string, mensagem: string }>} */
    const tentativas = [];

    for (const competencia of competencias.slice(0, maxTentativas)) {
      // `listarCompetencias()` apenas ABRE o zoom para ler as opções, sem selecionar
      // nenhuma — mesmo na primeira tentativa é preciso selecionar explicitamente, ou o
      // campo Competência fica vazio e os zooms seguintes (Filial da Medição, Planilha)
      // ficam sem esse filtro.
      await this.selecionarCompetencia(competencia);
      const filialOfertada = await this.selecionarPrimeiraFilialMedicao();
      if (!filialOfertada) {
        tentativas.push({ competencia, mensagem: '(sem opção de Filial da Medição para esta competência)' });
        continue;
      }
      const planilha = await this.selecionarPrimeiraPlanilha();
      if (!planilha) {
        tentativas.push({ competencia, mensagem: '(sem opção de Nº da Planilha para esta competência)' });
        continue;
      }
      const resultado = await this.aguardarResultadoDaConsultaDeSaldo();

      if (!resultado.comErro) {
        return { sucesso: true, competencia, planilha, contrato };
      }

      tentativas.push({ competencia, mensagem: resultado.mensagem });
      await this.fecharErro();
    }

    return { sucesso: false, tentativas };
  }

  /** Aciona o Enviar do rodapé (fora do iframe). */
  async enviar() {
    await this.botaoEnviar.click();
  }

  /**
   * Lê o número do processo na tela de confirmação genérica pós-Enviar
   * ("Solicitação NNNNNN iniciada com sucesso.").
   * @returns {Promise<number>}
   */
  async lerNumeroDaSolicitacaoCriada() {
    await this.mensagemConfirmacao.waitFor({ state: 'visible', timeout: 30000 });
    const texto = await this.mensagemConfirmacao.innerText();
    const numero = texto.match(/Solicitação\s+(\d+)\s+iniciada/)?.[1];
    if (!numero) {
      throw new Error(`Não foi possível ler o número do processo na confirmação: "${texto}"`);
    }
    return Number(numero);
  }
}
