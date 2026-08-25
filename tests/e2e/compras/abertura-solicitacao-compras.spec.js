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
 * Escopo deste teste: comprovar que o formulário ABRE completo, com os blocos de
 * Identificação (pré-preenchidos), Entidade/Filial e Produtos/Serviços — e nada mais.
 *
 * É um smoke de render, de propósito: separa "o formulário monta" de "o formulário envia".
 * Quando a montagem quebra, este teste reprova em segundos e aponta a causa sozinho, sem
 * arrastar junto o ciclo inteiro de preenchimento, anexo e movimentação.
 *
 * O ciclo COMPLETO — preencher tudo, anexar e enviar de verdade, criando a Solicitação de
 * Compras na base — é coberto por `tests/e2e/compras/ciclo-solicitacao-compras.spec.js`, no
 * teste `@destrutivo deve criar e enviar a Solicitação de Compras com todos os campos
 * válidos` (CT-CMP-01-H). Escrever é esperado nesta base de homologação
 * (`docs/politica-de-escrita.md`) e os `@destrutivo` rodam na execução padrão — o que este
 * arquivo faz é dividir o caso em duas medições, não evitar a escrita.
 *
 * A guarda de escrita instalada aqui DELIMITA O ESCOPO deste smoke: como ele afirma apenas
 * sobre render, nenhuma requisição de escrita deveria sair da tela — se sair, é sinal de que
 * o teste saiu do que se propõe a medir (seletor errado, clique acidental), e não um perigo
 * a ser evitado no ambiente.
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

    // Delimitação de escopo: este smoke afirma sobre RENDER, então abrir e ler a tela não
    // pode ter disparado nenhuma escrita. O envio de verdade tem teste próprio (CT-CMP-01-H
    // em `ciclo-solicitacao-compras.spec.js`).
    expect(guarda.tentativas(), 'abrir e ler o formulário não deveria escrever nada').toBe(0);
  });
});
