// @ts-check
import { envObrigatoria } from './ambiente.js';

/**
 * Massa de contratos homologada no ambiente de teste.
 *
 * Os identificadores vêm de variáveis de ambiente de propósito: são dados do cliente e
 * não devem ser versionados. O papel de cada contrato está documentado no README.
 *
 * Estes NÃO são dados fictícios gerados por factory — são registros pré-existentes do
 * ambiente, usados como PRÉ-CONDIÇÃO de leitura. Dado fictício é o que a automação
 * PREENCHE (ver `factories/`), e esse continua vindo de faker.
 */

/** Contrato vigente, 2 itens — caminho feliz. */
export const CONTRATO_LIMPO = () => envObrigatoria('CONTRATO_LIMPO');

/** Contrato vigente, 4 itens — cenários de volume médio. */
export const CONTRATO_MEDIO = () => envObrigatoria('CONTRATO_MEDIO');

/** Contrato de serviço sem quantidade — exercita o fallback de quantidade do widget. */
export const CONTRATO_SERVICO = () => envObrigatoria('CONTRATO_SERVICO');

/**
 * Contrato com 177 itens.
 *
 * ⚠️ NÃO use em execução automatizada: congela o navegador (defeito D-03, reproduzido 2×).
 * Fica declarado para que o defeito tenha endereço, e para impedir que alguém o escolha
 * por engano como "contrato grande para testar performance".
 */
export const CONTRATO_VOLUMOSO_NAO_USAR = () => envObrigatoria('CONTRATO_VOLUMOSO');
