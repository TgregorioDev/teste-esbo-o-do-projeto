// Camada de análise da execução de 02/09/2026 — escrita à mão sobre as 81 falhas medidas.
// Cada entrada é chaveada por `arquivo:linha` (mais um fragmento do título quando a mesma
// linha gera vários testes parametrizados).

export const NATUREZAS = {
  catalogado: { rotulo: 'Defeito de produto — já catalogado no README', cor: 'produto' },
  novo: { rotulo: 'Defeito de produto — achado desta execução (não catalogado)', cor: 'produto' },
  divergencia: { rotulo: 'Divergência ambiente × suíte (o ambiente mudou)', cor: 'divergencia' },
  precondicao: { rotulo: 'Pré-condição ausente (ambiente / massa / latência)', cor: 'ambiente' },
  infra: { rotulo: 'Infraestrutura da máquina de execução', cor: 'infra' },
  semVeredito: { rotulo: 'Sem veredito (falhou antes da assertion de domínio)', cor: 'sem-veredito' },
  naoDeterministico: { rotulo: 'Comportamento não determinístico do produto', cor: 'sem-veredito' },
};

/**
 * Grupos por causa raiz. A ordem é a de leitura do documento: primeiro o que mascara mais
 * testes, depois defeitos por área, por fim ambiente e infraestrutura.
 */
