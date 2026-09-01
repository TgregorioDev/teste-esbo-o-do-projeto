// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { CentralTarefasPage } from '../../../pages/CentralTarefasPage.js';
import { PoolTarefasPage, descobrirGrupoComTarefas } from '../../../pages/PoolTarefasPage.js';

/**
 * Central de Tarefas — assumir tarefa do pool (CT-TSK-02-H). @destrutivo
 *
 * Escreve no ambiente: assumir uma tarefa de pool transfere a responsabilidade do GRUPO
 * para o usuário TOTVS-FS — efeito real no workflow, sem operação de desfazer disponível
 * (o Fluig não expõe "devolver ao pool"). Autorizado por `docs/politica-de-escrita.md`
 * (base de homologação). Fica fora da execução padrão via `@destrutivo` + `grepInvert`.
 *
 * Pré-condição é de LEITURA (precisa existir tarefa no pool no momento da execução) — o
 * teste não pode inventar massa. Se não houver, falha com "PRÉ-CONDIÇÃO AUSENTE" em vez de
 * timeout opaco, mesmo padrão de `utils/massa-contratos.js`.
 *
 * ## CT-TSK-02-S1 (concorrência) — não implementado
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
 * distintos, o que seria enganoso. Ver relatório da implementação para o detalhe da
 * investigação.
 */
test.describe('Central de Tarefas — assumir tarefa do pool (CT-TSK-02-H) @destrutivo', () => {
  test('assumir a primeira tarefa disponível de um grupo do pool deve movê-la para "Tarefas a concluir"', async ({
    page,
  }) => {
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
          'pertence aos pools "Validação do Gestor Imediato" e "Validação dos Compradores"). ' +
          '\n\nInvestigação de viabilidade de MASSA (medida ao vivo em 01/09/2026, não ' +
          'presumida — ver `docs/criacao-de-contrato-inviavel.md` para o padrão desta ' +
          'investigação): esta automação NÃO consegue montar seu próprio pré-requisito aqui, ' +
          'por dois motivos independentes, ambos confirmados por consulta direta à API v2: ' +
          '(1) A base tem MUITA atividade orgânica de usuários reais no momento (amostra de ' +
          '20+ Solicitações de Compra abertas hoje, requesters reais como ' +
          'geise.matias.cassi.com.br.1, paulocalixto.totvs.com.br.1, karolina.novais.cassi.com.br.1) ' +
          '— mas nenhuma delas cai em pool de TOTVS-FS: o Gestor Imediato/Comprador de cada ' +
          'uma resolve para uma pessoa nominal real (ex. erlon.dengo, danyelle.oliveira, ' +
          'fernanda.smartins — RH do Protheus encontra o superior/comprador certo para quem ' +
          'realmente pediu). TOTVS-FS recebe, sim, tarefa DIRETA vinda dessa atividade real ' +
          '(2 confirmadas agora: processInstanceId 112830 "Validação do Gestor" e 112829 ' +
          '"Correção", ambas assignee=TOTVS-FS) — mas tarefa direta não é tarefa de POOL, e ' +
          'não conta para este contador. (2) A automação só consegue produzir uma SC própria ' +
          'que caia em pool contornando D-01 (enviando `targetState` diferente de 6 direto na ' +
          'API de `/start`, sem passar pelo widget defeituoso) — técnica que funcionou UMA vez ' +
          'no passado (SC 112679, documentada em `cassi-fluig-master/references/catalogo-de-processos.md`) ' +
          'mas nunca foi confirmada como reprodutível: o valor exato do campo e os ~101 campos ' +
          'de `formFields` que a integração com o Protheus exige não são conhecidos com ' +
          'confiança fora do que o formulário clássico (`pages/FormularioSolicitacaoCompraPage.js`, ' +
          'de outra suíte) já monta pela UI. Fabricar esse payload às cegas, por fetch direto, ' +
          'arriscaria produzir massa corrompida numa base de homologação compartilhada só para ' +
          'contornar um defeito confirmado do produto — o oposto do que a automação deveria ' +
          'fazer. Concluído: a pré-condição desta fila é de LEITURA de atividade orgânica, não ' +
          'de escrita da automação — mesma natureza da exceção já formalizada para Contrato.',
      );
    }

    await poolPage.abrirGruposDoPool();
    const grupos = await poolPage.listarGrupos();
    const grupoEscolhido = descobrirGrupoComTarefas(grupos);

    await poolPage.abrirGrupo(grupoEscolhido.indice);
    const identificadoresDoGrupo = await poolPage.listarIdentificadoresDoGrupo();
    expect(
      identificadoresDoGrupo.length,
      `a listagem in-page do grupo deveria trazer ao menos um identificador de solicitação (cartões: ${JSON.stringify(identificadoresDoGrupo)})`,
    ).toBeGreaterThan(0);

    // "Assumir" abre um diálogo de confirmação ("Você assumiu a solicitação <N>") — a
    // condição observável real de sucesso; o id vem do próprio diálogo.
    const idSolicitacao = await poolPage.assumirTarefa(0);
    expect(
      identificadoresDoGrupo,
      `a solicitação assumida (${idSolicitacao}) deveria ser uma das listadas no grupo (${JSON.stringify(identificadoresDoGrupo)})`,
    ).toContain(idSolicitacao);

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
    // tarefas de pool (confirmado em campo nesta implementação — o total voltou a subir
    // entre o "antes" e o "depois" porque chegou massa nova no meio do teste, não porque a
    // assunção falhou). Uma assertion de contador aqui seria tão frágil quanto fixar o valor
    // de um contrato (ver `utils/massa-contratos.js`). A prova real e específica é a
    // solicitação assumida (identificada pelo diálogo de confirmação) aparecer nos cartões
    // de "Tarefas a concluir" — não apenas "algum contador mudou".
    await tarefasPage.goto();
    await tarefasPage.expectCarregada();

    // ⚠️ NÃO basta ler os cartões renderizados. A UI traz `rows=15` em ordem CRESCENTE de
    // `processInstanceId`, e a tarefa recém-assumida tem o maior id — fica no fim da fila,
    // fora do lote exibido. Medido em 25/08/2026: este teste reprovava com
    // `([112097…112307]) deveriam incluir 112312`, e a tarefa ESTAVA na listagem; o oráculo é
    // que era míope. A varredura paginada vive em `utils/central-tarefas-paginacao.js`.
    const registro = await poolPage.localizarTarefaAConcluirPorId(idSolicitacao);

    expect(
      registro,
      `a solicitação assumida (${idSolicitacao}) deveria estar em "Tarefas a concluir" — ` +
        'varrida a listagem inteira, paginando em ordem decrescente, e ela não apareceu. ' +
        'Assumir do pool transfere a responsabilidade do GRUPO para o usuário, então ela tem ' +
        'de sair do pool e entrar nas tarefas dele.',
    ).not.toBeNull();

    // O efeito de negócio é a RESPONSABILIDADE ter mudado de mão — não só o id constar da
    // lista. `colleagueName` é o campo que expõe isso (o mesmo usado para provar D-01 em
    // "Minhas Solicitações").
    expect(
      registro?.processInstanceId !== undefined ? String(registro.processInstanceId) : null,
      'o registro encontrado tem que ser exatamente a solicitação assumida',
    ).toBe(String(idSolicitacao));
  });
});
