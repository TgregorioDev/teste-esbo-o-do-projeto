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
| **E2** | Matrícula de comprador (SY1/`Y1_USER`) para `TOTVS-FS`, ou uma conta de comprador | filas de cotação do Portal do Comprador — **221 casos**. ⚠️ Corrigido em 11/09/2026: "Atuar como" **não** é bloqueio (o seletor aparece e a delegação funciona, §1.4), e as filas seguem vazias mesmo delegando — antes deste pedido vem o **E3** | administrador do Protheus |
| **E3** | `TOTVS-FS` como substituto do gestor orçamentário (Erlon), pela "Substituição de Cargos" | SC chegar à Gerência de Compras e à Validação dos Compradores | Erlon / Cassi — o desenvolvedor vai cadastrar (11/09, 12:08); conferência pronta: `npm run canario` e CT-CMP-05-H |
| **E4** | Contas de fiscal/CSE, gestor de alçada e fornecedor | **54 + 39 + 15 casos** | Cassi / TOTVS |
| **E5** | Decisão de regra do FSWTBC-4952 (crítica abaixo de R$ 0,10 ou de R$ 1,00?) | um vermelho sem veredito | desenvolvedor |
| **E6** | ~~Retorno sobre o defeito do cancelamento~~ — **resolvido em 11/09/2026 (tarde)**: remedido, SC gravada no ERP e sem cotação cancela | a tag `@bug` saiu; o resíduo de antes da correção sai com `limpar-massa --alvos=` | desenvolvedor |
| **E7** | Trocar a senha da conta de QA | segurança: vazou em conversa e aparece no FSWTBC-4608 e no fonte `UGCTE027.prw` | dono da conta |
| **E8** | Planilha de contrato com `CNA_VLTOT` vazio (~2% na filial 5303, nunca zero): é dado incompleto ou defeito? | tornar incondicional a assertion de "Valor Total" em `modais-do-contrato.spec.js:270` | dono do produto / desenvolvedor |

---

## 1.1 Retorno do desenvolvedor — 11/09/2026

Respostas por WhatsApp entre 10:33 e 12:09, e o que foi feito do nosso lado com cada uma.

| Ele disse | Leitura | Feito |
|---|---|---|
| portal "pronto há algum tempo"; datasets "sendo aplicados" | E1 em andamento | às 14:47, 4 de 6 datasets; o canário diz o estado do dia |
| lentidão da integração é do Protheus, "não consigo intervir" | a 233 lenta deixa de ser pedido e vira **condição a medir antes de executar** | linha nova no canário: `duracaoDaIntegracao` (com teste unitário) nas 10 SCs mais recentes da base, de qualquer autor, só leitura. Às 14:50: **0 de 10 acima de 60 s** (12–41 s). Na manhã de 10/09 foram 687–1159 s. Acima de 200 s as fixtures já declaram pré-condição com a leitura |
| "vou colocar como substituto" (Validação Orçamentária; comprador no Protheus) | E3 a caminho | detecção no canário e teste CT-CMP-05-H, abaixo |
| faturamento: o job fica desligado, "tem que fazer manual" | não haverá FC aberta pelo Usuário Integrador | conclusão por teste, abaixo |

### Substituto do gestor orçamentário (E3) — pronto para conferir

Não há API REST de substitutos neste ambiente (cinco rotas candidatas: `NotFoundException`; o TDN só documenta o
SOAP `ColleagueReplacementService`). O sinal é a tela de detalhe da SC, medido com a conta de automação:

| Tarefa atual | O detalhe oferece |
|---|---|
| da própria conta (SC 96436, atividade 11) | **Movimentar** |
| de pool em que a conta está (SC 96369, atividade 7) | **Assumir tarefa** |
| nominal do gestor orçamentário (SC 96435, atividade 14) | só **Ver detalhes** |

- `CentralTarefasComprasPage.lerAcaoNaTarefaAtual()` lê isso esperando pelo primeiro dos três sinais.
- `npm run canario`, seção "Substituto do gestor orçamentário": abre uma SC da massa parada na 14 e diz
  `[ NÃO ]` ou `[ ok ]`. Às 14:50: **NÃO** (SC 96380).
- **CT-CMP-05-H** (`aprovacoes-solicitacao-compras.spec.js`): cria a SC, aprova a Validação do Gestor, espera no
  servidor a próxima tarefa humana, **exige que seja a 14** e confere que a tela oferece "Movimentar". Execução
  15:00: SC 96505 chegou à 14 e o teste parou na pré-condição do E3. Depois do cadastro, falta medir a tela de
  decisão da 14 (grade `tbItemOrcamentario`) e completar a aprovação — de propósito, não se escreveu decisão
  sem vê-la.

**Achado na primeira execução do CT-CMP-05-H — a suíte perdia a corrida do formulário.** A SC 96503, aprovada,
foi para 11 "Ajustar Informações" com a tela dizendo "movimentada com sucesso", e o teste leu isso como ambiente
(prazo estourado esperando a 14). No servidor: "Aprovador" e `managerAprovadoValidacao` vazios — a corrida
medida em 10/09 (`docs/investigacoes/bpmn-desvio-ajustar-informacoes.md`). `CicloCompradorPage` esperava o
"Aprovador"; `CentralTarefasComprasPage.decidirEEnviar` não. Relendo as SCs do dia, a corrida foi perdida em
**2 de 6 envios** (96498 e 96503); as três aprovações que seguiram para a 14 tinham os campos preenchidos.
Corrigido em três pontos:
- a espera virou `aguardarFormularioDeDecisaoPronto()`, um oráculo só, usado pelas duas classes;
- o CT-CMP-04-H e o teste de alçada afirmavam só "saiu da Validação do Gestor", e **aceitavam "Ajustar
  Informações" como aprovação** — agora reprovam;
