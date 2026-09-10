# Execução dos destrutivos — 10/09/2026, 15:55–16:43

| | |
|---|---|
| **Ambiente** | `caixade213859` · conta `TOTVS-FS` |
| **Escopo** | `--grep @destrutivo` — 52 testes em 23 arquivos |
| **Modo** | 14 fatias em primeiro plano, 3 workers, `PAUSA_DESTRUTIVOS=60000` |
| **Portão do ERP** | `apiRESTProtheusCompras:SUCCESS` em todas as fatias |
| **Resultado** | **11 verdes · 41 vermelhos** |

Uma execução anterior, iniciada às 15:40 por outra sessão, morreu na primeira fatia (~15:49) e
não gravou relatório. Esta é a execução completa.

A leitura de cada vermelho foi cruzada com a linha do tempo das SCs **no servidor**
(`/process-management/api/v2/requests/{id}/activities`, instâncias 96448–96480). Foi esse
cruzamento que separou lentidão real de vermelho falso.

---

## Os 41 vermelhos, por causa

| Causa | Qtd | Dono |
|---|---:|---|
| Página de Acompanhamento de Contratos não publicada | 10 | ambiente |
| Defeito do produto reproduzido (chegou à assertion) | 9 | produto |
| Atividade 233 lenta — **comprovado no servidor** | 7 | ambiente |
| **A ação aconteceu no servidor e o teste não viu** | 7 | **suíte** — corrigido |
| Tela não abriu no prazo | 4 | ambiente (provável) |
| Colisão no publicador do GED entre testes paralelos | 2 | **suíte** — corrigido |
| Pool de Validação dos Compradores vazio | 1 | massa |
| Zoom de Classe Valor não sugeriu "AS00" | 1 | não determinado |

### 1. Página não publicada — 10
`ciclo-gestor` :36 :109 :155 · `ciclo-correcao-reenvio` :243 · `criacao-solicitacao` :142 :254
:323 :453 :649 · `ciclo-faturamento` :50. Todos declararam pré-condição. Na execução que caiu,
quatro deles tinham estourado como `page.navegar: Timeout 60000ms`.

### 2. Defeito reproduzido — 9
- `fail-open-formulario-sc` :128 — o Fluig aceitou enviar o formulário antes de ele montar.
- `ciclo-solicitacao` :581 — a SC 96458 concluiu "Grava SC e Anexos" **sem número no ERP**, com
  `erroIntegracao` vazio.
- `delegacao-fiscais-ciclo` :42 e :82 — o formulário exige um portal inalcançável e não tem campo
  de substituto.
- `favoritos-contrato-api` :127 — favoritar duas vezes responde 500 em `text/plain`.
- `bloqueio-extensoes` :133 (.bat) e :176 (executável renomeado .pdf), `gestao-documentos` :66
  (.exe) — o GED não valida o tipo do arquivo.
- `sigajuri-consultivo` :63 — Tipo Consulta com uma opção. ⚠️ **A confirmar**: a leitura é por
  `count()`, a mesma família da corrida que produziu o falso "combo UF vazio".

### 3. A 233 demorou de verdade — 7

| Teste | Sintoma | SC | 233 levou |
|---|---|---|---:|
| `aprovacoes` :334 | envio sem retorno em 60 s | 96452 | 983 s |
| `aprovacoes` :489 | envio sem retorno em 60 s | 96454 | 915 s |
| `ciclo-solicitacao` :348 | envio sem retorno em 60 s | 96456 | 1.220 s |
| `acoes-da-tarefa` :187 | envio sem retorno em 60 s | 96467 | 789 s |
| `acoes-da-tarefa` :300 | envio sem retorno em 60 s | 96468 | 739 s |
| `aprovacoes` :446 | não ficou assumível em 180 s | 96453 | 253 s |
| `ciclo-solicitacao` :1047 | não chegou à Validação do Gestor em 180 s | 96461 | 259 s |

Nos cinco "sem retorno" a SC **foi criada** e caiu em *Correção* depois de 12–20 minutos.
Janelas ruins: 16:03–16:10 e 16:27–16:28. No resto da execução a 233 levou 12–18 s.

### 4. A ação aconteceu e o teste não viu — 7

| Teste | O que o teste disse | O que o servidor mostrava |
|---|---|---|
| `alcadas-orcamentaria` :108 :193 :237, `ciclo-comprador` :293 | `waitForFunction(/iniciada com sucesso\|Erro/)` estourou em 30 s | SCs 96462/63/64/66 criadas, 233 em 12–17 s, na Validação do Gestor |
| `alcadas-orcamentaria` :39, `ciclo-comprador` :83 | "Assumir tarefa não abriu a tela de decisão" | SCs 96460/96465 assumidas pela conta |
| `alcadas-orcamentaria` :60 | "Falha ao submeter a aprovação" | SC 96459 aprovada: 7 → 9 → 280 → 14 |

