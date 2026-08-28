// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { CentralTarefasPage } from '../../../pages/CentralTarefasPage.js';
import { PoolTarefasPage } from '../../../pages/PoolTarefasPage.js';
import { AcoesDaTarefaPage } from '../../../pages/AcoesDaTarefaPage.js';
import { criarSolicitacaoCompraClassica } from '../../../pages/CicloCompradorPage.js';
import { envObrigatoria } from '../../../config/ambiente.js';

/**
 * Central de Tarefas — assumir tarefa do pool (CT-TSK-02-H). @destrutivo
 *
 * Escreve no ambiente: assumir uma tarefa de pool transfere a responsabilidade do GRUPO
 * para o usuário TOTVS-FS. Autorizado por `docs/politica-de-escrita.md` (base de homologação).
 *
 * ## O teste cria a própria massa e assume EXATAMENTE ela
 *
 * Esta é a terceira versão, e as duas anteriores erravam o alvo de formas diferentes:
 *
 * 1. A original fazia `assumirTarefa(0)` — a primeira tarefa da listagem. Num pool que
 *    mistura massa da automação com solicitações de colaboradores reais, isso podia
 *    sequestrar o trabalho de uma pessoa: assumir tira a tarefa da fila do grupo, e a
 *    partir daí nenhum outro membro a enxerga.
 * 2. A segunda varria os grupos e pegava a primeira tarefa com carimbo `QA`. Resolveu o
 *    risco grave, mas parou na metade: "uma tarefa QA" não é "a MINHA tarefa". As SCs que
 *    `tests/e2e/tarefas/acoes-da-tarefa.spec.js` cria para os casos CT-TSK-07/08 também
 *    carregam carimbo `QA` e caem neste mesmo pool — então este teste assumia a massa do
 *    vizinho, que ficava esperando por uma tarefa que já não estava mais lá.
 *
 * A regra da skill `playwright-test-creator` é explícita: *"cada teste monta seus próprios
 * pré-requisitos"* e *"independência total: a suíte funciona com execução individual, em
 * ordem diferente, em paralelo e em subconjunto"*. Um lock de exclusão mútua NÃO satisfaz
 * isso — só faz os testes se revezarem para continuar pegando a tarefa errada, um de cada
 * vez. Lock é para recurso genuinamente único do ambiente que não dá para isolar por massa
 * (a área de staging de upload, em `utils/exclusividade.js`); aqui dá, e é o que se faz.
 *
 * Por isso o teste agora: cria a SC, espera ELA chegar ao pool e assume ELA, por id. Nenhum
 * outro teste é afetado, e nenhuma tarefa alheia é tocada — a procedência deixa de ser um
 * filtro sobre massa de terceiros e passa a ser um fato: a SC nasceu aqui.
 *
 * Custo assumido: o teste passa a criar uma SC e a esperar a cadeia automática do BPMN
 * (~76s medidos entre o Enviar e a tarefa ficar assumível). É o preço da independência.
 *
 * ## A tarefa é devolvida ao pool no fim
 *
 * Correção de 27/08/2026 na skill `cassi-fluig-master`
 * (`references/artefatos-nao-processo.md` §6): **não existe botão "devolver ao pool", mas
 * "Transferir" numa atividade de GRUPO devolve a tarefa ao pool**. Medido: o clique dispara
 * `POST .../workflowView/send` com `selectedColleague: []`, o servidor lança
 * `BPMUserResponsibleNotInformedException` internamente e reatribui ao `Pool:Group:<grupo>`.
 *
 * A devolução roda em `finally`, como TEARDOWN: não carrega assertion e nunca lança — uma
 * falha de limpeza não pode mascarar a falha real do teste. Quem afirma o contrato da
 * devolução é CT-TSK-08-H, o caso dedicado a isso.
 *
 * ## CT-TSK-02, cenário S1 (concorrência) — não implementado
 *
 * Investigado e descartado: só existe UMA conta de automação (TOTVS-FS). Dois contextos de
 * navegador na mesma conta disputando a mesma tarefa não reproduzem "dois usuários" — são a
 * MESMA identidade para o servidor. Confirmado em campo (duas chamadas `takeTask` disparadas
 * em paralelo, via `Promise.all`, para a mesma tarefa/mesmo `taskUserId`): uma responde
 * `200 OK`, a outra `500` com `{"content":"ERROR","message":{"message":"Tarefa não
 * encontrada."}}` — não há duplicação, mas também não é o aviso amigável "tarefa já foi
 * assumida por outro usuário" que o caso descreve. O motivo está declarado em
 * `scripts/gerar-cobertura.mjs`.
 */
