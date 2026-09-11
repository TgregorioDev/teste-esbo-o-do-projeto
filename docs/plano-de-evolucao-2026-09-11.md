# Plano de evolução — Suíte E2E TOTVS Fluig Cassi

> O que falta para a suíte ficar mais completa e confiável, medido contra as normas da skill
> `playwright-test-creator` e contra o backlog de casos ainda não automatizados. Cada etapa traz
> **por que (com a evidência), o que mudar e onde, como verificar e quando está pronta**.
>
> | | |
> |---|---|
> | **Base** | commit `8228e33` · ambiente `caixade213859` · reexecução dos 89 vermelhos de ambiente em 11/09/2026 |
> | **Normas** | `playwright-test-creator` (fluxo 1–18, proibições, quality gate) · `cassi-fluig-master` (ambiente e regras do cliente) |
> | **Regra de execução** | primeiro plano, fatiado; portão do ERP no `globalSetup`; destrutivos com `PAUSA_DESTRUTIVOS` |
> | **Antecessor** | `docs/plano-de-melhoria-2026-09-03.md` (ambiente anterior; implementado) |

---

## 0. Correções à primeira versão deste plano

A primeira versão foi apresentada no terminal em 11/09/2026. Três pontos mudaram ao ler o código
e o ambiente com mais cuidado — e mudam o que se implementa:

| Ponto | Versão do terminal | Medido depois | Consequência |
|---|---|---|---|
| `pages/MedicaoContratoPage.js:275` — `waitForTimeout(1200)` | "violação a corrigir" | **exceção medida e documentada**: o formulário libera o próximo zoom por um `setInterval` interno de 100 ms sem nenhum efeito observável de fora (amostrado a cada 150 ms por 3,4 s em 25/08/2026) | fica; recebe `eslint-disable` **com o motivo** |
| 3 laços com `setTimeout(5000)` em `ciclo-solicitacao-compras.spec.js:477,603` e `ciclo-faturamento.spec.js:194` | "espera por tempo a corrigir" | são **polling do estado no servidor, com teto**, dentro de `page.evaluate` — não sincronização cega | vira **melhoria** (migrar para `expect.poll`, que dá mensagem e prazo no relatório), não correção de norma |
| Acompanhamento de Contratos (63 dos 84 vermelhos de ambiente) | "não publicado" | **publicado em 11/09/2026**; grade com 809 registros; **4 dos 6 datasets** do widget respondem (faltam `getFiscaisPorTipoContrato` e `getCronogramaFinanceiro`) | a etapa 0 espera os 6; a etapa 3 é reavaliada |

---

## 1. Pedidos externos — começam já, porque não dependem de código

| # | Pedido | Destrava | Com quem |
|---|---|---|---|
| **E1** | Publicar `dsProtheus_getFiscaisPorTipoContrato` e `dsProtheus_getCronogramaFinanceiro` | o restante do Acompanhamento de Contratos | desenvolvedor (em andamento em 11/09) |
| **E2** | Matrícula de comprador (SY1/`Y1_USER`) para `TOTVS-FS`, ou uma conta de comprador | Portal do Comprador, "Atuar como", filas de cotação — **221 casos** | administrador do Protheus |
| **E3** | `TOTVS-FS` como substituto do gestor orçamentário (Erlon), pela "Substituição de Cargos" | SC chegar à Gerência de Compras e à Validação dos Compradores | Erlon / Cassi |
| **E4** | Contas de fiscal/CSE, gestor de alçada e fornecedor | **54 + 39 + 15 casos** | Cassi / TOTVS |
| **E5** | Decisão de regra do FSWTBC-4952 (crítica abaixo de R$ 0,10 ou de R$ 1,00?) | um vermelho sem veredito | desenvolvedor |
| **E6** | Retorno sobre o defeito do cancelamento (`beforeCancelProcess` × 404 sem cotação) | tag `@bug` do `cancelamento-sc-integrada` e o resíduo que não cancela | desenvolvedor (enviado em 11/09) |
| **E7** | Trocar a senha da conta de QA | segurança: vazou em conversa e aparece no FSWTBC-4608 e no fonte `UGCTE027.prw` | dono da conta |
| **E8** | Planilha de contrato com `CNA_VLTOT` vazio (~2% na filial 5303, nunca zero): é dado incompleto ou defeito? | tornar incondicional a assertion de "Valor Total" em `modais-do-contrato.spec.js:270` | dono do produto / desenvolvedor |

---

## 2. Regras transversais — valem para toda etapa

- Fluxo 1–18 da skill, **sem pular 13–18**: executar, analisar, corrigir pela causa raiz, validar
  de novo, garantir que não entrou flaky, conferir a evidência no relatório.
