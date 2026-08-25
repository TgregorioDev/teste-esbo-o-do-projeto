// @ts-check
import { expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { comExclusividade } from '../utils/exclusividade.js';

/**
 * Formulário clássico de Solicitação de Compras, iniciado direto por URL
 * (`/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`).
 *
 * É um ponto de entrada DIFERENTE do modal aberto a partir do Portal de Acompanhamento de
 * Contratos (`components/SolicitacaoCompraModal.js`): aqui o formulário nasce em branco e é
 * preenchido à mão, sem contrato de origem.
 *
 * Confirmado em campo:
 * - Título do documento: `Cassi - Fluig Plataforma - Movimentar Solicitação` (compartilhado
 *   por qualquer processo iniciado por essa rota — não distingue Compras de Cotação).
 * - O formulário em si vive DENTRO de um iframe (`iframe[title="Visualizador"]`); os botões
 *   de rodapé (Enviar/Opções) ficam FORA do iframe, na página host.
 * - Bloco "Identificação do Processo / Solicitante": Solicitante, Email do Solicitante,
 *   Data da Solicitação e Hora da Solicitação vêm PRÉ-PREENCHIDOS e são somente leitura.
 *   Nº do Processo Fluig é a exceção: nasce vazio (placeholder "Gerado ao Movimentar") —
 *   só é atribuído quando o processo é efetivamente movimentado.
 * - Bloco "Identificação da Entidade / Solicitação": Nº da Solicitação ERP, Nº da Cotação
 *   ERP, Código da Filial, Nome da Filial (combobox pesquisável) e Data de Emissão nascem
 *   vazios; Justificativa para a Solicitação é o campo de texto livre.
 * - Bloco de produtos: "Adicionar Produto" insere uma linha com combobox de Produto/Serviço
 *   e, dentro dela, "Adicionar Centro de Custo" abre o rateio (Item, Rateio %, Classe Valor,
 *   Centro de Custo) do item — alcançável sem nunca acionar Enviar.
 */
export const ROTA_SOLICITACAO_COMPRAS = '/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras';

/** Título do documento para qualquer processo iniciado por `pageworkflowview`. */
export const TITULO_MOVIMENTAR_SOLICITACAO = 'Cassi - Fluig Plataforma - Movimentar Solicitação';

/**
 * Última requisição da INICIALIZAÇÃO do formulário — o marco que separa "o formulário
 * apareceu" de "o formulário está pronto para ser usado".
 *
 * Medido em campo (25/08/2026, 20+ cargas instrumentadas): depois que o heading do
 * formulário fica visível e `usuarioSolicitante` já tem valor, a tela AINDA está montando.
 * Nessa janela o iframe mantém dois `div.loading-message` sobre um `div.blockUI.blockOverlay`
 * e o script do formulário ainda não registrou a validação de cliente. As consequências,
 * as duas reproduzidas:
 *
 * 1. Um clique em "Enviar" nessa janela NÃO é validado no cliente — o Fluig dispara direto
 *    `POST /ecm/api/rest/ecm/workflowView/send`, sem nenhum diálogo. Medido em 2 de 9
 *    cargas de execução única (sem concorrência). Com a guarda de escrita instalada isso
 *    vira "o diálogo de erro nunca apareceu"; SEM guarda, é uma Solicitação de Compras
 *    criada de verdade a partir de um formulário vazio.
 * 2. Um clique DENTRO do iframe (combo de filial, produto, zoom de rateio) fica preso na
 *    checagem de actionability do Playwright enquanto o `blockUI` cobre o alvo — e estoura
 *    o `actionTimeout` de 45s sem nenhuma mensagem de domínio.
 *
 * As três chamadas de inicialização saem juntas ao final da montagem
 * (`dsFluig_getProcReqComprasReprovadoSql` e duas de `ds_getFormDistribuicaoAreas`); a de
 * `tbAreasDist` é a última delas. Esperar por essa RESPOSTA é condição observável — não é
 * tempo arbitrário nem timeout aumentado.
 */
const RESPOSTA_FIM_DA_INICIALIZACAO = /datasetId=ds_getFormDistribuicaoAreas.*tbAreasDist/;

export class FormularioSolicitacaoCompraPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    /** O formulário renderiza dentro de um iframe — todo locator de campo vive aqui dentro. */
    this.frame = page.frameLocator('iframe[title="Visualizador"]');

    this.headingInicio = page.getByRole('heading', { name: 'Início', level: 2 });
    this.headingFormulario = this.frame.getByRole('heading', { name: 'Solicitação de Compras', level: 1 });

    // Identificação do Processo / Solicitante — pré-preenchidos, somente leitura.
    this.campoNumeroProcesso = this.frame.getByRole('spinbutton', { name: /Nº do Processo Fluig/ });
    this.campoSolicitante = this.frame.getByRole('textbox', { name: 'Solicitante *', exact: true });
    this.campoEmailSolicitante = this.frame.getByRole('textbox', { name: 'Email do Solicitante *' });
    this.campoDataSolicitacao = this.frame.getByRole('textbox', { name: 'Data da Solicitação *' });
    this.campoHoraSolicitacao = this.frame.getByRole('textbox', { name: 'Hora da Solicitação *' });

    // Identificação da Entidade / Solicitação — nascem vazios.
    this.headingEntidade = this.frame.getByRole('heading', { name: 'Identificação da Entidade / Solicitação' });
    this.campoNumeroSolicitacaoErp = this.frame.getByRole('textbox', { name: 'Nº da Solicitação ERP *' });
    this.campoNumeroCotacaoErp = this.frame.getByRole('textbox', { name: 'Nº da Cotação ERP *' });
    this.campoCodigoFilial = this.frame.getByRole('textbox', { name: 'Código da Filial *' });
    this.campoDataEmissao = this.frame.getByRole('textbox', { name: 'Data de Emissão *' });
    this.campoJustificativa = this.frame.getByRole('textbox', { name: 'Justificativa para a Solicitação *' });

    // Identificação do(s) Produto(s)/Serviço(s).
    this.headingProdutos = this.frame.getByRole('heading', { name: 'Produtos/Serviços da Solicitação' });
    this.botaoAdicionarProduto = this.frame.getByRole('button', { name: 'Adicionar Produto' });
    this.botaoDownloadPlanilhaRateio = this.frame.getByRole('button', { name: 'Download Planilha de Rateio Modelo' });
    this.botaoUploadPlanilhaRateio = this.frame.getByRole('button', { name: 'Upload Planilha de Rateio Preenchida' });

    // Linha de produto, criada por `adicionarProduto()`.
    this.campoProdutoServico = this.frame.getByRole('searchbox', { name: 'Produto/Serviço' });
    this.botaoAdicionarCentroCusto = this.frame.getByRole('button', { name: 'Adicionar Centro de Custo' });

    // Rateio do item, criado por `adicionarCentroCusto()`.
    this.headingRateio = this.frame.getByRole('heading', { name: /Rateio por Centro de Custo/ });
    this.campoRateio = this.frame.getByRole('textbox', { name: 'Rateio *' });

    // Rodapé — FORA do iframe.
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar' });

    // Diálogo de erro de validação ao Enviar — renderizado no HOST da página, fora do
    // iframe do formulário. Confirmado em campo: com o formulário vazio, o Fluig valida
    // ANTES de qualquer requisição de escrita e recusa com esta mensagem exata.
    this.dialogErro = page.getByRole('dialog').filter({ hasText: 'Erro' });
    this.botaoOkErro = this.dialogErro.getByRole('button', { name: 'Ok, entendi' });

    // Segundo diálogo, DENTRO do iframe: algumas validações (ex.: rateio) mostram, além do
    // "Erro" do host, um segundo aviso "Atenção:" (SweetAlert do próprio formulário) depois
    // que o primeiro é fechado. Confirmado em campo: o texto NÃO é idêntico ao do primeiro
    // diálogo ("deve ser igual a 100%" vs. "não podem ser inferior a 100%") — são dois
    // avisos distintos para a mesma causa, não uma duplicação do mesmo texto.
    this.dialogAtencao = this.frame.getByRole('dialog').filter({ hasText: 'Atenção:' });
    this.botaoOkAtencao = this.dialogAtencao.getByRole('button', { name: 'OK', exact: true });

    /**
     * Resolvida por `goto()` com `true` quando a montagem do formulário terminou e `false`
     * quando o ambiente não a concluiu. Fica `undefined` enquanto não se navegou.
     * @type {Promise<boolean> | undefined}
     */
    this.inicializacaoConcluida = undefined;

    /**
     * Datasets que responderam erro durante a carga — diagnóstico da falha de montagem.
     * @type {string[] | undefined}
     */
    this.errosDeDatasetNaCarga = undefined;

    /** Evita registrar a mesma escuta a cada `goto()` da mesma instância. */
    this.escutaDeErroDeDatasetRegistrada = false;
  }

  async goto() {
    // Diagnóstico da montagem: quando ela não termina, a causa costuma estar num dataset da
    // carga que respondeu erro. Sem isto a falha diria só "a montagem não terminou"; com
    // isto ela diz QUAL dataset e com que status — medido em campo em 25/08/2026:
    // `ds_protheus_getMatriculaTitular_rest` respondendo HTTP 500
    // (`WFLYEJB0054: Failed to marshal EJB parameters`) trava a montagem inteira do
    // formulário. O corpo da requisição é lido de forma síncrona (`postData()`); o corpo da
    // RESPOSTA, não — ele é assíncrono e chegaria depois do contexto fechar.
    this.errosDeDatasetNaCarga = [];
    if (!this.escutaDeErroDeDatasetRegistrada) {
      this.escutaDeErroDeDatasetRegistrada = true;
      this.page.on('response', (resposta) => {
        if (resposta.status() < 400) return;
        if (!resposta.url().includes('/api/public/ecm/dataset/')) return;
        const corpo = resposta.request().postData() ?? '';
        const nome = corpo.match(/"name"\s*:\s*"([^"]+)"/)?.[1] ?? resposta.url();
        this.errosDeDatasetNaCarga?.push(`${nome} → HTTP ${resposta.status()}`);
      });
    }

    // A escuta da inicialização precisa existir ANTES da navegação: as três chamadas do
    // final da montagem saem ~4s depois da carga, e registrar depois perderia a resposta.
    // `.then(ok, err)` já consome a rejeição — promessa pendente sem tratamento derrubaria
    // o processo do worker com "unhandled rejection" quando o formulário não abrisse.
    this.inicializacaoConcluida = this.page
      // 60s é o mesmo prazo que o config declara para navegação — é o custo de SERVIR a tela,
      // que é o que se espera aqui. Precisa ficar ABAIXO do timeout de teste (120s) de
      // propósito: numa parada do ambiente, o prazo que vence primeiro é o que dá a mensagem,
      // e um `Test timeout of 120000ms exceeded` genérico não diz nada sobre a causa.
      // Referência medida: montagem sadia termina em 4–13s.
      .waitForResponse((resposta) => RESPOSTA_FIM_DA_INICIALIZACAO.test(resposta.url()), { timeout: 60_000 })
      .then(
        () => true,
        () => false,
      );

    await this.page.goto(ROTA_SOLICITACAO_COMPRAS, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Pré-condição: o formulário abriu, os campos pré-preenchidos carregaram **e a montagem
   * terminou** — só depois disso o Fluig valida no cliente e o iframe aceita clique.
   *
   * Falha com veredito explícito (`PRÉ-CONDIÇÃO AUSENTE`, o padrão do projeto para separar
   * ambiente de defeito no relatório) em vez de deixar vazar um `locator.waitFor: Timeout
   * 45000ms` cru, que não diz se a tela não abriu, se caiu a sessão ou se o produto quebrou.
   */
  async expectAberto() {
    await this.esperarComVeredito(
      () => this.headingInicio.waitFor({ state: 'visible' }),
      'a página "Movimentar Solicitação" não renderizou o heading "Início"',
    );
    await this.esperarComVeredito(
      () => this.headingFormulario.waitFor({ state: 'visible' }),
      'o iframe do formulário não renderizou o heading "Solicitação de Compras"',
    );

    // "Solicitante" só vem preenchido depois que o Fluig resolve o usuário logado —
    // esperar pelo valor, não por tempo, evita ler o campo ainda vazio.
    await this.esperarComVeredito(
      () =>
        this.page.waitForFunction(
          () => {
            const iframe = document.querySelector('iframe[title="Visualizador"]');
            const doc = /** @type {HTMLIFrameElement} */ (iframe)?.contentDocument;
            const campo = /** @type {HTMLInputElement | null} */ (doc?.getElementById('usuarioSolicitante'));
            return !!campo?.value;
          },
          { timeout: 30_000 },
        ),
      'o campo "Solicitante" nunca foi preenchido pelo Fluig',
    );

    await this.expectMontagemConcluida();
  }

  /**
   * Espera a montagem do formulário TERMINAR — ver `RESPOSTA_FIM_DA_INICIALIZACAO` para o
   * que foi medido em campo e por que isto não é opcional.
   *
   * Duas condições, nesta ordem, porque uma sozinha não basta:
   * 1. a resposta que fecha a inicialização (sinal POSITIVO — acontece, é observável);
   * 2. o overlay de carregamento do iframe ter sumido (a tela ficar clicável de fato).
   *
   * A ordem importa: esperar só pelo overlay sumir passa na hora quando ele ainda NÃO foi
   * criado — a armadilha de "ausência satisfeita no primeiro poll" já registrada no
   * CLAUDE.md, e medida aqui (uma carga passou pelo `hidden` 29ms depois do Solicitante e
   * mesmo assim enviou sem validar).
   */
  async expectMontagemConcluida() {
    if (this.inicializacaoConcluida === undefined) {
      throw new Error(
        'expectAberto()/expectMontagemConcluida() exigem que a navegação tenha sido feita por ' +
          'goto() — é lá que a escuta do fim da inicialização é registrada, e registrá-la ' +
          'depois da carga perderia a resposta.',
      );
    }

    if (!(await this.inicializacaoConcluida)) {
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE (ambiente): o formulário de Solicitação de Compras abriu, mas a ' +
          'montagem nunca terminou — a resposta que a fecha ' +
          `(${RESPOSTA_FIM_DA_INICIALIZACAO}) não chegou em 60s. Sem ela o Fluig não valida no ` +
          'cliente e o iframe segue coberto pelo overlay de carregamento, então qualquer ação ' +
          'daqui em diante mediria a indisponibilidade do ambiente, não o comportamento do ' +
          'produto. ' +
          (this.errosDeDatasetNaCarga?.length
            ? `Dataset(s) que falharam na carga: ${this.errosDeDatasetNaCarga.join(' | ')}.`
            : 'Nenhum dataset respondeu erro — a montagem simplesmente não avançou.') +
          ` URL: ${this.page.url()}`,
      );
    }

    await expect(
      this.frame.locator('.loading-message'),
      'o overlay de carregamento do formulário não saiu depois da inicialização — o iframe ' +
        'continua bloqueado para clique',
    ).toHaveCount(0, { timeout: 30_000 });
  }

  /**
   * Executa uma espera e, se ela estourar, substitui o `TimeoutError` cru por uma falha com
   * VEREDITO — título e URL correntes incluídos, que é o que distingue "ambiente lento",
   * "sessão caiu" e "o produto mudou". O erro original vai junto: nada é engolido.
   * @param {() => Promise<unknown>} espera
   * @param {string} oQueFaltou
   */
  async esperarComVeredito(espera, oQueFaltou) {
    try {
      await espera();
    } catch (erro) {
      const titulo = await this.page.title().catch(() => '(indisponível)');
      throw new Error(
        `PRÉ-CONDIÇÃO AUSENTE (ambiente): ${oQueFaltou} dentro do prazo. ` +
          `Título="${titulo}" URL=${this.page.url()}. ` +
          'Se o título não for "Movimentar Solicitação", a sessão ou a rota é que falharam; ' +
          'se for, o ambiente não serviu a tela a tempo — nos dois casos NÃO é defeito ' +
          `observado do fluxo sob teste. Causa original: ${erro instanceof Error ? erro.message : String(erro)}`,
      );
    }
  }

  /**
   * Insere uma linha de Produto/Serviço. Não requer nenhum salvamento prévio — o item vive
   * apenas no DOM até o Enviar (que esta suíte nunca aciona com dados suficientes para passar).
   */
  async adicionarProduto() {
    await this.botaoAdicionarProduto.click();
    await this.campoProdutoServico.waitFor({ state: 'visible' });
  }

  /** Abre o rateio por Centro de Custo do item recém-adicionado. */
  async adicionarCentroCusto() {
    await this.botaoAdicionarCentroCusto.click();
    await this.headingRateio.waitFor({ state: 'visible' });
    await this.campoRateio.waitFor({ state: 'visible' });
  }

  /** @param {string} percentual ex.: "90" */
  async preencherRateio(percentual) {
    await this.campoRateio.fill(percentual);
  }

  /**
   * Aciona Enviar.
   *
   * Com todos os campos obrigatórios válidos e rateio fechando 100%, isto CRIA uma
   * Solicitação de Compras real — que é exatamente o propósito desta base de homologação
   * (`docs/politica-de-escrita.md`): os cenários `@destrutivo` enviam de verdade e rodam na
   * execução padrão. A massa vem de `factories/produto-compra.js`, com prefixo `QA` e sufixo
   * único, para que o registro criado seja rastreável depois.
   *
   * Os cenários NEGATIVOS (formulário vazio, rateio abaixo de 100%, planilha inválida) também
   * chamam este método — neles o que se afirma é que a validação recusa ANTES de qualquer
   * escrita, e a prova disso é `guarda.tentativas()` em zero, com a guarda de
   * `utils/guarda-criacao.js` instalada.
   */
  async enviar() {
    await this.botaoEnviar.click();
  }

  /**
   * Anexa um documento em "Anexar documentação Pública".
   *
   * O arquivo sobe com NOME FÍSICO ÚNICO por chamada, e isso não é cosmético: a área de
   * upload temporária do Fluig é do USUÁRIO no servidor, não da aba nem da sessão (é o mesmo
   * recurso compartilhado que `utils/exclusividade.js` documenta para o GED). Dois testes
   * anexando `documento-valido.pdf` ao mesmo tempo com a mesma conta disputam a MESMA entrada
   * de staging, e quem envia primeiro a consome: o outro recebe, no Enviar,
   * "Erro ao salvar os anexos: Arquivo Principal não encontrado documento-valido.pdf".
   * Medido em campo em 25/08/2026, execução com 4 workers e três testes anexando em paralelo:
   * um dos três falhou exatamente assim.
   *
   * O conteúdo é o mesmo do fixture — o que muda é só o nome, pela mesma razão que toda massa
   * do projeto leva sufixo único: isolamento em paralelo sem serializar.
   *
   * @param {string} caminhoDoFixture arquivo local cujo CONTEÚDO será enviado
   * @param {string} nomeVisivel nome do anexo no formulário (rastreável, vindo da factory)
   * @returns {Promise<string>} o nome físico único usado no upload, para o relatório
   */
  async anexarDocumentacaoPublica(caminhoDoFixture, nomeVisivel) {
    await this.frame.getByRole('button', { name: 'Anexar documentação Pública' }).click();
    const dialogAnexo = this.frame.getByRole('dialog').filter({ hasText: 'Informe o nome do arquivo' });
    await dialogAnexo.waitFor({ state: 'visible' });
    await dialogAnexo.getByRole('textbox').fill(nomeVisivel);

    const conteudo = await readFile(caminhoDoFixture);
    const extensao = extname(caminhoDoFixture);
    const nomeFisico = `QA-${randomUUID().slice(0, 8)}-${basename(caminhoDoFixture, extensao)}${extensao}`;

    const chooserPromise = this.page.waitForEvent('filechooser');
    await dialogAnexo.getByRole('button', { name: 'Selecionar anexo' }).click();
    const chooser = await chooserPromise;
    await chooser.setFiles({
      name: nomeFisico,
      mimeType: extensao.toLowerCase() === '.pdf' ? 'application/pdf' : 'application/octet-stream',
      buffer: conteudo,
    });

    return nomeFisico;
  }

  /**
   * Anexa o documento, aciona Enviar e devolve o número da solicitação criada — tudo dentro
   * do lock `ged-upload` de `utils/exclusividade.js`.
   *
   * ## Por que o lock, e por que o nome único NÃO resolve sozinho
   *
   * A área de upload do Fluig é um DIRETÓRIO por usuário no servidor — o próprio erro do
   * produto revelou o caminho: `/volume/wdk-data/upload/TOTVS-FS/`. É o MESMO recurso que
   * `pages/DocumentosGedPage.js` protege com o lock `fluig-upload-staging`, e por isso o nome
   * do lock precisa ser exatamente o mesmo nos dois pontos.
   *
   * Medido em campo em 25/08/2026, três testes anexando em paralelo (4 workers):
   * - com o MESMO nome de arquivo: "Erro ao salvar os anexos: Arquivo Principal não
   *   encontrado documento-valido.pdf";
   * - com nome ÚNICO por teste: "Erro ao salvar os anexos:
   *   /volume/wdk-data/upload/TOTVS-FS/QA-4bcf1f20-documento-valido.pdf (No such file or
   *   directory)" — ou seja, o arquivo desta execução sumiu do diretório antes do save.
   *
   * A disputa é pelo DIRETÓRIO, não pelo nome: quem salva primeiro limpa a área do usuário e
   * leva junto o arquivo de quem ainda não salvou. Isolar por massa não alcança esse recurso,
   * e por isso aqui vale a mesma conclusão do GED — exclusão mútua entre workers.
   *
   * O lock cobre o Enviar e a espera pela confirmação, não só o upload: é no save que o
   * servidor lê o arquivo do diretório. Soltá-lo no clique deixaria o próximo worker limpar a
   * área por baixo de um envio em andamento — a mesma lição já paga em `DocumentosGedPage`.
   *
   * @param {string} caminhoDoFixture
   * @param {string} nomeVisivel
   * @returns {Promise<string>} número do processo criado
   */
  async anexarEnviarEConfirmar(caminhoDoFixture, nomeVisivel) {
    return comExclusividade(
      // MESMO nome de lock do publicador do GED (`pages/DocumentosGedPage.js`): é o mesmo
      // diretório de staging no servidor. Nomes diferentes reintroduziriam a colisão.
      'fluig-upload-staging',
      async () => {
        await this.anexarDocumentacaoPublica(caminhoDoFixture, nomeVisivel);
        await this.enviar();
        return this.aguardarConfirmacaoDeEnvio();
      },
      // O lock enfileira workers: este é o prazo da OPERAÇÃO INTEIRA de quem está na fila
      // (anexo + envio + confirmação de cada um à frente), não folga para esconder falha.
      { timeout: 300_000 },
    );
  }

  /**
   * Depois de `enviar()`, espera o Fluig RESOLVER o envio e devolve o número da solicitação
   * criada. Existe para dar VEREDITO ao que antes era um `toBeVisible` cru sobre o link de
   * confirmação: quando o envio era recusado, a falha saía como "link numérico não visível",
   * que não diz nada sobre a causa e some no meio de um teste que só queria montar massa.
   *
   * Três desfechos possíveis, todos observáveis — nenhum presumido:
   * - link numérico de confirmação → o número, que é o retorno;
   * - diálogo de validação (host "Erro" ou "Atenção:" do próprio formulário) → falha citando
   *   o TEXTO da recusa, que é o que permite decidir se é defeito ou massa inválida;
   * - nada em `timeout` → falha como `PRÉ-CONDIÇÃO AUSENTE`, ambiente.
   *
   * `Promise.any` (e não `Locator.or()`) porque os candidatos vivem em frames diferentes —
   * o Playwright recusa compor locators de frames distintos.
   *
   * @param {number} [timeout] prazo total para o Fluig dar QUALQUER retorno
   * @returns {Promise<string>} número do processo criado
   */
  async aguardarConfirmacaoDeEnvio(timeout = 60_000) {
    const linkConfirmacao = this.page.getByRole('link', { name: /^\d+$/ }).first();

    const desfecho = await Promise.any([
      linkConfirmacao.waitFor({ state: 'visible', timeout }).then(() => 'confirmou'),
      this.dialogErro.waitFor({ state: 'visible', timeout }).then(() => 'recusouNoHost'),
      this.dialogAtencao.waitFor({ state: 'visible', timeout }).then(() => 'recusouNoForm'),
    ]).catch(() => 'semRetorno');

    if (desfecho === 'confirmou') {
      const numero = (await linkConfirmacao.innerText()).trim();
      if (!/^\d+$/.test(numero)) {
        throw new Error(`A confirmação de envio trouxe "${numero}", que não é um número de solicitação.`);
      }
      return numero;
    }

    if (desfecho === 'semRetorno') {
      throw new Error(
        `PRÉ-CONDIÇÃO AUSENTE (ambiente): ${timeout}ms após acionar Enviar o Fluig não deu ` +
          'retorno nenhum — nem confirmação, nem diálogo de validação. Não é possível afirmar ' +
          `que a solicitação foi ou não criada a partir desta tela. URL: ${this.page.url()}`,
      );
    }

    const dialogo = desfecho === 'recusouNoHost' ? this.dialogErro : this.dialogAtencao;
    const texto = (await dialogo.innerText().catch(() => '(texto indisponível)')).replace(/\s+/g, ' ').trim();
    throw new Error(
      'O Fluig RECUSOU o envio deste formulário em vez de criar a solicitação. ' +
        `Mensagem exibida ao usuário: "${texto}"`,
    );
  }
}
