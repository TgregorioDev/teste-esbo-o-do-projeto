// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';

/**
 * Deep-link / refresh de rota SPA — caso CT-PLT-04-S1.
 *
 * DEFEITO CONFIRMADO EM CAMPO — U-01 (docs/mapa-do-ambiente.md e README.md): acessar estas
 * rotas diretamente pela URL (deep-link ou F5) NÃO abre a página esperada — a plataforma
 * redireciona para `/portal/p/1/errorPage/404`, heading "Recurso não foi encontrado.".
 *
 * Este teste está escrito contra o comportamento ESPERADO (a rota deve abrir a página, não
 * um 404) e REPROVA de propósito até o defeito ser corrigido. Não ajuste a assertion para
 * acomodar o 404 — isso documentaria o defeito como se fosse regra do produto.
 */
test.describe('Deep-link de rota SPA (defeito U-01)', () => {
  const rotas = ['/portal/p/1/principalprocess', '/portal/p/1/gestao_ferias'];

  for (const rota of rotas) {
    test(`acessar ${rota} diretamente deve abrir a página, não redirecionar para 404`, async ({
      page,
    }) => {
      await page.goto(rota, { waitUntil: 'domcontentloaded' });

      await expect(page).not.toHaveURL(/errorPage\/404/);
      await expect(
        page.getByRole('heading', { name: 'Recurso não foi encontrado.', exact: true }),
      ).toHaveCount(0);
    });
  }
});
