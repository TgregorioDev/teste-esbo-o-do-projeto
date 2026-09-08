<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# Plataforma

Casos de teste E2E do Fluig — módulo Plataforma.

| | |
|---|---|
| Casos neste arquivo | 6 |
| Verificados em tela | 0 total · 6 parcial · 0 não |

> **Como ler.** Cada caso descreve o comportamento **correto esperado hoje**. A maioria dos
> defeitos de origem já foi corrigida — o caso é de regressão: se reprovar, o defeito voltou.
> Os que reprovam hoje por causa nunca corrigida estão marcados no próprio caso.
> *Verificado em tela* diz o que foi conferido no ambiente de homologação em 08/09/2026;
> **PARCIAL** costuma significar que a conta de QA não tem o perfil necessário (comprador,
> gestor, fiscal, fornecedor), não que o caso seja inválido.

---

## CT-FSWTBC-640  (fluig · Concluído)

**Título:** Usuário movimenta uma solicitação e, se a movimentação falhar, recebe uma mensagem de erro com texto — nunca um erro em branco.

**Origem:** FSWTBC-640 — "[745529] Erro em branco ao movimentar processos na QA (Fluig)". A
movimentação falhava exibindo um erro **sem texto**. A hipótese registrada em reunião foi "parece ser
erro de versão"; a causa nunca foi confirmada no ticket.

**Módulo/Rota:** **Central de Tarefas** (`/portal/p/1/pagecentraltask`) → aba **Tarefas a concluir** →
card da solicitação → botão **Enviar**. Vale para qualquer processo; o padrão foi observado em
*Solicitação de Compras* e *Cotação de Produtos e Serviços*.

**Pré-condições**
- Uma solicitação **do próprio executor** em etapa humana (ex.: *Correção* ou *Validação do Gestor*).
- Formulário com os campos obrigatórios preenchidos (para separar crítica de validação de erro de
  movimentação).
- **Bloqueio:** parcial — confirmar o caminho feliz exige **acionar Enviar**, o que movimenta o
  processo e grava. Não executado nesta rodada por política de escrita. Além disso, o ticket fala de
  um ambiente "QA" que não é identificável a partir daqui (só há acesso a uma base).

**Passos**
1. Abrir a **Central de Tarefas** e clicar explicitamente na aba **Tarefas a concluir**
   (a sub-aba é guardada por sessão no servidor; não confie no estado herdado).
2. Abrir o card da solicitação; confirmar que o cabeçalho traz `<nº> - <etapa>` e as abas
   **Formulário / Informações / Histórico / Anexos**.
3. Acionar **Enviar** e escolher a atividade destino.
4. Se houver falha, ler a mensagem exibida.
5. Abrir a aba **Histórico** e ler o último lançamento.

**Resultado esperado**
- A movimentação conclui e o Histórico registra
  `<usuário> movimentou a atividade <origem> para a atividade <destino>` com data/hora.
- Havendo falha, a mensagem em tela é **preenchida e específica** (processo, atividade, tentativa e
  causa) — nunca um modal/toast vazio.
- Falha em atividade de serviço aparece no Histórico no formato observado hoje:
  `Falha ao executar evento de serviço. Processo: <processo> - Atividade: <seq> - Tentativa: <n> - Erro <exceção> - Tempo de Execução <n> s. Nova tentativa em <dd/MM hh:mm>`.
- Após 3 tentativas sem sucesso, a solicitação vai para **Correção** e continua acessível.

**Resultado se o defeito reincidir**
- Ao movimentar, aparece um erro **em branco** — modal/alerta sem texto, sem código e sem indicação de
  atividade —, e o usuário não tem como saber se a movimentação ocorreu. Mensagem exata: nenhuma
  (é justamente a ausência dela).

**Severidade:** Média *(bloqueia o fluxo e impede o diagnóstico)*

**Preparação de massa:** uma solicitação em etapa humana criada pelo próprio executor (prefixo `QA`
no texto livre). Não reaproveite solicitação de terceiro — movimentá-la altera trabalho alheio.

