// @ts-check
import { appendFileSync, mkdirSync } from 'node:fs';
import { test as base, expect } from '@playwright/test';
import { fakerPT_BR as faker } from '@faker-js/faker';
import { LoginPage } from '../pages/LoginPage.js';
import { AcompanhamentoContratosPage } from '../pages/AcompanhamentoContratosPage.js';
import { SolicitacaoCompraModal } from '../components/SolicitacaoCompraModal.js';
import { liberarReservasDeContrato } from '../utils/massa-contratos.js';
import { hash32, idEstavelDoTeste } from '../utils/identidade-do-teste.js';

/**
 * Fixtures compartilhadas da suíte.
 *
 * A seed do faker é fixada por execução **e** por teste, e as duas vão para o relatório:
 *
 * - `FAKER_SEED` é a seed da execução (vinda do ambiente, ou sorteada uma vez por processo);
 * - cada teste é semeado, na fixture `evidence`, com `FAKER_SEED ^ hash32(idEstavelDoTeste)`.
 *
 * Por que não bastava a seed por execução: cada worker do Playwright é um processo, todos
 * partem da MESMA `FAKER_SEED` e consomem a sequência do faker na ORDEM DE DESPACHO. Medido em
 * 03/09/2026: com `--workers=4` dois testes diferentes recebiam a mesma massa (ambos eram o
 * primeiro do seu worker), as três cópias de `--repeat-each=3` recebiam massa idêntica, e o
 * mesmo teste recebia massa diferente entre `--workers=1` e `--workers=4`. O comando de
 * reprodução só era exato com a mesma disposição de workers.
 *
 * Semear por teste torna a massa função de (seed da execução, identidade do teste) e de nada
 * mais. Para repetir exatamente a massa de um teste, em qualquer número de workers:
 *   FAKER_SEED=<valor> npx playwright test <arquivo> -g "<título>"
 */

export const FAKER_SEED = process.env.FAKER_SEED
  ? Number(process.env.FAKER_SEED)
  : Math.floor(Math.random() * 1_000_000);

