// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { FormularioProcessoPage } from '../../../pages/FormularioProcessoPage.js';
import { bloquearCriacaoDeSolicitacao } from '../../../utils/guarda-criacao.js';

/**
 * CT-SEG-08-S1 — Processos administrativos abertos a usuário comum (segregação de função).
 *
 * `bpm_addUserFluig` (Adicionar Usuário) e `bpm_addUserGroup` (Adicionar Grupo) são processos
 * ADMINISTRATIVOS de plataforma. Medido em 27/08/2026, com a conta `TOTVS-FS` (perfil
 * Compras/Contratos, não-admin):
 *
 * - ambos CONSTAM do catálogo `onlyCanStart=true` de "Iniciar Solicitações" desta conta;
 * - ambos ABREM o formulário de início por `pageworkflowview?processID=...` (heading "Início",
 *   botão "Enviar" visível, título "Movimentar Solicitação", sem diálogo de erro).
 *
 * Risco concreto: se o processo funcionar de ponta a ponta, um usuário de Compras cria conta e
 * grupo no Fluig — escalada de privilégio por processo de negócio, contornando a tela de
 * administração (que `CT-SEG-05-S1` prova estar barrada com 403 no `/webdesk`).
 *
 * COMPORTAMENTO ESPERADO: como processos administrativos, NÃO deveriam constar do catálogo de
 * início desta conta NEM abrir formulário — deveriam responder com o diálogo "Erro" e a
 * mensagem de permissão, como `wf_solicitacao_ferias`, `wf_aprovacao_ocorrencia` e os RDFC.
 * Hoje abrem → estes testes REPROVAM de propósito (vermelho intencional), cada um com uma
 * anotação de achado no relatório, no mesmo espírito de `bloqueio-processos-rh.spec.js`.
 *
 * Leitura pura: NUNCA se clica em "Enviar" — criar usuário/grupo é escrita fora da política,
 * mesmo em homologação. `utils/guarda-criacao.js` prova que nenhuma escrita saiu.
 */

/** @type {Array<{ processId: string, nome: string }>} */
const PROCESSOS_ADMINISTRATIVOS = [
  { processId: 'bpm_addUserFluig', nome: 'Adicionar Usuário' },
  { processId: 'bpm_addUserGroup', nome: 'Adicionar Grupo' },
];