**Verificado em tela:** PARCIAL
**O que foi verificado:** Central de Tarefas abre com heading *Central de tarefas*, abas
*Resumo de Tarefas*, **Tarefas a concluir 11** e *Mais opções*, botões *Nova solicitação* e **Enviar**
por card. A tarefa **113196** (*SOLICITAÇÃO DE COMPRAS*, etapa **Correção**, responsável *Usuário TBC
(TOTVS)*) foi aberta em leitura: cabeçalho `113196 - Correção`, abas **Formulário / Informações /
Histórico 6 / Anexos 2 / AdHoc / Apontamentos**. O **Histórico** traz, com texto completo e não em
branco: *"Atividade de serviço executada com falha: Tentativa: 3 - Erro java.lang.Exception: Cannot
convert NaN to java.lang.Integer (servicetask233#267) - Tempo de Execução 70 s"* e, nas tentativas 1 e
2, *"Falha ao executar evento de serviço. Processo: wf_solicitacao_compras - Atividade: 233 -
Tentativa: 1 - Erro ... Nova tentativa em 03/09 09:50"*; em seguida *"Grava SC e Anexos movimentou a
atividade Grava SC e Anexos para a atividade Correção"*. A aba **Informações** mostra *Atividade
atual: Correção*, *Número da solicitação: 113196*, *Responsável*, *Prazo* e *Instruções para o
processo: Processo de Requisição de Compra e/ou Contratação*.
**Divergências encontradas:** o ticket trata "QA" como ambiente próprio; a base acessível é a de
homologação da Cassi e **não há como afirmar que sejam a mesma**. Nenhuma divergência de rótulo.
**Dados/massa usados:** solicitação 113196, da própria conta de QA, aberta em leitura — **não** enviada.

---

## CT-FSWTBC-1942  (fluig · Concluído)

**Título:** Caracterização de caminho: após atualização do ERP Protheus em homologação, as quatro superfícies de integração do Fluig continuam respondendo.

**Origem:** FSWTBC-1942 — título registrado como
"[CASSI - BH] - Suporte 2025] - [CASSI - BH] - Suporte 2025] - [CASSI - BH] - Suporte 2025] -
[CASSI - BH] - Suporte Junho/2025] - Acompanhamento e correções no ambiente TST da homologação para
atualização do ERP Protheus".
**O ticket não traz descrição** e o título foi destruído pelo mesmo defeito de automação de
renomeação (um de ~15 bugs de junho/2025 na mesma situação). O que sobra é o tema: **acompanhar e
corrigir o ambiente de homologação durante a atualização do ERP**. Caso escrito como
**caracterização de caminho** — um roteiro de regressão pós-atualização do Protheus.

**Módulo/Rota:** transversal. As quatro superfícies do Fluig que expõem o efeito da integração com o
Protheus: (1) **Histórico** da solicitação; (2) campo **Erro retornado pelo ERP Protheus** no
formulário de Cotação; (3) **Portal de Acompanhamento de Contratos**
(`/portal/p/1/acompanhamentoContrato`) e o modal de informações do contrato; (4) **Tracker**
(`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`).

**Pré-condições**
- Ambiente de homologação (TST) com a nova versão do ERP Protheus aplicada.
- Integração Fluig↔Protheus configurada e no ar.
- **Bloqueio:** **parcial** — a conferência do lado do ERP (versão, RPO, dicionário) exige credencial
  de Protheus, que não existe nesta rodada. Tudo que está nos passos abaixo é executável **pelo Fluig**.

**Passos**
1. Abrir `/portal/p/1/home` e confirmar que a sessão foi estabelecida **pelo título do documento**
   (`Cassi - Fluig Plataforma - Home`) — nunca pela URL, que é a mesma da tela de login.
2. Abrir o **Portal de Acompanhamento de Contratos** e confirmar que a grade de contratos carrega
   com registros vindos do Protheus.
3. Abrir `/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras` e confirmar que o
   formulário monta e que os zooms alimentados pelo ERP respondem (filial, grupo de produto).
4. Abrir o **Tracker** e, para cada uma das **9** opções de **Filtrar por:**, confirmar que a tela
   troca os filtros sem erro.
5. Abrir `/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos` e confirmar que a seção
   **Informações da Medição** monta e que os zooms de contrato respondem.
