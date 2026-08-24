// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import {
  FormularioSolicitacaoCompraPage,
  TITULO_MOVIMENTAR_SOLICITACAO,
} from '../../../pages/FormularioSolicitacaoCompraPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * CT-CMP-01-H (parcial — só abertura/render).
 *
 * O formulário clássico de Solicitação de Compras (`wf_solicitacao_compras`) é um ponto de
 * entrada DIFERENTE do modal do Portal de Acompanhamento de Contratos: nasce em branco e é
 * preenchido à mão, sem contrato de origem.
 *
 * Escopo deste teste: comprovar que o formulário abre completo com os blocos de
 * Identificação (pré-preenchidos), Entidade/Filial e Produtos/Serviços — e nada mais.
 *
 * ⚠️ Este teste NUNCA aciona Enviar: preencher campo é leitura, enviar é escrita, e o
 * envio é destrutivo neste ambiente (solicitação criada não tem exclusão disponível). A
 * guarda de escrita é instalada mesmo assim, como rede de segurança contra qualquer clique
 * acidental em Enviar por um seletor errado.
 */
test.describe('Abertura do formulário clássico de Solicitação de Compras', () => {
  test('deve abrir completo, com Identificação pré-preenchida, Entidade/Filial e Produtos/Serviços', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formulario = new FormularioSolicitacaoCompraPage(page);

    await formulario.goto();

    await expect(page).toHaveTitle(TITULO_MOVIMENTAR_SOLICITACAO);
    await formulario.expectAberto();

    // Bloco "Identificação do Processo / Solicitante" — pré-preenchido pelo Fluig.
    // O Nº do Processo é a exceção: só é atribuído ao mover o processo (placeholder
    // "Gerado ao Movimentar"), por isso nasce vazio mesmo num formulário "completo".
    await expect(formulario.campoNumeroProcesso).toHaveAttribute('placeholder', 'Gerado ao Movimentar');
    await expect(formulario.campoSolicitante).not.toHaveValue('');
    await expect(formulario.campoEmailSolicitante).toHaveValue(/.+@.+/);
    await expect(formulario.campoDataSolicitacao).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
    await expect(formulario.campoHoraSolicitacao).toHaveValue(/^\d{2}:\d{2}:\d{2}$/);

    // Bloco "Identificação da Entidade / Solicitação" — nasce vazio, mas presente.
    await expect(formulario.headingEntidade).toBeVisible();
    await expect(formulario.campoNumeroSolicitacaoErp).toBeVisible();
    await expect(formulario.campoNumeroCotacaoErp).toBeVisible();
    await expect(formulario.campoCodigoFilial).toBeVisible();
    await expect(formulario.campoDataEmissao).toBeVisible();
    await expect(formulario.campoJustificativa).toBeVisible();

    // Bloco "Identificação do(s) Produto(s)/Serviço(s)".
    await expect(formulario.headingProdutos).toBeVisible();
    await expect(formulario.botaoAdicionarProduto).toBeVisible();
    await expect(formulario.botaoDownloadPlanilhaRateio).toBeVisible();
    await expect(formulario.botaoUploadPlanilhaRateio).toBeVisible();

    // Rede de segurança: nada foi escrito só de abrir e ler o formulário.
    expect(guarda.tentativas(), 'abrir e ler o formulário não deveria escrever nada').toBe(0);
  });
});
