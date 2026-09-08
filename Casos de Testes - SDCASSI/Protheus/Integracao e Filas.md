<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# Integracao e Filas

Casos de teste do Protheus — registrados para execução futura no ERP.

| | |
|---|---|
| Casos neste arquivo | 23 |
| Verificados em tela | 0 total · 6 parcial · 17 não |

> **Como ler.** Estes casos **não são executáveis no Fluig** — o efeito do defeito só aparece
> no Protheus. Estão escritos por completo, do ponto de vista de quem for executá-los no ERP,
> para quando o projeto de testes cobrir o Protheus. Nenhum foi verificado em tela.

---

## CT-FSWTBC-659  (Protheus · Concluído)

**Título:** Enviar o payload de cadastro de corretora e apuração de corretagens à API e conferir que cada campo grava onde o de/para MIT044 → payload → MIT010 diz que grava

**Origem:** FSWTBC-659 — "Revisar MIT010 e alimentar com os de/paras dos campos MIT044 e payload enviado." Filho do épico FSWTBC-806 (DEM10011184 — Automatização Corretagens). Ticket **sem descrição**; único comentário: "Encerrado cfe orientação lafaiete. Já entregue" (13/05/2025), 83 dias parado. O de/para não aparece em lugar nenhum do registro. Caso escrito como **caracterização de caminho** (§5-D): o executor produz o de/para que o ticket não produziu e o usa como oráculo.

**Módulo/Rota:** Protheus → APIs REST de Corretagens publicadas no broker `rest_des`/`rest` (endpoints "Envio do Cadastro da Corretora" e "Apurações de corretagens", nomes conforme comentário de 02/03/2026 no FSWTBC-806; payload com `regrasPagamento[].contratos[].zzi_contr`) → tabela custom `ZZI` (a confirmar no dicionário do cliente). Não há tela, dataset nem processo do Fluig que consuma essas APIs.

**Pré-condições**
- MIT044 da DEM10011184 e MIT010 correspondente em mãos (pasta do Drive "DEM10011184 - CASSI Essencial - Despesa de comercialização").
- Credencial de API no broker do ambiente (DES ou PRIME) e acesso ao Protheus para consultar a tabela destino.
- Um payload real de homologação (o comentário de 02/03/2026 no FSWTBC-806 traz um exemplo com `zzi_contr` 1260–1265).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: gravação dos campos do payload na tabela ZZI/tabelas de corretagem e no relatório de apuração; o Fluig não participa do fluxo de corretagens`. Sem credencial de Protheus nem de API nesta rodada.

**Passos**
1. Abrir a MIT044 e listar, campo a campo, a seção de "layout/payload" das APIs de corretagem (nome do campo no JSON → campo Protheus).
2. Abrir a MIT010 e verificar se existe a tabela de de/para (campo JSON → campo Protheus → tela/relatório onde aparece). Se não existir, esta é a lacuna do ticket — registrar.
3. Enviar o payload de exemplo ao endpoint "Envio do Cadastro da Corretora" com um identificador de rastreio `QA` no campo de texto livre que a API aceitar.
4. Enviar o payload de "Apurações de corretagens" para os contratos do exemplo.
5. No Protheus, consultar o registro gravado (tabela custom de corretagens — nome a confirmar no dicionário; pelo payload, prefixo `ZZI`) e comparar valor a valor com o payload enviado.
6. Para cada campo do payload, anotar: nome no JSON, campo destino, valor enviado, valor gravado, tela do Protheus onde aparece. Esse é o de/para que o ticket pediu.

**Resultado esperado**
- Todo campo declarado na MIT044 existe no payload aceito pela API (a API não devolve erro de campo desconhecido/ausente).
- Todo campo do payload grava no campo destino sem truncar, sem trocar tipo (numérico × texto) e sem perder acento.
- A MIT010 passa a conter o de/para completo, e o executor consegue apontar um campo qualquer da tela para o campo do JSON de origem.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Não há de/para: um campo gravado errado no ERP não tem como ser rastreado até o payload nem até a especificação — foi exatamente o estado em que o ticket foi encerrado ("de/para de campos não produzido").
- Sintoma correlato registrado no épico (02/03/2026): erro no envio do cadastro da corretora e das apurações, com as APIs não publicadas no broker DES.

**Severidade:** Média — rastreabilidade documental; sem ela, defeito de dado em corretagem (financeiro) não é diagnosticável.

**Preparação de massa:** o executor precisa da MIT044/MIT010 da DEM10011184 e de um payload de exemplo (o do FSWTBC-806 serve). Nenhum registro precisa preexistir; os enviados nascem com marcador `QA`.

**Verificado em tela:** NÃO
**O que foi verificado:** somente alcance do broker DES citado no épico: `https://caixade206393.protheus.cloudtotvs.com.br:4010/webapp/` → HTTP 200; `:4050/rest_des/` → HTTP 404 (raiz, sem credencial). No Fluig, um GET search com nome hipotético `dsProtheus_getCorretagens_restGetAll` devolveu 500 NPE — igual ao controle inexistente — ou seja, não há dataset com esse nome; não é evidência de ausência de outro nome.
**Divergências encontradas:** o ticket não tem descrição nem anexo; o "payload enviado" só existe num comentário do épico pai. O título do ticket é tarefa, não defeito.
**Dados/massa usados:** nenhum — nada submetido.

**Módulo ERP:** `Integracao e Filas`

---

## CT-FSWTBC-687  (Protheus · Concluído)

**Título:** Executar a rotina de integração "Pulse" para um registro cujo CEP muda e conferir que a alteração grava sem erro

**Origem:** FSWTBC-687 — "Pulse - Erro na integração". Descrição: "Analisar o fonte que faz a integração com o acompanhamento do Pedro Barreto." Conteúdo técnico não registrado. É a **terceira ocorrência** da família: FSWTBC-52 ("Erro em produção na rotina de pulse" — *typemismatch* ao alterar o CEP em produção) e FSWTBC-1322 ("pulse na 2410" — patch aplicado na base). Caso escrito como **caracterização de caminho** (§5-D) a partir do único sintoma concreto documentado na família (FSWTBC-52): alteração de CEP.

**Módulo/Rota:** Protheus → rotina customizada de integração "Pulse" (nome de menu e fonte **a confirmar no menu do cliente**; nenhum dos três tickets cita a rotina). No Fluig **não há** página, processo nem dataset com esse nome: `/portal/p/1/pulse` → "Recurso não foi encontrado."; nenhum dos 34 processos (`GET /process-management/api/v2/processes`) referencia "pulse".

**Pré-condições**
- Acesso ao Protheus (release 12.1.2410, conforme FSWTBC-1322) com a rotina Pulse no menu.
- Um registro-alvo da integração (colaborador/beneficiário — a confirmar) cujo CEP possa ser alterado com marcador `QA` na observação, se houver.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: log/retorno da rotina Pulse e o CEP gravado no cadastro após a integração`. Sem credencial de Protheus.

**Passos**
1. No Protheus, abrir a rotina de integração Pulse (menu a confirmar) e identificar o log/console de execução que ela usa.
2. Escolher um registro-alvo e anotar o CEP atual.
3. Na origem que a integração lê (a confirmar: arquivo, API ou tabela intermediária), alterar o CEP desse registro para outro válido (8 dígitos) e disparar a integração para esse registro apenas — **não** rodar a carga completa nem schedule.
4. Observar o retorno da rotina e o log.
5. Consultar o cadastro do registro-alvo e comparar o CEP.
6. Repetir com um CEP contendo hífen (`00000-000`) e com CEP em branco, para caracterizar o tratamento de tipo.

**Resultado esperado**
- A rotina conclui sem erro de execução (sem `type mismatch`, sem tela de erro do AppServer).
- O CEP gravado é o enviado, normalizado para o formato do campo (8 dígitos).
- CEP inválido/em branco produz crítica legível no log, sem abortar o lote inteiro.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- "Erro de typemismatch na rotina de pulse para alterar o cep em produção" (FSWTBC-52) — a rotina aborta e o CEP não atualiza.
- Após atualização de release (2410), a rotina deixa de funcionar até aplicar patch (FSWTBC-1322).

**Severidade:** Média — bloqueia a integração; a família teve três chamados em três meses.

**Preparação de massa:** um registro-alvo de teste na base (não de produção) com CEP conhecido; criado/indicado pelo dono do ambiente Protheus. O executor não altera registro de terceiro.

**Verificado em tela:** NÃO
**O que foi verificado:** ausência de superfície no Fluig: rota `/portal/p/1/pulse` → Error page "Recurso não foi encontrado."; lista de processos (34) sem menção a Pulse.
**Divergências encontradas:** nenhum dos três tickets nomeia a rotina, o fonte ou o menu — o caso depende de confirmação do nome no cliente.
**Dados/massa usados:** nenhum — não submetido.

**Módulo ERP:** `Integracao e Filas`

---

## CT-FSWTBC-1357  (protheus · Concluído)

**Título:** Executar o job de processamento de beneficiários e obter numeração de lote única, com o schedule saindo de "aguardando execução"

**Origem:** FSWTBC-1357 — "Erro no Job de processamento de beneficiário". Diagnóstico completo: (1) o nº de lote vinha **repetido** porque o `GetSxEnum` da tabela **SZO** perdeu a numeração — o job se posicionava num lote existente, reprocessava esse e deixava o novo intocado; corrigido no controle de numeração; (2) mesmo com a numeração certa o job ficou preso em **"aguardando execução"** e só voltou depois de **excluir e recadastrar o job** no schedule. Contrasta com FSWTBC-59 (mesmo job, fechado sem tratativa).

**Módulo/Rota:** Protheus → **SIGACFG** → *Ambiente › Schedule › Agendamentos* (cadastro do job) e *Schedule › Monitor* (status de execução); tabela customizada **SZO** (lotes de beneficiários); numeração via `GetSxEnum`/`ConfirmSX8` (tabela **SXE/SXF**, *Configurador › Base de Dados › Dicionário › Numeração*). Nenhuma superfície no Fluig.

**Pré-condições**
- Job de processamento de beneficiários cadastrado no schedule (nome/rotina `<não documentado>` no ticket) com agente ativo.
- Arquivo/registro de beneficiários pendente para gerar ao menos **dois** lotes consecutivos.
- Acesso ao SIGACFG (perfil administrador do ERP).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: o nº de lote gravado na SZO e o status do job no monitor do schedule`. Sem credencial do Protheus.

**Passos**
1. No *Monitor* do schedule, localizar o job e anotar o status e a última execução.
2. Registrar o último `ZO_LOTE` (ou campo equivalente) na SZO (consulta SQL ou browse da tabela).
3. Disparar o job (ou aguardar o horário) com massa de **dois** lotes.
4. Reler a SZO: números dos lotes gerados; reler o monitor: status do job.
5. Forçar concorrência: iniciar o job enquanto outra sessão mantém a numeração SXE/SXF em uso; repetir o passo 4.
6. Reiniciar o agente do schedule (sem excluir o job) e conferir se o job volta a ser executado no próximo ciclo.

**Resultado esperado**
- Passo 4: lotes com números **sequenciais e distintos** (último + 1, último + 2); cada lote processado uma vez; nenhum lote existente reprocessado.
- Passo 4/6: job sai de "aguardando execução" e registra "executado" no monitor no ciclo seguinte, **sem** precisar excluir e recadastrar.
- Passo 5: o segundo processo espera/recebe o próximo número — nunca o mesmo.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Nº de lote **repetido** (job posicionado em lote já existente, novo lote intocado).
- Job preso em **"aguardando execução"** indefinidamente, só destravando após excluir e recadastrar o agendamento.

**Severidade:** Alta *(reprocessa lote existente e deixa beneficiários novos sem processar — perda/duplicidade de dado)*

**Preparação de massa:** registro/arquivo de beneficiários suficiente para dois lotes, preparado pela área de negócio no ambiente de teste; acesso de administrador ao Configurador. Não pode ser criado pela automação. Registrar como **conhecimento operacional**: o destravamento por *excluir e recadastrar o job* é comportamento conhecido do schedule do Protheus.

**Verificado em tela:** NÃO
**Módulo ERP:** `Integracao e Filas`
**O que foi verificado:** nada — o job, a SZO e o schedule não têm qualquer representação no Fluig (o widget *Logs Protheus* cobre CV8/ZZY/ZZZ, não SZO).
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-1952  (protheus · Concluído)

**Título:** Depurar o REST customizado da cotação (liberação/processamento de quote) com pontos de parada que efetivamente param

**Origem:** FSWTBC-1952 — "Debug Integração Fluig Cotações": o desenvolvedor colocou pontos de parada em `COME024_posicionaTipoComprador`, `liberaQuote` (`UGCTE031.controller`), `processaQuote` (`UCOME031.data`), `deleteFornecePadrao` e `liberacaoQuote` (`UGCTE001.services`) e "em NENHUM dos testes o REST parou nos pontos de parada… NÃO FOI RESOLVIDO". Ferramental, não código — mas explica por que vários defeitos de integração foram fechados sem causa-raiz.

**Módulo/Rota:** **Protheus → AppServer REST do ambiente de homologação** (serviço que atende `/api/v1/fluig/compras/cotacao/atualiza/{id}`, chamado pelo Portal do Comprador) + **TDS / VS Code (advpls)** conectado a esse AppServer; fontes `UGCTE031`, `UCOME031`, `UGCTE001`, `COME024` (nomes conforme o ticket — confirmar no repositório do cliente).

