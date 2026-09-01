// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { SigajuriPage } from '../../../pages/SigajuriPage.js';
import { criarSolicitacaoConsultivo } from '../../../factories/juridico.js';
import { envObrigatoria } from '../../../config/ambiente.js';
import { LoginPage } from '../../../pages/LoginPage.js';

const PROCESS_ID = 'SIGAJURI_Consultivo';

/**
 * CT-JUR-01-H / CT-JUR-01-S1 — Consultivo (`SIGAJURI_Consultivo`).
 *
 * ## O que foi confirmado em campo (navegação direta por URL, sessão normal)
 *
 * O documento de casos supunha este processo bloqueado por perfil. **Não está**: o
 * formulário abre completo (heading "Início", abas, botão Enviar) — não aparece o modal de
 * bloqueio de permissão que bloqueia RDFC e alguns processos de RH.
 *
 * O que bloqueia é outra coisa: os combos `Tipo Consulta` e `Filial` são alimentados por um
 * serviço externo chamado "SIGAJURI" que o dataset não encontra — o HTML servido já vem com
 * uma ÚNICA opção, o texto do erro:
 * `com.totvs.technology.foundation.dataservice.exception.ServiceNotFoundException: Não foi
 * possível encontrar o serviço ' SIGAJURI '`. Não há como selecionar um valor válido para
 * nenhum dos dois campos — em NENHUMA das duas comboboxes existe outra opção.
 *
 * O clique em Enviar chega a POSTAR em `/ecm/api/rest/ecm/workflowView/send` (a escrita real
 * — equivalente jurídico do `/wf_solicitacao_compras/start` documentado em
 * `utils/captura-payload.js`), mas o servidor responde **500**. A `beforeStateEntry` do BPM
 * tenta determinar o responsável pela tarefa a partir de `cdTipoSol`/`cdFilialNS7`/
 * `cdAreaSol` — todos vazios pela falha do serviço — e lança
 * `Não foi possível determinar o responsável pela Consulta/Parecer`. A UI ABRE um `role=dialog`
 * com heading "Erro" mostrando essa mensagem (não é uma falha silenciosa) e NENHUM processo é
 * criado: `/portal/p/1/pageprocessstart` continua listando "Consultas/Pareceres — Último
 * iniciado: Nunca" depois da tentativa.
 *
 * Isto foi reproduzido com QUALQUER valor de `Área Solicitante` (a única combo deste
 * formulário que tem opções reais) — a falha não é "esta área não tem aprovador configurado",
 * é "nenhuma área tem, porque o campo que decidiria isso nunca carrega um valor". Por isso
 * CT-JUR-01-H e CT-JUR-01-S1 documentam o MESMO defeito (D-JUR-01) a partir de duas áreas
 * diferentes, em vez de duplicar o mesmo teste: a prova de que é universal, não pontual, está
 * em o resultado NÃO mudar com a área.
 *
 * CT-JUR-01-S2 (prazo de ~41 dias / atraso) **não foi implementado**: exige um processo
 * criado de verdade para avançar o relógio de negócio, e nenhuma tentativa de criação chega a
 * completar por causa do D-JUR-01 acima — não há processo para medir prazo.
 */
test.describe('SIGAJURI_Consultivo — solicitação, D-JUR-01', () => {
  test('CT-JUR-01-H deveria criar a solicitação de Consultivo e vinculá-la à área informada @destrutivo', async ({
    page,
  }) => {
    const sigajuri = new SigajuriPage(page);
    const dados = criarSolicitacaoConsultivo({ areaSolicitante: 'DIVISÃO DE CONTENCIOSO' });

    await sigajuri.goto(PROCESS_ID);
    await sigajuri.expectFormularioAberto();

    // Prova de campo, documentada ANTES de tentar enviar (para não confundir "não consegui
    // preencher" com "preenchi e falhou por outro motivo"): Tipo Consulta deveria oferecer
    // tipos reais de consulta jurídica — hoje a única opção é o texto do erro do serviço.
    // `count()` não espera pelo formulário do iframe carregar — por isso a visibilidade é
    // confirmada primeiro (essa, sim, com auto-wait).
    await expect(sigajuri.comboTipoConsulta).toBeVisible();
    expect(
      await sigajuri.comboTipoConsulta.locator('option').count(),
      'Tipo Consulta deveria oferecer mais de uma opção (tipos reais de consulta)',
    ).toBeGreaterThan(1);

    await sigajuri.preencherConsultivo(dados);

    const resposta = await sigajuri.enviarECapturarResposta();

    expect(
      resposta.status(),
      'uma solicitação de Consultivo com Solicitação/Área preenchidas deveria ser aceita ' +
        '(200) — o servidor respondeu com erro porque Tipo Consulta/Filial nunca chegam a ' +
        'carregar um valor (D-JUR-01, ServiceNotFoundException no serviço SIGAJURI)',
    ).toBe(200);
  });

  test('CT-JUR-01-S1 falha de mesma forma em uma área diferente — não é "área sem aprovador", é universal @destrutivo', async ({
    page,
  }) => {
    const sigajuri = new SigajuriPage(page);
    const dados = criarSolicitacaoConsultivo({ areaSolicitante: 'DIVISÃO DE CONVÊNIOS' });

    await sigajuri.goto(PROCESS_ID);
    await sigajuri.expectFormularioAberto();
    await sigajuri.preencherConsultivo(dados);

    await sigajuri.enviarECapturarResposta();

    // O requisito de negócio testado aqui é "deve sinalizar, não rotear para o vazio" — e É
    // o que acontece: a UI abre um diálogo de erro visível e nomeado, com a mensagem de
    // negócio, em vez de redirecionar silenciosamente como se tivesse dado certo (o padrão
    // que quebrou D-01 em Compras, documentado em `docs/mapa-do-ambiente.md`). Este teste
    // passa hoje — a causa do sinal é o defeito universal D-JUR-01 (não uma regra de alçada
    // por área específica), mas o comportamento de UX sob teste está correto.
    await expect(
      sigajuri.dialogErroEnvio.getByRole('heading', { name: 'Erro', exact: true }),
    ).toBeVisible();
    await expect(sigajuri.dialogErroEnvio).toContainText('Não foi possível determinar o responsável');
    await expect(page).toHaveURL(/processID=SIGAJURI_Consultivo/);
  });
});

