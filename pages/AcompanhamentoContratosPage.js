// @ts-check
import { ROTA_PORTAL_CONTRATOS } from '../config/ambiente.js';
import { faltaPreCondicao } from '../utils/pre-condicao.js';

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
    await this.expectPaginaPublicada();
  }

  /**
   * Falha CEDO, e com o motivo certo, quando a página não existe no ambiente.
   *
   * Medido em 09/09/2026 no tenant `caixade213859`: `/portal/p/1/acompanhamentoContrato`
   * responde a página de erro do Fluig — *"Recurso não foi encontrado"* — com título
   * "Error page". A widget não está publicada aqui; não é rota renomeada (12 variações do
   * código da página foram tentadas, todas Error page) nem falta de permissão (esta devolve
   * "Acesso negado", que a classe já modela logo acima).
   *
   * Sem esta verificação, cada um dos 54 testes que dependem do portal esperava 45s por um
   * heading que nunca vem e reprovava como TIMEOUT — indistinguível de regressão no relatório,
   * e ~40 minutos de espera por execução. Com ela, o veredito é imediato e o gate classifica
   * como ambiente, que é o que de fato é.
   */
  async expectPaginaPublicada() {
    const naoPublicada = await this.page
      .getByText(/Recurso não foi encontrado/i)
      .first()
      .isVisible()
      .catch(() => false);

    if (naoPublicada) {
      faltaPreCondicao(
        `(ambiente): a página ${ROTA_PORTAL_CONTRATOS} não está publicada neste ambiente — o ` +
          'Fluig responde "Recurso não foi encontrado". Sem o Acompanhamento de Contratos não ' +
          'há grade de contratos, e todo cenário que parte dela fica sem massa.',
      );
    }
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

  // ───────────────────────────────────────────────────────────────────────────────────────
  // Modais da coluna "Ação"
  //
  // Os três ícones abrem modais Bootstrap do style-guide do Fluig, e há duas armadilhas
  // medidas em 08/09/2026, ambas capazes de produzir teste verde por acidente:
  //
  // 1. `Escape` NÃO fecha estes modais. Um modal aberto continua interceptando o clique do
  //    ícone seguinte (`<div class="fluig-style-guide container-modal"> intercepts pointer
  //    events`), então quem não fechar pelo botão "Fechar" testa a tela errada.
  // 2. O modal de planilhas EMPILHA: abrir "Detalhes da Planilha" deixa "Informações da
  //    Planilha" aberto atrás. Por isso o locator é sempre ancorado no TÍTULO do modal, nunca
  //    em `.modal` genérico — que casaria com os dois em modo estrito.
  // ───────────────────────────────────────────────────────────────────────────────────────

  /**
   * Modal visível cujo título contém o texto dado.
   * @param {string|RegExp} titulo
   * @returns {import('@playwright/test').Locator}
   */
  modal(titulo) {
    return this.page.locator('.modal:visible').filter({ hasText: titulo }).last();
  }

  /**
   * Espera o modal terminar a SEGUNDA fase de carga.
   *
   * Estes modais preenchem em duas etapas: o corpo vem com os campos do contrato e, logo
   * depois, os campos que dependem de outra consulta (fiscal, CNPJ do fornecedor) aparecem
   * como o literal `Buscando...` até resolverem. Medido em 08/09/2026: resolvem em ~1 s.
   *
   * Sem esta espera o teste lê `Buscando...` e reprova por corrida, não por defeito — foi
   * exatamente o que aconteceu na primeira execução deste spec.
   *
   * @param {string} tituloParcial trecho do título do modal
   */
  async aguardarCargaCompleta(tituloParcial) {
    await this.page.waitForFunction(
      (t) => {
        const alvo = [...document.querySelectorAll('.modal')]
          .filter((m) => /** @type {HTMLElement} */ (m).offsetParent !== null)
          .find((m) => (m.querySelector('.modal-title')?.textContent || '').includes(t));
        return alvo ? !/Buscando\.\.\./.test(alvo.textContent || '') : false;
      },
      tituloParcial,
      { timeout: 30_000 },
    );
  }

  /**
   * Abre "Informações Complementares do Contrato" (ícone `Informações do Contrato`).
   *
   * O modal aparece ANTES de os campos serem preenchidos: o corpo é montado depois da resposta
   * do dataset. Esperar só por `visible` devolvia ficha vazia — medido, e é a mesma armadilha
   * que o CLAUDE.md registra para a contagem de alertas. Por isso a espera é por uma ÂNCORA
   * de conteúdo, não pelo contêiner nem por tempo fixo.
   */
  async abrirInformacoesDoContrato() {
    await this.acoesDaLinha.informacoes.click();
    const m = this.modal('Informações Complementares do Contrato');
    await m.waitFor({ state: 'visible' });
    await m.getByText('Número do Contrato:', { exact: false }).first().waitFor({ state: 'visible' });
    await this.aguardarCargaCompleta('Informações Complementares do Contrato');
    return m;
  }

  /**
   * Abre "Informações da Planilha", que lista as planilhas do contrato.
   * Espera o rodapé do DataTables ("Mostrando ... registros"), que só é escrito depois de a
   * lista ter sido montada — inclusive quando ela vem vazia.
   */
  async abrirPlanilhas() {
    await this.acoesDaLinha.planilha.click();
    const m = this.modal('Informações da Planilha');
    await m.waitFor({ state: 'visible' });
    await m.getByText(/Mostrando|Nenhum registro/i).first().waitFor({ state: 'visible' });
    return m;
  }

  /**
   * Abre "Detalhes da Planilha" a partir da n-ésima linha de "Informações da Planilha".
   * A ação da linha é uma âncora sem nome acessível — o gancho é o `title`, como nos ícones
   * da grade.
   * @param {number} [indice]
   */
  async abrirDetalhesDaPlanilha(indice = 0) {
    await this.page.getByTitle('Detalhes da Planilha').nth(indice).click();
    const m = this.modal('Detalhes da Planilha');
    await m.waitFor({ state: 'visible' });
    // Mesma razão de `abrirInformacoesDoContrato`: espera a ficha ter conteúdo, não só existir.
    // Atenção ao rótulo — nesta tela é "Numero", sem acento, diferente da ficha do contrato.
    await m.getByText('Numero do Contrato:', { exact: false }).first().waitFor({ state: 'visible' });
    await this.aguardarCargaCompleta('Detalhes da Planilha');
    return m;
  }

  /**
   * Pares rótulo → valor de um modal de ficha (Informações Complementares / Detalhes da
   * Planilha). Lidos do DOM porque os campos são `<label>` seguidos do valor no mesmo bloco,
   * sem papel ARIA que os relacione.
   *
   * A chave devolvida é o rótulo SEM os dois-pontos finais e sem espaços — a tela escreve
   * "Número do Contrato:" e comparar com o literal cru já quebrou teste aqui antes.
   *
   * @param {string} titulo título do modal
   * @returns {Promise<Record<string,string>>}
   */
  async lerCamposDoModal(titulo) {
    return this.page.evaluate((t) => {
      const modais = [...document.querySelectorAll('.modal')].filter(
        (m) => /** @type {HTMLElement} */ (m).offsetParent !== null,
      );
      const alvo = modais.find((m) =>
        (m.querySelector('.modal-title, h1, h2, h3')?.textContent || '').includes(t),
      );
      if (!alvo) return {};
      /** @type {Record<string,string>} */
      const campos = {};
      for (const lab of alvo.querySelectorAll('label, dt')) {
        const chave = (lab.textContent || '').trim().replace(/:\s*$/, '');
        if (!chave || chave.length > 45) continue;
        const pai = lab.parentElement;
        let valor = '';
        if (pai) {
          valor = (pai.textContent || '').replace(lab.textContent || '', '');
        }
        if (!valor.trim() && lab.nextElementSibling) {
          valor = lab.nextElementSibling.textContent || '';
        }
        campos[chave] = valor.replace(/\s+/g, ' ').trim();
      }
      return campos;
    }, titulo);
  }

  /**
   * Fecha o modal mais acima da pilha pelo botão "Fechar".
   * Não use `Escape`: medido em 08/09/2026, estes modais não respondem a ele.
   */
  async fecharModal() {
    await this.page.getByRole('button', { name: 'Fechar' }).last().click();
  }
}
