// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { FormularioSolicitacaoCompraPage } from '../../../pages/FormularioSolicitacaoCompraPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * Preenche campo com máscara de formatação.
 *
 * O `fill()` do Playwright não dispara os eventos que a máscara escuta, e o valor volta
 * corrompido. Setter nativo + `input`/`change`/`blur` é a técnica já usada no ciclo da SC —
 * duplicada aqui pela mesma razão documentada lá: importar de outro `.spec.js` faria o
 * Playwright registrar aqueles testes duas vezes.
 *
 * @param {import('@playwright/test').Locator} locator
 * @param {string} valor
 */
async function preencherCampoMascarado(locator, valor) {
  await locator.evaluate((el, valorParaSetar) => {
    const proto = Object.getPrototypeOf(el);
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
    if (!descriptor || !descriptor.set) throw new Error('Campo sem setter nativo de "value".');
    descriptor.set.call(el, valorParaSetar);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }, valor);
}


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
  test('CT-CMP-02-S2 — deve bloquear o envio quando o rateio do item soma menos de 100%', async ({
    page,
  }) => {
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

  /**
   * FSWTBC-4952 — item com *Vlr. Total Estimado* abaixo de R$ 0,10.
   *
   * Origem do defeito, e é o que explica por que a regra existe: preço unitário chegando como
   * `0,000001` fazia `C1_XVALOR` (2 casas) virar `0` no Protheus, e o ExecAuto do MATA110
   * recusava com *"error code: 401 message: Tabela SC1"*. O "401" **não é** erro de acesso — é
   * crítica de preenchimento, e a SC 103685 ciclou entre *Grava SC* e *Correção* seis vezes
   * entre 06/07 e 07/08 por causa disso.
   *
   * A correção no Fluig criou o mínimo de R$ 0,10 na tela. O chamado segue **aberto na
   * prática**: o cliente reportou reincidência em 31/07, 07/08 e 12/08.
   *
   * Nada é enviado: a guarda de criação prova que a recusa acontece ANTES de qualquer escrita.
   */
  test('FSWTBC-4952 — item cujo Vlr. Total Estimado fica abaixo de R$ 0,10 é recusado na própria tela', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formulario = new FormularioSolicitacaoCompraPage(page);

    await formulario.goto();
    await formulario.expectAberto();
    await formulario.adicionarProduto();

    // 1 × 0,01 = 0,01, abaixo do mínimo. Os campos têm máscara: o `fill` puro não dispara os
    // eventos que o formulário escuta, por isso o setter nativo + input/change/blur — mesma
    // técnica já usada no ciclo da SC.
    await preencherCampoMascarado(
      formulario.frame.getByRole('textbox', { name: 'Quantidade' }),
      '1',
    );
    await preencherCampoMascarado(
      formulario.frame.getByRole('textbox', { name: 'Preço Unitário Estimado' }),
      '0,01',
    );

    // A crítica é do próprio formulário (SweetAlert dentro do iframe) e dispara no BLUR, não no
    // Enviar. Medido: o diálogo é titulado "Erro:", não "Atenção:" — filtrar pelo título errado
    // faz o teste morrer em timeout sem dizer por quê.
    await expect(formulario.dialogCriticaDeCampo).toBeVisible({ timeout: 30_000 });

    // Mensagem literal medida em 08/09/2026. Afirmar o texto inteiro é deliberado: o chamado é
    // sobre a regra do mínimo, e uma crítica genérica ("valor inválido") não diria ao usuário
    // o que ajustar nem em qual item.
    await expect(formulario.dialogCriticaDeCampo).toContainText(
      'O Vlr. Total Estimado não pode ser inferior a R$ 0,10!',
    );
    await expect(formulario.dialogCriticaDeCampo).toContainText('item 0001');

    test.info().annotations.push({
      type: 'critica-minimo',
      description: (await formulario.dialogCriticaDeCampo.innerText())
        .replace(/\s+/g, ' ')
        .slice(0, 200),
    });

    await formulario.botaoOkCriticaDeCampo.click();
    await expect(formulario.dialogCriticaDeCampo).toBeHidden();

    // NÃO afirmado aqui, e é deliberado: o chamado diz que, após o OK, o campo ofensor deveria
    // ser LIMPO ("avisa e apaga"). Não consegui medir esse ponto de forma confiável nesta
    // rodada — a linha do item nem sempre termina de renderizar a tempo de ler o valor. Sem
    // medição não há assertion: inventar a expectativa aqui produziria vermelho ou verde por
    // sorte. Fica declarado como lacuna, não como cobertura.

    expect(guarda.tentativas(), 'a crítica é de tela — nada deveria ir ao servidor').toBe(0);
  });

  /**
   * FSWTBC-4941 — rateio distribuído em DOIS centros de custo (60% / 40%).
   *
   * O chamado: o rateio informado na abertura da SC não foi transportado para o pedido de
   * compra; a investigação foi inviabilizada por log indisponível e o cliente acabou lançando o
   * rateio direto no pedido. Severidade Alta.
   *
   * A suíte inteira só exercitava rateio de UMA linha: o caminho feliz fecha 100% num único
   * centro de custo, e o negativo usa 90% também numa linha só. Ou seja, a distribuição — que é
   * o objeto do chamado, e que a `cassi-fluig-master` registra como *"principal causa de
   * chamados"* segundo o próprio cliente — nunca foi tocada.
   *
   * Este teste cobre a PRIMEIRA perna: o formulário aceita e preserva duas linhas somando 100,
   * sem crítica. Nada é enviado — a guarda prova.
   *
   * O que este teste NÃO cobre, e fica declarado em vez de simulado: o transporte do rateio até
   * o Tracker (visão *Produtos/Rateio SC*) e até o pedido no Protheus (SCH). O primeiro exige o
   * ciclo destrutivo completo; o segundo exige credencial de ERP, que não existe nesta rodada.
   */
  test('@bug FSWTBC-4941 — o item deve aceitar rateio distribuído em dois centros de custo somando 100%', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formulario = new FormularioSolicitacaoCompraPage(page);

    await formulario.goto();
    await formulario.expectAberto();
    await formulario.adicionarProduto();

    // Duas linhas de rateio para o mesmo item. A segunda usa o método que espera pela LINHA,
    // não pelos locators de nome acessível: com duas linhas na tela, "Rateio *" casa com as
    // duas e a espera genérica quebra.
    await formulario.adicionarCentroCusto();
    await formulario.adicionarOutroCentroDeCusto(2);

    await formulario.preencherRateioDaLinha(1, '60');
    await formulario.preencherRateioDaLinha(2, '40');

    const percentuais = await formulario.lerRateiosDoItem();
    const critica = await formulario.dialogCriticaDeCampo.innerText().catch(() => '(nenhuma)');

    test.info().annotations.push({
      type: 'rateio-distribuido',
      description:
        `linhas de rateio do item 0001: ${JSON.stringify(percentuais)} · ` +
        `crítica em tela: ${critica.replace(/\s+/g, ' ').slice(0, 180)}`,
    });

    // O formulário PRESERVA o que foi digitado — isso funciona.
    expect(percentuais).toEqual(['60', '40']);

    // E é aqui que ele falha. Medido em 08/09/2026: com 60 + 40 = 100 o formulário exibe
    // "A soma dos percentuais de rateio deve ser igual a 100%. Por favor, verifique o item
    // 0001". A validação não agrega as duas linhas — ela avalia a linha isoladamente —, de modo
    // que **distribuir rateio entre dois centros de custo é impossível pela tela**.
    //
    // Isso está a montante do FSWTBC-4941: o chamado relata rateio que não chega ao pedido, e o
    // que se mede aqui é que a SC sequer aceita ser aberta com rateio distribuído. A
    // `cassi-fluig-master` registra, do próprio cliente, que "inconsistências de rateio são a
    // principal causa de chamados" — este é um mecanismo concreto por trás disso.
    //
    // `@bug`: escrito contra o comportamento CORRETO, reprova hoje. Não afrouxe para verde.
    await expect(
      formulario.dialogCriticaDeCampo,
      'com 60% + 40% = 100% o formulário não deveria criticar a soma do rateio — hoje critica, ' +
        'e com isso impede a distribuição entre centros de custo pela tela',
    ).toBeHidden();

    expect(guarda.tentativas(), 'nada foi enviado — o teste é de preenchimento').toBe(0);
  });
});
