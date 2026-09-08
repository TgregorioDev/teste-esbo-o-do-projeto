<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# Gerencia de Compras

Casos de teste E2E do Fluig — módulo Gerencia de Compras.

| | |
|---|---|
| Casos neste arquivo | 9 |
| Verificados em tela | 2 total · 7 parcial · 0 não |

> **Como ler.** Cada caso descreve o comportamento **correto esperado hoje**. A maioria dos
> defeitos de origem já foi corrigida — o caso é de regressão: se reprovar, o defeito voltou.
> Os que reprovam hoje por causa nunca corrigida estão marcados no próprio caso.
> *Verificado em tela* diz o que foi conferido no ambiente de homologação em 08/09/2026;
> **PARCIAL** costuma significar que a conta de QA não tem o perfil necessário (comprador,
> gestor, fiscal, fornecedor), não que o caso seja inválido.

---

## CT-FSWTBC-1684  (fluig · Concluído)

**Título:** O gerente transfere uma solicitação de compra para outro comprador pelo portal e tanto o formulário quanto o responsável da tarefa são atualizados.

**Origem:** FSWTBC-1684 — "[CASSI -BH] Portal Compras Fluig - Melhorias Prioritárias V2] -
Desenvolvimentos dos datasets para atualizar o formulário e transferir solicitação (ambos
utilizando usuário oAuth)". Defeito registrado no épico de melhorias prioritárias, três meses após
o fechamento do épico. O ticket não descreve o sintoma, apenas o que foi desenvolvido: **dois
datasets server-side**, um que **atualiza o formulário** e outro que **transfere a solicitação**,
ambos executando sob **usuário oAuth** (para não depender da permissão do usuário logado).

**Módulo/Rota:** **Gerência de Compras** (`/portal/p/1/gerenciaCompras`) → aba **Transferir** →
ação **Transferir** na linha da SC → modal de confirmação. Contraparte: aba **Atribuir**
(ver CT-FSWTBC-1688).

**Pré-condições**
- Usuário membro do grupo `G.P.Requisicao_de_Compras_Validacao_Compradores` (é o que a página usa
  para decidir se o usuário é gerente).
- Uma SC listada na aba **Transferir**, ou seja, na etapa **119 Validação do Comprador**, já com um
  comprador responsável — a transferência pressupõe responsável atual (`userFrom`).
- Um segundo comprador válido (cadastro **SY1** do Protheus) para receber (`userTo`).
- **Bloqueio:** **parcial.** Executar a transferência é **escrita em SC real de terceiro**
  (troca o responsável da tarefa), vedada nesta rodada. Some-se que a aba **Atribuir** **não
  renderiza dados** para esta conta (achado já versionado do ambiente) e a conta de QA não resolve
  matrícula de comprador. Verificados a página, o contrato dos datasets e as mensagens, sem executar.

**Passos**
1. Abrir `/portal/p/1/gerenciaCompras` e clicar explicitamente na aba **Transferir**.
2. Localizar na grade a SC a transferir — colunas **Processo**, **Filial**, **Solicitante**,
   **Num SC**, **Grupos de Produto**.
3. Selecionar o comprador de destino no campo de comprador da linha.
4. Acionar a ação **Transferir** da linha e confirmar no modal.
5. Reabrir a aba **Transferir** e conferir que a SC saiu da lista (ou mudou de responsável).
6. Abrir a SC e conferir o comprador gravado no formulário; conferir na **Central de Tarefas** que
   a tarefa está com o novo responsável.

**Resultado esperado**
- A confirmação executa **dois passos, nesta ordem**: primeiro **atualiza o formulário**
  (`ds_putForm`, gravando `matriculaValidBuyer` com o comprador de destino) e **só então** faz a
  **transferência da tarefa** (`transferToBuyer`, com `processId`, `assignee` = responsável atual e
  `targetAssignee` = comprador de destino).
- Passo 1 bem-sucedido devolve *"Tarefa atribuída com sucesso"*; o fluxo completo notifica
  **"Processo transferido com sucesso!"**.
- Se o **primeiro** passo falhar, a transferência **não é executada** e o usuário vê a mensagem do
  erro — não fica o estado inconsistente de "formulário atualizado sem tarefa transferida" nem o
  contrário.
- Ambos os datasets rodam sob o **usuário oAuth** do lado servidor: a operação funciona mesmo que o
  usuário logado não seja o responsável atual da tarefa.
- Após a transferência, o **formulário da SC** mostra o novo comprador e a **tarefa** aparece para
  ele na Central de Tarefas — os dois lados atualizados.

**Resultado se o defeito reincidir**
- A transferência não atualiza um dos dois lados: ou o formulário fica com o comprador antigo, ou a
  tarefa não muda de responsável. Mensagem exata `<não documentado>` — o ticket não descreve o
  sintoma, só o desenvolvimento.
- Mensagens de falha a observar (texto exato do widget publicado):
  *"Problema para realizar a tranferência! …"*, *"Erro ao transferir tarefa. Verifique os logs."*,
  *"Erro ao transferir o  processo"*, *"Problema para realizar a movimentação!"*.

**Severidade:** Alta *(a solicitação pode ficar com responsável e formulário divergentes — SC órfã na fila de um comprador que não a enxerga)*

