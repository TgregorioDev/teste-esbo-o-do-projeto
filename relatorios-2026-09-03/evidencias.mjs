// Classificação da EVIDÊNCIA de cada falha — acrescentada em 03/09/2026 depois que a leitura do
// relatório apontou, com razão, que "os prints não dizem o que a documentação diz".
//
// O diagnóstico: a screenshot do Playwright é sempre "a página no instante da falha". Quando o
// defeito é visual (um combo vazio, um status truncado, um 404), ela PROVA o que o cartão afirma.
// Quando o oráculo do teste é outra coisa — a resposta de uma API, o corpo do payload
// interceptado, uma linha de console, uma requisição de rede, uma tentativa bloqueada pela
// guarda de escrita —, a página costuma parecer normal, e quem compara print e texto conclui,
// corretamente, que um não sustenta o outro.
//
// A correção NÃO é trocar a screenshot: é declarar, cartão a cartão, se ela é a prova ou apenas
// o contexto — e, quando é contexto, apontar onde está a prova de verdade (que já estava no
// relatório: mensagem da falha, anexo do teste, aria-snapshot ou trace).
//
// tipo 'tela'     → a screenshot é a evidência do defeito documentado.
// tipo 'contexto' → a screenshot situa onde o teste estava; a prova é o que `prova` descreve.

const tela = () => ({ tipo: 'tela' });
const ctx = (prova) => ({ tipo: 'contexto', prova });

const PAYLOAD = 'o corpo do `POST /wf_solicitacao_compras/start` interceptado por `utils/captura-payload.js` — anexado a este cartão e citado na mensagem da falha. Nenhum campo de payload é visível numa screenshot.';
const GUARDA = 'a tentativa de escrita registrada por `utils/guarda-criacao.js` e citada na mensagem da falha (`expect(guarda.tentativas()).toBe(0)`). A requisição foi bloqueada antes de chegar ao servidor, então a tela não muda — é justamente esse o desenho do caso.';
const DATASET = 'a resposta HTTP do dataset, transcrita na mensagem da falha.';
const API = 'o par requisição/resposta do endpoint, transcrito na mensagem da falha.';
const ETAPA = 'a etapa em que a solicitação realmente parou, lida no detalhe do processo e citada na mensagem da falha.';
const CATALOGO = 'a lista de processos devolvida pelo catálogo (`onlyCanStart`), transcrita na íntegra na mensagem da falha.';
const CONSOLE = 'as mensagens de console capturadas durante a carga, transcritas na mensagem da falha — console não aparece em screenshot.';

