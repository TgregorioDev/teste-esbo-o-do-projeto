// @ts-check
import { expect } from '@playwright/test';

/**
 * Documentos / GED (`/portal/p/1/ecmnavigation`).
 *
 * Grid jqGrid (não DataTables): a página expõe DOIS elementos com `role="grid"` (o mesmo
 * padrão de ambiguidade documentado para a grade de Acompanhamento de Contratos), então
 * colunas e linhas são ancoradas por atributo/estrutura estável, não por `getByRole('grid')`.
 *
 * ## A pasta corrente é estado de CONTA, no servidor (medido em 25/08/2026)
 *
 * `goto('/portal/p/1/ecmnavigation')` **sem parâmetro** não abre a Raiz: o servidor redireciona
 * para `?app_ecm_navigation_doc=<última pasta que a CONTA visitou>`. Medido com dois contextos
 * de navegador independentes (cookies distintos, mesmo login): a sessão A entra em
 * "Meus Documentos" (id 704916) e a sessão B, aberta depois, aterrissa em 704916 com o
 * breadcrumb *Raiz > Meus Documentos*. Não adianta forçar pela URL — `?app_ecm_navigation_doc=0`
 * também foi medido e **é ignorado**: a resposta continua sendo `navigation/content/704916`.
 * O único caminho que volta à Raiz é o link *Raiz* do breadcrumb (`voltarParaRaiz`).
 *
 * Consequência para quem escreve teste aqui: **nenhuma spec pode assumir que `goto()` aterrissa
 * na Raiz**, nem que a listagem tem o conteúdo da Raiz, porque qualquer outro teste rodando em
 * paralelo com a mesma conta muda essa pasta. Foi o que quebrou
 * `deve alterar a quantidade de resultados por página` numa execução com 4 workers: o `goto()`
 * caiu em "Meus Documentos" (50+ documentos, portanto paginado) em vez da Raiz, e a comparação
 * das descrições antes/depois passou a comparar páginas diferentes do mesmo conjunto.
 *
 * ## Pasta inválida = página SEM grade (a origem do timeout de `columnheader`)
 *
 * Medido: `?app_ecm_navigation_doc=<id inexistente>` responde HTTP 200 e renderiza o breadcrumb,
 * mas **não renderiza a grade** — nenhum `columnheader`, nenhuma linha. Como a pasta corrente é
 * estado de conta e sobrevive entre execuções, um `goto()` pode cair num id que não vale mais
 * para a conta e ficar 45s esperando por `getByRole('columnheader', ...)` que nunca vai existir.
 * Por isso `expectCarregada` falha com mensagem que **cita a URL** (é ela que identifica a pasta
 * culpada) e `irParaRaizGarantido` clica na Raiz **antes** de exigir a
 * grade — o breadcrumb renderiza mesmo quando a grade não renderiza.
 *
 * Notas de locator observadas em campo:
 * - As três colunas confirmadas (Descrição, Atualização, Código) resolvem por
 *   `getByRole('columnheader', { name })` sem ambiguidade — o grid duplicado não repete
 *   cabeçalho de coluna.
 * - O seletor de paginação é um `<select role="listbox">` sem nome acessível; é o único
 *   `listbox` da página, então `getByRole('listbox')` resolve sem ambiguidade.
 * - "Novo" e "Mais" carregam um `<span class="caret">` que entra no nome acessível
 *   (`"Novo "`, com espaço à direita) — resolvidos com `exact: false`. Os demais
 *   (Copiar/Colar/Recortar/Remover/Filtrar) resolvem com `exact: true`.
 * - Cada pasta é uma linha (`role="row"`) cujo texto é o nome da pasta, com uma célula
 *   clicável (`cursor:pointer`) que dispara a navegação — `abrirPasta` clica nesse texto.
 * - Toda navegação (entrar em pasta, voltar à Raiz, trocar página) dispara
 *   `GET /ecm/api/rest/ecm/navigation/content/<id>`; os métodos aguardam essa resposta em
 *   vez de tempo fixo.
 * - O paginador do jqGrid não é botão nem link acessível: são `<td>` (`#next_ecm-navigation-page`,
 *   `#prev_ecm-navigation-page`) e o estado desabilitado é a classe `ui-state-disabled` — não o
 *   atributo `disabled`. `isEnabled()` **não** enxerga essa desabilitação; é preciso ler a classe.
 */
