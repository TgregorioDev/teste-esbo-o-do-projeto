// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { descobrirContratoVigente } from '../../../utils/massa-contratos.js';
import { criarSolicitacaoCompra } from '../../../factories/solicitacao-compra.js';
import { MinhasSolicitacoesPage } from '../../../pages/MinhasSolicitacoesPage.js';
import { TarefaSolicitacaoCompraPage } from '../../../pages/TarefaSolicitacaoCompraPage.js';

/**
 * Início da cadeia E2E: da SC criada pelo Portal de Acompanhamento de Contratos até o
 * Gestor Imediato assumir, aprovar ou reprovar.
 *
 * ⚠️ Achado de campo que governa todo este arquivo: uma SC criada por ESTA suíte (via
 * Acompanhamento de Contratos) nunca chega à etapa "Validação do Gestor". `targetState=6` /
 * `targetAssignee=consumerkeycompras` (D-01, ver `payload-solicitacao.spec.js` e
 * `criacao-solicitacao.spec.js`) não é só um detalhe do payload: medido na prática, a SC fica
 * PARA SEMPRE em "Início", responsável "Usuário Integrador Fluig" — confirmado reconsultando o
 * mesmo processo minutos depois. Ela nunca aparece em nenhum pool nem em "Tarefas a concluir".
 *
 * Isso bloqueia CT-E2E-02-H/S1 estruturalmente: não há como este teste, criando sua própria
 * massa (regra do projeto), produzir uma SC assumível pelo Gestor Imediato. Os dois testes
 * abaixo são escritos contra o comportamento ESPERADO (cadeia completa) e ficam vermelhos na
 * etapa "a SC chegou à Validação do Gestor" — é o efeito downstream de D-01, documentado aqui
 * com o próprio processInstanceId. Se D-01 for corrigido, a espera passa e o restante do
 * teste (assumir do pool, aprovar/reprovar, conferir o próximo estado) roda de verdade.
 *
 * O mecanismo de assumir/aprovar/reprovar em si (radio `tbmanag_aprovadoValid`, justificativa
 * obrigatória, botão "Enviar" fora do iframe do formulário) foi confirmado em campo abrindo
 * uma tarefa de "Validação do Gestor" já existente no ambiente, só para leitura — ver
 * `pages/TarefaSolicitacaoCompraPage.js`.
 */

const ESPERA_CHEGADA_NO_GESTOR_MS = 45_000;

test.describe('A SC criada nasce no estado e no dono corretos (CT-E2E-01-H)', () => {
  test('@destrutivo estado inicial e responsável deveriam refletir uma etapa de trabalho do solicitante', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }, testInfo) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    const contrato = await descobrirContratoVigente(contratosPage);
    await contratosPage.filtrarPorContrato(contrato.contrato);
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();
    await solicitacaoModal.preencher(criarSolicitacaoCompra());

    const respostaPromise = page.waitForResponse((r) => r.url().includes('/wf_solicitacao_compras/start'));
    await solicitacaoModal.confirmar();
    const resposta = await respostaPromise;
    expect(resposta.status()).toBe(200);
    const processInstanceId = (await resposta.json()).processInstanceId;
    testInfo.annotations.push({ type: 'sc-criada', description: String(processInstanceId) });

    // GET direto mencionado como alternativa de consulta — documentado aqui: bloqueado para
    // esta sessão (403), por isso a consulta real é feita via Central de Tarefas abaixo.
    const diretoViaApi = await page.request.get(`/process-management/api/v2/requests/${processInstanceId}`);
    testInfo.annotations.push({
      type: 'GET /process-management/api/v2/requests/<N>',
      description: `status ${diretoViaApi.status()} — consulta feita via Central de Tarefas em vez disso`,
    });

    const minhasSolicitacoes = new MinhasSolicitacoesPage(page);
    await minhasSolicitacoes.goto();

    // A listagem pode levar alguns segundos para indexar uma SC recém-criada — poll limitado
    // e observável, nunca `waitForTimeout` fixo, distingue "ainda não indexou" de "nunca vai
    // aparecer".
    await expect
      .poll(() => minhasSolicitacoes.localizarPorProcessInstanceId(processInstanceId), {
        message: `SC ${processInstanceId} deveria aparecer em "Solicitadas por mim"`,
        timeout: 60_000,
      })
      .toBeTruthy();
    const registro = await minhasSolicitacoes.localizarPorProcessInstanceId(processInstanceId);

    expect(
      registro?.stateDescription,
      `estado inicial "${registro?.stateDescription}" — deveria ser uma etapa de trabalho, não o ` +
        'marco de Início do BPMN',
    ).not.toBe('Início');

    expect(
      registro?.colleagueName,
      `responsável "${registro?.colleagueName}" — deveria ser o solicitante logado (ou uma etapa/pool ` +
        'legítima do fluxo), não a conta de integração',
    ).not.toBe('Usuário Integrador Fluig');
  });
});

