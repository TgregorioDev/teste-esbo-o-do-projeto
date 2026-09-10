# Como popular a massa que falta — investigação de 10/09/2026

Pergunta: cada um dos cinco vermelhos "fila vazia" da última execução pode ser destravado
criando a massa **do nosso lado**? Para cada um: o caminho concreto, a evidência crua e um
veredito honesto. Tudo aqui foi **executado** contra `caixade213859` com a conta `TOTVS-FS`
em 10/09/2026, salvo onde está escrito "não medido".

Serviço do ERP no início da investigação:
`GET /api/public/2.0/authorize/client/test?serviceCode=apiRESTProtheusCompras` →
`content.description = "apiRESTProtheusCompras:SUCCESS"`.

Massa criada nesta investigação (fica viva, marcada `QA-MASSA`): ver seção 6.

**Resumo dos vereditos**

| # | Vermelho | Veredito | O que falta, e de quem depende |
|---|---|---|---|
| 1 | FC do Usuário Integrador no Tracker | **VIÁVEL** (FC 96437 nasce por API e aparece `ABERTA / Usuário Integrador`); medição (`tests/e2e/contratos/*`) **NÃO DETERMINADO** | a atividade 88 precisa achar o contrato no Protheus desta base — contrato/serviço de Contratos: administrador do Protheus |
| 2 | SIGAJURI, combo UF vazio | **não é massa** — corrida de leitura no page object | ajuste em `SigajuriPage.listarOpcoesReais` (esperar o combo antes de `evaluateAll`) |
| 3 | Minhas solicitações sem atrasada | **VIÁVEL com espera** (SLA 24 h em 233/236/124; 96 h em 7/14) | `/start` recusa `deadlineDate`; alterar prazo exige gestor do processo |
| 4 | Portal do Comprador / Controle de Cotações | **INVIÁVEL do nosso lado** (premissa "202 troca de senha" obsoleta: hoje o ERP nem é consultado; chamado direto, `/java_portal_comprador_v1/…/genericQuery` responde **401**) | `Y1_USER` para a conta (e-mail `fabricasoftware@totvs.com.br` no SY1) e cotação na SC8 — administrador do Protheus |
| 5 | Gerência de Compras (257) | 7 **VIÁVEL e provado**; 14 **INVIÁVEL** com a conta (tarefa nominal do gestor do CC); rota "sem gestor" **não existe** (seção 7) | aprovação de Erlon Cesar Dengo nas 6 SCs paradas na 14, ou titularidade de CC no ERP para a conta |

---

## 1. Faturamento / Medição de Contrato (FC)

**Vermelho:** "nenhuma FC aberta pelo Usuário Integrador no mês corrente nem no anterior"
(`tests/e2e/portais/tracker-compras.spec.js`, `tests/e2e/contratos/*`).

### Como uma FC nasce

- O processo é `wf_faturamento_contratos` ("Faturamento de Contratos"), categoria Contratos,
  **publicado** (`GET /process-management/api/v2/processes` lista 34 processos, ele entre eles).
- Toda FC da base foi aberta pelo requester `consumerkeycompras` ("Usuário Integrador Fluig"),
  em lote, às ~03:04 dos dias 10 e 12/08/2026 — é o disparo mensal automático. **Todas estão
  `CANCELED`** (canceladas em bloco em 09/09/2026 10:25);
  `GET /requests?processId=wf_faturamento_contratos&status=OPEN` → **0 itens**.
- Desenho, lido de `GET /processes/wf_faturamento_contratos/activities?pageSize=50` (a
  chamada com `pageSize=1000` cai com *Failed to fetch* — use página pequena):

  ```
  4 Início → 88 Busca Informações do Contrato → 95 Aprovação Prévia? → 20 Inibir Aprov. Fiscal?
    → 25/28 Realizar Medição do Contrato (tarefa humana, SLA ~39h, atribuída ao fiscal nominal)
  ```

- O Tracker (visão *Faturamento de Contratos*) lê o dataset SQL
  `dsFluig_getProcFaturamentoSql_CASSI` — a coluna **"Solicitante" é o campo de formulário
  `usuarioSolicitante`**, não o requester da instância. Isso importa: o valor é nosso para
  escolher.

### Iniciar por API — FUNCIONA

Molde: `GET /process-management/api/v2/requests/96310?expand=formFields` (99 campos; uma FC
do disparo de 12/08, contrato `00002-2025-3501`, fornecedor `04727313/0001`, competência
`08-2026`, `tipoInicioProcesso = "automático"`, `controlField = "GRAVA_MED"`).

