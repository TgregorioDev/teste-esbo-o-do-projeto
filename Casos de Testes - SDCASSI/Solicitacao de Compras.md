<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# Solicitacao de Compras

Casos de teste E2E do Fluig — módulo Solicitacao de Compras.

| | |
|---|---|
| Casos neste arquivo | 106 |
| Verificados em tela | 5 total · 99 parcial · 2 não |

> **Como ler.** Cada caso descreve o comportamento **correto esperado hoje**. A maioria dos
> defeitos de origem já foi corrigida — o caso é de regressão: se reprovar, o defeito voltou.
> Os que reprovam hoje por causa nunca corrigida estão marcados no próprio caso.
> *Verificado em tela* diz o que foi conferido no ambiente de homologação em 08/09/2026;
> **PARCIAL** costuma significar que a conta de QA não tem o perfil necessário (comprador,
> gestor, fiscal, fornecedor), não que o caso seja inválido.

---

## CT-FSWTBC-619  (sem SDCASSI · fluig · Concluído)

**Título:** SC que atinge a alçada gera a tarefa de aprovação para o aprovador nominal da alçada, não para o grupo.

**Origem:** FSWTBC-619 — "[DEM10009641] Erro no processo de alçada caindo para grupo". Reincidência
de FSWTBC-594 um mês depois: a tarefa de alçada era distribuída ao *pool* do grupo em vez do
aprovador resolvido pela hierarquia.

**Módulo/Rota:** Solicitação de Compras (`/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`)
→ seção **Aprovação de Alçada**; acompanhamento em **Central de Tarefas** (`/portal/p/1/pagecentraltask`)
→ aba **Tarefas a concluir**.

**Pré-condições**
- SC válida cujo valor total ultrapasse o limite da primeira alçada configurada.
- Alçada cadastrada no Protheus (tabelas AL/DHL) com aprovador nominal para a filial/valor.
- Solicitante com hierarquia resolvível (gestor imediato cadastrado).
- **Bloqueio:** **sim** — o cadastro de alçada vive no ERP Protheus (AL/DHL) e não há credencial de
  Protheus nesta rodada; além disso o cenário exige **submeter** uma SC até a etapa de alçada, o que
  a política desta rodada evita.

**Passos**
1. Abrir a Solicitação de Compras e preencher **Justificativa para a Solicitação**, filial e itens
   com valor acima do limite de alçada.
2. Percorrer o fluxo até a etapa **Aprovação de Alçada**.
3. Abrir **Central de Tarefas** → aba **Tarefas a concluir** e localizar a solicitação.
4. Ler o campo **Responsável** do cartão da tarefa.

**Resultado esperado**
- O cartão da tarefa mostra em **Responsável** o **nome do aprovador de alçada** (pessoa física).
- A tarefa **não** aparece como pendência de um grupo/pool para todos os membros.
- Os campos de controle da alçada são preenchidos (`docAlcadaGerada`, `numDocAlcada`, `dataMsgAlcada`).

**Resultado se o defeito reincidir**
- A tarefa de alçada cai para o **grupo** — todos os membros a enxergam e ninguém é o responsável
  nominal. Mensagem/valor exatos `<não documentado>` (o ticket não registra texto de erro).

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário da SC contém a seção **Aprovação de Alçada** e, ao lado, as
seções **Validação do Comprador (Definir Negociação)** e **Validação do Comprador (Análise pós Alçadas)**;
existem os campos ocultos `docAlcadaGerada`, `numDocAlcada`, `dataMsgAlcada` e a tabela `tbForneceAlcadas`.
Na Central de Tarefas, cada cartão exibe de fato os rótulos **Identificador** e **Responsável**, e a aba
**Tarefas a concluir** contava **11** tarefas.
**Divergências encontradas:** nenhuma no que foi possível abrir. Não foi possível observar uma tarefa
de alçada real — nenhuma das 11 tarefas a concluir está nessa etapa.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-621  (sem SDCASSI · fluig · Concluído)

**Título:** Concluir uma Solicitação de Compras cria a SC no ERP Protheus e devolve o número ao formulário.

**Origem:** FSWTBC-621 — "[DEM10009641] Correção de processo de solicitação de compras com erro na
criação de solicitação de compras no ERP Protheus". Além do fix de código houve remediação em massa
dos processos já afetados.

**Módulo/Rota:** Solicitação de Compras (`wf_solicitacao_compras`) → seções **Identificação da
Entidade / Solicitação** e **Verificar Retorno Protheus**.

**Pré-condições**
- Usuário de Compras com filial válida e ao menos um produto/serviço no grupo permitido.
- Integração Fluig ↔ Protheus no ar (a criação da SC é síncrona com o ERP).
- **Bloqueio:** **sim, parcial** — comprovar a criação exige **submeter** a solicitação (escrita
  irreversível: SC criada no Protheus não tem exclusão disponível). Nesta rodada só o caminho e os
  campos foram verificados.

**Passos**
1. Abrir `/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`.
2. Preencher **Nome da Filial \***, **Justificativa para a Solicitação \*** e adicionar itens em
   **Produtos/Serviços da Solicitação** (botão **Adicionar Produto**).
3. Enviar a solicitação (**Enviar**) e percorrer o fluxo até a etapa que integra com o ERP.
4. Reabrir o formulário e ler a seção **Identificação da Entidade / Solicitação**.
5. Conferir a seção **Verificar Retorno Protheus**.

**Resultado esperado**
- **Nº da Solicitação ERP \*** (`numSolCompra`) fica preenchido com o número gerado no Protheus.
- **Data de Emissão \*** (`dtEmissaoSolCompra`) fica preenchida.
- A seção **Verificar Retorno Protheus** não acusa pendência; o processo segue para a etapa seguinte.
- Se o Protheus estiver indisponível, o erro é **exibido em tela com a mensagem do ERP** e o processo
  fica em etapa de correção — **nunca** avança com `Nº da Solicitação ERP` vazio.

**Resultado se o defeito reincidir**
- O processo avança (ou trava) sem número de SC no ERP: **Nº da Solicitação ERP** vazio e necessidade
  de correção em massa dos processos afetados. Mensagem exata `<não documentado>`.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a rota abre com título *Cassi - Fluig Plataforma - Movimentar Solicitação*,
heading **Início**, abas *Formulário / Informações / Histórico 0 / Anexos 0 / AdHoc 0 / Apontamentos 0*
e botão **Enviar**. No iframe do formulário (`/webdesk/streamcontrol/256831/...`) estão as seções
*Identificação do Processo / Solicitante*, *Identificação da Entidade / Solicitação*, ... , **Verificar
Retorno Protheus**, e os campos **Nº da Solicitação ERP \*** e **Nº da Cotação ERP \*** — ambos
`readonly` e vazios numa solicitação nova, como esperado. Existem os campos de controle
`atualizaSolCompras`, `cotacaoGerada`, `dataMsgCotacao`, `codERPSolicitante`. Além disso, abrindo em
modo leitura uma SC já existente da própria conta — **112146**, etapa *Validação do Gestor* — o campo
**Nº da Solicitação ERP \*** vem preenchido com **`000052`** e **Data de Emissão \*** com `2026-08-21`,
com **Nome da Filial** `1101 - UNIDADE - CLINICASSI PORTO VELHO - RO`. Ou seja, **o caminho de criação
da SC no Protheus está funcionando hoje** — que é exatamente o que este caso de regressão afirma.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** SC **112146** aberta **somente para leitura** (nenhum botão *Enviar* acionado);
nenhuma solicitação nova submetida.

---

## CT-FSWTBC-622  (sem SDCASSI · fluig · Concluído)

**Título:** Na etapa do gestor orçamentário, os itens da solicitação são carregados e listados na grade.

**Origem:** FSWTBC-622 — "[DEM10009641] Correção de processos de solicitação de compras com erro ao
carregar itens para gestor orçamentário". O carregamento de itens é o ponto mais frequentemente
quebrado da SC (mesma família de 1370, 1907, 1728).

**Módulo/Rota:** Solicitação de Compras → seção **Validação do Item Orçamentário** (grade
`tbItemOrcamentario`, coluna **Item Orçamentário**), a partir de **Central de Tarefas** → **Tarefas a
concluir**.

**Pré-condições**
- SC submetida, com itens em **Produtos/Serviços da Solicitação**, que tenha chegado à etapa
  **Validação Orçamentária** / **Validação do Item Orçamentário**.
- Usuário autenticado como o gestor orçamentário responsável pela tarefa.
- **Bloqueio:** **sim, parcial** — há massa na base (a SC **112096** está em *Validação Orçamentária*),
  mas sob responsabilidade de **outro usuário** (*Erlon Cesar Dengo*); abrir/movimentar tarefa de
  terceiro é vedado nesta rodada.

**Passos**
1. Abrir **Central de Tarefas** e clicar explicitamente na aba **Tarefas a concluir**
   (a sub-aba fica guardada por sessão no servidor — não confie no estado herdado).
2. Localizar a SC na etapa **Validação Orçamentária** e abri-la.
3. Rolar até a seção **Validação do Item Orçamentário**.

**Resultado esperado**
- A grade **Item Orçamentário** lista **todos** os itens da solicitação, um por linha, sem linha em branco.
- Cada item exibe **Nº SC Origem ERP** (`tbitorc_numSolCompra`) preenchido.
- Nenhum erro de script no console e nenhuma mensagem de falha ao montar a grade.
- Itens sem gestor orçamentário definido são tratados explicitamente (campo `itensSemGestOrcament`),
  não descartados em silêncio.

**Resultado se o defeito reincidir**
- Grade do gestor orçamentário vazia ou com erro ao carregar os itens; a etapa não pode ser concluída.
  Mensagem exata `<não documentado>`.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a seção **Validação do Item Orçamentário** e a grade `tbItemOrcamentario`
com a coluna **Item Orçamentário** existem no formulário; existem os campos de apoio
`itensGestOrcamentario`, `itensSemGestOrcament` e `tbitorc_numSolCompra` (**Nº SC Origem ERP \***).
Na Central de Tarefas, aba *Solicitações → Minhas solicitações*, a SC **112096** aparece na etapa
**Validação Orçamentária** (*Sol. Compras - 112096 - CLINICASSI BRASÍLIA EDIFÍCIO BB - DF - 000029*,
responsável *Erlon Cesar Dengo*). Abrindo em modo leitura a SC própria **112146**, a grade
**Item Orçamentário** renderiza corretamente com a sua linha de cabeçalho (*Aprovador \**,
*Email do Aprovador \**, *Data da Aprovação \**, …) e sem itens — coerente, porque a instância ainda
está em *Validação do Gestor* e não chegou à etapa orçamentária. Não houve erro ao montar a grade.
**Divergências encontradas:** o rótulo da **etapa** na Central de Tarefas é *"Validação Orçamentária"*,
enquanto a **seção do formulário** se chama *"Validação do Item Orçamentário"* — nomes diferentes para
o mesmo momento do fluxo.
**Dados/massa usados:** SC **112146** (própria) aberta **somente para leitura**; a SC 112096, de
terceiro, **não** foi aberta nem movimentada.

---

## CT-FSWTBC-623  (sem SDCASSI · fluig · Concluído)

**Título:** Abrir uma solicitação de compras antiga (versão anterior do formulário) exibe os itens do gestor orçamentário sem erro.

**Origem:** FSWTBC-623 — "[DEM10009641] Correção dos processo de compras antigos onde são gerados erro
na exibição dos items Gestor Orçamentario". Processos legados incompatíveis com a nova versão do
formulário — dívida de versionamento de formulário no Fluig.

**Módulo/Rota:** Central de Tarefas → **Solicitações** → instância antiga de *SOLICITAÇÃO DE COMPRAS*
→ aba **Formulário** → seção **Validação do Item Orçamentário**.

**Pré-condições**
- Instância de SC **criada antes** da versão corrente do formulário e ainda aberta.
- Conhecer a versão do formulário da instância (o portal transporta `metadata#version` nas consultas
  de dataset do formulário).
- **Bloqueio:** **sim, parcial** — identificar com segurança uma instância "de versão anterior" exige
  comparar a versão do formulário de cada instância, o que não é exposto na tela; e as instâncias
  antigas visíveis pertencem a terceiros.

**Passos**
1. Abrir **Central de Tarefas** → aba **Solicitações** → **Minhas solicitações**.
2. Ordenar/filtrar pelas solicitações mais antigas ainda abertas.
3. Abrir uma instância anterior à versão corrente do formulário.
4. Ir à seção **Validação do Item Orçamentário** e à seção **Produtos/Serviços da Solicitação**.

**Resultado esperado**
- O formulário renderiza sem erro de script, mesmo na versão antiga.
- A grade **Item Orçamentário** lista os itens da instância (nenhuma linha perdida na migração).
- A grade **Produtos/Serviços da Solicitação** (`tbProdutos`) mostra os mesmos itens da criação.

**Resultado se o defeito reincidir**
- Erro na exibição dos itens do Gestor Orçamentário em processos antigos, exigindo correção manual
  processo a processo. Mensagem exata `<não documentado>`.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário da SC é versionado — na carga da tela o portal consulta
`ds_getFormDistribuicaoAreas` com `metadata#id=343039` e **`metadata#version=49000`**, o que confirma
que instâncias carregam a versão do formulário com que nasceram. As seções e grades citadas existem.
**Divergências encontradas:** a versão do formulário **não é exibida na tela** para o usuário — só
aparece nas chamadas de dataset. Sem isso, o analista não consegue separar "instância antiga" de
"instância nova" pela interface.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-624  (sem SDCASSI · fluig · Concluído)

**Título:** Criar uma Solicitação de Compras no ambiente de QA conclui sem erro de integração.

**Origem:** FSWTBC-624 — "[DEM10009641] Analise de erro na criação de SC no ambiente QA".
Investigação sem conclusão registrada no ticket.

**Módulo/Rota:** Solicitação de Compras (`wf_solicitacao_compras`), no ambiente de QA/homologação.

**Pré-condições**
- Ambiente de QA com integração ao Protheus de homologação ativa.
- Conta de Compras com filial e grupo de produto válidos no ERP de QA.
- **Bloqueio:** **sim** — o caso só se fecha **submetendo** a criação da SC; nesta rodada não se
  submete. Some-se que a análise original não registrou nem a mensagem de erro nem a causa, então o
  "resultado se reincidir" não pode citar texto exato.

**Passos**
1. No ambiente de QA, abrir a Solicitação de Compras.
2. Preencher **Nome da Filial \***, **Justificativa para a Solicitação \*** e adicionar ao menos um item.
3. Clicar em **Enviar** e acompanhar a instância pela **Central de Tarefas**.
4. Conferir **Nº da Solicitação ERP \*** e a seção **Verificar Retorno Protheus**.

**Resultado esperado**
- A criação conclui e a instância aparece na Central de Tarefas com etapa e responsável definidos.
- **Nº da Solicitação ERP** preenchido; nenhuma mensagem de erro de integração.
- Falha de integração, se houver, é exibida ao usuário com a mensagem do ERP — não silenciosa.

**Resultado se o defeito reincidir**
- Criação de SC falha especificamente no ambiente de QA. Mensagem exata `<não documentado>` —
  o ticket não guarda evidência nem conclusão.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o caminho de criação abre e o formulário carrega íntegro no ambiente
disponível (que é a base de homologação da Cassi): campos de identificação preenchidos
automaticamente — **Solicitante \*** = *Usuário TBC (TOTVS)*, **Email do Solicitante \*** =
`fabricasoftware@totvs.com.br`, **Data da Solicitação \*** = `2026-09-04`, **Hora da Solicitação \***
preenchida. Na carga, os datasets `ds_protheus_getMatriculaTitular_rest`,
`dsFluig_getProcReqComprasReprovadoSql` (`matriculaSolicitante=TOTVS-FS`, `STATUS=2`),
`ds_getFormDistribuicaoAreas` e `dsProtheus_getGrupoDeProduto_restGetAll` (`BM_GRUPO=3030`)
responderam **200**.
**Divergências encontradas:** o ticket fala em "ambiente QA" como ambiente distinto; o ambiente
acessível nesta rodada é a base de homologação da Cassi. Não é possível afirmar que seja o mesmo.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-625  (sem SDCASSI · fluig · Concluído)

**Título:** A etapa "Validação do Gestor" da SC é atribuída ao gestor imediato do solicitante, nominalmente.

**Origem:** FSWTBC-625 — "[DEM10009641] Atividade Gestor imediato caindo para o grupo e nao para o
gestor". Núcleo do problema de atribuição: quando a hierarquia não resolve, o Fluig cai para o pool
(mesma família de 594, 607, 619).

**Módulo/Rota:** Solicitação de Compras → seção **Validação do Gestor** (grade `tbManager`, coluna
**Gestor Imediato**); acompanhamento em **Central de Tarefas** → **Tarefas a concluir**.

**Pré-condições**
- Solicitante com **gestor imediato cadastrado** e resolvível pela hierarquia (Fluig + ERP).
- SC submetida que tenha alcançado a etapa **Validação do Gestor**.
- **Bloqueio:** **sim, parcial** — provar o caso negativo (solicitante *sem* hierarquia resolvível,
  que é quando o defeito aparecia) exigiria alterar cadastro de RH/ERP, fora de alcance.

**Passos**
1. Abrir **Central de Tarefas** e clicar na aba **Tarefas a concluir**.
2. Localizar a solicitação na etapa **Validação do Gestor**.
3. Ler o campo **Responsável** do cartão.
4. Abrir a solicitação e conferir a grade **Gestor Imediato** na seção **Validação do Gestor**.

**Resultado esperado**
- O **Responsável** da tarefa é uma **pessoa** — o gestor imediato do solicitante — e não um grupo.
- A grade **Gestor Imediato** (`tbManager`) traz o gestor resolvido, com **Nº SC Origem ERP**
  (`tbmanag_numSolCompra`) preenchido.
- Quando a hierarquia **não** resolve, o comportamento correto é falhar visivelmente (erro/instrução ao
  usuário), não redirecionar silenciosamente ao pool do grupo.

**Resultado se o defeito reincidir**
- A atividade do gestor imediato cai para o **grupo**: o cartão não nomeia responsável e qualquer
  membro do grupo pode assumir. Mensagem exata `<não documentado>`.

**Verificado em tela:** PARCIAL
**O que foi verificado:** na aba **Tarefas a concluir** (11 tarefas) há **duas SCs na etapa
"Validação do Gestor"** — **112146** e **112171**, ambas *Sol. Compras - UNIDADE - CLINICASSI PORTO
VELHO - RO* — e em ambas o campo **Responsável** traz uma pessoa nomeada (*Usuário TBC (TOTVS)*),
não um grupo. Isso é consistente com o defeito corrigido. No formulário existem a seção **Validação
do Gestor**, a grade `tbManager` com a coluna **Gestor Imediato** e os campos `managerAprovadoValidacao`
e `tbmanag_numSolCompra`. Abrindo **112146** em modo leitura (cabeçalho *112146 - Validação do Gestor*,
abas *Formulário / Informações / Histórico 7 / Anexos 0*), a seção **Validação do Gestor** renderiza a
grade **Gestor Imediato** com os campos **Aprovador \***, **Email do Aprovador \***, **Data da Aprovação \***,
**Hora da Aprovação \***, **Aprovar? \*** (*Sim* / *Não*) e **Justificativa para a Aprovação/Reprovação \***.
O aprovador vem **nominal** — `tbmanag_nomeRespValid___1` = *Usuário TBC (TOTVS)*,
`tbmanag_emailRespValid___1` = `fabricasoftware@totvs.com.br` —, não um grupo.
**Divergências encontradas:** nas duas instâncias observadas o **Responsável** é o próprio solicitante
(*Usuário TBC (TOTVS)* solicitou e é o responsável pela Validação do Gestor). Isso é esperado se a
conta de QA for seu próprio gestor no cadastro, mas **não** comprova que a resolução de hierarquia
funciona para um solicitante com gestor distinto — a prova completa exige outra massa.
Observado também que **Data da Aprovação** e **Hora da Aprovação** nascem preenchidas com o instante da
abertura do formulário (`2026-09-04`, `09:40:25`), e não com a data de uma aprovação real — atenção ao
escrever a assertion sobre esses campos.
**Dados/massa usados:** SC **112146** aberta **somente para leitura**; cartões 112146 e 112171 lidos na
Central de Tarefas. Nenhuma tarefa movimentada, nenhum *Enviar* acionado.

---

## CT-FSWTBC-626  (sem SDCASSI · fluig · Concluído)

**Título:** Solicitações abertas antes da correção da hierarquia do gestor orçamentário seguem o fluxo com o responsável correto.

**Origem:** FSWTBC-626 — "[DEM10009641] Correção de processos de versao anterior a correção do gestor
orçamentario". Remediação das instâncias que já rodavam com hierarquia errada — confirma que houve
processos em produção com atribuição incorreta.

**Módulo/Rota:** Central de Tarefas → **Solicitações** → instâncias de *SOLICITAÇÃO DE COMPRAS*
anteriores ao fix → seções **Validação do Gestor** e **Validação do Item Orçamentário**.

**Pré-condições**
- Instâncias de SC abertas **antes** da correção da resolução de gestor orçamentário e ainda em curso.
- Lista das instâncias remediadas (o ticket não a registra).
- **Bloqueio:** **sim** — não há, na tela, como identificar quais instâncias são "anteriores à
  correção"; e a data do fix não está registrada no ticket. Sem essa lista o caso não é executável
  com precisão.

**Passos**
1. Abrir **Central de Tarefas** → **Solicitações** → **Tarefas sob minha gerência**.
2. Selecionar uma SC anterior à data da correção que ainda esteja em curso.
3. Conferir o **Responsável** da etapa corrente e a grade **Gestor Imediato**.
4. Avançar (em ambiente de teste) para a etapa seguinte e reconferir o responsável.

**Resultado esperado**
- Instâncias antigas apontam para o **responsável correto** após a remediação, igual às novas.
- Nenhuma instância permanece com o responsável antigo/errado ou parada sem responsável.
- A grade do gestor orçamentário carrega os itens normalmente também nas instâncias antigas.

**Resultado se o defeito reincidir**
- Instâncias antigas continuam roteando para o responsável errado (ou para o grupo), exigindo
  correção manual uma a uma. Mensagem exata `<não documentado>`.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a Central de Tarefas expõe a aba **Solicitações 121**, subdividida em
**Minhas solicitações 34** e **Tarefas sob minha gerência 87** — ou seja, existe o ponto de entrada
para auditar instâncias em curso. As seções **Validação do Gestor** e **Validação do Item
Orçamentário** existem no formulário.
**Divergências encontradas:** a tela não informa a versão do formulário nem a data de correção, então
não há critério visível para separar "instância anterior à correção". Registrar essa lista é
pré-requisito para o caso ser executável.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-627  (sem SDCASSI · fluig · Concluído)

**Título:** O rateio por centro de custo de uma solicitação lista todos os centros de custo informados.

**Origem:** FSWTBC-627 — "[DEM10009641] Correção de processo 1593 com erro na listagem dos rateios de
centro de custo". Caso individual (processo 1593), sem generalização registrada; rateio é ponto
sensível para a contabilização.

**Módulo/Rota:** Solicitação de Compras → seção **Rateio por Centro de Custo** (botões **Download
Planilha de Rateio Modelo** e **Upload Planilha de Rateio Preenchida**).

**Pré-condições**
- SC com ao menos um item em **Produtos/Serviços da Solicitação**.
- Planilha de rateio preenchida com **dois ou mais** centros de custo somando 100%.
- **Bloqueio:** **não** para inspecionar a seção; **sim, parcial** para provar a listagem — depende de
  fazer o upload da planilha, o que altera o formulário da instância. Não executado nesta rodada.

**Passos**
1. Abrir a Solicitação de Compras e adicionar um item em **Produtos/Serviços da Solicitação**.
2. Na seção **Rateio por Centro de Custo**, clicar em **Download Planilha de Rateio Modelo**.
3. Preencher a planilha com dois ou mais centros de custo (percentuais somando 100%).
4. Clicar em **Upload Planilha de Rateio Preenchida** e selecionar o arquivo.
5. Conferir a grade de rateio exibida na seção.

**Resultado esperado**
- A grade lista **todos** os centros de custo da planilha, um por linha, com percentual e valor.
- A soma dos percentuais é 100% e o valor rateado bate com o total do item.
- Os dados persistem na estrutura de rateio da solicitação (`tbprod_jsonrateio` / `table_rateioItens`)
  e continuam visíveis ao reabrir a instância.

**Resultado se o defeito reincidir**
- Erro na listagem dos rateios de centro de custo: a grade não exibe (ou exibe parcialmente) os
  centros de custo informados. Mensagem exata `<não documentado>`.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a seção **Rateio por Centro de Custo** existe no formulário da SC, com os
botões **Download Planilha de Rateio Modelo** e **Upload Planilha de Rateio Preenchida**, e os campos
de estrutura `tbprod_jsonrateio` e `table_rateioItens`. **E o cenário foi observado com dado real:** abrindo a SC
própria **112146** em modo leitura, a seção aparece como **"Rateio por Centro de Custo - Item 0001"**,
com a grade de colunas **#**, **Item**, **Rateio %**, **C. Custo**, **Classe Valor** e a linha
`1 | 0001 | 100 | 0311 - CLINICASSI RECIFE - AFLITOS - PE | AS00 - PLANOS DE ASSOCIADOS`. A listagem do
rateio, portanto, **funciona hoje** — que é o que este caso de regressão afirma. O item rateado é
coerente com a grade de produtos (*0001 — 00000003 - AR CONDICIONADO DE JANELA*, quantidade
`111,111111`, preço unitário `1.221,221212`, total `135.691,25`).
**Divergências encontradas:** o rateio nesta tela é alimentado por **planilha** (download/upload), não
por digitação linha a linha — o ticket fala em "listagem dos rateios" sem dizer por qual via. Além
disso, é comportamento já conhecido do ambiente que o campo de percentual **limita silenciosamente**
(digitar `110` vira `100` no blur), então o cenário "rateio acima de 100%" não é alcançável.
**Dados/massa usados:** SC **112146** aberta **somente para leitura**. Nada submetido, nenhum upload feito.

---

## CT-FSWTBC-631  (FSWTBC-631 · ambos · Concluído)

**Título:** Enviar uma negociação de cotação ao Protheus e confirmar que a integração conclui sem erro e sem deixar o processo preso.

**Origem:** FSWTBC-631 — erro no processo de negociação durante a integração. Mesma data do erro 404
relatado em FSWTBC-186; provavelmente o mesmo incidente registrado por outro canal.

**Módulo/Rota:** Fluig → **Processos** → *Iniciar Solicitações* → categoria **Compras** →
**Negociação de Cotação de Produtos e Serviços** (`wf_negociacao_cotacao_prod_serv`).
Acompanhamento: **Portal do Comprador** → *Controle De Cotações* (`/portal/p/1/portal-do-comprador#/controleCotacao`).

**Pré-condições**
- Cotação existente no Protheus, **ainda válida**, vinculada a uma SC (Nº da SC do ERP) e a um comprador.
- Fornecedor com proposta enviada, habilitando a rodada de negociação.
- Endpoint REST do Protheus no ar.
- **Bloqueio:** a confirmação de que a negociação gravou no ERP exige acesso ao Protheus — **sem
  credencial**. Âncoras no Fluig: o campo **"Erro retornado pelo ERP Protheus"** do próprio formulário
  e o **Histórico** da solicitação. Massa: **não há cotação disponível** para a conta de QA hoje
  (ver "O que foi verificado").

**Passos**
1. Acessar **Processos → Iniciar Solicitações → Negociação de Cotação de Produtos e Serviços**.
2. Na aba **Formulário**, conferir a seção *Identificação do(s) Produto(s)/Serviço(s)*: **Nº da Cotação**,
   **Nº da SC do Fluig**, **Nº da SC do ERP**, **Código da Filial**, **Nome da Filial**, **Comprador**,
   **Validade da Cotação**, **Validade da Proposta**, **Tipo de Frete**.
3. Conferir a *Lista de Produtos/Serviços* e os totalizadores **Sub Total**, **Valor total do IPI**,
   **Valor total do Frete**, **Valor total de Descontos**, **Valor total do Pedido**.
4. Na seção *Validação de Proposta*, marcar **Proposta Validada? = Sim** e preencher a **Justificativa**.
5. Movimentar o processo com **Enviar**, disparando a integração com o ERP.
6. Abrir a aba **Histórico** da solicitação e, em seguida, o campo **Erro retornado pelo ERP Protheus**.

**Resultado esperado**
- A integração conclui e o **Histórico** registra a atividade de serviço com *"Integração executada com sucesso"*.
- O campo **Erro retornado pelo ERP Protheus** permanece **vazio**.
- O processo avança para a etapa seguinte, sem ficar parado na atividade de integração.
- A negociação passa a ser visível no **Portal do Comprador → Controle De Cotações**, com o
  **Nº da Cotação ERP** correspondente.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro durante a integração da negociação; no ticket correlato (FSWTBC-186) o sintoma é
  **HTTP 404** na chamada ao Protheus, com o processo interrompido na atividade de integração.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o processo **Negociação de Cotação de Produtos e Serviços**
(`wf_negociacao_cotacao_prod_serv`) existe na categoria **Compras** e **abre** para este perfil. O
formulário *Negociação de Cotação de Produtos/Serviços* carrega inteiro, com as seções e rótulos:
*Identificação do Processo / Solicitante*; *Informações do Fornecedor* (CNPJ/CPF, Razão social, Nome
Fantasia); *Endereço*; *Contatos*; *Identificação do(s) Produto(s)/Serviço(s)* com **Nº da Cotação**,
**Nº da SC do Fluig**, **Nº da SC do ERP**, Código/Nome da Filial, Comprador, E-mail do Comprador,
Validade da Cotação, Validade da Proposta, **Tipo de Frete** (CIF/FOB/Sem Frete); *Lista de
Produtos/Serviços* com colunas **Item, Código, Descrição, Qtde., Un. Med., Código do Grupo, Grupo do
Produto/Serviço, Dt. Prev. Entrega, Fil. Entrega, Valor Unit., Desconto, Aliq. IPI, Valor Total, Valor
Frete, Observação do fornecedor**; totalizadores; *Validação de Proposta* com **Proposta Validada?
(Sim/Não)** e **Justificativa**; e — o achado mais útil para este caso — os campos **"Enviar para o
fornecedor? (Sim/Não)"** e **"Erro retornado pelo ERP Protheus *"**, que dão ao Fluig um oráculo
próprio para falha de integração. O formulário exibe ainda a nota fixa **"A aprovação da negociação
deve ser realizada pelo Protheus."**. No **Portal do Comprador**, *Controle De Cotações* abre na rota
`#/controleCotacao` com botão **Filtrar** e retorna **"Página 1 de 0 / Nenhum dado encontrado"**.
**Divergências encontradas:** nenhuma quanto ao caminho. Registro de massa: o dataset
`dsProtheus_getCompradores_restGetAll` é chamado com `Y1_USER = "undefined"` para a conta TOTVS-FS —
ou seja, a conta de QA **não resolve matrícula de comprador**, o que explica a lista vazia e impede
executar o caso com este login.
**Dados/massa usados:** nenhum — não submetido. Somente leitura.

---

## CT-FSWTBC-642  (fluig · Concluído)

**Título:** SC atinge a alçada com o REST do Protheus indisponível e o processo trava em vez de gerar alçada sem documento no ERP.

**Origem:** FSWTBC-642 — "[DEM10009641] Erro de geração de Alçada quando tem queda no REST do
Protheus". Correção estrutural da família de alçada: **trava impedindo movimentar o processo sem que
exista documento no ERP** — falhar fechado em vez de seguir inconsistente. Responde a FSWTBC-591
(alçada sem documento) e FSWTBC-598 (instabilidade do REST).

**Módulo/Rota:** *Solicitação de Compras*
(`/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`, iframe `256831`) → etapa
**Aprovação de Alçadas** (seq 94). Superfícies de leitura: aba **Histórico** da solicitação e o modal
**Informações Complementares do Contrato** (campos *Status da Integração GCT* e *Erro de Integração*).

**Pré-condições**
- SC válida cujo valor total ultrapasse o limite da primeira alçada.
- REST do Protheus indisponível no momento da movimentação (queda real ou janela de indisponibilidade).
- **Bloqueio:** **sim** — (a) provocar a queda do REST do Protheus do cliente **não é permitido**;
  (b) o cadastro de alçada vive no ERP (AL/DHL) e não há credencial de Protheus; (c) o cenário exige
  **submeter** uma SC até a alçada. O caso é escrito para execução em janela de indisponibilidade
  observada, não provocada.

**Passos**
1. Confirmar a indisponibilidade do ERP: o `/ping/` do `apiRESTProtheus_CASSI` falha ou os datasets
   `dsProtheus_*` retornam vazio.
2. Levar uma SC até a etapa **Aprovação de Alçadas**.
3. Tentar movimentar a etapa de alçada.
4. Ler a mensagem em tela.
5. Abrir a aba **Histórico** da solicitação e ler os lançamentos da atividade de serviço.
6. Depois do restabelecimento do ERP, conferir se o processo retoma e se o número do documento de
   alçada é gravado.

**Resultado esperado**
- A movimentação é **recusada**: sem documento correspondente no ERP, o processo **não avança**.
- O Histórico registra a falha com texto completo, no padrão observado hoje:
  `Falha ao executar evento de serviço. Processo: <processo> - Atividade: <seq> - Tentativa: <n> - Erro <exceção> - Tempo de Execução <n> s. Nova tentativa em <dd/MM hh:mm>`.
- Há **até 3 tentativas**; persistindo a falha, a solicitação vai para a atividade de tratamento
  (**Correção**) e fica visível ao responsável — não fica perdida nem "aprovada".
- **Nenhuma** alçada é registrada sem documento no ERP: os campos de controle da alçada
  (`docAlcadaGerada`, `numDocAlcada`, `dataMsgAlcada`) e a grade `tbalcada_*` permanecem vazios.
- Restabelecido o ERP, a nova tentativa conclui e o Histórico registra o sucesso da integração.

**Resultado se o defeito reincidir**
- Com o REST fora, a alçada é **gerada assim mesmo** no Fluig, sem documento correspondente no
  Protheus, e o processo segue — deixando SC aprovada por alçada que não existe no ERP.
  Mensagem exata `<não documentado>`.

**Severidade:** Alta *(aprovação/alçada sem lastro no ERP; risco de compra aprovada indevidamente)*

**Preparação de massa:** SC própria com valor acima do limite da primeira alçada e alçada cadastrada
no Protheus para a filial/valor (cadastro AL/DHL — **fora do alcance do executor**). A execução
depende de uma janela real de indisponibilidade do REST; o histórico documentado do ambiente registra
quedas em 31/08, 01/09 e 03/09/2026.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário da SC (iframe `256831`) contém o bloco de alçada — campos
ocultos `authorityVlrTotItens`, `authorityVlrTotFrete`, `authorityVlrTotCompra`,
`authorityVlrContratoOriginal`, `authorityVlrTotalComAditivo` e a grade
`tbalcada_nomResponsavel / emailResponsavel / dataValidacao / horaValidacao / statusValidacao /
justificativa`, além de `tbfornalc_*`. O comportamento "falhar fechado com 3 tentativas" foi
**observado vivo** na solicitação 113196: três tentativas registradas no Histórico (09:42, 09:51 e
10:01 de 03/09/2026, com *Tempo de Execução* 65 s, 66 s e 70 s) e, ao fim,
*"Grava SC e Anexos movimentou a atividade Grava SC e Anexos para a atividade Correção"* — isto é, a
solicitação **não avançou** e ficou visível na Correção. O modal *Informações Complementares do
Contrato* foi aberto e expõe **Status da Integração GCT** e **Erro de Integração** no grupo
*Processos, Cotações e Integração*.
**Divergências encontradas:** a superfície citada no ticket ("geração de alçada") não tem tela
própria: o que existe é a etapa **Aprovação de Alçadas** dentro da SC e os campos ocultos acima. O
erro real observado hoje na atividade 233 é `java.lang.Exception: Cannot convert NaN to
java.lang.Integer (servicetask233#267)` — falha de integração da SC **não** relacionada a este ticket,
mas que serve de prova de que a trava e o texto de erro funcionam.
**Dados/massa usados:** solicitação 113196 (própria), leitura do Histórico. Nenhuma escrita.

---

## CT-FSWTBC-655  (fluig · Concluído)

**Título:** Gestor orçamentário abre a SC na Validação Orçamentária e vê os detalhes completos de cada item, com o rateio por centro de custo.

**Origem:** FSWTBC-655 — "Erro nos detalhes dos itens da validação orçamentária". Aberto em
19/03/2025 e fechado no mutirão de 16/10 — **211 dias sem tratativa registrada**, sem descrição no
ticket. Caso escrito como **caracterização de caminho**.

**Módulo/Rota:** *Solicitação de Compras* (iframe `256831`) → seção **Validação do Item Orçamentário**
(grade `tbItemOrcamentario`), sobre a grade de itens **Produtos/Serviços da Solicitação**
(`tbProdutos`) e o bloco **Rateio por Centro de Custo - Item NNNN**. A etapa aparece como
**Validação Orçamentária** (seq 14) na Central de Tarefas.

**Pré-condições**
- SC criada e aprovada pelo gestor imediato, parada na etapa **Validação Orçamentária**.
- SC com **mais de um item** e ao menos um item com **rateio em dois ou mais centros de custo**
  (é onde o detalhe costuma quebrar).
- Executor no papel de gestor orçamentário da filial da SC.
- **Bloqueio:** parcial — não há, hoje, SC própria parada em *Validação Orçamentária*; as 11 tarefas
  desta conta estão em *Validação do Gestor*, *Correção* e *Acompanhamento Status*. Chegar a essa
  etapa exige **submeter** uma SC e movimentá-la.

**Passos**
1. Abrir a SC pela **Central de Tarefas → Tarefas a concluir**, etapa **Validação Orçamentária**.
2. Na grade **Produtos/Serviços da Solicitação**, conferir, item a item, as colunas: **Item**,
   **Produto/Serviço**, **Unidade de Medida**, **Conta Desp ADM**, **Conta Desp BAS**,
   **Conta Imobilizado**, **Grupo do Produto/Serviço**, **Data de Emissão**, **Data de Necessidade**,
   **Quantidade**, **Média Histórica**, **Preço Unit. Estimado**, **Vlr. Total Estimado** e
   **Observação**.
3. Conferir o bloco **Rateio por Centro de Custo - Item 0001** e suas colunas **#**, **Item**,
   **Rateio %**, **C. Custo**, **Classe Valor**.
4. Repetir para o segundo item e conferir que o rateio exibido é o **do item correspondente**.
5. Conferir a seção **Validação do Item Orçamentário** (Responsável, Email, Data, Hora, Vlr. Total
   Estimado do item, Aprovar?, Justificativa).
6. Comparar os valores exibidos com os do payload da SC (aba Histórico/Informações ou o registro no ERP).

**Resultado esperado**
- **Todos** os itens da SC aparecem na grade, cada um com todas as colunas preenchidas — nenhum item
  some e nenhuma coluna fica em branco por erro de montagem.
- O bloco de rateio é exibido **por item**, com o cabeçalho identificando o item
  (**Rateio por Centro de Custo - Item NNNN**), e o somatório de **Rateio %** de cada item é 100.
- **Vlr. Total Estimado** de cada item é coerente com **Quantidade × Preço Unit. Estimado**, e itens
  com quantidades diferentes **não** compartilham o mesmo total.
- A seção **Validação do Item Orçamentário** traz o responsável e permite **Aprovar? Sim/Não** com
  justificativa.
- Nenhum erro de console nem grade vazia ao abrir os detalhes.

**Resultado se o defeito reincidir**
- Os detalhes dos itens na Validação Orçamentária vêm errados: item faltando, coluna vazia, rateio de
  outro item ou valor incoerente. Mensagem exata `<não documentado>` — o ticket não tem descrição.

**Severidade:** Média *(o gestor orçamentário decide sobre dado errado; vira risco financeiro se o
valor exibido divergir do solicitado)*

**Preparação de massa:** uma SC criada pelo próprio executor, com **dois itens** e rateio em **dois
centros de custo** em pelo menos um deles, aprovada pelo gestor imediato e parada em *Validação
Orçamentária*. Observação de campo: o rateio é alimentado por **planilha** (*Download Planilha de
Rateio Modelo* / *Upload Planilha de Rateio Preenchida*), não por digitação linha a linha.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a solicitação **113196** (própria, etapa *Correção*) foi aberta em leitura e
o formulário exibe a seção **Validação do Item Orçamentário** (grade `tbItemOrcamentario`) logo após
**Validação do Gestor** (`tbManager`) e antes de **Validação do Comprador**. A grade de itens
`tbProdutos` foi conferida com todos os rótulos citados nos passos, com valores reais
(`0001` · `02000777 - PAPEL A4 BRANCO` · `PA` · contas `463919011006` / `441319019091` ·
`4040 - MATERIAIS DE EXPEDIENTE` · emissão `03/09/2026` · necessidade `03/10/2026` · quantidade
`10,00` · média histórica `0` · preço `25,00` · total `250,00`). O bloco
**Rateio por Centro de Custo - Item 0001** aparece com as colunas **# | Item | Rateio % | C. Custo |
Classe Valor** e a linha `1 | 0001 | 100 | 9420 - GERÊNCIA DE APOIO CORPORATIVO | AD00 -
ADMINISTRATIVO`. No formulário em branco, os campos do bloco orçamentário existem como
`tbitorc_responsavelValid`, `tbitorc_emailRespValid`, `tbitorc_dataValid`, `tbitorc_horaValid`,
`tbitorc_vlrTotEstItem`, `tbitorc_aprovadoValid` e `tbitorc_justificativa`.
**Divergências encontradas:** o rótulo diverge entre telas — a etapa se chama **Validação
Orçamentária** na Central de Tarefas e a seção do formulário se chama **Validação do Item
Orçamentário**. A SC observada tem **um único item** e rateio de 100% em um centro de custo, então o
cenário multi-item/multi-rateio **não foi exercitado**.
**Dados/massa usados:** solicitação 113196 (própria), aberta em leitura. Nenhuma escrita.

---

## CT-FSWTBC-694  (fluig · Concluído)

**Título:** Ao concluir a Solicitação de Compras, os subprocessos de Cotação e de Negociação nascem a partir dela.

**Origem:** FSWTBC-694 — "[Suporte Fev/2025 - DEM10009644] - Erro no start de processo no projeto
do compras: cotação e negociação não são criadas". Mesma falha da subtarefa 708. Fechado em 2 dias
sem registro de causa.

**Módulo/Rota:** *Solicitação de Compras* (`wf_solicitacao_compras`, formulário `256831`) →
atividades **20/177/287 Integração ERP**, **328 Aguarda Geração de Cotação**, **33 Processo
Cotação** e **50 Processo Negociação**. Verificação cruzada no **Tracker - Processos Compras/
Contratos** (`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`).

**Pré-condições**
- SC válida, com filial, justificativa e ao menos um item de produto/serviço, levada até a
  **Integração ERP** (o subprocesso de cotação é spawnado depois da integração, não no envio).
- Integração Fluig ↔ Protheus no ar.
- **Bloqueio:** **parcial.** Comprovar o nascimento dos subprocessos exige **submeter uma SC e
  percorrê-la até a integração** — escrita irreversível (SC criada no Protheus não tem exclusão
  disponível) e etapas designadas a aprovadores nominais (Orçamentária/Alçada, tabelas AL/DHL do
  Protheus), fora do alcance da conta de QA. Verificados o caminho, os campos e o estado vivo dos
  subprocessos, sem submeter.

**Passos**
1. Abrir `/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`, preencher
   **Nome da Filial \***, **Justificativa para a Solicitação \*** e ao menos um item em
   **Produtos/Serviços da Solicitação**; clicar em **Enviar**. Anotar o nº da solicitação.
2. Percorrer o fluxo até a **Integração ERP** (Validação do Gestor → Validação Orçamentária →
   Integração ERP → Distribuição de Comprador → Gerência de Compras → Validação do Comprador).
3. Abrir o **Tracker**, filtrar por **Nº do Processo Fluig** com o número anotado e ler as colunas
   **Nº da Solicitação ERP** e **Nº da Cotação ERP**.
4. Em **Processos → Consultar Solicitações**, procurar as instâncias de *Cotação de Produtos e
   Serviços* e de *Negociação de Cotação de Produtos e Serviços* ligadas à SC.
5. Abrir a SC e ler a aba **Histórico**.

**Resultado esperado**
- Concluída a integração, a SC recebe **Nº da Solicitação ERP** preenchido no Tracker.
- Uma instância de **Cotação de Produtos e Serviços** é criada e vinculada à SC; o Tracker passa a
  exibir o **Nº da Cotação ERP**.
- Encerrada a cotação, a instância de **Negociação de Cotação de Produtos e Serviços** nasce por
  sua vez (atividade **50 Processo Negociação** da SC).
- A SC **não** fica parada em *328 Aguarda Geração de Cotação* nem em *161 Aguarda Fim de Cotação*.
- O **Histórico** registra a integração executada com sucesso (padrão do ambiente:
  *"Integração executada com sucesso - Tempo de Execução N s"*).

**Resultado se o defeito reincidir**
- A SC é enviada mas os subprocessos **não nascem**: nenhuma cotação e nenhuma negociação
  vinculadas; a SC fica parada na etapa de espera. Mensagem exata `<não documentado>` — o ticket
  não registra o texto do erro.

**Severidade:** Alta *(sem cotação não há concorrência de preço; a compra ou trava ou segue por dispensa indevida)*

**Preparação de massa:** uma SC de homologação levada até a Integração ERP pelo próprio executor,
com aprovador orçamentário disponível — ou a liberação de um usuário de QA como aprovador nominal
(cadastro AL + faixa DHL no Protheus, ou registro como substituto do aprovador). Sem isso o caso
morre na Validação Orçamentária.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o mapa de atividades da SC foi lido do formulário publicado e contém a
cadeia completa `integracaoERP: 20 · aguardaGeraCotacao: 328 · processoCotacao: 33 ·
aguardaFimCotacao: 161 · processoNegociacao: 50 · aguardaFimNegociacao: 172 · integracaoERP2: 177`.
O **Tracker** abre (título *Cassi - Fluig Plataforma - Tracker - Processos Compras/ Contratos*)
com os filtros **Nº do Processo Fluig**, **Solicitante**, **Status**, **Data da Solicitação
(De)/(Até)**, **Nº da Solicitação ERP**, **Nº da Cotação ERP**, **Dispensa Cotação**, **Tipo de
Solicitação** e **Número do Contrato**, e botões **Pesquisar Registro** / **Limpar** — é a
superfície de cruzamento SC × Cotação. Estado vivo: **cotações** existem e recentes
(`wf_cotacao_produtos_servicos`, mais recente 31/08/2026, 15 abertas em 100) e **negociações**
também (`wf_negociacao_cotacao_prod_serv`, mais recente 28/08/2026) — os subprocessos vêm sendo
criados nesta base.
**Divergências encontradas:** **6 das 100 cotações mais recentes estão na atividade *72 - Correção***
— o caminho de correção da cotação está sendo exercitado hoje; vale conferir a causa junto à CASSI,
mas não é o defeito deste ticket. A página **Logs protheus** (`/portal/p/1/portal_logs_protheus`),
que seria a evidência natural do start da integração, **está inoperante** — ver
CT-FSWTBC-1035, divergências.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1650  (fluig · Concluído)

**Título:** A SC que atinge a alçada gera a grade de aprovadores e distribui a tarefa ao aprovador da faixa, na ordem correta.

**Origem:** FSWTBC-1650 — "[CASSI - BH] - Suporte Maio/2025] - Problema na distribuição do fluxo de
alçada no fluig". **Sexta ocorrência de alçada** na conta; passou por EM TESTE e homologação —
tratativa mais cuidadosa que as anteriores. Ticket sem descrição do sintoma.

**Módulo/Rota:** *Solicitação de Compras* (`wf_solicitacao_compras`, formulário `256831`) →
atividades **309 Aguarda Geração de Alçadas** → **310 Gera Grid de Alçadas** → **94 Aprovação de
Alçadas** → **287 Integração ERP** → **210 Validação do Comprador (Alçadas)**. Seção do formulário:
**Aprovação de Alçada** (tabela `tbAlcadas`). Acompanhamento na **Central de Tarefas**.

**Pré-condições**
- SC cujo valor total ultrapasse o limite da primeira faixa de alçada configurada.
- Alçada cadastrada no **Protheus** (tabelas **AL/DHL**) com aprovador nominal para a
  filial/classe orçamentária/faixa de valor — a atribuição é **designada**, não pool.
- Solicitante com hierarquia resolvível.
- **Bloqueio:** **sim.** O cadastro de alçada vive no ERP Protheus e **não há credencial de
  Protheus** nesta rodada. Além disso a conta de QA **não é aprovador de alçada** (as etapas
  94/210 são designadas por matrícula nominal, ex.: aprovador orçamentário 004445) e o cenário
  exigiria **submeter** uma SC até a alçada — escrita irreversível.

**Passos**
1. Abrir a Solicitação de Compras, preencher **Nome da Filial \***, **Justificativa para a
   Solicitação \*** e itens cujo total ultrapasse a primeira faixa de alçada; **Enviar**.
2. Percorrer o fluxo até **310 Gera Grid de Alçadas**.
3. Abrir a SC e ler a seção **Aprovação de Alçada**: para cada linha, **Aprovador \***,
   **Email do Aprovador \***, **Data da Aprovação \***, **Hora da Aprovação \***, **Aprovar? \*** e
   **Justificativa para a Aprovação/Reprovação \***.
4. Abrir a **Central de Tarefas** (`/portal/p/1/pagecentraltask`) → aba **Tarefas a concluir** e
   ler o **Responsável** do cartão da SC.
5. Aprovar a primeira faixa e repetir os passos 3–4 para a faixa seguinte.

**Resultado esperado**
- A grade de alçadas é gerada com **uma linha por faixa aplicável**, cada uma com o **aprovador
  nominal** resolvido pela classe orçamentária e pela faixa de valor (AL/DHL).
- O cartão da **Central de Tarefas** mostra em **Responsável** o **nome da pessoa** — a tarefa
  **não** cai para o *pool* do grupo, onde todos veem e ninguém responde.
- As faixas são percorridas **em ordem**: aprovada a primeira, a tarefa segue para o aprovador da
  segunda; não há salto de faixa nem aprovação em paralelo indevida.
- Concluída a alçada, a SC segue para **287 Integração ERP** e depois **210 Validação do Comprador
  (Análise pós Alçadas)**; os controles `docAlcadaGerada`, `numDocAlcada` e `dataMsgAlcada` ficam
  preenchidos.
- Não havendo aprovador habilitado, o sistema **bloqueia com erro claro** em vez de travar em
  silêncio (comportamento já observado neste ambiente: *"Não foi encontrado nenhum usuário
  habilitado para ser movimentada a tarefa …"*).

**Resultado se o defeito reincidir**
- A distribuição do fluxo de alçada erra: tarefa cai para grupo em vez do aprovador nominal, ou
  para o aprovador da faixa errada, ou a grade nasce incompleta. Mensagem/valor exatos
  `<não documentado>` — o ticket não guarda descrição.

**Severidade:** Alta *(alçada é controle de aprovação e de valor: distribuição errada = aprovação por quem não tem competência, ou compra travada)*

**Preparação de massa:** SC de homologação com valor acima da primeira faixa, **e** o executor
cadastrado no Protheus como aprovador de alçada (AL + faixa DHL) ou registrado como **substituto**
do aprovador — exatamente o arranjo que já existe para o comprador titular. Quem prepara:
administrador do Protheus da CASSI. Sem isso o caso morre na primeira faixa.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário da SC (iframe `256831`) contém a seção **Aprovação de
Alçada**, com a tabela `tbAlcadas` e os campos **Aprovador \*** (`tbalcada_nomResponsavel`),
**Email do Aprovador \*** (`tbalcada_emailResponsavel`), **Data da Aprovação \***
(`tbalcada_dataValidacao`), **Hora da Aprovação \*** (`tbalcada_horaValidacao`), **Aprovar? \***
(`tbalcada_statusValidacao`) e **Justificativa para a Aprovação/Reprovação \***; e a seção
**Validação do Comprador (Análise pós Alçadas)** com as ações **Retornar para Alçada - (Regerar
Documento)** e **Retornar para Alçada - (Novo Fornecedor)**. O mapa de atividades foi lido do
formulário e confirma `aguardaGeracaoAlcadas: 309`, `geraGridAlcadas: 310`, `aprovacaoAlcadas: 94`,
`integracaoERP3: 287`, `validacaoCompradorAlcadas: 210`, `fimValidCompradorAlc: 104`.
**Divergências encontradas:** nenhuma entre o ticket e a tela — mas o ticket **não nomeia o
sintoma**, então o caso foi ancorado no comportamento correto do desenho publicado. Nenhuma tarefa
de alçada real existe hoje para a conta de QA: as etapas 94 e 210 são **designadas** por matrícula
nominal e não aparecem em nenhum pool desta conta.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1728  (fluig · Concluído)

**Título:** Aprovador orçamentário abre a atividade "Validação Orçamentária (Sem Gestor)" e vê a lista completa dos itens a aprovar.

**Origem:** FSWTBC-1728 — "Erro no carregamento dos itens na atividade Validação Orçamentária (Sem
Gestor)". O caminho de exceção do fluxo (solicitante sem gestor imediato) quebrava o carregamento
dos itens, três meses após a entrega do bloco. O ticket não traz descrição além do título.

**Módulo/Rota:** Solicitação de Compras — `/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`
→ seção **Validação do Item Orçamentário** (`panelValidationItem`, tabela `tbItemOrcamentario`).
Etapa **269** (`validacaoOrcamentariaSemGestor`), irmã da etapa **14** (`validacaoOrcamentaria`).
Acompanhamento: **Central de Tarefas** → *Tarefas a concluir*.

**Pré-condições**
- Uma SC submetida por um solicitante **sem gestor imediato resolvido** no Protheus — é essa
  ausência que desvia o fluxo da etapa 14 para a etapa **269**.
- Itens da SC com **aprovador orçamentário** cadastrado por produto (dataset
  `dsProtheus_getGestorOrcamentario_restGet`, filtrado por `CorporateId`, `BranchId`, `productID`).
- Executor autenticado como o aprovador orçamentário de ao menos um item.
- **Bloqueio:** **sim** — a etapa 269 só é alcançável submetendo uma SC cujo solicitante não tenha
  gestor, e o cadastro de gestor/aprovador vive no Protheus, sem credencial nesta rodada.

**Passos**
1. Abrir **Central de Tarefas** e clicar explicitamente na aba **Tarefas a concluir**.
2. Localizar a solicitação na etapa **Validação Orçamentária (Sem Gestor)** e abri-la.
3. Na aba **Formulário**, expandir a seção **Validação do Item Orçamentário**.
4. Conferir a tabela sob o cabeçalho **Item Orçamentário**, linha a linha.
5. Conferir o campo **Total Estimado a Aprovar (R$)**.
6. Sem enviar, conferir que os campos **Aprovador**, **Email do Aprovador**, **Data da Aprovação**
   e **Hora da Aprovação** vieram preenchidos.

**Resultado esperado**
- A seção **Validação do Item Orçamentário** abre e a tabela `tbItemOrcamentario` lista **uma linha
  por item** sob responsabilidade do aprovador autenticado — mesma quantidade que a etapa 14 exibiria.
- **Total Estimado a Aprovar (R$)** traz um valor numérico coerente com a soma dos itens listados.
- O par **Aprovar? (Sim/Não)** e **Justificativa para a Aprovação/Reprovação** está disponível por linha.
- Nenhuma mensagem `Erro ao montar as informações` no console; nenhuma tabela vazia.
- O comportamento é **idêntico** ao da etapa 14 — o caminho "sem gestor" não pode ser um caminho degradado.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A tabela de itens na atividade **Validação Orçamentária (Sem Gestor)** não carrega — grade vazia
  ou incompleta —, impedindo a aprovação orçamentária. Mensagem exata `<não documentado>`: o ticket
  registra apenas o título.

**Severidade:** Média *(bloqueia o fluxo da SC na aprovação orçamentária; sem risco financeiro direto
enquanto nada é aprovado às cegas)*

**Preparação de massa:** uma SC submetida em nome de um solicitante **sem gestor imediato** no
Protheus, com pelo menos dois itens de produtos cujo aprovador orçamentário seja o executor do
teste. Precisa ser criada por quem tenha cadastro no ERP (alçada/gestor) — o executor de QA não
consegue produzir essa condição sozinho.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário da SC foi aberto e a seção `panelValidationItem` existe, com o
título **Validação do Item Orçamentário**, a tabela `tbItemOrcamentario` (cabeçalho **Item
Orçamentário**) e os campos **Aprovador \***, **Email do Aprovador \***, **Data da Aprovação \***,
**Hora da Aprovação \***, **NºProcesso Fluig \***, **Nº SC Origem ERP \***, **Cód. Filial Origem \***,
**Total Estimado a Aprovar (R$) \***, **Aprovar? \*** e **Justificativa para a Aprovação/Reprovação \***.
A seção nasce oculta (`style="display: none"`) e só é revelada na etapa correspondente. Confirmado
no código do formulário que a etapa **Validação Orçamentária (Sem Gestor)** é o estado **269** e que
ela compartilha o mesmo tratamento da etapa 14. Existem ainda os campos de controle
`itensSemGestOrcament` e `itensGestOrcamentario`, que são o gancho do desvio "com/sem gestor".
**Divergências encontradas:** achado de higiene de código, sem efeito hoje — o formulário tem **dois**
blocos comentados como *"Validação Orçamentária || Validação Orçamentária (Sem Gestor)"*: um testa
`numState == 14 || numState == 269` (correto, e é o que executa) e outro testa
`numState == 14 || numState == 255`. O segundo bloco está **vazio**, então o número **255** é
resíduo morto — mas é um número de estado divergente do declarado (`validacaoOrcamentariaSemGestor: 269`)
convivendo no mesmo arquivo, e vale sinalizar antes que alguém preencha aquele bloco.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1762  (fluig · Concluído)

**Título:** A estrutura pai/filho de aprovadores da SC é gerada com uma linha por aprovador, sem duplicar e sem misturar níveis.

**Origem:** FSWTBC-1762 — "[CASSI - BH] - Suporte Maio/2025] - Erro ao gerar linha na pai e filho do
aprovador". Erro na geração das linhas da estrutura pai/filho de aprovadores; da mesma família de
FSWTBC-1816, FSWTBC-3579 e FSWTBC-3620 (a tabela PaiXFilho de aprovadores foi retrabalhada quatro
vezes no projeto). O ticket não traz descrição além do título.

**Módulo/Rota:** Solicitação de Compras → seção **Aprovação de Alçada** (`panelValidationAuthority`),
tabelas `tbAlcadas` (aprovadores), `tbForneceAlcadas` (fornecedores) e `tbForneceItens` (itens).
Geração na etapa **310** (`geraGridAlcadas`), consumo na etapa **94** (`aprovacaoAlcadas`).
Superfície de conferência sem entrar no processo: **Tracker** → filtro **Aprovadores SC**.

**Pré-condições**
- SC que já passou pela negociação e chegou à geração de alçadas (etapas 309/310).
- Cadastro de alçada no Protheus com **aprovador nominal** resolvido para a filial e a faixa de valor.
- **Bloqueio:** **sim** — depende de cadastro de alçada no ERP (AL/DHL) e de submeter uma SC até a
  etapa de alçada. Sem credencial Protheus e sem submissão nesta rodada.

**Passos**
1. Abrir a SC na etapa **Aprovação de Alçada** (ou, sem entrar no processo, abrir
   `/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`, escolher em **Filtrar por:** a opção
   **Aprovadores SC**, informar o **Nº do Processo Fluig** e clicar em **Pesquisar Registro**).
2. Conferir a grade de aprovadores linha a linha.
3. Contar as linhas e comparar com o número de níveis de alçada que a faixa de valor exige.
4. Conferir, em cada linha, o aprovador e o nível a que ela corresponde.

**Resultado esperado**
- Há **exatamente uma linha por aprovador de alçada** exigido — sem repetição do mesmo aprovador.
- Cada linha traz o aprovador **nominal** resolvido; a linha de **grupo** só aparece quando não há
  aprovador nominal para aquele nível.
- Nenhuma linha vem sem aprovador e sem grupo.
- A contagem é **estável**: reabrir a tarefa não acrescenta linhas.
- No Tracker, o filtro **Aprovadores SC** devolve a mesma composição que o formulário exibe.

**Resultado se o defeito reincidir**
- Erro ao gerar as linhas da estrutura pai/filho de aprovadores: linhas a mais, linhas duplicadas ou
  linha sem aprovador. Mensagem exata `<não documentado>` — o ticket registra apenas o título.

**Severidade:** Alta *(a estrutura de aprovadores decide quem aprova a compra; linha errada é risco
de aprovação/alçada indevida)*

**Preparação de massa:** uma SC levada até a etapa **Aprovação de Alçada**, cujo valor total cruze
pelo menos **dois** níveis de alçada distintos — só com dois níveis a estrutura pai/filho é
exercitada de verdade. Exige cadastro de alçada no Protheus e um solicitante com hierarquia
resolvida; nada disso pode ser criado pelo executor de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a seção **Aprovação de Alçada** existe no formulário da SC, oculta até a
etapa, com as três tabelas `tbForneceAlcadas`, `tbForneceItens` e `tbAlcadas` e os campos
**Empresa Vencedora \***, **CNPJ/CPF \***, **Valor da Compras (R$) \***, **Valor do Frete (R$) \***,
**Nº Pedido\***, **Nº Contrato\***, **Total a ser Aprovado (R$) \***, **Valor Vigente do Contrato (R$)**,
**Total com Aditivo (R$)**, **Aprovador \***, **Email do Aprovador \***, **Data da Aprovação \***,
**Hora da Aprovação \***, **Aprovar? \*** (Sim/Não) e **Justificativa para a Aprovação/Reprovação \***.
No **Tracker** foi confirmado em tela que **Aprovadores SC** é uma das 9 opções de **Filtrar por:**,
e que ao selecioná-la os filtros disponíveis passam a ser **Nº do Processo Fluig**, **Solicitante**,
**Status**, **Data da Solicitação (De)**, **Data da Solicitação (Até)** e **Filial**.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum — não submetido; nenhuma pesquisa retornou registro aberto.

---

## CT-FSWTBC-1789  (fluig · Concluído)

**Título:** SC antiga, criada antes da mudança do modelo de alçadas, conclui a etapa de alçada sem erro.

**Origem:** FSWTBC-1789 — "[CASSI - BH] - Suporte Maio/2025] - Erro na finalização de alçada para
processos antigos". Sétima ocorrência de defeito de alçada no projeto, aqui específica de processos
**legados** — instâncias que já estavam em curso quando o modelo de alçadas mudou. O ticket não traz
descrição além do título.

**Módulo/Rota:** Solicitação de Compras → seção **Aprovação de Alçada** (`panelValidationAuthority`),
tabela `tbAlcadas`. Etapas **94** (`aprovacaoAlcadas`), **210** (`validacaoCompradorAlcadas`) e
**104** (`fimValidCompradorAlc`).

**Pré-condições**
- Uma SC **antiga**, iniciada antes da mudança do modelo de alçadas e ainda viva na etapa de alçada
  ou posterior. É a existência de linhas marcadas como histórico que caracteriza o cenário.
- Executor autenticado como o aprovador de alçada de uma das linhas ativas.
- **Bloqueio:** **sim** — depende de massa legada específica de produção, que não pode ser fabricada
  (criar uma SC hoje produz uma instância **nova**, não uma legada) e de cadastro de alçada no
  Protheus. Este caso é, por natureza, executável apenas sobre resíduo histórico da base.

**Passos**
1. Levantar, no **Tracker** (`Filtrar por: Aprovadores SC`, **Status = Abertos**), uma SC antiga
   ainda parada em alçada.
2. Abrir a solicitação e expandir a seção **Aprovação de Alçada**.
3. Conferir quais linhas da grade estão **visíveis** e quais estão suprimidas.
4. Registrar **Aprovar? = Sim** e preencher a **Justificativa para a Aprovação/Reprovação** da linha
   do executor. *(Passo que conclui a alçada — executar apenas em massa própria; ver bloqueio.)*
5. Enviar e acompanhar a solicitação até a etapa seguinte.

**Resultado esperado**
- A SC antiga abre a seção **Aprovação de Alçada** normalmente, sem erro de montagem.
- Linhas **históricas** (marcadas com `tbalcada_historico = "true"`) ficam **ocultas** e não são
  cobradas do aprovador; apenas as linhas ativas (`"false"`) aparecem para decisão.
- Ao concluir, o processo **avança** para a etapa seguinte (Validação do Comprador (Análise pós
  Alçadas) / integração), sem travar e sem mensagem de erro.
- A instância legada segue o mesmo caminho de uma instância nova — a idade do processo não pode
  alterar o desfecho.

**Resultado se o defeito reincidir**
- A finalização da alçada falha **especificamente em processos antigos**: a etapa não conclui e a
  solicitação fica presa. Processos novos, no mesmo ambiente, concluem normalmente — o contraste é o
  sintoma. Mensagem exata `<não documentado>`.

**Severidade:** Alta *(processo travado na alçada bloqueia a compra e a aprovação; risco de contorno
manual sobre o controle de alçada)*

**Preparação de massa:** **uma SC legada real**, parada em alçada, com pelo menos uma linha
histórica e uma linha ativa na grade de aprovadores. Não é criável: só existe como resíduo de
produção. Quem tiver acesso à base precisa apontar a instância; o executor de QA não consegue
produzi-la nem deve concluir a alçada de uma SC de terceiros.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a seção **Aprovação de Alçada** e a tabela `tbAlcadas` foram confirmadas no
formulário. No código de montagem da grade está o mecanismo que dá nome a este caso: cada linha
carrega o controle **`tbalcada_historico`**, e a rotina só **mostra** a linha quando esse valor é
`"false"`; linhas com `"true"` são explicitamente escondidas. É esse o tratamento que separa
processo antigo de processo novo. Confirmado também que o comportamento difere entre a etapa
**Validação do Comprador (Análise pós Alçadas)** (estado 210) e as demais, e que nos estados finais
(`fimValidCompradorAlc`, `fimProcCadAtivContratos`, `fimProcPagtoCompras`) as linhas deixam de ser
ocultadas — a grade vira histórico consultável.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum — não submetido. **Nenhuma alçada de terceiros foi aprovada.**

---

## CT-FSWTBC-1814  (fluig · Concluído)

**Título:** Ao receber uma tarefa do processo de compras, o responsável é notificado e a notificação aponta para a solicitação certa.

**Origem:** FSWTBC-1814 — "[CASSI - BH] - Suporte Maio/2025] - Erro no processo de notificação do
processo de compras". Notificações falhando: o usuário não fica sabendo que tem tarefa. O ticket não
traz descrição além do título.

**Módulo/Rota:** Solicitação de Compras — notificações da plataforma (sino do cabeçalho, presente em
todas as páginas do portal) e **Central de Tarefas** (`/portal/p/1/pagecentraltask`) → aba
**Tarefas a concluir**. Etapa de disparo de e-mails do fluxo: **185** (`disparoEmails`).

**Pré-condições**
- Uma SC movimentada para uma etapa cujo responsável seja o executor do teste (ex.: **Validação do
  Gestor**, estado 7, ou **Validação do Item Orçamentário**).
- Usuário com e-mail válido cadastrado no Fluig.
- **Bloqueio:** **sim** — provocar a notificação exige **movimentar** uma solicitação, o que a
  política desta rodada evita. O que é verificável sem escrever é o **estado atual**: se o contador
  de notificações e a Central de Tarefas concordam com as tarefas realmente pendentes.

**Passos**
1. Fazer login e observar o **sino de notificações** no cabeçalho e o número no seu contador.
2. Abrir o painel de notificações pelo sino.
3. Abrir **Central de Tarefas** e clicar explicitamente na aba **Tarefas a concluir** (a sub-aba é
   guardada por sessão no servidor; não confie no estado herdado).
4. Comparar as tarefas listadas com as notificações do sino.
5. Abrir uma notificação e conferir se ela leva à solicitação correspondente.
6. Conferir a caixa de e-mail do responsável pela notificação do processo de compras.

**Resultado esperado**
- O contador do sino reflete notificações reais e não fica zerado havendo tarefa pendente.
- Cada tarefa de compras pendente na **Central de Tarefas** tem notificação correspondente.
- A notificação identifica a solicitação (nº do processo e etapa) e leva a ela ao ser clicada.
- O responsável recebe o e-mail do processo de compras.
- Não há notificação órfã, apontando para solicitação inexistente ou já concluída.

**Resultado se o defeito reincidir**
- A notificação do processo de compras não é disparada e o responsável não descobre que tem tarefa;
  a tarefa aparece na Central de Tarefas, mas sem aviso. Mensagem exata `<não documentado>`.

**Severidade:** Média *(não corrompe dado, mas trava o fluxo por omissão: tarefa fica parada porque
ninguém foi avisado — foi o que produziu, na massa observada, tarefas atrasadas há dias)*

**Preparação de massa:** uma SC movimentada para uma etapa cujo responsável seja o executor do teste,
mais acesso à caixa de e-mail desse responsável para conferir o disparo. Como a movimentação é o
próprio gatilho, o caso só é executável por quem puder mover uma SC de teste — não pelo executor de
QA nesta rodada.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o **sino de notificações** existe no cabeçalho de todas as páginas do portal
(controle com `title="Abrir notificações"`), exibindo o contador **9+**. A **Central de Tarefas**
abre com o heading *Central de tarefas* e as abas **Resumo de Tarefas** e **Tarefas a concluir**,
esta com o contador **11**. Clicando na aba **Tarefas a concluir**, foram observadas tarefas reais de
compras com responsável, solicitante e prazo — entre elas SC **112829** em *Correção*, SC **112830**
em *Validação do Gestor* e SC **113196** em *Correção*, com marcações de prazo *"Atrasada há 6 dias"*,
*"Atrasada há 2 dias"* e *"Atrasada há 4 minutos"*. Ou seja: **há tarefa de compras pendente e há
contador de notificação não-zerado**, que é a coerência mínima que este caso afirma.
**Divergências encontradas:** **sim.** A rota `/portal/p/1/notificationcenter` **não existe** — responde
com redirecionamento para `/portal/p/1/errorPage/404`, heading *"Recurso não foi encontrado."*. As
notificações só são alcançáveis pelo **sino do cabeçalho**; qualquer roteiro que mande "abrir a
Central de Notificações pela URL" falha por caminho inexistente, não por defeito de notificação.
Os passos acima já estão escritos pelo caminho que funciona.
**Dados/massa usados:** nenhum — não submetido; nenhuma tarefa foi movimentada.

---

## CT-FSWTBC-1816  (fluig · Concluído · SD 761818)

**Título:** A grade de aprovadores da etapa de alçada é montada uma única vez, sem duplicar linhas e sem trazer o grupo de aprovação quando há aprovador nominal.

**Origem:** FSWTBC-1816 — "SD: 761818 - Erro na montagem da pai x filho da etapa de alçada". Várias
linhas eram geradas, **incluindo dados do grupo de aprovação que só deveriam entrar quando não há
aprovador**. Defeito de **idempotência**: a rotina de montagem — que, nas palavras do ticket,
*"não deve ser executada mais de uma vez"* — rodava repetidamente, duplicando linhas e misturando o
caso de exceção (grupo) com o caso normal (aprovador nomeado).

**Módulo/Rota:** Solicitação de Compras → seção **Aprovação de Alçada** (`panelValidationAuthority`),
tabela `tbAlcadas`. Montagem na etapa **310** (`geraGridAlcadas`), precedida por **309**
(`aguardaGeracaoAlcadas`); consumo na etapa **94** (`aprovacaoAlcadas`).

**Pré-condições**
- SC que chegou à geração de alçadas, com **aprovador nominal** cadastrado para o nível exigido —
  é o cenário em que o grupo **não** deve aparecer.
- Um segundo cenário, complementar, com nível **sem** aprovador nominal — em que o grupo **deve** aparecer.
- **Bloqueio:** **sim** — exige cadastro de alçada no Protheus e submissão de SC até a etapa 310.

**Passos**
1. Levar a SC até a etapa **Aprovação de Alçada** e abrir a tarefa.
2. Expandir **Aprovação de Alçada** e contar as linhas da grade de aprovadores.
3. Conferir, linha a linha, se o responsável é uma **pessoa nomeada** ou o **grupo de aprovação**.
4. **Sair da tarefa sem enviar e reabri-la.** Contar as linhas de novo.
5. Repetir a reabertura uma terceira vez.
6. Repetir o cenário completo numa SC cujo nível de alçada **não** tenha aprovador nominal.

**Resultado esperado**
- A grade traz **uma linha por nível de alçada exigido** — nem uma a mais.
- Havendo aprovador nominal, a linha aponta a **pessoa**; a linha do **grupo de aprovação
  (`Pool:Group:G.P.Requisicao_de_Compras_Validacao_Alcadas`) NÃO aparece**.
- A contagem de linhas é **idêntica** nas três aberturas — reabrir a tarefa não remonta a estrutura.
  Esta é a assertion central do caso.
- Só no cenário sem aprovador nominal a linha de grupo aparece, e aí é a única daquele nível.
- Não há linha com aprovador e grupo simultaneamente.

**Resultado se o defeito reincidir**
- A montagem da pai/filho gera **várias linhas**, incluindo **dados do grupo de aprovação que só
  deveriam entrar quando não há aprovador** — os dois casos misturados na mesma grade. O número de
  linhas cresce a cada execução da rotina de montagem.

**Severidade:** Alta *(a grade define quem aprova e em que ordem; duplicação e mistura com o grupo
abrem caminho para aprovação por quem não é o aprovador designado)*

**Preparação de massa:** **duas** SCs levadas até a etapa **Aprovação de Alçada**: uma cujo nível de
alçada tenha **aprovador nominal** cadastrado e outra cujo nível **não** tenha (para cair no grupo).
Sem esse par, o caso não distingue o comportamento correto do defeito. Ambas dependem de cadastro de
alçada no Protheus.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a seção **Aprovação de Alçada** e a tabela `tbAlcadas` existem no
formulário, ocultas até a etapa. No código de montagem da grade foi confirmado o mecanismo exato que
o ticket descreve: a rotina percorre as linhas e decide a visibilidade comparando o aprovador da
linha com o usuário do ERP; existe um ramo específico para quando o responsável da linha é o literal
**`Pool:Group:G.P.Requisicao_de_Compras_Validacao_Alcadas`** — o **grupo de aprovação** citado no
ticket —, tratado como caso à parte do aprovador nominal. Confirmado também que a etapa de montagem
é distinta da de aprovação (**310** `geraGridAlcadas` versus **94** `aprovacaoAlcadas`), o que é
coerente com o diagnóstico de idempotência: o defeito estava em a montagem rodar mais de uma vez.
Há ainda tratamento de **usuário substituto** (`WKSubstituteUser`), que preenche a linha em nome de
quem responde pelo aprovador. A grade não foi populada por falta de massa.
**Divergências encontradas:** nenhuma. Nota útil para quem for executar: o mecanismo de idempotência
observável **é a contagem de linhas entre aberturas** — daí os passos 4 e 5 do roteiro, que são o
coração do caso e costumam ser omitidos.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1906  (fluig · Concluído · SD 762847)

**Título:** Rateio por centro de custo cujas parcelas somam exatamente 100% com casas decimais terminadas em zero é aceito sem crítica.

**Origem:** FSWTBC-1906 — "SD: 762847 - Planilha de rateio não está validando 100% quando as casas
decimais terminam com zeros. Nº 28314". Terceiro defeito de rateio em duas semanas (com FSWTBC-1651
e FSWTBC-1707), **todos de precisão numérica em JavaScript**: aqui o zero à direita quebrava a
comparação com 100%. Corrigido em 1 dia, com print da correção anexado ao ticket.

**Módulo/Rota:** Solicitação de Compras → seção **Identificação do(s) Produto(s)/Serviço(s)** →
sub-seção **Rateio por Centro de Custo** (tabelas `tbRateioItens___N`, campos
`tbRatCC_Rateio___N_M`). Alimentação alternativa pelos botões **Download Planilha de Rateio Modelo**
e **Upload Planilha de Rateio Preenchida**. Conferência transversal: **Tracker** → filtro
**Produtos/Rateio SC**.

**Pré-condições**
- Solicitação de Compras em edição, com **ao menos um item** de produto/serviço adicionado.
- Ao menos **dois centros de custo** na grade de rateio do item.
- **Bloqueio:** **nenhum** para o cenário de validação — o caso foi executado em tela (ver abaixo).
  O caminho pela **planilha** (upload) depende de um contrato com itens e não foi exercitado.

**Passos**
1. Abrir `/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`.
2. Na seção **Identificação do(s) Produto(s)/Serviço(s)**, clicar em **Adicionar Produto**.
3. Na sub-seção **Rateio por Centro de Custo** do item, clicar duas vezes em
   **Adicionar Centro de Custo**.
4. Informar **50,00** no primeiro percentual e sair do campo (blur).
5. Informar **50,00** no segundo percentual e sair do campo. **Este é o cenário do defeito**:
   soma exatamente 100 com casas decimais terminadas em zero.
6. Repetir com pares que também somam 100 com zeros à direita: **25,00 / 75,00** e
   **33,30 / 33,30 / 33,40**.
7. Como contraprova, informar um par que soma **menos** de 100 (ex.: 33,33 / 33,33) e outro que
   **ultrapassa** 100 (ex.: 90,00 / 20,00).
8. Alternativamente, baixar a **Planilha de Rateio Modelo**, preenchê-la com percentuais terminados
   em zero somando 100 e fazer o **Upload da Planilha de Rateio Preenchida**.

**Resultado esperado**
- Nos passos 4–6, os valores são **mantidos como digitados** e **nenhuma crítica é exibida**:
  a soma é reconhecida como exatamente 100%.
- No passo 7 (soma abaixo de 100), aparece a advertência
  **"A soma dos percentuais de rateio deve ser igual a 100%. Por favor, verifique o item N, pois foram
  informados apenas (X%)."**
- No passo 7 (soma acima de 100), o campo que estoura é **limpo** e aparece
  **"A soma dos percentuais de rateio não podem ultrapassar o limite de 100%. Por favor, verifique o
  item N, pois foram informados (X%)."**
- Pelo upload da planilha, quando formulário e planilha se somam acima de 100, a mensagem discrimina
  as duas origens: **"... pois foram informados no formulário (X%) e na planilha (Y%)."**
- Ao enviar com rateio incompleto, o envio é barrado com
  **"A soma de todos os valores de rateio deve ser igual a 100%."** ou
  **"Existem campos de rateio sem preenchimento. Preencha todos os campos e tente novamente."**

**Resultado se o defeito reincidir**
- Percentuais que somam exatamente 100% mas terminam em zero (ex.: **50,00 + 50,00**) são recusados:
  o formulário insiste que a soma **não** é 100% e bloqueia o preenchimento/envio, embora
  aritmeticamente esteja correto.

**Severidade:** Alta *(rateio errado distribui custo em centro de custo errado — efeito contábil; e
o bloqueio indevido trava a abertura da SC)*

**Preparação de massa:** nenhuma para o cenário principal — basta a SC em edição, e o executor
consegue criar a condição sozinho. Para o passo 8 (planilha), é preciso um item vindo de contrato,
porque a planilha modelo é preenchida por item.

**Verificado em tela:** SIM
**O que foi verificado:** **os passos 1 a 5 e 7 foram executados no ambiente.** Na SC em edição, o
botão **Adicionar Produto** acrescentou a linha de item (a grade `tbProdutos` foi de 1 para 2 linhas)
e revelou a sub-seção de rateio (`tbRateioItens___1`) com os botões **Adicionar Centro de Custo**,
**Remover Todos os Rateios**, **Download Planilha de Rateio Modelo** e
**Upload Planilha de Rateio Preenchida**. Dois cliques em **Adicionar Centro de Custo** criaram os
campos `tbRatCC_Rateio___1_1` e `tbRatCC_Rateio___1_2`.
Resultados medidos:
| Cenário | Digitado | Estado final dos campos | Bloqueio? |
|---|---|---|---|
| **A — cenário do ticket** | 50,00 + 50,00 | `50.00` e `50.00`, ambos mantidos | **não** — aceito |
| B — soma 66,66 (< 100) | 33,33 + 33,33 | `33.33` e `33.33`, mantidos | não limpa o campo |
| C — soma > 100 | 90,00 + 20,00 | o campo que estourou o limite foi **limpo** | sim, limpou |
O cenário **A** é a assertion central deste caso e **passou**: soma exatamente 100 com casas decimais
terminadas em zero é aceita, sem crítica e sem limpeza de campo — o defeito não reincidiu.
O cenário **C** confirma que a trava de ultrapassagem continua ativa (o campo excedente é zerado).
Confirmado ainda no código que a comparação hoje é feita **normalizando cada parcela e a soma a 8
casas decimais** antes de comparar com 100 — que é precisamente a correção que o ticket descreve.
No **Tracker**, **Produtos/Rateio SC** foi confirmado como uma das 9 opções de **Filtrar por:**.
**Divergências encontradas:** duas, de execução e não de regra. (1) As mensagens de advertência são
exibidas como *toast* e **não foram capturadas** pelo instrumento usado — o que foi observado
objetivamente foi o **efeito no campo** (mantido no cenário A e B, limpo no C). Portanto o texto
exato das mensagens citadas no resultado esperado vem do código do formulário, **não** de leitura em
tela; um executor manual deve confirmá-lo visualmente. (2) O controle **Adicionar Centro de Custo**
existe em duplicidade no DOM, porque o widget mantém uma **linha-modelo oculta**; mirar o primeiro
elemento encontrado clica no modelo invisível e não faz nada. É preciso mirar o controle **visível** —
armadilha que custa tempo e que já derrubou a primeira tentativa desta verificação.
**Dados/massa usados:** uma linha de produto e duas linhas de rateio **em uma SC de rascunho jamais
enviada**. A rota de escrita `**/process-management/api/**` esteve bloqueada durante toda a
interação e **não foi acionada nenhuma vez** — nenhuma solicitação foi criada na base.

---

## CT-FSWTBC-1907  (fluig · Concluído)

**Título:** O gestor orçamentário abre sua etapa e vê todos os itens sob sua responsabilidade.

**Origem:** FSWTBC-1907 — "[CASSI - BH] - Suporte Maio/2025] - Erro no carregamento dos itens na
etapa do gestor orçamentário". Quarta ocorrência de falha de **carregamento de itens** em pontos
diferentes do fluxo (com FSWTBC-622, FSWTBC-1370 e FSWTBC-1728) — reincidência crônica. O ticket não
traz descrição além do título.

**Módulo/Rota:** Solicitação de Compras → etapa **280** (`distribuicaoGestorOrcamentario`) e seção
**Validação do Item Orçamentário** (`panelValidationItem`, tabela `tbItemOrcamentario`). O aprovador
por item é resolvido pelo dataset **`dsProtheus_getGestorOrcamentario_restGet`**, filtrado por
`CorporateId`, `BranchId` e `productID`.

**Pré-condições**
- SC submetida, já aprovada pelo gestor imediato, chegando à distribuição para gestores orçamentários.
- Itens com **aprovador orçamentário cadastrado por produto** no Protheus — e, para o caso ter valor,
  **itens de mais de um gestor**, para provar que cada um vê só os seus.
- **Bloqueio:** **sim** — depende de cadastro de aprovador orçamentário no Protheus e de submissão da
  SC até a etapa.

**Passos**
1. Autenticar como um gestor orçamentário que tenha itens na SC.
2. Abrir **Central de Tarefas** → aba **Tarefas a concluir** e abrir a solicitação.
3. Expandir a seção **Validação do Item Orçamentário**.
4. Contar as linhas da tabela sob **Item Orçamentário** e conferir cada item.
5. Conferir **Total Estimado a Aprovar (R$)** contra a soma dos itens exibidos.
6. Repetir com um **segundo** gestor orçamentário da mesma SC.

**Resultado esperado**
- A grade de itens carrega e lista **os itens daquele gestor**, com uma linha por item.
- Cada gestor vê **apenas** os itens sob sua responsabilidade — a SC é particionada entre eles.
- **Total Estimado a Aprovar (R$)** corresponde à soma dos itens exibidos para aquele gestor.
- Os campos **Aprovador**, **Email do Aprovador**, **Data da Aprovação** e **Hora da Aprovação**
  vêm preenchidos com os dados do usuário autenticado.
- **Aprovar? (Sim/Não)** e **Justificativa** ficam disponíveis por linha; nenhuma grade vazia.

**Resultado se o defeito reincidir**
- Os itens não carregam na etapa do gestor orçamentário — grade vazia ou parcial —, e a aprovação
  não pode ser feita. Mensagem exata `<não documentado>`.

**Severidade:** Média *(trava a aprovação orçamentária da SC; sem risco de dado incorreto enquanto
nada é aprovado)*

**Preparação de massa:** uma SC com itens de **produtos de pelo menos dois gestores orçamentários
diferentes**, submetida e aprovada pelo gestor imediato. É o par de gestores que torna o caso
capaz de detectar tanto a falta de itens quanto o vazamento de itens alheios. Depende de cadastro
no Protheus.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a seção **Validação do Item Orçamentário** existe no formulário com todos os
campos listados nos passos (**Aprovador \***, **Email do Aprovador \***, **Data da Aprovação \***,
**Hora da Aprovação \***, **NºProcesso Fluig \***, **Nº SC Origem ERP \***, **Cód. Filial Origem \***,
**Total Estimado a Aprovar (R$) \***, **Aprovar? \***, **Justificativa para a Aprovação/Reprovação \***)
e a tabela `tbItemOrcamentario` sob o cabeçalho **Item Orçamentário**. Confirmado que a etapa de
distribuição para gestores orçamentários é o estado **280** e que a resolução do aprovador por item é
feita pelo dataset **`dsProtheus_getGestorOrcamentario_restGet`**, com filtro por empresa, filial e
**produto** — é essa granularidade por produto que sustenta a afirmação "cada gestor vê só os seus".
A grade não foi populada por falta de massa.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1954  (fluig · Concluído)

**Título:** Solicitante envia SC cujo rateio soma exatamente 100% com casas decimais terminadas em zero e o sistema aceita.

**Origem:** FSWTBC-1954 — a planilha de rateio não validava 100% quando as casas decimais terminavam
com zeros (SC nº 28314): o rateio somava 100 e mesmo assim a crítica de "diferente de 100%" disparava.

**Módulo/Rota:** *Solicitação de Compras* (`wf_solicitacao_compras`) → **Produtos/Serviços da
Solicitação** → **Download Planilha de Rateio Modelo** / **Upload Planilha de Rateio Preenchida**.
Mesma regra existe em *Faturamento de Contratos* → **Rateio**.

**Pré-condições**
- SC em edição com ao menos um produto adicionado (**Adicionar Produto**), com *Quantidade* e
  *Preço Unit. Estimado* preenchidos.
- Centros de custo e classes de valor válidos no Protheus para preencher a planilha.
- **Bloqueio:** nenhum para a montagem do cenário; **sim** para a conclusão — validar o aceite exige
  **enviar** a SC, o que cria registro. A crítica de rateio, porém, dispara **antes** do envio.

**Passos**
1. Iniciar *Solicitação de Compras*, preencher **Nome da Filial** e **Justificativa para a Solicitação**.
2. Clicar em **Adicionar Produto** e preencher um item.
3. Clicar em **Download Planilha de Rateio Modelo**.
4. Preencher a planilha com **duas linhas** para o mesmo item, percentuais com decimais terminados em
   zero e soma exata de 100 — ex.: `50,50000000` e `49,50000000`; cada linha com Centro de Custo e
   Classe de Valor válidos e distintos.
5. Clicar em **Upload Planilha de Rateio Preenchida** e selecionar o arquivo.
6. Repetir com a soma **abaixo** de 100 (ex.: `50,00000000` + `49,00000000`) e depois **acima** de 100.

**Resultado esperado**
- Passo 5: a planilha é aceita **sem nenhuma crítica de percentual**; a grade de rateio do item é
  montada com as duas linhas e os percentuais exibidos como informados.
- Passo 6 (abaixo de 100): crítica *"A soma dos percentuais de rateio deve ser igual a 100%. Por favor,
  verifique o item &lt;N&gt;, pois foram informados apenas (&lt;X&gt;%)."*
- Passo 6 (acima de 100): crítica *"A soma dos percentuais de rateio não podem ultrapassar o limite de
  100%. Por favor, verifique o item &lt;N&gt;, pois foram informados no formulário (&lt;X&gt;%) e na planilha (&lt;Y&gt;%)."*
- A comparação é feita com **8 casas decimais** (`listDecimal.rateio = 8`): `100,00000000` é tratado
  como igual a `100`, e não como diferente.
- Planilha vazia → *"Planilha vazia ou sem dados detectados!"*; sem linhas de dados → *"Planilha não
  contém linhas de dados!"*.

**Resultado se o defeito reincidir**
- Rateio somando exatamente 100 com zeros à direita é recusado como se fosse ≠ 100%, e a SC não avança
  (relato original: SC nº 28314).

**Severidade:** Média *(bloqueia o fluxo — a SC correta é recusada)*

**Preparação de massa:** planilha de rateio preenchida a partir do modelo baixado da própria tela, com
centros de custo e classes de valor que existam no Protheus (se não existirem, a crítica que aparece é
outra: *"Existem Centros de Custo informados na planilha que não foram identificados no sistema!"*).

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de SC foi aberto e os botões **Download Planilha de Rateio Modelo**
e **Upload Planilha de Rateio Preenchida** existem e estão habilitados na etapa de início; a grade de
rateio (`tbRateioItens___N`, campos `tbRatCC_Rateio___N_M`) é montada por item. As três mensagens acima
foram lidas literalmente no fonte do formulário, assim como o arredondamento a 8 casas
(`parseFloat(rateio.toFixed(8))`) usado nas duas comparações.
**Divergências encontradas:** o campo de percentual **limita silenciosamente**: digitar `110` vira
`100.00000000` no *blur* (`if (parseFloat(value) > 100) value = parseFloat(100.00000000)`), então o
cenário "acima de 100%" só é alcançável **pela planilha**, não pela digitação.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2013  (fluig · Concluído)

**Título:** Solicitante anexa um documento à solicitação e ele é gravado uma única vez.

**Origem:** FSWTBC-2013 — `SD761820`, API de criação de novo documento **triplicando** a informação.
O ticket não traz descrição do passo a passo: o caso percorre a funcionalidade de anexo, que é onde
documentos são criados pelo processo.

**Módulo/Rota:** *Solicitação de Compras* → botões **Anexar documentação Pública** e **Anexar
documentação Restrita CASSI**; aba **Anexos** da solicitação. Superfície equivalente em *Cotação de
Produtos/Serviços* → **Insira os anexos para envio do Parecer Técnico**.

**Pré-condições**
- SC em edição (etapa de início ou de ajuste) com permissão de anexar.
- Arquivo de teste nomeado com prefixo `QA` (ex.: `QA-anexo-<data>.pdf`).
- **Bloqueio:** **sim** para a execução completa — anexar cria documento no ECM, e registro criado no
  Fluig **não tem exclusão disponível** para esta conta. A verificação de contagem só é conclusiva
  depois de anexar.

**Passos**
1. Iniciar *Solicitação de Compras* e observar o contador da aba **Anexos** (deve estar em `0`).
2. Clicar em **Anexar documentação Pública** e selecionar **um** arquivo `QA…`.
3. Voltar à aba **Anexos** e conferir a listagem.
4. Repetir com **Anexar documentação Restrita CASSI**, com um segundo arquivo `QA…`.
5. Recarregar a solicitação e conferir a listagem novamente.
6. Em *Documentos* (`/portal/p/1/ecmnavigation`), localizar os arquivos pelo prefixo `QA` e conferir a
   quantidade de registros criados.

**Resultado esperado**
- Cada upload gera **exatamente um** documento: o contador da aba **Anexos** vai de `0` para `1` e
  depois para `2` — nunca para `3` ou `6`.
- A listagem de anexos mostra cada arquivo **uma única vez**, com o tipo de sigilo correto
  (Pública × Restrita CASSI).
- Após recarregar, a quantidade permanece a mesma (não há duplicação na releitura).
- Em *Documentos*, existe uma única versão/registro por arquivo enviado.

**Resultado se o defeito reincidir**
- O mesmo documento aparece **três vezes** após um único envio (relato: "API de criação de novo documento
  triplicando informação"). Mensagem de erro: nenhuma — o defeito é silencioso, o que torna a **contagem**
  a única assertion possível.

**Severidade:** Alta *(duplicação de dado documental em processo de compra)*

**Preparação de massa:** dois arquivos pequenos com prefixo `QA` no nome. O executor precisa ter direito
de anexar na etapa em que a SC estiver, e deve avisar a gestão do ambiente de que ficarão documentos `QA`
residuais (não há exclusão disponível).

**Verificado em tela:** PARCIAL
**O que foi verificado:** no formulário de SC existem os botões **Anexar documentação Pública** e
**Anexar documentação Restrita CASSI**, e a solicitação tem a aba **Anexos** com contador (exibindo `0` em
uma solicitação nova). No formulário de Cotação existe a área **Insira os anexos para envio do Parecer
Técnico**, com botões `btnAdicionarAnexo___N` por proposta. Nenhum arquivo foi enviado — anexar criaria
documento não removível.
**Divergências encontradas:** o ticket fala em "API de criação de novo documento" sem nomeá-la; em tela a
criação é feita pelo componente padrão de anexos do Fluig (o formulário inclusive **esconde** a tabela
nativa `attachmentsUploadEmptyTable` e o bloco `div-buttons-attachment`, substituindo-os pelos dois botões
próprios) — não há como o executor observar a API, só a contagem resultante.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2022  (fluig · Concluído)

**Título:** Solicitante conclui uma Solicitação de Compras e ela é gravada com número da SC no ERP.

**Origem:** FSWTBC-2022 — erro na gravação da SC do processo de solicitação de compras. Ticket sem
descrição: caso de caracterização do caminho de gravação.

**Módulo/Rota:** *Solicitação de Compras* (`wf_solicitacao_compras`) → botão **Enviar** →
etapa **Validação do Gestor** → integração com o ERP.

**Pré-condições**
- Perfil que inicia SC (confirmado para a conta de QA).
- Filial, produto/serviço e grupo de produto válidos no Protheus.
- Protheus disponível — a SC só recebe **Nº da Solicitação ERP** após a integração.
- **Bloqueio:** **sim** para a conclusão — o caso exige **enviar** a SC, o que cria registro no Fluig e no
  Protheus. Nesta rodada nada foi enviado.

**Passos**
1. Iniciar *Solicitação de Compras*.
2. Conferir o preenchimento automático de **Nº do Processo Fluig**, **Solicitante**, **Email do
   Solicitante**, **Data** e **Hora da Solicitação**.
3. Selecionar **Nome da Filial** (zoom) e conferir que **Código da Filial** é preenchido junto.
4. Preencher **Justificativa para a Solicitação**.
5. Clicar em **Adicionar Produto** e preencher **Produto/Serviço**, **Unidade de Medida**, **Grupo do
   Produto/Serviço**, **Data de Necessidade** (campo `date`, formato ISO), **Quantidade**,
   **Preço Unit. Estimado** e **Observação**.
6. Informar o rateio do item (formulário ou planilha) somando 100%.
7. Clicar em **Enviar**.
8. Acompanhar em *Central de Tarefas* e no **Tracker**.

**Resultado esperado**
- A solicitação é gravada e recebe **Nº do Processo Fluig**; a instância passa a **Validação do Gestor**.
- Nenhuma mensagem de erro de gravação; nenhum campo obrigatório é reclamado depois de preenchido.
- Após a integração, **Nº da Solicitação ERP** é preenchido, e o **Tracker** encontra a SC pelo
  *Número da Solicitação*.
- O botão **Enviar** fica indisponível enquanto a criação está em voo (proteção antiduplo-clique), e um
  único registro é criado.
- Se a integração falhar, a falha aparece de forma tratada e rastreável — não como SC gravada pela metade.

**Resultado se o defeito reincidir**
- A SC não é gravada ao clicar em **Enviar** (relato: "Erro na gravação da SC do processo de solicitação de
  compras"). Mensagem exata `<não documentado>`.

**Severidade:** Alta

**Preparação de massa:** o próprio executor cria a massa; todo campo de texto livre deve começar com `QA`
(**Justificativa** e **Observação**). Atenção: a SC criada **não pode ser excluída** — combine antes o
cancelamento com quem administra o ambiente.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário abre com as quatro seções e os campos automáticos já preenchidos
(**Nº do Processo Fluig**, **Solicitante**, **Email do Solicitante**, **Data**/**Hora da Solicitação**, todos
`readonly`); o botão **Enviar** existe no topo da tela de movimentação; a Central de Tarefas mostra que SCs
enviadas por esta conta param em **Validação do Gestor** (instâncias 112146 e 112171, *Sol. Compras -
UNIDADE - CLINICASSI PORTO VELHO - RO*). O envio **não** foi executado.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2084  (fluig · Concluído · SDCASSI-12)

**Título:** O comprador conclui a alçada de uma SC e o fornecedor recebe, por e-mail, exatamente o valor do pedido gravado no Protheus.

**Origem:** FSWTBC-2084 (SD766255) — o e-mail enviado ao fornecedor informava o valor do pedido
**diferente do valor real no Protheus, com diferença de centavos**. Arredondamento na composição
do e-mail; risco contratual, porque o fornecedor pode contestar o valor informado.

**Módulo/Rota:** *Solicitação de Compras* (`/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`)
→ seção **Aprovação de Alçada** → atividade `integracaoERP3` (287) → `disparoEmails` (185).
Conferência do valor: aba **Histórico** da solicitação e Tracker
(`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`, campos *Nº da Solicitação* e *Nº da Cotação*).

**Pré-condições**
- SC própria já aprovada em alçada, com **Empresa Vencedora** definida e **Nº Pedido** gerado no ERP.
- Fornecedor com **E-mail** cadastrado (campo *E-mail \** da seção *Contatos* do formulário de Negociação).
- Acesso à caixa de e-mail do fornecedor (ou à cópia interna) para ler a mensagem enviada.
- **Bloqueio:** **sim, parcial.** (a) O corpo do e-mail **não tem superfície no Fluig** — não há
  prévia, log de mensagem nem reenvio visível ao usuário comum; só se confirma na caixa do
  destinatário. (b) O valor "real do Protheus" só é conferível no ERP, e não há credencial Protheus.
  O que o Fluig expõe e serve de âncora é o valor **gravado no formulário** (grade de alçada).

**Passos**
1. Abrir a SC pela Central de Tarefas (`/portal/p/1/pagecentraltask` → aba **Tarefas a concluir**).
2. Na seção **Aprovação de Alçada**, anotar, com todas as casas exibidas, os valores da grade
   `tbForneceAlcadas`: **Empresa Vencedora \***, **CNPJ/CPF \***, **Valor da Compras (R$) \***,
   **Valor do Frete (R$) \***, **Nº Pedido\***, **Nº Contrato\***.
3. Anotar também **Valor da Compra (R$) \***, **Total a ser Aprovado (R$) \***,
   **Valor Vigente do Contrato (R$)** e **Total com Aditivo (R$)**.
4. Concluir a alçada e deixar o processo passar por `integracaoERP3` (287) e `disparoEmails` (185).
5. Na aba **Histórico** da solicitação, localizar o registro da integração
   (*"Integração executada com sucesso - Tempo de Execução N s"*) e o **Nº Pedido** retornado.
6. Abrir o e-mail recebido pelo fornecedor e comparar o valor informado com o do passo 2/5.

**Resultado esperado**
- O valor do pedido no corpo do e-mail é **idêntico**, centavo a centavo, ao *Valor da Compras (R$)*
  da grade de alçada e ao valor gravado no Protheus para o mesmo **Nº Pedido**.
- A diferença entre os dois é **exatamente R$ 0,00** — não "arredondada para menos de um centavo".
- O somatório informado (compras + frete) confere com *Total a ser Aprovado (R$)*.
- O e-mail cita o mesmo **Nº Pedido** que a aba Histórico registra.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O e-mail ao fornecedor traz o valor do pedido com **diferença de centavos** em relação ao valor
  do Protheus. Valor exato da divergência: `<não documentado>` — o ticket guarda só um print e não
  registrou a causa do arredondamento.

**Severidade:** Alta *(risco contratual/financeiro: o fornecedor pode contestar o valor informado)*

**Preparação de massa:** uma SC criada pelo próprio executor, levada até **Aprovação de Alçada** com
fornecedor vencedor e valor com centavos **não redondos** (ex.: quantidade 3 × R$ 33,33 = R$ 99,99,
ou um item com rateio que produza dízima). Sem centavo quebrado o caso não discrimina nada. Exige
também acesso à caixa do fornecedor — quem prepara: administrador do ambiente / dono do processo.

**Verificado em tela:** PARCIAL
**O que foi verificado:** O formulário da SC (iframe `256831`) foi aberto e as seções ocultas
reveladas. A seção **Aprovação de Alçada** existe, com a grade `tbForneceAlcadas` e as colunas
*Empresa Vencedora \**, *CNPJ/CPF \**, *Valor da Compras (R$) \**, *Valor do Frete (R$) \**,
*Nº Pedido\**, *Nº Contrato\**, além dos campos *Valor da Compra (R$) \**, *Total a ser Aprovado
(R$) \**, *Valor Vigente do Contrato (R$)* e *Total com Aditivo (R$)*. A atividade de envio de
e-mail existe e se chama `disparoEmails` (185) no mapa de atividades do formulário. No formulário
de Negociação (`256835`) confirmei os campos de total que alimentam o pedido: **Sub Total \***,
**Valor total do IPI \***, **Valor total do Frete \***, **Valor total de Descontos \***,
**Valor total do Pedido \*** (todos `readonly`).
**Divergências encontradas:** a formatação monetária dos formulários usa `listDecimal.default = 6`
(seis casas) — `numberToCurrencyFormat(..., 6)` e `toFixed(6)` aparecem na carga dos valores de
contrato (`CN9_VLINI`, `CN9_SALDO`). Um valor com 6 casas convertido para 2 casas na composição do
e-mail é exatamente a mecânica capaz de produzir a diferença de centavos relatada. Isso é
**observação de código servido hoje**, não reprodução do defeito. Além disso, **não existe no Fluig
nenhuma superfície que mostre o corpo do e-mail enviado** — registro isso em vez de simular cobertura.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2105  (fluig · Concluído · SDCASSI-14)

**Título:** O gestor reprova a alçada de uma solicitação antiga e a reprovação é registrada sem erro, na versão em que a instância nasceu.

**Origem:** FSWTBC-2105 (SD766733) — erro ao reprovar a alçada do gestor no processo 19771. A
correção foi manual e delicada: *"converter a versão 21 para a 35 para enviar a reprovação e, após
a ação, retornar da 35 para a 21 por conta das diferenças entre as versões"*. Ou seja, a instância
rodava um diagrama antigo que não suportava a operação.

**Módulo/Rota:** *Solicitação de Compras* → **Aprovação de Alçada** (`aprovacaoAlcadas`, 94) →
**Validação do Comprador (Análise pós Alçadas)** (`validacaoCompradorAlcadas`, 210).
Aba **Informações** da solicitação (traz a versão do processo) e aba **Histórico**.

**Pré-condições**
- Uma SC **em versão antiga do diagrama**, parada em *Aprovação de Alçada*, cuja alçada esteja
  atribuída ao executor.
- Perfil de gestor/aprovador de alçada.
- **Bloqueio:** **sim.** (a) Não há SC em alçada atribuída à conta de QA — as 11 tarefas a concluir
  estão em *Correção* e *Validação do Gestor*, e são de terceiros. (b) Converter versão de
  instância é operação de **administrador do Fluig** (Studio / gestão de processos), fora do perfil
  disponível. (c) Reprovar alçada é ação irreversível sobre processo real — vedada pelo briefing.

**Passos**
1. Abrir a SC pela Central de Tarefas → aba **Tarefas a concluir** → selecionar a tarefa de
   *Aprovação de Alçada*.
2. Na aba **Informações**, anotar a **versão do processo** da instância.
3. Na aba **Formulário**, ir à seção **Aprovação de Alçada** e conferir que a grade
   `tbForneceAlcadas` está montada com a empresa vencedora e os valores.
4. Registrar a reprovação (campo de decisão da alçada) preenchendo a **Justificativa \***.
5. Clicar em **Enviar**.
6. Reabrir a solicitação e conferir a aba **Histórico** e a aba **Informações**.

**Resultado esperado**
- A reprovação é aceita **sem erro**, qualquer que seja a versão do diagrama em que a instância nasceu.
- O processo avança para **Validação do Comprador (Análise pós Alçadas)** (atividade 210) ou para o
  destino previsto para reprovação, e **não** fica preso na atividade 94.
- A aba **Histórico** registra a movimentação com o nome do gestor que de fato reprovou e o
  timestamp da ação.
- A aba **Informações** mostra a **mesma versão** de antes da ação — a instância **não** muda de
  versão por causa de uma reprovação.
- Nenhuma intervenção manual de administrador é necessária para concluir a ação.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro ao enviar a reprovação da alçada; a movimentação não completa. Mensagem exata:
  `<não documentado>` — o ticket traz print do erro, mas o texto não foi transcrito.
- Sintoma de segunda ordem: a correção só passa convertendo a instância de versão (21 → 35) e
  revertendo depois (35 → 21). Se alguém precisar fazer isso de novo, **o defeito voltou**.

**Severidade:** Alta *(bloqueia decisão de alçada e exigiu intervenção manual em instância de produção)*

**Preparação de massa:** uma SC em *Aprovação de Alçada* **atribuída ao executor**, criada por ele,
e — para o cenário completo — uma instância deliberadamente mantida em versão anterior do diagrama.
Só o administrador do Fluig consegue produzir a segunda condição. Quem prepara: dono do processo +
administrador da plataforma.

**Verificado em tela:** PARCIAL
**O que foi verificado:** A seção **Aprovação de Alçada** existe no formulário `256831`, com a grade
`tbForneceAlcadas` (colunas *Empresa Vencedora \**, *CNPJ/CPF \**, *Valor da Compras (R$) \**,
*Valor do Frete (R$) \**, *Nº Pedido\**, *Nº Contrato\**) e a seção seguinte **Validação do
Comprador (Análise pós Alçadas)** com os campos **Enviar para \*** e **Justificativa \***. As
atividades `aprovacaoAlcadas: 94` e `validacaoCompradorAlcadas: 210` estão declaradas no
`ViewHandler.js` do formulário. As abas **Informações** e **Histórico** existem em toda instância
(`Formulário / Informações / Histórico / Anexos`). Central de Tarefas aberta: **11** tarefas a
concluir, nenhuma em etapa de alçada.
**Divergências encontradas:** o ticket fala em "alçada do gestor", mas a tela tem **duas** etapas de
aprovação distintas e separadas — **Validação do Gestor** (atividade 7, com *Aprovador \**, *Aprovar? \**)
e **Aprovação de Alçada** (atividade 94, grade de fornecedores/valores). O ticket não diz qual das
duas falhou; o caso acima assume a segunda por causa da palavra "alçada". Vale confirmar com quem
abriu o chamado.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2106  (ambos · Concluído · SDCASSI-15)

**Título:** Enviar uma SC para aprovação quando o gestor de primeiro nível está com o posto vago e conferir que ela sobe para o nível seguinte.

**Origem:** FSWTBC-2106 — SC 35119 não subiu para o gestor superior: o N1 estava vago e a SC não caiu
para o N2. Conclusão do ticket: "possivelmente problema no cadastro, e a Geise informou que nesses
casos seguiram tratando **pelo grupo** mesmo". O contorno virou procedimento operacional aceito — o
defeito estrutural nunca foi resolvido, só absorvido pela operação. É o caso "posto vago" repetido
(FSWTBC-332, 643, 650).

**Módulo/Rota:** Fluig → **Processos → Solicitação de Compras** (`wf_solicitacao_compras`) →
atividade **Validação do Gestor** (atividade 7). Conferência: **Central de Tarefas** e
**Tracker** → *Filtrar por:* **Aprovadores SC**.

**Pré-condições**
- Uma SC submetida por um solicitante cujo **gestor imediato de N1 esteja com o posto vago** na
  estrutura do Protheus, e cujo **N2 exista**.
- **Bloqueio:** a estrutura hierárquica só é verificável no Protheus — **sem credencial**. E o
  cenário exige **um posto vago**, que não pode ser fabricado pelo Fluig. Ancorado no Fluig por:
  (a) o **Histórico**, que mostra para qual atividade e para qual responsável a SC foi encaminhada;
  (b) o **Tracker**, tipo **Aprovadores SC**; (c) a existência da rota alternativa de fluxo no
  próprio processo (ver Divergências).

**Passos**
1. Criar/abrir uma SC de um solicitante cujo gestor N1 esteja vago (usar prefixo `QA` nos textos livres).
2. Preencher os itens e movimentar para aprovação.
3. Reabrir a solicitação em modo leitura por
   `/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=<nº>`.
4. Abrir a aba **Histórico** e ler para qual atividade a SC foi encaminhada e qual o
   **Responsável Atual**.
5. Abrir o **Tracker**, tipo **Aprovadores SC**, e pesquisar pelo **Nº do Processo Fluig**.
6. Conferir na **Central de Tarefas** do gestor de **N2** se a tarefa apareceu.

**Resultado esperado**
- Com o N1 vago, a SC é encaminhada ao gestor de **N2** — nomeadamente, não ao vazio.
- O **Histórico** registra a atividade **Validação do Gestor** com um **responsável identificado**.
- No **Tracker**, tipo **Aprovadores SC**, o aprovador listado é o do N2.
- A SC **não** fica parada sem responsável nem é encerrada por falta de aprovador.
- Se o encaminhamento ao grupo for a regra aceita, **o Histórico deve dizer isso explicitamente**,
  em vez de deixar o usuário deduzir.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A SC 35119 **não subiu para o gestor superior**: com o N1 vago, ela não caiu para o N2 e o
  tratamento acabou sendo feito manualmente "pelo grupo".

**Severidade:** Alta *(SC parada sem aprovador, ou aprovação por caminho não previsto — risco de alçada)*

**Preparação de massa:** um solicitante cujo **N1 esteja vago** e cujo **N2 exista** na hierarquia do
Protheus. Quem prepara: RH/administrador da CASSI, no ERP. **Não é fabricável pelo Fluig** e é o item
que falta para executar o caso.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei que o processo **35119 existe nesta base** (modo leitura,
**Histórico (16)**, **Anexos (1)**). Confirmei que o **Tracker** oferece o tipo **Aprovadores SC**,
que é a superfície de conferência do passo 5. No fonte publicado da SC confirmei os estados do
processo: **`validacaoGestor: 7`**, `ajustarInformacoes: 11`, **`validacaoOrcamentaria: 14`**,
**`validacaoOrcamentariaSemGestor: 269`** e `distribuicaoGestorOrcamentario: 280`
(`sc_App_ViewHandler.js:55-59`), e o bloco de tela **"Validação do Gestor"** com a coluna
**"Gestor Imediato"** (`form_sc.html:886-907`).
**Divergências encontradas:** duas, e a primeira reenquadra o defeito:
(1) **o Fluig não consulta hierarquia para decidir o gestor imediato.** No fonte publicado, o
responsável da etapa é um **pool de grupo**:
`let groupTask = "Pool:Group:G.P.Requisicao_de_Compras_Gestor_Imediato"`
(`sc_App_ViewHandler.js:2237`). Não há, em nenhum fonte, `superiorColaborador`, `RD4`, `hierarqui` ou
`superior` — **zero ocorrências**, inclusive nos bundles minificados. Portanto **não existe, do lado
Fluig, lógica de "subir para o N2"**: ou o grupo resolve, ou a tarefa não é atribuída.
(2) **a falta de gestor é tratada por desvio de fluxo, não por erro:** existe um estado dedicado
**269 – Validação Orçamentária (Sem Gestor)**, e o código trata 14 e 269 no mesmo ponto
(`sc_App_App.js:130`: `if (numState == 14 || numState == 269)`). Ou seja, **"seguir sem gestor" é um
caminho previsto no desenho do processo**. Isso explica por que o ticket foi absorvido pela operação
em vez de corrigido — mas também significa que, sem credencial de gestor e sem um posto vago
preparado, **este caso não pode ser exercitado por ninguém nesta rodada**.
**Dados/massa usados:** leitura do processo 35119. Nada submetido.

---

## CT-FSWTBC-2129  (fluig · Concluído/Não será feito · SDCASSI-18)

**Título:** O usuário faz upload da planilha de rateio e os percentuais permanecem com as 8 casas decimais, permitindo conferir que o total fecha 100%.

**Origem:** FSWTBC-2129 (SD767287) — ao fazer upload, a planilha de rateio **perdia a configuração
de 8 casas decimais**, dificultando conferir o total de 100%. Fechado como **"Não será feito"**
(*"solicitado cancelamento pelo cliente"*) e **reaberto no mesmo dia** como FSWTBC-2131 (SD767288),
onde foi corrigido. Duplicidade de registro em dois SDs consecutivos.

**Módulo/Rota:** *Solicitação de Compras* → **Produtos/Serviços da Solicitação** → **Rateio por
Centro de Custo** → botões **Download Planilha de Rateio Modelo** / **Upload Planilha de Rateio
Preenchida**. Mesma seção existe em *Faturamento de Contratos* → **Rateio Contábil**.

**Pré-condições**
- SC em elaboração (etapa *Início* ou *Ajustar Informações*), com ao menos um item em
  **Produtos/Serviços da Solicitação**.
- Uma planilha de rateio com percentuais **de dízima**, que só fecham 100% usando as 8 casas —
  ex.: 3 centros de custo com `33,33333333` + `33,33333333` + `33,33333334`.
- **Bloqueio:** **não** para a montagem do cenário (o formulário abre e os botões existem para a
  conta de QA); **sim** para a conclusão — validar o total no processo real exigiria enviar a SC.

**Passos**
1. Abrir `/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`.
2. Preencher os campos obrigatórios da seção **Identificação da Entidade / Solicitação** e clicar
   em **Adicionar Produto**.
3. Clicar em **Download Planilha de Rateio Modelo** e abrir o arquivo baixado.
4. Preencher a planilha com os três percentuais de dízima acima (8 casas cada), para o mesmo item.
5. Clicar em **Upload Planilha de Rateio Preenchida** e selecionar o arquivo.
6. Conferir a grade **Rateio por Centro de Custo** montada na tela, campo a campo.

**Resultado esperado**
- Cada linha do rateio exibe o percentual **com as 8 casas decimais** que estavam na planilha —
  `33,33333333`, não `33,33` nem `33,333`.
- A soma exibida fecha **100%** e o formulário **não** dispara nenhuma das mensagens de rateio.
- Ao gravar/movimentar, **não** aparece *"A soma dos percentuais de rateio deve ser igual a 100%.
  Por favor, verifique o item N, pois foram informados apenas (99,99%)"*.
- O campo de rateio aceita 8 caracteres (`maxlength="8"` no input `tbRatCC_Rateio___N`) e o valor
  é comparado com 100 **após** `toFixed(8)`.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Após o upload, os percentuais aparecem truncados/arredondados, perdendo as 8 casas decimais, e
  o usuário não consegue conferir que o rateio fecha 100%.

**Severidade:** Média *(bloqueia a conferência do rateio, que é a base do lançamento contábil)*

**Preparação de massa:** nenhuma massa externa. Basta a planilha modelo baixada da própria tela,
preenchida com percentuais de dízima em 8 casas. Pode ser feita pelo próprio executor.

**Verificado em tela:** PARCIAL
**O que foi verificado:** No formulário `256831` a seção **Rateio por Centro de Custo** existe
(container `tdataRateioItens`, texto *"Rateio por Centro de Custo · Remover Todos os Rateios"*) e os
três botões estão lá com estes ids: `btnDownLoadModeloPlanilha` (**Download Planilha de Rateio
Modelo**), `btnImportPlanilha` (**Upload Planilha de Rateio Preenchida**) e `btnDelItensRateio`
(**Remover Todos os Rateios**). A configuração de casas decimais **existe hoje e é de 8**:
`this.listDecimal = { rateio: 8, default: 6 }` em `App/EventHandler.js`, idêntica nos formulários
`256831` e `256836`. O input de rateio é
`<input ... id="tbRatCC_Rateio___N" data-percent="" maxlength="8" ...>`, e toda comparação com 100
é feita sobre `parseFloat(rateio.toFixed(this.listDecimal.rateio))`.
**Divergências encontradas:** **sim, relevante.** O `input[type=file]` do rateio (`fl_planilha`) tem
`accept=".csv"` — a planilha de rateio de hoje é **CSV**, não XLSX. Um CSV **não carrega
configuração de formatação de célula**: "8 casas decimais" só sobrevive se estiver escrito no texto
do próprio campo. Isso muda a natureza do teste: não se verifica "formatação preservada", e sim
"o parser lê e mantém as 8 casas do texto". (No mesmo formulário de Medição existe um segundo
upload, `fl_planilhaMedi`, esse sim `accept=".xlsx"`, mas é dos **Itens da Medição**, não do rateio.)
**Dados/massa usados:** nenhum — não submetido; nenhum arquivo foi enviado.

---

## CT-FSWTBC-2130  (ambos · **Não é possível reproduzir** · SDCASSI-19)

**Título:** Enviar repetidamente SCs do mesmo solicitante e conferir que a atribuição do gestor imediato é sempre a mesma.

**Origem:** FSWTBC-2130 — SC 33360 caiu para o grupo e não foi para o gestor imediato. **O melhor
registro de não-determinismo do backlog:** o cliente colou o log do Fluig com **duas chamadas ao
mesmo endpoint** (`/api/v1/fluig/integracao/util/superiorColaborador/<email>`) com **2 segundos de
diferença** — a primeira devolveu **HTTP 404 "Superior não localizado"** e a segunda **HTTP 200** com
o e-mail do superior. Mesma consulta, respostas opostas. Fechado como **"Não é possível reproduzir"**
porque "não ocorreu novamente", apesar da evidência no log. A chamada com 404 era registrada no log
como *SUCCESS*.

> **Atenção:** este é o único item do lote cujo `status` **não** é "Concluído" — está fechado como
> *Não é possível reproduzir*. O resultado esperado abaixo é o **comportamento correto**, e
> **hoje ele pode falhar**: a causa nunca foi identificada.

**Módulo/Rota:** Fluig → **Processos → Solicitação de Compras** → atividade **Validação do Gestor**.
Conferência: **Histórico** da solicitação e **Tracker** → *Filtrar por:* **Aprovadores SC**.

**Pré-condições**
- Um solicitante com **gestor imediato cadastrado e ativo** no Protheus.
- Possibilidade de submeter **várias SCs seguidas** do mesmo solicitante (o defeito é intermitente —
  uma única execução não o expõe).
- **Bloqueio:** a resposta inconsistente vem de uma **API do Protheus** — **sem credencial** para
  investigar do outro lado, e o log do servidor Fluig não é acessível a este perfil. Ancorado no
  Fluig por: (a) o **Histórico**, que nomeia o responsável de cada atribuição; (b) o **Tracker**,
  tipo **Aprovadores SC**. Executar o caso exige **criar SCs reais** — não feito nesta rodada (§2).

**Passos**
1. Com o mesmo solicitante, criar e submeter **5 SCs equivalentes** em sequência (prefixo `QA` em
   todo texto livre), anotando o **Nº do Processo Fluig** de cada uma.
2. Para cada SC, reabrir em modo leitura por
   `/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=<nº>`.
3. Abrir a aba **Histórico** e anotar, para cada uma, a atividade de destino e o **responsável**.
4. Abrir o **Tracker**, tipo **Aprovadores SC**, e pesquisar cada **Nº do Processo Fluig**,
   registrando o aprovador atribuído.
5. Comparar as 5 execuções entre si.
6. Repetir o ciclo em outro horário do dia.

**Resultado esperado**
- As **5 SCs** do mesmo solicitante são atribuídas ao **mesmo** gestor imediato — a atribuição é
  **determinística**.
- Nenhuma delas cai para o **grupo** enquanto houver gestor imediato cadastrado e ativo.
- O **Histórico** registra o mesmo responsável nas 5.
- Se em alguma execução o superior não for localizado, isso é registrado como **erro** — nunca como
  sucesso.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A SC 33360 caiu para o **grupo** em vez do gestor imediato. No log, duas chamadas a
  `/api/v1/fluig/integracao/util/superiorColaborador/ruanna.rodrigues@cassi.com.br` com 2 segundos de
  diferença devolveram, respectivamente, **404 "Superior não localizado"** e **200** com o e-mail do
  superior — e a chamada com 404 foi registrada no log como **SUCCESS**.

**Severidade:** Alta *(atribuição de aprovação não determinística — risco de alçada e de aprovação por caminho não previsto)*

**Preparação de massa:** um solicitante com gestor imediato ativo e autorização para criar **5+ SCs
descartáveis** na base de homologação. Quem prepara: o próprio executor, com um login de solicitante
válido. **Como o defeito é intermitente, uma execução única não é conclusiva** — o valor do caso está
na repetição, e é por isso que os passos pedem 5 execuções e uma segunda janela de horário.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei que o processo **33360 existe nesta base** e li seu **Histórico
(14)** em modo leitura. Ele mostra a cadeia da SC concluída em 31/07/2025, com as atividades
**Aprovação de Alçadas → Sol. Aprovado na Alçada? → Alçada foi Gerada? → Aguarda Geração do
Pedido/Contrato → Pedido/Contrato foi Gerado? → Disparo de E-mails → Contrato? → Fim - Processo de
Pagamento de Compras**, e os textos de integração *"Integração executada com sucesso - Tempo de
Execução 45 s / 6 s / 2 s"*. Duas observações do próprio histórico, úteis ao caso:
registra *"Substituto Iago de Araujo Mentros **em nome de** Ilmara Carneiro Nascimento movimentou a
atividade Aprovação de Alçadas"* — ou seja, **o Histórico nomeia quem agiu e em nome de quem**, que é
exatamente o dado que o passo 3 coleta; e registra *"Aguardando Geração do Contrato para a
Solicitação de Compras: 000014 processo enviado para **fila do Temporizador**!"*, mostrando que a SC
**tem** mecanismo de fila/timer (ao contrário da medição — ver CT-FSWTBC-1903).
**Divergências encontradas:** duas, e a primeira é forte:
(1) **o endpoint `superiorColaborador` do ticket NÃO existe no front-end.** Busca por
`superiorColaborador`, `superior`, `RD4` e `hierarqui` em todos os fontes publicados baixados —
incluindo os bundles minificados — retorna **zero ocorrências**. A mensagem
**"Superior não localizado"** também **não existe** em nenhum fonte. A chamada é **server-side**
(evento de workflow), o que significa que **quem for reproduzir não conseguirá observá-la pelo
DevTools do navegador** — precisará do log do servidor Fluig. Isso é uma limitação real do caso e
está declarada aqui em vez de simulada.
(2) **"cair para o grupo" é o fallback projetado, não necessariamente o defeito.** O responsável da
etapa é o pool `Pool:Group:G.P.Requisicao_de_Compras_Gestor_Imediato` e existe o estado dedicado
**269 – Validação Orçamentária (Sem Gestor)**. Portanto o sintoma relatado ("caiu para grupo") é
indistinguível, **pela tela**, do comportamento normal quando não há gestor — e essa
indistinguibilidade é, provavelmente, a razão de o ticket ter sido fechado como não reproduzível.
O caso só é conclusivo com as 5 repetições comparadas entre si.
**Dados/massa usados:** leitura do processo 33360. Nada submetido.

---

## CT-FSWTBC-2157  (fluig · Concluído · SDCASSI-25)

**Título:** Depois de um deploy do formulário, o upload da planilha de rateio continua funcionando na primeira tentativa.

**Origem:** FSWTBC-2157 (SD767708) — a planilha de rateio não fazia upload (processo 37143). Não foi
erro de código, e sim **de processo de deploy**: *"na MUD15897 foi alterada a versão do arquivo,
porém ao realizarem o deploy do formulário em produção alteraram o documentId"*. O identificador do
documento no ECM mudou e o upload passou a apontar para lugar nenhum.

**Módulo/Rota:** *Solicitação de Compras* → **Rateio por Centro de Custo** → **Upload Planilha de
Rateio Preenchida** (`btnImportPlanilha` / `fl_planilha`). Vale igualmente para *Faturamento de
Contratos* → **Rateio Contábil**.

**Pré-condições**
- Um deploy recém-aplicado do formulário de SC (ou de Medição) em produção — este caso é de
  **smoke test pós-deploy**.
- SC em elaboração com ao menos um item em **Produtos/Serviços da Solicitação**.
- **Bloqueio:** **sim, parcial.** O gatilho do caso (um deploy) não é reproduzível sob demanda pelo
  executor; o caso é para ser rodado **imediatamente após cada deploy**. A verificação do
  `documentId` no ECM (`/portal/p/1/ecmnavigation`) exige perfil com acesso à pasta de destino.

**Passos**
1. Logo após o deploy, abrir `/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`.
2. Confirmar que o iframe do formulário é servido em `/webdesk/streamcontrol/256831/...` e que os
   scripts `App/App.js`, `App/EventHandler.js`, `App/ViewHandler.js` carregam **sem 404** (aba
   Rede do navegador).
3. Adicionar um produto e clicar em **Download Planilha de Rateio Modelo** — o arquivo modelo deve
   baixar.
4. Preencher o modelo e clicar em **Upload Planilha de Rateio Preenchida**, selecionando o arquivo.
5. Conferir que a grade **Rateio por Centro de Custo** é montada com as linhas do arquivo.
6. Repetir os passos 3–5 no formulário de *Faturamento de Contratos* (**Rateio Contábil**), e
   também para **Upload Planilha de Itens Preenchida**.

**Resultado esperado**
- O modelo baixa e o upload monta a grade **na primeira tentativa**, sem recarregar a página.
- Nenhuma requisição do formulário retorna **404** — em especial nenhuma que carregue documento do
  ECM por id.
- Nenhum erro no console do tipo *"Não foi possível carregar as informações"* / documento não
  encontrado.
- Os ids de documento/pasta usados pelo formulário resolvem no ambiente onde o deploy foi feito.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O botão **Upload Planilha de Rateio Preenchida** não produz efeito: a planilha não é carregada e a
  grade de rateio não é montada. Mensagem exata: `<não documentado>` — o ticket guarda print, sem
  transcrição.

**Severidade:** Média *(bloqueia o fluxo da SC/medição até novo deploy corretivo)*

**Preparação de massa:** nenhuma massa de negócio. Exige **coordenação com o deploy**: o caso só tem
valor se executado na janela pós-deploy. Quem prepara: time de deploy / gestão de mudanças (a
MUD que aplicar a nova versão do formulário deve disparar este caso).

**Verificado em tela:** PARCIAL
**O que foi verificado:** Os botões existem e estão ativos no formulário `256831`:
`btnDownLoadModeloPlanilha` e `btnImportPlanilha`, com o `input[type=file]#fl_planilha`
(`accept=".csv"`). No formulário `256836` existem os quatro: `btnDownLoadModeloPlanilhaMed` /
`btnImportPlanilhaMed` (`#fl_planilhaMedi`, `accept=".xlsx"`) e `btnDownLoadModeloPlanilha` /
`btnImportPlanilha` (`#fl_planilha`, `accept=".csv"`). Todos os scripts do formulário carregaram
sem 404 nas duas cargas medidas; o único 404 do ambiente é
`/portal/api/servlet/image/1/custom/logo_image.png`, que é o logotipo e aparece em toda página.
**Divergências encontradas:** **sim, e é o achado mais forte deste caso.** A prática que causou o
defeito **ainda está no código**: no formulário de Parecer Técnico (`256832`, `App/EventHandler.js`
linha 15) a pasta de anexos é um id **fixado no fonte e diferente por ambiente**:
`this.folderMain = 256821; //COMMENT NOTE: ** prod *256821* | qa *251956* | tst *256821* **`.
Ou seja, ainda hoje há identificador do ECM hardcoded com valores distintos por ambiente dentro do
artefato versionado — exatamente o mecanismo que quebrou o upload em 2157 e que explica a
divergência PRD × TST do CT-FSWTBC-2244. Recomendação: externalizar esses ids para parâmetro,
não deixá-los no fonte.
**Dados/massa usados:** nenhum — não submetido; nenhum arquivo foi enviado.

---

## CT-FSWTBC-2187  (ambos · Concluído · SDCASSI-29)

**Título:** Concluir uma cotação no Fluig e confirmar que o processo só é dado por finalizado quando a cotação de fato existe no Protheus.

**Origem:** FSWTBC-2187 — cotações existiam no Fluig e **não** no Protheus, e os processos Fluig
tinham **finalizado sem erro** (filial 4101, SC 28450, cotação 000035). É a manifestação mais clara
do **falso positivo da MATA150**. A correção foi de arquitetura: *"incluí uma validação no Fluig
para que, quando encontrar esse erro, ele NÃO MOVIMENTE a solicitação e caia na atividade de erro"* —
o Fluig deixou de confiar no retorno do ERP e passou a validar o **efeito**.

**Módulo/Rota:** Fluig → **Processos** → **Solicitação de Compras**
(`/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`), atividades de integração
**20 `integracaoERP`**, **177 `integracaoERP2`** e **287 `integracaoERP3`**; campo **Retorno
Integração** do formulário da SC; e Fluig → **Tracker**, cruzando **Nº da Cotação ERP** com o **Nº do
Processo Fluig**.

**Pré-condições**
- Uma SC que chegue à etapa de cotação e dispare a integração com o ERP.
- Integração `apiRESTProtheus_CASSI` no ar.
- **Bloqueio:** duplo. (a) **Sem credencial Protheus** — não posso conferir a SC8 do outro lado.
  (b) O próprio ticket registra que **reproduzir exige forçar um erro na ExecAuto** para obter o
  mesmo falso positivo; isso não é executável a partir do Fluig e não deve ser forçado no ambiente
  do cliente. O caso é, na prática, um **teste de auditoria** sobre processos já finalizados.

**Passos**
1. Abrir o **Tracker - Processos Compras/Contratos**.
2. Em *Filtrar por:*, selecionar **Cotação de Produtos/Serviços**.
3. Em *Status*, selecionar **Finalizados**.
4. Delimitar um período em *Data da Solicitação (De)/(Até)*.
5. Aplicar o filtro e inspecionar a coluna **Nº da Cotação ERP** de cada processo retornado.
6. Para qualquer processo finalizado com **Nº da Cotação ERP vazio**, abrir a solicitação por
   `/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=<nº>` e ler a aba
   **Histórico** e o campo **Retorno Integração** do formulário.
7. Repetir com *Filtrar por:* = **Solicitação de Compras**, conferindo **Nº da Solicitação ERP**.

**Resultado esperado**
- **Nenhum** processo com status **Finalizado** apresenta **Nº da Cotação ERP** (ou **Nº da
  Solicitação ERP**) vazio. Processo finalizado ⇒ número de ERP presente.
- Quando a integração falha, o processo **não movimenta**: ele para na **atividade de erro**, e não
  aparece como *Finalizado*.
- O campo **Retorno Integração** do formulário da SC traz o erro do ERP quando houve erro, e fica
  vazio quando a integração foi bem-sucedida.
- O **Histórico** registra *"Integração executada com sucesso - Tempo de Execução N s"* somente
  quando o número de ERP foi efetivamente devolvido.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Processos Fluig **finalizados sem erro** cuja cotação **não existe** no Protheus — no Tracker, a
  linha aparece com status *Finalizado* e **Nº da Cotação ERP em branco**. Era o caso de SC 28450 /
  cotação 000035 na filial 4101.

**Severidade:** Alta — o Fluig declara concluído um fluxo que não produziu efeito no ERP; o pedido
some entre os dois sistemas e ninguém é avisado.

**Preparação de massa:** para a auditoria (passos 1–7), **nenhuma** — roda sobre o histórico
existente e é o modo recomendado. Para o cenário provocado, seria preciso **forçar erro na ExecAuto
da MATA150**, o que exige o Protheus e um ambiente onde provocar falha seja aceitável — não a base
do cliente.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri o **Tracker** e confirmei que ele oferece, na mesma tela, os filtros
*Cotação de Produtos/Serviços*, *Solicitação de Compras* e *Status = Finalizados*, mais os campos
**Nº da Solicitação ERP** e **Nº da Cotação ERP** — que é exatamente o cruzamento que este caso
precisa, e o único disponível sem o ERP. Confirmei no fonte publicado do formulário da SC o rótulo
**"Retorno Integração"**. **Não** filtrei dados de produção nem abri solicitações de terceiros.
**Divergências encontradas:** (1) o ticket fala de "a integração" no singular; no
`wf_solicitacao_compras` são **três** atividades distintas (**20** `integracaoERP`, **177**
`integracaoERP2` após o fim da negociação, **287** `integracaoERP3`). Ao executar o caso é preciso
dizer **qual** delas está sob teste — a validação de efeito precisa existir nas três, e o ticket não
registra em quais foi aplicada. (2) **Divergência dentro do próprio material de apoio:** a tabela
"Rótulos já confirmados em tela" ainda mapeia *"Erro retornado pelo ERP Protheus"* → *"Retorno
Integração"*, como se o primeiro tivesse sido substituído. **Não foi.** Conferi os três formulários
publicados: a **SC** tem *"Retorno Integração"*; a **Cotação** e a **Negociação** têm *"Erro
retornado pelo ERP Protheus"*. Os dois rótulos coexistem em telas diferentes — usar o mapeamento
antigo faz o roteiro procurar o campo errado na tela de Cotação.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2236  (fluig · Concluído · SDCASSI-36)

**Título:** A SC atravessa a integração com o ERP após a negociação sem falha transacional, e a retentativa não deixa o processo preso.

**Origem:** FSWTBC-2236 (SD768724) — SC 36133 parou com
*"Failed to run the service event. Process: wf_solicitacao_compras - Activity 177 - Attempt 2 -
EJBTransactionRolledbackException: GenericJDBCException: could not prepare statement"*. Erro de
**infraestrutura de banco** no Fluig (esgotamento de conexões/statements no pool), não de lógica —
note *Attempt: 2*, já era retentativa. Ver CT-FSWTBC-2238 para o desfecho.

**Módulo/Rota:** *Solicitação de Compras* → atividade **177 = `integracaoERP2`**, a integração com o
ERP disparada logo após `aguardaFimNegociacao` (172), a caminho de `aguardaGeracaoAlcadas` (309).
Superfície de conferência: aba **Histórico** da solicitação.

**Pré-condições**
- SC própria com negociação concluída, na transição para a geração de alçadas.
- Para o cenário de carga: várias SCs atravessando a atividade 177 **em concorrência**.
- **Bloqueio:** **sim.** (a) O defeito é de pool de conexões do servidor de aplicação — não se
  provoca pela tela, e o briefing veda rodar rotina batch ou carga. (b) A conta de QA não tem SC em
  etapa de negociação/alçada. (c) O log do servidor de aplicação, onde o `EJBTransactionRolledbackException`
  aparece, exige perfil de administrador.

**Passos**
1. Criar/movimentar uma SC até o fim da negociação (`aguardaFimNegociacao`, 172).
2. Deixar o processo avançar para a atividade **177** (`integracaoERP2`).
3. Reabrir a solicitação e ir à aba **Histórico**.
4. Conferir o registro da integração e o horário; conferir que o processo saiu de 177.
5. Na aba **Formulário**, ir à seção **Validação do Comprador (Análise pós Alçadas)** e conferir o
   campo **Retorno Integração\*** / **Verificar Retorno Protheus**.
6. Repetir com 3–5 SCs simultâneas, para exercitar concorrência na mesma atividade.

**Resultado esperado**
- A SC **atravessa** a atividade 177 e chega a `aguardaGeracaoAlcadas` (309) / `geraGridAlcadas` (310).
- A aba **Histórico** registra *"Integração executada com sucesso - Tempo de Execução N s"*.
- **Não** aparece *"Failed to run the service event"* nem qualquer
  `EJBTransactionRolledbackException` / `GenericJDBCException: could not prepare statement`.
- Nenhuma instância fica presa em 177 exigindo movimentação manual.
- O campo **Retorno Integração\*** não traz erro do ERP.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Texto exato do ticket: `Failed to run the service event. Process: wf_solicitacao_compras -
  Activity 177 - Attempt 2 - EJBTransactionRolledbackException: GenericJDBCException: could not
  prepare statement`. O processo fica retido na atividade 177.

**Severidade:** Média *(bloqueia o fluxo da SC; sem perda de dado, mas exige intervenção)*

**Preparação de massa:** de 3 a 5 SCs do executor, todas com negociação concluída, para atravessarem
a atividade 177 ao mesmo tempo. É o único jeito de exercitar concorrência sem rodar carga
artificial. Quem prepara: comprador, no ambiente de homologação. O acompanhamento do pool de
conexões (e do log do servidor) fica com a infraestrutura.

**Verificado em tela:** PARCIAL
**O que foi verificado:** A **Activity 177 foi identificada com precisão**: no `App/ViewHandler.js`
do formulário `256831`, o mapa de atividades declara `integracaoERP2: 177`, imediatamente após
`aguardaFimNegociacao: 172` e antes de `aguardaGeracaoAlcadas: 309`. Ou seja, a atividade que
falhava é a **segunda integração com o ERP**, a que roda ao final da negociação. Na seção
**Validação do Comprador (Análise pós Alçadas)** do formulário existem os rótulos **Verificar
Retorno Protheus** e **Retorno Integração\***. A aba **Histórico** existe em toda instância.
**Divergências encontradas:** o briefing (§5-B) cita o campo *"Erro retornado pelo ERP Protheus"*
como superfície de conferência; **na Solicitação de Compras esse rótulo não existe** — o campo
equivalente se chama **Retorno Integração\***, ao lado de **Verificar Retorno Protheus**. Rótulo
diferente do esperado.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2237  (fluig · Concluído · SDCASSI-38)

**Título:** Uma SC com dois gestores orçamentários registra, no histórico, o nome de quem de fato aprovou por último.

**Origem:** FSWTBC-2237 (SD769157) — a SC 36489 tinha dois gestores orçamentários e o histórico
gravou o nome do gestor **errado** como último aprovador. Defeito de **rastreabilidade de
aprovação**: em processo sujeito a auditoria, histórico incorreto é problema de conformidade, não
de exibição. Corrigido em 6 dias, sem registro da causa — e **o histórico já gravado errado não foi
corrigido**.

**Módulo/Rota:** *Solicitação de Compras* → **Validação do Item Orçamentário**
(`distribuicaoGestorOrcamentario` 280 → `validacaoOrcamentaria` 14 → `fimValidOrcamentaria` 99) →
aba **Histórico** da solicitação.

**Pré-condições**
- SC própria cujos itens tenham **dois gestores orçamentários distintos** (dois centros de custo com
  responsáveis diferentes na grade *Item Orçamentário*).
- Os dois gestores aprovando em **momentos diferentes**, com intervalo observável entre eles.
- **Bloqueio:** **sim.** (a) Exige duas contas de gestor orçamentário distintas — não há credencial
  de gestor. (b) Exige aprovar em processo real (escrita). (c) A vinculação item ↔ gestor
  orçamentário vem do Protheus, sem credencial.

**Passos**
1. Montar a SC com dois itens cujos centros de custo tenham gestores orçamentários diferentes.
2. Movimentar até **Validação do Item Orçamentário** e conferir que a grade *Item Orçamentário*
   lista **duas** linhas, cada uma com seu **Total Estimado a Aprovar (R$) \***.
3. Com o **gestor A**, aprovar sua linha (**Aprovar? \*** = *Aprovado*, com
   **Justificativa para a Aprovação/Reprovação \***) e **Enviar**. Anotar nome e horário.
4. Aguardar; com o **gestor B**, aprovar a outra linha e **Enviar**. Anotar nome e horário.
5. Reabrir a solicitação e ir à aba **Histórico**.
6. Ler o registro que fecha a etapa de validação orçamentária e conferir o nome ali gravado.

**Resultado esperado**
- O histórico registra **duas** movimentações de aprovação, uma por gestor, cada uma com o nome e o
  horário corretos.
- O registro que conclui a etapa (`fimValidOrcamentaria`, 99) cita o **gestor B** — o que aprovou
  por **último** — e não o gestor A.
- A ordem cronológica dos registros bate com a ordem real das aprovações.
- A grade **Validação do Item Orçamentário** mostra, por linha, o aprovador correspondente
  (`tbitorc_aprovadoValid___N` = *Aprovado*), sem trocar os nomes entre linhas.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O histórico exibe, como último aprovador, o nome do gestor orçamentário **que não foi o último a
  aprovar** — o nome errado gravado na conclusão da etapa.

**Severidade:** Alta *(rastreabilidade de aprovação em processo auditável; o histórico é a evidência)*

**Preparação de massa:** uma SC do executor com **dois itens em centros de custo de gestores
orçamentários diferentes**, mais as **duas credenciais de gestor** para aprovar em sequência. A
vinculação centro de custo ↔ gestor é cadastro do Protheus. Quem prepara: administrador do ERP +
os dois gestores.

**Verificado em tela:** PARCIAL
**O que foi verificado:** No formulário `256831` a seção **Validação do Item Orçamentário** existe,
com os rótulos **Item Orçamentário**, **Total Estimado a Aprovar (R$) \***, **Aprovar? \*** e
**Justificativa para a Aprovação/Reprovação \***. Os campos de controle estão no DOM:
`itensGestOrcamentario`, `itensSemGestOrcament`, e a grade `tbitorc_*` com
`tbitorc_aprovadoValidSim` / `tbitorc_aprovadoValidNao`, `tbitorc_valorTotEstItem`,
`tbitorc_codERPUserValid` e `tbitorc_codERPBossValid` (o `ViewHandler.js` compara o código ERP do
usuário logado com o do aprovador do item, linhas 1978 e 2053–2060 — é ali que a identidade do
aprovador é resolvida). As atividades `distribuicaoGestorOrcamentario: 280`,
`validacaoOrcamentaria: 14`, `validacaoOrcamentariaSemGestor: 269` e `fimValidOrcamentaria: 99`
estão declaradas. A aba **Histórico** existe em toda instância.
**Divergências encontradas:** o ticket usa "gestor orçamentário"; na tela a seção se chama
**Validação do Item Orçamentário** e a Central de Tarefas nomeia a etapa **Validação Orçamentária**
— três nomes para a mesma coisa. Além disso, existe uma variante de atividade
`validacaoOrcamentariaSemGestor` (269) para itens **sem** gestor orçamentário: um item que caia
nessa variante não gera registro de aprovador, o que é caminho alternativo a considerar ao ler o
histórico.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2238  (fluig · Concluído · SDCASSI-39)

**Título:** Várias solicitações de compras atravessam a integração com o ERP em paralelo, no serviço dedicado de compras, sem falha transacional.

**Origem:** FSWTBC-2238 (SD769162) — SC 33985 com o mesmo erro JDBC de 2236
(`EJBTransactionRolledbackException: GenericJDBCException: could not prepare statement`). Traz o
**desfecho da família**: *"foi alterada a porta do serviço de compras de produção para a porta
11005, que é dedicada aos serviços de compras, para melhorar a performance"*. Os erros vinham de
concorrência no mesmo broker; isolar compras numa porta dedicada foi a mitigação. Registra ainda a
decisão de não investir mais, porque *"a DEM10013707 substitui a necessidade do endpoint que está
impactando"*. Curiosidade do histórico: em FSWTBC-1339 a ação foi mover de 11005 **para** 11082 —
as portas foram trocadas nos dois sentidos ao longo do ano.

**Módulo/Rota:** *Solicitação de Compras* → atividades de integração `integracaoERP` (20),
**`integracaoERP2` (177)** e `integracaoERP3` (287). Configuração do broker REST: infraestrutura
(porta 11005), **fora do Fluig**.

**Pré-condições**
- Ao menos 5 SCs próprias atravessando atividades de integração ao mesmo tempo.
- Conhecimento de qual porta/serviço o ambiente aponta hoje para compras.
- **Bloqueio:** **sim.** (a) A porta do broker REST é configuração de **infraestrutura** e não tem
  nenhuma superfície no Fluig para o usuário comum — não há tela onde ler "11005". (b) Provocar
  concorrência de verdade exigiria carga, vedada pelo briefing. (c) Log do servidor exige
  administrador. **Digo isto explicitamente em vez de simular cobertura**: a mudança de porta não é
  verificável pela tela; só o **efeito** é.

**Passos**
1. Com a infraestrutura, confirmar para qual porta o serviço de compras aponta hoje e registrar o
   valor (esperado: **11005**, dedicada a compras).
2. Movimentar 5 SCs próprias de modo que atravessem `integracaoERP` (20) / `integracaoERP2` (177) /
   `integracaoERP3` (287) na mesma janela.
3. Para cada SC, abrir a aba **Histórico** e localizar o registro da integração.
4. Anotar o **Tempo de Execução** informado em cada registro.
5. Conferir, no formulário, **Verificar Retorno Protheus** / **Retorno Integração\***.
6. Conferir no Tracker (`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`) que as 5 aparecem com
   **Nº da Solicitação** e **Nº da Cotação** preenchidos.

**Resultado esperado**
- As 5 SCs concluem a integração; **nenhuma** exibe `could not prepare statement` nem
  `EJBTransactionRolledbackException`.
- Cada aba **Histórico** traz *"Integração executada com sucesso - Tempo de Execução N s"*.
- Nenhuma instância registra *Attempt: 2* ou superior — não há retentativa.
- Nenhuma SC fica presa em atividade de integração.
- No Tracker, as 5 aparecem com **Nº da Solicitação ERP** e **Nº da Cotação ERP** preenchidos.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `javax.ejb.EJBTransactionRolledbackException: org.hibernate.exception.GenericJDBCException: could
  not prepare statement` ao movimentar a SC, com a instância retida na atividade de integração.

**Severidade:** Média *(bloqueia o fluxo; a mitigação é de infraestrutura, não de produto)*

**Preparação de massa:** 5 SCs do executor prontas para integrar na mesma janela, **mais** a
confirmação, pela infraestrutura, de qual porta o serviço de compras usa hoje. Sem essa confirmação
o caso mede só o efeito, não a causa. Quem prepara: comprador (as SCs) + infraestrutura (a porta).

**Verificado em tela:** PARCIAL
**O que foi verificado:** As três atividades de integração estão declaradas no formulário `256831`:
`integracaoERP: 20`, `integracaoERP2: 177`, `integracaoERP3: 287`. Os rótulos **Verificar Retorno
Protheus** e **Retorno Integração\*** existem na seção *Validação do Comprador (Análise pós
Alçadas)*. O **Tracker** abre (`Cassi - Fluig Plataforma - Tracker - Processos Compras/ Contratos`)
com os filtros *Identificação do Processo / Solicitante* e *Informações do Fornecedor*, e os campos
**Número da Solicitação**, **Nº da Cotação**, **Solicitante**, **Data de Solicitação**, **Número do
Contrato**, o combo de processo (*Solicitação de Compras / Cotação de Produtos/Serviços / Negociação
de Cota…*) e o combo de situação (*Todos / Abertos / Finalizados / Cancelados*), com os botões
**Pesquisar Registro** e **Limpar**.
**Divergências encontradas:** nenhuma de rótulo. Registro a limitação de fundo: **a porta do broker
(11005) não tem representação em nenhuma tela do Fluig** — nem no Tracker, nem no histórico, nem no
formulário. Este caso, portanto, verifica o efeito (integração conclui) e **não** a mitigação
(porta dedicada), que precisa ser conferida pela infraestrutura.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2245  (fluig · Concluído · SDCASSI-42)

**Título:** O aprovador abre a solicitação na etapa de aprovação e o campo de decisão do gestor está carregado e utilizável.

**Origem:** FSWTBC-2245 (SD769491) — a aprovação de alçada **não carregava o campo de aprovação do
gestor**, em **quatro** processos simultaneamente (36133, 37107, 38728, 39479). Décima ocorrência da
família alçada. Quatro processos afetados ao mesmo tempo indica falha sistêmica naquele período, não
caso isolado. **A SC 36133 aparece também em FSWTBC-2236, com o erro JDBC** — o mesmo processo com
dois sintomas, provavelmente a mesma causa de infraestrutura.

**Módulo/Rota:** *Solicitação de Compras* → **Validação do Gestor** (`validacaoGestor`, 7) e
**Aprovação de Alçada** (`aprovacaoAlcadas`, 94).

**Pré-condições**
- SC própria parada na etapa de aprovação, com a tarefa atribuída ao aprovador.
- Perfil de gestor/aprovador.
- **Bloqueio:** **sim.** Não há SC em etapa de aprovação atribuída à conta de QA. Existe **uma**
  tarefa em *Validação do Gestor* na Central de Tarefas (Sol. Compras 112830, CASSI SEDE), mas é de
  terceiro (solicitada por Paulo Calixto) — abrir/movimentar tarefa alheia é vedado pelo briefing.

**Passos**
1. Abrir a SC pela Central de Tarefas → aba **Tarefas a concluir** → tarefa de aprovação.
2. Na seção **Validação do Gestor**, conferir que estão **visíveis e preenchidos**: **Gestor
   Imediato**, **Aprovador \***, **Email do Aprovador \***, **Data da Aprovação \***,
   **Hora da Aprovação \***, **NºProcesso Fluig \***, **Nº SC Origem ERP \***, **Cód. Filial Origem \***.
3. Conferir que o controle **Aprovar? \*** está **presente e habilitado** (não some, não vem
   desabilitado, não vem sem opção).
4. Alternar **Aprovar? \*** entre *Aprovado* e *Reprovado* e conferir que o campo
   **Justificativa para a Aprovação/Reprovação \*** reage (rótulo passa a obrigatório na reprovação).
5. Na seção **Aprovação de Alçada**, conferir a grade `tbForneceAlcadas` montada com **Empresa
   Vencedora \***, **CNPJ/CPF \***, **Valor da Compras (R$) \***, **Valor do Frete (R$) \***,
   **Nº Pedido\***, **Nº Contrato\***, e os campos **Valor da Compra (R$) \***,
   **Total a ser Aprovado (R$) \***.
6. Repetir em **quatro** solicitações diferentes, na mesma janela — foi assim que o defeito se
   manifestou.

**Resultado esperado**
- O campo **Aprovar? \*** aparece **sempre**, carregado e habilitado, em todas as instâncias
  abertas na etapa de aprovação.
- O switcher grava o valor esperado: *Aprovado* ou *Reprovado* no campo `managerAprovadoValidacao`.
- Os campos de identificação do aprovador vêm preenchidos — nenhum vazio.
- Nas quatro solicitações o comportamento é idêntico: **nenhuma** abre sem o campo.
- Nenhum erro no console impede a montagem do bloco de aprovação.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A tela de aprovação abre **sem o campo de aprovação do gestor**, e o aprovador não tem como
  registrar a decisão. Processos afetados no ticket: **36133**, **37107**, **38728**, **39479**.

**Severidade:** Alta *(trava a cadeia de aprovação/alçada — sem o campo não há como decidir)*

**Preparação de massa:** **quatro** SCs do executor paradas em etapa de aprovação ao mesmo tempo,
com o executor como aprovador. Uma só não reproduz o padrão sistêmico que o ticket descreve. Quem
prepara: comprador (as SCs) + cadastro de alçada no Protheus (define quem aprova) — este último sem
credencial disponível.

**Verificado em tela:** PARCIAL
**O que foi verificado:** No formulário `256831`, revelando o DOM, a seção **Validação do Gestor**
existe com os rótulos **Gestor Imediato**, **Aprovador \***, **Email do Aprovador \***,
**Data da Aprovação \***, **Hora da Aprovação \***, **NºProcesso Fluig \***, **Nº SC Origem ERP \***,
**Cód. Filial Origem \***, **Aprovar? \*** e **Justificativa para a Aprovação/Reprovação \***. O
controle de decisão é um switcher do Fluig, registrado em `App/ViewHandler.js` linha 1446:
`FLUIGC.switcher.onChange("#managerAprovadoValidacao", ...)`, que grava `"Aprovado"` (linha 1449) ou
`"Reprovado"` (linha 1453) em `input[name=managerAprovadoValidacao]`; os campos ocultos
`tbmanag_aprovadoValidSim` / `tbmanag_aprovadoValidNao` estão no DOM. A atividade
`validacaoGestor: 7` está declarada. Na Central de Tarefas existe **1** tarefa em *Validação do
Gestor* (Sol. Compras 112830 — CASSI SEDE), de terceiro, **não aberta**.
**Divergências encontradas:** **sim.** O ticket diz "aprovação de alçada não está carregando o campo
de aprovação **do gestor**", mas na tela essas são **duas etapas separadas**, com campos diferentes:
**Validação do Gestor** (atividade 7, campo `managerAprovadoValidacao` — *Aprovar? \**) e
**Aprovação de Alçada** (atividade 94, grade `tbForneceAlcadas` de fornecedores e valores, com
`tbfornitens_aprovAuditoria`). O ticket não distingue as duas. O caso acima cobre as duas seções de
propósito; **quem for executar deve confirmar com o solicitante qual delas falhou**, senão o
resultado esperado fica ambíguo.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2278  (ambos · Concluído · SDCASSI-45)

**Título:** Enviar uma SC cujo produto tenha duas contas contábeis e confirmar que a validação orçamentária é gerada para os dois gestores, um por setor.

**Origem:** FSWTBC-2278 — o processo 40556 gerou aprovação para **dois** gestores orçamentários, o
que o usuário reportou como erro por enxergar "uma única conta". O retorno do endpoint
`/api/v1/fluig/integracao/compras/gestororcamentario/04001126` mostrou que o produto tem **duas
contas contábeis distintas** (`b1_xctad = 411511051036` e `b1_xctac = 468119019010`), **uma por
setor**, e cada setor tem seu gestor. **Comportamento correto**, percebido como defeito.

**Módulo/Rota:** Fluig → **Processos** → **Solicitação de Compras**
(`processID=wf_solicitacao_compras`) → etapa **Validação do Item Orçamentário** (formulário) /
**Validação Orçamentária** (Central de Tarefas); e Fluig → **Tracker**, filtro *Filtrar por:* =
**Aprovadores SC**. Dataset envolvido: `dsProtheus_getGestorOrcamentario_restGet`.

**Pré-condições**
- Um produto cadastrado no Protheus com **duas contas contábeis distintas** (`B1_XCTAD` e
  `B1_XCTAC`), de setores diferentes, cada um com gestor orçamentário definido.
- Um segundo produto com **uma única** conta contábil, para o contraste.
- **Bloqueio:** **sem credencial Protheus** — não posso confirmar `B1_XCTAD`/`B1_XCTAC` do produto
  nem quem é o gestor de cada setor; e não sou gestor, então não vejo as tarefas de validação.
  Verificável no Fluig pela **contagem de aprovadores** e pelo Tracker.

**Passos**
1. Abrir **Processos → Solicitação de Compras** e iniciar uma SC.
2. Incluir **um item** com o produto de **duas contas contábeis** (ex.: `04001126`).
3. Preencher o rateio e movimentar a SC até a etapa de validação orçamentária.
4. Abrir a solicitação em leitura por
   `/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=<nº>` e ler a aba
   **Histórico**.
5. Abrir o **Tracker**, filtrar por **Aprovadores SC** e informar o **Nº do Processo Fluig**.
6. Contar os aprovadores orçamentários listados.
7. Repetir os passos 1–6 com o produto de **conta contábil única**.

**Resultado esperado**
- Para o produto de **duas** contas contábeis, a SC gera **dois** aprovadores de validação
  orçamentária — um por setor/conta — e isso é **o resultado correto**, não um defeito.
- Para o produto de **uma** conta contábil, a SC gera **um** aprovador.
- O número de aprovadores é **igual ao número de contas contábeis distintas** do(s) produto(s) do
  item; nenhum aprovador duplicado para a mesma conta.
- No Tracker, o filtro **Aprovadores SC** lista os mesmos aprovadores que a Central de Tarefas.
- A etapa aparece rotulada como **Validação Orçamentária** (ou **Validação Orçamentária (Sem
  Gestor)**, quando não há gestor no setor) — nunca em branco.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Não há defeito a reincidir: o comportamento relatado (**dois gestores**) **é o correto**. O que
  reincide é a **percepção de erro**: a tela não mostra ao usuário **por que** há dois aprovadores,
  porque não exibe as duas contas contábeis do produto. Um "vermelho" aqui seria a SC gerando
  **um** aprovador para produto de duas contas — aí sim, defeito.

**Severidade:** Média — não há erro funcional; o risco é de aprovação indevida caso a contagem
passe a divergir do número de contas (aprovador de menos = conta sem validação).

**Preparação de massa:** um produto com `B1_XCTAD` e `B1_XCTAC` distintos, com gestores cadastrados
em cada setor, e um produto de conta única. **Não posso criar nem consultar isso** — é cadastro de
produto no Protheus. Sem esse dado, o caso só verifica a contagem sem saber a expectativa; peça ao
time CASSI os dois códigos de produto antes de executar. **Nota do ticket:** a base de TST ficou
fora por dois dias durante o diagnóstico original — confirme a disponibilidade antes de agendar.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei no fonte publicado do formulário da SC a chamada
`/api/public/ecm/dataset/search?datasetId=dsProtheus_getGestorOrcamentario_restGet&filterFields=CorporateId,<...>,BranchId,<...>,productID,<cod>&limit=300`
— a busca é **por produto** e devolve **lista**, o que confirma o mecanismo descrito no ticket
(um produto pode legitimamente devolver mais de um gestor). No **Tracker**, confirmei em tela o
filtro **Aprovadores SC**. No bundle do Portal do Comprador, confirmei os rótulos de etapa usados
hoje: **Validação do Gestor**, **Validação Orçamentária**, **Validação Orçamentária (Sem Gestor)**,
**Gerência de Compras** e **Validação do Comprador**.
**Divergências encontradas:** o ticket diz "gestor orçamentário" no singular e trata a duplicidade
como anomalia; a tela tem **duas etapas orçamentárias distintas** — *Validação Orçamentária* e
*Validação Orçamentária (Sem Gestor)* —, e o número de aprovadores é **derivado do produto**, não da
SC. Além disso, o *Total Estimado a Aprovar (R$)* só é montado nas atividades **14**, **269** ou com
`WKPanelBudgetItem=true`: se o cenário for o pool sem gestor, é a **269** que precisa ser exercitada.
**Dados/massa usados:** nenhum — não submetido, nenhuma SC iniciada.

---

## CT-FSWTBC-2279  (fluig · Concluído · SDCASSI-46)

**Título:** O comprador devolve a solicitação para negociação e, ao voltar, a grade de alçadas continua com uma linha por aprovação — sem duplicar o que já foi aprovado.

**Origem:** FSWTBC-2279 (SD770022) — ao retornar do 4º cenário (**"Retornar para Negociação"**), o
processo **duplicava a linha de aprovação de alçadas**; o processo 36586 voltou para alçada **depois**
de as alçadas já terem sido aprovadas. Outro caso citado: SC 33824. Defeito de **idempotência** no
retorno de fluxo, mesma classe de FSWTBC-1816 (montagem da PaiXFilho executando mais de uma vez) e
FSWTBC-1980 (SC em duas atividades). Duplicar linha de alçada significa **exigir aprovação já
concedida**, travando o processo. Corrigido em 17 dias, com "base tst fora para testes" no meio.

**Módulo/Rota:** *Solicitação de Compras* → **Validação do Comprador (Análise pós Alçadas)**
(`validacaoCompradorAlcadas`, 210) → combo **Enviar para \*** → opção **Retornar para Negociação**
→ `processoNegociacao` (50) → `aguardaFimNegociacao` (172) → `integracaoERP2` (177) →
`aguardaGeracaoAlcadas` (309) / `geraGridAlcadas` (310) → **Aprovação de Alçada** (94).

**Pré-condições**
- SC própria que já **passou** por *Aprovação de Alçada* e chegou a *Validação do Comprador (Análise
  pós Alçadas)*, com a grade de alçadas montada e as aprovações registradas.
- Perfil de comprador para escolher o destino do retorno.
- **Bloqueio:** **sim.** Exige uma SC própria já aprovada em alçada — não existe na conta de QA — e
  a ação de retorno é escrita em processo real. Nenhuma das 11 tarefas a concluir está em etapa pós-alçada.

**Passos**
1. Abrir a SC parada em **Validação do Comprador (Análise pós Alçadas)**.
2. **Antes de agir**, fotografar a seção **Aprovação de Alçada**: anotar **quantas linhas** a grade
   `tbForneceAlcadas` tem e quais estão aprovadas.
3. No combo **Enviar para \***, escolher a 4ª opção: **Retornar para Negociação**.
4. Preencher **Justificativa \*** e clicar em **Enviar**.
5. Deixar a negociação ser refeita e o processo voltar por `integracaoERP2` (177) e
   `geraGridAlcadas` (310) até **Aprovação de Alçada**.
6. Reabrir a SC e recontar as linhas da grade **Aprovação de Alçada**.
7. Conferir a aba **Histórico** e a seção **Rateio por Centro de Custo** (o rateio é remontado em
   todas as etapas do fluxo).

**Resultado esperado**
- A grade **Aprovação de Alçada** volta com **o número correto de linhas** — uma por alçada
  aplicável, **sem duplicatas**. A contagem do passo 6 é coerente com a do passo 2 (mesma quantidade
  se as condições não mudaram; recalculada, nunca somada à anterior).
- Nenhuma linha pede novamente uma aprovação **já concedida** antes do retorno.
- A SC fica em **uma única** atividade — não aparece simultaneamente em duas.
- A seção **Rateio por Centro de Custo** também é remontada **sem duplicar** linhas (o mesmo guard
  de idempotência vale para ela).
- A aba **Histórico** registra o retorno como uma movimentação única.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Após "Retornar para Negociação", a grade de alçadas volta com **linhas duplicadas**, exigindo
  aprovação já concedida e travando o processo. O processo **36586** voltou para alçada mesmo depois
  de as alçadas terem sido aprovadas; outro caso citado é a **SC 33824**.

**Severidade:** Alta *(duplica exigência de alçada — trava o processo e corrompe a trilha de aprovação)*

**Preparação de massa:** uma SC do executor levada **até depois** da aprovação de alçada, para então
ser devolvida à negociação. É a massa mais cara do lote: exige percorrer cotação → parecer →
negociação → alçada com credenciais de fornecedor e de aprovador. Quem prepara: comprador +
fornecedor de homologação + aprovador de alçada.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **A opção existe literalmente e é a 4ª do combo** — confirmando o "4º
cenário" do ticket. No formulário `256831`, o `select#buyerEnviarParaTreat` (rótulo **Enviar para \***,
seção *Validação do Comprador (Análise pós Alçadas)*) tem exatamente estas opções, nesta ordem:
*Selecione…* / **1. Retornar para Alçada - (Regerar Documento)** / **2. Retornar para Alçada - (Novo
Fornecedor)** / **3. Retornar para Cotação** / **4. Retornar para Negociação** / **5. Cancelar
Solicitação**. Ao lado dele há **Justificativa \***. A seção **Aprovação de Alçada** e a grade
`tbForneceAlcadas` foram confirmadas. As atividades do ciclo de retorno estão todas declaradas:
`validacaoCompradorAlcadas: 210`, `processoNegociacao: 50`, `aguardaFimNegociacao: 172`,
`integracaoERP2: 177`, `aguardaGeracaoAlcadas: 309`, `geraGridAlcadas: 310`, `aprovacaoAlcadas: 94`.
**A proteção contra a duplicação está no código servido hoje, e nomeada**: em `App/ViewHandler.js`
linha 113, o comentário
`//COMMENT NOTE: ** DEM10015025 - exibe o rateio em todas as etapas do fluxo (guard em
handleMountObjDTable evita duplicacao) **`, logo antes da chamada `this.handleLoopMountDTable()`.
Ou seja: a remontagem das grades a cada etapa passou a ter guard explícito de idempotência.
**Divergências encontradas:** o ticket chama a opção de "4º cenário"; na tela ela se chama
**Retornar para Negociação** e é, de fato, a 4ª opção do combo — os dois nomes batem, mas quem for
executar deve usar o rótulo, não a posição (a ordem pode mudar). Existe também um segundo combo de
retorno na mesma família, `anLockBudgEnviarParaTreat` (*Retornar para Aguardar Geração* / *Encerrar
Solicitação*), ligado à trava orçamentária — não é o do ticket, e não deve ser confundido com ele.
**Dados/massa usados:** nenhum — não submetido.

---

# Resumo do lote

| Caso | Verificado | Severidade | Bloqueio principal |
|---|---|---|---|
| CT-FSWTBC-2084 | PARCIAL | Alta | corpo do e-mail não tem superfície no Fluig; valor do ERP exige Protheus |
| CT-FSWTBC-2105 | PARCIAL | Alta | conversão de versão de instância é de administrador; sem SC em alçada |
| CT-FSWTBC-2129 | PARCIAL | Média | conclusão exigiria enviar a SC |
| CT-FSWTBC-2142 | PARCIAL | Alta | encerrar medição é escrita irreversível; sem massa de medição |
| CT-FSWTBC-2157 | PARCIAL | Média | gatilho é um deploy; ECM exige perfil |
| CT-FSWTBC-2186 | PARCIAL | Alta | sem credencial de fornecedor para anexar propostas |
| CT-FSWTBC-2236 | PARCIAL | Média | falha de pool não se provoca por tela; log exige admin |
| CT-FSWTBC-2237 | PARCIAL | Alta | exige duas contas de gestor orçamentário |
| CT-FSWTBC-2238 | PARCIAL | Média | porta do broker não tem superfície no Fluig |
| CT-FSWTBC-2242 | PARCIAL | Média | duplicata de 2243; sem tarefa de parecer atribuída |
| CT-FSWTBC-2243 | PARCIAL | Média | sem tarefa de parecer atribuída à conta de QA |
| CT-FSWTBC-2244 | PARCIAL | Média | só um ambiente acessível; paridade PRD × TST não confirmável |
| CT-FSWTBC-2245 | PARCIAL | Alta | sem SC em etapa de aprovação atribuída ao executor |
| CT-FSWTBC-2279 | PARCIAL | Alta | exige SC já aprovada em alçada (massa mais cara do lote) |

**Contagem:** 14 casos · **0 SIM (total)** · **14 PARCIAL** · **0 NÃO**.

Nenhum caso é SIM porque nenhum cenário pôde ser **executado até o fim**: os 14 dependem de uma SC
ou medição própria em etapa específica, e a conta de QA não tem nenhuma (as 11 tarefas a concluir
são de terceiros, em *Correção* e *Validação do Gestor*). Em todos os 14, porém, foram verificados
em tela o **caminho**, os **rótulos reais** e — em 6 deles — a **regra de validação servida hoje**,
lida no JavaScript que o próprio ambiente entrega.

## CT-FSWTBC-2347  (fluig · Concluído · SDCASSI-57)

**Título:** Enviar uma Solicitação de Compras com muitos itens e a integração com o ERP disparar uma vez por solicitação, não uma vez por item.

**Origem:** FSWTBC-2347 — SD772313. A atividade de serviço `wf_solicitacao_compras.servicetask177`
gerava **198 integrações no lugar de 2**, em proporção à quantidade de itens da SC (laço aninhado).
Segunda passada no mesmo ponto — a primeira foi o SDCASSI-36, que removeu um `FOR` mas deixou
consultas a mais.

**Módulo/Rota:** Solicitação de Compras — `/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`.
Atividades de serviço envolvidas: **Grava SC e Anexos** e **Integração com ERP**. Evidência pós-envio
na aba **Histórico** da solicitação e em `GET /process-management/api/v2/requests/<id>?expand=activities`.

**Pré-condições**
- Uma SC criada pelo próprio executor com **quantidade alta de itens** (o defeito escalava com o número
  de itens: 198 integrações ⇒ ~99 itens). Um comparativo com 1–2 itens serve de controle.
- Contrato/planilha que sustente os itens, ou itens avulsos por *Adicionar Produto*.
- **Bloqueio:** **sim, parcial** — comprovar a contagem exige **enviar** a SC (escrita irreversível no
  Protheus, fora da política desta rodada) e, no caso ideal, acesso ao `server.log` do Fluig para contar
  as chamadas de integração. Sem o log, a aproximação verificável é o **tempo** da atividade de serviço,
  que foi medido (tabela acima). A massa de contrato está indisponível hoje (grade de contratos vazia).

**Passos**
1. Abrir a Solicitação de Compras e preencher *Justificativa para a Solicitação*, filial e **um único item**
   em *Produtos/Serviços da Solicitação*. Enviar. Anotar o `processInstanceId`.
2. Abrir a aba **Histórico** da instância e anotar a duração das atividades **Grava SC e Anexos** e
   **Integração com ERP**.
3. Repetir com uma SC de **muitos itens** (dezenas), tudo o mais igual.
4. Comparar as durações das mesmas duas atividades entre as duas instâncias.
5. Se houver acesso ao `server.log`, contar as chamadas de integração emitidas por cada instância.

**Resultado esperado**
- O número de integrações disparadas é **função da solicitação, não da quantidade de itens**: a SC de
  muitos itens dispara a **mesma ordem de grandeza** de chamadas que a de um item (o ticket cita 2 como
  o valor correto).
- A duração de **Grava SC e Anexos** permanece na faixa medida hoje — **11 s a 326 s, média 97,7 s** em
  22 amostras — e **não cresce linearmente** com a quantidade de itens.
- A duração de **Integração com ERP** permanece na faixa medida hoje — **4 s a 976 s, média 148,1 s** em
  7 amostras.
- A SC conclui a etapa de serviço e avança para **Validação do Gestor** sem timeout.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- **198 integrações no lugar de 2** para uma única SC, número proporcional à quantidade de itens, com
  lentidão perceptível na `servicetask177`. Mensagem de erro exata: `<não documentado>` — o defeito se
  manifestava como lentidão, não como mensagem.
- A duração de **Grava SC e Anexos** cresce proporcionalmente ao número de itens.

**Severidade:** Média *(degrada e pode travar o fluxo por timeout; sem risco financeiro direto)*

**Preparação de massa:** duas SCs criadas **pelo próprio executor**, uma com 1 item e outra com dezenas
de itens, na mesma filial e no mesmo contrato — e a liberação para enviá-las (escrita no Protheus). Para
a contagem exata de integrações, acesso ao `server.log` do Fluig no período, que só o time de
infraestrutura fornece.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário da SC abre pela rota de início com heading *Início*, abas
*Formulário / Informações / Histórico / Anexos / AdHoc / Apontamentos* e botão *Enviar*; a seção
*Produtos/Serviços da Solicitação* e o botão *Adicionar Produto* existem. As duas atividades de serviço
citadas foram **medidas em 34 instâncias reais** via API de leitura: *Grava SC e Anexos* (22 amostras,
11–326 s, média 97,7 s) e *Integração com ERP* (7 amostras, 4–976 s, média 148,1 s). A sequência completa
foi observada na instância **112854** (FINALIZED, 44 movimentos).
**Divergências encontradas:** o ticket nomeia a atividade por identificador técnico (`servicetask177`);
em tela e na API as atividades de serviço da SC aparecem com nome de negócio — **Grava SC e Anexos**,
**Integração com ERP**, **Distribuição Gestor Orçamentario**, **Distribuição Comprador**, **Processo de
Cotação**, **Processo de Negociação**, **Gerar Grid de Alçada**, **Disparo de E-mails**. Não há como,
pela tela, saber qual delas é a `servicetask177`.
**Dados/massa usados:** nenhum — não submetido. Só leitura de instâncias já existentes.

---

## CT-FSWTBC-2348  (ambos · Concluído · SDCASSI-58)

**Título:** Conferir que a Filial de Entrega enviada ao ERP é a filial real do item, e não o valor padrão "01", antes que a nota chegue ao RDFC.

**Origem:** FSWTBC-2348 — erro nos processos 43233, 43973, 43977 e 43981 no **RDFC (Recepção de
Documentos Fiscais - Compras)**: *"Falha ao incluir NF, chave de pesquisa
5303000000001001528394300001N, Erro AJUDA:REGNOIS Não existe registro relacionado a este código.
Tabela SF1"*. Causa-raiz: **divergência de filial de entrega** — a SC estava com `C1_FILENT = '01'`
e o `C8_FILENT` da cotação também vinha com o **valor padrão '01' enviado pelo Fluig**. Como a chave
da NF carrega a filial (`5303…`), o Protheus procurava na filial errada. **O erro aparece no RDFC
mas nasce lá atrás, no envio do Fluig.** Correção coube à equipe Fluig; acompanhamento na subtarefa
FSWTBC-2363.

**Módulo/Rota:** Fluig → **Processos** → **Solicitação de Compras** (campo **Cód. Filial Origem**) →
**Cotação de Produtos/Serviços** e **Negociação de Cotação** (campo **Fil. Entrega**) → **Recepção
de Documentos Fiscais** (visível no **Tracker**, filtro *Filtrar por:* = *Recepção de Documentos
Fiscais*).

**Pré-condições**
- Uma SC de uma filial que **não seja a 01** (ex.: `5303`), com item cuja entrega seja nessa filial.
- A cotação gerada a partir dessa SC.
- **Bloqueio:** duplo. (a) **Sem credencial Protheus** — `C1_FILENT`, `C8_FILENT` e a SF1 não são
  inspecionáveis por mim. (b) Levar o caso até o RDFC exige **emitir/receber nota fiscal**, o que
  não é executável nesta rodada. O que **é** verificável no Fluig: qual valor o campo **Fil.
  Entrega** exibe na cotação, antes de qualquer envio.

**Passos**
1. Abrir **Processos → Solicitação de Compras** e iniciar uma SC para uma filial diferente de `01`
   (ex.: `5303`), conferindo o campo **Cód. Filial Origem**.
2. Incluir um item e movimentar a SC até gerar a **Cotação de Produtos/Serviços**.
3. Abrir a cotação e localizar, na grade de itens, o campo **Fil. Entrega**.
4. Conferir o valor exibido em **Fil. Entrega** para cada item.
5. Abrir a **Negociação de Cotação de Produtos/Serviços** e repetir a conferência do campo **Fil.
   Entrega**.
6. Abrir o **Tracker**, filtro **Recepção de Documentos Fiscais**, e conferir se há processos em
   erro para a filial em questão.

**Resultado esperado**
- **Fil. Entrega** exibe a **filial real do item** (ex.: `5303`) — **nunca** `01` quando a SC não é
  da filial 01.
- O valor de **Fil. Entrega** na Cotação é **o mesmo** da **Cód. Filial Origem** da SC de origem;
  não há um default aplicado no caminho.
- O mesmo valor se mantém na **Negociação**.
- No **Tracker**, filtrando por *Recepção de Documentos Fiscais*, não há processos com falha de
  inclusão de NF por filial divergente.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- **Fil. Entrega** vem `01` em cotação de SC da filial `5303`; mais adiante, no RDFC, os processos
  43233 / 43973 / 43977 / 43981 falham com *"Falha ao incluir NF, chave de pesquisa
  5303000000001001528394300001N, Erro AJUDA:REGNOIS Não existe registro relacionado a este código.
  Tabela SF1"*.

**Severidade:** Alta — a nota fiscal não entra, o pagamento ao fornecedor trava, e o erro se
manifesta a três etapas de distância da causa, o que torna o diagnóstico caro.

**Preparação de massa:** uma SC de filial diferente de `01` (ex.: `5303`), criada pelo executor, com
item que gere cotação. Para fechar o caso até o RDFC seria preciso **uma nota fiscal do fornecedor**
— massa que não pode ser fabricada aqui. **O passo 3 sozinho já detecta o defeito**, e é o passo que
recomendo como regressão barata.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei nos formulários publicados os campos exatos deste caso. Na
**SC**: *Código da Filial*, *Nome da Filial* e **"Cód. Filial Origem"**. Na **Cotação** e na
**Negociação**: **"Fil. Entrega"**, implementado como três campos —
`txt_codFilEntrega` (hidden), `txt_nomfilEntrega` (hidden) e `txt_descFilEntrega`, este último o
**visível**. No **Tracker**, confirmei em tela o filtro **Recepção de Documentos Fiscais**.
**Divergências encontradas:** **achado relevante para a pendência do ticket.** O campo visível
**Fil. Entrega** (`txt_descFilEntrega`) é **`readonly`** nos dois formulários — Cotação e
Negociação. Ou seja: o valor é **herdado**, o usuário **não consegue corrigi-lo em tela**, e um
`'01'` que chegue ali **só pode ser consertado na origem (a SC)**. Isso tem duas consequências
práticas: (a) qualquer roteiro que mande "corrigir a filial de entrega na cotação" é inexecutável;
(b) a correção do defeito **tem obrigatoriamente** de estar no que o Fluig envia, nunca numa
conferência do comprador. Registro também que o ticket fecha em 12/08 dizendo *"será alterado pela
equipe do FLUIG"*, e a subtarefa FSWTBC-2363 não tem descrição do ajuste — **não há registro técnico
de que o default '01' tenha sido removido**, então este caso pode reprovar hoje.
**Dados/massa usados:** nenhum — não submetido, nenhuma SC iniciada.

---

## CT-FSWTBC-2547  (ambos · Concluído · SDCASSI-73)

**Título:** O aprovador abre uma SC em Aprovação de Alçada cujo fornecedor vencedor tem muitos
itens e vê a grade da empresa vencedora completa, sem truncamento.

**Origem:** FSWTBC-2547 (SD775891 / incidente 775891) — o carregamento de alçadas do *script 201*
concatenava vários itens do mesmo fornecedor **em um único campo** e, com muitos itens, o
conteúdo **excedia o tamanho do campo**. Defeito de dimensionamento, só visível com volume real.
Corrigido pelo PR54803, aplicado pela MUD16255 em 04/09/2025.

**Módulo/Rota:** **Solicitação de Compras** (`wf_solicitacao_compras`, form **256831**),
atividade **94 – Aprovação de Alçada**; seção **"Aprovação de Alçada"**, grade **`tbForneceAlcadas`**
(a da *Empresa Vencedora*). Diagnóstico em *Logs Protheus* › **Erros CV8**.

**Pré-condições**
- Uma SC que chegou à atividade 94, com **um fornecedor vencedor carregando muitos itens**
  (o defeito só aparece com volume — um fornecedor com dezenas de itens de cotação).
- Perfil aprovador de alçada, ou a linha atribuída ao pool da alçada.
- **Bloqueio:** **sim** — a conta de QA não resolve matrícula de comprador/aprovador (§5-C), então
  as linhas de `tbAlcadas`/`tbForneceAlcadas` ficam ocultas para este login; e não há na base uma
  SC na atividade 94 com fornecedor de alto volume que possa ser usada sem alterá-la.

**Passos**
1. Abrir a SC na atividade **94 – Aprovação de Alçada**.
2. Localizar a seção **"Aprovação de Alçada"** e a grade da **Empresa Vencedora**
   (`tbForneceAlcadas`), com as colunas **Empresa Vencedora**, **CNPJ/CPF**,
   **Valor da Compras (R$)**, **Valor do Frete (R$)**, **Nº Pedido** e **Nº Contrato**.
3. Expandir o card de itens do fornecedor vencedor (montado a partir do campo
   `tbfornalc_jsonItemCot___<linha>`) e **contar os itens exibidos**.
4. Conferir esse número contra a quantidade de itens da proposta vencedora na cotação de origem.
5. Abrir *Logs Protheus* › **Erros CV8**, informar o *Id Fluig* do processo e clicar **Consultar**.

**Resultado esperado**
- A grade da **Empresa Vencedora** exibe **todos** os itens do fornecedor — a contagem do passo 3
  é **igual** à do passo 4, sem item faltando e sem o último item cortado no meio.
- O JSON de `tbfornalc_jsonItemCot___<linha>` é **parseável**: o card renderiza; nenhuma linha
  aparece vazia nem some da grade.
- Os valores **Valor da Compras (R$)** e **Valor do Frete (R$)** batem com a proposta vencedora.
- Em **Erros CV8**, **nenhuma** ocorrência de erro de tamanho/truncamento para esse *Id Fluig*.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Estouro de limite de campo no carregamento das alçadas (script 201): com muitos itens do mesmo
  fornecedor, o conteúdo concatenado excede o tamanho e a carga falha. Mensagem exata
  `<não documentado>` — a evidência é o print `Captura de tela 2025-08-27 172326.png`, não anexado
  ao item em texto.
- Sintoma esperado no Fluig: a grade da Empresa Vencedora vem **incompleta** ou o card de itens
  **não renderiza**, porque `tbfornalc_jsonItemCot___<linha>` chega truncado e o `JSON.parse` falha.

**Severidade:** Alta — alçada aprovada sobre uma lista de itens incompleta aprova valor errado.

**Preparação de massa:** uma SC na atividade 94 cujo **fornecedor vencedor tenha muitos itens**
(o cenário de volume é a condição de ativação do defeito) e uma conta com perfil de alçada.
**Não pode ser criada pelo executor de QA** — depende de comprador cadastrado no ERP e de percorrer
cotação e negociação até a alçada.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Lido no fonte publicado* — o formulário 256831 tem a seção
**"Aprovação de Alçada"** e **duas** grades distintas: `tbForneceAlcadas` (colunas *Empresa
Vencedora*, *CNPJ/CPF*, *Valor da Compras (R$)*, *Valor do Frete (R$)*, *Nº Pedido*, *Nº Contrato*)
e `tbAlcadas` (campos `tbalcada_*`: *Aprovador*, *Email do Aprovador*, *Data da Aprovação*,
*Hora da Aprovação*, *Aprovar?*, *Justificativa para a Aprovação/Reprovação*).
`handleLoopMountDTableAuthority()` percorre `tbForneceAlcadas` lendo
**`tbfornalc_jsonItemCot___<idx>`** — é este o campo único que concentra os itens do fornecedor,
ou seja, **a estrutura que estourou continua sendo um campo JSON por fornecedor**. O BPM tem as
atividades **309 `aguardaGeracaoAlcadas`**, **310 `geraGridAlcadas`**, **94 `aprovacaoAlcadas`** e a
correção **311 "Correção - Gerar Grid de Alçada"**. *Visto renderizado* — *Logs Protheus* › aba
**Erros CV8** com os filtros *Id Fluig*, *Filial*, *Data inicial*, *Data final*, *Texto* e o botão
**Consultar**; `genericQuery` **404**.
**Divergências encontradas:** o ticket fala de "carregamento de alçadas" como uma coisa só; na tela
são **duas grades** com finalidades diferentes (`tbForneceAlcadas` = empresa vencedora;
`tbAlcadas` = aprovadores) — citar "a grade da alçada" sem qualificar não identifica o campo, como
o próprio briefing alerta. Além disso o rótulo é **"Valor da Compras (R$)"** (com erro de
concordância) nesta grade, contra "Valor da Compra (R$)" no painel principal.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2668  (fluig · Concluído · SDCASSI-88)

**Título:** Quando a API que busca o Gestor Orçamentário falha, a Solicitação de Compras desvia para a atividade de Correção — e não segue como se não houvesse gestor.

**Origem:** FSWTBC-2668 — SD777352. A **SC 50098** não caiu para o gestor orçamentário: houve **erro na
integração**, a API não conseguiu pesquisar o Gestor Orçamentário e o processo **seguiu para a atividade
"Sem Gestor Orçamentário"**. A atividade de serviço tinha atividade de **Correção** associada, mas o erro
de API **não desviava** para lá — tratava **falha técnica como resultado de negócio** ("não existe
gestor"), fazendo a SC seguir **sem a aprovação orçamentária devida**. Corrigido e aplicado em produção via
**PR 55716 / MUD16348**.

**Módulo/Rota:** Solicitação de Compras — atividade de serviço **Distribuição Gestor Orçamentario**,
gateways **Itens com Gestor?** / **Itens sem Gestor?**, atividade **Validação Orçamentária** e atividade
**Correção**. Seção do formulário: **Validação do Item Orçamentário**.

**Pré-condições**
- Uma SC enviada, com itens que exijam validação orçamentária.
- Um cadastro de gestor orçamentário **existente** para o centro de custo dos itens (para distinguir
  "não há gestor" de "não consegui perguntar").
- Um meio de **derrubar a API de consulta ao gestor** no instante em que a atividade de serviço roda.
- **Bloqueio:** **sim** — exige (a) enviar SC, (b) provocar falha controlada da integração e (c) ler o
  `server.log`, que foi a evidência original do ticket (79 MB, anexo não baixado). A conta de QA não faz
  nenhuma das três.

**Passos**
1. Enviar uma SC com itens sujeitos a validação orçamentária e anotar o `processInstanceId`.
2. Acompanhar o histórico até a atividade de serviço **Distribuição Gestor Orçamentario**.
3. Com a API de consulta ao gestor **fora do ar**, deixar a atividade de serviço executar.
4. Ler a atividade seguinte no **Histórico** da solicitação (ou em
   `GET /process-management/api/v2/requests/<id>?expand=activities`).
5. Repetir o cenário com a API **no ar** e um centro de custo **sem** gestor cadastrado.
6. Comparar os dois desfechos.

**Resultado esperado**
- Com **erro de API**, a SC vai para a atividade **Correção** — falha técnica é tratada como falha técnica.
- Com a **API respondendo** e **nenhum gestor cadastrado**, a SC segue o caminho de negócio (gateway
  **Itens sem Gestor?**) — resultado de negócio é tratado como resultado de negócio.
- Os dois caminhos são **distinguíveis no histórico**: nunca o mesmo desfecho para as duas causas.
- Nenhuma SC chega a **Sol. Validação Orçamentária** / **Distribuição Comprador** sem que a validação
  orçamentária tenha ocorrido ou tenha sido explicitamente dispensada por regra.
- A seção **Validação do Item Orçamentário** do formulário registra o aprovador quando houve gestor.

**Resultado se o defeito reincidir**
- Com a API em erro, a SC segue para a atividade que representa "não existe gestor" (no ticket, **"Sem
  Gestor Orçamentário"**) em vez de **Correção**, e prossegue no fluxo **sem aprovação orçamentária** —
  caso concreto: **SC 50098**. O erro aparece no `server.log`, não na tela: a interface **não** dá sinal.
- Alerta registrado no próprio ticket e **nunca varrido**: o mesmo padrão — falha técnica de API lida como
  resultado de negócio — pode existir em **outras** atividades de serviço do mesmo processo. Ao executar
  este caso, vale repetir o teste em **Distribuição Comprador** e **Integração com ERP**.

**Severidade:** Alta *(a SC avança sem a aprovação de alçada orçamentária — risco de aprovação indevida e
de comprometimento orçamentário sem gestor)*

**Preparação de massa:** uma SC do executor com itens que exijam validação orçamentária, um centro de
custo **com** gestor cadastrado no Protheus, e uma janela combinada com o time Fluig/infra para derrubar a
API de consulta ao gestor durante a execução da atividade de serviço. Acesso ao `server.log` do período.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o desenho do fluxo foi lido em 34 instâncias reais de SC. A atividade de serviço
**Distribuição Gestor Orçamentario** existe e foi medida (16 amostras, 2–69 s, média 10 s), seguida de
**Paralelo**, dos gateways **Itens com Gestor?** e **Itens sem Gestor?**, da atividade **Validação
Orçamentária** e do **Join**. A atividade **Correção** existe no processo e foi observada em execução na
instância **112854** (duas passagens consecutivas, 1795 s e 2223 s, logo após um *Integração com ERP* de
976 s) — ou seja, **o desvio para Correção após erro de integração é um caminho real e exercitado hoje**.
No formulário da SC, a seção **Validação do Item Orçamentário** existe, com **Aprovador \***, **Email do
Aprovador \***, **Data/Hora da Aprovação**, **Nº SC Origem ERP \***, **Aprovar? \*** e **Total Estimado a
Aprovar (R$) \***. A Central de Tarefas mostra hoje três SCs paradas em **Correção** (112556, 112584, 113196).
**Divergências encontradas:** **relevante.** O ticket nomeia a atividade de destino como **"Sem Gestor
Orçamentário"**; em 34 instâncias de SC amostradas **não aparece nenhuma atividade com esse nome**. O que
existe hoje é o par de gateways **"Itens com Gestor?"** e **"Itens sem Gestor?"**, que convergem em um
**Join** — ou seja, ou a atividade foi renomeada/removida na correção, ou ela só se materializa no ramo que
a amostra não percorreu. Antes de executar este caso, confirme com o time Fluig qual é o nome atual da
atividade. Note também a grafia sem acento no ambiente: **"Distribuição Gestor Orçamentario"**.
**Dados/massa usados:** nenhum — não submetido; só leitura de instâncias existentes.

---

## CT-FSWTBC-2681  (ambos · Concluído · SDCASSI-91)

**Título:** Uma SC enviada para validação cai para o **gestor imediato** do solicitante, e a grade
"Gestor Imediato" mostra esse gestor — não um colega da mesma área.

**Origem:** FSWTBC-2681 (incidente 777919) — a **SC 51741** não caiu para o gestor imediato (Jair
Dimas Carvalho) e sim para um colaborador da área (Roberto de Souza Linhares). **Não é defeito de
código**: no cadastro de **substituto (tabela RCX)** havia **dois superiores sem data de
finalização**; sem data de fim o sistema desempata trazendo o que ocupa o posto há mais tempo — que
não era o gestor correto.

**Módulo/Rota:** **Solicitação de Compras** (`wf_solicitacao_compras`, form **256831**), atividade
**7 – Validação do Gestor**; seção **"Validação do Gestor"**, grade **`tbManager`** (cabeçalho
**"Gestor Imediato"**). Fila: *Central de Tarefas* (`/portal/p/1/pagecentraltask`).

**Pré-condições**
- Um solicitante cujo **gestor imediato seja conhecido e inequívoco**.
- Cadastro de substituto/superior do solicitante com **exatamente um** vínculo vigente
  (os demais com data de finalização preenchida).
- **Bloqueio:** **parcial** — o cadastro de superior/substituto é do RH no ERP (**RCX**) e **não
  tem tela no Fluig**; a *pré-condição* (um único superior vigente) não é verificável nem ajustável
  por esta conta. O **efeito** é integralmente verificável no Fluig.

**Passos**
1. Criar/abrir uma SC e enviá-la para a atividade **7 – Validação do Gestor**
   *(nesta rodada nada foi submetido — ver "Verificado em tela")*.
2. Abrir a SC e localizar a seção **"Validação do Gestor"**.
3. Na grade **Gestor Imediato** (`tbManager`), ler os campos **Aprovador** e
   **Email do Aprovador**.
4. Conferir esse nome/e-mail contra o gestor imediato do solicitante.
5. Conferir também o **Nº SC Origem ERP** e o **Cód. Filial Origem** da mesma linha.
6. Na *Central de Tarefas*, confirmar que a tarefa está na fila **do gestor** — clicando
   explicitamente na sub-aba desejada (a Central guarda a sub-aba por sessão no servidor).

**Resultado esperado**
- A grade **Gestor Imediato** traz **uma única linha ativa** (`tbmanag_historico = "false"`) e o
  campo **Aprovador** é **o gestor imediato do solicitante**, não um par da mesma área.
- **Email do Aprovador** é o e-mail desse gestor.
- A tarefa aparece na fila do gestor; se o vínculo direto não resolver, ela cai no pool
  **`Pool:Group:G.P.Requisicao_de_Compras_Gestor_Imediato`** — nunca num colaborador sem
  subordinação.
- Se houver substituto vigente, o formulário registra o substituto em
  `tbmanag_mailSubstitute` **sem** trocar o aprovador titular.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A SC cai para **um colaborador da área que não é o gestor** (no caso original, Roberto de Souza
  Linhares no lugar de Jair Dimas Carvalho, SC **51741**). A grade **Gestor Imediato** mostra esse
  nome no campo **Aprovador**. Não há mensagem de erro — a SC segue normalmente para a pessoa
  errada. Evidência original: `Screenshot_9.jpg`.

**Severidade:** Alta — aprovação de compra por quem não tem alçada sobre o solicitante é falha de
controle, não de usabilidade.

**Preparação de massa:** uma SC de um solicitante cujo cadastro de superior no RH tenha **um único
vínculo vigente**. **O QA não pode preparar isso** — depende de ajuste na RCX pelo RH. Para
exercitar o cenário de falha seria preciso um solicitante com **dois superiores sem data de
finalização**, o que **não deve ser criado** de propósito.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Lido no fonte publicado* — o form 256831 tem a seção
**"Validação do Gestor"**, a grade **`tbManager`** com o cabeçalho **"Gestor Imediato"** e os
rótulos **Aprovador ***, **Email do Aprovador ***, **Data da Aprovação ***, **Hora da Aprovação ***,
**NºProcesso Fluig ***, **Nº SC Origem ERP ***, **Cód. Filial Origem ***, **Aprovar? *** (Sim/Não) e
**Justificativa para a Aprovação/Reprovação ***. Em `handleRowsManager()` a linha só é exibida se
`tbmanag_codERPUserValid` for igual ao código ERP do usuário logado, **ou** o usuário for
substituto válido (`dsFluig_getAllValidSubstitute`, filtrado por `userId`+`substituteId`), **ou** a
matrícula da linha for o pool `"Pool:Group:G.P.Requisicao_de_Compras_Gestor_Imediato"` — caso
contrário a linha é **escondida**. A atividade é a **7 (`validacaoGestor`)** e o switcher é
`managerAprovadoValidacao`.
**Divergências encontradas:** (a) o ticket diz "aprovação do gestor imediato" como etapa única; na
tela **Validação do Gestor (7)** e **Aprovação de Alçada (94)** são **duas** etapas distintas;
(b) **achado de risco, do próprio código**: em `handleManagerSwitcher()` e
`handleAuthorityApprovalSwitcher()`, o switcher **não tocado** é lido como **`"Reprovado"`**
(`$(o).is(":checked") ? "Aprovado" : "Reprovado"`) — não existe estado "não decidido". Um aprovador
que movimenta a SC sem tocar no controle **reprova** silenciosamente. Vale reportar ao time.
**Dados/massa usados:** nenhum — não submetido; nenhuma SC foi criada, aprovada ou reprovada.

---

## CT-FSWTBC-2684  (fluig · Concluído · SDCASSI-93)

**Título:** Finalizar a compra e o e-mail ao fornecedor vencedor chegar com todos os itens aprovados, o valor total do pedido e sem acumular itens de rodadas anteriores.

**Origem:** FSWTBC-2684 — SD778023. O e-mail de finalização de compras enviado ao **fornecedor** não chegava
com todos os itens aprovados na SC (exemplo: **SC 30673**). Corrigido em **duas rodadas**: a primeira
resolveu a lista de produtos, e a homologação revelou dois resíduos — (a) o e-mail **não trazia o valor
total do pedido**; (b) fornecedor que participou da primeira rodada de cotação **e** de rodadas seguintes
recebia e-mail com a **quantidade de itens aumentada**, porque o template **somava itens de rodadas
anteriores**. Segunda correção em produção via **PR 56539 / MUD16448**. Relaciona-se ao FSWTBC-2546, que
alterou os templates de vencedor incluindo Quantidade, Preço e Frete.

**Módulo/Rota:** Solicitação de Compras — atividade de serviço **Disparo de E-mails** (após
*Pedido/Contrato foi Gerado?* e *Aguarda Vigência do Contrato*). Contraparte na cotação/negociação:
atividade **Notifica Fornecedor**.

**Pré-condições**
- Uma SC levada até a geração de pedido/contrato, com **múltiplos itens aprovados** (o defeito só é visível
  com vários).
- Um fornecedor vencedor que tenha participado de **mais de uma rodada de cotação** — é essa a condição
  que produzia a quantidade inflada.
- Uma **caixa de e-mail acessível** (do fornecedor ou uma caixa de teste configurada como destinatário).
- **Bloqueio:** **sim, e de natureza diferente dos demais.** O conteúdo do e-mail **não tem superfície
  alguma no Fluig**: não há tela que mostre o corpo da mensagem enviada ao fornecedor. O Fluig só expõe
  **que** o disparo ocorreu (atividade *Disparo de E-mails* no histórico), **não o que foi enviado**. A
  verificação exige acesso à caixa do destinatário ou ao log de e-mail do servidor — nenhum dos dois
  disponível nesta rodada. **Não simule cobertura**: este caso é verificável apenas em parte pelo Fluig.

**Passos**
1. Levar uma SC com **N itens aprovados** (N ≥ 3) até a geração do pedido/contrato, garantindo que o
   fornecedor vencedor tenha participado de **duas ou mais rodadas** de cotação.
2. Acompanhar o histórico da solicitação até a atividade **Disparo de E-mails** e confirmar que ela executou.
3. Abrir a caixa do fornecedor e localizar o e-mail de finalização de compras.
4. **Contar** os itens listados no e-mail e comparar com os **N itens aprovados** na SC.
5. Conferir se o e-mail traz o **valor total do pedido**.
6. Conferir Quantidade, Preço e Frete de cada item contra a SC.
7. Repetir com um fornecedor que participou de **uma única** rodada — controle.

**Resultado esperado**
- O e-mail lista **exatamente os N itens aprovados** — nem a menos (defeito original) nem a mais (resíduo
  do acúmulo entre rodadas).
- O e-mail traz o **valor total do pedido**.
- Cada item traz **Quantidade**, **Preço** e **Frete** coerentes com a SC.
- A contagem de itens é **idêntica** para fornecedor de uma rodada e de várias rodadas — o número de
  rodadas **não** influencia a quantidade listada.
- No Fluig, a atividade **Disparo de E-mails** conclui sem erro.

**Resultado se o defeito reincidir**
- O e-mail chega com **menos itens** do que os aprovados na SC — sintoma original (**SC 30673**).
- Ou, na variante que passou pela primeira homologação: e-mail **sem o valor total** e, para fornecedor
  multi-rodada, com a **quantidade de itens aumentada** pelo acúmulo entre rodadas.
- Texto exato do template: `<não documentado>` — o ticket traz prints, não o corpo do e-mail.

**Severidade:** Alta *(comunicação a público externo com quantidade de itens incorreta tem impacto
contratual — o fornecedor entrega pelo que leu; e o defeito já passou por uma homologação sem ser pego)*

**Preparação de massa:** uma SC com 3+ itens aprovados e um fornecedor vencedor que tenha participado de
**duas rodadas de cotação** — cenário que só o time de Compras monta. **E**, indispensável: acesso à caixa
de e-mail de destino, ou o redirecionamento do template para uma caixa de teste. Sem isso o caso não fecha,
por mais que a SC seja criada.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a atividade de serviço **Disparo de E-mails** existe no BPM da SC e foi observada
executando na instância **112854** (**141 s**), na posição exata que o ticket descreve — depois de
*Aguarda Vigência do Contrato* e antes do gateway *Contrato?*. A atividade **Notifica Fornecedor** existe
tanto na Cotação (13 amostras, 1–4 s, média 1,7 s) quanto na Negociação (14 amostras, 1–2 s). No formulário
da SC, os campos que alimentam o e-mail de vencedor existem na seção *Validação do Comprador (Análise pós
Alçadas)*: **Empresa Vencedora \***, **CNPJ/CPF \***, **Valor da Compras (R$) \***, **Valor do Frete (R$) \***,
**Nº Pedido\***, **Nº Contrato\***, **Valor da Compra (R$) \***, **Total a ser Aprovado (R$) \***, **Valor
Vigente do Contrato (R$)** e **Total com Aditivo (R$)**.
**Divergências encontradas:** nenhuma entre ticket e tela. **Registro explícito de limite de cobertura:**
não existe, em nenhuma das quatro superfícies do Fluig que expõem efeito de integração (Histórico, campo
*Erro retornado pelo ERP Protheus*, modal de Informações Complementares do Contrato, Tracker), **qualquer
lugar que mostre o conteúdo do e-mail enviado**. O Fluig prova o disparo, não a composição. Este caso é
intrinsecamente parcial pelo Fluig.
**Dados/massa usados:** nenhum — não submetido, nenhum e-mail disparado.

---

## CT-FSWTBC-2689  (fluig · Concluído · SDCASSI-97)

**Título:** Comprador devolve a cotação para a Solicitação de Compras e a lista de fornecedores/itens é regravada por inteiro, sem erro.

**Origem:** FSWTBC-2689 — “Erro ao retornar com a cotação na SC 50300”. O ticket traz o próprio
patch: em `wf_solicitacao_compras.beforeTaskSave`, remover os filhos do card iterando **de trás para
frente** (`for (var x = idxFItens.length - 1; x >= 0; x--) hAPI.removeCardChild("tbForneceItens", idxFItens[x])`).
Bug clássico de remoção durante iteração crescente: ao remover um item os índices seguintes
deslocam, a remoção pula elementos e/ou estoura o índice.

**Módulo/Rota:** *Processos → Iniciar Solicitações → Solicitação de Compras*
(`/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`) → seção **Validação do Comprador
(Definir Negociação)**, grade `tbForneceItens`. Etapa alcançada quando a cotação
(`wf_cotacao_produtos_servicos`) retorna à SC.

**Pré-condições**
- Uma SC já cotada, na etapa **Validação do Comprador (Definir Negociação)**, com a grade de
  fornecedores/propostas **já preenchida** — o defeito só aparece na **regravação**, quando a lista
  existente precisa ser removida antes de ser reescrita.
- Cenário mais sensível: **três ou mais** linhas na grade (com uma ou duas linhas a iteração
  crescente pode acidentalmente funcionar).
- Perfil de **comprador** com a tarefa sob sua responsabilidade.
- **Bloqueio:** sim — a conta de QA não resolve matrícula de comprador
  (`Comprador não encontrado.`) e não há SC nessa etapa sob esta conta. As 11 tarefas a concluir da
  Central de Tarefas hoje estão em *Correção* (SC 112556, 112584; Cotação 112113), não em Definir
  Negociação. Executar exigiria movimentar processo de terceiro — vedado.

**Passos**
1. Abrir *Central de Tarefas* → aba **Tarefas a concluir** e localizar a SC na etapa **Validação do
   Comprador (Definir Negociação)**.
2. Abrir a solicitação e rolar até a seção **Validação do Comprador (Definir Negociação)**.
3. Conferir a grade e anotar quantas linhas existem e os valores das colunas **Proposta \***,
   **Versão \***, **Fornecedor \***, **Situação Par. Area Dem. \***, **Situação Par. Areas \*** e
   **Enviar para Negociação? \***.
4. Alterar o campo **Negociação?** de ao menos duas linhas (é o `radio` `tbProposta_negociacao`).
5. Salvar/movimentar a tarefa (é o `beforeTaskSave` que dispara a regravação da grade).
6. Reabrir a solicitação e conferir a mesma grade.

**Resultado esperado**
- A gravação conclui **sem erro** e sem mensagem de índice/`null` no topo do formulário.
- Ao reabrir, a grade tem **exatamente o mesmo número de linhas** de antes — nenhuma linha órfã,
  nenhuma duplicada, nenhuma perdida.
- Cada linha traz o fornecedor e a proposta corretos: nenhuma linha “sobrando” de uma remoção
  incompleta.
- Na aba **Histórico** da solicitação, a movimentação aparece registrada normalmente.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro ao retornar com a cotação para a SC (evidência do ticket: SC **50300**). Mensagem exata
  `<não documentado>` — o anexo `image-20250915-141350.png` não está disponível nesta rodada.
- Sintoma diagnóstico: linhas remanescentes na grade `tbForneceItens` após a regravação (a iteração
  crescente pula elementos), ou estouro de índice ao remover o último filho.

**Severidade:** Alta *(perda/duplicação de linha de proposta na etapa que define o fornecedor
vencedor)*

**Preparação de massa:** uma SC cotada, parada na etapa **Validação do Comprador (Definir
Negociação)**, com **3+ fornecedores** na grade, criada e conduzida pelo próprio executor até essa
etapa — o que exige perfil de comprador com matrícula resolvida no Protheus. Não é criável pela
conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de *Solicitação de Compras* foi aberto e inspecionado por
inteiro. Confirmadas as seções **Validação do Comprador (Definir Negociação)** e, dentro dela, os
cabeçalhos de grade **Proposta \***, **Versão \***, **Fornecedor \***, **Situação Par. Area Dem. \***,
**Situação Par. Areas \*** e **Enviar para Negociação? \***, além do controle `tbProposta_negociacao`
(rótulo **Negociação?**). Confirmadas também as seções vizinhas *Aprovação de Alçada*, *Validação do
Comprador (Análise pós Alçadas)* e *Verificar Retorno Protheus*.
**Divergências encontradas:** o nome da tabela filho citado no ticket (`tbForneceItens`) **não
aparece como `name` de campo** no formulário de início — a grade só materializa seus inputs quando
tem linhas; o que se vê hoje são os cabeçalhos acima. O rótulo do controle de decisão é
**Negociação?** no `radio` e **Enviar para Negociação? \*** no cabeçalho da coluna — dois nomes para
o mesmo dado.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2690  (ambos · Concluído · SDCASSI-98)

**Título:** O aprovador reprova uma SC na Aprovação de Alçada e a recusa é aceita — inclusive com
dois gestores reprovando — sem erro de documento já liberado.

**Origem:** FSWTBC-2690 (SD778496) — ao recusar a **SC 16452** ocorria
`Falha na Integração com ERP. code: 401 message: Problema: este documento já foi liberado`:
descompasso de estado entre a alçada do Fluig e a do ERP (documento já liberado no MATA150). Na
homologação apareceu uma segunda camada — **dois gestores reprovando** também dava erro — e, depois
de fechado, uma terceira: `erro na geração do pedido — Cotação em aprovação não pode ser alterada.
Verifique alçada`. Corrigido três vezes em 24 dias (PR 56295 → PR 56631 / MUD16466).

**Módulo/Rota:** **Solicitação de Compras** (`wf_solicitacao_compras`, form **256831**), atividade
**94 – Aprovação de Alçada**, grade **`tbAlcadas`** (campos `tbalcada_*`); efeito na atividade
**287 `integracaoERP3`** e na correção **288 "Correção - Integração com ERP (Aprovação de
Alçadas)"**; leitura do retorno em **Validação do Comprador (Análise pós Alçadas)** — atividade
**210** — campo **"Retorno Integração"**; diagnóstico em *Logs Protheus* › **Erros CV8**.

**Pré-condições**
- Uma SC na atividade **94** com **duas ou mais linhas de aprovador** em `tbAlcadas`.
- Perfil de aprovador de alçada nas duas linhas (ou dois executores).
- **Bloqueio:** **sim** — a conta de QA não resolve matrícula de comprador/aprovador (§5-C), as
  linhas de `tbAlcadas` ficam ocultas para este login, e **§2 proíbe reprovar registro
  pré-existente**. O caso descreve o cenário; a execução exige massa e perfil próprios.

**Passos**
1. Abrir a SC na atividade **94 – Aprovação de Alçada**.
2. Na grade de aprovadores (**`tbAlcadas`**, campos `tbalcada_*`), localizar **a sua linha** —
   colunas **Aprovador**, **Email do Aprovador**, **Data da Aprovação**, **Hora da Aprovação**.
3. Posicionar o switcher **Aprovar?** em **Não** e preencher
   **Justificativa para a Aprovação/Reprovação**.
4. Repetir com **um segundo aprovador**, também em **Não** (é a camada 2 do defeito).
5. Movimentar a solicitação.
6. Acompanhar a instância até **Validação do Comprador (Análise pós Alçadas)** e ler o campo
   **"Retorno Integração"** (`buyerRetIntTreat`, textarea **readonly**).
7. Abrir *Logs Protheus* › **Erros CV8**, informar o **Id Fluig** do processo e clicar **Consultar**.

**Resultado esperado**
- A reprovação é **aceita** e o campo oculto `authorityStatusValidacao` fica **"Reprovado"** —
  basta **uma** linha reprovada para o conjunto ser reprovado.
- Com **dois** aprovadores reprovando, o comportamento é o mesmo: **uma** reprovação registrada,
  sem erro e sem duplicidade.
- O campo **"Retorno Integração"** **não** contém `401`, nem `este documento já foi liberado`, nem
  `Cotação em aprovação não pode ser alterada. Verifique alçada`.
- A instância **não** cai na atividade **288 "Correção - Integração com ERP (Aprovação de
  Alçadas)"**.
- Em **Erros CV8**, nenhuma ocorrência com esse **Id Fluig**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Ao recusar, erro literal do ticket:
  **`Falha na Integração com ERP. code: 401 message: Problema: este documento já foi liberado`**.
- Camada 2: o mesmo erro quando **dois gestores** reprovam a alçada.
- Camada 3 (regressão detectada **depois** do PR de produção):
  **`erro na geração do pedido — Cotação em aprovação não pode ser alterada. Verifique alçada`** —
  a mesma mensagem já vista na FSWTBC-2357.

**Severidade:** Alta — recusa de alçada que não se efetiva deixa uma compra reprovada seguindo
adiante no ERP.

**Preparação de massa:** uma SC que chegou à atividade **94** com **duas linhas de aprovador**
distintas e **ainda não liberada no ERP**. Precisa ser criada percorrendo cotação → negociação →
alçada, por conta com matrícula de comprador. **O executor de QA não consegue montá-la**, e não
deve reprovar SC alheia para tentar.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Lido no fonte publicado* — no form 256831 existem a grade **`tbAlcadas`**
(rótulos **Aprovador ***, **Email do Aprovador ***, **Data da Aprovação ***, **Hora da Aprovação ***,
**Aprovar? *** Sim/Não, **Justificativa para a Aprovação/Reprovação ***) e o campo oculto
`authorityStatusValidacao` dentro de `collapseAuthority`; em `App.js`, sob `numState == 94`, o
código varre `tbalcada_codERPValid___*`, ignora linhas de histórico e faz
`if (alcadaReprov.length > 0) authorityStatusValidacao = "Reprovado"; else if (alcadaAprov.length > 0)
… = "Aprovado"` — ou seja, **uma reprovação basta**, e **dois reprovando produz o mesmo resultado**.
O rótulo **"Retorno Integração*"** existe e é um `<textarea readonly>` de id/nome
**`buyerRetIntTreat`** (há ainda `anLockBudgRetIntErr`). As atividades **287 `integracaoERP3`** e
**288** (correção) estão declaradas no `ViewHandler`. *Visto renderizado* — a aba **Erros CV8** do
widget *Logs Protheus* abre com o filtro *Id Fluig*; `genericQuery` **404**.
**Divergências encontradas:** (a) o rótulo do ticket, "Erro retornado pelo ERP Protheus", **não
existe**: na tela é **"Retorno Integração"**, confirmando o alerta do briefing; (b) **achado**: se
**nenhum** aprovador tocar o switcher, o `switch` do `App.js` não entra em `"Aprovado"` nem em
`"Reprovado"` pela via do `:checked`, mas `handleAuthorityApprovalSwitcher()` já inicializa cada
`tbalcada_statusValidacao___*` **não marcado** com o valor **`"Reprovado"`** — o padrão silencioso
é reprovar.
**Dados/massa usados:** nenhum — não submetido; **nenhuma alçada foi aprovada ou reprovada**.

---

## CT-FSWTBC-2737  (fluig · Concluído · SDCASSI-102)

**Título:** Gestor orçamentário registra o parecer (justificativa) ao aprovar ou reprovar o item orçamentário da SC.

**Origem:** FSWTBC-2737 — “SC 50740: não aparece o campo para o gestor orçamentário registrar seu
parecer de aprovação”. Sem o campo, o aprovador não consegue justificar a decisão e a aprovação
trava. Provável regra de visibilidade condicional do campo no formulário.

**Módulo/Rota:** *Solicitação de Compras* (`wf_solicitacao_compras`) → seção **Validação do Item
Orçamentário** / grade **Item Orçamentário**. Na Central de Tarefas a etapa aparece como
**Validação Orçamentária**.

**Pré-condições**
- Uma SC aprovada pelo gestor imediato e parada na etapa **Validação do Item Orçamentário**.
- Perfil de **gestor orçamentário** responsável pela tarefa.
- **Bloqueio:** sim — não há SC nessa etapa sob a conta de QA (as tarefas a concluir hoje estão em
  *Correção*), e não há credencial de gestor orçamentário. Abrir/movimentar tarefa de terceiro é
  vedado.

**Passos**
1. Abrir *Central de Tarefas* → **Tarefas a concluir** e abrir a SC na etapa **Validação
   Orçamentária**.
2. Rolar até a seção **Validação do Item Orçamentário**.
3. Conferir que os campos de identificação vêm preenchidos e somente-leitura: **Aprovador \***,
   **Email do Aprovador \***, **Data da Aprovação \***, **Hora da Aprovação \*** e **Total Estimado
   a Aprovar (R$) \***.
4. Marcar **Aprovar? \*** (Sim/Não).
5. Preencher o campo **Justificativa para a Aprovação/Reprovação \*** com o parecer.
6. Movimentar a tarefa.

**Resultado esperado**
- O campo **Justificativa para a Aprovação/Reprovação \*** está **visível e editável** nesta etapa,
  para o responsável pela tarefa.
- O campo é **obrigatório**: movimentar sem preenchê-lo dispara a crítica de campo obrigatório.
- O parecer gravado fica legível ao reabrir a solicitação e no **Histórico**.
- O campo aparece **nas duas decisões** — não some ao marcar *Não* (reprovação é justamente quando
  o parecer mais importa).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A seção de aprovação do gestor orçamentário renderiza **sem** o campo de parecer, deixando o
  aprovador sem como justificar (SC **50740**; anexo `Screenshot_11.jpg`, não disponível nesta
  rodada). Mensagem de erro: não havia — o campo simplesmente não era exibido.

**Severidade:** Alta *(etapa de aprovação orçamentária; sem parecer não há trilha da decisão)*

**Preparação de massa:** uma SC conduzida até **Validação do Item Orçamentário** pelo próprio
executor, com o item orçamentário atribuído a um gestor cuja credencial esteja disponível ao teste.
Falta hoje: a credencial de gestor orçamentário.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no formulário de *Solicitação de Compras* estão presentes a seção
**Validação do Item Orçamentário** e a grade **Item Orçamentário**, com os campos
`tbitorc_responsavelValid` (**Aprovador \***), `tbitorc_emailRespValid` (**Email do Aprovador \***),
`tbitorc_dataValid` (**Data da Aprovação \***), `tbitorc_horaValid` (**Hora da Aprovação \***),
`tbitorc_vlrTotEstItem` (**Total Estimado a Aprovar (R$) \***), `tbitorc_aprovadoValid`
(**Aprovar? \***, radio) e — o campo do defeito — **`tbitorc_justificativa`, rótulo “Justificativa
para a Aprovação/Reprovação \*”**. Ou seja: **o campo existe hoje no formulário**. Está `oculto` no
formulário de início, como toda a seção, porque só é exibido na etapa correspondente.
**Divergências encontradas:** o ticket fala em “parecer”; o rótulo real da tela é **Justificativa
para a Aprovação/Reprovação**. A etapa se chama **Validação Orçamentária** na Central de Tarefas e
**Validação do Item Orçamentário** no formulário.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2804  (ambos · Concluído · SDCASSI-109)

**Título:** Liberadas as alçadas pelo processo do Fluig, a integração confirma a liberação e o
processo não volta para a etapa de correção.

**Origem:** FSWTBC-2804 (SD781224) — na base TST, **mesmo após a liberação das alçadas via processo
Fluig, os documentos de alçada do Protheus permaneciam "Pendente"** (cotação 000296, filial 5303).
**Não era defeito de código**: o fonte **compilado na API não era o da master** — o código em
execução estava defasado e a correção já existia no repositório. Mesmo padrão de FSWTBC-2838 e
FSWTBC-2836: divergência entre repositório e RPO do ambiente.

**Módulo/Rota:** **Solicitação de Compras** (`wf_solicitacao_compras`), atividade **94 – Aprovação
de Alçada** → **287 `integracaoERP3`**; leitura do resultado em **Validação do Comprador (Análise
pós Alçadas)** (atividade **210**) e no campo **"Retorno Integração"**; aba **Histórico** da
solicitação; *Logs Protheus* › **Erros CV8** e **Solicitacoes ZZY**.

**Pré-condições**
- Uma SC na atividade 94 com alçada pendente e perfil de aprovador.
- Ambiente com o fonte da API **compilado a partir da master**.
- **Bloqueio:** **sim** — conta de QA sem matrícula de aprovador (§5-C); §2 proíbe aprovar registro
  alheio. E o estado do RPO **não é verificável pelo Fluig** (ver Divergências).

**Passos**
1. Abrir a SC na atividade **94 – Aprovação de Alçada** e aprovar a linha da própria alçada
   (**Aprovar? = Sim** + **Justificativa para a Aprovação/Reprovação**).
2. Movimentar a solicitação e aguardar a atividade **287 (`integracaoERP3`)**.
3. Abrir a aba **Histórico** da solicitação e localizar o registro da integração.
4. Na etapa seguinte (**210 – Validação do Comprador (Análise pós Alçadas)**), ler o campo
   **"Retorno Integração"**.
5. Abrir *Logs Protheus* › **Solicitacoes ZZY**, filtrar pela **Chave** da cotação e clicar
   **Consultar**; abrir **Json Retorno** em **Ver JSON**.
6. Abrir *Logs Protheus* › **Erros CV8** com o **Id Fluig** do processo.

**Resultado esperado**
- O **Histórico** registra a integração concluída (padrão do ambiente:
  `Integração executada com sucesso - Tempo de Execução N s`).
- **"Retorno Integração"** vem **sem erro** — não contém `Pendente`, nem código de falha.
- A instância **não** entra na atividade **288 "Correção - Integração com ERP (Aprovação de
  Alçadas)"**.
- Em **Solicitacoes ZZY**, a linha da cotação tem **Status Proth** e **Status Fluig** de sucesso e
  **Json Retorno** preenchido — evidência, do lado Fluig, de que o ERP processou a liberação.
- Em **Erros CV8**, nenhuma ocorrência para o processo.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Alçadas liberadas no Fluig, mas os **documentos de aprovação do Protheus permanecem "Pendente"**
  (cotação **000296**, filial **5303**). No Fluig, o processo **segue como se tivesse dado certo** —
  não havia mensagem de erro; a divergência só aparecia ao olhar o ERP. Evidência original:
  `image-20251001-123434.png`.

**Severidade:** Alta — alçada tida como liberada no Fluig e pendente no ERP trava o pedido e
mascara o estado real da aprovação.

**Preparação de massa:** uma SC com alçada pendente na atividade 94 e um aprovador com matrícula no
ERP. **Não pode ser montada pelo QA.** Além disso, para que o caso tenha valor de regressão, é
preciso que quem faz o deploy **confirme que o fonte compilado na API veio da master** — é a causa
raiz real e **não há controle automático disso**, segundo a própria análise do ticket (três
ocorrências: 2804, 2836 e 2838).

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Lido no fonte publicado* — atividades **94 `aprovacaoAlcadas`**,
**287 `integracaoERP3`**, **210 `validacaoCompradorAlcadas`** e **288 "Correção - Integração com
ERP (Aprovação de Alçadas)"** declaradas no `ViewHandler` do form 256831; o campo
**"Retorno Integração*"** é o `<textarea readonly>` `buyerRetIntTreat`. *Visto renderizado* —
*Logs Protheus* abre com as abas **Erros CV8** e **Solicitacoes ZZY** e os filtros citados; ao
consultar, `genericQuery` responde **404** (instabilidade de ambiente), com o toast *"Logs
Protheus: Nao foi possivel consultar o dataset de logs."*.
**Divergências encontradas:** (a) o ticket fala em "documentos de aprovação do Protheus" — **não há
superfície no Fluig que mostre o status desses documentos**; o que o Fluig expõe é o *retorno da
integração* e a *fila ZZY*, e o caso está ancorado nisso, não numa cobertura simulada da tela do
ERP; (b) a **causa raiz** (fonte compilado ≠ master) **não tem nenhuma superfície no Fluig** — não
existe tela que mostre a versão/branch do RPO da API. Isso está dito explicitamente em vez de
inventar um passo.
**Dados/massa usados:** nenhum — não submetido; nenhuma alçada foi liberada.

---

## CT-FSWTBC-2914  (ambos · Concluído · SDCASSI-119)

**Título:** Abrir pela Central de Tarefas uma SC na Aprovação de Alçada e conferir que o aprovador designado se vê como aprovador, e não apenas como substituto.

**Origem:** FSWTBC-2914 — colaboradora abriu a SC 51464 pela Central de Tarefas e não via a opção de aprovador da alçada no formulário, embora aparecesse como substituto. Correção foi pontual de dado; a causa estrutural (dois pontos de integração gravando a mesma atribuição, sem transacionalidade) ficou declaradamente **não tratada**.

**Módulo/Rota:** Central de Tarefas (`/portal/p/1/pagecentraltask`) → tarefa `SOLICITAÇÃO DE COMPRAS` na atividade **Aprovação de Alçadas** → aba *Formulário* → painel **Aprovação de Alçada**, grade **`tbAlcadas`**.

**Pré-condições**
- SC viva na atividade **Aprovação de Alçadas** (atividade 94), com a alçada já gerada (grade `tbAlcadas` populada pela atividade 310 `geraGridAlcadas`).
- Conta autenticada como **titular** de uma das linhas de alçada — não como substituto.
- Uma segunda execução com conta que seja **substituta** do titular, para o contraste.
- **Bloqueio:** parcial. Na Central de Tarefas da conta de QA há **10 tarefas, todas de SC, nas atividades *Correção* e *Validação do Gestor*** — **nenhuma em Aprovação de Alçadas**. Além disso vale a limitação §5-C: a conta `TOTVS-FS` não resolve matrícula de comprador. O Tracker mostra que a massa existe (processo **111962**, atividade *Aprovação de Alçadas*, responsáveis `adelson.ii@cassi.com.br` e `edna.ribas@cassi.com.br`), mas ela **não é minha** — abri-la seria mexer em registro alheio.

**Passos**
1. Entrar na Central de Tarefas e clicar explicitamente na aba **Tarefas a concluir** (a sub-aba fica guardada por sessão no servidor).
2. Abrir a tarefa da SC que está em **Aprovação de Alçadas**.
3. Na aba *Formulário*, localizar o painel **Aprovação de Alçada** e a grade **`tbAlcadas`**.
4. Na linha correspondente ao usuário autenticado, ler a coluna **`Aprovador`** (`tbalcada_nomResponsavel`) e **`Email do Aprovador`** (`tbalcada_emailResponsavel`).
5. Conferir que os controles **`Aprovar?`** (`tbalcada_statusValidacao`, radios `Aprovado` / `Reprovado`) e **`Justificativa para a Aprovação/Reprovação`** estão **visíveis e habilitados** naquela linha.
6. Repetir com a conta **substituta** do mesmo titular.
7. **Não** concluir a aprovação — apenas observar. Sair sem movimentar.

**Resultado esperado**
- A linha da alçada do usuário aparece na grade `tbAlcadas` com **`Aprovador`** preenchido com o nome do **titular** da alçada.
- Os radios **`Aprovar?`** dessa linha estão disponíveis para o titular.
- Para o substituto, a linha continua **visível e acionável**, e o campo oculto `tbalcada_mailSubstitute` recebe o e-mail de quem está agindo — sem que o nome do titular desapareça da coluna *Aprovador*.
- Nenhum usuário fica com a linha escondida sem mensagem.

**Resultado se o defeito reincidir**
- A opção de aprovador **não aparece** no formulário para quem é o aprovador da alçada, embora a mesma pessoa apareça como **substituto** — sintoma exato do incidente 782641 na SC 51464.

**Severidade:** Alta

**Preparação de massa:** uma SC parada em *Aprovação de Alçadas* cujo titular de alçada seja o executor do teste, mais uma substituição vigente cadastrada no Fluig apontando o segundo executor. Quem prepara: dono do ambiente / administrador do Fluig (não há credencial de administrador nesta rodada). **Superfície do Fluig para o efeito:** o formulário (grade `tbAlcadas`) é a única — a visão *Aprovadores SC* do Tracker **não traz coluna de aprovador de alçada**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** Central de Tarefas aberta, aba *Tarefas a concluir* — 10 tarefas, todas *SOLICITAÇÃO DE COMPRAS*, atividades *Correção* e *Validação do Gestor*; nenhuma de alçada. Formulário real da SC 112830 aberto: entre os 76 rótulos únicos estão `Aprovar? *`, `Aprovador *`, `Email do Aprovador *`, `Justificativa para a Aprovação/Reprovação *`, `Valor da Compras (R$) *` e `Valor da Compra (R$) *`. Tracker visão *Aprovadores SC* (`table-sca`, `dsFluig_aprovadoresSC_Sql_CASSI`) aberta para o processo 112830: colunas *Aprovador Gestor / Aprovador Comprador / Aprovador Item Orçamentário*. Tracker visão SC mostrou o processo 111962 em *Aprovação de Alçadas*, provando que a massa existe. No fonte publicado (`form_sc.html:1752-1830`) a grade `tbAlcadas` tem os campos ocultos **`tbalcada_mailSubstitute`** e **`tbalcada_mailSubstituted`**, e `sc_App_ViewHandler.js:2343-2361` **sobrescreve** `tbalcada_nomResponsavel` com o usuário logado quando há substituição — mecanismo compatível com o sintoma relatado.
**Divergências encontradas:** (a) o Tracker rotula a atividade **`Aprovação de Alçadas`** (plural), o painel do formulário é **`Aprovação de Alçada`** (singular); (b) a visão **`Aprovadores SC`** do Tracker **não possui coluna de aprovador de alçada**, então o Tracker não responde a pergunta deste ticket; (c) `form_sc.html:2081` define `var WKSubstituteUser = 'null';` — a **string** `'null'`, que `UtilsHandler.hasValue` (`sc_Util_UtilsHandler.js:699`) considera valor válido, de modo que o ramo de substituição pode disparar sem substituição real.
**Dados/massa usados:** consulta ao processo 112830 e leitura da grade do Tracker. Nenhuma aprovação, nenhuma movimentação, nada submetido.

---

## CT-FSWTBC-3030  (fluig · Concluído · SDCASSI-130)

**Título:** Conferir que o e-mail de finalização do pedido de compras lista todos os itens da SC e o valor total confere com a soma deles.

**Origem:** FSWTBC-3030 — o e-mail de finalização de pedido de compras (SC 51973) não mostrava todos os itens e trazia valor total incorreto. Reincidência de FSWTBC-2684; a correção (PR 56539 / MUD16448) só vale para instâncias iniciadas **depois** da publicação.

**Módulo/Rota:** Processos › Iniciar Solicitações › **Solicitação de Compras** (`wf_solicitacao_compras`), atividade `185 - Disparo de E-mails`; conferência do conteúdo na caixa do destinatário e no formulário (seção *Identificação do(s) Produto(s)/Serviço(s)*).

**Pré-condições**
- Uma SC com **três ou mais itens** de valores distintos, iniciada **após** a publicação da versão corrigida do processo (hoje, versão 94 do `wf_solicitacao_compras`).
- A SC precisa ter percorrido o fluxo até a geração do pedido, chegando à atividade `185 - Disparo de E-mails`.
- Acesso à caixa de e-mail do fornecedor/destinatário configurado na SC (ou cópia do disparo).
- **Bloqueio:** nenhum para inspecionar o caminho; **há bloqueio para o teste completo** — a conta de QA não conclui o ciclo até `185 - Disparo de E-mails` (depende de aprovação de gestor, alçada e integração ERP) e não tem acesso à caixa postal do fornecedor.

**Passos**
1. Abrir **Processos › Iniciar Solicitações › Solicitação de Compras**.
2. Na seção *Identificação do(s) Produto(s)/Serviço(s)*, usar **Adicionar Produto** e cadastrar 3 itens com `Quantidade *` e `Preço Unit. Estimado *` diferentes entre si; anotar o `Vlr. Total Estimado *` de cada um.
3. Concluir o ciclo da SC até a atividade `185 - Disparo de E-mails` (aprovação do gestor, `14 - Validação Orçamentária`, cotação/negociação, `94 - Aprovação de Alçadas`, geração do pedido).
4. Abrir o e-mail de finalização recebido pelo fornecedor.
5. Comparar, item a item, a lista do e-mail com a grade *Produtos/Serviços da Solicitação* do formulário, e o valor total do e-mail com a soma dos `Vlr. Total Estimado *`.
6. Na aba **Histórico** da solicitação, confirmar a passagem por `185 - Disparo de E-mails` sem registro em `187 - Captura de Erro - Disparo de E-mails`.

**Resultado esperado**
- O e-mail lista **todos** os itens da SC, na mesma quantidade de linhas da grade do formulário.
- Cada linha do e-mail repete produto, quantidade e valor exatamente como no formulário.
- O valor total do e-mail é igual à soma dos valores totais dos itens.
- O Histórico registra `185 - Disparo de E-mails` concluída, sem entrada em `187 - Captura de Erro - Disparo de E-mails`.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O e-mail exibe apenas parte dos itens do pedido (evidência original: `image-20251023-200210.png`, SC 51973) e o valor total não corresponde à soma dos itens listados nem ao total da SC.

**Severidade:** Alta *(o e-mail é o documento que o fornecedor usa para atender o pedido; item omitido vira material não entregue e o valor errado tem efeito contratual)*

**Preparação de massa:** uma SC com 3+ itens de valores distintos, criada **após** a publicação da versão corrigida e levada até o disparo de e-mail — exige gestor aprovador, aprovador orçamentário, comprador e alçada; não é criável pela conta de QA. Além disso, para a verificação de regressão do relato original é preciso que o time confirme **em qual data/versão do processo** a correção entrou, porque instâncias iniciadas antes disso continuam com o defeito por desenho.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o processo *Solicitação de Compras* abre em `/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras` (título *Cassi - Fluig Plataforma - Movimentar Solicitação*, abas *Formulário / Informações / Histórico / Anexos*, botão *Enviar*); a seção *Identificação do(s) Produto(s)/Serviço(s)* traz a grade *Produtos/Serviços da Solicitação* com `Item *`, `Produto/Serviço *`, `Quantidade *`, `Preço Unit. Estimado *`, `Vlr. Total Estimado *` e o botão **Adicionar Produto**; no histórico da solicitação 112146 estão mapeadas as atividades `185 - Disparo de E-mails` e `187 - Captura de Erro - Disparo de E-mails`. O e-mail em si não foi verificado (sem acesso à caixa do destinatário).
**Divergências encontradas:** a análise do ticket afirma que "não é possível converter as versões antigas de processo para a nova versão corrigida", mas o histórico da solicitação **112146** registra literalmente *"Paulo Calixto (TOTVS) Converteu o processo wf_solicitacao_compras da versão 93 para a versão 94"*, com o mapeamento completo *Atividades Origem : Atividades Destino*. A conversão de instância em voo **existe e foi usada** neste ambiente — o que o ticket declara é uma decisão de não usá-la por segurança, não uma impossibilidade técnica. Vale reabrir a pergunta de quantas instâncias antigas seguem sem a correção.
**Dados/massa usados:** nenhum — não submetido. Leitura do formulário em branco e do histórico da solicitação 112146 (já existente, da própria conta de QA).

---

## CT-FSWTBC-3361  (ambos · Concluído · SDCASSI-157)

**Título:** Gerar o pedido de compras a partir da cotação e confirmar que o Controle de Alçada não recusa a geração.

**Origem:** FSWTBC-3361 — na SC 64382, cotação 000027-3509, a geração do pedido falhava com erro **"Controle de Alçada"**. É **reincidência declarada** de FSWTBC-2946 (SDCASSI-122), que havia sido fechado sem causa raiz documentada. Tratado de novo com **ajuste pontual** no processo 64382 "devido à urgência", com a análise de causa raiz seguindo em aberto (PR 59093 / MUD16769).

**Módulo/Rota:** Formulário da SC → painel **Aprovação de Alçada** (grade `tbAlcadas`) e painel **Verificar Retorno Protheus** (atividade **317**), campo **`Retorno Integração`**; Histórico da solicitação (integração `integracaoERP2`, atividade **177**).

**Pré-condições**
- SC com cotação concluída e vencedor definido, apta a gerar pedido.
- Alçada gerada e aprovada (`docAlcadaGerada`, `numDocAlcada` preenchidos).
- **Bloqueio:** sim. (a) §5-C — sem matrícula de comprador, a família cotação/alçada não opera nesta conta. (b) A geração do pedido é do **Protheus**, sem credencial. (c) Não há tarefa em *Aprovação de Alçadas* atribuída à conta de QA.

**Passos**
1. Abrir a SC que teve a cotação concluída.
2. No painel **Aprovação de Alçada**, conferir na grade **`tbAlcadas`** que todas as linhas estão com **`Aprovar?`** definido e **`Justificativa para a Aprovação/Reprovação`** preenchida.
3. Conferir no painel da empresa vencedora (grade **`tbForneceAlcadas`**) os campos **`Empresa Vencedora`**, **`CNPJ/CPF`**, **`Valor da Compras (R$)`**, **`Valor do Frete (R$)`** e **`Nº Pedido`**.
4. Aguardar a integração que gera o pedido e abrir a aba **Histórico**.
5. Se o processo parar no painel **Verificar Retorno Protheus**, ler o campo **`Retorno Integração`**.
6. Conferir se o campo **`Nº Pedido`** foi preenchido.
7. **Não** usar o combo **`Enviar para`** (opções *Retornar para Aguardar Geração* / *Encerrar Solicitação*) — apenas observar.

**Resultado esperado**
- O pedido de compras é gerado e **`Nº Pedido`** fica preenchido.
- O campo **`Retorno Integração`** permanece **vazio** — em especial, **não** traz "Controle de Alçada".
- O Histórico registra `Integração executada com sucesso - Tempo de Execução N s` para a atividade 177.
- O processo **não** para no painel *Verificar Retorno Protheus*.

**Resultado se o defeito reincidir**
- A geração do pedido falha com o erro **"Controle de Alçada"** — exatamente como na SC 64382 / cotação 000027-3509 — e o processo fica retido, exigindo ajuste pontual para seguir.

**Severidade:** Alta

**Preparação de massa:** uma SC com cotação encerrada, vencedor definido e alçada aprovada, criada por conta com matrícula de comprador válida. **Superfície do Fluig para o efeito:** o campo **`Retorno Integração`** da SC (painel *Verificar Retorno Protheus*, atividade 317), o Histórico e o campo `Nº Pedido` da grade `tbForneceAlcadas`. A regra de Controle de Alçada e o resíduo de fornecedor/cotação que a dispara são do ERP e **não têm superfície no Fluig**. Como este é o **segundo** registro do mesmo erro e a causa raiz não ficou documentada, o caso deve ser executado a cada regressão da família alçada/pedido.

**Verificado em tela:** PARCIAL
**O que foi verificado:** formulário real da SC 112830 aberto — o rótulo **`Retorno Integração*`** está entre os 76 rótulos únicos, assim como **`Nº Pedido*`**, **`Nº Contrato*`**, **`Empresa Vencedora *`**, **`CNPJ/CPF *`**, **`Valor da Compras (R$) *`**, **`Valor do Frete (R$) *`**, **`Aprovar? *`**, **`Justificativa para a Aprovação/Reprovação *`** e **`Enviar para *`**. No fonte, o campo do retorno é `name="anLockBudgRetIntErr"` / `id="buyerRetIntTreat"`, `<textarea readonly>`, dentro da section `panelBudgetLock` (`display:none`) cujo título é **`Verificar Retorno Protheus`**, correspondente à atividade `verificaTravaOrcamentaria: 317`; o combo de saída é `anLockBudgEnviarParaTreat` com as opções `Retornar para Aguardar Geração` e `Encerrar Solicitação`. O Tracker confirmou existir massa em *Aprovação de Alçadas* (processo 111962), sob responsáveis de terceiros.
**Divergências encontradas:** (a) o campo do retorno tem **`name` diferente do `id`** (`anLockBudgRetIntErr` vs `buyerRetIntTreat`) — citar só um dos dois num roteiro automatizado leva a seletor que não resolve; (b) o painel fica `display:none` por padrão, então o campo **não é visível** fora da atividade 317; (c) **nenhum JS publicado escreve nesse campo** — o texto vem do servidor, de modo que a mensagem "Controle de Alçada" não pode ser antecipada pelo fonte do front-end.
**Dados/massa usados:** consulta ao processo 112830 e ao Tracker. Nenhuma alçada aprovada, nenhum pedido gerado, nada movimentado.

---

## CT-FSWTBC-3435  (fluig · Concluído · SDCASSI-162)

**Título:** Abrir a etapa de validação orçamentária de uma SC e confirmar que os itens são listados e que o aprovador resolvido é um usuário **ativo**.

**Origem:** FSWTBC-3435 — a etapa de aprovação do gestor orçamentário não carregava os itens porque o dataset que resolve o gestor retornava um **cadastro antigo (inativo)** do mesmo gestor (Jair Dimas). Correção: filtro `active=true` no dataset (PR 59394 / MUD16804).

**Módulo/Rota:** *Solicitação de Compras* › atividade `14 - Validação Orçamentária` (com `280 - Distribuição Gestor Orçamentario` a montante) › seção do formulário **Validação do Item Orçamentário**.

**Pré-condições**
- Uma SC aprovada na `7 - Validação do Gestor` e encaminhada para `14 - Validação Orçamentária`.
- Um gestor orçamentário que possua (ou tenha possuído) **mais de um cadastro** na base de usuários do ERP, sendo ao menos um **inativo** — é essa a condição que reproduzia o defeito.
- Login do gestor orçamentário para abrir a tarefa.
- **Bloqueio:** sim. A conta de QA não é gestora orçamentária e não tem tarefa nessa etapa (as tarefas disponíveis estão em *Validação do Gestor* e *Correção*). A duplicidade de cadastro ativo/inativo é massa de produção que não pode ser fabricada aqui.

**Passos**
1. Autenticar como o gestor orçamentário destinatário da SC.
2. Abrir **Central de Tarefas** e localizar a solicitação na atividade **Validação Orçamentária**.
3. Abrir a tarefa e ir à seção **Validação do Item Orçamentário** do formulário.
4. Conferir que a grade de itens exibe **todos** os itens da SC, com `Produto/Serviço`, `Quantidade` e `Vlr. Total Estimado`.
5. Conferir o campo **Total Estimado a Aprovar (R$)** contra a soma dos itens exibidos.
6. Conferir que o nome/e-mail do responsável carregado corresponde ao cadastro **ativo** do gestor.
7. Não concluir a aprovação.

**Resultado esperado**
- A grade de itens da seção *Validação do Item Orçamentário* é carregada e mostra todos os itens da SC.
- **Total Estimado a Aprovar (R$)** é igual à soma dos valores totais dos itens listados.
- O responsável identificado é o cadastro **ativo** do gestor; nenhum usuário inativo é retornado pelo dataset que resolve o aprovador.
- A tarefa é roteada para o gestor correto, sem duplicidade de destinatário.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A etapa abre **sem listar os itens** para aprovação, e o dataset resolve um **usuário antigo/inativo** do gestor (relato do cliente: *"o dataset está buscando um usuário antigo do Jair Dimas"*), fazendo o aprovador decidir sem ver o que aprova — ou nem receber a tarefa.

**Severidade:** Alta *(aprovação orçamentária concedida sem visibilidade dos itens, e roteamento para cadastro inativo, é falha de alçada)*

**Preparação de massa:** uma SC parada em `14 - Validação Orçamentária` cujo gestor orçamentário tenha um cadastro inativo homônimo na base do ERP; só o time da CASSI consegue preparar (ou identificar) esse par ativo/inativo. Sem isso, o caso vira apenas a verificação de que os itens são listados.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no formulário da *Solicitação de Compras* existe a seção **Validação do Item Orçamentário**, com o subtítulo **Item Orçamentário** e o campo **Total Estimado a Aprovar (R$) \***, além dos campos de responsável, e-mail, data e hora da validação, `Aprovar? *` e `Justificativa para a Aprovação/Reprovação *`. No mapa de atividades do processo constam `14 - Validação Orçamentária`, `269 - Validação Orçamentária (Sem Gestor)` e `280 - Distribuição Gestor Orçamentario`. Não havia tarefa nessa etapa para abrir com dados.
**Divergências encontradas:** o ticket chama a etapa de **"aprovação do gestor orçamentário"**; na tela, a seção do formulário se chama **"Validação do Item Orçamentário"** e a atividade do workflow, **"Validação Orçamentária"** (existindo ainda a variante *"Validação Orçamentária (Sem Gestor)"*, que o ticket não menciona e que muda quem aprova).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3489  (fluig · Concluído · SDCASSI-170)

**Título:** Aprovar (sem concluir) na etapa orçamentária e confirmar que a data/hora da aprovação são gravadas e que os itens ficam visíveis ao aprovador.

**Origem:** FSWTBC-3489 — na etapa de aprovação do gestor orçamentário a **data não era salva** (perda de trilha de auditoria) e os **itens não eram listados** (aprovador decide sem ver o que aprova). Exemplos citados: SC 65176 e 69261. Corrigido via PR 61022 / MUD16919.

**Módulo/Rota:** *Solicitação de Compras* › atividade `14 - Validação Orçamentária` › seção **Validação do Item Orçamentário** (campos *Data da Validação* / *Hora da Validação*).

**Pré-condições**
- Uma SC parada em `14 - Validação Orçamentária`, com **dois ou mais itens**.
- Login do gestor orçamentário responsável.
- **Bloqueio:** sim — a conta de QA não possui tarefa nessa atividade; a etapa só é observável com perfil de gestor orçamentário.

**Passos**
1. Autenticar como gestor orçamentário e abrir a tarefa na atividade **Validação Orçamentária**.
2. Na seção **Validação do Item Orçamentário**, conferir que os campos de **data** e **hora** da validação vêm preenchidos com o momento da abertura.
3. Conferir que a grade de itens lista todos os itens da SC.
4. Marcar `Aprovar? *` e preencher a `Justificativa para a Aprovação/Reprovação *`.
5. Concluir a aprovação (etapa que exige a massa) e **reabrir** a solicitação.
6. Conferir, na solicitação reaberta e na aba **Histórico**, que a data/hora da aprovação foram **persistidas** com o valor do momento da aprovação.

**Resultado esperado**
- Os campos *Data da Validação* e *Hora da Validação* aparecem preenchidos ao abrir a etapa.
- Após a movimentação, a data/hora ficam **gravadas** no formulário e permanecem visíveis ao reabrir a solicitação.
- A grade de itens está preenchida durante toda a etapa.
- O Histórico registra a aprovação com autor, data e hora coerentes com o formulário.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Campo de data da aprovação vazio após a movimentação (a aprovação fica sem registro de quando ocorreu) e a grade de itens vazia durante a etapa — sintomas observados nas SC 65176 e 69261.

**Severidade:** Alta *(data da aprovação é elemento de auditoria de alçada; sem ela não se prova quando a despesa foi autorizada)*

**Preparação de massa:** uma SC com dois ou mais itens parada em `14 - Validação Orçamentária` e o login do gestor orçamentário — ambos a cargo do time da CASSI. Observação do ticket que vale carregar: **não há registro de recuperação das aprovações feitas sem data** no período do defeito; se a auditoria precisar delas, é um trabalho à parte.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o comportamento análogo **na etapa vizinha** foi observado com dados reais: na solicitação **112146**, parada em `7 - Validação do Gestor`, a seção **Validação do Gestor › Gestor Imediato** traz `Aprovador *`, `Email do Aprovador *`, `Data da Aprovação *` e `Hora da Aprovação *` **já preenchidos automaticamente** (`2026-09-04` e `10:05:27`, o instante da abertura), com `Aprovar? * (Sim/Não)` e `Justificativa para a Aprovação/Reprovação *`; e a grade de itens estava carregada (item `0001 - 00000003 - AR CONDICIONADO DE JANELA`, quantidade `111,111111`, `Vlr. Total Estimado 135.691,25`), junto com a seção *Rateio por Centro de Custo - Item 0001*. Na seção **Validação do Item Orçamentário** os campos equivalentes de responsável, data e hora existem no formulário. Não pude confirmar a **persistência após a movimentação**, porque isso exigiria aprovar.
**Divergências encontradas:** mesma divergência de rótulo do CT-FSWTBC-3435 — o ticket diz "gestor orçamentário", a tela diz *Validação do Item Orçamentário* / *Validação Orçamentária*.
**Dados/massa usados:** solicitação 112146 (já existente, da própria conta de QA), aberta somente para leitura — nada foi aprovado nem enviado.

---

## CT-FSWTBC-3529  (ambos · Concluído · SDCASSI-175)

**Título:** Abrir uma SC na Validação Orçamentária estando o gestor em período de substituição e conferir que os valores dos produtos aparecem.

**Origem:** FSWTBC-3529 — o valor dos produtos não carregava no formulário na etapa do gestor orçamentário, em 24 SCs. Causa raiz do cliente: o **código de responsável dos produtos** ficou diferente do item orçamentário por causa de **período de substituição** lançado no Protheus, rompendo o vínculo produto/item orçamentário.

**Módulo/Rota:** Fluig → **Central de Tarefas** → tarefa de **Validação Orçamentária** → formulário da **Solicitação de Compras**, painel **Validação do Item Orçamentário**.

**Pré-condições**
- Uma SC em **Validação Orçamentária** cujo gestor orçamentário esteja com **período de substituição vigente** lançado no Protheus.
- Itens da SC com item orçamentário vinculado e valor estimado preenchido.
- **Bloqueio:** o período de substituição é lançado **no Protheus** e não há credencial de ERP nesta rodada; não é possível criar a condição. O que é observável no Fluig é o **efeito** — o histórico do processo registra a movimentação por substituto.

**Passos**
1. Abrir a **Central de Tarefas**, clicar explicitamente na sub-aba desejada (ela é guardada por sessão no servidor) e abrir a tarefa de **Validação Orçamentária** da SC.
2. No formulário, ir ao painel **Identificação do(s) Produto(s)/Serviço(s) → Produtos/Serviços da Solicitação**.
3. Ler as colunas **Quantidade**, **Preço Unit. Estimado** e **Vlr. Total Estimado** de cada item.
4. Ir ao painel **Validação do Item Orçamentário** e ler o campo **Total Estimado a Aprovar (R$)**.
5. Abrir o **Histórico** do processo e localizar a linha de movimentação da atividade **Validação Orçamentária**, verificando se ela foi feita por um **Substituto**.
6. Repetir com uma SC cujo gestor **não** esteja em substituição e comparar.

**Resultado esperado**
- **Preço Unit. Estimado** e **Vlr. Total Estimado** aparecem preenchidos em todos os itens, com ou sem substituição vigente.
- **Total Estimado a Aprovar (R$)** é montado e igual à soma dos itens do gestor.
- O histórico pode registrar a linha `Substituto <nome> em nome de <gestor> movimentou a atividade Validação Orçamentária` sem que isso zere os valores.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Formulário aberto na etapa do gestor orçamentário **sem os valores dos produtos**, e *Total Estimado a Aprovar (R$)* vazio — como nas 24 SCs listadas no ticket (67360, 67380, 67431, 67575, 67578, 67599, 67267, 67803, 67783, 67799, 67829, 67855, 67869, 67889, 67905, 67910, 7915, 68122, 68130, 68203, 69273, 69722, 69723, 70000).

**Severidade:** Alta *(o gestor aprova valor que não vê — risco direto de aprovação indevida)*

**Preparação de massa:** uma SC em Validação Orçamentária **e** um período de substituição vigente para o gestor daquele item orçamentário, lançado no Protheus por quem tem acesso ao cadastro. Sem os dois juntos o caso não exercita a correção.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri `wf_solicitacao_compras` e confirmei os rótulos e painéis. Existem, literalmente, os painéis **Validação do Gestor**, **Validação do Item Orçamentário**, **Validação do Comprador**, **Aprovação de Alçada**, **Validação do Comprador (Análise pós Alçadas)**, **Verificar Retorno Protheus**; e os campos **Quantidade \***, **Média Histórica \***, **Preço Unit. Estimado \***, **Vlr. Total Estimado \***, **Total Estimado a Aprovar (R$) \***. No **Histórico do processo 112832** li a linha real `Substituto Geise Campos Silva Matias em nome de Erlon Cesar Dengo movimentou a atividade Validação Orçamentária para a atividade Join` — a condição de substituição do ticket **existe hoje na base**, e nesse processo os valores seguiram (o processo avançou até *Validação do Comprador*).
**Divergências encontradas:** o ticket fala em "etapa do gestor orçamentário"; na tela o painel é **Validação do Item Orçamentário** e na Central de Tarefas a atividade é **Validação Orçamentária**. O histórico de 112832 mostra o roteamento real: `Itens com Gestor? … Atividade Destino: 14` e `Itens sem Gestor? … Atividade Destino: 271` — o ramo *sem gestor* aponta para **271**, e não para a 269 citada no briefing; quem for testar a variante *sem gestor / pool* precisa confirmar em qual das duas o ambiente caiu, porque testar na 14 não exercita a correção.
**Dados/massa usados:** processo 112832 (SC ERP 001188, filial 5303, justificativa "SDCASSI-548") — apenas leitura de histórico. Formulário aberto e não submetido.

---

## CT-FSWTBC-3617  (ambos · Concluído · SDCASSI-188)

**Título:** Percorrer uma SC centralizada até a etapa de Distribuição Gestor Orçamentário e conferir que a integração conclui sem erro.

**Origem:** FSWTBC-3617 — erro na etapa **"Distribuição Gestor Orçamentário"** durante a homologação da DEM10013706 (compras centralizadas). Correção aplicada "no ambiente REST" (API do Protheus), sem causa raiz documentada.

**Módulo/Rota:** Fluig → **Processos → Solicitação de Compras** (`wf_solicitacao_compras`) → atividade automática **Distribuição Gestor Orçamentario** → conferência no **Histórico da solicitação**.

**Pré-condições**
- Uma SC com itens que tenham item orçamentário e gestor definidos, que passe pelo roteamento de distribuição.
- API REST do Protheus no ar.
- **Bloqueio:** nenhum para a conferência. A etapa é **automática** e o seu resultado é lido no Histórico sem precisar de credencial de ERP.

**Passos**
1. Abrir o processo de SC (novo ou existente) e movimentá-lo até passar pela distribuição.
2. Abrir a aba **Histórico** do processo.
3. Localizar a linha **`Distribuição Gestor Orçamentario Executando atividade de serviço do sistema`**.
4. Ler a linha imediatamente abaixo, que traz o retorno da integração.
5. Conferir o roteamento seguinte: gateways **`Itens com Gestor?`** e **`Itens sem Gestor?`**, e a atividade destino de cada um.
6. Conferir que o processo chegou às atividades seguintes (**Paralelo**/FORK, **Join**, **Validação Orçamentária**).

**Resultado esperado**
- O Histórico registra `Distribuição Gestor Orçamentario Executando atividade de serviço do sistema` seguido de **`Integração executada com sucesso - Tempo de Execução <N> s`**.
- O processo avança para o gateway seguinte sem parar na atividade de serviço.
- Nenhuma mensagem de erro de integração no Histórico.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro na etapa "Distribuição Gestor Orçamentário" durante a movimentação, com o processo parado na atividade de serviço (evidência do ticket: `erroDEM10013706.jpeg`).

**Severidade:** Média *(bloqueia o fluxo da SC centralizada, sem risco financeiro direto)*

**Preparação de massa:** uma SC com itens vinculados a item orçamentário com gestor. Já existe massa equivalente na base — o processo **112832** passou por essa etapa com sucesso e serve de referência de comportamento correto.

**Verificado em tela:** SIM (total)
**O que foi verificado:** abri o **Histórico do processo 112832** (SC ERP 001188, filial 5303) e li, literalmente:
`Distribuição Gestor Orçamentario Executando atividade de serviço do sistema — 27/08/2026 18:41:19` seguido de **`Integração executada com sucesso - Tempo de Execução 27 s`**;
`Distribuição Gestor Orçamentario movimentou a atividade Distribuição Gestor Orçamentario para a atividade Paralelo`;
`Paralelo Tarefa Automática — Atividade FORK`; `Itens com Gestor? Tarefa Automática: Decisão tomada conforme condição 1. Atividade Destino: 14.`; `Itens sem Gestor? Tarefa Automática: Decisão tomada conforme condição 2. Atividade Destino: 271.`; e mais adiante `Distribuição Comprador Executando atividade de serviço do sistema` → `Integração executada com sucesso - Tempo de Execução 1 s`. **O comportamento correto está observado hoje na base.**
**Divergências encontradas:** o nome da atividade na tela é **"Distribuição Gestor Orçamentario"** — *sem acento no "a" final* —, enquanto o ticket escreve "Distribuição Gestor Orçamentário". Quem for procurar pelo texto exato do ticket no Histórico não encontra. Existe ainda uma segunda atividade de distribuição, **"Distribuição Comprador"**, que o ticket não menciona e que é fácil confundir.
**Dados/massa usados:** processo 112832 — somente leitura do histórico, nada movimentado.

---

## CT-FSWTBC-3749  (ambos · Concluído · SDCASSI-223)

**Título:** Acompanhar uma SC que ficou aguardando o Protheus e conseguir dizer, pela tela, se ela está na fila, há quanto tempo e com que mensagem de retorno.

**Origem:** FSWTBC-3749 — SCs 9238/9239 paradas há 3 horas em "Aguarda Movimentação Protheus" e a
9240 em "Aguarda Geração da Cotação". Investigação em três subtarefas; o Indexer foi descartado como
causa e a subtarefa 3752 achou *"The parameter must be string"* gravado em `zzy_msgflu`. Homologado
**com ressalva**: 1 a 2 minutos por integração é aceitável só em homologação.

**Módulo/Rota:** Fluig → **Processos → Solicitação de Compras** (`wf_solicitacao_compras`), aba
**Histórico** da solicitação · **Tracker - Processos Compras/ Contratos** (*Filtrar por:*
**Solicitação de Compras**) · **Logs Protheus** (`/portal/p/1/portal_logs_protheus`), aba
**Solicitacoes ZZY**.

**Pré-condições**
- Uma SC própria que tenha passado por uma das atividades de espera do processo.
- Widget **Logs Protheus** acessível e o `genericQuery` respondendo.
- **Bloqueio:** o `genericQuery` responde **404** hoje (ambiente, §5-C) — a aba ZZY não devolve
  linhas. E as SCs 9238/9239/9240/9964/9965 do ticket **não existem nesta base** (`GET /requests/{n}`
  → 404 para todas as cinco): são numerações de SC do Protheus ou de outro ambiente.

**Passos**
1. Abrir o **Tracker**, escolher em *Filtrar por:* a opção **Solicitação de Compras**, informar o
   **Nº do Processo Fluig** da SC e clicar em **Pesquisar Registro**.
2. Ler a **Atividade Atual** da SC na grade do Tracker.
3. Abrir a solicitação e ir à aba **Histórico**.
4. Localizar a atividade de espera e comparar `startDate` e `endDate` (a diferença é o tempo de fila).
5. Localizar a atividade de serviço **"Integração com ERP"** e anotar **qual das três** é —
   sequência **20**, **177** ou **287**.
6. Abrir **Logs Protheus** → aba **Solicitacoes ZZY**, informar a **Filial** e o intervalo de
   **Data inicial/Data final**, e clicar em **Consultar**.
7. Na linha correspondente, ler **Status Proth**, **Status Fluig** e abrir a coluna **Msg Ret Flui**
   (botão "Ver JSON").

**Resultado esperado**
- No Tracker e no Histórico, a atividade de espera aparece com um dos nomes reais:
  **"Aguarda Geração da Cotação"** (seq. 328), *Aguarda Geração do Pedido/Contrato* (323),
  *Aguarda Geração Alçadas* (309) ou *Aguarda Vigência do Contrato* (332).
- A permanência na atividade de espera é da ordem de **minutos**, não de horas — a ressalva
  registrada no ticket ("1 a 2 minutos … aceitável para HML") é o teto aceito.
- A atividade **"Integração com ERP"** encerra e o processo avança para o gateway seguinte
  (*Cotação foi Gerada?* / *Pedido/Contrato foi Gerado?* / *Alçada foi Gerada?*).
- Na aba **Solicitacoes ZZY**, a linha da SC tem **Status Proth** e **Status Fluig** coerentes com
  "processada", **Data Integ/Hora Integ** preenchidas, e **Msg Ret Flui** **sem** mensagem de erro.

**Resultado se o defeito reincidir**
- O processo permanece **horas** na atividade de espera (o ticket relata 3 horas para as SCs 9238 e
  9239, e um dia para a 9965), sem avançar e sem erro visível no Histórico.
- Na fila do Protheus, `zzy_msgflu` traz **"The parameter must be string"**.
- Sintoma correlato do ticket: erro ao gerar a SC 9964 e "a geração de Pedido/Contrato está ficando
  na fila sem processamento".

**Severidade:** Média *(bloqueia o fluxo; a ressalva de performance para produção segue em aberto,
sem ticket de melhoria)*

**Preparação de massa:** uma SC criada pelo próprio executor que percorra a integração — não
reaproveitar SC de terceiro, e **não** cancelar/movimentar as SCs travadas de outra pessoa para
"destravar". Para o passo 7 é preciso que o `genericQuery` esteja no ar.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o Tracker abre (título *"Tracker - Processos Compras/ Contratos"*), o
combo `filterTipo` tem as 9 opções e os filtros *Nº do Processo Fluig*, *Solicitante*, *Status*
(Todos/Abertos/Finalizados/Cancelados), *Data da Solicitação (De/Até)*, *Nº da Solicitação ERP*,
*Nº da Cotação ERP*, *Filial*, *Dispensa Cotação* e *Tipo de Solicitação*, com botões **Pesquisar
Registro** e **Limpar**. O widget **Logs Protheus** abre com as três abas e os filtros listados no
§2. O mapa de 59 atividades da SC foi levantado de **6.000 movimentos reais**.
**Divergências encontradas:**
1. **"Aguarda Movimentação Protheus" não existe.** Não está entre as 59 sequências da SC nem entre
   as 15 do Faturamento atual. O nome mais próximo é **"Aguarda processamento Fila Protheus"**
   (seq. **182**), e ele pertence ao **wf_faturamento_contratos**, não à SC. Quem escrever o passo
   com o nome do ticket não vai achar a atividade.
2. **"Aguarda Geração da Cotação" existe e é a sequência 328** — a segunda metade do ticket confere.
3. As cinco instâncias citadas (9238, 9239, 9240, 9964, 9965) retornam **HTTP 404** nesta base.
4. O `genericQuery` do widget de logs responde 404 hoje (`java_generico_protheus`), com o toast
   **"Nao foi possivel consultar o dataset de logs."** — ambiente.
**Dados/massa usados:** nenhum — só leitura de API e de tela.

---

## CT-FSWTBC-3770  (fluig · Concluído · SDCASSI-229)

**Título:** Levar uma Solicitação de Compras até a integração com o ERP posterior à alçada e confirmar que ela conclui — e que, se falhar, a mensagem identifica a causa em vez de dizer "undefined".

**Origem:** FSWTBC-3770 — na SC 78719 o processo parou com *"Falha ao executar evento de serviço. Processo wf_solicitacao_compras - Atividade 287 - Tentativa 2 - Erro undefined (#158)"*. O ticket não registrou causa raiz; o retry automático (3 tentativas) foi acionado e falhou de novo. Duplicado por FSWTBC-4234.

**Módulo/Rota:** Processos › Iniciar Solicitações › **Solicitação de Compras** (`wf_solicitacao_compras`), atividade **287 — `integracaoERP3`** (a integração com o ERP que roda logo depois de `94 - Aprovação de Alçadas` e antes de `210 - Validação do Comprador (Alçadas)`). Conferência na aba **Histórico** da solicitação e no campo **Retorno Integração** do formulário.

**Pré-condições**
- Uma SC que tenha percorrido `94 - Aprovação de Alçadas` e esteja entrando em `287 - integracaoERP3`.
- Protheus respondendo (o `/ping/` do `apiRESTProtheus_CASSI` precisa estar de pé).
- Perfil de aprovador de alçada para movimentar a atividade 94.
- **Bloqueio:** a conta de QA **não** chega à atividade 287 — não há tarefa de alçada na sua Central de Tarefas (medido: as 10 tarefas abertas são `Validação do Gestor` e `Correção` de SC/Cotação) e o ciclo até a alçada exige gestor, aprovador orçamentário, comprador com matrícula no ERP e aprovador de alçada. A reprodução do erro em si é impossível por desenho — o defeito depende de um retorno específico do Protheus.

**Passos**
1. Abrir a SC na **Central de Tarefas** e movimentá-la até concluir `94 - Aprovação de Alçadas`.
2. Aguardar a execução automática da atividade **287 (`integracaoERP3`)**.
3. Abrir a solicitação e ir à aba **Histórico**.
4. Localizar o registro da atividade 287 e ler a mensagem que ela gravou.
5. No formulário, abrir a seção que exibe **Retorno Integração** (campo `anLockBudgRetIntErr`, textarea obrigatória de até 400 caracteres) e ler o conteúdo.
6. Confirmar que o processo seguiu para `210 - Validação do Comprador (Alçadas)`.

**Resultado esperado**
- A atividade 287 conclui e o Histórico registra a passagem sem entrada de erro de evento de serviço.
- O processo avança para `210 - Validação do Comprador (Alçadas)`.
- **Se, e somente se, a integração falhar:** a mensagem exibida no Histórico e/ou em **Retorno Integração** **nomeia a causa** (campo, código ou mensagem devolvida pelo ERP). A palavra `undefined` **não** pode aparecer na mensagem.
- Se houver retry, o número da tentativa aparece junto com a **causa** de cada tentativa, não só o contador.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Mensagem literal: `Falha ao executar evento de servico. Processo wf_solicitacao_compras - Atividade 287 - Tentativa 2 - Erro undefined (#158)`, sem qualquer indicação da causa, obrigando análise de log do servidor.

**Severidade:** Alta *(a SC trava depois da alçada aprovada — a compra já foi autorizada e não vira pedido; e a mensagem opaca transforma cada ocorrência em investigação manual de log)*

**Preparação de massa:** uma SC completa com item, rateio, cotação e negociação encerradas, aprovada em alçada, criada por quem tenha os quatro perfis do ciclo. Não é criável pela conta de QA. Para exercitar o **caminho de erro**, o time precisa de um ambiente onde se possa forçar uma resposta de falha do Protheus na chamada da atividade 287 — hoje isso não é reproduzível a partir do Fluig.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário da SC declara, no próprio código servido (`sc_App_ViewHandler.js`, objeto `this.activitys`), que **`integracaoERP3: 287`** — ou seja, a atividade citada no ticket é a **terceira** integração com o ERP, posterior a `aprovacaoAlcadas: 94`. Também confirmei no HTML do formulário o campo **`Retorno Integração`** (`data-field-name="anLockBudgRetIntErr"`, `id="buyerRetIntTreat"`, textarea `maxlength="400"`, marcado obrigatório). A Central de Tarefas da conta de QA foi aberta e listou 10 tarefas — nenhuma em alçada.
**Divergências encontradas:** a tabela de rótulos do briefing mapeia apenas `177 = integracaoERP2`. O código do formulário mostra **três** integrações no mesmo processo: **`20 = integracaoERP`**, **`177 = integracaoERP2`** e **`287 = integracaoERP3`**. Sem isso, "atividade 287" é indistinguível de "atividade 177" na leitura de um ticket. Sugiro incorporar as três ao mapa de rótulos.
**Dados/massa usados:** nenhum — não submetido. Leitura da Central de Tarefas, do HTML e do JS do formulário.

---

## CT-FSWTBC-3813  (fluig · Concluído · SDCASSI-241)

**Título:** Abrir uma SC na etapa de Aprovação de Alçada e confirmar que o aprovador vê o valor da compra e do frete preenchidos, coerentes com os itens da proposta vencedora.

**Origem:** FSWTBC-3813 — a tela de aprovação de alçada apresentava os **valores totais zerados**: o aprovador aprovava sem saber quanto estava aprovando e, pior, valor zero pode enquadrar a compra na alçada mais baixa. Levou quase dois meses e reprovou em teste uma vez antes de ser homologado em 27/03/2026.

**Módulo/Rota:** **Solicitação de Compras** (`wf_solicitacao_compras`), atividade **94 - Aprovação de Alçadas** — seção **Aprovação de Alçada** do formulário (painel `panelValidationAuthority`), grade por fornecedor `tbForneceAlcadas`.

**Pré-condições**
- Uma SC que tenha concluído cotação e negociação e esteja na atividade `94 - Aprovação de Alçadas`.
- Proposta vencedora definida, com itens de quantidade e preço unitário conhecidos.
- Perfil aprovador de alçada, com a solicitação na Central de Tarefas.
- **Bloqueio:** **sim** — a conta de QA não tem tarefa de alçada (Central de Tarefas medida: 10 tarefas, todas `Validação do Gestor` ou `Correção`), e a etapa 94 só é alcançada após aprovação do gestor, validação orçamentária, cotação e negociação, cada uma com perfil próprio.

**Passos**
1. Abrir a solicitação em `94 - Aprovação de Alçadas` pela **Central de Tarefas**.
2. Localizar a seção **Aprovação de Alçada**.
3. Para cada fornecedor listado, ler **Fornecedor**, **CNPJ/CPF**, **Valor da Compras (R$)** e **Valor do Frete (R$)**.
4. Expandir o cartão **Itens da Proposta Vencedora** do mesmo fornecedor e anotar, item a item, **Quantidade**, **Preço Unitário** e **Vlr. Total**.
5. Somar os **Vlr. Total** dos itens e comparar com **Valor da Compras (R$)**.
6. Conferir também **Nº Pedido** (ou **Nº Contrato**, conforme o tipo de documento da compra).
7. Repetir para cada fornecedor da grade, quando houver mais de um.
8. **Não aprovar.** Sair da tarefa sem movimentar.

**Resultado esperado**
- **Valor da Compras (R$)** vem preenchido, diferente de zero, e é **igual à soma dos Vlr. Total dos itens** listados em *Itens da Proposta Vencedora* daquele fornecedor.
- **Valor do Frete (R$)** vem preenchido com o frete da proposta (podendo ser zero somente se a proposta não tiver frete).
- Cada linha da grade corresponde a um fornecedor com itens: nenhum fornecedor aparece com bloco de itens vazio.
- **Nº Pedido** ou **Nº Contrato** vem preenchido, conforme o tipo de documento.
- A faixa de alçada aplicada corresponde ao valor exibido — não a zero.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- **Valor da Compras (R$)** e **Valor do Frete (R$)** exibidos **zerados** para o aprovador (evidência original: `imagem.jpg`), enquanto os itens da proposta vencedora tinham valor.

**Severidade:** Alta *(risco direto de aprovação/alçada: aprovar sem valor visível, e valor zero enquadrando a compra na alçada mais baixa — isto é, aprovação por quem não teria competência para o valor real)*

**Preparação de massa:** uma SC levada até `94 - Aprovação de Alçadas`, com proposta vencedora de ao menos dois itens de valores distintos e frete diferente de zero, criada por quem detenha os perfis de gestor, orçamento, comprador e alçada. **Adicionalmente**, e este é o ponto que o ticket deixou em aberto: o time deveria levantar as alçadas **já aprovadas com valor zerado** entre 02/02 e 27/03/2026 — em controle de aprovação, essa é a verificação mais relevante, e não há registro de que tenha sido feita.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no HTML do formulário da SC está a seção **"Aprovação de Alçada"** (`<section id="panelValidationAuthority">`, colapsável `#collapseAuthority`), contendo a grade `tbForneceAlcadas` com, por linha: **Fornecedor**, **CNPJ/CPF \***, **Valor da Compras (R$) \*** (`tbfornalc_vlrTotalItens`, `readonly`), **Valor do Frete (R$) \*** (`tbfornalc_vlrTotFrete`, `readonly`), **Nº Pedido \*** e **Nº Contrato \*** (exibidos alternadamente). No JS confirmei como esses valores são montados: `handleMountObjDTableAuthority` lê a grade `tbForneceItens` e **filtra pelos itens cujo `fornece` e `loja` batem com o fornecedor da linha da alçada**, e só então `handleMountSupplierItemAuthority` renderiza o cartão **"Itens da Proposta Vencedora"** com os rótulos **Item**, **Unidade de Medida**, **Quantidade**, **Preço Unitário**, **Vlr. Total**, **Produto/Serviço** e **Grupo do Produto/Serviço**. A montagem só ocorre nas atividades 94, 210, 104, 323, 332, 317, 117 e 115. Nenhuma SC em alçada estava disponível para abrir.
**Divergências encontradas:** duas, de rótulo. (1) O briefing traduz "alçada" para *Aprovação de Alçada* (atividade 94, grade `tbForneceAlcadas`) — confere; mas o rótulo do painel no formulário é **"Aprovação de Alçada"** no singular, enquanto o nome da atividade no mapa do processo é **"Aprovação de Alçadas"** no plural. (2) O rótulo do campo de valor é literalmente **"Valor da Compras (R$)"** — concordância incorreta ("da Compras"), presente tanto no `label` quanto no `placeholder` e no `title`. É apresentação, mas é o campo central desta tela e vale corrigir. Registro também, como observação de desenho: os valores da alçada dependem do casamento `fornece` + `loja` entre duas grades; se esse casamento falhar, o efeito visível é exatamente **zero**, que foi o sintoma do ticket — é onde eu olharia primeiro numa reincidência.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3841  (ambos · Concluído · SDCASSI-76)

**Título:** Concluir uma Solicitação de Compras no Fluig e confirmar, pela própria tela, que ela foi criada no Protheus.

**Origem:** FSWTBC-3841 — "não está integrando SC no Protheus". Falha no passo que cria a Solicitação
de Compras no ERP (previsto no épico da DEM10013706, com 3 tentativas automáticas). A descrição do
ticket é só um print; sem causa raiz, sem descrição de correção e sem registro de quantas SCs
deixaram de integrar.

**Módulo/Rota:** Fluig → **Processos → Solicitação de Compras** (`wf_solicitacao_compras`) → aba
**Histórico** · campo **Retorno Integração** no formulário · **Tracker** (*Filtrar por:* **Solicitação
de Compras**, coluna/filtro **Nº da Solicitação ERP**) · **Logs Protheus** → aba **Solicitacoes ZZY**.

**Pré-condições**
- Uma SC criada pelo próprio executor, completa o bastante para chegar à integração.
- **Bloqueio:** comprovar a criação no ERP exige submeter a SC — escrita irreversível no Protheus.
  O caso é escrito para ser executado por quem vai criar a própria massa. A conferência final no
  SIGACOM exige credencial de Protheus, que não há; por isso as asserções abaixo se apoiam nas
  superfícies do Fluig.

**Passos**
1. Criar e enviar uma **Solicitação de Compras** com todos os obrigatórios preenchidos, prefixando os
   textos livres com `QA `.
2. Acompanhar a aba **Histórico** e localizar a atividade de serviço **"Grava SC e Anexos"**
   (sequência **233**).
3. Localizar a atividade **"Integração com ERP"** e anotar **qual das três** ela é — sequência
   **20**, **177** ou **287** — porque as três têm o mesmo nome em tela.
4. Conferir o tempo entre `startDate` e `endDate` dessa atividade.
5. Abrir o formulário da SC e ler o campo **"Retorno Integração"**.
6. Abrir o **Tracker**, filtrar por **Solicitação de Compras** e pelo **Nº do Processo Fluig**, e ler
   o **Nº da Solicitação ERP**.
7. Abrir **Logs Protheus** → **Solicitacoes ZZY**, filtrar por **Filial** e data, e ler **Status
   Proth**, **Status Fluig** e **Msg Ret Flui**.
8. Conferir que o processo saiu da atividade de espera correspondente
   (**Aguarda Geração da Cotação** / *Aguarda Geração do Pedido/Contrato*).

**Resultado esperado**
- Passo 2/3: **"Grava SC e Anexos"** e **"Integração com ERP"** aparecem no Histórico e **encerram**.
- Passo 5: **"Retorno Integração" está vazio** (é o campo de erro; vazio significa integração limpa).
- Passo 6: o **Nº da Solicitação ERP** está **preenchido** no Tracker — é a prova, dentro do Fluig,
  de que a SC existe no Protheus.
- Passo 7: a linha na ZZY tem **Data Integ/Hora Integ** preenchidas e **Msg Ret Flui** sem erro.
- Passo 8: o processo avançou; nenhuma atividade de espera ficou pendurada.

**Resultado se o defeito reincidir**
- O processo nasce no Fluig e **não chega ao Protheus**: o **Nº da Solicitação ERP** fica vazio no
  Tracker, o processo fica preso na atividade de espera e/ou a atividade **"Integração com ERP"** não
  encerra — mesmo após as 3 tentativas automáticas previstas.

**Severidade:** Média *(bloqueia o fluxo no passo mais crítico da integração; o ticket não registra
quantas SCs foram afetadas)*

**Preparação de massa:** uma SC completa criada pelo executor, com produto, quantidade e solicitante
preenchidos, em filial cuja integração esteja ativa. Não reaproveitar SC de terceiro.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei por dado, em 6.000 movimentos, que existem **três** atividades
`TASK_SERVICE` chamadas **"Integração com ERP"** — sequências **20** (56 movimentos), **177** (29) e
**287** (25) — mais **"Grava SC e Anexos"** (233, 557 movimentos) e **"Verificar retorno Protheus"**
(317, 6 movimentos). No fonte publicado do formulário da SC confirmei o campo **"Retorno Integração"**
(`data-field-name="anLockBudgRetIntErr"`, `id="buyerRetIntTreat"`, `<textarea maxlength="400"
readonly>`), e que ele fica no bloco da validação orçamentária, logo depois de *"Hora da Validação"*.
No Tracker confirmei os filtros **Nº da Solicitação ERP** e **Nº da Cotação ERP**.
**Divergências encontradas:**
1. **"A integração" é ambígua em tela, não só no ticket:** as três atividades exibem o **mesmo nome**,
   "Integração com ERP". Só a sequência as distingue, e a sequência **não aparece** na aba Histórico —
   só via API. Um passo que diga "conferir a integração" é ambíguo por construção.
2. Existe uma atividade **"Verificar retorno Protheus"** (317) que o ticket não menciona e que é
   justamente o ponto humano de tratamento de falha de integração — deveria estar no roteiro.
3. **"Retorno Integração" é `data-required="true"` e ao mesmo tempo `readonly`**, e nenhum JS
   publicado escreve nele: só pode ser populado pelo servidor. Se o backend não gravar, o campo fica
   vazio em silêncio — e "vazio" é o mesmo sinal de "integrou bem". O Tracker (**Nº da Solicitação
   ERP**) é a asserção mais confiável, por isso ela é o passo 6.
**Dados/massa usados:** nenhum — nenhuma SC criada nem enviada.

---

## CT-FSWTBC-3875  (fluig · Concluído · SDCASSI-253)

**Título:** Tentar anexar documento a uma Solicitação de Compras cuja cotação já foi liberada aos fornecedores, com um perfil que não seja o gestor do processo, e confirmar que o sistema recusa.

**Origem:** FSWTBC-3875 — a solicitante inseriu um documento na SC 75994 quando a cotação **já estava liberada aos fornecedores**; o cliente entende que somente o gestor do processo deveria poder anexar. A análise foi conclusiva: *"não há **nenhum tipo de bloqueio** de anexos relacionado às atividades, nem limitando ao gestor do processo"*. O ticket foi encerrado encaminhando o assunto como **melhoria a especificar** — **não** houve correção.

**Módulo/Rota:** **Solicitação de Compras** (`wf_solicitacao_compras`) — botões **Anexar documentação Pública** e **Anexar documentação Restrita CASSI** no formulário, e a aba nativa **Anexos** da solicitação.

**Pré-condições**
- Uma SC cuja cotação já tenha sido **liberada aos fornecedores** (a partir de `33 - Processo de Cotação` / `328 - Aguarda Geração da Cotação`).
- Dois usuários distintos: o **solicitante** (ou outro participante não-gestor) e o **gestor do processo**.
- **Bloqueio:** **sim, dois.** (a) Não há credencial de gestor nem de outro participante além da conta de QA — o caso exige dois perfis para ser conclusivo. (b) **O comportamento correto ainda não foi especificado**: o ticket pediu ao cliente definir *quais atividades permitem anexo*, *quais não permitem* e *se a permissão é exclusiva do gestor ou estendida*. Sem essa definição, o resultado esperado abaixo é a leitura do que o cliente descreveu no incidente, não uma regra homologada.

**Passos**
1. Autenticar como **solicitante** (não-gestor) e abrir a SC cuja cotação já está liberada.
2. No formulário, localizar os botões **Anexar documentação Pública** e **Anexar documentação Restrita CASSI**.
3. Verificar se os botões estão habilitados nessa etapa.
4. Tentar anexar um arquivo por **Anexar documentação Pública**.
5. Abrir a aba **Anexos** da solicitação e tentar anexar por lá também.
6. Registrar o que aconteceu em cada tentativa.
7. Autenticar como **gestor do processo**, abrir a mesma SC e repetir os passos 4 e 5.
8. Conferir na aba **Histórico** se a inclusão do anexo ficou registrada e por quem.

**Resultado esperado** *(comportamento correto pedido pelo cliente — hoje **não** implementado)*
- Para o solicitante, com a cotação já liberada, os botões **Anexar documentação Pública** e **Anexar documentação Restrita CASSI** estão **desabilitados** ou a inclusão é **recusada com mensagem explícita**.
- A aba **Anexos** também recusa a inclusão para esse perfil nessa etapa — o bloqueio não pode existir só no botão do formulário e ficar aberto pela via nativa.
- O **gestor do processo** consegue anexar normalmente.
- Toda inclusão de anexo fica registrada no Histórico, com autor e data.

> **Atenção — este item continua em aberto.** O ticket foi encerrado sem implementar o controle. Executando este caso hoje, espera-se que ele **falhe**: qualquer participante consegue anexar em qualquer etapa. A falha é o registro de que a lacuna persiste, não uma regressão.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia — e ainda se vê)*
- A solicitante insere documento na SC depois de a cotação ter sido liberada aos fornecedores, sem qualquer bloqueio (evidência `Screenshot_3.png`, SC 75994) — alterando a documentação da concorrência sem que todos os participantes vejam.

**Severidade:** Alta *(controle de acesso ausente com efeito sobre concorrência: alterar a documentação da SC depois de os fornecedores já terem recebido a cotação muda as bases da disputa)*

**Preparação de massa:** uma SC com cotação já liberada aos fornecedores e **dois usuários** com papéis distintos sobre ela (solicitante e gestor do processo). Antes de tudo, o **cliente precisa especificar a regra** — a lista de atividades em que o anexo é permitido e os perfis autorizados. Sem isso o caso não tem critério de aprovação e não deve ser automatizado.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no HTML do formulário da SC estão os dois botões, com estes rótulos exatos: **"Anexar documentação Pública"** (`class="btn btn-default btnAdicionarAnexoPublico"`) e **"Anexar documentação Restrita CASSI"** (`class="btn btn-warning btnAdicionarAnexoRestrito"`), ambos com ícone de clipe. No JS, `handleChangesAttachments()` apenas liga o clique de cada botão à abertura do seletor de arquivo (`handleShowCameraPublic` / `handleShowCameraRestrict`) — **não há, em nenhum ponto dessa função, checagem de perfil, de papel no processo ou de estado da cotação**. A função é chamada nas atividades `6 Início`, `7 Validação do Gestor`, `11 Ajustar Informações`, `14 Validação Orçamentária`, `269 Validação Orçamentária (Sem Gestor)`, `119 Validação do Comprador`, `199 Validação do Comprador (Negociação)`, `94 Aprovação de Alçadas` e `210 Validação do Comprador (Alçadas)` — sempre da mesma forma, para qualquer usuário que tenha a tarefa. **A ausência de controle relatada no ticket segue confirmada no código servido hoje.** Não testei com segundo perfil (não disponível) nem anexei arquivo.
**Divergências encontradas:** o ticket fala genericamente em "inserir um documento". Na tela há **duas vias distintas**, e a especificação da melhoria precisa cobrir as duas: os **botões do formulário** (Pública e Restrita CASSI, com semânticas diferentes — a Restrita é a que realmente muda a base da concorrência) e a **aba Anexos nativa do Fluig**, que é da plataforma e **não passa por esse código** — um controle implementado apenas nos botões deixaria a aba nativa aberta. Registro isso como risco de desenho para quando a melhoria for especificada.
**Dados/massa usados:** nenhum — nenhum arquivo anexado.

---

## CT-FSWTBC-3878  (ambos · Concluído · SDCASSI-255)

**Título:** Tentar enviar uma Solicitação de Compras sem informar o produto e ser barrado no Fluig, com mensagem de negócio, antes de qualquer chamada ao ERP.

**Origem:** FSWTBC-3878 — *"Falha na Integração com ERP. code 401 message: AJUDA:C1_PRODUTO Codigo
identificador do material solicitado. Tabela SC1"*. A SC foi enviada ao Protheus sem o código do
produto e o ERP recusou com HTTP 401. O tratamento estrutural (tornar `C1_PRODUTO`, `C1_QUANT` e
`C1_SOLICIT` obrigatórios **no Fluig**, com mensagem clara, antes do envio) só viria seis meses
depois.

**Módulo/Rota:** Fluig → **Processos → Solicitação de Compras** (`wf_solicitacao_compras`) → grade de
itens → campo **Produto/Serviço**. Verificação do efeito: aba **Histórico** e campo
**Retorno Integração**.

**Pré-condições**
- Formulário de SC aberto, com pelo menos uma linha na grade de produtos.
- **Bloqueio:** fechar o caso pelo lado positivo exige **submeter** a SC (escrita irreversível). O
  lado negativo — que é o que interessa — é exercitável **sem submeter**, apenas tentando enviar com o
  campo vazio.

**Passos**
1. Iniciar uma **Solicitação de Compras**.
2. Adicionar uma linha na grade de produtos e **deixar o campo "Produto/Serviço" vazio**.
3. Preencher os demais campos da linha (quantidade, datas, valores).
4. Tentar **enviar** a solicitação.
5. Ler a mensagem exibida e conferir o campo destacado.
6. Preencher o **Produto/Serviço** pelo zoom e conferir se o **Grupo do Produto/Serviço** é
   preenchido automaticamente.
7. *(Se a massa for própria)* enviar a solicitação e, no **Histórico**, conferir que a atividade
   **"Integração com ERP"** encerrou e que o campo **"Retorno Integração"** está vazio.

**Resultado esperado**
- Passo 4/5: **o Fluig barra o envio** com crítica de campo obrigatório apontando **"Produto/Serviço"**
  — em linguagem de negócio, **não** com o texto técnico do ERP.
- **Nenhuma chamada de integração é feita** enquanto houver item sem produto: a SC não pode sair do
  Fluig incompleta.
- Passo 6: escolhido o produto pelo zoom, o **Grupo do Produto/Serviço** é preenchido automaticamente
  (é campo `readonly`).
- Passo 7: a integração encerra e **"Retorno Integração"** permanece **vazio**.

**Resultado se o defeito reincidir**
- A SC é enviada sem produto e a falha só aparece **depois**, como retorno técnico do ERP:
  **"Falha na Integração com ERP. code 401 message: AJUDA:C1_PRODUTO Codigo identificador do material
  solicitado. Tabela SC1"** — mensagem do dicionário do Protheus exibida ao usuário final, que não
  tem como agir sobre ela.

**Severidade:** Média *(bloqueia o fluxo e joga erro técnico do ERP na cara do usuário; a SC fica
órfã, criada no Fluig e inexistente no Protheus)*

**Preparação de massa:** nenhuma massa especial para o caminho negativo — basta abrir o formulário.
Para o passo 7 é preciso uma SC completa criada pelo executor.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no fonte publicado do formulário da SC (`form_sc.html`, 123 `<label>`), o
campo de produto é **`tbprod_produtServico`**, rotulado **"Produto/Serviço *"**, do tipo
**`zoomfield`** com **`data-required="true"`**, alimentado pelo dataset
**`dsProtheus_getProdutos_restGetAll`** (chave de exibição `B1_IDDESC`, `maximumSelectionLength: 1`).
Ou seja, **a obrigatoriedade do produto está declarada no formulário hoje** — que é o comportamento
correto que este caso de regressão afirma. Também confirmei os rótulos **"Nº da Solicitação ERP *"**,
**"Nº da Cotação ERP *"** e **"Nº SC Origem ERP *"** (este aparece **duas vezes** no formulário).
**Divergências encontradas:**
1. **Asterisco enganoso ao lado do campo que importa:** o vizinho **"Grupo do Produto/Serviço"**
   (`tbprod_grupoProduto`) exibe o mesmo asterisco vermelho de obrigatório no label, mas é
   **`data-required="false"`** e **`readonly`**. Quem valida "os campos com asterisco" vai testar um
   campo que o formulário não critica.
2. O ticket cita **C1_QUANT** e **C1_SOLICIT** como parte do mesmo tratamento estrutural; no
   formulário publicado só consegui confirmar a obrigatoriedade do **produto**. Os outros dois não
   foram verificados e **não** entram nas asserções acima.
3. O rótulo **"Nº SC Origem ERP *"** aparece **duplicado** no formulário — dois campos com o mesmo
   texto, o que impede identificar qual é qual só pelo rótulo.
4. `data-required="true"` é a declaração do formulário; **não confirmei em tela que a crítica
   dispara**, porque isso exigiria tentar enviar. O passo 4 é justamente o que fecha esta lacuna.
**Dados/massa usados:** nenhum — nenhuma SC aberta, preenchida ou enviada.

---

## CT-FSWTBC-3931  (ambos · Concluído · SDCASSI-273)

**Título:** Acompanhar a fila de integração de uma solicitação parada em "Aguarda Criar Pedido de Compras" e confirmar que ela sai da fila.

**Origem:** FSWTBC-3931 — seis processos Fluig (82118–82123), todos do fornecedor Climate Air
Engenharia e do contrato 00003-2025-3301, presos simultaneamente em **"Aguarda Criar Pedido de
Compras"**. Encerrado por consolidação no FSWTBC-3989, **sem correção própria e sem registro de
destravamento**. A causa raiz da família só seria estabelecida depois (FSWTBC-3657: laço infinito na
numeração do pedido prendendo a thread do schedule).

**Módulo/Rota:** `wf_solicitacao_compras`, atividade de espera assíncrona *Aguarda Criar Pedido de
Compras* · superfícies: **Logs Protheus → aba `Solicitacoes ZZY`** e **Tracker → visão
*Solicitação de Compras***.

**Pré-condições**
- Solicitações de compra que tenham atingido a etapa de geração de pedido no ERP.
- Schedule Protheus de consumo da fila **ativo**.
- **Bloqueio:** sem credencial Protheus não se confirma o pedido gerado do lado do ERP; e hoje o
  `genericQuery` do widget Logs Protheus responde **404**, deixando a aba ZZY vazia. O caso é
  executável em tela **quando** essa consulta voltar.

**Passos**
1. Abrir **`/portal/p/1/portal_logs_protheus`** e selecionar a aba **`Solicitacoes ZZY`**.
2. Preencher a filial e o intervalo de datas (campos `input[type=date]`, formato **ISO aaaa-mm-dd**)
   cobrindo o período das solicitações e clicar em **Consultar**.
3. Localizar as solicitações na fila e ler a coluna **`Qtd T.Env Fl`** (contador de retry).
4. Anotar o registro e **repetir a consulta após um ciclo do schedule**.
5. No **Tracker**, visão *Solicitação de Compras*, filtrar as mesmas solicitações e conferir a etapa
   atual. **Consulta apenas — não movimentar processo.**
6. Abrir o **Histórico** de uma das solicitações e procurar a linha
   *"Integração executada com sucesso - Tempo de Execução N s"*.

**Resultado esperado**
- A aba `Solicitacoes ZZY` **responde** e lista os registros da fila (não fica em
  *"Consultando logs..."* nem em branco).
- Entre duas consultas separadas por um ciclo do schedule, os registros **mudam de estado** — a fila
  drena; nenhum registro fica no estado inicial indefinidamente.
- `Qtd T.Env Fl` **não cresce sem limite** para o mesmo registro; retry repetido sem sucesso deve
  desaguar em erro visível, não em espera silenciosa.
- Nenhum grupo de solicitações **do mesmo contrato/fornecedor** fica parado em bloco em
  *Aguarda Criar Pedido de Compras*.
- O Histórico da solicitação registra a integração concluída.

**Resultado se o defeito reincidir**
- Seis (ou mais) processos **do mesmo contrato e fornecedor** parados juntos em *Aguarda Criar
  Pedido de Compras*, sem erro exibido e sem pedido gerado no ERP — sintoma de fila da unidade
  bloqueada, não de defeito por processo.

**Severidade:** Alta *(a compra não chega ao ERP; risco de prazo e de custo para a área demandante)*

**Preparação de massa:** solicitações de compra levadas até a geração de pedido, de preferência
**várias do mesmo contrato/fornecedor**, para exercitar o cenário de bloqueio em lote. Exige a área
de compras e um schedule Protheus ativo — o executor de QA não cria nem dispara.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o widget **Logs Protheus** abre, com as três abas exatas
`Erros CV8` · `Solicitacoes ZZY` · `Medicoes ZZZ`, os filtros de filial, data inicial/final,
*"Mensagem, detalhe ou processo"* e o botão **Consultar**. O **Tracker** abre com a visão
*Solicitação de Compras* selecionável em `#filterTipo`.
**Divergências encontradas:** a consulta `genericQuery` responde **404** e a grade não carrega —
**instabilidade de ambiente**, já catalogada; combina com o achado **A11-b** (na falha, o widget fica
travado em *"Consultando logs..."* e nunca diz "Nenhum registro encontrado", e `previousPage`/
`nextPage` são stubs vazios). Ou seja: **a ferramenta de diagnóstico da fila está indisponível
justamente quando a fila trava** (achado A16).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3955  (ambos · Concluído · SDCASSI-279)

**Título:** Garantir que uma SC já aprovada pelo Gestor Orçamentário não seja cancelada automaticamente pelo prazo da atividade.

**Origem:** FSWTBC-3955 — a **SC 79012 foi cancelada mesmo tendo a aprovação do Gestor
Orçamentário** (o cliente anexou o print `Aprovado.png`). Hipótese registrada: colisão entre o
temporizador de cancelamento automático introduzido pelo FSWTBC-3655 (prazos nas atividades) e o
registro da aprovação. Corrigido como **emergencial** — PR63868 / MUD17291, 10/03/2026 —
**sem causa raiz documentada** e sem levantamento de outras SCs canceladas indevidamente.

**Módulo/Rota:** `wf_solicitacao_compras` — **Validação Orçamentária** (atividade **14**, ou **269**
no fluxo *sem gestor / pool*) · superfícies: **Tracker → *Solicitação de Compras*** (filtro
`status` = *Cancelados*) e o **Histórico** da solicitação.

**Pré-condições**
- Uma SC que tenha recebido a aprovação na **Validação Orçamentária** e cuja atividade seguinte
  esteja **próxima do vencimento do prazo**.
- **Bloqueio:** o cenário depende de temporizador de prazo, que não se dispara sob demanda pela
  tela, e de perfil de gestor orçamentário — a conta de QA não tem. Aprovar/cancelar SC de terceiro
  para reproduzir é **proibido** pela regra de escrita. Verificação restrita à superfície de consulta.

**Passos**
1. Abrir **Tracker de Compras/Contratos**, `#filterTipo` = **Solicitação de Compras**,
   `status` = **Cancelados**, e um intervalo em `dataSolicitacaoDeSC`/`dataSolicitacaoAteSC`.
2. Clicar em **Pesquisar Registro** e levantar as SCs canceladas do período.
3. Para cada SC cancelada, abrir o **Histórico do processo** e verificar se há registro de
   **aprovação na Validação Orçamentária anterior ao cancelamento**.
4. Cruzar com a visão **Aprovadores SC** (`table-sca`) do próprio Tracker, filtrando a mesma SC.
5. Consulta apenas — **não cancelar, aprovar nem movimentar** nenhum registro.

**Resultado esperado**
- **Nenhuma** SC cancelada apresenta, no histórico, uma aprovação de Validação Orçamentária
  registrada **antes** do cancelamento.
- Quando o prazo de uma atividade vence, o cancelamento automático **não ocorre** sobre solicitação
  já aprovada; a SC segue para a etapa seguinte.
- Todo cancelamento automático aparece no histórico com motivo explícito e identificável
  (não como movimentação anônima).

**Resultado se o defeito reincidir**
- Uma SC com aprovação registrada do Gestor Orçamentário aparece com status **Cancelada** —
  exatamente o caso da **SC 79012**, em que a área perde a compra e precisa reabrir o processo.

**Severidade:** **Alta** *(desfaz uma aprovação válida — impacto de alçada, de prazo e de custo)*

**Preparação de massa:** uma SC própria levada até a Validação Orçamentária, aprovada, e deixada
correr até o vencimento do prazo da atividade seguinte. Exige perfil de gestor orçamentário e o
prazo configurado — não é montável pela conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o Tracker abre e oferece os filtros exatos do passo 1 — `#filterTipo` com
*Solicitação de Compras*, `#status` com **Todos/Abertos/Finalizados/Cancelados**, `#numSolCompra`,
`#dataSolicitacaoDeSC`/`#dataSolicitacaoAteSC` e `#usuarioSolicitante` — e o botão
**Pesquisar Registro**. A varredura de SCs canceladas não foi executada para não onerar o ambiente
nem induzir leitura de dado de terceiro além do necessário.
**Divergências encontradas:** o ticket fala em "Gestor orçamentário" como uma etapa única; na tela
hoje são **duas coisas distintas** — *Validação do Item Orçamentário* (formulário) e
*Validação Orçamentária* (Central de Tarefas / atividades **14** e **269**), e a aprovação do gestor
(*Validação do Gestor*, atividade **7**) é outra etapa ainda. O caso precisa dizer de qual fala.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3957  (ambos · Concluído · SDCASSI-280)

**Título:** Quando o mecanismo de atribuição por alçada não localiza os aprovadores, a SC deve cair numa atividade de Correção — não no Grupo Gestor em consenso.

**Origem:** FSWTBC-3957 — erro na aprovação de alçada da **SC 80237**. Quando
`mc_aprovadoresPorAlcadas` falha ao localizar os responsáveis (retorno com falha, dados incompletos
ou indisponibilidade), o Fluig direcionava a atividade ao **Grupo Gestor do processo**, criando
tarefa **em consenso para todos** — o que *"amplia indevidamente o público envolvido e aumenta o
retrabalho operacional"* e permite que uma alçada seja tratada por quem não tem competência para
ela. Solução implementada: direcionar para uma **atividade específica de Correção**, com opção de
reenviar para nova tentativa. PR6489 / MUD17396, em produção em 01/04/2026.

**Módulo/Rota:** `wf_solicitacao_compras` — **Aprovação de Alçada** (atividade **94**, grade
`tbAlcadas`) e a atividade de **Correção** (seq. **236** na v98) · superfícies: **Central de Tarefas**
e **Tracker → visão *Aprovadores SC*** (`table-sca`).

**Pré-condições**
- Uma SC que chegue à **Aprovação de Alçada**.
- Uma condição de falha do mecanismo de atribuição: indisponibilidade do ERP, alçada sem aprovador
  cadastrado ou dado incompleto.
- **Bloqueio duplo:** (a) a conta de QA `TOTVS-FS` **não resolve matrícula de comprador** — o
  dataset `dsProtheus_getCompradores_restGetAll` é chamado com `Y1_USER = "undefined"`, o que
  bloqueia toda a família cotação/alçada para este login (limitação de conta, §5-C, **não** defeito);
  (b) forçar indisponibilidade do ERP não é admissível no ambiente do cliente.

**Passos**
1. Levar uma SC até a **Aprovação de Alçada** com uma alçada **sem aprovador localizável**.
2. Observar para onde a tarefa é direcionada.
3. Abrir a **Central de Tarefas** e verificar quem recebeu a tarefa — um responsável ou todo o
   Grupo Gestor em consenso.
4. No Tracker, visão **Aprovadores SC**, filtrar a SC e conferir os aprovadores registrados.
5. Na atividade de **Correção**, verificar se existe a opção de **reenviar para nova tentativa**.
6. Não aprovar nem transferir tarefa alheia.

**Resultado esperado**
- A falha de localização de aprovadores direciona a SC para a **atividade de Correção**, e não para
  o Grupo Gestor.
- A tarefa de Correção tem **grupo/pool atribuído** — não nasce órfã.
- A tela de Correção permite **analisar o problema e reenviar** para nova tentativa de atribuição.
- **Nenhuma** tarefa em consenso é criada para todos os usuários do grupo gestor.
- A visão *Aprovadores SC* reflete os aprovadores corretos da alçada após o reenvio.

**Resultado se o defeito reincidir**
- A atividade cai no **Grupo Gestor** como tarefa **em consenso** para todos os usuários do grupo,
  exigindo transferência manual aos aprovadores corretos — e abrindo a possibilidade de a alçada ser
  aprovada por quem não tem competência para ela.

**Severidade:** **Alta** *(risco de aprovação de alçada por pessoa sem competência — controle de
alçada é o ponto de maior exposição financeira do fluxo)*

**Preparação de massa:** uma SC própria com valor que exija alçada, e uma alçada configurada **sem
aprovador válido**, para forçar a falha de atribuição. Exige o cadastro de alçadas no ERP —
área de compras, não o executor de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a **Central de Tarefas** abre com as abas *Resumo de Tarefas*,
*Tarefas a concluir* e *Mais opções*; o **Tracker** oferece a visão **Aprovadores SC** em
`#filterTipo`. A Aprovação de Alçada não foi exercitada por limitação de conta (§5-C).
**Divergências encontradas:** o ticket trata "aprovação do gestor" e "alçada" como uma coisa só;
na tela são **duas atividades distintas** — *Validação do Gestor* (7, switcher
`managerAprovadoValidacao`) e *Aprovação de Alçada* (94, grade `tbAlcadas`). Também é fácil errar a
grade: **`tbAlcadas`** é a da Aprovação de Alçada; **`tbForneceAlcadas`** é a da Empresa Vencedora —
e o formulário tem **quatro** campos rotulados "Aprovar?". Registro de risco correlato: o
*Ponto de atenção* dos achados alerta que o padrão `Correção` foi replicado em
`wf_cotacao_produtos_servicos` (seq 72), `wf_negociacao_cotacao_prod_serv` (51) e
`wf_solicitacao_compras` (236) — **vale confirmar se todas receberam pool**, sob pena de a tarefa de
Correção nascer órfã, que é o modo de falha que este caso existe para impedir.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3961  (fluig · Concluído · SDCASSI-283)

**Título:** Abrir uma SC na etapa de Validação Orçamentária e conferir que o valor a aprovar é exibido.

**Origem:** FSWTBC-3961 / incidente 800253 — as SCs 83004 e 82997 não exibiam os valores para aprovação do
gestor orçamentário. Reincidência de FSWTBC-3529. A explicação técnica registrada no ticket: a **atribuição
do produto está vinculada ao gestor carregado no momento da inclusão**, e a customização que atualiza esse
campo-chave roda **apenas na etapa de aprovação do gestor imediato** — na etapa orçamentária o dado segue
congelado.

**Módulo/Rota:** Central de Tarefas → tarefa de **Solicitação de Compras** em **Validação Orçamentária** →
formulário da SC (`wf_solicitacao_compras`, form 256831), seção **Validação do Item Orçamentário**

**Pré-condições**
- Uma SC que já passou pela **Validação do Gestor** e está na etapa de **Validação Orçamentária**, atribuída
  ao usuário que executará o teste.
- **Cenário que reproduz a causa:** a SC deve ter sido incluída com um gestor orçamentário **A** e, antes de
  chegar à etapa orçamentária, o gestor do produto/centro de custo deve ter sido **trocado para B** — é a
  troca de gestor entre a inclusão e a etapa que expõe o defeito.
- **Bloqueio:** trocar o gestor de um produto exige cadastro no ERP (fora do escopo Fluig e sem credencial
  Protheus). O caso é executável em sua forma simples (SC comum na etapa orçamentária), mas a **variante que
  reproduz a causa raiz** depende de manutenção de cadastro que o QA não pode fazer.

**Passos**
1. Abrir a **Central de Tarefas** e clicar explicitamente na aba **Tarefas a concluir** (a sub-aba fica
   guardada por sessão no servidor; não confiar no estado herdado).
2. Abrir a tarefa de **Solicitação de Compras** que está em **Validação Orçamentária**.
3. Rolar até a seção **Validação do Item Orçamentário**.
4. Conferir os campos de identificação: **NºProcesso Fluig \***, **Nº SC Origem ERP \***, **Cód. Filial Origem \***.
5. Ler o campo **Total Estimado a Aprovar (R$) \***.
6. Conferir a grade **Item Orçamentário** e comparar o total com o somatório de **Vlr. Total Estimado** dos
   itens da seção **Produtos/Serviços da Solicitação**.

**Resultado esperado**
- **Total Estimado a Aprovar (R$) \*** é exibido preenchido, com valor maior que zero.
- O valor exibido é **coerente com os itens da solicitação**: bate com o somatório dos **Vlr. Total
  Estimado** dos itens atribuídos àquele gestor orçamentário.
- A grade **Item Orçamentário** lista os itens sob responsabilidade do gestor, e não vem vazia.
- O comportamento se mantém **mesmo quando o gestor do produto foi trocado depois da inclusão da SC** — o
  vínculo é atualizado na entrada da etapa orçamentária, não apenas na etapa do gestor imediato.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A seção abre **sem valores**: **Total Estimado a Aprovar (R$)** vazio ou zerado e/ou a grade de itens
  orçamentários sem linhas, deixando o gestor sem base para aprovar ou reprovar.

**Severidade:** Alta *(aprovação de alçada sobre valor não exibido — o gestor aprova às cegas ou trava o fluxo)*

**Preparação de massa:** uma SC em **Validação Orçamentária** atribuída ao executor, com pelo menos um item
com valor estimado. Para a variante que reproduz a causa raiz, é preciso que a **atribuição do gestor
orçamentário do produto tenha mudado após a inclusão da SC** — depende de cadastro no ERP, feito por quem
administra a base do Protheus.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no formulário da SC (256831), a seção **Validação do Item Orçamentário** existe e
contém os campos **Aprovador \***, **Email do Aprovador \***, **Data da Aprovação \***, **Hora da Aprovação \***,
**NºProcesso Fluig \***, **Nº SC Origem ERP \***, **Cód. Filial Origem \***, **Total Estimado a Aprovar (R$) \***
(`tbitorc_vlrTotEstItem`), **Aprovar? \*** (Sim/Não) e **Justificativa para a Aprovação/Reprovação \***, com a
grade **Item Orçamentário**. A seção **Produtos/Serviços da Solicitação** traz **Vlr. Total Estimado \***, que
é a base de comparação do passo 6. Não abri uma SC real nessa etapa: a Central de Tarefas desta conta tem
tarefas de SC em **Validação do Gestor** (etapa anterior), não em Validação Orçamentária.
**Divergências encontradas:** o ticket diz "aprovação do **gestor orçamentário**". Na tela isso são dois
rótulos distintos: a seção do formulário chama-se **Validação do Item Orçamentário** e a atividade na
Central de Tarefas chama-se **Validação Orçamentária** (com a variante **Validação Orçamentária (Sem Gestor)**,
que o ticket não menciona e que muda o cenário). O campo de valor não se chama "valores": é
**Total Estimado a Aprovar (R$)**.
**Dados/massa usados:** nenhum — nenhuma SC foi movimentada nem aprovada.

---

## CT-FSWTBC-4072  (ambos · Concluído · SDCASSI-108)

**Título:** Abrir uma nova Solicitação de Compras com item contábil preenchido, sem receber a help crua do ERP.

**Origem:** FSWTBC-4072 (DEM10013716) — erro ao abrir nova solicitação de compra:
**"AJUDA:CX_ITEMCTA Item da Conta Contábil"** (instância Fluig 9881). A mensagem `AJUDA:` é a **help
de consistência do campo do dicionário Protheus**: o valor de item contábil enviado pelo widget não
passa na validação e o usuário recebe a help **crua do ERP** dentro do processo Fluig, sem tradução
para o contexto do formulário. Levou **101 dias**; a correção foi registrada apenas como
*"Corrigido e atualizado no git"*, **sem descrição da causa nem do fonte alterado**.

**Módulo/Rota:** `wf_solicitacao_compras` → **Nova Solicitação de Compras**, campos contábeis do item
(Conta Contábil, **Item Contábil**, Centro de Custo, Classe de Valor) · superfície de integração:
campo **"Retorno Integração"** da SC e o **Histórico** do processo.

**Pré-condições**
- Usuário apto a abrir SC.
- Um item contábil **válido** e um **inválido/fora de domínio** para o contraste.
- **Bloqueio:** o domínio de `CX_ITEMCTA` é dicionário Protheus e não há credencial para consultá-lo
  nesta rodada; o caso é executável no Fluig, mas a lista de valores válidos precisa vir da
  contabilidade.

**Passos**
1. **Central de Tarefas → Nova solicitação → Solicitação de Compras.**
2. Preencher os campos obrigatórios do cabeçalho e incluir **um item**.
3. Preencher os campos contábeis do item, incluindo **Item Contábil**, com um valor **válido**.
4. Observar se aparece alguma mensagem iniciada por **`AJUDA:`**.
5. Repetir com um item contábil **inválido** e observar a crítica.
6. **Não confirmar** a solicitação — a validação de campo dispara sem submeter.
7. Se houver SC já criada com o erro, abrir seu **Histórico** e ler o campo **"Retorno Integração"**.

**Resultado esperado**
- Com item contábil válido, a SC abre e o item é aceito **sem nenhuma mensagem `AJUDA:`**.
- Com item contábil inválido, a crítica é **do formulário**, em linguagem do usuário, dizendo qual
  campo está errado e qual o domínio aceito.
- **Em nenhuma hipótese** a help crua do dicionário Protheus (`AJUDA:CX_ITEMCTA Item da Conta
  Contábil`) chega à tela do Fluig.
- O campo **"Retorno Integração"** da SC fica vazio quando o item contábil é válido.

**Resultado se o defeito reincidir**
- Ao abrir a solicitação de compra, aparece **"AJUDA:CX_ITEMCTA Item da Conta Contábil"** — mensagem
  do ERP, sem contexto, que o usuário do Fluig não tem como interpretar nem corrigir.

**Severidade:** Média *(bloqueia a abertura da SC; sem risco financeiro direto, mas o usuário fica
sem ação possível)*

**Preparação de massa:** lista dos valores válidos de item contábil (`CX_ITEMCTA`) fornecida pela
contabilidade, mais um valor sabidamente inválido. Nada precisa ser criado no Fluig.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o processo **Solicitação de Compras** (`wf_solicitacao_compras`) está
publicado e a **Central de Tarefas** oferece **Nova solicitação**. O formulário da SC não foi
preenchido nesta sessão — o achado **A13** já mediu que **o formulário da SC em branco dispara 165
requisições**, e o objetivo aqui era não onerar o ambiente compartilhado com os demais lotes.
**Divergências encontradas:** o ticket não diz **em qual atividade** o erro aparecia. Vale registrar
que o campo *Total Estimado a Aprovar (R$)* e boa parte da validação orçamentária só são montados nas
atividades **14**, **269** ou com `WKPanelBudgetItem=true` — se o `AJUDA:CX_ITEMCTA` vier da
validação orçamentária, **testar só na abertura não exercita a correção**. Como o ticket registra
apenas *"Corrigido e atualizado no git"*, **não há como saber qual regra mudou** — este caso cobre o
sintoma, não a regra.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4094  (ambos · Concluído · SDCASSI-293)

**Título:** Consultar, no próprio Fluig, o número do pedido/contrato gerado no Protheus a partir dos detalhes da solicitação.

**Origem:** FSWTBC-4094 — o número do pedido/contrato gerado **não era apresentado nos detalhes da
solicitação**; o usuário precisava abrir o Protheus para descobrir. **Atenção — o ticket foi
entregue com escopo diferente do título:** em reunião de 20/03 definiu-se que *"será inserido apenas
o e-mail do comprador participante do processo, somente no disparo do e-mail da cotação vencedora"*.
Foi isso que foi homologado em 08/04/2026, mas título, descrição e a chave SDCASSI-293 continuam
descrevendo o problema original. **A necessidade original permanece não atendida e sem ticket
próprio** — quem consultar este ticket vai concluir, erradamente, que o número passou a aparecer.

**Módulo/Rota:** `wf_solicitacao_compras` → **Detalhes / Histórico da solicitação** · e o e-mail de
cotação vencedora (escopo efetivamente entregue).

**Pré-condições**
- Uma solicitação de compras que já tenha gerado **pedido** (ou **contrato**) no Protheus.
- **Bloqueio:** sem credencial Protheus não se confirma o número gerado do lado do ERP — mas o caso
  é justamente sobre **exibi-lo no Fluig**, então a verificação é toda no Fluig. Não havia
  solicitação própria do executor já integrada; consulta feita só nas superfícies.

**Passos**
1. Localizar, pelo **Tracker** (visão *Solicitação de Compras*, `status` = *Finalizados*), uma SC que
   já tenha gerado pedido/contrato.
2. Abrir os **detalhes da solicitação** e procurar o número do pedido/contrato.
3. Abrir o **Histórico do processo** e procurar a linha de integração
   (*"Integração executada com sucesso - Tempo de Execução N s"*) e o número gerado.
4. Abrir o modal **"Informações Complementares do Contrato"** e conferir *Status da Integração GCT*,
   *Erro de Integração* e *Fiscal de Serviço*.
5. Conferir se o e-mail de **cotação vencedora** traz o **e-mail do comprador participante**
   (o escopo que foi de fato entregue).
6. Consulta apenas.

**Resultado esperado**
- O número do **pedido** (ou do **contrato**) gerado no Protheus é **visível no Fluig**, nos detalhes
  ou no histórico da solicitação — sem exigir login no ERP.
- O histórico registra a integração e o identificador gerado.
- O e-mail de cotação vencedora inclui o e-mail do comprador participante.

**Resultado se o defeito reincidir** *(e este caso tende a REPROVAR hoje — a causa nunca foi corrigida)*
- Os detalhes e o histórico da solicitação **não mostram** o número do pedido/contrato, e o usuário
  precisa abrir o Protheus para descobri-lo — exatamente o que o SDCASSI-293 relatou e que **não foi
  implementado**, porque o escopo mudou para o e-mail do comprador.

**Severidade:** Média *(não há perda de dado, mas obriga o usuário a acessar o ERP para uma
informação de rotina — e o registro do ticket induz a crer que está resolvido)*

**Preparação de massa:** uma SC própria levada até a geração do pedido/contrato no ERP, para que o
número exista e possa ser procurado no Fluig. Depende do ciclo completo de compras.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o **Tracker** abre e permite filtrar *Solicitação de Compras* por
`status` = *Finalizados*, `numSolCompra` e `nrContratoSC`; o *Acompanhamento de Contratos* traz o
ícone **"Informações do Contrato"** na coluna Ação, que é a porta do modal do passo 4. Não localizei
uma SC própria já integrada para percorrer os passos 2–3 sem ler processo de terceiro.
**Divergências encontradas:** **a maior divergência é documental** — o ticket consta *Concluído/Feito*
mas **entregou coisa diferente do que o título diz**. Qualquer leitura deste caso deve partir de que
o comportamento esperado (número do pedido/contrato visível no Fluig) **provavelmente reprova hoje**,
e que isso **não é regressão: é requisito nunca implementado**. Registro correlato dos achados: o
FSWTBC-4342 dizia "Não Contratado" e o botão real em produção é *"Ver Solicitação da Compra"* — a
mesma classe de defasagem entre ticket e tela.
**Dados/massa usados:** nenhum — não submetido.

## CT-FSWTBC-4096  (fluig · Concluído · SDCASSI-295)

**Título:** Cancelar uma Solicitação de Compras e confirmar que as negociações derivadas dela deixam de ser aprováveis.

**Origem:** FSWTBC-4096 — ao cancelar a SC 9923, os processos de **negociação** derivados continuavam
**abertos e passíveis de aprovação** pela Central de Tarefas do Comprador (processo 9941). Não era só
exibição: o fluxo **permitia a ação**, de modo que uma negociação de solicitação cancelada podia ser
aprovada e virar compromisso sobre documento morto. Reprovado duas vezes (31/03 e 02/04 — SC 10434
cancelada, negociações 10443 e 10444 não) e corrigido em 07/04. É o único ticket do lote com evidência de
teste produzida pela fábrica (vídeo de 139 MB).

**Módulo/Rota:** **Central de Tarefas** (`/portal/p/1/pagecentraltask`) e **Solicitação de Compras**
(`wf_solicitacao_compras`) → cancelamento da solicitação; efeito observado nas instâncias de
**Negociação de Cotação de Produtos e Serviços** (`wf_negociacao_cotacao_prod_serv`).

**Pré-condições**
- Uma **SC criada pelo próprio executor** (prefixo `QA`), levada até a fase de negociação, com **pelo menos
  duas** instâncias de negociação derivadas — o defeito histórico se manifestou justamente com duas
  (10443 e 10444), e uma só instância pode mascarar a falha de propagação em lote.
- Os números das instâncias de negociação derivadas anotados **antes** do cancelamento.
- **Bloqueio:** duplo. (a) É **proibido cancelar registro pré-existente** que não seja do executor (§2 do
  briefing) — este caso **exige** que a SC seja criada pelo próprio testador; (b) a conta de QA não tem SC
  própria em fase de negociação, e criar a cadeia completa depende de credencial de comprador com matrícula
  válida, que ela não possui. Nenhum cancelamento foi executado nesta rodada.

**Passos**
1. Localizar a SC de teste (criada pelo executor) e anotar seu número.
2. Anotar os números de **todas** as instâncias de **Negociação** derivadas dessa SC.
3. Confirmar, na **Central de Tarefas** → aba **Tarefas a concluir** (clicando explicitamente na aba, que é
   guardada por sessão no servidor), que as tarefas de negociação estão listadas e acionáveis.
4. **Cancelar a SC**, informando o texto de cancelamento exigido.
5. Recarregar a **Central de Tarefas** → **Tarefas a concluir**.
6. Para cada instância de negociação anotada no passo 2, tentar abri-la e acionar a aprovação.

**Resultado esperado**
- Após o cancelamento da SC, **nenhuma** das instâncias de negociação derivadas permanece **aberta**.
- **Nenhuma** delas aparece como tarefa acionável na Central de Tarefas do comprador.
- A tentativa de aprovar qualquer uma delas é **bloqueada** — o controle de aprovação não fica disponível
  e a movimentação não é aceita.
- A propagação vale para **todas** as instâncias derivadas, não apenas para a primeira: se havia duas
  negociações, as duas são encerradas.
- No Portal do Comprador, as propostas dessa cotação passam a ser tratadas como canceladas e as ações
  correspondentes ficam indisponíveis.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A SC aparece cancelada, mas as instâncias de negociação derivadas seguem **abertas** e continuam listadas
  como tarefas **aprováveis** na Central de Tarefas do Comprador — permitindo aprovar uma negociação de uma
  solicitação já cancelada. Na segunda reprovação, a SC 10434 foi cancelada e as negociações 10443 e 10444
  não.

**Severidade:** Alta *(permite aprovação e geração de compromisso sobre documento cancelado — risco financeiro e de alçada direto)*

**Preparação de massa:** uma SC criada pelo executor, com prefixo `QA` nos campos de texto livre, levada até
gerar **duas ou mais** negociações. Depende de credencial de comprador com matrícula válida no ERP para
percorrer a cadeia SC → cotação → negociação. **Sob nenhuma hipótese** usar uma SC pré-existente da base
para este caso, já que ele exige cancelamento.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a **Central de Tarefas** abre (`Cassi - Fluig Plataforma - Central de Tarefas`), com
as abas **Resumo de Tarefas** e **Tarefas a concluir** e o botão **Nova solicitação**; a conta tem tarefas de
**SOLICITAÇÃO DE COMPRAS** (em *Validação do Gestor*) e de **COTAÇÃO DE PRODUTOS E SERVIÇOS** (em *Correção*),
e **nenhuma** de negociação. O processo **Negociação de Cotação de Produtos e Serviços**
(`wf_negociacao_cotacao_prod_serv`) está publicado e seu formulário abre. No bundle Angular do Portal do
Comprador confirmei que **o estado de cancelamento é respeitado hoje**: a flag `hd_cancelarProposta` é lida
por linha (`B = H ? H.hd_cancelarProposta === "true" : false`) e a habilitação da ação exige `!B` —
`E && k == "0" && !B && (V = true)`, onde `k == "0"` significa processo aberto. Ou seja, proposta marcada
como cancelada **não** habilita ação no portal. Isso é evidência do mecanismo, **não** da propagação do
cancelamento da SC para as instâncias filhas de negociação, que é o cerne do defeito e só se prova
executando o cancelamento.
**Divergências encontradas:** duas. (1) O ticket fala em **"Central de Tarefas do Comprador"**; não existe
tela com esse nome — existe a **Central de Tarefas** genérica do Fluig (`/portal/p/1/pagecentraltask`), com
as abas **Tarefas a concluir** e **Solicitações** (*Minhas solicitações*, *Tarefas sob minha gerência*).
(2) Os números citados (SC 9923/10434, negociações 9941/10443/10444) são de outra base: as instâncias
atuais deste ambiente estão na faixa 112.9xx–113.2xx, e o cenário precisa ser reconstruído com massa nova.
Observação de processo, alinhada à recomendação da análise: hoje a única garantia deste comportamento é um
vídeo de 139 MB anexado ao ticket — é o candidato mais forte do lote a virar teste automatizado permanente
(cancelar a SC e afirmar que nenhuma instância de negociação derivada permanece aprovável).
**Dados/massa usados:** nenhum — **nenhum cancelamento foi executado**, em nenhum registro.

## CT-FSWTBC-4127  (fluig · Concluído · SDCASSI-304)

**Título:** Levar uma SC até o Disparo de E-mails e confirmar que a etapa conclui — e que, se o serviço de propostas vencedoras oscilar, o erro é tratado em vez de abortar o fluxo.

**Origem:** FSWTBC-4127 — erro na etapa **Disparo de E-mail** do Portal de Compradores, na **SC 10009**. Encerrado **sem causa identificada**: a análise de código não achou inconsistência e o erro foi atribuído a *"instabilidade momentânea no serviço REST responsável por listar as informações das propostas vencedoras"*; o cliente homologou em 08/04 por **ausência de reincidência**, não por correção. A própria análise conclui que o defeito real — ausência de tratamento de indisponibilidade na etapa — **continua presente**.

**Módulo/Rota:** `wf_solicitacao_compras`, atividade **`185 - Disparo de E-mails`**, com captura em **`187 - Captura de Erro - Disparo de E-mails`**. Conferência na aba **Histórico** da solicitação.

**Pré-condições**
- Uma SC que tenha percorrido cotação → negociação → alçadas e chegado à atividade `185 - Disparo de E-mails`.
- Uma cotação com **proposta vencedora definida** (é o dado que a etapa consulta).
- **Bloqueio:** sim, em dois níveis. (a) A conta de QA não conclui o ciclo até 185 — depende de gestor, alçada e integração com o ERP. (b) O cenário de indisponibilidade **não pode ser forçado em tela**: derrubar o serviço REST de propostas vencedoras não é uma ação de interface, e o briefing proíbe rodar rotinas/batch. A segunda metade do caso só é executável com o time de infraestrutura ou por teste automatizado que intercepte a chamada.

**Passos**
1. *(Caminho feliz)* Levar uma SC até a atividade **`185 - Disparo de E-mails`**.
2. Abrir a solicitação e ler a aba **Histórico**.
3. Confirmar que existe registro de conclusão de `185 - Disparo de E-mails` e que **não** existe entrada em `187 - Captura de Erro - Disparo de E-mails`.
4. Confirmar que o processo **avançou** para a atividade seguinte — não ficou parado em 185.
5. *(Caminho de indisponibilidade — requer apoio de infraestrutura ou automação)* Com o serviço REST de propostas vencedoras indisponível, repetir o passo 1.
6. Ler o Histórico e a mensagem apresentada ao usuário.

**Resultado esperado**
- Caminho feliz: `185 - Disparo de E-mails` conclui, o processo avança, e o Histórico **não** registra `187 - Captura de Erro`.
- Caminho de indisponibilidade: a etapa **distingue "serviço indisponível" de "defeito"** — registra o erro em `187 - Captura de Erro - Disparo de E-mails` com mensagem que identifique a chamada REST que falhou, **não aborta o fluxo em silêncio**, e a solicitação permanece recuperável (reprocessável) em vez de morrer na etapa.
- O Histórico permite correlacionar a falha com a chamada externa — hoje é o único lugar do Fluig em que esse rastro pode aparecer.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro na etapa **Disparo de E-mail** (relatado na **SC 10009**), sem mensagem que identifique a origem, sem log correlacionado e sem retentativa — a investigação **recomeça do zero** a cada ocorrência. O texto exato do erro `<não documentado>`: os anexos do ticket são prints, e o texto não foi transcrito.

**Severidade:** Média *(bloqueia o fluxo na etapa final e impede a comunicação com fornecedor e gestor; não corrompe dado, mas deixa a SC parada sem diagnóstico)*

**Preparação de massa:** uma SC com proposta vencedora definida, levada até `185 - Disparo de E-mails`, criada por perfil de comprador com apoio de gestor e alçada — **não criável pela conta de QA**. Para o passo 5, é necessário **combinar com o time de infraestrutura** uma janela de indisponibilidade controlada do serviço REST de propostas vencedoras, ou implementar o cenário como teste automatizado que intercepte essa chamada (o repositório de E2E já tem a técnica: `utils/dataset-fluig.js` derruba um dataset por nome sem derrubar serviço do cliente).

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — o processo `wf_solicitacao_compras` abre em `/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras` (título *Cassi - Fluig Plataforma - Movimentar Solicitação*, heading *Início*, abas **Formulário / Informações / Histórico / Anexos**, botões *Enviar* e *Opções*); a aba **Histórico**, que é a superfície onde o resultado deste caso se lê, existe. *Lido no fonte publicado* — o mapa de atividades do widget da SC confirma **`disparoEmails: 185`**; a atividade `187 - Captura de Erro - Disparo de E-mails` está registrada no histórico de instâncias reais deste ambiente (mapeamento já levantado em lote anterior). **Nenhuma instância em 185 foi observada nesta sessão.**
**Divergências encontradas:** o ticket chama a etapa de **"Disparo de E-mail"** (singular); no processo o nome é **`185 - Disparo de E-mails`** (plural). Divergência de fundo, mais importante: o ticket está marcado **"Feito"/"Concluído"**, mas **nenhuma correção foi feita** — foi encerrado por ausência de reincidência. Este caso, portanto, **não é regressão de uma correção**: é a caracterização de um comportamento que pode voltar a qualquer momento, e o passo 5 cobre um defeito que, pela própria análise do ticket, **continua aberto**.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4146  (ambos · Concluído · SDCASSI-309)

**Título:** Definir o vencedor no Portal do Comprador e ver a SC sair de "Aguarda Geração Alçadas" para a grade de alçada em minutos.

**Origem:** FSWTBC-4146 — processo 10062 travado em "Aguarda geração alçadas" com vencedor já definido.
Resolvido por normalização da fila de Compras (ZZY), sem causa raiz; ficou a suspeita de RPOs
divergentes entre balance e schedule (ticket Matriz 27018443).

**Módulo/Rota:** Fluig → **Solicitação de Compras** → atividades **Aguarda Geração Alçadas (309)** →
**Gerar Grid de Alçada (310)** → gateway **Alçada foi Gerada? (225)** → **Aprovação de Alçadas (94)**;
aba **Histórico** · **Logs Protheus** → **Solicitacoes ZZY** (filtro **Rotina**) · Tracker, visão
**Aprovadores SC** (`table-sca`).

**Pré-condições**
- SC própria com cotação concluída e **vencedor definido** no Portal do Comprador (*Definir Vencedor
  Cotação*).
- Fila de Compras (UCOME038/036) rodando.
- **Bloqueio:** a conta de QA não resolve comprador — não consegue definir vencedor. Nenhuma SC está
  hoje na 309 (8 ativas: 7, 119, 236, 6, 161) — sem massa viva para observar.

**Passos**
1. No Portal do Comprador, definir o vencedor da cotação da SC.
2. Abrir *Detalhes da Solicitação* → **Histórico**; anotar a hora de entrada em **"Aguarda Geração
   Alçadas"**.
3. Em **Logs Protheus → Solicitacoes ZZY**, filtrar pela **Chave** (nº da SC) e ler **Rotina**,
   **Status Proth**, **Status Fluig**, **Qtd T.Env Fl**, **Msg Ret Flui**.
4. Recarregar o Histórico após 15 minutos.
5. No Tracker, visão **Aprovadores SC**, filtrar a SC.

**Resultado esperado**
- Passo 4: **"Gerar Grid de Alçada" (310)** executada e o processo em **"Aprovação de Alçadas" (94)**;
  o Histórico traz *"Integração executada com sucesso - Tempo de Execução N s"*.
- Passo 3: o registro ZZY da rotina de alçada com **Status Proth = processado** e `Qtd T.Env Fl` ≤ 3.
- Passo 5: a grade de aprovadores da SC está preenchida.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Processo parado em **"Aguarda geração alçadas"** por horas/dias com o vencedor já definido; nenhum
  erro; registro ZZY em `status='N'` sem evolução.

**Severidade:** Média

**Preparação de massa:** uma SC do executor com cotação vencida e comprador com matrícula — criada com
prefixo `QA`.

**Verificado em tela:** PARCIAL
**O que foi verificado:** por dado (6.000 movimentos): **309 "Aguarda Geração Alçadas"** existe em
todas as versões (v83–v98, 32 movimentos), seguida de **310 "Gerar Grid de Alçada"** e do gateway
**225 "Alçada foi Gerada?"**. Widget Logs Protheus aberto com filtros **Filial / Chave / Rotina /
Status / Data inicial / Data final** na ZZY (Consultar → 404, ambiente). Tracker aberto.
**Divergências encontradas:** (1) o ticket grafa "Aguarda geração alçadas"; na tela é **"Aguarda
Geração Alçadas"**; (2) nenhuma causa de código registrada — este caso mede **tempo**, não regra; (3)
o mesmo mecanismo (fila ZZY) está travado hoje no Faturamento (CT-FSWTBC-4121), o que torna o cenário
reprovável por ambiente.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4213  (ambos · Concluído · SDCASSI-320)

**Título:** Uma SC sem orçamento deve parar em "Verificar retorno Protheus" sem gerar pedido; com orçamento inserido, deve seguir para a geração do pedido sem voltar à trava.

**Origem:** FSWTBC-4213 — SC 10296 gerou pedido estando parada em "Verificar Trava Orçamentária"; após
inserir orçamento, o processo voltava sempre à trava e só avançou ao "encerrar". SC 10441: erro cru do
ERP *"Valor atribuido difere da lista de valores validos (Tp. Doc.)"* sem tradução.

**Módulo/Rota:** Fluig → **Solicitação de Compras** → **Integração com ERP (287)** → **Verificar
retorno Protheus (317)** → **Fim - Verificar Trava Orçamentária (319)** / **Aguarda Geração do
Pedido/Contrato (323)**. Formulário: painel **"Verificação da Trava Orçamentária"** (`panelBudgetLock`:
**Responsável \***, **Email do Responsável \***, **Data da Validação \***, **Hora da Validação \***) e
campo **Retorno Integração**.

**Pré-condições**
- SC própria aprovada até a 287 cujo item aponte conta/centro de custo **sem saldo** orçamentário.
- Gestor orçamentário cooperante para inserir orçamento.
- **Bloqueio:** verificar a **não geração** do pedido é no Protheus (sem credencial); no Fluig prova-se
  pela atividade e pelo Tracker (visão *Faturamento/Pedido* não expõe SC5).

**Passos**
1. Levar a SC até a **Integração com ERP (287)**.
2. Abrir *Detalhes* → **Histórico**: conferir a atividade atual e ler **Retorno Integração**.
3. Abrir o formulário e o painel **Verificação da Trava Orçamentária**.
4. Após inserir o orçamento (gestor), movimentar a SC pela 317.
5. Reler o Histórico.

**Resultado esperado**
- Passo 2: SC em **"Verificar retorno Protheus" (317)**; **Retorno Integração** com mensagem
  **legível** de falta de orçamento, indicando a ação do comprador.
- **Nenhum pedido** enquanto a SC estiver na 317.
- Passo 5: SC em **"Aguarda Geração do Pedido/Contrato" (323)** — **não** retorna à 317.
- Mensagens cruas do ERP (ex.: *"Valor atribuido difere da lista de valores validos (Tp. Doc.)"*) vêm
  acompanhadas de tradução/ação.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Pedido gerado com o processo parado na trava (SC 10296); após inserir orçamento, volta sempre para
  "verificar a trava"; só avança ao encerrar; erro cru de *Tp. Doc.* sem orientação (SC 10441).

**Severidade:** Alta

**Preparação de massa:** SC do executor com item em conta sem orçamento; gestor orçamentário para o
passo 4.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no HTML publicado da SC, o painel `<!-- VERIFICAÇÃO DA TRAVA ORÇAMENTÁRIA -->`
(`panelBudgetLock`, ids `anLocBudgNameResponsible`, `anLocBudgMailResponsible`,
`anLocBudgDateResponsible`, `anLocBudgTimeResponsible`) e o campo **Retorno Integração**
(`data-required="true"` + `readonly`). Por dado: **317 "Verificar retorno Protheus"** (6 movimentos,
v94–v97), **319 "Fim - Verificar Trava Orçamentária"** (`END_EVENT_TERMINATE`, v94), **323** (21).
**Divergências encontradas:** (1) o ticket chama a etapa de "Verificar Trava Orçamentária"; na tela é
**"Verificar retorno Protheus" (317)** — o nome "Trava" só existe no **fim 319** e no painel; (2) o JS do
formulário declara `verificaTravaOrcamentaria: 317, fimVerificaTravaOrcamentaria: 104` — **a 104 não
existe** nos 6.000 movimentos e a 319 real **não é conhecida pelo JS**: qualquer tratamento de tela
condicionado ao fim da trava nunca dispara (candidato a achado); (3) o ticket pergunta "como sabemos
qual é o retorno do Protheus?" — a resposta é o campo **Retorno Integração**, que não é citado no
ticket.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4229  (ambos · Concluído · SDCASSI-322)

**Título:** Abrir uma Solicitação de Compras e vê-la integrar com o ERP, chegando à Validação do Gestor — sem cair na atividade "Correção" do grupo de erro.

**Origem:** FSWTBC-4229 — SCs abertas em 30/03 não integravam e iam para o grupo de erro. Causa
(FSWTBC-4231): compilação em homologação usou fontes de **produção**, apagando o novo fluxo — regressão
por sobrescrita. Recuperado recompilando a branch antiga.

**Módulo/Rota:** Fluig → **Solicitação de Compras** → **Início (6)** → **Compra Centralizada? (294)** →
**Grava SC e Anexos (233)** → **Distribuição Gestor Orçamentario (280)** → **Validação do Gestor (7)**;
desvio de erro: **Correção (236)**, pool `G.P.Requisicao_de_Compras_Correcoes`. Aba **Histórico**;
campo **Retorno Integração**; **Logs Protheus → Erros CV8**.

**Pré-condições**
- Conta que abre SC (a de QA abre); Protheus e fila no ar.
- **Bloqueio:** nenhum para o caminho feliz — mas criar SC **grava** no ERP; usar prefixo `QA`.

**Passos**
1. Criar uma SC mínima (`QA` na **Justificativa para a Solicitação**), 1 item, rateio 100 %; enviar.
2. Abrir *Detalhes* → **Histórico** e acompanhar por 10 minutos.
3. Ler **Retorno Integração** no formulário.
4. Se a SC cair em **Correção (236)**, abrir **Logs Protheus → Erros CV8** com o **Id Fluig**.

**Resultado esperado**
- Passo 2: Histórico com **Grava SC e Anexos** concluída e *"Integração executada com sucesso - Tempo de
  Execução N s"*, seguindo para **Distribuição Gestor Orçamentario** e **Validação do Gestor**.
- Passo 3: **Retorno Integração** com o nº da SC do ERP (**Nº da Solicitação ERP** preenchido).
- **Nenhuma** passagem por **Correção (236)**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Todas as SCs do dia caem no grupo de erro (Correção) sem integrar; a causa é ambiente (fontes
  errados), não dado — várias SCs simultâneas com o mesmo sintoma é a assinatura.

**Severidade:** Alta

**Preparação de massa:** nenhuma além da SC criada pelo executor (será cancelada pelo teardown do
projeto se criada pela suíte; manual: registrar o nº para higiene).

**Verificado em tela:** PARCIAL
**O que foi verificado:** SC **113267**, criada hoje 09:40 pela conta de QA: **Início → Compra
Centralizada? → Grava SC e Anexos (09:40:02 → 09:43:14)** — o caminho feliz existe e roda. Por dado,
**236 "Correção"** (TASK_USER) atribuída a **`Pool:Group:G.P.Requisicao_de_Compras_Correcoes`**, com a
SC **113196** ativa ali desde 03/09 (transferida ao `TOTVS-FS`). Widget Logs Protheus aberto (CV8 com
filtros **Id Fluig / Filial / Data inicial / Data final / Texto**; Consultar → 404).
**Divergências encontradas:** (1) o ticket fala em "grupo de erro"; na tela é a atividade **"Correção"**
com o pool acima; (2) há uma SC em Correção **hoje** (113196) — causa não apurada aqui, não é o
incidente de 30/03; (3) não há controle visível que impeça a recompilação pela branch errada — o caso
só detecta o efeito.
**Dados/massa usados:** SCs 113267 e 113196 — leitura.

---

## CT-FSWTBC-4234  (ambos · Concluído · SDCASSI-324)

**Título:** Quando a liberação do documento no ERP falha, a SC deve exibir a mensagem real do Protheus em "Retorno Integração" e no Histórico — nunca "Erro: undefined".

**Origem:** FSWTBC-4234 — SC 83344 parada com erro "undefined": o Protheus respondeu 401 *"Este
documento ja foi liberado"* (para um documento que o fluxo tinha **reprovado**), a mensagem foi perdida
entre `handleDocAuthorityAction` → `handleDocumentApproval` → `servicetask287`, e o e-mail de erro
falhou por endereço inválido (SMTP 501). Duplicado no SDCASSI-229.

**Módulo/Rota:** Fluig → **Solicitação de Compras** → **Integração com ERP (287)** — a **terceira**
"Integração com ERP" do Histórico (`integracaoERP3`) — → **Verificar retorno Protheus (317)** /
**Correção (236/288)**. Campo **Retorno Integração**; aba **Histórico**.

**Pré-condições**
- SC própria que chegue à 287 com estado divergente no ERP (documento já liberado ou já reprovado).
- **Bloqueio:** forçar a divergência exige atuar no Protheus (sem credencial); o e-mail de erro não é
  observável pela conta de QA.

**Passos**
1. Levar a SC até a **Integração com ERP (287)**.
2. Abrir *Detalhes* → **Histórico** e ler o texto da atividade 287.
3. Abrir o formulário e ler **Retorno Integração**.
4. Conferir a atividade atual.

**Resultado esperado**
- Passo 2–3: em falha, o texto contém a mensagem **do ERP** (ex.: *"Este documento já foi liberado"*)
  com o código (401) — **nunca** `Erro: undefined`.
- Passo 4: a SC vai para **Verificar retorno Protheus (317)** ou **Correção**, com responsável definido.
- Uma SC **reprovada** pelos gestores **não** chama liberação de documento na 287.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC parada com **"Erro: undefined"** (`JavaScriptException <Unknown source>#158`), movida para
  captura de erro após esgotar tentativas; notificação não enviada (SMTP 501 5.1.3).

**Severidade:** Alta

**Preparação de massa:** SC do executor com documento em estado divergente no ERP — exige ação no
Protheus por terceiro.

**Verificado em tela:** PARCIAL
**O que foi verificado:** por dado, **287 "Integração com ERP"** existe (25 movimentos) com o mesmo
nome das seq **20** e **177**; **317** e **288/236 "Correção"** existem. No HTML publicado da SC, o
campo **Retorno Integração** (`readonly`, `data-required="true"`). O `UtilsHandler` do formulário trata
explicitamente `"undefined"` como string (`data != "undefined"`) — evidência de que o valor **chega**
ao front como texto.
**Divergências encontradas:** (1) o ticket chama a atividade de "servicetask287 (Aprova Documento)";
no Histórico ela aparece como **"Integração com ERP"**, indistinguível das seq 20 e 177 sem o número;
(2) o mesmo padrão "`undefined` como valor" apareceu hoje em `ds_fatcon_get_competencia`
(`CODE:"undefined"`) — a classe de defeito é transversal; (3) a correção foi por remissão ao
SDCASSI-229: o mascaramento no BPM **não** consta corrigido.
**Dados/massa usados:** nenhum — não submetido.

## CT-FSWTBC-4312  (fluig · Concluído · SDCASSI-347)

**Título:** Consultar, no formulário da SC, quem aprovou ou reprovou cada linha da alçada e quando.

**Origem:** FSWTBC-4312 — o histórico da etapa de aprovação de alçada não era exibido no formulário da SC, comprometendo a rastreabilidade das aprovações.

**Módulo/Rota:** Central de Tarefas / Processos → instância do processo **Solicitação de Compras** → formulário (documento **256831**) → bloco da grade de alçadas (`tbAlcadas`), atividades **94 — Aprovação de Alçada**, **210 — Validação do Comprador (Alçadas)** e **104 — Fim da Validação do Comprador**.

**Pré-condições**
- Uma SC que já tenha passado pela geração de alçadas (`tbAlcadas` preenchida) e recebido pelo menos uma decisão (Aprovado/Reprovado) com justificativa.
- Para ver a linha como aprovador, o usuário precisa ter o código ERP igual a `tbalcada_codERPUserValid`, ou ser substituto válido, ou pertencer ao grupo **`G.P.Requisicao_de_Compras_Validacao_Alcadas`**.
- **Bloqueio:** a conta de QA não tem código ERP (`WKCurrentUserERP = ''` no formulário publicado) e não é aprovador de alçada; não há SC de QA em etapa de alçada. Não foi aberta nenhuma SC real para não movimentar processo de terceiros.

**Passos**
1. Abrir a instância da SC pela Central de Tarefas (ou por `/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=<id>&app_ecm_workflowview_taskLoadViewMode=true`).
2. Rolar até a grade de alçadas do formulário.
3. Conferir, para cada linha visível, os campos de responsável, data e hora da validação e a justificativa.
4. Repetir a consulta com a SC já nas atividades finais (104 — Fim da Validação do Comprador / fim de cadastro de contrato / fim de pagamento).

**Resultado esperado**
- Na atividade **94 (Aprovação de Alçada)** e na **210 (Validação do Comprador — Alçadas)** as linhas de alçada pendentes ficam visíveis para quem é o aprovador daquela linha, com o switcher de status (`tbalcada_statusValidacao___<idx>`) gravando **"Aprovado"** ou **"Reprovado"** e o rótulo da justificativa alternando entre `text-primary` (aprovação) e `text-danger` (reprovação).
- Nas atividades finais **104**, fim de cadastro de contratos e fim de pagamento de compras, as linhas de alçada **permanecem visíveis** — o formulário deixa de escondê-las, que é exatamente o histórico pedido no ticket.
- Cada linha exibe responsável, e-mail, **data** e **hora** da validação preenchidas.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O formulário da SC não mostrava nenhuma linha da etapa de alçada, de modo que não era possível saber quem aprovou, quando, nem por quê a SC foi reprovada.

**Severidade:** Alta (rastreabilidade de aprovação/alçada)

**Preparação de massa:** uma SC de homologação que tenha percorrido geração e aprovação de alçada, com pelo menos uma linha aprovada e uma reprovada, e um usuário que seja aprovador de alçada (membro de `G.P.Requisicao_de_Compras_Validacao_Alcadas`) para executar o passo 3. Não pode ser criada pelo executor de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *lido no fonte publicado* do formulário 256831 — a grade `tbAlcadas` e a filha `tbForneceAlcadas` existem no HTML; em `App/ViewHandler.js`, `handleRowsAuthorityApproval()` esconde/mostra a linha por `tbalcada_historico___<idx>` e mantém a linha visível quando `wk_NumState` é `fimValidCompradorAlc` (104), `fimProcCadAtivContratos` ou `fimProcPagtoCompras`; `handleAuthorityApprovalSwitcher()` grava "Aprovado"/"Reprovado". *Visto renderizado* — nada: nenhuma SC em etapa de alçada foi aberta.
**Divergências encontradas:** o nome do grupo de alçada citado informalmente ("gestor", "alçada") não corresponde a nada no ambiente; o grupo **real e único** é `G.P.Requisicao_de_Compras_Validacao_Alcadas` — confirmado por consulta ao dataset `colleagueGroup` (retorna membros) e por varredura dos **185 grupos** do dataset `group`, onde é a **única** ocorrência com "alcada". Ainda em aberto (declarado "melhoria não contratada" no próprio ticket): linhas com `tbalcada_historico = true` continuam **ocultas** fora das atividades finais, ou seja, a consulta retroativa "sempre" pedida pelo cliente não existe no código publicado.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4357  (ambos · Concluído · SDCASSI-369)

**Título:** Abrir uma Solicitação de Compras com preço estimado informado e ver esse preço chegar íntegro ao ERP e ao comprador — nunca zerado.

**Origem:** FSWTBC-4357 — `C1_PRECO` ficava **zerado** nas SCs criadas pelo portal Fluig: o `ExecAuto` do
MATA110 descartava o campo em silêncio (`A113Preco` retorna `.F.` sem interface). Correção
`fAtualizaPreco` (UCOME019) gravando `C1_PRECO`/`C1_TOTAL` por item após o ExecAuto. Concluído 03/06/2026
(MUD17767); no caminho, seis bugs de disciplina no REST UCOME019 corrigidos.

**Módulo/Rota:** Fluig → **Solicitação de Compras** (`pageworkflowview?processID=wf_solicitacao_compras`),
seção *Produtos/Serviços da Solicitação* → após *Grava SC e Anexos*: **Tracker** (*Filtrar por* = Solicitação
de Compras, coluna **Nº da Solicitação ERP**) e **Portal do Comprador → Validação Inicial** (detalhe da SC,
valor de referência).

**Pré-condições**
- Usuário com permissão de iniciar `wf_solicitacao_compras` (a conta de QA tem).
- Um usuário **comprador** (matrícula SY1) para abrir a SC em *Validação Inicial* e ler o valor de referência.
- Protheus (`apiRESTProtheus_CASSI`) no ar — *Grava SC e Anexos* leva ~3 min quando saudável (113267, L027).
- **Bloqueio:** a confirmação direta de `C1_PRECO` fica no Protheus (sem credencial). No Fluig a conta de QA
  não resolve comprador (`Comprador não encontrado.`), então o detalhe da SC no Portal do Comprador não abre
  para ela. Executável por um comprador real.

**Passos**
1. Abrir **Solicitação de Compras**; preencher *Código da Filial* (zoom), *Justificativa para a Solicitação*
   (prefixo `QA`), **Adicionar Produto**.
2. No item: *Produto/Serviço*, *Quantidade* = `2`, **Preço Unit. Estimado** = `123,45`.
3. Conferir que **Vlr. Total Estimado** foi calculado = `246,90` e que *Total Estimado a Aprovar (R$)* reflete o item.
4. Enviar (ou, se preferir não gravar, parar aqui e registrar só os passos 1–3).
5. Após *Grava SC e Anexos* (aba **Histórico**: `Integração executada com sucesso - Tempo de Execução N s`),
   abrir o **Tracker** e localizar o processo: **Nº da Solicitação ERP** preenchido.
6. Como comprador, abrir **Portal do Comprador → Validação Inicial**, localizar a SC pelo *Nº Solic ERP* e abrir
   o detalhe: o preço/valor de referência do item deve ser `123,45`, total `246,90`.
7. Prosseguir até *Validação do Comprador*: o valor exibido continua igual ao informado na abertura.

**Resultado esperado**
- **Vlr. Total Estimado** = Quantidade × **Preço Unit. Estimado**, recalculado a cada alteração.
- A SC nasce no ERP com o mesmo preço unitário e total informados no Fluig — em nenhuma etapa aparece `0,00`.
- O detalhe da SC no Portal do Comprador mostra o valor informado, não zero.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC gravada "com sucesso", mas com preço **zerado** no ERP e nas telas seguintes (prints do cliente de
  28/04 e 30/04/2026); nenhuma mensagem de erro.

**Severidade:** Alta *(valor da compra — base de cotação, alçada e pedido)*

**Preparação de massa:** nenhuma prévia; a SC é criada pelo próprio executor com prefixo `QA` na justificativa.
Para o passo 6 é preciso um usuário comprador.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário da SC abriu em branco (v98) e renderiza, na seção *Produtos/Serviços da
Solicitação*, os rótulos **Quantidade \***, **Média Histórica \***, **Preço Unit. Estimado \***, **Vlr. Total
Estimado \*** e, adiante, **Total Estimado a Aprovar (R$) \***; botões **Adicionar Produto**, **Download Planilha
de Rateio Modelo**, **Upload Planilha de Rateio Preenchida**. Tracker com coluna **Nº da Solicitação ERP**
(ex.: 111951 → `000942`). O Portal do Comprador em *Validação Inicial* lista 24 SCs mas a conta não resolve
comprador. Nada submetido.
**Divergências encontradas:** nenhuma de rótulo. Registro: o A3 dos achados (Quantidade `0` pula a validação
e deixa *Vlr. Total Estimado* vazio) toca o mesmo campo — vale executar os dois casos juntos.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4361  (fluig · Concluído · SDCASSI-374)

**Título:** Abrir uma nova Solicitação de Compras e conferir que o painel de reaproveitamento lista apenas SCs efetivamente reprovadas.

**Origem:** FSWTBC-4361 — a SC 11235, já finalizada e com pedido gerado, aparecia no painel de solicitações anteriores como **reprovada** ao iniciar uma nova Solicitação de Compras. O aceite do cliente foi textual: *"carregou somente as reprovadas"*.

**Módulo/Rota:** Processos → **Solicitação de Compras** (`wf_solicitacao_compras`) → formulário de abertura → card **"Solicitações de Compras Reprovadas"**.

**Pré-condições**
- Usuário solicitante que tenha, no histórico, **pelo menos uma SC reprovada** e **pelo menos uma SC finalizada com pedido gerado** (as duas com o mesmo `matriculaSolicitante`).
- **Bloqueio:** a conta `TOTVS-FS` **não tem nenhuma SC reprovada** — o dataset `dsFluig_getProcReqComprasReprovadoSql` respondeu `200` com `content: []` e o card permanece oculto (`display:none`). O caso exige massa de um solicitante real (ex.: *Geise Campos Silva Matias*, que aparece com 24 solicitações na Validação Inicial).

**Passos**
1. Autenticar no Fluig com o usuário solicitante que possua SC reprovada e SC finalizada com pedido.
2. Abrir **Processos → Solicitação de Compras** (ou o atalho de nova solicitação na Central de tarefas).
3. No topo do formulário, localizar o card **"Solicitações de Compras Reprovadas"**, cujo texto é: *"Foram identificadas algumas solicitações de Compras reprovadas. Para carregar as informações e reabrir a solicitação clique no número do processo referente a solicitação desejada."*
4. Anotar **todos** os números de processo exibidos como botões dentro do card.
5. Para cada número listado, abrir o processo correspondente (Processos → consulta, ou Tracker) e conferir a **situação real** da instância e se há **pedido gerado** (campo `Nº Solic ERP` / número do pedido).
6. Conferir especificamente que a SC finalizada com pedido gerado **não** consta na lista.
7. Sair do formulário **sem enviar**.

**Resultado esperado**
- O card lista **somente** processos cuja SC foi reprovada — nenhum processo finalizado com pedido gerado aparece.
- O aviso em vermelho é exibido: *"Atenção! Os Anexos da solicitação anterior não serão carregados, bem como algumas das informações que são de controle da requisição e não serão alteradas."*
- Se o solicitante não tiver nenhuma SC reprovada, o card **não é exibido** (permanece `display:none`).
- A consulta que alimenta o card usa o dataset `dsFluig_getProcReqComprasReprovadoSql` filtrado por `matriculaSolicitante` do usuário logado e `STATUS = 2` (Finalizado), ordenado por `NUM_PROCES` decrescente, **limitado a 10** registros.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A SC **11235**, finalizada e com pedido gerado, aparecia listada no card como se fosse reprovada, oferecendo o botão de reabertura — com risco de o solicitante refazer uma compra já atendida (**compra em duplicidade**).

**Severidade:** Alta

**Preparação de massa:** um solicitante com (a) uma SC reprovada e (b) uma SC finalizada **com pedido gerado no ERP**. Ambas precisam existir antes; a automação/QA não pode criar a segunda, porque depende da geração de pedido no Protheus. Quem prepara: área de Compras da CASSI (perfil solicitante) + integração ERP.

**Verificado em tela:** PARCIAL
**O que foi verificado:** formulário `wf_solicitacao_compras` aberto em branco; bloco `#divRequestProcess` **existe** no DOM com `display:none` e com os três textos literais citados acima; `#matriculaSolicitante` = `TOTVS-FS`; chamada `GET` ao dataset `dsFluig_getProcReqComprasReprovadoSql` com `matriculaSolicitante,TOTVS-FS,STATUS,2` retornou **200** e `content: []`. O filtro `STATUS,2` e o comentário `Status (0 - Aberto | 1 - Cancelado | 2 - Finalizado)` foram **lidos no fonte publicado** (`DataHandler.getRequestofUser()`).
**Divergências encontradas:** o ticket fala em "SC exibida como reprovada em nova solicitação"; o nome real do elemento na tela é o card **"Solicitações de Compras Reprovadas"**. Observação técnica relevante: o front-end **só** filtra por `matriculaSolicitante` e `STATUS = 2` (Finalizado) — a discriminação entre "reprovada" e "finalizada com pedido" está **dentro do SQL do dataset**, que é servidor e não é legível pelo front-end. É exatamente aí que o defeito morava.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4454  (fluig · Concluído · SDCASSI-384)

**Título:** Reprovar uma solicitação e conferir que os textos exibidos estão com a concordância correta.

**Origem:** FSWTBC-4454 — inconsistência de **concordância** nos textos exibidos ao reprovar uma solicitação. A própria descrição do chamado diz que na base **DES** o texto **já estava correto**, sendo necessário **replicar** o ajuste para os demais ambientes: é pedido de **propagação**, não de desenvolvimento.

**Módulo/Rota:** Formulário da **Solicitação de Compras** — blocos **Validação do Gestor**, **Validação do Item Orçamentário**, **Validação do Comprador** e **Aprovação de Alçada**; campo **Justificativa para a Aprovação/Reprovação**.

**Pré-condições**
- Uma SC parada numa das quatro atividades de aprovação, atribuída ao usuário do teste.
- **Bloqueio:** a conta de QA não tem tarefa de aprovação de SC atribuída (a única tarefa na Central é uma **Correção** de Cotação), e o escopo proíbe reprovar registro pré-existente. A verificação foi feita **no fonte publicado do formulário**, sem submissão.

**Passos**
1. Abrir a tarefa da SC na atividade de aprovação (ex.: **Validação do Gestor**).
2. Acionar o switcher de aprovação para **Não** (valor gravado: `Reprovado`).
3. Ler o rótulo do campo de justificativa que fica obrigatório, o **placeholder** dentro do campo e o **tooltip** do bloco.
4. Tentar enviar **sem** preencher a justificativa e ler a mensagem de crítica.
5. Repetir os passos 2–4 nos blocos **Validação do Item Orçamentário** (`tbitorc_*`), **Validação do Comprador** (`buyer*`) e **Aprovação de Alçada** (`tbalcada_*`).
6. Registrar cada texto **literalmente**, com print, e comparar com o mesmo ponto no outro ambiente.

**Resultado esperado**
- Nos quatro blocos, o rótulo é **"Justificativa para a Aprovação/Reprovação \*"**, o placeholder é **"Justificativa para a Aprovação/Reprovação"** e o tooltip é **"Justificativa para a Aprovação/Reprovação."** — idênticos entre si e gramaticalmente corretos.
- O campo é **obrigatório** na reprovação e aceita no máximo **400 caracteres** (`maxlength="400"`).
- Ao marcar **Não**, o rótulo muda de destaque (de `text-primary` para `text-danger`) e o valor gravado passa a `Reprovado`.
- Os mesmos textos aparecem iguais em DES, TST e PRD.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Texto com **erro de concordância** exibido ao reprovar a solicitação num ambiente e correto em outro. O ticket não transcreve a frase errada; registra apenas que "na base DES o texto já estava correto".

**Severidade:** Baixa

**Preparação de massa:** uma SC parada em cada uma das quatro atividades de aprovação, atribuída ao executor do teste. Quem prepara: área de Compras (uma SC própria basta, percorrendo as etapas). Não há como o QA gerar isso sem submeter solicitações reais.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no **fonte publicado** do formulário da SC (documento 256831) constam, nos quatro blocos, o `label`, o `placeholder` e o `title` com o texto **"Justificativa para a Aprovação/Reprovação"**, `data-required="true"` e `maxlength="400"`; os switchers `managerAprovadoValidacao`, `tbitorc_aprovadoValid___<n>`, `buyerAprovadoValidacao` e `tbalcada_statusValidacao___<n>` gravam `Aprovado`/`Reprovado` e trocam a classe do rótulo para `text-danger` na reprovação. **Nenhum desses blocos pôde ser visto renderizado**, porque só aparecem na etapa correspondente e a conta não tem essa tarefa.
**Divergências encontradas:** nenhuma no rótulo — o texto atual está gramaticalmente consistente nos quatro blocos. A divergência real do chamado é **entre ambientes**, e não é verificável com um só ambiente acessível.
**Dados/massa usados:** nenhum — não submetido; nenhuma solicitação foi reprovada.

---

## CT-FSWTBC-4459  (ambos · Concluído · SDCASSI-389)

**Título:** Criar uma SC e vê-la nascer com o "Nº da Solicitação ERP" gravado e visível ao comprador — sem cair em "Correção" sem motivo.

**Origem:** FSWTBC-4459 — fontes **não publicados nas pastas corretas** do Fluig → erro interno → **número da SC
não gravado** → API do comprador falha → processo desviado para **Correção** sem ação do usuário (TST).
Homologado 29/04/2026.

**Módulo/Rota:** Fluig → **Solicitação de Compras** → *Grava SC e Anexos* (seq 233) → **Formulário** (**Nº da
Solicitação ERP \***) · **Tracker** (coluna **Nº da Solicitação ERP**) · **Portal do Comprador → Validação
Inicial** (coluna **Nº Solic ERP**) · **Central de Tarefas** (pool `G.P.Requisicao_de_Compras_Correcoes`).

**Pré-condições**
- Permissão de iniciar `wf_solicitacao_compras`; Protheus no ar.
- Após um deploy de artefatos Fluig, executar este caso como smoke.
- **Bloqueio:** nenhum para criar a SC (a conta de QA já criou a 113267 em 03/09). Ver a coluna do Portal do
  Comprador exige comprador real.

**Passos**
1. Criar uma SC com justificativa `QA <data>` e um item; enviar.
2. Acompanhar o **Histórico** até *Grava SC e Anexos* concluir.
3. Abrir a aba **Formulário** e ler **Nº da Solicitação ERP**.
4. Abrir o **Tracker** e localizar o processo: coluna **Nº da Solicitação ERP**.
5. Como comprador, abrir **Validação Inicial** e localizar a SC pela coluna **Nº Solic ERP**.
6. Conferir na **Central de Tarefas** que a SC **não** está no pool de Correção.

**Resultado esperado**
- Histórico: `Integração executada com sucesso - Tempo de Execução N s` em *Grava SC e Anexos* (≤ 2 min).
- **Nº da Solicitação ERP** preenchido no formulário e no Tracker; a SC aparece na *Validação Inicial* com o número.
- Processo segue para *Compra Centralizada?* → *Validação do Gestor*; nunca para *Correção* sem erro registrado.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC em **Correção** com **Nº da Solicitação ERP vazio**, sem ação do usuário; comprador não a encontra.

**Severidade:** Média *(bloqueia o fluxo; causa de deploy incompleto)*

**Preparação de massa:** SC criada pelo executor. Antes do caso, o método de smoke de artefatos: para cada
dataset da entrega, `GET /api/public/ecm/dataset/search?datasetId=<nome>` deve responder **200** (ausente →
**500 NullPointerException**, medido hoje).

**Verificado em tela:** PARCIAL
**O que foi verificado:** o sintoma **está vivo hoje** na SC **113196**: em *Correção* desde 03/09 10:01, com
`numSolCompra` vazio, após três falhas em *Grava SC e Anexos* (`Cannot convert NaN to java.lang.Integer
(servicetask233#267)`). A SC **113267**, criada pela conta de QA em 03/09, completou *Grava SC e Anexos* em
3 min 12 s (L027). Formulário novo renderiza **Nº da Solicitação ERP \*** readonly. Tracker com a coluna
homônima; Validação Inicial com coluna **Nº Solic ERP** (L026/L027). Nenhuma SC criada nesta rodada.
**Divergências encontradas:** a 113196 reproduz o sintoma do ticket por **outra causa** (`NaN` num campo
numérico do payload, não fonte ausente) — o caso só detecta o efeito. O `Retorno Integração` está vazio nela.
**Dados/massa usados:** SCs 113196 e 113267 — leitura.

---

## CT-FSWTBC-4527  (ambos · Concluído · SDCASSI-404)

**Título:** Gestora imediata abre a SC em *Validação do Gestor* e vê a sua linha de aprovação

**Origem:** FSWTBC-4527 — a etapa de aprovação do gestor não carregava para a gestora, mas carregava como substituta ou
gestora do processo. Causa: **e-mail do colaborador no ERP diferente do e-mail no Fluig**; a correlação é por e-mail.
Encerrado como correção de cadastro.

**Módulo/Rota:** Central de Tarefas → *Tarefas a concluir* → **SOLICITAÇÃO DE COMPRAS** em **Validação do Gestor** (atividade 7)
→ aba *Formulário*, grade do gestor (`tbManager`, coluna **Aprovar?**)

**Pré-condições**
- Colaborador requerente com superior cadastrado no ERP e **mesmo e-mail** no ERP e no Fluig.
- Login da gestora (não da substituta, não do gestor do processo).
- **Bloqueio:** não há credencial de gestor; o cenário só pôde ser observado pelo lado negativo (abaixo).

**Passos**
1. Como solicitante, iniciar uma SC (prefixo `QA` nos textos) e enviá-la; aguardar *Grava SC e Anexos*.
2. Abrir *Histórico* da SC e ler as linhas de *Grava SC e Anexos*.
3. Como gestora, abrir a tarefa em *Validação do Gestor*.
4. Na aba *Formulário*, localizar a grade do gestor e a linha com o seu nome.
5. Comparar com o acesso como substituta e como gestora do processo (controle).

**Resultado esperado**
- Histórico **sem** "Atenção! Não foi possivel obter as informações do Superior Responsável pelo Colaborador requerente da
  Solicitação de Compras."
- A tarefa é atribuída à gestora (não a pool, não a usuário genérico).
- Na grade do gestor a linha está **visível**, com *Data da Validação*, *Hora da Validação* preenchidas e o switcher
  **Aprovar?** disponível (`tbmanag_codERPUserValid` = código ERP da gestora).

**Resultado se o defeito reincidir**
- Grade do gestor sem linha visível para a gestora (linha oculta porque `tbmanag_codERPUserValid` ≠ usuário atual); a
  mesma SC aparece para a substituta ou para o gestor do processo.

**Severidade:** Alta (aprovação/alçada)

**Preparação de massa:** SC criada pelo executor com um requerente cujo superior tem e-mail idêntico nos dois sistemas —
verificar antes, no cadastro, e não ajustar cadastro sem autorização.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o **lado negativo está vivo na SC 112830** (Validação do Gestor, solicitante Paulo Calixto
(TOTVS), `emailSolicitante=paulocalixto@totvs.com.br`, `codERPSolicitante` **vazio**): Histórico com 4× o aviso do Superior
Responsável em *Grava SC e Anexos* e mais 1× em *Validação do Gestor*; a tarefa foi parar em "Usuário TBC (TOTVS)" (conta
de QA); no formulário a grade `tbManager` tem **2 linhas, 0 visíveis**, `tbmanag_codERPUserValid`/`matriculaValid` vazios
e o switcher `managerAprovadoValidacao` oculto — os rótulos **Aprovar? \***, **Data da Validação \***, **Hora da
Validação \*** existem no DOM. **Lido no fonte publicado** (`ViewHandler.handleRowsManager`): a linha só aparece se
`tbmanag_codERPUserValid == wk_CurrentUserERP`, ou substituto válido, ou `matriculaValid ==
"Pool:Group:G.P.Requisicao_de_Compras_Gestor_Imediato"`.
**Divergências encontradas:** o ticket fala em "etapa de aprovação do gestor"; na tela é **Validação do Gestor**. O
solicitante da 112830 é consultor TOTVS (sem cadastro no ERP), logo o caso vivo é limite de cadastro, não regressão — mas o
efeito (SC parada sem aprovador que veja a grade) é idêntico ao do ticket.
**Dados/massa usados:** SC 112830 (leitura); nada submetido.

---

## CT-FSWTBC-4550  (ambos · Concluído · SDCASSI-408)

**Título:** Gestor libera a SC pelo campo *Aprovar?* da grade do gestor

**Origem:** FSWTBC-4550 — "campo de validação do gestor não aparece": o gestor não conseguia liberar a SC porque a opção de
validação não era exibida. Mesma causa do SDCASSI-404 (e-mail divergente ERP × Fluig); os dados completos do colaborador
não foram gravados no formulário. Tratado pontualmente no cadastro; conferência em massa **não** registrada.

**Módulo/Rota:** Central de Tarefas → SC em **Validação do Gestor** → *Formulário* → grade do gestor (`tbManager`):
**Aprovar? \***, **Data da Validação \***, **Hora da Validação \***

**Pré-condições**
- Gestor com e-mail idêntico no ERP e no Fluig, e `codERPUserValid` da linha = código ERP do gestor.
- **Bloqueio:** sem credencial de gestor.

**Passos**
1. Como gestor, abrir a tarefa em *Validação do Gestor*.
2. Na grade do gestor, verificar que a linha está visível e o switcher **Aprovar?** responde ao clique.
3. Alternar para *Aprovado* e voltar a *Reprovado* (sem enviar); conferir que `managerAprovadoValidacao` acompanha.
4. Não clicar em **Enviar** (regressão de tela).

**Resultado esperado**
- Linha visível com data/hora preenchidas automaticamente e **Aprovar?** habilitado.
- O valor gravado segue o switcher (Aprovado/Reprovado); sem toque, o processo **não** deve tratar como decisão tomada.

**Resultado se o defeito reincidir**
- Grade sem linha visível; gestor sem meio de liberar a SC (Screenshot_2 do ticket).

**Severidade:** Alta

**Preparação de massa:** SC própria em Validação do Gestor cujo gestor é o executor (e-mails conferidos antes).

**Verificado em tela:** PARCIAL
**O que foi verificado:** na SC 112830 (Validação do Gestor) os rótulos **Aprovar? \*** (4×), **Data da Validação \***
e **Hora da Validação \*** existem no DOM, mas `tbManagerVisiveis=0` e `switcherVisivel=false` — é o sintoma exato do
ticket, vivo hoje para um requerente sem cadastro no ERP. **Lido no fonte publicado**: `FLUIGC.switcher.onChange
("#managerAprovadoValidacao")` grava "Aprovado"/"Reprovado"; não há estado "não decidido" (ACHADOS A3-d).
**Divergências encontradas:** "campo de validação do gestor" no ticket = switcher **Aprovar?** da grade `tbManager` na
tela (o formulário tem quatro "Aprovar?"; este é o de `tbmanag_aprovadoValid`).
**Dados/massa usados:** SC 112830 (leitura); nada submetido.

---

## CT-FSWTBC-4580  (ambos · Concluído · SDCASSI-108)

**Título:** SC enviada sem rateio recebe do ERP um erro estruturado, sem derrubar a integração

**Origem:** FSWTBC-4580 — "variable does not exist ORESPONSE on SOLCOMPRASSERVICES:INCLUISOLICITACAO (UCOME019.SERVICES.TLPP)
linha 87" ao criar SC com `RATEIO: []` (produto 04000120, qtd 26, C1_XFLUIG 95406): a thread REST caía. Correção: inicializar
`oResponse` antes e devolver HTTP 500 com descrição. Corrigido na base DEV no mesmo dia.

**Módulo/Rota:** Processo **Solicitação de Compras** → *Grava SC e Anexos* (integração 20 `integracaoERP`) → *Histórico*;
campo **Retorno Integração**; *Correção*

**Pré-condições**
- SC própria (`QA`), Tipo de Compra **Pedido**, um item com quantidade > 0 e **grade de rateio vazia**.
- **Bloqueio:** o front pode impedir o envio sem rateio (crítica de soma 100 %) — se impedir, o caso vira "crítica na
  origem" e o caminho REST só é alcançável por chamada direta (fora do escopo Fluig).

**Passos**
1. Iniciar SC, informar o item 04000120 (ou equivalente) e **não** preencher rateio; observar se o formulário critica.
2. Se permitir, enviar; acompanhar *Histórico* em *Grava SC e Anexos*.
3. Ler **Retorno Integração** e a atividade atual.

**Resultado esperado**
- Ou crítica no formulário ("A soma dos percentuais de rateio não podem ser inferior a 100%…"), ou
- Histórico com mensagem estruturada do ERP (HTTP 500 com descrição) e desvio para **Correção** — nunca timeout/silêncio.
- Outras SCs em andamento não são afetadas.

**Resultado se o defeito reincidir**
- Histórico com "Atividade de serviço executada com falha…" genérica / thread error `ORESPONSE`, sem descrição útil; SC
  presa em *Grava SC e Anexos*.

**Severidade:** Alta (derruba thread do REST)

**Preparação de massa:** SC própria conforme acima; produto sem gestor orçamentário atrelado (para não desviar para
*Itens sem Gestor?*).

**Verificado em tela:** PARCIAL
**O que foi verificado:** SC 112830 tem `tbprod_jsonrateio___1..5` preenchidos e Histórico "Integração executada com
sucesso - Tempo de Execução **98 s**" em *Grava SC e Anexos* (lento, mas com sucesso); 53 instâncias estão hoje em *Grava
SC e Anexos* e 1 em *Correção* (113196). **Lido no fonte publicado**: a crítica de rateio do formulário só verifica soma
(ver CT-FSWTBC-4540) — o envio com rateio vazio não foi testado para não gravar.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** SC 112830 (leitura); nada submetido.

---

## CT-FSWTBC-4632  (ambos · Concluído · SDCASSI-433)

**Título:** Criar uma SC e ver a filial preenchida e propagada ao ERP, ao Tracker e ao Portal do Comprador

**Origem:** FSWTBC-4632 — a SC 98223 "não estava trazendo a filial da solicitação". Encerrado como **não reproduzível** após tentativas
em TST e em produção com o cliente. Família de intermitências sem log correlacionado por processo.

**Módulo/Rota:** Fluig → **Solicitação de Compras** (`pageworkflowview?processID=wf_solicitacao_compras`) → seção de identificação:
**Código da Filial \***, **Nome da Filial \*** (zoom `zoomCodNomeFilial` → `codFilial`/`cgcFilial`/`zoomNomeFilial`), **Cód. Filial Origem \*** ·
Tracker visão *Solicitação de Compras* (colunas *Código da Filial*, *Nome da Filial*) · Portal do Comprador → *Validação Inicial*
(colunas *Cod. Filial*, *Filial*).

**Pré-condições**
- Usuário com permissão de iniciar Solicitação de Compras.
- Dataset `dsProtheus_getBranches_restGetAll` respondendo (hoje: 200, 50 filiais).
- **Bloqueio:** nenhum para o caminho até *Grava SC e Anexos*; o caso positivo cria massa (`@destrutivo`, prefixo `QA`).

**Passos**
1. Abrir uma nova Solicitação de Compras e, sem escolher filial, clicar **Adicionar Produto**.
2. Escolher a filial pelo zoom **Nome da Filial** e conferir **Código da Filial** e **Cód. Filial Origem** preenchidos.
3. Preencher o mínimo (justificativa `QA …`, um item, rateio) e confirmar.
4. Após *Grava SC e Anexos* → *Validação do Gestor*, abrir o Tracker (visão *Solicitação de Compras*, filtro pelo nº do processo).
5. Abrir Portal do Comprador → *Validação Inicial* e localizar a SC.

**Resultado esperado**
- Passo 1: toast *"Atenção! A Filial não foi selecionada! Por favor informe a Filial para continuar."* e o item não é adicionado.
- Passos 2–3: `Código da Filial`, `Nome da Filial` e `Cód. Filial Origem` preenchidos e enviados no payload de `/start`.
- Tracker: `Código da Filial` e `Nome da Filial` preenchidos (ex.: `5303 / CASSI SEDE`); Portal do Comprador: `Cod. Filial` e `Filial`
  preenchidos e `Nº Solic ERP` gerado.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC sem filial (Screenshot_6 do ticket): campo de filial vazio na solicitação/ERP, sem erro visível.

**Severidade:** Alta

**Preparação de massa:** nenhuma além da SC `QA` criada pelo executor.

**Verificado em tela:** PARCIAL
**O que foi verificado:** rótulos **Código da Filial \***, **Nome da Filial \***, **Cód. Filial Origem \*** lidos no HTML publicado do form
256831 e o toast de filial ausente lido no `ViewHandler.js`; na SC **113196** renderizada: `codFilial=5303`, `zoomNomeFilial=CASSI SEDE`;
na **112830**: idem; Tracker da **98223** (a do ticket): `Código da Filial=3511`, `Nome da Filial=CLINICASSI SOROCABA - SP`,
`Nº da Solicitação ERP=000033`, `Status=FINALIZADA` — hoje a filial **está** presente; Tracker de 113196 e 112830 com filial 5303/CASSI
SEDE; Portal do Comprador *Validação Inicial* renderizando `Cod. Filial`/`Filial` para 25 SCs. Não submeti a SC.
**Divergências encontradas:** o ticket fala em "filial da solicitação" no singular; o formulário tem **três** campos de filial
(*Código*, *Nome* e *Cód. Filial Origem*) — o caso precisa dizer qual. Sem log de payload no ambiente, a intermitência não é
reproduzível sob demanda (mesma conclusão do ticket).
**Dados/massa usados:** nenhum — não submetido; leitura de 98223, 113196, 112830.

---

## CT-FSWTBC-4639  (ambos · Concluído · SDCASSI-435)

**Título:** Abrir uma SC e ver a integração com o ERP concluir sem "Campo C1_SIGLA obrigatório não enviado"

**Origem:** FSWTBC-4639 — erro na abertura de SC: `code 401, Campo C1_SIGLA obrigatorio nao enviado` (SCs 99340 e 99318), terceira
aparição (SDCASSI-369/426). Causa de processo: o PR67989 (lado Fluig, envio dos obrigatórios) **não havia sido aplicado** no ambiente.

**Módulo/Rota:** Fluig → **Solicitação de Compras** → confirmar → atividade **Grava SC e Anexos (233)** (`POST …/wf_solicitacao_compras/start`,
payload da SC) · Histórico da solicitação · campo **Retorno Integração\*** (`erroIntegracao`) · Tracker (*Nº da Solicitação ERP*) ·
Logs Protheus → aba **Solicitacoes ZZY**.

**Pré-condições**
- Usuário com permissão de iniciar SC; Protheus respondendo (`dsProtheus_getBranches_restGetAll` 200).
- **Bloqueio:** nenhum para o caminho; caso positivo cria massa (`@destrutivo`, prefixo `QA`). ZZY hoje com `genericQuery` 404.

**Passos**
1. Abrir nova SC, preencher filial, solicitante, um item, rateio e justificativa `QA …`.
2. (Opcional, sem gravar) interceptar o `POST …/start` e inspecionar o payload — o campo de sigla/unidade requisitante deve ir preenchido.
3. Confirmar e acompanhar o Histórico em *Grava SC e Anexos*.
4. Abrir a SC criada em modo leitura e ler **Retorno Integração**; no Tracker, ler **Nº da Solicitação ERP**.
5. Se disponível, Logs Protheus → *Solicitacoes ZZY* → filtrar pelo Id Fluig.

**Resultado esperado**
- Histórico: "Integração executada com sucesso - Tempo de Execução N s" em *Grava SC e Anexos*; processo segue para *Validação do Gestor*.
- **Retorno Integração** vazio; **Nº da Solicitação ERP** preenchido (ex.: `001194` na 112830).
- Nenhuma linha "Falha ao executar evento de serviço … Erro …401… C1_SIGLA".

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `code 401, Campo C1_SIGLA obrigatorio nao enviado` (Screenshot_8) na abertura da SC; 3 tentativas e *Correção (236)*; sem Nº de SC no ERP.

**Severidade:** Alta

**Preparação de massa:** SC `QA` criada pelo executor; nada mais.

**Verificado em tela:** PARCIAL
**O que foi verificado:** Tracker das SCs do ticket **99340** (`Nº da Solicitação ERP=000901`, `Nº da Cotação ERP=000540`, `FINALIZADA`) e
**99318** (`FINALIZED`, 44 tarefas) — ambas concluíram após a aplicação do PR; rótulo **Retorno Integração\*** lido no HTML do form 256831;
Histórico de *Grava SC e Anexos* em sucesso (112830: "Integração executada com sucesso - Tempo de Execução 98 s") e em falha (113196:
"Falha ao executar evento de serviço. Processo: wf_solicitacao_compras - Atividade: 233 - Tentativa: 1 … Nova tentativa em 03/09 09:50",
3 tentativas, depois *Correção*) **vistos renderizados**; aba **Solicitacoes ZZY** existe, mas `genericQuery` → 404 hoje.
**Divergências encontradas:** **não existe campo "Sigla"/`C1_SIGLA` no formulário** da SC (0 ocorrências no HTML/JS publicado) — o campo é
montado no servidor; o executor só vê o efeito no Histórico/Retorno Integração. A SC 113196 mostra que o campo **Retorno Integração**
fica **vazio** mesmo com o processo em Correção por erro (só o Histórico é legível) — ver L029.
**Dados/massa usados:** nenhum — não submetido; leitura de 99340, 99318, 112830, 113196.

---

## CT-FSWTBC-4767  (fluig · Concluído · SDCASSI-455)

**Título:** Abrir uma Solicitação de Compras e conferir que Solicitante e Email do Solicitante são os do usuário que está criando, e não os de ninguém mais.

**Origem:** FSWTBC-4767 — "Campos de Nome e E-mail do Solicitante não estão sendo atualizados
corretamente": a SC exibia dados de solicitante que não refletiam o usuário atual. A hipótese
levantada no ticket (e nunca respondida) foi a de que a SC vinha do **clone de SC pelo portal**,
caso em que os dados do solicitante original permaneceriam.

**Módulo/Rota:** **Processos → Solicitação de Compras**
(`/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`, formulário no iframe
`/webdesk/streamcontrol/256831/`). Caminho alternativo, que cria SC a partir de outro registro:
**Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) → coluna **Ação** → ícone
`title="Solicitação de Compra"`.

**Pré-condições**
- Usuário com o grupo `G.P.Requisicao_de_Compras_Inicio` (a conta de QA tem).
- Para o passo 5, um segundo usuário com o mesmo direito, para comparar as duas aberturas.
- **Bloqueio:** parcial. **Não existe página de clone de SC neste ambiente** — o menu do portal, no
  ramo *Processos*, traz apenas *Substituição de Cargos*, *Declaração de Múltiplos Vínculos*,
  *Gestão de Férias*, *Gestão do Banco de Horas e Horas Extras*, *Gestão de Equipes*, **Solicitação
  de Compras** e **Faturamento de Contratos**, e nenhuma rota de clone/cópia de SC foi encontrada.
  A hipótese central do ticket, portanto, **não é verificável aqui**; o caso cobre o caminho de
  abertura normal e o de abertura a partir de contrato, que é o mais próximo de "criar SC herdando
  dados de outro registro".

**Passos**
1. Autenticar com o usuário A e abrir *Processos → Solicitação de Compras*.
2. Na primeira seção do formulário, ler os campos **Solicitante** e **Email do Solicitante**.
3. Confirmar que ambos estão **somente leitura** (tentar digitar em cada um, sem `force`).
4. Sem submeter, fechar a solicitação.
5. Repetir os passos 1–3 com o usuário B e comparar: os dois valores têm de mudar junto com o login.
6. Abrir *Acompanhamento de Contratos*, escolher um contrato **Vigente** e clicar no ícone
   **Solicitação de Compra** da coluna *Ação*; preencher *Tipo de Solicitação*, *Motivo da
   Solicitação* e *Data de Necessidade* e confirmar. Abrir a SC gerada e reler os dois campos.

**Resultado esperado**
- **Solicitante** traz o nome do usuário autenticado (na conta de QA: `Usuário TBC (TOTVS)`).
- **Email do Solicitante** traz o e-mail do usuário autenticado (na conta de QA:
  `fabricasoftware@totvs.com.br`).
- Os dois campos são **readonly** — não aceitam digitação em nenhuma etapa.
- O campo oculto `matriculaSolicitante` carrega a matrícula do usuário autenticado (`TOTVS-FS`).
- Trocando de usuário, os três valores mudam junto. Nenhum resquício do usuário anterior.
- Na SC aberta a partir do contrato, os três campos são igualmente os do usuário que confirmou o
  modal — o contrato contribui com fornecedor, filial e itens, **nunca** com a identidade do
  solicitante.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- **Solicitante** e/ou **Email do Solicitante** exibindo pessoa diferente da autenticada — tipicamente
  o solicitante da SC de origem —, fazendo notificação e aprovação seguirem para a pessoa errada e o
  histórico registrar autor incorreto. O ticket não registra a mensagem nem os valores exatos.

**Severidade:** Alta — identidade errada no solicitante desvia notificação e aprovação e corrompe a
rastreabilidade do processo.

**Preparação de massa:** dois logins distintos com direito de abrir SC (o executor não consegue criar
o segundo login sozinho: depende do administrador do Fluig). Para o passo 6, um contrato **Vigente**
com itens de planilha — há 557 contratos Vigentes na base, então a massa existe.

**Verificado em tela:** PARCIAL
**O que foi verificado:** formulário 256831 aberto e inspecionado. **Visto renderizado:**
`usuarioSolicitante` — rótulo **"Solicitante *"**, `readonly`, valor `Usuário TBC (TOTVS)`;
`emailSolicitante` — rótulo **"Email do Solicitante *"**, `readonly`, valor
`fabricasoftware@totvs.com.br`; `matriculaSolicitante` — campo oculto, valor `TOTVS-FS`. Os três
batem com a conta autenticada. **Lido no fonte publicado** (`fluigProcessService_pt_BR.js`, função
`startProcess`): a SC criada a partir do contrato grava `usuarioSolicitante: processData.userName`,
`emailSolicitante: processData.userEmail` e `matriculaSolicitante: processData.userCode`, todos
originados de `top.WCMAPI.user / userEmail / userCode` — isto é, do **usuário logado no momento**,
nunca do registro de origem; grava ainda `ignorarSolicitante: "Sim"` como valor fixo. Não foi
possível comparar dois logins (só há uma credencial) nem exercitar clone (a página não existe).
**Divergências encontradas:** duas de rótulo. O ticket diz **"Nome do Solicitante"**; na tela o
rótulo é **"Solicitante"**. O ticket diz **"E-mail do Solicitante"** (com hífen); na tela é
**"Email do Solicitante"** (sem hífen). E, terceira: **não há página de clone de SC** neste ambiente,
de modo que a hipótese de causa registrada no ticket não tem superfície onde ser testada.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4819  (fluig · Concluído · SDCASSI-468)

**Título:** Abrir a seleção de filiais da Solicitação de Compras e conferir que ela lista todas as filiais da CASSI, não só a 1101.

**Origem:** FSWTBC-4819 — "Sistema exibe apenas a filial 1101 na seleção de filiais": a lista de
filiais vinha com um único registro, inviabilizando abrir solicitação para as demais unidades.

**Módulo/Rota:** **Processos → Solicitação de Compras**
(`/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`, iframe `256831`), primeira seção
do formulário, campo de zoom **Nome da Filial**.

**Pré-condições**
- Usuário com direito de abrir SC.
- Cadastro de filiais do Protheus respondendo (o zoom consulta o ERP).
- **Bloqueio:** nenhum.

**Passos**
1. Abrir *Processos → Solicitação de Compras*.
2. Localizar o campo **Nome da Filial** (ao lado de **Código da Filial**) e clicar na caixa de busca
   do zoom para abrir a lista.
3. Sem digitar nada, contar quantas filiais a lista traz e conferir que há filiais de códigos
   distintos, de regiões diferentes.
4. Digitar um termo genérico (por exemplo `CASSI`) e conferir que a lista continua trazendo várias
   filiais, e não apenas a primeira.
5. Digitar o código de uma filial específica que **não** seja a 1101 (por exemplo `3517`) e conferir
   que ela é encontrada e pode ser selecionada.
6. Selecionar essa filial e conferir que **Código da Filial** é preenchido automaticamente com o
   código correspondente.
7. Sair sem submeter.

**Resultado esperado**
- O zoom **Nome da Filial** abre listando **dezenas** de filiais, não uma só.
- A lista traz filiais de códigos e regiões variados — por exemplo `1101 - UNIDADE - CLINICASSI PORTO
  VELHO - RO`, `2901 - UNIDADE - CLINICASSI SALVADOR - BA`, `3301 - UNIDADE - CLINICASSI RIO DE
  JANEIRO CENT`, `3517`.
- Cada linha da lista traz **Filial** (código + descrição) e **CNPJ Filial**.
- A busca por texto e a busca por código funcionam e devolvem a filial procurada.
- Ao selecionar, **Código da Filial** (campo readonly) recebe o código da filial escolhida.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A seleção de filiais exibindo **apenas a filial 1101**, impedindo o usuário de abrir solicitação
  para qualquer outra unidade. Como a 1101 é a **primeira** da lista em ordem de código, o sintoma é
  compatível com uma consulta que retornava só o primeiro registro.

**Severidade:** Média — bloqueia a abertura de solicitação para todas as filiais menos uma, numa
entidade multifilial.

**Preparação de massa:** nenhuma. As filiais já estão cadastradas no ERP e o zoom as lê em tempo de
execução.

**Verificado em tela:** SIM (total)
**O que foi verificado:** **Visto renderizado** — no formulário 256831, o campo `zoomNomeFilial`
(rótulo **"Nome da Filial *"**, `data-type="zoomfield"`) monta o `select` `zoomCodNomeFilial`. Aberto
o zoom **sem digitar nada**, a lista trouxe **71 filiais** na primeira página, com cabeçalho
*Filtrar colunas* e colunas **Filial** e **CNPJ Filial**: `1101 - UNIDADE - CLINICASSI PORTO VELHO -
RO`, `1201 - RIO BRANCO - AC`, `1301 - MANAUS - AM`, `1401 - BOA VISTA - RR`, `1501 - BELEM - PA`,
`1601 - MACAPA - AP`, `1701 - PALMAS - TO`, `2101 - SAO LUIS - MA`, `2201 - TERESINA - PI`,
`2301 - FORTALEZA - CE`, `2401 - NATAL - RN`, `2501 - JOAO PESSOA - PB`, `2601 - AFLITOS - PE`,
`2602 - BOA VIAGEM - PE`, `2701 - MACEIO - AL`, `2801 - ARACAJU - SE`, `2901 - SALVADOR - BA`,
`2902 - ITABUNA - BA`, `2903 - FEIRA DE SANTANA - BA`, `2904 - VITORIA DA CONQUISTA - BA`,
`3101 - BELO HORIZONTE - MG`, `3102 - JUIZ DE FORA - MG`, `3104 - MONTES CLAROS - MG`,
`3105 - UBERLANDIA - MG`, `3106 - UBERABA - MG`, `3201 - VITORIA - ES`, `3301 - RIO DE JANEIRO
CENT`, `3302 - COPACABANA - RJ`, `3303 - TIJUCA - RJ` e seguintes. Digitando `CASSI`, a lista
permaneceu com 70 filiais. A carga é feita por `POST /ecm/api/rest/ecm/dataset/datasetZoom/` com
`searchField=CodeDescription`. **O defeito não reproduz: a filial 1101 é apenas a primeira da lista.**
**Divergências encontradas:** o ticket localiza a falha "na seleção de filiais **no portal de
Acompanhamento de SCs**". A seleção de filiais que existe hoje é o **zoom "Nome da Filial" do
formulário da Solicitação de Compras** (`zoomNomeFilial` / `zoomCodNomeFilial`), acompanhado do campo
readonly **"Código da Filial"**. No painel de *Acompanhamento de Contratos* não há seleção de filial:
há uma **coluna "Filial"** com caixa **"Filtrar"** própria, que é outra coisa.
**Dados/massa usados:** nenhum — zoom aberto em leitura, nada selecionado, nada submetido.

---

## CT-FSWTBC-4821  (fluig · Concluído · SDCASSI-471)

**Título:** Conferir que o campo Total Estimado a Aprovar (R$) da Validação do Item Orçamentário exibe o valor com máscara brasileira e soma corretamente os itens do aprovador.

**Origem:** FSWTBC-4821 — "Valor estimado incorreto na exibição", no campo **Total Estimado a Aprovar
(R$)**. O próprio cliente levantou a hipótese de ser "apenas a aplicação da máscara de formatação". A
correção efetiva levou horas; ficou 13 dias parada aguardando análise de merge das demandas em
homologação.

**Módulo/Rota:** **Solicitação de Compras**, etapa **Validação do Item Orçamentário** (formulário) —
na Central de Tarefas a etapa aparece como **Validação Orçamentária**. Formulário no iframe
`/webdesk/streamcontrol/256831/`, grade **`tbItemOrcamentario`**, campo `tbitorc_vlrTotEstItem`.

**Pré-condições**
- Uma SC na etapa **Validação do Item Orçamentário**, atribuída ao executor.
- A SC precisa ter **mais de um item** vinculado ao mesmo aprovador orçamentário, para que a soma
  seja observável, e valores com centavos (para expor erro de máscara).
- **Bloqueio:** sim. **Não há SC em Validação Orçamentária** na Central de Tarefas desta conta — as
  10 tarefas disponíveis são de *Cotação/Correção*, *Solicitação de Compras/Validação do Gestor* e
  *Solicitação de Compras/Correção*. O campo foi inspecionado no formulário publicado, mas **sem
  valor**, porque a etapa não está ativa em nenhuma instância acessível.

**Passos**
1. Abrir a SC na etapa **Validação do Item Orçamentário** pela Central de Tarefas.
2. Localizar, na grade de itens orçamentários, o campo **Total Estimado a Aprovar (R$)**.
3. Conferir o **formato** do valor exibido.
4. Somar manualmente os valores totais dos itens atribuídos àquele aprovador e comparar com o campo.
5. Marcar **Aprovar? = Sim** em um dos itens e conferir que o total do aprovador se ajusta de acordo
   com a regra (o valor é limpo para o item ainda não marcado).
6. Conferir que o campo é **somente leitura** — não aceita digitação.
7. Sair **sem enviar** a tarefa.

**Resultado esperado**
- **Total Estimado a Aprovar (R$)** exibe o valor no padrão brasileiro: ponto como separador de
  milhar e **vírgula** com **duas casas** decimais — `1.234,56`, nunca `1234.56` nem `1234,5600`.
- O valor corresponde à **soma** dos totais dos itens sob responsabilidade daquele aprovador.
- O campo é **readonly** e é marcado como obrigatório (`*`) na etapa.
- A soma é recalculada ao montar o painel do item, sem duplicar parcelas quando o painel é remontado.
- O mesmo padrão de formatação vale para os demais campos monetários da tela.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O **Total Estimado a Aprovar (R$)** exibido incorretamente — pela hipótese registrada no próprio
  ticket, com a máscara não aplicada, isto é, no formato cru `1234.56` (ponto decimal, sem separador
  de milhar) em vez de `1.234,56`. O ticket não registra o valor exato observado.

**Severidade:** Alta — é o número sobre o qual o gestor orçamentário decide aprovar ou não. Ler
`1.234,56` como `1234.56`, ou vice-versa, muda a ordem de grandeza da decisão de alçada.

**Preparação de massa:** uma SC em **Validação do Item Orçamentário** atribuída ao executor, com pelo
menos dois itens sob o mesmo aprovador orçamentário e valores com centavos. Precisa ser criada pelo
próprio executor (abrir SC → percorrer até a validação orçamentária) ou repassada por quem tem a
tarefa hoje — não existe na fila desta conta.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **Visto renderizado** no formulário 256831 — o campo existe, com o rótulo
exato **"Total Estimado a Aprovar (R$) *"**, `name`/`id` `tbitorc_vlrTotEstItem`, `type="text"`,
**`readonly`**, `placeholder` "Total Estimado a Aprovar (R$)" e tooltip "Valor Total Estimado a
Aprovar (R$)."; fica na grade **`tbItemOrcamentario`**, imediatamente ao lado do radio **"Aprovar?"**
(`tbitorc_aprovadoValid`). Sem instância na etapa, o campo veio **vazio** — não foi possível conferir
valor nem soma. **Lido no fonte publicado** (`App/ViewHandler.js` do formulário 256831), o mecanismo
está claro e confirma a hipótese do cliente: o acumulado é gravado com
`$(o_).find("input[name^=tbitorc_vlrTotEstItem___]").val(valor.toFixed(2))` — que produz **ponto
decimal** (`484.37`) — e só depois o campo recebe
`$(o).mask('#.##0,00', { reverse: true })`, aplicado tanto em `tbitorc_vlrTotEstItem___N` quanto em
`_tbitorc_vlrTotEstItem___N`. Se a máscara não for aplicada (ou for aplicada antes da gravação), o
usuário lê exatamente o `toFixed(2)` cru. Confirma-se ainda que o valor é **zerado** para o item cujo
`tbitorc_aprovadoValid` ainda não está marcado. **Evidência colateral de que a formatação BR funciona
hoje** na mesma família de telas: no modal *Informações Complementares do Contrato* os valores saem
como `R$ 484,37` e no *Detalhes da Planilha* como `R$ 287,36` e `R$ 2,00`.
**Divergências encontradas:** uma, de nome de etapa, já prevista no briefing e confirmada aqui: o
ticket fala em "aprovação do gestor orçamentário"; o formulário nomeia **Validação do Item
Orçamentário** e a Central de Tarefas, **Validação Orçamentária**. Atenção também para não confundir
este campo com **"Total a ser Aprovado (R$)"** (`authorityVlrTotCompra`), que é outro campo, da etapa
de **Aprovação de Alçada**.
**Dados/massa usados:** nenhum — formulário aberto em branco, nada submetido.

---

## CT-FSWTBC-4852  (ambos · Concluído · SDCASSI-480)

**Título:** Quando a integração pós-alçada falha, a SC deve parar em Correção com o erro legível — nunca travar em "Integração com ERP"

**Origem:** FSWTBC-4852 — SC 95449: *"Falha na Integracao com ERP. code 500, Internal Server Error, THREAD ERROR ([5816], TP|HTTPREST|HTTPURI@01|FALSE...)"* após a Aprovação de Alçada; duplicata do SDCASSI-481, não reproduzido, encerrado sem causa.

**Módulo/Rota:** Processos → *Solicitação de Compras* → atividades **94 Aprovação de Alçadas → 287 Integração com ERP (`integracaoERP3`)** → aba **Histórico**; campo **Retorno Integração\*** do formulário

**Pré-condições**
- SC que chegou a *Aprovação de Alçadas* com todos os aprovadores da grade `tbAlcadas` marcando *Aprovar?* = Sim.
- Capacidade de simular a falha do ERP (derrubar o dataset de integração — técnica `derrubarDataset` do projeto) ou janela real de indisponibilidade.
- **Bloqueio:** a conta de QA não é aprovadora de alçada nem comprador (§5-C) — não leva uma SC até 287.

**Passos**
1. Com a SC em *Aprovação de Alçadas*, aprovar na grade `tbAlcadas` (*Aprovar?* = Sim, *Justificativa para a Aprovação/Reprovação* = `QA-4852`).
2. Com o ERP indisponível para a chamada de 287, observar o Histórico.
3. Abrir a instância; ler **Retorno Integração\*** e a atividade atual.
4. Restabelecer o ERP; na tarefa de *Correção* (ou na própria 287, que é tarefa humana nesta base), reenviar.

**Resultado esperado**
- Passo 2: o Histórico registra a falha com a mensagem do ERP (*code 500 / THREAD ERROR …*) e o processo segue para uma tarefa humana (*Correção* ou 287 com responsável) — não fica em atividade automática sem dono.
- Passo 3: **Retorno Integração\*** exibe a mesma mensagem (não fica vazio).
- Passo 4: o reenvio conclui com *"Integração executada com sucesso - Tempo de Execução N s"* e o processo avança para *96 Sol. Aprovado na Alçada? → 323 Aguarda Geração do Pedido/Contrato*.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- *"Falha na Integracao com ERP. code 500, Internal Server Error, THREAD ERROR ([5816], TP|HTTPREST|HTTPURI@01|FALSE...)"* e o processo incapaz de chegar à *servicetask185 (Disparo de E-mails)*, travando também os testes do SDCASSI-448.

**Severidade:** Alta

**Preparação de massa:** SC `QA-4852` levada até a alçada por comprador + aprovador; ou a intercepção do endpoint de dataset de 287.

**Verificado em tela:** PARCIAL
**O que foi verificado:** por dado (tarefas de 99257 e 95519): a cadeia **94 Aprovação de Alçadas → 287 Integração com ERP → 96 Sol. Aprovado na Alçada?** existe; **287 é tarefa com responsável humano** nesta base (ilmara.nascimento em 99257, 30/06→03/07; dois responsáveis em 95519). Grade da alçada no fonte publicado (`form_sc.html`): *Aprovador, Email do Aprovador, Data da Aprovação, Hora da Aprovação, **Aprovar?**, Justificativa para a Aprovação/Reprovação* (`tbalcada_*`). Campo **Retorno Integração\*** lido vazio em 3 SCs abertas hoje.
**Divergências encontradas:** o processo **95449 desta base finalizou em 15/05 em *Fim - Validação do Comprador*** — nunca chegou à alçada; o "95449" do ticket é de outro ambiente ou é nº da SC no ERP. A janela 30/06→03/07 em que a 287 do 99257 ficou com humano coincide com o período do THREAD ERROR.
**Dados/massa usados:** leitura de 99257, 95519, 95449 — nada movimentado.

---

## CT-FSWTBC-4874  (ambos · Concluído · SDCASSI-484)

**Título:** Na Aprovação de Alçada, a grade só deve abrir com as cotações vencedoras carregadas — sem vencedora, o processo aguarda em vez de seguir

**Origem:** FSWTBC-4874 — SCs 99257 e 95519: a atividade **310** não localizou as cotações vencedoras no Protheus e **mesmo assim permitiu continuar**; campos da Aprovação de Alçada não carregavam. Correções: filtros `D_E_L_E_T_` movidos do WHERE para os JOINs no `dsProtheus_getCotacaoxProdxGrupProd_restGetAll` (e removido `B1_MSBLQL='2'`), validação invertida na servicetask310, `throw e` no lugar de `return false`, escopo dos HashMaps.

**Módulo/Rota:** *Solicitação de Compras* → **309 Aguarda Geração Alçadas → 225 Alçada foi Gerada? → 310 Gerar Grid de Alçada → 94 Aprovação de Alçadas**; painel *Valor da Compra (R$) / Valor do Frete (R$) / Total a ser Aprovado (R$)*, grade **`tbForneceAlcadas`** (*Empresa Vencedora, CNPJ/CPF, Valor da Compras (R$), Valor do Frete (R$), Nº Pedido*) e grade **`tbAlcadas`** (*Aprovador … Aprovar?*)

**Pré-condições**
- Cotação finalizada com vencedor definido (*Definir Vencedor Cotação*), incluindo um **produto bloqueado** (`B1_MSBLQL = 1`) entre os itens para o cenário do filtro removido.
- **Bloqueio:** conta de QA sem matrícula de comprador — não gera cotação nem chega à alçada.

**Passos**
1. Com a SC em *Aguarda Geração Alçadas*, acompanhar o Histórico até *Gerar Grid de Alçada (310)*.
2. Abrir a tarefa *Aprovação de Alçadas*: conferir a grade **Empresa Vencedora** (`tbForneceAlcadas`) e os totais do painel.
3. Conferir a grade `tbAlcadas`: *Aprovador*, *Email do Aprovador* e o switcher **Aprovar?** presentes e acionáveis.
4. Cenário negativo: com a cotação sem vencedor gravado no ERP (ou o dataset indisponível), acompanhar 310.
5. Cenário do produto bloqueado: confirmar que o item bloqueado aparece na grade da vencedora.

**Resultado esperado**
- Passo 2: uma linha por fornecedor vencedor com *Valor da Compras (R$)* > 0; *Total a ser Aprovado (R$)* = soma; sem linhas em branco.
- Passo 3: botões/switchers de aprovação visíveis (o ticket de 14/07 reclamava da ausência deles).
- Passo 4: o processo **não** avança para 94 — o Histórico registra log e mensagem de aguardo, e a instância permanece em 225/310 até haver vencedora.
- Passo 5: item de produto bloqueado listado (o filtro `B1_MSBLQL='2'` foi removido).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- *Aprovação de Alçada* aberta com campos vazios, sem botões de aprovação, e o processo já em 94 sem as cotações vencedoras — "permitiu dar continuidade ao processo".

**Severidade:** Alta

**Preparação de massa:** SC + cotação + vencedor, por comprador; um produto bloqueado no cadastro (SB1) para o passo 5.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **`dsProtheus_getCotacaoxProdxGrupProd_restGetAll` existe** (GET search → 200 com linhas da SC8: `C8_XVALPRO`, `C8_UM`, `C8_TAXAFIN`…). Cadeia 309 → 225 → **310 Gerar Grid de Alçada** → 94 confirmada por dado em 99257 (30/06) e 95519 (16/06 e 02/07 — a segunda depois de *Retornar para Alçada* via 211 *Enviar para*). Rótulos das duas grades e do painel lidos no fonte publicado (`form_sc.html`: `tbfornalc_*` e `tbalcada_*`).
**Divergências encontradas:** a grade da vencedora escreve **"Valor da Compras (R$)"** (erro de concordância) enquanto o painel escreve "Valor da Compra (R$)"; o 95519 passou **duas vezes** por 310/94 (16/06 e 02/07) e está `CANCELED` desde 14/08 com *Aguarda Vigência do Contrato (332)* `NOT_COMPLETED` — foi cancelado enquanto esperava vigência.
**Dados/massa usados:** leitura de 99257 e 95519; dataset consultado sem filtro — nada gravado.

---

## CT-FSWTBC-4918  (fluig · Em Homologação · SDCASSI-489)

**Título:** Aprovar a alçada de uma Solicitação de Compras e conferir que a linha do aprovador vem carregada, de modo que o campo Aprovar? possa ser preenchido.

**Origem:** FSWTBC-4918 — "Erro na aprovação da Alçada SC 103263", com a crítica
**`O campo "Aprovar? - Linha 1" é obrigatório! Favor preencher o campo e tentar novamente`**. O
anexo do chamado (`103263_gestor orcamentario.png`) indica que o sintoma se manifesta na visão do
gestor orçamentário. A hipótese registrada na análise é a de validação disparando sobre linha
estruturalmente existente mas **sem dados** — o usuário não consegue preencher o que não foi
carregado.

> **Este item continua `Em Homologação` desde 15/07/2026, sem comentário técnico.** O resultado
> esperado abaixo é o comportamento **correto**; hoje ele **pode falhar**.

**Módulo/Rota:** **Solicitação de Compras**, etapa **Aprovação de Alçada** (atividade 94). Formulário
no iframe `/webdesk/streamcontrol/256831/`, grade **`tbAlcadas`** (aprovadores) e grade
**`tbForneceAlcadas`** (empresa vencedora).

**Pré-condições**
- Uma SC que tenha percorrido a cotação e a negociação e chegado à **Aprovação de Alçada**, com
  **empresa vencedora definida** e valor total apurado.
- O executor precisa ser um dos **aprovadores da alçada** daquela SC.
- **Bloqueio:** sim, duplo. (a) **Não há SC em Aprovação de Alçada** na Central de Tarefas desta
  conta. (b) A família cotação/alçada é inacessível a este login porque a conta `TOTVS-FS` **não
  resolve matrícula de comprador** — o dataset `dsProtheus_getCompradores_restGetAll` é chamado com
  `Y1_USER = "undefined"` (limitação de conta documentada, não defeito do produto). Sem uma SC
  fechada em cotação, a alçada não é alcançável.

**Passos**
1. Abrir a SC na etapa **Aprovação de Alçada** pela Central de Tarefas.
2. **Antes de qualquer clique**, conferir a seção da empresa vencedora: **Empresa Vencedora**,
   **CNPJ/CPF**, **Valor da Compras (R$)**, **Valor do Frete (R$)**, **Nº Pedido**, **Nº Contrato**.
3. Conferir os campos de totalização: **Valor da Compra (R$)**, **Valor do Frete (R$)**, **Total a
   ser Aprovado (R$)**, **Valor Vigente do Contrato (R$)** e **Total com Aditivo (R$)**.
4. Na grade de aprovadores, conferir que **a Linha 1 existe e está preenchida**: **Aprovador**,
   **Email do Aprovador**, **Data da Aprovação** e **Hora da Aprovação**.
5. Localizar o campo **Aprovar?** da Linha 1 e conferir que os dois botões, **Sim** e **Não**, estão
   habilitados e clicáveis (sem sobreposição de CSS — se houver, usar clique por coordenada, não
   `force`).
6. Preencher **Justificativa para a Aprovação/Reprovação**.
7. **Não clique em Aprovar/Enviar.** Para exercitar a crítica com segurança, faça o inverso: **deixe
   Aprovar? em branco** e acione *Enviar*; observe a mensagem e **não prossiga**.

**Resultado esperado**
- A grade de aprovadores traz **uma linha por aprovador**, e a **Linha 1 vem carregada** com
  Aprovador, Email do Aprovador, Data e Hora da Aprovação.
- O campo **Aprovar?** da Linha 1 é editável e aceita **Sim** ou **Não**.
- A crítica de obrigatoriedade só dispara quando o campo está **de fato em branco** — e, quando
  dispara, o campo apontado **existe na tela e é preenchível**.
- Não ocorre a situação em que a validação exige um campo de uma linha que o usuário não consegue
  preencher: se não há aprovador carregado, a etapa não deve cobrar aprovação dessa linha.
- A seção da empresa vencedora vem preenchida — sem ela, o valor a aprovar não tem lastro.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Ao tentar avançar a Aprovação de Alçada, a mensagem
  **`O campo "Aprovar? - Linha 1" é obrigatório! Favor preencher o campo e tentar novamente`**,
  sem que o usuário tenha como preencher o campo cobrado — a Linha 1 existe estruturalmente, mas
  chega sem dados (tipicamente sem cotação vencedora carregada). O processo fica travado na etapa.

**Severidade:** Alta — trava a etapa de **alçada**, que é a aprovação por valor. Solicitação parada
em alçada não vira pedido, e o usuário não tem ação que a destrave.

**Preparação de massa:** uma SC completa até **Aprovação de Alçada**, com empresa vencedora definida
e o executor entre os aprovadores. Exige percorrer cotação e negociação com um login **de comprador**
— que esta conta não tem. Precisa ser preparada por quem opera Compras, ou por um login com matrícula
de comprador resolvida no ERP.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **Visto renderizado** no formulário 256831 (aberto em branco): o campo
existe, com o rótulo exato **"Aprovar? *"**, `name` **`tbalcada_statusValidacao`**, `type="radio"`,
**`required`**, com as opções **Sim** (`value="Aprovado"`) e **Não** (`value="Reprovado"`); está na
grade **`tbAlcadas`**, ao lado de **Aprovador** (`tbalcada_nomResponsavel`), **Email do Aprovador**
(`tbalcada_emailResponsavel`), **Data da Aprovação** (`tbalcada_dataValidacao`, `input type="date"`,
ISO), **Hora da Aprovação** (`tbalcada_horaValidacao`) e **Justificativa para a
Aprovação/Reprovação** (`tbalcada_justificativa`, máx. 400 caracteres) — todos obrigatórios e os
quatro primeiros `readonly`. A grade **`tbForneceAlcadas`** existe à parte, com **Empresa
Vencedora**, **CNPJ/CPF**, **Valor da Compras (R$)**, **Valor do Frete (R$)**, **Nº Pedido** e **Nº
Contrato**; e a totalização traz **Valor da Compra (R$)**, **Valor do Frete (R$)**, **Total a ser
Aprovado (R$)**, **Valor Vigente do Contrato (R$)** e **Total com Aditivo (R$)**. A mensagem de erro
do ticket **não** foi reproduzida — não há instância na etapa, e não se forçou nenhuma.
**Divergências encontradas:** duas, ambas importantes para quem for escrever o passo a passo.
(1) **O formulário tem quatro campos com o rótulo "Aprovar?"**, em grades diferentes:
`tbmanag_aprovadoValid` (Validação do Gestor), `tbitorc_aprovadoValid` (Validação do Item
Orçamentário), `buyerAprovadoValidacao` (comprador) e `tbalcada_statusValidacao` (**Aprovação de
Alçada**). "Aprovar? - Linha 1" só identifica o campo se o contexto disser a grade; o campo da alçada
é o **`tbalcada_statusValidacao`**.
(2) O briefing mapeia a *Aprovação de Alçada* à grade **`tbForneceAlcadas`**. No formulário publicado
as duas grades existem, mas com papéis distintos: **`tbAlcadas`** é a dos **aprovadores** (é dela que
sai "Aprovar? - Linha 1") e **`tbForneceAlcadas`** é a da **empresa vencedora**. Ajuste que vale
propagar ao briefing.
Registro adicional: a mensagem citada no ticket **não** consta em nenhum fonte publicado do widget
nem do formulário — é gerada pelo motor de formulários do Fluig no envio, o que reforça a
necessidade de uma instância real para reproduzi-la.
**Dados/massa usados:** nenhum — formulário aberto em branco. Nenhum botão *Aprovar* foi clicado e
nenhuma solicitação foi movimentada.

---

## CT-FSWTBC-4952  (ambos · Aguardando Retorno de Homologação · SDCASSI-496)

**Título:** Impedir na SC um item cujo valor total estimado fique abaixo de R$ 0,10 (evita o "401 Tabela SC1" por preço próximo de zero)

**Origem:** FSWTBC-4952 — SCs 103685, 103944 e 106375 com *"error code: 401 message: Tabela SC1"*: o preço unitário chegava como 0,000001, `C1_XVALOR` (2 casas) virava 0 e o ExecAuto MATA110 recusava. O "401" **não é** erro de acesso — é crítica de preenchimento. Correção no Fluig (ViewHandler + events/validateForm.js, mínimo R$ 0,10). **Aberto na prática**: cliente reportou em 31/07, 07/08 e 12/08 que o erro persiste em produção.

**Módulo/Rota:** *Solicitação de Compras* → **Adicionar Produto** → campos **Quantidade \***, **Preço Unit. Estimado \***, **Vlr. Total Estimado \*** (`tbprod_quantidade___N`, `tbprod_precoUnitario___N`, `tbprod_valorTotal___N`); atividade **233 Grava SC e Anexos** → **236 Correção**; campo **Retorno Integração\***; Histórico

**Pré-condições**
- Produto cadastrado; conta de QA basta.
- **Bloqueio:** nenhum para a crítica de tela; o teste de gravação (passo 6) exige enviar uma SC `QA` — permitido, mas preferimos não submeter nesta rodada.

**Passos**
1. Abrir *Solicitação de Compras* → **Adicionar Produto**; *Quantidade* = 1; *Preço Unit. Estimado* = **0,01**; sair do campo (Tab).
2. Ler a mensagem e clicar **OK**; ler os valores dos três campos.
3. Repetir com *Preço Unit. Estimado* = **0,10** (limite): sair do campo.
4. Repetir com *Quantidade* = 0,001 e *Preço* = 10,00 (total 0,01 pelo lado da quantidade).
5. Tentar enviar a SC com um item abaixo do mínimo.
6. (Destrutivo, opcional) Enviar SC `QA-4952` com preço **0,10** e quantidade 1; acompanhar *Grava SC e Anexos* e o Tracker.

**Resultado esperado**
- Passo 1: crítica *"O Vlr. Total Estimado não pode ser inferior a R$ 0,10! Por favor ajuste a "Quantidade" ou o "Preço Unit. Estimado" para o item 0001."*
- Passo 2: após OK, o campo ofensor é **limpo** (ticket: "avisa e apaga") e *Vlr. Total Estimado* não fica com 0,01.
- Passo 3: sem crítica; *Vlr. Total Estimado* = 0,10.
- Passo 4: mesma crítica (a regra é sobre o total).
- Passo 5: o envio é bloqueado pela validação do formulário (segunda camada), com a mesma mensagem.
- Passo 6: *Grava SC e Anexos* conclui; *Nº da Solicitação ERP* preenchido; **Retorno Integração\*** sem "401".

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC entrando em *Correção* repetidamente com *"error code: 401 message: Tabela SC1"* / log `C1_XVALOR := 0 <- Invalido`; *Nº da Solicitação ERP* vazio (103685 ciclou Correção ↔ Grava SC 6 vezes entre 06/07 e 07/08).

**Severidade:** Alta

**Preparação de massa:** nenhuma para 1–5; para o 6, uma SC `QA-4952` do executor.

**Verificado em tela:** SIM (total) para os passos 1–3 · PARCIAL no conjunto
**O que foi verificado:** **renderizado hoje**: Quantidade 1 × Preço 0,01 → modal *"Erro: O Vlr. Total Estimado não pode ser inferior a R$ 0,10! Por favor ajuste a "Quantidade" ou o "Preço Unit. Estimado" para o item 0001."* com botão **OK**; Preço 0,10 → sem crítica, `tbprod_valorTotal___1 = 0,10`. Nas SCs do ticket (04/09 e hoje): 103685 com `tbprod_precoUnitario___1 = 29,966667` e `quantidade = 20,000000` (6 casas), *Nº da Solicitação ERP* vazio, ciclo Correção ↔ Grava SC e Anexos; 103685/103944/106375 `CANCELED` em 14/08 10:30 (lote) — **nunca gravaram no ERP**.
**Divergências encontradas:** (1) **após OK os valores permanecem** (`precoUnitario = 0,01`, `valorTotal = 0,01`): a tela avisa mas **não apaga** — o fonte publicado (`js_256831_App_ViewHandler.js:1001-1007`) só emite `UtilsHandler.toast` e grava `vlTotal` no campo; o "apaga" do ticket não está publicado neste ambiente. Compatível com o relato de que o erro persiste em produção. (2) O ticket segue *Aguardando Retorno de Homologação* — **este caso pode reprovar hoje por causa nunca fechada**, não por regressão. (3) **Retorno Integração\*** vazio nas três SCs abertas — a mensagem 401 só era legível no Histórico.
**Dados/massa usados:** formulário novo preenchido e **descartado sem enviar**; leitura de 103685/103944/106375.

---

## CT-FSWTBC-4989  (fluig · Concluído · SDCASSI-505)

**Título:** Percorrer uma Solicitação de Compras etapa a etapa como demandante e confirmar que o rateio por centro de custo que ele mesmo informou continua visível em todas elas.

**Origem:** FSWTBC-4989 / SDCASSI-505 — o rateio da SC não era exibido na tela de detalhes da solicitação em **nenhuma** etapa do fluxo para o usuário demandante. Quem informou o dado na abertura não conseguia conferi-lo depois, o que impedia detectar erro de centro de custo antes da geração do pedido. Aberto 21/07/2026, concluído 28/07/2026 (DEM10015025).

**Módulo/Rota:** Central de Tarefas › abrir a solicitação (`wf_solicitacao_compras`) — ou Processos › Consultar › a instância. Painel **"Itens da Solicitação"**, seção **"Rateio por Centro de Custo — Item N"** (`id="tdataRateioItens"`, título montado como `Rateio por Centro de Custo <span id="itemRateioItens">`).

**Pré-condições**
- Uma SC criada **pelo próprio executor do teste** (para que ele seja o demandante), com pelo menos **um item cujo rateio esteja distribuído em dois centros de custo diferentes** — só assim a ausência do painel é distinguível de "não havia rateio".
- Poder acompanhar essa SC até etapas posteriores (exige gestor, aprovador orçamentário e comprador).
- **Bloqueio:** a conta de QA não fecha o ciclo — não há credencial de gestor, de aprovador orçamentário nem de comprador com matrícula no ERP. Consegue-se cobrir **Início (6)**, **Ajustar Informações (11)** e a leitura da SC em etapas posteriores criadas por terceiros, mas não conduzir a própria SC de ponta a ponta.

**Passos**
1. Abrir **Processos › Solicitação de Compras** e preencher a SC com um item.
2. No item, clicar em **"Adicionar Centro de Custo"** e distribuir o rateio em **dois** centros de custo (ex.: 60/40). Anotar os códigos e os percentuais.
3. Enviar a solicitação (etapa **6 - Início** → **7 - Validação do Gestor**).
4. Reabrir a mesma solicitação como demandante e localizar o painel **"Rateio por Centro de Custo — Item 1"**.
5. Repetir a conferência em cada etapa seguinte que a solicitação alcançar: **7 Validação do Gestor**, **14/269 Validação Orçamentária**, **119 Validação do Comprador**, **33 Processo de Cotação**, **50 Processo de Negociação**, **94 Aprovação de Alçadas**, **185 Disparo de E-mails**.
6. Fazer o gestor reprovar uma vez, para que a SC retorne a **11 - Ajustar Informações**, e conferir o painel também ali.
7. Em cada etapa, conferir que o painel aparece **uma única vez por item** (sem linhas duplicadas).

**Resultado esperado**
- O painel **"Rateio por Centro de Custo — Item N"** é exibido em **todas** as etapas acima, e não apenas na abertura.
- Os centros de custo, a classe de valor e os percentuais exibidos são **exatamente** os informados no passo 2.
- O painel aparece **uma vez** por item — não há duplicação ao navegar entre etapas nem ao recarregar.
- Nas etapas em que a SC é apenas consultada, os campos do rateio ficam **somente leitura**; em **6 - Início** e **11 - Ajustar Informações** eles permanecem **editáveis** (é onde o demandante corrige).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O painel de rateio simplesmente **não aparece** para o demandante em nenhuma etapa; a SC mostra o item e o valor total, mas nada de centro de custo. O erro de rateio só se revela na contabilização.

**Severidade:** Alta *(informação contábil invisível para quem a informou; sem ela o solicitante não tem como detectar erro de centro de custo antes do pedido — e o SDCASSI-492, rateio perdido na integração, mostra que essa cegueira encobre perda de dado)*

**Preparação de massa:** uma SC nova, criada pelo próprio executor, com **um item rateado em dois centros de custo distintos**, e o acompanhamento dela por gestor + aprovador orçamentário + comprador para que atravesse as etapas. Nenhum registro pré-existente serve, porque o teste precisa saber qual era o rateio original.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **LIDO NO FONTE PUBLICADO** — o próprio JS servido carrega a correção com o número da demanda no comentário: em `sc_App_ViewHandler.js`, dentro de `handleView()`, `//COMMENT NOTE: ** DEM10015025 - exibe o rateio em todas as etapas do fluxo (guard em handleMountObjDTable evita duplicacao) **` seguido de `this.handleLoopMountDTable();`. O bloco está sob a condição `wk_NumState != 0 && wk_NumState != activitys.inicio && wk_NumState != activitys.ajustarInformacoes` — ou seja, roda em **toda** etapa que não seja abertura/ajuste. A guarda antiduplicação também está lá: `handleMountObjDTable` começa com `if ($('#target___' + index).length > 0) { return; }`. Para as etapas **6** e **11** o rateio é montado pelo caminho **editável** (`handleChanges()` → `handleLoadRateio()`), que reconstrói a tabela a partir do campo `tbprod_jsonrateio___N`. **LIDO NO HTML SERVIDO** — painel `id="tdataRateioItens"`, título `Rateio por Centro de Custo`, botão `Adicionar Centro de Custo`, campos `tbRatCC_centroCusto___i_j`, `tbRatCC_codCCusto___i_j`, `tbRatCC_classeValor___i_j`, `tbRatCC_Rateio___i_j`. Não foi possível **ver renderizado** o painel numa SC real: a conta de QA não é demandante de nenhuma das SCs abertas.
**Divergências encontradas:** **duas.** (a) **Não existe tela chamada "Detalhes da Solicitação"** — a string `Detalhes` não ocorre nenhuma vez no HTML publicado do formulário da SC. A superfície real é o painel *"Rateio por Centro de Custo"* dentro do próprio formulário; no Portal do Comprador, a grade de *Validação Inicial* **não traz rateio em coluna nenhuma** (colunas vistas: Nº Solic, Solicitante, Data Solicitação, Cod. Filial, Filial, Data Emissão, Nº Solic ERP, Justificativa, Etapa, Status). (b) O comentário do código diz "**todas** as etapas do fluxo", mas a chamada é explicitamente **excluída** para os estados `0`, `6 Início` e `11 Ajustar Informações` — não é defeito (esses dois usam o caminho editável), porém um teste que só olhe `handleLoopMountDTable` concluirá erradamente que há buraco. O caso acima cobre os dois caminhos de propósito.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-5005  (ambos · Concluído · SDCASSI-507)

**Título:** Tarefa *Verificar retorno Protheus* nasce com prazo de um dia útil e aparece como pendência vencida na Central de Tarefas quando o prazo passa

**Origem:** FSWTBC-5005 — pedido para colocar prazo de um dia útil na atividade "VERIFICAR RETORNO PROTHEUS" (317), a etapa em
que o Fluig aguarda a resposta do ERP e onde solicitações ficavam paradas em silêncio. Entregue no PR 71583 / MUD18158.

**Módulo/Rota:** `wf_solicitacao_compras` → atividade **317 – Verificar retorno Protheus** (após *Aguarda Geração do
Pedido/Contrato* 323 → gateway *Pedido/Contrato foi Gerado?*). Superfícies: aba **Histórico** ("Atividade atual … | Prazo: …"),
Central de Tarefas (`/portal/p/1/pagecentraltask`) e `GET /process-management/api/v2/requests/{id}/tasks` (`deadlineDate`, `slaStatus`).

**Pré-condições**
- Uma SC em que o gateway *Pedido/Contrato foi Gerado?* decidiu pela condição que leva a 317 (pedido/contrato não gerado).
- Hoje existem duas: **112855** (desde 28/08 16:01, sexta-feira) e **112816** (desde 27/08 18:11, quinta-feira).
- **Bloqueio:** nenhum para leitura. Para gerar uma nova ocorrência seria preciso uma integração que falhe na geração do
  pedido/contrato — massa Protheus.

**Passos**
1. Abrir a SC em modo leitura e clicar na aba **Histórico**.
2. Ler a linha "Atividade atual: Verificar retorno Protheus (Em progresso)" e a linha seguinte "Responsável: … | Prazo: …".
3. Conferir o instante em que a atividade foi criada (linha "… movimentou a atividade Aguarda Geração do Pedido/Contrato para a
   atividade Pedido/Contrato foi Gerado?" e o carimbo da 317).
4. Calcular a diferença entre criação e prazo em **dias úteis**.
5. Com o login do responsável (ou via API `tasks`), confirmar que, passado o prazo, a tarefa é marcada como vencida
   (`slaStatus = EXPIRED`) e aparece como pendência na Central de Tarefas.

**Resultado esperado**
- A tarefa 317 tem prazo definido ("Prazo: …" preenchido — nunca "Sem prazo definido").
- O prazo é de **um dia útil** a partir da criação (ex.: criada quinta 18:11 → prazo sexta, fim do expediente).
- Vencido o prazo, a tarefa passa a `EXPIRED` e fica visível como pendência do responsável.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- "Prazo: Sem prazo definido" na 317 — a solicitação esperava o ERP indefinidamente sem ninguém ser cobrado.

**Severidade:** Média

**Preparação de massa:** nenhuma para a regressão — usar 112855/112816 enquanto existirem; depois, qualquer SC que caia em 317.

**Verificado em tela:** SIM (total)
**O que foi verificado:** **visto renderizado** — Histórico da SC 112855: "Atividade atual: Verificar retorno Protheus (Em
progresso) · Responsável: Fernanda Silva Martins | **Prazo: Desde 02/09/2026 16:01:05**", com a 317 criada em 28/08/2026
16:01:06. Via API (`tasks?expand=chosenAssignees`): 112855 → `startDate 2026-08-28T16:01:06`, `deadlineDate 2026-09-02T16:01:05`,
`slaStatus EXPIRED`; 112816 → `startDate 2026-08-27T18:11:05`, `deadlineDate 2026-09-01T18:00:00`, `slaStatus EXPIRED`. Ou seja: o
prazo **existe** e o vencimento **é sinalizado** — mas o valor medido é de **3 dias úteis** (qui 27/08 18:11 → ter 01/09 18:00;
sex 28/08 16:01 → qua 02/09 16:01), não um. Para comparação, a atividade 309 tem prazo de 1 dia (112593: 26/08 01:51 → 26/08
18:00; 108618: 10/08 15:26 → 11/08 15:26).
**Divergências encontradas:** **o prazo configurado na 317 não é de um dia útil: nas duas instâncias vivas (processo v95 e v97,
ambas posteriores à entrega de 03/08) mede 3 dias úteis.** Este caso **reprova hoje** por esse motivo — registrado na seção
final, para não ser lido como regressão de algo que já esteve correto. O ticket grafa "VERIFICAR RETORNO PROTHEUS"; a tela grafa
**Verificar retorno Protheus**.
**Dados/massa usados:** leitura de 112855 e 112816 — nenhum — não submetido.

---

## CT-FSWTBC-5006  (ambos · Concluído · SDCASSI-508)

**Título:** Após a alçada aprovada, a SC gera o pedido/contrato e só cai em *Verificar retorno Protheus* com a causa real escrita em *Retorno Integração*

**Origem:** FSWTBC-5006 — SCs com saldo orçamentário voltavam para "verificar retorno Protheus". Causa raiz no Protheus: a
DEM10013707 removeu do UCOME024 o controle `fAprovado()/fMesmoVencedor`, e toda cotação aprovada caía em "Cotação em aprovação
não pode ser alterada". O diagnóstico demorou porque a etapa estava rotulada no Fluig como "Verificar Trava Orçamentária" — o
rótulo foi corrigido para "Verificar Retorno Protheus". Também constatado represamento da fila (16 h de espera).

**Módulo/Rota:** `wf_solicitacao_compras`: *Aprovação de Alçadas* (94) → *Integração com ERP* (287) → *Aguarda Geração do
Pedido/Contrato* (323) → gateway **Pedido/Contrato foi Gerado?** → **Verificar retorno Protheus** (317) → *Enviar para* (318) →
**Fim - Verificar Trava Orçamentária** (319). Formulário: painel **Verificar Retorno Protheus** (`#collapseBudgetLock`), campo
**Retorno Integração**, combo **Enviar para** (*Retornar para Aguardar Geração* / *Encerrar Solicitação*), **Justificativa**.

**Pré-condições**
- Uma SC com alçada aprovada (Histórico: "… movimentou a atividade Aprovação de Alçadas para a atividade Integração com ERP")
  cujo ERP tenha saldo orçamentário para o item.
- Perfil de comprador para abrir a tarefa 317 quando ela existir (a conta de QA só lê).
- **Bloqueio:** o saldo orçamentário (PCO) e o estado `C8_XALCADA` só se preparam no Protheus — sem credencial. O efeito, porém,
  é observável no Fluig (Histórico + *Retorno Integração*), portanto é caso de Fluig com massa bloqueada.

**Passos**
1. Abrir a SC em modo leitura → **Histórico**.
2. Localizar "Aguarda Geração do Pedido/Contrato movimentou … para a atividade Pedido/Contrato foi Gerado?" e a linha
   "Tarefa Automática: Decisão tomada conforme condição N".
3. Se a decisão levou a **Verificar retorno Protheus**, abrir o formulário e ler o painel *Verificar Retorno Protheus* →
   **Retorno Integração**.
4. Conferir os campos ocultos/visíveis de resultado: `docAlcadaGerada`, `numDocAlcada`, `pedidoContratoGerado`, e as colunas
   **Nº Pedido\*** / **Nº Contrato\*** da grade de fornecedores.
5. Para SC com saldo e cotação aprovada: confirmar que a decisão seguiu para geração do pedido/contrato (Nº Pedido ou Nº Contrato
   preenchido) e que a 317 **não** foi visitada.

**Resultado esperado**
- Cotação aprovada na alçada + saldo disponível ⇒ pedido/contrato gerado; `pedidoContratoGerado = Sim`, Nº Pedido/Nº Contrato
  preenchidos; nenhuma passagem por 317.
- Quando a 317 é visitada, **Retorno Integração** traz a mensagem exata devolvida pelo ERP (nunca vazio, nunca "Cotação em
  aprovação não pode ser alterada" para cotação já aprovada).
- Todos os rótulos da etapa dizem **Verificar retorno Protheus** — painel, atividade e estado final.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC com saldo caindo em "verificar retorno Protheus" com o retorno "Cotação em aprovação não pode ser alterada"; equipe
  investigando saldo orçamentário por causa do rótulo "Verificar Trava Orçamentária".

**Severidade:** Alta

**Preparação de massa:** SC com cotação aprovada em alçada e conta orçamentária com saldo — preparação no Protheus, pelo time
do ERP. Para a parte de rótulos e do campo de retorno, usar **112855** (viva hoje, em 317).

**Verificado em tela:** PARCIAL
**O que foi verificado:** (a) **visto renderizado** — Histórico da 112855: "Pedido/Contrato foi Gerado? Tarefa Automática ·
28/08/2026 16:01:06 · Decisão tomada conforme condição 4 …" e "Atividade atual: Verificar retorno Protheus (Em progresso)";
(b) **visto renderizado** — no formulário em modo leitura, **Retorno Integração = `Nao foi possivel ativar o modelo CNTA300 para
gerar o aditivo.`**, `docAlcadaGerada = Sim`, `numDocAlcada = 000091`, `pedidoContratoGerado = Não`, `vlrParcialCompra =
10000.00`, Nº Pedido/Nº Contrato vazios — ou seja, a causa desta ocorrência é a geração do **aditivo** (CNTA300), não saldo;
(c) título do painel no HTML publicado: "Verificar Retorno Protheus"; (d) **agregado por dado** — 317 = "Verificar retorno
Protheus" (53 movimentos, 30 instâncias, 2 ativas), 318 = "Enviar para", **319 = "Fim - Verificar Trava Orçamentária"**;
(e) **lido no fonte publicado** — `App/ViewHandler.js` da SC ainda declara `verificaTravaOrcamentaria: 317,
fimVerificaTravaOrcamentaria: 104` (a 104 não existe; o fim real é a 319) e o HTML mantém o comentário "Controles da
Verificação da Trava Orçamentária" e o id `hiddenBudgetLock`. A geração de pedido com saldo não foi exercitada.
**Divergências encontradas:** a renomeação foi parcial — o **estado final 319 continua "Fim - Verificar Trava Orçamentária"**
(visível na agregação e nos nomes de atividade), e o JS/HTML seguem com a nomenclatura antiga. O ticket fala em "verificar
retorno Protheus"; a tela grafa **Verificar retorno Protheus** (atividade) e **Verificar Retorno Protheus** (painel).
**Dados/massa usados:** leitura de 112855 e 112816 — nenhum — não submetido.

---

## CT-FSWTBC-5017  (ambos · Em Homologação · SDCASSI-512)

**Título:** Cotação aprovada gera pedido mesmo sem saldo na conta orçamentária, e a SC segue até o fim com o Nº Pedido preenchido

**Origem:** FSWTBC-5017 — relato de que a cotação gerou pedido **sem** saldo na conta orçamentária (SCs 96285, 96286, 96291, 96316
sem saldo geraram pedido; 96292 com saldo). A análise funcional (04/08) **inverteu a premissa**: "pedidos oriundos de cotação
não devem ser travados por conta orçamentária" — gerar o pedido com ou sem saldo é o comportamento correto. Em homologação
aguardando o cliente validar o entendimento.

**Módulo/Rota:** `wf_solicitacao_compras`: *Aprovação de Alçadas* (94) → *Integração com ERP* (287) → *Aguarda Geração do
Pedido/Contrato* (323) → gateway **Pedido/Contrato foi Gerado?** → *Aguarda Vigência do Contrato* (332) / *Contrato?* (339) /
fim. Formulário da SC: grade de fornecedores com **Nº Pedido\*** e **Nº Contrato\***; campos `pedidoContratoGerado`, `numPedido`.

**Pré-condições**
- SC com vencedor definido e alçada aprovada cuja conta orçamentária esteja **sem saldo** no PCO.
- **Bloqueio:** o saldo é condição do Protheus (sem credencial). O efeito (pedido gerado, SC finalizada) é visível no Histórico e
  no formulário — caso de Fluig com massa bloqueada. A regra em si está **em homologação**: o resultado esperado abaixo segue a
  definição funcional de 04/08.

**Passos**
1. Abrir a SC em modo leitura → **Histórico**; localizar "Aguarda Geração do Pedido/Contrato movimentou … para a atividade
   Pedido/Contrato foi Gerado?" e a condição da decisão.
2. Confirmar que a SC **não** visitou *Verificar retorno Protheus* (317).
3. No formulário, ler `pedidoContratoGerado` e a coluna **Nº Pedido\*** da grade da empresa vencedora.
4. Conferir que o Histórico termina em *Aguarda Vigência do Contrato* (quando contrato) ou no fim do processo (quando pedido),
   sem tarefa de *Correção*.

**Resultado esperado**
- Pedido gerado independentemente do saldo da conta orçamentária (`pedidoContratoGerado = Sim`, Nº Pedido com 6 dígitos).
- Sem passagem por 317 e sem mensagem de bloqueio orçamentário em *Retorno Integração*.
- Comportamento idêntico para SC com e sem saldo.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Não há "defeito" a reincidir: se um dia a regra mudar (travar por saldo), a SC sem saldo cairá em 317 com retorno de PCO —
  este caso então passará a reprovar e precisará ser revisto junto com a regra.

**Severidade:** Alta

**Preparação de massa:** SC com alçada aprovada e conta sem saldo — preparação no Protheus. As cinco SCs do ticket (96285…96316)
são de 08/05/2026 no ERP; suas instâncias Fluig com esses números não correspondem (96291 é uma SC de 08/05 parada na seq. 7).

**Verificado em tela:** PARCIAL
**O que foi verificado:** **visto renderizado** — o gateway "Pedido/Contrato foi Gerado?" e sua decisão aparecem no Histórico
(112855: "Decisão tomada conforme condição 4" → 317); os campos **Nº Pedido\*** / **Nº Contrato\*** e `pedidoContratoGerado`
existem no formulário e foram lidos (vazios nas instâncias vivas, que não geraram pedido). **Agregado por dado** — 323 "Aguarda
Geração do Pedido/Contrato" (74 movimentos) → 332 "Aguarda Vigência do Contrato" (19) / 339 "Contrato?" (49). Nenhuma SC sem
saldo foi acompanhada até o pedido.
**Divergências encontradas:** nenhuma de rótulo. Observação: a regra "cotação não trava por orçamento" **não está escrita em
lugar algum da tela** — quem ler o Histórico de uma SC sem saldo gerando pedido não tem como saber que isso é intencional.
**Dados/massa usados:** leitura de 112855 e 96291 — nenhum — não submetido.

---

## CT-FSWTBC-5029  (fluig · Concluído · SDCASSI-517)

**Título:** Aprovar orçamentariamente uma solicitação **direcionada ao pool (sem gestor)** e confirmar que "Total Estimado a Aprovar (R$)" traz o valor — uma vez só, sem duplicar.

**Origem:** FSWTBC-5029 / SDCASSI-517 — na Validação Orçamentária o campo **"Total Estimado a Aprovar (R$)"** não calculava o valor, e o gestor aprovava sem ver o total. Causa raiz: no cenário **sem gestor**, a solicitação vai ao **pool** responsável e os campos de aprovador e código ERP ficam vazios *por definição*; a validação existente descartava essas linhas como inválidas e por isso não somava. Foram **quatro** rodadas de homologação: em 14/08 o valor seguia ausente **e** os itens sumiram da tela (regressão da própria correção); em 19/08 o item passou a ser **duplicado** e somado duas vezes; só então foi aceito. Concluído 20/08/2026. Subtarefas FSWTBC-5124 e 5160.

**Módulo/Rota:** Central de Tarefas › aba **Validação Orçamentária** › abrir a solicitação. No formulário, painel de **Item Orçamentário** (grade `tbItemOrcamentario`), campo **"Total Estimado a Aprovar (R$)"** (`tbitorc_vlrTotEstItem`). Duas atividades distintas: **14 - Validação Orçamentária** (com gestor) e **269 - Validação Orçamentária (Sem Gestor)** (pool).

**Pré-condições**
- **Duas** solicitações em Validação Orçamentária, para cobrir os dois ramos:
  - uma na atividade **14**, com gestor orçamentário identificado;
  - uma na atividade **269**, **sem gestor**, direcionada ao pool — este é o cenário do defeito.
- A do pool precisa ter **mais de um item**, para expor a duplicação que apareceu na 3ª rodada.
- Perfil que receba tarefas do pool de Validação Orçamentária.
- **Bloqueio:** a Central de Tarefas da conta de QA lista 10 tarefas, **nenhuma** em Validação Orçamentária — este login não é membro do pool. As duas SCs de homologação do próprio ticket **existem e estão vivas na base** (ver massa abaixo), mas pertencem a outros responsáveis e **não podem ser movimentadas** por este teste.

**Passos**
1. Abrir a **Central de Tarefas** e clicar explicitamente na aba **Validação Orçamentária** (a sub-aba é guardada por sessão no servidor; não confiar no estado herdado).
2. Abrir a solicitação **do cenário com gestor** (atividade 14).
3. No painel de item orçamentário, ler **"Total Estimado a Aprovar (R$)"** de cada item e anotar.
4. Sair sem aprovar. Repetir os passos 1–3 com a solicitação **do pool, sem gestor** (atividade 269), que tenha **dois ou mais itens**.
5. Conferir, item a item, o valor de **"Total Estimado a Aprovar (R$)"** contra quantidade × **"Preço Unit. Estimado"** do item correspondente.
6. Contar as **linhas** exibidas no painel de itens e comparar com o número de itens da solicitação.
7. Desligar o switcher de aprovação de **um** item (deixá-lo como *Reprovado*) e observar o que acontece com o campo daquele item.
8. Recarregar o formulário e repetir as contagens dos passos 5 e 6.

**Resultado esperado**
- **No cenário sem gestor (atividade 269), o campo "Total Estimado a Aprovar (R$)" vem preenchido** — é exatamente o que falhava.
- O valor confere com quantidade × preço unitário estimado do item, formatado com separador de milhar e duas casas (`#.##0,00`).
- O painel exibe **uma linha por item** — nem itens faltando (regressão da 1ª correção) nem item repetido (regressão da 2ª).
- O comportamento do cenário **com gestor** (atividade 14) permanece idêntico ao de antes: o valor continua sendo calculado.
- Ao marcar um item como **Reprovado**, o campo daquele item **fica em branco** — comportamento **projetado**, não defeito: o total a aprovar refere-se ao que será aprovado.
- Recarregar não altera contagem nem valores (a guarda antiduplicação segura).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O campo **"Total Estimado a Aprovar (R$)"** aparecia **vazio** na Validação Orçamentária, e o gestor decidia sem ver o total.
- Nas regressões intermediárias: **os itens deixaram de ser exibidos** para aprovação (14/08) e, depois, **o item apareceu duplicado e foi somado duas vezes** no total (19/08).

**Severidade:** Alta *(controle orçamentário — aprovação sem o valor à vista, e, na regressão de 19/08, total inflado por dupla contagem)*

**Preparação de massa:** uma SC roteada para **Validação Orçamentária sem gestor** (pool), com **dois itens ou mais**, e uma segunda SC roteada **com gestor**, para comparação. Criadas por quem tenha o perfil de demandante e possa forçar os dois roteamentos. **Aviso registrado no próprio ticket e que vale como regra de método:** *"como a base de homologação foi recentemente atualizada com os dados de produção, o card 99886 deixou de ser referência confiável para reprodução"* — **não fixe número de solicitação neste caso**; descreva a característica e localize a massa na hora.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **VISTO RENDERIZADO** — na grade de *Validação Inicial* do Portal do Comprador estão vivas, hoje, as duas solicitações de homologação deste ticket: **111968 — "SDCASSI-517 - TESTE 2"**, filial 5303 CASSI SEDE, 13/08/2026, Nº Solic ERP 000945, etapa *Validação do Comprador*; e **111951 — "teste SDCASSI-517"**, mesma filial e data, Nº Solic ERP 000942, etapa **Validação Orçamentária**. **LIDO NO HTML DA SC** — o campo existe com o rótulo **exatamente** como o ticket o cita: `data-field-name="tbitorc_vlrTotEstItem"`, `<label>Total Estimado a Aprovar (R$) *</label>`, `placeholder="Total Estimado a Aprovar (R$)"`, `readonly`, obrigatório, tooltip "Valor Total Estimado a Aprovar (R$).". **LIDO NO FONTE PUBLICADO** — e aqui está **a condição que ativa a regra**: em `handleMountObjDTable`, o painel orçamentário só é montado quando `wk_NumState == activitys.validacaoOrcamentaria (14) || wk_NumState == activitys.validacaoOrcamentariaSemGestor (**269**) || wk_ItemPanel == true` (`wk_ItemPanel` vem de `window.WKPanelBudgetItem`). O ramo **269** é o cenário "sem gestor / pool" do ticket: **quem testar apenas na atividade 14 nunca exercita a correção.** Também está no fonte a regra do passo 7: para cada linha de `tbItemOrcamentario`, se o switcher `tbitorc_aprovadoValid___N` **não** está marcado, o código executa `$('input[name=tbitorc_vlrTotEstItem___N]').val("")` — o branco no item reprovado é intencional. A máscara `#.##0,00` é aplicada ao campo e ao seu par somente-leitura (`_tbitorc_vlrTotEstItem___N`).
**Divergências encontradas:** o ticket fala em "etapa do Gestor Orçamentário" como uma coisa só; no ambiente são **duas atividades distintas** — `14 Validação Orçamentária` e `269 Validação Orçamentária (Sem Gestor)` — e o defeito vive **apenas na 269**. Sem essa distinção o caso é executado no ramo errado e "passa" sem ter testado nada. Recomendo acrescentar esse par à tabela de rótulos do briefing, ao lado de `integracaoERP/2/3`.
**Dados/massa usados:** nenhum — não submetido, nenhuma tarefa movimentada. As solicitações 111968 e 111951 foram apenas **lidas na grade**.

---

## CT-FSWTBC-5030  (fluig · Concluído · SDCASSI-514)

**Título:** Abrir uma SC de Aditivo Contratual sobre um contrato com vários itens e confirmar que dá para escolher e editar só o item que será aditivado, antes de enviar para aprovação.

**Origem:** FSWTBC-5030 / SDCASSI-514 — ao abrir SC a partir de contrato na modalidade **Aditivo Contratual** com mais de um item, não era possível editar nem selecionar apenas o item a aditivar: ao clicar em Enviar, a solicitação ia direto para a aprovação do gestor imediato, arrastando **todos** os itens do contrato — o que distorce o objeto do aditivo e o valor levado à alçada. Concluído 19/08/2026, com a observação de que a SC passa a cair na etapa de **Início**, permitindo alteração pelo solicitante. Subtarefas FSWTBC-5090 e 5129.

**Módulo/Rota:** `wf_solicitacao_compras`, etapa **6 - Início** (e **11 - Ajustar Informações**). Painel **"Itens da Solicitação"** (grade `tbProdutos`), com os botões **"Adicionar Produto"**, **"Adicionar Itens"** e a coluna de exclusão da linha.

**Pré-condições**
- Um contrato vigente com **três itens ou mais** — com um item só o defeito é invisível.
- Uma SC aberta a partir desse contrato com **Tipo de Solicitação = Aditivo Contratual**.
- A SC precisa estar na etapa **6 - Início** (é onde a correção a deixou), com o executor como solicitante.
- **Bloqueio:** a abertura de SC vinculada a contrato passa pela ação de aprovação da **Validação Inicial**, que a conta de QA não executa (matrícula de comprador não resolve). Não foi possível gerar uma SC de aditivo real com múltiplos itens.

**Passos**
1. Abrir a SC de Aditivo Contratual gerada a partir do contrato e confirmar que ela está na etapa **6 - Início** (e não já em aprovação do gestor).
2. No painel **"Itens da Solicitação"**, contar as linhas e conferir que correspondem aos itens do contrato.
3. Excluir as linhas dos itens que **não** serão aditivados, usando o controle de exclusão da linha.
4. No item que permanece, alterar **Quantidade** e **"Preço Unit. Estimado"**.
5. Conferir que **"Vlr. Total Estimado"** recalcula sozinho (é campo somente leitura).
6. Abrir **"Adicionar Centro de Custo"** no item restante e conferir que o rateio segue editável.
7. Só então clicar em **Enviar** e conferir para qual etapa a solicitação foi.

**Resultado esperado**
- A SC **para** na etapa **6 - Início** e fica com o solicitante — não salta direto para a aprovação do gestor imediato.
- As linhas de item são **excluíveis** e os campos **Quantidade** e **"Preço Unit. Estimado"** são **editáveis** nessa etapa.
- **"Vlr. Total Estimado"** recalcula a cada alteração e permanece somente leitura.
- Se quantidade × preço resultar em menos de R$ 0,10, aparece a crítica **"O Vlr. Total Estimado não pode ser inferior a R$ 0,10! Por favor ajuste a 'Quantidade' ou o 'Preço Unit. Estimado' para o item N."**
- Após o envio, a SC segue para **7 - Validação do Gestor** carregando **apenas** o item mantido, e o valor levado à alçada reflete só ele.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Ao clicar em **Enviar**, a solicitação ia **direto para a aprovação do gestor imediato**, sem passar por etapa editável, levando **todos** os itens do contrato — sem opção de selecionar ou excluir.

**Severidade:** Alta *(o objeto e o valor do aditivo saem distorcidos, e o valor distorcido é o que define a faixa de alçada)*

**Preparação de massa:** um contrato vigente com **três itens ou mais** e uma SC de **Aditivo Contratual** aberta a partir dele, na etapa **Início**. Exige comprador com matrícula no ERP para a Validação Inicial. **Pendência de regra ainda em aberto no ticket, levantada em 12/08 e nunca respondida:** como serão apresentadas no Fluig as SCs de contratos com **múltiplas planilhas vinculadas** — enquanto não houver resposta, este caso **não cobre** esse cenário e não deve ser declarado como cobrindo.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **LIDO NO FONTE PUBLICADO** — a edição dos itens é liberada exatamente nos estados que o ticket menciona: `handleChanges()` só religa `btnAdicionarProduto`, `btnAdicionarArea`, `btnImportPlanilha`, `handleChangesChild()` e `handleLoadRateio()` quando `wk_NumState == 0 || wk_NumState == activitys.inicio (6) || wk_NumState == activitys.ajustarInformacoes (11)`. Fora desses estados, o mesmo `handleLauncher` executa `$("button#btnAdicionarAnexo, button#btnAdicionarItens, button#btnDownLoadModeloPlanilha, button#btnImportPlanilha").addClass("disabled").prop("disabled", true).hide()` — os botões somem. Na atividade **242 - Áreas para Parecer Técnico** o código chega a remover a coluna de lixeira dos itens (`$(o).find('td.bpm-mobile-trash-column').remove()`), o que confirma que a exclusão de item é privilégio das etapas de edição. A crítica de valor mínimo está literal no fonte: `O Vlr. Total Estimado não pode ser inferior a R$ 0,10!\n Por favor ajuste a "Quantidade" ou o "Preço Unit. Estimado" para o item ${...}`.
**Divergências encontradas:** **a mais grave do lote.** A definição de regra de **12/08** registrada no ticket dizia: *"deverá existir apenas o tipo Revisão Aberta, sem a necessidade de identificar, no momento da abertura, se a solicitação se refere a aditivo ou renovação"*. **No ambiente publicado hoje isso não existe.** O campo `tipoSolicitacao` do formulário da SC é um `<select>` com **exatamente duas** opções — `Aditivo Contratual` e `Nova Contratação` — e o mesmo par aparece no bundle do Portal do Comprador (`tipoSolicitacaoOptions = [{Selecione..}, {Nova Contratação}, {Aditivo Contratual}]`). A string **"Revisão Aberta" não ocorre nenhuma vez** nem no HTML da SC nem nos 844 KB do bundle; **"Renovação" também não**. Ou seja: a simplificação acordada com o cliente **não foi implementada com esse nome**, e o processo segue exigindo a classificação na abertura — justamente o que a definição queria eliminar. Segunda divergência, menor: no formulário da SC o select `_tipoSolicitacao` vem com `disabled="disabled"` — o tipo **não é editável na SC**, é definido no Portal do Comprador; o passo a passo do ticket, que sugere escolha na abertura, não corresponde.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-5034  (fluig · Concluído · SDCASSI-519)

**Título:** Fazer o Gestor Imediato reprovar uma SC e confirmar que o centro de custo informado continua lá quando a solicitação volta para ajuste.

**Origem:** FSWTBC-5034 / SDCASSI-519 — o **Centro de Custo** informado era **apagado** quando a solicitação era reprovada pelo Gestor Imediato e retornava para ajustes do solicitante. O efeito é sorrateiro: o solicitante corrige o que o gestor apontou, reenvia sem perceber que o centro de custo sumiu, e o erro só aparece adiante, na validação orçamentária ou na contabilização. Corrigido 30/07, homologado 10/08/2026. **Sem registro técnico da causa** e sem verificação de quais SCs reprovadas antes da correção seguiram sem centro de custo.

**Módulo/Rota:** `wf_solicitacao_compras` — reprovação em **7 - Validação do Gestor** (switcher `managerAprovadoValidacao`, que assume "Aprovado"/"Reprovado") e retorno para **11 - Ajustar Informações**. Conferência no painel **"Rateio por Centro de Custo — Item N"** do item.

**Pré-condições**
- Uma SC criada pelo executor, com **pelo menos um item rateado em dois centros de custo distintos**, com códigos e percentuais anotados antes do envio.
- Um usuário com perfil de **Gestor Imediato** capaz de reprovar essa SC.
- **Bloqueio:** não há credencial de gestor. A conta de QA tem 10 tarefas na Central, do tipo *Validação do Gestor* e *Correção*, mas **nenhuma** que permita reprovar a própria SC do executor sem envolver outra pessoa. O caso exige **duas** contas.

**Passos**
1. Criar a SC com um item e, em **"Adicionar Centro de Custo"**, distribuir o rateio em **dois** centros de custo. **Anotar código, classe de valor e percentual de cada linha.**
2. Enviar a solicitação (etapa **6 - Início** → **7 - Validação do Gestor**).
3. Com a conta do **Gestor Imediato**, abrir a tarefa, desligar o switcher de aprovação (o campo passa a valer **"Reprovado"**), preencher a justificativa e movimentar.
4. Com a conta do **solicitante**, abrir a tarefa que voltou, em **11 - Ajustar Informações**.
5. Localizar o painel **"Rateio por Centro de Custo — Item 1"**.
6. Conferir **linha a linha** os centros de custo, as classes de valor e os percentuais contra o que foi anotado no passo 1.
7. Alterar um campo qualquer que **não** seja rateio (ex.: a justificativa), reenviar e conferir o rateio de novo na etapa seguinte.

**Resultado esperado**
- Ao reabrir a SC em **11 - Ajustar Informações**, o painel **"Rateio por Centro de Custo"** está **visível e preenchido**.
- Os centros de custo, classes de valor e percentuais são **idênticos** aos informados antes do envio — nenhum campo em branco.
- Os campos permanecem **editáveis** nessa etapa (é onde o solicitante corrige), e o botão **"Adicionar Centro de Custo"** continua disponível.
- Depois do reenvio, o rateio segue íntegro nas etapas seguintes.
- O mesmo vale para itens com **um só** centro de custo.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O **Centro de Custo aparecia apagado** ao retornar da reprovação do Gestor Imediato: o solicitante corrigia o apontamento e reenviava sem notar a perda, e o erro só se revelava na validação orçamentária ou na contabilização.

**Severidade:** Alta *(perda silenciosa de dado contábil no caminho de retorno — mesma família do rateio perdido na integração, SDCASSI-492, e do rateio invisível ao demandante, SDCASSI-505)*

**Preparação de massa:** uma SC do próprio executor com **item rateado em dois centros de custo**, e uma **segunda conta com perfil de Gestor Imediato** para reprovar. Não é executável com um login só. Recomendo, na mesma passada, levantar quantas SCs reprovadas **antes** de 30/07/2026 seguem sem centro de custo — inventário que o ticket registra como nunca feito.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **LIDO NO FONTE PUBLICADO** — encontrei o mecanismo exato de que depende a persistência, e ele é diretamente testável. No retorno à atividade **11 - Ajustar Informações**, `handleView()` **não** chama o caminho de leitura (`handleLoopMountDTable` está sob `wk_NumState != inicio && wk_NumState != ajustarInformacoes`); quem monta o rateio ali é `handleChanges()` → **`handleLoadRateio()`**, e essa função reconstrói a tabela **exclusivamente** a partir do campo oculto `tbprod_jsonrateio___N`, sob a guarda `if (handleHasValue({value: $('[name=tbprod_jsonrateio___N]').val()}))` e, dentro dela, `if (objRateio.length > 0)`. Consequência para o teste: **se `tbprod_jsonrateio` voltar vazio da reprovação, o painel simplesmente não é exibido — sem erro, sem aviso**, que é exatamente o sintoma "sorrateiro" descrito no ticket. Os campos do rateio são `tbRatCC_centroCusto___i_j`, `tbRatCC_codCCusto___i_j`, `tbRatCC_classeValor___i_j`, `tbRatCC_codClasseVlr___i_j` e `tbRatCC_Rateio___i_j`, com o centro de custo resolvido pelo zoom `dsProtheus_getCentroCusto_restGetAll` (`CTT_CUSTO`, `CTT_DESC01`, `CTT_CODDESC`). A reprovação do gestor é o switcher `managerAprovadoValidacao`, que grava o texto **"Aprovado"** ou **"Reprovado"** no campo. Nada disso pôde ser **visto renderizado**: não há tarefa de gestor nem SC própria disponível para esta conta.
**Divergências encontradas:** nenhuma de rótulo. Registro um **ponto de método** relevante: como o painel depende de um campo **oculto** (`tbprod_jsonrateio`), um teste que só olhe "o centro de custo está preenchido?" não distingue *rateio perdido* de *painel não renderizado*. O passo 5 deste caso separa as duas coisas de propósito — primeiro confirmar que o **painel aparece**, depois conferir o **conteúdo**. Registro também um efeito de ambiente: se o Protheus estiver fora, o zoom `dsProtheus_getCentroCusto_restGetAll` não resolve a **descrição** do centro de custo; o **código** continua vindo do formulário. Descrição vazia com código presente é **ambiente**, não perda de dado.
**Dados/massa usados:** nenhum — não submetido, nenhuma reprovação executada.

---

## CT-FSWTBC-5035  (fluig · Concluído · SDCASSI-520)

**Título:** Abrir uma SC na etapa de validação do gestor e confirmar que o nome da filial aparece junto ao código, em vez de vir em branco.

**Origem:** FSWTBC-5035 / SDCASSI-520 — o **nome da filial** não era carregado na tela de validação do gestor, ficando em branco; a identificação da solicitação chegava incompleta ao ponto de decisão e o aprovador precisava deduzir a unidade pelo código. Testado na solicitação 99904, homologado 10/08/2026.

**Módulo/Rota:** `wf_solicitacao_compras`, etapa **7 - Validação do Gestor**. Painel **"Identificação da Entidade / Solicitação"** (`id="panelEntity"` / `collapseEntity`), campo **"Nome da Filial"** (zoom `zoomCodNomeFilial`, obrigatório).

**Pré-condições**
- Uma SC na etapa **7 - Validação do Gestor**, com filial preenchida na abertura.
- Perfil de **gestor** para abrir a tarefa.
- Para o cenário de regressão, uma SC **antiga** (aberta antes da correção) e uma **nova**, já que a correção é um *fallback* em tempo de carga.
- **Bloqueio:** não há credencial de gestor. A Central de Tarefas da conta de QA lista 10 tarefas, entre elas do tipo *Validação do Gestor*, mas nenhuma foi aberta para não movimentar tarefa de terceiro.

**Passos**
1. Abrir a **Central de Tarefas** e localizar uma tarefa de **Validação do Gestor**.
2. Abrir a solicitação e expandir o painel **"Identificação da Entidade / Solicitação"**.
3. Ler o campo **"Nome da Filial"**.
4. Conferir se o valor traz **código e nome** (formato `NNNN - NOME DA FILIAL`).
5. Repetir com uma solicitação de **filial diferente**, para confirmar que não é valor fixo.
6. Repetir com uma solicitação **antiga**, anterior à correção.
7. Sair **sem** aprovar nem reprovar.

**Resultado esperado**
- O campo **"Nome da Filial"** aparece **preenchido**, com **código e nome** — ex.: `5303 - CASSI SEDE`.
- O valor corresponde à filial da solicitação e muda de uma solicitação para outra.
- Solicitações **antigas** também exibem o nome: a correção reconstrói o valor a partir do código e do nome guardados na própria solicitação, e não depende de o campo já ter sido gravado.
- O campo continua marcado como **obrigatório** e a identificação da solicitação fica completa antes da decisão do gestor.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O campo **"Nome da Filial"** vinha **em branco** na tela de validação do gestor; só o código estava disponível, e o aprovador tinha de deduzir a unidade.

**Severidade:** Baixa *(apresentação no ponto de decisão — não altera valor nem alçada, mas degrada a informação de quem aprova)*

**Preparação de massa:** duas SCs em Validação do Gestor, de **filiais diferentes**, mais uma SC **anterior a 30/07/2026** para o passo 6. Exige perfil de gestor. Nenhuma criação de massa nova é necessária além dessas.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **LIDO NO HTML SERVIDO** — o painel existe com o rótulo **"Identificação da Entidade / Solicitação"** (o ticket escreve "Identificacao da entidade/solicitacao" — bate), e dentro dele o campo `zoomCodNomeFilial`, `<label>Nome da Filial *</label>`, `id="nomeFilialZoom"`, obrigatório, do tipo zoom. Existem ainda os campos ocultos `codFilial`, `zoomNomeFilial` e `cgcFilial`. **LIDO NO FONTE PUBLICADO** — a correção é um *fallback* explícito em `loadRequestData(data)`: `that.ZoomHandler.setZoomData('zoomCodNomeFilial', (data.zoomCodNomeFilial) ? data.zoomCodNomeFilial : ('${data.codFilial} - ${data.zoomNomeFilial}'))` — quando o campo consolidado não vem, o valor é remontado a partir do código e do nome. É isso que faz o passo 6 (solicitação antiga) funcionar. **VISTO RENDERIZADO** — não abri o formulário na etapa 7, mas confirmei a informação equivalente na grade de **Validação Inicial** do Portal do Comprador: a coluna **Cod. Filial** traz `5303` e a coluna **Filial** traz **`CASSI SEDE`** preenchida nas 24 linhas, ou seja, o par código/nome está resolvendo hoje.
**Divergências encontradas:** de rótulo, nenhuma — o painel e o campo batem com o ticket. Anoto uma precisão para quem executar: o campo é um **zoom**, não uma caixa de texto; o valor esperado é o **par** `código - nome` num controle único, e não dois campos separados. Um teste que procure um campo "Nome da Filial" contendo **só** o nome vai reprovar por engano.
**Dados/massa usados:** nenhum — não submetido, nenhuma tarefa aberta ou movimentada.

---

## CT-FSWTBC-5058  (fluig · Concluído)

**Título:** Disparar a notificação de resultado de cotação ao fornecedor e conferir se o e-mail chega no layout padrão.

**Origem:** FSWTBC-5058 — **ticket sem descrição**: só o título "Ajuste no Layout do e-mail" (SDCASSI-448). É o segundo dos três ajustes de e-mail feitos em 30/07/2026 para fechar o caso do e-mail duplicado ao fornecedor (FSWTBC-4908). Caso escrito como **caracterização de caminho** (§5-D).

**Módulo/Rota:** `wf_solicitacao_compras`, atividade **185 - Disparo de E-mails** (com **187 - Captura de Erro - Disparo de E-mails** ao lado e **191 - Correção - Disparo de E-mails** no ramo de correção). O corpo do e-mail é servido por **template do lado do servidor**, não pelo front-end.

**Pré-condições**
- Uma solicitação que chegue à atividade **185 - Disparo de E-mails** (ou seja, com cotação e alçada concluídas).
- Um fornecedor de teste com e-mail em caixa **acessível ao executor**.
- Acesso à trilha de envio de e-mails do Fluig, ou perfil de administrador para ler o template em vigor.
- **Bloqueio:** **três, e são estruturais.** (1) Não há credencial de **administrador** — o template de e-mail não é legível por esta conta. (2) Não há acesso a caixa postal de fornecedor. (3) O ticket **não diz qual era o problema de layout nem qual o padrão esperado**, então o critério de aprovação precisa ser definido pelo time **antes** de executar — hoje não há como afirmar objetivamente que o layout "está certo".

**Passos**
1. Levar uma solicitação até a atividade **185 - Disparo de E-mails** (ou usar uma que já tenha passado por lá).
2. Abrir a solicitação e ir à aba **Histórico**.
3. Localizar o registro da atividade **185** e conferir que ela **concluiu**.
4. Conferir que **não** houve entrada em **187 - Captura de Erro - Disparo de E-mails**.
5. Abrir a caixa postal do destinatário e localizar a mensagem.
6. Conferir o **assunto**, a identificação do remetente, e se o corpo traz o número da solicitação, o número da cotação e o link de acesso.
7. Conferir a renderização em cliente de e-mail **e** em webmail, e se caracteres acentuados aparecem corretos.
8. Confirmar que chegou **uma** mensagem por evento, e não duplicada (é o defeito de origem, FSWTBC-4908).

**Resultado esperado**
- A atividade **185** conclui e o **Histórico** registra a passagem, sem entrada em **187**.
- Chega **exatamente uma** mensagem por evento ao destinatário.
- O corpo é renderizado no layout institucional, com o número da solicitação, o número da cotação e o link de acesso legíveis, e sem acentuação corrompida.
- Nenhum marcador de template não substituído (`${...}`, `null`, `undefined`) aparece no corpo ou no assunto.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `<não documentado>` — o ticket não registra o sintoma nem o layout anterior. O contexto do FSWTBC-4908 é e-mail **duplicado** ao fornecedor, e por isso o passo 8 está no caso; mas o problema específico de *layout* que este ticket corrigiu **não está escrito em lugar nenhum**.

**Severidade:** Baixa *(apresentação da comunicação externa; não altera dado nem decisão — mas o destinatário é um fornecedor real, o que eleva o custo reputacional de um erro)*

**Preparação de massa:** uma SC completa que atinja a atividade 185, com **fornecedor de teste cujo e-mail seja uma caixa controlada pelo time** — nunca um endereço de fornecedor real. **Antes de executar, o time precisa fornecer o layout de referência**: sem ele o caso não tem critério de aprovação e não deve ser dado por executado.

**Verificado em tela:** NÃO
**O que foi verificado:** **LIDO NO FONTE PUBLICADO** — confirmei apenas a **âncora de processo**: no `sc_App_ViewHandler.js`, `disparoEmails: 185` está no mapa de atividades, `handleView()` tem o ramo `if (wk_NumState == activitys.disparoEmails)`, e a atividade **191** ("Correção - Disparo de E-mails") está na lista de estados de correção. Nada além disso. **Declaração explícita, como pede o §5-B do briefing: não existe superfície de front-end no Fluig que exponha o corpo ou o layout do e-mail.** O template é artefato de servidor; o front-end da SC e o bundle do Portal do Comprador **não contêm** template, assunto nem corpo de mensagem. O que o Fluig oferece a um não-administrador é apenas a **prova de que a atividade de disparo executou** (Histórico) e a ausência de entrada na atividade de captura de erro. Verificar o layout exige caixa postal e/ou perfil de administrador.
**Divergências encontradas:** nenhuma verificável — não há rótulo de tela a comparar. Registro que **três ajustes de e-mail no mesmo dia (5057/5058/5059) sem um único registro do que foi alterado** deixam esta família sem critério de regressão: hoje é impossível escrever um caso que reprove se o layout voltar ao estado anterior, porque ninguém registrou qual era o estado anterior.
**Dados/massa usados:** nenhum — nenhum e-mail disparado.

---

## CT-FSWTBC-5059  (fluig · Concluído)

**Título:** Conferir que o e-mail do fluxo de compras sai no padrão de formatação, sem campo cru nem marcador de template.

**Origem:** FSWTBC-5059 — **ticket sem descrição**: só o título "Ajustes e verificação na formatação do e-mail que ficou fora do padrão" (SDCASSI-484). Terceiro dos três ajustes de e-mail de 30/07/2026. Caso escrito como **caracterização de caminho** (§5-D). Difere do CT-FSWTBC-5058 no alvo: **5058 = layout** (estrutura visual da mensagem); **5059 = formatação** (como cada valor aparece dentro dela).

**Módulo/Rota:** `wf_solicitacao_compras`, atividade **185 - Disparo de E-mails**; ramo de erro **187**; correção **191**. Template do lado do servidor.

**Pré-condições**
- Uma solicitação que atinja a atividade **185**, com **valores monetários** e **datas** no corpo do e-mail — sem eles não há formatação a verificar.
- Caixa postal de destino acessível.
- **Bloqueio:** os mesmos três do CT-FSWTBC-5058 — sem administrador, sem caixa de fornecedor, e **sem definição do padrão esperado** registrada no ticket.

**Passos**
1. Levar uma solicitação até a atividade **185 - Disparo de E-mails**.
2. Anotar, **no formulário da SC**, os valores que devem aparecer no e-mail: número da solicitação, número da cotação, valores monetários e datas.
3. Abrir a mensagem recebida na caixa de destino.
4. Comparar **cada** valor do e-mail com o anotado no passo 2.
5. Conferir que valores monetários aparecem no padrão brasileiro — separador de milhar, vírgula decimal e duas casas (ex.: `24.480.000,00`, nunca `24480000.00`).
6. Conferir que datas aparecem no padrão `dd/mm/aaaa`, nunca em ISO nem em formato do banco.
7. Conferir que campos vazios aparecem **em branco**, e não como `null`, `undefined` ou `0,00`.
8. Conferir que nenhum marcador de template (`${...}`) sobrou no corpo ou no assunto.

**Resultado esperado**
- Cada valor do e-mail corresponde ao do formulário da SC.
- Valores monetários no padrão brasileiro, com separador de milhar e duas casas.
- Datas em `dd/mm/aaaa`.
- Campo vazio permanece **vazio** — **não** vira `0,00`, `null` nem `undefined`. *(Este critério não é capricho: é exatamente o cuidado que a correção do FSWTBC-5127 tomou na tela de alçada, onde converter vazio em zero faria o campo do aditivo nascer zerado.)*
- Nenhum marcador de template não substituído.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `<não documentado>` — o ticket registra apenas "e-mail fora do padrão", sem exemplo. Por analogia direta com o FSWTBC-5127, do mesmo período e da mesma base, o sintoma típico da família é o valor cru **`24480000.00`** onde deveria estar **`24.480.000,00`** — mas isso é a evidência **daquele** ticket, não deste, e o caso não deve afirmar o contrário.

**Severidade:** Média *(valor monetário sem separador de milhar induz erro de ordem de grandeza em quem lê — e nesta base uma proposta de R$ 244 milhões já atravessou o fluxo, SDCASSI-527)*

**Preparação de massa:** uma SC que chegue à atividade 185 com **valor alto (casa dos milhões)**, **valor com centavos**, **valor zero** e **um campo de valor vazio** — os quatro casos que a correção irmã (FSWTBC-5127) exercitou na tela. Destinatário em caixa controlada pelo time. **O padrão de referência precisa ser fornecido pelo time antes da execução.**

**Verificado em tela:** NÃO
**O que foi verificado:** o mesmo do CT-FSWTBC-5058: apenas a **âncora de processo** no fonte publicado (`disparoEmails: 185`, ramo em `handleView()`, estado de correção `191`). **Declaração explícita (§5-B): não há superfície de front-end no Fluig para o corpo do e-mail** — nem o formulário da SC nem os 844 KB do bundle do Portal do Comprador contêm template, assunto ou corpo de mensagem. O que **pôde** ser lido, e que é a melhor referência disponível para "o padrão" de formatação monetária desta aplicação, é a rotina do próprio formulário: `UtilsHandler.numberToCurrencyFormat` usa `toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})`, e a máscara aplicada aos campos é `#.##0,00`. Se o time quiser um critério objetivo para o e-mail, **esse** é o padrão a espelhar.
**Divergências encontradas:** nenhuma verificável. Vale a mesma observação do caso anterior: sem registro do que foi alterado, esta família de tickets não tem critério de regressão auditável.
**Dados/massa usados:** nenhum — nenhum e-mail disparado.

---

## CT-FSWTBC-5081  (ambos · Concluído · SDCASSI-523)

**Título:** Proposta vencedora reenviada pelo portal mantém o parecer técnico, e a geração da alçada não deixa a SC presa em *Aguarda Geração Alçadas*

**Origem:** FSWTBC-5081 — SC 10420 travada em "Aguarda Geração de Alçada"; na fila ZZY o retorno era `{"result":false,
"statuscode":400,…,"msgerro":"Cotacao sem parecer Tecnico."}`. Causas: (1) o parecer da proposta vencedora era descartado a cada
reenvio pelo portal — passou a ser descartado **só na rejeição**; (2) erro interno não tratado (`variable does not exist NFC on
U_UCOME024 line 40`, thread FILANFC) fazia a fila reprocessar a mesma SC indefinidamente — passou a devolver mensagem tratada.
A SC 10420 precisou de parecer refeito manualmente. Patch SDCASSI-523, PR 72528.

**Módulo/Rota:** `wf_solicitacao_compras` → *Integração com ERP* (177) → **Aguarda Geração Alçadas** (309) → *Alçada foi Gerada?*
→ *Gerar Grid de Alçada* (310) → *Aprovação de Alçadas* (94). Superfícies: aba **Histórico** (comentários de "Administrador
Cassi" na 309), campo **Retorno Integração**, widget **Logs Protheus → Solicitacoes ZZY** (`msgerro`, `Qtd T.Env Fl`); Portal do
Comprador → *Avaliação de Propostas* → coluna **Parecer Téc.**.

**Pré-condições**
- Cotação com parecer técnico emitido para a proposta vencedora; fornecedor com cadastro válido.
- Fornecedor **reenvia** a proposta pelo Portal do Fornecedor (ex.: após normalização de cadastro) — exige credencial de fornecedor.
- **Bloqueio:** credencial de fornecedor e de comprador indisponíveis; Logs ZZY com `genericQuery` 404 hoje. Caso de Fluig com
  bloqueio de perfil/ambiente — o efeito (SC presa em 309, `msgerro`) é observável no Histórico e no widget.

**Passos**
1. Registrar o estado inicial em *Avaliação de Propostas*: **Parecer Téc. = Sim** para a cotação.
2. Com o fornecedor, reenviar a proposta vencedora pelo portal.
3. Voltar a *Avaliação de Propostas* e conferir que **Parecer Téc. continua Sim** (parecer preservado); um fornecedor novo, sem
   parecer, aparece como *Não*.
4. Definir vencedor e acompanhar a SC no Histórico: 177 → 309 → "Alçada foi Gerada? … condição 2" → 310 → 94 em minutos.
5. Em **Logs Protheus → Solicitacoes ZZY**, localizar a SC: `Qtd T.Env Fl` deve ser 1 (sem reprocessamento em laço) e não pode
   haver `msgerro: "Cotacao sem parecer Tecnico."`.
6. Cenário negativo (controle): rejeitar a cotação → *Parecer Téc.* volta a **Não** (só a rejeição descarta).

**Resultado esperado**
- Reenvio de proposta não apaga o parecer; só a rejeição apaga.
- Alçada gerada na primeira passagem; SC não permanece em 309 (`slaStatus` nunca chega a `EXPIRED`).
- Se o ERP recusar, o Histórico/ZZY trazem mensagem tratada (`msgerro` legível), sem repetição infinita (`Qtd T.Env Fl` não cresce).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC parada em *Aguarda Geração Alçadas* por dias, responsável `admin`, ZZY com `"Cotacao sem parecer Tecnico."` ou erro interno
  (`variable does not exist NFC`) e contador de reenvio subindo; `C8_XPARTEC` em branco após reenvio.

**Severidade:** Alta

**Preparação de massa:** cotação com parecer + fornecedor que reenvie a proposta (credencial de fornecedor). Não criar para forçar.
Para observar o sintoma, usar as instâncias vivas em 309.

**Verificado em tela:** PARCIAL
**O que foi verificado:** (a) **agregado por dado** — 309 = **"Aguarda Geração Alçadas"** com **3 instâncias ativas hoje, todas
`EXPIRED` e atribuídas a `admin`**: 112593 (desde 26/08, 13 dias), 108618 (desde 10/08, 29 dias), 107681 (desde 07/08, 32 dias);
nas três, a 309 já havia sido concluída uma vez e reaberta ("Alçada foi Gerada? … condição 1" → volta à 309), ou seja, o
laço de reprocessamento existe no desenho; (b) **visto renderizado** — Histórico da 112593: "Administrador Cassi comentou na
atividade Aguarda Geração Alçadas · Movimentado automaticamente" e "Prazo: Desde 26/08/2026 18:00:00"; formulário com
`docAlcadaGerada = Não`, **Retorno Integração vazio**; (c) `GET /requests/10420/tasks` devolve **0 tasks** — "SC 10420" é
número do ERP, não instância Fluig; (d) Logs Protheus ZZY indisponível hoje (404); (e) a mensagem `Cotacao sem parecer Tecnico.`
não está no fonte do Portal nem da SC — é retorno do ERP (só visível no ZZY/Histórico).
**Divergências encontradas:** o ticket chama a atividade de "Aguarda Geração de Alçada"; o nome real é **Aguarda Geração Alçadas**
(309). O sintoma (SC presa na 309, responsável `admin`, prazo vencido) **está vivo em três instâncias** mesmo após a entrega de
21/08 — e não dá para saber pelo Fluig se a causa é a mesma (ZZY indisponível, *Retorno Integração* vazio na 309). Registrado
na seção final como "reprova hoje, causa não confirmada".
**Dados/massa usados:** leitura de 112593, 108618, 107681, 10420 — nenhum — não submetido.

---

## CT-FSWTBC-5118  (ambos · Concluído · SDCASSI-527)

**Título:** A tarefa *Aprovação de Alçadas* é atribuída exatamente ao aprovador que o Protheus informou (CR_USER), e o grupo de alçadas só entra quando não há aprovador individual válido

**Origem:** FSWTBC-5118 — SC 105487 "não caiu para o gestor" do Manual de Competência. Apurado como **não-defeito**: o Protheus
retornou `CR_USER = 001170` (Daniele Ramos Oliveira), o Fluig atribuiu a ela; a proposta somava R$ 244.000.000,00 (48 itens a
R$ 5.100.000,00) e por isso subiu à Gerente Executiva. Fica a observação de que nada critica a ordem de grandeza do valor.

**Módulo/Rota:** `wf_solicitacao_compras` → *Gerar Grid de Alçada* (310) → **Aprovação de Alçadas** (94). Superfícies: aba
**Histórico** ("Gerar Grid de Alçada movimentou … para a atividade Aprovação de Alçadas"; "Substituto X em nome de Y movimentou a
atividade Aprovação de Alçadas"); formulário → grade **`tbAlcadas`** (aprovadores, *Aprovar? – Linha N*) e painel *Valor da
Compra (R$)*; `GET /requests/{id}/tasks?expand=chosenAssignees`; Tracker → **Aprovadores SC** (`table-sca`).

**Pré-condições**
- SC com alçada gerada (Histórico com 310 → 94).
- Conhecer, pelo time Protheus, o `CR_USER` retornado na SCR para a SC (ou ler o Histórico do processo).
- **Bloqueio:** nenhum para leitura (instâncias vivas: 105487, 112011). Para o cenário de contingência (aprovador inválido) seria
  preciso um `CR_USER` inexistente/inativo no Fluig — massa Protheus.

**Passos**
1. Abrir a SC em modo leitura → **Histórico**: localizar "Gerar Grid de Alçada movimentou a atividade Gerar Grid de Alçada para a
   atividade Aprovação de Alçadas".
2. No formulário, ler a grade **tbAlcadas**: nome/matrícula de cada aprovador por linha e o valor total (*Valor da Compra (R$)*).
3. Via API `tasks?expand=chosenAssignees`, confirmar que a tarefa 94 tem `chosenAssignees` = os usuários da grade e que o
   `assignee` da tarefa ativa é um usuário nominal (não o pool).
4. No Tracker → **Aprovadores SC**, filtrar pelo número da SC e comparar a lista.
5. Cenário de contingência: com uma SC cujo `CR_USER` não exista/esteja inativo, confirmar que a tarefa cai no pool
   `G.P.Requisicao_de_Compras_Validacao_Alcadas`.

**Resultado esperado**
- O(s) responsável(is) pela 94 = aprovador(es) retornado(s) pelo Protheus (`CR_USER`), sem transferência/delegação registrada.
- O grupo `G.P.Requisicao_de_Compras_Validacao_Alcadas` só aparece quando não há aprovador individual válido.
- Histórico, grade `tbAlcadas`, `chosenAssignees` e Tracker mostram a mesma lista.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Não houve defeito. Sintoma que motivou o chamado: aprovador diferente do esperado pelo Manual de Competência — na verdade,
  aprovador correto para o valor de R$ 244 milhões.

**Severidade:** Alta

**Preparação de massa:** nenhuma para a regressão — usar 105487 (em 94 desde 06/08) ou 112011 (2 aprovadores em 94 desde 21/08).

**Verificado em tela:** PARCIAL
**O que foi verificado:** (a) via API, a própria **SC 105487** do ticket: 310 (System:Auto) → **94 com `chosenAssignees =
["daniele.oliveira"]`**, tarefa `NOT_COMPLETED` atribuída a *Daniele Ramos Oliveira* desde 06/08/2026 17:26 (prazo 10/08, hoje
`EXPIRED`) — sem transferência: coincide com o `CR_USER 001170` do ticket; **112011** tem duas tarefas 94 paralelas
(`ca0d37fd…` e `e20ef4c4…`), ambas `EXPIRED`; (b) **visto renderizado** — Histórico da 112855: "Gerar Grid de Alçada movimentou a
atividade Gerar Grid de Alçada para a atividade Aprovação de Alçadas" e "Substituto Geise Campos Silva Matias em nome de Edna
Ribas / em nome de Adelson Viana II movimentou a atividade Aprovação de Alçadas para a atividade Integração com ERP" (dois
aprovadores nominais, aprovação por substituto registrada); (c) **agregado por dado** — 94 = "Aprovação de Alçadas", 84
movimentos, 3 ativas (112011, 111962, 105487); (d) o Tracker abre com os filtros *Identificação do Processo / Solicitante* e
*Informações do Fornecedor*, mas a visão *Aprovadores SC* não foi filtrada nesta rodada; (e) o dataset
`dsProtheus_getAlcadas_restGetAll` (nome suposto) não existe (GET search → 500). Grade `tbAlcadas` não lida.
**Divergências encontradas:** o ticket chama de "gestor" o aprovador de alçada; na tela a etapa é **Aprovação de Alçadas** (94), e
"gestor" no Fluig é a *Validação do Gestor* (7) — etapas distintas. Grafia do ticket "G.P.Requisicao_de_Compras_Validacao_Alcadas":
nome do grupo não confirmado em tela (a conta de QA não lista grupos); os pools observados hoje são
`G.P.Requisicao_de_Compras_Gestor_Imediato`, `..._Validacao_Compradores` e `..._Correcoes`.
**Dados/massa usados:** leitura de 105487, 112011, 112855 — nenhum — não submetido.

---

## CT-FSWTBC-5121  (ambos · Concluído · SDCASSI-529)

**Título:** Finalizar um processo de compras com fornecedor vencedor e conferir que cada fornecedor recebe **um único** e-mail, coerente com o
resultado (vencedor, não vencedor ou resultado misto)

**Origem:** FSWTBC-5121 — fornecedor da SC 106390 recebeu **dois** e-mails de finalização, um de aprovação e outro de reprovação, sendo vencedor
dos itens. Causa: a Service Task **185 (Disparo de E-mails)** identificava vencedores e não vencedores em consultas separadas e a combinação
`C8_XAUDIT`/`C8_XVENC` devolvia o mesmo fornecedor nas duas. Correção: vencedores excluídos do agrupamento do e-mail de não vencedor; resultado
misto não recebe o e-mail genérico de derrota; chave = CNPJ + código + loja (nunca e-mail). Observação lateral nunca tratada: "na aprovação de
alçada os itens aparecem fora da ordem da SC".

**Módulo/Rota:** Fluig → Solicitação de Compras → após *Aprovação de Alçadas (94)* → *Integração com ERP (287)* → *Aguarda Geração do
Pedido/Contrato (323)* → *Pedido/Contrato foi Gerado? (87)* → **Disparo de E-mails (185)** → *Contrato? (339)* → *Fim - Processo de Pagamento de
Compras (115)* · Histórico da solicitação · caixa de e-mail dos fornecedores participantes · Tracker (`PORTAL_TRACKER_COMPRAS_CONTRATOS`) →
visões *Negociação de Cotação de Produtos/Serviços (Detalhado Itens)* e *Aprovadores SC*.

**Pré-condições**
- SC `QA` do executor com cotação/negociação encerradas e **três** fornecedores de teste com caixas de e-mail acessíveis: A vencedor de todos os
  itens, B vencedor de parte (resultado misto), C sem item vencido.
- Alçada aprovada e pedido/contrato gerado no ERP (Histórico com "Pedido/Contrato foi Gerado?").
- **Bloqueio:** a conta de QA não é comprador (Portal do Comprador responde "Comprador não encontrado") nem tem acesso às caixas de e-mail dos
  fornecedores; o e-mail em si não é observável no Fluig. Não movimentar a SC 106390 (finalizada).

**Passos**
1. Levar a SC até *Aprovação de Alçadas* e aprovar (perfil gestor de alçada); aguardar *Aguarda Geração do Pedido/Contrato* concluir.
2. Abrir a SC → aba **Histórico** e localizar a linha "**Disparo de E-mails** Executando atividade de serviço do sistema" com o
   "Integração executada com sucesso - Tempo de Execução N s" logo abaixo.
3. Nas caixas de A, B e C, contar os e-mails recebidos para esta SC e ler o assunto/corpo de cada um.
4. No Tracker, visão *Negociação … (Detalhado Itens)*, filtrar pelo `numProcesso` e anotar item × fornecedor vencedor.
5. (Observação lateral) Na mesma SC, abrir o formulário na etapa *Aprovação de Alçadas* e comparar a ordem das linhas da grade **tbAlcadas** e da
   grade de itens com a ordem em que os itens foram cadastrados na SC (Tracker *Produtos/Rateio SC*).

**Resultado esperado**
- Histórico registra **uma** execução de *Disparo de E-mails* com sucesso.
- A recebe **só** o e-mail de vencedor; C recebe **só** o de não vencedor; B recebe o de vencedor **dos itens que venceu** e **não** recebe o
  genérico de derrota.
- Nenhum fornecedor recebe dois e-mails contraditórios; fornecedores distintos que compartilhem o mesmo endereço continuam sendo tratados
  separadamente (chave CNPJ + código + loja).
- Passo 5: os itens aparecem na mesma ordem da SC.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O vencedor recebe dois e-mails em sequência: um de aprovação e outro de reprovação (prints do ticket, SC 106390).
- Passo 5: itens fora da ordem de abertura da SC (apontamento de 11/08, nunca respondido).

**Severidade:** Alta

**Preparação de massa:** SC `QA` com três fornecedores de teste (vencedor total, misto, perdedor) e caixas de e-mail acessíveis; comprador e
gestor de alçada para concluir o ciclo. Sem isso, o caso só caracteriza o caminho (atividade 185 existe e executa).

**Verificado em tela:** PARCIAL
**O que foi verificado:** Histórico da SC **106390** visto renderizado (15 entradas): "Disparo de E-mails movimentou a atividade Disparo de E-mails
para a atividade Contrato?" e "Disparo de E-mails Executando atividade de serviço do sistema — Integração executada com sucesso - Tempo de Execução
2 s" em 06/08/2026 15:51:05; *Contrato?* decidiu "condição 2" → *Fim - Processo de Pagamento de Compras*. A atividade **185 Disparo de E-mails** e a
**187 Captura de Erro - Disparo de E-mails** constam no mapa de conversão 93→94 gravado no Histórico da 112011. Dataset
`dsProtheus_getCotacaoxProdxGrupProd_restGetAll` (com `C8_XAUDIT`, `C8_MARKAUD`) existe (200). Caixas de e-mail não acessíveis.
**Divergências encontradas:** o ticket chama a etapa de "finalização do processo"; na tela ela é **Disparo de E-mails (185)** seguida de
**Contrato? (339)**. O nome da atividade de alçada é **"Aprovação de Alçadas"** (plural), não "aprovação de alçada".
**Dados/massa usados:** nenhum — não submetido; leitura de 106390.

---

## CT-FSWTBC-5127  (fluig · Concluído · SDCASSI-531 · incidente 823155)

**Título:** Abrir a etapa de Aprovação de Alçada e confirmar que todos os campos de valor aparecem em formato de moeda, com separador de milhar.

**Origem:** FSWTBC-5127 / SDCASSI-531 — a máscara dos campos de valores na etapa de **Aprovação de Alçada** não estava em formato moeda. O exemplo da correção é literal: **`24480000.00` → `24.480.000,00`**. Na tela em que se aprova ou reprova por alçada, valor sem separador de milhar induz erro de ordem de grandeza — e é nesta base que uma proposta de **R$ 244 milhões** atravessou o fluxo (SDCASSI-527). A correção foi restrita à **camada de apresentação**, sem impacto em regras de alçada, cálculos, persistência ou integrações, e **preservou o comportamento dos campos vazios** (para não converter vazio em zero). Concluído 31/08/2026. PR 72301, MUD18285. Subtarefa FSWTBC-5130.

**Módulo/Rota:** `wf_solicitacao_compras`, etapa **94 - Aprovação de Alçadas**. Painel principal de alçada e grade de fornecedores **`tbForneceAlcadas`**.

**Pré-condições**
- Uma SC na etapa **94 - Aprovação de Alçadas**, com a grade de alçadas já gerada (atividade **310 - Gera Grid de Alçadas**).
- Valores que cubram os cinco casos que a correção exercitou: **valor alto** (milhões), **zero**, **centavos**, **campo vazio** e **valor já formatado**.
- Idealmente, uma SC de **aditivo**, para cobrir também os dois campos de contrato.
- Perfil de **aprovador de alçada**.
- **Bloqueio:** não há credencial de aprovador de alçada; a Central de Tarefas da conta de QA lista 10 tarefas e **nenhuma** em alçada. O ciclo até a atividade 94 exige gestor, aprovador orçamentário, comprador com matrícula no ERP e o encerramento de cotação e negociação.

**Passos**
1. Abrir a **Central de Tarefas**, aba de tarefas a concluir, e abrir a solicitação em **Aprovação de Alçadas**.
2. No painel principal, ler os campos **"Valor da Compra (R$)"**, **"Valor do Frete (R$)"** e **"Total a ser Aprovado (R$)"**.
3. Na grade de fornecedores, ler, em cada linha, **"Valor da Compras (R$)"** e **"Valor do Frete (R$)"**.
4. Se a SC for de aditivo, ler também **"Valor Vigente do Contrato (R$)"** e **"Valor Total com Aditivo (Contrato + SC) (R$)"**.
5. Conferir que **todos** exibem separador de milhar (`.`), vírgula decimal e **duas** casas.
6. Localizar um campo de valor **vazio** e confirmar que ele continua **vazio**.
7. Localizar um campo de valor **zero** e confirmar que exibe `0,00`.
8. Clicar dentro de um campo editável, sair sem alterar, e confirmar que o valor **não** muda de formato.
9. Recarregar o formulário e repetir os passos 2–5.
10. Sair **sem** aprovar e **sem** reprovar.

**Resultado esperado**
- Todos os campos de valor da etapa exibem o padrão `#.##0,00` — ex.: **`24.480.000,00`**, nunca `24480000.00`.
- Campo **vazio permanece vazio** — não vira `0,00`. *(É o cuidado explícito da correção: converter vazio em zero faria o campo do aditivo nascer zerado.)*
- Campo com valor **zero** exibe `0,00`.
- Focar e desfocar não reformata nem altera o valor.
- Recarregar mantém o formato.
- Os **valores** e a **faixa de alçada** são idênticos aos de antes da correção — o ajuste é de apresentação e não pode ter mexido em cálculo, persistência ou integração.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Valores exibidos crus na tela de alçada, como **`24480000.00`**, sem separador de milhar — obrigando o aprovador a contar dígitos para saber a ordem de grandeza do que está aprovando.

**Severidade:** Alta *(é a tela em que se aprova por alçada; erro de ordem de grandeza aqui é erro de aprovação — e o contexto do SDCASSI-527, proposta de R$ 244 milhões, mostra que não é hipótese)*

**Preparação de massa:** uma SC na etapa **94** com valores cobrindo **alto / zero / centavos / vazio / já formatado**, mais uma SC de **aditivo** para os dois campos de contrato. Exige o ciclo completo até a alçada e perfil de aprovador. Nada disso é criável pela conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **LIDO NO FONTE PUBLICADO — e o fonte carrega o exemplo do ticket palavra por palavra.** Em `sc_App_ViewHandler.js`, a função `handleMoneyValidAuthority(i, o)` traz os comentários: `//COMMENT NOTE: ** Valor no formato "24.480.000,00" vira "24480000.00" para o Number() **`, `//COMMENT NOTE: ** Entrada vazia ou só com espaço permanece vazia: converter para 0,00 aqui faria o campo do aditivo nascer zerado em vez de em branco **`, `//COMMENT NOTE: ** Formata em pt-BR com duas casas, sem o símbolo da moeda **`, `//COMMENT NOTE: ** trigger('input') removido para não reentrar neste mesmo handler **` e `//COMMENT NOTE: ** Falha de máscara em um campo não pode abortar o .each() dos demais **`. A rotina remove tudo que não seja dígito/vírgula/ponto/sinal, normaliza `24.480.000,00` para `24480000.00`, aplica `toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})` e a máscara `#.##0,00` com `reverse:true`. **A condição de ativação:** `handleMoneyValidAuthority` é chamada de dentro de `handleNumOrderContract()`, que por sua vez é chamada por `handleValidAuthority()` — o ramo que `handleView()` executa nas atividades **94 (Aprovação de Alçadas)**, 104, 317, 323, 332, 117 e 115. **Quem abrir a SC em qualquer outra etapa não exercita esta rotina.** Os **sete** campos cobertos, lidos no HTML com seus rótulos: `authorityVlrTotItens` → **"Valor da Compra (R$)"**; `authorityVlrTotFrete` → **"Valor do Frete (R$)"**; `authorityVlrTotCompra` → **"Total a ser Aprovado (R$)"**; `authorityVlrContratoOriginal` → **"Valor Vigente do Contrato (R$)"**; `authorityVlrTotalComAditivo` → **"Valor Total com Aditivo (Contrato + SC) (R$)"**; e, na grade `tbForneceAlcadas`, `tbfornalc_vlrTotalItens` → **"Valor da Compras (R$)"** e `tbfornalc_vlrTotFrete` → **"Valor do Frete (R$)"**. Não foi possível **ver renderizado**: sem tarefa de alçada nesta conta.
**Divergências encontradas:** **uma, e ela corrige a tabela de rótulos do briefing.** O briefing afirma que `"Valor da Compra (R$)"` → *"o rótulo real é **Valor da Compras (R$)** (com erro de concordância)"*. Medindo no HTML publicado, **isso vale só para o campo da grade** (`tbfornalc_vlrTotalItens`, dentro de `tbForneceAlcadas`). O campo homônimo do **painel principal** (`authorityVlrTotItens`) tem o rótulo **corretamente escrito: "Valor da Compra (R$)"**. Ou seja, os dois rótulos coexistem na **mesma tela**, com grafias diferentes, para conceitos correlatos — o que é, em si, um achado de usabilidade. Um caso que procure "Valor da Compras" no painel principal reprova por engano, e vice-versa. Sugiro corrigir a linha do briefing para *"na grade `tbForneceAlcadas` o rótulo é 'Valor da Compras (R$)'; no painel principal é 'Valor da Compra (R$)'"*.
**Dados/massa usados:** nenhum — não submetido, nenhuma alçada aprovada ou reprovada.

---

## CT-FSWTBC-5146  (fluig · Concluído · SDCASSI-540)

**Título:** Recepcionar uma NF-e no processo RDFC - Compras cuja descrição traga caractere de controle e concluir a criação da Pré-Nota.

**Origem:** FSWTBC-5146 — no processo *RDFC - Recepção de Documentos Fiscais - Compras*, a atividade que cria a Pré-Nota falhou com `String contains control character(#137)` (processo nº 110745). O ticket foi encerrado em 19/08/2026 com resolução **"Não Contratado"** — delimitação de escopo, **sem análise técnica**: o defeito permanece com o time interno da CASSI.

**Módulo/Rota:** Fluig → **Processos → Iniciar Solicitações** → categoria **Compras** → *RDFC - Recepção de Documentos Fiscais - Compras* (`processID = bpm_recepcao_documentos_fiscais_compras`). Acompanhamento pela aba **Histórico** em `/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=<nº>`.

**Pré-condições**
- Usuário pertencente ao **grupo de recepção fiscal** da CASSI (o único que pode iniciar o RDFC-Compras).
- Um documento fiscal cuja carga traga, em pelo menos um campo texto (descrição do produto, observação, dados do emitente), um **byte de controle** — no ticket, o `#137` (0x89, faixa C1). Tipicamente entra por XML de NF-e ou por texto colado de editor externo.
- **Bloqueio:** **SIM — perfil.** A conta `TOTVS-FS` não está nos grupos de recepção fiscal. Verificado hoje: o processo **não aparece** no catálogo de início (categoria **Compras** lista exatamente 6 processos, nenhum deles RDFC) e o início direto é recusado com diálogo **Erro** — *"Usuário TOTVS-FS não possui permissão para iniciar solicitações do processo bpm_recepcao_documentos_fiscais_compras"*. Some-se a isso que **não há massa** com caractere de controle disponível e que **criar** essa massa exige uma NF-e adulterada, o que não se faz na base de homologação.

**Passos**
1. Autenticar com usuário do grupo de recepção fiscal.
2. Ir em **Processos → Iniciar Solicitações**, categoria **Compras**, e abrir **RDFC - Recepção de Documentos Fiscais - Compras**.
3. Recepcionar o documento fiscal preparado (o que contém o byte de controle no campo texto).
4. Avançar o fluxo até a atividade de **criação da Pré-Nota** (atividade de serviço que integra com o ERP).
5. Abrir a solicitação em **Detalhes da Solicitação → aba Histórico** e ler os lançamentos da atividade de serviço.

**Resultado esperado**
- A atividade de criação da Pré-Nota **conclui**, e o Histórico registra a integração bem-sucedida no padrão da plataforma — *"Integração executada com sucesso - Tempo de Execução N s"*.
- O Histórico **não** contém nenhuma linha `Atividade de serviço executada com falha` nem a mensagem `String contains control character(#137)`.
- O caractere de controle é **higienizado antes da serialização** (removido ou substituído), não rejeitado: o documento entra no fluxo e o campo afetado é gravado sem o byte inválido.
- Se a higienização não for possível, a recusa deve ser uma **crítica de negócio legível na tela da atividade**, indicando o campo e a posição do caractere — nunca uma exceção Java crua no Histórico.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A atividade de criação da Pré-Nota falha e o Histórico da solicitação exibe `String contains control character(#137)` (print `110745.png` anexo ao ticket), com o processo travado nessa etapa. É a assinatura de `org.json`/Jackson recusando um byte fora da faixa imprimível ao montar o JSON enviado ao ERP.
- **Este defeito não foi corrigido.** O ticket foi fechado por escopo contratual ("Não Contratado" — *"o processo mencionado está sob responsabilidade do time interno"*), então a falha deve ser considerada **ativa** até que o time interno da CASSI a trate. O caso vale como verificação da correção quando ela vier.

**Severidade:** Alta — a Pré-Nota é a entrada fiscal do documento; travada, a NF não é escriturada e o pagamento ao fornecedor não anda. Há risco fiscal e financeiro, e o dado do documento fica preso no meio do fluxo.

**Preparação de massa:** exige o time interno da CASSI (ou um administrador Fluig): (a) um usuário de teste no grupo de recepção fiscal do RDFC-Compras; (b) um documento fiscal de homologação cujo campo texto contenha deliberadamente o byte `0x89` — o que ninguém consegue montar pela tela, tem de vir por carga de XML ou por gravação direta no formulário. Sem (a) e (b) o caso não é executável. A verificação **negativa** (a higienização passou a existir) pode ser feita de forma mais barata, com o mesmo usuário, colando no campo texto qualquer caractere de controle a partir de um editor externo.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o catálogo **Iniciar Solicitações** abre (título *Cassi - Fluig Plataforma - Iniciar Solicitações*) e, expandida, a categoria **Compras** lista **6** processos — *Cadastro de Fornecedor*, *Cotação de Produtos e Serviços*, *Negociação de Cotação de Produtos e Serviços*, *Solicitação de Compras*, *Parecer Técnico*, *Delegação de Tarefas* — e a categoria **Contratos** lista **2** — *Delegação de Fiscais de Contrato/Serviço* e *Faturamento de Contratos*. **Nenhuma variante de RDFC consta**. Forçando a rota direta `/portal/p/1/pageworkflowview?processID=bpm_recepcao_documentos_fiscais_compras`, a página carrega com o título *Movimentar Solicitação* e as abas *Formulário / Informações / Histórico 0 / Anexos 0*, sobre as quais abre o diálogo **Erro** com o texto literal *"Usuário TOTVS-FS não possui permissão para iniciar solicitações do processo bpm_recepcao_documentos_fiscais_compras"*, o link *Ver detalhes técnicos* e o botão *Ok, entendi*. O mesmo ocorre com `bpm_recepcao_documentos_fiscais_contratos`. A superfície de leitura do defeito — a aba **Histórico** registrando falha de atividade de serviço — foi confirmada em outra instância do mesmo ambiente (SC 112584), onde aparece no formato `Atividade de serviço executada com falha: Tentativa: 3 - Erro java.lang.Exception: …`. A atividade de Pré-Nota do RDFC em si **não** foi aberta.
**Divergências encontradas:** o ticket trata "RDFC - Compras" como um processo único; o ambiente publica **cinco** variantes (`…_compras`, `…_comprador_compras`, `…_demandante_compras`, `…_contratos`, `…_fiscais_contratos`) e é preciso dizer qual. O nome completo na plataforma é **"RDFC - Recepção de Documentos Fiscais - Compras"**, não "processo RDFC - Compras". O ticket também não registra em qual atividade a falha ocorreu — só "criação da Pré-Nota".
**Dados/massa usados:** nenhum — nada foi iniciado; apenas leitura do catálogo e do diálogo de recusa de permissão.

---

## CT-FSWTBC-5174  (ambos · Concluído · SDCASSI-547)

**Título:** Abrir uma SC em *Aprovação de Alçadas* como gestor da alçada e ver a grade de aprovação carregada com a opção **Aprovar?** disponível

**Origem:** FSWTBC-5174 — a opção de aprovação de alçada não carregava: SC 112011 não aparecia para os gestores Adelson e Edna; a 112102 carregou.
Quarto defeito da família (484/489/517): a alçada depende de dados do Protheus (cotações vencedoras, `C8_XAUDIT`/`C8_XVENC`, aprovador `CR_USER`);
quando algo não chega, a opção não aparece, sem mensagem. Corrigido sem registro técnico.

**Módulo/Rota:** Fluig → Solicitação de Compras → *Integração com ERP (177)* → *Aguarda Geração Alçadas (309)* → *Alçada foi Gerada? (225)* →
**Gerar Grid de Alçada (310)** → **Aprovação de Alçadas (94)** → grade **`tbAlcadas`** (campos `tbalcada_nomResponsavel`, `tbalcada_statusValidacao`
= **Aprovar?**, `tbalcada_justificativa`, `tbalcada_historico`) → *Integração com ERP (287)* → *Sol. Aprovado na Alçada? (96)* · Central de Tarefas ·
Tracker → visão **Aprovadores SC** (`table-sca`).

**Pré-condições**
- SC `QA` com negociação finalizada e alçada gerada pelo ERP (Histórico com "Gerar Grid de Alçada … Integração executada com sucesso").
- Executor cadastrado como aprovador de alçada (`CR_USER`) para a filial/valor da SC.
- **Bloqueio:** a conta de QA não é gestor de alçada — a tarefa 94 nunca lhe é atribuída. Não aprovar/movimentar 112011.

**Passos**
1. Como gestor da alçada, abrir a tarefa *Aprovação de Alçadas* na Central de Tarefas.
2. Localizar a grade **tbAlcadas**: sua linha (*Responsável*) e o campo **Aprovar?**.
3. No Tracker → *Aprovadores SC*, filtrar pela SC e listar os aprovadores esperados.
4. Comparar com uma SC de mesmo valor/filial que carregou (controle).
5. Aprovar (ou reprovar com justificativa) e ler no Histórico a passagem por *Integração com ERP (287)*.

**Resultado esperado**
- Passo 2: a grade lista todos os aprovadores do Tracker; **Aprovar?** habilitado na linha do executor; texto "esta atividade requer um consenso
  de: 100%" coerente com o número de aprovadores.
- Se algum dado do ERP faltar, uma **mensagem explícita** no formulário/Histórico — nunca grade vazia silenciosa.
- Passo 5: após todos aprovarem, *Sol. Aprovado na Alçada?* segue para *Aguarda Geração do Pedido/Contrato*.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A opção de aprovação não carrega para os gestores (SC 112011), enquanto outra SC (112102) carrega; sem mensagem.

**Severidade:** Alta

**Preparação de massa:** SC `QA` com alçada gerada; aprovador cadastrado no ERP para o executor.

**Verificado em tela:** PARCIAL
**O que foi verificado:** SC **112011** aberta em modo leitura e Histórico (19 entradas) visto renderizado: "Atividade atual: **Aprovação de Alçadas**
(Em progresso) — esta atividade requer um consenso de: 100% — Número de aprovações insuficiente para gerar percentual de consenso — Ver detalhes";
duas tarefas abertas (Adelson / Edna) desde 21/08 19:31, após um **segundo** ciclo de alçada (*Validação do Comprador (Alçadas)* → *Enviar para* →
*Aguarda Geração Alçadas*); conversão 93→94 em 21/08. SC **112102** em *Aguarda Vigência do Contrato* desde 21/08 (alçada aprovada em 20/08 por
Daniele). Grade `tbAlcadas`/rótulo **Aprovar?** (`tbalcada_statusValidacao`) lidos no fonte publicado. Tela do gestor não aberta (sem perfil).
**Divergências encontradas:** a **112011 continua em Aprovação de Alçadas há 18 dias** com as mesmas duas pessoas — o ticket dá o caso como
homologado em 25/08, mas a instância não avançou (pode ser apenas falta de ação dos aprovadores; não é possível distinguir sem o perfil). O
formulário tem **quatro** campos "Aprovar?" (`tbmanag_`, `tbitorc_`, `tbalcada_`, `tbForneceAlcadas`); o caso refere-se ao da grade **tbAlcadas**.
**Dados/massa usados:** nenhum — não submetido; leitura de 112011 e 112102.

---

## CT-FSWTBC-5234  (fluig · Concluído · SDCASSI-559)

**Título:** Cancelar uma Solicitação de Compras parada em Aprovação de Alçadas, informando a justificativa.

**Origem:** FSWTBC-5234 — o cancelamento da SC 112659 falhou com `Cannot read property "0" from null`. É o décimo primeiro defeito de cancelamento desta base; a mensagem é a assinatura de acesso a posição de estrutura nula sem guarda, no script server-side. Concluído/Feito em 28/08/2026, sem causa raiz registrada.

**Módulo/Rota:** Fluig → **Central de Tarefas** → *Solicitação de Compras* → tarefa na etapa **Aprovação de Alçadas** (atividade 94) ou **Validação Comprador (Análise pós Alçadas)** (atividade 210) → combo **Enviar para \*** → opção **Cancelar Solicitação** + campo **Justificativa \*** → **Movimentar**. Leitura do resultado em **Detalhes da Solicitação → aba Histórico**.

**Pré-condições**
- Uma SC **do próprio executor**, viva, posicionada numa etapa que ofereça o cancelamento — na 112659 o cancelamento partiu de **Aprovação de Alçadas**.
- Perfil de **comprador/gestor** com a tarefa em mãos (a etapa exige consenso de 100%).
- **Bloqueio:** **SIM — duplo.** (a) A conta `TOTVS-FS` **não resolve matrícula de comprador** (`dsProtheus_getCompradores_restGetAll` é chamado com `Y1_USER = "undefined"`), o que fecha a família cotação/alçada para este login; a própria 112659 responde *"Você não possui permissão para adicionar complementos nessa solicitação."* (b) A regra do briefing proíbe cancelar registro pré-existente para reproduzir — e **não** cancelei nada. O que se verificou foi o **estado final** da SC do ticket.

**Passos**
1. Autenticar com o perfil que detém a tarefa da SC-alvo.
2. Abrir **Central de Tarefas**, clicando **explicitamente** na sub-aba desejada (o Fluig guarda a sub-aba por sessão no servidor), e abrir a tarefa da SC.
3. No painel de tratativa, selecionar no combo **Enviar para \*** a opção **Cancelar Solicitação** — as demais opções do mesmo combo são *Retornar para Alçada - (Regerar Documento)*, *Retornar para Alçada - (Novo Fornecedor)*, *Retornar para Cotação* e *Retornar para Negociação*.
4. Preencher **Justificativa \*** com um texto de até 400 caracteres (prefixo `QA`).
5. Acionar **Movimentar** e confirmar.
6. Reabrir a solicitação em **Detalhes da Solicitação** e conferir a **Atividade atual** e a aba **Histórico**.

**Resultado esperado**
- O cancelamento conclui **sem diálogo de erro técnico**. Em particular, **não** aparece o diálogo **Erro** com `Cannot read property "0" from null` nem o link *Ver detalhes técnicos*.
- A **Atividade atual** da solicitação passa a **"Solicitação cancelada"**.
- O **Histórico** ganha a linha de cancelamento no formato da plataforma, com autor e justificativa — como se lê hoje na 112659: *`Processo cancelado por: Gestor Usuário Integrador Fluig - Processo cancelado por "<nome>" - Justificativa: "<texto informado>"`*.
- **Justificativa \*** é obrigatória: tentar cancelar sem preenchê-la é recusado em tela.
- O cancelamento é **idempotente na estrutura**: uma SC sem grade de alçada preenchida, sem fornecedor definido ou sem rateio **também** cancela — dado ausente não pode virar exceção técnica. Se houver impedimento de negócio, ele deve vir como crítica legível, não como erro de script.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Ao movimentar com **Enviar para = Cancelar Solicitação**, o Fluig devolve o diálogo **Erro** com `Cannot read property "0" from null` (mensagem do motor JS **server-side** do Fluig — a sintaxe é do Rhino, não do navegador, o que localiza a falha no evento/serviço do workflow, não na tela). A SC permanece na etapa em que estava, sem cancelar.
- Mesma família do SDCASSI-556 (`JSON.parse` sobre campo de rateio vazio) e do SDCASSI-506 (variável fora de escopo no bloco de exceção): o script assume estrutura preenchida e quebra quando ela vem nula.

**Severidade:** Média — não há perda nem risco financeiro direto, mas a solicitação fica presa: não anda e não encerra, e o usuário recebe um erro técnico opaco. Sobe para Alta se a SC travada já tiver consumido alçadas.

**Preparação de massa:** uma SC **criada pelo próprio executor**, levada até **Aprovação de Alçadas** (o que exige cotação e geração da grade de alçada), com perfil de comprador que detenha a tarefa. Para exercitar a variante que provoca o defeito, é preciso ainda uma SC cuja estrutura auxiliar esteja **vazia** — sem linha na grade de alçada, ou sem rateio, ou sem fornecedor definido —, que é justamente o estado que fazia o script quebrar. Nada disso é gerável pela conta de QA: cabe a um comprador da CASSI.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri a SC **112659** — a exata do ticket — em modo detalhes, **sem executar nenhuma ação**. Hoje ela está com **Atividade atual: "Solicitação cancelada"**, aba **Histórico** com 13 lançamentos, e a linha de cancelamento diz textualmente: *`27/08/2026 14:59:02 — Processo cancelado por: Gestor Usuário Integrador Fluig - Processo cancelado por "Arthur de Almeida Santos" - Justificativa: "Aguardando ajuste do SDCASSI-558"`*. O lançamento imediatamente anterior mostra que ela estava em **Aprovação de Alçadas** (movida de *Gerar Grid de Alçada* às 14:16:13), e a etapa exibe *"esta atividade requer um consenso de: 100%"* e *"Número de aprovações insuficiente para gerar percentual de consenso"*. Não há, no histórico visível, qualquer vestígio de `Cannot read property "0" from null` — o cancelamento efetivamente concluiu. A superfície do cancelamento foi confirmada no **fonte publicado** do formulário (256831): `select#buyerEnviarParaTreat`, rótulo **"Enviar para \*"** (`data-required="true"`), com as cinco opções listadas nos passos, das quais `CancelarSolicitacao` → **"Cancelar Solicitação"**; e `textarea#buyerJustificativaTreat`, rótulo **"Justificativa \*"**, `maxlength="400"`. O `ViewHandler` reage à escolha de `CancelarSolicitacao` alternando a marcação de obrigatoriedade da Justificativa. **Nenhum cancelamento foi executado.**
**Divergências encontradas:** o ticket fala em "cancelar a SC" como se fosse uma ação única; no Fluig há **pelo menos duas superfícies distintas** — o combo **Enviar para → Cancelar Solicitação** no formulário da SC (etapas 94/210) e a ação de linha **Cancelar Solicitação** no *Portal do Comprador → Controle de Cotações* —, e o ticket não diz por qual passou. O rótulo do combo é **"Enviar para"**, não "Direcionar Processo para". A justificativa que ficou registrada na 112659 (*"Aguardando ajuste do SDCASSI-558"*) aponta para **outro** ticket, sinal de que o cancelamento bem-sucedido de 27/08 pode ter sido posterior à falha relatada, no mesmo dia.
**Dados/massa usados:** nenhum — leitura da instância 112659 em modo detalhes e do formulário publicado. Nada foi movimentado.

---

## CT-FSWTBC-5262  (fluig · Em Execução (Desenvolvimento) · SDCASSI-564)

**Título:** Anexar documentação (pública, restrita e por item) a uma Solicitação de Compras.

**Origem:** FSWTBC-5262 — "Erro ao inserir anexo na SC", relatado nos ambientes **QA** e **TST**, incidente 826203. **É o ticket mais recente do conjunto e continua ABERTO** (aberto e em execução em 03/09/2026), **sem comentários e sem evidência anexada**: o ticket traz apenas o título, sem passo a passo, sem mensagem de erro e sem indicação de qual dos botões de anexo falha. O caso abaixo é, por isso, uma **caracterização de caminho** — percorre a funcionalidade citada no título e afirma o comportamento observável hoje. Anexo na SC tem histórico: FSWTBC-3062 desenvolveu a busca de anexos em out/2025.

**Módulo/Rota:** Fluig → **Processos → Iniciar Solicitações → Compras → Solicitação de Compras** (`processID = wf_solicitacao_compras`). Três pontos de anexo: no cabeçalho, ao lado de **Justificativa para a Solicitação**, os botões **Anexar documentação Pública** e **Anexar documentação Restrita CASSI**; dentro de cada item da grade **Produtos/Serviços da Solicitação**, o botão **Anexar especificações do Produto**. O destino é a aba **Anexos** da própria solicitação.

**Pré-condições**
- Perfil que inicia *Solicitação de Compras* — a conta `TOTVS-FS` tem.
- Para o anexo **por item**: a linha do item já criada (**Adicionar Produto**) **e com Produto/Serviço selecionado** pelo zoom.
- Um arquivo local pequeno para enviar.
- **Bloqueio:** **parcial.** Todo o caminho até o seletor de arquivo foi percorrido e as validações foram exercitadas. O **envio do arquivo em si não foi executado**, por dois motivos: (a) a regra de não escrever na base sem necessidade; (b) o anexo **por item** exige um Produto/Serviço vindo do zoom do ERP, e a conta de QA não resolve o cadastro de comprador no Protheus. O ticket também não diz **qual** dos três botões falha, nem com qual mensagem — sem isso, o cenário exato do defeito não é reconstituível.

**Passos**
1. Abrir **Processos → Iniciar Solicitações → Compras → Solicitação de Compras**.
2. **Anexo público:** acionar **Anexar documentação Pública**. Abre o diálogo **"Informe o nome do arquivo"**, com um campo de texto e os botões **Selecionar anexo** e **Cancelar**.
3. Confirmar em **Selecionar anexo** com o campo **vazio**.
4. Repetir, agora informando um nome (prefixo `QA`), confirmar em **Selecionar anexo**, escolher o arquivo e conferir a aba **Anexos**.
5. **Anexo restrito:** repetir 2–4 com **Anexar documentação Restrita CASSI**.
6. **Anexo por item:** acionar **Adicionar Produto**; **sem** escolher Produto/Serviço, clicar em **Anexar especificações do Produto**.
7. Selecionar um **Produto/Serviço** válido no item e repetir o passo 6, escolhendo o arquivo.
8. Abrir a aba **Anexos** da solicitação e conferir a lista.

**Resultado esperado**
- Os **três** botões de anexo existem, estão habilitados nas etapas em que a edição é permitida, e cada um abre o diálogo **"Informe o nome do arquivo"** com os botões **Selecionar anexo** e **Cancelar**.
- Confirmar com o nome **vazio** é recusado com a crítica literal **"Não foi informado nenhum nome para o arquivo."** — e **nenhum** seletor de arquivo é aberto.
- Informando o nome, o Fluig ativa a aba **Anexos** e abre o seletor de arquivo; escolhido o arquivo, ele passa a constar da lista de anexos e o contador da aba **Anexos** incrementa.
- A descrição do anexo nasce padronizada, conforme o botão usado: **`PUBLICA - Documentação - <nome>`**, **`RESTRITO-CASSI - Documentação - <nome>`** ou **`Item <nº> - Produto Cód: <código> - Desc: <descrição>`**.
- Clicar em **Anexar especificações do Produto** num item **sem** Produto/Serviço é recusado com uma crítica que **identifica o item pelo número** — hoje ela **não** identifica (ver Divergências).
- Nenhum erro de console e nenhuma resposta HTTP ≥ 400 relacionada ao upload durante a operação.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `<não documentado>` — o ticket registra apenas *"Erro ao inserir anexo na SC (ambientes QA e TST)"*, **sem mensagem, sem print e sem passo a passo**. Não há como citar o sintoma exato.
- **O defeito está ABERTO hoje** (Em Execução / Desenvolvimento, 03/09/2026): ao executar este caso, o passo 4 ou o 7 **pode falhar**. Se falhar, registrar a mensagem literal e **em qual dos três botões** — é precisamente o que falta ao ticket.
- Pelo caminho que o código percorre, os pontos de quebra prováveis são: o diálogo não abrir; a aba **Anexos** não ser ativada; o seletor de arquivo não abrir; ou o arquivo ser escolhido e não aparecer na lista.

**Severidade:** Média — o anexo é a instrução documental da compra (especificação técnica, cotação de referência, documentação restrita). Sem ele a SC segue incompleta e volta em **Correção**, o que bloqueia o fluxo. Sobe para **Alta** se o arquivo for aceito na tela e **não** persistir, porque aí há perda de dado silenciosa — cenário a testar explicitamente no passo 8.

**Preparação de massa:** nada precisa ser criado para os passos 1–6 (basta o formulário de início e um arquivo local). Para o passo 7 é preciso um **Produto/Serviço resolvível no zoom do ERP**, o que a conta de QA não alcança — depende de um comprador da CASSI ou do cadastro da matrícula de comprador para o usuário de teste. Para verificar a **persistência** do anexo (passo 8 após o envio), é preciso concluir e enviar uma SC de teste, o que só deve ser feito com prefixo `QA` e por quem possa depois cancelá-la.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de início da SC abre e os **três** botões de anexo existem, com estes rótulos exatos: **"Anexar documentação Pública"** (`.btnAdicionarAnexoPublico`, visível e habilitada), **"Anexar documentação Restrita CASSI"** (`.btnAdicionarAnexoRestrito`, visível e habilitada) e **"Anexar especificações do Produto"** (`#btnAdicionarAnexo`, oculta até que **Adicionar Produto** crie a linha do item). Cliquei em **Anexar documentação Pública** e o diálogo abriu com o título **"Informe o nome do arquivo"**, um campo de texto e os botões **"Cancelar"** e **"Selecionar anexo"**. Confirmando com o campo **vazio**, veio a crítica literal **"Erro: Não foi informado nenhum nome para o arquivo. OK"**. Em seguida, com a linha do item criada e **sem** Produto/Serviço, cliquei em **Anexar especificações do Produto** e veio **"Erro: Não foi informado nenhum Produto/Serviço para o item undefined. Por favor, tente novamente."**. Inspecionei também a mecânica: no frame do formulário, `JSInterface.showCamera(<descrição>)` localiza `tab-attachments` no documento pai, ativa a aba **Anexos** e dispara o `input[type=file]#ecm-navigation-inputFile-clone` do topo com a descrição pré-montada — e confirmei no topo a existência da aba **"Anexos 0"**, dos botões **Adicionar** e **Enviar** e do próprio `input[type=file]#ecm-navigation-inputFile-clone`. As descrições padronizadas (`PUBLICA - Documentação - `, `RESTRITO-CASSI - Documentação - `, `Item <n> - Produto Cód: … - Desc: …`) foram lidas no fonte publicado. **Nenhum arquivo foi enviado** e nenhuma solicitação foi submetida. Os únicos erros de rede na sessão foram `403` em `/nps/api/v1/surveys` e `404` em `/portal/api/servlet/image/1/custom/logo_image.png` — ambos alheios ao anexo.
**Divergências encontradas:** **três.** (1) O ticket fala em "anexo" no **singular**; são **três botões** com destinos e nomenclaturas diferentes (público, restrito CASSI e por item), e o ticket não diz qual falha — informação que precisa ser cobrada antes de fechar o defeito. (2) **Defeito novo, observado hoje:** a crítica do anexo por item sai como *"…para o item **undefined**"* em vez do número do item (`0001`). No fonte publicado (`App/ViewHandler.js`, método `handleShowCamera`) a variável `item` só é atribuída **dentro** do ramo de sucesso, mas é usada na mensagem do ramo de erro — por isso chega `undefined`. É defeito de mensagem, independente do FSWTBC-5262, e vale ticket próprio. (3) O botão vizinho de anexo por item chama-se **"Adicionar Centro de Custo"** (`#btnAdicionarItens`) — nome que não corresponde a "adicionar item", e o botão que de fato cria a linha do item é **"Adicionar Produto"** (`#btnAdicionarProduto`); quem escrever passo a passo por aí erra o alvo.
**Dados/massa usados:** nenhum — formulário de início preenchido em memória e descartado; nenhum arquivo enviado; nenhuma solicitação submetida.
