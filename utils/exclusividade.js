// @ts-check
import { mkdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Exclusão mútua entre workers do Playwright, para recursos que são **genuinamente únicos no
 * ambiente** e não podem ser isolados por massa.
 *
 * Por que existe: a área de upload temporária do Fluig (`UPLOAD_FOLDER`) é do USUÁRIO no
 * servidor, não da aba nem da sessão. E ela é a MESMA para o publicador do GED e para o
 * anexo da Solicitação de Compras — por isso os dois disputam o MESMO lock: `'fluig-upload-staging'`.
 * Usar nomes diferentes nos dois pontos reintroduz a colisão: a limpeza de resíduos
 * de um apagaria o arquivo do outro (confirmado em campo: um `QA-<uuid>-documento-valido.pdf`,
 * resíduo de anexo de Compras, apareceu na tabela do publicador do GED). O próprio produto
 * revela que a área é um diretório por usuário: `/volume/wdk-data/upload/TOTVS-FS/`.
 * Dar nome de arquivo único NÃO resolve — a disputa é pelo diretório, não pelo nome.
 *
 * O lock precisa ser segurado até a PUBLICAÇÃO terminar, não até o clique em Confirmar:
 * o `POST documentPublisher/saveNewItem` segue em voo depois do clique, e soltar antes deixa
 * o worker seguinte limpar a tabela por baixo de uma publicação em andamento. Dois testes publicando ao mesmo tempo com a mesma conta
 * enxergam a tabela de arquivos um do outro — e a limpeza de resíduos de um apaga o arquivo do
 * outro, produzindo "documento não apareceu na listagem" num teste que está correto. Medido:
 * `tests/e2e/documentos` dava 6 verdes/2 vermelhos com `--workers=1` e 4/4 com `--workers=4`.
 *
 * Isolar por massa não resolve, porque o recurso disputado não é o dado — é a área de staging.
 * Serializar o arquivo também não, porque a disputa é ENTRE arquivos (`gestao-documentos` e
 * `lixeira-documentos`), e `describe.serial` não atravessa arquivo nem worker. Daí um lock de
 * sistema de arquivos, que é o único canal compartilhado entre processos do runner.
 *
 * O lock é um diretório: `mkdir` é atômico em POSIX e em Windows, então quem cria, adquire.
 *
 * @template T
 * @param {string} nome identificador do recurso disputado (vira o nome do lock)
 * @param {() => Promise<T>} tarefa seção crítica
 * @param {{ timeout?: number, idadeMaxima?: number }} [opcoes]
 * @returns {Promise<T>}
 */
export async function comExclusividade(nome, tarefa, opcoes = {}) {
  const { timeout = 180_000, idadeMaxima = 300_000 } = opcoes;
  const lock = caminhoDoLock(nome);
  const limite = Date.now() + timeout;

  for (;;) {
    try {
      await mkdir(lock);
      break;
    } catch (erro) {
      if (/** @type {NodeJS.ErrnoException} */ (erro).code !== 'EEXIST') throw erro;

      // Lock órfão: um worker morto (timeout do runner, Ctrl+C) deixaria a suíte inteira
      // travada até o timeout. Depois de `idadeMaxima` sem ninguém liberar, toma o lock.
      const idade = await stat(lock)
        .then((s) => Date.now() - s.mtimeMs)
        .catch(() => 0);
      if (idade > idadeMaxima) {
        await rm(lock, { recursive: true, force: true });
        continue;
      }

      if (Date.now() > limite) {
        throw new Error(
          `Não foi possível obter exclusividade sobre "${nome}" em ${timeout}ms. ` +
            `Outro teste segurou o recurso o tempo todo, ou um lock órfão ficou em ${lock}.`,
        );
      }
      await new Promise((resolver) => setTimeout(resolver, 200));
    }
  }

  try {
    return await tarefa();
  } finally {
    await rm(lock, { recursive: true, force: true });
  }
}

/**
 * Caminho do diretório que representa o lock de `nome`.
 *
 * Fica isolado aqui porque três funções deste módulo precisam concordar sobre ele: um prefixo
 * divergente entre quem adquire e quem libera produziria um lock que nunca é solto — e o sintoma
 * seria uma suíte travando ao acaso, longe da causa.
 *
 * @param {string} nome
 * @returns {string}
 */
export function caminhoDoLock(nome) {
  return join(tmpdir(), `cassi-e2e-lock-${nome}`);
}

/**
 * Tenta adquirir o lock **sem esperar**: devolve `true` quando conseguiu e `false` quando outro
 * processo já o segura.
 *
 * `comExclusividade` resolve o caso "preciso deste recurso específico, espero minha vez". Este
 * resolve o outro: "preciso de UM recurso de um conjunto grande — se este está ocupado, pego o
 * próximo". É o que a reserva de contrato usa (`utils/massa-contratos.js`): com 554 contratos
 * vigentes na base, esperar por um deles seria desperdício quando há 553 livres ao lado.
 *
 * Mesma primitiva de sempre: `mkdir` é atômico em POSIX e em Windows, então quem cria, adquire.
 *
 * @param {string} nome identificador do recurso
 * @param {{ idadeMaxima?: number }} [opcoes] `idadeMaxima` em ms para considerar o lock órfão
 * @returns {Promise<boolean>}
 */
export async function tentarAdquirir(nome, opcoes = {}) {
  const { idadeMaxima = 600_000 } = opcoes;
  const lock = caminhoDoLock(nome);

  try {
    await mkdir(lock);
    return true;
  } catch (erro) {
    if (/** @type {NodeJS.ErrnoException} */ (erro).code !== 'EEXIST') throw erro;
  }

  // Lock órfão: worker morto (timeout do runner, Ctrl+C) deixaria o recurso reservado para
  // sempre. `idadeMaxima` precisa ser maior que o maior `test.setTimeout` da suíte (180s hoje),
  // senão um teste legitimamente lento perderia o próprio lock para o vizinho.
  const idade = await stat(lock)
    .then((s) => Date.now() - s.mtimeMs)
    .catch(() => 0);
  if (idade <= idadeMaxima) return false;

  await rm(lock, { recursive: true, force: true });
  try {
    await mkdir(lock);
    return true;
  } catch (erro) {
    // Outro worker tomou o lock órfão no mesmo instante — ele venceu, e seguir para o próximo
    // candidato é exatamente o comportamento desejado.
    if (/** @type {NodeJS.ErrnoException} */ (erro).code === 'EEXIST') return false;
    throw erro;
  }
}

/**
 * Libera um lock adquirido por `tentarAdquirir`.
 *
 * @param {string} nome
 * @returns {Promise<void>}
 */
export async function liberar(nome) {
  await rm(caminhoDoLock(nome), { recursive: true, force: true });
}
