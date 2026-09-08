# Gestao de Equipes — comparação chamados × suíte Playwright

Medido em 08/09/2026 sobre `tests/` (198 testes) lendo o corpo dos testes e dos Page Objects, não os títulos.

| Status | Casos |
|---|---|
| COBERTO | 0 |
| APRIMORAR | 1 |
| IMPLEMENTAR | 12 |
| **Total** | **13** |

## Leitura do módulo

**Nenhum caso COBERTO e nenhuma spec de Gestão de Equipes existe.** O único teste que abre `/portal/p/1/gestao_equipes` é `tests/e2e/plataforma/deep-link-spa.spec.js :: CT-PLT-04-S2`, que afirma apenas "não é errorPage/404" — passa verde enquanto a widget exibe um modal de erro intitulado "Sucesso:" e deixa a página em branco. `rh/banco-horas.spec.js` tem uma aba "Organograma", mas é o Portal de Horas Extras, não esta widget. Busca por `gestao_equipes|árvore|hierarq|RD4|POSTO VAGO|Tarefas Assumidas` em `tests/`, `pages/`, `utils/` confirma: nada.

**Contexto que decide as classificações:** a conta de QA não tem matrícula no ERP — a widget aborta ("Usuário não encontrado no ERP Protheus.") **antes** de consultar `dsProtheus_getArvoreHierarquica_restGetAll`; `RA_SITFOLH` vem vazio em ~70% dos nós e o filtro `case 'D' //Demitidos` está comentado no fonte. Logo, 10 dos 13 casos exigem conta de gestor (620, 632, 635, 636, 637, 643, 647, 649, 650, 1790) e são IMPLEMENTAR com bloqueio. A técnica `utils/dataset-fluig.js` (`responderDatasetCom`) permite simular a árvore e cobrir a **renderização** (POSTO VAGO, legenda, lista por departamento) sem conta de gestor — é a parcial recomendada para 643, 647, 635, 620/1790.

**IMPLEMENTAR de maior valor, viáveis hoje:**
1. **FSWTBC-630** (@bug) — a falha é comunicada com título "Sucesso:", `type: "danger"` (ícone inválido, `SweetAlert2: Unknown icon`) e página em branco após OK. Está em `docs/achados-novos-sdcassi.md` (A4) **sem teste**. Reproduzível com a conta QA em segundos. Cobre também a metade "erro" de 637.
2. **FSWTBC-688** (Alta: alçada) — 10 chamadas de leitura ao dataset e afirmar respostas idênticas com `RA_MAT`/`RA_NOME` preenchidos; o caso já mediu a stub `{"SUBSTITUTO":""}` para o posto 80001860 — vira @bug ou pré-condição a esclarecer.

**Único APRIMORAR:** 651 — acrescentar a rota em `ROTAS_CHAVE` de `erros-de-console.spec.js` (título + networkidle + sem erro de console não catalogado) já capturaria hoje o "Unknown icon … danger".

## Caso a caso

### FSWTBC-620 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste abre a widget além de 'não cai em 404' (deep-link-spa.spec.js). Bloqueio: a conta QA não tem matrícula no ERP — a widget aborta ('Usuário não encontrado no ERP Protheus.') antes de consultar dsProtheus_getArvoreHierarquica_restGetAll; comparar com a RD4 exige Protheus. Parcial viável: responderDatasetCom simulando a árvore e afirmar a renderização dos nós/campos.
- **Arquivo-alvo:** `tests/e2e/rh/gestao-equipes.spec.js (novo)`

### FSWTBC-630 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. VIÁVEL HOJE com a conta QA, como @bug: a falha é exibida em modal SweetAlert2 com título 'Sucesso:' e type 'danger' (ícone inválido, console 'Unknown icon'), e após OK a página fica em branco — registrado em docs/achados-novos-sdcassi.md A4 sem teste. Afirmar: título/ícone de erro, texto 'Usuário não encontrado no ERP Protheus.', estado vazio explicativo após fechar.
- **Arquivo-alvo:** `tests/e2e/rh/gestao-equipes.spec.js (novo)`

### FSWTBC-632 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio: exige conta de gestor com matrícula e leitura da RD4 (Protheus). Parcial viável por API: chamar dsProtheus_getArvoreHierarquica_restGetAll com ISMANAGER,true para um gestor conhecido e afirmar que todo nó gestor devolvido tem filhos consultáveis (sem gestor 'sumido').
- **Arquivo-alvo:** `tests/api/arvore-hierarquica.spec.js (novo)`

### FSWTBC-635 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio: conta QA sem matrícula — a árvore nunca monta. Parcial viável: responderDatasetCom com departamento subordinado e afirmar a lista de colaboradores; simular gestor sem departamentos e afirmar a mensagem explicativa (não tela em branco).
- **Arquivo-alvo:** `tests/e2e/rh/gestao-equipes.spec.js (novo)`

