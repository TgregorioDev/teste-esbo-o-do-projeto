// @ts-check

/**
 * Identidade estável de um teste — o que faz massa e escolha de contrato serem reproduzíveis.
 *
 * Dois consumidores dependem exatamente da mesma identidade, e por isso ela vive num único
 * lugar:
 *
 * - `utils/massa-contratos.js` — a afinidade por hash entre teste e contrato (o mesmo teste
 *   escolhe sempre o mesmo contrato, em qualquer worker);
 * - `fixtures/fixtures.js` — a seed do faker **por teste** (o mesmo teste gera sempre a mesma
 *   massa, em qualquer worker e em qualquer ordem de despacho).
 *
 * Se as duas divergissem, "reproduzir uma falha" passaria a exigir dois comandos diferentes.
 *
 * A identidade é o `titlePath` completo (arquivo → describes → título), único na suíte, com
 * três decisões que custaram medição para chegar aqui:
 *
 * 1. **sem `@tags`** (`semMarcadores`) — marcar um teste não pode trocar a massa dele;
 * 2. **com `repeatEachIndex`** — `--repeat-each` exercita massa/contrato diferentes por índice,
 *    em vez de repetir a mesma escolha N vezes;
 * 3. **sem `retry`** — a retentativa precisa cair na MESMA massa e no MESMO contrato, senão ela
 *    não reproduz a falha que investiga.
 *
 * ⚠️ A `FAKER_SEED` de propósito **não** entra aqui. Ela é sorteada por processo quando não vem
 * do ambiente, logo difere entre workers: usá-la na identidade faria a escolha de contrato
 * depender de qual worker pegou o teste. Na seed por teste ela entra DEPOIS, combinada por XOR
 * com o hash desta identidade (`fixtures/fixtures.js`) — o que é outra coisa: lá a seed da
 * execução é justamente o que se quer reproduzir.
 */

/**
 * Remove os marcadores `@tag` do título antes de ele virar semente de qualquer coisa.
 *
 * MEDIDO em 01/09/2026, e o motivo de esta função existir: `titlePath` foi descrito em
 * `utils/massa-contratos.js` como "imutável", mas ele muda toda vez que alguém põe ou tira uma
 * tag do título — e a suíte usa tags de propósito (`@destrutivo`, `@bug`, `@achado`). O caso
 * D-02 de quantidade/preço em `payload-solicitacao.spec.js` PASSAVA com `@bug` no título e
 * TRAVAVA em 180s sem a tag: mesmo código, mesma assertion, contrato sorteado diferente. Marcar
 * um teste não pode trocar a massa dele — se trocar, dois resultados deixam de ser comparáveis
 * e a tag vira variável escondida do experimento.
 *
 * Normalizar aqui preserva o que a distribuição precisa (identidade única e estável por teste)
 * e remove o que ela nunca deveria ter capturado (metadado de execução).
 *
 * @param {string} titulo
 * @returns {string}
 */
export function semMarcadores(titulo) {
  return titulo
    .replace(/@[\p{L}\d_-]+/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * FNV-1a de 32 bits — hash não-criptográfico, determinístico e sem dependência externa.
 *
 * Serve de peso na afinidade teste↔contrato e de componente da seed do faker por teste. O
 * resultado é sempre um inteiro sem sinal (`>>> 0`), para que possa ser combinado por XOR e
 * comparado sem surpresa de sinal.
 *
 * @param {string} texto
 * @returns {number} inteiro em [0, 2^32)
 */
export function hash32(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Identidade estável de um teste a partir do seu `TestInfo`.
 *
 * `titlePath` é o caminho completo (arquivo → describes → título), único na suíte. As tags são
 * removidas (ver `semMarcadores`) para que a identidade dependa só do que o teste É, nunca de
 * como ele está marcado. `repeatEachIndex` entra para que `--repeat-each` exercite massa e
 * contratos diferentes em vez de repetir a mesma escolha N vezes. `retry` de propósito **não**
 * entra: a retentativa precisa cair na mesma massa e no mesmo contrato, senão ela não reproduz
 * a falha que investiga.
 *
 * Recebe o `TestInfo` em vez de chamar `test.info()` para não depender de estar dentro de um
 * teste: a fixture já o tem em mãos, e quem não tem (`utils/massa-contratos.js`) decide sozinho
 * o que fazer fora de um teste.
 *
 * @param {Pick<import('@playwright/test').TestInfo, 'titlePath' | 'repeatEachIndex'>} testInfo
 * @returns {string} por exemplo `e2e/rh/dependentes.spec.js › Gestão de Dependentes › CT-DEP-02-S1 — …#0`
 */
export function idEstavelDoTeste(testInfo) {
  return `${testInfo.titlePath.map(semMarcadores).join(' › ')}#${testInfo.repeatEachIndex}`;
}
