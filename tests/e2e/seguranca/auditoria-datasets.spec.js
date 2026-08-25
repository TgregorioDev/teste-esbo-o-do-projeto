// @ts-check
import { test, expect } from '../../../fixtures/fixtures.js';

/**
 * CT-SEG-02-S1, CT-SEG-03-S1 e CT-SEG-04-S1 — auditoria de segurança que o documento de casos
 * marca como dependente de acesso admin (painel de datasets / lista de administradores). A conta
 * da automação é não-admin (`/webdesk` → 403, coberto em `tests/api/webdesk-acesso-admin.spec.js`
 * — não duplicado aqui).
 *
 * Investigação em campo mostrou uma via observável SEM admin para os três casos: o mesmo endpoint
 * público de dataset já usado no achado de vazamento do `colleague` (CT-SEG-01-S1)
 * — `GET /api/public/ecm/dataset/search?datasetId=...` — responde para QUALQUER dataset cujo
 * nome se conheça, não só os documentados no menu de administração. Isso é o que torna os três
 * casos abaixo auditáveis por uma sessão comum.
 */

test.describe('Segurança — auditoria de datasets sem acesso admin', () => {
  test('CT-SEG-02-S1: contas de integração/serviço não devem ter privilégio de administrador', async ({
    request,
  }) => {
    // O dataset `colleague` (já usado em CT-SEG-01-S1 para o vazamento de constraint) também
    // carrega a coluna `adminUser` — dá para contar admins e sinalizar contas de serviço sem
    // nunca abrir o painel de administração.
    const resposta = await request.get('/api/public/ecm/dataset/search', {
      params: { datasetId: 'colleague' },
    });
    expect(resposta.ok(), `status inesperado: ${resposta.status()}`).toBe(true);

    const corpo = /** @type {{ content: Array<{ login?: string, colleagueName?: string, adminUser?: string | boolean }> }} */ (
      await resposta.json()
    );
    const registros = corpo.content ?? [];

    // Padrões de login/nome de conta técnica/integração, tomados da descrição do achado U-13
    // (consumerKey, fluig_consumer_key, "Usuário/Usuario Integrador/Integração", "Integracao
    // Juridico"). Case-insensitive; "integr" cobre integrador/integração/integracao.
    const PADROES_CONTA_DE_SERVICO = ['consumerkey', 'consumer_key', 'fluig_consumer', 'integr'];

    let totalAdmins = 0;
    let adminsDeServico = 0;
    for (const registro of registros) {
      const ehAdmin = registro.adminUser === true || registro.adminUser === 'true';
      if (!ehAdmin) continue;
      totalAdmins += 1;

      // Usado só para casar o padrão nesta mesma iteração — nunca sai da função, nunca vai
      // para mensagem de assertion nem para o relatório.
      const alvo = `${registro.login ?? ''} ${registro.colleagueName ?? ''}`.toLowerCase();
      if (PADROES_CONTA_DE_SERVICO.some((padrao) => alvo.includes(padrao))) {
        adminsDeServico += 1;
      }
    }

    // Guarda contra falso-verde: resposta vazia não pode ser lida como "nenhum admin de serviço".
    expect(
      totalAdmins,
      'nenhum administrador encontrado no dataset — resposta vazia ou inesperada, não é evidência ' +
        'de conformidade.',
    ).toBeGreaterThan(0);

    // Só contagens na mensagem — nunca login, nunca nome.
    expect(
      adminsDeServico,
      `${adminsDeServico} de ${totalAdmins} administradores da plataforma têm login/nome ` +
        `compatível com conta de integração/serviço (padrões: ${PADROES_CONTA_DE_SERVICO.join(', ')}). ` +
        'Contas técnicas não deveriam ter privilégio de administrador de plataforma — menor ' +
        'privilégio violado. Ver CT-SEG-02-S1 / achado U-13.',
    ).toBe(0);
  });

  test('CT-SEG-03-S1: dataset de credencial de integração não deve ser legível por sessão sem privilégio admin', async ({
    request,
  }) => {
    // ⚠️ Este teste NUNCA lê nem registra o conteúdo do dataset — só existência e metadados
    // estruturais (quantidade de registros e de colunas). Se o conteúdo vier na resposta, ele é
    // descartado sem ser inspecionado além de `Object.keys()`.
    const resposta = await request.get('/api/public/ecm/dataset/search', {
      params: { datasetId: 'ds_Fluig' },
    });

    const status = resposta.status();
    let qtdRegistros = null;
    let qtdColunas = null;
    if (status === 200) {
      const corpo = /** @type {{ content?: unknown }} */ (await resposta.json());
      const registros = Array.isArray(corpo.content) ? corpo.content : [];
      qtdRegistros = registros.length;
      const primeiro = registros[0];
      qtdColunas =
        primeiro && typeof primeiro === 'object' ? Object.keys(primeiro).length : 0;
    }

    expect(
      status,
      `dataset 'ds_Fluig' (descrito no ambiente como "Usuário e Senha usuario de integração") ` +
        `respondeu ${status} para uma sessão sem privilégio administrativo — deveria negar acesso ` +
        `(403), como acontece em /webdesk (CT-SEG-05-S1). Evidência estrutural, nunca o conteúdo: ` +
        `${qtdRegistros ?? '?'} registro(s), ${qtdColunas ?? '?'} coluna(s) na resposta. ` +
        'Ver CT-SEG-03-S1 / achado U-03.',
    ).toBe(403);
  });

  test('CT-SEG-04-S1: datasets de execução de SQL não devem ser alcançáveis por sessão sem privilégio admin', async ({
    request,
  }) => {
    // ⚠️ Escopo deliberadamente restrito: este teste NÃO envia payload de injeção (nenhum
    // caractere de sintaxe SQL, nenhuma entrada maliciosa) contra `dsFluig_executeSql` /
    // `dsFluig_getDocumentSql`. Auditar parametrização de verdade exigiria ou o código-fonte do
    // dataset (Fluig Studio, fora do alcance desta conta) ou uma tentativa real de injeção — as
    // duas fora do limite ético do projeto. O que é auditável sem ataque real é a superfície de
    // ALCANÇABILIDADE: uma sessão comum consegue invocar um dataset cujo próprio nome indica
    // execução de SQL arbitrário? Isso já é uma exposição de defesa-em-profundidade, com ou sem
    // vulnerabilidade de injeção por trás.
    const nomes = ['dsFluig_executeSql', 'dsFluig_getDocumentSql'];

    for (const nome of nomes) {
      const resposta = await request.get('/api/public/ecm/dataset/search', {
        params: { datasetId: nome },
      });
      const status = resposta.status();

      expect
        .soft(
          status,
          `dataset '${nome}' (executor de SQL, achado U-04) respondeu ${status} para sessão sem ` +
            'perfil admin — deveria exigir privilégio elevado (403). Auditoria de injeção real está ' +
            'fora de escopo (ver comentário no topo do teste); esta assertion cobre só a ' +
            'alcançabilidade.',
        )
        .toBe(403);
    }
  });
});
