// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../../utils/pre-condicao.js';
import { CancelamentoCentralTarefasPage } from '../../../pages/CancelamentoCentralTarefasPage.js';
import { MinhasSolicitacoesPage } from '../../../pages/MinhasSolicitacoesPage.js';
import { QuestionarioClinicassiPage } from '../../../pages/QuestionarioClinicassiPage.js';
import { conferirCancelamento } from '../../../utils/cancelamento-fluig.js';
import { criarJustificativaDecisao } from '../../../factories/produto-compra.js';

/**
 * CT-TSK-05-H e CT-TSK-05-S1 — cancelamento de solicitação.
 *
 * O cancelamento é a única saída não-destrutiva de uma solicitação neste ambiente, aparece em
 * três telas com TRÊS endpoints diferentes (Central de Tarefas, Consultar Solicitações e
 * Eliminar Solicitações — o terceiro nem cancela, apaga) e **nenhum tinha cobertura**. Pior:
 * `fixtures/global-teardown.js` depende do endpoint da Central de Tarefas para limpar a massa
 * de TODAS as execuções. Se ele quebrar no produto, hoje a suíte só descobriria pelo acúmulo
 * de lixo na base — nunca por um vermelho.
 *
 * ## Por que a massa é um Questionário CliniCASSI e não uma Solicitação de Compras
 *
 * O catálogo sugere criar uma SC. Medido em campo em 27/08/2026, a criação de SC pelo
 * formulário clássico custa ~4 min (quatro combos assíncronos alimentados pelo Protheus,
 * upload de anexo, cadeia de atividades automáticas do BPMN) e depende da integração com o
 * Protheus, que oscila. O CONTRATO sob teste aqui — `POST /api/public/2.0/workflows/cancelInstances`
 * — não olha para o tipo de processo: ele recebe `processInstanceId` e `cancelText`, e a
 * validação de permissão é sobre o usuário efetivo ser requisitante ou gestor
 * (skill `cassi-fluig-master`, `references/cancelamento-de-solicitacoes.md` §4).
 *
 * `prc_questionario_v2` cria uma solicitação real, do próprio usuário, em ~6s, sem tocar no
 * Protheus, e ela nasce **OPEN com tarefa humana atribuída ao solicitante** ("Acompanhamento
 * Status") — exatamente a pré-condição pedida. Um teste P1 de que a limpeza da suíte inteira
 * depende precisa poder rodar sempre; amarrá-lo à disponibilidade do Protheus seria trocar um
 * buraco de cobertura por um teste intermitente. A cobertura do fluxo de CRIAÇÃO da SC continua
 * onde já estava (`tests/e2e/compras/ciclo-solicitacao-compras.spec.js`).
 *
 * ⚠️ Achado de campo desta implementação: em 27/08/2026 o envio do questionário responde
 * **200** e cria a solicitação (112738, 112740, medidos). O catálogo de processos da skill e
 * `tests/e2e/saude/questionario-clinicassi.spec.js` registram 500 ("A pergunta >>001<< não tem
 * nenhuma ação cadastrada!!") — o defeito D-CLI-01 parece corrigido ou intermitente. Estes
 * testes não dependem da interpretação: se o envio não criar a solicitação, eles falham com
 * `faltaPreCondicao` (pré-condição ausente anotada), separando ambiente de defeito, em vez de
 * morrer num timeout opaco.
 *
 * A limpeza é automática: `fixtures/fixtures.js` escuta as respostas de `/workflowView/send` e
 * registra o `processInstanceId` no livro-razão sozinho; `fixtures/global-teardown.js` cancela
 * no fim da invocação. CT-TSK-05-H cancela a própria massa (o teardown enxerga a solicitação já
 * encerrada e a ignora); CT-TSK-05-S1 deixa a dele viva de propósito — é o que ele afirma — e
 * o teardown a recolhe.
 */

/** Endpoint de cancelamento em lote da Central de Tarefas — o mesmo de que a limpeza depende. */
const ROTA_CANCEL_INSTANCES = '/api/public/2.0/workflows/cancelInstances';

/**
 * Cria a massa própria do teste: uma solicitação real, aberta, do próprio usuário.
 *
 * Falha via `faltaPreCondicao` quando o ambiente não entrega a solicitação — o teste sob
 * medição aqui é o CANCELAMENTO, e confundir "não consegui criar massa" com "o cancelamento
 * está quebrado" é o erro que essa mensagem existe para evitar.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<number>} `processInstanceId` da solicitação criada
 */