- o CT-CMP-05-H trata chegar ao lugar errado como reprovação, e só o prazo estourado como ambiente.

Reexecução: CT-CMP-04-H verde (SC 96504, "Distribuição Gestor Orçamentario"); CT-CMP-05-H chegou à 14 (SC 96505).

### Ativar o job de medição automática — investigado ao vivo em 11/09/2026 (~15:40)

O usuário autorizou disparar o job pela conta de automação para entender como levar isso à suíte. Feito
por MCP, com a sessão de `TOTVS-FS`. Conclusões medidas:

**1. A conta NÃO ativa o job automático — e não é limitação a contornar.**
- `POST /ecm/api/rest/ecm/jobscheduler/runJob` (o "executar agora" do agendador) → **500
  `FDNAccessDeniedException` "Sem permissão de acesso ao recurso"**. É perfil de administrador.
- Executar o dataset `dsSync_executeMedicaoAutomatica` pelo endpoint público de dataset → o próprio
  script devolve `error: "Unexpected token: u"` (um `JSON.parse(undefined)` interno) e **não cria nada**. O
  caminho real do job é o `onSync` agendado, não alcançável por essa rota.
- O agendador mostra o job "Medição Automatica - Faturamento" criado hoje 12:17, **sem última execução**,
  próxima marcada para **12/09 03:00**.

**2. Mesmo se rodasse, hoje não abriria nada.** O dataset-fonte `ds_fatcon_get_medicaoAutomatica`
(a lista de contratos a medir no mês) responde **0 linhas**. Sem contrato com "Dia Med Auto" devido, a
rodada — inclusive a das 03:00 — abre zero processos. É o que explica não haver FC aberta no tenant.

**3. Semear faturamento por API FUNCIONA — e é o caminho para a suíte.** Igual à massa de SC:
`POST /process-management/api/v2/processes/wf_faturamento_contratos/start` com `targetState: 0` e um
`formFields` de molde (99 campos, lidos de uma instância existente com `expand=formFields`). Medido: start
200, instância **96509** criada, parou em **88 "Busca Informações do Contrato"** integrando com o ERP
(System:Auto) e **não avançou em ~4 min** — o contrato do molde (00002-2025-3501, comp 09-2026) já tinha
medição (nº 000236), então o ERP não deixa remedir. Para progredir até o fiscal precisa de contrato ×
competência com saldo em aberto. **Cancelável pela conta** (`cancelInstances`, `successCount 1` → CANCELED):
faturamento de massa é seguro de semear, ao contrário da SC integrada antes do E6.

⚠️ **Cuidado do futuro factory de faturamento:** o molde 96437 traz `usuarioSolicitante = "Usuário
Integrador"` e `tipoInicioProcesso = "automático"`. Copiá-los verbatim (como fiz na sonda) faz a FC semeada
se **passar por FC do disparo automático** — exatamente a contaminação de 3 testes registrada na etapa 4. O
factory tem de sobrescrever esses campos com carimbo `QA` e `tipoInicioProcesso = "manual"`.

**4. Os testes do Tracker continuam bloqueados de propósito.** FSWTBC-2158/4804/1934 medem o COMPORTAMENTO
do disparo automático (uma FC por contrato/filial, sem duplicidade). Massa semeada por nós não os substitui
— o objeto do teste é o job, que exige admin e contratos configurados no Protheus. Pré-condição permanente
enquanto o job estiver desligado, confirmado agora por dois motivos independentes (sem permissão de runJob;
fonte com 0 contratos).

**Próximo passo possível (não feito):** um `utils/massa-faturamento-api.js` espelhando `massa-sc-api.js`, com
factory que carimba QA e escolhe um contrato com competência em aberto (`ds_fatcon_get_competencia`), para
alimentar CT-FAT-01-H e os testes de medição por API em vez de pela tela. Depende de achar contrato com saldo
— e das contas de fiscal/CSE (E4) para as etapas seguintes.

### Faturamento "manual" — o que muda por teste

Medido às 14:5x: `wf_faturamento_contratos` tem **0 instâncias abertas** no tenant. As 30 mais recentes estão
canceladas: as do disparo automático (10 e 12/08, às 03h) paradas em "Realizar Medição do Contrato", e a medição
manual da suíte (96437, 10/09) em "Correção".

| Teste | Precisa de | Medição manual serve? | Situação |
|---|---|---|---|
| CT-FAT-01-H (`ciclo-faturamento`) | criar a medição pela tela | **é** a medição manual | executável; pré-condição só quando nenhum contrato tem competência com saldo |
| CT-FAT-02-S1/S3/S4 (`validacoes-faturamento`) | painel de itens em "Realizar Medição do Contrato" | só com o fiscal/CSE do contrato | E4 |
| FSWTBC-2158/4804 e FSWTBC-1934 (`tracker-compras`) | FC aberta pelo **Usuário Integrador** | **não** — o objeto dos chamados é o disparo automático | pré-condição **permanente** enquanto o job estiver desligado |
| FSWTBC-4816 (`fila-faturamento-protheus`, `@bug`) | instância aberta na 182 "Aguarda processamento Fila Protheus" | só se a medição passar do fiscal; a nossa para antes | pré-condição "nenhuma instância aberta" (lido no código; 0 abertas medido) até E4 ou o job |

