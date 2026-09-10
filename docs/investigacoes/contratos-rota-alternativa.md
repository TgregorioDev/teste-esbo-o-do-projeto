# Contratos sem o Portal de Acompanhamento — há outra via?

**Pergunta:** a página `/portal/p/1/acompanhamentoContrato` não está publicada no tenant
`caixade213859` e derruba 64 dos 147 vermelhos da execução de 10/09/2026. O dado e o
comportamento que cada um desses testes afirma existem em OUTRO lugar deste Fluig?

**Método:** scripts Node (`chromium` + `storageState` da suíte), toda chamada feita de dentro da
página com `page.evaluate` + `fetch`. Medido em 10/09/2026. O que não foi medido está escrito
como "não medido". Nenhum teste foi alterado.

---

## 0. Serviço do ERP no momento da medição

`GET /api/public/2.0/authorize/client/test?serviceCode=<código>` — veredito em
`content.description`, nunca no status HTTP (a rota devolve 200 até para serviço inexistente).

| serviceCode | `content.description` | `content.result` |
|---|---|---|
| `apiRESTProtheusCompras` | **`apiRESTProtheusCompras:SUCCESS`** | `{"quantity":16,"decimal":4,"picture":"@E 99,999,999,999.9999"}` |
| `apiRESTProtheus` | **`apiRESTProtheus:SUCCESS`** | idem |
| `apiRESTProtheusContratos` | `ERROR CALLING SERVICE: apiRESTProtheusContratos` (serviço não cadastrado) | stack `FDNA…` |
| `apiRESTProtheusRH` | `ERROR CALLING SERVICE` | — |
| `apiRESTProtheusFaturamento` | `ERROR CALLING SERVICE` | — |

O ERP de Compras estava **no ar** durante toda a medição abaixo. Só existem dois serviços
cadastrados: `apiRESTProtheusCompras` e `apiRESTProtheus`.

## 1. Páginas do portal — inventário completo (medido)

A API que lista páginas é **`GET /page-management/api/v2/pages?pageSize=300`** (é a mesma que a
Home chama para montar o menu: `/page-management/api/v2/menus?code=home&mode=PAGE`). Devolve
**86 páginas**; `/page-management/api/v2/pages/<code>` devolve a ficha de uma.

`GET /page-management/api/v2/pages/acompanhamentoContrato` → **HTTP 404 (corpo vazio)**. Não é
permissão (uma página existente e proibida, `gestao_ferias`, responde 403
`FDNAccessDeniedException`); a página **não existe** no tenant. Confirma o mapa.

Páginas customizadas (não-internas) do tenant, com o grupo de menu a que pertencem:

| id | código | título | grupo | status | acesso |
|---|---|---|---|---|---|
| 818 | `portaisComprasContratos` | Portais de Compras e Contratos | (grupo) | PUBLISHED | AUTHENTICATED |
| 820 | `portal_fornecedores_v2` | Portal do Fornecedor | portaisComprasContratos | PUBLISHED | PUBLIC |
| 821 | `portal_fornecedores_senha` | Portal Redefinir Senha Fornecedor | portaisComprasContratos | PUBLISHED | PUBLIC |
| 822 | **`PORTAL_ACOMPANHAMENTO_ALCADAS`** | Portal de Acompanhamento de Alçadas | portaisComprasContratos | PUBLISHED | AUTHENTICATED |
| 823 | `PORTAL_TRACKER_COMPRAS_CONTRATOS` | Tracker - Processos Compras/ Contratos | portaisComprasContratos | PUBLISHED | AUTHENTICATED |
| 829 | `gerenciaCompras` | Gerencia Compras | portaisComprasContratos | PUBLISHED | AUTHENTICATED |
| 831 | **`delegacao-fiscais-de-contratos-servicos`** | Delegação Fiscais de Contratos/Serviços | portaisComprasContratos | PUBLISHED (2026-04-28) | AUTHENTICATED |
| 832 | `portal-do-comprador` | Portal do Comprador | portaisComprasContratos | PUBLISHED | AUTHENTICATED |
| 838 | `portal_copia_solicitacao` | Cópia de SC - Fluig | portaisComprasContratos | **DRAFT** | AUTHENTICATED |
| 824 | `portal_fornecedor` | Portal do Fornecedor | MENU_ADMIN | PUBLISHED | PUBLIC |
| 808 | `meu_rh` | RH Conecta | (grupo) | PUBLISHED | — |
| 810 | `declaracao-de-multiplos-vinculos` | rh_declaracoes | meu_rh | DRAFT | — |
| 815 | `rh_beneficios` | Meus Benefícios | meu_rh | PUBLISHED | — |
| 816 | `geralinkadmissao` | Gerar Link Admissão | meu_rh | PUBLISHED | — |
| 825 | `PORTAL_AUTORIZACAO_HORAS_EXTRAS` | Portal de Autorização de Horas Extras | meu_rh | PUBLISHED | — |
| 827 | `gestao_equipes` | Gestão de Equipes | meu_rh | PUBLISHED | — |
| 812 | `grupos_usuarios` | Grupos x Usuários | MENU_ADMIN | PUBLISHED | — |
| 813 | `Pagina_Postos_Ocupantes` | Portal Postos Ocupantes | — | PUBLISHED | — |
| 801 | `CLINICASSI` | CliniCASSI | (grupo) | PUBLISHED | — |
| 800 | `app_UX` | Aplicativos | — | PUBLISHED | — |
| 793 | `fluig-sigajuri` | SIGAJURI | JURIDICO | DRAFT | PUBLIC |
| 794 | `wgCadastroGruposTrabalho` | Grupos de Trabalho | — | DRAFT | — |
| 38 | `fluigpage` | Fluig | — | DRAFT | — |

**Nenhuma página com "contrato", "medição" ou "acompanhamento de contratos" no código ou no
título existe além das listadas.** As 63 restantes são internas do produto (`home`,
`pagecentraltask`, `pageworkflowview`, `datasets`, `pageprocesssearch` etc.).

Duas páginas de contrato que o mapa do ambiente não conhecia: **`PORTAL_ACOMPANHAMENTO_ALCADAS`**
e **`delegacao-fiscais-de-contratos-servicos`** (publicada em 28/04/2026). O que cada uma mostra
está na seção 4.

