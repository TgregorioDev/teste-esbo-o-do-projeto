// @ts-check
/**
 * Avisa quando um teste marcado `@bug` PASSA.
 *
 * A tag `@bug` marca teste que reprova de propósito, documentando defeito de produto
 * catalogado no README. Ela tem um buraco conhecido: não avisa quando o defeito é
 * CORRIGIDO — o teste fica verde e ninguém percebe, e a tag apodrece marcando algo que já
 * não existe. Este script fecha esse buraco lendo o JUnit que a suíte já gera.
 *
 * É a alternativa escolhida em `docs/decisao-test-fail.md`, em vez de migrar os testes para
 * `test.fail()`: medido em laboratório, o `test.fail()` reporta PASS mesmo quando a falha
 * vem de OUTRO motivo (pré-condição ausente, por exemplo), escondendo a causa real — o
 * oposto do que a suíte precisa.
 *
 * Uso: node scripts/alerta-bug-corrigido.mjs <caminho do junit.xml>
 * Sai 1 quando encontra algum `@bug` verde. O job que o chama é `continue-on-error`, então
 * isso ALERTA sem bloquear o merge.
 */
import { readFileSync, existsSync, appendFileSync } from 'node:fs';

const arquivo = process.argv[2] ?? 'test-results/junit.xml';

if (!existsSync(arquivo)) {
  console.log(`::warning::JUnit não encontrado em ${arquivo} — nada a verificar.`);
  process.exit(0);
}

const xml = readFileSync(arquivo, 'utf8');

// A ORDEM das alternativas importa e custou um teste para descobrir: com a forma pareada
// primeiro, `[^>]*` casa também a barra de `<testcase .../>` e o `[\s\S]*?` seguinte varre
// até o `</testcase>` de OUTRO caso, engolindo os do meio — o auto-fechado nunca era
// avaliado, que é justamente a forma que o Playwright usa para teste que PASSOU. Por isso o
// auto-fechado vem primeiro. Regex em vez de parser XML porque o formato do JUnit é estável
// e uma dependência a mais num passo de CI é custo sem retorno.
const casos = [...xml.matchAll(/<testcase\b([^>]*?)\/>|<testcase\b([^>]*)>([\s\S]*?)<\/testcase>/g)];

/** @type {string[]} */
const corrigidos = [];

for (const caso of casos) {
  const autoFechado = caso[1] !== undefined;
  const atributos = autoFechado ? caso[1] : (caso[2] ?? '');
  const corpo = autoFechado ? '' : (caso[3] ?? '');
  const nome = /name="([^"]*)"/.exec(atributos)?.[1] ?? '(sem nome)';
  if (!nome.includes('@bug')) continue;
  // Auto-fechado = sem filhos = passou. Com corpo, só passou se não houver failure/error;
  // `skipped` fica de fora porque teste pulado não prova que o defeito sumiu.
  const reprovou = /<failure\b|<error\b/.test(corpo);
  const pulou = /<skipped\b/.test(corpo);
  if (!reprovou && !pulou) corrigidos.push(nome);
}

if (corrigidos.length === 0) {
  console.log('Nenhum teste `@bug` passou: todos os defeitos conhecidos seguem presentes.');
  process.exit(0);
}

const linhas = [
  '### ⚠️ Defeito conhecido pode ter sido corrigido',
  '',
  `${corrigidos.length} teste(s) marcado(s) \`@bug\` **passaram** nesta execução.`,
  'Um `@bug` verde significa que o produto mudou — confirme com o dono do ambiente e, se a',
  'correção for real, **remova a tag** e atualize a tabela de defeitos do README.',
  '',
  ...corrigidos.map((n) => `- \`${n}\``),
];

console.log(linhas.join('\n'));
for (const nome of corrigidos) console.log(`::warning::Teste @bug passou (defeito possivelmente corrigido): ${nome}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, linhas.join('\n') + '\n');
}

process.exit(1);