export const GRUPOS = [
  {
    id: 'G1',
    titulo: 'O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption`',
    natureza: 'divergencia',
    resumo:
      'A factory `factories/solicitacao-compra.js` preenche o modal com o tipo padrão "Renovação Contratual". ' +
      'Hoje o ambiente oferece **"Selecione...", "Aditivo Contratual" e "Nova Contratação"**: a opção que a suíte ' +
      'usa sumiu e uma nova entrou (o README já registrava, na pergunta aberta nº 2, que "Nova Solicitação" havia ' +
      'sumido antes; agora foi "Renovação Contratual"). Todo teste que passa pelo `SolicitacaoCompraModal.preencher()` ' +
      'fica preso em `selectOption` até o `actionTimeout` de 45 s e morre com `did not find some options` — ' +
      '**antes de chegar à assertion que dá nome ao teste**. Por isso essas 24 falhas NÃO dizem nada sobre o produto ' +
      'por si só.\n\n' +
      '**Medição suplementar:** rodei a pasta de novo com a factory apontando para "Aditivo Contratual" (edição ' +
      'temporária, revertida em seguida — nada foi commitado). Resultado: **9 dos 24 passam** e **15 continuam ' +
      'vermelhos**, agora com o veredito real de cada um (registrado cartão a cartão abaixo, no campo ' +
      '"Reexecução com Aditivo").\n\n' +
      '**Ação sugerida:** confirmar com a Cassi se a remoção de "Renovação Contratual" foi intencional (mesma ' +
      'pergunta aberta nº 2 do README, agora com a lista invertida) e alinhar `TIPO_SOLICITACAO` na factory ao ' +
      'que o ambiente oferece. Até lá, a cobertura real do Portal de Acompanhamento de Contratos está mascarada.',
  },
  {
    id: 'G2',
    titulo: 'D-01 — a SC nasce presa no marco de Início, na conta de integração',
    natureza: 'catalogado',
    nota: '0 na execução principal — os 6 testes deste grupo foram mascarados por G1; 5 confirmaram D-01 e 1 ficou sem veredito na reexecução com "Aditivo"',
    reexec: [
      'e2e/acompanhamento-contratos/payload-solicitacao.spec.js:59',
      'e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:106',
      'e2e/acompanhamento-contratos/erros-no-start.spec.js:67',
      'e2e/acompanhamento-contratos/ciclo-gestor.spec.js:109',
      'e2e/acompanhamento-contratos/ciclo-gestor.spec.js:155',
      'e2e/acompanhamento-contratos/ciclo-gestor.spec.js:36',
    ],
    resumo:
      'O widget envia `targetState: 6` (START_EVENT_NORMAL) com `targetAssignee: consumerkeycompras`. A SC é ' +
      'criada, a transferência para o solicitante falha (HTTP 500 em `dsFluig_postProcessesTransfer`) e a tela ' +
      'ainda anuncia "iniciado com sucesso". Consequência em cascata: nada criado pelo portal chega ao Gestor, ' +
      'ao Protheus, à Cotação ou à Negociação. Confirmado hoje pelo payload capturado (`targetState=6`) e pela SC ' +
      '113182, que nasceu com responsável "Usuário Integrador Fluig".',
  },
  {
    id: 'G3',
    titulo: 'Payload da SC — valores, itens fantasma, campos chumbados e revisão vazia (D-02, D-04, CT-ACC-04-S5, CT-ACC-06, classeValor)',
    natureza: 'catalogado',
    nota: '0 na execução principal — os 6 testes deste grupo foram mascarados por G1 e todos confirmaram o defeito na reexecução com "Aditivo" (outras 3 assertions de D-02 passaram)',
    reexec: [
      'e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:218',
      'e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:507',
      'e2e/acompanhamento-contratos/payload-solicitacao.spec.js:142',
      'e2e/acompanhamento-contratos/payload-solicitacao.spec.js:219',
      'e2e/acompanhamento-contratos/payload-solicitacao.spec.js:339',
      'e2e/acompanhamento-contratos/payload-solicitacao.spec.js:434',
    ],
    resumo:
      'O serviço que monta o payload do `/wf_solicitacao_compras/start` fabrica quantidade para item sem ' +
      'quantidade (`resolveQuant` → fallback 1), repete o valor cheio em item de qtd 1, fixa `campoDescritor` em ' +
      '"Sol. Compras - CASSI SEDE" para qualquer filial, manda `tbprod_classeValor` vazio em todos os itens e ' +
      'envia `revisaContrato: ""` para um contrato cuja revisão real é "003". Cinco assertions distintas, uma ' +
      'única origem: o montador do payload não lê o contrato de origem com fidelidade. Nesta execução, três ' +
      'assertions de D-02 (valor multiplicado) **passaram** com o contrato sorteado — o defeito depende da ' +
      'composição de itens do contrato.',
  },
  {
    id: 'G4',
    titulo: 'Formulários clássicos aceitam Enviar sem validação — fail-open, SC sem anexo, Cotação, Negociação, Parecer',
    natureza: 'catalogado',
    nota: 'mais 3 mascarados por G1 e confirmados na reexecução: CT-CMP-08-H (beco sem saída da correção), CT-ACC-04-S6 (servidor aceita tipoSolicitacao vazio) e CT-E2E-12-S1 (sem alerta de duplicidade)',
    reexec: [
      'e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js:242',
      'e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:286',
      'e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:416',
    ],
    resumo:
      'Cinco formulários diferentes disparam `POST /ecm/api/rest/ecm/workflowView/send` sem nenhuma validação de ' +
      'cliente: a SC clássica ainda montando (CT-CMP-07-S1), a SC sem anexo obrigatório — que o **servidor também ' +
      'aceita** e criou a SC #113167 (CT-CMP-02-S4) —, a Cotação sem fornecedor, a Negociação sem proposta e o ' +
      'Parecer Técnico sem responsável. Os três últimos só não gravaram porque a `guarda-criacao` bloqueou a escrita; ' +
      'o `expect(guarda.tentativas()).toBe(0)` é a prova de que a tentativa saiu.',
  },
  {
    id: 'G5',
    titulo: 'GED aceita qualquer extensão e qualquer conteúdo (CT-GED-02-S1 / S2)',
    natureza: 'catalogado',
    resumo:
      '`.exe`, `.sh`, `.bat`, `.pdf.exe` e um binário PE renomeado para `.pdf` foram todos publicados sem ' +
      'mensagem de bloqueio. Não há allowlist de extensão nem inspeção de conteúdo (magic bytes). O caso `.bat` ' +
      'caiu na execução principal por `net::ERR_NETWORK_CHANGED` (infra), tentou de novo e esbarrou em linhas ' +
      'residuais do publicador deixadas pela tentativa abortada, e na terceira reexecução **confirmou o mesmo ' +
      'defeito** dos irmãos.',
  },
  {
    id: 'G6',
    titulo: 'Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos',
    natureza: 'catalogado',
    resumo:
      'Sete assertions de segurança reprovam: dataset `colleague` devolve 3.493 colaboradores ignorando a constraint; ' +
      '`GET /process-management/api/v2/requests/112009?expand=formFields` entrega 44 campos (razão social, CNPJ) de ' +
      'um processo em que a conta não participa (BOLA); `ds_Fluig` (credencial de integração) e `dsFluig_executeSql` ' +
      'respondem 200 para sessão não-admin; 6 de 23 administradores têm nome de conta técnica; 2 requisições por carga ' +
      'vão para `google-analytics.com`; e `bpm_addUserFluig`/`bpm_addUserGroup` constam do catálogo de início de um ' +
      'usuário de Compras. Os três de datasets/admin (U-03, U-04, U-13) não estão na tabela do README.',
  },
  {
    id: 'G7',
    titulo: 'Catálogo de processos mudou desde o inventário versionado — 6 processos passaram a ser iniciáveis',
    natureza: 'divergencia',
    resumo:
      '`GestaoDependentes`, `SIGAJURI_AprovaFU`, `SIGAJURI_Contencioso`, `SIGAJURI_Contrato`, ' +
      '`rh_gbeneficios_planosaude` e `wf_substituicaocargos` entraram no catálogo `onlyCanStart` desta conta. ' +
      'O invariante CT-PLT-10-H existe exatamente para acusar isso: cada linha é uma **mudança de permissão de ' +
      'início**, não ajuste de dados. Dois dos seis são processos de RH que a pergunta aberta nº 1 do README ' +
      'já questionava. O teste-irmão que afirmava "SIGAJURI_Contencioso fica fora do catálogo" precisa ser ' +
      'reescrito para a nova regra — não silenciado.',
  },
  {
    id: 'G8',
    titulo: 'Jurídico (SIGAJURI) — combos vazios e parte contrária inalcançável',
    natureza: 'novo',
    resumo:
      '"Tipo Consulta" (Consultivo) e "Filial" (Contrato) oferecem uma única opção — o dataset que os alimenta ' +
      'não devolve nada (D-JUR-01). No Contencioso, o botão "Novo Envolvido" fica oculto pela classe ' +
      '`sem-processo-hide` tanto no estado padrão quanto com "Não possui processo" marcado: não há como ' +
      'registrar a parte contrária de uma Liminar.',
  },
  {
    id: 'G9',
    titulo: 'RH — Admissão abre o formulário errado, Banco de Horas sem integração, Substituição de Cargos oscila',
    natureza: 'novo',
    resumo:
      '`wf_automacao_admissao` serve o template de `rh_gbeneficios_planosaude` (associação processo↔formulário ' +
      'errada). O Banco de Horas expõe `alert()` nativo "Existem parâmetros não informado para esse servidor" (U-02) ' +
      'e a aba Autorização nunca sai de "Aguarde, processando". A Substituição de Cargos, com a MESMA resposta do ' +
      'ERP, ora bloqueia ora libera os 8 campos — hoje liberou, e o teste, escrito contra o bloqueio, reprovou.',
  },
  {
    id: 'G10',
    titulo: 'Contratos de API — notificações, favoritos, reset de senha do fornecedor, medição e delegação de fiscais',
    natureza: 'catalogado',
    resumo:
      '`GET /notification/api/v1/notifications?limit=3` devolve 1000 (ignora `limit`; eram 707 em 27/08) e ' +
      '`DELETE .../notifications/{id}` responde 500 `NotFoundException` apesar de `canRemove: true`; favoritar ' +
      'duas vezes responde 500 em `text/plain`; o reset de senha do Portal do Fornecedor com token adulterado ' +
      'responde **500** em vez de 4xx (achado novo); o Protheus recusa a medição ("Existe revisão pendente") e a ' +
      'tela não avisa; e a Delegação de Fiscais, anunciada como iniciável no catálogo, é recusada pelo servidor ' +
      'com "Solicitação só pode ser aberta através do portal de delegação de fiscais!" — portal que não existe em ' +
      'nenhum ponto de navegação desta conta.',
  },
  {
    id: 'G11',
    titulo: 'Plataforma — deep-link 404, erros de console, resíduo `teste`, Aba Atribuir, Clínica vazia, cache _Sync',
    natureza: 'catalogado',
    resumo:
      'U-01 (`/principalprocess` e `/gestao_ferias` caem em `errorPage/404`), NPS 403 na Home, 404 do ' +
      '`fluig-style-guide.min.css` + "Comprador não encontrado" no Portal do Comprador, processo `teste` ' +
      '(categoria ADMIN) ofertado no catálogo, aba Atribuir da Gerência de Compras sem dados, campo "Clínica" ' +
      'vazio no Questionário CliniCASSI (U-14) e `ds_protheus_getFuncionarios_restGetAll_Sync` respondendo 500 ' +
      '`NullPointerException` (U-12).',
  },
  {
    id: 'G12',
    titulo: 'BPMN lento — a SC não sai de "Grava SC e Anexos" dentro dos 180 s do orçamento de espera',
    natureza: 'precondicao',
    resumo:
      'Cinco testes de ciclo (aprovar/reprovar como Gestor, sinalizar ausência de aprovador, Somente salvar, ' +
      'Transferir) criam a própria SC pelo formulário clássico e esperam até 180 s pelo botão "Assumir tarefa" na ' +
      'Validação do Gestor. Nas duas rodadas de hoje (com carga e isolados) as SCs 113162/63/65/66/68 e depois ' +
      '113187/88/89/90/91 continuavam em "Grava SC e Anexos" ao fim do prazo. A referência de campo era ~76 s. ' +
      'O mesmo caminho, em `portais/*.spec.js` (helper `aprovarValidacaoDoGestor`, que espera até 150 s pelo ' +
      '"Assumir tarefa"), **chegou** à Validação do Gestor e à Orçamentária em 5 testes entre 15h16 e 15h20 — logo o ' +
      'fluxo funciona e a latência oscila ao longo da tarde (lenta 15h04–15h15, rápida 15h16–15h20, lenta de novo 15h35). ' +
      'É latência de ambiente, não defeito da ação sob teste. A falha `CT-ACC-09-H` (pasta "Processo N" não ' +
      'aparece no GED em 120 s) é criada nessa mesma etapa e muito provavelmente tem a mesma causa.',
  },
  {
    id: 'G13',
    titulo: 'Filas vazias — nada para operar em Cotação, Negociação e pool de tarefas',
    natureza: 'precondicao',
    resumo:
      '"Controle de Cotações" e "Avaliação de Propostas" do Portal do Comprador estão vazias porque nenhuma SC ' +
      'criada pela suíte chega ao Protheus (consequência de D-01) e não há massa pré-existente; o Resumo de Tarefas ' +
      'mostrava "Tarefas em pool (0)" no momento do teste de assumir do pool. Os testes falham com ' +
      '`PRÉ-CONDIÇÃO AUSENTE` de propósito, para não confundir ambiente com defeito.',
  },
  {
    id: 'G14',
    titulo: 'Divergências pontuais do ambiente e falhas sem veredito',
    natureza: 'divergencia',
    resumo:
      'O teste que lista os tipos do modal reprova porque "Renovação Contratual" não existe mais; ' +
      '`CT-FAT-02-S3` estourou 45 s clicando em "Tarefas em pool" antes de qualquer assertion de domínio.',
  },
];