Varredura de 60 códigos de página plausíveis (`acompanhamentoContratos`, `portal-contratos`,
`gestaoContratos`, `medicao`, `PORTAL_CONTRATOS`, `painelContratos`, `planilhas` …): todos
`Error page` / `errorPage/404`. Coerente com a lista da API.

Menu lateral da Home (aba Contratos): oferece só `pageworkflowview?processID=wf_faturamento_contratos`.

## 2. Processos publicados (medido)

`GET /process-management/api/v2/processes?pageSize=100` → **34 processos** (mesmo catálogo
da skill). Os de contrato/medição/fiscal:

| processId | categoria | início pela conta |
|---|---|---|
| `wf_faturamento_contratos` | Contratos | sim — `pageworkflowview` abre o formulário completo (ver §5) |
| `wf_delegacaoFiscalContratoServico` | Contratos | abre (campos readonly, ver testes CT-DEL) |
| `bpm_recepcao_documentos_fiscais_contratos` | Contratos | bloqueado por permissão (mapa) |
| `bpm_recepcao_documentos_fiscais_fiscais_contratos` | Contratos | bloqueado por permissão (mapa) |
| `wf_cadastro_fornecedor` | Compras | abre |
| `SIGAJURI_Contrato` | TOTVS Juridico | abre, serviço SIGAJURI fora (mapa) |

**Nenhum processo de "acompanhamento de contrato", "solicitação a partir de contrato" ou
"planilha de contrato"** existe: o que o portal fazia era chamar
`POST /processes/wf_solicitacao_compras/start` com o payload montado no widget. O processo
alvo (`wf_solicitacao_compras`) continua publicado.

`GET /processes/wf_faturamento_contratos/activities?pageSize=1000` → responde (`items[]` com
`processInstanceId`, `movementSequence`, `active`, `state`, `tasks`, `formFields`), mais de
1.000 movimentos, `hasNext: true`. `GET /requests?processId=wf_faturamento_contratos&pageSize=100`
→ página 1 com **100 instâncias, todas `CANCELED`**, `endDate` 2026-09-09 10:25 — alguém
cancelou em massa nessa data. Contagem completa na seção 5.

## 3. Datasets — o que responde sem constraint (medido, `POST /api/public/ecm/dataset/datasets`, `constraints: []`)

| dataset | linhas | tempo | observação |
|---|---:|---:|---|
| `dsProtheus_getContratos_restGetAll` | **20** | 1,1 s | colunas CN9_* completas (CN9_NUMERO, CN9_FILIAL, CN9_SITUAC, CN9_REVISA, CN9_XFISCA, CN9_XAPCSE, CN9_VLATU, CN9_DTFIM…) |
| `dsProtheus_getInformaPlanxContrato_restGetAll` | **23** | 1,6 s | planilha × contrato: CNA_CONTRA, CNA_FILIAL, CNA_NUMERO, CNA_REVISA, CNA_FORNEC/LJFORN, CN1_CODIGO/DESCRI (tipo), CNL_DESCRI (FIXA…), CN9_SITUAC, CNA_XFISCA (fiscal de serviço), CN9_XFISCA (fiscal de contrato), CN9_XAPCSE |
| `dsProtheus_getRateiosContratos_restGetAll` | **300** | 1,6 s | CNZ_CONTRA, CNZ_FILIAL, CNZ_CODPLA, CNZ_ITEM, CNZ_CC, CNZ_CLVL, CNZ_PERC, CNZ_VALOR1… |
| `dsProtheus_getTipoContratos_restGetAll` | **114** | 1,1 s | CN1_CODIGO, CN1_DESCRI, CN1_MEDAUT, CN1_CTRFIX… |
| `dsProtheus_getFornecedores_restGetAll` | **300** | 8,8 s | A2_COD, A2_LOJA, A2_NOME, A2_CGC… |
| `dsProtheus_getBranches_restGetAll` | 71 | 0,1 s | filiais |
| `dsProtheus_getProdutos_restGetAll` | 3.100 | 0,9 s | |
| `dsProtheus_getCentroCusto_restGetAll` | 347 | 0,1 s | |
| `dsFluig_getClasseValor` | 23 | 0,2 s | CTH_CLVL |
| `dsProtheus_getPrecoHistorico` | 10 | 0,5 s | `{produto, valor}` sem constraint |
| `dsProtheus_getGrupoDeProduto_restGetAll` | 94 | | |
| `colleagueGroup` | 2.955 | 0,2 s | |
| `dsProtheus_validaSegregacaoFiscal` | 1 | 1,1 s | `{sucesso:"false", mensagem:"O Fiscal do contrato não pode ser o mesmo usuário definido como Fiscal de Serviço ou Multifilial."}` — regra responde mesmo sem parâmetro |
| `ds_fatcon_get_competencia` | 1 | | `{STATUS:"ERROR", CODE:"undefined"}` sem constraint |
| `dsProtheus_getContratosxFornecedores_restGet` (**a grade do portal**) | — | 36 ms | `{"content":{}}` — sem `columns`/`values` |
| `dsProtheus_getItensPlanilha_restGetAll` | — | 63 ms | `{"content":{}}` |
| `dsProtheus_getInfoPlanilhaxContrato_restGetAll` | — | | `{"content":{}}` |
| `dsProtheus_getPlanilha_restGetAll` | — | | `{"content":{}}` |
| `dsProtheus_getFiscaisPorTipoContrato` | — | | `{"content":{}}` (mapa dizia 500; hoje 200 vazio) |
| `ds_get_fiscalServico`, `ds_get_fiscalContrato` | — | | `{"content":{}}` |
| `ds_fatcon_get_info_medicoes`, `dsProtheus_getCronogramaFinanceiro` | — | | `{"content":{}}` |
| `dsProtheus_getCampoCombo_restGetAll` | 1 | | `{error:"Unexpected token: <"}` — o ERP devolveu HTML |
| `dsProtheus_getCompradores_restGetAll` | 1 | | `{error:"undefined"}` — conta sem matrícula de comprador (inalterado) |
| `dsProtheus_getGestorOrcamentario_restGet`, `dsProtheus_getSQB_restGetAll`, `dsProtheus_getProdxPlanContxContOrc_restGetAll` | 1 | | linha `error` (echo dos `fields` esperados) |
| `ds_getSolicsGerenciaCompras` | 1 | | `{ERRO:"Parâmetros insuficientes."}` |
| `dsProtheus_getContratos`, `dsProtheus_getFornecedores`, `dsFluig_getRateioSC` | — | | `{"content":{}}` — nomes sem sufixo não existem |

