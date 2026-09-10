// @ts-check
import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { envObrigatoria, TITULO_HOME } from '../config/ambiente.js';
import { LoginPage } from '../pages/LoginPage.js';
import { verificarServicoErp, explicarServicoFora } from '../utils/servico-erp.js';

export const ARQUIVO_AUTENTICACAO = 'playwright/.auth/usuario.json';

/** Locale da sessão. Precisa ser o mesmo dos testes: a tela de login é traduzida. */
export const LOCALE = 'pt-BR';

/**
 * Autentica uma vez e persiste o storageState para os projetos que não testam login.
 *
 * Reaproveita o `LoginPage` em vez de duplicar seletores — se a tela de login mudar,
 * há um único lugar para corrigir.
 *
 * Falha explicitamente quando a configuração está incompleta ou quando a autenticação não
 * conclui: setup silencioso produz uma suíte inteira falhando por motivo errado.
 *
 * O sinal de sucesso é o TÍTULO, não a URL — o Fluig serve o login na mesma URL da home.
 *
 * ## O portão do serviço do ERP
 *
 * Autenticar não basta. Antes de liberar a execução, este setup pergunta ao Fluig se o serviço
 * `apiRESTProtheusCompras` responde — e **aborta a execução inteira** se não responder. A regra
 * veio do desenvolvedor do projeto em 10/09/2026: *"tem que pedir para ele, antes de fazer os
 * teste, verificar se o serviço está no ar"*.
 *
 * A justificativa é a mesma que sustenta `docs/estabilidade-do-ambiente.md`: com o ERP fora,
 * **nada do módulo de Compras funciona no Fluig**, e uma execução completa custa dezenas de
 * minutos para produzir um relatório que mede a queda do serviço, não o produto. Pior: esse
 * relatório é lido como regressão por quem não estava aqui quando o serviço caiu.
 *
 * Abortar aqui é diferente de abortar por qualquer outro motivo. Um `PRÉ-CONDIÇÃO AUSENTE` por
 * teste continua sendo a resposta certa para massa faltando, tela não publicada e integração
 * intermitente — casos em que a execução ainda informa alguma coisa. Serviço do ERP fora não é
 * um desses: não sobra informação nenhuma para colher.
 *
 * Escape: `PULAR_GATE_ERP=1` roda mesmo com o serviço fora. Serve para quem quer exercitar as
 * suítes que não dependem de Compras (autenticação, plataforma, documentos, RH) sem esperar o
 * ambiente voltar.
 */
export default async function globalSetup() {
  const baseURL = envObrigatoria('BASE_URL');
  const usuario = envObrigatoria('QA_USERNAME');
  const senha = envObrigatoria('QA_PASSWORD');

  await mkdir(path.dirname(ARQUIVO_AUTENTICACAO), { recursive: true });

  const browser = await chromium.launch();

  try {
    // DUAS tentativas, e o motivo é medido: em 09/09/2026 o setup abortou execuções inteiras
    // porque o login não carregou (título vazio por 60s) numa das quedas de rede que este
    // ambiente tem em ondas — minutos depois, o mesmo host respondia em ~80ms. Uma execução
    // completa custa dezenas de minutos; perdê-la inteira por uma intermitência de segundos é
    // desperdício, e o erro que ela produz ("nenhum teste rodou") não diz nada sobre o produto.
    //
    // Isto NÃO afrouxa o setup: se as duas tentativas falharem, o erro sobe igual e a suíte não
    // roda — que é o comportamento que este arquivo sempre teve, e por bom motivo.
    const tentativas = 2;
    /** @type {import('@playwright/test').BrowserContext | null} */
    let contextoAutenticado = null;
    /** @type {import('@playwright/test').Page | null} */
    let paginaAutenticada = null;

    for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
      const context = await browser.newContext({ baseURL, locale: LOCALE });
      const page = await context.newPage();
      try {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.expectLoaded();
        await loginPage.autenticar(usuario, senha);

        // Condição real do sistema — nunca espera por tempo
        await expect(page).toHaveTitle(TITULO_HOME, { timeout: 60_000 });

        await context.storageState({ path: ARQUIVO_AUTENTICACAO });
        contextoAutenticado = context;
        paginaAutenticada = page;
        break;
      } catch (erro) {
        await context.close();
        if (tentativa === tentativas) throw erro;
        console.warn(
          `[setup] autenticação falhou na tentativa ${tentativa}/${tentativas}; repetindo. ` +
            `Motivo: ${erro instanceof Error ? erro.message.split('\n')[0] : String(erro)}`,
        );
      }
    }

    // O portão fica FORA do laço de propósito. Dentro dele, a queda do serviço era capturada
    // pelo `catch` da autenticação: a suíte refazia o login inteiro e anunciava "autenticação
    // falhou", que é falso e manda quem lê investigar o lugar errado. Retentar autenticação faz
    // sentido (a rede deste ambiente oscila); retentar um serviço que respondeu "está fora", não.
    if (!paginaAutenticada || !contextoAutenticado) throw new Error('[setup] autenticação não produziu sessão.');
    try {
      await conferirServicoDoErp(paginaAutenticada);
    } finally {
      await contextoAutenticado.close();
    }
  } finally {
    await browser.close();
  }
}

/**
 * Portão: consulta o serviço do ERP e **derruba a execução** se ele estiver fora.
 *
 * Lançar aqui é o que mata a run — o Playwright não roda nenhum teste quando o `globalSetup`
 * falha. É deliberado, e a mensagem diz o motivo com a evidência crua junto, para ninguém
 * precisar reproduzir a chamada à mão.
 *
 * @param {import('@playwright/test').Page} page página já autenticada
 */
async function conferirServicoDoErp(page) {
  if (process.env.PULAR_GATE_ERP) {
    console.warn(
      '[setup] PULAR_GATE_ERP definido — a execução segue SEM confirmar o serviço do ERP.\n' +
        '        Vermelhos de Compras a partir daqui podem ser queda de ambiente, não defeito.',
    );
    return;
  }

  const veredito = await verificarServicoErp(page);

  if (!veredito.noAr) {
    throw new Error(
      `[setup] EXECUÇÃO ABORTADA — ${explicarServicoFora(veredito)}\n` +
        '\nQuando o serviço voltar, repita o comando. Para rodar assim mesmo (suítes que não ' +
        'dependem de Compras): PULAR_GATE_ERP=1 npx playwright test',
    );
  }

  console.log(`[setup] serviço do ERP no ar — ${veredito.descricao}`);
}
