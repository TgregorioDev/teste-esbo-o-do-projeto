// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { FormularioFaturamentoPage } from '../../../pages/FormularioFaturamentoPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * CT-FAT-01-H — Faturamento de Contratos: abertura e render do formulário.
 *
 * Caso PARCIAL por definição: cobre apenas a abertura e a apresentação dos campos de
 * seleção — nunca aciona "Enviar" (isso escreveria uma medição real, sem exclusão
 * disponível no ambiente do cliente — ver docs/mapa-do-ambiente.md > Regra inegociável).
 *
 * `bloquearCriacaoDeSolicitacao` é instalada mesmo sem nenhuma intenção de enviar: é a
 * rede de segurança contra um seletor quebrado clicar onde não devia, e transforma "o
 * sistema não deve criar nada aqui" de presunção em assertion.
 *
 * CT-FAT-02-S1 (quantidade acima do saldo) e CT-FAT-02-S4 (rateio ≠ 100%) NÃO foram
 * implementados — ver relatório da suíte para o motivo técnico exato.
 */
test.describe('Faturamento de Contratos — abertura do formulário', () => {
  test('CT-FAT-01-H: deve abrir com os campos de seleção do Protheus e nunca acionar Enviar', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formulario = new FormularioFaturamentoPage(page);

    await formulario.goto();
    await formulario.expectAberto();

    // Casca do processo: heading "Início", as quatro abas e o botão "Enviar" — confirmado
    // em campo para as rotas de wf_faturamento_contratos, wf_cadastro_fornecedor e
    // wf_delegacaoFiscalContratoServico (ver docs/mapa-do-ambiente.md).
    await expect(formulario.headingInicio).toBeVisible();
    await expect(formulario.abaFormulario).toBeVisible();
    await expect(formulario.abaInformacoes).toBeVisible();
    await expect(formulario.abaHistorico).toBeVisible();
    await expect(formulario.abaAnexos).toBeVisible();
    await expect(formulario.botaoEnviar).toBeVisible();

    // Os cinco campos de seleção (zooms do Protheus) citados no roteiro.
    await expect(formulario.campoFornecedor).toBeVisible();
    await expect(formulario.campoNumContrato).toBeVisible();
    await expect(formulario.campoRevisao).toBeVisible();
    await expect(formulario.campoCompetencia).toBeVisible();
    await expect(formulario.campoFilialMedicao).toBeVisible();

    // Descoberta em campo: a área "Itens da Medição" (que contém a aba "Rateio Contábil")
    // já existe no DOM na abertura, mas fica oculta até a seleção acima ser concluída —
    // não é renderizada visível de cara, ao contrário do que o roteiro original presumia.
    await expect(formulario.painelItensMedicao).toBeAttached();
    await expect(formulario.painelItensMedicao).toBeHidden();

    // Nenhuma ação de escrita foi tentada: o teste só abriu e leu o formulário.
    expect(guarda.tentativas(), `tentativas bloqueadas: ${guarda.urls().join(', ')}`).toBe(0);
  });
});
