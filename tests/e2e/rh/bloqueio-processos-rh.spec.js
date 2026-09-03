// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { envObrigatoria } from '../../../config/ambiente.js';

/**
 * Bloqueio de início de processos de RH — segregação por grupo.
 *
 * O usuário da automação tem perfil Compras/Contratos e não pertence a nenhum grupo de
 * RH. `pageworkflowview?processID=<id>` é o ponto de entrada usado pelo Fluig para
 * iniciar um processo por URL: apenas abre o rascunho do formulário — nenhum registro é
 * criado até o clique em "Enviar", que nenhum teste aqui realiza (proibido pela regra do
 * projeto: ambiente real do cliente, somente leitura).
 *
 * O comportamento ESPERADO para um processo de RH, dado o perfil do usuário, é o bloqueio
 * observado em `wf_solicitacao_ferias` (coberto por outro agente, não duplicado aqui):
 * heading "Erro", a mensagem "Usuário <login> não possui permissão para iniciar
 * solicitações do processo <processId>", botão "Ok, entendi", e nenhum formulário
 * carregado (sem botão "Enviar").
 *
 * Comportamento REAL observado em campo nos seis processos listados na tarefa: apenas
 * `wf_aprovacao_ocorrencia` bloqueia. Os outros cinco ABREM o formulário normalmente —
 * heading "Início", abas Formulário/Informações/Histórico/Anexos e botão "Enviar"
 * visíveis, com o mesmo usuário Compras/Contratos sem grupo de RH. Confirmado estável
 * (heading "Início" permanece após 6s de espera, nenhuma segunda checagem assíncrona o
 * substitui por "Erro") e sem qualquer requisição de escrita disparada pela navegação.
 *
 * Isso é um achado relevante de segregação de acesso, não um resultado a forçar: os
 * testes abaixo, para esses cinco processos, fazem a assertion sobre o comportamento REAL
 * observado (o formulário abre) em vez de fingir que o bloqueio aconteceu.
 */

const LOGIN_AUTOMACAO = envObrigatoria('QA_USERNAME');

/**
 * @param {string} processId
 * @returns {string}
 */
function rotaIniciarProcesso(processId) {
  return `/portal/p/1/pageworkflowview?processID=${processId}`;
}

/**
 * @param {string} processId
 * @returns {string}
 */
function mensagemBloqueioEsperada(processId) {
  return `Usuário ${LOGIN_AUTOMACAO} não possui permissão para iniciar solicitações do processo ${processId}`;
}

test.describe('Bloqueio de início de processos de RH — segregação por grupo', () => {
  const processId = 'wf_aprovacao_ocorrencia';

  test(`deve bloquear o início de ${processId} (Aprovação de Ocorrência) para usuário fora do grupo de RH`, async ({
    page,
  }) => {
    await page.goto(rotaIniciarProcesso(processId), { waitUntil: 'domcontentloaded' });

    const tituloErro = page.getByRole('heading', { name: 'Erro' });
    // Duas ocorrências do texto no DOM: o aviso visível e um textarea readonly (colapsado,
    // por trás de "Ver detalhes técnicos") com o mesmo conteúdo — .first() resolve o
    // aviso visível sem violar o modo estrito.
    const mensagemErro = page.getByText(mensagemBloqueioEsperada(processId)).first();
    const botaoOkEntendi = page.getByRole('button', { name: 'Ok, entendi' });

    const semBloqueio =
      `o processo ${processId} deveria recusar o início para um usuário FORA do grupo de RH, ` +
      'com o diálogo "Erro" e a mensagem de permissão. Nada disso apareceu — ou a segregação ' +
      'por grupo não está aplicada neste processo, ou a tela mudou de forma';
    await expect(tituloErro, semBloqueio).toBeVisible();
    await expect(mensagemErro, semBloqueio).toBeVisible();
    await expect(botaoOkEntendi, semBloqueio).toBeVisible();

    // O ponto central do caso: nenhum formulário carrega para submissão.
    await expect(page.getByRole('button', { name: 'Enviar' })).toHaveCount(0);
  });
});

test.describe('ACHADO — processos de RH que abrem o formulário sem bloqueio de grupo', () => {
  const processosQueAbriram = [
    { processId: 'wf_pagamento_horas_extras', nome: 'Solicitação de Pagamento de Horas Extras' },
    { processId: 'wf_automacao_admissao', nome: 'Automação Admissão' },
    { processId: 'wf_substituicaocargos', nome: 'Substituição de Cargos' },
    { processId: 'GestaoDependentes', nome: 'Gestão de Dependentes' },
    { processId: 'rh_gbeneficios_planosaude', nome: 'Plano de Saúde' },
  ];

  for (const { processId, nome } of processosQueAbriram) {
    test(`ACHADO @achado — ${processId} (${nome}) inicia sem bloqueio para usuário fora do grupo de RH`, async ({
      page,
    }, testInfo) => {
      // Rastreabilidade do achado no relatório da execução, inclusive quando o teste
      // fica verde: a assertion abaixo documenta o comportamento REAL, não o esperado.
      testInfo.annotations.push({
        type: 'achado-segregacao-de-acesso',
        description: `${processId}: usuário ${LOGIN_AUTOMACAO} (perfil Compras/Contratos, fora dos grupos de RH) consegue abrir o formulário de início deste processo de RH. Esperado seria o bloqueio observado em wf_aprovacao_ocorrencia e wf_solicitacao_ferias.`,
      });

      await page.goto(rotaIniciarProcesso(processId), { waitUntil: 'domcontentloaded' });

      // Comportamento REAL observado: o formulário de início abre normalmente — sem
      // qualquer preenchimento ou clique em "Enviar" (proibido: escrita no ambiente real).
      await expect(page.getByRole('heading', { name: 'Início' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Enviar' })).toBeVisible();

      // E, por contraste, a tela de bloqueio NÃO aparece — reforça que isto não é o
      // comportamento esperado de segregação por grupo, e sim a ausência dele.
      await expect(page.getByRole('heading', { name: 'Erro' })).toHaveCount(0);
    });
  }
});
