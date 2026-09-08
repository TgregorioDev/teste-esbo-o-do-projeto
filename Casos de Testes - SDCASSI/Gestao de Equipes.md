<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# Gestao de Equipes

Casos de teste E2E do Fluig — módulo Gestao de Equipes.

| | |
|---|---|
| Casos neste arquivo | 13 |
| Verificados em tela | 2 total · 10 parcial · 1 não |

> **Como ler.** Cada caso descreve o comportamento **correto esperado hoje**. A maioria dos
> defeitos de origem já foi corrigida — o caso é de regressão: se reprovar, o defeito voltou.
> Os que reprovam hoje por causa nunca corrigida estão marcados no próprio caso.
> *Verificado em tela* diz o que foi conferido no ambiente de homologação em 08/09/2026;
> **PARCIAL** costuma significar que a conta de QA não tem o perfil necessário (comprador,
> gestor, fiscal, fornecedor), não que o caso seja inválido.

---

## CT-FSWTBC-620  (FSWTBC-620 · ambos · Concluído)

**Título:** Gestor abre a Gestão de Equipes e vê a própria equipe montada a partir da árvore hierárquica do Protheus.

**Origem:** FSWTBC-620 — alteração da consulta à árvore hierárquica (RD4) e da widget para consumir os
novos campos devolvidos pela API. Primeiro sinal da migração para a RD4 (dez/2024); a widget de
gestão de equipe é o consumidor.

**Módulo/Rota:** Fluig → Home → *Meus Apps* → aba **Gestão** → **Gestão de Equipes** (`/portal/p/1/gestao_equipes`).
Consumidor secundário: **Gestão do Banco de Horas e Horas Extras** (`/portal/p/1/PORTAL_AUTORIZACAO_HORAS_EXTRAS`) → aba **Organograma**.

**Pré-condições**
- Usuário autenticado no Fluig **que seja gestor** e que exista no Protheus com matrícula ativa
  (a widget resolve o usuário pelo e-mail contra o ERP antes de montar a árvore).
- Estrutura hierárquica cadastrada na **RD4** do Protheus, com o gestor titular do posto.
- Integração REST `apiRESTProtheus_CASSI` no ar.
- **Bloqueio:** parcial. A tela abre e foi verificada, mas **a conta de QA (TOTVS-FS) não é gestor e
  não está cadastrada no ERP** — a widget responde *"Usuário não encontrado no ERP Protheus."*.
  Executar este caso exige um login de gestor real da CASSI. Sem credencial Protheus não há como
  conferir a RD4 do outro lado.

**Passos**
1. Autenticar no Fluig e permanecer na **Home**.
2. Em *Meus Apps*, clicar na aba **Gestão**.
3. Clicar em **Gestão de Equipes**.
4. Aguardar a carga da widget.
5. Para o contraste, abrir **Gestão do Banco de Horas e Horas Extras** e clicar na aba **Organograma**.

**Resultado esperado**
- A widget **Gestão de Equipes** carrega e lista os colaboradores subordinados ao gestor autenticado.
- Os colaboradores exibidos correspondem, um a um, aos da estrutura da RD4 do Protheus para aquele gestor.
- Os campos novos trazidos pela API (dados do posto/estrutura) aparecem preenchidos, não em branco nem como `-`.
- Na aba **Organograma**, a área *Estrutura Colaborador* mostra a árvore navegável, com o texto de
  apoio *"Clique no departamento para visualizar o dashboard."* e departamentos clicáveis.
- Nenhuma mensagem de erro do ERP é exibida.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A widget não traz as informações dos novos campos retornados pela API — campos vazios ou consulta
  devolvendo estrutura antiga, divergente da RD4.

**Verificado em tela:** PARCIAL
**O que foi verificado:** Home → *Meus Apps* com as abas **RH Conecta / Gestão / Compras / Contratos**;
a aba **Gestão** lista exatamente dois apps: *Gestão do Banco de Horas e Horas Extras*
(`/portal/p/1/PORTAL_AUTORIZACAO_HORAS_EXTRAS`) e *Gestão de Equipes* (`/portal/p/1/gestao_equipes`).
Abri **Gestão de Equipes**: a página carrega com o título *Gestão de Equipes* e imediatamente exibe um
modal com o corpo *"Usuário não encontrado no ERP Protheus."* e botão **OK** — nenhuma equipe é
montada. Abri também a aba **Organograma** do Banco de Horas: cabeçalho *Gestão de Monitoramento do
Banco de Horas - Organograma*, bloco *Estrutura Colaborador*, texto *"Clique no departamento para
visualizar o dashboard."*, campo *Substitutos* com o valor `teste10`, e a árvore **vazia** (dois `-`).
**Divergências encontradas:** o modal que anuncia *"Usuário não encontrado no ERP Protheus."* é
renderizado sob o cabeçalho **"Sucesso:"** — erro apresentado como sucesso. É o mesmo mecanismo do
defeito FSWTBC-662 deste lote, vivo hoje em outra tela; ver CT-FSWTBC-662.
**Dados/massa usados:** nenhum — não submetido. Somente leitura.

---

## CT-FSWTBC-630  (sem SDCASSI · fluig · Concluído)

**Título:** Quando a widget Gestão de Equipes falha, o erro é apresentado ao usuário em tela — não fica silencioso.

**Origem:** FSWTBC-630 — "[DEM10011432] ERRO19 - Desenvolvimento das validações (Toast) para mostrar
os erros em tela". Item 19 da série ERRO01..ERRO21 de apontamentos da widget de gestão de equipe;
antes disso as falhas eram silenciosas para o usuário.

**Módulo/Rota:** Home → aba **Gestão** → **Gestão de Equipes** (`/portal/p/1/gestao_equipes`).

**Pré-condições**
- Usuário autenticado no portal.
- Para provocar a falha de forma controlada: usuário cujo e-mail não resolva matrícula no ERP, ou
  serviço do Protheus indisponível.
- **Bloqueio:** nenhum — o cenário de erro é alcançável hoje com a conta de QA.

**Passos**
1. Abrir `/portal/p/1/gestao_equipes`.
2. Aguardar a carga da widget (as consultas ao ERP levam alguns segundos).
3. Observar a mensagem apresentada e o rótulo/ícone que a acompanha.
4. Fechar a mensagem e observar o estado da tela.

**Resultado esperado**
- A falha é **comunicada em tela** (não fica silenciosa).
- A mensagem é apresentada com **severidade de erro** — rótulo e ícone de erro, nunca de sucesso.
- O texto identifica a causa (ex.: *"Usuário não encontrado no ERP Protheus."*).
- Após fechar a mensagem, a tela apresenta um **estado vazio explicativo** ou a ação de recuperação —
  não uma página em branco.

