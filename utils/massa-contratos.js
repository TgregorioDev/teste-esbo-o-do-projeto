// @ts-check
import { test } from '@playwright/test';
import { hash32, idEstavelDoTeste } from './identidade-do-teste.js';
import { faltaPreCondicao } from './pre-condicao.js';
import { tentarAdquirir, liberar } from './exclusividade.js';
import { lerContratosVigentesPorDataset } from './contratos-por-dataset.js';

/**
 * Descoberta de massa de contratos em tempo de execução, **distribuída entre os testes**.
 *
 * ## Por que isto existe
 *
 * A regra do projeto é "cada teste monta o próprio pré-requisito". Para contrato ela não é
 * alcançável — e isso **foi verificado, não assumido**. A investigação está em
 * `docs/criacao-de-contrato-inviavel.md` (30/08/2026); em uma linha: o contrato é um registro da
 * tabela **CN9 do Protheus**, e este ambiente não expõe nenhuma superfície de escrita para ele.
 * As 19 chamadas que o Portal de Acompanhamento de Contratos faz ao ERP são todas
 * `dsProtheus_get*_restGet[All]`, e nenhum dos 34 processos publicados no Fluig cria contrato.
 *
 * O que **é** alcançável, e o que este módulo passou a resolver, é a outra metade do problema:
 * **não depender de um contrato específico**. A versão anterior escolhia sempre a *primeira*
 * linha vigente da grade, o que na prática significava que a suíte inteira girava em torno do
 * `000000000000001`. Duas consequências ruins:
 *
 * 1. remover aquele contrato da base derrubava dezenas de testes de uma vez;
 * 2. testes concorrentes disputavam o MESMO contrato sob `fullyParallel: true`.
 *
 * ## Duas fontes, uma escolha
 *
 * - **Grade** (`descobrirContratoVigente`, `descobrirContratosVigentes`): para os testes que
 *   agem SOBRE a grade do Portal de Acompanhamento — filtrar, abrir modal, iniciar SC. Eles
 *   precisam do contrato como a grade o mostra, e de um número que identifique uma linha só.
 * - **Dataset** (`descobrirContratoVigentePorDataset`, `descobrirContratosVigentesPorDataset`,
 *   desde 11/09/2026): para os testes que só precisam de "um contrato vigente" e não testam a
 *   grade — os de Faturamento. Leem `utils/contratos-por-dataset.js` e seguem de pé com o portal
 *   fora. É a etapa 3 de `docs/plano-de-evolucao-2026-09-11.md`.
 *
 * As duas passam pela MESMA escolha e pela MESMA reserva (`escolherEReservar`), de modo que um
 * contrato reservado por um teste da grade não é pego por um de Faturamento, e vice-versa.
 *
 * ## Como a escolha é feita
 *
 * **Afinidade por hash** (*rendezvous hashing*): para cada contrato candidato calcula-se
 * `hash(idDoTeste | numeroDoContrato)`, e vence o menor. Propriedades que interessam:
 *
 * - **Determinística e reproduzível**: mesma suíte, mesmo teste, mesma escolha — em qualquer
 *   worker, em qualquer ordem, com ou sem `--repeat-each`. Uma falha volta a acontecer no mesmo
 *   contrato, que é a condição para investigá-la.
 * - **Distribuída**: testes diferentes têm ids diferentes e caem em contratos diferentes. Com os
 *   564 vigentes medidos por dataset em 11/09/2026, nenhum registro é ponto único de falha.
 * - **Estável quando a base muda**: sumir um contrato só afeta os testes que o escolhiam, porque
 *   a ordem não é posicional (um `offset % total` deslocaria a escolha de TODOS os testes).
 *
 * ⚠️ A `FAKER_SEED` de propósito **não** entra no hash. Ela é sorteada por processo quando não
 * vem do ambiente (`fixtures/fixtures.js`), logo difere entre workers: usá-la faria a escolha
 * depender de qual worker pegou o teste, e reexecutar com a seed do relatório passaria a
 * escolher OUTRO contrato — o oposto de reprodutibilidade.
 *
 * ## Exclusão mútua
 *
 * Escolher bem não basta: dois testes podem convergir para o mesmo contrato (o hash distribui,
 * não garante disjunção) e um deles pode ser um cenário de escrita. Por isso o contrato
 * escolhido é **reservado** — um lock de diretório por número, do mesmo mecanismo de
 * `utils/exclusividade.js` — e a reserva é devolvida ao fim do teste pela fixture `evidence`
 * (`fixtures/fixtures.js`), inclusive quando o teste falha. Contrato ocupado não faz ninguém
 * esperar: cai-se para o próximo da ordem de afinidade.
 *
 * ## O que continua valendo
 *
 * As assertions dos testes são **relacionais** (o payload deve corresponder AO CONTRATO
 * ESCOLHIDO), nunca presas a um valor absoluto — e a ausência de massa falha como
 * `PRÉ-CONDIÇÃO AUSENTE` (via `faltaPreCondicao`), distinta de defeito do produto, que é o que o relatório precisa
 * deixar claro.
 */

