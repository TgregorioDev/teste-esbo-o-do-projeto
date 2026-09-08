<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# Compras

Casos de teste do Protheus — registrados para execução futura no ERP.

| | |
|---|---|
| Casos neste arquivo | 6 |
| Verificados em tela | 0 total · 0 parcial · 6 não |

> **Como ler.** Estes casos **não são executáveis no Fluig** — o efeito do defeito só aparece
> no Protheus. Estão escritos por completo, do ponto de vista de quem for executá-los no ERP,
> para quando o projeto de testes cobrir o Protheus. Nenhum foi verificado em tela.

---

## CT-FSWTBC-1279  (protheus · Concluído)

**Título:** Gerar e manter um pedido de compras no Protheus 12.1.2410 a partir de uma SC integrada, sem erro de rotina

**Origem:** FSWTBC-1279 — "Erro na base 2410 no pedido de compras". Só título. Primeiro registro de problema atribuído à release 2410, dois meses antes da virada oficial (FSWTBC-1982); escalado à TOTVS e parado 174 dias até o mutirão, fechado sem retorno do chamado. Caso escrito como **caracterização de caminho** do pedido na 2410.

**Módulo/Rota:** Protheus → **SIGACOM** → *Atualizações › Pedidos › Pedidos de Compra* (**MATA121**) e *Solicitações de Compra* (**MATA110**); *Cotações* (**MATA150**). Contraprova no Fluig: SC → campos **Nº Pedido** / *Pedido/Contrato foi Gerado?* e Histórico (*Aguarda Geração do Pedido/Contrato* → *Pedido/Contrato foi Gerado?*).