async function criarSolicitacaoPropria(page) {
  const questionario = new QuestionarioClinicassiPage(page);

  await questionario.goto();
  await questionario.expectFormularioAberto();
  await questionario.headingQuestionario.waitFor({ state: 'visible' });

  const totalQuestoes = await questionario.contarQuestoes();
  if (totalQuestoes === 0) {
    faltaPreCondicao(
      'o formulário de `prc_questionario_v2` abriu sem nenhuma questão ' +
        'montada, então não há o que enviar. Isto NÃO é defeito do cancelamento sob teste — é ' +
        'a massa do questionário (base de perguntas) que não veio do servidor.',
    );
  }
  await questionario.responderTodas('Total');

  const resposta = await questionario.enviarECapturarResposta();
  const corpo = await resposta.json().catch(() => null);
  const id = corpo?.content?.processInstanceId;

  if (resposta.status() !== 200 || typeof id !== 'number' || id <= 0) {
    faltaPreCondicao(
      'não foi possível criar a solicitação que serve de massa para este ' +
        `teste. \`POST /ecm/api/rest/ecm/workflowView/send\` respondeu HTTP ${resposta.status()} ` +
        `e o corpo não trouxe \`processInstanceId\` (recebido: ${JSON.stringify(id)}). ` +
        'Isto NÃO é defeito do cancelamento sob teste — em 27/08/2026 este envio respondia 200 ' +
        'e criava a solicitação; ver D-CLI-01 em tests/e2e/saude/questionario-clinicassi.spec.js.',
    );
  }
  return id;
}

/**
 * Lê no SERVIDOR o estado das tarefas de uma solicitação.
 *
 * Sempre por `page.evaluate` + `fetch`: o WAF do ambiente devolve 403 para
 * `/process-management/api/v2/**` quando a chamada sai do contexto de requisição do Playwright
 * (falta `User-Agent` de navegador e `Referer` do portal).
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} processInstanceId
 * @returns {Promise<Array<{ movementSequence: number, status: string, stateName: string }>>}
 */
async function lerTarefasNoServidor(page, processInstanceId) {
  return page.evaluate(async (id) => {
    const r = await fetch(`/process-management/api/v2/requests/${id}/tasks?pageSize=60`, {
      credentials: 'include',
      headers: { Referer: `${location.origin}/portal/p/1/home` },
    });
    const j = await r.json().catch(() => ({}));
    const itens = Array.isArray(j.items) ? j.items : [];
    return itens.map((/** @type {any} */ t) => ({
      movementSequence: Number(t.movementSequence ?? -1),
      status: String(t.status ?? '?'),
      stateName: String(t.state?.stateName ?? t.state?.stateDescription ?? '?'),
    }));
  }, processInstanceId);
}