6. Em uma solicitação existente, abrir a aba **Histórico** e conferir os registros de integração.
7. Percorrer o console do navegador e a rede em busca de datasets do ERP retornando vazio, **HTTP 500**
   ou `NullPointerException`.

**Resultado esperado**
- Todas as telas de Compras/Contratos abrem, com título correto e sem cair em `errorPage/404`.
- A grade do Portal de Acompanhamento de Contratos traz registros — datasets do ERP não voltam vazios.
- Os zooms alimentados pelo Protheus (filial, produto, contrato, competência) respondem.
- As 9 opções de filtro do Tracker alternam os campos corretamente.
- A aba **Histórico** registra integrações no padrão
  `Integração executada com sucesso - Tempo de Execução N s`.
- Nenhum dataset do ERP retorna **HTTP 500** nem exceção Java no corpo.

**Resultado se o defeito reincidir**
- `<não documentado>` — o ticket não registra sintoma nem evidência. Em atualização de ERP, o padrão
  histórico deste ambiente é: datasets do Protheus retornando vazio, zooms sem opção e formulários
  que montam a estrutura mas não os dados. **Vazio do ERP após atualização deve ser tratado como
  instabilidade/regressão de integração a investigar, não como defeito do formulário.**

**Severidade:** Média *(é acompanhamento de ambiente; o impacto real depende do que a atualização
quebrar, e sem descrição do ticket não há como afirmar mais que isso)*

**Preparação de massa:** nenhuma massa nova. Exige **janela combinada** com quem aplica a
atualização do ERP em homologação e, idealmente, uma execução deste mesmo roteiro **antes** da
atualização, para servir de linha de base — sem o "antes", o "depois" não distingue regressão de
condição preexistente.

**Verificado em tela:** PARCIAL
**O que foi verificado:** os passos 1, 3, 4 e 5 foram executados hoje e passaram. Sessão confirmada
pelo título `Cassi - Fluig Plataforma - Home`. O formulário da **Solicitação de Compras** monta
(iframe `256831`) e, na carga, aciona os datasets **`ds_protheus_getMatriculaTitular_rest`** e
**`dsProtheus_getGrupoDeProduto_restGetAll`**. O **Tracker** abre com título
`Cassi - Fluig Plataforma - Tracker - Processos Compras/ Contratos`, headings **Filtros**,
**Filtrar por - Identificação do Processo / Solicitante** e **Filtrar por - Informações do
Fornecedor**, as **9** opções de **Filtrar por:** e os datasets **`dsp_filiaisProtheusSync`** e
**`dsProtheus_getSQB_restGetAll`**; a troca de filtro para *Aprovadores SC* reconfigurou os campos
sem erro. O formulário de **Faturamento de Contratos** monta (iframe `256836`) com a seção
**Informações da Medição**. O passo 2 não foi refeito nesta rodada e os passos 6 e 7 dependem de uma
solicitação com integração registrada.
**Divergências encontradas:** ruído de ambiente observado, sem relação com o ERP, que convém não
confundir com regressão de atualização: **HTTP 404** em
`/portal/api/servlet/image/1/custom/logo_image.png` (carga de qualquer formulário de processo),
**404** em `/style-guide/css/fluig-style-guide.min.css` (Portal do Comprador) e **404** em
`ly_portal_fornecedor/resources/js/wcm_widgets_pt_BR.js` (Portal do Fornecedor). Nenhum deles é
dataset do ERP. Além disso, o Portal do Comprador registra
`Erro ao buscar as informações do colaborador na lista de usuários do ERP Protheus. Error: Error:
Comprador não encontrado.` — **limitação da conta de QA**, não efeito de atualização do ERP.
**Dados/massa usados:** nenhum — não submetido.

---

## Resumo do lote

