// @ts-check

/**
 * Documentos / GED (`/portal/p/1/ecmnavigation`).
 *
 * Grid jqGrid (não DataTables): a página expõe DOIS elementos com `role="grid"` (o mesmo
 * padrão de ambiguidade documentado para a grade de Acompanhamento de Contratos), então
 * colunas e linhas são ancoradas por atributo/estrutura estável, não por `getByRole('grid')`.
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

  /** Pré-condição: a grade carregou as três colunas e ao menos uma linha de conteúdo. */
  async expectCarregada() {
    await this.colunaDescricao.waitFor({ state: 'visible' });
    await this.colunaAtualizacao.waitFor({ state: 'visible' });
    await this.colunaCodigo.waitFor({ state: 'visible' });
    await this.linhasDeConteudo.first().waitFor({ state: 'visible' });
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