export const EVIDENCIAS = {
  // ── a screenshot É a prova ──
  'e2e/acompanhamento-contratos/grade-contratos.spec.js:45': tela(),
  'e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js:54': tela(),
  'e2e/acompanhamento-contratos/modal-solicitacao-compra.spec.js:50': tela(),
  'e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js:242': tela(),
  'e2e/compras/ciclo-cotacao.spec.js:168': tela(),
  'e2e/compras/negociacao-proposta.spec.js:131': tela(),
  'e2e/compras/ciclo-solicitacao-compras.spec.js:815': tela(),
  'e2e/contratos/delegacao-fiscais-ciclo.spec.js:42': tela(),
  'e2e/contratos/delegacao-fiscais-ciclo.spec.js:82': tela(),
  'e2e/contratos/validacoes-faturamento.spec.js:254': tela(),
  'e2e/documentos/bloqueio-extensoes.spec.js:133': tela(),
  'e2e/documentos/bloqueio-extensoes.spec.js:149': tela(),
  'e2e/documentos/bloqueio-extensoes.spec.js:163': tela(),
  'e2e/documentos/bloqueio-extensoes.spec.js:176': tela(),
  'e2e/juridico/sigajuri-consultivo.spec.js:48': tela(),
  'e2e/juridico/sigajuri-contencioso.spec.js:113': tela(),
  'e2e/juridico/sigajuri-contencioso.spec.js:196': tela(),
  'e2e/juridico/sigajuri-contrato.spec.js:32': tela(),
  'e2e/plataforma/deep-link-spa.spec.js:19|principalprocess': tela(),
  'e2e/plataforma/deep-link-spa.spec.js:19|gestao_ferias': tela(),
  'e2e/portais/gerencia-compras.spec.js:31': tela(),
  'e2e/rh/admissao.spec.js:36': tela(),
  'e2e/rh/banco-horas-limite.spec.js:38': tela(),

  // ── a screenshot é só contexto ──
  'api/dataset-colleague-vazamento.spec.js:22': ctx('a resposta do dataset com e sem constraint. Este teste **não dirige interface** — a página nunca saiu de `about:blank`, por isso não há screenshot.'),
  'api/sincronizacao-protheus.spec.js:31': ctx('a resposta HTTP 500 de cada variante `_Sync`, transcrita na mensagem. Teste de API, sem tela.'),
  'e2e/acompanhamento-contratos/ciclo-gestor.spec.js:36': ctx(ETAPA),
  'e2e/acompanhamento-contratos/ciclo-gestor.spec.js:109': ctx(ETAPA),
  'e2e/acompanhamento-contratos/ciclo-gestor.spec.js:155': ctx(ETAPA),
  'e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:112': ctx('o responsável da SC criada, consultado no servidor e citado na mensagem ("Usuário Integrador Fluig").'),
  'e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:224': ctx(PAYLOAD),
  'e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:292': ctx('o **HTTP 200** devolvido ao start com `tipoSolicitacao` vazio, com o corpo da resposta na mensagem da falha.'),
  'e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:422': ctx('a AUSÊNCIA de aviso de duplicidade — o print mostra o modal reaberto e sem alerta, mas quem sustenta a afirmação é a solicitação 113202 já em andamento, citada na mensagem.'),
  'e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:513': ctx('a varredura de 15 contratos da grade sem encontrar a massa exigida, relatada na mensagem. Não há o que mostrar em tela.'),
  'e2e/acompanhamento-contratos/erros-no-start.spec.js:67': ctx('a lista de TODOS os avisos que a aplicação exibiu depois do erro forçado — está na mensagem da falha. O print pega um instante; a lista cobre a janela inteira.'),
  'e2e/acompanhamento-contratos/payload-solicitacao.spec.js:64': ctx(PAYLOAD + ' O "Erro ao iniciar processo" visível ao fundo é efeito do próprio aborto da requisição pela técnica de captura — **não é o defeito**.'),
  'e2e/acompanhamento-contratos/payload-solicitacao.spec.js:206': ctx('a ausência de qualquer requisição de start em 30 s, contada por `utils/captura-payload.js`.'),
  'e2e/acompanhamento-contratos/payload-solicitacao.spec.js:264': ctx(PAYLOAD),
  'e2e/acompanhamento-contratos/payload-solicitacao.spec.js:384': ctx(PAYLOAD),
  'e2e/acompanhamento-contratos/payload-solicitacao.spec.js:479': ctx(PAYLOAD),
  'e2e/compras/aprovacoes-solicitacao-compras.spec.js:317': ctx(ETAPA),
  'e2e/compras/aprovacoes-solicitacao-compras.spec.js:358': ctx(ETAPA),
  'e2e/compras/aprovacoes-solicitacao-compras.spec.js:401': ctx(ETAPA),
  'e2e/compras/ciclo-cotacao.spec.js:125': ctx(GUARDA),
  'e2e/compras/ciclo-solicitacao-compras.spec.js:489': ctx(GUARDA),
  'e2e/compras/ciclo-solicitacao-compras.spec.js:567': ctx('a SC efetivamente criada no servidor sem anexo — o número dela está no livro-razão `test-results/criados.jsonl` e na mensagem da falha.'),
  'e2e/compras/fail-open-formulario-sc.spec.js:127': ctx(GUARDA + ' A resposta 500 do servidor citada na mensagem é acidental (o formulário estava vazio) e não prova proteção.'),
  'e2e/compras/negociacao-proposta.spec.js:97': ctx(GUARDA),
  'e2e/compras/parecer-tecnico.spec.js:84': ctx(GUARDA),
  'e2e/compras/parecer-tecnico.spec.js:112': ctx(GUARDA),
  'e2e/contratos/validacoes-faturamento.spec.js:79': ctx('a varredura das competências dos quatro contratos amostrados, listada na mensagem da falha.'),
  'e2e/notificacoes/contratos-api-notificacao.spec.js:98': ctx(API),
  'e2e/notificacoes/contratos-api-notificacao.spec.js:171': ctx(API),
  'e2e/plataforma/catalogo-invariante.spec.js:149': ctx(CATALOGO),
  'e2e/plataforma/catalogo-invariante.spec.js:224': ctx(CATALOGO),
  'e2e/plataforma/erros-de-console.spec.js:152': ctx(CONSOLE),
  'e2e/plataforma/favoritos-contrato-api.spec.js:126': ctx(API),
  'e2e/plataforma/home.spec.js:7': ctx(CONSOLE),
  'e2e/plataforma/processo-inativo-e-residuo.spec.js:62': ctx(CATALOGO),
  'e2e/portais/acesso-fornecedor.spec.js:107': ctx(API),
  'e2e/rh/banco-horas.spec.js:14': ctx('o `alert()` nativo capturado por `page.on("dialog")` ANTES da navegação. O Playwright dispensa o diálogo sozinho, então ele **nunca** aparece na screenshot — o texto está na mensagem da falha.'),
  'e2e/seguranca/auditoria-datasets.spec.js:18': ctx(DATASET),
  'e2e/seguranca/auditoria-datasets.spec.js:71': ctx(DATASET + ' Só a forma da resposta é lida (1 registro, 3 colunas) — o conteúdo da credencial nunca é aberto.'),
  'e2e/seguranca/auditoria-datasets.spec.js:103': ctx(DATASET),
  'e2e/seguranca/isolamento-horizontal-api-processos.spec.js:59': ctx('o HTTP 200 com 44 `formFields` da instância 112009, resumido na mensagem da falha.'),
  'e2e/seguranca/lgpd-envio-google-analytics.spec.js:22': ctx('as 2 requisições de rede para `google-analytics.com` capturadas na carga — tráfego de rede não aparece em screenshot.'),
  'e2e/seguranca/processos-administrativos-usuario-comum.spec.js:39|bpm_addUserFluig': ctx(CATALOGO),
  'e2e/seguranca/processos-administrativos-usuario-comum.spec.js:39|bpm_addUserGroup': ctx(CATALOGO + ' Neste caso o print ajuda: mostra o formulário de Adicionar Grupo aberto, com o botão Enviar visível.'),
  'e2e/tarefas/acoes-da-tarefa.spec.js:184': ctx(ETAPA),
  'e2e/tarefas/acoes-da-tarefa.spec.js:297': ctx(ETAPA),
  // Reclassificados na auditoria: o aria-snapshot mostra que a tela NÃO continha o que o cartão afirma.
  'e2e/documentos/gestao-documentos.spec.js:66': ctx('a ausência da mensagem de bloqueio, verificada pelo locator do teste, somada ao documento efetivamente publicado. Este cartão não tem sequer snapshot de tela gravado — a captura saiu vazia —, então a imagem não sustenta nada por si.'),
  'e2e/saude/questionario-clinicassi.spec.js:217': ctx('o valor lido do campo "Clínica" pelo teste, citado na mensagem da falha. Na captura o campo não está enquadrado: o texto "CliniCASSI" que aparece é o título do questionário, não o campo vazio.'),
};