| Caso | Verificado | Bloqueio principal |
|---|---|---|
| CT-FSWTBC-1728 | PARCIAL | etapa 269 exige SC de solicitante sem gestor + cadastro no Protheus |
| CT-FSWTBC-1762 | PARCIAL | cadastro de alçada no ERP + submissão até a etapa |
| CT-FSWTBC-1777 | PARCIAL | versão de RPO só verificável no Protheus; disparo é schedule |
| CT-FSWTBC-1789 | PARCIAL | exige massa **legada** de produção, não fabricável |
| CT-FSWTBC-1792 | PARCIAL | WSDL verificados; falta credencial de fornecedor |
| CT-FSWTBC-1814 | PARCIAL | provocar notificação exige movimentar solicitação |
| CT-FSWTBC-1815 | PARCIAL | contrato com medição aberta (e um com centenas de itens) |
| CT-FSWTBC-1816 | PARCIAL | par de SCs (com e sem aprovador nominal) em alçada |
| CT-FSWTBC-1823 | PARCIAL | conta de QA não resolve comprador; falta credencial de fornecedor |
| CT-FSWTBC-1904 | PARCIAL | gatilho é rotina batch (proibida nesta rodada) |
| **CT-FSWTBC-1906** | **SIM** | **nenhum** — executado em tela, sem submissão |
| CT-FSWTBC-1907 | PARCIAL | cadastro de aprovador orçamentário no Protheus |
| CT-FSWTBC-1932 | PARCIAL | ticket sem descrição; conta não resolve comprador |
| CT-FSWTBC-1942 | PARCIAL | conferência do ERP exige credencial de Protheus |

**Achados novos levantados durante a escrita** (não estavam nos tickets):
1. **Tautologia no Faturamento** — `if (tipoInicioProcesso == 'manual' || 'automático')` é sempre
   verdadeiro; a distinção manual/automático não é aplicada nesse ponto (afeta CT-1777 e CT-1904).
2. **Fornecedor fixo no código** — a montagem da grade de propostas no ramo `ignorarParecer = "Sim"`
   parte com `85070508-0001` já marcado como incluído, excluindo-o da grade (afeta CT-1823).
3. **Número de estado morto** — bloco vazio referenciando `numState == 255` como "Validação
   Orçamentária (Sem Gestor)", enquanto o estado declarado e em uso é **269** (afeta CT-1728).
4. **`/portal/p/1/notificationcenter` não existe** — responde 404; notificações só pelo sino (CT-1814).
5. **`/webdesk` responde 403 na raiz, mas os serviços SOAP abaixo dele respondem 200** — o 403 não
   deve ser lido como "camada SOAP fechada" (CT-1792).

## CT-FSWTBC-2053  (ambos · Concluído · SDCASSI-5)

**Título:** Excluir um item de uma SC rejeitada, reenviá-la, e conferir que o item excluído não volta a ser cotado.

**Origem:** FSWTBC-2053 — processo 25820: SC rejeitada com item excluído; o item não era apagado no
Protheus e voltava a ser carregado no Fluig para cotação. Causa-raiz na subtarefa 2055: "removido
`FWVetByDic` do ExecAuto dos itens; suspeita de falha na organização de array multidimensional" —
com múltiplos itens o array embaralhava a correspondência, e "quando envia mais de 1 item na
alteração, o sistema altera apenas o primeiro".

**Módulo/Rota:** Fluig → **Central de Tarefas** → SC rejeitada, atividade de **Ajustar Informações**
→ grade de **Produtos** (`tbProdutos`). Conferência: **Tracker** → *Filtrar por:* **Produtos/Rateio SC**.

**Pré-condições**
- Uma **Solicitação de Compras rejeitada**, atribuída ao executor, com **pelo menos 3 itens** (o
  defeito só se manifesta com múltiplos itens) e com **rateio cadastrado** em pelo menos um deles.
- **Bloqueio:** a confirmação de que o item sumiu da `SC1` do Protheus exige o ERP — **sem
  credencial**. Ancorado no Fluig por: (a) a grade de **Produtos** após o reenvio; (b) o **Tracker**
  no tipo **Produtos/Rateio SC**, que lista os itens da SC; (c) a etapa de **Cotação**, que é onde o
  item indevido reaparecia. Além disso, exercitar o caso exige **movimentar uma SC**, e a SC precisa
  ser **do próprio executor** — a regra §2 proíbe usar SC alheia.

**Passos**
1. Abrir a SC rejeitada pela **Central de Tarefas** (clicando explicitamente na sub-aba desejada).
2. Na grade de **Produtos**, anotar **todos** os itens e seus números.
3. Excluir um item que **não** seja o primeiro da grade — o defeito envolvia a correspondência de
   arrays com múltiplos itens.