**Respondido pelo Paulo (15:13):** "manual" = alguém INICIA o Faturamento no Fluig e escolhe fornecedor e
contrato (o caminho do CT-FAT-01-H), muito usado na Cassi. NÃO é disparar o job. A ideia de rodar o job
pontualmente para 1–2 contratos não chega a resolver os dois testes do Tracker (eles medem o disparo
automático em si), e ativar o job não é possível pela nossa conta (acima).

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
| 1 | Lint que aplica as normas | — | **concluída** (11/09) |
| 2 | Todo vermelho com veredito | — | **feita** (11/09); `alcadas-orcamentaria:108` e o typeahead do fluxo da SC reconferidos na etapa 0 |
| 3 | Contrato descoberto por dataset | 0 (reavaliar) | **feita** (11/09) — Faturamento sem a grade; os (a) de planilhas/LGPD seguem para a etapa 6 |
| 4 | Massa por API como fixture | — | **feita** (11/09) — fixtures de SC, livro-razão persistente, relatório de resíduo |
| 5 | Personas | E2, E3, E4 | **mecanismo feito** (11/09) — `compras` verde; as outras 4 em pré-condição até as contas chegarem |
| 6 | Backlog de casos por estratégia | 1–5 (contínuo) | contínuo — nesta rodada, só o CT-CMP-05-H (preparado para o E3); a tranche (a) de planilhas/LGPD segue aberta |
| 7 | Determinismo e CI | 0 | **CI e unitários feitos** (11/09); o `--repeat-each` da suíte inteira espera a linha de base da etapa 0 |
| 8 | Documentação e segurança | — (E7) | **feita** (11/09) — pendem E7 e a skill `cassi-fluig-master`, fora do repositório |

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

### 1.3 — `try` e `.catch` que engoliam erro · 11/09/2026

**Varredura.** Os 31 `try` e os 11 `.catch(() => {})` do plano, e também os ~45 `.catch(() => valor)`
(`false`, `null`, `''`), que são a mesma classe e o plano não contava. Os 11 `.catch(() => {})`
descartam só uma **espera** (tooltip sumir, primeira linha da grade, `load`), e a leitura seguinte é
que decide — ficam. Os `try` em volta de `JSON.parse`/`text()` guardam um fallback e o status é
afirmado depois — ficam. **Cinco pontos engoliam erro:**

| Onde | O que acontecia | Correção |
|---|---|---|
| `ciclo-faturamento:92`, `validacoes-faturamento:84` | O laço "tenta o próximo contrato" engolia **qualquer** erro e o transformava em pré-condição. E a anotação `pre-condicao-ausente` da tentativa descartada ficava no teste: se o contrato seguinte servisse e o teste reprovasse depois, o gate lia a anotação e dizia "ambiente" | `tentarComAlternativa` (`utils/pre-condicao.js`): relança o que não é pré-condição e retira a anotação da tentativa descartada |
| `aprovacoes-solicitacao-compras:514` | `toPass` dentro de `try` com `catch` vazio, seguido de `isVisible()` instantâneo decidindo o veredito | Um polling só, com as duas condições; a falha carrega a atividade lida |
| `MedicaoContratoPage#aguardarIndiceDaOpcao` | `expect.poll(...).catch(() => undefined)` — assertion descartada, e o chamador relia a lista para a mensagem | `toPass` com as opções da última leitura na mensagem; uma exceção de lint a menos |
| `processos-administrativos-usuario-comum:97/105` | `expect.soft(await isVisible().catch(() => false))` logo após o `goto`: "Enviar não deve estar visível" podia passar com o formulário ainda montando, e o `catch` transformava violação de strict mode em `false` | Espera o desfecho (diálogo **ou** Enviar) e afirma com `toBeVisible`/`toBeHidden` |

De brinde: em `validacoes-faturamento` o bloco "Chamados cobertos" tinha ido parar dentro de um cast
`@type`; voltou para o cabeçalho (onde `gerar-cobertura` o reconhece do mesmo jeito).

**Prova de FAIL.** Spec temporário, apagado depois:
- **Gate:** a mesma falha real depois de uma tentativa descartada. Com o padrão antigo o gate classificou
  "pré-condição ausente"; com `tentarComAlternativa`, "regressão". Pré-condição descartada devolve o
  motivo sem deixar anotação; erro comum é relançado intacto.
- **Bloco de alçada** (cópia fiel sobre página estática, com o `CentralTarefasComprasPage` real): passa
  com a atividade avançada, passa com a mensagem de alçada, **reprova** parado em "Validação do Gestor",
  com `Atividade atual lida na tela: "Validação do Gestor"` na mensagem.

**Execução real.**
- `npm run typecheck` e `npm run lint` limpos.
- `processos-administrativos-usuario-comum` antes e depois: os mesmos 3 vermelhos `@bug` por teste, com
  as mesmas mensagens.
- `validacoes-faturamento`: pela primeira vez passou da página do Acompanhamento. **S1 verde**
  atravessando `tentarComAlternativa` e o polling novo do zoom; S3 verde. S2, S4 e FSWTBC-2143 pararam
  **antes** do código tocado — timeout cru em `AcompanhamentoContratosPage:102` (grade) e em
  `massa-medicao:138` (dataset). Vão para a etapa 2.
- `aprovacoes` alçada (destrutivo): pré-condição — a SC 96485 não ficou assumível em 180 s (233 lenta).
  O bloco novo não foi alcançado na execução real; está provado pela cópia acima. Sem resíduo: parada
  na 233, sem `numSolCompra`, a SC foi cancelada pelo teardown (`CANCELED` conferido no servidor).
- `ciclo-faturamento` **não executado**: destrutivo (cria medição), mesma troca que o S1 exercitou, e a
  grade do Acompanhamento estava estourando no mesmo horário.

**Entradas para a 1.4** — leituras instantâneas que decidem algo, achadas nesta varredura. Atenção às
três primeiras: `isVisible({ timeout })` **ignora** o `timeout` (a opção está depreciada e não espera).
- `MedicaoContratoPage:395` — `isVisible({ timeout: 8000 })` decide "sem erro de saldo" num instante.
- `CentralTarefasComprasPage:87` — `isVisible({ timeout: 10_000 })` decide se clica a aba de pool.
- `aprovacoes-solicitacao-compras:631` — `isVisible({ timeout: 5_000 })` decide o ramo do teste.
- `DependentesPage:80`, `PoolTarefasPage:242`, `validacoes-faturamento:357`.