```
POST /process-management/api/v2/processes/wf_faturamento_contratos/start
{ "targetState": 0, "targetAssignee": "", "comment": "QA-MASSA-FC-… — massa de dados",
  "formFields": { …os 99 campos do molde, sem documentid/cardid/version/numProcesso/tableid/companyid,
                  usuarioSolicitante: "Usuário Integrador", zoomCompetencia: "09-2026",
                  medContrCompetencia: "09/2026", dataSolicitacao: "2026-09-10",
                  campoDescritor: "Fat. Contrato - 00002-2025-3501 - QA-MASSA-FC-…",
                  todos os campos email* = fabricasoftware@totvs.com.br } }
→ 200 { "processInstanceId": 96437, "nextState": 88, "cardId": 632388, "processVersion": 35 }
```

Os e-mails foram trocados de propósito: o molde traz endereços reais de fiscal, aprovador e
**fornecedor externo** (`financeiro@termipest.com.br`); massa não deve notificar gente de fora.

Resultado no Tracker (`#filterTipo = Faturamento de Contratos`, `#numProcesso = 96437`, e
também por período 01/09–10/09):

```
96437  ABERTA  Usuário Integrador  10/09/2026 12:00:00  Busca Informações do Contrato  System:Auto
       MICHELLE MATEUS FALCIANO  3501  3501 - UNIDADE CASSI SAO PAULO - SP
```

Ou seja: o filtro do teste (`/integrador/i` no Solicitante e status ≠ CANCELADA) **já casa**
com a FC semeada.

### Onde parou

`GET /requests/96437/tasks`, ao longo da tarde:

```
14:28:29  mov 1  88 Busca Informações do Contrato   COMPLETED     TOTVS-FS
14:28:30  mov 2  88 Busca Informações do Contrato   NOT_COMPLETED System:Auto   (a 96310 do integrador passou por 88 em 1 s)
14:40:18  mov 3  124 Correção                        NOT_COMPLETED Pool:Group:G.P.FatCon_Correcoes   deadline 11/09 14:40 (SLA 24 h)
14:43:52  mov 4  88 Busca Informações do Contrato   NOT_COMPLETED System:Auto   (após assumir no pool e reenviar)
```

A 88 é a integração que lê o contrato no Protheus; **12 minutos** depois ela cai, por desenho,
em **124 Correção**, pool `G.P.FatCon_Correcoes` — do qual a conta participa. O mesmo ciclo
da SC (233 → 236). Assumir e reenviar funciona pelo mesmo caminho da SC (Central de Tarefas →
Tarefas em pool → link do grupo → Assumir; `pageworkflowview…currentMovto=3` → Enviar →
`workflowView/send` 200): o formulário da Correção expõe os zooms `zoomNumContrato`,
`zoomCompetencia`, `zoomFilialMedicao`, `zoomNumPlanilha` (já preenchidos com o molde) e os
selects `aprovPreviaCSE` / `aprovFiscalServico`. Reenviada, voltou para 88 — e a expectativa,
com `dsProtheus_getContratos_restGetAll` respondendo **zero linhas** nesta base e
`apiRESTProtheusContratos` "não encontrado", é cair em 124 de novo. O que falta é **contrato
no Protheus desta base** (ou o serviço de Contratos registrado no Fluig) — dono do ambiente /
administrador do Protheus.

**Veredito: VIÁVEL para o Tracker (a FC nasce, aparece como ABERTA/Usuário Integrador e
entra no filtro do teste); NÃO DETERMINADO para os cenários de medição** (`tests/e2e/contratos/*`
precisam da tarefa 25/28 "Realizar Medição", que só existe se a 88 concluir — e a 88 depende
de o contrato existir no Protheus desta base).

---

## 2. SIGAJURI — combo "UF" sem opção

**Vermelho:** `PRÉ-CONDIÇÃO AUSENTE: o caso precisa de "MA" no combo "UF", mas o ambiente
hoje só oferece: (nenhuma opção)` (`tests/e2e/juridico/sigajuri-contencioso.spec.js`).

### O que alimenta o combo

**Nada — as opções são fixas no HTML do formulário.** `GET /webdesk/streamcontrol/91953/0/0/`
(63.326 bytes) contém literalmente:

```html
<label for="uf">UF</label>
<select class="form-control" id="uf" name="uf">
  <option value="" grupo="">Selecione</option>
  <option value="BA">BA</option> <option value="RR">RR</option> … <option value="Sede">Sede</option>
```

