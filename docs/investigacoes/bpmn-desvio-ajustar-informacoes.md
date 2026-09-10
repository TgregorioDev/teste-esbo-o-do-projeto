# Por que a SC vai para "Ajustar Informações" — e quanto tempo ela leva para ficar assumível

Investigação de 10/09/2026 no `caixade213859`, conta `TOTVS-FS`, com o serviço do ERP **no ar**
durante toda a medição (`GET /api/public/2.0/authorize/client/test?serviceCode=apiRESTProtheusCompras`
→ `content.description = "apiRESTProtheusCompras:SUCCESS"`, conferido antes de cada script).

Tudo aqui foi lido pela API do Fluig de dentro de uma página autenticada (`page.evaluate` +
`fetch`): `GET /process-management/api/v2/requests/{id}?expand=formFields` para o formulário e
`GET /process-management/api/v2/requests/{id}/activities?expand=tasks` para a trilha. Nenhuma
solicitação de terceiros nem das 8 de API foi movimentada; as únicas escritas foram a semeadura
de 2 SCs (Frente B) e, sobre essas mesmas duas, o A/B de aprovação da seção A.4.

> **Resumo.** (A) O "enigma API × tela" não existe: as 8 SCs de API estão em *7 Validação do
> Gestor* porque **ninguém as aprovou**; as de tela foram aprovadas pelo teste e **depois**
> desviadas pelo gateway *9 Sol. Validação do Gestor*, que lê `managerAprovadoValidacao` — vazio
> nas 4 que desviaram, `"Aprovado"` nas 17 que seguiram. O campo é preenchido **só por
> JavaScript do formulário** (`App.js`, hook `beforeSendValidate`), que é o último script a
> carregar: o rádio "Sim" fica clicável **~1,8 s antes** de o hook existir. Enviar nessa janela
> grava o rádio e a justificativa, mas não o consolidado — e o gateway trata vazio como
> reprovação. **Reproduzido à vontade** na massa desta investigação (96436 → 11; 96435 → 280).
> Não é BPMN nem Protheus: é corrida no cliente, e a suíte perde a corrida em ~1 de 4–6 envios.
> (B) Com o ERP no ar, *233 Grava SC e Anexos* leva **10–27 s** (n=30, mediana 14 s); os 180 s
> dos testes são folga de 7× — os cinco "não ficou assumível em 180 s" caíram numa janela de
> degradação (4–6 min) e não em lentidão normal.

---

## Frente A — o desvio para "Ajustar Informações"

### A.1 A trilha de cada SC (de `/requests/{id}/activities`)

Horários em `-03:00`. Duração entre parênteses.

**SCs criadas por API** (`scripts/semear-massa.mjs`, `targetState: 0`) — todas hoje em *7*:

| SC | 6 Início | 294 | 233 Grava SC e Anexos | 236 Correção | 233 (reenvio) | atividade atual |
|---|---|---|---|---|---|---|
| 96363 | 10:18:17 | 10:18:19 | 10:18:19 → 10:30:06 (707 s, ERP fora) | 2× (10:30 e 11:00) | 12:09:37 → 12:09:47 (**10 s**) | **7 Validação do Gestor**, pool `G.P.Requisicao_de_Compras_Gestor_Imediato`, desde 12:09:47 |
| 96369 | 11:00:43 | 11:00:45 | 11:00:45 → 11:20:04 (1159 s) | 11:20 → 12:09 | 12:09:46 → 12:09:54 (8 s) | 7, desde 12:09:54 |
| 96370 | 11:00:52 | 11:00:53 | 11:00:53 → 11:20:03 (1150 s) | 11:20 → 12:10 | 12:10:14 → 12:10:24 (10 s) | 7, desde 12:10:24 |
| 96376 | 11:28:06 | 11:28:07 | 11:28:07 → 11:40:04 (717 s) | 11:40 → 12:10 | 12:10:45 → 12:10:54 (9 s) | 7, desde 12:10:54 |
| 96377–96379 | 11:28 | 11:28 | ~700 s | sim | ~10 s | 7 |
| 96380 | 11:28:38 | 11:28:39 | 11:28:39 → 11:40:06 (687 s) | 11:40 → 12:12 | 12:12:22 → 12:12:28 (6 s) | 7, desde 12:12:28 |

