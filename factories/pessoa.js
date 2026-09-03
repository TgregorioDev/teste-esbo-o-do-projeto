// @ts-check
import { fakerPT_BR as faker } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';

/**
 * Factories de massa fictícia de PESSOA para os processos de RH — Gestão de Dependentes,
 * Substituição de Cargos e Automação de Admissão.
 *
 * Composição obrigatória de todo dado gerado (igual a `factories/solicitacao-compra.js`):
 *   faker.*       → realismo (nome, data, texto como em produção)
 *   randomUUID    → unicidade (paralelismo sem colisão entre workers)
 *   QA_PREFIX     → rastreabilidade (identifica na base o que a automação escreveu)
 *
 * Nenhum dado aqui é de pessoa real — CPF incluso: `generateCpf()` produz um número com
 * dígitos verificadores VÁLIDOS (passa na validação de formulário) sorteado a partir da
 * seed do faker, nunca dirigido a coincidir com um documento existente.
 *
 * A seed do faker é fixada em `fixtures/fixtures.js` por execução **e** por teste
 * (`FAKER_SEED ^ hash32(identidade do teste)`) e anexada ao relatório: a massa de um teste não
 * depende do worker nem da ordem de despacho. Para repetir exatamente a mesma massa de um
 * teste, em qualquer número de workers:
 *   FAKER_SEED=<valor> npx playwright test <arquivo> -g "<título>"
 */

const QA_PREFIX = process.env.QA_DATA_PREFIX ?? 'QA';

/** Graus de parentesco oferecidos nos formulários de RH observados no ambiente. */
export const GRAU_PARENTESCO = {
  CONJUGE: 'Cônjuge',
  FILHO: 'Filho(a)',
  PAI_MAE: 'Pai/Mãe',
  ENTEADO: 'Enteado(a)',
};

/** Tipos de dependência do formulário de Gestão de Dependentes. */
export const TIPO_DEPENDENCIA = {
  IMPOSTO_RENDA: 'Imposto de Renda',
  PLANO_SAUDE: 'Plano de Saúde',
  SALARIO_FAMILIA: 'Salário Família',
};

/**
 * @typedef {Object} Dependente
 * @property {string} nome            nome completo fictício, prefixado QA e sufixado com id único
 * @property {string} cpf             11 dígitos SEM máscara, dígitos verificadores válidos
 * @property {string} dataNascimento  aaaa-mm-dd — campo observado como `<input type="date">`
 * @property {'Masculino'|'Feminino'} sexo
 * @property {string} grauParentesco
 * @property {string[]} tiposDependencia
 * @property {string} plano
 */

/**
 * @param {Partial<Dependente>} [overrides] o que o teste VALIDA entra aqui, explícito
 * @returns {Dependente}
 */
export function criarDependente(overrides = {}) {
  const id = randomUUID().slice(0, 8);
  const sexo = faker.person.sexType() === 'male' ? 'Masculino' : 'Feminino';

  return {
    nome: `${QA_PREFIX} ${faker.person.fullName({ sex: sexo === 'Masculino' ? 'male' : 'female' })} ${id}`,
    cpf: generateCpf(),
    dataNascimento: dataNascimentoFicticia(),
    sexo,
    grauParentesco: GRAU_PARENTESCO.FILHO,
    tiposDependencia: [TIPO_DEPENDENCIA.IMPOSTO_RENDA],
    plano: `${QA_PREFIX} Plano Standard ${id}`,
    ...overrides,
  };
}

/**
 * @typedef {Object} Substituto
 * @property {string} nome         nome completo fictício, prefixado QA e sufixado com id único
 * @property {string} matricula    matrícula fictícia numérica, sufixo único garante não-colisão
 * @property {string} dataInicio   aaaa-mm-dd — início do período de substituição
 * @property {string} dataFim      aaaa-mm-dd — fim do período de substituição
 * @property {string} motivo       justificativa da substituição
 */

/**
 * @param {Partial<Substituto>} [overrides]
 * @returns {Substituto}
 */
