<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# Contratos

Casos de teste E2E do Fluig — módulo Contratos.

| | |
|---|---|
| Casos neste arquivo | 61 |
| Verificados em tela | 10 total · 49 parcial · 0 não |

> **Como ler.** Cada caso descreve o comportamento **correto esperado hoje**. A maioria dos
> defeitos de origem já foi corrigida — o caso é de regressão: se reprovar, o defeito voltou.
> Os que reprovam hoje por causa nunca corrigida estão marcados no próprio caso.
> *Verificado em tela* diz o que foi conferido no ambiente de homologação em 08/09/2026;
> **PARCIAL** costuma significar que a conta de QA não tem o perfil necessário (comprador,
> gestor, fiscal, fornecedor), não que o caso seja inválido.

---

## CT-FSWTBC-638  (FSWTBC-638 · ambos · Concluído)

**Título:** Criar uma Solicitação de Compra pelo Fluig e confirmar que a SC no Protheus fica com o solicitante real, e não com o usuário integrador.

**Origem:** FSWTBC-638 (chamado 745407) — a SC1 gravava **C1_USER** com o **usuário integrador** em vez
do solicitante, fazendo o processo de **Recepção de NF** cair para o grupo e não para o demandante.
Causa secundária registrada no ticket: *"foi identificada a necessidade de ajuste na API de
atualização da SC1 que está LIMPANDO o campo C1_XFLUIG"*. Os comentários enfileiram cinco chamados
correlatos (745364, 745387, 745389, 745390, 745394) com a mesma raiz: a API de atualização da SC
sobrescrevendo ou limpando campos de vínculo.

**Módulo/Rota:** Fluig → **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) → ícone
`title="Solicitação de Compra"` → modal **Solicitação de Compra**. Alternativa:
**Processos → Iniciar Solicitações → Solicitação de Compras** (`wf_solicitacao_compras`).
Conferência: **Tracker - Processos Compras/Contratos** e, no ERP, **SIGACOM → SC1**.

**Pré-condições**
- Usuário solicitante **distinto** da conta de integração, autenticado no Fluig e cadastrado no Protheus.
- Contrato vigente disponível na grade do Acompanhamento de Contratos.
- Processo de **Recepção de Documentos Fiscais** publicado e com fila por demandante.
- **Bloqueio:** o campo **C1_USER** e o **C1_XFLUIG** só são legíveis na **SC1 do Protheus** — **sem
  credencial**. Além disso, o processo **Recepção de NF** (`bpm_recepcao_documentos_fiscais_compras`)
  **não pode ser iniciado por este perfil** (mensagem exata registrada abaixo), então a segunda metade
  do cenário — a NF cair para o demandante — não é executável com a conta de QA. Âncora possível no
  Fluig: **Tracker**, cruzando *Solicitante* × *Nº da Solicitação ERP*.

**Passos**
1. Autenticar no Fluig com o usuário **solicitante** (não com a conta de integração).
2. Abrir **Acompanhamento de Contratos**, localizar o contrato na grade e clicar no ícone
   **Solicitação de Compra** da coluna *Ação*.
3. No modal, escolher **Tipo de Solicitação** (*Aditivo Contratual* ou *Nova Contratação*), informar
   **Data de Necessidade** (formato ISO `aaaa-mm-dd`) e **Motivo da Solicitação**; confirmar que o campo
   **Contrato** vem preenchido e desabilitado.
4. Clicar em **Confirmar** e anotar o número da SC gerada.
5. No **Tracker**, filtrar por *Solicitação de Compras* e localizar o registro: conferir **Solicitante**
   e **Nº da Solicitação ERP**.
6. No Protheus (SIGACOM), abrir a **SC1** correspondente e ler **C1_USER** e **C1_XFLUIG**.
7. Disparar a **Recepção de NF** dessa SC e verificar para quem a tarefa é atribuída.

**Resultado esperado**
- **C1_USER** da SC1 contém a matrícula/código do **usuário solicitante** que abriu a SC no Fluig —
  nunca a conta de integração.
- **C1_XFLUIG** permanece **preenchido** com o vínculo do processo Fluig depois de qualquer atualização
  da SC pela API (o campo não pode ser limpo por rotina de update).
- No **Tracker**, o campo *Solicitante* mostra o usuário real e é o mesmo do C1_USER.
- A tarefa de **Recepção de NF** é atribuída ao **demandante** da SC, e não à fila do grupo.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- **C1_USER** preenchido com o **usuário integrador**; consequência visível ao usuário: os processos de
  **Recepção de NF caem para o grupo e não para o Demandante**.
- **C1_XFLUIG** aparece **vazio** após a atualização da SC1, quebrando o vínculo com o processo Fluig.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a grade do **Acompanhamento de Contratos** carrega com as colunas *Filial,
Tipo Contrato, Contrato, Data Inicio, Data Fim, Nº Revisão, Status, Fornecedor, Ação* e os três ícones
de ação, cujo único gancho estável é o atributo `title` (**Planilha**, **Solicitação de Compra**,
**Informações do Contrato**) — são âncoras sem nome acessível. Abri o modal **Solicitação de Compra**
sem submeter: campos **Tipo de Solicitação** (`select`, opções *Selecione... / Aditivo Contratual /
Nova Contratação*), **Contrato** (`text`, **desabilitado**), **Data de Necessidade** (`input type=date`
— aceita só ISO), **Motivo da Solicitação** (`textarea`), botões **Confirmar** e **Fechar**; o modal
traz o texto de ajuda explicando que *Aditivo contratual* → *"Protheus = abre revisão aberta e FC irá
editar o contrato"* e *Nova Contratação* → *"Protheus = gera novo contrato igual quando vem de SC"*.
Na abertura do modal o portal executa, entre outros, `dsProtheus_getGestorOrcamentario_restGet` e o
dataset `colleague` filtrado por **mail** — isto é, a identidade do solicitante é resolvida por e-mail
na carga. Confirmei também, por URL, que **Recepção de NF está bloqueada para este perfil**: a tela
devolve *"Usuário TOTVS-FS não possui permissão para iniciar solicitações do processo
bpm_recepcao_documentos_fiscais_compras"*, com *Ver detalhes técnicos* e botão *Ok, entendi*. O
formulário da **Solicitação de Compras** (instância real 112096, aberta em leitura) expõe os campos que
o caso precisa comparar: *Solicitante*, *Email do Solicitante*, **Nº da Solicitação ERP** e
**Nº da Cotação ERP**.
**Divergências encontradas:** achado relevante para a raiz deste defeito, já medido e versionado neste
projeto (`docs/mapa-do-ambiente.md`): no payload de criação da SC
(`POST /process-management/api/v2/processes/wf_solicitacao_compras/start`), o campo **`targetAssignee`
vem como `consumerkeycompras`** — a conta de integração — e não o usuário autenticado. É exatamente a
família de defeito descrita no ticket, do lado Fluig. Não reexecutei essa captura aqui para não gravar
SC.
**Dados/massa usados:** contrato pré-existente da grade (linha da filial 2501, contrato
`0000-2025-2501-`) apenas para abrir o modal; solicitação pré-existente 112096 em leitura. **Nada foi
submetido** — o modal foi fechado sem confirmar e a rota de escrita ficou bloqueada (0 tentativas).

---

## CT-FSWTBC-1215  (FSWTBC-1215 · ambos · Concluído / **Não é possível reproduzir**)

**Título:** Conferir que o número do item de um produto é o mesmo na Solicitação de Compra e na cotação gerada a partir dela.

**Origem:** FSWTBC-1215 — erro em produção na análise da cotação: o **mesmo produto aparece com número
de item diferente na SC e na cotação**, quebrando a correlação. Ocorreu uma vez, sem cenário para
investigar; o cliente já conhece o fenômeno como *"erro de gerar contrato único"*. Encerrado como
**Não é possível reproduzir**, e provavelmente o mesmo mecanismo por trás de FSWTBC-4774 (itens
aglutinando na cotação, 2026).

**Módulo/Rota:** Fluig → **Tracker - Processos Compras/Contratos**
(`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`), filtros *Solicitação de Compras*,
*Produtos/Rateio SC* e *Cotação de Produtos/Serviços* (e *Negociação ... (Detalhado Itens)*);
formulários de **Solicitação de Compras** e de **Cotação de Produtos e Serviços**.

**Pré-condições**
- Uma SC com **vários itens** (de preferência com produtos repetidos ou semelhantes, cenário em que a
  aglutinação aparece) já convertida em cotação.
- Nº do Processo Fluig, **Nº da Solicitação ERP** e **Nº da Cotação ERP** conhecidos.
- **Bloqueio:** o defeito **continua aberto na prática** (resolução *Não é possível reproduzir*, sem
  correção): este caso não é regressão de algo corrigido, é um **caso de vigilância**. Além disso, a
  confirmação definitiva da numeração de itens está na SC1/SC8 do **Protheus** — **sem credencial**. No
  Fluig a comparação é possível pelo Tracker e pelos formulários, que é a âncora adotada. Massa: não
  havia, hoje, par SC↔cotação disponível para esta conta.

**Passos**
1. Abrir o **Tracker - Processos Compras/Contratos**.
2. Em *Filtrar por*, marcar **Solicitação de Compras** e pesquisar com **Pesquisar Registro**,
   informando o **Nº do Processo Fluig** ou o **Nº da Solicitação ERP** da SC de referência.
3. Repetir a consulta marcando **Produtos/Rateio SC** e anotar, para cada produto, o **número do item** na SC.
4. Repetir marcando **Cotação de Produtos/Serviços** (e, se necessário,
   **Negociação de Cotação de Produtos/Serviços (Detalhado Itens)**), usando o **Nº da Cotação ERP** correspondente.
5. Abrir o formulário da cotação e conferir a *Lista de Produtos/Serviços*, colunas **Item**, **Código** e **Descrição**.
6. Comparar, produto a produto, o número do item na SC e na cotação.

**Resultado esperado**
- Cada produto mantém **o mesmo número de item** na SC e na cotação dela derivada.
- A quantidade de itens da cotação é igual à da SC — nenhum item é aglutinado nem desdobrado.
- **Código** e **Descrição** do produto correspondem, item a item, entre os dois documentos.
- A correlação SC ↔ cotação permanece íntegra para a análise da cotação e para a geração do contrato.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O mesmo produto aparece com **número do item diferente** na SC e na cotação, quebrando a correlação —
  sintoma que o cliente chama de *"erro de gerar contrato único"*.
- Variante correlata (FSWTBC-4774): **itens aglutinando** na cotação.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o **Tracker** existe e oferece exatamente os cortes que este caso precisa. Em
*Filtrar por* estão disponíveis: **Solicitação de Compras**, **Cotação de Produtos/Serviços**,
**Negociação de Cotação de Produtos/Serviços**, **Faturamento de Contratos**, **Parecer Técnico**,
**Recepção de Documentos Fiscais**, **Produtos/Rateio SC**, **Negociação de Cotação de
Produtos/Serviços(Detalhado Itens)** e **Aprovadores SC**. Os filtros incluem *Nº do Processo Fluig*,
*Solicitante*, *Status* (Todos/Abertos/Finalizados/Cancelados), *Data da Solicitação (De/Até)*,
**Nº da Solicitação ERP**, **Nº da Cotação ERP**, *Filial*, *Dispensa Cotação*, *Tipo de Solicitação*
(Renovação Contratual / Aditivo Contratual) e *Número do Contrato*; botões **Pesquisar Registro** e
**Limpar**. Confirmei nos formulários que a comparação é possível: a **Solicitação de Compras** (lida na
instância 112096) expõe **Nº da Solicitação ERP** e **Nº da Cotação ERP**, e a **Cotação de Produtos e
Serviços** (instância 112113) expõe **Nº da Cotação**, **Nº da SC do Fluig**, **Nº da SC do ERP** e a
*Lista de Produtos/Serviços* com as colunas **Item, Código, Descrição, Qtde., Un. Med.**
**Divergências encontradas:** uma, de comportamento do Tracker: acionar **Pesquisar Registro** sem
selecionar filtro não renderizou nenhuma tabela de resultados no DOM — nenhum retorno e nenhuma
mensagem de "nenhum registro". Não é o defeito do ticket, mas atrapalha a execução do caso; vale
selecionar sempre um item em *Filtrar por* antes de pesquisar.
**Dados/massa usados:** solicitações pré-existentes 112096 (SC) e 112113 (Cotação), somente leitura.
Nada submetido.

---

## CT-FSWTBC-1504  (protheus · Concluído)

**Título:** Verificar que uma solicitação de contrato (nova contratação ou aditivo) sobre contrato vigente gera a alçada e chega aos aprovadores em vez de ficar em "Aguarda Geração Alçadas"

**Origem:** FSWTBC-1504 — "Contrato vigente não indo para aprovação na teste". Fechado no mesmo dia; **conteúdo perdido**. Escrito como **caracterização de caminho** da aprovação de contrato, que nesta conta acontece no Fluig (*Aprovação de Alçada*, atividade 94) e não no GCT (`CN9_GRPAPR`/`CN9_APROV` vazios em todos os 860 contratos). Hoje o sintoma "não vai para aprovação" está **vivo**: três SCs presas em *Aguarda Geração Alçadas (309)* há 13–32 dias.

**Módulo/Rota:** Fluig → **Solicitação de Compras** (256831) com *Tipo de Compra* = Contrato e *Tipo de Solicitação* = **Nova Contratação** / **Aditivo Contratual** → *Integração com ERP* → **Aguarda Geração Alçadas (309)** → *Alçada foi Gerada?* → **Aprovação de Alçada (94)** (grade `tbAlcadas`, campo *Aprovar? - Linha N*) → *Aguarda Geração do Pedido/Contrato* → *Aguarda Vigência do Contrato*; **Tracker** → visão *Aprovadores SC* (`table-sca`); campos `docAlcadaGerada`, `numDocAlcada`, `dataMsgAlcada`. No ERP: alçada gerada pela integração (documento de alçada; `CN9_XAPRCS`).

**Pré-condições**
- Contrato **Vigente (05)** no GCT para o aditivo (ou nova contratação com cotação vencedora).
- Aprovadores de alçada cadastrados no ERP para a filial/valor.
- **Bloqueio:** parcial — gerar a alçada exige comprador (a conta de QA não tem matrícula); aprovar exige aprovador. Leitura de instâncias existentes é possível.

**Passos**
1. No **Tracker**, *Filtrar por* = Solicitação de Compras, *Status* = Abertos, *Todos/Renovação Contratual/Aditivo Contratual* = Aditivo Contratual; **Pesquisar Registro**; listar *Atividade Atual* e *Responsável Atual*.
2. Abrir uma instância em **Aguarda Geração Alçadas** → aba **Histórico**: ler a hora de entrada na 309 e a última linha (`Integração com ERP` / `Alçada foi Gerada?`).
3. Aba **Formulário**: ler `Nº Documento Alçada`/*Alçada Gerada?* e a grade `tbAlcadas` (aprovadores, valores).
4. No Tracker, visão **Aprovadores SC** para o mesmo processo: conferir os aprovadores listados.
5. (Comprador) para uma SC nova: concluir *Validação do Comprador* e acompanhar até a 94.
6. (Aprovador) aprovar em **Aprovação de Alçada** e acompanhar até *Aguarda Vigência do Contrato*.
7. (ERP) conferir no **CNTA120** que o contrato/aditivo passou a **Vigente** com a nova revisão.

**Resultado esperado**
- Passo 2: a permanência na 309 é de **minutos**; a saída registra `Alçada foi Gerada?` = Sim e a atividade seguinte é **Aprovação de Alçada (94)** com aprovadores nominais.
- Passo 3: `docAlcadaGerada` = Sim e `numDocAlcada` preenchido; grade `tbAlcadas` com ao menos uma linha.
- Passo 4: aprovadores do Tracker = aprovadores da grade.
- Passo 6: após todas as aprovações, integração gera pedido/contrato e a SC vai para *Aguarda Vigência do Contrato*.
- Nenhuma SC fica na 309 com `NOT_COMPLETED` para `admin` e `chosenAssignees` vazio.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Solicitação sobre contrato vigente **não chega à aprovação** — hoje: SC presa em *Aguarda Geração Alçadas* por dias, responsável `Administrador Cassi`, sem escolhidos. Mensagem original `<não documentado>`.

**Severidade:** Alta *(alçada de aprovação; contrato não avança nem é recusado)*

**Preparação de massa:** nada a criar para os passos 1–4 — **112593** (nascida 26/08 por *Usuário Integrador Fluig*), **108618** (21/07) e **107681** (15/07) estão na 309; **112011** (19/08) está na 94 com *Adelson Viana II* e *Edna Ribas* desde 21/08. Para os passos 5–7, comprador e aprovador reais e um contrato vigente da filial.

**Verificado em tela:** PARCIAL
**O que foi verificado:** API de tarefas: 112593/108618/107681 na seq **309** (`NOT_COMPLETED`, responsável *Administrador Cassi*, sem `chosenAssignees`, há 13/29/32 dias); 112011 na seq **94** com dois aprovadores nominais (`NOT_COMPLETED` desde 21/08 — 18 dias); 112961 já passou pela cadeia *Aguarda Geração Alçadas → Alçada foi Gerada? → Aprovação → Aguarda Geração do Pedido/Contrato → Aguarda Vigência do Contrato* (Histórico lido em modo leitura, com `Integração executada com sucesso - Tempo de Execução 6 s`). Tracker aberto com os filtros *Status* e *Renovação/Aditivo Contratual*. Dataset do formulário confirma `docAlcadaGerada`, `numDocAlcada`, `dataMsgAlcada`. Dataset de contratos: `CN9_GRPAPR`/`CN9_APROV` vazios em 860/860. SC não criada; nada aprovado.
**Divergências encontradas:** (a) a "aprovação" do ticket é no Fluig, não no GCT — grupo/aprovador de contrato do ERP não são usados; (b) sintoma vivo: 3 SCs em 309 com tarefa órfã, uma delas nascida pelo **robô** (112593, `consumerkeycompras`); (c) 112011 há 18 dias na 94 — alçada gerada, aprovadores não decidem (não é defeito, mas contamina a medição de SLA).
**Dados/massa usados:** nenhum — não submetido; leitura de 112593, 108618, 107681, 112011, 112961.

## CT-FSWTBC-1702  (FSWTBC-1702 · ambos · Concluído)

**Título:** Abrir um contrato/medição e confirmar que os dados do fiscal de serviço vêm preenchidos a partir do Protheus.

**Origem:** FSWTBC-1702 — problemas na busca das informações do **fiscal de serviço** no Fluig. É a
quinta ocorrência da mesma falha (182, 1454, 1496, 1702): reincidência crônica.

**Módulo/Rota:** Fluig → **Acompanhamento de Contratos** → ícone `title="Informações do Contrato"` →
modal **Informações Complementares do Contrato**, campo **Fiscal de Serviço**. Consumidores do mesmo
dado: **Faturamento de Contratos** (campos *Aprov. Fiscal de Serviço?*, *Fiscal de Serviço*,
*Fiscal de Contrato*) e **Delegação de Fiscais de Contrato/Serviço** (`wf_delegacaoFiscalContratoServico`).

**Pré-condições**
- Contrato no Protheus com **fiscal de serviço** cadastrado (e o e-mail correspondente).
- Integração `apiRESTProtheus_CASSI` no ar.
- **Bloqueio:** a conferência de que o fiscal exibido é o **cadastrado no contrato** exige ler a CN9/CNA
  no **Protheus** — **sem credencial**. Mitigação adotada: o modal *Informações Complementares do
  Contrato* exibe nome **e e-mail** do fiscal, o que permite conferir contra a relação de fiscais
  fornecida pela CASSI sem abrir o ERP.

**Passos**
1. Abrir **Acompanhamento de Contratos**.
2. Localizar na grade um contrato **Vigente** com fiscal cadastrado.
3. Na coluna **Ação**, clicar no ícone cujo `title` é **Informações do Contrato**.
4. No modal **Informações Complementares do Contrato**, seção *Dados Gerais*, ler os campos
   **Fiscal de Contrato** e **Fiscal de Serviço**.
5. Abrir o processo **Faturamento de Contratos** para o mesmo contrato e conferir, em *Informações da
   Medição*, os campos **Aprov. Fiscal de Serviço?**, **Fiscal de Serviço** e **Fiscal de Contrato**.
6. Abrir **Delegação de Fiscais de Contrato/Serviço**, escolher **Tipo da Solicitação = Serviço** e
   informar **Filial Contrato** / **Número Contrato**; conferir o preenchimento do bloco
   *Identificação do Fiscal* (**Fiscal**, **Email do Fiscal**).

**Resultado esperado**
- O campo **Fiscal de Serviço** vem **preenchido**, com **nome e e-mail** do fiscal cadastrado no contrato
  — nunca vazio, nunca `-`, nunca com o valor do *Fiscal de Contrato*.
- O mesmo fiscal aparece de forma consistente nos três consumidores (modal do contrato, formulário de
  medição e delegação de fiscais).
- A busca não deixa o formulário travado nem exibe erro de comunicação com o Protheus.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Problemas na busca das informações do fiscal de serviço: o campo não é preenchido no Fluig, embora o
  fiscal esteja cadastrado no contrato. `<mensagem exata não registrada no ticket>`

**Verificado em tela:** PARCIAL
**O que foi verificado:** este é o caso mais bem verificado do lote pelo lado Fluig. Abri o modal
**Informações Complementares do Contrato** para o contrato **`0000-2025-2501-`** (filial **2501**, tipo
*017 - DEDETIZACAO*, fornecedor *ANA CARLA LEAL VELOSO E SILVA*) e os dois campos vieram **preenchidos
com nome e e-mail**: **Fiscal de Contrato: `Andre Yuji Tamaoki Hirata (andre.thirata@cassi.com.br)`** e
**Fiscal de Serviço: `Flavio Vinhaes (flavio.vinhaes@cassi.com.br)`** — comportamento correto, isto é,
o defeito **não** se manifesta neste contrato hoje. O modal traz ainda as seções *Dados Gerais*,
*Datas*, *Valores Financeiros*, *Reajustes e Aditivos*, *Localização e Entrega*, *Impostos e Bases* e
*Processos, Cotações e Integração* (com **Status da Integração GCT** e **Erro de Integração**).
Confirmei nos outros dois consumidores: o formulário de **Faturamento de Contratos** tem os rótulos
**Aprov. Fiscal de Serviço? *** (Sim/Não), **Fiscal de Serviço *** e **Fiscal de Contrato ***; e o
processo **Delegação de Fiscais de Contrato/Serviço** abre para este perfil, com **Tipo da Solicitação**
= *Contrato / Serviço / Medição*, os campos *Filial Contrato, Número Contrato, Filial Planilha, Número
Planilha, Filial Medição, Objeto do Contrato*, e os blocos *Identificação do Gestor Imediato*,
*Identificação do Gerente da Divisão* e *Identificação do Fiscal* (**Fiscal ***, **Email do Fiscal ***),
encerrando em *Decisão da Delegação* com **Termo de aceite** e **Aceitar? (Sim/Não)**.
**Divergências encontradas:** nenhuma quanto ao fiscal. Duas observações colhidas na mesma tela:
(a) a coluna **Status** da grade de contratos exibe valores **truncados** — `Finali`, `Paralisa`,
`Sol.Finali`, `Cancel.`; só *Vigente* sai inteiro; (b) o processo *Delegação de Fiscais de
Contrato/Serviço* **abre** para o perfil de Compras/Contratos, contrariando roteiros antigos que o
davam como bloqueado.
**Dados/massa usados:** contrato pré-existente `0000-2025-2501-` (filial 2501), somente leitura. Nada submetido.

---

## Resumo do lote

| Caso | Defeito | Verificado | Bloqueio principal |
|---|---|---|---|
| CT-FSWTBC-620 | widget × árvore hierárquica RD4 | PARCIAL | conta não é gestor / não existe no ERP; Protheus fora |
| CT-FSWTBC-629 | medição automática (lado Fluig) | PARCIAL | confirmação no ERP; exigiria iniciar medição |
| CT-FSWTBC-631 | erro na integração da negociação | PARCIAL | sem cotação para a conta; confirmação no ERP |
| CT-FSWTBC-632 | ERRO14 — gestores faltando na árvore | PARCIAL | exige login de gestor + leitura da RD4 |
| CT-FSWTBC-638 | C1_USER com usuário integrador | PARCIAL | SC1 só no Protheus; Recepção de NF bloqueada por perfil |
| CT-FSWTBC-645 | cotação cancelada aceita negociação | PARCIAL | faltam credenciais de Protheus **e** de fornecedor |
| CT-FSWTBC-649 | ERRO01 — árvore divergente do Protheus | PARCIAL | exige login de gestor + leitura da RD4 |
| CT-FSWTBC-650 | ERRO09 — postos vagos da visão 37 | PARCIAL | RD4/SQB/módulo 70 só no Protheus |
| CT-FSWTBC-652 | medição sem itens integra valor zero | PARCIAL | tarefa é de outro usuário; confirmação no ERP |
| CT-FSWTBC-662 | erro do Protheus exibido como sucesso | PARCIAL | rota da apuração não documentada; sem credencial ERP |
| CT-FSWTBC-690 | erro no start de aprovação de ocorrências | PARCIAL | start é do Protheus; processo bloqueado por perfil |
| CT-FSWTBC-1215 | item divergente entre SC e cotação | PARCIAL | defeito **sem correção**; sem par SC↔cotação disponível |
| CT-FSWTBC-1432 | erro ao gerar alçada de cotação | PARCIAL | falha transitória; conta sem matrícula de comprador |
| CT-FSWTBC-1702 | busca do fiscal de serviço | PARCIAL | conferência do cadastro exige o ERP |

**Divergências e achados abertos neste lote**
1. **`/portal/p/1/gestao_equipes` exibe erro sob o cabeçalho "Sucesso:"** — corpo *"Usuário não
   encontrado no ERP Protheus."*. É o mecanismo do FSWTBC-662 vivo em outro componente. Merece registro próprio.
2. **`dsProtheus_getCompradores_restGetAll` é chamado com `Y1_USER = "undefined"`** para a conta
   TOTVS-FS — a conta não resolve matrícula de comprador, e isso bloqueia toda a família de casos de
   cotação/alçada (631, 645, 1215, 1432) para este login.
3. **Portal do Comprador:** *Validação Inicial*, *Avaliação de Propostas* e *Definir Vencedor Cotação*
   não navegaram ao clique (permaneceram em `#/`), enquanto *Controle De Cotações* navegou.
4. **Tracker:** *Pesquisar Registro* sem filtro selecionado não renderiza tabela nem mensagem de vazio.
5. **Grade de contratos:** coluna *Status* truncada (`Finali`, `Paralisa`, `Sol.Finali`, `Cancel.`).
6. **Rota da apuração de corretoras (FSWTBC-662) não documentada** e não localizada no portal — pendência com a CASSI.
7. **Janela de indisponibilidade do Protheus** durante toda a execução (`/ping/` do
   `apiRESTProtheus_CASSI` falhando), o que limitou os quatro casos de árvore hierárquica.

## CT-FSWTBC-1751  (protheus · Concluído)

**Título:** Incluir um contrato pela SC de Nova Contratação e conferir que o saldo nasce igual ao valor atual e continua igual após a mudança de status para Vigente

**Origem:** FSWTBC-1751 — "[Suporte Maio/2025] Saldo sendo zerado na inclusão do contrato". Quatro camadas: (1) `PE_CNTA300` desatualizado no RPO (é ele quem trata o saldo na inclusão); (2) resolvido isso, o saldo passou a zerar na **atualização de status**; (3) o **tipo de planilha** entrava na regra de zerar saldo ao vigorar; (4) ao criar um tipo novo, o Protheus **gerou código duplicado** de tipo de planilha. Antecipa o FSWTBC-1397.

**Módulo/Rota:** Fluig → **Solicitação de Compras** com *Tipo de Compra* = **Contrato** / *Tipo de Solicitação* = **Nova Contratação** → *Integração com ERP (287)* (CNTA300 via `PE_CNTA300`) → *Verificar retorno Protheus (317)* com **Retorno Integração**; **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) → ícone *Informações Complementares do Contrato* → seção **Valores Financeiros** (`#info-vlini`, `#info-vlatu`, `#info-saldo`, `#info-vlmeac`); dataset `dsProtheus_getContratosxFornecedores_restGet` (`CN9_VLINI`, `CN9_VLATU`, `CN9_SALDO`, `CN9_SITUAC`); Faturamento → `saldoContrato`. No ERP: CNTA300, status do contrato (01 → 05), tipo de planilha (CN1/CNL).

**Pré-condições**
- SC de contrato aprovada até a alçada (perfil de comprador/gestor) — ou, no ERP, um contrato `QA` incluído via CNTA300.
- Protheus com `PE_CNTA300` na versão atual no RPO (conferir data).
- **Bloqueio:** a conta de QA não conclui o ciclo de SC → contrato (sem comprador/gestor); a **leitura** do saldo foi feita por dataset e a rota do modal existe. Não alterar status de contrato real.

**Passos**
1. Registrar o *Valor Atual* e o *Saldo* de referência: Acompanhamento de Contratos → localizar o contrato recém-incluído (status **Em elaboração / 01**) → *Informações Complementares do Contrato* → *Valores Financeiros*.
2. No ERP (ou pelo fluxo que o faz), mudar o status para **Vigente (05)**; reabrir o modal.
3. Repetir 1–2 com um contrato de **cada tipo de planilha** em uso (FIXA 001, SEMI FIXA 002, …).
4. No ERP, criar um tipo de planilha novo e conferir o código gerado (CN1/CNL).
5. Por amostragem, chamar `dsProtheus_getContratosxFornecedores_restGet` (`CN9_SITUAC` 05) e listar contratos com `CN9_VLATU > 0` e `CN9_SALDO = 0` ou vazio.

**Resultado esperado**
- Passo 1: *Saldo* = *Valor Atual* na inclusão (nenhuma medição ainda).
- Passo 2: *Saldo* **inalterado** após vigorar — só medição encerrada reduz saldo.
- Passo 3: comportamento igual para todo tipo de planilha, salvo regra documentada de zerar saldo para tipo específico.
- Passo 4: código novo **único** (não repete um existente).
- Passo 5: **zero** contratos vigentes sem medição com saldo 0; saldo vazio só em contratos sem planilha.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Contrato incluído com *Saldo* **0,00** apesar de *Valor Atual* > 0; ou saldo que zera ao mudar o status para Vigente; tipo de planilha com código duplicado.

**Severidade:** Alta *(saldo zerado bloqueia toda medição do contrato)*

**Preparação de massa:** contrato `QA` incluído por SC de Nova Contratação aprovada (comprador + gestor de homologação) ou diretamente no CNTA300 (administrador do Protheus). Não usar contratos reais para mudar status.

**Verificado em tela:** PARCIAL
**O que foi verificado:** grade de **860 contratos** lida por dataset: **nenhum vigente com `CN9_VLATU > 0` e `CN9_SALDO = 0`** (o sintoma não reincide na amostra); **139 com `CN9_SALDO` vazio**; E01-2025-2101 com saldo 2.819.892,40 sobre 4.447.312,40. *Acompanhamento de Contratos* aberto (845 linhas); no fonte publicado o modal *Informações Complementares do Contrato* preenche `#info-vlini/#info-vlatu/#info-vlpres/#info-saldo/#info-vlmeac` com `formataMoedaBR` (seção "VALORES FINANCEIROS"). Formulário de Faturamento em leitura mostra `valTotalContrato`/`saldoContrato` (ex.: 189.964,60 / 71.964,27 na 113249). SC **112855** em *Verificar retorno Protheus (317)* com *Retorno Integração* = `Nao foi possivel ativar o modelo CNTA300 para gerar o aditivo.` — a rota SC → CNTA300 → 317 é real.
**Divergências encontradas:** dois saldos incoerentes vivos na base: **00013-2026-5303** com `CN9_SALDO` **-45.235,96** (cabeçalho) enquanto a planilha 000001 responde `CXN_VLSALD` **+45.707,96** e `CNE_QTAMED` = `CNE_QUANT` (nada medido) — cabeçalho e planilha discordam até no sinal; **00050-2026-5303** com saldo 300.926,19 > valor atual 300.000,00.
**Dados/massa usados:** nenhum — leitura.

---

## CT-FSWTBC-1921  (protheus · Concluído)

**Título:** Abrir um Aditivo Contratual de prazo para um contrato totalmente medido e obter o aditivo gerado no GCT com o cronograma financeiro complementado

**Origem:** FSWTBC-1921 — "Erro ao complementar cronograma financeiro de aditivo do contrato": em contrato **já totalmente medido**, o aditivo (renovação por mais 60 meses) falhava ao complementar o cronograma financeiro com **chave duplicada**; diagnosticado com `IXBLOG=LOGRUN` e **resolvido pelo pacote acumulado de jun/2025** (defeito do produto). Par do FSWTBC-2109.

**Módulo/Rota:** Fluig → **Processos → Solicitação de Compras → Nova** → *Tipo de Solicitação* = **Aditivo Contratual**, *Tipo de Compra* = Contrato (`buyerTipoCompra=2`), *Número do Contrato* (`nrContrato`/`revisaContrato`, zoom), *Valor Contrato Original*, **Total com Aditivo (R$)** → validações/alçada → **Integração com ERP (287)** → *Aguarda Geração do Pedido/Contrato* → *Pedido/Contrato foi Gerado?* → **Verificar retorno Protheus (317)** com o campo **Retorno Integração** (`buyerRetIntTreat`). Leitura: **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) → coluna *Nº Revisão* e modal **Informações Complementares do Contrato** (*Status da Integração GCT*, *Erro de Integração*); **Tracker** → *Tipo* = Aditivo Contratual. No ERP: CNTA300 → revisão → **Cronograma Financeiro (CNF)**.

**Pré-condições**
- Contrato de homologação **totalmente medido** (`CN9_SALDO = 0` com `CN9_VLATU > 0`, situação 05) — hoje **nenhum** dos 565 vigentes está nessa condição (mais próximos: 00070-2023-5303, saldo 0,01; 6182-2025-5303, saldo 0,07).
- Perfis de gestor/alçada de homologação para aprovar a SC (a conta de QA não tem).
- Pacote do Protheus ≥ acumulado jun/2025 aplicado (é a correção).
- **Bloqueio:** massa ausente (contrato totalmente medido) e perfil de aprovação; Protheus sem credencial para a conferência final da CNF.

**Passos**
1. Nova SC: *Tipo de Solicitação* = Aditivo Contratual; *Tipo de Compra* = Contrato; selecionar o contrato totalmente medido (a tela preenche *Valor Contrato Original*, fornecedor, revisão); informar o **Total com Aditivo (R$)** e o novo prazo/objeto no descritivo com prefixo `QA`; **Enviar**.
2. Aprovar nas validações e na alçada (perfis de homologação).
3. Histórico: ler *Integração com ERP — Integração executada com sucesso - Tempo de Execução N s* e a decisão de *Pedido/Contrato foi Gerado?*.
4. Se a SC parar em **Verificar retorno Protheus**: abrir o formulário e ler **Retorno Integração**.
5. Acompanhamento de Contratos → filtrar o contrato → *Nº Revisão* e modal *Informações Complementares do Contrato* → *Status da Integração GCT* / *Erro de Integração*.
6. *(com credencial)* CNTA300 → revisão nova → Cronograma Financeiro: parcelas do período adicional.

**Resultado esperado**
- Passo 3: *Pedido/Contrato foi Gerado?* = **Sim**; a SC **não** entra em 317; `pedidoContratoGerado=Sim` e `numContrato` preenchido.
- Passo 5: *Nº Revisão* incrementado; *Status da Integração GCT* sem erro; *Erro de Integração* vazio.
- Passo 6: CNF complementada com as parcelas novas, sem `duplicate key`; parcelas medidas anteriores intactas.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC parada em **Verificar retorno Protheus** com *Retorno Integração* contendo o erro do ERP (chave duplicada na CNF / falha do modelo `CNTA300`); no ERP, aditivo sem cronograma. Hoje a SC **112855** exibe exatamente esse estado: 11 dias em 317 (SLA `EXPIRED`) com `Nao foi possivel ativar o modelo CNTA300 para gerar o aditivo.`

**Severidade:** Alta *(contrato sem aditivo/cronograma — financeiro e de aprovação)*

**Preparação de massa:** contrato `QA` no GCT de homologação medido até o saldo zero (planilha pequena, 1 parcela), criado pelo time Protheus e com fiscal de homologação; SC `QA` aberta pelo executor. Não usar a 112855 nem outros contratos reais.

**Verificado em tela:** PARCIAL
**O que foi verificado:** SC **112855** aberta em modo leitura: *Tipo de Solicitação* = Aditivo Contratual, contrato `000000000000010` rev 001 (VERMA ENGENHARIA, filial 2101), *Valor Contrato Original* 40.560,00, *Total com Aditivo* 50.560,00, atividade atual **Verificar retorno Protheus** desde 28/08 16:01, rótulo **Retorno Integração\*** com o texto `Nao foi possivel ativar o modelo CNTA300 para gerar o aditivo.`; Histórico com *Integração com ERP → Aguarda Geração do Pedido/Contrato → Pedido/Contrato foi Gerado?* ("condição 4"). Tracker com filtro *Tipo* = Renovação Contratual / Aditivo Contratual. Datasets de cronograma/aditivo/revisão **não existem** no tenant. Não criei SC.
**Divergências encontradas:** (1) o sintoma de hoje na mesma superfície é **outro** — falha ao ativar o modelo CNTA300, não chave duplicada; (2) o formulário tem **dois** campos para o mesmo fim: `buyerRetIntTreat` (com a mensagem) e `erroIntegracao` (**vazio**); (3) o Histórico registra "Integração executada com sucesso" para uma integração que devolveu erro; (4) o rótulo *Retorno Integração* aparece com asterisco de obrigatório em modo leitura.
**Dados/massa usados:** leitura da SC 112855 — nada submetido.

---

## CT-FSWTBC-1985  (fluig · Concluído)

**Título:** Após atualização do Protheus, as telas de Compras/Contratos do Fluig continuam carregando dados do ERP.

**Origem:** FSWTBC-1985 — acompanhamento em produção pós atualização do Protheus para a release 2410.
O ticket **não traz descrição**: este caso é uma **caracterização de caminho** (smoke pós-upgrade),
não a reprodução de um defeito específico.

**Módulo/Rota:** Portais de Compras/Contratos: *Acompanhamento de Contratos*
(`/portal/p/1/acompanhamentoContrato`), *Tracker* (`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`),
*Gerência de Compras* (`/portal/p/1/gerenciaCompras`) e os formulários de SC, Cotação e Faturamento.

**Pré-condições**
- Sessão de usuário com perfil Compras/Contratos.
- Nova versão do Protheus já publicada no ambiente-alvo.
- **Bloqueio:** nenhum para as verificações abaixo. Fica **fora** do alcance sem credencial de Protheus
  tudo que só o ERP confirma (lançamento contábil, saldo de parcela, classificação LP/CP): nesses
  pontos não existe superfície no Fluig e o caso **não** cobre.

**Passos**
1. Abrir **Acompanhamento de Contratos** e conferir que a grade carrega registros e que a linha de status
   informa a contagem.
2. Na coluna **Ação**, abrir o ícone *Informações do Contrato* (âncora identificada pelo atributo `title`)
   de um contrato qualquer.
3. No modal **Informações Complementares do Contrato**, conferir o grupo **Processos, Cotações e
   Integração**, em especial **Status da Integração GCT** e **Erro de Integração**.
4. Abrir o **Tracker**, executar **Pesquisar Registro** sem filtro e conferir que a grade responde.
5. Abrir **Gerência de Compras** → aba **Transferir** e conferir que a lista de SCs carrega.
6. Iniciar (sem enviar) *Solicitação de Compras*, *Cotação de Produtos e Serviços* e *Faturamento de
   Contratos*, conferindo que cada formulário monta os campos e que os zooms do ERP respondem.

**Resultado esperado**
- Todas as telas carregam sem erro de console além dos já conhecidos do ambiente
  (`404` do `logo_image.png`, `403` do `/nps/api/v1/surveys`).
- A grade de contratos traz registros (não "Nenhum dado encontrado").
- O modal do contrato traz os grupos *Dados Gerais*, *Datas*, *Valores Financeiros*, *Reajustes e
  Aditivos*, *Localização e Entrega*, *Impostos e Bases*, *Processos, Cotações e Integração*, *Outros*,
  e o campo **Erro de Integração** vem **vazio** para contrato íntegro.
- Os datasets do ERP respondem com conteúdo: `dsProtheus_getContratosxFornecedores_restGet`,
  `dsProtheus_getTipoContratos_restGetAll`, `dsProtheus_getCampoCombo_restGetAll`,
  `dsProtheus_getFornecedores_restGetAll`, `ds_get_fiscalServico`.
- Os formulários montam campos (não ficam em branco) e os zooms abrem.

**Resultado se o defeito reincidir**
- Após o upgrade, telas de contrato/cotação vazias, zooms sem retorno ou **Erro de Integração**
  preenchido no modal do contrato. Mensagem exata `<não documentado>` — o ticket não guarda descrição.

**Severidade:** Alta *(um upgrade que derruba a integração para o portal inteiro)*

**Preparação de massa:** nenhuma — usa a base existente. Convém executar o roteiro **antes** e **depois**
do upgrade, guardando a contagem de registros da grade de contratos e a lista de datasets respondidos,
para comparar.

**Verificado em tela:** SIM (total)
**O que foi verificado:** os 6 passos foram executados hoje. *Acompanhamento de Contratos*: grade com
**845 linhas** visíveis, busca e paginação presentes. Modal **Informações Complementares do Contrato**
aberto sobre o contrato `0000-2025-2501-` (tipo *017 - DEDETIZACAO*, fornecedor *ANA CARLA LEAL VELOSO E
SILVA*, CNPJ `26.628.497/0001-80`): **Status da Integração GCT** e **Erro de Integração** presentes e
ambos vazios (`-`). Datasets disparados na tela: `colleagueGroup`, `dsProtheus_getCampoCombo_restGetAll`,
`dsProtheus_getTipoContratos_restGetAll`, `dsProtheus_getContratosxFornecedores_restGet`, `colleague`,
`ds_get_fiscalServico`, `dsProtheus_getFornecedores_restGetAll`. *Tracker*: filtros e botões
**Pesquisar Registro**/**Limpar** presentes. *Gerência de Compras* → **Transferir**: 65 SCs listadas.
Os três formulários montaram seus campos.
**Divergências encontradas:** no modal, **Status:** aparece truncado como *"Finali"* (defeito D-08 já
mapeado no projeto, de truncamento da situação do contrato); a aba **Atribuir** da Gerência de Compras
segue sem renderizar linha alguma, enquanto **Transferir**, pelo mesmo mecanismo, lista 65.
**Dados/massa usados:** apenas leitura de registros existentes; nada submetido.