- **Prova de que reprova** em toda mudança de oráculo: quebrar a expectativa (ou injetar a falha),
  ver o FAIL, reverter. Validado assim nas correções de 10–11/09.
- A tela é o comportamento; o servidor **classifica** o vermelho, nunca substitui a verificação da
  tela (`utils/estado-da-solicitacao.js`).
- Leitura que decide veredito **espera por condição**. `isVisible()`, `count()`, `evaluateAll()` e
  `isChecked()` devolvem o instante.
- Massa sempre com carimbo `QA` e registrada; nada se passa por usuário real ou integrador.
- Commit e push direto na `main`.

---

## 3. Visão geral

| Etapa | Tema | Depende de | Estado |
|---|---|---|---|
| 0 | Linha de base confiável | E1 | aguardando os 6 datasets (verificação a cada 10 min) |
| 1 | Lint que aplica as normas | — | **1.1, 1.2 e 1.6 concluídas** (11/09); 1.3–1.5 pendentes |
| 2 | Todo vermelho com veredito | — | pendente |
| 3 | Contrato descoberto por dataset | 0 (reavaliar) | pendente |
| 4 | Massa por API como fixture | — | pendente |
| 5 | Personas | E2, E3, E4 | pedidos a fazer |
| 6 | Backlog de casos por estratégia | 1–5 (contínuo) | contínuo |
| 7 | Determinismo e CI | 0 | pendente |
| 8 | Documentação e segurança | — (E7) | contínuo |

Ordem: 0 → 1 e 2 juntas → 3 → 4; a 5 começa pelos pedidos; 7 e 8 em paralelo; 6 é contínua.

---

## Etapa 0 · Linha de base confiável

**Por quê.** O retrato atual mistura medições de 10/09 e 11/09, antes e depois de correções: 146
verdes, 66 vermelhos (inclui `@bug`), 84 pré-condições. `docs/estado-do-gate.md` tem como último
registro 03/09/2026, ainda no ambiente anterior.

**O que fazer.**
1. Esperar E1 — hoje 4 de 6 datasets do Acompanhamento respondem.
2. `npm run canario`; execução completa fatiada, com destrutivos e pausa, **fora da madrugada**
   (a carga noturna do Protheus vai de 01:00 a 05:00).
3. `npm run cobertura` e registro em `docs/estado-do-gate.md`.

**Pronto quando.** Houver relatório por causa, no formato de
`docs/execucoes/relatorio-destrutivos-2026-09-10.md`, sobre o código atual.

---

## Etapa 1 · Lint que aplica as normas sozinho

**Por quê.** A varredura de anti-padrões do quality gate era manual. Medido em 11/09/2026: 11
`.catch(() => {})` e 31 `try` em specs sem auditoria, 75 leituras instantâneas, 7 XPath, 2
scripts sem `@ts-check`, e nenhum lint.

**O que mudar.**
- **1.1** `eslint.config.js` com `@eslint/js` e `eslint-plugin-playwright`, todas as regras
  recomendadas como **aviso**; `npm run lint`. `playwright/no-eval` desligada: `page.evaluate` +
  `fetch` é padrão obrigatório por causa do WAF.
- **1.2** Triar a lista por regra. Cada ponto é corrigido ou vira exceção **anotada**
  (`eslint-disable-next-line <regra> -- <motivo medido>`). A primeira exceção é a de
  `MedicaoContratoPage.js:275` (seção 0).
- **1.3** Auditar os 11 `.catch(() => {})` e os 31 `try`: cada um relança ou chama
  `faltaPreCondicao`. Nenhum pode engolir assertion.
- **1.4** Revisar as leituras instantâneas começando por `DocumentosGedPage`,
  `modais-do-contrato`, `CentralTarefasPage`, `validacoes-faturamento`, `delegacao-fiscais-ciclo`.
- **1.5** Melhoria: os 3 laços de polling no servidor → `expect.poll`. Validar com execução dos
  destrutivos correspondentes (criam SC que não cancela — E6).
- **1.6** Quando a lista zerar: regras para `error` e passo de lint bloqueante no CI.

**Como verificar.** `npm run lint` sem avisos novos; `npm run typecheck` limpo; os arquivos tocados
executados, com prova de FAIL onde o oráculo mudou.

### Andamento — 11/09/2026

**Linha de base do lint:** 174 achados (170 avisos, 4 erros) em 62 arquivos. **Hoje: zero, com as
regras como erro**, e `npm run lint` roda no CI logo depois do typecheck.