Nenhuma delas passou de *7*. Elas **não chegaram ao gateway** — não há como terem sido "não
desviadas": a decisão que desvia acontece depois de alguém aprovar a tarefa 7, e essa tarefa
continua aberta no pool.

**SCs criadas pela tela pelos testes destrutivos** — as três que desviaram:

| SC | 6 | 294 | 233 (dur.) | 7 Validação do Gestor (dur.) | 9 Sol. Validação do Gestor | atividade atual |
|---|---|---|---|---|---|---|
| 96410 | 12:43:59 | 12:44:00 | 12:44:00 → 12:44:14 (**14 s**) | 12:44:14 → 12:44:38 (24 s, aprovada pelo teste) | 12:44:38 → 12:44:38 | **11 Ajustar Informações** |
| 96414 | 12:46:41 | 12:46:42 | 12:46:43 → 12:46:54 (11 s) | 12:46:54 → 12:47:20 (26 s) | 12:47:20 → 12:47:21 | 11 |
| 96415 | 12:48:20 | 12:48:21 | 12:48:21 → 12:48:35 (14 s) | 12:48:35 → 12:48:58 (23 s) | 12:48:58 → 12:48:59 | 11 |

A quarta do dia com o mesmo desfecho, achada varrendo o histórico: **96400** (7 às 12:11:27, 9 às
12:11:57, 11 em seguida).

**As de tela que NÃO desviaram** (mesmos testes, mesma tarde): 96384, 96385, 96386, 96389, 96390,
96399, 96402, 96403, 96404, 96405, 96406, 96407, 96411, 96412, 96413, 96416, 96418 — todas
7 → 9 → **280 Distribuição Gestor Orçamentario** e hoje em *14 Validação Orçamentária*.
Exemplo de par quase simultâneo: 96399 (7 às 12:11:15 → 280 às 12:11:39) e 96400 (7 às
12:11:27 → **11** às 12:11:57). Doze segundos de diferença, workers diferentes, destinos
diferentes — não é janela de ambiente, é por instância.

**SCs reais de terceiros**, para referência do caminho inteiro:

| SC | 233 (dur.) | 7 (dur.) | 9 → | depois |
|---|---|---|---|---|
| 95753 (03/07/2026) | 11:35:32 → 11:37:06 (94 s) | 11:37:06 → 11:47:20 (10 min, humano) | 280 | 265 → 277/267 → 14 → 271 → 16 → 254 → 256 → 257 → 119 → 121 → 20 → 328 → 24 → 33 → 161 (aberta) |
| 95274 (28/05/2026) | 16:21:18 → 16:22:41 (83 s) | 16:22:41 → 16:23:36 | 280 | idem, até 161 |
| 95275 | — | — | 280 | chegou a *Fim - Processo de Pagamento* |
| 95269 | — | — | 280 | 16 movimentos |

**Gateway que desvia: 9 "Sol. Validação do Gestor"**, decisão automática logo após a tarefa
humana 7. Saídas observadas em 438 instâncias do histórico: **→ 280** (aprovado) ou **→ 11
Ajustar Informações**. Não há terceira saída.

### A.2 O formulário — o que difere entre quem desviou e quem não desviou

Primeiro, o que **não** explica: o formulário de abertura. Entre a SC de API (96363) e as de tela
(96410/96414/96415) há diferenças de produto (`02000777` papel A4 vs `00000003` ar-condicionado),
grupo de estoque (4040 vs 3000), contas (despesa vs imobilizado `133229012001`), `tipoSolicitacao`
(`Nova Contratação` vs `Nova Solicitação`), `distribuicaoManual`/`gerarParecer` (preenchidos só
na API) — mas as 17 SCs de tela que **seguiram para 280** têm exatamente os mesmos valores das 4
que desviaram (mesmo produto, mesmas contas, `AS00`, `004445`). Abertura idêntica, destino
diferente: a causa está no que foi gravado **na aprovação**.

