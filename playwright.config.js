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

  // ⚠️ O limite de paralelismo é do SERVIDOR, não da máquina que roda a suíte.
  //
  // Medido em 28/08/2026, mesmo commit, mesmo ambiente, bloco `acompanhamento-contratos`:
  //
  //   | workers            | resultado         | timeouts de 120s |
  //   |--------------------|-------------------|------------------|
  //   | default (8 = 16/2) | 16 ok / 17 falhou |        13        |
  //   | 3                  | 22 ok / 11 falhou |         0        |
  //
  // Os 13 timeouts NÃO eram defeito nem instabilidade: rodando serialmente, cada um desses
  // testes leva 11–12s e reprova (ou passa) com veredito nomeado. Sob 8 abas simultâneas
  // contra a MESMA instância de homologação, o mesmo teste estoura 120s — degradação de ~10x.
  // O efeito prático era o pior possível: defeito real de produto chegando ao relatório
  // disfarçado de "Test timeout exceeded", que é exatamente o que ninguém consegue investigar.
  //
  // Isto NÃO é "aumentar timeout para mascarar flakiness" (proibido pela skill
  // `playwright-test-creator`): o timeout continua em 120s. É dimensionar a concorrência ao
  // que o alvo sustenta — o Fluig de homologação é uma instância única e compartilhada, então
  // `50%` da CPU do runner é uma métrica da máquina errada. Por isso o teto vale também no CI,
  // onde um runner maior só pioraria a contenção.
  //
  // Se o ambiente ganhar capacidade, refaça a medição da tabela acima antes de subir o número.
  workers: 3,

  // O portal carrega 800+ contratos e o modal encadeia sete datasets no Protheus:
  // o ambiente é legitimamente lento, e o timeout reflete isso — não mascara flakiness.
  timeout: 120_000,
  expect: { timeout: 30_000 },


  // A execução padrão roda TUDO, inclusive os cenários `@destrutivo` que criam e movimentam
  // registro. Decisão do dono do ambiente (25/08/2026): esta é uma base de homologação, e é
  // exatamente para isso que ela existe — cobertura parcial por precaução esconde defeito.
  //
  // A tag continua servindo para mirar (`--grep @destrutivo`) e para a regressão rápida de
  // quem não quer gerar massa nova a cada execução:
  //   PULAR_DESTRUTIVOS=1 npx playwright test
  grepInvert: process.env.PULAR_DESTRUTIVOS ? /@destrutivo/ : undefined,

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

    // `locator.waitFor()` sem timeout explícito usa o default do Playwright (30s), que NÃO
    // deriva de nada declarado aqui. Era o prazo mais apertado da suíte e ninguém o tinha
    // escolhido — um Page Object esperando um widget lento falhava por um limite acidental.
    // Declarado de propósito, para que o número seja decisão e não default herdado.
    actionTimeout: 45_000,
    navigationTimeout: 60_000,

    ignoreHTTPSErrors: false,
    locale: 'pt-BR',
  },

  globalSetup: './fixtures/global-setup.js',

  // Cancela, ao fim de QUALQUER invocação, as solicitações que ela criou. Fica aqui — e não
  // apenas no `npm run limpar` — para valer também quando alguém roda `npx playwright test`
  // direto, que é o caso comum.
  //
  // Medido em 27/08/2026: teardown que lança exceção NÃO impede a geração do relatório nem
  // apaga trace/vídeo (os artefatos por teste já estão gravados quando ele roda). Ainda assim
  // o arquivo nunca lança — ver o cabeçalho dele.
  //
  // `PULAR_LIMPEZA=1` desliga, para depurar com o resíduo vivo.
  globalTeardown: './fixtures/global-teardown.js',

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
