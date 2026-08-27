// @ts-check

/**
 * Cancelamento de solicitações de processo no Fluig — o contrato levantado em campo.
 *
 * Ver a skill `cassi-fluig-master` (`references/cancelamento-de-solicitacoes.md`) para a
 * investigação completa. O essencial:
 *
 * - O endpoint é **público** e não personifica ninguém:
 *   `POST /api/public/2.0/workflows/cancelInstances`, só com cookie de sessão.
 * - `cancelText` é **obrigatório**: `null` derruba com NPE 500 e não cancela nada.
 * - O usuário efetivo precisa ser **requisitante ou gestor** — não o dono da tarefa atual.
 * - Aceita **lote**, e devolve resultado item a item.
 * - Solicitação presa pelo D-01 (em "Início", com a conta de integração) **cancela normalmente**.
 *
 * ⚠️ Toda chamada aqui usa `page.evaluate` + `fetch`, nunca `page.request`. O WAF do ambiente
 * devolve **403** para `/process-management/api/v2/**` quando falta `User-Agent` de navegador e
 * `Referer` do portal — e o contexto de requisição do Playwright não os envia.
 */

/** @typedef {{ processInstanceId: number, status: 'SUCCESS' | 'FAIL', mensagem: string }} ResultadoCancelamento */

/**
 * Cancela solicitações em lote.
 *
 * @param {import('@playwright/test').Page} page página já autenticada, em qualquer rota do portal
 * @param {number[]} ids
 * @param {{ motivo: string, login: string }} opcoes
 * @returns {Promise<ResultadoCancelamento[]>}
 */
export async function cancelarSolicitacoes(page, ids, opcoes) {
  if (ids.length === 0) return [];
  if (!opcoes.motivo?.trim()) {
    throw new Error(
      'cancelarSolicitacoes: `motivo` é obrigatório. O Fluig responde 500 (NullPointerException) ' +
        'quando `cancelText` vem vazio, e NÃO cancela — falha silenciosa se ninguém checar.',
    );
  }

  const resposta = await page.evaluate(
    async ({ ids, motivo, login }) => {
      const r = await fetch('/api/public/2.0/workflows/cancelInstances', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancelInstanceList: ids.map((id) => ({ replacedId: login, processInstanceId: id })),
          cancelText: motivo,
        }),
      });
      return { status: r.status, corpo: await r.text() };
    },
    { ids, motivo: opcoes.motivo, login: opcoes.login },
  );

  if (resposta.status !== 200) {
    throw new Error(
      `cancelInstances respondeu HTTP ${resposta.status}: ${resposta.corpo.slice(0, 300)}`,
    );
  }

  /** @type {any} */
  let json;
  try {
    json = JSON.parse(resposta.corpo);
  } catch {
    throw new Error(`cancelInstances devolveu corpo não-JSON: ${resposta.corpo.slice(0, 300)}`);
  }

  const resultados = json?.content?.cancelInstanceResults ?? [];
  return resultados.map((/** @type {any} */ r) => ({
    processInstanceId: Number(r.processInstanceId),
    status: r.status === 'SUCCESS' ? 'SUCCESS' : 'FAIL',
    mensagem: String(r.message ?? r.errorCode ?? ''),
  }));
}

/**
 * Confirma, lendo do servidor, que as solicitações informadas ficaram canceladas.
 *
 * Existe porque `successCount` é o que o endpoint DIZ ter feito; isto é o que o servidor
 * mostra depois. Numa rotina de limpeza, a diferença entre as duas coisas é o que separa
 * "limpou" de "achou que limpou".
 *
 * @param {import('@playwright/test').Page} page
 * @param {number[]} ids
 * @returns {Promise<Array<{ processInstanceId: number, status: string, active: boolean }>>}
 */
export async function conferirCancelamento(page, ids) {
  return page.evaluate(async ({ ids }) => {
    const saida = [];
    for (const id of ids) {
      const r = await fetch(`/process-management/api/v2/requests/${id}`, {
        credentials: 'include',
        headers: { Referer: `${location.origin}/portal/p/1/home` },
      });
      const j = await r.json().catch(() => ({}));
      saida.push({ processInstanceId: id, status: String(j.status ?? '?'), active: j.active === true });
    }
    return saida;
  }, { ids });
}

