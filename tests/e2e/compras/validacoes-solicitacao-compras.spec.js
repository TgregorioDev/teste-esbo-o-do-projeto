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

  /**
   * FSWTBC-1906 / FSWTBC-1954 — rateio de 100% escrito com casas decimais terminadas em zero.
   *
   * Os dois chamados são o mesmo defeito visto de dois lugares (SC nº 28314): o rateio somava
   * 100 e a crítica de "diferente de 100%" disparava assim mesmo, porque o zero à direita
   * quebrava a comparação. É o terceiro defeito de rateio por precisão numérica em JavaScript
   * na mesma quinzena — daí o cuidado de guardar a forma exata que quebrava.
   *
   * O oráculo é o **Enviar**, não o preenchimento. Medido em 09/09/2026: com uma única linha de
   * rateio, nenhuma crítica dispara ao sair do campo — nem com 99,90. Uma versão anterior deste
   * teste afirmava sobre a crítica logo após digitar e passava por acidente, inclusive com
   * valor inválido. Quem avalia a soma é a validação do envio, como já faz o CT-CMP-02-S2 aqui
   * ao lado.
   *
   * Nada é criado: o Enviar é recusado antes de qualquer escrita pelos demais obrigatórios (o
   * item não tem produto nem preço), e a guarda prova. O que se afirma é preciso: seja qual for
   * a crítica que aparecer, ela **não** é sobre a soma do rateio.
   *
   * Fica em UMA linha de propósito: com duas, o defeito de agregação medido no FSWTBC-4941
   * critica antes e este teste mediria aquele defeito, não este. A alimentação por planilha
   * (Download/Upload do modelo) não é exercitada — depende de contrato com itens.
   */
  test('FSWTBC-1906 FSWTBC-1954 — rateio de "100,00" fecha os 100% sem crítica de soma', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formulario = new FormularioSolicitacaoCompraPage(page);

    await formulario.goto();
    await formulario.expectAberto();
    await formulario.adicionarProduto();
    await formulario.adicionarCentroCusto();

    // A forma exata do chamado: 100 escrito com casas decimais que terminam em zero.
    await formulario.preencherRateioDaLinha(1, '100,00');
    expect(await formulario.lerRateiosDoItem()).toEqual(['100,00']);

    await formulario.enviar();
    await expect(formulario.dialogErro).toBeVisible();

    const critica = [
      await formulario.dialogErro.innerText().catch(() => ''),
      await formulario.dialogAtencao.innerText().catch(() => ''),
    ]
      .join(' | ')
      .replace(/\s+/g, ' ');

    test.info().annotations.push({
      type: 'rateio-zeros-a-direita',
      description: `crítica devolvida pelo Enviar: ${critica.slice(0, 240)}`,
    });

    expect(
      critica,
      'rateio de 100 escrito com zeros à direita ("100,00") soma exatamente 100% — criticar a ' +
        'soma aqui é o defeito de precisão numérica dos chamados 1906/1954',
    ).not.toMatch(/soma dos percentuais de rateio/i);

    // E a prova de que a checagem de soma foi ALCANÇADA e passada, não pulada: a crítica que
    // volta é a seguinte da fila, sobre os zooms do rateio (Classe de Valor e Centro de Custo)
    // ainda vazios. Com 90% em vez de 100,00 o formulário para antes disso, na própria soma —
    // é o que o CT-CMP-02-S2 afirma aqui ao lado. Sem esta segunda assertion, "não criticou a
    // soma" também seria verdade se o validador nem tivesse chegado ao rateio.
    expect(
      critica,
      'a validação deveria ter passado da soma e chegado à completude do rateio',
    ).toMatch(/rateio sem preenchimento/i);

    expect(guarda.tentativas(), 'nada deveria ter sido enviado ao servidor').toBe(0);
  });

  /**
   * FSWTBC-4819 — a seleção de filiais lista a CASSI inteira, não uma filial só.
   *
   * O chamado é literal: "Sistema exibe apenas a filial 1101 na seleção de filiais", o que
   * inviabilizava abrir solicitação para as demais unidades. O oráculo, portanto, é o tamanho
   * e a diversidade da lista — não uma filial específica, que mudaria com o cadastro do ERP.
   *
   * Nada é enviado: abrir o zoom é leitura, e a guarda prova.
   */
  test('FSWTBC-4819 — o zoom "Nome da Filial" lista várias filiais, não só a 1101', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formulario = new FormularioSolicitacaoCompraPage(page);

    await formulario.goto();
    await formulario.expectAberto();

    const busca = formulario.frame.getByRole('searchbox', { name: 'Nome' }).first();
    await busca.click();
    const opcoes = formulario.frame.getByRole('option');
    const lerRotulos = async () =>
      (await opcoes.allInnerTexts()).map((r) => r.replace(/\s+/g, ' ').trim());

    // A lista nasce com a opção-placeholder "Buscando…" enquanto o zoom consulta o ERP. Contar
    // antes disso mede o placeholder e acusa "uma filial só" — que é justamente o sintoma do
    // chamado, e daria um vermelho que é artefato de sincronização, não defeito.
    await expect
      .poll(async () => (await lerRotulos()).filter((r) => !/^Buscando/i.test(r)).length, {
        timeout: 45_000,
      })
      .toBeGreaterThan(0);

    const rotulos = (await lerRotulos()).filter((r) => !/^Buscando/i.test(r));

    // O que o chamado mede é a variedade de FILIAIS, não o número de linhas: a lista traz uma
    // entrada de serviço ("Filtrar colunas") que contaria como opção sem ser filial nenhuma.
    const codigos = [...new Set(rotulos.flatMap((r) => r.match(/FILIAL (\d{3,})/)?.[1] ?? []))];

    test.info().annotations.push({
      type: 'zoom-filiais',
      description:
        `${rotulos.length} opções, ${codigos.length} filiais distintas; ` +
        `primeiras: ${codigos.slice(0, 6).join(', ')}`,
    });

    expect(
      codigos.length,
      'o zoom de filial ofereceu uma única filial — é exatamente o sintoma do FSWTBC-4819, que ' +
        'impedia abrir solicitação para as demais unidades da CASSI',
    ).toBeGreaterThan(1);

    expect(guarda.tentativas()).toBe(0);
  });
});
