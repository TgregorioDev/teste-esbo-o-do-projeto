// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repetirSeFalhaDeRede } from '../utils/rede.js';

/** Mensagem real de `page.evaluate` quando o `fetch` morre no transporte (09/09/2026). */
const ERRO_DE_REDE = 'page.evaluate: TypeError: Failed to fetch\n    at eval (eval at evaluate)';

/**
 * Chamada que falha `falhas` vezes com a mensagem dada e depois devolve `valor`.
 * @param {number} falhas
 * @param {string} mensagem
 */
function chamadaQueFalha(falhas, mensagem, valor = 'ok') {
  let chamadas = 0;
  const fn = async () => {
    chamadas += 1;
    if (chamadas <= falhas) throw new Error(mensagem);
    return valor;
  };
  return { fn, contagem: () => chamadas };
}

test('falha de rede momentânea é repetida, e a leitura seguinte vale', async () => {
  const chamada = chamadaQueFalha(2, ERRO_DE_REDE);
  assert.equal(await repetirSeFalhaDeRede(chamada.fn, { tentativas: 3, espacamentoMs: 1 }), 'ok');
  assert.equal(chamada.contagem(), 3);
});

test('erro que não é de rede sobe na primeira vez, sem repetir', async () => {
  const chamada = chamadaQueFalha(5, 'page.evaluate: Error: GET /requests/1/tasks respondeu 404');
  await assert.rejects(repetirSeFalhaDeRede(chamada.fn, { tentativas: 3, espacamentoMs: 1 }), /respondeu 404/);
  assert.equal(chamada.contagem(), 1);
});

test('falha de rede persistente sobe intacta depois da última tentativa', async () => {
  const chamada = chamadaQueFalha(10, ERRO_DE_REDE);
  await assert.rejects(repetirSeFalhaDeRede(chamada.fn, { tentativas: 3, espacamentoMs: 1 }), /Failed to fetch/);
  assert.equal(chamada.contagem(), 3);
});