---

## CT-FSWTBC-2038  (ambos · Concluído · SDCASSI-2)

**Título:** Conferir, ao final do dia de medição, que todos os contratos vigentes com dia de medição configurado geraram o processo de faturamento.

**Origem:** FSWTBC-2038 — a medição automática não disparou para **53 contratos vigentes** (planilha
anexada pelo cliente), de mais de 20 filiais. O contorno registrado: o analista executou manualmente
a rotina de start "apenas para os contratos da planilha cujo dia de medição seja entre 01 e 17;
todos com **0, em branco ou dia superior a 17** foram ignorados". Isso revela a regra crítica:
**contratos com dia de medição zerado ou em branco nunca disparam medição** — falha silenciosa de
dado, não de código.

**Módulo/Rota:** Fluig → **Tracker - Processos Compras/ Contratos** → *Filtrar por:* **Faturamento de
Contratos**. Apoio: **Acompanhamento de Contratos** (lista os contratos e seus status).

**Pré-condições**
- Lista dos contratos **vigentes** que deveriam medir na competência corrente, com o dia de medição
  configurado.
- Competência corrente já com a data de disparo vencida.
- **Bloqueio:** a rotina de disparo é **batch no Protheus** e **não deve ser executada** (regra §2).
  Sem credencial no ERP não há como ler o dia de medição configurado por contrato. Ancorado no Fluig
  por: (a) o **Tracker**, que permite listar todos os processos de **Faturamento de Contratos** de
  uma competência e cruzá-los com a lista esperada; (b) o **Acompanhamento de Contratos**, que dá o
  universo de contratos e seus **Status**. **Esta é uma conferência por diferença — é a forma
  possível sem o ERP, e é suficiente para detectar o defeito.**

**Passos**
1. Abrir **Acompanhamento de Contratos** e extrair a relação de contratos com **Status** vigente,
   anotando **Filial** e **Contrato**. (A grade tem paginação e campo **Filtrar**.)
2. Abrir o **Tracker**, escolher **Faturamento de Contratos**, informar a **Competência do Contrato**
   da competência corrente e deixar **Status = Todos**. Clicar em **Pesquisar Registro**.
3. Exportar o resultado pelo botão **Excel**.
4. Cruzar as duas listas: para cada contrato que deveria medir na competência, verificar se há linha
   no Tracker com aquele **Nº Contrato**.
5. Para cada contrato **sem** processo gerado, abrir o modal `title="Informações do Contrato"` e
   conferir **Status**, **Data de Início**, **Data de Fim** e **Medição Acumulada**.
6. Repetir a conferência na competência seguinte.

**Resultado esperado**
- **Todo** contrato vigente com dia de medição configurado tem **um** processo de *Faturamento de
  Contratos* na competência, visível no Tracker com **Nº Contrato** e **Competência do Contrato**.
- Nenhum contrato vigente fica sem processo por dia de medição **zerado, em branco ou fora da faixa
  processada** — e, se ficar, **existe algum alerta** para o gestor, em vez de silêncio.
- Contratos encerrados ou suspensos, corretamente, **não** geram processo.
- A **Medição Acumulada** dos contratos medidos evolui na competência.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- 53 contratos vigentes, de mais de 20 filiais, **sem medição gerada** e **sem nenhum aviso** —
  descobertos só porque o cliente montou a planilha manualmente. Contratos com dia de medição em
  branco ou zerado eram ignorados silenciosamente pela rotina.

**Severidade:** Alta *(faturamento não realizado em massa; risco financeiro direto e detecção dependente do cliente)*

**Preparação de massa:** a relação de contratos vigentes e seus dias de medição — só obtenível no
Protheus ou pela área de Contratos da CASSI. **Sem essa lista de referência, o passo 4 não tem com o
que comparar** e o caso vira apenas uma contagem. Quem prepara: área de Contratos da CASSI.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei as duas superfícies que o caso usa. **Acompanhamento de
Contratos** abre com **845 linhas** e as colunas *Filial, Tipo Contrato, Contrato, Data Inicio, Data
Fim, Nº Revisão, Status, Fornecedor, Ação* — há massa de sobra para o universo do passo 1. O
**Tracker**, no tipo **Faturamento de Contratos**, tem o bloco de filtros *"Filtrar por - Informações
da Medição"* com **Fornecedor, CNPJ/CPF Fornecedor Planilha, Loja Fornecedor Planilha, Filial
Contrato, Filial Medição, Nº Contrato, Competência do Contrato, Nº Medição, Situação Medição, Nº
Planilha, Aprovador CSE, Fiscal de Serviço, Fiscal de Contrato**, e possui botão **Excel** — ou seja,
o passo 3 é executável. Uma pesquisa dirigida devolveu corretamente uma linha (processo 31580).
**Divergências encontradas:** duas. (1) O ticket trata de uma **rotina do Protheus**, e o Fluig
**não tem nenhuma tela que mostre o dia de medição configurado do contrato** — o modal *Informações
Complementares do Contrato*, apesar de trazer 70+ campos e uma seção inteira de *Datas*, **não expõe
o dia de medição**. Portanto o passo 5 confirma *que* o contrato não mediu, mas **não** *por que*.
Digo isto explicitamente em vez de simular cobertura: **a causa (dia de medição zerado/em branco) não
tem superfície no front-end**. (2) Uma pesquisa no Tracker **sem nenhum filtro** devolveu **0
linhas** e nenhuma tabela — o passo 2 depende de informar ao menos a competência; sem filtro a tela
não serve de inventário.
**Dados/massa usados:** consultas de leitura no Tracker e no Acompanhamento de Contratos. Nada submetido.

---

## CT-FSWTBC-2109  (protheus · Concluído · SDCASSI-16)

**Título:** Gerar um aditivo de valor em contrato já medido e obter o cronograma financeiro gerado com o período contábil correto

**Origem:** FSWTBC-2109 — "Ao salvar alguns contratos eles estão apresentando erro ao gerar o cronograma financeiro. Estamos excluindo os cronogramas e gerando novamente." Dois problemas sobrepostos: (a) **uso** — "estávamos incluindo o **período incorreto** na geração do cronograma contábil" (`argument error in function Len() on CN300PERIOD(CNTA300.PRW) line 5962`); (b) **padrão** — chave duplicada resolvida pelo pacote acumulado. O teste com **customizações desativadas** salvou corretamente. Par do FSWTBC-1921.

**Módulo/Rota:** Fluig → **Solicitação de Compras → Nova** → *Tipo de Solicitação* = **Aditivo Contratual** (contrato com medição encerrada, saldo > 0) → **Integração com ERP (287)** → *Pedido/Contrato foi Gerado?* → **Verificar retorno Protheus (317)** / **Retorno Integração**; **Acompanhamento de Contratos** → *Nº Revisão* e modal *Informações Complementares do Contrato* (*Status da Integração GCT*, *Erro de Integração*). No ERP: **CNTA300 → aditivo/revisão → Cronograma Financeiro** e período do **cronograma contábil** (pergunta/parâmetro da geração — nome a confirmar na tela).

**Pré-condições**
- Contrato de homologação vigente com **≥ 1 medição encerrada** e saldo > 0 — há massa: `000000000000010`/filial 2101 rev 001 (VERMA, 40.560,00, saldo 31.460,00) é o alvo da SC 112855; para não usar contrato real, criar contrato `QA`.
- Perfis de gestor/alçada de homologação para aprovar a SC.
- Pacote acumulado do Protheus (jun/2025 ou posterior) aplicado; customizações do GCT ativas (o teste é **com** elas).
- **Bloqueio:** perfil de aprovação (a conta de QA não aprova) e Protheus sem credencial para a conferência do cronograma.

**Passos**
1. Nova SC: *Tipo de Solicitação* = Aditivo Contratual, *Tipo de Compra* = Contrato, contrato de homologação com medição; informar **Total com Aditivo (R$)** > *Valor Contrato Original*; descritivo `QA`; **Enviar**.
2. Aprovar validações/alçada.
3. Histórico: *Integração com ERP* e decisão de *Pedido/Contrato foi Gerado?*.
4. Se parar em 317: ler **Retorno Integração**; registrar a mensagem literal.
5. Acompanhamento de Contratos → contrato → *Nº Revisão*, *Valor Atual*, modal → *Status da Integração GCT* / *Erro de Integração*.
6. *(com credencial)* CNTA300 → revisão nova → Cronograma Financeiro: parcelas e **período contábil** de cada uma; `error.log` sem `CN300PERIOD`.
7. Variante de uso: no ERP, gerar o cronograma informando um período **inválido** de propósito (ex.: fora da vigência) e observar a crítica.

**Resultado esperado**
- Passo 3: *Pedido/Contrato foi Gerado?* = Sim; SC segue sem 317; `numContrato` preenchido.
- Passo 5: *Nº Revisão* +1, *Valor Atual* = Total com Aditivo, integração sem erro.
- Passo 6: cronograma sem chave duplicada; período contábil = competência de cada parcela; parcelas já medidas preservadas.
- Passo 7: crítica **clara** sobre o período (não um `argument error in function Len()`).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC em 317 com erro no *Retorno Integração* (hoje, 112855: `Nao foi possivel ativar o modelo CNTA300 para gerar o aditivo.`); no ERP, `duplicate key` na CNF ou `argument error in function Len() on CN300PERIOD(CNTA300.PRW) line 5962`; contorno de excluir e regerar cronogramas.

**Severidade:** Alta *(cronograma financeiro do contrato — financeiro/contábil)*

**Preparação de massa:** contrato `QA` com uma medição encerrada, criado pelo time Protheus em homologação; SC `QA` pelo executor; aprovações pelos perfis de homologação. Não reaproveitar a 112855.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o mesmo da 1921 — SC 112855 (aditivo sobre contrato com saldo 31.460 de 40.560, ou seja, **já medido**) parada em *Verificar retorno Protheus* com `Nao foi possivel ativar o modelo CNTA300 para gerar o aditivo.`; campos *Valor Contrato Original* e *Total com Aditivo (R$)*; Acompanhamento de Contratos e Tracker (filtro *Tipo* = Aditivo Contratual). Cronograma **não** é exposto por dataset (`dsProtheus_getCronogramaFinanceiro_restGetAll` inexistente). Não criei SC.
**Divergências encontradas:** as mesmas da 1921 (sintoma atual é falha do modelo CNTA300; campo `erroIntegracao` vazio ao lado de `buyerRetIntTreat` preenchido; "Integração executada com sucesso" para integração que devolveu erro).
**Dados/massa usados:** leitura da SC 112855 e da grade de contratos — nada submetido.

## CT-FSWTBC-2141  (ambos · Concluído · SDCASSI-21)

**Título:** Encerrar uma medição de contrato pelo Faturamento de Contratos e ver o encerramento concluir, ou falhar com uma mensagem que descreva a causa real.

**Origem:** FSWTBC-2141 — três medições (36327, 35643, 36275) falharam com *"Falha ao Encerrar a
Medição no ERP. code: 404 message: Contrato/Medição não localizado"*. A causa apurada foi **timeout
da API do Protheus** no encerramento, não ausência do registro; as solicitações foram movimentadas
de forma paliativa e a solução definitiva virou a melhoria DEM10014371 (integração assíncrona).

**Módulo/Rota:** Fluig → **Processos** → *Iniciar Solicitações* → categoria **Contratos** →
**Faturamento de Contratos** (`/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos`);
atividade de encerramento da medição, movimentada pelo combo **Direcionar Processo para**.

**Pré-condições**
- Contrato **Vigente** no Protheus com planilha e saldo a medir, e uma **medição já aberta** que
  esteja na atividade de encerramento do `wf_faturamento_contratos`.
- Integração `apiRESTProtheus_CASSI` no ar (o encerramento chama
  `/api/v1/fluig/compras/contrato/medicao/encerrar/<contrato>/<medicao>?codFilialContrato=<filial>`).
- **Bloqueio:** duplo. (a) **Sem credencial Protheus** — não há como confirmar que a medição foi
  encerrada na CNB/CND nem inspecionar o tempo de resposta da API. (b) O caso exige **movimentar uma
  medição real de produção** até o encerramento; não fiz e não criei massa para forçar (regra §2).
  Verificável no Fluig apenas pelas âncoras abaixo.

**Passos**
1. Abrir a solicitação de **Faturamento de Contratos** que está na atividade de encerramento, por
   `/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=<nº do processo>`.
2. Conferir, na aba **Formulário**, que *Nº do Contrato*, *Revisão*, *Filial do Contrato*,
   *Competência do Contrato*, *Filial da Medição* e **Nº da Medição** estão preenchidos.
3. No combo **Direcionar Processo para**, escolher a opção de encerramento da medição.
4. Movimentar com **Enviar**.
5. Reabrir a solicitação e ir à aba **Histórico**.
6. Abrir **Acompanhamento de Contratos**, localizar o contrato e clicar no ícone
   `title="Informações do Contrato"`.

**Resultado esperado**
- A movimentação conclui e o **Histórico** registra a atividade de serviço de encerramento com
  *"Integração executada com sucesso - Tempo de Execução N s"*.
- **Nenhuma** mensagem *"Falha ao Encerrar a Medição no ERP. code: 404 message: Contrato/Medição não
  localizado"* aparece para um contrato/medição que existem.
- No modal **Informações Complementares do Contrato**, seção *Processos, Cotações e Integração*, o
  campo **Erro de Integração** permanece `-` e **Status da Integração GCT** não indica falha.
- Na seção *Valores Financeiros* do mesmo modal, **Medição Acumulada** reflete a medição encerrada.
- Se a API demorar além do limite, a mensagem exibida deve **descrever timeout** — não `404
  Contrato/Medição não localizado`, que afirma ausência de dado onde o que houve foi demora.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O processo trava na atividade de encerramento com *"Falha na Encerrar da Medição no ERP. code: 404
  message: Contrato/Medição não localizado"*, para medições que **existem** no ERP (36327, 35643,
  36275), obrigando movimentação manual paliativa.

**Severidade:** Alta — medição travada bloqueia faturamento do contrato, e o código de erro enganoso
direciona a investigação para o lado errado (dado ausente em vez de desempenho).

**Preparação de massa:** uma medição de contrato criada pelo próprio executor, levada até a atividade
de encerramento do `wf_faturamento_contratos`, sobre contrato Vigente com planilha e saldo. Precisa
ser criada por quem tem perfil de fiscal/gestor de contrato. Para exercitar o timeout de verdade é
preciso um Protheus sob carga ou com atraso induzido — **não reproduza forçando carga no ambiente do
cliente**; observe o caso na próxima ocorrência natural.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri o **Faturamento de Contratos** e confirmei os 23 rótulos da aba
*Formulário*, incluindo **Nº da Medição**, **Nº da Planilha**, **Competência do Contrato** e
**Filial da Medição**. Abri o **Acompanhamento de Contratos** (845 contratos) e o modal
**Informações Complementares do Contrato**, onde confirmei de primeira mão os campos **Status da
Integração GCT**, **Erro de Integração** (ambos `-` no contrato inspecionado, `0000-2025-2501`) e
**Medição Acumulada**. Não movimentei nenhuma medição.
**Divergências encontradas:** o combo **Direcionar Processo para** existe como rótulo no formulário
publicado, mas **suas opções não são renderizadas na atividade de Início** — são montadas pelo motor
de workflow na atividade correspondente. Um roteiro que mande "clicar em Encerrar" na tela inicial
não encontra o controle. Além disso, **o formulário de Faturamento de Contratos não tem campo de
retorno da integração** (não há "Retorno Integração" ali, ao contrário da SC): a única superfície de
erro de integração para medição é o **Histórico** e o **Erro de Integração** do modal do contrato.
**Dados/massa usados:** nenhum — não submetido. Contrato `0000-2025-2501` inspecionado apenas em
leitura, via modal.

---

## CT-FSWTBC-2143  (ambos · Concluído · SDCASSI-23)

**Título:** Abrir as planilhas de um contrato e selecionar a planilha na medição, confirmando que toda planilha existente aparece e que a competência é gravada com separador.

**Origem:** FSWTBC-2143 — a planilha `000001` não aparecia no contrato `000000000000236`. Causa: uma
parcela do cronograma financeiro (CNF) com o campo de competência gravado como **`062025`**, sem a
barra — `06/2025`. Após ajuste do dado, a medição foi efetuada normalmente. Ficou a pendência: **não
há validação de formato na gravação da competência**.

**Módulo/Rota:** Fluig → **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) →
coluna **Ação** → ícone `title="Planilha"` → modal **Informações da Planilha / Planilhas do
Contrato**. E Fluig → **Processos** → **Faturamento de Contratos**, zooms **Competência do
Contrato** (`zoomCompetencia`) e **Nº da Planilha** (`zoomNumPlanilha`).

**Pré-condições**
- Contrato existente no Protheus com **pelo menos duas planilhas** cadastradas e cronograma
  financeiro (CNF) com competências no formato `MM/AAAA`.
- Integração `apiRESTProtheus_CASSI` no ar.
- **Bloqueio:** **sem credencial Protheus** — não posso inspecionar a CNF para confirmar como a
  competência está gravada, nem corrigir o dado. O que **é** verificável no Fluig: se a planilha
  aparece na lista e se o zoom de competência traz `MM/AAAA`.

**Passos**
1. Abrir **Acompanhamento de Contratos** e localizar o contrato pelo campo **Filtrar**.
2. Na coluna **Ação**, clicar no ícone cujo `title` é **`Planilha`** (é uma âncora vazia, sem nome
   acessível — o `title` é o único gancho estável).
3. No modal **Informações da Planilha**, conferir a grade *Planilhas do Contrato* (colunas *Filial,
   Contrato, Planilha, Revisão, Cod. Fornecedor, Fornecedor, Loja Forn., Ações*).
4. Fechar o modal. Abrir **Processos → Faturamento de Contratos**.
5. Preencher **Fornecedor**, **Nº do Contrato**, **Revisão** e **Filial do Contrato**.
6. Abrir o zoom **Competência do Contrato** e observar o formato dos valores oferecidos.
7. Escolher a competência e abrir o zoom **Nº da Planilha**.

**Resultado esperado**
- No modal *Planilhas do Contrato*, **todas** as planilhas do contrato são listadas — inclusive a
  `000001` — com *Revisão*, *Cod. Fornecedor* e *Loja Forn.* preenchidos.
- O zoom **Competência do Contrato** devolve valores no formato **`MM/AAAA`**, com barra
  (ex.: `06/2025`). Nenhum valor aparece como `062025`.
- O zoom **Nº da Planilha** lista as planilhas da competência escolhida e, ao selecionar, os itens
  são carregados na grade de medição.
- Não aparece o toast *"Não existem itens a serem medidos para a planilha `<nº>`. Por favor, informe
  outra Planilha."* para uma planilha que tem saldo.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A planilha `000001` simplesmente **não consta** da lista do contrato `000000000000236`, sem
  mensagem que explique a ausência; a medição não pode ser feita para aquela competência.

**Severidade:** Alta — impede o faturamento da competência e, por ser uma ausência silenciosa, é
lida pelo usuário como "planilha não existe" em vez de "dado gravado fora do formato".

**Preparação de massa:** um contrato com pelo menos duas planilhas e cronograma financeiro com
competências em `MM/AAAA`. Para o cenário negativo (competência sem barra) seria necessário gravar
uma CNF malformada — **isso exige o Protheus e não deve ser forçado**; o caso cobre o lado positivo
e a detecção da ausência.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri o **Acompanhamento de Contratos** e cliquei no ícone
`title="Planilha"` da primeira linha. O modal abriu com o cabeçalho **"Informações da Planilha"**,
seção **"Planilhas do Contrato"**, colunas *Filial | Contrato | Planilha | Revisão | Cod. Fornecedor
| Fornecedor | Loja Forn. | Ações*, paginação (*Exibir Todos/10/25/50/75/100 resultados por
página*), campo *Pesquisar* e o rodapé *"Mostrando de 1 até 2 de 2 registros"*. Para o contrato
`0000-2025-2501` foram listadas duas planilhas: **`000001`** e **`000002`** — ou seja, **a superfície
que o defeito nega existe e funciona hoje**. Confirmei também os zooms `zoomCompetencia` e
`zoomNumPlanilha` renderizados no formulário de Faturamento.
**Divergências encontradas:** **achado no fonte publicado, relevante para a pendência do ticket.**
O formulário de Faturamento trata a competência como texto e **assume a barra**:
`zm_competenciaValue = result[0].COMPETENCIA.replace('/', '-')` e
`competence: UtilsHandler.getElement("zoomCompetencia").split('/').join('-')`
(`js/fat_App_EventHandler.js`). Se a competência vier `062025` (sem barra), **as duas operações são
no-op** e o valor segue para a consulta ao ERP como `062025` em vez de `06-2025` — que é exatamente
a forma do defeito. Não há, no fonte, nenhuma validação do formato antes do envio; a pendência
declarada no ticket ("falta validação de formato na gravação da competência") **também vale para o
consumo no Fluig**, não só para a gravação no Protheus.
**Dados/massa usados:** nenhum — não submetido. Contrato `0000-2025-2501` (planilhas `000001` e
`000002`) inspecionado em leitura.

---

## CT-FSWTBC-2158  (ambos · Concluído · SDCASSI-24)

**Título:** Conferir que um contrato com medição automática gera exatamente um processo de Faturamento por competência, e não vários no mesmo mês.

**Origem:** FSWTBC-2158 — o contrato `00007-2023-3301` disparou medição **três vezes no mesmo mês**
sem qualquer alteração no contrato, e outros contratos também dispararam indevidamente. Causa-raiz:
**o campo de "dia da medição" está criado como CARACTER quando deveria ser NUMÉRICO**; a comparação
de dia como texto explica tanto o disparo múltiplo aqui quanto a *não*-geração dos 53 contratos de
FSWTBC-2038. A correção aplicada foi **conversão na query** ("para ter o menor impacto") e depois um
ajuste na validação de data da própria query — **o dicionário não foi corrigido**.

**Módulo/Rota:** Fluig → **Tracker - Processos Compras/Contratos**
(`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`), filtro *Filtrar por:* = **Faturamento de
Contratos**; e Fluig → **Acompanhamento de Contratos** → ícone `title="Informações do Contrato"` →
*Valores Financeiros* → **Medição Acumulada**.

**Pré-condições**
- Contrato com medição automática configurada (dia da medição preenchido) e competência em aberto.
- O agendamento (job/schedule) da medição automática ativo no Protheus.
- **Bloqueio:** triplo. (a) **Sem credencial Protheus.** (b) O caso depende de **rotina batch /
  schedule**, cuja execução o briefing proíbe (§2) — a verificação é **observacional**, ao longo de
  um ciclo mensal, não sob demanda. (c) **A causa-raiz não tem superfície de front-end nenhuma:** a
  tipagem do campo de dia da medição no dicionário (SX3) e o agendamento da rotina não são visíveis
  em nenhuma tela do Fluig. Só o **sintoma** (quantidade de processos gerados) é observável aqui.

**Passos**
1. Abrir o **Tracker - Processos Compras/Contratos**.
2. Em *Filtrar por:*, selecionar **Faturamento de Contratos**.
3. Em *Filtrar por - Informações do Fornecedor*, informar o **Número do Contrato** do contrato sob
   observação.
4. Em *Data da Solicitação (De)* e *(Até)*, delimitar **um único mês de competência**.
5. Deixar **Status = Todos** e aplicar o filtro.
6. Contar os processos retornados.
7. Repetir para um contrato cujo dia da medição seja um dia de **um único dígito** (ex.: dia `1`,
   `5`) e para outro de **dois dígitos** (ex.: dia `15`, `28`) — é a comparação texto × número que
   diferencia os dois.
8. Abrir o **Acompanhamento de Contratos** → ícone `title="Informações do Contrato"` do mesmo
   contrato e conferir **Medição Acumulada**.

**Resultado esperado**
- O Tracker retorna **exatamente um** processo de *Faturamento de Contratos* por contrato **por
  competência** dentro do mês filtrado.
- Contratos com dia da medição de **um dígito** e de **dois dígitos** se comportam igual: um
  processo cada. Nenhum dos dois grupos fica sem gerar nem gera em duplicidade.
- **Medição Acumulada** cresce uma vez por competência, não em múltiplos da mesma medição.
- Nenhum processo de medição é criado sem que tenha havido alteração/competência correspondente.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Três processos de *Faturamento de Contratos* para o contrato `00007-2023-3301` no mesmo mês, sem
  nenhuma alteração no contrato — e, no espelho, contratos que **deveriam** gerar e não geram
  (o caso dos 53 contratos de FSWTBC-2038).

**Severidade:** Alta — medição em duplicidade é risco financeiro direto (faturamento repetido) e o
espelho do mesmo defeito é faturamento **não** realizado.

**Preparação de massa:** dois contratos com medição automática, um com dia de medição de um dígito e
outro de dois dígitos, mais um mês de observação. **Nada disso pode ser preparado a partir do
Fluig** — depende de cadastro de contrato e de agendamento no Protheus, e a validação leva um ciclo
mensal. Enquanto o dicionário não for corrigido, o teste **só prova que a conversão na query
continua compensando** o campo mal tipado.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri o **Tracker** e confirmei que o filtro *Filtrar por:* oferece
**Faturamento de Contratos** e que existem os campos **Número do Contrato**, *Data da Solicitação
(De)/(Até)* e *Status (Todos/Abertos/Finalizados/Cancelados)* — ou seja, o oráculo "quantos
processos de medição existem para este contrato neste mês" é montável no Fluig. Confirmei também
**Medição Acumulada** no modal do contrato. **Não** executei nem agendei nenhuma rotina.
**Divergências encontradas:** **sem superfície de front-end para a causa-raiz.** O ticket fecha como
"Feito", mas a pendência registrada é que o campo de dia da medição **continua CARACTER no
dicionário**, mascarado por conversão na consulta. Nenhuma tela do Fluig expõe tipagem de campo do
Protheus, então **este caso não consegue provar que o defeito foi corrigido — só que o sintoma não
está presente**. Registre isso ao reportar: um verde aqui não é evidência de correção estrutural.
**Dados/massa usados:** nenhum — não submetido, nenhum filtro salvo, nenhuma rotina executada.

---

## CT-FSWTBC-2635  (ambos · Concluído · SDCASSI-86)

**Título:** As medições automáticas do dia são geradas e cada contrato elegível ganha sua instância
de Faturamento de Contratos, sem lacuna de dias.

**Origem:** FSWTBC-2635 (SD777283) — **nenhuma medição automática foi gerada a partir de
03/09/2025**, em produção. Causa raiz: **timeout** na consulta da API pela **quantidade de
registros**; a rotina diária carregava volume dimensionado para processamento mensal. Correção:
reduzir o número inicial de registros quando a seleção for diária (`mescompleto=false`). Paliativo:
disparar manualmente o start de processo para os contratos dos dias 03, 04 e 05. MUD16296 em
10/09/2025.

**Módulo/Rota:** *Acompanhamento de Contratos* (`/portal/p/1/acompanhamentoContrato`);
**Faturamento de Contratos** (`wf_faturamento_contratos`); *Logs Protheus* › abas
**Medicoes ZZZ** e **Erros CV8**.

**Pré-condições**
- Contratos com medição automática configurada, com competência vencendo no período observado.
- **Bloqueio:** **sim** — a verificação depende de **rodar a rotina automática**, e §2 proíbe
  executar rotina batch/schedule. O caso é de **observação** do resultado da rotina, não de
  disparo. Some-se o 404 do `genericQuery` nas abas de log.

**Passos**
1. Escolher uma janela de **três dias consecutivos** já decorridos.
2. Abrir *Logs Protheus* › **Medicoes ZZZ**, deixar *Status* em **Todos** e preencher
   *Recebimento inicial* e *Recebimento final* com o primeiro e o último dia da janela
   (formato ISO `aaaa-mm-dd`); clicar **Consultar**.
3. Anotar quantas linhas existem **por dia** — a coluna **Data Recb Me** é a data de recebimento.
4. Repetir com *Status* = **P** (pendente) e conferir se há linhas represadas.
5. Abrir *Logs Protheus* › **Erros CV8**, mesma janela de datas, e procurar no filtro **Texto** por
   termos de tempo esgotado (ex.: `timeout`); clicar **Consultar**.
6. Em `/portal/p/1/acompanhamentoContrato`, conferir que os contratos com competência vencida na
   janela têm medição correspondente.

**Resultado esperado**
- **Todo dia útil da janela tem linhas em Medicoes ZZZ** — nenhum dia com zero. Um dia vazio entre
  dois dias com movimento é o sinal exato deste defeito.
- As linhas com *Status* = **P** têm **Data Trat Me** preenchida em seguida (a fila anda); não há
  represamento crescente dia após dia.
- Em **Erros CV8**, nenhuma ocorrência de tempo esgotado na consulta de contratos para medição.
- Para cada contrato elegível existe uma instância de *Faturamento de Contratos* na competência.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- **Nenhuma medição automática gerada** a partir de determinada data — no relato original, de
  **03/09/2025** em diante, três dias seguidos (03, 04 e 05) sem nada, tratados manualmente depois.
- No Fluig: **zero linhas** em *Medicoes ZZZ* nesses dias e **nenhuma instância nova** de
  *Faturamento de Contratos*, sem qualquer aviso ao usuário.
- Evidência original: `image-20250905-150537.png` e a planilha
  `Resultado da consulta de solicitacoes.xlsx`, que é a prova do **volume**.

**Severidade:** Alta — dias inteiros de faturamento perdidos, em produção, sem alarme.

**Preparação de massa:** nenhuma a criar; o caso **observa** o resultado da rotina automática. Para
exercitar o limite de volume é preciso uma janela com **muitos contratos elegíveis no mesmo dia** —
isso só o dono do ambiente pode preparar, e **não deve** ser forçado pelo QA. Registrar o
parâmetro `mescompleto` em uso (a correção depende de ele ser `false` na seleção diária).

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — `/portal/p/1/acompanhamentoContrato` abre com
**845 linhas**; *Logs Protheus* › **Medicoes ZZZ** e **Erros CV8** existem, com todos os filtros
citados nos passos, e os campos de data são `<input type="date">` (**só aceitam ISO**); ao clicar
**Consultar**, `genericQuery` responde **404** e o rodapé do widget **fica travado em
"Consultando logs..."** com o toast *"Logs Protheus: Nao foi possivel consultar o dataset de
logs."*. **Nenhuma linha de fila foi lida** — daí o PARCIAL.
*Lido no fonte publicado* — as colunas de ZZZ e CV8 estão declaradas nos controllers
`ZZZController`/`CV8Controller` do widget, com os títulos citados.
**Divergências encontradas:** **achado, e vale reportar**: quando a consulta falha, o widget
*Logs Protheus* **não mostra erro no corpo** — `updatePagination()` só é chamada dentro do
`formatData` da datatable, que não roda em falha HTTP, então o rodapé permanece
*"Consultando logs..."* indefinidamente e a mensagem *"Nenhum registro encontrado."* nunca aparece.
**O usuário não distingue "ainda carregando" de "a consulta falhou"** — é o mesmo vício de
diagnóstico apontado na análise da FSWTBC-2536 (erro indistinguível de "nenhum resultado"). Além
disso os toasts **se acumulam** (cinco simultâneos após três abas).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2835  (ambos · Concluído · SDCASSI-114)

**Título:** Um contrato tem a situação alterada para **Vigente** e o Fluig passa a exibi-lo como
Vigente, com a data da alteração registrada.

**Origem:** FSWTBC-2835 — erro ao alterar a situação do contrato para "vigente":
**`invalid field name in Alias SB1->B1_XCPC on PROCCNZ(UGCTE001.PRW) linha 536`** (thread error). O
fonte referenciava o campo customizado **B1_XCPC** (SB1), que **não existia no dicionário** do
ambiente — o código subiu, o campo não. Resolvido criando o campo na base DES; **não houve alteração
de código**.

**Módulo/Rota:** *Acompanhamento de Contratos* (`/portal/p/1/acompanhamentoContrato`) — coluna
**Status** e modal **"Informações Complementares do Contrato"** (ícone de ação com
`title="Informações do Contrato"`); *Logs Protheus* › **Erros CV8**.

