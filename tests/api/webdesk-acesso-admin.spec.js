// @ts-check
import { test, expect } from '../../fixtures/fixtures.js';

/**
 * CT-SEG-05-S1 — acesso administrativo negado a usuário sem perfil admin.
 *
 * O usuário da automação tem perfil Compras/Contratos, sem privilégio administrativo.
 * `/webdesk` é a área administrativa clássica do Fluig; confirmado em campo que o acesso
 * é corretamente negado com HTTP 403 e um corpo JSON estável. Este é o comportamento
 * ESPERADO — o teste deve PASSAR, documentando o controle de acesso funcionando.
 */
test.describe('Controle de acesso administrativo', () => {
  test('deve negar acesso a /webdesk para usuário sem perfil admin', async ({ request }) => {
    const resposta = await request.get('/webdesk', { failOnStatusCode: false });

    expect(resposta.status()).toBe(403);
    expect(await resposta.json()).toEqual({
      code: 'Internal Server Error',
      success: false,
      message: 'Forbidden',
    });
  });
});
