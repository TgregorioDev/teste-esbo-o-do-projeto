// @ts-check
import { randomUUID } from 'node:crypto';
import { test, expect } from '../../../fixtures/fixtures.js';
import { AcessoFornecedorPage, gerarCnpjFicticio } from '../../../pages/AcessoFornecedorPage.js';
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
 * (`gerarCnpjFicticio`, dígitos verificadores válidos, nunca dirigidos a
 * coincidir com empresa/pessoa real) e a senha é aleatória — o objetivo nos três casos é
 * provar a REJEIÇÃO, nunca alcançar uma sessão de fornecedor.
 *
 * CT-PFN-01-H, 02-H, 03-H, 04-H, 05-H (caminho feliz) e CT-PFN-03-S1 (cadastro fora do
 * prazo) NÃO estão nesta suíte — ver relatório da rodada de implementação para o motivo de
 * cada um (limitação técnica: sem credencial de fornecedor de teste / sem mecanismo de
 * prazo localizado na tela de cadastro alcançável).
 */
test.describe('Acesso Normal — credencial de fornecedor inválida', () => {
  /**
   * ## Medido em 09/09/2026 no ambiente `caixade213859` — o teste passou a reprovar, e com razão
   *
   * O login do fornecedor (`POST /java_gestao_contrato/rest-acesso/request/loginV2`) responde,
   * para documento inexistente:
   *
   * - **HTTP 500**, não 401. Credencial inválida é caso de negócio previsto, e um 5xx diz ao
   *   cliente (e a qualquer monitoração) que o servidor quebrou.
   * - corpo com **exceção Java e URL interna**: `java.io.IOException: Server returned HTTP
   *   response code: 401 for URL: …/api/public/ecm/dataset/datasets`.
   * - e a **tela exibe esse JSON cru** num diálogo, ao lado do aviso amigável "Ops! Usuário ou
   *   senha inválido!". Ou seja, o detalhe técnico não só existe: ele é mostrado a quem tentou
   *   entrar, numa tela de acesso público.
   *
   * As assertions abaixo NÃO foram afrouxadas para o novo comportamento — elas descrevem o que
   * uma recusa de credencial deve ser, e é o produto que precisa mudar. Daí a tag `@bug`.
   */
  test('@bug CT-PFN-01-S1 deve recusar credencial inválida com mensagem genérica, sem vazar detalhe técnico', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeProcesso(page);
    const acessoFornecedor = new AcessoFornecedorPage(page);

    // A tela de entrada passou a ter um campo ÚNICO de documento (CPF/CNPJ), em vez do par
    // "CNPJ da empresa" + "CPF do usuário" — ver `PortalFornecedorPage`. O CNPJ fictício segue
    // sendo o documento fabricado, com DV válido e nunca dirigido a coincidir com empresa real.
    const credencialInexistente = {
      documento: gerarCnpjFicticio(),
      senha: `QA-${randomUUID().slice(0, 12)}`,
    };

    const resposta = await acessoFornecedor.tentarAcesso(credencialInexistente);

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
  /**
   * CT-PFN-02-S1 + CT-PFN-02-S2, reescritos em 09/09/2026 para o ambiente `caixade213859`.
   *
   * ## O que os dois testes faziam, e por que não fazem mais
   *
   * Eles abriam `/portal/p/1/portal_fornecedores_senha` com um token fabricado, submetiam a
   * troca de senha e afirmavam sobre a recusa (S1) e sobre o vazamento técnico no corpo do erro
   * (S2). Nada disso é alcançável aqui: **a tela de redefinição não monta**. Medido — ela
   * renderiza uma página vazia: nenhum heading, nenhum campo, nenhum botão.
   *
   * ## A causa, medida
   *
   * A página de redefinição ainda chama o serviço de token ANTIGO,
   * `POST /cassi_rest/api/rest/cassi/compras/1/geratoken`, que neste tenant responde
   * **500 `Could not find application key` (`com.fluig.sdk.exception.Application…`)** — a
   * aplicação `cassi_rest` não está publicada aqui. A landing do portal, essa sim, foi migrada
   * para `POST /java_gestao_contrato/rest-acesso/request/geratoken`, que responde
   * `200 {"Status":true,"Message":"OK"}`.
   *
   * É uma migração pela metade: a porta da frente mudou de serviço, a de recuperação de senha
   * não. O efeito para o fornecedor é concreto — quem recebe o link de "Primeiro acesso /
   * Redefinir Senha" por e-mail cai numa página em branco, sem erro e sem caminho.
   *
   * ## O que este teste afirma
   *
   * O mínimo que a tela precisa entregar para o caso existir: **montar**. Enquanto ela não
   * montar, S1 e S2 não são exercitáveis por definição — não há formulário para submeter nem
   * resposta de erro para inspecionar —, e é isso que o `@bug` registra. Quando a página voltar
   * a montar, este teste fica verde e os dois cenários de recusa voltam a ser escrevíveis.
   *
   * O token vai fabricado de propósito: nenhum pedido real de redefinição é consumido.
   */
  test('@bug CT-PFN-02-S1 CT-PFN-02-S2 — a tela de redefinição de senha precisa montar para quem chega pelo link', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeProcesso(page);
    const acessoFornecedor = new AcessoFornecedorPage(page);
    const cpfCnpj = gerarCnpjFicticio();
    const tokenBemFormadoMasFabricado = Buffer.from(`qa-reset-${randomUUID()}`).toString('base64');

    await acessoFornecedor.irParaRedefinicaoComToken(tokenBemFormadoMasFabricado, cpfCnpj);

    const conteudo = await page.locator('body').innerText();
    const respostaDoTokenAntigo = await page.evaluate(async () => {
      const r = await fetch('/cassi_rest/api/rest/cassi/compras/1/geratoken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      return { status: r.status, corpo: (await r.text()).slice(0, 160) };
    });

    test.info().annotations.push({
      type: 'redefinicao-senha-fornecedor',
      description:
        `conteúdo da página: ${JSON.stringify(conteudo.replace(/\s+/g, ' ').slice(0, 120))} · ` +
        `serviço de token antigo: ${respostaDoTokenAntigo.status} ${respostaDoTokenAntigo.corpo}`,
    });

    expect(
      conteudo.replace(/\s+/g, ' ').trim(),
      'a tela de redefinição de senha do fornecedor renderiza VAZIA — quem chega pelo link ' +
        'recebido por e-mail não encontra formulário, erro nem caminho. A página ainda chama o ' +
        'serviço de token antigo (`cassi_rest`), que não está publicado neste ambiente, ' +
        'enquanto a landing do portal já usa o serviço novo (`java_gestao_contrato`)',
    ).not.toBe('');

    expect(
      guarda.tentativas(),
      `tentativa(s) de escrita de processo bloqueada(s): ${JSON.stringify(guarda.urls())}`,
    ).toBe(0);
  });
});
