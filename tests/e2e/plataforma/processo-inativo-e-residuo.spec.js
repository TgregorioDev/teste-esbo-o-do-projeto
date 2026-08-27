// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { FormularioProcessoPage } from '../../../pages/FormularioProcessoPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * CT-PLT-08-S1 — processo inativo e resíduo de desenvolvimento visível ao usuário comum.
 *
 * Dois processos da categoria **ADMIN/ADMIN** convivem no ambiente publicado, e nenhum tinha
 * teste. É a camada de baixo do mesmo assunto de `catalogo-invariante.spec.js` (CT-PLT-10-H):
 * lá se guarda o inventário; aqui se guarda o que o usuário comum consegue fazer com ele.
 *
 * | processo | estado | o que acontece ao abrir (medido em 27/08/2026) |
 * |---|---|---|
 * | `testePRODUTO` | `active: false` | modal *Erro — "Este processo não está mais ativo!"*, nenhum formulário |
 * | `teste` | `active: true`, **no catálogo `onlyCanStart`** | abre o formulário completo — e o formulário é o da **Solicitação de Compras** |
 *
 * O segundo é o achado: um processo chamado `teste`, de categoria ADMIN, é oferecido na tela
 * "Iniciar Solicitações" de um usuário de Compras e serve o template da Solicitação de
 * Compras, com as seções de Validação do Gestor, Validação Orçamentária, Validação do
 * Comprador e Aprovação de Alçada (estas últimas presentes no DOM e ocultas até a etapa
 * correspondente, como no processo real). Um usuário comum tem, portanto, um segundo caminho —
 * sem governança — para o que parece uma requisição de compra real.
 */

