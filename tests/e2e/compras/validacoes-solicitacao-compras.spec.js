// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { FormularioSolicitacaoCompraPage } from '../../../pages/FormularioSolicitacaoCompraPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * CT-CMP-02-S1 — envio com campos obrigatórios vazios.
 *
 * Com o formulário aberto e vazio, acionar Enviar deve bloquear a movimentação, sem criar
 * solicitação. A guarda de escrita prova isso: nenhuma tentativa deve chegar ao
 * `process-management`.
 *
 * Confirmado em campo: o Fluig recusa ANTES de qualquer requisição de escrita, com um
 * diálogo de erro no host da página (fora do iframe do formulário) —
 * "Erro ao validar as informações do formulário para movimentação" —, e o primeiro
 * obrigatório cobrado é a ausência de item de produto.
 */
test.describe('Validações do formulário clássico de Solicitação de Compras', () => {
  test('deve bloquear o envio e reportar o obrigatório pendente quando o formulário está vazio', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formulario = new FormularioSolicitacaoCompraPage(page);

    await formulario.goto();
    await formulario.expectAberto();

    await formulario.enviar();

    await expect(formulario.dialogErro).toBeVisible();
    await expect(formulario.dialogErro).toContainText(
      'Erro ao validar as informações do formulário para movimentação',
    );
    await expect(formulario.dialogErro).toContainText(
      'Para prosseguir com a solicitação sera necessario informar ao menos um produto',
    );

    await formulario.botaoOkErro.click();
    await expect(formulario.dialogErro).toBeHidden();

    // O formulário continua na mesma tela — não navegou para nenhuma confirmação de sucesso.
    await expect(page).toHaveTitle(/Movimentar Solicitação/);
    await expect(formulario.headingFormulario).toBeVisible();

    expect(guarda.tentativas(), 'nada deveria ter sido enviado ao servidor').toBe(0);
  });

  /**
   * CT-CMP-02-S2 — rateio abaixo de 100%.
   *
   * O rateio por Centro de Custo é alcançável sem salvar nada: "Adicionar Produto" e depois
   * "Adicionar Centro de Custo" só manipulam o DOM. Preencher apenas o percentual de Rateio
   * (90%) já é suficiente para provocar o erro específico de soma — não é preciso preencher
   * Classe Valor/Centro de Custo, porque a validação de soma dispara antes.
   *
   * Confirmado em campo: o campo Rateio tem um teto embutido — digitar um valor acima de
   * 100 (ex.: 110) é silenciosamente ajustado para 100 no blur, então não existe uma
   * mensagem de "acima de 100%" para reproduzir; a única solicitação REPROVÁVEL por soma é
   * a de percentual abaixo de 100%. Ver relatório final da suíte para o registro completo.
   *
   * A recusa aparece em DOIS diálogos sequenciais: primeiro o "Erro" do host (fora do
   * iframe), depois um segundo "Atenção:" dentro do próprio formulário — com texto distinto
   * do primeiro, não uma duplicação. Os dois precisam ser fechados para o formulário voltar
   * a ficar interativo.
   */
  test('deve bloquear o envio quando o rateio do item soma menos de 100%', async ({ page }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formulario = new FormularioSolicitacaoCompraPage(page);

    await formulario.goto();
    await formulario.expectAberto();
    await formulario.adicionarProduto();
    await formulario.adicionarCentroCusto();
    await formulario.preencherRateio('90');

    await formulario.enviar();

    await expect(formulario.dialogErro).toBeVisible();
    await expect(formulario.dialogErro).toContainText(
      'A soma dos percentuais de rateio não podem ser inferior a 100%',
    );
    await expect(formulario.dialogErro).toContainText('item 0001');
    await expect(formulario.dialogErro).toContainText('(90%)');
    await formulario.botaoOkErro.click();
    await expect(formulario.dialogErro).toBeHidden();

    await expect(formulario.dialogAtencao).toBeVisible();
    await expect(formulario.dialogAtencao).toContainText(
      'A soma dos percentuais de rateio deve ser igual a 100%',
    );
    await expect(formulario.dialogAtencao).toContainText('item 0001');
    await expect(formulario.dialogAtencao).toContainText('(90%)');
    await formulario.botaoOkAtencao.click();
    await expect(formulario.dialogAtencao).toBeHidden();

    await expect(page).toHaveTitle(/Movimentar Solicitação/);
    await expect(formulario.headingFormulario).toBeVisible();

    expect(guarda.tentativas(), 'nada deveria ter sido enviado ao servidor').toBe(0);
  });
});
