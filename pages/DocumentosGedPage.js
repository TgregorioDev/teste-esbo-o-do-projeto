// @ts-check
import { expect } from '@playwright/test';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { DocumentosPage } from './DocumentosPage.js';
import { comExclusividade } from '../utils/exclusividade.js';

/**
 * Documentos / GED — ações que escrevem no ambiente (upload, aprovação, remoção/lixeira).
 *
 * Estende `DocumentosPage` (navegação somente-leitura, não editada aqui) em vez de duplicar
 * seus locators/métodos: `goto`, `expectCarregada`, `abrirPasta`, `voltarParaRaiz`,
 * `lerDescricoes` continuam vindo da classe-mãe.
 *
 * Descobertas de campo que moldam este Page Object:
 *
 * - **A conta lembra a última pasta navegada, no SERVIDOR, por usuário** (não por sessão/cookie
 *   — sobrevive a um login novo em contexto de navegador isolado). Um `goto()` simples pode
 *   aterrissar em qualquer pasta visitada por último por QUALQUER execução que tenha usado esta
 *   conta. Por isso todo teste começa com `irParaRaizGarantido()`, que força a Raiz pelo link do
 *   breadcrumb (sempre presente, independente da pasta atual) em vez de confiar no estado inicial.
 *
 * - **A grade pagina em 30 e a massa da pasta cresce a cada execução.** "Meus Documentos" já
 *   tem 50+ documentos `QA ...` publicados pelas execuções destrutivas anteriores, e a ordenação
 *   é por Descrição. Um documento recém-publicado **não** aparece necessariamente na página 1:
 *   depende da inicial que o faker sorteou. Nenhuma assertion sobre "o documento aparece/não
 *   aparece na pasta" pode olhar só a página corrente — use `irParaPaginaComDocumento`. Isto,
 *   e não a combinação de suítes que rodam juntas, era a causa de `CT-GED-02-H` reprovar em
 *   algumas execuções e passar em outras (a inicial muda a cada `FAKER_SEED`).
 *
 * - **A ordenação da grade também é lembrada por usuário no servidor.** Clicar num cabeçalho de
 *   coluna (`sidx=lastModifiedDate&sord=desc`, por exemplo) muda a ordem para TODAS as sessões
 *   da conta, inclusive em contexto de navegador novo — confirmado em campo. Nenhum teste desta
 *   suíte clica em cabeçalho; se algum passar a clicar, precisa restaurar a ordem (Descrição,
 *   ascendente) ao final, ou vai mexer na listagem de todo mundo.
 *
 * - **O modal de publicação (`Novo → Documento avançado`) pode abrir com um rascunho de outra
 *   execução já preenchido** — Descrição e a tabela "Arquivo" às vezes chegam com um arquivo de
 *   OUTRA sessão que ficou "em voo" (ex.: `rateio-invalido.xlsx` de uma suíte de Compras rodando
 *   em paralelo). Isto é estado de conta, não de navegador. `enviarDocumento` sempre limpa
 *   qualquer linha da tabela "Arquivo" que não seja o arquivo desta chamada, e sempre usa `.fill()`
 *   (que substitui, não concatena) na Descrição — nunca confia que os campos chegam vazios.
 *
 * - **"Meus Documentos" contém uma pasta virtual "Check-out"**, que lista documentos em
 *   check-out do usuário. Ela recusa upload direto ("Somente documentos que estão em check-out
 *   podem ser adicionados a esta pasta.") — não é uma pasta comum de destino.
 *
 * - **Check-out real depende de um cliente WebDAV nativo.** A ação "Editar conteúdo" do menu do
 *   documento (`ECM.navigation.editContent`) chama `documentPublisher/createTempFileWebdav` e em
 *   seguida tenta abrir uma URL `dav4:ItemUrl=...` (biblioteca `ITHitWebDAVClient.js`) — um
 *   protocolo customizado que só um cliente Office/WebDAV instalado no SO resolve. Em Chromium
 *   (headed ou headless) essa navegação não produz página, modal, nem chamada de checkout no
 *   servidor: a versão/tipo do documento não mudam e a pasta "Check-out" continua vazia depois.
 *   Por isso não há métodos de check-out/check-in aqui — ver relatório final da suíte.
 *
 * - **Aprovação é configurável no próprio upload**, na aba "Aprovação" do publicador — mas só em
 *   pastas com esse recurso habilitado (ex.: `Compras e Contratação > Parecer Técnico`; NÃO em
 *   `Meus Documentos`). O publicador nomeia um "Nível de aprovação" e busca o(s) aprovador(es)
 *   por nome/login num autocomplete — o próprio usuário da automação pode se autodesignar
 *   aprovador. A tarefa resultante aparece em Central de Tarefas, categoria "Documentos →
 *   Documentos a aprovar" (`a[href="#centralTasktoapprove"]`), com botões "Aprovar"/"Rejeitar".
 *
 * - **A Lixeira não é confiável por busca.** O campo "Buscar" (`Buscar por: Todos/Autor/
 *   Código/Conteúdo/Descrição/Publicador`) devolveu "Nenhum documento ou pasta encontrado" para
 *   um documento comprovadamente presente na lixeira (achado por paginação) — testado por
 *   Descrição e por Código exatos. A ordenação padrão também não é "mais recente primeiro"
 *   (itens de meses atrás aparecem antes de exclusões do dia). O caminho que funciona é
 *   paginar (`Mostrar 100 registros` + botão "»") até o checkbox `#cb-item-<id>` aparecer.
 *
 * - **A indexação da Lixeira NÃO é o problema que se suspeitava (medido em 25/08/2026).** A nota
 *   anterior dizia que um documento recém-removido levava mais de 5 minutos para aparecer na
 *   Lixeira e que `CT-GED-05-H` reprovar na restauração era o esperado. Remedido depois de
 *   corrigir a paginação da grade e o clique no paginador da Lixeira: o item removido apareceu e
 *   foi restaurado **dentro do orçamento de 90s** do `toPass` em **5 execuções seguidas**
 *   (3× `--repeat-each` com 4 workers + 2 execuções junto com fiscal/juridico/notificacoes),
 *   com o teste inteiro levando 64–84s. O que reprovava era nosso: (1) o documento publicado
 *   caía na página 2 da grade e a pré-condição não o via; (2) o clique em `button[data-nav-next]`
 *   acontecia sob o overlay do blockUI e morria em `intercepts pointer events` / `detached`.
 *   A busca textual da Lixeira continua não servindo — a varredura por paginação, sim.
 */
