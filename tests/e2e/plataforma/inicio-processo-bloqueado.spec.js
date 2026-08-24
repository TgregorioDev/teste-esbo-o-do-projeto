// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { FormularioProcessoPage } from '../../../pages/FormularioProcessoPage.js';
import { CatalogoProcessosPage } from '../../../pages/CatalogoProcessosPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';
import { envObrigatoria } from '../../../config/ambiente.js';

/**
 * Início de processo por URL — usuário SEM permissão — caso CT-PLT-03-S1.
 *
 * Teste NEGATIVO: sucesso é o bloqueio. Os dois processos abaixo foram confirmados em
 * campo como bloqueados para o usuário da automação (docs/mapa-do-ambiente.md).
 */
test.describe('Início de processo — usuário sem permissão', () => {
  /** @type {string[]} */
  const processosBloqueados = ['bpm_recepcao_documentos_fiscais_compras', 'wf_solicitacao_ferias'];

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

      // O ponto do caso: nenhum formulário deve carregar
      await expect(formularioPage.headingInicio).toHaveCount(0);
      await expect(formularioPage.botaoEnviar).toHaveCount(0);

      expect(
        guarda.tentativas(),
        `tentativa(s) de escrita bloqueada(s): ${JSON.stringify(guarda.urls())}`,
      ).toBe(0);
    });
  }

  test('Caminho A — processo bloqueado não aparece no catálogo (filtrado por permissão)', async ({
    page,
  }) => {
    const catalogoPage = new CatalogoProcessosPage(page);
    await catalogoPage.goto();
    await catalogoPage.expectCarregada();

    await catalogoPage.buscarProcesso('RDFC');
    await expect(catalogoPage.headingNenhumProcessoEncontrado).toBeVisible();
    await expect(catalogoPage.linkDoProcesso('Recepção de Documentos Fiscais')).toHaveCount(0);

    await catalogoPage.campoBusca.fill('Recepção de Documentos Fiscais');
    await expect(catalogoPage.headingNenhumProcessoEncontrado).toBeVisible();
    await expect(catalogoPage.linkDoProcesso('Recepção de Documentos Fiscais')).toHaveCount(0);
  });
});