| Grupo | Qtd | Decisão |
|---|---:|---|
| `no-conditional-in-test` | 124 | **regra desligada**, com o motivo na config: 80 eram `if (...) faltaPreCondicao(...)`, 3 `throw` com mensagem, 6 anotações de evidência, 5 ternários. Assertion condicional segue coberta por `no-conditional-expect`. Os `return` antecipados foram revisados à mão |
| `prefer-to-have-length`, `prefer-to-have-count`, `no-useless-not`, espaçamento | 12 | correção automática (semântica preservada) |
| `prefer-web-first-assertions` | 6 | correção automática **revisada à mão**: em `resumo-tarefas.spec.js` ela gerou `toBeVisible(boolean)`, inválido, e uma mensagem que dizia "está visível" sempre — reescrito com `toBeVisible({ visible })`; em `cadastro-publico-fornecedor.spec.js` a anotação passaria a registrar o locator em vez do CEP — a leitura ficou só para a evidência |
| `no-conditional-expect` | 11 | 1 correção (`alcadas-orcamentaria`: `if/else` → uma assertion incondicional); 9 exceções anotadas (poll documentado, limpeza em `finally`, invariante por par, ramos que afirmam os dois); 1 exceção pendente de E8 (`modais-do-contrato:270`) |
| `no-networkidle` | 5 | exceções anotadas — a skill aceita `waitForLoadState`, e nos 5 a medição é sobre o tráfego da própria carga |
| exceções medidas | 3 | `waitForTimeout(1200)` da `MedicaoContratoPage` (seção 0), `{}` exigido pelo Playwright na fixture, promessa guardada de propósito no `FormularioSolicitacaoCompraPage` |
| variáveis não usadas, `catch {}` vazio, regex de ANSI em scripts | 7 | removidas / comentado / regra desligada só em `scripts/` |

**Verde falso encontrado pelo lint.** `gestao-equipes.spec.js` — um teste `@bug` fazia `return` quando o
diálogo não indicava falha e terminava **verde sem afirmar nada**; o alarme de defeito corrigido leria
isso como conserto. Virou `faltaPreCondicao`.

**Efeito colateral corrigido.** Instalar o ESLint trouxe `punycode` para `node_modules`, e o typecheck
passou a checar esse JS (o `jsconfig` segue até 2 níveis de import em `node_modules` por padrão).
`maxNodeModuleJsDepth: 0` resolve.

**Validação.** Não destrutivos tocados (`resumo-tarefas`, `recuperacao-senha`,
`cadastro-publico-fornecedor`, `gestao-equipes`, `alertas-automaticos`, `tracker-compras`): 18 de 20 com o
mesmo resultado de antes; os 2 diferentes eram a Central de Tarefas que não abriu, e na reexecução os 5 do
`resumo-tarefas` passaram, inclusive o reescrito. Destrutivos com asserção convertida
(`questionario-clinicassi`, `delegacao-fiscais-ciclo`): mesmo veredito de antes — o `:217` já era `@bug`
vermelho com a mesma mensagem.

**Não executado, e por quê:** a asserção do CEP em `cadastro-publico-fornecedor` (o `@bug` falha antes, no
CNPJ); o `alcadas-orcamentaria` reescrito (depende do fluxo de SC, com a atividade 233 degradando — fica
para a etapa 0); as conversões `toHaveLength` em specs destrutivos (troca sem mudança de semântica).

---

## Etapa 2 · Todo vermelho com veredito

**Por quê.** Vermelho sem tag e sem pré-condição é lido como regressão pelo gate
(`scripts/veredito-do-gate.mjs`). Na última medição eram ~9, parte já corrigida depois — a lista
exata sai da etapa 0.

**O que mudar, caso a caso.**
- Timeouts crus → `faltaPreCondicao` com evidência, ou correção: `ciclo-cotacao:170`,
  `sigajuri-consultivo:102`, `alcadas-orcamentaria:108`, `atribuicao-comprador` (teste destrutivo).
- `Failed to fetch` apareceu pelo menos 4 vezes → helper único de `fetch` dentro da página com
  retentativa (padrão de `utils/servico-erp.js`), usado pelos testes de API.
- `banco-horas` CT-BH-01-S2 perdeu o alvo com o Protheus no ar → simular a queda com
  `derrubarDataset` (`utils/dataset-fluig.js`).
- `FSWTBC-4503` (dataset não publicado) → pré-condição; reavaliar quando E1 concluir.
- `FSWTBC-4952` → E5.
- `admissao:37` → trocar o tipo da anotação manual, que hoje imita pré-condição.
- Novo `@bug`: a grade da Gerência de Compras lista processo cancelado como pendente (hoje só
  `@achado`).