/**
 * Situação que a grade exibe por extenso para contrato vigente.
 * As demais situações saem truncadas (defeito D-08), então filtrar por esta é o único
 * critério confiável hoje — e é justamente a que interessa para abrir Solicitação de Compra.
 * A fonte por dataset devolve a mesma palavra para `CN9_SITUAC = 05`.
 */
const SITUACAO_VIGENTE = 'Vigente';

/**
 * Prazo para considerar órfã a reserva de um contrato.
 *
 * Precisa ser maior que o maior `test.setTimeout` da suíte (180s em
 * `tests/e2e/contratos/ciclo-faturamento.spec.js`), senão um teste lento perderia a própria
 * reserva para o worker vizinho no meio da execução.
 */
const IDADE_MAXIMA_DA_RESERVA = 600_000;

/**
 * Reservas em posse do teste corrente NESTE worker.
 *
 * Escopo de módulo é seguro aqui porque cada worker do Playwright é um processo próprio e
 * executa um teste por vez: o conjunto nunca mistura testes.
 *
 * @type {Set<string>}
 */
const reservasEmPosse = new Set();

/**
 * @typedef {import('../pages/AcompanhamentoContratosPage.js').AcompanhamentoContratosPage} PortalContratos
 * @typedef {import('../pages/AcompanhamentoContratosPage.js').LinhaDeContrato} LinhaDeContrato
 * @typedef {Object} CriterioDeContrato
 * @property {string} [filialDiferenteDe] exige filial distinta da informada
 * @property {string} [tipoDiferenteDe] exige tipo de contrato distinto do informado
 * @property {string[]} [excluirContratos] números a não escolher
 */

/**
 * Identidade estável do teste corrente — a semente da distribuição.
 *
 * A identidade em si (título sem `@tags`, com `repeatEachIndex`, sem `retry`) vive em
 * `utils/identidade-do-teste.js`, compartilhada com a seed do faker por teste
 * (`fixtures/fixtures.js`): o mesmo id que escolhe o contrato é o que gera a massa, e assim
 * um único comando reproduz as duas coisas.
 *
 * @returns {string}
 */
function idDoTesteCorrente() {
  try {
    return idEstavelDoTeste(test.info());
  } catch {
    // `test.info()` só existe dentro de um teste em execução. Fora dele (um script de
    // manutenção chamando este módulo) não há identidade para distribuir, e uma constante
    // mantém o comportamento determinístico. Não é erro engolido: é o caso sem teste corrente.
    return 'fora-de-teste';
  }
}

/**
 * Ordena os candidatos pela afinidade com o teste corrente.
 *
 * O desempate por número de contrato existe para que a ordem seja total: dois hashes iguais
 * (possível em 32 bits) devolveriam ordem dependente do algoritmo de `sort`, e a escolha
 * deixaria de ser reproduzível.
 *
 * @param {LinhaDeContrato[]} candidatos
 * @param {string} idDoTeste
 * @returns {LinhaDeContrato[]}
 */
function ordenarPorAfinidade(candidatos, idDoTeste) {
  return candidatos
    .map((linha) => ({ linha, peso: hash32(`${idDoTeste}|${linha.contrato}`) }))
    .sort((a, b) => a.peso - b.peso || a.linha.contrato.localeCompare(b.linha.contrato))
    .map((item) => item.linha);
}

