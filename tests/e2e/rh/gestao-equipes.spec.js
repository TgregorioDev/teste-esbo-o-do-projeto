// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../../utils/pre-condicao.js';

/**
 * FSWTBC-630 (achado A4) — o widget Gestão de Equipes anuncia ERRO sob o cabeçalho "Sucesso:".
 *
 * Medido em 08/09/2026 com a conta de QA, sem perfil nenhum: ao abrir
 * `/portal/p/1/gestao_equipes`, o widget não resolve a matrícula do usuário no ERP e exibe um
 * SweetAlert2 com **título "Sucesso:"** e a mensagem *"Usuário não encontrado no ERP Protheus."*.
 * O console registra, junto, `SweetAlert2: Unknown icon! Expected "success", "error", "warning",
 * "info" or "question", got "danger"` — o código passa um tipo de ícone que a biblioteca não
 * conhece, então nem o ícone de erro aparece.
 *
 * Depois do OK a área do widget fica vazia: zero tabelas, zero linhas e nenhum botão de ação.
 *
 * Os três testes deste arquivo afirmam o comportamento CORRETO e por isso REPROVAM hoje. São
 * `@bug`: o defeito nunca foi corrigido, não é regressão desta execução. Ajustá-los para aceitar
 * o que a tela faz hoje documentaria o defeito como se fosse a regra.
 *
 * Nada é escrito: o widget é apenas aberto.
 */

/** Ícones que o SweetAlert2 aceita. Qualquer outro valor faz a biblioteca não renderizar ícone. */
const ICONES_VALIDOS = ['success', 'error', 'warning', 'info', 'question'];

/** Palavras que caracterizam uma mensagem de FALHA, não de sucesso. */
const SINAIS_DE_ERRO = /não encontrado|nao encontrado|erro|falha|inválid|invalid|indisponív/i;

/**
 * Abre a Gestão de Equipes e devolve o diálogo do SweetAlert2, se ele aparecer.
 * @param {import('@playwright/test').Page} page
 */
async function abrirGestaoDeEquipes(page) {
  /** @type {string[]} */
  const errosDeConsole = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errosDeConsole.push(msg.text());
  });

  await page.goto('/portal/p/1/gestao_equipes', { waitUntil: 'domcontentloaded' });

  const dialogo = page.locator('.swal2-popup');

  // ARMADILHA MEDIDA: o widget exibe DOIS SweetAlert2 em sequência. O primeiro é
  // "Carregando informações! Aguarde... N ms." e o segundo é o desfecho. Esperar apenas por
  // `.swal2-popup` visível captura o de carregamento — foi o que aconteceu na primeira versão
  // deste arquivo, que leu o diálogo errado, não encontrou sinal de erro e ficou VERDE.
  //
  // A espera correta é pelo diálogo que NÃO é o de carregamento: estado observável, e o único
  // que corresponde ao desfecho da consulta ao ERP.
  const apareceu = await page
    .waitForFunction(
      () => {
        const p = [...document.querySelectorAll('.swal2-popup')].find(
          (e) => /** @type {HTMLElement} */ (e).offsetParent !== null,
        );
        return Boolean(p) && !/Carregando/i.test(p?.textContent ?? '');
      },
      null,
      { timeout: 45_000 },
    )
    .then(() => true)
    .catch(() => false);

  return { dialogo, apareceu, errosDeConsole };
}