/** @type {Record<string, {grupo:string, natureza:string, id?:string, oQueAcontece:string, porQue:string, onde:string}>} */
export const ANALISES = {
  // ───────────────────────── acompanhamento-contratos — os 24 do combo ─────────────────────────
  ...comboTipo('e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js:242', 'CT-CMP-08-H',
    'Reexecutado com "Aditivo": a SC 113180 percorreu Início → Grava SC → Validação do Gestor → reprovação → "Ajustar Informações" e, ao reenviar, o Fluig recusou com "Existem campos de rateio sem preenchimento" — num rateio que veio do contrato e ninguém tocou. Beco sem saída confirmado (README: CT-CMP-08-H). Histórico completo no cartão.'),
  ...comboTipo('e2e/acompanhamento-contratos/ciclo-gestor.spec.js:36', 'CT-E2E-01-H / D-01',
    'Reexecutado com "Aditivo": estourou `page.waitForResponse` (45 s) na Central de Tarefas ao procurar a SC recém-criada — sem veredito direto. O cabeçalho do arquivo atribui a pré-condição a D-01 (a SC presa em Início não aparece em lista alguma).'),
  ...comboTipo('e2e/acompanhamento-contratos/ciclo-gestor.spec.js:109', 'CT-E2E-02-H / D-01',
    'Reexecutado com "Aditivo": a SC 113178 ficou em estado "Início" e nunca chegou à "Validação do Gestor" — D-01 confirmado.'),
  ...comboTipo('e2e/acompanhamento-contratos/ciclo-gestor.spec.js:155', 'CT-E2E-02-S1 / D-01',
    'Reexecutado com "Aditivo": o poll de 45 s por "Validação do Gestor" estourou — a SC não saiu de Início (D-01).'),
  ...comboTipo('e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:106', 'CT-ACC-05-H / D-01',
    'Reexecutado com "Aditivo": a SC 113182 nasceu com responsável "Usuário Integrador Fluig" em vez do solicitante — D-01 confirmado.'),
  ...comboTipo('e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:218', 'CT-ACC-06-S1',
    'Reexecutado com "Aditivo": contrato 000000000000001 tem 7 itens (5 com qtd/valor + 2 sem nada) e a SC nasceu com 7 — o serviço fabrica quantidade para os itens vazios (cascata `resolveQuant` → fallback 1) e eles passam pelo filtro `quant > 0`. Quantidades enviadas: [29,1,1,29,29,29,29]. Defeito confirmado.'),
  ...comboTipo('e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:286', 'CT-ACC-04-S6 / D-10',
    'Reexecutado com "Aditivo": start direto com `tipoSolicitacao` vazio respondeu **200** (o servidor recusa `motivoSolCompra` vazio, mas não o tipo). Validação só no cliente — contornável. Defeito confirmado, não catalogado no README.'),
  ...comboTipo('e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:416', 'CT-E2E-12-S1',
    'Reexecutado com "Aditivo": com a SC 113185 já em andamento para o contrato 000000000000001, reabrir o modal do mesmo contrato não exibe aviso algum de duplicidade. Defeito confirmado, não catalogado no README.'),
  ...comboTipo('e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:507', 'CT-ACC-06-S2',
    'Reexecutado com "Aditivo": contrato 000000000000002 tem `CNB_QUANT` vazio e `CNB_QTDORI=36`; a SC deveria herdar 36 pela cascata e enviou quantidade 1. Defeito confirmado.'),
  ...comboTipo('e2e/acompanhamento-contratos/erros-no-start.spec.js:34', 'CT-ACC-05-S2', 'Reexecutado com "Aditivo": **PASSOU** — com HTTP 500 no start, o widget avisa e permite nova tentativa.'),
  ...comboTipo('e2e/acompanhamento-contratos/erros-no-start.spec.js:67', 'CT-ACC-05-S1 / D-01 (sintoma)',
    'Reexecutado com "Aditivo": com a transferência (`dsFluig_postProcessesTransfer`) forçada a 500, a única mensagem exibida foi "Sucesso! Processo 999999 iniciado com sucesso!". O erro é engolido. D-01 (sintoma) confirmado.'),
  ...comboTipo('e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js:144', '—', 'Reexecutado com "Aditivo": **PASSOU** — sem itens do contrato, nenhum start é enviado.'),
  ...comboTipo('e2e/acompanhamento-contratos/payload-solicitacao.spec.js:59', 'CT-E2E-01-H / D-01 (causa)',
    'Reexecutado com "Aditivo": o payload capturado traz `targetState: 6` — a SC nasce presa no marco de Início. D-01 (causa isolada) confirmado.'),
  ...comboTipo('e2e/acompanhamento-contratos/payload-solicitacao.spec.js:100', 'CT-ACC-06-S1 / D-02', 'Reexecutado com "Aditivo": **PASSOU** — itens com quantidades diferentes trouxeram totais diferentes no contrato sorteado.'),
  ...comboTipo('e2e/acompanhamento-contratos/payload-solicitacao.spec.js:142', 'CT-ACC-06-S1 / D-02',
    'Reexecutado com "Aditivo": dois itens-fantasma de qtd 1 (#1 e #3, valorTotal 1,00) no contrato 000000000000001 — itens que não existem com valor no Protheus entram no payload como produto próprio. Defeito confirmado.'),
  ...comboTipo('e2e/acompanhamento-contratos/payload-solicitacao.spec.js:174', 'CT-ACC-06-S1 / D-02', 'Reexecutado com "Aditivo": **PASSOU**.'),
  ...comboTipo('e2e/acompanhamento-contratos/payload-solicitacao.spec.js:219', 'CT-ACC-07-S1 / D-04',
    'Reexecutado com "Aditivo": `campoDescritor` = "Sol. Compras - CASSI SEDE" tanto para a filial CASSI - CENTRAL DE ATENDIMENTO quanto para UNIDADE - CLINICASSI CURITIBA - PR. Campo chumbado. D-04 confirmado.'),
  ...comboTipo('e2e/acompanhamento-contratos/payload-solicitacao.spec.js:275', 'CT-ACC-08-S1', 'Reexecutado com "Aditivo": **PASSOU** — valores numericamente coerentes.'),
  ...comboTipo('e2e/acompanhamento-contratos/payload-solicitacao.spec.js:309', 'CT-ACC-08-S2', 'Reexecutado com "Aditivo": **PASSOU** — rateio soma 100% com CC e classe de valor.'),
  ...comboTipo('e2e/acompanhamento-contratos/payload-solicitacao.spec.js:339', 'classeValor vazio',
    'Reexecutado com "Aditivo": `tbprod_classeValor` vazio nos 7 itens, com `classeOrca` e `classificacao` preenchidos ao lado. Defeito confirmado (README: "classeValor vazio").'),
  ...comboTipo('e2e/acompanhamento-contratos/payload-solicitacao.spec.js:365', 'CT-ACC-04-S3', 'Reexecutado com "Aditivo": **PASSOU** — a trava antiduplo-clique segura a segunda requisição.'),
  ...comboTipo('e2e/acompanhamento-contratos/payload-solicitacao.spec.js:434', 'CT-ACC-04-S5',
    'Reexecutado com "Aditivo": `nrContrato` aponta para um contrato cuja revisão real é "003", mas `revisaContrato` foi enviado vazio. O servidor não revalida. Defeito confirmado (README: CT-ACC-04-S5).'),
  ...comboTipo('e2e/acompanhamento-contratos/validacoes-solicitacao.spec.js:48', '—', 'Reexecutado com "Aditivo": **PASSOU**.'),
  ...comboTipo('e2e/acompanhamento-contratos/validacoes-solicitacao.spec.js:65', '—', 'Reexecutado com "Aditivo": **PASSOU**.'),

  // ───────────────────────── acompanhamento-contratos — os 3 restantes ─────────────────────────
  'e2e/acompanhamento-contratos/grade-contratos.spec.js:45': {
    grupo: 'G11', natureza: 'catalogado', id: 'CT-ACC-02-S1 / D-08',
    oQueAcontece: 'A coluna "Situação" da grade exibe `Finali`, `Paralisa`, `Sol.Finali`, `Cancel.` — textos truncados em vez de "Finalizado", "Paralisado", "Solicitação de Finalização", "Cancelado".',
    porQue: 'O widget renderiza o valor bruto do Protheus (ou corta por largura) sem mapear para o rótulo por extenso.',
    onde: 'Assertion `expect(truncadas).toEqual([])` em `grade-contratos.spec.js:62`, após ler todas as células da coluna.',
  },
  'e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js:54': {
    grupo: 'G11', natureza: 'catalogado', id: 'D-11 (revisto)',
    oQueAcontece: 'Com o dataset `dsProtheus_getItensPlanilha_restGetAll` derrubado (simulação via `derrubarDataset`), o alerta exibido é "ERRO: Erro ao buscar dados da filial:" — o rótulo de outro dataset.',
    porQue: 'O handler de erro dos itens da planilha reutiliza a mensagem da filial. Com o Protheus fora, os dois avisos ficam idênticos — foi isso que se leu antes como "mesmo alerta duas vezes".',
    onde: '`expect(texto).toMatch(/iten|planilha/i)` em `indisponibilidade-protheus.spec.js:141`.',
  },
  'e2e/acompanhamento-contratos/modal-solicitacao-compra.spec.js:65': {
    grupo: 'G14', natureza: 'divergencia', id: 'pergunta aberta nº 2 do README',
    oQueAcontece: 'O combo do modal lista `["Selecione...", "Selecione...", "Aditivo Contratual", "Nova Contratação"]`. A suíte espera "Renovação Contratual".',
    porQue: 'O ambiente mudou a lista de tipos (removeu "Renovação Contratual", incluiu "Nova Contratação"). Não há registro de que a mudança foi intencional. Note também o placeholder "Selecione..." duplicado.',
    onde: '`expect(opcoes).toContain(TIPO_SOLICITACAO.RENOVACAO)` em `modal-solicitacao-compra.spec.js:82`.',
  },

  // ───────────────────────── api ─────────────────────────
  'api/dataset-colleague-vazamento.spec.js:22': {
    grupo: 'G6', natureza: 'catalogado', id: 'CT-SEG-01-S1 / Vazamento colleague',
    oQueAcontece: '`POST /api/public/ecm/dataset/datasets` com constraint `colleagueId = <login>` devolve 3.493 registros — o mesmo total sem constraint.',
    porQue: 'O dataset `colleague` ignora a constraint; qualquer sessão autenticada lê a base inteira de colaboradores.',
    onde: '`expect(comFiltro).toBe(1)` em `dataset-colleague-vazamento.spec.js:60`.',
  },
  'api/sincronizacao-protheus.spec.js:31': {
    grupo: 'G11', natureza: 'novo', id: 'CT-INT-02-S1 / U-12',
    oQueAcontece: '`ds_protheus_getFuncionarios_restGetAll_Sync` responde HTTP 500 `java.lang.NullPointerException` (ECMException).',
    porQue: 'A variante de cache/sincronização dos dados de RH está quebrada; dado de RH e vigência de compra ficam defasados sem aviso.',
    onde: '`expect(ok).toBe(true)` em `sincronizacao-protheus.spec.js:60`, iterando as variantes `_Sync`.',
  },

  // ───────────────────────── compras ─────────────────────────
  'e2e/compras/aprovacoes-solicitacao-compras.spec.js:317': precondicaoBpmn('113166', 'aprovar como Gestor'),
  'e2e/compras/aprovacoes-solicitacao-compras.spec.js:358': precondicaoBpmn('113165', 'reprovar com justificativa'),
  'e2e/compras/aprovacoes-solicitacao-compras.spec.js:401': precondicaoBpmn('113168', 'sinalizar ausência de aprovador'),
  'e2e/compras/ciclo-cotacao.spec.js:125': {
    grupo: 'G4', natureza: 'novo', id: 'CT-COT (defeito)',
    oQueAcontece: 'No shell do formulário de Cotação, clicar em Enviar sem fornecedor/vínculos não abre diálogo de erro e dispara a criação do processo.',
    porQue: 'O formulário de Cotação não tem validação de obrigatórios no cliente (a SC clássica tem). A escrita só não chegou ao servidor porque a `guarda-criacao` bloqueou.',
    onde: '`expect(dialogoErro).toBeVisible()` em `ciclo-cotacao.spec.js:157`.',
  },
  'e2e/compras/ciclo-cotacao.spec.js:168': {
    grupo: 'G13', natureza: 'precondicao', id: 'CT-COT-01/02',
    oQueAcontece: 'A fila "Controle De Cotações" do Portal do Comprador está vazia.',
    porQue: 'Nenhuma SC da suíte chega ao Protheus (D-01) e não há massa pré-existente. O teste falha com `PRÉ-CONDIÇÃO AUSENTE` de propósito.',
    onde: '`ciclo-cotacao.spec.js:188`.',
  },
  'e2e/compras/ciclo-solicitacao-compras.spec.js:489': {
    grupo: 'G4', natureza: 'catalogado', id: 'CT-CMP-02-S4',
    oQueAcontece: 'Enviar a SC clássica sem anexo dispara `POST /ecm/api/rest/ecm/workflowView/send` (1 tentativa capturada pela guarda).',
    porQue: 'O cliente não valida o anexo obrigatório.',
    onde: '`expect(guarda.tentativas()).toBe(0)` em `ciclo-solicitacao-compras.spec.js:530`.',
  },
  'e2e/compras/ciclo-solicitacao-compras.spec.js:567': {
    grupo: 'G4', natureza: 'catalogado', id: 'CT-CMP-02-S4',
    oQueAcontece: 'Sem a guarda, o servidor aceitou o envio sem anexo e criou a SC **#113167** (registrada no livro-razão e cancelada no teardown).',
    porQue: 'A regra do anexo obrigatório não existe nem no cliente nem no servidor.',
    onde: '`expect(criadas).toEqual([])` em `ciclo-solicitacao-compras.spec.js:646`.',
  },
  'e2e/compras/ciclo-solicitacao-compras.spec.js:815': {
    grupo: 'G12', natureza: 'semVeredito', id: 'CT-ACC-09-H',
    oQueAcontece: 'A SC 113169 foi criada com anexo, mas nenhuma pasta "Processo 113169 - …" apareceu no GED em 120 s.',
    porQue: 'A pasta é criada pelo produto na etapa "Grava SC e Anexos" — exatamente a etapa em que todas as SCs desta tarde ficaram presas além de 180 s (G12). Provável latência de BPMN, não defeito do anexo; precisa de reexecução em ambiente responsivo para veredito.',
    onde: '`expect(pasta).not.toBeNull()` em `ciclo-solicitacao-compras.spec.js:886` (poll de 120 s).',
  },
  'e2e/compras/fail-open-formulario-sc.spec.js:127': {
    grupo: 'G4', natureza: 'catalogado', id: 'CT-CMP-07-S1',
    oQueAcontece: 'Com `ds_protheus_getMatriculaTitular_rest` forçado a 500, o formulário nunca termina de montar e o clique em Enviar dispara `workflowView/send` sem validação alguma. O servidor recusou (500 "Nome da Filial é obrigatório") só porque o formulário estava vazio.',
    porQue: 'Fail-open no cliente: o botão Enviar não espera a montagem terminar. Quando os campos já têm valor, a mesma janela cria SC de verdade (foi assim que o defeito foi descoberto).',
    onde: '`fail-open-formulario-sc.spec.js:266`.',
  },
  'e2e/compras/negociacao-proposta.spec.js:97': {
    grupo: 'G4', natureza: 'novo', id: 'CT-NEG',
    oQueAcontece: 'Enviar no shell de Negociação de Cotação, sem proposta vinculada, disparou `workflowView/send`.',
    porQue: 'Sem validação de cliente; a guarda bloqueou a escrita.',
    onde: '`expect(guarda.tentativas()).toBe(0)` em `negociacao-proposta.spec.js:126`.',
  },
  'e2e/compras/negociacao-proposta.spec.js:131': {
    grupo: 'G13', natureza: 'precondicao', id: 'CT-NEG-01',
    oQueAcontece: 'A fila "Avaliação de Propostas" está vazia.',
    porQue: 'Mesmo bloqueio de fundo de CT-COT: D-01 impede qualquer Cotação real de existir.',
    onde: '`negociacao-proposta.spec.js:150`.',
  },
  'e2e/compras/parecer-tecnico.spec.js:84': {
    grupo: 'G4', natureza: 'novo', id: 'CT-PAR-01-S1',
    oQueAcontece: 'Parecer Técnico sem responsável definido: Enviar disparou `workflowView/send`.',
    porQue: 'O formulário nasce sem Responsável e não impede o envio.',
    onde: '`parecer-tecnico.spec.js:109`.',
  },
  'e2e/compras/parecer-tecnico.spec.js:112': {
    grupo: 'G4', natureza: 'novo', id: 'CT-PAR-01-S2',
    oQueAcontece: 'Parecer desfavorável com justificativa, sem responsável: Enviar também disparou `workflowView/send`.',
    porQue: 'Mesma ausência de validação de S1.',
    onde: '`parecer-tecnico.spec.js:134`.',
  },

  // ───────────────────────── contratos ─────────────────────────
  'e2e/contratos/delegacao-fiscais-ciclo.spec.js:42': {
    grupo: 'G10', natureza: 'novo', id: 'CT-DEL-01-H',
    oQueAcontece: 'O processo `wf_delegacaoFiscalContratoServico` consta do catálogo como iniciável, abre o formulário, mas ao Enviar o servidor responde 500: "Solicitação só pode ser aberta através do portal de delegação de fiscais!".',
    porQue: 'O evento do processo exige um portal de origem que não existe em nenhum menu, atalho ou rota alcançável por esta conta. Catálogo e regra do processo se contradizem.',
    onde: '`expect(getByText(/iniciada com sucesso/)).toBeVisible()` em `delegacao-fiscais-ciclo.spec.js:77`.',
  },
  'e2e/contratos/delegacao-fiscais-ciclo.spec.js:82': {
    grupo: 'G10', natureza: 'novo', id: 'CT-DEL-01-S1',
    oQueAcontece: 'O formulário não oferece nenhum controle para informar o fiscal substituto (0 searchbox/combobox).',
    porQue: 'Inexequível pela interface atual: não há entrada para exercitar "substituto inválido". Mesma causa de CT-DEL-01-H.',
    onde: '`expect(controles).toBeGreaterThan(0)` em `delegacao-fiscais-ciclo.spec.js:180`.',
  },
  'e2e/contratos/validacoes-faturamento.spec.js:76': {
    grupo: 'G10', natureza: 'catalogado', id: 'CT-FAT-02-S2',
    oQueAcontece: 'O Protheus recusou a medição ("CNTA120_REV: Existe revisão pendente de aprovação para este contrato…") e a tela não exibiu aviso nenhum — o painel de itens só não abre.',
    porQue: 'O widget engole o `STATUS: ERROR` do dataset de medição. Confirmado interceptando a resposta recebida.',
    onde: '`expect(avisou).toBe(true)` em `validacoes-faturamento.spec.js:170`.',
  },
  'e2e/contratos/validacoes-faturamento.spec.js:252': {
    grupo: 'G14', natureza: 'semVeredito', id: 'CT-FAT-02-S3',
    oQueAcontece: '`locator.click` estourou 45 s esperando o link "Tarefas em pool" da Central de Tarefas.',
    porQue: 'Falhou na navegação, antes da verificação de alcançabilidade que dá nome ao teste. A Central de Tarefas estava sob carga (4 testes de ciclo em paralelo); é o único teste da execução que não chegou à assertion de domínio por motivo de tela.',
    onde: '`validacoes-faturamento.spec.js:264`.',
  },

  // ───────────────────────── documentos ─────────────────────────
  'e2e/documentos/bloqueio-extensoes.spec.js:133': {
    grupo: 'G5', natureza: 'catalogado', id: 'CT-GED-02-S2 (.bat)',
    oQueAcontece: 'Execução principal: `page.goto` caiu com `net::ERR_NETWORK_CHANGED` (a rede da máquina de execução oscilou) — infraestrutura, sem veredito. 2ª tentativa: a tabela de upload do publicador guardou linhas residuais da tentativa abortada e o page object desistiu após 10 remoções. **3ª tentativa: reprovou pelo defeito real** — `qa-script-lote.bat` publicado sem mensagem de bloqueio.',
    porQue: 'Não há allowlist de extensão no GED.',
    onde: 'Principal: `DocumentosPage.js:92` (goto). 3ª tentativa: `bloqueio-extensoes.spec.js:119`.',
  },
  'e2e/documentos/bloqueio-extensoes.spec.js:149': ged('qa-script-shell.sh', '.sh'),
  'e2e/documentos/bloqueio-extensoes.spec.js:163': ged('qa-relatorio.pdf.exe', '.pdf.exe (dupla extensão)'),
  'e2e/documentos/bloqueio-extensoes.spec.js:176': {
    grupo: 'G5', natureza: 'catalogado', id: 'CT-GED-02-S2 (conteúdo)',
    oQueAcontece: '`qa-executavel-disfarcado.pdf` — nome `.pdf`, conteúdo começa com os magic bytes `MZ` de um executável PE — foi publicado sem mensagem.',
    porQue: 'Nem o nome nem o conteúdo são inspecionados. Este caso continuará vermelho mesmo se uma allowlist por extensão for implementada.',
    onde: '`bloqueio-extensoes.spec.js:209`.',
  },
  'e2e/documentos/gestao-documentos.spec.js:66': {
    grupo: 'G5', natureza: 'catalogado', id: 'CT-GED-02-S1',
    oQueAcontece: 'Upload de `.exe` aceito e publicado sem nenhuma mensagem de bloqueio.',
    porQue: 'Ausência de validação de extensão no GED.',
    onde: '`gestao-documentos.spec.js:93`.',
  },

  // ───────────────────────── jurídico ─────────────────────────
  'e2e/juridico/sigajuri-consultivo.spec.js:48': {
    grupo: 'G8', natureza: 'novo', id: 'CT-JUR-01-H / D-JUR-01',
    oQueAcontece: 'O combo "Tipo Consulta" do SIGAJURI_Consultivo oferece 1 opção (só o placeholder).',
    porQue: 'O dataset que alimenta os tipos de consulta não devolve registros — não dá para criar uma consulta vinculada a uma área.',
    onde: '`expect(opcoes).toBeGreaterThan(1)` em `sigajuri-consultivo.spec.js:66`.',
  },
  'e2e/juridico/sigajuri-contencioso.spec.js:196': {
    grupo: 'G8', natureza: 'novo', id: 'CT-JUR-04-S1',
    oQueAcontece: 'Numa consulta do tipo "Liminar", o botão "Novo Envolvido" fica oculto (classe `sem-processo-hide`) tanto no estado padrão quanto com "Não possui processo." marcado.',
    porQue: 'A regra de exibição esconde o único caminho para registrar a parte contrária.',
    onde: '`expect(visivel).toBe(true)` em `sigajuri-contencioso.spec.js:230`.',
  },
  'e2e/juridico/sigajuri-contrato.spec.js:32': {
    grupo: 'G8', natureza: 'novo', id: 'CT-JUR-03-H / D-JUR-01',
    oQueAcontece: 'O combo "Filial" do SIGAJURI_Contrato oferece 1 opção.',
    porQue: 'Dataset de filiais vazio para esta conta/processo; não é possível montar a minuta.',
    onde: '`sigajuri-contrato.spec.js:48`.',
  },

  // ───────────────────────── notificações ─────────────────────────
  'e2e/notificacoes/contratos-api-notificacao.spec.js:98': {
    grupo: 'G10', natureza: 'catalogado', id: 'CT-NOT-03-S1',
    oQueAcontece: '`GET /notification/api/v1/notifications?limit=3` devolveu 1000 itens; `offset` também não altera o primeiro id (3328180 nas três chamadas).',
    porQue: 'O servidor ignora `limit`/`offset`. Em 27/08 eram 707 — a lista cresce e todo cliente recebe tudo.',
    onde: '`expect(quantidade).toBe(3)` em `contratos-api-notificacao.spec.js:162`. Sondagem completa no anexo `paginacao-de-notificacoes`.',
  },
  'e2e/notificacoes/contratos-api-notificacao.spec.js:171': {
    grupo: 'G10', natureza: 'catalogado', id: 'CT-NOT-03-S1',
    oQueAcontece: 'Cada notificação declara `canRemove: true`, mas `DELETE /notification/api/v1/notifications/{id}` responde 500 `NotFoundException` (a coleção responde `NotAllowedException`, então a rota com id simplesmente não existe).',
    porQue: 'A remoção real vive em `POST /globalalertapi/api/rest/alert/removeAlerts`, sem referência no recurso.',
    onde: '`contratos-api-notificacao.spec.js:259`. Sondagem no anexo `sondagem-de-rotas-de-remocao`.',
  },

  // ───────────────────────── plataforma ─────────────────────────
  'e2e/plataforma/catalogo-invariante.spec.js:149': {
    grupo: 'G7', natureza: 'divergencia', id: 'CT-PLT-10-H',
    oQueAcontece: 'Seis processos ENTRARAM no catálogo `onlyCanStart` desta conta desde o inventário versionado: `GestaoDependentes`, `SIGAJURI_AprovaFU`, `SIGAJURI_Contencioso`, `SIGAJURI_Contrato`, `rh_gbeneficios_planosaude`, `wf_substituicaocargos`. Nenhum saiu. Total publicado: 34.',
    porQue: 'Mudança de permissão de início no ambiente. O invariante existe para acusar exatamente isso; cabe à Cassi dizer se cada linha foi intencional (dois deles são processos de RH da pergunta aberta nº 1).',
    onde: '`expect(diff).toEqual({entraram:[], sairam:[]})` em `catalogo-invariante.spec.js:221`. Inventário lido no anexo.',
  },
  'e2e/plataforma/catalogo-invariante.spec.js:224': {
    grupo: 'G7', natureza: 'divergencia', id: 'CT-PLT-10-H',
    oQueAcontece: '`SIGAJURI_Contencioso` passou a constar do catálogo `onlyCanStart` — o achado anterior ("cria solicitação mas fica fora do catálogo") mudou.',
    porQue: 'A permissão de início foi alinhada ao filtro da tela. O teste, por desenho, acusa a mudança e pede reescrita para a nova regra.',
    onde: '`expect(catalogo).not.toContain("SIGAJURI_Contencioso")` em `catalogo-invariante.spec.js:265`.',
  },
  'e2e/plataforma/deep-link-spa.spec.js:19|principalprocess': deepLink('/portal/p/1/principalprocess'),
  'e2e/plataforma/deep-link-spa.spec.js:19|gestao_ferias': deepLink('/portal/p/1/gestao_ferias'),
  'e2e/plataforma/erros-de-console.spec.js:152': {
    grupo: 'G11', natureza: 'catalogado', id: 'CT-PLT-06-S1',
    oQueAcontece: 'O Portal do Comprador carrega com 2 erros de console não catalogados: 404 em `/style-guide/css/fluig-style-guide.min.css` e `console.error` "Erro ao buscar as informações do colaborador… Comprador não encontrado" em `wg_portalCompradores/.../main.js`.',
    porQue: 'CSS ausente no deploy e a busca do comprador no Protheus não encontra a conta `TOTVS-FS` (que não está na SY1).',
    onde: '`expect(naoCatalogados).toEqual([])` em `erros-de-console.spec.js:210`.',
  },
  'e2e/plataforma/favoritos-contrato-api.spec.js:126': {
    grupo: 'G10', natureza: 'catalogado', id: 'CT-PLT-07-S1',
    oQueAcontece: 'Favoritar `SIGAJURI_Contencioso` duas vezes: a 2ª chamada responde **500** `text/plain` "Processo SIGAJURI_Contencioso já está nos seus favoritos."',
    porQue: 'Condição de negócio trivial tratada como erro de servidor, em texto puro — quebra qualquer cliente que faça parse do corpo.',
    onde: '`favoritos-contrato-api.spec.js:180`. Par requisição/resposta no anexo `contrato-addFavorites`.',
  },
  'e2e/plataforma/home.spec.js:7': {
    grupo: 'G11', natureza: 'catalogado', id: 'NPS 403',
    oQueAcontece: 'A Home carrega com "Failed to load resource: 403 (Forbidden)" no console.',
    porQue: '`GET /nps/api/v1/surveys` responde 403 em toda carga.',
    onde: '`expect(erros).toEqual([])` em `home.spec.js:39`.',
  },
  'e2e/plataforma/processo-inativo-e-residuo.spec.js:62': {
    grupo: 'G11', natureza: 'catalogado', id: 'CT-PLT-08-S1',
    oQueAcontece: 'O processo `teste` (categoria ADMIN, resíduo de desenvolvimento) continua ofertado em "Iniciar Solicitações" para um usuário de Compras.',
    porQue: 'Falta de governança de publicação; abri-lo serve o formulário completo da SC (o teste-irmão "ACHADO" passa, confirmando).',
    onde: '`processo-inativo-e-residuo.spec.js:116`.',
  },

  // ───────────────────────── portais ─────────────────────────
  'e2e/portais/acesso-fornecedor.spec.js:107': {
    grupo: 'G10', natureza: 'novo', id: 'CT-PFN-02-S2',
    oQueAcontece: 'Enviar um token de redefinição de senha adulterado/expirado ao endpoint do Portal do Fornecedor responde **HTTP 500**.',
    porQue: 'O endpoint não trata token inválido como erro controlado (4xx) — crasha. A troca não se efetiva, mas o comportamento é de exceção não tratada.',
    onde: '`expect(status).toBeLessThan(500)` em `acesso-fornecedor.spec.js:134`.',
  },
  'e2e/portais/gerencia-compras.spec.js:31': {
    grupo: 'G11', natureza: 'catalogado', id: 'Aba Atribuir',
    oQueAcontece: 'A aba "Atribuir" da Gerência de Compras nunca lista SCs (1 linha = cabeçalho) em 30 s de poll; a aba "Transferir", com o mesmo mecanismo, lista dados reais.',
    porQue: 'A grade de Atribuir não renderiza dados para esta conta; reclicar não resolve.',
    onde: '`expect(linhas).toBeGreaterThan(1)` em `gerencia-compras.spec.js:58`.',
  },

  // ───────────────────────── rh ─────────────────────────
  'e2e/rh/admissao.spec.js:36': {
    grupo: 'G9', natureza: 'novo', id: 'CT-ADM-01-H',
    oQueAcontece: 'Iniciar `wf_automacao_admissao` abre o formulário "Gestão de Benefícios - Plano de Saúde" (template de `rh_gbeneficios_planosaude`).',
    porQue: 'Associação processo↔formulário incorreta na publicação do processo. CT-ADM-01-S1/S2 ficam inexequíveis por consequência.',
    onde: '`expect(titulo).not.toBe("Gestão de Benefícios - Plano de Saúde")` em `admissao.spec.js:81`.',
  },
  'e2e/rh/banco-horas-limite.spec.js:38': {
    grupo: 'G9', natureza: 'catalogado', id: 'CT-BH-01-S2 / U-02',
    oQueAcontece: 'A aba Autorização do Banco de Horas fica em "Aguarde, processando" por 30 s+ e nenhum campo aparece.',
    porQue: 'Integração com o Protheus não configurada para o widget (mesma causa de U-02); o cenário "acima do limite" não é alcançável por esta rota.',
    onde: '`expect(getByText("Aguarde, processando")).toBeHidden()` em `banco-horas-limite.spec.js:71`.',
  },
  'e2e/rh/banco-horas.spec.js:14': {
    grupo: 'G9', natureza: 'catalogado', id: 'CT-BH-01-S1 / U-02',
    oQueAcontece: 'Ao abrir o Banco de Horas, um `alert()` nativo diz "Existem parâmetros não informado para esse servidor, informe o administrador".',
    porQue: 'Erro de configuração de servidor exposto ao usuário final (capturado com `page.on("dialog")` registrado antes da navegação).',
    onde: '`expect(dialogos).toEqual([])` em `banco-horas.spec.js:33`.',
  },
  'e2e/rh/substituicao-cargos.spec.js:32': {
    grupo: 'G9', natureza: 'naoDeterministico', id: 'CT-SUB',
    oQueAcontece: 'O formulário NÃO apresentou o bloqueio "Funcionário não localizado": 8 campos visíveis e utilizáveis. O teste esperava o bloqueio (a conta de automação não é funcionário ativo no Protheus).',
    porQue: 'Não determinismo conhecido do produto (comentado em `SubstituicaoCargosPage`): com a mesma resposta do ERP, a tela ora bloqueia ora libera. Hoje liberou. Há dois comportamentos possíveis e o correto precisa ser definido pela Cassi.',
    onde: '`SubstituicaoCargosPage.js:88` (`waitFor` de 45 s pelo texto de bloqueio).',
  },

  // ───────────────────────── saúde ─────────────────────────
  'e2e/saude/questionario-clinicassi.spec.js:217': {
    grupo: 'G11', natureza: 'novo', id: 'CT-CLI-02-S1 / U-14',
    oQueAcontece: 'O campo "Clínica" do Questionário CliniCASSI nasce vazio em vez de identificar a clínica do diagnóstico.',
    porQue: 'Sintoma compatível com o job `dsQDC000` parado (U-14); sem acesso admin a suíte só confirma o sintoma.',
    onde: '`expect(clinica).not.toBe("")` em `questionario-clinicassi.spec.js:232`.',
  },

  // ───────────────────────── segurança ─────────────────────────
  'e2e/seguranca/auditoria-datasets.spec.js:18': {
    grupo: 'G6', natureza: 'novo', id: 'CT-SEG-02-S1 / U-13',
    oQueAcontece: '6 de 23 administradores da plataforma têm login/nome de conta de integração/serviço (`consumerkey`, `fluig_consumer`, `integr`…).',
    porQue: 'Contas técnicas com privilégio de administrador — menor privilégio violado.',
    onde: '`expect(tecnicasAdmin).toBe(0)` em `auditoria-datasets.spec.js:68`.',
  },
  'e2e/seguranca/auditoria-datasets.spec.js:71': {
    grupo: 'G6', natureza: 'novo', id: 'CT-SEG-03-S1 / U-03',
    oQueAcontece: 'O dataset `ds_Fluig` ("Usuário e Senha usuario de integração") responde 200 (1 registro, 3 colunas) para a sessão não-admin.',
    porQue: 'Dataset de credencial sem restrição de acesso; `/webdesk` nega (403) mas o dataset não.',
    onde: '`expect(status).toBe(403)` em `auditoria-datasets.spec.js:100`. Evidência estrutural — o conteúdo nunca é lido.',
  },
  'e2e/seguranca/auditoria-datasets.spec.js:103': {
    grupo: 'G6', natureza: 'novo', id: 'CT-SEG-04-S1 / U-04',
    oQueAcontece: '`dsFluig_executeSql` (executor de SQL) responde 200 para a sessão não-admin.',
    porQue: 'Executor de SQL alcançável sem privilégio elevado.',
    onde: '`auditoria-datasets.spec.js:130`.',
  },
  'e2e/seguranca/isolamento-horizontal-api-processos.spec.js:59': {
    grupo: 'G6', natureza: 'catalogado', id: 'CT-SEG-07-S1 (BOLA)',
    oQueAcontece: '`TOTVS-FS` — que não é requisitante, responsável nem participante da instância 112009 de `bpm_recepcao_documentos_fiscais_compras`, processo que nem pode iniciar — recebe HTTP 200 com 44 `formFields` (razão social, CNPJ).',
    porQue: 'Isolamento horizontal quebrado na API v2 de processos; `processInstanceId` sequencial permite enumerar a base.',
    onde: '`isolamento-horizontal-api-processos.spec.js:177`.',
  },
  'e2e/seguranca/lgpd-envio-google-analytics.spec.js:22': {
    grupo: 'G6', natureza: 'catalogado', id: 'U-11',
    oQueAcontece: '2 requisições de navegação para `google-analytics.com` (medição `G-F0FT6D1NQG`) numa carga.',
    porQue: 'Telemetria externa ativa; a pergunta aberta nº 3 do README pede posição da Privacidade/LGPD.',
    onde: '`expect(envios).toBe(0)` em `lgpd-envio-google-analytics.spec.js:45`.',
  },
  'e2e/seguranca/processos-administrativos-usuario-comum.spec.js:39|bpm_addUserFluig': segAdmin('bpm_addUserFluig', 'Adicionar Usuário'),
  'e2e/seguranca/processos-administrativos-usuario-comum.spec.js:39|bpm_addUserGroup': segAdmin('bpm_addUserGroup', 'Adicionar Grupo'),

  // ───────────────────────── tarefas ─────────────────────────
  'e2e/tarefas/acoes-da-tarefa.spec.js:184': precondicaoBpmn('113163', '"Somente salvar"'),
  'e2e/tarefas/acoes-da-tarefa.spec.js:297': precondicaoBpmn('113162', 'Transferir'),
  'e2e/tarefas/assumir-tarefa-pool.spec.js:34': {
    grupo: 'G13', natureza: 'precondicao', id: 'CT-TSK-02-H',
    oQueAcontece: 'O Resumo de Tarefas anunciava "Tarefas em pool (0)" — nada para assumir.',
    porQue: 'Sem massa nos pools "Validação do Gestor Imediato" e "Validação dos Compradores" no instante do teste (as SCs dos testes de ciclo ainda não tinham chegado lá — G12). Reexecutado isolado às 15h35: mesmo resultado.',
    onde: '`assumir-tarefa-pool.spec.js:46`.',
  },
};