### 1.4 — leituras instantâneas · 11/09/2026

**Varredura.** 100 leituras (`isVisible`, `count`, `isChecked`, `evaluateAll`, `allInnerTexts`…) em 45
arquivos, classificadas pelo que alimentam: ~45 dentro de polling ou depois de espera pelo mesmo estado,
~30 auxiliares cujo chamador já espera, e o resto decidindo veredito, pré-condição ou ramo logo depois
de navegação ou clique.

**Dois vereditos de "ambiente" eram falsos, havia dois dias:**

| Teste | Dizia | Medido com espera |
|---|---|---|
| `CT-E2E-07-H`, `-08-H`, `-09-H`, `portal-comprador:63` | PRÉ-CONDIÇÃO: "o seletor 'Atuar como' não é renderizado" (desde 09/09) | o seletor aparece e a delegação troca de sessão — **os 4 verdes** |
| `CT-DEP-02-S1` | PRÉ-CONDIÇÃO: "montou 0 campos sem exibir o bloqueio" (desde 10/09) | a mensagem de titular sem matrícula aparece em ~7,6 s, com 0 campos — **verde** |
| `ciclo-cotacao:170`, `negociacao-proposta:133` | `toHaveCount(0)` no "Atuar como" — ausência afirmada antes de a tela renderizar | agora tentam a delegação e esperam a grade: **as filas seguem vazias com a delegação**. A pré-condição fica, com a causa certa: nenhuma SC chega à cotação (E3) |

Consequência: **"Atuar como" não é bloqueio**, e o E2 abaixo foi reescrito. O item 2 da mensagem ao
desenvolvedor de 11/09 (13:28) — "o Atuar como e as filas do Portal do Comprador não aparecem" — está
errado pelo mesmo motivo.

**Corrigidos** (espera pela condição, sem mudar o que se afirma):
- `isVisible({ timeout })`, que ignora o prazo: `MedicaoContratoPage` (erro de saldo, 8 s),
  `CentralTarefasComprasPage.abrirTarefasEmPool` (10 s, e agora espera o primeiro grupo — o `@achado` da
  Validação Orçamentária podia passar por acaso), `aprovacoes:628` (ramo da Validação dos Compradores).
- Combo lido quando visível, antes de popular: `sigajuri-contrato` (como o Consultivo),
  `portal-comprador:86` (`nth(1)` esperado), `SolicitacaoCompraModal.listarTiposDisponiveis`.
- Leitura logo depois de clique ou troca de URL: `PortalCompradorPage.expectSeletorAtuarComoDisponivel`
  (espera grade, estado vazio ou o seletor), `portal-comprador` FSWTBC-3715 (cabeçalhos e rótulos por
  polling), `DependentesPage.lerDesfechoDaIdentificacao`, `CicloCompradorPage.possuiDados`
  (`esperarLinhasReais`).
- Grade velha lida depois da resposta: `DocumentosPage.voltarParaRaiz` e `alterarResultadosPorPagina`
  (overlay do jqGrid), `navegacao-documentos` (a comparação "antes = depois" passava com a grade velha).
- `DocumentosGedPage.restaurarDaLixeira`, **medido por trace**: o clique sempre pede confirmação e só o
  Confirmar dispara `POST /recycleBin/restoreDocument/`. Espera o botão e afirma a resposta.
- `gestao-equipes:140` (polling — com o produto corrigido, o `@bug` reprovaria se o conteúdo chegasse um
  instante depois) e `smoke-integracao-erp` (esperar-e-seguir nas linhas do Tracker).

**Ficam, com motivo:** `abrirMaisOpcoesSePresente` e `buscarProcesso` (errar o ramo dá timeout, não
veredito errado); `delegacao-fiscais` e `sigajuri-contencioso` (formulário estático e handler síncrono,
lidos depois de um campo visível); `CentralTarefasPage.expectComSolicitacoes` (depois de 20 s de espera
pela lista); `modais-do-contrato` (`abrirPlanilhas` já espera o rodapé); `grade-contratos`,
`acesso-portal`; leituras que só alimentam anotação.

**Execução.** `typecheck` e `lint` limpos. Verdes: `portal-comprador` (6 de 7 — o 7º é `@bug`),
`ciclo-comprador` 07/08/09-H, `smoke-integracao-erp`, `navegacao-documentos` (4), `lixeira-documentos`
(destrutivo), o `@achado` da Validação Orçamentária, `dependentes`. Vermelhos pelo motivo certo:
`sigajuri-contrato` `@bug` (agora com as opções na mensagem), `gestao-equipes:127` `@bug` pelo polling,
`ciclo-cotacao` e `negociacao-proposta` em pré-condição, com a delegação tentada.
**Não executado:** `aprovacoes:596` (pool de Validação dos Compradores vazio), `modal-solicitacao-compra`,
`ciclo-faturamento` e `validacoes-faturamento` com a espera do erro de saldo — dependem do Acompanhamento
e entram na reexecução do E1.

### 1.5 — polling no servidor com `expect.poll` · 11/09/2026

**O que mudou.** Os três laços `while` + `setTimeout(5000)` dentro de `page.evaluate` saíram.
`utils/estado-da-solicitacao.js` ganhou `lerTarefas`, `lerCamposDoFormulario` e
`aguardarEstadoNoServidor` — polling com `expect.poll`, e prazo estourado vira pré-condição com a última
leitura. No `ciclo-faturamento` o prazo estourado é reprovação de roteamento, então lá o `expect.poll` é a
própria assertion.