**Pré-condições**
- Base na release **12.1.2410** (ou superior), RPO e dicionário atualizados.
- SC integrada pelo Fluig com *Nº da Solicitação ERP* preenchido e cotação vencedora definida (o pedido nasce da cotação — MATA150 → MATA121).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: a mensagem de erro da rotina de Pedido de Compras (MATA121) na release 2410`. Sem credencial do Protheus.

**Passos**
1. No ERP, abrir **MATA121** e localizar o pedido gerado a partir da SC/cotação escolhida (filtro pelo nº da SC em `C7_NUMSC`).
2. Acionar **Visualizar** e depois **Alterar**; percorrer as pastas de itens e totais; confirmar sem alteração.
3. Acionar **Incluir** um pedido manual com um item, fornecedor e condição de pagamento válidos; confirmar.
4. Verificar `error.log`/console do AppServer durante os passos 2–3.
5. Contraprova no Fluig: abrir a SC de origem → aba *Formulário* → **Nº Pedido** preenchido e *Pedido/Contrato foi Gerado?* = **Sim**; aba *Histórico* com `Integração executada com sucesso`.

**Resultado esperado**
- Passos 2–3: rotina abre, grava e não emite *help* de erro nem *THREAD ERROR*.
- Passo 4: sem stack de erro atribuído a MATA121/MATA150.
- Passo 5: **Nº Pedido** da SC igual ao `C7_NUM` do ERP.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro ao abrir/gravar o pedido de compras na base 2410 — mensagem exata `<não documentado>`; no Fluig a SC pararia em *Aguarda Geração do Pedido/Contrato* ou em *Correção* sem **Nº Pedido**.

**Severidade:** Média *(bloqueia a compra; sem risco financeiro direto)*

**Preparação de massa:** uma SC do Fluig já com pedido gerado (para os passos 1–2 e 5) — a instância 112961 tem `pedidoContratoGerado = Sim`, mas é de contrato, não de pedido; o executor deve escolher no Tracker (*Filtrar por* = Solicitação de Compras, *Status* = Finalizados) uma SC de *Tipo de Compra* = Pedido. Para o passo 3, fornecedor e produto ativos na filial.

**Verificado em tela:** NÃO
**Módulo ERP:** `Compras`
**O que foi verificado:** só a contraprova: o formulário da SC expõe `numPedido`, `numPedidoCompras`, `pedidoContratoGerado` (dataset) e os rótulos **Nº Pedido\*** / *Pedido/Contrato foi Gerado?* (instância 112855, modo leitura); o Histórico mostra *Aguarda Geração do Pedido/Contrato* e *Pedido/Contrato foi Gerado?*. ERP não aberto.
**Divergências encontradas:** nenhuma (ticket sem conteúdo).
**Dados/massa usados:** nenhum — não submetido; leitura de 112855/112961.

---

## CT-FSWTBC-1495  (protheus · Concluído)

**Título:** Incluir grupos de produtos para um fornecedor cuja loja não é a primeira e confirmar que o vínculo é gravado na loja informada

**Origem:** FSWTBC-1495 — "SD 758185 - Erro no cadastro de fornecedor na inclusão dos grupos de produtos" (conflito com os grupos vindos do SOC). Causa-raiz por debug: no modelo *Grupo de Produto × Fornecedor*, ao informar o código do fornecedor a validação padrão **`A065GruFor()`** **reposicionava a SA2 no fornecedor da primeira loja**, ignorando a loja informada. Correção: `SetValue` → `LoadValue` no modelo, para não disparar as validações. Aviso do próprio ticket: *"é o mesmo fonte que integra o SOC"* (**UCOMA007/UCOME007**). Contorno registrado: remover o grupo e cadastrar manualmente pelo Protheus.

**Módulo/Rota:** Protheus → **SIGACOM** → *Atualizações › Cadastros › Fornecedores* (**MATA020**) → fornecedor/loja → **Grupos de Produto × Fornecedor** (rotina padrão **MATA065** / modelo customizado **UCOMA007**, chamado pelo SOC via **UCOME007**). Entrada alternativa: Fluig → **Cadastro de Fornecedor** (256830) → grade **Grupos de Produtos** (`tbGruposProdutos`, zoom `dts_getGruposProduto`, campo *Grupos*) → *Integrar com ERP (Criar Fornecedor)* → *Verificar Integração*.

**Pré-condições**
- Fornecedor com **duas ou mais lojas** na SA2 (mesmo CNPJ raiz), ex.: loja `0001` e `0002`.
- Grupo de produto cadastrado (SBM).
- Para o caminho SOC: a área responsável pelo SOC alinhada (o ticket exige validar com ela antes de mexer no fonte).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: o registro Grupo × Fornecedor gravado com a loja informada (não com a primeira loja)`. Sem credencial do Protheus. No Fluig a conta de QA pode abrir o formulário, mas a grade de grupos é somente leitura (sem botões de incluir/excluir) e a conclusão do cadastro exige credencial de fornecedor.

**Passos**
1. Em **MATA020**, localizar o fornecedor com loja `0002`; anotar `A2_COD/A2_LOJA`.
2. Abrir *Grupos de Produto × Fornecedor* (MATA065/UCOMA007) e **Incluir**: informar fornecedor = `A2_COD`, **loja = `0002`**, grupo = um grupo válido; confirmar.
3. Consultar a tabela do vínculo (browse/SQL) pelo fornecedor: ler a loja gravada.
4. Repetir os passos 2–3 pela via do SOC (`UCOME007`), se o time do SOC puder disparar um cadastro de teste.
5. Repetir para a loja `0001`, para confirmar que o caso "primeira loja" continua funcionando.
6. Contraprova opcional no Fluig: abrir *Cadastro de Fornecedor* de uma instância existente que tenha *Grupos de Produtos* preenchidos e conferir no ERP a loja do vínculo.

**Resultado esperado**
- Passo 2: sem crítica de duplicidade nem de fornecedor inexistente; a validação não reposiciona a SA2.
- Passo 3: registro gravado com **loja `0002`** — exatamente a informada.
- Passo 4: mesmo resultado pelo SOC; nenhum grupo "vazado" para a loja `0001`.
- Passo 5: loja `0001` gravada normalmente.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O vínculo é gravado na **primeira loja** do fornecedor (ou é recusado por já existir nela), independentemente da loja informada; cadastro vindo do SOC entra em conflito com o cadastro manual.