**Pré-condições**
- Um contrato em situação anterior a Vigente (ex.: **Em elaboração**/**Paralisado**) pronto para
  ser tornado Vigente.
- Dicionário do ambiente com o campo **B1_XCPC** criado na SB1.
- **Bloqueio:** **sim, e é estrutural** — **a alteração da situação do contrato NÃO tem superfície
  no Fluig**. O ato de tornar um contrato Vigente é rotina do **SIGAGCT no Protheus**
  (`UGCTE001.PRW`, função `PROCCNZ`) e não há tela, botão ou processo no Fluig que o faça. O Fluig
  **só observa o resultado**. Isso está dito aqui explicitamente em vez de simular cobertura.

**Passos**
1. *(No Protheus, por quem tem acesso — fora do escopo desta rodada)* alterar a situação do
   contrato para **Vigente**.
2. No Fluig, abrir `/portal/p/1/acompanhamentoContrato` e localizar o contrato pela coluna
   **Contrato** (usar o campo **Filtrar**).
3. Ler a coluna **Status** da linha.
4. Clicar no ícone de ação com `title="Informações do Contrato"` (as âncoras da coluna **Ação**
   **não têm nome acessível** — o gancho estável é o atributo `title`).
5. No modal **"Informações Complementares do Contrato"**, seção **Dados Gerais**, ler **Status:**;
   na seção **Datas**, ler **Data da Sit. Alter. p Vig:** e **Data do Ultimo Status:**.
6. Abrir *Logs Protheus* › **Erros CV8**, informar a **Filial** e a janela de datas da operação e,
   no campo **Texto**, procurar por `B1_XCPC` ou `PROCCNZ`; clicar **Consultar**.

**Resultado esperado**
- A coluna **Status** do contrato exibe **"Vigente"**.
- No modal, **Status:** é **Vigente** e **Data da Sit. Alter. p Vig:** traz a data em que a
  situação passou a vigente (no contrato de exemplo `000000000000001`, filial `3517`, esse campo
  está preenchido com `30/09/2025`) — é a prova, do lado Fluig, de que a alteração **concluiu**.
- **Data do Ultimo Status:** é coerente com a data da alteração.
- Em **Erros CV8**, **nenhuma** ocorrência contendo `B1_XCPC`, `PROCCNZ` ou `invalid field name`.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Thread error na alteração, com a mensagem exata do ticket:
  **`invalid field name in Alias SB1->B1_XCPC on PROCCNZ(UGCTE001.PRW) linha 536`**.
- No Fluig: o contrato **permanece na situação anterior**, e **Data da Sit. Alter. p Vig** fica
  vazia. Evidência original: `erro_alterar_situacao_contrato.log` (stack completo) e
  `imagem (13).png`.

**Severidade:** Alta — contrato que não se torna vigente não recebe medição nem faturamento.

**Preparação de massa:** um contrato pronto para virar Vigente, e **a confirmação de que o campo
customizado `B1_XCPC` existe no dicionário do ambiente em que se testa**. Esta é a preparação que
realmente importa: a pendência registrada no ticket é que o campo **foi criado apenas na base DES**,
sem registro de criação em TST e produção — **o mesmo erro reaparece na próxima subida** em qualquer
ambiente onde o campo não exista. Verificar isso é responsabilidade de quem faz o deploy;
**não há como o Fluig responder por isso**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — `/portal/p/1/acompanhamentoContrato` abre com
**845 linhas** e as colunas **Filial, Tipo Contrato, Contrato, Data Inicio, Data Fim, Nº Revisão,
Status, Fornecedor, Ação**. A coluna **Status** tem, hoje, a seguinte composição:
**Vigente 557, Finalizado 141, Paralisado 72, Sol. Finalização 59, Cancelado 16**. Os três ícones da
coluna **Ação** expõem `title="Planilha"`, `title="Solicitação de Compra"` e
`title="Informações do Contrato"` — **nenhum tem nome acessível**, confirmando a armadilha do
briefing. O ícone **Informações do Contrato** abre o modal **"Informações Complementares do
Contrato"**, com as seções **Dados Gerais** (*Filial*, *Filial Origem*, *Filial Origem do
Contrato*, *Número do Contrato*, *Tipo de Contrato*, *Espécie do Contrato*, *Revisão*, **Status**,
*Fiscal de Contrato*, *Fiscal de Serviço*, *Loja*, *Cond. Pagto*, *Forma de Contratação*,
*Cód. Fornecedor*, *Nome do Fornecedor*, *CNPJ do Fornecedor*, *Descritivo do Contrato*),
**Datas** (inclui **Data da Sit. Alter. p Vig** e **Data do Ultimo Status**), **Valores
Financeiros** e **Reajustes e Aditivos**. O ícone **Planilha** abre o modal *"Informações da
Planilha"* (grade *Planilhas do Contrato*: **Filial, Contrato, Planilha, Revisão, Cod. Fornecedor,
Fornecedor, Loja Forn., Ações**). *Lido no fonte publicado* — a aba **Erros CV8** filtra por
`CV8_MSG`, `CV8_DET`, `CV8_PROC` e `CV8_SBPROC` no campo **Texto**, que é o que permite procurar
`B1_XCPC`/`PROCCNZ` sem entrar no Protheus.
**Divergências encontradas:** (a) **não existe superfície no Fluig para o ato de alterar a situação
do contrato** — o caso observa apenas o efeito, e isso está declarado; (b) o briefing documenta que
este modal traz também *Status da Integração GCT* e *Erro de Integração* — **confirmei
*Fiscal de Serviço*, mas o meu recorte do modal terminou em "Reajustes e Aditivos" e não alcançou
esses dois campos**; ficam como `<não confirmado nesta rodada>`; (c) a grade do *Acompanhamento de
Contratos* **carrega de forma intermitente** — em duas de quatro aberturas as 845 linhas não
renderizaram no tempo de espera. É **instabilidade de ambiente**, não defeito.
**Dados/massa usados:** leitura do contrato **`000000000000001`**, filial **3517**, tipo
*076 - TELEFONIA FIXA*, status **Vigente** — **somente leitura**, nada foi alterado.

---

## CT-FSWTBC-3441  (protheus · Concluído · SDCASSI-163)

**Título:** Incluir um contrato (manualmente no Protheus e via SC de Nova Contratação no Fluig) e vê-lo gravado sem erro de dicionário

**Origem:** FSWTBC-3441 — Ao incluir contrato: `THREAD ERROR — variable does not exist V on FWInitCpo/FWCloseCpo (PROTHEUSFUNCTIONMVC.PRX linha 5577)`. Causa: expressão inválida gravada no dicionário SX3 (validação/inicializador de campo referenciando a variável `v`). "Erro já corrigido" em 08/12/2025, **sem registro de qual campo**. Gêmeo do FSWTBC-3442 (visualizar).

**Módulo/Rota:** Protheus · SIGAGCT · *Contratos > Gestão de Contratos > Contratos > Incluir* (CNTA300). **Fluig (superfície do mesmo modelo):** *Solicitação de Compras* com *Tipo de Solicitação* = **Nova Contratação** ou **Aditivo Contratual** → integração `integracaoERP3` (287) → atividade *Verificar retorno Protheus* (317) → campo **Retorno Integração** (`buyerRetIntTreat`). A criação do contrato pelo Fluig ativa o modelo CNTA300 — o mesmo `FWInitCpo` do ticket — o que já está provado por dado: a SC **112855** está parada na 317 com `Nao foi possivel ativar o modelo CNTA300 para gerar o aditivo.`

**Pré-condições**
- Fluig: conta de QA com acesso a *Solicitação de Compras*; um contrato vigente descoberto em tempo de execução para a variação Aditivo (o formulário lista os contratos do solicitante).
- Protheus (variação manual): usuário com acesso ao SIGAGCT.
- Dicionário do ambiente-alvo com os campos customizados de contrato das DEMs 10013766/10015225 aplicados.
- **Bloqueio:** a variação manual exige credencial Protheus (não há nesta rodada). A variação Fluig **escreve** (cria SC e, se a integração passar, um contrato no ERP): executar só com prefixo `QA` e em homologação; a conta de QA hoje **não resolve matrícula de comprador**, então o caminho até a 287 depende de outro perfil para as etapas de cotação/alçada — o caso pode ficar bloqueado antes da integração.

**Passos**
1. Fluig: *Solicitação de Compras* → *Tipo de Solicitação* = **Nova Contratação**; preencher itens com descrição `QA <sufixo>`; enviar.
2. Acompanhar pela Central de Tarefas / Tracker (visão *Solicitação de Compras*) até a SC passar pela integração 287.
3. Abrir a SC: ler o campo **Retorno Integração** e o campo *Nº do Contrato* gerado (se houver); abrir o Histórico e ler a linha *Integração executada com sucesso - Tempo de Execução N s*.
4. Se a SC parar em **Verificar retorno Protheus (317)**, ler *Retorno Integração* — é aí que o erro do modelo aparece.
5. Fluig, contraprova: *Acompanhamento de Contratos* → filtrar o contrato novo → modal *Informações Complementares do Contrato* → *Status da Integração GCT* e *Erro de Integração*.
6. Protheus (quando houver credencial): *Contratos > Incluir*, preencher cabeçalho, planilha e os campos customizados; confirmar.

**Resultado esperado**
- A SC não para na 317: o contrato é gerado no ERP e o número aparece na SC; *Retorno Integração* vazio ou com mensagem de sucesso.
- Se houver erro de dicionário, ele **aparece** em *Retorno Integração* **e** em *Erro de Integração* (modal) com texto legível — nunca silêncio com Histórico dizendo "executada com sucesso".
- No Protheus, a inclusão manual conclui sem `THREAD ERROR`.

**Resultado se o defeito reincidir**
- Protheus: `variable does not exist V on FWInitCpo(...)`, contrato não gravado.
- Fluig: SC presa em *Verificar retorno Protheus* com *Retorno Integração* trazendo a falha de ativação do modelo (padrão observado hoje na 112855: `Nao foi possivel ativar o modelo CNTA300 ...`).

**Severidade:** Alta *(inclusão de contrato bloqueada em todo o MVC — nenhuma contratação nova entra)*

**Preparação de massa:** SC `QA` criada pelo executor. Para a variação Aditivo, um contrato vigente do solicitante (descoberto na tela, não fixado). No Protheus, contrato `QA` incluído pelo executor. Não reaproveitar a 112855 — é registro pré-existente, não tocar.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o estado da SC 112855 (medido em 08/09, não remedido): parada na 317 há 11 dias, `buyerRetIntTreat` = `Nao foi possivel ativar o modelo CNTA300 para gerar o aditivo.`, `erroIntegracao` **vazio**, Histórico *"Integração executada com sucesso - 4 s"* — prova que a superfície existe e que erro do modelo chega ao Fluig. *Acompanhamento de Contratos* e o modal foram abertos (rótulos confirmados). O caminho de criação **não foi percorrido** (escreve; e a conta de QA não chega à etapa de comprador).
**Divergências encontradas:** (1) o Histórico registra "sucesso" enquanto o ERP recusou o modelo — para o executor, só *Retorno Integração* diz a verdade; (2) `erroIntegracao` fica vazio apesar do erro (mesmo padrão do A15-b); (3) o ticket não nomeia o campo do dicionário corrigido — impossível montar massa dirigida.
**Dados/massa usados:** SC 112855 apenas por leitura de API; nenhum registro criado.

---

## CT-FSWTBC-3482  (protheus · Concluído · SDCASSI-166)

**Título:** Acompanhar um contrato recém-gerado pela SC até ficar Vigente, passando obrigatoriamente pela situação Aprovação

**Origem:** FSWTBC-3482 — O contrato 6202-2025-5303 "não passou pela aprovação" da gestora e seguiu direto. Mesmo sintoma do FSWTBC-2890 (`MV_XALCGCT` desabilitado). O teste em TST (30/12/2025) mostrou o fluxo correto; concluiu-se que era divergência da base DES, **sem investigar a causa** — a DES segue produzindo falsos defeitos.

**Módulo/Rota:** Fluig · *Acompanhamento de Contratos* (`/portal/p/1/acompanhamentoContrato`), coluna *Status*; modal *Informações Complementares do Contrato* (*Status da Integração GCT*). Origem do contrato: *Solicitação de Compras* → *Nova Contratação* → integração 287. Protheus: SIGAGCT, aprovação de contrato (alçada `MV_XALCGCT`, Configurador).

**Pré-condições**
- `MV_XALCGCT` habilitado no ambiente-alvo (a confirmar com o administrador; não é legível pelo Fluig).
- Uma SC `QA` de *Nova Contratação* que chegue ao fim da integração e gere contrato no ERP (ver bloqueio do CT-FSWTBC-3441: a conta de QA não chega à etapa de comprador).
- Alternativa de leitura, sem escrever: contratos já existentes com `CN9_XSC = 2` (origem SC) em situação *Elaboração* (02) ou *Aprovação* (04).
- **Bloqueio:** a aprovação em si é ação da gestora **no Protheus** (sem credencial nesta rodada); no Fluig só se observa a sequência de situações.

**Passos**
1. Em *Acompanhamento de Contratos*, filtrar o contrato gerado pela SC e ler *Status* (esperado inicial: *Elaboração*).
2. Aguardar a emissão pelo comprador no Protheus; recarregar e ler *Status* (esperado: *Emitido* → *Aprovação*).
3. Abrir o modal *Informações Complementares do Contrato* e ler *Status da Integração GCT*.
4. Após a aprovação da gestora (Protheus), recarregar e ler *Status* (esperado: *Vigente*).
5. Registrar data/hora de cada transição (a grade não guarda histórico — anotar manualmente).

**Resultado esperado**
- O contrato passa pela situação **Aprovação (04)** antes de *Vigente (05)*; nunca sai de *Emitido/Elaboração* direto para *Vigente*.
- Enquanto está em *Aprovação*, a medição não é permitida (não aparece no Faturamento de Contratos).

**Resultado se o defeito reincidir**
- O contrato aparece como *Vigente* sem ter passado por *Aprovação*; a gestora não recebe a pendência.

**Severidade:** Alta *(alçada de aprovação pulada)*

**Preparação de massa:** de preferência sem criar: usar os contratos com origem SC em *Elaboração* — hoje 8 (`00029-2024-5303`, `6192-2025-5303`, `6203-2025-5303`, `6174-2025-5303`, `00049-2026-5303`, `00037-2026-5303`, `000000000000258`, `000000000000219`) — e o único em *Aprovação*: `00051-2026-5303` (origem SC). Quem os move é o comprador/gestora no Protheus.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Acompanhamento de Contratos* abre (845 linhas) com a coluna *Status* e o mapa 01–11; **existe** contrato em *Aprovação* (`00051-2026-5303`, `CN9_XSC=2`), o que prova que a etapa está ativa no ambiente hoje. O contrato do ticket, **6202-2025-5303, não existe** neste tenant; o vizinho `6203-2025-5303` existe em *Elaboração* (origem SC, cotação 000257, vigência 21/09/2025–20/09/2030). A transição não foi acompanhada (depende do Protheus).
**Divergências encontradas:** número do ticket ausente no tenant; o ticket não registra por que a DES pulava a aprovação — o caso só consegue afirmar a sequência de situações, não a causa.
**Dados/massa usados:** leitura do dump de contratos; nenhum registro criado.

---

## CT-FSWTBC-3604  (Fluig · Concluído · SDCASSI-30)

**Título:** Iniciar uma Delegação de Fiscais de Contrato/Serviço no Fluig, selecionando contrato, planilha e medição vindos do Protheus DES, e levar a solicitação até o aceite do fiscal

**Origem:** FSWTBC-3604 — "[CASSI - DEM10014382] - REPLICAÇAO DA BASE DES - GAP". Sem descrição; quarteto de 24/12/2025. O épico FSWTBC-2197 (DEM10014382) substitui a delegação manual em papel por um processo no Fluig com registro sistematizado do aceite do fiscal. O gap de replicação se manifesta como o formulário não conseguindo resolver matrícula, contrato, planilha ou medição no DES.

**Módulo/Rota:** Fluig → Iniciar Solicitações → **"Delegação de Fiscais de Contrato/Serviço"** (`/portal/p/1/pageworkflowview?processID=wf_delegacaoFiscalContratoServico`) → formulário "Delegação de Fiscais de Contratos e Serviços" → etapas Aprovação do Gestor Imediato → Aprovação do Gerente da Divisão → Decisão da Delegação (fiscal). Datasets Protheus DES observados na carga: `ds_protheus_getMatriculaTitular_rest`.

**Pré-condições**
- Conta com matrícula de funcionário resolvível no DES (a conta de QA **não** tem: o dataset devolve "Erro 401 --> Funcionario não localizado atraves do email matricula").
- Um contrato vigente no DES com planilha e medição, para os campos "Filial Contrato*/Número Contrato*/Filial Planilha*/Número Planilha*/Filial Medição*".
- Logins do gestor imediato, gerente da divisão e fiscal designado.
- **Bloqueio:** conta de QA sem matrícula no Protheus DES e sem os perfis aprovadores (limitação de conta — bloqueio de Fluig). O processo **abre** para a conta de QA (heading "Início", botão "Enviar").

**Passos**
1. Abrir a rota acima; conferir título "Movimentar Solicitação", heading "Início", abas Formulário/Informações/Histórico/Anexos e botão "Enviar".
2. No formulário, conferir as seções e campos: *Identificação do Processo / Solicitante* ("Nº de Identificação*", "Solicitante *", "Email do Solicitante *", "Data da Solicitação *", "Hora da Solicitação *"); *Identificação do Contrato/Serviço* ("Tipo da Solicitação*", "Filial Contrato*", "Número Contrato*", "Filial Planilha*", "Número Planilha*", "Filial Medição*", "Objeto do Contrato"); *Identificação do Gestor Imediato* ("Gestor Imediato *", "Email do Gestor *"); *Identificação do Gerente da Divisão*; *Identificação do Fiscal* ("Fiscal *", "Email do Fiscal *"); *Decisão da Delegação* ("Termo de aceite:*", "Aceitar? *").
3. Conferir que "Solicitante" e "Email do Solicitante" vêm preenchidos pela matrícula (dataset `ds_protheus_getMatriculaTitular_rest`).
4. Selecionar o contrato de teste; conferir que "Objeto do Contrato" é preenchido e que planilha e medição listam apenas as do contrato (dados do DES).
5. Informar gestor imediato, gerente e fiscal; escrever `QA` no campo de texto livre disponível; clicar "Enviar".
6. Como gestor imediato: abrir a tarefa, marcar "Aprovar? *" = Sim e enviar; repetir como gerente da divisão.
7. Como fiscal: abrir a tarefa, ler o "Termo de aceite", marcar "Aceitar? *" = Sim e enviar.
8. Abrir o Histórico da solicitação e conferir as três decisões com data/hora.

**Resultado esperado**
- O formulário resolve solicitante, contrato, planilha e medição a partir do DES sem vazio silencioso.
- Campos obrigatórios (asterisco) bloqueiam o envio quando vazios, com crítica visível.
- Cada aprovação e o aceite do fiscal ficam registrados no Histórico — o "registro sistematizado" que a DEM entrega.
- A instrução do formulário é coerente (ver A10: hoje diz "Todos os campos com * são obrigatórios já os campos com * não são obrigatórios").

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Contrato/planilha/medição não encontrados ou matrícula não resolvida porque o DES não foi replicado com os dados/dicionário da DEM — homologação impossível no ambiente de desenvolvimento (o GAP).

**Severidade:** Média — bloqueia o fluxo; o aceite do fiscal tem valor de responsabilização formal.

**Preparação de massa:** contrato vigente no DES com planilha e medição (pré-condição de leitura, não criável pela automação); usuário solicitante com matrícula no DES; três aprovadores.

**Verificado em tela:** PARCIAL
**O que foi verificado:** rota aberta com a conta de QA: título "Cassi - Fluig Plataforma - Movimentar Solicitação", heading "Início", abas "Formulário/Informações/Histórico 0/Anexos 0", botões "Enviar" e "Opções"; breadcrumb "Início › Processos › Iniciar Solicitações › Delegação de Fiscais de Contrato/Serviço"; todos os rótulos listados no passo 2 presentes no formulário (iframe), mais "Aprovar? *", "Sim", "Não", "Motivo:*", "Data da Resposta *", "Hora da Resposta*"; texto "Todos os campos com * são obrigatórios já os campos com * não são obrigatórios". Dataset `ds_protheus_getMatriculaTitular_rest` chamado na carga (POST 200, 0 colunas); GET search do mesmo → 200 com `{"error":"Erro 401 --> Funcionario não localizado atraves do email matricula"}` — o DES responde, mas a conta de QA não tem matrícula. Não preenchido nem enviado.
**Divergências encontradas:** (1) o ticket é de infraestrutura Protheus, mas a DEM é um processo Fluig — classificado como Fluig; (2) o processo se chama "Delegação de Fiscais de Contrato/Serviço" na lista e "Delegação de Fiscais de Contratos e Serviços" no formulário; (3) erro do dataset de matrícula chega como HTTP 200 com texto "Erro 401" dentro do conteúdo — indistinguível de vazio para a tela (mesma classe do A17-a).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3615  (protheus · Concluído · SDCASSI-186)

**Título:** Incluir um contrato num ambiente onde a fila de medições (ZZZ) tem tabela e índice aplicados

**Origem:** FSWTBC-3615 — Ao incluir contrato: `ZZZ: Não existe índice para esse alias no SINDEX`. A tabela `ZZZ` (fila de medições da DEM10014371) existia sem índice no SINDEX; a inclusão de contrato acessa a `ZZZ` por índice. Índice recriado **só na base DES**, sem verificação nos demais ambientes nem processo de integridade de dicionário. Seguido pelo FSWTBC-3625 (`Alias does not exist ZZZ`).

**Módulo/Rota:** Protheus · SIGAGCT · *Contratos > Incluir* (CNTA300, com ponto de entrada customizado que toca a `ZZZ`); Configurador → dicionário (SX2/SIX) da `ZZZ`. **Fluig:** *Logs Protheus* → aba **Medicoes ZZZ** (colunas *Filial, Num Med, Contrato, Revisao, Json Medicao, Status, Data Recb Me, Data Trat Me, ID Fluig, Hora Rec Med, Hora Eft Med, Msg Medicao, Filial Medic*) — é a leitura direta da tabela; e a SC de *Nova Contratação* → *Retorno Integração* / *Verificar retorno Protheus* (317), por onde o erro de inclusão chega quando o contrato nasce do Fluig.

**Pré-condições**
- Ambiente-alvo com o pacote da DEM10014371 aplicado (tabela `ZZZ` + índices).
- SC `QA` de *Nova Contratação* pronta para integrar (ver limitação de conta em CT-FSWTBC-3441) **ou** usuário Protheus para inclusão manual.
- **Bloqueio:** inclusão manual exige credencial Protheus (não há); via Fluig, a conta de QA não chega à etapa de comprador. A aba *Medicoes ZZZ* responde **404** hoje (ambiente).

**Passos**
1. Fluig: abrir *Logs Protheus* → aba *Medicoes ZZZ* → *Consultar* com período dos últimos 7 dias. A grade deve renderizar (mesmo vazia) — prova que a tabela responde.
2. Incluir o contrato (Protheus manual, ou SC `QA` de *Nova Contratação* pelo Fluig).
3. Se via Fluig: acompanhar a SC até a integração 287; se parar em *Verificar retorno Protheus* (317), ler *Retorno Integração*.
4. Após a inclusão, repetir o passo 1 e conferir se surgiu registro para o contrato (se o processo gerar medição pendente).
5. Acompanhamento de Contratos → modal *Informações Complementares do Contrato* → *Erro de Integração*.

**Resultado esperado**
- Inclusão concluída; nenhuma mensagem de SINDEX/alias.
- *Medicoes ZZZ* consulta sem erro; *Retorno Integração* e *Erro de Integração* vazios.

**Resultado se o defeito reincidir**
- `ZZZ: Não existe índice para esse alias no SINDEX` na inclusão; via Fluig, a SC trava na 317 com a mensagem em *Retorno Integração*.

**Severidade:** Média *(bloqueia o fluxo de inclusão; não corrompe dado)*

**Preparação de massa:** SC `QA` de Nova Contratação criada pelo executor (com perfil que chegue ao comprador) ou contrato `QA` manual no Protheus. Antes, o administrador confirma no Configurador que `ZZZ` tem índices no SIX/SINDEX do ambiente-alvo.

**Verificado em tela:** PARCIAL
**O que foi verificado:** widget *Logs Protheus* aberto; aba *Medicoes ZZZ* presente com as colunas do fonte `ZZZController`; consulta responde **404** (`genericQuery`), o que impede afirmar se a `ZZZ` está íntegra hoje. O padrão "erro de inclusão de contrato chega ao Fluig pela 317/*Retorno Integração*" está provado pela SC 112855 (CNTA300). Nada incluído.
**Divergências encontradas:** o widget não distingue "tabela vazia" de "consulta falhou" (fica em "Consultando logs..." / grade vazia) — para este caso, isso significa que a própria ausência da `ZZZ` seria invisível pelo widget.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3623  (fluig · Concluído · SDCASSI-189)

**Título:** Conferir que todos os itens gravados numa SC permanecem nela até o fim do ciclo, comparando a grade do formulário com o que foi integrado ao ERP.

**Origem:** FSWTBC-3623 — a filial não recebeu vários itens de material/medicamento da **SC 49298**; a investigação mostrou que os itens foram **excluídos da SC** entre as versões **34000 e 35000** do formulário (a SC havia sido gerada no ERP entre as versões 30000 e 31000). Encerrado em 04/02/2026 **sem causa identificada**: os logs do Fluig da janela do incidente (09 e 12/09) estavam **fora da retenção** da TOTVS. O cliente varreu o período e não achou outros casos.

**Módulo/Rota:** *Solicitação de Compras* › seção **Identificação do(s) Produto(s)/Serviço(s)** › grade **Produtos/Serviços da Solicitação**; conferência cruzada no *Tracker - Processos Compras/ Contratos*, visão **Produtos/Rateio SC**; aba **Histórico** da solicitação.

**Pré-condições**
- Uma SC com **vários itens** (o incidente era de material/medicamento, com muitas linhas), já integrada ao ERP — ou seja, com **Nº da Solicitação ERP** preenchido.
- A SC precisa ter passado por ao menos uma etapa que reabra e regrave o formulário (ex.: `11 - Ajustar Informações` ou uma atividade de `Correção`), que é o momento em que uma nova versão do formulário é gerada.
- **Bloqueio:** parcial. A comparação item a item é executável no Fluig; a confirmação de que o ERP recebeu os mesmos itens **não é** — não há credencial de Protheus nesta rodada. Além disso, o **Fluig não expõe ao usuário final um comparativo entre versões do formulário**: o Histórico registra movimentações e conversões de versão de **processo**, não o diff de itens entre versões de **documento**.

**Passos**
1. Abrir a SC (Central de Tarefas ou Tracker) e, na grade **Produtos/Serviços da Solicitação**, contar as linhas e anotar `Item`, `Produto/Serviço`, `Quantidade` e `Vlr. Total Estimado` de cada uma.
2. Anotar o **Nº da Solicitação ERP** e o **Nº do Processo Fluig**.
3. Movimentar a SC por uma etapa que regrave o formulário (ex.: retorno para **Ajustar Informações** e novo envio), **sem** alterar itens.
4. Reabrir a SC e recontar as linhas da grade, comparando com o anotado no passo 1.
5. Abrir o **Tracker › Filtrar por: Produtos/Rateio SC**, informar o **Nº do Processo Fluig** e **Pesquisar Registro**; conferir que a lista de itens retornada tem a mesma composição da grade do formulário.
6. Na aba **Histórico**, registrar as movimentações ocorridas entre as duas leituras (autor, atividade e horário).
7. Solicitar ao time, para a mesma SC, a conferência dos itens da solicitação no ERP.

**Resultado esperado**
- A quantidade de linhas e a composição da grade **Produtos/Serviços da Solicitação** são idênticas antes e depois da movimentação: nenhum item some, nenhum item aparece.
- A visão **Produtos/Rateio SC** do Tracker devolve exatamente os mesmos itens da grade do formulário.
- O conjunto de itens da SC no Fluig corresponde ao da solicitação gerada no ERP (`Nº da Solicitação ERP`).
- O Histórico permite reconstruir quem movimentou a solicitação entre as duas leituras.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Itens que existiam na SC **desaparecem** da grade sem registro de exclusão e sem mensagem: na SC 49298 a solicitação foi gerada no ERP entre as versões 30000 e 31000 do formulário e os itens sumiram entre as versões **34000 e 35000**. O sintoma só é percebido **fora do sistema**, quando a filial reclama de não ter recebido o material (a evidência do ticket é a cadeia de e-mails `RES RECEBIMENTO DE MEDICAMENTO_SC49298.msg`).

**Severidade:** Alta *(perda silenciosa de dado com impacto operacional direto — medicamento não entregue a uma filial — e sem mecanismo de detecção)*

**Preparação de massa:** uma SC com muitos itens (idealmente de material/medicamento) já integrada ao ERP, que possa ser movimentada por uma etapa de ajuste sem alteração de conteúdo — a ser indicada pelo time da CASSI, porque a conta de QA não conclui o ciclo até a integração. **Duas limitações que precisam ser ditas ao time antes de executar:** (1) **não existe superfície no Fluig** que compare a composição de itens entre duas versões do formulário — a comparação do caso é feita por anotação manual do executor, não pelo sistema; (2) a investigação original morreu por **retenção de log** (os dias 09 e 12/09 não estavam disponíveis), de modo que, se o defeito reincidir, a apuração depende de o log estar dentro da janela de retenção da TOTVS. Um alerta que compare "nº de itens da SC no Fluig × nº de itens da solicitação no ERP" seria a única detecção automática possível hoje.

**Verificado em tela:** PARCIAL
**O que foi verificado:** na solicitação real **112146** (aberta somente para leitura), a seção **Identificação do(s) Produto(s)/Serviço(s)** traz a grade **Produtos/Serviços da Solicitação** com uma linha (`0001 - 00000003 - AR CONDICIONADO DE JANELA`, `UN`, quantidade `111,111111`, preço `1.221,221212`, total `135.691,25`) e os campos `Nº da Solicitação ERP` (`000052`) e `Nº do Processo Fluig` (`112146`). A aba **Histórico** existe e registra as movimentações, inclusive a conversão *"Paulo Calixto (TOTVS) Converteu o processo wf_solicitacao_compras da versão 93 para a versão 94"* com o mapeamento *Atividades Origem : Atividades Destino*. A aba **Informações** traz *Atividade atual*, *Número da solicitação*, *Responsável*, *Prazo* e **Visualizar diagrama**. O **Tracker** oferece a visão **Produtos/Rateio SC** no combo *Filtrar por:*, com o filtro **Nº do Processo Fluig**.
**Divergências encontradas:** o ticket raciocina em cima de **versões do formulário** (30000/31000, 34000/35000) — números que **não aparecem em lugar nenhum das telas acessíveis ao usuário**: nem a aba *Informações*, nem a aba *Histórico*, nem a aba *Anexos* exibem a versão do documento do formulário. O que o Histórico versiona é o **processo** (versão 93 → 94), coisa diferente. Ou seja, a técnica de diagnóstico usada no ticket não é reproduzível por um analista em tela; exige consulta administrativa ao ECM. Além disso, ao acionar **Pesquisar Registro** no Tracker, nenhuma grade de resultado foi renderizada (mesma janela em que a grade de contratos oscilou de 845 para 0 registros) — não distingui instabilidade de ambiente de falha de renderização.
**Dados/massa usados:** solicitação 112146 (já existente, da própria conta de QA), aberta somente para leitura — nada foi movimentado.

---

## CT-FSWTBC-3625  (protheus · Concluído · SDCASSI-191)

**Título:** Incluir um contrato num ambiente onde a tabela ZZZ existe fisicamente e está no dicionário (pós-aplicação do pacote da fila de medições)

**Origem:** FSWTBC-3625 — Após o FSWTBC-3615, o erro mudou para `Alias does not exist ZZZ` em `TABLECREATE (APLIB200.PRW) linha 1913`: a `ZZZ` nem está disponível no ambiente da DEM10015225. Correção prometida junto com o SDCASSI-168 (09/01/2026); encerrado em 05/03/2026 **por decurso** ("decorrido o tempo com contratos sendo gerados, entendemos que foi resolvida"), sem verificação.

**Módulo/Rota:** Protheus · SIGAGCT · *Contratos > Incluir* (CNTA300 + ponto de entrada que abre a `ZZZ`); Configurador → *Base de Dados > Dicionário > Tabelas* (SX2 `ZZZ`). **Fluig:** *Logs Protheus* → aba **Medicoes ZZZ** (se a tabela não existe, a aba não tem o que consultar); SC de *Nova Contratação* → *Retorno Integração* / *Verificar retorno Protheus* (317).

**Pré-condições**
- Pacote da DEM10014371 aplicado no ambiente-alvo (SX2 + SIX + tabela física `ZZZ`).
- Mesmas de CT-FSWTBC-3615 para a inclusão (credencial Protheus ou SC `QA` com perfil de comprador).
- **Bloqueio:** idêntico ao CT-FSWTBC-3615 — sem credencial Protheus; via Fluig, limitação de conta; aba ZZZ em 404 hoje.

**Passos**
1. Configurador: confirmar que a tabela `ZZZ` consta no dicionário e existe fisicamente (a confirmar com o administrador — não é visível pelo Fluig).
2. *Logs Protheus* → *Medicoes ZZZ* → *Consultar* (período de 7 dias): a grade renderiza.
3. Incluir o contrato (Protheus manual ou SC `QA` de *Nova Contratação*).
4. Se via Fluig, ler *Retorno Integração* se a SC parar na 317.
5. Repetir a consulta ZZZ e ler o modal *Informações Complementares do Contrato* → *Erro de Integração*.

**Resultado esperado**
- Inclusão concluída sem `Alias does not exist`; a aba *Medicoes ZZZ* consulta normalmente.

**Resultado se o defeito reincidir**
- `Alias does not exist ZZZ` em `TABLECREATE(APLIB200.PRW)`; contrato não incluído; via Fluig, SC na 317 com a mensagem em *Retorno Integração*.

**Severidade:** Média *(bloqueia inclusão; ambiente-dependente)*

**Preparação de massa:** como no CT-FSWTBC-3615. Este caso e o 3615 devem ser executados **em cada ambiente** (DES/TST/PRD) — o defeito é de aplicação de dicionário por ambiente.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o mesmo do CT-FSWTBC-3615: aba *Medicoes ZZZ* presente, consulta em 404 hoje; padrão 317/*Retorno Integração* provado pela SC 112855. Indício indireto de que a `ZZZ` existe no ambiente ligado a este Fluig: o Faturamento de Contratos gerou 60 instâncias automáticas hoje e o processo depende da fila ZZZ/ZZY (DEM10014371) — mas isso não prova o dicionário do ambiente da DEM10015225.
**Divergências encontradas:** encerramento por decurso — o caso é a verificação que o ticket não fez.
**Dados/massa usados:** nenhum — não submetido.

---

## Resumo do lote

| Key | Superfície | Verificado | Módulo ERP (se SEM) |
|---|---|---|---|
| FSWTBC-3266 | COM (Tracker/Faturamento, Logs ZZZ, Acompanhamento) | PARCIAL | — |
| FSWTBC-3355 | SEM | NÃO | Contratos - GCT |
| FSWTBC-3358 | SEM | NÃO | Contratos - GCT |
| FSWTBC-3418 | SEM | NÃO | Financeiro e Contabil |
| FSWTBC-3441 | COM (SC 317 / Retorno Integração, modal) | PARCIAL | — |
| FSWTBC-3442 | SEM | NÃO | Contratos - GCT |
| FSWTBC-3482 | COM (Acompanhamento de Contratos · Status) | PARCIAL | — |
| FSWTBC-3490 | SEM | NÃO | Financeiro e Contabil |
| FSWTBC-3491 | SEM | NÃO | Contratos - GCT |
| FSWTBC-3590 | COM (Logs Protheus · Erros CV8) | PARCIAL | — |
| FSWTBC-3598 | COM (Cotação · Erro retornado pelo ERP / SC 317) | PARCIAL | — |
| FSWTBC-3615 | COM (Logs Protheus · Medicoes ZZZ / SC 317) | PARCIAL | — |
| FSWTBC-3624 | SEM | NÃO | Compras |
| FSWTBC-3625 | COM (Logs Protheus · Medicoes ZZZ / SC 317) | PARCIAL | — |

**Achados novos deste lote (não estavam em ticket):**
1. **Reincidência do SDCASSI-148 pós-encerramento:** processo 109615 (contrato 00010-2022-5303, fim 01/07/2026) iniciado automaticamente em 29/07/2026 — o parâmetro `MV_CNFVIGE` provavelmente continua 'S'.
2. `ds_fatcon_get_medicaoAutomatica` devolve erro de script (`Cannot call method "trim" of undefined`) **como valor da coluna FILIALCONTRATO**, com HTTP 200 (contrato 00043-2024-5303).
3. Mapa de status do Acompanhamento de Contratos tem dois códigos com o rótulo "Cancelado" (01 e 11).
4. `dsFluig_getProcFaturamentoSql_CASSI` sem constraint devolve `{ERRO: "Cannot read property \"length\" from null"}` com HTTP 200 — mesma classe do A17.
5. Os 60 disparos automáticos de 08/09 são todos de contratos da filial **5304** (57 de 60 não constam no dump de contratos, que é da 5303) — a grade de contratos usada pelos testes cobre uma filial só.

## CT-FSWTBC-3637  (ambos · Concluído · SDCASSI-194)

**Título:** Concluir o fluxo de compras centralizadas e conferir que o pedido/contrato é gerado e o número retorna à SC.

**Origem:** FSWTBC-3637 — "os pedidos/contratos não foram gerados": ao fim da cadeia (SC centralizada → cotação → negociação → alçada), o documento de compra não é criado no ERP. Aberto e fechado no mesmo dia, sem causa raiz e com evidência mínima.

**Módulo/Rota:** Fluig → **Solicitação de Compras** → painel **Verificar Retorno Protheus** (campos **Retorno Integração** e **Enviar para**); e grade da **Empresa Vencedora** (`tbForneceAlcadas`), campos **Nº Pedido** / **Nº Contrato**.

**Pré-condições**
- Uma SC que tenha percorrido cotação, negociação e alçada, posicionada na geração do pedido/contrato.
- **Tipo de Compra** definido: com *Pedido* espera-se **Nº Pedido**; com *Contrato* espera-se **Nº Contrato** (os campos de contrato só entram sob `tipoCompra === "2"`).
- **Bloqueio:** a geração do documento acontece **no Protheus**; sem credencial de ERP não é possível confirmar a criação lá. A âncora no Fluig é o painel *Verificar Retorno Protheus* e o campo **Nº Pedido**/**Nº Contrato** da grade da Empresa Vencedora. Levar uma SC até essa etapa **escreve** — não executado.

**Passos**
1. Abrir a SC posicionada após a alçada.
2. Ir à grade da **Empresa Vencedora** e conferir o **Tipo de Compra** aplicado.
3. Conferir o campo exibido: **Nº Pedido\*** (Tipo de Compra = Pedido) ou **Nº Contrato\*** (Tipo de Compra = Contrato).
4. Abrir a aba **Histórico** e localizar as atividades de serviço da integração, lendo o tempo de execução de cada uma.
5. Se o processo estiver parado, abrir o painel **Verificar Retorno Protheus** e ler o campo **Retorno Integração**.
6. Conferir o combo **Enviar para** desse painel e as opções disponíveis.

**Resultado esperado**
- O campo **Nº Pedido** ou **Nº Contrato** da grade da Empresa Vencedora vem **preenchido** com o número devolvido pelo ERP.
- O **Histórico** registra `Integração executada com sucesso - Tempo de Execução <N> s` na atividade de serviço da geração.
- O campo **Retorno Integração** não traz mensagem de erro.
- O processo avança sem parar no painel *Verificar Retorno Protheus*.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Fim do fluxo sem pedido nem contrato gerado no ERP, com o processo sem número de documento (evidência do ticket: `imagem (3).png`, 24 KB, apenas a mensagem de tela).

**Severidade:** Alta *(a compra não se materializa em documento — o processo inteiro não produz efeito)*

**Preparação de massa:** uma SC levada de ponta a ponta até depois da alçada, com fornecedor vencedor definido. Depende da família cotação/alçada, que **está bloqueada para a conta de QA** (§5-C: `dsProtheus_getCompradores_restGetAll` chamado com `Y1_USER = "undefined"`).

**Verificado em tela:** PARCIAL
**O que foi verificado:** na SC confirmei o painel **Verificar Retorno Protheus** com o campo **Retorno Integração\*** (`anLockBudgRetIntErr`) e o combo **Enviar para \*** (`anLockBudgEnviarParaTreat`), cujas opções literais são `Selecione...`, **`Retornar para Aguardar Geração`** e **`Encerrar Solicitação`**. Confirmei também, na grade **Empresa Vencedora**, os campos **Nº Pedido\*** e **Nº Contrato\***, ambos `readonly` e marcados como obrigatórios.
**Divergências encontradas:** (1) **Achado no fonte publicado:** se o ERP não devolver o número, o front **não exibe nada** que indique isso — não existe nenhum teste do tipo `if (!numContrato)` nem mensagem de "aguardando"; o único tratamento é mostrar/esconder o campo por *Tipo de Compra* (`handleNumOrderContract`, `sc_App_ViewHandler.js`). O campo aparece **visível, obrigatório com asterisco, readonly e em branco** — indistinguível de "ainda não chegou". (2) As atividades **86** (*Aguarda Geração da Pedido/Contrato*) e **89** (*Intermediário - Aguarda Geração da Pedido/Contrato*) têm hook **vazio** em `sc_App_App.js`. (3) Coexistem na mesma tela **"Valor da Compra (R$) \*"** (painel principal, correto) e **"Valor da Compras (R$) \*"** (grade `tbForneceAlcadas`, com erro de concordância) — confirmado ao vivo nos rótulos.
**Dados/massa usados:** nenhum — formulário aberto e não submetido.

---

## CT-FSWTBC-3666  (fluig · Concluído · SDCASSI-198)

**Título:** Abrir uma SC na etapa "Aguarda Geração do Pedido/Contrato" e confirmar que o formulário carrega completo, com o fornecedor vencedor da negociação identificado.

**Origem:** FSWTBC-3666 — na etapa **Aguarda Geração do Pedido/Contrato** o formulário era exibido **incompleto** (exemplo: SC 8554). Gêmeo do FSWTBC-3665, que tratava do número do contrato não recebido na mesma SC. Na validação de 26/01 o cliente precisou o defeito residual: *"não está carregando o nome do fornecedor que participou da negociação"* — dado essencial nessa etapa, porque é ele que identifica com quem contratar. Corrigido no mesmo dia, **sem reabertura formal** (o ticket já estava fechado desde 07/01).

**Módulo/Rota:** *Solicitação de Compras* › atividade **`323 - Aguarda Geração do Pedido/Contrato`** › seções **Aprovação de Alçada** (campos **Empresa Vencedora**, **CNPJ/CPF**, **Nº Pedido**, **Nº Contrato**) e card **Itens da Proposta Vencedora**.

**Pré-condições**
- Uma SC que tenha concluído a negociação e a aprovação de alçadas e esteja parada em `323 - Aguarda Geração do Pedido/Contrato`.
- O fornecedor vencedor definido na negociação.
- Perfil que enxergue a solicitação nessa etapa.
- **Bloqueio:** sim — **não há nenhuma SC nessa atividade** disponível para a conta de QA (as tarefas da conta estão em *Validação do Gestor* e *Correção*), e chegar até `323` exige percorrer gestor, orçamento, cotação, negociação, alçadas e integração com o ERP.

**Passos**
1. Localizar uma SC parada em **Aguarda Geração do Pedido/Contrato** (via Central de Tarefas do responsável ou pelo **Tracker**, filtro **Nº do Processo Fluig**).
2. Abrir a solicitação e percorrer o formulário de cima a baixo.
3. Conferir que as seções anteriores do fluxo estão presentes e **preenchidas**: *Identificação do Processo / Solicitante*, *Identificação da Entidade / Solicitação*, *Identificação do(s) Produto(s)/Serviço(s)*, *Rateio por Centro de Custo*, *Validação do Gestor*, *Validação do Item Orçamentário*, *Validação do Comprador*.
4. Na seção **Aprovação de Alçada**, conferir que **Empresa Vencedora** e **CNPJ/CPF** estão preenchidos com o fornecedor que venceu a negociação.
5. Conferir o card **Itens da Proposta Vencedora** — *Item*, *Unidade de Medida*, *Quantidade*, *Preço Unitário*, *Vlr. Total*, *Produto/Serviço*, *Grupo do Produto/Serviço* — com uma linha por item.
6. Conferir os campos **Nº Pedido** / **Nº Contrato** conforme o **Tipo de Compra** (*Pedido* ou *Contrato*).
7. Conferir na aba **Histórico** que a passagem por `177 - Integração com ERP` e `317 - Verificar retorno Protheus` ocorreu sem erro, e no campo **Retorno Integração** que não há mensagem de falha.
8. Não movimentar a solicitação.

**Resultado esperado**
- O formulário abre **completo** na etapa `323`: todas as seções já preenchidas do fluxo aparecem, nenhuma vem vazia ou omitida.
- **Empresa Vencedora** e **CNPJ/CPF** exibem o fornecedor que participou e venceu a **negociação** — não ficam em branco.
- O card **Itens da Proposta Vencedora** lista todos os itens negociados, com quantidade e valores.
- O campo do documento (**Nº Pedido** ou **Nº Contrato**) está coerente com o **Tipo de Compra** escolhido pelo comprador.
- **Retorno Integração** está vazio ou registra sucesso; o Histórico não tem entrada de captura de erro em aberto.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O formulário é exibido **incompleto** na etapa *Aguarda Geração do Pedido/Contrato* (SC 8554) e, especificamente, o **nome do fornecedor que participou da negociação não é carregado** — o campo aparece vazio, deixando o comprador sem saber com quem gerar o pedido/contrato (evidência: screenshot de 26/01 com o campo de fornecedor em branco).

**Severidade:** Alta *(sem o fornecedor vencedor identificado, o pedido/contrato é gerado às cegas — o erro só aparece depois, no documento emitido para o fornecedor errado)*

**Preparação de massa:** uma SC parada em **`323 - Aguarda Geração do Pedido/Contrato`**, com negociação concluída e fornecedor vencedor definido — massa que só existe em fluxo completo e que a conta de QA não consegue produzir. **Ponto de processo a registrar:** o ticket foi **fechado antes da validação** e o defeito residual (nome do fornecedor) apareceu 19 dias depois, corrigido sem reabertura — logo, a regressão deste caso deve cobrir **as duas coisas** (formulário completo *e* fornecedor preenchido), porque a segunda nunca teve ticket próprio.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a atividade **`323 - Aguarda Geração do Pedido/Contrato`** existe e está no mapa do processo lido no histórico da solicitação 112146 (junto de `324 - Intermediário Envia para Aguarda Geração do Pedido/Contrato` e `326 - Intermediário - Aguarda Geração do Pedido/Contrato`). No formulário da *Solicitação de Compras*, a seção **Aprovação de Alçada** existe e contém **Empresa Vencedora**, **CNPJ/CPF**, **Valor da Compras (R$)**, **Valor do Frete (R$)**, **Nº Pedido**, **Nº Contrato**, **Total a ser Aprovado (R$)**, **Valor Vigente do Contrato (R$)** e **Total com Aditivo (R$)**; a seção **Validação do Comprador** tem **Tipo de Compra** com as opções **Pedido** e **Contrato**; e a seção **Validação do Comprador (Análise pós Alçadas)** tem **Verificar Retorno Protheus** e **Retorno Integração**. No fonte publicado do formulário (`sc_App_ViewHandler.js`) confirmei que o card **Itens da Proposta Vencedora** é montado justamente quando o estado corrente é `aguardaGeraPedContrato` (entre outros) — ou seja, é essa etapa que deve renderizar o bloco do fornecedor. **Nenhuma SC nessa etapa foi aberta**: não há massa na conta.
**Divergências encontradas:** o ticket chama a etapa de *"Aguarda Geração do Pedido/Contrato"*; no mapa do processo o nome exato é **`323 - Aguarda Geração do Pedido/Contrato`**, e o fonte do formulário usa ainda um terceiro nome interno para o mesmo ponto (`aguardaGeraPedContrato`, com uma variante `86 - Aguarda Geração da Pedido/Contrato` numa versão anterior do bundle) — quem procurar pelo rótulo do ticket em log ou no diagrama precisa saber disso. O ticket fala em "carregar o formulário"; na tela o que falta é especificamente o bloco do **fornecedor vencedor** dentro da seção **Aprovação de Alçada**, que é uma renderização dinâmica — não o formulário inteiro.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3755  (ambos · Concluído · SDCASSI-28)

**Título:** Verificar que um contrato vigente com documentação obrigatória cadastrada entra na fila de envio do schedule.

**Origem:** FSWTBC-3755 — o schedule não incluiu o contrato **00001-2022-5201** na fila de envio
(tabela **ZZ4**). Sem descrição, sem causa raiz e sem registro de verificação de outros contratos:
por definição, um contrato que não entra na fila **não gera erro visível**.

**Módulo/Rota:** Fluig → **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`),
ícone `title="Informações do Contrato"` da coluna **Ação**. Verificação da fila: **Protheus**,
tabela **ZZ4** (fora do Fluig).

**Pré-condições**
- Contrato **00001-2022-5201** vigente, com documentação obrigatória vinculada.
- Acesso à tabela ZZ4 no Protheus para conferir a fila.
- **Bloqueio:** **duplo**. (a) A fila **ZZ4 não tem superfície no Fluig** — o widget *Logs Protheus*
  cobre **CV8, ZZY e ZZZ** e **não** ZZ4; portanto a asserção central ("o contrato entrou na fila")
  **só é verificável no Protheus**, e não há credencial. (b) O caso depende de uma execução de
  **schedule**, que o §2 proíbe disparar.

**Passos**
1. Abrir **Acompanhamento de Contratos** e, no campo **Pesquisar** (ou no **Filtrar** da coluna
   *Contrato*), informar `00001-2022-5201`.
2. Conferir na linha: **Filial**, **Tipo Contrato**, **Data Inicio**, **Data Fim**, **Nº Revisão**,
   **Status** e **Fornecedor**.
3. Abrir o ícone **Informações do Contrato** e conferir, na seção *Processos, Cotações e Integração*,
   o **Status da Integração GCT** e o **Erro de Integração**.
4. *(Protheus — bloqueado nesta rodada)* Após a janela do schedule, consultar a **ZZ4** filtrando
   pelo contrato e conferir se há registro de envio.
5. Repetir os passos 1–3 para pelo menos mais dois contratos vigentes do **mesmo tipo (044 - MAO DE
   OBRA TERCEIRIZADA)**, para checar se o não-enfileiramento é isolado ou sistêmico.

**Resultado esperado**
- Passo 1/2: o contrato `00001-2022-5201` é encontrado, **Status = Vigente**.
- Passo 3: o modal traz **Status da Integração GCT** preenchido e **Erro de Integração** vazio.
- Passo 4: existe **um** registro do contrato na ZZ4 dentro da janela do schedule — nem zero (o
  defeito) nem duplicado.
- Passo 5: nenhum contrato vigente elegível fica de fora da fila.

**Resultado se o defeito reincidir**
- O contrato **00001-2022-5201** não aparece na ZZ4 depois da execução do schedule, e **nenhuma
  mensagem de erro é gerada em lugar nenhum** — a ausência é silenciosa. Foi assim que o cliente
  precisou reportar manualmente.

**Severidade:** Média

**Preparação de massa:** contrato vigente com documentação obrigatória vinculada e o schedule do
book habilitado no ambiente. Quem executar precisa de acesso de consulta à ZZ4 no Protheus — sem
isso o caso não fecha, porque **não há tela no Fluig que mostre a fila ZZ4**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o contrato existe. Em **Acompanhamento de Contratos** (845 linhas,
colunas *Filial, Tipo Contrato, Contrato, Data Inicio, Data Fim, Nº Revisão, Status, Fornecedor,
Ação*) a linha é: **`5201 | 044 - MAO DE OBRA TERCEIRIZADA | 00001-2022-5201 | 09/02/2022 |
08/02/2027 | 006 | Vigente | 12978443 - 0001`**. A tela tem busca global (**Pesquisar**), **Filtrar**
por coluna e o combo **"Exibir … resultados por página"** (10/25/50/75/100).
**Divergências encontradas:**
1. **A fila ZZ4 não tem superfície no Fluig.** O widget *Logs Protheus* expõe **CV8, ZZY e ZZZ** —
   três das quatro filas Z do projeto. A ZZ4 (book/documentação obrigatória) ficou de fora. Digo
   isto explicitamente em vez de simular cobertura: **a asserção central deste caso não é
   verificável no Fluig**.
2. O ticket não nomeia o campo/critério de seleção do schedule, então o caso não consegue afirmar
   *por que* o contrato deveria entrar na fila — apenas que ele é vigente e do tipo 044.
**Dados/massa usados:** contrato **00001-2022-5201** — apenas consultado, nada alterado.

---

## CT-FSWTBC-3919  (ambos · Concluído · SDCASSI-268)

**Título:** Delegar fiscal de contrato quando nenhum colaborador atende à exigência de cursos amarrados ao contrato.

**Origem:** FSWTBC-3919 — contrato configurado com 5 cursos exigidos; a lista de seleção de
colaborador vinha **vazia**, sem explicar por quê. O diagnóstico do responsável foi dado:
*"foi verificado que NENHUM USUARIO POSSUI TODOS OS 5 CURSOS"* — a regra de elegibilidade exige
**todos** os cursos, e o sistema apresentava isso ao usuário como lista vazia sem motivo.
Reincidência do sintoma de FSWTBC-3695 ("lista de fiscais não carrega"), fechado como "Não será feito".

**Módulo/Rota:** Processos → **Delegação de  Fiscais de Contrato/Serviço**
(`wf_delegacaoFiscalContratoServico`), iniciada por *Central de Tarefas → Nova solicitação*.

**Pré-condições**
- Usuário com permissão de iniciar o processo de delegação de fiscais.
- Um contrato **com amarração de cursos** (o caso de origem exigia 5) e ao menos um colaborador que
  possua **todos** eles; e um segundo contrato cuja amarração **nenhum** colaborador satisfaça.
- **Bloqueio:** a amarração curso × contrato é dado do ERP e não há credencial Protheus nesta
  rodada; não foi possível montar os dois contratos de contraste. A conta de QA também não tem
  perfil de gestor de contrato. Verificação limitada a existência do processo.

**Passos**
1. Abrir **Central de Tarefas** → **Nova solicitação** → escolher **Delegação de  Fiscais de Contrato/Serviço**.
2. Informar o contrato **cuja amarração de cursos ao menos um colaborador satisfaz**.
3. Abrir a lista de seleção de colaborador.
4. Repetir os passos 1–3 com o contrato **cuja amarração nenhum colaborador satisfaz**.
5. Não concluir a delegação — apenas observar a lista e a mensagem.

**Resultado esperado**
- No passo 3, a lista traz **exatamente** os colaboradores que possuem **todos** os cursos amarrados
  ao contrato — nunca colaboradores com cobertura parcial.
- No passo 4, a lista vem vazia **e a tela informa o motivo**, nomeando os cursos exigidos e/ou os
  que faltam — não uma lista vazia muda.
- Em nenhum dos casos a tela fica em branco ou em "carregando" indefinido.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Lista de colaboradores **vazia**, sem mensagem alguma, para um contrato corretamente configurado —
  levando o usuário a abrir chamado por "contrato configurado e não aparece opção de nenhum
  colaborador para a seleção", exatamente como no SDCASSI-268.

**Severidade:** Média *(bloqueia o fluxo de delegação; sem risco financeiro direto)*

**Preparação de massa:** dois contratos com amarração de cursos — um satisfeito por ao menos um
colaborador, outro por nenhum — mais o cadastro de cursos por colaborador no ERP. Só a área de
contratos/RH da CASSI monta isso; não é criável pela conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o processo **existe e está publicado** com o nome exato
*"Delegação de  Fiscais de Contrato/Serviço"* (`wf_delegacaoFiscalContratoServico`), confirmado por
`GET /process-management/api/v2/processes` (HTTP 200). A lista de colaboradores não foi exercitada
por falta de massa e de perfil.
**Divergências encontradas:** o nome publicado tem **espaço duplo** — `Delegação de  Fiscais de
Contrato/Serviço`. Além disso, o achado **A10** já registra que o formulário de Delegação de Fiscais
exibe a instrução autocontraditória *"Todos os campos com \* são obrigatórios já os campos com \*
não são obrigatórios"*.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4068  (ambos · Concluído · SDCASSI-289)

**Título:** Medir um contrato com múltiplas planilhas e confirmar que todas as planilhas ficam disponíveis para seleção.

**Origem:** FSWTBC-4068 — ao medir o contrato **0004-2024-5201** da DEDETIZADORA DINIZ
(CNPJ 42.696.752/0001-89), o sistema informava que **"não existe planilha disponível"**. O contrato
tem **3 planilhas** em medição automática: a 02 e a 03 funcionaram e a **00001 apresentou erro**.
Resolvido **no mesmo dia, sem tocar em código** — em call, o contrato foi movimentado corretamente e
o sintoma cessou: era **estado do registro**, não defeito de fonte. **O que estava errado no estado
da planilha 00001 nunca foi registrado** — a informação ficou na call. Encerrado por decurso em
11/05/2026, sem aceite.

**Módulo/Rota:** **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) → ícone de
ação **"Planilha"** → modal **"Informações da Planilha"** · e o processo *Faturamento de Contratos*.

**Pré-condições**
- Um contrato com **mais de uma planilha** em medição automática.
- **Bloqueio:** iniciar a medição do contrato é escrita em processo de contrato de produção —
  não executado. A **consulta** das planilhas do contrato, porém, é totalmente executável e foi feita.

**Passos**
1. Abrir **`/portal/p/1/acompanhamentoContrato`**.
2. Localizar o contrato pelo filtro da grade (campo **"Filtrar"** / busca da tabela).
3. Na coluna **Ação**, clicar no ícone com `title="Planilha"`.
4. No modal **"Informações da Planilha"** → *"Planilhas do Contrato"*, conferir que **todas** as
   planilhas do contrato aparecem, com `Filial · Contrato · Planilha · Revisão · Cod. Fornecedor ·
   Fornecedor · Loja Forn.`.
5. Iniciar a medição do contrato e verificar se as mesmas planilhas ficam selecionáveis.
6. **Não** concluir a medição.

**Resultado esperado**
- O modal lista **todas** as planilhas do contrato (no caso original, **3**), sem faltar nenhuma.
- Ao medir, **nenhuma** planilha do contrato produz a mensagem *"não existe planilha disponível"*
  enquanto as demais funcionam.
- Se de fato não houver planilha disponível, a mensagem **diz por quê** (planilha inexistente,
  competência já medida, contrato em estado impróprio) — hoje a mesma frase cobre causas
  completamente diferentes.

**Resultado se o defeito reincidir**
- Contrato com 3 planilhas em que a **00001** devolve **"não existe planilha disponível"** enquanto a
  02 e a 03 medem normalmente — sem nada em tela que distinga estado do contrato, fila travada ou
  ordem de schedule.

**Severidade:** **Alta** *(planilha que não mede é faturamento não realizado; e a mensagem
indistinta transforma cada ocorrência numa investigação do zero)*

**Preparação de massa:** um contrato de teste com **três planilhas** em medição automática, sendo uma
delas deixada num estado impróprio, para exercitar a distinção de mensagens. Exige a área de
contratos.

**Verificado em tela:** PARCIAL *(a consulta de planilhas foi exercitada de ponta a ponta; a medição não)*
**O que foi verificado:** abri o *Acompanhamento de Contratos* (**845 linhas**), cliquei no ícone
`title="Planilha"` da primeira linha e o modal **"Informações da Planilha"** abriu, com o subtítulo
**"Planilhas do Contrato"** e as colunas **`Filial · Contrato · Planilha · Revisão · Cod. Fornecedor ·
Fornecedor · Loja Forn. · Ações`**, listando **2 planilhas** (`000001` e `000002`) do contrato
`0000-2025-2501-` — ou seja, **o caminho de consulta de múltiplas planilhas funciona hoje**.
**Divergências encontradas:** duas, e a segunda é forte.

1. No modal, as colunas **`Revisão`**, **`Fornecedor`** (o nome) e **`Ações`** vieram **vazias** nas
   duas linhas, embora `Cod. Fornecedor` (`26628497`) e `Loja Forn.` (`0001`) estivessem preenchidos.
   Isso **não** é falta de dado na origem: medi o dataset que alimenta o modal
   (`dsProtheus_getInfoPlanilhaxContrato_restGetAll`, HTTP **200**) e ele **devolve `A2_NOME`
   preenchido** (ex.: `INVIOLAVEL PORTO VELHO SEGURANÇA ELETRONICA LTDA ME`) e `CNA_REVISA`. O nome
   ainda assim é buscado por uma **chamada separada** a `dsProtheus_getFornecedores_restGetAll`
   (`A2_COD`, `A2_LOJA`, `A2_NOME`, `A2_CGC`) — o que casa com o achado **A13**
   (`MAX_CONSULTAS_FORNECEDOR = 10`: do 11º fornecedor em diante a tela mostra `codigo-loja` em vez
   do nome). **Há dado disponível de graça na resposta que a tela já recebeu, e a tela faz uma
   segunda ida ao servidor que falha em silêncio.**
2. **Causa mecânica candidata para o próprio sintoma deste ticket:** o widget tem uma segunda função
   de planilhas, `loadPlanilhasDisponiveis`, que ainda invoca o **nome antigo e errado** de dataset
   (`dsProtheus_getInformaPlanxContrato_restGetAll` — ver CT-FSWTBC-4078). Medido: esse nome responde
   **HTTP 200 com `{"columns":[],"values":[]}`** — **vazio, sem erro e sem mensagem**. Um caminho que
   consulte planilhas por ali recebe **zero planilhas** e não tem como distinguir isso de "contrato
   sem planilha" — que é exatamente a frase do SDCASSI-289, *"não existe planilha disponível"*, num
   contrato que tem três. **Vale investigar como possível causa nunca identificada** deste chamado,
   que foi fechado por decurso sem registro do que estava errado.
**Dados/massa usados:** leitura do contrato `0000-2025-2501-` (filial 2501), primeira linha da grade.
Nenhuma escrita.

---

## CT-FSWTBC-4073  (fluig · Concluído · SDCASSI-108)

**Título:** Consultar o painel de Acompanhamento de Contratos e conferir que cada contrato aparece uma única vez, na sua última revisão.

**Origem:** FSWTBC-4073 / DEM10013716 — a tabela do painel de acompanhamento trazia **revisões anteriores**
do mesmo contrato, de modo que um contrato com N revisões aparecia N vezes. O requisito é listar somente a
última revisão. Corrigido com uma função dedicada de filtro; o ticket não cita fonte nem PR.

**Módulo/Rota:** **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`)

