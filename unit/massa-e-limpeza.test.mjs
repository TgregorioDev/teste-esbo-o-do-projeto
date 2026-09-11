// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ehRecusaTransitoria } from '../utils/cancelamento-fluig.js';
import { criarMassaSolicitacaoCompra } from '../factories/massa-solicitacao-compra.js';

/** Número no formato pt-BR que o formulário grava ("1.234,560000") → número. */
const deBR = (/** @type {string} */ texto) => Number(texto.replace(/\./g, '').replace(',', '.'));

test('recusa transitória do cancelamento é repetida; "já inativa" não é', () => {
  // Mensagens literais do servidor (27/08/2026, utils/cancelamento-fluig.js).
  assert.equal(
    ehRecusaTransitoria('Esta ação está sendo realizada por outra pessoa. Recomendamos atualizar a página e tentar novamente.'),
    true,
  );
  assert.equal(ehRecusaTransitoria('A solicitação é invalida ou está inativa'), false);
  // E6, antes da correção de 11/09/2026: recusa do ERP é definitiva, retentar só esconderia.
  assert.equal(ehRecusaTransitoria('Não foram encontradas contações para exclusão'), false);
});

test('massa de SC: valor total coerente com quantidade × preço, em 200 gerações', () => {
  for (let i = 0; i < 200; i++) {
    const { formFields } = criarMassaSolicitacaoCompra();
    const esperado = deBR(formFields.tbprod_quantidade___1) * deBR(formFields.tbprod_precoUnitario___1);
    const total = deBR(formFields.tbprod_valorTotal___1);
    assert.ok(Math.abs(total - esperado) < 0.005 + 1e-9, `total ${total} ≠ ${esperado} (${JSON.stringify(formFields)})`);
  }
});

test('massa de SC: override de valor respeitado — a alçada depende de 500 × R$ 50.000', () => {
  const { formFields } = criarMassaSolicitacaoCompra({ quantidade: 500, precoUnitario: 50_000 });
  assert.equal(formFields.tbprod_valorTotal___1, '25.000.000,00');
});

test('massa de SC: carimbo único em justificativa e item, rateio fechando 100%', () => {
  const a = criarMassaSolicitacaoCompra();
  const b = criarMassaSolicitacaoCompra();
  assert.notEqual(a.marca, b.marca);
  assert.match(a.marca, /^QA-MASSA-[0-9a-f]{8}$/);
  assert.ok(a.formFields.motivoSolCompra.startsWith(a.marca));
  assert.equal(a.formFields.tbprod_observacao___1, a.marca);
  const rateio = JSON.parse(a.formFields.tbprod_jsonrateio___1);
  assert.equal(rateio.reduce((/** @type {number} */ s, /** @type {any} */ r) => s + Number(r.tbRatCC_Rateio___1_1), 0), 100);
});
