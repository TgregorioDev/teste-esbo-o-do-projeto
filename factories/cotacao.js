// @ts-check
import { fakerPT_BR as faker } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';

/**
 * Massa fictícia para os textos livres dos formulários de Cotação, Negociação e Parecer
 * Técnico.
 *
 * Mesma composição obrigatória das demais factories do projeto:
 *   faker.*       → realismo
 *   randomUUID    → unicidade (paralelismo sem colisão entre workers)
 *   QA_PREFIX     → rastreabilidade do que a automação escreveu
 *
 * A seed do faker é fixada em `fixtures/fixtures.js` e anexada ao relatório.
 */

const QA_PREFIX = process.env.QA_DATA_PREFIX ?? 'QA';

/**
 * @param {string} contexto rótulo curto do campo, só para tornar o texto legível no relatório
 * @returns {string}
 */
function textoLivre(contexto) {
  const id = randomUUID().slice(0, 8);
  return `${QA_PREFIX} ${contexto}: ${faker.lorem.sentence({ min: 6, max: 12 })} (${id})`;
}

/**
 * Justificativa livre para a decisão (Aprovar/Reprovar, Validar/Não Validar) em Negociação
 * e Parecer Técnico.
 * @param {string} [contexto]
 * @returns {string}
 */
export function criarJustificativaDecisao(contexto = 'decisão') {
  return textoLivre(contexto);
}

/**
 * Observação livre do item "5. Parecer" do formulário de Parecer Técnico — o único texto
 * livre realmente visível/editável dessa tela (ver `pages/ParecerTecnicoPage.js`).
 * @param {string} [contexto]
 * @returns {string}
 */
export function criarObservacaoParecerTecnico(contexto = 'parecer técnico') {
  return textoLivre(contexto);
}
