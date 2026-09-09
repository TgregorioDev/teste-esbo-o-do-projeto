// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';
import { generateCnpj } from '../../../factories/pessoa.js';

/**
 * FSWTBC-5257 — o campo CNPJ do cadastro público de fornecedor.
 *
 * O chamado está **ABERTO** (SDCASSI-563, severidade Alta, prazo de 04/09 vencido, sem
 * responsável): o Portal do Fornecedor não aceita CNPJ no formato **alfanumérico** que a Receita
 * passou a emitir — 12 posições alfanuméricas + 2 DVs numéricos — enquanto o Protheus já aceita.
 * Fornecedor com CNPJ novo fica impedido de se cadastrar e de participar de cotações.
 *
 * ## O que foi medido em 09/09/2026, e é pior que o relatado
 *
 * Com a máscara do campo já aplicada, `#txt_cnpj` **não recebe valor nenhum**: digitando pelo
 * teclado, com o foco confirmado no próprio campo, o `value` resultante é o texto literal do
 * molde — `AA.AAA.AAA/AAAA-00` — para toda entrada testada: `1`, `12`, `123`, `A`, `12A`,
 * `12345678000195` (numérico) e `12ABC34501DE35` (alfanumérico). Nenhuma crítica é exibida, e o
 * resultado se repetiu em três execuções seguidas.
 *
 * Ou seja: não é só o CNPJ alfanumérico que é recusado — com a máscara ativa **nenhum** CNPJ
 * entra, e por consequência nenhum fornecedor se cadastra por esta página. O placeholder já traz
 * o molde alfanumérico (`AA.AAA.AAA/AAAA-00`), o que sugere que a máscara foi trocada para o
 * formato novo e passou a tratar `A` como caractere literal em vez de marcador.
 *
 * O contraste que fecha o diagnóstico: **sem** a máscara aplicada (janela em que o script ainda
 * não rodou), o mesmo campo preserva tudo que recebe, alfanumérico incluído. O problema está na
 * máscara, não na página nem no campo.
 *
 * ## O que este teste afirma, e o que não
 *
 * Afirma o mínimo indiscutível: o campo tem de **guardar o que foi digitado**. Não exercita
 * validação de dígito verificador — o valor nunca chega lá — nem envia o cadastro: registro
 * criado no Fluig/Protheus não tem exclusão disponível, e a guarda prova que nada saiu.
 *
 * `@bug`: escrito contra o comportamento esperado, reprova hoje. Fica verde sozinho quando a
 * máscara for corrigida.
 *
 * ## Particularidades da tela
 *
 * - O bloco de Pessoa Jurídica só aparece depois de marcar o rádio `#j`.
 * - Marcar o rádio dispara um diálogo com a lista de documentos obrigatórios, que **intercepta
 *   os cliques seguintes** — precisa ser dispensado antes de tocar em qualquer campo.
 */

/** Rota pública do cadastro de fornecedores. */
const ROTA = '/portal/p/1/cadastro_fornecedor';

/**
 * CNPJ alfanumérico usado como entrada. O valor é o do próprio roteiro do caso; os dígitos
 * verificadores NÃO são exercitados aqui — o campo não chega a validá-los, porque não guarda
 * o que recebe.
 */
const CNPJ_ALFANUMERICO = '12ABC34501DE35';

