// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { FormularioProcessoPage } from '../../../pages/FormularioProcessoPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';
import { envObrigatoria } from '../../../config/ambiente.js';

/**
 * CT-RDF — Recepção de Documentos Fiscais (RDFC): as OUTRAS quatro variantes do processo.
 *
 * O roteiro lista cinco process IDs para o mesmo processo de negócio:
 *   `bpm_recepcao_documentos_fiscais_compras`, `_contratos`, `_comprador_compras`,
 *   `_demandante_compras`, `_fiscais_contratos`.
 *
 * A primeira já está coberta em `tests/e2e/plataforma/inicio-processo-bloqueado.spec.js`
 * (bloqueada) — não duplicada aqui. As outras quatro nunca tinham sido medidas; verificadas
 * uma a uma em campo (25/08/2026, via `pageworkflowview?processID=...`), **todas bloqueiam**
 * para o usuário desta suíte, com o MESMO modal `role=dialog`, heading "Erro" e a mensagem
 * "Usuário <login> não possui permissão para iniciar solicitações do processo <processId>" —
 * o mesmo padrão já confirmado para a primeira variante em `docs/mapa-do-ambiente.md`.
 *
 * Consequência: nenhum dos casos de caminho feliz/negativo do roteiro de RDFC
 * (CT-RDF-01-H — NF condizente; CT-RDF-01-S1 — NF inconsistente; CT-RDF-01-S2 — segregação
 * fiscal/demandante; CT-RDF-01-S3 — NF duplicada) é alcançável por NENHUMA das cinco
 * variantes: nenhum formulário chega a carregar, então não há tela para preencher número,
 * série, chave NFe, forma de pagamento nem para marcar condizência Financeira/Faturamento.
 * Por isso `pages/RdfcPage.js` e `factories/nota-fiscal.js` (previstos no escopo desta
 * suíte) não foram criados — não haveria formulário para eles operarem; ver relatório da
 * rodada de implementação.
 */
test.describe('Início de processo — Recepção de Documentos Fiscais (demais variantes)', () => {
  /** @type {string[]} */
  const processosBloqueados = [
    'bpm_recepcao_documentos_fiscais_contratos',
    'bpm_recepcao_documentos_fiscais_comprador_compras',
    'bpm_recepcao_documentos_fiscais_demandante_compras',
    'bpm_recepcao_documentos_fiscais_fiscais_contratos',
  ];

  for (const processId of processosBloqueados) {
    test(`deve bloquear o início de "${processId}" com a mensagem de permissão`, async ({
      page,
    }) => {
      const guarda = await bloquearCriacaoDeSolicitacao(page);
      const formularioPage = new FormularioProcessoPage(page);
      const usuario = envObrigatoria('QA_USERNAME');

      await formularioPage.goto(processId);
      await formularioPage.expectBloqueado();

      await expect(formularioPage.dialogErro).toBeVisible();
      await expect(formularioPage.headingErro).toBeVisible();
      await expect(formularioPage.dialogErro).toContainText(
        formularioPage.mensagemBloqueio(usuario, processId),
      );
      await expect(formularioPage.botaoOkEntendi).toBeVisible();

      // O ponto do caso: nenhum formulário deve carregar — sem tela de NF, não há CT-RDF-01
      // (H/S1/S2/S3) alcançável por esta variante.
      await expect(formularioPage.headingInicio).toHaveCount(0);
      await expect(formularioPage.botaoEnviar).toHaveCount(0);

      expect(
        guarda.tentativas(),
        `tentativa(s) de escrita bloqueada(s): ${JSON.stringify(guarda.urls())}`,
      ).toBe(0);
    });
  }
});
