// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { SigajuriPage } from '../../../pages/SigajuriPage.js';
import { bloquearEscritaNoAmbiente } from '../../../utils/guarda-criacao.js';

const PROCESS_ID = 'SIGAJURI_Contrato';

/**
 * CT-JUR-03-H / CT-JUR-03-S1 — Contrato (`SIGAJURI_Contrato`, breadcrumb "Solicitação de
 * Contratos").
 *
 * Confirmado em campo: o formulário abre completo (mesmo padrão dos demais SIGAJURI — não é
 * bloqueado por permissão). O MESMO defeito do Consultivo (D-JUR-01) se repete aqui: `Filial`,
 * `Área Solicitante` e `Tipo Contrato` — os três alimentados pelo serviço "SIGAJURI" — nascem
 * com uma única opção, o texto de
 * `ServiceNotFoundException: Não foi possível encontrar o serviço ' SIGAJURI '`.
 *
 * Diferente do Consultivo, aqui o botão **Enviar nasce `disabled`** — o formulário tem uma
 * segunda camada de validação client-side (bloco "Envolvidos", com radio Cliente/Unidade /
 * Fornecedor / Outros e um campo de busca por zoom para Contratante/Contratado) que mantém o
 * botão desabilitado até que dados mínimos sejam informados. Como consequência prática, os
 * dois defeitos (SIGAJURI indisponível + Envolvidos vazio) se sobrepõem: não dá pra saber, só
 * por esta tela, se preencher Envolvidos sozinho já habilitaria o Enviar, porque não há como
 * escolher um `Tipo Contrato` válido para chegar lá.
 *
 * CT-JUR-03-S1 (bloqueio quando faltam dados obrigatórios) é o único dos dois casos que o
 * ambiente permite comprovar sem tocar o SIGAJURI: o Enviar nasce desabilitado, e a suíte
 * DEVE tratar isso como caminho negativo válido — provando que a trava funciona é exatamente
 * o objetivo do caso, não um efeito colateral do outro defeito.
 */
test.describe('SIGAJURI_Contrato — geração de minuta, D-JUR-01', () => {
  test('CT-JUR-03-H deveria permitir montar uma minuta preenchendo Filial e Tipo Contrato', async ({
    page,
  }) => {
    const guarda = await bloquearEscritaNoAmbiente(page);
    const sigajuri = new SigajuriPage(page);

    await sigajuri.goto(PROCESS_ID);
    await sigajuri.expectFormularioAberto();

    // Prova de campo: os três combos alimentados pelo serviço SIGAJURI deveriam oferecer
    // opções reais de Filial/Área/Tipo de Contrato — hoje só a mensagem de erro. `count()`
    // não espera o iframe carregar, por isso a visibilidade é confirmada primeiro.
    await expect(sigajuri.comboFilialContrato).toBeVisible();
    expect(
      await sigajuri.comboFilialContrato.locator('option').count(),
      'Filial deveria oferecer mais de uma opção (filiais reais)',
    ).toBeGreaterThan(1);
    await expect(sigajuri.comboTipoContrato).toBeVisible();
    expect(
      await sigajuri.comboTipoContrato.locator('option').count(),
      'Tipo Contrato deveria oferecer mais de uma opção (tipos reais de contrato)',
    ).toBeGreaterThan(1);

    // Consequência direta: sem Filial/Tipo Contrato selecionáveis, o formulário nunca sai do
    // estado inválido — Enviar deveria eventualmente habilitar depois de preenchido, mas fica
    // preso em `disabled` desde a abertura.
    await expect(
      sigajuri.botaoEnviar,
      'o botão Enviar deveria habilitar quando os dados obrigatórios estivessem preenchidos ' +
        '— aqui fica sempre desabilitado porque Filial/Tipo Contrato nunca chegam a carregar ' +
        'um valor (D-JUR-01, ServiceNotFoundException no serviço SIGAJURI)',
    ).toBeEnabled();

    // Nada foi escrito — a trava confirma que esta investigação ficou só na leitura.
    expect(guarda.tentativas(), `tentativa(s) de escrita bloqueada(s): ${JSON.stringify(guarda.urls())}`).toBe(0);
  });

  test('CT-JUR-03-S1 Enviar nasce desabilitado quando faltam dados obrigatórios', async ({ page }) => {
    const guarda = await bloquearEscritaNoAmbiente(page);
    const sigajuri = new SigajuriPage(page);

    await sigajuri.goto(PROCESS_ID);
    await sigajuri.expectFormularioAberto();

    // Caminho negativo real e verificado: nenhum campo obrigatório foi preenchido, e o botão
    // que dispararia a escrita (`workflowView/send`) permanece bloqueado.
    await expect(sigajuri.botaoEnviar).toBeDisabled();

    expect(guarda.tentativas(), `tentativa(s) de escrita bloqueada(s): ${JSON.stringify(guarda.urls())}`).toBe(0);
  });
});
