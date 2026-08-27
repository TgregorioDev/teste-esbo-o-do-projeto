// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { CentralTarefasPage } from '../../../pages/CentralTarefasPage.js';
import { PoolTarefasPage, descobrirGrupoComTarefas } from '../../../pages/PoolTarefasPage.js';
import { AcoesDaTarefaPage } from '../../../pages/AcoesDaTarefaPage.js';
import { classificarAlvosDoLivro } from '../../../utils/cancelamento-fluig.js';
import { envObrigatoria } from '../../../config/ambiente.js';

/**
 * Central de Tarefas — assumir tarefa do pool (CT-TSK-02-H). @destrutivo
 *
 * Escreve no ambiente: assumir uma tarefa de pool transfere a responsabilidade do GRUPO
 * para o usuário TOTVS-FS. Autorizado por `docs/politica-de-escrita.md` (base de
 * homologação), com duas condições que este teste cumpre e que antes faltavam.
 *
 * ## 1. Só se assume tarefa com procedência QA comprovada
 *
 * O pool do usuário são os grupos "Validação do Gestor Imediato" e "Validação dos
 * Compradores", que recebem SCs de colaboradores reais junto com a massa da automação.
 * Assumir tira a tarefa da fila do grupo — a partir daí nenhum outro membro a enxerga —,
 * então escolher "a primeira da lista" pode sequestrar o trabalho de uma pessoa.
 *
 * O alvo é decidido pelo SERVIDOR, não pela ordem da tela: `classificarAlvosDoLivro` lê
 * `?expand=formFields` de cada solicitação do grupo e devolve só as que têm o carimbo `QA`
 * no formulário — o mesmo predicado que o `globalTeardown` usa para decidir o que pode
 * cancelar. Sem candidata carimbada, o teste falha com "PRÉ-CONDIÇÃO AUSENTE": é ambiente,
 * não defeito.
 *
 * ## 2. A tarefa é devolvida ao pool no fim
 *
 * Correção de 27/08/2026 na skill `cassi-fluig-master`
 * (`references/artefatos-nao-processo.md` §6): **não existe botão "devolver ao pool", mas
 * "Transferir" numa atividade de GRUPO devolve a tarefa ao pool**. Medido: o clique dispara
 * `POST .../workflowView/send` com `selectedColleague: []`, o servidor lança
 * `BPMUserResponsibleNotInformedException` internamente e reatribui ao `Pool:Group:<grupo>`.
 * Tarefa de pool é, por definição, atividade de grupo — então a devolução se aplica aqui.
 *
 * A versão anterior deste arquivo afirmava o contrário ("sem operação de desfazer
 * disponível") e usava isso para justificar deixar a tarefa assumida como resíduo
 * permanente. A afirmação estava desatualizada, e a própria suíte já exercitava a devolução
 * em `tests/e2e/tarefas/acoes-da-tarefa.spec.js` (CT-TSK-08-H).
 *
 * A devolução roda em `finally`, como TEARDOWN: ela não carrega assertion e nunca lança —
 * uma falha de limpeza não pode mascarar a falha real do teste. Quem afirma o contrato da
 * devolução é CT-TSK-08-H, que é o caso dedicado a isso.
 *
 * ## CT-TSK-02, cenário S1 (concorrência) — não implementado
 *
 * Investigado e descartado: só existe UMA conta de automação (TOTVS-FS). Dois contextos de
 * navegador na mesma conta disputando a mesma tarefa não reproduzem "dois usuários" — são a
 * MESMA identidade para o servidor. Confirmado em campo (duas chamadas `takeTask` disparadas
 * em paralelo, via `Promise.all`, para a mesma tarefa/mesmo `taskUserId`): uma responde
 * `200 OK`, a outra `500` com `{"content":"ERROR","message":{"message":"Tarefa não
 * encontrada."}}` — não há duplicação, mas também não é o aviso amigável "tarefa já foi
 * assumida por outro usuário" que o caso descreve; é uma exceção genérica de backend (stack
 * trace, sem tratamento de UI), porque o servidor nunca chega a avaliar "outro usuário" —
 * ambas as chamadas SÃO o mesmo usuário. Um teste automatizado aqui documentaria um artefato
 * de reuso de sessão como se fosse a regra de negócio de concorrência entre usuários
 * distintos, o que seria enganoso. O motivo está declarado em `scripts/gerar-cobertura.mjs`.
 */