test.describe('Central de Tarefas — assumir tarefa do pool (CT-TSK-02-H) @destrutivo', () => {
  test('a SC própria deve aparecer no pool do Gestor Imediato e, assumida, ir para "Tarefas a concluir"', async ({
    page,
  }, testInfo) => {
    test.setTimeout(300_000);

    const tarefasPage = new CentralTarefasPage(page);
    const poolPage = new PoolTarefasPage(page);

    // ── Massa própria ───────────────────────────────────────────────────────────────────
    const { numeroProcesso } = await criarSolicitacaoCompraClassica(page, {
      justificativa: `QA CT-TSK-02-H assumir do pool ${Date.now()}`,
    });
    testInfo.annotations.push({ type: 'sc-criada', description: String(numeroProcesso) });

    // ── Espera a SC chegar ao pool ──────────────────────────────────────────────────────
    //
    // Entre o Enviar e a tarefa ficar assumível existe uma cadeia de atividades automáticas
    // do BPMN (gateway "Compra Centralizada?" → serviço "Grava SC e Anexos"), ~76s medidos em
    // campo, sem evento de rede estável para aguardar. Polling por CONDIÇÃO OBSERVÁVEL — a
    // própria SC aparecer na listagem do grupo —, nunca espera por tempo.
    //
    // O grupo é reaberto a cada tentativa porque abrir um grupo re-renderiza o painel do pool
    // e invalida os índices dos links.
    /** @type {string} */
    let grupoDoAlvo = '';

    await expect
      .poll(
        async () => {
          await tarefasPage.goto();
          await tarefasPage.expectCarregada();
          await poolPage.abrirGruposDoPool().catch(() => {});

          for (const grupo of (await poolPage.listarGrupos()).filter((g) => g.total > 0)) {
            await poolPage.abrirGrupo(grupo.indice);
            const ids = await poolPage.listarIdentificadoresDoGrupo();
            if (ids.includes(String(numeroProcesso))) {
              grupoDoAlvo = grupo.descricao;
              return true;
            }
            // Volta ao painel de grupos para inspecionar o próximo.
            await tarefasPage.goto();
            await tarefasPage.expectCarregada();
            await poolPage.abrirGruposDoPool().catch(() => {});
          }
          return false;
        },
        {
          message:
            `PRÉ-CONDIÇÃO AUSENTE: a SC ${numeroProcesso}, criada por este teste, não apareceu ` +
            'em nenhum grupo do pool em 180s. Entre o Enviar e a tarefa ficar assumível há uma ' +
            'cadeia de atividades automáticas do BPMN (~76s medidos); acima disso é lentidão ' +
            'do ambiente ou desvio de rota, não defeito do produto sob teste.',
          timeout: 180_000,
          intervals: [10_000, 15_000, 20_000],
        },
      )
      .toBe(true);

    testInfo.annotations.push({
      type: 'alvo-proprio',
      description: `processInstanceId=${numeroProcesso} grupo="${grupoDoAlvo}"`,
    });

    /** @type {string | null} */
    let idAssumido = null;

    try {
      // Assume EXATAMENTE a SC deste teste, ancorada no `data-process-key` do cartão.
      const idSolicitacao = await poolPage.assumirTarefaPorId(numeroProcesso);
      idAssumido = idSolicitacao;

      // "Acessar tarefa" abre a solicitação assumida em nova aba (mesmo padrão dos cards do
      // catálogo de processos, target="_blank").
      const abaDaTarefa = await poolPage.acessarTarefaAssumida();
      expect(
        abaDaTarefa.url(),
        `"Acessar tarefa" deveria abrir a tela de movimentação da solicitação assumida (${idSolicitacao})`,
      ).toContain(idSolicitacao);
      await expect(abaDaTarefa).toHaveTitle('Cassi - Fluig Plataforma - Movimentar Solicitação');
      await abaDaTarefa.close();

      // O efeito de negócio: a tarefa saiu do pool e entrou nas do usuário.
      //
      // ⚠️ NÃO basta ler os cartões renderizados. A UI traz `rows=15` em ordem CRESCENTE de
      // `processInstanceId`, e a tarefa recém-assumida tem o maior id — fica fora do lote
      // exibido. Medido em 25/08/2026: o teste reprovava com
      // `([112097…112307]) deveriam incluir 112312`, e a tarefa ESTAVA na listagem; o oráculo
      // é que era míope. A varredura paginada vive em `utils/central-tarefas-paginacao.js`.
      await tarefasPage.goto();
      await tarefasPage.expectCarregada();

      const registro = await poolPage.localizarTarefaAConcluirPorId(idSolicitacao);

      expect(
        registro,
        `a solicitação assumida (${idSolicitacao}) deveria estar em "Tarefas a concluir" — ` +
          'varrida a listagem inteira, paginando em ordem decrescente, e ela não apareceu. ' +
          'Assumir do pool transfere a responsabilidade do GRUPO para o usuário, então ela tem ' +
          'de sair do pool e entrar nas dele.',
      ).not.toBeNull();

      expect(
        registro?.processInstanceId !== undefined ? String(registro.processInstanceId) : null,
        'o registro encontrado tem que ser exatamente a solicitação assumida',
      ).toBe(String(idSolicitacao));
    } finally {
      // ── Teardown: devolve a tarefa ao pool ────────────────────────────────────────────
      // Sem assertion e sem lançar, de propósito: se uma assertion acima falhou, é ELA que
      // tem de chegar ao runner. O contrato da devolução é afirmado por CT-TSK-08-H.
      if (idAssumido) {
        const id = idAssumido;
        const acoes = new AcoesDaTarefaPage(page);

        // A transferência é ASSÍNCRONA: o clique dispara o `POST .../workflowView/send` e a
        // reatribuição ao grupo acontece no servidor depois. Uma versão anterior apenas
        // clicava e retornava — o contexto fechava antes de o servidor processar, e a tarefa
        // ficava presa com `assignee: TOTVS-FS` (conferido na API). Espera-se pela CONDIÇÃO.
        const resultado = await (async () => {
          // O `currentMovto` vem da API, não do parâmetro da URL da aba: ler
          // `app_ecm_workflowview_currentMovto` da URL devolvia `null`, e o `finally` inteiro
          // era pulado em silêncio (sem devolução E sem anotação).
          const movto = await page.evaluate(async (processInstanceId) => {
            const r = await fetch(
              `/process-management/api/v2/requests/${processInstanceId}/tasks?pageSize=60`,
              { credentials: 'include' },
            );
            if (!r.ok) return null;
            const j = await r.json();
            const aberta = (j.items || []).find(
              (/** @type {any} */ t) => t.status === 'NOT_COMPLETED',
            );
            return aberta ? String(aberta.movementSequence) : null;
          }, id);

          if (!movto) throw new Error('não foi possível ler o movimento aberto da tarefa na API');

          await acoes.abrirTarefa({
            processInstanceId: id,
            currentMovto: movto,
            taskUserId: envObrigatoria('QA_USERNAME'),
          });
          await acoes.acionarTransferir();

          /** @type {string | null} */
          let assignee = null;
          await expect(async () => {
            assignee = await page.evaluate(async (processInstanceId) => {
              const r = await fetch(
                `/process-management/api/v2/requests/${processInstanceId}/tasks?pageSize=60`,
                { credentials: 'include' },
              );
              if (!r.ok) return null;
              const j = await r.json();
              const aberta = (j.items || []).find(
                (/** @type {any} */ t) => t.status === 'NOT_COMPLETED',
              );
              return aberta && aberta.assignee ? String(aberta.assignee.code) : null;
            }, id);
            expect(assignee).toMatch(/^Pool:Group:/);
          }).toPass({ timeout: 90_000, intervals: [3_000, 5_000, 10_000] });

          return `devolvida ao pool via "Transferir" — assignee agora ${assignee}`;
        })().catch(
          (erro) =>
            `FALHOU — a tarefa segue com a conta da automação e precisa ser devolvida à mão: ${String(erro).slice(0, 200)}`,
        );

        testInfo.annotations.push({
          type: 'devolucao-ao-pool',
          description: `processInstanceId=${id} — ${resultado}`,
        });
      }
    }
  });
});
