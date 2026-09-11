// @ts-check
import { tentarComAlternativa } from './pre-condicao.js';
import { descobrirContratoVigentePorDataset } from './massa-contratos.js';
import { FORNECEDOR_FATURAMENTO, fornecedoresParaMedicao, parseFornecedorDaGrade } from '../factories/medicao.js';

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
 * @typedef {import('../pages/MedicaoContratoPage.js').MedicaoContratoPage} MedicaoContratoPage
 * @typedef {Awaited<ReturnType<MedicaoContratoPage['montarMedicaoComSaldoEmAberto']>>} ResultadoMontagem
 */

/**
 * Monta uma medição com saldo em aberto tentando **o fornecedor designado (TOTVS S.A) primeiro** e,
 * só depois, contratos vigentes descobertos por dataset — a regra "TOTVS primeiro" num lugar só, para
 * `ciclo-faturamento` e `validacoes-faturamento` (etapa 1.1 do plano de evolução).
 *
 * Por que o TOTVS S.A abre a fila: é o fornecedor que o dono do ambiente indicou para o Faturamento
 * manual (11/09/2026) e tem contrato vigente neste tenant, então é o ponto de partida
 * DETERMINÍSTICO. Não é ponto único de falha: se ele não tiver competência com saldo aberto no
 * momento, a busca cai para contratos descobertos por dataset. Saturação do ERP na montagem
 * (`WFLYEJB0378`) vira PRÉ-CONDIÇÃO dentro do próprio Page Object (`MedicaoContratoPage`).
 *
 * `tentarComAlternativa` é obrigatório aqui: um fornecedor sem contrato/competência é pré-condição
 * daquela tentativa (segue para o próximo), mas qualquer OUTRO erro tem de subir — envolver em
 * `try/catch` à mão engoliria erro real e o gate leria como ambiente (ver `utils/pre-condicao.js`).
 *
 * @param {import('@playwright/test').Page} page
 * @param {MedicaoContratoPage} medicao
 * @param {{ maxContratosDescobertos?: number }} [opcoes]
 * @returns {Promise<{ resultado: ResultadoMontagem | undefined, tentados: string[], descartes: string[] }>}
 */
