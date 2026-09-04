// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../../utils/pre-condicao.js';

/**
 * CT-PLT-10-H — invariante do catálogo de processos.
 *
 * A suíte já testa o catálogo como TELA (`catalogo-processos.spec.js`: lista e busca) e
 * nunca como INVENTÁRIO. Este teste é o oráculo executável do que está publicado e do que é
 * iniciável: alguém publica um processo novo, despublica um em uso ou muda a permissão de
 * início de um processo sensível, e sem isto a suíte inteira continua verde.
 *
 * ## Como as duas listas foram obtidas (medição de 27/08/2026)
 *
 * - `GET /process-management/api/v2/processes?pageSize=200` → envelope `{items, hasNext}`,
 *   **34 processos publicados, 31 ativos** (`sumula`, `sumulas_analise_intervenientes` e
 *   `testePRODUTO` vêm `active:false`).
 * - `GET /ecm/api/rest/ecm/process-category/processes?...&onlyCanStart=true` → envelope
 *   `{content:[{path,name,processDefinitions:[…]}]}`, **17 processos** — é exatamente o que
 *   alimenta a tela "Iniciar Solicitações".
 *
 * ⚠️ Divergência com a skill `cassi-fluig-master`, que registrou "34 publicados (32 ativos)":
 * a medição de 27/08/2026 conta **31 ativos**. O ambiente ganha; a lista abaixo é a medida.
 *
 * ## Remedição de 03/09/2026 — a plataforma mudou de build, o catálogo passou a bater com a permissão
 *
 * O invariante ficou vermelho em 03/09/2026: **6 processos entraram** no `onlyCanStart`
 * (`GestaoDependentes`, `SIGAJURI_AprovaFU`, `SIGAJURI_Contencioso`, `SIGAJURI_Contrato`,
 * `rh_gbeneficios_planosaude`, `wf_substituicaocargos`) e nenhum saiu. Investigado no ambiente
 * antes de versionar a lista nova, como este arquivo exige:
 *
 * - `GET /api/public/wcm/version` → **`Voyager 2.0.0-260901`**. Em 27/08 o mapa registrava
 *   `2.0.0-260811`: a plataforma foi atualizada entre as duas medições.
 * - Os 6 que "entraram" são **exatamente** os 6 que a skill `cassi-fluig-master` já listava em
 *   27/08 como "Catálogo: não · Inicia: abre" — o `TOTVS-FS` já abria o formulário de início de
 *   todos eles (os `@achado` de `rh/bloqueio-processos-rh.spec.js` provam isso desde então, e
 *   continuam verdes). A **permissão efetiva não mudou**; o que mudou foi o filtro da tela, que
 *   passou a refletir a permissão real.
 * - `GET /api/public/2.0/users/getCurrent` → 36 grupos, todos de Compras/Contratos
 *   (`G.P.*`, `G.Compras.*`, `all_users`, `DefaultGroup-1`) — nenhum grupo de RH ou Jurídico
 *   foi atribuído à conta. Não é abertura de permissão por grupo.
 * - Nenhum dos 6 processos é `public: true`, e as versões publicadas (`?expand=versions`) não
 *   trazem data de publicação por esta API — não há como afirmar republicação; a evidência
 *   convergente é o build da plataforma.
 *
 * Consequência: a lista `INICIAVEIS_NO_CATALOGO` abaixo é a de **03/09/2026** (23), e o teste do
 * `SIGAJURI_Contencioso` foi **reescrito para a nova regra** (catálogo e permissão coincidem),
 * não silenciado. A pergunta de segregação continua a mesma de antes (README, "Perguntas em
 * aberto", item 1): esses processos deveriam ser iniciáveis por um usuário de Compras? Ela só
 * ficou mais visível, porque agora a tela "Iniciar Solicitações" os oferece.
 *
 * ⚠️ As duas chamadas usam `page.evaluate` + `fetch`, nunca `page.request`: o WAF do TOTVS
 * Cloud responde 403 a `/process-management/api/v2/**` sem `User-Agent` de navegador e
 * `Referer` do portal (ver CLAUDE.md > utils).
 *
 * ## Manutenção deliberada
 *
 * Quando este teste ficar vermelho porque um processo entrou ou saiu, a correção NÃO é
 * atualizar a constante no reflexo: é confirmar que a publicação (ou despublicação) foi
 * intencional e só então versionar a nova lista, com a data. É esse atrito que transforma o
 * catálogo em governança em vez de documento que envelhece.
 */

