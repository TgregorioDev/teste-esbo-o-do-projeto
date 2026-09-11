// @ts-check
/**
 * Lint da suíte — a varredura de anti-padrões do quality gate da skill `playwright-test-creator`,
 * aplicada pela máquina em vez de por releitura.
 *
 * ## Por que existe
 *
 * Até 11/09/2026 a varredura (espera por tempo, skip, falha silenciosa, assertion condicional,
 * leitura instantânea usada como se esperasse) era manual. Só na semana de 08/09 a leitura
 * instantânea — `isVisible()`, `count()`, `evaluateAll()` decidindo veredito — produziu quatro
 * vermelhos com a causa errada. `playwright/prefer-web-first-assertions` pega exatamente essa
 * família quando ela vira assertion.
 *
 * ## Regras como ERRO (desde 11/09/2026)
 *
 * As regras entraram como aviso para gerar a lista real: 174 achados em 62 arquivos. Cada ponto
 * foi corrigido ou virou exceção ANOTADA (`// eslint-disable-next-line <regra> -- <motivo medido>`),
 * e com a lista em zero passaram a `error`; o lint roda no CI logo depois do typecheck. Exceção
 * nova precisa do motivo medido no próprio comentário — sem ele, é correção, não exceção.
 *
 * ## Uma regra desligada, e por quê
 *
 * `playwright/no-eval`: `page.evaluate` + `fetch` é padrão OBRIGATÓRIO deste projeto — o WAF do
 * tenant devolve 403 a `page.request` em `/process-management/**` (falta `User-Agent` e
 * `Referer` de navegador). Avisar em cada uso seria ruído sobre uma decisão medida.
 */
import js from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';

const recomendadasDoPlaywright = playwright.configs['flat/recommended'];

/** Todas as regras recomendadas do plugin, como erro. */
const regrasDoPlaywright = Object.fromEntries(
  Object.keys(recomendadasDoPlaywright.rules ?? {}).map((regra) => [regra, 'error']),
);

export default [
  {
    ignores: [
      'node_modules/',
      'playwright-report/',
      'test-results/',
      'relatorios/',
      'playwright/',
      '.inv-*',
      '.alt-*',
      '.bpmn-*',
      // Evidência de execuções antigas e sondas do MCP: não é código da suíte.
      'relatorios-*/',
      '.playwright-mcp/',
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      // O código roda nos dois lados: Node (runner, scripts) e navegador (dentro de `page.evaluate`).
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-empty': 'error',
    },
  },
  {
    ...recomendadasDoPlaywright,
    files: ['tests/**/*.js', 'pages/**/*.js', 'fixtures/**/*.js', 'utils/**/*.js'],
    rules: {
      ...regrasDoPlaywright,
      'playwright/no-eval': 'off',
      // Controle de fluxo em teste é legítimo aqui, e a medição de 11/09/2026 confirmou: dos 124
      // avisos, 80 eram `if (...) faltaPreCondicao(...)` — a classificação de pré-condição que o
      // gate precisa —, 3 `throw` com mensagem, 6 anotações de evidência e 5 ternários. O risco
      // que a skill proíbe é ASSERTION condicional, e esse continua coberto por
      // `playwright/no-conditional-expect`. Os `return` antecipados foram revisados à mão.
      'playwright/no-conditional-in-test': 'off',
      // Helpers que SÃO a assertion do teste — o corpo chama só eles.
      'playwright/expect-expect': ['error', { assertFunctionNames: ['expectPublicacaoBloqueada'] }],
    },
  },
  {
    // Os scripts limpam códigos ANSI da saída do runner (`/\x1b\[[0-9;]*m/`) — regex de controle é
    // exatamente a intenção.
    files: ['scripts/**/*.mjs'],
    rules: { 'no-control-regex': 'off' },
  },
];