/**
 * `true` quando o número do contrato identifica **uma única linha** na busca da grade.
 *
 * Por que isto é obrigatório, e não refinamento: todo consumidor da GRADE faz
 * `filtrarPorContrato(numero)` e em seguida age sobre "a linha" — `acoesDaLinha` é um locator
 * global, resolvido depois do filtro. A busca do DataTables é por **substring em qualquer
 * coluna**, então um número que é prefixo de outro traz duas linhas e o clique estoura em modo
 * estrito.
 *
 * Não é hipótese: medido em 30/08/2026, **11 dos 554 contratos vigentes** têm essa colisão. O
 * caso que a expôs foi `0006-2022-4301`, que também casa com `C0006-2022-4301`. A fonte por
 * dataset não passa por este filtro: seus consumidores não filtram a grade.
 *
 * @param {string} contrato
 * @param {LinhaDeContrato[]} todasAsLinhas a grade inteira, não só as vigentes
 * @returns {boolean}
 */
function identificaLinhaUnica(contrato, todasAsLinhas) {
  let casamentos = 0;
  for (const linha of todasAsLinhas) {
    const texto = `${linha.filial} ${linha.tipo} ${linha.contrato} ${linha.revisao} ${linha.status} ${linha.fornecedor}`;
    if (texto.includes(contrato)) {
      casamentos += 1;
      if (casamentos > 1) return false;
    }
  }
  return casamentos === 1;
}

/**
 * Nome do lock de um contrato. O número vem da grade e pode conter separadores
 * (`0000-2025-2501-`), então é normalizado para caber num nome de diretório.
 *
 * @param {string} contrato
 * @returns {string}
 */
function nomeDaReserva(contrato) {
  return `contrato-${contrato.replace(/[^A-Za-z0-9_-]/g, '_')}`;
}

/**
 * Registra no relatório qual contrato o teste usou, e de qual fonte.
 *
 * Sem isto, a distribuição por hash seria opaca: quem lê uma falha precisa saber sobre QUAL
 * contrato ela aconteceu para reproduzir a investigação no Protheus.
 *
 * @param {LinhaDeContrato} linha
 * @param {'grade' | 'dataset'} origem
 * @returns {void}
 */
function anotarEscolha(linha, origem) {
  try {
    test.info().annotations.push({
      type: 'contrato-escolhido',
      description: `${linha.contrato} · filial ${linha.filial} · ${linha.tipo} · ${linha.status} · via ${origem}`,
    });
  } catch {
    // Fora de um teste não há relatório para anotar — ver `idDoTesteCorrente`.
  }
}

/**
 * Núcleo comum às duas fontes: filtra vigentes pelo critério, ordena por afinidade e reserva.
 *
 * @param {LinhaDeContrato[]} linhas o que a fonte trouxe
 * @param {CriterioDeContrato} criterio
 * @param {{ origem: 'grade' | 'dataset', exigirLinhaUnicaNaGrade: boolean }} opcoes
 * @returns {Promise<LinhaDeContrato>}
 */
