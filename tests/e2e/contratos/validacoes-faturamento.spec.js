// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { AcompanhamentoContratosPage } from '../../../pages/AcompanhamentoContratosPage.js';
import { MedicaoContratoPage } from '../../../pages/MedicaoContratoPage.js';
import { CentralTarefasComprasPage } from '../../../pages/CentralTarefasComprasPage.js';
import { descobrirContratoVigente } from '../../../utils/massa-contratos.js';
import { parseFornecedorDaGrade } from '../../../factories/medicao.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

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
  test('CT-FAT-02-S2: competência sem saldo em aberto (ou contrato com revisão pendente) deve bloquear a medição antes do envio', async ({
    page,
  }) => {
    // Buscar uma competência bloqueada entre vários contratos/competências é legitimamente
    // demorado (cada tentativa é uma cadeia de zooms real contra o Protheus, ~5-10s) — o
    // mesmo raciocínio do timeout de 120s do `playwright.config.js` ("o ambiente é
    // legitimamente lento… não mascara flakiness"), só que este teste amplia a busca.
    test.setTimeout(180_000);

    const guarda = await bloquearCriacaoDeSolicitacao(page);

    const contratosPage = new AcompanhamentoContratosPage(page);
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    const medicao = new MedicaoContratoPage(page);

    // Não há oráculo para saber de antemão qual competência está fechada para medição —
    // tenta a competência mais antiga oferecida (mais provável de já estar medida/fechada)
    // de vários contratos vigentes, até reproduzir o bloqueio. Testa só 1 competência por
    // contrato e escala para MAIS contratos: quando um contrato tem saldo em aberto, isso
    // tende a valer para a maioria das competências dele (confirmado em campo) — aprofundar
    // num único contrato não ajuda tanto quanto amostrar mais contratos. Também evita reabrir
    // o zoom de Competência mais de uma vez por contrato: reabri-lo depois que os campos
    // auto-preenchidos (Tipo, Situação, Objeto…) aparecem expõe o formulário a um tooltip
    // Bootstrap que passa a interceptar o clique nesse campo (armadilha já documentada nesta
    // suíte para combos/ícones de zoom).
    const MAX_CONTRATOS = 5;
    const MAX_COMPETENCIAS_POR_CONTRATO = 1;
    let bloqueioReproduzido = false;
    let mensagemBloqueio = '';
    const contratosTentados = /** @type {string[]} */ ([]);

    /** Por que cada contrato foi descartado antes de chegar a uma competência bloqueada. */
    const descartes = /** @type {string[]} */ ([]);

    for (let c = 0; c < MAX_CONTRATOS && !bloqueioReproduzido; c++) {
      // `medicao.goto()` (chamado no fim da iteração anterior) navega para fora do Portal de
      // Acompanhamento de Contratos — precisa voltar antes de ler a grade de novo.
      if (c > 0) {
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
        await medicao.selecionarFornecedorPorCodigoLoja(fornecedor.codigo, fornecedor.loja);
        await medicao.selecionarPrimeiroContrato();
      } catch (erro) {
        // Contrato descartado por não ser navegável pelo zoom (ver PRÉ-CONDIÇÃO AUSENTE
        // lançada por `selecionarPrimeiroContrato`) — tenta o próximo contrato descoberto,
        // guardando o motivo para a mensagem final em vez de engoli-lo.
        descartes.push(`${contrato.contrato}: ${erro instanceof Error ? erro.message : String(erro)}`);
        continue;
      }
      const competencias = await medicao.listarCompetencias();

      for (let i = 0; i < Math.min(competencias.length, MAX_COMPETENCIAS_POR_CONTRATO); i++) {
        // `listarCompetencias()` só abre o zoom para ler as opções, sem selecionar nenhuma —
        // é preciso selecionar explicitamente mesmo na primeira tentativa (i === 0).
        await medicao.selecionarCompetencia(competencias[i]);
        const filialOfertada = await medicao.selecionarPrimeiraFilialMedicao();
        if (!filialOfertada) continue;
        const planilhaEscolhida = await medicao.selecionarPrimeiraPlanilha();
        if (!planilhaEscolhida) continue;
        const resultado = await medicao.aguardarResultadoDaConsultaDeSaldo();

        if (resultado.comErro) {
          bloqueioReproduzido = true;
          mensagemBloqueio = resultado.mensagem;
          break;
        }
        // Sem erro nesta competência: ela TEM saldo em aberto — não serve para este teste
        // negativo. Segue para a próxima sem fechar diálogo nenhum (não houve diálogo).
      }
    }

    if (!bloqueioReproduzido) {
      throw new Error(
        'PRÉ-CONDIÇÃO AUSENTE: nenhuma competência bloqueada (sem saldo/revisão pendente) foi ' +
          `encontrada entre os contratos vigentes tentados (${contratosTentados.join(', ')}) — ` +
          'isto NÃO é defeito do produto sob teste; todas as competências amostradas tinham ' +
          `saldo em aberto no momento desta execução. Contratos descartados antes disso: ${JSON.stringify(descartes)}`,
      );
    }

    // O bloqueio é uma validação de negócio explícita, não um erro genérico de rede.
    expect(mensagemBloqueio.length).toBeGreaterThan(0);
    expect(mensagemBloqueio).toMatch(/saldo|medições em aberto|revisão pendente/i);

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
    await page.getByRole('link', { name: /^Tarefas em pool/ }).click();
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
