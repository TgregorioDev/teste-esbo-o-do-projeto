// @ts-check
import { expect } from '@playwright/test';

/**
 * Normaliza o rótulo de uma `<option>` do combo "Tipo de Solicitação" para comparação segura.
 *
 * O HTML de origem do widget escreve os rótulos com entidade HTML (`Aditivo&nbsp;Contratual`,
 * `Nova&nbsp;Contrata&ccedil;&atilde;o`). O navegador decodifica a entidade, mas o espaço que
 * sobra é NBSP (U+00A0) — um caractere DIFERENTE do espaço comum (U+0020). Uma comparação
 * ingênua (`rotulo === 'Aditivo Contratual'`, com espaço comum) nunca bate, porque os dois
 * "espaços" não são o mesmo código; sem este tratamento, `selecionarTipo` acusaria "opção
 * inexistente" para um tipo que na verdade está lá. Por isso todo rótulo lido do DOM passa por
 * aqui antes de entrar em qualquer comparação ou mensagem de erro.
 * @param {string} rotulo
 * @returns {string}
 */
function normalizarRotuloOpcao(rotulo) {
  // U+00A0 = NBSP, o espaço que a entidade &nbsp; produz depois de decodificada pelo
  // navegador — troca por espaço comum (U+0020), colapsa espaços repetidos e corta as bordas.
  return rotulo.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Modal "Solicitação de Compra", aberto a partir de uma linha do Portal de
 * Acompanhamento de Contratos.
 *
 * É componente e não página: vive sobre o portal, e o mesmo modal é acionado de qualquer
 * linha da grade.
 *
 * Ao abrir, o widget encadeia sete datasets (filial, itens da planilha, produtos, rateios,
 * centro de custo, classe de valor e preço histórico). O carregamento dos itens é o que
 * habilita o envio — por isso `expectAberto` espera pelo campo já preenchido, e não por tempo.
 */
export class SolicitacaoCompraModal {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.dialog = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'Solicitação de Compra' }) });

    this.titulo = this.dialog.getByRole('heading', { name: 'Solicitação de Compra' });
    this.campoTipo = this.dialog.getByRole('combobox', { name: 'Tipo de Solicitação' });
    this.campoContrato = this.dialog.getByRole('textbox', { name: 'Contrato' });
    this.campoDataNecessidade = this.dialog.getByRole('textbox', { name: 'Data de Necessidade' });
    this.campoMotivo = this.dialog.getByRole('textbox', { name: 'Motivo da Solicitação' });
    this.botaoConfirmar = this.dialog.getByRole('button', { name: 'Confirmar' });
    this.botaoFechar = this.dialog.getByRole('button', { name: 'Fechar' });

    // O alerta é renderizado FORA do dialog, na raiz da página.
    this.alertaCamposObrigatorios = page.getByRole('alert').filter({ hasText: 'Campos Obrigatórios' });
    // Defeito D-11: quando o Protheus não responde, este alerta é renderizado DUAS vezes.
    // O locator devolve a coleção de propósito — há teste que afirma a contagem esperada.
    this.alertasErro = page.getByRole('alert').filter({ hasText: 'ERRO' });
  }

  /** Pré-condição: o modal abriu e já trouxe o contrato de origem. */
  async expectAberto() {
    await this.titulo.waitFor({ state: 'visible' });
    await this.campoContrato.waitFor({ state: 'visible' });
  }

  /**
   * Preenche apenas os campos informados — permite montar o cenário de campo faltante
   * sem precisar de um método por combinação.
   *
   * `dados.tipo` nunca é aplicado como um `selectOption({ label })` cego: um rótulo literal
   * (string) é tratado como atalho de `{ especifico: rotulo }` e, como qualquer intenção,
   * passa por `selecionarTipo` — que lê as opções REAIS do combo antes de escolher. Não há
   * caminho neste método que selecione uma opção sem antes confirmar que ela existe.
   * @param {Partial<import('../factories/solicitacao-compra.js').SolicitacaoCompra>} dados
   */
  async preencher(dados) {
    if (dados.tipo !== undefined) {
      const intencao = typeof dados.tipo === 'string' ? { especifico: dados.tipo } : dados.tipo;
      await this.selecionarTipo(intencao);
    }
    if (dados.dataNecessidade !== undefined) await this.campoDataNecessidade.fill(dados.dataNecessidade);
    if (dados.motivo !== undefined) await this.campoMotivo.fill(dados.motivo);
  }

  /**
   * Opções REAIS e HABILITADAS do combo "Tipo de Solicitação", como o ambiente as oferece
   * agora — nunca hardcoded. Filtra as `disabled` (o que inclui o(s) placeholder
   * "Selecione...", que hoje aparece DUPLICADO no HTML de origem do widget — achado de produto
   * D-13, ambos `disabled selected`, não bloqueia seleção mas está registrado no README).
   *
   * `valor` é o atributo `value` do `<option>` — é o que `selectOption({ value })` espera e o
   * que bate exatamente, sem NBSP nem entidade, com os literais de `TIPO_SOLICITACAO`
   * (ex.: `'Aditivo Contratual'`, com espaço comum). `rotulo` é o texto exibido, normalizado
   * (ver `normalizarRotuloOpcao`) — usado só para as mensagens de erro legíveis.
   * @returns {Promise<Array<{ valor: string, rotulo: string }>>}
   */
  async listarTiposDisponiveis() {
    const opcoes = await this.campoTipo.locator('option:not([disabled])').evaluateAll((els) =>
      els.map((el) => ({
        valor: /** @type {HTMLOptionElement} */ (el).value,
        rotulo: el.textContent ?? '',
      })),
    );
    return opcoes.map(({ valor, rotulo }) => ({ valor, rotulo: normalizarRotuloOpcao(rotulo) }));
  }

  /**
   * Seleciona um tipo pela INTENÇÃO declarada pelo caller — nunca por um literal fixo
   * escolhido de antemão. É a correção do antipadrão que derrubou 24 testes em 31/08/2026:
   * a factory tinha `'Renovação Contratual'` como default fixo, e quando o catálogo do
   * ambiente mudou, todo caso que herdava esse default (sem nunca ter pedido aquele tipo)
   * morreu num `TimeoutError` de 45s opaco, sem o cenário perdido aparecer no relatório.
   *
   *  - `{ especifico: 'Aditivo Contratual' }` — o caso PRECISA deste tipo por regra de
   *    negócio. Se ele não estiver mais disponível, falha imediatamente citando o que existe
   *    de verdade — nunca deixa o Playwright retentar por 45s um rótulo que não está no DOM.
   *  - `{ qualquerValido: true }` — o caso é AGNÓSTICO ao tipo; usa a primeira opção
   *    habilitada, qualquer que ela seja hoje. Continua funcionando mesmo que o catálogo mude
   *    de novo, sem exigir ajuste no teste — é a propriedade que faltava.
   *
   * A leitura acontece no combo JÁ ABERTO (estático por contrato — não varia, ver mapa de
   * intenção do diagnóstico de 31/08/2026), então não há corrida com carregamento: se
   * `disponiveis` vier vazio, é o próprio catálogo que está vazio — falha imediata e legível,
   * não um `selectOption` tentando por 45s.
   * @param {{ especifico: string } | { qualquerValido: true }} intencao
   * @returns {Promise<string>} o `value` efetivamente selecionado
   */
  async selecionarTipo(intencao) {
    const disponiveis = await this.listarTiposDisponiveis();

    expect(
      disponiveis.length,
      'PRÉ-CONDIÇÃO AUSENTE: o combo "Tipo de Solicitação" não ofereceu nenhuma opção ' +
        'habilitada (todas as opções vieram disabled ou o combo veio vazio) — investigar carga ' +
        'do widget wAcompanhaContratos antes de prosseguir. Isto não é timeout de locator.',
    ).toBeGreaterThan(0);

    if ('qualquerValido' in intencao) {
      const [escolhido] = disponiveis;
      await this.campoTipo.selectOption({ value: escolhido.valor });
      return escolhido.valor;
    }

    const escolhido = disponiveis.find(
      (op) => op.valor === intencao.especifico || op.rotulo === intencao.especifico,
    );

    expect(
      escolhido,
      `PRÉ-CONDIÇÃO AUSENTE: o caso precisa do tipo "${intencao.especifico}", mas o ambiente ` +
        `hoje só oferece: ${disponiveis.map((o) => o.rotulo).join(', ') || '(nenhuma opção habilitada)'}. ` +
        'Isto NÃO é para ser contornado trocando o tipo pedido no teste — é sinal de que o ' +
        'catálogo do ambiente mudou; confirme com o dono do ambiente antes de ajustar o teste ' +
        '(ver README > Divergências abertas, e o histórico de mudança do catálogo no ' +
        'diagnóstico de 31/08/2026).',
    ).toBeTruthy();

    const valor = /** @type {{ valor: string, rotulo: string }} */ (escolhido).valor;
    await this.campoTipo.selectOption({ value: valor });
    return valor;
  }

  /**
   * Aciona Confirmar.
   *
   * ⚠️ Com os quatro campos obrigatórios válidos, isto CRIA uma solicitação real no
   * ambiente — registro que não tem exclusão disponível. Cenários que chegam a criar são
   * marcados `@destrutivo` e não entram na execução padrão (ver README).
   */
  async confirmar() {
    await this.botaoConfirmar.click();
  }

  /** @returns {import('@playwright/test').Locator} */
  getAlertaCamposObrigatorios() {
    return this.alertaCamposObrigatorios;
  }

  /**
   * Coleção de alertas de erro exibidos. Ver D-11: hoje o mesmo erro sai duplicado.
   * @returns {import('@playwright/test').Locator}
   */
  getAlertasErro() {
    return this.alertasErro;
  }

  /** @returns {import('@playwright/test').Locator} */
  getDialog() {
    return this.dialog;
  }

  /** @returns {import('@playwright/test').Locator} */
  getOpcoesDeTipo() {
    return this.campoTipo.locator('option');
  }
}