**Verde falso encontrado ao validar.** A execução real do teste de SLA (FSWTBC-4156) passou registrando
"Grava SC e Anexos levou 1s", com a SC ainda na 233 e sem número no ERP. O critério "existe tarefa 233
COMPLETED" — o mesmo nos dois testes, antes e depois da migração — aceita o primeiro movimento da 233, que
fecha em 0–1 s enquanto um segundo segue integrando (SCs 96487, 96458, 96461). Consequências:
- o SLA medido era sempre ~1 s: **o teste nunca podia reprovar**;
- o `@bug` FSWTBC-621 lia o número antes de a integração terminar. O vermelho de 10/09 (SC 96458,
  "concluiu sem número") **não era o defeito** — corrigido em `docs/execucoes/relatorio-destrutivos-2026-09-10.md`.
  A medição de 08/09 citada no teste ("3 de 14 voltaram vazias") fica sob suspeita e precisa ser refeita.

Critério novo: `saiuDaIntegracao` (há tarefa humana aberta) e `medirIntegracao` (da entrada na 233 à
primeira tarefa humana — 29 s na SC 96474, 1.221 s na 96456, o "1.220 s" do relatório de 10/09).

**Testes unitários** (antecipa a etapa 7): `npm run test:unit`, com `node:test` e sem dependência, usando
as leituras reais das três SCs como oráculo. Prova de FAIL: com o critério antigo, o caso da SC 96487
reprova.

**Execução.** `typecheck`, `lint` e unitários limpos. Spec temporário contra o servidor: estado alcançado
devolve as tarefas; estado inalcançável vira pré-condição com a última leitura; instância inexistente leva
o motivo (404). Os dois destrutivos da SC rodaram às 13:07 e 13:13 e deram **pré-condição** — a integração
passou de 200 s nas duas (SCs 96489 e 96490, canceladas pela limpeza). Com o critério antigo, o de SLA
teria passado e o `@bug` teria reprovado. O caminho verde não foi observado nesta janela;
`ciclo-faturamento` não executado (depende da grade do Acompanhamento).

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

### Andamento — 11/09/2026

| Item | O que foi feito | Execução |
|---|---|---|
| `ciclo-cotacao:170` | pré-condição depois de tentar a delegação (§1.4) | pré-condição, com a delegação tentada |
| `sigajuri-consultivo` CT-JUR-01-S1 | o `waitForResponse` estourado agora relança dizendo que o que faltou foi o `POST workflowView/send` | **verde** hoje — o timeout de 10/09 foi ambiente |
| Typeahead "Classe Valor" (`atribuicao-comprador`, fluxo da SC) | sem sugestão nenhuma em 15 s → pré-condição (a consulta ao ERP não voltou); sugestões sem a esperada → falha com a lista | não executado: depende do fluxo da SC, e a 233 estava degradada |
| `alcadas-orcamentaria:108` | o `waitForFunction` de 10/09 já tinha sido trocado pelo oráculo com veredito (correção 1 do relatório dos destrutivos) | não executado, pelo mesmo motivo — fica para a etapa 0 |
| `Failed to fetch` | `utils/rede.js` — `repetirSeFalhaDeRede`: repete só falha de TRANSPORTE, sobe na hora qualquer outro erro, sobe intacto depois da última tentativa; nunca para escrita. 3 testes unitários. Adotado nos 5 specs em que apareceu (`rastreabilidade-rdfc`, `alcada-solicitacao-compras` ×2, `nomes-de-atividades-sc`, `fila-faturamento-protheus`, `rejeicao-documento`). `erros-de-console:176` fica: ali o `Failed to fetch` é erro de console da própria página | `rastreabilidade-rdfc` e `nomes-de-atividades-sc` verdes; `fila-faturamento` em pré-condição (sem medição aberta — o disparo automático não roda, confirmado pelo desenvolvedor) |
| `banco-horas` CT-BH-01-S2 | a queda é **simulada** (`BancoHorasPage.simularProtheusFora`). Lendo o JS do widget: a consulta ao Protheus é `POST /api/public/2.0/authorize/client/invoke`, e o aviso "base offline" é o `cbError` dela. Derrubar datasets **não** reproduz o aviso — os três foram derrubados, e a tela sempre mostrou "nenhuma divisão para sua matrícula", o ramo de sucesso vazio | **verde**; sem a simulação reprovava (execução das 13:25) |
| `FSWTBC-4503` | 500 do `dsProtheus_getFiscaisPorTipoContrato` → pré-condição enquanto o E1 não termina | pré-condição; os outros 3 do arquivo verdes |
| `FSWTBC-4952` | → E5 | — |
| `admissao:37` (e `dependentes`, `substituicao-cargos`) | a anotação manual usava o tipo `pre-condicao-ausente` para documentar OUTROS casos — e o gate classifica como ambiente qualquer teste reprovado que a carregue. Tipo próprio: `casos-bloqueados-pela-mesma-causa` | `admissao` `@bug` vermelho pelo defeito; `dependentes` verde |
| Gerência de Compras | o `@achado` virou **`@bug`**: a grade lista processo CANCELADO como pendente. README atualizado (a linha "a tabela nunca renderiza dados" não valia mais) | vermelho pelo defeito: 17 processos encerrados na aba Atribuir |

**Achados ao fechar a etapa:**
- **`FSWTBC-5118` era um vermelho sem veredito desde 09/09** — tarefa de *Aprovação de Alçadas* no grupo
  `G.P.Requisicao_de_Compras_Validacao_Alcadas`. É o defeito nº 6 do mapa, e a análise de 10/09 já recomendava a
  tag. Agora `@bug`; o gate passou de "regressão" a "conhecido".
- **Terceira pré-condição falsa por leitura instantânea:** o `@achado` de Substituição de Cargos caía em
  "não renderizou campo de substituto" em ~4 s desde 10/09. Com espera pela validação da identificação, está
  **verde** — "funcionário não localizado", 16 campos de substituto no DOM, 0 acionáveis.

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