test.describe('Cancelamento de solicitação (CT-TSK-05)', () => {
  /**
   * CT-TSK-05-H — cancelar pela Central de Tarefas.
   *
   * A confirmação vem **do servidor**, não do toast: `successCount` é o que o endpoint DIZ ter
   * feito; `status: CANCELED` é o que aconteceu. Mesma disciplina de `scripts/limpar-massa.mjs`.
   */
  test('CT-TSK-05-H @destrutivo — cancelar pela Central de Tarefas deve levar a solicitação a CANCELED no servidor', async ({
    page,
  }, testInfo) => {
    const processInstanceId = await criarSolicitacaoPropria(page);
    testInfo.annotations.push({
      type: 'solicitacao-criada',
      description: `processInstanceId=${processInstanceId} (massa própria de CT-TSK-05-H)`,
    });

    // Pré-condição declarada e verificada no servidor: a solicitação está ABERTA antes do
    // cancelamento. Sem isto, um "CANCELED" no fim poderia ser estado herdado, não efeito.
    const [antes] = await conferirCancelamento(page, [processInstanceId]);
    expect(
      antes,
      `a solicitação ${processInstanceId} recém-criada deveria estar ABERTA (OPEN/active) no ` +
        'servidor antes do cancelamento — sem isso o teste não mede efeito nenhum',
    ).toMatchObject({ status: 'OPEN', active: true });

    const cancelamento = new CancelamentoCentralTarefasPage(page);
    await cancelamento.abrirMinhasSolicitacoes();
    // A listagem nasce crescente e traz 15 por vez: sem inverter a ordenação, a solicitação
    // recém-criada (maior id) fica dezenas de rolagens adiante. Ver a nota do Page Object.
    await cancelamento.ordenarPorSolicitacaoDecrescente();

    await expect(
      cancelamento.cartao(processInstanceId),
      `a solicitação ${processInstanceId}, criada por este teste e aberta no servidor, deveria ` +
        'aparecer como cartão em "Minhas solicitações" ordenada por Solicitação decrescente',
    ).toBeVisible();

    // O risco concreto que este caso cobre: o botão sumir da Central (ou passar a exigir perfil
    // que o solicitante não tem) e ninguém perceber até a base entupir.
    await expect(
      cancelamento.botaoCancelarDoCartao(processInstanceId),
      `o cartão da solicitação ${processInstanceId} deveria oferecer o botão "Cancelar" ao ` +
        'próprio solicitante — é o único caminho não-destrutivo de saída da solicitação, e é ' +
        'o mesmo endpoint de que a limpeza de massa da suíte inteira depende',
    ).toBeVisible();

    const motivo = criarJustificativaDecisao('cancelamento');
    const resposta = await cancelamento.cancelarPeloCartao(processInstanceId, motivo);

    expect(
      resposta.status(),
      `${ROTA_CANCEL_INSTANCES} deveria responder 200 ao cancelamento de uma solicitação aberta ` +
        'do próprio requisitante',
    ).toBe(200);
    const corpo = await resposta.json();
    expect(
      corpo?.content?.failCount,
      `nenhum item do lote deveria falhar (resposta: ${JSON.stringify(corpo?.content)})`,
    ).toBe(0);

    // ── A prova de verdade: o estado no servidor ─────────────────────────────────────────
    const [depois] = await conferirCancelamento(page, [processInstanceId]);
    expect(
      depois,
      `a solicitação ${processInstanceId} deveria estar CANCELED e inativa no servidor após o ` +
        'cancelamento pela Central de Tarefas. `successCount` é o que o endpoint diz ter feito; ' +
        'isto é o que o servidor mostra depois',
    ).toMatchObject({ status: 'CANCELED', active: false });

    const tarefas = await lerTarefasNoServidor(page, processInstanceId);
    expect(
      tarefas.length,
      `o histórico de tarefas de ${processInstanceId} veio vazio — sem ele não há como afirmar ` +
        'sobre a tarefa da etapa corrente',
    ).toBeGreaterThan(0);
    const ultima = tarefas[tarefas.length - 1];
    expect(
      ultima.status,
      `a tarefa da etapa corrente ("${ultima.stateName}", movto ${ultima.movementSequence}) ` +
        'deveria ficar com status CANCELED — cancelar a solicitação sem encerrar a tarefa ' +
        `deixaria pendência órfã na Central. Tarefas lidas: ${JSON.stringify(tarefas)}`,
    ).toBe('CANCELED');

    // ── E o cartão sai da listagem de abertas ────────────────────────────────────────────
    // Varredura paginada da MESMA listagem que a UI consome (ordem decrescente, por cursor):
    // resposta exata "não está na listagem", não um teto arbitrário de páginas.
    const minhasSolicitacoes = new MinhasSolicitacoesPage(page);
    expect(
      await minhasSolicitacoes.localizarPorProcessInstanceId(processInstanceId),
      `a solicitação ${processInstanceId}, já CANCELED no servidor, não deveria continuar ` +
        'listada em "Minhas solicitações" com status Abertas',
    ).toBeNull();
  });

  /**
   * CT-TSK-05-S1 — cancelamento sem motivo.
   *
   * O risco não é o código HTTP: é o **"sem efeito" silencioso**. Um dia a validação vira
   * "cancela mesmo assim com motivo vazio", ou uma exceção não tratada passa a cancelar
   * parcialmente um lote — e a suíte inteira depende deste endpoint para limpar massa.
   *
   * ⚠️ A chamada aqui NÃO usa `utils/cancelamento-fluig.js` de propósito: `cancelarSolicitacoes`
   * recusa motivo vazio ANTES de sair da máquina (é a proteção que o próprio contrato medido
   * justifica). Testar a validação do servidor exige furar essa proteção, e o único jeito
   * honesto é montar a requisição crua — mesma técnica (`page.evaluate` + `fetch`) e mesmo
   * corpo que o utilitário monta.
   *
   * ## Correção de contrato medida nesta implementação (27/08/2026)
   *
   * O caso de teste do catálogo previa `NullPointerException` 500 "sem efeito", herdado da
   * skill `cassi-fluig-master`. **Isso vale para o OUTRO endpoint** — o da tela de detalhe,
   * `POST /ecm/api/rest/ecm/workflowView/cancelInstance/` (§2a da referência). A API pública em
   * lote, medida aqui, trata o caso: responde **HTTP 200** com
   * `successCount: 0`, `failCount: 1` e o item em
   * `{"status":"ERROR","errorCode":"BPMEmptyCancelTextException","message":"Texto de cancelamento deve ser informado!"}`.
   *
   * É um contrato legítimo para endpoint de LOTE (o resultado é por item, não pelo status da
   * requisição) — e é exatamente como `utils/cancelamento-fluig.js` já lê a resposta. Por isso
   * este teste afirma sobre o que importa e não sobre o número do HTTP: a recusa é **detectável
   * item a item**, **nomeia o campo** e é **tratada** (não uma exceção crua vazando), e a
   * solicitação **continua aberta**.
   */
  test('CT-TSK-05-S1 @destrutivo — cancelInstances sem motivo deve recusar com erro de negócio, e não alterar a solicitação', async ({
    page,
  }, testInfo) => {
    const processInstanceId = await criarSolicitacaoPropria(page);
    testInfo.annotations.push({
      type: 'solicitacao-criada',
      description: `processInstanceId=${processInstanceId} (massa própria de CT-TSK-05-S1)`,
    });

    const [antes] = await conferirCancelamento(page, [processInstanceId]);
    expect(
      antes,
      `a solicitação ${processInstanceId} recém-criada deveria estar ABERTA (OPEN/active) antes ` +
        'da chamada sem motivo — é o estado que o teste afirma estar preservado depois',
    ).toMatchObject({ status: 'OPEN', active: true });

    const login = process.env.QA_USERNAME;
    if (!login) throw new Error('Variável de ambiente obrigatória não definida: QA_USERNAME');

    const resultado = await page.evaluate(
      async ({ id, login, rota }) => {
        const r = await fetch(rota, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cancelInstanceList: [{ replacedId: login, processInstanceId: id }],
            cancelText: null,
          }),
        });
        return { status: r.status, corpo: (await r.text()).slice(0, 600) };
      },
      { id: processInstanceId, login, rota: ROTA_CANCEL_INSTANCES },
    );

    testInfo.annotations.push({
      type: 'resposta-cancelamento-sem-motivo',
      description: `HTTP ${resultado.status} — ${resultado.corpo.slice(0, 200)}`,
    });

    /** @type {any} */
    let corpoJson = null;
    try {
      corpoJson = JSON.parse(resultado.corpo);
    } catch {
      // Corpo não-JSON é, por si só, quebra de contrato: quem chama não tem como distinguir
      // sucesso de recusa. A assertion abaixo reporta com o corpo cru na mensagem.
    }
    const item = corpoJson?.content?.cancelInstanceResults?.[0];

    // ── Metade 1: a recusa tem de ser TRATADA e DETECTÁVEL ──────────────────────────────
    //
    // `expect.soft` aqui não é indulgência: as DUAS metades do caso precisam ser medidas na
    // mesma execução. Com assertion dura, uma quebra de contrato abortaria o teste antes de
    // conferir o estado — e é justamente a preservação do estado ("sem efeito") a metade que
    // mais importa. A falha continua reprovando o teste; ela só não impede a segunda medição.
    expect.soft(
      resultado.status,
      'a recusa por motivo vazio deveria ser tratada como erro de negócio, não vazar como ' +
        `exceção do servidor (5xx). Recebido: HTTP ${resultado.status} — ${resultado.corpo}`,
    ).toBeLessThan(500);
    expect.soft(
      corpoJson?.content?.successCount,
      'nenhuma solicitação pode ser cancelada quando o motivo vem vazio — `successCount` tem ' +
        `de ser 0. Corpo recebido: ${resultado.corpo}`,
    ).toBe(0);
    expect.soft(
      item?.status,
      'a recusa tem de vir no resultado POR ITEM, que é como todo chamador desta API em lote ' +
        '(inclusive `utils/cancelamento-fluig.js` e a limpeza da suíte) descobre o que falhou. ' +
        `Item recebido: ${JSON.stringify(item)}`,
    ).toBe('ERROR');
    expect.soft(
      `${item?.errorCode ?? ''} ${item?.message ?? ''}`,
      'a mensagem de recusa deveria nomear o motivo/texto de cancelamento como obrigatório, ' +
        `para que quem chama saiba o que corrigir. Item recebido: ${JSON.stringify(item)}`,
    ).toMatch(/texto de cancelamento|motivo|cancelText|CancelText/i);
    expect.soft(
      String(item?.errorCode ?? ''),
      'a recusa não pode ser uma exceção crua da plataforma (NullPointerException e afins): ' +
        'esse é o contrato que hoje a tela de detalhe entrega no endpoint irmão ' +
        `(\`workflowView/cancelInstance\`) e que este endpoint NÃO deve regredir para. Item: ${JSON.stringify(item)}`,
    ).not.toMatch(/NullPointerException/i);

    // Metade 2 (a que mais importa): o estado NÃO pode ter mudado. Esta assertion falha se um
    // dia o servidor passar a cancelar com motivo vazio — silenciosamente.
    const [depois] = await conferirCancelamento(page, [processInstanceId]);
    expect(
      depois,
      `a solicitação ${processInstanceId} tem de permanecer ABERTA após uma chamada de ` +
        'cancelamento recusada. Se ela mudar de estado, o endpoint estará cancelando sem ' +
        'motivo — exatamente a regressão silenciosa que este caso existe para pegar',
    ).toMatchObject({ status: 'OPEN', active: true });
  });
});
