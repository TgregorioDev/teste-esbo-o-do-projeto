// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../../utils/pre-condicao.js';
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

      try {
        resultado = await medicao.montarMedicaoComSaldoEmAberto(fornecedor);
      } catch (erro) {
        // Contrato descartado antes de chegar a tentar competências (ex.: fornecedor sem
        // contrato navegável pelo zoom). O MOTIVO é guardado e entra na mensagem final:
        // engolir o erro aqui era o que produzia `Tentativas: []` — uma pré-condição ausente
        // que não dizia por que cada contrato foi descartado.
        descartes.push(`${contrato.contrato}: ${erro instanceof Error ? erro.message : String(erro)}`);
        continue;
      }
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
  });
});
