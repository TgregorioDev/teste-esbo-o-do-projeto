// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { faltaPreCondicao, tentarComAlternativa } from '../../../utils/pre-condicao.js';
import { AcompanhamentoContratosPage } from '../../../pages/AcompanhamentoContratosPage.js';
import { MedicaoContratoPage } from '../../../pages/MedicaoContratoPage.js';
import { CentralTarefasComprasPage } from '../../../pages/CentralTarefasComprasPage.js';
import { descobrirContratoVigente } from '../../../utils/massa-contratos.js';
import { parseFornecedorDaGrade } from '../../../factories/medicao.js';

/**
 * CT-FAT-01-H — ciclo de Faturamento de Contratos: criação de medição a partir de contrato
 * vigente descoberto em tempo de execução (ver `utils/massa-contratos.js`).
 *
 * ## O que este teste alcança, e por que não alcança mais
 *
 * O roteiro original previa: selecionar Fornecedor/Contrato/Revisão/Competência/Filial,
 * lançar quantidades ≤ Saldo a Medir, fechar rateio em 100%, marcar "Houve Prestação de
 * Serviço? Sim", Enviar, e então percorrer Validação CSE → Validação da Medição CSE →
 * Validação do Fiscal de Contrato aprovando em cada uma.
 *
 * Investigação em campo (lendo `App/ViewHandler.js` do formulário, servido pelo próprio
 * Fluig) confirmou que os campos de quantidade/rateio/"Houve Prestação de Serviço?" vivem
 * dentro de um painel (`#panel_MeasurementItens`) que só é liberado quando
 * `controlField === 'GRAVA_MED'` — condição que passa a valer somente na etapa seguinte do
 * workflow, "Realizar Medição do Contrato", assumida por quem consta como FISCAL ou CSE
 * DAQUELE CONTRATO no Protheus (um e-mail nominal, ex.: `matheus.carmo03@cassi.com.br`,
 * distinto por contrato — confirmado no modal "Informações do Contrato"). O usuário desta
 * automação (`fabricasoftware@totvs.com.br`) não é Fiscal/CSE de nenhum contrato encontrado,
 * e sua Central de Tarefas mostra só 2 grupos em pool, ambos de Compras — nenhum de
 * Contratos/Fiscal/CSE/Validação de Medição. Isto é bloqueio de PRÉ-CONDIÇÃO da mesma
 * categoria do aprovador de alçada (AL/DHL) já documentado em `docs/politica-de-escrita.md`
 * — verificado ao vivo nesta investigação, não presumido.
 *
 * Por isso este teste cobre o que É alcançável e é, sozinho, uma prova de valor real: a
 * etapa "Início" cria de fato uma medição válida no Protheus (a cadeia de 5 zooms resolve
 * sem erro, o envio é aceito) e o processo é corretamente roteado para a próxima atividade
 * humana — sem nunca chegar a preencher quantidade/rateio, que ficam fora de alcance.
 * `tests/e2e/contratos/validacoes-faturamento.spec.js` documenta, com evidência ao vivo, por
 * que CT-FAT-02-S1/S3/S4 (que dependem desse painel) não são alcançáveis por este usuário.
 *
 * ## Chamados cobertos por este arquivo
 *
 * Além de CT-FAT-01-H, o bloco de verificação do que a medição CONTÉM cobre os chamados
 * FSWTBC-629, FSWTBC-695, FSWTBC-2886, FSWTBC-4122, FSWTBC-4266 e FSWTBC-4792 — todos sobre o
 * estado da medição depois de criada, e todos respondidos pela mesma massa. A declaração fica
 * aqui, no cabeçalho, porque é onde `scripts/gerar-cobertura.mjs` reconhece cobertura: ID
 * citado só em comentário no meio do arquivo NÃO conta, por decisão de 03/09/2026.
 */
