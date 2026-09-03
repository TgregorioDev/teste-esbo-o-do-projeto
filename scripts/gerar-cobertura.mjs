// @ts-check
/**
 * Regenera `docs/cobertura.md` a partir do catálogo e da suíte.
 *
 * A ligação entre catálogo e teste é o ID **declarado** pelo teste: no título de
 * `test(...)`/`test.describe(...)` ou no cabeçalho do arquivo (antes do primeiro `test`).
 * É o que torna a cobertura auditável em vez de declarada — por isso este script existe:
 * qualquer um reproduz o número, e ele não depende de alguém ter contado à mão.
 *
 * Desde **03/09/2026**, menção em prosa (comentário, mensagem de assertion) **não conta**;
 * ver o comentário da regra, mais abaixo.
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
  'CT-SEG-10-S1':
    'bloqueado: o critério de ACL correta dos documentos/pastas que o workflow gera não foi definido pela Cassi — pergunta em aberto. Assertion frouxa aqui seria pior que ausência de teste.',
  'CT-ACC-03-S1': 'exige contrato com filial órfã (código sem cadastro); não existe na base',
  'CT-ACC-03-S3': 'contrato de 177 itens congela o navegador (D-03) e derruba o worker',
  'CT-ACC-08-H':
    'depende de abrir a SC já criada — D-01 a deixa atribuída a `consumerkeycompras`, fora do alcance da conta da automação',
  'CT-ADM-01-S2': 'reprocessar atividade de integração exige perfil de administrador',
  'CT-AUT-03-S3': 'exige token válido de redefinição, entregue por e-mail; sem caixa postal acessível',
  'CT-AUT-03-S4': 'idem CT-AUT-03-S3 — depende do token por e-mail',
  // ── Regras de negócio declaradas pelo cliente, sem teste por bloqueio duplo (03/09/2026) ──
  // Acrescentadas ao catálogo como lacuna DECLARADA: a regra existe, o teste não. As duas
  // causas são de ambiente/cadastro, não de escopo — provisionamento compete ao cliente.
  'CT-CMP-05-S2':
    'trava de alçada contra manipulação client-side: `TOTVS-FS` não está na AL/DHL do Protheus, então nenhuma tarefa de alçada chega à automação — e nenhuma SC dela chega à alçada (D-01). Declarado, não implementado; provisionamento compete ao cliente. Ler junto com CT-SEG-07-S1.',
  'CT-CMP-06-S1':
    'devolução na alçada (regerar documento): consequência de defeito aberto (D-01) + cadastro no ERP (SY1/AL) — declarado, não implementado; provisionamento compete ao cliente',
  'CT-CMP-06-S2': 'idem CT-CMP-06-S1 — devolução para novo fornecedor (2º colocado)',
  'CT-CMP-06-S3': 'idem CT-CMP-06-S1 — retorno para Cotação',
  'CT-CMP-06-S4': 'idem CT-CMP-06-S1 — retorno para Negociação',
  'CT-CMP-06-S5': 'idem CT-CMP-06-S1 — cancelamento a partir da alçada',
  'CT-COT-03-H':
    'regra de concorrência (dispensa ⇒ exatamente 1 fornecedor): nenhuma SC da automação chega à Cotação (D-01) e `TOTVS-FS` não é comprador na SY1 — declarado, não implementado; provisionamento compete ao cliente',
  'CT-COT-03-S1': 'idem CT-COT-03-H — sem dispensa, 2 fornecedores devem ser recusados (mínimo 3)',
  'CT-COT-03-S2': 'idem CT-COT-03-H — com dispensa, 2 fornecedores devem ser recusados',
  'CT-DEP-01-H': 'o formulário de Dependentes não monta campo sem matrícula ativa',
  'CT-DEP-01-S1': 'idem CT-DEP-01-H',
  'CT-DEP-01-S2': 'idem CT-DEP-01-H',
  'CT-DEP-01-S3': 'idem CT-DEP-01-H',
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
  'CT-SUB-01-H':
    'o formulário de Substituição responde "Funcionário não localizado" sem matrícula ativa',
  'CT-SUB-01-S1': 'idem CT-SUB-01-H',
  'CT-SUB-01-S2': 'idem CT-SUB-01-H',
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
 * `RE_TITULO` extrai o texto do título de cada `test(...)` / `test.describe(...)`;
 * `RE_PRIMEIRO_TESTE` marca onde termina o cabeçalho do arquivo. Juntos, delimitam os dois
 * únicos lugares onde um ID declara cobertura — a regra está documentada logo abaixo.
 */
