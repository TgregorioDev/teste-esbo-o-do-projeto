// @ts-check

/**
 * Massa/critérios do ciclo de Faturamento de Contratos (`wf_faturamento_contratos`).
 *
 * Diferente de `factories/solicitacao-compra.js`, este arquivo NÃO usa `faker`: investigação
 * em campo (ver `docs/mapa-do-ambiente.md` e o relatório da suíte) confirmou que TODOS os
 * campos preenchíveis pelo solicitante na etapa "Início" do Faturamento vêm de zooms do
 * Protheus (Fornecedor, Nº do Contrato, Competência, Filial da Medição, Nº da Planilha) ou
 * são auto-preenchidos/somente leitura assim que a cadeia de zooms resolve. Não há campo de
 * texto livre digitado pelo solicitante nesta etapa — logo não há dado fictício a gerar aqui.
 * (Os campos de texto livre da etapa seguinte — "Observações", quantidade, rateio — existem
 * no DOM mas ficam bloqueados por `controlField !== 'GRAVA_MED'` até a tarefa ser assumida
 * por quem consta como Fiscal/CSE do contrato no Protheus; ver relatório da suíte.)
 *
 * O que este arquivo fornece são as duas transformações puras que o ciclo de Faturamento
 * precisa e que SÃO testáveis isoladamente: extrair código+loja do fornecedor a partir do
 * texto que a grade do Portal de Acompanhamento de Contratos exibe, e decidir em que ordem
 * tentar as competências oferecidas pelo zoom até encontrar uma com saldo em aberto.
 */

/**
 * @typedef {{ codigo: string, loja: string }} FornecedorMedicao
 */

/**
 * Fornecedor designado para a massa do ciclo de Faturamento: **TOTVS S.A**
 * (código `53113791`, loja `0001`, CNPJ 53113791000122).
 *
 * ## Por que um fornecedor FIXO aqui
 *
 * A suíte evita depender de registro fixo (README) — mas este não é um contrato de negócio
 * arbitrário. É o fornecedor que o dono do ambiente indicou para exercitar o Faturamento manual
 * (11/09/2026), e é a própria TOTVS como fornecedora da Cassi. Neste tenant ele tem um contrato
 * vigente (medido: **00015-2026-5303**, filial 5303), então serve de ponto de partida
 * DETERMINÍSTICO. Não é ponto único de falha: `fornecedoresParaMedicao` faz os testes caírem para
 * contratos descobertos por dataset quando o TOTVS S.A não tiver competência com saldo aberto. E não
 * se fixa o NÚMERO do contrato nem valor nenhum — só o fornecedor, cujo cadastro é estável.
 *
 * ⚠️ Buscar "TOTVS SA" no zoom dá ZERO: o nome gravado é "TOTVS S.A", com ponto (medido). Por isso a
 * seleção é sempre por CÓDIGO+LOJA (`MedicaoContratoPage.selecionarFornecedorPorCodigoLoja`), nunca
 * por nome.
 *
 * @type {Readonly<FornecedorMedicao & { nome: string }>}
 */
export const FORNECEDOR_FATURAMENTO = Object.freeze({ codigo: '53113791', loja: '0001', nome: 'TOTVS S.A' });

/**
 * Ordem de tentativa dos fornecedores do Faturamento: o designado (TOTVS S.A) **primeiro**, depois os
 * descobertos por dataset — sem repetir o designado se ele reaparecer entre os descobertos.
 *
 * Função pura, para ser testada isolada (`unit/medicao.test.mjs`) e para manter a regra "TOTVS
 * primeiro" num lugar só, em vez de repetida em cada spec de faturamento.
 *
 * @param {FornecedorMedicao[]} [descobertos]
 * @returns {FornecedorMedicao[]}
 */
export function fornecedoresParaMedicao(descobertos = []) {
  const chave = (/** @type {FornecedorMedicao} */ f) => `${f.codigo}-${f.loja}`;
  const vistos = new Set([chave(FORNECEDOR_FATURAMENTO)]);
  /** @type {FornecedorMedicao[]} */
  const ordem = [{ codigo: FORNECEDOR_FATURAMENTO.codigo, loja: FORNECEDOR_FATURAMENTO.loja }];
  for (const f of descobertos) {
    if (!vistos.has(chave(f))) {
      vistos.add(chave(f));
      ordem.push(f);
    }
  }
  return ordem;
}

/**
 * A grade do Portal de Acompanhamento de Contratos exibe o fornecedor como
 * `"<código> - <loja>"` (ex.: `"05395624 - 0001"`) — confirmado em campo via
 * `AcompanhamentoContratosPage.lerLinhasDaGrade()`. O zoom "Fornecedor" do Faturamento,
 * por sua vez, busca por código/CNPJ/nome e devolve opções com CÓDIGO e LOJA separados.
 * Esta função faz a ponte entre as duas telas.
 *
 * @param {string} textoFornecedorDaGrade ex.: "05395624 - 0001"
 * @returns {{ codigo: string, loja: string }}
 */
export function parseFornecedorDaGrade(textoFornecedorDaGrade) {
  const partes = textoFornecedorDaGrade.split('-').map((p) => p.trim());
  const [codigo, loja] = partes;
  if (!codigo || !loja) {
    throw new Error(
      `Texto de fornecedor da grade em formato inesperado: "${textoFornecedorDaGrade}". ` +
        'Esperado "<código> - <loja>" (ex.: "05395624 - 0001").',
    );
  }
  return { codigo, loja };
}

/**
 * Ordem de tentativa das competências oferecidas pelo zoom "Competência do Contrato".
 *
 * Confirmado em campo: o zoom lista as competências em ordem cronológica crescente, e nem
 * toda competência ofertada tem saldo em aberto para medir — selecionar uma sem saldo (ou
 * com revisão do contrato pendente de aprovação) faz o Protheus devolver um erro síncrono
 * ("Não há planilha disponível... verifique... saldo, vigência e a existência de medições em
 * aberto", ou "Existe revisão pendente de aprovação para este contrato") ANTES de qualquer
 * envio — nenhuma medição é criada nessas tentativas.
 *
 * Não há oráculo para saber de antemão qual competência tem saldo (varia por contrato e mês,
 * e outras execuções desta suíte consomem saldo de medições em paralelo). A estratégia é
 * tentar um número limitado de competências, da mais antiga para a mais recente — é a mais
 * antiga que tende a estar "em aberto" para medir primeiro no fluxo real de faturamento — e
 * desistir com uma mensagem clara quando nenhuma das tentadas serviu, em vez de um timeout
 * ilegível.
 *
 * @param {string[]} competenciasOfertadas rótulos como "COMPETÊNCIA\n07-2025", na ordem em que o zoom os lista
 * @param {number} maxTentativas
 * @returns {string[]} subconjunto, na ordem em que devem ser tentados
 */
export function ordemDeTentativaDeCompetencias(competenciasOfertadas, maxTentativas = 6) {
  return competenciasOfertadas.slice(0, Math.max(0, maxTentativas));
}
