// @ts-check
import { fakerPT_BR as faker } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';

/**
 * Payload de **semeadura** de Solicitação de Compras — a massa que a base de DEV não tem.
 *
 * ## Por que existe (e por que não é o mesmo que a factory do modal)
 *
 * `factories/solicitacao-compra.js` descreve o que uma PESSOA digita no modal: tipo,
 * justificativa e data de necessidade. Esta aqui descreve o corpo COMPLETO que o widget monta
 * e envia para `POST /process-management/api/v2/processes/wf_solicitacao_compras/start` — os
 * ~40 campos que o motor precisa para a SC nascer e andar, incluindo o item e o rateio.
 *
 * Ela existe porque o formulário do portal **não é confiável neste ambiente**: ele depende do
 * dataset `ds_protheus_getMatriculaTitular_rest`, que hoje responde HTTP 500
 * (`WFLYEJB0054: Failed to marshal EJB parameters`), e por isso exibe a faixa
 * *"Não foi possível estabelecer comunicação com o ERP"*. Semear pela API contorna a tela e
 * não contorna nenhuma regra: a SC criada é uma SC normal, percorre o mesmo BPMN e cai nos
 * mesmos pools. Ver `docs/massa-de-dados-no-ambiente-dev.md`.
 *
 * ## De onde vieram os códigos do ERP
 *
 * Do formulário da SC **95753** desta mesma base — uma solicitação real de 03/07/2026 que
 * percorreu o fluxo inteiro até "Em Cotação", lida com
 * `GET /process-management/api/v2/requests/95753?expand=formFields`. Produto,
 * grupo de estoque, contas contábeis, classe de valor e centro de custo são códigos que o
 * Protheus desta base reconhece — inventá-los faria a integração recusar a SC por motivo
 * errado, e o teste mediria a invenção, não o produto.
 *
 * O que varia por semeadura (quantidade, preço, marca de rastreio) vem do faker + `randomUUID`,
 * na mesma composição das demais factories: realismo + unicidade + rastreabilidade `QA`.
 *
 * ## Coerência interna
 *
 * `tbprod_valorTotal___1` é SEMPRE `quantidade × preço unitário`, formatado em pt-BR. A suíte
 * afirma essa coerência em outros testes (não há oráculo externo para valor); massa que
 * nascesse incoerente transformaria um teste verde em falso vermelho.
 */

const QA_PREFIX = process.env.QA_DATA_PREFIX ?? 'QA';

/**
 * Filial e item de referência, colhidos da SC 95753 desta base. Não são "dados de teste
 * inventados": são chaves de cadastro do ERP, e é justamente por serem reais que a SC anda.
 */
const REFERENCIA = {
  codEmpresa: '01',
  codFilial: '5303',
  cgcFilial: '33719485000127',
  nomeFilial: 'CASSI SEDE',
  produto: {
    codigo: '02000777',
    descricao: 'PAPEL A4 BRANCO (PACOTE 500 FOLHAS)',
    undMedida: 'PA',
    grupoEstoque: '4040',
    descGrupEstoque: 'MATERIAIS DE EXPEDIENTE',
    armazemPadrao: '01',
    classificacao: 'Outros',
    classeOrca: '441097,463024',
    contaDespADM: '463919011006',
    contaDespBAS: '441319019091',
    aprovResp: '004445',
  },
  rateio: {
    codClasseVlr: 'AD00',
    descClasseVlr: 'ADMINISTRATIVO',
    codCCusto: '9423',
    descCCusto: 'DIV. COMPRAS E CONTRATAÇÕES',
  },
};

/**
 * Formata número no padrão que o formulário do Fluig grava (pt-BR).
 * @param {number} valor
 * @param {number} casas
 * @returns {string}
 */