4. No diálogo de confirmação, ler o texto e confirmar com **"Sim, excluir item `<n>`!"**.
5. Conferir que a grade deixou de exibir o item e que a mensagem **"Item excluido!"** apareceu.
6. Excluir um **segundo** item, também fora da primeira posição, repetindo os passos 4 e 5.
7. Movimentar a SC (reenviar após o ajuste).
8. Reabrir a solicitação em modo leitura e conferir a aba **Histórico** e a grade de **Produtos**.
9. Abrir o **Tracker**, tipo **Produtos/Rateio SC**, e pesquisar pelo **Nº do Processo Fluig** da SC.
10. Acompanhar a SC até a etapa de **Cotação** e conferir a relação de itens levados a cotar.

**Resultado esperado**
- Os **dois** itens excluídos somem da grade — não apenas o primeiro.
- Após o reenvio, a grade de **Produtos** contém **exatamente** os itens remanescentes.
- No **Tracker**, tipo **Produtos/Rateio SC**, aparecem **somente** os itens remanescentes.
- Na etapa de **Cotação**, **nenhum** dos itens excluídos é oferecido para cotação.
- O **rateio** vinculado a um item excluído não é levado adiante nem gera linha órfã.
- O **Histórico** registra a integração de alteração com sucesso.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O item excluído no Fluig **não era apagado no Protheus** e **voltava a ser carregado no Fluig para
  cotação** (processo 25820). Com mais de um item alterado, "o sistema altera apenas o primeiro".

**Severidade:** Alta *(cotação e possível compra de item que o requisitante removeu — risco financeiro e de aprovação indevida)*

**Preparação de massa:** uma **SC criada pelo próprio executor**, com **3+ itens** e rateio, levada
até a rejeição por um aprovador, de modo a cair em **Ajustar Informações**. Quem prepara: o próprio
executor cria a SC (com prefixo `QA`), mas **a rejeição exige um aprovador** — que esta rodada não
tem. É o item que falta para executar o caso ponta a ponta.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei no fonte publicado da SC o mecanismo e os textos literais do
diálogo de exclusão (`sc_App_EventHandler.js:98-167`). O handler é
`window['handleDelChild']` → `handleWdkDelChild`, que para a tabela **`tbProdutos`** desvia para
`handleConfirmDelChild`. Os textos exatos são: título **"Tem certeza que quer excluir o item `<n>`?"**,
corpo **"Ao excluir este item mesmo havendo rateio cadastro na planilha o mesmo será ignorado!"**,
e, na confirmação, **"Item excluido!"** / **"Item `<n>` excluido com sucesso!"**; ao cancelar,
**"Exclusão cancelada!"**. Confirmei também que o Tracker tem o tipo **Produtos/Rateio SC**, o que
sustenta o passo 9.
**Divergências encontradas:** três, e duas são achados novos:
(1) **defeito de usabilidade vivo no fonte publicado:** os dois botões do diálogo de exclusão dizem
**"excluir"**. O texto de confirmação é `Sim, excluir item <n>!` e o texto de **cancelamento** é
`Não, excluir item <n>!` (`sc_App_EventHandler.js:137-141`) — o botão que **cancela** está rotulado
como se excluísse. Quem ler rápido cancela achando que exclui, ou o contrário.
(2) **o vetor do defeito continua estrutural:** a exclusão usa a API nativa do Fluig
`fnWdkRemoveChild`, que **não remove a linha — apenas aplica `style="display:none"`**. Todo o código
da SC lê os itens filtrando `tr:not([style="display:none"])`. **Não existe nenhuma marcação de item
deletado no payload**: busca por `AUTDELETA`, `AUTDEL`, `deleta`, `LINPOS` ou flag `"D"` nos fontes
da SC não retorna nada, e não há campo de status por item. Ou seja, **o ERP recebe apenas a lista
remanescente e precisa inferir a exclusão por diferença** — que é exatamente onde o `FWVetByDic`
embaralhava a correspondência. O caso permanece frágil por desenho, mesmo com o defeito corrigido.
(3) o próprio texto do alerta assume que **o rateio do item excluído é "ignorado", não removido** —
o que sustenta o item de resultado esperado sobre rateio órfão.
**Dados/massa usados:** nenhum — nenhuma SC foi aberta em modo edição, nenhum item foi excluído.