**Severidade:** Média *(cadastro incorreto; contorno manual existe; toca integração com o SOC)*

**Preparação de massa:** um fornecedor com duas lojas em ambiente de teste (criado pelo executor em MATA020 com prefixo `QA` na razão social — cadastro de fornecedor não tem exclusão simples, então registrar o código) e um grupo de produto. A automação do Fluig não cria fornecedor com segunda loja.

**Verificado em tela:** NÃO
**Módulo ERP:** `Compras`
**O que foi verificado:** só a entrada no Fluig: o HTML publicado do form 256830 tem a grade **Grupos de Produtos** (`tbGruposProdutos`, `noaddbutton`/`nodeletebutton`) com zoom `ztxt_gruposProduto_infForn` → dataset `dts_getGruposProduto` (`displayKey: GRUPO`, seleção máxima 1). `dsProtheus_getGrupoProdutosFornecedor_restGetAll` **não existe** (500 NPE). ERP não aberto.
**Divergências encontradas:** o formulário do Fluig limita a **um** grupo por fornecedor (`maximumSelectionLength: 1`) e não tem loja como entrada — o cenário "loja ≠ primeira" só é construível no ERP ou pelo SOC.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1604  (protheus · Concluído)

**Título:** Classificar um documento de entrada com frete e conferir que o valor do frete e o custo dos itens saem iguais ao informado

**Origem:** FSWTBC-1604 — "[Suporte Abril/2025] Documento de entrada com valor errado de frete na classificação"; **sem descrição e sem análise** (fechado no mutirão de 13/05). Caso escrito como **caracterização de caminho** (§5-D). Tema correlato ao FSWTBC-336 (casas decimais, campo de frete).

**Módulo/Rota:** **Protheus → SIGACOM → Atualizações → Movimentos → Documento de Entrada (MATA103)** — pré-nota → **Classificar**; cabeçalho *Valor Frete* (`F1_FRETE`), item *Vlr. Frete* (`D1_VALFRE`), custo do item (`D1_CUSTO`); consulta em *Movimentos → Doc. Entrada* e no Kardex (MATA460/relatório de custo).

