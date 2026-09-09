// @ts-check

/** Rota do Portal do Comprador. */
const ROTA_PORTAL_COMPRADOR = '/portal/p/1/portal-do-comprador';

/**
 * Portal do Comprador (`/portal/p/1/portal-do-comprador`).
 *
 * Painel "Acesso Rápido" com as quatro etapas do ciclo de compras: Validação Inicial,
 * Controle De Cotações, Avaliação de Propostas e Definir Vencedor Cotação. A suíte é
 * somente leitura — nenhum teste clica em "Buscar", "Centralizar Solicitações" nem em ações
 * de linha.
 *
 * Nota de locator: cada etapa é renderizada DUAS vezes no DOM — como item do menu lateral
 * colapsado (`span.po-menu-icon-label`, oculto) e como o "tile" clicável do painel principal
 * (`p`, visível). Por isso os tiles são ancorados por `p:visible`, e não por texto solto.
 *
 * Particularidade observada em campo sobre "Atuar como": três das quatro sub-telas
 * (Controle de Cotações, Avaliação de Propostas, Definir Vencedor Cotação) expõem um
 * `<select>` nativo "Atuar como:" — o usuário da automação opera essas filas por
 * delegação. Confirmado repetidamente: sem trocar a delegação (o valor default é o próprio
 * usuário autenticado, sem nenhuma SC atribuída a ele nessas filas) as três telas vêm vazias
 * ("Nenhum dado encontrado" / grade sem linhas). A quarta sub-tela, Validação Inicial, NÃO
 * tem esse seletor e mostra dados reais diretamente — não depende de delegação. A suíte não
 * troca a delegação: fazer isso significaria operar a fila em nome de outro colaborador real
 * (`Arthur de Almeida Santos`), fora do escopo de leitura desta automação.
 */
