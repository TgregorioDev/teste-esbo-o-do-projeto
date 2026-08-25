// @ts-check
import { fakerPT_BR as faker } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';

/**
 * Factory da massa preenchida no formulário CLÁSSICO de Solicitação de Compras
 * (`pages/FormularioSolicitacaoCompraPage.js`, iniciado por
 * `pageworkflowview?processID=wf_solicitacao_compras`).
 *
 * Este formulário é um ponto de entrada DIFERENTE do modal do Portal de Acompanhamento de
 * Contratos (que já tem `factories/solicitacao-compra.js`): aqui o produto, a filial e o
 * rateio são escolhidos em tempo de tela a partir de combos alimentados pelo Protheus — não
 * há contrato de origem. Por isso esta factory cobre um formato de massa diferente:
 * identificação de produto/filial (texto fixo, correspondente a um cadastro real do
 * Protheus — não é dado fictício, é a CHAVE de busca no combo) e os campos numéricos que a
 * automação de fato inventa (quantidade, preço, observação, justificativa).
 *
 * Composição obrigatória de todo texto livre gerado:
 *   faker.*       → realismo
 *   randomUUID    → unicidade (paralelismo sem colisão entre workers)
 *   QA_PREFIX     → rastreabilidade
 *
 * A seed do faker é fixada em `fixtures/fixtures.js` e anexada ao relatório.
 */

const QA_PREFIX = process.env.QA_DATA_PREFIX ?? 'QA';

/**
 * Filial confirmada em campo (`docs/mapa-do-ambiente.md` / investigação desta suíte):
 * "5303 - CASSI SEDE" é sempre a primeira/mais estável opção do combo "Nome da Filial" do
 * formulário clássico — não depende de contrato nem de massa de Acompanhamento de Contratos.
 */
export const FILIAL_PADRAO = {
  termoBusca: 'CASSI SEDE',
  opcaoEsperada: /5303\s*-\s*CASSI SEDE/,
  codigo: '5303',
};

/**
 * Produto confirmado em campo no combo "Produto/Serviço" do formulário clássico —
 * cadastro real do Protheus (SB1), não massa fictícia. Escolhido por não depender de
 * contrato e por ter valores auxiliares (Unidade de Medida, Grupo, Classe Orçamentária)
 * sempre preenchidos automaticamente ao ser selecionado.
 */
export const PRODUTO_PADRAO = {
  termoBusca: 'AR CONDICIONADO DE JANELA',
  opcaoEsperada: /00000003\s*-\s*AR CONDICIONADO DE JANELA/,
  codigo: '00000003',
};

/**
 * @typedef {Object} ProdutoCompra
 * @property {string} filialTermoBusca      termo digitado no combo "Nome da Filial"
 * @property {RegExp} filialOpcaoEsperada    padrão da opção a selecionar no combo
 * @property {string} produtoTermoBusca     termo digitado no combo "Produto/Serviço"
 * @property {RegExp} produtoOpcaoEsperada   padrão da opção a selecionar no combo
 * @property {string} justificativa         texto livre do bloco "Identificação da Entidade"
 * @property {string} dataEmissao           dd/mm/aaaa — Data de Emissão (nível solicitação)
 * @property {string} dataNecessidade       dd/mm/aaaa — Data de Necessidade (nível item)
 * @property {string} quantidade            quantidade do item, como string (campo de texto)
 * @property {string} precoUnitario         preço unitário no formato BR ("100,00")
 * @property {string} valorTotalEsperado    quantidade × precoUnitario, no formato BR do
 *                                          campo "Vlr. Total Estimado" (recalculado pelo
 *                                          próprio Fluig) — condição observável para
 *                                          confirmar que os dois campos acima foram
 *                                          interpretados corretamente pela tela
 * @property {string} observacao            texto livre do item
 * @property {string} rateioPercentual      percentual do único rateio do item ("100")
 */

/**
 * @param {Partial<ProdutoCompra>} [overrides] o que o teste VALIDA entra aqui, explícito
 * @returns {ProdutoCompra}
 */
export function criarProdutoCompra(overrides = {}) {
  const id = randomUUID().slice(0, 8);

  return {
    filialTermoBusca: FILIAL_PADRAO.termoBusca,
    filialOpcaoEsperada: FILIAL_PADRAO.opcaoEsperada,
    produtoTermoBusca: PRODUTO_PADRAO.termoBusca,
    produtoOpcaoEsperada: PRODUTO_PADRAO.opcaoEsperada,
    justificativa: `${QA_PREFIX} ${faker.company.catchPhrase()} ${id}`,
    dataEmissao: dataFuturaBR(0),
    dataNecessidade: dataFuturaBR(30),
    quantidade: '2',
    precoUnitario: '100,00',
    valorTotalEsperado: '200,00',
    observacao: `${QA_PREFIX} observação automatizada ${id}`,
    rateioPercentual: '100',
    ...overrides,
  };
}

/**
 * Data no formato dd/mm/aaaa que os campos deste formulário exigem (diferente do
 * `<input type="date">` do modal, que usa ISO). Calculada — não sorteada — pelo mesmo
 * motivo documentado em `factories/solicitacao-compra.js`: precisa ser hoje ou futura para
 * a regra de negócio aceitar, e `faker.date.*` sem `refDate` não respeita a seed.
 *
 * @param {number} dias quantos dias à frente de hoje (0 = hoje)
 * @returns {string} dd/mm/aaaa
 */
export function dataFuturaBR(dias) {
  const data = new Date();
  data.setDate(data.getDate() + dias);

  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${data.getFullYear()}`;
}

/**
 * Justificativa rastreável para decisão de aprovação/reprovação numa tarefa.
 *
 * Vive aqui, e não na spec, porque a regra do projeto é que **todo** dado escrito nasce na
 * factory: é o que garante prefixo `QA` + sufixo único em tudo que a automação deixa na base,
 * e o que mantém um dono único para a construção de massa.
 *
 * @param {string} acao rótulo curto da decisão ("aprovacao", "reprovacao")
 * @returns {string}
 */
export function criarJustificativaDecisao(acao) {
  const id = randomUUID().slice(0, 8);
  return `${QA_PREFIX} ${acao} automatizado ${faker.company.catchPhrase()} ${id}`;
}
