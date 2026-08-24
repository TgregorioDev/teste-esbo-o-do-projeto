// @ts-check

/**
 * Descoberta de massa de contratos em tempo de execução.
 *
 * ## Por que isto existe
 *
 * Contrato não é dado que a automação possa criar: nasce no Protheus, por processo de negócio
 * que esta suíte está proibida de executar. Então a regra "cada teste monta seu próprio
 * pré-requisito" não é alcançável aqui — contrato é pré-condição de LEITURA.
 *
 * O que É alcançável, e o que este módulo resolve, é não depender de um NÚMERO FIXO. Fixar
 * `CONTRATO=000000000000010` em variável de ambiente cria duas fragilidades:
 *
 * 1. O contrato some do escopo do teste quando alguém o finaliza, cancela ou revisa — e aí
 *    dezenas de testes ficam vermelhos por motivo que não é defeito do produto.
 * 2. A falha resultante é ilegível: um timeout esperando o filtro da grade não diz
 *    "faltou massa", e quem lê o relatório confunde com defeito.
 *
 * Aqui o teste declara a CARACTERÍSTICA de que precisa (contrato vigente, de filial diferente
 * de outro, etc.) e a suíte escolhe da grade um que sirva. O determinismo é preservado porque
 * o comportamento validado é o mesmo — muda o registro, não a regra. As assertions dos testes
 * são relacionais (o payload deve corresponder AO CONTRATO ESCOLHIDO), nunca presas a um valor
 * absoluto de um contrato específico.
 */

/**
 * Situação que a grade exibe por extenso para contrato vigente.
 * As demais situações saem truncadas (defeito D-08), então filtrar por esta é o único
 * critério confiável hoje — e é justamente a que interessa para abrir Solicitação de Compra.
 */
const SITUACAO_VIGENTE = 'Vigente';

/**
 * @typedef {import('../pages/AcompanhamentoContratosPage.js').AcompanhamentoContratosPage} PortalContratos
 * @typedef {Object} CriterioDeContrato
 * @property {string} [filialDiferenteDe] exige filial distinta da informada
 * @property {string} [tipoDiferenteDe] exige tipo de contrato distinto do informado
 * @property {string[]} [excluirContratos] números a não escolher
 */

/**
 * Escolhe um contrato vigente da grade que satisfaça o critério.
 *
 * Falha com mensagem explícita quando não há massa — separando "o ambiente não tem contrato"
 * de "o produto está quebrado", que é a distinção que o relatório precisa deixar clara.
 *
 * @param {PortalContratos} contratosPage portal já carregado (`expectCarregada` executado)
 * @param {CriterioDeContrato} [criterio]
 * @returns {Promise<import('../pages/AcompanhamentoContratosPage.js').LinhaDeContrato>}
 */
export async function descobrirContratoVigente(contratosPage, criterio = {}) {
  const linhas = await contratosPage.lerLinhasDaGrade();

  if (linhas.length === 0) {
    throw new Error(
      'PRÉ-CONDIÇÃO AUSENTE: a grade de contratos não retornou nenhuma linha. ' +
        'A integração com o Protheus está indisponível ou sem dados — isto NÃO é defeito do ' +
        'produto sob teste nem falha da automação. Confirme que o portal lista contratos ' +
        'antes de interpretar este resultado.',
    );
  }

  const vigentes = linhas.filter((l) => l.status === SITUACAO_VIGENTE);

  if (vigentes.length === 0) {
    throw new Error(
      `PRÉ-CONDIÇÃO AUSENTE: a grade trouxe ${linhas.length} contrato(s), mas nenhum vigente. ` +
        `Situações presentes: ${[...new Set(linhas.map((l) => l.status))].join(', ')}. ` +
        'Solicitação de Compra só faz sentido a partir de contrato vigente.',
    );
  }

  const excluir = new Set(criterio.excluirContratos ?? []);
  const escolhido = vigentes.find(
    (l) =>
      !excluir.has(l.contrato) &&
      (criterio.filialDiferenteDe === undefined || l.filial !== criterio.filialDiferenteDe) &&
      (criterio.tipoDiferenteDe === undefined || l.tipo !== criterio.tipoDiferenteDe),
  );

  if (!escolhido) {
    throw new Error(
      `PRÉ-CONDIÇÃO AUSENTE: nenhum contrato vigente satisfaz o critério ` +
        `${JSON.stringify(criterio)} entre os ${vigentes.length} disponíveis. ` +
        'A base mudou de perfil — reavalie o critério do teste.',
    );
  }

  return escolhido;
}

/**
 * Escolhe dois contratos vigentes de filiais diferentes.
 *
 * Serve aos casos que comparam contratos entre si — por exemplo, provar que um campo deveria
 * refletir o contrato de origem e não vir fixo para todos.
 *
 * @param {PortalContratos} contratosPage
 * @returns {Promise<[import('../pages/AcompanhamentoContratosPage.js').LinhaDeContrato, import('../pages/AcompanhamentoContratosPage.js').LinhaDeContrato]>}
 */
export async function descobrirDoisContratosDeFiliaisDiferentes(contratosPage) {
  const primeiro = await descobrirContratoVigente(contratosPage);
  const segundo = await descobrirContratoVigente(contratosPage, {
    filialDiferenteDe: primeiro.filial,
    excluirContratos: [primeiro.contrato],
  });

  return [primeiro, segundo];
}