function comboTipo(chave, id, rerun) {
  return {
    [chave]: {
      grupo: 'G1', natureza: 'divergencia', id,
      oQueAcontece: 'O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.',
      porQue: 'O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.',
      onde: '`components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`.',
      rerun,
    },
  };
}

function precondicaoBpmn(sc, acao) {
  return {
    grupo: 'G12', natureza: 'precondicao', id: 'PRÉ-CONDIÇÃO AUSENTE',
    oQueAcontece: `A SC #${sc}, criada pelo próprio teste, não apareceu com "Assumir tarefa" na Validação do Gestor em 180 s; a atividade atual ainda era "Grava SC e Anexos". O teste aborta antes de exercitar ${acao}.`,
    porQue: 'Latência do BPMN acima do orçamento (referência de campo: ~76 s). Reexecutado isolado (15h35–15h40) com o mesmo resultado (SCs 113187–113191). O mesmo caminho em `portais/*.spec.js` (helper `aprovarValidacaoDoGestor`, espera de 150 s) chegou à Validação do Gestor em 5 testes entre 15h16 e 15h20 — o fluxo funciona; a latência oscila.',
    onde: 'Poll `toPass({ timeout: 180_000 })` por `botaoAssumirTarefaAtual()` — `aprovacoes-solicitacao-compras.spec.js:281` / `acoes-da-tarefa.spec.js:83`.',
  };
}

