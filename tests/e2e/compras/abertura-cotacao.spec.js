// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { FormularioCotacaoPage } from '../../../pages/FormularioCotacaoPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * CT-COT-01-H (parcial — só abertura/render).
 *
 * `wf_cotacao_produtos_servicos`, aberto direto por URL, abre o formulário clássico de
 * Cotação de Produtos e Serviços com os campos de Fornecedor, itens e totais.
 *
 * Escopo deste teste: comprovar que o formulário ABRE completo — um smoke de render, que
 * separa "o formulário monta" de "o formulário envia" para que uma falha de montagem
 * reprove sozinha, em segundos, sem arrastar o ciclo inteiro junto.
 *
 * O ciclo de Cotação (incluindo o que a tela faz ao acionar Enviar) é coberto por
 * `tests/e2e/compras/ciclo-cotacao.spec.js`. Escrever é esperado nesta base de homologação
 * (`docs/politica-de-escrita.md`): o que este arquivo faz é dividir o caso em duas
 * medições, não evitar a escrita.
 *
 * Confirmado em campo — divergência do formulário de Solicitação de Compras: aqui NENHUM
 * campo de Identificação do Solicitante vem pré-preenchido, e os campos de "Informações do
 * Fornecedor" (CNPJ/CPF, Razão Social, endereço, Validade da Cotação) nascem `readonly`,
 * sem nenhum botão de busca de fornecedor nesta tela — ver `pages/FormularioCotacaoPage.js`.
 */
test.describe('Abertura do formulário clássico de Cotação de Produtos e Serviços', () => {
  test('deve abrir completo, com Fornecedor, itens e totais', async ({ page }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formulario = new FormularioCotacaoPage(page);

    await formulario.goto();

    await expect(page).toHaveTitle(/Movimentar Solicitação/);
    await formulario.expectAberto();

    // Bloco "Informações do Fornecedor".
    await expect(formulario.campoCnpjCpf).toBeVisible();
    await expect(formulario.campoRazaoSocial).toBeVisible();
    await expect(formulario.campoNomeFantasia).toBeVisible();

    // Bloco "Identificação do(s) Produto(s)/Serviço(s)" — Nº da Cotação, Validade,
    // lista de itens e totais.
    await expect(formulario.campoNumeroCotacao).toBeVisible();
    await expect(formulario.campoValidadeCotacao).toBeVisible();
    await expect(formulario.headingListaProdutos).toBeVisible();
    await expect(formulario.campoSubTotal).toHaveValue('0,00');
    await expect(formulario.campoValorTotalPedido).toHaveValue('0,00');

    // Delimitação de escopo: este smoke afirma sobre RENDER, então abrir e ler a tela não
    // pode ter disparado nenhuma escrita. O que a tela faz ao Enviar é medido em
    // `ciclo-cotacao.spec.js`.
    expect(guarda.tentativas(), 'abrir e ler o formulário não deveria escrever nada').toBe(0);
  });
});