**Módulo ERP:** `Compras`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGACOM e a uma filial de homologação com fornecedor, produto e TES de entrada com frete.
- Pedido de compra de homologação com 2 itens de valores diferentes (para verificar o rateio do frete).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: F1_FRETE/D1_VALFRE e custo do item no documento classificado; documento de entrada não passa pelo Fluig`

**Passos**
1. MATA103 → incluir pré-nota a partir do pedido; no cabeçalho informar *Valor Frete* = **R$ 100,00** (dois itens: R$ 300,00 e R$ 700,00).
2. Confirmar a pré-nota; anotar `F1_FRETE` e `D1_VALFRE` de cada item.
3. Classificar o documento (MATA103 → *Classificar*), sem alterar o frete.
4. Após a classificação, reabrir o documento e ler *Valor Frete* do cabeçalho e *Vlr. Frete* de cada item; consultar o custo do item no Kardex.
5. Repetir com frete de valor com centavos "quebrados" (ex.: R$ 33,33) para verificar arredondamento do rateio.

**Resultado esperado**
- Passo 4: `F1_FRETE` continua **100,00** após a classificação; `D1_VALFRE` rateado proporcionalmente ao valor dos itens (**30,00** e **70,00**); soma dos fretes dos itens = frete do cabeçalho; custo do item = valor + frete rateado (conforme a TES).
- Passo 5: diferença de arredondamento absorvida em um item, soma exata ao cabeçalho.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Valor de frete **diferente do informado** após a classificação (`<não documentado>` qual — o ticket não traz o valor); custo dos itens distorcido.

**Severidade:** Alta *(custo do estoque/despesa contabilizada errada)*

**Preparação de massa:** pedido de compra e pré-nota de homologação criados pelo próprio executor no SIGACOM; TES com "Atualiza custo = Sim" e frete configurado.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — o único campo de frete que o Fluig conhece é `CNE_XFRETE` na medição (`ds_fatcon_get_info_medicoes`, valor 0 no E01-2025-2101); documento de entrada não é exposto.
**Divergências encontradas:** nenhuma — ticket sem conteúdo.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-1820  (protheus · Concluído)

**Título:** Exercitar a rotina de análise de cotação do UCOME024 até a linha que limpa o filtro e confirmar que não há função inexistente em runtime

**Origem:** FSWTBC-1820 — "Correção do DBClearFilter no Fonte UCOME024.TLPP": linha 334 chamava **`DBCleanFilter()`** — função que **não existe** em ADVPL/TLPP (o correto é `DBClearFilter()`). Só estoura em runtime, quando a linha é alcançada, o que explica ter chegado à produção. Acionado pelo cliente via Teams; correção com branch, PR e patch `UCOME024TLPP.ptm`.

**Módulo/Rota:** **Protheus → `UCOME024.TLPP`** (ExecBlocks de Compras: `fValorProposta`, `fAprovado`/`fMesmoVencedor`, `analyzeQuote` — chamado pelo **job da fila ZZY** `gravaVencedor` e pela API de cotação) → errorlog/console.log do AppServer. Eco indireto no Fluig: **Logs Protheus → Solicitacoes ZZY** (`Qtd T.Env Fl`) e SC parada em *Aguarda Geração Alçadas (309)*.

**Módulo ERP:** `Compras`

**Pré-condições**
- Credencial no Protheus com acesso ao errorlog/console.log e ao fonte compilado (para confirmar a data do `UCOME024` no RPO — o FSWTBC-4234 mostrou TST × PRD com datas diferentes).
- Cotação de homologação com vencedor definido, no ponto de gerar alçada (é o caminho que executa o `UCOME024`).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: errorlog "variable/function DBCLEANFILTER does not exist" e job da fila abortado; o Fluig só veria a consequência (SC presa na 309), não a causa`

**Passos**
1. `grep -i DBCleanFilter` sobre o fonte da branch/patch a aplicar — deve haver **zero** ocorrências (análise estática, antes do deploy).
2. Anotar a posição atual do errorlog.
3. Disparar o fluxo que chama o `UCOME024` (definição de vencedor de cotação → geração de alçada via fila ZZY), para uma cotação `QA`.
4. Ler o errorlog e o console.log após o processamento do job.
5. Logs Protheus → *Solicitacoes ZZY*: localizar o registro da cotação; ler `Status` e `Qtd T.Env Fl`.

**Resultado esperado**
- Passo 1: zero ocorrências.
- Passo 4: nenhum `DBCLEANFILTER` (nem "function not found"/"variable does not exist") no errorlog; alçada gerada.
- Passo 5: registro processado (`S`), `Qtd T.Env Fl` = 1 (sem retentativa).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Errorlog `DBCLEANFILTER` / função inexistente na linha 334 do UCOME024; job da fila aborta; SC fica em *Aguarda Geração Alçadas* e o contador de retry sobe.

**Severidade:** Alta *(alçada não gerada = compra parada; erro silencioso para o usuário)*

**Preparação de massa:** cotação `QA` com vencedor, criada por comprador de homologação (a conta de QA não tem matrícula de comprador — §5-C); acesso ao errorlog pelo administrador do Protheus.

