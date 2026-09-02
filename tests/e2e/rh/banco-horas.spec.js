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
      // Defeito U-02, em aberto. Este teste está escrito contra o comportamento ESPERADO:
      // uma falha de configuração de servidor (parâmetro não informado) é um problema de
      // administração do ambiente e não deveria ser jogada na tela do usuário final como
      // um alert() nativo do navegador. Hoje o widget faz exatamente isso, então este
      // teste REPROVA — de propósito. Ajustá-lo para passar documentaria o defeito como
      // se fosse comportamento correto.
      //
      // Detalhe técnico que decide o teste: o Playwright dispensa diálogos automaticamente.
      // Só é possível observar o alert() registrando `page.on('dialog', ...)` ANTES da
      // navegação — é o que `gotoCapturandoAlertaNativo()` faz.
      const bancoHorasPage = new BancoHorasPage(page);
      const dialogosObservados = await bancoHorasPage.gotoCapturandoAlertaNativo();

      // ⚠️ Esperar a inicialização TERMINAR antes de ler o array.
      //
      // `goto` resolve em `domcontentloaded`, e o `alert()` de U-02 é disparado pela
      // inicialização do widget, depois disso. `expect(array).toEqual([])` é um instantâneo
      // síncrono, sem polling: lido cedo, o array está vazio e o teste — que existe para
      // REPROVAR contra U-02 — fica verde sem ter observado nada.
      //
      // A sequência medida é: `alert()` nativo → modal SweetAlert2 "Ops!". Esperar por
      // qualquer um dos dois é esperar o fim da inicialização, e aí a leitura tem sentido.
      await expect
        .poll(
          async () =>
            dialogosObservados.length > 0 ||
            (await bancoHorasPage.tituloAvisoProtheusOffline.isVisible().catch(() => false)),
          {
            timeout: 30_000,
            message:
              'o widget de Banco de Horas não deu sinal de inicialização em 30s: nenhum ' +
              'alert() nativo e nenhum modal "Ops!". Sem um dos dois não há veredito sobre ' +
              'U-02 — a tela pode nem ter carregado.',
          },
        )
        .toBe(true);

      expect(
        dialogosObservados,
        'o widget não deveria expor erro de configuração de servidor ao usuário final via alert() nativo — ver defeito U-02',
      ).toEqual([]);
    },
  );

  test(
    'CT-BH-01-S2 — informa a indisponibilidade de integração com o Protheus ao usuário',
    async ({ page }) => {
      // Achado separado do defeito de parâmetros (U-02): mesmo com o alert() nativo
      // dispensado, a página segue exibindo que a base do Protheus está offline. É uma
      // indisponibilidade de INTEGRAÇÃO, distinta da falha de configuração do servidor —
      // por isso tem assertion própria, e não é apenas uma consequência do outro caso.
      const bancoHorasPage = new BancoHorasPage(page);
      await bancoHorasPage.goto();

      const semAviso =
        'o Banco de Horas deveria informar ao usuário que a integração com o Protheus está ' +
        'indisponível, e não apenas ficar sem dados. Nenhum aviso apareceu — ou a integração ' +
        'voltou (e aí este caso perdeu a pré-condição) ou a tela deixou de avisar';
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