**Preparação de massa:** uma SC em **Validação do Comprador (etapa 119)** com comprador responsável
já atribuído, e um segundo comprador válido no SY1 para receber; o executor precisa pertencer ao
grupo `G.P.Requisicao_de_Compras_Validacao_Compradores`. Quem prepara: gerência de compras da CASSI.
Idealmente, uma SC criada pelo próprio executor, para que a transferência não afete processo alheio.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a página **Gerência de Compras** abre (título *Cassi - Fluig Plataforma -
Gerencia Compras*, heading **Gerência de Compras**, abas **Atribuir** e **Transferir**). Na carga
ela chama `ds_getSolicsGerenciaCompras` duas vezes, com
`filterFields=etapa,257,matriculaGerente,TOTVS-FS,workflowVersion,77` e
`filterFields=etapa,119,matriculaGerente,TOTVS-FS,workflowVersion,77` — 257 = *Gerência de Compras*,
119 = *Validação do Comprador*, conferindo com o mapa de atividades da SC. O bundle publicado do
widget (`/wg_gerenciaComprasV1/resources/js/angular/browser/main.js`) foi lido e confirma os **dois
datasets do ticket**: **`ds_putForm`** (POST `/api/public/ecm/dataset/datasets/`, `fields` com
`{fieldId:"matriculaValidBuyer", value:<comprador>}`, `constraints` `documentId` e `cardId`) e
**`dsFluig_postProcessesMove`** (POST, `constraints` `assignee`, `targetState:"119"`,
`targetAssignee`, `comment:"Movimentado via Portal de Gerência de compras."`, `asManager:false`,
`processId`). A sequência de dois passos foi lida no código: `voucherTransfer()` chama
`sendTaskToBuyer()` (o `ds_putForm`) e **só se ele retornar `status:true`** chama `transferToBuyer()`.
Colunas da grade confirmadas: **Processo**, **Filial**, **Comprador**, **Solicitante**, **Num SC**,
**Grupos de Produto**, **Responsável**. Nada foi transferido.
**Divergências encontradas:** (1) **erros de português nas mensagens ao usuário** do widget
publicado: *"Problema para realizar a **tranferência**!"* (falta o "s") e *"Erro ao transferir o
&nbsp;&nbsp;processo"* (espaço duplo) — apresentação, mas visível ao usuário. (2) O ticket fala em
"usuário oAuth", mas isso é **server-side**: o widget só chama os datasets, sem qualquer credencial
no bundle — logo, a única verificação possível pelo cliente é indireta (a operação funcionar para
quem não é o responsável da tarefa). (3) A aba **Atribuir** continua **não renderizando dados** para
esta conta, enquanto a **Transferir**, pelo mesmo mecanismo, carrega — achado já versionado deste
ambiente.
**Dados/massa usados:** nenhum — não submetido, nenhuma transferência executada.

---

## CT-FSWTBC-1688  (fluig · Concluído)

**Título:** Ao atribuir uma SC a um comprador pelo portal, o sistema assume a tarefa antes de movimentá-la, e o responsável fica fixado.

**Origem:** FSWTBC-1688 — "[CASSI -BH] Portal Compras Fluig - Melhorias Prioritárias V2] -
Desenvolvimento do dataset para o usuário assumir a tarefa antes de movimentar + Implementação no
Portal". O ticket traz o **contrato completo do dataset** `ds_postAssumeProcessTask`: constraints
`colleagueId` (matrícula do usuário logado), `processInstanceId` (número da solicitação) e
`replacementId`; retorno com `status` booleano e `message`. É a solução de causa para FSWTBC-1304
(atribuição que voltava para o grupo): sem assumir a tarefa antes, a movimentação não fixava o
responsável.

**Módulo/Rota:** **Gerência de Compras** (`/portal/p/1/gerenciaCompras`) → aba **Atribuir** →
ação **Atribuir** na linha da SC → modal de confirmação. Efeito observável na **Central de
Tarefas** (`/portal/p/1/pagecentraltask`).

**Pré-condições**
- Usuário membro do grupo `G.P.Requisicao_de_Compras_Validacao_Compradores`.
- Uma SC listada na aba **Atribuir**, isto é, na etapa **257 Gerência de Compras** — **sem**
  comprador ainda designado.
- Um comprador válido (cadastro **SY1** do Protheus) para receber a SC.
- **Bloqueio:** **parcial.** Atribuir é **escrita em SC real** (assume a tarefa e a movimenta para a
  etapa 119). Além disso, para esta conta a aba **Atribuir** **não lista nenhuma SC** — sem linha,
  não há ação a acionar. Verificados página, contrato do dataset e sequência de chamadas, sem executar.

**Passos**
1. Abrir `/portal/p/1/gerenciaCompras` e clicar explicitamente na aba **Atribuir**.
2. Localizar a SC na grade (**Processo**, **Filial**, **Comprador**, **Solicitante**, **Num SC**,
   **Grupos de Produto**).
3. Selecionar o comprador no campo **Comprador** da linha.
4. Acionar **Atribuir** e confirmar no modal (que exibe o nome do comprador escolhido).
5. Abrir a **Central de Tarefas** → aba **Tarefas a concluir** e ler o **Responsável** da SC.
6. Reabrir a aba **Atribuir** e confirmar que a SC saiu da fila.

**Resultado esperado**
- A confirmação executa **dois passos, nesta ordem**: primeiro **assume a tarefa**
  (`ds_postAssumeProcessTask`, via
  `GET /api/public/ecm/dataset/search?datasetId=ds_postAssumeProcessTask&filterFields=colleagueId,<logado>,processInstanceId,<nº da SC>,replacementId,<logado>`)
  e **só se ele retornar `status: true`** faz a movimentação (`dsFluig_postProcessesMove`, com
  `targetState: "119"` e `targetAssignee` = comprador).
- Sucesso do passo 1 devolve *"Tarefa assumida com sucesso!"*; o fluxo completo notifica
  **"Processo atribuído com sucesso!"**.
- Se o passo de assumir **falhar**, a movimentação **não acontece** e o usuário vê
  *"Problema para assumir tarefa! &lt;mensagem&gt;"* — nunca uma movimentação silenciosa sem dono.
- Depois da atribuição, a **Central de Tarefas** mostra o **comprador escolhido** como
  **Responsável** — a tarefa **não volta para o grupo/pool** (é exatamente a regressão de
  FSWTBC-1304).
- A SC sai da aba **Atribuir** (etapa 257) e passa a constar na **Transferir** (etapa 119).
- Sem comprador selecionado, o portal recusa antes de qualquer chamada, com
  *"Nenhum comprador selecionado"*.

**Resultado se o defeito reincidir**
- A atribuição movimenta sem assumir e a tarefa **volta para o grupo**: nenhum responsável nominal
  na Central de Tarefas (sintoma de FSWTBC-1304). Mensagens de falha a observar (texto exato do
  widget): *"Problema para assumir tarefa! …"*, *"Erro ao assumir tarefa ao comprador"*,
  *"Erro ao atribuir tarefa. Verifique os logs."*, *"Erro ao atribuir processo"*.

**Severidade:** Alta *(SC sem responsável nominal fica invisível na fila de todos e para o ciclo de compra; é o defeito que 1304 já tinha custado uma vez)*