test.describe('Central de Tarefas — assumir tarefa do pool (CT-TSK-02-H) @destrutivo', () => {
  test('assumir uma tarefa de procedência QA do pool deve movê-la para "Tarefas a concluir"', async ({
    page,
  }, testInfo) => {
    const tarefasPage = new CentralTarefasPage(page);
    const poolPage = new PoolTarefasPage(page);

    await tarefasPage.goto();
    await tarefasPage.expectCarregada();

    const poolAntes = await tarefasPage.resumoTarefasEmPool();

    if (poolAntes.total === 0) {
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE: o Resumo de Tarefas anuncia "Tarefas em pool (0)" no momento ' +
          'da execução. Não há tarefa de pool disponível para assumir agora — isto NÃO é ' +
          'defeito do produto sob teste. Reexecute quando houver massa (o usuário TOTVS-FS ' +
          'pertence aos pools "Validação do Gestor Imediato" e "Validação dos Compradores").',
      );
    }

    await poolPage.abrirGruposDoPool();
    const grupos = await poolPage.listarGrupos();

    // `descobrirGrupoComTarefas` continua sendo o guarda de "existe algum grupo com tarefa";
    // ele lança PRÉ-CONDIÇÃO AUSENTE com a lista completa quando não existe nenhum.
    descobrirGrupoComTarefas(grupos);

    // ── Procedência: o servidor decide o alvo, não a ordem da tela ──────────────────────
    //
    // A varredura passa por TODOS os grupos com tarefa pendente, não só o primeiro: a massa
    // carimbada da automação cai ora em "Validação do Gestor Imediato", ora em "Validação
    // dos Compradores", conforme a etapa em que a SC está. Parar no primeiro grupo faria o
    // teste desistir com "sem massa QA" enquanto havia massa QA no grupo seguinte — medido
    // ao implementar esta correção.
    const prefixoQA = process.env.QA_DATA_PREFIX ?? 'QA';
    /** @type {Array<{ grupo: string, ids: string[] }>} */
    const inspecionados = [];
    /** @type {{ processInstanceId: number, processId: string, carimbo: string } | null} */
    let alvo = null;
    let grupoDoAlvo = '';

    // ⚠️ Re-navega a cada grupo em vez de reaproveitar o índice da primeira listagem: abrir
    // um grupo re-renderiza o painel do pool e invalida os índices dos demais links.
    // Medido ao implementar esta correção — `abrirGrupo(indice)` estourava com
    // `waiting for locator(...POOL...).nth(1)` no segundo grupo. O `descricao` é a chave
    // estável entre uma listagem e a seguinte.
    const descricoesComTarefa = grupos.filter((g) => g.total > 0).map((g) => g.descricao);

    for (const descricao of descricoesComTarefa) {
      await tarefasPage.goto();
      await tarefasPage.expectCarregada();
      await poolPage.abrirGruposDoPool();

      const grupoAgora = (await poolPage.listarGrupos()).find((g) => g.descricao === descricao);
      if (!grupoAgora) continue;

      await poolPage.abrirGrupo(grupoAgora.indice);
      const ids = await poolPage.listarIdentificadoresDoGrupo();
      inspecionados.push({ grupo: descricao, ids });
      if (ids.length === 0) continue;

      const { comCarimbo } = await classificarAlvosDoLivro(page, ids, prefixoQA);
      if (comCarimbo.length > 0) {
        alvo = comCarimbo[0];
        grupoDoAlvo = descricao;
        break;
      }
    }

    if (!alvo) {
      throw new Error(
        `PRÉ-CONDIÇÃO AUSENTE: nenhuma tarefa com carimbo "${prefixoQA}" no formulário entre os ` +
          `grupos de pool inspecionados: ${JSON.stringify(inspecionados)}. ` +
          'Assumir uma delas tiraria da fila do grupo uma solicitação que pode ser de um ' +
          'colaborador real — isto NÃO é defeito do produto sob teste. Reexecute depois de ' +
          'um teste que crie SC (por exemplo `tests/e2e/compras/ciclo-solicitacao-compras.spec.js`), ' +
          'que popula estes mesmos pools com massa carimbada.',
      );
    }

    testInfo.annotations.push({
      type: 'grupo-do-alvo',
      description: `${grupoDoAlvo} — grupos inspecionados: ${JSON.stringify(inspecionados)}`,
    });
    testInfo.annotations.push({
      type: 'procedencia-do-alvo',
      description: `processInstanceId=${alvo.processInstanceId} processId=${alvo.processId} carimbo="${alvo.carimbo}" grupo="${grupoDoAlvo}"`,
    });

    /** @type {string | null} */
    let idAssumido = null;

    try {
      const idSolicitacao = await poolPage.assumirTarefaPorId(alvo.processInstanceId);
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

      // Volta para a Central de Tarefas e confirma o efeito de negócio esperado: a tarefa
      // saiu do pool e foi para "minhas tarefas".
      //
      // A prova NÃO é o contador agregado de "Tarefas em pool"/"Tarefas a concluir" antes vs.
      // depois: este é um ambiente de homologação compartilhado com fluxo contínuo de novas
      // tarefas de pool (confirmado em campo — o total voltou a subir entre o "antes" e o
      // "depois" porque chegou massa nova no meio do teste, não porque a assunção falhou).
      // Uma assertion de contador aqui seria tão frágil quanto fixar o valor de um contrato
      // (ver `utils/massa-contratos.js`). A prova real e específica é a solicitação assumida
      // aparecer nos cartões de "Tarefas a concluir" — não apenas "algum contador mudou".
      await tarefasPage.goto();
      await tarefasPage.expectCarregada();

      // ⚠️ NÃO basta ler os cartões renderizados. A UI traz `rows=15` em ordem CRESCENTE de
      // `processInstanceId`, e a tarefa recém-assumida tem o maior id — fica no fim da fila,
      // fora do lote exibido. Medido em 25/08/2026: este teste reprovava com
      // `([112097…112307]) deveriam incluir 112312`, e a tarefa ESTAVA na listagem; o oráculo
      // é que era míope. A varredura paginada vive em `utils/central-tarefas-paginacao.js`.
      const registro = await poolPage.localizarTarefaAConcluirPorId(idSolicitacao);

      expect(
        registro,
        `a solicitação assumida (${idSolicitacao}) deveria estar em "Tarefas a concluir" — ` +
          'varrida a listagem inteira, paginando em ordem decrescente, e ela não apareceu. ' +
          'Assumir do pool transfere a responsabilidade do GRUPO para o usuário, então ela tem ' +
          'de sair do pool e entrar nas tarefas dele.',
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

        // ⚠️ A transferência é ASSÍNCRONA do ponto de vista da tela: o clique dispara o
        // `POST .../workflowView/send` e a reatribuição ao grupo acontece no servidor
        // depois. Medido ao implementar esta correção: uma primeira versão apenas clicava e
        // retornava — o contexto do teste fechava antes de o servidor processar, e a tarefa
        // ficava presa com `assignee: TOTVS-FS` (conferido na API: SC 112821 em "Validação
        // do Gestor" seguia com a conta da automação). Devolução que não espera o servidor
        // é devolução que não acontece. Mesma espera por CONDIÇÃO que CT-TSK-08-H usa.
        const resultado = await (async () => {
          // O `currentMovto` vem da API, não do parâmetro da URL da aba: medido ao
          // implementar esta correção, ler `app_ecm_workflowview_currentMovto` da URL
          // devolvia `null`, o `finally` inteiro era pulado em silêncio (sem devolução E sem
          // anotação) e a tarefa ficava presa com a conta da automação. A tarefa aberta é a
          // única `NOT_COMPLETED` da solicitação — é ela que se reabre para transferir.
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
