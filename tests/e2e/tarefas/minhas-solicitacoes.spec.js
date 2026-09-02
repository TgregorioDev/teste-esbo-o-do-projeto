// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { CentralTarefasPage } from '../../../pages/CentralTarefasPage.js';
import { MinhasSolicitacoesPage } from '../../../pages/MinhasSolicitacoesPage.js';
import { criarSolicitacaoCompraClassica } from '../../../pages/CicloCompradorPage.js';

/**
 * Central de Tarefas — Minhas Solicitações (CT-TSK-03-H e CT-TSK-04-H).
 *
 * ⚠️ Nota antiga, revogada: este cabeçalho dizia que assumir tarefa do pool e o cenário de
 * concorrência "alteram estado do workflow do cliente e não estão implementados". As duas
 * metades ficaram falsas. A premissa caiu com a decisão do dono do ambiente em 25/08/2026
 * (`docs/politica-de-escrita.md`: escrever é o propósito da base de homologação), e o caso
 * CT-TSK-02 cenário H **está implementado** em `tests/e2e/tarefas/assumir-tarefa-pool.spec.js`,
 * agora com procedência QA verificada antes de assumir e devolução ao pool no teardown.
 * O cenário S1 (concorrência) segue sem teste, com o motivo declarado em
 * `scripts/gerar-cobertura.mjs` — não por política, mas porque só existe uma conta de
 * automação e dois contextos são a mesma identidade para o servidor.
 */

test.describe('Minhas Solicitações — sinalização de atraso (CT-TSK-03-H)', () => {
  /**
   * ⚠️ Pré-condição que a automação NÃO consegue criar — e por isso é declarada, não suposta.
   *
   * Este caso exige uma solicitação com SLA vencido. Criar uma SC é trivial para a suíte;
   * fazê-la ATRASAR não é: depende da passagem do tempo, e não há como adiantar o relógio do
   * servidor. É a mesma natureza de "contrato vigente" ou "usuário cadastrado" — ambiente,
   * não massa de teste. A regra "cada teste monta seus próprios pré-requisitos" se aplica ao
   * que é criável; aqui não é.
   *
   * O que estava errado não era depender do ambiente: era depender EM SILÊNCIO. O comentário
   * anterior dizia "massa confirmada em campo no momento da implementação" e o teste ia
   * direto ao `toBeVisible`. Sem solicitação atrasada, ele reprovava com um timeout de 30s
   * sobre um locator — indistinguível de "o produto parou de sinalizar atraso", que é
   * exatamente o defeito que o caso existe para detectar.
   *
   * Agora a ausência de massa é detectada primeiro e reportada com nome próprio. E há um
   * risco a mais que justifica o cuidado: o `globalTeardown` da própria suíte cancela
   * solicitações, então a suíte é capaz de apagar a pré-condição de um teste dela mesma.
   *
   * Quando a massa existe — e existia em 28/08/2026 —, o caso é exercitado de verdade: a
   * assertion afirma o rótulo "Atrasada há N dias" no cartão.
   */
  test('deve sinalizar visualmente a solicitação atrasada', async ({ page }, testInfo) => {
    const tarefasPage = new CentralTarefasPage(page);
    await tarefasPage.goto();
    await tarefasPage.expectCarregada();
    await tarefasPage.abrirMinhasSolicitacoes();

    // A listagem precisa ter carregado antes de concluir qualquer coisa sobre ausência:
    // contar cartões numa grade que ainda não pintou daria zero por vacuidade, e o teste
    // culparia a falta de massa por um problema de sincronização.
    await expect(
      tarefasPage.cartoesDeSolicitacao.first(),
      '"Minhas solicitações" não renderizou nenhum cartão — sem a listagem carregada não há ' +
        'como avaliar a sinalização de atraso',
    ).toBeVisible({ timeout: 30_000 });

    const atrasados = await tarefasPage.cartoesAtrasados.count();
    const total = await tarefasPage.cartoesDeSolicitacao.count();

    if (atrasados === 0) {
      throw new Error(
        `PRÉ-CONDIÇÃO AUSENTE: nenhuma das ${total} solicitação(ões) listadas em "Minhas ` +
          'solicitações" está atrasada no momento da execução. Este caso exige SLA vencido, e ' +
          'a automação não tem como produzir isso — criar a SC é trivial, fazê-la atrasar ' +
          'depende do relógio. Isto NÃO é defeito do produto sob teste: se fosse o produto ' +
          'deixando de sinalizar, os cartões existiriam com o rótulo ausente, e não é o caso ' +
          '— aqui não há cartão atrasado nenhum. Reexecute quando houver massa vencida.',
      );
    }

    testInfo.annotations.push({
      type: 'massa-de-atraso',
      description: `${atrasados} de ${total} solicitação(ões) listadas estão atrasadas`,
    });

    await expect(tarefasPage.cartoesAtrasados.first()).toBeVisible();
    await expect(tarefasPage.cartoesAtrasados.first()).toContainText(/Atrasada há/);
  });
});

