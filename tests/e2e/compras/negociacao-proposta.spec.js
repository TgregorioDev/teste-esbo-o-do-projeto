// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { NegociacaoPage } from '../../../pages/NegociacaoPage.js';
import { PortalCompradorPage } from '../../../pages/PortalCompradorPage.js';
import { criarJustificativaDecisao } from '../../../factories/cotacao.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * Reforço à guarda padrão do projeto — ver o mesmo helper em `ciclo-cotacao.spec.js`, onde
 * a investigação ao vivo confirmou por que ele é necessário: `bloquearCriacaoDeSolicitacao`
 * intercepta só `**\/process-management/**`, e o Enviar do shell de Cotação criou um
 * processo real (#112312) por um caminho que não bate nesse padrão. Todo teste que aciona
 * `enviar()` num destes formulários avulsos usa este bloqueio mais amplo em vez do padrão.
 * @param {import('@playwright/test').Page} page
 */
async function bloquearTodaEscritaNoHost(page) {
  /** @type {string[]} */
  const bloqueadas = [];
  await page.route('**/*', async (route, request) => {
    if (request.method() === 'GET') return route.fallback();
    bloqueadas.push(`${request.method()} ${request.url()}`);
    await route.abort('blockedbyclient');
  });
  return {
    tentativas: () => bloqueadas.length,
    urls: () => [...bloqueadas],
  };
}

/**
 * Negociação de Cotação de Produtos e Serviços — CT-NEG.
 *
 * Mesma investigação de dois caminhos feita para CT-COT (ver `ciclo-cotacao.spec.js`),
 * repetida para este processo:
 *
 * 1. **Formulário avulso** (`wf_negociacao_cotacao_prod_serv`, `pages/NegociacaoPage.js`):
 *    shell fora de contexto. Fornecedor, vínculos, itens e totais são `readonly` e nascem
 *    vazios — igual à Cotação. A diferença é que a seção "Validação de Proposta" tem MAIS
 *    controles tecnicamente editáveis (`propostaValidada` Sim/Não e a Justificativa livre),
 *    mas o próprio formulário avisa, em texto fixo: **"A aprovação da negociação deve ser
 *    realizada pelo Protheus."** — a decisão de negócio não é tomada por este radio.
 * 2. **Fila real** — Portal do Comprador → "Avaliação de Propostas". Confirmado ao vivo:
 *    tabela carregada, colunas reais (Status, Núm. Cotação, Filial, Nº da SC, Parecer Téc.,
 *    Em Alçada, Dt. Validade, Valor Final), e uma única linha "Nenhum dado encontrado".
 *
 *    ⚠️ Correção: este bloco afirmava não haver seletor "Atuar como" nesta sub-tela. É
 *    **falso** — `tests/e2e/portais/ciclo-comprador.spec.js` troca a delegação nela com
 *    sucesso. A conclusão vinha de um `toHaveCount(0)`, assertion de ausência satisfeita no
 *    primeiro poll antes de a sub-SPA renderizar. A delegação destrava a VISÃO, não cria
 *    massa: mesmo delegada, a fila segue vazia.
 *
 * ⚠️ O roteiro original registrava que as cotações da base estavam "Em Cotação" sem
 * propostas de fornecedor (o que já impediria aprovar algo). O que se confirma agora é mais
 * básico ainda: a fila de Avaliação de Propostas não tem NENHUMA cotação, com ou sem
 * proposta.
 *
 * ⚠️ **A causa NÃO é o D-01**, como este bloco dizia. A cotação é gerada pelo **Protheus** e
 * chega ao Fluig por integração (skill `cassi-fluig-master`,
 * `references/regras-de-negocio-compras.md` §5; o elo é `hd_numSc`). O bloqueio efetivo é
 * anterior: nenhuma SC atravessa a **Validação Orçamentária** (seq 14, responsável NOMINAL
 * fora do alcance da conta de automação), medida em
 * `tests/e2e/portais/alcadas-orcamentaria.spec.js`. Vale ainda a regra §7: a negociação é
 * restrita a quem JÁ enviou proposta, e a decisão acontece na Central de Tarefas, não neste
 * Portal.
 *
 * Os cenários 01-H (validar e aprovar), 01-S1 (reprovar com justificativa) e 01-S2 de CT-NEG
 * (proposta fora do prazo bloqueada) dependem de uma proposta real — nenhum é alcançável
 * hoje, pelas duas rotas, pelo mesmo motivo de fundo que bloqueia CT-COT.
 */
test.describe('Negociação de Cotação — formulário avulso (shell fora de contexto)', () => {
  test('o formulário avulso de Negociação é readonly em proposta, fornecedor e validade — a aprovação real é declarada como responsabilidade do Protheus', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const negociacao = new NegociacaoPage(page);

    await negociacao.goto();
    await negociacao.expectAberto();

    await expect(negociacao.campoCnpjCpf).not.toBeEditable();
    await expect(negociacao.campoRazaoSocial).not.toBeEditable();
    await expect(negociacao.campoNumeroCotacao).not.toBeEditable();
    await expect(negociacao.campoNumeroScFluig).not.toBeEditable();
    await expect(negociacao.campoNumeroScErp).not.toBeEditable();
    await expect(negociacao.campoComprador).not.toBeEditable();
    await expect(
      negociacao.campoValidadeProposta,
      'Validade da Proposta deveria ser readonly (cenário 01-S2 de CT-NEG não é provocável)',
    ).not.toBeEditable();
    await expect(negociacao.campoValidadeCotacao).not.toBeEditable();
    await expect(negociacao.campoSubTotal).not.toBeEditable();
    await expect(negociacao.campoValorTotalPedido).not.toBeEditable();

    // Sem proposta vinculada: Responsável nasce vazio e readonly.
    await expect(negociacao.campoResponsavel).not.toBeEditable();
    await expect(negociacao.campoResponsavel).toHaveValue('');

    // Os controles de decisão SÃO tecnicamente editáveis...
    await expect(negociacao.radioPropostaValidadaSim).toBeEditable();
    await expect(negociacao.radioPropostaValidadaNao).toBeEditable();
    await expect(negociacao.campoJustificativa).toBeEditable();

    // ...mas o próprio formulário declara que não é aqui que a aprovação acontece de fato.
    await expect(negociacao.textoAprovacaoPeloProtheus).toBeVisible();

    expect(guarda.tentativas(), 'abrir e ler o formulário não deveria escrever nada').toBe(0);
  });

  test('CT-NEG — o Enviar do shell sem proposta real vinculada nunca deveria completar uma requisição de escrita', async ({
    page,
  }) => {
    const negociacao = new NegociacaoPage(page);

    await negociacao.goto();
    await negociacao.expectAberto();

    await negociacao.preencherDecisao({
      aprovar: true,
      justificativa: criarJustificativaDecisao('validação de proposta'),
    });

    // Bloqueio amplo armado só agora, imediatamente antes do clique — ver docstring do topo
    // do arquivo. Armar mais cedo intercepta os POSTs de dataset que o próprio carregamento
    // do formulário usa (leitura) e o formulário nunca termina de abrir.
    const guardaAmpla = await bloquearTodaEscritaNoHost(page);
    await negociacao.enviar();

    // Comportamento esperado: o Fluig deveria recusar o envio no cliente (como faz a
    // Solicitação de Compras), sem completar nenhuma requisição de escrita. Se este shell
    // repetir o mesmo defeito já confirmado na Cotação (ver `ciclo-cotacao.spec.js`), esta
    // assertion fica vermelha de propósito — o que documenta o defeito em vez de escondê-lo.
    // De qualquer forma, nenhuma escrita real chega a sair: `guardaAmpla` intercepta e aborta
    // qualquer requisição não-GET antes que ela alcance o servidor.
    expect(
      guardaAmpla.tentativas(),
      'o clique em Enviar deveria ter sido recusado no cliente, sem gerar nenhuma ' +
        `requisição de escrita — em vez disso tentou: ${guardaAmpla.urls().join(', ')}`,
    ).toBe(0);
  });
});

