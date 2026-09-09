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

  // Retry é rede de segurança para instabilidade de INFRA — nunca solução para flakiness.
  // Teste que passa no retry vai para investigação, e continua VISÍVEL: o Playwright o reporta
  // como `flaky`, não como `passed`.
  //
  // Local segue em 0 de propósito. As intermitências de rede medidas em 09/09/2026
  // (`net::ERR_NETWORK_CHANGED` em `page.goto`) são tratadas na origem, por uma segunda
  // tentativa de NAVEGAÇÃO na fixture `page` — ver `fixtures/fixtures.js`. Repetir o teste
  // inteiro resolveria também, mas dobraria o tempo das ~120 pré-condições declaradas desta
  // suíte sem melhorar o diagnóstico.
  retries: process.env.CI ? 2 : 0,

  // Concorrência DELIBERADAMENTE baixa, e o motivo é medido, não preferência.
  //
  // Este tenant (`caixade213859`) responde bem mais devagar que o anterior: o Portal do
  // Comprador leva ~14s para montar o "Acesso Rápido", o Portal do Fornecedor ~16s e a Central
  // de Tarefas ~18s quando são o ÚNICO acesso. Com os 8 workers que o default do Playwright
  // escolhe nesta máquina, essas mesmas telas estouram os 45s de espera e a suíte reporta 79
  // timeouts — medido em 09/09/2026. Baixando para 3, o mesmo arquivo que dava 6 vermelhos
  // passou a dar 2, e os 2 restantes são diferenças reais de ambiente.
  //
  // Isto NÃO é aumentar timeout para mascarar flakiness: os testes não estão instáveis, o
  // servidor é que degrada sob carga concorrente. Subir o número de volta reintroduz o
  // problema; medir de novo é o caminho se o ambiente melhorar.
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : 3,

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

  // O JSON é o que `scripts/veredito-do-gate.mjs` lê: traz as anotações
  // (`pre-condicao-ausente`, de `utils/pre-condicao.js`) e o status agregado por teste
  // (inclusive `flaky`), que nem o JUnit nem o HTML expõem de forma legível por máquina.
  // Localmente fica de fora por padrão (list + html); para reproduzir o veredito:
  //   PLAYWRIGHT_JSON_OUTPUT_NAME=test-results/relatorio.json npx playwright test --reporter=list,json
  //   node scripts/veredito-do-gate.mjs test-results/relatorio.json
  reporter: process.env.CI
    ? [
        ['github'],
        ['html', { open: 'never' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['json', { outputFile: 'test-results/relatorio.json' }],
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