async function escolherEReservar(linhas, criterio, { origem, exigirLinhaUnicaNaGrade }) {
  const vigentes = linhas.filter((l) => l.status === SITUACAO_VIGENTE);

  if (vigentes.length === 0) {
    faltaPreCondicao(
      `a ${origem} trouxe ${linhas.length} contrato(s), mas nenhum vigente. ` +
        `Situações presentes: ${[...new Set(linhas.map((l) => l.status))].join(', ')}. ` +
        'Solicitação de Compra e medição só fazem sentido a partir de contrato vigente.',
    );
  }

  const excluir = new Set(criterio.excluirContratos ?? []);
  const satisfazemOCriterio = vigentes.filter(
    (l) =>
      !excluir.has(l.contrato) &&
      (criterio.filialDiferenteDe === undefined || l.filial !== criterio.filialDiferenteDe) &&
      (criterio.tipoDiferenteDe === undefined || l.tipo !== criterio.tipoDiferenteDe),
  );

  if (satisfazemOCriterio.length === 0) {
    faltaPreCondicao(
      `nenhum contrato vigente (${origem}) satisfaz o critério ` +
        `${JSON.stringify(criterio)} entre os ${vigentes.length} disponíveis. ` +
        'A base mudou de perfil — reavalie o critério do teste.',
    );
  }

  const candidatos = exigirLinhaUnicaNaGrade
    ? satisfazemOCriterio.filter((l) => identificaLinhaUnica(l.contrato, linhas))
    : satisfazemOCriterio;

  if (candidatos.length === 0) {
    faltaPreCondicao(
      `os ${satisfazemOCriterio.length} contrato(s) vigente(s) que ` +
        `satisfazem ${JSON.stringify(criterio)} têm número ambíguo na busca da grade — cada um ` +
        'casa com mais de uma linha por substring, e filtrar por ele deixaria o teste agindo ' +
        'sobre a linha errada. Isto NÃO é defeito do produto sob teste.',
    );
  }

  for (const linha of ordenarPorAfinidade(candidatos, idDoTesteCorrente())) {
    if (!(await tentarAdquirir(nomeDaReserva(linha.contrato), {
      idadeMaxima: IDADE_MAXIMA_DA_RESERVA,
    }))) {
      continue;
    }
    reservasEmPosse.add(nomeDaReserva(linha.contrato));
    anotarEscolha(linha, origem);
    return linha;
  }

  // Chegar aqui significa que TODOS os candidatos estão em uso por outros testes em execução.
  // É esgotamento de massa do ambiente, não defeito do produto nem falha de sincronização —
  // e a mensagem precisa dizer isso, senão vira "timeout misterioso" no relatório.
  // `MASSA INSUFICIENTE` é a mesma classe de pré-condição ausente (ambiente, não produto):
  // passa pelo helper para ganhar a anotação que o gate lê, mantendo o rótulo na mensagem.
  faltaPreCondicao(
    `MASSA INSUFICIENTE — os ${candidatos.length} contrato(s) vigente(s) que satisfazem ` +
      `${JSON.stringify(criterio)} já estão reservados por outros testes desta execução. ` +
      'Isto NÃO é defeito do produto sob teste: a base tem menos contratos utilizáveis do que ' +
      'testes concorrentes. Reduza `--workers`, ou provisione mais contratos vigentes no ' +
      'Protheus. Reservas órfãs de execução interrompida expiram sozinhas em ' +
      `${IDADE_MAXIMA_DA_RESERVA / 1000}s.`,
  );
}

/**
 * Escolhe um contrato vigente DA GRADE que satisfaça o critério, distribuindo a escolha entre
 * os testes e reservando o registro contra os demais workers.
 *
 * Para quem age sobre a grade. Quem só precisa de "um contrato vigente" usa
 * `descobrirContratoVigentePorDataset`, que não depende do portal.
 *
 * @param {PortalContratos} contratosPage portal já carregado (`expectCarregada` executado)
 * @param {CriterioDeContrato} [criterio]
 * @returns {Promise<LinhaDeContrato>}
 */
export async function descobrirContratoVigente(contratosPage, criterio = {}) {
  const linhas = await contratosPage.lerLinhasDaGrade();

  if (linhas.length === 0) {
    faltaPreCondicao(
      'a grade de contratos não retornou nenhuma linha. ' +
        'A integração com o Protheus está indisponível ou sem dados — isto NÃO é defeito do ' +
        'produto sob teste nem falha da automação. Confirme que o portal lista contratos ' +
        'antes de interpretar este resultado.',
    );
  }

  return escolherEReservar(linhas, criterio, { origem: 'grade', exigirLinhaUnicaNaGrade: true });
}

/**
 * Escolhe um contrato vigente POR DATASET (todas as filiais, cache da execução), com a mesma
 * afinidade e a mesma reserva de `descobrirContratoVigente` — sem depender da grade do portal.
 *
 * Anota no relatório quando a varredura teve filial que não respondeu: a escolha segue válida
 * entre as que responderam, mas quem lê a execução precisa saber que a amostra era parcial.
 *
 * @param {import('@playwright/test').Page} page página em alguma rota do portal
 * @param {CriterioDeContrato} [criterio]
 * @returns {Promise<LinhaDeContrato>}
 */
