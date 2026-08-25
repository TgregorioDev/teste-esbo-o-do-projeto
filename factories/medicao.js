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
