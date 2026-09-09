// @ts-check
import { test, expect } from '../../fixtures/fixtures.js';

/**
 * FSWTBC-1792 — os serviços SOAP em que o Portal do Fornecedor se apoia respondem.
 *
 * O chamado é sobre o envio da proposta pelo fornecedor. Esse envio depende de três serviços
 * SOAP da plataforma; sem eles, nenhuma proposta entra, e o sintoma que chega ao suporte é
 * "o fornecedor não consegue enviar" — sem indicação da causa.
 *
 * Enviar a proposta exige credencial de fornecedor (CNPJ + CPF + senha), que não existe nesta
 * rodada. Mas a PRÉ-CONDIÇÃO de todo o fluxo é verificável hoje, sem credencial nenhuma: os
 * três WSDL têm de responder. Medido em 08/09/2026: os três respondem 200 com `text/xml` e
 * `<definitions>`.
 *
 * O que este teste NÃO cobre, e fica declarado: o envio em si, e a validade da cotação.
 */

/** Serviços que o Portal do Fornecedor consome para iniciar processo, ler documento e cartão. */
const SERVICOS = ['ECMWorkflowEngineService', 'ECMDocumentService', 'ECMCardService'];

test.describe('Portal do Fornecedor — serviços SOAP (FSWTBC-1792)', () => {
  for (const servico of SERVICOS) {
    test(`o WSDL de ${servico} responde com um contrato válido`, async ({ request }) => {
      const resposta = await request.get(`/webdesk/${servico}?wsdl`);

      expect(
        resposta.status(),
        `${servico} respondeu ${resposta.status()} — o Portal do Fornecedor depende dele para ` +
          `iniciar processo/ler documento, e sem ele o envio de proposta falha sem causa visível`,
      ).toBe(200);

      const corpo = await resposta.text();

      // Um 200 que devolve HTML de login (sessão perdida) enganaria o teste. O que caracteriza
      // um WSDL é a declaração de definições — é isso que se afirma, não o status sozinho.
      expect(
        corpo,
        `${servico} respondeu 200 mas o corpo não é um WSDL (${corpo.length} bytes)`,
      ).toMatch(/<(\w+:)?definitions[\s>]/);

      test.info().annotations.push({
        type: 'wsdl',
        description: `${servico}: ${resposta.status()} · ${resposta.headers()['content-type']} · ${corpo.length} bytes`,
      });
    });
  }
});
