// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { BancoHorasPage } from '../../../pages/BancoHorasPage.js';

/**
 * Portal de Autorização de Horas Extras — CT-BH-01-S2 ("autorizar horas acima do limite
 * deve bloquear").
 *
 * Suíte irmã de `tests/e2e/rh/banco-horas.spec.js` (não editada aqui — ver regra do
 * projeto). Aquela cobre a estrutura da tela e os dois avisos de carregamento (alerta
 * nativo de parâmetros — defeito U-02 — e indisponibilidade de integração com o
 * Protheus). Este arquivo investiga especificamente se autorizar horas ACIMA do limite é
 * alcançável e, se for, se o sistema bloqueia.
 *
 * Como o defeito U-02 documenta, o `alert()` nativo só é observável registrando
 * `page.on('dialog')` ANTES da navegação — por isso o teste usa
 * `gotoCapturandoAlertaNativo()`, que já faz isso.
 *
 * Achado desta investigação: mesmo fechando o aviso de "Protheus base offline" (ação
 * client-side, sem escrita — confirmado em `BancoHorasPage`) e clicando na aba
 * *Autorização*, a aba NUNCA termina de carregar. Confirmado em execuções isoladas e
 * repetidas: o indicador "Aguarde, processando..." permanece indefinidamente (observado
 * por mais de 15s corridos, sem qualquer nova requisição de rede após a chamada inicial de
 * dataset) e nenhum campo de autorização de horas chega a aparecer. É a mesma causa raiz
 * de U-02 — a integração com o Protheus está fora do ar — agora impedindo por completo a
 * aba onde a autorização (e o limite) seriam validados.
 *
 * O teste abaixo está escrito contra o comportamento ESPERADO — a aba deveria terminar de
 * carregar e apresentar um formulário onde autorizar acima do limite é bloqueado — e
 * REPROVA de propósito, no mesmo espírito dos demais testes vermelhos do README. Ajustá-lo
 * para passar documentaria a integração quebrada como se fosse comportamento correto.
 *
 * Nenhuma escrita ocorre: a aba nunca expõe um controle para autorizar, então não há botão
 * de confirmação a clicar — o cenário não precisa de `@destrutivo` nem de
 * `bloquearCriacaoDeSolicitacao`.
 */
test.describe('Portal de Autorização de Horas Extras — limite de autorização', () => {
  test('CT-BH-01-S2 — autorizar horas acima do limite deve bloquear', async ({ page }) => {
    const bancoHorasPage = new BancoHorasPage(page);

    // Registro do listener de diálogo ANTES do goto — defeito U-02: sem isso o alert()
    // nativo é dispensado sozinho pelo Playwright e o teste concluiria, erradamente, que
    // ele nunca apareceu.
    await bancoHorasPage.gotoCapturandoAlertaNativo();

    // Fecha o aviso de indisponibilidade do Protheus — ação client-side, sem escrita
    // (documentado em BancoHorasPage) — pré-condição para a aba Autorização ficar
    // acessível via getByRole (o SweetAlert2 marca o resto da página como aria-hidden
    // enquanto está aberto).
    await bancoHorasPage.tituloAvisoProtheusOffline.waitFor({ state: 'visible' });
    await bancoHorasPage.fecharAvisoProtheusOffline();

    await bancoHorasPage.abaAutorizacao.click();

    const indicadorCarregando = page.getByText('Aguarde, processando', { exact: false });

    // Confirma que o clique realmente disparou o carregamento — sem isso, a assertion
    // final poderia passar cedo demais (indicador nunca apareceu porque o clique não
    // funcionou), mascarando outro defeito como se fosse este.
    await expect(indicadorCarregando).toBeVisible();

    // DEFEITO: a aba nunca termina de carregar. Esta assertion está escrita contra o
    // comportamento ESPERADO (o indicador deveria desaparecer e dar lugar a um formulário
    // de autorização, onde o limite seria validado) e reprova de propósito.
    await expect(
      indicadorCarregando,
      'defeito: a aba Autorização do Banco de Horas nunca sai do estado "Aguarde, ' +
        'processando" — mesma causa raiz de U-02 (integração com o Protheus fora do ar). ' +
        'Nenhum campo de autorização de horas aparece, então "autorizar acima do limite ' +
        'deve bloquear" não é executável por esta rota.',
    ).toBeHidden();
  });
});