**Verificado em tela:** NÃO
**O que foi verificado:** só o eco: Logs Protheus aberto (abas *Erros CV8 / Solicitacoes ZZY / Medicoes ZZZ*, `genericQuery` em 404 — ambiente); SCs 112593/108618/107681 em *Aguarda Geração Alçadas (309)* há 13–32 dias (estado do dia, não atribuível a este defeito).
**Divergências encontradas:** o ticket não diz **qual função** do UCOME024 contém a linha 334 — o passo 3 usa o caminho mais frequente (geração de alçada); confirmar no fonte.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-2083  (protheus · Concluído · SDCASSI-7)

**Título:** Alterar o tipo de pagamento de um pedido de compra sem disparar erro de fórmula na regra de tipo de compra

**Origem:** FSWTBC-2083 — "Ao alterar o tipo de pagamento de um pedido - Existe um erro na fórmula digitada C7_MEDICAO". Após a migração para 12.1.2410, a regra de tipo de compra que a CASSI construiu com `C7_MEDICAO` (separação SEDE × Central) passou a falhar: a TOTVS descontinuou o uso de campos de contrato nas regras de tipo de compra (TDN PCOM09017). Encerrado **"Não será feito"** com orientação de abrir demanda de melhoria para a alternativa.

**Módulo/Rota:** **Protheus → SIGACOM → Atualizações → Pedidos → Pedido de Compra** (`MATA121` — a confirmar no menu do cliente) → **Alterar** → campo de tipo/condição de pagamento; **SIGACOM → Atualizações → Cadastros → Tipos de Compra / Regras de Tipo de Compra** (código a confirmar no menu do cliente) para ler a regra vigente.

**Módulo ERP:** `Compras`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGACOM (alterar pedido) e leitura do cadastro de tipos de compra.
- Um pedido de compra de homologação **não atendido** (sem nota), gerado por SC `QA` do Fluig (Tipo de Compra = Pedido) ou incluído direto no ERP com observação `QA`.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: crítica de fórmula ao alterar o pedido; o Fluig não altera pedido nem conhece o tipo de pagamento`

**Passos**
1. Cadastro de Tipos de Compra: abrir a regra usada pela SEDE e pela Central; anotar a fórmula — confirmar que **não referencia `C7_MEDICAO`** nem outro campo de contrato (regra descontinuada na 2410).
2. MATA121 → localizar o pedido `QA` → **Alterar**.
3. Trocar o tipo/condição de pagamento para outro válido (ex.: de "à vista" para "30 dias") → **Confirmar**.
4. Reabrir o pedido: conferir a condição gravada e o tipo de compra (`C7_TPCOMPRA`/campo equivalente — nome a confirmar no dicionário) atribuído.
5. Repetir os passos 2–3 com um pedido da **outra origem** (SEDE × Central), para provar que a separação continua funcionando pela alternativa adotada.

**Resultado esperado**
- Passo 1: nenhuma fórmula de tipo de compra usa campo de contrato/medição.
- Passo 3: o pedido grava **sem** mensagem de erro de fórmula.
- Passo 5: cada pedido recebe o tipo de compra correto para a sua origem; se a separação SEDE × Central ainda não tem alternativa implementada, **registrar como pendência** (demanda de melhoria em aberto), não como aprovação.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Mensagem **`Existe um erro na fórmula digitada C7_MEDICAO`** ao confirmar a alteração; o pedido não grava.

**Severidade:** Média *(bloqueia a manutenção do pedido; risco de perder a separação SEDE × Central)*

**Preparação de massa:** pedido `QA` em homologação criado pelo executor (por SC do Fluig com Tipo de Compra = Pedido, aprovada pelo gestor/alçada de homologação, ou inclusão direta no ERP). Não alterar pedidos reais.

**Verificado em tela:** NÃO
**O que foi verificado:** só que o Fluig envia `buyerTipoCompra` (1 = Pedido, 2 = Contrato) no formulário da SC (fonte publicado `js_256831_App_ViewHandler.js`) — o tipo de pagamento e a regra de tipo de compra não passam pelo portal.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3624  (protheus · Concluído · SDCASSI-190)

**Título:** Lançar documento de entrada de serviço de saúde de um fornecedor que recolhe ISS e confirmar a retenção, com o cadastro do fornecedor imune à carga full

**Origem:** FSWTBC-3624 / incidente 793679 — Documentos de entrada do SOC deixaram de reter ISS: notas do mesmo fornecedor divergiram porque `A2_RECISS` mudou (S em 12/12, N em 23/12/2025) **pela carga full da integração da CASSI**, cuja regra estava invertida — sem log na CV8. Corrigida pelo time de integração web do cliente; **sem registro de retificação fiscal** dos documentos do período.

**Módulo/Rota:** Protheus · SIGACOM · *Documento de Entrada* (MATA103 — a confirmar), aba de impostos/retenções; SIGAFIN · títulos de ISS retido; cadastro de fornecedor (SA2, campo *Recolhe ISS* = `A2_RECISS`). Fluig: **nenhuma superfície** — o *Cadastro de Fornecedor* do Fluig (form 256830) **não tem campo de ISS**; só a leitura por dataset `dsProtheus_getFornecedores_restGetAll` (expõe `A2_RECISS`) serve de contraprova.

**Pré-condições**
- Fornecedor `QA` de serviços de saúde com *Recolhe ISS* = Sim (`A2_RECISS = S`) e município/alíquota configurados.
- Uma execução da carga full da integração da CASSI **após** o cadastro (é ela que alterava o campo).
- Usuário Protheus para lançar o documento de entrada e consultar o financeiro.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: retenção de ISS no documento de entrada e no título financeiro, e o valor de A2_RECISS após a carga`. Sem credencial Protheus; a carga full é do time da CASSI.