test.describe('Faturamento de Contratos — ciclo de medição', () => {
  test('CT-FAT-01-H @destrutivo: deve criar uma medição válida a partir de um contrato vigente e roteá-la para a próxima atividade do workflow', async ({
    page,
  }, testInfo) => {
    // Buscar um contrato/competência com saldo em aberto é legitimamente demorado (cada
    // tentativa é uma cadeia de zooms real contra o Protheus, ~5-10s) — o mesmo raciocínio do
    // timeout de 120s do `playwright.config.js` ("o ambiente é legitimamente lento… não
    // mascara flakiness"), só que este teste amplia a busca por até 3 contratos.
    test.setTimeout(180_000);

    const contratosPage = new AcompanhamentoContratosPage(page);
    await contratosPage.goto();
    await contratosPage.expectCarregada();

    const medicao = new MedicaoContratoPage(page);

    // Não há oráculo para saber de antemão qual contrato/competência tem saldo em aberto
    // para medir (varia com o tempo e com execuções concorrentes desta suíte). Tenta até
    // 3 contratos vigentes distintos, cada um com sua própria busca de competência —
    // consistente com "nunca fixe o valor de um contrato numa constante" (README).
    const MAX_CONTRATOS = 3;
    /** @type {Awaited<ReturnType<MedicaoContratoPage['montarMedicaoComSaldoEmAberto']>> | undefined} */
    let resultado;
    const contratosTentados = /** @type {string[]} */ ([]);
    /** Por que cada contrato/competência foi descartado — vai inteiro para a mensagem de falha. */
    const descartes = /** @type {string[]} */ ([]);

    for (let i = 0; i < MAX_CONTRATOS; i++) {
      // `medicao.goto()` (chamado no fim da iteração anterior) navega para fora do Portal
      // de Acompanhamento de Contratos — precisa voltar antes de ler a grade de novo.
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

      // Contrato sem o que medir (fornecedor sem contrato no zoom, zoom de competência vazio) é
      // descartado, e o MOTIVO entra na mensagem final — sem ele a pré-condição dizia
      // `Tentativas: []`. Qualquer OUTRO erro é relançado: antes todo erro virava descarte e
      // terminava em pré-condição (ver `tentarComAlternativa`).
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

    if (!resultado?.sucesso) {
      faltaPreCondicao(
        'nenhum dos contratos vigentes tentados ' +
          `(${contratosTentados.join(', ')}) tem competência com saldo em aberto para medir ` +
          'no momento desta execução — isto NÃO é defeito do produto sob teste. Motivo de cada ' +
          `descarte: ${JSON.stringify(descartes)}`,
      );
    }

    // A cadeia de zooms resolveu sem erro de negócio: envia a medição.
    await medicao.enviar();
    const numeroSolicitacao = await medicao.lerNumeroDaSolicitacaoCriada();
    expect(numeroSolicitacao).toBeGreaterThan(0);

    // ⚠️ RASTREABILIDADE — este é o único fluxo destrutivo da suíte que NÃO carrega o prefixo
    // `QA`, e não por omissão: medido em 26/08/2026, o formulário de medição tem 34 campos de
    // texto e ZERO editáveis na etapa "Início" — todos `readonly`/`disabled`, porque vêm de
    // zoom do Protheus ou de auto-preenchimento. O campo "Observações", que aceitaria o
    // carimbo, só destrava em "Realizar Medição do Contrato", etapa de quem é Fiscal/CSE do
    // contrato no Protheus. Não existe onde escrever.
    //
    // O substituto possível é registrar O QUE FOI CRIADO: o número da medição vai para as
    // anotações e para um anexo, então o resíduo desta execução fica identificável pelo
    // relatório mesmo sem marca no dado. Ao higienizar a base, é por aqui que se sabe quais
    // medições vieram da automação.
    testInfo.annotations.push({ type: 'medicao-criada', description: String(numeroSolicitacao) });
    await testInfo.attach('medicao-criada', {
      body: JSON.stringify(
        {
          numeroDaSolicitacao: numeroSolicitacao,
          contrato: resultado.contrato,
          competencia: resultado.competencia,
          planilha: resultado.planilha,
          observacao:
            'Sem prefixo QA no dado: o formulário de medição não expõe campo de texto editável ' +
            'na etapa Início (34 campos, 0 editáveis — medido). Este anexo é a trilha.',
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });

    // Confirma que o processo avançou de "Início" para uma atividade de validação humana —
    // a prova de que a medição foi aceita e roteada corretamente, mesmo sem a automação
    // poder concluir essa validação (ver nota da classe acima).
    const tarefas = new CentralTarefasComprasPage(page);
    await tarefas.abrirDetalheDaSolicitacao(numeroSolicitacao);
    await tarefas.headingAtual().waitFor({ state: 'visible', timeout: 30000 });
    const nomeAtividade = await tarefas.lerNomeAtividadeAtual();

    expect(nomeAtividade, 'a medição deve ter avançado para além de "Início"').not.toBe('');
    expect(nomeAtividade.toLowerCase()).not.toContain('início');

    // ─────────────────────────────────────────────────────────────────────────────────────
    // FSWTBC-629, 695, 2886, 4122, 4266 e 4792 — o que a medição criada realmente CONTÉM.
    //
    // Até aqui o teste criava a medição e afirmava apenas que a atividade não era "Início".
    // Isso passa mesmo que a medição tenha nascido para o contrato errado, sem competência,
    // sem fornecedor e sem número — seis chamados vivem exatamente nesse vão.
    //
    // Nada aqui cria massa nova: é leitura da solicitação que o próprio teste acabou de criar.
    // A API é chamada de dentro da página porque `page.request` leva 403 do WAF neste tenant.
    // ─────────────────────────────────────────────────────────────────────────────────────
    const gravado = await page.evaluate(async (instancia) => {
      /** @param {string} url */
      const json = async (url) => {
        const r = await fetch(url, { headers: { Accept: 'application/json' } });
        return r.ok ? r.json() : null;
      };

      const det = await json(`/process-management/api/v2/requests/${instancia}?expand=formFields`);
      /** @type {Record<string,string>} */
      const campos = {};
      for (const f of det?.formFields ?? []) campos[f.field] = f.value;

      // Logo após o Enviar a medição passa por etapas AUTOMÁTICAS ("Busca Informações do
      // Contrato" foi a observada). Afirmar a atividade nesse instante mede o meio do caminho,
      // não o roteamento. Espera pela atividade humana, com teto próprio.
      const limite = Date.now() + 150_000;
      /** @type {any} */
      let aberta = null;
      while (Date.now() < limite) {
        const t = await json(`/process-management/api/v2/requests/${instancia}/tasks?pageSize=60`);
        aberta = (t?.items ?? []).find((/** @type {any} */ x) => x.status === 'NOT_COMPLETED');
        if (aberta?.state?.stateName === 'Realizar Medição do Contrato') break;
        await new Promise((r) => setTimeout(r, 5_000));
      }

      return {
        numMedicao: campos.numMedicao ?? '',
        competencia: campos.medContrCompetencia ?? '',
        contrato: campos.zoomNumContrato ?? '',
        situacaoContrato: campos.descSituacaoContrato ?? '',
        emailFornecedor: campos.emailFornecedor ?? '',
        emailFornecedorPlanilha: campos.emailFornecedorPlanilha ?? '',
        atividade: aberta?.state?.stateName ?? '',
        responsavel: aberta?.assignee?.login ?? '',
      };
    }, numeroSolicitacao);

    testInfo.annotations.push({
      type: 'medicao-gravada',
      description: JSON.stringify(gravado),
    });

    // FSWTBC-4792 — sem número de medição a solicitação não é rastreável no ERP.
    expect(gravado.numMedicao, 'a medição criada deveria ter número').not.toBe('');

    // FSWTBC-4122 — a competência gravada é a que foi escolhida no zoom. A comparação é por
    // dígitos porque a tela guarda as duas formas: `zoomCompetencia` usa "09-2026" e
    // `medContrCompetencia` usa "09/2026" — medido. Comparar texto cru reprovaria por causa do
    // separador, que não é o que o chamado discute.
    const soDigitos = (/** @type {string} */ v) => (v || '').replace(/\D/g, '');
    expect(
      soDigitos(gravado.competencia),
      `a competência gravada ("${gravado.competencia}") deveria ser a escolhida no zoom ` +
        `("${resultado.competencia}")`,
    ).toBe(soDigitos(String(resultado.competencia)));

    // FSWTBC-695 — a medição nasce sobre o contrato escolhido, e ele está Vigente.
    // `resultado.contrato` é o RÓTULO do zoom, multilinha ("Nº CONTRATO\n00005-2025-3301\n
    // FILIAL\n3301"), enquanto o formulário grava só o número. Comparar os dois crus reprova
    // por formato, não por conteúdo — medido.
    expect(
      resultado.contrato,
      `a medição foi gravada sobre o contrato ${gravado.contrato}, que não é o escolhido ` +
        `(${JSON.stringify(resultado.contrato)})`,
    ).toContain(gravado.contrato);
    expect(
      gravado.situacaoContrato,
      'medição só pode ser aberta sobre contrato Vigente',
    ).toBe('Vigente');

    // FSWTBC-4266 — o e-mail do fornecedor é o canal de cobrança da medição. Os dois campos
    // (do contrato e da planilha) precisam existir e concordar; divergência aí manda a
    // notificação para o endereço errado.
    expect(gravado.emailFornecedor, 'e-mail do fornecedor não gravado').not.toBe('');
    expect(
      gravado.emailFornecedorPlanilha,
      'e-mail do fornecedor da planilha não gravado',
    ).toBe(gravado.emailFornecedor);

    // FSWTBC-629 e 2886 — a atividade seguinte é nominal, não um estado qualquer. Medido em
    // 08/09/2026: a medição válida cai em "Realizar Medição do Contrato" (sequência 28).
    expect(
      gravado.atividade,
      `a medição parou em "${gravado.atividade}" — o roteamento correto leva a "Realizar ` +
        `Medição do Contrato"`,
    ).toBe('Realizar Medição do Contrato');

    // E tem dono humano: tarefa da fila que fica com a conta de integração é a assinatura da
    // tarefa órfã que trava a fila do Faturamento (ver fila-faturamento-protheus.spec.js).
    expect(
      gravado.responsavel,
      `a medição chegou a "${gravado.atividade}" sem responsável — tarefa órfã é a assinatura ` +
        `do travamento da fila (ver fila-faturamento-protheus.spec.js)`,
    ).not.toBe('');
    expect(
      gravado.responsavel,
      'a medição ficou atribuída à conta de integração, não a um responsável humano',
    ).not.toBe('consumerkeycompras');
  });
});
