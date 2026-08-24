// @ts-check

/**
 * Configuração de ambiente.
 *
 * Toda variável obrigatória falha explicitamente quando ausente, em vez de propagar
 * `undefined` e produzir uma falha confusa lá na assertion.
 *
 * Segredos e identificadores do cliente vivem apenas em `.env.test` (fora do versionamento).
 */

/**
 * @param {string} nome
 * @returns {string}
 */
export function envObrigatoria(nome) {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Variável de ambiente obrigatória não definida: ${nome}`);
  return valor;
}

/** Endpoint único por onde o Fluig executa TODO dataset (interno e customizado). */
export const ROTA_DATASET = '**/api/public/ecm/dataset/datasets';

/** Rota da página do Portal de Acompanhamento de Contratos. */
export const ROTA_PORTAL_CONTRATOS = '/portal/p/1/acompanhamentoContrato';

/** Título da Home após autenticação — o Fluig serve o login na MESMA URL da home. */
export const TITULO_HOME = 'Cassi - Fluig Plataforma - Home';

/** Título servido enquanto não há sessão autenticada. */
export const TITULO_LOGIN = 'Login';

/**
 * Datasets que o portal consome. Nomes confirmados em observação de rede no ambiente.
 * Usados para interceptação nos cenários de erro/permissão.
 */
export const DATASET = {
  /** Grupos do usuário — governa o acesso ao painel. */
  GRUPOS_DO_USUARIO: 'colleagueGroup',
  /** Grade de contratos do portal. */
  CONTRATOS: 'dsProtheus_getContratosxFornecedores_restGet',
  /** Filial do contrato, consultada ao abrir a Solicitação de Compra. */
  FILIAL: 'dsProtheus_getBranches_restGetAll',
  /** Itens da planilha do contrato, base dos itens da Solicitação de Compra. */
  ITENS_PLANILHA: 'dsProtheus_getItensPlanilha_restGetAll',
};
