// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { FormularioProcessoPage } from '../../../pages/FormularioProcessoPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/** Início de processo por URL — usuário COM permissão — caso CT-PLT-03-H. */
test.describe('Início de processo — usuário com permissão', () => {
  test('deve abrir o formulário de "Solicitação de Compras" sem bloqueio', async ({ page }) => {
    // A tela expõe um botão Enviar de verdade: a trava garante que nenhuma interação
    // acidental submeta no ambiente real, e vira a assertion de "nada foi escrito".
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formularioPage = new FormularioProcessoPage(page);

    await formularioPage.goto('wf_solicitacao_compras');
    await formularioPage.expectFormularioAberto();

    await expect(page).toHaveTitle('Cassi - Fluig Plataforma - Movimentar Solicitação');
    await expect(formularioPage.headingInicio).toBeVisible();
    await expect(formularioPage.abaFormulario).toBeVisible();
    await expect(formularioPage.abaInformacoes).toBeVisible();
    await expect(formularioPage.abaHistorico).toBeVisible();
    await expect(formularioPage.abaAnexos).toBeVisible();
    await expect(formularioPage.botaoEnviar).toBeVisible();

    // Nenhum modal de bloqueio de permissão deve aparecer para um processo permitido
    await expect(formularioPage.dialogErro).toHaveCount(0);

    // ⚠️ Abrir o formulário é leitura; NUNCA clicar em Enviar neste teste — enviar é
    // escrita real no ambiente do cliente, integrado ao Protheus.
    expect(
      guarda.tentativas(),
      `tentativa(s) de escrita bloqueada(s): ${JSON.stringify(guarda.urls())}`,
    ).toBe(0);
  });
});