**Resultado se o defeito reincidir**
- Nenhuma mensagem aparece: a widget falha em silêncio e o usuário fica sem saber por que a árvore
  não carregou.

**Verificado em tela:** SIM (total)
**O que foi verificado:** ao abrir `/portal/p/1/gestao_equipes` com a conta `TOTVS-FS`, a widget exibe
um modal SweetAlert2 com **título `Sucesso:`** e corpo **`Usuário não encontrado no ERP Protheus.`**,
com os botões **OK**, **No**, **Cancel** e um **×**. O console registra
`SweetAlert2: Unknown icon! Expected "success", "error", "warning", "info" or "question", got "danger"`.
No fonte servido `ly_gestao_equipes_pt_BR.js` estão literalmente
`message: "Usuário não encontrado no ERP Protheus."` e `type: "danger"`. Depois de clicar **OK**, a
página fica **vazia** — sem árvore, sem tabela, sem abas, sem campos e sem estado vazio.
**Divergências encontradas:** **três, todas relevantes.**
(1) O erro é anunciado sob o cabeçalho **"Sucesso:"** — severidade invertida.
(2) O tipo passado é `"danger"`, que **não é um ícone válido** do SweetAlert2 (aceita
`success/error/warning/info/question`), então nenhum ícone é renderizado.
(3) O ticket fala em **Toast**; o que existe hoje é um **modal bloqueante** com três botões
(*OK/No/Cancel*) para uma mensagem que só admite ciência.
Some-se que, após o OK, não há estado vazio — a tela em branco não distingue "erro" de "carregando".
**Dados/massa usados:** nenhum — apenas a conta de QA; nada foi gravado.

---

## CT-FSWTBC-632  (FSWTBC-632 · ambos · Concluído)

**Título:** Gestor consulta a árvore hierárquica e encontra todos os gestores subordinados que estão cadastrados na RD4.

**Origem:** FSWTBC-632 — ERRO14: a árvore hierárquica não retorna alguns gestores, embora estejam
corretos na RD4. Exemplo citado no ticket: o perfil da **Gleide** não retorna a gerência do **Robson**.
O ticket distingue com clareza cadastro (RD4 correto) de consumo (Fluig não retorna) — o problema
estava na consulta, não no dado. 32 dias em homologação.

**Módulo/Rota:** Fluig → Home → *Meus Apps* → aba **Gestão** → **Gestão de Equipes**; e
**Gestão do Banco de Horas e Horas Extras** → aba **Organograma**.

**Pré-condições**
- Login de um **gestor cujo subordinado também seja gestor** (caso do ticket: Gleide → gerência do Robson).
- Ambos com posto e estrutura corretos na **RD4** do Protheus — condição a ser conferida antes, no ERP.
- **Bloqueio:** duplo. (1) exige login de gestor real da CASSI — a conta de QA não é gestor e a widget
  responde *"Usuário não encontrado no ERP Protheus."*; (2) a conferência do lado RD4 exige acesso ao
  Protheus, **sem credencial**. O caso fica registrado como cenário de regressão a ser executado pelo
  time da CASSI com o perfil da Gleide (ou equivalente).

**Passos**
1. Autenticar no Fluig com o login do gestor de topo (perfil equivalente ao da Gleide do ticket).
2. Abrir **Home → aba Gestão → Gestão de Equipes**.
3. Localizar, na estrutura exibida, o gestor subordinado (equivalente ao Robson) e a gerência dele.
4. Abrir **Gestão do Banco de Horas e Horas Extras → aba Organograma** e navegar pela *Estrutura Colaborador*.
5. Comparar a lista exibida com a estrutura cadastrada na RD4 para o mesmo gestor.

**Resultado esperado**
- **Todos** os gestores subordinados cadastrados na RD4 aparecem na árvore — inclusive os que são, eles
  próprios, gestores de uma gerência.
- A gerência do subordinado é navegável a partir do perfil do gestor de topo.
- A árvore exibida é idêntica, em composição, à estrutura da RD4: nenhum nó a mais, nenhum a menos.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Alguns gestores simplesmente não retornam na árvore, apesar de corretos na RD4 — no ticket, o perfil
  da Gleide não retornava a gerência do Robson.

**Verificado em tela:** PARCIAL
**O que foi verificado:** as duas telas consumidoras existem e abrem. **Gestão de Equipes**
(`/portal/p/1/gestao_equipes`) carrega e devolve *"Usuário não encontrado no ERP Protheus."*.
**Organograma** (aba do `/portal/p/1/PORTAL_AUTORIZACAO_HORAS_EXTRAS`) carrega com o cabeçalho *Gestão
de Monitoramento do Banco de Horas - Organograma*, o bloco *Estrutura Colaborador* e a instrução
*"Clique no departamento para visualizar o dashboard."*, mas **nenhum nó é renderizado** (a estrutura
aparece como `-`). A causa observada é ambiental e está registrada: a página chama
`{"serviceCode":"apiRESTProtheus_CASSI","tenantCode":"1","endpoint":"/ping/","method":"get"}`, dispara
o `alert()` nativo *"Existem parâmetros não informado para esse servidor, informe o administrador"* e
o modal *"Ops! Não foi possivel se comunicar com o Protheus, base offline."*.
**Divergências encontradas:** nenhuma quanto ao caminho. Nota de execução: para observar o `alert()`
nativo é obrigatório registrar o handler de diálogo **antes** de navegar — o Playwright o dispensa
sozinho, e sem isso a mensagem some sem deixar rastro.
**Dados/massa usados:** nenhum — não submetido. Somente leitura.

---

## CT-FSWTBC-635  (sem SDCASSI · fluig · Concluído)

**Título:** A widget Gestão de Equipes lista os colaboradores dos departamentos subordinados ao gestor.

**Origem:** FSWTBC-635 — "[DEM10011432] Implementação de consulta GenericQuery e alteração na widget
para exibição dos colaboradores para os departamentos". Registro técnico: consulta alimentando a
widget; ficou 19 dias em teste.

**Módulo/Rota:** Home → aba **Gestão** → **Gestão de Equipes** (`/portal/p/1/gestao_equipes`).

