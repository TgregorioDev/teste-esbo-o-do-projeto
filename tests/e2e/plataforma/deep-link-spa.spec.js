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
    test(`acessar ${rota} diretamente deve abrir a página, não redirecionar para 404 @bug`, async ({
      page,
    }) => {
      await page.goto(rota, { waitUntil: 'domcontentloaded' });

      // As mensagens abaixo existem para que o relatório de falhas se explique sozinho: sem
      // elas, este vermelho aparece como um `expect(page).not.toHaveURL failed` cru, e quem lê
      // não descobre nem qual rota nem qual defeito — precisa abrir o trace para entender.
      await expect(
        page,
        `defeito U-01: abrir ${rota} diretamente pela URL cai em errorPage/404. A rota existe e ` +
          'funciona quando alcançada pela navegação interna da SPA — o que quebra é o ' +
          'deep-link, então link salvo, favorito e compartilhamento de endereço não funcionam',
      ).not.toHaveURL(/errorPage\/404/);

      await expect(
        page.getByRole('heading', { name: 'Recurso não foi encontrado.', exact: true }),
        `defeito U-01: ${rota} renderizou a página de "Recurso não foi encontrado."`,
      ).toHaveCount(0);
    });
  }
});

/**
 * CT-PLT-04-S2 — deep-link além das duas rotas do U-01.
 *
 * O caso existe porque o U-01 foi registrado com DUAS rotas de amostra, e a correção provável
 * é no roteamento da SPA (não rota a rota). Um conjunto maior de rotas é o que distinguiria
 * "corrigido" de "remendado".
 *
 * ## O inventário — e o que a medição de 27/08/2026 mostrou
 *
 * As rotas abaixo foram levantadas navegando o portal, não deduzidas: são os `href` do menu
 * lateral (`Home`, `Buscar`, `Favoritos`, `Documentos`, `Processos`, `Central de Tarefas`,
 * `Social`, `Comunidades`, `Store`, `Lixeira`, `Configurações`), os atalhos do widget
 * "Meus Apps" (abas RH Conecta/Gestão/Compras/Contratos) e o link *Ver todas* do sino de
 * notificações.
 *
 * **Resultado medido: todas as rotas desta lista abrem por deep-link.** O U-01 NÃO é genérico
 * do roteador da SPA — atinge exatamente `/principalprocess` e `/gestao_ferias` (o describe
 * acima). Este teste é, portanto, o oráculo da fronteira do defeito: fica verde hoje e vira
 * vermelho no dia em que o U-01 se espalhar para mais uma rota, que é a regressão que ninguém
 * veria de outro jeito.
 *
 * ## Duas armadilhas medidas, que mudariam a lista se fossem ignoradas
 *
 * 1. **`/portal/p/1/notificationcenter` NÃO é rota deste portal.** A skill registra que ela
 *    renderiza "Recurso não foi encontrado.", e renderiza mesmo — mas nenhum ponto de
 *    navegação leva a ela. O sino do cabeçalho → *Ver todas* aponta para
 *    `/portal/p/1/globalalertview` ("Central de Notificações"), que **abre normalmente por
 *    deep-link** (medido). Afirmar que `notificationcenter` deveria abrir seria fabricar um
 *    defeito: a rota não existe, não está quebrada.
 * 2. **`/portal/p/1/rh_dependentes` e `/portal/p/1/rh_beneficios` também caem em 404**, mas os
 *    atalhos que apontam para elas na Home estão dentro de um bloco **comentado** no HTML
 *    (`<!-- ... -->`) — não são alcançáveis por nenhum usuário. Ficam fora da lista pelo mesmo
 *    critério: rota não navegável não é deep-link quebrado.
 *
 * Ambas seguem valendo como achado de higiene (rota morta referenciada no produto), e estão
 * registradas aqui em vez de num documento à parte porque é aqui que alguém vai reabrir o
 * assunto ao mexer no U-01.
 */
test.describe('Deep-link das demais rotas SPA navegáveis (CT-PLT-04-S2)', () => {
  /** Rotas alcançáveis pelo menu, pelos atalhos da Home e pelo sino — inventário de 27/08/2026. */
  const rotasNavegaveis = [
    '/portal/p/1/home',
    '/portal/p/1/principalfavorites',
    '/portal/p/1/ecmnavigation',
    '/portal/p/1/pagecentraltask',
    '/portal/p/1/pageprocessstart',
    '/portal/p/1/social',
    '/portal/p/1/communities',
    '/portal/p/1/mysolutions',
    '/portal/p/1/pagerecyclebin',
    '/portal/p/1/globalalertconfig',
    '/portal/p/1/globalalertview',
    '/portal/p/1/gestao_equipes',
    '/portal/p/1/declaracao-de-multiplos-vinculos',
    '/portal/p/1/PORTAL_AUTORIZACAO_HORAS_EXTRAS',
  ];

  for (const rota of rotasNavegaveis) {
    test(`CT-PLT-04-S2: acessar ${rota} diretamente pela URL deve abrir a página, não cair em 404`, async ({
      page,
    }) => {
      await page.goto(rota, { waitUntil: 'domcontentloaded' });

      await expect(
        page,
        `defeito U-01 se espalhou: ${rota} é alcançável pelo menu/atalhos do portal, mas abrir a ` +
          'URL diretamente (link salvo, favorito do navegador, F5) caiu em errorPage/404. Em ' +
          '27/08/2026 esta rota abria — só `/principalprocess` e `/gestao_ferias` falhavam',
      ).not.toHaveURL(/errorPage\/404/);

      await expect(
        page.getByRole('heading', { name: 'Recurso não foi encontrado.', exact: true }),
        `defeito U-01 se espalhou: ${rota} renderizou a página de "Recurso não foi encontrado."`,
      ).toHaveCount(0);
    });
  }
});
