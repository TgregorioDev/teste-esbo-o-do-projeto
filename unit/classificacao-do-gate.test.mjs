// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classificar, classificarRelatorio, ANOTACAO_PRE_CONDICAO } from '../scripts/classificacao-do-gate.mjs';

const SPEC = { file: 'compras/exemplo.spec.js', line: 42 };
const PRE_CONDICAO = { type: ANOTACAO_PRE_CONDICAO, description: '(ambiente): a grade não retornou linha' };

/**
 * @param {string} status
 * @param {{ anotacoes?: object[], anotacoesDoResultado?: object[], erro?: string }} [opcoes]
 */
function teste(status, { anotacoes = [], anotacoesDoResultado = [], erro } = {}) {
  return { status, annotations: anotacoes, results: [{ annotations: anotacoesDoResultado, error: erro ? { message: erro } : undefined }] };
}

test('@bug e @achado ficam fora do gate mesmo vermelhos e com pré-condição', () => {
  for (const tag of ['@bug', '@achado']) {
    const v = classificar(SPEC, teste('unexpected', { anotacoes: [PRE_CONDICAO] }), ['Compras', `caso X ${tag}`]);
    assert.equal(v.classe, 'conhecido');
  }
});

test('teste verde com anotação de pré-condição continua verde — os specs de RH provam o bloqueio assim', () => {
  assert.equal(classificar(SPEC, teste('expected', { anotacoes: [PRE_CONDICAO] }), ['RH', 'bloqueio']).classe, 'ok');
});

test('vermelho com a anotação SÓ no resultado que falhou é pré-condição, com o motivo da anotação', () => {
  const v = classificar(SPEC, teste('unexpected', { anotacoesDoResultado: [PRE_CONDICAO] }), ['Compras', 'caso']);
  assert.equal(v.classe, 'pre-condicao');
  assert.equal(v.motivo, PRE_CONDICAO.description);
});

test('vermelho sem anotação é regressão, com a primeira linha do erro e sem ANSI', () => {
  const erro = '\x1b[31mexpect(locator).toBeVisible() failed\x1b[39m\n\nLocator: getByRole(...)';
  const v = classificar(SPEC, teste('unexpected', { erro }), ['Compras', 'caso']);
  assert.equal(v.classe, 'regressao');
  assert.equal(v.motivo, 'expect(locator).toBeVisible() failed');
});

test('texto "PRÉ-CONDIÇÃO AUSENTE" na mensagem, sem a anotação, é regressão — throw à mão não conta', () => {
  const v = classificar(SPEC, teste('unexpected', { erro: 'Error: PRÉ-CONDIÇÃO AUSENTE: escrito à mão' }), ['c']);
  assert.equal(v.classe, 'regressao');
});

test('flaky não bloqueia e aponta o último erro; skip bloqueia', () => {
  assert.match(classificar(SPEC, teste('flaky', { erro: 'Timeout 30000ms' }), ['c']).motivo, /Timeout 30000ms/);
  assert.equal(classificar(SPEC, teste('skipped'), ['c']).classe, 'pulado');
});

test('relatório: título montado pelas suítes aninhadas, totais e bloqueio', () => {
  const relatorio = {
    suites: [
      {
        title: 'compras/exemplo.spec.js',
        specs: [],
        suites: [
          {
            title: 'Grupo',
            specs: [
              { ...SPEC, title: 'verde', tests: [teste('expected')] },
              { ...SPEC, title: 'ambiente', tests: [teste('unexpected', { anotacoesDoResultado: [PRE_CONDICAO] })] },
            ],
          },
        ],
      },
    ],
    errors: [],
  };
  const r = classificarRelatorio(relatorio);
  assert.equal(r.testes[0].titulo, 'compras/exemplo.spec.js › Grupo › verde');
  assert.deepEqual(r.totais, { ok: 1, conhecido: 0, 'pre-condicao': 1, flaky: 0, regressao: 0, pulado: 0 });
  assert.equal(r.bloqueia, false);

  relatorio.suites[0].suites[0].specs.push({ ...SPEC, title: 'quebrou', tests: [teste('unexpected', { erro: 'x' })] });
  assert.equal(classificarRelatorio(relatorio).bloqueia, true);
});

test('relatório sem nenhum teste bloqueia — um gate que não mediu nada não pode passar', () => {
  const r = classificarRelatorio({ suites: [], errors: [] });
  assert.equal(r.bloqueia, true);
  assert.match(r.errosDeExecucao[0], /nada foi medido/);
});

test('erro de execução do runner ("No tests found") bloqueia mesmo com testes verdes', () => {
  const r = classificarRelatorio({
    suites: [{ title: 'a', specs: [{ ...SPEC, title: 'verde', tests: [teste('expected')] }] }],
    errors: [{ message: 'Error: No tests found\nextra' }],
  });
  assert.equal(r.bloqueia, true);
  assert.deepEqual(r.errosDeExecucao, ['Error: No tests found']);
});
