// @ts-check

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
   * @param {Partial<import('../factories/solicitacao-compra.js').SolicitacaoCompra>} dados
   */
  async preencher(dados) {
    if (dados.tipo !== undefined) await this.campoTipo.selectOption({ label: dados.tipo });
    if (dados.dataNecessidade !== undefined) await this.campoDataNecessidade.fill(dados.dataNecessidade);
    if (dados.motivo !== undefined) await this.campoMotivo.fill(dados.motivo);
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
