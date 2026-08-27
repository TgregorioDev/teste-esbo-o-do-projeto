// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';

/**
 * CT-NOT-03-S1 — contratos da API de notificação.
 *
 * Três defeitos de contrato medidos e, até aqui, sem guarda nenhuma na suíte. Os dois primeiros
 * viram assertion aqui; o terceiro (a remoção efetiva) está coberto pela metade que é
 * verificável sem escrever — a justificativa está ao final desta doc.
 *
 * ## 1. `GET /notification/api/v1/notifications` ignora `limit`/`offset`
 *
 * Medido em 27/08/2026 com a conta da automação: a lista tem **654** itens, e
 * `?limit=3&offset=0`, `?offset=650&limit=2` e `?pageSize=3&page=0` devolvem, os três, os
 * **mesmos 654 itens**, sempre a partir do mais recente. Os parâmetros são letra morta.
 *
 * Isso é mais que ineficiência: quem consome hoje recebe a lista inteira e "funciona". No dia
 * em que a paginação passar a valer, esse mesmo cliente passa a ver 3 itens onde via 654 — e a
 * mudança chega sem aviso, porque ninguém tem oráculo dos dois lados. Este teste é o oráculo:
 * hoje reprova (a paginação não funciona) e, quando for corrigida, fica verde sozinho.
 *
 * ## 2. `canRemove: true`, mas o verbo REST de remoção NÃO EXISTE
 *
 * Toda notificação vem com `canRemove: true`. O verbo REST correspondente
 * (`DELETE /notification/api/v1/notifications/{id}`) responde `500` com
 * `{"code":"NotFoundException"}` — e neste ambiente esse par significa **"a rota não existe"**,
 * não "o registro não foi achado" (decodificador medido pela skill `cassi-fluig-master`:
 * `NotFoundException` = path não mapeado; `NotAllowedException` = rota existe, método errado;
 * `404` de negócio = a rota executou e não achou o registro).
 *
 * O teste prova as três coisas de uma vez, **sem escrever nada**, usando a técnica de sondagem
 * por método da skill — e é isso que o torna seguro: como a rota não existe, sondá-la com um id
 * fictício não pode remover notificação nenhuma, hoje nem depois de uma eventual correção.
 *
 * | sonda | resposta medida | leitura |
 * |---|---|---|
 * | `DELETE /notification/api/v1/notifications/999999999` | `500 NotFoundException` | a rota com id não existe |
 * | `DELETE /notification/api/v1/notifications` (sem id) | `500 NotAllowedException` | a coleção existe; DELETE não é aceito nela |
 * | `GET /globalalertapi/api/rest/alert/removeAlerts` | `500 NotAllowedException` | **a remoção real existe** — e é POST |
 * | `GET /globalalertapi/api/rest/alert/rotaQueNaoExiste` | `500 NotFoundException` | controle do decodificador |
 *
 * A última linha é o controle que impede a leitura de ser suposição: sem ela, alguém poderia
 * argumentar que este ambiente responde `NotFoundException` para tudo.
 *
 * ## O que este arquivo NÃO cobre, e por quê
 *
 * O caso pede também confirmar que `POST /globalalertapi/api/rest/alert/removeAlerts` **remove
 * de verdade**, por releitura — o que é escrita, e a regra do projeto é remover só notificação
 * que a PRÓPRIA execução gerou. Medido em 27/08/2026: nesta conta as notificações nascem de
 * eventos de workflow (`NEW_COMPLEMENT_REQUISITIONER` — 397 das 654 —, `NEW_TASK_POOL_GROUP`,
 * `DOCUMENT_APPROVAL_PENDING`…), ou seja, só se gera uma criando/cancelando solicitação ou
 * publicando documento no GED. Nenhum desses caminhos pertence a este caso, e apagar
 * notificação de proveniência alheia contraria a política de escrita do projeto. A existência e
 * o método do endpoint ficam provados acima, sem executá-lo; a remoção efetiva segue registrada
 * como medição da skill (`references/artefatos-nao-processo.md`, seção 5).
 */

/**
 * @typedef {Object} Sonda
 * @property {number} status
 * @property {string} code `code` do corpo, que é o que distingue os casos neste ambiente
 * @property {string} corpo
 */

/**
 * Dispara uma requisição de dentro da página autenticada e devolve status + `code` do corpo.
 *
 * `page.evaluate` + `fetch`, nunca `page.request` (WAF — ver CLAUDE.md > utils).
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} metodo
 * @param {string} url
 * @returns {Promise<Sonda>}
 */
