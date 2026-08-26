// @ts-check
/**
 * Regenera `docs/cobertura.md` a partir do catálogo e da suíte.
 *
 * A ligação entre catálogo e teste é o ID citado no título do teste. É o que torna a
 * cobertura auditável em vez de declarada — por isso este script existe: qualquer um
 * reproduz o número, e ele não depende de alguém ter contado à mão.
 *
 *   node scripts/gerar-cobertura.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RE = /CT-[A-Z0-9]{2,4}-\d{2}-(?:H|S\d)/g;

/**
 * Motivo pelo qual um caso do catálogo não tem teste. Mantenha atualizado: uma lacuna sem
 * motivo é indistinguível de um caso esquecido.
 * @type {Record<string, string>}
 */
const MOTIVOS = {
  'CT-ACC-03-S1': 'exige contrato com filial órfã (código sem cadastro); não existe na base',
  'CT-ACC-03-S3': 'contrato de 177 itens congela o navegador (D-03) e derruba o worker',
  'CT-ACC-08-H':
    'depende de abrir a SC já criada — D-01 a deixa atribuída a `consumerkeycompras`, fora do alcance da conta da automação',
  'CT-ADM-01-S2': 'reprocessar atividade de integração exige perfil de administrador',
  'CT-AUT-03-S3': 'exige token válido de redefinição, entregue por e-mail; sem caixa postal acessível',
  'CT-AUT-03-S4': 'idem CT-AUT-03-S3 — depende do token por e-mail',
  'CT-DEP-01-S1': 'o formulário de Dependentes não monta campo sem matrícula ativa',
  'CT-DEP-01-S2': 'idem CT-DEP-01-S1',
  'CT-DEP-01-S3': 'idem CT-DEP-01-S1',
  'CT-FAT-03-S1':
    'compara medição automática × manual, e `dsSync_executeMedicaoManual` está inativo (U-09)',
  'CT-FER-01-H': 'o processo `wf_solicitacao_ferias` barra o usuário de Compras — exige grupo de RH',
  'CT-FER-01-S1': 'idem CT-FER-01-H',
  'CT-FER-01-S2': 'idem CT-FER-01-H',
  'CT-FER-01-S3': 'idem CT-FER-01-H',
  'CT-FER-01-S4': 'idem CT-FER-01-H',
  'CT-GED-03-H':
    'check-out usa protocolo `dav4:`/WebDAV nativo, fora do alcance de qualquer automação de navegador',
  'CT-GED-03-S1': 'idem CT-GED-03-H',
  'CT-JUR-05-H': 'processo inoperante: só campos `readonly`, disparado por processo pai',
  'CT-NOT-01-S1': 'os datasets de canal são invocados server-side; não há requisição a interceptar',
  'CT-OCO-01-H':
    'o processo `wf_aprovacao_ocorrencia` barra o usuário de Compras — exige grupo de RH',
  'CT-OCO-01-S1': 'idem CT-OCO-01-H',
  'CT-PFN-01-S2': 'força bruta real não se executa contra o ambiente — decisão, não limitação',
  'CT-PFN-02-H': 'exige credencial de fornecedor (CNPJ/CPF/senha), inexistente em homologação',
  'CT-PFN-03-H': 'idem CT-PFN-02-H',
  'CT-PFN-04-H': 'idem CT-PFN-02-H',
  'CT-PFN-05-H': 'idem CT-PFN-02-H',
  'CT-PFN-06-S1': 'injeção XSS real não se executa contra o ambiente — decisão, não limitação',
  'CT-PFN-07-S1': 'IDOR exige duas contas de fornecedor; nenhuma disponível',
  'CT-SUB-01-S1': 'o formulário de Substituição responde "Funcionário não localizado" sem matrícula ativa',
  'CT-SUB-01-S2': 'idem CT-SUB-01-S1',
};

/** @param {string} dir @returns {string[]} */
function specs(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return specs(caminho);
    return caminho.endsWith('.spec.js') ? [caminho] : [];
  });
}

const catalogo = readFileSync('docs/catalogo-casos.md', 'utf8');
const casos = [...new Set(catalogo.match(RE) ?? [])].sort();

/** @type {Record<string, string>} */
const titulos = {};
for (const [, id, titulo] of catalogo.matchAll(
  /###\s+(CT-[A-Z0-9]{2,4}-\d{2}-(?:H|S\d))\s*·\s*(.+)/g,
)) {
  titulos[id] = titulo.trim();
}

/**
 * Coleta os IDs citados nos TÍTULOS de `test(...)` e `test.describe(...)` — nunca no corpo do
 * arquivo inteiro.
 *
 * ⚠️ A versão anterior lia o arquivo todo, e por isso um ID mencionado num COMENTÁRIO contava
 * como cobertura. Descoberto em 26/08/2026 ao explicar o defeito de CT-ACC-06-S1: citar
 * `CT-ACC-06-S2` numa explicação fez a cobertura "subir" de 132 para 133 sem nenhum teste novo.
 * Cobertura que sobe porque alguém escreveu um comentário não é cobertura — é ruído.
 */