**Pré-condições**
- Usuário pertencente a `G.P.Acompanhamento_Renovacao_Contratos` (ou ao grupo admin).
- Existir na base ao menos um contrato **com mais de uma revisão** (ex.: um contrato com revisão `003`).
- **Bloqueio:** nenhum. Caso executável integralmente no Fluig com a conta de QA.

**Passos**
1. Acessar `/portal/p/1/acompanhamentoContrato` e aguardar a grade carregar.
2. Conferir o cabeçalho: `Filial | Tipo Contrato | Contrato | Data Inicio | Data Fim | Nº Revisão | Status | Fornecedor | Ação`.
3. No seletor de quantidade por página, escolher **Todos**, para que a verificação cubra a listagem inteira.
4. Digitar, no campo **Filtrar**, o número de um contrato que sabidamente possua várias revisões.
5. Contar quantas linhas retornam para aquele número de contrato e observar o valor da coluna **Nº Revisão**.
6. Repetir para outros dois contratos com revisão maior que `001`.

**Resultado esperado**
- Para cada número de contrato, a grade retorna **exatamente uma linha**.
- A linha exibida é a de **maior número em Nº Revisão** — nenhuma revisão anterior é listada.
- O total de linhas da grade é igual ao total de **contratos distintos**, não ao total de revisões.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O mesmo número de contrato aparece **repetido em várias linhas**, uma por revisão (`001`, `002`, `003`…),
  poluindo a lista e permitindo que o fiscal atue sobre uma revisão já vencida.

**Severidade:** Média *(impacto direto é de leitura, mas atuar sobre revisão vencida vira erro de medição)*

**Preparação de massa:** nenhuma — a base já contém contratos com múltiplas revisões (medi revisões de
`001` a `020`). Basta um usuário no grupo de acesso do painel.

**Verificado em tela:** SIM (total)
**O que foi verificado:** a grade carregou com **845 linhas** e as 9 colunas acima. Extraí a coluna
**Contrato** de todas as 845 linhas e contei: **845 valores distintos, 0 duplicados** — a regra "uma linha
por contrato, na última revisão" está valendo hoje. A distribuição da coluna **Nº Revisão** nas 845 linhas
é: 372 em branco, 246 `001`, 93 `002`, 50 `003`, 22 `005`, 13 `004`, 12 `006`, 12 `007`, 7 `008`, 4 `009`,
3 `010`, 2 `012`, 2 `016`, 2 `017`, 1 `011`, 1 `014`, 1 `018`, 1 `019`, 1 `020`. No JavaScript do widget
`wAcompanhaContratos` está a função que implementa a regra — `processContratosResult` monta um
`mapaUltimaRevisao` indexado por `CN9_NUMERO` e conserva, para cada número, o registro de maior
`parseInt(record.CN9_REVISA, 10)`, descartando os demais antes de alimentar a tabela.
**Divergências encontradas:** a análise do ticket supõe que o filtro seria por **`CN9_REVATU`**; a
implementação real **não usa esse campo** — ela deduplica no cliente pelo **maior `CN9_REVISA`** por
`CN9_NUMERO`. Consequência prática para quem for escrever regressão: a regra é do **widget**, não do
dataset, e uma reescrita que passe a paginar server-side quebra a dedup sem aviso. Observação adicional
(não é defeito): **372 das 845 linhas têm Nº Revisão em branco** — contratos sem revisão registrada; vale
confirmar com a área se o esperado ali é vazio ou `000`.
**Dados/massa usados:** nenhum — apenas leitura da grade; nada submetido.

---

## CT-FSWTBC-4075  (fluig · Concluído · SDCASSI-108)

**Título:** Confirmar que o painel de Acompanhamento de Contratos nega acesso a usuário fora do grupo autorizado.

**Origem:** FSWTBC-4075 / DEM10013716 — o portal de acompanhamento estava **aberto para qualquer usuário**,
sem considerar grupo de acesso: exposição de dados de contratos e SCs a toda a base do portal. A correção
foi por configuração (criação de grupo e ajuste de permissões da página e da widget). **O último retorno
registrado do cliente foi uma reprovação — "Ainda não está funcionando" — e o ticket foi encerrado no mesmo
dia sem comentário que a respondesse.**

**Módulo/Rota:** **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`)

**Pré-condições**
- **Usuário A:** membro de `G.P.Acompanhamento_Renovacao_Contratos`.
- **Usuário B:** autenticado no portal e **fora** de `G.P.Acompanhamento_Renovacao_Contratos` **e** de
  `G.P.Acompanhamento_Renovacao_contratos_admin`. É este o usuário que prova o caso.
- **Bloqueio:** a conta de QA pertence **aos dois** grupos — é administradora do painel. Não há como
  observar a negação de acesso sem uma segunda credencial fora dos grupos, que o QA não possui.

**Passos**
1. Autenticar como **Usuário B** (fora dos grupos).
2. Navegar para `/portal/p/1/acompanhamentoContrato`.
3. Observar o corpo do painel e as notificações (toast) exibidas.
4. Encerrar a sessão, autenticar como **Usuário A** (dentro do grupo) e repetir o passo 2.

**Resultado esperado**
- Para o **Usuário B**: o painel **não exibe nenhum contrato**. É apresentada a mensagem
  **"Você não possui permissão para acessar o Acompanhamento de Contratos."** no corpo do painel, e o toast
  **"Acesso negado — Você não possui permissão para acessar este painel."**
- Para o **Usuário B**, **nenhum dado de contrato trafega**: a chamada ao dataset de contratos não chega a
  ser feita (a verificação de grupo antecede a carga).
- Para o **Usuário A**: o painel carrega normalmente, com a grade de contratos.
- Falha de rede na verificação **não** deve liberar o acesso: nesse caso a tela exibe
  **"Falha ao validar suas permissões. Recarregue a página; se persistir, contate o suporte."**

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Qualquer usuário autenticado no portal abre `/portal/p/1/acompanhamentoContrato` e **vê a lista completa
  de contratos** — filial, fornecedor, valores e SCs — sem pertencer a grupo nenhum.

**Severidade:** Alta *(acesso indevido a dados de contratos e fornecedores de toda a base)*

**Preparação de massa:** **duas credenciais** — uma dentro e outra fora do grupo
`G.P.Acompanhamento_Renovacao_Contratos`. Nenhuma massa de contrato é necessária (a negação acontece antes
da carga). A credencial "fora do grupo" precisa ser provida pelo cliente; é o único insumo que falta.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o painel abre e carrega a grade para a conta de QA. Li os grupos da conta pelo
dataset `colleagueGroup`: ela pertence a **`G.P.Acompanhamento_Renovacao_Contratos`** e a
**`G.P.Acompanhamento_Renovacao_contratos_admin`** — por isso vê tudo, o que é o comportamento correto para
um administrador, e por isso **não consigo observar a negação**. No JavaScript do widget confirmei que o
controle **existe e está ativo**: a função `hasAccess()` consulta o dataset `colleagueGroup` restringindo por
`colleagueGroupPK.colleagueId` do usuário e compara contra
`allowedGroups: ['G.P.Acompanhamento_Renovacao_Contratos', 'G.P.Acompanhamento_Renovacao_contratos_admin']`
e `adminGroups: ['G.P.Acompanhamento_Renovacao_contratos_admin']`; se não houver correspondência, roda
`renderAccessDenied()`, com exatamente as mensagens citadas no resultado esperado. Falha de rede cai em
`renderAccessError()`, isto é, **erro não vira liberação** — o ponto mais importante de um controle de acesso.
**Divergências encontradas:** **divergência relevante.** O ticket afirma que a correção foi a criação do
grupo **`G.Compras.Acompanhamento_Contratos`**. Esse grupo **não existe** entre os 37 grupos da conta e
**não é o que o código verifica** — os grupos efetivamente exigidos hoje são
`G.P.Acompanhamento_Renovacao_Contratos` e `G.P.Acompanhamento_Renovacao_contratos_admin`. Quem for
reproduzir o caso pelo nome do ticket vai configurar o grupo errado e concluir, equivocadamente, que o
defeito voltou. Registro também que a pendência apontada na análise permanece pertinente: **não há neste
ambiente evidência de que o acesso seja de fato negado** — e a última manifestação do cliente no ticket foi
justamente uma reprovação. Recomendo que este caso seja executado com a segunda credencial antes de
considerar o defeito fechado.
**Dados/massa usados:** nenhum — apenas leitura de grupos e do painel; nada submetido.

---

## CT-FSWTBC-4076  (ambos · Concluído · SDCASSI-108)

**Título:** Identificar o fornecedor de cada contrato direto na grade de Acompanhamento de Contratos, sem sair da tela.

**Origem:** FSWTBC-4076 (DEM10013716) — a tabela do painel **não possuía colunas para identificar o
fornecedor**, obrigando o usuário a sair do painel para descobrir de quem era o contrato. Resolvido
adicionando coluna de fornecedor com **código E loja** — correto e não trivial, já que a chave do
fornecedor no Protheus é sempre o par `A2_COD + A2_LOJA`; exibir só o código produziria ambiguidade
entre lojas do mesmo fornecedor. Classificado como Bug, mas é **evolução de escopo**.

**Módulo/Rota:** **Acompanhamento de Contratos** — `/portal/p/1/acompanhamentoContrato`.

**Pré-condições**
- Base com contratos de fornecedores que tenham **mais de uma loja**, para provar que o par
  código+loja desambigua.
- **Bloqueio:** nenhum.

**Passos**
1. Abrir **`/portal/p/1/acompanhamentoContrato`**.
2. Conferir o cabeçalho da grade e localizar a coluna **Fornecedor**.
3. Ler o valor de algumas linhas e confirmar que traz **código e loja**.
4. Usar o campo **"Filtrar"** para buscar por um código de fornecedor e verificar o retorno.
5. Localizar um fornecedor com **duas lojas** e conferir que as linhas são distinguíveis.

**Resultado esperado**
- A grade tem a coluna **Fornecedor** visível sem rolagem horizontal extra.
- O valor traz **código e loja** (formato `<código> - <loja>`), não só o código.
- Contratos de lojas diferentes do mesmo fornecedor são **distinguíveis** na grade.
- O filtro da coluna encontra o contrato pelo dado exibido.

**Resultado se o defeito reincidir**
- A grade volta a não ter coluna de fornecedor (ou traz **só o código**, sem loja), obrigando o
  usuário a abrir outra tela — ou a confundir lojas distintas do mesmo fornecedor.

**Severidade:** Baixa *(apresentação/usabilidade — mas com risco real de ambiguidade se a loja sumir)*

**Preparação de massa:** nenhuma criação necessária; basta um fornecedor com duas lojas já existente
na base para o passo 5.

**Verificado em tela:** **SIM (total)**
**O que foi verificado:** a grade do *Acompanhamento de Contratos* carregou **845 linhas** e o
cabeçalho traz, na ordem: **`Filial · Tipo Contrato · Nº Contrato · Data Início · Data Fim ·
Nº Revisão · Status · Fornecedor · Ação`**. A coluna **Fornecedor** existe e a primeira linha exibe
**`26628497 - 0001`** — **código e loja**, exatamente o que o ticket pediu. No fonte publicado
(`wAcompanhaContratos_pt_BR.js`, 108.511 bytes) confirmei a montagem: a coluna usa `data: 'CNA_FORNEC'`
e o nome vem de `dsProtheus_getFornecedores_restGetAll` com `fields: ['A2_COD','A2_LOJA','A2_NOME','A2_CGC']`
e constraint em **`A2_LOJA`** — a loja é parte da chave da consulta, não enfeite.
**Divergências encontradas:** a coluna se chama **"Fornecedor"** e exibe **código - loja**, não o
**nome**. Para quem lê o painel, `26628497 - 0001` ainda não identifica *quem* é o fornecedor sem uma
segunda consulta — a necessidade original ("identificar o fornecedor") é atendida só pela chave. No
**modal de planilhas** existe coluna `Fornecedor` separada de `Cod. Fornecedor`, e lá o **nome veio
vazio** (ver CT-FSWTBC-4068 e achado A13). Registro também a divergência do achado **A6**, na mesma
tela: a coluna *Tipo Contrato* exibe `017 - DEDETIZACAO` mas é **pesquisável só pelo código** —
`DEDETIZACAO` devolve 0, `017` devolve 63.
**Dados/massa usados:** somente leitura da grade; contrato `0000-2025-2501-`, fornecedor
`26628497 - 0001`. Nenhuma escrita.

---

## CT-FSWTBC-4077  (fluig · Concluído · SDCASSI-108)

**Título:** Conferir que o painel de Acompanhamento de Contratos lista, para um usuário comum, apenas os contratos em que ele é o fiscal.

**Origem:** FSWTBC-4077 / DEM10013716 — a tabela listava contratos de **qualquer** usuário, e não somente os
do responsável. O filtro compara **`CN9_XFISCA`** (e-mail do fiscal, em minúsculas) com o e-mail do usuário
logado. O ponto grave declarado no próprio ticket: *"Como nossos usuários não têm contratos vinculados foi
executado o comentário do trecho de código abaixo para que seja possível executarmos os testes"* — o filtro
foi **comentado para viabilizar o teste**, e não há registro de quando foi descomentado.

**Módulo/Rota:** **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`)

**Pré-condições**
- **Usuário C:** membro de `G.P.Acompanhamento_Renovacao_Contratos` e **não** membro de
  `G.P.Acompanhamento_Renovacao_contratos_admin` — um usuário comum do painel.
- Pelo menos **dois** contratos na base: um com `CN9_XFISCA` igual ao e-mail do Usuário C e outro com o
  e-mail de um fiscal diferente.