Campos gravados pela etapa *Validação do Gestor*, lidos depois do gateway:

| campo | 96363 (API, ainda em 7) | 96410 / 96414 / 96415 / 96400 (tela → **11**) | 96405 / 96406 / 96411 … (tela → **280**) | 95753 / 95274 (reais → 280) |
|---|---|---|---|---|
| `tbmanag_aprovadoValid___1` | `""` | `"Aprovado"` | `"Aprovado"` | `"Aprovado"` |
| `tbmanag_justificativa___1` | `""` | `"QA aprovando Validação do Gestor — CT-…"` | idem | `"..."` / `"Teste Homologação."` |
| **`managerAprovadoValidacao`** | `""` | **`""`** | **`"Aprovado"`** | `"Aprovado"` |
| `itensGestOrcamentario` | `""` | `""` | `"Sim"` | `"Sim"` |
| `tbmanag_nomeRespValid___1` | `""` | `""` | `"Usuário TBC (TOTVS)"` | `"Paulo Calixto - TOTVS"` / `"Rui …"` |
| `tbmanag_emailRespValid___1` | `""` | `""` | `fabricasoftware@totvs.com.br` | preenchido |
| `tbmanag_dataValid___1` / `horaValid` | `""` | `""` | `2026-09-10` / hora | preenchidos |
| `tbmanag_mailSubstitute___1` | `""` | `""` | `fabricasoftware@totvs.com.br` | preenchido |
| `tbmanag_matriculaValid___1` | `Pool:Group:…Gestor_Imediato` | idem | idem | `Pool:Group:…` (95753) / `ilmara.nascimento` |
| `codStatusSolicitacao` / `statusSolicitacao` | `02` / `Validação do Gestor` | `20` / **`Em Correção`** | `03` / `Validação Orçamentária` | `07` / `Em Cotação` |

E o histórico confirma o critério do gateway: as instâncias antigas que foram 9 → 11 têm
`managerAprovadoValidacao = "Reprovado"` (94619, 94620, 95087 — reprovações de verdade). As de hoje
que foram 9 → 11 têm o campo **vazio**. Ou seja, o gateway trata "vazio" como "não aprovado", que
é o mesmo ramo da reprovação — daí o nome `Em Correção` no status.

### A.3 Quem preenche `managerAprovadoValidacao` — e por que ficou vazio

Lido do JavaScript do próprio formulário (documento 256831, servido em
`/webdesk/streamcontrol/256831/<cardId>/<versão>/App/*.js`):

- **`App.js` → `beforeSendValidate(numState, nextState)`**, para `numState == 7`: percorre a
  última linha de `tbManager`, lê `input[name="tbmanag_aprovadoValid___N"]:checked` e grava
  `#managerAprovadoValidacao` = `"Aprovado"` ou `"Reprovado"`. **Nunca deixa vazio.**
- **`ViewHandler.js` → `handleRowsManager()`**, na carga da tela: se
  `tbmanag_matriculaValid___N == "Pool:Group:G.P.Requisicao_de_Compras_Gestor_Imediato"`
  (o caso da conta de automação), mostra a linha e grava `tbmanag_nomeRespValid`,
  `emailRespValid`, `dataValid`, `horaValid` com `parent.WCMAPI.user/userEmail` e a data/hora
  atuais. É assíncrona (`async`, `await DataHandler.getValidUserSubstitute(...)`) e depende de
  `that.wk_CurrentUserERP`.

Nas 4 SCs desviadas **nenhum** desses dois blocos deixou rastro: nem os campos da carga
(`nomeRespValid`, `dataValid`…) nem o consolidado do envio (`managerAprovadoValidacao`). Só o que
o teste digitou diretamente (o rádio `Aprovado` e a justificativa) chegou ao servidor. Nas 17 que
seguiram, tudo isso está preenchido.

