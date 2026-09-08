<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# RH e Administrativos

Casos de teste E2E do Fluig — módulo RH e Administrativos.

| | |
|---|---|
| Casos neste arquivo | 8 |
| Verificados em tela | 1 total · 7 parcial · 0 não |

> **Como ler.** Cada caso descreve o comportamento **correto esperado hoje**. A maioria dos
> defeitos de origem já foi corrigida — o caso é de regressão: se reprovar, o defeito voltou.
> Os que reprovam hoje por causa nunca corrigida estão marcados no próprio caso.
> *Verificado em tela* diz o que foi conferido no ambiente de homologação em 08/09/2026;
> **PARCIAL** costuma significar que a conta de QA não tem o perfil necessário (comprador,
> gestor, fiscal, fornecedor), não que o caso seja inválido.

---

## CT-FSWTBC-648  (protheus · Concluído)

**Título:** Verificar que a árvore hierárquica (Gestão de Equipes) e a resolução de gestor não retornam colaboradores demitidos

**Origem:** FSWTBC-648 — "[DEM10011432] ERRO02 – Retornos demitidos": a árvore hierárquica retornava colaboradores demitidos; falha de filtro de situação no RH que contamina aprovações (gestor demitido recebendo tarefa).

**Módulo/Rota:** Fluig → Home → aba **Gestão** → **Gestão de Equipes** (`/portal/p/1/gestao_equipes`); dataset **`dsProtheus_getArvoreHierarquica_restGetAll`** (filtro `CorporateId, BranchId, ISMANAGER, CODESEARCH`; coluna **`RA_SITFOLH`**); consumidor secundário: grade **Gestor Imediato** (`tbManager`) da SC. No ERP: **SIGAGPE → Funcionários (GPEA010)**, situação de folha `RA_SITFOLH` (`A` ativo, `F` férias, `D` demitido…), estrutura **RD4** (postos).

**Pré-condições**
- Usuário gestor com matrícula ativa no Protheus (a árvore só monta para gestor).
- Na estrutura RD4, um posto ocupado por funcionário **demitido** (`RA_SITFOLH = D`, `RA_DEMISSA` preenchida) e outro posto **vago**.
- **Bloqueio:** parcial — a conta de QA não é gestor (*"Usuário não encontrado no ERP Protheus."*); a chamada de leitura ao dataset é possível e foi feita.

**Passos**
1. Abrir **Gestão de Equipes** com o gestor; expandir a árvore até o posto do demitido e até o posto vago.
2. Em leitura, chamar `GET /api/public/ecm/dataset/search?datasetId=dsProtheus_getArvoreHierarquica_restGetAll&limit=300` e, com o filtro do widget, `…&filterFields=CorporateId,01,BranchId,<filial>,ISMANAGER,true,CODESEARCH,<matrícula do gestor>`; ler `RA_MAT`, `RA_NOME`, `RA_SITFOLH` de cada nó.
3. Criar uma SC (prefixo `QA`) com um solicitante cujo gestor imediato no RD4 seja o demitido; abrir a instância em **Validação do Gestor** e ler a grade **Gestor Imediato** e o *Responsável* da tarefa.

**Resultado esperado**
- Passo 1: o demitido **não aparece** na árvore; o posto dele aparece como **POSTO VAGO** (classe `learning`) ou com o substituto.
- Passo 2: nenhum nó com `RA_SITFOLH = D`; nó sem ocupante vem com `RA_MAT` vazio.
- Passo 3: a tarefa **não** é atribuída ao demitido — cai no substituto/pool com erro visível, nunca numa pessoa desligada.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Demitidos listados na árvore como se ativos; tarefas de aprovação atribuídas a quem já saiu; mensagem exata `<não documentado>`.

**Severidade:** Alta *(aprovação/alçada indo para pessoa desligada)*

**Preparação de massa:** um funcionário demitido em posto da RD4 e um gestor de teste — cadastro de RH no Protheus (fora do alcance da automação); uma SC própria para o passo 3.