- **Bloqueio:** a conta de QA é **administradora** do painel (pertence ao grupo admin), e para o
  administrador a listagem completa é o comportamento correto. Sem uma credencial comum não é possível
  observar o filtro em ação.

**Passos**
1. Autenticar como **Usuário C** (no grupo, mas não admin).
2. Abrir `/portal/p/1/acompanhamentoContrato` e aguardar a carga.
3. Selecionar **Todos** no seletor de registros por página.
4. Percorrer a listagem e verificar se aparece algum contrato cujo fiscal não seja o Usuário C.
5. Abrir o modal **Informações do Contrato** (ícone da coluna **Ação**, atributo `title="Informações do Contrato"`)
   de uma das linhas e conferir, no grupo **Processos, Cotações e Integração**, o campo **Fiscal de Contrato**.
6. Repetir o passo 5 em mais duas linhas.

**Resultado esperado**
- Todas as linhas listadas para o Usuário C têm **Fiscal de Contrato igual ao Usuário C** — nenhum contrato
  de outro fiscal aparece.
- Se o Usuário C não for fiscal de nenhum contrato, a grade vem **vazia** ("Nenhum registro encontrado"),
  e não com a base inteira.
- Nenhum registro de contrato de outro fiscal chega ao navegador: a restrição por `CN9_XFISCA` deve ser
  aplicada **na consulta ao dataset**, não apenas na renderização.
- Para um usuário do grupo **admin**, a listagem completa continua sendo exibida — esse é o comportamento
  esperado do perfil administrador e não deve ser confundido com o defeito.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Um usuário comum abre o painel e vê **contratos de todos os fiscais**, exatamente como o administrador.

**Severidade:** Alta *(exposição de contratos de outras áreas/fiscais a usuário sem titularidade)*

**Preparação de massa:** uma credencial de usuário **comum** do painel (no grupo, fora do admin) que seja
fiscal de ao menos um contrato — ou seja, com `CN9_XFISCA` apontando para o e-mail dela em pelo menos um
registro. É exatamente a massa que faltava à fábrica quando o filtro foi comentado; precisa ser provida
pelo cliente.

**Verificado em tela:** PARCIAL
**O que foi verificado:** com a conta de QA (admin) a grade traz **845 linhas** — o que é o comportamento
correto do perfil, não o defeito. No JavaScript do widget confirmei que **o filtro está ativo hoje, não
comentado**, e em duas camadas: (1) `searchRecords()` bifurca — `if (that.isAdmin) { loadContratosPage(...) }
else { loadContratosDoFiscal(...) }`; (2) `loadContratosDoFiscal()` envia ao dataset a constraint
`{ "_field": "CN9_XFISCA", "_initialValue": that.userEmail, "_finalValue": that.userEmail, "_type": 1 }`,
ou seja, **a restrição vai para a consulta** e não só para a tela; e (3) ainda há uma segunda peneira no
cliente, em `processContratosResult`, comparando `record.CN9_XFISCA.toLowerCase()` com o e-mail do usuário
em minúsculas. O e-mail usado vem de `top.WCMAPI` na inicialização do widget. Também confirmei que o modal
do passo 5 existe: **Informações Complementares do Contrato**, com o grupo **Processos, Cotações e
Integração**, contendo **Fiscal de Contrato** e **Fiscal de Serviço**.
**Divergências encontradas:** duas, ambas respondendo a pendências levantadas na análise do ticket. (1)
**O trecho comentado foi reativado** — o filtro por `CN9_XFISCA` está presente e em uso no código servido
hoje; a pendência "confirmar que o filtro foi reativado antes da promoção" pode ser considerada resolvida
para este ambiente. (2) A preocupação de que "o filtro roda no cliente, então os registros de outros
responsáveis trafegam até o navegador" **está parcialmente superada**: a constraint principal é enviada ao
dataset. O filtro client-side sobreviveu como redundância — inofensivo, mas é ele que dá a impressão de
controle no navegador. Ressalva honesta: **nada disso substitui a execução com a credencial comum** — só
ela prova que o dataset respeita a constraint.
**Dados/massa usados:** nenhum — apenas leitura da grade e do código servido; nada submetido.

---

## CT-FSWTBC-4078  (ambos · Concluído · SDCASSI-108)

**Título:** Abrir o modal de planilhas de um contrato pela coluna Ação do Acompanhamento de Contratos.

**Origem:** FSWTBC-4078 (DEM10013716) — erro ao abrir o modal de planilhas do contrato. Defeito de
**integração por nome**: a widget invocava um dataset **inexistente** —
`dsProtheus_getInformaPlanxContrato_restGetAll` em vez de
`dsProtheus_getInfoPlanilhaxContrato_restGetAll`. Como no Fluig o dataset é resolvido **por nome no
corpo da requisição**, um nome errado não quebra em compilação nem em publicação: **só aparece em
runtime**, com a tela quebrada na frente do usuário. Corrigido em 1 dia (10→11/03/2026), **sem
evidência do modal funcionando após a correção**.

**Módulo/Rota:** **Acompanhamento de Contratos** → coluna **Ação** → ícone `title="Planilha"` →
modal **"Informações da Planilha"**.

**Pré-condições**
- Ao menos um contrato com planilha cadastrada.
- **Bloqueio:** nenhum.

**Passos**
1. Abrir **`/portal/p/1/acompanhamentoContrato`** e aguardar a grade carregar.
2. Na coluna **Ação** de uma linha, clicar no ícone com `title="Planilha"` *(os ícones são âncoras
   sem nome acessível — o gancho estável é o atributo `title`)*.
3. Confirmar que o modal **"Informações da Planilha"** abre.
4. Conferir que a grade *"Planilhas do Contrato"* lista as planilhas com as colunas
   `Filial · Contrato · Planilha · Revisão · Cod. Fornecedor · Fornecedor · Loja Forn. · Ações`.
5. Abrir o console do navegador e confirmar **ausência de erro** de dataset não encontrado.
6. Repetir em um contrato **sem** planilha e conferir a mensagem de vazio.
7. Fechar pelo botão **Fechar**.

**Resultado esperado**
- O modal abre **sem erro** e com título **"Informações da Planilha"**.
- As planilhas do contrato são listadas; para contrato sem planilha, aparece mensagem de
  "nenhum registro", nunca tela quebrada.
- **Nenhuma** requisição a `POST /api/public/ecm/dataset/datasets` retorna erro de dataset
  inexistente, e o console fica limpo.

**Resultado se o defeito reincidir**
- O clique no ícone *Planilha* produz **erro na abertura do modal**, porque o dataset chamado por
  nome não existe — sem qualquer sinal prévio em publicação.

**Severidade:** Média *(bloqueia a consulta de planilhas do contrato; sem perda de dado)*

**Preparação de massa:** nenhuma — a base já tem contratos com planilha. Para o passo 6, um contrato
sem planilha cadastrada.

**Verificado em tela:** **SIM (total)**
**O que foi verificado:** cliquei no ícone `title="Planilha"` da primeira linha da grade
(845 linhas) e o modal **"Informações da Planilha"** abriu **sem erro**, com o subtítulo
*"Planilhas do Contrato"*, as 8 colunas listadas acima, controle *"Exibir Todos/10/25/50/75/100
resultados por página"*, campo *Pesquisar*, paginação e botão **Fechar**. Listou **2 registros**
(planilhas `000001` e `000002` do contrato `0000-2025-2501-`, filial 2501): *"Mostrando de 1 até 2 de
2 registros"*. Confirmei ainda os três `title` da coluna Ação: **Planilha**, **Solicitação de
Compra**, **Informações do Contrato**.
**Divergências encontradas:** **achado novo, relevante.** No fonte publicado
(`/wAcompanhaContratos/resources/js/wAcompanhaContratos_pt_BR.js`, 108.511 bytes) **os DOIS nomes de
dataset coexistem, em funções diferentes**:

- `searchPlanilha: function (dadoscontrato) { … let datasetId = 'dsProtheus_getInfoPlanilhaxContrato_restGetAll'; … }` — **o nome corrigido**, e é esta função que alimenta o modal que abriu com sucesso;
- `loadPlanilhasDisponiveis: function (dadoscontrato) { … let datasetId = 'dsProtheus_getInformaPlanxContrato_restGetAll'; … }` — **o nome ERRADO do ticket, ainda vivo em produção**.

**Medi os dois nomes** contra `POST /api/public/ecm/dataset/datasets` nesta sessão:

| Nome invocado | Função | HTTP | Resposta |
|---|---|---|---|
| `dsProtheus_getInfoPlanilhaxContrato_restGetAll` | `searchPlanilha` | **200** | **22 colunas** com dados reais — `CNA_CONTRA`, `CNA_TIPPLA`, `CNA_FORNEC`, `CNA_LJFORN`, `CNA_REVISA`, `A2_NOME`, `A2_CGC`, `CN9_SITUAC`… |
| `dsProtheus_getInformaPlanxContrato_restGetAll` | `loadPlanilhasDisponiveis` | **200** | **`{"columns":[],"values":[]}`** — vazio, `message: null` |

Este é o ponto: o endpoint de dataset do Fluig **não devolve erro para nome inexistente** — devolve
**HTTP 200 com resultado vazio e sem mensagem**. Portanto a correção do FSWTBC-4078 foi aplicada
**em apenas um dos dois pontos de chamada**, e o caminho que passa por `loadPlanilhasDisponiveis`
não "quebra": ele **retorna zero planilhas em silêncio**, indistinguível de "este contrato não tem
planilha". Isso **não está em ticket algum**, é o mesmo padrão do achado **A1** (correção publicada
pela metade) — e é **candidato direto a causa mecânica do CT-FSWTBC-4068**, cujo sintoma é
literalmente *"não existe planilha disponível"* num contrato que tem três.

**Recomendação ao time:** (a) corrigir o nome em `loadPlanilhasDisponiveis`; (b) validar
estaticamente cada nome de dataset invocado contra os datasets publicados, como o próprio ticket já
sugeria — como o servidor responde 200 vazio, **runtime nunca vai acusar o erro**.
**Dados/massa usados:** leitura do contrato `0000-2025-2501-` (filial 2501). Nenhuma escrita.

---

## CT-FSWTBC-4153  (fluig · Concluído · SDCASSI-108)

**Título:** Clicar duas vezes seguidas em Confirmar na abertura de uma Solicitação de Compra e confirmar que só uma solicitação é criada.

**Origem:** FSWTBC-4153 (DEM10013716) — clicando **duas vezes** no botão **Confirmar**, o sistema abria **mais de uma solicitação**. Corrigido na mesma tarde da abertura: ao clicar em enviar, o botão passa a ser **desabilitado** durante o processamento. A própria análise do ticket registra a limitação da correção: **a trava é do lado do cliente** — se a requisição for reenviada por outro caminho, nada impede a duplicidade no servidor; idempotência no endpoint de criação seria a garantia real.

**Módulo/Rota:** **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) › na coluna **Ação** da linha do contrato, ícone com `title` **"Solicitação de Compra"** › modal **Solicitação de Compra** › botão **Confirmar**. O endpoint de criação é `POST /process-management/api/v2/processes/wf_solicitacao_compras/start`.

**Pré-condições**
- Um contrato **vigente** na grade do *Acompanhamento de Contratos*. Escolher um contrato **pequeno** (poucos itens de planilha): há registro neste ambiente de um contrato de 177 itens que travou o navegador ao abrir o modal.
- Ambiente com latência suficiente para que a criação fique "em voo" por um instante — em rede muito rápida o segundo clique pode não ter janela.
- **Bloqueio:** nenhum para abrir e inspecionar. **Há bloqueio para a execução completa:** o teste **cria uma SC de verdade**; deve ser executado apenas na base de homologação, com todo campo de texto livre prefixado por `QA`, e o número gerado precisa ser anotado para higienização posterior. Nesta sessão a criação foi **deliberadamente bloqueada** e nada foi submetido.

**Passos**
1. Abrir **Acompanhamento de Contratos** e filtrar um contrato **vigente e pequeno**.
2. Na coluna **Ação**, clicar no ícone **Solicitação de Compra** (o gancho estável é o atributo `title`; os três ícones da coluna são âncoras sem nome acessível).
3. No modal **Solicitação de Compra**, escolher o tipo (**Nova Contratação** ou **Aditivo Contratual**), preencher **Data de Necessidade** (campo `<input type="date">`, aceita **apenas** o formato ISO `aaaa-mm-dd`) e a **Justificativa** com `QA duplo clique - regressao SDCASSI-108`.
4. Selecionar os itens necessários da planilha do contrato.
5. Clicar em **Confirmar** e, **sem esperar a resposta**, clicar em **Confirmar** de novo (dois cliques em sequência rápida).
6. Observar o estado do botão **imediatamente após** o primeiro clique.
7. Aguardar a conclusão e anotar o **número da solicitação** criada.
8. Abrir **Central de Tarefas** ou **Minhas Solicitações** e contar quantas solicitações foram criadas para este contrato neste minuto.

**Resultado esperado**
- Passo 6: logo após o primeiro clique, o botão **Confirmar** fica **desabilitado** e permanece assim enquanto a criação está em voo — o segundo clique **não é aceito** pela interface.
- Passo 8: existe **exatamente uma** solicitação criada. Nenhuma duplicata.
- Se a criação **falhar**, o botão é **reabilitado**, permitindo nova tentativa — a trava não pode deixar o usuário preso.
- Só **uma** requisição a `.../wf_solicitacao_compras/start` é disparada.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Dois cliques em **Confirmar** produzem **duas ou mais solicitações** para o mesmo contrato. Como registro criado no Fluig/Protheus em geral **não tem exclusão disponível**, o dano é permanente e obriga cancelamento manual de cada duplicata.

**Severidade:** Alta *(gera documento duplicado no ERP, sem exclusão disponível; o efeito é permanente e exige intervenção manual)*

**Preparação de massa:** um contrato vigente e pequeno na base de homologação, e **autorização explícita para criar uma SC**, já que este caso — ao contrário dos demais deste lote — **só se prova submetendo**. Anotar o número gerado para higienização. **Recomendação de método:** se este caso for automatizado, o teste precisa **segurar a requisição em voo** e afirmar sobre o estado real do botão. Interceptar **abortando** a requisição faz o widget tratar como erro e reabilitar o botão na hora, e `force: true` fura a própria trava sob teste — as duas coisas produzem **vermelho que é artefato do método, não defeito**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — `/portal/p/1/acompanhamentoContrato` abre com heading **Acompanhamento de Contratos** e **845 linhas**; as colunas são *Filial · Tipo Contrato · Contrato · Data Inicio · Data Fim · Nº Revisão · Status · Fornecedor · **Ação***, e os três ícones de *Ação* expõem `title` **Planilha**, **Solicitação de Compra** e **Informações do Contrato**. Clicando no ícone **Solicitação de Compra** da primeira linha, o modal **"Solicitação de Compra"** abriu com os títulos *Aditivo contratual* e *Nova Contratação*, o combo *Selecione… / Aditivo Contratual / Nova Contratação*, o campo de contrato (`0000-2025-2501-…`), o `input[type=date]` **dtNecessidade**, o textarea *"Justificativa para a Solicitação. Ex: Aquisição de equipamen…"* e os botões **Confirmar** e **Fechar**. O **Confirmar** foi confirmado **visível e habilitado**. **Nada foi preenchido e nada foi submetido**: a rota de `/start` estava bloqueada por rota desde antes do primeiro clique, e o contador de tentativas fechou em **0**.
**Divergências encontradas:** o ticket descreve a correção como *"o botão é desabilitado e passa a exibir **'Enviando'** durante o processamento"*. **O texto "Enviando" não foi encontrado em nenhum fonte inspecionado nem em tela**, e a proteção efetivamente documentada e observada neste ambiente é apenas o atributo `disabled`. Ou seja: o **efeito de proteção** está lá, mas o **retorno visual textual** descrito no ticket não foi confirmado — pode ter sido perdido numa republicação, ou a descrição do ticket pode não corresponder ao que foi publicado. **Vale confirmar com o time.** Segunda divergência: o ticket diz "widget de abertura de solicitação" sem nomeá-lo; o widget é o do **Acompanhamento de Contratos**, e o botão se chama **Confirmar** (o botão *Enviar* do formulário da SC é outro controle, de outra etapa).
**Dados/massa usados:** nenhum — modal aberto em leitura, nenhum campo preenchido, nenhuma solicitação criada (0 tentativas de `start`).

---

## CT-FSWTBC-4176  (ambos · Concluído · SDCASSI-312)

**Título:** Com uma medição em aberto no Fluig, o Protheus deve recusar a abertura de revisão do contrato — e o Fluig deve responder à consulta que sustenta essa trava.

**Origem:** FSWTBC-4176 — revisão 003 do contrato 00015-2026-5303 foi salva com o processo 88542
aberto. Três causas: `type mismatch on .AND.` no PE_CNTA300; curto-circuito `xRet .And.` que pulava a
2ª validação; e a **ML do formulário de Produção vazia**, que quebrava o dataset `dsRevisaoContratos`.
Log `U_GravaLog` adicionado em `verificaMedicaoFluig`. MUD17457 / PR 65589.

**Módulo/Rota:** Fluig → dataset **`dsRevisaoContratos`** (consumido pelo Protheus) · **Tracker**,
*Filtrar por* = **Faturamento de Contratos**, filtro **Número do Contrato** · **Logs Protheus** → aba
**Erros CV8** (log da consulta) · Protheus → Contratos → Revisão (**bloqueado**).

**Pré-condições**
- Contrato com **uma medição em aberto** no Fluig (ex.: qualquer instância ativa na 28/27/182).
- **Bloqueio:** a tentativa de revisão é no Protheus — sem credencial. Aqui só se prova o lado Fluig.

**Passos**
1. No Tracker, filtrar **Faturamento de Contratos** pelo contrato e confirmar que há processo
   **Aberto**.
2. Executar `dsRevisaoContratos` com o número do contrato (Fluig Studio/Painel de datasets ou
   `POST /api/public/ecm/dataset/datasets`).
3. *(Protheus)* Tentar incluir revisão do contrato.
4. Em **Logs Protheus → Erros CV8**, filtrar pelo contrato e ler **Mensagem / Detalhes**.

**Resultado esperado**
- Passo 2: o dataset devolve **colunas definidas** e a(s) linha(s) da medição aberta — nunca resposta
  sem coluna.
- Passo 3: revisão **recusada** com mensagem de medição/solicitação pendente.
- Passo 4: log de entrada e retorno de `verificaMedicaoFluig` com `CN9_NUMERO/CN9_FILIAL/CN9_REVISA`
  e o JSON devolvido pelo Fluig.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Revisão salva com medições abertas; `dsRevisaoContratos` vazio em Produção (ML não preenchida);
  antes disso, `type mismatch on .AND.` (PE_CNTA300.PRW linha 204).

**Severidade:** Alta

**Preparação de massa:** contrato com medição aberta (há 128 ativas hoje) e acesso ao Protheus para o
passo 3.

**Verificado em tela:** PARCIAL
**O que foi verificado:** `dsRevisaoContratos` (HTTP 200) devolveu **`columns:[] values:[]`** com e sem
filtro por `00015-2026-5303`. Tracker aberto com o filtro **Número do Contrato** disponível. O contrato
00015-2026-5303 existe (é o do ticket).
**Divergências encontradas:** (1) **dataset sem coluna nenhuma** — indistinguível do modo de falha que
o ticket atribuiu à ML: não há como afirmar pela resposta se a trava funcionaria hoje; candidato a
achado próprio; (2) o nome do campo de filtro não é documentado no ticket (usei `numContrato`); (3)
o log CV8 é a única superfície do lado Protheus visível no Fluig, e está 404 (ambiente).
**Dados/massa usados:** contrato 00015-2026-5303 — só consulta.

---

## CT-FSWTBC-4248  (protheus · Concluído · SDCASSI-328)

**Título:** Gerar um contrato a partir de uma Solicitação de Compras e obter número sequencial válido mesmo com contratos legados alfanuméricos na base

**Origem:** FSWTBC-4248 — `duplicate key` ao salvar contrato originado de processo de compras: a numeração (`UGCTE015`) usava `MAX(CN9_NUMERO)` filtrado por `CN9_DATEMI > MV_DATASEQ`, e registros legados com letras/sequência de 3 caracteres (ex.: `EC0`) venciam a ordenação textual, corrompendo o próximo número. Correção: `TOP 1 ORDER BY LEN(seq) DESC, seq DESC` filtrando o padrão `%-ANO-FILIAL%`, independente da data de emissão.

**Módulo/Rota:** Fluig — *Solicitação de Compras* (`wf_solicitacao_compras`), *Tipo de Compra = Contrato*, integração 20/177/287 → Protheus GCT (geração do número). Superfícies: campo **Retorno Integração** e aba **Histórico** da SC; widget *Acompanhamento de Contratos* (`/portal/p/1/acompanhamentoContrato`, coluna *Nº Contrato*).

**Pré-condições**
- Base com contratos legados de número alfanumérico na mesma filial (hoje há 71 linhas com letras: `E001-2023`, `2899-2025-5303A`, `172B`, `4600003813.TA`, `781-2021-A`…).
- Conta com perfil de solicitante e comprador para levar a SC até a integração com o GCT.
- **Bloqueio:** a conta de QA não resolve matrícula de comprador (limitação de conta), então a SC não chega à integração que cria o contrato; a etapa de geração do número é executada pela família cotação/comprador. Caso escrito para executor com perfil completo.

**Passos**
1. Em *Acompanhamento de Contratos*, filtrar *Nº Contrato* por `E00` e por `-5303A`: anotar os legados alfanuméricos existentes e o maior número no padrão `NNNNN-2026-5303`.
2. Criar SC `QA-<sufixo>` com *Tipo de Compra = Contrato* e concluir o fluxo até a integração que grava o contrato no GCT.
3. Na SC, abrir a aba **Histórico** e o campo **Retorno Integração**.
4. Voltar ao *Acompanhamento de Contratos* e localizar o contrato recém-criado.
5. Repetir os passos 2–4 uma segunda vez no mesmo dia.

**Resultado esperado**
- Histórico com `Integração executada com sucesso - Tempo de Execução N s` e **Retorno Integração** vazio (sem `duplicate key`).
- Contrato criado com número no padrão `NNNNN-AAAA-FFFF`, igual ao maior número do padrão + 1 — **sem letras** e ignorando os legados alfanuméricos.
- A segunda SC recebe o número seguinte, sem colisão.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `duplicate key` na gravação; *Nr. Contrato* montado com letras; contrato não criado; necessidade de limpar `CN9_DATEMI` manualmente.

**Severidade:** Alta — perda de dado (contrato não criado) e chave de negócio corrompida.

**Preparação de massa:** SC `QA-*` criada pelo executor com perfil de comprador; legados alfanuméricos já existem na base (não criar).

**Verificado em tela:** PARCIAL
**O que foi verificado:** `/portal/p/1/acompanhamentoContrato` abre (*Acompanhamento de Contratos*, 845 linhas visíveis, filtro *Filtrar*, paginação *Primeiro/Anterior/Próximo/Último*); `dsProtheus_getContratos_restGetAll` (963 linhas, todas filial 5303): **541 linhas fora do padrão `NNNNN-AAAA-FFFF`**, 71 com letras, 199 números repetidos entre revisões/filiais, e `CN9_DATEMI` **vazio em 100%** das linhas — coerente com o ticket (data de emissão não é critério confiável de numeração). SC não criada.
**Divergências encontradas:** o exemplo `EC0` do ticket não aparece; os legados com letra nesta base têm outras formas (`E001-2023`, `2899-2025-5303A`, `172B`). O ticket fala em `CN9_DATEMI` preenchido em revisão de contrato antigo; hoje o campo está vazio em todas as linhas expostas.
**Dados/massa usados:** leitura de dataset; nenhum registro criado.

---

## CT-FSWTBC-4264  (ambos · Concluído · SDCASSI-271)

**Título:** SC com Tipo de Compra "Contrato" gera contrato no ERP e segue para "Aguarda Vigência do Contrato", não pedido

**Origem:** FSWTBC-4264 — a SC 9651 configurada para contrato gerava PEDIDO; causa em cadeia no MVC NFCA020 executado por JOB (`variable is not an object`, `FwModelActive()` NIL em reentrância, `SetRelation` SC8DETAIL×DHU). Homologado 08/04/2026; patch para DES/SCHEDULE/REST sem confirmação.

**Módulo/Rota:** *Processos › Solicitação de Compras* (`wf_solicitacao_compras`), formulário com **Tipo de Compra = Contrato**; etapas 323 *Aguarda Geração do Pedido/Contrato* → 87 → 317 → **332 Aguarda Vigência do Contrato**; campo **Retorno Integração** (SC); modal **Informações Complementares do Contrato**.

**Pré-condições**
- SC com *Tipo de Compra* = **Contrato** (`tipoCompra === "2"`, não centralizada), cotação finalizada, vencedor definido e alçada aprovada.
- **Bloqueio:** exige comprador (conta QA: *"Comprador não encontrado."*), aprovador de alçada e execução da integração 287 pelo ERP; sem credencial Protheus para conferir SC7/CN9.

**Passos**
1. Crie a SC com **Tipo de Compra = Contrato** (campos de contrato visíveis) e conduza até *Aprovação de Alçadas* (94) aprovada.
2. Aguarde a 3ª integração (287) e a etapa *Aguarda Geração do Pedido/Contrato* (323).
3. Abra a instância; no histórico procure *"Integração executada com sucesso - Tempo de Execução N s"* e leia o campo **Retorno Integração**.
4. Confirme a etapa seguinte no histórico e abra o modal **Informações Complementares do Contrato** (*Status da Integração GCT*, *Erro de Integração*).
5. No Tracker › *Solicitação de Compras* confira o número gerado.

**Resultado esperado**
- O histórico segue 323 → 87 (*Pedido/Contrato foi Gerado?* = Sim) → 317 → **332 Aguarda Vigência do Contrato** — trecho que só existe para contrato.
- O retorno da integração traz **número de contrato** (não número de pedido), sem *"variable is not an object"*.
- *Status da Integração GCT* preenchido sem *Erro de Integração*.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Número de **pedido** gravado em vez de contrato; ou processo parado na 1ª etapa/“não avança” (print de 08/04); em JOB, erro `variable is not an object` no stack `NF020QTDDISP → CALCQTDDISP`.

**Severidade:** Alta — documento fiscal/contratual errado no ERP.

**Preparação de massa:** uma SC tipo Contrato criada pelo executor (`QA` na justificativa) e conduzida por comprador e aprovador de alçada reais; sem eles o caso morre na etapa 119/94.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *confirmado por dado* — cadeia **323 → 87 → 317 → 332** existe nas v95/v97/v98 e a **332 "Aguarda Vigência do Contrato"** só é alcançada por SC de contrato; três integrações (20/177/287). *Visto renderizado* — Tracker e Portal do Comprador abrem. O formulário da SC e o modal de Informações Complementares não foram abertos nesta sessão (rótulos citados vêm do §5-B do briefing).
**Divergências encontradas:** o ticket fala em "gerar Contrato"; no BPM o gateway chama-se **"Pedido/Contrato foi Gerado?"** (87) e a distinção visível é a etapa **332**. Campos de contrato só existem com *Tipo de Compra = Contrato* e fora de centralização.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4415  (ambos · Concluído · SDCASSI-375)

**Título:** Delegar a fiscalização de um contrato e ver a lista de colaboradores elegíveis carregada — ou uma mensagem dizendo por que está vazia.

**Origem:** FSWTBC-4415 — "colaboradores não estão sendo carregados": a lista de candidatos a fiscal depende da
amarração de **cursos obrigatórios por tipo de contrato** (RA1) e, sem ela, ninguém aparece. Resolvido por
configuração no mesmo dia (22/04/2026). Terceira ocorrência do tema (FSWTBC-4332, 4326).

**Módulo/Rota:** Fluig → processo **Delegação de Fiscais de Contratos e Serviços**
(`wf_delegacaoFiscalContratoServico`) — a etapa em que o gestor **escolhe o fiscal** · dataset
`dsProtheus_getFiscaisPorTipoContrato` (`GET /api/public/ecm/dataset/search?datasetId=…`).

**Pré-condições**
- Um contrato vigente cujo **tipo** tenha cursos obrigatórios amarrados no Protheus e ao menos um colaborador
  com esses cursos concluídos.
- Um tipo de contrato **sem** amarração, para o cenário negativo.
- Usuário **gestor** do contrato (quem escolhe o fiscal).
- **Bloqueio:** a tela de escolha do fiscal **não é alcançável por esta conta** — o formulário abre só com
  campos readonly (`Fiscal *`, `Email do Fiscal *`) e nenhum fonte publicado baixado consome o dataset.
  Amarração de cursos é cadastro no Protheus (sem credencial).

**Passos**
1. Como gestor, abrir a tarefa de delegação do contrato de tipo **com** cursos amarrados e acionar a seleção de fiscal.
2. Conferir a lista de colaboradores.
3. Repetir para um contrato de tipo **sem** amarração.
4. Em paralelo, chamar `GET /api/public/ecm/dataset/search?datasetId=dsProtheus_getFiscaisPorTipoContrato&filterFields=<tipo>,…`
   para os dois tipos e comparar com o que a tela mostra.

**Resultado esperado**
- Tipo com amarração: lista preenchida com os colaboradores que têm os cursos; o dataset devolve os mesmos registros.
- Tipo sem amarração: a tela **informa** que não há colaboradores elegíveis (por falta de cursos obrigatórios
  configurados para o tipo) — não uma lista vazia muda.
- Falha de consulta (Protheus fora) é apresentada como erro, distinta de "sem elegíveis".

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Lista de colaboradores **vazia, sem mensagem**, impossibilitando continuar (prints de 22/04/2026).

**Severidade:** Média *(bloqueia a delegação; sintoma idêntico a três causas diferentes)*

**Preparação de massa:** amarração de cursos obrigatórios por tipo de contrato no Protheus (time ERP) e um
colaborador com os cursos; contrato vigente do tipo. Nada disso é criável pelo QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** formulário aberto em branco: seções *Identificação do Contrato/Serviço* (Tipo da
Solicitação: Contrato/Serviço/Medição; **Filial Contrato\***, **Número Contrato\***, **Filial Planilha\***,
**Número Planilha\***, **Filial Medição\***, *Objeto do Contrato*), *Identificação do Fiscal* (**Fiscal \***,
**Email do Fiscal \*** — readonly) e *Decisão da Delegação* (**Aceitar? \*** Sim/Não, *Motivo:\**). Dataset
`dsProtheus_getFiscaisPorTipoContrato` **existe** (200 `[]` sem filtro e com `TIPOCONTRATO/FILIAL`,
`BRANCHID/CN9_TPCTO`, `CODTIPOCONTRATO/CODFILIAL`, `TIPOCONTRATO=001/FILIAL=5303`) — nomes de filtro corretos
não identificados, pois nenhum fonte baixado o consome.
**Divergências encontradas:** o ticket diz "colaboradores"; a tela chama **Fiscal**. Não há na plataforma tela
"Ato de Delegação" (L012/L015). O rótulo vazio continua sem mensagem — a recomendação do ticket não consta
implementada em nada que foi lido.
**Dados/massa usados:** nenhum — formulário não submetido.

---

## CT-FSWTBC-4416  (protheus · Concluído · SDCASSI-376)

**Título:** Listar os fiscais elegíveis (FS e FC) para um tipo de contrato com cursos obrigatórios e obter quem possui ao menos um dos cursos, por perfil

**Origem:** FSWTBC-4416 — a amarração *Tp Contrato x Cursos Obrigatórios* só exibia o fiscal que tinha **todos** os cursos (AND onde deveria ser critério opcional), e FS/FC não eram distinguidos. Correções: API `UGCTE023` v2 com filtro `FC/FS/ALL`; busca de cursos pelo campo `RA1_CURSO`; gravação de fiscal multifilial (CPD) criando o registro quando não existe; segregação controlada por `CN1_XVLDFI`.

**Módulo/Rota:** Fluig — dataset `dsProtheus_getFiscaisPorTipoContrato` (wrapper da API de fiscais; `GET /api/public/ecm/dataset/search?datasetId=dsProtheus_getFiscaisPorTipoContrato&filterFields=…`); processo *Delegação de Fiscais de Contratos e Serviços* (`wf_delegacaoFiscalContratoServico`, seção **Identificação do Fiscal**: *Fiscal \**, *Email do Fiscal \**); *Acompanhamento de Contratos* → modal de fiscal (`ds_get_fiscalContrato`). No ERP: GCT → *Tipos de Contrato* → aba *Tp Contrato x Cursos Obrigatórios*; cadastro de fiscais (a confirmar no menu do cliente).

**Pré-condições**
- Um tipo de contrato com ≥ 2 cursos obrigatórios cadastrados, cursos distintos para FS e FC, e `CN1_XVLDFI` ativo.
- Três funcionários: A com **um** dos cursos FS, B com **todos** os cursos FS, C sem curso algum; um fiscal FC com curso FC.
- **Bloqueio:** a elegibilidade é cadastrada no Protheus (cursos em `RA1`, amarração no tipo de contrato) — sem credencial de Protheus, a massa não pode ser preparada nesta rodada; o dataset devolve `[]` hoje para todas as combinações de filtro.

