// @ts-check
import { randomUUID } from 'node:crypto';
import { test, expect } from '../../../fixtures/fixtures.js';
import { envObrigatoria } from '../../../config/ambiente.js';
import { RecuperacaoSenhaPage } from '../../../pages/RecuperacaoSenhaPage.js';

/**
 * Recuperação de senha — casos CT-AUT-03-H, CT-AUT-03-S1 e CT-AUT-03-S2.
 *
 * Projeto `autenticacao`: roda SEM storageState, na própria tela de login.
 *
 * Regra inegociável deste ambiente: é o Fluig real do cliente. Estes testes emitem o
 * pedido de token (comportamento que o próprio caso exige validar), mas NUNCA consomem um
 * token real para trocar a senha do usuário de teste — CT-AUT-03-S2 cobre exclusivamente o
 * caminho do token inválido/adulterado, que a plataforma rejeita antes de qualquer troca.
 *
 * ## Por que CT-AUT-03-H não usa `QA_USERNAME`
 *
 * A versão anterior pedia o token para `envObrigatoria('QA_USERNAME')` — o login que
 * sustenta a suíte inteira (`fixtures/global-setup.js` e o `globalTeardown` autenticam com
 * ele). Isso gerava um token de redefinição VIVO e um e-mail para uma caixa real a cada
 * execução: qualquer consumo desse link derrubaria o `storageState`, a limpeza de massa e o
 * projeto `e2e` inteiro. E era efeito colateral no ambiente do cliente sem a tag
 * `@destrutivo`, invisível para `PULAR_DESTRUTIVOS=1`.
 *
 * O oráculo do caso não depende do login existir: a tela é anti-enumeração por desenho — a
 * mensagem é *"Se esse login está associado à uma conta, você receberá um e-mail com
 * instruções"*, e é exatamente essa indistinguibilidade que CT-AUT-02-S2 já prova no login.
 * Usar um login inexistente valida o mesmo comportamento observável sem tocar credencial
 * nenhuma. Se um dia o servidor passar a responder diferente para login inexistente, este
 * teste reprova — e aí o achado é de enumeração de usuários, que é mais grave que o caso.
 */
test.describe('Recuperação de senha', () => {
  test('CT-AUT-03-H deve emitir o token de redefinição e avisar para verificar o e-mail', async ({
    page,
  }) => {
    const recuperacaoPage = new RecuperacaoSenhaPage(page);
    await recuperacaoPage.abrirFluxoRecuperacao();

    // Login inexistente, carimbado e único — nunca a credencial da automação.
    const loginInexistente = `qa.inexistente.${randomUUID().slice(0, 8)}`;
    const resposta = await recuperacaoPage.solicitarToken(loginInexistente);

    expect(
      resposta.status(),
      `o pedido de token para o login inexistente "${loginInexistente}" deveria responder 201 ` +
        'como para qualquer outro: a tela é anti-enumeração e não pode revelar se o login existe',
    ).toBe(201);
    await expect(recuperacaoPage.headingVerifiqueEmail).toBeVisible();
    await expect(recuperacaoPage.mensagemVerificacaoEmail).toBeVisible();
  });

  test('CT-AUT-03-S1 não deve emitir token quando o campo login/e-mail está vazio', async ({
    page,
  }) => {
    const recuperacaoPage = new RecuperacaoSenhaPage(page);
    await recuperacaoPage.abrirFluxoRecuperacao();

    /** @type {string[]} */
    const requisicoesDeToken = [];
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        /\/authentication\/api\/v1\/tokens$/.test(new URL(request.url()).pathname)
      ) {
        requisicoesDeToken.push(request.url());
      }
    });

    await recuperacaoPage.enviarComCampoVazio();

    await expect(recuperacaoPage.mensagemCampoObrigatorio).toBeVisible();
    // A validação é client-side: nenhuma chamada ao backend deve ter saído.
    expect(requisicoesDeToken).toHaveLength(0);
  });

  test('CT-AUT-03-S2 deve recusar um token de redefinição inválido/adulterado sem permitir trocar a senha', async ({
    page,
  }) => {
    const recuperacaoPage = new RecuperacaoSenhaPage(page);
    const tokenAdulterado = `qa-token-adulterado-${randomUUID().slice(0, 8)}`;

    const resposta = await recuperacaoPage.acessarComToken(
      tokenAdulterado,
      envObrigatoria('QA_USERNAME'),
    );

    expect(resposta.status()).toBe(200);
    const corpo = await resposta.json();
    expect(corpo.valid).toBe(false);

    await expect(recuperacaoPage.headingLinkExpirado).toBeVisible();
    await expect(recuperacaoPage.mensagemLinkExpirado).toBeVisible();
    // Garantia de que a troca de senha não é oferecida: o card é um único template estático
    // com todos os formulários pré-renderizados e alternados por classe CSS — o campo de
    // nova senha existe no DOM, mas seu formulário permanece oculto (`fs-display-none`).
    await expect(recuperacaoPage.campoNovaSenha).not.toBeVisible();
  });
});
