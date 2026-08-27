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

/**
 * CT-PLT-09-S1 — fechar a matriz dos bloqueios duros de permissão.
 *
 * São **nove** os processos que recusam o início para o usuário de Compras/Contratos com a
 * mesma mensagem literal do servidor. A suíte cobria dois deles no describe acima
 * (CT-PLT-03-S1) e um terceiro no spec de RH; os **seis** restantes viviam só na skill
 * `cassi-fluig-master` — se a permissão de qualquer um afrouxasse, ninguém veria.
 *
 * Matriz completa, medida em campo em 27/08/2026 (mensagem idêntica nos nove):
 *
 * | processo | onde é coberto |
 * |---|---|
 * | `bpm_recepcao_documentos_fiscais_compras` | CT-PLT-03-S1, neste arquivo |
 * | `wf_solicitacao_ferias` | CT-PLT-03-S1, neste arquivo |
 * | `wf_aprovacao_ocorrencia` | `tests/e2e/rh/bloqueio-processos-rh.spec.js` |
 * | `bpm_recepcao_documentos_fiscais_contratos` | **aqui** |
 * | `bpm_recepcao_documentos_fiscais_demandante_compras` | **aqui** |
 * | `bpm_recepcao_documentos_fiscais_comprador_compras` | **aqui** |
 * | `bpm_recepcao_documentos_fiscais_fiscais_contratos` | **aqui** |
 * | `sumula` | **aqui** |
 * | `sumulas_analise_intervenientes` | **aqui** |
 *
 * Os três já cobertos NÃO são repetidos: duplicar caso só para "fechar a lista" no mesmo
 * arquivo custa carga de página e passa a impressão de cobertura maior do que a real.
 *
 * ⚠️ As duas Súmulas estão publicadas **inativas** (`active: false`, ver
 * `catalogo-invariante.spec.js`) E bloqueadas por permissão. Medido: **a permissão barra
 * primeiro** — a mensagem é a de permissão, não a de processo inativo
 * (`testePRODUTO`, que só está inativo, dá a outra mensagem — ver CT-PLT-08-S1). Se um dia
 * estes processos forem reativados, este teste continua sendo o guarda da permissão.
 */
test.describe('Início de processo — matriz dos bloqueios duros de permissão (CT-PLT-09-S1)', () => {
  /** Os seis bloqueios duros que nenhum outro spec cobre. */
  const bloqueiosNaoCobertos = [
    'bpm_recepcao_documentos_fiscais_contratos',
    'bpm_recepcao_documentos_fiscais_demandante_compras',
    'bpm_recepcao_documentos_fiscais_comprador_compras',
    'bpm_recepcao_documentos_fiscais_fiscais_contratos',
    'sumula',
    'sumulas_analise_intervenientes',
  ];

  for (const processId of bloqueiosNaoCobertos) {
    test(`CT-PLT-09-S1: "${processId}" deve recusar o início com a mensagem de permissão, sem montar formulário`, async ({
      page,
    }) => {
      const guarda = await bloquearCriacaoDeSolicitacao(page);
      const formularioPage = new FormularioProcessoPage(page);
      const usuario = envObrigatoria('QA_USERNAME');

      await formularioPage.goto(processId);
      await formularioPage.expectBloqueado();

      await expect(
        formularioPage.dialogErro,
        `"${processId}" deveria recusar o início para o usuário ${usuario} com o diálogo de erro ` +
          'de permissão — a ausência do diálogo significa que a permissão de início afrouxou',
      ).toBeVisible();
      await expect(formularioPage.headingErro).toBeVisible();
      await expect(
        formularioPage.dialogErro,
        `a recusa de "${processId}" deveria trazer a mensagem literal de permissão; texto ` +
          'diferente indica que o motivo do bloqueio mudou (inatividade, grupo, licença) e ' +
          'precisa ser reavaliado',
      ).toContainText(formularioPage.mensagemBloqueio(usuario, processId));
      await expect(formularioPage.botaoOkEntendi).toBeVisible();

      // O ponto do caso: bloqueio de verdade não monta formulário nenhum.
      await expect(
        formularioPage.headingInicio,
        `"${processId}" montou o formulário de início apesar do bloqueio de permissão`,
      ).toHaveCount(0);
      await expect(formularioPage.botaoEnviar).toHaveCount(0);

      expect(
        guarda.tentativas(),
        `tentativa(s) de escrita bloqueada(s): ${JSON.stringify(guarda.urls())}`,
      ).toBe(0);
    });
  }
});
