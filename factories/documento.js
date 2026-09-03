// @ts-check
import { fakerPT_BR as faker } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';

/**
 * Factory da massa usada nos testes de Documentos/GED.
 *
 * Composição obrigatória de todo dado gerado (ver docs/politica-de-escrita.md):
 *   faker.*       → realismo
 *   randomUUID    → unicidade (paralelismo sem colisão entre workers/repetições)
 *   QA_PREFIX     → rastreabilidade (identifica na base o que a automação escreveu)
 *
 * A seed do faker é fixada em `fixtures/fixtures.js` por execução **e** por teste
 * (`FAKER_SEED ^ hash32(identidade do teste)`) e anexada ao relatório: a massa de um teste não
 * depende do worker nem da ordem de despacho. Para repetir exatamente a mesma massa de um
 * teste, em qualquer número de workers:
 *   FAKER_SEED=<valor> npx playwright test <arquivo> -g "<título>"
 */

const QA_PREFIX = process.env.QA_DATA_PREFIX ?? 'QA';

/**
 * @typedef {Object} Documento
 * @property {string} descricao texto livre preenchido no campo "Descrição" do publicador ECM
 */

/**
 * Descrição de documento para o publicador de GED. Sem acentos/pontuação além de espaço e
 * hífen — o nome precisa sobreviver intacto a um `RegExp` de localização de linha na grade.
 *
 * @param {Partial<Documento>} [overrides] o que o teste VALIDA entra aqui, explícito
 * @returns {Documento}
 */
export function criarDocumento(overrides = {}) {
  const id = randomUUID().slice(0, 8);
  const assunto = faker.commerce.productName().replace(/[^\p{L}\p{N} ]/gu, '');
  return {
    descricao: `${QA_PREFIX} documento ${assunto} ${id}`,
    ...overrides,
  };
}

/**
 * @typedef {Object} NivelAprovacao
 * @property {string} nome nome do nível de aprovação criado ad hoc no upload (aba "Aprovação")
 */

/**
 * @param {Partial<NivelAprovacao>} [overrides]
 * @returns {NivelAprovacao}
 */
export function criarNivelAprovacao(overrides = {}) {
  const id = randomUUID().slice(0, 8);
  return {
    nome: `${QA_PREFIX} nivel ${id}`,
    ...overrides,
  };
}
