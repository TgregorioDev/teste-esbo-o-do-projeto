// @ts-check
import { fakerPT_BR as faker } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';

/**
 * Factories de massa fictícia dos processos jurídicos (SIGAJURI) — mesma composição
 * obrigatória documentada em `factories/pessoa.js`:
 *   faker.*    → realismo
 *   randomUUID → unicidade (paralelismo sem colisão entre workers)
 *   QA_PREFIX  → rastreabilidade
 */

const QA_PREFIX = process.env.QA_DATA_PREFIX ?? 'QA';

/**
 * @typedef {Object} SolicitacaoConsultivo
 * @property {string} solicitacao texto livre do campo "Solicitação"
 * @property {string} observacoes texto livre do campo "Observações"
 * @property {string} areaSolicitante rótulo exato de uma opção real da combo "Área Solicitante"
 */

/**
 * @param {Partial<SolicitacaoConsultivo>} [overrides]
 * @returns {SolicitacaoConsultivo}
 */
export function criarSolicitacaoConsultivo(overrides = {}) {
  const id = randomUUID().slice(0, 8);
  return {
    solicitacao: `${QA_PREFIX} ${faker.lorem.sentence({ min: 6, max: 12 })} ${id}`,
    observacoes: `${QA_PREFIX} ${faker.lorem.sentence({ min: 4, max: 8 })} ${id}`,
    areaSolicitante: 'DIVISÃO DE CONTENCIOSO',
    ...overrides,
  };
}

/**
 * @typedef {Object} SolicitacaoContencioso
 * @property {string} uf sigla presente nas opções reais da combo "UF"
 * @property {string} responsavel rótulo exato de uma opção real da combo "Responsável pela Demanda"
 * @property {string} tipoConsulta rótulo exato de uma opção real da combo "Tipo da Consulta"
 * @property {string} titulo texto livre do campo "Titulo Mensagem"
 * @property {string} descricao texto livre do campo "Descrição"
 */

/**
 * @param {Partial<SolicitacaoContencioso>} [overrides]
 * @returns {SolicitacaoContencioso}
 */
export function criarSolicitacaoContencioso(overrides = {}) {
  const id = randomUUID().slice(0, 8);
  return {
    uf: 'MA',
    responsavel: 'CASSI Sede',
    tipoConsulta: 'Orientação processual',
    titulo: `${QA_PREFIX} ${faker.lorem.words(5)} ${id}`,
    descricao: `${QA_PREFIX} ${faker.lorem.sentence({ min: 6, max: 12 })} ${id}`,
    ...overrides,
  };
}
