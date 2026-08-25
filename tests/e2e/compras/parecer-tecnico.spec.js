// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { ParecerTecnicoPage } from '../../../pages/ParecerTecnicoPage.js';
import { criarObservacaoParecerTecnico } from '../../../factories/cotacao.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * Parecer Técnico — CT-PAR.
 *
 * Investigação do formulário avulso (`wf_solicitacao_compras_parecer`,
 * `pages/ParecerTecnicoPage.js`): dos textos livres dos itens 3, 4 e 5, só o item 5
 * ("Descreva as informações do parecer técnico") é realmente editável e VISÍVEL — os itens 3
 * e 4 pertencem a uma linha de proposta que não existe neste shell fora de contexto, e ficam
 * fora da árvore de acessibilidade (confirmado com `isVisible()`, não só `readOnly`). O radio
 * "Emitir Parecer? Aprovado/Reprovado-Ajustes" tem `required` nativo do HTML — o único
 * controle, entre os três processos avulsos investigados nesta suíte, com validação de
 * navegador de verdade (os demais "obrigatórios" visuais não têm efeito porque os campos são
 * `readonly`, e `readonly` desliga a obrigatoriedade nativa).
 *
 * O que segue bloqueado, por inspeção de DOM: a seção "7. Aprovação do Parecer Técnico" —
 * `Responsável`, `Email do Responsável`, `Data da Validação` e `Hora da Validação` nascem
 * `readonly` e VAZIOS. Não há ninguém designado para validar o parecer nesta rota. Isto é,
 * ao pé da letra, o cenário de CT-PAR-01-S1: "parecer sem responsável definido — o sistema
 * deve sinalizar, não rotear para o vazio".
 *
 * CT-PAR-01-H ("parecer emitido pelo responsável") continua bloqueado pelo mesmo motivo que
 * bloqueia CT-COT/CT-NEG: não existe, nesta base, um parecer real com responsável atribuído
 * para operar — e por ser `readonly`, não há como esta suíte atribuir um. CT-PAR-01-S1 e
 * CT-PAR-01-S2, por outro lado, SÃO alcançáveis: o próprio vazio do Responsável é a condição
 * do caso, e os campos necessários para tentar o envio (observação do parecer, decisão) são
 * editáveis.
 *
 * ⚠️ Os testes que acionam `enviar()` NÃO usam a guarda padrão do projeto
 * (`bloquearCriacaoDeSolicitacao`, que só intercepta `**\/process-management/**`). A
 * investigação de `pages/CotacaoPage.js` confirmou, em execução real, que o Enviar de um
 * formulário deste mesmo template usa `POST .../ecm/api/rest/ecm/workflowView/send` — um
 * endpoint diferente, fora do padrão coberto pela guarda — e chegou a criar um processo real
 * (#112312) sem querer antes desse ajuste. Por segurança, todo teste que aciona `enviar()`
 * aqui usa `bloquearTodaEscritaNoHost`, que intercepta QUALQUER requisição não-GET no host
 * da aplicação, e a assertion decisiva é sobre isso.
 */

/** @param {import('@playwright/test').Page} page */
async function bloquearTodaEscritaNoHost(page) {
  /** @type {string[]} */
  const bloqueadas = [];
  await page.route('**/*', async (route, request) => {
    if (request.method() === 'GET') return route.fallback();
    bloqueadas.push(`${request.method()} ${request.url()}`);
    await route.abort('blockedbyclient');
  });
  return {
    tentativas: () => bloqueadas.length,
    urls: () => [...bloqueadas],
  };
}

test.describe('Parecer Técnico — formulário avulso', () => {
  test('CT-PAR-01-H (bloqueado) — nasce sem Responsável atribuído; não há quem "seja o responsável" para emitir o parecer', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const parecer = new ParecerTecnicoPage(page);

    await parecer.goto();
    await parecer.expectAberto();

    await expect(parecer.campoResponsavel, 'Responsável deveria ser readonly').not.toBeEditable();
    await expect(parecer.campoResponsavel).toHaveValue('');
    await expect(parecer.campoEmailResponsavel).not.toBeEditable();
    await expect(parecer.campoEmailResponsavel).toHaveValue('');
    await expect(parecer.campoNumeroScFluig).not.toBeEditable();
    await expect(parecer.campoNumeroScErp).not.toBeEditable();
    await expect(parecer.campoJustificativaSolicitacao).not.toBeEditable();

    // A observação do parecer (item 5), ao contrário do vínculo com a SC, É editável.
    await expect(parecer.campoParecerObservacao).toBeEditable();
    await expect(parecer.radioAprovado).toBeEditable();
    await expect(parecer.radioReprovado).toBeEditable();

    expect(guarda.tentativas(), 'abrir e ler o formulário não deveria escrever nada').toBe(0);
  });

  test('CT-PAR-01-S1 — parecer sem responsável definido não pode completar uma requisição de escrita ao Enviar', async ({
    page,
  }) => {
    const parecer = new ParecerTecnicoPage(page);

    await parecer.goto();
    await parecer.expectAberto();

    // Compõe um parecer completo do lado do que É editável — só o Responsável fica de fora,
    // porque não há caminho de UI para preenchê-lo.
    await parecer.preencherParecer(criarObservacaoParecerTecnico('aprovado sem responsável'));
    await parecer.marcarDecisao(true);

    // Bloqueio amplo armado só agora, imediatamente antes do clique — armar mais cedo
    // intercepta os POSTs de dataset que o próprio carregamento do formulário usa (leitura).
    const guardaAmpla = await bloquearTodaEscritaNoHost(page);
    await parecer.enviar();

    // O sistema precisa RECUSAR o envio (sinalizar), nunca rotear silenciosamente uma
    // movimentação sem responsável definido — o que aqui vale dizer: nenhuma requisição de
    // escrita deveria ter saído do cliente.
    expect(
      guardaAmpla.tentativas(),
      'um parecer sem responsável definido não deveria gerar nenhuma requisição de escrita ' +
        `— em vez disso tentou: ${guardaAmpla.urls().join(', ')}`,
    ).toBe(0);
  });

  test('CT-PAR-01-S2 — parecer desfavorável (Reprovado/Ajustes) com justificativa também é barrado pela ausência de responsável', async ({
    page,
  }) => {
    const parecer = new ParecerTecnicoPage(page);

    await parecer.goto();
    await parecer.expectAberto();

    await parecer.preencherParecer(
      criarObservacaoParecerTecnico(
        'parecer desfavorável: propostas recebidas não atendem à especificação técnica solicitada',
      ),
    );
    await parecer.marcarDecisao(false);

    const guardaAmpla = await bloquearTodaEscritaNoHost(page);
    await parecer.enviar();

    expect(
      guardaAmpla.tentativas(),
      'um parecer reprovado sem responsável definido não deveria gerar nenhuma requisição ' +
        `de escrita — em vez disso tentou: ${guardaAmpla.urls().join(', ')}`,
    ).toBe(0);
  });
});