export async function descobrirContratoVigentePorDataset(page, criterio = {}) {
  const varredura = await lerContratosVigentesPorDataset(page);
  if (varredura.filiaisComFalha.length > 0) {
    try {
      test.info().annotations.push({
        type: 'contratos-varredura-parcial',
        description: `${varredura.filiaisComFalha.length} de ${varredura.filiais} filial(is) não responderam: ${varredura.filiaisComFalha.slice(0, 6).join('; ')}`,
      });
    } catch {
      // Fora de um teste não há relatório para anotar.
    }
  }
  return escolherEReservar(varredura.linhas, criterio, { origem: 'dataset', exigirLinhaUnicaNaGrade: false });
}

/**
 * Escolhe `quantidade` contratos vigentes distintos com a função de descoberta dada.
 *
 * @param {(criterio: CriterioDeContrato) => Promise<LinhaDeContrato>} descobrir
 * @param {number} quantidade
 * @param {CriterioDeContrato} criterio
 * @returns {Promise<LinhaDeContrato[]>}
 */
async function amostrar(descobrir, quantidade, criterio) {
  /** @type {LinhaDeContrato[]} */
  const escolhidos = [];
  const excluir = [...(criterio.excluirContratos ?? [])];

  for (let i = 0; i < quantidade; i += 1) {
    const linha = await descobrir({ ...criterio, excluirContratos: excluir });
    escolhidos.push(linha);
    excluir.push(linha.contrato);
  }

  return escolhidos;
}

/**
 * Escolhe `quantidade` contratos vigentes distintos DA GRADE, cada um reservado.
 *
 * Existe para os casos que amostram vários contratos até achar um com a característica que
 * precisam (competência com saldo, item zerado). Antes esses testes faziam
 * `vigentes.slice(0, N)` — que é a mesma dependência do primeiro registro, só que multiplicada
 * por N.
 *
 * @param {PortalContratos} contratosPage
 * @param {number} quantidade
 * @param {CriterioDeContrato} [criterio]
 * @returns {Promise<LinhaDeContrato[]>}
 */
export async function descobrirContratosVigentes(contratosPage, quantidade, criterio = {}) {
  return amostrar((c) => descobrirContratoVigente(contratosPage, c), quantidade, criterio);
}

/**
 * Como `descobrirContratosVigentes`, POR DATASET.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} quantidade
 * @param {CriterioDeContrato} [criterio]
 * @returns {Promise<LinhaDeContrato[]>}
 */
export async function descobrirContratosVigentesPorDataset(page, quantidade, criterio = {}) {
  return amostrar((c) => descobrirContratoVigentePorDataset(page, c), quantidade, criterio);
}

/**
 * Escolhe dois contratos vigentes de filiais diferentes.
 *
 * Serve aos casos que comparam contratos entre si — por exemplo, provar que um campo deveria
 * refletir o contrato de origem e não vir fixo para todos.
 *
 * @param {PortalContratos} contratosPage
 * @returns {Promise<[LinhaDeContrato, LinhaDeContrato]>}
 */
export async function descobrirDoisContratosDeFiliaisDiferentes(contratosPage) {
  const primeiro = await descobrirContratoVigente(contratosPage);
  const segundo = await descobrirContratoVigente(contratosPage, {
    filialDiferenteDe: primeiro.filial,
    excluirContratos: [primeiro.contrato],
  });

  return [primeiro, segundo];
}

/**
 * Devolve todas as reservas de contrato em posse do teste que acabou de terminar.
 *
 * Chamada pela fixture `evidence` (`fixtures/fixtures.js`, `{ auto: true }`), que roda depois de
 * todo teste — verde, vermelho ou interrompido por timeout. Sem isso, cada teste consumiria um
 * contrato do pool permanentemente e uma suíte longa esgotaria a massa por vazamento.
 *
 * @returns {Promise<void>}
 */
export async function liberarReservasDeContrato() {
  const nomes = [...reservasEmPosse];
  reservasEmPosse.clear();
  await Promise.all(nomes.map((nome) => liberar(nome)));
}
