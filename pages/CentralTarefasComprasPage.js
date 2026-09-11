// @ts-check
import { expect } from '@playwright/test';
import { faltaPreCondicao } from '../utils/pre-condicao.js';
import { consultarTarefaPendente, descreverTarefa } from '../utils/estado-da-solicitacao.js';

/**
 * Extensão da Central de Tarefas (`/portal/p/1/pagecentraltask`) para o ciclo de aprovação
 * de Solicitação de Compras — "Tarefas em pool" → assumir → aprovar/reprovar.
 *
 * Não duplica `pages/CentralTarefasPage.js` (Resumo de Tarefas, Minhas Solicitações): este
 * Page Object cobre exclusivamente a sub-aba de POOL, que aquela classe não modela.
 *
 * ## O que foi confirmado em campo (investigação desta suíte)
 *
 * - A sub-aba "Tarefas em pool" lista os GRUPOS aos quais o usuário pertence, cada um como
 *   um link `"<nome do grupo> (<quantidade>)"` — só aparece grupo com pelo menos 1 tarefa
 *   pendente. O usuário de automação pertence confirmadamente a
 *   `Grupo de Compras - Validação do Gestor Imediato da Req. de Compras`.
 * - Clicar no grupo lista as tarefas (uma por Solicitação de Compras), cada uma com um
 *   botão "Assumir".
 * - "Assumir" navega para `pageworkflowview?...taskUserId=<usuário>` — o MESMO template de
 *   "Movimentar Solicitação" usado para abrir a SC, mas agora com uma seção adicional
 *   referente à ETAPA atual (ex.: "Validação do Gestor"), contendo radio "Aprovar? Sim/Não"
 *   e uma "Justificativa para a Aprovação/Reprovação" obrigatória. O rodapé mantém o mesmo
 *   botão "Enviar" (fora do iframe) usado para criar a SC.
 * - Quando o Fluig não encontra o gestor imediato do solicitante, a tarefa NÃO trava: cai
 *   para o GRUPO (fallback), com o comentário automático "Atenção! Não foi possivel obter as
 *   informações do Superior Responsável pelo Colaborador requerente da Solicitação de
 *   Compras." registrado no Histórico — por isso o pool sempre tem massa disponível para
 *   testar, independentemente de cadastro de gestor no Protheus.
 */
