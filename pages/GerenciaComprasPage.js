// @ts-check
import { faltaPreCondicao } from '../utils/pre-condicao.js';
import { esperarLinhasReais, ESTADO_VAZIO_DA_GRADE } from '../utils/grade.js';

/** Rota da página de Gerência de Compras. */
const ROTA_GERENCIA_COMPRAS = '/portal/p/1/gerenciaCompras';

/**
 * Gerência de Compras (`/portal/p/1/gerenciaCompras`).
 *
 * Duas abas: "Atribuir" (associa um comprador a uma SC) e "Transferir" (move a SC para
 * outro comprador). A suíte é somente leitura — nenhum teste clica nos botões de ação por
 * linha ("Transferir", "Transferir em Lote") nem preenche "Selecione um comprador".
 *
 * Particularidades observadas em campo (repetido em várias cargas de página):
 *
 * - Nenhuma das duas abas vem `aria-selected="true"` por padrão — o painel só aparece
 *   depois de um clique explícito na aba. As DUAS tabelas (uma por painel) já existem no
 *   DOM desde o início, mas ocultas; por isso a leitura é sempre pela tabela `:visible`.
 *
 * - **Defeito confirmado**: a grade da aba "Atribuir" nunca renderizou dados nos testes de
 *   campo (múltiplas cargas, até ~30s de observação, inclusive clicando na aba uma segunda
 *   vez) — fica presa em "Nenhum dado encontrado". A rede confirma que só duas chamadas a
 *   `ds_getSolicsGerenciaCompras` saem, ambas no carregamento da página (nenhuma nova sai ao
 *   clicar na aba); uma responde em poucos segundos e a outra em ~20-25s, mas mesmo depois
 *   de as duas responderem, a tabela de "Atribuir" continua vazia. A de "Transferir"
 *   carrega corretamente, só que devagar (~20-25s).
 */