test.describe('Gestor Imediato assume do pool e aprova (CT-E2E-02-H)', () => {
  test('@destrutivo aprovada pelo Gestor Imediato, a SC deveria avançar para Validação Orçamentária', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }, testInfo) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    const contrato = await descobrirContratoVigente(contratosPage);
    await contratosPage.filtrarPorContrato(contrato.contrato);
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();
    await solicitacaoModal.preencher(criarSolicitacaoCompra());

    const respostaPromise = page.waitForResponse((r) => r.url().includes('/wf_solicitacao_compras/start'));
    await solicitacaoModal.confirmar();
    const resposta = await respostaPromise;
    expect(resposta.status()).toBe(200);
    const processInstanceId = (await resposta.json()).processInstanceId;
    testInfo.annotations.push({ type: 'sc-criada', description: String(processInstanceId) });

    const minhasSolicitacoes = new MinhasSolicitacoesPage(page);

    // Pré-condição da cadeia: a SC precisa chegar a "Validação do Gestor" para poder ser
    // assumida do pool. Ver cabeçalho do arquivo — D-01 bloqueia isso na prática.
    await expect(async () => {
      const registro = await minhasSolicitacoes.localizarPorProcessInstanceId(processInstanceId);
      expect(
        registro?.stateDescription,
        `SC ${processInstanceId}: estado atual "${registro?.stateDescription}" — esperando ` +
          '"Validação do Gestor" (bloqueado por D-01: a SC nasce presa no marco de Início e não ' +
          'chega a nenhuma etapa de trabalho, logo nunca aparece em pool algum)',
      ).toBe('Validação do Gestor');
    }).toPass({ timeout: ESPERA_CHEGADA_NO_GESTOR_MS, intervals: [3_000] });

    // Só chega aqui se a pré-condição acima passar (ou seja, se D-01 estiver corrigido).
    const tarefa = new TarefaSolicitacaoCompraPage(page);
    await tarefa.assumirDoPool(processInstanceId);
    await tarefa.abrirPorProcessInstanceId(processInstanceId);
    await tarefa.aprovar(`QA aprovacao-gestor-${processInstanceId}`);

    await expect(async () => {
      const registro = await minhasSolicitacoes.localizarPorProcessInstanceId(processInstanceId);
      expect(registro?.stateDescription).toBe('Validação Orçamentária');
    }).toPass({ timeout: 30_000 });
  });
});

test.describe('Gestor Imediato reprova com justificativa (CT-E2E-02-S1)', () => {
  test('@destrutivo reprovada, a SC deveria voltar para Ajustar Informações com o solicitante, itens e contrato íntegros', async ({
    page,
    contratosPage,
    solicitacaoModal,
  }, testInfo) => {
    await contratosPage.goto();
    await contratosPage.expectCarregada();
    const contrato = await descobrirContratoVigente(contratosPage);
    await contratosPage.filtrarPorContrato(contrato.contrato);
    await contratosPage.abrirSolicitacaoCompra();
    await solicitacaoModal.expectAberto();
    await solicitacaoModal.preencher(criarSolicitacaoCompra());

    /** @type {Record<string, any> | null} */
    let corpoOriginal = null;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/wf_solicitacao_compras/start')) {
        corpoOriginal = req.postDataJSON();
      }
    });

    const respostaPromise = page.waitForResponse((r) => r.url().includes('/wf_solicitacao_compras/start'));
    await solicitacaoModal.confirmar();
    const resposta = await respostaPromise;
    expect(resposta.status()).toBe(200);
    const processInstanceId = (await resposta.json()).processInstanceId;
    testInfo.annotations.push({ type: 'sc-criada', description: String(processInstanceId) });
    expect(corpoOriginal, 'o corpo original enviado deveria ter sido capturado para comparação depois').toBeTruthy();

    const minhasSolicitacoes = new MinhasSolicitacoesPage(page);

    // Mesma pré-condição bloqueada por D-01 — ver cabeçalho do arquivo.
    await expect(async () => {
      const registro = await minhasSolicitacoes.localizarPorProcessInstanceId(processInstanceId);
      expect(
        registro?.stateDescription,
        `SC ${processInstanceId}: estado atual "${registro?.stateDescription}" — esperando ` +
          '"Validação do Gestor" (bloqueado por D-01, ver cabeçalho do arquivo)',
      ).toBe('Validação do Gestor');
    }).toPass({ timeout: ESPERA_CHEGADA_NO_GESTOR_MS, intervals: [3_000] });

    // Só chega aqui se a pré-condição acima passar.
    const tarefa = new TarefaSolicitacaoCompraPage(page);
    await tarefa.assumirDoPool(processInstanceId);
    await tarefa.abrirPorProcessInstanceId(processInstanceId);
    await tarefa.reprovar(`QA reprovacao-gestor-${processInstanceId}`);

    await expect(async () => {
      const registro = await minhasSolicitacoes.localizarPorProcessInstanceId(processInstanceId);
      expect(registro?.stateDescription).toBe('Ajustar Informações');
    }).toPass({ timeout: 30_000 });

    // Itens, rateio, contrato e revisão vindos do portal devem continuar íntegros: reabre a
    // tarefa (agora de volta com o solicitante) e confere o Formulário contra o payload
    // original capturado na criação.
    await tarefa.abrirPorProcessInstanceId(processInstanceId);
    const contratoNoFormulario = await tarefa.frame
      .locator('input[name^="nrContrato"]:visible, input[name="nrContrato"]')
      .first()
      .inputValue()
      .catch(() => null);

    expect(
      contratoNoFormulario,
      `contrato exibido no formulário após a reprovação ("${contratoNoFormulario}") deveria ` +
        `continuar sendo o mesmo enviado na criação ("${/** @type {any} */ (corpoOriginal)?.formFields?.nrContrato}")`,
    ).toBe(/** @type {any} */ (corpoOriginal)?.formFields?.nrContrato);
  });
});