**Passos**
1. Chamar `GET …/dataset/search?datasetId=dsProtheus_getFiscaisPorTipoContrato&filterFields=TIPOCONTRATO,<tipo>,FILIAL,<filial>,PERFIL,FS` (nomes de filtro conforme o fonte do dataset; confirmar antes) e anotar os fiscais devolvidos.
2. Repetir com `PERFIL,FC` e com `ALL`.
3. No Fluig, iniciar *Delegação de Fiscais de Contratos e Serviços* com *Tipo da Solicitação* = Contrato, informar *Filial Contrato*/*Número Contrato* de um contrato do tipo em teste e abrir a seleção de *Fiscal* (não enviar).
4. No ERP, abrir o contrato → fiscais e comparar a lista oferecida com a do passo 1.
5. Num contrato **multifilial**, delegar um fiscal para uma filial sem registro CPD prévio.

**Resultado esperado**
- Passo 1: A **e** B aparecem (um curso basta); C não aparece.
- Passo 2: `FC` devolve apenas fiscais com cursos FC; `ALL` devolve a união, sem duplicar.
- Passo 3: a seleção de *Fiscal* oferece a mesma lista do dataset para o perfil correspondente.
- Passo 5: o registro CPD é **criado** e o fiscal fica gravado na filial.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Só B (todos os cursos) listado; listas vazias "como se fosse cadastro incompleto"; FS e FC misturados; gravação multifilial ignorada silenciosamente.

**Severidade:** Alta — controle de segregação/alçada (quem pode ser fiscal), recomendação de auditoria.

**Preparação de massa:** funcionários A/B/C com cursos em `RA1` e amarração no tipo de contrato — pela equipe de RH/contratos no Protheus. Contrato multifilial do tipo em teste.

**Verificado em tela:** PARCIAL
**O que foi verificado:** `GET search` de `dsProtheus_getFiscaisPorTipoContrato` → **200 `[]`** (existe; vazio sem filtro — lotes anteriores mediram vazio também com `TIPOCONTRATO/FILIAL`, `BRANCHID/CN9_TPCTO`, `CODTIPOCONTRATO/CODFILIAL`); formulário de *Delegação de Fiscais de Contratos e Serviços* aberto (form 627176): seções *Identificação do Contrato/Serviço* (Tipo da Solicitação, Filial Contrato, Número Contrato, Filial Planilha, Número Planilha, Filial Medição), *Identificação do Fiscal* (Fiscal \*, Email do Fiscal \*), *Decisão da Delegação* (Termo de aceite, Aceitar?). Nenhum fonte publicado chama `dsProtheus_getFiscaisPorTipoContrato`; o *Acompanhamento de Contratos* usa `ds_get_fiscalContrato`. Não submetido.
**Divergências encontradas:** o título do formulário de Delegação traz a instrução autoanulante *"Todos os campos com \* são obrigatórios já os campos com \* não são obrigatórios"* (achado A10). O dataset de fiscais por tipo de contrato existe mas não é consumido por nenhuma tela publicada.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4420  (ambos · Concluído · SDCASSI-379)

**Título:** Abrir a Delegação de Fiscais e encontrar o campo da filial em que o fiscal mede como "Filial Medição", não "Filial Amarração".

**Origem:** FSWTBC-4420 — renomear **"Filial Amarração"** para **"Filial Medição"** no formulário de delegação,
trocando jargão do dicionário Protheus pelo termo de negócio. Entregue 22/04, homologado 23/04/2026.

**Módulo/Rota:** Fluig → **Delegação de Fiscais de Contratos e Serviços**
(`pageworkflowview?processID=wf_delegacaoFiscalContratoServico`), seção *Identificação do Contrato/Serviço* ·
**Tracker** (*Filtrar por* = Faturamento de Contratos, filtro **Filial Medição**) · **Faturamento de
Contratos** (**Filial da Medição \***).

**Pré-condições**
- Usuário com permissão de abrir o processo (a conta de QA tem).
- **Bloqueio:** nenhum.

**Passos**
1. Abrir o formulário da Delegação de Fiscais.
2. Ler os rótulos da seção *Identificação do Contrato/Serviço*.
3. Procurar a palavra "Amarração" em toda a tela (Ctrl+F).
4. Abrir o **Tracker** com *Filtrar por* = Faturamento de Contratos e ler o painel *Informações da Medição*.

**Resultado esperado**
- O rótulo é **"Filial Medição\*"**, entre **Número Planilha\*** e *Objeto do Contrato*.
- "Amarração" não aparece em lugar nenhum da tela.
- Tracker e Faturamento usam o mesmo conceito ("Filial Medição" / "Filial da Medição").

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Rótulo **"Filial Amarração"** no formulário.

**Severidade:** Baixa *(terminologia; reduz erro de configuração multifilial)*

**Preparação de massa:** nenhuma.

**Verificado em tela:** SIM (total)
**O que foi verificado:** formulário aberto em branco (iframe `#workflowView-cardViewer`): rótulos, na ordem,
**Filial Contrato\***, **Número Contrato\***, **Filial Planilha\***, **Número Planilha\***, **Filial Medição\***,
*Objeto do Contrato*. Busca por "Amarração" no texto visível: **não encontrado**. Tracker (visão Faturamento)
já tinha os filtros **Filial Contrato** e **Filial Medição** (L027).
**Divergências encontradas:** o input por trás do rótulo continua com `id="filialAmarracao"` (readonly) — a
renomeação foi só do rótulo. O cabeçalho do formulário diz *"Todos os campos com \* são obrigatórios já os
campos com \* não são obrigatórios"* (A10). Grafias distintas para o mesmo conceito: "Filial Medição"
(Delegação e Tracker) × "Filial da Medição" (Faturamento).
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-4460  (ambos · Concluído · SDCASSI-391)

**Título:** Levar uma SC aprovada na alçada até o fim e ver o pedido de compras gerado, com "Nº Pedido" preenchido e o processo encerrado.

**Origem:** FSWTBC-4460 — pedido de compras **não finalizava**: parâmetros não ajustados na aplicação dos
pacotes geravam erro interno no Protheus ao movimentar os processos do Fluig. Reprovado em 29/04, aceito
30/04, fechado 05/05/2026.

**Módulo/Rota:** Fluig → SC em **Aguarda Geração do Pedido/Contrato** (após *Aprovação de Alçada*, seq 94) →
**Formulário**, seção da *Empresa Vencedora* (**Nº Pedido\***, **Nº Contrato\***) · **Histórico** · **Tracker**
(*Atividade Atual*, Status *Finalizados*) · **Logs Protheus → Solicitacoes ZZY**.

**Pré-condições**
- Uma SC com vencedor definido e alçada aprovada, parada em *Aguarda Geração do Pedido/Contrato*.
- Aprovadores de alçada e comprador reais; Protheus com os 16 parâmetros do NFC configurados.
- **Bloqueio:** exige o ciclo completo (comprador + aprovadores) — a conta de QA não tem nenhum dos perfis; o
  pedido em si só é visível no Protheus.

**Passos**
1. No **Tracker** (Solicitação de Compras / Abertos), localizar SCs com *Atividade Atual* =
   **Aguarda Geração do Pedido/Contrato**; anotar hora de entrada no **Histórico**.
2. Aguardar um ciclo do schedule (≤ 10 min) e reconsultar.
3. Na SC que saiu: aba **Formulário**, seção da *Empresa Vencedora* → **Nº Pedido\*** (ou **Nº Contrato\***,
   se *Tipo de Compra* = Contrato).
4. **Histórico**: última integração com `Integração executada com sucesso`; **Informações**: processo encerrado.
5. **Tracker** com Status = **Finalizados**: o processo aparece.
6. Se não saiu: **Logs Protheus → Solicitacoes ZZY** pelo *Id Fluig*.

**Resultado esperado**
- A SC sai de *Aguarda Geração do Pedido/Contrato* em minutos; **Nº Pedido** preenchido; processo **finalizado**.
- Em falha, o ZZY exibe erro com mensagem e a SC vai para *Correção* com o motivo legível — nunca parada muda.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC parada em *Aguarda Geração do Pedido/Contrato* indefinidamente; "não finaliza", sem indicar qual parâmetro falta.

**Severidade:** Média *(trava a etapa final; sem perda de dado)*

**Preparação de massa:** SC `QA` conduzida por comprador e aprovadores até a alçada; parametrização NFC conferida
pelo time Protheus (lista do FSWTBC-4456).

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário da SC renderiza, na seção da *Empresa Vencedora*, os rótulos **Nº Pedido\***,
**Nº Contrato\***, **Valor da Compra (R$) \***, **Total a ser Aprovado (R$) \***; a atividade **"Aguarda Geração do
Pedido/Contrato"** e a intermediária **326** constam no mapa por dado (L027). Tracker aberto com a coluna
*Atividade Atual* e o combo de Status (Todos/Abertos/Finalizados/Cancelados). Nenhuma SC em fase de pedido
pertence à conta de QA; ZZY em 404.
**Divergências encontradas:** o ticket não descreve mensagem nem tela; o caso é de caracterização do efeito. A
seção tem duas grafias — "Valor da Compras (R$)" (grade) e "Valor da Compra (R$)" (painel), já registradas.
**Dados/massa usados:** nenhum — leitura.

---

## CT-FSWTBC-4472  (ambos · Concluído · SDCASSI-396)

**Título:** Concluir uma SC de Nova Contratação e ver o contrato gerado pela rotina NFC — sem erro de campo inexistente.

**Origem:** FSWTBC-4472 — geração de contrato pela rotina NFC falhava por referência ao campo **CNL_XZERSL**,
que não existe na TST (pertence a outra demanda, só em DES). Acoplamento indevido entre demandas; remissão
via SDCASSI-419, PR 67979 / MUD17729 (28/05/2026).

**Módulo/Rota:** Fluig → **Solicitação de Compras** com *Tipo de Solicitação* = **Nova Contratação** e *Tipo de
Compra* = Contrato → alçada → **Aguarda Geração do Pedido/Contrato** → **Formulário** (**Nº Contrato\***,
**Retorno Integração**) · **Histórico** · **Acompanhamento de Contratos** (modal *Informações Complementares
do Contrato*: *Status da Integração GCT*, *Erro de Integração*) · **Logs Protheus → Erros CV8**.

**Pré-condições**
- SC de contratação com vencedor e alçada aprovada; Protheus com dicionário da base alvo.
- **Bloqueio:** ciclo completo exige comprador/aprovadores; o dicionário (SX3) só no Protheus.

**Passos**
1. Após a alçada, acompanhar a SC em **Aguarda Geração do Pedido/Contrato** (Tracker / Histórico).
2. Ao sair, ler **Nº Contrato** no formulário e o **Histórico** (`Integração executada com sucesso`).
3. Abrir **Acompanhamento de Contratos**, pesquisar o contrato: modal *Informações do Contrato* → *Status da
   Integração GCT* e *Erro de Integração*.
4. Se a SC foi para *Correção*: ler **Retorno Integração** e **Logs Protheus → Erros CV8** pelo *Id Fluig*.

**Resultado esperado**
- Contrato gerado; **Nº Contrato** preenchido; contrato listado no Acompanhamento com *Status da Integração
  GCT* de sucesso e *Erro de Integração* vazio.
- Nenhuma mensagem citando `CNL_XZERSL` ou "campo inexistente" em Retorno Integração, Histórico ou CV8.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro do Protheus referenciando **CNL_XZERSL** ao gerar o contrato; SC em *Correção*; contrato não criado.

**Severidade:** Média *(bloqueia a etapa final; sem perda de dado)*

**Preparação de massa:** SC `QA` de Nova Contratação levada até a alçada por comprador/aprovadores.

**Verificado em tela:** PARCIAL
**O que foi verificado:** formulário da SC com *Tipo de Solicitação \** (rótulo real da opção: **Nova
Contratação**, conforme rótulos confirmados no briefing §5-B), **Número do Contrato**, **Revisão do Contrato**, **Fornecedor Contrato \***,
**Nº Contrato\***, **Retorno Integração\***; Acompanhamento de Contratos aberto (845 contratos, ícones *Planilha
/ Solicitação de Compra / Informações do Contrato*); Logs Protheus com aba **Erros CV8** (consulta 404 hoje).
**Divergências encontradas:** os dois prints de 26/05 no ticket tratam de outro assunto (valor de referência,
SDCASSI-369) — evidência postada no ticket errado. O nome "rotina NFC" não aparece em nenhuma tela do Fluig.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-4503  (ambos · Concluído · SDCASSI-398)

**Título:** Após um deploy, confirmar que o dataset de fiscais existe e responde, e que o Ato de Delegação lista os fiscais.

**Origem:** FSWTBC-4503 — Ato de Delegação sem fiscais em **produção**: **ausência do dataset
`dsProtheus_getFiscaisPorTipoContrato`** (DEM10016012 entrou em produção em 24/04 sem ele; defeito só
apareceu em 04/05). Corrigido pelo deploy do dataset (06/05/2026). Quarta ocorrência de artefato não publicado.

**Módulo/Rota:** Fluig → `GET /api/public/ecm/dataset/search?datasetId=dsProtheus_getFiscaisPorTipoContrato`
· processo **Delegação de Fiscais de Contratos e Serviços** (etapa de escolha do fiscal).

**Pré-condições**
- Sessão autenticada no Fluig (qualquer usuário — o endpoint de dataset é leitura).
- Para a parte de tela: gestor com tarefa de delegação aberta e tipo de contrato com cursos amarrados (ver
  CT-FSWTBC-4415).
- **Bloqueio:** a tela de escolha do fiscal não é alcançável pela conta de QA; o smoke do dataset **não tem bloqueio**.

**Passos**
1. Chamar `GET /api/public/ecm/dataset/search?datasetId=dsProtheus_getFiscaisPorTipoContrato` (navegador logado).
2. Chamar o mesmo endpoint com um nome inexistente (ex.: `…_NAO_EXISTE`) para ter a referência de "ausente".
3. Chamar com os filtros do tipo de contrato em teste.
4. Como gestor, abrir a delegação e acionar a escolha do fiscal.

**Resultado esperado**
- Passo 1: **HTTP 200** com `{"content":[…]}` (lista, possivelmente vazia sem filtro).
- Passo 2: **HTTP 500** `java.lang.NullPointerException` — prova que o passo 1 não é um "200 genérico".
- Passo 3: fiscais elegíveis do tipo.
- Passo 4: a tela lista os mesmos fiscais; nunca lista vazia com dataset ausente.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Tela sem fiscais (Screenshot_3.png); o dataset responde **500 NullPointerException** no `/dataset/search`.

**Severidade:** Média *(bloqueia a delegação; causa de deploy incompleto)*

**Preparação de massa:** nenhuma para o smoke; para a tela, a massa do CT-FSWTBC-4415.

**Verificado em tela:** PARCIAL
**O que foi verificado:** `dsProtheus_getFiscaisPorTipoContrato` → **200 `{"content":[],"message":null}`**
(sem filtro e com 4 combinações); `…_NAO_EXISTE_QA` → **500 `{"content":"ERROR","message":{"message":
"java.lang.NullPointerException",…,"errorCode":"ECMException"}}`**. O `POST /api/public/ecm/dataset/datasets`
devolve `{"content":{}}` para ambos — **não serve** para o smoke; use o `GET …/search`. A parte de tela não foi
alcançada (formulário readonly para esta conta; nenhum fonte baixado consome o dataset).
**Divergências encontradas:** o dataset existe nesta base — a causa do ticket não está presente aqui; "Ato de
Delegação" não é nome de tela na plataforma (é *Delegação de Fiscais de Contratos e Serviços*). `ds_get_fiscalServico`
responde `STATUS:"ERROR", RESPONSE:"Cannot read property \"cna_xfisca\" from undefined"` — erro interno vazando
como resposta.
**Dados/massa usados:** nenhum — só leitura de datasets.

## CT-FSWTBC-4579  (protheus · Concluído · SDCASSI-414)

**Título:** Receber a nota fiscal de um fornecedor com documentação obrigatória cadastrada e ter a nota barrada quando a documentação não vem junto

**Origem:** FSWTBC-4579 — fornecedor enviou nota **sem** a documentação obrigatória, embora ela estivesse cadastrada como obrigatória. Causa: **falta do cadastro do schedule** que aplica a validação; sem ele a regra não roda e nada avisa. Qual schedule faltava não foi registrado, nem houve varredura das notas que passaram no período.

**Módulo/Rota:** Fluig — processos *Recepção de Documentos Fiscais* (`bpm_recepcao_documentos_fiscais_contratos`, `…_compras`, `…_fiscais_contratos`, `…_comprador_compras`, `…_demandante_compras`) e Tracker `PORTAL_TRACKER_COMPRAS_CONTRATOS` → visão de Recepção de Documentos Fiscais → modal **Documentação** (`ds_process_attachments_files`). No ERP: cadastro de documentação obrigatória do fornecedor e o schedule de validação (nome de rotina/schedule a confirmar no menu do cliente; módulo Compras/GCT).

**Pré-condições**
- Fornecedor com ao menos um documento marcado como **obrigatório** no cadastro do ERP.
- Schedule de validação de documentação **cadastrado e ativo** (conferir antes — é a causa do ticket).
- Credencial de fornecedor para enviar a nota pelo *Portal do Fornecedor* (a conta de QA não tem; o widget do portal falha para ela).
- **Bloqueio:** sem credencial de fornecedor nem de Protheus; a conta de QA recebe HTTP 500 em `getDefinitionProcess` ao tentar iniciar `bpm_recepcao_documentos_fiscais_contratos`. Caso para executor com perfil de fornecedor + administrador do ERP.

**Passos**
1. No ERP, confirmar o schedule ativo e o documento obrigatório do fornecedor.
2. Como fornecedor, enviar uma nota `QA-<sufixo>` **sem** anexar o documento obrigatório.
3. No Tracker, localizar a solicitação de recepção pelo número e abrir **Documentação**.
4. Abrir a aba **Histórico** da solicitação.
5. Enviar uma segunda nota **com** o documento e repetir 3–4.

**Resultado esperado**
- Passo 2: recusa/impedimento explícito citando a documentação obrigatória ausente (mensagem `<não documentado>` no ticket — registrar a real).
- Passo 3: sem o documento, a nota **não** avança para aprovação/pagamento; o Histórico registra o motivo.
- Passo 5: nota com documento avança normalmente.
- Schedule desligado deve produzir **erro visível**, nunca aprovação silenciosa.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Nota aceita e encaminhada sem a documentação obrigatória, sem qualquer aviso.

**Severidade:** Alta — conformidade/aprovação indevida.

**Preparação de massa:** fornecedor de teste com documento obrigatório (equipe de compras no ERP); duas notas `QA-*` enviadas pelo executor com perfil de fornecedor.

**Módulo ERP:** `Integracao e Filas` (schedule de validação; regra de negócio em Compras/GCT)
**Verificado em tela:** PARCIAL
**O que foi verificado:** lista de processos do tenant contém os cinco `bpm_recepcao_documentos_fiscais_*`; Tracker (`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`) abre com filtros *Solicitação de Compras / Cotação / Negociação…*, *Número da Solicitação*, *Número do Contrato*; a lib `libRDF` do Tracker monta o modal *Documentação* a partir de `ds_process_attachments_files` (constraint `processId`). Tentativa de abrir `pageworkflowview?processID=bpm_recepcao_documentos_fiscais_contratos` → modal **Erro** (500 em `getDefinitionProcess`) para a conta de QA; `/portal/p/1/portal_fornecedor` abre em branco com erro de widget (`MyWidget.instance` undefined, `ly_portal_fornecedor/.../wcm_widgets_pt_BR.js` 404) — limitação de conta/ambiente, não defeito do caso. A validação em si (schedule) não é observável no Fluig.
**Divergências encontradas:** o ticket é classificado Protheus, mas a recepção da nota tem processo próprio no Fluig; a mensagem de recusa não está documentada.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4594  (ambos · Concluído · SDCASSI-419)

**Título:** Contrato gerado a partir de cotação migrada pelo NFC aparece no Acompanhamento de Contratos com tipo *999 - INTEGRACAO NFC*

**Origem:** FSWTBC-4594 — erro ao gerar contrato para cotações migradas pelo NFC (campos `CNL_XZERSL`/`CNA_XVLRTO`
inexistentes em alguns dicionários; corrigido com guards `FieldPos`). Ficou sem resposta a observação do cliente: o contrato
gerado **não veio com o tipo 999 - INTEGRACAO NFC** (parâmetro `MV_XNFCTPC`).

**Módulo/Rota:** **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`), coluna **Tipo Contrato**; modal
**Informações Complementares do Contrato** (*Status da Integração GCT*, *Erro de Integração*, *Fiscal de Serviço*);
Tracker → *Faturamento de Contratos*

**Pré-condições**
- SC do tipo **Nova Contratação** concluída pelo Novo Fluxo de Compras (NFC) até a geração do contrato no ERP.
- **Bloqueio:** contrato não é criável pela automação nem pela conta de QA (`docs/criacao-de-contrato-inviavel.md`); nesta
  base **não existe nenhum contrato com tipo 999/NFC** na grade.

**Passos**
1. Abrir *Acompanhamento de Contratos*; no filtro global digitar `INTEGRACAO NFC` e depois `999`.
2. Localizar o contrato gerado pela SC da pré-condição; ler **Tipo Contrato**, **Status**, **Nº Revisão**.
3. Abrir a ação de informações complementares e ler *Status da Integração GCT* e *Erro de Integração*.

**Resultado esperado**
- O contrato aparece com **Tipo Contrato = `999 - INTEGRACAO NFC`** e sem *Erro de Integração*.
- A geração não falha por campo customizado ausente.

**Resultado se o defeito reincidir**
- Erro ao gerar contrato (prints do ticket) ou contrato gerado com outro tipo — o Fluig pode rotear errado.

**Severidade:** Alta (contrato/roteamento)

**Preparação de massa:** contrato gerado pelo NFC em produção/homologação por comprador real — não existe hoje nesta base.

**Verificado em tela:** PARCIAL
**O que foi verificado:** grade com 845 linhas e colunas *Filial, Tipo Contrato, Contrato, Data Inicio, Data Fim, Nº
Revisão, Status, Fornecedor, Ação*; filtro `NFC` → "Nenhum registro encontrado"; filtro `INTEGRACAO` → nenhum; filtro
`999` → 7 linhas, **todas por casamento no CNPJ do fornecedor** (ex.: `53719995`), nenhuma do tipo 999. O cadastro do ERP
**tem** o tipo: `dsProtheus_getTipoContratos_restGetAll` (200, 114 tipos) devolve `CN1_CODIGO "999" / CN1_DESCRI
"INTEGRACAO NFC"`.
**Divergências encontradas:** o filtro de *Tipo Contrato* busca pelo código e exibe a descrição (ACHADOS A6); o `999` do
filtro global casa com CNPJ, o que induz falso positivo.
**Dados/massa usados:** leitura da grade e do dataset; nada submetido.

---

## CT-FSWTBC-4611  (protheus · Concluído · SDCASSI-424)

**Título:** Vigorar um contrato com duas planilhas de tipos diferentes e conferir, no Protheus e no Fluig, que só a planilha do tipo "zerar saldo" fica com saldo zero

**Origem:** FSWTBC-4611 — ao vigorar contrato com dois tipos de planilha (um configurado para zerar saldo, outro não), o sistema zerava o saldo de **ambas**: o `PE_CN100SIT` ainda avaliava o tipo de contrato. Corrigido (03/06) para avaliar `CNL_XZERSL` **por planilha**, movendo `CNA_SALDO` para `CNA_XVLRTO` antes de zerar; colaterais: guard `nLinhaCNA > 0` em `RestauraSaldo` (THREAD ERROR) e `RestauraSaldo` só na operação 4. Reincidente (duplica FSWTBC-3483); retido para produção pela DEM10013766.

**Módulo/Rota:** Protheus → Gestão de Contratos (SIGAGCT) → *Tipos de Planilha* (campo `CNL_XZERSL`) → *Contratos* → inclusão/aprovação (`CNTA300`) → mudança de situação para *Vigente* (`PE_CN100SIT`). Fluig → **Acompanhamento de Contratos** → filtro pelo contrato → ícone **Planilha** → modal **Planilhas do Contrato** → ação **Detalhes da Planilha** (campos *Tipo da Planilha*, *Valor Total*, *Saldo da Planilha*); ícone **Informações do Contrato** → grupo *Valores Financeiros* → *Saldo do Contrato*.

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Credencial no Protheus (SIGAGCT). Tipo de planilha **A** com `CNL_XZERSL = Sim` e **B** com `Não` — o campo **não é visível no Fluig** (dataset com 21 colunas, nenhuma `CNL_X*`), então o executor confirma no ERP.
- Contrato de homologação com **P1** (tipo A) e **P2** (tipo B), ambas com saldo > 0, ainda não vigente.
- **Bloqueio:** a massa (tipos e contrato) só pode ser criada no Protheus — sem credencial nesta rodada; a leitura no Fluig está disponível. Hoje o `POST` de datasets oscila para vazio (instabilidade), mas a tela do Acompanhamento carregou.

**Passos**
1. (Protheus) Confirmar `CNL_XZERSL` dos tipos A e B.
2. (Fluig, antes) *Acompanhamento de Contratos* → *Filtrar* pelo número → ícone **Planilha** → para P1 e P2, **Detalhes da Planilha**: anotar *Tipo da Planilha*, *Valor Total* e *Saldo da Planilha*; ícone **Informações do Contrato**: anotar *Status* e *Saldo do Contrato*.
3. (Protheus) Aprovar/vigorar o contrato (situação → `05 Vigente`).
4. (Fluig, depois) Repetir o passo 2.
5. (Protheus) Conferir `CNA_XVLRTO` de P1 = saldo anterior de P1 e `CNA_SALDO` de P2 inalterado.
6. (Protheus) Alterar o contrato (operação 4) e confirmar — `RestauraSaldo` roda sem *THREAD ERROR*; incluir um contrato novo (operação 3) — sem chamada de `RestauraSaldo`.

**Resultado esperado**
- Passo 4: P1 com *Saldo da Planilha* **R$ 0,00**; P2 com o mesmo saldo do passo 2; *Status* **Vigente**; *Saldo do Contrato* = soma dos saldos remanescentes (P2).
- Passo 5: `CNA_XVLRTO` de P1 guarda o saldo anterior; P2 intacta.
- Passo 6: sem erro na alteração; inclusão não tenta restaurar saldo.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- P1 **e** P2 com saldo zero após vigorar ("antes, TODAS as planilhas eram zeradas indiscriminadamente"); *Saldo do Contrato* zerado; *THREAD ERROR* em `RestauraSaldo` na alteração.

**Severidade:** Alta *(saldo contábil de contrato — CPC 06; reincidente)*

**Preparação de massa:** dois tipos de planilha e um contrato com duas planilhas, criados pelo executor no Protheus (filial 5303 ou 4010); confirmar antes se o pacote DEM10013747 já entrou em produção (estava retido pela DEM10013766).

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Acompanhamento de Contratos* aberto (845 linhas); filtro `00186-2022-5303` → 1 linha (`5303 | 080 - DIREITO DE USO - LICENCA DE SW | 00186-2022-5303 | 06/05/2022 | 05/11/2028 | 006 | Vigente | 01080512 - 0001`); ícone **Planilha** → modal *Informações da Planilha / Planilhas do Contrato* com 9 registros (colunas *Filial, Contrato, Planilha, Revisão, Cod. Fornecedor, Fornecedor, Loja Forn., Ações*); ação **Detalhes da Planilha** na planilha 000001 → **"Tipo da Planilha: 002", "Valor Total: R$ 1.423.738,65", "Saldo da Planilha: R$ 943.047,16"** (também *Saldo Frete/Despesas/Seguro*, *Cod. Cronograma Contabil*); ícone **Informações do Contrato** → *Saldo do Contrato: R$ 11.144.085,87*. Datasets: `dsProtheus_getPlanilha_restGetAll` (6 planilhas da rev. atual do 00186, todas tipo 002, `CNA_VLTOT`/`CNA_SALDO` presentes), `dsProtheus_getTipoPlanContratos_restGetAll` (3 tipos, sem `CNL_X*`), `00049-2026-5303` (planilha 000001 tipo 003, *Valor Total* 115.828,00, saldo vazio).
**Divergências encontradas:** (1) `CNL_XZERSL` não é projetado no Fluig — o executor não consegue saber pelo portal qual planilha deveria zerar; (2) dois tipos com a **mesma descrição "FIXA"** (`001` e `003`) — pelo nome não se distingue qual zera; (3) saldo **vazio** em vez de `0,00` em planilhas recém-criadas (00049-2026-5303) — "vazio" e "zerado" ficam indistinguíveis em tela.
**Dados/massa usados:** contratos `00186-2022-5303` e `00049-2026-5303`, leitura apenas — nada submetido.

---

## CT-FSWTBC-4612  (ambos · Concluído · SDCASSI-425)

**Título:** Tipo *999 - INTEGRACAO NFC* é preenchido automaticamente só quando o contrato nasce pela API do Fluig

**Origem:** FSWTBC-4612 — "Novo Fluxo de compra não trouxe tipo de contrato na manutenção de contrato". Encerrado no mesmo
dia; o relato de erro em produção (27/05) migrou para o SDCASSI-434, onde se apurou **não haver defeito**: contrato criado
manualmente no Protheus usa o tipo escolhido pelo usuário; o 999 automático só vale para contrato criado pela API do Fluig.

**Módulo/Rota:** **Acompanhamento de Contratos**, coluna **Tipo Contrato**; SC → *Formulário* (**Tipo de Solicitação**:
*Nova Contratação* / *Aditivo Contratual*, **Número do Contrato**, **Revisão do Contrato**)

**Pré-condições**
- Dois contratos: um criado pela SC *Nova Contratação* (API), outro incluído manualmente no Protheus.
- **Bloqueio:** sem credencial Protheus; sem contrato NFC nesta base.

**Passos**
1. Em *Acompanhamento de Contratos*, localizar o contrato criado via Fluig e ler **Tipo Contrato**.
2. Localizar o contrato incluído manualmente e ler **Tipo Contrato**.
3. Abrir a SC *Nova Contratação* de origem e conferir **Número do Contrato** / **Revisão do Contrato** preenchidos.

**Resultado esperado**
- Contrato via Fluig: **`999 - INTEGRACAO NFC`**.
- Contrato manual: o tipo informado pelo usuário (qualquer dos 113 demais), sem alteração automática.
- SC de origem com **Número do Contrato** preenchido e sem *Correção*.

**Resultado se o defeito reincidir**
- Contrato via Fluig sem tipo ou com tipo diferente de 999 (print do ticket).

**Severidade:** Média

**Preparação de massa:** contrato gerado pelo NFC (não existe hoje) e um contrato manual de referência (há 845 na grade).

**Verificado em tela:** PARCIAL
**O que foi verificado:** combo **Tipo de Solicitação** com opções *Selecione… / Aditivo Contratual / Nova Contratação*
(visto renderizado na SC 113237); campos **Número do Contrato** e **Revisão do Contrato** presentes no formulário da SC;
grade de contratos sem nenhum tipo 999; tipo 999 existente no cadastro do ERP (dataset).
**Divergências encontradas:** "Nova Solicitação de Contrato" do registro = **Nova Contratação** na tela; "manutenção de
contrato" é tela do Protheus — a superfície Fluig equivalente é a coluna **Tipo Contrato** do Acompanhamento.
**Dados/massa usados:** SC 113237, grade de contratos, dataset de tipos (leitura); nada submetido.

---

## Resumo do lote

| Caso | Verificado | Bloqueio principal |
|---|---|---|
| CT-FSWTBC-4521 | PARCIAL | conta sem matrícula de comprador; genericQuery 404 |
| CT-FSWTBC-4526 | PARCIAL | idem + ZZY 404; ação "Regerar Documento" não localizada no bundle |
| CT-FSWTBC-4527 | PARCIAL | sem credencial de gestor (lado negativo observado na SC 112830) |
| CT-FSWTBC-4538 | PARCIAL | não cancelar registro pré-existente; conta não é comprador |
| CT-FSWTBC-4540 | PARCIAL | sem credencial de fiscal — **reprova hoje** (Fluig aceita rateio 0) |
| CT-FSWTBC-4550 | PARCIAL | sem credencial de gestor (sintoma vivo na SC 112830) |
| CT-FSWTBC-4551 | PARCIAL | sem fiscal; ZZZ 404; fila travada desde 17/08 (A16) |
| CT-FSWTBC-4552 | PARCIAL | idem |
| CT-FSWTBC-4557 | PARCIAL | C8_QTDISP só no Protheus; produto padrão — **pode falhar hoje** |
| CT-FSWTBC-4566 | PARCIAL | conta não é comprador; ZZY 404 |
| CT-FSWTBC-4580 | PARCIAL | envio sem rateio não exercitado para não gravar |
| CT-FSWTBC-4581 | PARCIAL | nenhum (cancelamento em Início observado na SC 113237, não executado) |
| CT-FSWTBC-4594 | PARCIAL | nenhum contrato NFC/999 nesta base |
| CT-FSWTBC-4612 | PARCIAL | idem; manutenção de contrato é Protheus |

## CT-FSWTBC-4634  (ambos · Concluído · SDCASSI-431)

**Título:** Iniciar uma Delegação de Fiscal de Contrato e ver, na lista de fiscais, apenas colaboradores com o curso obrigatório

**Origem:** FSWTBC-4634 — ao delegar um Fiscal de Contrato apareciam colaboradores **sem** o curso de Fiscal de Contrato. Causa (Protheus,
`UGCTE023.data.tlpp` / `getListagemFiscalContrato`): `IN (?, 'ALL')` com bind param virava `IN ('ALL','ALL')`, anulando o `NOT EXISTS`
dos cursos `RA1_XPERF` FC/FS. Corrigido com string dinâmica `IN ('FC','FS','ALL')` (REC2254).

**Módulo/Rota:** Fluig → processo **Delegação de Fiscais de Contratos e Serviços** (`pageworkflowview?processID=wf_delegacaoFiscalContratoServico`)
→ seção *Identificação do Contrato/Serviço* (**Tipo da Solicitação\*** = Contrato | Serviço | Medição, **Filial Contrato\***, **Número
Contrato\***, **Filial Planilha\***, **Número Planilha\***, **Filial Medição\***) → seção de identificação do fiscal (**Fiscal \***,
**Email do Fiscal \***; input oculto `codFiscal`, texto `nomeFiscal`) · dataset `dsProtheus_getFiscaisPorTipoContrato`.

**Pré-condições**
- Perfil que **escolhe o fiscal** (gestor/fiscal atual); contrato vigente com planilha.
- Dois colaboradores conhecidos: um **com** curso FC/FS válido (`RA1_XPERF`) e um **sem** — cadastro de curso é do RH/Protheus.
- **Bloqueio:** a tela de escolha do fiscal **não foi localizada para a conta de QA** (o formulário abre todo readonly e `nomeFiscal` é
  texto sem zoom); a elegibilidade por curso só é consultável no Protheus.

**Passos**
1. Abrir a Delegação de Fiscais e escolher **Tipo da Solicitação = Contrato**; informar Filial/Número do Contrato.
2. Na etapa em que o fiscal é escolhido, abrir a lista/zoom de fiscais.
3. Em paralelo, chamar `GET /api/public/ecm/dataset/search?datasetId=dsProtheus_getFiscaisPorTipoContrato&filterFields=<filtros da tela>`
   no navegador logado e comparar com a lista renderizada.
4. Procurar o colaborador **sem** curso; procurar o colaborador **com** curso.
5. Repetir com **Tipo da Solicitação = Serviço**.

**Resultado esperado**
- A lista contém apenas colaboradores com curso FC (contrato) / FS (serviço) válido; o colaborador sem curso **não aparece**.
- O dataset devolve o mesmo conjunto da tela (sem `ALL` anulando o filtro).
- Selecionado o fiscal, **Fiscal \*** e **Email do Fiscal \*** são preenchidos.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Colaboradores sem o curso de Fiscal de Contrato listados e selecionáveis na delegação.

**Severidade:** Alta

**Preparação de massa:** contrato vigente + dois colaboradores com/sem curso FC/FS (RH/Protheus); perfil de gestor para a etapa de
escolha. A conta de QA não cobre nenhum dos dois.

**Verificado em tela:** PARCIAL
**O que foi verificado:** processo **"Delegação de  Fiscais de Contrato/Serviço"** (`wf_delegacaoFiscalContratoServico`) ativo no catálogo
(34 processos); formulário em branco **visto renderizado**: 26 rótulos (lista completa acima), combo `tipoSolicitacao=[Contrato|Serviço|Medição]`,
input `codFiscal` (hidden) e `nomeFiscal` (textbox, `data-required="false"`), **nenhum zoom nem dataset referenciado** no HTML/JS publicado
do form 627176; `dsProtheus_getFiscaisPorTipoContrato` **existe** (200 `[]` sem filtro). L029 já havia registrado que nenhum fonte
baixado consome esse dataset e que a etapa de escolha não é alcançável por este login.
**Divergências encontradas:** o ticket chama a tela de "delegação de fiscais"; o nome real é **"Delegação de Fiscais de Contratos e
Serviços"**. O campo do fiscal é **Fiscal \*** (obrigatório no rótulo, `data-required="false"` no HTML). A correção é 100% Protheus
(TLPP) — a superfície Fluig prova só o **efeito** (lista filtrada), não a causa.
**Dados/massa usados:** nenhum — não submetido; formulário aberto em branco e fechado.

---

## CT-FSWTBC-4712  (ambos · Concluído · SDCASSI-447)

**Título:** Cancelar uma SC própria depois de a cotação existir no ERP e conferir que Fluig, cotação e SC do ERP ficam todos cancelados — ou que nada é cancelado.

**Origem:** FSWTBC-4712 — na SC 97223 a cotação foi cancelada no Fluig e no NFC, mas a SC ficou ABERTA no Protheus e a rotina antiga não conseguiu cancelá-la (estado híbrido entre fluxo legado e novo). Corrigido via PR 70065 sem causa documentada.

**Módulo/Rota:** Central de Tarefas → solicitação *Solicitação de Compras* (`wf_solicitacao_compras`) → **Cancelar** (evento `beforeCancelProcess`, que chama o ERP); conferência no **Tracker** (`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`, visões *SC* e *CPS*) e no **Histórico** da solicitação.

**Pré-condições**
- SC criada pelo executor (textos com prefixo `QA`), *Dispensa Cotação* = Não, avançada até a cotação existir no ERP — no Tracker SC a coluna **"Nº da Cotação ERP"** preenchida e *Atividade Atual* = **"Aguarda Finalizar Cotação"** (seq 161, a mesma em que a 97223 foi cancelada).
- Usuário com permissão de cancelar a própria solicitação.
- **Bloqueio:** a conta de QA não leva a SC além da *Validação do Gestor* (não resolve matrícula de comprador — `Y1_USER = "undefined"`); o status da SC no ERP (SC1/MATA110) e a "rotina antiga" de cancelamento **não têm superfície no Fluig** — os passos 8–9 exigem Protheus.

**Passos**
1. Tracker → *Tipo* = SC → **Nº do Processo Fluig** = `<nº da SC de QA>` → **Pesquisar Registro**. Anotar *Nº da Solicitação ERP*, *Nº da Cotação ERP*, *Atividade Atual*.
2. Na linha, clicar no ícone **"Visualizar Solicitação"** (atributo `title`; é o único dos três ícones com nome).
3. Acionar **Cancelar**, informar justificativa iniciada por `QA` e confirmar.
4. Ler a mensagem devolvida pelo Fluig.
5. Tracker SC de novo: *Status* da SC.
6. Tracker → *Tipo* = CPS → **Nº da Cotação** (`txt_nCot_infForn`) = nº anotado → *Status* dos processos de cotação (um por fornecedor).
7. Histórico da SC: procurar o registro do cancelamento e o retorno da integração.
8. *(Protheus)* Compras → Solicitação de Compras (MATA110): situação da SC anotada.
9. *(Protheus)* Compras → Cotação (MATA150/MATA160): situação da cotação.

**Resultado esperado**
- O Fluig só exibe "…no ERP Protheus foi executado com sucesso!" se o ERP respondeu 2xx ao cancelamento; recusa/404 do ERP produz **mensagem de erro** e a SC **continua ABERTA** no Fluig (ver A2-c: hoje um 404 cai no ramo de sucesso).
- Após sucesso: Tracker SC = **CANCELADA**; todos os CPS da cotação = **CANCELADA**; Histórico com o retorno do ERP.
- No ERP a SC e a cotação ficam ambas canceladas/eliminadas por resíduo — nunca "cotação cancelada + SC aberta".
- Ou tudo cancela, ou nada cancela; não existe estado híbrido.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Cotação cancelada no Fluig e no NFC, SC **ABERTA** no Protheus, e "não foi possível cancelar pela rotina antiga".

**Severidade:** Alta

**Preparação de massa:** uma SC de QA com cotação já gerada no ERP, criada pelo próprio executor — exige um usuário com papel de comprador para gerar a cotação (a conta de QA não tem). Não usar SC de terceiros: **não cancelar registro pré-existente**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — Tracker SC, filtro **Nº do Processo Fluig** = 97223: 1 registro, *Status* **CANCELADA**, *Tipo de Solicitação* "Nova Solicitação", *Atividade Atual* **"Aguarda Finalizar Cotação"**, *Responsável Atual* `fluig@cassi.com.br`, **Nº da Cotação ERP = 000013**, *Dispensa Cotação* "Nao", filial 1201; ícones da coluna Ações: `title="Visualizar Solicitação"` + dois ícones sem nome (`flaticon-view`, `flaticon-organogram`). *API* — `requests/97223/tasks`: seq 26 "Aguarda Finalizar Cotação" (estado 161) **CANCELED em 01/07/2026**. Cancelamento **não executado**.
**Divergências encontradas:** no Tracker a SC 97223 tem cotação ERP 000013 mas **"Nº da Solicitação ERP" vazio** — o número da SC que ficou aberta no Protheus não é consultável pelo Fluig. O `beforeCancelProcess` (migrado no SDCASSI-456 para `DELETE /api/v1/fluig/integracao/compras/solicitacao/manutencao/{num}`) é script de servidor — não legível pela conta de QA.
**Dados/massa usados:** SC 97223 (só leitura); nenhum registro criado ou cancelado.

---

## CT-FSWTBC-4804  (ambos · Concluído · SDCASSI-464)

**Título:** Conferir, no dia do disparo automático, que foi aberta uma solicitação de faturamento para cada contrato vigente com medição automática — e que, após uma janela de manutenção, as atrasadas são abertas sem intervenção manual.

**Origem:** FSWTBC-4804 — medições automáticas de junho não foram disparadas; causa: manutenção do dia 20 fez o disparo perder a data prevista e a rotina não reprocessa o que ficou para trás — foi preciso ajustar a data manualmente. Terceira ocorrência do padrão (SDCASSI-288, 327).

**Módulo/Rota:** Tracker visão *FC* — filtros **Data da Solicitação De/Até** (`dataSolicitacaoDeFC` / `dataSolicitacaoAteFC`, formato ISO `aaaa-mm-dd`) e **Solicitante**; **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`). Origem do disparo: schedule do Protheus (UGCTE027) — sem tela no Fluig.

**Pré-condições**
- Lista dos contratos vigentes cujo tipo tem medição automática (`CN1_MEDAUT = "1"` no tipo de contrato) e a periodicidade de cada um.
- **Bloqueio:** o disparo é um schedule do Protheus, não acionável pela conta de QA; a "planilha de contratos vigentes" do cliente não está disponível — sem ela o passo 3 não fecha.

**Passos**
1. Tracker → FC → **Data da Solicitação De** = **Até** = data do disparo → **Solicitante** = "Usuário Integrador" → **Pesquisar Registro**.
2. Anotar o total ("Mostrando de 1 até N de N registros") e a coluna **Nº Contrato** de cada linha.
3. Acompanhamento de Contratos → filtrar *Status* Vigente e tipo com medição automática → listar os contratos com medição prevista no período.
4. Comparar as duas listas.
5. Para cada FC encontrada: *Atividade Atual* = "Realizar Medição do Contrato", **Competência do Contrato** = mês corrente.
6. Cenário de manutenção: se o dia do disparo caiu em janela de manutenção, repetir 1–4 nos dias seguintes.

**Resultado esperado**
- Cada contrato da lista do passo 3 tem exatamente **uma** FC aberta pelo "Usuário Integrador" no período; nenhum contrato sem FC.
- Após manutenção, as FC atrasadas aparecem nos dias seguintes **sem** ajuste manual de data.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Nenhuma FC do Integrador para os contratos sinalizados; medições só geradas após "ajuste da data para o dia atual".

**Severidade:** Alta

**Preparação de massa:** lista de contratos vigentes com medição automática e periodicidade (planilha do cliente ou consulta CN9/CN1 no ERP); nenhuma criação de massa.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — Tracker FC, período **01/06–05/07/2026**: **1.272 registros**; FC do "Usuário Integrador" por dia: 01/06 **230**, 02/06 6, 05/06 52, 08/06 60, 09/06 22, 10/06 35, 18/06 29, 23/06 6, 26/06 66, 01/07 **251**, 05/07 57 (entre outros) — o disparo de 01/06 aconteceu e houve disparos parciais ao longo do mês. Hoje (08/09): 253 FC abertas, 241 em "Realizar Medição do Contrato" — o lote de setembro foi aberto. Os campos de data são `<input type="date">` e só aceitam ISO; o id **muda por visão** (`dataSolicitacaoDeFC` na FC; `dataSolicitacaoDeSC` na SC) — errar o id não filtra e não avisa. *API (GET search)* — `dsProtheus_getTipoContratos_restGetAll` expõe `CN1_MEDAUT` ("1" no 1º registro).
**Divergências encontradas:** sem a planilha do cliente não dá para saber **quais** contratos ficaram sem medição em junho — no Tracker o mês tem 1.272 FC, não "zero"; o defeito era por contrato, não global. O ticket cita "manutenção do dia 20": no Tracker há 2 FC do Integrador em 21/06 e 3 em 22/06, 29 em 18/06 e 66 em 26/06 — coerente com um disparo recuperado em 26/06.
**Dados/massa usados:** Tracker FC junho/julho (só leitura).

---

## CT-FSWTBC-4816  (ambos · Concluído · SDCASSI-467)

**Título:** Consultar no widget Logs Protheus a fila de medições e conferir que nenhuma medição está com erro de desserialização (JsonMappingException) nem presa sem status.

**Origem:** FSWTBC-4816 — medições 103459 e 103461 paradas na fila com a ZZZ registrando `com.fasterxml.jackson.databind.JsonMappingException` — assinatura do JSON de erro grande demais (SDCASSI-450). Encerrado por correção pontual; a correção de fundo veio pelo 450 (15/07).

**Módulo/Rota:** `/portal/p/1/portal_logs_protheus` → aba **Medicoes ZZZ** (filtros **ID Fluig, Filial, Contrato, Status, Data inicial, Data final**); Tracker visão *FC*.

**Pré-condições**
- FC enviadas ao ERP no período consultado.
- **Bloqueio:** o `genericQuery` do widget responde 404 hoje — instabilidade de ambiente (A11-b: o widget não distingue erro de vazio).

**Passos**
1. Abrir o widget → aba **Medicoes ZZZ** → informar **Data inicial/Data final** do último mês → consultar.
2. Confirmar que a grade carrega (não permanece em "Consultando logs...").
3. Filtrar **Status** = erro; ler a coluna **Msg Medicao** de cada linha.
4. Para cada **ID Fluig** com erro: Tracker FC → **Nº do Processo Fluig** → *Atividade Atual*.
5. Para as FC em "Aguarda processamento Fila Protheus": comparar *Data/Hora da Solicitação* com o horário atual.

**Resultado esperado**
- Grade carrega; se não houver dados, "Nenhum registro encontrado." (nunca "Consultando logs..." indefinido).
- **Msg Medicao** contém mensagem de negócio do ERP (ex.: saldo), nunca `JsonMappingException` nem texto vazio.
- Toda FC com erro na ZZZ está em **Correção** no Fluig, com responsável de grupo; nenhuma FC fica em "Aguarda processamento Fila Protheus" por mais de alguns minutos (SLA real ~7 min).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- ZZZ com `com.fasterxml.jackson.databind.JsonMappingException`; processos 103459/103461 parados na fila.

**Severidade:** Alta

**Preparação de massa:** nenhuma — consulta passiva sobre a fila; para provocar erro, ver CT-FSWTBC-4759.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — widget abre (título "Cassi - Fluig Plataforma - Logs protheus"); abas **Erros CV8 / Solicitacoes ZZY / Medicoes ZZZ**; filtros da ZZZ renderizados (`zzz-ifluig, zzz-filial, zzz-contrato, zzz-status, zzz-data-inicial, zzz-data-final, page-size`) e da ZZY (`zzy-filial, zzy-chave, zzy-rotina, zzy-status, …`); grade presa em **"Consultando logs..."** nas duas abas, com **404** em `/java_generico_protheus/tbc/api/framework/v1/genericQuery?FilialFilter=false&DeletedFilter=false&tables=Z…`. *Lido no fonte publicado* — `ZZZController`: colunas Filial, ID Fluig, Contrato, Revisao, Filial Medic, Num Med, Status, Data Recb Me, Hora Rec Med, Data Trat Me, Hora Eft Med, Json Medicao, Msg Medicao; `ZZYController`: … **Qtd T.Env Fl** (contador de retry), Msg Ret Flui, Json Env Flg, Json Retorno, Status Fluig, Status Proth. *API* — 103459 e 103461: seq 8 "Aguarda processamento Fila Protheus" **CANCELED em 24/06/2026** (as do ticket foram canceladas, não reprocessadas); 111973/111977/111980 continuam na fila hoje.
**Divergências encontradas:** este caso **reprova hoje**: 3 FC presas há 22–25 dias (A16) e a superfície de diagnóstico indisponível. A aba "Erros CV8" não respondeu ao clique em 10 s na sonda (não conclusivo). O widget não tem coluna para o campo novo da ZZZ (mensagem completa).
**Dados/massa usados:** FC 103459/103461/111973/111977/111980 (só leitura).

---

## CT-FSWTBC-4820  (fluig · Concluído · SDCASSI-469)

**Título:** Consultar um contrato no painel de Acompanhamento e conferir que os dados da planilha vinculada são carregados.

**Origem:** FSWTBC-4820 — "Dados da planilha não são carregados na rotina de Acompanhamento de
Contratos": a planilha vinculada ao contrato não abria com dados, impedindo a consulta durante o
acompanhamento.

**Módulo/Rota:** **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) → coluna
**Ação** → ícone `title="Planilha"` → modal **Informações da Planilha** → grade *Planilhas do
Contrato* → ícone `title="Detalhes da Planilha"` → modal **Detalhes da Planilha**.

**Pré-condições**
- Usuário no grupo `G.P.Acompanhamento_Renovacao_Contratos` (ou no `…_admin`).
- Um contrato que **tenha planilha** cadastrada no Protheus.
- Integração com o Protheus no ar (as duas grades vêm de dataset REST do ERP).
- **Bloqueio:** nenhum.

**Passos**
1. Abrir *Acompanhamento de Contratos* e aguardar a grade carregar.
2. Escolher um contrato qualquer da grade e clicar no ícone **Planilha** da coluna *Ação*.
3. No modal **Informações da Planilha**, conferir que a grade *Planilhas do Contrato* traz pelo
   menos uma linha e que as colunas estão preenchidas.
4. Clicar no ícone **Detalhes da Planilha** da primeira linha.
5. No modal **Detalhes da Planilha**, percorrer as seções e conferir que os campos vêm com valor —
   não com o modal vazio nem com todos os campos em `-`.
6. Fechar os dois modais sem alterar nada.

**Resultado esperado**
- O modal **Informações da Planilha** abre com a seção **Planilhas do Contrato** e a grade
  `tablePlanilhas` populada, com as colunas **Filial · Contrato · Planilha · Revisão · Cod.
  Fornecedor · Fornecedor · Loja Forn. · Ações**.
- Cada linha tem a ação **Detalhes da Planilha**.
- O modal **Detalhes da Planilha** abre com as seções **Dados Gerais da Planilha**, **Fornecedor**,
  **Datas**, **Valores Financeiros**, **Periodicidade e Recorrência**, **Reajustes** e **Outros**, e
  os campos trazem os valores do contrato — número da planilha, tipo, natureza, datas de início e
  fim, valor total.
- Valores monetários aparecem formatados em real (`R$ 1.234,56`) e datas em `dd/mm/aaaa`.
- Quando o contrato realmente não tem planilha, o comportamento correto **não** é modal vazio e sim o
  aviso **"Nenhuma planilha encontrada para este contrato"**; e, quando a consulta do detalhe não
  acha registro, **"Nenhum dado encontrado para esta planilha"**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Os dados da planilha não carregam na rotina de acompanhamento: a consulta abre sem trazer
  informação alguma. O ticket não registra mensagem de erro — só o print da tela sem dados.

**Severidade:** Média — sem a planilha carregada (itens, quantidades, saldos), a tela de
acompanhamento perde a função e obriga a consultar o ERP.

**Preparação de massa:** um contrato com planilha cadastrada no Protheus. Já existe na base — o
contrato `0000-2025-2501-` (filial 2501, tipo `017 - DEDETIZACAO`) tem **2 planilhas**.

**Verificado em tela:** SIM (total)
**O que foi verificado:** **Visto renderizado** — no contrato `0000-2025-2501-` o ícone **Planilha**
abriu o modal **"Informações da Planilha"**, seção *Planilhas do Contrato*, com a grade
`tablePlanilhas` trazendo **2 linhas** (primeira: filial `2501`, contrato `0000-2025-2501-`, planilha
`000001`, cod. fornecedor `26628497`, loja `0001`) e a ação **Detalhes da Planilha** por linha. O
detalhe abriu com **50 campos em 8 seções**, todos preenchidos a partir do contrato — entre eles
*Numero da Planilha* `000001`, *Tipo da Planilha* `001`, *Natureza da Planilha* `2040101`, *Rateio?*
`2`, *Data Inicial* `01/04/2022`, *Data Final* `31/03/2025`, *Valor Total* `R$ 287,36`, *Pagamento
Antecipado* `R$ 2,00`, *Numero do Cronograma* `000010`. **Lido no fonte publicado**: a lista vem de
`dsProtheus_getInformaPlanxContrato_restGetAll` (constraints `CorporateId=01`, `BranchId`/`CN9_FILIAL`,
`CN9_NUMERO`, `CN9_REVISA`) e o detalhe de `dsProtheus_getPlanilha_restGetAll` (acrescentando
`CNA_NUMERO` e `CNA_REVISA`); as duas mensagens de vazio citadas acima estão no mesmo fonte.
**Divergências encontradas:** uma, e é achado. Na grade *Planilhas do Contrato* a coluna
**"Fornecedor"** (`A2_NOME`) veio **vazia** nas duas linhas, embora o código (`26628497`) e a loja
(`0001`) estejam lá — e embora, **dentro** do modal *Detalhes da Planilha*, o campo *Nome Fornecedor*
resolva corretamente para `ANA CARLA LEAL VELOSO E SILVA`. Ou seja: o nome do fornecedor é buscado no
detalhe, mas não é preenchido na listagem. É a mesma classe de defeito do SDCASSI-504 — dado presente
num ponto da tela e ausente no equivalente. Vale abrir item próprio.
**Dados/massa usados:** contrato pré-existente `0000-2025-2501-` (filial 2501), aberto **em leitura**;
nada foi alterado.

---

## CT-FSWTBC-4822  (ambos · Concluído · SDCASSI-470)

**Título:** Abrir uma SC de Aditivo Contratual / Nova Contratação e conferir que os campos do contrato aparecem preenchidos na abertura e na Validação do Gestor.

**Origem:** FSWTBC-4822 — os campos do contrato não eram exibidos na abertura da SC / Validação do Gestor. Encerrado por escopo ("pertence à DEM10015026"), sem correção registrada; o cliente postou "Item homologado!" duas semanas depois.

**Módulo/Rota:** Central de Tarefas → Iniciar Solicitação → *Solicitação de Compras* (`wf_solicitacao_compras`, form 256831) → combo **Tipo de Solicitação** (opções *Selecione... / Aditivo Contratual / Nova Contratação*) → bloco de contrato (`rowContractMonitoring`): **Número do Contrato**, **Revisão do Contrato**, **Fornecedor Contrato \***, **CNPJ/CPF Forn. Contrato \***, **Haverá suplementação de contrato? \*** (`rowSupplementaryContract`); atividade **Validação do Gestor** (7); Tracker SC colunas **Tipo de Solicitação / Número do Contrato / Revisão do Contrato / Fornecedor Contrato / CNPJ/CPF Forn. Contrato**.

**Pré-condições**
- Contrato vigente descoberto em tempo de execução (Acompanhamento de Contratos) — não fixar número.
- Usuário gestor para a Validação do Gestor.
- **Bloqueio:** não há credencial de gestor; a sonda em modo leitura não consegue medir visibilidade (o frame do formulário reporta todos os elementos ocultos, inclusive o combo *Tipo de Solicitação*) — a verificação de "exibido" precisa de olho humano.

**Passos**
1. Iniciar Solicitação de Compras; em **Tipo de Solicitação** escolher *Aditivo Contratual*.
2. Selecionar o contrato (zoom): conferir que **Número do Contrato**, **Revisão do Contrato**, **Fornecedor Contrato**, **CNPJ/CPF Forn. Contrato** aparecem preenchidos e **Haverá suplementação de contrato?** é exibido.
3. Trocar para *Nova Contratação* e repetir a observação.
4. Salvar/enviar a SC (opcional; com `QA` no texto).
5. Como gestor, abrir a tarefa **Validação do Gestor**: os mesmos campos visíveis e preenchidos, somente leitura.
6. Tracker SC → **Nº do Processo Fluig**: as colunas de contrato preenchidas.

**Resultado esperado**
- Com *Aditivo Contratual*/*Nova Contratação*, o bloco de contrato é **visível** na abertura e na Validação do Gestor, com os valores do contrato escolhido.
- Com *Tipo de Compra* = Pedido, os campos não aparecem (regra: só sob `tipoCompra === "2"` e fora de solicitação centralizada).
- Tracker mostra os mesmos valores.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Campos do contrato ausentes na abertura da SC / Validação do Gestor.

