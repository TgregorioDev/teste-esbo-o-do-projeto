// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { AcompanhamentoContratosPage } from '../../../pages/AcompanhamentoContratosPage.js';
import { MedicaoContratoPage } from '../../../pages/MedicaoContratoPage.js';
import { CentralTarefasComprasPage } from '../../../pages/CentralTarefasComprasPage.js';
import {
  descobrirContratoVigente,
  descobrirContratosVigentes,
} from '../../../utils/massa-contratos.js';
import { parseFornecedorDaGrade } from '../../../factories/medicao.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';
import { descobrirCompetenciaBloqueada } from '../../../utils/massa-medicao.js';

/**
 * CT-FAT-02 — bloqueios e validações do ciclo de Faturamento de Contratos.
 *
 * `ciclo-faturamento.spec.js` já documenta, com evidência ao vivo (leitura do JavaScript do
 * formulário e checagem dos grupos em pool do usuário), que o painel de quantidade/rateio
 * (`#panel_MeasurementItens`) só é liberado na etapa "Realizar Medição do Contrato", assumida
 * por quem consta como Fiscal/CSE DAQUELE CONTRATO no Protheus — não pelo usuário desta
 * automação, para nenhum contrato encontrado. Os testes S1/S3/S4 abaixo tornam essa
 * investigação uma ASSERTION verificável a cada execução, em vez de uma nota estática: se um
 * dia a Cassi conceder essa role à automação, ou o formulário mudar, estes testes reprovam
 * primeiro — sinalizando que os cenários completos passaram a ser alcançáveis.
 */

/**
 * Descobre um contrato vigente com competência em saldo aberto, tentando até
 * `maxContratos` contratos distintos — usado por CT-FAT-02-S1 e CT-FAT-02-S4, que só
 * precisam chegar ao estado "zooms resolvidos sem erro" para verificar que o painel de
 * quantidade/rateio permanece inacessível.
 * @param {import('../../../pages/AcompanhamentoContratosPage.js').AcompanhamentoContratosPage} contratosPage
 * @param {MedicaoContratoPage} medicao
 * @param {number} maxContratos
 * @returns {Promise<{ resultado: Awaited<ReturnType<MedicaoContratoPage['montarMedicaoComSaldoEmAberto']>> | undefined, contratosTentados: string[], descartes: string[] }>}
 */
async function encontrarMedicaoComSaldo(contratosPage, medicao, maxContratos = 3) {
  const contratosTentados = /** @type {string[]} */ ([]);
  /** @type {Awaited<ReturnType<MedicaoContratoPage['montarMedicaoComSaldoEmAberto']>> | undefined} */
  let resultado;
  /** Por que cada contrato/competência foi descartado — entra na mensagem de falha. */
  const descartes = /** @type {string[]} */ ([]);

  for (let i = 0; i < maxContratos; i++) {
    // `medicao.goto()` (chamado no fim da iteração anterior) navega para fora do Portal de
    // Acompanhamento de Contratos — precisa voltar antes de ler a grade de novo.
    if (i > 0) {
      await contratosPage.goto();
      await contratosPage.expectCarregada();
    }
    const contrato = await descobrirContratoVigente(contratosPage, {
      excluirContratos: contratosTentados,
    });
    contratosTentados.push(contrato.contrato);
    const fornecedor = parseFornecedorDaGrade(contrato.fornecedor);

    await medicao.goto();
    await medicao.expectAberto();
    try {
      resultado = await medicao.montarMedicaoComSaldoEmAberto(fornecedor);
    } catch (erro) {
      // Contrato descartado antes de chegar a tentar competências (ex.: fornecedor sem
      // contrato navegável pelo zoom). O MOTIVO é guardado e devolvido a quem chamou, para
      // entrar na mensagem de PRÉ-CONDIÇÃO AUSENTE: engolido, o relatório dizia apenas
      // "nenhum contrato serviu", sem dizer por quê.
      descartes.push(`${contrato.contrato}: ${erro instanceof Error ? erro.message : String(erro)}`);
      continue;
    }
    if (resultado.sucesso) break;
    for (const t of resultado.tentativas) {
      descartes.push(`${contrato.contrato} / competência ${t.competencia}: ${t.mensagem}`);
    }
  }

  return { resultado, contratosTentados, descartes };
}