// Seed global do processo: vale para código que gera massa FORA de um teste (globalSetup,
// script de manutenção). Dentro de um teste ela é substituída pela seed por teste, abaixo.
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
        // ── Seed do faker POR TESTE ──────────────────────────────────────────────────────────
        //
        // A seed da execução (`FAKER_SEED`) é combinada por XOR com o hash da identidade
        // estável do teste (título sem `@tags` + `repeatEachIndex`, sem `retry` — a mesma de
        // `utils/massa-contratos.js`). Resultado: a massa deixa de depender de qual worker pegou
        // o teste e de quantos testes esse worker já rodou antes; passa a ser função só de
        // (seed da execução, teste). Retentativa cai na mesma seed — reproduz; `--repeat-each`
        // cai em seeds diferentes — exercita.
        //
        // Reatribuir a seed global aqui é seguro pelo mesmo argumento de `reservasEmPosse` em
        // `utils/massa-contratos.js`: cada worker é um processo próprio e executa UM teste por
        // vez, então a sequência do faker entre este `seed()` e o fim do teste pertence
        // inteiramente a este teste. As factories continuam importando o mesmo `fakerPT_BR`.
        const idDoTeste = idEstavelDoTeste(testInfo);
        const seedDoTeste = (FAKER_SEED ^ hash32(idDoTeste)) >>> 0;
        faker.seed(seedDoTeste);

        // Anotação em TODA execução, inclusive nas verdes: quando o teste falhar amanhã,
        // a seed da última execução boa ainda estará no relatório. `faker-seed` é o que se
        // passa no comando de reprodução; `faker-seed-do-teste` é o valor efetivamente semeado,
        // para conferência (deve ser igual entre uma falha e a sua retentativa).
        testInfo.annotations.push({ type: 'faker-seed', description: String(FAKER_SEED) });
        testInfo.annotations.push({ type: 'faker-seed-do-teste', description: String(seedDoTeste) });

        // ── Livro-razão: escuta a REDE, não a convenção de nome ──────────────────────────────
        //
        // A primeira versão lia as anotações do teste e filtrava por `/criad[ao]/`. O filtro
        // foi inferido de uma amostra e estava incompleto: os testes de aprovação anotam
        // `solicitacao-aprovada`, `solicitacao-reprovada`, `alcada-sem-aprovador`… e criam SC
        // do mesmo jeito. Numa execução completa isso deixou 11 solicitações órfãs — o livro
        // registrou 7 de 18.
        //
        // Escutar a resposta de criação elimina a convenção do caminho: o que conta é o que o
        // servidor devolveu, não o que o teste lembrou de declarar. Cobre os dois pontos de
        // entrada (o widget do portal e o formulário clássico) e também criação disparada por
        // `fetch` dentro de `page.evaluate`, que é requisição da página como qualquer outra.
        /** @type {Set<string>} */
        const criadosNaRede = new Set();
        page.on('response', (resposta) => {
          const url = resposta.url();
          if (!/\/start$|\/workflowView\/send$/.test(url)) return;
          if (resposta.request().method() !== 'POST') return;
          // NÃO filtrar por `resposta.ok()`: medido em 27/08/2026 que `prc_questionario_v2`
          // CRIA a instância mesmo respondendo HTTP 500. O que prova a criação é o corpo trazer
          // um `processInstanceId`, não o status — filtrar por 2xx deixava esses registros
          // órfãos (instâncias OPEN acumuladas na base que o teardown ignorava).
          resposta
            .json()
            .then((corpo) => {
              const id = corpo?.processInstanceId ?? corpo?.content?.processInstanceId;
              if (id) criadosNaRede.add(String(id));
            })
            .catch(() => {
              // Corpo não-JSON ou já consumido: perder UM registro aqui é aceitável, ele
              // continua rastreável pelo carimbo `QA` e alcançável por `--descobrir`.
            });
        });

        await use(undefined);

        // ── Devolve os contratos que este teste reservou ───────────────────────────────────
        //
        // `utils/massa-contratos.js` reserva o contrato escolhido para que dois workers não
        // disputem o mesmo registro sob `fullyParallel: true`. A devolução precisa acontecer
        // aqui, e não no fim do corpo do teste: um teste que falha ou estoura o timeout nunca
        // chega à última linha, e o contrato ficaria reservado até a reserva expirar — com a
        // suíte estreitando o pool a cada vermelho.
        await liberarReservasDeContrato();

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
        // Anotações continuam valendo como fonte secundária: cobrem registro cujo id o teste
        // conhece por outro caminho (a medição de contrato, por exemplo, lê o número da tela).
        const idsAnotados = testInfo.annotations
          .filter((a) => /criad[ao]/i.test(a.type ?? ''))
          .map((a) => String(a.description ?? '').match(/\d{4,}/)?.[0])
          .filter((id) => typeof id === 'string');

        const criados = [...new Set([...criadosNaRede, ...idsAnotados])];
        if (criados.length > 0) {
          try {
            mkdirSync('test-results', { recursive: true });
            const linhas = criados
              .map((id) =>
                JSON.stringify({
                  tipo: 'solicitacao',
                  id,
                  origem: criadosNaRede.has(id) ? 'rede' : 'anotacao',
                  teste: testInfo.titlePath.join(' › '),
                  em: new Date().toISOString(),
                }),
              )
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
              fakerSeedDoTeste: seedDoTeste,
              idDoTeste,
              // Reproduz a MESMA massa deste teste em qualquer número de workers e em qualquer
              // ordem de despacho: a seed por teste depende só de FAKER_SEED e da identidade.
              // `-g` é regex: parênteses e afins do título são escapados para casar literalmente.
              // A identidade inclui o `repeatEachIndex`, então uma cópia N>0 de `--repeat-each`
              // só se reproduz com o mesmo `--repeat-each` — o comando o repete quando é o caso.
              reproduzirCom:
                `FAKER_SEED=${FAKER_SEED} npx playwright test ${testInfo.file.replace(/^.*?\/tests\//, 'tests/')} ` +
                `-g ${JSON.stringify(testInfo.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))}` +
                (testInfo.repeatEachIndex > 0 ? ` --repeat-each=${testInfo.project.repeatEach}` : ''),
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