---

## CT-FSWTBC-4445  (ambos · Concluído · SDCASSI-380)

**Título:** Encontrar uma SC desviada para "Correção" e ler, no Histórico e no Retorno Integração, o erro real que a desviou — e reenviá-la sem precisar adivinhar.

**Origem:** FSWTBC-4445 — "diversos processos" caindo no grupo de correção com erro **"Undefined"**; bastava
assumir e **reenviar** para concluir. Encerrado como *não é possível reproduzir* (26/05/2026), sem correção.
Herda do SDCASSI-324: a servicetask perde a mensagem real ao subir por `handleDocumentApproval`.

**Módulo/Rota:** Fluig → **Central de Tarefas** (pool `G.P.Requisicao_de_Compras_Correcoes`, atividade
**Correção**, seq 236 do `wf_solicitacao_compras`) → *Detalhes da Solicitação*: abas **Histórico**,
**Informações** e **Formulário** (campo **Retorno Integração**, `erroIntegracao`; combo **Enviar para \***).

**Pré-condições**
- Uma SC em **Correção** por falha de integração (hoje: **113196**, desde 03/09/2026 10:01).
- Membro do grupo `G.P.Requisicao_de_Compras_Correcoes` para assumir/reenviar (a conta de QA já é a
  responsável da 113196).
- **Bloqueio:** reenviar a 113196 é movimentar registro pré-existente — **não executado** (§2). O passo 5 fica
  para o dono do processo.

**Passos**
1. Abrir a SC em Correção pela Central de Tarefas (ou `pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=<nº>`).
2. Aba **Histórico**: ler as entradas de *Grava SC e Anexos* / *Executando atividade de serviço do sistema*.
3. Aba **Formulário**: ler **Retorno Integração** e **Nº da Solicitação ERP**.
4. Aba **Informações**: *Atividade atual* e *Responsável*.
5. *(Dono do processo)* Assumir, escolher em **Enviar para \*** o reenvio e confirmar.
6. Após o reenvio, reler Histórico e **Nº da Solicitação ERP**.

**Resultado esperado**
- O Histórico traz a **mensagem real** do ERP/serviço (código HTTP ou texto do Protheus), nunca `Erro: undefined`.
- **Retorno Integração** exibe a mesma mensagem que desviou o processo — o usuário não precisa abrir o Histórico.
- Reenvio de uma falha transitória conclui *Grava SC e Anexos*, preenche **Nº da Solicitação ERP** e o processo
  segue para *Compra Centralizada?* / *Validação do Gestor*.
- Falha persistente (não transitória) volta a Correção com a mesma mensagem legível.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Processo em Correção com **"Erro: undefined"**; reenviar resolve sem que ninguém saiba o que falhou.

**Severidade:** Média *(bloqueia o fluxo e esconde a causa; efeito em escala)*

**Preparação de massa:** uma SC em Correção — hoje existe (113196). Para gerar uma nova, criar SC `QA` durante
janela de instabilidade do Protheus (ver `docs/estabilidade-do-ambiente.md`).

