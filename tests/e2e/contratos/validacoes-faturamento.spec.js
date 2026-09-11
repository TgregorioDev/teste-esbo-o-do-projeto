// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { faltaPreCondicao, tentarComAlternativa } from '../../../utils/pre-condicao.js';
import { MedicaoContratoPage } from '../../../pages/MedicaoContratoPage.js';
import { CentralTarefasComprasPage } from '../../../pages/CentralTarefasComprasPage.js';
import {
  descobrirContratoVigentePorDataset,
  descobrirContratosVigentesPorDataset,
} from '../../../utils/massa-contratos.js';
import { parseFornecedorDaGrade } from '../../../factories/medicao.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';
import {
  descobrirCompetenciaBloqueada,
  listarCompetenciasBrutas,
} from '../../../utils/massa-medicao.js';

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
 *
 * ## FSWTBC-1760 — a metade legível
 *
 * O chamado "Erro na geração dos itens para medição de contrato" foi encerrado como falso
 * defeito: já havia medição para a competência testada, e com outra competência a medição abriu
 * normalmente. O problema que sobrou, e que o próprio chamado nomeia, é a **mensagem
 * inadequada** para uma regra de negócio válida — o usuário não é informado do motivo.
 *
 * É exatamente o que `CT-FAT-02-S2` mede e reprova: o Protheus recusa a competência com uma
 * mensagem de negócio no corpo (`STATUS: ERROR`), e a tela não exibe aviso nenhum. O que aquele
 * teste NÃO garante é o motivo específico da recusa: ele aceita qualquer recusa de negócio
 * (saldo, medições em aberto, revisão pendente), porque amostra as competências que o ambiente
 * oferece no momento — fixar "já medida" transformaria disponibilidade de massa em vermelho.
 *
 * A outra metade do caso (confirmar no ERP que a CND recusa a segunda medição) exige credencial
 * de Protheus e fica fora.
 *
 * ## Chamados cobertos por este arquivo
 *
 * FSWTBC-2143 — todo rótulo de competência do zoom traz separador entre mês e ano.
 * Declarado aqui porque é onde `scripts/gerar-cobertura.mjs` reconhece cobertura.
 */

/**
 * Descobre um contrato vigente com competência em saldo aberto, tentando até
 * `maxContratos` contratos distintos — usado por CT-FAT-02-S1 e CT-FAT-02-S4, que só
 * precisam chegar ao estado "zooms resolvidos sem erro" para verificar que o painel de
 * quantidade/rateio permanece inacessível.
 * @param {import('@playwright/test').Page} page
 * @param {MedicaoContratoPage} medicao
 * @param {number} maxContratos
 * @returns {Promise<{ resultado: Awaited<ReturnType<MedicaoContratoPage['montarMedicaoComSaldoEmAberto']>> | undefined, contratosTentados: string[], descartes: string[] }>}
 */
