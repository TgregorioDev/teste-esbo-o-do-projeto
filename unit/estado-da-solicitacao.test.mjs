// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saiuDaIntegracao, medirIntegracao } from '../utils/estado-da-solicitacao.js';

/**
 * Leituras REAIS de `/process-management/api/v2/requests/{id}/tasks` (11/09/2026), reduzidas aos
 * campos que as funções usam. São o oráculo: o critério "saiu da integração" nasceu de um verde
 * falso medido nelas, e é contra elas que ele não pode regredir.
 */

/** SC 96487 no instante em que o teste de SLA a leu: a 233 fechou um movimento e segue integrando. */
const SC_96487_AINDA_INTEGRANDO = [
  { movementSequence: 1, state: { sequence: 294, stateName: 'Compra Centralizada?' }, status: 'COMPLETED', startDate: '2026-09-11T13:02:18.000-0300', assignee: { code: 'TOTVS-FS' } },
  { movementSequence: 2, state: { sequence: 233, stateName: 'Grava SC e Anexos' }, status: 'COMPLETED', startDate: '2026-09-11T13:02:19.000-0300', assignee: { code: 'System:Auto' } },
  { movementSequence: 3, state: { sequence: 233, stateName: 'Grava SC e Anexos' }, status: 'NOT_COMPLETED', startDate: '2026-09-11T13:02:20.000-0300', assignee: { code: 'System:Auto' } },
];

/** SC 96474: integrou e caiu no pool da Validação do Gestor, 29 s depois de entrar na 233. */
const SC_96474_NO_POOL_DO_GESTOR = [
  { movementSequence: 1, state: { sequence: 294, stateName: 'Compra Centralizada?' }, status: 'COMPLETED', startDate: '2026-09-11T09:07:07.000-0300', assignee: { code: 'TOTVS-FS' } },
  { movementSequence: 2, state: { sequence: 233, stateName: 'Grava SC e Anexos' }, status: 'COMPLETED', startDate: '2026-09-11T09:07:08.000-0300', assignee: { code: 'System:Auto' } },
  { movementSequence: 3, state: { sequence: 7, stateName: 'Validação do Gestor' }, status: 'COMPLETED', startDate: '2026-09-11T09:07:08.000-0300', assignee: { code: 'System:Auto' } },
  { movementSequence: 4, state: { sequence: 7, stateName: 'Validação do Gestor' }, status: 'NOT_COMPLETED', startDate: '2026-09-11T09:07:37.000-0300', assignee: { code: 'Pool:Group:G.P.Requisicao_de_Compras_Gestor_Imediato' } },
];

/** SC 96456 (10/09): caiu em Correção depois de 1.221 s — o "1.220 s" do relatório dos destrutivos. */
const SC_96456_NA_CORRECAO = [
  { movementSequence: 1, state: { sequence: 294, stateName: 'Compra Centralizada?' }, status: 'COMPLETED', startDate: '2026-09-10T16:10:06.000-0300', assignee: { code: 'TOTVS-FS' } },
  { movementSequence: 2, state: { sequence: 233, stateName: 'Grava SC e Anexos' }, status: 'COMPLETED', startDate: '2026-09-10T16:10:07.000-0300', assignee: { code: 'System:Auto' } },
  { movementSequence: 3, state: { sequence: 236, stateName: 'Correção' }, status: 'COMPLETED', startDate: '2026-09-10T16:10:08.000-0300', assignee: { code: 'System:Auto' } },
  { movementSequence: 4, state: { sequence: 236, stateName: 'Correção' }, status: 'NOT_COMPLETED', startDate: '2026-09-10T16:30:28.000-0300', assignee: { code: 'Pool:Group:G.P.Requisicao_de_Compras_Correcoes' } },
];

test('a SC ainda integrando NÃO saiu da integração, mesmo com uma tarefa 233 COMPLETED', () => {
  // O critério antigo aceitava esta leitura — é o verde falso que motivou a troca.
  const criterioAntigo = SC_96487_AINDA_INTEGRANDO.some(
    (t) => t.state.stateName === 'Grava SC e Anexos' && t.status === 'COMPLETED',
  );
  assert.equal(criterioAntigo, true);
  assert.equal(saiuDaIntegracao(SC_96487_AINDA_INTEGRANDO), false);
});

test('a SC no pool da Validação do Gestor saiu da integração, e a espera medida é de 29 s', () => {
  assert.equal(saiuDaIntegracao(SC_96474_NO_POOL_DO_GESTOR), true);
  const medida = medirIntegracao(SC_96474_NO_POOL_DO_GESTOR);
  assert.equal(medida.segundos, 29);
  assert.deepEqual(medida.atividadesAbertas, ['Validação do Gestor']);
});

test('a SC que caiu em Correção saiu da integração, com a espera real de 1.221 s', () => {
  assert.equal(saiuDaIntegracao(SC_96456_NA_CORRECAO), true);
  assert.equal(medirIntegracao(SC_96456_NA_CORRECAO).segundos, 1221);
});

test('medir sem tarefa humana aberta é erro de uso, não medida zero', () => {
  assert.throws(() => medirIntegracao(SC_96487_AINDA_INTEGRANDO), /exige uma leitura/);
});
