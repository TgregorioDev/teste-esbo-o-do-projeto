// @ts-check
import { expect } from '@playwright/test';
import { faltaPreCondicao } from '../utils/pre-condicao.js';

/** Rota de abertura/movimentação de processo por URL — igual a `FormularioProcessoPage`. */
const ROTA_WORKFLOW_VIEW = '/portal/p/1/pageworkflowview';

/**
 * Normaliza o rótulo de uma `<option>` para comparação/mensagem seguras — mesmo tratamento (e
 * mesmo motivo) de `normalizarRotuloOpcao` em `components/SolicitacaoCompraModal.js`: o HTML
 * servido pelo Fluig pode trazer o rótulo com `&nbsp;`/entidades, cujo espaço decodificado é
 * NBSP (U+00A0), não o espaço comum (U+0020) que um literal de teste usa.
 * @param {string} rotulo
 * @returns {string}
 */
function normalizarRotulo(rotulo) {
  return rotulo.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Formulários do SIGAJURI (`SIGAJURI_Consultivo`, `SIGAJURI_Contrato`, `SIGAJURI_Contencioso`,
 * `SIGAJURI_AprovaFU`), abertos por `/portal/p/1/pageworkflowview?processID=<processId>`.
 *
 * ## O que foi confirmado em campo antes de escrever esta classe
 *
 * O documento de casos supunha estes processos bloqueados por perfil. Medindo processo a
 * processo (navegação direta por URL, sessão autenticada normal do usuário de Compras):
 *
 * - **Nenhum** dos quatro processos SIGAJURI mostra o modal de bloqueio de permissão
 *   (heading "Erro" + "não possui permissão para iniciar") — todos abrem o formulário
 *   (heading "Início", abas Formulário/Informações/Histórico/Anexos, botão Enviar). O
 *   bloqueio por perfil documentado em `docs/mapa-do-ambiente.md` para RDFC e alguns
 *   processos de RH **não se repete aqui**.
 * - `SIGAJURI_Consultivo` e `SIGAJURI_Contrato` MONTAM o formulário, mas os campos
 *   alimentados pelo serviço externo "SIGAJURI" (`Tipo Consulta`/`Filial` no Consultivo;
 *   `Filial`/`Área Solicitante`/`Tipo Contrato` no Contrato) nascem com uma ÚNICA opção:
 *   o texto do erro do servidor —
 *   `com.totvs.technology.foundation.dataservice.exception.ServiceNotFoundException:
 *   Não foi possível encontrar o serviço ' SIGAJURI '` — como valor do `<option>`. O
 *   HTML é renderizado no SERVIDOR (a mesma técnica documentada para o Fluig em geral:
 *   `<select dataset="dsXxx">`), então isto está no HTML de resposta de
 *   `GET /webdesk/streamcontrol/<formId>/...`, não numa chamada de API interceptável por
 *   nome de dataset.
 * - `SIGAJURI_Contencioso` é um formulário DIFERENTE e funcional: `UF`, `Responsável pela
 *   Demanda` e `Tipo da Consulta` vêm populados com valores reais (nenhum
 *   `ServiceNotFoundException`). Submeter com dados válidos (`Enviar`) responde
 *   `200 OK` em `POST /ecm/api/rest/ecm/workflowView/send` com `processInstanceId`
 *   preenchido — processo criado de verdade.
 * - `SIGAJURI_AprovaFU` monta o formulário, mas TODOS os campos visíveis são
 *   `readonly` (o campo real fica num `input hidden` por trás, ex.: `sDescAtividade` vs.
 *   `_sDescAtividade`) — o mesmo padrão já documentado para "Delegação de Fiscais": processo
 *   feito para ser disparado por um pai (o "Responder Solicitação" do Consultivo), não para
 *   ser iniciado sozinho por URL.
 *
 * ## Como o Fluig entrega o erro de `Enviar`
 *
 * O clique em Enviar dispara `POST /ecm/api/rest/ecm/workflowView/send`. Quando o servidor
 * rejeita, a resposta some da malha comum (`ecm/api` **não** está na lista de leitura de
 * `utils/guarda-criacao.js` por acaso — é justamente uma rota de escrita) e a tela abre um
 * `role=dialog` com heading "Erro" e a mensagem de negócio — nunca um `alert()` nativo.
 */
export class SigajuriPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.frame = page.frameLocator('iframe[title="Visualizador"]');

    this.headingInicio = page.getByRole('heading', { name: 'Início', exact: true });
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar', exact: true });

    // Modal de bloqueio de permissão — igual ao de `FormularioProcessoPage`, reaproveitado
    // aqui só para a assertion negativa "não é isto que bloqueia" (ver spec de acesso público).
    this.dialogPermissao = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Erro', exact: true }) });

    // Modal de ERRO DE NEGÓCIO ao enviar (mesmo componente visual, contexto diferente).
    this.dialogErroEnvio = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Erro', exact: true }) });
    this.botaoOkErro = this.dialogErroEnvio.getByRole('button', { name: 'Ok, entendi', exact: true });

    // --- Consultivo (SIGAJURI_Consultivo) ---
    this.campoSolicitacaoConsultivo = this.frame.getByRole('textbox', { name: 'Solicitação', exact: true });
    this.campoObservacoesConsultivo = this.frame.getByRole('textbox', { name: 'Observações', exact: true });
    this.comboTipoConsulta = this.frame.getByRole('combobox', { name: 'Tipo Consulta' });
    this.comboFilialConsultivo = this.frame.getByRole('combobox', { name: 'Filial' });
    this.comboAreaSolicitanteConsultivo = this.frame.getByRole('combobox', { name: 'Área Solicitante' });

    // --- Contrato (SIGAJURI_Contrato) ---
    this.comboFilialContrato = this.frame.getByRole('combobox', { name: 'Filial' });
    this.comboAreaSolicitanteContrato = this.frame.getByRole('combobox', { name: 'Área Solicitante' });
    this.comboTipoContrato = this.frame.getByRole('combobox', { name: 'Tipo Contrato' });
    this.campoSolicitacaoContrato = this.frame.getByRole('textbox', { name: 'Solicitação', exact: true });

    // --- Contencioso (SIGAJURI_Contencioso) ---
    this.comboUF = this.frame.getByLabel('UF', { exact: true });
    this.comboResponsavelDemanda = this.frame.getByLabel('Responsável pela Demanda.', { exact: true });
    this.comboTipoConsultaContencioso = this.frame.getByLabel('Tipo da Consulta.', { exact: true });
    this.campoTituloMensagem = this.frame.getByRole('textbox', { name: 'Titulo Mensagem', exact: true });
    this.campoDescricaoContencioso = this.frame.getByRole('textbox', { name: 'Descrição', exact: true });
    this.grupoEnvolvidos = this.frame.getByRole('group', { name: 'Envolvidos:', exact: true });
    // Controle real para registrar uma parte (`<input type="button" value="Novo Envolvido"
    // onclick="wdkAddChild('tabEnvolvidos')">`) — a tabela em si só tem uma linha-modelo
    // oculta (`display:none`) usada como template pelo widget; contar `input`/`select` dentro
    // do grupo sem excluir essa linha conta campos que ninguém consegue ver nem preencher.
    this.botaoNovoEnvolvido = this.grupoEnvolvidos.getByRole('button', { name: 'Novo Envolvido', exact: true });
    this.checkboxNaoPossuiProcesso = this.frame.getByRole('checkbox', { name: 'Não possui processo.', exact: true });
  }

  /** @param {string} processId */
  async goto(processId) {
    await this.page.goto(`${ROTA_WORKFLOW_VIEW}?processID=${encodeURIComponent(processId)}`, {
      waitUntil: 'domcontentloaded',
    });
  }

  /** Pré-condição: o formulário abriu (independente de estar funcional por dentro). */
  async expectFormularioAberto() {
    await this.headingInicio.waitFor({ state: 'visible' });
  }

  /**
   * Opções REAIS de um combo `<select>`, como `{ valor, rotulo }` — nunca hardcoded. `rotulo`
   * já vem normalizado (ver `normalizarRotulo`). Não filtra `disabled`: ao contrário do combo
   * "Tipo de Solicitação" de Compras, aqui o cenário que importa é justamente o inverso —
   * `Tipo Consulta`/`Filial` do Consultivo nascem com uma ÚNICA opção HABILITADA (o texto do
   * `ServiceNotFoundException`), então excluir `disabled` não ajudaria a distinguir nada.
   * @param {import('@playwright/test').Locator} combo
   * @returns {Promise<Array<{ valor: string, rotulo: string }>>}
   */
  async listarOpcoesReais(combo) {
    const opcoes = await combo.locator('option').evaluateAll((els) =>
      els.map((el) => ({
        valor: /** @type {HTMLOptionElement} */ (el).value,
        rotulo: el.textContent ?? '',
      })),
    );
    return opcoes.map(({ valor, rotulo }) => ({ valor, rotulo: normalizarRotulo(rotulo) }));
  }

  /**
   * Seleciona `valorOuRotulo` num combo só depois de confirmar que ele existe de verdade entre
   * as opções que o AMBIENTE oferece agora — nunca um `selectOption` cego com um literal da
   * factory. Mesmo princípio e mesma motivação de `SolicitacaoCompraModal.selecionarTipo`: um
   * valor de cadastro (UF, Responsável pela Demanda, Tipo da Consulta, Área Solicitante) que
   * deixar de existir no SIGAJURI deve produzir uma falha de PRÉ-CONDIÇÃO legível — nomeando o
   * que existe — em vez de um erro de locator opaco ou, pior, um `selectOption` que combina por
   * acidente com outra opção.
   * @param {import('@playwright/test').Locator} combo
   * @param {string} valorOuRotulo o que o CASO declara precisar (rótulo ou value do cadastro)
   * @param {string} nomeCampo só para a mensagem de erro (ex.: "Responsável pela Demanda")
   * @returns {Promise<void>}
   */
  async selecionarComPreCondicao(combo, valorOuRotulo, nomeCampo) {
    const disponiveis = await this.listarOpcoesReais(combo);
    const alvo = normalizarRotulo(valorOuRotulo);

    const existe = disponiveis.some((op) => op.valor === valorOuRotulo || op.rotulo === alvo);

    if (!existe) {
      faltaPreCondicao(
        `o caso precisa de "${valorOuRotulo}" no combo "${nomeCampo}", mas ` +
          `o ambiente hoje só oferece: ${disponiveis.map((o) => o.rotulo).join(', ') || '(nenhuma opção)'}. ` +
          'Não é para ser contornado trocando o valor pedido no teste — é sinal de que o cadastro ' +
          'do SIGAJURI mudou; confirme com o dono do ambiente antes de ajustar o teste.',
      );
    }

    await combo.selectOption(valorOuRotulo);
  }

  /**
   * Preenche os campos de texto livre do Consultivo. A `Área Solicitante` é a única combo
   * populada de verdade neste formulário — as demais (`Tipo Consulta`, `Filial`) carregam
   * só o texto do `ServiceNotFoundException`, então NÃO são preenchidas aqui: forçar um
   * `selectOption` nelas lançaria erro de locator, o que confundiria a causa raiz.
   *
   * @param {{ solicitacao: string, observacoes?: string, areaSolicitante?: string }} dados
   */
  async preencherConsultivo(dados) {
    await this.campoSolicitacaoConsultivo.fill(dados.solicitacao);
    if (dados.observacoes) await this.campoObservacoesConsultivo.fill(dados.observacoes);
    if (dados.areaSolicitante) {
      await this.selecionarComPreCondicao(
        this.comboAreaSolicitanteConsultivo,
        dados.areaSolicitante,
        'Área Solicitante',
      );
    }
  }

  /**
   * @param {{ uf: string, responsavel: string, tipoConsulta: string, titulo: string, descricao: string }} dados
   */
  async preencherContencioso(dados) {
    await this.selecionarComPreCondicao(this.comboUF, dados.uf, 'UF');
    await this.selecionarComPreCondicao(this.comboResponsavelDemanda, dados.responsavel, 'Responsável pela Demanda');
    await this.selecionarComPreCondicao(this.comboTipoConsultaContencioso, dados.tipoConsulta, 'Tipo da Consulta');
    await this.campoTituloMensagem.fill(dados.titulo);
    await this.campoDescricaoContencioso.fill(dados.descricao);
  }

  /**
   * Clica Enviar e devolve a resposta de `POST .../workflowView/send` — o endpoint real de
   * escrita destes formulários (equivalente jurídico do `/wf_solicitacao_compras/start` do
   * Portal de Contratos, documentado em `utils/captura-payload.js`).
   *
   * @returns {Promise<import('@playwright/test').Response>}
   */
  async enviarECapturarResposta() {
    const respostaPromise = this.page.waitForResponse(
      (r) => r.url().includes('/ecm/api/rest/ecm/workflowView/send') && r.request().method() === 'POST',
    );
    await this.botaoEnviar.click();
    return respostaPromise;
  }
}