function numeroBR(valor, casas) {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/**
 * @typedef {Object} MassaSolicitacaoCompra
 * @property {string} marca identificador único desta semeadura (`QA-MASSA-xxxxxxxx`)
 * @property {Record<string, string>} formFields corpo `formFields` do `/start`
 */

/**
 * Monta uma solicitação de compra semeável, com marca de rastreio própria.
 *
 * @param {{ quantidade?: number, precoUnitario?: number, solicitante?: { nome: string, matricula: string, email: string } }} [overrides]
 *   o que o chamador precisa fixar entra aqui, explícito. Omitido, o faker decide.
 * @returns {MassaSolicitacaoCompra}
 */
export function criarMassaSolicitacaoCompra(overrides = {}) {
  const marca = `${QA_PREFIX}-MASSA-${randomUUID().slice(0, 8)}`;
  const hoje = new Date().toISOString().slice(0, 10);
  const hora = new Date().toTimeString().slice(0, 8);

  const quantidade = overrides.quantidade ?? faker.number.int({ min: 10, max: 900 });
  const precoUnitario = overrides.precoUnitario ?? faker.number.float({ min: 5, max: 400, fractionDigits: 6 });
  const total = quantidade * precoUnitario;

  const solicitante = overrides.solicitante ?? {
    nome: 'Usuário TBC (TOTVS)',
    matricula: 'TOTVS-FS',
    email: 'fabricasoftware@totvs.com.br',
  };

  const p = REFERENCIA.produto;
  const r = REFERENCIA.rateio;

  const rateio = [
    {
      tbRatCC_idxMaster___1_1: '1',
      tbRatCC_index___1_1: '1',
      tbRatCC_codCtaContabil___1_1: '    ',
      tbRatCC_descCtaContabil___1_1: '    ',
      tbRatCC_codItemConta___1_1: '    ',
      tbRatCC_descItemConta___1_1: '    ',
      tbRatCC_codClasseVlr___1_1: r.codClasseVlr,
      tbRatCC_descClasseVlr___1_1: r.descClasseVlr,
      tbRatCC_codCCusto___1_1: r.codCCusto,
      tbRatCC_descCCusto___1_1: r.descCCusto,
      tbRatCC_item___1_1: '0001',
      tbRatCC_Rateio___1_1: '100',
      tbRatCC_classeValor___1_1: `${r.codClasseVlr} - ${r.descClasseVlr}`,
      tbRatCC_centroCusto___1_1: `${r.codCCusto} - ${r.descCCusto}`,
    },
  ];

  return {
    marca,
    formFields: {
      // Identificação do processo/solicitante
      usuarioSolicitante: solicitante.nome,
      matriculaSolicitante: solicitante.matricula,
      emailSolicitante: solicitante.email,
      dataSolicitacao: hoje,
      horaSolicitacao: hora,

      // Identificação da entidade/solicitação
      codEmpresa: REFERENCIA.codEmpresa,
      codFilial: REFERENCIA.codFilial,
      cgcFilial: REFERENCIA.cgcFilial,
      zoomNomeFilial: REFERENCIA.nomeFilial,
      zoomCodNomeFilial: `${REFERENCIA.codFilial} - ${REFERENCIA.nomeFilial}`,
      dtEmissaoSolCompra: hoje,
      tipoSolicitacao: 'Nova Contratação',
      motivoSolCompra: `${marca} — massa de dados da automação de testes (base de DEV). ${faker.company.catchPhrase()}`,
      nrContrato: '',
      gerarParecer: 'Solicitante',
      distribuicaoManual: 'Sim',

      // Item 1
      tbprod_index___1: '1',
      tbprod_item___1: '0001',
      tbprod_codigo___1: p.codigo,
      tbprod_descricao___1: p.descricao,
      tbprod_produtServico___1: `${p.codigo} - ${p.descricao}`,
      tbprod_undMedida___1: p.undMedida,
      tbprod_grupoEstoque___1: p.grupoEstoque,
      tbprod_descGrupEstoque___1: p.descGrupEstoque,
      tbprod_grupoProduto___1: `${p.grupoEstoque} - ${p.descGrupEstoque}`,
      tbprod_armazemPadrao___1: p.armazemPadrao,
      tbprod_classificacao___1: p.classificacao,
      tbprod_classeOrca___1: p.classeOrca,
      tbprod_contaDespADM___1: p.contaDespADM,
      tbprod_contaDespBAS___1: p.contaDespBAS,
      tbprod_contaImobilizado___1: '',
      tbprod_aprovResp___1: p.aprovResp,
      tbprod_dtEmissao___1: hoje,
      tbprod_dtNecessidade___1: hoje,
      tbprod_quantidade___1: numeroBR(quantidade, 6),
      tbprod_precoUnitario___1: numeroBR(precoUnitario, 6),
      tbprod_valorTotal___1: numeroBR(total, 2),
      tbprod_mediaHistorica___1: numeroBR(0, 6),
      tbprod_observacao___1: marca,
      tbprod_jsonrateio___1: JSON.stringify(rateio),
    },
  };
}
