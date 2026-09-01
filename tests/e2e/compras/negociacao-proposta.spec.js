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
 *    Em Alçada, Dt. Validade, Valor Final), e uma única linha "Nenhum dado encontrado". Sem seletor
 *    "Atuar como" para tentar destravar — a fila está mesmo vazia para esta conta.
 *
 * ⚠️ O roteiro original registrava que as cotações da base estavam "Em Cotação" sem
 * propostas de fornecedor (o que já impediria aprovar algo). O que se confirma agora é mais
 * básico ainda: a fila de Avaliação de Propostas não tem NENHUMA cotação, com ou sem
 * proposta. E como CT-COT também está bloqueado (nenhuma Cotação real chega a existir —
 * D-01), não há como este projeto criar a própria condição: criar uma cotação real é
 * exatamente o que está impedido rio acima.
 *
 * CT-NEG-01-H (validar e aprovar), CT-NEG-01-S1 (reprovar com justificativa) e CT-NEG-01-S2
 * (proposta fora do prazo bloqueada) dependem de uma proposta real — nenhum é alcançável
 * hoje, pelas duas rotas, pelo mesmo motivo de fundo que bloqueia CT-COT.
 */
test.describe('Negociação de Cotação — formulário avulso (shell fora de contexto)', () => {
  test('CT-NEG-01-H/S1/S2 (bloqueado) — proposta, fornecedor e validade são readonly; a aprovação real é declarada como responsabilidade do Protheus', async ({
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
      'Validade da Proposta deveria ser readonly (CT-NEG-01-S2 não é provocável)',
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

  test('CT-NEG @bug — o Enviar do shell sem proposta real vinculada nunca deveria completar uma requisição de escrita', async ({
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

    await expect(portalComprador.comboAtuarComo).toHaveCount(0);

    const tabela = portalComprador.getTabelaAtiva();
    await expect(tabela).toBeVisible();
    await expect(tabela.getByText('Nenhum dado encontrado')).toBeVisible();

    expect(guarda.tentativas(), 'esta investigação é só leitura').toBe(0);

    throw new Error(
      'PRÉ-CONDIÇÃO AUSENTE: a fila de "Avaliação de Propostas" do Portal do Comprador não ' +
        'tem nenhuma cotação, com ou sem proposta de fornecedor. Isto NÃO é defeito isolado ' +
        'do produto — é o mesmo bloqueio de fundo que impede CT-COT: D-01 mantém toda ' +
        'Solicitação de Compra presa na conta de integração, então nenhuma Cotação real ' +
        'chega a existir para negociar. CT-NEG-01-H, CT-NEG-01-S1 e CT-NEG-01-S2 continuam ' +
        'bloqueados até D-01 ser corrigido e/ou existir uma proposta real nesta fila.',
    );
  });
});
