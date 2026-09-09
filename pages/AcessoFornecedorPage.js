// @ts-check
import { fakerPT_BR as faker } from '@faker-js/faker';
import { PortalFornecedorPage } from './PortalFornecedorPage.js';

/** Rota de redefinição de senha do fornecedor — o link enviado por e-mail aponta pra cá. */
const ROTA_REDEFINIR_SENHA = '/portal/p/1/portal_fornecedores_senha';

/** Endpoint de autenticação do formulário "Acesso Normal"/"Acesso Administrador". */
/**
 * Endpoint de autenticação do fornecedor.
 *
 * MUDOU neste ambiente (medido em 09/09/2026): a landing agora chama
 * `/java_gestao_contrato/rest-acesso/request/loginV2`. O caminho antigo
 * (`/cassi_rest/api/rest/cassi/administrador/1/login`) fica na lista porque o que identifica a
 * chamada é o que ela FAZ — e um teste que espera por um caminho que a tela não usa mais fica
 * pendurado até o timeout, sem dizer o motivo.
 */
const ROTAS_LOGIN = [
  '/java_gestao_contrato/rest-acesso/request/loginV2',
  '/cassi_rest/api/rest/cassi/administrador/1/login',
];

/** Endpoint que efetiva a troca de senha a partir do link de redefinição. */
const ROTA_REDEFINIR_SENHA_PUT = '/cassi_rest/api/rest/cassi/compras/1/redefinirPassPUT';

/**
 * Autenticação e redefinição de senha do Portal do Fornecedor
 * (`/portal/p/1/portal_fornecedor`, `/portal/p/1/portal_fornecedores_v2`,
 * `/portal/p/1/portal_fornecedores_senha`).
 *
 * Complementa `PortalFornecedorPage` (que cobre só a LEITURA da landing e dos formulários,
 * sem nunca submeter) com os fluxos que SUBMETEM credencial/token — sempre com dado
 * fabricado que a plataforma rejeita, nunca com credencial real de fornecedor (que esta
 * suíte não possui, ver `docs/mapa-do-ambiente.md`).
 *
 * ## O que foi confirmado em campo (25/08/2026)
 *
 * **Acesso Normal com credencial inválida** — `POST .../administrador/1/login` responde
 * **401** com corpo texto simples `"Fornecedor não localizado!"` (sem stack trace). A tela
 * mostra DOIS avisos: um `alert` inline "Fornecedor não localizado!" e um `dialog "Ops!"`
 * modal com o texto genérico "Usuário ou senha inválido!" — o texto exposto ao usuário não
 * expõe detalhe técnico (sem classe de exceção, sem SQL, sem stack trace).
 *
 * **Redefinição de senha por link** — `/portal_fornecedores_senha?token=...&user=...`
 * carrega o formulário incondicionalmente (não valida o token no load, só no submit,
 * diferente da recuperação de senha da PLATAFORMA que valida via GET a cada carga). No
 * submit, `PUT .../compras/1/redefinirPassPUT` com token fabricado/adulterado responde
 * **500** com corpo `{"message": "...", "exception": "java.lang...."}` — um vazamento
 * técnico real na CAMADA DE REDE (ver defeito reportado). A TELA, porém, absorve isso e
 * mostra só um `alert` inline genérico "Senha não foi atualizada!"; a senha não é trocada.
 *
 * Os campos "Nova senha"/"Repetir Nova senha" desse formulário têm nome acessível quebrado
 * (o rótulo de um vaza para o outro, e o segundo fica sem nome algum — confirmado via aria
 * snapshot). Sem âncora de `role` estável, os três campos são localizados por `id`
 * (`#cgc`, `#password`, `#repassword`), que são estáticos no HTML do formulário, não
 * gerados dinamicamente.
 */