**Preparação de massa:** uma SC na etapa **257 Gerência de Compras**, sem comprador atribuído,
idealmente criada pelo próprio executor; executor no grupo
`G.P.Requisicao_de_Compras_Validacao_Compradores`; e um comprador válido do SY1. Quem prepara:
gerência de compras da CASSI. **Adicionalmente**, é preciso resolver a limitação de conta que hoje
esvazia a aba Atribuir (ver divergências) — sem isso o caso não roda nem com massa.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a aba **Atribuir** existe na página (com **Transferir**). O bundle
publicado do widget (`/wg_gerenciaComprasV1/resources/js/angular/browser/main.js`) confirma o
contrato do ticket **campo a campo**: o dataset é chamado com exatamente
`{colleagueId, processInstanceId, replacementId}` — `colleagueId` e `replacementId` recebem o
código do usuário logado (`getLoggedUser().code`) e `processInstanceId` o número da solicitação —
via `GET /api/public/ecm/dataset/search?datasetId=ds_postAssumeProcessTask&filterFields=…`;
o retorno é lido em `content[0].status` (booleano) e `content[0].message`, produzindo
*"Tarefa assumida com sucesso!"* ou *"Problema para assumir tarefa! " + message*. A **ordem**
exigida pelo ticket está no código: `voucherBuyer()` chama `assumeTask()` e **só se `status` for
verdadeiro** chama `moveProcess()` (`dsFluig_postProcessesMove`, `targetState:"119"`), notificando
*"Processo atribuído com sucesso!"*; caso contrário exibe o erro do assume. Também confirmado o
guarda de entrada `"Nenhum comprador selecionado"` e a permissão pelo grupo
`G.P.Requisicao_de_Compras_Validacao_Compradores` (via `colleagueGroup`). O dataset **não foi
executado** — chamá-lo assumiria uma tarefa real.
**Divergências encontradas:** a aba **Atribuir** **não lista nenhuma SC** para esta conta, embora a
carga dispare `ds_getSolicsGerenciaCompras` com `etapa=257`; a aba **Transferir**, pelo mesmo
mecanismo (`etapa=119`), carrega. Achado já versionado deste ambiente — impede executar o caso mesmo
com massa. Não há como observar pelo cliente que o dataset roda sob usuário oAuth: isso é
server-side.
**Dados/massa usados:** nenhum — não submetido, nenhuma tarefa assumida.

---

## CT-FSWTBC-2043  (fluig · Concluído · SDCASSI-4)

**Título:** Gerente transfere para outro comprador uma SC que já havia sido assumida.

**Origem:** FSWTBC-2043 — `SD765331`: a SC 28656 não transferia para outro comprador depois de assumida;
a API de transferência retornava **HTTP 500**. Um segundo caso (SC 28174) apareceu em 2 dias. A correção
foi de **configuração do serviço**, não de código.

**Módulo/Rota:** *Gerência de Compras* (`/portal/p/1/gerenciaCompras`) → aba **Transferir** → coluna
**Comprador** (*Selecione um comprador*) → botão **Transferir** da linha (ou **Transferir em Lote**).

**Pré-condições**
- SC na etapa de distribuição/Gerência de Compras, **já assumida** por um comprador (é a condição do
  defeito: transferir depois de assumida).
- Executor com perfil de **gerente de compras** — a lista é carregada por
  `ds_getSolicsGerenciaCompras` filtrando `matriculaGerente` pelo login.
- Um segundo comprador válido como destino.
- **Bloqueio:** **sim** — a transferência escreve em **SC de outra pessoa**. A regra desta rodada proíbe
  alterar registro pré-existente, e a tela transfere **no clique**, sem etapa de confirmação. O botão
  não foi acionado.

**Passos**
1. Abrir **Gerência de Compras** e clicar na aba **Transferir** (não confie na aba herdada da sessão).
2. Localizar a SC pelo **Num SC** (filtros disponíveis: *Filial*, *Valor Estimado*, *Grupo de Produto*;
   botão **Filtrar**).
3. Conferir em **+ Detalhes** que a SC está atribuída a um comprador.
4. Na coluna **Comprador**, escolher o comprador de destino no seletor *Selecione um comprador*.
5. Clicar em **Transferir** na linha.
6. Recarregar a tela e conferir a atribuição; conferir também a tarefa na **Central de Tarefas** do
   comprador de destino.

**Resultado esperado**
- A transferência conclui **sem erro HTTP 500**; a chamada de movimentação responde 2xx.
- A SC passa a constar para o comprador de destino e some da fila do comprador anterior.
- Uma SC **já assumida** é transferível — assumir não é estado terminal.
- **Transferir em Lote** produz o mesmo efeito para a seleção múltipla.
- Nenhuma SC fica sem responsável após a operação.

**Resultado se o defeito reincidir**
- Ao transferir uma SC já assumida, a API de transferência retorna **erro 500** e a SC permanece com o
  comprador original (relato: SCs 28656 e 28174).

**Severidade:** Média *(bloqueia o fluxo de distribuição da SC)*

**Preparação de massa:** uma SC na etapa de Gerência de Compras **assumida** por um comprador de teste,
mais um segundo comprador para receber. Como a operação altera atribuição real, deve ser executada por
quem administra o processo, preferencialmente sobre uma SC criada para o teste.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a aba **Transferir** carrega hoje (demora ~25 s) e lista **65 SCs**, com as colunas
**Processo**, **Filial**, **Comprador**, **Solicitante**, **Num SC**, **Grupos de Produto** e, por linha, os
controles **+ Detalhes** e **Transferir**; há ainda **Transferir em Lote** e os filtros **Filial**,
**Valor Estimado**, **Grupo de Produto** com o botão **Filtrar**. Exemplos observados: processo `99055`
(UNIDADE - CLINICASSI CUIABA - MT, Num SC `000071`), `101546` (CASSI SEDE, `000910`), `105230`
(FLORIANOPOLIS - SC, `000147`). A lista vem de
`ds_getSolicsGerenciaCompras&filterFields=etapa,257|119,matriculaGerente,TOTVS-FS,workflowVersion,77`.
**A transferência não foi executada** — escreveria em SC de terceiros.
**Divergências encontradas:** (a) todas as 65 linhas exibem **Comprador = "Selecione um comprador"**, ou
seja, nenhuma SC visível para esta conta está *assumida* — a pré-condição do defeito não é observável aqui;
(b) a aba **Atribuir**, ao lado, não renderiza nenhuma linha, pelo mesmo mecanismo de dataset;
(c) os controles **+ Detalhes** e o seletor de comprador são componentes PO-UI com **id GUID gerado a cada
carga** (`po-lookup[34c3a301-…]`), sem rótulo acessível estável — não foi possível acioná-los por texto,
o que é um problema de testabilidade a reportar.
**Dados/massa usados:** nenhum — nada transferido.

