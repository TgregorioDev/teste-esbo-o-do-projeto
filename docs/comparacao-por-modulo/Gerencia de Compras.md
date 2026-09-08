# Gerencia de Compras — comparação chamados x suíte Playwright

9 casos: **APRIMORAR** 9

| Caso | Status | Teste existente | Arquivo alvo |
|---|---|---|---|
| FSWTBC-1684 | APRIMORAR | tests/e2e/portais/gerencia-compras.spec.js :: deve listar as solicitações pendentes de transferência ao abrir a aba Transferir | `tests/e2e/portais/gerencia-compras.spec.js` |
| FSWTBC-1688 | APRIMORAR | tests/e2e/portais/atribuicao-comprador.spec.js :: a aba Atribuir não lista SCs para a conta autenticada, embora o mesmo mecanismo renderize dados reais na aba Transferir @achado; tests/e2e/portais/gerencia-compras.spec.js :: deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir @bug | `tests/e2e/portais/atribuicao-comprador.spec.js` |
| FSWTBC-2043 | APRIMORAR | tests/e2e/portais/gerencia-compras.spec.js :: deve listar as solicitações pendentes de transferência ao abrir a aba Transferir | `tests/e2e/portais/gerencia-compras.spec.js` |
| FSWTBC-2790 | APRIMORAR | tests/e2e/portais/gerencia-compras.spec.js :: deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir @bug | `tests/e2e/portais/atribuicao-comprador.spec.js` |
| FSWTBC-3707 | APRIMORAR | tests/e2e/portais/gerencia-compras.spec.js :: deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir @bug (e :: deve oferecer as abas Atribuir e Transferir ao carregar) | `tests/e2e/portais/gerencia-compras.spec.js` |
| FSWTBC-3840 | APRIMORAR | tests/e2e/portais/gerencia-compras.spec.js :: deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir @bug; tests/e2e/portais/atribuicao-comprador.spec.js :: ...@achado | `tests/e2e/portais/gerencia-compras.spec.js` |
| FSWTBC-4230 | APRIMORAR | tests/e2e/portais/atribuicao-comprador.spec.js :: a aba Atribuir não lista SCs para a conta autenticada, embora o mesmo mecanismo renderize dados reais na aba Transferir @achado | `tests/e2e/portais/atribuicao-comprador.spec.js` |
| FSWTBC-4537 | APRIMORAR | tests/e2e/portais/gerencia-compras.spec.js :: deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir @bug; :: deve listar as solicitações pendentes de transferência ao abrir a aba Transferir; tests/e2e/plataforma/erros-de-console.spec.js :: CT-PLT-06-S1: Gerência de Compras (/portal/p/1/gerenciaCompras) deve carregar sem erro de console não catalogado | `tests/e2e/portais/gerencia-compras.spec.js` |
| FSWTBC-4676 | APRIMORAR | tests/e2e/tarefas/assumir-tarefa-pool.spec.js :: assumir a primeira tarefa disponível de um grupo do pool deve movê-la para "Tarefas a concluir"; tests/e2e/portais/alcadas-orcamentaria.spec.js :: @destrutivo CT-E2E-04-H (Histórico 'assumiu a tarefa Validação do Gestor') | `tests/e2e/tarefas/assumir-tarefa-pool.spec.js` |

## FSWTBC-1684 — APRIMORAR

**Teste:** tests/e2e/portais/gerencia-compras.spec.js :: deve listar as solicitações pendentes de transferência ao abrir a aba Transferir

**O que falta:** O teste só afirma que a aba Transferir renderiza mais de uma linha, sob guarda de escrita — nenhum clique em Transferir. O caso exige a ORDEM dos dois passos (ds_putForm gravando matriculaValidBuyer ANTES de transferToBuyer), a mensagem 'Processo transferido com sucesso!' e a atomicidade (falha no passo 1 => transferToBuyer não sai + mensagem de erro). Acrescentar, sem escrever: selecionar um comprador no po-lookup de uma linha, derrubarDataset(page, 'ds_putForm') (utils/dataset-fluig.js), clicar Transferir e afirmar que nenhum transferToBuyer foi disparado (contar pelo postData) e que o toast de erro tem texto ('Problema para realizar a tranferência!'...). A variante positiva (2xx, formulário e tarefa atualizados) exige SC própria na etapa 119, inalcançável pela alçada (Validação Orçamentária).

