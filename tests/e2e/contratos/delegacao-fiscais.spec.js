// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { FormularioDelegacaoFiscaisPage } from '../../../pages/FormularioDelegacaoFiscaisPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * CT-DEL-01-H — Delegação de Fiscais de Contrato/Serviço: abertura e render do formulário.
 *
 * O roteiro original marcava esta rota como "ainda não verificada, pode estar bloqueada
 * por permissão". Verificado em campo: para o usuário desta automação, a rota NÃO está
 * bloqueada — abre normalmente com a mesma casca dos demais processos. Por isso este
 * continua sendo um caso de ABERTURA, e não um caso de autorização (heading "Erro").
 *
 * Segunda descoberta em campo: o roteiro esperava "contrato, fiscal substituto e período"
 * como campos oferecidos ao solicitante. O formulário real, iniciado sem um processo de
 * origem, mostra a seção "Identificação do Contrato/Serviço" em branco e somente leitura
 * (não há zoom para escolher um contrato), um único campo "Fiscal" também somente leitura
 * (não é um seletor de fiscal substituto) e nenhum campo de período — os únicos campos de
 * data são carimbos de resposta de aprovação de etapas posteriores do fluxo. Este teste
 * valida o que a tela realmente oferece, não a expectativa original — ver relatório da
 * suíte para o registro completo.
 *
 * Caso PARCIAL por definição: cobre apenas a abertura e a apresentação dos campos — nunca
 * aciona "Enviar" (ver docs/mapa-do-ambiente.md > Regra inegociável).
 */
test.describe('Delegação de Fiscais de Contrato/Serviço — abertura do formulário', () => {
  test('CT-DEL-01-H: deve abrir sem bloqueio de permissão e apresentar a identificação do contrato/serviço e do fiscal', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formulario = new FormularioDelegacaoFiscaisPage(page);

    await formulario.goto();
    await formulario.expectAberto();

    // Casca do processo: heading "Início" (não "Erro"), as quatro abas e o botão "Enviar"
    // — comprova que a rota está liberada para este usuário.
    await expect(formulario.headingInicio).toBeVisible();
    await expect(formulario.abaFormulario).toBeVisible();
    await expect(formulario.abaInformacoes).toBeVisible();
    await expect(formulario.abaHistorico).toBeVisible();
    await expect(formulario.abaAnexos).toBeVisible();
    await expect(formulario.botaoEnviar).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Erro' })).toHaveCount(0);

    // Identificação do Contrato/Serviço — presente, ainda que somente leitura nesta etapa.
    await expect(formulario.campoFilialContrato).toBeVisible();
    await expect(formulario.campoNumeroContrato).toBeVisible();
    await expect(formulario.campoNumeroPlanilha).toBeVisible();
    await expect(formulario.campoFilialMedicao).toBeVisible();
    await expect(formulario.campoObjetoContrato).toBeVisible();

    // Identificação do Fiscal — presente, ainda que somente leitura nesta etapa.
    await expect(formulario.campoFiscal).toBeVisible();

    // Nenhuma ação de escrita foi tentada: o teste só abriu e leu o formulário.
    expect(guarda.tentativas(), `tentativas bloqueadas: ${guarda.urls().join(', ')}`).toBe(0);
  });
});