export function criarSubstituto(overrides = {}) {
  const id = randomUUID().slice(0, 8);

  return {
    nome: `${QA_PREFIX} ${faker.person.fullName()} ${id}`,
    matricula: String(faker.number.int({ min: 100000, max: 999999 })),
    dataInicio: dataFutura(7),
    dataFim: dataFutura(37),
    motivo: `${QA_PREFIX} ${faker.company.catchPhrase()} ${id}`,
    ...overrides,
  };
}

/**
 * @typedef {Object} Admitido
 * @property {string} nome          nome completo fictício, prefixado QA e sufixado com id único
 * @property {string} cpf           11 dígitos SEM máscara, dígitos verificadores válidos
 * @property {string} cargo         cargo fictício
 * @property {string} dataAdmissao  aaaa-mm-dd — data de admissão, sempre futura
 * @property {string} email         e-mail fictício, domínio reservado `example.test`
 */

/**
 * @param {Partial<Admitido>} [overrides]
 * @returns {Admitido}
 */
export function criarAdmitido(overrides = {}) {
  const id = randomUUID().slice(0, 8);
  const primeiroNome = slug(faker.person.firstName());

  return {
    nome: `${QA_PREFIX} ${faker.person.fullName()} ${id}`,
    cpf: generateCpf(),
    cargo: `${QA_PREFIX} ${faker.person.jobTitle()}`,
    dataAdmissao: dataFutura(15),
    email: `${primeiroNome}.${id}@example.test`,
    ...overrides,
  };
}

/**
 * CPF fictício com dígitos verificadores VÁLIDOS — passa na validação da aplicação sem
 * nunca coincidir com o documento de uma pessoa real de forma dirigida. Usa `faker.number`
 * para que a seed reproduza sempre o mesmo documento.
 *
 * Réplica do helper de mesmo nome documentado em
 * `references/templates/factory.js` da skill playwright-test-creator.
 *
 * @returns {string} 11 dígitos, sem máscara
 */
export function generateCpf() {
  /** @type {number[]} */
  const digits = Array.from({ length: 9 }, () => faker.number.int({ min: 0, max: 9 }));

  digits.push(checkDigit(digits, 10));
  digits.push(checkDigit(digits, 11));

  return digits.join('');
}

/**
 * @param {number[]} digits
 * @param {number} startWeight
 * @returns {number}
 */
function checkDigit(digits, startWeight) {
  const sum = digits.reduce((total, digit, index) => total + digit * (startWeight - index), 0);
  const remainder = 11 - (sum % 11);
  return remainder >= 10 ? 0 : remainder;
}

/**
 * Data de nascimento fictícia de um adulto (18 a 50 anos) — calculada a partir de hoje para
 * que a seed reproduza sempre a mesma data e para nunca cair no futuro, o que a maioria das
 * validações de formulário de RH rejeitaria.
 *
 * O campo observado é um `<input type="date">`: aceita exclusivamente o formato ISO.
 *
 * @returns {string} aaaa-mm-dd
 */
function dataNascimentoFicticia() {
  const idade = faker.number.int({ min: 18, max: 50 });
  const data = new Date();
  data.setFullYear(data.getFullYear() - idade);
  data.setMonth(faker.number.int({ min: 0, max: 11 }));
  data.setDate(faker.number.int({ min: 1, max: 28 }));

  return formatarISO(data);
}

/**
 * Data futura calculada — não sorteada — pelo mesmo motivo documentado em
 * `factories/solicitacao-compra.js`: `faker.date.*` sem `refDate` não respeita a seed, e uma
 * data aleatória poderia cair no passado e derrubar o teste por motivo errado.
 *
 * @param {number} dias quantos dias à frente de hoje
 * @returns {string} aaaa-mm-dd
 */
export function dataFutura(dias) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return formatarISO(data);
}

/**
 * @param {Date} data
 * @returns {string} aaaa-mm-dd
 */
function formatarISO(data) {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/**
 * Normaliza para uso em e-mail: sem acento, minúsculo, só letras.
 * @param {string} value
 * @returns {string}
 */
function slug(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}