Conclusão desta parte: **o desvio é decidido por `managerAprovadoValidacao` vazio, e o campo
fica vazio quando o JavaScript do formulário (o `App` do lado cliente) não executou no envio da
aprovação.** O rádio marcado e a justificativa provam que a tela estava visível e o envio
aconteceu; a ausência dos campos preenchidos pelo JS prova que o `App` não rodou — nem na carga,
nem no `beforeSendValidate`. O que faz o `App` não rodar em ~1 de cada 4–6 envios é a seção A.4.

### A.4 O que faz o `App` do formulário não executar — medido, e reproduzido

`App.js` termina com `window["beforeSendValidate"] = (...) => this.beforeSendValidate(...)`,
dentro do construtor de `App`. É o **último** `<script>` do formulário (depois de jQuery,
lodash, `xlsx.full.min.js`, `UtilsHandler`, `ZoomHandler`, `DataHandler`, `EventHandler`,
`ViewHandler`). O DOM — inclusive o rádio "Aprovar? Sim/Não" — já está renderizado e
interativo antes de ele executar. Se o Fluig não encontra `beforeSendValidate` no iframe, envia
o formulário assim mesmo, e o evento de validação do servidor não confere
`managerAprovadoValidacao`.

**Sonda temporal na SC 96435** (`detailsProcessInstanceID` → clique em "Assumir tarefa" →
amostra do iframe a cada 200 ms):

| t após "Assumir tarefa" | o que o iframe `workflowView-cardViewer` mostra |
|---|---|
| 0 → 2,4 s | ainda o formulário de **detalhe** (`WKFormMode=VIEW`, rádio oculto, sem `beforeSendValidate`); `takeTask` já respondeu |
| 2,6 s | a página navega para `pageworkflowview?app_ecm_workflowview_processInstanceId=…` (tela de movimentação) |
| 3,5 s | novo iframe, `streamcontrol/256831/…` |
| **4,6 s** | `WKFormMode=MOD`, **rádio "Sim" visível e clicável**, `typeof beforeSendValidate === "undefined"`, "Aprovador" vazio |
| **6,4 s** | `beforeSendValidate` passa a existir (`App` construído) |
| 6,8 s | `handleRowsManager` termina (`await getValidUserSubstitute`): preenche "Aprovador", data, hora — e **desmarca o rádio** (`prop('checked', false)`) |

Entre 4,6 s e 6,4 s há **~1,8 s** em que `radio.check()` + `fill()` + clique em "Enviar" — três
ações de Playwright, ~300 ms — cabem inteiras. `CicloCompradorPage.aprovarComRetentativa` faz
exatamente isso assim que o rádio fica visível, sem esperar o formulário terminar de montar.
Quando ganha a corrida, o envio sai sem consolidado (→ 11). Quando perde por pouco, o
`handleRowsManager` desmarca o rádio depois do `check()` e o servidor responde *"O campo
"Aprovar? - Linha 1" é obrigatório!"* — que é o **outro** sintoma já registrado no comentário
daquele método, agora com causa. Na retentativa o `App` já existe, e dá certo.

**Prova A/B, na massa desta investigação, ERP no ar:**

| SC | envio | estado do iframe no clique em "Enviar" | `workflowView/send` | `managerAprovadoValidacao` gravado | gateway 9 → |
|---|---|---|---|---|---|
| **96436** | **277 ms** depois de o rádio ficar visível | `MOD`, `beforeSendValidate: undefined`, "Aprovador" vazio | HTTP 200, *"movimentada com sucesso"* | `""` (e `itensGestOrcamentario=""`, `tbmanag_nomeRespValid___1=""`, `statusSolicitacao="Em Correção"`) | **11 Ajustar Informações** (14:35:45) |
| **96435** | depois de `beforeSendValidate` existir e "Aprovador" estar preenchido (+1,5 s) | `MOD`, `beforeSendValidate: function`, "Aprovador" = `Usuário TBC (TOTVS)` | HTTP 200, idem | `"Aprovado"` (`itensGestOrcamentario="Sim"`) | **280 Distribuição Gestor Orçamentario** (14:36:31) |

Mesmo formulário, mesma conta, mesma tarde, mesmo produto — só o **instante do clique** mudou.
O desvio é **determinístico dado o instante**, e por isso parecia intermitente: dependia de
quanto o navegador do worker demorava para baixar e executar seis scripts.