**Passos**
1. No Protheus, anotar `A2_RECISS` do fornecedor `QA` (esperado S).
2. Solicitar ao time de integração a execução da carga full em homologação.
3. Reler `A2_RECISS` do fornecedor `QA` e de dois fornecedores de controle (um S, um N).
4. Lançar um documento de entrada de serviço `QA` para o fornecedor e conferir a retenção de ISS (aba de impostos) e o título de ISS gerado no SIGAFIN.
5. Contraprova Fluig (não é cobertura): consultar `dsProtheus_getFornecedores_restGetAll` filtrando o fornecedor e ler `A2_RECISS`.

**Resultado esperado**
- `A2_RECISS` **inalterado** pela carga full nos três fornecedores.
- O documento do fornecedor S retém ISS; o do fornecedor N não retém.
- Toda alteração de cadastro de fornecedor por integração deixa rastro na CV8.

**Resultado se o defeito reincidir**
- `A2_RECISS` invertido após a carga (S→N ou N→S) sem log; documento de entrada sem retenção (ou com retenção indevida) — como o doc 000023753.

**Severidade:** Alta *(impacto tributário direto; retificação fiscal necessária)*

**Preparação de massa:** fornecedor `QA` com ISS criado no Protheus pelo executor; documento `QA` lançado pelo executor; carga full acionada pelo time de integração da CASSI em homologação.

**Verificado em tela:** NÃO
**Módulo ERP:** `Compras`
**O que foi verificado:** o formulário *Cadastro de Fornecedor* do Fluig (HTML e JS publicados, form 256830) **não contém** campo de ISS/`RECISS` — o dado não é editável pelo Fluig. O dataset `dsProtheus_getFornecedores_restGetAll` responde 200 com 264 colunas, incluindo `A2_RECISS`: nos 300 primeiros registros, 295 vazios, 3 `N`, 2 `S`.
**Divergências encontradas:** o campo *Recolhe ISS* nos prints do ticket vale "1"/"2"; no dataset o domínio é `S`/`N`/vazio — o executor deve confirmar o domínio na tela do SA2. Fornecedor do documento 000023753 não identificado no ticket.
**Dados/massa usados:** leitura de dataset; nenhum registro criado.

---
