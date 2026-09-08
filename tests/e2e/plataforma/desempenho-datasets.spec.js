// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';

/**
 * FSWTBC-4178 — carga de uma rota não pode disparar uma consulta de dataset por linha.
 *
 * O chamado relata 400+ requisições ao abrir a tela: o padrão N+1 clássico, uma chamada de
 * dataset por registro da grade. É o tipo de defeito que ninguém percebe em base pequena e que
 * derruba a tela quando a base cresce.
 *
 * **O defeito NÃO reproduz hoje** — e isso é parte do resultado, não motivo para não ter teste.
 * Medido em 08/09/2026:
 *
 *   /portal/p/1/acompanhamentoContrato  → 4 POST de dataset (com ~845 linhas na grade)
 *   /portal/p/1/portal-do-comprador     → 2
 *   /portal/p/1/gerenciaCompras         → 0
 *   /portal/p/1/home                    → 0
 *
 * Ou seja: a correção está de pé. Este teste é a **guarda** que impede a reintrodução — se
 * alguém voltar a consultar dataset dentro do laço da grade, o número explode e o teste reprova
 * na hora, com o nome do dataset repetido no erro.
 *
 * Limite de sensibilidade, declarado para não iludir quem lê o verde: a guarda só é forte nas
 * rotas cuja grade TEM linhas. O Acompanhamento de Contratos carrega centenas e por isso é o
 * caso mais valioso aqui; nas filas do Portal do Comprador, vazias para a conta de automação,
 * um N+1 não se manifestaria. A anotação de cada rota registra quantas linhas havia.
 *
 * Tudo é leitura: as rotas são apenas abertas.
 */

/** Endpoint único por onde TODO dataset do Fluig é executado. */
const ENDPOINT_DATASET = '/api/public/ecm/dataset/datasets';

/**
 * Teto de chamadas de dataset na carga de uma rota.
 *
 * Medido: o pior caso hoje são 4. O teto de 15 absorve variação legítima (um combo a mais, uma
 * releitura) e ainda assim denuncia N+1, que produz dezenas ou centenas.
 */
const TETO_POR_ROTA = 15;

const ROTAS = [
  '/portal/p/1/acompanhamentoContrato',
  '/portal/p/1/portal-do-comprador',
  '/portal/p/1/gerenciaCompras',
  '/portal/p/1/home',
];

test.describe('Desempenho — consultas de dataset na carga da tela (FSWTBC-4178)', () => {
  for (const rota of ROTAS) {
    test(`a carga de ${rota} não dispara consulta de dataset por linha`, async ({ page }) => {
      /** @type {string[]} */
      const datasetsChamados = [];

      page.on('request', (req) => {
        if (req.method() !== 'POST' || !req.url().includes(ENDPOINT_DATASET)) return;
        let nome = '(sem nome no corpo)';
        try {
          nome = JSON.parse(req.postData() ?? '{}').name ?? nome;
        } catch {
          // corpo não-JSON: o nome fica como está; o que importa é a CONTAGEM
        }
        datasetsChamados.push(nome);
      });

      await page.goto(rota, { waitUntil: 'domcontentloaded' });

      // A carga do widget é assíncrona: esperar a rede aquietar é o que separa "a tela terminou
      // de pedir dados" de "ainda está pedindo". `networkidle` é aceitável aqui porque a
      // asserção É sobre o tráfego — não é espera arbitrária por conteúdo.
      await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {
        // rota que mantém conexão aberta (polling) nunca aquieta; a contagem até aqui já serve
      });

      const porNome = datasetsChamados.reduce((acc, nome) => {
        acc[nome] = (acc[nome] ?? 0) + 1;
        return acc;
      }, /** @type {Record<string, number>} */ ({}));

      const linhasNaGrade = await page.locator('table tbody tr').count();

      test.info().annotations.push({
        type: 'datasets-na-carga',
        description:
          `${rota}: ${datasetsChamados.length} chamada(s) de dataset, ` +
          `${Object.keys(porNome).length} distinto(s), com ${linhasNaGrade} linha(s) na grade. ` +
          `Detalhe: ${JSON.stringify(porNome)}`,
      });

      // Repetição do MESMO dataset é a assinatura do N+1 — mais específica que o total, e é o
      // que aponta o culpado direto no erro.
      const repetidos = Object.entries(porNome)
        .filter(([, n]) => n > 3)
        .map(([nome, n]) => `${nome} × ${n}`);

      expect(
        repetidos,
        `dataset(s) consultado(s) repetidamente na carga de ${rota} — assinatura de consulta ` +
          `dentro do laço da grade (${linhasNaGrade} linha(s) renderizada(s))`,
      ).toEqual([]);

      expect(
        datasetsChamados.length,
        `a carga de ${rota} disparou ${datasetsChamados.length} consultas de dataset ` +
          `(teto: ${TETO_POR_ROTA}). Detalhe: ${JSON.stringify(porNome)}`,
      ).toBeLessThanOrEqual(TETO_POR_ROTA);
    });
  }
});
