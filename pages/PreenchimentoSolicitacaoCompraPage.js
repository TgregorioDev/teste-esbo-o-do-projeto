// @ts-check
import { expect } from '@playwright/test';
import { FormularioSolicitacaoCompraPage } from './FormularioSolicitacaoCompraPage.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ANEXO_VALIDO = path.join(__dirname, '../fixtures/anexos/documento-valido.pdf');

/**
 * Preenchimento COMPLETO do formulário clássico de Solicitação de Compras
 * (`pageworkflowview?processID=wf_solicitacao_compras`) — identificação, filial, um item de
 * produto com quantidade/valor, rateio fechando 100%, anexo e envio.
 *
 * ## Por que este arquivo existe
 *
 * A mesma sequência já vivia duplicada em `tests/e2e/compras/ciclo-solicitacao-compras.spec.js`
 * e em `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js`, com um comentário
 * explicando a duplicação: importar um `.spec.js` de outro faria o Playwright REGISTRAR os
 * testes daquele arquivo duas vezes. Os testes de Tarefas (CT-TSK-07-H e CT-TSK-08-H) precisam
 * da MESMA massa — uma SC do próprio teste, assumida na "Validação do Gestor" — e uma
 * TERCEIRA cópia de 240 linhas seria pagar o preço da duplicação sem o motivo dela.
 *
 * A saída é a que o projeto já aceita para lógica de tela: um Page Object, composto sobre
 * `FormularioSolicitacaoCompraPage` (que segue sendo o dono dos locators de nível superior).
 * As duas cópias existentes ficam INTOCADAS de propósito — trocar as specs de Compras por esta
 * classe é refatoração de arquivo de outra suíte, fora do escopo desta implementação.
 *
 * As técnicas abaixo (clique por coordenada, setter nativo de `value`, retentativa no zoom do
 * rateio) foram medidas em campo pelas suítes de Compras; os comentários originais explicam o
 * "porquê" de cada uma e foram preservados.
 */