**Verificado em tela:** PARCIAL
**O que foi verificado:** widget aberto (modal *"Usuário não encontrado no ERP Protheus."*); fontes `DataHandler_pt_BR.js` e `EventHandler_pt_BR.js` lidos — filtros do dataset, `if (data.RA_MAT == '')` → *POSTO VAGO*, e **`// case 'D': //Demitidos` comentado** (4 ocorrências). Dataset chamado em leitura sem filtro: **27 nós**, `RA_SITFOLH` = A (6) / F (2) / vazio (19), **nenhum D**, 2 postos sem `RA_MAT`. Com `ISMANAGER,true,CODESEARCH,00008161` devolve o próprio gestor (`80000228 / A`) em 4 chamadas idênticas (~17 s cada).
**Divergências encontradas:** **19 dos 27 nós vêm com `RA_SITFOLH` vazio** — se o filtro de demitido depende dessa coluna, ela não é confiável para 70 % da amostra; o tratamento de "Demitidos" no front está **comentado**, então a exclusão (se existe) é só no dataset/ERP. Posto 80001860 (do FSWTBC-688) não está nos nós de topo.
**Dados/massa usados:** nenhum — chamadas `GET` de leitura com `limit`.

---

## CT-FSWTBC-689  (fluig · Concluído)

**Título:** Usuário do RH inicia o processo de Aprovação de Ocorrência e a solicitação nasce e chega à etapa de aprovação sem erro.

**Origem:** FSWTBC-689 — "[Suporte Fev/2025 - DEM10011432] - Erro execução do processo de
aprovação". Ticket **sem descrição**, aberto e fechado no mesmo dia com uma única transição; o
conteúdo se perdeu. Pela DEM (10011432) é o mesmo incidente de FSWTBC-690/691, que nomeiam o
processo: **Aprovação de Ocorrências**. Caso escrito como caracterização de caminho.

**Módulo/Rota:** Processos → **Iniciar Solicitações** → *Aprovação de Ocorrência*
(`/portal/p/1/pageworkflowview?processID=wf_aprovacao_ocorrencia`), categoria RH.

**Pré-condições**
- Usuário pertencente ao grupo de RH que tem permissão de **iniciar** `wf_aprovacao_ocorrencia`.
- Uma ocorrência de ponto/RH pendente de aprovação para o colaborador.
- Aprovador (gestor) cadastrado e resolvível para o solicitante.
- **Bloqueio:** **sim.** A conta de QA `TOTVS-FS` **não tem permissão de início** deste processo —
  verificado hoje. E a base **não tem nenhuma instância** de `wf_aprovacao_ocorrencia` (0 em
  `/process-management/api/v2/requests?processId=wf_aprovacao_ocorrencia`), então também não há
  instância em andamento para observar. Exige credencial de RH, que não existe nesta rodada.

**Passos**
1. Autenticar com usuário do grupo de RH.
2. Abrir **Processos → Iniciar Solicitações** e localizar *Aprovação de Ocorrência*.
3. Abrir o processo e preencher os campos obrigatórios do formulário.
4. Clicar em **Enviar**.
5. Abrir a **Central de Tarefas** (`/portal/p/1/pagecentraltask`) → aba **Tarefas a concluir** e
   localizar a solicitação recém-criada.
6. Abrir a solicitação e ler a aba **Histórico**.

**Resultado esperado**
- O formulário **carrega** (heading *Início*, abas *Formulário / Informações / Histórico / Anexos*,
  botão **Enviar**) — não aparece o modal de erro.
- O **Enviar** conclui: a solicitação recebe número e sai da etapa de Início.
- A tarefa aparece para o aprovador na **Central de Tarefas**.
- A aba **Histórico** não registra exceção; a movimentação consta com data/hora e responsável.

**Resultado se o defeito reincidir**
- Erro na execução do processo de aprovação — a solicitação não avança. Mensagem/stack exatos
  `<não documentado>`: o ticket foi fechado no mesmo dia sem registro de conteúdo.

**Severidade:** Média *(bloqueia o fluxo de aprovação de ocorrências de RH; sem impacto financeiro direto)*