/**
 * CT-JUR-02-S1 — acesso público indevido a `SIGAJURI_Consultivo`.
 *
 * O processo está marcado `public:true` no metadado da definição. Medido com um contexto
 * SEM sessão (sem `storageState`, sem cookie de autenticação):
 *
 * - `GET /portal/p/1/pageworkflowview?processID=SIGAJURI_Consultivo` responde 200, mas o
 *   documento servido é a tela de LOGIN (`<title>Login</title>`) — mesma regra documentada em
 *   `docs/mapa-do-ambiente.md`: o Fluig serve o login na MESMA url, o critério de sessão é o
 *   título/conteúdo, nunca o código HTTP nem a URL.
 * - `GET /ecm/api/rest/ecm/workflowView/getDefinitionProcess` (a API que devolveria o
 *   `formHtml` e os dados do processo) responde 200, mas o corpo é só um redirecionamento de
 *   página (`<script>window.location.replace("/portal/home")</script>`) — nenhum dado do
 *   processo, do formulário ou do caso jurídico é exposto no corpo da resposta.
 *
 * `public:true` não expõe dado jurídico sem autenticação por esta rota — a suíte não
 * encontrou requisição capaz de ler dado de negócio sem sessão válida.
 */
test.describe('SIGAJURI_Consultivo — acesso sem sessão (CT-JUR-02-S1, public:true)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('deve exigir autenticação e não expor dado do processo sem sessão', async ({ page }) => {
    const baseUrl = envObrigatoria('BASE_URL');

    // Ponto 1: navegação real, anônima, para a URL do processo.
    await page.goto(`${baseUrl}/portal/p/1/pageworkflowview?processID=${PROCESS_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    // Critério de sessão do projeto: título do documento, nunca a URL nem o status HTTP —
    // o Fluig serve o login na MESMA url (docs/mapa-do-ambiente.md).
    await expect(page).toHaveTitle('Login', { timeout: 30_000 });

    // Nenhum vestígio do formulário do processo deveria estar acessível — a tela anônima é
    // a de login, não a SPA do workflow (por isso a API abaixo precisa ser testada à parte:
    // a SPA que a chamaria nunca chega a carregar para uma sessão anônima).
    await expect(page.getByRole('heading', { name: 'Início', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Enviar', exact: true })).toHaveCount(0);
    await expect(new LoginPage(page).campoUsuario).toBeVisible();

    // Ponto 2: a API que devolveria o payload do processo (`formHtml`, dados do caso),
    // chamada diretamente SEM cookie de sessão (`credentials: 'omit'`) — a forma mais direta
    // de medir se o endpoint em si vaza dado de negócio a quem não está autenticado,
    // independente de a SPA do workflow chegar a carregar.
    const resultado = await page.evaluate(
      async ({ url, processId }) => {
        const resposta = await fetch(
          `${url}/ecm/api/rest/ecm/workflowView/getDefinitionProcess?processId=${processId}&processInstanceId=0&taskUserId=anonimo&currentMovto=0&managerMode=false`,
          { credentials: 'omit' },
        );
        return { status: resposta.status, corpo: await resposta.text() };
      },
      { url: baseUrl, processId: PROCESS_ID },
    );

    expect(
      resultado.corpo,
      'a API de definição de processo não deveria devolver dado do formulário/caso sem sessão',
    ).not.toContain('formHtml');
    expect(
      resultado.corpo,
      'sem sessão, a API deveria redirecionar para a autenticação — não devolver o processo',
    ).toContain('window.location');
  });
});
