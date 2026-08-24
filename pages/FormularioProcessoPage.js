// @ts-check

/** Rota de abertura/movimentação de processo por URL. */
const ROTA_WORKFLOW_VIEW = '/portal/p/1/pageworkflowview';

/**
 * Escapa metacaracteres de regex — usado para montar a expressão da mensagem de bloqueio
 * a partir de valores runtime (usuário, processId), que não são literais de código.
 * @param {string} texto
 * @returns {string}
 */
function escapeRegExp(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tela genérica de início/movimentação de processo
 * (`/portal/p/1/pageworkflowview?processID=<processId>`).
 *
 * Reaproveitada por qualquer suíte que precise abrir um processo por URL: cobre tanto o
 * caminho PERMITIDO (formulário abre, título "Movimentar Solicitação", botão *Enviar*)
 * quanto o BLOQUEADO (modal `role=dialog` com heading *Erro* e a mensagem padrão de
 * permissão) — os dois confirmados em campo em `docs/mapa-do-ambiente.md`.
 *
 * ⚠️ Este ambiente é real e integrado ao Protheus: abrir o formulário é leitura, mas o
 * botão *Enviar* SUBMETE de verdade. Nenhum método desta classe clica em Enviar — quem
 * consumir esta Page Object nunca deve fazê-lo fora de um cenário `@destrutivo` explícito.
 */
export class FormularioProcessoPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.headingInicio = page.getByRole('heading', { name: 'Início', exact: true });
    // Sem `exact: true`: o ícone de cada aba (fonte de ícone) injeta um caractere extra no
    // nome acessível computado (ex.: `" Formulário"`, com um caractere antes do texto) —
    // confirmado via aria snapshot. Match exato quebraria por um detalhe de fonte de ícone
    // que não é o que o teste quer validar.
    this.abaFormulario = page.getByRole('link', { name: /Formulário/ });
    this.abaInformacoes = page.getByRole('link', { name: /Informações/ });
    this.abaHistorico = page.getByRole('link', { name: /Histórico/ });
    this.abaAnexos = page.getByRole('link', { name: /Anexos/ });
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar', exact: true });

    // Modal de bloqueio de permissão
    this.dialogErro = page.getByRole('dialog');
    this.headingErro = this.dialogErro.getByRole('heading', { name: 'Erro', exact: true });
    this.botaoOkEntendi = this.dialogErro.getByRole('button', {
      name: 'Ok, entendi',
      exact: true,
    });
  }

  /** @param {string} processId */
  async goto(processId) {
    await this.page.goto(`${ROTA_WORKFLOW_VIEW}?processID=${encodeURIComponent(processId)}`, {
      waitUntil: 'domcontentloaded',
    });
  }

  /** Pré-condição: processo PERMITIDO — o formulário abriu. */
  async expectFormularioAberto() {
    await this.headingInicio.waitFor({ state: 'visible' });
  }

  /** Pré-condição: processo BLOQUEADO — o modal de erro de permissão apareceu. */
  async expectBloqueado() {
    await this.headingErro.waitFor({ state: 'visible' });
  }

  /**
   * Mensagem de bloqueio esperada, construída a partir do usuário e do processo — nunca
   * hardcoded, porque o texto varia com quem roda a suíte e com o processo testado.
   * @param {string} usuario
   * @param {string} processId
   * @returns {RegExp}
   */
  mensagemBloqueio(usuario, processId) {
    return new RegExp(
      `Usuário ${escapeRegExp(usuario)} não possui permissão para iniciar solicitações do processo ${escapeRegExp(processId)}`,
    );
  }
}