**Preparação de massa:** credencial de um usuário do grupo de RH com permissão de início de
`wf_aprovacao_ocorrencia` (a fornecer pela CASSI) + uma ocorrência pendente para o colaborador.
Nada disso é criável pela conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o processo **existe publicado** (`wf_aprovacao_ocorrencia` — "Aprovação
de Ocorrência", presente entre os 34 processos). Ao abrir
`/portal/p/1/pageworkflowview?processID=wf_aprovacao_ocorrencia` a página carrega com título
*Cassi - Fluig Plataforma - Movimentar Solicitação*, heading **Erro** e a mensagem exata
*"Usuário TOTVS-FS não possui permissão para iniciar solicitações do processo
wf_aprovacao_ocorrencia"*, com *Ver detalhes técnicos* e botão **Ok, entendi** — **nenhum**
formulário monta. A base tem **0 instâncias** deste processo.
**Divergências encontradas:** a recusa de permissão é servida como **HTTP 500** em
`GET /ecm/api/rest/ecm/workflowView/getDefinitionProcess?processId=wf_aprovacao_ocorrencia&taskUserId=TOTVS-FS`
(código `NotFoundException` no corpo), embora a tela mostre a mensagem correta. Semanticamente
deveria ser 403 — achado de qualidade, não relacionado ao defeito do ticket.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-690  (FSWTBC-690 · ambos · Concluído)

**Título:** Iniciar o processo de Aprovação de Ocorrências a partir do Protheus e confirmar que a solicitação é criada no Fluig sem erro no start.

**Origem:** FSWTBC-690 — erro no start do processo de aprovação de ocorrências, lado Protheus. Par do
FSWTBC-691 (lado Fluig): o mesmo defeito aberto duas vezes, um ticket por sistema.

**Módulo/Rota:** Protheus (rotina de ocorrências que dispara o start) → Fluig, processo
**`wf_aprovacao_ocorrencia`** (`/portal/p/1/pageworkflowview?processID=wf_aprovacao_ocorrencia`);
acompanhamento pela **Central de Tarefas**.

**Pré-condições**
- Ocorrência registrada no Protheus, no estado que dispara a aprovação.
- Usuário/serviço integrador com **permissão de início** sobre `wf_aprovacao_ocorrencia` no Fluig.
- **Bloqueio:** duplo e confirmado em tela. (1) O gatilho é uma rotina do **Protheus** — **sem
  credencial**. (2) O processo **não pode ser iniciado por este perfil no Fluig**: a mensagem exata
  devolvida hoje é *"Usuário TOTVS-FS não possui permissão para iniciar solicitações do processo
  wf_aprovacao_ocorrencia"*. Executar exige a conta de integração ou um perfil de RH autorizado.

**Passos**
1. No Protheus, registrar/liberar a ocorrência que dispara a aprovação.
2. Aguardar o disparo do start do processo `wf_aprovacao_ocorrencia` no Fluig.
3. No Fluig, abrir a **Central de Tarefas** e localizar a solicitação de **Aprovação de Ocorrências** recém-criada.
4. Abrir a solicitação e conferir a aba **Histórico**, verificando o registro do start e da atividade inicial.
5. Conferir que os dados da ocorrência vieram preenchidos no formulário.

**Resultado esperado**
- O start do processo **conclui sem erro**: a solicitação de Aprovação de Ocorrências é criada no Fluig.
- A solicitação aparece na Central de Tarefas do aprovador designado.
- O **Histórico** registra a criação e a movimentação para a primeira atividade, sem exceção de integração.
- Os dados da ocorrência originados no Protheus chegam preenchidos no formulário.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro no start do processo de aprovação de ocorrências: a solicitação não é criada no Fluig a partir
  do Protheus. `<mensagem exata não registrada no ticket>`

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei o estado de permissão que condiciona o caso. Ao acessar
`/portal/p/1/pageworkflowview?processID=wf_aprovacao_ocorrencia` a tela carrega as abas *Formulário /
Informações / Histórico / Anexos* e sobrepõe o modal **Erro** com o texto **"Usuário TOTVS-FS não possui
permissão para iniciar solicitações do processo wf_aprovacao_ocorrencia"**, com o link *Ver detalhes
técnicos* e o botão *Ok, entendi*; **nenhum formulário carrega**. Confirmei também que *Aprovação de
Ocorrências* **não** consta da lista de *Todos os processos* em *Iniciar Solicitações* para esta conta —
as categorias visíveis são *Categoria sem nome* (1), *ADM* (1), *ADMIN* (1), *Compras* (6),
*Contratos* (2), *Financeiro* (1), *Questionarios* (1), *RH* (5), *Tarefas Gerais* (1) e
*TOTVS Juridico* (4). O start pelo Protheus não foi exercitado.
**Divergências encontradas:** nenhuma. Registro útil ao executor: o bloqueio de início é **por
processo**, não por categoria — `wf_pagamento_horas_extras`, `wf_automacao_admissao` e
`wf_substituicaocargos`, da mesma categoria RH, abrem normalmente para este perfil.
**Dados/massa usados:** nenhum — não submetido. Somente leitura.

---

## CT-FSWTBC-691  (fluig · Concluído)

**Título:** O start do processo de Aprovação de Ocorrências, disparado pelo lado Fluig, cria a solicitação sem erro.

**Origem:** FSWTBC-691 — "[Suporte Fev/2025 - DEM10011432] - Erro no start do processo de
aprovação de ocorrências - (Fluig)". Par de FSWTBC-690, que registra o **mesmo** incidente pelo
lado Protheus. Passou por "Aguardar Aplicar em Produção", ou seja, houve **deploy** de correção.
Ticket sem descrição.

**Módulo/Rota:** `wf_aprovacao_ocorrencia` — *start* da solicitação, seja pela tela
(**Iniciar Solicitações** → *Aprovação de Ocorrência*) seja pela API de start disparada pela
integração (`POST /process-management/api/v2/processes/wf_aprovacao_ocorrencia/start`).

**Pré-condições**
- Usuário/serviço com permissão de início de `wf_aprovacao_ocorrencia`.
- Integração Protheus → Fluig ativa, se o start for disparado pelo ERP (é o cenário de
  FSWTBC-690, o par deste ticket).
- **Bloqueio:** **sim** — mesmo bloqueio de CT-FSWTBC-689: a conta de QA não inicia este processo
  e não há credencial de RH nem de administrador. Não se dispara o start pela API por conta
  própria: seria escrita não rastreável num processo de RH real.

**Passos**
1. Disparar o start do processo — pela tela (**Iniciar Solicitações** → *Aprovação de Ocorrência*
   → preencher → **Enviar**) ou pelo consumidor da integração que faz o start.
2. Anotar o número da solicitação retornado.
3. Abrir a solicitação em **Processos → Consultar Solicitações** e ler a aba **Histórico**.
4. Conferir na **Central de Tarefas** que a tarefa da primeira etapa foi gerada com responsável.

**Resultado esperado**
- O start retorna **sucesso** e devolve o `processInstanceId` — não devolve exceção.
- A solicitação nasce na primeira atividade do fluxo, com responsável atribuído (não fica órfã).
- O **Histórico** registra a criação e, se o start veio da integração, a linha de integração
  executada com sucesso (padrão do ambiente: *"Integração executada com sucesso - Tempo de
  Execução N s"*).
- Nenhuma instância fica presa no marco de Início.

**Resultado se o defeito reincidir**
- O start falha e a solicitação não é criada (lado Fluig). Mensagem/stack exatos
  `<não documentado>` — o ticket não guarda descrição nem evidência.

**Severidade:** Alta *(o start é a porta do processo: falhando, a ocorrência do colaborador não entra em aprovação e o caso se perde silenciosamente do lado do ERP — ver o par FSWTBC-690)*

**Preparação de massa:** credencial de RH com permissão de início (CASSI) **ou** acesso ao
consumidor da integração que dispara o start; e uma ocorrência a aprovar. Nenhum dos dois está
disponível para a conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** processo publicado e alcançável por URL; o start pela tela é recusado
para a conta de QA com a mensagem *"Usuário TOTVS-FS não possui permissão para iniciar
solicitações do processo wf_aprovacao_ocorrencia"*. `GET /process-management/api/v2/requests?processId=wf_aprovacao_ocorrencia`
retorna **0 instâncias** — nenhum start bem-sucedido registrado nesta base, o que impede confirmar
o comportamento corrigido por observação de instância real.
**Divergências encontradas:** mesma de CT-FSWTBC-689 — a recusa de permissão viaja como **HTTP 500**
(`NotFoundException`) no `getDefinitionProcess`, com a tela exibindo a mensagem correta.
Além disso, o processo consta publicado mas **nunca foi executado nesta base**, o que o torna
invisível para qualquer regressão automatizada aqui.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1401  (fluig · Concluído)

**Título:** O colaborador abre a Solicitação de Férias e os campos customizados da CASSI aparecem preenchidos e validados.

**Origem:** FSWTBC-1401 — "[CASSI - BH] - Solicitação de Férias] - Campos Customizados da
solicitação de férias". Ticket **sem descrição**, mas com **MIT010 anexada** ("Campos Customizados
da solicitação de férias", PDF de 246 KB). Ficou 69 dias em homologação. Caso escrito como
caracterização de caminho.

**Módulo/Rota:** Processos → **Iniciar Solicitações** → *Solicitação de Férias*
(`/portal/p/1/pageworkflowview?processID=wf_solicitacao_ferias`), categoria RH. Página
complementar *Gestão de Férias* (`/portal/p/1/gestao_ferias`).

**Pré-condições**
- Usuário do grupo de RH com permissão de **iniciar** `wf_solicitacao_ferias`.
- Colaborador com matrícula ativa no Protheus e **período aquisitivo de férias disponível** — sem
  isso o formulário não monta os campos (a conta de QA não é funcionário no ERP).
- A MIT010 do ticket em mãos, para conferir campo a campo o que foi homologado.
- **Bloqueio:** **sim.** A conta de QA **não tem permissão de início** de `wf_solicitacao_ferias`
  (verificado hoje) e a base tem **0 instâncias** do processo. Sem credencial de RH, os campos
  customizados não são observáveis. Some-se: a rota `/portal/p/1/gestao_ferias` responde
  `errorPage/404` (defeito U-01 já mapeado neste ambiente).

**Passos**
1. Autenticar com usuário do grupo de RH.
2. Abrir **Iniciar Solicitações** → *Solicitação de Férias*.
3. Conferir, contra a **MIT010** do ticket, cada campo customizado: presença, rótulo,
   obrigatoriedade e valor inicial.
4. Deixar em branco um campo customizado marcado como obrigatório e tentar **Enviar**.
5. Preencher tudo e enviar; abrir a solicitação criada e reler os campos customizados.

**Resultado esperado**
- **Todos** os campos customizados especificados na MIT010 estão presentes, com o rótulo e a
  obrigatoriedade homologados.
- Campos derivados do cadastro do colaborador (matrícula, período aquisitivo, saldo) vêm
  **preenchidos automaticamente** e coerentes com o Protheus.
- Campo customizado obrigatório em branco **impede** o envio, com crítica citando o campo.
- Após o envio, os valores dos campos customizados são **persistidos** e reaparecem íntegros ao
  reabrir a solicitação.

**Resultado se o defeito reincidir**
- Campos customizados ausentes, com rótulo divergente da MIT010, sem preenchimento automático ou
  não persistidos. Sintoma exato `<não documentado>` — o ticket não tem descrição; a única fonte é
  a MIT010 anexada.

**Severidade:** Média *(apresentação/coleta de dado no processo de férias; não há risco financeiro nem de aprovação indevida)*

**Preparação de massa:** credencial de usuário de RH com permissão de início de
`wf_solicitacao_ferias` (a fornecer pela CASSI) e um colaborador com período aquisitivo aberto.
Necessário também o **conteúdo legível da MIT010** — ver divergências.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o processo **existe publicado** (`wf_solicitacao_ferias` — "Solicitação
de Férias", entre os 34 processos). Ao abrir
`/portal/p/1/pageworkflowview?processID=wf_solicitacao_ferias`, a página carrega com heading
**Erro** e a mensagem exata *"Usuário TOTVS-FS não possui permissão para iniciar solicitações do
processo wf_solicitacao_ferias"* (com *Ver detalhes técnicos* e **Ok, entendi**); **nenhum**
formulário monta, e portanto nenhum campo customizado é observável.
`GET /process-management/api/v2/requests?processId=wf_solicitacao_ferias` retorna **0 instâncias**.
**Divergências encontradas:** (1) o PDF da MIT010 anexado ao ticket é **composto de imagens** — não
tem texto extraível, então a lista de campos customizados homologados não pôde ser conferida
automaticamente; quem executar o caso precisa abrir o PDF visualmente. (2) A recusa de permissão
trafega como **HTTP 500** (`NotFoundException`) no `getDefinitionProcess`, com a tela exibindo a
mensagem correta. (3) A página *Gestão de Férias* (`/portal/p/1/gestao_ferias`) cai em
`errorPage/404` — defeito de deep-link já conhecido deste ambiente.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3918  (fluig · Concluído · SDCASSI-267)

**Título:** Registrar uma delegação informando o período completo, com data inicial e data final.

**Origem:** FSWTBC-3918 — a tela do "ato de delegação" estava incompleta: faltavam itens básicos, citando
nominalmente a **data final**, sem a qual o período da delegação ficava aberto. Corrigido em 26/02 e
homologado pela área em 18/03/2026.

**Módulo/Rota:** Processos → Iniciar Solicitações → **Delegação de Tarefas**
(`/portal/p/1/pageworkflowview?processID=wf_SubstituiçãoCargosFluig`)

**Pré-condições**
- Usuário autenticado no Fluig com permissão de iniciar o processo **Delegação de Tarefas**.
- Um segundo usuário ativo para figurar como **Usuário Delegado**.
- **Bloqueio:** nenhum para a inspeção da tela. Para concluir a delegação seria preciso submeter o
  processo, o que não foi feito por opção (§2 do briefing).

**Passos**
1. Abrir o processo **Delegação de Tarefas** (menu Processos → Iniciar Solicitações, ou a rota acima).
2. Conferir a seção **Identificação do Processo / Solicitante** (Nº do Processo, Solicitante, Email do
   Solicitante, Data da Solicitação, Hora da Solicitação) — preenchida automaticamente.
3. Preencher **Usuário Responsável Pela Atividade:** e **Usuário Delegado:** pelos respectivos zooms.
4. Preencher **Data Inicial \*** e **Data Final \*** (campos de data — aceitam **somente o formato ISO `aaaa-mm-dd`**).
5. Selecionar os itens em **Processos:** e preencher **Observação**.
6. Tentar enviar deixando **Data Final** em branco.

**Resultado esperado**
- O campo **Data Final \*** **existe na tela**, é editável e está marcado como obrigatório.
- Com **Data Final** em branco, o envio é **bloqueado** com crítica de campo obrigatório — a delegação não
  pode nascer com período aberto.
- Preenchidos início e fim, o período da delegação fica delimitado e visível na própria tela.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A tela não oferece campo de **data final**: só é possível informar o início, e a delegação fica sem
  limite de término.

**Severidade:** Média *(delegação sem término é delegação permanente — afeta quem pode atuar em nome de quem, mas não movimenta valor diretamente)*

**Preparação de massa:** um segundo usuário ativo no Fluig para ser o delegado. Nenhuma massa de Compras
ou de contrato é necessária.

**Verificado em tela:** SIM (total)
**O que foi verificado:** o formulário abre com o título de seção **"Delegação de Tarefas"** e contém, na
ordem: **Nº do Processo \***, **Solicitante \***, **Email do Solicitante \***, **Data da Solicitação \***,
**Hora da Solicitação \***, **Usuário Responsável Pela Atividade:** (`zoomColleague`), **Usuário Delegado:**
(`zoomColleague2`), **Data Inicial \*** (`substitutoDtInicial`, `input type=date`), **Data Final \***
(`substitutoDtFinal`, `input type=date`), **Processos:** (`zoomProcessos`), **Observação**
(`observacoes_delegacao`), e mais adiante **Justificativa \*** e **Aprovado?**. Ambos os campos de data
estão **visíveis e marcados como obrigatórios** — a lacuna do ticket está fechada.
**Divergências encontradas:** **duas.** (1) Não existe no ambiente nenhuma tela chamada **"Ato de Delegação"**.
Os dois processos de delegação publicados são **"Delegação de Tarefas"** (`wf_SubstituiçãoCargosFluig`) e
**"Delegação de Fiscais de Contrato/Serviço"** (`wf_delegacaoFiscalContratoServico`) — o nome do ticket é
informal. (2) O ticket pede "data final **para filtro**", sugerindo uma tela de consulta de delegações; o que
existe são **Data Inicial/Data Final como campos do próprio pedido de delegação** (o período delegado), não
filtros de uma listagem. Não localizei nenhuma tela de consulta/listagem de delegações com filtros — se ela
existir, está fora do menu desta conta.
**Dados/massa usados:** nenhum — formulário apenas inspecionado, não submetido.

---

## CT-FSWTBC-4198  (ambos · Concluído · SDCASSI-316)

**Título:** Agendar férias pelo Fluig, receber o aviso de férias para aceite e, após o processamento, obter o recibo — com nome completo e lotação corretos.

**Origem:** FSWTBC-4198 — aviso de férias não disponibilizado e recibo ausente após processamento.
Achado de governança: `dts_getControleAceiteAvisoFerias` roda em produção **fora do GIT e da MIT010**.
Defeitos colaterais: `token_expired or user blocked` na aprovação, modelos não carregavam, download sem
retorno, nome truncado (lido do usuário Fluig em vez da SRA) e lotação errada (resíduo de teste).

**Módulo/Rota:** Fluig → **Solicitação de Férias** (`wf_solicitacao_ferias`) · widget de aviso de
férias (rota `<não documentado>`) · formulário **"Controle de Aceite ou Recusa de Aviso/Recibo de
Férias"** · datasets `dts_getAvisosFerias` (colunas **IDSOLIC, NOME, EMAIL, MATRICULA, CIC, DIASFERIAS,
DATAINI, DATAFIM, NUMCP, DEPTO, RESPOSTA, FOLDERID, ACEITEAVISO**) e `dts_getControleAceiteAvisoFerias`.

**Pré-condições**
- Colaborador com saldo de férias na SRA e gestor aprovador; token de integração válido.
- **Bloqueio:** nesta base o processo **não abre** para a conta de QA (modal "Erro", HTTP 500 em
  `getDefinitionProcess`), tem **0 movimentos**, a rota `gestao_ferias` é 404 e o dataset de aceite
  responde **"Usuário sem permissão para consultar esse dataset."**

**Passos**
1. Abrir **Solicitação de Férias**, informar período e enviar.
2. Aprovar no fluxo (gestor).
3. Como colaborador, abrir o widget de avisos: conferir **NOME**, **DEPTO** (lotação), **DATAINI/DATAFIM**,
   **DIASFERIAS**.
4. Aceitar o aviso.
5. Após o processamento da folha, abrir o widget e baixar o **recibo**.

**Resultado esperado**
- Passo 3: o aviso aparece **logo após o agendamento**, com **nome completo (da SRA)** e **lotação real**.
- Passo 4: `ACEITEAVISO` registrado; nenhum `token_expired`.
- Passo 5: o download **devolve o documento**; modelo carregado.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Aviso não disponibilizado; recibo ausente; botão de download chama o dataset e não retorna nada;
  nome truncado e lotação "São Paulo"; `token_expired or user blocked` ao aprovar (processo 66659).

**Severidade:** Média

**Preparação de massa:** colaborador de teste com saldo de férias na SRA, gestor cooperante e ciclo de
folha processado — **não criável pelo executor**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** `pageworkflowview?processID=wf_solicitacao_ferias` → título "Movimentar
Solicitação", cabeçalho **"Erro"**, botão **"Ok, entendi"**, `500 /ecm/api/rest/ecm/workflowView/
getDefinitionProcess`. `/portal/p/1/gestao_ferias` → **"Recurso não foi encontrado."** (404). Catálogo
lista `wf_solicitacao_ferias | Solicitação de Férias`; `activities` → **0 movimentos**.
`dts_getAvisosFerias` → 200 com as 13 colunas acima e 0 linhas; `dts_getControleAceiteAvisoFerias` →
200 com a mensagem de permissão.
**Divergências encontradas:** (1) o ticket diz que `dts_getControleAceiteAvisoFerias` **não existe em
TST/QA**; **nesta base ele existe** (erro de permissão, não "não encontrado"); (2) o processo está
publicado mas **não instanciável** por esta conta; (3) rota do widget de avisos não documentada.
**Dados/massa usados:** nenhum — nada submetido.

---

## CT-FSWTBC-4418  (fluig · Concluído · SDCASSI-378)

**Título:** Reprovar uma tarefa de delegação atuando como gestor e confirmar que o histórico registra quem de fato executou a ação.

**Origem:** FSWTBC-4418 — reportado como "processo permite reprovação por substituição indevida em vez do usuário atribuído". Encerrado pelo próprio relator como **abertura indevida**: *"como GESTOR, pode; o processo está correto"*. O par com o FSWTBC-4329 (onde a trava de substituto realmente faltava) mostra que a distinção **substituto × gestor** não está evidente na interface nem documentada.

**Módulo/Rota:** Processos → **Delegação de Fiscais de Contrato/Serviço** (`wf_delegacaoFiscalContratoServico`) → seções **Aprovação do Gestor Imediato** / **Aprovação do Gerente da Divisão**; e Processos → **Delegação de Tarefas** (`wf_SubstituiçãoCargosFluig`) para o cadastro da substituição.

**Pré-condições**
- Uma instância de **Delegação de Fiscais de Contrato/Serviço** parada na atividade de aprovação, com **usuário titular específico atribuído**.
- Um **substituto** cadastrado para esse titular via processo **Delegação de Tarefas**.
- Um **gestor** com alçada sobre a mesma atividade.
- **Bloqueio:** não há credencial de **gestor** nem de **substituto** disponível (§5-C do briefing) e a regra "quem pode atuar em cada atividade" **não está documentada** — é a pendência declarada no próprio ticket. O caso não pôde ser executado; **nenhuma reprovação foi realizada** (proibido pelo escopo).

**Passos**
1. Autenticar como o **substituto** do titular e abrir a Central de tarefas (`/portal/p/1/pagecentraltask`).
2. Localizar a tarefa de **Delegação de Fiscais de Contrato/Serviço** atribuída ao titular e tentar movimentá-la escolhendo **Aprovar? → Não** com **Motivo** preenchido.
3. Registrar se a plataforma permite ou bloqueia, e com qual mensagem.
4. Sair sem enviar. Autenticar agora como o **gestor**.
5. Abrir a mesma tarefa, marcar **Aprovar? → Não**, preencher **Motivo:** e enviar.
6. Abrir a aba **Histórico** da solicitação e ler o nome registrado no movimento de reprovação, além do campo **Responsável** exibido no card da tarefa.
7. Repetir a leitura do histórico como um terceiro usuário, para confirmar que o registro é o mesmo para todos.

**Resultado esperado**
- O **gestor** consegue reprovar a tarefa: a atuação do gestor sobre a atividade é legítima e o processo está correto.
- O **Histórico** registra o **login real de quem executou** a ação (gestor ou substituto), e não o do titular — a rastreabilidade é preservada.
- O campo **Motivo:** é obrigatório na reprovação e o texto informado fica visível no histórico/formulário.
- O endpoint que lista quem o usuário pode representar (`/ecm/api/rest/ecm/centralTasks/getValidReplacedUsers`) retorna, além dos substituídos, **o próprio usuário** — de modo que agir "em nome de si mesmo" é sempre possível e não depende de haver substituição cadastrada.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- No cenário reportado, a reprovação era feita por **usuário substituto** havendo usuário específico atribuído à atividade, **comprometendo a rastreabilidade** da ação. *(Registre-se que este ticket específico foi encerrado como abertura indevida — o defeito real do mesmo tipo está no FSWTBC-4329, atividade "Informa Decisão".)*

**Severidade:** Alta

**Preparação de massa:** (a) instância de Delegação de Fiscais parada na aprovação com titular nomeado; (b) substituição vigente cadastrada no processo **Delegação de Tarefas** para esse titular; (c) credenciais de **titular**, **substituto** e **gestor**. Responsável: administrador Fluig + área de Contratos. Nenhum dos três perfis está disponível para o QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de `wf_delegacaoFiscalContratoServico` foi aberto em branco e traz, renderizadas, as seções **Aprovação do Gestor Imediato** e **Aprovação do Gerente da Divisão**, com os campos **Aprovar? \*** (opções **Sim** / **Não**), **Motivo:\***, **Gestor Imediato \***, **Email do Gestor \***, **Gerente da Divisão \***, **Fiscal \***, **Termo de aceite:\*** e a seção **Decisão da Delegação**. O processo **Delegação de Tarefas** (`wf_SubstituiçãoCargosFluig`) consta na lista dos 34 processos publicados. O endpoint `getValidReplacedUsers` respondeu **200** devolvendo o próprio `TOTVS-FS` além de um substituído.
**Divergências encontradas:** o ticket chama a funcionalidade de **"Ato de Delegação"**; na plataforma há **dois** artefatos distintos e nenhum se chama assim — **Delegação de Fiscais de Contrato/Serviço** (categoria *Contratos*) e **Delegação de Tarefas** (categoria *Compras*, `processId` `wf_SubstituiçãoCargosFluig`). Nenhuma tela indica, ao abrir a tarefa, **em que qualidade** o usuário está atuando (titular, substituto ou gestor) — é a lacuna de interface que produziu tanto o defeito quanto o falso alarme.
**Dados/massa usados:** nenhum — não submetido; nenhuma tarefa foi assumida, aprovada ou reprovada.

---
