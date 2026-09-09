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

  try {
    // DUAS tentativas, e o motivo é medido: em 09/09/2026 o setup abortou execuções inteiras
    // porque o login não carregou (título vazio por 60s) numa das quedas de rede que este
    // ambiente tem em ondas — minutos depois, o mesmo host respondia em ~80ms. Uma execução
    // completa custa dezenas de minutos; perdê-la inteira por uma intermitência de segundos é
    // desperdício, e o erro que ela produz ("nenhum teste rodou") não diz nada sobre o produto.
    //
    // Isto NÃO afrouxa o setup: se as duas tentativas falharem, o erro sobe igual e a suíte não
    // roda — que é o comportamento que este arquivo sempre teve, e por bom motivo.
    const tentativas = 2;
    for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
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
        return;
      } catch (erro) {
        await context.close();
        if (tentativa === tentativas) throw erro;
        console.warn(
          `[setup] autenticação falhou na tentativa ${tentativa}/${tentativas}; repetindo. ` +
            `Motivo: ${erro instanceof Error ? erro.message.split('\n')[0] : String(erro)}`,
        );
      }
    }
  } finally {
    await browser.close();
  }
}
