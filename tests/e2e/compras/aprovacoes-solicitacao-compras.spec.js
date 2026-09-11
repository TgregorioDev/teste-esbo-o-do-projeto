// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../../utils/pre-condicao.js';
import { CentralTarefasComprasPage } from '../../../pages/CentralTarefasComprasPage.js';
import { criarJustificativaDecisao } from '../../../factories/produto-compra.js';
import { criarEAssumirNoPoolDoGestor } from '../../../utils/massa-sc-api.js';
import { aguardarEstadoNoServidor, lerCamposDoFormulario } from '../../../utils/estado-da-solicitacao.js';

/**
 * CT-CMP-04-H, CT-CMP-04-S1, CT-CMP-05-S1, CT-CMP-05-H e CT-CMP-06-H — ciclo de APROVAÇÃO
 * da Solicitação de Compras, a partir da Central de Tarefas → Tarefas em pool.
 *
 * ## Cada teste cria a própria massa — por API, desde 11/09/2026
 *
 * A SC de origem é criada pelo próprio teste, pela fixture `solicitacaoAssumida` (ou por
 * `criarEAssumirNoPoolDoGestor`, quando o teste precisa fixar valores): `POST /start` com
 * `targetState: 0` (`utils/massa-sc-api.js`). O que estes testes medem é a DECISÃO na tarefa, e
 * criar pelo formulário clássico só somava ~4 min e as falhas do formulário. A espera entre o
 * `/start` e a tarefa assumível é por estado NO SERVIDOR (a SC sair da integração e cair na
 * Validação do Gestor); prazo estourado, ou desvio para Correção/"Ajustar Informações", é
 * pré-condição de ambiente, com a leitura na mensagem. A tarefa é assumida pela tela de detalhe
 * da PRÓPRIA SC, que a identifica por número — o painel-resumo "Tarefas em pool" trabalha com
 * cache e já foi medido desatualizado.
 *
 * Confirmado em campo: o usuário de automação pertence ao grupo `Grupo de Compras -
 * Validação do Gestor Imediato da Req. de Compras`. Quando o Fluig não encontra o gestor
 * imediato do solicitante (sempre o caso neste ambiente de homologação, usuário sem gestor
 * cadastrado), a tarefa cai para esse GRUPO em vez de travar, com o comentário automático
 * "Atenção! Não foi possivel obter as informações do Superior Responsável pelo Colaborador
 * requerente da Solicitação de Compras." registrado no Histórico — é assim que toda SC da
 * automação vira massa de pool, de forma previsível.
 *
 * ## Chamados cobertos por este arquivo
 *
 * O bloco acrescentado ao teste de aprovação cobre FSWTBC-2681 (a grade do Gestor tem
 * exatamente uma linha em edição) e FSWTBC-5035 (a filial aparece como "<código> - <nome>").
 * Ambos são lidos da MESMA SC que o teste já criava e assumia.
 *
 * FSWTBC-4527 fica registrado em anotação, não em assertion: a conta de automação não tem
 * gestor nominal, então a tarefa cai no pool (`Pool:Group:G.P.Requisicao_de_Compras_Gestor_
 * Imediato`) — comportamento REAL medido, de polaridade `@achado`, que misturado a um teste de
 * caminho feliz produziria vermelho pelo motivo errado.
 *
 * A declaração fica no cabeçalho porque é onde `scripts/gerar-cobertura.mjs` reconhece
 * cobertura — ID citado só em comentário no meio do arquivo NÃO conta.
 */

const GRUPO_COMPRADOR = /Valida[çc][ãa]o (d[eo]s?)? ?Comprador/i;
const GRUPO_ORCAMENTARIA = /Or[çc]ament[áa]ria/i;