Amostra do contrato que aparece nas planilhas: `00001-2023-1101` filial `1101`, tipo `039 MANUT
SIST DE CLIMATIZAC EXAUS`, planilha `000001` (FIXA), fornecedor `04655972/0001`, `CN9_SITUAC=10`,
fiscal de serviço `andressa.oliveira@…`, fiscal de contrato `wesley.araujo@…`, CSE `claudineia.rocha@…`.

Os datasets que devolvem `{"content":{}}` foram remedidos **com constraint** — seção 3.1.

### 3.1 `{"content":{}}` significa "dataset não existe" — e a lista oficial confirma

**Controle:** `POST .../dataset/datasets` com `name: "ds_nome_que_nao_existe_qa_12345"` devolve
exatamente `{"content":{},"message":null}` (HTTP 200). E `GET /api/public/ecm/dataset/search?datasetId=<inexistente>`
devolve 500 `java.lang.NullPointerException` — a mesma resposta que `getContratosxFornecedores`,
`getItensPlanilha` e `getFiscaisPorTipoContrato` dão no `search`.

**Prova definitiva:** `GET /ecm/api/rest/ecm/dataset/list` responde para a sessão comum com a
lista completa dos datasets do tenant — **526 datasets, 379 custom** (10/09/2026). Conferindo nome a
nome:

| dataset que o widget do portal consome | no tenant |
|---|---|
| `dsProtheus_getContratosxFornecedores_restGet` (a **grade**) | **AUSENTE** |
| `dsProtheus_getItensPlanilha_restGetAll` (itens da SC) | **AUSENTE** |
| `dsProtheus_getInfoPlanilhaxContrato_restGetAll` (modal Planilhas) | **AUSENTE** |
| `dsProtheus_getPlanilha_restGetAll` | **AUSENTE** |
| `dsProtheus_getFiscaisPorTipoContrato` | **AUSENTE** |
| `dsProtheus_getCronogramaFinanceiro` | **AUSENTE** |
| `dsProtheus_getTipoContratos_restGetAll` | existe |
| `dsProtheus_getCampoCombo_restGetAll` | existe (mas o ERP responde HTML — `Unexpected token: <`) |
| `dsProtheus_getBranches/getProdutos/getRateiosContratos/getCentroCusto/getPrecoHistorico`, `dsFluig_getClasseValor` | existem |
| `dsFluig_postProcessesTransfer`, `dsFluig_postProcessesCancel` | existem |

Ou seja: **não é só a página WCM que falta — faltam os seis datasets que o widget chama**. Mesmo
que alguém publique a página, a grade e o modal de SC não montam sem eles. Isso muda a solicitação
ao cliente: "publicar a demanda de contratos" inclui datasets, não só a página.

Nomes parecidos que EXISTEM (e que a suíte nunca usou), sondados na seção 3.3:
`dsProtheus_getContratoxFornecedor_restGet` (singular), `dsProtheus_getInfoCompletaContrato_restGetAll`,
`dsProtheus_getInformaContratos_restGetAll`, `dsProtheus_getInformaPlanContratos_restGetAll`,
`dsProtheus_getMedicaoContrato_restGetAll`, `dsProtheus_getPlanContxFornecedor_restGetAll`,
`dsProtheus_getInfoContratosDelegacao`, `ds_fatcon_get_listaContratos`, `ds_fatcon_get_listaFornecedor`,
`ds_fatcon_get_busca_contratos`, `ds_fatcon_get_medicoes`, `ds_fc_getContratos`, `dsRevisaoContratos`,
`dsFluig_getProcFaturamentoSql_CASSI`.

### 3.2 O que responde COM constraint (medido)

Contrato de referência: `00001-2023-1101` / filial `1101` (o primeiro de `getInformaPlanxContrato`).

| chamada | resultado |
|---|---|
| `ds_get_fiscalServico` `[CNA_CONTRA, CNA_FILIAL]` | `{STATUS:"SUCCESS", RESPONSE:"andressa.oliveira@cassi.com.br"}` — 1,9 s |
| `ds_get_fiscalContrato` `[CN9_NUMERO, CN9_FILIAL]` | `{STATUS:"SUCCESS", RESPONSE:"wesley.araujo@cassi.com.br"}` |
| (outros nomes de constraint) | `{STATUS:"ERROR", RESPONSE:"Cannot read property \"cna_xfisca\" from undefined"}` — o nome da constraint é exato |
| `ds_fatcon_get_competencia` `[CNA_CONTRA, FILIAL]` | **14 competências** (`01-2025`…), `STATUS:"SUCCESS"`, `PAGAMENTO` true/false; via `datasetZoom` GET idem |
| `ds_fatcon_get_info_medicoes` `[CNA_CONTRA, FILIAL_CONTRATO, COMPETENCIA_ESCOLHIDA=08-2026, FILIAL_ESCOLHIDA]` | `STATUS:"SUCCESS"`, `RESPONSE` = JSON com `CND_CONTRA`, `CND_REVISA:"001"`, `PLANILHAS[{CXN_NUMPLA:"000001", CXN_VLSALD:21944.16, ITENS:[{CNE_PRODUT:"04000120", CNE_QUANT:1, CNE_VLUNIT:1567.44, …}]}]` — 7,8 s. **É a fonte de itens/quantidade/valor/saldo da planilha** que o modal "Detalhes da Planilha" e o modal de SC exibiam |
| `ds_fatcon_get_info_medicoes` com contrato inexistente | `{STATUS:"ERROR", RESPONSE:"{\"code\":\"404\",\"message\":\"Contrato 99999-2099-1101 não localizado.\"}"}` |
| `dsProtheus_getRateiosContratos_restGetAll` `[CNZ_CONTRA, CNZ_FILIAL]` | 23 linhas do contrato, `CNZ_PERC`, `CNZ_CC`, `CNZ_CLVL` |
| `dsProtheus_getFornecedores_restGetAll` `[A2_COD]` | 1 linha; `datasetZoom` com `A2_NOMECGC`/`pattern=04655972` também devolve |
| `dsProtheus_getContratos_restGetAll` `[CN9_NUMERO]` / `[CN9_SITUAC=05]` | filtra |
| `dsProtheus_getInformaPlanxContrato_restGetAll` `[CNA_CONTRA, CNA_FILIAL]` | filtra (3 revisões do contrato) |
| `dsProtheus_getItensPlanilha_restGetAll` com as constraints exatas do widget (`CorporateId, BranchId, CNB_FILIAL, CNB_CONTRA, CNB_REVISA`) | `{"content":{}}` — dataset ausente (3.1) |

