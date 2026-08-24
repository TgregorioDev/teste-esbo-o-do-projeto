// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';
import { FavoritosPage, escolherCandidatoParaEsteWorker } from '../../../pages/FavoritosPage.js';

/**
 * Favoritar um processo e acessá-lo por Favoritos (CT-PLT-05-H). @destrutivo
 *
 * Escreve estado de conta (favorito é preferência da conta TOTVS-FS, sem tabela de negócio
 * do cliente envolvida) — autorizado por `docs/politica-de-escrita.md`.
 *
 * ## Por que este caso já foi removido uma vez, e o que muda aqui
 *
 * Favorito é estado GLOBAL de conta única. Uma implementação anterior usava
 * `test.describe.configure({ mode: 'serial' })` para evitar que duas instâncias do MESMO
 * teste (via `--repeat-each`) disputassem o mesmo processo — mas serial só ordena os testes
 * DENTRO de um arquivo/worker; não impede que repetições concorrentes (`--repeat-each` com
 * `--workers` > 1, ou duas repetições em workers diferentes) toquem o mesmo processo ao
 * mesmo tempo. Resultado: falso vermelho não determinístico.
 *
 * A correção aqui é de DESENHO, não de timing: cada instância do teste calcula, de forma
 * determinística a partir de `testInfo.parallelIndex`/`testInfo.repeatEachIndex`, um
 * processo DIFERENTE dentre os candidatos "seguros" do catálogo (ver
 * `escolherCandidatoParaEsteWorker` em `pages/FavoritosPage.js`) — instâncias concorrentes da
 * mesma execução nunca disputam o mesmo processo. Como reforço (não como mecanismo
 * principal), o teste também é idempotente e tolerante ao estado inicial: só favorita se
 * ainda não estiver favoritado, e só desfavorita no teardown se foi ele quem favoritou.
 *
 * Medido com `--repeat-each=3 --workers=2` (ver relatório da implementação) — 6 instâncias
 * concorrentes, candidatos suficientes no catálogo para não colidir.
 */
test.describe('Plataforma — favoritar processo e acessar por Favoritos (CT-PLT-05-H) @destrutivo', () => {
  test('favoritar um processo deve torná-lo acessível pelo widget "Processos favoritos" da Home', async ({
    page,
  }, testInfo) => {
    const favoritosPage = new FavoritosPage(page);

    await favoritosPage.abrirCatalogo();
    const candidatos = await favoritosPage.listarCandidatosSeguros();
    const processId = escolherCandidatoParaEsteWorker(candidatos, testInfo);

    const jaEstavaFavoritadoAntes = await favoritosPage.estaFavoritado(processId);

    try {
      await favoritosPage.favoritar(processId);
      await expect(
        favoritosPage.estrelaDoProcesso(processId),
        `processo "${processId}" deveria estar marcado como favorito após o clique`,
      ).toHaveAttribute('data-favorite-process', 'true');

      await favoritosPage.abrirHome();
      await expect(
        favoritosPage.linhaDoProcessoFavorito(processId),
        `widget "Processos favoritos" da Home deveria listar "${processId}" após favoritá-lo`,
      ).toBeVisible();

      await favoritosPage.abrirProcessoPorFavoritos(processId);
      expect(
        page.url(),
        'acessar o processo por Favoritos deveria navegar para a tela de movimentação dele',
      ).toContain(`processID=${processId}`);
      await expect(page).toHaveTitle('Cassi - Fluig Plataforma - Movimentar Solicitação');
    } finally {
      // Idempotente e tolerante ao estado inicial: só desfaz o que este teste efetivamente
      // causou — nunca desfavorita um processo que já estava favoritado antes dele.
      if (!jaEstavaFavoritadoAntes) {
        await favoritosPage.abrirCatalogo();
        await favoritosPage.desfavoritar(processId);
        await expect(favoritosPage.estrelaDoProcesso(processId)).toHaveAttribute(
          'data-favorite-process',
          'false',
        );
      }
    }
  });
});