### Andamento — 11/09/2026

**Fonte nova, `utils/contratos-por-dataset.js`.** `dsProtheus_getBranches_restGetAll` (71 filiais) →
`dsProtheus_getContratos_restGetAll` com `CorporateId=01` + `BranchId`; vigente é `CN9_SITUAC = 05`, uma
linha por contrato (a de maior revisão), fornecedor de `CN9_XCODFO`/`CN9_XLOJAF` — nenhum dos 564
vigentes veio sem eles. O mapeamento é função pura, com 3 testes unitários.

**O custo decidiu o desenho.** Medido: 71 filiais em **149,5 s** com 8 consultas simultâneas; a mais lenta,
56 s com 22 linhas (a 5303, com 960, levou 35,8 s sozinha) — o custo é do servidor, não do volume. Varrer
por teste é inviável: a varredura roda uma vez, sob exclusividade entre workers, grava
`playwright/.cache/contratos-vigentes.json` e vale por 6 h (`CONTRATOS_CACHE_HORAS`). Quem encontra o cache
frio ganha 240 s no timeout. Varredura sem vigente nenhum é pré-condição e não grava cache.

**`utils/massa-contratos.js`: duas fontes, uma escolha.** O núcleo `escolherEReservar` (afinidade por hash +
reserva) serve às duas; a checagem de número inequívoco na busca só vale para a grade. Novas:
`descobrirContratoVigentePorDataset` e `descobrirContratosVigentesPorDataset`. A anotação
`contrato-escolhido` diz a fonte, e `contratos-varredura-parcial` aparece quando alguma filial não respondeu.

**Migrados:** `ciclo-faturamento` e `validacoes-faturamento` — os 5 testes da classe (a) de Faturamento em
`docs/investigacoes/contratos-rota-alternativa.md` §6. Não abrem mais o portal de Acompanhamento.
**Não migrados, de propósito:** `acompanhamento-contratos/*` age sobre a grade (classe b). Os demais (a) da
investigação — planilhas e fiscais como teste de dado, e o LGPD por outro veículo — mudam o que o teste
prova; vão para a etapa 6.

**Execução.** `typecheck`, `lint` e 10 unitários limpos. Com o cache apagado:
- `FSWTBC-2143` **verde** em 155 s, varredura fria incluída — 268 rótulos em 4 contratos de 3 filiais
  (5303, 3102…), escolhidos por dataset; 0 malformados.
- `CT-FAT-02-S2` escolheu 4 contratos por dataset (filiais 5303 e 4306) e terminou em pré-condição legítima:
  nenhuma competência recusada na amostra.
- O consumidor da grade conferido (`modais-do-contrato:206`) estourou em `expectCarregada` — a grade não
  chegou a "Mostrando" em 45 s, **antes** da descoberta. É o portal de Acompanhamento instável hoje (o mesmo
  ponto falhou às 13:05), e é exatamente a dependência que os testes de Faturamento deixaram de ter.

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

### Andamento — 11/09/2026

**Massa por API, em fixture.** `utils/massa-sc-api.js`: `criarScPorApi` (`POST /start` com
`targetState: 0`, factory `criarMassaSolicitacaoCompra`, pré-condição quando o motor não devolve a
instância, anotação `sc-criada`), `criarScNoPoolDoGestor` (espera NO SERVIDOR a SC sair da integração e
confere que caiu na atividade 7 — Correção ou "Ajustar Informações" viram pré-condição com o motivo) e
`criarEAssumirNoPoolDoGestor` (assume pela tela de detalhe, deixando a decisão aberta). Fixtures
`solicitacaoNoPool` e `solicitacaoAssumida` em `fixtures/fixtures.js`, com timeout próprio de setup.

**Migrados:** `aprovacoes-solicitacao-compras` (04-H e 04-S1 pela fixture; a alçada pelo util, com
500 × R$ 50.000 — saíram 256 linhas de preenchimento do formulário), `acoes-da-tarefa` (07-H e 08-H) e
`assumir-tarefa-pool`, cuja pré-condição dizia que a automação não conseguia criar massa de pool (falso
desde 10/09). O formulário segue exercitado onde é o comportamento (`ciclo-solicitacao-compras`,
`validacoes-solicitacao-compras`).

**Execução, 13:58–14:25** — só a criação pelo formulário levava ~4 min:

| Teste | Resultado | Duração | SC |
|---|---|---:|---|
| CT-TSK-07-H (Somente salvar) | verde | 57 s | 96492 |
| CT-CMP-04-H (aprovar) | verde | 74 s | 96493 |
| assumir-tarefa-pool | verde | 79 s | 96494 |
| CT-TSK-08-H (transferir) | verde | 66 s | 96495 |
| alçada (500 × R$ 50.000) | verde — o polling reescrito na 1.3 rodou de verdade | 61 s | 96497 |
| CT-CMP-04-S1 (reprovar) | pré-condição na 1ª (a tela não confirmou), verde na 2ª | 60 s | 96496, 96498 |

**Achado — o silêncio da tela era classificado sem o servidor.** `abrirDetalheAposConfirmacao`
declarava pré-condição sempre que a tela não confirmava em 60 s. Na SC 96496 a reprovação tinha sido
gravada, mas o mesmo ramo diria "ambiente" para um Enviar que nunca chegou. Agora ele recebe o número do
processo e compara o movimento da tela (`app_ecm_workflowview_currentMovto`) com a tarefa pendente no
servidor. **Prova por injeção:** envio abortado → falha real ("não movimentou, mesmo movimento 4", SC
96499; o gate diz regressão); envio que chega com a resposta retida → pré-condição com a evidência
("movimento 4 superado, atividade 14", SC 96500).

