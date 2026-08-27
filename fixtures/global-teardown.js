// @ts-check
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

import { cancelarSolicitacoes, conferirCancelamento, classificarAlvosDoLivro } from '../utils/cancelamento-fluig.js';

/**
 * Cancela, ao fim da execução, as solicitações que ELA criou.
 *
 * ## Por que isto é seguro (medido em 27/08/2026)
 *
 * A primeira versão desta limpeza ficou fora do `globalTeardown` por uma premissa minha de que
 * uma falha aqui poderia derrubar o processo antes de trace, vídeo e relatório serem gravados.
 * A premissa foi testada com um projeto mínimo e um teardown que lança exceção de propósito:
 *
 * | No instante em que o teardown roda | |
 * |---|---|
 * | artefatos por teste (trace, screenshot) | **já gravados** |
 * | relatório HTML | ainda não gerado |
 *
 * | Com o teardown lançando exceção | |
 * |---|---|
 * | relatório HTML | **gerado normalmente** |
 * | artefatos | intactos |
 *
 * O Playwright captura o erro do teardown, imprime e segue gerando o relatório. Ou seja: a
 * limpeza aqui não ameaça a evidência. Ainda assim este arquivo **nunca lança** — falha de
 * limpeza é registrada e segue, porque o resultado dos testes é o que importa e um erro aqui só
 * poluiria a saída.
 *
 * ## O filtro por invocação
 *
 * O livro-razão (`test-results/criados.jsonl`) é append-only e sobrevive entre invocações. Sem
 * filtro, cada uma das 34 invocações do fluxo destrutivo fatiado tentaria recancelar tudo que
 * veio antes. O corte é o instante em que ESTE processo começou, derivado de `process.uptime()`
 * — sem arquivo auxiliar e sem depender de o `test-results/` ter sido limpo.
 *
 * ## Como escapar
 *
 * `PULAR_LIMPEZA=1` desliga. Serve para quando se roda um teste isolado depurando e o resíduo
 * precisa ficar VIVO para ser aberto no Fluig. Solicitação cancelada continua legível — campos,
 * histórico e anexos permanecem —, mas **não pode mais ser movimentada**, e é aí que a limpeza
 * atrapalha a investigação.
 *
 * Resíduo de execução interrompida com Ctrl+C não passa por aqui: para esse caso existe
 * `node scripts/limpar-massa.mjs --descobrir --desde=aaaa-mm-dd`.
 */
export default async function globalTeardown() {
  if (process.env.PULAR_LIMPEZA) {
    console.log('\n[limpeza] PULAR_LIMPEZA definido — resíduo mantido de propósito.');
    return;
  }

  const LIVRO = 'test-results/criados.jsonl';
  if (!existsSync(LIVRO)) return;

  // Instante em que ESTA invocação começou. Tudo que o livro registrou antes disso pertence a
  // outra execução e não é desta limpeza.
  const inicioDaInvocacao = new Date(Date.now() - process.uptime() * 1000).toISOString();

  /** @type {Array<{ id: string, em: string, anotacao?: string }>} */
  const registros = [];
  for (const linha of readFileSync(LIVRO, 'utf8').split('\n').filter(Boolean)) {
    try {
      registros.push(JSON.parse(linha));
    } catch {
      // Linha truncada (processo morto no meio da escrita): ignorar UMA linha é melhor que
      // abortar a limpeza. O registro segue rastreável pelo carimbo `QA`.
    }
  }

  const idsDaInvocacao = [
    ...new Set(
      registros
        .filter((r) => String(r.em ?? '') >= inicioDaInvocacao)
        .map((r) => String(r.id))
        .filter((id) => /^\d+$/.test(id)),
    ),
  ];

  if (idsDaInvocacao.length === 0) return;

  const BASE_URL = process.env.BASE_URL;
  const USUARIO = process.env.QA_USERNAME;
  if (!BASE_URL || !USUARIO) {
    console.log(
      `\n[limpeza] ${idsDaInvocacao.length} registro(s) criado(s), mas faltam BASE_URL/QA_USERNAME ` +
        '— nada foi cancelado. Rode `npm run limpar` depois de configurar o ambiente.',
    );
    return;
  }

  console.log(`\n[limpeza] ${idsDaInvocacao.length} registro(s) criado(s) nesta execução`);

  /** @type {import('@playwright/test').Browser | null} */
  let navegador = null;
  try {
    navegador = await chromium.launch();
    const contexto = await navegador.newContext({
      baseURL: BASE_URL,
      locale: 'pt-BR',
      storageState: existsSync('playwright/.auth/usuario.json')
        ? 'playwright/.auth/usuario.json'
        : undefined,
    });
    const pagina = await contexto.newPage();
    await pagina.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });

    // O login é servido na MESMA rota da home: o critério de sessão viva é o TÍTULO, nunca a URL.
    if (!(await pagina.title()).includes('Home')) {
      console.log('[limpeza] sessão do storageState não está válida — pulando.');
      console.log('[limpeza] rode `npm run limpar` para cancelar depois.');
      return;
    }

    // Procedência antes de cancelar. Nem todo registro da automação PODE ser carimbado — a
    // medição de contrato não tem um único campo de texto editável —, e para esses a
    // procedência é o próprio livro-razão desta invocação.
    const classificado = await classificarAlvosDoLivro(
      pagina,
      idsDaInvocacao,
      process.env.QA_DATA_PREFIX ?? 'QA',
    );
    const alvos = [...classificado.comCarimbo, ...classificado.semCarimboMasAtiva];
    if (alvos.length === 0) {
      console.log('[limpeza] nada a cancelar (já encerrados ou sem procedência confirmada).');
      return;
    }

    const ids = alvos.map((a) => a.processInstanceId);
    const resultados = await cancelarSolicitacoes(pagina, ids, {
      motivo: `${process.env.QA_DATA_PREFIX ?? 'QA'} limpeza automatizada pos-execucao`,
      login: USUARIO,
    });

    // `successCount` é o que o endpoint DIZ ter feito. Isto é o que o servidor mostra depois.
    const conferencia = await conferirCancelamento(pagina, ids);
    const efetivados = conferencia.filter((c) => c.status === 'CANCELED' && !c.active);

    console.log(`[limpeza] ${efetivados.length}/${ids.length} confirmados CANCELED no servidor`);
    for (const p of conferencia.filter((c) => !(c.status === 'CANCELED' && !c.active))) {
      console.log(`[limpeza]   não confirmado: ${p.processInstanceId} status=${p.status}`);
    }

    writeFileSync(
      'limpeza.json',
      JSON.stringify(
        {
          executadoEm: new Date().toISOString(),
          modo: 'globalTeardown',
          inicioDaInvocacao,
          alvos: alvos.length,
          cancelados: efetivados.length,
          conferencia,
          resultadosDoEndpoint: resultados,
        },
        null,
        2,
      ),
    );
  } catch (erro) {
    // NUNCA propagar: o resultado dos testes é o que importa, e o resíduo continua rastreável
    // pelo carimbo `QA` (limpável depois com `npm run limpar --descobrir`).
    console.log(`[limpeza] falhou, e a execução segue: ${String(erro).slice(0, 200)}`);
    console.log('[limpeza] rode `node scripts/limpar-massa.mjs --descobrir --desde=<data>` depois.');
  } finally {
    await navegador?.close();
  }
}
