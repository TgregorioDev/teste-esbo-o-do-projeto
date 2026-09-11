// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { faltaPreCondicao } from '../../../utils/pre-condicao.js';
import { DependentesPage } from '../../../pages/DependentesPage.js';
import { criarDependente } from '../../../factories/pessoa.js';

/**
 * Gestão de Dependentes (`GestaoDependentes`) — casos CT-DEP.
 *
 * O documento de casos supunha o processo bloqueado por perfil. Medido em campo (ver
 * `tests/e2e/rh/bloqueio-processos-rh.spec.js`): o processo ABRE normalmente para a conta
 * de automação — heading *Início*, abas e botão *Enviar* presentes. O bloqueio real é mais
 * fundo: o formulário interno resolve a matrícula do TITULAR (a própria conta autenticada)
 * pelo e-mail da sessão e, como esta conta de integração não corresponde a um funcionário
 * ativo no Protheus, a consulta falha e nenhum campo de cadastro chega a ser montado —
 * confirmado por contagem de elementos do DOM (0 `input`/`select`/`textarea`), não apenas
 * por texto.
 *
 * Isso faz de CT-DEP-02-S1 ("titular sem matrícula") o único caso, dos cinco atribuídos,
 * reproduzível por esta conta — é o comportamento padrão e determinístico da tela. Os
 * demais (01-H cadastrar dependente, 01-S1 duplicado, 01-S2 parentesco incompatível,
 * 01-S3 CPF inválido) exigem um titular COM matrícula para chegar ao formulário de campos
 * (nome, CPF, nascimento, sexo, parentesco, tipos de dependência, plano) — pré-condição
 * que a automação não pode criar (cadastro de vínculo empregatício no Protheus está fora
 * do escopo desta suíte, no mesmo sentido em que a criação de contrato está para Compras).
 * Não são fabricados como testes fantasmas aqui: ficam documentados na anotação abaixo e
 * no relatório final da tarefa.
 *
 * `criarDependente()` (`factories/pessoa.js`) fica pronta para uso assim que essa
 * pré-condição for resolvida — inclusive o CPF fictício com dígitos verificadores válidos,
 * replicado do helper `generateCpf()` de referência da skill.
 */
test.describe('Gestão de Dependentes', () => {
  test('CT-DEP-02-S1 — bloqueia a gestão de dependentes quando o titular não tem matrícula localizada', async ({
    page,
  }, testInfo) => {
    // Massa fictícia gerada mesmo sem uso em tela: prova que a factory está pronta e
    // documenta, no relatório, o dado que SERIA usado assim que a pré-condição existir.
    const dependente = criarDependente();
    testInfo.annotations.push(
      {
        type: 'massa-pronta-para-uso-futuro',
        description: `criarDependente() geraria ${JSON.stringify(dependente)} — não preenchido em tela porque o formulário nunca monta campos para esta conta.`,
      },
      {
        // Tipo PRÓPRIO, não `pre-condicao-ausente`: esta anotação documenta OUTROS casos, e o gate
        // (`scripts/veredito-do-gate.mjs`) classifica como ambiente qualquer teste reprovado que a
        // carregue — uma falha real DESTE teste sairia como "pré-condição" (corrigido em 11/09/2026).
        type: 'casos-bloqueados-pela-mesma-causa',
        description:
          'CT-DEP-01-H (cadastrar dependente), 01-S1 (duplicado), 01-S2 (parentesco incompatível) e ' +
          '01-S3 (CPF inválido) exigem que o formulário monte os campos nome/CPF/nascimento/sexo/' +
          'parentesco/tipos de dependência/plano — o que só acontece quando a matrícula do titular é ' +
          'resolvida com sucesso. Não ocorre para esta conta (é exatamente o que este teste prova). ' +
          'Não é cadastro que a automação possa criar: vínculo empregatício nasce no Protheus por ' +
          'processo de RH que esta suíte não executa.',
      },
    );

    const dependentesPage = new DependentesPage(page);
    await dependentesPage.goto();

    // Pré-condição do caso: o processo abre (não é bloqueio de perfil, como
    // wf_aprovacao_ocorrencia/wf_solicitacao_ferias).
    await dependentesPage.expectFormularioAberto();

    // O ponto central do caso CT-DEP-02-S1: o titular sem matrícula bloqueia o formulário.
    //
    // ⚠️ CORRIGIDO em 11/09/2026. Este comentário dizia que no `caixade213859` o cenário não
    // ocorria ("39 campos visíveis e nenhuma mensagem de bloqueio", 09/09/2026), e o teste
    // reprovava como pré-condição ausente. Era leitura instantânea: a mensagem de titular sem
    // matrícula aparece ~7,6 s depois de a casca abrir, e o formulário monta ZERO campos — o
    // bloqueio ocorre, sim. `lerDesfechoDaIdentificacao` agora espera a mensagem.
    const desfecho = await dependentesPage.lerDesfechoDaIdentificacao();

    testInfo.annotations.push({
      type: 'desfecho-da-identificacao',
      description:
        `bloqueado=${desfecho.bloqueado} · ${desfecho.camposVisiveis} campo(s) visível(is) de ` +
        `${desfecho.camposNoDom} no DOM`,
    });

    if (!desfecho.bloqueado) {
      faltaPreCondicao(
        `(ambiente): o formulário de Gestão de Dependentes montou ${desfecho.camposVisiveis} ` +
          'campo(s) sem exibir o bloqueio por titular sem matrícula. O cenário deste caso — ' +
          'titular SEM matrícula localizada — não é reproduzível com esta conta neste ' +
          'ambiente. Se o formulário monta, CT-DEP-01-H/01-S1/01-S2/01-S3 merecem reavaliação.',
      );
    }

    // Com o bloqueio presente, nenhum campo de cadastro chega a ser montado — é essa mesma
    // ausência que impede 01-H/01-S1/01-S2/01-S3 de serem exercitados.
    expect(desfecho.camposVisiveis).toBe(0);
  });
});
