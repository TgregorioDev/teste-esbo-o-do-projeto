// Camada de análise da execução de 03/09/2026 — escrita à mão sobre as 71 falhas medidas.
// Cada entrada é chaveada por `arquivo:linha` (mais um fragmento do título quando a mesma
// linha gera vários testes parametrizados).
//
// ADIÇÃO DESTA VERSÃO (pedido do dev): cada descrição de problema traz o NOME DO CASO DE TESTE,
// não apenas o grupo de causa raiz. O nome vem de `docs/catalogo-casos.md` (fonte da verdade dos
// 163 casos), resolvido pelo ID citado no título do teste — ver `NOMES_DE_CASO` e `nomeDoCaso()`.
import { readFileSync } from 'node:fs';

/** Nomes extraídos do catálogo versionado (`docs/catalogo-casos.md`). */
const DO_CATALOGO = JSON.parse(readFileSync('relatorios-2026-09-03/nomes-de-caso.json', 'utf8'));

/**
 * IDs que a suíte cita em forma abreviada (sem sufixo -H/-S) ou que nomeiam uma FAMÍLIA de casos
 * do catálogo em vez de um caso único. Sem isto o cartão mostraria o ID sem nome, que é
 * exatamente o que o pedido quer eliminar.
 */
const APELIDOS = {
  'CT-COT': 'Cotação de Produtos e Serviços — formulário e fila do Portal do Comprador',
  'CT-NEG': 'Negociação de Cotação — formulário e fila de Avaliação de Propostas',
  'CT-PAR': 'Parecer Técnico da Solicitação de Compras',
  'CT-SUB': 'Substituição de Cargos — identificação do solicitante',
  'CT-PLT-04': 'Deep-link de rota SPA',
  'CT-NEG-01': 'Negociar uma proposta real de fornecedor',
  'D-01': 'a SC nasce presa no marco de Início, na conta de integração',
  'D-02': 'valor total do item multiplicado / repetido no payload',
  'D-04': 'campos do payload chumbados, sem seguir o contrato de origem',
  'D-JUR-01': 'combos do SIGAJURI vazios (dataset não devolve registros)',
  'U-01': 'deep-link de rota SPA cai em errorPage/404',
  'U-02': 'Banco de Horas sem integração com o Protheus',
  'U-03': 'dataset de credencial de integração legível sem admin',
  'U-04': 'executor de SQL alcançável sem admin',
  'U-11': 'telemetria enviada ao Google Analytics',
  'U-12': 'variante de cache (_Sync) dos dados de RH em erro',
  'U-13': 'contas técnicas com privilégio de administrador',
  'U-14': 'campo Clínica vazio no Questionário CliniCASSI',
};

export const NOMES_DE_CASO = { ...DO_CATALOGO, ...APELIDOS };

/**
 * Resolve o campo `id` de uma análise (que pode citar mais de um ID, separados por " / ")
 * para uma string legível "ID — Nome do caso".
 */
export function nomeDoCaso(id) {
  if (!id || id === '—') return '';
  return id
    .split('/')
    .map((parte) => {
      const bruto = parte.trim();
      const chave = (bruto.match(/(?:CT|D|U)-[A-Z0-9]+(?:-\d+)?(?:-[HS]\d*)?/) ?? [bruto])[0];
      const nome = NOMES_DE_CASO[chave];
      return nome ? `${bruto} — ${nome}` : bruto;
    })
    .join(' · ');
}

export const NATUREZAS = {
  catalogado: { rotulo: 'Defeito de produto — já catalogado no README', cor: 'produto' },
  novo: { rotulo: 'Defeito de produto — achado desta execução (não catalogado)', cor: 'produto' },
  divergencia: { rotulo: 'Divergência ambiente × suíte (o ambiente mudou)', cor: 'divergencia' },
  precondicao: { rotulo: 'Pré-condição ausente (ambiente / massa / latência)', cor: 'ambiente' },
  infra: { rotulo: 'Infraestrutura da máquina de execução', cor: 'infra' },
  semVeredito: { rotulo: 'Sem veredito (falhou antes da assertion de domínio)', cor: 'sem-veredito' },
  naoDeterministico: { rotulo: 'Comportamento não determinístico do produto', cor: 'sem-veredito' },
};

export const META = [
  ['Data', '03/09/2026, 09h03–11h55 (BRT)'],
  ['Ambiente', '`https://caixade182374.fluig.cloudtotvs.com.br` · usuário `TOTVS-FS`'],
  ['Commit', '`eb41213` (branch `emdash/teste-2-jxzxn`, já com as correções de 31/08–03/09)'],
  ['Runtime', 'Playwright 1.62.1 · Node 22.22.2 · Chromium (Desktop Chrome, pt-BR)'],
  ['Modo', 'execução completa, **destrutivos incluídos**, sem retry · 16 fatias não destrutivas + **47 invocações destrutivas, uma por teste, com 60 s de intervalo entre elas**'],
];

export const REEXEC = 'Reexecução em janela saudável';

export const LEITURA = ({ totais, porNatureza }) =>
  `Das **${totais.falhas}** falhas, **${porNatureza.catalogado}** são defeitos já catalogados no README (vermelhos ` +
  `intencionais), **${porNatureza.novo}** são defeitos de produto não catalogados, **${porNatureza.precondicao}** são pré-condição ausente ` +
  `(latência do BPMN, filas vazias e massa inadequada) e **${porNatureza.divergencia}** são divergência entre o ambiente e o inventário ` +
  `versionado. Nenhuma falha foi atribuída a erro de código da suíte.\n\n` +
  `**O que mudou em relação a 02/09/2026:** o relatório de ontem tinha **24 falhas em um único ponto** — a factory ` +
  `escolhia sozinha o tipo "Renovação Contratual", que o ambiente já não oferecia, e o \`selectOption\` morria antes ` +
  `da assertion que dá nome a cada teste. Esta versão do repositório corrigiu a causa: \`TIPO_SOLICITACAO\` reflete o ` +
  `catálogo vigente, o tipo passou a ser **declarado por intenção do caso** (\`QUALQUER_TIPO_VALIDO\` ou um literal ` +
  `explícito) e \`SolicitacaoCompraModal.selecionarTipo\` confere o combo real antes de selecionar. **O grupo G1 de ` +
  `ontem desapareceu por completo**: nenhuma falha desta execução vem do combo. Os 24 testes mascarados agora dão ` +
  `veredito próprio: **9 passam** e **15 reprovam** — 13 pelo defeito real do produto e 2 por pré-condição ` +
  `ausente de massa —, cada um com o cartão detalhado abaixo. ` +
  `O placar saiu de **152 verdes / 81 vermelhos** para **${totais.ok} verdes / ${totais.falhas} vermelhos**.`;

