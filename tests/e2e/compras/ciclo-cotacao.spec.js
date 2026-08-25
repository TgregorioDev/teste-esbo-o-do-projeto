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
 *    (`/portal/p/1/portal-do-comprador` → "Controle De Cotações"). Confirmado ao vivo: a
 *    fila está vazia ("Nenhum dado encontrado") mesmo sem nenhum filtro aplicado, e a sub-tela
 *    NÃO expõe nenhum seletor "Atuar como" hoje (as sub-telas do Portal do Comprador
 *    conferidas nesta rodada — Controle De Cotações, Avaliação de Propostas — vieram vazias
 *    e sem delegação disponível).
 *
 * ## Conclusão sobre o ponto de entrada
 *
 * O ponto de entrada REAL é o (2) — uma Cotação de verdade só existe como sub-processo de
 * uma Solicitação de Compra que chegou ao Protheus. Mas isso está bloqueado por uma cadeia
 * de causas, não por perfil de quem executa:
 *
 * - **D-01** (defeito crítico já documentado no README): toda SC criada por este projeto
 *   fica presa no marco de Início do BPMN, atribuída à conta de integração
 *   (`consumerkeycompras`), e nunca chega ao Protheus — logo nunca gera uma Cotação real.
 * - Mesmo pré-existente à criação desta suíte, a fila de Cotações do Portal do Comprador
 *   está hoje vazia para esta conta — não há nenhuma cotação, criada por humano ou por
 *   integração, esperando para ser operada.
 *
 * Como resultado, CT-COT-01-H, CT-COT-01-S1, CT-COT-02-S1, CT-COT-02-S2 e CT-COT-02-S3 —
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
  test('CT-COT-01-H/S1/CT-COT-02-S1/S2/S3 (bloqueado) — fornecedor, vínculos, itens e totais são readonly; só o radio de parecer técnico é editável', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const cotacao = new CotacaoPage(page);

    await cotacao.goto();
    await cotacao.expectAberto();

    // Campos de negócio: nenhum é editável (readonly) — cobre por que CT-COT-01-H/S1 não
    // conseguem compor fornecedor/vínculos/totais, e por que CT-COT-02-S1 (totais
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
    await expect(cotacao.campoValidadeCotacao, 'Validade da Cotação deveria ser readonly (CT-COT-02-S2)').not.toBeEditable();
    await expect(cotacao.campoSubTotal, 'Sub Total deveria ser readonly (CT-COT-02-S1)').toHaveValue('0,00');
    await expect(cotacao.campoSubTotal).not.toBeEditable();
    await expect(cotacao.campoValorTotalPedido).not.toBeEditable();
    await expect(cotacao.campoValorTotalPedido).toHaveValue('0,00');
    await expect(cotacao.selectTipoFrete, 'Tipo de Frete também nasce readonly nesta rota').not.toBeEditable();

    // O único grupo de decisão realmente editável.
    await expect(cotacao.radioParecerTecnicoSim).toBeEditable();
    await expect(cotacao.radioParecerTecnicoNao).toBeEditable();

    // Rede de segurança: nada foi escrito só de abrir e inspecionar o formulário.
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

    // Confirmado ao vivo: esta sub-tela não expõe "Atuar como" hoje — não há delegação para
    // tentar antes de concluir que a fila está vazia.
    await expect(portalComprador.comboAtuarComo).toHaveCount(0);

    const semDados = page.getByText('Nenhum dado encontrado');
    await expect(semDados).toBeVisible();

    expect(guarda.tentativas(), 'esta investigação é só leitura').toBe(0);

    throw new Error(
      'PRÉ-CONDIÇÃO AUSENTE: a fila de "Controle De Cotações" do Portal do Comprador não ' +
        'tem nenhuma Cotação para operar. Isto NÃO é defeito do produto sob teste isolado — ' +
        'é consequência de D-01 (toda Solicitação de Compra criada por esta suíte fica presa ' +
        'no marco de Início do BPMN e nunca chega ao Protheus, então nunca gera uma Cotação ' +
        'real) somada à ausência de massa pré-existente na base. CT-COT-01-H, CT-COT-01-S1, ' +
        'CT-COT-02-S1, CT-COT-02-S2 e CT-COT-02-S3 continuam bloqueados até D-01 ser corrigido ' +
        'e/ou existir uma Cotação real nesta fila.',
    );
  });
});