### 5. Tela não abriu no prazo — 4
`ciclo-solicitacao` :799 (iframe não montou) · `sigajuri-contencioso` :113 (heading "Início" em
45 s; tinha passado mais cedo) · `sigajuri-consultivo` :95 (`waitForResponse` em 45 s) ·
`favoritos` :53. Entre 16:12 e 16:36, sem prova individual.

### 6 a 8. Avulsos
- `bloqueio-extensoes` :149 e :163 — "Não foi possível limpar as linhas residuais". Ver correção 2.
- `aprovacoes` :596 — pool de Validação dos Compradores vazio. A massa semeada para na atividade
  14 (gestor orçamentário nominal), ver `docs/investigacoes/massa-como-popular.md` §8.
- `atribuicao-comprador` :97 — o typeahead de Classe Valor não sugeriu "AS00" em 15 s.

---

## O que foi corrigido

### Correção 1 — a tela que não confirma é classificada pelo servidor
`utils/estado-da-solicitacao.js` (novo), usado por:

- `CicloCompradorPage.criarSolicitacaoCompraClassica` — trocou o `waitForFunction` de 30 s sem
  veredito por `FormularioSolicitacaoCompraPage.aguardarConfirmacaoDeEnvio`, o oráculo que a suíte
  já usava para o **mesmo evento**. Dois oráculos para um evento, um com veredito e outro sem,
  era o que produzia vermelho sem causa.
- `CentralTarefasComprasPage.assumirTarefaAtual` e `aprovarComRetentativa` — quando a tela não
  confirma, o servidor é consultado: ação registrada → `PRÉ-CONDIÇÃO AUSENTE (ambiente)` com a
  evidência; ação não registrada → falha real. **Nenhum prazo foi aumentado nesses dois.**

O que **não** mudou, de propósito: a tela continua sendo o que se afirma. O servidor só classifica
o vermelho — trocar um pelo outro esconderia um Fluig que de fato não confirma nada ao usuário.

### Correção 2 — o lock do GED cobre o desfecho
`DocumentosGedPage.enviarDocumento` com `esperaPublicacao: false` soltava o lock
`fluig-upload-staging` no clique em Confirmar, com o `saveNewItem` em voo e o arquivo ainda na
área de upload do usuário. O worker seguinte via esse arquivo como resíduo e não conseguia removê-lo.
Agora o lock é mantido até o **desfecho** — o publicador fechou *ou* uma mensagem de bloqueio
apareceu —, sem exigir o fechamento, que é o motivo de o `false` existir.

---

## Validação

| O quê | Resultado |
|---|---|
| `bloqueio-extensoes` + `gestao-documentos`, 2 workers, sem pausa | **0 "linhas residuais"**; os 5 `@bug` reprovam pela assertion de extensão; os 2 verdes seguem verdes |
| O mesmo com `--repeat-each=2` | 14 execuções, **0 residuais, 0 sem desfecho**, mesmo resultado nas duas repetições |
| Injeção: `takeTask` passa, tela de decisão vazia | `PRÉ-CONDIÇÃO … foi assumida no servidor` ✔ |
| Injeção: `takeTask` abortado | erro real `… NÃO está com …`, sem PRÉ-CONDIÇÃO ✔ |
| Injeção: `send` preso antes do servidor | erro real `… continua em atividade 7`, sem PRÉ-CONDIÇÃO ✔ |
| Injeção: `send` chega ao servidor, resposta nunca volta | `PRÉ-CONDIÇÃO … foi registrada no servidor` ✔ |
| `ciclo-comprador` :83 sem injeção | SC 96473 criada pelo oráculo novo, assumida e aprovada (233 em 16 s, gateway 9 → 280 → 14); o teste parou **depois**, no Portal do Comprador — bloqueio conhecido (conta sem `Y1_USER`) |

A injeção rodou num spec temporário, apagado ao fim da execução.

---

## Resíduo na base

O teardown só cancela o que o teste registrou, e os testes acima falharam antes disso. Ficaram
abertas as SCs 96452, 96454, 96456, 96467, 96468 (em *Correção*); 96459, 96471, 96473 (na 14);
96460, 96462–96466 (na 7). E a 96448, de uma variante do agente de massa, parada na 233 desde as
15:00. Todas nascem pela factory, com carimbo `QA`:
`node scripts/limpar-massa.mjs --descobrir --desde=2026-09-10 --simular` lista antes de cancelar.
