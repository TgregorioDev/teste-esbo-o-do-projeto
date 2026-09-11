// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { AtribuicaoCompradorPage } from '../../../pages/AtribuicaoCompradorPage.js';
import { GerenciaComprasPage } from '../../../pages/GerenciaComprasPage.js';
import { criarSolicitacaoCompraClassica, aprovarValidacaoDoGestor, aguardarAtividadeAtual } from '../../../pages/CicloCompradorPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * Gerência de Compras → aba Atribuir — CT-E2E-05-H (Gerência de Compras atribui a SC a um
 * comprador).
 *
 * A tarefa desta suíte era medir, não presumir, o que o mapa do ambiente registrava como
 * "a aba Atribuir nunca renderiza dados". As duas specs abaixo fazem exatamente essa medição,
 * com dois ângulos complementares:
 *
 * 1. **Sem criar massa** — ler o que as abas Atribuir e Transferir de fato listam (as duas
 *    carregam por `ds_getSolicsGerenciaCompras`, uma chamada por aba). **Regravado em
 *    11/09/2026.** A medição original (03/09, ambiente anterior) era "a Transferir renderiza 50+
 *    SCs reais e a Atribuir não renderiza nenhuma". No `caixade213859` isso deixou de valer, e o
 *    `@achado` ficou vermelho — que é exatamente o trabalho dele. O que se mede agora: a Atribuir
 *    lista **17** linhas e a Transferir **14**, e, conferindo cada número de processo em
 *    `/process-management/api/v2/requests/{id}`, **todas as 31 são de solicitações `CANCELED`**.
 *    O dataset não filtra instância encerrada: a tela mostra processo cancelado como se estivesse
 *    aguardando atribuição ou transferência.
 *
 * 2. **Criando massa própria** — abrir uma SC nova pelo formulário clássico, aprovar a
 *    "Validação do Gestor" (a única etapa que esta conta consegue mover) e confirmar que a SC
 *    para exatamente em "Validação Orçamentária" — a alçada nominal (AL/DHL) que
 *    `docs/politica-de-escrita.md` já registrava como bloqueio, agora medido com massa própria e
 *    determinística: a SC nunca chega perto da fila de Atribuir porque não passa da etapa
 *    anterior.
 *
 * As duas medições juntas respondem à pergunta do relatório: nenhuma SC VIVA chega à fila de
 * Atribuir para esta conta — o que a grade lista são processos já encerrados, e a massa própria
 * para na Validação Orçamentária (tarefa nominal do gestor do centro de custo).
 *
 * ## `@achado` até 11/09/2026, `@bug` desde então
 *
 * Enquanto a medição era "a Atribuir não lista nada para esta conta", o primeiro teste afirmava o
 * comportamento REAL (`@achado`, verde): não havia critério para dizer que era defeito. A medição de
 * 11/09 mudou isso — a grade lista processo **CANCELADO** como se esperasse atribuição, o que não é
 * questão de massa nem de perfil, e foi comunicado ao desenvolvedor como defeito do widget em
 * 10/09/2026. Por isso o teste agora afirma o ESPERADO (nenhuma linha encerrada) e leva `@bug`:
 * reprova enquanto o dataset não filtrar `END_DATE`, e fica verde sozinho no dia do conserto.
 * Grade vazia não é o defeito e não reprova.
 *
 * O vermelho de CT-E2E-05-H — o caso escrito contra o comportamento ESPERADO, "a aba deve
 * listar as solicitações pendentes de atribuição" — vive em
 * `tests/e2e/portais/gerencia-compras.spec.js` (`@bug`). Aqui só se documenta a causa.
 */
test.describe('Gerência de Compras — Atribuir comprador (CT-E2E-05-H)', () => {
  test('as abas Atribuir e Transferir não deveriam listar processo já encerrado — a grade não filtra instância cancelada @bug', async ({
    page,
  }, testInfo) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const gerencia = new GerenciaComprasPage(page);

    await gerencia.goto();
    await gerencia.expectCarregada();

    for (const aba of /** @type {const} */ (['Atribuir', 'Transferir'])) {
      if (aba === 'Atribuir') await gerencia.abrirAbaAtribuir();
      else await gerencia.abrirAbaTransferir();

      // Conta linha REAL: a linha do estado vazio conta como linha e fica na tela enquanto a
      // grade carrega (`utils/grade.js`). Grade vazia não é o defeito — só entra na anotação.
      const linhas = await gerencia.esperarLinhasReais();

      // O número de processo de cada linha, conferido no servidor. É isto que separa "a grade
      // tem dado" de "a grade tem SC que ainda espera ação".
      const processos = await gerencia.lerNumerosDeProcesso();
      const { ativos, encerrados } = await gerencia.separarProcessosAtivos(processos);
      testInfo.annotations.push({
        type: `aba-${aba.toLowerCase()}`,
        description:
          `${linhas} linha(s) · ${ativos.length} aberta(s) · ${encerrados.length} encerrada(s)` +
          (encerrados.length ? `: ${encerrados.slice(0, 6).join(', ')}` : ''),
      });

      expect(
        encerrados,
        `a aba ${aba} lista ${encerrados.length} processo(s) já encerrado(s) como se esperassem ` +
          `ação: \`ds_getSolicsGerenciaCompras\` não filtra instância com END_DATE (medido em ` +
          '11/09/2026: as 31 linhas das duas abas eram de solicitações CANCELED)',
      ).toEqual([]);
    }

    expect(guarda.tentativas(), 'ler as filas da Gerência de Compras não deveria escrever nada').toBe(0);
  });

  test('@destrutivo uma SC própria aprovada na Validação do Gestor para em Validação Orçamentária, sem nunca chegar à fila de Atribuir', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const { numeroProcesso } = await criarSolicitacaoCompraClassica(page, {
      justificativa: `QA CT-E2E-05-H atribuicao comprador ${Date.now()}`,
    });

    await aprovarValidacaoDoGestor(page, numeroProcesso, 'QA aprovando Validação do Gestor — CT-E2E-05-H');

    const atividade = await aguardarAtividadeAtual(page, numeroProcesso, ['Validação Orçamentária'], {
      timeout: 90_000,
    });
    expect(atividade).toBe('Validação Orçamentária');

    // A alçada é quem barra o caminho — não a UI. Confirmado: nenhum "Assumir tarefa" para esta
    // conta na atividade em que a SC efetivamente parou.
    await expect(page.getByRole('button', { name: 'Assumir tarefa' })).toHaveCount(0);

    // E, coerente com o achado acima: a SC recém-criada não aparece na aba Atribuir — nunca
    // avançou até lá.
    const atribuicao = new AtribuicaoCompradorPage(page);
    await atribuicao.goto();
    await atribuicao.expectCarregada();
    await atribuicao.abrirAbaAtribuir();
    await expect(atribuicao.getTabelaAtiva()).toBeVisible();
    await expect(atribuicao.localizarLinhaPorNumero(numeroProcesso)).toHaveCount(0);
  });
});
