// @ts-check
import { ROTA_PORTAL_CONTRATOS } from '../config/ambiente.js';

/**
 * Portal de Acompanhamento de Contratos (`/portal/p/1/acompanhamentoContrato`).
 *
 * É por aqui que a Solicitação de Compra nasce a partir de um contrato existente —
 * ponto de entrada diferente do formulário em branco de `wf_solicitacao_compras`.
 *
 * Notas de locator observadas no ambiente:
 * - A grade é um DataTables com três `table` (cabeçalho, corpo e rodapé de rolagem);
 *   por isso os elementos são ancorados pelo texto/atributo e não por `getByRole('table')`.
 * - Os três ícones da coluna "Ação" são âncoras SEM texto e SEM aria-label: não têm nome
 *   acessível, e `getByRole('link', { name })` não os resolve. O único gancho estável hoje
 *   é o atributo `title`. Recomendação registrada ao time de desenvolvimento no README.
 */
export class AcompanhamentoContratosPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.titulo = page.getByRole('heading', { name: 'Acompanhamento de Contratos' });
    this.campoPesquisar = page.getByRole('searchbox', { name: 'Pesquisar' });
    this.seletorResultadosPorPagina = page.getByRole('combobox', { name: /Exibir resultados/ });
    this.informacaoDaGrade = page.getByRole('status').filter({ hasText: /Mostrando/ }).first();

    // O portal comunica cada desfecho em DOIS lugares: um aviso no corpo do painel e um
    // alerta sobreposto. Locator de texto solto casaria com os dois e quebraria em modo
    // estrito — por isso cada um tem seu locator próprio.
    this.avisoAcessoNegado = page.getByText(
      /Você não possui permissão para acessar o Acompanhamento de Contratos/i,
    );
    this.alertaAcessoNegado = page.getByRole('alert').filter({ hasText: 'Acesso negado' });

    this.avisoFalhaPermissao = page.getByText(/Falha ao validar suas permissões/i);
    this.alertaFalhaPermissao = page
      .getByRole('alert')
      .filter({ hasText: 'Falha ao validar acesso' });
  }

  async goto() {
    await this.page.goto(ROTA_PORTAL_CONTRATOS, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Pré-condição: a grade terminou de carregar.
   * Espera pela linha de informação do DataTables — estado observável, nunca tempo fixo.
   */
  async expectCarregada() {
    await this.titulo.waitFor({ state: 'visible' });
    await this.informacaoDaGrade.waitFor({ state: 'visible' });
  }

  /**
   * Filtra a grade por um número de contrato e aguarda o filtro ser aplicado.
   * @param {string} contrato
   */
  async filtrarPorContrato(contrato) {
    await this.campoPesquisar.fill(contrato);
    await this.page.getByRole('status').filter({ hasText: /Filtrados de/ }).first().waitFor();
  }

  /**
   * Ações disponíveis na linha do contrato, na ordem em que aparecem na coluna "Ação".
   * @returns {{ planilha: import('@playwright/test').Locator, solicitacaoCompra: import('@playwright/test').Locator, informacoes: import('@playwright/test').Locator }}
   */
  get acoesDaLinha() {
    return {
      planilha: this.page.getByTitle('Planilha', { exact: true }),
      solicitacaoCompra: this.page.getByTitle('Solicitação de Compra', { exact: true }),
      informacoes: this.page.getByTitle('Informações do Contrato', { exact: true }),
    };
  }

  /** Abre o modal de Solicitação de Compra a partir da linha filtrada. */
  async abrirSolicitacaoCompra() {
    await this.acoesDaLinha.solicitacaoCompra.click();
  }

  /**
   * Cabeçalhos da grade, na ordem esperada pelo negócio.
   * @returns {import('@playwright/test').Locator}
   */
  getCabecalhos() {
    return this.page.getByRole('columnheader');
  }

  /** @returns {import('@playwright/test').Locator} */
  getInformacaoDaGrade() {
    return this.informacaoDaGrade;
  }

  /**
   * Valores da coluna "Status" atualmente exibidos na grade.
   * Lidos do DOM porque a coluna não expõe papel próprio — é célula de tabela.
   * @returns {Promise<string[]>}
   */
  async lerStatusExibidos() {
    return this.page.evaluate(() => {
      /** @type {Set<string>} */
      const valores = new Set();
      document.querySelectorAll('tbody tr').forEach((linha) => {
        const celulas = linha.querySelectorAll('td');
        if (celulas.length > 6) valores.add((celulas[6].textContent ?? '').trim());
      });
      return [...valores].filter(Boolean);
    });
  }

  /**
   * @typedef {Object} LinhaDeContrato
   * @property {string} filial
   * @property {string} tipo
   * @property {string} contrato
   * @property {string} revisao
   * @property {string} status
   * @property {string} fornecedor
   */

  /**
   * Lê as linhas da grade como o usuário as vê.
   *
   * É a base da descoberta de massa em tempo de execução: em vez de fixar um número de
   * contrato em variável de ambiente — que some quando alguém finaliza, cancela ou revisa
   * aquele contrato —, o teste escolhe da grade um contrato que satisfaça o que ele precisa.
   *
   * Lido do DOM porque as células da tabela não expõem papel próprio.
   *
   * @returns {Promise<LinhaDeContrato[]>}
   */
  async lerLinhasDaGrade() {
    return this.page.evaluate(() => {
      /** @param {Element} c */
      const texto = (c) => (c?.textContent ?? '').trim();

      // flatMap em vez de map+filter: descartar a linha devolvendo [] mantém o tipo do
      // resultado sem precisar de type predicate.
      return [...document.querySelectorAll('tbody tr')].flatMap((linha) => {
        const c = linha.querySelectorAll('td');
        if (c.length < 8) return [];

        const contrato = texto(c[2]);
        if (contrato === '') return [];

        return [
          {
            filial: texto(c[0]),
            tipo: texto(c[1]),
            contrato,
            revisao: texto(c[5]),
            status: texto(c[6]),
            fornecedor: texto(c[7]),
          },
        ];
      });
    });
  }
}
