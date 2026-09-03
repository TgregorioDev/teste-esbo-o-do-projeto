// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { FormularioDelegacaoFiscaisPage } from '../../../pages/FormularioDelegacaoFiscaisPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * CT-DEL-01 — ciclo de Delegação de Fiscais de Contrato/Serviço (`wf_delegacaoFiscalContratoServico`).
 *
 * `tests/e2e/contratos/delegacao-fiscais.spec.js` (já existente, não duplicado aqui) cobre a
 * ABERTURA: a rota não é bloqueada por permissão e os campos de Identificação do
 * Contrato/Serviço e do Fiscal aparecem, ainda que somente leitura. Esta suíte vai além —
 * ela de fato aciona **Enviar**, algo que a spec de abertura nunca faz — e documenta com
 * evidência ao vivo por que o ciclo completo (delegar → substituto assume as tarefas) não é
 * alcançável por este usuário, através de nenhum caminho de navegação encontrado.
 *
 * ## Investigação em campo (nova nesta rodada)
 *
 * Clicar em **Enviar** no formulário aberto a frio (sem processo de origem) devolve, de
 * forma síncrona e ANTES de qualquer escrita em `process-management` (confirmado: zero
 * tentativas mesmo sem a guarda instalada), o erro:
 *
 * > Erro ao salvar dados de formulário: Solicitação só pode ser aberta através do portal de
 * > delegação de fiscais!
 *
 * Isso indica a existência de um "portal de delegação de fiscais" dedicado — no mesmo
 * espírito do Portal de Acompanhamento de Contratos, que é o caminho correto de abrir uma
 * Solicitação de Compra em vez do formulário `wf_solicitacao_compras` a frio. Esse portal,
 * porém, **não foi encontrado em nenhum ponto de navegação alcançável** por este usuário:
 * não há link em Home > Contratos (que só lista "Faturamento de Contratos"), não há botão
 * de delegação no modal "Informações do Contrato" do Portal de Acompanhamento de Contratos,
 * e o catálogo de processos (`/portal/p/1/pageprocessstart`) lista o próprio
 * "Delegação de Fiscais de Contrato/Serviço" com **"Último iniciado: Nunca"** — evidência de
 * que a lacuna não é específica desta automação.
 *
 * Além disso, mesmo que o portal fosse encontrado, não há nenhum controle de seleção de
 * "Fiscal Substituto" nem campo de período (início/fim da delegação) em lugar algum do
 * formulário hoje renderizado — os únicos campos de data são carimbos de resposta de
 * aprovação (`dataRespostaGestor`, `dataRespostaGerente`, `dataResposta`) e a data da própria
 * solicitação (`dataSolicitacao`), nenhum deles editável pelo solicitante.
 */