export const SUPLEMENTARES = [
  '**Janela de rede degradada entre 09h12 e 09h30** — durante a primeira passagem, as fatias `rh`, `plataforma`, ' +
    '`portais` e `compras` acumularam 20 falhas com sintoma de infraestrutura (`page.goto: Timeout 60000ms` e ' +
    '`net::ERR_NETWORK_CHANGED`), e as fatias `acompanhamento-contratos` e `contratos` pegaram a grade do Protheus ' +
    'devolvendo *"Mostrando 0 até 0 de 0 registros"*. `docs/estabilidade-do-ambiente.md` proíbe reportar medição ' +
    'nessa condição. Os JSONs dessa passagem estão preservados em `relatorios-2026-09-03/janela-degradada/` como ' +
    'evidência, e as seis fatias foram **reexecutadas** depois da confirmação de saúde. Efeito: `portais` 18 → 2 ' +
    'vermelhos, `rh` 10 → 3, `plataforma` 12 → 7, `compras` 13 → 7, `acomp` 11 → 10, `contratos` 3 → 2.',
  '**Confirmação de saúde do ambiente antes da medição final** — `node scripts/sonda-grade.mjs` devolveu **845 ' +
    'contratos em cinco amostras consecutivas**, que é o critério exigido por `CLAUDE.md` e por ' +
    '`docs/estabilidade-do-ambiente.md` antes de interpretar qualquer execução.',
  '**Dois destrutivos reexecutados na janela saudável** — `ciclo-correcao-reenvio.spec.js:242` (CT-CMP-08-H) e ' +
    '`ciclo-solicitacao-compras.spec.js:815` (CT-ACC-09-H) haviam parado em sintoma de ambiente (grade vazia, ' +
    'widget de Zoom). Reexecutados, **os dois alcançaram a assertion de domínio e confirmaram defeito real** — ' +
    'o beco sem saída do reenvio e a pasta do GED que nunca é criada.',
  '**Validação das evidências contra o que cada cartão afirma** — a leitura do relatório apontou que vários prints ' +
    'não sustentavam o texto do defeito. A checagem confirmou e mediu: a screenshot do Playwright é sempre "a página ' +
    'no instante da falha", e isso só PROVA o defeito quando ele é visual. Dos 71 cartões, em **23 a screenshot é a ' +
    'evidência** (combo vazio, status truncado, 404, formulário errado, documento publicado sem bloqueio) e em ' +
    '**48 ela é apenas contexto**, porque o oráculo do caso é a resposta de uma API, o corpo do payload ' +
    'interceptado, uma linha de console, uma requisição de rede ou uma tentativa bloqueada pela guarda de escrita — ' +
    'nada disso aparece numa imagem. Cada cartão agora declara em qual dos dois grupos está e, quando é contexto, ' +
    'aponta onde está a prova de verdade. A classificação não foi assumida: cada caso marcado como visual foi conferido contra o aria-snapshot daquela falha, e dois que eu havia marcado como prova (upload de `.exe` no GED e campo "Clínica") caíram na conferência e foram reclassificados. Classificação em `relatorios-2026-09-03/evidencias.mjs`. ' +
    'Dois efeitos colaterais que enganavam quem lia: em `payload-solicitacao` o "Erro ao iniciar processo" ao fundo ' +
    'é o aborto proposital da captura, não o defeito; e no Banco de Horas o `alert()` nativo nunca sai na imagem ' +
    'porque o Playwright o dispensa sozinho.',
  '**Intervalo de 60 s entre destrutivos** — os 47 cenários `@destrutivo` rodaram **um por invocação**, com espera ' +
    'de 60 s entre eles (`relatorios-2026-09-03/rodar-destrutivos.mjs`; cronologia completa em `destrutivos.log`). ' +
    'Isso remove a disputa pelo pool de tarefas entre testes concorrentes, que em 02/09 era uma das explicações ' +
    'possíveis para as SCs não ficarem assumíveis. Com a disputa eliminada, as 5 falhas de latência do BPMN (G13) ' +
    '**persistiram** — logo a causa é a latência da etapa "Grava SC e Anexos", não a concorrência.',
];

export const MASSA =
  'O livro-razão `test-results/criados.jsonl` registrou os registros criados pelos testes destrutivos nesta ' +
  'execução — SCs **#113193–#113226**, medição de contrato, documentos no GED e favoritos. Como cada destrutivo ' +
  'rodou em sua própria invocação, o `globalTeardown` rodou **47 vezes** e cancelou, em cada uma, exatamente o que ' +
  'aquela invocação havia criado (corte por `process.uptime()`). O que o cancelamento não alcança está descrito em ' +
  '`docs/cancelamento-de-massa.md`.';

