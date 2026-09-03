// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../../utils/pre-condicao.js';
import { comExclusividade } from '../../../utils/exclusividade.js';

/**
 * CT-PLT-07-S1 — `addFavorites` duplicado responde 500 em TEXTO PURO. @destrutivo
 *
 * `pages/FavoritosPage.js` convive com este comportamento sem documentá-lo em assertion: ela
 * evita o clique duplicado sendo idempotente. O contrato do servidor, porém, continua sem
 * guarda — e é ele que qualquer outro cliente (widget, integração, script) vai encontrar.
 *
 * ## O que foi medido em 27/08/2026
 *
 * | chamada | resposta |
 * |---|---|
 * | `POST /ecm/api/rest/ecm/processStart/addFavorites?processId=<id>` (1ª vez) | `200` · `application/json` · `{"content":"OK","message":null}` |
 * | a MESMA chamada de novo | **`500`** · `text/plain;charset=UTF-8` · `Processo <id> já está nos seus favoritos.` |
 * | `POST .../removeFavorites?processId=<id>` | `200` · `application/json` · `{"content":"OK","message":null}` |
 *
 * Favoritar duas vezes é uma condição de NEGÓCIO trivial (duplo clique, duas abas, retentativa
 * de rede). O esperado é 200 idempotente ou um erro de negócio em JSON — nunca `500` com corpo
 * em texto puro: quem faz `response.json()` recebe uma exceção de parsing no lugar da mensagem,
 * e o erro chega ao usuário como "erro inesperado". VERMELHO INTENCIONAL.
 *
 * ## Escrita, exclusividade e por que o alvo é `SIGAJURI_Contencioso`
 *
 * Favorito é estado GLOBAL da conta única — foi o que derrubou uma versão anterior de
 * CT-PLT-05-H (`describe.serial` não serializa entre repetições de `--repeat-each`). Duas
 * proteções, complementares:
 *
 * 1. **Lock de sistema de arquivos** (`utils/exclusividade.js`), segurado durante toda a
 *    sequência favoritar → duplicar → desfavoritar. É o que impede instâncias concorrentes
 *    DESTE teste (workers × repetições) de se atropelarem.
 * 2. **Alvo fora do pool do outro teste de favoritos.** `favoritos.spec.js` sorteia seu
 *    candidato entre os processos do catálogo "Iniciar Solicitações" (`onlyCanStart=true`, 17
 *    processos). `SIGAJURI_Contencioso` está publicado e ativo, mas **não** consta desse
 *    catálogo (ver `catalogo-invariante.spec.js`) — logo nunca pode ser sorteado lá, e os dois
 *    testes não disputam o mesmo processo mesmo rodando juntos. Isso importa porque
 *    `favoritos.spec.js` não toma este lock: a separação de alvos é o que garante o isolamento
 *    entre os dois arquivos.
 *
 * O estado da conta é restaurado dentro do próprio teste (o `removeFavorites` acontece ANTES
 * da assertion vermelha, de propósito — assertion que reprova interrompe o corpo do teste, e
 * deixar a limpeza depois dela produziria resíduo a cada execução).
 */

/** Processo publicado e ativo que NÃO está no catálogo `onlyCanStart` — ver doc acima. */
const PROCESSO_ALVO = 'SIGAJURI_Contencioso';

/**
 * @typedef {Object} RespostaFavorito
 * @property {number} status
 * @property {string} contentType
 * @property {string} corpo
 */

/**
 * Chama um endpoint de favoritos de dentro da página autenticada.
 *
 * `page.evaluate` + `fetch`, nunca `page.request`: o WAF do ambiente exige `User-Agent` de
 * navegador e `Referer` do portal (CLAUDE.md > utils). O corpo é lido como TEXTO — ler como
 * JSON aqui esconderia justamente o defeito sob teste.
 *
 * @param {import('@playwright/test').Page} page
 * @param {'addFavorites' | 'removeFavorites'} operacao
 * @param {string} processId
 * @returns {Promise<RespostaFavorito>}
 */