**Pré-condições**
- Usuário **gestor**, com matrícula resolvível no ERP a partir do e-mail cadastrado no Fluig.
- Gestor com ao menos um **departamento subordinado** e colaboradores lotados nele.
- Pertinência ao grupo consultado pela widget (`colleagueGroup` é chamado com `groupId=EquipeRH`).
- **Bloqueio:** **sim** — a conta de QA disponível (`TOTVS-FS` / `fabricasoftware@totvs.com.br`) **não
  resolve matrícula no ERP**, então a widget aborta antes de listar qualquer colaborador. Requer conta
  de gestor cadastrada no Protheus.

**Passos**
1. Autenticar como gestor com equipe.
2. Abrir `/portal/p/1/gestao_equipes`.
3. Aguardar a montagem da hierarquia.
4. Selecionar um departamento subordinado.
5. Conferir a lista de colaboradores exibida.

**Resultado esperado**
- A widget carrega sem mensagem de erro.
- Ao selecionar um departamento subordinado, os **colaboradores lotados nele** são listados.
- Gestor **sem** departamentos subordinados recebe a mensagem explicativa
  *"Não existem registros de departamentos subordinados para o colaborador selecionado!"* — e não uma
  lista vazia sem explicação.

**Resultado se o defeito reincidir**
- Os colaboradores não são exibidos para os departamentos (lista vazia), sem indicação de causa.
  Mensagem exata `<não documentado>` no ticket.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a widget existe e é a `ly_gestao_equipes` + `wd_gestao_equipes`. Com a conta
de QA, a carga faz, nesta ordem, `ds_protheus_getMatriculaTitular_rest` (filtrando por
`email=fabricasoftware@totvs.com.br`), `colleague`, `dsProtheus_getUsers_restGetAll` (por `externalId`)
e `colleagueGroup` (`groupId=EquipeRH`) — **todos 200** — e então aborta com *"Usuário não encontrado
no ERP Protheus."*, sem listar colaborador. No fonte servido `DataHandler_pt_BR.js` estão a consulta da
hierarquia — `dsProtheus_getArvoreHierarquica_restGetAll` (filtros `CorporateId`, `BranchId`,
`ISMANAGER`, `CODESE…`) — e a mensagem **"Não existem registros de departamentos subordinados para o
colaborador selecionado!"**.
**Divergências encontradas:** o ticket fala em **GenericQuery**; nos fontes da widget servidos ao
navegador **não há chamada a GenericQuery** — o que se vê é `/api/public/ecm/dataset/search` e
`DatasetFactory.getDataset('dsProtheus_getRJ2_SRA', …)`. O GenericQuery pode estar dentro do dataset
server-side (não inspecionável por esta rota), mas pela tela a afirmação do ticket não se confirma.
**Dados/massa usados:** nenhum — nada gravado.

---

## CT-FSWTBC-636  (sem SDCASSI · fluig · Concluído)

**Título:** O formulário de Tarefas Assumidas grava e exibe corretamente os campos do histórico do mês.

**Origem:** FSWTBC-636 — "[DEM10011432] Correção de campos no formulário de tarefas assumidas".
Série DEM10011432 (gestão de equipe / tarefas assumidas).

**Módulo/Rota:** Home → aba **Gestão** → **Gestão de Equipes** (`/portal/p/1/gestao_equipes`) →
funcionalidade de **Tarefas Assumidas** (histórico mensal). Não há rota própria: a funcionalidade é
interna à widget.

**Pré-condições**
- Usuário **gestor** com matrícula resolvível no ERP (mesma pré-condição de CT-FSWTBC-635).
- Equipe montada na widget (a funcionalidade só é alcançável depois da árvore carregada).
- Registro de tarefas assumidas no mês/ano de referência.
- **Bloqueio:** **sim** — a tela **não é alcançável** com a conta disponível: a widget aborta na
  resolução de matrícula e a página fica vazia. Sem conta de gestor cadastrada no Protheus não há
  como abrir o formulário.

**Passos**
1. Autenticar como gestor com equipe e abrir `/portal/p/1/gestao_equipes`.
2. Aguardar a montagem da hierarquia.
3. Acessar a funcionalidade de **Tarefas Assumidas** do colaborador/departamento.
4. Conferir os campos exibidos e o total do mês.
5. Gravar uma alteração e reabrir para conferir a persistência.

**Resultado esperado**
- Todos os campos do formulário de Tarefas Assumidas são exibidos com o rótulo correto e o valor
  gravado (o defeito original era de **campos**, não de fluxo).
- O total mensal corresponde ao retornado por `dsFluig_getQtdFormTarAssumidaMes` para o
  `prefixoID` e o `anoSolicitacao` corretos.
- A gravação conclui sem erro; ao reabrir, os valores persistem.
- Falha de gravação é comunicada ao usuário em tela (ver CT-FSWTBC-630).

**Resultado se o defeito reincidir**
- Campos do formulário de tarefas assumidas ausentes, trocados ou não persistidos.
  Mensagem exata `<não documentado>`; o fonte prevê o texto de erro
  *"Erro ao realizar a gravação do formulário de histórico de Tarefas Assumidas."*

**Verificado em tela:** NÃO
**O que foi verificado:** a existência da funcionalidade foi confirmada **indiretamente**, no fonte
servido `wd_gestao_equipes/resources/js/app/DataHandler_pt_BR.js`, que consulta
`dsFluig_getQtdFormTarAssumidaMes` (filtros `prefixoID`, `anoSolicitacao`) e trata o erro
*"Erro ao realizar a gravação do formulário de histórico de Tarefas Assumidas."*. A **tela** não foi
aberta: a widget não passa da resolução de matrícula com a conta de QA e a página fica em branco.
**Divergências encontradas:** não há rota nem menu próprio para "tarefas assumidas" — é uma
funcionalidade interna da widget Gestão de Equipes, o que o ticket não diz. Sem uma conta de gestor
válida, a funcionalidade é **inalcançável em homologação**.
**Dados/massa usados:** nenhum — nada gravado.

---

## CT-FSWTBC-637  (sem SDCASSI · fluig · Concluído)

**Título:** A widget Gestão de Equipes monta a árvore hierárquica para qualquer gestor com cadastro consistente entre Fluig e ERP.

**Origem:** FSWTBC-637 — "[DEM10011432] Widget não monta a árvore com usuário específicos". A
investigação mudou a conclusão: o endpoint não retornava `alencar.corradi@cassi.com.br` **apenas na
base PRIME**; aprofundando, o e-mail cadastrado para aquela matrícula era outro
(`flavio.alves@cassi.com.br`). Ou seja, **dado cadastral divergente entre bases**, não defeito de
código. 26 dias em homologação, 7 PNGs comparando PRIME, TST e AppRoot.

**Módulo/Rota:** Home → aba **Gestão** → **Gestão de Equipes** (`/portal/p/1/gestao_equipes`).

