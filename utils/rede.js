// @ts-check

/**
 * Retentativa de REDE para chamadas feitas de dentro da página (`page.evaluate` + `fetch`).
 *
 * ## Por que existe
 *
 * `TypeError: Failed to fetch` apareceu em 5 testes de API/leitura entre 09 e 10/09/2026
 * (`rastreabilidade-rdfc`, `alcada-solicitacao-compras`, `nomes-de-atividades-sc`,
 * `fila-faturamento-protheus`, `rejeicao-documento`) e no `globalSetup` em 11/09 — a conexão da
 * máquina com o tenant cai por um instante, e o teste reprovava com um erro cru que o gate lê como
 * regressão. `utils/servico-erp.js` já resolvia isso para o portão do ERP; esta é a mesma regra, para
 * qualquer leitura.
 *
 * ## O que ela NÃO faz
 *
 * - Não repete RESPOSTA ruim (HTTP 500, corpo inesperado): isso é veredito, e quem chama afirma.
 * - Não engole nada: erro que não é de rede sobe na hora; erro de rede sobe intacto depois da última
 *   tentativa.
 * - Não serve para escrita. Repetir um POST que chegou ao servidor e perdeu só a resposta duplicaria
 *   o registro — use apenas em chamadas de leitura.
 */

/** Mensagens que o Chromium dá quando a requisição morre no transporte, antes de haver resposta. */
export const FALHA_DE_REDE = /Failed to fetch|ERR_NETWORK_CHANGED|ERR_CONNECTION_(RESET|CLOSED|REFUSED)|ERR_INTERNET_DISCONNECTED/;

/**
 * Executa `chamada` e a repete quando ela falha POR REDE.
 *
 * @template T
 * @param {() => Promise<T>} chamada leitura sem efeito colateral, normalmente um `page.evaluate`
 * @param {{ tentativas?: number, rotulo?: string, espacamentoMs?: number }} [opcoes]
 * @returns {Promise<T>}
 */
export async function repetirSeFalhaDeRede(chamada, opcoes = {}) {
  const { tentativas = 3, rotulo = 'leitura na página', espacamentoMs = 2_000 } = opcoes;
  for (let tentativa = 1; ; tentativa += 1) {
    try {
      return await chamada();
    } catch (erro) {
      const motivo = erro instanceof Error ? erro.message : String(erro);
      if (!FALHA_DE_REDE.test(motivo) || tentativa >= tentativas) throw erro;
      console.warn(
        `[rede] ${rotulo} falhou por rede (${motivo.split('\n')[0]}); tentativa ${tentativa}/${tentativas}, repetindo.`,
      );
      // Espaçamento de retentativa de rede, não sincronização: dá tempo de a queda momentânea passar.
      await new Promise((resolver) => setTimeout(resolver, espacamentoMs * tentativa));
    }
  }
}