test.describe('Gestão de Equipes — comunicação de erro (FSWTBC-630)', () => {
  test('@bug uma falha não pode ser anunciada sob o cabeçalho "Sucesso:"', async ({ page }) => {
    const { dialogo, apareceu } = await abrirGestaoDeEquipes(page);

    if (!apareceu) {
      // Sem diálogo de desfecho não há rótulo a avaliar. Declarar a pré-condição em vez de
      // voltar verde: um `return` silencioso aqui é o mesmo falso verde que este arquivo existe
      // para eliminar.
      faltaPreCondicao(
        'o widget não exibiu diálogo de desfecho em 45s (só o de carregamento, ou nenhum). ' +
          'Sem ele o cenário do FSWTBC-630 não ocorreu nesta execução.',
      );
    }

    const titulo = (await dialogo.locator('.swal2-title').innerText()).trim();
    const mensagem = (await dialogo.innerText()).replace(/\s+/g, ' ').trim();

    test.info().annotations.push({
      type: 'gestao-equipes',
      description: `titulo="${titulo}" mensagem="${mensagem.slice(0, 160)}"`,
    });

    if (!SINAIS_DE_ERRO.test(mensagem)) {
      // A mensagem não é de falha, então o rótulo "Sucesso:" seria legítimo — e o cenário do
      // FSWTBC-630 (falha anunciada como sucesso) NÃO ocorreu nesta execução. A versão anterior
      // fazia `return` aqui: este teste `@bug` terminava VERDE sem afirmar nada, e o alarme de
      // "defeito corrigido" (`scripts/alerta-bug-corrigido.mjs`) leria isso como conserto.
      // Achado pelo lint em 11/09/2026. Cenário ausente é pré-condição, nunca verde.
      faltaPreCondicao(
        `o diálogo de desfecho não comunicou falha ("${mensagem.slice(0, 120)}"), então o cenário do ` +
          'FSWTBC-630 — falha sob o cabeçalho "Sucesso:" — não ocorreu nesta execução.',
      );
    }

    expect(
      titulo,
      `o diálogo comunica uma FALHA ("${mensagem.slice(0, 120)}") sob um cabeçalho de sucesso. ` +
        `Quem lê o título acredita que a operação deu certo — é o oposto do que aconteceu`,
    ).not.toMatch(/sucesso/i);
  });

  test('@bug o diálogo de erro deve usar um ícone que a biblioteca reconhece', async ({ page }) => {
    const { apareceu, errosDeConsole } = await abrirGestaoDeEquipes(page);
    if (!apareceu) {
      faltaPreCondicao('o widget não exibiu diálogo de desfecho em 45s — cenário não ocorreu');
    }

    // Sem ícone válido o usuário perde o único sinal visual que distingue erro de sucesso —
    // e, neste caso, o título já diz "Sucesso:". Os dois defeitos se somam.
    const iconeDesconhecido = errosDeConsole.filter((e) => /Unknown icon/i.test(e));

    expect(
      iconeDesconhecido,
      `o widget pediu um ícone que o SweetAlert2 não conhece, então nenhum ícone é renderizado. ` +
        `Aceitos: ${ICONES_VALIDOS.join(', ')}`,
    ).toEqual([]);
  });

  test('@bug após fechar o aviso, a tela deve oferecer algum caminho — não ficar em branco', async ({
    page,
  }) => {
    const { dialogo, apareceu } = await abrirGestaoDeEquipes(page);
    if (!apareceu) {
      faltaPreCondicao('o widget não exibiu diálogo de desfecho em 45s — cenário não ocorreu');
    }

    await dialogo.getByRole('button', { name: 'OK', exact: true }).click();
    await dialogo.waitFor({ state: 'hidden' });

    // Medido: sobram apenas o menu e o título "Gestão de Equipes" — nenhuma tabela, nenhuma
    // linha, nenhum botão de ação. O usuário fica sem saber o que fazer a seguir.
    const tabelas = await page.locator('table').count();
    const acoes = await page
      .getByRole('button')
      .filter({ hasNotText: /^\s*9\+\s*$/ })
      .count();

    expect(
      { tabelas, acoes },
      'depois do OK a área do widget ficou sem conteúdo e sem ação: a tela deveria oferecer ao ' +
        'menos uma mensagem explicando o que fazer, ou um caminho de volta',
    ).not.toEqual({ tabelas: 0, acoes: 0 });
  });
});