Competências por contrato da filial 1101 (`ds_fatcon_get_competencia`): `00003-2022-1101` 27,
`00005-2023-1101` 49, `00013-2022-2601` 24, `00006-2022-1101` 8, `00006-2025-1101` 8,
`00001-2026-1101` 3, `0001-2023-1101` 1, `00001-2023-1101` 0 (sem constraint de revisão),
`00003-2024-1101` 0; `00005-2022-1101` e `00006-2022-3505` devolvem a sentinela *"Não foram
localizadas competencias a serem medidas para o contrato e revisão em questão."* — a linha
sentinela conta como registro, mesma armadilha do `No data found`.

**`dsProtheus_getContratos_restGetAll` é escopado por filial.** Sem constraint devolve 20 linhas,
todas `CN9_FILIAL=1101`. Com `[CorporateId=01, BranchId=3501]` devolve **55 linhas da filial 3501**
(numeração antiga, `000000000000008`…). `BranchId` sozinho, `CN9_FILIAL=3501` ou `sqlLimit` não
mudam nada — só o par `CorporateId+BranchId`. A "massa zero" do mapa era leitura da filial
default. A varredura das 71 filiais está na seção 3.4.

### 3.3 Datasets de contrato que EXISTEM e a suíte nunca usou (medido com constraint)

Todos aceitam o par `CorporateId=01` + `BranchId=<filial>` como escopo; sem ele caem na filial
default (1101). Constraints de campo ERP são aceitas junto.

| dataset | constraints medidas | devolve |
|---|---|---|
| `dsProtheus_getInfoCompletaContrato_restGetAll` | `[CorporateId, BranchId]` → 20; `[CorporateId, BranchId, CN9_NUMERO, CN9_FILIAL]` → **2 linhas (uma por revisão)** | CN9 completo + `CN1_DESCRI` (tipo) + `E4_TIPO/E4_COND` (condição de pagamento). `fields` esperados no echo de erro: `CN9_FILIAL, CN9_TPCTO, CN1_DESCRI, CN9_DTINIC, CN9_NUMERO, CN9_DTFIM, CN9_CLIENT, CN9_MOEDA, CN9_CONDPG, E4_*, CN9_CODOBJ, CN9_VLINI, CN9_VLATU, CN9_SALDO, CN9_REVISA, CN9_SITUAC…` — **é a "ficha" do modal Informações Complementares** |
| `dsProtheus_getInformaContratos_restGetAll` | `[CorporateId, BranchId]` → 20; `[CN9_NUMERO, CN9_FILIAL]` → 2 | só `CN9_NUMERO, CN9_FILIAL, CN9_REVISA, CN9_SITUAC, CN9_TPCTO, CN9_XFISCA, CN9_XAPCSE, CN9_XAPRCS` — as colunas da grade |
| `dsProtheus_getPlanContxFornecedor_restGetAll` | `[CorporateId, BranchId]` → 23; `+ CNA_FORNEC, CNA_LJFORN` → 5 | planilha × fornecedor: `CNA_FILIAL, CNA_CONTRA, CNA_NUMERO, CNA_REVISA, CNA_FORNEC, CNA_LJFORN, CNA_TIPPLA, CNA_VLTOT, CNA_SALDO, CNA_DTINI, CNA_DTFIM, A2_COD, A2_LOJA, A2_NOME, A2_NREDUZ, A2_CGC, A2_EMAIL` — **é o modal "Informações da Planilha" + "Detalhes da Planilha"** (Filial, Contrato, Planilha, Revisão, Cod. Fornecedor, Fornecedor, Loja, tipo, valor total, saldo, CNPJ) |
| `dsProtheus_getInformaPlanContratos_restGetAll` | `[CNA_CONTRA, CNA_FILIAL]` → 2 (11 s) | `CNA_*` + `CNA_XFISCA` (fiscal de serviço por planilha) |
| `dsProtheus_getMedicaoContrato_restGetAll` | `[CorporateId, BranchId]` → 300 | itens de medição `CNE_*` (`CNE_CONTRA, CNE_NUMMED, CNE_QUANT, CNE_VLUNIT, CNE_VLTOT, CNE_PEDIDO`) — constraint por contrato não aceita `CND_*` |
| `dsProtheus_getProdxPlanContxClasseValor_restGetAll` | `[CorporateId, BranchId]` → 300 | produto × classe de valor × conta (`B1_COD, CTA_CLVL, CTH_CLVL, CT1_CLORC…`) — fonte do `classeOrca/classeValor` do item |
| `ds_fatcon_get_listaContratos` | `[FORNECEDOR, LOJA]` ou `[CNA_FORNEC, CNA_LJFORN]` → 20 | `{STATUS, NUM_CONTRATO, CODIGO}` — contratos do fornecedor (o zoom de contrato do Faturamento) |
| `ds_fatcon_get_busca_contratos` | qualquer | `{STATUS:"SUCCESS", RESPONSE:"{total:0, items:[]}"}` — vazio em todas as variantes |
| `ds_fatcon_get_listaFornecedor` | qualquer | `{STATUS:"SUCCESS", RESPONSE:null}` |
| `ds_fatcon_get_medicoes` | `[CNA_CONTRA, FILIAL]` | `{STATUS:"ERROR", RESPONSE:"{code:404, message:\"Não foram localizadas medições para o Contrato informado.\"}"}` — inclusive para `00002-2025-3501`, que tem a medição 96437 aberta |
| `dsProtheus_getContratoxFornecedor_restGet` (singular) | 4 variantes | **0 linhas, sem colunas** em todas — não é o substituto da grade |
| `dsProtheus_getInfoContratosDelegacao` | 2 variantes | 0 linhas |
| `ds_fc_getContratos` | qualquer | `{SUCCESS:"ERRO", RESPONSE:"Unexpected token: c"}` |
| `dsRevisaoContratos` | 2 variantes | 0 linhas (mesmo achado do FSWTBC-4176) |
| `dsFluig_getProcFaturamentoSql_CASSI` | sem `fields` | `SQLSyntaxErrorException` — só funciona com a lista de `fields` que o Tracker envia |
| `dsFluig_getProcessoFaturamentoContratoSql` | `[]` | 100 linhas: `NUM_PROCES, DES_ESTADO, pw#status, START_DATE, NUM_SEQ_ESTADO…` — instâncias de FC lidas do banco do Fluig |
| `dsProtheus_getSolicitacoesCompras_restGetAll` | `[]` | 628 linhas `C1_*` (SCs do Protheus, com `C1_XNUMCT`, `C1_GERACTR`, `C1_FILENT`) |
| `dsProtheus_getClassesOrcamentarias_restGetAll` | `[]` | 4.098 `AK6_*` |
| `dsProtheus_getFornecedoresCompras_restGetAll` | `[]` | 300 (16,6 s) |
| `ds_filaMovimentacaoContratos` | `[]` | 4.707 registros do formulário de fila (136 s!) — não use sem constraint |
| `dsTipoContrato` | `[]` | `ServiceNotFoundException: ' SIGAJURI '` (é do jurídico) |