async function chamarFavoritos(page, operacao, processId) {
  return page.evaluate(
    async ({ operacao, processId }) => {
      const resposta = await fetch(
        `/ecm/api/rest/ecm/processStart/${operacao}?processId=${encodeURIComponent(processId)}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { Referer: `${location.origin}/portal/p/1/pageprocessstart` },
        },
      );
      return {
        status: resposta.status,
        contentType: resposta.headers.get('content-type') ?? '',
        corpo: (await resposta.text()).slice(0, 300),
      };
    },
    { operacao, processId },
  );
}

/**
 * Lê a lista de processos favoritos da conta.
 *
 * ⚠️ O typo `Favotires` é do produto, não deste teste.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>}
 */
async function listarFavoritos(page) {
  const lista = await page.evaluate(async () => {
    const resposta = await fetch('/ecm/api/rest/ecm/favorites/getProcessFavotiresList?rows=100&page=1', {
      credentials: 'include',
      headers: { Referer: `${location.origin}/portal/p/1/pageprocessstart` },
    });
    const texto = await resposta.text();
    /** @type {any} */
    let corpo = null;
    try {
      corpo = JSON.parse(texto);
    } catch {
      corpo = null;
    }
    return { status: resposta.status, corpo, texto: corpo ? '' : texto.slice(0, 200) };
  });

  if (lista.status !== 200 || !lista.corpo) {
    faltaPreCondicao(
      `(ambiente): getProcessFavotiresList respondeu ${lista.status} ` +
        `(${lista.texto}) — sem a lista de favoritos não há como confirmar o estado da conta.`,
    );
  }

  return (lista.corpo.invdata ?? []).map((/** @type {any} */ f) => String(f.processId));
}

test.describe('Plataforma — contrato de `addFavorites` (CT-PLT-07-S1) @destrutivo', () => {
  test('CT-PLT-07-S1: favoritar o mesmo processo duas vezes deve responder erro de negócio em JSON (ou 200 idempotente), não 500 em texto puro @destrutivo @bug', async ({
    page,
  }) => {
    await page.goto('/portal/p/1/pageprocessstart', { waitUntil: 'domcontentloaded' });

    await comExclusividade('fluig-favoritos-contrato-api', async () => {
      // Resíduo de uma execução abortada deixaria o processo já favoritado, e o "primeiro"
      // add responderia 500 — o teste mediria a duplicidade errada. Sob o lock, o alvo é
      // exclusivo desta instância, então zerar o estado aqui é seguro e determinístico.
      if ((await listarFavoritos(page)).includes(PROCESSO_ALVO)) {
        await chamarFavoritos(page, 'removeFavorites', PROCESSO_ALVO);
      }

      const primeiro = await chamarFavoritos(page, 'addFavorites', PROCESSO_ALVO);
      const duplicado = await chamarFavoritos(page, 'addFavorites', PROCESSO_ALVO);

      // ── Restauração ANTES das assertions ────────────────────────────────────────────────
      // A assertion vermelha abaixo interrompe o corpo do teste. Desfavoritar depois dela
      // deixaria o processo favoritado a cada execução — resíduo permanente de estado de conta.
      const remocao = await chamarFavoritos(page, 'removeFavorites', PROCESSO_ALVO);
      const favoritosAoFinal = await listarFavoritos(page);

      await test.info().attach('contrato-addFavorites', {
        body: JSON.stringify({ processo: PROCESSO_ALVO, primeiro, duplicado, remocao, favoritosAoFinal }, null, 2),
        contentType: 'application/json',
      });

      expect(
        { status: remocao.status, favoritado: favoritosAoFinal.includes(PROCESSO_ALVO) },
        'a limpeza do próprio teste falhou: `removeFavorites` deveria devolver 200 e o processo ' +
          `deveria sair da lista de favoritos da conta. Estado ao final: ${JSON.stringify(favoritosAoFinal)}`,
      ).toEqual({ status: 200, favoritado: false });

      expect(
        { status: primeiro.status, json: primeiro.contentType.includes('application/json') },
        `favoritar um processo pela primeira vez deveria responder 200 em JSON — respondeu ` +
          `${primeiro.status} (${primeiro.contentType}): ${primeiro.corpo}. Sem isso, a ` +
          'duplicidade medida a seguir não seria a duplicidade real.',
      ).toEqual({ status: 200, json: true });

      // ── VERMELHO INTENCIONAL ────────────────────────────────────────────────────────────
      // Medido em 27/08/2026: `500` com `text/plain` e o corpo
      // `Processo SIGAJURI_Contencioso já está nos seus favoritos.` — mensagem de NEGÓCIO
      // entregue como erro de servidor e fora do formato do resto da API. Não ajuste esta
      // assertion para acomodar o 500: quando o produto passar a responder 200 idempotente ou
      // um erro de negócio em JSON, o teste fica verde sozinho.
      expect(
        { status: duplicado.status, contentType: duplicado.contentType },
        'favoritar duas vezes o mesmo processo é condição de negócio trivial (duplo clique, duas ' +
          'abas, retentativa de rede) e o servidor responde ' +
          `${duplicado.status} com corpo em ${duplicado.contentType}: "${duplicado.corpo}". ` +
          'Deveria ser 200 idempotente ou erro de negócio em JSON — 500 com texto puro quebra ' +
          'qualquer cliente que faça parse do corpo e transforma uma mensagem clara em ' +
          '"erro inesperado" na tela.',
      ).toEqual({ status: 200, contentType: expect.stringContaining('application/json') });
    });
  });
});
