# Corretagens — comparação chamados x suíte Playwright

8 casos: **IMPLEMENTAR** 8

| Caso | Status | Teste existente | Arquivo alvo |
|---|---|---|---|
| FSWTBC-658 | IMPLEMENTAR | — | `tests/e2e/corretagens/cadastro-corretora.spec.js (novo)` |
| FSWTBC-660 | IMPLEMENTAR | — | `tests/e2e/corretagens/cadastro-corretora.spec.js (novo)` |
| FSWTBC-661 | IMPLEMENTAR | — | `tests/e2e/corretagens/cadastro-corretora.spec.js (novo)` |
| FSWTBC-662 | IMPLEMENTAR | — | `tests/e2e/corretagens/apuracao-corretagem.spec.js (novo)` |
| FSWTBC-663 | IMPLEMENTAR | — | `tests/e2e/corretagens/apuracao-corretagem.spec.js (novo)` |
| FSWTBC-664 | IMPLEMENTAR | — | `tests/e2e/corretagens/cadastro-corretora.spec.js (novo)` |
| FSWTBC-665 | IMPLEMENTAR | — | `tests/e2e/corretagens/cadastro-corretora.spec.js (novo)` |
| FSWTBC-2887 | IMPLEMENTAR | — | `tests/e2e/corretagens/cadastro-corretora.spec.js (novo)` |

## FSWTBC-658 — IMPLEMENTAR

**Teste:** —

**O que falta:** Nenhum teste. Módulo de Corretagens ausente deste ambiente: 0 de 88 páginas e 0 de 34 processos publicados contêm 'corretora'/'corretagem', cinco rotas em 404, ausente de Meus Apps. Não executável em homologação. Quando publicado: abrir corretora, sair sem tocar / clicar sem digitar / alterar e desfazer; afirmar ausência de aviso de alteração pendente, guarda-criacao com 0 escritas e auditoria sem evento.

**Arquivo alvo:** `tests/e2e/corretagens/cadastro-corretora.spec.js (novo)`

## FSWTBC-660 — IMPLEMENTAR

**Teste:** —

**O que falta:** Nenhum teste. Módulo de Corretagens ausente deste ambiente: 0 de 88 páginas e 0 de 34 processos publicados contêm 'corretora'/'corretagem', cinco rotas em 404, ausente de Meus Apps. Não executável em homologação. Quando publicado: par de corretoras A (com corretagens) / B (sem); em B afirmar toBeEditable em todos os campos permitidos, inclusive 'dia do vencimento', e salvar; em A o 'dia do vencimento' readonly. Mesmo teste do par invertido 665.

**Arquivo alvo:** `tests/e2e/corretagens/cadastro-corretora.spec.js (novo)`

## FSWTBC-661 — IMPLEMENTAR

**Teste:** —

**O que falta:** Nenhum teste. Módulo de Corretagens ausente deste ambiente: 0 de 88 páginas e 0 de 34 processos publicados contêm 'corretora'/'corretagem', cinco rotas em 404, ausente de Meus Apps. Não executável em homologação. Quando publicado: corretora com lookup gravado; afirmar código + descrição preenchidos ao abrir, registro selecionado no zoom, filtro por código e por descrição, e ciclo salvar/reabrir mantendo o valor.

**Arquivo alvo:** `tests/e2e/corretagens/cadastro-corretora.spec.js (novo)`

## FSWTBC-662 — IMPLEMENTAR

**Teste:** —

**O que falta:** Nenhum teste. Módulo de Corretagens ausente deste ambiente: 0 de 88 páginas e 0 de 34 processos publicados contêm 'corretora'/'corretagem', cinco rotas em 404, ausente de Meus Apps. Não executável em homologação. Rota da apuração não documentada e sem credencial de Protheus. Quando publicado: responderDatasetCom no dataset de apuração devolvendo o erro do Protheus e afirmar toast de ERRO (nunca sucesso) nomeando 'corretora sem contrato', com guarda de escrita provando 0 registros.

**Arquivo alvo:** `tests/e2e/corretagens/apuracao-corretagem.spec.js (novo)`

## FSWTBC-663 — IMPLEMENTAR

**Teste:** —

**O que falta:** Nenhum teste. Módulo de Corretagens ausente deste ambiente: 0 de 88 páginas e 0 de 34 processos publicados contêm 'corretora'/'corretagem', cinco rotas em 404, ausente de Meus Apps. Não executável em homologação. Quando publicado: validação NO CADASTRO (salvar corretora sem contrato => crítica citando o contrato) e apuração recusada ANTES de chamar o Protheus — interceptar o dataset de apuração e afirmar 0 chamadas (guarda); contraprova com corretora com contrato.

**Arquivo alvo:** `tests/e2e/corretagens/apuracao-corretagem.spec.js (novo)`

## FSWTBC-664 — IMPLEMENTAR

**Teste:** —

**O que falta:** Nenhum teste. Módulo de Corretagens ausente deste ambiente: 0 de 88 páginas e 0 de 34 processos publicados contêm 'corretora'/'corretagem', cinco rotas em 404, ausente de Meus Apps. Não executável em homologação. Quando publicado: digitar trecho no lookup, capturar o postData do dataset do zoom (utils/dataset-fluig.js) e afirmar que o texto vai como constraint e que a lista traz só os casamentos; trecho inexistente => lista vazia. Proxy citado no caso (zoom Fornecedor do Faturamento, #zoomFornecedor) não cobre o módulo — MedicaoContratoPage registra que esses selects nunca populam.

**Arquivo alvo:** `tests/e2e/corretagens/cadastro-corretora.spec.js (novo)`

## FSWTBC-665 — IMPLEMENTAR

**Teste:** —

**O que falta:** Nenhum teste. Módulo de Corretagens ausente deste ambiente: 0 de 88 páginas e 0 de 34 processos publicados contêm 'corretora'/'corretagem', cinco rotas em 404, ausente de Meus Apps. Não executável em homologação. Quando publicado: corretora A (com corretagens) => 'dia do vencimento' readonly/disabled e digitação não altera; corretora B (sem) => editável. Par obrigatório para distinguir 'bloqueado sempre' de 'bloqueado corretamente'.

**Arquivo alvo:** `tests/e2e/corretagens/cadastro-corretora.spec.js (novo)`

## FSWTBC-2887 — IMPLEMENTAR

**Teste:** —

**O que falta:** Nenhum teste. Módulo de Corretagens ausente deste ambiente: 0 de 88 páginas e 0 de 34 processos publicados contêm 'corretora'/'corretagem', cinco rotas em 404, ausente de Meus Apps. Não executável em homologação. Além do módulo ausente, falta o oráculo: a matriz campo a campo da DEM10011184 (inclusão x edição x consulta, por perfil). Sem ela o teste não tem o que afirmar. Quando houver módulo + matriz: percorrer campos e afirmar habilitado/somente-leitura/oculto exatamente como documentado.

**Arquivo alvo:** `tests/e2e/corretagens/cadastro-corretora.spec.js (novo)`