test.describe('Delegação de Fiscais de Contrato/Serviço — ciclo completo', () => {
  test('CT-DEL-01-H @destrutivo @bug: delegar um fiscal substituto para um contrato deve criar a delegação', async ({
    page,
  }) => {
    const guarda = await bloquearCriacaoDeSolicitacao(page);
    const formulario = new FormularioDelegacaoFiscaisPage(page);

    await formulario.goto();
    await formulario.expectAberto();

    // Evidência complementar, colhida nesta execução: o catálogo confirma que ninguém nunca
    // completou este processo — não é uma lacuna exclusiva desta automação.
    await page.goto('/portal/p/1/pageprocessstart', { waitUntil: 'domcontentloaded' });
    const linhaCatalogo = page.getByText('Delegação de Fiscais de Contrato/Serviço', { exact: false }).first();
    await linhaCatalogo.waitFor({ state: 'visible' });
    const contextoCatalogo = await linhaCatalogo
      .locator('xpath=ancestor::div[contains(@class,"card-horizontal")][1]')
      .innerText();
    expect(contextoCatalogo).toMatch(/Último iniciado:\s*Nunca/);

    await formulario.goto();
    await formulario.expectAberto();
    await formulario.botaoEnviar.click();

    // Comportamento ESPERADO (o que este caso de teste deveria comprovar): a delegação é
    // criada e o processo é aceito. Comportamento OBSERVADO: um diálogo de erro síncrono
    // recusa o envio exigindo um "portal de delegação de fiscais" que não existe em nenhum
    // ponto de navegação alcançável — ver nota da suíte acima. Este teste fica VERMELHO de
    // propósito, documentando o defeito, e fica verde sozinho se a Cassi disponibilizar esse
    // portal (ou se o processo passar a aceitar envio direto).
    const confirmacao = page.getByText(/iniciada com sucesso\./);
    await expect(
      confirmacao,
      'a Delegação de Fiscais deveria ser criável a partir do catálogo de processos (onde é ' +
        'anunciada como iniciável), mas o formulário recusa o envio exigindo um "portal de ' +
        'delegação de fiscais" inalcançável — ver comentário da suíte para a investigação completa',
    ).toBeVisible({ timeout: 15000 });

    expect(guarda.tentativas(), `tentativas bloqueadas: ${guarda.urls().join(', ')}`).toBe(0);
  });

  test('CT-DEL-01-S1 @destrutivo @bug: substituto inválido/sem permissão deve ser bloqueado — não há nenhum controle para selecionar um fiscal substituto', async ({
    page,
  }) => {
    // ⚠️ NÃO instale aqui a guarda de escrita (`bloquearCriacaoDeSolicitacao`). Medido em
    // 25/08/2026, com e sem guarda, no mesmo formulário:
    //   • COM guarda   → o clique em Enviar dispara `POST /ecm/api/rest/ecm/workflowView/send`,
    //     a guarda ABORTA a requisição, o widget fica com o spinner girando e a tela não exibe
    //     nada: nenhum diálogo, nenhum heading "Erro". A assertion morria em
    //     `Locator: getByRole('heading', { name: 'Erro' })  Timeout` — vermelho que era
    //     ARTEFATO DA INTERCEPTAÇÃO, não comportamento do produto (a armadilha "interceptar
    //     muda o comportamento" do CLAUDE.md).
    //   • SEM guarda   → o servidor responde HTTP 500 e o diálogo aparece com o texto
    //     "Erro ao salvar dados de formulário: Solicitação só pode ser aberta através do portal
    //     de delegação de fiscais!". A recusa é do SERVIDOR — só é observável deixando a
    //     requisição chegar nele.
    // Por isso o oráculo aqui OBSERVA a resposta do envio em vez de bloqueá-la, e a prova de
    // que nada nasceu é a própria resposta do servidor (mesmo padrão de CT-CMP-02-S4
    // @destrutivo). `@destrutivo` porque o envio sai de verdade.
    /** @type {{ status: number, instanceId: unknown, mensagem: string, url: string }[]} */
    const envios = [];
    page.on('response', async (resposta) => {
      const metodo = resposta.request().method();
      if (metodo === 'GET' || metodo === 'HEAD' || metodo === 'OPTIONS') return;
      if (!/workflowView\/send|process-management/.test(resposta.url())) return;
      const corpo = await resposta.text().catch(() => '');
      /** @type {unknown} */
      let instanceId = null;
      /** @type {string} */
      let mensagem = corpo.slice(0, 300);
      try {
        const json = JSON.parse(corpo);
        instanceId = json?.content?.processInstanceId ?? json?.processInstanceId ?? null;
        mensagem = String(json?.message?.message ?? json?.message ?? mensagem)
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      } catch {
        // Corpo não-JSON não carrega id de instância nem mensagem estruturada; o status da
        // resposta continua sendo afirmado abaixo, e o trecho bruto vai para a mensagem.
        instanceId = null;
      }
      envios.push({ status: resposta.status(), instanceId, mensagem, url: resposta.url() });
    });

    const formulario = new FormularioDelegacaoFiscaisPage(page);

    await formulario.goto();
    await formulario.expectAberto();

    // O único campo relacionado a fiscal na tela é somente leitura...
    await expect(formulario.campoFiscal).toBeVisible();
    expect(await formulario.campoFiscal.isEditable()).toBe(false);

    // ...e não existe, em lugar algum do formulário, um campo de BUSCA/SELEÇÃO de "Fiscal
    // Substituto" — nem por nome de campo acessível, nem por zoom.
    const buscaSubstituto = formulario.frame
      .getByRole('searchbox', { name: /[Ss]ubstitut/ })
      .or(formulario.frame.getByRole('combobox', { name: /[Ss]ubstitut/ }));
    const controlesDeSubstituto = await buscaSubstituto.count();

    // Exercita o único caminho de escrita disponível e MEDE a recusa do servidor.
    await formulario.botaoEnviar.click();

    await expect
      .poll(() => envios.length, {
        timeout: 60_000,
        intervals: Array(120).fill(500),
        message:
          'o clique em Enviar não produziu nenhuma resposta do servidor em 60s ' +
          '(`workflowView/send` / `process-management`) — sem resposta não há veredito sobre o ' +
          'bloqueio, e a causa provável é ambiente, não produto',
      })
      .toBeGreaterThan(0);

    // Nada pode ter nascido deste envio.
    expect(
      envios.filter((e) => e.status < 400 && e.instanceId != null).map((e) => `#${e.instanceId}`),
      'defeito: o envio da Delegação de Fiscais foi ACEITO e criou registro, num formulário que ' +
        'não oferece sequer o campo de fiscal substituto — nenhuma validação de substituto foi ' +
        'aplicada',
    ).toEqual([]);

    const recusa = envios.map((e) => `HTTP ${e.status} em ${new URL(e.url).pathname}: ${e.mensagem}`).join(' | ');

    // A assertion que dá o veredito de CT-DEL-01-S1. Ela REPROVA de propósito, e a mensagem diz
    // exatamente por quê: o caso é INEXEQUÍVEL pela UI de hoje. "Substituto inválido é
    // bloqueado" pressupõe um controle onde informar o substituto; ele não existe, e o único
    // caminho de envio é recusado pelo servidor exigindo um "portal de delegação de fiscais"
    // que não foi encontrado em nenhum ponto de navegação alcançável (ver CT-DEL-01-H e a nota
    // da suíte). Fica verde sozinho quando a Cassi disponibilizar o portal/campo — ou o caso é
    // reclassificado como não-automatizável por ausência de entrada de dado.
    expect(
      controlesDeSubstituto,
      'CT-DEL-01-S1 é INEXEQUÍVEL pela interface atual: o formulário de Delegação de Fiscais não ' +
        'oferece nenhum controle (searchbox/combobox) para informar um fiscal substituto, então ' +
        'não há entrada de dado para exercitar "substituto inválido". O único caminho de escrita ' +
        `(Enviar) é recusado pelo servidor — ${recusa} — e esse portal não foi encontrado em ` +
        'nenhum ponto de navegação alcançável por este usuário (ver CT-DEL-01-H)',
    ).toBeGreaterThan(0);
  });

  test('CT-DEL-01-S2: período sobreposto a outra delegação vigente não é verificável — não há campo de período (início/fim) em nenhuma parte do formulário', async ({
    page,
  }) => {
    const formulario = new FormularioDelegacaoFiscaisPage(page);

    await formulario.goto();
    await formulario.expectAberto();

    // Os quatro campos de data do formulário são: a data da própria solicitação e três
    // carimbos de resposta de aprovação — nenhum é um período de delegação, e nenhum é
    // preenchível pelo solicitante.
    const camposData = formulario.frame.locator('input[type="date"]');
    const nomes = await camposData.evaluateAll((els) =>
      els.map((el) => el.getAttribute('name') ?? el.id ?? ''),
    );

    expect(nomes.length).toBeGreaterThan(0);
    for (const nome of nomes) {
      expect(nome, `campo de data inesperado "${nome}" pode ser o período de delegação procurado — revalidar este teste`).toMatch(
        /^(dataSolicitacao|dataResposta.*)$/,
      );
    }

    // Nenhum dos campos de data existentes é editável pelo solicitante nesta tela.
    for (let i = 0; i < (await camposData.count()); i++) {
      expect(await camposData.nth(i).isEditable()).toBe(false);
    }
  });
});