function ged(nome, ext) {
  return {
    grupo: 'G5', natureza: 'catalogado', id: `CT-GED-02-S2 (${ext})`,
    oQueAcontece: `\`${nome}\` foi publicado no GED sem nenhuma mensagem de bloqueio.`,
    porQue: 'Não há allowlist de extensão: uma correção que só coloque ".exe" numa lista negra deixa este caso vermelho.',
    onde: '`expect(mensagemDeBloqueio).toBeVisible()` em `bloqueio-extensoes.spec.js:119`.',
  };
}

function deepLink(rota) {
  return {
    grupo: 'G11', natureza: 'catalogado', id: 'CT-PLT-04 / U-01',
    oQueAcontece: `Abrir \`${rota}\` direto pela URL termina em \`/portal/p/1/errorPage/404\`.`,
    porQue: 'A rota existe e funciona pela navegação interna da SPA; o deep-link quebra — link salvo, favorito e compartilhamento de endereço não funcionam.',
    onde: '`expect(page).not.toHaveURL(/errorPage\\/404/)` em `deep-link-spa.spec.js:32`.',
  };
}

function segAdmin(processo, nome) {
  return {
    grupo: 'G6', natureza: 'catalogado', id: 'CT-SEG-08-S1',
    oQueAcontece: `\`${processo}\` (${nome}) consta do catálogo \`onlyCanStart\` da conta não-admin e abre o formulário de início.`,
    porQue: 'Processo de criação de usuário/grupo iniciável por perfil de Compras — segregação de função violada.',
    onde: '`processos-administrativos-usuario-comum.spec.js:88`.',
  };
}
