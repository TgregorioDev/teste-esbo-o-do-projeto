# Plataforma — comparação chamados x suíte Playwright

6 casos: **APRIMORAR** 4 · **IMPLEMENTAR** 2

| Caso | Status | Teste existente | Arquivo alvo |
|---|---|---|---|
| FSWTBC-640 | APRIMORAR | tests/e2e/portais/alcadas-orcamentaria.spec.js :: @destrutivo CT-E2E-04-H — o histórico da SC permanece integralmente rastreável... (Histórico 'Usuário TBC (TOTVS) movimentou a atividade Validação do Gestor'); tests/e2e/tarefas/acoes-da-tarefa.spec.js :: CT-TSK-07-H / CT-TSK-08-H (dialogErro count 0 / texto vazio) | `pages/CentralTarefasComprasPage.js + tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js` |
| FSWTBC-1942 | APRIMORAR | tests/e2e/plataforma/erros-de-console.spec.js :: CT-PLT-06-S1 (8 rotas: título + console); tests/e2e/seguranca/integracao-protheus-grade-contratos.spec.js :: CT-INT-01-H; tests/e2e/contratos/faturamento-contratos.spec.js :: CT-FAT-01-H; tests/e2e/compras/abertura-solicitacao-compras.spec.js; tests/e2e/portais/tracker-compras.spec.js; tests/api/sincronizacao-protheus.spec.js :: CT-INT-02-S1 @bug | `tests/e2e/portais/tracker-compras.spec.js (+ tests/api/sincronizacao-protheus.spec.js)` |
| FSWTBC-2053 | APRIMORAR | tests/e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js :: CT-CMP-08-H @destrutivo @bug — reprovada e corrigida, a SC deveria voltar para a Validação do Gestor com o contrato de origem íntegro | `tests/e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js` |
| FSWTBC-4445 | IMPLEMENTAR | — (ciclo-correcao-reenvio.spec.js aceita 'Correção' como etapa de retorno, mas é a correção por REPROVAÇÃO, não por falha de integração; nenhum teste lê erroIntegracao / 'Retorno Integração' nem procura 'Erro: undefined') | `tests/e2e/tarefas/correcao-por-integracao.spec.js (novo)` |
| FSWTBC-4581 | APRIMORAR | tests/e2e/tarefas/cancelamento-solicitacao.spec.js :: CT-TSK-05-H @destrutivo — cancelar pela Central de Tarefas deve levar a solicitação a CANCELED no servidor | `tests/e2e/tarefas/cancelamento-solicitacao.spec.js` |
| FSWTBC-4625 | IMPLEMENTAR | — (cancelamento-solicitacao.spec.js cobre o endpoint em lote; ciclo-comprador.spec.js :: CT-E2E-07-H abre Controle de Cotações, vazio) | `tests/e2e/portais/ciclo-comprador.spec.js (via comprador); tests/e2e/tarefas/cancelamento-solicitacao.spec.js (via detalhe)` |

## FSWTBC-640 — APRIMORAR

**Teste:** tests/e2e/portais/alcadas-orcamentaria.spec.js :: @destrutivo CT-E2E-04-H — o histórico da SC permanece integralmente rastreável... (Histórico 'Usuário TBC (TOTVS) movimentou a atividade Validação do Gestor'); tests/e2e/tarefas/acoes-da-tarefa.spec.js :: CT-TSK-07-H / CT-TSK-08-H (dialogErro count 0 / texto vazio)

**O que falta:** O caminho feliz (Histórico '<usuário> movimentou a atividade <origem>') está afirmado em CT-E2E-04-H, sem o sufixo 'para a atividade <destino>'. O núcleo do caso — falha de movimentação NUNCA em branco — não é afirmado em lugar nenhum: acoes-da-tarefa exige ausência de diálogo, e CentralTarefasComprasPage.decidirEEnviar lança com o innerText do diálogo sem distinguir texto vazio de recusa com motivo. Acrescentar em decidirEEnviar (e em AcoesDaTarefaPage.somenteSalvar/acionarTransferir) uma assertion própria: se surgir diálogo/toast de erro, seu texto não pode ser vazio — vermelho nomeado 'erro em branco', separado de 'recusa com motivo'. A parte '3 tentativas => Correção' pertence a FSWTBC-4445.

**Arquivo alvo:** `pages/CentralTarefasComprasPage.js + tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js`

## FSWTBC-1942 — APRIMORAR

**Teste:** tests/e2e/plataforma/erros-de-console.spec.js :: CT-PLT-06-S1 (8 rotas: título + console); tests/e2e/seguranca/integracao-protheus-grade-contratos.spec.js :: CT-INT-01-H; tests/e2e/contratos/faturamento-contratos.spec.js :: CT-FAT-01-H; tests/e2e/compras/abertura-solicitacao-compras.spec.js; tests/e2e/portais/tracker-compras.spec.js; tests/api/sincronizacao-protheus.spec.js :: CT-INT-02-S1 @bug

