# RH e Administrativos — comparação chamados x suíte Playwright

8 casos: **APRIMORAR** 1 · **IMPLEMENTAR** 7

| Caso | Status | Teste existente | Arquivo alvo |
|---|---|---|---|
| FSWTBC-648 | IMPLEMENTAR | — (tests/e2e/plataforma/deep-link-spa.spec.js :: CT-PLT-04-S2 abre /gestao_equipes mas só afirma que não cai em 404) | `tests/api/arvore-hierarquica-demitidos.spec.js (novo)` |
| FSWTBC-689 | IMPLEMENTAR | — (tests/e2e/rh/bloqueio-processos-rh.spec.js :: deve bloquear o início de wf_aprovacao_ocorrencia (Aprovação de Ocorrência) para usuário fora do grupo de RH prova o NEGATIVO para a conta de QA) | `tests/e2e/rh/aprovacao-ocorrencia.spec.js (novo, projeto com credencial de RH)` |
| FSWTBC-690 | IMPLEMENTAR | — | `tests/api/aprovacao-ocorrencia-instancias.spec.js (novo)` |
| FSWTBC-691 | IMPLEMENTAR | — | `tests/e2e/rh/aprovacao-ocorrencia.spec.js (novo, projeto com credencial de RH)` |
| FSWTBC-1401 | IMPLEMENTAR | — (tests/e2e/plataforma/inicio-processo-bloqueado.spec.js :: deve bloquear o início de "wf_solicitacao_ferias" com a mensagem de permissão; deep-link-spa.spec.js @bug cobre o 404 de /gestao_ferias) | `tests/e2e/rh/solicitacao-ferias.spec.js (novo, projeto com credencial de RH)` |
| FSWTBC-3918 | APRIMORAR | tests/e2e/rh/delegacao-tarefas.spec.js :: CT-SUB-02-H: deve abrir o formulário de início com os campos de delegante, delegado e período | `tests/e2e/rh/delegacao-tarefas.spec.js` |
| FSWTBC-4198 | IMPLEMENTAR | — | `tests/api/avisos-ferias-contrato.spec.js (novo); ciclo em tests/e2e/rh/solicitacao-ferias.spec.js` |
| FSWTBC-4418 | IMPLEMENTAR | — (tests/e2e/contratos/delegacao-fiscais-ciclo.spec.js só chega ao Enviar do formulário a frio, recusado com 'Solicitação só pode ser aberta através do portal de delegação de fiscais!') | `tests/api/valid-replaced-users.spec.js (novo); ciclo em tests/e2e/contratos/delegacao-fiscais-ciclo.spec.js` |

## FSWTBC-648 — IMPLEMENTAR

**Teste:** — (tests/e2e/plataforma/deep-link-spa.spec.js :: CT-PLT-04-S2 abre /gestao_equipes mas só afirma que não cai em 404)

**O que falta:** Nenhum teste toca a árvore hierárquica nem o dataset dsProtheus_getArvoreHierarquica_restGetAll. Viável já, sem credencial de gestor e sem escrita: teste de API (padrão tests/api/sincronizacao-protheus.spec.js) lendo o dataset via /api/public/ecm/dataset/search e afirmando (a) nenhum nó com RA_SITFOLH='D' e (b) nó sem RA_MAT <=> POSTO VAGO. Registrar o achado do caso: 19/27 nós com RA_SITFOLH vazio — a coluna não sustenta o filtro para 70% da amostra, e o tratamento de 'D' está comentado no front. Passo 3 (SC cujo gestor imediato é demitido) exige massa de RH no Protheus — não fabricável; a árvore na UI exige gestor ('Usuário não encontrado no ERP Protheus').

**Arquivo alvo:** `tests/api/arvore-hierarquica-demitidos.spec.js (novo)`

## FSWTBC-689 — IMPLEMENTAR

**Teste:** — (tests/e2e/rh/bloqueio-processos-rh.spec.js :: deve bloquear o início de wf_aprovacao_ocorrencia (Aprovação de Ocorrência) para usuário fora do grupo de RH prova o NEGATIVO para a conta de QA)

**O que falta:** O caso exige usuário de RH iniciando e a solicitação chegando à aprovação; a suíte só afirma que TOTVS-FS é barrado (correto para esse perfil; mensagem literal 'Usuário TOTVS-FS não possui permissão para iniciar solicitações do processo wf_aprovacao_ocorrencia'). Exige credencial de RH — hoje há um único storageState. Nascer como projeto Playwright adicional (ex.: 'rh', com QA_RH_USERNAME) em tests/e2e/rh/aprovacao-ocorrencia.spec.js: formulário abre, Enviar cria (capturar processInstanceId em workflowView/send), tarefa no aprovador, Histórico sem exceção, limpeza pelo livro-razão. Ganho imediato sem credencial: em bloqueio-processos-rh.spec.js afirmar que a recusa viaja como 403 e não 500/NotFoundException em getDefinitionProcess (@bug novo, divergência registrada no caso).

**Arquivo alvo:** `tests/e2e/rh/aprovacao-ocorrencia.spec.js (novo, projeto com credencial de RH)`

## FSWTBC-690 — IMPLEMENTAR

**Teste:** —

