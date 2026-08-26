// @ts-check
import { appendFileSync, mkdirSync } from 'node:fs';
import { test as base, expect } from '@playwright/test';
import { fakerPT_BR as faker } from '@faker-js/faker';
import { LoginPage } from '../pages/LoginPage.js';
import { AcompanhamentoContratosPage } from '../pages/AcompanhamentoContratosPage.js';
import { SolicitacaoCompraModal } from '../components/SolicitacaoCompraModal.js';

/**
 * Fixtures compartilhadas da suíte.
 *
 * A seed do faker é fixada por execução e anexada ao relatório: sem ela, massa variável
 * gera falha irreproduzível. Para repetir exatamente a massa de uma execução:
 *   FAKER_SEED=<valor> npx playwright test
 */

export const FAKER_SEED = process.env.FAKER_SEED
  ? Number(process.env.FAKER_SEED)
  : Math.floor(Math.random() * 1_000_000);

faker.seed(FAKER_SEED);

/**
 * @typedef {Object} Fixtures
 * @property {LoginPage} loginPage
 * @property {AcompanhamentoContratosPage} contratosPage
 * @property {SolicitacaoCompraModal} solicitacaoModal
 * @property {undefined} evidence
 */

export const test = /** @type {import('@playwright/test').TestType<import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions & Fixtures, import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions>} */ (
  base.extend({
    loginPage: async ({ page }, use) => {
      await use(new LoginPage(page));
    },

    contratosPage: async ({ page }, use) => {
      await use(new AcompanhamentoContratosPage(page));
    },

    solicitacaoModal: async ({ page }, use) => {
      await use(new SolicitacaoCompraModal(page));
    },

    /**
     * Evidência de falha no relatório da execução.
     *
     * `auto: true` → roda em todo teste sem precisar ser declarada na assinatura.
     * `testInfo.attach()` grava no relatório HTML e no JUnit; complementa (não substitui)
     * trace/screenshot/video em retain-on-failure do playwright.config.js.
     */
    evidence: [
      /**
       * A forma em tupla (`[fn, options]`) não propaga a inferência de tipos das fixtures,
       * então os parâmetros são anotados explicitamente para o `checkJs` verificar o corpo.
       *
       * @param {{ page: import('@playwright/test').Page }} fixtures
       * @param {(valor: undefined) => Promise<void>} use
       * @param {import('@playwright/test').TestInfo} testInfo
       */
      async ({ page }, use, testInfo) => {
        // Anotação em TODA execução, inclusive nas verdes: quando o teste falhar amanhã,
        // a seed da última execução boa ainda estará no relatório.
        testInfo.annotations.push({ type: 'faker-seed', description: String(FAKER_SEED) });

        await use(undefined);

        // ── Livro-razão do que este teste criou ────────────────────────────────────────────
        //
        // Os testes destrutivos já anotam o que criam (`sc-criada`, `medicao-criada`,
        // `contencioso-criado`). Aqui essas anotações viram uma linha por registro em
        // `test-results/criados.jsonl`, que é o que `scripts/limpar-massa.mjs` consome depois
        // da execução.
        //
        // Por que arquivo, e não a anotação sozinha: anotação só existe depois do merge dos
        // relatórios, e o que mais interessa limpar é justamente o resíduo de teste que MORREU
        // no meio — esse nunca chega ao relatório. Append funciona entre workers e sobrevive a
        // processo derrubado.
        //
        // Isto REGISTRA, não apaga: a limpeza é passo separado e explícito, para nunca
        // ameaçar a coleta de evidências.
        const criados = testInfo.annotations.filter((a) => /criad[ao]/i.test(a.type ?? ''));
        if (criados.length > 0) {
          try {
            mkdirSync('test-results', { recursive: true });
            const linhas = criados
              .map((a) => {
                // A descrição nem sempre é só o número: alguns testes anotam
                // `numero=112690 justificativa="..."`. O que o limpador precisa é o id, e o
                // primeiro grupo de dígitos é ele em todos os formatos usados na suíte.
                const descricao = String(a.description ?? '').trim();
                const id = descricao.match(/\d{4,}/)?.[0] ?? descricao;
                return JSON.stringify({
                  tipo: 'solicitacao',
                  id,
                  descricaoOriginal: descricao === id ? undefined : descricao,
                  anotacao: a.type,
                  teste: testInfo.titlePath.join(' › '),
                  em: new Date().toISOString(),
                });
              })
              .join('\n');
            appendFileSync('test-results/criados.jsonl', linhas + '\n');
          } catch (erro) {
            // Falhar aqui derrubaria um teste por causa da CONTABILIDADE dele, o que é pior
            // que perder uma linha do livro: o registro continua rastreável pelo carimbo `QA`.
            console.warn(`livro-razão: não foi possível registrar (${String(erro).slice(0, 80)})`);
          }
        }

        if (testInfo.status === testInfo.expectedStatus) return;

        // Spec de API (`tests/api/**`) nunca navega: a `page` existe, mas segue em
        // `about:blank`. Capturar aí produz um PNG branco de ~4 KB que ocupa espaço no
        // relatório e, pior, PARECE evidência — quem abre pensa que a tela ficou em branco no
        // momento da falha. Nesses casos o que vale é a resposta do endpoint, que os próprios
        // testes de API já colocam na mensagem da assertion.
        const semTela = page.url() === 'about:blank' || page.url() === '';
        if (semTela) {
          await testInfo.attach('sem-captura', {
            body:
              'Este teste não dirige interface — a página nunca saiu de about:blank. ' +
              'Screenshot omitida de propósito: a evidência aqui é a resposta do endpoint, ' +
              'que está na mensagem da falha.',
            contentType: 'text/plain',
          });
        } else {
          await testInfo.attach('screenshot-da-falha', {
            body: await page.screenshot({ fullPage: true }),
            contentType: 'image/png',
          });
        }

        await testInfo.attach('contexto-da-falha', {
          body: JSON.stringify(
            {
              teste: testInfo.titlePath,
              status: testInfo.status,
              url: page.url(),
              fakerSeed: FAKER_SEED,
              reproduzirCom: `FAKER_SEED=${FAKER_SEED} npx playwright test`,
              erro: testInfo.error?.message,
            },
            null,
            2,
          ),
          contentType: 'application/json',
        });
      },
      { auto: true },
    ],
  })
);

export { expect };