**Pronto quando.** A linha de base não tiver nenhum vermelho sem veredito.

---

## Etapa 3 · Contrato descoberto por dataset, não pela grade

**Por quê.** `utils/massa-contratos.js` escolhe contrato lendo a grade do Acompanhamento; 17
arquivos dependem dele, inclusive fluxos que só precisam de "um contrato vigente". A grade voltou em
11/09, então **deixou de ser urgente** — mas continua sendo ponto único de falha, e os contratos
existem por dataset (564 vigentes com `CorporateId` + `BranchId`).

**O que mudar.** Fonte por dataset (varredura por filial, cache por execução) com a mesma interface
(critério, afinidade de hash, lock); a grade fica só para os testes da grade. Reescrever pela rota
de dados os 10 testes classificados como recuperáveis em
`docs/investigacoes/contratos-rota-alternativa.md`.

**Pronto quando.** Os consumidores que não testam a grade funcionarem com a grade fora.

---

## Etapa 4 · Massa por API como fixture

**Por quê.** A skill manda preparar dados por API quando a tela não é o comportamento testado.
Testes de tarefa e aprovação criam SC pelo formulário (~4 min) só para ter uma tarefa no pool.

**O que mudar.**
- `semear-massa` e `empurrar-massa` viram fixtures (`solicitacaoNoPool`, `solicitacaoAssumida`),
  com espera por estado no servidor e pré-condição quando a atividade 233 degrada.
- Usar em `acoes-da-tarefa`, `aprovacoes-solicitacao-compras`, `assumir-tarefa-pool`; a tela fica
  só nos testes do formulário.
- Factory de faturamento: carimbo `QA` e nunca copiar `usuarioSolicitante` do molde (a FC 96437,
  sem carimbo, se passou pelo disparo automático e contaminou 3 testes).
- Relatório periódico do resíduo que não cancela (E6).

---

## Etapa 5 · Personas

**Por quê.** Quatro perfis represam a maior parte do backlog (E2, E4). A conta única também trava a
Validação Orçamentária (E3).

**O que mudar.** `storageState` por persona gerado no `globalSetup`, credenciais em variável de
ambiente e segredo do CI, fixture `persona('comprador')`; sem credencial, pré-condição — nunca skip.

**Pronto quando.** Um teste de cada persona rodar com a conta própria.

---

## Etapa 6 · Backlog de casos, pela estratégia da skill

**Números.** Catálogo: 196 casos, 42 sem teste (03/09/2026). SDCASSI: 518 casos, 72 com teste
(09/09/2026); na comparação de 08/09, 157 "aprimorar" e 357 "implementar".

**Como.** (1) **Aprimorar** primeiro — reforçar a assertion de testes que já tocam o fluxo;
(2) **implementar** o executável hoje (API, dataset, Tracker, tela sem escrita); (3) bloqueados por
persona depois da etapa 5. Cada caso com a definição de pronto da skill (resultado esperado antes do
código, ID no título, massa de factory, execução, prova de FAIL, evidência). Automatizar a matriz dos
518 no `scripts/gerar-cobertura.mjs` (hoje é um documento manual de 08/09).

---

## Etapa 7 · Determinismo e CI

- `--repeat-each=3` nos não destrutivos neste ambiente; registrar instáveis.
- CI (`.github/workflows/e2e.yml`), a verificar e ajustar:
  - `timeout-minutes: 30` provavelmente menor que a suíte neste tenant → `--shard`;
  - `cron: '0 6 * * 1-5'` = **03:00 de Brasília**, dentro da carga noturna do Protheus → mover para
    depois das 06:00;
  - `retries: 2` no CI contra a decisão medida de `0` localmente (retentar dobra as pré-condições);
  - confirmar que o runner alcança o tenant; histórico de execuções **não verificado** (sem `gh`).
- Testes unitários com `node:test` (sem dependência) para lógica pura: `veredito-do-gate`,
  `gerar-cobertura`, `ehRecusaTransitoria`, coerência das factories.

---

## Etapa 8 · Documentação e segurança

- Afirmações desatualizadas: "554 vigentes" (`CLAUDE.md`, `README.md`); `docs/estado-do-gate.md`
  (03/09, ambiente anterior); `caixade182374` em `docs/mapa-do-ambiente.md` e
  `docs/catalogo-casos.md`; menções ao `WFLYEJB0054` (não existe mais); linha "Aba Atribuir nunca
  renderiza" no README; skill `cassi-fluig-master` com o domínio antigo e a afirmação de que "até SC
  presa é cancelável", que agora tem exceção.
- E7.
