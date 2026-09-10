// @ts-check
/**
 * Canário do ambiente: o que está de pé AGORA, antes de gastar meia hora de execução.
 *
 * ## Por que existe
 *
 * Nesta suíte, a maior parte dos vermelhos de uma execução ruim conta a MESMA história: uma
 * tela não publicada, uma integração fora do ar, uma fila sem massa. Medido em 09/09/2026 no
 * `caixade213859`: de 117 vermelhos classificados como ambiente, **89 vinham de dois
 * problemas** — o portal de Acompanhamento de Contratos não publicado (61) e os formulários de
 * SC e Cotação sem ERP (28). Ler isso exige rodar a suíte inteira e depois agregar o relatório.
 *
 * Este script responde em ~1 minuto, ANTES: diz o que está de pé, o que não está, e quantos
 * testes cada queda tende a arrastar. Não substitui a execução — evita que ela seja
 * interpretada errado.
 *
 * ## O que ele NÃO faz
 *
 * Não decide por você. Sai com código 0 mesmo com tudo caído: a suíte continua rodando e
 * classificando cada caso, que é o comportamento correto (um `PRÉ-CONDIÇÃO AUSENTE` bem
 * escrito vale mais que uma execução abortada). Sai com 1 só quando não consegue autenticar —
 * aí não há o que medir.
 *
 * Uso: `npm run canario`
 */
import dotenv from 'dotenv';
import { chromium } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { ARQUIVO_AUTENTICACAO } from '../fixtures/global-setup.js';
import { verificarServicoErp } from '../utils/servico-erp.js';

dotenv.config({ path: process.env.ENV_FILE ?? '.env.test', quiet: true });

const BASE = process.env.BASE_URL;
if (!BASE) {
  console.error('BASE_URL não definida — confira o .env.test.');
  process.exit(1);
}

/**
 * Rotas verificadas.
 *
 * Cada uma declara DOIS sinais, e o veredito sai de quem aparecer primeiro:
 *
 * - `sinalDeQueda` — a evidência de que a tela não serve para nada (página não publicada,
 *   faixa de erro do ERP);
 * - `sinalDeVida` — a evidência de que ela montou.
 *
 * A primeira versão deste script lia o texto UMA vez, 20s depois de navegar, e deu "ok" para o
 * formulário da SC com o ERP fora: naquele instante o iframe do card ainda estava vazio (467
 * caracteres capturados, contra os 733 que ele tem quando monta). Ler por condição, e não por
 * relógio, é a mesma disciplina que a suíte cobra dos testes — o canário não podia ser exceção.
 */
const SUPERFICIES = [
  {
    nome: 'Acompanhamento de Contratos',
    rota: '/portal/p/1/acompanhamentoContrato',
    arrasta: '~61 testes (todo o diretório acompanhamento-contratos + Faturamento)',
    sinalDeQueda: { padrao: /Recurso não foi encontrado/i, veredito: 'PÁGINA NÃO PUBLICADA' },
    sinalDeVida: /Mostrando de \d+|Acompanhamento de Contratos/i,
  },
  {
    nome: 'Formulário de Solicitação de Compras',
    rota: '/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras',
    arrasta: '~20 testes (criação, integração, rateio, validações da SC)',
    sinalDeQueda: { padrao: /comunica[çc][ãa]o com o ERP/i, veredito: 'ERP FORA' },
    sinalDeVida: /Identificação da Entidade|Justificativa para a Solicitação/i,
  },
  {
    nome: 'Formulário de Cotação',
    rota: '/portal/p/1/pageworkflowview?processID=wf_cotacao_produtos_servicos',
    arrasta: '~4 testes (ciclo e abertura de cotação)',
    sinalDeQueda: { padrao: /comunica[çc][ãa]o com o ERP/i, veredito: 'ERP FORA' },
    sinalDeVida: /Lista de Produtos|Informações do Fornecedor/i,
  },
  {
    nome: 'Portal do Comprador',
    rota: '/portal/p/1/portal-do-comprador',
    arrasta: '~10 testes (filas de cotação e Validação Inicial)',
    sinalDeQueda: { padrao: /Recurso não foi encontrado/i, veredito: 'PÁGINA NÃO PUBLICADA' },
    sinalDeVida: /Acesso Rápido/i,
  },
  {
    nome: 'Gerência de Compras',
    rota: '/portal/p/1/gerenciaCompras',
    arrasta: '~5 testes (distribuição de comprador)',
    sinalDeQueda: { padrao: /Recurso não foi encontrado/i, veredito: 'PÁGINA NÃO PUBLICADA' },
    sinalDeVida: /Gerência de Compras/i,
  },
  {
    nome: 'Tracker de Compras/Contratos',
    rota: '/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS',
    arrasta: '~7 testes (consultas de SC e Faturamento)',
    sinalDeQueda: { padrao: /Recurso não foi encontrado/i, veredito: 'PÁGINA NÃO PUBLICADA' },
    sinalDeVida: /Filtros/i,
  },
];

