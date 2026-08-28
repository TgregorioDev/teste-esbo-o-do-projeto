// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { CotacaoPage } from '../../../pages/CotacaoPage.js';
import { PortalCompradorPage } from '../../../pages/PortalCompradorPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * Ciclo de Cotação de Produtos e Serviços — CT-COT.
 *
 * ## Investigação dos dois pontos de entrada (feita nesta rodada)
 *
 * O processo tem DOIS caminhos possíveis, e os dois foram exercitados ao vivo antes de
 * decidir onde implementar:
 *
 * 1. **Formulário avulso** (`Processos > Iniciar Solicitações > wf_cotacao_produtos_servicos`,
 *    `pages/CotacaoPage.js`). Inspeção do DOM confirma que TODO campo de negócio — CNPJ/CPF,
 *    Razão Social, Nome Fantasia, Nº da Cotação, Nº da SC do Fluig, Nº da SC do ERP, Filial,
 *    Comprador, Validade da Cotação, itens, totais e até o Tipo de Frete — é `readonly` (ou
 *    tem o atributo `readonly` no `<select>`, que o navegador ignora mas o Fluig usa para
 *    travar o campo) e nasce vazio. Não há botão de busca de fornecedor. Só um grupo de
 *    controle é realmente editável: o radio "Enviar para parecer técnico?" (Sim/Não) — e o
 *    equivalente "Devolver ao Fornecedor?".
 * 2. **Sub-processo real da SC**, operado no Portal do Comprador
 *    (`/portal/p/1/portal-do-comprador` → "Controle De Cotações"). A fila está vazia
 *    ("Nenhum dado encontrado") mesmo sem nenhum filtro aplicado.
 *
 *    ⚠️ Correção: este bloco afirmava que a sub-tela "NÃO expõe nenhum seletor Atuar como
 *    hoje". É **falso**. `tests/e2e/portais/portal-comprador.spec.js` mede o seletor presente
 *    e `tests/e2e/portais/ciclo-comprador.spec.js` chega a trocar a delegação com sucesso
 *    nesta mesma sub-tela. A conclusão errada vinha de uma assertion de ausência
 *    (`toHaveCount(0)`) satisfeita no primeiro poll, antes de a sub-SPA Angular renderizar —
 *    e do caminho de navegação usado aqui (tile do Acesso Rápido direto), que não é o que
 *    monta o seletor. A delegação, porém, destrava a VISÃO, não cria massa: mesmo delegada,
 *    a fila segue vazia.
 *
 * ## Conclusão sobre o ponto de entrada
 *
 * O ponto de entrada REAL é o (2) — uma Cotação de verdade só existe como sub-processo de
 * uma Solicitação de Compra que chegou ao Protheus. Mas isso está bloqueado por uma cadeia
 * de causas, não por perfil de quem executa:
 *
 * - ⚠️ **A causa NÃO é o D-01.** Este bloco dizia que a SC presa no Início (D-01) era o que
 *   impedia a cotação de existir. Pela skill `cassi-fluig-master`
 *   (`references/regras-de-negocio-compras.md` §5), quem gera a cotação é o **Protheus**, que
 *   a coloca em fila e dispara um subprocesso no Fluig — o elo é a chave de negócio
 *   `hd_numSc`, não um subprocesso BPMN. O `catalogo-de-processos.md` confirma: instâncias de
 *   cotação nascem por `consumerkeycompras` / `integracao.fluig.cassi.com.br.1`.
 * - **O bloqueio efetivo é anterior e é outro:** nenhuma SC atravessa a **Validação
 *   Orçamentária** (seq 14, responsável NOMINAL fora do alcance da conta de automação), então
 *   nenhuma chega ao ponto em que o Protheus geraria a cotação. Medido em
 *   `tests/e2e/portais/alcadas-orcamentaria.spec.js`.
 * - Somado a isso, a fila de Cotações do Portal do Comprador está hoje vazia para esta conta
 *   — não há cotação pré-existente, criada por humano ou por integração, esperando para ser
 *   operada.
 *
 * Como resultado, os cenários 01-H, 01-S1, 02-S1, 02-S2 e 02-S3 da família CT-COT —
 * que dependem de uma Cotação real com fornecedor, vínculos, itens e totais — não são
 * alcançáveis por NENHUMA das duas rotas hoje.
 *
 * ## Achado adicional (defeito novo, descoberto ao investigar o shell)
 *
 * Diferente do formulário de Solicitação de Compras (`FormularioSolicitacaoCompraPage`), que
 * recusa o Enviar com um diálogo "Erro ao validar as informações do formulário" quando
 * campos obrigatórios estão vazios, o shell avulso de Cotação **não valida nada no cliente**:
 * o Enviar chega a criar um processo real no servidor mesmo com fornecedor/vínculos vazios.
 * Isto foi confirmado em execução real desta suíte — o processo **#112312** foi criado sem
 * querer na primeira tentativa de investigar este comportamento (a guarda padrão do projeto,
 * `bloquearCriacaoDeSolicitacao`, intercepta `**\/process-management/**`, mas o endpoint que
 * este shell usa para o Enviar não bate nesse padrão) — o processo ficou preso repetindo
 * "Falha na Integração com ERP. Não foi possível recuperar as informações do Fornecedor", o
 * que por si só corrobora que este shell nunca produz uma Cotação utilizável. Não há exclusão
 * disponível para ele; o teste abaixo usa um bloqueio de escrita mais amplo (qualquer método
 * não-GET no host da aplicação, não só `process-management`) para nunca repetir isso.
 */