**O que falta:** Telas abrindo com título correto (sem errorPage/404), grade de contratos com registros do ERP e zooms do formulário clássico / Faturamento na abertura já cobertos. Faltam: (a) Tracker — percorrer as 9 opções de 'Filtrar por:' e afirmar que os campos trocam (tracker-compras só lê a opção default e filtra por status); (b) Histórico com 'Integração executada com sucesso - Tempo de Execução N s' numa solicitação própria (nenhum teste lê essa linha); (c) varredura de datasets do ERP por HTTP 500 / NullPointerException limitada aos 3 '_Sync' — estender ao conjunto que as telas usam (config/ambiente.js DATASET.*). É roteiro pós-atualização: sugerir uma tag (ex.: @pos-erp) agrupando esses testes para rodar como linha de base antes/depois.

**Arquivo alvo:** `tests/e2e/portais/tracker-compras.spec.js (+ tests/api/sincronizacao-protheus.spec.js)`

## FSWTBC-2053 — APRIMORAR

**Teste:** tests/e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js :: CT-CMP-08-H @destrutivo @bug — reprovada e corrigida, a SC deveria voltar para a Validação do Gestor com o contrato de origem íntegro

**O que falta:** O teste leva SC própria a 'Ajustar Informações' (reprovação do gestor via start corrigido), edita a justificativa e reenvia — hoje @bug: reenvio recusado ('Existem campos de rateio sem preenchimento'). Não exclui item algum nem lê a grade de Produtos / Tracker. Acrescentar: SC com 3+ itens (o payload do contrato traz tbprod_*___n), excluir dois itens fora da 1ª posição pelo diálogo 'Tem certeza que quer excluir o item n?' -> 'Sim, excluir item n!' + 'Item excluido!', reenviar e afirmar via expand=formFields que tbprod_codigo___* tem n-2 entradas e nenhuma linha de rateio órfã; Tracker 'Produtos/Rateio SC' lista só os remanescentes. Fica atrás do mesmo @bug do reenvio; a etapa de Cotação é inalcançável (alçada).

**Arquivo alvo:** `tests/e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js`

## FSWTBC-4445 — IMPLEMENTAR

**Teste:** — (ciclo-correcao-reenvio.spec.js aceita 'Correção' como etapa de retorno, mas é a correção por REPROVAÇÃO, não por falha de integração; nenhum teste lê erroIntegracao / 'Retorno Integração' nem procura 'Erro: undefined')

**O que falta:** Descobrir em execução (API v2, mesmo padrão de utils/massa-contratos.js) uma SC com tarefa NOT_COMPLETED na seq 236 'Correção'; afirmar que o Histórico da falha de serviço tem mensagem real (regex sem 'undefined'; formato 'Falha ao executar evento de serviço... Erro <exceção>') e que formFields.erroIntegracao não é vazio — este segundo reprova hoje (113196 tem erroIntegracao vazio) => @bug. Reenvio só com massa própria, que exige janela de instabilidade do Protheus — não fabricável; sem instância em Correção, faltaPreCondicao.

**Arquivo alvo:** `tests/e2e/tarefas/correcao-por-integracao.spec.js (novo)`

## FSWTBC-4581 — APRIMORAR

**Teste:** tests/e2e/tarefas/cancelamento-solicitacao.spec.js :: CT-TSK-05-H @destrutivo — cancelar pela Central de Tarefas deve levar a solicitação a CANCELED no servidor

**O que falta:** Cobre cancelamento de solicitação própria (questionário CliniCASSI em 'Acompanhamento Status') pelo card 'Cancelar' de Minhas solicitações, endpoint cancelInstances, com CANCELED + tarefa CANCELED no servidor. O caso é outro processo, outra etapa e outro controle: SC (wf_solicitacao_compras) em Início, botão 'Cancelar Solicitação' da tela de detalhe, que usa /ecm/api/rest/ecm/workflowView/cancelInstance/ — endpoint sem teste (o docstring do próprio spec registra as três telas com três endpoints). Acrescentar variante: criar SC pelo widget do Portal de Contratos (nasce presa em Início por D-01 — a massa ideal), abrir o detalhe, 'Cancelar Solicitação' + justificativa QA, afirmar atividade 'Solicitação cancelada', Histórico 'Processo cancelado por: <usuário> - <justificativa>' e ausência em Tarefas a concluir.

**Arquivo alvo:** `tests/e2e/tarefas/cancelamento-solicitacao.spec.js`

## FSWTBC-4625 — IMPLEMENTAR

**Teste:** — (cancelamento-solicitacao.spec.js cobre o endpoint em lote; ciclo-comprador.spec.js :: CT-E2E-07-H abre Controle de Cotações, vazio)

**O que falta:** Nenhum teste toca a via do comprador (Controle de Cotações -> 'Cancelar Solicitação': cancelQuotes -> handlePurchasesDelet + dsFluig_postProcessesCancel) nem o cancelamento de SC com cotação já cancelada no ERP. Bloqueios: SC própria não gera cotação (alçada), sem credencial de comprador/Protheus. O achado A2-c (404 do dataset cai no ramo de sucesso) seria testável com derrubarDataset('dsFluig_postProcessesCancel') afirmando que NÃO aparece 'cancelamento ... executado com sucesso' — mas exige uma linha no Controle de Cotações, hoje vazio mesmo com 'Atuar como'. Sem massa, faltaPreCondicao; a parte Fluig (SC de versão antiga sem conversão manual) depende de massa de versão anterior, inexistente como massa própria.

**Arquivo alvo:** `tests/e2e/portais/ciclo-comprador.spec.js (via comprador); tests/e2e/tarefas/cancelamento-solicitacao.spec.js (via detalhe)`

