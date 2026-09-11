// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FORNECEDOR_FATURAMENTO,
  fornecedoresParaMedicao,
  parseFornecedorDaGrade,
  ordemDeTentativaDeCompetencias,
} from '../factories/medicao.js';

test('o fornecedor designado do Faturamento é o TOTVS S.A (53113791/0001)', () => {
  assert.equal(FORNECEDOR_FATURAMENTO.codigo, '53113791');
  assert.equal(FORNECEDOR_FATURAMENTO.loja, '0001');
  assert.equal(FORNECEDOR_FATURAMENTO.nome, 'TOTVS S.A');
});

test('fornecedoresParaMedicao põe o TOTVS S.A primeiro e não o repete', () => {
  const descobertos = [
    { codigo: '05395624', loja: '0001' },
    { codigo: '53113791', loja: '0001' }, // é o próprio TOTVS S.A: não pode aparecer duas vezes
    { codigo: '09999999', loja: '0002' },
  ];
  const ordem = fornecedoresParaMedicao(descobertos);
  assert.deepEqual(ordem, [
    { codigo: '53113791', loja: '0001' },
    { codigo: '05395624', loja: '0001' },
    { codigo: '09999999', loja: '0002' },
  ]);
});

test('fornecedoresParaMedicao sem descobertos devolve só o designado', () => {
  assert.deepEqual(fornecedoresParaMedicao(), [{ codigo: '53113791', loja: '0001' }]);
});

test('mesmo código, loja diferente NÃO é considerado o mesmo fornecedor', () => {
  const ordem = fornecedoresParaMedicao([{ codigo: '53113791', loja: '0002' }]);
  assert.equal(ordem.length, 2);
  assert.deepEqual(ordem[1], { codigo: '53113791', loja: '0002' });
});

test('parseFornecedorDaGrade lê "<código> - <loja>" e rejeita formato inesperado', () => {
  assert.deepEqual(parseFornecedorDaGrade('05395624 - 0001'), { codigo: '05395624', loja: '0001' });
  assert.throws(() => parseFornecedorDaGrade('sem separador'), /formato inesperado/);
});

test('ordemDeTentativaDeCompetencias limita à quantidade pedida, preservando a ordem', () => {
  const comps = ['07-2025', '08-2025', '09-2025', '10-2025'];
  assert.deepEqual(ordemDeTentativaDeCompetencias(comps, 2), ['07-2025', '08-2025']);
  assert.deepEqual(ordemDeTentativaDeCompetencias(comps, 0), []);
});