/**
 * Reforço à guarda padrão do projeto. `bloquearCriacaoDeSolicitacao` (utils/guarda-criacao.js)
 * intercepta só `**\/process-management/**` — o que basta para a Solicitação de Compras, mas
 * NÃO bastou aqui (ver docstring acima: o Enviar deste shell criou um processo real por um
 * caminho diferente). Este bloqueio intercepta qualquer requisição de escrita (método != GET)
 * para o mesmo host da aplicação sob teste, sem presumir qual caminho o widget usa.
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

test.describe('Cotação de Produtos e Serviços — formulário avulso (shell fora de contexto)', () => {
  test('o formulário avulso de Cotação é readonly em fornecedor, vínculos, itens e totais — só o radio de parecer técnico é editável', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const cotacao = new CotacaoPage(page);

    await cotacao.goto();
    await cotacao.expectAberto();

    // Campos de negócio: nenhum é editável (readonly) — mostra por que os cenários 01-H/01-S1 não
    // conseguem compor fornecedor/vínculos/totais, e por que o cenário 02-S1 (totais
    // inconsistentes), S2 (validade vencida) e S3 (CNPJ/CPF inválido) não têm como ser
    // provocados: não existe caminho de UI para escrever um valor diferente do que já está
    // lá (vazio).
    await expect(cotacao.campoCnpjCpf, 'CNPJ/CPF deveria ser readonly nesta rota').not.toBeEditable();
    await expect(cotacao.campoCnpjCpf).toHaveValue('');
    await expect(cotacao.campoRazaoSocial).not.toBeEditable();
    await expect(cotacao.campoNomeFantasia).not.toBeEditable();
    await expect(cotacao.campoNumeroCotacao).not.toBeEditable();
    await expect(cotacao.campoNumeroScFluig).not.toBeEditable();
    await expect(cotacao.campoNumeroScErp).not.toBeEditable();
    await expect(cotacao.campoCodigoFilial).not.toBeEditable();
    await expect(cotacao.campoComprador).not.toBeEditable();
    await expect(cotacao.campoValidadeCotacao, 'Validade da Cotação deveria ser readonly (cenário 02-S2 de CT-COT)').not.toBeEditable();
    await expect(cotacao.campoSubTotal, 'Sub Total deveria ser readonly (cenário 02-S1 de CT-COT)').toHaveValue('0,00');
    await expect(cotacao.campoSubTotal).not.toBeEditable();
    await expect(cotacao.campoValorTotalPedido).not.toBeEditable();
    await expect(cotacao.campoValorTotalPedido).toHaveValue('0,00');
    await expect(cotacao.selectTipoFrete, 'Tipo de Frete também nasce readonly nesta rota').not.toBeEditable();

    // O único grupo de decisão realmente editável.
    await expect(cotacao.radioParecerTecnicoSim).toBeEditable();
    await expect(cotacao.radioParecerTecnicoNao).toBeEditable();

    // Delimitação de escopo: este caso afirma sobre os campos que a tela serve (readonly,
    // valores iniciais), então abrir e inspecionar não pode ter disparado escrita nenhuma.
    expect(guarda.tentativas(), 'abrir e ler o formulário não deveria escrever nada').toBe(0);
  });

  test('CT-COT (defeito) — o shell aceita Enviar sem nenhuma validação de fornecedor/vínculos obrigatórios', async ({
    page,
  }) => {
    const cotacao = new CotacaoPage(page);

    await cotacao.goto();
    await cotacao.expectAberto();

    // O único controle de decisão que este shell permite compor: a pergunta sobre parecer
    // técnico. O restante dos obrigatórios (fornecedor, vínculos) segue vazio.
    await cotacao.marcarEnviarParaParecerTecnico(false);

    // Bloqueio amplo armado só agora, IMEDIATAMENTE antes do clique — ver docstring do
    // arquivo. Armar mais cedo intercepta os POSTs de dataset que o próprio carregamento do
    // formulário usa (leitura, não escrita) e o formulário nunca termina de abrir. A guarda
    // padrão do projeto não cobre o endpoint que este Enviar usa, e a primeira investigação
    // chegou a criar um processo real (#112312) por engano — este teste nunca deixa uma
    // escrita real sair a partir daqui.
    const guardaAmpla = await bloquearTodaEscritaNoHost(page);
    await cotacao.enviar();

    // Comportamento ESPERADO (e o que `FormularioSolicitacaoCompraPage` de fato entrega): o
    // Fluig deveria recusar o envio com um diálogo de erro, como faz a Solicitação de
    // Compras. Este shell NÃO faz isso — a assertion abaixo fica vermelha de propósito,
    // documentando o defeito. Sem ela, o teste passaria escondendo que o Enviar seguiu em
    // frente sem qualquer obrigatório preenchido.
    await expect(
      cotacao.dialogErro,
      'defeito: o Fluig deveria recusar o envio da Cotação sem fornecedor/vínculos (como faz ' +
        'a Solicitação de Compras), mas o shell aceita e tenta criar um processo real sem ' +
        'nenhuma validação — só não chegou ao servidor porque este teste bloqueia toda ' +
        'escrita no host',
    ).toBeVisible({ timeout: 5_000 });

    expect(
      guardaAmpla.tentativas(),
      'o clique em Enviar deveria ter sido recusado no cliente, sem gerar nenhuma ' +
        `requisição de escrita — em vez disso tentou: ${guardaAmpla.urls().join(', ')}`,
    ).toBe(0);
  });
});

test.describe('Cotação de Produtos e Serviços — ponto de entrada real (Portal do Comprador)', () => {
  test('CT-COT — a fila real de "Controle De Cotações" está vazia (pré-condição ausente para qualquer cenário com cotação real)', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const portalComprador = new PortalCompradorPage(page);

    await portalComprador.goto();
    await portalComprador.expectCarregada();
    await portalComprador.abrirEtapa('Controle De Cotações');
    await expect(page).toHaveURL(/controleCotacao/);

    // ⚠️ A versão anterior afirmava aqui `comboAtuarComo).toHaveCount(0)` — "esta sub-tela não
    // expõe Atuar como". Isso contradiz `tests/e2e/portais/portal-comprador.spec.js` e
    // `tests/e2e/portais/ciclo-comprador.spec.js`, que medem o seletor PRESENTE nesta mesma
    // sub-tela e chegam a trocar a delegação com sucesso. `toHaveCount(0)` é assertion de
    // ausência: satisfeita no primeiro poll, antes de a sub-SPA Angular renderizar — e o
    // caminho usado aqui (tile do Acesso Rápido direto) não é o que monta o seletor. A
    // afirmação saiu; quem cobre a delegação é o spec de portais.

    const linhas = portalComprador.getTabelaAtiva().locator('tbody tr');
    // Grade vazia renderiza UMA linha de placeholder — por isso o corte é > 1.
    const temCotacao = (await linhas.count()) > 1;

    expect(guarda.tentativas(), 'esta investigação é só leitura').toBe(0);

    if (temCotacao) {
      throw new Error(
        'MUDANÇA DE AMBIENTE: a fila de "Controle De Cotações" passou a ter cotação. Os casos ' +
          'CT-COT (cenários 01-H, 01-S1, 02-S1, 02-S2, 02-S3) estavam declarados como lacuna ' +
          'justamente por falta desta massa — agora são alcançáveis e devem ser implementados ' +
          'de verdade, contra a cotação real, em vez de permanecerem como lacuna.',
      );
    }

    throw new Error(
      'PRÉ-CONDIÇÃO AUSENTE: a fila de "Controle De Cotações" do Portal do Comprador não tem ' +
        'nenhuma Cotação para operar. Isto NÃO é defeito do produto sob teste. ' +
        'A causa NÃO é o D-01: pela skill `cassi-fluig-master` ' +
        '(`references/regras-de-negocio-compras.md` §5), quem gera a cotação é o PROTHEUS, que ' +
        'a coloca em fila e dispara um subprocesso no Fluig — o elo é a chave de negócio ' +
        '`hd_numSc`, não um subprocesso BPMN. O que trava o ciclo antes disso é a Validação ' +
        'Orçamentária (seq 14, responsável NOMINAL fora do alcance da conta de automação; ver ' +
        '`tests/e2e/portais/alcadas-orcamentaria.spec.js`). Os casos CT-COT estão declarados ' +
        'como lacuna, com motivo, em `scripts/gerar-cobertura.mjs`.',
    );
  });
});