**Severidade:** Média

**Preparação de massa:** contrato vigente existente (leitura); usuário gestor para o passo 5. Não é preciso criar SC — a SC 112830 já está em Validação do Gestor com contrato.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Lido no fonte publicado* — `form_sc.html` contém os cinco rótulos acima em `rowContractMonitoring`/`rowSupplementaryContract`, e `sc_inline.js` os oculta no `hideFields([...])` da carga inicial (a regra que os exibe está em script não baixado). *API/formulário em modo leitura* — SC **112830** (Validação do Gestor, *Tipo de Solicitação* = **Aditivo Contratual**, *Tipo de Compra* (`buyerTipoCompra`) = **Contrato** `"2"`): os campos **estão preenchidos** — Número do Contrato `6155-2025-5303`, Revisão `010`, Fornecedor Contrato `FORTLINE INDUSTRIA E COMERCIO DE MOVEIS LTDA`, CNPJ `08368875000152`, Haverá suplementação = `Sim`; o dado chega ao formulário. Tracker SC 112830: *Tipo* "Aditivo Contratual", Número do Contrato 6155-2025-5303, Revisão 010, Fornecedor FORTLINE, CNPJ 08368875000152. **Visibilidade não medida** (ver Bloqueio).
**Divergências encontradas:** (1) SC **113196** (em Correção): o formulário tem *Tipo de Solicitação* = "Aditivo Contratual" e `buyerTipoCompra` = Pedido, com os campos de contrato **vazios**, e o Tracker exibe **Tipo de Solicitação = `null`** (a string) — dado inconsistente renderizado como "null". (2) Tracker SC lista a 112830 em **duas linhas** (uma por responsável: Pool e usuário). (3) O briefing diz "Nova Contratação" para o tipo; confirmado: as opções são *Aditivo Contratual* e *Nova Contratação*.
**Dados/massa usados:** SC 112830 e 113196 (só leitura).

---

## CT-FSWTBC-4827  (fluig · Concluído · SDCASSI-475)

**Título:** Confirmar que quem está no grupo administrativo enxerga todos os contratos da base, e quem não está continua vendo só os seus.

**Origem:** FSWTBC-4827 — "Disponibilizar consulta de contratos para gestão sem vínculo com usuário":
o filtro por fiscal (`CN9_XFISCA`), correto para o fiscal, inviabilizava a visão gerencial. A solução
foi criar um grupo cujos membros veem todos os contratos, mantendo a restrição como padrão.

**Módulo/Rota:** **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`).

**Pré-condições**
- Um usuário **A** membro de `G.P.Acompanhamento_Renovacao_contratos_admin` (visão de gestão).
- Um usuário **B** membro apenas de `G.P.Acompanhamento_Renovacao_Contratos` (visão de fiscal), que
  seja fiscal de pelo menos um contrato.
- Um usuário **C** fora dos dois grupos.
- **Bloqueio:** parcial. Só há uma credencial nesta rodada, e ela está **nos dois** grupos — logo, os
  cenários B e C não foram executados em tela. Depende do administrador do Fluig conceder logins de
  teste com as três composições de grupo.

**Passos**
1. Autenticar com o usuário **A** e abrir *Acompanhamento de Contratos*. Anotar o total de linhas.
2. Escolher na grade um contrato cujo **Fiscal de Contrato** (visível em *Informações do Contrato*)
   seja outra pessoa — a visão de gestão deve trazê-lo normalmente.
3. Autenticar com o usuário **B** e abrir a mesma tela. Anotar o total de linhas.
4. Conferir, abrindo *Informações do Contrato* em algumas linhas, que **todos** os contratos listados
   para B têm B como Fiscal de Contrato.
5. Conferir que o contrato anotado no passo 2 **não** aparece para B.
6. Autenticar com o usuário **C** e abrir a mesma tela.

**Resultado esperado**
- **A (gestão)** vê **todos** os contratos da base, independentemente de ser fiscal, e o total é
  sensivelmente maior que o de B.
- **B (fiscal)** vê **apenas** os contratos em que é o fiscal — a restrição continua sendo o padrão.
- **C (sem grupo)** não vê a grade: o painel exibe o aviso **"Você não possui permissão para acessar
  o Acompanhamento de Contratos."** e um toast **"Acesso negado — Você não possui permissão para
  acessar este painel."**
- Falha de rede ao validar a permissão **não** é confundida com ausência de permissão: nesse caso a
  mensagem é **"Falha ao validar suas permissões. Recarregue a página; se persistir, contate o
  suporte."**
- A visão ampla é **privilégio de grupo**, nunca o padrão: tirar o usuário do grupo administrativo
  devolve a visão restrita.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A área de gestão vendo **apenas os contratos em que o próprio usuário é fiscal**, sem caminho para
  a visão completa da base — o que era a limitação relatada na abertura do chamado.

**Severidade:** Alta — o grupo dá **visão irrestrita de todos os contratos**. Errar para mais é
exposição indevida de dado contratual; errar para menos cega a gestão. O próprio ticket registra que
não há critério documentado de concessão nem registro de quem foi incluído.

**Preparação de massa:** três logins com as composições de grupo descritas — só o administrador do
Fluig pode montá-los. Nenhum dado de contrato precisa ser criado.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **Visto renderizado** — com a conta `TOTVS-FS` a grade trouxe **845
contratos**, de dezenas de filiais e de fiscais diversos (inclusive contratos cujo Fiscal de Contrato
é `Andre Yuji Tamaoki Hirata`, que não é a conta autenticada). Consultando o dataset `colleagueGroup`
para a própria matrícula, confirmou-se que a conta pertence **aos dois** grupos —
`G.P.Acompanhamento_Renovacao_Contratos` e `G.P.Acompanhamento_Renovacao_contratos_admin` —, o que
explica sem defeito por que ela enxerga a base inteira. O grupo administrativo **existe e tem 6
membros**. **Lido no fonte publicado**: `allowedGroups = ['G.P.Acompanhamento_Renovacao_Contratos',
'G.P.Acompanhamento_Renovacao_contratos_admin']` e `adminGroups =
['G.P.Acompanhamento_Renovacao_contratos_admin']`; `hasAccess()` consulta `colleagueGroup` pela
matrícula, liga `isAdmin` quando encontra o grupo administrativo, e `searchRecords()` bifurca —
`loadContratosPage` direto (vê tudo) para admin, `loadContratosDoFiscal` para os demais. As duas
mensagens de negação e a de falha de validação citadas acima estão em `renderAccessDenied` e
`renderAccessError`. As visões de fiscal e de não-membro **não** foram exercitadas por falta de
credencial.
**Divergências encontradas:** nenhuma quanto ao nome do grupo — `G.P.Acompanhamento_Renovacao_contratos_admin`
existe exatamente como o ticket registra (atenção ao "contratos" minúsculo no fim, ao contrário do
`_Contratos` do grupo padrão).
**Dados/massa usados:** nenhum — apenas leitura da grade e consulta de grupos da própria conta.

---

## CT-FSWTBC-4898  (fluig · Concluído · SDCASSI-486)

**Título:** Acionar os três ícones da coluna Ação do Acompanhamento de Contratos e conferir que cada um abre a tela que promete.

**Origem:** FSWTBC-4898 — "Botão de ações não abre as informações da planilha": ao acionar a
funcionalidade na coluna de ações do Acompanhamento de Contratos, nenhuma informação era carregada.

**Módulo/Rota:** **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`), coluna
**Ação** da grade.

**Pré-condições**
- Usuário no grupo `G.P.Acompanhamento_Renovacao_Contratos` (ou no `…_admin`).
- Pelo menos um contrato na grade; para o ícone *Solicitação de Compra*, um contrato **Vigente** com
  itens de planilha.
- **Bloqueio:** nenhum para os dois primeiros ícones. O terceiro (*Solicitação de Compra*) pode ser
  aberto e criticado sem submeter — **não conclua a solicitação** para não gerar processo.

**Passos**
1. Abrir *Acompanhamento de Contratos* e aguardar a grade carregar.
2. Passar o mouse sobre os três ícones da coluna **Ação** de uma linha e ler o `title` de cada um —
   eles são âncoras sem texto e sem nome acessível, o `title` é o único rótulo.
3. Clicar no ícone **Planilha** e conferir que o modal **Informações da Planilha** abre com conteúdo.
   Fechar.
4. Clicar no ícone **Informações do Contrato** e conferir que o modal **Informações Complementares do
   Contrato** abre com conteúdo. Fechar.
5. Clicar no ícone **Solicitação de Compra** e conferir que o modal **Solicitação de Compra** abre
   com os campos do formulário. Fechar **sem confirmar**.
6. Repetir os passos 3 a 5 em uma segunda linha, para descartar que só a primeira funciona.

**Resultado esperado**
- Os três ícones existem em **toda** linha da grade e trazem os `title` **"Planilha"**,
  **"Solicitação de Compra"** e **"Informações do Contrato"**, nessa ordem.
- **Planilha** abre o modal *Informações da Planilha*, com a grade *Planilhas do Contrato* populada —
  nunca um modal em branco.
- **Informações do Contrato** abre o modal *Informações Complementares do Contrato*, com as nove
  seções e os campos preenchidos.
- **Solicitação de Compra** abre o modal *Solicitação de Compra* com *Tipo de Solicitação*,
  *Contrato* (já preenchido com o número da linha), *Data de Necessidade* e *Motivo da Solicitação*.
- Cada modal tem o botão **Fechar** e fecha sem efeito colateral.
- O comportamento é idêntico em qualquer linha, não só na primeira.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O botão de ações não exibe as informações da planilha: aciona-se a funcionalidade e **nenhuma
  informação é carregada** — modal vazio ou nada acontece. O ticket não registra mensagem de erro.

**Severidade:** Média — sem a ação, não há como consultar os itens da planilha pelo portal.

**Preparação de massa:** nenhuma. A base já tem 845 contratos na grade.

