// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { FormularioRejeicoesPagamentosPage } from '../../../pages/FormularioRejeicoesPagamentosPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * CT-FIN-01-H — Rejeições de Pagamentos: abertura e estrutura do formulário.
 *
 * **Financeiro era uma área de negócio inteira sem cobertura**: `bpm_financeiro_rejeicoes_bancarias`
 * está publicado, ativo e no catálogo `onlyCanStart` da conta (ver `catalogo-invariante.spec.js`),
 * e nenhuma das famílias do catálogo de casos tocava nele. Um processo que trata rejeição
 * bancária iria a produção sem nenhuma verificação — e, se não devesse estar publicado, ninguém
 * perceberia.
 *
 * Caso PARCIAL por definição, no mesmo padrão de `cadastro-fornecedor.spec.js` e
 * `parecer-tecnico.spec.js`: abre, espelha os campos e **nunca** aciona *Enviar* — enviar aqui
 * criaria uma solicitação real de rejeição de pagamento. `bloquearCriacaoDeSolicitacao` fica de
 * guarda mesmo sem intenção de enviar, e transforma "este teste não escreve nada" de presunção
 * em assertion.
 *
 * ⚠️ Antes de investir no CICLO deste processo, confirmar com a Cassi se ele está em escopo:
 * "Último iniciado: Nunca" — nunca foi iniciado por ninguém, e pode ser publicação órfã. A
 * abertura é barata o bastante para valer de qualquer forma.
 */
