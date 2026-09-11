// @ts-check
import { test } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { comExclusividade } from './exclusividade.js';
import { faltaPreCondicao } from './pre-condicao.js';

/**
 * Contratos vigentes lidos por DATASET do ERP — a fonte que não depende da grade do Portal de
 * Acompanhamento de Contratos.
 *
 * ## Por que existe
 *
 * `utils/massa-contratos.js` escolhia contrato lendo a grade do Acompanhamento. A grade é
 * superfície de OUTRO portal, e ficou fora do ar de 09 a 11/09/2026 — levando junto testes que só
 * precisavam de "um contrato vigente", como os de Faturamento. É a etapa 3 de
 * `docs/plano-de-evolucao-2026-09-11.md`: a grade fica para os testes da grade.
 *
 * ## A consulta, medida em 11/09/2026
 *
 * `dsProtheus_getContratos_restGetAll` escopado por `CorporateId=01` + `BranchId=<filial>` — sem o
 * par, o dataset responde só a filial default (1101), e foi essa leitura que virou "a base não tem
 * contrato". As filiais vêm de `dsProtheus_getBranches_restGetAll` (71). Cada contrato já traz
 * `CN9_XCODFO`/`CN9_XLOJAF`, o código e a loja do fornecedor: dos 564 vigentes, nenhum veio sem eles.
 * Detalhe em `docs/investigacoes/contratos-rota-alternativa.md` §3.4.
 *
 * ## O custo, e por isso o cache
 *
 * Varredura completa medida: 71 filiais em **149,5 s** com 8 consultas simultâneas; a mais lenta
 * levou 56 s trazendo 22 linhas — o custo é do servidor, não do volume. Varrer por teste é
 * inviável. A varredura roda uma vez, sob exclusividade entre workers, grava `ARQUIVO_DO_CACHE` e é
 * reaproveitada por `CONTRATOS_CACHE_HORAS` (padrão 6). Quem encontra o cache frio ganha o tempo da
 * varredura no próprio timeout.
 */

/** Onde a varredura fica guardada. `playwright/.cache/` é ignorado pelo git. */
export const ARQUIVO_DO_CACHE = 'playwright/.cache/contratos-vigentes.json';

/** `CN9_SITUAC` de contrato vigente (a grade mostrava "Vigente"; o dataset devolve o código cru). */
const SITUACAO_VIGENTE_ERP = '05';

/** Consultas simultâneas na varredura — a medida de 11/09/2026 (149,5 s). */
const CONCORRENCIA = 8;

/** Tempo que a varredura pode levar, somado ao timeout de quem a dispara ou espera por ela. */
const PRAZO_DA_VARREDURA = 240_000;

/** Campos da linha do dataset que a suíte usa — o resto (~150 colunas) não sai do navegador. */
const CAMPOS = ['CN9_NUMERO', 'CN9_FILIAL', 'CN9_REVISA', 'CN9_SITUAC', 'CN9_TPCTO', 'CN9_XCODFO', 'CN9_XLOJAF'];

/**
 * @typedef {import('../pages/AcompanhamentoContratosPage.js').LinhaDeContrato} LinhaDeContrato
 * @typedef {Object} VarreduraDeContratos
 * @property {LinhaDeContrato[]} linhas contratos vigentes, um por contrato
 * @property {number} filiais filiais consultadas
 * @property {string[]} filiaisComFalha `<filial>: <motivo>` das consultas que não responderam
 * @property {string} geradoEm ISO-8601
 */

/**
 * Converte linhas de `dsProtheus_getContratos_restGetAll` em `LinhaDeContrato`: só vigentes, uma
 * por contrato (a de maior revisão — o dataset devolve uma linha por revisão), e só com fornecedor.
 *
 * Diferenças para a grade, de propósito: `tipo` é o CÓDIGO (`CN9_TPCTO`), não a descrição; e
 * `fornecedor` sai no mesmo formato `"<código> - <loja>"` que `parseFornecedorDaGrade` já lê.
 *
 * @param {Array<Record<string, unknown>>} valores
 * @returns {LinhaDeContrato[]}
 */
export function mapearContratosVigentes(valores) {
  const texto = (/** @type {unknown} */ v) => String(v ?? '').trim();
  /** @type {Map<string, Record<string, unknown>>} */
  const porContrato = new Map();
  for (const v of valores) {
    if (texto(v.CN9_SITUAC) !== SITUACAO_VIGENTE_ERP) continue;
    if (!texto(v.CN9_NUMERO) || !texto(v.CN9_FILIAL)) continue;
    // Sem código e loja do fornecedor a medição não tem por onde começar (é o primeiro zoom).
    if (!texto(v.CN9_XCODFO) || !texto(v.CN9_XLOJAF)) continue;
    const chave = `${texto(v.CN9_NUMERO)}|${texto(v.CN9_FILIAL)}`;
    const atual = porContrato.get(chave);
    if (!atual || texto(v.CN9_REVISA) > texto(atual.CN9_REVISA)) porContrato.set(chave, v);
  }
  return [...porContrato.values()].map((v) => ({
    filial: texto(v.CN9_FILIAL),
    tipo: texto(v.CN9_TPCTO),
    contrato: texto(v.CN9_NUMERO),
    revisao: texto(v.CN9_REVISA),
    status: 'Vigente',
    fornecedor: `${texto(v.CN9_XCODFO)} - ${texto(v.CN9_XLOJAF)}`,
  }));
}

/**
 * Cache ainda válido, ou `null`.
 * @returns {VarreduraDeContratos | null}
 */
