// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';

/**
 * CT-SEG-06-S1 — LGPD: envio de dados de navegação a serviço externo (achado U-11).
 *
 * Confirmado em campo: ao navegar pelo portal, a URL e o título da página navegada são
 * enviados a `google-analytics.com` (medição `G-F0FT6D1NQG`).
 *
 * Direção da assertion: a CASSI é uma operadora de saúde, e o portal aqui testado é usado
 * por colaboradores autenticados para acompanhar contratos e processos internos de
 * Compras — não é uma vitrine pública. Do ponto de vista de privacidade/LGPD, o esperado
 * é que a navegação autenticada NÃO seja repassada a um serviço de terceiro sem uma base
 * legal e finalidade claras para esse compartilhamento. Por isso o teste é escrito contra
 * "não deve enviar" e REPROVA hoje — é a forma de manter o achado U-11 visível na suíte.
 *
 * Só a CONTAGEM de requisições ao host é usada na assertion: a URL/título de página do
 * próprio portal não é dado pessoal de terceiro, mas mesmo assim evitamos anexar o
 * conteúdo das requisições ao relatório — só o número importa para provar o achado.
 */
test.describe('LGPD — telemetria enviada a serviço externo', () => {
  test('não deve enviar dados de navegação para o Google Analytics @bug', async ({
    page,
    contratosPage,
  }) => {
    let requisicoesAnalytics = 0;
    page.on('request', (requisicao) => {
      const host = new URL(requisicao.url()).hostname;
      if (/(^|\.)google-analytics\.com$/i.test(host)) {
        requisicoesAnalytics += 1;
      }
    });

    await contratosPage.goto();
    await contratosPage.expectCarregada();

    // Sincronização por estado real de rede (não é tempo arbitrário): a página termina
    // de assentar as requisições de telemetria disparadas após o carregamento.
    await page.waitForLoadState('networkidle');

    expect(
      requisicoesAnalytics,
      `${requisicoesAnalytics} requisição(ões) de navegação enviada(s) a google-analytics.com ` +
        '(medição G-F0FT6D1NQG). Ver achado U-11 / mapa-do-ambiente.md.',
    ).toBe(0);
  });
});