export async function montarMedicaoComSaldoTotvsOuDescoberto(page, medicao, opcoes = {}) {
  const { maxContratosDescobertos = 3 } = opcoes;
  /** @type {ResultadoMontagem | undefined} */
  let resultado;
  const tentados = /** @type {string[]} */ ([]);
  const descartes = /** @type {string[]} */ ([]);

  /**
   * @param {{ codigo: string, loja: string }} fornecedor
   * @param {string} rotulo como o fornecedor aparece na mensagem de descarte
   * @returns {Promise<boolean>} true quando montou com sucesso (encerra a busca)
   */
  const tentarFornecedor = async (fornecedor, rotulo) => {
    tentados.push(rotulo);
    // Ouvinte de saturação do ERP: qualquer resposta 5xx nos endpoints de dataset durante ESTA
    // tentativa é a assinatura do `WFLYEJB0378` (esgotamento do pool de EJB do WildFly). É o sinal
    // CONFIÁVEL — o banner na tela é transitório e some antes de o `catch` conferir; a resposta 500,
    // não. Cobre a carga do formulário (`goto`/`expectAberto`, onde o S4 travou) e a cadeia de zooms
    // (onde o S1 travou). Handler síncrono e à prova de erro: só lê status/URL.
    /** @type {string[]} */
    const errosDoErp = [];
    const ouvir = (/** @type {import('@playwright/test').Response} */ resposta) => {
      try {
        if (resposta.status() < 500) return;
        if (!/\/ecm\/dataset\/|\/dataset\/search|datasetZoom/.test(resposta.url())) return;
        errosDoErp.push(`HTTP ${resposta.status()} em ${resposta.url().replace(/\?.*$/, '').split('/').pop()}`);
      } catch {
        // resposta já descartada pelo navegador — ignora
      }
    };
    page.on('response', ouvir);
    try {
      await medicao.goto();
      await medicao.expectAberto();
      const tentativa = await tentarComAlternativa(() => medicao.montarMedicaoComSaldoEmAberto(fornecedor));
      if (!tentativa.serviu) {
        descartes.push(`${rotulo}: ${tentativa.motivo}`);
        return false;
      }
      resultado = tentativa.valor;
      if (resultado.sucesso) return true;
      for (const t of resultado.tentativas) descartes.push(`${rotulo} / competência ${t.competencia}: ${t.mensagem}`);
      return false;
    } catch (erro) {
      // Já classificado como pré-condição (banner detectado dentro do Page Object): registra e segue.
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      if (/PRÉ-CONDIÇÃO AUSENTE/.test(mensagem)) {
        descartes.push(`${rotulo}: ${mensagem.split('\n')[0]}`);
        return false;
      }
      // Erro cru (um zoom sumiu do DOM, o formulário não abriu) ACOMPANHADO de 5xx do ERP = ambiente
      // saturado (`WFLYEJB0378`): vira descarte e a busca segue para o próximo fornecedor. Sem 5xx do
      // ERP, é erro real e sobe intacto — nunca se engole um defeito do produto.
      if (errosDoErp.length > 0) {
        descartes.push(
          `${rotulo}: ERP saturado durante a montagem (WFLYEJB0378 — ${errosDoErp.length} resposta(s) 5xx do ` +
            `Protheus: ${[...new Set(errosDoErp)].slice(0, 4).join('; ')}); "${mensagem.split('\n')[0]}"`,
        );
        return false;
      }
      throw erro;
    } finally {
      page.off('response', ouvir);
    }
  };

  // 1) O fornecedor designado, primeiro.
  if (await tentarFornecedor(FORNECEDOR_FATURAMENTO, `${FORNECEDOR_FATURAMENTO.nome} (${FORNECEDOR_FATURAMENTO.codigo}-${FORNECEDOR_FATURAMENTO.loja})`)) {
    return { resultado, tentados, descartes };
  }

  // 2) Contratos vigentes descobertos por dataset, pulando o próprio TOTVS S.A se reaparecer.
  const contratosDescobertos = /** @type {string[]} */ ([]);
  for (let i = 0; i < maxContratosDescobertos; i++) {
    const contrato = await descobrirContratoVigentePorDataset(page, { excluirContratos: contratosDescobertos });
    contratosDescobertos.push(contrato.contrato);
    const fornecedor = parseFornecedorDaGrade(contrato.fornecedor);
    if (fornecedoresParaMedicao([fornecedor]).length === 1) continue; // é o próprio TOTVS S.A, já tentado
    if (await tentarFornecedor(fornecedor, contrato.contrato)) break;
  }

  return { resultado, tentados, descartes };
}

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
 * Rótulos de competência que o zoom oferece para um contrato, **sem filtrar nada**.
 *
 * Existe separado de `descobrirCompetenciaBloqueada` de propósito: aquela função descarta o
 * que não casa com `^\d{2}-\d{4}$` (o sentinela "Contrato não localizado" vem por ali), e é
 * exatamente esse descarte silencioso que faz um rótulo malformado — `062025`, sem separador,
 * a forma do FSWTBC-2143 — passar despercebido. Para auditar o formato é preciso ver o cru.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ contrato: string, filial: string }} alvo
 * @returns {Promise<string[]>}
 */
export async function listarCompetenciasBrutas(page, alvo) {
  const zoom = {
    searchField: 'COMPETENCIA',
    filterFields: ['CNA_CONTRA', alvo.contrato, 'FILIAL', codigoDaFilial(alvo.filial)],
    resultFields: ['COMPETENCIA'],
    datasetId: 'ds_fatcon_get_competencia',
  };
  const resposta = await page.request.get(
    `/ecm/api/rest/ecm/dataset/datasetZoom/${encodeURIComponent(JSON.stringify(zoom))}` +
      '?limit=300&offset=0&orderby=COMPETENCIA_ASC',
  );
  if (!resposta.ok()) return [];
  return /** @type {any[]} */ ((await resposta.json())?.content ?? []).map((c) =>
    String(c.COMPETENCIA ?? ''),
  );
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
