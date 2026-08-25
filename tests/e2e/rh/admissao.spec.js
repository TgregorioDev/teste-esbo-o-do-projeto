// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { AdmissaoPage } from '../../../pages/AdmissaoPage.js';
import { criarAdmitido } from '../../../factories/pessoa.js';

/**
 * Automação Admissão (`wf_automacao_admissao`) — casos CT-ADM.
 *
 * O documento de casos supunha o processo bloqueado por perfil. Medido em campo (ver
 * `tests/e2e/rh/bloqueio-processos-rh.spec.js`): o processo ABRE normalmente — heading
 * *Início*, botão *Enviar* presentes.
 *
 * O que se descobriu ao inspecionar o formulário interno é mais grave do que segregação
 * de acesso: o processo de Admissão serve, campo por campo, o MESMO template do processo
 * `rh_gbeneficios_planosaude` ("Gestão de Benefícios - Plano de Saúde") — mesmo heading,
 * mesmos nomes de campo (`actionPlanoSaude`, `termoConsentimento`), e o mesmo alerta de
 * bloqueio ("Benefício 'Plano de Saúde' não esta liberado para o seu usuário"). Confirmado
 * de forma determinística (via `waitFor` sobre heading real, não por tempo arbitrário) em
 * execuções isoladas independentes.
 *
 * Este é um DEFEITO de associação processo↔formulário — o teste abaixo está escrito
 * contra o comportamento ESPERADO (o processo de Admissão deveria abrir um formulário de
 * admissão, não o de Plano de Saúde) e REPROVA de propósito, no mesmo espírito dos demais
 * testes vermelhos documentados no README. Ajustá-lo para passar documentaria o defeito
 * como se fosse comportamento correto.
 *
 * Consequência prática: nenhum campo de admissão (nome do admitido, CPF, cargo, data de
 * admissão) jamais aparece, então CT-ADM-01-S1 (dados obrigatórios ausentes) e 01-S2
 * (reprocessamento após falha) também não são alcançáveis por esta rota — documentado na
 * anotação abaixo, não fabricado como teste fantasma.
 *
 * `criarAdmitido()` (`factories/pessoa.js`) fica pronta para uso assim que o processo
 * servir o formulário correto.
 */
test.describe('Automação Admissão', () => {
  test('CT-ADM-01-H — deveria abrir um formulário de admissão de novo funcionário', async ({
    page,
  }, testInfo) => {
    const admitido = criarAdmitido();
    testInfo.annotations.push(
      {
        type: 'massa-pronta-para-uso-futuro',
        description: `criarAdmitido() geraria ${JSON.stringify(admitido)} — não preenchido em tela porque o processo não serve nenhum formulário de admissão.`,
      },
      {
        type: 'pre-condicao-ausente',
        description:
          'CT-ADM-01-S1 (dados obrigatórios ausentes) e 01-S2 (reprocessamento após falha) exigem um ' +
          'formulário de admissão com campos próprios (nome, CPF, cargo, data de admissão), que este ' +
          'processo não serve — ele abre o template de rh_gbeneficios_planosaude. É consequência ' +
          'direta do defeito que este teste reprova.',
      },
    );

    const admissaoPage = new AdmissaoPage(page);
    await admissaoPage.goto();

    // Pré-condição do caso: o processo abre (não é bloqueio de perfil).
    await admissaoPage.expectFormularioAberto();

    // Aguarda o formulário INTERNO terminar de montar (condição real) antes de qualquer
    // assertion negativa — sem isso, `.not.toBeVisible()` poderia passar cedo demais,
    // antes do heading a reprovar sequer existir, mascarando o defeito com falso verde.
    await admissaoPage.aguardarFormularioInternoCarregado();

    // DEFEITO: o formulário interno é o de Plano de Saúde, não o de Admissão. Esta
    // assertion está escrita contra o comportamento ESPERADO (heading de Plano de Saúde
    // NÃO deveria aparecer num processo de Admissão) e reprova de propósito, documentando
    // a associação processo↔formulário incorreta.
    await expect(
      admissaoPage.headingPlanoSaudeInesperado,
      'defeito: o processo de Admissão (wf_automacao_admissao) abre o formulário de Plano de Saúde ' +
        '(mesmo template de rh_gbeneficios_planosaude) em vez de um formulário de admissão — ' +
        'associação processo↔formulário incorreta',
    ).not.toBeVisible();
  });
});