export class GerenciaComprasPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.titulo = page.getByRole('heading', { name: 'Gerência de Compras' });
    this.abaAtribuir = page.getByRole('tab', { name: 'Atribuir' });
    this.abaTransferir = page.getByRole('tab', { name: 'Transferir' });
  }

  async goto() {
    await this.page.goto(ROTA_GERENCIA_COMPRAS, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Pré-condição: cabeçalho e as duas abas estão disponíveis.
   *
   * O prazo é 90s, e é escolha declarada. Esta é a página mais pesada da suíte neste ambiente:
   * acessada sozinha ela monta, mas com outros workers em paralelo passa dos 45s do padrão do
   * projeto. Aumentar aqui não mascara flakiness — os testes não oscilam, o servidor é que
   * degrada sob carga (o mesmo motivo de `workers: 3` no config, ver
   * `docs/mapa-do-ambiente.md`).
   *
   * Se nem em 90s montar, o veredito é de AMBIENTE: melhor dizer isso do que devolver um
   * timeout cru que se confunde com regressão.
   */
  async expectCarregada() {
    const montou = await this.titulo
      .waitFor({ state: 'visible', timeout: 90_000 })
      .then(() => this.abaAtribuir.waitFor({ state: 'visible', timeout: 90_000 }))
      .then(() => this.abaTransferir.waitFor({ state: 'visible', timeout: 90_000 }))
      .then(() => true)
      .catch(() => false);

    if (!montou) {
      faltaPreCondicao(
        '(ambiente): a Gerência de Compras não montou o cabeçalho e as abas em 90s. É a página ' +
          'mais pesada da suíte neste ambiente e degrada sob carga concorrente — não é ' +
          'regressão do produto.',
      );
    }
  }

  async abrirAbaAtribuir() {
    await this.abaAtribuir.click();
  }

  async abrirAbaTransferir() {
    await this.abaTransferir.click();
  }

  /**
   * Tabela do painel atualmente visível (a da aba ativa). As duas tabelas (Atribuir e
   * Transferir) existem sempre no DOM — só uma fica visível por vez.
   * @returns {import('@playwright/test').Locator}
   */
  getTabelaAtiva() {
    return this.page.locator('table:visible').first();
  }

  /**
   * Declara pré-condição quando a grade da aba ativa não chega a renderizar.
   *
   * Medido em 09/09/2026 no ambiente `caixade213859`: a página monta o cabeçalho e os rótulos
   * das abas, mas **as tabelas não aparecem** — três cargas seguidas, 90s cada, nenhuma tabela
   * no DOM. Uma hora antes, a mesma página devolvia 65 linhas em *Transferir*. É a oscilação da
   * integração descrita em `docs/estabilidade-do-ambiente.md`, e não um defeito da tela.
   *
   * Sem esta verificação o efeito é pior que um vermelho: o `@bug` da aba *Atribuir* (que
   * afirma que ela DEVERIA listar) passa ou reprova conforme a maré, e o relatório fica
   * dizendo coisas diferentes sobre o mesmo produto em execuções seguidas.
   *
   * @param {string} aba nome da aba, para a mensagem
   */
  async expectGradeDisponivel(aba) {
    const apareceu = await this.getTabelaAtiva()
      .waitFor({ state: 'visible', timeout: 45_000 })
      .then(() => true)
      .catch(() => false);

    if (!apareceu) {
      faltaPreCondicao(
        `(ambiente): a aba "${aba}" da Gerência de Compras não renderizou nenhuma tabela. A ` +
          'página monta o cabeçalho e os rótulos das abas, mas a grade não vem — a integração ' +
          'que a alimenta está oscilando neste ambiente (ver docs/estabilidade-do-ambiente.md).',
      );
    }
  }

  /**
   * Números de processo listados na aba ativa, na ordem da grade.
   *
   * A coluna "Processo" é a primeira com número — as outras duas numéricas da linha são
   * "Num SC" e "Grupos de Produto".
   *
   * @returns {Promise<string[]>}
   */
  async lerNumerosDeProcesso() {
    return this.getLinhasDaTabelaAtiva().evaluateAll((linhas) =>
      linhas
        .map((tr) => {
          const celulas = [...tr.querySelectorAll('td')].map((td) => (td.textContent ?? '').trim());
          return celulas.find((c) => /^\d{4,6}$/.test(c)) ?? '';
        })
        .filter(Boolean),
    );
  }

  /**
   * Quais dos processos listados estão de fato ABERTOS no servidor.
   *
   * ⚠️ Medido em 10/09/2026: a aba Atribuir listou 17 solicitações e **todas as 9 verificadas
   * estavam CANCELADAS** — encerradas em bloco às 10:25 de 09/09. O dataset que alimenta a
   * grade (`ds_getSolicsGerenciaCompras`, filtro `etapa,257`) devolve linhas com `END_DATE`
   * preenchido, ou seja, **não filtra instância encerrada**.
   *
   * Consequência para quem escreve teste aqui: "a grade tem linhas" NÃO significa "há SC
   * aguardando distribuição". Sem esta conferência, um teste se apoia em massa que não existe
   * mais e passa contando uma história falsa.
   *
   * A leitura é por `fetch` de dentro da página: `/process-management/**` leva 403 do WAF
   * quando chamado pelo contexto de requisição do Playwright.
   *
   * @param {string[]} processos
   * @returns {Promise<{ ativos: string[], encerrados: string[] }>}
   */
  async separarProcessosAtivos(processos) {
    return this.page.evaluate(async (ids) => {
      /** @type {{ ativos: string[], encerrados: string[] }} */
      const resultado = { ativos: [], encerrados: [] };
      for (const id of ids) {
        const resposta = await fetch(`/process-management/api/v2/requests/${id}`, {
          headers: { Accept: 'application/json' },
        });
        if (!resposta.ok) continue;
        const corpo = await resposta.json();
        if (corpo.active) resultado.ativos.push(id);
        else resultado.encerrados.push(`${id} (${corpo.status})`);
      }
      return resultado;
    }, processos);
  }

  /** Mensagem de grade vazia, dentro da tabela atualmente visível. */
  getMensagemSemDados() {
    return this.getTabelaAtiva().getByText(ESTADO_VAZIO_DA_GRADE);
  }

  /**
   * Espera a grade da aba ativa trazer linha REAL e devolve quantas são.
   *
   * A lógica (e a armadilha que ela evita) vive em `utils/grade.js`, porque vale para toda
   * grade deste produto — não só para esta tela.
   *
   * @param {number} [timeout]
   * @returns {Promise<number>}
   */
  async esperarLinhasReais(timeout = 45_000) {
    return esperarLinhasReais(this.getLinhasDaTabelaAtiva(), timeout);
  }

  /** Linhas de dados (exclui a linha de "Nenhum dado encontrado") da tabela visível. */
  getLinhasDaTabelaAtiva() {
    return this.getTabelaAtiva().locator('tbody tr');
  }
}