### 3.4 Varredura das 71 filiais — a massa de contratos EXISTE

`dsProtheus_getContratos_restGetAll` com `[CorporateId=01, BranchId=<Code de cada filial de getBranches>]`,
71 chamadas (10/09/2026, ~1 s cada):

| métrica | valor |
|---|---:|
| linhas (uma por revisão) | **1.932** |
| contratos distintos (`CN9_NUMERO|CN9_FILIAL`) | **861** |
| situação `05` (Vigente) — linhas / distintos | 564 / **564** |
| situação `10` | 1.070 |
| `07` / `06` / `08` / `02` / `01` / `11` / `04` / `09` | 130 / 64 / 47 / 26 / 20 / 5 / 5 / 1 |
| filiais com 0 contratos | 3513, 5305, 5308 |
| maiores | **5303: 868 linhas (219 vigentes)**, 2901: 87, 4301: 61, 3501: 55 |

**564 vigentes distintos** é o mesmo número que a suíte media na grade do ambiente antigo
(*"554 vigentes medidos em 30/08/2026"*, `utils/massa-contratos.js`). A base de contratos está
íntegra; o que sumiu foi a superfície que a lia. A afirmação do mapa ("contrato é zero") era a
filial default.

Nota de cautela: o código da situação vem cru (`05`, `10`…). O texto "Vigente"/"Finali" que a
grade mostrava saía de `dsProtheus_getCampoCombo_restGetAll`, que aqui devolve `Unexpected
token: <` — logo o **defeito D-08 (truncamento)** não é medível por dataset neste tenant.

## 4. Páginas de contrato que existem — o que mostram (medido)

### 4.1 `PORTAL_TRACKER_COMPRAS_CONTRATOS` — serve para ler medição/faturamento, não contrato

Combo *Filtrar por* com 9 visões; a de **Faturamento de Contratos** expõe os filtros *Fornecedor,
CNPJ/CPF Fornecedor Planilha, Loja, Filial Contrato, Filial Medição, Nº Contrato, Competência,
Nº Medição, Situação Medição, Nº Planilha, Aprovador CSE, Fiscal de Serviço, Fiscal de Contrato*.
Pesquisando `Nº do Processo Fluig = 96437`, a linha devolvida:

```
96437 | | ABERTA | Usuário Integrador | 10/09/2026 | 12:00:00 | Busca Informações do Contrato |
System:Auto | MICHELLE MATEUS FALCIANO | 3501 | 3501 - UNIDADE CASSI SAO PAULO - SP |
00002-2025-3501 | 09-2026 | 000236 | 000009 | 04727313000105 | 0001 | fabricasoftware@totvs.com.br ×3
```

Fonte: `POST datasets {name:"dsFluig_getProcFaturamentoSql_CASSI", fields:[numProcesso,
zoomFornecedor, zoomNumContrato, zoomCompetencia, numMedicao, zoomNumPlanilha, emailAprovadorCSE,
emailFiscalServico, emailFiscalContrato, …]}` — SQL sobre o **formulário do Fluig**, não sobre a
CN9. O Tracker lista contrato só na medida em que existe uma medição (FC) sobre ele. Sem filtro
(status *Todos*) a pesquisa não devolveu linhas em 25 s — não medido além disso.

Na carga, o Tracker chama `dsp_filiaisProtheusSync` e `dsProtheus_getSQB_restGetAll` (este responde
`error: "Unexpected token: c"`).

### 4.2 `delegacao-fiscais-de-contratos-servicos` — a grade de contratos×planilhas×fiscais existe, mas o backend responde 401

Widget PO-UI: heading *Delegação de Fiscais*; filtros *Filial Contrato, Contrato, Filial
Planilha, Planilha, Multifilial, Data Início, Data Fim, Tipo de Contrato*; botões *Filtrar* e
*Atribuir em lote*; colunas **Filial Contrato, Contrato, Filial Planilha, Planilha, Desc.
Planilha, Filial Medição, Data Início, Data Fim, Tipo Contrato, Fiscal Contrato, Fiscal Serviço,
Fiscal Multifilial**; estado vazio *"Nenhum dado encontrado"*.

Ao clicar *Filtrar* (com e sem filial), a tela mostra *"Ops, algum erro aconteceu: Http failure
response for …/java_generico_protheus/tbc/api/framework/v1/genericQuery?FilialFilter=false&tables=CN9,CNA,CN1,CPD&…&where=…CN9_SITUAC = '05'…: 401 OK"*.
A query é `CN9 LEFT JOIN CNA LEFT JOIN CN1 LEFT JOIN CPD` com `CN9_SITUAC='05'` — exatamente a
grade de contratos vigentes — mas a aplicação `java_generico_protheus` recusa a sessão (401).
Os filtros de filial consultam `GET /api/public/ecm/dataset/search?datasetId=dsProtheus_getBranches_restGetAll&filterFields=Code,1101`
e funcionam. **Não serve como via alternativa enquanto o 401 persistir** — é um segundo item
para o cliente, distinto da página ausente.