/** Processos publicados e ATIVOS em 27/08/2026 (`active: true`). */
const PUBLICADOS_ATIVOS = [
  'FLUIGADHOC',
  'FLUIGADHOCPROCESS',
  'GestaoDependentes',
  'SIGAJURI_AprovaFU',
  'SIGAJURI_Consultivo',
  'SIGAJURI_Contencioso',
  'SIGAJURI_Contrato',
  'bpm_addUserFluig',
  'bpm_addUserGroup',
  'bpm_financeiro_rejeicoes_bancarias',
  'bpm_recepcao_documentos_fiscais_comprador_compras',
  'bpm_recepcao_documentos_fiscais_compras',
  'bpm_recepcao_documentos_fiscais_contratos',
  'bpm_recepcao_documentos_fiscais_demandante_compras',
  'bpm_recepcao_documentos_fiscais_fiscais_contratos',
  'prc_questionario_v2',
  'rh_gbeneficios_planosaude',
  'teste',
  'wf_SubstituiçãoCargosFluig',
  'wf_aprovacao_ocorrencia',
  'wf_automacao_admissao',
  'wf_cadastro_fornecedor',
  'wf_cotacao_produtos_servicos',
  'wf_delegacaoFiscalContratoServico',
  'wf_faturamento_contratos',
  'wf_negociacao_cotacao_prod_serv',
  'wf_pagamento_horas_extras',
  'wf_solicitacao_compras',
  'wf_solicitacao_compras_parecer',
  'wf_solicitacao_ferias',
  'wf_substituicaocargos',
];

/** Processos publicados e INATIVOS em 27/08/2026 (`active: false`). */
const PUBLICADOS_INATIVOS = ['sumula', 'sumulas_analise_intervenientes', 'testePRODUTO'];

/**
 * Processos que o catálogo "Iniciar Solicitações" oferece ao usuário da automação
 * (`onlyCanStart=true`) em **03/09/2026**, plataforma `2.0.0-260901` — 23 processos.
 *
 * Em 27/08/2026 (build `260811`) eram 17: esta lista **sem** os 6 marcados abaixo. Os 6 já
 * abriam o formulário de início para esta conta naquela data; ver "Remedição de 03/09/2026"
 * no cabeçalho antes de tocar aqui de novo.
 */
const INICIAVEIS_NO_CATALOGO = [
  'FLUIGADHOC',
  'GestaoDependentes', // entrou em 03/09/2026 (RH — já abria em 27/08)
  'SIGAJURI_AprovaFU', // entrou em 03/09/2026 (Jurídico — já abria, só leitura)
  'SIGAJURI_Consultivo',
  'SIGAJURI_Contencioso', // entrou em 03/09/2026 (Jurídico — já abria E criava, ver teste abaixo)
  'SIGAJURI_Contrato', // entrou em 03/09/2026 (Jurídico — já abria)
  'bpm_addUserFluig',
  'bpm_addUserGroup',
  'bpm_financeiro_rejeicoes_bancarias',
  'prc_questionario_v2',
  'rh_gbeneficios_planosaude', // entrou em 03/09/2026 (RH — já abria em 27/08)
  'teste',
  'wf_SubstituiçãoCargosFluig',
  'wf_automacao_admissao',
  'wf_cadastro_fornecedor',
  'wf_cotacao_produtos_servicos',
  'wf_delegacaoFiscalContratoServico',
  'wf_faturamento_contratos',
  'wf_negociacao_cotacao_prod_serv',
  'wf_pagamento_horas_extras',
  'wf_solicitacao_compras',
  'wf_solicitacao_compras_parecer',
  'wf_substituicaocargos', // entrou em 03/09/2026 (RH — já abria em 27/08, não-determinístico)
];

/**
 * Diferença entre dois conjuntos de identificadores, para que a falha diga QUAL processo
 * entrou ou saiu — nunca "34 ≠ 35", que obriga quem lê a ir caçar no relatório.
 *
 * @param {string[]} esperados
 * @param {string[]} obtidos
 * @returns {{ entraram: string[], sairam: string[] }}
 */
