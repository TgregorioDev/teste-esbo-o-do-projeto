// @ts-check
import { fakerPT_BR as faker } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';

/**
 * Factory da massa preenchida no modal de Solicitação de Compra.
 *
 * Composição obrigatória de todo dado gerado:
 *   faker.*       → realismo (acentuação e tamanho de texto como em produção)
 *   randomUUID    → unicidade (paralelismo sem colisão entre workers)
 *   QA_PREFIX     → rastreabilidade (identifica na base o que a automação escreveu)
 *
 * Não há e-mail nem documento neste formulário — o que o usuário digita é justificativa,
 * data de necessidade e tipo. Nada aqui é dado de pessoa real.
 *
 * A seed do faker é fixada em `fixtures/fixtures.js` e anexada ao relatório.
 * Para repetir exatamente a mesma massa: FAKER_SEED=<valor> npx playwright test
 */

const QA_PREFIX = process.env.QA_DATA_PREFIX ?? 'QA';

/** Tipos oferecidos pelo campo "Tipo de Solicitação" do modal. */
export const TIPO_SOLICITACAO = {
  PLACEHOLDER: 'Selecione...',
  ADITIVO: 'Aditivo Contratual',
  NOVA_CONTRATACAO: 'Nova Contratação',
};

/**
 * ⚠️ `RENOVACAO: 'Renovação Contratual'` foi REMOVIDO daqui em 28/08/2026.
 *
 * O ambiente deixou de oferecer essa opção no combo "Tipo de Solicitação" — hoje ele serve
 * apenas `Selecione...`, `Aditivo Contratual` e `Nova Contratação` (medido). Como era o valor
 * DEFAULT da factory, todo teste que preenchia o modal pedia ao Playwright uma opção
 * inexistente: `selectOption({ label })` ficava 45s esperando e reprovava com
 * `TimeoutError: locator.selectOption` — um timeout opaco que não dizia a causa.
 *
 * Foram ~20 testes reprovando por isso, em `acompanhamento-contratos`, sem nenhuma pista de
 * que a lista de tipos tinha mudado. O único que apontou a causa foi
 * `modal-solicitacao-compra.spec.js`, que afirma a lista de opções — e é por isso que esse
 * tipo de assertion vale a pena.
 *
 * `Nova Contratação` entrou na lista no mesmo período. Se a remoção de "Renovação Contratual"
 * NÃO for intencional, é achado a levar ao time — está registrado nas divergências do README.
 */

/**
 * @typedef {Object} SolicitacaoCompra
 * @property {string} tipo          valor do combo "Tipo de Solicitação"
 * @property {string} motivo        justificativa da solicitação (texto livre)
 * @property {string} dataNecessidade data em ISO (aaaa-mm-dd) — o campo do modal é
 *                                    `<input type="date">`, que só aceita esse formato
 */

/**
 * @param {Partial<SolicitacaoCompra>} [overrides] o que o teste VALIDA entra aqui, explícito
 * @returns {SolicitacaoCompra}
 */
export function criarSolicitacaoCompra(overrides = {}) {
  const id = randomUUID().slice(0, 8);

  return {
    tipo: TIPO_SOLICITACAO.ADITIVO,
    motivo: `${QA_PREFIX} ${faker.company.catchPhrase()} ${id}`,
    dataNecessidade: dataFutura(30),
    ...overrides,
  };
}

/**
 * Data de necessidade precisa ser futura para a regra de negócio aceitar, então é
 * calculada — não sorteada. `faker.date.*` sem `refDate` não respeita a seed, e uma data
 * aleatória poderia cair no passado e fazer o teste falhar por motivo errado.
 *
 * O campo é um `<input type="date">`: aceita exclusivamente o formato ISO. Preencher em
 * dd/mm/aaaa devolve "Malformed value" e o teste falharia por motivo errado.
 *
 * @param {number} dias quantos dias à frente de hoje
 * @returns {string} aaaa-mm-dd
 */
export function dataFutura(dias) {
  const data = new Date();
  data.setDate(data.getDate() + dias);

  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}
