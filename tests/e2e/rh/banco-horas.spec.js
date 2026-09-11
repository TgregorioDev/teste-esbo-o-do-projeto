// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { BancoHorasPage } from '../../../pages/BancoHorasPage.js';

/**
 * Portal de Autorização de Horas Extras (Banco de Horas) — casos CT-BH-01.
 *
 * Suíte somente-leitura: autorizar hora extra é escrita no ambiente do cliente e está
 * fora do escopo desta automação. Os casos cobrem apenas a estrutura da tela e os dois
 * avisos que o widget dispara ao carregar — o defeito de parâmetros de servidor (U-02) e,
 * separadamente, a indisponibilidade de integração com o Protheus.
 */
test.describe('Portal de Autorização de Horas Extras', () => {
  test(
    'CT-BH-01-S1 — não deve alertar o usuário final com erro de configuração de servidor ao abrir o Banco de Horas',
    async ({ page }) => {
      // Defeito U-02: uma falha de configuração de servidor não deveria ser jogada na tela do
      // usuário final como `alert()` NATIVO do navegador. No ambiente anterior o widget fazia
      // exatamente isso, e este teste era `@bug`.
      //
      // A tag saiu em 09/09/2026: no `caixade213859` nenhum diálogo nativo é disparado — o
      // aviso de indisponibilidade vem num modal estilizado ("Ops! Não foi possível se
      // comunicar com o Protheus, base offline"), que é justamente o que o chamado pedia.
      // Medido duas vezes seguidas. `@bug` verde é o sinal de que o defeito acabou, e a
      // resposta prevista é tirar a tag — não deixá-la mentindo.
      //
      // O que a assertion cobra segue igual, e é específica: diálogo NATIVO. A
      // indisponibilidade da integração, que continua acontecendo, tem assertion própria em
      // CT-BH-01-S2 logo abaixo — uma coisa não absorve a outra.
      //
      // Detalhe técnico que decide o teste: o Playwright dispensa diálogos automaticamente.
      // Só é possível observar o alert() registrando `page.on('dialog', ...)` ANTES da
      // navegação — é o que `gotoCapturandoAlertaNativo()` faz.
      const bancoHorasPage = new BancoHorasPage(page);
      const dialogosObservados = await bancoHorasPage.gotoCapturandoAlertaNativo();

      expect(
        dialogosObservados,
        'o widget não deveria expor erro de configuração de servidor ao usuário final via alert() nativo — ver defeito U-02',
      ).toEqual([]);
    },
  );

  test(
    'CT-BH-01-S2 — informa a indisponibilidade de integração com o Protheus ao usuário',
    async ({ page }) => {
      // Achado separado do defeito de parâmetros (U-02): a indisponibilidade de INTEGRAÇÃO,
      // distinta da falha de configuração do servidor — por isso tem assertion própria.
      //
      // ⚠️ Até 11/09/2026 este caso dependia de o Protheus estar FORA de verdade, e ficou vermelho
      // no dia em que a base voltou: a pré-condição era do ambiente, não da suíte. Agora a queda é
      // simulada na chamada que o widget usa (`simularProtheusFora`), e o caso mede o que promete —
      // o aviso — a qualquer momento, sem depender do estado do ERP.
      const bancoHorasPage = new BancoHorasPage(page);
      await bancoHorasPage.simularProtheusFora();
      await bancoHorasPage.goto();

      const semAviso =
        'com a integração com o Protheus falhando, o Banco de Horas deveria avisar que a base está ' +
        'offline, e não apenas ficar sem dados';
      await expect(bancoHorasPage.tituloAvisoProtheusOffline, semAviso).toBeVisible();
      await expect(bancoHorasPage.mensagemProtheusOffline, semAviso).toBeVisible();
    },
  );

  test(
    'CT-BH-01-H — carrega a estrutura do portal com as abas Dashboard, Organograma, Saldo e Autorização',
    async ({ page }) => {
      // Caminho feliz restrito a LEITURA: autorizar hora extra é escrita no ambiente real
      // do cliente e está fora do escopo desta automação (proibido pela regra do projeto).
      // O que se cobre aqui é a estrutura da tela: o portal carrega e apresenta as quatro
      // abas e a seção de Substitutos, apesar dos avisos de U-02 e da indisponibilidade
      // do Protheus (cobertos em CT-BH-01-S1 e CT-BH-01-S2).
      const bancoHorasPage = new BancoHorasPage(page);
      await bancoHorasPage.goto();

      // O modal de indisponibilidade do Protheus marca o restante da página como
      // aria-hidden enquanto está aberto — fechá-lo (ação client-side, sem escrita) é
      // pré-condição para as abas ficarem acessíveis via getByRole.
      await bancoHorasPage.tituloAvisoProtheusOffline.waitFor({ state: 'visible' });
      await bancoHorasPage.fecharAvisoProtheusOffline();

      await expect(bancoHorasPage.abaDashboard).toBeVisible();
      await expect(bancoHorasPage.abaOrganograma).toBeVisible();
      await expect(bancoHorasPage.abaSaldo).toBeVisible();
      await expect(bancoHorasPage.abaAutorizacao).toBeVisible();
      await expect(bancoHorasPage.tituloSubstitutos).toBeVisible();
    },
  );
});
