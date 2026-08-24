// @ts-check
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { ARQUIVO_AUTENTICACAO } from './fixtures/global-setup.js';

dotenv.config({ path: process.env.ENV_FILE ?? '.env.test', quiet: true });

const baseURL = process.env.BASE_URL;

export default defineConfig({
  testDir: './tests',

  fullyParallel: true,

  // Impede que test.only chegue ao CI e mascare a suíte completa
  forbidOnly: !!process.env.CI,

  // Retry é rede de segurança para instabilidade de INFRA em CI.
  // Nunca é solução para flakiness — teste que passa no retry vai para investigação.
  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? '50%' : undefined,

  // O portal carrega 800+ contratos e o modal encadeia sete datasets no Protheus:
  // o ambiente é legitimamente lento, e o timeout reflete isso — não mascara flakiness.
  timeout: 120_000,
  expect: { timeout: 30_000 },

  // Cenários que criam registro real no ambiente do cliente ficam fora da execução
  // padrão. Não é skip: é composição de suíte, e são habilitados com
  //   npx playwright test --grep @destrutivo
  grepInvert: process.env.INCLUIR_DESTRUTIVOS ? undefined : /@destrutivo/,

  reporter: process.env.CI
    ? [
        ['github'],
        ['html', { open: 'never' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,

    // Observabilidade: precisa responder onde falhou, qual ação,
    // qual estado da página, qual requisição e qual assertion
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    actionTimeout: 30_000,
    navigationTimeout: 60_000,

    ignoreHTTPSErrors: false,
    locale: 'pt-BR',
  },

  globalSetup: './fixtures/global-setup.js',

  projects: [
    {
      // Fluxo de autenticação: SEM storageState — valida o login de verdade
      name: 'autenticacao',
      testMatch: /tests\/e2e\/auth\/.*\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e',
      testIgnore: /tests\/e2e\/auth\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: ARQUIVO_AUTENTICACAO,
      },
    },
  ],
});
