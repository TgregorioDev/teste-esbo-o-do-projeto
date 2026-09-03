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
 * A seed do faker é fixada em `fixtures/fixtures.js` por execução **e** por teste
 * (`FAKER_SEED ^ hash32(identidade do teste)`) e anexada ao relatório: a massa de um teste não
 * depende do worker nem da ordem de despacho. Para repetir exatamente a mesma massa de um
 * teste, em qualquer número de workers:
 *   FAKER_SEED=<valor> npx playwright test <arquivo> -g "<título>"
 */

const QA_PREFIX = process.env.QA_DATA_PREFIX ?? 'QA';

/**
 * Tipos oferecidos pelo campo "Tipo de Solicitação" do modal, conforme o catálogo VIGENTE do
 * ambiente, medido em 31/08/2026 e CONFIRMADO pelo dono do ambiente como mudança intencional
 * da Cassi.
 *
 * Histórico, porque a instabilidade é o motivo de o guardião existir: o roteiro de 20/08
 * registrava "Renovação Contratual" + "Aditivo Contratual" + "Nova Solicitação"; o README
 * seguinte registrava "Renovação Contratual" + "Aditivo Contratual"; hoje o ambiente oferece
 * "Aditivo Contratual" + "Nova Contratação". Três composições em 11 dias.
 *
 * Nenhum destes literais é default de factory: quem precisa de um tipo específico o nomeia no
 * próprio teste, e `SolicitacaoCompraModal.selecionarTipo` confirma contra o combo real antes
 * de selecionar, falhando com PRÉ-CONDIÇÃO legível se o literal pedido não existir mais.
 *
 * `modal-solicitacao-compra.spec.js` ("deve oferecer os tipos contratuais de solicitação") é o
 * guardião do catálogo: ele afirma a lista EXATA e reprova a cada nova mudança, que é
 * exatamente o que se espera dele. Atualizar este objeto sem atualizar aquele teste — ou
 * vice-versa — reintroduz o ponto cego que custou 8 casos em 31/08/2026.
 */
export const TIPO_SOLICITACAO = {
  PLACEHOLDER: 'Selecione...',
  ADITIVO: 'Aditivo Contratual',
  NOVA_CONTRATACAO: 'Nova Contratação',
};

/**
 * Intenção "qualquer tipo válido serve" — para o caso que é AGNÓSTICO a qual tipo foi enviado
 * (nenhuma assertion do teste depende do valor). Passar isto como `tipo` em vez de omitir o
 * campo é o que torna a intenção EXPLÍCITA no spec: a suíte não deve mais escolher um tipo
 * sozinha em silêncio — isso é a causa raiz do incidente de 31/08/2026 (24 testes morreram
 * pedindo 'Renovação Contratual', que o ambiente já não oferece, sem que o cenário perdido
 * aparecesse em lugar nenhum do relatório). Consumido por
 * `SolicitacaoCompraModal.selecionarTipo`, que lê as opções HABILITADAS reais do combo no
 * momento em que o modal já está aberto e escolhe uma delas.
 */
export const QUALQUER_TIPO_VALIDO = { qualquerValido: /** @type {true} */ (true) };

/**
 * @typedef {Object} SolicitacaoCompra
 * @property {string | { especifico: string } | { qualquerValido: true }} [tipo]
 *   intenção do caso para o combo "Tipo de Solicitação": um rótulo literal do catálogo (quando
 *   o caso PRECISA daquele tipo por regra de negócio — equivalente a `{ especifico: rotulo }`),
 *   `{ especifico: rotulo }` explícito, ou `QUALQUER_TIPO_VALIDO` quando o caso é agnóstico.
 *   Omitido, o campo nunca é tocado — não há default: ver `criarSolicitacaoCompra`.
 * @property {string} motivo        justificativa da solicitação (texto livre)
 * @property {string} dataNecessidade data em ISO (aaaa-mm-dd) — o campo do modal é
 *                                    `<input type="date">`, que só aceita esse formato
 */

/**
 * Não decide sozinha QUAL tipo enviar: o campo `tipo` só existe no objeto devolvido quando o
 * caller o declara em `overrides` (nunca um valor fixo aqui — foi exatamente um default fixo
 * que ficou obsoleto e derrubou 24 testes quando o catálogo do ambiente mudou, sem que a perda
 * aparecesse no relatório). Ver `TIPO_SOLICITACAO` e `QUALQUER_TIPO_VALIDO`.
 * @param {Partial<SolicitacaoCompra>} [overrides] o que o teste VALIDA entra aqui, explícito
 * @returns {SolicitacaoCompra}
 */
export function criarSolicitacaoCompra(overrides = {}) {
  const id = randomUUID().slice(0, 8);

  return {
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