export const GRUPOS = [
  {
    id: 'G1',
    titulo: 'D-01 — a SC nasce presa no marco de Início, na conta de integração',
    natureza: 'catalogado',
    resumo:
      'O widget envia `targetState: 6` (START_EVENT_NORMAL) com `targetAssignee: consumerkeycompras`. A SC é criada, ' +
      'a transferência para o solicitante falha (HTTP 500 em `dsFluig_postProcessesTransfer`) e a tela ainda anuncia ' +
      '"iniciado com sucesso". Confirmado nesta execução pelo payload capturado (`targetState=6`) e pela SC 113198, ' +
      'que nasceu com responsável "Usuário Integrador Fluig".\n\n' +
      '**Novidade desta execução:** com os 24 testes do combo destravados, este grupo aparece com **veredito ' +
      'próprio em 6 testes** — em 02/09 ele constava com zero, porque todos estavam mascarados. Note também que a ' +
      'SC 113225 (CT-CMP-08-H) **chegou** à Validação do Gestor: o bloqueio de D-01 não é absoluto, oscila.',
  },
  {
    id: 'G2',
    titulo: 'Payload da SC — itens fantasma, campos chumbados, classeValor vazio e revisão incoerente (D-02, D-04, CT-ACC-04-S5, CT-ACC-06)',
    natureza: 'catalogado',
    resumo:
      'O serviço que monta o payload do `/wf_solicitacao_compras/start` fabrica quantidade para item sem quantidade ' +
      '(cascata `resolveQuant` → fallback 1), fixa `campoDescritor` em "Sol. Compras - CASSI SEDE" para qualquer ' +
      'filial, manda `tbprod_classeValor` vazio em todos os itens e envia `revisaContrato` divergente da revisão real ' +
      'do contrato apontado por `nrContrato`. Quatro assertions distintas, uma única origem: o montador do payload não ' +
      'lê o contrato de origem com fidelidade.\n\n' +
      '**Novidade desta execução:** os quatro testes deste grupo estavam mascarados em 02/09 e agora reprovam com ' +
      'veredito direto, cada um citando o contrato real sorteado pela grade de massa.',
  },
  {
    id: 'G3',
    titulo: 'Formulários clássicos aceitam Enviar sem validação — fail-open na SC, Cotação, Negociação e Parecer',
    natureza: 'catalogado',
    resumo:
      'Cinco formulários diferentes disparam `POST /ecm/api/rest/ecm/workflowView/send` sem nenhuma validação de ' +
      'cliente: a SC clássica ainda montando (CT-CMP-07-S1), a SC sem anexo obrigatório — que o **servidor também ' +
      'aceita**, e nesta execução criou a SC do teste destrutivo (CT-CMP-02-S4) —, a Cotação sem fornecedor, a ' +
      'Negociação sem proposta e o Parecer Técnico sem responsável. Os que não gravaram só não gravaram porque a ' +
      '`utils/guarda-criacao.js` bloqueou a escrita; o `expect(guarda.tentativas()).toBe(0)` é a prova de que a ' +
      'tentativa saiu do cliente.',
  },
  {
    id: 'G4',
    titulo: 'Validação só no cliente — o servidor aceita tipoSolicitação vazio e não alerta duplicidade',
    natureza: 'novo',
    resumo:
      'Dois furos de validação de servidor no start da SC pelo portal: o start direto com `tipoSolicitacao` vazio ' +
      'responde **200** (enquanto `motivoSolCompra` vazio é recusado), e abrir o modal de um contrato que já tem SC ' +
      'em andamento não exibe aviso algum de duplicidade. Os dois são contornáveis por quem chame a API direto — a ' +
      'regra existe apenas na tela. Nenhum dos dois está na tabela de defeitos do README.',
  },
  {
    id: 'G5',
    titulo: 'CT-CMP-08-H — o ciclo de correção é um beco sem saída: a SC reprovada não consegue voltar ao fluxo',
    natureza: 'catalogado',
    resumo:
      'Este é o cartão mais importante desta execução, porque em 02/09 ele estava mascarado pelo combo e só foi ' +
      'obtido numa medição suplementar. Agora ele rodou no fluxo normal e reproduziu o defeito ponta a ponta: a SC ' +
      '113225 percorreu Início → Grava SC e Anexos → Validação do Gestor → reprovação → "Ajustar Informações" e, ao ' +
      'ser reenviada pelo solicitante, o Fluig recusou a movimentação com *"Existem campos de rateio sem ' +
      'preenchimento"* — num rateio que veio do próprio contrato e que ninguém editou. A solicitação fica presa em ' +
      '"Ajustar Informações" com o solicitante, sem caminho de volta.',
  },
  {
    id: 'G6',
    titulo: 'GED aceita qualquer extensão e qualquer conteúdo (CT-GED-02-S1 / S2)',
    natureza: 'catalogado',
    resumo:
      '`.exe`, `.sh`, `.bat`, `.pdf.exe` e um binário PE renomeado para `.pdf` foram todos publicados sem mensagem ' +
      'de bloqueio. Não há allowlist de extensão nem inspeção de conteúdo (magic bytes). Diferente de 02/09, os ' +
      'cinco casos deram veredito na primeira tentativa — o `.bat` não precisou de reexecução, porque cada ' +
      'destrutivo rodou isolado e não herdou linhas residuais do publicador.',
  },
  {
    id: 'G7',
    titulo: 'Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos',
    natureza: 'catalogado',
    resumo:
      'Oito assertions de segurança reprovam, todas idênticas às de 02/09: o dataset `colleague` devolve 3.493 ' +
      'colaboradores ignorando a constraint; `GET /process-management/api/v2/requests/112009?expand=formFields` ' +
      'entrega 44 campos (razão social, CNPJ) de um processo em que a conta não participa (BOLA); `ds_Fluig` ' +
      '(credencial de integração) e `dsFluig_executeSql`/`dsFluig_getDocumentSql` respondem 200 para sessão ' +
      'não-admin; 6 de 23 administradores têm nome de conta técnica; 2 requisições por carga vão para ' +
      '`google-analytics.com`; e `bpm_addUserFluig`/`bpm_addUserGroup` constam do catálogo de início de um usuário ' +
      'de Compras — o de Grupo chega a abrir o formulário com o botão Enviar visível.',
  },
  {
    id: 'G8',
    titulo: 'Catálogo de processos mudou desde o inventário versionado',
    natureza: 'divergencia',
    resumo:
      'O invariante CT-PLT-10-H acusa que o conjunto `onlyCanStart` desta conta divergiu do inventário versionado, e ' +
      'o teste-irmão registra que `SIGAJURI_Contencioso` **passou** a constar do catálogo — o achado anterior ' +
      '("cria solicitação mas fica fora do catálogo") mudou de estado. Cada linha é uma **mudança de permissão de ' +
      'início**, não ajuste de dados: cabe à Cassi dizer se foi intencional. O teste-irmão precisa ser reescrito ' +
      'para a nova regra, nunca silenciado.',
  },
  {
    id: 'G9',
    titulo: 'Jurídico (SIGAJURI) — combos vazios e parte contrária inalcançável',
    natureza: 'novo',
    resumo:
      '"Tipo Consulta" (Consultivo) e "Filial" (Contrato) oferecem uma única opção — o dataset que os alimenta não ' +
      'devolve nada (D-JUR-01). No Contencioso, o botão "Novo Envolvido" fica oculto pela classe ' +
      '`sem-processo-hide` tanto no estado padrão quanto com "Não possui processo" marcado: não há como registrar a ' +
      'parte contrária de uma Liminar. `docs/estabilidade-do-ambiente.md` manda tratar SIGAJURI e contratos como ' +
      'integrações **independentes** — a grade de contratos estar saudável não diz nada sobre o SIGAJURI, e é o caso ' +
      'aqui: a grade sustentou 845 registros enquanto os combos do Jurídico seguiam vazios.',
  },
  {
    id: 'G10',
    titulo: 'RH — Admissão abre o formulário errado e o Banco de Horas segue sem integração',
    natureza: 'novo',
    resumo:
      '`wf_automacao_admissao` serve o template de `rh_gbeneficios_planosaude` (associação processo↔formulário ' +
      'errada). O Banco de Horas expõe `alert()` nativo "Existem parâmetros não informado para esse servidor" (U-02) ' +
      'e a aba Autorização nunca sai de "Aguarde, processando".\n\n' +
      '**Diferença em relação a 02/09:** a Substituição de Cargos (`CT-SUB`, marcado `@achado`) **passou** nesta ' +
      'execução, e os cinco processos de RH que abrem sem bloqueio de grupo também. O RH caiu de 4 para 3 vermelhos.',
  },
  {
    id: 'G11',
    titulo: 'Contratos de API — notificações, favoritos, reset de senha do fornecedor e delegação de fiscais',
    natureza: 'catalogado',
    resumo:
      '`GET /notification/api/v1/notifications?limit=3` devolve 1000 (ignora `limit`) e `DELETE .../notifications/{id}` ' +
      'responde 500 `NotFoundException` apesar de `canRemove: true`; favoritar duas vezes responde 500 em ' +
      '`text/plain`; o reset de senha do Portal do Fornecedor com token adulterado responde **500** em vez de 4xx; e ' +
      'a Delegação de Fiscais, anunciada como iniciável no catálogo, é recusada pelo servidor com "Solicitação só ' +
      'pode ser aberta através do portal de delegação de fiscais!" — portal que não existe em nenhum ponto de ' +
      'navegação desta conta, e cujo formulário nem oferece controle para escolher o substituto.',
  },
  {
    id: 'G12',
    titulo: 'Plataforma e portais — deep-link 404, erros de console, resíduo `teste`, aba Atribuir, Clínica vazia, cache _Sync e grade truncada',
    natureza: 'catalogado',
    resumo:
      'U-01 (`/principalprocess` e `/gestao_ferias` caem em `errorPage/404` pelo deep-link, embora funcionem pela ' +
      'navegação interna), NPS 403 na Home, 404 do `fluig-style-guide.min.css` + "Comprador não encontrado" no ' +
      'Portal do Comprador, processo `teste` (categoria ADMIN) ofertado no catálogo, aba Atribuir da Gerência de ' +
      'Compras sem dados, campo "Clínica" vazio no Questionário CliniCASSI (U-14), ' +
      '`ds_protheus_getFuncionarios_restGetAll_Sync` respondendo 500 `NullPointerException` (U-12), a situação do ' +
      'contrato truncada na grade ("Finali", "Paralisa") e o alerta de indisponibilidade que nomeia o dataset errado.',
  },
  {
    id: 'G13',
    titulo: 'BPMN lento — a SC não sai de "Grava SC e Anexos" dentro dos 180 s do orçamento de espera',
    natureza: 'precondicao',
    resumo:
      'Cinco testes de ciclo (aprovar/reprovar como Gestor, sinalizar ausência de aprovador, "Somente salvar", ' +
      'Transferir) criam a própria SC pelo formulário clássico e esperam até 180 s pelo botão "Assumir tarefa" na ' +
      'Validação do Gestor. As SCs 113203/04/05 e 113221/22 continuavam em "Grava SC e Anexos" ao fim do prazo. A ' +
      'referência de campo é ~76 s.\n\n' +
      '**O intervalo de 60 s entre destrutivos eliminou uma hipótese.** Em 02/09 não dava para separar "BPMN lento" ' +
      'de "outro teste concorrente assumiu a tarefa primeiro", porque os cenários corriam juntos. Nesta execução ' +
      'cada destrutivo rodou sozinho, com 60 s de folga — e as cinco falhas **persistiram**. A concorrência está ' +
      'descartada: o que não cabe no orçamento é a própria etapa "Grava SC e Anexos". Note que o mesmo caminho ' +
      'funcionou em CT-CMP-08-H, que **chegou** à Validação do Gestor: a latência oscila, não é um travamento fixo.',
  },
  {
    id: 'G14',
    titulo: 'Pré-condição ausente — filas vazias, massa inadequada e integrações que não devolveram dado',
    natureza: 'precondicao',
    resumo:
      'Oito testes falham com `PRÉ-CONDIÇÃO AUSENTE`, de propósito, para não confundir ambiente com defeito: as ' +
      'filas de "Controle de Cotações" e "Avaliação de Propostas" estão vazias (consequência de fundo de D-01, que ' +
      'impede qualquer Cotação real de existir); nenhuma competência recusada pelo Protheus foi encontrada nos ' +
      'contratos amostrados; o usuário não tinha tarefa em pool no instante do teste de alcançabilidade; a grade não ' +
      'ofereceu contrato com `CNB_QUANT` vazio nem contrato com itens suficientes para o caso de valor multiplicado; ' +
      'o combo "UF" do Contencioso veio sem nenhuma opção; e o modal da SC não terminou de montar dentro do prazo. ' +
      'Nenhum destes é veredito sobre o produto — é o ambiente não tendo o que a medição exige.',
  },
];

const g = (grupo, natureza, id, oQueAcontece, porQue, onde, rerun) => ({ grupo, natureza, id, oQueAcontece, porQue, onde, ...(rerun ? { rerun } : {}) });