function diferenca(esperados, obtidos) {
  const doEsperado = new Set(esperados);
  const doObtido = new Set(obtidos);
  return {
    entraram: obtidos.filter((id) => !doEsperado.has(id)).sort(),
    sairam: esperados.filter((id) => !doObtido.has(id)).sort(),
  };
}

/**
 * Lê as duas listas do servidor numa única passagem, de dentro da página autenticada.
 *
 * @param {import('@playwright/test').Page} page
 */
async function lerCatalogoDoServidor(page) {
  return page.evaluate(async () => {
    /** @param {string} url */
    const obter = async (url) => {
      const resposta = await fetch(url, {
        credentials: 'include',
        headers: { Referer: `${location.origin}/portal/p/1/home`, Accept: 'application/json' },
      });
      const texto = await resposta.text();
      /** @type {any} */
      let corpo = null;
      try {
        corpo = JSON.parse(texto);
      } catch {
        corpo = null;
      }
      return { status: resposta.status, corpo, texto: corpo ? '' : texto.slice(0, 300) };
    };

    return {
      processos: await obter('/process-management/api/v2/processes?pageSize=200'),
      catalogo: await obter(
        '/ecm/api/rest/ecm/process-category/processes?processOrder=alphabetical&processLabel=&onlyCanStart=true',
      ),
    };
  });
}

