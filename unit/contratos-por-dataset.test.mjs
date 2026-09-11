// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapearContratosVigentes } from '../utils/contratos-por-dataset.js';

/**
 * Linhas no formato de `dsProtheus_getContratos_restGetAll` (reduzidas aos campos usados). O
 * primeiro vigente é o da amostra real de 11/09/2026 na filial 5303 (fornecedor 62004395, loja 0025).
 */
const LINHAS = [
  { CN9_NUMERO: '00036-2024-5303', CN9_FILIAL: '5303', CN9_REVISA: '', CN9_SITUAC: '05', CN9_TPCTO: '009', CN9_XCODFO: '62004395', CN9_XLOJAF: '0025' },
  // mesmo contrato, revisão posterior — vale a de maior revisão
  { CN9_NUMERO: '00036-2024-5303', CN9_FILIAL: '5303', CN9_REVISA: '001', CN9_SITUAC: '05', CN9_TPCTO: '009', CN9_XCODFO: '62004395', CN9_XLOJAF: '0025' },
  // finalizado (10) — não é vigente
  { CN9_NUMERO: '00010-2020-5303', CN9_FILIAL: '5303', CN9_REVISA: '', CN9_SITUAC: '10', CN9_TPCTO: '001', CN9_XCODFO: '1', CN9_XLOJAF: '0001' },
  // vigente sem fornecedor — a medição não teria por onde começar
  { CN9_NUMERO: '00099-2025-2901', CN9_FILIAL: '2901', CN9_REVISA: '', CN9_SITUAC: '05', CN9_TPCTO: '002', CN9_XCODFO: '', CN9_XLOJAF: '0001' },
  // mesmo número em OUTRA filial — é outro contrato
  { CN9_NUMERO: '00036-2024-5303', CN9_FILIAL: '3501', CN9_REVISA: '', CN9_SITUAC: '05', CN9_TPCTO: '009', CN9_XCODFO: '777', CN9_XLOJAF: '0002' },
];

test('só vigentes com fornecedor, um por contrato+filial, na maior revisão', () => {
  const linhas = mapearContratosVigentes(LINHAS);
  assert.equal(linhas.length, 2);
  const sede = linhas.find((l) => l.filial === '5303');
  assert.deepEqual(sede, {
    filial: '5303',
    tipo: '009',
    contrato: '00036-2024-5303',
    revisao: '001',
    status: 'Vigente',
    fornecedor: '62004395 - 0025',
  });
  assert.ok(linhas.some((l) => l.filial === '3501' && l.fornecedor === '777 - 0002'));
});

test('o fornecedor sai no formato que parseFornecedorDaGrade lê', async () => {
  const { parseFornecedorDaGrade } = await import('../factories/medicao.js');
  const [linha] = mapearContratosVigentes([LINHAS[0]]);
  assert.deepEqual(parseFornecedorDaGrade(linha.fornecedor), { codigo: '62004395', loja: '0025' });
});

test('nenhum vigente com fornecedor devolve lista vazia', () => {
  assert.deepEqual(mapearContratosVigentes([LINHAS[2], LINHAS[3]]), []);
});