/** @type {Record<string, {grupo:string, natureza:string, id?:string, oQueAcontece:string, porQue:string, onde:string, rerun?:string}>} */
export const ANALISES = {
  // ───────────────────────── api ─────────────────────────
  'api/dataset-colleague-vazamento.spec.js:22': g('G7', 'catalogado', 'CT-SEG-01-S1',
    '`POST /api/public/ecm/dataset/datasets` com constraint `colleagueId = <login>` devolve 3.493 registros — o mesmo total obtido sem nenhuma constraint.',
    'O dataset `colleague` ignora a constraint; qualquer sessão autenticada lê a base inteira de colaboradores.',
    '`expect(comFiltro).toBe(1)` em `dataset-colleague-vazamento.spec.js`.'),
  'api/sincronizacao-protheus.spec.js:31': g('G12', 'novo', 'CT-INT-02-S1 / U-12',
    '`ds_protheus_getFuncionarios_restGetAll_Sync` e `ds_protheus_getFuncoes_restGetAll_Sync` respondem HTTP 500 `java.lang.NullPointerException` (ECMException).',
    'As variantes de cache/sincronização dos dados de RH estão quebradas; dado de RH e vigência de compra ficam defasados sem aviso.',
    '`expect(ok).toBe(true)` em `sincronizacao-protheus.spec.js`, iterando as variantes `_Sync`.'),

  // ───────────────────────── acompanhamento-contratos ─────────────────────────
  'e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js:242': g('G5', 'catalogado', 'CT-CMP-08-H',
    'A SC 113225 percorreu Início → "Grava SC e Anexos" → Validação do Gestor → reprovação → "Ajustar Informações". Ao reenviar depois de corrigida, o Fluig recusou a movimentação com *"Existem campos de rateio sem preenchimento. Preencha todos os campos e tente novamente."*',
    'O rateio veio do próprio contrato de origem e não foi editado por ninguém — mesmo assim a validação de movimentação o considera incompleto. A SC fica presa em "Ajustar Informações" com o solicitante, sem caminho de volta ao fluxo. Histórico completo de movimentações no cartão.',
    '`expect` do estado após o reenvio em `ciclo-correcao-reenvio.spec.js`.',
    'Na primeira passagem (09h35) este teste parou em `AcompanhamentoContratosPage.expectCarregada()` porque a grade do Protheus estava devolvendo zero contratos. Reexecutado às 11h51, com a grade sustentando 845 registros, **alcançou a assertion de domínio e confirmou o defeito** — é o veredito que em 02/09 só existia como medição suplementar.'),
  'e2e/acompanhamento-contratos/ciclo-gestor.spec.js:36': g('G1', 'catalogado', 'CT-E2E-01-H / D-01',
    'A SC criada nasce com estado "Início" — o marco de início do BPMN — em vez de uma etapa de trabalho do solicitante.',
    'Consequência direta de D-01: o widget envia `targetState: 6` e a transferência para o solicitante falha, deixando a SC no marco de início sob a conta de integração.',
    '`expect` do estado inicial em `ciclo-gestor.spec.js`.'),
  'e2e/acompanhamento-contratos/ciclo-gestor.spec.js:109': g('G1', 'catalogado', 'CT-E2E-02-H / D-01',
    'A SC 113195 ficou em estado "Início" e nunca chegou à "Validação do Gestor", então não há tarefa para o Gestor Imediato assumir e aprovar.',
    'D-01 mantém a solicitação presa no marco de início; ela não entra em pool algum, e a etapa seguinte do ciclo fica inalcançável.',
    'Poll por "Validação do Gestor" em `ciclo-gestor.spec.js`.'),
  'e2e/acompanhamento-contratos/ciclo-gestor.spec.js:155': g('G1', 'catalogado', 'CT-E2E-02-S1 / D-01',
    'A SC 113197 ficou em "Início" — o cenário de reprovar com justificativa e devolver a SC para "Ajustar Informações" não é alcançável.',
    'Mesma causa de D-01. O cabeçalho do arquivo já registra a dependência.',
    'Poll por "Validação do Gestor" em `ciclo-gestor.spec.js`.'),
  'e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:112': g('G1', 'catalogado', 'CT-ACC-05-H / D-01',
    'A SC 113198 nasceu com responsável "Usuário Integrador Fluig" em vez do solicitante logado.',
    'A transferência (`dsFluig_postProcessesTransfer`) falha e a SC permanece na conta de integração — a evidência mais direta de D-01, medida na solicitação já criada.',
    '`expect` do responsável da SC criada em `criacao-solicitacao.spec.js`.'),
  'e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:224': g('G2', 'catalogado', 'CT-ACC-06-S1 / D-02',
    'No contrato 00002-2026-3201 o Protheus tem 3 itens (1 com quantidade e valor, 2 sem nenhum dos dois) e a SC nasceu com os 3. Quantidades enviadas: `[1,48,1]`.',
    'O serviço FABRICA quantidade para os itens vazios (cascata `resolveQuant` → fallback 1 em contrato de serviços) e com isso eles passam pelo filtro `quant > 0` que deveria descartá-los.',
    '`expect` da contagem de itens da SC criada em `criacao-solicitacao.spec.js`.'),
  'e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:292': g('G4', 'novo', 'CT-ACC-04-S6 / D-10',
    'Um start direto com `tipoSolicitacao` vazio respondeu **HTTP 200** e criou a solicitação. O mesmo servidor recusa `motivoSolCompra` vazio.',
    'A obrigatoriedade do tipo existe apenas na validação de tela; quem chamar a API direto contorna a regra. Assimetria com o motivo, que é validado no servidor.',
    '`expect(status)` da resposta do start em `criacao-solicitacao.spec.js`.'),
  'e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:422': g('G4', 'novo', 'CT-E2E-12-S1',
    'Com a solicitação 113202 já em andamento para o contrato 00007-2023-2301, reabrir o modal do mesmo contrato/revisão não exibe aviso algum de duplicidade.',
    'Não há verificação de solicitação em andamento para o par contrato/revisão — nada impede duas SCs concorrentes para o mesmo objeto.',
    'Busca pelo aviso de duplicidade em `criacao-solicitacao.spec.js`.'),
  'e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:513': g('G14', 'precondicao', 'CT-ACC-06-S2',
    'Nenhum contrato vigente pequeno com item de `CNB_QUANT` vazio e `CNB_QTDORI` preenchido foi encontrado em 15 tentativas da grade.',
    'Sem essa massa não há como exercitar a cascata de quantidade. O teste reprova com `PRÉ-CONDIÇÃO AUSENTE` de propósito, para não ser lido como defeito.',
    '`utils/massa-contratos.js` após 15 tentativas, em `criacao-solicitacao.spec.js`.'),
  'e2e/acompanhamento-contratos/erros-no-start.spec.js:67': g('G1', 'catalogado', 'CT-ACC-05-S1 / D-01',
    'Com a transferência (`dsFluig_postProcessesTransfer`) forçada a HTTP 500, a única mensagem exibida foi o toast de sucesso — nenhum aviso de que a SC não pôde ser atribuída ao solicitante.',
    'O erro da transferência é engolido pelo widget: a tarefa fica na conta de integração e o usuário sai da tela achando que está tudo certo. É o sintoma de D-01 do ponto de vista de quem usa.',
    'Predicado que procura um aviso de falha entre todos os avisos exibidos, em `erros-no-start.spec.js`.'),
  'e2e/acompanhamento-contratos/grade-contratos.spec.js:45': g('G12', 'catalogado', 'CT-ACC-02-S1 / D-08',
    'A coluna "Situação" da grade exibe `Finali`, `Paralisa`, `Sol.Finali`, `Cancel.` — textos truncados em vez de "Finalizado", "Paralisado", "Solicitação de Finalização", "Cancelado".',
    'O widget renderiza o valor bruto do Protheus (ou corta por largura) sem mapear para o rótulo por extenso.',
    '`expect(truncadas).toEqual([])` em `grade-contratos.spec.js`, após ler todas as células da coluna.'),
  'e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js:54': g('G12', 'catalogado', 'D-11',
    'Com o dataset `dsProtheus_getItensPlanilha_restGetAll` derrubado (simulação via `derrubarDataset`), o alerta exibido é "Erro ao buscar dados da filial" — o rótulo de outro dataset.',
    'O handler de erro dos itens da planilha reutiliza a mensagem da filial. Com o Protheus fora, os dois avisos ficam idênticos — é a origem da leitura de que o "mesmo alerta aparece duas vezes".',
    '`expect(texto).toMatch(/iten|planilha/i)` em `indisponibilidade-protheus.spec.js`.'),
  'e2e/acompanhamento-contratos/modal-solicitacao-compra.spec.js:50': g('G14', 'precondicao', 'CT-ACC-03-H',
    'O modal da Solicitação de Compra não terminou de montar: a espera pelo estado carregado estourou 45 s.',
    'A montagem do modal encadeia sete datasets no Protheus; quando um deles demora além do orçamento, o teste aborta antes de qualquer assertion sobre os campos do solicitante. Não é veredito sobre o produto.',
    '`AcompanhamentoContratosPage.expectCarregada()` — `pages/AcompanhamentoContratosPage.js:51`.'),
  'e2e/acompanhamento-contratos/payload-solicitacao.spec.js:64': g('G1', 'catalogado', 'CT-E2E-01-H / D-01',
    'O payload capturado no `/wf_solicitacao_compras/start` traz `targetState: 6` — a SC nasce presa no marco de Início do BPMN.',
    'É a causa de D-01 isolada no próprio payload, sem depender do que acontece depois. Interceptar e ler o corpo prova o defeito sem gravar nada.',
    '`expect` sobre `targetState` do payload capturado, em `payload-solicitacao.spec.js`.'),
  'e2e/acompanhamento-contratos/payload-solicitacao.spec.js:206': g('G14', 'precondicao', 'CT-ACC-06-S1 / D-02',
    'Passaram-se 30 s desde o Confirmar e a requisição de start nunca foi disparada (0 capturadas).',
    'O widget só envia quando o contrato traz ITENS. A planilha do contrato sorteado veio sem produtos ou sem rateios, então o Confirmar corretamente não faz nada — é massa inadequada para este caso, não defeito.',
    '`utils/captura-payload.js:128`, chamado de `payload-solicitacao.spec.js`.'),
  'e2e/acompanhamento-contratos/payload-solicitacao.spec.js:264': g('G2', 'catalogado', 'CT-ACC-07-S1 / D-04',
    '`campoDescritor` vem "Sol. Compras - CASSI SEDE" tanto para a filial UNIDADE - CLINICASSI FORTALEZA - CE quanto para UNIDADE - CLINICASSI FLORIANOPOLIS - SC.',
    'O campo é chumbado no montador do payload e não acompanha a filial do contrato de origem — dois contratos de filiais diferentes produzem o mesmo descritor.',
    '`expect` comparando o descritor de dois contratos de filiais distintas, em `payload-solicitacao.spec.js`.'),
  'e2e/acompanhamento-contratos/payload-solicitacao.spec.js:384': g('G2', 'catalogado', 'classeValor vazio',
    '`tbprod_classeValor` vem vazio nos itens, enquanto `classeOrca` e `classificacao` vêm preenchidos no mesmo item.',
    'O montador do payload não resolve a classe de valor do item, embora resolva os dois campos vizinhos — o dado chega incompleto ao Protheus.',
    '`expect` sobre `tbprod_classeValor` do item, em `payload-solicitacao.spec.js`.'),
  'e2e/acompanhamento-contratos/payload-solicitacao.spec.js:479': g('G2', 'catalogado', 'CT-ACC-04-S5',
    '`nrContrato` aponta para um contrato cuja revisão real é vazia, mas `revisaContrato` enviado foi "001".',
    'O servidor não revalida a coerência entre número de contrato, revisão, filial e itens enviados — o payload pode apontar para um objeto que não corresponde ao que foi realmente escolhido.',
    '`expect` de coerência entre `nrContrato` e `revisaContrato`, em `payload-solicitacao.spec.js`.'),

  // ───────────────────────── compras ─────────────────────────
  'e2e/compras/aprovacoes-solicitacao-compras.spec.js:317': g('G13', 'precondicao', 'CT-CMP-04-H',
    'A SC #113203, criada pelo próprio teste, não ficou assumível ("Assumir tarefa") na Validação do Gestor dentro de 180 s. A atividade observada na tela de detalhe ainda era "Grava SC e Anexos".',
    'Latência do BPMN acima do orçamento (referência de campo ~76 s). Com 60 s de isolamento entre destrutivos, a hipótese de disputa concorrente pelo pool está descartada.',
    'Poll `toPass({ timeout: 180_000 })` por `botaoAssumirTarefaAtual()` — `aprovacoes-solicitacao-compras.spec.js:291`.'),
  'e2e/compras/aprovacoes-solicitacao-compras.spec.js:358': g('G13', 'precondicao', 'CT-CMP-04-S1',
    'A SC #113204 não ficou assumível na Validação do Gestor dentro de 180 s; atividade atual "Grava SC e Anexos". O cenário de reprovar com justificativa não chega a ser exercitado.',
    'Mesma latência de BPMN do caso anterior, medida em invocação isolada.',
    'Poll `toPass({ timeout: 180_000 })` em `aprovacoes-solicitacao-compras.spec.js:291`.'),
  'e2e/compras/aprovacoes-solicitacao-compras.spec.js:401': g('G13', 'precondicao', 'CT-CMP-05-S1',
    'A SC #113205 não ficou assumível na Validação do Gestor dentro de 180 s; atividade atual "Grava SC e Anexos".',
    'Mesma latência de BPMN. O cenário "não há aprovador habilitado para a próxima etapa" fica inalcançável.',
    'Poll `toPass({ timeout: 180_000 })` em `aprovacoes-solicitacao-compras.spec.js:291`.'),
  'e2e/compras/ciclo-cotacao.spec.js:125': g('G3', 'novo', 'CT-COT',
    'No shell do formulário de Cotação, clicar em Enviar sem fornecedor e sem vínculos não abre diálogo de erro e dispara a criação do processo.',
    'O formulário de Cotação não tem validação de obrigatórios no cliente (a SC clássica tem). A escrita só não chegou ao servidor porque a `guarda-criacao` bloqueou.',
    '`expect(dialogoErro).toBeVisible()` em `ciclo-cotacao.spec.js`.'),
  'e2e/compras/ciclo-cotacao.spec.js:168': g('G14', 'precondicao', 'CT-COT-01-H',
    'A fila "Controle De Cotações" do Portal do Comprador não tem nenhuma Cotação para operar.',
    'Nenhuma SC da suíte chega ao Protheus (consequência de fundo de D-01) e não há massa pré-existente. O teste falha com `PRÉ-CONDIÇÃO AUSENTE` de propósito.',
    'Verificação da fila em `ciclo-cotacao.spec.js`.'),
  'e2e/compras/ciclo-solicitacao-compras.spec.js:489': g('G3', 'catalogado', 'CT-CMP-02-S4',
    'Enviar a SC clássica sem anexo dispara `POST /ecm/api/rest/ecm/workflowView/send` — a tentativa de escrita foi capturada pela guarda.',
    'O cliente não valida o anexo obrigatório antes de submeter.',
    '`expect(guarda.tentativas()).toBe(0)` em `ciclo-solicitacao-compras.spec.js`.'),
  'e2e/compras/ciclo-solicitacao-compras.spec.js:567': g('G3', 'catalogado', 'CT-CMP-02-S4',
    'Sem a guarda, o servidor aceitou o envio sem anexo e **criou a SC** (registrada no livro-razão e cancelada no teardown).',
    'A regra do anexo obrigatório não existe nem no cliente nem no servidor — o cliente é contornável e o servidor não cobre a lacuna.',
    '`expect(criadas).toEqual([])` em `ciclo-solicitacao-compras.spec.js`.'),
  'e2e/compras/ciclo-solicitacao-compras.spec.js:815': g('G12', 'catalogado', 'CT-ACC-09-H',
    'A SC 113226 foi criada com anexo, mas nenhuma pasta "Processo 113226 - …" existe no GED.',
    'O produto cria essa cadeia sozinho na etapa "Grava SC e Anexos"; sem ela o anexo não tem onde ser navegado e o aprovador não o alcança.',
    '`expect(pasta).not.toBeNull()` em `ciclo-solicitacao-compras.spec.js` (poll de 120 s).',
    'Na primeira passagem o teste parou antes, no widget de Zoom do formulário ("Zoom no índice 0 não abriu/confirmou uma opção após 5 tentativas") — sintoma de ambiente, sem veredito. Reexecutado na janela saudável, **alcançou a assertion de domínio e confirmou o defeito**.'),
  'e2e/compras/fail-open-formulario-sc.spec.js:127': g('G3', 'catalogado', 'CT-CMP-07-S1',
    'Com `ds_protheus_getMatriculaTitular_rest` forçado a 500, o formulário nunca termina de montar e o clique em Enviar dispara `workflowView/send` sem validação alguma.',
    'Fail-open no cliente: o botão Enviar não espera a montagem terminar. O servidor recusou esta submissão (HTTP 500, "Nome da Filial é obrigatório") apenas porque o formulário estava vazio — quando os campos já têm valor, a mesma janela cria SC de verdade.',
    '`expect` de zero requisições de criação em `fail-open-formulario-sc.spec.js`.'),
  'e2e/compras/negociacao-proposta.spec.js:97': g('G3', 'novo', 'CT-NEG',
    'Enviar no shell de Negociação de Cotação, sem proposta vinculada, disparou `POST /ecm/api/rest/ecm/workflowView/send`.',
    'Sem validação de cliente; a guarda bloqueou a escrita antes de chegar ao servidor.',
    '`expect(guarda.tentativas()).toBe(0)` em `negociacao-proposta.spec.js`.'),
  'e2e/compras/negociacao-proposta.spec.js:131': g('G14', 'precondicao', 'CT-NEG-01',
    'A fila "Avaliação de Propostas" do Portal do Comprador não tem nenhuma cotação, com ou sem proposta de fornecedor.',
    'Mesmo bloqueio de fundo de CT-COT: D-01 impede qualquer Cotação real de existir, então não há proposta para validar ou reprovar.',
    'Verificação da fila em `negociacao-proposta.spec.js:150`.'),
  'e2e/compras/parecer-tecnico.spec.js:84': g('G3', 'novo', 'CT-PAR-01-S1',
    'Parecer Técnico sem responsável definido: o clique em Enviar disparou `workflowView/send`.',
    'O formulário nasce sem Responsável e não impede o envio.',
    '`expect(guarda.tentativas()).toBe(0)` em `parecer-tecnico.spec.js`.'),
  'e2e/compras/parecer-tecnico.spec.js:112': g('G3', 'novo', 'CT-PAR-01-S2',
    'Parecer desfavorável (Reprovado/Ajustes) com justificativa, mas sem responsável: Enviar também disparou `workflowView/send`.',
    'Mesma ausência de validação do cenário S1 — a justificativa preenchida não muda o comportamento.',
    '`expect(guarda.tentativas()).toBe(0)` em `parecer-tecnico.spec.js`.'),

  // ───────────────────────── contratos ─────────────────────────
  'e2e/contratos/delegacao-fiscais-ciclo.spec.js:42': g('G11', 'novo', 'CT-DEL-01-H',
    'O processo `wf_delegacaoFiscalContratoServico` consta do catálogo como iniciável e abre o formulário, mas ao Enviar o servidor responde 500: "Solicitação só pode ser aberta através do portal de delegação de fiscais!".',
    'O evento do processo exige um portal de origem que não existe em nenhum menu, atalho ou rota alcançável por esta conta. Catálogo e regra do processo se contradizem.',
    '`expect` da mensagem de sucesso em `delegacao-fiscais-ciclo.spec.js`.'),
  'e2e/contratos/delegacao-fiscais-ciclo.spec.js:82': g('G11', 'novo', 'CT-DEL-01-S1',
    'O formulário não oferece nenhum controle (searchbox/combobox) para informar o fiscal substituto.',
    'Inexequível pela interface atual: não há entrada de dado para exercitar "substituto inválido". Mesma causa de CT-DEL-01-H.',
    '`expect(controles).toBeGreaterThan(0)` em `delegacao-fiscais-ciclo.spec.js`.'),
  'e2e/contratos/validacoes-faturamento.spec.js:79': g('G14', 'precondicao', 'CT-FAT-02-S2',
    'Nenhuma competência recusada pelo Protheus foi encontrada nos contratos vigentes consultados (25-2022-5303, E002-2023, 00121-2023-4306, 00141-2022-5303).',
    'No momento da execução todas as competências amostradas estavam liberadas para medir. Sem uma recusa real não há como verificar se a tela avisa o usuário. Não é veredito sobre o produto.',
    'Busca por competência recusada em `validacoes-faturamento.spec.js:123`.',
    'Na primeira passagem este teste estourou o timeout de 120 s do teste (janela degradada). Reexecutado, chegou a percorrer os contratos e reprovou com a pré-condição legível.'),
  'e2e/contratos/validacoes-faturamento.spec.js:254': g('G14', 'precondicao', 'CT-FAT-02-S3',
    'O menu "Mais opções" não ofereceu "Tarefas em pool" — o usuário estava sem nenhuma tarefa em pool, e o painel só é renderizado quando há ao menos uma.',
    'Sem ler o pool não é possível afirmar que o usuário não pertence a nenhum grupo de Fiscal/CSE/Medição, que é o que o caso quer demonstrar.',
    'Verificação das entradas do menu em `validacoes-faturamento.spec.js:288`.'),

  // ───────────────────────── documentos ─────────────────────────
  'e2e/documentos/bloqueio-extensoes.spec.js:133': g('G6', 'catalogado', 'CT-GED-02-S2',
    '`qa-script-lote.bat` foi publicado no GED sem nenhuma mensagem de bloqueio.',
    'Não há allowlist de extensão: um `.bat` é executável no Windows e não pertence a nenhuma allowlist razoável de um GED documental.',
    '`expect(mensagemDeBloqueio).toBeVisible()` em `bloqueio-extensoes.spec.js`.',
    'Diferente de 02/09, este caso deu veredito na primeira tentativa. Naquele dia ele caiu por `net::ERR_NETWORK_CHANGED` e depois esbarrou em linhas residuais do publicador; rodando isolado, o problema não se repetiu.'),
  'e2e/documentos/bloqueio-extensoes.spec.js:149': g('G6', 'catalogado', 'CT-GED-02-S2',
    '`qa-script-shell.sh` foi publicado no GED sem nenhuma mensagem de bloqueio.',
    'Mesma ausência de allowlist. Uma correção que apenas coloque ".exe" numa lista negra deixa este caso vermelho — que é exatamente o ponto dele.',
    '`expect(mensagemDeBloqueio).toBeVisible()` em `bloqueio-extensoes.spec.js`.'),
  'e2e/documentos/bloqueio-extensoes.spec.js:163': g('G6', 'catalogado', 'CT-GED-02-S2',
    '`qa-relatorio.pdf.exe` foi publicado no GED sem nenhuma mensagem de bloqueio.',
    'É o disfarce clássico: o nome sugere um PDF e a extensão real é `.exe`. Uma validação que olhe só o começo do nome, ou que procure ".pdf" em qualquer posição, deixa passar.',
    '`expect(mensagemDeBloqueio).toBeVisible()` em `bloqueio-extensoes.spec.js`.'),
  'e2e/documentos/bloqueio-extensoes.spec.js:176': g('G6', 'catalogado', 'CT-GED-02-S2',
    '`qa-executavel-disfarcado.pdf` — nome `.pdf`, conteúdo começando com os magic bytes `MZ` de um executável PE/DOS — foi publicado sem mensagem.',
    'Nem o nome nem o conteúdo são inspecionados. Este caso continuará vermelho mesmo se uma allowlist por extensão for implementada, e é assim que se distingue "valida o nome" de "valida o arquivo".',
    '`expect(mensagemDeBloqueio).toBeVisible()` em `bloqueio-extensoes.spec.js`.'),
  'e2e/documentos/gestao-documentos.spec.js:66': g('G6', 'catalogado', 'CT-GED-02-S1',
    'Upload de `.exe` aceito e publicado sem nenhuma mensagem de bloqueio.',
    'Ausência de validação de extensão no GED — o caso-base do qual os quatro cenários de CT-GED-02-S2 derivam.',
    '`expect(mensagemDeBloqueio).toBeVisible()` em `gestao-documentos.spec.js`.'),

  // ───────────────────────── jurídico ─────────────────────────
  'e2e/juridico/sigajuri-consultivo.spec.js:48': g('G9', 'novo', 'CT-JUR-01-H / D-JUR-01',
    'O combo "Tipo Consulta" do `SIGAJURI_Consultivo` oferece uma única opção (só o placeholder).',
    'O dataset que alimenta os tipos de consulta não devolve registros — não dá para criar uma consulta vinculada a uma área.',
    '`expect(opcoes).toBeGreaterThan(1)` em `sigajuri-consultivo.spec.js`.'),
  'e2e/juridico/sigajuri-contencioso.spec.js:113': g('G14', 'precondicao', 'CT-JUR-04-H / CT-JUR-06-H',
    'O caso precisa de "MA" no combo "UF" e o ambiente não ofereceu **nenhuma** opção.',
    'O cadastro do SIGAJURI não devolveu as UFs. A mensagem instrui explicitamente a não contornar trocando o valor pedido no teste: é sinal de que o cadastro mudou, e deve ser confirmado com o dono do ambiente.',
    'Seleção da UF em `sigajuri-contencioso.spec.js`.'),
  'e2e/juridico/sigajuri-contencioso.spec.js:196': g('G9', 'novo', 'CT-JUR-04-S1',
    'Numa consulta do tipo "Liminar", o botão "Novo Envolvido" fica oculto (classe `sem-processo-hide`) tanto no estado padrão quanto com "Não possui processo." marcado.',
    'A regra de exibição esconde o único caminho para registrar a parte contrária — testado nos dois estados possíveis do formulário.',
    '`expect(visivel).toBe(true)` em `sigajuri-contencioso.spec.js`.'),
  'e2e/juridico/sigajuri-contrato.spec.js:32': g('G9', 'novo', 'CT-JUR-03-H / D-JUR-01',
    'O combo "Filial" do `SIGAJURI_Contrato` oferece uma única opção.',
    'Dataset de filiais vazio para esta conta/processo; não é possível montar a minuta.',
    '`expect(opcoes).toBeGreaterThan(1)` em `sigajuri-contrato.spec.js`.'),

  // ───────────────────────── notificações ─────────────────────────
  'e2e/notificacoes/contratos-api-notificacao.spec.js:98': g('G11', 'catalogado', 'CT-NOT-03-S1',
    '`GET /notification/api/v1/notifications?limit=3` devolveu 1000 itens; `offset` também não altera o resultado.',
    'O servidor ignora `limit` e `offset`. Todo cliente recebe a lista inteira hoje; no dia em que a paginação passar a valer, esses clientes mudam de comportamento sem nenhum aviso.',
    '`expect(quantidade).toBe(3)` em `contratos-api-notificacao.spec.js`.'),
  'e2e/notificacoes/contratos-api-notificacao.spec.js:171': g('G11', 'catalogado', 'CT-NOT-03-S1',
    'Cada notificação declara `canRemove: true`, mas `DELETE /notification/api/v1/notifications/{id}` responde 500 `NotFoundException` — ou seja, a rota não existe (a coleção responde `NotAllowedException`).',
    'A remoção real vive em `POST /globalalertapi/api/rest/alert/removeAlerts`, em outro módulo e sem nenhuma referência no recurso que promete ser removível.',
    'Sondagem das rotas de remoção em `contratos-api-notificacao.spec.js`.'),

  // ───────────────────────── plataforma ─────────────────────────
  'e2e/plataforma/catalogo-invariante.spec.js:149': g('G8', 'divergencia', 'CT-PLT-10-H',
    'O catálogo "Iniciar Solicitações" (`onlyCanStart=true`) desta conta divergiu do inventário versionado.',
    'Mudança de permissão de início no ambiente. O invariante existe para acusar exatamente isso; cabe à Cassi dizer se cada linha foi intencional. Não é ajuste de dados — é acesso.',
    '`expect(diff).toEqual({entraram:[], sairam:[]})` em `catalogo-invariante.spec.js`.'),
  'e2e/plataforma/catalogo-invariante.spec.js:224': g('G8', 'divergencia', 'CT-PLT-10-H',
    '`SIGAJURI_Contencioso` **passou** a constar do catálogo `onlyCanStart` — o achado anterior ("cria solicitação mas fica fora do catálogo") mudou de estado.',
    'A permissão de início parece ter sido alinhada ao filtro da tela. O teste, por desenho, acusa a mudança e pede reescrita para a nova regra — nunca silenciamento.',
    '`expect(catalogo).not.toContain("SIGAJURI_Contencioso")` em `catalogo-invariante.spec.js`.'),
  'e2e/plataforma/deep-link-spa.spec.js:19|principalprocess': g('G12', 'catalogado', 'CT-PLT-04 / U-01',
    'Abrir `/portal/p/1/principalprocess` direto pela URL termina em `/portal/p/1/errorPage/404`.',
    'A rota existe e funciona pela navegação interna da SPA; o deep-link quebra — link salvo, favorito e compartilhamento de endereço não funcionam.',
    '`expect(page).not.toHaveURL(/errorPage\\/404/)` em `deep-link-spa.spec.js`.'),
  'e2e/plataforma/deep-link-spa.spec.js:19|gestao_ferias': g('G12', 'catalogado', 'CT-PLT-04 / U-01',
    'Abrir `/portal/p/1/gestao_ferias` direto pela URL termina em `/portal/p/1/errorPage/404`.',
    'Mesma quebra de deep-link da rota irmã: a SPA resolve a rota internamente, mas não a partir de uma URL digitada ou salva.',
    '`expect(page).not.toHaveURL(/errorPage\\/404/)` em `deep-link-spa.spec.js`.'),
  'e2e/plataforma/erros-de-console.spec.js:152': g('G12', 'catalogado', 'CT-PLT-06-S1',
    'O Portal do Comprador carrega com 2 erros de console não catalogados: 404 em `/style-guide/css/fluig-style-guide.min.css` e `console.error` "Erro ao buscar as informações do colaborador… Comprador não encontrado".',
    'CSS ausente no deploy e a busca do comprador no Protheus não encontra a conta `TOTVS-FS` (que não está na SY1). Erro de JS/rede na carga degrada o widget em silêncio.',
    '`expect(naoCatalogados).toEqual([])` em `erros-de-console.spec.js`.'),
  'e2e/plataforma/favoritos-contrato-api.spec.js:126': g('G11', 'catalogado', 'CT-PLT-07-S1',
    'Favoritar `SIGAJURI_Contencioso` duas vezes: a 2ª chamada responde **500** em `text/plain` com "Processo SIGAJURI_Contencioso já está nos seus favoritos.".',
    'Condição de negócio trivial (duplo clique, duas abas, retentativa de rede) tratada como erro de servidor, em texto puro — quebra qualquer cliente que faça parse do corpo.',
    'Verificação do par requisição/resposta em `favoritos-contrato-api.spec.js`.'),
  'e2e/plataforma/home.spec.js:7': g('G12', 'catalogado', 'NPS 403',
    'A Home carrega com "Failed to load resource: 403 (Forbidden)" no console.',
    '`GET /nps/api/v1/surveys` responde 403 em toda carga da Home.',
    '`expect(erros).toEqual([])` em `home.spec.js`.'),
  'e2e/plataforma/processo-inativo-e-residuo.spec.js:62': g('G12', 'catalogado', 'CT-PLT-08-S1',
    'O processo `teste` (categoria ADMIN, resíduo de desenvolvimento, nunca iniciado) continua ofertado em "Iniciar Solicitações" para um usuário de Compras.',
    'Falta de governança de publicação; abri-lo serve o formulário completo da SC — o teste-irmão marcado `@achado` passa, confirmando o comportamento.',
    'Leitura do catálogo em `processo-inativo-e-residuo.spec.js`.'),

  // ───────────────────────── portais ─────────────────────────
  'e2e/portais/acesso-fornecedor.spec.js:107': g('G11', 'novo', 'CT-PFN-02-S2',
    'Enviar um token de redefinição de senha adulterado/expirado ao endpoint do Portal do Fornecedor responde **HTTP 500**.',
    'O endpoint não trata token inválido como erro controlado (4xx) — crasha. A troca não se efetiva, mas o comportamento é de exceção não tratada.',
    '`expect(status).toBeLessThan(500)` em `acesso-fornecedor.spec.js`.'),
  'e2e/portais/gerencia-compras.spec.js:31': g('G12', 'catalogado', 'Aba Atribuir',
    'A aba "Atribuir" da Gerência de Compras nunca lista SCs (só o cabeçalho) em 30 s de poll; a aba "Transferir", com o mesmo mecanismo, lista dados reais.',
    'A grade de Atribuir não renderiza dados para esta conta; reclicar não resolve. O contraste com Transferir é o que separa "sem massa" de "grade quebrada".',
    '`expect(linhas).toBeGreaterThan(1)` em `gerencia-compras.spec.js`.'),

  // ───────────────────────── rh ─────────────────────────
  'e2e/rh/admissao.spec.js:36': g('G10', 'novo', 'CT-ADM-01-H',
    'Iniciar `wf_automacao_admissao` abre o formulário "Gestão de Benefícios - Plano de Saúde" (template de `rh_gbeneficios_planosaude`).',
    'Associação processo↔formulário incorreta na publicação do processo. CT-ADM-01-S1 e S2 ficam inexequíveis por consequência.',
    '`expect(titulo).not.toBe("Gestão de Benefícios - Plano de Saúde")` em `admissao.spec.js`.'),
  'e2e/rh/banco-horas-limite.spec.js:38': g('G10', 'catalogado', 'CT-BH-01-S2 / U-02',
    'A aba Autorização do Banco de Horas fica em "Aguarde, processando" por 30 s ou mais e nenhum campo aparece.',
    'Integração com o Protheus não configurada para o widget (mesma causa de U-02); o cenário "acima do limite" não é alcançável por esta rota.',
    '`expect(getByText("Aguarde, processando")).toBeHidden()` em `banco-horas-limite.spec.js`.'),
  'e2e/rh/banco-horas.spec.js:14': g('G10', 'catalogado', 'CT-BH-01-S1 / U-02',
    'Ao abrir o Banco de Horas, um `alert()` nativo diz "Existem parâmetros não informado para esse servidor, informe o administrador".',
    'Erro de configuração de servidor exposto ao usuário final. Capturado com `page.on("dialog")` registrado ANTES da navegação — sem isso o Playwright dispensa o diálogo e a falha some.',
    '`expect(dialogos).toEqual([])` em `banco-horas.spec.js`.'),

  // ───────────────────────── saúde ─────────────────────────
  'e2e/saude/questionario-clinicassi.spec.js:217': g('G12', 'novo', 'CT-CLI-02-S1 / U-14',
    'O campo "Clínica" do Questionário CliniCASSI nasce vazio em vez de identificar a clínica do diagnóstico.',
    'Sintoma compatível com o job `dsQDC000` parado (U-14); sem acesso admin a suíte só confirma o sintoma, não a causa.',
    '`expect(clinica).not.toBe("")` em `questionario-clinicassi.spec.js`.'),

  // ───────────────────────── segurança ─────────────────────────
  'e2e/seguranca/auditoria-datasets.spec.js:18': g('G7', 'novo', 'CT-SEG-02-S1 / U-13',
    '6 de 23 administradores da plataforma têm login/nome de conta de integração/serviço (`consumerkey`, `fluig_consumer`, `integr`…).',
    'Contas técnicas com privilégio de administrador — menor privilégio violado.',
    '`expect(tecnicasAdmin).toBe(0)` em `auditoria-datasets.spec.js`.'),
  'e2e/seguranca/auditoria-datasets.spec.js:71': g('G7', 'novo', 'CT-SEG-03-S1 / U-03',
    'O dataset `ds_Fluig` ("Usuário e Senha usuario de integração") responde 200 (1 registro, 3 colunas) para a sessão não-admin.',
    'Dataset de credencial sem restrição de acesso; `/webdesk` nega (403) mas o dataset não. A evidência é estrutural — o conteúdo nunca é lido pelo teste.',
    '`expect(status).toBe(403)` em `auditoria-datasets.spec.js`.'),
  'e2e/seguranca/auditoria-datasets.spec.js:103': g('G7', 'novo', 'CT-SEG-04-S1 / U-04',
    '`dsFluig_executeSql` e `dsFluig_getDocumentSql` (executores de SQL) respondem 200 para a sessão não-admin.',
    'Executor de SQL alcançável sem privilégio elevado. A auditoria de injeção real está fora de escopo; esta assertion cobre só a alcançabilidade, que já basta.',
    '`expect(status).toBe(403)` em `auditoria-datasets.spec.js`.'),
  'e2e/seguranca/isolamento-horizontal-api-processos.spec.js:59': g('G7', 'catalogado', 'CT-SEG-07-S1',
    '`TOTVS-FS` — que não é requisitante, responsável nem participante da instância 112009 de `bpm_recepcao_documentos_fiscais_compras` (8 tarefas inspecionadas, nenhuma sua), processo que a conta nem pode iniciar — recebe HTTP 200 com 44 `formFields`, incluindo razão social e CNPJ.',
    'Isolamento horizontal quebrado na API v2 de processos; o `processInstanceId` é sequencial, então qualquer sessão autenticada enumera a base inteira de documentos fiscais.',
    'Verificação do status e dos `formFields` em `isolamento-horizontal-api-processos.spec.js`.'),
  'e2e/seguranca/lgpd-envio-google-analytics.spec.js:22': g('G7', 'catalogado', 'U-11',
    '2 requisições de navegação para `google-analytics.com` (medição `G-F0FT6D1NQG`) numa única carga.',
    'Telemetria externa ativa. A pergunta aberta nº 3 do README pede posição da área de Privacidade/LGPD sobre isso.',
    '`expect(envios).toBe(0)` em `lgpd-envio-google-analytics.spec.js`.'),
  'e2e/seguranca/processos-administrativos-usuario-comum.spec.js:39|bpm_addUserFluig': g('G7', 'catalogado', 'CT-SEG-08-S1',
    '`bpm_addUserFluig` (Adicionar Usuário) consta do catálogo `onlyCanStart` da conta não-admin, e abri-lo não exibe o diálogo de erro de permissão.',
    'Processo de criação de usuário iniciável por perfil de Compras — segregação de função violada.',
    'Leitura do catálogo e abertura do processo em `processos-administrativos-usuario-comum.spec.js`.'),
  'e2e/seguranca/processos-administrativos-usuario-comum.spec.js:39|bpm_addUserGroup': g('G7', 'catalogado', 'CT-SEG-08-S1',
    '`bpm_addUserGroup` (Adicionar Grupo) consta do catálogo da conta não-admin **e o formulário de início carregou com o botão "Enviar" visível** — o processo administrativo abriu de fato.',
    'É a superfície da escalada de privilégio: não só o processo é ofertado, como a tela de criação de grupo fica operável para um perfil de negócio.',
    'Verificação do botão Enviar em `processos-administrativos-usuario-comum.spec.js`.'),

  // ───────────────────────── tarefas ─────────────────────────
  'e2e/tarefas/acoes-da-tarefa.spec.js:184': g('G13', 'precondicao', 'CT-TSK-07-H',
    'A SC #113221, criada pelo próprio teste, não ficou assumível em Validação do Gestor Imediato dentro de 180 s; atividade observada: "Grava SC e Anexos".',
    'Latência do BPMN acima do orçamento. O teste aborta antes de exercitar "Somente salvar", que é a ação sob teste.',
    'Poll `toPass({ timeout: 180_000 })` em `acoes-da-tarefa.spec.js:87`.'),
  'e2e/tarefas/acoes-da-tarefa.spec.js:297': g('G13', 'precondicao', 'CT-TSK-08-H',
    'A SC #113222 não ficou assumível em Validação do Gestor Imediato dentro de 180 s; atividade observada: "Grava SC e Anexos".',
    'Mesma latência de BPMN. O teste aborta antes de exercitar Transferir.',
    'Poll `toPass({ timeout: 180_000 })` em `acoes-da-tarefa.spec.js:87`.'),
};
