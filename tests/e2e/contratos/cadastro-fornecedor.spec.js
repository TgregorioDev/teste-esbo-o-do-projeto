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
});