### A.5 Conclusão e o que fazer com ela

**O que decide o desvio:** `managerAprovadoValidacao`. Vazio ou `"Reprovado"` → 11 Ajustar
Informações; `"Aprovado"` → 280. Ele fica vazio quando o envio acontece antes de `App.js`
instalar `beforeSendValidate` no iframe do formulário.

**Dois problemas separados, com donos diferentes:**

1. **Produto (formulário `wf_solicitacao_compras`, doc. 256831):** a decisão de um gateway do BPMN
   depende de um campo que só o JavaScript do cliente preenche, e nem o evento de validação do
   servidor nem o gateway tratam a ausência. Um gestor humano em rede lenta que clique "Enviar"
   nos primeiros 2 s vê a SC ir para "Em Correção" sem nenhuma mensagem — a SC 96436 é a
   evidência, com `send` 200 e "movimentada com sucesso". Sugestão objetiva para o
   desenvolvedor: consolidar `managerAprovadoValidacao` no `validateForm`/`beforeStateLeave` a
   partir de `tbmanag_aprovadoValid___N` (o dado está lá), ou ao menos recusar o envio quando
   vier vazio na atividade 7. Candidato a entrar na tabela de defeitos do README.
2. **Suíte (`pages/CicloCompradorPage.js`, `aprovarComRetentativa`; e qualquer outro caminho que
   decida na tarefa 7):** "rádio visível" não é "formulário pronto". O oráculo observável de
   prontidão é o campo **"Aprovador"** (`tbmanag_nomeRespValid___N`, readonly, visível na
   seção de aprovação) **preenchido** — ele só recebe valor depois que `handleRowsManager`
   terminou, que por sua vez só roda depois de o `App` existir. Esperar
   `getByRole('textbox', { name: 'Aprovador' })` ter valor antes de marcar o rádio fecha as duas
   corridas de uma vez (o envio sem hook **e** o rádio desmarcado). Não editei o Page Object
   nesta investigação; a mudança é de uma linha e deve vir com o comentário atual de
   `ATIVIDADE_AJUSTAR_INFORMACOES` reescrito — ele afirma "condição do lado do Protheus/BPMN",
   e não é.

**O que não muda:** o `faltaPreCondicao` para "Ajustar Informações" continua sendo a leitura
certa até a suíte corrigir a espera — mas a mensagem deveria dizer "envio antes de o
formulário montar (`managerAprovadoValidacao` vazio)", não "ramo intermitente do BPMN".

---

## Frente B — quanto tempo a SC leva para ficar assumível

### B.1 Medição direta (semeadura de hoje, ERP no ar)

`node scripts/semear-massa.mjs --quantidade=2` às 14:14, acompanhada a cada 10 s por
`/requests/{id}/activities?expand=tasks`:

| SC | 6 Início | 294 Compra Centralizada? | 233 Grava SC e Anexos | 7 Validação do Gestor — tarefa no pool |
|---|---|---|---|---|
| 96435 (`QA-MASSA-b04aad94`) | 14:14:37 → 14:14:37 (0 s) | 14:14:37 → 14:14:38 (1 s) | 14:14:38 → 14:14:54 (**16 s**) | 14:14:54, `Pool:Group:G.P.Requisicao_de_Compras_Gestor_Imediato / NOT_COMPLETED` |
| 96436 (`QA-MASSA-5ea8beb2`) | 14:14:44 → 14:14:45 (1 s) | 14:14:45 → 14:14:46 (1 s) | 14:14:46 → 14:15:03 (**17 s**) | 14:15:03, idem |

Da criação até a tarefa assumível no pool: **17 s e 19 s**. A tarefa já nasce com o assignee
`Pool:Group:…` — não há passo intermediário entre o fim de 233 e a tarefa estar no pool.

### B.2 Todas as passagens por 233 de hoje (438 instâncias varridas no histórico do processo)

