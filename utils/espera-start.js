// @ts-check
import { faltaPreCondicao } from './pre-condicao.js';

/**
 * Espera a resposta do `POST .../wf_solicitacao_compras/start` com VEREDITO.
 *
 * Por que existe: `page.waitForResponse` cru, quando estoura, reprova com
 * `TimeoutError: page.waitForResponse: Timeout 45000ms exceeded while waiting for event
 * "response"` — e mais nada. Quem abre o relatório não descobre se a SC não foi criada, se o
 * ambiente engasgou, ou se o widget nem chegou a enviar. Aconteceu em 26/08/2026 com
 * `CT-E2E-02-S1`: foi o único vermelho da execução sem causa declarada.
 *
 * A distinção que a mensagem faz, e que o timeout cru não fazia:
 *  - **nenhuma requisição saiu** → o widget não enviou (validação de cliente, botão inerte,
 *    formulário ainda montando). O defeito, se houver, é anterior ao servidor;
 *  - **saiu e não voltou** → o servidor não respondeu no prazo. É ambiente, não fluxo.
 *
 * @template T
 * @param {import('@playwright/test').Page} page
 * @param {() => Promise<T>} acionar o que dispara o envio (o clique em Confirmar)
 * @param {{ timeout?: number, contexto?: string }} [opcoes]
 * @returns {Promise<import('@playwright/test').Response>}
 */
export async function esperarStartDaSolicitacao(page, acionar, opcoes = {}) {
  const { timeout = 45_000, contexto = '' } = opcoes;
  /** @param {string} url */
  const ehStart = (url) => url.includes('/wf_solicitacao_compras/start');

  /** @type {string[]} */
  const enviadas = [];
  /** @param {import('@playwright/test').Request} req */
  const anotar = (req) => {
    if (req.method() === 'POST' && ehStart(req.url())) enviadas.push(req.url());
  };
  page.on('request', anotar);

  const esperada = page.waitForResponse((r) => ehStart(r.url()), { timeout }).catch(() => null);

  try {
    await acionar();
    const resposta = await esperada;
    if (resposta) return resposta;

    const detalhe = enviadas.length
      ? `${enviadas.length} requisição(ões) de start saiu(ram), mas nenhuma resposta chegou em ` +
        `${timeout}ms — o servidor não respondeu no prazo. Isto é ambiente, NÃO é o fluxo sob teste.`
      : `nenhuma requisição de start chegou a sair em ${timeout}ms — o widget não enviou. ` +
        'Verifique se o formulário terminou de montar e se o Confirmar ficou acionável; o ' +
        'problema é anterior ao servidor.';

    faltaPreCondicao(
      `(ambiente): a Solicitação de Compra não pôde ser criada${
        contexto ? ` (${contexto})` : ''
      }. ${detalhe}`,
    );
  } finally {
    page.off('request', anotar);
  }
}