/**
 * Descobre solicitações ABERTAS criadas pela automação, varrendo a API e filtrando pelo
 * carimbo nos campos do formulário.
 *
 * Por que o filtro é pelo CARIMBO e não pela data: a base é compartilhada. Na janela de
 * 25–26/08/2026 havia 402 solicitações abertas, e só uma fração era da automação — cancelar
 * por data destruiria trabalho de outras pessoas.
 *
 * ⚠️ `expand` aceita **um único valor** por chamada. Dois valores devolvem `null` em silêncio.
 * E `formFields` vem como **array de `{field, value}`**, não como objeto.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ desde: string, prefixo?: string, maxPaginas?: number }} criterio `desde` em `aaaa-mm-dd`
 * @returns {Promise<Array<{ processInstanceId: number, processId: string, startDate: string, carimbo: string }>>}
 */
export async function descobrirSolicitacoesDaAutomacao(page, criterio) {
  const { desde, prefixo = 'QA', maxPaginas = 20 } = criterio;

  return page.evaluate(
    async ({ desde, prefixo, maxPaginas }) => {
      const h = { Referer: `${location.origin}/portal/p/1/home` };
      const marca = new RegExp(`(^|\\s)${prefixo}[\\s-]`, 'i');

      /** @type {any[]} */
      const todas = [];
      // ⚠️ Paginação medida em 27/08/2026 (custou um bug de limpeza):
      //   - o parâmetro é `pageSize`, NÃO `size` (`size` é ignorado pelo servidor).
      //   - `page=0` NÃO é a primeira página: é o atalho "sem paginação", que devolve a base
      //     INTEIRA (~99 mil solicitações). As páginas reais começam em `page=1`, 100 por vez,
      //     em ordem decrescente de `processInstanceId` e sem sobreposição.
      // O código anterior (`size=100&page=0`) caía no atalho e trazia tudo numa resposta só,
      // o que por acaso funcionava mas era frágil. A forma correta é `pageSize` a partir de 1.
      for (let p = 1; p <= maxPaginas; p++) {
        const r = await fetch(`/process-management/api/v2/requests?pageSize=100&page=${p}`, {
          credentials: 'include',
          headers: h,
        });
        if (!r.ok) break;
        const j = await r.json();
        const itens = j.items ?? [];
        if (itens.length === 0) break;
        todas.push(...itens);
        // A varredura pode parar cedo: as solicitações vêm em ordem decrescente, então quando a
        // página inteira já está abaixo do corte de data não há mais nada da janela adiante.
        const menorData = itens.reduce(
          (/** @type {string} */ min, /** @type {any} */ x) =>
            String(x.startDate ?? '') < min ? String(x.startDate) : min,
          '9999',
        );
        if (menorData < desde) break;
        if (itens.length < 100) break;
      }

      const candidatas = todas.filter(
        (x) => x.active === true && String(x.startDate ?? '') >= desde,
      );

      const daAutomacao = [];
      for (const c of candidatas) {
        const d = await fetch(
          `/process-management/api/v2/requests/${c.processInstanceId}?expand=formFields`,
          { credentials: 'include', headers: h },
        );
        const j = await d.json().catch(() => ({}));
        const campos = Array.isArray(j.formFields) ? j.formFields : [];
        const carimbo = campos.find(
          (/** @type {any} */ f) => typeof f?.value === 'string' && marca.test(f.value),
        );
        if (carimbo) {
          daAutomacao.push({
            processInstanceId: c.processInstanceId,
            processId: c.processId,
            startDate: c.startDate,
            carimbo: String(carimbo.value).slice(0, 120),
          });
        }
      }
      return daAutomacao;
    },
    { desde, prefixo, maxPaginas },
  );
}

/**
 * Confirma, para uma lista curta de ids, quais carregam o carimbo da automação.
 *
 * Existe para o modo livro-razão: ali já se sabe QUAIS ids checar, e varrer a base inteira
 * (como faz `descobrirSolicitacoesDaAutomacao`) custaria centenas de chamadas para confirmar
 * meia dúzia. Aqui é uma chamada por id.
 *
 * A confirmação não é burocracia: constar do livro-razão prova que a suíte anotou aquele id,
 * não que o id é da suíte. Um arquivo de execução antiga, um id errado ou uma colisão levariam
 * a cancelar registro alheio. O carimbo no servidor é a única prova que vale.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Array<string|number>} ids
 * @param {string} [prefixo]
 * @returns {Promise<Array<{ processInstanceId: number, processId: string, carimbo: string }>>}
 */
export async function confirmarCarimbo(page, ids, prefixo = 'QA') {
  return (await classificarAlvosDoLivro(page, ids, prefixo)).comCarimbo;
}