test.describe('Segurança — processos administrativos não devem abrir para usuário comum', () => {
  for (const { processId, nome } of PROCESSOS_ADMINISTRATIVOS) {
    test(`CT-SEG-08-S1 — "${processId}" (${nome}) não deve constar do catálogo nem abrir para conta não-admin`, async ({
      page,
    }, testInfo) => {
      // Trava de escrita: nenhuma requisição de criação/movimentação pode sair da navegação.
      const guarda = await bloquearCriacaoDeSolicitacao(page);
      const formularioPage = new FormularioProcessoPage(page);

      // Rastreabilidade do achado no relatório, inclusive se um dia o produto for corrigido e
      // o teste ficar verde: a anotação documenta o comportamento REAL medido.
      testInfo.annotations.push({
        type: 'achado-segregacao-de-funcao',
        description: `${processId}: consta do catálogo onlyCanStart e ABRE o formulário de início para a conta da automação (perfil Compras/Contratos, não-admin). Esperado seria o bloqueio de permissão, como em processos de RH barrados. Escalada de privilégio por processo administrativo.`,
      });

      await page.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

      // Passo 1 — o catálogo de início da conta NÃO deveria listar um processo administrativo.
      const catalogo = await page.evaluate(async () => {
        const headers = { Referer: `${location.origin}/portal/p/1/home` };
        const r = await fetch(
          '/ecm/api/rest/ecm/process-category/processes?processOrder=alphabetical&processLabel=&onlyCanStart=true',
          { credentials: 'include', headers },
        );
        const corpo = await r.json().catch(() => ({}));
        /** @type {string[]} */
        const ids = [];
        for (const cat of corpo?.content ?? []) {
          for (const pd of cat?.processDefinitions ?? []) {
            if (pd?.processId) ids.push(String(pd.processId));
          }
        }
        return { status: r.status, ids };
      });

      expect(
        catalogo.status,
        `o catálogo de início (onlyCanStart) respondeu ${catalogo.status} — esperado 200 para ` +
          'poder auditar a lista de processos iniciáveis pela conta.',
      ).toBe(200);

      // expect.soft para que AMBOS os achados (catálogo + formulário) apareçam no relatório
      // numa única execução, em vez de o teste abortar no primeiro. O teste ainda reprova.
      expect
        .soft(
          catalogo.ids,
          `o processo administrativo '${processId}' consta do catálogo de início desta conta ` +
            'não-admin. Um processo de criação de usuário/grupo na plataforma não deveria ser ' +
            'iniciável por um perfil de Compras — segregação de função violada. Ver CT-SEG-08-S1.',
        )
        .not.toContain(processId);

      // Passo 2 — abrir o formulário de início por URL. Esperado: bloqueio (diálogo "Erro").
      await formularioPage.goto(processId);

      // ⚠️ Esperar a tela ASSENTAR antes de julgá-la.
      //
      // A versão anterior lia `headingErro.isVisible()` e `botaoEnviar.isVisible()` na linha
      // seguinte ao `goto`. `isVisible()` NÃO tem retry, e `goto` resolve em
      // `domcontentloaded` — mas o iframe do formulário navega várias vezes durante a carga
      // (3× `about:blank`, o formulário real só por volta de 5,5 s; ver
      // `docs/mapa-do-ambiente.md`, onda 3). No instante da leitura os dois davam `false`, e
      // aí a assertion que denuncia a escalada (`botaoEnviar` visível ⇒ o formulário abriu)
      // recebia `false` e PASSAVA — reportando o oposto do que foi medido em campo.
      //
      // A carga tem dois desfechos possíveis e mutuamente exclusivos: o diálogo de bloqueio
      // ou o formulário montado. Espera-se por QUALQUER um dos dois antes de afirmar; assim
      // as assertions julgam um estado real, e um terceiro desfecho (nenhum dos dois) vira
      // falha explícita em vez de virar "bloqueado" por omissão.
      /** @type {'bloqueado' | 'formulario' | 'indefinido'} */
      let desfecho = 'indefinido';
      await expect
        .poll(
          async () => {
            if (await formularioPage.headingErro.isVisible().catch(() => false)) return 'bloqueado';
            if (await formularioPage.headingInicio.isVisible().catch(() => false)) return 'formulario';
            return 'indefinido';
          },
          {
            timeout: 45_000,
            message:
              `abrir '${processId}' não produziu nem o diálogo "Erro" de permissão nem o ` +
              'formulário de início em 45s — a tela ficou num terceiro estado, e sem um dos ' +
              'dois não há veredito sobre CT-SEG-08-S1',
          },
        )
        .not.toBe('indefinido');

      desfecho = /** @type {'bloqueado' | 'formulario'} */ (
        (await formularioPage.headingErro.isVisible().catch(() => false)) ? 'bloqueado' : 'formulario'
      );

      // A tela deveria ser a de bloqueio de permissão. Hoje é o formulário — estas asserções
      // reprovam de propósito.
      expect
        .soft(
          desfecho,
          `abrir '${processId}' deveria exibir o diálogo "Erro" de permissão para a conta ` +
            'não-admin, como acontece com os processos de RH barrados. Ver CT-SEG-08-S1.',
        )
        .toBe('bloqueado');

      await expect
        .soft(
          formularioPage.botaoEnviar,
          `o formulário de início de '${processId}' (${nome}) carregou com o botão "Enviar" ` +
            'visível para a conta não-admin — o processo administrativo abriu de fato, quando ' +
            'deveria ter sido barrado. É a superfície da escalada de privilégio. Ver CT-SEG-08-S1.',
        )
        .toHaveCount(0);

      // Invariante de segurança que DEVE valer sempre: a navegação de leitura não pode ter
      // disparado nenhuma escrita. Assertion dura (não-soft) — se falhar, é problema real.
      expect(
        guarda.tentativas(),
        `a navegação disparou escrita(s) no ambiente, o que este teste jamais deve fazer: ` +
          `${JSON.stringify(guarda.urls())}`,
      ).toBe(0);
    });
  }
});
