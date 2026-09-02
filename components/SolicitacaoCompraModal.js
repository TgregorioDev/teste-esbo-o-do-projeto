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
    if (dados.tipo !== undefined) {
      // Conferir a opção ANTES de tentar selecioná-la. `selectOption({ label })` com um rótulo
      // que não existe não falha na hora: fica repetindo até o timeout e reporta
      // `TimeoutError: locator.selectOption ... waiting for element to be visible and enabled`
      // — mensagem que aponta acionabilidade quando o problema é a OPÇÃO. Medido em
      // 28/08/2026: o ambiente removeu "Renovação Contratual" do combo e ~20 testes passaram a
      // reprovar com esse timeout, sem nenhuma pista da causa real.
      // ⚠️ Casar por texto NORMALIZADO e selecionar por VALUE, nunca por label literal.
      //
      // Os rótulos deste combo vêm com `U+00A0` (espaço não-quebrável) — a armadilha já
      // registrada em `docs/mapa-do-ambiente.md` e na skill `cassi-fluig-master`. Comparar
      // `'Aditivo Contratual'` com o rótulo cru falha por um caractere invisível, e
      // `selectOption({ label })` sofre do mesmo mal: não encontra a opção e fica repetindo
      // até o timeout. `\s` do JavaScript cobre o NBSP, então normalizar resolve os dois.
      const opcoes = await this.campoTipo.locator('option').evaluateAll((nós) =>
        nós.map((n) => ({
          value: /** @type {HTMLOptionElement} */ (n).value,
          texto: (n.textContent ?? '').replace(/\s+/g, ' ').trim(),
        })),
      );
      const alvo = dados.tipo.replace(/\s+/g, ' ').trim();
      const opcao = opcoes.find((o) => o.texto === alvo);

      if (!opcao) {
        throw new Error(
          `O combo "Tipo de Solicitação" não oferece "${dados.tipo}". Opções disponíveis: ` +
            `${JSON.stringify(opcoes.map((o) => o.texto))}. A lista de tipos mudou no ` +
            'ambiente — atualize `TIPO_SOLICITACAO` em `factories/solicitacao-compra.js` e ' +
            'leve a mudança ao time.',
        );
      }

      await this.campoTipo.selectOption(opcao.value);
    }
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
