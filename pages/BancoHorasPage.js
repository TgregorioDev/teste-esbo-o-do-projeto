// @ts-check

/** Rota do Portal de Autorização de Horas Extras (Banco de Horas). */
export const ROTA_BANCO_HORAS = '/portal/p/1/PORTAL_AUTORIZACAO_HORAS_EXTRAS';

/**
 * Portal de Autorização de Horas Extras (`/portal/p/1/PORTAL_AUTORIZACAO_HORAS_EXTRAS`).
 *
 * Comportamento observado em campo, decisivo para os locators e para a ordem das
 * operações nesta classe (defeito **U-02**, em aberto):
 *
 * 1. Ao carregar, o widget dispara um `alert()` **nativo** do navegador:
 *    "Existem parâmetros não informado para esse servidor, informe o administrador".
 *    O Playwright dispensa diálogos automaticamente — para OBSERVAR o alerta é preciso
 *    registrar `page.on('dialog', ...)` **antes** de navegar. Sem isso o alerta some e
 *    conclui-se, erradamente, que ele não existe.
 * 2. Em seguida, um modal (SweetAlert2, renderizado na própria página — não é diálogo
 *    nativo) exibe "Ops! Não foi possivel se comunicar com o Protheus, base offline.".
 * 3. Enquanto esse modal está aberto, o SweetAlert2 marca os ancestrais do restante da
 *    página com `aria-hidden="true"`: as abas Dashboard/Organograma/Saldo/Autorização
 *    ficam presentes no DOM mas FORA da árvore de acessibilidade — `getByRole('link')`
 *    não as resolve enquanto o modal estiver aberto. Fechar o modal (clique em "OK") é
 *    uma ação puramente client-side (confirmado: nenhuma requisição de escrita é
 *    disparada) e revela a estrutura da tela por trás dele.
 */
export class BancoHorasPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // Aviso de indisponibilidade do Protheus (modal SweetAlert2, não é diálogo nativo)
    this.tituloAvisoProtheusOffline = page.getByRole('heading', { name: 'Ops!' });
    this.mensagemProtheusOffline = page.getByText(
      'Não foi possivel se comunicar com o Protheus, base offline.',
    );
    this.botaoOkAvisoProtheusOffline = page.getByRole('button', { name: 'OK', exact: true });

    // Estrutura da tela (abas), acessível apenas após o modal acima ser fechado
    this.abaDashboard = page.getByRole('link', { name: 'Dashboard', exact: true });
    this.abaOrganograma = page.getByRole('link', { name: 'Organograma', exact: true });
    this.abaSaldo = page.getByRole('link', { name: 'Saldo', exact: true });
    this.abaAutorizacao = page.getByRole('link', { name: 'Autorização', exact: true });
    this.tituloSubstitutos = page.getByRole('heading', { name: 'Substitutos' });
  }

  /**
   * Navega para o portal SEM interceptar o `alert()` nativo — reproduz exatamente o que
   * um usuário real veria: o Playwright dispensa o diálogo sozinho e a navegação segue.
   * Usar quando o caso não precisa observar o `alert()` em si (ex.: leitura de estrutura).
   */
  async goto() {
    await this.page.goto(ROTA_BANCO_HORAS, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Navega para o portal CAPTURANDO o(s) `alert()` nativo(s) disparado(s) no carregamento.
   * O listener é registrado antes do `goto` de propósito: é a única forma de observar o
   * diálogo em vez de deixá-lo ser dispensado silenciosamente pelo Playwright.
   * @returns {Promise<{ type: string, message: string }[]>} diálogos nativos observados
   */
  async gotoCapturandoAlertaNativo() {
    /** @type {{ type: string, message: string }[]} */
    const dialogosObservados = [];

    this.page.on('dialog', async (dialog) => {
      dialogosObservados.push({ type: dialog.type(), message: dialog.message() });
      await dialog.accept();
    });

    await this.page.goto(ROTA_BANCO_HORAS, { waitUntil: 'domcontentloaded' });
    return dialogosObservados;
  }

  /**
   * Fecha o modal de indisponibilidade do Protheus clicando em "OK".
   * Ação puramente client-side (verificado em campo: nenhuma requisição de escrita é
   * disparada) — é o que revela as abas da tela, que o SweetAlert2 esconde da árvore de
   * acessibilidade enquanto o modal está aberto.
   */
  async fecharAvisoProtheusOffline() {
    await this.botaoOkAvisoProtheusOffline.click();
    await this.tituloAvisoProtheusOffline.waitFor({ state: 'hidden' });
  }
}
