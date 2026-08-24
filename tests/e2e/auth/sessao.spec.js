// @ts-check
import { randomUUID } from 'node:crypto';
import { test, expect } from '../../../fixtures/fixtures.js';
import {
  envObrigatoria,
  ROTA_PORTAL_CONTRATOS,
  TITULO_HOME,
  TITULO_LOGIN,
} from '../../../config/ambiente.js';
import { LoginPage } from '../../../pages/LoginPage.js';

/**
 * Idioma da tela de login e validade de sessão — casos CT-AUT-04-H, CT-AUT-05-S1 e
 * CT-AUT-06-S1.
 *
 * Projeto `autenticacao`: roda SEM storageState.
 */

test.describe('Idioma da tela de login', () => {
  /**
   * O seletor de idioma são três `<img>` (`pt_BR`/`es`/`en_US`) sem `alt` nem
   * `aria-label` — não têm nome acessível, então `getByRole('img', { name })` não os
   * resolve. O gancho estável observado em campo é o atributo `data-language`.
   *
   * Clicar troca um cookie de locale no servidor e recarrega a tela por completo — por
   * isso cada assertion é feita depois do reload, nunca sobre um locator obtido antes dele.
   *
   * Cada ícone tem, ao lado, uma `<div class="language-opacity language-spacer">` de
   * apoio visual (o efeito de "esmaecer o idioma não selecionado" ao passar o mouse). No
   * viewport padrão de teste ela ocupa a MESMA área do ícone e intercepta o clique real do
   * mouse — confirmado em campo: `getByRole`/clique comum trava em "intercepts pointer
   * events". O elemento com o listener é o `<img data-language>` (confirmado em campo: o
   * clique programático nele troca o idioma), então o clique é forçado para ignorar essa
   * camada puramente decorativa — não é flakiness, é uma sobreposição real e determinística
   * de CSS. Recomendação ao time de desenvolvimento: `pointer-events: none` nesse spacer.
   *
   * @param {import('@playwright/test').Page} page
   * @param {'pt_BR' | 'es' | 'en_US'} idioma
   * @returns {import('@playwright/test').Locator}
   */
  function seletorIdioma(page, idioma) {
    return page.locator(`img[data-language="${idioma}"]`);
  }

  /**
   * Clica no seletor de idioma como um usuário faria: com o mouse, na coordenada do ícone.
   *
   * Por que não `click()` comum: uma `div.language-spacer` decorativa fica por cima do
   * ícone e o Playwright recusa o clique por interceptação de ponteiro.
   * Por que não `click({ force: true })`: `force` pula a checagem de acionabilidade e prova
   * só que o handler existe — não que a pessoa consegue acionar o controle.
   * O clique por coordenada atinge o que estiver no topo, exatamente como o mouse do
   * usuário, e o evento chega ao handler por propagação. Verificado em campo em 1280x720,
   * 1440x900 e 1920x1080: o idioma troca. Ou seja, o recurso funciona para o usuário — a
   * sobreposição é ruído de CSS, não defeito funcional.
   * Recomendação ao time de desenvolvimento: `pointer-events: none` no spacer.
   *
   * @param {import('@playwright/test').Page} page
   * @param {'pt_BR' | 'es' | 'en_US'} idioma
   */
  async function clicarNoIdioma(page, idioma) {
    const icone = seletorIdioma(page, idioma);
    await icone.waitFor({ state: 'visible' });

    const caixa = await icone.boundingBox();
    if (!caixa) throw new Error(`Seletor de idioma "${idioma}" não tem caixa de layout`);

    await page.mouse.click(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
  }

  test('CT-AUT-04-H deve trocar os rótulos da tela de login ao selecionar outro idioma no seletor', async ({
    page,
  }) => {
    await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

    // Estado inicial: locale pt-BR fixado no playwright.config.js (confirmado no mapa do ambiente).
    await expect(page.getByRole('textbox', { name: 'Digite seu login' })).toBeVisible();

    await clicarNoIdioma(page, 'en_US');
    await expect(page.getByRole('textbox', { name: 'Enter your login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Access' })).toBeVisible();

    await clicarNoIdioma(page, 'es');
    await expect(
      page.getByRole('textbox', { name: 'Ingrese su nombre de usuario' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible();

    await clicarNoIdioma(page, 'pt_BR');
    await expect(page.getByRole('textbox', { name: 'Digite seu login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Acessar' })).toBeVisible();
  });
});

test.describe('Sessão', () => {
  test('CT-AUT-05-S1 deve redirecionar para o login e não expor conteúdo protegido quando a sessão é inválida', async ({
    browser,
  }) => {
    const baseURL = envObrigatoria('BASE_URL');

    // Contexto próprio (não o `page` da fixture): precisa de controle explícito do cookie
    // de sessão para simular uma sessão adulterada, não apenas ausente.
    const contexto = await browser.newContext({ baseURL, locale: 'pt-BR' });

    try {
      await contexto.addCookies([
        {
          name: 'JSESSIONID',
          value: `sessao-adulterada-qa-${randomUUID().slice(0, 8)}`,
          domain: new URL(baseURL).hostname,
          path: '/',
        },
      ]);

      const pagina = await contexto.newPage();
      await pagina.goto(ROTA_PORTAL_CONTRATOS, { waitUntil: 'domcontentloaded' });

      await expect(pagina).toHaveTitle(TITULO_LOGIN);
      await expect(pagina.getByRole('textbox', { name: 'Digite seu login' })).toBeVisible();
      // "Nenhuma operação é executada": o heading do portal protegido nunca chega a existir no DOM.
      await expect(
        pagina.getByRole('heading', { name: 'Acompanhamento de Contratos' }),
      ).toHaveCount(0);
    } finally {
      await contexto.close();
    }
  });

  test('CT-AUT-06-S1 deve invalidar a sessão no logout e exigir novo login ao voltar para uma página protegida', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.expectLoaded();
    await loginPage.autenticar(envObrigatoria('QA_USERNAME'), envObrigatoria('QA_PASSWORD'));

    await expect(page).toHaveTitle(TITULO_HOME);

    // Menu do usuário: avatar sem `aria-label` próprio, mas com nome acessível derivado do
    // `alt` da imagem ("Usuário <nome>"). Âncora por prefixo — não depende do nome exibido.
    const avatarUsuario = page.getByRole('img', { name: /^Usuário/ });
    const botaoSair = page.getByRole('button', { name: 'Sair' });

    // A home recebe, de forma assíncrona, várias chamadas de inicialização do cabeçalho
    // (notificações, isadmin, perfil editável) logo após o título mudar para Home —
    // confirmado em campo com trace de falha. Nessa janela o clique no avatar
    // ocasionalmente não abre o menu (o listener ainda não estava religado). `toPass`
    // repete a AÇÃO real (clicar) até a condição observável (menu aberto) se confirmar —
    // não é espera por tempo fixo, é reagir ao estado real do sistema.
    await expect(async () => {
      await avatarUsuario.click();
      await expect(botaoSair).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });

    await botaoSair.click();

    await expect(page).toHaveTitle(TITULO_LOGIN);

    // O essencial do caso: voltar para uma rota protegida depois do logout não reexibe o
    // conteúdo protegido — exige um novo login.
    await page.goto(ROTA_PORTAL_CONTRATOS, { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(TITULO_LOGIN);
    await expect(page.getByRole('textbox', { name: 'Digite seu login' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Acompanhamento de Contratos' }),
    ).toHaveCount(0);
  });
});