test.describe('Minhas Solicitações — filtro por status (CT-TSK-04-H)', () => {
  /**
   * ⚠️ Este teste passou a criar a PRÓPRIA SC.
   *
   * A versão anterior lia a listagem e exigia `idsAbertas.length > 0` — ou seja, dependia de
   * já existir alguma solicitação aberta na conta. Isso viola "cada teste monta seus próprios
   * pré-requisitos" (skill `playwright-test-creator`) por duas razões concretas, não teóricas:
   *
   * 1. Outro teste pode encerrar ou cancelar essa massa entre a leitura e a asserção.
   * 2. O `globalTeardown` da PRÓPRIA suíte cancela as solicitações que a execução criou —
   *    então a suíte é capaz de destruir a pré-condição de um teste dela mesma.
   *
   * E o oráculo antigo era fraco de todo jeito: comparava apenas se os dois conjuntos eram
   * DIFERENTES. Com o filtro "Finalizadas" quebrado devolvendo zero, `[]` continua diferente
   * de `[ids...]` e o teste passava.
   *
   * Agora o oráculo é a própria SC: ela nasce ABERTA, então tem de aparecer sob "Abertas" e
   * NÃO aparecer sob "Finalizadas". Isso prova o filtro com um dado cujo estado o teste
   * conhece, em vez de comparar dois conjuntos anônimos.
   *
   * A busca usa `MinhasSolicitacoesPage.localizarPorProcessInstanceId`, que pagina em ordem
   * decrescente — a listagem traz `rows=15` em ordem CRESCENTE, e a SC recém-criada tem o
   * maior id, logo nunca estaria no primeiro lote.
   */
  test('@destrutivo a SC própria deve aparecer sob "Abertas" e sumir sob "Finalizadas"', async ({
    page,
  }, testInfo) => {
    test.setTimeout(300_000);

    const { numeroProcesso } = await criarSolicitacaoCompraClassica(page, {
      justificativa: `QA CT-TSK-04-H filtro de status ${Date.now()}`,
    });
    testInfo.annotations.push({ type: 'sc-criada', description: String(numeroProcesso) });

    const minhas = new MinhasSolicitacoesPage(page);

    // Sob "Abertas" (padrão da tela): a SC recém-criada TEM de estar lá. Poll porque a
    // listagem leva alguns segundos para indexar — condição observável, nunca tempo fixo.
    await expect
      .poll(async () => (await minhas.localizarPorProcessInstanceId(numeroProcesso)) !== null, {
        message:
          `a SC ${numeroProcesso}, criada por este teste e portanto ABERTA, deveria aparecer ` +
          'na listagem "Minhas solicitações" com o filtro de status em "Abertas"',
        timeout: 90_000,
        intervals: [5_000, 10_000],
      })
      .toBe(true);

    // Sob "Finalizadas": a MESMA SC não pode aparecer — ela está aberta.
    //
    // ⚠️ A seleção do filtro é feita explicitamente, sem herdar estado: a Central guarda a
    // sub-aba e o filtro por SESSÃO no servidor (`setAttribute centralTaskType`), então
    // confiar no que a tela trouxe da execução anterior é receita de falso resultado.
    const tarefasPage = new CentralTarefasPage(page);
    await tarefasPage.goto();
    await tarefasPage.expectCarregada();
    await tarefasPage.abrirMinhasSolicitacoes();
    await tarefasPage.filtrarSolicitacoesPorStatus('Finalizadas');

    await expect(async () => {
      const ids = await tarefasPage.lerIdentificadoresSolicitacoes();
      expect(
        ids,
        `a SC ${numeroProcesso} está ABERTA (foi criada por este teste agora) e não pode ` +
          'aparecer sob o filtro "Finalizadas" — se aparece, o filtro de status não filtra',
      ).not.toContain(String(numeroProcesso));
    }).toPass({ timeout: 15_000 });
  });
});