const RE_TITULO = /(?:^|[\s.])(?:test|it)(?:\.\w+)*\s*\(\s*(['"`])([\s\S]*?)\1/g;
const RE_PRIMEIRO_TESTE = /(?:^|[\s.])(?:test|it)(?:\.\w+)*\s*\(/;

/**
 * **Regra de cobertura (desde 03/09/2026): DECLARAÇÃO, não menção.**
 *
 * Um caso conta como coberto quando seu ID aparece em UM dos dois lugares:
 *
 * 1. no **título** de um `test(...)` / `test.describe(...)` — a forma preferida;
 * 2. no **cabeçalho do arquivo** (tudo que vem antes do primeiro `test`), onde um spec declara
 *    "este arquivo cobre CT-X, CT-Y".
 *
 * Prosa no MEIO do arquivo — comentário explicativo, mensagem de assertion, referência cruzada
 * a um caso irmão — **não conta mais**. Duas razões, ambas medidas:
 *
 * - o custo já tinha mordido: ao explicar o defeito de CT-ACC-06-S1, bastou citar o ID do caso
 *   irmão num comentário para a cobertura subir sem nenhum teste novo;
 * - e produzia incoerência: `CT-DEP-01-H` aparecia "coberto" porque uma mensagem de assertion o
 *   citava, enquanto `CT-DEP-01-S1/S2/S3` — mesmo bloqueio, mesma frase — eram lacunas com
 *   motivo declarado.
 *
 * O aviso "contados por menção em prosa" some por construção. No lugar dele, o relatório traz
 * uma listagem apenas INFORMATIVA dos IDs mencionados só em prosa: eles não entram no total,
 * mas ficam visíveis para auditoria (ou o ID vai para o título, ou o caso é lacuna com motivo).
 *
 * O mapa `onde` reflete, portanto, onde o ID é **declarado** — nunca onde é mencionado.
 */
/** @type {Map<string, Set<string>>} */
const onde = new Map();
/** Todo ID que apareceu em qualquer lugar de qualquer spec (inclusive prosa). */
const mencionados = new Set();

for (const caminho of specs('tests')) {
  const fonte = readFileSync(caminho, 'utf8');
  const corte = fonte.search(RE_PRIMEIRO_TESTE);
  const cabecalho = corte === -1 ? fonte : fonte.slice(0, corte);
  const declarados = new Set(
    [cabecalho, ...[...fonte.matchAll(RE_TITULO)].map((m) => m[2])].flatMap((t) => t.match(RE) ?? []),
  );

  for (const id of new Set(fonte.match(RE) ?? [])) mencionados.add(id);

  for (const id of declarados) {
    if (!onde.has(id)) onde.set(id, new Set());
    onde.get(id)?.add(caminho.replace('tests/', ''));
  }
}

/**
 * IDs mencionados em algum spec mas declarados em NENHUM — acumulado sobre todos os arquivos,
 * nunca o veredito do último processado. (O defeito anterior era exatamente esse: um `delete`
 * por arquivo fazia o resultado depender da ordem de leitura do diretório.)
 */
const soEmProsa = [...mencionados].filter((id) => !onde.has(id)).sort();

const orfaos = [...mencionados].filter((id) => !casos.includes(id)).sort();
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

const avisoProsa = soEmProsa.length
  ? '> ℹ️ **Mencionados só em prosa (NÃO contam como cobertura)**: ' +
    soEmProsa.map((id) => '`' + id + '`').join(', ') +
    '.\n> Aparecem em comentário ou mensagem de assertion, em nenhum título de teste e em nenhum ' +
    'cabeçalho de arquivo. A listagem é informativa, para auditoria: ou o ID sobe para o título ' +
    'do teste que o exercita, ou o caso é lacuna com motivo declarado.'
  : '> Nenhum ID é mencionado só em prosa: todo ID citado na suíte aparece em título de teste ou ' +
    'no cabeçalho do arquivo.';

const doc = `# Cobertura por caso de teste

> Gerado por \`node scripts/gerar-cobertura.mjs\`. **Não edite à mão** — regenere.

Medido sobre \`docs/catalogo-casos.md\` e \`tests/**/*.spec.js\`. A ligação é o **ID declarado
pelo teste** — no título de \`test(...)\`/\`test.describe(...)\` ou no cabeçalho do arquivo (antes
do primeiro \`test\`). É o que torna esta contagem auditável em vez de declarada. Desde
**03/09/2026**, menção em prosa (comentário, mensagem de assertion) **não conta como cobertura**.

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