/**
 * Lê o texto da página e de todos os seus iframes.
 * @param {import('@playwright/test').Page} pagina
 * @returns {Promise<string>}
 */
async function lerTextoCompleto(pagina) {
  let texto = ((await pagina.locator('body').innerText().catch(() => '')) || '').replace(/\s+/g, ' ');
  for (const frame of pagina.frames()) {
    const doFrame = await frame.evaluate(() => document.body?.innerText ?? '').catch(() => '');
    if (doFrame.length > 40) texto += ' ' + doFrame.replace(/\s+/g, ' ');
  }
  return texto;
}

/**
 * Datasets que dizem se há massa de negócio, além de a integração responder.
 *
 * ⚠️ HTTP 200 não é sinal de saúde aqui. `dsProtheus_getCompradores_restGetAll` responde 200
 * com UMA linha cujo conteúdo é `{"error": "undefined", "fields": "Y1_FILIAL,..."}` — é a
 * forma que este dataset dá para "não resolvi o `Y1_USER` do usuário". Contar essa linha como
 * dado fazia o canário dizer "ok" para o bloqueio-raiz de 167 casos do catálogo.
 */
const DATASETS = [
  { nome: 'Filiais', id: 'dsProtheus_getBranches_restGetAll' },
  { nome: 'Contratos (filial default)', id: 'dsProtheus_getContratos_restGetAll' },
  {
    nome: 'Contratos (CASSI SEDE 5303)',
    id: 'dsProtheus_getContratos_restGetAll',
    constraints: [
      { _field: 'CorporateId', _initialValue: '01', _finalValue: '01', _type: 1, fieldType: 'MUST' },
      { _field: 'BranchId', _initialValue: '5303', _finalValue: '5303', _type: 1, fieldType: 'MUST' },
    ],
  },
  { nome: 'Fornecedores', id: 'dsProtheus_getFornecedores_restGetAll' },
  { nome: 'Compradores', id: 'dsProtheus_getCompradores_restGetAll' },
];

