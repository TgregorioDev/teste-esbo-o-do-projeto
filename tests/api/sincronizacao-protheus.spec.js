// @ts-check
import { test, expect } from '../../fixtures/fixtures.js';

/**
 * CT-INT-02-S1 e CT-INT-03-S1 — sincronização Protheus, cache e defasagem.
 *
 * O documento de casos pede acesso ao painel admin de datasets para localizar os jobs em erro e
 * disparar sincronização manual. A conta da automação é não-admin. Investigação em campo achou
 * uma via observável sem admin: os mesmos nomes de dataset citados no caso — e as variantes
 * `_Sync` que os alimentam — são consultáveis diretamente por
 * `GET /api/public/ecm/dataset/search?datasetId=...`, a mesma técnica usada em CT-SEG-01-S1.
 *
 * ## Achado que corrige o documento de casos (o ambiente ganha sobre o documento)
 *
 * Os três datasets citados literalmente no caso —
 * `ds_protheus_getFuncionarios_restGetAll`, `ds_protheus_getFuncoes_restGetAll` e
 * `dsConsulta_Atv_ProcCompra_VerifVigencia_Sync` — respondem **200, com dado real**, quando
 * consultados ao vivo (72.893, 3.370 e 2 registros respectivamente, medido em campo). Não estão
 * em erro hoje. O snapshot mais antigo do ambiente que os descrevia como "ERRO" reflete o status
 * do JOB agendado (painel admin), não a resposta ao vivo do dataset — são coisas diferentes.
 *
 * O que **está**, de fato, em erro agora — reproduzido com uma chamada de leitura simples,
 * repetível, sem efeito colateral — são as variantes de CACHE (sufixo `_Sync`) de dois dos três:
 * `ds_protheus_getFuncionarios_restGetAll_Sync` e `ds_protheus_getFuncoes_restGetAll_Sync`
 * devolvem HTTP 500 com `java.lang.NullPointerException`. É o mesmo sintoma do achado U-12
 * (dados de RH defasados), só que confirmado na fonte exata: a camada de cache, não o REST ao
 * vivo do Protheus.
 */

test.describe('Integração Protheus — sincronização e cache', () => {
  test('CT-INT-02-S1 @bug: variantes de cache (_Sync) dos dados de RH e vigência de compra não devem estar em erro', async ({
    request,
  }) => {
    const datasetsDeSincronizacao = [
      'ds_protheus_getFuncionarios_restGetAll_Sync',
      'ds_protheus_getFuncoes_restGetAll_Sync',
      'dsConsulta_Atv_ProcCompra_VerifVigencia_Sync',
    ];

    for (const nome of datasetsDeSincronizacao) {
      const resposta = await request.get('/api/public/ecm/dataset/search', {
        params: { datasetId: nome },
        failOnStatusCode: false,
      });
      const status = resposta.status();
      let corpoTexto = '';
      try {
        corpoTexto = await resposta.text();
      } catch {
        // corpo não textual — status já é suficiente para a assertion
      }

      expect
        .soft(
          resposta.ok(),
          `dataset de sincronização '${nome}' respondeu ${status}: ${corpoTexto.slice(0, 200)}. ` +
            'Sincronização em erro deixa dado de RH/vigência de compra defasado sem aviso. Ver ' +
            'CT-INT-02-S1 / achado U-12.',
        )
        .toBe(true);
    }
  });

  test('CT-INT-03-S1: dataset de cache expõe a janela de sincronização (lastSyncDate) por registro', async ({
    request,
  }) => {
    // `dsp_colaboradorProtheusSync` é o cache que sustenta a busca de colaborador em vários
    // formulários; cada registro carrega `lastSyncDate` (epoch ms) — a evidência de que a
    // defasagem do cache é, no mínimo, MENSURÁVEL, o que é pré-condição para ser "aceitável e
    // documentada" como o caso pede. Não inventamos limite de frescor: não há SLA publicado, e
    // fixar um valor arbitrário seria um oráculo inventado, não uma verificação.
    const resposta = await request.get('/api/public/ecm/dataset/search', {
      params: { datasetId: 'dsp_colaboradorProtheusSync' },
    });
    expect(resposta.ok(), `status inesperado: ${resposta.status()}`).toBe(true);

    const corpo = /** @type {{ content: Array<{ lastSyncDate?: string | number }> }} */ (
      await resposta.json()
    );
    const registros = corpo.content ?? [];

    expect(
      registros.length,
      'dataset de cache não retornou nenhum registro — sem massa não há como medir defasagem.',
    ).toBeGreaterThan(0);

    const agora = Date.now();
    const idadesEmHoras = [];
    let comTimestampInvalido = 0;

    for (const registro of registros) {
      const timestamp = Number(registro.lastSyncDate);
      if (!Number.isFinite(timestamp) || timestamp <= 0) {
        comTimestampInvalido += 1;
        continue;
      }
      idadesEmHoras.push((agora - timestamp) / 3_600_000);
    }

    // Nenhum campo de identificação de pessoa (nome, matrícula, e-mail) entra na assertion nem
    // no anexo — só a estatística de idade em horas, agregada.
    expect(
      comTimestampInvalido,
      `${comTimestampInvalido} de ${registros.length} registro(s) do dataset de cache não ` +
        'carregam um `lastSyncDate` válido — a defasagem deixa de ser observável para esses ' +
        'registros, o que quebra a premissa de "cache com janela documentada".',
    ).toBe(0);

    // `Math.min(...array)`/`Math.max(...array)` estouram a pilha de chamada com dezenas de
    // milhares de argumentos (este cache tem 130 mil+ registros) — reduce evita o spread.
    const idadeMinimaHoras = idadesEmHoras.reduce((menor, idade) => Math.min(menor, idade), Infinity);
    // Nenhum registro pode ter sido "sincronizado no futuro" — sinal de relógio incoerente entre
    // Fluig e Protheus, ou de dado corrompido no cache.
    expect(
      idadeMinimaHoras,
      'há registro no cache com `lastSyncDate` no futuro em relação ao horário do teste — ' +
        'incoerência de relógio entre Fluig e Protheus, ou dado corrompido no cache.',
    ).toBeGreaterThanOrEqual(0);

    const idadeMaximaHoras = idadesEmHoras.reduce((maior, idade) => Math.max(maior, idade), -Infinity);
    const idadeMediaHoras =
      idadesEmHoras.reduce((soma, idade) => soma + idade, 0) / idadesEmHoras.length;

    // Documentação da janela de sincronização observada — é o resultado que o caso pede
    // ("janelas de sincronização documentadas"), sem impor um limite que ninguém definiu.
    await test.info().attach('janela-de-sincronizacao-observada', {
      body: JSON.stringify(
        {
          totalRegistros: registros.length,
          idadeMinimaEmDias: Number((idadeMinimaHoras / 24).toFixed(1)),
          idadeMaximaEmDias: Number((idadeMaximaHoras / 24).toFixed(1)),
          idadeMediaEmDias: Number((idadeMediaHoras / 24).toFixed(1)),
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });
  });
});