### FSWTBC-636 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste toca Tarefas Assumidas. Bloqueio: funcionalidade interna à widget, só alcançável com a árvore montada (conta de gestor). Parcial viável por API: dsFluig_getQtdFormTarAssumidaMes responde 200 com prefixoID/anoSolicitacao; gravação exige a tela.
- **Arquivo-alvo:** `tests/e2e/rh/gestao-equipes.spec.js (novo)`

### FSWTBC-637 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Metade 'matrícula não resolvida → informa como erro e mantém a tela' é VIÁVEL HOJE (mesmo @bug de FSWTBC-630). Metade 'monta a árvore para gestor consistente' bloqueada: sem conta de gestor.
- **Arquivo-alvo:** `tests/e2e/rh/gestao-equipes.spec.js (novo)`

### FSWTBC-643 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio: nó com RA_MAT vazio só aparece com a árvore montada (conta de gestor). Parcial viável: responderDatasetCom com um nó sem RA_MAT e afirmar nó 'POSTO VAGO' com classe distinta e widget sem erro; por API de workflow, tarefas cujo responsável seria o posto vago devem ter responsável 'admin', nunca vazio. Atenção: RA_SITFOLH vem vazio em ~70% dos nós e o filtro case 'D' (Demitidos) está comentado no widget.
- **Arquivo-alvo:** `tests/e2e/rh/gestao-equipes.spec.js (novo)`

### FSWTBC-647 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio: legenda (.panel-legendas) só é revelada com o organograma montado (conta de gestor). Parcial viável: responderDatasetCom simulando a árvore e afirmar que a legenda aparece junto com o organograma, com uma entrada por destaque usado (ativo, posto vago).
- **Arquivo-alvo:** `tests/e2e/rh/gestao-equipes.spec.js (novo)`

### FSWTBC-649 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio duplo: árvore no Fluig exige conta de gestor; estrutura da RD4 exige Protheus. Sem oráculo externo, o máximo viável é coerência interna do dataset (cada nó filho aponta para um gestor existente na mesma resposta).
- **Arquivo-alvo:** `tests/api/arvore-hierarquica.spec.js (novo)`

### FSWTBC-650 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio: RD4 visão 37 exige Protheus. Parcial viável por API: a resposta de dsProtheus_getArvoreHierarquica_restGetAll com ISMANAGER,false deve trazer nós sem RA_MAT (postos vagos) em vez de omiti-los — o caso mediu que a consulta por posto devolve a stub {"SUBSTITUTO":""}.
- **Arquivo-alvo:** `tests/api/arvore-hierarquica.spec.js (novo)`

### FSWTBC-651 — **APRIMORAR**

- **Teste que toca o fluxo:** tests/e2e/plataforma/deep-link-spa.spec.js :: CT-PLT-04-S2: acessar /portal/p/1/gestao_equipes diretamente pela URL deve abrir a página, não cair em 404
- **O que falta:** É o único teste que abre a rota, e afirma apenas 'não é errorPage/404' — passa verde com a página em branco. Acrescentar a rota em ROTAS_CHAVE de erros-de-console.spec.js (título + networkidle + sem erro de console não catalogado, que hoje capturaria o 'SweetAlert2: Unknown icon … danger') e, na spec nova, loading aparece e some, sem timeout, limit=300 na chamada da árvore. Tempo real do caminho feliz bloqueado: conta de gestor.
- **Arquivo-alvo:** `tests/e2e/plataforma/erros-de-console.spec.js + tests/e2e/rh/gestao-equipes.spec.js (novo)`

### FSWTBC-688 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Passos 1–2 VIÁVEIS HOJE sem gestor: 10 GET dataset/search em dsProtheus_getArvoreHierarquica_restGetAll (ISMANAGER,true,CODESEARCH,<matrícula>) e afirmar respostas idênticas com RA_MAT/RA_NOME não vazios; o caso já mediu 4x idêntico para 00008161 e a stub {"SUBSTITUTO":""} para o posto 80001860 — este último vira @bug ou pré-condição a esclarecer. Passos 3–5 (árvore, tbManager da SC, Tracker Aprovadores SC) exigem gestor/solicitante subordinado ao posto.
- **Arquivo-alvo:** `tests/api/arvore-hierarquica.spec.js (novo)`

### FSWTBC-1790 — **IMPLEMENTAR**

- **O que falta:** Mesmo cenário de FSWTBC-620 (equipe carregada da hierarquia do Protheus). Nenhum teste; bloqueio: conta QA sem matrícula no ERP. Implementar junto com 620 na spec nova, com responderDatasetCom como parcial.
- **Arquivo-alvo:** `tests/e2e/rh/gestao-equipes.spec.js (novo)`

