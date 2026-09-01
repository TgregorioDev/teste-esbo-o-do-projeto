// @ts-check
import { randomUUID } from 'node:crypto';
import { test, expect } from '../../../fixtures/fixtures.js';
import { AcessoFornecedorPage, gerarCnpjFicticio } from '../../../pages/AcessoFornecedorPage.js';
import { generateCpf } from '../../../factories/pessoa.js';
import { bloquearCriacaoDeProcesso } from '../../../utils/guarda-criacao.js';

/**
 * Portal do Fornecedor — autenticação e redefinição de senha (CT-PFN-01-S1, CT-PFN-02-S1,
 * CT-PFN-02-S2).
 *
 * `tests/e2e/portais/portal-fornecedor.spec.js` já cobre a landing (leitura, controle de
 * acesso) e não é duplicado aqui.
 *
 * Guarda usada é `bloquearCriacaoDeProcesso` (não `bloquearCriacaoDeSolicitacao`/
 * `bloquearEscritaNoAmbiente`): a própria AÇÃO sob teste é uma chamada de escrita — login
 * com credencial fabricada, PUT de redefinição com token fabricado. Bloquear toda escrita
 * impediria a chamada de sair e o teste provaria a guarda, não o produto (mesma lição já
 * documentada em `utils/guarda-criacao.js`). `bloquearCriacaoDeProcesso` deixa essas
 * chamadas passarem e só bloqueia `/process-management/` e `workflowView` — o que confirma
 * que a tentativa de autenticação de fornecedor não tem efeito colateral de abrir/mover
 * processo BPM.
 *
 * Nenhum teste aqui usa credencial real de fornecedor: CNPJ/CPF são fabricados
 * (`gerarCnpjFicticio`/`generateCpf`, dígitos verificadores válidos, nunca dirigidos a
 * coincidir com empresa/pessoa real) e a senha é aleatória — o objetivo nos três casos é
 * provar a REJEIÇÃO, nunca alcançar uma sessão de fornecedor.
 *
 * CT-PFN-01-H, 02-H, 03-H, 04-H, 05-H (caminho feliz) e CT-PFN-03-S1 (cadastro fora do
 * prazo) NÃO estão nesta suíte — ver relatório da rodada de implementação para o motivo de
 * cada um (limitação técnica: sem credencial de fornecedor de teste / sem mecanismo de
 * prazo localizado na tela de cadastro alcançável).
 */
test.describe('Acesso Normal — credencial de fornecedor inválida', () => {
  test('CT-PFN-01-S1 deve recusar credencial inválida com mensagem genérica, sem vazar detalhe técnico', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeProcesso(page);
    const acessoFornecedor = new AcessoFornecedorPage(page);

    const credencialInexistente = {
      cnpj: gerarCnpjFicticio(),
      cpf: generateCpf(),
      senha: `QA-${randomUUID().slice(0, 12)}`,
    };

    const resposta = await acessoFornecedor.tentarAcessoNormal(credencialInexistente);

    // Rejeição controlada — 401, não um 5xx de crash.
    expect(resposta.status()).toBe(401);

    // A tela mostra aviso genérico ao usuário — mensagem de negócio, não técnica.
    await expect(acessoFornecedor.dialogCredencialInvalida).toBeVisible();
    await expect(acessoFornecedor.mensagemCredencialInvalida).toBeVisible();

    // Sem vazamento técnico: nem no corpo da resposta HTTP, nem na tela, aparece stack
    // trace, classe de exceção Java ou erro de SQL — só a mensagem de negócio (confirmado
    // em campo: o corpo é sempre o texto simples "Fornecedor não localizado!").
    const corpoResposta = await resposta.text();
    expect(corpoResposta).not.toMatch(/exception|stacktrace|java\.lang|sqlexception|at\s+\w+(\.\w+)+\(/i);
    const textoTela = await page.locator('body').innerText();
    expect(textoTela).not.toMatch(/exception|stacktrace|java\.lang|sqlexception/i);

    await acessoFornecedor.botaoOkCredencialInvalida.click();
    await expect(acessoFornecedor.dialogCredencialInvalida).toHaveCount(0);

    // Nenhum processo BPM foi criado/movimentado como efeito colateral da tentativa.
    expect(
      guarda.tentativas(),
      `tentativa(s) de escrita de processo bloqueada(s): ${JSON.stringify(guarda.urls())}`,
    ).toBe(0);
  });
});