test.describe('Financeiro — Rejeições de Pagamentos (CT-FIN-01-H)', () => {
  test('CT-FIN-01-H: deve abrir o formulário de início e espelhar os campos do domínio de rejeição', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formulario = new FormularioRejeicoesPagamentosPage(page);

    await formulario.goto();
    await formulario.expectAberto();

    await expect(page).toHaveTitle('Cassi - Fluig Plataforma - Movimentar Solicitação');
    await expect(
      formulario.dialogErro,
      'o processo está no catálogo de início da conta — nenhum diálogo de erro deveria aparecer ' +
        'ao abri-lo. Se apareceu, a permissão de início ou o estado do processo mudou (ver CT-PLT-10-H)',
    ).toHaveCount(0);

    // Casca do processo.
    await expect(formulario.headingInicio).toBeVisible();
    await expect(formulario.abaFormulario).toBeVisible();
    await expect(formulario.abaInformacoes).toBeVisible();
    await expect(formulario.abaHistorico).toBeVisible();
    await expect(formulario.abaAnexos).toBeVisible();
    await expect(formulario.botaoEnviar).toBeVisible();

    // O formulário é o DESTE processo — a assertion que separa "montou" de "montou o template
    // de outro processo", que é exatamente o que `wf_automacao_admissao` faz hoje (serve o do
    // Plano de Saúde).
    await expect(
      formulario.tituloFormulario,
      'o card deveria trazer o formulário de "Financeiro - Rejeições de Pagamentos". Título ' +
        'diferente significa que o processo está servindo o template de outro processo — o ' +
        'achado que este caso existe para detectar',
    ).toBeVisible();
    await expect(formulario.secaoIdentificacao).toBeVisible();

    // Identificação: preenchida pela plataforma, não pelo usuário.
    await expect(formulario.campoNumeroProcesso).toBeVisible();
    await expect(formulario.campoNumeroProcesso).not.toBeEditable();
    await expect(formulario.campoSolicitante).toBeVisible();
    await expect(formulario.campoSolicitante).not.toBeEditable();
    await expect(formulario.campoEmailSolicitante).toBeVisible();
    await expect(formulario.campoDataSolicitacao).toBeVisible();
    await expect(formulario.campoHoraSolicitacao).toBeVisible();

    // ── O domínio da rejeição ─────────────────────────────────────────────────────────────
    // São estes três campos que fazem o formulário ser de "Rejeições de Pagamentos" e não uma
    // casca vazia: sem eles não há como registrar POR QUE o pagamento foi rejeitado.
    await expect(
      formulario.campoMotivoRejeicao,
      'o formulário deveria oferecer o zoom "Motivo da Rejeição" — sem ele não há como ' +
        'classificar a rejeição, e o processo não cumpre o próprio nome',
    ).toBeVisible();
    await expect(
      formulario.campoObservacaoRejeicao,
      'o formulário deveria oferecer "Observação da Rejeição" editável',
    ).toBeEditable();
    await expect(
      formulario.campoFinalizar,
      'o formulário deveria oferecer o controle "Finalizar?", que decide o desfecho da rejeição',
    ).toBeVisible();

    // Bloco de resposta do responsável: existe, é readonly e nasce vazio — quem responde é a
    // etapa seguinte, não quem abre.
    await expect(formulario.campoResponsavel).not.toBeEditable();
    await expect(formulario.campoResponsavel).toHaveValue('');
    await expect(formulario.campoEmailResponsavel).not.toBeEditable();
    await expect(formulario.campoRespostaFiscalComprador).not.toBeEditable();

    // ⚠️ Abrir e ler é leitura; NUNCA clicar em Enviar aqui.
    expect(
      guarda.tentativas(),
      `abrir e ler o formulário não deveria escrever nada — tentou: ${JSON.stringify(guarda.urls())}`,
    ).toBe(0);
  });

  test('CT-FIN-01-H (ACHADO): o formulário repete ids no DOM e carrega campos e seção herdados do RDFC', async ({
    page,
  }, testInfo) => {
    // Achado medido em 27/08/2026, afirmado sobre o comportamento REAL (mesmo padrão dos
    // ACHADOS de `tests/e2e/rh/bloqueio-processos-rh.spec.js`). Duas coisas, ambas no HTML que
    // o processo serve:
    //
    // 1. **Oito ids repetidos** — `nrSolicitacao`, `nomeSolicitante`, `emailSolicitante`,
    //    `nomeSolicitanteResp`, `cpfCnpjPai`, `nomeSolicitantePai`, `emailSolicitantePai`,
    //    `emissaoNF`. O padrão é o `div.has-feedback` que embrulha o campo levar o MESMO id do
    //    `input`; `emailSolicitante` aparece três vezes. Não é cosmético: `getElementById`
    //    devolve sempre o primeiro (que aqui é o wrapper, não o campo), `label[for]` deixa de
    //    apontar para o controle, e qualquer regra de formulário que enderece o campo por id
    //    passa a agir sobre o elemento errado.
    // 2. **Herança visível do template do RDFC** — a seção
    //    "Identificação do Processo / Solicitante - Recepção de Documentos Fiscais" existe no
    //    formulário (oculta), e com ela vêm campos de nota fiscal (`cpfCnpjPai`,
    //    `nomeSolicitantePai`, `emissaoNF`) que nada têm a ver com rejeição de pagamento.
    //
    // O formulário NÃO serve o template errado (o título e os campos de domínio são os certos —
    // ver o teste acima); ele serve o certo com resíduo do outro colado junto.
    testInfo.annotations.push({
      type: 'achado-template-do-formulario',
      description:
        'bpm_financeiro_rejeicoes_bancarias repete 8 ids no DOM (wrapper e input com o mesmo id) ' +
        'e carrega a seção oculta "Identificação do Processo / Solicitante - Recepção de ' +
        'Documentos Fiscais" com campos de nota fiscal herdados do template do RDFC.',
    });

    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formulario = new FormularioRejeicoesPagamentosPage(page);

    await formulario.goto();
    await formulario.expectAberto();

    await expect(
      formulario.secaoHerdadaDoRdfc,
      'a seção herdada do RDFC não está mais no formulário — o achado foi corrigido (ou o ' +
        'template mudou). Reveja este teste em vez de silenciá-lo',
    ).toHaveCount(1);
    await expect(
      formulario.secaoHerdadaDoRdfc,
      'a seção herdada do RDFC passou a ser VISÍVEL no formulário de Rejeições de Pagamentos — ' +
        'deixou de ser resíduo oculto e virou conteúdo indevido na tela',
    ).toBeHidden();

    const idsRepetidos = await formulario.frame.locator('body').evaluate((corpo) => {
      /** @type {Record<string, number>} */
      const contagem = {};
      for (const elemento of corpo.querySelectorAll('[id]')) {
        contagem[elemento.id] = (contagem[elemento.id] ?? 0) + 1;
      }
      return Object.entries(contagem)
        .filter(([, quantidade]) => quantidade > 1)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([id, quantidade]) => `${id} ×${quantidade}`);
    });

    await test.info().attach('ids-repetidos-no-formulario', {
      body: JSON.stringify(idsRepetidos, null, 2),
      contentType: 'application/json',
    });

    expect(
      idsRepetidos,
      'a repetição de ids no formulário mudou. Se DIMINUIU, o defeito de HTML está sendo ' +
        'corrigido e este teste precisa acompanhar a correção; se AUMENTOU, o template piorou. ' +
        'Nos dois casos é decisão consciente, não ajuste de constante.',
    ).toEqual([
      'cpfCnpjPai ×2',
      'emailSolicitante ×3',
      'emailSolicitantePai ×2',
      'emissaoNF ×2',
      'nomeSolicitante ×2',
      'nomeSolicitantePai ×2',
      'nomeSolicitanteResp ×2',
      'nrSolicitacao ×2',
    ]);

    expect(
      guarda.tentativas(),
      `abrir e ler o formulário não deveria escrever nada — tentou: ${JSON.stringify(guarda.urls())}`,
    ).toBe(0);
  });
});