**Arquivo alvo:** `tests/e2e/portais/gerencia-compras.spec.js`

## FSWTBC-1688 — APRIMORAR

**Teste:** tests/e2e/portais/atribuicao-comprador.spec.js :: a aba Atribuir não lista SCs para a conta autenticada, embora o mesmo mecanismo renderize dados reais na aba Transferir @achado; tests/e2e/portais/gerencia-compras.spec.js :: deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir @bug

**O que falta:** Os dois testes só medem a grade (vazia hoje); nenhum exercita a atribuição nem o contrato de ds_postAssumeProcessTask (assumir ANTES de mover; retorno {status, message}; responsável fixado). Acrescentar um @destrutivo sobre massa própria: SC criada pelo formulário clássico parada no pool 'Validação do Gestor', chamar ds_postAssumeProcessTask via /api/public/ecm/dataset/search com colleagueId/processInstanceId/replacementId e afirmar (a) status=true e (b) /requests/{id}/tasks passando de Pool:Group para o login (mesma técnica de lerEstadoNoServidor em acoes-da-tarefa.spec.js). A sequência assume->move na aba Atribuir fica bloqueada pelo @bug (grade vazia); quando houver linha, interceptar os datasets e afirmar a ordem.

**Arquivo alvo:** `tests/e2e/portais/atribuicao-comprador.spec.js`

## FSWTBC-2043 — APRIMORAR

**Teste:** tests/e2e/portais/gerencia-compras.spec.js :: deve listar as solicitações pendentes de transferência ao abrir a aba Transferir

**O que falta:** Nada afirma que uma SC JÁ ASSUMIDA continua transferível (sem HTTP 500) nem o efeito de 'Transferir em Lote'. Pré-condição inobservável hoje: as 65 linhas da aba trazem Comprador = 'Selecione um comprador' (nenhuma assumida) e a conta não leva SC própria até a etapa 119 (alçada). Acrescentar, quando houver massa: capturar a resposta de transferToBuyer (page.on('response')) e afirmar status < 500 e a SC saindo da fila do comprador anterior; enquanto não houver, faltaPreCondicao nomeando 'nenhuma SC assumida na aba Transferir'.

**Arquivo alvo:** `tests/e2e/portais/gerencia-compras.spec.js`

## FSWTBC-2790 — APRIMORAR

**Teste:** tests/e2e/portais/gerencia-compras.spec.js :: deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir @bug

**O que falta:** O @bug cobre só o primeiro bullet ('a aba Atribuir lista SCs') e reprova hoje. Falta o efeito da ação: selecionar SC + Atribuir => coluna Comprador preenchida, SC sai da fila, tarefa na Central do comprador, 'Atribuir em lote' sem sucesso parcial silencioso. Bloqueio duplo: grade vazia e conta sem matrícula de comprador (SY1) — o mesmo 'Comprador não encontrado' que erros-de-console.spec.js já registra no Portal do Comprador. Acrescentar quando a aba listar: fluxo de atribuição sobre SC própria com leitura do estado no servidor.

**Arquivo alvo:** `tests/e2e/portais/atribuicao-comprador.spec.js`

## FSWTBC-3707 — APRIMORAR

**Teste:** tests/e2e/portais/gerencia-compras.spec.js :: deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir @bug (e :: deve oferecer as abas Atribuir e Transferir ao carregar)

**O que falta:** Cobertos: título/abas e 'aba lista' (@bug). Faltam: colunas exatas Processo·Filial·Comprador·Solicitante·Num SC·Grupos de Produto (nenhum teste lê o cabeçalho — possível mesmo com grade vazia), diálogo 'Tem certeza que deseja atribuir o processo?', mensagem 'Processo atribuído com sucesso!', saída da grade e Histórico com a movimentação 257->119, e erro específico (nunca 'Erro ao atribuir processo' sem detalhe). A pré-condição (SC em 257) não é fabricável pela conta; a leitura do cabeçalho e a comparação com a contagem de instâncias em 257 via /process-management/api/v2/requests são possíveis já.

**Arquivo alvo:** `tests/e2e/portais/gerencia-compras.spec.js`