---

## CT-FSWTBC-2790  (fluig · Concluído · SDCASSI-76)

**Título:** Comprador assume (atribui a si) uma SC pela aba Atribuir do Portal de Gerência de Compras.

**Origem:** FSWTBC-2790 — “Portal de gerência de compras não está assumindo tarefa”. Defeito interno
da DEM10013706, detectado pelo próprio desenvolvedor: no Portal do Comprador / Gerência de Compras,
a ação de **assumir** a tarefa (tomar posse da SC no BPM) não funcionava. Fechado no mesmo dia, sem
comentário técnico nem causa raiz.

**Módulo/Rota:** **Gerência de Compras** (`/portal/p/1/gerenciaCompras`) — heading *Gerência de
Compras*, abas **Atribuir** e **Transferir**.

**Pré-condições**
- SC(s) em etapa de fila do comprador, ainda **sem comprador definido**.
- Conta com **matrícula de comprador resolvida no Protheus** e vínculo com o(s) **Grupo(s) de
  Produto** das SCs — é o que a aba *Atribuir* usa para filtrar.
- **Bloqueio:** sim — a conta de QA **não resolve matrícula de comprador**
  (`Comprador não encontrado.` no Portal do Comprador). E concluir a atribuição alteraria a
  responsabilidade de SCs de terceiros, o que é vedado.

**Passos**
1. Abrir `/portal/p/1/gerenciaCompras`.
2. Clicar explicitamente na aba **Atribuir** (não confiar no estado herdado da sessão).
3. Usar os filtros **Filial**, **Valor Estimado** e **Grupo de Produto** e clicar em **Filtrar**.
4. Conferir a grade: colunas **Processo**, **Filial**, **Comprador**, **Solicitante**, **Num SC**,
   **Grupos de Produto**.
5. Selecionar uma SC e acionar a atribuição (**Atribuir em lote** para várias).
6. Reabrir a aba e conferir a SC atribuída; conferir também na **Central de Tarefas** do comprador.

**Resultado esperado**
- A aba **Atribuir** **lista SCs** para uma conta de comprador válida — não fica em “Nenhum dado
  encontrado” quando existem SCs elegíveis.
- Selecionar a SC e confirmar **efetiva a posse**: a coluna **Comprador** passa a exibir o
  responsável e a SC sai da fila de não atribuídas.
- A tarefa passa a aparecer na **Central de Tarefas** do comprador.
- **Atribuir em lote** aplica a todas as SCs selecionadas, sem sucesso parcial silencioso.
- O comportamento é simétrico ao da aba **Transferir**, que usa o mesmo mecanismo.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A ação de assumir a tarefa não tem efeito: a SC continua sem comprador e não entra na Central de
  Tarefas. Mensagem exata `<não documentado>` — o ticket foi fechado sem anexo e sem comentário.

**Severidade:** Média *(bloqueia o comprador de trabalhar a SC; sem risco financeiro direto)*

**Preparação de massa:** SCs em fila de atribuição no(s) grupo(s) de produto do comprador, **e** uma
credencial de comprador com matrícula válida no Protheus. Como a atribuição altera SC de terceiro,
o ideal é massa criada pelo próprio executor.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a tela foi aberta e **as duas abas foram clicadas**, com espera de ~8 s
cada. Aba **Transferir**: carrega **65 linhas**, colunas *Processo | Filial | Comprador |
Solicitante | Num SC | Grupos de Produto*, com botões **Filtrar**, **Transferir em Lote**,
**+ Detalhes** e **Transferir** (amostra: processo 99055 / *UNIDADE - CLINICASSI CUIABA* / SC 000071;
101546 / *CASSI SEDE* / SC 000910). Aba **Atribuir**: mesma estrutura de colunas e filtros
(*Filial*, *Valor Estimado*, *Grupo de Produto*), botão **Atribuir em lote**, e a grade em
**“Nenhum dado encontrado”**.
**Divergências encontradas:** **duas.** (1) O ticket fala em “**assumir** tarefa”; a tela de hoje
não usa esse verbo — a ação chama-se **Atribuir** / **Atribuir em lote**. (2) **A aba Atribuir
segue sem listar nada** para a conta autenticada, enquanto a aba Transferir, ao lado e pelo mesmo
mecanismo, lista 65 registros — exatamente o achado `@achado` versionado na suíte E2E deste
repositório, reconfirmado hoje. Nenhum dataset é disparado no clique da aba (as chamadas ocorrem só
na carga da página), o que reforça que a aba não refaz a consulta. **Não é possível, com esta conta,
separar “limitação de perfil de comprador” de “o defeito de 2790 continua” — a dúvida sobre a
efetividade da correção, registrada no próprio ticket, permanece de pé.**
**Dados/massa usados:** nenhum — nenhuma SC foi atribuída nem transferida.

---

## CT-FSWTBC-3707  (fluig · Concluído · SDCASSI-206)

**Título:** Atribuir um comprador a uma Solicitação de Compras parada na Gerência de Compras e ver o processo sair da fila de atribuição.

**Origem:** FSWTBC-3707 — não era possível atribuir comprador às SCs 9100, 9102, 9103 e 9104. O diagnóstico registrado foi *"foi identificada uma ação indevida no fluxo do processo impossibilitando a movimentação do processo via portal"*: alguma movimentação anterior deixou os processos num estado do qual o portal não consegue atuar.

**Módulo/Rota:** Menu lateral › **Gerencia Compras** (`/portal/p/1/gerenciaCompras`) › aba **Atribuir**.

**Pré-condições**
- Pelo menos uma SC parada na atividade **257 - Gerência de Compras** (é essa a etapa que alimenta a aba *Atribuir*; a aba *Transferir* é alimentada pela atividade **119 - Validação do Comprador**).
- Usuário com perfil de gerência de compras, que é quem enxerga a grade.
- Um comprador válido cadastrado no ERP para escolher no combo.
- **Bloqueio:** sim, duplo. (1) Em 04/09/2026 a aba **Atribuir** trouxe **"Nenhum dado encontrado"** — não há massa nessa etapa e a automação não pode fabricá-la sem percorrer um fluxo de aprovação completo. (2) Concluir a atribuição é escrita em processo de terceiros; não foi executada.

