// @ts-check

/**
 * Descoberta de massa para Faturamento de Contratos — por CONSULTA, não por navegação.
 *
 * ## Por que existe
 *
 * Achar uma competência que o Protheus recusa medir custava, pela interface, uma cadeia de
 * cinco zooms por tentativa (Fornecedor → Contrato → Competência → Filial → Planilha), ~30s
 * cada. `CT-FAT-02-S2` amostrava 5 contratos e levava **153s** para, no fim, dizer que não
 * achou. As mesmas informações estão em dois datasets que respondem em milissegundos.
 *
 * ## Os dois endpoints (capturados em campo, 26/08/2026)
 *
 * Competências de um contrato:
 * `GET /ecm/api/rest/ecm/dataset/datasetZoom/{"searchField":"COMPETENCIA","filterFields":
 *  ["CNA_CONTRA","<contrato>","FILIAL","<filial>"],"resultFields":["COMPETENCIA"],
 *  "datasetId":"ds_fatcon_get_competencia"}?limit=300&offset=0&orderby=COMPETENCIA_ASC`
 *
 * Veredito de medição de uma competência:
 * `GET /api/public/ecm/dataset/search?datasetId=ds_fatcon_get_info_medicoes&filterFields=
 *  CNA_CONTRA,<contrato>,FILIAL_CONTRATO,<filial>,COMPETENCIA_ESCOLHIDA,<mm-aaaa>,
 *  FILIAL_ESCOLHIDA,<filial>`
 *
 * A resposta do segundo é `{"content":[{"STATUS":"ERROR"|"SUCCESS","RESPONSE":"<json>"}]}`.
 * Quando `STATUS` é `ERROR`, `RESPONSE` traz o motivo do Protheus, por exemplo
 * *"CNTA120_REV:Existe revisão pendente de aprovação para este contrato, não é permitido medir
 * contratos em revisão."*
 *
 * ⚠️ **O campo `PAGAMENTO` do primeiro dataset NÃO é o marcador de bloqueio.** Medido: a
 * competência 03-2025 do contrato 000000000000001 vem com `PAGAMENTO: "true"` e a 04-2025 com
 * `"false"`, e as DUAS são recusadas pelo Protheus. Filtrar por ele daria falso negativo.
 *
 * ⚠️ **A recusa do servidor NÃO aparece na tela.** Medido interceptando a resposta que o widget
 * recebe: com `STATUS: ERROR`, nenhum diálogo é exibido e o painel de itens simplesmente não
 * abre. Por isso o oráculo de bloqueio é a RESPOSTA, e a ausência de aviso é o defeito que
 * `CT-FAT-02-S2` documenta.
 */

/** @typedef {{ competencia: string, mensagemDoServidor: string }} CompetenciaBloqueada */

/**
 * Extrai só o código numérico da filial ("3517 - CASSI …" → "3517").
 * @param {string} textoFilial
 * @returns {string}
 */
export function codigoDaFilial(textoFilial) {
  const achado = String(textoFilial).match(/\d{3,}/);
  if (!achado) {
    throw new Error(
      `Não foi possível extrair o código da filial de ${JSON.stringify(textoFilial)} — ` +
        'a grade de contratos mudou de formato.',
    );
  }
  return achado[0];
}

/**
 * Lê a mensagem de negócio de uma resposta de `ds_fatcon_get_info_medicoes`.
 * @param {unknown} corpo
 * @returns {{ recusado: boolean, mensagem: string }}
 */
export function lerVereditoDeMedicao(corpo) {
  const registro = /** @type {any} */ (corpo)?.content?.[0];
  if (!registro) return { recusado: false, mensagem: '' };
  if (registro.STATUS !== 'ERROR') return { recusado: false, mensagem: '' };

  let mensagem = String(registro.RESPONSE ?? '');
  try {
    const interno = JSON.parse(mensagem);
    mensagem = String(interno.message ?? mensagem);
  } catch {
    // `RESPONSE` nem sempre é JSON (erros de infraestrutura vêm como texto puro). O texto
    // bruto continua servindo de mensagem — e o veredito de recusa já foi decidido pelo STATUS.
  }
  return { recusado: true, mensagem: mensagem.replace(/\s+/g, ' ').trim() };
}

/**
 * Procura, por consulta direta, uma competência que o Protheus recusa medir.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ contrato: string, filial: string, maxCompetencias?: number }} alvo
 * @returns {Promise<CompetenciaBloqueada | null>}
 */
export async function descobrirCompetenciaBloqueada(page, alvo) {
  const { contrato, maxCompetencias = 12 } = alvo;
  const filial = codigoDaFilial(alvo.filial);

  const zoom = {
    searchField: 'COMPETENCIA',
    filterFields: ['CNA_CONTRA', contrato, 'FILIAL', filial],
    resultFields: ['COMPETENCIA'],
    datasetId: 'ds_fatcon_get_competencia',
  };
  const respostaCompetencias = await page.request.get(
    `/ecm/api/rest/ecm/dataset/datasetZoom/${encodeURIComponent(JSON.stringify(zoom))}` +
      '?limit=300&offset=0&orderby=COMPETENCIA_ASC',
  );
  const competencias = /** @type {any[]} */ (
    (await respostaCompetencias.json())?.content ?? []
  )
    .map((c) => String(c.COMPETENCIA ?? ''))
    // "Contrato não localizado" é o que o dataset devolve no lugar de uma competência quando o
    // par contrato/filial não existe — descartar aqui evita consultar o veredito à toa.
    .filter((c) => /^\d{2}-\d{4}$/.test(c));

  for (const competencia of competencias.slice(0, maxCompetencias)) {
    const resposta = await page.request.get(
      '/api/public/ecm/dataset/search?datasetId=ds_fatcon_get_info_medicoes&filterFields=' +
        `CNA_CONTRA,${contrato},FILIAL_CONTRATO,${filial},` +
        `COMPETENCIA_ESCOLHIDA,${competencia},FILIAL_ESCOLHIDA,${filial}`,
    );
    const veredito = lerVereditoDeMedicao(await resposta.json());
    if (veredito.recusado) return { competencia, mensagemDoServidor: veredito.mensagem };
  }

  return null;
}
