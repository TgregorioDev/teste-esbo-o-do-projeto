// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { PERSONAS } from '../../../config/personas.js';
import { TITULO_HOME } from '../../../config/ambiente.js';

/**
 * Personas — cada perfil abre a plataforma com a PRÓPRIA conta (etapa 5 de
 * `docs/plano-de-evolucao-2026-09-11.md`).
 *
 * Um teste por persona de `config/personas.js`. Hoje só `compras` (a conta atual) tem credencial: as
 * demais falham como PRÉ-CONDIÇÃO dizendo a variável que falta e o pedido que a destrava (E2, E4). No
 * dia em que a conta chegar, o teste dela passa a provar que a sessão é da pessoa certa — antes de
 * qualquer caso do backlog depender disso.
 *
 * ## O oráculo de identidade
 *
 * O título da Home prova que HÁ sessão; não prova DE QUEM. `GET /api/public/2.0/users/getCurrent`
 * devolve o usuário da sessão (medido em 11/09/2026: `content.login` = login da conta autenticada). Um
 * `storageState` trocado entre personas — o erro que este mecanismo mais facilmente produziria — passa
 * no título e reprova aqui.
 *
 * A comparação ignora caixa, e isso é medido, não folga: em 11/09/2026 a persona configurada como
 * `totvs-fs` autenticou e o servidor devolveu `TOTVS-FS` — o login do Fluig não distingue caixa. Sem a
 * normalização, uma credencial correta digitada em minúsculas reprovaria como sessão de outra pessoa.
 * Com login DIFERENTE a assertion reprova (provado na mesma data, antes da normalização).
 */
test.describe('Personas — cada perfil com a própria conta', () => {
  for (const [nome, definicao] of Object.entries(PERSONAS)) {
    test(`a persona "${nome}" abre a Home com a própria conta — ${definicao.descricao}`, async ({ persona }) => {
      const { page, usuario } = await persona(nome);

      await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
      await expect(page, `a sessão da persona "${nome}" deveria abrir a Home autenticada`).toHaveTitle(TITULO_HOME);

      const loginDaSessao = await page.evaluate(async () => {
        const resposta = await fetch('/api/public/2.0/users/getCurrent', { headers: { Accept: 'application/json' } });
        return resposta.ok ? String((await resposta.json())?.content?.login ?? '') : `HTTP ${resposta.status}`;
      });
      expect(loginDaSessao.toUpperCase(), `a sessão da persona "${nome}" deveria ser da conta ${usuario}`).toBe(
        usuario.toUpperCase(),
      );
    });
  }
});