**Passos**
1. Abrir **Gerencia Compras** no menu lateral e confirmar o título **Gerência de Compras** com as abas **Atribuir** e **Transferir**.
2. Permanecer na aba **Atribuir**. Conferir os filtros **Filial**, **Valor Estimado** e **Grupo de Produto** e o botão **Filtrar**.
3. Localizar a SC pela coluna **Num SC** (ou **Processo**, que traz o número do Fluig).
4. Na coluna **Comprador** da linha, abrir o combo **Selecione um comprador** e escolher o comprador desejado.
5. Acionar **Atribuir** na própria linha (ou selecionar várias linhas e usar **Atribuir em lote**).
6. Confirmar no diálogo *"Tem certeza que deseja atribuir o processo?"*.
7. Voltar à aba **Atribuir** e depois abrir o **Histórico** da solicitação no Fluig.

**Resultado esperado**
- A aba **Atribuir** lista a SC com as colunas **Processo · Filial · Comprador · Solicitante · Num SC · Grupos de Produto**.
- Após confirmar, aparece a mensagem **"Processo atribuído com sucesso!"**.
- A SC **sai** da grade da aba *Atribuir* e passa a constar com o comprador escolhido.
- O **Histórico da solicitação** registra a movimentação para a etapa do comprador com o novo responsável.
- Se a atribuição não puder ser feita, o portal exibe **mensagem de erro específica** (a falha vem de `assumeTask`/`moveProcess` e é propagada) — nunca sucesso silencioso nem tela travada.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A SC aparece na grade mas a atribuição não se completa: o processo continua na fila da aba *Atribuir* com o mesmo comprador em branco, e/ou o portal responde **"Erro ao atribuir processo"** sem detalhamento. No caso original, quatro SCs (9100, 9102, 9103, 9104) ficaram paradas.

**Severidade:** Alta *(a atribuição de comprador é o primeiro passo do fluxo centralizado; sem ela a SC não anda e o prazo de compra é consumido em silêncio)*

