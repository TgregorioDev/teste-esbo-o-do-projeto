<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# Faturamento de Contratos

Casos de teste E2E do Fluig — módulo Faturamento de Contratos.

| | |
|---|---|
| Casos neste arquivo | 104 |
| Verificados em tela | 1 total · 100 parcial · 3 não |

> **Como ler.** Cada caso descreve o comportamento **correto esperado hoje**. A maioria dos
> defeitos de origem já foi corrigida — o caso é de regressão: se reprovar, o defeito voltou.
> Os que reprovam hoje por causa nunca corrigida estão marcados no próprio caso.
> *Verificado em tela* diz o que foi conferido no ambiente de homologação em 08/09/2026;
> **PARCIAL** costuma significar que a conta de QA não tem o perfil necessário (comprador,
> gestor, fiscal, fornecedor), não que o caso seja inválido.

---

## CT-FSWTBC-618  (protheus · Concluído)

**Título:** Verificar que a medição automática da madrugada abre um processo de Faturamento de Contratos por filial e chega ao Fiscal de Serviço sem parar na fila

**Origem:** FSWTBC-618 — "[DEM10009646] Erro no processo de medição de contratos"; conteúdo perdido (só título). Mesma semana dos FSWTBC-183/629: a medição automática falhou em várias frentes na virada 2024/2025. Caso escrito como **caracterização de caminho** do robô de medição, ancorado no que a base mostra hoje.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** (`wf_faturamento_contratos`, form 256836) → instâncias iniciadas por **Usuário Integrador Fluig (`consumerkeycompras`)**; **Tracker** → *Faturamento de Contratos*; **Logs Protheus** → *Medicoes ZZZ*. Origem no ERP: campo **Dia Med Auto** (aba *EMPRESA Integração* do contrato, GCT) — dispara às **01:00**.

**Pré-condições**
- Contrato **vigente** no Protheus com *Dia Med Auto* preenchido, planilha de valor fixo, *Fis. Serviço* cadastrado e a(s) filial(is) no *Controle de Acesso* da planilha.
- Robô de medição ativo (schedule do Fluig) — o efeito só existe na manhã seguinte ao dia configurado.
- **Bloqueio:** parcial — a conta de QA não é fiscal de nenhum contrato e não enxerga o cadastro GCT; a leitura das instâncias geradas pelo robô é possível e foi feita.

**Passos**
1. Na manhã seguinte ao *Dia Med Auto*, abrir o **Tracker** → *Filtrar por* = **Faturamento de Contratos**, *Status* = **Abertos**, *Data de Solicitação* = a data do dia; clicar **Pesquisar Registro**.
2. Para o contrato-alvo, contar as linhas cujo *Solicitante* é **Usuário Integrador Fluig** e ler *Código da Filial Medição*, *Nº Contrato*, *Competência do Contrato*, *Nº Planilha*, *Atividade Atual*, *Responsável Atual*.
3. Abrir uma dessas instâncias → aba **Histórico**: conferir a sequência **Busca Informações do Contrato (88)** → *Aprovação Prévia* (se *Ap. Prévia EQUIPE* = sim) → **Realizar Medição do Contrato (28)**, e a hora de criação da 1ª tarefa.
4. Na aba **Formulário**, conferir *Fornecedor, Nº do Contrato, Revisão, Filial da Medição, Competência do Contrato, Nº da Planilha, Fiscal de Serviço, Fiscal de Contrato* preenchidos e *Houve Prestação de Serviço?* = **Não** (padrão).
5. Abrir **Logs Protheus** → *Medicoes ZZZ*, filtrar *Id Fluig* = nº do processo; ler *Status* e *Msg Medicao*.
6. (Com o Fiscal de Serviço) concluir *Realizar Medição do Contrato* e acompanhar o Histórico até **Pedido Gerado?**.

**Resultado esperado**
- Passo 2: **uma instância por filial** do contrato, todas do mesmo dia, criadas entre ~01:00 e ~05:00, com *Atividade Atual* = *Realizar Medição do Contrato* e *Responsável Atual* = o Fiscal de Serviço (pessoa nominal, não pool nem `admin`).
- Passo 3: nenhuma entrada em *Correção (117)* antes da tarefa do fiscal; *Busca Informações do Contrato* concluída em segundos.
- Passo 4: campos do contrato consistentes com o GCT; competência = mês corrente.
- Passo 5: registro ZZZ com *Status* `S` após a gravação; sem `E`.
- Passo 6: a instância sai de *Aguarda processamento Fila Protheus (182)* em ≈ 7 min e chega a *Notifica Fornecedor*.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Nenhuma instância automática na manhã seguinte, ou instâncias criadas e desviadas para *Correção*/*Aguarda processamento Fila Protheus* sem chegar ao fiscal — mensagem exata `<não documentado>` (conteúdo do ticket perdido).

**Severidade:** Alta *(medição não gerada = pagamento a fornecedor atrasado)*

**Preparação de massa:** um contrato vigente com *Dia Med Auto* = D+1 e fiscal de serviço disponível, configurado no Protheus pela equipe de Contratos (a automação/QA não cria contrato). Hoje a base já tem uma instância automática viva para os passos 1–5: **111977**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** instância **111977** lida pela API de tarefas — nascida em **15/08/2026 03:00:22** por **`consumerkeycompras`** (assinatura do robô, dentro da janela 01:00–05:00 descrita pelo cliente), com a cadeia *88 → … → 105 Gravar/Encerrar Medição → 182 Aguarda processamento Fila Protheus*, e **parada na 182 desde 17/08 16:30** com responsável `admin` e `chosenAssignees` vazio. Tracker aberto com os filtros *Filtrar por / Status / Data de Solicitação / Número do Contrato*. Formulário 256836 em branco conferido com os rótulos citados nos passos 4. Logs Protheus aberto: abas presentes, consulta em 404 (ambiente).
**Divergências encontradas:** o ticket é sobre a medição *não sair*; hoje o sintoma vivo é a medição automática **sair e travar na fila** (111977, 22 dias). *Medicoes ZZZ* indisponível hoje (genericQuery 404). O formulário de Faturamento não tem campo de retorno de integração — o diagnóstico só existe no Histórico e no widget de logs.
**Dados/massa usados:** nenhum — não submetido; leitura de 111977/111980/111973.

---

## CT-FSWTBC-629  (FSWTBC-629 · ambos · Concluído)

**Título:** Abrir uma medição de contrato pelo Faturamento de Contratos e ver a busca automática de dados do contrato concluir sem erro.

**Origem:** FSWTBC-629 — erro no processo de medição automática, lado Fluig. Par do FSWTBC-183 (lado
Protheus/API), mesma data: a falha de 01/01 foi investigada nos dois lados, em tickets que não se referenciam.

**Módulo/Rota:** Fluig → **Processos** → *Iniciar Solicitações* → categoria **Contratos** → **Faturamento de Contratos**
(`/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos`).

**Pré-condições**
- Contrato **Vigente** no Protheus, com planilha e saldo a medir, e competência em aberto.
- Integração `apiRESTProtheus_CASSI` no ar — a atividade de serviço *Busca Informações do Contrato*
  é quem preenche o formulário.
- **Bloqueio:** a confirmação final (a medição chegar à CNB/CND do Protheus) exige acesso ao ERP —
  **sem credencial**. Verificável no Fluig pela âncora do **Histórico da solicitação**. Além disso,
  concluir o caso exigiria **iniciar uma medição real**, o que este piloto não fez (regra §2).

**Passos**
1. Acessar **Processos → Iniciar Solicitações**.
2. Na categoria **Contratos**, abrir **Faturamento de Contratos**.
3. Confirmar que a tela abre em **Início**, com as abas *Formulário / Informações / Histórico / Anexos*.
4. Na aba **Formulário**, preencher a seção *Informações da Medição* com o contrato de teste
   (**Fornecedor**, **Nº do Contrato**, **Revisão**, **Filial do Contrato**, **Competência do Contrato**,
   **Filial da Medição**).
5. Movimentar com **Enviar** (*Salva e movimenta a atividade*).
6. Reabrir a solicitação em modo leitura por
   `/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=<nº do processo>` e abrir a aba **Histórico**.

**Resultado esperado**
- O processo movimenta de **Início** para a atividade de serviço **Busca Informações do Contrato** sem erro.
- No **Histórico**, a linha da atividade *Busca Informações do Contrato* traz
  *"Executando atividade de serviço do sistema"* seguida de **"Integração executada com sucesso - Tempo de Execução N s"**.
- As tarefas automáticas seguintes — **Aprovação Prévia?** e **Inibir Aprov. Fiscal?** — decidem e
  encaminham o processo, registrando *"Tarefa Automática: Decisão tomada conforme condição N"*.
- O processo chega à atividade **Realizar Medição do Contrato** com os campos de *Informações da Medição*
  preenchidos a partir do contrato (Tipo do Contrato, Situação do Contrato, Data Início, Data Final,
  Nº da Medição, Nº da Planilha, Objeto).
- Nenhuma mensagem de erro de comunicação com o Protheus.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro no processo de medição automática: a solicitação não avança da busca automática, ou avança com
  os campos da medição vazios. `<mensagem exata não documentada no ticket>`

**Verificado em tela:** PARCIAL
**O que foi verificado:** o processo **Faturamento de Contratos** (`wf_faturamento_contratos`) está
publicado, aparece na categoria **Contratos** de *Iniciar Solicitações* e **abre** para este perfil —
heading *Início*, abas *Formulário / Informações / Histórico / Anexos*, botão **Enviar** (tooltip
*Salva e movimenta a atividade*), além de *Somente salvar* e *Descartar alterações*. O formulário
carrega com as seções e rótulos: *Identificação do Processo/Solicitante* (Nº do Processo, Solicitante,
Email do Solicitante, Data e Hora da Solicitação) e *Informações da Medição* (Fornecedor, Nº do
Contrato, Revisão, Filial do Contrato, Competência do Contrato, Filial da Medição, Tipo do Contrato,
Situação do Contrato, Data Início, Data Final, Nº da Medição, Nº da Planilha, Objeto, Aprovação Prévia
CSE?, Aprovador CSE, Aprov. Fiscal de Serviço?, Fiscal de Serviço, Fiscal de Contrato). **Sem iniciar
nada**, abri em modo leitura a medição real **112932** e li o Histórico, que confirma a cadeia
esperada: *"Usuário TBC (TOTVS) movimentou a atividade Início para a atividade Busca Informações do
Contrato"* → *"Busca Informações do Contrato — Executando atividade de serviço do sistema —
**Integração executada com sucesso - Tempo de Execução 2 s**"* → *"Aprovação Prévia? — Tarefa
Automática"* → *"Inibir Aprov. Fiscal? — Tarefa Automática"*, com **Atividade atual: Realizar Medição
do Contrato (Em progresso)**.
**Divergências encontradas:** nenhuma em relação ao ticket. Observação de operação: a rota
`pageworkflowview?processInstanceId=<n>` devolve *"Esta tarefa não está mais sob sua
responsabilidade!"*; para inspecionar sem assumir a tarefa é preciso usar
`app_ecm_workflowview_detailsProcessInstanceID=<n>`, que abre em *Detalhes da Solicitação* e avisa
*"O processo foi aberto em modo de 'Visualização'!"*.
**Dados/massa usados:** solicitação pré-existente **112932** (*Faturamento de Contratos*), apenas leitura. Nada submetido.

---

## CT-FSWTBC-634  (sem SDCASSI · fluig · Concluído — correção declarada provisória)

**Título:** Ao trocar a planilha/competência de uma medição, o rateio da medição anterior é descartado e recarregado.

**Origem:** FSWTBC-634 — "[746323] Erro no faturamento de contratos na atividade de realiza medição":
o formulário **não limpava o rateio anterior**, e o rateio de uma planilha anterior permanecia
contaminando a medição seguinte. Processos afetados 5303–5308.
**Atenção:** o próprio registro diz que a correção foi parcial — *"Paulo ajustou os formulários, mas
ficou de ajustar definitivamente"* — e **não há ticket de continuidade**. Trate como risco vivo.

**Módulo/Rota:** Home → aba **Contratos** → **Faturamento de Contratos**
(`/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos`) → seções **Informações da Medição**,
**Itens da Medição** e a grade de **Rateio** (`tblRateio`).

**Pré-condições**
- Contrato vigente no Protheus, com fornecedor, competência e **duas planilhas de medição distintas**,
  cada uma com rateio diferente (é isso que expõe o resíduo).
- Fiscal/CSE cadastrado para a filial da medição.
- **Bloqueio:** **sim** — exige massa de contrato + medição + duas planilhas no Protheus. Contrato não
  é criável pela automação (ver `docs/criacao-de-contrato-inviavel.md`) e a seleção depende dos zooms
  do ERP. Sem credencial de Protheus não há como preparar a segunda planilha.

**Passos**
1. Abrir **Faturamento de Contratos**.
2. Preencher, **nesta ordem** (os zooms são encadeados e os seguintes só habilitam depois do anterior):
   **Fornecedor \*** → **Nº do Contrato \*** → **Competência do Contrato \*** → **Filial da Medição \***.
3. Selecionar em **Nº da Planilha \*** a **primeira** planilha e aguardar o carregamento.
4. Conferir a grade de **Rateio** e anotar as linhas (centros de custo e percentuais).
5. **Sem recarregar a página**, trocar **Nº da Planilha \*** para a **segunda** planilha.
6. Conferir novamente a grade de **Rateio**.

**Resultado esperado**
- Após a troca, a grade de **Rateio** contém **apenas** as linhas da segunda planilha.
- Nenhuma linha da primeira planilha permanece (nem duplicada, nem somada).
- A soma dos percentuais volta a 100% referente à nova planilha.
- O mesmo vale ao trocar **Competência do Contrato** ou **Filial da Medição**.

**Resultado se o defeito reincidir**
- O rateio da planilha anterior **permanece** na grade e contamina a medição seguinte — rateio somado
  ou duplicado, com impacto direto na contabilização. Foi o que ocorreu nos processos **5303 a 5308**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a rota abre (título *Cassi - Fluig Plataforma - Movimentar Solicitação*) e o
formulário **Faturamento de Contratos** (iframe `/webdesk/streamcontrol/256836/...`) traz as seções
*Identificação do Processo/Solicitante*, **Informações da Medição**, **Itens da Medição**,
*Validação do CSE - (Centro de Serviços Especializados)*, *Validação da Medição do Contrato CSE - (Centro
de Serviços Especializados)* e *Validação do Fiscal de Contrato*; e as grades **`tblItensMedicao`** e
**`tblRateio`**. Os campos existem com os rótulos: **Fornecedor \***, **Nº do Contrato \***, **Revisão \***,
**Filial do Contrato\***, **Competência do Contrato \***, **Filial da Medição \***, **Tipo do Contrato\***,
**Situação do Contrato\***, **Data Início\***, **Data Final\***, **Nº da Medição \***, **Nº da Planilha \***,
**Objeto \***, **Aprovação Prévia CSE? \***, **Aprovador CSE \***, **Aprov. Fiscal de Serviço? \***,
**Fiscal de Serviço \***, **Fiscal de Contrato \***.
**Divergências encontradas:** com o formulário vazio, **Nº do Contrato**, **Competência do Contrato**,
**Filial da Medição** e **Nº da Planilha** vêm com o campo de busca desabilitado — confirmam-se os
zooms encadeados, e o caso só anda com massa real. As grades **Itens da Medição** e **Rateio** existem
no DOM mas nascem ocultas.
**Dados/massa usados:** nenhum — não submetido, nenhum zoom acionado.

---

## CT-FSWTBC-639  (fluig · Concluído)

**Título:** Fiscal executa a medição de um contrato e os campos herdados do contrato chegam preenchidos e não editáveis.

**Origem:** FSWTBC-639 — "[745650] Tela de medição de contrato está permitindo alteração de campos
que deveriam vir do contrato e deveriam ser fixos". Campos herdados do contrato estavam editáveis na
medição, permitindo divergência entre o contratado e o medido.

**Módulo/Rota:** *Faturamento de Contratos* — `/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos`
(início manual) ou **Central de Tarefas → Tarefas a concluir → "Realizar Medição do Contrato"** (etapa 28)
para a medição gerada pelo robô. Formulário no iframe `256836`.

**Pré-condições**
- Contrato vigente no Protheus com planilha de medição e fiscal de serviço cadastrado.
- Uma medição na etapa **Realizar Medição do Contrato**, atribuída ao executor do teste.
- **Bloqueio:** parcial — a medição real cai para o **fiscal do contrato** (pessoa física cadastrada
  no Protheus); as instâncias abertas hoje (113263, 113264, 113265, criadas pelo robô em 04/09/2026
  às 03:00) são de terceiros e não podem ser abertas nem movimentadas por esta conta.

**Passos**
1. Abrir *Faturamento de Contratos* e, em **Informações da Medição**, encadear os zooms
   **Fornecedor** → **Nº do Contrato** → **Competência do Contrato** → **Filial da Medição** →
   **Nº da Planilha**.
2. Conferir, campo a campo, o bloco herdado do contrato: **Revisão**, **Filial do Contrato**,
   **Tipo do Contrato**, **Situação do Contrato**, **Data Início**, **Data Final**, **Nº da Medição**,
   **Objeto**, **Aprovador CSE**, **Fiscal de Serviço**, **Fiscal de Contrato**.
3. Tentar digitar em cada um deles (clique + digitação, sem `force`).
4. Abrir as grades **Itens da Medição** e **Rateio** e conferir quais colunas aceitam digitação.
5. No Acompanhamento de Contratos, abrir o ícone **Informações do Contrato** do mesmo contrato e
   comparar os valores do modal *Informações Complementares do Contrato* com o que a medição exibe.

**Resultado esperado**
- Os campos herdados do contrato são **somente leitura** e não aceitam digitação — nenhum deles é
  editável em nenhuma etapa da medição.
- Os únicos controles editáveis em *Informações da Medição* são os **zooms** (Fornecedor, Nº do
  Contrato, Competência do Contrato, Filial da Medição, Nº da Planilha) e os dois combos
  **Aprovação Prévia CSE?** e **Aprov. Fiscal de Serviço?**.
- Na medição, só **Quantidade** (Itens) e **% Rateio / Centro de Custo / Classe de Valor** (Rateio)
  aceitam edição — e a Quantidade apenas quando o Tipo de Contrato/Tipo de Planilha permite.
- Os valores exibidos batem com o contrato: Revisão, Tipo, Situação, Datas e Objeto idênticos aos do
  modal *Informações Complementares do Contrato*.
- Na etapa **Validação do Fiscal de Contrato** (passo 4 do fluxo), *Informações da Medição*,
  *Itens da Medição* e *Validação da Medição do Contrato* chegam **preenchidas e bloqueadas**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Campos que deveriam vir fixos do contrato aceitam digitação na tela de medição, permitindo medir
  com Revisão/Datas/Objeto/Tipo diferentes dos contratados. Mensagem exata `<não documentado>` — o
  ticket não registra texto de erro, só o comportamento.

**Severidade:** Alta *(divergência entre contratado e medido tem efeito financeiro direto)*

**Preparação de massa:** um contrato vigente com planilha de medição e uma medição parada em
*Realizar Medição do Contrato* **atribuída ao executor** — hoje só o fiscal do contrato cadastrado no
Protheus recebe essa tarefa. Alternativa sem massa de terceiro: iniciar uma medição manual pelo
processo *Faturamento de Contratos*, o que exige contrato de valor variável e **grava no ERP**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de *Faturamento de Contratos* foi aberto (iframe `256836`) e
inspecionado campo a campo. Seções: **Identificação do Processo/Solicitante** e **Informações da
Medição**. São **somente leitura** já no formulário em branco: `numProcesso`, `usuarioSolicitante`,
`emailSolicitante`, `dataSolicitacao`, `horaSolicitacao`, **Revisão** (`numRevisao`), **Filial do
Contrato** (`filialContrato`), **Tipo do Contrato** (`tipoContrato`), **Situação do Contrato**
(`situacaoContrato`), **Data Início** (`dtInicioContrato`), **Data Final** (`dtFinalContrato`),
**Nº da Medição** (`numMedicao`), **Objeto** (`objetoContrato`), **Aprovador CSE**
(`emailAprovadorCSE`), **Fiscal de Serviço** (`emailFiscalServico`) e **Fiscal de Contrato**
(`emailFiscalContrato`). Editáveis: os cinco zooms (`zoomFornecedor`, `zoomNumContrato`,
`zoomCompetencia`, `zoomFilialMedicao`, `zoomNumPlanilha`) e os combos `aprovPreviaCSE` e
`aprovFiscalServico`. As grades `tblItensMedicao` e `tblRateio` existem no DOM e **nascem ocultas**
(40 campos ocultos no formulário em branco). O modal *Informações Complementares do Contrato* foi
aberto e traz os grupos *Dados Gerais / Datas / Valores Financeiros / Reajustes e Aditivos /
Localização e Entrega / Impostos e Bases / Processos, Cotações e Integração / Outros*.
**Divergências encontradas:** o rótulo do ticket ("campos que deveriam vir do contrato") não existe
como rótulo de tela — o bloco se chama **Informações da Medição**. No modal do contrato, o campo
**Status** aparece truncado (`Finali`), mesmo defeito de apresentação já mapeado como D-08.
**Dados/massa usados:** nenhum — não submetido; nenhuma medição de terceiro foi aberta.

---

## CT-FSWTBC-646  (fluig · Concluído)

**Título:** Medição que falha na integração cai para o grupo de correção, e não para todos os usuários do grupo do contrato.

**Origem:** FSWTBC-646 — "[747346] Medição 6029 caiu para todos os usuários do grupo, ao invés de cair
para grupo de correção. Erro no processo nº 6029". Duplicata formal de FSWTBC-184 (mesmo processo
6029), aberta quatro dias depois — mesmo incidente, dois registros.

**Módulo/Rota:** *Faturamento de Contratos* (`wf_faturamento_contratos`) → etapa **Correção** (seq 117),
observada na **Central de Tarefas** (aba *Tarefas a concluir*, campo **Responsável** do card) e na API
de workflow (`/process-management/api/v2/requests/<id>/tasks`, campo `assignee`).

**Pré-condições**
- Uma medição em andamento cuja gravação/integração com o Protheus falhe (as 3 tentativas se esgotam).
- Grupo de correção do faturamento configurado no processo.
- **Bloqueio:** parcial — provocar a falha de integração depende do ERP e **não deve ser forçado**.
  As medições existentes são de terceiros e não podem ser abertas nem movimentadas por esta conta;
  a verificação foi feita por leitura do responsável das tarefas.

**Passos**
1. Localizar uma medição que tenha falhado na gravação (Histórico com 3 tentativas e queda para
   **Correção**).
2. Abrir a **Central de Tarefas**, aba **Tarefas a concluir**, e localizar a solicitação.
3. Ler o campo **Responsável** do card.
4. Conferir, com um segundo usuário do grupo do contrato **que não seja do grupo de correção**, que a
   tarefa **não** aparece para ele.
5. Conferir que a tarefa aparece para os membros do grupo de correção.

**Resultado esperado**
- A tarefa da etapa **Correção** fica no **pool do grupo de correção do faturamento**
  (`Pool:Group:G.P.FatConCorrecaoIntegraca`) — e só nele.
- Usuários do grupo do contrato que não pertencem ao grupo de correção **não** enxergam a tarefa.
- Nas etapas normais da medição (Aprovação Prévia / Realizar Medição do Contrato), o responsável é
  **pessoa física** (o aprovador da equipe ou o fiscal), nunca o grupo inteiro.

**Resultado se o defeito reincidir**
- A medição cai para **todos os usuários do grupo** do contrato em vez do grupo de correção — muita
  gente vê a tarefa e ninguém é responsável por ela. Mensagem exata: não há; o sintoma é o campo
  **Responsável** apontando para o grupo errado.

**Severidade:** Média *(roteamento errado espalha a tarefa e atrasa a correção; sem efeito financeiro direto)*

**Preparação de massa:** uma medição que efetivamente falhe na integração — não force. O caso é
executável sobre incidente natural, com dois usuários disponíveis: um do grupo de correção e um do
grupo do contrato.

**Verificado em tela:** PARCIAL
**O que foi verificado:** na Central de Tarefas confirmei que o card exibe **Responsável** por
solicitação (aba **Tarefas a concluir 11**). Por leitura da API de workflow (somente GET), a medição
**113249** (`wf_faturamento_contratos`, aberta em 03/09/2026 17:23) tem 10 movimentos e o corrente
(`NOT_COMPLETED`, etapa 117 — **Correção**) está com
`assignee.code = Pool:Group:G.P.FatConCorrecaoIntegraca` — ou seja, **no grupo de correção**, que é o
comportamento correto. Os movimentos anteriores mostram o desenho esperado: etapa 88 com pessoa
física, etapas automáticas com `System:Auto`, etapa 192 com pessoa física e etapa 162 com `admin`. As
três medições criadas pelo robô em **04/09/2026 às 03:00** (113263, 113264, 113265) estão nas etapas
25 e 28 com **responsável pessoa física** (login de colaborador), não com grupo.
**Divergências encontradas:** o ticket cita "processo nº 6029", numeração que **não existe** na base
acessível (as instâncias correntes estão na faixa 113xxx) — o número é de outro ambiente/época. O
rótulo "grupo de correção" aparece na tela como o nome de pool **G.P.FatConCorrecaoIntegraca**.
**Dados/massa usados:** nenhum — leitura das solicitações 113249, 113263, 113264, 113265. Nenhuma foi
aberta, movimentada ou cancelada.

---

## CT-FSWTBC-652  (FSWTBC-652 · ambos · Concluído)

**Título:** Tentar movimentar uma medição sem itens carregados e sem prestação de serviço, e confirmar que o Fluig barra e não integra valor zero ao Protheus.

**Origem:** FSWTBC-652 — erro no processo de medição de contratos. São **dois** defeitos num: (a) o
faturamento permite **movimentar sem carregar os itens** da medição e (b) **integra com o Protheus mesmo
sem prestação de serviço**, gerando lançamento indevido no ERP.

**Módulo/Rota:** Fluig → **Central de Tarefas** → tarefa **Realizar Medição do Contrato** do processo
**Faturamento de Contratos** (`wf_faturamento_contratos`), aba **Formulário**, seções *Itens da Medição*
→ **Itens** e **Rateio Contábil**.

**Pré-condições**
- Uma medição em andamento, parada na atividade **Realizar Medição do Contrato**, atribuída ao usuário
  que vai executar o teste (a tarefa precisa estar **sob sua responsabilidade** — do contrário a tela
  abre em modo *Visualização*).
- Contrato com planilha e saldo a medir.
- **Bloqueio:** (1) a confirmação de que **nada** foi lançado no ERP exige acesso ao Protheus — **sem
  credencial**; a âncora possível no Fluig é o **Histórico** da solicitação (ausência da atividade de
  integração) e o modal **Informações Complementares do Contrato** (campos *Status da Integração GCT*,
  *Erro de Integração*, *Medição Acumulada*). (2) A tarefa **112932** existente está sob
  responsabilidade de outro usuário (*Maycon Castro de Oliveira*), e este piloto não assumiu nem
  movimentou tarefa alheia — a execução exige massa própria.

**Passos**
1. Abrir a **Central de Tarefas** e, na aba de tarefas a concluir, abrir a solicitação de
   **Faturamento de Contratos** parada em **Realizar Medição do Contrato** (clicando na tarefa, para
   que abra em modo de **Edição**).
2. Na aba **Formulário**, ir à seção **Itens da Medição** e **não** carregar nenhum item: deixar a aba
   **Itens** vazia (sem *Download Planilha de Itens Modelo* / *Upload Planilha de Itens Preenchida*).
3. Marcar **Houve Prestação de Serviço? = Não**.
4. Preencher **Observações** e clicar em **Enviar** (*Salva e movimenta a atividade*).
5. Repetir o cenário marcando **Houve Prestação de Serviço? = Sim**, ainda sem itens carregados, e
   clicar em **Enviar**.
6. Abrir a aba **Histórico** da solicitação e o modal **Informações Complementares do Contrato** do
   contrato correspondente.

**Resultado esperado**
- Com a aba **Itens** vazia, o **Enviar** é **recusado**: o formulário critica a ausência de itens da
  medição e o processo **não** movimenta.
- Com **Houve Prestação de Serviço? = Não**, o processo **não** dispara a integração de medição com o
  Protheus — nenhum lançamento é gerado no ERP.
- Nenhuma medição de **valor zero** chega ao Protheus.
- O **Histórico** não registra atividade de integração para os cenários recusados.
- Os totais dos itens (**Quantidade × Valor Unitário − Valor Desconto = Valor Total**) só são calculados
  sobre itens efetivamente carregados.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O faturamento **permite movimentar sem carregar os itens** da medição.
- A **integração com o Protheus é disparada mesmo sem prestação de serviço**, gerando lançamento
  indevido no ERP (medição com valor zero).

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri a medição real **112932** em modo leitura
(`app_ecm_workflowview_detailsProcessInstanceID=112932`) e o formulário de **Faturamento de Contratos**
carregou completo, o que confirma cada elemento citado nos passos: a seção **Itens da Medição** com o
radio **"Houve Prestação de Serviço? *"** (opções **Sim** / **Não**) e **Observações ***; as abas
**Itens** e **Rateio Contábil**; as colunas de item **Item, Cod. Produto, Desc. Produto, Saldo a Medir,
Quantidade, Valor Unitário (R$), Valor Desconto (R$), Valor Total (R$)**; as colunas de rateio **Item,
% Rateio, Centro de Custo, Classe de Valor**; e os controles **Download Planilha de Itens Modelo** e
**Upload Planilha de Itens Preenchida**. O cabeçalho mostra **Atividade atual: Realizar Medição do
Contrato (Em progresso)**, **Responsável: Maycon Castro de Oliveira**. A tela avisa explicitamente:
*"O processo foi aberto em modo de 'Visualização'! Por favor abra em modo de 'Edição' para que todas as
funcionalidades seja carregadas, para isso acesse através de sua 'Central de Tarefas'."* — por isso
**não** exercitei a crítica do Enviar: fazê-lo exigiria assumir e movimentar a tarefa de outro usuário.
**Divergências encontradas:** nenhuma entre o ticket e a tela. Nota: o ticket fala em "carregar os
itens"; na tela de hoje o carregamento se dá pelos botões *Download Planilha de Itens Modelo* /
*Upload Planilha de Itens Preenchida* — vale citá-los no passo a passo para não deixar o executor procurando.
**Dados/massa usados:** solicitação pré-existente **112932**, somente leitura. Nada submetido, nada movimentado.

---

## CT-FSWTBC-695  (protheus · Concluído)

**Título:** Iniciar uma medição manual de contrato (Faturamento de Contratos) e chegar ao Fiscal de Serviço com o formulário íntegro

**Origem:** FSWTBC-695 — "[Suporte Fev/2025 - DEM10009646] Erro processo de faturamento de contratos"; sem descrição (par do 696, 19 dias depois). Caso escrito como **caracterização de caminho** da medição manual, que é o gatilho humano do mesmo fluxo.

**Módulo/Rota:** Fluig → Central de Tarefas → *Iniciar Nova Solicitação* → Compras → **Faturamento de Contratos** (`wf_faturamento_contratos`, form 256836); aba **Histórico**; **Tracker** → *Faturamento de Contratos*.

**Pré-condições**
- Contrato vigente com planilha disponível para a filial, e o executor cadastrado como **Fiscal de Serviço** do contrato.
- **Bloqueio:** a conta de QA não é fiscal de nenhum contrato — o formulário abre, mas a medição não avança para ela; a leitura da estrutura foi feita.

**Passos**
1. Abrir *Faturamento de Contratos*; conferir a seção *Identificação do Processo/Solicitante* (*Nº do Processo, Solicitante, Email do Solicitante, Data/Hora da Solicitação*).
2. Em *Informações da Medição*, preencher **Fornecedor**, **Nº do Contrato**, **Competência do Contrato**, **Filial da Medição** e **Nº da Planilha**; observar o preenchimento automático de *Revisão, Filial do Contrato, Tipo do Contrato, Situação do Contrato, Data Início, Data Final, Nº da Medição, Objeto, Aprovação Prévia CSE?, Aprovador CSE, Aprov. Fiscal de Serviço?, Fiscal de Serviço, Fiscal de Contrato*.
3. Conferir *Houve Prestação de Serviço?* = **Não** por padrão e a grade *Itens da Medição* (*Item, Cod. Produto, Desc. Produto, Saldo a Medir, Quantidade, Valor Unitário, Valor Desconto, Valor Total*) e *Rateio* (*Item, % Rateio, Centro de Custo, Classe de Valor*).
4. **Enviar**; abrir **Histórico** e acompanhar *Busca Informações do Contrato (88)* → *Realizar Medição do Contrato (28)*.
5. Tracker → *Faturamento de Contratos* → filtrar pelo *Nº do Processo Fluig*; ler *Atividade Atual*, *Responsável Atual*, *Nº Medição*, *Nº Planilha*.

**Resultado esperado**
- Passo 2: campos derivados do contrato preenchidos e **bloqueados**; *Situação do Contrato* = Vigente.
- Passo 3: *Houve Prestação de Serviço?* = Não; *Observações* não obrigatório.
- Passo 4: sem *Correção (117)*; a tarefa *Realizar Medição do Contrato* nasce com o **Fiscal de Serviço** nominal.
- Passo 5: Tracker coerente com o Histórico; *Nº Medição* preenchido.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `<não documentado>` — o ticket não trouxe descrição; sintomas conhecidos da família: instância desviada para *Correção* após *Busca Informações do Contrato*, ou parada em *Aguarda processamento Fila Protheus*.

**Severidade:** Média *(bloqueia o fluxo de medição)*

**Preparação de massa:** contrato vigente com planilha e o executor como Fiscal de Serviço (cadastro GCT pela equipe de Contratos). Não submeter com contrato de terceiros.

**Verificado em tela:** PARCIAL
**O que foi verificado:** formulário 256836 aberto em branco na atividade *Início* — todos os 65 rótulos citados nos passos 1–3 presentes; abas *Formulário / Informações / Histórico 0 / Anexos 0*; botões *Enviar / Opções*. Tracker aberto com o combo *Filtrar por* e os filtros.
**Divergências encontradas:** o formulário **não tem campo de retorno de integração** (nem *Retorno Integração* nem *Erro retornado pelo ERP Protheus*) — erro de ERP nesta medição só é legível no Histórico/Logs Protheus.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-696  (protheus · Concluído)

**Título:** Verificar que nenhuma medição fica órfã em "Aguarda processamento Fila Protheus" e que a fila é consumida dentro do SLA

**Origem:** FSWTBC-696 — "[Suporte Fev/2025] Erro no processo de faturamento de contratos"; título idêntico ao 695, sem descrição. Caso escrito como **caracterização do estado da fila**, que hoje reproduz o sintoma (111980/111977/111973 paradas há 22–25 dias — A16).

**Módulo/Rota:** Fluig → **Faturamento de Contratos** → atividades **105 Gravar/Encerrar Medição** → **182 Aguarda processamento Fila Protheus** → *Pedido Gerado? (162)* / **117 Correção**; **Tracker** → *Faturamento de Contratos*; **Logs Protheus** → *Medicoes ZZZ* (`Status` P/E/S, `Data Trat Me`); API `GET /process-management/api/v2/requests/{id}/tasks?expand=chosenAssignees`. No ERP: fila **ZZZ** (medições) consumida pelo schedule de integração.

**Pré-condições**
- Schedule de consumo da fila ZZZ ativo no Protheus.
- SLA de referência: saída da 182 em **≈ 7 min** (medido na 113249).
- **Bloqueio:** a conta de QA não é fiscal (não inicia medição); a leitura da fila é possível e foi feita. **Não movimentar nem atribuir** as instâncias travadas.

**Passos**
1. Tracker → *Faturamento de Contratos*, *Status* = **Abertos**, **Pesquisar Registro**; listar as linhas com *Atividade Atual* = **Aguarda processamento Fila Protheus** e a *Data/Hora da Solicitação*.
2. Para cada uma, ler a última tarefa via API (`…/tasks?expand=chosenAssignees`): `state.sequence`, `status`, `startDate`, `assignee`, `chosenAssignees`.
3. **Logs Protheus** → *Medicoes ZZZ*, filtro *Id Fluig* = nº do processo, **Consultar**; ler *Status*, *Data Recb Me*, *Data Trat Me*, *Msg Medicao*.
4. (Com o fiscal) iniciar uma medição `QA-696` e cronometrar 105 → 182 → 162.

**Resultado esperado**
- Passo 1: **nenhuma** instância em 182 há mais de 1 h.
- Passo 2: toda tarefa em 182 tem responsável **efetivo** (`chosenAssignees` não vazio) — não fica com `admin` sem ninguém escolhido.
- Passo 3: ZZZ com *Status* `S` e *Data Trat Me* preenchida em minutos; se `E`, *Msg Medicao* explica e a instância vai para *Correção (117)* com pool `G.P.FatConCorrecaoIntegraca`.
- Passo 4: ≈ 7 min.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Medições estacionadas em *Aguarda processamento Fila Protheus* por dias, tarefa `NOT_COMPLETED` com `assignee=admin` e `chosenAssignees` vazio; ZZZ em `P` sem *Data Trat Me* (ou widget indisponível).

**Severidade:** Alta *(medição travada = pedido e pagamento não gerados)*

**Preparação de massa:** para os passos 1–3 a massa **já existe** (111980, 111977, 111973); para o passo 4, contrato com fiscal disponível.

**Verificado em tela:** PARCIAL
**O que foi verificado:** API de tarefas das três instâncias — todas com mov 8 = **seq 182 `NOT_COMPLETED`**, `assignee = admin`, `chosenAssignees` **vazio**, desde 14/08 14:39 (111973), 17/08 16:30 (111977) e 17/08 18:40 (111980); cadeia idêntica *105 (System:Auto) → 182 (System:Auto→admin, 1–6 s) → 182 aberta*. Tracker e Logs Protheus abertos (ZZZ em 404 — ambiente).
**Divergências encontradas:** **sintoma vivo** — 22 a 25 dias na 182 contra SLA de 7 min; a ferramenta de diagnóstico (ZZZ) está indisponível justamente agora; a tarefa órfã em `admin` sem escolhidos significa que ninguém é dono do destravamento.
**Dados/massa usados:** nenhum — leitura de 111980/111977/111973/113249.

---

## CT-FSWTBC-1035  (fluig · Concluído)

**Título:** O responsável grava a medição no Faturamento de Contratos e a gravação conclui, sem exceção transacional do servidor.

**Origem:** FSWTBC-1035 — "[SD: 754463] - Erro no processo de gravação de medição no workflow de
faturamento de contratos". Ao gravar a medição **17819** o servidor devolveu
`javax.ejb.EJBTransactionRolledbackException: JPA compliance dictates throwing
IllegalStateException when #getRollbackOnly is called on non-active transaction` — erro de
infraestrutura transacional (JTA), primo do `ARJUNA016102` de FSWTBC-1423. Fechado com **cinco
transições no mesmo dia** e **resolução vazia**.

**Módulo/Rota:** *Faturamento de Contratos* (`wf_faturamento_contratos` v51, formulário `256836`)
→ atividade **105 Gravar/Alterar Medição** (e a gêmea **114 Gravar Medição**), com desvio de falha
para **117 Correção** / **115 Correção - Gravar Medição**.

**Pré-condições**
- Instância de Faturamento de Contratos na etapa de gravação de medição, com Fornecedor, Nº do
  Contrato, Competência, Filial da Medição e Nº da Planilha já resolvidos.
- **Itens da Medição** preenchidos (quantidade × valor unitário − desconto) e **Rateio** somando
  100% por item.
- Medição volumosa é o cenário que expõe o defeito: a exceção original é de **transação JTA que
  expirou** durante operação longa, então quanto mais itens/rateios, melhor o teste.
- **Bloqueio:** **parcial.** Gravar medição é **escrita em processo real de contrato** e a etapa é
  atribuída ao responsável da medição — a conta de QA não é responsável de nenhuma das instâncias
  vivas e a política desta rodada proíbe movimentar processo de terceiro. Verificados formulário,
  campos e o estado vivo das instâncias.

**Passos**
1. Abrir a instância de Faturamento de Contratos na etapa **Realizar Medição do Contrato**
   (pela **Central de Tarefas** → aba **Tarefas a concluir**).
2. Conferir o bloco **Informações da Medição**: **Fornecedor \***, **Nº do Contrato \***,
   **Revisão \***, **Filial do Contrato\***, **Competência do Contrato \***, **Filial da Medição \***,
   **Nº da Medição \***, **Nº da Planilha \***.
3. Preencher **Itens da Medição** (**Quantidade**, **Valor Unitário**, **Valor Desconto**) e o
   **Rateio** (**Item \***, **% Rateio \***, **Centro de Custo**, **Classe de Valor \***).
4. Movimentar para a etapa de **gravação da medição** (**Enviar**).
5. Acompanhar a instância até a atividade seguinte e ler a aba **Histórico**.

**Resultado esperado**
- A gravação **conclui**: a instância avança de **105 Gravar/Alterar Medição** (ou **114 Gravar
  Medição**) para a etapa seguinte, **sem cair em 117 Correção / 115 Correção - Gravar Medição**.
- **Nenhuma** exceção de transação aparece na tela ou no Histórico — em especial
  `EJBTransactionRolledbackException`, `IllegalStateException ... non-active transaction` ou
  `ARJUNA016102`.
- Operação longa é absorvida pela fila: a instância pode transitar por
  **182 Aguarda processamento Fila Protheus** e sair dela sozinha, em vez de estourar a transação
  síncrona (é o desenho que a migração para fila introduziu).
- O **Histórico** registra a integração com sucesso e o tempo de execução.

**Resultado se o defeito reincidir**
- Ao gravar a medição, o servidor devolve
  `javax.ejb.EJBTransactionRolledbackException: JPA compliance dictates throwing
  IllegalStateException when #getRollbackOnly is called on non-active transaction` (texto exato do
  ticket, ocorrido com a medição **17819**) e a medição não é gravada.

**Severidade:** Alta *(medição é a base do faturamento do contrato: gravação perdida atrasa pagamento a fornecedor e o erro é transacional, com risco de gravação parcial)*

**Preparação de massa:** uma instância de Faturamento de Contratos em **Realizar Medição do
Contrato** cujo executor seja o próprio analista de teste, sobre um contrato de homologação com
planilha de itens — preferencialmente com muitos itens, para exercitar a duração da transação.
Quem prepara: fiscal/CSE do contrato na CASSI. A conta de QA não consegue se tornar responsável
das instâncias existentes.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário *Faturamento de Contratos* (iframe `256836`) abre com as
seções **Identificação do Processo/Solicitante**, **Informações da Medição**, **Itens da Medição**
e **Validação do Fiscal de Contrato**, e os campos **Nº do Processo \***, **Solicitante \***,
**Fornecedor \***, **Nº do Contrato \***, **Revisão \***, **Filial do Contrato\***, **Competência
do Contrato \***, **Filial da Medição \***, **Tipo do Contrato\***, **Situação do Contrato\***,
**Data Início\***, **Data Final\***, **Nº da Medição \***, **Nº da Planilha \***, **Objeto \***,
**Aprovação Prévia CSE? \***, **Aprov. Fiscal de Serviço? \***, **Fiscal de Contrato \***.
O mapa de atividades foi lido do próprio formulário e confirma **105 = "Gravar/Alterar Medição"**,
exatamente a atividade citada no ticket, com **117 = Correção** como desvio de falha.
Estado vivo em 04/09/2026: das 100 instâncias mais recentes, **7 estão paradas em "117 - Correção"**
(processos **113249, 113248, 113247, 113227** de 03/09; **113153, 113152** de 02/09; **112582** de
25/08) e **1 está em "182 - Aguarda processamento Fila Protheus"** — a fila existe e opera. A mais
recente nasceu em **04/09/2026 03:00** (três instâncias consecutivas às 03:00:13/20/26, carga
automática).
**Divergências encontradas:** (1) o desenho mudou desde o ticket — existe hoje a atividade
**182 "Aguarda processamento Fila Protheus"**, ou seja, a operação longa **saiu da transação JTA
síncrona** que causava a exceção; isso não está registrado no ticket (resolução veio vazia).
(2) **7 instâncias em "117 - Correção" agora**, entre 25/08 e 03/09/2026 — o caminho de falha da
gravação/alteração de medição continua sendo exercitado; não é possível, sem acesso ao Histórico
delas, afirmar que a causa é a mesma do ticket, mas é onde o analista deve olhar primeiro.
(3) A página **Logs protheus** (`/portal/p/1/portal_logs_protheus`), que traz as abas **Erros CV8**,
**Solicitacoes ZZY** e **Medicoes ZZZ** — a evidência natural deste caso — **está inoperante hoje**:
exibe *"Nao foi possivel consultar o dataset de logs."* e a chamada
`GET /java_generico_protheus/tbc/api/framework/v1/genericQuery?...&tables=CV8&...` retorna **404**.
**Dados/massa usados:** nenhum — não submetido; nenhuma instância foi movimentada.

---

## CT-FSWTBC-1211  (fluig · Concluído)

**Título:** O responsável encerra a medição no Faturamento de Contratos e o processo segue para a geração do pedido, sem erro.

**Origem:** FSWTBC-1211 — "[SD: 753975] - Erro no processo de encerramento de medição no workflow
de faturamento de contratos" (processo **16990**, pedido **002528**). Traz plano de ação
registrado — raro no lote: *"24/03: Paulo irá criar uma VALIDAÇÃO na etapa de encerrar medição,
iremos validar na QA, e para o processo 16990 irá subir um AJUSTE para concluir o processo"* —
distinguindo correção estrutural (validação nova) de remediação do caso. Fechado com 5 transições
no mesmo dia e **resolução vazia**.

**Módulo/Rota:** *Faturamento de Contratos* (`wf_faturamento_contratos` v51, formulário `256836`)
→ trecho de encerramento: **27 Aprovação Medição do Contrato** → **105/114 Gravar/Alterar Medição**
→ **36 Criar Pedido de Compras** → **38 Fim - Sem Pagamento** / **60 Fim - Faturamento de
Contratos**, com desvios **117 Correção** e **122 Correção - Criar Pedido de Compras**.

**Pré-condições**
- Instância de Faturamento com medição já preenchida e aprovada, pronta para encerramento.
- Itens da medição consistentes: sem valor total negativo, desconto ≤ valor total, rateio somando
  100% por item.
- **Bloqueio:** **parcial.** Encerrar medição gera **pedido no ERP** — escrita irreversível em
  processo real de contrato, e a etapa é atribuída a responsável nominal. Não executável pela
  conta de QA nesta rodada.

**Passos**
1. Abrir a instância na etapa de aprovação/encerramento da medição (**Central de Tarefas** →
   **Tarefas a concluir**).
2. Revisar **Itens da Medição** e **Rateio**.
3. Preencher o bloco de validação da etapa (**Responsável**, **Data da Validação**,
   **Hora da Validação**, **Aprovar? Sim/Não**, **Justificativa**).
4. Movimentar para encerrar a medição (**Enviar**).
5. Acompanhar até **Criar Pedido de Compras** e anotar o número do pedido gerado.
6. Ler a aba **Histórico** da instância.

**Resultado esperado**
- O encerramento **conclui** e a instância avança para **36 Criar Pedido de Compras** e daí para
  **60 Fim - Faturamento de Contratos** (ou **38 Fim - Sem Pagamento**, conforme o caso).
- A **validação da etapa de encerramento** — a correção estrutural prometida no plano de ação —
  **dispara antes** de encerrar quando os dados estão inconsistentes, com mensagem legível, em vez
  de deixar o processo quebrar depois.
- O número do pedido é devolvido e gravado; a instância **não** fica presa em **117 Correção** nem
  em **122 Correção - Criar Pedido de Compras**.
- Nenhuma exceção de servidor no Histórico.

**Resultado se o defeito reincidir**
- Erro ao encerrar a medição e o processo não conclui — sintoma original do processo **16990**,
  associado ao pedido **002528**. Mensagem exata `<não documentado>`: o ticket descreve o plano de
  ação, mas não registra o texto do erro nem a resolução.

**Severidade:** Alta *(o encerramento é o que gera o pedido: falhando, o faturamento do contrato para e cada caso preso exige "ajuste" manual em produção — foi o que o próprio plano de ação previu para o 16990)*

**Preparação de massa:** uma instância de Faturamento com medição aprovada e pronta para
encerramento, sobre contrato de homologação, tendo o analista como responsável da etapa. Preparar
**duas**: uma consistente (caminho feliz) e uma com inconsistência deliberada (ex.: rateio abaixo
de 100%) para provar que a validação nova dispara antes do encerramento. Quem prepara: fiscal/CSE
do contrato na CASSI.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de Faturamento e o mapa de atividades (lidos hoje) contêm
todo o trecho de encerramento: `aprovacaoMedicaoContrato: 27`, `gravarMedicao: 114`,
`gravarAlterarMedicao: 105`, `correcaoGravarMedicao: 115`, `icorrecaoGravarAltMedicao: 117`,
`fimAprovMedicaoContrato: 38`, `criarPedidoCompras: 36`, `correcaoCriarPedidoCompras: 122`,
`notificaFornecedor: 41`, `fim: 60`. Os blocos de validação existem no formulário (campos ocultos
até a etapa: `validCSE_*`, `validMed_*`, `validFiscal_*`, com **Aprovar? Sim/Não**,
**Justificativa** e **Enviar para**). Estado vivo: entre as 100 instâncias mais recentes há
**1 em "27 - Aprovação Medição do Contrato"**, **2 em "38 - Fim - Sem Pagamento"**, **3 em
"60 - Fim - Faturamento de Contratos"** e **7 em "117 - Correção"** — ou seja, instâncias **estão**
chegando ao fim hoje.
**Divergências encontradas:** **não existe atividade chamada "Encerrar Medição"** no BPMN publicado
— o que o ticket chama de "encerramento" corresponde ao trecho *Aprovação Medição do Contrato →
Gravar/Alterar Medição → Criar Pedido de Compras*. Ao escrever o passo a passo, use os rótulos
reais, ou o executor procurará um botão que não existe. Os números do ticket (processo 16990,
pedido 002528) são de outra faixa: as instâncias atuais estão em **112.5xx–113.2xx**.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1463  (protheus · Concluído)

**Título:** Incluir um contrato no GCT com caractere especial no número e verificar que a validação recusa (ou normaliza) e que o Fluig continua resolvendo os contratos legados

**Origem:** FSWTBC-1463 — "Caractere especial no número do contrato". Reincidência do tema do épico FSWTBC-719 (regex `CS_RMCARCT`), quatro meses após aquela entrega ir a produção; encerrado com *"o ajuste foi validado e já se encontra em produção"* sem dizer se é a mesma correção ou outra. Hoje a base ainda carrega **53 contratos** com caractere fora de `[0-9-]`.

**Módulo/Rota:** Fluig → **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`, coluna **Contrato**, campo *Filtrar*); **Tracker** → filtro **Número do Contrato**; **Faturamento de Contratos** (256836) → campo **Nº do Contrato**; SC (256831) → *Número do Contrato*; datasets `dsProtheus_getContratosxFornecedores_restGet` (`CN9_NUMERO`) e `dsProtheus_getInfoPlanilhaxContrato_restGetAll`. No ERP: **CNTA120** → campo **Contrato** (`CN9_NUMERO`, validação `CS_RMCARCT`).

**Pré-condições**
- Conta com acesso ao Acompanhamento de Contratos e ao Tracker (a conta de QA tem).
- Para o passo de inclusão: usuário do ERP com acesso a CNTA120 em ambiente de teste.
- **Bloqueio:** parcial — a **validação na inclusão** só existe no ERP (sem credencial); a leitura dos legados no Fluig é integralmente possível.

**Passos**
1. No **Acompanhamento de Contratos**, digitar `3517` em *Filtrar* e localizar `00001.2025.3517` (pontos); clicar em **Informações do Contrato** e em **Planilha**.
2. Repetir com `2901` para `00006/2022-2901` (barra) — hoje em situação 02, fora do filtro do widget — e com `C0001` e `E01-2025-2101` (letra inicial).
3. No **Tracker**, *Filtrar por* = Solicitação de Compras, **Número do Contrato** = `00001.2025.3517`; **Pesquisar Registro**.
4. Consultar `dsProtheus_getInfoPlanilhaxContrato_restGetAll` (`CorporateId`, `BranchId`, `CN9_NUMERO`, `CN9_REVISA`) para `00006/2022-2901` e `00002.2025.3517`.
5. (ERP) Em **CNTA120** › **Incluir**, informar **Contrato** = `QA/2026.5303`; tentar confirmar. Repetir com `QA-2026-5303`.
6. (ERP) Conferir o parâmetro/regra `CS_RMCARCT` e o conteúdo de `CN9_NUMERO` de um contrato criado pela integração Fluig.

**Resultado esperado**
- Passos 1–2 e 4: cada contrato legado é localizado, abre o modal e a planilha, e os datasets respondem 200 com linhas — o caractere não quebra a URL/consulta.
- Passo 3: o Tracker devolve a SC do contrato (ou lista vazia se ele nasceu no ERP), sem erro de console.
- Passo 5: `QA/2026.5303` **recusado** (ou normalizado para `QA-2026-5303` com aviso); `QA-2026-5303` aceito.
- Passo 6: contratos gerados pela integração seguem `99999-9999-9999` (sequência-ano-filial), sem `/`, `.` nem espaço.
- Nenhum número novo com caractere especial desde a entrega do FSWTBC-719.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Contrato incluído com caractere especial no número (`/`, `.`, letra) e, em consequência, falha ao ser referenciado pela integração/portal — sintoma exato `<não documentado>` no ticket.

**Severidade:** Média *(integridade de chave; quebra referência cruzada Fluig ↔ ERP)*

**Preparação de massa:** nenhuma a criar para os passos 1–4 (53 legados existem). Para o passo 5, o próprio executor tenta a inclusão em **teste** e **não confirma** se a validação não bloquear — anota o comportamento.

**Verificado em tela:** PARCIAL
**O que foi verificado:** `Acompanhamento de Contratos` aberto (845 linhas; colunas *Filial, Tipo Contrato, Contrato, Data Inicio, Data Fim, Nº Revisão, Status, Fornecedor, Ação*; ações *Planilha / Solicitação de Compra / Informações do Contrato*). Filtro `3517` devolveu `00001.2025.3517` (*031 - LICENCIAMENTO DE SOFTWARE*, Vigente) e `00001-2022-3517`; filtro `00006/2022` devolveu *Nenhum registro encontrado* (contrato em situação 02, fora do filtro do widget — não é falha do caractere). Datasets: `getInfoPlanilhaxContrato` respondeu 200 com 1 planilha para `00006/2022-2901` e para `00002.2025.3517`, e 20 para `E01-2025-2101`. Tracker aberto com o filtro *Número do Contrato*. A inclusão no ERP (passos 5–6) **não** foi executada.
**Divergências encontradas:** (a) **53** números fora do padrão ainda vivos, em 8 formatos distintos; (b) no widget aparece `0000-2025-2501-` — número com **hífen final** e sequência `0000`; (c) os status na coluna *Status* aparecem truncados (`Finali`, `Sol.Finali`); (d) `00006/2022-2901` está em situação **02** e some do widget, mas o dataset o devolve — o filtro de situação do widget esconde contratos "Emitidos".
**Dados/massa usados:** nenhum — não submetido; leitura de `00001.2025.3517`, `00006/2022-2901`, `00002.2025.3517`, `C0001-2021-1601`, `E01-2025-2101`.

---

## CT-FSWTBC-1651  (fluig · Concluído)

**Título:** O usuário informa percentuais de rateio que somam exatamente 100% e o Fluig aceita o envio, sem resíduo de ponto flutuante.

**Origem:** FSWTBC-1651 — "[CASSI - BH] - Suporte Maio/2025] - SD: 759971 - Problema na
contabilização do rateio erro na função parseFloat()". No processo **24138** o Fluig incluía
**0,00000000001%** no rateio, fazendo a soma passar de 100% e **travar o envio** — resíduo de
`1e-11` gerado por `parseFloat()` sem arredondamento controlado. Prioridade Alta, 2 dias.
É o mesmo tipo de defeito de FSWTBC-1707 (par, mesmo processo 24138) e de FSWTBC-1906 (casas
decimais terminadas em zero).

**Módulo/Rota:** *Faturamento de Contratos* (`wf_faturamento_contratos`, formulário `256836`) →
tabela de **Rateio** (`tblRateio`): **Item \*** (`tbrat_item`), **% Rateio \***
(`tbrat_porcentagem`), **Centro de Custo** (`zoomRatCentroCusto`), **Classe de Valor \***
(`tbrat_classeVlr`). Importação por planilha pelos botões de importação de rateio.

**Pré-condições**
- Instância de Faturamento na etapa de medição, com **Itens da Medição** carregados.
- Um item cujo rateio seja dividido em percentuais **não exatos** — o cenário crítico é a divisão
  que gera dízima: 3 centros de custo com 33,33333333% + 33,33333333% + 33,33333334%, ou valores
  vindos de planilha com muitas casas.
- **Bloqueio:** **parcial.** Chegar à tabela de rateio exige encadear Fornecedor → Contrato →
  Competência → Filial → Planilha nos zooms do Protheus sobre um contrato real, e o envio é
  escrita em processo de terceiro. Verificados o formulário, os campos e a regra de arredondamento
  publicada, sem submeter.

**Passos**
1. Abrir a instância de Faturamento na etapa **Realizar Medição do Contrato**.
2. Encadear **Fornecedor \*** → **Nº do Contrato \*** → **Competência do Contrato \*** →
   **Filial da Medição \*** → **Nº da Planilha \*** até os **Itens da Medição** carregarem.
3. Na tabela de **Rateio**, para um mesmo **Item**, lançar três linhas com **% Rateio** de
   `33,33333333`, `33,33333333` e `33,33333334` (centros de custo e classes de valor distintos).
4. Sair do último campo (blur) e movimentar a solicitação (**Enviar**).
5. Repetir com a **importação por planilha** de rateio, usando os mesmos percentuais.

**Resultado esperado**
- A soma é tratada com **arredondamento controlado** (8 casas decimais) antes da comparação: o
  total é reconhecido como **exatamente 100%** e o envio é **aceito**.
- **Nenhum** valor residual do tipo `0,00000000001` é incluído na tabela de rateio.
- Percentual em branco ou não numérico é normalizado para **0**, não vira `NaN`.
- Quando a soma realmente estiver fora de 100%, a crítica aparece com o texto exato:
  *"A soma dos percentuais de rateio não podem ultrapassar o limite de 100%. Por favor, verifique o
  item &lt;item&gt;, pois foram informados (&lt;X&gt;%)."* ou
  *"A soma dos percentuais de rateio não podem ser inferior a 100%. Por favor, verifique o item
  &lt;item&gt;, pois foram informados apenas (&lt;X&gt;%)."* — na validação da tabela, as variantes
  *"A soma dos percentuais de rateio não pode ultrapassar 100%."* / *"… não pode ser inferior a 100%."*
- Linha com percentual zerado/branco na planilha é recusada com
  *"Linha N: percentual de rateio inválido (zerado ou em branco)"*.

**Resultado se o defeito reincidir**
- O Fluig **inclui `0,00000000001%`** no rateio; a soma passa de 100% e o **envio trava**
  (sintoma exato do processo **24138**). Sinal irmão a vigiar (FSWTBC-1906): rateio com casas
  decimais terminadas em zero deixa de ser reconhecido como 100%.

**Severidade:** Alta *(rateio é a distribuição contábil do gasto entre centros de custo; erro trava o faturamento e, se passasse, contabilizaria valor errado)*

**Preparação de massa:** uma instância de Faturamento em medição, sobre contrato de homologação com
planilha de rateio, tendo o analista como responsável — **e** um item que admita divisão em três
centros de custo, para forçar a dízima. Quem prepara: fiscal/CSE do contrato na CASSI.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de Faturamento contém a tabela de rateio com os campos
**Item \*** (`tbrat_item`), **% Rateio \*** (`tbrat_porcentagem`) e **Classe de Valor \***
(`tbrat_classeVlr`), mais os zooms **`zoomRatCentroCusto`** e **`zoomRatClasseVlr`** (presentes no
DOM, exibidos após o encadeamento dos zooms do contrato). O código publicado do formulário foi
lido e mostra a **correção estrutural em vigor**: a precisão de rateio é fixada em
`listDecimal = { rateio: 8, default: 6 }` e ambas as funções de conversão aplicam arredondamento
antes de comparar — `handleParsePercent()` retorna `parsed.toFixed(8)` e
`handlerParseApportionment()` retorna `parseFloat(parsed.toFixed(8))`, ambas com
`if (isNaN(parsed)) return 0`. Um resíduo de `1e-11` é zerado por esse `toFixed(8)`, que é
exatamente o que o defeito pedia. As mensagens de crítica citadas no *Resultado esperado* foram
extraídas do formulário publicado, não de documento.
**Divergências encontradas:** o ticket atribui o defeito a "erro na função parseFloat()"; no código
de hoje `parseFloat` continua sendo usado, mas **sempre depois** de `toFixed(8)` — a correção foi de
arredondamento, não de troca de função. Não foi possível exercitar a soma em tela sem massa de
contrato: o rateio só se materializa após encadear os zooms do Protheus.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1689  (protheus · Concluído · Não será feito)

**Título:** Verificar que o robô de medição automática abre, na madrugada, um Faturamento de Contratos por filial de cada contrato elegível e que nenhum deles fica preso na fila

**Origem:** FSWTBC-1689 — "[Suporte Maio/2025] Erro na medição automática na produção"; **Não será feito**, encerrado por informação verbal ("Geise informa via Teams que já foi concluída"). Quinta ocorrência da medição automática em produção (183, 1512, 1777, 1904) fechada sem registro técnico. Caso escrito como **caracterização do robô**, ancorado no que a base mostra hoje.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** (`wf_faturamento_contratos`, form 256836) — instâncias iniciadas por **Usuário Integrador Fluig (`consumerkeycompras`)** com o registro *"Processo iniciado através de Serviço de Medição Automatizada"* no Histórico; dataset **`ds_fatcon_get_medicaoAutomatica`** (`FILIAIS,true,CODIGOCONTRATO,…,CODIGOFORNECEDORLOJA,…,FILIALCONTRATO,…,REVISAOCONTRATO,…`); **Tracker** → *Faturamento de Contratos*; **Logs Protheus** → *Medicoes ZZZ*. No ERP: *Dia Med Auto* do contrato (GCT) e o schedule da fila ZZZ.

**Pré-condições**
- Contrato vigente com *Dia Med Auto* preenchido e planilha de valor fixo (ex.: **E01-2025-2101**, 14 filiais elegíveis hoje para 09/2026).
- Schedule da medição automática ativo (dispara ≈ 03:00).
- **Bloqueio:** a conta de QA não é fiscal (não conclui a medição) e não tem acesso ao GCT; Logs Protheus *Medicoes ZZZ* com `genericQuery` em **404** (ambiente). **Não** movimentar as instâncias do robô.

**Passos**
1. Na manhã seguinte ao disparo, Tracker → *Faturamento de Contratos*, *Status* = **Abertos**, *Data de Solicitação* = hoje → **Pesquisar Registro**; contar as linhas com solicitante **Usuário Integrador Fluig** e anotar a *Atividade Atual*.
2. Abrir uma delas (modo leitura) → aba **Histórico**: confirmar *"Usuário Integrador Fluig iniciou a solicitação"* → *"Processo iniciado através de Serviço de Medição Automatizada"* → *Busca Informações do Contrato* com *"Integração executada com sucesso - Tempo de Execução N s"*.
3. No formulário da mesma instância: *Nº do Contrato*, *Revisão*, *Filial da Medição*, *Competência do Contrato*, *Nº da Planilha*, *Nº da Medição* preenchidos; *Saldo a Medir* dos itens > 0.
4. Chamar `ds_fatcon_get_medicaoAutomatica` para o contrato da instância (com `REVISAOCONTRATO`): a lista de `CODFILIAL` × `COMPETENCIA` deve casar com as instâncias abertas (uma por filial).
5. Logs Protheus → *Medicoes ZZZ*, filtrar pelo *Id Fluig* de uma instância já encerrada pelo fiscal: `Status`, `Data Trat Me`, `Qtd T.Env Fl`.
6. Repetir o passo 1 uma semana depois para as instâncias do passo 1: nenhuma pode estar em *Aguarda processamento Fila Protheus (182)*.

**Resultado esperado**
- Passo 1: uma instância **por filial elegível** de cada contrato com *Dia Med Auto* = hoje; todas em *Realizar Medição do Contrato* com o fiscal como responsável.
- Passo 2: as três linhas do Histórico presentes, integração com sucesso.
- Passo 4: mesma cardinalidade (filiais do dataset = instâncias abertas); nenhuma filial faltando nem duplicada.
- Passo 5: `Status` = processado, `Qtd T.Env Fl` = 1.
- Passo 6: zero instâncias na 182 além de minutos.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Madrugada sem instâncias (robô não disparou) ou com filiais faltando; instância do robô presa na 182 por dias (hoje: **111977**, nascida 15/08 03:00:22 pelo robô, na 182 desde 17/08 16:30 — 22 dias); ZZZ sem *Data Trat Me* ou com retry crescente. `<não documentado>` qual foi o erro de 05/2025 — o ticket não o registrou.

**Severidade:** Alta *(medição não gerada = pagamento de contrato atrasado, em lote)*

**Preparação de massa:** a massa **já existe** — hoje 08/09 o robô abriu **202 instâncias** entre 03:07 e 03:08 (113194–113395, seq 28) e mais 113 nos dias 05–07/09; para o passo 5 é preciso uma instância encerrada por fiscal (conta de fiscal de homologação).

**Verificado em tela:** PARCIAL
**O que foi verificado:** 600 instâncias do Faturamento lidas por API — **202 abertas hoje 03:07–03:08** em *Realizar Medição do Contrato*; Histórico da **111977** lido na UI (*"Processo iniciado através de Serviço de Medição Automatizada"*, *Busca Informações do Contrato* 8 s, *Gravar/Encerrar Medição* 2 s, parada na 182 há 21 dias, responsável *Administrador Cassi*, *"Prazo: Sem prazo definido"*); formulário da 111977 em leitura: contrato **0185-2023-5303**, planilha 000001 FIXA, competência 08/2026, *Nº da Medição* 003298, `saldoContrato` 11.733,48, *Saldo a Medir* 11; `ds_fatcon_get_medicaoAutomatica` para E01-2025-2101 rev 007 → **14 filiais** (2101, 2201, 2301…), competência 09/2026. Sem `REVISAOCONTRATO` o dataset devolve `Cannot call method "trim" of undefined` **como valor dos campos** — erro de script servido como dado. Logs Protheus aberto; ZZZ em 404.
**Divergências encontradas:** (1) a instância do robô travada na 182 não tem prazo (*"Sem prazo definido"*) — o SLA de 7 min não está configurado na atividade; (2) para o 0185-2023-5303 o ERP responde hoje *"Não há planilha disponível no contrato/competência selecionados. Verifique permissões, saldo, vigência e a existência de medições em aberto"* (CNTA120COMPET) — coerente com a medição 003298 presa: **enquanto a 111977 não sair da fila, a competência 08/2026 desse contrato não pode ser medida por ninguém**.
**Dados/massa usados:** nenhum — leitura de 111977, 113249 e das 202 instâncias de hoje.

---

## CT-FSWTBC-1690  (protheus · Concluído)

**Título:** Medir um contrato importando a planilha de itens preenchida, a partir do modelo baixado na própria tela

**Origem:** FSWTBC-1690 — "[Suporte Maio/2025] Medição por planilha", solicitado por Pedro Neto; fechado no mutirão de 13/05 com o comentário padrão, **sem descrição**. O tema só foi desenvolvido meses depois (bloco 1845/1848 da DEM10014371). Caso escrito como **caracterização de caminho** da funcionalidade que existe hoje.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** → atividade *Realizar Medição do Contrato* (seq 28/25) → seção *Informações da Medição* → botões **"Download Planilha de Itens Modelo"** (`btnDownLoadModeloPlanilhaMed`) e **"Upload Planilha de Itens Preenchida"** (`btnImportPlanilhaMed`); grade de itens (*Item, Cod. Produto, Desc. Produto, Saldo a Medir, Quantidade, Valor Unitário, Valor Desconto, Valor Total*). Paralelo: *Download/Upload Planilha de Rateio* (`btnDownLoadModeloPlanilha`/`btnImportPlanilha`).

**Pré-condições**
- Perfil de **fiscal** com uma instância de Faturamento em *Realizar Medição do Contrato*, contrato com planilha de ≥ 3 itens.
- **Bloqueio:** a conta de QA não é fiscal — os botões existem no formulário mas ficam `display:none` fora da atividade de medição; a importação **não foi exercitada**.

**Passos**
1. Na tarefa, selecionar *Fornecedor*, *Nº do Contrato*, *Competência do Contrato*, *Filial da Medição* e *Nº da Planilha*: a grade de itens carrega com *Saldo a Medir*.
2. Clicar **Download Planilha de Itens Modelo**: o arquivo salvo deve chamar-se **`Planilha de Medicao.xlsx`** e conter uma linha por item da grade.
3. Preencher *Quantidade* e *Valor Desconto* de dois itens no arquivo; salvar **com o mesmo nome**.
4. Clicar **Upload Planilha de Itens Preenchida** → selecionar o arquivo.
5. Repetir o passo 4 com o arquivo renomeado para `Planilha de Medicao (1).xlsx` (nome que o navegador dá ao segundo download).
6. Repetir o passo 4 com um item cujo *Valor Desconto* > *Valor Total*.
7. Repetir com quantidade **maior** que *Saldo a Medir* em um item.

**Resultado esperado**
- Passo 2: download com o nome exato e os itens da grade.
- Passo 4: toast *"Importado N registros válidos."*; a grade reflete quantidade/desconto; *Valor Total* recalculado.
- Passo 5: **ou** importa igual **ou** avisa que o nome não é o esperado — nunca silêncio.
- Passo 6: crítica *"O valor do desconto não pode ser maior que o valor total."*
- Passo 7: crítica de saldo (`<não documentado>` — o formulário não tem mensagem própria; se o ERP for o único a barrar, isso é a superfície do CT-FSWTBC-1753).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `<não documentado>` — o ticket não descreve o erro. Comportamento hoje conhecido (A11-c): nome diferente de `Planilha de Medicao.xlsx` **não faz nada e não avisa**.

**Severidade:** Média *(bloqueia a medição por planilha; sem perda de dado)*

**Preparação de massa:** instância de Faturamento aberta para um fiscal de homologação — hoje há 315 instâncias em *Realizar Medição do Contrato* (robô), qualquer uma serve **para o fiscal responsável**; a conta de QA não pode assumi-las.

**Verificado em tela:** PARCIAL
**O que foi verificado:** formulário 256836 aberto em branco (*Início*) e em leitura (113249, 111977): botões **"Download Planilha de Itens Modelo"**, **"Upload Planilha de Itens Preenchida"**, **"Download Planilha de Rateio Modelo"**, **"Upload Planilha de Rateio Preenchida"**, *Adicionar Rateio*, *Remover Todos os Rateios* — todos presentes e **ocultos** nessas atividades; campos `saldoMedirQtd___1`, `valorTotalItens___1`, `fl_planilhaMedi`, `fl_planilha`; no fonte: `link.download = "Planilha de Medicao.xlsx"`, `file.name == "Planilha de Medicao.xlsx"`, mensagens *"Importado N registros válidos."*, *"Planilha vazia ou sem dados detectados!"*, *"Nenhum arquivo selecionado!"*, *"O valor do desconto não pode ser maior que o valor total."*.
**Divergências encontradas:** o ticket fala em "medição por planilha" (no ERP, medição de **planilha** de contrato — CNA); no Fluig o que existe é **importação de planilha Excel de itens** — dois sentidos para a mesma expressão. O botão no fonte ainda é chamado de "Planilha de Itens", como o A11-c registrou.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1696  (protheus · Concluído)

**Título:** Carregar os itens do contrato E01-2025-2101 na medição e gravá-la no Protheus sem erro na API

**Origem:** FSWTBC-1696 — "[Suporte Maio/2025] SD: 759754 - Erro no processo de faturamento de contratos": erro **no carregamento dos itens e na gravação da medição do contrato E01-2025-2101**; correção localizada na **API** após debug, validada na PRIME. Um dos poucos da série com causa e caminho de validação registrados.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** → *Realizar Medição do Contrato* → seleção do contrato (**`ds_fatcon_get_busca_contratos`** por CNPJ, **`dsProtheus_getInfoPlanilhaxContrato_restGetAll`** para as planilhas, **`ds_fatcon_get_info_medicoes`** para os itens — `CNA_CONTRA, FILIAL_CONTRATO, COMPETENCIA_ESCOLHIDA, FILIAL_ESCOLHIDA`) → *Gravar/Encerrar Medição (105)* → *Aguarda processamento Fila Protheus (182)* → *Pedido Gerado? (162)* → *Fim* ou *Correção (117)*; aba **Histórico** (*"Integração executada com sucesso - Tempo de Execução N"* e o comentário do `admin` na 182 com a mensagem do ERP).

**Pré-condições**
- Contrato **E01-2025-2101** vigente (hoje: filial 2101, rev 007, saldo 2.819.892,40, 10 planilhas, fiscal valtair.oliveira).
- Perfil de fiscal desse contrato.
- **Bloqueio:** a conta de QA não é fiscal (não grava); a **carga dos itens** foi verificada por dataset; Logs Protheus em 404 (ambiente).

**Passos**
1. Na tarefa, *Fornecedor* = EFICAZ (24845465/0001) → *Nº do Contrato* = **E01-2025-2101** → *Revisão* 007 → *Competência do Contrato* → *Filial da Medição* 2101 → *Nº da Planilha*.
2. Observar a grade de itens: *Cod. Produto*, *Desc. Produto*, *Saldo a Medir*, *Valor Unitário* preenchidos para **todos** os itens da planilha; `saldoContrato` = saldo do contrato.
3. Informar *Quantidade* ≤ *Saldo a Medir* em um item; *Houve Prestação de Serviço?* = Sim; **Enviar**.
4. Aba **Histórico**: ler *Gravar/Encerrar Medição → "Integração executada com sucesso - Tempo de Execução N"* e acompanhar 182 → 162.
5. Se cair em *Correção (117)*: ler o comentário do *Administrador Cassi* na 182 (formato `Id do submodelo de origem:… - Id do erro:… - mensagem do erro:…`).
6. Repetir o passo 1 informando a competência nos dois formatos que o zoom aceita (`aaaa-mm` e `mm-aaaa`) e comparar o *Nº da Planilha* carregado.

**Resultado esperado**
- Passo 2: itens carregados sem toast *"Erro ao buscar as informações da medição."*; quantidade de itens = itens da planilha no ERP.
- Passo 4: integração com sucesso em segundos; 182 dura segundos; 162 → *Fim - Faturamento de Contratos* (60) com *Nº da Medição* gerado.
- Passo 5: não ocorre; se ocorrer, a mensagem é específica (nunca `undefined`).
- Passo 6: **a mesma** planilha — o formato da competência não pode escolher planilhas diferentes.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Toast *"Erro ao buscar as informações da medição. … Por favor, tente novamente."* ao selecionar o contrato (itens não carregam) e/ou falha na gravação com a instância desviada para *Correção* com erro da API no Histórico.

**Severidade:** Alta *(contrato de 4,4 milhões sem medição)*

**Preparação de massa:** o contrato **já existe** neste tenant; a medição precisa do fiscal do contrato (ou substituto). Não medir competência já em fila.

**Verificado em tela:** PARCIAL
**O que foi verificado:** `ds_fatcon_get_busca_contratos` (CNPJ 24845465000101) → `SUCCESS`, E01-2025-2101 rev 007; `dsProtheus_getInfoPlanilhaxContrato_restGetAll` → **10 planilhas**; `ds_fatcon_get_info_medicoes` → `STATUS:"SUCCESS"`, planilha com itens (`CNE_PRODUT 04000204 MANUT DE EQUIP E UTENSILIOS`, `CNE_VLUNIT`, `CNE_QUANT`, `CXN_VLSALD`) — **a carga dos itens funciona hoje**. Cadeia de gravação observada em 7 instâncias reais (105 → 182 → 162 → 117) e uma delas (113249) com a mensagem do ERP legível no Histórico. Formulário em leitura com `saldoContrato`, `numMedicao`, `zoomNumPlanilha`, `saldoMedirQtd___1`.
**Divergências encontradas:** (1) **competência `2026-08` carrega a planilha 000020 (saldo 921.310,00) e `08-2026` carrega a 000004 (saldo 110.260,80)** — o dataset aceita os dois formatos e devolve planilhas diferentes, sem crítica; (2) `ds_fatcon_get_competencia` para este contrato devolve `COMPETENCIA:"undefined"`/`STATUS:"ERROR"` (A17) — o zoom de competência depende de outro caminho; (3) o nome de dataset dado como errado no A17-a (`dsProtheus_getInformaPlanxContrato_restGetAll`) **hoje responde com as mesmas 10 planilhas**.
**Dados/massa usados:** nenhum — leitura de datasets e de 113249; nada gravado.

---

## CT-FSWTBC-1707  (fluig · Concluído)

**Título:** Item da medição com quantidade zerada não exige rateio e não impede o envio da medição.

**Origem:** FSWTBC-1707 — "[CASSI - BH] - Suporte Maio/2025] - SD: 759972 - Problema no rateio de
itens com a quantidade medida zerada". No processo **24138** o Fluig **exigia rateio para itens com
quantidade medida zero**. Par de FSWTBC-1651 (mesmo processo). A regra de rateio não considerava o
item não medido — cenário que a melhoria posterior (carregar itens com quantidade zero por padrão,
FSWTBC-1386) tornaria comum. Corrigido no mesmo dia.

**Módulo/Rota:** *Faturamento de Contratos* (`wf_faturamento_contratos`, formulário `256836`) →
**Itens da Medição** (`tblItensMedicao`: **Quantidade**, **Valor Unitário**, **Valor Desconto**,
**Valor Total**) e tabela de **Rateio** (`tblRateio`: **Item \***, **% Rateio \***,
**Centro de Custo**, **Classe de Valor \***).

**Pré-condições**
- Instância de Faturamento na etapa de medição, com **planilha que traga vários itens** — e ao
  menos **um item que não será medido nesta competência** (quantidade 0).
- Ao menos um item **medido** (quantidade > 0), para provar que a regra continua exigindo rateio
  onde deve. O par é obrigatório: só com item zerado o teste não distingue "não exige de ninguém".
- **Bloqueio:** **parcial.** Exige massa de contrato real (encadeamento Fornecedor → Contrato →
  Competência → Filial → Planilha) e o envio é escrita em processo de terceiro. Verificados o
  formulário, os campos e a regra publicada, sem submeter.

**Passos**
1. Abrir a instância na etapa **Realizar Medição do Contrato** e carregar os **Itens da Medição**.
2. Deixar a **Quantidade** de um item em **0** (ou vazia) e preencher a **Quantidade** de outro
   item com valor > 0.
3. Preencher o **Rateio** somente do item medido, somando 100% para ele; **não** lançar linha de
   rateio para o item zerado.
4. Movimentar a solicitação (**Enviar**).
5. Repetir a tentativa **removendo** o rateio do item medido, para conferir que a exigência
   continua valendo onde deve.

**Resultado esperado**
- O envio é **aceito**: o item com **quantidade zerada não exige rateio** e não gera crítica.
- O rateio do item **medido** continua sendo exigido e validado em 100% — a correção **não**
  afrouxou a regra geral (passo 5 deve **falhar** com
  *"A soma dos percentuais de rateio não pode ser inferior a 100%."*).
- No item zerado, os campos dependentes ficam coerentes: com quantidade 0 o **Valor Desconto**
  permanece **bloqueado** (só é liberado quando a quantidade é maior que zero) e o **Valor Total**
  do item fica 0,00 — nunca negativo.
- Nenhuma crítica de "campos de rateio sem preenchimento" é disparada por causa do item zerado.
- Se houver linha de rateio lançada para o item zerado com percentual em branco, a crítica correta é
  *"Existem campos de rateio sem preenchimento! Favor preencher todos os campos e tente novamente."*
  — e não uma exigência automática de rateio para o item não medido.

**Resultado se o defeito reincidir**
- O Fluig **exige rateio para o item com quantidade medida zero** e bloqueia o envio da medição —
  sintoma exato do processo **24138**.

**Severidade:** Alta *(trava o faturamento inteiro do contrato por causa de item que não foi medido; e o cenário virou comum depois que os itens passaram a ser carregados com quantidade zero por padrão)*

**Preparação de massa:** uma instância de Faturamento em medição, sobre contrato de homologação
cuja planilha tenha **pelo menos dois itens**, para medir um e deixar o outro zerado; executor como
responsável da etapa. Quem prepara: fiscal/CSE do contrato na CASSI.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de Faturamento traz a tabela **Itens da Medição** com
`item`, `codProduto`, `produto`, `saldoMedirQtd`, `quantidade`, `valorUnitario`, `valorDesconto`,
`valorTotalItens`, e a tabela de **Rateio** com **Item \***, **% Rateio \***, **Classe de Valor \***
e os zooms de centro de custo/classe de valor. O código publicado do formulário foi lido e mostra a
regra em vigor: a validação `handleValidSendRat()` percorre as **linhas de rateio** e só cobra a
soma de 100% para o item quando ele **existe entre os itens da medição** (`arRows.some(...)`) — não
há varredura que exija uma linha de rateio para cada item medido, o que é o comportamento correto
para o item zerado. Também confirmado o acoplamento quantidade→desconto:
`if ($('#quantidade___idx').val() == "" || parseFloat(...) == 0) { desconto readonly }` e a
liberação `if (parseFloat(qtdMedir) > 0) { valorDesconto readonly:false }`, além da crítica
*"O valor total não pode ser negativo."*
**Divergências encontradas:** nenhuma entre o ticket e a tela. Não foi possível executar o cenário
por falta de massa de contrato — a tabela de rateio só se materializa depois de encadear os zooms
do Protheus sobre um contrato real, e o envio seria escrita em processo de terceiro.
**Dados/massa usados:** nenhum — não submetido.

## CT-FSWTBC-1753  (protheus · Concluído)

**Título:** Medir a parcela restante de um contrato já medido parcialmente, com a quantidade exata do saldo, e ser aceito pelo Protheus

**Origem:** FSWTBC-1753 — "[Suporte Maio/2025] Erro na medição valor maior que saldo": ao medir contrato já medido parcialmente, o ERP recusava com "valor maior que saldo". Dois fatores: (1) o campo de quantidade estava com **casas decimais diferentes de produção** (dicionário divergente entre ambientes); (2) o cálculo usava o **valor líquido** e não o **saldo** — ajustada a proporção do líquido, mediu.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** → *Realizar Medição do Contrato* → grade de itens: **Saldo a Medir** (`saldoMedirQtd___n` = `CNE_QTAMED`), *Quantidade*, *Valor Unitário*, *Valor Desconto*, *Valor Total*; cabeçalho `saldoContrato` (`CN9_SALDO`); `ds_fatcon_get_info_medicoes` (`CXN_VLSALD` por planilha, `CNE_QTAMED`/`CNE_QUANT` por item) → *Gravar/Encerrar Medição (105)* → 182 → 162 → *Correção (117)* com a mensagem do ERP no Histórico. No ERP: CNTA120, SX3 `CNE_QUANT`/`CNE_QTAMED` (decimais).

**Pré-condições**
- Contrato vigente com **uma medição já encerrada** (parcial) e saldo remanescente; fiscal do contrato.
- Configurador: decimais de `CNE_QUANT`/`CNE_QTAMED` **iguais** entre TST/PRIME e produção (o ticket mostrou divergência).
- **Bloqueio:** a conta de QA não é fiscal; Logs Protheus em 404. Não medir contratos reais.

**Passos**
1. Selecionar o contrato/planilha: anotar *Saldo a Medir* de cada item e `saldoContrato`; chamar `ds_fatcon_get_info_medicoes` e comparar com `CNE_QTAMED` e `CXN_VLSALD`.
2. Informar *Quantidade* = **exatamente** *Saldo a Medir* (com todas as casas decimais exibidas, ex.: 12,06228) em um item; **Enviar**.
3. Acompanhar Histórico: *Gravar/Encerrar Medição* → 182 → 162 → *Fim*.
4. Em outra instância, informar *Quantidade* = *Saldo a Medir* + 0,01 → **Enviar** → Histórico.
5. Em outra, informar *Valor Desconto* > *Valor Total* → **Enviar**.
6. Após o passo 3, reabrir o contrato: *Saldo a Medir* do item = 0 e `saldoContrato` reduzido pelo valor medido.

**Resultado esperado**
- Passo 1: tela = dataset (mesmos decimais); `CXN_VLSALD` ≥ soma dos itens a medir.
- Passo 3: aceito — nenhuma mensagem "valor maior que saldo" quando a quantidade é igual ao saldo.
- Passo 4: **recusado**, no formulário ou no ERP, com mensagem legível (*"valor maior que saldo"* ou equivalente) e a instância em *Correção* com a mensagem no Histórico.
- Passo 5: crítica do formulário *"O valor do desconto não pode ser maior que o valor total."* antes de enviar.
- Passo 6: saldos coerentes entre cabeçalho (`CN9_SALDO`), planilha (`CXN_VLSALD`) e item (`CNE_QTAMED`); **nunca negativo**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Medição da quantidade exata do saldo **recusada** com "valor maior que saldo" (cálculo pelo líquido; decimais truncados entre tela e ERP); instância em *Correção* com o erro no Histórico.

**Severidade:** Alta *(pagamento da parcela final bloqueado; saldo negativo se passar)*

**Preparação de massa:** contrato `QA` com medição parcial encerrada — requer fiscal de homologação para a primeira medição; dicionário conferido pelo administrador do Protheus. **Não** usar o 00013-2026-5303 (real).

**Verificado em tela:** PARCIAL
**O que foi verificado:** formulário em leitura (113249): `saldoMedirQtd___1`, `valorTotalItens___1`, `valTotalContrato`, `saldoContrato`; no fonte: *Saldo a Medir* ← `CNE_QTAMED`, `saldoContrato` ← `CN9_SALDO` com 6 decimais, crítica *"O valor do desconto não pode ser maior que o valor total."*; Histórico da 113249 lido na UI — o erro do ERP chega como comentário do *Administrador Cassi* na 182 (`Id do submodelo de origem:CNEDETAIL - Id do campo de origem:CNE_VLTOT - … - Id do erro:ERROR_PCO - mensagem do erro: Os saldos atuais do Planejamento e Controle Orçamentário são insuficientes …`) e a instância vai para *Correção* — mesma mecânica que "valor maior que saldo" seguiria. `ds_fatcon_get_info_medicoes` do **00013-2026-5303**: `CNE_QUANT` 12,06228 = `CNE_QTAMED` 12,06228, `CXN_VLSALD` 45.707,96.
**Divergências encontradas:** **saldo negativo vivo**: 00013-2026-5303 com `CN9_SALDO` **-45.235,96** e `CN9_VLATU` 90.943,92 — uma medição passou do saldo (ou o saldo foi recalculado errado), exatamente o inverso do que o ticket relata; a quantidade tem **5 decimais** (12,06228) — o decimal de `CNE_QUANT` neste ambiente precisa ser comparado com produção antes de qualquer teste de valor.
**Dados/massa usados:** nenhum — leitura.

---

## Fechamento

**14 itens, 14 casos escritos.** **6 COM superfície** (1689, 1690, 1696, 1704, 1751, 1753 — todos **PARCIAL**) e **8 SEM superfície** (todos **NÃO**): Financeiro e Contabil — 1511, 1805, 1819; Contratos - GCT — 1615, 1703; Compras — 1604, 1820; Dicionario e Pacote — 1796. Nenhum SIM: nenhum caso deste lote pode ser executado de ponta a ponta pela conta de QA (fiscal/comprador/fornecedor/ERP).

**Bloqueios:** sem credencial do Protheus (todos); conta de QA sem perfil de fiscal (1689/1690/1696/1753), sem comprador/fornecedor (1704), sem gestor/comprador (1751); Logs Protheus CV8/ZZY/ZZZ em 404 (ambiente).

**Divergências relevantes (achados):**
1. `ds_fatcon_get_info_medicoes` aceita `aaaa-mm` **e** `mm-aaaa` e devolve **planilhas diferentes** (000020 × 000004 no E01-2025-2101) sem crítica.
2. `ds_fatcon_get_medicaoAutomatica` sem `REVISAOCONTRATO` devolve `Cannot call method "trim" of undefined` **dentro dos campos** — erro de script servido como dado.
3. Contrato **00013-2026-5303**: `CN9_SALDO` -45.235,96 no cabeçalho × `CXN_VLSALD` +45.707,96 na planilha, sem item medido; **00050-2026-5303**: saldo > valor atual.
4. A instância do robô **111977** está na 182 há 22 dias com *"Prazo: Sem prazo definido"* — a atividade não tem SLA configurado; e o ERP já responde para o contrato dela *"Não há planilha disponível no contrato/competência selecionados"* (competência 08/2026 bloqueada enquanto a fila não sai).
5. As 7 instâncias em *Correção (117)* hoje caíram por **bloqueio do PCO** (`ERROR_PCO`, "saldos atuais do Planejamento e Controle Orçamentário são insuficientes"), com a mensagem só no Histórico (o formulário não tem campo de retorno).
6. `dsProtheus_getInformaPlanxContrato_restGetAll` (nome dado como errado no A17-a) **responde com dados hoje**.
7. Contrato 00006-2025-1201 (FSWTBC-1819) não existe neste tenant; medição automática abriu **202 instâncias** hoje 03:07–03:08.

## CT-FSWTBC-1760  (ambos · Concluído)

**Título:** Abrir uma medição para uma competência que já foi medida e ser informado com clareza de que a regra é uma medição por competência.

**Origem:** FSWTBC-1760 — "Erro na geração dos itens para medição de contrato". Falso defeito bem
esclarecido: já havia medição para a competência testada; ao testar com uma competência sem medição
abriu normalmente. O problema real é a **mensagem inadequada** para uma regra de negócio válida.

**Módulo/Rota:** Fluig → **Processos → Iniciar Solicitações → Contratos → Faturamento de Contratos**
(`/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos`).
Consulta de apoio: **Tracker - Processos Compras/ Contratos** → *Filtrar por:* **Faturamento de Contratos**.

**Pré-condições**
- Contrato vigente com planilha, cuja competência **X já possua medição gerada** (a medição
  existente pode ser localizada no Tracker, sem tocar no registro).
- Uma segunda competência do mesmo contrato **sem** medição, para o contraste.
- Integração `apiRESTProtheus_CASSI` no ar (o zoom de competência é servido pelo dataset
  `ds_fatcon_get_medicaoAutomatica`).
- **Bloqueio:** nenhum para a parte de leitura. Concluir o cenário exige **iniciar uma medição
  real**, o que não foi feito (regra §2). A confirmação de que a CND do Protheus recusa a segunda
  medição exige o ERP — **sem credencial**; ancorado no Fluig pelo **Tracker** e pelo **Histórico**.

**Passos**
1. Abrir o **Tracker - Processos Compras/ Contratos**, escolher em *Filtrar por:* a opção
   **Faturamento de Contratos**, preencher **Nº Contrato** e **Competência do Contrato** com o par
   já medido e clicar em **Pesquisar Registro**. Anotar o **Nº Medição** retornado.
2. Abrir **Processos → Iniciar Solicitações → Faturamento de Contratos**.
3. Na aba **Formulário**, preencher **Fornecedor**, **Nº do Contrato**, **Revisão**,
   **Filial do Contrato** e **Filial da Medição**.
4. No zoom **Competência do Contrato**, selecionar a competência que o passo 1 mostrou já medida.
5. Selecionar a **Nº da Planilha** e observar a carga dos itens.
6. Repetir os passos 3 a 5 com a competência **sem** medição.

**Resultado esperado**
- No passo 4/5, o sistema **impede** prosseguir e exibe uma mensagem que **nomeia a regra**:
  que já existe medição para aquele contrato/competência e que só é permitida uma por competência,
  idealmente citando o **Nº da Medição** já existente (o mesmo que o Tracker mostrou no passo 1).
- A mensagem **não** deve ser um erro genérico de busca nem sugerir falha técnica.
- No passo 6, com competência livre, a grade **Itens da Medição** carrega normalmente
  (colunas *Item, Cod. Produto, Desc. Produto, Saldo a Medir, Quantidade, Valor Unitário,
  Valor Desconto, Valor Total*) e o processo segue.
- Idealmente, a competência já medida **nem é oferecida** no zoom **Competência do Contrato**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A tela falhava ao gerar os itens da medição sem dizer o motivo, levando o usuário a abrir chamado
  de defeito. Nenhuma mensagem informava que já havia medição para a competência.

**Severidade:** Média *(não há risco financeiro; a regra é respeitada, mas a falta de mensagem bloqueia o fluxo e gera chamado indevido)*

**Preparação de massa:** um contrato vigente com **duas** competências disponíveis, uma já medida e
outra não. Quem prepara: analista de Contratos da CASSI com acesso ao Protheus, ou reaproveitar um
contrato já medido localizado pelo Tracker (leitura). **Não crie a medição só para forçar o cenário.**

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri o **Faturamento de Contratos**, que carrega em **Início** com as abas
*Formulário / Informações / Histórico / Anexos* e o botão **Enviar**. Confirmei no fonte publicado do
formulário os rótulos reais: **Nº do Contrato**, **Revisão**, **Filial do Contrato**,
**Competência do Contrato**, **Filial da Medição**, **Nº da Medição**, **Nº da Planilha**, e a grade
de itens com **Saldo a Medir** e **Quantidade**. No Tracker, o tipo **Faturamento de Contratos**
existe e devolve **Nº Medição** e **Competência do Contrato** como colunas — foi assim que li o
processo 31580 (contrato `E01-2025-2101`, competência `06-2025`, medição `000065`).
**Divergências encontradas:** **não existe, no fonte publicado, nenhuma mensagem que enuncie a regra
"uma medição por competência"**. As mensagens literais mais próximas são
*"Erro ao buscar as informações da medição."* (`fat_App_DataHandler.js`, genérica) e
*"Não existem itens a serem medidos para a planilha `<nº>`. Por favor, informe outra Planilha."*
(`fat_App_EventHandler.js`) — nenhuma das duas diz que já há medição na competência. **A pendência
registrada no ticket ("mensagem de usuário inadequada para regra de negócio válida") continua
válida hoje.**
**Dados/massa usados:** leitura do processo 31580 e do contrato `E01-2025-2101`, competência `06-2025`. Nada submetido.

---

## CT-FSWTBC-1777  (fluig · Concluído)

**Título:** A medição gerada automaticamente chega ao Fluig com os dados do contrato, e o histórico da solicitação registra a integração bem-sucedida.

**Origem:** FSWTBC-1777 — "[CASSI - BH] - Suporte Maio/2025] - Erro em produção na geração automática
de medição". Caso exemplar de entrega incompleta: a rotina foi entregue em produção em 13/05 e no
dia 14/05 o erro persistia. Causa registrada: *"o REST utilizado pelo Fluig NÃO TINHA RECEBIDO a
atualização do fonte que trata do erro"* — o ambiente tem **múltiplos RPOs** (compilação, REST,
schedule) e a entrega atualizava só um deles. Falha de **processo de deploy**, não de código.

**Módulo/Rota:** Faturamento de Contratos —
`/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos` → seção **Informações da Medição**
(`panel_Measurement`) e **Itens da Medição** (`panel_MeasurementItens`). Dataset da geração
automática: `ds_fatcon_get_medicaoAutomatica`. Conferência transversal: **Tracker** → filtro
**Faturamento de Contratos**.

**Pré-condições**
- Contrato vigente no Protheus com **medição automática configurada** (o formulário guarda o campo
  de controle `diaMedAutomatica`, o dia do disparo).
- Os RPOs de **compilação**, de **REST** e de **schedule** do ambiente na **mesma versão** — é
  exatamente esta a pré-condição que o defeito original violou.
- **Bloqueio:** **sim**, duplo. (1) A conferência de versão de RPO é feita no Protheus, e não há
  credencial. (2) O disparo é por **schedule**, e a política desta rodada proíbe rodar rotina batch.
  O que **é** verificável pelo Fluig é o **efeito**: se a medição chegou e com que dados.

**Passos**
1. Após a data configurada em `diaMedAutomatica`, abrir **Central de Tarefas** → aba
   **Tarefas a concluir** e localizar a instância de **FATURAMENTO DE CONTRATOS** gerada automaticamente.
2. Abrir a instância e conferir a seção **Informações da Medição**.
3. Ler os campos **Fornecedor**, **Nº do Contrato**, **Revisão**, **Filial do Contrato**,
   **Competência do Contrato**, **Filial da Medição**, **Tipo do Contrato**, **Situação do Contrato**,
   **Data Início**, **Data Final**, **Nº da Medição**, **Nº da Planilha** e **Objeto**.
4. Expandir **Itens da Medição** e conferir que a grade veio preenchida.
5. Abrir a aba **Histórico** da solicitação e procurar o registro da integração.
6. No **Tracker**, filtrar por **Faturamento de Contratos** e confirmar que a medição aparece.

**Resultado esperado**
- A instância de Faturamento é criada automaticamente, sem intervenção manual.
- **Nº da Medição** e **Nº da Planilha** vêm preenchidos com valores do Protheus, não em branco.
- **Itens da Medição** lista os itens do contrato com **Saldo a Medir**, **Quantidade**,
  **Valor Unitário** e **Valor Total**.
- A aba **Histórico** registra a integração concluída, no padrão
  `Integração executada com sucesso - Tempo de Execução N s`.
- Nenhuma mensagem `Erro ao buscar as informações da medição.` no formulário ou no console.

**Resultado se o defeito reincidir**
- A geração automática de medição falha em produção e continua falhando **mesmo após a correção ser
  entregue** — sintoma característico de RPO desatualizado num dos serviços (o REST), com o RPO
  principal já corrigido. Mensagem exata `<não documentado>`; o ticket descreve a causa
  ("o REST utilizado pelo Fluig não tinha recebido a atualização do fonte que trata do erro"),
  não o texto de tela.

**Severidade:** Alta *(medição é o documento que sustenta o pagamento do contrato; medição não gerada
ou gerada sem dados tem efeito financeiro direto)*

**Preparação de massa:** um contrato de serviço vigente no Protheus com medição automática
configurada e competência aberta, mais a **confirmação, por quem tem acesso ao ambiente, de que os
três RPOs (compilação, REST e schedule) estão na mesma versão**. Este segundo item é o coração do
caso e **não** é obtenível pelo Fluig — precisa vir do time de infra/deploy.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de **Faturamento de Contratos** abre (iframe `256836`) com as
seções **Identificação do Processo/Solicitante**, **Informações da Medição**, **Itens da Medição**,
**Validação do CSE - (Centro de Serviços Especializados)**, **Validação da Medição do Contrato CSE -
(Centro de Serviços Especializados)** e **Validação do Fiscal de Contrato** — as quatro últimas
ocultas até a etapa correspondente. Os rótulos citados nos passos foram todos observados. Confirmado
que a geração automática é alimentada pelo dataset **`ds_fatcon_get_medicaoAutomatica`** e que o
formulário guarda o dia do disparo em `diaMedAutomatica`. Confirmado também o campo de controle
`tipoInicioProcesso`, que distingue início **manual** de **automático**.
**Divergências encontradas:** **sim, achado novo no código do formulário.** A condição que decide se
os dados da medição são carregados é escrita como
`if (tipoInicioProcesso == 'manual' || 'automático')`. O segundo operando é uma **string literal**,
sempre verdadeira, então a condição é uma **tautologia**: o carregamento roda sempre, e a distinção
entre início manual e automático **não é efetivamente aplicada nesse ponto**. Hoje o efeito é
benigno (carregar sempre é mais seguro do que não carregar), mas a intenção declarada no código não
é a executada, e qualquer regra futura pendurada nesse `if` nascerá inerte. Vale reportar ao time.
**Dados/massa usados:** nenhum — não submetido; nenhuma medição foi gerada.

---

## CT-FSWTBC-1815  (fluig · Concluído)

**Título:** Os itens da medição carregam no formulário de Faturamento de Contratos, e uma falha da API é anunciada com mensagem tratada em vez de erro cru.

**Origem:** FSWTBC-1815 — "[CASSI - BH] - Suporte Maio/2025] - Erro no processo de carregamento dos
itens da medição (ERRO 500 retornado da API)". O carregamento dos itens da medição falhava com
**HTTP 500** vindo da API. Mesma família de FSWTBC-180 (timeout com 297 itens): o volume de itens é
o fator agravante.

**Módulo/Rota:** Faturamento de Contratos → seção **Itens da Medição** (`panel_MeasurementItens`,
tabela `tblItensMedicao`). Dataset consultado: **`ds_fatcon_get_info_medicoes`**, via
`GET /api/public/ecm/dataset/search`, com os filtros `CNA_CONTRA`, `FILIAL_CONTRATO`,
`COMPETENCIA_ESCOLHIDA` e `FILIAL_ESCOLHIDA`.

**Pré-condições**
- Contrato vigente com planilha e competência aberta, **de preferência com muitos itens** (o defeito
  original é sensível a volume — o caso irmão registra 297 itens).
- Integração com o Protheus no ar.
- **Bloqueio:** **parcial** — a tela é alcançável, mas encadear **Fornecedor → Contrato → Competência
  → Filial** depende dos zooms do Protheus, e é isso que revela a seção. Sem massa de contrato com
  medição aberta, a grade não monta.

**Passos**
1. Abrir `/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos`.
2. Em **Informações da Medição**, preencher **Fornecedor**, **Nº do Contrato**, **Filial do Contrato**,
   **Competência do Contrato** e **Filial da Medição** pelos zooms, nesta ordem.
3. Aguardar o carregamento e expandir a seção **Itens da Medição**.
4. Conferir a grade item a item: **Item**, **Cod. Produto**, **Desc. Produto**, **Saldo a Medir**,
   **Quantidade**, **Valor Unitário**, **Valor Desconto**, **Valor Total**.
5. Repetir com um contrato de **grande volume de itens** (na casa das centenas) e cronometrar.
6. Conferir os campos **Nº da Medição**, **Nº da Planilha** e **Situação** preenchidos.

**Resultado esperado**
- A seção **Itens da Medição** é revelada e a grade `tblItensMedicao` lista **todos** os itens da
  medição — a contagem bate com a planilha do contrato.
- O carregamento conclui também no contrato de grande volume, sem estouro de tempo.
- Não há resposta **HTTP 500** de `ds_fatcon_get_info_medicoes`.
- Se a consulta falhar por indisponibilidade, o formulário exibe a mensagem tratada
  **"Erro ao buscar as informações da medição."** — e não um erro cru de API ou uma tela em branco.
- Deixar contrato, competência ou filial em branco produz a crítica
  **"Verifique o preenchimento dos campos Nº Contrato, Competência do Contrato, Código da Filial e
  Cód. Filial Medição (Selecionando a Planilha)!"**.

**Resultado se o defeito reincidir**
- O carregamento dos itens da medição falha com **erro 500 retornado da API**, a grade fica vazia e a
  medição não pode ser realizada. Em contrato com muitos itens, o sintoma aparece como demora seguida
  de falha.

**Severidade:** Alta *(sem os itens não há medição, e sem medição não há faturamento do contrato —
efeito financeiro direto)*

**Preparação de massa:** **dois** contratos de serviço vigentes com competência aberta: um pequeno,
para o caminho feliz, e um com **centenas de itens**, para exercitar o volume que originou o defeito.
Ambos precisam existir no Protheus com planilha de medição; o executor de QA não pode criá-los.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de Faturamento abre e a seção **Itens da Medição**
(`panel_MeasurementItens`) existe, oculta, com a tabela `tblItensMedicao` e os rótulos **Item \***,
**Cod. Produto \***, **Desc. Produto \***, **Saldo a Medir \***, **Quantidade \***,
**Valor Unitário \***, **Valor Desconto \***, **Valor Total \*** — e, ao lado, a tabela de rateio
`tblRateio` com **Item \***, **% Rateio \***, **Centro de Custo \*** e **Classe de Valor \***.
Confirmado no código que o carregamento chama **`ds_fatcon_get_info_medicoes`** com os quatro filtros
citados, e que **há tratamento de erro**: a resposta é checada por status **e** por um campo
`STATUS == "SUCCESS"`, e a falha cai em `catch` que registra
`Erro ao buscar as informações da medição. Error: ...` e apresenta a mensagem tratada
**"Erro ao buscar as informações da medição."**. A crítica de campos obrigatórios citada no
resultado esperado foi lida literalmente no mesmo trecho. A grade não foi populada por falta de massa.
**Divergências encontradas:** nenhuma quanto ao ticket. Registro de contexto: a seção só é revelada
após encadear **Fornecedor → Contrato → Competência → Filial** nos zooms do Protheus, então
"abrir a tela e ver os itens" não é um passo válido — o roteiro precisa do encadeamento.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1893  (ambos · Concluído)

**Título:** Gravar uma medição cujo item tenha muitas linhas de rateio e ver todas chegarem ao ERP com o sequencial correto.

**Origem:** FSWTBC-1893 — erro na gravação da medição, lado Fluig, por grande volume de itens de
rateio. Par do FSWTBC-1894: o Fluig gerava sequenciais **numéricos** para `CNZ_ITEM` enquanto o ERP
usa **alfanuméricos**; um campo de 2 posições estoura no item 100. Contrato implícito quebrado —
o Fluig assumiu numérico sem que a regra do Protheus estivesse documentada.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** → atividade **Realizar Medição do Contrato** →
seção de **Rateio** (botões **Adicionar Rateio**, **Download Planilha de Rateio Modelo**,
**Upload Planilha de Rateio Preenchida**, **Remover Todos os Rateios**).

**Pré-condições**
- Medição aberta na atividade **Realizar Medição do Contrato**, com itens carregados.
- Um item que exija **mais de 99 linhas de rateio** (é essa a fronteira do campo de 2 posições).
- **Bloqueio:** a confirmação de que os rateios chegaram à `CNZ` do Protheus com o sequencial certo
  exige o ERP — **sem credencial**. Ancorado no Fluig por: (a) a atividade **Gravar Medição** do
  **Histórico** concluir com *"Integração executada com sucesso - Tempo de Execução N s"*, e (b) o
  campo **Medição Acumulada** do modal *Informações Complementares do Contrato* refletir o valor
  medido. Além disso o caso exige **gravar uma medição real**, o que não foi feito (regra §2).

**Passos**
1. Abrir a medição na atividade **Realizar Medição do Contrato**.
2. Selecionar um item da grade **Itens da Medição** e informar a **Quantidade**.
3. Clicar em **Download Planilha de Rateio Modelo**.
4. Preencher a planilha com **mais de 99 linhas de rateio para o mesmo item**, com os percentuais
   fechando exatamente 100% para aquele item.
5. Clicar em **Upload Planilha de Rateio Preenchida** e carregar o arquivo (**formato `.csv`** — ver Divergências).
6. Conferir na grade de rateio que todas as linhas entraram, em especial as de ordem **99, 100 e 101**.
7. Movimentar a solicitação para **Gravar Medição**.
8. Reabrir a solicitação em modo leitura por
   `/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=<nº>` e abrir a aba **Histórico**.
9. Abrir **Acompanhamento de Contratos**, localizar o contrato, clicar no ícone
   `title="Informações do Contrato"` e conferir **Medição Acumulada** e **Saldo do Contrato**.

**Resultado esperado**
- Todas as linhas de rateio, inclusive além da 99ª, são aceitas e listadas na grade.
- A atividade **Gravar Medição** conclui e o **Histórico** registra
  *"Integração executada com sucesso - Tempo de Execução N s"*.
- O processo segue para **Pagamento?** e depois **Criar Pedido de Compras**, sem retornar a uma
  atividade de correção.
- **Medição Acumulada** e **Saldo do Contrato** refletem a medição gravada.
- Nenhuma linha de rateio é perdida ou sobrescrita.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A gravação da medição falhava com grande volume de linhas de rateio, porque o sequencial gerado
  para `CNZ_ITEM` era numérico e estourava as 2 posições do campo a partir do item 100 — enquanto o
  ERP espera sequencial **alfanumérico**.

**Severidade:** Alta *(perda/corrupção de linha de rateio contábil e falha de gravação de medição — risco financeiro e contábil)*

**Preparação de massa:** uma medição em **Realizar Medição do Contrato** cujo item admita **mais de
99 linhas de rateio** (100+ centros de custo/classes de valor no mesmo item). Quem prepara: analista
de Contratos da CASSI, com um contrato de rateio pulverizado. **Sem essa massa o caso não exercita a
fronteira** — com poucas linhas ele passa mesmo se o defeito existir.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei no fonte publicado os rótulos e ids da seção de rateio:
botões **Adicionar Rateio** (`btnAdicionarRateio`), **Download Planilha de Rateio Modelo**
(`btnDownLoadModeloPlanilha`), **Upload Planilha de Rateio Preenchida** (`btnImportPlanilha`),
**Remover Todos os Rateios** (`btnDelItensRateio`); grade `tblRateio` com **% Rateio**,
**Centro de Custo**, **Classe de Valor**. Confirmei que o campo que carrega o `CNZ_ITEM` é o
`tbrat_itcont` (`fat_App_EventHandler.js:399`:
`setElementValue({ element: 'tbrat_itcont___' + index, value: data?.CNZ_ITEM || "    " })`).
**Divergências encontradas:** achado relevante, **lido no fonte publicado, não visto em tela**: a
função que gera o sequencial de rateio continua **numérica e de 2 posições**.
`fat_App_EventHandler.js:730`, dentro de `handleNewItemApportionment`:
`const paddedCount = (count + 1).toString().padStart(2, '0');` — e o valor é gravado direto em
`tbrat_itcont___<index>`. Duas ressalvas de honestidade: (a) o `count` **reinicia a cada item**, de
modo que só estoura na 100ª linha de rateio **do mesmo item**, não no 100º item; (b) o ticket foi
fechado como corrigido, e a correção pode ter sido feita **server-side** (a subtarefa 2140 cita a MUD
do `UGCTE001.data.tlpp` "que trata do sequencial do item no rateio") — o front-end publicado, porém,
**continua emitindo numérico**. Registro isso como ponto a reconferir, não como afirmação de que o
defeito voltou. Divergência menor: o upload de rateio aceita **apenas `.csv`**
(`<input type="file" id="fl_planilha" accept=".csv">`), enquanto o upload de **itens** aceita
`.xlsx` (`fl_planilhaMedi`) — quem levar um `.xlsx` de rateio será recusado pelo seletor de arquivo.
**Dados/massa usados:** nenhum — não submetido. Leitura de fonte publicado e do formulário.

---

## CT-FSWTBC-1894  (protheus · Concluído)

**Título:** Encerrar uma medição com mais de 99 linhas de rateio e obter todos os itens gravados no ERP, sem chave duplicada

**Origem:** FSWTBC-1894 — "SD: 762674 - Erro no processo de gravação da medição no faturamento de contratos (Protheus)": `CNZ_ITEM` tem 2 posições e a medição tinha mais de 100 itens → chave duplicada; depois, itens acima de 99 não gravavam porque a rotina somava 1 **como numérico**. Corrigido com `SOMA1` (incremento alfanumérico: 99 → A0…). O paliativo foi ajustar o JSON da medição à mão.

**Módulo/Rota:** Fluig → **Central de Tarefas → Faturamento de Contratos** (instância em *Realizar Medição do Contrato*, seq 25/28) → grade de **rateio** do item (`tbrat_item___N`, `tbrat_porcentagem___N`; `tbrat_itcont___N` recebe `CNZ_ITEM` do ERP) ou **Upload Planilha de Itens Preenchida** → combo *Direcionar Processo para* → **Gravar/Encerrar Medição (105)** → **Aguarda processamento Fila Protheus (182)** → **Pedido Gerado? (162)** → *Pagamento? (192)*; erro → **Correção (117)**. Leitura: **Histórico** da instância; **Logs Protheus › Medicoes ZZZ** (`Num Med`, `Status`, `Msg Medicao`, `Json Medicao`, `Qtd T.Env Fl`); **Tracker › Faturamento de Contratos**. No ERP: medição (CNTA120) e tabela **CNZ** (`CNZ_ITEM`).

**Pré-condições**
- Instância de Faturamento de Contratos atribuída ao executor (fiscal de homologação) em *Realizar Medição do Contrato*, para um contrato `QA` cuja planilha/rateio permita **≥ 100 linhas** (100 itens ou 100 linhas de rateio — o ticket fala em "itens"; o campo é `CNZ_ITEM`).
- Widget Logs Protheus respondendo (hoje `genericQuery` em 404 — ambiente).
- **Bloqueio:** massa — nenhum contrato da grade tem planilha com ≥ 100 itens (os seis maiores por `CN9_VLATU` têm 1–2 itens por planilha; E01-2025-2101 tem 2). A conta de QA não é fiscal de nenhum contrato. Caso executável só com contrato `QA` criado no GCT de homologação com 100+ itens.

**Passos**
1. Abrir a instância em *Realizar Medição do Contrato*; conferir que os itens carregam (`item___1…N`, coluna *Item* = `CNE_ITEM` de 3 posições).
2. Preencher a medição de forma a gerar **≥ 100 linhas** de rateio/itens (grade ou *Upload Planilha de Itens Preenchida* — só o nome `Planilha de Medicao.xlsx` é aceito, A11-c); confirmar que a soma de rateio por item fecha em 100%.
3. *Direcionar Processo para* = Gravar/Encerrar Medição → **Enviar**. Anotar o horário.
4. Histórico: acompanhar *Gravar/Encerrar Medição* → *Aguarda processamento Fila Protheus* → *Pedido Gerado?*; cronometrar a saída da 182 (medido em instâncias sadias: 1–6 s na entrada, ~7 min até *Pedido Gerado?*).
5. Logs Protheus › **Medicoes ZZZ** → *Id Fluig* = nº da instância → **Consultar**: ler *Status*, *Msg Medicao*, *Json Medicao* (contar as linhas do JSON) e `Qtd T.Env Fl`.
6. *(quando houver credencial)* Protheus → CNZ da medição: listar `CNZ_ITEM` ordenado.

**Resultado esperado**
- Passo 4: a instância **não** cai em *Correção (117)*; *Pedido Gerado?* decide "Sim" e o processo segue a *Pagamento?*.
- Passo 5: *Status* de sucesso, *Msg Medicao* sem `duplicate key`/`chave duplicada`; o JSON tem **todas** as linhas enviadas; `Qtd T.Env Fl` = 1 (sem retentativa).
- Passo 6: `CNZ_ITEM` sequencial `01…99, A0, A1…` (alfanumérico), **uma linha por item enviado**, sem lacuna a partir do 100º.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Instância em *Correção (117)* com erro de **chave duplicada** no Histórico; ou medição "gravada" com apenas 99 itens no ERP (os demais silenciosamente ausentes); ZZZ com *Status* de erro e retentativas em `Qtd T.Env Fl`.

**Severidade:** Alta *(perda silenciosa de itens da medição — financeiro)*

**Preparação de massa:** contrato `QA` no GCT de homologação com planilha de ≥ 100 itens (ou rateio de 100 centros de custo) e fiscal = usuário do executor, criado pelo time Protheus; instância de Faturamento aberta pelo próprio executor. Não usar instâncias reais.

**Verificado em tela:** PARCIAL
**O que foi verificado:** cadeia 105 → 182 → 162 → 117 confirmada por movimentos reais (1.000 movimentos: 10/10/9/7); três instâncias (111980, 111977, 111973) ainda em **182** há 22–25 dias, `NOT_COMPLETED`, `assignee=admin`, sem escolhidos; botões *Download Planilha de Itens Modelo* / *Upload Planilha de Itens Preenchida* no formulário; `tbrat_itcont` ← `CNZ_ITEM` no fonte publicado; `ds_fatcon_get_info_medicoes` devolve os itens (`CNE_ITEM` 3 posições). Logs Protheus abre com as três abas e filtros, mas a consulta responde 404. **Não** medi com ≥ 100 itens (sem massa).
**Divergências encontradas:** o ticket diz "itens"; no ERP o campo é `CNZ_ITEM` (rateio da medição) — confirmar se o limite é de itens da planilha ou de linhas de rateio. `CNE_ITEM` (planilha) tem 3 posições no dataset; `CNZ_ITEM` 2 — assimetria que originou o defeito.
**Dados/massa usados:** leitura de E01-2025-2101 e das instâncias 111980/111977/111973 — nada submetido.

---

## CT-FSWTBC-1903  (ambos · Concluído)

**Título:** Realizar a medição de um contrato com centenas de itens e ver o processo concluir sem cair por tempo ou transação.

**Origem:** FSWTBC-1903 — medição 29303, contrato com **297 itens**, falhou com
`EJBTransactionRolledbackException`. É o **mesmo contrato de 297 itens** do FSWTBC-180 (jan/2025,
timeout de 1 minuto), reaparecendo cinco meses depois. Fechado no mesmo dia, sem correção
registrada; a solução estrutural dependeria da migração para fila (FSWTBC-1836/1844/1853).

**Módulo/Rota:** Fluig → **Faturamento de Contratos** → **Realizar Medição do Contrato** → **Gravar Medição**.

**Pré-condições**
- Contrato com **volume alto de itens de planilha** (a referência do ticket é 297).
- Competência aberta e planilha vinculada.
- **Bloqueio:** a confirmação do lado transacional (JTA/ExecAuto no Protheus) exige o ERP — **sem
  credencial**. Ancorado no Fluig pelo **Histórico** (a atividade **Gravar Medição** precisa
  registrar *"Integração executada com sucesso - Tempo de Execução N s"*, e o **N** é a própria
  medida do problema). Concluir o caso exige **gravar medição real**, não feito nesta rodada (§2).
  **Este é o caso com menor superfície de front-end do lote** — ver Divergências.

**Passos**
1. Abrir **Faturamento de Contratos** e informar o contrato de alto volume.
2. Selecionar **Competência do Contrato** e **Nº da Planilha**.
3. Aguardar a carga da grade **Itens da Medição** e **cronometrar** o tempo até a grade ficar utilizável.
4. Informar **Quantidade** nos itens a medir.
5. Movimentar para **Gravar Medição**.
6. Reabrir a solicitação em modo leitura e abrir a aba **Histórico**.
7. Ler o tempo registrado em **Gravar Medição** e em **Criar Pedido de Compras**.

**Resultado esperado**
- A grade de itens carrega **completa**, com os 297 itens, sem travar a aba do navegador.
- A movimentação para **Gravar Medição** conclui e o **Histórico** registra
  *"Integração executada com sucesso - Tempo de Execução N s"*.
- O processo avança para **Pagamento?** → **Criar Pedido de Compras** → **Notifica Fornecedor** →
  **Fim - Faturamento de Contratos**.
- Nenhuma exceção transacional é devolvida ao usuário e nenhuma medição parcial é gravada.
- Enquanto processa, o usuário recebe **algum indicativo de progresso**, não apenas um spinner mudo.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A medição falhava com `EJBTransactionRolledbackException` (medição 29303, 297 itens). Em janeiro,
  o mesmo contrato falhava por **timeout de 1 minuto** (FSWTBC-180).

**Severidade:** Alta *(medição não gravada e possibilidade de gravação parcial — risco financeiro e de perda de dado)*

**Preparação de massa:** um contrato com **~300 itens de planilha** em competência aberta. Quem
prepara: analista de Contratos da CASSI. O processo **29303 existe nesta base** (histórico com 17
entradas e 12 anexos) e serve de referência para localizar o contrato, **mas não deve ser
movimentado** — use-o só para leitura.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei que o processo **29303 existe nesta base**, em modo leitura, com
**Histórico (17)** e **Anexos (12)**. Confirmei a cadeia de atividades e o texto literal de sucesso
lendo o **Histórico do processo 31580**: *"Gravar Medição — Executando atividade de serviço do
sistema — Integração executada com sucesso - Tempo de Execução 9 s"*, *"Criar Pedido de Compras … 20
s"*, *"Busca Informações do Contrato … 7 s"*, *"Notifica Fornecedor … 1 s"*. **É essa linha que o
caso afere.**
**Divergências encontradas:** quatro, todas **lidas no fonte publicado** e todas apontando que a
pendência do ticket ("volume alto continua sem tratamento até a migração assíncrona") **segue
verdadeira no front-end**:
(1) o `restCall` do Faturamento usa `fetch` **sem `AbortController`, sem `signal` e sem timeout** —
a requisição fica pendurada até o gateway cortar, e não há retry;
(2) **não há chunk, lote, fila ou retomada** no envio ao ERP;
(3) a barra de progresso **existe mas é código morto** — `showProgressBar` / `updateProgressBar` /
`closeProgressBar` estão definidas em `fat_Util_UtilsHandler.js:228/273/279` e **não têm nenhum
call site** em todo o fonte publicado; o usuário vê apenas o spinner *"Aguarde..."*;
(4) `fat_App_EventHandler.js:942` usa `await Promise.all(records.map(...))` **sem limite de
concorrência**, e cada registro dispara duas consultas (classe de valor e centro de custo) — com 297
registros isso são ~594 requisições simultâneas, o que **agrava** o volume em vez de mitigá-lo.
Há evidência documental de um incidente anterior de volume: o comentário
`//COMMENT NOTE: ** SDCASSI-543: debounce + guarda de reentrancia ...` em
`fat_App_ViewHandler.js:827` — mas essa correção atacou só a **validação de rateio**, não o envio.
Divergência de cobertura: **o formulário de Faturamento não tem nenhum campo para exibir erro de
integração** (zero `<label>` com "ERP"/"Integração" em `form_fat.html`), então uma falha transacional
**não tem canal de exibição na tela** — só toast efêmero e Histórico. É a lacuna de front-end
declarada deste caso.
**Dados/massa usados:** leitura dos processos 29303 e 31580. Nada submetido.

---

## CT-FSWTBC-1904  (fluig · Concluído · SD 762845)

**Título:** A medição automática chega ao formulário com os dados do contrato e da competência já preenchidos.

**Origem:** FSWTBC-1904 — "SD: 762845 - Medição automática não carregou dados no formulário.
Processo 29744". A medição automática voltou a falhar em maio, **após toda a refatoração de abril**.
O ticket cita o processo 29744 e não traz mais descrição.

**Módulo/Rota:** Faturamento de Contratos → seção **Informações da Medição** (`panel_Measurement`) e
**Itens da Medição** (`panel_MeasurementItens`). Campos de controle: `tipoInicioProcesso`
(manual/automático), `controlField` e `numProcessoPai`. Dataset da geração automática:
`ds_fatcon_get_medicaoAutomatica`.

**Pré-condições**
- Contrato com **medição automática configurada** (dia do disparo em `diaMedAutomatica`) e
  competência aberta.
- Rotina de geração automática executada (schedule).
- **Bloqueio:** **sim** — o gatilho é um **schedule**, e a política desta rodada proíbe rodar rotina
  batch. O caso é executável observando uma instância automática **já existente**, sem provocá-la.

**Passos**
1. Localizar, na **Central de Tarefas** → **Tarefas a concluir**, uma instância de **FATURAMENTO DE
   CONTRATOS** originada de geração **automática**.
2. Abrir a instância e ir à seção **Informações da Medição**.
3. Conferir se os campos vieram **preenchidos**, e não em branco:
   **Fornecedor**, **Nº do Contrato**, **Revisão**, **Filial do Contrato**,
   **Competência do Contrato**, **Filial da Medição**, **Tipo do Contrato**, **Situação do Contrato**,
   **Data Início**, **Data Final**, **Nº da Medição**, **Nº da Planilha**, **Objeto**.
4. Conferir os campos de fiscalização: **Aprovação Prévia CSE?**, **Aprovador CSE**,
   **Aprov. Fiscal de Serviço?**, **Fiscal de Serviço**, **Fiscal de Contrato**.
5. Expandir **Itens da Medição** e conferir que a grade tem linhas.
6. Comparar os valores com os do contrato no Protheus.

**Resultado esperado**
- Na medição **automática**, a seção **Informações da Medição** vem preenchida — o usuário não
  precisa refazer manualmente o encadeamento Fornecedor → Contrato → Competência → Filial.
- **Nº da Medição** e **Nº da Planilha** trazem valores do ERP.
- **Itens da Medição** lista as linhas do contrato, com **Saldo a Medir** coerente.
- O comportamento é **equivalente** ao da medição manual — automática não pode ser um caminho degradado.
- As linhas **não** são duplicadas se o formulário for reaberto antes de a medição ser gravada.

**Resultado se o defeito reincidir**
- A medição automática abre com o **formulário sem dados** — campos da medição em branco e grade de
  itens vazia —, obrigando o usuário a refazer tudo à mão ou impedindo a medição.

**Severidade:** Alta *(medição é a base do faturamento do contrato; medição automática vazia
interrompe o ciclo de pagamento e induz retrabalho manual sobre valor financeiro)*

**Preparação de massa:** um contrato com medição automática configurada, competência aberta e a
rotina de geração já executada — ou seja, **uma instância automática viva na base**, apontada por
quem acompanha o ambiente. Não deve ser provocada pelo executor (é rotina batch).

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de Faturamento abre com as seções e todos os rótulos citados
nos passos 3 e 4 (conferidos um a um: de **Fornecedor \*** e **Nº do Contrato \*** até
**Fiscal de Contrato \*** e **Houve Prestação de Serviço? \***). Confirmado o campo de controle
**`tipoInicioProcesso`**, que separa início manual de automático, e o dataset
**`ds_fatcon_get_medicaoAutomatica`**, consultado por contrato e filial. Confirmada também a
proteção contra duplicação que corresponde ao "reabrir não duplica" do resultado esperado: antes de
carregar, a rotina **apaga as linhas existentes de itens**, e só o faz **enquanto a medição ainda não
foi gravada** (`controlField = 'GRAVA_MED'` e `numProcessoPai` vazio ou `SOLIC_MED`) — nas etapas de
aprovação (`APROV_MED`, `FISCA_MED`) ela não mexe mais na grade. Não foi encontrada instância de
medição automática viva na Central de Tarefas desta conta.
**Divergências encontradas:** **a mesma tautologia relatada em CT-FSWTBC-1777** e que impacta
diretamente este caso: a decisão de carregar os dados da medição está escrita como
`if (tipoInicioProcesso == 'manual' || 'automático')`, cujo segundo operando é uma string literal
sempre verdadeira. Consequência para quem for executar este caso: **o formulário não distingue de
fato o início automático do manual nesse ponto** — logo, um resultado verde aqui não prova que o
ramo "automático" foi exercitado, apenas que o carregamento ocorreu. Recomenda-se corrigir a condição
antes de usar este caso como evidência de regressão do caminho automático.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1933  (ambos · Concluído)

**Título:** Conferir que a medição automática de um contrato é disparada no dia configurado na planilha, e não no dia antigo do cabeçalho do contrato.

**Origem:** FSWTBC-1933 — erro no disparo automático de medições: a API buscava o dia de medição na
**CN9** em vez da **CNA**. Regressão direta da DEM10013729, que moveu o dia de medição do contrato
(`CN9_XDTMED`) para a planilha (`CNA_XDTMED`), sem que a API de disparo acompanhasse. Detectado em
produção seis semanas após a entrega.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** → zoom **Competência do Contrato**.
Conferência: **Tracker** → *Filtrar por:* **Faturamento de Contratos**.

**Pré-condições**
- Contrato vigente com **planilha** cujo dia de medição (`CNA_XDTMED`) esteja preenchido e seja
  **diferente** do dia gravado no cabeçalho do contrato (`CN9_XDTMED`) — é essa diferença que
  distingue as duas leituras.
- **Bloqueio:** o disparo automático é **rotina agendada no Protheus** e **não deve ser executado**
  (regra §2: nada de batch/schedule). Sem credencial no ERP não há como ler CN9/CNA diretamente.
  Ancorado no Fluig por duas superfícies: (a) o zoom **Competência do Contrato** é servido pelo
  dataset **`ds_fatcon_get_medicaoAutomatica`** — isto é, a mesma fonte da medição automática está
  exposta na tela; (b) o **Tracker** mostra se a medição daquela competência foi de fato gerada.

**Passos**
1. Abrir o **Tracker**, escolher **Faturamento de Contratos**, filtrar por **Nº Contrato** e pela
   **Competência do Contrato** esperada e clicar em **Pesquisar Registro**.
2. Anotar se há processo gerado, a **Data da Solicitação** e o **Nº Medição**.
3. Abrir **Processos → Iniciar Solicitações → Faturamento de Contratos**.
4. Preencher **Fornecedor**, **Nº do Contrato**, **Revisão** e **Filial do Contrato**.
5. Abrir o zoom **Competência do Contrato** e conferir a lista de competências oferecidas.
6. Repetir com um contrato cujo dia de medição da planilha seja diferente do dia do cabeçalho.

**Resultado esperado**
- A competência oferecida no zoom, e a competência efetivamente disparada, correspondem ao dia de
  medição configurado **na planilha do contrato** (`CNA_XDTMED`).
- No Tracker, a **Data da Solicitação** do processo gerado automaticamente cai no dia configurado na
  planilha — não no dia antigo do cabeçalho.
- Contratos com dia de medição alterado após a DEM10013729 disparam na data nova, sem intervenção manual.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O disparo automático usava o dia gravado em `CN9_XDTMED` (cabeçalho do contrato) em vez de
  `CNA_XDTMED` (planilha), "conforme melhoria aplicada em PRD pela DEM10013729" — resultando em
  medições disparadas na data errada ou não disparadas.

**Severidade:** Alta *(medição não gerada ou gerada fora da competência correta — risco financeiro e de faturamento)*

**Preparação de massa:** um contrato cuja planilha tenha `CNA_XDTMED` **diferente** do `CN9_XDTMED`
do cabeçalho. Quem prepara: analista de Contratos da CASSI com acesso ao Protheus — **não é
criável pelo Fluig**. Sem esse par divergente o caso não distingue as duas leituras e passa por acidente.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei que o zoom **Competência do Contrato** existe no formulário
(`<select id="zoomCompetencia" type="zoom">`) e — achado que amarra este ticket ao front-end — que
ele é alimentado pelo dataset **`ds_fatcon_get_medicaoAutomatica`**, lido em
`fat_App_DataHandler.js:363` (`getCompetences`), com os filtros
`FILIAIS, CODIGOCONTRATO, CODIGOFORNECEDORLOJA, FILIALCONTRATO, REVISAOCONTRATO` e `limit=300`.
Ou seja, **a medição automática tem, sim, uma superfície no Fluig**: é a lista de competências
oferecidas ao usuário. No Tracker confirmei as colunas **Competência do Contrato**, **Nº Medição** e
**Data da Solicitação**, que permitem verificar o disparo sem entrar no ERP.
**Divergências encontradas:** o ticket fala em CN9/CNA, que são tabelas do Protheus e **não aparecem
com esse nome em lugar nenhum da tela** — no Fluig o que se vê é o rótulo **Competência do
Contrato**. Registro também que, se o contrato não tiver competência elegível, o usuário recebe
apenas *"Erro ao buscar as informações de Competência de Medição do Contrato. Por favor, tente
novamente."* (`fat_App_DataHandler.js:618`) — uma mensagem de **erro técnico** para o que pode ser
simplesmente ausência de configuração; ela não distingue "sem competência configurada" de "API fora".
**Dados/massa usados:** nenhum — não submetido. Leitura de tela e de fonte publicado.

---

## CT-FSWTBC-1934  (protheus · Concluído)

**Título:** Conferir o disparo automático de medições da madrugada: uma instância de Faturamento por contrato/filial elegível, sem erro

**Origem:** FSWTBC-1934 — "Erro no disparo automático de medições": par exato do FSWTBC-1933 (mesmo incidente 763253), aberto para o lado Protheus. Sem descrição além do título — caso de **caracterização de caminho**.

**Módulo/Rota:** Fluig → **Tracker** (`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`) → *Filtrar por* = Faturamento de Contratos → *Data de Solicitação*; **Central de Tarefas → Faturamento de Contratos** (instâncias abertas pelo integrador `consumerkeycompras` às **03h**, atividade *Realizar Medição do Contrato*, seq 25/28); dataset `ds_fatcon_get_medicaoAutomatica` (`FILIAIS,true,CODIGOCONTRATO,…,CODIGOFORNECEDORLOJA,…,FILIALCONTRATO,…,REVISAOCONTRATO,…`); **Logs Protheus › Medicoes ZZZ**. No ERP: schedule/API de medição automática (`CNL_MEDAUT` no tipo de planilha) — nome a confirmar no menu do cliente.

**Pré-condições**
- Schedule de medição automática ativo no ambiente (não executar manualmente — regra §2).
- Ao menos um contrato vigente com tipo de planilha `CNL_MEDAUT` habilitado e competência em aberto.
- **Bloqueio:** nenhum para a leitura; a conta de QA não é fiscal, então não movimenta as instâncias criadas.

**Passos**
1. No dia seguinte a um disparo (03h), Tracker → *Faturamento de Contratos* → *Data de Solicitação* = hoje → **Pesquisar Registro**; contar as instâncias e anotar contrato/filial/competência.
2. Abrir uma delas (Central de Tarefas ou `pageworkflowview?...detailsProcessInstanceID=`) → aba **Histórico**: solicitante da abertura, atividade atual, responsável (fiscal) e horário.
3. Formulário: itens da planilha carregados (`item___N`, quantidades, *Saldo a Medir*), competência preenchida.
4. `GET /api/public/ecm/dataset/search?datasetId=ds_fatcon_get_medicaoAutomatica&filterFields=FILIAIS,true,CODIGOCONTRATO,<contrato>,CODIGOFORNECEDORLOJA,<forn+loja>,FILIALCONTRATO,<filial>,REVISAOCONTRATO,<rev>` → comparar as combinações (filial × competência) com as instâncias do passo 1.
5. Logs Protheus › **Medicoes ZZZ** → *Recebimento inicial/final* = hoje → **Consultar** (quando o widget responder).
6. Repetir o passo 1 para o dia anterior e confirmar que **não** há segunda instância para o mesmo (contrato, filial, competência).

**Resultado esperado**
- Passo 1–2: uma instância por combinação elegível, aberta pelo integrador na janela das 03h, em *Realizar Medição do Contrato*, atribuída ao fiscal do contrato; Histórico sem erro.
- Passo 3: itens e saldo carregados (nada em branco ou `undefined`).
- Passo 4: o dataset devolve as mesmas combinações (para E01-2025-2101: 14 linhas — filiais 2101, 2201, 2301… × competência 09/2026).
- Passo 6: sem duplicidade entre dias; nenhuma instância nascida do disparo em *Correção (117)* ou presa em *182*.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Madrugada sem instâncias, ou instâncias com erro no Histórico/formulário vazio; dataset devolvendo erro de script (`Cannot call method "trim" of undefined`, medido no L039 sem `REVISAOCONTRATO`) ou `ERRORCODE 404 "Não foram localizadas medições…"` para contratos elegíveis.

**Severidade:** Alta *(medição automática é a origem da maior parte das instâncias — falha silenciosa atrasa faturamento)*

**Preparação de massa:** nenhuma a criar — o disparo é do ambiente. Para um caso controlado: contrato `QA` com tipo de planilha `CNL_MEDAUT` habilitado, criado pelo time Protheus em homologação.

**Verificado em tela:** PARCIAL
**O que foi verificado:** 300 instâncias mais recentes de Faturamento agregadas por dia/hora/estado: **60 abertas hoje 08/09 às 03h** (todas em seq 28 *Realizar Medição do Contrato*), 55 em 05/09 03h, 9 em 07/09, 3 em 06/09 e 3 em 04/09 — o disparo rodou nas últimas cinco madrugadas; instâncias diurnas (manuais) e 7 em *Correção (117)* de 02–03/09 (não nascidas do disparo). A **111977** nasceu por `consumerkeycompras` em 15/08 03:00 e está em *182* desde 17/08. `ds_fatcon_get_medicaoAutomatica` com `REVISAOCONTRATO` → 14 linhas para E01-2025-2101. Logs Protheus: consulta em 404 (ambiente). Não abri instância do disparo em modo de edição.
**Divergências encontradas:** o campo `requester` da API não expõe o login nas listagens (`?`) — a autoria `consumerkeycompras` foi confirmada pelas `tasks` da 111977 e pelo L039; o ticket não tem descrição.
**Dados/massa usados:** leitura — nada submetido.

---

## CT-FSWTBC-1959  (fluig · Concluído)

**Título:** Fiscal gera medição manual de um contrato que já tem medição automática na competência e o sistema trata as duas sem conflito.

**Origem:** FSWTBC-1959 — geração manual de medição para contratos que já estavam com a data de medição
automática preenchida; houve correção manual de registros (da linha 210 em diante) até a aplicação da
correção em produção.

**Módulo/Rota:** Processo *Faturamento de Contratos* (`wf_faturamento_contratos`) → **Informações da
Medição**.

**Pré-condições**
- Contrato **Vigente** com planilha e saldo a medir, e **competência** aberta.
- Esse mesmo contrato/competência **já processado** pela medição automática (dataset
  `ds_fatcon_get_medicaoAutomatica`, execução agendada).
- Perfil que inicia *Faturamento de Contratos*.
- **Bloqueio:** **sim** — o cenário depende de a rotina automática já ter rodado sobre a competência, e
  **não é permitido disparar rotina batch/schedule** nesta rodada. Além disso não há, para a conta de
  QA, contrato com medição automática já lançada e saldo remanescente identificável.

**Passos**
1. Iniciar *Faturamento de Contratos*.
2. Selecionar **Fornecedor** (zoom), **Nº do Contrato** (zoom), conferir **Revisão** e **Filial do Contrato**.
3. Selecionar **Competência do Contrato** — a mesma já coberta pela medição automática — e a
   **Filial da Medição**.
4. Observar o preenchimento automático de **Nº da Medição**, **Tipo do Contrato**, **Situação do Contrato**,
   **Data Início**, **Data Final** e **Objeto**.
5. Selecionar o **Nº da Planilha**.
6. Conferir a grade **Itens da Medição** (colunas *Item*, *Produto*, *Saldo a Medir*, *Quantidade*,
   *Valor Unitário*, *Valor Total*) e a grade **Rateio**.

**Resultado esperado**
- A competência já medida automaticamente **não** é oferecida para uma segunda medição manual **ou**,
  se for, traz **Nº da Medição** e **Situação da Medição** já preenchidos e o saldo remanescente correto —
  nunca uma medição nova sobre saldo já consumido.
- **Saldo a Medir** de cada item reflete o que a medição automática já consumiu.
- Nenhuma medição duplicada é criada para a mesma competência/planilha/filial.
- Falha de leitura aparece como mensagem tratada, não como tela quebrada.

**Resultado se o defeito reincidir**
- Medição manual é gerada para contrato/competência que já tinha medição automática, produzindo registros
  que precisam de correção manual em massa (foi o que ocorreu, "da linha 210 até a aplicação da correção
  em produção").

**Severidade:** Média

**Preparação de massa:** um contrato vigente com planilha, competência aberta e **medição automática já
executada** naquela competência — depende da rotina agendada; só a equipe da Cassi/TOTVS pode preparar,
porque disparar o batch não é permitido ao executor.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de *Faturamento de Contratos* foi aberto (iframe `256836`) e todos
os campos citados nos passos existem com esses rótulos exatos: **Fornecedor \***, **Nº do Contrato \***,
**Revisão \***, **Filial do Contrato\***, **Competência do Contrato \***, **Filial da Medição \***,
**Tipo do Contrato\***, **Situação do Contrato\***, **Data Início\***, **Data Final\***, **Nº da Medição \***,
**Nº da Planilha \***, **Objeto \***. As grades *Itens da Medição* e *Rateio* estão no DOM, ocultas, e só
aparecem depois de encadear Fornecedor → Contrato → Competência → Filial. Confirmado que a medição
automática é lida por `ds_fatcon_get_medicaoAutomatica` e a manual monta a tela por
`ds_fatcon_get_info_medicoes` (campos `CND_NUMMED`, `CND_SITUAC`, `CND_COMPET`, `CND_DTINIC`).
**Divergências encontradas:** o rótulo "data de medição automática" do ticket **não existe** na tela; o que
existe é **Nº da Medição** + **Competência do Contrato**, e um campo interno `situacaoMedicao` com o valor
de controle `SOLIC_MED`.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2012  (fluig · Concluído)

**Título:** Fiscal seleciona contrato e competência no Faturamento e as informações da medição são carregadas sem erro de API.

**Origem:** FSWTBC-2012 — `SD759754`, erro na API `infomedicao`. Ticket sem descrição do sintoma;
o caso descreve o caminho que consome essa API.

**Módulo/Rota:** *Faturamento de Contratos* → **Informações da Medição** (carga disparada ao completar
Fornecedor → Contrato → Competência → Filial da Medição).

**Pré-condições**
- Contrato vigente com planilha e competência disponível para medir.
- Protheus disponível (`apiRESTProtheus_CASSI`).
- **Bloqueio:** massa — a conta de QA não tem contrato com competência medível reservado; e a chamada só
  ocorre depois de os quatro zooms serem preenchidos com dados reais.

**Passos**
1. Iniciar *Faturamento de Contratos*.
2. Preencher **Fornecedor**, **Nº do Contrato**, **Competência do Contrato** e **Filial da Medição**.
3. Aguardar a carga das **Informações da Medição**.
4. Conferir **Nº da Medição**, **Situação do Contrato**, **Data Início**, **Data Final** e **Objeto**.
5. Repetir a seleção trocando a competência, para forçar nova chamada.

**Resultado esperado**
- A chamada
  `GET /api/public/ecm/dataset/search?datasetId=ds_fatcon_get_info_medicoes&filterFields=CNA_CONTRA,<contrato>,FILIAL_CONTRATO,<filial>,COMPETENCIA_ESCOLHIDA,<competência>,FILIAL_ESCOLHIDA,<filial medição>`
  responde **HTTP 200** com conteúdo.
- Os campos **Nº da Medição**, **Competência**, **Revisão** e situação são preenchidos a partir de
  `CND_NUMMED`, `CND_COMPET`, `CND_REVISA`, `CND_SITUAC`.
- Se o ERP devolver erro, o formulário exibe **mensagem tratada** vinda do próprio retorno
  (o código lança `dataMedicao.response.message.message` quando `content == "ERROR"`), nunca uma tela
  quebrada ou um `undefined` na cara do usuário.
- O nº do contrato é enviado **sem espaços** (`encodeURIComponent(numContrato.trim())`).

**Resultado se o defeito reincidir**
- A carga das informações da medição falha e o processo não avança. Mensagem exata `<não documentado>` —
  o ticket registra apenas "Erro na api infomedicao".

**Severidade:** Média *(bloqueia o fluxo de medição)*

**Preparação de massa:** um contrato vigente, com planilha e competência aberta, atribuído a um fiscal
que possa iniciar o processo. Sem isso o caso morre no passo 2.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário abre e expõe os quatro zooms na ordem citada; confirmado no fonte
que a "api infomedicao" corresponde hoje ao dataset **`ds_fatcon_get_info_medicoes`**, consumido por
`DataHandler.getInfoMedicoes(...)` com tratamento explícito de `status != 200` e de `content == "ERROR"`.
Não foi possível disparar a chamada sem massa de contrato reservada para a conta de QA.
**Divergências encontradas:** o nome "infomedicao" do ticket não aparece em tela nem na URL; o
identificador real é `ds_fatcon_get_info_medicoes`.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2014  (ambos · Concluído)

**Título:** Abrir uma medição e, quando a planilha não existir para a competência escolhida, receber a mensagem do ERP com o detalhe que permita corrigir o cadastro.

**Origem:** FSWTBC-2014 — processo 31580: *"Não há planilha disponível no contrato/competência
selecionados"* ao abrir a medição. A mensagem do Protheus é exemplar (traz submodelo, campo e id:
`CNDMASTER` / `CND_RCCOMP` / `CXNDETAIL` / `CNTA120COMPET`), mas o cliente registrou que "não há nada
de errado no cadastro do contrato" — ou seja, a mensagem está certa e o diagnóstico dela é enganoso.
Fechado no mesmo dia; o mesmo processo 31580 reaparece em FSWTBC-2028 com outros seis.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** → **Início** → seção *Informações da Medição*.
Conferência de apoio: **Acompanhamento de Contratos** → ícone `title="Planilha"` →
modal **"Informações da Planilha"**.

**Pré-condições**
- Contrato vigente e uma competência para a qual **exista** planilha (caminho feliz) e outra para a
  qual **não exista** (caminho de erro).
- **Bloqueio:** a origem da mensagem é o Protheus (`CNTA120`) — **sem credencial** para conferir a
  `CXN`/`CND` do outro lado. Ancorado no Fluig por: (a) o modal **"Informações da Planilha"**, que
  lista as planilhas realmente existentes no contrato; (b) o **Histórico** do processo; (c) o
  **toast** de erro, que **repassa o texto do ERP** (ver *O que foi verificado*).

**Passos**
1. Abrir **Acompanhamento de Contratos**, localizar o contrato e clicar no ícone da coluna **Ação**
   com `title="Planilha"`.
2. No modal **"Informações da Planilha" → Planilhas do Contrato**, anotar quais **Planilha** e
   **Revisão** existem para aquele **Contrato** e **Filial**. Fechar o modal.
3. Abrir **Processos → Iniciar Solicitações → Faturamento de Contratos**.
4. Preencher **Fornecedor**, **Nº do Contrato**, **Revisão**, **Filial do Contrato** e
   **Filial da Medição**.
5. Selecionar em **Competência do Contrato** uma competência **coberta** por planilha e prosseguir.
6. Repetir com uma competência **não coberta**.

**Resultado esperado**
- No passo 5, os campos **Nº da Medição**, **Nº da Planilha** e a grade **Itens da Medição** são
  preenchidos, e o processo movimenta para **Busca Informações do Contrato**, que registra no
  **Histórico** *"Integração executada com sucesso - Tempo de Execução N s"*.
- No passo 6, a aplicação exibe uma mensagem que **inclui o texto devolvido pelo ERP**, permitindo
  identificar contrato, competência e planilha envolvidos — e **não** apenas um erro genérico.
- A mensagem deve deixar claro que se trata de **ausência de planilha para a competência**, e não de
  falha de comunicação.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Ao abrir a medição do processo 31580 aparecia *"Erro ao buscar as informações da medição"* /
  *"Não há planilha disponível no contrato/competência selecionados"*, com os identificadores
  `CNDMASTER`, `CND_RCCOMP`, `CXNDETAIL`, `CNTA120COMPET`, mesmo com o cadastro do contrato correto.

**Severidade:** Média *(bloqueia o fluxo da medição; o dado não é corrompido, mas o diagnóstico exibido induz ao erro)*

**Preparação de massa:** um contrato com **pelo menos uma competência sem planilha** e outra com
planilha. Quem prepara: analista de Contratos da CASSI. **O processo 31580 existe nesta base** e
serve para o caminho feliz (leitura), mas **não deve ser movimentado**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri o processo **31580** em modo leitura — ele existe, está
**finalizado**, e o **Histórico (6)** mostra a cadeia completa e bem-sucedida:
*"Lucas Martinelli de Jesus iniciou a solicitação 31580"* (06/06/2025 08:59:36) →
*"Busca Informações do Contrato — Integração executada com sucesso - Tempo de Execução 7 s"* →
*Aprovação Prévia?* → *Inibir Aprov. Fiscal?* → (11 dias de espera) →
*"Gabriela Lucino Sudre movimentou a atividade Realizar Medição do Contrato para a atividade Gravar
Medição"* (17/06/2025 15:56:52) →
*"Gravar Medição — Integração executada com sucesso - Tempo de Execução 9 s"* → *Pagamento?* →
*"Criar Pedido de Compras — … 20 s"* → *"Notifica Fornecedor — … 1 s"* →
*Fim - Faturamento de Contratos*. **A lacuna de 06/06 a 17/06 parada em "Realizar Medição do
Contrato" é exatamente a janela em que o usuário esteve bloqueado pelo defeito** — e o desfecho em
17/06 é a evidência, no próprio Fluig, de que foi resolvido.
Abri também o modal **"Informações da Planilha"** pelo ícone `title="Planilha"` do Acompanhamento de
Contratos: ele traz **"Planilhas do Contrato"** com as colunas *Filial, Contrato, Planilha, Revisão,
Cod. Fornecedor, Fornecedor, Loja Forn., Ações* — no contrato que abri (`0000-2025-2501-`, filial
2501) há **duas planilhas: 000001 e 000002**. É a superfície que responde "existe planilha?" sem ERP.
Confirmei ainda, no fonte publicado (`fat_App_DataHandler.js`, `getInfoMedicoes`), que o Fluig
**repassa o texto do ERP** ao usuário: quando a resposta contém `"mensagem do erro:"`, a aplicação
monta `Erro ao buscar as informações da medição.</br><b>Mensagem do erro: <texto do ERP></b>` — é
por esse caminho que o detalhe `CNTA120COMPET` chega à tela.
**Divergências encontradas:** o rótulo do ticket ("Não há planilha disponível…") é **texto do
Protheus**, não do Fluig; o texto fixo do Fluig é **"Erro ao buscar as informações da medição."** e o
resto é concatenado. Divergência de robustez, **lida no fonte**: `getInfoMedicoes` **engole a
exceção** (o `catch` só exibe o toast e retorna `undefined`), e o chamador em
`fat_App_EventHandler.js:110` faz `that.dataMedicao.CND_COMPET` logo em seguida — ou seja, após o
erro do ERP ocorre um **TypeError adicional** no console e a tela fica em estado inconsistente. Isso
explica por que o sintoma aparecia como "erro ao abrir o processo", e não como um aviso de cadastro.
**Dados/massa usados:** leitura do processo 31580 e do contrato `0000-2025-2501-` (filial 2501). Nada submetido.

---

## CT-FSWTBC-2024  (fluig · Concluído)

**Título:** Fiscal confere que o valor unitário da medição no Fluig é idêntico ao do contrato, sem truncar casas decimais.

**Origem:** FSWTBC-2024 — `SD764325`: medição feita pelo Fluig truncando casas decimais no valor unitário.

**Módulo/Rota:** *Faturamento de Contratos* → grade **Itens da Medição** (colunas *Item*, *Produto*,
*Saldo a Medir*, *Quantidade*, *Valor Unitário*, *Valor Total*). Conferência do contrato em
*Acompanhamento de Contratos* → ícone *Planilha* / modal **Informações Complementares do Contrato** →
grupo **Valores Financeiros**.

**Pré-condições**
- Contrato cujo item tenha **valor unitário com mais de duas casas decimais** (ex.: `1,234567`) — é o
  cenário que expõe o truncamento.
- Competência aberta e saldo a medir > 0.
- **Bloqueio:** massa — depende de contrato com valor unitário fracionário e competência medível; não
  disponível para a conta de QA.

**Passos**
1. No Protheus (ou no modal do contrato, grupo *Valores Financeiros*), anotar o **valor unitário** do item
   do contrato com **todas** as casas decimais.
2. Iniciar *Faturamento de Contratos* e selecionar Fornecedor → Contrato → Competência → Filial da Medição
   → Nº da Planilha.
3. Na grade **Itens da Medição**, comparar **Valor Unitário** com o anotado no passo 1.
4. Lançar uma **Quantidade** fracionária (ex.: `1,5`) e conferir o **Valor Total** calculado.
5. Conferir o total da medição e, se houver, os valores replicados no **Rateio**.

**Resultado esperado**
- **Valor Unitário** é exibido com **6 casas decimais** (`listDecimal.default = 6`), idêntico ao valor do
  contrato — sem arredondar nem cortar para 2 casas.
- **Quantidade** também é normalizada com 6 casas (`0.000000` quando ausente), e **Valor Total** =
  quantidade × valor unitário calculado sobre o valor **não truncado**.
- **Valor Atual do Contrato** e **Saldo do Contrato** são formatados com a mesma precisão de 6 casas.
- Nenhum item exibe `NaN` nem valor zerado por falha de conversão.

**Resultado se o defeito reincidir**
- O valor unitário aparece truncado na medição (ex.: `1,23` no lugar de `1,234567`), e o valor total da
  medição diverge do contrato.

**Severidade:** Alta *(risco financeiro direto — medição gera pré-nota)*

**Preparação de massa:** contrato com item de valor unitário com 3+ casas decimais, competência aberta e
saldo a medir. Precisa vir da equipe de Contratos: a conta de QA não consegue criar contrato (ver
`docs/criacao-de-contrato-inviavel.md`).

**Verificado em tela:** PARCIAL
**O que foi verificado:** a grade **Itens da Medição** existe no formulário (campos ocultos `item`,
`codProduto`, `produto`, `saldoMedirQtd`, `quantidade`, `valorUnitario`, `valorDesconto`,
`valorTotalItens`) e só é exibida após o encadeamento dos zooms. Confirmado no fonte que o valor unitário
é escrito com `numberToCurrencyFormat(item.CNE_VLUNIT, false, 6)`, a quantidade com `toFixed(6)` e os
valores do contrato com `parseFloat(CN9_VLINI).toFixed(6)` / `parseFloat(CN9_SALDO).toFixed(6)` — ou seja,
a precisão de 6 casas está aplicada hoje. Sem massa, os valores não puderam ser comparados em tela.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2026  (fluig · Concluído)

**Título:** Fiscal localiza o fornecedor pelo nome na busca da medição manual e ele aparece na lista.

**Origem:** FSWTBC-2026 — o fornecedor *"A + DIGITAL INFORMATICA E PAPELARIA / A + DIGITAL"* não aparecia
na busca da medição manual.

**Módulo/Rota:** *Faturamento de Contratos* → campo **Fornecedor \*** (zoom).

**Pré-condições**
- Fornecedor cadastrado no Protheus, **com contrato vigente** — o zoom é alimentado pelo cadastro do ERP.
- Fornecedor cujo nome contenha caractere especial (`+`) e cujo nome fantasia difira da razão social —
  é a característica do caso relatado.
- **Bloqueio:** parcial — o zoom abre e busca, mas não há como confirmar a completude da lista sem
  acesso ao cadastro do Protheus para saber quais fornecedores **deveriam** constar.

**Passos**
1. Iniciar *Faturamento de Contratos*.
2. Clicar no campo **Fornecedor \*** para abrir a busca.
3. Digitar um trecho do **nome** do fornecedor (ex.: `DIGITAL`) e aguardar o retorno.
4. Repetir a busca digitando o **CNPJ** do mesmo fornecedor.
5. Repetir digitando um trecho com o caractere especial (ex.: `A +`).
6. Selecionar o fornecedor e conferir se **Nº do Contrato** passa a ser habilitado e recarregado.

**Resultado esperado**
- O fornecedor é listado nas três formas de busca (nome, CNPJ e trecho com caractere especial).
- A busca é feita sobre `A2_NOMECGC` (nome + CNPJ concatenados) e devolve as colunas `A2_NOMECGC`,
  `A2_COD`, `A2_LOJA`, `A2_NOME`, `A2_CGC`, `A2_EMAIL`.
- Ao selecionar, os campos internos de código, loja, CNPJ e e-mail do fornecedor são preenchidos, e o zoom
  **Nº do Contrato** é habilitado e recarregado filtrando por `CGCFORNECEDOR`.
- Nenhum fornecedor com contrato vigente fica fora da lista por causa do nome.

**Resultado se o defeito reincidir**
- O fornecedor não aparece na busca da medição manual, mesmo existindo no ERP com contrato vigente
  (relato original com "A + DIGITAL INFORMATICA E PAPELARIAA + DIGITAL", nome e nome fantasia
  concatenados).

**Severidade:** Média *(bloqueia a medição daquele fornecedor)*

**Preparação de massa:** conhecer previamente, no Protheus, **o CNPJ e a razão social exatos** de um
fornecedor com contrato vigente e nome com caractere especial — sem esse par de referência não há como
afirmar que a lista está incompleta.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o campo **Fornecedor \*** abre a busca e dispara
`GET /ecm/api/rest/ecm/dataset/datasetZoom/{"searchField":"A2_NOMECGC","filterFields":[],"resultFields":["A2_NOMECGC","A2_COD","A2_LOJA","A2_NOME","A2_CGC","A2_EMAIL"],"datasetId":"dsProtheus_getFornecedores_restGetAll"}?limit=300&offset=0&orderby=A2_CGC_ASC&pattern=<termo>`
— confirmado com os termos `A +`, `DIGITAL` e `ANA CARLA`. A requisição sai com o `pattern` correto e sem
erro HTTP. A grade de resultados, porém, não exibiu nenhuma linha dentro de ~9 s de espera (só o cabeçalho
*Filtrar colunas*), então **não foi possível confirmar em tela que o fornecedor é listado**.
**Divergências encontradas:** dois pontos relevantes para quem for executar — (a) a busca é feita sobre o
campo **concatenado** `A2_NOMECGC`, o que explica o nome duplicado que aparece no título do ticket;
(b) a chamada usa `limit=300` com `orderby=A2_CGC_ASC`, de modo que um fornecedor além dos 300 primeiros
resultados do padrão pode simplesmente não ser exibido — é o mecanismo mais provável de "não aparece na
busca" e deve ser exercitado com termo curto (muitos resultados) e termo específico.
**Dados/massa usados:** nenhum — apenas buscas de leitura no zoom; nada selecionado, nada submetido.

---

## CT-FSWTBC-2028  (ambos · Concluído · SDCASSI-1)

**Título:** Abrir a medição de um contrato cuja filial de medição é diferente da filial do contrato e ver as informações da medição carregarem de forma estável.

**Origem:** FSWTBC-2028 — sete processos (31580 a 31586) com *"Erro ao buscar as informações da
medição — não há planilha disponível"*. Diagnóstico de infraestrutura: o endpoint
`/api/v1/fluig/compras/contrato/medicao/infoMedicao/{contrato}/{competencia}` falhava na porta 11005
e **funcionava na 13503** do mesmo servidor — "o RPO voltou", regressão de RPO em produção. O erro
era **intermitente**, o que atrasou o diagnóstico. O teste do analista usou valores reais:
**E01-2025-2101, competência 06-2025, filial do contrato 2101 e filial escolhida 2701** — a
divergência entre as duas filiais é parte do problema. Primeiro ticket vinculado ao SDCASSI.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** → seção *Informações da Medição*
(**Filial do Contrato** × **Filial da Medição**).
Conferência: **Tracker** → **Faturamento de Contratos**.

**Pré-condições**
- Contrato cuja medição seja feita por uma **filial diferente** da filial do contrato.
- Competência com planilha vinculada.
- Serviço REST do Protheus no ar.
- **Bloqueio:** a causa-raiz (RPO/porta do broker REST) é de **infraestrutura do Protheus** e não é
  verificável nem corrigível pelo Fluig — **sem credencial** e fora do alcance do front-end.
  Ancorado no Fluig por: (a) o **Tracker**, que expõe **Código da Filial** e **Código da Filial
  Medição** em colunas separadas, permitindo achar exatamente os casos de filial divergente; (b) o
  **Histórico**, que registra o sucesso ou a falha de **Busca Informações do Contrato**.

**Passos**
1. Abrir o **Tracker**, escolher **Faturamento de Contratos** e pesquisar sem filtro de processo,
   ou filtrando por **Filial Contrato** e **Filial Medição** diferentes entre si.
2. Anotar um par real: **Nº Contrato**, **Competência do Contrato**, **Código da Filial** e
   **Código da Filial Medição**.
3. Abrir **Processos → Iniciar Solicitações → Faturamento de Contratos**.
4. Preencher **Fornecedor**, **Nº do Contrato**, **Revisão** e **Filial do Contrato** com a filial
   do contrato (ex.: 2101).
5. Preencher **Filial da Medição** com a filial **diferente** (ex.: 2701).
6. Selecionar **Competência do Contrato** (ex.: 06-2025) e a **Nº da Planilha**.
7. Repetir o passo 6 **três vezes seguidas**, para expor a intermitência relatada.
8. Reabrir a solicitação em modo leitura e conferir a aba **Histórico**.

**Resultado esperado**
- Os campos **Nº da Medição**, **Nº da Planilha**, **Competência** e a grade **Itens da Medição**
  carregam corretamente **mesmo quando a Filial da Medição difere da Filial do Contrato**.
- O resultado é **o mesmo nas três repetições** do passo 7 — sem intermitência.
- O **Histórico** registra *"Busca Informações do Contrato — Integração executada com sucesso -
  Tempo de Execução N s"*.
- Nenhuma mensagem *"Erro ao buscar as informações da medição."* é exibida.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- *"Erro ao buscar as informações da medição."* seguido de *"não há planilha disponível"*, de forma
  **intermitente**, nos processos 31580 a 31586 — chamando o endpoint
  `/api/v1/fluig/compras/contrato/medicao/infoMedicao/{contrato}/{competencia}`.

**Severidade:** Alta *(sete processos de faturamento bloqueados simultaneamente em produção; risco financeiro por medição não realizada na competência)*

**Preparação de massa:** um contrato com **Filial do Contrato ≠ Filial da Medição** e competência com
planilha. **Esta massa JÁ EXISTE nesta base e foi localizada** — ver abaixo. Quem prepara: ninguém,
para a parte de leitura; para executar de fato uma medição nova é preciso um analista de Contratos da CASSI.

**Verificado em tela:** PARCIAL
**O que foi verificado:** este é o caso mais bem ancorado do lote. Pesquisei no **Tracker**, tipo
**Faturamento de Contratos**, o **Nº do Processo Fluig = 31580**, e ele retornou **uma linha** com
exatamente os valores do ticket:
**Nº Contrato `E01-2025-2101`**, **Competência do Contrato `06-2025`**, **Código da Filial `2101`**,
**Código da Filial Medição `2701 - UNIDADE - CLINICASSI MACEIO - AL`**, **Nº Medição `000065`**,
**Nº Planilha `000001`**, Status **FINALIZADA**, Atividade Atual **Fim - Faturamento de Contratos**,
Solicitante *Lucas Martinelli de Jesus*, Fornecedor *EFICAZ SERVICOS E MANUTENCAO EIRELI*, Fiscal de
Serviço *cristiane.rsantos@cassi.com.br*, Fiscal de Contrato *tatiana.cecilio@cassi.com.br*.
**A divergência de filial descrita no ticket (contrato 2101 × medição 2701) é visível no Fluig, em
duas colunas dedicadas do Tracker** — não é preciso o Protheus para localizar e conferir o cenário.
Abri também o **Histórico** do 31580, que mostra a cadeia inteira concluída com sucesso (ver
CT-FSWTBC-2014), o que evidencia, dentro do Fluig, que o caso foi resolvido.
Confirmei no fonte publicado que o Fluig consulta a medição pelo dataset
**`ds_fatcon_get_info_medicoes`**, com os filtros
`CNA_CONTRA`, **`FILIAL_CONTRATO`**, `COMPETENCIA_ESCOLHIDA` e **`FILIAL_ESCOLHIDA`**
(`fat_App_DataHandler.js:83`) — as duas filiais são parâmetros distintos da mesma chamada, o que
confirma que a divergência de filial é tratada explicitamente.
**Divergências encontradas:** o endpoint citado no ticket
(`/api/v1/fluig/compras/contrato/medicao/infoMedicao/...`) **não aparece no front-end**; o que o
formulário chama é o dataset `ds_fatcon_get_info_medicoes` — a chamada REST ao Protheus acontece
**dentro do dataset, server-side**. Quem for reproduzir deve monitorar o dataset, não o endpoint.
Segunda divergência: quando os quatro campos não estão preenchidos, a mensagem exibida é
*"Verifique o preenchimento dos campos Nº Contrato, Competência do Contrato, Código da Filial e Cód.
Filial Medição (Selecionando a Planilha)!"* — que cita **"Cód. Filial Medição"**, enquanto o rótulo
do formulário é **"Filial da Medição"**. Nomes diferentes para o mesmo campo, na mesma tela.
**Dados/massa usados:** consulta de leitura no Tracker (processo 31580) e leitura do histórico. Nenhuma escrita.

---

## CT-FSWTBC-2032  (fluig · Concluído)

**Título:** Contrato cujo código contém espaço gera medição automática normalmente.

**Origem:** FSWTBC-2032 — contrato "172 B", gerado **com espaço** no código, não gerou medição
automática (processos 31915 e 31916).

**Módulo/Rota:** *Faturamento de Contratos* → **Nº do Contrato** / rotina de medição automática
(dataset `ds_fatcon_get_medicaoAutomatica`). Conferência do código do contrato em *Acompanhamento de
Contratos* → **Informações do Contrato** → **Número do Contrato**.

**Pré-condições**
- Contrato vigente cujo **código contenha espaço** (ex.: `172 B`) ou espaços à direita.
- Competência aberta e planilha com saldo.
- **Bloqueio:** **sim** — a geração automática é rotina agendada e **não pode ser disparada** nesta
  rodada; e não foi localizado, na base acessível, contrato com espaço no código.

**Passos**
1. Em *Acompanhamento de Contratos*, localizar o contrato e abrir **Informações do Contrato**; anotar o
   **Número do Contrato** exatamente como gravado, inclusive espaços.
2. Aguardar (ou solicitar) a execução da medição automática da competência.
3. Iniciar *Faturamento de Contratos*, selecionar o **Fornecedor** e abrir o zoom **Nº do Contrato**.
4. Selecionar o contrato com espaço no código e seguir para **Competência do Contrato** e **Filial da
   Medição**.
5. Conferir se **Nº da Medição** é preenchido e se a grade **Itens da Medição** carrega.

**Resultado esperado**
- O contrato com espaço aparece no zoom **Nº do Contrato** e pode ser selecionado.
- A medição automática é gerada para ele, como para qualquer outro contrato.
- As consultas ao ERP enviam o código **sem espaços de borda** — todas as chamadas usam
  `encodeURIComponent(numeroDoContrato.trim())` (`ds_fatcon_get_medicaoAutomatica`,
  `ds_fatcon_get_info_medicoes`, `ds_fatcon_get_competencia`, `dsProtheus_getContratos_restGetAll`,
  `dsProtheus_getRateiosContratos_restGetAll`).
- **Itens da Medição** e **Rateio** carregam; nenhuma medição fica pendente por causa do código.

**Resultado se o defeito reincidir**
- Nenhuma medição automática é gerada para o contrato com espaço no código (relato: contrato "172 B",
  processos 31915 e 31916 parados).

**Severidade:** Média

**Preparação de massa:** um contrato vigente com espaço no código (ou com espaço à direita), competência
aberta e planilha com saldo — criado pela equipe de Contratos no Protheus. A execução da rotina automática
precisa ser agendada/solicitada por quem administra o ambiente.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o zoom **Nº do Contrato** existe e só é habilitado após a escolha do fornecedor
(recarregado com o filtro `CGCFORNECEDOR`). Confirmado no fonte do formulário que **todas** as consultas
por número de contrato aplicam `.trim()` antes de montar a URL, e que o valor lido do zoom também é
`.trim()`-ado (`getElementValue("zoomNumContrato").trim()`) — a normalização está aplicada hoje. No modal
**Informações Complementares do Contrato** o campo **Número do Contrato** foi observado com o valor
`0000-2025-2501-`, mostrando que a tela exibe o código bruto, com os separadores/lacunas do ERP.
**Divergências encontradas:** não foi localizado, nas 845 linhas da grade de contratos, nenhum contrato
com espaço interno no código como o "172 B" do ticket — a massa do defeito não existe mais na base
acessível.
**Dados/massa usados:** nenhum — apenas leitura; nenhuma rotina disparada.

---

## CT-FSWTBC-2074  (fluig · Concluído · SDCASSI-9)

**Título:** Aprovador abre a medição de contrato para aprovar e a tela carrega sem erro de JavaScript.

**Origem:** FSWTBC-2074 — `765975`: erro ao aprovar medição de contrato,
`TypeError: Cannot read properties of undefined (reading 'item')`, nos processos 33749 e 33809. O erro
chegava cru ao usuário. Aplicado pela MUD15897.

**Módulo/Rota:** *Faturamento de Contratos* → etapas **Validação CSE**, **Validação da Medição CSE** e
**Validação do Fiscal de Contrato**.

**Pré-condições**
- Medição enviada, parada em uma das três etapas de validação.
- Executor sendo o **Aprovador CSE** / **Fiscal de Serviço** / **Fiscal de Contrato** daquela medição.
- **Bloqueio:** **sim** — não há medição sob responsabilidade da conta de QA (as 11 tarefas a concluir são
  SCs e cotações, nenhuma medição), e aprovar alteraria registro de terceiros.

**Passos**
1. Na **Central de Tarefas**, abrir a tarefa de validação da medição.
2. Conferir que a tela carrega as **Informações da Medição** e a grade **Itens da Medição** com valores.
3. Abrir o console do navegador e conferir que não há exceção durante a carga.
4. Preencher **Aprovar? = Sim** e a **Justificativa**, e concluir a movimentação.
5. Repetir com **Aprovar? = Não** em outra medição, informando a justificativa.
6. Repetir o passo 1 em uma medição **sem itens** ou com planilha incompleta (é o cenário que quebrava).

**Resultado esperado**
- A tela de validação carrega íntegra: bloco de responsável (**Aprovador**, **Email do Aprovador**,
  **Data**/**Hora da Aprovação**), **Aprovar?** (Sim/Não) e **Justificativa**.
- **Nenhuma** exceção de JavaScript no console; em especial, nenhum
  `TypeError: Cannot read properties of undefined (reading 'item')`.
- Com dados ausentes/incompletos, a tela exibe **mensagem tratada** (ex.: *"Erro ao buscar as informações
  de Rateios da Planilha do Contrato. Por favor, tente novamente."*) em vez de estourar exceção.
- Aprovando, a medição segue para a etapa seguinte; reprovando, retorna para ajuste com a justificativa
  registrada e **sem** gerar pré-nota.

**Resultado se o defeito reincidir**
- Ao abrir/aprovar a medição, o usuário vê `TypeError: Cannot read properties of undefined (reading
  'item')` e o processo não avança (relato: processos 33749 e 33809).

**Severidade:** Alta *(trava a aprovação de medição, que é etapa financeira)*

**Preparação de massa:** uma medição enviada e parada em **Validação CSE**, com o executor como aprovador;
e, para o passo 6, uma medição cuja planilha de rateio esteja incompleta — provavelmente precisa ser
montada em ambiente de homologação pela equipe de Contratos.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no formulário de *Faturamento de Contratos* existem, ocultos, os três blocos de
validação com os campos `validCSE_responsavel`, `validCSE_emailResponsavel`, `validCSE_dataValidacao`,
`validCSE_horaValidacao`, `aprovacaoCSESim`/`aprovacaoCSENao`, `validCSE_justificativa` e os equivalentes
`validMed_*` (com **Enviar para**) e `validFiscal_*` — confirmando as três etapas de validação descritas.
Na etapa de início, o formulário carregou **sem nenhum erro de console** além do `404` conhecido do
`logo_image.png`. Nenhuma medição está sob responsabilidade desta conta, então a etapa de aprovação não
pôde ser aberta.
**Divergências encontradas:** o ticket cita "aprovar medição" genericamente; a tela tem **três** etapas de
validação distintas (**Validação CSE**, **Validação da Medição CSE**, **Validação do Fiscal de Contrato**),
e o caso precisa ser executado nas três.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2131  (ambos · Concluído · SDCASSI-20)

**Título:** Subir a planilha de rateio de uma medição com percentuais de duas casas decimais e ver o total fechar 100% sem exigir precisão artificial.

**Origem:** FSWTBC-2131 — o upload da planilha de rateio pedia a configuração de **8 casas decimais**,
dificultando a conferência do total do rateio (100%). Versão corrigida do que foi cancelado em
FSWTBC-2129. A subtarefa 2140 registra a dependência: aguardava a MUD do `UGCTE001.data.tlpp` "que
trata do sequencial do item no rateio" — ou seja, o problema estava acoplado ao do `CNZ_ITEM`
alfanumérico (FSWTBC-1893/1894).

**Módulo/Rota:** Fluig → **Faturamento de Contratos** → **Realizar Medição do Contrato** → seção de
**Rateio** → **Download Planilha de Rateio Modelo** / **Upload Planilha de Rateio Preenchida**.

**Pré-condições**
- Medição aberta em **Realizar Medição do Contrato**, com itens carregados na grade **Itens da Medição**.
- Um item cujo rateio se distribua em **3 centros de custo**, cenário em que 100/3 não é exato — é
  a fronteira que expõe o problema de precisão.
- **Bloqueio:** nenhum para a validação em tela, que é **inteiramente client-side**. A gravação
  final na `CNZ` do Protheus exige o ERP — **sem credencial**; ancorado no **Histórico** (atividade
  **Gravar Medição**). Exercitar o upload exige uma medição aberta atribuída ao executor, que esta
  rodada não possui, e a regra §2 proíbe usar medição alheia.

**Passos**
1. Abrir a medição na atividade **Realizar Medição do Contrato**.
2. Informar a **Quantidade** de um item.
3. Clicar em **Download Planilha de Rateio Modelo** e abrir o arquivo baixado.
4. Preencher **3 linhas de rateio** para o mesmo item, com percentuais de **duas casas decimais**
   que somem 100 — por exemplo `33,33`, `33,33` e `33,34`.
5. Salvar a planilha **no formato aceito pelo campo de upload** (ver Divergências) e clicar em
   **Upload Planilha de Rateio Preenchida**.
6. Observar a validação do total e a coluna **% Rateio** da grade de rateio.
7. Repetir com `33,33` / `33,33` / `33,33` (soma 99,99) e observar a crítica.
8. Repetir com `50,00` / `50,00` / `10,00` (soma 110) e observar a crítica.

**Resultado esperado**
- No passo 6, o rateio com **duas casas decimais** somando 100 é **aceito**, sem exigir que o usuário
  informe 8 casas decimais.
- O valor exibido na coluna **% Rateio** é apresentado com precisão **legível para conferência**
  (2 casas), não com 8 casas.
- No passo 7, a crítica indica claramente que falta percentual para fechar 100% no item.
- No passo 8, a crítica indica claramente que o item ultrapassou 100%.
- As mensagens **nomeiam o item** e o **percentual informado**, permitindo corrigir sem adivinhação.
- Após corrigir, a movimentação para **Gravar Medição** conclui e o **Histórico** registra
  *"Integração executada com sucesso - Tempo de Execução N s"*.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O upload da planilha de rateio exigia percentuais com **8 casas decimais** para que o total
  fechasse exatamente 100%, tornando a conferência manual do rateio inviável.

**Severidade:** Média *(não corrompe dado, mas inviabiliza a conferência do rateio contábil e induz erro de digitação em campo com efeito financeiro)*

**Preparação de massa:** uma medição em **Realizar Medição do Contrato** com um item rateado em
**3 centros de custo**. Quem prepara: analista de Contratos da CASSI, ou o próprio executor se tiver
uma medição própria em aberto. **O caso não exige o Protheus** para a parte que interessa — a
validação de 100% é client-side.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei no formulário os botões da seção de rateio — **Download Planilha
de Rateio Modelo**, **Upload Planilha de Rateio Preenchida**, **Adicionar Rateio**, **Remover Todos
os Rateios** — e a coluna **% Rateio** da grade `tblRateio`. Confirmei as mensagens literais de
validação, lidas no fonte publicado. Na validação síncrona (`fat_App_ViewHandler.js:929-931`):
*"A soma dos percentuais de rateio não podem ultrapassar o limite de 100%. Por favor, verifique o
item `<item>`, pois foram informados (`<X>`%)."* e
*"A soma dos percentuais de rateio não podem ser inferior a 100%. Por favor, verifique o item
`<item>`, pois foram informados apenas (`<X>`%)."*. No Web Worker (`fat_App_WorkerHandler.js`), as
mensagens são outras: *"A soma dos percentuais de rateio não pode ultrapassar 100% para o item
`<item>`. Foram informados `<X>`%."* e *"A soma dos percentuais de rateio deve ser igual a 100% para
o item `<item>`. Foram informados apenas `<X>`%`<e preencha os campos vazios.>`"*.
**Divergências encontradas:** três, e a primeira é o achado central deste caso:
(1) **as 8 casas decimais continuam no fonte publicado.** Em **dois** lugares:
`fat_App_EventHandler.js:23` e `fat_App_ViewHandler.js:24`, ambos com
`this.listDecimal = { rateio: 8, default: 6 };`. E o valor é usado exatamente onde dói: a validação
faz `parseFloat(rateio.toFixed(8))` e compara com **igualdade estrita** contra 100 — `> 100` reprova
e `< 100` reprova. Com 8 casas de precisão e comparação exata, um rateio de `33,33 + 33,33 + 33,34`
fecha, mas qualquer arredondamento a menos (ex.: `99,99999999`) é **reprovado**. O mesmo `8` é
passado ao Web Worker (`listDecimal.rateio`) e ao formatador de exibição
(`handleParsePercent → parsed.toFixed(8)`). **O ticket está fechado como corrigido, mas o front-end
publicado hoje ainda opera com `rateio: 8`.** Como a subtarefa 2140 indica que a correção foi na MUD
do `UGCTE001.data.tlpp` (server-side), é plausível que o lado Fluig nunca tenha sido alterado —
registro isto como **ponto a reconferir com o time**, não como afirmação de que o defeito voltou.
(2) **duas famílias de mensagem para a mesma regra**, com textos diferentes (a síncrona diz *"não
podem ultrapassar o limite de 100%"*, a do Worker diz *"não pode ultrapassar 100%"*), o que dificulta
padronizar a evidência do teste. A síncrona ainda tem erro de concordância (*"a soma … não podem"*).
(3) **o upload de rateio aceita apenas `.csv`** (`<input type="file" id="fl_planilha" accept=".csv">`),
enquanto o upload de itens da medição aceita `.xlsx` (`fl_planilhaMedi`). O passo 5 precisa respeitar
isso; um `.xlsx` de rateio sequer é selecionável. Mensagens relacionadas existentes:
*"Planilha não contém linhas de dados!"*, *"Nenhum arquivo selecionado!"*,
*"percentual de rateio inválido (zerado ou em branco)"* e
*"campos obrigatórios ausentes (item, centro de custo ou classe de valor)"*.
**Dados/massa usados:** nenhum — nenhuma planilha foi carregada, nenhuma medição aberta em edição.

---

## Resumo do lote

| # | Caso | Verificado | Severidade | Bloqueio principal |
|---|---|---|---|---|
| 1 | CT-FSWTBC-1760 | PARCIAL | Média | massa (competência já medida) + não submetido |
| 2 | CT-FSWTBC-1790 | PARCIAL | Média | sem credencial de gestor |
| 3 | CT-FSWTBC-1893 | PARCIAL | Alta | massa (>99 rateios no mesmo item) + sem ERP |
| 4 | CT-FSWTBC-1903 | PARCIAL | Alta | massa (contrato ~300 itens) + sem ERP |
| 5 | CT-FSWTBC-1933 | PARCIAL | Alta | rotina batch (proibida) + sem ERP |
| 6 | CT-FSWTBC-2014 | PARCIAL | Média | massa (competência sem planilha) + sem ERP |
| 7 | CT-FSWTBC-2023 | PARCIAL | Alta | **sem credencial de comprador** + ação destrutiva |
| 8 | CT-FSWTBC-2028 | PARCIAL | Alta | causa é infraestrutura do Protheus |
| 9 | CT-FSWTBC-2038 | PARCIAL | Alta | rotina batch + lista de referência só no ERP |
| 10 | CT-FSWTBC-2053 | PARCIAL | Alta | exige aprovador para rejeitar a SC |
| 11 | CT-FSWTBC-2080 | PARCIAL | Alta | **sem credencial de fornecedor nem de comprador** |
| 12 | CT-FSWTBC-2106 | PARCIAL | Alta | exige posto de gestor vago (só no ERP) |
| 13 | CT-FSWTBC-2130 | PARCIAL | Alta | chamada server-side, não observável no navegador |
| 14 | CT-FSWTBC-2131 | PARCIAL | Média | exige medição própria em aberto |

### Casos sem superfície de front-end para parte do efeito

Declarados explicitamente, conforme o §5-B, em vez de simular cobertura:

- **CT-FSWTBC-2038** — o **dia de medição configurado do contrato** (a causa-raiz: `CNA_XDTMED`
  zerado ou em branco) **não é exibido em nenhuma tela do Fluig**, nem no modal *Informações
  Complementares do Contrato*, que traz 70+ campos e uma seção inteira de *Datas*. O Tracker prova
  *que* o contrato não mediu; **nada no front-end explica *por quê***.
- **CT-FSWTBC-1903** — o **formulário de Faturamento/Medição não possui nenhum campo de erro de
  integração** (zero rótulos com "ERP"/"Integração" em `form_fat.html`, contra 5 na SC e 2 na
  Cotação). Uma falha transacional só aparece como *toast* efêmero e no **Histórico**; não há
  registro persistente na tela do processo.
- **CT-FSWTBC-2130** — a chamada que decide o gestor imediato é **server-side** (evento de workflow).
  Não há `superiorColaborador` em nenhum fonte publicado do front-end, logo **a evidência do
  não-determinismo não é coletável pelo navegador** — exige o log do servidor Fluig.
- **CT-FSWTBC-1933** — o Fluig expõe a *consequência* (as competências oferecidas no zoom, servidas
  pelo dataset `ds_fatcon_get_medicaoAutomatica`), mas **não a configuração** que o ticket discute
  (CN9 × CNA). A cobertura é indireta, por diferença.

Nenhum outro caso do lote ficou totalmente sem âncora: os 10 restantes têm ao menos uma das quatro
superfícies do §5-B confirmada em tela.

## CT-FSWTBC-2142  (fluig · Concluído/Não será feito · SDCASSI-22)

**Título:** O fiscal encerra uma medição cujo rateio fecha 100% e o encerramento é aceito, sem falha de soma em ponto flutuante.

**Origem:** FSWTBC-2142 (SD767360) — falha ao encerrar a medição porque *"a soma dos rateios **em
ponto flutuante** não atinge os 100%"*. Quarta ocorrência do mesmo problema numérico na conta
(1651, 1707, 1906, 2142). Resolvido pelo patch de outro chamado (SD764752) — correção acoplada.

**Módulo/Rota:** *Faturamento de Contratos* (`/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos`)
→ **Itens da Medição** → **Rateio Contábil** (`#tabRateio`) → **Validação da Medição do Contrato
CSE** → campo **Direcionar Processo para \***.

**Pré-condições**
- Medição própria montada, com **Fornecedor \***, **Nº do Contrato \***, **Competência do Contrato \***
  e **Filial da Medição \*** preenchidos pelos zooms do Protheus (a seção *Itens da Medição* e o
  *Rateio* só aparecem depois dessa cadeia).
- Rateio com percentuais que somam 100% **apenas em aritmética exata** — ex.: `33,33333333` ×2 +
  `33,33333334`, ou sete linhas de `14,28571429`/`14,28571426`.
- **Bloqueio:** **sim.** (a) Encerrar medição é escrita irreversível em processo real — vedado.
  (b) Montar a massa exige o encadeamento Fornecedor → Contrato → Competência → Filial contra o
  Protheus, e não há medição própria disponível. (c) O Protheus da conta cai com frequência; zoom
  vazio é instabilidade de ambiente, não defeito.

**Passos**
1. Abrir `/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos`.
2. Preencher, na ordem, **Fornecedor \***, **Nº do Contrato \***, **Competência do Contrato \*** e
   **Filial da Medição \*** — os zooms do Protheus. Conferir que **Itens da Medição** passa a
   aparecer.
3. Em **Itens da Medição**, informar **Quantidade \*** e conferir **Valor Unitário \***,
   **Valor Desconto \*** e **Valor Total \***.
4. Abrir **Rateio Contábil** e lançar as linhas com os percentuais de dízima (**% Rateio \***,
   **Centro de Custo \***, **Classe de Valor \***), via **Adicionar Rateio** ou pelo upload.
5. Responder **Houve Prestação de Serviço? \*** e preencher **Observações \***.
6. Em **Validação da Medição do Contrato CSE**, escolher **Direcionar Processo para \*** e
   **Enviar** — encerrando a medição.

**Resultado esperado**
- O encerramento é **aceito**: a soma `33,33333333 + 33,33333333 + 33,33333334` é reconhecida como
  100% e o processo avança.
- **Não** aparece *"A soma dos percentuais de rateio não pode ser inferior a 100%."* nem
  *"A soma dos percentuais de rateio não pode ultrapassar 100%."*
- A comparação é feita sobre o valor **arredondado a 8 casas** (`toFixed(8)`), não sobre o
  acumulador binário cru — é isso que impede o `99.99999999999999` de reprovar.
- A aba **Histórico** registra o encerramento com o responsável e o horário.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Ao encerrar, a medição é recusada com a crítica de que os rateios diferem de 100%, mesmo com a
  planilha somando 100% na conferência manual. A soma em ponto flutuante não atinge os 100%.

**Severidade:** Alta *(rateio é a base do lançamento contábil da medição; bloqueia o faturamento)*

**Preparação de massa:** uma medição em nome do executor, sobre um contrato vigente com planilha e
saldo a medir, com competência aberta — **e** um rateio de dízima em ao menos 3 centros de custo.
Nada disso é criável pela conta de QA sem escrever em processo real. Quem prepara: fiscal de
contrato / CSE, no ambiente de homologação.

**Verificado em tela:** PARCIAL
**O que foi verificado:** O formulário `256836` (**Faturamento de Contratos**) abre e traz as seções
*Identificação do Processo/Solicitante*, *Informações da Medição*, *Itens da Medição*,
*Validação do CSE - (Centro de Serviços Especializados)*, *Validação da Medição do Contrato CSE* e
*Validação do Fiscal de Contrato*. Revelando o DOM oculto, a grade `tblItensMedicao` tem as colunas
*Item \**, *Cod. Produto \**, *Desc. Produto \**, *Saldo a Medir \**, *Quantidade \**,
*Valor Unitário \**, *Valor Desconto \**, *Valor Total \**; e `tblRateio` tem *Item \**, *% Rateio \**,
*Centro de Custo \**, *Classe de Valor \**. O combo `validMed_enviarPara` (**Direcionar Processo
para \***) tem as opções *Fiscal de Serviço*, *Fiscal de Contrato*, *Cancelar Medição*. A mitigação
do ponto flutuante **está no código servido hoje**: `listDecimal.rateio = 8` e a comparação
`parseFloat(rateio.toFixed(that.listDecimal.rateio)) > 100 / < 100` em `App/ViewHandler.js`
(linhas 928–931), com as mensagens transcritas acima.
**Divergências encontradas:** o ticket diz "Encerrar a Medição"; na tela **não existe** botão
"Encerrar". O encerramento se dá pelo combo **Direcionar Processo para \*** seguido de **Enviar** —
e a opção mais próxima de "encerrar" é *Cancelar Medição*. Rótulo do ticket ≠ rótulo da tela.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2244  (fluig · Concluído · SDCASSI-41)

**Título:** Ao subir a planilha de rateio, o usuário é avisado na hora se o percentual não fecha 100% — não só quando tenta gravar a medição.

**Origem:** FSWTBC-2244 (SD769413) — na **PRD** a planilha de rateio não acusava erro de percentual
no momento do upload, só depois da tentativa de gravar a medição; na **TST** acusava em tela.
Divergência de comportamento **entre ambientes**, com os dois processos nomeados pelo cliente
(PRD 39900, TST 18839), que comparou lado a lado. Confirma que PRD e TST rodavam versões diferentes
do formulário. Corrigido em 8 dias.

**Módulo/Rota:** *Faturamento de Contratos* → **Rateio Contábil** (`#tabRateio`) → **Upload Planilha
de Rateio Preenchida** (`btnImportPlanilha` / `fl_planilha`). Aplica-se igualmente ao mesmo par de
botões na *Solicitação de Compras*.

**Pré-condições**
- Medição em elaboração com itens carregados (exige a cadeia Fornecedor → Contrato → Competência →
  Filial nos zooms do Protheus).
- Uma planilha de rateio **deliberadamente errada**: percentuais somando, por exemplo, **95%** para
  um item, e outra somando **105%**.
- **Bloqueio:** **sim, parcial.** O formulário abre e os botões existem, mas montar itens de medição
  exige massa do Protheus (contrato com saldo a medir e competência aberta) que a conta de QA não
  tem. A validação em si é client-side e dispara sem submeter — é o passo barato do caso.

**Passos**
1. Abrir `/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos` e montar a medição até
   ter itens em **Itens da Medição**.
2. Abrir **Rateio Contábil** e clicar em **Download Planilha de Rateio Modelo**.
3. Preencher a planilha somando **95%** para um item (percentuais **abaixo** de 100).
4. Clicar em **Upload Planilha de Rateio Preenchida** e selecionar o arquivo.
   **Observar a tela imediatamente, sem gravar nada.**
5. Repetir com uma planilha somando **105%** para um item.
6. Repetir com uma linha de percentual **zerado/em branco**, uma com **percentual negativo** e uma
   **linha duplicada** (mesmo Item + Centro de Custo + Classe de Valor).
7. Só então tentar gravar/movimentar a medição, e comparar as críticas.

**Resultado esperado**
- A crítica aparece **no ato do upload**, antes de qualquer tentativa de gravar — este é o ponto do caso.
- Para soma acima de 100%: *"Item excedeu 100%"*, com o percentual apurado ao lado.
- Para percentual zerado/em branco: *"percentual de rateio inválido (zerado ou em branco)"*.
- Para campos faltando: *"campos obrigatórios ausentes (item, centro de custo ou classe de valor)"*.
- Para negativo: *"Linha N: item foi incluído com rateio negativo"*.
- Para linha repetida: *"Linha N: duplicada (Item …, CC …, Classe …)"*.
- Ao gravar, as críticas de fechamento continuam existindo como segunda barreira:
  *"A soma dos percentuais de rateio não pode ser inferior a 100%."* /
  *"A soma dos percentuais de rateio não pode ultrapassar 100%."* /
  *"Existem campos de rateio sem preenchimento! Favor preencher todos os campos e tente novamente."*
- **O comportamento é o mesmo em PRD e em TST** — mesma versão do formulário nos dois ambientes.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Na PRD o upload aceita a planilha **em silêncio** e o erro de percentual só aparece quando o
  usuário tenta gravar a medição; na TST a crítica aparece em tela no upload. Processos de
  referência: **PRD 39900** e **TST 18839**.

**Severidade:** Média *(retrabalho e diagnóstico tardio; e divergência PRD × TST invalida o teste feito em TST)*

**Preparação de massa:** uma medição do executor com itens carregados, **mais** três planilhas de
rateio preparadas de propósito (95%, 105%, e uma com linha zerada/negativa/duplicada). As planilhas
o próprio executor prepara a partir do modelo; a medição exige contrato com saldo — quem prepara:
fiscal de contrato. **E o caso precisa ser executado nos dois ambientes**, PRD e TST, para valer.

**Verificado em tela:** PARCIAL
**O que foi verificado:** A validação **no upload existe hoje** no formulário `256836`: em
`App/EventHandler.js` o parser da planilha acumula por item (`apportionTotals[keyRateio]`) e empilha
`validationErrors` **durante a leitura do arquivo**, com as mensagens *"Item excedeu 100%"*
(linhas 790–795 e 916–921), *"Linha N: duplicada (Item …, CC …, Classe …)"* (linha 783),
*"percentual de rateio inválido (zerado ou em branco)"* e *"campos obrigatórios ausentes (item,
centro de custo ou classe de valor)"* (linhas 891–894) e *"Linha N: item foi incluído com rateio
negativo"* (linhas 908–911). A **segunda** barreira, no momento de gravar, também está lá, em
`App/ViewHandler.js` (linhas 987–1009). Ou seja, as duas camadas que o ticket contrapunha
(upload × gravação) coexistem no código servido hoje. Botões e `input[type=file]#fl_planilha`
(`accept=".csv"`) confirmados na tela.
**Divergências encontradas:** o defeito era divergência **entre ambientes**, e eu só tenho acesso a
**um** (`caixade182374`, a base de homologação). **Não posso confirmar a paridade PRD × TST** — o
caso só fecha quando executado nos dois. Reforça a pendência o achado do CT-FSWTBC-2157: ainda há id
de pasta do ECM **hardcoded com valor por ambiente** no fonte do formulário de parecer
(`folderMain = 256821; // prod 256821 | qa 251956 | tst 256821`), que é a mesma classe de causa da
divergência entre ambientes.
**Dados/massa usados:** nenhum — não submetido; nenhum arquivo foi enviado.

---

## CT-FSWTBC-2248  (ambos · Concluído · SDCASSI-43)

**Título:** Ver que uma falha ao encerrar medição produz uma mensagem legível no Fluig, em vez de estourar dentro da própria rotina de erro.

**Origem:** FSWTBC-2248 — a medição 36072 apareceu **encerrada no Protheus e com erro no Fluig**
(`code: 500 Internal Server Error`). A sequência apurada: na **primeira** tentativa o Protheus
devolveu **200 com `items: []`** — sucesso vazio — mas **o pedido não foi gerado**; nas tentativas
seguintes passou a dar 500 com `type mismatch on + on MOSTRAERRO(MATXFUNB.PRX) line 4401`, com stack
por `FLUIGMEDICAOADAPTER:ENCERRARMEDICOES` (`UGCTE001.DATA.TLPP` linha 1472). Ou seja: **a rotina que
monta a mensagem de erro estourava**, escondendo o erro original. A correção foi *"ajuste efetuado na
mensagem"* — consertaram o mostrador, **não** a causa que ele tentava mostrar.

**Módulo/Rota:** Fluig → **Faturamento de Contratos**, atividade de encerramento da medição
(`POST /api/v1/fluig/compras/contrato/medicao/encerrar/<contrato>/<medicao>?codFilialContrato=<filial>`,
timeout 300 s, `tenantid 01,<filial>`); aba **Histórico** da solicitação.

**Pré-condições**
- Medição aberta no `wf_faturamento_contratos`, na atividade de encerramento.
- **Bloqueio:** triplo. (a) **Sem credencial Protheus** — o estado divergente ("encerrada lá, com
  erro aqui") só se confirma vendo os dois lados. (b) Exige movimentar medição real. (c) **O efeito
  central não tem superfície de front-end no Fluig:** *"o pedido de compra não foi gerado apesar do
  retorno 200"* — o **pedido de compra** não é exibido em nenhuma tela do Fluig deste ambiente. O
  que o Fluig mostra é apenas se a chamada retornou erro e **com que texto**.

**Passos**
1. Abrir a solicitação de **Faturamento de Contratos** na atividade de encerramento.
2. Movimentar o encerramento pelo combo **Direcionar Processo para**.
3. Observar a mensagem exibida na tela, se houver erro.
4. Reabrir a solicitação e ler a aba **Histórico**, na entrada da atividade de serviço de
   encerramento.
5. Abrir **Acompanhamento de Contratos** → ícone `title="Informações do Contrato"` → seção
   *Processos, Cotações e Integração* → campo **Erro de Integração**.

**Resultado esperado**
- Se o encerramento falhar, a mensagem apresentada **descreve a causa** (ex.: qual validação do ERP
  recusou, qual campo). Em nenhuma hipótese a mensagem é `500 Internal Server Error` seco, nem
  contém `type mismatch on + on MOSTRAERRO(MATXFUNB.PRX)`.
- O **Histórico** e o campo **Erro de Integração** trazem o mesmo texto de erro que a tela mostrou —
  não uma versão truncada nem vazia.
- O estado do processo no Fluig **corresponde** ao estado da medição no ERP: não existe "erro aqui,
  encerrada lá".
- Um retorno **200 com corpo vazio** (`items: []`) **não** é tratado como sucesso: o Fluig valida o
  efeito e, se o pedido não foi gerado, encaminha para a atividade de erro (mesma regra adotada em
  FSWTBC-2187).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Fluig exibe `code: 500 Internal Server Error` sem detalhamento; no log do servidor,
  `type mismatch on + on MOSTRAERRO(MATXFUNB.PRX) line 4401` via
  `FLUIGMEDICAOADAPTER:ENCERRARMEDICOES (UGCTE001.DATA.TLPP linha 1472)`; e a medição aparece
  **encerrada no Protheus** enquanto o processo Fluig ficou em erro.

**Severidade:** Alta — estado divergente entre sistemas, e a mensagem que deveria explicar o erro é
a própria que quebra, cegando o diagnóstico.

**Preparação de massa:** uma medição em atividade de encerramento, criada pelo executor, sobre
contrato com pedido a gerar. Para exercitar o **caminho de erro** é preciso uma medição que o ERP
recuse — isso depende de configuração do contrato no Protheus. **A pendência do ticket (retorno 200
com `items: []` e pedido não gerado) permanece aberta e este caso não a cobre por completo**, porque
o pedido de compra não é observável pelo Fluig.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei em tela o formulário de **Faturamento de Contratos** e as
superfícies onde a mensagem apareceria: aba **Histórico** da solicitação e campo **Erro de
Integração** do modal *Informações Complementares do Contrato* (aberto por mim; valor `-` no
contrato inspecionado). **Não** movimentei medição alguma e **não** provoquei erro.
**Divergências encontradas:** **sem superfície de front-end para o efeito principal.** O Fluig não
tem nenhuma tela que mostre o **pedido de compra** gerado a partir da medição — logo, a parte do
defeito que ficou pendente ("200 vazio, pedido não gerado") **não é verificável pelo Fluig**, nem por
Histórico, nem por Tracker, nem pelo modal do contrato. Registre isso: um verde neste caso prova
apenas que a **mensagem** de erro foi consertada, que é literalmente o escopo da correção aplicada.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2548  (fluig · Concluído · SDCASSI-74)

**Título:** Importar na medição uma planilha de rateio que soma exatamente 100% e o Fluig aceitar sem acusar divergência.

**Origem:** FSWTBC-2548 — SD776088. No processo **48286**, a planilha de rateio **não fechava em 100% no
Fluig apesar de a planilha estar com 100%** — divergência de fechamento percentual entre a origem e o que
o Fluig calcula, tipicamente arredondamento/precisão decimal na soma dos percentuais. Ticket fechado em 3
dias **sem registro de causa raiz nem de correção**.

**Módulo/Rota:** Faturamento de Contratos — `/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos`,
atividade **Realizar Medição do Contrato**, seção **Itens da Medição**, coluna **% Rateio \***.

**Pré-condições**
- Um **contrato vigente** com planilha, competência **ainda não medida** e itens com saldo a medir.
- Uma planilha de rateio preenchida cujos percentuais somem **exatamente 100%**, preferencialmente com
  **muitos centros de custo** e percentuais de dízima (ex.: 3 centros a 33,33% + 33,34%; ou 7 centros a
  14,285714%) — é aí que o erro de precisão aparece.
- Perfil que atue na atividade **Realizar Medição do Contrato**.
- **Bloqueio:** **sim** — **não há contrato disponível hoje**:
  `dsProtheus_getContratosxFornecedores_restGet` e `dsProtheus_getTipoContratos_restGetAll` devolvem
  HTTP 200 com `values: []`, e o Portal de Acompanhamento de Contratos exibe *"Nenhum registro
  encontrado"*. Isso é **instabilidade de ambiente**, não defeito. Sem contrato não há competência, sem
  competência a seção *Itens da Medição* não monta e o rateio não é alcançável.

**Passos**
1. Abrir **Faturamento de Contratos** e, em *Informações da Medição*, selecionar **Fornecedor \*** no zoom.
2. Selecionar **Nº do Contrato \***; conferir que **Revisão \***, **Filial do Contrato\***, **Tipo do
   Contrato\***, **Situação do Contrato\***, **Data Início\***, **Data Final\*** e **Objeto \*** se preenchem.
3. Selecionar **Competência do Contrato \*** (uma competência ainda não medida) e **Filial da Medição \***.
4. Selecionar **Nº da Planilha \***; a seção **Itens da Medição** deve montar com **Item \***, **Cod.
   Produto \***, **Desc. Produto \***, **Saldo a Medir \***, **Quantidade \***, **Valor Unitário \***,
   **Valor Desconto \*** e **Valor Total \***.
5. Importar a planilha de rateio que soma 100% e conferir as colunas **% Rateio \***, **Centro de Custo \***
   e **Classe de Valor \***.
6. Somar manualmente a coluna **% Rateio \*** exibida na tela e comparar com a planilha de origem.
7. Tentar avançar a medição (sem concluir, se possível apenas até a crítica).

**Resultado esperado**
- A soma exibida em **% Rateio \*** é **exatamente 100%** e coincide, célula a célula, com a planilha de origem.
- O sistema **não** acusa divergência de rateio; a medição avança para **Gravar/Encerrar Medição**.
- O resultado é o mesmo com percentuais de dízima e com muitos centros de custo — o arredondamento na
  soma **não** produz 99,99% nem 100,01%.
- Cada linha de rateio conserva o **Centro de Custo \*** e a **Classe de Valor \*** vindos da planilha.

**Resultado se o defeito reincidir**
- O Fluig acusa que o rateio **não fecha em 100%** embora a planilha esteja correta, barrando a medição —
  caso concreto do ticket: **processo 48286**. Texto exato da crítica: `<não documentado>` (o ticket traz
  apenas `Screenshot_2.jpg`).
- O sintoma é sensível ao número de centros de custo: reaparece nas medições com rateio pulverizado.

**Severidade:** Alta *(bloqueia o faturamento de contrato e tem efeito contábil — o rateio define a
apropriação por centro de custo)*

**Preparação de massa:** um **contrato vigente com planilha e competência não medida**, mais uma planilha
de rateio de teste com percentuais de dízima em pelo menos 3 e idealmente 7+ centros de custo. Nem o
contrato nem a planilha existem hoje, e a conta de QA **não pode criar contrato** — no Protheus todos os
datasets do ERP expostos ao portal são de leitura e um contrato recém-incluído nasce "Em elaboração" até
que um gestor humano o aprove. Depende do time de Contratos da Cassi.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de Faturamento de Contratos (iframe 256836) abre com as seções
*Identificação do Processo/Solicitante*, *Informações da Medição*, **Itens da Medição**, *Validação do CSE -
(Centro de Serviços Especializados)*, *Validação da Medição do Contrato CSE - (Centro de Serviços
Especializados)* e *Validação do Fiscal de Contrato*. Os rótulos do rateio existem: **% Rateio \***,
**Centro de Custo \*** e **Classe de Valor \*** (campos `tbrat_porcentagem`, `tbrat_centroCusto`,
`tbrat_classeVlr`), junto de **Saldo a Medir \***, **Quantidade \***, **Valor Unitário \***, **Valor
Desconto \*** e **Valor Total \***. Os zooms **Fornecedor \***, **Nº do Contrato \***, **Competência do
Contrato \***, **Filial da Medição \*** e **Nº da Planilha \*** existem; o de **Fornecedor** foi exercitado
e **devolveu registros reais da SA2 do Protheus** (linhas no formato *"NOME E CPF/CNPJ … CÓDIGO … LOJA …"*),
provando que a cadeia começa a funcionar. As atividades **Realizar Medição do Contrato** e
**Gravar/Encerrar Medição** foram confirmadas em 14 instâncias de `wf_faturamento_contratos`.
**Divergências encontradas:** o ticket fala em "planilha de rateio na medição", mas o formulário de
medição **não tem** os botões *Download Planilha de Rateio Modelo* / *Upload Planilha de Rateio Preenchida*
— **esses dois botões existem só no formulário da Solicitação de Compras**. Na medição a planilha é um
`input[type=file]` oculto (`fl_planilha`, `fl_planilhaMedi`) que só aparece depois de encadear os zooms, e
não há seção com o nome "Rateio": as colunas de rateio ficam dentro de **Itens da Medição**.
**Dados/massa usados:** nenhum — nenhum fornecedor foi efetivamente selecionado, nenhuma planilha enviada,
nada submetido.

---

## CT-FSWTBC-2556  (ambos · Concluído · SDCASSI-75)

**Título:** Após uma medição ser gravada, o contrato recebe o agendamento da medição seguinte e a
próxima medição é gerada na competência prevista.

**Origem:** FSWTBC-2556 — "Próxima medição não está sendo gravada no schedule", defeito interno da
DEM10014371. O campo é o **`CNA_XPRMED`** (próxima medição) da CNA, ao lado de `CNA_XULMED`
(última), `CNA_XPERIOD` (competência), `CNA_XFREQU` (frequência) e `CNA_XMULTI`. Se `CNA_XPRMED`
não grava, **o ciclo de medições para**. Fechado em 21 dias **sem registro de causa nem de
correção**.

**Módulo/Rota:** **Faturamento de Contratos**
(`/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos`, form **256836**), seção
**"Informações da Medição"** (campos *Competência do Contrato*, *Nº da Medição*, *Revisão*,
*Data Início* / *Data Final*); *Acompanhamento de Contratos*
(`/portal/p/1/acompanhamentoContrato`); *Logs Protheus* › aba **Medicoes ZZZ**.

**Pré-condições**
- Um contrato com frequência de medição definida (quinzenal/mensal/trimestral/semestral/anual) e
  ao menos **uma medição já concluída**.
- Conhecer a data da última medição para calcular a esperada.
- **Bloqueio:** **parcial** — o campo `CNA_XPRMED` é da CNA no Protheus e **não tem superfície
  direta no Fluig**: não existe rótulo "Próxima Medição" em nenhuma tela do Fluig (verificado nos
  rótulos do form 256836 e no widget de contratos). O que o Fluig observa é o **efeito**: se o
  agendamento não gravou, a medição seguinte **não nasce**. Some-se o 404 do `genericQuery`.

**Passos**
1. Abrir `/portal/p/1/acompanhamentoContrato` e anotar o contrato e a data da última medição.
2. Abrir *Logs Protheus* › **Medicoes ZZZ**, informar o **Contrato** e o intervalo
   *Recebimento inicial* / *Recebimento final* (campos `<input type="date">`, **só ISO
   `aaaa-mm-dd`**) e clicar **Consultar**.
3. Localizar a linha da última medição e abrir **Ver JSON** na coluna **Json Medicao**; conferir
   a competência e o número da medição.
4. Aguardar a competência seguinte segundo a frequência do contrato e repetir o passo 2.
5. Abrir a nova instância de **Faturamento de Contratos** e conferir, em *"Informações da
   Medição"*, os campos **Competência do Contrato**, **Nº da Medição** e **Revisão**.

**Resultado esperado**
- Para cada medição concluída existe **uma linha nova** em **Medicoes ZZZ** na competência
  seguinte, com **Data Recb Me** preenchida e **Status** de processamento avançando (`P` → `S`).
- **Nenhuma competência é pulada**: entre duas medições consecutivas o intervalo é exatamente o da
  frequência do contrato.
- A nova instância de *Faturamento de Contratos* abre com **Competência do Contrato** igual à
  competência esperada e **Nº da Medição** incrementado.
- A coluna **Data Trat Me** da linha anterior está preenchida (a medição anterior foi tratada
  antes de a seguinte ser agendada).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A próxima medição não é gravada no schedule (`CNA_XPRMED` vazio) e **o ciclo para**: depois da
  última medição, **nenhuma linha nova** aparece em **Medicoes ZZZ** e **nenhuma instância nova**
  de *Faturamento de Contratos* é aberta para aquele contrato. Mensagem de erro: **não há** — a
  falha é silenciosa, o que é o pior da situação. Mensagem exata `<não documentado>` (ticket sem
  anexo e sem comentário).

**Severidade:** Alta — medição não agendada é faturamento não realizado, com impacto financeiro
direto e sem alarme.

**Preparação de massa:** um contrato com frequência de medição configurada e uma medição concluída
na competência anterior, **criada por quem opera o contrato** — o executor de QA não deve gravar
medição em contrato de produção. Para o passo 4 é preciso **esperar a competência virar**, ou que
o responsável pelo ambiente rode a rotina de agendamento (**não** executar batch, §2).

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — `/portal/p/1/acompanhamentoContrato` abre
(*"Acompanhamento de Contratos"*, **845 linhas** na tabela); *Logs Protheus* › aba **Medicoes ZZZ**
existe com os filtros *Id Fluig*, *Filial*, *Contrato*, *Status* (`Todos/P/E/S`),
*Recebimento inicial* e *Recebimento final*, e o botão **Consultar** — mas `genericQuery` responde
**404** e sai o toast *"Logs Protheus: Nao foi possivel consultar o dataset de logs."*, então
**nenhuma linha de fila foi lida**. `wf_faturamento_contratos` abre (*"Movimentar Solicitação"*,
abas *Formulário / Informações / Histórico / Anexos*). *Lido no fonte publicado* — a aba ZZZ
mapeia `ZZZ_CONTRA`, `ZZZ_NUMMED`, `ZZZ_REVISA`, `ZZZ_MEDICA`, `ZZZ_STATUS`, `ZZZ_DHRECE`,
`ZZZ_DHEFET`, `ZZZ_IFLUIG`, `ZZZ_MSGMED`; no form 256836 há
*"Competência do Contrato *"*, *"Nº da Medição *"*, *"Revisão *"*, *"Data Início*"*,
*"Data Final*"* e a mensagem `"Erro ao buscar as informações de Competência de Medição do
Contrato. Por favor, tente novamente."`.
**Divergências encontradas:** **não existe superfície no Fluig para o campo `CNA_XPRMED` em si** —
nenhum rótulo "Próxima Medição"/"Próximo Agendamento" em tela. O caso ancora no **efeito**
(nascimento da medição seguinte), não no campo. Isso está dito explicitamente aqui em vez de
simular cobertura.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2634  (ambos · Concluído · SDCASSI-85)

**Título:** O fiscal abre uma medição de contrato e a grade "Itens da Medição" carrega os itens e o
rateio, sem erro de comunicação com o ERP.

**Origem:** FSWTBC-2634 (SD777172) — o processo **49644** não carregou os itens na medição. Causa
apontada: o serviço estava configurado para a **porta do REST principal** em vez da porta do REST
padrão de compras; ao reexecutar a listagem depois de corrigir, itens e rateio carregaram. O
próprio responsável pediu **acompanhamento**, porque a intermitência foi apenas correlacionada,
não provada.

**Módulo/Rota:** **Faturamento de Contratos** (`wf_faturamento_contratos`, form **256836**), seção
**"Itens da Medição"** (grade `tblItensMedicao`) e o rateio por item; *Logs Protheus* › **Erros CV8**.

**Pré-condições**
- Uma instância de *Faturamento de Contratos* aberta, de um contrato com itens e rateio.
- Serviço REST de compras respondendo na porta correta.
- **Bloqueio:** **sim** — não há instância de medição atribuída à conta de QA que possa ser aberta
  sem movimentar registro de terceiro; e a aba **Erros CV8** está com `genericQuery` **404**.

**Passos**
1. Abrir a instância de *Faturamento de Contratos* pela Central de Tarefas.
2. Na seção **"Itens da Medição"**, conferir a grade `tblItensMedicao`: colunas **Item**,
   **Cod. Produto**, **Desc. Produto**, **Quantidade**, **Valor Unitário**, **Valor Desconto**,
   **Valor Total** e **Saldo a Medir**.
3. Expandir o rateio de um item e conferir **Centro de Custo**, **Classe de Valor** e **% Rateio**.
4. Conferir que **nenhum** toast de erro apareceu ao carregar.
5. Abrir *Logs Protheus* › **Erros CV8**, informar o **Id Fluig** do processo e clicar **Consultar**.

**Resultado esperado**
- A grade **"Itens da Medição"** carrega **com pelo menos uma linha**; nenhum item do contrato
  falta.
- O rateio de cada item carrega com **Centro de Custo**, **Classe de Valor** e **% Rateio**
  preenchidos, e a soma dos percentuais por item é **100%**.
- **Nenhum** dos toasts abaixo aparece:
  - `"Não foi possível estabelecer comunicação com o ERP. Por favor verifique os serviços de API e tente novamente."`
  - `"Erro ao buscar as informações da medição."`
  - `"Erro ao buscar as informações de Rateios da Planilha do Contrato. Por favor, tente novamente."`
- Em **Erros CV8**, nenhuma ocorrência para o *Id Fluig* do processo.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A medição abre com a grade **"Itens da Medição" vazia** — foi o sintoma relatado no processo
  **49644**. A causa era de configuração (porta REST errada), então o sintoma no Fluig é o toast
  `"Não foi possível estabelecer comunicação com o ERP. Por favor verifique os serviços de API e
  tente novamente."` — texto literal lido no `UtilsHandler` publicado dos formulários 256831 e
  256836.
- Evidência original: `Captura de tela 2025-09-05 194533.png` e `image-20250904-200616.png`.

**Severidade:** Alta — medição sem itens não pode ser faturada e trava o pagamento do contrato.

**Preparação de massa:** uma medição aberta de um contrato **com itens e com rateio em mais de um
centro de custo**, atribuída ao próprio executor. Deve ser criada **pelo dono do contrato / pela
rotina de geração automática**, não pelo QA. Configuração de ambiente a conferir com quem opera:
o serviço REST de compras precisa estar apontado para a **porta do REST de compras**, não a do REST
principal — este é o ponto frágil que o próprio ticket pediu para acompanhar.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — `wf_faturamento_contratos` abre com título
*"Cassi - Fluig Plataforma - Movimentar Solicitação"* e as abas *Formulário*, *Informações*,
*Histórico*, *Anexos*; *Logs Protheus* › **Erros CV8** com os filtros *Id Fluig*, *Filial*,
*Data inicial*, *Data final*, *Texto* e o botão **Consultar** (404 no `genericQuery`).
*Lido no fonte publicado* — o form 256836 tem a seção **"Itens da Medição"** com a grade
`tblItensMedicao` e os rótulos **Item**, **Cod. Produto**, **Desc. Produto**, **Quantidade**,
**Valor Unitário**, **Valor Desconto**, **Valor Total**, **Saldo a Medir**, **Centro de Custo**,
**Classe de Valor**, **% Rateio**; as mensagens de falha de carga estão no `DataHandler` e no
`UtilsHandler` exatamente com o texto citado no resultado esperado.
**Divergências encontradas:** o ticket fala em "não carregou os itens"; na tela a área é
**"Itens da Medição"** (grade `tblItensMedicao`). **Achado colateral**: o widget *Logs Protheus*
› **Erros CV8** filtra por **Id Fluig** (`CV8_IDMOV`) e por **Texto** sobre
`CV8_MSG/CV8_DET/CV8_PROC/CV8_SBPROC` — é o caminho de diagnóstico deste defeito **sem login no
Protheus**, e não constava do catálogo de superfícies.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2680  (fluig · Concluído · SDCASSI-90)

**Título:** Selecionar na medição uma competência já medida e o sistema explicar por que não há itens, em vez de mostrar tela vazia.

**Origem:** FSWTBC-2680 — SD777910. *"Itens na medição não carregam"* nos processos **51738** e **51743**.
**Não era defeito**: comportamento padrão — **já havia medição para as competências selecionadas**, e a
regra impede medir duas vezes a mesma competência. O ticket foi fechado no mesmo dia, mas deixou um achado
de usabilidade **não tratado**: quando não há itens por regra de negócio, o sistema **não informa o
motivo** — o usuário vê uma tela vazia. O relator (CAST) ainda alertou que **34 medições manuais** do mesmo
contrato seriam disparadas em 15/09; não há retorno registrado sobre esse alerta.

**Módulo/Rota:** Faturamento de Contratos, seção **Informações da Medição** → **Competência do Contrato \***
e **Nº da Planilha \***; efeito na seção **Itens da Medição**.

**Pré-condições**
- Um contrato vigente com **duas** competências identificáveis: uma **já medida** e uma **ainda não medida**.
- Perfil que abra o Faturamento de Contratos (a conta de Compras/Contratos abre).
- **Bloqueio:** **sim** — **não há contrato disponível hoje** (datasets de contrato retornando
  `values: []`, portal de contratos com *"Nenhum registro encontrado"*). Sem contrato não há competência, e
  o cenário depende justamente de distinguir duas competências com históricos diferentes.

**Passos**
1. Abrir **Faturamento de Contratos** e selecionar **Fornecedor \*** e **Nº do Contrato \***.
2. Selecionar em **Competência do Contrato \*** uma competência **ainda não medida** e a **Filial da
   Medição \***; selecionar **Nº da Planilha \***.
3. Conferir que a seção **Itens da Medição** monta com linhas — **Item \***, **Cod. Produto \***,
   **Desc. Produto \***, **Saldo a Medir \***, **Quantidade \***.
4. Voltar e trocar **Competência do Contrato \*** para uma competência **já medida**.
5. Observar a seção **Itens da Medição** e qualquer mensagem exibida.

**Resultado esperado**
- Para competência **não medida**: a seção **Itens da Medição** carrega as linhas com **Saldo a Medir \***
  maior que zero.
- Para competência **já medida**: o sistema exibe uma **mensagem explícita** dizendo que já existe medição
  para aquela competência — e **não** simplesmente uma lista vazia sem explicação.
- A mensagem identifica **qual** medição já existe (número da medição/competência), para que o usuário
  saiba onde procurar.
- Nenhum dos dois casos gera erro de console ou requisição HTTP ≥ 400.

**Resultado se o defeito reincidir** *(aqui: se a lacuna de usabilidade persistir)*
- A seção **Itens da Medição** fica **vazia, sem mensagem alguma**, e o usuário conclui que o sistema está
  quebrado — foi o que gerou este chamado (processos **51738** e **51743**). Mensagem exibida hoje:
  `<não documentado>` — pelo relato do ticket, **não há mensagem**.
- Este é o mesmo padrão de **falha silenciosa** já registrado no FSWTBC-2388 (`C8_XPARTEC=N`) e no Cadastro
  de Corretoras do FSWTBC-2565. Se reaparecer aqui, trate como **problema sistêmico de feedback**, não
  como incidente isolado.

**Severidade:** Baixa *(apresentação/usabilidade — o dado e a regra estão corretos; falta a explicação.
Sobe para Média se o volume repetir o alerta das 34 medições manuais, pelo custo de suporte)*

**Preparação de massa:** um contrato com **pelo menos duas competências**, uma medida e outra não —
montado por quem opera Contratos. A conta de QA não pode criar contrato nem executar medição para "gastar"
uma competência (e não deve: seria escrita irreversível). O time precisa indicar contrato e competências.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de medição expõe **Competência do Contrato \*** (`zoomCompetencia`),
**Nº da Planilha \*** (`zoomNumPlanilha`), **Nº da Medição \*** (`numMedicao`) e a seção **Itens da
Medição** com **Item \***, **Cod. Produto \***, **Desc. Produto \***, **Saldo a Medir \***, **Quantidade \***,
**Valor Unitário \***, **Valor Desconto \*** e **Valor Total \***. Confirmado que **os zooms são
encadeados**: com o formulário em branco, `zoomCompetencia`, `zoomNumContrato`, `zoomFilialMedicao` e
`zoomNumPlanilha` têm o campo de busca **`readonly`** e **zero opções**; apenas o de **Fornecedor** está
ativo — e ele responde com registros reais da SA2. Ou seja, a competência só é escolhível depois de
fornecedor e contrato, o que confirma a pré-condição. As atividades **Realizar Medição do Contrato**,
**Gravar/Encerrar Medição**, **Aguarda processamento Fila Protheus** e **Correção** foram confirmadas em
14 instâncias de `wf_faturamento_contratos`; a base tem **85** instâncias desse processo.
**Divergências encontradas:** o ticket fala em "itens na medição não carregam", sugerindo falha de carga;
na tela a seção **Itens da Medição** **só existe depois** de a cadeia de zooms ser completada — antes disso
ela nem é renderizada. Portanto "não carregam" e "ainda não foi possível montar" são visualmente
indistinguíveis para o usuário, o que agrava exatamente a lacuna de feedback apontada no ticket.
**Dados/massa usados:** nenhum — nenhuma seleção foi efetivada, nada submetido.

---

## CT-FSWTBC-2682  (fluig · Concluído · SDCASSI-92)

**Título:** Tentar gravar uma medição cujo rateio não soma 100% e o sistema barrar com crítica explícita.

**Origem:** FSWTBC-2682 — SD777947. A **medição 50936** do contrato **FSTOTVS** **não acusou** que o rateio
não fechava em 100%, permitindo gravar medição com rateio inválido. É falha de **validação**, não de
cálculo — e é o **espelho** do FSWTBC-2548 (barra quando deveria passar): o mesmo mecanismo de validação
percentual falhando **nas duas direções**. Entregue na **MUD16348**, a mesma do FSWTBC-2688 e do
FSWTBC-2711. O ticket não registra causa raiz nem o que foi alterado.

**Módulo/Rota:** Faturamento de Contratos, atividade **Realizar Medição do Contrato** → seção **Itens da
Medição**, coluna **% Rateio \***; gravação em **Gravar/Encerrar Medição**.

**Pré-condições**
- Um contrato vigente com competência não medida e planilha com itens.
- Um rateio deliberadamente **inválido**: soma **99%** (dois centros a 50% e 49%) e, num segundo passe,
  soma **101%**.
- **Bloqueio:** **sim** — **não há contrato disponível hoje** (mesma indisponibilidade dos casos 2548 e
  2680). Além disso, há um limite conhecido do ambiente: **o campo de rateio limita silenciosamente para
  cima** — digitar `110` vira `100` no *blur* —, então **o caso "acima de 100%" pode não ser reproduzível
  pela digitação**; só o **abaixo de 100%** é. Para o caso acima de 100%, use a **importação da planilha**,
  que não passa pelo *blur* do campo.

**Passos**
1. Abrir **Faturamento de Contratos**, encadear **Fornecedor \*** → **Nº do Contrato \*** → **Competência do
   Contrato \*** → **Filial da Medição \*** → **Nº da Planilha \***.
2. Com a seção **Itens da Medição** montada, preencher **Quantidade \*** de ao menos um item.
3. Informar o rateio de modo que **% Rateio \*** some **99%** (ex.: dois centros de custo, 50% e 49%),
   preenchendo **Centro de Custo \*** e **Classe de Valor \*** em cada linha.
4. Tentar avançar/gravar a medição.
5. Repetir com rateio somando **101%**, obtido por **importação de planilha** (não por digitação).
6. Repetir com rateio somando exatamente **100%** — controle positivo.

**Resultado esperado**
- Com rateio em **99%**: o sistema **barra** e exibe crítica explícita informando que o rateio não fecha
  em 100%; a medição **não** é gravada e **não** avança para **Gravar/Encerrar Medição**.
- Com rateio em **101%**: mesmo bloqueio.
- Com rateio em **100%**: a medição avança normalmente (é o par deste caso com o CT-FSWTBC-2548 — a
  validação precisa acertar **nas duas direções**).
- A crítica identifica **qual item** tem o rateio divergente, não apenas que "há divergência".

**Resultado se o defeito reincidir**
- A medição com rateio **diferente de 100%** é **aceita sem alerta** e grava — caso concreto: **medição
  50936**, contrato **FSTOTVS**. Não há mensagem: o sintoma é justamente **a ausência** dela
  (`Screenshot_10.jpg` no ticket).
- Sinal de alarme correlato: se a crítica de rateio aparecer **indevidamente** com rateio correto, o
  defeito é o do **FSWTBC-2711** — mesmo mecanismo, direção oposta. Registre qual das duas direções falhou.

**Severidade:** Alta *(medição gravada com rateio inválido produz apropriação contábil errada por centro
de custo, e o erro segue para o Protheus)*

**Preparação de massa:** contrato vigente com competência não medida e **pelo menos dois centros de custo**
no rateio (com um só centro, 100% é trivial e o defeito não se manifesta), mais uma planilha de rateio
somando 101% para o passo 5. Depende do time de Contratos; a conta de QA não cria contrato.

**Verificado em tela:** PARCIAL
**O que foi verificado:** os três rótulos que compõem o rateio existem no formulário de medição — **%
Rateio \*** (`tbrat_porcentagem`), **Centro de Custo \*** (`tbrat_centroCusto`) e **Classe de Valor \***
(`tbrat_classeVlr`) — dentro da seção **Itens da Medição**, junto de **Quantidade \***, **Valor Unitário \***,
**Valor Desconto \*** e **Valor Total \***. As atividades **Realizar Medição do Contrato** e
**Gravar/Encerrar Medição** (6 amostras, 1–2 s) foram confirmadas em instâncias reais. A validação em si
**não pôde ser exercitada**: a seção *Itens da Medição* não monta sem contrato, e a lógica de crítica vive
em JavaScript externo ao HTML do formulário — a varredura do HTML do iframe não encontrou nenhum texto de
mensagem sobre rateio ou 100%, apenas os rótulos.
**Divergências encontradas:** o ticket trata rateio de medição e rateio de SC como a mesma coisa; são
**duas superfícies distintas** — na **SC** o rateio tem seção própria (*Rateio por Centro de Custo*, com
*Remover Todos os Rateios*, *Download Planilha de Rateio Modelo* e *Upload Planilha de Rateio Preenchida*),
enquanto na **medição** ele é um conjunto de colunas dentro de *Itens da Medição*, **sem botão visível de
download/upload de planilha**. Um caso escrito para uma superfície não cobre a outra.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2688  (fluig · Concluído · SDCASSI-96)

**Título:** Importar na medição uma planilha de rateio com valores formatados como moeda e o sistema interpretá-los sem erro de classe de valor.

**Origem:** FSWTBC-2688 — SD778262. **Erro de "classe de valor"** na medição usando planilha de rateio,
processo **51894**. O tipo/classe do valor lido da planilha não correspondia ao esperado pelo formulário —
típico de célula formatada como texto/moeda lida como número (mesma família do FSWTBC-2772, em que a
máscara `30.500,00` quebrava e `30500.00` funcionava). Entregue na **MUD16348**. **Reaberto em 19/09**
(*"Erro na solicitação 53319"*) e fechado no mesmo dia **sem registro do que foi feito na segunda passada**.
O ticket anexa a planilha real que provoca o erro (`Planilha+de+Rateio+e+Centro+de+Custo.xlsx`) — evidência
reproduzível.

**Módulo/Rota:** Faturamento de Contratos, atividade **Realizar Medição do Contrato** → seção **Itens da
Medição**, colunas **% Rateio \***, **Centro de Custo \*** e **Classe de Valor \***; importação pelo campo
de arquivo do rateio (`fl_planilha` / `fl_planilhaMedi`).

**Pré-condições**
- Um contrato vigente com competência não medida e planilha com itens.
- A planilha `Planilha+de+Rateio+e+Centro+de+Custo.xlsx` anexada ao ticket — **use exatamente ela**, é o
  caso reproduzível conhecido.
- Variantes da mesma planilha para cercar o defeito: valores com máscara (`30.500,00`), sem máscara
  (`30500.00`), célula formatada como **texto**, como **moeda** e como **número**.
- **Bloqueio:** **sim** — **não há contrato disponível hoje** (datasets de contrato retornando `values: []`).
  Sem contrato a seção *Itens da Medição* não monta e não há onde importar. Além disso, o segundo caso
  citado no ticket (**solicitação 53319**) não tem registro de correção — não se sabe se ele foi resolvido
  ou contornado, então **execute-o também**, não só o 51894.

**Passos**
1. Abrir **Faturamento de Contratos** e encadear **Fornecedor \*** → **Nº do Contrato \*** →
   **Competência do Contrato \*** → **Filial da Medição \*** → **Nº da Planilha \***.
2. Com a seção **Itens da Medição** montada, importar a planilha de rateio original do ticket.
3. Ler as colunas **% Rateio \***, **Centro de Custo \*** e **Classe de Valor \*** de **todas** as linhas.
4. Repetir com a mesma planilha tendo os valores no formato **`30.500,00`** (máscara brasileira).
5. Repetir com os valores no formato **`30500.00`**.
6. Repetir com a coluna de valor formatada como **texto** e depois como **moeda** no Excel.
7. Tentar avançar a medição em cada variante.

**Resultado esperado**
- A importação conclui **sem erro de classe de valor** em **todas** as variantes de formatação.
- A coluna **Classe de Valor \*** vem **preenchida** em cada linha, com o valor que consta na planilha.
- **% Rateio \*** e **Centro de Custo \*** são lidos corretamente, e o percentual soma 100%.
- O valor com máscara (`30.500,00`) é interpretado **igual** ao sem máscara (`30500.00`) — a formatação da
  célula **não** decide se a importação funciona.
- A medição avança para **Gravar/Encerrar Medição**.

**Resultado se o defeito reincidir**
- A importação falha com **erro de "classe de valor"** — processo **51894** no relato original e
  **solicitação 53319** na reabertura. Texto exato da mensagem: `<não documentado>` (o ticket traz
  `image-20250912-144825.png`, não o texto).
- O discriminante é a **formatação da célula**: se `30500.00` passa e `30.500,00` falha, é este defeito e
  não outro. **Registre qual formato quebrou** — foi a falta desse registro que deixou a reabertura sem
  causa conhecida.

**Severidade:** Alta *(a classe de valor determina a classificação contábil do gasto; erro aqui bloqueia a
medição e, se passar errado, contamina a apropriação no Protheus)*

**Preparação de massa:** contrato vigente com competência não medida, **mais** a planilha original do
ticket (`Planilha+de+Rateio+e+Centro+de+Custo.xlsx`, 13 KB, anexa ao FSWTBC-2688) e as quatro variantes de
formatação derivadas dela. A planilha o executor monta; o contrato não — depende do time de Contratos.
Peça também ao time Fluig o registro do que foi alterado na reabertura de 19/09, ausente do ticket.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **Classe de Valor** é um rótulo real do formulário de medição — confirmado tanto
como label visível (**Classe de Valor \***) quanto no campo `tbrat_classeVlr` e no texto do formulário
(`Classe&nbsp;de&nbsp;Valor.`), dentro da seção **Itens da Medição**, ao lado de **% Rateio \*** e
**Centro de Custo \***. Os dois campos de arquivo do rateio existem no DOM, ocultos: **`fl_planilha`** e
**`fl_planilhaMedi`**. As atividades **Realizar Medição do Contrato**, **Gravar/Encerrar Medição** e
**Correção** foram confirmadas em 14 instâncias de `wf_faturamento_contratos`. A importação **não pôde ser
exercitada** por ausência de contrato. Observação relacionada: no formulário da **SC**, a *Classe Valor*
aparece como coluna de dataset **oculta** (`{'field':'B1_CLVL','label':'Classe Valor','visible':'false'}`),
e o projeto já tem registrado que `tbprod_classeValor` sai **vazio** no payload de criação da SC enquanto
`classeOrca` e `classificacao` vêm preenchidos ao lado — pista de que o tratamento de classe de valor é
frágil também do lado da SC, e vale incluir na varredura.
**Divergências encontradas:** o ticket fala em "medição usando planilha de rateio"; no formulário de
medição **não há botão visível de upload de planilha** — só os `input[type=file]` ocultos `fl_planilha` e
`fl_planilhaMedi`, que aparecem depois da cadeia de zooms. Os botões nomeados *Download Planilha de Rateio
Modelo* e *Upload Planilha de Rateio Preenchida* existem **apenas no formulário da Solicitação de Compras**.
Quem executar o caso precisa saber que o controle da medição tem outra aparência.
**Dados/massa usados:** nenhum — nenhuma planilha foi enviada, nada submetido.

---

## Resumo do lote

| # | Caso | Verificado | Severidade | Bloqueio principal |
|---|---|---|---|---|
| 1 | CT-FSWTBC-2347 | PARCIAL | Média | Exige enviar SC e ler `server.log` |
| 2 | CT-FSWTBC-2364 | PARCIAL | Alta | Não há parecer vinculado a SC na base |
| 3 | CT-FSWTBC-2424 | PARCIAL | Alta | Exige SC com cotação gerada + parecer pendente |
| 4 | CT-FSWTBC-2430 | PARCIAL | Média | Nenhuma tarefa na etapa; exige credencial de fornecedor |
| 5 | CT-FSWTBC-2440 | PARCIAL | Alta | Não há parecer vinculado; janela da trava de data não documentada |
| 6 | CT-FSWTBC-2532 | PARCIAL | Alta | Exige SC com cotação, 2 pareceres e revisão intercalada |
| 7 | CT-FSWTBC-2548 | PARCIAL | Alta | Grade de contratos vazia hoje |
| 8 | CT-FSWTBC-2636 | **SIM** | Baixa | nenhum (para a afirmação central) |
| 9 | CT-FSWTBC-2668 | PARCIAL | Alta | Exige derrubar a API do gestor + `server.log` |
| 10 | CT-FSWTBC-2680 | PARCIAL | Baixa | Grade de contratos vazia hoje |
| 11 | CT-FSWTBC-2682 | PARCIAL | Alta | Grade de contratos vazia; rateio >100% não digitável |
| 12 | CT-FSWTBC-2684 | PARCIAL | Alta | Conteúdo do e-mail não tem superfície no Fluig |
| 13 | CT-FSWTBC-2687 | **SIM** | Média | nenhum (para o pedido original) |
| 14 | CT-FSWTBC-2688 | PARCIAL | Alta | Grade de contratos vazia hoje |

**2 SIM · 12 PARCIAL · 0 NÃO.** Nenhum caso foi marcado como verificado sem que a tela correspondente
tenha sido aberta e inspecionada.

## CT-FSWTBC-2711  (fluig · Concluído · SDCASSI-99)

**Título:** Fiscal informa o rateio da medição do contrato somando exatamente 100% e o sistema aceita, sem acusar divergência.

**Origem:** FSWTBC-2711 — “Erro no rateio da medição do contrato da Uber, processo 51894”: a
validação acusava *“A soma dos percentuais de rateio diferem de 100%. Revise os percentuais
informados para que somem 100%”* com o rateio **correto**. Corrigido na MUD16348, junto de
FSWTBC-2548 e FSWTBC-2682 — a família toda da validação percentual.

**Módulo/Rota:** *Processos → Iniciar Solicitações → Faturamento de Contratos*
(`/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos`) → seção **Itens da Medição** →
grade de rateio (`tblRateio`), colunas **Item \***, **% Rateio \***, **Centro de Custo \*** e
**Classe de Valor \***.

**Pré-condições**
- Contrato vigente com planilha de medição e **rateio em mais de um centro de custo** — o caso de
  referência do ticket é o contrato da **Uber**.
- Competência da medição disponível para o contrato.
- Perfil que alcance a etapa de preenchimento da medição (solicitante/fiscal).
- **Bloqueio:** parcial — o formulário abre e a grade de rateio existe, mas o **zoom de
  *Fornecedor*** não devolve opções para esta conta (nenhum dataset é disparado ao digitar), o que
  impede selecionar contrato/competência/planilha e chegar à grade preenchida.

**Passos**
1. Iniciar *Faturamento de Contratos*.
2. Na seção **Informações da Medição**, selecionar **Fornecedor \***, **Nº do Contrato \***,
   **Competência do Contrato \***, **Filial da Medição \*** e **Nº da Planilha \***.
3. Rolar até **Itens da Medição** e usar **Adicionar Rateio** (ou **Upload Planilha de Rateio
   Preenchida**) para lançar **dois ou mais** centros de custo.
4. Informar percentuais que **somem exatamente 100%** — inclusive um caso com casas decimais que
   dependem de arredondamento (ex.: `33,33` + `33,33` + `33,34`).
5. Salvar/movimentar a medição.

**Resultado esperado**
- A medição é aceita: **nenhuma** mensagem *“A soma dos percentuais de rateio diferem de 100%.
  Revise os percentuais informados para que somem 100%”*.
- O somatório é validado com tolerância de arredondamento: `33,33 + 33,33 + 33,34 = 100,00` passa.
- O contra-teste continua valendo: rateio que **de fato** não soma 100% (ex.: `50` + `40`) **é**
  bloqueado com essa mesma mensagem.
- Os valores lançados por **Upload Planilha de Rateio Preenchida** são validados pela mesma regra do
  lançamento manual (**Adicionar Rateio**) — os dois caminhos não podem divergir.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Mensagem **“A soma dos percentuais de rateio diferem de 100%. Revise os percentuais informados
  para que somem 100%”** com a planilha conferida e correta, travando a medição (processo **51894**,
  contrato da Uber).

**Severidade:** Alta *(rateio define a distribuição contábil por centro de custo; o falso positivo
trava o faturamento do contrato)*

**Preparação de massa:** um contrato vigente com planilha e rateio em **2+ centros de custo**, com
competência aberta, e a medição criada pelo próprio executor. A causa provável registrada é
**precisão decimal**, então a massa precisa incluir ao menos um conjunto de percentuais com dízima
(`33,33/33,33/33,34`) — sem isso o caso não exercita a raiz.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário *Faturamento de Contratos* (iframe `256836`, 68 campos) foi
aberto e inspecionado por inteiro. Seções confirmadas: *Identificação do Processo/Solicitante*,
*Informações da Medição*, *Itens da Medição*, *Validação do CSE - (Centro de Serviços
Especializados)*, *Validação da Medição do Contrato CSE - (Centro de Serviços Especializados)* e
*Validação do Fiscal de Contrato*. A grade de rateio existe (`tblRateio`) com os campos
`tbrat_item` (**Item \***), `tbrat_porcentagem` (**% Rateio \***), `tbrat_centroCusto` (**Centro de
Custo \***) e `tbrat_classeVlr` (**Classe de Valor \***), e os botões **Adicionar Rateio**,
**Download Planilha de Rateio Modelo**, **Upload Planilha de Rateio Preenchida** e **Remover Todos
os Rateios**.
**Divergências encontradas:** o zoom **Fornecedor \*** (select2 `zoomFornecedor`) não abre lista:
digitando um termo não dispara nenhum dataset e o dropdown fica vazio. Como *Nº do Contrato*,
*Competência* e *Nº da Planilha* dependem dele, a cadeia inteira de seleção fica inacessível por
esta conta. Não foi possível distinguir limitação de conta de indisponibilidade do Protheus.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2833  (fluig · Concluído · SDCASSI-112)

**Título:** Fiscal repete a medição do contrato recorrente (Uber) com planilha 100% conferida e a validação de rateio não acusa divergência.

**Origem:** FSWTBC-2833 — “Erro no rateio da medição do contrato da Uber nº 55390: *A soma dos
percentuais de rateio diferem de 100%*, com a planilha conferida e sem erro”. É a **quarta**
ocorrência do mesmo defeito (o próprio relator cita SDCASSI-22, SDCASSI-74 e SDCASSI-99), prova de
que as três correções anteriores (FSWTBC-2548, 2682, 2711, todas na MUD16348) trataram sintoma e não
raiz. Corrigido de novo em PR 57641 / MUD16586.

**Módulo/Rota:** *Faturamento de Contratos* (`wf_faturamento_contratos`) → **Itens da Medição** →
grade de rateio (`tblRateio`).

**Pré-condições**
- **O contrato da Uber** especificamente — é o caso recorrente das quatro ocorrências; um contrato
  qualquer não reproduz a condição.
- Planilha de rateio já conferida como somando 100%.
- **Bloqueio:** sim — mesmo bloqueio de CT-FSWTBC-2711 (o zoom de *Fornecedor* não devolve opções
  para esta conta) **e** dependência de um contrato de produção específico, que não deve ser
  recriado à força.

**Passos**
1. Iniciar *Faturamento de Contratos* e selecionar o **contrato da Uber** e a competência aberta.
2. Carregar o rateio pela **Upload Planilha de Rateio Preenchida** — o caminho do incidente foi a
   planilha, não a digitação.
3. Conferir na grade que **% Rateio \*** soma 100% entre os **Centro de Custo \*** lançados.
4. Salvar/movimentar a medição.
5. Repetir o mesmo em **duas competências consecutivas** do mesmo contrato — a recorrência é o
   objeto do caso.

**Resultado esperado**
- A medição é aceita nas duas competências: nenhuma ocorrência de *“A soma dos percentuais de rateio
  diferem de 100%. Revise os percentuais informados para que somem 100%”*.
- O resultado é **idêntico** entre os dois caminhos de carga do rateio (upload de planilha e
  **Adicionar Rateio** manual) — divergência entre eles é, por si, defeito.
- Reabrindo a medição, os percentuais gravados são exatamente os da planilha, sem truncamento de
  casas decimais.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Mensagem **“A soma dos percentuais de rateio diferem de 100%”** no contrato da Uber (medição
  **55390**), com a planilha conferida e correta.
- Registre como **quinta ocorrência** e escale: o ticket original já vinha com prioridade elevada
  por decisão de Willian/Geise e cobrança de prazo por Rodrigo Cunha.

**Severidade:** Alta *(mesma exposição contábil do CT-FSWTBC-2711, agravada por ser reincidência
documentada quatro vezes)*

**Preparação de massa:** o **contrato da Uber** em base de homologação, com planilha de rateio real
e **duas competências** abertas, além da planilha de rateio original do incidente (a que soma 100%
com casas decimais). Sem o contrato específico o caso vira o CT-FSWTBC-2711 genérico e perde o poder
de detectar a recorrência. **Nada disso pode ser criado pelo executor** — depende de massa de
produção replicada.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o mesmo do CT-FSWTBC-2711 — grade `tblRateio` com **Item \***,
**% Rateio \***, **Centro de Custo \*** e **Classe de Valor \***, e os botões **Adicionar Rateio**,
**Download Planilha de Rateio Modelo**, **Upload Planilha de Rateio Preenchida** e **Remover Todos
os Rateios**. O caminho “planilha” do incidente existe e é o botão de upload.
**Divergências encontradas:** não foi possível localizar o contrato da Uber — o zoom de
**Fornecedor \*** não devolve opções para esta conta, então não há como confirmar se a massa do
incidente existe nesta base. A grade de *Acompanhamento de Contratos* tem **845 linhas**, mas o
recorte por fornecedor passa pelo mesmo zoom.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2886  (fluig · Concluído · SDCASSI-75)

**Título:** O Fluig gera a medição de contrato e a solicitação "Realizar Medição do Contrato" aparece aberta para o responsável.

**Origem:** FSWTBC-2886 — “Fluig não está gerando a medição de contrato”, defeito interno da
DEM10014371. Terceiro ticket da mesma família (com FSWTBC-2556, próxima medição não gravada no
schedule, e FSWTBC-2755, timeout na criação das solicitações). Ficou 57 dias aberto e foi encerrado
como *Feito* **sem uma linha sobre causa ou correção** — não dá para distinguir se foi resolvido pela
reestruturação assíncrona ou se apenas parou de se manifestar. *(Caso escrito como caracterização de
caminho, §5-D.)*

**Módulo/Rota:** *Faturamento de Contratos* (`wf_faturamento_contratos`); efeito observável em
*Processos → Iniciar Solicitações* → **Últimas solicitações abertas**, na **Central de Tarefas** e no
**Tracker** (tipo *Faturamento de Contratos*).

**Pré-condições**
- Contrato vigente com planilha e competência elegível.
- Geração da medição — pelo schedule (automática) ou pelo início manual do processo.
- **Bloqueio:** parcial. O início manual é acessível (o processo abre), mas **concluir** a geração
  exigiria submeter — evitado. A geração **automática** depende do schedule, cuja execução é vedada
  nesta rodada.

**Passos**
1. Anotar no **Tracker**, com *Tipo = Faturamento de Contratos* e *Status = Abertos*, as medições
   existentes para o contrato alvo.
2. Provocar a geração da medição para a competência elegível (schedule, ou início manual do
   processo *Faturamento de Contratos*).
3. Abrir *Processos → Iniciar Solicitações* e conferir a área **Últimas solicitações abertas**.
4. Abrir a **Central de Tarefas** → **Tarefas a concluir** e localizar a tarefa gerada.
5. Abrir a solicitação e conferir a aba **Histórico**.

**Resultado esperado**
- Uma solicitação **“Realizar Medição do Contrato”** é criada, do processo *Faturamento de
  Contratos*, com número e data.
- A solicitação aparece em **Últimas solicitações abertas** e como tarefa do responsável na
  **Central de Tarefas**.
- Os campos **Nº do Contrato \***, **Revisão \***, **Competência do Contrato \***, **Filial da
  Medição \*** e **Nº da Planilha \*** vêm preenchidos e coerentes com o contrato de origem.
- O **Histórico** registra a criação; havendo integração, registra
  *“Integração executada com sucesso - Tempo de Execução N s”*.
- **Nenhuma medição fica “perdida”**: contrato elegível sem medição gerada é falha, ainda que
  silenciosa.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Nenhuma solicitação de medição é gerada para o contrato elegível — sem erro visível ao usuário,
  o processo simplesmente não nasce. Mensagem exata `<não documentado>`: o ticket não tem anexo e
  seu único comentário é um autolink circular (*“Verificando na atividade [link para o próprio
  ticket]”*).

**Severidade:** Alta *(medição não gerada é faturamento de contrato que não acontece, e a falha é
silenciosa)*

**Preparação de massa:** contrato de homologação elegível para medição na competência corrente, e o
direito de disparar o schedule (ou concluir o início manual). **Ponto de atenção para quem for
executar:** por ser falha silenciosa, o caso exige a **lista prévia** de contratos elegíveis para
comparar contra as medições geradas — sem esse oráculo, “nenhuma medição gerada” é indistinguível de
“nenhum contrato elegível”.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o processo **existe e abre**: *Faturamento de Contratos* está no catálogo
(categoria *Contratos*), com a descrição *“Processo de Faturamento de Contratos”* e *Último
iniciado: Ontem*. **Há massa de medições reais geradas**: *Últimas solicitações abertas* lista
**112932** (28/08/2026), **112677** e **112654** (26/08/2026), todas com o identificador
**“Realizar Medição do Contrato”** e vinculadas ao processo *Faturamento de Contratos*. Ou seja: o
caminho de geração está produzindo solicitações hoje. O formulário de início foi aberto e tem os 68
campos descritos nos casos de medição acima.
**Divergências encontradas:** o **Histórico** não pôde ser conferido (exigiria abrir uma instância
existente e ela pertence ao fluxo corrente). Não há, nesta conta, tela que liste “contratos
elegíveis × medições geradas” — sem esse cruzamento, o caso só detecta o defeito por ausência
comparada manualmente.
**Dados/massa usados:** nenhum — nada submetido, nenhum schedule disparado.

---

## CT-FSWTBC-2913  (ambos · Concluído · SDCASSI-75)

**Título:** O fiscal baixa a planilha modelo de itens da medição, preenche as quantidades e importa
de volta — e todas as linhas são aplicadas na grade "Itens da Medição".

**Origem:** FSWTBC-2913 — "bug na importação de medições", no fonte **UGCTE017.TLPP** (job MEDIÇÃO),
funcionalidade de **upload de planilha padrão** prevista na DEM10014371. **47 dias de trabalho
encerrados sem registro técnico** — nem comentário, nem anexo; o ticket traz só o título.
(Caracterização de caminho, conforme §5-D, apoiada no que o fonte publicado do formulário revela.)

**Módulo/Rota:** **Faturamento de Contratos** (`wf_faturamento_contratos`, form **256836**), seção
**"Itens da Medição"**; botões **"Download Planilha de Itens Modelo"**
(`btnDownLoadModeloPlanilhaMed`) e **"Upload Planilha de Itens Preenchida"** (`btnImportPlanilhaMed`).

**Pré-condições**
- Uma medição aberta, em etapa que habilite os botões de planilha, com itens carregados na grade
  `tblItensMedicao`.
- **Bloqueio:** **sim** — não há medição atribuída à conta de QA que possa ser aberta e movimentada
  sem alterar registro de terceiro (§2). O caso foi construído sobre o **fonte publicado** do
  formulário e sobre os rótulos reais de tela.

**Passos**
1. Abrir a medição e ir à seção **"Itens da Medição"**.
2. Clicar em **"Download Planilha de Itens Modelo"**; conferir que o arquivo baixado se chama
   **`Planilha de Medicao.xlsx`** e traz as colunas **ITEM, COD. PRODUTO, DESCRIÇÃO PRODUTO,
   QUANTIDADE, DESCONTO**, com apenas **QUANTIDADE** e **DESCONTO** editáveis.
3. Preencher a **QUANTIDADE** de **todos** os itens com valores diferentes de zero e manter
   **DESCONTO** preenchido (não deixar em branco).
4. Salvar **sem renomear o arquivo** e clicar em **"Upload Planilha de Itens Preenchida"**,
   selecionando-o.
5. Conferir, na grade `tblItensMedicao`, os campos **Quantidade**, **Valor Desconto** e
   **Valor Total** de **cada** item.
6. Repetir a importação com **uma linha de QUANTIDADE em branco** e observar o retorno.
7. Repetir com **DESCONTO em branco** numa linha e conferir o **Valor Total** resultante.
8. Repetir com o arquivo **renomeado** (ex.: `Planilha de Medicao (1).xlsx`, que é o nome que o
   navegador dá ao segundo download) e observar o retorno.
9. Marcar **"Houve Prestação de Serviço?" = Sim** com todos os itens em quantidade zero e tentar
   movimentar pelo combo **"Direcionar Processo para"**.

**Resultado esperado**
- O download entrega **`Planilha de Medicao.xlsx`** com as cinco colunas e a proteção de células
  ativa (só QUANTIDADE e DESCONTO editáveis, formato `##0.000000`, validação "somente número ≥ 0"
  com o título **"Valor inválido"** e a mensagem **"Digite apenas números (0 ou maior)."**).
- A importação aplica **todas** as linhas: a **Quantidade** de cada item na grade é exatamente a da
  planilha, e o **Valor Total** é `quantidade × Valor Unitário − Valor Desconto`.
- Linha com **QUANTIDADE em branco**: o sistema **avisa**; a linha não é aplicada **em silêncio**.
- Linha com **DESCONTO em branco**: o **Valor Total** é um número válido — **nunca** `NaN` nem um
  valor vazio.
- Valor total negativo é recusado com a mensagem **"O valor total não pode ser negativo."**,
  exibida no modal de erros (título **"Erro:"**) com a lista das linhas afetadas.
- Arquivo com nome diferente de `Planilha de Medicao.xlsx`: o sistema **informa** que o arquivo não
  é o modelo esperado — não pode simplesmente **não fazer nada**.
- Com **"Houve Prestação de Serviço?" = Sim** e todos os itens em zero, a movimentação é **barrada**
  exigindo ao menos um item com quantidade diferente de zero (regra declarada da DEM10014371).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O ticket **não descreve o sintoma** (título apenas, sem comentário e sem anexo). O ponto de
  regressão é o comportamento correto acima. Contexto: o **UGCTE017.TLPP** reapareceria depois em
  FSWTBC-2838 com `SX6 not open for GetMV` na thread IPC, por `FluigRestClient` chamado antes do
  `RpcSetEnv` — ou seja, **o job de medição já regrediu uma vez por compilação da branch errada**.

**Severidade:** Alta — quantidade de medição errada é valor faturado errado.

**Preparação de massa:** uma medição aberta, com **mais de um item** e com **rateio**, atribuída ao
próprio executor, em etapa que habilite os botões de planilha. Deve ser gerada pela rotina de
medição ou pelo dono do contrato — **o QA não deve criá-la**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Lido no fonte publicado* — o form 256836 tem os quatro botões com os
rótulos reais **"Download Planilha de Itens Modelo"** (`btnDownLoadModeloPlanilhaMed`),
**"Upload Planilha de Itens Preenchida"** (`btnImportPlanilhaMed`), **"Download Planilha de Rateio
Modelo"** (`btnDownLoadModeloPlanilha`) e **"Upload Planilha de Rateio Preenchida"**
(`btnImportPlanilha`), além de **"Adicionar Rateio"** e **"Remover Todos os Rateios"**; a seção é
**"Itens da Medição"** (grade `tblItensMedicao`) e existem os rótulos
**"Houve Prestação de Serviço? *"**, **"Direcionar Processo para *"**, **"Competência do Contrato *"**,
**"Saldo a Medir *"**, **"Valor Desconto *"** e **"Nº da Planilha *"**. `handleSpreadsheetItens()`
gera o arquivo com as colunas e validações citadas.
**Divergências encontradas:** **cinco achados, todos lidos no fonte publicado — nenhum "visto
renderizado":**
1. **Guarda em ramo truthy: DESCONTO em branco produz total NaN e pula a crítica.** Em
   `processRowDataItens`: `const valorTotalItens = (parseFloat(qtdMedir) * parseFloat(valorUnitario…)) - parseFloat(desconto);`
   e logo abaixo `if (valorTotalItens < 0) { erro… } else { grava o total }`. Com a célula DESCONTO
   vazia, `parseFloat("")` é **NaN**, `valorTotalItens` é **NaN**, e **`NaN < 0` é `false`** — a
   validação de valor negativo **é pulada inteira** e o `else` grava o total inválido no campo
   `valorTotalItens___<idx>`. É exatamente o padrão apontado no briefing.
2. **Linha silenciosamente ignorada.** A mesma função só processa a linha sob
   `if (codItem != "" && codProduto != "" && qtdMedir != "")`; com **QUANTIDADE em branco** a linha
   é descartada **sem mensagem** e sem entrar em `arrErros` — o usuário acredita que a planilha foi
   aplicada. Além disso, o `catch` da função **não retorna nada**, e o chamador faz
   `if (sendData.status)` — um erro em qualquer linha derruba o laço com *TypeError* e **aborta o
   resto da importação sem aviso**.
3. **Normalização assimétrica de número na mesma expressão.** `valorUnitario` é normalizado
   (`replaceAll('.','').replaceAll(',','.')`), mas `qtdMedir` e `desconto` vão direto para
   `parseFloat`, e a quantidade é gravada no formulário com `qtdMedir.split(".").join(",")`. Uma
   quantidade digitada como `30.500,00` vira `parseFloat("30.500,00") = 30,5` e é escrita como
   `30,500,00` no campo — **é o mesmo defeito da FSWTBC-2772, vivo neste caminho de importação**.
4. **Nome de arquivo como porta de entrada, sem retorno ao usuário.** `handleViewItens` só despacha
   quando `file.name == "Planilha de Medicao.xlsx"` (medição) ou
   `"Planilha de Rateio e Centro de Custo.csv"` (rateio). Qualquer outro nome — inclusive
   `Planilha de Medicao (1).xlsx`, que é o nome que o navegador dá ao **segundo download**, e
   inclusive `Planilha de Rateio e Centro de Custo.xlsx` (o ramo `.xlsx` do rateio está
   **comentado**) — resulta em **nenhuma ação e nenhuma mensagem**. Note que o **rótulo do botão diz
   "Planilha de Itens"** enquanto o arquivo exigido se chama **"Planilha de Medicao"**: rótulo e
   contrato não coincidem.
5. **Valor fixo no código, com os ids de cada ambiente no comentário.**
   `handleDownloadModel` usa `const idDoc = 395015; //COMMENT NOTE: ** prod *395015* | qa *256574* | tst *395015* **`
   para montar `/webdesk/webdownload?documentId=…`. O id de **QA (256574) não é o usado** — o código
   leva o de produção/TST em qualquer ambiente, então **"Download Planilha de Rateio Modelo" baixa o
   documento errado (ou falha) na base de QA**. É um hardcode sem ticket associado, do tipo já
   flagrado neste projeto.

Achados adicionais de menor porte: há **duas definições de `processRowDataItens`** na mesma classe
(a de 4 argumentos, sem DESCONTO, é **código morto** — a última declaração vence); a função de
leitura usada pela medição está marcada no próprio fonte como *"Função de carregamento de CSV e XLSX
antigo não usar sem alinhamento prévio"* e **mesmo assim é o caminho ativo**; e a **senha de proteção
da planilha está embutida em texto claro no bundle publicado** (`worksheet.protect('cassi@…')`),
o que torna a proteção das colunas não-editáveis contornável por qualquer usuário.
**Dados/massa usados:** nenhum — não submetido; nenhuma planilha foi importada.

---

## CT-FSWTBC-3007  (fluig · Concluído · SDCASSI-127)

**Título:** Medição disparada manualmente calcula a mesma data de vigência da planilha que a medição automática.

**Origem:** FSWTBC-3007 — “Data de vigência da planilha com divergência quando disparado
manualmente”: o disparo **manual** calcula a data de vigência da planilha de forma diferente do
disparo **automático**, e diverge também da data do contrato. Como a vigência da planilha define
quais itens e valores entram na medição, a divergência produz medição com **base errada** (contrato
`00142-2024-5303`, processo `59341`). A raiz declarada é **duplicidade de lógica entre os dois
caminhos**, e não há registro de unificação — nem de qual dos dois estava errado.

**Módulo/Rota:** *Faturamento de Contratos* (`wf_faturamento_contratos`) — seção **Informações da
Medição** (**Nº da Planilha \***, **Data Início\***, **Data Final\***) e **Itens da Medição**.

**Pré-condições**
- Um contrato com planilha cuja vigência **não coincida** com a vigência do contrato — é essa
  diferença que expõe o defeito; com datas iguais os dois caminhos empatam por acidente.
- Poder disparar a medição pelos **dois** caminhos (manual e automático) para o **mesmo** contrato e
  a **mesma** competência.
- **Bloqueio:** sim — o disparo automático depende do schedule (vedado nesta rodada) e o manual
  exigiria submeter uma medição. Além disso o zoom de *Fornecedor* não devolve opções para esta
  conta, impedindo selecionar contrato/planilha.

**Passos**
1. Anotar, no cadastro do contrato, a **vigência do contrato** e a **vigência da planilha** (elas
   precisam diferir).
2. Disparar a medição **automaticamente** para a competência alvo e abrir a solicitação gerada.
3. Registrar a data de vigência da planilha adotada e os itens/valores trazidos para **Itens da
   Medição**.
4. Para a **mesma** competência e o **mesmo** contrato, iniciar a medição **manualmente** por
   *Processos → Iniciar Solicitações → Faturamento de Contratos*, selecionando o mesmo
   **Nº da Planilha \***.
5. Registrar novamente a data de vigência adotada e os itens/valores.
6. Comparar os dois resultados entre si **e** com a data do contrato.

**Resultado esperado**
- A data de vigência da planilha é **idêntica** nos dois caminhos, manual e automático.
- Ela é coerente com a vigência cadastrada da planilha e com a do contrato — não “inventa” uma data
  a partir do dia do disparo.
- Em consequência, os **Itens da Medição** e os valores trazidos são os mesmos nos dois caminhos:
  mesma quantidade de itens, mesmo **Valor Total \***, mesmo **Saldo a Medir \***.
- Mudança de competência muda a base de forma coerente nos **dois** caminhos, na mesma direção.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A medição disparada manualmente adota uma data de vigência de planilha **diferente** da adotada
  pela medição automática, e ambas divergem da data do contrato (contrato `00142-2024-5303`,
  processo `59341`; anexo `image-20251017-193402.png`, indisponível). Mensagem exata: não há —
  **o defeito é silencioso**, só aparece na comparação. Consequência: itens e valores errados na
  medição.

**Severidade:** Alta *(a vigência da planilha determina a base do faturamento; erro aqui fatura
valor errado, sem crítica na tela)*

**Preparação de massa:** um contrato com **planilha cuja vigência difere da vigência do contrato**,
com competência aberta, e a possibilidade de disparar a mesma medição pelos dois caminhos. Ideal
replicar o contrato `00142-2024-5303` do incidente. **Sem os dois disparos o caso não existe** — não
é possível afirmar divergência observando apenas um dos caminhos.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o **caminho manual existe e abre**: *Faturamento de Contratos* é iniciável
por *Processos → Iniciar Solicitações*, e o formulário traz **Nº da Planilha \*** (`zoomNumPlanilha`),
**Data Início\*** (`dtInicioContrato`) e **Data Final\*** (`dtFinalContrato`), estes dois
somente-leitura, mais a seção **Itens da Medição** com **Saldo a Medir \***, **Quantidade \***,
**Valor Unitário \***, **Valor Desconto \*** e **Valor Total \***.
**Divergências encontradas:** **achado relevante e explícito, conforme §5-B do briefing: não existe
no formulário do Fluig nenhum campo de “vigência da planilha”.** A busca pelo radical *vigênc* no
HTML inteiro do formulário (inclusive nos campos ocultos) não retorna **nenhuma** ocorrência. Os
únicos campos de data da seção são **Data Início\*** e **Data Final\***, que são do **contrato**, não
da planilha. Consequência para quem for executar: **a divergência do ticket não é observável
diretamente na tela do Fluig** — só indiretamente, comparando os **itens e valores** que cada
caminho traz para *Itens da Medição*, ou consultando a planilha no Protheus (sem credencial nesta
rodada). O caso acima já está escrito assim, ancorado no efeito e não no campo.
**Dados/massa usados:** nenhum — não submetido.

---

## Fechamento do lote

| # | Caso | Verificado | Bloqueio principal |
|---|---|---|---|
| 1 | CT-FSWTBC-2689 | PARCIAL | sem matrícula de comprador; sem SC na etapa Definir Negociação |
| 2 | CT-FSWTBC-2711 | PARCIAL | zoom de Fornecedor não devolve opções |
| 3 | CT-FSWTBC-2737 | PARCIAL | sem credencial de gestor orçamentário |
| 4 | CT-FSWTBC-2752 | PARCIAL | provar o processamento exigiria submeter |
| 5 | CT-FSWTBC-2766 | PARCIAL | job/schedule — execução vedada |
| 6 | CT-FSWTBC-2790 | PARCIAL | sem matrícula de comprador; atribuir altera SC de terceiro |
| 7 | CT-FSWTBC-2833 | PARCIAL | massa específica (contrato da Uber) + zoom inoperante |
| 8 | CT-FSWTBC-2834 | PARCIAL | sem matrícula de comprador |
| 9 | CT-FSWTBC-2886 | PARCIAL | schedule vedado; concluir manual exigiria submeter |
| 10 | CT-FSWTBC-2887 | **NÃO** | funcionalidade de Corretagens não localizada nesta base |
| 11 | CT-FSWTBC-2889 | PARCIAL | sem matrícula de comprador; operação de escrita sobre SCs de terceiros |
| 12 | CT-FSWTBC-2930 | PARCIAL | sem credencial de fornecedor |
| 13 | CT-FSWTBC-2944 | PARCIAL | sem matrícula de comprador; sem cotação na etapa |
| 14 | CT-FSWTBC-3007 | PARCIAL | exige os dois disparos (manual e schedule) |

**Nada foi escrito na base.** Nenhum processo iniciado, nenhuma solicitação enviada, nenhum
registro pré-existente cancelado, alterado ou aprovado, nenhum job disparado. A única digitação foi
nos campos *Telefone*/*Celular* de um formulário de início não enviado (CT-FSWTBC-2752), apagada em
seguida.

## CT-FSWTBC-3107  (fluig · Concluído · SDCASSI-134)

**Título:** Enviar planilha de rateio com valor negativo e confirmar que o sistema recusa o arquivo — e que a planilha continua carregando normalmente na medição.

**Origem:** FSWTBC-3107 — a planilha de rateio aceitava valores negativos, distorcendo a distribuição por centro de custo. A validação introduzida causou **regressão**: a planilha deixou de ser carregada na medição (detectado pelo cliente em homologação, corrigido em 24/11 e liberado no PR 59091 / MUD16769).

**Módulo/Rota:** (a) *Solicitação de Compras* › seção **Rateio por Centro de Custo** › botões **Download Planilha de Rateio Modelo** / **Upload Planilha de Rateio Preenchida**; (b) *Faturamento de Contratos* (`wf_faturamento_contratos`) › seção **Itens da Medição** › campos `% Rateio *`, `Centro de Custo *`, `Classe de Valor *`.

**Pré-condições**
- Perfil que inicia *Solicitação de Compras* (a conta de QA inicia).
- Uma planilha de rateio preenchida com, ao menos, uma linha de **percentual negativo** (ex.: `-10`) e outra com valor válido.
- Para a parte (b): uma medição em andamento no *Faturamento de Contratos* com planilha de rateio associada.
- **Bloqueio:** a parte (b) está bloqueada para a conta de QA — não há nenhuma tarefa de *Faturamento de Contratos* na Central de Tarefas e não há medição em curso disponível; criar uma exige contrato vigente com planilha e competência aberta no Protheus.

**Passos**
1. Abrir **Processos › Iniciar Solicitações › Solicitação de Compras**.
2. Na seção *Identificação do(s) Produto(s)/Serviço(s)*, incluir um item com **Adicionar Produto**.
3. Na seção **Rateio por Centro de Custo**, clicar em **Download Planilha de Rateio Modelo**.
4. Preencher o modelo com duas linhas: uma com percentual válido e outra com percentual **negativo**.
5. Clicar em **Upload Planilha de Rateio Preenchida** e selecionar o arquivo.
6. Observar a crítica exibida **sem** enviar a solicitação.
7. Repetir o upload com a planilha só de valores positivos e conferir que a grade de rateio (`# | Item | Rateio % | C. Custo | Classe Valor`) é populada.
8. (b) Abrir uma medição em *Faturamento de Contratos* na etapa de validação e confirmar que a seção **Itens da Medição** exibe `% Rateio *`, `Centro de Custo *` e `Classe de Valor *` preenchidos a partir da planilha.

**Resultado esperado**
- O upload com valor negativo é **recusado**, com mensagem de crítica identificando a linha/valor inválido, e a grade de rateio não é populada com o valor negativo.
- O upload apenas com valores válidos é aceito e popula a grade *Rateio por Centro de Custo* com as colunas `#`, `Item`, `Rateio %`, `C. Custo` e `Classe Valor`.
- A soma dos percentuais permanece coerente (100% por item).
- Na medição, a planilha de rateio **continua carregando** — os campos `% Rateio *`, `Centro de Custo *` e `Classe de Valor *` aparecem preenchidos. *(Esta é a verificação da regressão de 19/11.)*

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Defeito original: a planilha com valores negativos era aceita e o rateio era gravado com percentual negativo por centro de custo.
- Regressão associada: *"a planilha de rateio não está sendo carregada na medição"* — a seção de rateio da medição fica vazia mesmo com planilha enviada.

**Severidade:** Alta *(rateio negativo distribui despesa invertida entre centros de custo — efeito contábil direto)*

**Preparação de massa:** um arquivo de planilha de rateio no layout do modelo, com uma linha de percentual negativo, preparado pelo próprio executor. Para o item (b), uma **medição em etapa de validação, com planilha de rateio vinculada**, criada por quem tenha contrato vigente e competência aberta — não disponível para a conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no formulário da *Solicitação de Compras* existem a seção **Rateio por Centro de Custo** e os botões **Download Planilha de Rateio Modelo** e **Upload Planilha de Rateio Preenchida**. Na solicitação real **112146** (aberta somente para leitura) a seção aparece como **"Rateio por Centro de Custo  - Item 0001"**, com a grade `# | Item | Rateio % | C. Custo | Classe Valor` e a linha `1 | 0001 | 100 | 0311 - CLINICASSI RECIFE - AFLITOS - PE | AS00 - PLANOS DE ASSOCIADOS` — ou seja, **o carregamento do rateio está funcionando hoje** no lado da SC. No formulário de *Faturamento de Contratos*, a seção **Itens da Medição** traz `% Rateio *`, `Centro de Custo *`, `Classe de Valor *` e o campo de upload da planilha da medição.
**Divergências encontradas:** o botão **Download Planilha de Rateio Modelo** foi clicado no formulário em branco e **não disparou download** em 25 s — provavelmente depende de item de produto já cadastrado; não confirmei o layout do modelo. O ticket fala em "planilha de rateio da medição", mas o par download/upload de rateio que encontrei está no formulário da **Solicitação de Compras**; na medição o rateio aparece como campos da seção *Itens da Medição*, com upload próprio (`fl_planilhaMedi`).
**Dados/massa usados:** nenhum — nenhum arquivo foi enviado e nada foi submetido. Leitura do formulário em branco e da solicitação 112146.

---

## CT-FSWTBC-3108  (ambos · Concluído · SDCASSI-135)

**Título:** Realizar a medição de um contrato pelo Fluig e confirmar que a integração conclui dentro do tempo, sem erro por corte de execução.

**Origem:** FSWTBC-3108 — o Fluig apresentava erro ao realizar a medição do contrato `031-2020` (processo 62111). Diagnóstico: a API era **morta com 1 minuto** apesar de timeout configurado em 5 minutos, e funcionava no REST **principal** — dois serviços REST apontando para **RPOs distintos**. Encerrado com **contorno** (apontar para o REST principal); a causa não foi tratada.

**Módulo/Rota:** Central de Tarefas → processo **Faturamento de Contratos** (`wf_faturamento_contratos`, card 256836) → atividade **Realizar Medição do Contrato**; abas internas **Itens** e **Rateio Contábil**; aba **Histórico** da solicitação.

**Pré-condições**
- Processo de Faturamento de Contratos vivo na atividade **Realizar Medição do Contrato**, com contrato, competência, filial de medição e planilha preenchidos.
- **Bloqueio:** sim, em dois pontos. (a) A conta de QA **não tem tarefa de medição** na Central de Tarefas — as 10 pendências são todas de SC. Os 126 processos abertos de Faturamento estão sob outros responsáveis (ex.: `maycon.oliveira@cassi.com.br`) e não podem ser movimentados por mim. (b) A causa (RPO divergente entre serviços REST e corte de 1 minuto) é de **infraestrutura Protheus Cloud** e **não tem superfície nenhuma no Fluig** — o front-end sequer possui timeout próprio.

**Passos**
1. Abrir a tarefa do processo de Faturamento de Contratos na atividade **Realizar Medição do Contrato**.
2. Conferir os campos do cabeçalho: **`Nº do Contrato`**, **`Revisão`**, **`Filial do Contrato`**, **`Competência do Contrato`**, **`Filial da Medição`**, **`Nº da Medição`**, **`Nº da Planilha`**.
3. Acionar a carga dos itens da medição e **cronometrar** a resposta.
4. Abrir as abas **Itens** (grade `tblItensMedicao`) e **Rateio Contábil** (grade `tblRateio`).
5. Abrir a aba **Histórico** e ler o registro da integração.
6. Sair **sem** movimentar o processo (não usar o combo **Direcionar Processo para**).

**Resultado esperado**
- A carga dos itens conclui e a grade **Itens** é preenchida — sem erro e sem tela vazia.
- Nenhuma mensagem `Erro ao buscar as informações da medição.` nem `Erro ao buscar as informações de Competência de Medição do Contrato. Por favor, tente novamente.`
- O **Histórico** registra `Integração executada com sucesso - Tempo de Execução N s`, com **N bem abaixo de 60 s**.
- Não aparece no Histórico `Falha ao executar evento de serviço. ... - Tempo de Execução <n> s. Nova tentativa em <dd/MM hh:mm>` com `n` próximo de 60.

**Resultado se o defeito reincidir**
- A medição falha; o Histórico mostra tempo de execução travando por volta de **60 s** (valores 65 s / 66 s / 70 s já observados neste ambiente em ocorrências análogas), sintoma do corte de 1 minuto descrito no ticket.

**Severidade:** Média

**Preparação de massa:** um processo de Faturamento de Contratos atribuído ao executor, parado em *Realizar Medição do Contrato*, com contrato e planilha válidos. Quem prepara: dono do ambiente (a geração é automática, pelo *Usuário Integrador*). **Não há superfície no Fluig** para o apontamento de RPO nem para a configuração de timeout do serviço REST: o único proxy observável é o **`Tempo de Execução N s`** do Histórico. Isso está declarado de propósito, em vez de simular cobertura.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o processo `wf_faturamento_contratos` existe e sua atividade se chama, em dados reais, **`Realizar Medição do Contrato`** — lido na coluna *Atividade Atual* do Tracker, visão **Faturamento de Contratos** (`table-fc`, dataset `dsFluig_getProcFaturamentoSql_CASSI`), que hoje retorna **126 registros ABERTA** (ex.: processo 111938, contrato `00002-2025-3501`, competência `08-2026`, medição `000197`, planilha `000001`). Os 23 rótulos do formulário 256836 e as abas *Itens* / *Rateio Contábil* foram confirmados. No fonte, `js/fat_Util_UtilsHandler.js:284-318` mostra que `restCall` é `fetch` puro — **sem `AbortController`, sem `signal`, sem timeout**; os únicos literais `timeout` são o tempo de exibição do Swal e um `searchTimeout: 3000` de debounce.
**Divergências encontradas:** o ticket fala em "timeout configurado em 5 minutos" — no **front-end do Fluig não existe timeout algum**; o valor citado é do lado servidor. Consequência prática: a tela **não tem mensagem própria de timeout**, só a genérica `Erro ao buscar as informações da medição.`
**Dados/massa usados:** nenhum — consulta ao Tracker apenas. Nenhuma medição executada nem movimentada.

---

## CT-FSWTBC-3116  (ambos · Concluído · SDCASSI-136)

**Título:** Selecionar uma planilha semi-fixa na medição manual e confirmar que os itens carregam, ou que o usuário é avisado quando não há item.

**Origem:** FSWTBC-3116 — a planilha `0002` do contrato `00186-2022-5303` (processo Fluig 62267) não carregava os itens na medição manual. Causa: planilha **semi-fixa** (que não usa cronograma financeiro) estava com o campo de cronograma **preenchido** na CNA, apontando para cronograma inexistente; a validação da API assumia que havia cronograma e falhava sem retornar itens. Corrigido apagando o código do cronograma na CNA — **sem alteração de código**.

**Módulo/Rota:** Processo **Faturamento de Contratos** → atividade **Realizar Medição do Contrato** → zoom **`Nº da Planilha`** → aba **Itens**, grade **`tblItensMedicao`**.

**Pré-condições**
- Contrato com planilha do tipo **semi-fixa** (que não utiliza cronograma financeiro) e com itens a medir na competência escolhida.
- Processo de medição vivo, atribuído ao executor.
- **Bloqueio:** sim. Não há tarefa de medição para a conta de QA, e o cadastro que origina o defeito (campo de cronograma financeiro na tabela **CNA**) **só existe no Protheus** — sem credencial nesta rodada. O tipo "semi-fixa" **não é campo de tela**: decorre de `CNL_CTRFIX` (tipo da planilha) e, subsidiariamente, `CN1_CTRFIX` (tipo do contrato).

**Passos**
1. Abrir a tarefa na atividade **Realizar Medição do Contrato**.
2. Preencher **`Nº do Contrato`**, **`Revisão`**, **`Filial do Contrato`**, **`Competência do Contrato`** e **`Filial da Medição`**.
3. No zoom **`Nº da Planilha`**, escolher a planilha **semi-fixa**.
4. Abrir a aba **Itens** e observar a grade **`tblItensMedicao`**.
5. Conferir os campos da linha: **`Item`**, **`Cod. Produto`**, **`Desc. Produto`**, **`Saldo a Medir`**, **`Quantidade`**, **`Valor Unitário`**, **`Valor Desconto`**, **`Valor Total`**.
6. Conferir se os botões **`Download Planilha de Itens Modelo`** e **`Upload Planilha de Itens Preenchida`** estão habilitados.
7. Sair sem movimentar.

**Resultado esperado**
- A grade **`tblItensMedicao`** é preenchida com os itens da planilha semi-fixa, com **`Saldo a Medir`** e **`Valor Unitário`** carregados e **`Quantidade`** editável.
- Os botões de planilha modelo/upload ficam habilitados.
- Caso realmente não haja item a medir, o usuário recebe a mensagem explícita `Não existem itens a serem medidos para a planilha <nº>. Por favor, informe outra Planilha.` — **a grade nunca fica vazia em silêncio**.

**Resultado se o defeito reincidir**
- A grade de itens fica **vazia** para a planilha semi-fixa (sintoma original da planilha `0002` do contrato `00186-2022-5303`), com os botões de planilha desabilitados.

**Severidade:** Média

**Preparação de massa:** um contrato com planilha semi-fixa e itens na competência, e — para reproduzir o cenário de risco — uma planilha semi-fixa com código de cronograma financeiro gravado na CNA, o que **só um analista com acesso ao Protheus pode montar**. **Superfície do Fluig para o efeito:** a grade `tblItensMedicao` e o toast de "não existem itens". O campo de cronograma na CNA **não tem superfície no Fluig** — o Fluig só mostra a consequência.

**Verificado em tela:** PARCIAL
**O que foi verificado:** formulário 256836 (Faturamento de Contratos) com as abas **Itens** e **Rateio Contábil** e as grades `tblItensMedicao` / `tblRateio`; rótulos dos campos da linha de item confirmados em `form_fat.html:598-690`. A busca dos itens é o dataset **`ds_fatcon_get_info_medicoes`** (`js/fat_App_DataHandler.js:83`), com `filterFields=CNA_CONTRA,FILIAL_CONTRATO,COMPETENCIA_ESCOLHIDA,FILIAL_ESCOLHIDA`. A decisão semi-fixa/fixa está no cliente, em `handleQtdItem()` (`js/fat_App_EventHandler.js:213-239`), por `CNL_CTRFIX` com fallback para `CN1_CTRFIX`. A mensagem de zero itens existe e é **dupla** (`console.error` + toast) em `js/fat_App_EventHandler.js:167-172`.
**Divergências encontradas:** existem **dois caminhos em que a grade fica vazia sem mensagem alguma** — (a) `getInfoMedicoes` engole a exceção e retorna `undefined` (`js/fat_App_DataHandler.js:105-122`), e o chamador acessa `that.dataMedicao.CND_COMPET` na linha seguinte, gerando `TypeError` que aborta o preenchimento; (b) `handleAddMeasurementItems` e `handleAddValueClasses` capturam tudo em console-only (`js/fat_App_EventHandler.js:1404` e `:1499`, `Erro ao montar as informações de medição dos itens Error: ...`) **sem toast**. Ou seja, o sintoma do ticket pode reaparecer **sem aviso ao usuário**.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3150  (protheus · Concluído · SDCASSI-142)

**Título:** Concluir uma medição no Faturamento de Contratos e conferir, no Histórico, que a atividade "Criar Pedido de Compras" encerra a medição no ERP sem "Falha na Encerrar da Medição"

**Origem:** FSWTBC-3150 — ao encerrar a medição do contrato `000000000000255` (processos 62118 e 62119) o Fluig acusou
*"Falha na Encerrar da Medicao no ERP. code 500"* e o Protheus *"AJUDA:OBRIGAT2 … Campo: Classe de Valor. Linha: 1"*. Causa: o
**produto** estava com `B1_XCTAD` (Conta de Despesa Administrativa) em branco e os Lançamentos Padrão não resolviam a classe de valor.
Corrigido por dado (preencher `B1_XCTAD`), sem validação preventiva no cadastro do produto.

**Módulo/Rota:** Fluig → *Central de Tarefas* → processo **Faturamento de Contratos** (`wf_faturamento_contratos`): 25 *Realizar Medição do
Contrato* → 27 *Aprovação Medição do Contrato* → 105 *Gravar Medição* (serviço) → 34 *Pagamento?* → **36 Criar Pedido de Compras** (serviço —
**é aqui que o ERP encerra a medição**) → 41 *Notifica Fornecedor* → 60 *Fim*. Falha de serviço → **117 Correção** (pool *Grupo de Compras -
Responsáveis por Correções de Integrações do Fat. de Contratos*). Superfícies: *Detalhes da Solicitação* → aba **Histórico**;
*Tracker* → visão **Faturamento de Contratos**; *Logs Protheus* → **Medicoes ZZZ**. Contraprova ERP: SIGAGCT → *Medição de Contratos*
e SIGAEST/SIGACOM → *Produtos* → campo *Conta Desp. ADM* (`B1_XCTAD`) — nomes de menu a confirmar no cliente.

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Contrato vigente com planilha e saldo a medir, cujo(s) produto(s) tenham `B1_XCTAD` preenchido (cenário positivo).
- Para o cenário negativo: contrato de homologação cujo produto esteja **sem** `B1_XCTAD` — exige credencial Protheus para deixar o campo em branco.
- Executor com perfil de **fiscal de contrato** (atividade 25) e aprovador (27); acesso ao grupo de Correção para o passo 7.
- **Bloqueio:** a conta de QA não é fiscal de contrato nem tem credencial Protheus; hoje os datasets do ERP estão vazios e o ZZZ em 404. O Histórico das instâncias reais (62118/62119) executa integralmente.

**Passos**
1. Abrir a solicitação de *Faturamento de Contratos* do contrato (aberta pelo executor ou pela medição automática) na atividade *Realizar Medição do Contrato*.
2. Preencher *Informações da Medição* (*Competência do Contrato*, *Filial da Medição*, *Nº da Medição*, *Itens da Medição*, *Saldo a Medir*), escolher em **Direcionar Processo para** a etapa seguinte e enviar.
3. Aprovar em *Aprovação Medição do Contrato*.
4. Aguardar *Gravar Medição*; abrir *Detalhes da Solicitação* → **Histórico** e ler a linha da atividade 105.
5. Aguardar *Criar Pedido de Compras* (36); reler o Histórico.
6. Abrir o *Tracker* → visão *Faturamento de Contratos* → `Nº do Processo Fluig` = nº da solicitação → *Pesquisar Registro*; ler *Status*, *Atividade Atual*, *Nº Contrato*, *Nº Medição*.
7. (Cenário negativo, com credencial Protheus) Repetir 1–5 com produto sem `B1_XCTAD`; após a 3ª tentativa, abrir a tarefa *Correção* e ler o Histórico.
8. (ERP) Conferir no SIGAGCT que a medição consta como encerrada e que o pedido de compras foi gerado.

**Resultado esperado**
- Passo 4: Histórico registra `Integração executada com sucesso - Tempo de Execução N s` para *Gravar Medição*.
- Passo 5: Histórico registra `Integração executada com sucesso` para *Criar Pedido de Compras* e o processo segue para *Notifica Fornecedor* — **sem** linha `Falha na Encerrar da Medição no ERP`.
- Passo 6: Tracker mostra *Status* FINALIZADA / *Atividade Atual* Fim - Faturamento de Contratos e o *Nº Contrato* correto.
- Passo 7: o ERP recusa o encerramento com mensagem que identifique a causa (a conta do produto), e a solicitação vai para *Correção* com o erro legível no Histórico; nada é encerrado no ERP.
- Passo 8: medição encerrada e pedido gerado apenas no cenário positivo.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Histórico: `Falha ao executar evento de serviço. Processo: wf_faturamento_contratos - Atividade: 36 - Tentativa: 1 - Erro` seguido de
  `Falha na Encerrar da Medição no ERP. code: 500 message: Erro ao encerrar a medição. (#84) - Tempo de Execução 30 s. Nova tentativa em …`; após 3 tentativas, *Correção*.
- No Protheus: `AJUDA:OBRIGAT2 Um ou alguns campos obrigatórios não foram preenchidos no objeto Grid. Lançamentos. Campo: Classe de Valor. Linha: 1` — detalhe que **não chega ao Histórico do Fluig** (só o `(#84)` genérico).

**Severidade:** Alta — bloqueia pagamento/pedido e envolve lançamento contábil.

**Preparação de massa:** contrato de homologação com planilha e produto com `B1_XCTAD` preenchido, criado pelo executor; para o negativo, produto de homologação com `B1_XCTAD` em branco (credencial Protheus). Solicitação de Faturamento aberta pelo próprio executor — **não** reutilizar 62118/62119 (finalizada/cancelada).

**Verificado em tela:** PARCIAL
**O que foi verificado:** instâncias **62118** e **62119** existem neste tenant (`GET …/tasks?expand=activity` → 200); *Detalhes da Solicitação* da 62119 abre com abas *Formulário / Informações / Histórico 14 / Anexos 2* e o formulário traz os rótulos listados acima, inclusive **Direcionar Processo para \***; o **Histórico** contém literalmente `Falha na Encerrar da Medição no ERP. code: 500 message: Erro ao encerrar a medição. (#84)` na 62119 e o 404 `Contrato/Medição não localizado. (#84)` ×6 na 62118; o Tracker visão *Faturamento de Contratos* devolve a 62119 com *Nº Contrato* `000000000000255`. O front do form 256836 não contém a mensagem (nasce no BPM).
**Divergências encontradas:** (1) o ticket fala em "encerrar a medição" como se fosse a *Gravar Medição*; no Fluig o encerramento é chamado pela atividade **36 Criar Pedido de Compras** — a 105 gravou com sucesso (`14 s`) antes da falha; (2) a **62118 não teve o erro 500**: falhou seis vezes com **404 `Contrato/Medição não localizado`** e foi **cancelada em 11/11/2025** ("FC Vinicius ajustou o contrato para nova medição") — o ticket agrupa duas falhas diferentes; (3) a 62119 teve antes um **400 `Planilha com id 000005 não localizada`** na *Gravar Medição*, não citado no ticket; (4) a mensagem real é `Falha na Encerrar da Medição no ERP. code: 500 message: Erro ao encerrar a medição. (#84)` — o detalhe `AJUDA:OBRIGAT2 … Classe de Valor` **não aparece no Fluig**; (5) o Fluig **retenta automaticamente 3 vezes** (`Tentativa: 1/2/3`, `Nova tentativa em …`) — na 62119 a própria retentativa passou, sem intervenção; (6) *Correção* era seq. **122** na v23 e hoje é **117**; (7) o Tracker mostra *Competência do Contrato*, *Nº Medição* e *Nº Planilha* **vazios** para a 62119 finalizada.
**Dados/massa usados:** leitura das instâncias 62118 e 62119 (contrato 000000000000255) — nada submetido.

---

## CT-FSWTBC-3206  (ambos · Concluído · SDCASSI-144)

**Título:** Antes de solicitar revisão de um contrato, consultar no Fluig se existe processo em aberto para ele e confirmar que a revisão é bloqueada enquanto houver medição em andamento.

**Origem:** FSWTBC-3206 — apontamento de homologação: a regra "não permitir fazer revisões de contratos com processos Fluig em aberto" **não estava bloqueando**. Prova do cliente: a revisão do contrato `4600004047` foi feita depois de iniciada a medição `6501`, que ainda estava finalizando havia 10 minutos. O ticket foi fechado com "ajuste disponível para validação", **sem confirmação de homologação**, e a subtarefa FSWTBC-3650 permanece **Em Execução**.

**Módulo/Rota:** Tracker (`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`) — visões **Faturamento de Contratos** e **Solicitação de Compras**, filtros **`Número do Contrato`** + **`Status = Abertos`**; Portal de Acompanhamento de Contratos (`/portal/p/1/acompanhamentoContrato`), coluna **`Nº Revisão`** e modal **Informações Complementares do Contrato**.

**Pré-condições**
- Um contrato com **medição em aberto** no Fluig (processo de Faturamento de Contratos ainda não finalizado).
- Perfil que possa solicitar revisão do contrato.
- **Bloqueio:** parcial. A consulta no Fluig é totalmente executável e foi executada. A **tentativa de revisão** é ação de contrato no Protheus/GCT, **sem credencial** nesta rodada — e o briefing proíbe alterar registro pré-existente. Anotar ainda que, com a subtarefa FSWTBC-3650 em execução, **o bloqueio pode falhar hoje**.

**Passos**
1. Abrir o Tracker.
2. Em *Filtrar por*, escolher **Faturamento de Contratos**.
3. Informar **`Número do Contrato`** e **`Status` = `Abertos`**.
4. Clicar em **Pesquisar Registro** e ler as colunas **`Nº do Processo Fluig`**, **`Status`**, **`Atividade Atual`**, **`Nº Medição`**, **`Nº Planilha`** e **`Competência do Contrato`**.
5. Repetir com *Filtrar por* = **Solicitação de Compras**, usando o filtro **`Número do Contrato`** (campo `nrContratoSC`) e `Status = Abertos`, lendo também **`Revisão do Contrato`**.
6. Abrir `/portal/p/1/acompanhamentoContrato`, localizar o contrato e anotar **`Nº Revisão`** e **`Status`**.
7. Na coluna **`Ação`**, abrir o ícone de `title='Informações do Contrato'` e ler, no modal **Informações Complementares do Contrato**, os campos **`Status da Integração GCT:`**, **`Erro de Integração:`**, **`Num Revisão do Contrato:`** e **`Medição Acumulada:`**.
8. Com medição em aberto confirmada, **tentar** solicitar a revisão do contrato.
9. Após a tentativa, repetir o passo 6 e conferir se **`Nº Revisão`** mudou.

**Resultado esperado**
- A revisão é **recusada** enquanto houver processo Fluig em aberto para o contrato, com crítica explícita ao usuário.
- O valor de **`Nº Revisão`** no Acompanhamento de Contratos permanece **inalterado** após a tentativa.
- A medição em andamento segue seu curso sem alteração de valores nem de cronograma.
- Concluídos os processos em aberto, a revisão passa a ser permitida.

**Resultado se o defeito reincidir**
- A revisão é aceita mesmo com medição em aberto — como no contrato `4600004047`, revisado enquanto a medição `6501` ainda finalizava — e **`Nº Revisão`** avança, com risco de corromper valores e cronograma da medição em voo.

**Severidade:** Alta

**Preparação de massa:** um contrato com processo de Faturamento de Contratos aberto no Fluig, e perfil autorizado a solicitar revisão. **Superfície do Fluig para o efeito:** o **Tracker é a única tela que responde "este contrato tem processo Fluig aberto?"** — o Portal de Acompanhamento de Contratos é 100% Protheus (`CN9_*`) e **não lista processos Fluig**; o campo `Número Processo:` do modal é o processo licitador do ERP, não a solicitação Fluig. O bloqueio em si é implementado fora do Fluig.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a consulta do passo 2 ao 5 foi **executada com sucesso**. Tracker visão **Faturamento de Contratos** com `Status = Abertos`: **126 registros**, grade `table-fc`, dataset `dsFluig_getProcFaturamentoSql_CASSI`, colunas `Nº do Processo Fluig / Ações / Status / Solicitante / Data da Solicitação / Hora da Solicitação / Atividade Atual / Responsável Atual / Fornecedor / Código da Filial / Código da Filial Medição / Nº Contrato / Competência do Contrato / Nº Medição / Nº Planilha / CNPJ/CPF Fornecedor Planilha / Loja Fornecedor Planilha / Aprovador CSE / Fiscal de Serviço / Fiscal de Contrato` — exemplo real: processo `111938`, contrato `00002-2025-3501`, competência `08-2026`, medição `000197`, planilha `000001`, atividade *Realizar Medição do Contrato*. Tracker visão **SC** com `Status = Abertos`: **79 registros**, incluindo a coluna **`Revisão do Contrato`** (ex.: processo 111962, contrato `E002-2023`, revisão `003`). Portal de Acompanhamento de Contratos: **845 contratos**, colunas `Filial / Tipo Contrato / Contrato / Data Inicio / Data Fim / Nº Revisão / Status / Fornecedor / Ação`; modal *Informações Complementares do Contrato* com as seções *Dados Gerais*, *Datas*, *Valores Financeiros* (`Medição Acumulada:`), *Processos, Cotações e Integração* (`Status da Integração GCT:`, `Erro de Integração:`, `Num Revisão do Contrato:`) e *Outros*.
**Divergências encontradas:** (a) o **campo de filtro por contrato tem id diferente por visão** — na visão SC é `nrContratoSC`, na visão FC é `numContrato`; usar o nome errado faz a busca voltar **todos** os registros em vez de filtrar, sem qualquer aviso. (b) O Tracker **exige ao menos um filtro** e, sem nenhum, **não renderiza grade nem mensagem** na tela. (c) Nenhuma tela do Fluig mostra o par medição-aberta × revisão de contrato lado a lado; a correlação é manual, feita pelo `Número do Contrato`. (d) O Portal de Acompanhamento de Contratos devolveu, entre duas execuções, `Nenhum registro encontrado` e minutos depois os 845 — **instabilidade de ambiente**, não defeito, e sem mensagem de erro que a distinga de "o fiscal não tem contrato".
**Dados/massa usados:** consultas ao Tracker (contratos `00002-2025-3501`, `E002-2023`) e ao Acompanhamento de Contratos. **Nenhuma revisão solicitada, nenhum contrato alterado.**

---

## CT-FSWTBC-3266  (protheus · Concluído · SDCASSI-148)

**Título:** Deixar o disparo automático de medição rodar no dia configurado e confirmar que contratos fora da vigência não recebem medição

**Origem:** FSWTBC-3266 / incidente 787535 — A medição automática disparou em 10/11/2025 para o contrato 4600004115 rev. 006, cuja vigência terminara em 03/11/2025. Não é customização: é o parâmetro padrão `MV_CNFVIGE` (= 'S' permite medições fora da vigência). Encerrado com orientação de ajustar para 'N', **sem confirmação de que o ajuste foi feito** nem de novos testes; a rotina automática não tem validação própria.

**Módulo/Rota:** Fluig · processo **Faturamento de Contratos** (`wf_faturamento_contratos`, v52) iniciado por schedule (`tipoInicioProcesso = automático`, `diaMedAutomatica`); consulta pelo **Tracker** → visão *Faturamento de Contratos*, e pelo widget **Logs Protheus** → aba *Medicoes ZZZ*. Contraprova de vigência em *Acompanhamento de Contratos* (colunas *Início*/*Fim*/*Status*). Protheus: `MV_CNFVIGE` no Configurador (SIGACFG) e a medição em SIGAGCT.

**Pré-condições**
- Um contrato com `diaMedAutomatica` igual ao dia da execução e **Data Fim anterior à data do disparo** (contrato encerrado, ainda *Vigente* na situação — hoje há **40** nessa condição só na filial 5303, ex.: `00101-2024-5303` fim 29/07/2026, `00093-2023-5303` fim 03/07/2026).
- Um contrato de controle, vigente e dentro do prazo, com o mesmo `diaMedAutomatica`.
- `MV_CNFVIGE` = 'N' no ambiente (a confirmar com o administrador — não há como ler o parâmetro pelo Fluig).
- **Bloqueio:** o disparo é schedule (não executar manualmente — observar o da madrugada, que hoje roda às ~03h e criou 60 instâncias em 08/09). Sem credencial Protheus para ler o parâmetro nem para a variação manual em SIGAGCT.

**Passos**
1. Na véspera, em *Acompanhamento de Contratos*, registrar os contratos-alvo (encerrado × controle) com *Data Fim* e *Status*.
2. Após o horário do schedule, abrir o Tracker → visão *Faturamento de Contratos*, filtrar por *Nº Contrato* (id do filtro `numContrato` nesta visão) para cada contrato-alvo e ler as instâncias criadas na data.
3. Abrir a instância criada (se houver) e ler no formulário: *Tipo de início* (`tipoInicioProcesso`), *Data Final do Contrato* (`dtFinalContrato`), *Situação do Contrato*, *Competência*.
4. Logs Protheus → aba *Medicoes ZZZ* → filtrar pelo contrato → conferir *Status* e *Msg Medicao* da fila.
5. Variação Protheus (quando houver credencial): SIGAGCT → medição manual do contrato encerrado → observar se a rotina bloqueia.

**Resultado esperado**
- O contrato **encerrado** não recebe instância automática de Faturamento na data (Tracker sem linha nova; ZZZ sem registro), ou a rotina registra recusa explícita com motivo "fora da vigência".
- O contrato de **controle** recebe a instância automática normalmente, com competência do mês corrente.
- Medição manual em SIGAGCT para contrato encerrado é recusada com mensagem de vigência (comportamento de `MV_CNFVIGE = 'N'`).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Instância automática criada para contrato com *Data Final do Contrato* anterior à data de solicitação — exatamente o que os processos **63985/63986/63987** mostram: criados em 10/11/2025, `tipoInicioProcesso = automático`, `dtFinalContrato = 2025-11-03`, contrato 4600004115, competência 11/2025 (hoje CANCELED).

**Severidade:** Alta *(medição gera faturamento/pagamento sobre contrato encerrado)*

**Preparação de massa:** nenhuma a criar — usar os contratos encerrados-vigentes já existentes (descobertos na grade) e aguardar o schedule. Quem confirma `MV_CNFVIGE` é o administrador Protheus. **Não cancelar** as instâncias que o schedule criar sobre contratos reais.

**Verificado em tela:** PARCIAL
**O que foi verificado:** (a) a ocorrência do ticket **existe neste tenant**: 46 processos de Faturamento para 4600004115, dos quais 63985/63986/63987 são automáticos de 10/11/2025 com fim de contrato 03/11/2025 — bate com o incidente; (b) o disparo de hoje: **60 instâncias** iniciadas às 03h08 de 08/09/2026, todas `automático`, `diaMedAutomatica = 08`, todas com *Situação* "05 - Vigente" e `dtFinalContrato ≥ hoje` (nenhuma fora da vigência hoje); (c) **reincidência após a correção**: processo **109615** (contrato 00010-2022-5303, fim 01/07/2026) iniciado **automaticamente em 29/07/2026**, competência 07/2026, FINALIZED — pelo critério do próprio ticket (medição depois do fim) é o mesmo defeito, o que indica que `MV_CNFVIGE` **continua 'S'** ou o schedule não filtra por vigência; (d) o dataset `ds_fatcon_get_medicaoAutomatica` (o que o formulário chama para listar competências pendentes) devolve "Não foram localizadas medições a serem feitas" para 4600004115 rev 006/008 e para os 5 encerrados-vigentes testados — mas também para os 2 de controle, então não discrimina vigência; (e) Logs Protheus abre com as três abas, campos *Filial*, *Data inicial/final*, *Mensagem, detalhe ou processo* e botão *Consultar*, mas o `genericQuery` respondeu **404** (ambiente) — aba ZZZ não pôde ser lida. Rotas e rótulos do Tracker e do Acompanhamento conferidos por sonda.
**Divergências encontradas:** (1) 40 contratos com *Data Fim* passada seguem *Vigente* (05) — a situação não acompanha a data (achado A11), o que é justamente o que faz o schedule pegá-los; (2) para o contrato de controle `00043-2024-5303` o dataset devolveu o erro de script `Cannot call method "trim" of undefined` **dentro da coluna FILIALCONTRATO**, com HTTP 200 — erro disfarçado de dado; (3) o ticket não diz se `MV_CNFVIGE` foi alterado; a reincidência 109615 sugere que não.
**Dados/massa usados:** leitura por API dos processos 63985–63987, 109615 e das 60 instâncias de 08/09; datasets `dsFluig_getProcFaturamentoSql_CASSI` e `ds_fatcon_get_medicaoAutomatica`. Nada criado, nada cancelado.

---

## CT-FSWTBC-3312  (ambos · Concluído · SDCASSI-154)

**Título:** Conferir que a medição automática abriu as solicitações no Fluig para as quatro periodicidades antes de os jobs do Protheus serem executados.

**Origem:** FSWTBC-3312 — ao executar os jobs `UGCTE016`, `UGCTE017` e `UGCTE018` não foi gerada medição, apenas os campos de data da próxima medição foram alterados. A explicação registrada é **ordem de execução**: os jobs devem rodar **somente depois** de o Fluig abrir as solicitações; rodando antes, só avançam `CNA_XULMED`/`CNA_XPRMED` e **consomem a janela de medição**. Matriz do cliente com quatro contratos: `00172-2023-5303` (mensal, competência Atual), `00212-2022-5303` (trimestral), `00106-2022-5303` (semestral, competência Passada) e `00010-2025-5303` (OUTROS com multiplicador 2, competência Futura). Ticket **reaberto 77 dias depois** e só concluído em 19/03/2026.

**Módulo/Rota:** Tracker → *Filtrar por* = **Faturamento de Contratos**, filtros **`Número do Contrato`** + **`Status`**; coluna **`Solicitante`** (a assinatura da medição automática é **`Usuário Integrador`**).

**Pré-condições**
- Os quatro contratos da matriz configurados com as respectivas periodicidades e datas de medição para o dia.
- Janela de execução conhecida do schedule.
- **Bloqueio:** sim. O briefing proíbe expressamente **rodar rotinas batch, schedules ou apropriações contábeis** — os jobs `UGCTE016/017/018` são do Protheus e estão fora de escopo e sem credencial. O dataset `dsSync_executeMedicaoAutomatica` é **server-side, disparado por schedule**, e **não aparece em nenhum fonte publicado** — não é observável pelo navegador. Este caso é, portanto, de **verificação do resultado**, não de execução.

**Passos**
1. Antes da janela, registrar para cada um dos quatro contratos a data da próxima medição (informação do Protheus — fora desta rodada).
2. Após o Fluig abrir as solicitações e **antes** de os jobs rodarem, abrir o Tracker.
3. Em *Filtrar por*, escolher **Faturamento de Contratos**.
4. Informar **`Número do Contrato`** de cada contrato da matriz, com **`Status` = `Abertos`**, e clicar em **Pesquisar Registro**.
5. Para cada um, conferir que existe processo com **`Solicitante` = `Usuário Integrador`**, e ler **`Competência do Contrato`**, **`Nº Medição`** e **`Nº Planilha`**.
6. Conferir que a **`Competência do Contrato`** corresponde à esperada por periodicidade: Atual (mensal), Passada (semestral) e Futura (OUTROS com multiplicador 2).
7. Só então autorizar a execução dos jobs (por quem tem alçada para isso — **não** pelo executor do teste).
8. Depois dos jobs, repetir a consulta e conferir que as solicitações continuam lá e que nenhuma competência foi pulada.

**Resultado esperado**
- Os **quatro** contratos têm solicitação de Faturamento de Contratos aberta no Fluig, com **`Solicitante` = `Usuário Integrador`**, antes de os jobs rodarem.
- Cada solicitação traz a **competência correta** para a sua periodicidade, com `Nº Medição` e `Nº Planilha` preenchidos.
- Depois dos jobs, nenhuma competência é pulada e nenhuma solicitação desaparece.

**Resultado se o defeito reincidir**
- Os jobs rodam antes e **nenhuma medição é gerada** — só as datas de próxima medição avançam (`CNA_XULMED`/`CNA_XPRMED`), consumindo a janela; no Tracker não aparece solicitação de `Usuário Integrador` para a competência esperada.

**Severidade:** Alta

**Preparação de massa:** os quatro contratos da matriz do cliente (mensal, trimestral, semestral e OUTROS com multiplicador 2) com data de medição no dia — **configuração no Protheus, por analista com acesso ao ERP**. **Declaração explícita, conforme §5-B:** os campos **`CNA_XULMED` e `CNA_XPRMED` não têm nenhuma superfície no Fluig** — nem o formulário de Faturamento, nem o Tracker, nem o modal *Informações Complementares do Contrato* (que só expõe campos `CN9_*`) mostram a data da próxima medição. O Tracker prova **que a solicitação não foi gerada**; **nada no Fluig explica por quê**. A dependência de ordem entre schedule e abertura das solicitações também **não é imposta pelo sistema** nem documentada em runbook.

**Verificado em tela:** PARCIAL
**O que foi verificado:** Tracker, visão **Faturamento de Contratos**, `Status = Abertos`: **126 registros** na grade `table-fc`. A assinatura da medição automática foi confirmada em dados reais — processos `111938`, `111939`, `111940` com **`Solicitante` = `Usuário Integrador`**, horários `03:00:10`, `03:00:23`, `03:00:27` (execução noturna), contrato `00002-2025-3501`, competência `08-2026`, medições `000197`/`000204`/`000205`, planilhas `000001`/`000005`/`000007`, todos na atividade *Realizar Medição do Contrato*. Os filtros da visão incluem `numContrato`, `zoomCompetencia`, `numMedicao`, `situacaoMedicao`, `zm_numPlanilha`. Confirmado que `dsSync_executeMedicaoAutomatica` **não existe em nenhum fonte publicado**; o que existe no front-end é o dataset de consulta `ds_fatcon_get_medicaoAutomatica`, usado para alimentar o zoom *Competência do Contrato* (`js/fat_App_DataHandler.js:368` e `:542`).
**Divergências encontradas:** o ticket trata "executar os jobs" como o passo verificável; **no Fluig o verificável é o oposto** — a existência (ou ausência) da solicitação aberta pelo *Usuário Integrador*. Nenhuma tela do Fluig expõe a data da próxima medição, então a parte "só alterou os campos de data" do sintoma é **inverificável sem Protheus**.
**Dados/massa usados:** consulta ao Tracker. **Nenhum job, schedule ou rotina batch executado.**

---

## CT-FSWTBC-3362  (fluig · Concluído · SDCASSI-158)

**Título:** Verificar que as medições automáticas do dia são disparadas para todos os contratos elegíveis, em todas as filiais.

**Origem:** FSWTBC-3362 — as medições do dia 22/11 não foram disparadas automaticamente, afetando dez contratos de sete filiais (2903, 3201, 3303, 3304, 3501, 3503, 3509, 5303). Terceira ocorrência em três meses (ver FSWTBC-2635 e FSWTBC-2753), sem causa raiz documentada e sem monitoramento — quem percebe é sempre o cliente.

**Módulo/Rota:** *Faturamento de Contratos* (`wf_faturamento_contratos`) — instâncias criadas pelo **job de medição automática**; conferência em *Central de Tarefas* e no *Tracker - Processos Compras/ Contratos* (visão **Faturamento de Contratos**).

**Pré-condições**
- Contratos vigentes com medição automática configurada e data de disparo no dia da execução (a lista dos dez contratos do incidente serve de massa de verificação retroativa).
- Acesso ao agendamento (schedule) do Fluig para confirmar a execução do job — perfil de administrador.
- **Bloqueio:** sim. O disparo é um **job de servidor**; a conta de QA não é administradora e não pode consultar nem executar schedules. Além disso, **não há nenhuma tarefa de *Faturamento de Contratos* na Central de Tarefas da conta**, e o briefing proíbe rodar rotinas batch. A verificação possível é **indireta** (ausência/presença de instâncias no dia).

**Passos**
1. Levantar, junto ao time da CASSI, a lista de contratos com medição automática prevista para a data D.
2. No dia seguinte a D, abrir o **Tracker - Processos Compras/ Contratos**, selecionar em *Filtrar por:* a visão **Faturamento de Contratos**, informar *Data da Solicitação (De)* e *(Até)* iguais a D e clicar em **Pesquisar Registro**.
3. Contar as medições geradas e conferir contra a lista prevista, filial por filial.
4. Abrir uma das medições geradas e, na aba **Histórico**, confirmar o registro da criação automática e da integração com o ERP.
5. Registrar qualquer contrato previsto que não tenha medição correspondente.

**Resultado esperado**
- Existe uma medição gerada para **cada** contrato elegível na data prevista, em **todas** as filiais envolvidas.
- Nenhum contrato elegível fica sem medição, e nenhuma medição é gerada em duplicidade.
- O Histórico de cada medição registra a criação automática e o resultado da integração com o ERP.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Nenhuma medição gerada na data — no incidente original, dez contratos de sete filiais (2903, 3201, 3303, 3304, 3501, 3503, 3509, 5303) ficaram sem medição no dia 22/11, e a falha só foi percebida quando o cliente reclamou.

**Severidade:** Alta *(medição não disparada trava o faturamento do contrato e é detectada tarde; a abrangência multi-filial indica falha do job, não de contrato)*

**Preparação de massa:** lista de contratos com medição automática prevista para uma data conhecida, fornecida pelo time da CASSI — não há como o executor criá-la. **Recomendação derivada do ticket:** como não existe monitoramento da ausência de disparo, este caso só é executável se alguém mantiver a lista esperada por data; vale pedir ao time um alerta que compare "medições previstas × medições geradas" no fim de cada dia.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o processo *Faturamento de Contratos* existe e abre (`/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos`), com as seções *Identificação do Processo/Solicitante*, *Informações da Medição*, *Itens da Medição*, *Validação do CSE - (Centro de Serviços Especializados)*, *Validação da Medição do Contrato CSE* e *Validação do Fiscal de Contrato*, e os campos `Nº da Medição *`, `Nº da Planilha *`, `Competência do Contrato *` e `Filial da Medição *`. O **Tracker** oferece a visão *Faturamento de Contratos* no combo *Filtrar por:*, com os filtros *Data da Solicitação (De)* e *(Até)*. A **Central de Tarefas** da conta lista 11 tarefas (Solicitação de Compras, Cotação de Produtos e Serviços e Questionário CliniCASSI) e **nenhuma medição**.
**Divergências encontradas:** ao acionar **Pesquisar Registro** no Tracker (visões *Faturamento de Contratos*, *Aprovadores SC*, *Produtos/Rateio SC* e *Negociação (Detalhado Itens)*), **nenhuma grade de resultado foi renderizada** — nem colunas, nem linhas, nem mensagem de "sem registros". Isso ocorreu na mesma janela em que a grade de contratos passou de 845 para 0 registros, o que sugere **instabilidade do Protheus**, mas não pude distinguir instabilidade de defeito de renderização do Tracker — fica como ponto a reverificar em janela saudável.
**Dados/massa usados:** nenhum — não submetido; apenas consultas de leitura no Tracker.

---

## CT-FSWTBC-3517  (ambos · Concluído · SDCASSI-173)

**Título:** Realizar a medição de um contrato de planilha fixa e conferir que a quantidade trazida não excede o saldo a medir.

**Origem:** FSWTBC-3517 — no processo 69898 o Fluig trouxe *quantidade a maior* que o saldo a medir em planilha **fixa**, e a gravação da medição foi recusada pelo ERP. Reproduzido no processo 70173. Fechado no mesmo dia: "foi identificada uma divergência no saldo, que foi corrigida pontualmente" — ou seja, corrigiu-se o **dado**, não o código.

**Módulo/Rota:** Fluig → **Processos → Iniciar Solicitações → Contratos → Faturamento de Contratos** (`wf_faturamento_contratos`) → painel **Itens da Medição**. Conferência cruzada em **Acompanhamento de Contratos** → ícone `title="Informações do Contrato"` → *Saldo do Contrato* / *Medição Acumulada*.

**Pré-condições**
- Contrato **vigente** cujo *Tipo de Planilha* tenha `CNL_CTRFIX = "1"` (planilha fixa) ou, com `CNL_CTRFIX = "0"`, cujo *Tipo de Contrato* tenha `CN1_CTRFIX = "1"` — é essa combinação que faz a Quantidade nascer `readonly`, vinda do contrato.
- Ao menos uma medição anterior já baixada no contrato, para que *Saldo a Medir* seja menor que a quantidade original do item.
- Perfil que abre o processo de Faturamento de Contratos.
- **Bloqueio:** para provar a recusa do ERP é preciso concluir a gravação (atividades 114/105), o que **escreve** no Protheus e exige credencial de ERP para conferir CND/CNE. Não executado. Além disso, a base de homologação não tem contrato com saldo divergente conhecido.

**Passos**
1. Abrir **Faturamento de Contratos** e preencher, no painel *Informações da Medição*: **Fornecedor**, **Nº do Contrato**, **Revisão**, **Filial do Contrato**, **Competência do Contrato** (zoom), **Filial da Medição**, **Nº da Planilha**.
2. Avançar até o painel **Itens da Medição**.
3. Para cada linha, ler as colunas **Saldo a Medir** e **Quantidade**.
4. Conferir que **Quantidade ≤ Saldo a Medir** em toda linha.
5. Confirmar que, em planilha fixa, o campo **Quantidade** está **readonly** e que os botões *Download Planilha de Itens Modelo* e *Upload Planilha de Itens Preenchida* estão **desabilitados**.
6. Em outra aba, abrir **Acompanhamento de Contratos**, localizar o mesmo contrato, clicar no ícone `title="Informações do Contrato"` e conferir **Saldo do Contrato** e **Medição Acumulada** contra a soma exibida na medição.

**Resultado esperado**
- Em planilha fixa, **Quantidade** vem preenchida a partir do contrato (`CNE_QUANT`) e **readonly**; os botões de planilha de itens ficam desabilitados.
- **Quantidade** de cada item é **menor ou igual** ao **Saldo a Medir** da mesma linha.
- *Saldo do Contrato* + *Medição Acumulada* do modal são coerentes com o valor total da medição em tela.
- A medição é aceita pelo ERP sem erro de quantidade.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- **Quantidade** maior que **Saldo a Medir** na mesma linha, e a gravação da medição recusada pelo ERP ao fim do processo (processos 69898 e 70173).

**Severidade:** Alta *(recusa de gravação de medição = faturamento não realizado; e o descasamento de saldo indica medição anterior mal baixada)*

**Preparação de massa:** contrato de planilha fixa com pelo menos uma medição anterior encerrada e baixada, para gerar saldo residual — só o time da CASSI/Protheus cria. Como esta é uma divergência de **dado** e não de tela, o cenário só é reproduzível com um contrato cujo saldo esteja fora de sincronia; não crie um para forçar.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri `wf_faturamento_contratos` e li os 45 rótulos do formulário. Existem, literalmente: **Saldo a Medir \***, **Quantidade \***, **Valor Unitário \***, **Valor Desconto \***, **Valor Total \***, **% Rateio \***, **Competência do Contrato \***, **Nº da Medição \***, **Nº da Planilha \***, **Filial do Contrato\***, **Filial da Medição \***. Painéis: *Identificação do Processo/Solicitante*, *Informações da Medição*, *Itens da Medição*, *Validação do CSE - (Centro de Serviços Especializados)*, *Validação da Medição do Contrato CSE - (Centro de Serviços Especializados)*, *Validação do Fiscal de Contrato*. Botões: *Download Planilha de Itens Modelo*, *Upload Planilha de Itens Preenchida*, *Adicionar Rateio*, *Download Planilha de Rateio Modelo*, *Upload Planilha de Rateio Preenchida*, *Remover Todos os Rateios*. No modal do contrato confirmei **Saldo do Contrato:** e **Medição Acumulada:**.
**Divergências encontradas:** **achado grave, lido no fonte publicado hoje** — *não existe nenhuma validação que compare Quantidade com Saldo a Medir*. O campo `saldoMedirQtd___N` é **apenas escrito** (`fat_App_EventHandler.js:155`, `UtilsHandler.setElementValue({element:`saldoMedirQtd___${idLine}`, value: item.CNE_QTAMED})`) e **nunca lido**: não há `getElementValue("saldoMedirQtd…")` em lugar nenhum. O gate de envio (`fat_App_App.js:68-78`, estados 25 e 28) só valida **rateio**, e só quando *Houve Prestação de Serviço? = Sim*. O único teto aplicado à Quantidade é a máscara `max: '999.999.999,999999'`. A planilha de itens importável nem tem coluna de saldo: `const headers = ["ITEM","COD. PRODUTO","DESCRIÇÃO PRODUTO","QUANTIDADE","DESCONTO"]` e validação `greaterThanOrEqual 0`. **Ou seja: o Fluig aceita quantidade maior que o saldo e só o ERP recusa — a correção do ticket foi no dado, e a porta continua aberta.** Outra divergência: o Tracker rotula *Nº Contrato*, *Nº Medição*, *Nº Planilha*, *Filial Contrato*, *Filial Medição*, enquanto o formulário rotula *Nº do Contrato*, *Nº da Medição*, *Nº da Planilha*, *Filial do Contrato*, *Filial da Medição*.
**Dados/massa usados:** contratos lidos em Acompanhamento de Contratos (`000000000000001`/3517 vigente, `0000-2025-2501-`/2501 finalizado). Formulário aberto e **não submetido**.

---

## CT-FSWTBC-3549  (ambos · Concluído · SDCASSI-177)

**Título:** Encerrar a medição de um contrato e conferir que a integração com o ERP conclui, registrando tempo de execução no histórico.

**Origem:** FSWTBC-3549 — a SC 71432 não avançava: o Protheus devolvia **HTTP 500** no encerramento da medição do contrato `6185-2025-5303` (`POST /api/v1/fluig/compras/contrato/medicao/encerrar/6185-2025-5303/002088?codFilialContrato=5303`), com stack em `wf_faturamento_contratos.servicetask36`. Encerrado como **"Não é possível reproduzir"**.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** → painel **Validação da Medição do Contrato CSE** → combo **Direcionar Processo para**; conferência no **Histórico** do processo.

**Pré-condições**
- Processo de Faturamento de Contratos em andamento, com medição já preenchida, posicionado na validação do CSE.
- Serviço `apiRESTProtheusFatCon` no ar (`tenantid 01,<filial>`), timeout de serviço 300 s.
- **Bloqueio:** o contrato `6185-2025-5303` do ticket **não existe** na base de homologação (os contratos disponíveis são `0000-2025-2501-`, `000000000000001`, `000000000000002`, `000000000000003`). Sem credencial Protheus não dá para confirmar a gravação do lado do ERP, e encerrar a medição **escreve** — não executado.

**Passos**
1. Abrir a tarefa de **Validação da Medição do Contrato CSE - (Centro de Serviços Especializados)** do processo de medição.
2. Preencher **Aprovar?** e **Justificativa para a Aprovação/Reprovação**.
3. No combo **Direcionar Processo para**, escolher a opção que encerra a etapa (opções disponíveis neste painel: *Fiscal de Serviço*, *Fiscal de Contrato*, *Cancelar Medição*).
4. Movimentar o processo.
5. Abrir o **Histórico** do processo e localizar a atividade de serviço do sistema correspondente ao encerramento da medição.
6. Ler a linha de retorno da integração.

**Resultado esperado**
- O processo avança sem erro.
- No **Histórico** aparece a linha `Integração executada com sucesso - Tempo de Execução <N> s` para a atividade de serviço do encerramento.
- Não aparece nenhuma mensagem de falha de comunicação com o ERP.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O processo trava e o log do Fluig registra HTTP **500 Internal Server Error** na chamada `POST /api/v1/fluig/compras/contrato/medicao/encerrar/<contrato>/<medição>?codFilialContrato=<filial>`, com stack em `wf_faturamento_contratos.servicetask36`.

**Severidade:** Alta *(medição travada = faturamento do contrato parado)*

**Preparação de massa:** um processo de medição já validado pelo CSE, pronto para encerramento, num contrato vigente com planilha e itens. Precisa ser criado pelo próprio executor (prefixo `QA` nos campos de texto livre) ou fornecido pela CASSI. **Orientação registrada no ticket, e que vale como passo do caso: se ocorrer erro, acionar o suporte ANTES de finalizar o processo** — finalizar destrói o estado necessário ao diagnóstico.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no formulário de Faturamento de Contratos confirmei os **dois** combos rotulados **Direcionar Processo para \*** e suas opções literais: em *Validação da Medição do Contrato CSE* (`validMed_enviarPara`) → `Selecione...`, `Fiscal de Serviço`, `Fiscal de Contrato`, `Cancelar Medição`; em *Validação do Fiscal de Contrato* (`validFiscal_enviarPara`) → `Selecione...`, `Fiscal de Serviço`, `Centro de Serviços Especializados`. No histórico do processo 112832 confirmei o formato literal da linha de integração (`Integração executada com sucesso - Tempo de Execução 115 s`), que é a âncora deste caso.
**Divergências encontradas:** (1) **não existe rótulo "Retorno Integração" no formulário de Faturamento de Contratos** — busquei no HTML da tela e está ausente; esse campo existe **só na SC** (painel *Verificar Retorno Protheus*). Quem escrever o passo citando "Retorno Integração" na medição está citando a tela errada. (2) O ticket fala em "botão Encerrar"; na tela o controle é o combo **Direcionar Processo para**, e ele é obrigatório. (3) **Achado no fonte publicado:** o erro do ERP não chega ao usuário com detalhe — `restCall` faz `.catch(err => err)` (`fat_Util_UtilsHandler.js:378-387`) e o usuário vê só mensagens genéricas, sendo a mais específica `"Não foi possível estabelecer comunicação com o ERP. Por favor verifique os serviços de API e tente novamente."`. É exatamente o problema de observabilidade que fez o ticket ser encerrado sem causa.
**Dados/massa usados:** nenhum — não submetido. Contrato do ticket ausente da base.

---

## CT-FSWTBC-3573  (fluig · Concluído · SDCASSI-180)

**Título:** Conferir a regra da flag "Houve Prestação de Serviço?" na medição: com **Não**, a medição segue com valores zerados; com **Sim**, ao menos um item precisa ter quantidade diferente de zero.

**Origem:** FSWTBC-3573 — relatado como defeito ("a medição 71229 passou pelo Fluig com valor zerado e medição semi-fixa não pode ter valor zerado"), mas **refutado na análise**: o próprio print do relator mostrava a sinalização de que **não houve prestação de serviço**, condição em que o valor zerado é o comportamento correto (regra da DEM10014371). O achado residual é de **usabilidade**: a marcação não está visível o bastante, tanto que a própria operação do cliente a interpretou como erro.

**Módulo/Rota:** *Faturamento de Contratos* (`wf_faturamento_contratos`) › seção **Itens da Medição** › campo **Houve Prestação de Serviço? \*** (rádios *Sim* / *Não*), **Observações \***, abas **Itens** e **Rateio Contábil**.

**Pré-condições**
- Uma medição de contrato **semi-fixa** em etapa de preenchimento/validação (CSE ou Fiscal de Contrato), com itens carregados.
- Perfil que atua na medição (CSE / Fiscal de Contrato).
- **Bloqueio:** sim. A **Central de Tarefas da conta de QA não tem nenhuma tarefa de *Faturamento de Contratos*** e não há medição em curso disponível para abrir; criar uma exige contrato vigente, planilha e competência aberta no Protheus, que a conta não pode provisionar.

**Passos**
1. Abrir a medição em **Central de Tarefas › Faturamento de Contratos** (aba correta clicada explicitamente — a Central guarda a sub-aba por sessão no servidor).
2. Ir à seção **Itens da Medição** e conferir o estado inicial: todos os itens vêm com quantidade **0** por padrão.
3. **Cenário A** — marcar **Houve Prestação de Serviço? = Não**, preencher **Observações** e conferir que o formulário aceita a medição com valores zerados, sem crítica.
4. **Cenário B** — marcar **Houve Prestação de Serviço? = Sim** mantendo **todos** os itens com quantidade 0 e tentar avançar; observar a crítica.
5. **Cenário C** — ainda com **Sim**, informar quantidade diferente de zero em ao menos um item e conferir que a crítica desaparece.
6. Conferir que a marcação escolhida fica **visível na leitura da medição** (na própria seção e no resumo apresentado a quem valida depois), sem depender de abrir o campo.
7. Não concluir a movimentação.

**Resultado esperado**
- Com **Houve Prestação de Serviço? = Não**, a medição é aceita com valor total zerado — isso é comportamento **correto**, não defeito.
- Com **Sim** e todos os itens em 0, o sistema **impede** o avanço e critica exigindo ao menos um item com quantidade diferente de zero.
- Com **Sim** e ao menos um item preenchido, o avanço é liberado e o valor total reflete os itens informados.
- A marcação *Sim/Não* é legível para quem analisa a medição posteriormente, sem precisar deduzir a partir do valor zerado.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Não havia defeito de produto. O que se via — e que motivou o chamado — é uma medição de valor total **zerado** aprovada e seguindo o fluxo, sem que a razão (*"não houve prestação de serviço"*) estivesse evidente na tela; o time de operação leu isso como erro. Um vermelho aqui significa: ou a regra do Cenário B parou de valer (aí sim é defeito), ou a sinalização voltou a ficar invisível.

**Severidade:** Alta *(a regra separa medição legitimamente zerada de medição faturada sem serviço prestado — errar o lado tem efeito financeiro direto sobre o contrato)*

**Preparação de massa:** uma medição de contrato **semi-fixa** aberta em etapa de preenchimento, com itens carregados — só o time da CASSI consegue provisionar (depende de contrato vigente e competência aberta). **Recomendação derivada do ticket:** incluir, no teste, a verificação de que a marcação aparece no resumo da medição, já que a confusão de leitura foi a causa real do chamado.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o processo *Faturamento de Contratos* abre (`/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos`). No formulário estão a seção **Itens da Medição** e, nela, o campo **Houve Prestação de Serviço? \*** com os rádios **Sim** (`houvePrestServicoSim`) e **Não** (`houvePrestServicoNao`), o campo **Observações \*** (obrigatório) e as abas **Itens** e **Rateio Contábil**. Existem ainda os campos `situacaoMedicao`, `medicaoRealizada`, `saldoMedirQtd`, `alteracaoMedicao`, `comSemPrestacao` e a seção **Validação do Fiscal de Contrato**. A **crítica dos Cenários B e C não foi exercitada**: não há medição com itens para preencher, e o briefing veda criar massa desse tipo.
**Divergências encontradas:** o ticket escreve *"Houve prestação de serviço?"*; na tela o rótulo é **"Houve Prestação de Serviço?"** e é **obrigatório** (marcado com `*`) — não é opcional como a leitura do chamado sugere. Não encontrei, no formulário, nenhum campo que identifique a medição como **semi-fixa**: essa característica vem do contrato, não da medição, então o executor precisa saber de antemão qual contrato é semi-fixo — o que o ticket trata como se fosse visível na tela.
**Dados/massa usados:** nenhum — não submetido; formulário aberto em branco.

---

## CT-FSWTBC-3599  (ambos · Concluído · SDCASSI-185)

**Título:** Concluir uma medição no Fluig e conferir que ela existe no Protheus, cruzando pelo Tracker antes de dar o processo por encerrado.

**Origem:** FSWTBC-3599 — medições finalizaram no Fluig mas **não foram gravadas no Protheus** (002909/73095 e 002910/73096). Diagnóstico: "o provável acontecimento foi um **rollback inesperado**. Quanto ao rollback, **não temos ferramentas nem logs** para identificar o motivo." O cliente confirmou depois: "verifiquei as tabelas CND e CNE e as medições 000180 e 000181 **foram geradas. Porém foram deletadas**." A entrega foi **instrumentação de log** em `UGCTE001.DATA.TLPP` — explicitamente **não** a correção do defeito.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** (conclusão da medição) → **Histórico da solicitação**; conferência em **Tracker - Processos Compras/ Contratos** → *Filtrar por:* **Faturamento de Contratos** → filtros **Nº Medição** / **Situação Medição**; e em **Acompanhamento de Contratos** → *Informações do Contrato* → **Medição Acumulada**.

**Pré-condições**
- Um processo de Faturamento de Contratos levado até a gravação da medição.
- Acesso ao Tracker e ao Acompanhamento de Contratos.
- **Bloqueio:** confirmar a gravação nas tabelas **CND/CNE** exige credencial Protheus, que não existe nesta rodada. O rollback é da infraestrutura (TCloud) e **não tem nenhuma superfície no Fluig** — o Fluig só mostra que *ele* terminou, não que o ERP *manteve*. Este é o limite real do caso e está declarado.

**Passos**
1. Concluir o processo de medição no Fluig.
2. Abrir o **Histórico** do processo e conferir que a atividade de serviço da gravação registrou `Integração executada com sucesso - Tempo de Execução <N> s`.
3. Anotar o **Nº da Medição** exibido no formulário.
4. Abrir o **Tracker - Processos Compras/ Contratos**, selecionar *Filtrar por:* **Faturamento de Contratos** e pesquisar por **Nº Medição** (e, se preciso, **Nº Contrato** + **Competência do Contrato**).
5. Conferir que a medição aparece com **Situação Medição** coerente.
6. Abrir **Acompanhamento de Contratos** → contrato → ícone `title="Informações do Contrato"` → conferir que **Medição Acumulada** subiu e **Saldo do Contrato** desceu no valor da medição.
7. **No dia seguinte, repetir os passos 4 a 6** — o defeito original era gravar e depois desaparecer.

**Resultado esperado**
- O processo encerra no Fluig **e** a medição continua consultável no Tracker e refletida em *Medição Acumulada* / *Saldo do Contrato* na reconsulta posterior.
- O histórico registra o tempo de execução da integração.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Processo finalizado no Fluig, medição **ausente** no Protheus; registros criados nas tabelas **CND/CNE** e depois **deletados**, sem erro visível em tela e sem log que identifique o motivo (caso 002909/73095 e 002910/73096).

**Severidade:** Alta *(perda silenciosa de transação — a pior classe: não gera erro, não gera alerta, e só aparece na conferência financeira)*

**Preparação de massa:** um processo de medição completo, com contrato vigente e planilha, criado pelo executor. Para a verificação definitiva é preciso alguém com acesso às tabelas CND/CNE do Protheus, e — conforme orientação registrada no ticket — chamado no **TCloud** com data/hora/tabelas quando houver suspeita de rollback.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei no Tracker que, com *Filtrar por:* **Faturamento de Contratos**, o painel **Filtrar por - Informações da Medição** existe com os filtros literais **Fornecedor**, **CNPJ/CPF Fornecedor Planilha**, **Loja Fornecedor Planilha**, **Filial Contrato**, **Filial Medição**, **Nº Contrato**, **Competência do Contrato**, **Nº Medição**, **Situação Medição**, **Nº Planilha**, **Aprovador CSE**, **Fiscal de Serviço**, **Fiscal de Contrato** — é a superfície que permite conferir a persistência sem entrar no ERP. No modal do contrato confirmei **Saldo do Contrato:** e **Medição Acumulada:**.
**Divergências encontradas:** duas, uma delas séria. (1) **O botão "Pesquisar Registro" do Tracker não dispara requisição nenhuma** — cliquei com *Filtrar por:* em *Faturamento de Contratos*, *Solicitação de Compras* e *Cotação de Produtos/Serviços*, esperei 25-30 s em cada, e não houve **nenhuma** chamada de rede nem tabela renderizada (o único 4xx da página é o `403` do `nps/api/v1/surveys`, ruído do produto). Sem filtro preenchido o Tracker não pesquisa e também não avisa. Isso enfraquece justamente o passo de conferência deste caso. (2) **Achado no fonte publicado:** os hooks de movimentação das atividades de gravação da medição estão **vazios** — em `fat_App_App.js:96-110`, `if (numState == 114) { }` (*Gravar Medição*), `115` (*Correção - Gravar Medição*), `105` (*Gravar/Alterar Medição*) e `117` têm corpo em branco, tanto em `beforeSendValidate` quanto em `beforeSaveValidate`, e `handleView` não trata nenhum desses estados. **Com todas as letras: o Fluig não confere nada sobre a gravação da medição — ele segue adiante independentemente do que o ERP fez, o que é precisamente a condição que permite "finalizar no Fluig sem gravar no Protheus" passar despercebida.** As strings `Integração executada com sucesso` e `Tempo de Execução` não existem no fonte do formulário: elas vêm do motor de workflow, no Histórico — que continua sendo a única âncora confiável.
**Dados/massa usados:** nenhum — não submetido. Tracker e modal apenas consultados.

---

## CT-FSWTBC-3614  (ambos · Concluído · SDCASSI-187)

**Título:** Configurar contrato/planilha para medição automática e conferir que o processo de medição é aberto na competência esperada.

**Origem:** FSWTBC-3614 — nenhuma das **sete** combinações de contrato/planilha configuradas pelo cliente gerou medição: `00004-2023-1401` (atual, mensal); `00003-2023-1501` planilhas `000001` (futura, mensal), `000002` (passada, mensal) e `000003` (atual, OUTROS multiplicador 76); `00123-2024-5303` (atual, trimestral); `L0006-2024-2901` (futura, mensal, **sem saldo**); `C0001-2021-1601` (futura, mensal). Fechado como "Feito" em 3 dias, sem uma linha sobre causa.

**Módulo/Rota:** Protheus SIGAGCT (configuração `CNA_XPERIOD`, `CNA_XFREQU`, `CNA_XMULTI` e schedule) → efeito observável em Fluig → **Central de Tarefas** / **Tracker - Processos Compras/ Contratos** (*Faturamento de Contratos*).

**Pré-condições**
- Contratos configurados nas três competências (passada, atual, futura), nas periodicidades mensal, trimestral e **OUTROS com multiplicador**, incluindo um contrato **sem saldo**.
- Schedule de geração automática de medições habilitado.
- **Bloqueio: duplo.** (a) A configuração de competência/periodicidade é **do Protheus** (`CNA_XPERIOD`/`CNA_XFREQU`/`CNA_XMULTI`) e não há credencial. (b) **Não existe superfície nenhuma no Fluig para periodicidade** — sondei o formulário e o fonte publicado e não há campo, combo ou rótulo de *periodicidade*, *mensal*, *trimestral*, *multiplicador* ou *OUTROS*. **Declaro explicitamente: este caso não é validável pelo front-end do Fluig na sua causa; só o seu efeito (o processo nasceu ou não) é observável.** Rodar schedule também é vedado pelas regras do lote.

**Passos**
1. *(Protheus, por quem tem acesso)* Configurar a matriz do ticket: para cada contrato/planilha, definir competência (passada/atual/futura) e periodicidade (mensal / trimestral / OUTROS com multiplicador), incluindo o contrato sem saldo.
2. Aguardar a execução do schedule de geração automática de medições.
3. No Fluig, abrir o **Tracker - Processos Compras/ Contratos**, selecionar *Filtrar por:* **Faturamento de Contratos** e pesquisar por **Nº Contrato** + **Competência do Contrato** de cada linha da matriz.
4. Para cada processo encontrado, abrir o **Histórico** e conferir a origem automática da abertura.
5. Conferir na **Central de Tarefas** se a tarefa de medição chegou ao responsável.
6. Registrar, linha a linha da matriz, se a medição foi gerada.

**Resultado esperado**
- Uma medição gerada para cada configuração **elegível** — competência atual e passada geram; competência futura **não** deve gerar antes da data.
- Contrato **sem saldo** não gera medição (e isso é o comportamento correto, não falha).
- Contratos com periodicidade trimestral e OUTROS (multiplicador) respeitam o intervalo configurado.
- Três planilhas do mesmo contrato com configurações diferentes são tratadas **individualmente** (granularidade por planilha).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- **Nenhuma** das sete combinações gera medição; nenhum processo de Faturamento de Contratos aparece no Tracker nem tarefa na Central de Tarefas.

**Severidade:** Alta *(medição não gerada = faturamento do contrato não acontece no período)*

**Preparação de massa:** os sete contratos/planilhas da matriz do ticket, configurados no Protheus por quem tem acesso ao SIGAGCT, e a execução do schedule. **Nada disso é criável a partir do Fluig.** Sem isso o caso não sai do papel.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei que o formulário de Faturamento de Contratos tem o zoom **Competência do Contrato \*** (`zoomCompetencia`, alimentado pelo dataset `ds_fatcon_get_competencia` com `filterFields=CNA_CONTRA,<contrato>`) e que o Tracker permite filtrar por **Competência do Contrato**. Confirmei também que **não há** campo de periodicidade em lugar nenhum do front.
**Divergências encontradas:** (1) **Sem superfície de front-end para a causa** — zero ocorrências de `periodicidade`, `mensal`, `trimestral`, `CNA_XPERIOD`, `CNA_XFREQU`, `CNA_XMULTI` ou `multiplicador` no fonte publicado do formulário. O único vestígio de medição automática é o campo **oculto** `diaMedAutomatica` (sem rótulo em tela) e o dataset `ds_fatcon_get_medicaoAutomatica`, cujos `filterFields` são `CODIGOCONTRATO, FILIALCONTRATO, COMPETENCIA, CODIGOFORNECEDORLOJA, PLANILHAS, FILIALPLANILHA` — **periodicidade não entra no filtro**. (2) **Defeito ainda no fonte publicado**, e diretamente ligado à distinção manual/automático deste ticket: `fat_App_ViewHandler.js:110-113` contém `if (tipoInicioProcesso == 'manual' || 'automático') { that.EventHandler.loadInfoMedicao(); }` — como `'automático'` é uma string não vazia, **a condição é sempre verdadeira** e o front nunca distingue processo iniciado manualmente de processo iniciado pelo schedule. **Digo com todas as letras: esse erro de precedência está no fonte publicado hoje na base de homologação.**
**Dados/massa usados:** nenhum — nenhum dos sete contratos do ticket existe nesta base.

---

## CT-FSWTBC-3765  (ambos · Concluído · SDCASSI-225)

**Título:** Informar desconto no item de uma medição cujo contrato é de planilha fixa, e conseguir concluir a medição com o desconto aplicado.

**Origem:** FSWTBC-3765 — o Fluig não permitia inserir o **desconto** para medição de **planilha
fixa**. A trava que (corretamente) impede o aprovador de alterar quantidades e valores em planilha
fixa passou a bloquear também o campo de desconto. Levou três rodadas: reprovado em 30/01 ("não está
deixando aprovar a medição") e em 02/02 ("ainda não permite fazer a medição"), validado em 11/02.

**Módulo/Rota:** Fluig → **Processos → Iniciar Solicitações → Contratos → Faturamento de Contratos**
(`wf_faturamento_contratos`) → atividade **Realizar Medição do Contrato** → grade **Itens da
Medição** → coluna **Valor Desconto**.

**Pré-condições**
- Um contrato **vigente** cujo **Tipo de Planilha** tenha `CNL_CTRFIX = "1"` (fixa) — ou cujo
  `CNL_CTRFIX = "0"` e o **Tipo de Contrato** tenha `CN1_CTRFIX = "1"`.
- Uma medição própria **na atividade "Realizar Medição do Contrato"** (sequência **28** na versão
  atual do processo; **25** em instâncias antigas).
- **Bloqueio:** exige um contrato de planilha fixa **e** uma medição própria na atividade certa;
  contrato não é criável pela automação e não há credencial de Protheus para consultar `CNL_CTRFIX`.
  As medições visíveis nesta base são de terceiros e o §2 proíbe movimentá-las.

**Passos**
1. Iniciar **Faturamento de Contratos** e preencher os zooms encadeados **Nº do Contrato**,
   **Competência**, **Filial da Medição** e **Nº da Planilha**, escolhendo um contrato de planilha
   fixa.
2. Aguardar a grade **Itens da Medição** montar.
3. Conferir o estado da coluna **Quantidade** dos itens.
4. Conferir o estado da coluna **Valor Desconto** dos itens.
5. Digitar um valor de desconto **menor** que `Quantidade × Valor Unitário` em um item e sair do
   campo (blur).
6. Digitar um valor de desconto **maior** que `Quantidade × Valor Unitário` no mesmo item.
7. Conferir os botões **Importar Planilha** e **Baixar Modelo de Planilha**.
8. Encaminhar a medição e, na atividade **Aprovação Medição do Contrato**, tentar editar o
   **Valor Desconto**.

**Resultado esperado**
- Passo 3: em planilha fixa, **Quantidade** vem **preenchida com a quantidade do contrato e
  bloqueada** (readonly) — é a regra correta e deve permanecer.
- Passo 4: **Valor Desconto está EDITÁVEL** — este é o ponto do ticket. Com a quantidade preenchida
  e maior que zero, o campo tem de aceitar digitação mesmo em planilha fixa.
- Passo 5: o campo aceita o valor, formata na saída (inteiro vira duas casas: `5` → `5,00`) e o
  **Valor Total do Item** é recalculado como `Quantidade × Valor Unitário − Desconto`.
- Passo 6: aparece o *toast* de erro **"O valor do desconto não pode ser maior que o valor total."**,
  o desconto volta a **0** e o aviso é dado **uma vez por linha** (não um modal por tecla digitada).
- Passo 7: em planilha fixa, **Importar Planilha** e **Baixar Modelo de Planilha** ficam
  **desabilitados** (a planilha fixa não é importável) — e isso **não** pode impedir a digitação do
  desconto.
- Passo 8: a medição **avança e é aprovável**, com o desconto preservado; na atividade *Aprovação
  Medição do Contrato* o **Valor Desconto é somente leitura** (só a atividade de realização edita).

**Resultado se o defeito reincidir**
- O campo **Valor Desconto** nasce **readonly** junto com a **Quantidade** em planilha fixa, e o
  usuário simplesmente não consegue digitar o desconto — "o Fluig não permite inserir o desconto
  para medição de planilha fixa".
- Variante das reprovações de homologação: o desconto é aceito, mas a medição **não avança** —
  "não está deixando aprovar a medição".

**Severidade:** Alta *(o desconto é valor financeiro que vai para o pedido e para o saldo do
contrato)*

**Preparação de massa:** um contrato vigente **de planilha fixa** (`CNL_CTRFIX = "1"`, ou tipo de
contrato com `CN1_CTRFIX = "1"`), com planilha e itens, e uma medição aberta **pelo próprio
executor** para uma competência ainda não medida. Quem prepara precisa consultar o cadastro de
**Tipos de Planilha de Contrato** no Protheus para escolher um código fixo — no Fluig o valor chega
pelo dataset `dsProtheus_getTipoPlanContratos_restGetAll` e **não é exibido em tela**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a regra inteira, no **fonte publicado** do formulário **256836**, e o
estado real de instâncias do processo. O rótulo em tela é **"Valor Desconto"**
(`name="valorDesconto"`, `maxlength="18"`, prefixo `R$`), com asterisco vermelho no label mas
`data-required="false"`.
A trava vem de `EventHandler.handleQtdItem(codFilial)`, que consulta
`dsProtheus_getTipoPlanContratos_restGetAll` (`BRANCHID`, `CNL_CODIGO`) e decide:
`CNL_CTRFIX == "3"` ou `"2"` → **bloqueio 0 (liberado)**; `"1"` → **bloqueio 1 (bloqueado)**;
`"0"` → cai na regra do contrato (`CN1_CTRFIX`: `"1"` → 1, `"2"`/`"3"` → 0).
A correção do ticket é legível em `ViewHandler.handleChangesItem`, que decide o *readonly* do
desconto **pela quantidade**, não pelo `bloqueio` — `quantidade` vazia ou 0 → readonly; > 0 →
editável — e traz o comentário literal
`// input captura keyup + paste + autofill + mudanças programáticas do inputmask (planilha fixa)`.
Como em planilha fixa a quantidade **vem preenchida** com `CNE_QUANT`, o desconto fica editável.
A mensagem do passo 6 é literal (`UtilsHandler.toast`), com o comentário `SDCASSI-543` explicando
que o aviso passou a ser um por linha.
**Divergências encontradas:**
1. **Risco de regressão ainda presente no fonte publicado:** existe um **segundo caminho** em
   `EventHandler.loadInfoMedicao` (o ramo `else`, que roda quando a medição não é montada item a
   item) que ainda faz, para `bloqueio == 1`,
   `$('input#quantidade___N').prop({readonly:true})` **e**
   `$('input#valorDesconto___N').prop({readonly:true})` — isto é, **ainda trava o desconto junto com
   a quantidade**, que é exatamente o defeito original. Se esse ramo executar depois de
   `handleChangesItem`, o defeito volta. Não consegui determinar a ordem sem submeter, então
   **registro como risco lido no fonte, não como defeito observado** — e é o motivo de este caso
   valer a pena rodar em tela.
2. **O terceiro caminho que reabre o desconto é inalcançável em planilha fixa:**
   `processRowDataItens` faz `if (parseFloat(qtdMedir) > 0) valorDesconto.readonly = false`, mas essa
   função só roda na **importação da planilha de medição** — e o botão **Importar Planilha** está
   desabilitado justamente quando `bloqueio == 1`.
3. **O desconto só é editável em três atividades.** O último gate de `handleChangesItem` é
   `if (wk_NumState != 28 && wk_NumState != 25 && wk_NumState != 97) readonly = true`. Confirmei por
   dado que **28** e **25** são *"Realizar Medição do Contrato"* (28 é a atual, 25 a das instâncias
   antigas); **a 97 não aparece em nenhuma das 37 instâncias que inspecionei** e fica **não
   identificada**. Consequência prática: em *Aprovação Medição do Contrato* (**27**) o desconto é
   sempre somente leitura.
4. O label **"Valor Desconto"** exibe asterisco vermelho de obrigatório com `data-required="false"`.
5. Nas instâncias 81192/81193 o tipo de planilha é **"SEMI FIXA" (código 002)** — ou seja, **a base
   não tem, entre as medições que consegui inspecionar, uma planilha FIXA**; a massa exata do ticket
   precisa ser preparada.
**Dados/massa usados:** nenhum — nenhuma medição aberta, preenchida ou movimentada.

---

## CT-FSWTBC-3766  (fluig · Concluído · SDCASSI-226)

**Título:** Digitar um desconto sem vírgula na medição de planilha semi-fixa e conferir que o campo formata o valor corretamente ao sair.

**Origem:** FSWTBC-3766 — ao digitar o valor de desconto **sem vírgula**, o campo **perdia a máscara**. É o gêmeo funcional de FSWTBC-3765 (mesmo campo, planilha **fixa**, onde não permitia inserir): o próprio relator distinguiu os dois. Perder máscara em campo monetário é grave neste projeto — é o vetor dos erros de valor multiplicado por dez ou por cem já vistos em FSWTBC-2772 (30.500,00 × 30500.00) e FSWTBC-3657 (10.50 virando 1050).

**Módulo/Rota:** **Processos › Iniciar Solicitações › Faturamento de Contratos** (`wf_faturamento_contratos`), seção **Informações da Medição**, tabela de itens (`tblItensMedicao`), campo **Valor Desconto**.

**Pré-condições**
- Um contrato vigente com **planilha semi-fixa** (o tipo de planilha é o que define o comportamento de bloqueio da quantidade/desconto) e competência aberta para medição.
- O item da medição precisa ter **quantidade preenchida e maior que zero** — o campo **Valor Desconto** só é liberado quando a quantidade é informada.
- **Bloqueio:** sim. Não há, com a conta de QA, contrato com planilha semi-fixa e competência aberta que possa ser usado sem criar medição em contrato de produção. O formulário abre em branco, mas a tabela de itens só é preenchida depois de escolher contrato, competência e planilha.

**Passos**
1. Abrir **Processos › Iniciar Solicitações › Faturamento de Contratos**.
2. Preencher **Fornecedor**, **Nº do Contrato**, **Competência do Contrato**, **Filial da Medição** e **Nº da Planilha**, escolhendo uma planilha **semi-fixa**.
3. Aguardar a tabela de itens da medição carregar.
4. Numa linha, informar a **Quantidade** (maior que zero) e conferir que o campo **Valor Desconto** deixa de ficar somente leitura.
5. No campo **Valor Desconto**, digitar um valor inteiro **sem vírgula** — por exemplo `5`.
6. Sair do campo (**Tab** ou clique fora).
7. Conferir o valor exibido no campo e o **valor total do item** recalculado.
8. Repetir com `1500` e com `0`.
9. Digitar um desconto **maior que o valor total do item** (quantidade × valor unitário) e conferir a crítica.
10. Zerar a **Quantidade** e conferir o que acontece com o desconto.
11. **Não enviar** a solicitação.

**Resultado esperado**
- Ao sair do campo, o valor digitado sem vírgula é **reformatado com as casas decimais** no padrão brasileiro: `5` vira **`5,00`**, `1500` vira **`1.500,00`** — separador de milhar **ponto** e decimal **vírgula**.
- O campo **não** aceita sinal negativo e respeita o teto de máscara (`999.999.999,999999`).
- O **valor total do item** é recalculado com o valor **já formatado** — não com o texto cru digitado.
- Desconto maior que o total do item é recusado com **"O valor do desconto não pode ser maior que o valor total."** e o campo é **zerado**; o aviso aparece **uma vez por linha**, não a cada tecla.
- Com **Quantidade** zerada ou em branco, o **Valor Desconto** é zerado e volta a somente leitura.
- O campo aceita colagem e preenchimento automático sem perder a formatação.

**Resultado se o defeito reincidir**
- Ao digitar sem vírgula, o campo mantém o texto cru (`5`, `1500`) e a máscara monetária se perde. O risco não é cosmético: `1500` interpretado como `1.500,00` ou como `15,00` muda a medição em duas ordens de grandeza — foi o que ocorreu em FSWTBC-2772 e FSWTBC-3657.

**Severidade:** Alta *(campo monetário de medição de contrato; erro de máquina de escala altera diretamente o valor faturado ao fornecedor)*

**Preparação de massa:** um **contrato vigente com planilha semi-fixa** e **competência aberta para medição**, com itens que tenham quantidade e valor unitário — criado ou liberado por quem administra os contratos no ambiente. **Sem isso o caso não roda**: a tabela de itens da medição só se popula a partir da planilha do contrato, e o campo de desconto só se habilita com quantidade preenchida. Não crie medição em contrato de produção para forçar o cenário.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de **Faturamento de Contratos** (documento **256836**) abre por **Processos › Iniciar Solicitações › Faturamento de Contratos** e traz as seções **Identificação do Processo/Solicitante** e **Informações da Medição**, com os campos **Fornecedor \***, **Nº do Contrato \***, **Revisão \***, **Filial do Contrato\***, **Competência do Contrato \***, **Filial da Medição \***, **Tipo do Contrato\***, **Situação do Contrato\***, **Nº da Medição \***, **Nº da Planilha \***, **Objeto \***, **Aprovação Prévia CSE? \***, **Aprovador CSE \***, **Aprov. Fiscal de Serviço? \***, **Fiscal de Serviço \*** e **Fiscal de Contrato \***, mais as tabelas filhas **`tblItensMedicao`** e **`tblRateio`**. O campo alvo existe com o rótulo **"Valor Desconto \*"** (`valorDesconto`) na linha do item, ao lado de **Valor Unitário**, **Quantidade** e **Saldo a Medir**. No JavaScript do formulário, o campo tem máscara decimal com **separador de milhar ponto e decimal vírgula**, sem sinal negativo e com teto `999.999.999,999999`, **mais um tratamento explícito no evento de saída do campo** cujo comentário no código é literalmente *"Format value on blur so integers show decimal places (e.g., 5 -> 5,00)"* — que é a correção deste ticket. A crítica de desconto maior que o total e a limitação do aviso a uma vez por linha também estão implementadas. A tabela de itens **não** pôde ser populada (sem contrato/planilha disponível), então **a digitação não foi exercitada**.
**Divergências encontradas:** (a) o ticket trata do caso **semi-fixa**; em tela não há campo com esse nome — o comportamento decorre do **Tipo do Contrato** e do **Tipo de Planilha** vinculados ao contrato escolhido, o que significa que **quem for executar precisa saber de antemão qual contrato tem planilha semi-fixa**, porque a tela não anuncia isso. (b) O rótulo **Valor Desconto** aparece com **asterisco de obrigatório** na tela, mas o campo está declarado como **não obrigatório** no formulário — inconsistência de apresentação que vale reportar em separado.
**Dados/massa usados:** nenhum — formulário aberto em branco, nada preenchido, nada enviado.

---

## CT-FSWTBC-3771  (fluig · Concluído · SDCASSI-230)

**Título:** Confirmar que um processo iniciado na base de homologação não dispara e-mail para endereço de fornecedor externo.

**Origem:** FSWTBC-3771 — em 22/01/2026 um **fornecedor real** recebeu, da **base de QA**, e-mail de novo pedido para faturamento de competência 01/2025. O cliente pediu conferência da regra para não enviar a externos. Corrigido em 03/02/2026 **sem registro do mecanismo implementado**.

**Módulo/Rota:** Fluig — disparo de e-mail dos processos de Compras/Contratos. No `wf_solicitacao_compras`, atividade **185 - Disparo de E-mails** (com `187 - Captura de Erro - Disparo de E-mails` ao lado); no `wf_faturamento_contratos`, atividade **41 - Notifica Fornecedor** (e `123 - Correção - Notifica Fornecedor`). Configuração do servidor de e-mail: **Painel de Controle › WCM/Configurações › E-mail** (perfil administrador).

**Pré-condições**
- Ambiente **não-produtivo** (homologação/QA) identificado sem ambiguidade.
- Um fornecedor de teste cadastrado com e-mail de domínio **interno** e um segundo com domínio **externo**, para provar que o bloqueio distingue os dois.
- Acesso à caixa postal de destino, ou à trilha de envio do Fluig (log/relatório de e-mails enviados).
- Perfil **administrador** do Fluig para ler a configuração de e-mail em vigor.
- **Bloqueio:** **sim, três**. (a) Não há credencial de **administrador** — a configuração de e-mail do Fluig não é legível pela conta de QA. (b) Não há acesso a caixa postal de fornecedor. (c) O time **não registrou qual mecanismo** foi implementado (whitelist de domínio? bloqueio de SMTP fora de produção? flag por ambiente?), então o critério de aprovação do teste precisa ser definido antes de executá-lo — hoje não há como afirmar *o que* deveria acontecer com o e-mail: ser descartado, ser redirecionado a uma caixa-cofre ou ser enviado com assunto marcado.

**Passos**
1. Confirmar em qual ambiente se está (URL da base e identificação visível do ambiente).
2. Iniciar, na base de homologação, um processo que dispare e-mail a fornecedor — **Solicitação de Compras** até `185 - Disparo de E-mails`, ou **Faturamento de Contratos** até `41 - Notifica Fornecedor`.
3. Usar um fornecedor cujo e-mail seja de **domínio externo** (não corporativo).
4. Concluir a atividade que dispara o e-mail.
5. Verificar na caixa externa se algo chegou.
6. Verificar na trilha de envio do Fluig o destinatário efetivamente usado.
7. Repetir com fornecedor de domínio **interno** e confirmar que esse continua recebendo (o bloqueio não pode desligar o disparo por inteiro, senão o próprio fluxo deixa de ser testável).
8. Na aba **Histórico** da solicitação, conferir se `185` concluiu e se houve entrada em `187 - Captura de Erro - Disparo de E-mails`.

**Resultado esperado**
- **Nenhuma mensagem chega ao endereço externo** a partir da base de homologação.
- A trilha do Fluig mostra que o envio foi interceptado (descartado ou redirecionado), com registro do destinatário original.
- O disparo para destinatário interno continua funcionando — a proteção filtra, não desliga.
- Não há entrada em `187 - Captura de Erro - Disparo de E-mails` decorrente do bloqueio (o bloqueio não pode ser implementado como exceção de envio).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Um fornecedor real recebe, da base de QA, e-mail de novo pedido para faturamento — no caso original, de **competência 01/2025**, um ano antes. Evidência do ticket: `Screenshot_7.png`.

**Severidade:** Alta *(vazamento de comunicação a terceiro, com dado de competência antiga; pode induzir o fornecedor a faturar o que não existe, e compromete a credibilidade do processo fora da organização)*

**Preparação de massa:** dois fornecedores de teste com e-mail controlado — um de domínio interno e um de domínio externo cuja caixa o executor consiga abrir. **Antes disso**, o time precisa declarar qual mecanismo de contenção foi implantado em 03/02/2026; sem essa declaração o caso não tem critério de aprovação objetivo. Esta é a pendência mais relevante do ticket.

**Verificado em tela:** NÃO
**O que foi verificado:** confirmei apenas a existência das atividades de disparo nos dois processos, lendo o código servido: `disparoEmails: 185` e a atividade de captura de erro no `wf_solicitacao_compras`, e `41 - Notifica Fornecedor` / `123 - Correção - Notifica Fornecedor` no `wf_faturamento_contratos`. **Não** abri configuração de e-mail (exige administrador), **não** disparei e-mail e **não** tenho caixa postal de fornecedor. Nenhuma parte do comportamento sob teste foi observada.
**Divergências encontradas:** nenhuma de rótulo. Registro, porém, um achado de processo: o ticket foi encerrado **sem descrever a correção**, o que torna este caso não-escrevível como regressão objetiva — é o único item do lote em que o *resultado esperado* depende de informação que o time ainda não publicou.
**Dados/massa usados:** nenhum — nada foi enviado.

---

## CT-FSWTBC-3832  (fluig · Concluído · SDCASSI-245)

**Título:** Aprovar uma medição de contrato com planilha do tipo fixa, sem alterar valores, e confirmar que o processo avança.

**Origem:** FSWTBC-3832 — as medições **80954** e **81192**, com planilha **fixa**, não permitiam aprovar: o sistema exibia *"Para prosseguir com a medição será necessário informar valor ao menos em um item para ser medido"*. Em planilha fixa os valores vêm do contrato e o aprovador **não pode** alterá-los, então a validação — pensada para planilha semi-fixa — tornava a aprovação impossível. Terceiro defeito do mesmo conflito fixa × semi-fixa (com FSWTBC-3765 e 3766).

**Módulo/Rota:** **Faturamento de Contratos** (`wf_faturamento_contratos`), atividade **27 - Aprovação Medição do Contrato**, painel **Itens da Medição**; combo **Direcionar Processo para \*** para encaminhar.

**Pré-condições**
- Um contrato vigente com **planilha do tipo fixa** (`CNL_CTRFIX = "1"`, ou tipo de planilha `"0"` herdando `CN1_CTRFIX = "1"` do tipo de contrato).
- Uma medição desse contrato aberta na atividade `27 - Aprovação Medição do Contrato`.
- Perfil aprovador da medição, com a tarefa na Central de Tarefas.
- **Bloqueio:** **sim** — não há nenhuma tarefa de *Faturamento de Contratos* na Central de Tarefas da conta de QA (medido: 10 tarefas, todas de Solicitação de Compras e Cotação). Criar a massa exige contrato vigente com planilha fixa e competência aberta no Protheus, o que a conta não faz.

**Passos**
1. Abrir a medição em `27 - Aprovação Medição do Contrato` pela **Central de Tarefas**.
2. Confirmar, no cabeçalho, que o **Tipo de Planilha** do contrato é do tipo **fixa**.
3. No painel **Itens da Medição**, verificar o estado dos campos de **quantidade** de cada item.
4. Conferir que os valores dos itens vêm preenchidos a partir do contrato.
5. **Sem alterar nenhum valor**, marcar **Houve Prestação de Serviço? \*** conforme o caso real.
6. Selecionar o destino no combo **Direcionar Processo para \***.
7. Acionar o envio da tarefa.
8. Conferir a aba **Histórico** e confirmar que o processo saiu da atividade 27.
9. **Contraprova (planilha semi-fixa):** repetir em uma medição de contrato com planilha **semi-fixa**, deixando todos os itens **sem valor**, e confirmar que aí sim há crítica.

**Resultado esperado**
- Em planilha **fixa**, os campos de quantidade dos itens estão **somente leitura** — o aprovador não os edita, por regra de contrato.
- A aprovação **conclui**: nenhuma crítica exige "informar valor em ao menos um item".
- O processo avança para a atividade seguinte ao destino escolhido em **Direcionar Processo para**.
- Em planilha **semi-fixa**, a validação de preenchimento continua ativa — a correção não pode tê-la removido para todos os tipos.
- Quando **Houve Prestação de Serviço? = Sim** e não houver rateio informado, a crítica correta é sobre **centro de custo**, não sobre valor de item.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Mensagem de bloqueio literal do ticket: *"Para prosseguir com a medição será necessário informar valor ao menos em um item para ser medido"*, impedindo a aprovação de qualquer medição com planilha fixa (medições 80954 e 81192; evidência `imagem (7).png`).

**Severidade:** Alta *(bloqueia por completo a aprovação de medição de contratos com planilha fixa — trava faturamento e pagamento a fornecedor; e nasce de conflito entre duas regras de negócio, não de um erro pontual)*

**Preparação de massa:** **duas** medições em `27 - Aprovação Medição do Contrato`: uma de contrato com planilha **fixa** e outra com planilha **semi-fixa** (esta com itens sem valor, para a contraprova). Ambas dependem de contrato vigente, planilha vinculada e competência aberta no Protheus — precisam ser criadas por quem opere contratos, não pelo executor do teste.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no formulário do *Faturamento de Contratos* confirmei o painel **"Itens da Medição"**, o campo obrigatório **"Houve Prestação de Serviço? \*"** (`houvePrestServico`) e o combo obrigatório **"Direcionar Processo para \*"** (`validMed_enviarPara`) — este último é justamente o rótulo que o briefing manda usar no lugar de "botão Encerrar". No JS confirmei que **a distinção fixa × semi-fixa existe e é implementada**: `handleQtdItem()` consulta o dataset `dsProtheus_getTipoPlanContratos_restGetAll` e decide um flag `bloqueio` — `CNL_CTRFIX = "1"` → **bloqueado** (planilha fixa, quantidade não editável); `"2"` ou `"3"` → liberado; `"0"` → herda do tipo de contrato (`CN1_CTRFIX`: `"1"` bloqueia, `"2"`/`"3"` liberam). Adicionalmente, na *Aprovação Prévia* todos os campos `quantidade___N` são forçados a `readOnly` + `disabled`. **A verificação mais direta do ticket:** varri todo o código servido do processo (`fat_App_App.js`, `fat_App_EventHandler.js`, `fat_App_ViewHandler.js`, `fat_App_DataHandler.js` e o bundle do formulário) — a mensagem *"informar valor ao menos em um item para ser medido"* **não existe mais em lugar nenhum**, e o bloco de validação da atividade **27 (Aprovação Medição do Contrato) está hoje vazio**, sem nenhuma crítica. Ou seja, a validação que travava a aprovação foi removida do passo de aprovação.
**Divergências encontradas:** **duas.** (1) A única validação de "prosseguir com a medição" que sobrou hoje é **outra**, tem texto diferente e está em **outras atividades** — nas atividades **25 e 28 (Realizar Medição do Contrato)**, condicionada a **"Houve Prestação de Serviço? = Sim"**, com o texto *"Para prosseguir com a Medição sera necessário informar ao menos um centro de custo para cada item."*. Quem for reproduzir o ticket procurando a mensagem antiga não a encontrará, e pode confundir esta com aquela: **são regras distintas, em etapas distintas**. (2) A mensagem vigente tem erro de acentuação — **"sera"** sem acento.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3860  (ambos · Concluído · SDCASSI-247 · incidente 798520)

**Título:** Aprovar duas medições do mesmo contrato quase ao mesmo tempo e conferir que cada processo ficou com o seu número de medição e com o seu item.

**Origem:** FSWTBC-3860 — o cliente reportou que o processo **81192** fez a medição **000191** para o
**item 01**, mas o Protheus encerrou para o **item 003** (contrato **0002-2025-3504**). O diagnóstico
desfez a suspeita de cruzamento de dados: *"o processo 81192 gerou a medição 000193 e o processo
81193 gerou a medição 000191"* — não houve troca de item, houve **atribuição de número de medição
entre processos concorrentes**. O ticket explica o sintoma mas **não trata a causa**: se dois
processos concorrentes podem receber números fora da ordem esperada, o problema de numeração no job
permanece.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** (`wf_faturamento_contratos`), aba **Histórico**
e aba **Formulário** · **Tracker** (*Filtrar por:* **Faturamento de Contratos**) · **Logs Protheus**
→ aba **Medicoes ZZZ**.

**Pré-condições**
- Um contrato com **pelo menos dois itens** e saldo a medir em ambos.
- **Duas medições próprias** do **mesmo contrato**, **mesma competência** e **mesma filial**, cada uma
  para um item diferente.
- As duas aprovadas dentro da **mesma janela do job** (segundos entre si) — é a condição que produz o
  cenário.
- **Bloqueio:** exige criar e aprovar **duas** medições, escrita irreversível; as instâncias 81192 e
  81193 são de terceiros e o §2 proíbe movimentá-las. A conferência final (qual medição o Protheus
  encerrou para qual item) só é definitiva no ERP, sem credencial — mas **o cartão do processo no
  Fluig já responde**, como demonstrado abaixo.

**Passos**
1. Abrir os dois processos de medição e, em cada um, ler no formulário: **Nº do Contrato**,
   **Competência**, **Filial da Medição**, **Nº da Planilha** e o número da medição.
2. Na grade **Itens da Medição** de cada processo, identificar **qual item** tem valor total
   diferente de zero.
3. Na aba **Histórico** de cada processo, anotar o horário de encerramento da atividade
   **"Gravar/Encerrar Medição"** (sequência **105**; nas instâncias antigas, *"Gravar Medição"*).
4. Anotar também a entrada e a saída de **"Aguarda processamento Fila Protheus"** (sequência **182**;
   nas antigas, *"Aguarda Criar Pedido de Compras"*, seq. 160).
5. Cruzar: **o número de medição maior pertence ao processo que gravou por último**.
6. Abrir **Logs Protheus** → **Medicoes ZZZ**, filtrar por **Contrato** e conferir, linha a linha, as
   colunas **ID Fluig**, **Num Med**, **Filial Medic** e **Json Medicao**.
7. Abrir o **Tracker** em **Faturamento de Contratos** e conferir as colunas de medição por processo.

**Resultado esperado**
- Cada processo tem **um único** número de medição, e ele é **distinto** do número do outro processo.
- O item medido em cada processo é o que tem valor total diferente de zero — **não há troca de item
  entre os dois processos**.
- A ordem dos números de medição acompanha a ordem de **"Gravar/Encerrar Medição"**, **não** a ordem
  dos números de processo do Fluig. (Este é o ponto que o usuário confunde e que motivou o ticket.)
- Na **ZZZ**, cada `ID Fluig` aparece com **um** `Num Med`, e o `Json Medicao` da linha traz o item
  correto.
- Nenhum número de medição aparece em **dois** processos.

**Resultado se o defeito reincidir**
- O usuário lê, no processo **81192**, a medição **000191** e o **item 01**, e encontra no Protheus o
  encerramento para o **item 003** — a queixa literal do ticket. O sintoma reaparece quando duas
  medições concorrentes do mesmo contrato são processadas pelo job simultaneamente.
- Pior variante (não observada): o **mesmo** número de medição atribuído a dois processos.

**Severidade:** Alta *(medição errada é faturamento errado; a causa de numeração concorrente segue
sem correção registrada)*

**Preparação de massa:** duas medições do mesmo contrato/competência/filial, para itens diferentes,
criadas e aprovadas pelo próprio executor com poucos segundos de diferença. É a única forma de
reproduzir a janela de concorrência. **Não** repetir o cenário sobre as instâncias 81192/81193.

**Verificado em tela:** SIM
**O que foi verificado:** **a massa real do ticket existe nesta base e confirma o diagnóstico, campo
a campo.** Os dois processos respondem em `GET /process-management/api/v2/requests/{id}` como
`wf_faturamento_contratos`, iniciados em **03/02/2026**, status **FINALIZED**.
Do cartão (`?expand=formFields`, 163 campos cada):

| | **81192** | **81193** |
|---|---|---|
| `numMedicao` | **000193** | **000191** |
| `zoomNumContrato` | 0002-2025-3504 | 0002-2025-3504 |
| `zoomCompetencia` / `medContrCompetencia` | 02-2026 / 02/2026 | 02-2026 / 02/2026 |
| `zoomFilialMedicao` | 3504 - CLINICASSI SANTOS - SP | 3504 - CLINICASSI SANTOS - SP |
| `zoomNumPlanilha` | 000002 | 000002 |
| `descTipoPlanilha` | SEMI FIXA (cód. 002) | SEMI FIXA (cód. 002) |
| item medido | **`item___1` = 001**, `valorTotalItens___1` = **77.506,57** | **`item___2` = 003**, `valorTotalItens___2` = **1.872.986,56** |
| item não medido | `valorTotalItens___2` = 0,00 | `valorTotalItens___1` = 0,00 |
| `observacaoMedicao` | "Projetos executados conforme escopo contratado." | "Serviços realizados com o escopo contratado." |
| `saldoContrato` / `valTotalContrato` | 2.356.634,04 / 3.440.000,00 | idem |
| fornecedor | ATHIE WOHNRATH … 61379863000106 | idem |

Do histórico (`/tasks` e `/activities`), a **concorrência está medida**:
**81193** encerrou *Gravar Medição* às **04/02 13:20:31**; **81192** às **13:20:50** — 19 segundos
depois. E os dois saíram de *Aguarda Criar Pedido de Compras* no **mesmo tick do job**: **13:30:04** e
**13:30:05**. Isso confirma, por dado do próprio Fluig, o que o diagnóstico do ticket afirmou.
O contrato também confere em **Acompanhamento de Contratos**: `3504 | 048 - OBRAS E REFORMA |
0002-2025-3504 | 04/07/2025 | 29/06/2026 | 005 | Vigente | 61379863 - 0001`.
**Divergências encontradas:**
1. **O ticket inverte os fatos e o cartão prova.** O cliente escreveu "o processo 81192 fez a medição
   **000191** para o item 01". O cartão do 81192 diz `numMedicao = 000193` e o item medido é o **001**;
   quem tem a **000191** é o **81193**, e nele o item medido é o **003**. Não houve troca de item —
   os dois cartões estão internamente coerentes.
2. **A regra real é "o número segue o instante de gravação", não o número do processo.** 81193 gravou
   primeiro e ficou com o número menor. Como o usuário abriu o 81192 primeiro (11:53:36 vs 11:53:43),
   ele esperava o número menor nele. **Nada em tela explica isso** — e é a origem da confusão.
3. **Falta a 000192.** A sequência 000191 → 000193 pula um número entre dois processos gravados com
   19 segundos de diferença. O ticket não menciona; vale investigar quem ficou com a 000192.
4. **Os nomes das atividades mudaram desde o ticket:** *"Gravar Medição"* virou **"Gravar/Encerrar
   Medição"**, *"Encerrar Medição"* (seq. 36) **deixou de existir** como atividade própria, e
   *"Aguarda Criar Pedido de Compras"* (160) virou **"Aguarda processamento Fila Protheus"** (182).
   Um roteiro escrito com os nomes do ticket não bate com a tela de hoje.
5. O número do contrato aparece com **quatro** dígitos no primeiro bloco (`0002-2025-3504`), enquanto
   os vizinhos usam cinco (`00001-2025-3504`) — inconsistência de formatação na própria base.
**Dados/massa usados:** instâncias **81192** e **81193** e contrato **0002-2025-3504** — **somente
leitura** (API de consulta e tela de Acompanhamento). Nada movimentado, aprovado ou alterado.

---

## CT-FSWTBC-3864  (protheus · Concluído · SDCASSI-251)

**Título:** Concluir uma medição no Faturamento de Contratos de um contrato que passou por eliminação de resíduo e revisão, e conferir no Histórico que a medição encerra e o pedido é gerado

**Origem:** FSWTBC-3864 / incidente 798671 — o processo Fluig **81655** (Faturamento de Contratos, medição 002447, filial 5303) não encerrava a medição: *"Erro ao encerrar a medição"* no Fluig e, no ERP, *"a solicitação de compra já foi atendida no item 0001"*. Causa: a **rotina padrão de eliminação de resíduo não limpou `C1_QUJE`** da SC; após limpar o campo à mão, o pedido foi gerado. Contorno de dado; defeito do padrão depende de chamado na TOTVS matriz (sem registro).

**Módulo/Rota:** Fluig → *Central de Tarefas* → processo **Faturamento de Contratos** (`wf_faturamento_contratos`, hoje v52): 28 *Realizar Medição do Contrato* → **105 Gravar/Encerrar Medição** (serviço; é quem chama o encerramento no ERP) → 182 *Aguarda processamento Fila Protheus* → 162 *Pedido Gerado?* → 192 *Pagamento?* → 41 *Notifica Fornecedor* → 60 *Fim*; falha → **117 Correção**. Superfícies: *Detalhes da Solicitação* → aba **Histórico**; *Tracker* → visão **Faturamento de Contratos** (`table-fc`, filtro `numContrato`); *Logs Protheus* → aba **Medicoes ZZZ** (colunas *Contrato*, *Num Med*, *Status*, *Msg Medicao*, *Data Recb Me*, *Data Trat Me*). Contraprova ERP: SIGACOM → *Solicitação de Compras* → campo *Qtd. Já Entregue* (`C1_QUJE`) e *Eliminação de Resíduo* — nomes de menu **a confirmar no menu do cliente**.

**Módulo ERP (contraprova):** `Compras`

**Pré-condições**
- Contrato de homologação vigente com planilha, saldo a medir e SC vinculada ao item (`CNB_NUMSC`), que **já tenha passado** por eliminação de resíduo pela rotina padrão e depois por revisão (customização de tipo de planilha) — é a combinação que sujava `C1_QUJE`.
- Executor fiscal do contrato (atividade 28) e acesso de leitura ao Tracker e ao Logs Protheus.
- **Bloqueio:** a conta de QA não é fiscal de contrato e não tem credencial Protheus para executar a eliminação de resíduo/revisão; hoje o `genericQuery` do Logs Protheus responde 404 (ambiente).

**Passos**
1. No ERP (pré-condição), com a SC do item: executar *Eliminação de Resíduo* e, em seguida, a revisão do contrato; anotar `C1_QUJE` da SC.
2. No Fluig, abrir a solicitação de *Faturamento de Contratos* do contrato em *Realizar Medição do Contrato*; preencher a medição (item, quantidade 1, `QA` na observação) e, em **Direcionar Processo para**, escolher a etapa seguinte; enviar.
3. Aguardar *Gravar/Encerrar Medição* (105) e *Aguarda processamento Fila Protheus* (182); abrir *Detalhes da Solicitação* → **Histórico**.
4. Abrir *Logs Protheus* → aba **Medicoes ZZZ** → filtrar pelo contrato; ler *Status* e *Msg Medicao*.
5. Abrir o *Tracker* → visão *Faturamento de Contratos* → *Número do Contrato* = contrato → *Pesquisar Registro*; ler *Status* e *Atividade Atual*.
6. (ERP) Conferir que o pedido de compras foi gerado para a medição e que `C1_QUJE` da SC está zerado antes do encerramento.

**Resultado esperado**
- Passo 1: após a eliminação de resíduo, `C1_QUJE` da SC = **0** (o padrão limpa o campo).
- Passo 3: Histórico registra `Integração executada com sucesso - Tempo de Execução N s` em *Gravar/Encerrar Medição* e o processo sai da fila (182) em minutos (SLA medido de ~7 min), chegando a *Pedido Gerado?* / *Pagamento?* — **sem** linha `Erro ao encerrar a medição` e sem *Correção*.
- Passo 4: ZZZ com *Status* de sucesso e *Msg Medicao* sem erro para a medição.
- Passo 5: Tracker com *Atividade Atual* posterior à 182 e *Status* aberto/finalizado coerente com o Histórico.
- Passo 6: pedido gerado uma única vez para a medição.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Fluig: `Falha na Encerrar da Medição no ERP. code: 500 message: Erro ao encerrar a medição.` no Histórico, 3 tentativas e desvio para *Correção* (117); prints `Medicao_002447_Filial_5303.png` / `medicao_002447.jpeg`.
- ERP: *"a solicitação de compra já foi atendida no item 0001"* e `C1_QUJE` ≠ 0 mesmo após a eliminação de resíduo.

**Severidade:** Alta — bloqueia o pedido e o pagamento ao fornecedor (urgência declarada no ticket).

**Preparação de massa:** contrato de homologação + SC do item submetidos a eliminação de resíduo e revisão **no Protheus** (credencial obrigatória), e uma solicitação de Faturamento de Contratos aberta pelo fiscal — tudo com `QA`. Não reutilizar o 81655 (finalizado).

**Verificado em tela:** PARCIAL
**O que foi verificado:** (1) `GET /process-management/api/v2/requests/81655/tasks` → **200**: instância real, *Faturamento de Contratos* **v32**, 15 movimentos, aberta 05/02/2026 17:33 e finalizada 06/02/2026 17:17 — a sequência foi 88 *Busca Informações do Contrato* → 95 → 20 → 28 *Realizar Medição* → 105 *Gravar Medição* → 167 → 173 → 145 → 148 *Medição Gravada?* → 34 *Pagamento?* → **36 Encerrar Medição** → 160 *Aguarda Criar Pedido de Compras* → **162 Pedido Gerado? (admin, 05/02 17:45 → 06/02 17:17 — a janela em que `C1_QUJE` foi limpo à mão)** → 41 *Notifica Fornecedor* → 60 *Fim*; (2) `/portal/p/1/portal_logs_protheus` abre com as abas *Erros CV8 / Solicitacoes ZZY / Medicoes ZZZ*, botão *Consultar*, filtros de filial/data/mensagem — `genericQuery` em **404**, 0 tabelas; (3) Tracker abre com o select de processos (*Solicitação de Compras … Faturamento de Contratos …*), filtros *Número da Solicitação*, *Número do Contrato*, *Pesquisar Registro*; (4) mapa seq→nome lido de 1.000 movimentos atuais: 105 = **"Gravar/Encerrar Medição"**, 182, 162, 117, 192.
**Divergências encontradas:** (1) o ticket fala em "encerrar a medição" como rotina; no Fluig, na v32 (época do ticket) o encerramento era a atividade **36 "Encerrar Medição"** e hoje (v52) é a **105 "Gravar/Encerrar Medição"** seguida da fila 182 — o passo a passo precisa citar a 105; (2) a atividade "Criar Pedido de Compras" (36) do mapa anterior **não aparece** nos 1.000 movimentos mais recentes; (3) Logs Protheus indisponível (404) — ambiente.
**Dados/massa usados:** leitura da instância 81655 (contrato/medição 002447, filial 5303) — nada submetido.

---

## CT-FSWTBC-3881  (ambos · Concluído · SDCASSI-256)

**Título:** Informar desconto numa medição e conferir que ele chega ao Protheus e reduz o saldo do contrato.

**Origem:** FSWTBC-3881 — medições realizadas nos processos **9448** e **9450**, mas os **descontos
não refletiram no Protheus**. Fechado em 11/02/2026; **em 29/07/2026, cinco meses e meio depois, o
cliente reabriu a discussão no próprio ticket, com quatro prints: "ITEM PENDENTE! O valor do desconto
NÃO está sendo aplicado no saldo do contrato"** — sem reabertura formal. O tratamento definitivo só
veio nos pacotes de agosto/2026.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** → **Realizar Medição do Contrato** → coluna
**Valor Desconto** · **Acompanhamento de Contratos** → ícone **Informações do Contrato** → seção
*Valores Financeiros* (**Medição Acumulada**, **Saldo do Contrato**) · **Logs Protheus** →
**Medicoes ZZZ** (**Json Medicao**).

**Pré-condições**
- Um contrato vigente com saldo, e uma medição própria na atividade **Realizar Medição do Contrato**.
- Valor de **Saldo do Contrato** anotado **antes** da medição.
- **Bloqueio:** exige criar e aprovar uma medição (escrita irreversível). Os processos **9448** e
  **9450** do ticket **não existem nesta base** (`GET /requests/9448` e `/9450` → **HTTP 404**). A
  confirmação contábil final é do Protheus, sem credencial — mas **Saldo do Contrato** e **Medição
  Acumulada** aparecem no Fluig e são a asserção deste caso.

**Passos**
1. Em **Acompanhamento de Contratos**, localizar o contrato e abrir **Informações do Contrato**.
   Anotar **Saldo do Contrato** e **Medição Acumulada** (valores "antes").
2. Iniciar **Faturamento de Contratos** para esse contrato/competência.
3. Na grade **Itens da Medição**, informar a **Quantidade** e um **Valor Desconto** conhecido
   (ex.: `100,00`).
4. Conferir que o **Valor Total do Item** passou a ser `Quantidade × Valor Unitário − Desconto`.
5. Encaminhar a medição e aprová-la, acompanhando o **Histórico** até
   **"Gravar/Encerrar Medição"** (seq. 105) e **"Aguarda processamento Fila Protheus"** (seq. 182).
6. Depois do processamento, reabrir **Informações do Contrato** e comparar **Saldo do Contrato** e
   **Medição Acumulada** com os valores "antes".
7. Abrir **Logs Protheus** → **Medicoes ZZZ**, filtrar por **Contrato** e **ID Fluig**, e abrir o
   **Json Medicao** da linha; procurar o campo de desconto.
8. Ler a coluna **Msg Medicao** da mesma linha.

**Resultado esperado**
- Passo 4: o **Valor Total do Item** já reflete o desconto **no Fluig**.
- Passo 6: **Medição Acumulada** aumenta pelo valor **líquido** (com o desconto abatido) e
  **Saldo do Contrato** diminui pelo mesmo valor líquido. Esta é a asserção central: o desconto tem
  de **chegar ao saldo**.
- Passo 7: o **Json Medicao** enviado ao Protheus **contém o valor do desconto**.
- Passo 8: **Msg Medicao** não traz erro.

**Resultado se o defeito reincidir**
- O desconto é informado no Fluig, o processo conclui normalmente, **mas o valor não aparece no
  Protheus** — e, na reincidência de julho/2026, **o saldo do contrato não é reduzido pelo desconto**:
  *"ITEM PENDENTE! O valor do desconto NÃO está sendo aplicado no saldo do contrato"*.
- Sinal correlato registrado na análise: o cronograma financeiro (CNF) deixa de ser atualizado.

**Severidade:** Alta *(desconto não aplicado ao saldo do contrato é erro financeiro direto, e o
problema já reincidiu uma vez após o fechamento)*

**Preparação de massa:** um contrato vigente com saldo e planilha, uma medição criada pelo executor
para competência ainda não medida, e o registro do **Saldo do Contrato antes** da medição — sem esse
"antes" o passo 6 não é verificável. É preciso também que o contrato seja de um tipo em que o
desconto é editável (ver CT-FSWTBC-3765).

**Verificado em tela:** PARCIAL
**O que foi verificado:** o campo **"Valor Desconto"** existe no formulário de medição (fonte
publicado do formulário 256836) e o cálculo `Total = Quantidade × Valor Unitário − Desconto` está em
`handleUpdateItemTotalValue` / `handleMoneyChild`. Confirmei que **`saldoContrato`** é campo do cartão
do processo de medição — nas instâncias 81192/81193 ele vale **2.356.634,04** contra
`valTotalContrato` **3.440.000,00** — ou seja, **o saldo do contrato é observável dentro do Fluig**,
o que torna o passo 6 executável sem Protheus. A aba **Medicoes ZZZ** existe com as colunas
**Json Medicao** e **Msg Medicao**.
**Divergências encontradas:**
1. Os processos **9448** e **9450** citados no ticket **não existem nesta base** (HTTP 404) — a massa
   original não está disponível; é preciso preparar massa nova.
2. **O saldo lido no cartão da medição é o do momento da abertura, não um valor "ao vivo".** Nos
   dois processos de fevereiro `saldoContrato` está congelado no mesmo valor. Por isso o passo 6 usa
   o **modal do contrato**, e não o campo do cartão, para comparar antes/depois.
3. A aba **Medicoes ZZZ** não responde hoje (`genericQuery` 404) — ambiente. Os passos 7 e 8 ficam
   pendentes de uma janela em que ela funcione.
4. O ticket foi **fechado em fevereiro e teve pendência reaberta em julho sem reabertura formal**.
   Como o item consta `Concluído`, o caso afirma o comportamento correto — mas quem executar deve
   saber que **há registro do cliente de que ele ainda falhava em julho/2026**, e um vermelho aqui é
   mais provável que o normal.
**Dados/massa usados:** instâncias 81192/81193 apenas como referência do campo `saldoContrato` —
somente leitura. Nenhuma medição criada.

---

## CT-FSWTBC-3928  (ambos · Concluído · SDCASSI-270)

**Título:** Baixar a planilha padrão de itens da medição, preenchê-la e reenviá-la por upload no Faturamento de Contratos.

**Origem:** FSWTBC-3928 — a opção de **download/upload da planilha da medição** não estava
disponível no Fluig: *"clica no botão e não executa"* (exemplo: processo 82148). Funcionalidade
contratada da DEM10014371 — para contratos grandes (CAST, telefonia) o preenchimento item a item é
inviável. Tratado como emergencial (PR63045 / MUD17199, 24/02/2026), **sem causa raiz registrada**.

**Módulo/Rota:** Processo **Faturamento de Contratos** (`wf_faturamento_contratos`) → formulário da
medição → botão de download/upload da planilha de itens.

**Pré-condições**
- Uma instância de *Faturamento de Contratos* aberta, numa atividade em que a grade de itens da
  medição seja editável pelo executor.
- **Bloqueio:** não há instância de faturamento **do próprio executor** disponível; o briefing e a
  regra de escrita proíbem movimentar processo de terceiro para chegar à tela editável. Não foi
  possível clicar no botão.

**Passos**
1. Abrir a tarefa de *Faturamento de Contratos* na **Central de Tarefas**.
2. Localizar o botão de download da planilha de itens da medição e clicar nele.
3. Verificar que o arquivo é efetivamente baixado e que traz os produtos da medição preenchidos.
4. Alterar quantidades/valores na planilha e salvá-la **mantendo o nome original do arquivo**.
5. Usar a opção de upload para enviar a planilha preenchida.
6. Conferir a grade de itens após o upload. **Não** direcionar o processo.

**Resultado esperado**
- O clique no botão de download **produz um arquivo** (não fica inerte).
- O arquivo baixado contém os produtos da medição, não uma planilha vazia.
- O upload **importa** os valores para a grade e exibe confirmação.
- Se o arquivo enviado for rejeitado (nome, formato ou conteúdo), a tela **diz o motivo** — nunca
  fica em silêncio.

**Resultado se o defeito reincidir**
- Clicar no botão de download/upload **não executa nada**: sem download, sem erro, sem mensagem —
  o sintoma literal do SDCASSI-270.

**Severidade:** Média *(bloqueia o fluxo de medição em contratos de volume; sem a planilha o
faturamento é inviável na prática)*

**Preparação de massa:** uma instância de *Faturamento de Contratos* atribuída ao executor, com
contrato de **muitos itens** (o caso real citava CAST e telefonia), criada pela área de contratos.

**Verificado em tela:** NÃO
**O que foi verificado:** apenas que o processo *Faturamento de Contratos* (`wf_faturamento_contratos`)
está publicado. Nenhuma tarefa de faturamento estava disponível para a conta de QA na Central de
Tarefas, e abrir instância de terceiro para clicar no botão violaria a regra de escrita.
**Divergências encontradas:** o achado **A11-c** registra, no mesmo caminho de importação, que **só
o nome exato `Planilha de Medicao.xlsx` é importado** — `Planilha de Medicao (1).xlsx`, nome que o
navegador dá ao segundo download, **não faz nada e não avisa**; e que o botão se chama
*"Planilha de Itens"*, não "planilha da medição" como no ticket. O passo 4 acima foi escrito já com
essa restrição ("mantendo o nome original").
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3940  (fluig · Concluído · SDCASSI-275)

**Título:** Importar a planilha de itens (produtos) na medição de um contrato sem receber crítica indevida de campos obrigatórios.

**Origem:** FSWTBC-3940 / incidente 800682 — o upload da planilha de produtos na medição do processo 82721
falhava com **"Campos obrigatórios ausentes"**. O cliente registrou que reproduzia na base **TST** e que na
base **DES** funcionava — divergência entre ambientes que nunca teve causa raiz documentada.

**Módulo/Rota:** Processos → **Faturamento de Contratos** (`wf_faturamento_contratos`, form 256836) →
seção **Itens da Medição** → **Download Planilha de Itens Modelo** / **Upload Planilha de Itens Preenchida**

**Pré-condições**
- Uma medição em andamento, atribuída ao usuário, com **Fornecedor**, **Nº do Contrato**, **Competência do
  Contrato**, **Filial da Medição** e **Nº da Planilha** já selecionados nos zooms — os controles de upload
  só ficam visíveis depois dessa cadeia.
- Contrato vigente com saldo a medir e competência aberta no Protheus.
- **Bloqueio:** a conta de QA **não tem nenhuma tarefa de Faturamento de Contratos** na Central de Tarefas
  (as tarefas existentes são de SC, Cotação e Questionário CliniCASSI). Sem medição atribuída e sem os
  zooms resolvidos, os botões de upload permanecem ocultos e o cenário não pode ser exercido.

**Passos**
1. Abrir a tarefa de **Faturamento de Contratos** correspondente à medição.
2. Na seção **Informações da Medição**, selecionar **Fornecedor**, **Nº do Contrato**, **Competência do
   Contrato**, **Filial da Medição** e **Nº da Planilha**.
3. Na seção **Itens da Medição**, clicar em **Download Planilha de Itens Modelo** e salvar o arquivo `.xlsx`.
4. Preencher a planilha **sem alterar o layout do modelo**, com todos os itens que serão medidos, deixando
   preenchidos item, código do produto, quantidade e valor unitário.
5. Clicar em **Upload Planilha de Itens Preenchida** e enviar o arquivo (o campo aceita **somente `.xlsx`**).

**Resultado esperado**
- A planilha é aceita e a grade **Itens da Medição** é populada com as linhas do arquivo (colunas
  `Item | Cod. Produto | Desc. Produto | Saldo a Medir | Quantidade | Valor Unitário | Valor Desconto | Valor Total`).
- **Nenhuma** mensagem de campos obrigatórios ausentes é exibida para uma planilha gerada pelo próprio
  botão de download e preenchida sem alteração de layout.
- O comportamento é **idêntico nas bases TST e DES** — o mesmo arquivo importa nas duas.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O upload é recusado com a crítica de **"Campos obrigatórios ausentes"** (na implementação atual a
  mensagem é montada por linha, no formato `Linha N: campos obrigatórios ausentes (item, centro de custo
  ou classe de valor)`), mesmo com a planilha vinda do modelo — e a mesma planilha importa normalmente na
  outra base.

**Severidade:** Média *(bloqueia o fluxo de medição; não corrompe dado, mas trava o faturamento do contrato)*

**Preparação de massa:** uma medição de Faturamento de Contratos atribuída ao executor, sobre contrato
vigente com saldo a medir e competência aberta, mais o arquivo modelo baixado da própria tela. Depende de
massa do ERP que o QA não pode criar — precisa ser preparada pela área de Contratos.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário `wf_faturamento_contratos` (iframe `/webdesk/streamcontrol/256836/...`)
abre com as seções **Faturamento de Contratos**, **Identificação do Processo/Solicitante**, **Informações da
Medição**, **Itens da Medição**, **Validação do CSE - (Centro de Serviços Especializados)**, **Validação da
Medição do Contrato CSE** e **Validação do Fiscal de Contrato**. Os controles do caso existem: input
`fl_planilhaMedi` com `accept=".xlsx"` e os botões `btnDownLoadModeloPlanilhaMed`
(**"Download Planilha de Itens Modelo"**) e `btnImportPlanilhaMed` (**"Upload Planilha de Itens Preenchida"**)
— todos presentes no DOM porém **não visíveis** no formulário em branco. No JavaScript servido do
formulário, a validação do upload existe e é exatamente a do ticket:
`if (!item || !centroCusto || !classeValor) motivo = "campos obrigatórios ausentes (item, centro de custo ou classe de valor)"`,
emitida como `` `Linha ${i+1}: ${motivo}` ``, sob o comentário
`//COMMENT NOTE: ** Validação dos itens obrigatorios na planilha **`. Nenhum arquivo foi enviado.
**Divergências encontradas:** o ticket diz "planilha de produtos"; na tela o par de botões se chama
**Planilha de Itens** (`.xlsx`), e existe um segundo par, distinto, para **Planilha de Rateio** (`.csv`,
`fl_planilha`) — confundir os dois leva a testar o controle errado. Além disso, a mensagem citada no ticket
("Campos obrigatórios ausentes") é hoje **prefixada pelo número da linha** e enumera quais campos faltam;
o texto solto do ticket já não corresponde ao que a tela emite. A divergência **TST × DES** apontada pelo
cliente não é verificável daqui — só há acesso a este ambiente.
**Dados/massa usados:** nenhum — nenhum arquivo enviado, nenhuma medição movimentada.

---

## CT-FSWTBC-3956  (ambos · Concluído · SDCASSI-278)

**Título:** Medir o tempo de geração e encerramento das medições de um contrato de alto volume e confirmar que os demais processos do contrato não ficam bloqueados.

**Origem:** FSWTBC-3956 — a correção de 27/02 passou a gerar as medições **uma a uma** (serialização,
para evitar concorrência) e o cliente **validou a correção mas reprovou o resultado prático**, com
números: *"o tempo de execução da geração das medições e do encerramento NÃO É VIÁVEL, visto que
demais processos do mesmo contrato ficaram BLOQUEADOS até a finalização de todas as medições. Cada
medição demora em torno de 10 MINUTOS, então contratos como o de telefonia, que contêm MAIS DE 100
MEDIÇÕES, iriam demorar MAIS DE 15 HORAS."* O contorno também falhou: *"cadastrar o Schedule como
Permanente não funcionou pois ele não finaliza a medição, fica eternamente no status A"*.
Encerrado por consolidação no SDCASSI-286 — **com o problema de performance em aberto**.

**Módulo/Rota:** `wf_faturamento_contratos` + schedule de medição Protheus · superfícies:
**Logs Protheus → aba `Medicoes ZZZ`** (coluna `Qtd T.Env Fl`) e **Tracker → *Faturamento de Contratos***.

**Pré-condições**
- Um contrato de **alto volume** (referência do ticket: > 100 medições, caso telefonia) com o ciclo
  de faturamento disparado.
- Um segundo processo do **mesmo contrato**, aberto durante a execução, para medir o bloqueio.
- **Bloqueio:** exige disparar schedule Protheus, expressamente **proibido** pelo briefing
  ("não rode rotinas batch, schedules ou apropriações contábeis"), e credencial Protheus para ler o
  status do schedule. Executável só em janela combinada com o time de infra.

**Passos**
1. Registrar o horário de início do ciclo de faturamento do contrato de alto volume.
2. Abrir **Logs Protheus → `Medicoes ZZZ`**, filtrar filial e o dia, e **Consultar**.
3. Acompanhar a progressão dos estados da fila (**N → A → M → F → P**, com **E** em erro) e cronometrar
   quantas medições saem por hora.
4. Durante a execução, abrir **outro processo do mesmo contrato** (ex.: uma nova medição ou uma
   consulta pelo Tracker, visão *Faturamento de Contratos*) e verificar se ele progride.
5. Ao fim, comparar o tempo total com o volume de medições do contrato.
6. Confirmar que nenhum registro ficou parado em **status `A`**.

**Resultado esperado**
- As medições são processadas em ritmo compatível com o volume — um contrato de 100+ medições
  **não** leva mais de 15 horas.
- Processos do **mesmo contrato** continuam trafegando enquanto a fila roda: não há bloqueio global
  por contrato.
- **Nenhum** registro permanece **eternamente em status `A`**; todo item termina em `F`/`P`, ou em
  `E` com erro visível.
- A aba `Medicoes ZZZ` mostra o avanço da fila e `Qtd T.Env Fl` não cresce indefinidamente.

**Resultado se o defeito reincidir**
- ~**10 minutos por medição**, demais processos do contrato **bloqueados** até o fim do lote, e
  contratos de 100+ medições exigindo **mais de 15 horas**; com o schedule Permanente, medições
  **paradas em status `A`** para sempre.

**Severidade:** **Alta** *(inviabiliza o faturamento de contratos de volume — impacto financeiro
direto e bloqueio operacional do contrato inteiro)*

**Preparação de massa:** um contrato com **mais de 100 planilhas/medições** em medição automática
(o de telefonia é o exemplo do próprio ticket) e uma janela de execução acordada com infra, mais
acesso ao monitor de schedule do Protheus. Nada disso é montável pela conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a aba **`Medicoes ZZZ`** existe no widget *Logs Protheus*, com os filtros
de filial, data inicial/final e *"Mensagem, detalhe ou processo"*, e o Tracker oferece a visão
*Faturamento de Contratos*. A execução cronometrada não foi feita — disparar schedule é proibido.
**Divergências encontradas:** a grade de `Medicoes ZZZ` **não carrega hoje** (`genericQuery` 404),
então a superfície de medição existe mas está cega. O achado **A16** mediu, em 04/09/2026, **3
instâncias de Faturamento paradas em "Aguarda processamento Fila Protheus" desde 14–17/08/2026** e
**7 em "Correção"** — indício de que o problema de fila/performance **segue vivo**, apesar do
encerramento do ticket.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3959  (protheus · Concluído · SDCASSI-281)

**Título:** Revisar um contrato com realinhamento de valor e conferir, no Protheus e no Acompanhamento de Contratos, que Quantidade, Quantidade Medida e Saldo dos itens da planilha ficam coerentes com o que já foi medido

**Origem:** FSWTBC-3959 — ao alterar o valor de um item, a **redistribuição automática** recalculava e gravava valores incorretos em *Quantidade*, *Quantidade Medida* e *Saldo*. Reconstituição do contrato `00003-2022-1101`: antes, planilha 000001, item 001 com 39 × 4.594,00 (2 parcelas medidas, saldo 37); depois da revisão 002, item 001 **encerrado** com 2 × 4.594,00 e novo item 002 com 37 × 4.900,00. Causa final: **parametrização** do tipo de contrato (*Realinha Med* e *Reajusta Med* em Sim gera valores inconsistentes **sem alerta**). "Não será feito".

**Módulo/Rota:** Fluig → *Acompanhamento de Contratos* (`/portal/p/1/acompanhamentoContrato`) → filtrar pelo contrato → planilha → itens (dataset `dsProtheus_getItensPlanilha_restGetAll`, colunas `CNB_QUANT`, `CNB_QTDMED`, `CNB_SLDMED`, `CNB_VLUNIT`, `CNB_VLTOT`, `CNB_QTDORI`); *Tracker* → visão *Faturamento de Contratos*; formulário de *Faturamento de Contratos* → *Itens da Medição* / *Saldo a Medir*. Origem do dado: Protheus → SIGAGCT → *Contratos* → *Revisão* (realinhamento/aditivo) e *Tipos de Contrato* (`CN1_CREALM` *Realinha Med*, *Reajusta Med*) — nomes de menu **a confirmar no menu do cliente**.

**Módulo ERP (origem):** `Contratos - GCT`

**Pré-condições**
- Contrato de homologação vigente com planilha de 1 item (ex.: 39 × R$ 4.594,00) e **2 medições já realizadas** (Quantidade Medida = 2, Saldo = 37).
- Tipo de contrato com *Realinha Med* / *Reajusta Med* conforme o cenário (Sim/Sim é a combinação que gerava inconsistência).
- **Bloqueio:** a revisão com realinhamento só pode ser executada no Protheus (sem credencial nesta rodada); o contrato do ticket **não existe neste tenant**. A leitura no Fluig é consultiva e está disponível.

**Passos**
1. No Fluig, *Acompanhamento de Contratos* → filtrar pelo contrato → abrir a planilha → anotar, por item, Quantidade, Quantidade Medida, Saldo, Valor Unitário e Valor Total (**antes**).
2. No Protheus, executar a *Revisão* de realinhamento alterando o valor unitário do item (ex.: 4.594,00 → 4.900,00) e efetivar.
3. No Fluig, repetir o passo 1 (**depois**) — atualizar a página; a lista pode oscilar entre 845 linhas e "0 de 0 registros" (ambiente).
4. Conferir a aritmética: item encerrado (qtd = medido = 2, saldo 0) e item novo (qtd = 37, medido = 0, saldo = 37); valor total do novo = 37 × 4.900,00 = 181.300,00.
5. Abrir uma solicitação de *Faturamento de Contratos* do contrato (sem enviar) e ler *Saldo a Medir* / *Itens da Medição*.
6. (Protheus) Repetir 2–4 com o tipo de contrato em *Realinha Med = Sim* e *Reajusta Med = Sim*.

**Resultado esperado**
- Passo 4: Quantidade Medida nunca excede Quantidade; Saldo = Quantidade − Quantidade Medida em **todos** os itens; soma dos totais = valor da revisão.
- Passo 5: *Saldo a Medir* igual ao saldo lido no Acompanhamento.
- Passo 6: a combinação Sim/Sim **ou** produz os mesmos valores coerentes **ou** é bloqueada/alertada no cadastro do tipo — nunca grava valores inconsistentes em silêncio.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Após a revisão, Quantidade / Quantidade Medida / Saldo gravados com valores que não fecham (ex.: saldo diferente de quantidade − medido, ou medido > quantidade), sem alerta — evidência `imagem.jpg` do ticket (baixa resolução).

**Severidade:** Alta — saldo errado altera o que pode ser medido e pago.

**Preparação de massa:** contrato de homologação com 1 item e 2 medições encerradas, preparado no Protheus pelo executor (credencial obrigatória, `QA`); a revisão é irreversível — nunca sobre contrato real. O Fluig só lê.

**Verificado em tela:** PARCIAL
**O que foi verificado:** `/portal/p/1/acompanhamentoContrato` abre (título *"Cassi - Fluig Plataforma - Acompanhamento de Contratos"*, 3 tabelas, **845 linhas**, paginação *Primeiro/Anterior/Próximo/Último*, campo *Filtrar*); `dsProtheus_getItensPlanilha_restGetAll` responde no GET search com **86 colunas**, entre elas `CNB_QUANT`, `CNB_QTDMED`, `CNB_SLDMED`, `CNB_QTDORI`, `CNB_VLUNIT`, `CNB_VLTOT`, `CNB_NUMSC`; o POST com constraints (`CorporateId/BranchId/CN9_NUMERO/CN9_FILIAL/CN9_REVISA`, como o widget faz) devolveu **0 colunas** nesta rodada (intermitência do ERP — ambiente). O contrato `00003-2022-1101` **não existe** nas 963 linhas.
**Divergências encontradas:** (1) o ticket fala em "Quantidade Medida" e "Saldo"; no dataset os campos são `CNB_QTDMED` e `CNB_SLDMED` — os rótulos do modal de itens não foram lidos em tela; (2) o contrato do ticket não está neste tenant.
**Dados/massa usados:** leitura dos datasets de contratos e itens — nada submetido.

## CT-FSWTBC-3985  (fluig · Concluído · SDCASSI-284)

**Título:** Importar a planilha de rateio no Faturamento de Contratos e conferir que as linhas são efetivamente registradas.

**Origem:** FSWTBC-3985 / incidente 801444 — a importação da planilha de rateio parou de funcionar em modo
**silencioso**: o sistema anexava a planilha, não exibia erro nenhum, mas **não registrava as linhas do
rateio**. O usuário seguia o processo acreditando que o rateio existia.

**Módulo/Rota:** Processos → **Faturamento de Contratos** (`wf_faturamento_contratos`, form 256836) →
seção de **Rateio Contábil** → **Download Planilha de Rateio Modelo** / **Upload Planilha de Rateio Preenchida**

**Pré-condições**
- Uma medição em andamento atribuída ao usuário, com os zooms de **Fornecedor**, **Nº do Contrato**,
  **Competência do Contrato** e **Filial da Medição** resolvidos e com **itens já carregados**.
- Centros de custo e classes de valor válidos para compor o rateio.
- **Bloqueio:** a conta de QA não tem tarefa de Faturamento de Contratos; os botões de rateio existem no
  DOM mas não ficam visíveis sem a medição em contexto. Não é possível exercer o upload nesta rodada.

**Passos**
1. Abrir a tarefa de **Faturamento de Contratos** e resolver os zooms da seção **Informações da Medição**.
2. Carregar os itens da medição (seção **Itens da Medição**).
3. Na área de rateio, clicar em **Download Planilha de Rateio Modelo** e salvar o arquivo `.csv`.
4. Preencher a planilha com, no mínimo, **duas linhas de rateio para o mesmo item**, em centros de custo
   diferentes, cujos percentuais **somem exatamente 100%** — informando item, percentual, centro de custo e
   classe de valor em todas as linhas.
5. Clicar em **Upload Planilha de Rateio Preenchida** e enviar o arquivo (o campo aceita **somente `.csv`**).
6. **Sem recarregar a página**, conferir a grade de **Rateio Contábil**.

**Resultado esperado**
- A grade de **Rateio Contábil** passa a exibir **uma linha para cada linha da planilha**, com as colunas
  **Item**, **% Rateio**, **Centro de Custo** e **Classe de Valor** preenchidas com os valores do arquivo.
- O número de linhas na grade é **igual** ao número de linhas úteis da planilha — nenhuma some.
- Se a planilha tiver problema, o sistema **avisa**: exibe a crítica identificando a linha
  (`Linha N: …`) e **não** aceita o arquivo em silêncio.
- Ao tentar gravar com o rateio incompleto, a validação de somatório dispara
  (*"A soma dos percentuais de rateio não pode ser inferior a 100%."* / *"…não pode ultrapassar 100%."*).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A planilha é anexada **sem nenhuma mensagem de erro**, mas a grade de rateio permanece **vazia**. O
  processo segue adiante com rateio inexistente, e o problema só aparece muito depois, como erro de
  somatório ou distribuição errada de centro de custo.

**Severidade:** Alta *(falha silenciosa em importação de dados contábeis — distribuição errada de centro de custo, detectável só na inconsistência posterior)*

**Preparação de massa:** uma medição de Faturamento de Contratos atribuída ao executor, com itens
carregados, e uma planilha de rateio `.csv` derivada do modelo da própria tela, com ao menos dois centros
de custo somando 100%. Depende de contrato vigente com competência aberta — massa de responsabilidade da
área de Contratos.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no formulário 256836 confirmei o input `fl_planilha` com `accept=".csv"` e os
botões `btnDownLoadModeloPlanilha` (**"Download Planilha de Rateio Modelo"**), `btnImportPlanilha`
(**"Upload Planilha de Rateio Preenchida"**), `btnAdicionarRateio` (**"Adicionar Rateio"**) e
`btnDelItensRateio` (**"Remover Todos os Rateios"**) — presentes no DOM, não visíveis no formulário em
branco. No JavaScript servido do formulário estão as validações que sustentam o resultado esperado: no
upload, `` `Linha ${i+1}: campos obrigatórios ausentes (item, centro de custo ou classe de valor)` ``,
`` `Linha ${i+1}: percentual de rateio inválido (zerado ou em branco)` ``,
`` `Linha ${i+1}: duplicada (Item …, CC …, Classe …)` `` e `Item excedeu 100%`; na gravação,
*"A soma dos percentuais de rateio não pode ultrapassar 100%."*, *"…não pode ser inferior a 100%."* e
*"Existem campos de rateio sem preenchimento! Favor preencher todos os campos e tente novamente."* A
precisão usada na comparação é de 8 casas (`listDecimal.rateio = 8`). Nenhum arquivo foi enviado.
**Divergências encontradas:** o ticket diz "importação de planilha de rateio **no processo de Faturamento de
Contratos**", e isso confere — mas **o mesmo par de botões existe também no formulário da SC** (256831), com
rótulos idênticos. Quem testar pelo nome do botão pode acabar validando o controle da SC em vez do da
medição. Registrado também que, em rodada anterior deste projeto, o **Download Planilha de Rateio Modelo**
foi clicado no formulário em branco e **não disparou download em 25 s** — o layout do modelo segue não
confirmado, o que enfraquece o passo 3.
**Dados/massa usados:** nenhum — nenhum arquivo enviado, nenhuma medição movimentada.

---

## CT-FSWTBC-3988  (fluig · Concluído · SDCASSI-285)

**Título:** Após importar a planilha na medição, conferir que os valores dos itens continuam sendo exibidos.

**Origem:** FSWTBC-3988 / incidente 801444 — **regressão** atribuída pelo próprio cliente à correção
anterior ("após subirmos a correção de importação de planilha na medição"): as SCs 82148, 82149 e 82150
passaram a exibir os **valores zerados**. Mesmo incidente e mesma MUD emergencial do FSWTBC-3985.

**Módulo/Rota:** Processos → **Faturamento de Contratos** (`wf_faturamento_contratos`, form 256836) →
seção **Itens da Medição**

**Pré-condições**
- Uma medição com itens carregados e com **planilha importada** (é a importação que dispara o cenário).
- Valores unitários e quantidades conhecidos previamente, para comparação.
- **Bloqueio:** mesma limitação dos casos 3940 e 3985 — sem medição atribuída à conta de QA, a seção de
  itens não é exercitável.

**Passos**
1. Abrir a tarefa de **Faturamento de Contratos** e resolver os zooms da seção **Informações da Medição**.
2. Anotar, antes de qualquer importação, os valores esperados de **Quantidade**, **Valor Unitário** e
   **Valor Total** dos itens.
3. Importar a planilha (**Upload Planilha de Itens Preenchida** e/ou **Upload Planilha de Rateio Preenchida**).
4. Conferir a grade **Itens da Medição** imediatamente após a importação.
5. Sair do formulário, reabrir a mesma medição e conferir a grade novamente.

**Resultado esperado**
- Na grade **Itens da Medição**, as colunas **Saldo a Medir**, **Quantidade**, **Valor Unitário**,
  **Valor Desconto** e **Valor Total** exibem os valores corretos — **nenhuma delas zerada**.
- **Valor Total** de cada item é coerente com `Quantidade × Valor Unitário − Valor Desconto`.
- Os valores **persistem** após sair e reabrir a medição — não é apenas exibição de tela.
- A importação da planilha **não altera** valores de itens que não estavam no arquivo.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Os valores aparecem **zerados** na visualização da medição depois da importação, como ocorreu nas SCs
  82148, 82149 e 82150 — a medição fica sem base de cálculo para faturamento.

**Severidade:** Alta *(risco financeiro direto — medição com valor zerado é faturamento errado; e é regressão conhecida de correção emergencial)*

**Preparação de massa:** uma medição de Faturamento de Contratos com itens de valor conhecido, atribuída ao
executor, sobre contrato vigente. Idealmente executar o caso **antes e depois** de qualquer correção que
toque a importação de planilha — é exatamente o ciclo emergencial em que a regressão nasceu.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei a existência da seção **Itens da Medição** no formulário 256836 e a
grade `tblItensMedicao` com as colunas **Item \***, **Cod. Produto \***, **Desc. Produto \***,
**Saldo a Medir \***, **Quantidade \***, **Valor Unitário \***, **Valor Desconto \*** e **Valor Total \***
(campos `saldoMedirQtd`, `quantidade`, `valorUnitario`, `valorTotalItens`) — ou seja, os campos onde o
"zerado" se manifestaria existem e estão nomeados. Não foi possível carregar itens reais: sem medição
atribuída à conta, a grade não popula.
**Divergências encontradas:** o ticket fala em "SCs 82148, 82149 e 82150", mas o objeto do defeito é uma
**medição** de Faturamento de Contratos, não uma Solicitação de Compras — numeração e nomenclatura do
ticket misturam os dois processos. Além disso, essas numerações são de outra base: as instâncias atuais
estão na faixa 112.9xx–113.2xx.
**Dados/massa usados:** nenhum — nada importado, nada movimentado.

---

## CT-FSWTBC-3989  (ambos · Concluído · SDCASSI-286)

**Título:** Acompanhar a fila de medição (ZZZ) drenando de ponta a ponta, com a máquina de estados N→A→M→F→P e erro visível.

**Origem:** FSWTBC-3989 — processos de faturamento presos na etapa de integração (84075, 84128,
83272). Causa raiz apurada na subtarefa 3991: o scheduler **UGCTE017** disparava workers IPC via
`ManualJOB`, mas **todos travavam com "SX6 not open for GetMV"** antes de processar qualquer medição
— o framework IPC abre SX2 e **não** abre SX6, e a condição original `Select('SX2')<=0` nunca
acionava o `RpcSetEnv`. Sem ambiente, o worker não lia parâmetro nem abria a ZZZ; registros com
`ZZZ_STATUS='N'` **nunca saíam do estado inicial** e o scheduler os reencontrava a cada ciclo —
**loop infinito silencioso**. Foram **seis rodadas de patch em dois meses**; a refatoração **V3.0**
(07/05) isolou cada item da ZZZ em thread própria via `StartJob(.T.)` e criou a **máquina de estados
explícita N→A→M→F→P, com E em qualquer erro**, além de gravar `UGCTE017_VERSAO 'V3.0'` em todos os
logs — reconhecimento explícito de que o time não distinguia "patch não aplicado" de "patch aplicado
e ainda com defeito". Também houve ajuste do parâmetro **MV_CIFCF** (CardIndex do formulário Fluig da
fila) de 475815 para **566882**.

**Módulo/Rota:** schedule **UGCTE017** (+ UGCTE001, UGCTE018, LIBFLUIG) sobre a fila **ZZZ** ·
superfícies no Fluig: **Logs Protheus → aba `Medicoes ZZZ`** e **Tracker → *Faturamento de Contratos***.

**Pré-condições**
- Registros na fila ZZZ em estado inicial (`N`) para uma filial com medições pendentes.
- Schedule UGCTE017 na versão **V3.0** configurado — e **é o UGCTE017**, não o UCOME038
  (o próprio ticket registra que o cliente configurou a rotina errada).
- **Bloqueio:** sem credencial Protheus não se lê a ZZZ pelo APSDU nem se confere a versão do
  schedule; e disparar schedule é proibido. Restam as superfícies de leitura no Fluig — que hoje
  respondem 404 no `genericQuery`.

**Passos**
1. Abrir **Logs Protheus → `Medicoes ZZZ`**, filtrar filial e o intervalo de datas (**ISO**), **Consultar**.
2. Registrar os itens em estado inicial e o valor de **`Qtd T.Env Fl`** de cada um.
3. Aguardar um ciclo do schedule e **repetir a consulta**.
4. Verificar a progressão de estados **N → A → M → F → P** e a ausência de itens presos em `N`.
5. Para itens em **`E`**, confirmar que há **mensagem de erro legível** associada.
6. Conferir no log a marca de versão **`V3.0`** do UGCTE017.
7. No **Tracker → *Faturamento de Contratos***, conferir que as instâncias correspondentes saíram de
   *"Aguarda processamento Fila Protheus"*. **Consulta apenas.**

**Resultado esperado**
- Nenhum item permanece em **`N`** entre dois ciclos consecutivos do schedule.
- Todo item termina em **`F`/`P`** ou vai para **`E` com erro descrito** — nunca desaparece em silêncio.
- `Qtd T.Env Fl` **não cresce indefinidamente** para o mesmo registro (sem loop de retry).
- Os logs trazem a **versão** da rotina, permitindo distinguir "patch não aplicado" de "patch
  aplicado e com defeito".
- Nenhuma instância de *Faturamento de Contratos* fica semanas em *"Aguarda processamento Fila Protheus"*.

**Resultado se o defeito reincidir**
- Registros com `ZZZ_STATUS='N'` que o scheduler **reencontra a cada ciclo sem nunca processar**;
  workers morrendo com **"SX6 not open for GetMV"**; processos de faturamento (84075, 84128, 83272)
  parados na integração sem erro visível ao usuário.

**Severidade:** **Alta** *(faturamento de contrato não conclui — impacto financeiro direto e
reincidente; foram 79 dias e seis patches)*

**Preparação de massa:** medições pendentes numa filial, schedule UGCTE017 V3.0 agendado, parâmetro
**MV_CIFCF = 566882** conferido, e uma janela de observação de pelo menos dois ciclos. Exige o time
Protheus e infra.

**Verificado em tela:** PARCIAL
**O que foi verificado:** aba **`Medicoes ZZZ`** presente no widget *Logs Protheus*, com filtros de
filial, data e mensagem, e botão **Consultar**; visão *Faturamento de Contratos* disponível no
Tracker.
**Divergências encontradas:** a grade não carrega (`genericQuery` **404** — ambiente), e o achado
**A11-b** mostra que nessa condição o widget fica preso em *"Consultando logs..."* sem nunca dizer
"Nenhum registro encontrado" — **erro indistinguível de vazio**. Sobretudo: o achado **A16** mediu em
**04/09/2026** três instâncias de Faturamento paradas em *"Aguarda processamento Fila Protheus"*
**desde 14–17/08/2026** e sete em *"Correção"* — ou seja, **o sintoma que este ticket encerrou
continua ocorrendo hoje**. Este caso, se executado agora, tende a **reprovar**.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4121  (ambos · Concluído · SDCASSI-300)

**Título:** Acompanhar uma medição de contrato enviada ao Protheus e vê-la sair de "Aguarda processamento Fila Protheus" em minutos, com o retorno visível no Fluig.

**Origem:** FSWTBC-4121 — medição via Fluig permanecia em "Aguarda processamento Fila Protheus" sem
evoluir (fila ZZZ / schedule UGCTE017). Fechado como "Não será feito" por dependência do rebase; em
29/07/2026 o processo **99882** foi reportado parado de novo e o ticket seguiu fechado.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** (`wf_faturamento_contratos`) → *Detalhes da
Solicitação* (`/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=<nº>`), abas
**Histórico** e **Informações** · **Logs Protheus** (`/portal/p/1/portal_logs_protheus`, aba
**Medicoes ZZZ**) · **Tracker - Processos Compras/ Contratos**, *Filtrar por* = **Faturamento de Contratos**.

**Pré-condições**
- Uma medição própria já em **Gravar/Encerrar Medição (105)** concluída — ou seja, que acabou de entrar
  na **182 "Aguarda processamento Fila Protheus"**.
- Serviço do Protheus e schedule da fila (UGCTE017) no ar.
- **Bloqueio:** criar a medição exige contrato com saldo e perfil de fiscal; a conta de QA não deve
  movimentar as instâncias reais paradas (111980/111977/111973). O caso usa-as **só em leitura**.

**Passos**
1. Abrir *Detalhes da Solicitação* da medição e clicar na aba **Histórico**. Anotar a hora em que a
   atividade **"Aguarda processamento Fila Protheus"** foi iniciada.
2. Na aba **Informações**, conferir a atividade atual e o responsável.
3. Abrir **Logs Protheus** → aba **Medicoes ZZZ**, preencher **Id Fluig** com o nº do processo e
   clicar em **Consultar**. Ler as colunas **Status**, **Data Recb Me / Hora Rec Med**, **Data Trat Me /
   Hora Eft Med** e **Msg Medicao**.
4. Aguardar até **15 minutos** e recarregar o Histórico.
5. Abrir o Tracker, filtrar **Faturamento de Contratos** por *Número da Solicitação* e conferir a
   situação.

**Resultado esperado**
- Passo 4: a atividade **182** aparece **encerrada** e o processo já está em **"Pedido Gerado?" (162)**
  seguida de **"Notifica Fornecedor" (41)** e **"Fim - Faturamento de Contratos" (60)** — ou, em caso de
  erro no ERP, em **"Correção" (117)** atribuída ao grupo `G.P.FatConCorrecaoIntegraca`. Nunca fica na 182.
- Referência medida: a instância **113249** saiu da 182 em **7 minutos** (17:28 → 17:35 de 03/09/2026).
- Passo 3: o registro ZZZ do processo existe, com **Data Trat Me / Hora Eft Med** preenchidas e
  **Msg Medicao** informando o resultado. `Qtd T.Env Fl` não cresce indefinidamente.
- Na 182 em espera, a tarefa **não** fica sem responsável por mais de um ciclo do schedule.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O processo permanece em **"Aguarda processamento Fila Protheus"** por dias, sem erro, sem "Correção" e
  sem mensagem — "Item pendente! Processo 99882 parado na fila".
- **Hoje (04/09/2026) é o que se vê**: 111980 (desde 17/08 18:40), 111977 e 111973 (desde 14/08) ativas
  na 182; na 111980 a tarefa 8 da seq 182 está `NOT_COMPLETED` **sem responsável**.

**Severidade:** Alta

**Preparação de massa:** uma medição própria recém-gravada (contrato com saldo, fiscal do contrato como
executor). Sem isso, usar as três instâncias paradas **apenas para leitura** — elas já são a evidência.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri *Detalhes da Solicitação* da **111980** (título "Movimentar Solicitação",
abas **Formulário / Informações / Histórico 6 / Anexos 0**, botões **Comentar** e **Cancelar Solicitação**
— não acionados) e da **113249** (Histórico 9). Pela API, o percurso completo das duas: 4 → 88 → 95 → 20
→ 28 → 192 → 105 → 182 (111980 parada aí; 113249 seguiu para 162 → 117). Abri **Logs Protheus** com as
três abas; **Consultar** na ZZZ devolve **404** no `genericQuery` (ambiente).
**Divergências encontradas:** (1) o ticket está **fechado** e o sintoma está **vivo** — 3 instâncias,
18–21 dias; (2) a tarefa em espera da 182 fica **sem responsável** (`chosenAssignees` vazio) após a
COMPLETED por `admin` — o processo não tem quem cobrar; (3) a ferramenta de diagnóstico (ZZZ) está
indisponível justamente enquanto a fila trava.
**Dados/massa usados:** instâncias 111980, 111977, 111973 e 113249 — somente leitura.

---

## CT-FSWTBC-4122  (ambos · Em Homologação · SDCASSI-301)

**Título:** Realizar a medição de um contrato escolhendo uma competência e ter a medição, o saldo e o pedido gerados exatamente nessa competência.

**Origem:** FSWTBC-4122 — medição 87483 parametrizada para 03/2026 gerou o pedido 313807 em 10/2025.
Causa: `infoMedicao/{contrato}/{competencia}` devolvia **outra** competência quando não achava a
pedida (fallback silencioso) e a medição automática listava planilhas **sem saldo**. Correção em
`UGCTE001.data.tlpp` (CNF_SALDO > 0 e CNA_SALDO > 0), homologada, **PR para produção pendente de MUD**.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** → atividade **Realizar Medição do Contrato (28)**,
formulário 256836: **Nº do Contrato \***, **Filial do Contrato\***, **Competência do Contrato \***
(`zoomCompetencia`), **Filial da Medição \***, **Nº da Planilha \***, **Nº da Medição \***,
**Saldo a Medir \***.

**Pré-condições**
- Contrato vigente com **duas ou mais planilhas na mesma competência**, ao menos uma **com saldo** e ao
  menos uma **sem saldo** (é a combinação que disparava o defeito).
- Uma competência **sem** cronograma (ex.: mês futuro) para o cenário negativo.
- **Bloqueio:** a competência do pedido gerado só é visível no Protheus (sem credencial). No Fluig,
  `CND_COMPET` cai num **campo oculto** (`medContrCompetencia`) — sem rótulo na tela; conferência só via
  DevTools ou pelo Histórico.

**Passos**
1. Abrir o processo, informar **Nº do Contrato** e **Filial do Contrato**; aguardar carregar
   **Competência do Contrato**.
2. Selecionar a competência-alvo (ex.: `03/2026`) e a **Filial da Medição**.
3. Observar o carregamento de **Nº da Planilha**, **Nº da Medição** e **Saldo a Medir**.
4. Com DevTools, ler `#medContrCompetencia` (é o `CND_COMPET` que o ERP devolveu).
5. Repetir os passos 1–3 escolhendo a competência **sem** cronograma.
6. Repetir com o contrato que tem planilha **sem saldo** na competência e conferir quais planilhas são
   oferecidas em **Nº da Planilha**.

**Resultado esperado**
- Passo 4: `medContrCompetencia` **é igual** à competência escolhida no passo 2 — nunca outra.
- Passo 5: a tela **não** carrega medição de outra competência: exibe erro/vazio (toast literal
  **"Erro ao buscar as informações de Competência de Medição do Contrato. Por favor, tente novamente."**
  ou lista vazia), e **Nº da Medição / Saldo a Medir** ficam em branco.
- Passo 6: **Nº da Planilha** lista **somente** planilhas com saldo na competência escolhida.
- O **Saldo a Medir** exibido corresponde à competência escolhida.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Pediu-se 03/2026 e o ERP devolveu `CND_COMPET = "10/2025"` (medição 002657 do contrato
  00004-2024-3517); a medição prosseguiu com número plausível e competência errada, e o pedido nasceu
  em 10-2025. Planilhas **sem saldo** apareciam para medir.

**Severidade:** Alta

**Preparação de massa:** contrato com cronograma em ≥ 2 planilhas na mesma competência (uma zerada), a
ser indicado pelo gestor de contratos; executor com perfil de fiscal.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no fonte publicado do 256836: `getInfoMedicoes(contrato, filial, competencia,
filialMedicao)` monta a chamada com `COMPETENCIA_ESCOLHIDA` e o retorno grava `CND_COMPET` em
`medContrCompetencia` (**campo `hidden`**, comentário `<!-- Medição de Contratos - Competencia (CND_COMPET) -->`);
o toast de erro é literal. Consultei `ds_fatcon_get_competencia` para `00015-2026-5303`: devolveu
`{CODE:"undefined", STATUS:"ERROR", COMPETENCIA:"undefined", PAGAMENTO:""}` — Protheus indisponível
(ambiente).
**Divergências encontradas:** (1) **o front não compara** a competência pedida com a devolvida — se o
ERP fizer fallback, o Fluig aceita em silêncio (a correção vive só no ERP); (2) `CND_COMPET` não tem
rótulo visível — o analista não consegue conferir a competência efetiva sem DevTools; (3)
`if (tipoInicioProcesso == 'manual' || 'automático')` é sempre verdadeiro (A2-d) — `loadInfoMedicao`
roda em qualquer início; (4) o dataset de competência **repassa `"undefined"` como valor** em vez de
falhar — mesma classe do "Erro: undefined" do CT-FSWTBC-4234; (5) status *Em Homologação* com PR
pendente: **hoje pode reprovar**.
**Dados/massa usados:** contrato 00015-2026-5303 (só consulta de dataset) — nada submetido.

---

## CT-FSWTBC-4192  (ambos · Concluído · SDCASSI-315)

**Título:** Encerrar uma medição com serviço prestado e itens medidos e ter o processo terminar em "Fim - Faturamento de Contratos" com pagamento — nunca em "Fim - Sem Pagamento".

**Origem:** FSWTBC-4192 — medições 10220 e 10221 encerraram "como se não tivesse pagamento" embora
medidas. Fechado "Não será feito" pela premissa de que a refatoração V3.0 resolveu — nunca testada
contra este cenário.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** → **Realizar Medição do Contrato (28)** →
gateway **Pagamento? (192)** → **Gravar/Encerrar Medição (105)** → **Aguarda processamento Fila
Protheus (182)** → **Pedido Gerado? (162)** → **Notifica Fornecedor (41)** → **Fim - Faturamento de
Contratos (60)**; ramo alternativo **Fim - Sem Pagamento (38)**. Formulário: switcher **Houve Prestação
de Serviço? \***, grade de itens (**Quantidade \***, **Valor Unitário \***, **Valor Total \***), combo
**Direcionar Processo para \*** (Selecione... / Cancelar Medição / Fiscal de Contrato / Fiscal de Serviço).

**Pré-condições**
- Contrato com saldo; executor como fiscal.
- **Bloqueio:** exige gravar uma medição (escrita real no ERP) e a fila 182 está travada hoje — o
  resultado final não seria observável.

**Passos**
1. Na atividade 28, marcar **Houve Prestação de Serviço? = Sim**, medir ≥ 1 item com quantidade > 0 e
   valor total > 0, preencher rateio (100 %).
2. Direcionar o processo para a aprovação cabível e concluir.
3. Após a aprovação, acompanhar o **Histórico**.
4. Em paralelo, marcar numa segunda medição **Houve Prestação de Serviço? = Não** e concluir.

**Resultado esperado**
- Passo 3: o Histórico passa por **192 Pagamento?** → **105 Gravar/Encerrar Medição** → **182** →
  **162 Pedido Gerado?** → **41 Notifica Fornecedor** → **60 Fim - Faturamento de Contratos**.
- **Nunca** aparece **38 Fim - Sem Pagamento** para a medição do passo 1.
- Passo 4: só a medição **sem** prestação termina em **38**.
- No Tracker, visão **Faturamento de Contratos**, a medição do passo 1 aparece com pedido.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Medição feita e o processo encerrado **sem pagamento** (medições 10220/10221), sem erro.

**Severidade:** Alta

**Preparação de massa:** duas medições do executor num contrato com saldo, prefixo `QA` em
**Observações**; gestor cooperante para a aprovação.

**Verificado em tela:** PARCIAL
**O que foi verificado:** por dado, os dois fins existem e são percorridos: **38 "Fim - Sem
Pagamento"** (6 movimentos, v47/v50) e **60 "Fim - Faturamento de Contratos"** (16); gateway **192
"Pagamento?"** na versão atual (v51). No fonte do 256836: `houvePrestServico` (switcher Sim/Não),
campos ocultos `pagamentoPendente` e `medicaoRealizada`, `controlField = "GRAVA_MED"` da servicetask
105, e o bloco `numState == 38 // Fim - Sem Pagamento || numState == 60` — **vazio** (`{ }`). Rótulos
lidos no HTML publicado.
**Divergências encontradas:** (1) a decisão pagamento/sem pagamento é do gateway 192 (ERP/campos
ocultos) — o formulário não exibe o motivo do ramo; (2) o combo "Direcionar Processo para" **não tem
opção "Encerrar"** (o ticket fala em "encerrou") — o encerramento é automático na 105; (3) status "Não
será feito": **hoje pode reprovar** e a fila travada impede observar o fim.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4247  (ambos · Concluído · SDCASSI-327)

**Título:** Medição automática agendada para o último dia do mês é gerada e aparece na fila de medições do Fluig

**Origem:** FSWTBC-4247 — medição automática agendada para 31/03/2026 (contrato 6205-2025-5303, planilha 3) não foi gerada: a rotina não considerava a periodicidade no último dia do mês (`CNA_XPRMED`, UGCTE001/UGCTE027). Correção perdida em merge e refeita em 12/06; concluído 30/06/2026.

**Módulo/Rota:** Protheus › Gestão de Contratos › Medição automática (schedule UGCTE027, 04:00) — **sem superfície de configuração no Fluig**. Efeito observável no Fluig: **Logs Protheus › Medicoes ZZZ** (`/portal/p/1/portal_logs_protheus`) e **Tracker › Faturamento de Contratos** (`PORTAL_TRACKER_COMPRAS_CONTRATOS`, visão `table-fc`).

**Pré-condições**
- Contrato vigente com medição automática configurada no Protheus para o **último dia do mês** (competência futura), planilha com itens.
- O schedule de medição automática executado às 04:00 do dia seguinte.
- **Bloqueio:** configuração e schedule só no Protheus (sem credencial); o cenário só é exercitável **no último dia do mês** (o REST usa a data do dia — não há data retroativa); `genericQuery` das abas ZZZ responde 404 hoje.

**Passos**
1. No dia 1º do mês seguinte, abra **Logs Protheus › Medicoes ZZZ**, informe **Contrato** = número do contrato, **Recebimento inicial/final** = último dia do mês anterior e o dia atual, **Consultar**.
2. Confira a linha gerada: colunas **Num Med**, **Contrato**, **Status**, **Data Recb Me**, **ID Fluig**, **Msg Medicao**.
3. Abra o **Tracker › Faturamento de Contratos**, filtre por **Número do Contrato** e **Pesquisar Registro**; localize a medição pelo *Id Fluig* anotado.
4. Abra a instância do `wf_faturamento_contratos` e confira no histórico a etapa atual.

**Resultado esperado**
- Existe uma linha em *Medicoes ZZZ* para o contrato com **Data Recb Me** = último dia do mês e **Status** `S` (sucesso) — não `E`.
- O Tracker lista a medição e a instância de Faturamento existe, iniciada automaticamente, sem estar em *Correção* nem em *Aguarda processamento Fila Protheus* por mais de um ciclo do job.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Nenhuma linha em ZZZ para a competência; nenhuma instância de Faturamento criada para o contrato no dia 31; o schedule consta executado às 04:00 sem gerar a medição.

**Severidade:** Alta — medição não gerada é faturamento não realizado.

**Preparação de massa:** contrato com medição automática no último dia do mês configurada por um usuário Protheus de Gestão de Contratos (não há como criar no Fluig); o executor apenas observa.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *visto renderizado* — aba **Medicoes ZZZ** com filtros *Id Fluig, Filial, Contrato, Status, Recebimento inicial/final* e botão **Consultar**; Tracker com filtro *Número do Contrato*. *Lido no fonte publicado* — colunas da ZZZ (*Num Med, Contrato, Revisao, Json Medicao, Status, Data Recb Me, Data Trat Me, ID Fluig, Hora Rec Med, Hora Eft Med, Msg Medicao, Filial Medic*). Consulta não executada: `genericQuery` 404 (ambiente).
**Divergências encontradas:** o ticket chama de "medição agendada"; o widget rotula a aba **Medicoes ZZZ** e o campo de data **Recebimento inicial/final** (não "competência"). Nenhuma superfície Fluig mostra a **configuração** da periodicidade — só o efeito.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4266  (fluig · Concluído · SDCASSI-330 · incidente SD806419)

**Título:** Conferir, antes de a medição seguir, que os dados de faturamento e o e-mail do fornecedor gravados no formulário são os do contrato correto.

**Origem:** FSWTBC-4266 — **fornecedor recebeu e-mail de faturamento de contratos com dados incorretos** (solicitação **90014**). Correção disponibilizada na branch `hotfix/SDCASSI-330` em 07/04, mas **retida** por causa do SDCASSI-286, que estava em homologação na mesma base TST. Um mês depois a CAST concluiu que *"foi um erro pontual"* e mandou encerrar. **A correção nunca foi validada nem descartada formalmente, e não há diagnóstico do que gerou o dado incorreto** — logo, não há como afirmar que foi pontual. Agravante: é **comunicação externa a fornecedor**.

**Módulo/Rota:** **Faturamento de Contratos** (`wf_faturamento_contratos`, `/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos`) — seções de identificação do contrato/fornecedor e de itens da medição.

> **Sem superfície de front-end para o defeito em si.** O artefato defeituoso é o **corpo do e-mail enviado ao fornecedor**, e o Fluig **não expõe nenhuma tela** que mostre o e-mail como o fornecedor o recebeu: não há visualizador de mensagem enviada, nem prévia de template, nem caixa de saída consultável pela interface. Este caso, portanto, ataca a **origem do dado** — os campos do formulário que alimentam o template — e a **evidência de execução** — o Histórico. Verificar o e-mail em si exige acesso à caixa postal do fornecedor, que está fora do Fluig.

**Pré-condições**
- Uma medição de **Faturamento de Contratos** em andamento, com contrato e fornecedor conhecidos e conferíveis.
- Acesso à caixa postal do destinatário (ou a uma cópia do disparo) para a conferência final — **fora do Fluig**.
- **Bloqueio:** sim, em três frentes. (a) Não há tarefa de *Faturamento de Contratos* disponível para a conta de QA e não há medição em curso acessível; criar uma exige contrato vigente e competência aberta. (b) **Não há superfície no Fluig para o e-mail** (ver nota acima). (c) A pendência técnica do ticket — o destino da branch `hotfix/SDCASSI-330` — **não é verificável em tela por ninguém**; é pergunta para o time.

**Passos**
1. Abrir a medição de **Faturamento de Contratos** pela **Central de Tarefas** (clicar explicitamente na sub-aba desejada; a Central guarda a sub-aba por sessão no servidor).
2. Na seção de identificação, anotar **Nº do Contrato**, **Fornecedor** e o **e-mail do fornecedor** (campo `emailFornecedor`).
3. Conferir esse e-mail contra o cadastro do fornecedor do contrato — devem ser o **mesmo**.
4. Se a medição usar planilha, conferir também o **e-mail do fornecedor da planilha** (`emailFornecedorPlanilha`) e checar que não diverge do campo do passo 2.
5. Conferir os demais destinatários gravados no formulário: **e-mail do aprovador CSE** (`emailAprovadorCSE`), **e-mail do fiscal do contrato** (`emailFiscalContrato`) e **e-mail do fiscal de serviço** (`emailFiscalServico`) — todos devem pertencer ao **mesmo** contrato.
6. Conferir os valores e a competência da medição contra o contrato.
7. Movimentar a medição para a etapa que dispara o e-mail ao fornecedor.
8. Ler a aba **Histórico** e confirmar que a etapa de disparo concluiu, sem registro de erro.
9. **Fora do Fluig:** abrir o e-mail recebido pelo fornecedor e comparar, campo a campo, com o que foi anotado nos passos 2 a 6.

**Resultado esperado**
- Todos os e-mails de destinatário gravados no formulário pertencem ao **contrato aberto** — nenhum campo herdado de outro contrato ou de uma medição anterior.
- `emailFornecedor` e `emailFornecedorPlanilha` **não divergem** entre si.
- O Histórico registra a etapa de disparo concluída, sem erro.
- Passo 9: o e-mail recebido traz o **número do contrato, o fornecedor, a competência e os valores da medição efetivamente aberta** — nenhum dado de outro contrato ou de outro fornecedor.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O fornecedor recebe um e-mail de faturamento com **dados incorretos** (evidência do ticket: `Screenshot_2.png`, com o e-mail recebido). **Quais** dados estavam trocados **`<não documentado>`** — o ticket não descreve, o log do dia 06/04 foi solicitado e não há registro de que tenha sido enviado, e nenhum diagnóstico foi feito.

**Severidade:** Alta *(dado incorreto de faturamento enviado a parte externa — risco de informação de um fornecedor exposta a outro e de cobrança/pagamento sobre base errada. O canal é externo e não há como recolher a mensagem)*

**Preparação de massa:** uma medição de Faturamento de Contratos em etapa que dispare e-mail ao fornecedor, sobre contrato vigente com competência aberta, criada por quem tenha esse perfil — **não disponível para a conta de QA** —, mais **acesso à caixa do destinatário**. **E, antes de tudo isso, duas perguntas ao time, que nenhum teste responde:** (1) a correção da branch **`hotfix/SDCASSI-330` foi promovida, descartada ou continua em limbo?** (2) **o que exatamente estava incorreto** no e-mail de 06/04? Sem (2), não existe critério de reprovação preciso para este caso — ele só pode conferir coerência geral, não o campo específico que falhou.

**Verificado em tela:** NÃO
**O que foi verificado:** apenas que o **caminho existe**: `/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos` abre (título *Cassi - Fluig Plataforma - Movimentar Solicitação*, heading *Início*, abas **Formulário / Informações / Histórico / Anexos**, botões *Enviar* e *Opções*), disparando 163 requisições ainda em branco. O conteúdo do formulário fica dentro de um **iframe** que não foi inspecionado nesta sessão, e **nenhum campo do caso foi visto renderizado**. Os nomes de campo citados nos passos — `emailFornecedor`, `emailFornecedorPlanilha`, `emailAprovadorCSE`, `emailFiscalContrato`, `emailFiscalServico` — foram **lidos no fonte publicado** do widget de faturamento (`fat_App_EventHandler.js` e `fat_App_ZoomHandler.js`), **não** vistos em tela. Nenhum e-mail foi aberto. Marcar este caso como "verificado" seria falso.
**Divergências encontradas:** o ticket está **"Concluído / Feito"**, mas foi **encerrado a pedido do cliente sem correção validada** — a resolução registrada não corresponde ao que aconteceu. Além disso, o formulário grava **cinco** campos de e-mail distintos (fornecedor, fornecedor da planilha, aprovador CSE, fiscal do contrato e fiscal de serviço); o ticket trata o assunto como "o e-mail do fornecedor", o que subdimensiona a superfície de erro.
**Dados/massa usados:** nenhum — apenas abertura do processo em branco; nada submetido.

---

## CT-FSWTBC-4362  (ambos · Concluído · SDCASSI-373)

**Título:** Iniciar uma medição do contrato 6227-2025-5303 escolhendo a planilha 000002 e ver os itens carregarem — sem "Não existem itens a serem medidos".

**Origem:** FSWTBC-4362 — no processo 92788 a planilha **000002** do contrato **6227-2025-5303** não carregava
itens; nova medição exibia `ERRO: Não existem itens a serem medidos para a planilha 000002`. Causa de **dado**:
`CNA_CRONOG` da planilha 000002 apontava para o cronograma (`CNF`) da planilha 000001. Corrigido limpando o
vínculo; aceito 20/05/2026.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** (`wf_faturamento_contratos`), seção de identificação:
*Fornecedor* → **Nº do Contrato \*** → **Competência do Contrato \*** → **Filial da Medição \*** → **Nº da
Planilha \*** (zoom `zoomNumPlanilha`) · **Acompanhamento de Contratos** (busca `6227`, ícone *Planilha*).

**Pré-condições**
- Contrato **6227-2025-5303** vigente (confirmado: filial 5303, 08/11/2025→07/11/2028, revisão 001) com
  planilhas 000001/000002/000003 e saldo a medir.
- Usuário com perfil de **fiscal** do contrato para iniciar a medição.
- **Bloqueio:** a conta de QA não é fiscal desse contrato; `CNA_CRONOG` só é visível no Protheus.

**Passos**
1. Abrir **Acompanhamento de Contratos**, pesquisar `6227`, abrir o ícone **Planilha** e anotar as planilhas listadas.
2. Iniciar **Faturamento de Contratos**; selecionar o fornecedor `30342266 - 0001`, **Nº do Contrato** =
   `6227-2025-5303`, a competência corrente e **Filial da Medição** = `5303`.
3. Abrir o zoom **Nº da Planilha**: confirmar que **000002** aparece.
4. Selecionar **000002**.
5. Repetir com **000001** e **000003** para comparação.

**Resultado esperado**
- O zoom lista 000001, 000002 e 000003.
- Ao selecionar 000002, a grade *Itens da Medição* é preenchida com os itens da planilha, com *Saldo a Medir*.
- Nenhum toast `Não existem itens a serem medidos para a planilha 000002`.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Toast **"Não existem itens a serem medidos para a planilha 000002"** e grade vazia, enquanto 000001 e 000003
  carregavam normalmente.

**Severidade:** Média *(bloqueia a medição do contrato; não corrompe valor)*

**Preparação de massa:** nenhuma nova — usar o contrato real 6227-2025-5303. Verificar antes, com o time
Protheus, que nenhuma outra planilha da base tem `CNA_CRONOG` cruzado (recomendação do ticket).

**Verificado em tela:** PARCIAL
**O que foi verificado:** contrato **localizado** na grade do Acompanhamento (`5303 | 001 - AGENCIA DE VIAGENS |
6227-2025-5303 | 08/11/2025 | 07/11/2028 | 001 | Vigente | 30342266 - 0001`). No HTML publicado do Faturamento
(256836) existem os rótulos **Nº do Contrato \***, **Filial do Contrato\***, **Competência do Contrato \***,
**Filial da Medição \***, **Nº da Medição \***, **Nº da Planilha \***, **Saldo a Medir \***; no JS publicado, o
toast literal `Não existem itens a serem medidos para a planilha ${…}` e o encadeamento `zoomNumContrato →
zoomCompetencia → zoomFilialMedicao → zoomNumPlanilha`. A consulta `dsProtheus_getInformaPlanxContrato_restGetAll`
com filtro de teste devolveu `[]` (os nomes de filtro `CorporateId/BranchId` exigem valores que não tenho —
não conclusivo). Medição não iniciada.
**Divergências encontradas:** o ticket grafa a mensagem com prefixo `ERRO:`; no fonte o toast não tem esse
prefixo. A grade do Acompanhamento não mostra a razão social (ONFLY) — só `CNPJ - loja`.
**Dados/massa usados:** contrato 6227-2025-5303 — leitura.

---

## CT-FSWTBC-4447  (protheus · Concluído · SDCASSI-382)

**Título:** Abrir uma medição no Fluig para um contrato de planilha SEMI FIXA e obter os itens da planilha liberados para informar quantidade

**Origem:** FSWTBC-4447 — após o clone da base TST, as medições deixaram de carregar o item da planilha. Causa: o campo **Plan. Fixa** do *Tipo de Planilha* (`CNL_CTRFIX`) estava `1-Sim` na TST enquanto DES/PRD tinham `3-Semi-Fixo` no tipo 002 (SEMI FIXA). Ao equiparar, a medição voltou a listar os itens. Este ticket é a origem do desvio de rumo do SDCASSI-286.

**Módulo/Rota:** Fluig — *Faturamento de Contratos* (`wf_faturamento_contratos`, form 256836), seção **Informações da Medição** → grade `tblItensMedicao`; o form lê `dsProtheus_getTipoPlanContratos_restGetAll` (`BRANCHID`, `CNL_CODIGO`) e decide em `handleQtdItem`: `CNL_CTRFIX` `3`/`2` → itens liberados; `1` → **bloqueado**; `0` → cai na regra do tipo de contrato (`CN1_CTRFIX`). No ERP: GCT → *Tipos de Planilha* (CNL), campo *Plan. Fixa*.

**Pré-condições**
- Contrato vigente com planilha do tipo **002 SEMI FIXA** e outro com planilha **001 FIXA**, ambos com saldo a medir.
- Conta com permissão de iniciar *Faturamento de Contratos* (a conta de QA abre o formulário em branco).
- **Bloqueio:** nenhum para a observação; a correção do dado (`CNL_CTRFIX`) só no ERP.

**Passos**
1. Chamar `GET …/dataset/search?datasetId=dsProtheus_getTipoPlanContratos_restGetAll` e anotar `CNL_CODIGO`, `CNL_DESCRI`, `CNL_CTRFIX` dos tipos.
2. Iniciar *Faturamento de Contratos*; em **Informações da Medição** selecionar *Fornecedor \**, *Nº do Contrato \**, *Competência do Contrato \**, *Filial da Medição \** e *Nº da Planilha \** de uma planilha SEMI FIXA.
3. Observar a grade de itens (`tblItensMedicao`: *item, produto, saldo a medir, quantidade, valor unitário*).
4. Repetir com a planilha FIXA.
5. Não enviar (fechar a solicitação sem *Enviar*).

**Resultado esperado**
- Passo 1: tipo 002 com `CNL_CTRFIX = 3` (Semi-Fixo); tipos 001/003 com `0`.
- Passo 3: itens da planilha carregados com *quantidade* **editável**.
- Passo 4: itens carregados; edição de quantidade conforme a regra do tipo de contrato (`CN1_CTRFIX`).
- Após um clone/refresh de base, o passo 1 continua devolvendo os mesmos valores de PRD.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Grade de itens vazia/bloqueada na medição (tipo 002 com `CNL_CTRFIX = 1`) — sem mensagem de erro.

**Severidade:** Média — bloqueia a medição (e, por consequência, o pagamento).

**Preparação de massa:** nenhuma a criar; usar contratos vigentes com planilha 002 (ex.: `00016-2024-5303` planilhas 000001/000002) — apenas abrir, não enviar. Pós-clone: checklist de conferência de CNL/CN1/SX6 pela TI.

**Verificado em tela:** PARCIAL
**O que foi verificado:** `dsProtheus_getTipoPlanContratos_restGetAll` (GET search, 3 linhas, 21 colunas): **001 FIXA `CNL_CTRFIX=0`, 002 SEMI FIXA `CNL_CTRFIX=3` (`CNL_TPSFIX=1`, `CNL_MEDAUT=2`), 003 FIXA `CNL_CTRFIX=0`** — o valor correto do ticket está nesta base. Formulário *Faturamento de Contratos* aberto (form 256836) com os rótulos citados e grade `tblItensMedicao`/`tblRateio`; lógica `handleQtdItem` lida no `EventHandler` publicado. Contrato não selecionado (evita chamada de medição/fila).
**Divergências encontradas:** dois tipos com a mesma descrição **FIXA** (001 e 003) — na combo da medição são indistinguíveis pelo nome.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4540  (ambos · Concluído · SDCASSI-407)

**Título:** Fiscal registra medição com planilha de rateio sem linha zerada e o pedido nasce com rateio completo

**Origem:** FSWTBC-4540 — pedido 314167 (medição 95362) com rateio incompleto: a planilha tinha item com `CNE_QUANT` 0 e
linhas com `CNZ_PERC '0'`; o Protheus interrompia a criação do rateio no zero. Correção no lado Protheus; **o Fluig continua
aceitando percentual zerado** (pendência conceitual declarada no ticket).

**Módulo/Rota:** Processo **Faturamento de Contratos** → *Realizar Medição do Contrato* → seção de rateio (`tblRateio`,
botões **btnAdicionarRateio** / **btnDelItensRateio**, upload *Planilha de Rateio e Centro de Custo*); Tracker →
**Faturamento de Contratos** (`table-fc`)

**Pré-condições**
- Contrato vigente com fiscal = usuário logado (a grade só lista contratos do fiscal).
- Planilha de rateio com ≥ 2 centros de custo.
- **Bloqueio:** não há credencial de fiscal; medição não deve ser submetida (gera pedido no ERP).

**Passos**
1. Abrir a medição do contrato; importar/preencher o rateio com uma linha de **0 %** e outra de **100 %** para o item 001.
2. Sair do campo (blur) e ler a mensagem do toast.
3. Repetir com um item de quantidade **0** e rateio vazio.
4. Tentar avançar (**Direcionar Processo para**) sem submeter de fato — observar a crítica.
5. (Regressão completa, pelo fiscal) submeter e conferir no Tracker *Faturamento de Contratos* e no Histórico
   ("Integração executada com sucesso") o pedido gerado com todas as linhas de rateio.

**Resultado esperado**
- Linha de rateio com `0` é recusada na origem (crítica por linha), e a soma por item deve ser exatamente 100 %.
- Item com quantidade 0 / rateio vazio não é enviado ao ERP.
- Pedido gerado no ERP com o mesmo número de linhas de rateio da planilha.

**Resultado se o defeito reincidir**
- O Fluig aceita `porcentagem = 0` e quantidade 0; o pedido nasce com rateio parcial (custo distribuído só até a linha zerada).

**Severidade:** Alta (contábil)

**Preparação de massa:** contrato com fiscal = executor e planilha com 68 CCs (o JSON integral está nos comentários do
ticket). Não criar medição para forçar.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **lido no fonte publicado** (form 256836 `ViewHandler`): `handleValidRateio` apenas **soma** os
`tbrat_porcentagem___n` por item e critica `> 100` ("A soma dos percentuais de rateio não podem ultrapassar o limite de
100%…") ou `< 100` ("…não podem ser inferior a 100%…"); **não há crítica de linha zerada nem de negativo** — o defeito de
origem continua vivo (ACHADOS A3-a). `validarRateios` delega a um `Worker` (`App/WorkerHandler.js`) e o toast agrupa as
mensagens (SDCASSI-543). **Visto renderizado**: instâncias 113249 e 111980 têm `tbrat_item___1=001`,
`tbrat_porcentagem___1=100` / `100.00000000`; rótulos **Filial da Medição \***, **Nº da Medição \***, **Direcionar
Processo para \***. Tracker exibe a visão *Faturamento de Contratos* no combo `filterTipo`.
**Divergências encontradas:** nenhuma de rótulo. O ticket trata a correção como concluída, mas a validação na origem
segue ausente — **este caso reprova hoje** por causa nunca corrigida (lado Fluig).
**Dados/massa usados:** Faturamento 113249 e 111980 (leitura); nada submetido.

---

## CT-FSWTBC-4551  (ambos · Concluído · SDCASSI-409)

**Título:** Faturamento de contrato integra do início ao fim após uma liberação (regressão pós-MUD)

**Origem:** FSWTBC-4551 — após a MUD de 12/05/2026 os processos de faturamento passaram a apresentar erro na integração;
regressão introduzida por entrega (coincide com a V3.0 do UGCTE017). Corrigido sem causa registrada (MUD17705).

**Módulo/Rota:** Processo **Faturamento de Contratos** — *Histórico*; Logs Protheus → **Medicoes ZZZ**; Tracker →
*Faturamento de Contratos*

**Pré-condições**
- Contrato vigente com fiscal = executor.
- Rodar **logo após** cada liberação que toque UGCTE017/fila de medição.
- **Bloqueio:** sem credencial de fiscal; submissão de medição gera pedido — usar apenas contrato/medição de QA autorizados.

**Passos**
1. Iniciar *Faturamento de Contratos* para o contrato de QA; ler no *Histórico* a linha de **Busca Informações do Contrato**.
2. Preencher a medição (`QA` na justificativa), escolher em **Direcionar Processo para** a opção de encerramento e enviar.
3. Ler no *Histórico* as linhas de **Gravar/Encerrar Medição** e de **Aguarda processamento Fila Protheus**.
4. Abrir *Logs Protheus* → **Medicoes ZZZ**, filtrar por *Id Fluig* = nº do processo; ler *Status* e `Qtd T.Env Fl`.
5. Cronometrar a saída de *Aguarda processamento Fila Protheus* (SLA medido: ~7 min).

**Resultado esperado**
- "Integração executada com sucesso - Tempo de Execução N s" em *Busca Informações do Contrato* e em *Gravar/Encerrar Medição*.
- O processo sai da fila em minutos para **Pedido Gerado?** → *Fim - Faturamento de Contratos*, sem passar por **Correção**.
- ZZZ com Status `S` e sem retentativas.

**Resultado se o defeito reincidir**
- Histórico com "Atividade de serviço executada com falha…" ou comentário de erro na fila e desvio para **Correção**
  (pool `G.P.FatConCorrecaoIntegraca`), logo após uma MUD.

**Severidade:** Alta

**Preparação de massa:** contrato de QA com fiscal = executor e saldo orçamentário (PCO) disponível — o bloqueio de PCO
gera erro legítimo (ver abaixo) e mascararia a regressão.

**Verificado em tela:** PARCIAL
**O que foi verificado:** Histórico do 113249: "Integração executada com sucesso - Tempo de Execução 2 s" (Busca
Informações) e "…869 ms" (Gravar/Encerrar), depois comentário estruturado na fila (`Id do submodelo de erro:CNEDETAIL - Id
do erro:ERROR_PCO - … saldos … insuficientes …`) e desvio para **Correção** (pool `G.P.FatConCorrecaoIntegraca`, prazo até
04/09 17:35) — o caminho de erro reporta causa legível. Histórico do 111980: sucesso em ambas as integrações e **parado na
fila desde 17/08/2026** (ACHADOS A16; 4 instâncias nesse estado). Widget ZZZ renderiza filtros *Id Fluig, Filial,
Contrato, Status, Recebimento inicial/final*, mas `genericQuery` 404.
**Divergências encontradas:** "botão Encerrar" não existe; o controle é o combo **Direcionar Processo para \***.
**Dados/massa usados:** Faturamento 113249 e 111980 (leitura); nada submetido.

---

## CT-FSWTBC-4552  (ambos · Concluído · SDCASSI-410)

**Título:** Medição gravada com sucesso no ERP avança na fila e não cai em *Correção*

**Origem:** FSWTBC-4552 — a solicitação 96757 voltava ao grupo de erro mesmo com retorno
`{"result":true,"response":"Medicao gravada com sucesso.","statusCode":200}`. Causa: UCOME036 derrubava a thread após o
sucesso (objetos não liberados antes do RPCClearEnv); corrigido com `freeobj` (MUD17729).

**Módulo/Rota:** Processo **Faturamento de Contratos** → *Histórico* (comentários em **Aguarda processamento Fila
Protheus**); Logs Protheus → **Medicoes ZZZ**

**Pré-condições**
- Medição própria enviada (ver CT-FSWTBC-4551).
- Contrato de volume (o ticket previu teste de performance com o contrato da Oi).
- **Bloqueio:** sem credencial de fiscal; ZZZ indisponível hoje (404).

**Passos**
1. Após enviar a medição, acompanhar o *Histórico* em *Aguarda processamento Fila Protheus*.
2. Ler o comentário deixado por "Administrador Cassi" na saída da fila.
3. Conferir a atividade destino de **Pedido Gerado?**.
4. Em ZZZ, comparar o JSON de retorno (deve conter `Medicao gravada com sucesso`) com o status do processo.

**Resultado esperado**
- Retorno 200/"Medicao gravada com sucesso." ⇒ atividade destino **Fim - Faturamento de Contratos** (ou *Pagamento?*),
  nunca **Correção**.
- Quando houver erro, o comentário traz a mensagem do ERP (padrão observado: `Id do erro: … - mensagem do erro: …`).

**Resultado se o defeito reincidir**
- Retorno de sucesso no ZZZ e, mesmo assim, desvio para **Correção** sem mensagem de erro no Histórico.

**Severidade:** Alta

**Preparação de massa:** idem CT-FSWTBC-4551, com contrato de alto volume de itens/rateio.

**Verificado em tela:** PARCIAL
**O que foi verificado:** 113249 caiu em Correção **com** mensagem legível de erro (bloqueio PCO) — o contrário do sintoma
do ticket; 7 instâncias em Correção e 4 na fila entre as últimas 200. `Pedido Gerado?` e `Correção (117)` confirmados no
mapa de atividades do processo (v51). Formulário em Correção mostra **Direcionar Processo para \*** e `numMedicao=000142`.
**Divergências encontradas:** "grupo de erro" no ticket = atividade **Correção**, pool `G.P.FatConCorrecaoIntegraca`.
**Dados/massa usados:** Faturamento 113249, 111980 (leitura); nada submetido.

---

## CT-FSWTBC-4626  (ambos · Concluído · SDCASSI-427)

**Título:** Concluir uma medição de contrato cujo pedido foi gerado no Protheus e ver o processo terminar em *Notifica Fornecedor → Fim*, não em *Correção*

**Origem:** FSWTBC-4626 — solicitações de Faturamento de Contratos caíam em *Correção* mesmo com o pedido gerado no Protheus (processo
94987, contrato E02-2025-5303 rev. 002, medição 000185, pedido 001298). Causa apurada: **dado** — a revisão gravada no formulário
Fluig divergia da revisão real do contrato, e a validação de retorno não encontrava correspondência.

**Módulo/Rota:** Fluig → processo **Faturamento de Contratos** (`wf_faturamento_contratos`) · formulário seção *Informações da Medição*
(campos **Nº do Contrato \***, **Revisão \***, **Nº da Medição \***) · Histórico da solicitação · Tracker visão *Faturamento de Contratos*.

**Pré-condições**
- Contrato vigente com planilha e fiscal de serviço/contrato cadastrados; medição iniciada pelo *Serviço de Medição Automatizada* ou
  manualmente pelo fiscal.
- Perfil de **Fiscal de Serviço** (Realizar Medição) e de aprovador (Aprovação Medição do Contrato).
- **Bloqueio:** a conta de QA não é fiscal nem aprovador; não movimentar medição pré-existente.

**Passos**
1. Abrir a medição em modo leitura e anotar, no formulário, **Nº do Contrato**, **Revisão** e **Nº da Medição**.
2. Em *Acompanhamento de Contratos*, localizar o contrato e comparar a coluna **Nº Revisão** com a **Revisão** do formulário.
3. Como fiscal, concluir *Realizar Medição do Contrato* e, como aprovador, aprovar em *Aprovação Medição do Contrato*.
4. Acompanhar o Histórico: *Gravar/Encerrar Medição* → *Aguarda processamento Fila Protheus* → comentário do Administrador Cassi com
   `Pedido:<n>` → *Pedido Gerado?* → **Notifica Fornecedor** → *Fim - Faturamento de Contratos*.
5. No Tracker (visão *Faturamento de Contratos*), confirmar `Status=FINALIZADA` e `Atividade Atual=Fim - Faturamento de Contratos`.

**Resultado esperado**
- A **Revisão** do formulário é igual ao **Nº Revisão** do contrato no Acompanhamento de Contratos.
- Com `Pedido:<n>` registrado na fila, a decisão *Pedido Gerado?* segue para *Notifica Fornecedor* e o processo finaliza — nunca
  para *Correção (117)*.
- Sequência real observada na 98070 (referência verde): "Pedido:314356" → *Pedido Gerado?* condição 2 → *Notifica Fornecedor*
  "Integração executada com sucesso - Tempo de Execução 2 s" → *Fim - Faturamento de Contratos*.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Pedido gerado no Protheus e, mesmo assim, solicitação direcionada ao grupo de correção; formulário com número de revisão diferente
  do contrato.

**Severidade:** Alta

**Preparação de massa:** medição em contrato cuja **revisão do formulário difira** da revisão atual do contrato (cenário negativo) e
outra com revisão correta (cenário positivo) — criadas pelo fiscal do contrato; a conta de QA não pode criá-las.

**Verificado em tela:** PARCIAL
**O que foi verificado:** Tracker da **94987**: `Status=FINALIZADA`, `Atividade Atual=Fim - Faturamento de Contratos`, contrato
**E02-2025-5303**, competência 05-2026, medição **000185**, planilha 000003 (o processo do ticket terminou bem após a correção do dado);
Histórico da **98070** (mesmo caminho, verde) com a sequência acima; formulário de Faturamento renderizado (111980, 113249) com os rótulos
**Nº do Contrato \***, **Revisão \***, **Nº da Medição \***, **Direcionar Processo para \***; na 113249 `numRevisao=003`, na 111980
`numRevisao` **vazio** (visto renderizado em modo leitura). Atividades 41/117/162/182 confirmadas por agregação de movimentos.
**Divergências encontradas:** o ticket diz "direcionada para correção **após** a atividade 'notifica fornecedor'"; pelo dado, *Notifica
Fornecedor (41)* só leva a *Fim (60)* — a *Correção (117)* é alcançada a partir de *Pedido Gerado? (162)*, **antes** de Notifica
Fornecedor. `dsSync_corrigeRevisaoFatContratos`, citado na família, **não existe** neste ambiente (500 NPE).
**Dados/massa usados:** nenhum — não submetido; leitura de 94987, 98070, 111980, 113249.

---

## CT-FSWTBC-4648  (ambos · Concluído · SDCASSI-437)

**Título:** Informar a quantidade 1.084.017 na medição do contrato e ver o mesmo número no total do formulário e na medição gravada

**Origem:** FSWTBC-4648 — erro de **máscara** da quantidade na medição: `1.084.017` foi levado ao Protheus como `1.084,017` (efeito de mil
vezes). Separador de milhar do Fluig lido como decimal na fronteira com o ERP.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** → *Realizar Medição do Contrato (25/28)* → grade `tblItensMedicao` (**Quantidade \***,
**Valor Unitário \***, **Valor Desconto \***, **Valor Total \***) → *Gravar/Encerrar Medição (105)* → *Aguarda processamento Fila Protheus (182)*
→ comentário `Pedido:<n>` · Logs Protheus → aba **Medicoes ZZZ**.

**Pré-condições**
- Perfil de **Fiscal de Serviço** com medição `QA` aberta em contrato cuja planilha permita quantidade ≥ 1.000.000 (unidade compatível).
- **Bloqueio:** a conta de QA não é fiscal; não alterar medição pré-existente. ZZZ com `genericQuery` 404 hoje.

**Passos**
1. Na medição, digitar **1.084.017** em **Quantidade** de um item com Valor Unitário `1,00`; sair do campo (blur).
2. Ler o valor exibido em **Quantidade** e o **Valor Total** do item e o total da medição.
3. Repetir com `1.084,017` (decimal) e com `1084017` (sem separador).
4. Encaminhar (Direcionar Processo para …) até *Gravar/Encerrar Medição* e ler o Histórico e o comentário `Pedido:<n>`.
5. No Protheus (medição CNE/CND) ou em Logs Protheus → *Medicoes ZZZ*, confirmar a quantidade gravada.

**Resultado esperado**
- Passo 1–2: máscara pt-BR (`inputmask('decimal', alias 'numeric', 999.999.999,999999`) exibe `1.084.017,000000` (ou casas configuradas);
  **Valor Total** = `1.084.017,00`.
- Passo 3: `1.084,017` produz total `1.084,02` (arredondado) — o sistema distingue milhar de decimal; `1084017` é aceito como um milhão e
  oitenta e quatro mil e dezessete.
- Passo 4–5: a quantidade gravada no ERP é **1.084.017**, igual ao formulário.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Formulário com `1.084.017` e medição no Protheus com `1.084,017` (mil vezes menor).

**Severidade:** Alta

**Preparação de massa:** medição `QA` em contrato com item de grande quantidade, aberta pelo fiscal; credencial Protheus só para o passo
5 (o ZZZ cobre parcialmente quando disponível).

**Verificado em tela:** PARCIAL
**O que foi verificado:** rótulos **Quantidade \***, **Valor Unitário \***, **Valor Desconto \***, **Valor Total \***, **Direcionar Processo
para \*** lidos no HTML do form 256836 e **vistos renderizados** (modo leitura) nas medições 111980 (`quantidade___1 = 3.500`) e 113249
(`quantidade___1 = 1`); no fonte publicado `f_fat_256836_App_ViewHandler.js`: `inputmask('decimal', { alias:'numeric', allowMinus:false,
digits: … })` com padrão `'999.999.999,999999'`, e conversões `qtdMedir.replace(/\./g, ",")` / `qtdMedir.split(".").join(",")` no
`EventHandler` — exatamente o ponto onde um `.` de milhar vira `,` decimal. Sem perfil de fiscal, não digitei.
**Divergências encontradas:** o ticket fala em "máscara da quantidade"; o formulário usa **inputmask decimal** na exibição **e** troca
`.`→`,` por código ao carregar a planilha — o defeito pode reaparecer pela segunda via mesmo com a máscara correta (candidato a ponto de
atenção). Comentário `SDCASSI-543` no mesmo trecho indica retrabalho recente ali.
**Dados/massa usados:** nenhum — não submetido; leitura de 111980 e 113249.

---

## CT-FSWTBC-4670  (ambos · Concluído · SDCASSI-439)

**Título:** Gravar uma medição e ver a fila Fluig×Protheus processá-la em minutos — com o erro real gravado quando a gravação falha

**Origem:** FSWTBC-4670 — processos parados na fila de integração em produção. Três causas em `UGCTE017.tlpp` (notificação ao Fluig quando a
medição falha no Protheus): retry não cobria HTTP 500 (sem campo `code`), ausência de `LockByName` → colisão de nonce OAuth entre workers,
`ZZZ_MSGMED` sempre "Erro desconhecido Fluig". Entrega 14/07 (retry, semáforo, remoção de semáforo duplicado, encoding CP-1252); PR pendente
de aprovação ao fechar (29/07).

**Módulo/Rota:** Fluig → **Faturamento de Contratos** → *Gravar/Encerrar Medição (105)* → **Aguarda processamento Fila Protheus (182)** →
comentário do Administrador Cassi (`Pedido:<n>` ou erro estruturado) → *Pedido Gerado? (162)* → *Notifica Fornecedor (41)* ou
**Correção (117)** · Logs Protheus → aba **Medicoes ZZZ** (`Qtd T.Env Fl` = retry) · Tracker visão *Faturamento de Contratos*.

**Pré-condições**
- Medição `QA` aprovada até *Gravar/Encerrar Medição*, por fiscal/aprovador.
- Um cenário com falha provocável no ERP (ex.: saldo PCO insuficiente, como a 113249) para o ramo de erro.
- **Bloqueio:** a conta de QA não é fiscal/aprovador; Logs Protheus com `genericQuery` 404; não movimentar medições pré-existentes.
  **O caso reprova hoje** nas instâncias 111980/111977/111973 (causa nunca corrigida no ambiente — A16).

**Passos**
1. Após *Gravar/Encerrar Medição*, cronometrar a permanência em **Aguarda processamento Fila Protheus**.
2. Ler o comentário do Administrador Cassi nessa atividade: `Pedido:<n>` (sucesso) ou o erro estruturado
   (`Id do submodelo… Id do erro… mensagem do erro…`).
3. Conferir a atividade seguinte: *Notifica Fornecedor* → *Fim* (sucesso) ou *Correção* (falha), e o SLA (*Prazo*).
4. Em Logs Protheus → *Medicoes ZZZ*, filtrar pelo Id Fluig: status `P/E/S`, `Qtd T.Env Fl`, mensagem (`ZZZ_MSGMED`).
5. Amostragem: no Tracker (visão *Faturamento de Contratos*, sem filtro), contar as linhas com *Atividade Atual = Aguarda processamento
   Fila Protheus* e a *Data da Solicitação* de cada uma.

**Resultado esperado**
- Passo 1: saída da fila em **minutos** (SLA medido em 113249: 6 min entre 17:28:58 e 17:35:05) — nunca dias.
- Passo 2: sucesso registra `Pedido:<n>`; falha registra a **mensagem real** do ERP (não "Erro desconhecido Fluig"), com acentuação
  correta.
- Passo 3: falha vai para *Correção* com responsável (pool `G.P.FatConCorrecaoIntegraca`), nunca fica em 182 sem dono.
- Passo 4: ZZZ mostra retry ≥ 2 para HTTP 500 e a mensagem real; nenhuma medição `P` com mais de 1 dia.
- Passo 5: zero instâncias em 182 com Data da Solicitação anterior a ontem.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Processos presos em "Aguarda processamento Fila Protheus" por dias/semanas; `ZZZ_MSGMED = "Erro desconhecido Fluig"`; uma única
  tentativa após HTTP 500; textos acentuados corrompidos.

**Severidade:** Alta

**Preparação de massa:** medição `QA` (fiscal/aprovador) nos dois ramos; para o ramo negativo, contrato com bloqueio PCO conhecido.

**Verificado em tela:** PARCIAL
**O que foi verificado (08/09):** **111980, 111977 e 111973** `OPEN` em **Aguarda processamento Fila Protheus (182)** desde 17/08, 17/08 e
14/08 (**21–25 dias**), responsável *Administrador Cassi*, `Prazo: Sem prazo definido`, última linha do Histórico "Gravar/Encerrar Medição
… Integração executada com sucesso - Tempo de Execução 1 s" e **nenhum comentário** da fila depois disso (visto renderizado na 111980);
Tracker 111980: `Status=ABERTA`, `Atividade Atual=Aguarda processamento Fila Protheus`, contrato 00001-2023-4201, medição 000125. Ramo de
falha **funcionando** na **113249**: comentário do Administrador Cassi com o erro **real e estruturado** (`ERROR_PCO … Saldo Previsto :
1.750,42 Vs Saldo Realizado : 2.048,44 …`) 6 min após a gravação, *Pedido Gerado?* condição 1 → **Correção (117)** com pool
`G.P.FatConCorrecaoIntegraca`. Ramo de sucesso na **98070**: `Pedido:314356` em 5 min → *Notifica Fornecedor* → *Fim*. Logs Protheus:
abas *Erros CV8 / Solicitacoes ZZY / Medicoes ZZZ* renderizadas, `Consultar` → toast "Logs Protheus: Nao foi possivel consultar o dataset de
logs." e `genericQuery` **404** (visto renderizado).
**Divergências encontradas:** a correção existe para o ramo de falha (mensagem real gravada — 113249), mas **a fila continua deixando
instâncias sem resposta** (nem pedido, nem erro) por semanas — sintoma distinto do ticket (que tratava do ramo de erro), possivelmente
o "semáforo duplicado" ou instância sem worker. Diagnóstico bloqueado porque o widget de logs está fora. Reprova hoje por **causa não
corrigida no ambiente**, não por regressão.
**Dados/massa usados:** nenhum — não submetido; leitura de 111980/111977/111973, 113249, 98070.

---

## CT-FSWTBC-4759  (ambos · Concluído · SDCASSI-450)

**Título:** Enviar uma medição que o ERP recusa (saldo insuficiente) e conferir que a recusa volta ao Fluig, desvia a solicitação para Correção e mostra a mensagem.

**Origem:** FSWTBC-4759 — solicitações de faturamento 101733 e 101804 paradas em "aguarda processamento Fila Protheus": o erro de saldo existia no ERP mas **não voltava ao Fluig** porque o JSON de erro era grande demais. Correção: parâmetro que limita o tamanho da mensagem enviada ao Fluig + campo novo na ZZZ com a mensagem completa.

**Módulo/Rota:** Central de Tarefas → *Faturamento de Contratos* (`wf_faturamento_contratos`) → atividade **Realizar Medição do Contrato** → combo **Direcionar Processo para**; **Tracker** visão *FC*; **Histórico** da solicitação; widget **Logs Protheus** (`/portal/p/1/portal_logs_protheus`) → aba **Medicoes ZZZ**.

**Pré-condições**
- Contrato cujo saldo é menor que a medição a enviar (o executor não pode criar esse estado — é massa do ERP).
- Solicitação de faturamento desse contrato em *Realizar Medição do Contrato* sob responsabilidade do executor (fiscal).
- **Bloqueio:** a conta de QA não é fiscal de nenhuma das 241 FC abertas (não pode movimentá-las); o widget Logs Protheus responde 404 hoje (`genericQuery`) — instabilidade de ambiente.

**Passos**
1. Tracker → *Tipo* = FC → **Nº do Processo Fluig** → **Pesquisar Registro**: *Atividade Atual* = "Realizar Medição do Contrato".
2. Abrir a tarefa, informar quantidade acima do saldo, **Direcionar Processo para** → enviar.
3. Tracker FC: *Atividade Atual* passa a **"Aguarda processamento Fila Protheus"** (seq 182); cronometrar.
4. Após o retorno do ERP: *Atividade Atual* = **"Correção"** (seq 117), *Responsável Atual* = `Pool:Group:G.P.FatConCorrecaoIntegraca`.
5. Abrir a solicitação → **Histórico**: registro com a mensagem de erro do ERP.
6. Logs Protheus → **Medicoes ZZZ** → filtro **ID Fluig** = nº do processo → consultar: coluna **Status** de erro e **Msg Medicao** preenchida.
7. *(Protheus)* Tabela ZZZ: o campo novo com a mensagem completa contém o texto integral; `ZZZ_MSGMED` contém a versão truncada no limite do parâmetro.

**Resultado esperado**
- A solicitação sai de "Aguarda processamento Fila Protheus" em minutos (SLA real medido: ~7 min), nunca fica indefinidamente.
- O erro chega ao Fluig: atividade *Correção* + mensagem legível no Histórico (não vazia, não genérica, não exceção Java).
- "Msg Medicao" na ZZZ preenchida com a mensagem de negócio (truncada) — a completa fica no ERP.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Solicitações paradas em "aguarda processamento Fila Protheus" sem status nem mensagem; na homologação de 14/07, medição 96139 sem mensagem no Histórico.

**Severidade:** Alta

**Preparação de massa:** um contrato de QA com saldo insuficiente e uma FC dele atribuída ao executor como fiscal — depende de cadastro no Protheus (contrato, planilha, fiscal) que a automação não cria.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — Tracker FC hoje: filtros `filterTipo, numProcesso, usuarioSolicitante, status, dataSolicitacaoDeFC, dataSolicitacaoAteFC, zm_fornecedor, cgcFornecedorPlanilha, lojFornecedorPlanilha, numContrato, zoomCompetencia, numMedicao, situacaoMedicao, zm_numPlanilha, emailAprovadorCSE, emailFiscalServico, emailFiscalContrato`; colunas "Nº do Processo Fluig, Ações, Status, Solicitante, Data da Solicitação, Hora da Solicitação, Atividade Atual, Responsável Atual, Fornecedor, Código da Filial, Código da Filial Medição, Nº Contrato, Competência do Contrato, Nº Medição, Nº Planilha, CNPJ/CPF Fornecedor Planilha, Loja Fornecedor Planilha, Aprovador CSE, Fiscal de Serviço, Fiscal de Contrato". *Status* = Abertos: **253** registros — 241 Realizar Medição, **3 "Aguarda processamento Fila Protheus"** (111973 14/08, 111977 15/08, 111980 17/08 — as mesmas de 04/09), 2 Aprovação, 7 Correção. *API* — 111980: seq 8 "Aguarda processamento Fila Protheus" (182) `NOT_COMPLETED`, **sem responsável**; 101733 e 101804 (as do ticket): seq 14 na mesma atividade, **CANCELED em 16/06/2026** (encerradas por cancelamento, não por reprocessamento). Logs Protheus: título "Cassi - Fluig Plataforma - Logs protheus", abas **Erros CV8 / Solicitacoes ZZY / Medicoes ZZZ**, filtros da ZZZ (ID Fluig, Filial, Contrato, Status, Data inicial, Data final, tamanho da página) renderizados; grade presa em "Consultando logs..." com **404** em `/java_generico_protheus/tbc/api/framework/v1/genericQuery?...tables=Z…`. *Lido no fonte publicado* (`ZZZController`): colunas Filial, ID Fluig, Contrato, Revisao, Filial Medic, Num Med, Status, Data Recb Me, Hora Rec Med, Data Trat Me, Hora Eft Med, Json Medicao, **Msg Medicao** (`ZZZ_MSGMED`).
**Divergências encontradas:** (1) **o widget Logs Protheus não expõe o campo novo da ZZZ** com a mensagem completa — só `ZZZ_MSGMED`; a mensagem integral continua sem superfície no Fluig. (2) A fila está travada hoje (A16), portanto **este caso reprova agora**. (3) O ticket fala em "aguarda processamento Fila Protheus"; o rótulo na tela é "Aguarda processamento Fila Protheus" (mesma atividade, seq 182).
**Dados/massa usados:** FC 111980/111977/111973/101733/101804 (só leitura); nenhum envio.

---

## CT-FSWTBC-4775  (protheus · Aguardando Retorno de Homologação · SDCASSI-458)

**Título:** Submeter uma SC do tipo Contrato com rateio em três centros de custo (dois sem saldo) e conferir que a trava orçamentária não bloqueia o contrato e, ao bloquear um Pedido, lista todos os centros sem saldo de uma vez

**Origem:** FSWTBC-4775 — a trava orçamentária (PCO) não distingue **Pedido × Contrato** no Novo Fluxo de Compras (exige o valor plurianual inteiro no orçamento vigente; a regra é travar só nas **medições**) e **para no primeiro centro de custo sem saldo**. Em 18/08 o cliente demonstrou que os dois problemas persistem (SC 5303-000997 / cotação 5303-000598). Alinhado usar `C8_TPDOC` para a distinção; há pacote da Matriz (DBSUPINV-7335). **Aberto** — hoje o caso reprova.

**Módulo/Rota:** Fluig → **Solicitação de Compras** → *Tipo de Compra* (**Contrato** / Pedido) → rateio → aprovações → atividade **Verificar retorno Protheus (317)** → campo **Retorno Integração** e **Histórico**; **Faturamento de Contratos** → *Correção (117)* com `ERROR_PCO` no Histórico; **Portal do Comprador** → grade de cotações → coluna **Tip. Documento** (*Pedido de Compra* / *Contrato*). Protheus → PCO (saldos por centro de custo / conta orçamentária).

**Módulo ERP:** `Compras`

**Pré-condições**
- PCO de homologação parametrizado com **CC-A com saldo** e **CC-B, CC-C sem saldo** para a conta orçamentária do item (o ticket registrou "falta de parametrizações no PCO" em 17/08 — confirmar antes).
- Perfil para aprovar a SC (gestor e validação orçamentária) e comprador com matrícula.
- **Bloqueio:** a SC pode ser criada pela conta de QA, mas a trava só dispara após as aprovações — sem credencial de gestor/comprador/Protheus nesta rodada; Protheus instável (`genericQuery` 404).

**Passos**
1. (A — Contrato) Criar SC `QA` com *Tipo de Compra* = **Contrato**, valor plurianual maior que o saldo do exercício, rateio em CC-A/CC-B/CC-C.
2. Aprovar até a integração; ler o **Histórico** e o campo **Retorno Integração** da SC.
3. (Portal do Comprador) Localizar a cotação/SC e ler **Tip. Documento**.
4. (Faturamento) Criar medição desse contrato **dentro** do saldo de CC-A → seguir; criar outra que **estoure** o saldo → ler o Histórico.
5. (B — Pedido) Criar SC `QA` com *Tipo de Compra* = **Pedido**, rateio em CC-A/CC-B/CC-C; aprovar; ler o **Retorno Integração**.
6. Corrigir o saldo de CC-B **e** CC-C de uma vez; reenviar.

**Resultado esperado**
- Passo 2: SC de **Contrato não é bloqueada** pela trava orçamentária; *Retorno Integração* sem erro de PCO.
- Passo 3: *Tip. Documento* = **Contrato**.
- Passo 4: a trava atua **só na medição** — a que estoura vai para *Correção (117)* com `ERROR_PCO` no Histórico; a outra segue.
- Passo 5: mensagem de bloqueio lista **CC-B e CC-C** (todos os centros sem saldo).
- Passo 6: passa na primeira retentativa.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Contrato bloqueado como se fosse pedido (trava mesmo com *Tipo de documento* = Contrato); mensagem lista **apenas um** centro de custo — o usuário corrige um, reenvia, descobre o próximo ("cabe ao usuário conferir os demais").

**Severidade:** Alta *(controle orçamentário — bloqueio indevido de contratos plurianuais e validação parcial do rateio)*

**Preparação de massa:** saldos do PCO ajustados pelo executor no Protheus (um CC com saldo, dois sem); duas SCs `QA` (Contrato e Pedido) criadas pelo executor; medição do contrato criada pelo fiscal.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no bundle publicado do *Portal do Comprador*, `C8_TPDOC` é exibido como **"Tip. Documento"** com `1 = Pedido de Compra` e `2 = Contrato` — o campo que a correção vai ler já está na tela; estado de hoje (já medido, não remedido): **7 instâncias do Faturamento em *Correção (117)* por `ERROR_PCO`, visível só no Histórico**, e SC **112855** parada em *Verificar retorno Protheus (317)* há 11 dias com erro no `buyerRetIntTreat`, `erroIntegracao` vazio e Histórico dizendo "Integração executada com sucesso". Não foi possível disparar a trava (perfil).
**Divergências encontradas:** "trava orçamentária" do ticket é, na tela, a atividade **Verificar retorno Protheus (317)** e o campo **Retorno Integração**; o bloqueio do PCO no Faturamento **não aparece em campo do formulário**, só no Histórico; SC `5303-000997` / cotação `5303-000598` são numerações do ERP, não verificáveis pelo portal com esta conta.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4790  (fluig · Concluído · SDCASSI-460)

**Título:** Levar uma medição de Faturamento de Contratos à atividade de correção e conferir que ela cai no grupo responsável, com dono definido.

**Origem:** FSWTBC-4790 (incidente **SD816465**, MUD17927) — "Na atividade de correção o mecanismo de
atribuição não está configurado (Faturamento de contratos)". A atividade sem mecanismo era justamente
a de **correção**, que recebe todos os processos que falharam na integração: sem atribuição, esses
processos ficavam sem dono e o Fluig os direcionava pelo comportamento padrão. A solução registrada
foi criar o grupo **`G.P.FatConCorrecaoIntegraca`** e vinculá-lo às atividades de correção
(`usertask117`, `usertask123` e `usertask124`), com a versão do processo `wf_faturamento_contratos`
passando de **42 para 46**; liberado em produção pelo PR **70087**. É a **segunda** ocorrência do
mesmo defeito nesta base — a primeira foi o SDCASSI-420, na atividade "Ajustes na Proposta".

**Módulo/Rota:** **Processos → Faturamento de Contratos**
(`/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos`) — atividades de correção do
processo `wf_faturamento_contratos`.

**Pré-condições**
- Uma medição de Faturamento de Contratos que **falhe na integração com o ERP** e seja desviada para
  a atividade de correção — é o gatilho natural da atividade.
- Um usuário membro de **`G.P.FatConCorrecaoIntegraca`**, para conferir que a tarefa chega à caixa
  dele.
- **Bloqueio:** sim, duplo. (a) **Não há nenhuma tarefa de Faturamento de Contratos** na Central de
  Tarefas desta conta — as 10 tarefas disponíveis são de Cotação e de Solicitação de Compras. (b) A
  conta de QA **não pertence** a `G.P.FatConCorrecaoIntegraca`, então não veria a tarefa mesmo que
  existisse. Além disso, forçar a falha de integração exigiria derrubar a integração com o Protheus,
  o que não se faz na base do cliente. A conferência do vínculo atividade↔grupo é feita no **Fluig
  Studio / diagrama do processo**, que exige perfil de administrador.

**Passos**
1. Abrir uma medição de Faturamento de Contratos e movimentá-la até a etapa de integração com o ERP.
2. Com a integração indisponível (ou com o retorno de erro), deixar o processo ser desviado para a
   **atividade de correção**.
3. Autenticar com um usuário membro de `G.P.FatConCorrecaoIntegraca` e abrir a **Central de
   Tarefas → Tarefas a concluir**.
4. Conferir que a medição desviada aparece na fila desse usuário.
5. Abrir a tarefa e, na aba **Informações**, conferir a atividade corrente e o responsável.
6. Conferir, pela API de workflow em leitura
   (`GET /process-management/api/v2/requests/<nº>/tasks`), que o `assignee` da tarefa corrente
   corresponde ao grupo/pessoa esperado — e **não** a um responsável genérico herdado do
   comportamento padrão do Fluig.
7. Repetir para as três atividades de correção do processo (`usertask117`, `usertask123`,
   `usertask124`), que cobrem pontos diferentes do fluxo.
8. Conferir, no diagrama do processo publicado, que a **versão vigente é ≥ 46**.

**Resultado esperado**
- A medição que falha na integração **é atribuída** à atividade de correção com **mecanismo de
  atribuição configurado** — `Pool:Group:G.P.FatConCorrecaoIntegraca`.
- A tarefa **aparece na Central de Tarefas** dos membros desse grupo, e não fica sem dono.
- As **três** atividades de correção (`usertask117`, `usertask123`, `usertask124`) têm o mesmo
  mecanismo — nenhuma delas ficou de fora.
- A versão publicada de `wf_faturamento_contratos` é **46 ou superior**.
- Nenhuma instância do processo fica parada no grupo de correção sem responsável identificável.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A atividade de correção **sem mecanismo de atribuição configurado**: o processo desviado por falha
  de integração não chega à fila de ninguém, e o Fluig o direciona pelo comportamento padrão —
  produzindo os relatos de "processo parado no grupo de correção sem ninguém atuando". O ticket não
  registra mensagem de erro; a evidência é o print da atividade sem atribuição (`Screenshot_13.png`).

**Severidade:** Alta — processo de **faturamento** sem responsável para em silêncio. Medição parada é
pagamento a fornecedor parado, e a falta de dono faz o atraso passar despercebido.

**Preparação de massa:** uma medição de Faturamento de Contratos **com falha de integração
provocada** e um login membro de `G.P.FatConCorrecaoIntegraca`. Nenhum dos dois está ao alcance do
executor: a falha de integração depende de derrubar/simular o ERP (não se faz na base do cliente) e o
vínculo de grupo depende do administrador do Fluig. Alternativa realista: **aguardar** uma falha
espontânea de integração — o histórico do ambiente registra quedas do Protheus em 31/08, 01/09 e
03/09/2026 — e conferir, quando ocorrer, para onde o processo foi.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **Visto renderizado** — a rota
`/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos` existe e abre (título do documento
`Cassi - Fluig Plataforma - Movimentar Solicitação`), com o cabeçalho **Início** e as abas
**Formulário**, **Informações**, **Histórico** e **Anexos**, e os botões **Enviar** e **Opções**; o
processo também consta do menu do portal como **Faturamento de Contratos**. A Central de Tarefas
desta conta tem 10 tarefas e **nenhuma** delas é de Faturamento de Contratos, de modo que a atividade
de correção não pôde ser alcançada. **Confirmado por consulta ao dataset `colleagueGroup`** (leitura):
o grupo **`G.P.FatConCorrecaoIntegraca` existe no ambiente e tem 3 membros** — o nome do ticket está
correto e a vinculação de pessoas foi de fato feita. Existe também, e é coisa distinta, o grupo
**`G.P.FatCon_Correcoes`**, com **11 membros**, do qual a conta de QA participa (junto com
`G.P.FatCon_Inicio` e `G.P.Faturamento_de_Contratos`); a conta de QA **não** está em
`G.P.FatConCorrecaoIntegraca`. O vínculo atividade↔grupo e a versão do processo **não** puderam ser
lidos: as APIs de definição de processo não respondem a este login e o diagrama exige perfil de
administrador.
**Divergências encontradas:** uma, e vale checar antes de executar o caso. O ambiente tem **dois**
grupos de correção do Faturamento com nomes parecidos e propósitos aparentemente distintos —
**`G.P.FatConCorrecaoIntegraca`** (3 membros, o que o ticket diz ter sido criado para as atividades
de correção **de integração**) e **`G.P.FatCon_Correcoes`** (11 membros). O ticket não menciona o
segundo. Quem for validar precisa confirmar **qual dos dois** está vinculado a cada uma das três
atividades: um vínculo trocado reproduz o sintoma original — tarefa que não chega a quem deveria
atuar — sem que o mecanismo esteja "não configurado".
**Dados/massa usados:** nenhum — a tela do processo foi apenas aberta, sem preencher e sem clicar em
*Enviar*; os grupos foram consultados em leitura.

---

## CT-FSWTBC-4791  (ambos · Concluído · SDCASSI-461)

**Título:** Informar quantidade com seis casas decimais na medição de um contrato e conferir que o campo aceita, o total acompanha a precisão e o comportamento é o mesmo em qualquer processo.

**Origem:** FSWTBC-4791 — no processo 102916 (contrato 00001-2026-2501) a quantidade só aceitava 2 casas decimais; em outro processo aceitava 6. Sem 6 casas não é possível medir o contrato corretamente. Corrigido sem descrição técnica.

**Módulo/Rota:** Central de Tarefas → *Faturamento de Contratos* → **Realizar Medição do Contrato** → grade de itens, campos **Quantidade** (`quantidade___N`) e **Vlr. Desconto** (`valorDesconto___N`); coluna de total do item.

**Pré-condições**
- Solicitação de faturamento em *Realizar Medição do Contrato* de responsabilidade do executor (fiscal).
- Um segundo contrato, de outra filial/tipo de planilha, também em medição.
- **Bloqueio:** a conta de QA não é fiscal de nenhuma FC aberta — o formulário só abre em modo leitura para ela.

**Passos**
1. Abrir a tarefa; no item, digitar em **Quantidade** `1,234567`.
2. Tentar digitar uma 7ª casa decimal.
3. Digitar `1234,5` e sair do campo.
4. Ler o total do item.
5. Repetir os passos 1–4 no segundo contrato.
6. Enviar a medição (**Direcionar Processo para**) e, no ERP, conferir a quantidade gravada na medição (CND/CNE).

**Resultado esperado**
- O campo mantém `1,234567` (máscara decimal com **6 dígitos**, milhar `.`, decimal `,`, sem negativo).
- A 7ª casa é rejeitada pela máscara.
- `1234,5` é exibido como `1.234,500000` (ou equivalente com 6 casas).
- Total = preço × quantidade calculado em 6 casas, menos desconto.
- Mesmo comportamento nos dois contratos — a precisão não depende do processo/contrato.
- Quantidade gravada no ERP com as 6 casas.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Processo 102916 aceita só 2 casas; outro aceita 6; medição truncada.

**Severidade:** Alta

**Preparação de massa:** duas FC em *Realizar Medição do Contrato* atribuídas ao executor como fiscal (contratos distintos) — cadastro de fiscal no Protheus.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Lido no fonte publicado* (formulário 256836, `App/ViewHandler.js`): `this.listDecimal = { rateio: 8, default: 6 }`; **Quantidade** com `inputmask('decimal', { alias:'numeric', allowMinus:false, digits: 6, groupSeparator:'.', radixPoint:',', autoGroup:true })` (a máscara antiga `#.##9V####` está comentada); total do item: `parseFloat(vlrPreco * vlrQtd).toFixed(6) - vlrDesconto`, com o comentário `SDCASSI-461: valor total (qtd x preço) em 6 casas para acompanhar precisão da quantidade`. *Visto renderizado* — Tracker FC, **Nº do Processo Fluig** = 102916: FINALIZADA 19/06/2026, contrato **00001-2026-2501**, competência 06-2026, Nº Medição 000257, Nº Planilha 000002, fornecedor NEO ENGENHARIA. Não editei nenhuma medição.
**Divergências encontradas:** o "processo 96842" citado no ticket como o que aceitava 6 casas **não é Faturamento de Contratos**: é `bpm_recepcao_documentos_fiscais_contratos` (encerrado 14/05/2026, "Integra BookTrabalhista" → "Fim") e não aparece na visão FC do Tracker ("Nenhum registro encontrado"). A comparação do ticket foi entre processos de tipos diferentes. O ticket fala em "quantidade no pedido"; a tela é "Realizar Medição do Contrato".
**Dados/massa usados:** FC 102916, processo 96842 (só leitura).

---

## CT-FSWTBC-4792  (ambos · Concluído · SDCASSI-462)

**Título:** Concluir uma medição e conferir que o "Nº da Medição" gravado no Fluig é o mesmo número gerado no Protheus — e que, se a medição falhar, o card não fica com número divergente.

**Origem:** FSWTBC-4792 — medição 000250 no Fluig × 000252 no Protheus, exigindo troca manual do número para avançar. Causa: quando a medição falha no ERP, o retorno (JSON com `numMedicao`/`tituloPedido`) não é tratado pelo Fluig (SDCASSI-450) e o card fica com o número antigo enquanto o ERP avança a numeração. Encerrado sem correção neste ticket.

**Módulo/Rota:** Formulário de Faturamento de Contratos, campo **Nº da Medição** (`numMedicao`, somente leitura, preenchido a partir de `CND_NUMMED`); Tracker visão *FC*, coluna **Nº Medição**; widget **Logs Protheus** → **Medicoes ZZZ**, colunas **ID Fluig** e **Num Med**.

**Pré-condições**
- FC do executor pronta para envio da medição.
- **Bloqueio:** conta de QA não é fiscal; widget Logs Protheus com 404 hoje (ambiente).

**Passos**
1. Abrir a FC antes do envio e anotar **Nº da Medição**.
2. Enviar (**Direcionar Processo para**).
3. Aguardar a saída de "Aguarda processamento Fila Protheus".
4. Tracker FC (**Nº do Processo Fluig**): anotar **Nº Medição**.
5. Logs Protheus → Medicoes ZZZ → **ID Fluig** = nº do processo: anotar **Num Med** e **Status**.
6. Reabrir o formulário: **Nº da Medição**.
7. Variante de falha: enviar uma medição que o ERP recusa (ver CT-FSWTBC-4759) e repetir 4–6.

**Resultado esperado**
- Passos 4, 5 e 6 mostram o **mesmo** número; nenhum passo manual de "trocar o número".
- Na variante de falha: a FC vai para *Correção* com mensagem, **Nº da Medição** não é sobrescrito com número que o ERP descartou, e ao reprocessar o número final é o que a ZZZ mostra.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Fluig 000250 × Protheus 000252; o usuário troca o número à mão para a solicitação avançar.

**Severidade:** Alta

**Preparação de massa:** FC de QA atribuída ao executor como fiscal; para a variante, contrato com saldo insuficiente (massa do ERP).

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Lido no fonte publicado* — `form_fat.html`: rótulo **"Nº da Medição *"** (`numMedicao`, `readonly`), campo oculto `tituloPedido`; `App/EventHandler.js` linha 114: `setElementValue({ element: "numMedicao", value: that.dataMedicao.CND_NUMMED })` — o número vem do ERP; `ZZZController`: colunas **ID Fluig** e **Num Med** (a comparação Fluig × ERP é possível dentro do widget). *Visto renderizado* — Tracker FC 111980: **Nº Medição 000125**, Nº Planilha 000003, contrato 00001-2023-4201, competência 08-2026, na fila desde 17/08 — é uma instância em que o retorno ainda não foi processado (o número exibido é o do card). Widget ZZZ presa em "Consultando logs..." (404).
**Divergências encontradas:** o JSON de retorno (`chave___2 = numMedicao`, `valor___2 = cNumMed`, `tituloPedido`) é tratado em script de servidor — não legível pela conta de QA. A verificação cruzada depende do widget, indisponível hoje.
**Dados/massa usados:** FC 111980 (só leitura).

---

## CT-FSWTBC-4829  (ambos · Concluído · SDCASSI-472)

**Título:** Verificar que uma medição de contrato sai de "Aguarda processamento Fila Protheus" dentro do SLA (fila de Contratos consumida)

**Origem:** FSWTBC-4829 — processos de **contratos** parados na fila de execução da base DES (par do 4828, mesmo dia); concluído sem registro de causa. Hoje o mesmo sintoma está vivo: 111980/111977/111973 paradas há 22–25 dias.

**Módulo/Rota:** Processos → *Faturamento de Contratos* (`wf_faturamento_contratos`) → aba **Histórico**; Tracker → *Faturamento de Contratos*; **Logs Protheus** → aba *Medicoes ZZZ*

**Pré-condições**
- Contrato vigente com planilha de medição disponível, com o executor como *Fiscal de Serviço* (a medição só abre para o fiscal).
- SLA de referência: saída da atividade **182 Aguarda processamento Fila Protheus** em **≈ 7 min** (medido na 113249, A16).
- **Bloqueio:** a conta de QA não é fiscal de nenhum contrato — não consegue iniciar a medição. A **leitura** das instâncias paradas é possível e foi feita.

**Passos**
1. Abrir Tracker → *Faturamento de Contratos*, *Status* = Abertos; ordenar/observar *Atividade Atual*; anotar toda instância em **Aguarda processamento Fila Protheus** e a *Data da Solicitação*.
2. Para cada uma, abrir em modo detalhe → **Histórico**: contar entradas e saídas de *Aguarda processamento Fila Protheus* e ler o responsável da tarefa aberta.
3. (Com perfil de fiscal) iniciar uma medição `QA-4829`, concluir *Realizar Medição do Contrato*, e cronometrar do fim de *Gravar/Encerrar Medição* (105) até *Pedido Gerado?* (162).
4. Abrir **Logs Protheus** → *Medicoes ZZZ*, filtrar por *Id Fluig* = nº do processo; ler *Status* (P/E/S), *Data Recb Me / Data Trat Me* e *Msg Medicao*.

**Resultado esperado**
- Passo 1–2: nenhuma instância aberta em 182 por mais de 1 h; a tarefa em 182 tem responsável definido (não fica órfã).
- Passo 3: a fila é consumida em ≈ 7 min e o Histórico registra *Gravar Medição … Integração executada com sucesso*; o processo segue para *Pedido Gerado?* e *Notifica Fornecedor*.
- Passo 4: o registro ZZZ passa de `P` para `S` com *Data Trat Me* preenchida e *Msg Medicao* sem erro.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Medições estacionadas em *Aguarda processamento Fila Protheus* por dias/semanas, sem erro, sem responsável; ZZZ com *Status* `P` e *Data Trat Me* vazia.

**Severidade:** Alta

**Preparação de massa:** contrato vigente com planilha e um fiscal de serviço disponível para o passo 3. Para os passos 1–2 a massa **já existe**: 111980, 111977, 111973.

**Verificado em tela:** PARCIAL
**O que foi verificado:** via API de tarefas hoje: **111980** (v50, desde 17/08 18:40), **111977** (v50, 17/08 16:30) e **111973** (v49, 14/08 14:39) estão `OPEN`, tarefa **182 Aguarda processamento Fila Protheus** `NOT_COMPLETED`, responsável `admin`; cada uma com 2 entradas e 1 saída em 182 — **o sintoma do ticket reprova hoje**. Tracker *Faturamento de Contratos* respondeu para 104058 (FINALIZADA, contrato 00121-2023-4306, competência 06-2026, Nº Medição 000258). Aba ZZZ renderizada com os filtros citados.
**Divergências encontradas:** Logs Protheus indisponível (404 no genericQuery) — a ferramenta de diagnóstico da fila está fora justamente enquanto a fila trava (A16); 7 medições ativas em *Correção (117)* hoje (113249, 113248, 113247, 113227, 113153, 113152, 112582).
**Dados/massa usados:** leitura de 111980/111977/111973/104058 — nada movimentado.

---

## CT-FSWTBC-4842  (ambos · Concluído · SDCASSI-478)

**Título:** Encerrar uma medição e confirmar que o pedido de compra correspondente foi gerado antes de o fornecedor ser notificado

**Origem:** FSWTBC-4842 — medições encerradas no Protheus **sem gerar o Pedido de Compra** (ex.: processo 104058); só em produção, não reproduzido em TST/DEV; encerrado com ponto de entrada de log instalado e sem resultado analisado.

**Módulo/Rota:** Processos → *Faturamento de Contratos* → aba **Histórico** (gateway **Pedido Gerado? (162)**); Tracker → *Faturamento de Contratos*; **Logs Protheus** → *Medicoes ZZZ*

**Pré-condições**
- Contrato vigente com planilha, executor como fiscal de serviço; medição com *Pagamento?* = Sim (é o ramo que gera pedido).
- **Bloqueio:** conta de QA não é fiscal — não inicia medição. O número do pedido só é legível no Protheus (*Pedido de Compra*, tabela SC7) ou no JSON de retorno da ZZZ.

**Passos**
1. Iniciar *Faturamento de Contratos* para o contrato; em *Realizar Medição do Contrato* informar competência e itens; *Pagamento?* = Sim; concluir.
2. Aguardar a saída de *Aguarda processamento Fila Protheus*; abrir o **Histórico**.
3. Ler a decisão do gateway **Pedido Gerado?** e a atividade seguinte.
4. Abrir Tracker → *Faturamento de Contratos* → filtrar pelo processo; ler *Status*, *Atividade Atual*, *Nº Medição*.
5. Abrir **Logs Protheus** → *Medicoes ZZZ* → *Id Fluig* = processo; abrir *Json Medicao* e *Msg Medicao*.
6. (Protheus) Compras → Consultas → *Pedidos de Compra* pelo nº da medição / contrato.

**Resultado esperado**
- Passo 3: *Pedido Gerado?* → **Sim** e a próxima atividade é **Notifica Fornecedor (41)** e depois *Fim - Faturamento de Contratos (60)*; o processo **não** entra em *Correção (117)*.
- Passo 5: *Msg Medicao* contém o número do pedido gerado (não vazio) e *Status* = `S`.
- Passo 6: existe pedido com o número informado, vinculado à medição.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Medição encerrada no ERP, mas *Pedido Gerado?* → Não, processo em *Correção (117)* e o print "104058 pedido em branco" — número do pedido vazio.

**Severidade:** Alta

**Preparação de massa:** contrato + planilha + fiscal; uma medição `QA-4842` criada pelo executor. O 104058 já mostra a assinatura do defeito e do reprocesso e serve como referência de leitura.

**Verificado em tela:** PARCIAL
**O que foi verificado:** Histórico do **104058** (por API de tarefas): *Gravar/Encerrar Medição → Aguarda processamento Fila Protheus → Pedido Gerado? (admin, 8 min) → **Correção (117)** → Gravar/Encerrar Medição (admin, 26/06→07/07) → Fila → Pedido Gerado? → Notifica Fornecedor → Fim* — é exatamente o ciclo "pedido em branco → reprocesso". Tracker FC para 104058: *FINALIZADA*, contrato 00121-2023-4306, competência 06-2026, Nº Medição 000258, Nº Planilha 000001. Colunas ZZZ lidas no fonte publicado.
**Divergências encontradas:** o Tracker *Faturamento de Contratos* **não tem coluna de Nº do Pedido** — no Fluig o único sinal do pedido é o gateway *Pedido Gerado?* e o JSON da ZZZ; Logs Protheus indisponível hoje (404).
**Dados/massa usados:** leitura de 104058 — nada criado.

---

## CT-FSWTBC-5011  (ambos · Concluído · SDCASSI-510)

**Título:** Medição encerrada no Fluig gera pedido com número válido no ERP e não fica pendente por número em branco

**Origem:** FSWTBC-5011 — processo 109153: a medição gerou pedido com número **em branco** no Protheus e ficou pendente
(reincidência do SDCASSI-478). Causa: campo chegando preenchido com espaços, que passava pela validação de "não vazio".
Correção: não deixar entrar campos com espaço (PR 71529), homologada em 29/07.

**Módulo/Rota:** `wf_faturamento_contratos`: *Realizar Medição do Contrato* → *Gravar/Encerrar Medição* (105) → **Aguarda
processamento Fila Protheus** (182) → *Criar Pedido de Compras* (36) / *Correção* (117, pool `G.P.FatConCorrecaoIntegraca`).
Superfícies: aba **Histórico**; widget **Logs Protheus** → aba **Medicoes ZZZ** (`/portal/p/1/portal_logs_protheus`); Tracker →
*Faturamento de Contratos* (`table-fc`).

**Pré-condições**
- Contrato vigente com planilha e fiscal cadastrados (descoberto em tempo de execução — não fixar).
- Perfil de fiscal para realizar e encerrar a medição (a conta de QA já iniciou Faturamentos em lotes anteriores).
- Fila ZZZ do Protheus processando (hoje há 3 instâncias paradas na 182 há 21–25 dias).
- **Bloqueio:** o número do pedido gerado só é conferível no Protheus (sem credencial); no Fluig confere-se o desfecho do
  processo e o log da fila. A fila está travada hoje (ambiente) — caso de Fluig com bloqueio de massa/ambiente.

**Passos**
1. Iniciar *Faturamento de Contratos* para o contrato da pré-condição, preencher a medição (prefixo `QA` nos textos livres) e
   encerrar com **Direcionar Processo para**.
2. No Histórico, aguardar "Gravar/Encerrar Medição … Integração executada com sucesso" e a saída de *Aguarda processamento
   Fila Protheus* (SLA real medido em lote anterior: ~7 min).
3. Confirmar que o processo segue para *Criar Pedido de Compras* (36) e termina sem passar por *Correção* (117/122).
4. Em **Logs Protheus → Medicoes ZZZ**, filtrar pelo processo e ler o registro: status de envio e `Qtd T.Env Fl` (retentativas).
5. Onde houver retorno do ERP no log, conferir que o número do pedido tem 6 dígitos (ex.: `009020`) e não é vazio/espaços.

**Resultado esperado**
- Processo encerra normalmente; nenhuma tarefa de *Correção* aberta para a medição.
- Log ZZZ com a medição processada uma vez (`Qtd T.Env Fl` baixo) e o retorno do ERP com número de pedido preenchido.
- Nenhum campo enviado ao ERP contém apenas espaços.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Medição "pendente" no ERP com pedido de número em branco; no Fluig, o processo cai em *Correção* ou fica em *Aguarda
  processamento Fila Protheus*.

**Severidade:** Alta

**Preparação de massa:** contrato com planilha vigente e fiscal (pré-condição de leitura); fila ZZZ operante. A medição pode ser
criada pelo executor com carimbo `QA` — cancelável ao fim.

**Verificado em tela:** PARCIAL
**O que foi verificado:** (a) via API, a instância **109153** do ticket: 182 → 162 → **117 Correção** (`CANCELED` em 29/07/2026
12:14, data da homologação), pool `G.P.FatConCorrecaoIntegraca`; (b) **visto renderizado** — Histórico do Faturamento 111980:
"Gravar/Encerrar Medição … Integração executada com sucesso - Tempo de Execução 1 s" → "Aguarda processamento Fila Protheus
(Em progresso) · Responsável: Administrador Cassi | Prazo: Sem prazo definido", parada desde 17/08; (c) widget Logs Protheus
abre com as abas **Erros CV8 / Solicitacoes ZZY / Medicoes ZZZ**, campos de filial, período e texto, mas o `genericQuery`
(`tables=CV8`) responde 404 hoje — ambiente; (d) **lido no fonte publicado** — o JS do Faturamento aplica `.trim()` em
`numMedicao`, `zoomNumContrato`, `numProcessoPai` e nas células importadas (`qtdMedir`, `desconto`), e declara
`criarPedidoCompras: 36, correcaoCriarPedidoCompras: 122`. Nenhuma medição foi encerrada.
**Divergências encontradas:** a atividade *Aguarda processamento Fila Protheus* está **sem prazo** ("Sem prazo definido") — o
mesmo controle pedido no SDCASSI-507 para a 317 não existe aqui, e as três instâncias vivas estão paradas há 3 semanas.
**Dados/massa usados:** leitura de 109153 e 111980 — nenhum — não submetido.

---

## CT-FSWTBC-5145  (ambos · Concluído · SDCASSI-538)

**Título:** Informar um desconto num item da medição de contrato e ver o **Valor Total** recalculado em tela na hora

**Origem:** FSWTBC-5145 — na realização da medição, o desconto deixou de ser calculado em tela (regressão; antes funcionava). Mesma frente do
SDCASSI-521 (desconto no saldo). Corrigido no mesmo dia, sem causa raiz registrada.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** (formulário 256836) → *Realizar Medição do Contrato (25/28)* → seção *Itens da Medição*
(`tblItensMedicao`): campos **Quantidade \***, **Valor Unitário \***, **Valor Desconto \*** (`valorDesconto___n`), **Valor Total \***, **Saldo a Medir \***.

**Pré-condições**
- Medição `QA` aberta pelo executor (fiscal do contrato) com fornecedor → contrato → competência → filial encadeados nos zooms, para que
  *Itens da Medição* apareça.
- **Bloqueio:** a conta de QA não é fiscal de contrato; os itens só aparecem após o encadeamento dos zooms do Protheus (mapa do ambiente). Não
  submeter.

**Passos**
1. Abrir a medição na etapa *Realizar Medição do Contrato* e incluir um item da planilha.
2. Anotar **Quantidade**, **Valor Unitário** e **Valor Total** calculados.
3. Digitar um valor em **Valor Desconto** menor que Quantidade × Valor Unitário e sair do campo.
4. Digitar um valor **maior** que Quantidade × Valor Unitário.
5. Corrigir para um valor válido e conferir de novo o **Valor Total**.

**Resultado esperado**
- Passo 3: **Valor Total** = Quantidade × Valor Unitário − Valor Desconto, atualizado **em tela** sem salvar.
- Passo 4: aviso "**O valor do desconto não pode ser maior que o valor total.**", exibido **uma vez** por linha (não a cada tecla).
- Passo 5: o total volta a refletir o desconto válido; *Saldo a Medir* coerente.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- **Valor Total** não muda ao informar o desconto (o cálculo só acontece, se acontece, depois de salvar).

**Severidade:** Média

**Preparação de massa:** contrato com planilha e saldo, fiscal do contrato; medição `QA` sem envio.

**Verificado em tela:** PARCIAL
**O que foi verificado:** rótulos **Competência do Contrato \*, Nº da Planilha \*, Saldo a Medir \*, Quantidade \*, Valor Unitário \*, Valor
Desconto \*, Valor Total \*, Classe de Valor \*, Direcionar Processo para \*** lidos no fonte publicado do formulário 256836; em
`js_256836_App_EventHandler.js`, `handleUpdateItemTotalValue` lê `valorDesconto___${lineIndex}` e recalcula (linhas 319–328), com o toast "O valor do
desconto não pode ser maior que o valor total."; medição **111980** aberta em modo leitura (abas *Formulário / Informações / Histórico 6 / Anexos 0*)
— a sonda **não** encontrou "Desconto" renderizado porque *Itens da Medição* fica oculto até o encadeamento dos zooms. Não exercitado.
**Divergências encontradas:** o ticket diz "cálculo do desconto"; o campo chama-se **Valor Desconto \*** e o efeito é no **Valor Total \***.
**Dados/massa usados:** nenhum — não submetido; leitura de 111980.

---

## CT-FSWTBC-5162  (ambos · Concluído · SDCASSI-542)

**Título:** Realizar medição de um contrato cujo tipo de planilha foi alterado (*Alterar Tp. Planilha*) e ver os itens da planilha disponíveis —
sem "Não existem itens a serem medidos para a planilha 000002"

**Origem:** FSWTBC-5162 — medição 112816 do contrato 00009-2025-5303 com erro "Não existem itens a serem medidos para a planilha 000002" (a 112817
do mesmo contrato não), inclusive pelo Protheus. Causa: *Alterar Tp. Planilha* (manutenção de contratos) deixava `CNA_CRONOG` inconsistente;
correção só para novos ajustes + segunda rodada para planilha separada em mais de um item; o registro existente foi corrigido **manualmente
em banco** (APSDU). Contratos alterados antes da correção não foram levantados.

**Módulo/Rota:** Protheus → SIGAGCT → Gestão de Contratos → *Contratos* → **Alterar Tp. Planilha** (CNA) · Fluig → **Faturamento de Contratos** →
*Realizar Medição do Contrato* → zoom **Nº da Planilha \*** / **Saldo a Medir \*** (datasets `ds_fatcon_get_info_medicoes` → `STATUS/RESPONSE`,
`dsProtheus_getInfoPlanilhaxContrato_restGetAll`, `dsProtheus_getItensPlanilha_restGetAll`) · Histórico da medição · Logs Protheus → *Medicoes ZZZ*.

**Pré-condições**
- Contrato `QA` com **duas** planilhas (000001, 000002), multifilial, e uma delas com o tipo alterado por *Alterar Tp. Planilha* **depois** da
  correção; uma variante com a planilha separada em mais de um item.
- **Bloqueio:** *Alterar Tp. Planilha* exige credencial Protheus (não disponível); a conta de QA não é fiscal. Não movimentar 112816/112817.

**Passos**
1. No Protheus, alterar o tipo da planilha 000002 do contrato `QA` (e, na variante, separar a planilha em mais de um item).
2. No Fluig, iniciar **Faturamento de Contratos** para esse contrato, selecionar a competência e a filial e abrir o zoom **Nº da Planilha**.
3. Selecionar a planilha 000002 e incluir um item.
4. Repetir 2–3 para a planilha 000001.
5. Se houver erro, ler a mensagem no formulário e no **Histórico**; conferir *Medicoes ZZZ*.

**Resultado esperado**
- Passos 3–4: as duas planilhas listam itens com **Saldo a Medir** > 0; nenhuma mensagem "Não existem itens a serem medidos para a planilha …".
- Contratos alterados **antes** da correção, se ainda inconsistentes, produzem a mesma mensagem — devem ser levantados (pendência declarada no ticket).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- "**Não existem itens a serem medidos para a planilha 000002**" numa medição, enquanto outra medição do mesmo contrato funciona.

**Severidade:** Alta

**Preparação de massa:** contrato `QA` com duas planilhas e tipo alterado após a correção (Protheus); fiscal do contrato no Fluig.

**Verificado em tela:** PARCIAL
**O que foi verificado:** datasets **`dsProtheus_getInfoPlanilhaxContrato_restGetAll`** (200, colunas `CNA_TIPPLA, CNA_REVISA, CNA_NUMERO, CNL_DESCRI…`),
**`dsProtheus_getItensPlanilha_restGetAll`** (200, `CNB_QUANT, CNB_QTDMED, CNB_SLDREC…`) e **`ds_fatcon_get_info_medicoes`** (200, `STATUS, RESPONSE`)
existem hoje; rótulos **Nº da Planilha \*** e **Saldo a Medir \*** lidos no fonte publicado 256836. Instâncias **112816/112817** neste tenant são
**Solicitações de Compras** (112816 em *Verificar retorno Protheus* desde 27/08; 112817 em *Validação do Comprador*), não medições. Lado Protheus não executado.
**Divergências encontradas:** os números "medição 112816/112817" **não correspondem** a Faturamentos neste tenant (são SCs v95) — o ticket cita
instâncias de outro ambiente ou números da medição no ERP. A coluna `CNA_CRONOG` não é exposta por nenhum dataset consultado.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-5163  (ambos · Concluído · SDCASSI-543)

**Título:** Carregar uma medição com muitos itens e rateios e disparar o encaminhamento sem a tela entrar em varredura contínua

**Origem:** FSWTBC-5163 — "não é possível disparar medições: o sistema permanece em looping, varrendo continuamente os contratos" (vídeo de 23,9 MB
no ticket). Sem causa raiz registrada no ticket; o **fonte publicado** do formulário 256836 traz comentários `SDCASSI-543` que explicam: o rescan
da tabela rodava **a cada linha incluída** e o aviso de desconto abria **um modal por tecla digitada**.

**Módulo/Rota:** Fluig → **Faturamento de Contratos** (formulário 256836) → *Realizar Medição do Contrato* → carga de *Itens da Medição* e *Rateio*
(`handleNewItemApportionment`, `handleChangeRateio`) → campo **Valor Desconto \*** → combo **Direcionar Processo para \*** → Enviar.

**Pré-condições**
- Medição `QA` de um contrato com planilha de **muitos itens** (≥ 30) e rateio em vários centros de custo.
- **Bloqueio:** a conta de QA não é fiscal de contrato; não submeter medição.

**Passos**
1. Abrir a medição e carregar os itens da planilha (zoom **Nº da Planilha**); cronometrar até a tabela ficar estável.
2. Incluir mais 5 linhas de item e 5 de rateio, uma a uma.
3. Digitar um desconto inválido (maior que o total) num item, tecla a tecla.
4. Escolher a opção em **Direcionar Processo para \*** e clicar em Enviar (ou apenas validar, sem enviar).

**Resultado esperado**
- Passo 1: um único rescan ao final da carga; a tela estabiliza em segundos e o navegador responde.
- Passo 2: cada inclusão processa **só a linha nova**; sem re-varredura da tabela inteira.
- Passo 3: **um** aviso "O valor do desconto não pode ser maior que o valor total." por linha; sem modal a cada tecla.
- Passo 4: o envio prossegue (ou a validação conclui) sem loop.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Tela em looping varrendo continuamente; impossível disparar a medição; modais em sequência ao digitar o desconto.

**Severidade:** Alta

**Preparação de massa:** contrato com planilha grande e rateio múltiplo; fiscal do contrato.

**Verificado em tela:** PARCIAL
**O que foi verificado:** lido no fonte publicado `js_256836_App_EventHandler.js`: linha 257 "SDCASSI-543: passa o indice da linha recem incluida
para nao re-processar a tabela inteira"; linha 322 "SDCASSI-543: handleUpdateItemTotalValue roda no input/keyup do desconto. O aviso era um modal
por tecla digitada; agora avisa uma vez por linha e so rearma quando o valor volta a ser valido"; linhas 453/993/1270 "um unico rescan ao final da
carga substitui o rescan que antes rodava a cada linha incluida". Rótulo **Direcionar Processo para \*** presente. Não exercitado (sem fiscal).
**Divergências encontradas:** o ticket descreve "varrendo continuamente os **contratos**"; pelo fonte, a varredura era das **tabelas de itens e
rateio da medição** (rescan por linha) e o modal do desconto — o defeito é do formulário Fluig, não do ERP.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-5185  (ambos · Concluído · SDCASSI-550)

**Título:** Encerrar uma medição com muitos itens e rateios e ver *Gravar/Encerrar Medição* concluir em segundos — sem
`javax.ejb.EJBTransactionRolledbackException: null`

**Origem:** FSWTBC-5185 — medições com `EJBTransactionRolledbackException: null`. Causa: a **servicetask105** fazia ~3.800 `hAPI.getCardValue` nos
laços de `tblRateio` × `tblItensMedicao` e estourava os **300 s** da transação JTA antes de chamar o ERP (o ERP respondia em 0,03–1,36 s).
Correções: `getCardData` único, laços O(itens + rateios), erro com número da solicitação, log com quantidades, remoção da servicetask114; no
formulário 256836, caches por produto/CC/classe (promise), `skipRefresh`, `Promise.all`, `off('keyup')` antes de `on('keyup')`. Achado do cliente:
o erro na ZZZ/UGCTE017 ocorre ao reexecutar medição já travada por falta de saldo.

**Módulo/Rota:** Fluig → Faturamento de Contratos → *Realizar Medição do Contrato* → *Pagamento? (192)* → **Gravar/Encerrar Medição (105)** →
**Aguarda processamento Fila Protheus (182)** → *Pedido Gerado? (162)* → *Notifica Fornecedor (41)* / *Correção (117)* · Histórico ("Integração
executada com sucesso - Tempo de Execução N") · Logs Protheus → **Medicoes ZZZ** · formulário 256836 (grades `tblItensMedicao`, `tblRateio`).

**Pré-condições**
- Medição `QA` com **muitos itens e rateios** (≥ 30 itens × ≥ 5 centros de custo) e saldo orçamentário suficiente.
- **Bloqueio:** a conta de QA não é fiscal de contrato; não movimentar 111980/111977/111973/113249; Logs Protheus com `genericQuery` 404 hoje.

**Passos**
1. Abrir a medição, carregar itens e rateios; cronometrar a carga e trocar de linha várias vezes (caches).
2. Direcionar o processo e enviar; abrir o **Histórico**.
3. Ler o tempo em "Gravar/Encerrar Medição Executando atividade de serviço do sistema — Integração executada com sucesso - Tempo de Execução N".
4. Aguardar a fila: ler o comentário de *Administrador Cassi* em *Aguarda processamento Fila Protheus* (ex.: `Pedido:NNNNNN`) e a decisão de
   *Pedido Gerado?*.
5. (Negativo) Reexecutar uma medição já travada por falta de saldo e ler o erro em *Medicoes ZZZ*.

**Resultado esperado**
- Passo 3: tempo em **segundos** (referências vistas: 1 s, 869 ms), nunca 300 s; nenhuma tentativa repetida da 105.
- Passo 4: a fila devolve o pedido em minutos (SLA medido: 6–7 min na 113249) e segue para *Notifica Fornecedor*.
- Em erro, a mensagem traz o **número da solicitação** (não `NullPointer` sem contexto) e o log registra quantidade de itens/rateios.
- Passo 5: erro explícito e rastreável na ZZZ, sem `EJBTransactionRolledbackException`.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Três tentativas de *Gravar/Encerrar Medição* com **exatamente 300 s** cada e `javax.ejb.EJBTransactionRolledbackException: null`; medição não
  encerra.

**Severidade:** Alta

**Preparação de massa:** contrato com planilha grande e rateio múltiplo; fiscal; saldo orçamentário liberado.

**Verificado em tela:** PARCIAL
**O que foi verificado:** Histórico visto renderizado: **110567** "Gravar/Encerrar Medição … Tempo de Execução **1 s**" → fila comentou
"**Pedido:314850**" (4 min 28 s depois) → *Pedido Gerado?* cond. 2 → *Notifica Fornecedor* (419 ms) → Fim; **113249** "Tempo de Execução **869 ms**"
→ fila respondeu em 6 min com `ERROR_PCO` → *Correção*; **111980** "Tempo de Execução 1 s" e **nenhuma resposta da fila em 22 dias**. Atividade
**114 não existe** em nenhum dos 1.000 movimentos do Faturamento (v47–51). Instâncias do ticket: **112995** = SC `CANCELED` (31/08);
**111723/111724/111733/111734/111735** = Faturamentos `CANCELED` em *Realizar Medição do Contrato* (10/08). Logs Protheus 404. Não exercitado.
**Divergências encontradas:** as seis instâncias do ticket foram **canceladas** neste tenant (uma é SC, cinco são medições que nunca chegaram à 105)
— o defeito não é reproduzível nelas. O gargalo hoje **não é a 105** (≤ 1 s) e sim a **fila 182**, que não responde há 22–25 dias (A16).
**Dados/massa usados:** nenhum — não submetido; leitura de 110567, 113249, 111980.

---

## CT-FSWTBC-5186  (ambos · Em Homologação · SDCASSI-549)

**Título:** Ter uma medição recusada pelo Protheus (bloqueio PCO, mensagem de várias linhas) e ver o motivo **completo** no Histórico da
solicitação e no log de acompanhamento — sem "Encerramento falhou e Fluig rejeitou notificação de erro"

**Origem:** FSWTBC-5186 — medições travadas com "Status E - V3.0 Encerramento falhou e Fluig rejeitou notificação de erro". (1) O log de
acompanhamento não guardava o motivo (mensagem genérica); corrigido para gravar mensagem, payload, endereço e tentativas. (2) O aviso de erro do
Protheus **não era aceito pelo Fluig quando ocupava mais de uma linha** — típico das recusas por saldo orçamentário (PCO); corrigido preparando a
mensagem. O ajuste torna a falha rastreável mas **não** desbloqueia a medição (falta real de saldo: previsto R$ 6.990,06 × realizado R$ 7.982,90).
**Em Homologação** desde 27/08; depende do 2º pacote em CC54GO_DES/DES_REST.

**Módulo/Rota:** Fluig → Faturamento de Contratos → *Gravar/Encerrar Medição (105)* → **Aguarda processamento Fila Protheus (182)** → comentário
de *Administrador Cassi* → *Pedido Gerado? (162)* → **Correção (117)** (pool `G.P.FatConCorrecaoIntegraca`) · Histórico · Logs Protheus →
**Medicoes ZZZ** / **Erros CV8** · Protheus: UGCTE017 (encerramento), log de acompanhamento.

**Pré-condições**
- Medição `QA` cujo rateio estoure o saldo PCO do cubo PLANILHA+CO+CLASSE+OPERAÇÃO (mensagem longa, multilinha).
- **Bloqueio:** a conta de QA não é fiscal nem membro do pool de Correção; Logs Protheus com `genericQuery` 404; sem credencial Protheus para o
  log de acompanhamento. Correção **em homologação** — pode reprovar hoje.

**Passos**
1. Enviar a medição e aguardar a fila (Histórico).
2. Ler o comentário de *Administrador Cassi* em *Aguarda processamento Fila Protheus*.
3. Conferir a atividade seguinte e o responsável.
4. Em Logs Protheus → *Medicoes ZZZ* (e *Erros CV8*), filtrar pela medição e ler a mensagem, o payload e o nº de tentativas.
5. No Protheus, abrir o log de acompanhamento da UGCTE017 para a mesma medição.

**Resultado esperado**
- Passo 2: comentário com a mensagem **integral** do PCO (`ERROR_PCO`, cubo, saldo previsto × realizado, contingência, lançamento, CO, classe,
  medição, contrato) — incluindo quebras de linha; o campo "mensagem da solução" preenchido quando houver.
- Passo 3: *Correção (117)* atribuída ao pool, com o motivo visível **sem abrir chamado**.
- Passos 4–5: registro com mensagem completa, payload, endereço acionado e tentativas; execuções bem-sucedidas **não** classificadas como erro.
- A medição continua bloqueada até haver saldo — isso é regra, não defeito.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- "**Status E - V3.0 Encerramento falhou e Fluig rejeitou notificação de erro**" no ERP; no Fluig a medição fica sem retorno, presa em *Aguarda
  processamento Fila Protheus*; log de acompanhamento com mensagem genérica.

**Severidade:** Alta

**Preparação de massa:** contrato com rateio em CO/classe sem saldo PCO no período; fiscal; membro do pool de Correção; credencial Protheus.

**Verificado em tela:** PARCIAL
**O que foi verificado:** Histórico da **113249** visto renderizado: comentário de *Administrador Cassi* em 03/09 17:35:04 com a mensagem **completa
e multilinha** `Id do submodelo de origem:CNEDETAIL - Id do campo de origem:CNE_VLTOT - … Id do erro:ERROR_PCO - mensagem do erro: Os saldos atuais do
Planejamento e Controle Orçamentário são insuficientes … Tipo de Bloqueio : BLOQUEIO Processo : MEDICAO DE CONTRATO Cubo : PLANILHA+CO+CLASSE+OPERAÇÂO
PLANILHA : ORC2026 0001 - CO : 0585 - CLASSE : 441094 … Saldo Previsto : 1.750,42 Vs Saldo Realizado : 2.048,44 Valor Contingência >>> 298,02 Valor do
Lançamento >>>>>> 287,24 … RATEIO MEDICAO: 000146 - 006 CONTRATO:00001-2022-5304 - mensagem da solução:` → *Pedido Gerado?* cond. 1 → **Correção**
(pool `G.P.FatConCorrecaoIntegraca`, prazo desde 04/09 17:35). Ou seja, **neste tenant a notificação multilinha já chega** (pacote de 27/08 aplicado
aqui). Contraste: **111980/111977/111973** sem nenhum comentário da fila há 22–25 dias — o sintoma "sem retorno ao usuário" segue vivo nelas (A16).
Logs Protheus 404; Protheus não acessado.
**Divergências encontradas:** o ticket cita saldo 6.990,06 × 7.982,90; a ocorrência viva neste tenant é 1.750,42 × 2.048,44 (medição 000146, contrato
00001-2022-5304). O campo "mensagem da solução" vem **vazio**. Correção em homologação: caso pode reprovar em outros ambientes.
**Dados/massa usados:** nenhum — não submetido; leitura de 113249 e 111980.

---

## CT-FSWTBC-5240  (ambos · Concluído · SDCASSI-560)

**Título:** Encerrar uma medição de contrato cuja revisão foi alterada no Protheus depois da abertura da solicitação de Faturamento

**Origem:** FSWTBC-5240 — medições não encerravam quando o número da revisão do contrato era diferente: o formulário de Faturamento grava `numRevisao` no momento da abertura e, se o contrato é revisado no ERP depois, o encerramento (chave contrato + revisão) não localiza o registro. Correção: dataset sincronizado `dsSync_corrigeRevisaoFatContratos` que percorre as solicitações ativas, compara `numRevisao` com a revisão vigente (CN9 situação 05, `CN9_REVATU` ou maior `CN9_REVISA`, **revisão em branco é valor válido**), atualiza por envio parcial e registra observação no Histórico via `ECMWorkflowEngineService` com `completeTask=false`; cinco guardas (sem contrato vigente, falha de integração, medição com pedido/título, sem contrato, sem filial). A causa — congelar a revisão na abertura — permanece por desenho.

**Módulo/Rota:** Fluig: **Faturamento de Contratos** (formulário 256836) → zoom **Nº Contrato** (preenche `numRevisao` oculto com `CNA_REVISA`) → **Nº da Planilha** → combo **Direcionar Processo para** (encerramento); aba *Histórico* (observação do ajuste); *Tracker* → *Faturamento de Contratos* (coluna *Revisão*); widget *Logs Protheus* → *Medicoes ZZZ* (coluna **Revisao**, **Msg Medicao**). Protheus: **Contratos - GCT** — `CNTA300` (revisão do contrato, `CN9_REVISA`/`CN9_REVATU`/`CN9_SITUAC=05`), `CNTA120`/medições (`CND`).

**Pré-condições**
- Uma solicitação de Faturamento **aberta** (em *Realizar Medição do Contrato*, 28, ou anterior a *Gravar/Encerrar Medição*, 105) para um contrato vigente, ainda sem pedido/título gerado.
- Depois de aberta, o contrato recebe **nova revisão** no Protheus (`CNTA300` → revisar → efetivar, `CN9_SITUAC=05`), mudando `CN9_REVISA`.
- Dataset `dsSync_corrigeRevisaoFatContratos` publicado e agendado (sincronização periódica).
- **Bloqueio:** sem credencial Protheus para revisar o contrato; **o dataset `dsSync_corrigeRevisaoFatContratos` não existe neste tenant** (`GET dataset/search` → 500 NPE, igual ao controle negativo) — a correção não está aplicada nesta base.

**Passos**
1. No Fluig, abra *Faturamento de Contratos* → nova solicitação; no zoom **Nº Contrato** escolha o contrato de teste e anote a revisão carregada (campo oculto `numRevisao`; visível no *Tracker* → *Faturamento de Contratos*, coluna *Revisão*, após gravar). Salve a solicitação sem encerrar a medição.
2. No Protheus (`CNTA300`), crie e efetive uma **nova revisão** do mesmo contrato (situação 05). Anote o novo `CN9_REVISA`.
3. Aguarde o ciclo do dataset sincronizado `dsSync_corrigeRevisaoFatContratos`.
4. No Fluig, reabra a solicitação → aba **Histórico**: procure a observação de ajuste da revisão (gravada sem movimentar o processo).
5. No *Tracker* → *Faturamento de Contratos*, filtre pelo nº do processo e leia a coluna **Revisão**.
6. Conclua a medição: preencha os itens e escolha em **Direcionar Processo para** a opção de encerramento; envie.
7. Acompanhe: *Gravar/Encerrar Medição* (105) → *Aguarda processamento Fila Protheus* (182) → saída em minutos (SLA medido ~7 min). No widget *Logs Protheus* → *Medicoes ZZZ*, filtre por *Id Fluig* e leia **Revisao** e **Msg Medicao**.
8. (Negativos das guardas) Repita o passo 3 com uma solicitação que já tenha pedido/título gerado, e com um contrato cuja revisão vigente esteja **em branco** (primeira revisão): a revisão gravada não pode ser alterada no primeiro caso, e no segundo o contrato **não** pode ser apontado como divergente.

**Resultado esperado**
- Após o ciclo do dataset, `numRevisao` da solicitação passa a ser a revisão vigente no ERP; o Histórico traz a observação do ajuste **sem** mudança de atividade (a tarefa continua com o mesmo responsável).
- A medição encerra: a instância sai de *Aguarda processamento Fila Protheus* dentro do SLA, ZZZ mostra a medição com a **Revisao** vigente e `Msg Medicao` de sucesso; no Protheus a medição (`CND`) fica encerrada na revisão correta.
- Contrato na revisão inicial (em branco) não é tocado; solicitação com pedido/título gerado não é alterada.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Medição 113606 (produção) não encerra: a chave contrato+revisão antiga não localiza o registro no ERP; processo fica preso em *Aguarda processamento Fila Protheus* ou vai para *Correção* (117).

**Severidade:** Alta *(medição não encerra — bloqueia faturamento/pagamento de contrato)*

**Preparação de massa:** solicitação de Faturamento aberta pelo executor (prefixo `QA` na observação) sobre contrato de teste; **alguém com acesso ao `CNTA300`** para efetivar a nova revisão; publicação/agendamento do `dsSync_corrigeRevisaoFatContratos` nesta base (hoje ausente).

**Verificado em tela:** PARCIAL
**O que foi verificado:** formulário 256836 publicado: `numRevisao` é `<input type="hidden" internal="true">`, preenchido no `ZoomHandler.js` a partir de `item.CNA_REVISA` ao escolher o contrato, e reaproveitado em `getCompetences({numRevision})`, em `getContractSpreadsheetType` (`REVCONTRATO`) e no zoom `zoomNumPlanilha` (`REVISAOCONTRATO`) — confirma que a revisão é **congelada na abertura**. `GET dataset/search?datasetId=dsSync_corrigeRevisaoFatContratos` → **500 NullPointerException** (mesma resposta do controle negativo `dsQA_inexistente_L036_0809`); `ds_fatcon_get_info_medicoes` e `dsProtheus_getContratos_restGetAll` → 200. Fila do Faturamento hoje: 111980/111977/111973 em *Aguarda processamento Fila Protheus* (182) desde 14–17/08, `NOT_COMPLETED`, `admin`. Tracker → *Faturamento de Contratos* tem coluna de revisão nas visões (113384 lida com `Nº Medição=000170`, `Nº Planilha=000001`). `GET /requests/113606` → **404**.
**Divergências encontradas:** a medição **113606 do ticket não existe neste tenant** (404). **A correção (dataset `dsSync_corrigeRevisaoFatContratos`) não está publicada nesta base** — o ticket registra "liberado para produção em 02/09, aplicação efetiva sem confirmação"; aqui, ausente. Ressalva do briefing: nome que é variável de script BPM também dá 500, mas um dataset sincronizado é artefato de dataset, não variável. O Histórico com a observação de ajuste não pôde ser visto (sem instância ajustada). `genericQuery` do Logs Protheus em 404 (ambiente).
**Dados/massa usados:** nenhum — não submetido; leitura de 113606 (404), 113384, 111980/111977/111973.

**Módulo ERP:** Contratos - GCT

---

## CT-FSWTBC-5242  (ambos · Em Execução (Desenvolvimento) · SDCASSI-561)

**Título:** Selecionar a planilha de medição de um contrato corretamente configurado no Protheus e carregar seus itens no Faturamento de Contratos

**Origem:** FSWTBC-5242 — processos de medição (113384, 113559, 114263 em produção) não encontram a planilha de medição "mesmo estando tudo certo no Protheus". **Aberto**, em execução desde 03/09 sem causa identificada. Hipóteses do próprio registro: chave contrato+revisão+planilha montada com dado desatualizado do formulário (mesma família do SDCASSI-560) ou `CNA_CRONOG` inconsistente pela funcionalidade *Alterar Tp. Planilha* (SDCASSI-542). Candidato mecânico adicional (A17-a): `loadPlanilhasDisponiveis` chama `dsProtheus_getInformaPlanxContrato_restGetAll` enquanto `searchPlanilha` chama `dsProtheus_getInfoPlanilhaxContrato_restGetAll`.

**Módulo/Rota:** Fluig: **Faturamento de Contratos** (formulário 256836) → zooms **Fornecedor → Nº Contrato → Competência do Contrato → Cód. Filial Medição → Nº da Planilha \*** (`zoomNumPlanilha`, filtros `PLANILHAS=true, CODIGOCONTRATO, CODIGOFORNECEDORLOJA, COMPETENCIA, FILIALCONTRATO, REVISAOCONTRATO, FILIALPLANILHA`); grade *Itens da Medição*; *Acompanhamento de Contratos* → planilhas do contrato; widget *Logs Protheus* → *Medicoes ZZZ*. Protheus: **Contratos - GCT** — `CNTA300` → *Planilhas* (`CNA`: `CNA_CONTRA`, `CNA_REVISA`, `CNA_NUMERO`, `CNA_CRONOG`, `CNA_TIPPLA`), cronograma (`CNF`), medições (`CND`).

**Pré-condições**
- Contrato vigente (`CN9_SITUAC=05`) com pelo menos uma planilha cadastrada, cronograma gerado (`CNA_CRONOG`) e competência aberta para a filial de medição.
- A revisão da planilha (`CNA_REVISA`) igual à revisão vigente do contrato.
- Integração com o Protheus no ar (o zoom de planilha consulta o ERP em tempo real).
- **Bloqueio:** sem credencial Protheus para conferir/ajustar `CNA_CRONOG` e a revisão da planilha; as medições 113384/113559/114263 do ticket não existem neste tenant com esse conteúdo (113559/114263 → 404; 113384 aqui é outra medição, criada hoje).

**Passos**
1. Abra *Faturamento de Contratos* → nova solicitação.
2. No zoom **Fornecedor**, escolha o fornecedor do contrato de teste; no zoom **Nº Contrato**, o contrato (a revisão é carregada em `numRevisao`).
3. Selecione **Competência do Contrato** e **Cód. Filial Medição**.
4. Abra o zoom **Nº da Planilha \*** e observe a lista.
5. Selecione a planilha; observe a grade **Itens da Medição** e o toast/erro exibido, se houver.
6. Em paralelo, abra *Acompanhamento de Contratos* → linha do contrato → ação de planilhas e confira que a mesma planilha aparece lá.
7. (Diagnóstico) No Protheus, `CNTA300` → contrato → *Planilhas*: confira `CNA_REVISA` = revisão vigente, `CNA_CRONOG` preenchido e a competência aberta no cronograma. Se o contrato passou por *Alterar Tp. Planilha*, registre.
8. (Diagnóstico) Com a rede do navegador aberta, capture o `GET /api/public/ecm/dataset/search?datasetId=…` disparado pelo zoom de planilha e compare o `REVISAOCONTRATO` enviado com `CNA_REVISA` da planilha no ERP.

**Resultado esperado**
- O zoom **Nº da Planilha** lista a(s) planilha(s) do contrato para a competência/filial escolhidas.
- Ao selecionar, a grade *Itens da Medição* é preenchida com os itens a medir; nenhum toast de erro.
- A planilha listada no Fluig é a mesma vista em *Acompanhamento de Contratos* e no `CNTA300`.
- O `REVISAOCONTRATO` enviado pelo zoom é igual à revisão vigente do contrato no ERP.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia — e hoje ainda pode falhar)*
- Zoom de planilha vazio ("Nenhum registro encontrado") ou toast **"Não existem itens a serem medidos para a planilha N. Por favor, informe outra Planilha."**, ou erro **"Verifique o preenchimento dos campos Nº Contrato, Competência do Contrato, Código da Filial e Cód. Filial Medição (Selecionando a Planilha)!"**, com a planilha corretamente configurada no Protheus.
- Medição não pode ser realizada; três processos travados simultaneamente.

**Severidade:** Alta *(impede medição/faturamento de contrato; ticket aberto — o resultado esperado pode reprovar hoje)*

**Preparação de massa:** contrato vigente com planilha e cronograma válidos, informado por quem tem acesso ao `CNTA300`; idealmente um contrato que **tenha passado por *Alterar Tp. Planilha*** e outro que **tenha sido revisado após a abertura** de uma solicitação, para separar as duas hipóteses. A solicitação de Faturamento é criada pelo executor (prefixo `QA`), sem encerrar.

**Verificado em tela:** PARCIAL
**O que foi verificado:** formulário 256836: campo **"Nº da Planilha \*"** (`zoomNumPlanilha`), zoom com os filtros `PLANILHAS`, `CODIGOCONTRATO`, `CODIGOFORNECEDORLOJA`, `COMPETENCIA`, `FILIALCONTRATO`, `REVISAOCONTRATO`, `FILIALPLANILHA` (`ZoomHandler.js`); toast literal *"Não existem itens a serem medidos para a planilha …"* e erro literal *"Verifique o preenchimento dos campos … (Selecionando a Planilha)!"* no `EventHandler.js`/`DataHandler.js`; `getContractSpreadsheetType` chama `dsProtheus_getInformaPlanxContrato_restGetAll` com `SITCONTRATO,05` e `REVCONTRATO` só quando `numRevision` está preenchido. `GET dataset/search`: `dsProtheus_getInfoPlanilhaxContrato_restGetAll` **200 com dados** (`CNA_TIPPLA`, `A2_NOME`, `CNA_XFISCA`…), `dsProtheus_getInformaPlanxContrato_restGetAll` **200 com dados** e `dsProtheus_getPlanilha_restGetAll` **200** (`CNA_CONTRA=00001-2023-1101`, `CNA_REVISA=""`, `CNA_CRONCT=""`). Tracker → *Faturamento de Contratos* 113384 (deste tenant): `Nº Planilha=000001`, contrato `00002-2023-5101`, competência `09-2026`. `GET /requests/113559` e `/114263` → **404**.
**Divergências encontradas:** os três números do ticket não correspondem a esta base (dois inexistentes; 113384 é outra medição, criada 08/09 03:07 por *Usuário Integrador*). **Correção ao A17-a:** hoje os dois nomes de dataset (`getInfoPlanilhaxContrato` e `getInformaPlanxContrato`) **existem e devolvem dados** — a hipótese de "nome errado → 200 vazio" não se sustenta nesta data para o Faturamento. `dsProtheus_getPlanilha_restGetAll` devolve planilhas com `CNA_REVISA` **em branco** (primeira revisão), coerente com a ressalva do SDCASSI-560: se o zoom enviar `REVISAOCONTRATO` preenchido para um contrato cuja planilha está na revisão em branco, a busca não casa — candidato direto à causa. Não foi encadeado o zoom em tela (depende da grade do Protheus, instável hoje).
**Dados/massa usados:** nenhum — não submetido.

**Módulo ERP:** Contratos - GCT

---