export class DocumentosGedPage extends DocumentosPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);

    this.modal = {
      titulo: page.getByRole('heading', { name: /^(Documento|Propriedades de:)/ }),
      descricao: page.locator('#ecm-documentPublisher-documentDesc'),
      inputArquivo: page.locator('#inputFile'),
      // jqGrid do publicador: mesmo padrão de tabela de cabeçalho/corpo separadas documentado
      // em `DocumentosPage` para a grade principal do ECM — um `<table>` só de cabeçalho
      // (rótulos "Arquivo"/"Principal"/"Anexo", sem `tbody` com linhas) e outro, `#ecm-
      // widgetpartupload-grid`, com o corpo real. Âncora direto pelo id do corpo.
      tabelaArquivos: page.locator('table#ecm-widgetpartupload-grid'),
      tabAprovacao: page.getByRole('link', { name: 'Aprovação', exact: true }),
      campoNivelAprovacao: page.getByPlaceholder('Nível 1'),
      botaoAdicionarNivel: page.getByRole('button', { name: 'Adicionar', exact: true }),
      botaoConfirmar: page.getByRole('button', { name: 'Confirmar', exact: true }),
      botaoFechar: page.getByRole('button', { name: 'Fechar', exact: true }),
    };

    this.lixeira = {
      // "Lixeira" não é um heading semântico (sem role acessível) — âncora pelo botão que só
      // existe nesta página.
      heading: page.getByRole('button', { name: 'Esvaziar lixeira', exact: true }),
      botaoProximaPagina: page.locator('button[data-nav-next]'),
    };
  }

  /**
   * Posiciona a grade na página em que o documento está — e NÃO afirma nada: quem chama faz a
   * assertion (para que a mensagem de falha continue sendo a do caso de teste).
   *
   * Por que existe (medido em 25/08/2026): a grade do ECM **pagina em 30 itens** e ordena por
   * Descrição. "Meus Documentos" já acumula 50+ documentos `QA ...` das execuções destrutivas,
   * então o documento recém-publicado cai na página 1 ou na 2 **conforme a inicial do nome
   * sorteado pelo faker** — foi exatamente isso que fez `CT-GED-02-H` reprovar de forma
   * aparentemente aleatória ("QA documento Sabonete ..." ficou depois de "QA documento Mouse ..."
   * e nunca esteve na página 1) e fez a pré-condição de `CT-GED-05-H` reprovar em outra execução.
   * Não é defeito do produto e não tem relação com quais outras suítes rodam junto: é a massa da
   * pasta crescendo a cada execução.
   *
   * Cada tentativa recarrega a pasta antes de varrer. O recarregamento não é cosmético: ao
   * publicar, o ECM dispara sozinho um `GET navigation/content/<pasta>?page=1` e, se esse
   * refresh chegar depois de a varredura ter avançado de página, a grade volta para a página 1
   * e a linha já encontrada vira "element was detached from the DOM" no clique seguinte
   * (medido: `excluirDocumento` morreu assim marcando um checkbox que estava visível).
   * Recarregar antes de varrer elimina qualquer refresh pendente.
   *
   * Para assertion NEGATIVA ("não deve estar lá") use `tentativas: 1`: não há o que esperar
   * aparecer, e a varredura só precisa cobrir todas as páginas uma vez.
   *
   * @param {string} descricao
   * @param {{ tentativas?: number, maxPaginas?: number }} [opcoes]
   */
  async irParaPaginaComDocumento(descricao, { tentativas = 4, maxPaginas = 20 } = {}) {
    for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
      // Recarrega SEMPRE: garante página 1, sem refresh pendente do ECM para chegar depois e
      // desfazer a paginação feita aqui.
      await this.recarregarPastaAtual();
      // 100 por página é o maior valor que o seletor oferece; com ele o paginador do jqGrid
      // (que é `<td>` e sofre com sobreposição de CSS) quase nunca precisa ser acionado.
      await this.alterarResultadosPorPagina(100);

      for (let pagina = 1; pagina <= maxPaginas; pagina++) {
        await this.aguardarGradeOciosa();
        if (await this.localizarLinha(descricao).count()) return;
        if (!(await this.temProximaPagina())) break;

        if (pagina === maxPaginas) {
          throw new Error(
            `A varredura da pasta parou em ${maxPaginas} páginas de 100 itens e ainda havia ` +
              `páginas para ver — higienize a massa "QA" da pasta antes de concluir qualquer ` +
              `coisa sobre "${descricao}".`,
          );
        }
        await this.irParaProximaPagina();
      }
    }
  }

  /**
   * Abre `Novo → Documento avançado`, o publicador de documento com upload de arquivo.
   */
  async abrirNovoDocumentoAvancado() {
    await this.acoes.novo.click();
    await this.page.getByRole('link', { name: 'Documento avançado', exact: true }).click();
    await this.modal.descricao.waitFor({ state: 'visible' });
  }

  /**
   * Remove, na tabela "Arquivo" do publicador, toda linha que NÃO seja o arquivo informado.
   * Existe porque o publicador pode abrir com um rascunho de outra execução já anexado.
   * @param {string} nomeArquivoQueDeveFicar
   */
  async limparArquivosResiduais(nomeArquivoQueDeveFicar) {
    const linhaIndesejada = () =>
      this.modal.tabelaArquivos
        .locator('tbody tr')
        .filter({ hasText: 'UPLOAD_FOLDER' })
        .filter({ hasNotText: nomeArquivoQueDeveFicar });

    for (let tentativa = 0; tentativa < 10; tentativa++) {
      const totalAntes = await linhaIndesejada().count();
      if (totalAntes === 0) return;
      const alvo = linhaIndesejada().first();
      // O ícone de remover é um `<i onclick="ECM.widgetpartupload.deleteUploadDocument(...)">`,
      // sem papel de botão/link acessível — âncora pelo atributo, não por role.
      await alvo.locator('[onclick*="deleteUploadDocument"]').first().click();
      await expect(linhaIndesejada()).toHaveCount(totalAntes - 1);
    }
    throw new Error('Não foi possível limpar as linhas residuais da tabela de arquivos do publicador.');
  }

  /**
   * Upload de documento simples: abre o publicador, envia o arquivo, garante que só ele fica
   * na tabela "Arquivo", preenche a Descrição e confirma.
   *
   * NÃO assume sucesso — quem chama decide o que verificar depois (aparece na grade? vira
   * pendência de aprovação? mensagem de bloqueio?).
   *
   * `antesDeConfirmar`, se informado, roda depois da Descrição preenchida e antes do clique em
   * Confirmar — é o gancho usado para configurar a aba "Aprovação" antes de publicar.
   *
   * `esperaPublicacao` (padrão `true`) mantém o lock até o publicador FECHAR. Só passe `false`
   * no caso em que o fechamento do publicador é parte do que está sendo testado (o cenário de
   * extensão bloqueada): exigir o fechamento ali transformaria em vermelho um eventual conserto
   * do produto, em que o modal legitimamente continuaria aberto exibindo o erro.
   *
   * @param {{ descricao: string, caminhoArquivo: string, antesDeConfirmar?: () => Promise<void>, esperaPublicacao?: boolean }} dados
   */
  async enviarDocumento({ descricao, caminhoArquivo, antesDeConfirmar, esperaPublicacao = true }) {
    // A área de upload temporária do GED é do USUÁRIO no servidor, não da aba — dois testes
    // publicando ao mesmo tempo com a mesma conta enxergam a tabela de arquivos um do outro, e
    // `limparArquivosResiduais` de um apaga o arquivo do outro. Ver `utils/exclusividade.js`.
    //
    // O lock precisa cobrir também a ESPERA pelo fim da publicação, não só o preenchimento do
    // formulário: o clique em Confirmar apenas dispara `POST documentPublisher/saveNewItem`, e
    // enquanto essa requisição está em voo a área de staging ainda está em uso. Soltar o lock
    // no clique (como estava) deixava o próximo worker limpar a tabela de arquivos por baixo de
    // uma publicação em andamento — medido: o publicador do primeiro ficava aberto para sempre
    // ("o publicador de documento não fechou") numa repetição de `CT-GED-04-H` com 4 workers.
    return comExclusividade('fluig-upload-staging', async () => {
      await this.publicarDocumento({ descricao, caminhoArquivo, antesDeConfirmar });
      if (!esperaPublicacao) return;
      // 60s (e não os 30s padrão) porque a publicação com aprovação configurada grava mais e
      // porque o lock enfileira workers: é o prazo da OPERAÇÃO, não folga para esconder falha.
      await expect(
        this.modal.descricao,
        'o publicador de documento não fechou — a publicação não concluiu',
      ).toBeHidden({ timeout: 60_000 });
    });
  }

  /**
   * Seção crítica de `enviarDocumento`. Não chame direto: sem o lock, dois workers colidem na
   * área de staging compartilhada.
   * @param {{ descricao: string, caminhoArquivo: string, antesDeConfirmar?: () => Promise<void> }} dados
   */
  async publicarDocumento({ descricao, caminhoArquivo, antesDeConfirmar }) {
    await this.abrirNovoDocumentoAvancado();

    // NOME FÍSICO ÚNICO por chamada, mesma técnica de `FormularioSolicitacaoCompraPage
    // .anexarDocumentacaoPublica` — e pelo mesmo motivo: a área de staging é do USUÁRIO no
    // servidor e recebe arquivo de outras suítes. Medido em campo: uma execução com
    // `--repeat-each=3` encontrou na tabela do publicador uma linha
    // `QA-07406ce1-documento-valido.pdf` (resíduo do anexo de uma SC de Compras) ao lado da
    // linha `documento-valido.pdf` desta chamada; como o nome de uma é SUBSTRING do da outra,
    // o filtro por texto resolvia para DUAS linhas (`strict mode violation` no rádio
    // "Principal") e `limparArquivosResiduais` protegia o resíduo em vez de removê-lo. Com nome
    // único não há substring compartilhada: a linha desta chamada é inequívoca.
    const extensao = path.extname(caminhoArquivo);
    const nomeArquivo = `QA-${randomUUID().slice(0, 8)}-${path.basename(caminhoArquivo, extensao)}${extensao}`;

    await this.modal.inputArquivo.setInputFiles({
      name: nomeArquivo,
      mimeType: extensao.toLowerCase() === '.pdf' ? 'application/pdf' : 'application/octet-stream',
      buffer: await readFile(caminhoArquivo),
    });
    const linhaDoArquivo = this.modal.tabelaArquivos.locator('tbody tr', { hasText: nomeArquivo });
    await expect(linhaDoArquivo).toBeVisible();
    await this.limparArquivosResiduais(nomeArquivo);

    // Quando o publicador abre com um rascunho de outra sessão, esse rascunho fica marcado
    // como "Principal" e o arquivo desta chamada nasce como "Anexo" — mesmo depois de remover
    // a linha residual, o rádio "Principal" não se reatribui sozinho. Garante explicitamente
    // que o arquivo desta chamada é o principal (a publicação exige exatamente um).
    const radioPrincipal = linhaDoArquivo.locator('input[type="radio"]');
    if (!(await radioPrincipal.isChecked())) {
      await radioPrincipal.check();
    }

    await this.modal.descricao.fill(descricao);
    if (antesDeConfirmar) await antesDeConfirmar();
    await this.modal.botaoConfirmar.click();
  }

  /**
   * Na aba "Aprovação" do publicador (só disponível em pastas com o recurso habilitado):
   * cria um nível de aprovação e designa o próprio usuário logado como aprovador único.
   * @param {{ nomeNivel: string, loginAprovador: string }} dados
   */
  async configurarAprovacaoComResponsavel({ nomeNivel, loginAprovador }) {
    await this.modal.tabAprovacao.click();
    await this.modal.campoNivelAprovacao.waitFor({ state: 'visible' });
    await this.modal.campoNivelAprovacao.fill(nomeNivel);
    await this.modal.botaoAdicionarNivel.click();

    const buscaAprovador = this.page.locator('input[placeholder="Buscar"]').last();
    await buscaAprovador.waitFor({ state: 'visible' });
    await buscaAprovador.fill(loginAprovador);

    const sugestao = this.page
      .locator('.ui-autocomplete li, .ui-menu-item, [class*="suggest"]')
      .filter({ hasText: loginAprovador })
      .first();
    await expect(sugestao).toBeVisible();
    await sugestao.click();
  }

  /**
   * Localiza a linha da grade pela descrição exata do documento/pasta.
   * @param {string} descricao
   * @returns {import('@playwright/test').Locator}
   */
  localizarLinha(descricao) {
    return this.page.getByRole('row', { name: new RegExp(escapeRegExp(descricao)) });
  }

  /**
   * Central de Tarefas → categoria "Documentos a aprovar". A âncora existe na página mas fica
   * dentro de um painel que pode estar com `display` recolhido — por isso o clique é despachado
   * via JS (o handler é `data-change-tab-view`, delegado por jQuery; despachar o evento real
   * funciona independente do painel estar visualmente expandido).
   */
  async abrirDocumentosAAprovar() {
    await this.page.goto('/portal/p/1/pagecentraltask', { waitUntil: 'domcontentloaded' });
    const link = this.page.locator('a[href="#centralTasktoapprove"]').first();
    await link.waitFor({ state: 'attached' });
    await link.evaluate((el) => /** @type {HTMLElement} */ (el).click());
    // O texto "Documentos a aprovar" também existe (oculto) no rótulo da categoria na barra
    // lateral — não serve de confirmação. O sinal real de que a lista carregou é o próprio
    // botão de ação "Aprovar" de alguma tarefa aparecer na área principal.
    await expect(this.page.getByRole('button', { name: 'Aprovar', exact: true }).first()).toBeVisible();
  }

  /**
   * Na lista "Documentos a aprovar", localiza a tarefa pela descrição do documento e aprova.
   *
   * Duas características do ambiente exigem o desenho abaixo:
   *  1. A categoria "Documentos a aprovar" da Central de Tarefas mistura tipos de tarefa — em
   *     campo, ela trouxe majoritariamente cartões de "Solicitação de Compras" (Validação
   *     Orçamentária/do Gestor, Início) de outras suítes rodando em paralelo, cada um com seu
   *     próprio botão "Aprovar". Cartões de documento GED se distinguem por um botão de
   *     download com atributo `data-document-action="download-<id>"` — não usado aqui como
   *     seletor porque o id ainda não é conhecido neste ponto, mas confirma que os dois tipos
   *     convivem na mesma lista.
   *  2. A tarefa desta chamada, recém-criada, não aparece de imediato na lista — recarregar a
   *     mesma página já aberta não adianta (é a mesma resposta já carregada); é preciso reabrir
   *     a categoria para buscar dados novos do servidor. Por isso a busca roda dentro de
   *     `toPass`, chamando `abrirDocumentosAAprovar()` de novo a cada tentativa.
   *
   * O card da tarefa é achado subindo do texto da descrição até o ancestral mais próximo que
   * também contém o botão "Aprovar" — necessário porque um seletor por texto solto resolveria
   * para o `<body>` inteiro.
   * @param {string} descricaoDocumento
   */
  async aprovarDocumento(descricaoDocumento) {
    const descElemento = this.page.getByText(descricaoDocumento, { exact: true });
    const cartao = descElemento.locator('xpath=ancestor::*[.//button[normalize-space()="Aprovar"]][1]');
    const modalAprovacao = this.page.getByRole('heading', { name: 'Aprovar documento', exact: true });

    // Uma tentativa = reabrir a categoria (é o que traz dado novo do servidor) + achar o cartão
    // + clicar + confirmar que o modal abriu. Achar o cartão numa tentativa e clicar nele em
    // outra não funciona: a lista se re-renderiza sozinha e o cartão inteiro é trocado por
    // baixo do clique (medido: `element was detached from the DOM, retrying` até estourar o
    // timeout, e também o botão "Aprovar" sumindo depois da descrição já ter sido vista). A
    // condição de parada é o modal de aprovação ter aberto — nunca um clique com `force`, que
    // só provaria que o handler existe.
    await expect(async () => {
      await this.abrirDocumentosAAprovar();
      await expect(descElemento).toBeVisible({ timeout: 5_000 });
      await cartao.getByRole('button', { name: 'Aprovar', exact: true }).click({ timeout: 10_000 });
      await expect(modalAprovacao).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 90_000, intervals: [3_000, 5_000, 8_000] });

    await this.page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(this.page.getByText('Documento aprovado com sucesso', { exact: false })).toBeVisible();
  }

  /**
   * Seleciona o documento pela descrição na grade atual e remove (envia para a lixeira) pela
   * barra de ações, confirmando o modal "Remover documento".
   * @param {string} descricao
   * @returns {Promise<string>} o `documentId` (atributo `id` da linha) do documento removido
   */
  async excluirDocumento(descricao) {
    const linha = this.localizarLinha(descricao);
    const documentId = await linha.getAttribute('id');
    if (!documentId) throw new Error(`Não foi possível ler o documentId da linha de "${descricao}".`);

    await this.aguardarGradeOciosa();
    await linha.locator('input[type="checkbox"]').check();
    await this.acoes.remover.click();

    await expect(this.page.getByRole('heading', { name: 'Remover documento', exact: true })).toBeVisible();
    await this.page.getByRole('button', { name: 'Remover', exact: true }).click();

    await expect(this.localizarLinha(descricao)).toHaveCount(0);
    return documentId;
  }

  /**
   * A Lixeira cobre a lista com o overlay do jQuery blockUI (`div.blockUI.blockOverlay`) a cada
   * troca de página. Clicar durante o overlay é o que produzia, em campo,
   * `locator.click: Timeout 45000ms ... <div class="blockUI blockOverlay"> intercepts pointer
   * events` seguido de `element was detached from the DOM` — a página trocava por baixo do
   * clique. Esperar o overlay sair é condição observável, não espera cega.
   */
  async aguardarLixeiraOciosa() {
    await expect(this.page.locator('div.blockUI.blockOverlay')).toHaveCount(0);
  }

  /** Navega para a Lixeira e confirma que carregou. */
  async gotoLixeira() {
    await this.page.goto('/portal/p/1/pagerecyclebin', { waitUntil: 'domcontentloaded' });
    await expect(this.lixeira.heading).toBeVisible();
  }

  /**
   * Amplia para 100 registros por página, se o seletor estiver disponível — reduz o número de
   * páginas a percorrer na busca por paginação.
   */
  async ampliarPaginaDaLixeira() {
    const seletor = this.page.getByRole('button', { name: 'Mostrar 30 registros', exact: true });
    if (await seletor.count()) {
      await seletor.click();
      const opcao100 = this.page.getByText('Mostrar 100 registros', { exact: true });
      await opcao100.click();
      await expect(seletor).toHaveCount(0);
    }
  }

  /**
   * Localiza, por paginação, a linha do documento removido (pelo `documentId`) na Lixeira, e
   * restaura.
   *
   * Duas características do ambiente exigem o desenho abaixo (evidência no relatório da
   * suíte):
   *  1. A busca textual da Lixeira (por Descrição, Código ou qualquer outro campo) não
   *     encontra um item comprovadamente presente — não é usada aqui.
   *  2. Um documento recém-removido pode não aparecer na PRIMEIRA leitura da listagem — daí a
   *     varredura por páginas rodar dentro de `toPass`, que a repete recarregando a Lixeira do
   *     zero a cada tentativa (condição observável, nunca `waitForTimeout`). O orçamento de 90s
   *     é suficiente: remedido em 25/08/2026, 5 execuções seguidas encontraram e restauraram o
   *     item dentro dele. A suspeita anterior de "indexação de vários minutos" não se confirmou
   *     — o que reprovava era o clique no paginador sob o overlay do blockUI (ver
   *     `aguardarLixeiraOciosa`) e a página errada da grade do ECM na pré-condição do teste.
   * @param {string} documentId
   * @param {{ maxPaginas?: number }} [opcoes]
   */
  async restaurarDaLixeira(documentId, { maxPaginas = 30 } = {}) {
    const checkbox = this.page.locator(`#cb-item-${documentId}`);

    await expect(async () => {
      await this.gotoLixeira();
      await this.ampliarPaginaDaLixeira();

      for (let pagina = 1; pagina <= maxPaginas; pagina++) {
        await this.aguardarLixeiraOciosa();
        if (await checkbox.count()) break;
        const proxima = this.lixeira.botaoProximaPagina;
        // Aqui o desabilitado é o atributo `disabled` de verdade (diferente do paginador
        // jqGrid da grade de navegação, que usa classe CSS) — `isDisabled()` responde certo.
        if (await proxima.isDisabled()) break;
        const resposta = this.page.waitForResponse((r) =>
          r.url().includes('/ecm/api/rest/ecm/recycleBin/getRecycledDocuments'),
        );
        await proxima.click();
        await resposta;
      }

      expect(
        await checkbox.count(),
        `documento ${documentId} ainda não apareceu na Lixeira (varredura de até ${maxPaginas} páginas)`,
      ).toBeGreaterThan(0);
    }).toPass({ timeout: 90_000, intervals: [5_000, 10_000, 15_000, 20_000] });

    const linha = checkbox.locator('xpath=ancestor::tr[1]');
    await linha.locator('[title="Restaurar Documento"]').click();

    const botaoConfirmarRestauro = this.page.getByRole('button', { name: /^(Restaurar|Confirmar)$/ });
    if (await botaoConfirmarRestauro.count()) {
      await botaoConfirmarRestauro.first().click();
    }
  }
}

/**
 * @param {string} texto
 * @returns {string}
 */
function escapeRegExp(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