/**
 * Classifica ids vindos do livro-razão em três baldes, porque nem todo registro da automação
 * PODE ser carimbado.
 *
 * O caso que forçou este desenho: a medição de contrato (`wf_faturamento_contratos`). O
 * formulário da etapa "Início" tem 34 campos de texto e **zero editáveis** — tudo vem de zoom
 * do Protheus ou de auto-preenchimento. Não há onde escrever `QA`. Exigir carimbo ali
 * significaria nunca limpar medição nenhuma.
 *
 * A saída não é afrouxar a regra, é reconhecer duas procedências diferentes:
 *
 * - **`comCarimbo`** — o servidor confirma a marca. Vale para qualquer origem, inclusive
 *   varredura da base compartilhada.
 * - **`semCarimboMasAtiva`** — não tem marca, mas o id veio do livro-razão DESTA execução,
 *   escrito pela própria fixture no instante da criação. A procedência é o livro, não o dado.
 *   Só é aceitável no modo livro-razão; jamais numa varredura.
 * - **`jaEncerrada`** — nada a fazer.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Array<string|number>} ids
 * @param {string} [prefixo]
 * @returns {Promise<{ comCarimbo: any[], semCarimboMasAtiva: any[], jaEncerrada: number[] }>}
 */
export async function classificarAlvosDoLivro(page, ids, prefixo = 'QA') {
  return page.evaluate(
    async ({ ids, prefixo }) => {
      const h = { Referer: `${location.origin}/portal/p/1/home` };
      const marca = new RegExp(`(^|\\s)${prefixo}[\\s-]`, 'i');
      /** @type {any[]} */ const comCarimbo = [];
      /** @type {any[]} */ const semCarimboMasAtiva = [];
      /** @type {number[]} */ const jaEncerrada = [];
      for (const id of ids) {
        const r = await fetch(`/process-management/api/v2/requests/${id}?expand=formFields`, {
          credentials: 'include',
          headers: h,
        });
        if (!r.ok) continue;
        const j = await r.json().catch(() => ({}));
        if (j.active !== true) {
          jaEncerrada.push(Number(id));
          continue;
        }
        const campos = Array.isArray(j.formFields) ? j.formFields : [];
        const carimbo = campos.find(
          (/** @type {any} */ f) => typeof f?.value === 'string' && marca.test(f.value),
        );
        const registro = {
          processInstanceId: Number(id),
          processId: String(j.processId ?? ''),
          carimbo: carimbo ? String(carimbo.value).slice(0, 120) : '(sem carimbo — origem: livro-razão)',
        };
        (carimbo ? comCarimbo : semCarimboMasAtiva).push(registro);
      }
      return { comCarimbo, semCarimboMasAtiva, jaEncerrada };
    },
    { ids, prefixo },
  );
}

/**
 * `true` quando a recusa do servidor é TRANSITÓRIA e vale tentar de novo.
 *
 * Medido em 27/08/2026: cancelar uma solicitação recém-criada devolve
 * *"Esta ação está sendo realizada por outra pessoa. Recomendamos atualizar a página…"* — o
 * motor de workflow ainda está movimentando a tarefa quando a limpeza chega. Segundos depois o
 * mesmo cancelamento passa.
 *
 * A distinção importa: *"A solicitação é invalida ou está inativa"* significa **já cancelada**,
 * e retentar aquilo seria só desperdício com aparência de erro.
 *
 * @param {string} mensagem
 */
export function ehRecusaTransitoria(mensagem) {
  return /outra pessoa|atualizar a p[áa]gina|lock|em uso/i.test(mensagem);
}

/**
 * Cancela com retentativa para as recusas transitórias.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number[]} ids
 * @param {{ motivo: string, login: string, tentativas?: number, pausaMs?: number }} opcoes
 * @returns {Promise<ResultadoCancelamento[]>}
 */
export async function cancelarComRetentativa(page, ids, opcoes) {
  const { tentativas = 3, pausaMs = 6_000 } = opcoes;
  /** @type {Map<number, ResultadoCancelamento>} */
  const consolidado = new Map();
  let pendentes = [...ids];

  for (let tentativa = 1; tentativa <= tentativas && pendentes.length > 0; tentativa++) {
    if (tentativa > 1) await new Promise((r) => setTimeout(r, pausaMs));
    const resultados = await cancelarSolicitacoes(page, pendentes, opcoes);
    for (const r of resultados) consolidado.set(r.processInstanceId, r);
    pendentes = resultados
      .filter((r) => r.status === 'FAIL' && ehRecusaTransitoria(r.mensagem))
      .map((r) => r.processInstanceId);
  }

  return [...consolidado.values()];
}