export class DocumentosPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.rota = '/portal/p/1/ecmnavigation';

    this.breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    this.linkRaiz = page.getByRole('link', { name: 'Raiz', exact: true });

    this.colunaDescricao = page.getByRole('columnheader', { name: 'Descrição' });
    this.colunaAtualizacao = page.getByRole('columnheader', { name: 'Atualização' });
    this.colunaCodigo = page.getByRole('columnheader', { name: 'Código' });

    this.seletorResultadosPorPagina = page.getByRole('listbox');

    // Paginador do jqGrid — ver nota no cabeçalho: `<td>` desabilitado por classe CSS.
    this.paginaSeguinte = page.locator('#next_ecm-navigation-page');

    this.acoes = {
      novo: page.getByRole('link', { name: 'Novo', exact: false }),
      copiar: page.getByRole('link', { name: 'Copiar', exact: true }),
      colar: page.getByRole('link', { name: 'Colar', exact: true }),
      recortar: page.getByRole('link', { name: 'Recortar', exact: true }),
      remover: page.getByRole('link', { name: 'Remover', exact: true }),
      filtrar: page.getByRole('link', { name: 'Filtrar', exact: true }),
      mais: page.getByRole('link', { name: 'Mais', exact: false }),
    };

    this.grade = page.locator('table#ecm-navigation-grid');
    // Linhas com conteúdo real (exclui a linha vazia de preenchimento do jqGrid).
    this.linhasDeConteudo = this.grade
      .locator('tbody tr[role="row"]')
      .filter({ has: page.locator('.document-description') });
  }

  async goto() {
    await this.page.goto(this.rota, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Pré-condição: a grade carregou as três colunas e ao menos uma linha de conteúdo.
   *
   * A mensagem cita a URL corrente de propósito: quando a grade não renderiza, a causa
   * conhecida é a pasta corrente da conta (`app_ecm_navigation_doc`) não valer mais — e sem o
   * id no relatório não há como saber qual pasta derrubou a execução. Ver cabeçalho da classe.
   */
  async expectCarregada() {
    const ondeEstou = `URL: ${this.page.url()}`;
    await expect(
      this.colunaDescricao,
      `a grade do ECM não renderizou (nenhum cabeçalho "Descrição"). Pasta corrente da conta ` +
        `inválida ou sem permissão? ${ondeEstou}`,
    ).toBeVisible({ timeout: 45_000 });
    await expect(this.colunaAtualizacao, `coluna "Atualização" ausente. ${ondeEstou}`).toBeVisible();
    await expect(this.colunaCodigo, `coluna "Código" ausente. ${ondeEstou}`).toBeVisible();
    await expect(
      this.linhasDeConteudo.first(),
      `a grade renderizou sem nenhuma linha de conteúdo. ${ondeEstou}`,
    ).toBeVisible();
  }

  /**
   * Enquanto o jqGrid carrega, ele cobre grade e paginador com `#lui_ecm-navigation-grid`
   * (`ui-widget-overlay`), que intercepta o ponteiro: qualquer clique disparado nessa janela
   * gasta os 45s de `actionTimeout` reclamando "intercepts pointer events" — inclusive marcar o
   * checkbox de uma linha que já está visível. Esperar o overlay sair é condição observável.
   */
  async aguardarGradeOciosa() {
    await expect(this.page.locator('#lui_ecm-navigation-grid')).toBeHidden();
  }

  /**
   * A página atual da grade é a última? Lê a classe do `<td>` do paginador — o jqGrid não usa
   * o atributo `disabled` aqui, então `isEnabled()` responderia `true` mesmo no fim da lista.
   */
  async temProximaPagina() {
    const classe = (await this.paginaSeguinte.getAttribute('class')) ?? '';
    return !classe.includes('ui-state-disabled');
  }

  /**
   * Avança uma página da grade, aguardando a resposta de navegação do ECM.
   *
   * Dois detalhes medidos em campo, os dois já tendo custado um `locator.click: Timeout 45000ms`:
   *  1. o alvo do clique é o `<span class="ui-icon">` **dentro** do `<td>` — o `<td>` tem 46px de
   *     altura contra 24px do ícone, e o centro dele cai fora do ícone, onde quem recebe o
   *     ponteiro é a própria `table.ui-pg-table` (o Playwright reporta "intercepts pointer
   *     events" e repete o clique até estourar);
   *  2. durante a troca de página o jqGrid cobre grade e paginador com
   *     `#lui_ecm-navigation-grid` (`ui-widget-overlay`), que também intercepta o ponteiro —
   *     esperar o overlay sair é condição observável, não espera cega.
   */
  async irParaProximaPagina() {
    await this.aguardarGradeOciosa();
    const resposta = this.page.waitForResponse((r) =>
      r.url().includes('/ecm/api/rest/ecm/navigation/content/'),
    );
    await this.paginaSeguinte.locator('span.ui-icon').click();
    await resposta;
  }

  /** @returns {Promise<number>} */
  async contarLinhasDeConteudo() {
    return this.linhasDeConteudo.count();
  }

  /** Nomes das pastas/documentos exibidos na página atual da grade. */
  async lerDescricoes() {
    return this.linhasDeConteudo.locator('.document-description').allTextContents();
  }

  /**
   * Localiza a linha pelo nome exibido e clica na célula de descrição (a única com
   * `cursor:pointer`), aguardando a resposta do endpoint de navegação do ECM.
   * @param {string} nomeDaPasta
   */
  async abrirPasta(nomeDaPasta) {
    const resposta = this.page.waitForResponse((r) =>
      r.url().includes('/ecm/api/rest/ecm/navigation/content/'),
    );
    await this.page
      .getByRole('row', { name: new RegExp(nomeDaPasta) })
      .getByText(nomeDaPasta, { exact: true })
      .click();
    await resposta;
    // A resposta de navegação já sincroniza a troca de pasta. Não se espera por linha aqui:
    // pasta legitimamente vazia é estado válido, e engolir a falha da espera esconderia erro.
    // As assertions do teste têm auto-wait próprio para o que cada caso precisa.
  }

  /**
   * Pré-condição de todo teste desta suíte: força a Raiz pelo breadcrumb, nunca confia que
   * `goto()` aterrissou lá — a conta lembra a última pasta navegada, por usuário, no servidor.
   *
   * A ORDEM aqui é o que torna o método imune ao pior caso: espera-se o **link Raiz do
   * breadcrumb**, não a grade. Medido em campo: quando a pasta corrente da conta não vale mais,
   * a página renderiza o breadcrumb e **não** renderiza a grade — exigir `expectCarregada()`
   * antes do clique gastava os 45s de `actionTimeout` esperando um `columnheader` que nunca
   * apareceria, e o teste morria antes de ter chance de sair da pasta ruim. Clicando na Raiz
   * primeiro, a pasta ruim é abandonada e a grade volta a existir.
   */
  async irParaRaizGarantido() {
    await this.goto();
    await this.linkRaiz.waitFor({ state: 'visible' });
    await this.voltarParaRaiz();
    await this.expectCarregada();
  }


  /** Recarrega a pasta corrente (a URL carrega o `app_ecm_navigation_doc`) e a repagina do 1. */
  async recarregarPastaAtual() {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await this.expectCarregada();
  }

  /** Volta para a Raiz pela âncora do breadcrumb, aguardando a resposta de navegação. */
  async voltarParaRaiz() {
    const resposta = this.page.waitForResponse((r) =>
      r.url().includes('/ecm/api/rest/ecm/navigation/content/0'),
    );
    await this.linkRaiz.click();
    await resposta;
    await this.linhasDeConteudo.first().waitFor({ state: 'visible' });
  }

  /**
   * Troca a quantidade de resultados por página e aguarda a resposta do endpoint de
   * navegação com o novo tamanho de página confirmado na própria requisição.
   * @param {30 | 50 | 75 | 100} quantidade
   */
  async alterarResultadosPorPagina(quantidade) {
    const resposta = this.page.waitForResponse(
      (r) =>
        r.url().includes('/ecm/api/rest/ecm/navigation/content/') &&
        r.url().includes(`rows=${quantidade}`),
    );
    await this.seletorResultadosPorPagina.selectOption(String(quantidade));
    await resposta;
  }
}