test.describe('Cadastro público de fornecedor — campo CNPJ', () => {
  test('@bug FSWTBC-5257 — o campo CNPJ deve guardar o que foi digitado, numérico ou alfanumérico', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const cnpjNumerico = generateCnpj();

    await page.goto(ROTA, { waitUntil: 'domcontentloaded' });

    // O aviso de documentos obrigatórios cobre a tela e INTERCEPTA os cliques seguintes. Ele
    // aparece na carga e de novo ao marcar Pessoa Jurídica — dispensar uma vez só deixa o
    // segundo bloqueando o campo, e o sintoma é um timeout que parece "elemento não existe".
    const aviso = page.locator('.swal2-popup');
    /** Dispensa o aviso se ele estiver na tela. Espera opcional: ausência é resultado válido. */
    const dispensarAviso = async () => {
      const apareceu = await aviso
        .waitFor({ state: 'visible', timeout: 10_000 })
        .then(() => true)
        .catch(() => false);
      if (!apareceu) return;
      await page.locator('.swal2-confirm').click();
      await aviso.waitFor({ state: 'hidden' });
    };

    await dispensarAviso();

    const pessoaJuridica = page.locator('#j');
    await pessoaJuridica.waitFor({ state: 'visible' });
    await pessoaJuridica.check();

    await dispensarAviso();

    const campoCnpj = page.locator('#txt_cnpj');
    await expect(campoCnpj).toBeVisible();
    await expect(campoCnpj, 'o campo deveria começar vazio').toHaveValue('');

    // Esperar a MÁSCARA estar ligada ao campo antes de digitar. Sem isto o teste é flaky por
    // construção, e não por acidente: medido em duas execuções seguidas, com a máscara ainda não
    // aplicada o campo é um input comum e **preserva** tudo que recebe (inclusive o CNPJ
    // alfanumérico); com ela aplicada, devolve o texto literal do próprio molde. O mesmo teste
    // reprovava por dois motivos opostos conforme a corrida.
    //
    // O sinal é interno (a `data('rawMaskFn')` que o jQuery Mask grava no elemento) e isso é
    // acoplamento a implementação — aceito aqui porque o componente sob teste É a máscara: o
    // que se espera é ela estar inicializada, não um efeito dela, que é justamente o que o
    // teste vai medir depois.
    await page.waitForFunction(
      () => {
        const jq = /** @type {any} */ (window).jQuery;
        return Boolean(jq && jq('#txt_cnpj').data('rawMaskFn'));
      },
      null,
      { timeout: 30_000 },
    );

    /** Digita pelo teclado (não `fill`) porque é a máscara sob teste que precisa reagir. */
    const digitar = async (/** @type {string} */ texto) => {
      await campoCnpj.fill('');
      await campoCnpj.click();
      await page.keyboard.type(texto, { delay: 60 });
      return campoCnpj.inputValue();
    };

    const comNumerico = await digitar(cnpjNumerico);
    const comAlfanumerico = await digitar(CNPJ_ALFANUMERICO);

    // CONTROLE, na mesma página e com a mesma digitação: o CEP tem máscara e a aplica sobre o
    // que recebe. Sem isto, o vermelho abaixo seria ambíguo — poderia ser o teclado do teste não
    // chegando ao formulário em vez de o campo estar quebrado.
    //
    // Vem DEPOIS das medições do CNPJ de propósito: preencher o CEP dispara a consulta de
    // endereço, e o diálogo de erro dela passa a interceptar os cliques no campo de CNPJ.
    const campoCep = page.locator('#txt_cep');
    await campoCep.click();
    await page.keyboard.type('23456780', { delay: 60 });
    const comCep = await campoCep.inputValue();

    const soDigitos = (/** @type {string} */ v) => v.replace(/\D/g, '');
    const soAlfanumerico = (/** @type {string} */ v) => v.replace(/[^0-9A-Za-z]/g, '').toUpperCase();

    test.info().annotations.push({
      type: 'cnpj-cadastro-publico',
      description:
        `numérico ${cnpjNumerico} → "${comNumerico}" · ` +
        `alfanumérico ${CNPJ_ALFANUMERICO} → "${comAlfanumerico}" · ` +
        `controle CEP → "${comCep}"`,
    });

    expect(
      comCep,
      'nem o campo de CEP recebeu o que foi digitado — antes de acusar o campo de CNPJ, é a ' +
        'própria digitação deste teste que precisa ser revista',
    ).toBe('23456-780');

    expect(
      soDigitos(comNumerico),
      'o campo CNPJ não guardou nem um CNPJ numérico — sem isso nenhum fornecedor se cadastra ' +
        'por esta página, alfanumérico ou não',
    ).toBe(cnpjNumerico);

    expect(
      soAlfanumerico(comAlfanumerico),
      'o campo CNPJ não preservou as letras do formato alfanumérico da Receita — é o defeito do ' +
        'FSWTBC-5257, que impede o fornecedor com CNPJ novo de se cadastrar e de participar de ' +
        'cotações, enquanto o Protheus já aceita esse formato',
    ).toBe(CNPJ_ALFANUMERICO);

    expect(guarda.tentativas(), 'o cadastro não deve ser enviado — apenas preenchido').toBe(0);
  });
});
