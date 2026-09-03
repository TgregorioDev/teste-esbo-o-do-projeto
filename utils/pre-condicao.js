// @ts-check
import { test } from '@playwright/test';

/**
 * Tipo da anotação que o gate (`scripts/veredito-do-gate.mjs`) e o relatório leem.
 *
 * É a MESMA grafia que os specs de RH (`dependentes`, `substituicao-cargos`, `admissao`) já
 * anotavam à mão — eles importam esta constante para que exista uma única grafia. Atenção à
 * semântica: a anotação sozinha NÃO significa falha. Esses três testes anotam a pré-condição
 * e PASSAM (provam o bloqueio); por isso o veredito só considera a anotação em teste que não
 * passou. Teste verde com anotação continua sendo verde.
 */
export const ANOTACAO_PRE_CONDICAO = 'pre-condicao-ausente';

/** Prefixo textual que `scripts/relatorio-falhas.mjs` usa para classificar a causa. */
export const PREFIXO_PRE_CONDICAO = 'PRÉ-CONDIÇÃO AUSENTE';

/**
 * Anota a pré-condição ausente no teste corrente e DEVOLVE o erro, sem lançar. Existe para o
 * único lugar em que lançar não serve: um `reject(...)` dentro de `setTimeout`
 * (`utils/captura-payload.js`). Em todo o resto use `faltaPreCondicao`.
 *
 * @param {string} motivo ver `faltaPreCondicao`
 * @returns {Error}
 */
export function erroDePreCondicao(motivo) {
  try {
    // `test.info()` lança fora de um teste (script de manutenção, `globalSetup`, código
    // chamado de um `.mjs`). Aí não há relatório para anotar — o try/catch cobre SÓ esta
    // chamada; o erro devolvido/lançado abaixo é incondicional, então nada é engolido.
    test.info().annotations.push({ type: ANOTACAO_PRE_CONDICAO, description: motivo });
  } catch {
    // fora de um teste não há relatório para anotar
  }
  const separador = motivo.startsWith('(') ? ' ' : ': ';
  return new Error(`${PREFIXO_PRE_CONDICAO}${separador}${motivo}`);
}

/**
 * Declara que o cenário não pôde ser exercitado por falta de massa, serviço ou permissão —
 * e falha o teste, porque a skill proíbe skip e o relatório precisa mostrar o motivo no
 * caminho padrão de leitura.
 *
 * A anotação é o que permite ao gate separar "ambiente" de "regressão" sem ler mensagem.
 * A mensagem continua começando com `PRÉ-CONDIÇÃO AUSENTE` porque `relatorio-falhas.mjs`
 * classifica por esse texto.
 *
 * Sobre o qualificador entre parênteses: `relatorio-falhas.mjs` distingue `infraestrutura`
 * (a máquina/rede que executa) de `ambiente` (massa/serviço do cliente) procurando a palavra
 * na mensagem. Decisão: NÃO há segundo parâmetro — o chamador passa o motivo já com o texto
 * que quiser depois do prefixo, inclusive o qualificador quando ele importa:
 *
 *   faltaPreCondicao('(ambiente): o catálogo respondeu 500')
 *   faltaPreCondicao('(infraestrutura): a requisição de criação não saiu em 60s')
 *   faltaPreCondicao('a grade de contratos não retornou nenhuma linha')
 *
 * Um parâmetro a mais só criaria uma segunda forma de dizer a mesma coisa. A mensagem final é
 * `PRÉ-CONDIÇÃO AUSENTE` + espaço + motivo quando o motivo começa com `(`, e
 * `PRÉ-CONDIÇÃO AUSENTE: ` + motivo caso contrário — de modo que as três formas acima
 * produzem exatamente o texto que existia antes da migração.
 *
 * `MASSA INSUFICIENTE` (todos os contratos reservados por outros workers) é a mesma classe e
 * passa por aqui como `faltaPreCondicao('MASSA INSUFICIENTE — ...')`.
 *
 * @param {string} motivo o que falta, quem destrava e por que NÃO é defeito do produto
 * @returns {never}
 */
export function faltaPreCondicao(motivo) {
  throw erroDePreCondicao(motivo);
}
