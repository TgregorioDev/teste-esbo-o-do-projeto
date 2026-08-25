// @ts-check
import { expect } from '@playwright/test';

/**
 * Formulário clássico de Parecer Técnico, iniciado direto por URL
 * (`/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras_parecer`).
 *
 * Confirmado por inspeção do DOM e da árvore de acessibilidade (não só `readOnly`, mas
 * `isVisible()`, que é o que `getByRole` respeita): os itens "3. Pontos que não atendem a
 * especificação" e "4. Pontos que superam a especificação" têm um `textarea` de observação
 * por PROPOSTA (`tbPNAProposta_observacao`, `tbPSProposta_observacao`), mas essa linha é um
 * TEMPLATE de tabela vinculado a uma proposta real — sem proposta vinculada (o caso de todo
 * este shell fora de contexto), a linha existe no DOM porém `display:none`, e portanto fica
 * fora da árvore de acessibilidade e não é preenchível. O único campo de texto livre
 * REALMENTE editável e visível é o item "5. Parecer" (`parecer_observacao`).
 *
 * O que segue bloqueado — confirmado por inspeção do DOM (`readOnly`) — é a seção
 * "7. Aprovação do Parecer Técnico": `parecerResponsavelValida` (Responsável),
 * `parecerEmailResponsavel`, `parecerDataValidacao` e `parecerHoraValidacao` nascem
 * `readonly` e VAZIOS nesta rota — não há responsável atribuído ao parecer. É exatamente o
 * cenário de CT-PAR-01-S1 ("parecer sem responsável definido"): o formulário permite compor
 * e enviar um parecer completo, mas sem ninguém designado para validá-lo.
 *
 * O radio "Emitir Parecer? Aprovado/Reprovado-Ajustes" tem o atributo HTML `required` de
 * verdade — o único controle, entre os três processos avulsos investigados nesta suíte, com
 * validação nativa do navegador (os demais "obrigatórios" visuais não têm efeito porque os
 * campos são `readonly`, e `readonly` desliga a obrigatoriedade nativa).
 */
export const ROTA_PARECER_TECNICO = '/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras_parecer';

export class ParecerTecnicoPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.frame = page.frameLocator('iframe[title="Visualizador"]');

    this.headingInicio = page.getByRole('heading', { name: 'Início', level: 2 });
    this.headingSecaoAprovacao = this.frame.getByRole('heading', { name: '7. Aprovação do Parecer Técnico' });

    // Vínculos com a Solicitação de Compra — readonly, nascem vazios.
    this.campoNumeroScFluig = this.frame.getByRole('textbox', { name: 'Nº da SC do Fluig' });
    this.campoNumeroScErp = this.frame.getByRole('textbox', { name: 'Nº da SC do ERP' });
    this.campoJustificativaSolicitacao = this.frame.getByRole('textbox', { name: 'Justificativa da Solicitação' });

    // Item 5 "Parecer" — o único texto livre realmente editável E visível do shell (itens 3
    // e 4 existem no DOM, mas como linha de template de proposta oculta — ver docstring).
    this.campoParecerObservacao = this.frame.getByRole('textbox', {
      name: 'Descreva as informações do parecer técnico. *',
    });

    // Seção 7 — Aprovação do Parecer Técnico. `exact: true` porque "Responsável *" é
    // substring de "Email do Responsável *", e o contrário também colide.
    this.campoResponsavel = this.frame.getByRole('textbox', { name: 'Responsável *', exact: true });
    this.campoEmailResponsavel = this.frame.getByRole('textbox', { name: 'Email do Responsável *' });
    this.radioAprovado = this.frame.getByRole('radio', { name: 'Aprovado' });
    this.radioReprovado = this.frame.getByRole('radio', { name: 'Reprovado/Ajustes' });
    // O input fica coberto pelo `<label>` estilizado (mesma armadilha de `CotacaoPage.js`).
    this.rotuloAprovado = this.frame.locator('label[for="parecerAprovadoSim"]');
    this.rotuloReprovado = this.frame.locator('label[for="parecerAprovadoNao"]');

    this.botaoEnviar = page.getByRole('button', { name: 'Enviar' });
    this.dialogErro = page.getByRole('dialog').filter({ hasText: 'Erro' });
    this.botaoOkErro = this.dialogErro.getByRole('button', { name: 'Ok, entendi' });
  }

  async goto() {
    await this.page.goto(ROTA_PARECER_TECNICO, { waitUntil: 'domcontentloaded' });
  }

  async expectAberto() {
    await this.headingInicio.waitFor({ state: 'visible' });
    await this.headingSecaoAprovacao.waitFor({ state: 'visible' });
  }

  /**
   * Preenche o único texto livre visível e editável do parecer.
   * @param {string} observacaoParecer
   */
  async preencherParecer(observacaoParecer) {
    await this.campoParecerObservacao.fill(observacaoParecer);
  }

  /** @param {boolean} aprovado */
  async marcarDecisao(aprovado) {
    await (aprovado ? this.rotuloAprovado : this.rotuloReprovado).click();
    await expect(aprovado ? this.radioAprovado : this.radioReprovado).toBeChecked();
  }

  async enviar() {
    await this.botaoEnviar.click();
  }
}