**Pré-condições**
- Usuário gestor cujo **e-mail no Fluig seja o mesmo e-mail da matrícula no ERP** (é exatamente esse
  o pareamento que falhava).
- Executar o caso em **cada base** onde a widget é publicada (PRIME, TST, AppRoot) — o defeito
  original só aparecia em uma delas.
- **Bloqueio:** **sim, parcial** — só há acesso a **uma** base nesta rodada, e a conta disponível é
  justamente uma que **não** resolve matrícula, então o caminho feliz não pôde ser observado.

**Passos**
1. Autenticar como o gestor a validar.
2. Abrir `/portal/p/1/gestao_equipes`.
3. Aguardar a carga e observar se a árvore hierárquica é montada.
4. Se não montar, conferir o e-mail do usuário no Fluig e o e-mail da matrícula no ERP e comparar.
5. Repetir em cada base publicada.

**Resultado esperado**
- A árvore hierárquica é montada e o gestor enxerga sua equipe, **na mesma base e em todas as bases**.
- Quando a matrícula não é resolvida, a widget informa a causa **como erro** e mantém a tela
  utilizável (ver CT-FSWTBC-630).
- O pareamento e-mail Fluig ↔ e-mail da matrícula no ERP é consistente entre as bases — divergência de
  cadastro é a causa raiz a investigar antes de abrir bug de código.

**Resultado se o defeito reincidir**
- A árvore não é montada para determinados usuários — e apenas em uma das bases. À época, o
  endpoint `/api/v1/fluig/integracao/dependentes/matricula/` não retornava
  `alencar.corradi@cassi.com.br` na base PRIME, porque a matrícula estava cadastrada com
  `flavio.alves@cassi.com.br`.

**Verificado em tela:** SIM (total, no ramo de falha)
**O que foi verificado:** com a conta `TOTVS-FS` a widget **reproduz hoje a mesma classe de sintoma**:
a consulta `ds_protheus_getMatriculaTitular_rest` é feita **por e-mail**
(`filterFields=email,fabricasoftware@totvs.com.br`), retorna 200 sem casar a matrícula, e a widget
aborta com o modal *"Usuário não encontrado no ERP Protheus."*; **a árvore não é montada** e, após o
OK, a página fica vazia. No fonte servido `DataHandler_pt_BR.js` a árvore vem de
`dsProtheus_getArvoreHierarquica_restGetAll` (filtros `CorporateId`, `BranchId`, `ISMANAGER`), e em
`LyDataHandler_pt_BR.js` a cadeia de identificação é `ds_protheus_getMatriculaTitular_rest` (por
e-mail) → `colleague` (por `mail`) → `dsProtheus_getUsers_restGetAll` (por `externalId` = e-mail) →
`colleagueGroup` → `dsProtheus_getRJ2_SRA` (por `MATRICULA_SUB`). Isto **confirma a causa raiz do
ticket**: toda a identificação pende do e-mail, então e-mail divergente entre Fluig e ERP derruba a
widget inteira.
**Divergências encontradas:** o endpoint citado no ticket,
**`/api/v1/fluig/integracao/dependentes/matricula/`**, responde **404** hoje (testado com e sem
matrícula, ambos `404 Not Found`). O caminho atual é o dataset `ds_protheus_getMatriculaTitular_rest`.
O caso de teste deve mirar o dataset, não o endpoint do ticket.
**Dados/massa usados:** conta de QA `TOTVS-FS` (e-mail `fabricasoftware@totvs.com.br`); nada gravado.

## CT-FSWTBC-643  (fluig · Concluído)

**Título:** Colaborador cujo gestor é um posto vago tem a pendência atribuída ao usuário admin, e não a ninguém no vazio.

**Origem:** FSWTBC-643 — "[DEM10011432] ERRO21 - Atribuir ao usuário admin as pendências que seriam
para o posto vago". Contorno adotado para o posto vago (mesmo problema de FSWTBC-332): a pendência vai
para o `admin` em vez de travar. **É contorno, não correção** — o posto vago continua existindo no
cadastro, e o `admin` concentra tarefas.

**Módulo/Rota:** widget **Gestão de Equipes** (`/portal/p/1/gestao_equipes`) — árvore hierárquica e
pendências por posto. Efeito colateral verificável na **Central de Tarefas** e na API de workflow
(responsável da tarefa).

**Pré-condições**
- Conta de **gestor** com matrícula resolvível no Protheus (a árvore só monta assim).
- Na visão 37 da RD4, um nó **sem matrícula** (`RA_MAT` vazio) — o posto vago — com pendência
  associada ao seu **código de posto**.
- **Bloqueio:** **sim** — a conta de QA não é funcionário no Protheus: a widget aborta antes de montar
  a árvore ("Usuário não encontrado no ERP Protheus."). Sem conta de gestor, nem a árvore nem as
  pendências são alcançáveis. O cadastro de postos vive no ERP (RD4), sem credencial nesta rodada.

**Passos**
1. Autenticar com a conta de **gestor** e abrir **Gestão de Equipes**.
2. Localizar na árvore o nó exibido como **POSTO VAGO** (nó sem colaborador).
3. Clicar no nó e abrir a lista de **pendências** dele.
4. Verificar, na Central de Tarefas do `admin` (ou pela API de workflow), quem é o **responsável** das
   tarefas originadas desse posto.
5. Conferir que a árvore continua montando normalmente com o posto vago presente.

**Resultado esperado**
- A árvore monta **com** o posto vago, exibido como um nó chamado **POSTO VAGO**, com destaque visual
  próprio (classe distinta das dos colaboradores ativos).
- As pendências que caberiam ao posto vago ficam com **responsável = `admin` (Administrador Cassi)**,
  e não sem responsável.
- Nenhuma tarefa fica órfã, e a widget **não** quebra nem exibe erro por causa do posto vago.
- A pendência atribuída ao `admin` continua movimentável (o `admin` consegue concluir a etapa).

**Resultado se o defeito reincidir**
- A pendência do posto vago fica **sem responsável** — não aparece para ninguém — ou a montagem da
  árvore/pendências falha ao encontrar um nó sem matrícula. Mensagem exata `<não documentado>`.

**Severidade:** Média *(tarefa órfã trava o fluxo; o contorno concentra carga no admin e mascara o
problema cadastral — vale registrar como dívida)*

**Preparação de massa:** um posto vago real na visão 37 da RD4 **com pendência associada**, criado
pela área de RH/ERP, e uma conta de gestor acima dele. Nada disso é criável pelo executor.