export class AcessoFornecedorPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.portal = new PortalFornecedorPage(page);

    // --- Acesso Normal / credencial inválida ---
    this.dialogCredencialInvalida = page.getByRole('dialog', { name: 'Ops!' });
    this.mensagemCredencialInvalida = this.dialogCredencialInvalida.getByText(
      'Usuário ou senha inválido!',
    );
    this.botaoOkCredencialInvalida = this.dialogCredencialInvalida.getByRole('button', {
      name: 'OK',
    });
    // ⚠️ Existe também um `alert` inline "Fornecedor não localizado!" — confirmado no CORPO
    // da resposta de rede (`POST .../administrador/1/login`, 401), mas o toast em tela é
    // TRANSIENTE: em execução real via Playwright ele já não está mais no DOM poucos
    // milissegundos após o clique (confirmado em 4 execuções seguidas). Não expor como
    // locator de asserção — assertar timing de toast é flakiness por definição. O sinal
    // estável e testável é o CORPO da resposta HTTP, não este elemento.

    // --- Redefinição de senha por link ---
    this.headingRedefinirSenha = page.getByRole('heading', {
      name: 'Bem vindo ao sistema de Compras e Contratos!',
    });
    this.campoCpfCnpjRedefinicao = page.locator('#cgc');
    this.campoNovaSenha = page.locator('#password');
    this.campoRepetirSenha = page.locator('#repassword');
    this.botaoAtualizarSenha = page.getByRole('button', { name: 'Atualizar senha' });
    this.alertaSenhaNaoAtualizada = page
      .getByRole('alert')
      .filter({ hasText: 'Senha não foi atualizada!' });
  }

  /**
   * Preenche e envia o login do fornecedor, aguardando a resposta REAL do endpoint de
   * autenticação — nunca tempo fixo.
   *
   * A tela mudou: não há mais "Acesso Normal" com CNPJ da empresa **e** CPF do usuário em
   * campos separados. A landing tem um login único de documento (`CPF/CNPJ`) + senha — ver
   * `PortalFornecedorPage`. Por isso o parâmetro é um `documento` só, e não o par.
   *
   * @param {{ documento: string, senha: string }} credencial
   * @returns {Promise<import('@playwright/test').Response>}
   */
  async tentarAcesso({ documento, senha }) {
    await this.portal.goto();
    await this.portal.expectCarregada();

    await this.portal.campoCpfCnpj.fill(documento);
    await this.portal.campoSenha.fill(senha);

    const [resposta] = await Promise.all([
      this.page.waitForResponse(
        (r) => r.request().method() === 'POST' && ROTAS_LOGIN.some((rota) => r.url().includes(rota)),
      ),
      this.portal.botaoEntrar.click(),
    ]);

    return resposta;
  }

  /**
   * Acessa a tela de redefinição de senha com um token (fabricado ou adulterado) na URL —
   * o mesmo formato do link que o Portal envia por e-mail.
   *
   * NÃO espera pelo heading: neste ambiente a página renderiza vazia (ver o `@bug` em
   * `acesso-fornecedor.spec.js`), e esperar por um elemento que não vem transformaria o
   * defeito num timeout de 45s sem explicação. Quem chama decide o que afirmar sobre o que
   * encontrou.
   *
   * @param {string} token
   * @param {string} identificador CPF/CNPJ associado ao pedido de redefinição
   */
  async irParaRedefinicaoComToken(token, identificador) {
    const url = `${ROTA_REDEFINIR_SENHA}?token=${encodeURIComponent(token)}&user=${encodeURIComponent(identificador)}`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('load').catch(() => {});
  }

  /**
   * Como `irParaRedefinicaoComToken`, mas exigindo que a tela tenha montado.
   *
   * @param {string} token
   * @param {string} identificador CPF/CNPJ associado ao pedido de redefinição
   */
  async abrirRedefinicaoComToken(token, identificador) {
    await this.irParaRedefinicaoComToken(token, identificador);
    await this.headingRedefinirSenha.waitFor({ state: 'visible' });
  }

  /**
   * Preenche e envia a redefinição, aguardando a resposta REAL do endpoint que efetiva a
   * troca de senha.
   *
   * @param {{ cpfCnpj: string, novaSenha: string }} dados
   * @returns {Promise<import('@playwright/test').Response>}
   */
  async submeterRedefinicaoDeSenha({ cpfCnpj, novaSenha }) {
    await this.campoCpfCnpjRedefinicao.fill(cpfCnpj);
    await this.campoNovaSenha.fill(novaSenha);
    await this.campoRepetirSenha.fill(novaSenha);

    const [resposta] = await Promise.all([
      this.page.waitForResponse(
        (r) => r.request().method() === 'PUT' && r.url().includes(ROTA_REDEFINIR_SENHA_PUT),
      ),
      this.botaoAtualizarSenha.click(),
    ]);

    return resposta;
  }
}

/**
 * CNPJ fictício com dígitos verificadores VÁLIDOS — passa na máscara/validação de formato
 * do formulário sem nunca coincidir, de forma dirigida, com empresa real. Sorteado a partir
 * da seed do faker (reproduzível via `FAKER_SEED`).
 *
 * Não existe geração de CNPJ nas factories já existentes do projeto (`factories/pessoa.js`
 * só cobre CPF); replicado aqui, dentro do arquivo permitido para esta suíte, seguindo o
 * mesmo algoritmo de dígito verificador já usado pelo projeto para CPF.
 *
 * @returns {string} 14 dígitos, sem máscara
 */
export function gerarCnpjFicticio() {
  /** @type {number[]} */
  const digits = Array.from({ length: 12 }, () => faker.number.int({ min: 0, max: 9 }));

  digits.push(cnpjCheckDigit(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]));
  digits.push(cnpjCheckDigit(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]));

  return digits.join('');
}

/**
 * @param {number[]} digits
 * @param {number[]} weights
 * @returns {number}
 */
function cnpjCheckDigit(digits, weights) {
  const sum = digits.reduce((total, digit, index) => total + digit * weights[index], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}