**Achado — o livro-razão não sobrevivia.** `test-results/criados.jsonl` é apagado pelo Playwright a
cada invocação: só a última ficava, e o resíduo das fatias anteriores sumia do `limpar-massa`. Agora em
`playwright/.massa/criados.jsonl`, com o caminho num lugar só (`utils/livro-razao.js`: fixture, teardown,
`limpar-massa`, relatório) e ignorado pelo git. Provado: a linha da SC 96502 sobreviveu a uma segunda
invocação.

**E6 corrigido no ambiente.** O `@bug` `cancelamento-sc-integrada` ficou verde (SC 96501, `SUCCESS`), e o
teardown cancelou as 9 SCs de massa do dia, todas com `numSolCompra` e sem cotação — até a manhã de 11/09
elas eram recusadas. A tag saiu (README, CLAUDE.md). Observação para o desenvolvedor: o Nº SC do ERP
passou a se repetir entre SCs canceladas (`000976` em quatro).

**Relatório de resíduo:** `npm run residuo` (`scripts/residuo-de-massa.mjs`) lê os dois livros-razão e
classifica cada SC no servidor. Hoje: 14 SCs de massa semeada em 10/09 abertas no ERP sem cotação
(canceláveis desde a correção), 4 abertas canceláveis e 1 encerrada.

**"Factory de faturamento":** não existe factory que copie `usuarioSolicitante`. A FC 96437 veio do
`ciclo-faturamento` pela tela, e o formulário de medição não tem campo carimbável na etapa Início (34
campos, 0 editáveis); a trilha é a anotação `medicao-criada`. Item encerrado sem código.

---

## Etapa 5 · Personas

**Por quê.** Quatro perfis represam a maior parte do backlog (E2, E4). A conta única também trava a
Validação Orçamentária (E3).

**O que mudar.** `storageState` por persona gerado no `globalSetup`, credenciais em variável de
ambiente e segredo do CI, fixture `persona('comprador')`; sem credencial, pré-condição — nunca skip.

**Pronto quando.** Um teste de cada persona rodar com a conta própria.

### Andamento — 11/09/2026

**Mecanismo.** `config/personas.js` cataloga cinco personas — `compras` (a conta atual), `comprador` (E2),
`fiscal`, `cse` e `gestorAlcada` (E4) —, cada uma com o par `QA_<PERSONA>_USERNAME`/`_PASSWORD`
(`.env.example`, segredos do CI). O `globalSetup` autentica as que têm credencial e grava a sessão em
`playwright/.auth/persona-<nome>.json`, apagando antes a sessão e o erro da invocação anterior; login de
persona que falha não aborta a execução, grava o motivo e a fixture o relança como erro real. A fixture
`persona(nome)` abre um contexto com a sessão; sem credencial, **pré-condição citando o pedido**. O Portal do
Fornecedor fica fora: autentica por CNPJ/senha próprios, não por `storageState`.

**Oráculo de identidade.** O título da Home prova que há sessão, não de quem. `GET
/api/public/2.0/users/getCurrent` devolve `content.login` da sessão (`findLoggedUser` e `getCurrentUser`
respondem 500). `tests/e2e/plataforma/personas.spec.js` tem um teste por persona.

**Execução:** `compras` verde em 7 s; as outras quatro em pré-condição com a variável e o pedido; o veredito do
gate lê 1 ok e 4 pré-condição, sem regressão. **Provas de que reprova:**
- credencial presente com senha errada → `globalSetup` registra o erro e o teste falha como erro real, não
  como ambiente;
- login diferente do da sessão → a assertion reprova. Na mesma prova, a persona configurada como `totvs-fs`
  **autenticou** e o servidor devolveu `TOTVS-FS`: o login do Fluig ignora caixa, e a comparação passou a
  normalizar — sem isso, credencial correta digitada em minúsculas reprovaria como sessão de outra pessoa.

**Falta para "pronto":** as contas (E2, E4). O substituto do gestor orçamentário (E3) não é persona — é a mesma
conta com permissão a mais; ver "Retorno do desenvolvedor" abaixo.

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

### Andamento — 11/09/2026

**Unitários — `npm run test:unit`, 24 testes, sem navegador, ~1 s.**
- A regra do gate saiu de `veredito-do-gate.mjs` para `scripts/classificacao-do-gate.mjs`; o script ficou só com
  leitura, gravação e impressão. 9 testes cobrem:
  - a precedência (`@bug`/`@achado` antes de tudo);
  - a anotação presente só no resultado que falhou;
  - verde com anotação continua verde;
  - "PRÉ-CONDIÇÃO AUSENTE" escrito à mão, sem a anotação, é regressão;
  - relatório vazio e "No tests found" bloqueiam.
- O CLI refatorado foi conferido ponta a ponta no relatório real das personas: 1 ok, 4 pré-condição, exit 0.
- `unit/massa-e-limpeza.test.mjs`:
  - `ehRecusaTransitoria` com as mensagens literais do servidor;
  - a factory de massa: valor total = quantidade × preço em 200 gerações, o override da alçada
    (`25.000.000,00`), carimbo único e rateio fechando 100%.
- `duracaoDaIntegracao` com as leituras reais que já eram oráculo de `saiuDaIntegracao`.

**CI (`.github/workflows/e2e.yml`).**

| Item | Antes | Agora | Por quê |
|---|---|---|---|
| cron | `0 6 * * 1-5` (03:00 BRT) | `30 9 * * 1-5` (06:30 BRT) | 03:00 é dentro da carga da medição automática do Protheus (01:00 → 04h–05h) |
| timeout da regressão | 30 min | 45 min | 190 testes; verde mediana 13 s, p90 25 s; ~20 min com 3 workers num dia bom |
| `--shard` | — | **não** | cada shard traz 3 workers: 3 shards = 9 sessões, e o tenant degrada acima de 3 (79 timeouts com 8, 09/09) |
| retries | 2 (config, `CI`) | regressão `--retries=1`; defeitos conhecidos `--retries=0`; destrutivos já `0` | um retry separa flaky de regressão; o segundo só repetia pré-condição, que é determinística |
| unitários | — | passo `npm run test:unit` antes do navegador | falha de regra do gate aparece em segundos |
| personas | — | segredos `QA_<PERSONA>_*` no `env` do workflow | etapa 5; segredo ausente = pré-condição |
| comentários | "62 `@bug`", "8 `@achado`" | 69 e 10 (11/09) | |

