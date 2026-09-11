// @ts-check

/**
 * Personas da suíte — os perfis de negócio que o backlog precisa e a conta única não cobre.
 *
 * ## Por que existe
 *
 * Quatro perfis represam a maior parte dos casos sem teste (etapa 5 de
 * `docs/plano-de-evolucao-2026-09-11.md`): comprador (pedido E2), fiscal, CSE e gestor de alçada (E4).
 * A conta única de automação não substitui nenhum deles — o Fluig atribui essas tarefas à PESSOA, e o
 * "Atuar como" só delega filas do Portal do Comprador. Enquanto as contas não existem, o teste que
 * precisa de uma persona declara PRÉ-CONDIÇÃO dizendo qual credencial falta e qual pedido a destrava —
 * nunca skip.
 *
 * ## Como se liga uma persona
 *
 * As duas variáveis dela em `.env.test` (localmente) ou como segredo do CI. O `globalSetup` autentica
 * cada persona que tiver credencial e grava o `storageState` dela; a fixture `persona(nome)` abre um
 * contexto com essa sessão.
 *
 * `compras` é a conta atual (`QA_USERNAME`): está no catálogo para que o mecanismo inteiro seja
 * exercitado hoje, com uma conta que existe.
 *
 * O Portal do Fornecedor autentica por CNPJ/CPF e senha próprios, fora da plataforma — não é persona de
 * `storageState` e fica fora daqui (`pages/AcessoFornecedorPage.js`).
 */

/** `storageState` da conta principal, gravado pelo `globalSetup`. */
export const ARQUIVO_AUTENTICACAO = 'playwright/.auth/usuario.json';

/**
 * @typedef {Object} Persona
 * @property {string} descricao o papel de negócio, como aparece na mensagem de pré-condição
 * @property {string} variavelUsuario
 * @property {string} variavelSenha
 * @property {string} [pedido] pedido externo do plano de evolução que destrava a credencial
 */

/** @type {Record<string, Persona>} */
export const PERSONAS = {
  compras: {
    descricao: 'conta de automação de Compras e Contratos (a conta atual)',
    variavelUsuario: 'QA_USERNAME',
    variavelSenha: 'QA_PASSWORD',
  },
  comprador: {
    descricao: 'comprador cadastrado na SY1 (Y1_USER) — filas de cotação do Portal do Comprador',
    variavelUsuario: 'QA_COMPRADOR_USERNAME',
    variavelSenha: 'QA_COMPRADOR_PASSWORD',
    pedido: 'E2',
  },
  fiscal: {
    descricao: 'fiscal de contrato — "Realizar Medição do Contrato" e validação do fiscal',
    variavelUsuario: 'QA_FISCAL_USERNAME',
    variavelSenha: 'QA_FISCAL_PASSWORD',
    pedido: 'E4',
  },
  cse: {
    descricao: 'aprovador CSE — Validação CSE e Validação da Medição CSE',
    variavelUsuario: 'QA_CSE_USERNAME',
    variavelSenha: 'QA_CSE_PASSWORD',
    pedido: 'E4',
  },
  gestorAlcada: {
    descricao: 'gestor de alçada (AL/DHL) — Aprovação de Alçadas',
    variavelUsuario: 'QA_GESTOR_ALCADA_USERNAME',
    variavelSenha: 'QA_GESTOR_ALCADA_PASSWORD',
    pedido: 'E4',
  },
};

/**
 * `storageState` da persona. `compras` reaproveita o da conta principal.
 * @param {string} nome
 * @returns {string}
 */
export function arquivoDaPersona(nome) {
  return nome === 'compras' ? ARQUIVO_AUTENTICACAO : `playwright/.auth/persona-${nome}.json`;
}

/**
 * Onde o `globalSetup` registra por que o login da persona falhou.
 * @param {string} nome
 * @returns {string}
 */
export function arquivoDeErroDaPersona(nome) {
  return `playwright/.auth/persona-${nome}.erro.txt`;
}

/**
 * Credencial da persona, ou `null` quando falta alguma das duas variáveis. No CI, segredo inexistente
 * chega como texto vazio — e conta como ausente.
 * @param {string} nome
 * @returns {{ usuario: string, senha: string } | null}
 */
export function credencialDaPersona(nome) {
  const definicao = PERSONAS[nome];
  if (!definicao) return null;
  const usuario = (process.env[definicao.variavelUsuario] ?? '').trim();
  const senha = process.env[definicao.variavelSenha] ?? '';
  return usuario && senha ? { usuario, senha } : null;
}
