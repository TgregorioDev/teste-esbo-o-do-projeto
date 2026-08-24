// @ts-check
import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { envObrigatoria, TITULO_HOME } from '../config/ambiente.js';
import { LoginPage } from '../pages/LoginPage.js';

export const ARQUIVO_AUTENTICACAO = 'playwright/.auth/usuario.json';

/** Locale da sessão. Precisa ser o mesmo dos testes: a tela de login é traduzida. */
export const LOCALE = 'pt-BR';

/**
 * Autentica uma vez e persiste o storageState para os projetos que não testam login.
 *
 * Reaproveita o `LoginPage` em vez de duplicar seletores — se a tela de login mudar,
 * há um único lugar para corrigir.
 *
 * Falha explicitamente quando a configuração está incompleta ou quando a autenticação não
 * conclui: setup silencioso produz uma suíte inteira falhando por motivo errado.
 *
 * O sinal de sucesso é o TÍTULO, não a URL — o Fluig serve o login na mesma URL da home.
 */
export default async function globalSetup() {
  const baseURL = envObrigatoria('BASE_URL');
  const usuario = envObrigatoria('QA_USERNAME');
  const senha = envObrigatoria('QA_PASSWORD');

  await mkdir(path.dirname(ARQUIVO_AUTENTICACAO), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL, locale: LOCALE });
  const page = await context.newPage();

  try {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.expectLoaded();
    await loginPage.autenticar(usuario, senha);

    // Condição real do sistema — nunca espera por tempo
    await expect(page).toHaveTitle(TITULO_HOME, { timeout: 60_000 });

    await context.storageState({ path: ARQUIVO_AUTENTICACAO });
  } finally {
    await browser.close();
  }
}