Só contam as passagens **seguidas de outra atividade** — quando o teardown cancela a SC ainda em
233, o `endDate` é a hora do cancelamento, não o fim da gravação.

| janela | SCs | 233 → 7 | leitura |
|---|---|---|---|
| 10:18 – 11:28 | 96363, 96369, 96370, 96376–96380 | 687–1159 s → **236 Correção** | ERP fora (`WFLYEJB0054`), já documentado |
| 11:53 – 12:53 | 96384–96418 (26 SCs) | **10–27 s** (mediana 14 s), exceto 96395: 365 s | ERP no ar; regime normal |
| 12:56 – 13:04 | 96419, 96420, 96421 (canceladas em 233 após ≥311–345 s); 96422–96424 → 236 após 941–1017 s | degradação de ~20 min | os "não ficou assumível em 180 s" são daqui |
| 13:06 | 96425 | 15 s → 7 | voltou |
| 13:15 | 96430, 96431 | canceladas em 233 após ≥260–267 s | segunda janela curta |
| 14:13 – 14:15 | 96434, 96435, 96436 | 16–19 s → 7 | regime normal |

Também canceladas em 233 antes de completar, entre 11:47 e 12:04: 96381–96383 (≥258 s), 96387,
96388 (≥188 s), 96392–96394 (≥235 s), 96396 (≥197 s) — ou seja, houve **três** janelas de
degradação hoje, não uma.

Estatística das 30 passagens 233 → 7 do dia: **mín 10 s, mediana 14 s, p90 24 s, máx 365 s**.

### B.3 Recomendação de prazo

- **180 s continua razoável como prazo por teste**: cobre 29 das 30 passagens normais com 7× de
  folga, e a 30ª (365 s) já estava dentro de uma janela de degradação. Subir para 6–10 min só
  transformaria "pré-condição ausente em 3 min" em "pré-condição ausente em 10 min", sem mudar o
  veredito — durante a degradação as SCs levaram 15–17 min e caíram em Correção.
- O que muda a leitura é **classificar**: quando a SC não sai de 233 em 180 s com o ERP
  respondendo `:SUCCESS`, o relatório deve dizer *"233 não concluiu em 180 s (normal: 10–27 s)"*
  — é o sintoma da degradação, não lentidão de rotina. Os cinco casos de hoje (96419, 96420,
  96421, 96430, 96431) foram exatamente isso.
- Para a **aprovação do Gestor** (tarefa 7 → gateway 9 → 280), o tempo é desprezível (< 1 s
  depois do envio); o que decide é o preenchimento de `managerAprovadoValidacao`, seção A.

---

## Massa criada por esta investigação

`96435` e `96436` — `QA-MASSA-b04aad94` e `QA-MASSA-5ea8beb2`, registradas em
`playwright/.massa/semeada.jsonl`, vivas de propósito. Depois da prova A/B:

- **96435** — aprovada corretamente pelo Gestor; está em *280 → 14 Validação Orçamentária*
  (pool `G.P.Requisicao_de_Compras_Validacao_Orcamentaria`). Serve de massa para a etapa
  orçamentária.
- **96436** — enviada de propósito antes de o `App` carregar; está em *11 Ajustar Informações*,
  com o solicitante `TOTVS-FS`. Serve de massa para o ciclo de correção/reenvio
  (`ciclo-correcao-reenvio.spec.js`) e como reprodução viva do problema de produto acima.

Nenhuma solicitação de terceiros foi movimentada. As 8 SCs de API (96363–96380) continuam em
*7 Validação do Gestor*, intactas.

## Scripts usados

Temporários, prefixo `.bpmn-` na raiz do repositório, apagados ao fim. Todos com
`chromium` + `storageState` de `playwright/.auth/usuario.json` + `page.evaluate`/`fetch`:
coleta de `formFields`/`activities`; varredura de
`/processes/wf_solicitacao_compras/activities` (40 páginas × 200, 438 instâncias); captura das
respostas do formulário (`streamcontrol/256831/…/App/*.js`); sonda temporal do iframe após
"Assumir tarefa"; e o A/B de envio. Todos reproduzíveis a partir das descrições acima.
