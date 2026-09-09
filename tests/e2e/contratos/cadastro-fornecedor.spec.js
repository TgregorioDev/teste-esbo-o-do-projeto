// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { FormularioCadastroFornecedorPage } from '../../../pages/FormularioCadastroFornecedorPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * CT-FOR-01-H — Cadastro de Fornecedor: abertura e render do formulário.
 *
 * Caso PARCIAL por definição: cobre apenas a abertura e a apresentação dos campos —
 * nunca aciona "Enviar" (isso criaria um fornecedor real no Protheus, sem exclusão
 * disponível no ambiente do cliente — ver docs/mapa-do-ambiente.md > Regra inegociável).
 *
 * `bloquearCriacaoDeSolicitacao` é instalada mesmo sem nenhuma intenção de enviar: é a
 * rede de segurança contra um seletor quebrado clicar onde não devia, e transforma "o
 * sistema não deve criar nada aqui" de presunção em assertion.
 */
test.describe('Cadastro de Fornecedor — abertura do formulário', () => {
  test('CT-FOR-01-H: deve abrir e espelhar os campos de documento, razão social, endereço e contato', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formulario = new FormularioCadastroFornecedorPage(page);

    await formulario.goto();
    await formulario.expectAberto();

    // Casca do processo: heading "Início", as quatro abas e o botão "Enviar" — confirmado
    // em campo (ver docs/mapa-do-ambiente.md).
    await expect(formulario.headingInicio).toBeVisible();
    await expect(formulario.abaFormulario).toBeVisible();
    await expect(formulario.abaInformacoes).toBeVisible();
    await expect(formulario.abaHistorico).toBeVisible();
    await expect(formulario.abaAnexos).toBeVisible();
    await expect(formulario.botaoEnviar).toBeVisible();

    // Documento e identificação do fornecedor.
    await expect(formulario.campoDocumento).toBeVisible();
    await expect(formulario.campoRazaoSocial).toBeVisible();
    await expect(formulario.campoNomeFantasia).toBeVisible();

    // Endereço.
    await expect(formulario.campoLogradouro).toBeVisible();
    await expect(formulario.campoBairro).toBeVisible();
    await expect(formulario.campoEstado).toBeVisible();
    await expect(formulario.campoMunicipio).toBeVisible();
    await expect(formulario.campoCep).toBeVisible();

    // Contato.
    await expect(formulario.campoTelefone).toBeVisible();
    await expect(formulario.campoCelular).toBeVisible();
    await expect(formulario.campoEmail).toBeVisible();

    // Nenhuma ação de escrita foi tentada: o teste só abriu e leu o formulário.
    expect(guarda.tentativas(), `tentativas bloqueadas: ${guarda.urls().join(', ')}`).toBe(0);
  });

  /**
   * FSWTBC-2752 — telefone digitado sem máscara é aceito e preservado.
   *
   * O chamado: cadastros chegavam ao Fluig com o telefone cru e o processamento quebrava
   * (solicitação 53644). O cliente ofereceu duas saídas — validar a máscara antes do envio ou
   * normalizar no processamento — e a correção seguiu a segunda. Mesma família do FSWTBC-2772
   * (`30.500,00` × `30500.00`): dado que chega numa forma que o consumidor não espera.
   *
   * O que é verificável sem submeter: que a tela **aceita** os dígitos crus e não os perde nem
   * os deforma. Provar o processamento exigiria enviar o cadastro, e registro criado no
   * Fluig/Protheus não tem exclusão disponível — por isso o envio fica fora, e a guarda prova
   * que nada saiu.
   *
   * O oráculo são os DÍGITOS, não o texto exibido: se o campo aplicar máscara na saída
   * ("(11) 3333-4444"), isso é aceitação também — o que não pode é o número voltar truncado,
   * vazio ou alterado.
   */
  test('FSWTBC-2752 — Telefone e Celular aceitam dígitos sem máscara sem perder o número', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const cadastro = new FormularioCadastroFornecedorPage(page);

    await cadastro.goto();
    await cadastro.expectAberto();

    const TELEFONE = '1133334444';
    const CELULAR = '11988887777';

    await cadastro.campoTelefone.fill(TELEFONE);
    await cadastro.campoCelular.fill(CELULAR);
    // Blur explícito: a normalização do chamado, se existir na tela, acontece ao sair do campo.
    await cadastro.campoEmail.click();

    const telefoneNaTela = await cadastro.campoTelefone.inputValue();
    const celularNaTela = await cadastro.campoCelular.inputValue();
    const digitos = (/** @type {string} */ v) => v.replace(/\D/g, '');

    test.info().annotations.push({
      type: 'telefone-sem-mascara',
      description: `Telefone digitado ${TELEFONE} → exibido "${telefoneNaTela}" · Celular ${CELULAR} → "${celularNaTela}"`,
    });

    expect(
      digitos(telefoneNaTela),
      'o campo Telefone perdeu ou alterou os dígitos informados sem máscara — é a forma de ' +
        'entrada que quebrava o processamento no FSWTBC-2752',
    ).toBe(TELEFONE);
    expect(
      digitos(celularNaTela),
      'o campo Celular perdeu ou alterou os dígitos informados sem máscara',
    ).toBe(CELULAR);

    expect(guarda.tentativas(), 'o cadastro não deve ser submetido — apenas preenchido').toBe(0);
  });
});