test.describe('Plataforma — invariante do catálogo de processos', () => {
  test('CT-PLT-10-H: o conjunto de processos publicados e o de iniciáveis devem bater exatamente com o inventário versionado', async ({
    page,
  }) => {
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
    const { processos, catalogo } = await lerCatalogoDoServidor(page);

    if (processos.status !== 200) {
      faltaPreCondicao(
        `(ambiente): GET /process-management/api/v2/processes respondeu ${processos.status}: ` +
          `${processos.texto}. Sem a lista de processos não há inventário a comparar — não é ` +
          'defeito do catálogo.',
      );
    }
    if (catalogo.status !== 200) {
      faltaPreCondicao(
        `(ambiente): GET /ecm/api/rest/ecm/process-category/processes respondeu ${catalogo.status}: ` +
          `${catalogo.texto}. Sem a lista do catálogo não há o que comparar.`,
      );
    }

    // Guarda contra truncamento silencioso: `pageSize=200` cobre folgadamente os 34 de hoje,
    // mas se algum dia a página encher, comparar uma lista truncada com a esperada acusaria
    // "processos sumiram" que na verdade estão na página seguinte.
    expect(
      processos.corpo?.hasNext,
      'a API de processos sinalizou que há MAIS uma página além de `pageSize=200` — o inventário ' +
        'lido está truncado e a comparação abaixo seria enganosa. Aumente o pageSize.',
    ).toBe(false);

    /** @type {Array<{ processId: string, active: boolean, processDescription: string }>} */
    const itens = processos.corpo?.items ?? [];
    const ativos = itens.filter((p) => p.active).map((p) => p.processId);
    const inativos = itens.filter((p) => !p.active).map((p) => p.processId);

    /** @type {string[]} */
    const iniciaveis = [];
    for (const categoria of catalogo.corpo?.content ?? []) {
      for (const definicao of categoria.processDefinitions ?? []) {
        iniciaveis.push(definicao.processId);
      }
    }

    await test.info().attach('inventario-lido-do-servidor', {
      body: JSON.stringify(
        { totalPublicados: itens.length, ativos: ativos.sort(), inativos: inativos.sort(), iniciaveis: [...iniciaveis].sort() },
        null,
        2,
      ),
      contentType: 'application/json',
    });

    const publicadosAtivos = diferenca(PUBLICADOS_ATIVOS, ativos);
    expect(
      publicadosAtivos,
      'o conjunto de processos PUBLICADOS E ATIVOS mudou em relação ao inventário versionado ' +
        '(medido em 27/08/2026). Isto não é falha de execução: alguém publicou, despublicou ou ' +
        'reativou processo. Confirme que a mudança foi intencional antes de versionar a nova lista.',
    ).toEqual({ entraram: [], sairam: [] });

    const publicadosInativos = diferenca(PUBLICADOS_INATIVOS, inativos);
    expect(
      publicadosInativos,
      'o conjunto de processos publicados porém INATIVOS mudou. Processo que sai desta lista foi ' +
        'reativado; processo que entra foi desativado — as duas coisas mudam o que o usuário ' +
        'consegue iniciar e precisam ser decisão consciente.',
    ).toEqual({ entraram: [], sairam: [] });

    const catalogoIniciaveis = diferenca(INICIAVEIS_NO_CATALOGO, iniciaveis);
    expect(
      catalogoIniciaveis,
      'o catálogo "Iniciar Solicitações" (`onlyCanStart=true`) mudou para esta conta. Processo ' +
        'que ENTRA passou a ser iniciável por um usuário de Compras; processo que SAI deixou de ' +
        'ser oferecido. Este é o ponto de controle de permissão de início — trate cada linha como ' +
        'mudança de acesso, não como ajuste de dados.',
    ).toEqual({ entraram: [], sairam: [] });
  });

  test('CT-PLT-10-H: `SIGAJURI_Contencioso` consta do catálogo `onlyCanStart` e está ativo — desde o build 2.0.0-260901 o filtro da tela coincide com a permissão efetiva de início', async ({
    page,
  }) => {
    // HISTÓRICO — até 27/08/2026 (build 260811) este teste guardava a divergência oposta: o
    // Contencioso NÃO aparecia na lista `onlyCanStart`, mas abrir
    // `pageworkflowview?processID=SIGAJURI_Contencioso` montava o formulário e o envio CRIAVA
    // solicitação de verdade (medido pela skill `cassi-fluig-master` em 26/08/2026, instância
    // real na etapa "7-Resposta", pool GRUPO_GEJUR_9). O catálogo era só apresentação, não
    // fronteira de segurança.
    //
    // Em 03/09/2026 a divergência foi resolvida pelo lado do filtro: com a plataforma em
    // `2.0.0-260901`, o Contencioso passou a constar do catálogo (ver "Remedição de 03/09/2026"
    // no cabeçalho — a permissão de início não mudou; a tela é que passou a refleti-la). Este
    // teste foi REESCRITO para a nova regra, como a mensagem da versão anterior mandava: agora
    // guarda que catálogo e permissão coincidem para o Contencioso. Vira vermelho se ele sumir
    // da lista de novo (o filtro voltou a esconder um processo iniciável) ou se for
    // desativado — as duas coisas precisam de decisão consciente, não de ajuste de constante.
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
    const { processos, catalogo } = await lerCatalogoDoServidor(page);

    if (processos.status !== 200) faltaPreCondicao(`(ambiente): a API de processos respondeu ${processos.status}, não 200`);
    if (catalogo.status !== 200) faltaPreCondicao(`(ambiente): o catálogo respondeu ${catalogo.status}, não 200`);

    /** @type {Array<{ processId: string, active: boolean }>} */
    const itens = processos.corpo?.items ?? [];
    const contencioso = itens.find((p) => p.processId === 'SIGAJURI_Contencioso');

    /** @type {string[]} */
    const iniciaveis = [];
    for (const categoria of catalogo.corpo?.content ?? []) {
      for (const definicao of categoria.processDefinitions ?? []) iniciaveis.push(definicao.processId);
    }

    expect(
      contencioso?.active,
      '`SIGAJURI_Contencioso` deveria estar publicado e ativo — é a metade da divergência que ' +
        'este teste guarda (o processo existe e inicia).',
    ).toBe(true);

    expect(
      iniciaveis,
      'a regra mudou de novo: `SIGAJURI_Contencioso` DEIXOU de constar do catálogo `onlyCanStart` ' +
        'para esta conta. Ou o filtro da tela voltou a esconder um processo que a permissão ' +
        'efetiva permite iniciar (a divergência de 27/08/2026 reapareceu — confira abrindo ' +
        '`pageworkflowview?processID=SIGAJURI_Contencioso`), ou a permissão de início foi ' +
        'retirada. As duas hipóteses são mudança de acesso e exigem decisão consciente — ' +
        'reescreva para a regra nova, não silencie.',
    ).toContain('SIGAJURI_Contencioso');
  });
});