**Preparação de massa:** uma SC (de preferência criada pelo próprio executor, com prefixo `QA`) levada até a atividade **257 - Gerência de Compras**, o que exige as aprovações de Gestor e Orçamentária. Além disso, um usuário com perfil de gerência de compras e um comprador com matrícula válida no Protheus. Nada disso é fabricável com a conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a rota `/portal/p/1/gerenciaCompras` abre com título **Gerência de Compras** e as abas **Atribuir**/**Transferir**. Em 04/09/2026, a aba **Transferir** trouxe **65 linhas** com as colunas *Processo, Filial, Comprador, Solicitante, Num SC, Grupos de Produto*, o combo **"Selecione um comprador"** por linha e os botões **+ Detalhes**, **Transferir** e **Transferir em Lote** (ex.: processos 112848/SC 001191, 112902/SC 000075, 113028/SC 000092). A aba **Atribuir**, com **os mesmos filtros e as mesmas colunas**, trouxe **"Nenhum dado encontrado"** e oferece apenas **Atribuir em lote** — sem botão *Atribuir* por linha, porque não há linha. A atribuição em si não foi executada.
**Divergências encontradas:** (a) confirma-se em tela o achado já versionado na suíte E2E — **a aba *Atribuir* não lista nada enquanto a aba *Transferir*, pelo mesmo mecanismo e mesmas colunas, lista 65 registros**. Com 0 linhas não é possível distinguir "não há SC na atividade 257" de "a consulta está errada": as duas hipóteses produzem a mesma tela, e essa é justamente a ambiguidade que deixou o defeito original invisível. (b) O widget da Gerência de Compras carrega um mapa de ambiente **fixo no código**: para este host (`caixade182374`) ele usa `workflowVersion: "77"` e `documentId: "251962"`, enviados como filtro ao dataset `ds_getSolicsGerenciaCompras`, enquanto o formulário da SC servido hoje é o documento **256831**. Vale conferir com o time se a versão de workflow filtrada ainda corresponde à publicada. (c) A pendência do ticket continua aberta: não há registro de qual foi a "ação indevida no fluxo" nem de proteção contra repetição.
**Dados/massa usados:** nenhum — nada submetido; apenas leitura das duas abas.

---

## CT-FSWTBC-3840  (fluig · Concluído · SDCASSI-76)

**Título:** Atribuir um comprador a uma solicitação pela aba Atribuir da Gerência de Compras e confirmar que a atribuição é gravada.

**Origem:** FSWTBC-3840 — *"Não está atribuindo comprador"*. Terceira ocorrência do mesmo problema (após FSWTBC-3707 e FSWTBC-2790), fechada no mesmo dia, sem causa raiz, sem descrição de correção e com evidência que chegou por WhatsApp. Ticket sem descrição além do título (§5-D do briefing).

**Módulo/Rota:** **Gerência de Compras** (`/portal/p/1/gerenciaCompras`) › aba **Atribuir**.

**Pré-condições**
- Solicitações de Compras paradas na atividade `257 - Gerência de Compras`, aguardando distribuição de comprador.
- Perfil com acesso à Gerência de Compras (a conta de QA tem).
- Compradores cadastrados e ativos no ERP para popular o campo de seleção.
- **Bloqueio:** **sim, e ele é o próprio achado** — a aba **Atribuir** não lista nenhum registro hoje (ver *O que foi verificado*).

**Passos**
1. Abrir **Gerência de Compras**.
2. Clicar explicitamente na aba **Atribuir**.
3. Conferir que a grade traz as colunas **Processo**, **Filial**, **Comprador**, **Solicitante**, **Num SC** e **Grupos de Produto**, e que há linhas listadas.
4. Aplicar os filtros disponíveis — **Filial**, **Valor Estimado**, **Grupo de Produto** — e acionar **Filtrar**.
5. Em uma linha, abrir o campo **Comprador** (lookup *"Selecione um comprador"*) e escolher um comprador.
6. Acionar a ação de atribuição da linha.
7. Recarregar a tela e confirmar que a linha saiu da aba **Atribuir** (ou passou a exibir o comprador atribuído).
8. Abrir a solicitação correspondente e confirmar, na aba **Histórico**, que a atividade `257 - Gerência de Compras` foi concluída e o processo seguiu para `119 - Validação do Comprador`.
9. Repetir com **Atribuir em lote**, selecionando duas ou mais linhas.

**Resultado esperado**
- A aba **Atribuir** **lista as solicitações pendentes de distribuição** — não pode vir vazia quando existem SCs em `257 - Gerência de Compras`.
- O lookup **Comprador** carrega a lista de compradores.
- Após atribuir, a solicitação passa a ter o comprador gravado e sai da fila de atribuição.
- O Histórico registra a conclusão de `257 - Gerência de Compras` com o comprador designado.
- **Atribuir em lote** aplica a atribuição a todas as linhas selecionadas.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A atribuição não tem efeito: a solicitação continua sem comprador e permanece na fila, mesmo após a ação ter sido acionada (foi o relato de FSWTBC-3707, com quatro SCs afetadas).

**Severidade:** Alta *(sem comprador atribuído a SC não avança para a validação do comprador — o fluxo de compras para na fila de distribuição; e é a terceira reincidência registrada, sem diagnóstico consolidado)*

**Preparação de massa:** ao menos duas SCs na atividade `257 - Gerência de Compras` aguardando distribuição, e um comprador ativo no ERP para ser selecionado. Como a aba está vazia hoje, o time precisa primeiro esclarecer **por que** ela não lista (ver divergência abaixo) antes de preparar massa.

**Verificado em tela:** SIM (total, quanto ao sintoma; a gravação da atribuição não foi executada, por ser ação de escrita em processo de terceiros)
**O que foi verificado:** abri `/portal/p/1/gerenciaCompras` (título *Cassi - Fluig Plataforma - Gerencia Compras*, heading **Gerência de Compras**) e cliquei nas duas abas.
> **Aba Atribuir:** filtros **Filial** (*Selecione a Filial*), **Valor Estimado** e **Grupo de Produto** (*Selecione o Grupo de Produto*), botões **Filtrar** e **Atribuir em lote**, cabeçalho **Processo | Filial | Comprador | Solicitante | Num SC | Grupos de Produto** — e o corpo da grade com **"Nenhum dado encontrado"**.
> **Aba Transferir:** mesmos filtros, botão **Transferir em Lote**, o **mesmo** cabeçalho de colunas, e **65 linhas carregadas**, com dados reais (ex.: processo `99055` · *UNIDADE - CLINICASSI CUIABA - MT* · SC `000071` · solicitante *Eduarda Lima Barros*; processo `101546` · *CASSI SEDE* · SC `000910`). Cada linha traz um lookup **"Selecione um comprador"**, um botão **+ Detalhes** e um botão **Transferir**.
Nenhuma atribuição ou transferência foi executada.
**Divergências encontradas:** **a divergência central deste caso.** As duas abas compartilham a mesma estrutura, os mesmos filtros e o mesmo cabeçalho, e são servidas pelo mesmo widget — mas **Transferir traz 65 registros e Atribuir traz zero**. Isso confirma, com a tela de hoje, o achado já versionado na suíte E2E (`@achado`) de que a aba *Atribuir* nunca renderiza dados. Duas leituras possíveis, e o time precisa decidir qual é: **(a)** não existe nenhuma SC pendente de atribuição neste momento — e então a aba está correta e o teste precisa de massa; ou **(b)** a consulta da aba *Atribuir* está quebrada — e então a terceira reincidência do "não está atribuindo comprador" continua aberta, apenas mudou de sintoma (antes atribuía sem gravar, agora não lista o que atribuir). **Não é possível distinguir (a) de (b) pela tela**, e é exatamente o tipo de ambiguidade que fez este defeito reincidir três vezes sem causa raiz. Recomendo instrumentar: comparar a contagem de SCs em `257 - Gerência de Compras` com o que a aba lista.
**Dados/massa usados:** nenhum — nenhuma atribuição ou transferência executada; somente leitura das duas abas.

---

## CT-FSWTBC-4230  (fluig · Concluído · SDCASSI-321)

**Título:** Atribuir um comprador a uma SC na Gerência de Compras sem que a tarefa tenha sido assumida — e confirmar que assumir a tarefa impede a atribuição, com aviso.

**Origem:** FSWTBC-4230 — erro ao atribuir comprador na **Gerência de Compras**, SC **10310**: o sistema não permitia a atribuição, impedindo o fluxo. **Não era defeito, e sim uso incorreto com raiz em desenho pouco evidente:** na etapa de Gerência de Compras o processo **não deve ser assumido** por nenhum colaborador — ele precisa permanecer **no grupo** para que o portal faça a atribuição automática. Quando alguém "pega" a tarefa, o mecanismo não encontra mais o processo no grupo e a atribuição falha. **Nada na interface impede ou avisa isso** — a regra existe só no conhecimento de quem construiu.

**Módulo/Rota:** **Gerência de Compras** (`/portal/p/1/gerenciaCompras`), abas **Atribuir** e **Transferir**. No BPM corresponde à atividade **`257 - Gerência de Compras`**.

**Pré-condições**
- Perfil com acesso à **Gerência de Compras**.
- **Duas** SCs em `257 - Gerência de Compras`: a **SC-A** deixada **no grupo** (não assumida por ninguém) e a **SC-B** deliberadamente **assumida** por um colaborador.
- **Bloqueio:** sim. (a) A aba **Atribuir** não lista SC alguma para a conta de QA (medido: **0 linhas**, contra **65** na aba *Transferir*) — sem massa na aba, o caminho feliz não é executável por esta conta. (b) Atribuir ou transferir uma SC real da aba *Transferir* alteraria registro pré-existente que não é meu — **proibido pelo briefing (§2)** e não executado.

**Passos**
1. Abrir **Gerência de Compras** (`/portal/p/1/gerenciaCompras`).
2. Clicar **explicitamente** na aba **Atribuir** — a Central de Tarefas do Fluig guarda a sub-aba por sessão no servidor; não confie no estado herdado.
3. Conferir que a **SC-A** (não assumida) aparece na lista, com as colunas **Processo · Filial · Comprador · Solicitante · Num SC · Grupos de Produto**.
4. Usar os filtros **Selecione a Filial**, **Valor Estimado** e **Selecione o Grupo de Produto** e clicar em **Filtrar**.
5. Atribuir o comprador à **SC-A** (individualmente ou por **Atribuir em lote**).
6. Confirmar o resultado e reabrir a aba **Atribuir**.
7. Repetir os passos 2 a 5 para a **SC-B**, que foi **assumida** por um colaborador.
8. Abrir a aba **Transferir** e conferir que ela lista SCs pelas mesmas colunas, com o campo **Selecione o comprador** e os botões **+ Detalhes**, **Transferir** e **Transferir em Lote**.

**Resultado esperado**
- Passo 3: a **SC-A**, não assumida, **aparece** na aba *Atribuir*.
- Passo 5/6: a atribuição **conclui com sucesso**, o comprador passa a constar na coluna **Comprador**, e a SC sai da lista de pendentes de atribuição.
- Passo 7: a **SC-B**, já assumida, **ou não aparece na aba *Atribuir*, ou aparece com uma mensagem explícita** dizendo que a tarefa foi assumida e precisa ser devolvida ao grupo para permitir a atribuição automática. **O que não pode acontecer é falha silenciosa** — botão que não faz nada, ou erro genérico sem causa.
- Passo 8: a aba *Transferir* lista as SCs normalmente — as duas abas usam o mesmo mecanismo e a divergência entre elas é sinal, não normalidade.

**Resultado se o defeito reincidir** *(o que se via quando o bug reincidir — aqui, "reincidir" significa a interface voltar a silenciar)*
- A atribuição de comprador **falha sem explicar por quê** (relatado na **SC 10310**), e o usuário conclui que o sistema está com defeito quando, na verdade, a tarefa foi assumida e saiu do grupo. Cada usuário novo na Gerência de Compras repete o mesmo chamado.

**Severidade:** Média *(bloqueia o andamento da SC e consome ciclo de suporte a cada usuário novo; não há risco financeiro nem de dado, mas o custo se repete indefinidamente enquanto a regra não virar barreira ou aviso na tela)*

**Preparação de massa:** duas SCs em `257 - Gerência de Compras` — uma **deixada no grupo** e outra **assumida de propósito** por um colaborador —, além de um comprador válido para atribuir. Exige perfil de gerência de compras. **Não criável pela conta de QA.** Importante: a SC assumida deve ser criada **para este teste** (prefixo `QA`), nunca uma SC real da fila.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — `/portal/p/1/gerenciaCompras` abre com o título de documento *Cassi - Fluig Plataforma - Gerencia Compras* e heading **Gerência de Compras**; existem as abas **Atribuir** e **Transferir**; ambas trazem as colunas **Processo · Filial · Comprador · Solicitante · Num SC · Grupos de Produto** e os filtros **Selecione a Filial**, **Valor Estimado** e **Selecione o Grupo de Produto** com o botão **Filtrar**. A aba **Atribuir** tem o botão **Atribuir em lote** e listou **0 SCs**. A aba **Transferir** tem os botões **Transferir em Lote**, **+ Detalhes** e **Transferir**, mais o campo **Selecione o comprador**, e listou **65 SCs**. **Nenhuma atribuição ou transferência foi executada.**
**Divergências encontradas:** a assimetria entre as abas foi **confirmada em tela e é o núcleo do caso**: pelo **mesmo** mecanismo e com as **mesmas** colunas, *Transferir* lista **65** SCs e *Atribuir* lista **0**. Isso é consistente com a explicação do ticket (a atribuição só enxerga o que está no grupo), mas **nada na tela informa isso**: a aba *Atribuir* apenas vem vazia, indistinguível de "não há trabalho pendente". Essa é exatamente a lacuna de interface apontada na pendência do ticket, e ela **continua presente hoje** — recomendação: transformar a regra em aviso na aba *Atribuir* ("N processos nesta etapa foram assumidos e por isso não podem ser atribuídos automaticamente"), porque enquanto depender de instrução verbal o chamado se repete.
**Dados/massa usados:** nenhum — leitura das duas abas; nada atribuído, transferido ou alterado.

---

## CT-FSWTBC-4537  (fluig · Concluído · SDCASSI-405)

**Título:** Abrir a Gerência de Compras e confirmar que as SCs aguardando distribuição aparecem para atribuição a um comprador.

**Origem:** FSWTBC-4537 (incidente **SD810592**) — a SC **não aparecia** na Gerência de Compras para distribuição ao comprador. Causa registrada pelo cliente: *"realizar a exportação da widget no ambiente produtivo, pois foi identificada divergência entre o código-fonte e a versão atualmente aplicada no ambiente"* — **sexta** ocorrência de artefato Fluig desatualizado em produção nesta base.

**Módulo/Rota:** **Gerência de Compras** (`/portal/p/1/gerenciaCompras`) → abas **Atribuir** e **Transferir**.

**Pré-condições**
- Ao menos uma SC que já tenha passado por **Distribuição Comprador** (atividade **254**) sem comprador definido e esteja parada em **Gerência de Compras** (atividade **257**).
- Perfil com acesso à Gerência de Compras.
- **Bloqueio:** nenhum para a **leitura** da tela. A **atribuição em si não foi executada** (proibido pelo escopo — alteraria processo de terceiro).

**Passos**
1. Abrir **Gerência de Compras**.
2. Clicar **explicitamente** na aba **Atribuir** (a sub-aba não deve ser herdada do estado anterior da sessão).
3. Conferir se a grade lista as SCs aguardando distribuição, com as colunas **Processo · Filial · Comprador · Solicitante · Num SC · Grupos de Produto**.
4. Aplicar **Filtrar** por *Filial*, *Valor Estimado* e *Grupo de Produto* e conferir que a lista responde.
5. Clicar na aba **Transferir** e conferir a mesma listagem.
6. Comparar a **quantidade de linhas** entre as duas abas.
7. Para uma linha qualquer, acionar **+ Detalhes** e conferir os dados do processo (sem atribuir nem transferir).
8. Conferir que o número em **Processo** corresponde a uma instância parada na atividade **257 — Gerência de Compras**.

**Resultado esperado**
- A aba **Atribuir** lista as SCs que estão aguardando distribuição a comprador, com o combo **"Selecione um comprador"** disponível por linha e o botão **Atribuir em lote**.
- A aba **Transferir** lista as SCs já distribuídas, com o botão **Transferir** por linha e **Transferir em Lote**.
- Uma SC parada em **Gerência de Compras** aparece em **pelo menos uma** das abas — nunca some das duas.
- O filtro e o **Carregar mais resultados** funcionam sem erro de console.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A **Gerência de Compras aparecia sem a SC**, bloqueando totalmente o início do fluxo: sem a SC listada não há distribuição a comprador e nada avança. A causa foi **widget desatualizado em produção** frente ao código-fonte.

**Severidade:** Média

**Preparação de massa:** uma SC parada na atividade **257 (Gerência de Compras)** sem comprador atribuído. Quem prepara: área de Compras (basta uma SC nova percorrer até a distribuição). **Recomendação decorrente do ticket:** antes de rodar o caso, confirmar que a versão publicada do widget da Gerência de Compras é a mesma do repositório — sem esse controle, o teste pode reprovar por deploy, não por código.

**Verificado em tela:** SIM (total, na parte de leitura)
**O que foi verificado:** `/portal/p/1/gerenciaCompras#/` abre com título **Gerência de Compras** e as abas **Atribuir** e **Transferir**. Clicando explicitamente em cada aba: **Transferir lista 65 linhas** — a primeira é o processo **99055**, filial *UNIDADE - CLINICASSI CUIABA - MT*, comprador *"Selecione um comprador"*, solicitante *Eduarda Lima Barros*, **Num SC 000071**, grupos *5010 5670*, com os botões **+ Detalhes** e **Transferir** na linha. Colunas confirmadas: *Processo, Filial, Comprador, Solicitante, Num SC, Grupos de Produto*. Botões da tela: *Filtrar, Atribuir em lote, Transferir em Lote, Carregar mais resultados*. Filtros: *Filial, Valor Estimado, Grupo de Produto*. Por REST confirmou-se que a versão 98 do processo tem as atividades **254 — Distribuição Comprador**, **256 — Distribuído Comprador?** e **257 — Gerência de Compras**.
**Divergências encontradas:** **achado relevante** — a aba **Atribuir** exibe **"Nenhum dado encontrado"** para esta conta, enquanto a aba **Transferir**, na mesma tela e pelo mesmo mecanismo, lista **65** SCs. Ou seja, o sintoma exato do ticket ("SC não aparece na Gerência de Compras para distribuição") **é observável hoje na aba Atribuir** com a conta `TOTVS-FS`. Não é possível, com esta conta, decidir se é filtro por perfil/comprador (limitação de conta, §5-C) ou reincidência — **precisa ser reexecutado com um usuário da Gerência de Compras antes de qualquer conclusão**.
**Dados/massa usados:** nenhum — nenhuma SC foi atribuída, transferida ou aberta em edição.

---

## CT-FSWTBC-4676  (fluig · Concluído · SDCASSI-442)

**Título:** Assumir, como compradora, a tarefa de uma SC distribuída e confirmar que ela passa a constar como responsável.

**Origem:** FSWTBC-4676 (incidente **SD814012**) — a compradora **não conseguia assumir a tarefa** no Portal do Comprador (SC **98350**). Resolvido em horas com a confirmação do cliente *"corrigido, pode seguir com o encerramento"*, **sem nenhum registro do que foi ajustado**. Pelo padrão acumulado da base, a hipótese (não confirmada) é a mesma do SDCASSI-321: a tarefa não deve ser assumida individualmente para que o mecanismo de atribuição automática funcione.

**Módulo/Rota:** **Central de tarefas** (`/portal/p/1/pagecentraltask`) e **Gerência de Compras** (`/portal/p/1/gerenciaCompras`, abas **Atribuir**/**Transferir**); SC parada em **Gerência de Compras** (atividade **257**) ou já distribuída ao comprador.