test.describe('Negociação de Cotação — ponto de entrada real (Portal do Comprador)', () => {
  test('CT-NEG — a fila real de "Avaliação de Propostas" está vazia (pré-condição ausente para validar/reprovar uma proposta real)', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const portalComprador = new PortalCompradorPage(page);

    await portalComprador.goto();
    await portalComprador.expectCarregada();
    await portalComprador.abrirEtapa('Avaliação de Propostas');
    await expect(page).toHaveURL(/avaliacaoPropostas/);

    // ⚠️ Saiu daqui `comboAtuarComo).toHaveCount(0)`: afirmava a AUSÊNCIA do seletor de
    // delegação nesta sub-tela, enquanto `tests/e2e/portais/ciclo-comprador.spec.js` troca a
    // delegação nela com sucesso. Assertion de ausência é satisfeita no primeiro poll, antes
    // de a sub-SPA renderizar — era falso verde disfarçado de medição.

    const tabela = portalComprador.getTabelaAtiva();
    await expect(tabela).toBeVisible();

    // Grade vazia renderiza UMA linha de placeholder — por isso o corte é > 1.
    const temProposta = (await tabela.locator('tbody tr').count()) > 1;

    expect(guarda.tentativas(), 'esta investigação é só leitura').toBe(0);

    if (temProposta) {
      throw new Error(
        'MUDANÇA DE AMBIENTE: a fila de "Avaliação de Propostas" passou a ter cotação. Os ' +
          'casos CT-NEG (cenários 01-H, 01-S1, 01-S2) estavam declarados como lacuna por falta ' +
          'desta massa — agora são alcançáveis e devem ser implementados contra a proposta real.',
      );
    }

    throw new Error(
      'PRÉ-CONDIÇÃO AUSENTE: a fila de "Avaliação de Propostas" do Portal do Comprador não ' +
        'tem nenhuma cotação, com ou sem proposta de fornecedor. Isto NÃO é defeito do produto ' +
        'sob teste, e a causa NÃO é o D-01: a cotação é gerada pelo PROTHEUS e chega ao Fluig ' +
        'por integração (skill `cassi-fluig-master`, `references/regras-de-negocio-compras.md` ' +
        '§5). O bloqueio efetivo é anterior — a Validação Orçamentária (seq 14, responsável ' +
        'NOMINAL), medida em `tests/e2e/portais/alcadas-orcamentaria.spec.js`. Vale também a ' +
        'regra §7: a negociação é restrita a quem JÁ enviou proposta, e a decisão em si ' +
        'acontece na Central de Tarefas, não neste Portal. Os casos CT-NEG estão declarados ' +
        'como lacuna, com motivo, em `scripts/gerar-cobertura.mjs`.',
    );
  });
});