async function encontrarMedicaoComSaldo(page, medicao, maxContratos = 3) {
  const contratosTentados = /** @type {string[]} */ ([]);
  /** @type {Awaited<ReturnType<MedicaoContratoPage['montarMedicaoComSaldoEmAberto']>> | undefined} */
  let resultado;
  /** Por que cada contrato/competência foi descartado — entra na mensagem de falha. */
  const descartes = /** @type {string[]} */ ([]);

  for (let i = 0; i < maxContratos; i++) {
    const contrato = await descobrirContratoVigentePorDataset(page, {
      excluirContratos: contratosTentados,
    });
    contratosTentados.push(contrato.contrato);
    const fornecedor = parseFornecedorDaGrade(contrato.fornecedor);

    await medicao.goto();
    await medicao.expectAberto();
    // Contrato sem o que medir (fornecedor sem contrato no zoom, zoom de competência vazio) é
    // descartado, e o MOTIVO volta a quem chamou para entrar na mensagem de `faltaPreCondicao`.
    // Qualquer OUTRO erro é relançado: antes todo erro virava descarte e terminava em
    // pré-condição (ver `tentarComAlternativa`).
    const tentativa = await tentarComAlternativa(() => medicao.montarMedicaoComSaldoEmAberto(fornecedor));
    if (!tentativa.serviu) {
      descartes.push(`${contrato.contrato}: ${tentativa.motivo}`);
      continue;
    }
    resultado = tentativa.valor;
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
    // endpoints capturados em campo. Medido depois da mudança: **8,8s**, dos quais 8,2s eram a
    // grade de contratos carregando — desde 11/09/2026 o contrato vem por dataset (cache da execução).
    test.setTimeout(120_000);

    const guarda = await bloquearCriacaoDeSolicitacao(page);

    // Contrato por dataset, sem a grade do Acompanhamento (etapa 3 do plano de evolução).
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

    // Amostra por AFINIDADE, não por posição. `vigentes.slice(0, 4)` — a forma anterior —
    // amostrava sempre os mesmos quatro primeiros contratos da grade, o que reintroduzia pela
    // porta dos fundos a dependência de registro fixo que `utils/massa-contratos.js` existe
    // para eliminar. `descobrirContratosVigentes` devolve quatro contratos reservados e
    // distribuídos, e falha via `faltaPreCondicao` quando a grade não tem massa.
    const MAX_CONTRATOS = 4;
    const amostra = await descobrirContratosVigentesPorDataset(page, MAX_CONTRATOS);

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
      faltaPreCondicao(
        'nenhuma competência recusada pelo Protheus foi encontrada nos ' +
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

    // Contrato por dataset, sem a grade do Acompanhamento (etapa 3 do plano de evolução).
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

    const medicao = new MedicaoContratoPage(page);
    const { resultado, contratosTentados } = await encontrarMedicaoComSaldo(page, medicao);

    if (!resultado?.sucesso) {
      faltaPreCondicao(
        'nenhum contrato vigente tentado teve competência com saldo em ' +
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

    // Contrato por dataset, sem a grade do Acompanhamento (etapa 3 do plano de evolução).
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

    const medicao = new MedicaoContratoPage(page);
    const { resultado, contratosTentados } = await encontrarMedicaoComSaldo(page, medicao);

    if (!resultado?.sucesso) {
      faltaPreCondicao(
        'nenhum contrato vigente tentado teve competência com saldo em ' +
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
    // "Mais opções" é a forma ANTIGA de revelar as categorias de segundo nível. Neste ambiente
    // ele não existe — elas já são abas diretas (medido em 09/09/2026). Clicar
    // incondicionalmente esperava 45s por um link inexistente e reprovava como timeout.
    await tarefas.abrirMaisOpcoesSePresente();

    // O menu abre de forma assíncrona: espera por uma entrada que existe sempre antes de
    // concluir qualquer coisa sobre as que podem faltar.
    // Sem o flyout, "Tarefas a concluir" é o HEADING do painel, não um link do menu. A espera
    // aceita as duas formas: o que importa é a categoria estar na tela antes de concluir
    // qualquer coisa sobre as que podem faltar.
    await page
      .getByText(/Tarefas a concluir/)
      .first()
      .waitFor({ state: 'visible' });

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
      faltaPreCondicao(
        'o menu "Mais opções" não ofereceu "Tarefas em pool" — o ' +
          'usuário está sem nenhuma tarefa em pool neste momento, e o painel só é renderizado ' +
          'quando há ao menos uma. Sem ler o pool não é possível afirmar que não existe grupo ' +
          'de Fiscal/CSE/Medição. Isto NÃO é defeito do produto nem falha da automação. ' +
          `Entradas oferecidas agora: ${oferecidas.map((t) => t.replace(/\s+/g, ' ').trim()).join(' | ')}. ` +
          '\n\nATUALIZAÇÃO de 10/09/2026: a nota anterior aqui dizia que esta automação não ' +
          'conseguia criar o próprio item de pool, e que o `targetState` diferente de 6 no ' +
          '`/start` "nunca foi confirmado como reprodutível". Isso foi MEDIDO e é falso: com ' +
          '`targetState: 0`, oito SCs (96363, 96369, 96370, 96376–96380) foram criadas por API ' +
          'e todas caíram em pool desta conta. Ver `docs/massa-de-dados-no-ambiente-dev.md` e ' +
          '`scripts/semear-massa.mjs`. Portanto popular ESTE menu é viável — o que segue sem ' +
          'caminho conhecido é fazer a SC chegar a um pool de Fiscal/CSE/Medição, que é outro ' +
          'ramo do fluxo e depende de contrato, ausente neste tenant.',
      );
    }
    await linkPool.click();

    // ⚠️ Neste tenant o pool NÃO vive dentro de um dropdown `[id^="more-options-pool_"]`.
    // Medido em 10/09/2026: "Tarefas em pool" é aba direta e o painel — com a legenda e os
    // links de grupo — é renderizado no CORPO da página. Esperar pelo dropdown antigo travava
    // 45s e reprovava como timeout, sem dizer nada sobre Fiscal/CSE, que é o que o caso afirma.
    await page
      .getByText('Tarefas para grupos e papéis que você está associado.')
      .first()
      .waitFor({ state: 'visible' });

    // O gancho estável para os grupos é o atributo `data-node`, que carrega o JSON do nó com
    // `taskId: "Pool:Group:<grupo>"`. Ler por texto aqui é frágil (nome e contador vêm em
    // `<span>` separados, e o `$` de uma regex não casa como se espera). Há DUAS cópias de cada
    // link no DOM e só uma é visível — daí o filtro por visibilidade, e não `.first()`.
    const linksDeGrupo = page.locator('a[data-node*="Pool:Group:"]');
    /** @type {{ nome: string }[]} */
    const grupos = [];
    for (const link of await linksDeGrupo.all()) {
      if (!(await link.isVisible().catch(() => false))) continue;
      const nome = (await link.innerText()).replace(/\s*\(\d+\)\s*$/, '').replace(/\s+/g, ' ').trim();
      if (nome && !grupos.some((g) => g.nome === nome)) grupos.push({ nome });
    }

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

  /**
   * FSWTBC-2143 — todo rótulo de competência tem separador entre mês e ano.
   *
   * O defeito é um rótulo como `062025`: sem separador, o usuário não distingue mês de ano, e
   * a competência escolhida vira outra. A origem é um `replace('/', '-')` no fonte que não
   * valida o resultado.
   *
   * O que a medição de 08/09/2026 corrigiu na minha expectativa: o caso pedia para afirmar
   * `\d{2}/\d{4}` (com BARRA), mas o dataset devolve nativamente **hífen** (`12-2021`,
   * `01-2022`). Afirmar a barra criaria vermelho contra o comportamento normal do produto — o
   * que caracteriza o defeito é a AUSÊNCIA de separador, e é isso que se afirma.
   *
   * Por que a lista tem de vir crua: `descobrirCompetenciaBloqueada` filtra por
   * `^\d{2}-\d{4}$` e joga fora o que não casa. Esse descarte é justamente o que faria um
   * rótulo malformado passar despercebido — daí `listarCompetenciasBrutas`.
   *
   * Leitura pura: nenhuma medição é criada.
   */
  test('FSWTBC-2143 — todo rótulo de competência do zoom traz separador entre mês e ano', async ({
    page,
  }) => {
    test.setTimeout(120_000);

    // Contrato por dataset, sem a grade do Acompanhamento (etapa 3 do plano de evolução).
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

    const amostra = await descobrirContratosVigentesPorDataset(page, 4);

    /** Sentinela que o dataset devolve no lugar de uma competência quando o par não existe. */
    const SENTINELA = /contrato n[ãa]o localizado/i;

    /** @type {string[]} */
    const malformados = [];
    let totalLido = 0;

    for (const linha of amostra) {
      const rotulos = await listarCompetenciasBrutas(page, {
        contrato: linha.contrato,
        filial: linha.filial,
      });
      totalLido += rotulos.length;
      for (const r of rotulos) {
        if (SENTINELA.test(r)) continue;
        if (!/^\d{2}[-/]\d{4}$/.test(r)) malformados.push(`${linha.contrato}: "${r}"`);
      }
    }

    test.info().annotations.push({
      type: 'competencias-lidas',
      description: `${totalLido} rótulo(s) em ${amostra.length} contrato(s); ${malformados.length} malformado(s)`,
    });

    if (totalLido === 0) {
      faltaPreCondicao(
        '(ambiente): nenhum dos contratos amostrados devolveu competência para auditar o formato',
      );
    }

    expect(
      malformados,
      'rótulo de competência sem separador entre mês e ano — o usuário não distingue 06/2025 ' +
        'de 2025-06 e pode medir a competência errada',
    ).toEqual([]);
  });
});