**Módulo ERP:** `Integracao e Filas`

**Pré-condições**
- Credencial no Protheus de homologação com perfil de desenvolvedor e acesso ao AppServer que hospeda o REST (não o de interface).
- Fontes compilados no RPO **com informação de debug** e a mesma versão publicada (código-fonte idêntico ao RPO).
- Uma cotação do Fluig em estado de liberação, criada com prefixo `QA` pelo próprio executor (ou pelo comprador de homologação).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: parada (ou não) do debugger nos pontos de parada do REST; o Fluig só recebe o resultado HTTP`

**Passos**
1. No TDS/VS Code, conectar ao AppServer **do REST** (não ao de interface) — confirmar no `appserver.ini` qual seção `[HTTPREST]`/`[HTTPJOB]` atende a porta usada pelo Fluig (o job de REST precisa aceitar depuração; procedimento do time de infra, a confirmar).
2. Colocar pontos de parada nas cinco funções citadas no ticket e iniciar a sessão de depuração em modo "aguardar conexão remota" (nome exato conforme a versão do TDS).
3. No Fluig, como comprador de homologação: Portal do Comprador → *Controle de Cotações* → liberar/atualizar a cotação `QA` (dispara `PUT/POST …/cotacao/atualiza/{id}`).
4. Observar o TDS: qual ponto de parada disparou, em qual thread/ambiente.
5. Sem debugger, repetir o passo 3 e ler o `console.log` do AppServer REST: confirmar a entrada em cada uma das cinco funções (via `ConOut`/log já existente ou log temporário `QA`).

**Resultado esperado**
- Passo 4: o debugger **para** em `liberaQuote`/`processaQuote` (ordem conforme o fluxo) para uma chamada vinda do Fluig — o REST é depurável no ambiente de homologação.
- Passo 5: o log mostra a passagem pelas cinco funções na mesma chamada; a resposta HTTP ao Fluig é 200 e a cotação muda de estado no portal.
- Se o debugger não parar, o ambiente precisa de um **procedimento documentado** de depuração de REST (job dedicado em modo debug) — a falta dele é o achado do ticket.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Nenhum ponto de parada dispara em nenhum teste; a única evidência disponível é o resultado funcional (cotação atualizada ou não), sem visibilidade do caminho executado.

**Severidade:** Média *(não bloqueia o usuário; bloqueia o diagnóstico de toda a família de integração)*

**Preparação de massa:** cotação `QA` em homologação criada pelo comprador de homologação (a conta de QA do Fluig não resolve matrícula de comprador — §5-C); RPO de homologação compilado com debug pelo time Protheus; sessão do TDS pelo executor.

**Verificado em tela:** NÃO
**O que foi verificado:** só o lado Fluig: a chamada `…/api/v1/fluig/compras/cotacao/atualiza/${id}` está no fonte publicado do Portal do Comprador (`l014_pc_main.js`, `tenantId:"01,<filial>"`); Cotação tem *Aguarda Movimentação Protheus (42)* e *Correção (72)* nos 1.000 movimentos lidos. Nenhum passo do ERP executado.
**Divergências encontradas:** nenhuma quanto ao ticket. Registrar que os nomes `UGCTE031.controller`/`UCOME031.data`/`UGCTE001.services` são nomes de fonte TLPP citados no ticket, não confirmados no repositório.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2598  (protheus · Concluído · SDCASSI-80)

**Título:** Enviar do SOC ao Protheus um documento com filial inexistente e conferir que o retorno identifica ambiente e filial e que nada fica gravado parcialmente

**Origem:** FSWTBC-2598 — documentos enviados pelo SOC não eram registrados no Protheus porque **a filial informada não existia**; as mensagens de retorno não traziam ambiente nem filial, inviabilizando o diagnóstico. Ajustes no retorno do processamento: enviar o ambiente, não perder a instância e **rollback** em caso de falha (sem gravação parcial). Patch `SDCASSI80_20251015_1029.ptm`; validado e subido pela MUD16530 em 22/10/2025 — após o fechamento do ticket. Sem tratamento retroativo dos documentos perdidos.

**Módulo/Rota:** SOC → envio de documentos (integração REST SOC → Protheus); Protheus → API REST de recepção de documentos (endpoint da integração, a confirmar no cliente) → tabela de documentos do RH; log/retorno JSON da integração (payload de exemplo anexo ao ticket: `Untitled-3.json`).

**Módulo ERP:** `Integracao e Filas`

**Pré-condições**
- Acesso à API REST do Protheus de homologação (Postman) com o payload do ticket; credencial no Protheus para consultar os documentos gravados.
- Uma filial **válida** e um código de filial **inexistente** para o teste.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: corpo do retorno da API (ambiente/filial), registro do documento e ausência de gravação parcial`

**Passos**
1. Enviar o payload com **filial inexistente**; guardar o corpo da resposta.
2. Consultar no Protheus se algum registro (cabeçalho, item ou anexo) foi criado para o documento.
3. Enviar o mesmo payload com **filial válida**; guardar a resposta.
4. Consultar o documento gravado.
5. Enviar um lote com 2 documentos — o primeiro válido e o segundo com filial inexistente — e repetir 2 e 4 para os dois.

**Resultado esperado**
- Passo 1: resposta de **erro explícito** que informa o **ambiente** (environment) e a **filial** recebida/inválida.
- Passo 2: **nenhum** registro parcial (rollback).
- Passo 3–4: sucesso, documento íntegro; a resposta identifica ambiente e filial.
- Passo 5: o documento válido é gravado; o inválido é recusado com a mesma mensagem; o retorno referencia a instância certa de cada um.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Documento "enviado" sem registro no Protheus; retorno genérico sem ambiente nem filial; possibilidade de gravação parcial.

**Severidade:** Alta *(perda silenciosa de documento de RH e gravação parcial)*

**Preparação de massa:** payload de teste derivado do anexo do ticket com dados `QA…`; colaborador de homologação existente na filial válida — preparado pelo RH/administrador. Confirmar que o patch `SDCASSI80` está na base de homologação.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — integração SOC/RH; sem superfície.
**Divergências encontradas:** o ticket foi fechado em 11/09/2025 e a subida em produção ocorreu em 22/10/2025 — versão a validar é a da MUD16530.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2766  (fluig · Concluído · SDCASSI-105)

**Título:** Sincronização de medição automática roda duas vezes no mesmo dia e o sistema não abre medição duplicada para a mesma competência.

**Origem:** FSWTBC-2766 — “Fluig não está respeitando a competência informada na medição”: o **job**
de medição automática executou mais de uma vez no mesmo dia e, sem trava para contrato que já tinha
processo aberto, gerou **medições duplicadas** para a mesma competência (processos 40738/46788,
contrato `0001-2022-3511` planilha `000002`; contrato `00001-2022-2903` planilha `000001`
competência `09-2025`, processos 54363/54364). A correção implantou verificação de processos abertos
no dataset do job, com chave de unicidade **NumContrato + NumRevisao + FilialContrato + Competência
+ FilialMedicao + NumPlanilha**. Consequência aceita: um contrato com N filiais **ainda** permite N
processos — é o comportamento desejado.

**Módulo/Rota:** job/schedule de medição automática do **Faturamento de Contratos**

**Módulo ERP:** `Integracao e Filas`
(`wf_faturamento_contratos`); efeito observável em *Processos → Iniciar Solicitações* → *Últimas
solicitações abertas* e na aba **Faturamento de Contratos** do **Tracker**
(`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`).

**Pré-condições**
- Contrato vigente com planilha e competência elegível para medição automática.
- Capacidade de **disparar a sincronização duas vezes no mesmo dia** (foi assim que a correção foi
  homologada — o anexo do ticket é o print das “sincronizações repetidas”).
- **Bloqueio:** sim, duplo. (1) Rodar job/schedule é **expressamente vedado** nesta rodada. (2) A
  conta de QA não tem perfil de administrador para disparar sincronização. Além disso, este ticket
  exigiu **autorização formal** (Gleide Medeiros / Rodrigo Cunha) até para ser implementado —
  qualquer execução real precisa da mesma autorização.

**Passos**
1. Anotar, no **Tracker** filtrando *Tipo = Faturamento de Contratos*, os processos já abertos para
   o contrato e a competência alvo.
2. Disparar a sincronização/job de medição automática.
3. Conferir que foi aberto **um** processo *Realizar Medição do Contrato* para a competência.
4. Disparar a sincronização **de novo, no mesmo dia**, sem alterar nada.
5. Repetir a consulta do passo 1.
6. Repetir o ciclo para um contrato com **duas filiais de medição** distintas.

**Resultado esperado**
- Após o segundo disparo, **continua existindo apenas um** processo de medição para a combinação
  **NumContrato + NumRevisao + FilialContrato + Competência + FilialMedicao + NumPlanilha**.
- A competência do processo criado é **exatamente** a informada/elegível — não a do dia da execução.
- Planilha **fixa** não gera medição para competência que já foi medida.
- **Exceção esperada e correta:** contrato com N *Filiais da Medição* distintas gera **N** processos
  — um por filial. Isso **não** é duplicidade.
- Nenhum processo é aberto para contrato que já tenha processo de medição **em aberto**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Dois processos de medição para a mesma competência e a mesma planilha (**40738 e 46788**;
  **54363 e 54364**), gravados sem crítica; medição automática disparada para a competência
  **07-2025** de planilha **fixa** e permitindo gravar.

**Severidade:** Alta *(medição duplicada é faturamento duplicado; o ticket registra que as medições
gravadas antes da correção não tiveram tratamento retroativo)*

**Preparação de massa:** um contrato de homologação com planilha e competência elegível, **e** o
direito de disparar o job duas vezes no mesmo dia — pedir a quem opera o schedule, com a mesma
autorização formal exigida no ticket. Precisa também de um contrato com **duas filiais de medição**
para cobrir a exceção aceita da chave. Nada disso é criável pela conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário *Faturamento de Contratos* expõe, todos como campos próprios,
os seis componentes da chave de unicidade da correção: **Nº do Contrato \*** (`zoomNumContrato`),
**Revisão \*** (`numRevisao`), **Filial do Contrato\*** (`filialContrato`), **Competência do
Contrato \*** (`zoomCompetencia`), **Filial da Medição \*** (`zoomFilialMedicao`) e **Nº da Planilha
\*** (`zoomNumPlanilha`) — a chave documentada no ticket é conferível campo a campo na tela. Há
massa de medições reais: *Últimas solicitações abertas* lista **112932**, **112677** e **112654**,
todas *Realizar Medição do Contrato* do processo *Faturamento de Contratos* (26–28/08/2026). O
**Tracker** tem o tipo *Faturamento de Contratos* no filtro, e é por ele que se audita duplicidade.
**Divergências encontradas:** o job/schedule **não tem superfície no Fluig** para esta conta — não
há tela de disparo nem de log do job; o único rastro consultável é o conjunto de processos abertos.
Registro honesto: **a trava só é demonstrável executando o job**, e não há como fazê-lo aqui.
**Dados/massa usados:** nenhum — nada submetido, nenhum job disparado.

---

## CT-FSWTBC-2805  (protheus · Concluído · SDCASSI-110)

**Título:** Enviar o fechamento SOC → Protheus depois de um processamento interrompido e conferir que a trava de processamento concorrente é liberada