function lerCacheFresco() {
  if (!existsSync(ARQUIVO_DO_CACHE)) return null;
  const horas = Number(process.env.CONTRATOS_CACHE_HORAS ?? 6);
  try {
    const cache = /** @type {VarreduraDeContratos} */ (JSON.parse(readFileSync(ARQUIVO_DO_CACHE, 'utf8')));
    const idade = Date.now() - Date.parse(cache.geradoEm);
    return idade >= 0 && idade < horas * 3_600_000 && cache.linhas?.length > 0 ? cache : null;
  } catch {
    // Arquivo truncado por uma execução interrompida no meio da escrita: é "sem cache", e a
    // varredura seguinte o regrava. Nenhum veredito depende desta leitura.
    return null;
  }
}

/** Soma o prazo da varredura ao timeout do teste corrente, quando há teste e ele tem timeout. */
function estenderPrazoDoTeste() {
  try {
    const info = test.info();
    if (info.timeout > 0) info.setTimeout(info.timeout + PRAZO_DA_VARREDURA);
  } catch {
    // Fora de um teste (script de manutenção) não há timeout de teste a estender.
  }
}

/**
 * Varre as filiais no navegador (o WAF recusa `page.request` em parte das rotas) e devolve os
 * campos usados.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<VarreduraDeContratos>}
 */
async function varrer(page) {
  const bruto = await page.evaluate(
    async ({ concorrencia, campos }) => {
      /**
       * Consulta um dataset com retentativa de REDE (a queda momentânea da conexão com o tenant é
       * frequente); resposta ruim não é repetida — vira falha registrada da filial.
       * @param {string} name
       * @param {any[]} constraints
       * @returns {Promise<{ ok: boolean, motivo: string, values: any[] }>}
       */
      const consultar = async (name, constraints) => {
        for (let tentativa = 1; ; tentativa += 1) {
          try {
            const r = await fetch('/api/public/ecm/dataset/datasets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, fields: [], constraints, order: [] }),
            });
            if (!r.ok) return { ok: false, motivo: `HTTP ${r.status}`, values: [] };
            const values = (await r.json())?.content?.values ?? [];
            if (values.length === 1 && values[0] && 'error' in values[0]) {
              return { ok: false, motivo: String(values[0].error).slice(0, 80), values: [] };
            }
            return { ok: true, motivo: '', values };
          } catch (erro) {
            if (tentativa >= 3) return { ok: false, motivo: String(erro).slice(0, 80), values: [] };
            await new Promise((resolver) => setTimeout(resolver, 2_000 * tentativa));
          }
        }
      };

      const filiaisResp = await consultar('dsProtheus_getBranches_restGetAll', []);
      const filiais = filiaisResp.values.map((b) => String(b.Code ?? '').trim()).filter(Boolean);
      /** @type {string[]} */
      const falhas = filiaisResp.ok ? [] : [`(lista de filiais): ${filiaisResp.motivo}`];
      /** @type {any[]} */
      const valores = [];
      let proxima = 0;
      const trabalhador = async () => {
        while (proxima < filiais.length) {
          const filial = filiais[proxima++];
          const resposta = await consultar('dsProtheus_getContratos_restGetAll', [
            { _field: 'CorporateId', _initialValue: '01', _finalValue: '01', _type: 1, fieldType: 'MUST' },
            { _field: 'BranchId', _initialValue: filial, _finalValue: filial, _type: 1, fieldType: 'MUST' },
          ]);
          if (!resposta.ok) falhas.push(`${filial}: ${resposta.motivo}`);
          for (const linha of resposta.values) {
            valores.push(Object.fromEntries(campos.map((c) => [c, linha[c]])));
          }
        }
      };
      await Promise.all(Array.from({ length: concorrencia }, trabalhador));
      return { filiais: filiais.length, falhas, valores };
    },
    { concorrencia: CONCORRENCIA, campos: CAMPOS },
  );

  return {
    linhas: mapearContratosVigentes(bruto.valores),
    filiais: bruto.filiais,
    filiaisComFalha: bruto.falhas,
    geradoEm: new Date().toISOString(),
  };
}

/**
 * Contratos vigentes de todas as filiais, do cache quando fresco, senão por varredura.
 *
 * Declara PRÉ-CONDIÇÃO quando a varredura não traz vigente nenhum (serviço do ERP fora ou sem
 * dados) — e nesse caso não grava cache, para a próxima tentar de novo.
 *
 * @param {import('@playwright/test').Page} page página em alguma rota do portal
 * @returns {Promise<VarreduraDeContratos & { doCache: boolean }>}
 */
export async function lerContratosVigentesPorDataset(page) {
  const fresco = lerCacheFresco();
  if (fresco) return { ...fresco, doCache: true };

  estenderPrazoDoTeste();
  return comExclusividade(
    'varredura-contratos-por-dataset',
    async () => {
      // Outro worker pode ter varrido enquanto este esperava a vez.
      const recente = lerCacheFresco();
      if (recente) return { ...recente, doCache: true };

      const varredura = await varrer(page);
      if (varredura.linhas.length === 0) {
        faltaPreCondicao(
          `(ambiente): a varredura de ${varredura.filiais} filial(is) por dsProtheus_getContratos_restGetAll ` +
            'não trouxe contrato vigente com fornecedor' +
            (varredura.filiaisComFalha.length
              ? ` — ${varredura.filiaisComFalha.length} consulta(s) falharam: ${varredura.filiaisComFalha.slice(0, 6).join('; ')}`
              : '') +
            '. O serviço do ERP está fora ou sem dados.',
        );
      }
      mkdirSync(dirname(ARQUIVO_DO_CACHE), { recursive: true });
      writeFileSync(ARQUIVO_DO_CACHE, JSON.stringify(varredura));
      return { ...varredura, doCache: false };
    },
    { timeout: PRAZO_DA_VARREDURA, idadeMaxima: PRAZO_DA_VARREDURA + 60_000 },
  );
}