**Pré-condições**
- Credencial da **compradora** (ou de um comprador equivalente), com matrícula resolvida no ERP.
- Uma SC distribuída a essa compradora, ou disponível para atribuição na aba **Atribuir**.
- **Bloqueio:** não há credencial de comprador; e **assumir tarefa é escrita** sobre processo de terceiro — proibido pelo escopo. O caso não foi executado.

**Passos**
1. Autenticar como a compradora.
2. Abrir a **Central de tarefas** e clicar **explicitamente** na aba **Tarefas a concluir** (a sub-aba fica guardada por sessão no servidor; não confie no estado herdado).
3. Localizar o card da SC (número do processo + nome do processo + nome da atividade).
4. Ler o campo **Responsável** do card **antes** de qualquer ação.
5. Acionar a ação de assumir/aceitar a tarefa oferecida pela plataforma.
6. Recarregar a Central de tarefas e reler o campo **Responsável**.
7. Abrir a aba **Histórico** do processo e conferir o registro do movimento.
8. Em paralelo, abrir **Gerência de Compras → Transferir** e conferir que a SC agora exibe a compradora na coluna **Comprador**.

**Resultado esperado**
- A compradora consegue assumir a tarefa: após a ação, o campo **Responsável** do card passa a exibir o nome dela.
- O **Histórico** do processo registra a assunção, com usuário e data/hora.
- A SC passa a constar com a compradora na coluna **Comprador** da Gerência de Compras.
- Se a política do processo for de **atribuição automática** (tarefa que não deve ser assumida individualmente), a plataforma explica isso com **mensagem clara** — nunca falha em silêncio.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A compradora acionava a ação e **a tarefa não era assumida** (SC 98350). O ticket traz apenas um print da tela e **nenhum registro técnico** do erro ou da correção.