test.describe('Faturamento de Contratos — validações e bloqueios', () => {
  test('CT-FAT-02-S2: competência recusada pelo Protheus deve bloquear a medição E avisar o usuário', async ({
    page,
  }) => {
    // Antes este teste levava 153s: procurava a competência bloqueada NAVEGANDO, uma cadeia de
    // cinco zooms por tentativa (~30s), em até 5 contratos. A mesma informação está em dois
    // datasets que respondem em milissegundos — ver `utils/massa-medicao.js`, que documenta os
    // endpoints capturados em campo. Medido depois da mudança: **8,8s**, dos quais 8,2s são a
    // própria grade de contratos carregando; a descoberta em si custa 0,7s.
    test.setTimeout(120_000);

    const guarda = await bloquearCriacaoDeSolicitacao(page);

    const contratosPage = new AcompanhamentoContratosPage(page);
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    // Amostra por AFINIDADE, não por posição. `vigentes.slice(0, 4)` — a forma anterior —
    // amostrava sempre os mesmos quatro primeiros contratos da grade, o que reintroduzia pela
    // porta dos fundos a dependência de registro fixo que `utils/massa-contratos.js` existe
    // para eliminar. `descobrirContratosVigentes` devolve quatro contratos reservados e
    // distribuídos, e falha com `PRÉ-CONDIÇÃO AUSENTE` quando a grade não tem massa.
    const MAX_CONTRATOS = 4;
    const amostra = await descobrirContratosVigentes(contratosPage, MAX_CONTRATOS);

    const tentados = /** @type {string[]} */ ([]);
    /** @type {{ competencia: string, mensagemDoServidor: string } | null} */
    let bloqueada = null;
    /** @type {(typeof amostra)[number] | undefined} */
    let contratoAlvo;

    for (const linha of amostra) {
      tentados.push(linha.contrato);
      bloqueada = await descobrirCompetenciaBloqueada(page, {
        contrato: linha.contrato,
        filial: linha.filial,
        maxCompetencias: 4,
      });
      if (bloqueada) {
        contratoAlvo = linha;
        break;
      }
    }

    if (!bloqueada || !contratoAlvo) {
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE: nenhuma competência recusada pelo Protheus foi encontrada nos ' +
          `contratos vigentes consultados (${tentados.join(', ')}). Isto NÃO é defeito do ` +
          'produto sob teste: significa que, no momento desta execução, todas as competências ' +
          'amostradas estavam liberadas para medir.',
      );
    }

    // ── Prova 1: o SERVIDOR recusa, e a recusa é validação de negócio, não erro genérico.
    expect(
      bloqueada.mensagemDoServidor,
      `o Protheus recusou a medição de ${contratoAlvo.contrato}/${bloqueada.competencia}, mas com ` +
        'uma mensagem que não parece validação de negócio — se virou erro de infraestrutura, ' +
        'este teste não está mais medindo o que deveria',
    ).toMatch(/saldo|medições em aberto|revisão pendente|não é permitido medir/i);

    // ── Prova 2: a INTERFACE tem que repassar essa recusa ao usuário.
    const medicao = new MedicaoContratoPage(page);
    await medicao.goto();
    await medicao.expectAberto();

    const fornecedor = parseFornecedorDaGrade(contratoAlvo.fornecedor);
    await medicao.selecionarFornecedorPorCodigoLoja(fornecedor.codigo, fornecedor.loja);
    await medicao.selecionarPrimeiroContrato();

    const competencias = await medicao.listarCompetencias();
    const rotulo = competencias.find((c) => c.includes(bloqueada.competencia));
    expect(
      rotulo,
      `a competência ${bloqueada.competencia}, que o dataset ofereceu para o contrato ` +
        `${contratoAlvo.contrato}, não apareceu no zoom da tela: ${JSON.stringify(competencias)}`,
    ).toBeDefined();

    await medicao.selecionarCompetencia(/** @type {string} */ (rotulo));
    await medicao.selecionarPrimeiraFilialMedicao();
    await medicao.selecionarPrimeiraPlanilha();
    const naTela = await medicao.aguardarResultadoDaConsultaDeSaldo();

    // ⚠️ REPROVA DE PROPÓSITO — defeito confirmado em 26/08/2026, interceptando a resposta que
    // o widget recebe: com `STATUS: ERROR` e a mensagem do Protheus no corpo, NENHUM diálogo é
    // exibido. O painel de itens não abre (então nada é medido), mas o usuário não é informado
    // do motivo — a tela simplesmente não reage. Foi por isso que este teste antes concluía
    // "nenhuma competência bloqueada encontrada": o bloqueio existia em todas, e o oráculo
    // (o diálogo) nunca disparava.
    expect(
      naTela.comErro,
      'defeito: o Protheus recusou a medição com "' +
        bloqueada.mensagemDoServidor.slice(0, 160) +
        '", mas a tela não exibiu nenhum aviso ao usuário — a recusa é engolida silenciosamente',
    ).toBe(true);

    expect(naTela.mensagem).toMatch(/saldo|medições em aberto|revisão pendente|não é permitido medir/i);

    // O painel de itens nunca chegou a ser liberado, e nenhuma medição foi criada.
    await expect(medicao.frame.locator('#panel_MeasurementItens')).toBeHidden();
    expect(guarda.tentativas(), `tentativas bloqueadas: ${guarda.urls().join(', ')}`).toBe(0);
  });

  test('CT-FAT-02-S1: lançar quantidade acima do Saldo a Medir não é alcançável pelo usuário desta automação — o campo de quantidade fica bloqueado até a etapa "Realizar Medição do Contrato"', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    const guarda = await bloquearCriacaoDeSolicitacao(page);

    const contratosPage = new AcompanhamentoContratosPage(page);
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    const medicao = new MedicaoContratoPage(page);
    const { resultado, contratosTentados } = await encontrarMedicaoComSaldo(contratosPage, medicao);

    if (!resultado?.sucesso) {
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE: nenhum contrato vigente tentado teve competência com saldo em ' +
          `aberto — impossível chegar ao estado onde o campo de quantidade existiria. Tentados: ${contratosTentados.join(', ')}.`,
      );
    }

    // A cadeia de zooms resolveu SEM erro (há saldo em aberto): mesmo assim, o painel que
    // conteria os campos de quantidade continua oculto (`display: none` inline, ver
    // `#panel_MeasurementItens` no HTML do formulário) — não é revelado pela seleção em si,
    // só na etapa seguinte do workflow, assumida por quem consta como Fiscal/CSE do contrato.
    const inputsQuantidade = medicao.frame.locator('input[id^="quantidade___"]');
    await expect(medicao.frame.locator('#panel_MeasurementItens')).toBeHidden();
    // Quando o Protheus já populou os itens da planilha no DOM (confirmado acontecer em
    // parte das execuções — depende de timing do backend, não é garantido a cada chamada),
    // isso reforça a prova de que o bloqueio é de ETAPA, não de ausência de dado: o campo de
    // quantidade existe, só que oculto dentro do painel.
    // Incondicional de propósito: `filter({ visible: true })` cobre os dois casos de uma vez —
    // se o Protheus ainda não populou os itens, a contagem é 0 e a afirmação continua verdadeira;
    // se populou, nenhum campo pode estar visível. A forma condicional (`if (count > 0)`) é
    // proibida pela skill: um teste que só valida quando o dado aparece passa sem provar nada
    // justamente nas execuções em que o backend foi mais lento.
    await expect(
      inputsQuantidade.filter({ visible: true }),
      'nenhum campo de quantidade pode estar alcançável antes da etapa "Realizar Medição do Contrato"',
    ).toHaveCount(0);

    // Sem o campo alcançável, não há como lançar quantidade acima do saldo — e, coerentemente,
    // nenhuma medição foi enviada por este teste.
    expect(guarda.tentativas(), `tentativas bloqueadas: ${guarda.urls().join(', ')}`).toBe(0);
  });

  test('CT-FAT-02-S4: fechar rateio contábil diferente de 100% não é alcançável pelo usuário desta automação — a aba "Rateio Contábil" fica bloqueada até a etapa "Realizar Medição do Contrato"', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    const guarda = await bloquearCriacaoDeSolicitacao(page);

    const contratosPage = new AcompanhamentoContratosPage(page);
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    const medicao = new MedicaoContratoPage(page);
    const { resultado, contratosTentados } = await encontrarMedicaoComSaldo(contratosPage, medicao);

    if (!resultado?.sucesso) {
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE: nenhum contrato vigente tentado teve competência com saldo em ' +
          `aberto — impossível chegar ao estado onde a aba de rateio existiria. Tentados: ${contratosTentados.join(', ')}.`,
      );
    }

    const abaRateio = medicao.frame.locator('a[href="#tabRateio"]');
    await expect(medicao.frame.locator('#panel_MeasurementItens')).toBeHidden();
    await expect(abaRateio).toBeAttached();
    await expect(abaRateio).toBeHidden();

    expect(guarda.tentativas(), `tentativas bloqueadas: ${guarda.urls().join(', ')}`).toBe(0);
  });

  test('CT-FAT-02-S3: reprovar uma validação (Validação CSE / Validação da Medição CSE / Validação do Fiscal de Contrato) não é alcançável — o usuário desta automação não pertence a nenhum grupo dessas etapas', async ({
    page,
  }) => {
    const tarefas = new CentralTarefasComprasPage(page);
    await tarefas.goto();
    await tarefas.titulo.waitFor({ state: 'visible' });
    // `abrirTarefasEmPool()` (Page Object existente) parte do pressuposto de que o link
    // "Tarefas em pool" já está visível na aba "Resumo de Tarefas" — em campo, ele só fica
    // visível depois de abrir o menu "Mais opções" ao lado dela (confirmado nesta
    // investigação). Reproduz aqui a navegação real antes de reusar `listarGrupos()`.
    await tarefas.abaResumo.click();
    await page.getByRole('link', { name: 'Mais opções' }).click();

    // O menu abre de forma assíncrona: espera por uma entrada que existe sempre antes de
    // concluir qualquer coisa sobre as que podem faltar.
    await page.getByRole('link', { name: /^Tarefas a concluir/ }).waitFor({ state: 'visible' });

    // "Tarefas em pool" só é renderizada quando o usuário TEM ao menos uma tarefa em pool.
    // Sem essa entrada o teste não consegue LER o pool — e "não consegui ler" é diferente de
    // "não existe grupo de Fiscal/CSE", que é o que ele afirma. Clicar às cegas aqui estoura
    // 45s num timeout que não explica nada; a pré-condição legível separa ambiente de defeito.
    const linkPool = page.getByRole('link', { name: /^Tarefas em pool/ });
    if ((await linkPool.count()) === 0) {
      // Lê os rótulos realmente visíveis do menu: sem isso a mensagem promete uma lista e
      // entrega vazio, que é pior do que não prometer nada.
      const oferecidas = await page
        .getByRole('link')
        .evaluateAll((els) =>
          els
            .filter((el) => /** @type {HTMLElement} */ (el).offsetParent !== null)
            .map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
            .filter(Boolean)
            .slice(-8),
        );
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE: o menu "Mais opções" não ofereceu "Tarefas em pool" — o ' +
          'usuário está sem nenhuma tarefa em pool neste momento, e o painel só é renderizado ' +
          'quando há ao menos uma. Sem ler o pool não é possível afirmar que não existe grupo ' +
          'de Fiscal/CSE/Medição. Isto NÃO é defeito do produto nem falha da automação. ' +
          `Entradas oferecidas agora: ${oferecidas.map((t) => t.replace(/\s+/g, ' ').trim()).join(' | ')}`,
      );
    }
    await linkPool.click();
    // Não usa `.first()` sobre `getByRole('link').filter(...)` para esperar: a página tem
    // outros links que batem com o mesmo padrão de texto em pontos fora deste dropdown, e
    // `.first()` segue a ordem do DOM, não a de visibilidade — esperar por ele trava. A
    // legenda do painel é exclusiva deste dropdown e confirma que ele terminou de renderizar.
    const dropdownPool = page.locator('[id^="more-options-pool_"]');
    await dropdownPool
      .getByText('Tarefas para grupos e papéis que você está associado.')
      .waitFor({ state: 'visible' });

    // Não reusa `CentralTarefasComprasPage.listarGrupos()` aqui: seu locator
    // (`getByRole('link').filter({ hasText: /\(\d+\)$/ })`) devolve ZERO elementos neste
    // dropdown específico mesmo com os links realmente presentes e com texto batendo a
    // regex (confirmado isoladamente) — os nós de texto internos (nome do grupo e "(N)" em
    // `<span>` separados) fazem o `$` da regex não casar do jeito que o `hasText` do
    // Playwright normaliza o texto aqui. Filtrar por substring evita a armadilha.
    const linksDeGrupo = dropdownPool.getByRole('link').filter({ hasText: 'Grupo de' });
    const nomes = await linksDeGrupo.allInnerTexts();
    const grupos = nomes.map((n) => ({ nome: n.replace(/\s*\(\d+\)\s*$/, '').trim() }));

    // Evidência positiva de que o pool foi lido de verdade (não é um falso-negativo de rede):
    // o usuário TEM grupos em pool — só não tem nenhum relacionado a Contratos/Fiscal/CSE.
    expect(grupos.length).toBeGreaterThan(0);

    const gruposDeValidacaoDeMedicao = grupos.filter((g) =>
      /fiscal|cse|medi(ç|c)[aã]o|contrato/i.test(g.nome),
    );
    expect(
      gruposDeValidacaoDeMedicao.map((g) => g.nome),
      'nenhum grupo de pool relacionado a Fiscal/CSE/Medição de Contrato deveria existir para ' +
        'este usuário — se existir, os cenários de validação passaram a ser alcançáveis e este ' +
        'teste deve ser revisto para exercitá-los de fato',
    ).toEqual([]);
  });
});