### 4.3 `PORTAL_ACOMPANHAMENTO_ALCADAS` — vazio

Renderiza só os headings *Acompanhamento de Geração de Aprovações de Alçadas* e *Acompanhamento de
Geração de Pedidos/ Contratos*. Cada bloco chama `POST /api/public/2.0/authorize/client/invoke`
com `serviceCode: FLUIG_API_OAUTH` para `/process-management/api/v2/activities?active=true&processId=wf_solicitacao_compras&stateSequence=201…`,
e o Fluig responde `ERROR CALLING SERVICE: FLUIG_API_OAUTH … HTTP/1.1 401 Unauthorized`. Nada é
listado. Não toca contrato.

### 4.4 `portal_copia_solicitacao` (DRAFT) — abre mesmo em rascunho

*Cópia de Solicitação de Compras*: filtros Nº Fluig / Nº SC / Nº Cotação / Tipo (Todos, Contrato,
Pedido) / Filial (71) / datas; colunas Nº Fluig, Nº SC, Status, Solicitante, Filial, Cotação;
botões Consultar e *Criar cópia*; inputs ocultos `sc_processId=wf_solicitacao_compras`,
`sc_targetState=6`. Não lista contrato; copia SC existente. Não exercitado além da carga.

### 4.5 Formulário `wf_faturamento_contratos` — abre completo

`pageworkflowview?processID=wf_faturamento_contratos` monta o formulário inteiro (Fornecedor, Nº do
Contrato, Revisão, Filial do Contrato, Competência, Filial da Medição, Tipo, Situação, Datas,
Nº da Medição, Nº da Planilha, Objeto, Aprovação Prévia CSE, Fiscal de Serviço, Fiscal de
Contrato). Na carga chama `ds_protheus_getMatriculaTitular_rest` com o e-mail da conta e recebe
`{error:"Erro 401 --> Funcionario não localizado atraves do email fabricasoftware@totvs.com.br"}`
— o formulário monta assim mesmo.

### 4.6 Instâncias de Faturamento (medido pela API v2)

`GET /requests?processId=wf_faturamento_contratos&pageSize=200&page=N`: mais de **8.000**
instâncias (41 páginas lidas, `hasNext` ainda `true`); nas 8.000 lidas, 2.229 `CANCELED` e 5.771
`FINALIZED`, nenhuma `active`. Os parâmetros `status=ACTIVE`/`active=true` são ignorados.

`GET /tasks?processId=wf_faturamento_contratos`: 1.107 instâncias com tarefa `NOT_COMPLETED`
(880 na seq. 28 *Realizar Medição do Contrato*, 216 na 25, …) — **mas as tarefas estão obsoletas**:
as 4 primeiras conferidas em `/requests/{id}` são `CANCELED`/`active:false` (endDate
2026-09-09 10:25). Só **96437** é `OPEN`/`active:true` — criada em 10/09/2026 pelo `TOTVS-FS`
(a própria suíte, `ciclo-faturamento`), contrato `00002-2025-3501`, filial 3501, medição
`000236`, planilha `000009`, `saldoContrato 62732.26`, `controlField GRAVA_MED`, parada na
seq. 88 *Busca Informações do Contrato*. Portanto **criar medição funciona neste tenant** quando
há fornecedor+contrato+competência com saldo — e a massa dessa medição veio da filial 3501, não
da 1101.

## 5. Duas medições que decidem a classificação

**5.1 O formulário padrão da SC não expõe o vínculo com contrato.** `pageworkflowview?processID=wf_solicitacao_compras`
montou (1ª tentativa, 10/09 ~14h50) e tem no DOM `_tipoSolicitacao` (opções *Renovação Contratual,
Aditivo Contratual, Nova Solicitação*), `nrContrato`, `revisaContrato`, `_nrContrato`, `_revisaContrato`,
`suplementaContratoSim/Nao`, `buyerTipoCompra` (*Pedido/Contrato*), `tbfornalc_numContrato` — **todos
`offsetParent = null` (ocultos)** na etapa Início. Só o widget do portal preenchia esses campos.
(Achado lateral: a opção *"Renovação Contratual"* — nomenclatura que FSWTBC-5233 mandou aposentar —
segue no `select` oculto do formulário.)

**5.2 Não existe molde de SC vinculada a contrato na base.** `GET /requests?processId=wf_solicitacao_compras`
(300 mais recentes: 195 CANCELED, 42 OPEN, 63 FINALIZED) + `expand=formFields` uma a uma:
`tipoSolicitacao` = *Nova Solicitação* 101, *Nova Contratação* 12, vazio 187; **`nrContrato`
preenchido em 0 de 300**; as 12 *Nova Contratação* (ex.: 96438, criada hoje) não têm nenhuma
chave com "contrat" preenchida. Logo um `POST /start` direto com "SC a partir de contrato" não
tem modelo para copiar — teria de ser montado à mão, e aí o teste passa a afirmar sobre o payload
que a suíte escreveu, não sobre o que o produto envia.

**5.3 Google Analytics.** `/portal/p/1/home` dispara 2 requisições (`googletagmanager.com/gtag/js?id=G-F0FT6D1NQG`
e `google-analytics.com/g/collect?…tid=G-F0FT6D1NQG`). O teste LGPD não precisa do portal.

## 6. Teste a teste — (a) reescrevível por outra via · (b) depende irremediavelmente da página · (c) incerto

Critério conservador: **(a)** só quando a afirmação central do teste sobrevive na outra via **e**
eu medi que a via entrega o dado; **(b)** quando a afirmação é sobre a grade/modal/alerta/payload
do próprio widget (que não existe aqui, e cujos datasets também não existem); **(c)** quando há
uma via parcial que muda o que o teste prova, ou que não foi disparada.