const RE_TITULO = /(?:^|[\s.])(?:test|it)(?:\.\w+)*\s*\(\s*(['"`])([\s\S]*?)\1/g;
const RE_PRIMEIRO_TESTE = /(?:^|[\s.])(?:test|it)(?:\.\w+)*\s*\(/;

/**
 * Um caso conta como coberto quando seu ID aparece em algum arquivo de teste.
 *
 * ⚠️ **O que essa regra NÃO garante.** Ela é deliberadamente frouxa: a suíte declara cobertura
 * de três formas legítimas — no título do teste (preferida), no cabeçalho do arquivo
 * ("este spec cobre CT-X, CT-Y") e dentro da mensagem de uma assertion que documenta um caso
 * bloqueado. Exigir só o título derrubaria 40 casos que estão cobertos de verdade.
 *
 * O preço é que uma menção em PROSA também conta. Isso já mordeu: ao explicar o defeito de
 * CT-ACC-06-S1, bastou citar o ID do caso irmão num comentário para a cobertura ir de 132 para
 * 133 sem nenhum teste novo. Por isso o relatório lista abaixo, explicitamente, os IDs que
 * aparecem SÓ em prosa no meio do arquivo — são os candidatos a falso positivo, e ficam
 * auditáveis em vez de escondidos no total.
 */
/** @type {Map<string, Set<string>>} */
const onde = new Map();
/** IDs cuja única menção é prosa fora de título e de cabeçalho. */
const soEmProsa = new Set();

for (const caminho of specs('tests')) {
  const fonte = readFileSync(caminho, 'utf8');
  const corte = fonte.search(RE_PRIMEIRO_TESTE);
  const cabecalho = corte === -1 ? fonte : fonte.slice(0, corte);
  const declarados = new Set(
    [cabecalho, ...[...fonte.matchAll(RE_TITULO)].map((m) => m[2])].flatMap((t) => t.match(RE) ?? []),
  );

  for (const id of new Set(fonte.match(RE) ?? [])) {
    if (!onde.has(id)) onde.set(id, new Set());
    onde.get(id)?.add(caminho.replace('tests/', ''));
    if (!declarados.has(id)) soEmProsa.add(id);
    else soEmProsa.delete(id);
  }
}

const orfaos = [...onde.keys()].filter((id) => !casos.includes(id)).sort();
if (orfaos.length > 0) {
  throw new Error(
    `IDs citados na suíte que não existem no catálogo: ${orfaos.join(', ')}. ` +
      'Ou o ID está errado no teste, ou o caso precisa entrar em docs/catalogo-casos.md.',
  );
}

const faltantes = casos.filter((id) => !onde.has(id));
const semMotivo = faltantes.filter((id) => !(id in MOTIVOS));
if (semMotivo.length > 0) {
  throw new Error(
    `Casos sem teste e sem motivo declarado: ${semMotivo.join(', ')}. ` +
      'Adicione o motivo em MOTIVOS neste script — lacuna sem motivo é indistinguível de esquecimento.',
  );
}

const linhas = casos.map((id) => {
  const titulo = titulos[id] ?? '';
  const arquivos = onde.get(id);
  return arquivos
    ? `| \`${id}\` | ${titulo} | ✅ | ${[...arquivos].sort().map((a) => `\`${a}\``).join(' · ')} |`
    : `| \`${id}\` | ${titulo} | ⬜ | ${MOTIVOS[id]} |`;
});

const avisoProsa = soEmProsa.size
  ? '> ⚠️ **Contados por menção em prosa**, fora de título e de cabeçalho: ' +
    [...soEmProsa].sort().map((id) => '`' + id + '`').join(', ') +
    '.\n> São candidatos a falso positivo — confirme que existe teste para cada um, ou leve o ' +
    'ID para o título do teste.'
  : '> Nenhum caso é contado por menção em prosa: todo ID coberto aparece em título de teste ou ' +
    'no cabeçalho do arquivo.';

const doc = `# Cobertura por caso de teste

> Gerado por \`node scripts/gerar-cobertura.mjs\`. **Não edite à mão** — regenere.

Medido sobre \`docs/catalogo-casos.md\` e \`tests/**/*.spec.js\`. A ligação é o **ID citado no
título do teste** — é o que torna esta contagem auditável em vez de declarada.

| | |
|---|---|
| Casos no catálogo | **${casos.length}** |
| Com teste na suíte | **${onde.size}** (${Math.round((100 * onde.size) / casos.length)}%) |
| Sem teste | **${faltantes.length}** |

O script falha se um teste citar um ID que não existe no catálogo, ou se um caso ficar sem teste
e sem motivo declarado. As duas checagens existem para que a matriz não possa envelhecer em
silêncio.

${avisoProsa}

**⬜ não significa "esquecido"** — cada linha vazia traz o motivo medido. E **✅ não significa
sempre "fluxo executado"**: parte dos casos está coberta como *bloqueio documentado* — o teste
prova que o processo não abre, ou abre e o formulário não monta campo. Esses ficam prontos para
exercitar o fluxo no dia em que a pré-condição existir.

| ID | Caso | | Spec / motivo |
|---|---|---|---|
${linhas.join('\n')}
`;

writeFileSync('docs/cobertura.md', doc);
console.log(
  `docs/cobertura.md · ${casos.length} casos · ${onde.size} cobertos · ${faltantes.length} sem teste`,
);