**Verificado em tela:** PARCIAL
**O que foi verificado:** SC **113196** aberta em modo leitura. **Informações**: *Atividade atual* = **Correção**,
*Responsável* = Usuário TBC (TOTVS). **Histórico** (mais recente primeiro): "Usuário TBC (TOTVS) assumiu a
tarefa Correção" (03/09 11:37:26); "Grava SC e Anexos movimentou … para a atividade Correção" (10:01:12) com
`Atividade de serviço executada com falha: Tentativa: 3 - Erro java.lang.Exception: Cannot convert NaN to
java.lang.Integer (servicetask233#267) - Tempo de Execução 70 s`; tentativas 2 (09:51:07, 66 s, "Nova tentativa
em 03/09 10:00") e 1 (09:42:34, 65 s); antes, *Compra Centralizada?* "Decisão tomada conforme condição 2" e
início por Geise Campos Silva Matias às 09:41:24 com dois anexos. **Formulário**: `numSolCompra` vazio,
`erroIntegracao` **vazio**. REST `/requests/113196/tasks`: movimento 1 na seq **294 Compra Centralizada?**
(`GATEWAY_EXCLUSIVE`), movimento 2 na seq **233 Grava SC e Anexos** (`TASK_SERVICE`). Não reenviado.
**Divergências encontradas:** (1) o Fluig **tem** retentativa automática (3 tentativas, ~9 min) — o ticket
afirma que não há; (2) a mensagem aqui é concreta (`NaN`), não "undefined" — o mascaramento está em outro
caminho (`handleDocumentApproval`, seq 287), não no 233; (3) **Retorno Integração vazio** numa SC em Correção
por erro — o campo não cumpre o papel de mostrar a causa; (4) o ticket fala em "grupo de correção", a tela chama
**Correção** com pool `G.P.Requisicao_de_Compras_Correcoes`.
**Dados/massa usados:** SC 113196 — leitura.

---

## CT-FSWTBC-4581  (ambos · Concluído · SDCASSI-416)

**Título:** Solicitante cancela a própria SC ainda na etapa *Início*

**Origem:** FSWTBC-4581 — erro ao cancelar as SCs 97836 e 97844 na etapa de Início. Quinto defeito distinto no caminho de
cancelamento em três meses; corrigido (PR67859) sem causa documentada.

**Módulo/Rota:** Central de Tarefas → *Minhas solicitações* → SC em **Início** → botão **Cancelar Solicitação**
(detalhes da solicitação) → *Histórico*

**Pré-condições**
- SC **própria**, criada pelo executor (`QA`), ainda em **Início** (não enviada / não integrada).
- **Bloqueio:** nenhum — desde que seja SC própria. **Nunca** cancelar as 51 SCs de terceiros em Início.

**Passos**
1. Iniciar uma SC (`QA` na justificativa) e **não** enviar; localizá-la em *Minhas solicitações*.
2. Abrir os detalhes e clicar em **Cancelar Solicitação**; informar justificativa `QA cancelamento etapa Início`; confirmar.
3. Ler a mensagem exibida e o *Histórico*.
4. Voltar à Central de Tarefas e procurar a SC.

**Resultado esperado**
- Atividade atual **Solicitação cancelada**; Histórico com "Processo cancelado por: <usuário> - <justificativa>".
- Sem mensagem de erro; a SC some de *Tarefas a concluir*.

**Resultado se o defeito reincidir**
- Erro ao confirmar o cancelamento (print do ticket); SC continua em Início.

**Severidade:** Média (bloqueia o fluxo de reversão)

**Preparação de massa:** SC própria em Início, criada pelo executor no momento do teste.

**Verificado em tela:** PARCIAL
**O que foi verificado:** botão **Cancelar Solicitação** visto renderizado nos detalhes das solicitações 112830, 113249 e
111980; SC **113237** (criada pela conta de QA) mostra o resultado de um cancelamento **na etapa Início** feito em
03/09/2026 16:30 — "Solicitação cancelada" / "Processo cancelado por: Gestor Usuário TBC (TOTVS) - QA limpeza automatizada
pos-execucao" — ou seja, o caminho funciona hoje (via API de cancelamento da suíte, não pelo botão). Não executei
cancelamento nesta sessão.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** SC 113237 (leitura); nada cancelado por mim.

---

## CT-FSWTBC-4625  (ambos · Concluído · SDCASSI-428)

**Título:** Cancelar, no Fluig, uma SC cuja cotação já foi cancelada no Protheus — e ver os dois lados encerrados de forma coerente

**Origem:** FSWTBC-4625 — não era possível cancelar a SC 64267 no Fluig, mesmo após migrar a versão do formulário e com a cotação
já cancelada no Protheus (ERP e Fluig com verdades diferentes sobre o mesmo documento). Encerrado como "Não será feito", por
duplicidade com o SDCASSI-406, "resolvido em sala". A instância 64267 hoje consta `CANCELED` (encerrada em **14/08/2026**, quase três
meses depois do chamado), após duas conversões de versão (72→75→77) em 14/07.

**Módulo/Rota:** Fluig → Central de Tarefas → abrir a solicitação (`pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=<n>`)
→ botão **Cancelar Solicitação** (rodapé da tela da solicitação) · alternativa do comprador: Portal do Comprador → *Controle de
Cotações* → ação **Cancelar Solicitação** (`cancelQuotes` → `handlePurchasesDelet` + `dsFluig_postProcessesCancel`).

**Pré-condições**
- Usuário **gestor do processo** (ou solicitante) com o botão *Cancelar Solicitação* visível na solicitação.
- Uma SC **criada pelo executor** (prefixo `QA` na justificativa) que já tenha gerado cotação no ERP (`Nº da Cotação ERP` preenchido
  no Tracker) e cuja cotação tenha sido cancelada no Protheus pelo comprador.
- **Bloqueio:** a conta de QA não é gestora de processo nem comprador; a etapa "cotação cancelada no Protheus" exige credencial de
  comprador/Protheus. Não cancelar registro pré-existente.

**Passos**
1. Abrir a SC do executor e conferir no **Histórico** a última movimentação e a versão do processo (linha "Converteu o processo …" se houver).
2. No Tracker (`PORTAL_TRACKER_COMPRAS_CONTRATOS`, visão *Solicitação de Compras*, filtro `numProcesso`), anotar `Nº da Solicitação ERP`
   e `Nº da Cotação ERP`.
3. Na solicitação, clicar **Cancelar Solicitação**, informar justificativa com prefixo `QA` e confirmar.
4. Reabrir o Histórico da SC e o Tracker.
5. Repetir os passos 3–4 numa SC de **versão antiga** do processo (Histórico sem "Converteu o processo … para a versão 98").

**Resultado esperado**
- O cancelamento conclui sem erro; o Histórico registra "Processo cancelado por: …" e o Tracker passa a `Status=CANCELADA` (como a
  64267 mostra hoje: `Status=CANCELADA`, `Nº da Solicitação ERP=000667`, `Nº da Cotação ERP=000397`).
- Se a cotação já estava cancelada no ERP, o Fluig **não** bloqueia o cancelamento por isso: o estado dos dois lados converge.
- Pela via do comprador, as mensagens são, nesta ordem: *"O cancelamento da solicitação de compras N no ERP Protheus foi executado com
  sucesso!"* e *"O cancelamento do processo X da solicitação de compras N no Fluig foi executado com sucesso!"*; em falha real,
  *"Não foi possível executar o cancelamento da solicitação de compras N!"* — nunca sucesso com o processo ainda vivo.
- SC de versão antiga se comporta igual à atual **sem** exigir conversão manual de versão.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro ao clicar em cancelar (prints do ticket, sem mensagem transcrita); SC continua ativa no Fluig com a cotação já cancelada no ERP;
  "migrar a versão do formulário" não resolve.

**Severidade:** Alta

**Preparação de massa:** SC própria com cotação gerada e cancelada no ERP (exige comprador + Protheus). Sem isso, o caso só
caracteriza o caminho (botão presente, mensagens do fonte).

**Verificado em tela:** PARCIAL
**O que foi verificado:** botão **"Cancelar Solicitação"** visto renderizado no rodapé das solicitações 113196, 111980, 112312, 113249 e
112830 (modo leitura); instância **64267** pela API: `status=CANCELED`, v77, `endDate=2026-08-14`, Histórico com 12 entradas incluindo
as conversões 72→75 e 75→77 em 14/07/2026 (Luis Felipe da Silva Andrade); Tracker da 64267: `Status=CANCELADA`, filial 5303. Mensagens
de sucesso/erro e o dataset `dsFluig_postProcessesCancel` (**existe**, 200 no GET search) lidos no fonte publicado `pc_main.js`.
**Divergências encontradas:** o ticket fala em "cancelar a SC"; a ação do Portal do Comprador chama-se **"Cancelar Solicitação"** e faz
duas etapas (ERP e depois Fluig). Ver achado **A2-c**: um 404 do dataset de cancelamento cai no ramo de sucesso — provável causa raiz
da família. A 64267 só foi cancelada em 14/08/2026, após conversão de versão — coerente com a barreira "versão do processo" do
SDCASSI-438.
**Dados/massa usados:** nenhum — não submetido; leitura de 64267 e das instâncias vivas.

---