| # | Teste (arquivo:linha) | Classe | Via proposta / motivo |
|---|---|---|---|
| 1 | acesso-portal:16 CT-ACC-01-H listar contratos | **b** | grade + gate por `colleagueGroup` vivem no widget. (Dado existe: 564 vigentes por dataset, §3.4) |
| 2 | acesso-portal:32 CT-ACC-01-H colunas na ordem | **b** | cabeçalhos do DataTables |
| 3 | acesso-portal:58 CT-ACC-01-S1 negar acesso | **b** | lógica `hasAccess()` do widget |
| 4 | acesso-portal:77 CT-ACC-01-S2 falha ≠ ausência | **b** | idem |
| 5 | grade-contratos:22 CT-ACC-02-H três ícones | **b** | ícones do widget |
| 6 | grade-contratos:36 filtrar por número | **b** | busca do DataTables |
| 7 | grade-contratos:53 FSWTBC-4898 ações em toda linha | **b** | idem |
| 8 | grade-contratos:102 FSWTBC-4073 sem duplicata | **b** | a regra "uma linha por contrato, maior revisão" é `mapaUltimaRevisao` do widget; o dataset devolve uma linha por revisão por desenho |
| 9 | grade-contratos:141 FSWTBC-4986 filtro por filial | **b** | filtro da grade. (`getContratos [BranchId=X]` devolve só `CN9_FILIAL=X` — medido, mas é outro mecanismo) |
| 10 | grade-contratos:182 CT-ACC-02-S1 @bug situação truncada | **b** | o texto da situação vinha de `getCampoCombo`, que aqui responde `Unexpected token: <`; D-08 não é medível por dataset |
| 11 | modais:55 CT-ACC-02-H ficha = linha da grade | **b** | coerência grade↔modal |
| 12 | modais:77 fiscais identificados (FSWTBC-1702/4987) | **a** | `ds_get_fiscalContrato [CN9_NUMERO, CN9_FILIAL]` → `wesley.araujo@…`; `ds_get_fiscalServico [CNA_CONTRA, CNA_FILIAL]` → `andressa.oliveira@…`; e `CN9_XFISCA`/`CNA_XFISCA` em `getInfoCompletaContrato`/`getInformaPlanContratos`. Afirmar e-mail válido e coerente entre as duas fontes; perde-se só o formato `Nome (email)` do modal |
| 13 | modais:99 máscara monetária pt-BR (FSWTBC-4982) | **b** | a máscara é apresentação do modal (o dado `CN9_VLINI/VLATU/SALDO` existe cru) |
| 14 | modais:126 CNPJ mascarado + código/loja (FSWTBC-4983/4076) | **c** | dado medido em `getPlanContxFornecedor` (`A2_CGC=04655972000175`, `CNA_FORNEC/CNA_LJFORN`); a máscara não é verificável |
| 15 | modais:147 Status da Integração GCT / Erro de Integração | **c** | não identifiquei coluna equivalente em `getInfoCompletaContrato` (CN9_X* presentes: `XAPRCS, XAPCSE, XFISCA, XSC, XCOT, XREGP, XCTORI, XRVORI, XSCORI`) — **não medido** |
| 16 | modais:166 CT-ACC-02-S1 @bug truncado na ficha | **b** | igual ao 10 |
| 17 | modais:206 lista de planilhas com colunas (FSWTBC-4068/4078) | **a** | `dsProtheus_getPlanContxFornecedor_restGetAll [CorporateId, BranchId]` traz Filial, Contrato, Planilha, Revisão, Cod. Fornecedor, Fornecedor (`A2_NOME`), Loja — 23 linhas na 1101; com `CNA_FORNEC/CNA_LJFORN` filtra (5). Afirmar colunas e pertencimento ao contrato |
| 18 | modais:244 detalhe da planilha (tipo, valor, saldo) | **a** | mesma fonte: `CNA_TIPPLA=001`, `CNA_VLTOT=40753.44`, `CNA_SALDO=26646.48` (00001-2023-1101/000001); + itens/saldo em `ds_fatcon_get_info_medicoes` (`CXN_VLSALD`, `CNE_QUANT`, `CNE_VLUNIT`). Perde-se a máscara |
| 19 | modais:295 FSWTBC-4820 identificação não em branco | **a** | mesma fonte: `CNA_FILIAL, CNA_CONTRA, CNA_NUMERO, CNA_TIPPLA, CNA_FORNEC, A2_CGC, A2_NOME` todos preenchidos na linha medida |
| 20–25 | modal-solicitacao-compra:19/36/50/65/108/141 | **b** | o modal de SC é do widget; no formulário padrão os campos de contrato são ocultos (§5.1) |
| 26–29 | validacoes-solicitacao:32/48/65/85 | **b** | validação client-side do modal |
| 30 | erros-no-start:34 CT-ACC-05-S2 | **b** | toast/reabilitação do modal |
| 31 | erros-no-start:67 @bug D-01 aviso de transferência | **b** | idem |
| 32–34 | indisponibilidade-protheus:41/54/144 | **b** | alertas do modal sobre `getItensPlanilha` — dataset que nem existe aqui |
| 35 | criacao-solicitacao:142 @destrutivo @bug D-01 | **c** | exigiria `POST /start` direto com payload de SC-de-contrato; não há molde (§5.2) e o `targetState` passaria a ser o que a suíte escreve, não o que o widget envia |
| 36 | criacao-solicitacao:254 CT-ACC-06-S1 item zerado | **b** | depende de `getItensPlanilha` (ausente) e do montador de itens do widget |
| 37 | criacao-solicitacao:323 CT-ACC-04-S6/D-10 servidor recusa `tipoSolicitacao` vazio | **c** | é assertion sobre o **servidor**: dá para disparar com molde de SC comum (`expand=formFields` de 96438, 194+ campos). **Não disparado** (destrutivo) |
| 38 | criacao-solicitacao:453 CT-E2E-12-S1 alerta de duplicidade | **b** | alerta ao reabrir o modal |
| 39 | criacao-solicitacao:544 CT-ACC-06-S2 cascata de quantidade | **b** | idem 36 |
| 40 | criacao-solicitacao:649 FSWTBC-4581 cancelar SC própria em Início | **c** | o cenário é da Central + `cancelInstances`; a massa "SC em Início" viria de `POST /start` com `targetState: 6` e molde de SC comum. **Não disparado** |
| 41 | payload:65 @bug D-01 targetState/assignee | **b** | payload construído pelo widget |
| 42–44 | payload:106/163/209 D-02 valor multiplicado | **b** | idem |
| 45 | payload:268 @bug D-04 campos chumbados | **b** | idem |
| 46 | payload:324 valores coerentes | **b** | idem |
| 47 | payload:358 rateio soma 100% | **c** | dado do ERP medido: `getRateiosContratos [CNZ_CONTRA, CNZ_FILIAL]` → `CNZ_PERC` (100 no 00001-2023-1101; 46,1 + … no 00006-2022-1101). Vira "rateio cadastrado no contrato fecha 100%", não "o payload da SC herda o rateio" |
| 48 | payload:388 @bug classeValor vazio | **b** | payload do widget (fonte do dado existe: `getProdxPlanContxClasseValor`) |
| 49 | payload:414 FSWTBC-4153 duplo clique | **b** | botão do modal |
| 50 | payload:483 @bug CT-ACC-04-S5 nrContrato incoerente | **b** | manipula o input do modal |
| 51–53 | ciclo-gestor:36/109/155 @destrutivo @bug | **c** | criação via `POST /start` direto (como `scripts/semear-massa.mjs`) daria a SC, mas a afirmação de 51 (estado/dono ao nascer) passa a medir a suíte; 52/53 esbarram no mesmo bloqueio de hoje (SC não passa da 233, CLAUDE.md) |
| 54 | ciclo-correcao-reenvio:243 CT-CMP-08-H | **c** | já usa `POST /start` direto; só o molde vinha da captura do widget — substituível por `expand=formFields` de SC existente, sem vínculo de contrato (§5.2) |
| 55 | ciclo-faturamento:50 CT-FAT-01-H @destrutivo | **a** | massa por dataset em vez da grade: contrato vigente = `getContratos [CorporateId, BranchId]` filtrando `CN9_SITUAC=05` (564); fornecedor = `getPlanContxFornecedor` (`CNA_FORNEC`, `CNA_LJFORN`, `A2_CGC`, `A2_NOME`); competência = `ds_fatcon_get_competencia [CNA_CONTRA, FILIAL]`; saldo = `ds_fatcon_get_info_medicoes`. O formulário abre (§4.5) e a medição **96437 foi criada hoje por este caminho** (§4.6) |
| 56 | validacoes-faturamento:104 CT-FAT-02-S2 | **a** | idem 55; `descobrirCompetenciaBloqueada` já é por dataset |
| 57 | validacoes-faturamento:206 CT-FAT-02-S1 | **a** | idem 55 |
| 58 | validacoes-faturamento:251 CT-FAT-02-S4 | **a** | idem 55 |
| 59 | validacoes-faturamento:395 FSWTBC-2143 rótulos de competência | **a** | `ds_fatcon_get_competencia` direto: 14/27/49/24/8/8/3/1 rótulos em `MM-AAAA` nos contratos da 1101 (+ sentinela textual em 2) — só precisa da lista de contratos por dataset |
| 60 | integracao-protheus-grade-contratos:19 CT-INT-01-H | **c** | o dataset da grade não existe; smoke equivalente de dado: `getContratos` (20/1101, 564 vigentes) + `getTipoContratos` (114) respondem com `columns`/`values` — mas "a grade renderiza" some |
| 61 | integracao-protheus-grade-contratos:65 CT-INT-01-S1 | **b** | alerta `ERRO:` do widget |
| 62 | lgpd-envio-google-analytics:22 CT-SEG-06-S1 @bug | **a** | usar `/portal/p/1/home` como veículo: 2 requisições a GA medidas (§5.3) |
| 63 | smoke-integracao-erp:32 FSWTBC-1985 | **c** | Tracker e Gerência existem; a sonda do Acompanhamento vira `getContratos`. A pesquisa do Tracker com *Abertos* não devolveu linha em 25 s na minha medição (só a busca por nº funcionou) — **não fechado** |
| 64 | erros-de-console:176 CT-PLT-06-S1 | **b** | mede o bundle do próprio widget |