export class PortalCompradorPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.titulo = page.getByRole('heading', { name: 'Acesso Rápido' });
    this.comboAtuarComo = page.locator('select');
  }

  async goto() {
    await this.page.goto(ROTA_PORTAL_COMPRADOR, { waitUntil: 'domcontentloaded' });
  }

  async expectCarregada() {
    await this.titulo.waitFor({ state: 'visible' });
  }

  /**
   * Tile clicável de uma etapa no painel "Acesso Rápido".
   * @param {'Validação Inicial' | 'Controle De Cotações' | 'Avaliação de Propostas' | 'Definir Vencedor Cotação'} nome
   * @returns {import('@playwright/test').Locator}
   */
  getTile(nome) {
    return this.page.locator('p:visible').filter({ hasText: nome });
  }

  /**
   * Abre uma etapa a partir do painel "Acesso Rápido" (primeira navegação da sub-SPA).
   * @param {'Validação Inicial' | 'Controle De Cotações' | 'Avaliação de Propostas' | 'Definir Vencedor Cotação'} nome
   */
  async abrirEtapa(nome) {
    await this.getTile(nome).click();
  }

  /**
   * Troca de etapa já dentro da sub-SPA, pelo menu lateral que aparece após a primeira
   * navegação. Mais estável que forçar a URL com hash, que não dispara o roteador Angular.
   * @param {'Validação Inicial' | 'Controle de Cotações' | 'Avaliação de Propostas' | 'Definir Vencedor Cotação'} nome
   */
  async irParaEtapa(nome) {
    await this.page.getByRole('menuitem', { name: nome, exact: true }).click();
  }

  /** Painel "Buscar" da Validação Inicial (filtros: Filial, Produto, Grupo de Produto, Centro de Custo). */
  get botaoBuscar() {
    return this.page.getByRole('button', { name: 'Buscar' });
  }

  /** Ação "Centralizar Solicitações" da Validação Inicial. */
  get botaoCentralizar() {
    return this.page.getByRole('button', { name: 'Centralizar Solicitações' });
  }

  /**
   * Diálogo de crítica do portal.
   *
   * Ancorado por `role="dialog"`, não pela tag PO-UI: medido, `po-dialog`/`.po-dialog` não
   * casam nada aqui, enquanto o contêiner que carrega a mensagem expõe o papel acessível.
   *
   * @returns {import('@playwright/test').Locator}
   */
  get dialogo() {
    return this.page.getByRole('dialog');
  }

  /**
   * Campo de busca por lookup (`po-lookup`), ancorado pelo rótulo.
   *
   * Não são combos: são `po-lookup`, e o que abre a lista é o botão de lupa
   * (`[aria-label="Pesquisar"]`) — clicar no input NÃO abre nada. Confundir os dois é o que
   * fazia a sonda achar que as listas estavam vazias.
   *
   * @param {'Filial' | 'Produto' | 'Grupo de Produto' | 'Centro de Custo'} rotulo
   * @returns {import('@playwright/test').Locator}
   */
  getLookup(rotulo) {
    return this.page
      .locator('po-lookup')
      .filter({ has: this.page.locator(`label:text-is("${rotulo}")`) });
  }

  /**
   * Abre a modal de um lookup e espera a grade trazer DADO — não a primeira linha qualquer.
   *
   * A grade nasce com uma linha única "Nenhum dado encontrado" e só depois é substituída pelo
   * resultado do ERP. Esperar por `tbody tr` mede o placeholder e conclui, errado, que a lista
   * está vazia. O critério é a linha deixar de ser o placeholder.
   *
   * @param {'Filial' | 'Produto' | 'Grupo de Produto' | 'Centro de Custo'} rotulo
   * @returns {Promise<boolean>} `false` quando o ERP não devolveu dado (pré-condição, não defeito)
   */
  async abrirLookup(rotulo) {
    await this.getLookup(rotulo).locator('[aria-label="Pesquisar"]').click();
    // `attached`, não `visible`: o custom element `po-lookup-modal` não tem caixa própria
    // (`isVisible()` responde false com a modal aberta na tela) — quem pinta é o wrapper.
    await this.page.locator('po-lookup-modal').waitFor({ state: 'attached' });
    return this.page
      .waitForFunction(
        () => {
          const linha = document.querySelector('po-lookup-modal tbody tr');
          return Boolean(linha) && !/Nenhum dado encontrado|Carregando/i.test(linha?.textContent ?? '');
        },
        null,
        { timeout: 45_000 },
      )
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Grade da modal de lookup aberta, como `{ cabecalhos, linhas }`.
   *
   * As linhas têm **uma célula a mais** que os cabeçalhos (a coluna de seleção, sem `th`), então
   * o alinhamento é pelo FIM. Alinhar pelo início desloca tudo em uma coluna e faz a suíte
   * julgar a ordenação da coluna errada — foi o que aconteceu na primeira medição.
   *
   * @returns {Promise<{ cabecalhos: string[], linhas: string[][] }>}
   */
  async lerGradeDoLookup() {
    return this.page.locator('po-lookup-modal').evaluate((modal) => {
      const tabela = modal.querySelector('table');
      const cabecalhos = [...(tabela?.querySelectorAll('thead th') ?? [])]
        .map((th) => (th.textContent ?? '').trim())
        .filter(Boolean);
      const brutas = [...(tabela?.querySelectorAll('tbody tr') ?? [])].map((tr) =>
        [...tr.querySelectorAll('td')].map((td) => (td.textContent ?? '').trim()),
      );
      const deslocamento = (brutas[0]?.length ?? 0) - cabecalhos.length;
      return { cabecalhos, linhas: brutas.map((c) => c.slice(deslocamento)) };
    });
  }

  /** Fecha a modal de lookup sem escolher nada. */
  async fecharLookup() {
    await this.page.getByRole('button', { name: 'Cancelar' }).last().click();
    await this.page.locator('po-lookup-modal').waitFor({ state: 'detached' });
  }

  /** Cabeçalhos da grade da etapa aberta. @returns {Promise<string[]>} */
  async lerCabecalhosDaGrade() {
    return (await this.getTabelaAtiva().locator('thead th').allInnerTexts())
      .map((c) => c.trim())
      .filter(Boolean);
  }

  /** @returns {import('@playwright/test').Locator} */
  getTabelaAtiva() {
    return this.page.locator('table:visible').first();
  }
}