test.describe('Redefinição de senha do fornecedor — link de reset', () => {
  test('CT-PFN-02-S1 não deve efetivar a redefinição com um token que não corresponde a nenhum pedido pendente (equivalente a link reutilizado)', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeProcesso(page);
    const acessoFornecedor = new AcessoFornecedorPage(page);
    const cpfCnpj = gerarCnpjFicticio();

    // Não há como emitir e depois consumir um token REAL sem fornecedor de teste (a mesma
    // limitação documentada para os casos H, ver docs/mapa-do-ambiente.md). O que É possível
    // provar sem consumir nada real: um token BEM FORMADO (a cara de um token de verdade,
    // base64) que não corresponde a nenhum pedido pendente é recusado — a mesma garantia de
    // servidor que rejeitaria um token genuíno já usado uma vez, porque do ponto de vista do
    // backend as duas situações são indistinguíveis: "não é o token válido corrente".
    const tokenBemFormadoMasFabricado = Buffer.from(`qa-reset-${randomUUID()}`).toString('base64');

    await acessoFornecedor.abrirRedefinicaoComToken(tokenBemFormadoMasFabricado, cpfCnpj);
    const resposta = await acessoFornecedor.submeterRedefinicaoDeSenha({
      cpfCnpj,
      novaSenha: `QA-${randomUUID().slice(0, 8)}Aa1!`,
    });

    // Rejeitado — nunca 2xx.
    expect(resposta.ok()).toBe(false);
    await expect(acessoFornecedor.alertaSenhaNaoAtualizada).toBeVisible();

    expect(
      guarda.tentativas(),
      `tentativa(s) de escrita de processo bloqueada(s): ${JSON.stringify(guarda.urls())}`,
    ).toBe(0);
  });

  test('CT-PFN-02-S2 @bug deve recusar um token de redefinição expirado/adulterado sem efetivar a troca', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeProcesso(page);
    const acessoFornecedor = new AcessoFornecedorPage(page);
    const cpfCnpj = gerarCnpjFicticio();
    const tokenAdulterado = `qa-token-adulterado-${randomUUID().slice(0, 8)}`;

    await acessoFornecedor.abrirRedefinicaoComToken(tokenAdulterado, cpfCnpj);
    const resposta = await acessoFornecedor.submeterRedefinicaoDeSenha({
      cpfCnpj,
      novaSenha: `QA-${randomUUID().slice(0, 8)}Aa1!`,
    });

    expect(resposta.ok()).toBe(false);
    await expect(acessoFornecedor.alertaSenhaNaoAtualizada).toBeVisible();

    // Defeito real encontrado nesta investigação (não existia caso escrito antes): o
    // endpoint de redefinição responde 500 com o corpo
    // `{"message": "...", "exception": "java.lang...."}` — vazamento técnico na CAMADA DE
    // REDE (visível em qualquer DevTools) mesmo a TELA absorvendo isso e mostrando só o
    // aviso genérico "Senha não foi atualizada!". Escrito contra o comportamento CORRETO
    // (erro controlado, sem detalhe de implementação) — REPROVA hoje de propósito; não
    // "consertar" este teste para ele passar, ver CLAUDE.md.
    expect(
      resposta.status(),
      'endpoint deveria devolver um erro controlado (4xx), não crashar com 500',
    ).toBeLessThan(500);
    const corpoResposta = await resposta.text();
    expect(
      corpoResposta,
      'a resposta do endpoint não deveria expor classe de exceção/stack trace',
    ).not.toMatch(/exception|java\.lang|stacktrace/i);

    expect(
      guarda.tentativas(),
      `tentativa(s) de escrita de processo bloqueada(s): ${JSON.stringify(guarda.urls())}`,
    ).toBe(0);
  });
});