test.describe('Validação do Gestor Imediato (Tarefas em pool)', () => {
  /**
   * CT-CMP-04-H — Gestor Imediato aprova.
   *
   * Central de Tarefas → Tarefas em pool → assumir → aprovar (Sim) com justificativa.
   * Esperado: o Histórico registra a decisão do aprovador (rastro de movimentação) — a
   * confirmação de negócio disponível nesta tela, já que o próximo estado ("Validação
   * Orçamentária") depende de configuração de alçada que esta suíte não controla (ver
   * CT-CMP-05-S1 abaixo, no mesmo describe, para o que acontece quando essa configuração
   * falta).
   */
  test('@destrutivo deve assumir e aprovar uma tarefa do pool do Gestor Imediato', async ({ page, solicitacaoAssumida }, testInfo) => {
    // Criar a SC + aguardar chegar ao pool (~76s+) + assumir + decidir: mais longo que o
    // timeout padrão da suíte, pela mesma razão do teste de criação em
    // `ciclo-solicitacao-compras.spec.js`.
    testInfo.setTimeout(300_000);

    const central = new CentralTarefasComprasPage(page);
    const { numeroProcesso } = solicitacaoAssumida;

    // ─────────────────────────────────────────────────────────────────────────────────────
    // FSWTBC-2681, 5035 e 4527 — o estado da grade do Gestor ANTES da decisão.
    //
    // O teste já criava a SC e assumia a tarefa; o que a grade `tbManager` contém nesse
    // momento nunca foi afirmado. Três chamados vivem aí, e nenhum custa massa nova.
    // ─────────────────────────────────────────────────────────────────────────────────────
    const grade = await page.evaluate(async (instancia) => {
      const r = await fetch(
        `/process-management/api/v2/requests/${instancia}?expand=formFields`,
        { headers: { Accept: 'application/json' } },
      );
      if (!r.ok) return null;
      const corpo = await r.json();
      /** @type {Record<string,string>} */
      const campos = {};
      for (const f of corpo?.formFields ?? []) campos[f.field] = f.value;

      // A grade é uma tabela-mãe: cada linha ganha sufixo `___N`. `tbmanag_historico` marca
      // as linhas de HISTÓRICO ('true'); a linha em edição é a que vem 'false'.
      const sufixos = Object.keys(campos)
        .filter((k) => k.startsWith('tbmanag_historico'))
        .map((k) => k.replace('tbmanag_historico', ''));

      return {
        ativas: sufixos.filter((s) => campos[`tbmanag_historico${s}`] === 'false'),
        historicas: sufixos.filter((s) => campos[`tbmanag_historico${s}`] === 'true'),
        matricula: campos[`tbmanag_matriculaValid${sufixos[0] ?? ''}`] ?? '',
        filialExibida: campos.zoomCodNomeFilial ?? '',
        codFilial: campos.codFilial ?? '',
      };
    }, numeroProcesso);

    if (!grade) {
      faltaPreCondicao(
        `(ambiente): não foi possível ler os campos da SC ${numeroProcesso} pela API de processos`,
      );
    }

    test.info().annotations.push({
      type: 'grade-do-gestor',
      description:
        `linhas ativas ${grade.ativas.length}, históricas ${grade.historicas.length}; ` +
        `matrícula do validador "${grade.matricula}"; filial exibida "${grade.filialExibida}"`,
    });

    // FSWTBC-2681 — exatamente UMA linha em edição. Mais de uma significa que o gestor vê
    // duas decisões abertas para a mesma SC e não sabe qual vale.
    expect(
      grade.ativas,
      `a grade do Gestor Imediato deveria ter exatamente uma linha em edição, e tem ` +
        `${grade.ativas.length} (históricas: ${grade.historicas.length})`,
    ).toHaveLength(1);

    // FSWTBC-5035 — a filial é exibida como "<código> - <nome>", não só o código. É o que
    // permite ao gestor saber de qual unidade é a compra que ele está aprovando.
    expect(
      grade.filialExibida,
      `a filial deveria aparecer como "<código> - <nome>", e veio "${grade.filialExibida}"`,
    ).toMatch(/^\d{3,5}\s+-\s+\S+/);
    expect(
      grade.filialExibida.startsWith(grade.codFilial),
      `a filial exibida ("${grade.filialExibida}") deveria começar pelo código gravado ` +
        `("${grade.codFilial}")`,
    ).toBe(true);

    // FSWTBC-4527 — anotação, não assertion: a conta de automação não tem gestor nominal
    // cadastrado, então a tarefa cai no POOL (`Pool:Group:G.P.Requisicao_de_Compras_Gestor_I`).
    // Esse é o comportamento REAL medido, e afirmá-lo aqui misturaria a polaridade de `@achado`
    // com a de um teste de caminho feliz. Fica registrado para o dia em que houver gestor
    // nominal — aí o caso vira teste próprio.

    const justificativa = criarJustificativaDecisao('aprovação');
    await central.decidirEEnviar({ aprovar: true, justificativa });

    // Confirmação de negócio: a atividade atual do processo deixou de ser "Validação do
    // Gestor" — a aprovação MOVIMENTOU o processo para a próxima etapa (observado em campo:
    // "Distribuição Gestor Orçamentario"). A linha "Atividade atual" fica fixa no topo do
    // Histórico (sem precisar rolar uma lista potencialmente virtualizada para achar a
    // justificativa entre dezenas de eventos automáticos do sistema).
    await central.abrirDetalheAposConfirmacao(numeroProcesso);
    let atividade = '';
    await expect(async () => {
      atividade = await central.lerNomeAtividadeAtual();
      expect(atividade.length).toBeGreaterThan(0);
    }).toPass({ timeout: 30_000 });
    // "Ajustar Informações" também reprova: é para onde o gateway 9 manda a SC quando a aprovação chega
    // sem `managerAprovadoValidacao` — e a tela diz "movimentada com sucesso" do mesmo jeito. Só olhar a
    // saída da Validação do Gestor aceitava esse desvio como aprovação (SC 96503, 11/09/2026).
    expect(
      atividade,
      'aprovar deveria avançar a atividade para além de "Validação do Gestor" — e não desviar para "Ajustar Informações"',
    ).not.toMatch(/Validação do Gestor|Ajustar Informações/i);

    test.info().annotations.push({
      type: 'solicitacao-aprovada',
      description: `processo=${numeroProcesso} justificativa="${justificativa}" novaAtividade="${atividade}"`,
    });
  });

  /**
   * CT-CMP-04-S1 — Gestor Imediato reprova com justificativa.
   *
   * Esperado: a reprovação é registrada com a justificativa (o caso de teste descreve
   * "volta para correção com o solicitante, dados preservados" — o Histórico é o oráculo
   * verificável nesta tela; a etapa de correção em si é uma tarefa nova do solicitante, fora
   * do escopo do pool do Gestor Imediato que este teste exercita).
   */
  test('@destrutivo deve assumir e reprovar uma tarefa do pool do Gestor Imediato com justificativa', async ({
    page,
    solicitacaoAssumida,
  }, testInfo) => {
    testInfo.setTimeout(300_000);

    const central = new CentralTarefasComprasPage(page);
    const { numeroProcesso } = solicitacaoAssumida;

    const justificativa = criarJustificativaDecisao('reprovação');
    await central.decidirEEnviar({ aprovar: false, justificativa });

    // Mesma técnica de confirmação de CT-CMP-04-H: a atividade atual muda de "Validação do
    // Gestor" — aqui espera-se ir para uma etapa de correção/ajuste com o solicitante, não
    // para a etapa seguinte de aprovação (o caso de teste descreve "volta para correção").
    await central.abrirDetalheAposConfirmacao(numeroProcesso);
    let atividade = '';
    await expect(async () => {
      atividade = await central.lerNomeAtividadeAtual();
      expect(atividade.length).toBeGreaterThan(0);
    }).toPass({ timeout: 30_000 });
    expect(atividade, 'reprovar deveria tirar a atividade de "Validação do Gestor"').not.toMatch(
      /Validação do Gestor/i,
    );

    test.info().annotations.push({
      type: 'solicitacao-reprovada',
      description: `processo=${numeroProcesso} justificativa="${justificativa}" novaAtividade="${atividade}" pareceCorrecao=${/ajust|correç/i.test(atividade)}`,
    });
  });

  /**
   * CT-CMP-05-S1 — valor acima da alçada sem aprovador configurado deve ser sinalizado
   * explicitamente, nunca travar em silêncio. O erro de campo documentado é: "Não foi
   * encontrado nenhum usuário habilitado para ser movimentada a tarefa...".
   *
   * Esta suíte não controla QUAL Solicitação de Compras do pool tem valor acima de alçada
   * sem aprovador — é característica do dado descoberto, não algo que o teste possa fixar.
   * Por isso o teste aprova a tarefa (mesma ação de CT-CMP-04-H) e verifica, de forma
   * incondicional, que o sistema NUNCA fica em um estado ambíguo: ou a movimentação avança
   * (Histórico ganha o registro da decisão) OU o sistema sinaliza explicitamente a
   * indisponibilidade de aprovador — nunca as duas coisas ausentes ao mesmo tempo (tela
   * branca / trava silenciosa).
   */
  test('@destrutivo deve sinalizar explicitamente quando não há aprovador habilitado para a próxima etapa', async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(300_000);

    const central = new CentralTarefasComprasPage(page);
    // Valor deliberadamente alto (500 × R$ 50.000,00 = R$ 25.000.000,00) tentando cruzar um
    // limite de alçada — a massa padrão (R$ 200,00) nunca reproduziu o cenário em execuções
    // anteriores desta suíte (a decisão sempre avançou normalmente para "Distribuição Gestor
    // Orçamentario"). Mesmo assim a assertion abaixo continua incondicional: ou a mensagem
    // de alçada aparece, ou a atividade avança — o teste não presume qual das duas.
    const { numeroProcesso } = await criarEAssumirNoPoolDoGestor(page, { quantidade: 500, precoUnitario: 50_000 });

    const justificativa = criarJustificativaDecisao('aprovação (alçada)');
    await central.decidirEEnviar({ aprovar: true, justificativa });

    const mensagemAlcada = page.getByText(/N[ãa]o foi encontrado nenhum usu[áa]rio habilitado/i).first();
    await central.abrirDetalheAposConfirmacao(numeroProcesso);

    // Condição incondicional: OU a mensagem de alçada aparece explicitamente, OU a
    // atividade avança normalmente (prova de que não há trava silenciosa) — nunca as duas
    // ausentes (nem mensagem, nem avanço).
    //
    // As duas leituras ficam DENTRO do mesmo polling. Antes a atividade era esperada num `try`
    // cujo `catch` descartava o erro, e a mensagem de alçada era lida uma única vez depois,
    // num instante: o veredito dependia de onde essa leitura caía, e a falha perdia a
    // atividade que o polling tinha visto.
    let alcadaVisivel = false;
    let atividade = '';
    await expect(async () => {
      alcadaVisivel = await mensagemAlcada.isVisible();
      atividade = alcadaVisivel ? '' : await central.lerNomeAtividadeAtual();
      expect(
        alcadaVisivel || (atividade.length > 0 && !/Validação do Gestor|Ajustar Informações/i.test(atividade)),
        'esperado: mensagem explícita de alçada OU avanço real da atividade — não os dois ausentes. ' +
          `Atividade atual lida na tela: "${atividade}"`,
      ).toBe(true);
    }).toPass({ timeout: 30_000 });

    test.info().annotations.push({
      type: 'alcada-sem-aprovador',
      description: `processo=${numeroProcesso} mensagemAlcadaObservada=${alcadaVisivel} atividadeAposDecisao="${atividade}"`,
    });
  });
});