**Severidade:** Média

**Preparação de massa:** uma SC parada na atividade **257 (Gerência de Compras)** ou distribuída à compradora executora, e a credencial dela. Quem prepara: área de Compras + administrador Fluig. **Pendência anterior a este caso:** a regra de atribuição de tarefas do Portal do Comprador não está documentada — sem ela, "não consegue assumir" pode ser tanto defeito quanto comportamento correto.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a **Central de tarefas** foi aberta e está funcional: aba **"Tarefas a concluir 10"**, card do processo **112113 — COTAÇÃO DE PRODUTOS E SERVIÇOS**, atividade **Correção**, **Responsável: Usuário TBC (TOTVS)**, botão **Enviar** e marcador *Atrasada há 1 semana*. Nessa tarefa **o responsável já é o próprio usuário** — não houve nenhuma tarefa de *pool* disponível para exercitar a ação de assumir. A **Gerência de Compras** foi vista com a aba **Transferir** listando **65** SCs (coluna **Comprador** com o combo *"Selecione um comprador"*) e a aba **Atribuir** vazia. Por REST, as atividades **254 — Distribuição Comprador** e **257 — Gerência de Compras** foram confirmadas na versão 98 do `wf_solicitacao_compras`.
**Divergências encontradas:** o ticket fala em "assumir a tarefa no Portal do Comprador"; o Portal do Comprador **não tem** ação de assumir tarefa — a assunção acontece na **Central de tarefas** do Fluig, e a atribuição a comprador acontece na **Gerência de Compras**. São três telas distintas, e o ticket não distingue qual falhou.
**Dados/massa usados:** nenhum — nenhuma tarefa foi assumida, liberada ou movimentada.

---
