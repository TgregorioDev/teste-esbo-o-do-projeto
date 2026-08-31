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
 * @property {string} [areaSolicitante] rótulo de uma opção da combo "Área Solicitante" — a
 *   intenção de QUAL área é sempre do caso, nunca um default da factory (ver nota abaixo).
 *   Omitido, `SigajuriPage.preencherConsultivo` não toca no combo.
 */

/**
 * Não fixa `areaSolicitante` por padrão. Mesmo com os 4 literais deste arquivo ainda válidos
 * no ambiente hoje (medido em 31/08/2026 — ver diagnóstico), este é o MESMO desenho frágil que
 * derrubou 24 testes de Compras quando `factories/solicitacao-compra.js` fixava
 * `'Renovação Contratual'`: um valor de cadastro hardcoded como default de factory quebra
 * silenciosamente no dia em que o cadastro do ambiente mudar. Os dois casos que consomem esta
 * factory (`sigajuri-consultivo.spec.js:52,84`) já declaravam a área explicitamente em
 * `overrides` antes desta correção — remover o default não muda o comportamento deles, só
 * elimina o risco para qualquer caso futuro que esqueça de declarar.
 * @param {Partial<SolicitacaoConsultivo>} [overrides]
 * @returns {SolicitacaoConsultivo}
 */
export function criarSolicitacaoConsultivo(overrides = {}) {
  const id = randomUUID().slice(0, 8);
  return {
    solicitacao: `${QA_PREFIX} ${faker.lorem.sentence({ min: 6, max: 12 })} ${id}`,
    observacoes: `${QA_PREFIX} ${faker.lorem.sentence({ min: 4, max: 8 })} ${id}`,
    ...overrides,
  };
}

/**
 * @typedef {Object} SolicitacaoContencioso
 * @property {string} [uf] sigla de uma opção da combo "UF"
 * @property {string} [responsavel] rótulo de uma opção da combo "Responsável pela Demanda"
 * @property {string} [tipoConsulta] rótulo de uma opção da combo "Tipo da Consulta"
 * @property {string} titulo texto livre do campo "Titulo Mensagem"
 * @property {string} descricao texto livre do campo "Descrição"
 */

/**
 * Não fixa `uf`/`responsavel`/`tipoConsulta` por padrão — mesmo motivo documentado em
 * `criarSolicitacaoConsultivo`: são valores de cadastro do SIGAJURI, não constantes que esta
 * factory deva decidir sozinha. `sigajuri-contencioso.spec.js:117` já declara os três
 * explicitamente (e PRECISA fazê-lo: o teste calcula `POOL_ESPERADO` a partir do `responsavel`
 * escolhido, então este é um caso "específico", não agnóstico).
 *
 * Genérico em `T` (em vez de `Partial<SolicitacaoContencioso>` simples) só para o `checkJs`
 * conseguir enxergar, no retorno, que `uf`/`responsavel`/`tipoConsulta` SÃO strings quando o
 * caller os passou em `overrides` — o que `SigajuriPage.preencherContencioso` exige. Não muda
 * nada em runtime, é puramente para o quality gate de tipos pegar um caller que esqueça de
 * declarar um dos três campos antes mesmo de rodar o teste.
 * @template {Partial<SolicitacaoContencioso>} T
 * @param {T} [overrides]
 * @returns {SolicitacaoContencioso & T}
 */
export function criarSolicitacaoContencioso(overrides = /** @type {T} */ ({})) {
  const id = randomUUID().slice(0, 8);
  return {
    titulo: `${QA_PREFIX} ${faker.lorem.words(5)} ${id}`,
    descricao: `${QA_PREFIX} ${faker.lorem.sentence({ min: 6, max: 12 })} ${id}`,
    ...overrides,
  };
}
