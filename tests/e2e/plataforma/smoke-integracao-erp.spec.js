// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { AcompanhamentoContratosPage } from '../../../pages/AcompanhamentoContratosPage.js';
import { TrackerComprasPage } from '../../../pages/TrackerComprasPage.js';
import { GerenciaComprasPage } from '../../../pages/GerenciaComprasPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * FSWTBC-1985 — as telas de Compras/Contratos continuam trazendo dados do ERP.
 *
 * O chamado é o acompanhamento em produção depois da atualização do Protheus para a release
 * 2410, e **não traz descrição**: é caracterização de caminho, um smoke pós-upgrade. O valor
 * dele aqui não é achar defeito novo — é ter **uma** execução curta que responde à pergunta que
 * antecede toda análise de vermelho nesta suíte: *o Protheus está respondendo agora?*
 *
 * `docs/estabilidade-do-ambiente.md` registra a premissa: o ambiente da Cassi não é controlado, e
 * a integração oscila por conta própria — a grade de contratos já foi vista alternando entre ~845
 * linhas e vazio, sem nenhuma mudança de código. Um relatório com dezenas de `PRÉ-CONDIÇÃO
 * AUSENTE` fica ambíguo até alguém responder essa pergunta; este teste responde em um lugar só.
 *
 * As três telas foram escolhidas porque cada uma consome o ERP por um caminho diferente:
 * Acompanhamento pela grade de contratos (CN9), Tracker pela consulta de processos, Gerência de
 * Compras pelo dataset de distribuição. Se as três respondem, a integração está de pé; se
 * exatamente uma falha, o problema é daquele caminho, não do ERP.
 *
 * Fora do alcance, e declarado: tudo que só o ERP confirma (lançamento contábil, saldo de
 * parcela, classificação LP/CP) não tem superfície no Fluig e este caso não cobre.
 *
 * Leitura pura — a guarda de escrita prova que nenhuma das três telas grava nada ao carregar.
 */
test.describe('Integração com o ERP — smoke das telas de Compras/Contratos', () => {
  test('FSWTBC-1985 — Acompanhamento, Tracker e Gerência de Compras trazem dados do Protheus', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    const guarda = await bloquearCriacaoDeSolicitacao(page);

    /** @type {string[]} */
    const semDados = [];
    /** @type {string[]} */
    const medicoes = [];

    // ── 1. Acompanhamento de Contratos — a grade de contratos vem da CN9 do Protheus.
    const contratos = new AcompanhamentoContratosPage(page);
    await contratos.goto();
    await contratos.expectCarregada();
    const totalContratos = (await contratos.lerLinhasDaGrade()).length;
    medicoes.push(`Acompanhamento: ${totalContratos} linhas`);
    if (totalContratos === 0) semDados.push('Acompanhamento de Contratos (grade de contratos)');

    // ── 2. Tracker — a consulta de processos, aqui pela visão de Solicitação de Compras, que é
    // a que responde sem exigir período. Pesquisar sem filtro nenhum é recusado pela tela, por
    // isso o filtro de status: é o critério mínimo que a própria tela aceita.
    const tracker = new TrackerComprasPage(page);
    await tracker.goto();
    await tracker.expectCarregada();
    await tracker.filtrarPorStatus('Abertos');
    await tracker.pesquisar();
    await expect(tracker.alertaFiltroObrigatorio).toBeHidden();
    await expect(tracker.getTabelaResultado()).toBeVisible();
    const totalTracker = await tracker.getLinhasDoResultado().count();
    medicoes.push(`Tracker: ${totalTracker} linhas`);
    if (totalTracker === 0) semDados.push('Tracker (Solicitação de Compras, status Abertos)');

    // ── 3. Gerência de Compras — a aba Transferir. A aba Atribuir NÃO serve de sonda: ela vem
    // vazia por defeito conhecido (ver `gerencia-compras.spec.js`), e usá-la aqui faria este
    // smoke acusar o ERP por um problema que é da widget.
    const gerencia = new GerenciaComprasPage(page);
    await gerencia.goto();
    await gerencia.expectCarregada();
    await gerencia.abrirAbaTransferir();
    await expect(gerencia.getTabelaAtiva()).toBeVisible();
    // Linha 1 é sempre o estado "Nenhum dado encontrado"; dado real exige mais de uma linha.
    // A carga desta aba é a mais lenta das três (~20-25s medidos), daí a espera maior.
    //
    // Esperar-e-seguir, em vez de `expect.poll`: aqui a contagem é MEDIÇÃO, não veredito — o
    // veredito é único, no fim, e precisa das três telas para dizer "o ERP caiu" em vez de "esta
    // tela caiu". Envolver uma assertion em `catch` para conseguir isso seria engolir erro; o
    // `catch` abaixo descarta apenas a ESPERA, e a contagem que vem depois é lida do jeito que
    // estiver.
    await gerencia
      .getLinhasDaTabelaAtiva()
      .nth(1)
      .waitFor({ state: 'attached', timeout: 60_000 })
      .catch(() => {});
    const linhasGerencia = await gerencia.getLinhasDaTabelaAtiva().count();
    medicoes.push(`Gerência de Compras: ${linhasGerencia} linhas`);
    if (linhasGerencia <= 1) semDados.push('Gerência de Compras (aba Transferir)');

    test.info().annotations.push({
      type: 'smoke-integracao-erp',
      description: medicoes.join(' · '),
    });

    expect(
      semDados,
      'tela de Compras/Contratos sem dados do ERP. Se as TRÊS estiverem na lista, a integração ' +
        'com o Protheus está fora do ar e todo vermelho desta execução deve ser lido à luz ' +
        'disso (ver docs/estabilidade-do-ambiente.md); se for só uma, o problema é do caminho ' +
        'daquela tela',
    ).toEqual([]);

    expect(guarda.tentativas(), 'carregar as três telas não deveria escrever nada').toBe(0);
  });
});
