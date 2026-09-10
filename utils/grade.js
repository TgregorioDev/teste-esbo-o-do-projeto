// @ts-check

/**
 * Leitura de grades do portal — e a armadilha que elas têm em comum.
 *
 * ## O estado vazio fica na tela ENQUANTO a grade carrega
 *
 * As grades deste produto (DataTables e PO-UI) renderizam **uma linha** com a mensagem de
 * "sem dados" desde o primeiro instante, e só a substituem quando a resposta chega. Isso
 * significa que:
 *
 * - `linhas.count()` devolve **1** com a grade vazia E com a grade ainda carregando;
 * - ler cedo demais faz concluir "não há dado" sobre uma grade que teria 17 linhas.
 *
 * Medido em 09/09/2026 na Gerência de Compras: lendo 8s depois de abrir a aba Atribuir,
 * "Nenhum dado encontrado"; esperando até 40s, **17 solicitações** — em 4 de 4 tentativas.
 * Esse engano chegou a me fazer duvidar de uma remoção de tag `@bug` que estava correta.
 *
 * ## O idioma muda entre ambientes
 *
 * No `caixade182374` a mensagem é **"Nenhum dado encontrado"**; no `caixade213859`, **"No data
 * found"**. Um teste que procure só a forma em português dá falso verde no outro ambiente — e
 * foi assim que um `@bug` de captcha passou verde contra um captcha quebrado, pelo mesmo tipo
 * de erro. Por isso a expressão aqui cobre as duas, e é ela que todo mundo deve usar.
 */

/** Mensagem de grade vazia, nas duas formas já vistas em campo. */
export const ESTADO_VAZIO_DA_GRADE = /Nenhum dado encontrado|No data found/i;

/** Texto que algumas grades exibem enquanto a consulta está em voo. */
export const CARREGANDO_A_GRADE = /Carregando|Buscando/i;

/**
 * Espera a grade trazer linha REAL e devolve quantas são.
 *
 * Devolve `0` quando o prazo acaba e a única linha continua sendo a do estado vazio — aí é
 * ausência de massa de verdade, e quem chama decide como declarar (normalmente
 * `faltaPreCondicao`).
 *
 * @param {import('@playwright/test').Locator} linhas locator das `tbody tr` da grade
 * @param {number} [timeout] prazo total, em ms
 * @returns {Promise<number>}
 */
export async function esperarLinhasReais(linhas, timeout = 45_000) {
  const limite = Date.now() + timeout;

  while (Date.now() < limite) {
    const total = await linhas.count();

    if (total > 1) return total;
    if (total === 1) {
      const texto = await linhas.first().innerText();
      const provisoria = ESTADO_VAZIO_DA_GRADE.test(texto) || CARREGANDO_A_GRADE.test(texto);
      if (!provisoria) return 1;
    }

    // Espera pela PRÓXIMA renderização, não por tempo fixo: a segunda linha só é anexada
    // quando o resultado chega, então é ela o sinal. O `catch` descarta apenas a espera — a
    // contagem seguinte é quem decide.
    await linhas
      .nth(1)
      .waitFor({ state: 'attached', timeout: 2_000 })
      .catch(() => {});
  }

  return 0;
}

/**
 * A grade está vazia (já terminou de carregar e não tem dado)?
 *
 * Atalho para quem só precisa do booleano — internamente é `esperarLinhasReais`, então
 * carrega a mesma proteção contra ler cedo demais.
 *
 * @param {import('@playwright/test').Locator} linhas
 * @param {number} [timeout]
 * @returns {Promise<boolean>}
 */
export async function gradeVazia(linhas, timeout = 45_000) {
  return (await esperarLinhasReais(linhas, timeout)) === 0;
}