test.describe('Etapas designadas nominalmente (verificação de alcançabilidade)', () => {
  /**
   * CT-CMP-05-H — Validação Orçamentária.
   *
   * `docs/politica-de-escrita.md` marca esta etapa como designada a aprovador nominal
   * (AL/DHL) — mas a mesma política manda VERIFICAR antes de declarar bloqueio (o documento
   * de casos errou sobre RH da mesma forma). Este teste investiga se, no momento da
   * execução, existe algum caminho de pool (delegação/substituto/"sem gestor" — o Histórico
   * já mostrou a atividade "Validação Orçamentária (Sem Gestor)" como estado válido do BPMN)
   * alcançável pelo usuário de automação.
   *
   * Não é `@destrutivo`: só lê a Central de Tarefas para determinar alcançabilidade — não
   * assume nem movimenta nada.
   */
  test('@achado a Validação Orçamentária não é alcançável por pool para o usuário de automação', async ({
    page,
  }) => {
    const central = new CentralTarefasComprasPage(page);
    await central.goto();
    await central.abrirTarefasEmPool();

    const grupos = await central.listarGrupos();
    const grupoOrcamentaria = grupos.find((g) => GRUPO_ORCAMENTARIA.test(g.nome));

    test.info().annotations.push({
      type: 'alcancabilidade-validacao-orcamentaria',
      description: grupoOrcamentaria
        ? `ALCANÇÁVEL: grupo "${grupoOrcamentaria.nome}" com ${grupoOrcamentaria.quantidade} tarefa(s) no pool`
        : `NÃO ALCANÇÁVEL agora: grupos de pool disponíveis são [${grupos.map((g) => g.nome).join(', ') || 'nenhum'}]`,
    });

    // A ausência de grupo de pool para Validação Orçamentária é o comportamento REAL medido,
    // e é isso que o teste afirma — polaridade de `@achado`: fica vermelho no dia em que a
    // etapa virar alcançável por pool, que é quando o assunto precisa ser reaberto.
    //
    // Antes daqui havia `expect(true).toBe(true)`: o teste anotava o achado e passava sem
    // afirmar nada. Isso o fazia contar como cobertura de CT-CMP-05-H em `docs/cobertura.md`
    // sem exercitar a etapa — verde por construção, imune a qualquer mudança do ambiente.
    expect(
      grupoOrcamentaria,
      `esperado (comportamento medido): nenhum grupo de pool de Validação Orçamentária para a ` +
        `conta de automação. Grupos vistos: [${grupos.map((g) => g.nome).join(', ') || 'nenhum'}]. ` +
        `Se este teste reprovou, a etapa passou a ser alcançável por pool — reabra CT-CMP-05-H ` +
        `e exercite a aprovação de verdade, em vez de apenas medir alcançabilidade.`,
    ).toBeUndefined();
  });

  /**
   * CT-CMP-05-H — a Validação Orçamentária chega a quem SUBSTITUI o gestor orçamentário.
   *
   * A atividade 14 é nominal ao gestor do centro de custo, resolvido no ERP, e nunca vai a pool (o
   * `@achado` acima). O caminho combinado com o desenvolvedor em 11/09/2026 é cadastrar a conta de
   * automação como SUBSTITUTA desse gestor (pedido E3). Este teste existe ANTES do cadastro, para que o
   * dia em que ele acontecer apareça no relatório sem ninguém precisar lembrar de conferir:
   *
   * 1. cria a SC por API e aprova a Validação do Gestor (o caminho do CT-CMP-04-H);
   * 2. espera, no servidor, a SC chegar à 14;
   * 3. abre o detalhe e lê a ação que a tela oferece (`lerAcaoNaTarefaAtual`, sinais medidos);
   * 4. "Movimentar" tem de abrir a tela de decisão da etapa.
   *
   * Sem substituto, a tela oferece só "Ver detalhes" → PRÉ-CONDIÇÃO citando o E3. "Assumir tarefa" é
   * falha real: a etapa nominal teria virado pool, e o `@achado` acima precisa ser reaberto.
   *
   * O que ele ainda NÃO faz, de propósito: DECIDIR na 14. A tela de decisão da Validação Orçamentária
   * (grade `tbItemOrcamentario`, por item) nunca foi aberta por esta conta, e escrever a decisão sem
   * medi-la seria código que ninguém viu funcionar. Medido o formulário no dia do E3, este teste ganha a
   * aprovação e a assertion de roteamento.
   */
  test('CT-CMP-05-H @destrutivo a Validação Orçamentária chega à conta substituta do gestor orçamentário', async ({
    page,
    solicitacaoAssumida,
  }, testInfo) => {
    testInfo.setTimeout(600_000);
    const central = new CentralTarefasComprasPage(page);
    const { numeroProcesso } = solicitacaoAssumida;

    await central.decidirEEnviar({ aprovar: true, justificativa: criarJustificativaDecisao('aprovação') });
    await central.abrirDetalheAposConfirmacao(numeroProcesso);

    // A saída do gateway 9 é a próxima tarefa HUMANA. Esperar só pela 14 transformava o desvio para
    // 11 "Ajustar Informações" em "prazo estourado" — e o prazo estourado é pré-condição: foi o que
    // aconteceu na primeira execução (SC 96503, 11/09/2026), um desvio causado pela própria suíte lido
    // como ambiente. Estourar o prazo continua sendo ambiente (a 280 consulta o ERP); chegar ao lugar
    // errado é reprovação.
    const proximaHumana = (/** @type {any[]} */ lidas) =>
      lidas.find(
        (t) =>
          t.status === 'NOT_COMPLETED' &&
          ![7, 9].includes(t.state?.sequence) &&
          !String(t.assignee?.code ?? '').startsWith('System:'),
      );
    const tarefas = await aguardarEstadoNoServidor(page, numeroProcesso, (lidas) => Boolean(proximaHumana(lidas)), {
      timeout: 240_000,
      oQueSeEspera: 'uma atividade humana depois da Validação do Gestor (esperada: 14 Validação Orçamentária)',
    });
    const tarefa = proximaHumana(tarefas);
    const { managerAprovadoValidacao } = await lerCamposDoFormulario(page, numeroProcesso);
    expect(
      tarefa?.state?.sequence,
      `a SC #${numeroProcesso}, aprovada na Validação do Gestor, deveria seguir para a 14 Validação Orçamentária ` +
        `e foi para ${tarefa?.state?.sequence} "${tarefa?.state?.stateName}" — managerAprovadoValidacao gravado: ` +
        `"${managerAprovadoValidacao}"`,
    ).toBe(14);
    const responsavel = String(tarefa?.assignee?.name ?? tarefa?.assignee?.code ?? '?');

    await central.abrirDetalheDaSolicitacao(numeroProcesso);
    const acao = await central.lerAcaoNaTarefaAtual();
    testInfo.annotations.push({
      type: 'acao-na-validacao-orcamentaria',
      description: `SC ${numeroProcesso}: a tela oferece "${acao}"; responsável ${responsavel}`,
    });

    if (acao === 'nenhuma') {
      faltaPreCondicao(
        `(ambiente): a Validação Orçamentária da SC #${numeroProcesso} é tarefa nominal de ${responsavel}, e a ` +
          'conta de automação ainda não é substituta dessa pessoa — o detalhe oferece só "Ver detalhes". ' +
          'Pedido E3 de docs/plano-de-evolucao-2026-09-11.md.',
      );
    }
    expect(
      acao,
      'a Validação Orçamentária é nominal: com substituto ela aparece para "Movimentar", nunca para assumir de pool',
    ).toBe('movimentar');

    await central.botaoMovimentarTarefaAtual().click();
    await expect(
      page.getByRole('heading', { level: 2 }).filter({ hasText: /^\d+\s*-/ }),
      '"Movimentar" deveria abrir a tela de decisão da Validação Orçamentária',
    ).toBeVisible({ timeout: 30_000 });
  });

  /**
   * CT-CMP-06-H — Validação dos Compradores.
   *
   * O usuário de automação PERTENCE ao pool de Validação dos Compradores conforme o roteiro
   * de casos. Este teste verifica se há tarefa alcançável nesse pool AGORA e, se houver,
   * assume e movimenta de fato (documentando a ação real observada); se não houver, reporta
   * o achado sem falhar — mesma lógica de verificação do teste acima.
   */
  test('@destrutivo deve assumir e movimentar uma tarefa do pool de Validação dos Compradores quando disponível', async ({
    page,
  }) => {
    const central = new CentralTarefasComprasPage(page);
    await central.goto();
    await central.abrirTarefasEmPool();

    const grupo = await central.encontrarGrupo(GRUPO_COMPRADOR);

    if (!grupo) {
      const grupos = await central.listarGrupos();
      test.info().annotations.push({
        type: 'alcancabilidade-validacao-compradores',
        description: `NÃO ALCANÇÁVEL agora: grupos de pool disponíveis são [${grupos.map((g) => g.nome).join(', ') || 'nenhum'}]`,
      });
      // Este teste existe para ASSUMIR e MOVIMENTAR uma tarefa do pool. Sem tarefa, ele não
      // exercitou nada — e antes daqui devolvia verde com `expect(true).toBe(true)`, o que o
      // fazia contar como cobertura de CT-CMP-06-H sem ter tocado a etapa.
      //
      // `faltaPreCondicao` é o mecanismo do projeto para este caso: anota `pre-condicao-ausente`,
      // que `scripts/veredito-do-gate.mjs` lê para classificar como AMBIENTE e não como
      // regressão. O gate segue verde; a cobertura deixa de ser reivindicada indevidamente.
      faltaPreCondicao(
        `nenhuma tarefa no pool de Validação dos Compradores no momento da execução — ` +
          `grupos disponíveis: [${grupos.map((g) => g.nome).join(', ') || 'nenhum'}]. ` +
          `Destrava quem puder deixar uma SC parada nessa etapa antes da execução.`,
      );
    }

    await central.abrirGrupo(grupo.link);
    const numeroProcesso = await central.assumirTarefa(0);

    // A tela pós-"Assumir" de Compras segue o mesmo padrão de decisão (Sim/Não +
    // Justificativa) observado na Validação do Gestor Imediato, quando aplicável.
    // Espera de verdade pelo rádio: `isVisible({ timeout })` ignora o prazo, e logo depois do
    // "Assumir" o iframe da tarefa ainda está montando — a leitura do instante mandava o teste
    // para o ramo fraco (só o heading) mesmo quando a tela tinha a decisão Sim/Não.
    const temDecisaoPadrao = await central
      .radioAprovarSim()
      .waitFor({ state: 'visible', timeout: 30_000 })
      .then(
        () => true,
        () => false,
      );

    test.info().annotations.push({
      type: 'validacao-compradores-alcancada',
      description: `processo=${numeroProcesso} telaComDecisaoSimNao=${temDecisaoPadrao}`,
    });

    // Os dois ramos afirmam: o formato da tela de decisão da Validação dos Compradores varia, e cada
    // um tem a sua evidência de que a etapa foi alcançada.
    /* eslint-disable playwright/no-conditional-expect */
    if (temDecisaoPadrao) {
      const justificativa = criarJustificativaDecisao('validação do comprador');
      // Atividade 119: a prontidão do formulário nesta etapa nunca foi medida (não há massa nela).
      await central.decidirEEnviar({ aprovar: true, justificativa, esperarAprovador: false });
      await central.abrirDetalheAposConfirmacao(numeroProcesso);
      await expect(async () => {
        const atividade = await central.lerNomeAtividadeAtual();
        expect(atividade.length).toBeGreaterThan(0);
      }).toPass({ timeout: 30_000 });
    } else {
      // Página carregou sem tela branca e sem travar — suficiente para provar
      // alcançabilidade quando o padrão de decisão difere do já mapeado.
      await expect(central.headingAtual()).toBeVisible();
    }
    /* eslint-enable playwright/no-conditional-expect */
  });
});