test.describe('Plataforma — processo inativo e resíduo de desenvolvimento (CT-PLT-08-S1)', () => {
  test('CT-PLT-08-S1: `testePRODUTO` está inativo e deve recusar o início com a mensagem de processo inativo', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formularioPage = new FormularioProcessoPage(page);

    await formularioPage.goto('testePRODUTO');
    await formularioPage.expectBloqueado();

    await expect(formularioPage.dialogErro).toBeVisible();
    await expect(formularioPage.headingErro).toBeVisible();

    // Mensagem LITERAL do servidor — e diferente da de permissão (CT-PLT-09-S1). A distinção
    // importa: "inativo" e "sem permissão" são recusas por motivos opostos, e trocar uma pela
    // outra esconderia um processo despublicado atrás de um problema de acesso.
    await expect(
      formularioPage.dialogErro,
      '`testePRODUTO` está publicado com `active: false` e deveria recusar o início dizendo que ' +
        'o processo não está mais ativo. Mensagem diferente significa que o motivo da recusa ' +
        'mudou — ou que o processo foi reativado, o que é mudança de catálogo (ver CT-PLT-10-H)',
    ).toContainText('Este processo não está mais ativo!');
    await expect(formularioPage.botaoOkEntendi).toBeVisible();

    await expect(
      formularioPage.headingInicio,
      '`testePRODUTO` montou formulário de início apesar de estar inativo',
    ).toHaveCount(0);
    await expect(formularioPage.botaoEnviar).toHaveCount(0);

    expect(
      guarda.tentativas(),
      `tentativa(s) de escrita bloqueada(s): ${JSON.stringify(guarda.urls())}`,
    ).toBe(0);
  });

  test('CT-PLT-08-S1: o processo `teste` (categoria ADMIN) não deveria constar do catálogo de início de um usuário de Compras', async ({
    page,
  }) => {
    // VERMELHO INTENCIONAL — achado de governança de publicação, não de execução.
    //
    // `teste` é resíduo de desenvolvimento: nome genérico, categoria ADMIN, nunca iniciado por
    // ninguém ("Último iniciado: Nunca"). Ainda assim está publicado ATIVO e aparece na lista
    // `onlyCanStart=true`, que é exatamente o que a tela "Iniciar Solicitações" oferece ao
    // usuário. O esperado é que um processo administrativo de teste não seja oferecido a um
    // perfil de Compras — despublicá-lo, inativá-lo ou restringir a permissão de início.
    //
    // Não ajuste esta assertion para acomodar a presença dele: quando o resíduo for removido,
    // o teste fica verde sozinho.
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

    const catalogo = await page.evaluate(async () => {
      const resposta = await fetch(
        '/ecm/api/rest/ecm/process-category/processes?processOrder=alphabetical&processLabel=&onlyCanStart=true',
        {
          credentials: 'include',
          headers: { Referer: `${location.origin}/portal/p/1/home`, Accept: 'application/json' },
        },
      );
      const texto = await resposta.text();
      /** @type {any} */
      let corpo = null;
      try {
        corpo = JSON.parse(texto);
      } catch {
        corpo = null;
      }
      return { status: resposta.status, corpo, texto: corpo ? '' : texto.slice(0, 300) };
    });

    expect(
      catalogo.status,
      `PRÉ-CONDIÇÃO AUSENTE (ambiente): o catálogo de início respondeu ${catalogo.status}: ` +
        `${catalogo.texto}. Sem a lista não há como afirmar o que é oferecido ao usuário.`,
    ).toBe(200);

    /** @type {Array<{ processId: string, categoria: string }>} */
    const oferecidos = [];
    for (const categoria of catalogo.corpo?.content ?? []) {
      for (const definicao of categoria.processDefinitions ?? []) {
        oferecidos.push({ processId: definicao.processId, categoria: categoria.path ?? '' });
      }
    }

    expect(
      oferecidos.map((p) => p.processId),
      'o processo `teste` (categoria ADMIN, resíduo de desenvolvimento, nunca iniciado) continua ' +
        'sendo oferecido na tela "Iniciar Solicitações" de um usuário de Compras. É falta de ' +
        'governança de publicação: um processo de teste administrativo não deveria ser iniciável ' +
        `por perfil de negócio. Catálogo lido: ${JSON.stringify(oferecidos)}`,
    ).not.toContain('teste');
  });

  test('CT-PLT-08-S1 (ACHADO): abrir o processo `teste` serve o formulário da Solicitação de Compras a um usuário comum', async ({
    page,
  }, testInfo) => {
    // Este teste afirma sobre o comportamento REAL medido, não sobre o esperado — mesmo padrão
    // dos ACHADOS de `tests/e2e/rh/bloqueio-processos-rh.spec.js`. Ele existe para que o
    // achado não dependa de alguém lembrar: fica VERDE enquanto o resíduo servir o template
    // da SC, e vermelho no dia em que isso mudar — que é quando o assunto precisa ser reaberto.
    testInfo.annotations.push({
      type: 'achado-governanca-de-publicacao',
      description:
        'o processo `teste` (categoria ADMIN) é iniciável por um usuário de Compras e monta o ' +
        'formulário completo da Solicitação de Compras — as seções de identificação, produtos e ' +
        'rateio visíveis, e as de Validação Orçamentária/Comprador e Aprovação de Alçada no DOM, ' +
        'ocultas até a etapa correspondente. ' +
        'Existe, portanto, um segundo caminho sem governança para o que parece uma requisição ' +
        'de compra real.',
    });

    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formularioPage = new FormularioProcessoPage(page);

    await formularioPage.goto('teste');
    await formularioPage.expectFormularioAberto();

    await expect(formularioPage.dialogErro).toHaveCount(0);
    await expect(formularioPage.botaoEnviar).toBeVisible();

    // O formulário de negócio vive no iframe `#workflowView-cardViewer` (mesma casca de todos
    // os processos — ver `pages/FormularioCadastroFornecedorPage.js`).
    const formulario = page.frameLocator('#workflowView-cardViewer');
    await expect(
      formulario.getByRole('heading', { name: 'Solicitação de Compras', exact: true }),
      'o resíduo `teste` deixou de servir o template da Solicitação de Compras — o achado de ' +
        'governança mudou de forma e precisa ser remedido antes de reescrever este teste',
    ).toBeVisible();
    await expect(
      formulario.getByRole('heading', { name: 'Identificação da Entidade / Solicitação', exact: true }),
      'o template servido por `teste` não traz mais a seção "Identificação da Entidade / ' +
        'Solicitação" — reveja o achado antes de reescrever este teste',
    ).toBeVisible();
    await expect(
      formulario.getByRole('heading', { name: 'Produtos/Serviços da Solicitação', exact: true }),
      'o template servido por `teste` não traz mais a seção de produtos/serviços — reveja o achado',
    ).toBeVisible();

    // ⚠️ Abrir é leitura. Nunca clicar em Enviar aqui: seria uma Solicitação de Compras real,
    // nascida de um processo de teste sem governança.
    expect(
      guarda.tentativas(),
      `abrir e ler o formulário não deveria escrever nada — tentou: ${JSON.stringify(guarda.urls())}`,
    ).toBe(0);
  });
});
