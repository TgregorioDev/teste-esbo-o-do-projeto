// @ts-check
import { expect } from '@playwright/test';

/**
 * Formulário clássico de Negociação de Cotação de Produtos e Serviços, iniciado direto por
 * URL (`/portal/p/1/pageworkflowview?processID=wf_negociacao_cotacao_prod_serv`).
 *
 * Mesmo padrão de shell fora de contexto já confirmado em `pages/CotacaoPage.js`: inspeção
 * do DOM do iframe (`iframe[title="Visualizador"]`) mostra que TODO campo de negócio
 * vinculado a uma cotação/proposta real — CNPJ/CPF, Razão Social, endereço/contato do
 * fornecedor, Nº da Cotação, Nº da SC do Fluig, Nº da SC do ERP, Filial, Comprador,
 * Validade da Cotação, Validade da Proposta, itens e totais — é `readonly` e nasce vazio.
 *
 * A diferença relevante em relação à Cotação: aqui a seção "Validação de Proposta" tem MAIS
 * controles editáveis — `propostaValidada` (radio Sim/Não) e `txta_justiValid`
 * (Justificativa, textarea livre) — além de `sl_tipoDeFrete` e `sw_devolveForn`. Mas a
 * própria tela avisa, em texto fixo ao lado do radio: **"A aprovação da negociação deve ser
 * realizada pelo Protheus."** — ou seja, mesmo estes campos sendo tecnicamente preenchíveis,
 * o próprio formulário declara que a decisão real não é tomada aqui.
 *
 * Sem uma proposta real vinculada (Responsável, Email, Data/Hora de Validação também
 * nascem readonly e vazios), marcar Sim/Não e enviar não representa "validar uma proposta"
 * — não há proposta nenhuma associada a este envio.
 */
export const ROTA_NEGOCIACAO = '/portal/p/1/pageworkflowview?processID=wf_negociacao_cotacao_prod_serv';

export class NegociacaoPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.frame = page.frameLocator('iframe[title="Visualizador"]');

    this.headingInicio = page.getByRole('heading', { name: 'Início', level: 2 });
    this.headingFormulario = this.frame.getByRole('heading', {
      name: 'Negociação de Cotação de Produtos/Serviços',
      level: 1,
    });

    // Fornecedor e vínculos — readonly e vazios.
    this.campoCnpjCpf = this.frame.getByRole('textbox', { name: 'CNPJ/CPF *' });
    this.campoRazaoSocial = this.frame.getByRole('textbox', { name: 'Razão social *' });
    this.campoNumeroCotacao = this.frame.getByRole('textbox', { name: 'Nº da Cotação *' });
    this.campoNumeroScFluig = this.frame.getByRole('textbox', { name: 'Nº da SC do Fluig *' });
    this.campoNumeroScErp = this.frame.getByRole('textbox', { name: 'Nº da SC do ERP *' });
    this.campoComprador = this.frame.getByRole('textbox', { name: 'Comprador *', exact: true });
    this.campoValidadeCotacao = this.frame.getByRole('textbox', { name: 'Validade da Cotação *' });
    this.campoValidadeProposta = this.frame.getByRole('textbox', { name: 'Validade da Proposta *' });
    this.campoSubTotal = this.frame.getByRole('textbox', { name: 'Sub Total *' });
    this.campoValorTotalPedido = this.frame.getByRole('textbox', { name: 'Valor total do Pedido *' });

    // Seção "Validação de Proposta" — Responsável/Email/Data/Hora nascem readonly e vazios.
    this.campoResponsavel = this.frame.getByRole('textbox', { name: 'Responsável *' });
    this.campoDataValidacao = this.frame.getByRole('textbox', { name: 'Data da Validação *' });

    // Controles editáveis do shell.
    this.selectTipoFrete = this.frame.getByRole('combobox', { name: 'Tipo de Frete *' });
    this.radioPropostaValidadaSim = this.frame.getByRole('radio', { name: 'Sim' }).first();
    this.radioPropostaValidadaNao = this.frame.getByRole('radio', { name: 'Não' }).first();
    // O input fica coberto pelo `<label>` estilizado (mesma armadilha de `CotacaoPage.js`) —
    // clicar precisa mirar o rótulo, não o radio.
    this.rotuloPropostaValidadaSim = this.frame.locator('label[for="propostaValidadaSim"]');
    this.rotuloPropostaValidadaNao = this.frame.locator('label[for="propostaValidadaNao"]');
    this.campoJustificativa = this.frame.getByRole('textbox', { name: 'Justificativa *' });
    this.textoAprovacaoPeloProtheus = this.frame.getByText(
      'A aprovação da negociação deve ser realizada pelo Protheus.',
    );

    this.botaoEnviar = page.getByRole('button', { name: 'Enviar' });
    this.dialogErro = page.getByRole('dialog').filter({ hasText: 'Erro' });
    this.botaoOkErro = this.dialogErro.getByRole('button', { name: 'Ok, entendi' });
  }

  async goto() {
    await this.page.goto(ROTA_NEGOCIACAO, { waitUntil: 'domcontentloaded' });
  }

  async expectAberto() {
    await this.headingInicio.waitFor({ state: 'visible' });
    await this.headingFormulario.waitFor({ state: 'visible' });
  }

  /**
   * Preenche os únicos campos realmente editáveis da decisão.
   * @param {{ aprovar: boolean, justificativa: string }} decisao
   */
  async preencherDecisao(decisao) {
    await (decisao.aprovar ? this.rotuloPropostaValidadaSim : this.rotuloPropostaValidadaNao).click();
    await expect(decisao.aprovar ? this.radioPropostaValidadaSim : this.radioPropostaValidadaNao).toBeChecked();
    await this.campoJustificativa.fill(decisao.justificativa);
  }

  async enviar() {
    await this.botaoEnviar.click();
  }
}