/** @param {import('@playwright/test').Page} page @param {import('@playwright/test').FrameLocator} frame @param {import('@playwright/test').Locator} locator */
async function clicarPorCoordenada(page, frame, locator) {
  await locator.scrollIntoViewIfNeeded();
  await frame
    .locator('.tooltip-inner')
    .waitFor({ state: 'hidden', timeout: 3_000 })
    .catch(() => {});
  const box = await locator.boundingBox();
  if (!box) throw new Error('Elemento sem bounding box — não está realmente visível para clique por coordenada.');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/** @param {import('@playwright/test').Locator} locator @param {string} valor */
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
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').FrameLocator} frame
 * @param {string} nomeCampoBusca
 * @param {string} termoBusca
 * @param {RegExp} opcaoEsperada
 * @param {import('@playwright/test').Locator} [campoDeConfirmacao]
 */
async function selecionarNoComboDeBusca(page, frame, nomeCampoBusca, termoBusca, opcaoEsperada, campoDeConfirmacao) {
  const tentativasMax = 3;
  for (let tentativa = 1; tentativa <= tentativasMax; tentativa++) {
    const searchbox = frame.getByRole('searchbox', { name: nomeCampoBusca });
    await searchbox.click();
    await searchbox.fill(termoBusca);
    const opcao = frame.getByRole('option', { name: opcaoEsperada }).first();
    await opcao.waitFor({ state: 'visible' });
    await clicarPorCoordenada(page, frame, opcao);

    if (!campoDeConfirmacao) return;
    try {
      await expect(campoDeConfirmacao).not.toHaveValue('', { timeout: 5_000 });
      return;
    } catch {
      if (tentativa === tentativasMax) {
        throw new Error(
          `Seleção em "${nomeCampoBusca}" não refletiu no campo de confirmação após ${tentativasMax} tentativas.`,
        );
      }
    }
  }
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').FrameLocator} frame
 * @param {number} indiceDoIcone 0 = Classe Valor, 1 = Centro de Custo
 * @param {RegExp} padraoCelula
 */
async function selecionarNoZoomDoRateio(page, frame, indiceDoIcone, padraoCelula) {
  // 5 tentativas (não 3): este popup mostrou, sob carga concorrente do ambiente, falhar
  // "not attached"/timeout mais vezes seguidas que os outros widgets do formulário —
  // confirmado em campo como re-render assíncrono transiente, não erro de lógica.
  const tentativasMax = 5;
  const icone = frame.locator('[id^="fluigfilter"][id$="_toggleTable"]').nth(indiceDoIcone);

  for (let tentativa = 1; tentativa <= tentativasMax; tentativa++) {
    try {
      await icone.scrollIntoViewIfNeeded();
      await frame
        .locator('.tooltip-inner')
        .waitFor({ state: 'hidden', timeout: 3_000 })
        .catch(() => {});
      await icone.click({ timeout: 8_000 }).catch(() => clicarPorCoordenada(page, frame, icone));

      const celula = frame.getByRole('cell', { name: padraoCelula }).last();
      const apareceu = await celula.waitFor({ state: 'visible', timeout: 8_000 }).then(
        () => true,
        () => false,
      );
      if (apareceu) {
        const textoEscolhido = (await celula.innerText()).trim();
        // `Locator.click()` primeiro: tem retry/actionability nativos do Playwright, mais
        // robustos que o clique por coordenada (que só calcula a posição uma vez) quando o
        // popup se re-renderiza logo depois de aparecer (observado em campo: elemento fica
        // "not attached" entre localizar e agir). Cai para coordenada só se isso falhar
        // (ex.: tooltip realmente sobrepondo o alvo).
        await celula.click({ timeout: 8_000 }).catch(() => clicarPorCoordenada(page, frame, celula));

        const chip = frame.getByText(textoEscolhido, { exact: false }).first();
        const confirmou = await chip.waitFor({ state: 'visible', timeout: 5_000 }).then(
          () => true,
          () => false,
        );
        if (confirmou) return;
      }
    } catch (erro) {
      // Re-render assíncrono do widget pode desanexar o elemento entre localizá-lo e
      // interagir com ele (observado em campo: "Element is not attached to the DOM" em
      // scrollIntoViewIfNeeded) — condição transiente, tentar de novo em vez de propagar.
      if (tentativa === tentativasMax) throw erro;
    }

    if (tentativa === tentativasMax) {
      throw new Error(
        `Zoom no índice ${indiceDoIcone} não abriu/confirmou uma opção após ${tentativasMax} tentativas.`,
      );
    }
  }
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {FormularioSolicitacaoCompraPage} formulario
 * @param {ReturnType<typeof import('../factories/produto-compra.js').criarProdutoCompra>} massa
 */
async function preencherFormularioCompleto(page, formulario, massa) {
  await selecionarNoComboDeBusca(
    page,
    formulario.frame,
    'Nome',
    massa.filialTermoBusca,
    massa.filialOpcaoEsperada,
    formulario.campoCodigoFilial,
  );
  await formulario.campoJustificativa.fill(massa.justificativa);

  await formulario.adicionarProduto();
  await selecionarNoComboDeBusca(
    page,
    formulario.frame,
    'Produto/Serviço',
    massa.produtoTermoBusca,
    massa.produtoOpcaoEsperada,
    formulario.frame.getByRole('textbox', { name: 'Unidade de Medida' }),
  );

  await preencherCampoMascarado(
    formulario.frame.getByRole('textbox', { name: 'Data de Necessidade' }),
    massa.dataNecessidade,
  );
  await preencherCampoMascarado(formulario.frame.getByRole('textbox', { name: 'Quantidade' }), massa.quantidade);
  await preencherCampoMascarado(
    formulario.frame.getByRole('textbox', { name: 'Preço Unitário Estimado' }),
    massa.precoUnitario,
  );
  await formulario.frame.getByRole('textbox', { name: 'Observação' }).fill(massa.observacao);

  await expect(formulario.frame.getByRole('textbox', { name: 'Valor Total Estimado' })).toHaveValue(
    massa.valorTotalEsperado,
  );

  await formulario.adicionarCentroCusto();
  await formulario.preencherRateio(massa.rateioPercentual);
  await selecionarNoZoomDoRateio(page, formulario.frame, 0, /^[A-Z0-9]{2,6}\s*-/);
  await selecionarNoZoomDoRateio(page, formulario.frame, 1, /^\d{3,6}\s*-/);
}

/**
 * Fluxo completo de criação de uma Solicitação de Compras pelo formulário clássico.
 *
 * @param {import('@playwright/test').Page} page
 * @param {ReturnType<typeof import('../factories/produto-compra.js').criarProdutoCompra>} massa
 *   massa já criada pela factory (o teste é quem decide o que valida, então a massa nasce lá)
 * @returns {Promise<string>} número da solicitação criada, lido da tela de confirmação
 */
export async function criarSolicitacaoCompletaEEnviar(page, massa) {
  const formulario = new FormularioSolicitacaoCompraPage(page);

  await formulario.goto();
  await formulario.expectAberto();
  await preencherFormularioCompleto(page, formulario, massa);

  // Anexo + Enviar + confirmação acontecem sob exclusividade: a área de upload do Fluig é um
  // diretório por USUÁRIO no servidor (`/volume/wdk-data/upload/TOTVS-FS/`), disputado por
  // qualquer outro teste que anexe ao mesmo tempo. Ver `anexarEnviarEConfirmar`.
  //
  // O retorno do Enviar é lido pelo Page Object, que distingue os três desfechos possíveis
  // (confirmação, recusa com a mensagem exibida ao usuário, ou silêncio do ambiente).
  return formulario.anexarEnviarEConfirmar(ANEXO_VALIDO, `${massa.justificativa} - anexo`);
}
