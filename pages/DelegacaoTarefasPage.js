// @ts-check

/**
 * `processId` do processo "Delegação de Tarefas".
 *
 * ⚠️ **Tem cedilha e til.** Sem `encodeURIComponent` na URL o Fluig responde como se o processo
 * não existisse, e a falha PARECE defeito de permissão/publicação quando é só codificação —
 * armadilha registrada na skill `cassi-fluig-master`.
 */
const PROCESSO_DELEGACAO_TAREFAS = 'wf_SubstituiçãoCargosFluig';

/**
 * Formulário "Delegação de Tarefas" (`wf_SubstituiçãoCargosFluig`, categoria **Compras**) —
 * CT-SUB-02-H.
 *
 * ## Não confundir com "Substituição de Cargos"
 *
 * São processos DIFERENTES, com nomes técnicos quase iguais:
 *
 * | processId | Nome exibido | Categoria | Coberto por |
 * |---|---|---|---|
 * | `wf_substituicaocargos` | Substituição de Cargos | RH | `tests/e2e/rh/substituicao-cargos.spec.js` (CT-SUB-01) |
 * | `wf_SubstituiçãoCargosFluig` | **Delegação de Tarefas** | **Compras** | este arquivo (CT-SUB-02-H) |
 *
 * Foi essa semelhança que deixou a Delegação de Tarefas passar despercebida: ela está no
 * catálogo `onlyCanStart`, abre, nunca foi iniciada por ninguém, e é o mecanismo que destrava o
 * comprador no ciclo de Compras.
 *
 * ## Medido em 27/08/2026
 *
 * Mesma casca dos demais processos; o formulário de negócio vive no iframe
 * `#workflowView-cardViewer` e traz, além da identificação `readonly` (Nº do Processo,
 * Solicitante, Email, Data e Hora), os quatro campos que definem uma delegação:
 *
 * - **Usuário Responsável Pela Atividade** (`zoomColleague`) — o delegante;
 * - **Usuário Delegado** (`zoomColleague2`) — quem recebe;
 * - **Data Inicial** / **Data Final** (`substitutoDtInicial` / `substitutoDtFinal`) — o período;
 * - **Observação** (`observacoes_delegacao`).
 *
 * Os dois primeiros são `<select class="zoom">` com campo de busca ao lado — o padrão de zoom do
 * Fluig. O `select` em si não é exposto na árvore de acessibilidade (`getByRole('combobox')`
 * não resolve), então o gancho estável é o `id`, como em `pages/FavoritosPage.js` para a estrela.
 *
 * ⚠️ Abrir o formulário é leitura, mas o botão *Enviar* SUBMETE de verdade — nenhum método
 * desta classe o aciona.
 */
export class DelegacaoTarefasPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.frame = page.frameLocator('#workflowView-cardViewer');

    // Casca do processo (página hospedeira, fora do iframe).
    this.headingInicio = page.getByRole('heading', { name: 'Início', exact: true });
    this.abaFormulario = page.getByRole('link', { name: /Formulário/ });
    this.abaInformacoes = page.getByRole('link', { name: /Informações/ });
    this.abaHistorico = page.getByRole('link', { name: /Histórico/ });
    this.abaAnexos = page.getByRole('link', { name: /Anexos/ });
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar', exact: true });
    this.dialogErro = page.getByRole('dialog');

    // Título do formulário de negócio — prova que o card carregou ESTE processo, e não o
    // homônimo de RH nem um template de outro processo.
    this.tituloFormulario = this.frame.getByRole('heading', {
      name: 'Delegação de Tarefas',
      exact: true,
    });
    this.secaoIdentificacao = this.frame.getByRole('heading', {
      name: 'Identificação do Processo / Solicitante',
      exact: true,
    });

    // Identificação, preenchida pela plataforma. Locators qualificados pela tag por consistência
    // com os demais formulários deste produto, onde o id do campo costuma ser repetido no
    // wrapper de validação.
    this.campoNumeroProcesso = this.frame.locator('input#numProcesso');
    this.campoSolicitante = this.frame.locator('input#usuarioSolicitante');
    this.campoEmailSolicitante = this.frame.locator('input#emailSolicitante');
    this.campoDataSolicitacao = this.frame.locator('input#dataSolicitacao');
    this.campoHoraSolicitacao = this.frame.locator('input#horaSolicitacao');

    // Os campos que fazem a delegação ser uma delegação.
    this.campoDelegante = this.frame.locator('select#zoomColleague');
    this.campoDelegado = this.frame.locator('select#zoomColleague2');
    this.campoDataInicial = this.frame.locator('input#substitutoDtInicial');
    this.campoDataFinal = this.frame.locator('input#substitutoDtFinal');
    this.campoObservacao = this.frame.locator('textarea#observacoes_delegacao');
  }

  async goto() {
    await this.page.goto(
      `/portal/p/1/pageworkflowview?processID=${encodeURIComponent(PROCESSO_DELEGACAO_TAREFAS)}`,
      { waitUntil: 'domcontentloaded' },
    );
  }

  /** Pré-condição: a casca do processo e o formulário dentro do iframe carregaram. */
  async expectAberto() {
    await this.headingInicio.waitFor({ state: 'visible' });
    await this.botaoEnviar.waitFor({ state: 'visible' });
    await this.tituloFormulario.waitFor({ state: 'visible' });
  }
}