async function sondar(page, metodo, url) {
  return page.evaluate(
    async ({ metodo, url }) => {
      const resposta = await fetch(url, {
        method: metodo,
        credentials: 'include',
        headers: { Referer: `${location.origin}/portal/p/1/home`, Accept: 'application/json' },
      });
      const texto = await resposta.text();
      /** @type {any} */
      let corpo = null;
      try {
        corpo = JSON.parse(texto);
      } catch {
        corpo = null;
      }
      return { status: resposta.status, code: String(corpo?.code ?? ''), corpo: texto.slice(0, 300) };
    },
    { metodo, url },
  );
}

test.describe('Notificações — contratos da API (CT-NOT-03-S1)', () => {
  test('CT-NOT-03-S1: `GET /notification/api/v1/notifications` deve respeitar `limit` e `offset`', async ({
    page,
  }) => {
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

    const leituras = await page.evaluate(async () => {
      /** @param {string} url */
      const obter = async (url) => {
        const resposta = await fetch(url, {
          credentials: 'include',
          headers: { Referer: `${location.origin}/portal/p/1/home`, Accept: 'application/json' },
        });
        const texto = await resposta.text();
        /** @type {any} */
        let corpo = null;
        try {
          corpo = JSON.parse(texto);
        } catch {
          corpo = null;
        }
        return {
          status: resposta.status,
          quantidade: Array.isArray(corpo?.items) ? corpo.items.length : -1,
          primeiroId: corpo?.items?.[0]?.id ?? null,
          texto: corpo ? '' : texto.slice(0, 200),
        };
      };

      return {
        semParametro: await obter('/notification/api/v1/notifications'),
        limite3: await obter('/notification/api/v1/notifications?limit=3&offset=0'),
        segundaPagina: await obter('/notification/api/v1/notifications?limit=3&offset=3'),
      };
    });

    await test.info().attach('paginacao-de-notificacoes', {
      body: JSON.stringify(leituras, null, 2),
      contentType: 'application/json',
    });

    expect(
      leituras.semParametro.status,
      `PRÉ-CONDIÇÃO AUSENTE (ambiente): a lista de notificações respondeu ` +
        `${leituras.semParametro.status} (${leituras.semParametro.texto}) — sem lista não há ` +
        'contrato de paginação a verificar.',
    ).toBe(200);
    expect(
      leituras.semParametro.quantidade,
      'PRÉ-CONDIÇÃO AUSENTE: a conta não tem notificação nenhuma. Com menos de 4 itens, pedir ' +
        '`limit=3` devolveria menos que 3 por falta de massa, e o teste não provaria nada sobre ' +
        'a paginação.',
    ).toBeGreaterThan(3);

    // ── VERMELHO INTENCIONAL ──────────────────────────────────────────────────────────────
    // Medido: `limit=3` devolve a lista inteira (654 itens em 27/08/2026). Não ajuste esta
    // assertion para o número observado — ela existe para virar verde quando a paginação passar
    // a funcionar, e para acusar no MESMO instante a mudança de comportamento de quem hoje
    // consome a lista completa sem saber.
    expect(
      leituras.limite3.quantidade,
      '`GET /notification/api/v1/notifications?limit=3` deveria devolver 3 notificações e ' +
        `devolveu ${leituras.limite3.quantidade}: o parâmetro \`limit\` é ignorado pelo servidor. ` +
        'Todo cliente recebe a lista inteira hoje; no dia em que a paginação passar a valer, ' +
        'esses clientes mudam de comportamento sem nenhum aviso.',
    ).toBe(3);

    expect(
      leituras.segundaPagina.primeiroId,
      '`offset=3` deveria começar numa notificação DIFERENTE da primeira página e começou na ' +
        `mesma (id ${leituras.segundaPagina.primeiroId}): o parâmetro \`offset\` também é ignorado.`,
    ).not.toBe(leituras.limite3.primeiroId);
  });

  test('CT-NOT-03-S1: notificação declara `canRemove: true`, então o verbo REST de remoção deveria existir', async ({
    page,
  }) => {
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

    // Pré-condição real do caso: o recurso PROMETE ser removível. Sem isso, a ausência do verbo
    // seria coerente, não defeito.
    const lista = await page.evaluate(async () => {
      const resposta = await fetch('/notification/api/v1/notifications', {
        credentials: 'include',
        headers: { Referer: `${location.origin}/portal/p/1/home`, Accept: 'application/json' },
      });
      const corpo = await resposta.json().catch(() => null);
      const itens = corpo?.items ?? [];
      return { status: resposta.status, total: itens.length, removiveis: itens.filter((/** @type {any} */ n) => n.canRemove === true).length };
    });

    expect(
      lista.total,
      'PRÉ-CONDIÇÃO AUSENTE: a conta não tem notificação nenhuma para inspecionar o contrato.',
    ).toBeGreaterThan(0);
    expect(
      lista.removiveis,
      'PRÉ-CONDIÇÃO: o caso parte de notificações que se declaram removíveis (`canRemove: true`). ' +
        'Se nenhuma se declara assim, a ausência do verbo DELETE deixa de ser contradição.',
    ).toBeGreaterThan(0);

    // ⚠️ Sonda com id FICTÍCIO, de propósito: como a rota não existe (é o que se afirma abaixo),
    // esta requisição não pode remover nada — nem hoje, nem se o verbo passar a existir, porque
    // aí ela vira um "não encontrado" de negócio. É leitura disfarçada de escrita, não escrita.
    const deleteComId = await sondar(page, 'DELETE', '/notification/api/v1/notifications/999999999');
    const deleteNaColecao = await sondar(page, 'DELETE', '/notification/api/v1/notifications');
    const removeAlerts = await sondar(page, 'GET', '/globalalertapi/api/rest/alert/removeAlerts');
    const controleRotaInexistente = await sondar(
      page,
      'GET',
      '/globalalertapi/api/rest/alert/rotaQueNaoExisteNesteAmbiente',
    );

    await test.info().attach('sondagem-de-rotas-de-remocao', {
      body: JSON.stringify(
        { lista, deleteComId, deleteNaColecao, removeAlerts, controleRotaInexistente },
        null,
        2,
      ),
      contentType: 'application/json',
    });

    // Controle do decodificador: sem ele, ler `NotFoundException` como "rota inexistente" seria
    // suposição. Uma rota comprovadamente inventada tem de responder exatamente isso.
    expect(
      controleRotaInexistente.code,
      'o decodificador de erros deste ambiente mudou: uma rota inventada deveria responder ' +
        `500 \`NotFoundException\` e respondeu ${controleRotaInexistente.status} ` +
        `\`${controleRotaInexistente.code}\`. Toda a leitura abaixo depende dessa convenção.`,
    ).toBe('NotFoundException');

    // A coleção existe (só não aceita DELETE) — prova que o `NotFoundException` do id não é
    // "todo o namespace de notificações some", e sim especificamente a rota `/{id}`.
    expect(
      deleteNaColecao.code,
      'a coleção `/notification/api/v1/notifications` deveria existir e recusar o método DELETE ' +
        `(\`NotAllowedException\`); respondeu \`${deleteNaColecao.code}\`.`,
    ).toBe('NotAllowedException');

    // A remoção REAL existe e é POST — provado sem executá-la.
    expect(
      removeAlerts.code,
      '`/globalalertapi/api/rest/alert/removeAlerts` deveria existir (respondendo ' +
        `\`NotAllowedException\` a um GET, por ser POST) e respondeu \`${removeAlerts.code}\`. ` +
        'É por essa rota que a remoção de notificação realmente acontece.',
    ).toBe('NotAllowedException');

    // ── VERMELHO INTENCIONAL ──────────────────────────────────────────────────────────────
    // Um recurso REST que se declara `canRemove: true` deveria expor `DELETE /{id}`. Aqui o
    // verbo não existe (500 `NotFoundException` = path não mapeado), e a remoção só acontece
    // por um endpoint de OUTRO módulo, com outro nome e outro método. Quem programar contra a
    // API de notificações seguindo o próprio `canRemove` recebe um 500 e não tem como descobrir
    // pelo contrato onde está a remoção de verdade.
    expect(
      deleteComId.code,
      'as notificações declaram `canRemove: true`, mas ' +
        '`DELETE /notification/api/v1/notifications/{id}` responde ' +
        `${deleteComId.status} \`${deleteComId.code}\` — neste ambiente isso significa que a ROTA ` +
        'NÃO EXISTE (a coleção existe e responde `NotAllowedException`; uma rota inventada ' +
        'responde `NotFoundException`, como o controle acima confirma). A remoção real só existe ' +
        'em `POST /globalalertapi/api/rest/alert/removeAlerts`, em outro módulo e sem nenhuma ' +
        'referência no recurso que promete ser removível.',
    ).not.toBe('NotFoundException');
  });
});