**Verificado em tela:** PARCIAL
**O que foi verificado:** `/portal/p/1/gestao_equipes` abre com o heading **Gestão de Equipes** e
imediatamente exibe o modal *"Usuário não encontrado no ERP Protheus."* com botão **OK** — a árvore
nunca monta para esta conta. Nos fontes servidos da widget confirmei o mecanismo:
`wd_gestao_equipes/resources/js/app/EventHandler_pt_BR.js` trata o nó sem matrícula
(`if (data.RA_MAT == '') { classStatusEmployee = 'learning'; //Posto Vago }`) e o rotula
`name: ${data.RA_NOME || 'POSTO VAGO'}`; `DataHandler_pt_BR.js` busca as pendências por **código de
posto**, em
`/api/public/ecm/dataset/search?datasetId=dsProtheus_getPendenciaHierarquica_restGetAll&filterFields=CorporateId,<x>,BranchId,<y>,CODIGOPOSTO,<userPosto>&limit=300`
— ou seja, a pendência é resolvida pelo **posto**, não pela matrícula, que é exatamente a raiz do
cenário. A atribuição ao `admin` foi observada viva noutro fluxo: na medição **113249** o movimento 8
(etapa 162) está registrado com `assignee.code = admin` / *Administrador Cassi* (`fluig@cassi.com.br`).
**Divergências encontradas:** o ticket fala em "pendências para o posto vago" sem dizer onde; na tela
isso é a widget **Gestão de Equipes**, e a pendência é buscada por `CODIGOPOSTO`, não por posto
"vago" explícito — não há rótulo "posto vago" em tela, só o nome de nó **POSTO VAGO** gerado quando
`RA_NOME` vem vazio.
**Dados/massa usados:** nenhum — leitura de tela e dos fontes servidos ao navegador.

---

## CT-FSWTBC-647  (fluig · Concluído)

**Título:** Gestor abre a Gestão de Equipes e a legenda explica o que cada destaque da árvore significa.

**Origem:** FSWTBC-647 — "[DEM10011432] ERRO08 – Informação de legenda". Ajuste de usabilidade na
widget de Gestão de Equipes. O ticket traz **apenas o título**, sem descrição — este caso é, por isso,
uma **caracterização de caminho**: percorre a funcionalidade citada e afirma o comportamento
observável.

**Módulo/Rota:** widget **Gestão de Equipes** (`/portal/p/1/gestao_equipes`) — painel de legenda da
árvore hierárquica (`.panel-legendas`).

**Pré-condições**
- Conta de **gestor** com matrícula resolvível no Protheus (sem ela a árvore não monta).
- Equipe com ao menos um colaborador em cada situação representada na legenda (ativo, afastado,
  posto vago).
- **Bloqueio:** **sim** — a conta de QA não resolve matrícula no ERP; a widget aborta antes de montar
  a árvore e a legenda nunca é exibida.

**Passos**
1. Autenticar com conta de gestor e abrir **Gestão de Equipes**.
2. Aguardar a árvore (organograma) montar.
3. Localizar o painel de **legenda** exibido junto ao organograma.
4. Conferir que cada item da legenda corresponde a um destaque visual efetivamente usado nos nós
   (ativo, posto vago e demais situações).
5. Localizar um nó **POSTO VAGO** e conferir que o destaque dele está descrito na legenda.

**Resultado esperado**
- A legenda **aparece junto com a árvore** — ela é revelada no mesmo momento em que o organograma é
  renderizado, não antes (não fica visível numa tela vazia) e não depois de interação extra.
- Cada situação representada por cor/ícone nos nós tem entrada correspondente na legenda, com texto
  legível.
- O nó de **posto vago** é identificável pela legenda, sem depender de conhecimento prévio.

**Resultado se o defeito reincidir**
- A legenda não aparece, aparece incompleta ou descreve situações que não correspondem ao destaque
  usado nos nós — o usuário vê cores sem saber o que significam. Mensagem exata `<não documentado>`
  (o ticket só tem o título).

**Severidade:** Baixa *(apresentação/usabilidade)*

**Preparação de massa:** conta de gestor cadastrada no Protheus com equipe montada, incluindo ao menos
um posto vago para exercitar todos os itens da legenda. Fora do alcance do executor.