async function main() {
  if (!existsSync(ARQUIVO_AUTENTICACAO)) {
    console.error(
      `Estado de sessão não encontrado em ${ARQUIVO_AUTENTICACAO}.\n` +
        'Rode qualquer execução da suíte uma vez (o globalSetup grava o arquivo) e repita.',
    );
    process.exit(1);
  }

  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({
    storageState: JSON.parse(readFileSync(ARQUIVO_AUTENTICACAO, 'utf8')),
    locale: 'pt-BR',
    baseURL: BASE,
  });
  const pagina = await contexto.newPage();

  console.log(`\nCanário do ambiente — ${BASE}\n${'='.repeat(72)}`);

  // Primeira pergunta, e a mais barata: o serviço do ERP responde? É a mesma que o
  // `globalSetup` faz para decidir se deixa a execução começar — aqui ela só informa, porque o
  // canário nunca decide por você (ver a doc no topo deste arquivo).
  const servico = await verificarServicoErp(pagina);
  console.log(
    `[${servico.noAr ? '  ok  ' : ' FORA '}] ${('Serviço do ERP (' + servico.servico + ')').padEnd(38)} ` +
      `${servico.noAr ? '' : servico.descricao + (servico.detalhe ? ' — ' + servico.detalhe : '')}`,
  );
  if (!servico.noAr) {
    console.log(
      '         Com ele fora, NADA de Compras funciona no Fluig e o `globalSetup` aborta a\n' +
        '         execução (escape: PULAR_GATE_ERP=1).',
    );
  }
  console.log(`${'-'.repeat(72)}`);

  /** @type {Array<{nome: string, veredito: string, arrasta: string}>} */
  const resultados = [];

  for (const superficie of SUPERFICIES) {
    let texto = '';
    let veredito = 'INDEFINIDO';
    try {
      await pagina.goto(superficie.rota, { waitUntil: 'domcontentloaded', timeout: 60_000 });

      // Decide por CONDIÇÃO: quem aparecer primeiro — a evidência de queda ou a de vida. O
      // prazo é generoso porque este ambiente monta telas em 14–18s quando está sozinho, mas
      // ele quase nunca é pago por inteiro: o veredito costuma sair em segundos.
      const limite = Date.now() + 45_000;
      while (Date.now() < limite) {
        texto = await lerTextoCompleto(pagina);
        if (superficie.sinalDeQueda.padrao.test(texto)) {
          veredito = superficie.sinalDeQueda.veredito;
          break;
        }
        if (superficie.sinalDeVida.test(texto)) {
          veredito = 'ok';
          break;
        }
        await pagina.waitForTimeout(2_000);
      }
      if (veredito === 'INDEFINIDO') veredito = 'NÃO MONTOU';
    } catch (erro) {
      texto = `FALHA DE NAVEGAÇÃO: ${erro instanceof Error ? erro.message.split('\n')[0] : erro}`;
      veredito = 'INACESSÍVEL';
    }

    if (process.env.CANARIO_DEBUG) {
      console.log(`   [debug] ${superficie.nome}: ${texto.length} chars, trecho="${texto.slice(0, 110)}"`);
    }
    resultados.push({ nome: superficie.nome, veredito, arrasta: superficie.arrasta });

    const marca = veredito === 'ok' ? '  ok  ' : ' FORA ';
    console.log(`[${marca}] ${superficie.nome.padEnd(38)} ${veredito === 'ok' ? '' : veredito}`);
  }

  console.log(`${'-'.repeat(72)}\nMassa de negócio (datasets do ERP)`);
  await pagina.goto('/portal/p/1/home', { waitUntil: 'domcontentloaded' });
  for (const dataset of DATASETS) {
    const resposta = await pagina.evaluate(async ({ nome, constraints }) => {
      const r = await fetch('/api/public/ecm/dataset/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nome, fields: [], constraints: constraints ?? [], order: [] }),
      });
      const corpo = await r.text();
      try {
        const json = JSON.parse(corpo);
        const valores = json.content?.values ?? [];
        // Uma linha com a chave `error` é a forma de "não consegui resolver", não dado.
        const linhaDeErro = valores.length === 1 && valores[0] && 'error' in valores[0];
        return {
          status: r.status,
          linhas: linhaDeErro ? 0 : valores.length,
          erro: linhaDeErro ? String(valores[0].error).slice(0, 40) : null,
        };
      } catch {
        return { status: r.status, linhas: -1, erro: 'resposta não é JSON' };
      }
    }, { nome: dataset.id, constraints: dataset.constraints });

    const ok = resposta.status === 200 && resposta.linhas > 0;
    console.log(
      `[${ok ? '  ok  ' : ' FORA '}] ${dataset.nome.padEnd(38)} ` +
        `HTTP ${resposta.status}, ${resposta.linhas} linha(s)` +
        (resposta.erro ? ` — dataset devolveu erro: "${resposta.erro}"` : ''),
    );
  }

  const fora = resultados.filter((r) => r.veredito !== 'ok');
  console.log(`${'='.repeat(72)}`);
  if (fora.length === 0) {
    console.log('Todas as superfícies verificadas responderam. Execução pode ser lida ao pé da letra.\n');
  } else {
    console.log('O que a execução vai arrastar por causa do ambiente:\n');
    for (const r of fora) console.log(`  · ${r.nome}: ${r.arrasta}`);
    console.log(
      '\nEsses vermelhos serão `PRÉ-CONDIÇÃO AUSENTE` e o gate os classifica como ambiente.\n' +
        'Não são regressão — ver docs/estabilidade-do-ambiente.md.\n',
    );
  }

  await navegador.close();
}

main().catch((erro) => {
  console.error('Canário não conseguiu concluir:', erro);
  process.exit(1);
});