**Falha de rede na criação de massa.** O CT-CMP-04-S1 morreu em 720 ms com `Failed to fetch` no `/start` e o
gate leria como regressão da reprovação. `criarScPorApi` não repete (é escrita), mas classifica: falha de
transporte vira pré-condição de infraestrutura com a marca da massa; qualquer outro erro sobe. Provado por
injeção (rota abortada no cliente, sem SC criada); na reexecução, 04-S1 e alçada verdes (96508, 96507).

**Não feito, e por quê:**
- `--repeat-each=3` nos 190 não destrutivos: sem a linha de base da etapa 0, mede o Protheus, não a suíte. Foi
  feita uma amostra dirigida aos testes corrigidos hoje (abaixo).
- Unitários de `gerar-cobertura`: pendente.
- Histórico do CI e se o runner alcança o tenant: não verificável daqui (sem `gh`).

**Amostra de determinismo — 15:07, `--repeat-each=3 --workers=3`**, nos testes de leitura corrigidos hoje
(personas, Dependentes CT-DEP-02-S1, Substituição de Cargos `@achado`):

| Teste | 3 repetições |
|---|---|
| Dependentes CT-DEP-02-S1 | verde, verde, verde |
| Substituição de Cargos `@achado` | verde, verde, verde |
| personas `comprador`, `fiscal`, `cse`, `gestorAlcada` | pré-condição nas 3 (mesma mensagem) |
| persona `compras` | **falhou, falhou, verde** |

As duas falhas foram `page.goto: net::ERR_NETWORK_CHANGED`, às 15:07:33 e 15:07:37, no primeiro `goto` do teste.
É a mesma janela do `Failed to fetch` no `/start` das 15:03: **mudança de rede na máquina que executa**, não
lógica do teste nem o tenant. Repetido isolado logo depois (`--repeat-each=6`): **6 de 6 verdes**, 3–4 s cada.
Não é flaky da suíte. Se `ERR_NETWORK_CHANGED` aparecer no CI, classificar ESSE erro como infraestrutura. Uma
classe genérica de "rede" ficou de fora de propósito: `ERR_CONNECTION_RESET` pode ser o WAF, e aí é comportamento.

**A correção da corrida do formulário, conferida no servidor** — as quatro SCs da reexecução:

| SC | Decisão | "Aprovador" | `managerAprovadoValidacao` | Foi para |
|---|---|---|---|---|
| 96504 (04-H) | aprovar | preenchido | `Aprovado` | 14 |
| 96505 (CT-CMP-05-H) | aprovar | preenchido | `Aprovado` | 14 |
| 96507 (alçada) | aprovar | preenchido | `Aprovado` | 14 |
| 96508 (04-S1) | reprovar | preenchido | `Reprovado` | 11 |

---

## Etapa 8 · Documentação e segurança

- Afirmações desatualizadas: "554 vigentes" (`CLAUDE.md`, `README.md`); `docs/estado-do-gate.md`
  (03/09, ambiente anterior); `caixade182374` em `docs/mapa-do-ambiente.md` e
  `docs/catalogo-casos.md`; menções ao `WFLYEJB0054` (não existe mais); linha "Aba Atribuir nunca
  renderiza" no README; skill `cassi-fluig-master` com o domínio antigo e a afirmação de que "até SC
  presa é cancelável", que agora tem exceção.
- E7.

### Andamento — 11/09/2026

| Afirmação | Onde | O que foi feito |
|---|---|---|
| "554 vigentes" | `CLAUDE.md`, `README.md`, `docs/politica-de-escrita.md`, `utils/exclusividade.js`, `criacao-solicitacao.spec.js` | **564**, da varredura das 71 filiais de 11/09. As medições DATADAS de 30/08 (`massa-contratos.js:160`, `criacao-de-contrato-inviavel.md`, investigações) ficaram: são registro do que se mediu naquele dia |
| portal "não publicado", "54 testes" | `CLAUDE.md` item 2; `AcompanhamentoContratosPage.js`; canário | publicado em 11/09, 4 dos 6 datasets (conferido às 14:47); o Page Object cita 64 (contagem de 10/09); o canário, 55 (`--list` do diretório hoje) |
| `docs/estado-do-gate.md` de 03/09 | topo do documento | aviso de que tudo abaixo é do ambiente anterior + composição da suíte hoje (301 testes, 69 `@bug`, 10 `@achado`, 53 `@destrutivo`, 190 no escopo do gate) + durações medidas |
| `caixade182374` | `docs/catalogo-casos.md` | aviso no cabeçalho. `docs/mapa-do-ambiente.md` já abre com a troca de ambiente, e as demais menções são históricas (relatórios, investigações) |
| `WFLYEJB0054` "hoje" | `factories/massa-solicitacao-compra.js` | passado, "até 10/09/2026". As outras menções já são medições datadas ou condicionais |
| "Aba Atribuir nunca renderiza" | `README.md` | já não existe no README |
| Personas | `CLAUDE.md` | seção nova, com a regra de pré-condição e o oráculo de identidade |

**Fora deste repositório, não editado:** a skill `cassi-fluig-master` descreve o domínio antigo. A exceção ao
"até SC presa é cancelável" (E6) deixou de valer com a correção de 11/09, então aquela frase voltou a ser
verdadeira. **E7** (troca da senha da conta de QA) segue com o dono da conta.