**Origem:** FSWTBC-2805 — o envio do fechamento SOC × Protheus respondia `PROCESSAMENTO INICIADO ANTERIORMENTE, AGUARDE A FINALIZACAO`
mesmo sem processamento em curso: o semáforo de um processamento anterior ficou preso. Encerrado como *Não será feito* ("a equipe interna
resolveu, possivelmente reiniciou o serviço"); causa raiz não investigada, sem timeout nem rotina de liberação.

**Módulo/Rota:** SOC (Saúde Ocupacional) → *Fechamento* → envio ao Protheus; serviço de integração SOC × Protheus (fechamento) — rotina/endpoint
a confirmar no menu do cliente. Nenhuma superfície no Fluig.

**Módulo ERP:** `Integracao e Filas`

**Pré-condições**
- Ambiente de homologação com SOC e Protheus integrados e uma competência de fechamento disponível para envio.
- Acesso ao log do serviço de integração (console/REST) e ao parâmetro/tabela que guarda o flag de "processamento em andamento" (a confirmar).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: retorno do serviço de fechamento SOC × Protheus e o flag de processamento concorrente`. Sem credencial Protheus nem acesso ao SOC nesta rodada.

**Passos**
1. No SOC, disparar o envio do fechamento da competência X e confirmar no Protheus que o processamento terminou (retorno de sucesso).
2. Disparar novo envio da competência X+1 **enquanto** o anterior ainda roda: ler o retorno.
3. Em homologação, interromper um processamento no meio (derrubar o serviço de integração) e reiniciá-lo.
4. Disparar novo envio; ler o retorno e o flag de processamento.
5. Aguardar o tempo de expiração do semáforo (se existir) e repetir o envio.

**Resultado esperado**
- Passo 2: `PROCESSAMENTO INICIADO ANTERIORMENTE, AGUARDE A FINALIZACAO` **só** enquanto há processamento real; ao terminar, o novo envio é aceito.
- Passo 4: após o reinício não há processamento em curso, logo o envio é aceito — ou o serviço libera o flag por timeout/ao subir.
- Em nenhum caso é preciso reiniciar serviço para voltar a enviar fechamentos; o flag preso é liberado por rotina ou expira.
- Contrapartida do FSWTBC-2431: dois envios simultâneos **não** duplicam cadastros.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Todo envio responde `PROCESSAMENTO INICIADO ANTERIORMENTE, AGUARDE A FINALIZACAO` indefinidamente, sem processamento ativo; só reinício do serviço libera.

**Severidade:** Alta — bloqueia o fechamento (folha/contábil) e a resolução depende de intervenção de infraestrutura.

**Preparação de massa:** competência de fechamento de homologação no SOC, preparada pelo time de RH/SOC; permissão para derrubar e subir o serviço de integração **em homologação**.

**Verificado em tela:** NÃO
**O que foi verificado:** apenas que nenhum dos 34 processos do tenant Fluig pertence à integração SOC (lista via `GET /process-management/api/v2/processes`).
**Divergências encontradas:** nenhuma verificável; o ticket não nomeia rotina, endpoint nem tabela do flag.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-3100  (protheus · Concluído · SDCASSI-75)

**Título:** Executar o relatório/rotina contábil ajustada na homologação da DEM10014371 (fontes ERESP2 e RCTB002) para um período com medições automáticas e conferir que conclui sem erro e com os valores das medições

**Origem:** FSWTBC-3100 — tarefa guarda-chuva de "correção de erros reportados durante a homologação da DEM10014371" (três subtarefas); único
registro técnico: *"Ajustados fontes ERESP2 - RCTB002"*. **Sem descrição do defeito, do erro nem da tela** — este caso é uma
**caracterização de caminho**.

**Módulo/Rota:** rotina/relatório contábil que os fontes `ERESP2` e `RCTB002` implementam — **nome de menu a confirmar no cliente**
(`RCTB002` segue a nomenclatura `R[MOD][TYPE][SEQ]` de relatório do SIGACTB). Nenhuma superfície no Fluig além da origem das medições
(*Faturamento de Contratos* / *Logs Protheus → Medicoes ZZZ*, ver CT-FSWTBC-2943).

**Módulo ERP:** `Integracao e Filas` *(a confirmar)*

**Pré-condições**
- Período com medições automáticas encerradas e contabilizadas (DEM10014371).
- Credencial Protheus com acesso ao SIGACTB e às rotinas customizadas.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: saída da rotina/relatório contábil (ERESP2/RCTB002)`.

**Passos**
1. Identificar no menu do cliente a rotina/relatório correspondente a `ERESP2`/`RCTB002` (com o time que homologou a DEM10014371).
2. Executar para o período com medições automáticas, com os parâmetros usados na homologação.
3. Conferir que a execução termina sem erro (sem `error.log`/`console.log` novo no AppServer).
4. Conferir os valores contra as medições do período (Faturamento de Contratos finalizados / cronograma contábil).
5. Repetir para um período **sem** medições.

**Resultado esperado**
- Passos 3–5: execução concluída sem erro; valores iguais aos das medições; período sem medições gera saída vazia coerente, não erro.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `<não documentado>` — o ticket não registra o sintoma das três subtarefas.

**Severidade:** Média — sem descrição não há como afirmar impacto financeiro; sobe para Alta se a rotina alimentar lançamento.

**Preparação de massa:** período de homologação com medições automáticas encerradas; identificação da rotina pelo time do cliente.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — não há superfície.
**Divergências encontradas:** o ticket cita fontes, não telas; rastreabilidade das três subtarefas perdida.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-3216  (protheus · Concluído · SDCASSI-81)

**Título:** Executar a chamada REST de corretagens (DEM10011184) em homologação e conferir que responde com sucesso e sem erro no log do REST

**Origem:** FSWTBC-3216 — "Análise de erro do REST (corretagens)", fechado no mesmo dia **sem conclusão registrada**; conteúdo perdido. Este caso
é uma **caracterização de caminho** — o ticket não traz endpoint, payload nem sintoma.

**Módulo/Rota:** serviço REST de corretagens do Protheus (DEM10011184) — endpoint e rotina **a confirmar** com a MIT da demanda; log do REST
(`console.log` do AppServer). Nenhuma superfície no Fluig.

**Módulo ERP:** `Integracao e Filas`

**Pré-condições**
- MIT/DEM10011184 com o contrato do serviço; credencial REST de homologação; acesso ao log.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: resposta e log do serviço REST de corretagens`.

**Passos**
1. Identificar, na DEM10011184, o endpoint e o payload de corretagens.
2. Chamar o serviço com um payload válido de homologação; ler status e corpo.
3. Ler o log do REST após a chamada.
4. Chamar com payload inválido (campo obrigatório ausente); ler status, corpo e log.

**Resultado esperado**
- Passo 2: 2xx com corpo conforme a MIT.
- Passo 3: sem erro de execução (`type mismatch`, `variable does not exist`, etc.).
- Passo 4: 4xx com mensagem de negócio; sem erro de execução no log.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `<não documentado>`.

**Severidade:** Média — sem descrição não há como afirmar impacto; revisar quando o endpoint for identificado.

**Preparação de massa:** payload de corretagem de homologação fornecido pelo time da DEM10011184.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — não há superfície; nenhum processo do tenant é de corretagem.
**Divergências encontradas:** ticket sem conteúdo.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-3265  (protheus · Concluído · SDCASSI-147)

**Título:** Integrar documentos de pagamento de prestador contendo um documento inválido e conferir que o retorno traz o erro real de cada documento, e não a mensagem antiga de "título já existente"

**Origem:** FSWTBC-3265 — reincidência do SDCASSI-80 (FSWTBC-2598): documentos "integrados" **não localizados** no Protheus. Causa nova: em erro
no retorno do endpoint o sistema **não limpava a mensagem de "título já existente"** e exibia a mensagem antiga no lugar do erro real,
mascarando o diagnóstico. Ajustado o retorno; patch com MUD confirmada.

**Módulo/Rota:** integração de documentos de pagamento de prestador → Protheus SIGAFIN *Contas a Pagar* (endpoint e sistema de origem a
confirmar — o ticket traz o fluxograma como anexo); log do REST. Nenhuma superfície no Fluig (os processos *RDFC - Recepção de Documentos
Fiscais* do tenant são de compras/contratos).

**Módulo ERP:** `Integracao e Filas`

**Pré-condições**
- Ambiente de homologação com o sistema de origem apontando para o Protheus de homologação; credencial REST; acesso ao log.
- Um lote com: documento válido, documento com **filial inexistente**, e documento **já integrado**.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: existência do título no Contas a Pagar e mensagem de retorno do endpoint`.

**Passos**
1. Enviar o lote; ler o retorno **por documento**.
2. SIGAFIN → *Contas a Pagar* → consultar cada documento.
3. Corrigir a filial do documento inválido e reenviar; ler o retorno.
4. Reenviar o documento válido do passo 1; ler o retorno.
5. Ler o log do REST.

**Resultado esperado**
- Passo 1: válido → sucesso; filial inexistente → erro que **cita ambiente e filial**; já integrado → "título já existente".
- Passo 2: só o válido existe; o inválido **não** foi gravado parcialmente (rollback).
- Passo 3: sucesso e título gravado.
- Passo 4: "título já existente" — e **só** nesse caso.
- Passo 5: sem erro de execução.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Documento reportado como integrado e **inexistente** no Protheus; o retorno do documento com erro mostra "título já existente" (mensagem anterior não limpa) em vez do erro real.

**Severidade:** Alta — pagamento a prestador não gerado, com retorno que esconde a causa.

**Preparação de massa:** lote de homologação com os três documentos, montado pelo time da integração; filial inexistente escolhida de propósito.

**Verificado em tela:** NÃO
**O que foi verificado:** apenas que nenhum dos 34 processos do tenant Fluig é desta integração.
**Divergências encontradas:** o ticket não nomeia o endpoint nem o sistema de origem (só o fluxograma anexo).
**Dados/massa usados:** nenhum.

## CT-FSWTBC-3757  (ambos · Concluído · SDCASSI-224)

**Título:** Validar, antes de subir para produção, que a tabela de fila de medições ZZZ existe e responde no ambiente que recebeu o pacote.

**Origem:** FSWTBC-3757 — ao aplicar os pacotes na base TST, antes da implantação em produção,
apresentou **"ZZZ não encontrada"**. Terceira ocorrência com a mesma tabela em um mês (antes:
índice ausente no SINDEX e alias inexistente). O dicionário da ZZZ não acompanha os pacotes de forma
confiável entre ambientes.

**Módulo/Rota:** **Protheus** — aplicação de pacote e dicionário da tabela ZZZ.

**Módulo ERP:** `Integracao e Filas`
Superfície no Fluig: **Logs Protheus** (`/portal/p/1/portal_logs_protheus`) → aba **Medicoes ZZZ**.

**Pré-condições**
- Um pacote recém-aplicado no ambiente de destino.
- Acesso ao ambiente que recebeu o pacote.
- **Bloqueio:** a aplicação do pacote e a checagem do dicionário são **exclusivamente Protheus** e
  não há credencial. A aba *Medicoes ZZZ* é a única superfície de Fluig e hoje não retorna
  (`genericQuery` 404).

**Passos**
1. *(Protheus — bloqueado)* Aplicar o pacote no ambiente de destino e conferir no Configurador que a
   tabela **ZZZ** existe, com alias e índices.
2. No Fluig, abrir **Logs Protheus** e selecionar a aba **Medicoes ZZZ**.
3. Preencher **Filial** e o intervalo **Recebimento inicial / Recebimento final** e clicar em
   **Consultar**.
4. Conferir se a grade monta com as colunas **Filial, Num Med, Contrato, Revisao, Json Medicao,
   Status, Data Recb Me, Data Trat Me, ID Fluig, Hora Rec Med, Hora Eft Med, Msg Medicao, Filial
   Medic**.
5. Repetir a consulta nas abas **Erros CV8** e **Solicitacoes ZZY** para separar "problema só da ZZZ"
   de "problema do `genericQuery` inteiro".
6. Filtrar por **Contrato** = um contrato com medição conhecida (ex.: `0002-2025-3504`) e conferir
   que retorna linha.

**Resultado esperado**
- Passo 2/3/4: a aba **Medicoes ZZZ** monta a grade e devolve linhas, **sem** mensagem de erro.
- Passo 5: as três abas se comportam igual — se ZZZ falha e as outras duas funcionam, **o problema é
  da ZZZ**, que é exatamente o que este ticket cobre.
- Passo 6: a consulta por contrato traz a(s) medição(ões) do contrato.
- Em nenhum momento aparece "ZZZ não encontrada" nem tabela vazia sem explicação.

**Resultado se o defeito reincidir**
- Na aplicação do pacote em TST/produção: **"ZZZ não encontrada"** (anexo `imagem.png` do ticket).
- No Fluig, a aba **Medicoes ZZZ** volta vazia ou com o *toast* **"Nao foi possivel consultar o
  dataset de logs."** enquanto CV8 e ZZY respondem.

**Severidade:** Média *(o cliente só não quebrou produção porque validou antes; a repetição do padrão
levou a rollback em outra demanda)*

**Preparação de massa:** um ambiente que tenha acabado de receber o pacote, e ao menos uma medição
gravada na ZZZ para que a consulta tenha o que devolver. Nada disso é criável a partir do Fluig com
a conta disponível.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a aba **Medicoes ZZZ** existe e seus filtros são *Id Fluig* (placeholder
`103579`), *Filial*, *Contrato*, *Status* (combo), *Recebimento inicial* e *Recebimento final*. As
13 colunas foram lidas no fonte publicado do `ZZZController`. A consulta em si não completa hoje.
**Divergências encontradas:**
1. **Achado de fonte, ainda vivo:** o `ZZZController` usa `deleted: "ZZZ.D_E_L_E_T_=''"`, enquanto
   `CV8Controller` e `ZZYController` usam `D_E_L_E_T_!='*'`. Não são equivalentes — registro vivo no
   Protheus costuma ter **um espaço**, e em Oracle `''` é NULL. Se o critério estiver errado, a aba
   **Medicoes ZZZ volta vazia sem erro nenhum**, e o testador conclui "ZZZ não encontrada" quando o
   problema é o filtro. Recomendo que o passo 5 seja obrigatório neste caso, justamente para separar
   as duas coisas.
2. O `genericQuery` responde 404 hoje — ambiente (§5-C), não defeito.
3. Os rótulos da aba ZZZ chamam as datas de **"Recebimento inicial/final"** (as outras abas usam
   "Data inicial/final"), e todo o widget está **sem acentuação** ("Medicoes", "pagina", "Nao").
**Dados/massa usados:** nenhum — a consulta não retornou.

---

## CT-FSWTBC-3910  (ambos · Concluído · SDCASSI-76)

**Título:** Confirmar que a rotina "Gera Documento" executou na janela agendada e que os processos que a aguardavam avançaram.

**Origem:** FSWTBC-3910 — "Gera Documento não está rodando via schedule". Job agendado que não
executa, mesma classe de falha do disparo do faturamento e da medição automática. Levou 15 dias. O
ticket **não tem descrição nem anexo**; a pendência registrada é a **ausência de monitoramento de
schedules**.

**Módulo/Rota:** **Protheus** — schedule da rotina "Gera Documento".

**Módulo ERP:** `Integracao e Filas`
Superfícies no Fluig: aba **Histórico** dos processos que esperam o job (atividades **"Aguarda
processamento Fila Protheus"**, seq. 182, no Faturamento; **"Aguarda Geração do Pedido/Contrato"**,
seq. 323, e **"Aguarda Geração da Cotação"**, seq. 328, na SC) · **Logs Protheus** → **Erros CV8**.

**Pré-condições**
- Ao menos um processo aguardando o job na janela de execução.
- Acesso ao agendamento/monitor de schedules do Protheus.
- **Bloqueio:** **duplo e explícito.** (a) O objeto do ticket é a **execução do schedule**, e **não
  existe superfície no Fluig que mostre se um schedule rodou** — o widget *Logs Protheus* mostra o
  **efeito** (erros e filas), nunca o agendamento; nenhuma das telas do §5-B expõe schedule. (b) O §2
  proíbe disparar rotinas batch e schedules. Portanto **a asserção "o schedule executou" só é
  verificável no Protheus**, e não há credencial. O caso abaixo verifica o **efeito observável** no
  Fluig, que é o máximo honesto.

**Passos**
1. Antes da janela do schedule, listar no **Tracker** os processos parados nas atividades de espera
   (**Aguarda processamento Fila Protheus** / **Aguarda Geração do Pedido/Contrato** /
   **Aguarda Geração da Cotação**), anotando **Nº do Processo Fluig** e **Atividade Atual**.
2. *(Protheus — bloqueado)* Conferir no monitor de schedules que a rotina **Gera Documento** está
   agendada e habilitada.
3. Aguardar o fim da janela agendada.
4. Reexecutar a consulta do passo 1 e comparar as listas.
5. Abrir a aba **Histórico** de um dos processos e conferir o horário de saída da atividade de espera.
6. Abrir **Logs Protheus** → **Erros CV8**, filtrar pelo intervalo da janela e por **Texto**
   (usando um trecho do nome da rotina), e clicar em **Consultar**.

**Resultado esperado**
- Passo 4: os processos que estavam na atividade de espera **saíram dela** dentro da janela — a lista
  encolhe.
- Passo 5: o horário de saída fica **dentro** da janela agendada, e o tempo de permanência é da ordem
  de **minutos** (o mesmo teto aceito no CT-FSWTBC-3749).
- Passo 6: **nenhum** erro relacionado à rotina em **Erros CV8** no intervalo.
- Nenhum processo permanece indefinidamente numa atividade de espera sem erro visível.

**Resultado se o defeito reincidir**
- O job **não executa**: os processos permanecem exatamente nas mesmas atividades de espera depois da
  janela, a lista do passo 4 é idêntica à do passo 1 e **nenhum erro é gerado em lugar nenhum**. É
  esse silêncio — a "ausência de monitoramento de schedules" apontada no ticket — que faz a falha só
  ser descoberta quando alguém reclama.

**Severidade:** Média *(bloqueia o fluxo, silenciosamente e por tempo indeterminado)*

**Preparação de massa:** ao menos um processo próprio parado numa das atividades de espera antes da
janela, e acesso de leitura ao monitor de schedules do Protheus. Sem esse acesso o caso **não
comprova o objeto do ticket** — comprova apenas o efeito.

**Verificado em tela:** PARCIAL
**O que foi verificado:** varri as **59 sequências** do `wf_solicitacao_compras` (6.000 movimentos) e
as **15** do `wf_faturamento_contratos` atual, mais a lista dos **34 processos publicados**:
**não existe nenhuma atividade chamada "Gera Documento"** e não há processo com esse nome. Confirmei
em tela as atividades de espera que servem de efeito observável, e confirmei que o widget
**Logs Protheus** cobre **CV8/ZZY/ZZZ** — logs de erro e filas, **não** agendamentos. No Tracker
confirmei o filtro **Status** (Todos/Abertos/Finalizados/Cancelados) e **Data da Solicitação (De/Até)**,
que é o que permite montar a lista do passo 1.
**Divergências encontradas:**
1. **Não há superfície de front-end para schedule no Fluig — digo isto explicitamente em vez de
   simular cobertura.** "Gera Documento" é rotina do Protheus; o Fluig só mostra o efeito
   (processo saiu ou não saiu da fila). Este caso é, por construção, **parcial**.
2. O ticket não nomeia o processo nem o documento que a rotina gera, então o passo 1 tem de ser
   escrito por atividade de espera, não pelo nome da rotina.
3. A atividade de espera do Faturamento **mudou de nome** desde a época do ticket: era *"Aguarda
   Criar Pedido de Compras"* (seq. 160) e hoje é **"Aguarda processamento Fila Protheus"** (seq. 182).
4. O filtro **Texto** existe **apenas** na aba *Erros CV8* (as abas ZZY e ZZZ não têm campo de texto
   livre) — o passo 6 só funciona nessa aba.
**Dados/massa usados:** nenhum — nenhum schedule disparado, nenhum processo movimentado.

---

## Fechamento

| # | Caso | Verificado | Bloqueio principal |
|---|---|---|---|
| 1 | CT-FSWTBC-3739 | PARCIAL | sem matrícula de comprador; §2 proíbe cancelar |
| 2 | CT-FSWTBC-3749 | PARCIAL | `genericQuery` 404; instâncias do ticket inexistentes |
| 3 | CT-FSWTBC-3750 | PARCIAL | exige cotação não-cancelável própria; CV8 fora do ar |
| 4 | CT-FSWTBC-3755 | PARCIAL | **fila ZZ4 sem superfície no Fluig**; exige schedule |
| 5 | CT-FSWTBC-3757 | PARCIAL | aplicação de pacote é Protheus; ZZZ fora do ar |
| 6 | CT-FSWTBC-3765 | PARCIAL | exige contrato de planilha FIXA e medição própria |
| 7 | CT-FSWTBC-3781 | PARCIAL | sem admin do Fluig, sem credencial de fornecedor |
| 8 | CT-FSWTBC-3782 | PARCIAL | sem credencial de fornecedor (401) |
| 9 | CT-FSWTBC-3789 | **NÃO** | os três pontos fora de alcance; termo não encontrado em nada acessível |
| 10 | CT-FSWTBC-3841 | PARCIAL | comprovar criação no ERP exige submeter a SC |
| 11 | CT-FSWTBC-3860 | **SIM** | nenhum — massa real confirmada por dado |
| 12 | CT-FSWTBC-3878 | PARCIAL | caminho positivo exige submeter a SC |
| 13 | CT-FSWTBC-3881 | PARCIAL | processos 9448/9450 → 404; exige medição própria |
| 14 | CT-FSWTBC-3910 | PARCIAL | **schedule sem superfície no Fluig** |

**Sem superfície de front-end (declarado, não simulado): 2** — a fila **ZZ4** do
CT-FSWTBC-3755 e a **execução do schedule** do CT-FSWTBC-3910. Em ambos, o caso amarra o que é
observável no Fluig e diz com todas as letras o que só o Protheus fecha.

## CT-FSWTBC-4065  (ambos · Concluído · SDCASSI-288)

**Título:** Confirmar que as medições automáticas do mês nascem para todos os contratos configurados, mesmo que o schedule rode fora da ordem esperada.

**Origem:** FSWTBC-4065 — medições automáticas **não geradas** em fevereiro para os contratos
**Selbetti 00018-2024-5303** e **Ar Oeste 00008-2022-5201**. Não era defeito de código e sim
**configuração de ordem de execução**: o schedule **UGCTE027** disparava **antes** do dataset de
abertura da solicitação automática de faturamento. Rodando antes, **não há o que medir e a medição
simplesmente não nasce — sem erro, sem log de negativa**. Encerrado por decurso em 05/06/2026,
apontando o ajuste feito no SDCASSI-286, **sem confirmação formal do cliente**.

**Módulo/Rota:** schedule **UGCTE027** + dataset de abertura da solicitação automática de faturamento

**Módulo ERP:** `Integracao e Filas`
· superfícies no Fluig: **Tracker → *Faturamento de Contratos*** e **Logs Protheus → `Medicoes ZZZ`**.

**Pré-condições**
- Contratos em **medição automática** com competência aberta (referências: 00018-2024-5303 e
  00008-2022-5201).
- Agendamento do UGCTE027 **posterior** à execução do dataset de abertura.
- **Bloqueio:** a ordem de agendamento vive no configurador de schedule do Protheus, sem
  credencial nesta rodada; e o briefing proíbe disparar schedule. **Atenção operacional:** o próprio
  ticket registra que as medições de fevereiro foram feitas **manualmente** e o cliente pediu para
  **não regerar** — qualquer reexecução arrisca **duplicidade**.

**Passos**
1. No **Tracker**, visão *Faturamento de Contratos*, filtrar pelo **Número do Contrato** e pelo mês
   de competência.
2. Contar quantas medições foram geradas para o contrato no mês.
3. Repetir para cada contrato configurado em medição automática.
4. Em **Logs Protheus → `Medicoes ZZZ`**, filtrar o mesmo período e conferir se há registro de
   tentativa para os contratos sem medição.
5. Conferir, com o time Protheus, que o **UGCTE027 está agendado depois** do dataset de abertura.
6. Consulta apenas — **não** regerar medição.

**Resultado esperado**
- Todo contrato configurado em medição automática tem **as medições do mês geradas**.
- Se a rotina rodar sem a solicitação aberta, ela **registra a negativa em log** ("nada a medir")
  em vez de terminar em silêncio.
- A ausência de medição é **detectável sem inspeção manual contrato a contrato**.
- Nenhuma medição duplicada aparece para contratos já medidos manualmente.

**Resultado se o defeito reincidir**
- Medições do mês **inexistentes** para contratos corretamente configurados
  (Selbetti 00018-2024-5303, Ar Oeste 00008-2022-5201), **sem erro e sem log de negativa** —
  descoberto só quando a área reclama, já no fechamento do mês.

**Severidade:** **Alta** *(medição não gerada é faturamento não realizado — impacto financeiro, e
silencioso por natureza)*

**Preparação de massa:** contratos em medição automática com competência aberta e uma janela de
agendamento controlada pelo time Protheus. Não montável pela conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o **Tracker** abre com a visão *Faturamento de Contratos* e o filtro de
contrato; a aba **`Medicoes ZZZ`** existe no widget *Logs Protheus*.
**Divergências encontradas:** **armadilha de filtro já conhecida** — o campo de número de contrato do
Tracker tem **id diferente por visão** (`nrContratoSC` × `numContrato`); usar o id errado devolve
**tudo, sem aviso**, e faria este caso "passar" por engano. Nesta sessão só o id `nrContratoSC`
apareceu na visão inicial (Solicitação de Compras) — confirmar o id ao trocar para *Faturamento de
Contratos*. Além disso, a pendência do ticket segue válida: **não há validação no UGCTE027 que
detecte "rodei antes do dataset"**, então a desconfiguração pode voltar a qualquer momento.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4728  (ambos · Concluído · SDCASSI-448)

**Título:** Encerrar uma cotação com vencedor parcial (ganha alguns itens, perde outros) e conferir que cada fornecedor recebe um único e-mail coerente com o resultado.

**Origem:** FSWTBC-4728 — o fornecedor vencedor da cotação 000030-2201 recebeu dois e-mails contraditórios ("proposta aprovada" e "não aprovada"). Duas correções: (1) `servicetask185` passou a excluir dos perdedores quem está no conjunto de vencedores; (2) a identificação do vencedor deixou de usar `C8_XVENC`/`C8_XAUDIT` (nunca marcados) e passou a usar `C8_NUMPED`/`C8_NUMCON` preenchidos e não iniciados por "XX".

**Módulo/Rota:** Fluig: Portal do Comprador (`/portal/p/1/gerenciaCompras`) → **Proposta Vencedora** (`#/propostaVencedora`) — dispara o encerramento; `wf_solicitacao_compras` seq 185 (`servicetask185`, notificação) e 310. Protheus: Compras → Cotação → Análise de Cotação (MATA161) / Pedido (SC7) / Contrato (CN9); tabela **SC8** (`C8_NUMPED`, `C8_NUMCON`, `C8_XVENC`, `C8_XAUDIT`). Caixa de e-mail do fornecedor.

**Módulo ERP:** `Integracao e Filas`

**Pré-condições**
- Cotação com ≥ 2 itens e ≥ 2 fornecedores, em que o fornecedor A vence o item 1 e perde o item 2 (vencedor parcial), e o fornecedor B perde tudo.
- Endereços de e-mail dos fornecedores de teste acessíveis ao executor.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: marcação do vencedor na SC8 (C8_NUMPED/C8_NUMCON × C8_XVENC/C8_XAUDIT) que decide qual e-mail sai; o e-mail em si só é visível na caixa do fornecedor. O Fluig não expõe fila/log de e-mails à conta de QA.`

**Passos**
1. *(Fluig, comprador)* Portal do Comprador → **Proposta Vencedora** → definir A como vencedor do item 1 e C como vencedor do item 2 (A é vencedor parcial; B perde os dois itens) → concluir.
2. *(Protheus)* Aguardar geração do pedido/contrato; abrir SC8 da cotação (Análise de Cotação ou consulta `SC8010`): para as linhas vencedoras `C8_NUMPED` **ou** `C8_NUMCON` preenchido e **não** iniciado por "XX"; para as perdedoras ambos vazios ou iniciados por "XX".
3. *(Protheus)* Anotar `C8_XVENC` e `C8_XAUDIT` das mesmas linhas.
4. *(Fluig)* Aguardar a execução da `servicetask185` (Histórico da SC: "Integração executada com sucesso…" após a definição do vencedor).
5. Conferir a caixa de e-mail de A, B e C.

**Resultado esperado**
- A recebe **um** e-mail, de vencedor (itens ganhos); nenhum e-mail de "não aprovado".
- B recebe **um** e-mail, de participação/não aprovado.
- C recebe **um** e-mail, de vencedor.
- Nenhum fornecedor fica sem e-mail (quando a consulta de vencedor voltava vazia, ninguém era notificado).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O mesmo fornecedor recebe "Cotação 000030-2201 — vencedora" **e** "Cotação 000030-2201 — perdedora"; ou nenhum e-mail sai.

**Severidade:** Média

**Preparação de massa:** cotação de QA com ≥ 2 itens e 3 fornecedores de teste com e-mails controlados, criada pelo executor com papel de comprador; o pedido/contrato precisa ser gerado no ERP para preencher `C8_NUMPED`/`C8_NUMCON`.

**Verificado em tela:** NÃO
**O que foi verificado:** nada renderizado. *Lido na API* — o dataset `dsProtheus_getCotacaoxProdxGrupProd_restGetAll` (GET search, hoje) devolve `C8_XAUDIT: true` e expõe `C8_XVENC` no primeiro registro, isto é, os campos existem na consulta; o critério novo (`C8_NUMPED`/`C8_NUMCON`) é regra do dataset/servidor e não é legível pela conta de QA.
**Divergências encontradas:** nenhuma verificável.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4756  (protheus · Concluído · SDCASSI-449)

**Título:** Enviar um lote de títulos a pagar pela API bondsPay com um documento inválido e conferir que a resposta não declara sucesso para o documento que não foi gravado na SE2

**Origem:** FSWTBC-4756 — em 16/06 o Protheus devolveu ao SOC/Benner HTTP 200 "documento integrado com sucesso" **sem gravar os títulos na SE2** (falso positivo): `U_UFINE020` retornava `.T.` incondicional e o endpoint só avaliava o booleano. Correção: `lIntegrOK` agregando o resultado por documento; resposta alinhada ao **formato de produção** (lista por documento com `id`, `status`, `mensagem`, `code`), `errorCode` numérico + `errorMessage`, 422 para recusa de validação, 400 para JSON malformado, 500 para exceção, `MsUnlockAll` em todos os caminhos.

**Módulo/Rota:** Protheus REST → `PUT …/bondsPay` (WSRESTFUL `UCOMA001` — *rota completa a confirmar no serviço REST de homologação*) → Financeiro → *Contas a Pagar* → consulta de títulos (SE2).

**Módulo ERP:** `Integracao e Filas`

**Pré-condições**
- Credencial e URL do serviço REST do Protheus de homologação; cliente HTTP (Postman/curl) com o payload real de produção (lote com N documentos).
- Documentos de teste: **D1** válido; **D2** com valor divergente do fechamento (recusa de negócio, `errorCode 24`); **D3** JSON malformado.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: corpo/código HTTP da resposta do bondsPay e existência do título na SE2`. Sem credencial nesta rodada; o SOC/Benner não passa pelo Fluig.

**Passos**
1. `PUT` com lote {D1}; ler status HTTP e corpo; consultar a SE2 pelo documento.
2. `PUT` com lote {D1', D2} (D1' = novo documento válido); ler corpo por documento; consultar a SE2.
3. `PUT` com D3 (JSON malformado).
4. Repetir o `PUT` do passo 2 (mesmos documentos) para conferir que nenhum registro ficou travado (`MsUnlockAll`).
5. Conferir no corpo de erro que `errorCode` vem numérico (`24`) e `errorMessage` traz "Divergencia do Valor enviado do fechamento…".

**Resultado esperado**
- Passo 1: 200, `status` true para D1; **título na SE2**.
- Passo 2: resposta no formato de produção — D1' `status` true, **D2 `status` false com `code`/`errorCode` 24** e `errorMessage` de divergência; SE2 só com D1'.
- Passo 3: **400**.
- Passo 4: sem erro de registro em uso; D2 continua recusado.
- Em nenhum caso "integrado com sucesso" para documento ausente da SE2.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- HTTP 200 com "documento integrado com sucesso" e **nenhum título na SE2**; `status:false`/`code 501` só dentro do JSON, ignorados pelo endpoint.

**Severidade:** Alta *(títulos a pagar reportados como integrados sem existir — risco financeiro direto)*

**Preparação de massa:** três payloads (válido, valor divergente, malformado) montados pelo executor a partir do log `LOG_ERRO_INTEGRACAO.txt` do ticket; alinhar com o Benner a leitura do `errorCode` numérico (24 × "024") e a camada que exibe "424".

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — integração SOC/Benner → Protheus sem superfície no portal (grep por `bondsPay` nos fontes publicados: zero ocorrências).
**Divergências encontradas:** nenhuma verificável.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4815  (protheus · Concluído · SDCASSI-465)

**Título:** Provocar gravações concorrentes no mesmo registro em duas sessões do Protheus e conferir que a rotina devolve "registro em uso" sem erro de lock do DBAccess — caracterização de caminho

**Origem:** FSWTBC-4815 — ticket **sem descrição** (registro de agenda com o desenvolvedor em 24/06/2026 sobre "erro de lock no DBAccess", resolvido "com patch da Matriz"; zero anexos; patch não identificado). Sem cenário no ticket, este caso caracteriza o caminho onde o efeito apareceria.

**Módulo/Rota:** Protheus → qualquer rotina com `RecLock` concorrente (ex.: Gestão de Contratos → alteração do mesmo contrato em duas sessões; Compras → aprovação do mesmo documento); infraestrutura → `console.log` do appserver e `dbaccess.log` (*caminhos a confirmar com a infra do cliente*).

**Módulo ERP:** `Integracao e Filas`

**Pré-condições**
- Duas sessões de usuários distintos no mesmo ambiente; um registro de homologação editável (contrato ou SC).
- Número/versão do patch da Matriz aplicado (o ticket não registra — **levantar e anotar** antes do teste).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: mensagem de lock na rotina e ocorrências no log do DBAccess`. Sem credencial nesta rodada.

**Passos**
1. Registrar versão do DBAccess e o patch aplicado.
2. Sessão 1: abrir o registro em alteração e **não** confirmar.
3. Sessão 2: abrir o mesmo registro em alteração.
4. Sessão 1: confirmar; Sessão 2: confirmar.
5. Ler `console.log` e `dbaccess.log` na janela do teste.
6. (Contraprova Fluig, quando disponível) *Logs Protheus → Erros CV8* → filtrar por "lock" no campo "Mensagem, detalhe ou processo" no período; *Solicitacoes ZZY* → `Qtd T.Env Fl` sem acúmulo de retentativas por erro de banco.

**Resultado esperado**
- Passo 3: mensagem padrão de registro em uso (ou abertura só leitura) — sem erro de exceção.
- Passo 4: uma gravação efetivada; a outra tratada; sem sessão travada.
- Passo 5: sem `lock`/`deadlock`/erro de conexão no DBAccess.
- Passo 6: nenhuma ocorrência de lock na CV8; fila ZZY sem retentativas por esse motivo.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `<não documentado>` — o ticket não traz a mensagem; sintomas compatíveis registrados na conta: `RecLock` negado (FSWTBC-4818), timeouts e processos travados na fila.

**Severidade:** Média *(bloqueia o fluxo; sem evidência de perda de dado no ticket)*

**Preparação de massa:** um registro editável em homologação; levantar com a fábrica o patch da Matriz aplicado em 24–25/06/2026 para constar no relatório.

**Verificado em tela:** NÃO
**O que foi verificado:** contraprova apenas: *Logs Protheus* aberto com as três abas e filtros; a consulta da CV8 (`genericQuery?tables=CV8`) respondeu **404** — a ferramenta de diagnóstico está indisponível hoje (instabilidade, não defeito).
**Divergências encontradas:** ticket sem descrição, sem anexos e sem número de patch — o caso é caracterização de caminho (§5-D).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4964  (ambos · Em Homologação · SDCASSI-498)

**Título:** Gerar o cronograma contábil de um contrato de 12 meses e confirmar que nenhuma parcela é classificada como Longo Prazo nem transferida pela rotina LP/CP

**Origem:** FSWTBC-4964 — contrato 00050-2026-5303: a rotina de Transferência e Contabilização LP/CP (competência 06/2027) contemplou a parcela 0012 embora todas as 12 parcelas sejam de curto prazo. Três correções sucessivas (17/07 data-base → CN9_DTINIC; 24/08 regra **posicional**: as 12 primeiras parcelas do cronograma são CP, as demais LP; 31/08 apropriação). **Aberto** — pacote de 02/09 não aplicado; acerto retroativo de dados pendente.

**Módulo/Rota:** Protheus → Gestão de Contratos (SIGAGCT) → *Contratos* → revisão → **Cronograma Contábil** (CNW, campo `CNW_XCPLP`, indicadores *Contab DA* / *Contab LP CP*); Contabilidade → rotinas customizadas **UGCTE002 (Transferência LP/CP)** e **UGCTE003 (Apropriação)**; LPs 154/155; parâmetros `MV_X154P01` / `MV_X154P02`. No Fluig: Acompanhamento de Contratos → modal *Informações Complementares do Contrato → Valores Financeiros* (só valores totais — sem parcelas).

**Módulo ERP:** `Integracao e Filas`

**Pré-condições**
- Contrato com vigência de exatamente 12 meses (00050-2026-5303 tem 60 meses de vigência no portal — ver divergência) e cronograma contábil gerado **após** a aplicação integral do pacote `SDCASSI-490-498_P2510_20260821_1812.ptm` e do `SDCASSI_498_P2510_20260902_1843.ptm`.
- Um segundo contrato com cronograma de 60 parcelas para o cenário LP.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: classificação Curto/Longo Prazo das parcelas do cronograma contábil (CNW_XCPLP), lançamentos das LPs 154/155 e a seleção de parcelas pela rotina UGCTE002`

**Passos**
1. (Protheus) Abrir o contrato → revisão vigente → *Cronograma Contábil*; listar as parcelas com *Contab LP CP* e `CNW_XCPLP`.
2. Gerar nova revisão (para regerar o cronograma) e repetir a leitura.
3. Executar **UGCTE002** para a competência do 12º mês (ex.: 06/2027) em modo simulação/relatório; ler as parcelas selecionadas.
4. Repetir 1–3 no contrato de 60 parcelas.
5. Executar **UGCTE003** (apropriação) para uma competência e conferir os lançamentos gerados (LP 154/155) — aplicando o pacote **por inteiro**.
6. (Fluig) Acompanhamento de Contratos → modal → *Valores Financeiros*: ler *Valor Atual do Contrato* e *Saldo do Contrato*.

**Resultado esperado**
- Passo 1–2: contrato de 12 parcelas → **todas CP**; a 1ª parcela nasce com *Contab DA* e *Contab LP CP* = **Não** (não em branco).
- Passo 3: **nenhuma** parcela selecionada para transferência LP→CP (não há LP).
- Passo 4: parcelas 1–12 = CP, 13–60 = LP; a UGCTE002 da competência N transfere exatamente a parcela N+12.
- Passo 5: uma parcela classificada CP tem o **lançamento correspondente** (não "CP sem lançamento").
- Passo 6: valores do Fluig coerentes com o cronograma (sem alteração de saldo por transferência indevida).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Parcela 0012 de um contrato de 12 meses contemplada pela transferência LP/CP de 06/2027; cronogramas com > 12 parcelas todas CP; 1ª parcela com indicadores em branco.

**Severidade:** Alta

**Preparação de massa:** dois contratos de teste (12 e 60 parcelas) com cronograma regenerado após o pacote; competências fechadas; ambiente com os fontes do `fontesagosto.csv` conferidos — exigido pelo analista para separar defeito de pacote não aplicado.

**Verificado em tela:** NÃO
**O que foi verificado:** no Fluig, o modal de 00050-2026-5303 (*Vigente*, 11/07/2022–11/07/2027, *Vigência do Contrato: 60*, *Valor Inicial* R$ 300.000,00, *Valor Atual* R$ 300.000,00, *Saldo* R$ 300.926,19, *Medição Acumulada* "-"). Não há parcelas, classificação LP/CP nem lançamentos em nenhuma superfície do Fluig.
**Divergências encontradas:** o contrato do ticket é descrito como "12 meses de vigência", mas o portal mostra **60 meses (11/07/2022 → 11/07/2027)** — ou o ticket fala da revisão/planilha, ou a base de homologação difere da de produção; *Saldo do Contrato* (R$ 300.926,19) **maior** que *Valor Atual* (R$ 300.000,00) — anotado, sem conclusão.
**Dados/massa usados:** leitura do modal de 00050-2026-5303.

---

## CT-FSWTBC-4985  (ambos · Concluído · SDCASSI-502)

**Título:** Abrir SC de Aditivo Contratual e confirmar que a alçada é calculada sobre Valor Vigente do Contrato + valor da SC

**Origem:** FSWTBC-4985 — em SC de *Aditivo Contratual*, a alçada considerava só o valor da SC. Análise Protheus: a soma existe (UCOME024 `fValorProposta`, CN9_VLATU), mas só executa quando o JSON da fila ZZY traz `additive`, `originalContract` e `sourceReview` — que o Fluig não enviava; `_lAditivo` assumia falso **em silêncio**. Homologado em 27/08; sem registro de que a obrigatoriedade das chaves tenha sido implementada.

**Módulo/Rota:** *Solicitação de Compras* → *Tipo de Compra \** = Contrato → **Tipo de Solicitação \*** = **Aditivo Contratual** → *Número do Contrato / Revisão do Contrato / Fornecedor Contrato*; painel da alçada: **Valor da Compra (R$)**, **Valor Vigente do Contrato (R$)** (`authorityVlrContratoOriginal`), **Total com Aditivo (R$)** (`authorityVlrTotalComAditivo`), **Total a ser Aprovado (R$)**; grade `tbAlcadas`; Tracker → *Solicitação de Compras* (colunas *Tipo de Solicitação, Número do Contrato, Revisão do Contrato*); **Logs Protheus → ZZY → Json Entrada** (rotina `gravaVencedor`)

**Módulo ERP:** `Integracao e Filas`

**Pré-condições**
- Contrato vigente com CN9_VLATU conhecido (ex.: 00050-2026-5303, *Valor Atual* R$ 300.000,00) e uma faixa de alçada cujo limite fique **entre** o valor da SC e a soma (para que a diferença mude o nível de aprovação).
- **Bloqueio:** a alçada (309/310/94) exige comprador e aprovador — a conta de QA não tem; o JSON enviado à ZZY é montado no servidor (não capturável pelo navegador) e a ZZY está indisponível hoje.

**Passos**
1. Abrir a SC; em Validação do Comprador definir *Tipo de Compra* = Contrato, *Tipo de Solicitação* = **Aditivo Contratual**, informar *Número do Contrato* e *Revisão do Contrato*; item com valor abaixo do limite da faixa (ex.: R$ 50.000,00).
2. Seguir cotação → vencedor → *Gerar Grid de Alçada (310)*.
3. Na *Aprovação de Alçadas*, ler **Valor da Compra (R$)**, **Valor Vigente do Contrato (R$)**, **Total com Aditivo (R$)** e **Total a ser Aprovado (R$)**; ler os aprovadores da grade `tbAlcadas`.
4. Abrir **Logs Protheus → Solicitacoes ZZY** → *Chave* = nº da cotação → *Json Entrada*.
5. Cenário negativo: SC de *Nova Contratação* com o mesmo valor.
6. (Protheus) conferir C1_XCTRORI/C1_XREVIS e C8_XCTRORI/C8_XREVIS da SC/cotação.

**Resultado esperado**
- Passo 3: *Valor Vigente do Contrato* = CN9_VLATU da **revisão vigente**; *Total com Aditivo* = Vigente + SC; a grade `tbAlcadas` traz os aprovadores da faixa do **total** (nível superior ao da SC isolada).
- Passo 4: JSON com as chaves `additive: true`, `originalContract` e `sourceReview` preenchidos.
- Passo 5: alçada da faixa do valor da SC, *Valor Vigente* e *Total com Aditivo* vazios.
- Passo 6: campos de vínculo preenchidos.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Alçada calculada só sobre o valor da SC (nível inferior ao devido) — *Valor Vigente do Contrato* vazio ou ignorado; JSON da ZZY apenas com `quotationcode, nIdFluig, nTargetState, contractgenerationtype, items, contracts`; C1_XCTRORI/C1_XREVIS vazios.

**Severidade:** Alta

**Preparação de massa:** SC `QA-4985` de aditivo sobre um contrato vigente, conduzida por comprador até a alçada; aprovador da faixa. As SCs **112830** e **113196** (Aditivo Contratual, conta de QA) já existem, mas estão antes da alçada.

**Verificado em tela:** PARCIAL
**O que foi verificado:** campos **Tipo de Solicitação \*** (*Aditivo Contratual / Nova Contratação*), **Valor Vigente do Contrato (R$)** e **Total com Aditivo (R$)** presentes no formulário publicado (`form_sc.html:468, 1734, 1742`); em **112830** (Validação do Gestor) *Tipo de Solicitação = Aditivo Contratual*, *Número do Contrato = 6155-2025-5303*, *Nº da Solicitação ERP = 001194* e **Valor Vigente do Contrato vazio** (ainda não chegou à 310, onde o painel é montado); Tracker *Solicitação de Compras* exibe *Tipo de Solicitação, Número do Contrato, Revisão do Contrato*. Sequência 309 → 225 → 310 → 94 confirmada por dado.
**Divergências encontradas:** no formulário em branco o bloco *Tipo de Solicitação/Número do Contrato* (`rowContractMonitoring`) está oculto e `_tipoSolicitacao` vem `disabled` — só é editável na Validação do Comprador; **113196** é *Aditivo Contratual* com *Número do Contrato* **vazio** e nunca gravou no ERP (`Cannot convert NaN to java.lang.Integer (servicetask233#267)` — A15-b): candidato a ser exatamente o "JSON incompleto" que o ticket teme; a ZZY (passo 4) está indisponível hoje (404).
**Dados/massa usados:** leitura de 112830 e 113196 — nada submetido.

---

## Resumo do lote

| Caso | Verificado | Bloqueio principal |
|---|---|---|
| 4828 | PARCIAL | esperas 328/309/323 exigem comprador; Logs Protheus 404 |
| 4829 | PARCIAL | conta não é fiscal; **sintoma vivo** (111980/111977/111973) |
| 4842 | PARCIAL | conta não é fiscal; nº do pedido só no ERP/ZZZ |
| 4852 | PARCIAL | alçada exige comprador/aprovador |
| 4854 | PARCIAL | idem |
| 4864 | PARCIAL | sem matrícula de comprador; não cancelar terceiros |
| 4874 | PARCIAL | alçada exige comprador |
| 4899 | PARCIAL | 00160-2022-5303 ausente da base |
| 4941 | PARCIAL | rateio no pedido só no ERP |
| 4952 | SIM (crítica) / PARCIAL (gravação) | ticket aberto — **reprova hoje por causa nunca fechada** ("não apaga") |
| 4964 | NÃO | SOMENTE PROTHEUS |
| 4965 | PARCIAL | comprador; não cancelar terceiros |
| 4982 | SIM | nenhum |
| 4985 | PARCIAL | alçada exige comprador; ZZY 404 |

**Casos que reprovam hoje por causa nunca corrigida (não ler como regressão):** 4829 (fila do Faturamento parada há 22–25 dias — A16), 4952 (crítica não limpa o valor; ticket aberto), 4964 (ticket aberto, pacote não aplicado).

## CT-FSWTBC-5036  (ambos · Em Homologação · SDCASSI-521)

**Título:** Medição encerrada com desconto debita do saldo do contrato apenas o valor líquido e atualiza a parcela do cronograma financeiro

**Origem:** FSWTBC-5036 — o valor do desconto estava sendo aplicado no saldo do contrato. Cadeia de causas: (1) correção em
04/08; (2) valores medidos não refletiam no Protheus; (3) o cronograma financeiro (CNF) ficou inalterado porque o commit 5123697
removeu de `PE_CNTA121.PRW` a rotina `AtualizaSaldoCNF` (contrato 00003-2026-3304 rev.001, medição 000238, parcela 0006 com
Dt.Realizado e Vl.Realizado ZERO); (4) pacote não aplicado em homologação; (5) objetos antigos `CN121ESD` e `UGCTE024` ainda
compilados no RPO impediam o padrão de atualizar saldos. Em homologação; passivo de dados pendente de autorização.

**Módulo/Rota:** Protheus SIGAGCT — *Gestão de Contratos → Atualizações → Medições* (rotina **CNTA121**, encerramento da medição);

**Módulo ERP:** `Integracao e Filas`
consulta do contrato (**CNTA120**) → aba/visão **Cronograma Financeiro** (tabela CNF: `CNF_VLPREV`, `CNF_VLREAL`, `CNF_SALDO`);
saldo do contrato (`CN9_SALDO`); inventário de objetos do RPO (Configurador → *Ambiente → Repositório* / `SIGACFG`). No Fluig, a
entrada é o formulário de Faturamento de Contratos, campo **Valor Desconto** por item.

**Pré-condições**
- Contrato vigente com planilha, saldo conhecido antes do teste e cronograma financeiro com parcelas previstas.
- Medição lançada com **Valor Desconto** > 0 em ao menos um item (pode nascer no Fluig, com carimbo `QA`).
- Objetos `CN121ESD` e `UGCTE024` **ausentes** do RPO em todos os ambientes (inclusive os de schedule) — confirmado em 26/08.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: saldo do contrato (CN9_SALDO) e parcela do cronograma financeiro
  (CNF_VLREAL/CNF_SALDO) após o encerramento da medição`

**Passos**
1. No Protheus (CNTA120), anotar o **Saldo** do contrato e a próxima parcela do Cronograma Financeiro (Vl.Previsto, Vl.Realizado, Dt.Realizado).
2. Encerrar uma medição com desconto (valor bruto B, desconto D, líquido L = B − D) — via Fluig (*Direcionar Processo para*) ou
   direto na CNTA121.
3. Aguardar o processamento (fila ZZZ) e reabrir o contrato na CNTA120.
4. Conferir o novo saldo do contrato.
5. Abrir o Cronograma Financeiro e localizar a parcela correspondente à competência da medição.
6. Repetir com uma medição **sem** desconto (controle).
7. No Configurador, confirmar que `CN121ESD` e `UGCTE024` não constam do RPO.

**Resultado esperado**
- Saldo do contrato após = saldo antes − **L** (líquido). O desconto **não** é debitado em dobro nem ignorado.
- Parcela do cronograma: `Dt.Realizado` preenchida **e** `Vl.Realizado = L` (nunca zero com data preenchida); `CNF_SALDO = CNF_VLPREV − L`.
- Medição sem desconto: saldo − B e parcela com Vl.Realizado = B.
- Objetos antigos ausentes do RPO.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Saldo debitado de B + D (desconto aplicado no saldo), ou saldo inalterado; parcela com `Dt.Realizado` preenchida e `Vl.Realizado
  = 0` (parcela 0006 do contrato 00003-2026-3304); "os valores medidos não refletiram no Protheus".

**Severidade:** Alta

**Preparação de massa:** contrato com cronograma financeiro e saldo conhecido; duas medições (com e sem desconto), criadas pelo
executor com carimbo `QA`; RPO higienizado (objetos removidos em 25/08). **Não estornar** medições encerradas no período em que
os objetos antigos existiam (alerta do próprio ticket).

**Verificado em tela:** NÃO
**O que foi verificado:** somente o lado Fluig da entrada, **lido no fonte publicado** do Faturamento (256836): campo
**Valor Desconto** (`valorDesconto`, `maxlength=18`), crítica "O valor do desconto não pode ser maior que o valor total."
(toast, uma vez por linha — SDCASSI-543), campo **Saldo a Medir**, campo oculto `saldoContrato` preenchido com `CN9_SALDO`; a
planilha de importação tem as colunas `ITEM, COD. PRODUTO, DESCRIÇÃO PRODUTO, QUANTIDADE, DESCONTO`. O saldo do contrato **não
é exibido** ao usuário no formulário (campo oculto) nem no modal *Informações Complementares do Contrato* — não há superfície
Fluig para o efeito.
**Divergências encontradas:** nenhuma de rótulo. O ticket fala em "saldo do contrato"; no Fluig o único saldo visível é **Saldo a
Medir** (quantidade por item), que não é o CN9_SALDO.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-5119  (ambos · Concluído · SDCASSI-528)

**Título:** Medição processada pelo Fluig é gravada no Protheus como liberada, não como "Bloqueada" à espera de alçada de compras

**Origem:** FSWTBC-5119 — medições sendo gravadas no Protheus com status "Bloqueadas" mesmo após o processamento. Causa: **parametrização** —
o grupo de alçadas de compras havia sido habilitado para fazer alçada das medições também. Grupo ajustado, cliente homologou em
14/08 ("alterado os parâmetros conforme PRD e funcionando"). Não houve código.

**Módulo/Rota:** Protheus SIGAGCT — *Gestão de Contratos → Atualizações → Medições* (CNTA121, coluna/campo de situação da medição);

**Módulo ERP:** `Integracao e Filas`
cadastro de **grupos de aprovação/alçada** usado pelas medições (`<não documentado>` no ticket qual rotina/parâmetro — apenas
"o grupo de alçadas de compras"); no Fluig, o Faturamento de Contratos só mostra o desfecho do processo (Histórico) e o modal
*Informações Complementares do Contrato* (*Status da Integração GCT*).

**Pré-condições**
- Parametrização de alçada de medições igual à de PRD (grupo de alçadas de compras **não** aplicado a medições).
- Contrato vigente com planilha e fiscal; medição a encerrar (pode nascer no Fluig com carimbo `QA`).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: situação da medição (Bloqueada × Liberada) após o processamento e a
  parametrização do grupo de alçada`

**Passos**
1. No Protheus, conferir a configuração do grupo de alçadas de compras e confirmar que medições **não** estão sujeitas a ele
   (comparar com PRD).
2. Encerrar uma medição (Fluig → *Direcionar Processo para*, ou CNTA121).
3. Aguardar o processamento da fila ZZZ; no Fluig, Histórico com "Gravar/Encerrar Medição … Integração executada com sucesso" e
   saída de *Aguarda processamento Fila Protheus*.
4. Na CNTA121, localizar a medição gerada e ler a sua situação.
5. Conferir que não existe pendência de aprovação de alçada para a medição (nenhum registro de liberação pendente ligado a ela).

**Resultado esperado**
- Medição gravada **liberada** (não "Bloqueada"), sem pendência de alçada de compras.
- Processo Fluig concluído normalmente (sem *Correção*).
- Parametrização dos ambientes de teste igual à de produção.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Medição com status "Bloqueada" após o processamento, aguardando aprovação de um grupo de alçada de compras que não deveria se
  aplicar a medições.

**Severidade:** Média

**Preparação de massa:** medição encerrada pelo executor com carimbo `QA`; acesso de configuração no Protheus para conferir o
grupo de alçadas. Não alterar parametrização sem o dono do ambiente.

**Verificado em tela:** NÃO
**O que foi verificado:** apenas o lado Fluig, **visto renderizado**: Histórico dos Faturamentos 111980/111977/111973 mostra
"Gravar/Encerrar Medição … Integração executada com sucesso" e a parada em *Aguarda processamento Fila Protheus* (sem prazo) —
o status da medição no ERP não é exibido em nenhuma dessas telas; **lido no fonte publicado** — o formulário do Faturamento tem
a lógica "bloqueio (1 - bloqueado / 0 - liberado)" apenas para tipo de planilha (`CNL_CTRFIX`), não para o status da medição.
**Divergências encontradas:** nenhuma de rótulo (ticket sem passos de tela).
**Dados/massa usados:** leitura de 111980, 111977, 111973 — nenhum — não submetido.

---

## Casos que reprovam hoje por causa nunca corrigida (não ler como regressão)

| Caso | O que reprova hoje | Evidência (08/09/2026) | Por que não é regressão |
|---|---|---|---|
| **CT-FSWTBC-5005** | prazo da 317 não é de 1 dia útil | 112816 (v95): 27/08 18:11 → 01/09 18:00; 112855 (v97): 28/08 16:01 → 02/09 16:01 = 3 dias úteis, ambas `EXPIRED` | a entrega de 03/08 colocou **um** prazo (antes não havia); o valor de 1 dia útil nunca foi observado nesta base |
| **CT-FSWTBC-5006** (rótulos) | estado final 319 ainda se chama "Fim - Verificar Trava Orçamentária"; JS `verificaTravaOrcamentaria`/`fimVerificaTravaOrcamentaria: 104`; HTML "Controles da Verificação da Trava Orçamentária" | agregação de atividades + fonte publicado | a renomeação foi feita só na 317 e no painel; o restante nunca foi renomeado |
| **CT-FSWTBC-5106** (passo 2) | Definir Vencedor aceita proposta com valor 0,00 | bundle `main.js v2.0.0-260901`: críticas só para quantidade (`C8_XQTAUDI`), nenhuma para `C8_PRECO`/`C8_TOTAL` | o ticket foi encerrado atribuindo a causa ao usuário; a validação nunca existiu |
| **CT-FSWTBC-5081 / CT-FSWTBC-5016** (sintoma) | 3 SCs presas em *Aguarda Geração Alçadas* (309) há 13–32 dias, `EXPIRED`, responsável `admin` | 112593, 108618, 107681 | **causa não confirmada** — *Retorno Integração* vazio na 309 e Logs ZZY indisponíveis (404); pode ser a mesma família (parecer/saldo) ou outra. Não afirmar reincidência sem o ZZY |
| **CT-FSWTBC-5011** (observação) | *Aguarda processamento Fila Protheus* (182) sem prazo; 3 instâncias há 21–25 dias | 111980, 111977, 111973 — "Prazo: Sem prazo definido" | nunca houve prazo nessa atividade (o SDCASSI-507 só tratou a 317 da SC) |

## Superfície Fluig × efeito — resumo do lote

- **Com superfície no Fluig (12 casos):** 4998, 5005, 5006, 5007, 5011, 5016, 5017, 5067, 5081, 5096, 5106, 5118 — Histórico,
  campo *Retorno Integração* (painel *Verificar Retorno Protheus*), campo *Erro retornado pelo ERP Protheus* (Negociação/Cotação),
  Portal do Comprador, Logs Protheus (ZZY/ZZZ), Tracker.
- **SOMENTE PROTHEUS (2 casos):** 5036 (saldo do contrato / cronograma financeiro CNF) e 5119 (situação da medição e
  parametrização de alçada) — caso completo escrito para execução futura no ERP.

## Achados desta rodada (não estavam no ticket nem no ACHADOS-NOVOS)

1. **Prazo da 317 = 3 dias úteis**, não 1 (duas instâncias vivas, versões 95 e 97 do processo).
2. **Renomeação incompleta**: 319 "Fim - Verificar Trava Orçamentária" segue com o nome antigo; o JS ainda aponta
   `fimVerificaTravaOrcamentaria: 104` (sequência inexistente).
3. **SC 112855 presa em 317 por aditivo, não por saldo**: *Retorno Integração* = `Nao foi possivel ativar o modelo CNTA300 para
   gerar o aditivo.` com `docAlcadaGerada = Sim / numDocAlcada = 000091 / pedidoContratoGerado = Não` — mais um retorno de
   integração que o rótulo antigo ("Trava Orçamentária") teria mandado investigar no lugar errado.
4. **Sem crítica de valor zerado em Definir Vencedor** (só de quantidade) — contradiz o encerramento do SDCASSI-525.
5. **A seq. 62 da negociação (`ajusteProposta`) aparece em 3 movimentos de 1 instância** (22/05 → 06/08/2026) na agregação de
   08/09 — o registro do ACHADOS de que "não existe em 12.000 movimentos" precisa ser revisto; o nome não foi capturado.
6. **Datasets com nome suposto respondem 500 `NullPointerException` no GET search** (`dsProtheus_getParecerTecnico_restGetAll`,
   `dsProtheus_getAlcadas_restGetAll`, `dsProtheus_getPedidosxMedicao_restGetAll`, `dsProtheus_getSaldoContrato_restGetAll`) —
   confirma a técnica A17-a como discriminador; os dois nomes do FSWTBC-4078 (`getInfoPlanilhaxContrato` e
   `getInformaPlanxContrato`) **ambos existem e devolvem dados hoje** (200 com conteúdo), diferente do medido em 04/09.
7. `ds_fatcon_get_competencia` continua devolvendo `CODE:"undefined", STATUS:"ERROR", COMPETENCIA:"undefined"` (A17).

## CT-FSWTBC-5128  (protheus · Concluído · SDCASSI-532)

**Título:** Enviar um fechamento SEM_NF do SOC ao Protheus por HTTPS e confirmar que a resposta chega ao cliente antes do timeout, sem `Error: -100` no log do AppServer

**Origem:** FSWTBC-5128 — o envio de fechamento SEM_NF (SOC → Protheus, `POST …/UCOMA001/purchaseOrder`) devolvia `NoHttpResponseException` no cliente e, no console do Protheus, `write chunk error, context unavaliable` / `[CLASSREST.TLPP] RUNRESPONSE() … Fail to write response, the context will be closed. Error: -100`. Impacta pagamentos de prestadores. Encerrado como "Não será feito": a causa foi configuração do ambiente cloud. A análise do ticket **refutou** a premissa "em HTTP não ocorre" (a porta 4050 é SSL: texto puro abre TCP e é encerrado sem resposta, `curl rc=52`) e mostrou que o HTTPS entrega respostas de ~1 MB em chunked sem erro — o diagnóstico converge para **tempo de resposta do endpoint maior que o timeout do cliente**. Ficou sem endereçar a otimização da rotina, recomendada pela TOTVS.

**Módulo/Rota:** Protheus → serviço REST customizado `UCOMA001` (recurso `purchaseOrder`), contexto `/rest_dev` (só existe no servidor `caixade213858:4050`; TST/PRD usam contexto próprio — a confirmar) → consumido pelo SOC no *fechamento SEM_NF* de prestador; log em `console.log` do AppServer.

**Módulo ERP:** `Integracao e Filas`

**Pré-condições**
- Credencial REST do Protheus (usuário de integração) e acesso ao `console.log` do AppServer da base de homologação **que reflete produção (TST)** — o ticket registra que DEV é a base da TBC e TST a que espelha PRD.
- Um fechamento SEM_NF de homologação **pequeno** (1 prestador, poucos itens) e um **grande** (do porte que gerou os prints do ticket — quantidade a confirmar com o cliente).
- Valor do **timeout do cliente** (SOC / cliente HTTP usado no teste) conhecido e anotado antes de começar.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: corpo/status da resposta do endpoint REST e as linhas RUNRESPONSE / Error: -100 no console.log do AppServer`. Sem credencial do Protheus/REST nesta rodada.

**Passos**
1. Registrar o timeout do cliente (ex.: 60 s) e a URL completa do endpoint em HTTPS.
2. Enviar o fechamento **pequeno** por HTTPS; cronometrar; guardar status, tamanho do corpo e o `Connection` da resposta.
3. Enviar o fechamento **grande** por HTTPS; cronometrar da mesma forma.
4. Abrir o `console.log` do AppServer do período dos passos 2–3 e procurar `RUNRESPONSE`, `write chunk error` e `Error: -100`.
5. (Controle negativo — só para documentar) Chamar a mesma URL trocando `https://` por `http://` na porta SSL e registrar o resultado.
6. Conferir no Protheus o registro gerado pelo endpoint para o fechamento (pedido/movimento de fechamento do prestador — rotina *Prestador vs Fechamento*, nome de menu a confirmar) e cruzar com o retorno do passo 3.

**Resultado esperado**
- Passos 2–3: resposta HTTP 2xx completa, **em tempo menor que o timeout do cliente**, sem `NoHttpResponseException`; o tempo do passo 3 é anotado como linha de base da rotina.
- Passo 4: nenhuma ocorrência de `Fail to write response … Error: -100` nem `write chunk error` para as threads dos passos 2–3.
- Passo 5: a conexão TCP abre e é encerrada **sem** resposta HTTP (`curl rc=52`) — comportamento **esperado** de porta SSL recebendo texto puro; **não** é evidência de "funciona em HTTP" e não deve ser usado como comparação.
- Passo 6: o fechamento existe no Protheus **uma única vez** e corresponde ao que o passo 3 enviou (sem duplicidade por retentativa do cliente).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Cliente: `NoHttpResponseException` (o servidor "não respondeu"). Protheus: `write chunk error, context unavaliable` e `[CLASSREST.TLPP] RUNRESPONSE() … Fail to write response, the context will be closed. Error: -100`. Pagamentos de prestadores parados. Se o tempo do passo 3 ultrapassar o timeout do cliente, o sintoma reaparece mesmo com transporte saudável — e `Connection: keep-alive` não muda nada.

**Severidade:** Alta *(risco financeiro: fechamento e pagamento de prestadores)*

**Preparação de massa:** dois fechamentos SEM_NF de homologação (pequeno e grande) montados no SOC de homologação pelo executor, para prestador de teste; credencial REST; acesso ao console.log; valor do timeout do cliente. Não usar fechamento de produção.

**Verificado em tela:** NÃO
**O que foi verificado:** apenas a ausência de superfície: varredura dos fontes publicados baixados pelos lotes anteriores (formulários 256830–256836, Portal do Comprador, Tracker, Acompanhamento, Logs Protheus) sem nenhuma ocorrência de `UCOMA001`, `purchaseOrder` (no contexto SOC) ou `SEM_NF`; *Logs Protheus* (`/portal/p/1/portal_logs_protheus`) abre com as abas **Erros CV8 / Solicitacoes ZZY / Medicoes ZZZ**, campos *Filial*, *Data inicial/final* e *Mensagem, detalhe ou processo*, mas o `genericQuery?tables=CV8` responde **404** hoje (instabilidade conhecida) — e não há evidência de que a integração SOC grave CV8, portanto **não** se afirma que o erro apareceria ali.
**Divergências encontradas:** o ticket afirmava "o erro não ocorre em HTTP"; a própria análise mostrou que na porta 4050 não existe HTTP (SSL puro) — o caso incorpora isso como controle negativo (passo 5) para ninguém repetir a comparação errada. O contexto `/rest_dev` existe em um único servidor (`caixade213858`) e responde 404 nos demais.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-5148  (protheus · Em Homologação · SDCASSI-541)

**Título:** Apropriar todas as competências de um contrato com rateio por centro de custo de percentuais "quebrados" e conferir que a soma das linhas fecha a parcela em cada competência e o total do contrato ao fim da vigência

**Origem:** FSWTBC-5148 — a soma das parcelas **apropriadas** (R$ 67.824,67) ficou **maior** que o total do contrato (R$ 67.824,43): +R$ 0,24. Causa: o lançamento padrão **154 (Apropriação Despesa Antecipada)** calcula **cada linha do rateio** isoladamente, arredonda a 2 casas e não fecha o resíduo — a fração de centavo sobra em cada competência e **acumula** ao longo da vigência. O lançamento de **provisão** do mesmo contrato não tem o problema porque devolve o resíduo à última linha. Correção (pacote `SDCASSI_498_P2510_20260902_1843.ptm`, em homologação): a apropriação e o **estorno** passam a fechar o resíduo dentro da própria competência. Não há definição sobre o acerto dos resíduos já acumulados.

**Módulo/Rota:** Protheus → SIGAGCT → rotina customizada de **Apropriação de Despesa Antecipada** (o L041 a cita como `UGCTE003`; nome de menu **a confirmar no menu do cliente**) → SIGACTB → consulta de lançamentos (CT2) filtrando o LP **154** e o de **estorno** por contrato/competência.

**Módulo ERP:** `Integracao e Filas` *(a rotina é do GCT; o efeito é o lançamento contábil)*

**Pré-condições**
- Credencial no Protheus com acesso ao SIGAGCT (apropriação) e ao SIGACTB (consulta de CT2) da base de homologação.
- Pacote `SDCASSI_498_P2510_20260902_1843.ptm` aplicado **na ordem obrigatória** do ticket: criar os parâmetros, aplicar o pacote, ajustar as fórmulas dos LPs de apropriação e estorno.
- Um contrato de homologação **criado pelo executor** (a automação não cria contrato), vigente, com cronograma de parcelas e **rateio por centro de custo cujos percentuais não dividam a parcela de forma exata** — ex.: 3 centros de custo com 33,33 % / 33,33 % / 33,34 % sobre parcela de R$ 1.000,01; vigência de ≥ 6 competências para o resíduo poder acumular.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: linhas do LP 154 e do estorno no CT2 (valor por linha de rateio, soma por competência e soma na vigência)`. Apropriação é lançamento contábil — executar **só em homologação** (§2). Sem credencial nesta rodada.

**Passos**
1. Anotar o **valor total do contrato** (no ERP; no Fluig o mesmo número aparece em *Acompanhamento de Contratos → Informações do Contrato → Valor Atual do Contrato*, leitura auxiliar) e o valor de cada parcela do cronograma.
2. Executar a apropriação da **1ª competência**; no CT2, listar as linhas do LP 154 do contrato/competência e **somar**.
3. Repetir para **todas** as competências da vigência, somando a cada uma; guardar a tabela *competência × soma das linhas × parcela*.
4. Somar todas as competências e comparar com o total do contrato.
5. Executar o **estorno** de uma competência e listar as linhas do LP de estorno; comparar linha a linha com as do LP 154 da mesma competência.
6. (Auditoria do passivo) Para os contratos **já apropriados antes do pacote**, listar `soma(apropriado) − total do contrato` e registrar quantos e quanto — o ticket não define o acerto.

**Resultado esperado**
- Passo 2 e 3: em **cada** competência, `soma das linhas do LP 154 = valor da parcela`, ao centavo; a linha que absorve o resíduo é a última do rateio, dentro da mesma competência.
- Passo 4: `soma de todas as competências = valor total do contrato`, sem diferença de centavos (nem para mais nem para menos).
- Passo 5: cada linha de estorno tem o **mesmo valor** da linha apropriada correspondente — estorno com critério igual ao do lançamento.
- Passo 6: a lista existe e está documentada (é o passivo a corrigir); não é critério de aprovação do pacote, mas o caso não fecha sem ela.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Soma das parcelas apropriadas **R$ 67.824,67** contra total do contrato **R$ 67.824,43** (+R$ 0,24), diferença crescendo mês a mês; por competência, `soma das linhas ≠ parcela` em uma fração de centavo; estorno não espelhando o lançamento.

**Severidade:** Alta *(risco contábil — em qualquer contrato cujo rateio não divida a parcela de forma exata)*

**Preparação de massa:** contrato de homologação criado pelo executor no SIGAGCT com cronograma e rateio de percentuais não exatos (acima); parametrização contábil do pacote aplicada na ordem do ticket; competências de teste isoladas. Para o passo 6, consulta de leitura sobre os contratos existentes.

**Verificado em tela:** NÃO
**O que foi verificado:** no Fluig, só a superfície auxiliar: *Acompanhamento de Contratos* (`/portal/p/1/acompanhamentoContrato`) aberto pela sonda com **845 linhas**; os rótulos do modal *Informações Complementares* (*Valor Atual do Contrato*, *Saldo do Contrato*, *Valor Inicial do Contrato*, *Status da Integração GCT*, *Erro de Integração*) vêm da captura do L023 — o modal **não foi reaberto** neste lote. Nenhuma tela ou dataset do Fluig expõe parcela, linha de rateio contábil ou lançamento; `dsProtheus_getRateiosContratos_restGetAll` sem constraint devolve 0 linhas (leitura do L045).
**Divergências encontradas:** nenhuma entre ticket e tela. Ponto de atenção: o ticket deixa em aberto o acerto dos resíduos já lançados — o passo 6 existe para isso não se perder.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-5251  (protheus · Em Execução (Desenvolvimento) · SDCASSI-562)

**Título:** No dia seguinte ao fechamento do mês, conferir no Fluig que cada contrato vigente de periodicidade Mensal recebeu sua instância automática de Faturamento de Contratos da competência — uma por planilha e filial, nenhuma a mais, nenhuma a menos

**Origem:** FSWTBC-5251 — as medições mensais **não dispararam em 31/08** em produção, contrariando a periodicidade *Mensal* da DEM10014371 (ex.: contratos `00007-2023-2301` e `00005-2024-1501`); reincidência do SDCASSI-327. Causa (03/09): a rotina que calcula a **próxima data** da medição automática Mensal, em certos cenários, caía num período **já medido** no início do mês; a integração **recusava em silêncio** a nova medição **e não reagendava** a competência seguinte — o contrato simplesmente deixa de ser medido, sem erro visível. Patch em `hotfix/SDCASSI-562`, validado em homologação, ainda não aplicado/homologado pelo cliente. Pendência material: as medições de agosto que faltaram precisam ser levantadas e disparadas manualmente.

**Módulo/Rota:** Fluig → **Tracker - Processos Compras/Contratos** (`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`) → *Filtrar por* → Tipo **Faturamento de Contratos** (filtro de contrato `numContrato`) → **Pesquisar Registro**; instância do `wf_faturamento_contratos` (formulário *Faturamento de Contratos*: *Competência do Contrato*, *Filial do Contrato*, *Situação do Contrato*, *Data da Solicitação*; campo oculto `tipoInicioProcesso`); API `GET /process-management/api/v2/requests?processId=wf_faturamento_contratos` e `…/requests/{id}?expand=formFields`; **Logs Protheus → Medicoes ZZZ** (`/portal/p/1/portal_logs_protheus`). Complemento no Protheus: SIGAGCT → contrato → periodicidade *Mensal* e **próxima data de medição automática** (campo/rotina a confirmar no menu do cliente).

**Módulo ERP:** `Integracao e Filas` *(para o complemento: schedule de medição automática e próxima data)*

**Pré-condições**
- Sessão no Fluig com acesso ao Tracker e ao Logs Protheus (a conta de QA tem).
- Uma lista de **contratos vigentes com periodicidade Mensal** — a periodicidade **não é visível no Fluig** (`CN9_PERI`/`CN9_UNPERI` vêm vazios nas 963 linhas do dataset de contratos): vem do ERP ou da tabela da DEM10014371. Neste tenant, contratos que **comprovadamente** recebem instância automática: `00114-2022-5303` (filial 5303, 3 planilhas), `00001-2022-5304` (5304), `00001-2023-1201` (1201), `00005-2023-4301` (várias filiais 42xx/43xx).
- O schedule de medição automática de homologação **ativo** (roda às 01:00 — não é disparado manualmente neste caso).
- **Bloqueio:** a parte Fluig executa em leitura, integral; o complemento **"próxima data de medição" é SOMENTE PROTHEUS** (sem credencial nesta rodada); os contratos citados no ticket (`00007-2023-2301`, `00005-2024-1501`) **não existem neste tenant** — usar os acima. O caso depende de calendário: executar em D+1 do fechamento do mês (ou do dia previsto pela DEM para a periodicidade Mensal — confirmar na DEM).

**Passos**
1. Em D+1 (manhã), abrir o Tracker → Tipo **Faturamento de Contratos** → `numContrato` = `00114-2022-5303` → **Pesquisar Registro**; contar as instâncias com *Competência do Contrato* = competência do mês.
2. Abrir a instância mais recente e ler *Competência do Contrato*, *Filial do Contrato*, *Situação do Contrato* e *Data da Solicitação*.
3. Pela API, `GET /process-management/api/v2/requests/{id}?expand=formFields` da mesma instância: ler `tipoInicioProcesso`, `medContrCompetencia`, `numMedicao`, `zoomNumPlanilha`, `codFilialMedicao`.
4. Pela API, listar `requests?pageSize=200&page=N&processId=wf_faturamento_contratos` (todas as páginas) e agregar `startDate` por dia: localizar o **lote** de D+1 e seu tamanho.
5. Para cada contrato Mensal da lista, contar, na competência, as instâncias automáticas por `zoomNumContrato` + `codFilialMedicao` + `zoomNumPlanilha`.
6. Abrir **Logs Protheus → Medicoes ZZZ**, filtrar pelo contrato: ler `ZZZ_NUMMED`, `ZZZ_STATUS`, `ZZZ_MSGMED`, `ZZZ_DHRECE`/`ZZZ_DHEFET` da medição da competência.
7. (Complemento SOMENTE PROTHEUS) No contrato, ler a **próxima data de medição automática** depois do lote.

**Resultado esperado**
- Passo 1–3: existe instância da competência do mês com `tipoInicioProcesso = automático`, `medContrCompetencia` = a competência, `codSituacaoContrato = 05` (Vigente), uma por planilha (`zoomNumPlanilha` 000001, 000002, …) e por filial de medição, cada uma com `numMedicao` próprio.
- Passo 4: o lote de D+1 existe e o dia do lote é o previsto pela regra; não há "buraco" no calendário para contratos Mensais.
- Passo 5: **exatamente uma** instância automática por contrato+filial+planilha na competência — **zero** a menos (contrato não medido) e **zero** a mais (competência medida duas vezes).
- Passo 6: a medição consta na fila com status de efetivada e data/hora de efetivação preenchida; nenhuma linha com mensagem de recusa.
- Passo 7: a próxima data é a **competência seguinte**, nunca uma data dentro de período já medido.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Em D+1 não há instância automática para contratos Mensais (ex.: `00007-2023-2301`, `00005-2024-1501` em produção); nenhum erro em Histórico, ZZZ ou formulário — a recusa é silenciosa; a próxima data não é reagendada e o contrato segue sem medição na competência; o fiscal não recebe tarefa. **Assinatura observada neste tenant em 08/09:** nenhum lote em 31/08 nem em 01/09 (só 4 instâncias, todas `manual` e canceladas); o lote seguinte é de **05/09** (55 instâncias) e nele **12** instâncias saíram com competência **08/2026** (ex.: `113322` `00002-2024`/5303, `113306` `00003-2024-4201`/4201, `113309` `00291-2022-5303`/5303) — pares contrato/filial que **não** tinham instância de 08/2026 nos lotes de 01/08 (237) nem de 20/08 (70): a competência de agosto foi medida **com cinco dias de atraso** para eles.

**Severidade:** Alta *(faturamento, apropriação contábil e pagamento ao fornecedor da competência)*

**Preparação de massa:** nenhuma a criar no Fluig — o caso lê o que o schedule gerou. Precisa da lista de contratos Mensais (ERP/DEM) e do schedule ativo em homologação. Se a competência já passou sem lote, a recuperação é **medição manual** (Faturamento de Contratos com `tipoInicioProcesso = manual`) — e o levantamento de quais contratos ficaram sem medir é justamente o passo 5.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Tracker* aberto pela sonda (título "Tracker - Processos Compras/ Contratos", filtros *Filtrar por - Identificação do Processo / Solicitante* e *Informações do Fornecedor*, select de tipo com "Faturamento de Contratos", botões *Pesquisar Registro* / *Limpar*); *Logs Protheus* aberto (abas **Erros CV8 / Solicitacoes ZZY / Medicoes ZZZ**; `genericQuery` **404** hoje — a aba ZZZ não pôde ser exercitada, instabilidade conhecida). Pela API: **1.200 instâncias** do `wf_faturamento_contratos` (08/07 a 08/09), lotes por dia: 01/08 **237** (v47), 03/08 24, 05/08 86, 08/08 60, 10/08 43, 20/08 **70** (v50), 05/09 **55** (v52), 08/09 **60** (v52); **31/08: 1 e 01/09: 3**, todas `tipoInicioProcesso = manual`, canceladas. Campos de formulário lidos em **425** instâncias: todas as dos lotes com `tipoInicioProcesso = automático`, `codSituacaoContrato = 05`; competência 01/08 → 08/2026 (233) e 07/2026 (4); 20/08 → 08/2026 (70); 05/09 → 09/2026 (43) e **08/2026 (12)**; 08/09 → 09/2026 (60, 7 contratos, ex.: `00005-2023-4301` em 7 filiais). Nenhuma instância automática de contrato com *Data Final* anterior ao início. Contratos do ticket: **não existem** (dataset `dsProtheus_getContratos_restGetAll`, 963 linhas, sufixos 2301/1501 ausentes). Passo 7 não executado (Protheus).
**Divergências encontradas:** (1) `00007-2023-2301` e `00005-2024-1501` não existem neste tenant; (2) o calendário de lotes aqui não é "dia 31": há lotes em vários dias do mês e **nenhum em 31/08–01/09**, com 12 medições de 08/2026 abertas só em 05/09 — mesma assinatura do ticket, sem afirmar a causa (o schedule de homologação pode ter ficado parado); (3) as instâncias "repetidas" de um mesmo contrato na mesma competência **não são duplicidade**: diferem só em `zoomNumPlanilha` (000001/000002/000003), `numMedicao` e `documentid` — é uma instância por planilha/filial, como o skill descreve ("um processo por filial"); (4) a periodicidade do contrato **não aparece no Fluig** (`CN9_PERI`/`CN9_UNPERI` vazios) e o único marcador de início automático é o campo oculto `tipoInicioProcesso` — o Tracker não o exibe (não verificado se a visão *Faturamento de Contratos* mostra competência); (5) o JS do formulário tem `tipoInicioProcesso == 'manual' || 'automático'` (A2-d) — a tela não distingue os dois modos.
**Dados/massa usados:** leitura de 1.200 instâncias e de 425 formulários pela API; dataset de contratos em leitura. Nada submetido.

---