**Verificado em tela:** SIM (total)
**O que foi verificado:** **Visto renderizado** — os três ícones da coluna *Ação* são âncoras vazias
(`<a href="#" class="flaticon …">`) **sem texto e sem `aria-label`**, com os `title` exatos
**"Planilha"**, **"Solicitação de Compra"** e **"Informações do Contrato"**. Os três foram acionados
e os três abriram: *Informações da Planilha* (grade com 2 linhas), *Informações Complementares do
Contrato* (103 campos em 9 seções) e *Solicitação de Compra* (4 campos + **Confirmar**/**Fechar**).
**Lido no fonte publicado**: os handlers são delegados em `generalEvents` pelas classes
`.btn-open-planilha`, `.btn-solicitacao-compra` e `.btn-info-contrato`, e cada um lê a linha por
`that.tableRecords.row($(this).parents('tr')).data()` — o que explica por que a ação depende da linha
estar no índice do DataTables.
**Divergências encontradas:** nenhuma quanto ao defeito. Registro operacional para quem for
automatizar: os ícones **não têm nome acessível**; `getByRole('link', { name })` não os encontra, o
gancho estável é o atributo `title`.
**Dados/massa usados:** contratos pré-existentes `0000-2025-2501-` e `000000000000001`, abertos em
leitura. O modal *Solicitação de Compra* foi aberto e fechado **sem confirmar**.

---

## CT-FSWTBC-4899  (ambos · Concluído · SDCASSI-485)

**Título:** Conferir que o Status exibido no Acompanhamento de Contratos é o mesmo do Protheus para um contrato dado

**Origem:** FSWTBC-4899 — contrato 00160-2022-5303 com status no Portal diferente do registrado no Protheus (CN9); corrigido em 13/07 sem causa registrada.

**Módulo/Rota:** `/portal/p/1/acompanhamentoContrato` → grade (*Filial, Tipo Contrato, Contrato, Data Inicio, Data Fim, Nº Revisão, **Status**, Fornecedor, Ação*) → ícone `title="Informações do Contrato"` → modal **Informações Complementares do Contrato** → *Dados Gerais → Status* e *Datas → Data do Ultimo Status*

**Pré-condições**
- Contrato cujo status no ERP seja conhecido (leitura em Protheus → Gestão de Contratos → *Contratos*, campo *Situação* CN9_SITUAC) — ou, sem Protheus, um contrato com *Data Fim* vencida, cujo status coerente é *Finalizado/Encerrado*.
- **Bloqueio:** o contrato **00160-2022-5303 não está na grade hoje** (845 registros, filtro da coluna *Contrato* sem retorno). Sem Protheus, o status "verdadeiro" só é inferível pelas datas.

**Passos**
1. Abrir *Acompanhamento de Contratos*; aguardar *"Mostrando de 1 até N de N registros"*.
2. No filtro da coluna *Contrato*, digitar o número; ler *Status*, *Data Inicio*, *Data Fim*, *Nº Revisão*.
3. Clicar no ícone *Informações do Contrato* da linha; ler *Status* e *Data do Ultimo Status*, *Data da Sit. Alter. p Vig*.
4. Listar os valores distintos da coluna *Status* na grade (sem filtro).
5. (Protheus) Comparar com *Situação* do contrato na revisão vigente.

**Resultado esperado**
- Passo 2 e 3: o mesmo status na grade e no modal, **por extenso** (ex.: *Vigente*, *Finalizado*, *Paralisado*, *Solicitação de Finalização*, *Cancelado*).
- Contrato com *Data Fim* anterior a hoje **não** aparece como *Vigente*.
- Passo 5: o status do Portal é o do CN9 da revisão vigente; *Data do Ultimo Status* bate com a data da alteração no ERP.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Portal mostrando um status que o Protheus não tem para o contrato (prints lado a lado do relato original).

**Severidade:** Alta

**Preparação de massa:** contrato com status conhecido no ERP; para o cenário de data, **00067-2023-5303 já serve** (Data Fim 31/07/2026, Status Vigente).

**Verificado em tela:** PARCIAL
**O que foi verificado:** grade com **845 contratos**; filtro por coluna funcionando (achou 00050-2026-5303 e 00067-2023-5303); modal *Informações Complementares do Contrato* aberto para os dois com *Status: Vigente*, *Data do Ultimo Status: 07/08/2026* (00050) e *Data da Revisão: 20/05/2026 / Revisão: 001* (00067); valores distintos da coluna *Status* hoje: `Finali`, `Vigente`, `Paralisa`, `Sol.Finali`, `Cancel.`.
**Divergências encontradas:** (1) **00160-2022-5303 ausente da grade** — massa do ticket indisponível; (2) a coluna *Status* da grade exibe **valores truncados/abreviados** (`Finali`, `Paralisa`, `Sol.Finali`, `Cancel.`) enquanto o modal escreve por extenso; (3) **00067-2023-5303 continua *Vigente* com Data Fim 31/07/2026** (A11) — a consulta usa só `CN9_SITUAC`, sem olhar data.
**Dados/massa usados:** leitura de 00050-2026-5303 e 00067-2023-5303 — nada alterado.

---

## CT-FSWTBC-4900  (fluig · Concluído · SDCASSI-487)

**Título:** Confirmar que o fiscal vê no Portal de Acompanhamento exatamente os contratos em que ele é o fiscal — nem menos, nem os de outros fiscais.

**Origem:** FSWTBC-4900 — aberto como "contratos do fiscal Andre Yuji não estão sendo refletidos no
Portal de Acompanhamento". Ao verificar, o desenvolvedor acessou com o próprio usuário e os contratos
apareciam; pedido o detalhamento, o cliente reformulou e o problema real era o **inverso**: o portal
exibia contratos de **outros** fiscais (exemplo citado: `00002-2024-3516`). Não era ausência de dado,
era **vazamento de escopo**.

**Módulo/Rota:** **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`).

**Pré-condições**
- Usuário **fiscal**, membro de `G.P.Acompanhamento_Renovacao_Contratos` e **fora** de
  `G.P.Acompanhamento_Renovacao_contratos_admin`, com e-mail no Fluig **idêntico** ao gravado em
  `CN9_XFISCA` no contrato.
- Pelo menos dois contratos em que ele é fiscal e pelo menos um contrato de **outro** fiscal, para
  servir de controle negativo.
- **Bloqueio:** sim, para a asserção principal. A única credencial disponível está no grupo
  **administrativo**, e por desenho enxerga todos os contratos — logo, não é possível exercitar a
  visão restrita nesta rodada. Depende do administrador do Fluig fornecer um login só-fiscal.

**Passos**
1. Autenticar com o usuário fiscal e abrir *Acompanhamento de Contratos*.
2. Anotar o total de linhas e listar os números de contrato exibidos.
3. Para **cada** contrato listado, abrir **Informações do Contrato** e conferir o campo **Fiscal de
   Contrato**.
4. Confirmar que **em todas as linhas** o Fiscal de Contrato é o próprio usuário autenticado.
5. Na caixa **Pesquisar**, procurar o número de um contrato **de outro fiscal** (controle negativo) e
   confirmar que o resultado é **"Nenhum registro encontrado"**.
6. Repetir o passo 5 com o número `00002-2024-3516`, citado no ticket.
7. Conferir que o mesmo escopo vale nas telas derivadas: os modais *Planilha*, *Informações do
   Contrato* e *Solicitação de Compra* só abrem para contratos da própria lista.

**Resultado esperado**
- Todo contrato exibido tem o usuário autenticado como **Fiscal de Contrato** — sem exceção.
- Nenhum contrato de outro fiscal aparece na grade, nem pela busca.
- Contratos em que o usuário É fiscal aparecem todos — o escopo não erra para menos.
- A comparação de e-mail é **indiferente a maiúsculas/minúsculas**: fiscal cujo `CN9_XFISCA` esteja
  gravado em caixa diferente da do cadastro Fluig continua vendo seus contratos.
- Cada contrato aparece **uma única vez**, na sua **última revisão**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O portal exibindo contratos de **outros fiscais** para o usuário autenticado — o ticket cita o
  contrato **`00002-2024-3516`** como exemplo do vazamento. O sintoma inverso (contratos do fiscal
  ausentes) foi verificado na abertura e **não** se confirmou.

**Severidade:** Alta — é acesso indevido a dado contratual de outra área, não mera falha de listagem.

**Preparação de massa:** um login de fiscal (fora do grupo admin) com dois ou mais contratos sob sua
responsabilidade, e o número de um contrato de outro fiscal para o controle negativo. Só o
administrador do Fluig monta o login; os contratos já existem na base.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **Visto renderizado** — a conta `TOTVS-FS` lista **845 contratos**, entre
eles contratos cujo **Fiscal de Contrato** é `Andre Yuji Tamaoki Hirata
(andre.thirata@cassi.com.br)` — justamente o fiscal do ticket. Isso **não** é o vazamento relatado: a
conta está em `G.P.Acompanhamento_Renovacao_contratos_admin` (confirmado no dataset `colleagueGroup`),
e a visão irrestrita é o comportamento correto do perfil administrativo. A restrição por fiscal não
pôde ser exercitada em tela. **Lido no fonte publicado**, a proteção hoje é **dupla**, e é exatamente
essa redundância que o caso precisa preservar: (1) o servidor recebe a constraint
`{ _field: 'CN9_XFISCA', _initialValue: userEmail, _type: 1 }` em `loadContratosDoFiscal`, e
(2) o cliente **refaz** a checagem em `processContratosResult`, filtrando com
`record.CN9_XFISCA.toLowerCase() === userEmail.toLowerCase()` — daí a indiferença a
maiúsculas/minúsculas. Se o e-mail do usuário vier vazio, a lista sai **vazia** em vez de sair
completa, que é a decisão segura. Antes disso, `processContratosResult` reduz o resultado à **maior
`CN9_REVISA` por `CN9_NUMERO`**, o que sustenta a asserção de "uma linha por contrato". A bifurcação
`if (that.isAdmin) … else loadContratosDoFiscal(…)` em `searchRecords` é o que separa os dois perfis.
**Divergências encontradas:** uma, no enunciado do ticket. O título diz que os contratos do fiscal
**não** eram refletidos; o defeito efetivamente corrigido foi o oposto — contratos de **outros**
fiscais sendo exibidos. Quem executar o caso deve testar a direção certa: o controle negativo
(passo 5) é o passo que importa.
**Dados/massa usados:** nenhum — apenas leitura.

---

## CT-FSWTBC-4945  (fluig · Concluído · SDCASSI-494)

**Título:** Abrir uma Solicitação de Compras de Nova Contratação a partir de um contrato e conferir que ela chega à caixa do solicitante, em vez de ficar paralisada.

**Origem:** FSWTBC-4945 — "Erro ao iniciar uma SC – Nova Solicitação de Contrato fica paralisada": o
processo travava na partida, impedindo a contratação por esse caminho. O ciclo teve uma falsa
partida: o cliente reportou "correção não refletida" testando sobre instâncias **já travadas antes**
da correção; reabertas, as mesmas solicitações haviam normalizado.

**Módulo/Rota:** **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) → coluna
**Ação** → ícone `title="Solicitação de Compra"` → modal **Solicitação de Compra** → combo **Tipo de
Solicitação = Nova Contratação** → **Confirmar**.

**Pré-condições**
- Usuário no grupo `G.P.Acompanhamento_Renovacao_Contratos` (ou `…_admin`) e com direito de abrir SC.
- Um contrato **Vigente** com **itens de planilha** cadastrados — sem itens a solicitação não é
  enviada.
- Os rateios dos itens precisam ter **centro de custo** e **classe de valor** resolvíveis.
- **Bloqueio:** parcial. Concluir o caso **cria um processo** na base. Nesta rodada o modal foi
  aberto e a crítica de obrigatórios exercitada, mas **a solicitação não foi confirmada** — os passos
  6 a 9 ficam para quem tiver autorização de gerar massa.

**Passos**
1. Abrir *Acompanhamento de Contratos* e filtrar a coluna **Status** por `Vigente`.
2. Numa linha, clicar no ícone **Solicitação de Compra**.
3. Conferir que o modal abre já com **Contrato** preenchido com o número da linha.
4. Clicar em **Confirmar** com os campos vazios e observar a crítica de obrigatórios — **sem
   prosseguir**.
5. Preencher **Tipo de Solicitação = Nova Contratação**, **Motivo da Solicitação** (usar prefixo
   `QA`) e **Data de Necessidade** (o campo é `input type="date"`: informar em `aaaa-mm-dd`).
6. Clicar em **Confirmar** e aguardar.
7. Anotar o número do processo informado na mensagem de sucesso.
8. Abrir a **Central de Tarefas → Tarefas a concluir** e localizar a solicitação recém-criada.
9. Abrir o **histórico** da solicitação e conferir a etapa corrente e o responsável.
10. Repetir os passos 5 a 9 com **Tipo de Solicitação = Aditivo Contratual**.

**Resultado esperado**
- Com os obrigatórios vazios, o **Confirmar** exibe **"Campos Obrigatórios — Por favor, preencha:
  Tipo de Solicitação, Motivo da Solicitação, Data de Necessidade"** e **não** inicia processo algum.
- Com os campos preenchidos, aparece **"Processo `<número>` iniciado com sucesso!"**.
- A solicitação **chega à Central de Tarefas do usuário que a criou**, editável — não fica parada sem
  dono.
- O responsável da etapa corrente é o **próprio solicitante**, nunca a conta de integração
  `consumerkeycompras`.
- Os campos herdados do contrato (número, revisão, fornecedor, CNPJ, filial) chegam preenchidos na SC.
- Se a transferência para o solicitante falhar, o usuário é **avisado** — não fica sem saber que a
  solicitação ficou retida. *(Ver Divergências: hoje esse aviso não existe.)*
- O botão **Confirmar** fica desabilitado enquanto o envio está em voo, sem permitir duplo clique.
- Quando o contrato não tem itens carregados, a mensagem é **"Nenhum item de contrato foi carregado.
  Verifique se o contrato possui itens e tente novamente."** e nada é criado.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A SC de Nova Contratação iniciada a partir do contrato fica **PARALISADA**, sem avançar e sem
  aparecer para o solicitante — bloqueando qualquer contratação por esse caminho. O ticket não
  registra mensagem de erro, apenas prints da solicitação travada. **Atenção ao executar:** instâncias
  travadas **antes** de uma correção **não** se destravam sozinhas; para julgar regressão, use uma
  solicitação criada **depois** do deploy, nunca resíduo antigo — foi exatamente esse o mal-entendido
  do ciclo de 15/07.

**Severidade:** Alta — impede a abertura do processo de contratação e deixa registro órfão na base,
sem responsável e sem sinal ao usuário.

**Preparação de massa:** um contrato **Vigente** com itens de planilha e rateio resolvível. A base
tem **557 contratos Vigentes**, então a massa existe. O processo criado deve ser cancelado depois,
por quem tem essa alçada — e o texto livre deve levar o prefixo **`QA`** para permitir higienização.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **Visto renderizado** — filtrada a coluna *Status* por `Vigente` (557
linhas), o ícone **Solicitação de Compra** do contrato `000000000000001` abriu o modal
**"Solicitação de Compra"**, com as seções *Aditivo contratual* e *Nova Contratação* e os campos:
**Tipo de Solicitação** (combo com *Selecione...* / **Aditivo Contratual** / **Nova Contratação**),
**Contrato** (já preenchido com `000000000000001`), **Data de Necessidade** (`input type="date"`) e
**Motivo da Solicitação** (textarea); botões **Confirmar** e **Fechar**. Clicando em **Confirmar**
com tudo vazio, apareceu o toast **"Campos Obrigatórios — Por favor, preencha: Tipo de Solicitação,
Motivo da Solicitação, Data de Necessidade"**, e **nenhuma** chamada de abertura de processo foi
disparada (as rotas `**/processes/**/start` e `**/dsFluig_postProcessesTransfer**` estavam
interceptadas por precaução e não chegaram a ser acionadas). A solicitação **não** foi confirmada.
**Lido no fonte publicado** (`fluigProcessService_pt_BR.js` + `wAcompanhaContratos_pt_BR.js`), o
mecanismo do "paralisada" fica explícito e é o que o caso precisa guardar: a SC é criada por
`POST /process-management/api/v2/processes/wf_solicitacao_compras/start` com
`targetState: 6` e **`targetAssignee: "consumerkeycompras"`** — ou seja, **nasce na conta de
integração** — e só depois é repassada ao solicitante por `transferToProcess`, que chama o dataset
`dsFluig_postProcessesTransfer` com `assignee=consumerkeycompras` e `targetAssignee=<matrícula do
usuário>`. **Se essa segunda chamada não acontecer ou falhar, o processo permanece com
`consumerkeycompras` — que é exatamente o quadro de "SC paralisada".** Confirmam-se ainda as travas
anti-duplo-clique (`submittingProcess` + `$btn.prop('disabled', true)`) e as validações prévias de
itens e de rateio.
**Divergências encontradas:** três.
(1) **Rótulo:** o ticket fala em "Nova Solicitação de Contrato"; a tela oferece **"Nova Contratação"**
(e **"Aditivo Contratual"**) no combo *Tipo de Solicitação*, e usa esses mesmos textos como títulos
de seção do modal.
(2) **Rótulo:** o campo do modal chama-se **"Contrato"**, mas a mensagem de crítica do próprio widget
o nomeia **"Número do Contrato"**.
(3) **Achado, ainda aberto:** a falha da transferência é **silenciosa**. No fonte publicado, o
`errorCallback` de `_transferirProcesso` faz apenas `console.log('Erro ao transferir processo: …')` e
**fecha o modal**; o `FLUIGC.toast` que avisaria o usuário está **comentado**. Na prática, uma SC que
ficar retida em `consumerkeycompras` some da vista **sem nenhum sinal** — o usuário vê "iniciado com
sucesso" e nada mais. Isso não impede a regressão de passar, mas é o caminho pelo qual o sintoma
original reapareceria sem ninguém notar. Vale item próprio.
**Ferramenta de conferência do passo 9 (validada nesta rodada):** a etapa corrente e o responsável de
uma solicitação podem ser lidos **sem movimentá-la** em
`GET /process-management/api/v2/requests/<nº do processo>/tasks`, que devolve `assignee`
(código, nome, e-mail, login), `status` (`TRANSFERRED` / `COMPLETED`), `processId` e
`movementSequence`. Foi assim que se confirmou, em leitura, que as SCs `112146` (assignee `TOTVS-FS`
— *Usuário TBC (TOTVS)*), `112556` e `112584` (assignee *Geise Campos Silva Matias*) estão com
**pessoa** como responsável, e não com a conta de integração. É este o campo que denuncia o defeito:
uma SC paralisada apareceria com `assignee.code = consumerkeycompras`.

**Dados/massa usados:** contrato pré-existente `000000000000001` (filial 3517, `076 - TELEFONIA
FIXA`, Vigente), aberto em leitura; solicitações `112146`, `112556` e `112584` **lidas** pela API de
workflow, sem movimentação. **Nada submetido, nenhum processo criado.**

---

## CT-FSWTBC-4982  (ambos · Concluído · SDCASSI-500)

**Título:** Abrir Informações Complementares do Contrato e conferir que todos os valores financeiros aparecem em formato de moeda

**Origem:** FSWTBC-4982 — campos de valor da seção *Informações Complementares do Contrato* exibidos sem máscara monetária; corrigido e homologado em 21/07.

**Módulo/Rota:** `/portal/p/1/acompanhamentoContrato` → ícone *Informações do Contrato* → modal **Informações Complementares do Contrato** → seção **Valores Financeiros** (*Valor Inicial do Contrato, Valor Atual do Contrato, Valor Presente, Saldo do Contrato, Despesa Financeira, Valor da Prorrogação, Medição Acumulada, Taxa de Administração*) e **Reajustes e Aditivos** (*Valor Total do Reajuste, Valor Total do Aditivo*)

**Pré-condições**
- Qualquer contrato listado (845 hoje); preferir um com valor ≥ 1 milhão para testar separador de milhar, e um com centavos.
- **Bloqueio:** nenhum.

**Passos**
1. Abrir o Acompanhamento; filtrar *Contrato* = `00067-2023-5303`; clicar *Informações do Contrato*.
2. Ler os campos de *Valores Financeiros* e *Reajustes e Aditivos*.
3. Repetir com `00050-2026-5303`.
4. Conferir um campo sem valor.

**Resultado esperado**
- Todo valor numérico no formato **`R$ 9.999.999,99`** (prefixo, separador de milhar, duas casas).
- Passo 4: campo sem valor exibe **"-"**, não `0`, `undefined` ou `NaN`.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Valores crus (ex.: `18294374.59`) sem separador nem prefixo — erro de leitura de ordem de grandeza.

**Severidade:** Baixa

**Preparação de massa:** nenhuma — contratos existentes.

**Verificado em tela:** SIM (total)
**O que foi verificado:** renderizado hoje: 00067-2023-5303 → *Valor Inicial do Contrato: R$ 18.294.374,59*, *Valor Atual do Contrato: R$ 18.294.374,59*, *Saldo do Contrato: R$ 11.482.615,38*; 00050-2026-5303 → *R$ 300.000,00 / R$ 300.000,00 / Saldo R$ 300.926,19*; campos vazios como *Valor Presente*, *Despesa Financeira*, *Medição Acumulada* exibem **"-"**.
**Divergências encontradas:** nenhuma no formato. Observação: em 00050-2026-5303 o *Saldo do Contrato* é **maior** que o *Valor Atual* — não é escopo deste caso, mas merece conferência no ERP.
**Dados/massa usados:** leitura dos dois contratos.

---

## CT-FSWTBC-4983  (fluig · Concluído · SDCASSI-501)

**Título:** Abrir Informações Complementares do Contrato e conferir que nome e CNPJ do fornecedor aparecem, além do código.

**Origem:** FSWTBC-4983 — "Exibir nome e CNPJ do fornecedor em Informações Complementares do
Contrato": a seção trazia o fornecedor apenas por código, obrigando a consultar o ERP para saber com
quem era o contrato.

**Módulo/Rota:** **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) → coluna
**Ação** → ícone `title="Informações do Contrato"` → modal **Informações Complementares do
Contrato** → seção **Dados Gerais**.

**Pré-condições**
- Usuário no grupo `G.P.Acompanhamento_Renovacao_Contratos` (ou no `…_admin`).
- Um contrato cujo fornecedor esteja cadastrado no Protheus (tabela SA2) com nome e CNPJ.
- **Bloqueio:** nenhum.

**Passos**
1. Abrir *Acompanhamento de Contratos*.
2. Anotar o valor da coluna **Fornecedor** da linha escolhida (vem no formato `código - loja`).
3. Clicar no ícone **Informações do Contrato** dessa linha.
4. Na seção **Dados Gerais** do modal, localizar os campos **Cód. Fornecedor**, **Nome do
   Fornecedor** e **CNPJ do Fornecedor**.
5. Conferir que o código do modal bate com o da coluna da grade, e que nome e CNPJ estão preenchidos.
6. Conferir a formatação do CNPJ.
7. Repetir em um contrato de fornecedor diferente.

**Resultado esperado**
- A seção **Dados Gerais** traz os três campos: **Cód. Fornecedor** (no formato `código / loja`),
  **Nome do Fornecedor** e **CNPJ do Fornecedor**.
- **Nome do Fornecedor** traz a razão social/nome do fornecedor — não `-`, não o código repetido.
- **CNPJ do Fornecedor** vem **formatado com máscara**: `99.999.999/9999-99` (ou a máscara de CPF,
  quando o fornecedor é pessoa física).
- O código exibido no modal corresponde ao da coluna *Fornecedor* da grade.
- Enquanto a consulta ao ERP está em voo, os dois campos mostram **"Buscando..."**; se o fornecedor
  não for encontrado, mostram `-` — nunca ficam presos em "Buscando...".

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Nome e CNPJ do fornecedor **ausentes** da seção Informações Complementares do Contrato, deixando só
  o código — o que obriga a consulta ao ERP para identificar a contraparte e anula boa parte do
  propósito da tela.

**Severidade:** Baixa — é lacuna de apresentação; não há risco financeiro nem de acesso. Mas o custo
operacional é real, porque manda o usuário ao ERP para uma informação de identificação.

**Preparação de massa:** nenhuma. A base já traz contratos com fornecedor cadastrado.

**Verificado em tela:** SIM (total)
**O que foi verificado:** **Visto renderizado** — no contrato `0000-2025-2501-`, seção *Dados
Gerais* do modal **"Informações Complementares do Contrato"**: **Cód. Fornecedor** = `26628497 /
0001`, **Nome do Fornecedor** = `ANA CARLA LEAL VELOSO E SILVA`, **CNPJ do Fornecedor** =
`26.628.497/0001-80` — com máscara aplicada e batendo com o valor `26628497 - 0001` da coluna
*Fornecedor* da grade. O mesmo par nome/CNPJ também aparece no modal **Detalhes da Planilha**, seção
*Fornecedor* (*Nome Fornecedor* e *CNPJ Fornecedor*). **Lido no fonte publicado**: `buscarFornecedor`
consulta `dsProtheus_getFornecedores_restGetAll` pelos campos `A2_COD`, `A2_LOJA`, `A2_NOME` e
`A2_CGC`, com constraints `A2_COD` e `A2_LOJA`, escreve "Buscando..." antes da chamada e cai para `-`
tanto quando não há linha quanto no `fail` da requisição; o CNPJ passa por `formataCNPJ`.
**Divergências encontradas:** nenhuma. Observação: o ticket fala em "nome e CNPJ do fornecedor" e a
tela nomeia os campos **"Nome do Fornecedor"** e **"CNPJ do Fornecedor"** — coerente.
**Dados/massa usados:** contrato pré-existente `0000-2025-2501-`, aberto em leitura.

---

## CT-FSWTBC-4986  (fluig · Concluído · SDCASSI-503)

**Título:** Filtrar a tela de Acompanhamento de Contratos pela busca geral e pelos filtros de coluna e conferir que o resultado corresponde ao critério.

**Origem:** FSWTBC-4986 — "Filtro não funciona na tela de Acompanhamento de Contratos": ao aplicar
critérios de pesquisa o sistema não retornava os resultados corretamente ou simplesmente não
filtrava. Numa tela com centenas de contratos, sem filtro o painel é inutilizável.

**Módulo/Rota:** **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) — caixa
**Pesquisar** (canto superior direito da grade) e as **7 caixas "Filtrar"** do rodapé da grade.

**Pré-condições**
- Usuário no grupo `G.P.Acompanhamento_Renovacao_Contratos` (ou no `…_admin`).
- Grade carregada com massa suficiente para que o filtro seja perceptível.
- **Bloqueio:** nenhum.

**Passos**
1. Abrir *Acompanhamento de Contratos*, aguardar a grade e anotar o **total de linhas**.
2. Na caixa **Pesquisar**, digitar um **número de contrato** existente (ex.: `000000000000013`) e
   conferir que sobra a linha daquele contrato.
3. Limpar; digitar um **código de filial** (ex.: `2501`) e conferir que só restam contratos daquela
   filial.
4. Limpar; digitar um **status** por extenso (ex.: `Vigente`) e conferir que só restam contratos
   nesse status.
5. Limpar; digitar uma **data no formato brasileiro** (ex.: `01/06/2023`) e conferir que restam os
   contratos com essa data de início ou de fim.
6. Limpar; digitar a **descrição de um tipo de contrato** exibida na coluna *Tipo Contrato*
   (ex.: `DEDETIZACAO`) e observar o resultado.
7. Limpar a busca geral. No rodapé, usar a caixa **Filtrar** da coluna **Status** com `Vigente` e
   conferir o resultado; repetir com a caixa da coluna **Filial** (`2501`) e com a da coluna
   **Contrato** (`000000000000013`).
8. Limpar todos os filtros e conferir que a grade volta ao total do passo 1.

**Resultado esperado**
- A caixa **Pesquisar** filtra a grade a cada tecla e o resultado corresponde ao termo digitado —
  para número de contrato, código de filial, status por extenso, revisão e data em `dd/mm/aaaa`.
- As **7 caixas "Filtrar"** do rodapé filtram **coluna a coluna** e podem ser combinadas entre si e
  com a busca geral.
- Limpar o critério devolve a grade ao total original, sem precisar recarregar a página.
- Termo sem correspondência exibe **"Nenhum registro encontrado"** — e não a grade inteira.
- A pesquisa por **descrição do tipo de contrato** (ex.: `DEDETIZACAO`) deve encontrar as linhas em
  que essa descrição está visível na coluna *Tipo Contrato*. **Hoje não encontra** — ver Divergências.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O filtro não retorna resultado correto ou não filtra: aplica-se o critério e a grade permanece
  inteira, ou some por completo. O ticket não registra mensagem — apenas três prints.

**Severidade:** Média — bloqueia o uso da tela; com 845 contratos, sem filtro não há consulta viável.

**Preparação de massa:** nenhuma. A base já traz 845 contratos, com filiais, status e tipos variados.

**Verificado em tela:** SIM (total)
**O que foi verificado:** **Visto renderizado**, grade com **845 linhas** sem filtro. Busca geral
(**Pesquisar**): `000000000000013` → **1** linha (o contrato certo, filial 2901,
`044 - MAO DE OBRA TERCEIRIZADA`); `2501` → **13**; `Vigente` → **557**; `01/06/2023` → **4**;
`017` → **83**. Filtros de coluna do rodapé (confirmados também pela API do DataTables, coluna a
coluna): **Filial** `2501` → **12**; **Contrato** `000000000000013` → **1**; **Status** `Vigente` →
**557**; **Tipo Contrato** `017` → **63**. Limpar devolveu as 845 linhas. Termo sem correspondência
exibiu **"Nenhum registro encontrado"**. **O filtro funciona** — com uma exceção, abaixo.
**Divergências encontradas:** uma, e é achado novo, ainda aberto. **A coluna *Tipo Contrato* é
pesquisável apenas pelo código, nunca pela descrição que a tela exibe.** Buscar `DEDETIZACAO` — texto
que está visível na coluna, em 63 linhas — devolve **0** resultados, tanto na busca geral quanto no
filtro da própria coluna; buscar `017` devolve as 63. **Lido no fonte publicado**, a causa é
inequívoca: o `render` da coluna `CN9_TPCTO` monta `código + ' - ' + descrição` **só quando
`type === 'display'`** e devolve `data` cru (o código) nos demais tipos, inclusive `filter` — de modo
que o índice de busca nunca contém a descrição. As colunas vizinhas fazem o oposto e por isso
funcionam: `CN9_SITUAC` devolve `código + ' ' + texto` fora do display (daí `Vigente` achar), e as
duas colunas de data aplicam `formataDataBR` também em `type === 'filter'` (daí `01/06/2023` achar).
Recomendação: alinhar `CN9_TPCTO` ao padrão das outras duas.
**Dados/massa usados:** nenhum registro alterado — apenas filtros aplicados e removidos em leitura.

---

## CT-FSWTBC-4987  (fluig · Concluído · SDCASSI-504)

**Título:** Conferir que Fiscal de Contrato e Fiscal de Serviço aparecem, com nome e e-mail, nos DOIS pontos do painel: Informações Complementares do Contrato e Detalhes da Planilha.

**Origem:** FSWTBC-4987 — "Acrescentar o nome Fiscal de Contrato e trazer o Fiscal de Serviço em
Informações Complementares do Contrato". Na primeira entrega o homologador apontou que o Fiscal de
Serviço aparecia em *Informações Complementares do Contrato* **mas não** em *Informações da
Planilha* — dado acrescentado num ponto da tela e ausente no equivalente.

**Módulo/Rota:** **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) →
(a) ícone `title="Informações do Contrato"` → **Informações Complementares do Contrato** → seção
**Dados Gerais**; e (b) ícone `title="Planilha"` → **Informações da Planilha** → ação
`title="Detalhes da Planilha"` → **Detalhes da Planilha** → seção **Fornecedor**.

**Pré-condições**
- Usuário no grupo `G.P.Acompanhamento_Renovacao_Contratos` (ou no `…_admin`).
- Um contrato **com fiscal de contrato preenchido** (campo `CN9_XFISCA` no ERP) e **com planilha**,
  cujo fiscal de serviço esteja cadastrado.
- Os dois fiscais precisam existir como usuários no Fluig, para que o nome seja resolvido a partir do
  e-mail.
- **Bloqueio:** nenhum.

**Passos**
1. Abrir *Acompanhamento de Contratos* e escolher um contrato com planilha.
2. Clicar em **Informações do Contrato**; na seção **Dados Gerais**, localizar **Fiscal de Contrato**
   e **Fiscal de Serviço** e anotar os dois valores. Fechar.
3. Clicar em **Planilha** na mesma linha, depois em **Detalhes da Planilha** na primeira planilha.
4. Na seção **Fornecedor** do modal *Detalhes da Planilha*, localizar **Fiscal de Contrato** e
   **Fiscal de Serviço**.
5. Comparar: os valores dos dois pontos têm de ser os mesmos para o mesmo contrato.
6. Repetir num segundo contrato, de fiscal diferente, para descartar valor fixo.

**Resultado esperado**
- Em **Informações Complementares do Contrato → Dados Gerais** existem os campos **Fiscal de
  Contrato** e **Fiscal de Serviço**, ambos preenchidos.
- Em **Detalhes da Planilha → Fornecedor** existem os **mesmos dois campos**, igualmente preenchidos.
- Os valores são apresentados como **nome completo seguido do e-mail entre parênteses** —
  `Nome Sobrenome (email@cassi.com.br)` —, não como e-mail cru nem como código.
- Os valores dos dois pontos **coincidem** para o mesmo contrato.
- Quando o fiscal não existir como usuário do Fluig, o campo cai para o **e-mail** puro; quando não
  houver fiscal, cai para `-`. Em nenhum caso fica preso em "Buscando...".

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O **Fiscal de Serviço** presente em *Informações Complementares do Contrato* e **ausente** em
  *Informações da Planilha* — que foi exatamente o apontamento do homologador em 21/07 —, ou o
  **Fiscal de Contrato** exibido só como e-mail/código, sem o nome.

**Severidade:** Baixa — lacuna de apresentação. Sobe para Média na prática, porque o fiscal é quem
responde pela medição: sem o nome à vista, o acompanhamento não sabe a quem cobrar.

**Preparação de massa:** um contrato com `CN9_XFISCA` preenchido e planilha vinculada, e os fiscais
cadastrados como usuários do Fluig. Já existe na base.

**Verificado em tela:** SIM (total)
**O que foi verificado:** **Visto renderizado**, no contrato `0000-2025-2501-`, os **dois pontos**:
em *Informações Complementares do Contrato → Dados Gerais* — **Fiscal de Contrato** = `Andre Yuji
Tamaoki Hirata (andre.thirata@cassi.com.br)` e **Fiscal de Serviço** = `Flavio Vinhaes
(flavio.vinhaes@cassi.com.br)`; e em *Detalhes da Planilha → Fornecedor* (planilha `000001`) — os
**mesmos dois valores**, sob os mesmos rótulos. O formato nome + e-mail entre parênteses confere.
**Lido no fonte publicado**: em `openInfoContrato` o Fiscal de Contrato sai de `CN9_XFISCA` via
`resolveFiscalNome` e o Fiscal de Serviço de `buscarFiscalServico(CN9_NUMERO, CN9_FILIAL)`; em
`openDetalhePlanilha` os **dois** são resolvidos — `buscarFiscalServico(CNA_CONTRA, CNA_FILIAL,
'#plan-fiscal-servico')` e `buscarFiscalContrato(CNA_CONTRA, CNA_FILIAL, '#plan-fiscal-contrato')` —,
que é precisamente a correção pedida na segunda rodada de homologação. `resolveFiscalNome` consulta o
dataset `colleague` por `mail` e monta `colleagueName + ' (' + email + ')'`, caindo para o e-mail
quando não acha o usuário e para `-` quando o e-mail vem vazio.
**Divergências encontradas:** uma, de nome de tela. O ticket e o apontamento do homologador falam em
*"Informações da Planilha"*; o modal que efetivamente traz os dois fiscais chama-se **"Detalhes da
Planilha"** — *Informações da Planilha* é o modal anterior, que só lista as planilhas do contrato e
**não** tem campos de fiscal. Ao executar o caso, é preciso descer um nível.
**Dados/massa usados:** contrato pré-existente `0000-2025-2501-` e sua planilha `000001`, ambos em
leitura.

---

## CT-FSWTBC-5173  (ambos · Concluído · SDCASSI-548)

**Título:** Finalizar uma SC de **Aditivo Contratual** (renovação) e ver o Protheus abrir uma **revisão** do contrato de origem — devolvendo o número
da revisão ao Fluig, ou um erro explícito quando não conseguir — nunca um contrato novo com "sucesso"

**Origem:** FSWTBC-5173 — renovação gerava contrato **novo** em vez de revisão. Causa central: o Protheus não concluía o aditivo e **devolvia
sucesso**; o aditivo era silenciosamente ignorado conforme a composição de fornecedores da cotação. Quatro correções: localizar o contrato de
origem informado pelo Fluig; devolver a revisão criada com a cotação de origem; **erro em vez de sucesso** quando o aditivo não puder ser gerado
(a SC não finaliza); "medições pendentes" considera só as não concluídas. SCs 112441 (contrato 6182-2025-5303) e 112583 (NFC indicando contrato
excluído).

**Módulo/Rota:** Fluig → Solicitação de Compras → combo **Tipo de Solicitação** = **Aditivo Contratual** (+ contrato/revisão de origem) → …
*Aprovação de Alçadas (94)* → *Integração com ERP (287)* → **Aguarda Geração do Pedido/Contrato (323)** → **Pedido/Contrato foi Gerado? (87)** →
ramo de sucesso **Aguarda Vigência do Contrato (332)** ou ramo de erro **Verificar retorno Protheus (317)** → *Enviar para (318)* → *Fim - Verificar
Trava Orçamentária (319)* · Histórico · Tracker (visão *Solicitação de Compras*, filtro *Tipo de Solicitação* = `Renovação Contratual | Aditivo
Contratual`, colunas *Número do Contrato* / *Revisão do Contrato*) · *Acompanhamento de Contratos* → modal **Informações Complementares do
Contrato** (*Status da Integração GCT*, *Erro de Integração*).

**Pré-condições**
- Contrato `QA` vigente no Protheus, **sem** medições pendentes não concluídas, e SC `QA` de *Aditivo Contratual* apontando para ele; cotação com
  **mais de um** fornecedor participante (cenário em que o contrato de origem se perdia).
- Segunda SC `QA` cujo aditivo **não** possa ser gerado (ex.: contrato de origem inexistente).
- **Bloqueio:** contrato é pré-condição de leitura (não criável pela automação); ciclo exige comprador e gestor de alçada; a conta de QA não tem
  credencial Protheus para conferir CN9/revisão. Não movimentar 112441/112583.

**Passos**
1. Abrir a SC e conferir **Tipo de Solicitação = Aditivo Contratual** e o contrato de origem (Tracker, *Número do Contrato* / *Revisão do Contrato*).
2. Levar até *Aprovação de Alçadas* e aprovar; aguardar *Aguarda Geração do Pedido/Contrato*.
3. Ler no Histórico a decisão de **Pedido/Contrato foi Gerado?** e a atividade seguinte.
4. No *Acompanhamento de Contratos*, localizar o contrato de origem: coluna **Nº Revisão** e modal **Informações Complementares do Contrato**
   (*Status da Integração GCT*).
5. Repetir 2–3 com a segunda SC (aditivo impossível).

**Resultado esperado**
- Passo 3 (SC válida): condição de sucesso → **Aguarda Vigência do Contrato (332)**; Tracker mostra o **mesmo** *Número do Contrato* com *Revisão*
  incrementada — **não** um contrato novo.
- Passo 4: *Nº Revisão* novo e *Status da Integração GCT* sem erro; cronogramas financeiro/contábil atualizados (visível só no ERP).
- Passo 5: condição de erro → **Verificar retorno Protheus (317)** com o motivo no Histórico/*Retorno Integração*; a SC **não** finaliza como
  sucesso.
- Medições já concluídas **não** bloqueiam a revisão.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Contrato **novo** gerado (numeração/histórico quebrados) ou aditivo não gerado com o processo seguindo "como se tivesse sido"; *Nº Revisão*
  inalterado; NFC indicando contrato excluído (SC 112583).

**Severidade:** Alta

**Preparação de massa:** contrato vigente no ERP sem medições pendentes; duas SCs `QA` de Aditivo Contratual (uma válida, uma inválida);
comprador + gestor de alçada.

**Verificado em tela:** PARCIAL
**O que foi verificado:** combo **Tipo de Solicitação** com opções `Aditivo Contratual | Nova Contratação` e campo **Total com Aditivo (R$)**
(`authorityVlrTotalComAditivo`) lidos no fonte publicado 256831; Histórico da **112441** visto renderizado: *Aguarda Geração do Pedido/Contrato*
(25/08 18:46) → *Pedido/Contrato foi Gerado?* "**condição 4**" → **Verificar retorno Protheus** (Fernanda, movimentada 27/08 13:44 por Geise como
substituta) → *Enviar para* → **Fim - Verificar Trava Orçamentária** (`FINALIZED` 27/08); **112583** hoje em *Aguarda Vigência do Contrato (332)*
desde 27/08 (ramo de sucesso); **112816** (outro aditivo, v95) parada em *Verificar retorno Protheus* desde 27/08. Tracker visto renderizado com o
filtro *Tipo de Solicitação* = `Todos | Renovação Contratual | Aditivo Contratual`. *Acompanhamento de Contratos* com 845 linhas às 09:25. Lado
Protheus (CN9/revisão) não executado.
**Divergências encontradas:** **não existe "Renovação" no formulário da SC** — só *Aditivo Contratual* e *Nova Contratação*; o Tracker, porém,
filtra por **"Renovação Contratual"** — um dos dois está defasado. A SC 112441 (renovação do ticket) terminou em **"Fim - Verificar Trava
Orçamentária"**, não no ramo de contrato — o Histórico não diz se o aditivo foi gerado. O ticket chama o gateway de "finalizar a solicitação";
na tela são **Pedido/Contrato foi Gerado? (87)** e **Verificar retorno Protheus (317)**.
**Dados/massa usados:** nenhum — não submetido; leitura de 112441, 112583, 112816.

---

## CT-FSWTBC-5198  (fluig · Concluído · SDCASSI-555)

**Título:** Preencher um item de Solicitação de Compras de Aditivo Contratual com quantidade zerada e tentar prosseguir.

**Origem:** FSWTBC-5198 — no aditivo de contrato (SC 112584) o sistema deixou **prosseguir com a quantidade do item zerada, sem crítica em tela**; o erro só apareceu depois, na gravação. O relator formulou o princípio: o problema não é o erro, é o erro **chegar tarde**. Concluído/Feito em 28/08/2026, sem registro técnico do ajuste.

**Módulo/Rota:** Fluig → **Processos → Iniciar Solicitações → Compras → Solicitação de Compras** (`processID = wf_solicitacao_compras`), painel **Produtos/Serviços da Solicitação** (grade pai-filho `tbProdutos`). Cabeçalho: campo **Tipo de Solicitação** com a opção **Aditivo Contratual**.

**Pré-condições**
- Perfil que inicia *Solicitação de Compras* — a conta `TOTVS-FS` tem.
- Para o cenário **de aditivo** especificamente: uma SC cujo cabeçalho **Tipo de Solicitação** esteja em **"Aditivo Contratual"**, o que exige um **contrato vigente** de referência (os campos **Valor Vigente do Contrato (R$)** e **Total com Aditivo (R$)** vivem no painel de Alçada).
- **Bloqueio:** **parcial.** O caminho genérico (item com quantidade zerada) é executável e foi executado. O recorte **aditivo** não é: no formulário de início o campo **Tipo de Solicitação** do cabeçalho está **desabilitado** (`disabled`) — quem o posiciona em "Aditivo Contratual" é etapa/serviço posterior, não o solicitante —, e não há contrato de homologação reservável para este login sem gerar massa. Além disso a grade de itens exige **Produto/Serviço** vindo do zoom do ERP, e a conta de QA não resolve o cadastro de comprador no Protheus.

**Passos**
1. Abrir **Processos → Iniciar Solicitações → Compras → Solicitação de Compras**.
2. No painel **Produtos/Serviços da Solicitação**, acionar **Adicionar Produto** — surge a linha do item com os campos **Item \***, **Produto/Serviço \***, **Unidade de Medida \***, **Grupo do Produto/Serviço \***, **Data de Necessidade \***, **Quantidade \***, **Média Histórica \***, **Preço Unit. Estimado \***, **Vlr. Total Estimado \*** e **Tipo de Solicitação \*** (opções *Aquisição / Reparo / Reposição*).
3. Selecionar um **Produto/Serviço** válido pelo zoom e preencher **Preço Unit. Estimado** com `10,00`.
4. Preencher **Quantidade** com `0` e sair do campo (perder o foco).
5. Repetir com **Quantidade** deixada **em branco**.
6. Sem corrigir a quantidade, acionar o envio da solicitação (**Confirmar / Enviar**).
7. Para o recorte de aditivo: repetir 2–6 numa SC cujo **Tipo de Solicitação** do cabeçalho seja **Aditivo Contratual**.
8. Abrir a solicitação em **Detalhes da Solicitação → aba Histórico** e ler a atividade **Grava SC e Anexos**.

**Resultado esperado**
- Ao sair do campo **Quantidade** com `0` (ou vazio), o formulário **critica na hora**, identificando o item, e **não** deixa o valor seguir adiante. A crítica deve ser tão imediata quanto a que já existe para o valor total — hoje confirmada em tela: *"O Vlr. Total Estimado não pode ser inferior a R$ 0,10! Por favor ajuste a "Quantidade" ou o "Preço Unit. Estimado" para o item 0001."*
- **Vlr. Total Estimado** nunca fica em branco quando há preço preenchido: ou é calculado, ou o campo que o impede é criticado.
- O envio da solicitação é **recusado no navegador** enquanto houver item com quantidade zerada; não chega a movimentar o processo.
- Consequentemente, a aba **Histórico** **não** registra falha na atividade **Grava SC e Anexos** (atividade 233) por quantidade ausente, e o processo **não** é desviado para **Correção**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A tela aceita a quantidade zerada em silêncio e a SC segue o fluxo. A falha só aparece na gravação, no Histórico da solicitação, exatamente como ainda se lê na SC **112584**: três tentativas na atividade **Grava SC e Anexos** com
  `Atividade de serviço executada com falha: Tentativa: 3 - Erro java.lang.Exception: Falha na Integração com ERP. code: 401 message: AJUDA:OBRIGAT2 Um ou alguns campos obrigatorios não foram preenchidos no objeto Grid. Solicitações de Compra Centro Custo` **`Quantidade da SC`** ` Unid. Requis. 1 \nTabela SC1` — e a solicitação desviada para **Correção**, onde permanece "Em progresso" até hoje.
- É a mesma classe do SDCASSI-524 (proposta aceita com `C8_QUANT` zerada) e do SDCASSI-496 (preço 0,000001 gerando valor estimado zero): a validação numérica só existe no momento da gravação.

**Severidade:** Alta — quantidade zerada num aditivo contratual atravessa validação orçamentária e alçada carregando um valor incorreto; e, no melhor caso, trava a SC na integração depois de já ter consumido aprovações. Risco financeiro e de alçada.

**Preparação de massa:** para o cenário **genérico** nada precisa ser criado — basta abrir o formulário de início e adicionar um item (foi o que fiz). Para o cenário **de aditivo** é preciso, por quem tem o perfil: (a) um **contrato vigente** de homologação que sirva de base ao aditivo; (b) uma SC posicionada com **Tipo de Solicitação = Aditivo Contratual** no cabeçalho — campo que **não é editável pelo solicitante** na etapa de início; (c) um **Produto/Serviço** resolvível no zoom do ERP. Nada disso é gerável pela conta de QA.

**Verificado em tela:** SIM (no comportamento da quantidade) / PARCIAL (no recorte do aditivo)
**O que foi verificado:** o formulário de início da SC abre. Acionei **Adicionar Produto** (`#btnAdicionarProduto`) e a linha do item surgiu com os rótulos citados. Com **Preço Unit. Estimado = 10,00** e **Quantidade = 0**, saindo do campo: **nenhum diálogo, nenhum toast** e **Vlr. Total Estimado ficou vazio**. Deixando **Quantidade em branco**, o campo é **silenciosamente normalizado para `0`** — também sem nenhuma mensagem. Já com **Quantidade = 1** e **Preço Unit. Estimado = 0,01**, o diálogo dispara com o texto literal *"Erro: O Vlr. Total Estimado não pode ser inferior a R$ 0,10! Por favor ajuste a "Quantidade" ou o "Preço Unit. Estimado" para o item 0001."*. No **fonte publicado** do formulário (`App/ViewHandler.js` do formulário 256831, handler de `blur` de `tbprod_quantidade___N`) a razão está explícita: a checagem do R$ 0,10 só roda dentro de `if (value && parseFloat(value) > 0)`, e o `else` faz apenas `value = 0; $(o).val(value);` — sem mensagem; a guarda espelhada no `blur` do preço (`if (qtd && parseFloat(qtd) > 0)`) faz o mesmo. Abri a SC **112584** — a do ticket — em modo detalhes: está com **Atividade atual: Correção (Em progresso)**, responsável *Usuário TBC (TOTVS)*, e o Histórico traz as três tentativas de falha citadas acima. Nenhuma solicitação foi enviada.
**Divergências encontradas:** **três.** (1) **Dois campos diferentes com o mesmo rótulo "Tipo de Solicitação"**: no cabeçalho (`_tipoSolicitacao`, opções *Aditivo Contratual* / *Nova Contratação*, **desabilitado** no início) e dentro de cada item (`tbprod_tipo`, opções *Aquisição* / *Reparo* / *Reposição*) — o ticket diz "aditivo de contrato" sem dizer qual. (2) O ticket está **Concluído/Feito**, mas a validação em tela da **quantidade zerada continua ausente** no formulário de início da SC medido hoje: `0` e vazio passam calados. Se houve correção, ela não está nesta camada — pode estar no `validateForm` server-side ou só no caminho de aditivo, o que este login não alcança. (3) O ticket fala em "quantidade do item zerada"; o erro que o ERP devolve nomeia o campo como **"Quantidade da SC"**.
**Dados/massa usados:** nenhum registro criado — o formulário de início foi preenchido em memória (item 0001, preço `10,00`, quantidade `0`/vazio/`1`, preço `0,01`) e **descartado sem enviar**. A SC 112584 foi apenas **lida**.

---
