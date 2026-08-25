// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { SigajuriPage } from '../../../pages/SigajuriPage.js';
import { criarSolicitacaoContencioso } from '../../../factories/juridico.js';
import { bloquearEscritaNoAmbiente } from '../../../utils/guarda-criacao.js';

const PROCESS_ID = 'SIGAJURI_Contencioso';

/**
 * CT-JUR-04-H / CT-JUR-04-S1 — Contencioso (`SIGAJURI_Contencioso`).
 *
 * Diferente dos outros três processos SIGAJURI, este formulário é FUNCIONAL: `UF`,
 * `Responsável pela Demanda` (roteamento por área/escritório/GEJUR) e `Tipo da Consulta` vêm
 * populados com valores reais — nenhum `ServiceNotFoundException` aqui. Confirmado em campo:
 * submeter com dados válidos responde `200 OK` em `POST /ecm/api/rest/ecm/workflowView/send`
 * com `processInstanceId` preenchido — processo criado de verdade, roteado pela combinação
 * UF + Responsável pela Demanda escolhida.
 *
 * O bloco "Envolvidos:" (onde se esperaria registrar a parte contrária de um processo
 * contencioso) existe no HTML do formulário mas nasce e permanece SEM nenhum campo — nem
 * mesmo trocando para tipos de consulta claramente contenciosos (`Liminar`, testado em
 * campo). Uma solicitação foi submetida e aceita (200, processo criado) sem nenhuma parte
 * contrária informada, porque não existe onde informá-la nesta tela.
 */
test.describe('SIGAJURI_Contencioso — roteamento por área e parte contrária', () => {
  test('CT-JUR-04-H deveria criar e rotear a solicitação pela UF e Responsável pela Demanda escolhidos @destrutivo', async ({
    page,
  }, testInfo) => {
    const sigajuri = new SigajuriPage(page);
    const dados = criarSolicitacaoContencioso({
      uf: 'MA',
      responsavel: 'CASSI Sede',
      tipoConsulta: 'Orientação processual',
    });

    await sigajuri.goto(PROCESS_ID);
    await sigajuri.expectFormularioAberto();
    await sigajuri.preencherContencioso(dados);

    const resposta = await sigajuri.enviarECapturarResposta();

    expect(resposta.status(), 'o envio deveria ser aceito (200) para dados válidos').toBe(200);
    const corpo = await resposta.json();
    const processInstanceId = corpo?.content?.processInstanceId;
    expect(
      typeof processInstanceId === 'number' && processInstanceId > 0,
      `a resposta deveria trazer um processInstanceId numérico positivo (recebido: ${JSON.stringify(processInstanceId)})`,
    ).toBe(true);

    testInfo.annotations.push({ type: 'contencioso-criado', description: String(processInstanceId) });

    // Nenhum diálogo de erro deveria aparecer para um envio aceito.
    await expect(
      page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Erro', exact: true }) }),
    ).toHaveCount(0);
  });

  test('CT-JUR-04-S1 deveria oferecer campo para registrar a parte contrária em consultas contenciosas', async ({
    page,
  }) => {
    const guarda = await bloquearEscritaNoAmbiente(page);
    const sigajuri = new SigajuriPage(page);

    await sigajuri.goto(PROCESS_ID);
    await sigajuri.expectFormularioAberto();

    // "Liminar" é o tipo de consulta mais claramente contencioso do catálogo — se algum tipo
    // revelasse o controle de parte contrária ao ser escolhido, seria este.
    await sigajuri.comboTipoConsultaContencioso.selectOption('Liminar');
    await expect(sigajuri.grupoEnvolvidos).toBeVisible();

    // Prova de campo: o grupo "Envolvidos:" contém uma tabela (`tabEnvolvidos`) com um botão
    // "Novo Envolvido" (`wdkAddChild`) — o único caminho real para registrar uma parte. A
    // ÚNICA linha da tabela é um MODELO oculto (`style="display:none"`, usado pelo widget
    // para clonar linhas novas), então contar `input`/`select` dentro do grupo sem filtrar
    // essa linha (a primeira versão deste teste fazia isso) apontava 7 campos que ninguém
    // consegue ver nem preencher — falso positivo. A pergunta certa é: existe um caminho
    // VISÍVEL para adicionar uma parte?
    const botaoVisivelPorPadrao = await sigajuri.botaoNovoEnvolvido.isVisible();

    // "Não possui processo." reage de fato (desmarca `readonly` da linha-modelo — confirmado
    // em campo), então testamos também com ela marcada antes de concluir.
    await sigajuri.checkboxNaoPossuiProcesso.check();
    const botaoVisivelSemProcesso = await sigajuri.botaoNovoEnvolvido.isVisible();

    expect(
      botaoVisivelPorPadrao || botaoVisivelSemProcesso,
      'deveria existir um caminho visível para registrar a parte contrária (botão "Novo ' +
        'Envolvido") em uma consulta do tipo "Liminar" — testado com o formulário no estado ' +
        'padrão e com "Não possui processo." marcado, o botão fica oculto (classe CSS ' +
        '`sem-processo-hide`) nos dois casos',
    ).toBe(true);

    // Investigação ficou só na leitura — nenhum Enviar foi acionado neste caso.
    expect(guarda.tentativas(), `tentativa(s) de escrita bloqueada(s): ${JSON.stringify(guarda.urls())}`).toBe(0);
  });
});