export class CentralTarefasComprasPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.rota = '/portal/p/1/pagecentraltask';

    this.titulo = page.getByRole('heading', { name: 'Central de tarefas' });
    // A Central de Tarefas guarda a sub-aba ativa por SESSÃO no servidor (não por carga de
    // página) — um `goto()` novo pode aterrissar em qualquer sub-aba visitada da última vez
    // (confirmado em `docs/mapa-do-ambiente.md`). "Tarefas em pool" só existe no DOM quando
    // a sub-aba "Resumo de Tarefas" está ativa, por isso ela é clicada explicitamente antes.
    this.abaResumo = page.getByRole('tab', { name: 'Resumo de Tarefas' });
    this.abaTarefasEmPool = page.getByRole('link', { name: /^Tarefas em pool/ });

    /** O formulário de aprovação, como o de criação, vive dentro do iframe "Visualizador". */
    this.frame = page.frameLocator('iframe[title="Visualizador"]');
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar' });
  }


  /**
   * Clica em "Mais opções" apenas se ele existir.
   *
   * O flyout é a forma ANTIGA de revelar as categorias de segundo nível da Central. Medido em
   * 09/09/2026 no ambiente `caixade213859`: ele não existe — as categorias já são abas diretas.
   * Clicar incondicionalmente custava 45s de espera por um elemento inexistente.
   */
  async abrirMaisOpcoesSePresente() {
    const link = this.page.getByRole('link', { name: 'Mais opções' });
    if ((await link.count()) > 0) {
      await link.click();
    }
  }

  async goto() {
    await this.page.goto(this.rota, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Pré-condição: a sub-aba "Tarefas em pool" está ativa e os grupos já carregaram —
   * quando há pelo menos uma tarefa em algum grupo.
   *
   * Confirmado em campo: o painel "Tarefas em pool (N)" só é um `link` clicável quando
   * N > 0; com pool total vazio (N = 0) ele fica como texto inerte, sem navegação. Não é
   * erro — é a MESMA semântica de "só aparece grupo com tarefa pendente" documentada na
   * classe. Por isso este método NÃO lança quando o pool está vazio: `listarGrupos()`
   * simplesmente devolve `[]` depois, e quem chama decide como reportar ausência de massa.
   */
  async abrirTarefasEmPool() {
    await this.titulo.waitFor({ state: 'visible' });
    await this.abaResumo.click();

    // `isVisible({ timeout })` não espera (a opção é ignorada): com o painel ainda montando, a
    // leitura dava "pool vazio", `listarGrupos()` devolvia `[]` e o vermelho saía como falta de
    // massa — ou, no `@achado` da Validação Orçamentária, como verde por acaso.
    const linkClicavel = await this.abaTarefasEmPool
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(
        () => true,
        () => false,
      );
    if (!linkClicavel) return;

    await this.abaTarefasEmPool.click();
    // "Grupos (N)" é a única sub-aba hoje. A aba confirma a troca, não que os links de grupo já
    // estejam no DOM — e `listarGrupos()` lê o instante. Com o pool clicável há ao menos uma
    // tarefa, logo ao menos um grupo: espera-se o primeiro.
    await this.page.getByRole('tab', { name: /^Grupos/ }).waitFor({ state: 'visible' });
    await this.page
      .getByRole('link')
      .filter({ hasText: /\(\d+\)$/ })
      .first()
      .waitFor({ state: 'visible' });
  }

  /**
   * Lê os grupos de pool disponíveis para o usuário autenticado, com a quantidade de
   * tarefas pendentes anunciada em cada um. Só aparecem grupos com pelo menos 1 tarefa.
   * @returns {Promise<Array<{ nome: string, quantidade: number, link: import('@playwright/test').Locator }>>}
   */
  async listarGrupos() {
    const links = this.page.getByRole('link').filter({ hasText: /\(\d+\)$/ });
    const textos = await links.allInnerTexts();
    const grupos = [];
    for (let i = 0; i < textos.length; i++) {
      const m = textos[i].match(/^(.*)\((\d+)\)\s*$/s);
      if (!m) continue;
      grupos.push({ nome: m[1].trim(), quantidade: Number(m[2]), link: links.nth(i) });
    }
    return grupos;
  }

  /**
   * Localiza, dentre os grupos com tarefa pendente, o primeiro cujo nome bate com o
   * padrão informado. Não lança: quem chama decide como reportar ausência de massa
   * (ver `PRÉ-CONDIÇÃO AUSENTE` em `utils/massa-contratos.js`, mesmo padrão do projeto).
   * @param {RegExp} padraoNomeGrupo
   * @returns {Promise<{ nome: string, quantidade: number, link: import('@playwright/test').Locator } | undefined>}
   */
  async encontrarGrupo(padraoNomeGrupo) {
    const grupos = await this.listarGrupos();
    return grupos.find((g) => padraoNomeGrupo.test(g.nome));
  }

  /**
   * Abre um grupo de pool e espera a lista de tarefas (cartões com botão "Assumir")
   * terminar de carregar.
   * @param {import('@playwright/test').Locator} linkDoGrupo
   */
  async abrirGrupo(linkDoGrupo) {
    await linkDoGrupo.click();
    await this.page.getByRole('button', { name: 'Assumir' }).first().waitFor({ state: 'visible' });
  }

  /** Quantidade de tarefas com botão "Assumir" visíveis no grupo atualmente aberto. */
  async contarTarefasAssumiveis() {
    return this.page.getByRole('button', { name: 'Assumir' }).count();
  }

  /**
   * Assume a tarefa de índice informado (0 = primeira) dentro do grupo já aberto e espera
   * a tela de "Movimentar Solicitação" (com a seção de decisão da etapa) carregar.
   * @param {number} [indice]
   * @returns {Promise<number>} número do processo assumido, lido do heading da tela
   */
  async assumirTarefa(indice = 0) {
    const botaoAssumir = this.page.getByRole('button', { name: 'Assumir' }).nth(indice);
    await botaoAssumir.click();

    const heading = this.page.getByRole('heading', { level: 2 }).filter({ hasText: /^\d+\s*-/ });
    await heading.waitFor({ state: 'visible' });
    const texto = await heading.innerText();
    const numero = texto.match(/^(\d+)\s*-/)?.[1];
    if (!numero) {
      throw new Error(`Não foi possível ler o número do processo assumido no heading: "${texto}"`);
    }
    return Number(numero);
  }

  /**
   * Assume a tarefa cujo cartão mostra o número de processo informado (não apenas "a
   * primeira disponível") — usado quando o teste criou a própria massa e precisa
   * distinguir a SC dele de outras que outra execução concorrente possa ter posto no pool.
   * Cada cartão renderiza o número como texto puro seguido do botão "Assumir" no mesmo
   * cartão (confirmado em campo); por isso localizar o texto do número e pegar o PRIMEIRO
   * botão "Assumir" que vem depois dele, na ordem do documento.
   * @param {string | number} numeroProcesso
   * @returns {Promise<number>} o próprio número assumido, confirmado pelo heading da tela
   */
  async assumirTarefaPorNumero(numeroProcesso) {
    const numero = String(numeroProcesso);
    const textoNumero = this.page.getByText(numero, { exact: true }).first();
    await textoNumero.waitFor({ state: 'visible' });
    const botaoAssumir = textoNumero.locator(
      'xpath=following::button[contains(normalize-space(.), "Assumir")][1]',
    );
    await botaoAssumir.click();

    const heading = this.page.getByRole('heading', { level: 2 }).filter({ hasText: /^\d+\s*-/ });
    await heading.waitFor({ state: 'visible' });
    const texto = await heading.innerText();
    const numeroAssumido = texto.match(/^(\d+)\s*-/)?.[1];
    if (numeroAssumido !== numero) {
      throw new Error(
        `Assumiu a tarefa "${numeroAssumido}", mas o esperado era "${numero}" — o cartão pode ter mudado de posição entre localizar o texto e clicar.`,
      );
    }
    return Number(numeroAssumido);
  }

  /**
   * Abre diretamente a tela de detalhe de uma solicitação pelo número do processo — sem
   * passar pela Central de Tarefas. Confirmado em campo: o painel-resumo "Tarefas em pool"
   * pode mostrar contagem desatualizada/zerada (latência de cache) mesmo com uma tarefa
   * real e assumível esperando; a tela de detalhe da própria solicitação é a fonte de
   * verdade — ela expõe "Assumir tarefa" assim que a atividade atual permite.
   * @param {string | number} numeroProcesso
   */
  async abrirDetalheDaSolicitacao(numeroProcesso) {
    await this.page.goto(
      `/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=${numeroProcesso}`,
      { waitUntil: 'domcontentloaded' },
    );
  }

  /**
   * Abre a aba **Formulário** do detalhe já aberto e devolve o frame do formulário.
   *
   * Três fatos medidos em 08/09/2026 que decidem esta implementação:
   *
   * - o formulário vive num iframe (`workflowView-cardViewer`), então nenhum locator da página
   *   externa alcança os campos;
   * - a aba precisa ser clicada: o Fluig guarda a sub-aba por sessão no servidor, e herdar o
   *   estado faz o teste ler a aba que a execução anterior deixou aberta;
   * - o formulário é legível em MODO CONSULTA mesmo sem a tarefa ser da conta — é o que torna
   *   observável o painel orçamentário, cuja etapa a conta de QA não consegue assumir.
   *
   * @returns {Promise<import('@playwright/test').Frame>}
   */
  async abrirFormularioDaSolicitacao() {
    // A aba não tem `role="tab"` NEM nome acessível: é `<a class="tab-option" href="#form-tab">`
    // dentro de `ul.nav-tabs`, e o texto visível não vira accessible name. Medido em 08/09/2026:
    // `getByRole('tab', …)` e `getByRole('link', { name: 'Formulário' })` resolvem para ZERO
    // elemento e o clique morre em timeout de 45s.
    //
    // É o mesmo problema dos três ícones da coluna "Ação" já registrado no CLAUDE.md. Sem
    // âncora semântica, o gancho estável é o alvo da aba (`href`), que faz parte do contrato da
    // tela — não é classe de estilo nem posição no DOM.
    //
    // Recomendação ao time de desenvolvimento: `aria-label` (ou `role="tab"`) nas abas do
    // detalhe da solicitação.
    await this.page.locator('.nav-tabs a[href="#form-tab"]').click();

    const frame = this.page.frameLocator('iframe#workflowView-cardViewer');
    // Âncora de conteúdo: o formulário existe antes de estar montado. Esperar por um campo que
    // só aparece depois da montagem é o que separa "o iframe carregou" de "o formulário está
    // pronto para ser lido".
    await frame.locator('#tbProdutos, [id^=tbprod_produto]').first().waitFor({ state: 'attached' });

    const encontrado = this.page
      .frames()
      .find((f) => /cardViewer/i.test(f.name()) || /cardViewer/i.test(f.url()));
    if (!encontrado) {
      faltaPreCondicao(
        '(infraestrutura): a aba Formulário abriu mas o iframe do formulário não foi encontrado',
      );
    }
    return encontrado;
  }

  /**
   * Lê a seção **Validação do Item Orçamentário** do formulário aberto.
   *
   * A grade `tbItemOrcamentario` é uma tabela-mãe do Fluig: a primeira linha é o TEMPLATE (ids
   * sem sufixo, valores vazios) e as linhas reais recebem `___1`, `___2`… Ler sem descartar o
   * template faz o teste afirmar sobre uma linha que não existe para o usuário.
   *
   * @param {import('@playwright/test').Frame} frame
   * @returns {Promise<{ aprovadores: Array<{ responsavel: string, email: string, total: string,
   *   dataValidacao: string, horaValidacao: string, justificativa: string }>,
   *   itens: string[], temCampoJustificativa: boolean, temCamposDeTrilha: boolean }>}
   */
  async lerPainelOrcamentario(frame) {
    return frame.evaluate(() => {
      /** @param {string} id */
      const valor = (id) => {
        const e = /** @type {HTMLInputElement | null} */ (document.getElementById(id));
        return e ? (e.value ?? e.textContent ?? '').toString().trim() : '';
      };
      /** @param {string} id */
      const existe = (id) => document.getElementById(id) !== null;

      // Sufixos das linhas REAIS (o template não tem sufixo e é descartado).
      const sufixos = [...document.querySelectorAll('[id^="tbitorc_responsavelValid___"]')].map(
        (e) => e.id.replace('tbitorc_responsavelValid', ''),
      );

      const aprovadores = sufixos.map((s) => ({
        responsavel: valor(`tbitorc_responsavelValid${s}`),
        email: valor(`tbitorc_emailRespValid${s}`),
        total: valor(`tbitorc_vlrTotEstItem${s}`),
        dataValidacao: valor(`tbitorc_dataValid${s}`),
        horaValidacao: valor(`tbitorc_horaValid${s}`),
        justificativa: valor(`tbitorc_justificativa${s}`),
      }));

      const itens = [...document.querySelectorAll('[id^="tbprod_valorTotal___"]')]
        .map((e) => /** @type {HTMLInputElement} */ (e).value)
        .filter((v) => v && v !== '0');

      return {
        aprovadores,
        itens,
        temCampoJustificativa: existe('tbitorc_justificativa'),
        temCamposDeTrilha: existe('tbitorc_dataValid') && existe('tbitorc_horaValid'),
      };
    });
  }

  botaoAssumirTarefaAtual() {
    return this.page.getByRole('button', { name: 'Assumir tarefa' });
  }

  /**
   * Assume a tarefa atual a partir da tela de detalhe já aberta (`abrirDetalheDaSolicitacao`)
   * e espera a seção de decisão da etapa (Sim/Não + Justificativa) aparecer.
   * @param {string | number} numeroProcesso usado só para a mensagem de erro
   */
  async assumirTarefaAtual(numeroProcesso) {
    await this.botaoAssumirTarefaAtual().click();
    const heading = this.page.getByRole('heading', { level: 2 }).filter({ hasText: /^\d+\s*-/ });
    const abriu = await heading
      .waitFor({ state: 'visible', timeout: 30_000 })
      .then(() => true)
      .catch(() => false);
    if (abriu) return;

    // A tela de decisão não abriu em 30s. O servidor diz se o "Assumir" ACONTECEU — sem isso,
    // "o Fluig não atribuiu a tarefa" e "atribuiu, mas a tela não montou a tempo" saem com a
    // mesma mensagem, e o gate lê as duas como regressão. Medido em 10/09/2026: as SCs 96460 e
    // 96465 reprovaram aqui e, no servidor, tinham um movimento novo na atividade 7 — assumidas.
    // A tela continua sendo o que se exige; o servidor só classifica o vermelho.
    const { tarefa, motivo } = await consultarTarefaPendente(this.page, numeroProcesso);
    const login = process.env.QA_USERNAME ?? '';
    if (tarefa && login && tarefa.responsavel === login) {
      faltaPreCondicao(
        `(ambiente): a tarefa da SC #${numeroProcesso} foi assumida no servidor — ` +
          `${descreverTarefa(tarefa)} — mas a tela de decisão não abriu em 30s. O "Assumir" ` +
          'funcionou; foi a tela que não chegou a tempo.',
      );
    }
    throw new Error(
      `Assumir tarefa da solicitação #${numeroProcesso} não abriu a tela de decisão esperada, e no ` +
        `servidor a tarefa NÃO está com ${login || 'o usuário da automação'}: ${descreverTarefa(tarefa)}` +
        `${motivo ? ` — ${motivo}` : ''}.`,
    );
  }

  /**
   * Localiza, na tela de decisão de uma etapa já assumida (ex.: "Validação do Gestor"),
   * o radiogroup "Aprovar?" e o campo de justificativa. Genérico o bastante para qualquer
   * etapa que siga o mesmo padrão de UI (Sim/Não + Justificativa).
   */
  radioAprovarSim() {
    return this.frame.getByRole('radio', { name: 'Sim' });
  }

  radioAprovarNao() {
    return this.frame.getByRole('radio', { name: 'Não' });
  }

  campoJustificativaDecisao() {
    return this.frame.getByRole('textbox', { name: /Justificativa para a Aprovação\/Reprovação/ });
  }

  /**
   * Preenche a decisão (Sim/Não) e a justificativa da etapa atual, e aciona o Enviar do
   * rodapé (fora do iframe) — o mesmo botão usado para criar a SC.
   * @param {{ aprovar: boolean, justificativa: string }} decisao
   */
  async decidirEEnviar(decisao) {
    const radio = decisao.aprovar ? this.radioAprovarSim() : this.radioAprovarNao();
    const campo = this.campoJustificativaDecisao();

    // PRÉ-CONDIÇÃO: a seção de decisão terminou de montar. Confirmar só que o rádio ficou
    // marcado não bastava — medido em campo em 25/08/2026 (4 workers): a tela de decisão
    // ainda estava carregando (`getLastVersionDocument` em voo) quando o Enviar saiu, e o
    // Fluig respondeu HTTP 500 com "O campo \"Aprovar? - Linha 1\" é obrigatório!". O que
    // acontece nessa janela é o formulário RE-RENDERIZAR a seção depois do `check()`,
    // desmarcando o rádio: a assertion passou no instante certo e o estado se perdeu logo
    // depois. Esperar os controles existirem e o overlay do iframe sair é o que fecha a
    // janela — nesta ordem, porque exigir a ausência do overlay primeiro é satisfeito no
    // primeiro poll em que ele ainda nem foi criado (armadilha registrada no CLAUDE.md).
    await radio.waitFor({ state: 'visible' });
    await campo.waitFor({ state: 'visible' });
    await expect(
      this.frame.locator('.loading-message'),
      'o overlay de carregamento do iframe não saiu — a tela de decisão ainda está montando',
    ).toHaveCount(0, { timeout: 30_000 });

    // Convergência sobre estado observável (não retry cego, não tempo fixo): reaplica o que
    // um re-render tenha desfeito e só sai quando os DOIS campos estão com o valor esperado.
    await expect(async () => {
      if (!(await radio.isChecked())) await radio.check();
      if ((await campo.inputValue()) !== decisao.justificativa) await campo.fill(decisao.justificativa);
      await expect(radio).toBeChecked({ timeout: 2_000 });
      await expect(campo).toHaveValue(decisao.justificativa, { timeout: 2_000 });
    }).toPass({ timeout: 30_000, intervals: [500, 1_000, 2_000, 5_000] });

    await this.botaoEnviar.click();
  }

  /**
   * Após `decidirEEnviar`, o Enviar leva à MESMA tela de confirmação genérica usada na
   * criação da SC ("Solicitação NNNNNN movimentada com sucesso." + link "Acessar
   * solicitação #NNNNNN") — não à tela de detalhe com abas Histórico/Anexos diretamente.
   * Este método segue esse link e espera a tela de detalhe (com a aba Histórico) carregar.
   *
   * @param {string | number} [numeroProcesso] com ele, o silêncio da tela é classificado pelo
   *   servidor (ver o ramo `semRetorno`); sem ele, o silêncio é declarado como ambiente, como antes.
   */
  async abrirDetalheAposConfirmacao(numeroProcesso) {
    const linkConfirmacao = this.page.getByRole('link', { name: /^\d+$/ }).first();
    // O Fluig pode RECUSAR a movimentação em vez de confirmá-la (medido: HTTP 500 com
    // "Erro ao salvar dados do formulário: - O campo \"Aprovar? - Linha 1\" é obrigatório!").
    // Esperar só pelo link de confirmação transformava essa recusa — que traz a causa escrita
    // na tela — num `locator.waitFor: Timeout 30000ms` sem veredito nenhum.
    const dialogErro = this.page.getByRole('dialog').filter({ hasText: 'Erro' });

    const desfecho = await Promise.any([
      linkConfirmacao.waitFor({ state: 'visible', timeout: 60_000 }).then(() => 'confirmou'),
      dialogErro.waitFor({ state: 'visible', timeout: 60_000 }).then(() => 'recusou'),
    ]).catch(() => 'semRetorno');

    if (desfecho === 'recusou') {
      const texto = (await dialogErro.innerText().catch(() => '(texto indisponível)'))
        .replace(/\s+/g, ' ')
        .trim();
      throw new Error(
        `O Fluig RECUSOU a movimentação da tarefa em vez de confirmá-la. Mensagem exibida ao usuário: "${texto}"`,
      );
    }
    if (desfecho === 'semRetorno') {
      if (numeroProcesso === undefined) {
        faltaPreCondicao(
          '(ambiente): 60s após acionar Enviar na tela de decisão, o Fluig ' +
            'não deu retorno nenhum — nem a confirmação da movimentação, nem diálogo de erro. ' +
            `URL: ${this.page.url()}`,
        );
      }

      // Com o número, o servidor diz se a decisão ACONTECEU. Medido em 11/09/2026 (SC 96496): a
      // reprovação foi gravada — atividade 9 concluída pela conta, SC em "Ajustar Informações" — e a
      // tela não confirmou em 60s. Sem esta consulta, um Enviar que nunca chegou ao servidor sairia
      // como ambiente do mesmo jeito. O critério é o MOVIMENTO, não "a tarefa está com a conta":
      // depois de reprovar, "Ajustar Informações" cai justamente com a conta solicitante.
      const movtoDaTela = Number(new URL(this.page.url()).searchParams.get('app_ecm_workflowview_currentMovto') ?? Number.NaN);
      const { tarefa, motivo } = await consultarTarefaPendente(this.page, numeroProcesso);
      if (tarefa === undefined || Number.isNaN(movtoDaTela)) {
        throw new Error(
          `60s após acionar Enviar na SC #${numeroProcesso}, a tela não confirmou nem recusou, e não deu ` +
            'para saber no servidor se a decisão foi registrada: ' +
            `${motivo || 'a URL da tela não traz o movimento da tarefa'} — ${descreverTarefa(tarefa)}. URL: ${this.page.url()}`,
        );
      }
      if (tarefa !== null && tarefa.movimento === movtoDaTela) {
        throw new Error(
          `o Enviar não movimentou a SC #${numeroProcesso}: 60s depois, a tarefa segue no mesmo movimento ` +
            `(${movtoDaTela}) — ${descreverTarefa(tarefa)} — e a tela não mostrou confirmação nem erro.`,
        );
      }
      faltaPreCondicao(
        `(ambiente): a decisão da SC #${numeroProcesso} foi registrada no servidor — o movimento ${movtoDaTela} ` +
          `da tela foi superado (${descreverTarefa(tarefa)}) — mas a tela não confirmou em 60s.`,
      );
    }

    await linkConfirmacao.click();
    await this.headingHistorico().waitFor({ state: 'visible', timeout: 60_000 });
  }

  /** Heading level 2 da tela atual (ex.: "112097 - Validação do Gestor"). */
  headingAtual() {
    return this.page.getByRole('heading', { level: 2 });
  }

  /** Aba/heading "Histórico N" da tela de detalhe — usado para confirmar movimentação. */
  /**
   * A aba "Histórico" troca de papel semântico conforme a tela: `role=link` no formulário
   * recém-aberto (`FormularioSolicitacaoCompraPage`), mas `role=tab` na tela "Detalhes da
   * Solicitação" alcançada após decidir uma etapa — confirmado em campo. `getByText` cobre
   * as duas sem depender de qual papel a tela escolheu.
   */
  headingHistorico() {
    return this.page.getByText(/^\s*Histórico\s*\d*\s*$/).first();
  }

  /**
   * Linha "Atividade atual: <nome da etapa> (<status>)" do Histórico — sempre visível sem
   * rolar a lista (fica fixa no topo do feed). Usada para confirmar que uma decisão
   * (aprovar/reprovar) realmente MOVIMENTOU o processo, sem depender de encontrar a
   * justificativa no feed histórico (que é rolável/pode não estar tudo no DOM de uma vez).
   */
  atividadeAtual() {
    // O rótulo "Atividade atual:" é um <strong class="info-title"> separado do nome da
    // etapa (texto irmão) — por isso o locator localiza esse rótulo e sobe para o `<div>`
    // ancestral mais próximo, que contém o bloco inteiro (rótulo + nome da etapa + status).
    // Tentativas anteriores (filtrar `div, li, p` por `hasText` direto) devolviam texto
    // vazio em campo — o `<strong>` isolado é um alvo mais estável para localizar primeiro.
    return this.page
      .getByText('Atividade atual', { exact: false })
      .first()
      .locator('xpath=ancestor::div[1]');
  }

  /** @returns {Promise<string>} nome da etapa (ex.: "Distribuição Gestor Orçamentario") */
  async lerNomeAtividadeAtual() {
    const texto = (await this.atividadeAtual().textContent()) ?? '';

    // O bloco da atividade atual pode carregar texto extra além do nome — foi observado em
    // "Validação Orçamentária", que soma o aviso de consenso e o link "Visualizar diagrama".
    // Um recorte até o primeiro "(" devolvia esse ruído como se fosse o nome da atividade.
    // Ancorar no rótulo e parar na primeira quebra de linha é o que isola o nome de verdade.
    const m = texto.match(/Atividade atual:?\s*([^\n(]+)/);
    return (m ? m[1] : texto).trim();
  }
}