**O que falta:** Start disparado pelo Protheus — sem credencial de ERP nem de RH; a base tem 0 instâncias de wf_aprovacao_ocorrencia. Único oráculo possível hoje, de leitura: GET /process-management/api/v2/requests?processId=wf_aprovacao_ocorrencia — quando existirem instâncias, afirmar que nenhuma está presa no marco de Início e que o Histórico traz 'Integração executada com sucesso'; sem instância, faltaPreCondicao. Pareado com 691 (mesmo incidente, lado Fluig).

**Arquivo alvo:** `tests/api/aprovacao-ocorrencia-instancias.spec.js (novo)`

## FSWTBC-691 — IMPLEMENTAR

**Teste:** —

**O que falta:** Start pelo lado Fluig (tela ou POST /process-management/api/v2/processes/wf_aprovacao_ocorrencia/start) devolvendo processInstanceId sem exceção, primeira atividade com responsável, nada preso em Início. Conta de QA sem permissão de início (já afirmado em bloqueio-processos-rh.spec.js) — exige credencial de RH; não disparar o start pela API com a conta atual (escrita não rastreável em processo de RH). Com credencial: mesma spec de 689 acrescentando a variante por API e a assertion de 'nenhuma instância presa em Início'.

**Arquivo alvo:** `tests/e2e/rh/aprovacao-ocorrencia.spec.js (novo, projeto com credencial de RH)`

## FSWTBC-1401 — IMPLEMENTAR

**Teste:** — (tests/e2e/plataforma/inicio-processo-bloqueado.spec.js :: deve bloquear o início de "wf_solicitacao_ferias" com a mensagem de permissão; deep-link-spa.spec.js @bug cobre o 404 de /gestao_ferias)

**O que falta:** Campos customizados da MIT010 presentes, obrigatórios, preenchidos automaticamente e persistidos. Bloqueios: sem permissão de início (credencial de RH), conta não é funcionário no ERP (sem período aquisitivo), MIT010 em imagem (sem lista de campos legível), 0 instâncias. Nascer quando houver credencial + lista de campos transcrita: abrir o processo, afirmar cada campo por rótulo/obrigatoriedade, Enviar sem obrigatório => crítica citando o campo (sem guarda — a validação vem do servidor), reabrir e conferir persistência via expand=formFields.

**Arquivo alvo:** `tests/e2e/rh/solicitacao-ferias.spec.js (novo, projeto com credencial de RH)`

## FSWTBC-3918 — APRIMORAR

**Teste:** tests/e2e/rh/delegacao-tarefas.spec.js :: CT-SUB-02-H: deve abrir o formulário de início com os campos de delegante, delegado e período

**O que falta:** Afirma campoDataFinal (#substitutoDtFinal) visível e editável — cobre 'o campo existe'. Não afirma que está marcado como obrigatório nem que o envio com Data Final em branco é bloqueado com crítica nomeando o campo. Acrescentar: (a) rótulo 'Data Final *' / atributo required; (b) preencher os zooms, Data Inicial (ISO aaaa-mm-dd) e Observação, deixar Data Final vazia e clicar Enviar SEM a guarda — a crítica de obrigatório vem do servidor em workflowView/send, e com a guarda o vermelho seria artefato (medido em delegacao-fiscais-ciclo.spec.js) — afirmando a mensagem 'campo ... obrigatório' e ausência de processInstanceId na resposta; @destrutivo pelo envio real.

**Arquivo alvo:** `tests/e2e/rh/delegacao-tarefas.spec.js`

## FSWTBC-4198 — IMPLEMENTAR

**Teste:** —

**O que falta:** Nenhum teste toca aviso/recibo de férias (widget sem rota documentada; datasets dts_getAvisosFerias / dts_getControleAceiteAvisoFerias). Bloqueios: processo não abre para QA (HTTP 500 em getDefinitionProcess), 0 movimentos, gestao_ferias em 404, dataset de aceite responde 'Usuário sem permissão'. Viável agora, de leitura: teste de contrato afirmando que dts_getAvisosFerias responde 200 com as 13 colunas (IDSOLIC...ACEITEAVISO) e que dts_getControleAceiteAvisoFerias existe (recusa de permissão, não 'não encontrado' — corrige o ticket). O ciclo (agendar -> aviso com NOME da SRA e DEPTO real -> aceite -> recibo) exige colaborador com saldo, gestor e folha processada.

**Arquivo alvo:** `tests/api/avisos-ferias-contrato.spec.js (novo); ciclo em tests/e2e/rh/solicitacao-ferias.spec.js`

## FSWTBC-4418 — IMPLEMENTAR

**Teste:** — (tests/e2e/contratos/delegacao-fiscais-ciclo.spec.js só chega ao Enviar do formulário a frio, recusado com 'Solicitação só pode ser aberta através do portal de delegação de fiscais!')

**O que falta:** Nenhum teste alcança a atividade de aprovação de wf_delegacaoFiscalContratoServico nem lê quem executou a reprovação no Histórico. Bloqueios: sem credenciais de titular/substituto/gestor e sem instância parada em aprovação (processo nunca iniciado — 'Último iniciado: Nunca'). Viável agora, sem escrita: teste de API afirmando que /ecm/api/rest/ecm/centralTasks/getValidReplacedUsers devolve o próprio login além dos substituídos (bullet 4 do caso). O restante (Motivo obrigatório na reprovação, Histórico com o login real de quem agiu) fica para quando houver instância + credencial de gestor.

**Arquivo alvo:** `tests/api/valid-replaced-users.spec.js (novo); ciclo em tests/e2e/contratos/delegacao-fiscais-ciclo.spec.js`