**Verificado em tela:** PARCIAL
**O que foi verificado:** `/portal/p/1/gestao_equipes` abre (título *Cassi - Fluig Plataforma - Gestão
de Equipes*, heading **Gestão de Equipes**) e exibe o modal *"Usuário não encontrado no ERP
Protheus."* — a árvore e, com ela, a legenda **não chegam a renderizar** para esta conta. Nos fontes
servidos da widget, `wd_gestao_equipes/resources/js/app/ViewHandler_pt_BR.js` confirma a existência do
painel e o momento em que ele aparece: logo após `FLUIGC.orgChart(oElement, settingsTemplate)` executa
`$('.panel-legendas').removeClass('fs-display-none')` — a legenda é revelada **junto** com o
organograma. Confirmei também as situações que a legenda precisa cobrir: nó sem matrícula recebe
classe `learning` e nome **POSTO VAGO**; há um `case 'D' //Demitidos` **comentado** no fonte.
**Divergências encontradas:** a situação "Demitidos" está **comentada** no fonte
(`// case 'D': //Demitidos // classStatusEmployee = 'learning';`) — se a legenda listar "demitidos",
ela descreve um destaque que hoje não é aplicado. Isso é achado, e cruza com FSWTBC-648 ("ERRO02 –
Retornos demitidos"). Além disso, a tela usa o cabeçalho **"Sucesso:"** para anunciar o erro
*"Usuário não encontrado no ERP Protheus."* (mesmo defeito de rotulagem de FSWTBC-630) e o console
acusa `SweetAlert2: Unknown icon! ... got "danger"`.
**Dados/massa usados:** nenhum — leitura de tela e dos fontes servidos ao navegador.

---

## CT-FSWTBC-649  (FSWTBC-649 · ambos · Concluído)

**Título:** Conferir que a árvore hierárquica exibida no Fluig reproduz exatamente a estrutura cadastrada no Protheus.

**Origem:** FSWTBC-649 — ERRO01: o Fluig não estava retornando os dados da árvore hierárquica de acordo
com as informações do Protheus. É o primeiro e mais estrutural da série; base de toda a família de
erros de gestor/superior.

**Módulo/Rota:** Fluig → **Gestão de Equipes** (`/portal/p/1/gestao_equipes`) e
**Gestão do Banco de Horas e Horas Extras → aba Organograma**. Origem do dado: **RD4** do Protheus,
servida pela integração `apiRESTProtheus_CASSI`.

**Pré-condições**
- Estrutura hierárquica cadastrada e estável na RD4 do Protheus, com uma amostra conhecida
  (departamento, gestor e subordinados) escolhida como referência.
- Usuário Fluig gestor, existente no ERP.
- Integração REST no ar.
- **Bloqueio:** a comparação exige ler a RD4 **no Protheus** — **sem credencial**. E a árvore não
  renderiza para a conta de QA (*"Usuário não encontrado no ERP Protheus."*). Executável apenas por
  quem tenha login de gestor da CASSI e acesso ao ERP.

**Passos**
1. No Protheus, extrair a estrutura da RD4 para o departamento de referência (gestor + subordinados diretos).
2. No Fluig, autenticar com o gestor correspondente.
3. Abrir **Home → aba Gestão → Gestão de Equipes** e aguardar a carga completa da widget.
4. Abrir também **Gestão do Banco de Horas e Horas Extras → aba Organograma** e navegar até o mesmo departamento.
5. Comparar, item a item, os colaboradores e a hierarquia exibidos com a extração da RD4.

**Resultado esperado**
- A árvore exibida no Fluig é **igual** à estrutura da RD4: mesmos colaboradores, mesmo gestor, mesma
  relação de subordinação.
- Nenhum colaborador da RD4 fica de fora e nenhum registro estranho à RD4 aparece.
- Os campos de cada nó (posto, departamento, gestor) trazem os valores do Protheus, não valores vazios.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O Fluig não retorna os dados da árvore hierárquica de acordo com as informações do Protheus —
  estrutura divergente da RD4. `<divergência específica não detalhada no ticket>`

**Verificado em tela:** PARCIAL
**O que foi verificado:** mesmos elementos do CT-FSWTBC-632 — as duas telas consumidoras existem, abrem
e estão no caminho descrito. **Gestão de Equipes** devolve *"Usuário não encontrado no ERP Protheus."*;
**Organograma** apresenta *Estrutura Colaborador* sem nenhum nó, com o Protheus fora
(*"Ops! Não foi possivel se comunicar com o Protheus, base offline."* e o `alert()` nativo *"Existem
parâmetros não informado para esse servidor, informe o administrador"*). Confirmei portanto o caminho
e os elementos, **não** o conteúdo da árvore.
**Divergências encontradas:** nenhuma quanto ao caminho.
**Dados/massa usados:** nenhum — não submetido. Somente leitura.

---

## CT-FSWTBC-650  (FSWTBC-650 · ambos · Concluído)

**Título:** Consultar a estrutura e confirmar que os postos vagos da visão 37 da RD4 aparecem, inclusive quando não há colaborador ocupando o posto.

**Origem:** FSWTBC-650 — ERRO09: a API não retornava os **postos vagos** da visão 37 da RD4. O ticket
traz passos reprodutíveis reais: a matrícula **00011704** foi inserida no posto **80010570** por
substituição (não ocupou), o posto foi ocupado manualmente pelo módulo 70 e a pessoa foi cadastrada
como responsável do departamento **500387811** na SQB — e mesmo assim o Fluig não a exibia. Correção
registrada: *"ajuste efetuado na query que retorna informações, inserindo LEFT ao invés de INNER"* —
um INNER JOIN estava eliminando os postos vagos.

**Módulo/Rota:** Protheus RH (RD4, visão 37; SQB) → API de estrutura → Fluig **Gestão de Equipes** /
**Organograma** do Portal de Autorização de Horas Extras.

**Pré-condições**
- Um **posto vago** existente na visão 37 da RD4 (posto sem colaborador ocupante), no departamento de referência.
- Um posto com colaborador cadastrado como responsável do departamento na **SQB**.
- **Bloqueio:** este é o caso mais dependente do ERP do lote. A visão 37 da RD4, a ocupação por
  substituição, o módulo 70 e a SQB **só existem no Protheus** — **sem credencial**, nada disso é
  montável nem conferível aqui. No Fluig verifica-se apenas o consumo. Hoje o consumo está, além
  disso, sem dado algum (Protheus fora). Caso escrito para execução pelo time da CASSI.

**Passos**
1. No Protheus, garantir na **visão 37 da RD4** um posto **vago** no departamento de referência e um
   colaborador responsável cadastrado na **SQB** (cenário do ticket: matrícula 00011704, posto
   80010570, departamento 500387811).
2. No Fluig, autenticar com o gestor do departamento.
3. Abrir **Gestão de Equipes** e, em seguida, **Gestão do Banco de Horas e Horas Extras → aba Organograma**.
4. Navegar até o departamento de referência na *Estrutura Colaborador*.
5. Conferir a presença do **posto vago** e do colaborador responsável.

**Resultado esperado**
- Os **postos vagos** da visão 37 da RD4 são retornados e exibidos na estrutura — a ausência de
  colaborador ocupante **não** elimina o posto do resultado (a consulta usa junção à esquerda).
- O colaborador cadastrado como responsável do departamento na SQB aparece na estrutura do Fluig.
- A contagem de postos exibida bate com a da visão 37 da RD4, vagos incluídos.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A API não retorna os postos vagos da visão 37 da RD4; no cenário do ticket, mesmo após ocupar o posto
  manualmente e cadastrar a responsável na SQB, **o Fluig não exibia a colaboradora**. Causa original:
  **INNER JOIN** na query de estrutura, eliminando as linhas sem ocupante — corrigido para **LEFT**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** apenas o lado consumidor, e sem dado. A aba **Organograma** existe
(*Gestão de Monitoramento do Banco de Horas - Organograma*, bloco *Estrutura Colaborador*, texto
*"Clique no departamento para visualizar o dashboard."*), mas nenhuma estrutura é renderizada: os nós
aparecem como `-` e a página informa *"Ops! Não foi possivel se comunicar com o Protheus, base
offline."*. **Gestão de Equipes** devolve *"Usuário não encontrado no ERP Protheus."*. Não há, no
Fluig, tela que exponha a visão 37 da RD4 diretamente — a pré-condição do caso **não é satisfazível**
nesta rodada.
**Divergências encontradas:** nenhuma. Registro: o campo *Substitutos* do portal de horas extras
exibe o valor `teste10`, resíduo de massa de teste — anotado como observação, sem relação com o defeito.
**Dados/massa usados:** nenhum — não submetido. Somente leitura.

---

## CT-FSWTBC-651  (fluig · Concluído)

**Título:** Gestor abre a Gestão de Equipes e a árvore da equipe carrega em tempo aceitável, sem timeout.

**Origem:** FSWTBC-651 — "[DEM10011432] ERRO04 – Performance do retorno da gestão de equipe". Problema
de desempenho no retorno da widget. Junto com FSWTBC-180 (timeout de 1 min), aponta as consultas
hierárquicas como ponto de carga. O ticket traz **apenas o título**, sem número-alvo de tempo — este
caso é uma **caracterização de caminho**, e o limite abaixo precisa ser confirmado com o cliente.

**Módulo/Rota:** widget **Gestão de Equipes** (`/portal/p/1/gestao_equipes`) — datasets
`dsProtheus_getArvoreHierarquica_restGetAll` (árvore) e
`dsProtheus_getPendenciaHierarquica_restGetAll` (pendências por posto).

**Pré-condições**
- Conta de **gestor** com matrícula resolvível no Protheus.
- Equipe grande o suficiente para ser representativa (idealmente próxima do limite de 300 registros
  usado pela widget).
- **Bloqueio:** **sim** — a conta de QA aborta antes de consultar a árvore; o tempo medido aqui é o do
  caminho de erro, não o do caminho feliz. Medir performance real exige conta de gestor.

**Passos**
1. Autenticar com conta de gestor, abrir o DevTools (aba Rede) e carregar **Gestão de Equipes**.
2. Cronometrar da navegação até o organograma renderizado.
3. Na aba Rede, medir o tempo da chamada
   `/api/public/ecm/dataset/search?datasetId=dsProtheus_getArvoreHierarquica_restGetAll&...&limit=300`.
4. Clicar num nó e cronometrar a chamada de pendências
   (`dsProtheus_getPendenciaHierarquica_restGetAll`, `limit=300`).
5. Repetir com um gestor de equipe grande.

**Resultado esperado**
- A árvore renderiza **sem timeout** e sem a página ficar em branco.
- O indicador de carregamento (*loading*) aparece durante a consulta e some ao fim — o usuário nunca
  fica sem retorno visual.
- As consultas respeitam a paginação da widget (`limit=300` na árvore e nas pendências, `limit=100`
  nas listas auxiliares) — nenhuma consulta traz a base inteira.
- Erro na consulta é tratado e registrado (`Erro ao buscar as informações da árvore hierárquica do
  colaborador.`), sem deixar a tela pendurada.
- Tempo de resposta dentro do acordado com o cliente — **alvo a confirmar**: o ticket não fixa número
  e o comparável registrado é o timeout de 1 min de FSWTBC-180.

**Resultado se o defeito reincidir**
- A Gestão de Equipes demora a ponto de estourar timeout (ordem de 1 minuto, conforme FSWTBC-180) ou
  fica carregando indefinidamente. Mensagem exata `<não documentado>`.

**Severidade:** Média *(inviabiliza o uso da tela; sem risco financeiro direto)*

**Preparação de massa:** conta de gestor com equipe real e volumosa, para que a medição signifique
alguma coisa. Idealmente, medir em dois momentos do dia (a madrugada é janela de carga conhecida do
ambiente — a medição automática roda às 01:00/03:00).

**Verificado em tela:** PARCIAL
**O que foi verificado:** a carga de `/portal/p/1/gestao_equipes` levou **13,0 s** até abortar com
*"Usuário não encontrado no ERP Protheus."* — isto é o tempo do **caminho de erro**, não o da árvore.
Na carga, a widget dispara, nesta ordem, `ds_protheus_getMatriculaTitular_rest` (por e-mail),
`search?datasetId=ds_protheus_getMatricula...`, `colleague`, `dsProtheus_getUsers_rest` e
`colleagueGroup`. Nos fontes, `DataHandler_pt_BR.js` usa `limit=300` em cinco consultas (incluindo
`dsProtheus_getArvoreHierarquica_restGetAll` e `dsProtheus_getPendenciaHierarquica_restGetAll`),
`limit=100` em outras cinco e `limit=1` em uma; `ViewHandler_pt_BR.js` usa timeouts de UI de 2000 e
5000 ms; há `this._myloading.show()/hide()` envolvendo as consultas. Os datasets do ERP usados são
`dsProtheus_getArvoreHierarquica_restGetAll`, `dsProtheus_getPendenciaHierarquica_restGetAll`,
`dsProtheus_getFuncionarioxFuncao_restGetAll`, `dsProtheus_getDepartxFuncionarioxFuncao_restGetAll`,
`dsProtheus_getBranches_restGetAll` e `dsFluig_getQtdFormTarAssumidaMes`.
**Divergências encontradas:** o ticket não estabelece meta de tempo — sem número acordado, o critério
"performance aceitável" **não é auditável**. Recomenda-se fixar o alvo com o cliente antes de usar
este caso como gate.
**Dados/massa usados:** nenhum — leitura de tela e dos fontes servidos ao navegador.

---

## CT-FSWTBC-688  (protheus · Concluído)

**Título:** Verificar que a consulta de gestor por posto devolve sempre a mesma matrícula, correta, em chamadas repetidas

**Origem:** FSWTBC-688 — "[Suporte Fev/2025] Erro na matrícula do gestor na árvore de gestor imediato": para o **mesmo posto (80001860)** a API de gestores retornava ora a matrícula correta, ora vazia, ora a matrícula de **outra pessoa** — não determinismo numa API que decide quem aprova. Ocorreu após a subida em produção; sem apuração das aprovações concedidas à pessoa errada.

**Módulo/Rota:** dataset **`dsProtheus_getArvoreHierarquica_restGetAll`** (usado por **Gestão de Equipes** — `/portal/p/1/gestao_equipes`) e a resolução do **Gestor Imediato** da SC (grade `tbManager`: *Aprovador, Email do Aprovador, Aprovar?*), atividade **Validação do Gestor (7)**; **Tracker** → *Aprovadores SC* (`table-sca`). No ERP: estrutura **RD4** (postos/gestor), **SRA** (matrícula), API REST de gestores do `apiRESTProtheus_CASSI`.

**Pré-condições**
- Posto de teste com titular ativo (o do ticket: **80001860**) e a filial/empresa dele.
- **Bloqueio:** parcial — a conta de QA não monta a árvore; a chamada de leitura ao dataset é possível e foi feita.

**Passos**
1. Chamar **10 vezes seguidas**, em leitura, `GET /api/public/ecm/dataset/search?datasetId=dsProtheus_getArvoreHierarquica_restGetAll&filterFields=CorporateId,01,BranchId,<filial>,ISMANAGER,true,CODESEARCH,<matrícula do gestor>&limit=300` e anotar `RA_MAT`, `RA_NOME`, `RA_POSTO` de cada resposta.
2. Repetir 10× com `ISMANAGER,false,CODESEARCH,<item RD4 do posto 80001860>` e anotar os nós filhos.
3. Abrir **Gestão de Equipes** com um gestor e recarregar 5×; ler o nome exibido no posto 80001860.
4. Criar uma SC (prefixo `QA`) com solicitante subordinado ao posto; ler a grade **Gestor Imediato** (*Aprovador* / *Email do Aprovador*) e o **Responsável** da tarefa *Validação do Gestor*; repetir com uma segunda SC.
5. Tracker → *Aprovadores SC* → filtrar as duas SCs e comparar o aprovador.

**Resultado esperado**
- Passos 1–2: **todas** as respostas idênticas — mesma `RA_MAT`, mesmo `RA_NOME`, nunca vazio.
- Passo 3: sempre o mesmo titular.
- Passos 4–5: as duas SCs apontam o **mesmo** gestor, que é o titular do posto no RD4 — nunca outra pessoa.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Para o posto 80001860, respostas alternando entre a matrícula correta, **vazio** e a matrícula de **outra pessoa**; SCs do mesmo solicitante com aprovadores diferentes.

**Severidade:** Alta *(aprovação/alçada concedida por quem não tem alçada)*

**Preparação de massa:** matrícula do titular e item RD4 do posto 80001860 (RH); duas SCs próprias para o passo 4, criadas por um solicitante subordinado ao posto.

**Verificado em tela:** PARCIAL
**O que foi verificado:** dataset chamado em leitura hoje — `CODESEARCH,80001860` (com e sem `CorporateId/BranchId` e `ISMANAGER,false`) devolveu **4 vezes o mesmo conteúdo**: uma única linha `{"SUBSTITUTO":""}`, **sem `RA_MAT`, sem `RA_NOME`** (~250 ms); o mesmo filtro com o posto existente 80000228 devolve a mesma linha-stub; com `ISMANAGER,true,CODESEARCH,00008161` devolveu 4× o mesmo gestor (`80000228 / 00008161 / A`, ~17 s por chamada). Fontes do widget lidos: filtros e tratamento de posto vago.
**Divergências encontradas:** (1) o posto **80001860 não existe entre os 27 nós de topo** e a consulta por posto devolve uma linha-stub `{"SUBSTITUTO":""}` — o "vazio" do ticket **é reproduzível hoje por dataset**, mas não dá para dizer se é posto inexistente nesta base ou defeito do filtro `ISMANAGER,false` (a mesma stub sai para um posto que existe); (2) não observei o não determinismo em 4 chamadas — o caso pede 10; (3) 17 s por chamada com `ISMANAGER,true` é lento para uma consulta que decide aprovador.
**Dados/massa usados:** nenhum — chamadas `GET` de leitura.

---

## CT-FSWTBC-1790  (ambos · Concluído)

**Título:** Gestor abre a Gestão de Equipes e a tela carrega os dados da sua equipe vindos da hierarquia do Protheus.

**Origem:** FSWTBC-1790 — "Erro no carregamento dos dados na tela de gestor imediato". Família
hierárquica de novo, três meses após a correção RD4 de FSWTBC-341/346; a pendência registrada é que
"a correção RD4 não cobriu todos os pontos".

**Módulo/Rota:** Fluig → Home → *Meus Apps* → aba **Gestão** → **Gestão de Equipes**
(`/portal/p/1/gestao_equipes`).

**Pré-condições**
- Login de **gestor real da CASSI**, com matrícula ativa no Protheus e posto na estrutura hierárquica.
- Subordinados cadastrados sob esse gestor.
- Integração `apiRESTProtheus_CASSI` no ar.
- **Bloqueio:** a conta de QA **não é gestor e não é resolvida no ERP** — a tela responde
  *"Usuário não encontrado no ERP Protheus."*. Executar o caso exige credencial de gestor, que **não
  existe nesta rodada** (§5-C). A conferência da hierarquia do outro lado exigiria o Protheus —
  **sem credencial**; o efeito é ancorado no próprio carregamento da widget.

**Passos**
1. Autenticar no Fluig com um login de **gestor**.
2. Na **Home**, em *Meus Apps*, clicar na aba **Gestão**.
3. Clicar em **Gestão de Equipes**.
4. Aguardar a carga completa da widget.

**Resultado esperado**
- A tela **Gestão de Equipes** carrega e lista os colaboradores subordinados ao gestor autenticado.
- A lista corresponde, um a um, à estrutura hierárquica cadastrada no Protheus para aquele gestor.
- Os campos vindos da API aparecem **preenchidos**, não em branco nem como `-`.
- **Nenhum** modal de erro é exibido.
- Se houver erro, ele é apresentado com o rótulo e o ícone de **erro** — nunca sob um cabeçalho de sucesso.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A tela de gestor imediato não carregava os dados. O ticket não registra a mensagem exata
  (`<não documentado>`); o sintoma descrito é "erro no carregamento dos dados".

**Severidade:** Média *(bloqueia o fluxo do gestor; sem risco financeiro ou de acesso indevido)*

**Preparação de massa:** uma credencial de **gestor** da CASSI com equipe montada na hierarquia do
Protheus. Quem prepara: administrador do Fluig/RH da CASSI. **Este é o item que falta para o caso
sair do PARCIAL** — sem ele o cenário não é executável por ninguém nesta rodada.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri `/portal/p/1/gestao_equipes`. A página carrega com o título
**"Gestão de Equipes"** e exibe imediatamente um modal com o corpo **"Usuário não encontrado no ERP
Protheus."** e botão **OK**; nenhuma equipe é montada. O caminho existe e a widget responde — o que
falta é a conta.
**Divergências encontradas:** duas, ambas de apresentação e ambas **vivas hoje**:
(1) o modal de erro é renderizado sob o cabeçalho **"Sucesso:"** — erro apresentado como sucesso;
(2) o console registra `SweetAlert2: Unknown icon! Expected "success", "error", "warning", "info" or
"question", got "danger"` — a widget passa o ícone **`danger`**, que **não é um valor válido** do
SweetAlert2, e é essa passagem inválida que faz o diálogo cair no título padrão de sucesso. Ou seja,
a divergência (1) tem causa técnica identificada em (2). Registro ainda que
**"Usuário não encontrado no ERP Protheus." NÃO existe nos fontes de formulário baixados** — foi
**visto renderizado**, e pertence a esta widget, não ao formulário da SC.
**Dados/massa usados:** nenhum — não submetido. Somente leitura.

---