## FSWTBC-3840 — APRIMORAR

**Teste:** tests/e2e/portais/gerencia-compras.spec.js :: deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir @bug; tests/e2e/portais/atribuicao-comprador.spec.js :: ...@achado

**O que falta:** O par @bug/@achado é exatamente a divergência central do caso, mas o oráculo é fraco: count() > 1 reprova também quando legitimamente não há SC em 257 — não separa 'consulta quebrada' de 'fila vazia', que é a ambiguidade que o caso pede para instrumentar. Acrescentar: contar via API as instâncias de wf_solicitacao_compras com tarefa NOT_COMPLETED na atividade 257 (mesmo filtro do widget: workflowVersion 77) e afirmar linhas == contagem — reprova só quando há SC pendente não listada. Faltam ainda: lookup Comprador carrega compradores (verificável na aba Transferir, que tem linhas), gravação + Histórico 257->119, 'Atribuir em lote'.

**Arquivo alvo:** `tests/e2e/portais/gerencia-compras.spec.js`

## FSWTBC-4230 — APRIMORAR

**Teste:** tests/e2e/portais/atribuicao-comprador.spec.js :: a aba Atribuir não lista SCs para a conta autenticada, embora o mesmo mecanismo renderize dados reais na aba Transferir @achado

**O que falta:** O @achado prova a assimetria Atribuir(0) x Transferir(65) — o passo 8 do caso — mas nada afirma a regra 'tarefa assumida some da atribuição automática' nem o aviso explícito que o caso exige (hoje inexistente na interface: seria um @bug). Acrescentar, com massa própria em 257 (não fabricável hoje — alçada): SC-A no grupo aparece; SC-B assumida via assumeProcessTasks não aparece OU vem com aviso; nunca falha silenciosa ao atribuir. Enquanto a massa não existir, documentar com faltaPreCondicao.

**Arquivo alvo:** `tests/e2e/portais/atribuicao-comprador.spec.js`

## FSWTBC-4537 — APRIMORAR

**Teste:** tests/e2e/portais/gerencia-compras.spec.js :: deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir @bug; :: deve listar as solicitações pendentes de transferência ao abrir a aba Transferir; tests/e2e/plataforma/erros-de-console.spec.js :: CT-PLT-06-S1: Gerência de Compras (/portal/p/1/gerenciaCompras) deve carregar sem erro de console não catalogado

**O que falta:** Listagem das duas abas e console limpo na carga já cobertos. Falta o invariante que define o caso: 'SC parada em 257 aparece em pelo menos uma das abas' (comparar contagem por API x linhas — mesma instrumentação de 3840), o combo 'Selecione um comprador' por linha, e 'Filtrar' / 'Carregar mais resultados' sem erro de console (o teste de console só cobre a carga inicial). A recomendação do caso (versão publicada do widget = repositório) pode virar assertion sobre o bundle /wg_gerenciaComprasV1/.../main.js (workflowVersion 77 / documentId 251962 fixos no código).

**Arquivo alvo:** `tests/e2e/portais/gerencia-compras.spec.js`

## FSWTBC-4676 — APRIMORAR

**Teste:** tests/e2e/tarefas/assumir-tarefa-pool.spec.js :: assumir a primeira tarefa disponível de um grupo do pool deve movê-la para "Tarefas a concluir"; tests/e2e/portais/alcadas-orcamentaria.spec.js :: @destrutivo CT-E2E-04-H (Histórico 'assumiu a tarefa Validação do Gestor')

**O que falta:** Assumir do pool e cair em 'Tarefas a concluir' está coberto, e o Histórico 'assumiu a tarefa' é afirmado em CT-E2E-04-H para SC própria. Faltam: leitura do campo Responsável do card antes/depois (assumir-tarefa-pool só confere o id na listagem), a coluna Comprador em Gerência de Compras -> Transferir, e a 'mensagem clara' quando a política for atribuição automática (etapa 257). Bloqueio real: não há credencial de comprador e SC própria não chega a 257/119. Acrescentar em assumir-tarefa-pool.spec.js a leitura de Responsável e do Histórico da tarefa assumida.

**Arquivo alvo:** `tests/e2e/tarefas/assumir-tarefa-pool.spec.js`