29 opções (27 UFs + "Selecione" + "Sede"). O HTML não contém `DatasetFactory` nem
`getDataset`, e abrindo `/pageworkflowview?processID=SIGAJURI_Contencioso` com captura de
rede **nenhum `POST /api/public/ecm/dataset/datasets` é disparado**. Não há dataset a
consertar.

### Por que o teste vê "(nenhuma opção)"

É **corrida de leitura no iframe**, não ambiente. Medido (`.inv-10`): após o heading "Início"
ficar visível, `combo.locator('option').evaluateAll(...)` devolve

```
t+787ms   opções=0    frames=[página]                 ← iframe ainda não existe
t+1801ms  opções=29   frames=[página, webdesk/stream]
```

`SigajuriPage.expectFormularioAberto` espera só o heading da página externa, e
`listarOpcoesReais` usa `evaluateAll`, que **não espera** — com zero elementos devolve `[]`
na hora. O teste rodado hoje em primeiro plano (`-g "CT-JUR-04-H"`) reproduziu o vermelho, e
o `error-context.md` da falha mostra o `combobox "UF"` **com as 29 opções** já no DOM — a
foto é tirada depois, a leitura foi feita antes.

**Veredito: não é massa — é o page object.** `listarOpcoesReais` precisa esperar o combo
(`await combo.waitFor()` ou `expect(combo.locator('option')).not.toHaveCount(0)`) antes de
`evaluateAll`. Mesma classe de armadilha já registrada no mapa ("o iframe do formulário
navega várias vezes durante a carga").

---

## 3. "Minhas solicitações" sem solicitação ATRASADA

**Vermelho:** `tests/e2e/tarefas/minhas-solicitacoes.spec.js` — nenhum cartão com
"Atrasada há".

### De onde vem o atraso

A aba chama `GET /ecm/api/rest/ecm/centralTasks/getTasks/requests/TOTVS-FS?filter=…` e cada
item de `invdata` traz `dateExpires` ("Até 2026-09-17T16:42:31…") e `expired: false`. O prazo
é o **`deadlineDate` da tarefa corrente**, calculado pelo SLA da atividade do BPMN. SLAs
medidos nas tarefas desta base (deadline − início):

| Atividade | SLA |
|---|---|
| 233 Grava SC e Anexos / 236 Correção | **24 h** |
| 24 Cotação foi Gerada? | 24 h (uma amostra com 72 h) |
| 28 Realizar Medição do Contrato (FC) | ~39 h |
| 7 Validação do Gestor, 9, 14, 119, 121, 257, 271 | 96 h |
| 294 Compra Centralizada? | 672 h |

### O `/start` aceita deadline? NÃO

```
POST /process-management/api/v2/processes/wf_solicitacao_compras/start
{ …, "deadlineDate": "2026-09-01T12:00:00.000-0300" }
→ 400  Unrecognized field "deadlineDate" (class com.fluig.api.processmanagement.v2.vo.StartRequestVO), not marked as ignorable
```

O VO de início não tem campo de prazo; o mesmo vale para `deadline`, `deadlineTime`,
`warningDate` (recusados juntos na mesma chamada). Não há swagger publicado
(`/process-management/api/v2/swagger.json` → `NotFoundException`).

### Caminho que existe

Deixar uma solicitação nossa parada numa atividade de SLA curto e esperar o relógio:

- as SCs semeadas em `Validação do Gestor` (7) vencem em **14/09/2026 12:00** (SLA 96 h);
- uma SC que caia em **236 Correção** (ERP fora, ou item que a integração recuse) vence em
  **24 h** — a 96380 teve `deadline 2026-09-11T11:40` enquanto esteve lá;
- a FC 96437, se chegar a 25/28, vence em ~39 h.

Depois disso o cartão em "Minhas solicitações" passa a "Atrasada há …" sozinho.

**Veredito: VIÁVEL, com espera de 1 a 4 dias; não é instantâneo por API.** A alternativa
imediata (alterar prazo) exigiria modo gestor do processo, que a conta não tem — não medido.

---

## 4. Portal do Comprador / Controle de Cotações vazios

**Vermelho:** filas vazias; medição anterior dizia `genericQuery` → HTTP 202 *"seu usuário
precisa efetuar a troca de senha"*.

### Hoje NÃO é assim

Navegando `Acesso Rápido → Controle De Cotações` (`#/controleCotacao`), `Validação Inicial`,
`Avaliação de Propostas` e `Definir Vencedor Cotação` (`#/propostaVencedora`) com captura de
rede: **nenhuma chamada a `genericQuery` nem a `/java_portal_comprador_v1/`**. O bundle do
widget (`/wg_portalCompradores/resources/js/App/Scripts/browser/main.js`, 822 KB) **não cita**
`java_portal_comprador` nem "troca de senha". Os endpoints que ele usa:

```
/api/public/ecm/dataset/datasets            (POST, datasets abaixo)
/api/public/ecm/dataset/search?datasetId=ds_getSolicsPortalComprador
/api/public/ecm/dataset/search?datasetId=dsCount_validInicialCompras
/api/public/ecm/dataset/search?datasetId=dsForm_RequisicaoCompraContratacao
/api/public/2.0/authorize/client/invoke
```

Datasets citados no bundle: `dsProtheus_getUser_restGetByEmail`,
`dsProtheus_getCompradores_restGetAll`, `ds_getSolicsPortalComprador`,
`dsCount_validInicialCompras`, `dsFluig_getProcessosProjetoComprasSql`, `dsFluig_postProcessesMove`,
`ds_postStartProcess`, `ds_postFinalizaSolicCompra`, `dsFluig_postProcessesCancel`,
`dsConsultaAnexos_Cotacao`, `dsConsultaAnexosNegociacao`, `dsProtheus_delSolicitacoesComprasNFC`.

### Por que as filas estão vazias — a cadeia de identidade

Na carga do portal:

```
POST datasets { name: dsProtheus_getUser_restGetByEmail, constraints: [email = fabricasoftware@totvs.com.br] }
→ 200 { values: [ { error: "undefined", fields: "", constraints: "" } ] }        ← conta não existe no Protheus
POST datasets { name: dsProtheus_getCompradores_restGetAll, constraints: [Y1_USER = "undefined", …] }
→ 200 { columns: [], values: [] }                                                 ← logo, nenhum comprador
GET  dataset/search?datasetId=dsCount_validInicialCompras&filterFields=matriculaComprador,TOTVS-FS
→ { content: [ { total: "0" } ] }
```

E o **Controle de Cotações** lê `dsFluig_getProcessosProjetoComprasSql` (dataset SQL do
Fluig sobre as instâncias de `wf_cotacao_produtos_servicos`, colunas `NUM_PROCES`,
`CD_MATRICULA`, `hd_numSc`, `hd_atribuicao`, …). Constraints completas, capturadas na abertura de `#/controleCotacao`:

```
dsFluig_getProcessosProjetoComprasSql  constraints: [ PROCESS = "parecer_tecnico" ]
dsFluig_getProcessosProjetoComprasSql  constraints: [ STATUS = "0", PROCESS = "negociacao" ]
```

**Não há constraint de matrícula** nessa grade: ela lista as instâncias de *negociação* em
aberto (`STATUS = 0`), e o vazio é porque hoje não existe nenhuma —
`GET /requests?processId=wf_cotacao_produtos_servicos&status=OPEN` → **0** (as "14 cotações
ativas" de `docs/massa-de-dados-no-ambiente-dev.md` caíram no cancelamento em bloco de
09/09/2026). O teste de "iniciar cotação/negociação por API" está na seção 6.

`ds_getSolicsPortalComprador` (sem filtro) **lista as nossas SCs** (96436 em "Validação do
Gestor", com a justificativa `QA-MASSA-…`) — a massa de SC já chega ao portal; o que não chega
é o vínculo da conta com um comprador (`Y1_USER`).

### Iniciar cotação e negociação por API — a instância nasce, a grade continua vazia

Moldes: `GET /requests/95754?expand=formFields` (cotação, 83 campos) e
`GET /requests/95610?expand=formFields` (negociação, 90 campos). E-mails trocados pelo da conta.

```
POST /processes/wf_cotacao_produtos_servicos/start     { targetState: 0, … }  → 200 { processInstanceId: 96439, nextState: 32 }
POST /processes/wf_negociacao_cotacao_prod_serv/start  { targetState: 0, … }  → 200 { processInstanceId: 96440, nextState: 6 }
POST …/wf_negociacao_cotacao_prod_serv/start  com hd_atribuicao = "TOTVS-FS"  → 200 { processInstanceId: 96442 }
```

Desfecho: 96439 → `7 Recepção de Propostas` (assignee `admin`); 96440 → `8 Recepção de
Propostas` (`admin`); 96442 → `8 Recepção de Propostas` (**`TOTVS-FS`**). O dataset da grade
passou a devolver as duas negociações:

```
dsFluig_getProcessosProjetoComprasSql [STATUS=0, PROCESS=negociacao]
→ 96440 (hd_atribuicao 265d01ce…, CD_MATRICULA admin) ; 96442 (hd_atribuicao TOTVS-FS, CD_MATRICULA TOTVS-FS)
```

…e a grade `#/controleCotacao` **seguiu em "Página 1 de 0 — Nenhum dado encontrado"** nas
duas leituras (antes e depois da 96442). O motivo está no bundle: a grade **não parte do
Fluig, parte do Protheus** — o widget consulta a tabela **SC8** (cotações do ERP; campos
`C8_FILIAL, C8_NUM, C8_NUMPRO, C8_FORNECE, C8_LOJA`) via `genericQuery`
(`enviromentService.getProtheusData().url + /api/framework/v1/genericQuery?tables=…`) e só
depois cruza cada linha com a negociação do Fluig, exibindo-a quando `STATUS == "0"` e
`hd_atribuicao == <matrícula do comprador>`. Hoje a consulta ao ERP **nem é disparada**
(captura de rede na tela: zero chamadas a `genericQuery` ou a `/api/public/2.0/authorize/client/invoke`)
porque a cadeia de identidade morre antes — sem `Y1_USER`, não há comprador para consultar.

O "HTTP 202 *troca de senha*" da medição anterior era a resposta do ERP a essa consulta — que
hoje não acontece; a string não existe no bundle (é do lado Protheus). Chamando o endpoint
diretamente, como o widget faria (`KNOWN_HOSTS` mapeia `caixade213859` → `env: "prod"` →
`urlProtheus = /java_portal_comprador_v1/tbc/protheus`):

```
GET /java_portal_comprador_v1/tbc/protheus/api/framework/v1/genericQuery?tables=SC8,SA2&fields=C8_NUM,…&limit=5
→ 401 application/json {"message":"The request requires authentication. The server might return this response for a page behind a login."}
GET /java_portal_comprador/tbc/protheus/api/framework/v1/genericQuery?…   (URL dos envs qa/tst)  → 404 Not Found
GET /java_generico_protheus/tbc/api/framework/v1/genericQuery?…            (widget Logs Protheus)  → 401
```

Ou seja: **hoje a resposta é 401, não 202** — o proxy Java está publicado e exige credencial
própria (o widget a obtém do lado servidor, provavelmente via `dsFluig_getConfigMailers` /
`authorize/client/invoke`, caminho que só é percorrido depois de o comprador existir).

**Veredito: INVIÁVEL do nosso lado.** Semear cotação/negociação no Fluig é possível e provado,
mas a grade exige (1) a conta cadastrada como comprador no Protheus (`Y1_USER` ↔ e-mail
`fabricasoftware@totvs.com.br`) e (2) cotação correspondente na SC8 do ERP. Os dois são
cadastro no Protheus — administrador do ERP. A **Validação Inicial** tem a mesma raiz
(`dsCount_validInicialCompras&filterFields=matriculaComprador,TOTVS-FS` → `total: 0`).

---

## 5. Gerência de Compras (257): o que cada etapa exige

Fonte: `expand=formFields` das SCs 95753 e 95274 (que chegaram a 161), comparado com as nossas
(96363, 96380), mais a **execução real** na 96380.

| Etapa | Quem recebe | Campos que a etapa grava | Como avançar |
|---|---|---|---|
| **7 Validação do Gestor** | pool `G.P.Requisicao_de_Compras_Gestor_Imediato` (a conta está nele) | `tbmanag_aprovadoValid___1 = Aprovado`, `tbmanag_justificativa___1`, `tbmanag_dataValid/horaValid/emailRespValid/nomeRespValid/mailSubstitute___1`, `managerAprovadoValidacao = Aprovado` | **Provado na 96380**: assumir no pool, abrir `pageworkflowview?…currentMovto=<seq>`; o formulário expõe **só 2 controles editáveis** — radio `tbmanag_aprovadoValidSim` / `tbmanag_aprovadoValidNao` e textarea `tbmanag_justificativa___1`. Marcar "Aprovado", justificar, **Enviar** → `POST /ecm/api/rest/ecm/workflowView/send` 200. A SC seguiu 280 → 265 → 277 → **14** em 10 s |
| **14 Validação Orçamentária** | **usuário nominal** — na 96380 foi `7ed9f502370740aa8c42285266bde117` (**Erlon Cesar Dengo**, `erlon.dengo@cassi.com.br` — o mesmo `tbitorc_matriculaValid___1` da 95753), **não o pool** | `tbitorc_aprovadoValid___1 = Aprovado`, `tbitorc_codERPUserValid___1 = 004445`, `tbitorc_codERPValid___1`, `tbitorc_justificativa___1`, `tbitorc_vlrTotEstItem___1`, `itemAprovadoValidacao = Aprovado`, `itensGestOrcamentario = Sim` | O gestor vem de `tbprod_aprovResp___1` (`004445`, herdado do molde 95753) → resolvido no ERP em 280 "Distribuição Gestor Orçamentário". **TOTVS-FS não consegue assumir**: a tarefa não está em pool. Sonda feita: SC **96438** com `tbprod_aprovResp___1 = ""` — aprovada na 7 às 14:39, passou por 280 → 265 → **277 "Itens com Gestor?"** → 14, atribuída **ao mesmo Erlon**. O gestor é resolvido pelo **centro de custo** (`9423`) no ERP, não pelo campo do item. Sem matrícula no Protheus, nenhum centro de custo aponta para esta conta |
| 271 Join → 16 → 254 Distribuição Comprador → 256 | automáticas | `distribuicaoManual = Sim` (já no molde) | — |
| **257 Gerência de Compras** | pool `G.P.Requisicao_de_Compras_Validacao_Compradores` | é a fila do widget `ds_getSolicsGerenciaCompras` (`etapa,257`) | nas SCs reais a 257 durou 1 s e virou **119 Validação do Comprador** (transferida ao comprador); a grade da Gerência lista o que está parado em 257 |
| 119/121 Validação do Comprador | comprador nominal / pool | `buyer*` (11 campos), `codERPValidBuyer`, `codERPUserValidBuyer`, `matriculaValidBuyer`, `codStatusSolicitacao = 07`, `cotacaoGerada = Sim`, `numCotacao` | depende de comprador no ERP |

**Veredito: 7 → VIÁVEL e provado (duas vezes: 96380 e 96438); 14 → INVIÁVEL com a conta
atual** — a tarefa é nominal, para o gestor orçamentário do centro de custo no ERP (Erlon
Cesar Dengo para o CC 9423), e `aprovResp` vazio não muda isso. **Não medido:** se um centro
de custo *sem* responsável no ERP faria o desvio 267 "Itens sem Gestor?" cair no pool
`G.P.Requisicao_de_Compras_Validacao_Orcamentaria` — `dsProtheus_getSQB_restGetAll` (departamentos
× responsável) responde hoje `error: "Unexpected token: c"`, então não há como escolher um CC
assim sem o administrador do Protheus. Duas SCs (96380, 96438) ficam paradas na 14 como
evidência; o caminho até 257 exige que Erlon (ou o gestor do processo) as aprove.

---

## 6. Massa criada e estado no fechamento (10/09/2026, ~14:50)

Tudo marcado `QA-MASSA-…` (justificativa/observação/comentário de início), e-mails de
notificação apontados para `fabricasoftware@totvs.com.br`. Registrado em
`playwright/.massa/semeada.jsonl` (local, não versionado) — por isso a lista fica aqui:

| Instância | Processo | Criada por | Onde parou | Prazo |
|---|---|---|---|---|
| 96363 | SC | semeadura da manhã | 7 Validação do Gestor, **assumida por TOTVS-FS** (outro agente, 13:15) | 14/09 12:00 |
| 96369, 96370, 96376, 96377, 96378, 96379 | SC | semeadura da manhã | 7 Validação do Gestor, pool Gestor_Imediato | 14/09 12:00 |
| 96380 | SC | semeadura da manhã | **aprovada na 7 por esta investigação** → 14 Validação Orçamentária, Erlon Cesar Dengo | 14/09 14:25 |
| 96436 | SC | outro agente (14:14) | não acompanhada aqui | — |
| 96438 | SC, `aprovResp` vazio | esta investigação (14:33) | aprovada na 7 → 14 Validação Orçamentária, Erlon Cesar Dengo | 14/09 14:39 |
| **96437** | **FC** `wf_faturamento_contratos` | esta investigação (14:28) | 88 → 124 Correção (pool FatCon_Correcoes) → reenviada → 88 Busca Informações do Contrato, System:Auto | 24 h quando em 124 |
| 96439 | Cotação `wf_cotacao_produtos_servicos` | esta investigação (14:37) | 7 Recepção de Propostas, `admin` | 18/09 14:38 |
| 96440 | Negociação `wf_negociacao_cotacao_prod_serv` | esta investigação (14:37) | 8 Recepção de Propostas, `admin` | 14/09 14:37 |
| 96442 | Negociação, `hd_atribuicao = TOTVS-FS` | esta investigação (14:41) | 8 Recepção de Propostas, **TOTVS-FS** | 14/09 14:41 |

Nada foi cancelado. Para higienizar: `node scripts/limpar-massa.mjs --descobrir --desde=2026-09-10`
(a FC, a cotação e a negociação não têm campo de texto carimbado além do `comment` de início —
o `--descobrir` só acha o que tem `QA` no formulário; para elas, use o livro-razão ou os ids
acima com `POST /api/public/2.0/workflows/cancelInstances`).

### O que ficou reutilizável

- **Qualquer processo publicado para a conta inicia por API** com o molde de
  `expand=formFields` de uma instância existente + `targetState: 0` — provado em SC, FC,
  cotação e negociação (quatro processos, quatro `200` com `processInstanceId`). O molde
  carrega e-mails reais: **troque-os** antes de semear.
- **Pool + `pageworkflowview` + Enviar** movimenta qualquer tarefa de pool da conta — provado
  em 236 Correção (SC), 7 Validação do Gestor (SC, com o radio `tbmanag_aprovadoValidSim`) e
  124 Correção (FC). `scripts/empurrar-massa.mjs` só conhece o grupo de Correções da SC; o
  grupo e o preenchimento variam por etapa (ver `.inv-5` desta investigação, apagado — a
  lógica está descrita na seção 5).
- **O bloqueio comum a 1, 4 e 5 é um só: a conta não existe no Protheus** (`dsProtheus_getUser_restGetByEmail`
  → `error: "undefined"`). Com `Y1_USER` (comprador) e um centro de custo cujo gestor seja a
  conta, o resto do caminho já está aberto pelos pools.

---

## 7. Rota até a 257 sem gestor orçamentário

Pergunta do coordenador: o ramo **267 "Itens sem Gestor?"** pula a 14 Validação Orçamentária?
Se sim, um item cujo gestor não resolva cairia direto na 257.

### 7.1 O que o histórico diz sobre 277/267

Varridas **41 páginas × 100 movimentos** de
`GET /processes/wf_solicitacao_compras/activities` (tudo que o endpoint devolve). Contagem
por atividade:

```
280 Distribuição Gestor Orçamentario  171
265 Paralelo                          171
277 Itens com Gestor?                 171
267 Itens sem Gestor?                 171   ← as MESMAS 171 instâncias
14  Validação Orçamentária            171
271 Join                              139
```

**265 é gateway paralelo: 277 e 267 são ramos simultâneos, não alternativos.** Toda
instância que chegou à 280 passou pelos dois e **toda** entrou na 14. Nenhuma instância do
histórico tem tarefa no pool `G.P.Requisicao_de_Compras_Validacao_Orcamentaria` (0 em 4.100
movimentos). Ou seja: no que a base mostra, o ramo 267 nunca levou ninguém a lugar nenhum
diferente do Join.

### 7.2 O que a 280 grava (comparação de formulários)

`expand=formFields` de 96380 (`aprovResp = 004445`) e 96438 (`aprovResp = ""`), ambas após a
280, contra a 95753 real:

| campo | 95753 | 96380 | 96438 (`aprovResp` vazio) |
|---|---|---|---|
| `itensGestOrcamentario` | Sim | Sim | **Sim** |
| `tbitorc_codERPUserValid___1` | 004445 | 004445 | **004445** |
| `tbitorc_responsavelValid___1` | Paulo Calixto – TOTVS | Erlon Cesar Dengo | Erlon Cesar Dengo |
| `tbitorc_matriculaValid___1` | 7ed9f502… | 7ed9f502… | 7ed9f502… |
| `tbitorc_codERPValid___1` | 00011757 | 00011757 | 00011757 |
| rateio `tbRatCC_codCCusto` | 9423 | 9423 | 9423 |

A 280 **reescreve** o gestor a partir do centro de custo do rateio (9423 → matrícula ERP
`004445` → usuário Fluig `7ed9f502…`), ignorando `tbprod_aprovResp___1`. `itensGestOrcamentario`
é saída da 280, não entrada. O que pode mudar o resultado é o **centro de custo**.

(Datasets de apoio, hoje: `ds_protheus_getMatriculaTitular_rest` → `Erro 401 Funcionario não
localizado atraves do email matricula` para a conta; `dsProtheus_getSQB_restGetAll` →
`error: "Unexpected token: c"`; `dsProtheus_getGestorCentroCusto_restGetAll` → `content: {}`;
`dsProtheus_getCentroCusto_restGetAll` → 347 CCs, colunas `CTT_CUSTO, CTT_DESC01, CTT_RES, CTT_BLOQ…`.)

### 7.3 O gestor varia com o CC — formulários históricos

| SC | CC do rateio | `tbprod_aprovResp___1` | gestor gravado pela 280 (`codERPUserValid` / usuário Fluig) |
|---|---|---|---|
| 95753 | 9423 | 004445 | 004445 / 7ed9f502… (Erlon) |
| 95648 | 7003 | 004445 | 004445 / 7ed9f502… |
| 95605 | 1000 | 004445 | 004445 / 7ed9f502… |
| 95572 | 1145 | 000187 | 000187 / euzeliane.alves |
| **95585** | 0950 | **(vazio)** | 000187 / euzeliane.alves |
| 95274 | 9422 | 000187 | 000187 / euzeliane.alves |

Dois gestores distintos na base, escolhidos pelo CC; `aprovResp` vazio (95585) não impede a
resolução. Nenhum item da história ficou "sem gestor".

### 7.4 Semeadura das variantes (10/09/2026, 15:0x)

Quatro SCs por `/start` (mesma factory, `QA-MASSA`, registradas no livro), aprovadas na 7
**esperando `#tbmanag_nomeRespValid___1` ter valor** antes de marcar o rádio (montou em 2,7 s,
4,7 s e 8,6 s nas três primeiras) — `managerAprovadoValidacao = "Aprovado"` conferido no
formulário após o envio, nenhuma foi para 11:

| SC | variante | resultado após a 280 |
|---|---|---|
| 96445 | CC **0100** (UNIDADE CASSI PARÁ) | 265 → 277 → **14 nominal, Erlon (004445)** |
| 96446 | CC **0131** (CLINICASSI MANAUS) | 265 → 277 → **14 nominal, Erlon (004445)** |
| 96447 | CC 9423 + `itensGestOrcamentario = "Não"` no `/start` | a 280 sobrescreve para `"Sim"` → **14 nominal, Erlon** |
| 96448 | `tbprod_jsonrateio___1 = "[]"` (sem rateio) | **não sai da 233 "Grava SC e Anexos"** (System:Auto, >10 min no fechamento) — a integração com o ERP não conclui sem rateio; destino esperado é 236 Correção, nunca a 7 |

Trilha idêntica nas três que passaram (`GET /requests/{id}/tasks`):

```
294 → 233 → 7 (pool Gestor_Imediato) → 9 Sol. Validação do Gestor (TOTVS-FS)
  → 280 → 265 Paralelo → 277 Itens com Gestor? → 14 Validação Orçamentária [NOT_COMPLETED, 7ed9f502…] → 271 Join (System:Auto)
```

### 7.5 Resposta

**Não — com esta conta não há rota até a 257 sem o gestor orçamentário nominal.**

1. O gateway 265 é **paralelo**: 277 e 267 sempre correm juntos (171 = 171 = 171 no
   histórico), e o ramo 267 termina no Join 271 sem tarefa. O Join espera a 14. Não existe
   "pular a 14" no desenho publicado (v71).
2. A 280 resolve o gestor pelo **centro de custo no ERP** e grava `itensGestOrcamentario =
   "Sim"` sempre — `aprovResp` vazio (96438, 95585), CC de unidade (0100, 0131) e
   `itensGestOrcamentario = "Não"` no payload não mudam nada. Quatro CCs distintos resolveram
   para `004445`/Erlon, o que sugere um aprovador padrão do ERP quando o CC não tem titular.
3. Sem rateio a SC nem chega à 7.
4. A conta não aparece em `dsProtheus_getUser_restGetByEmail` nem em
   `ds_protheus_getMatriculaTitular_rest` (`Erro 401 Funcionario não localizado`), logo nenhum
   CC pode resolver para ela.

Item 3 do pedido (confirmar SC na grade Atribuir da Gerência de Compras como `active: true`):
**não medido** — nenhuma SC chegou à 257.

O que destrava, por ordem de custo: (a) **Erlon Cesar Dengo (ou o gestor do processo em
`managerMode`) aprovar as 6 SCs paradas na 14** — 96380, 96438, 96445, 96446, 96447 e 96435
— e elas seguem 16 → 254 → 256 → 257 pelos pools que a conta já tem; (b) cadastrar a conta
como titular de um centro de custo no Protheus (administrador do ERP), o que faria a 14
nascer nominal para `TOTVS-FS`.

⚠️ Ao marcar o rádio: `#tbmanag_aprovadoValidSim` existe **duas vezes** no formulário
(linha-modelo `name="tbmanag_aprovadoValid"` e linha real `name="tbmanag_aprovadoValid___1"`);
o seletor estável é `input[name="tbmanag_aprovadoValid___1"][value="Aprovado"]`.