**Totais: (a) 10 · (b) 42 · (c) 12.**

## 7. Conclusão

1. **A página não é a única coisa ausente.** Os seis datasets que o widget consome
   (`getContratosxFornecedores_restGet`, `getItensPlanilha`, `getInfoPlanilhaxContrato`, `getPlanilha`,
   `getFiscaisPorTipoContrato`, `getCronogramaFinanceiro`) **não estão publicados** — provado por
   controle com nome inexistente e pela lista `/ecm/api/rest/ecm/dataset/list` (526 datasets). O
   pedido ao cliente é "a demanda de contratos inteira: página + widget + datasets", não só a página.
2. **A massa de contratos existe e é grande**: 861 contratos, 564 vigentes, em 68 filiais — o mesmo
   volume do ambiente antigo. `getContratos` só parece vazio porque é escopado por `BranchId` (default
   1101) e o mapa mediu a filial default.
3. **10 testes têm outra via medida** (a): os 5 de Faturamento (massa por dataset em vez da grade —
   e a medição 96437 de hoje prova que o caminho está vivo), 4 de planilhas/fiscais como testes de
   dado sobre `getPlanContxFornecedor` + `ds_get_fiscal*`, e o LGPD trocando de veículo.
4. **42 dependem do widget** (b): grade, modais, validações, alertas, payload do `/start`, console do
   bundle. Sem widget não há comportamento a afirmar — e sem os datasets, publicar a página sozinha
   não os traz de volta.
5. **12 incertos** (c): os destrutivos de ciclo (SC via `POST /start` direto muda o que se prova; não
   há molde com contrato na base), rateio/CNPJ/GCT como teste de dado, e dois smokes parciais.
6. Duas superfícies novas que o mapa não conhecia e que também estão quebradas neste tenant:
   `delegacao-fiscais-de-contratos-servicos` (grade CN9×CNA×CN1×CPD de vigentes, backend
   `java_generico_protheus` responde **401**) e `PORTAL_ACOMPANHAMENTO_ALCADAS` (serviço
   `FLUIG_API_OAUTH` responde 401). Valem como itens separados para o cliente.

Nada nesta investigação alterou teste ou Page Object; os scripts `.alt-*` foram removidos.
