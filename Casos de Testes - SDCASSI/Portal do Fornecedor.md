<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# Portal do Fornecedor

Casos de teste E2E do Fluig — módulo Portal do Fornecedor.

| | |
|---|---|
| Casos neste arquivo | 24 |
| Verificados em tela | 0 total · 23 parcial · 1 não |

> **Como ler.** Cada caso descreve o comportamento **correto esperado hoje**. A maioria dos
> defeitos de origem já foi corrigida — o caso é de regressão: se reprovar, o defeito voltou.
> Os que reprovam hoje por causa nunca corrigida estão marcados no próprio caso.
> *Verificado em tela* diz o que foi conferido no ambiente de homologação em 08/09/2026;
> **PARCIAL** costuma significar que a conta de QA não tem o perfil necessário (comprador,
> gestor, fiscal, fornecedor), não que o caso seja inválido.

---

## CT-FSWTBC-617  (sem SDCASSI · fluig · Concluído)

**Título:** Fornecedor atualiza a proposta de uma cotação já enviada e o sistema grava a nova versão sem erro.

**Origem:** FSWTBC-617 — "[DEM10009644] Erro na atualização de proposta de cotação". Bug de
janeiro/2025 sem descrição registrada; trata da atualização da proposta pelo fornecedor no Portal
do Fornecedor.

**Módulo/Rota:** Portal do Fornecedor (`/portal/p/1/portal_fornecedor`) → **Acesso Normal** → cotações
do fornecedor. Contraparte interna: Portal do Comprador (`/portal/p/1/portal-do-comprador`) →
**Avaliação de Propostas**; e o processo *Cotação de Produtos/Serviços* (`wf_cotacao_produtos_servicos`).

**Pré-condições**
- Cotação gerada a partir de uma SC e enviada ao fornecedor, dentro da *Validade da Cotação*.
- Proposta já registrada uma primeira vez pelo fornecedor (a atualização pressupõe versão anterior).
- Credencial de fornecedor: **CNPJ da empresa + CPF do usuário + senha** (tela "Acesso Normal").
- **Bloqueio:** **sim** — não há credencial de fornecedor disponível. A tela de acesso foi aberta e os
  três campos confirmados, mas a jornada do fornecedor não é executável com a conta de QA
  (limite conhecido e declarado do projeto).

**Passos**
1. Abrir `/portal/p/1/portal_fornecedor` e clicar em **Acesso Normal**.
2. Informar **CNPJ da empresa**, **CPF do usuário** e **Senha**; clicar **Entrar**.
3. Localizar a cotação pendente e abrir a proposta já enviada.
4. Alterar valor/quantidade de ao menos um item e reenviar a proposta.
5. Com o comprador, abrir Portal do Comprador → **Avaliação de Propostas** e localizar a cotação.
6. Na SC de origem, conferir a grade da seção **Validação do Comprador (Definir Negociação)**.

**Resultado esperado**
- A atualização é aceita e a proposta passa a uma nova **Versão** (coluna *Versão \** da grade `tbProposta`).
- A grade da SC exibe as colunas **Proposta \***, **Versão \***, **Fornecedor \***, **Situação Par. Area Dem. \***,
  **Situação Par. Areas \*** e **Enviar para Negociação? \*** com a proposta atualizada.
- Os totais do formulário de cotação (**Sub Total**, **Valor total do IPI**, **Valor total do Frete**,
  **Valor total de Descontos**, **Valor total do Pedido**) refletem os novos valores.
- Nenhuma mensagem de erro; a instância de cotação **não** retorna à etapa **Correção**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro na gravação da atualização da proposta; a nova versão não é registrada. Mensagem exata
  `<não documentado>` — o ticket não guarda descrição nem evidência.
- Sintoma observável hoje como pista: instâncias de *COTAÇÃO DE PRODUTOS E SERVIÇOS* paradas na
  etapa **Correção** (há três na base: 112113, 112311, 112312).

**Verificado em tela:** PARCIAL
**O que foi verificado:** Portal do Fornecedor abre com heading *Bem vindo ao Portal de Compras e
Contratações!* e os botões *Acesso Normal*, *Acesso Administrador*, *Acesso via Representatividade*;
o **Acesso Normal** leva ao formulário *"Informe o CNPJ da empresa, CPF do usuário e senha."* com os
campos `txt_cnpj` (**CNPJ da empresa:**), `txt_login` (**CPF do usuário:**), `txt_senha` (**Senha:**) e
botão **Entrar**. Portal do Comprador abre com heading *Acesso Rápido* e os quatro itens *Validação
Inicial*, *Controle De Cotações*, *Avaliação de Propostas*, *Definir Vencedor Cotação*. O formulário
*Cotação de Produtos/Serviços* (iframe `256834`) foi inspecionado: seções *Informações do Fornecedor*,
*Endereço*, *Contatos*, *Lista de Produtos/Serviços*, *Informações p/ Parecer Técnico*, *Verificar Erro*.
Na Central de Tarefas há 3 cotações na etapa **Correção**.
**Divergências encontradas:** os quatro itens do *Acesso Rápido* do Portal do Comprador não são
clicáveis por texto (não expõem nome acessível — mesmo padrão dos ícones da coluna "Ação" já mapeado).
No formulário de cotação, **CNPJ/CPF**, **Validade da Cotação** e **Validade da Proposta** são
`readonly` e não há busca de fornecedor por essa rota.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-644  (fluig · Concluído)

**Título:** Fornecedor tenta enviar proposta com valor zerado no Portal do Fornecedor e o portal recusa antes de chamar o ERP.

**Origem:** FSWTBC-644 — "[DEM10009644] Portal de fornecedores não pode enviar proposta zerada para o
ERP, pois para inclusão de novas propostas o sistema valida a atualização da proposta ativa. Creio que
precisa de uma melhoria para inibir este envio." Proposta com valor zero quebra a integração; a
melhoria é uma validação de domínio no portal externo.

**Módulo/Rota:** **Portal do Fornecedor** (`/portal/p/1/portal_fornecedor`) → **Acesso Normal** →
cotação pendente → envio de proposta. Contraparte interna: *Negociação de Cotação de
Produtos/Serviços* (seção **Lista de Produtos/Serviços** e os totais) e **Portal do Comprador** →
*Avaliação de Propostas*.

**Pré-condições**
- Cotação enviada ao fornecedor, dentro da **Validade da Cotação**.
- Credencial de fornecedor: **CNPJ da empresa + CPF do usuário + senha**.
- **Bloqueio:** **sim** — não há credencial de fornecedor disponível (limite declarado do projeto). A
  tela de acesso foi aberta e confirmada, mas a jornada do fornecedor não é executável.

**Passos**
1. Abrir `/portal/p/1/portal_fornecedor` e clicar em **Acesso Normal**.
2. Informar **CNPJ da empresa**, **CPF do usuário** e **Senha**; **Entrar**.
3. Abrir a cotação pendente e a tela de envio de proposta.
4. Informar **0** (ou deixar em branco) no valor unitário/total de ao menos um item.
5. Acionar o envio da proposta.
6. Repetir com um item com valor válido e outro zerado (proposta parcialmente zerada).
7. Do lado interno, conferir no Fluig se alguma proposta foi criada.

**Resultado esperado**
- O portal **recusa o envio** e exibe crítica identificando o item com valor inválido, **antes** de
  chamar a API do ERP.
- Nenhuma proposta é criada: não surge nova **Versão** na grade de propostas da SC/negociação, e os
  totais (**Sub Total**, **Valor total do Pedido**) não são alterados.
- A regra vale também para a **proposta parcialmente zerada** — basta um item zerado para recusar.
- Nenhum erro de integração aparece no Fluig (nem no campo *Erro retornado pelo ERP Protheus*, nem
  no Histórico da negociação): o envio nunca chegou ao ERP.

**Resultado se o defeito reincidir**
- O portal aceita a proposta zerada e a envia ao ERP; a integração falha (o Protheus valida a
  atualização da proposta ativa na inclusão de novas propostas), deixando a cotação em estado
  inconsistente. Mensagem exata `<não documentado>` — o ticket descreve a regra, não o erro.

**Severidade:** Alta *(proposta com valor zero chegando ao ERP tem efeito financeiro e quebra a
integração de cotação)*

**Preparação de massa:** uma cotação viva enviada a um fornecedor de teste **e** a credencial desse
fornecedor (CNPJ + CPF + senha), fornecida por quem administra o Portal do Fornecedor. Sem essa
credencial o caso não é executável — é o que falta hoje.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o Portal do Fornecedor abre (título *Cassi - Fluig Plataforma - Portal do
Fornecedor*, carga de 46 s) com o heading *Bem vindo ao Portal de Compras e Contratações!*, o texto
*"Selecione o tipo de acesso."* e os três botões **Acesso Normal**, **Acesso Administrador** e
**Acesso via Representatividade**, com a descrição do *Acesso Básico* citando explicitamente
*"envio de cotações, envio de negociações e envio de notas"*. A tela exige sessão da plataforma
(anônimo cai no Login). Do lado interno, os totais que a proposta alimenta foram confirmados no
formulário de Negociação (`256835`): **Sub Total**, **Valor total do IPI**, **Valor total do Frete**,
**Valor total de Descontos**, **Valor total do Pedido** — todos `readonly`.
**Divergências encontradas:** na carga do portal, a chamada
`PUT/GET /cassi_rest/api/rest/cassi/compras/1/verifyAutenticateToken` responde **401** para a sessão
da plataforma — o portal tem autenticação própria, o que confirma que a jornada do fornecedor não é
alcançável por herança de sessão. Também há um 404 em
`/ly_portal_fornecedor/resources/js/wcm_widgets_pt_BR.js`.
**Dados/massa usados:** nenhum — não submetido; nenhuma tentativa de login de fornecedor.

---

## CT-FSWTBC-645  (FSWTBC-645 · ambos · Concluído)

**Título:** Cancelar uma cotação no Protheus e confirmar que o fornecedor deixa de conseguir enviar negociação para ela no portal.

**Origem:** FSWTBC-645 (chamado 747347) — cotação cancelada no Protheus permitiu que o fornecedor
enviasse negociação (processo nº 5493). Falha de sincronismo de estado: o cancelamento no ERP não se
propaga ao portal e o fornecedor continua atuando sobre cotação morta. Mesma classe do 4624 (exclusão
no Fluig não propaga ao Protheus) — a sincronização falha nas duas direções.

**Módulo/Rota:** Protheus (cancelamento da cotação) × Fluig → **Portal do Fornecedor**
(`/portal/p/1/portal_fornecedor`) → *Acesso Normal*; e **Portal do Comprador** → *Controle De Cotações*.

**Pré-condições**
- Cotação ativa no Protheus, publicada ao fornecedor, com prazo de proposta aberto.
- Credencial de **fornecedor** para o Portal do Fornecedor.
- Credencial de **Protheus** para efetuar o cancelamento da cotação.
- **Bloqueio:** total para execução nesta rodada. Faltam **as duas** credenciais: (1) Protheus, para
  cancelar a cotação — e o briefing proíbe cancelar registro pré-existente para "reproduzir";
  (2) **fornecedor**, para tentar o envio da negociação. A conta de QA é de Compras/Contratos e, no
  Portal do Comprador, não resolve matrícula de comprador. O caso fica escrito como regressão para o
  time que dispõe dos dois acessos.

**Passos**
1. No Protheus, **cancelar** a cotação de teste (nunca uma cotação real de produção).
2. Aguardar o intervalo de sincronização acordado entre ERP e portal.
3. Autenticar no **Portal do Fornecedor** com o login do fornecedor participante e escolher **Acesso Normal**.
4. Localizar a cotação cancelada na lista do fornecedor.
5. Tentar abrir a cotação e **enviar uma negociação/proposta** para ela.
6. No **Portal do Comprador → Controle De Cotações**, filtrar a mesma cotação e conferir a situação exibida.

**Resultado esperado**
- A cotação cancelada **não** é oferecida ao fornecedor para envio de negociação: ou não aparece na
  lista de cotações abertas, ou aparece com situação *cancelada* e sem ação de envio.
- Qualquer tentativa de envio é recusada com mensagem explícita de que a cotação não está mais ativa.
- Nenhum processo de **Negociação de Cotação de Produtos e Serviços** é criado a partir dessa cotação.
- No **Controle De Cotações** do comprador, a cotação consta como cancelada e sem proposta nova.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O fornecedor consegue enviar negociação para uma cotação **já cancelada no Protheus** — no ticket,
  o **processo nº 5493** foi gerado exatamente assim.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o **Portal do Fornecedor** existe e exige sessão da plataforma; autenticado,
abre com o heading *Bem vindo ao Portal de Compras e Contratações!* e os três botões de entrada
**Acesso Normal**, **Acesso Administrador** e **Acesso via Representatividade**, com a descrição
*"-Acesso Básico: Usuários com permissões básicas de envio de cotações, envio de negociações e envio de
notas."* — ou seja, o envio de negociação pelo fornecedor é a ação exata coberta por este caso.
**Não** prossegui além da tela de escolha de acesso, por não ter credencial de fornecedor e para não
atuar sobre cotação alheia. No **Portal do Comprador**, *Controle De Cotações* abre em
`#/controleCotacao` e devolve *"Nenhum dado encontrado"*; a tela alimenta-se do dataset
`dsFluig_getProcessosProjetoComprasSql`, cujos campos requisitados incluem **`hd_cancelarProposta`**,
`hd_numProp`, `hd_numSc` e `hd_atribuicao` — é aí que o estado de cancelamento da proposta é lido pelo
portal, e portanto o ponto de observação natural deste defeito.
**Divergências encontradas:** nenhuma quanto ao caminho. Registro: não existe, hoje, cotação visível
para a conta de QA (`dsProtheus_getCompradores_restGetAll` chamado com `Y1_USER = "undefined"`), de
modo que a massa deste caso precisa ser provisionada pelo time da CASSI.
**Dados/massa usados:** nenhum — não submetido. Nenhum cancelamento executado, em nenhum dos dois sistemas.

---

## CT-FSWTBC-1704  (protheus · Concluído)

**Título:** Incluir participante, incluir nova proposta e atualizar proposta já enviada na mesma cotação, cada operação pela API certa, sem "array out of bounds"

**Origem:** FSWTBC-1704 — "[Suporte Maio/2025] Erro na atualização da proposta da cotação". O ticket documenta o **contrato das três operações** da API de cotação, que não existe em outro lugar: (1) **incluir participante** — `POST /cotacao/atualiza/{num}`, só `C8_PRECO`, sem `C8_QUANT`; (2) **incluir nova proposta** — `POST /cotacao/atualiza/proposta/{num}`, só `C8_QUANT`, exige o número da **última** proposta incluída; (3) **atualizar proposta já enviada** — `POST /cotacao/atualiza/{num}`, só preço, exige o número da **nova** proposta. Também: "array out of bounds" ao mandar 2 itens para cotação de 1 item (comportamento do próprio Protheus) e o `UCOME031.data.tlpp` compilado não era o da master.

**Módulo/Rota:** Fluig → **Cotação de Produtos/Serviços** (form 256834) e **Negociação** (form 256835) → atividades de integração → campo **"Erro retornado pelo ERP Protheus"** (`#msgerro`, painel `#panelError`/`#hd_erroProtheus`) e aba **Histórico**; Portal do Fornecedor (envio de proposta); **Logs Protheus** → *Erros CV8*. No ERP: `UCOME031` (API cotação), SC8.

**Pré-condições**
- Cotação `QA` com **1 item**, 2 fornecedores participantes, comprador com matrícula.
- Credencial de **fornecedor** de homologação para enviar/atualizar proposta.
- **Bloqueio:** a conta de QA não tem matrícula de comprador (`Y1_USER = "undefined"`, §5-C) nem credencial de fornecedor; os endpoints são chamados **server-side** (não aparecem no front). Logs Protheus CV8 em 404 (ambiente).

**Passos**
1. Comprador: abrir a cotação, **incluir um terceiro participante** (operação 1) → Histórico da integração.
2. Fornecedor A: **enviar a primeira proposta** (operação 2) com quantidade e preço.
3. Fornecedor A: **alterar o preço** da proposta já enviada (operação 3).
4. Fornecedor B: enviar proposta; comprador: *Controle de Cotações* / *Avaliação de Propostas* — conferir as propostas e os números.
5. Cenário negativo: montar (via payload da negociação, ou com o time do ERP) o envio de **2 itens** para essa cotação de 1 item.
6. Em cada passo, ler *Erro retornado pelo ERP Protheus* e o Histórico (*"Integração executada com sucesso - Tempo de Execução N"*).

**Resultado esperado**
- Passos 1–4: cada operação sucede com o endpoint próprio; o número de proposta usado em (3) é o da proposta **nova**; no Protheus (SC8) o preço atualizado e a quantidade preservada; campo de erro **vazio**.
- Passo 5: erro **tratado e legível** no campo (*"item inexistente na cotação"* ou equivalente) — nunca `array out of bounds` cru nem silêncio.
- Passo 6: sucesso em segundos; nenhum CV8 novo.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- *Erro retornado pelo ERP Protheus* com `array out of bounds` ou proposta não atualizada (preço antigo no ERP) porque a operação usou o endpoint/número de proposta errado; `UCOME031` compilado diferente da master.

**Severidade:** Alta *(proposta gravada errada decide vencedor e alçada)*

**Preparação de massa:** cotação `QA` de 1 item criada por comprador de homologação; dois fornecedores com credencial no Portal do Fornecedor — a conta de QA não faz nenhum dos dois.

**Verificado em tela:** PARCIAL
**O que foi verificado:** HTML publicado dos formulários de Cotação (256834) e Negociação (256835): `<label for="msgerro">Erro retornado pelo ERP Protheus</label>`, `#hd_erroProtheus`, `#panelError` — o rótulo existe nas duas telas (na SC é *Retorno Integração*, `#erroIntegracao`); Logs Protheus aberto (abas CV8/ZZY/ZZZ, 404 no `genericQuery`). Endpoints `cotacao/atualiza*` não aparecem em nenhum fonte do front — chamada server-side.
**Divergências encontradas:** a seção *Erro retornado pelo ERP Protheus* não é visível na atividade *Início* (montada só nas atividades de integração) — o executor precisa abrir uma instância na etapa certa para vê-la.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1792  (fluig · Concluído)

**Título:** Os serviços SOAP que o Portal do Fornecedor usa para iniciar processo e consultar arquivos e pastas respondem, e a proposta do fornecedor é enviada sem erro.

**Origem:** FSWTBC-1792 — "[CASSI - BH] - Suporte Maio/2025] - Erro no envio de propostas do portal de
fornecedores WSDL de Start de Processos e de consulta de arquivos e pastas". O ticket é o único do
lote que cita **WSDL**: além das integrações REST, o caminho do Portal do Fornecedor passa por
**SOAP**, e é um ponto de fragilidade adicional. O ticket não traz descrição além do título.

**Módulo/Rota:** Portal do Fornecedor (`/portal/p/1/portal_fornecedor`) → **Acesso Normal**.
Serviços SOAP da plataforma: `/webdesk/ECMWorkflowEngineService?wsdl` (start de processos),
`/webdesk/ECMDocumentService?wsdl` e `/webdesk/ECMFolderService?wsdl` (consulta de arquivos e
pastas). Contraparte navegável: **Documentos** (`/portal/p/1/ecmnavigation`).

**Pré-condições**
- Cotação enviada ao fornecedor e dentro da validade.
- Credencial de fornecedor: **CNPJ da empresa + CPF do usuário + senha**.
- Serviços SOAP da plataforma publicados e acessíveis.
- **Bloqueio:** **parcial** — os três WSDL foram verificados e respondem (ver abaixo); o que **não**
  é executável é o envio da proposta em si, por não haver credencial de fornecedor.

**Passos**
1. Requisitar `GET /webdesk/ECMWorkflowEngineService?wsdl` e confirmar que o documento WSDL é servido.
2. Conferir que ele declara as operações de início de processo (**`startProcess`**,
   **`simpleStartProcess`**, **`startProcessClassic`**).
3. Requisitar `GET /webdesk/ECMDocumentService?wsdl` e `GET /webdesk/ECMFolderService?wsdl` e
   confirmar as operações de consulta (**`getDocumentContent`**, **`getSubFolders`**,
   **`getChildren`**, **`getRootFolders`**).
4. Abrir `/portal/p/1/ecmnavigation` (**Documentos**) e confirmar que a árvore de pastas lista conteúdo.
5. Abrir `/portal/p/1/portal_fornecedor`, clicar em **Acesso Normal**, informar **CNPJ da empresa**,
   **CPF do usuário** e **Senha**, e entrar.
6. Localizar a cotação pendente, anexar o arquivo da proposta e enviá-la.

**Resultado esperado**
- Os três WSDL respondem **HTTP 200** com `content-type: text/xml` e documento `wsdl:definitions` válido.
- `ECMWorkflowEngineService` declara `startProcess`, `simpleStartProcess` e `startProcessClassic`.
- `ECMDocumentService` declara `getDocumentContent`; `ECMFolderService` declara `getSubFolders`,
  `getChildren` e `getRootFolders`.
- A tela **Documentos** lista pastas e documentos sem erro.
- O envio da proposta pelo fornecedor conclui, o anexo é gravado e a cotação passa a exibi-la.
- Nenhum erro de SOAP/WSDL no caminho.

**Resultado se o defeito reincidir**
- O envio de propostas pelo Portal do Fornecedor falha, com erro originado no **WSDL de start de
  processos** ou no de **consulta de arquivos e pastas**. Mensagem exata `<não documentado>` —
  o ticket registra apenas o título.

**Severidade:** Média *(bloqueia o fluxo de cotação do lado do fornecedor; sem risco financeiro direto)*

**Preparação de massa:** uma cotação aberta e dentro da validade, atribuída a um fornecedor de teste,
mais a **credencial desse fornecedor** (CNPJ + CPF + senha). A credencial precisa ser provisionada
por quem administra o Portal do Fornecedor — é o item que falta para o caso ser executável ponta a ponta.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **os passos 1 a 4 foram executados e passaram.**
`/webdesk/ECMWorkflowEngineService?wsdl` → **HTTP 200**, `text/xml;charset=UTF-8`, 101.344 bytes,
declarando entre outras as operações **`startProcess`**, **`simpleStartProcess`**,
**`startProcessClassic`**, `saveAndSendTask`, `cancelInstance` e `getAttachments`.
`/webdesk/ECMDocumentService?wsdl` → **200**, 67.704 bytes, com **`getDocumentContent`**,
`createDocument`, `getActiveDocument`, `approveDocument`.
`/webdesk/ECMFolderService?wsdl` → **200**, 45.516 bytes, com **`getSubFolders`**, **`getChildren`**,
**`getRootFolders`**, `getSubFoldersOnDemand`, `getSecurity`.
Também responderam `/webdesk/ECMCardService?wsdl` (200) e `/webdesk/ECMColleagueService?wsdl` (200).
A tela **Documentos** (`/portal/p/1/ecmnavigation`) abre com a grade `ecm-navigation-grid` populada.
O **Portal do Fornecedor** abre com os headings *Bem vindo ao Portal de Compras e Contratações!* e
*Selecione o tipo de acesso.* e os botões **Acesso Normal**, **Acesso Administrador** e
**Acesso via Representatividade**. O passo 6 não foi executado (sem credencial de fornecedor).
**Nenhuma operação SOAP foi invocada — apenas os WSDL foram lidos.**
**Divergências encontradas:** duas, ambas de ambiente e não do ticket. (1) `GET /webdesk` (raiz)
responde **403** `Forbidden`, mas os endpoints de serviço abaixo dele respondem **200** — o 403 da
raiz não indica, portanto, que a camada SOAP esteja fechada. (2) A carga do Portal do Fornecedor
acusa **HTTP 401** em `/cassi_rest/api/rest/cassi/compras/1/verifyAutenticateToken` e **404** em
`ly_portal_fornecedor/resources/js/wcm_widgets_pt_BR.js`; o 401 é coerente com não haver sessão de
fornecedor (a sessão presente é a da plataforma), mas o 404 do recurso de tradução é ruído real da tela.
**Dados/massa usados:** nenhum — não submetido; somente leituras `GET` de WSDL.

---

## CT-FSWTBC-2076  (fluig · Concluído · SDCASSI-10)

**Título:** Fornecedor pertencente ao grupo de produto da cotação enxerga a cotação no Portal do Fornecedor, com validade válida.

**Origem:** FSWTBC-2076 — `SD765951`: fornecedor pertencia ao grupo de produto mas não era exibido no
Portal do Fornecedor; a **data de validade da cotação** ficava `NaN` e **voltava a `NaN` mesmo depois de
alterada** (a sincronização sobrescrevia a correção manual). Corrigido no dataset de sincronização.

**Módulo/Rota:** *Portal do Fornecedor* (`/portal/p/1/portal_fornecedor`) → **Acesso Normal**.
Contrapartes internas: *Cotação de Produtos/Serviços* → **Validade da Cotação** / **Validade da Proposta**;
*Solicitação de Compras* → **Validade da Cotação** (etapa Validação do Comprador); *Portal do Comprador* →
**Controle De Cotações**.

**Pré-condições**
- Cotação criada e enviada a fornecedores de um determinado **grupo de produto**.
- Fornecedor cadastrado nesse grupo de produto no Protheus, com usuário ativo no Portal.
- Credencial do fornecedor: **CNPJ da empresa + CPF do usuário + senha**.
- **Bloqueio:** **sim** — não há credencial de fornecedor disponível para a conta de QA; a jornada do
  fornecedor não é executável nesta rodada.

**Passos**
1. Com o comprador, abrir a cotação e anotar o **grupo de produto** dos itens e a **Validade da Cotação**.
2. Conferir que **Validade da Cotação** e **Validade da Proposta** exibem **data**, e não `NaN` nem vazio.
3. Abrir `/portal/p/1/portal_fornecedor`, clicar em **Acesso Normal** e entrar com o fornecedor daquele
   grupo de produto.
4. Conferir que a cotação aparece na lista de cotações do fornecedor.
5. Aguardar/forçar um novo ciclo de sincronização e repetir o passo 2 — a data **não** pode voltar a `NaN`.
6. Conferir a mesma cotação no **Portal do Comprador** → **Controle De Cotações** e no **Tracker**
   (*Nº da Cotação* × *Solicitante*).

**Resultado esperado**
- A **Validade da Cotação** é exibida como data válida em todas as telas, e permanece válida depois de
  novas sincronizações.
- O fornecedor pertencente ao grupo de produto **é listado** e enxerga a cotação no Portal do Fornecedor.
- Nenhum campo de data ou valor exibe `NaN` (os formatadores devolvem `"0.00"`/`"0.000000"` quando o valor
  é inválido, nunca `NaN`).
- A correção feita na validade **não** é sobrescrita pela sincronização seguinte.

**Resultado se o defeito reincidir**
- O fornecedor do grupo de produto não aparece no Portal do Fornecedor e a validade da cotação exibe `NaN`;
  ao corrigir manualmente, o valor volta a `NaN` depois de um tempo (relato do processo 33648).

**Severidade:** Alta *(fornecedor elegível fica fora da concorrência)*

**Preparação de massa:** uma cotação aberta para um grupo de produto, um fornecedor ativo naquele grupo e
a credencial dele no Portal (CNPJ + CPF + senha). Nada disso está disponível para a conta de QA — precisa
vir da equipe de Compras da Cassi.

**Verificado em tela:** PARCIAL
**O que foi verificado:** `/portal/p/1/portal_fornecedor` abre autenticado, com o texto *"Bem vindo ao
Portal de Compras e Contratações!"*, a instrução *"Selecione o tipo de acesso."* e os botões
**Acesso Normal**, **Acesso Administrador** e **Acesso via Representatividade**; o acesso exige
CNPJ da empresa + CPF do usuário + senha. No formulário de Cotação, os campos **Validade da Cotação \*** e
**Validade da Proposta \*** existem (`txt_valid_infForn`, `dt_validadeCotacao`), ambos `readonly`.
Confirmado no fonte que os formatadores tratam `NaN` explicitamente, devolvendo `"0.00"` / `"0.000000"`.
A jornada do fornecedor não foi executada — sem credencial.
**Divergências encontradas:** a legenda da tela do Portal do Fornecedor descreve *"**Acesso Básico**:
Usuários com permissões básicas de envio de cotações…"*, mas o botão correspondente se chama
**Acesso Normal** — rótulo divergente entre a legenda e o controle.
**Dados/massa usados:** nenhum — não submetido.

---

## Observações transversais do lote

1. **Histórico da solicitação não é alcançável por deep-link.** Abrir
   `/portal/p/1/pageworkflowview?processInstanceId=112146` (instância da **própria** conta, listada na
   Central de Tarefas com *Responsável: Usuário TBC (TOTVS)*) devolve o modal **Erro — "Esta tarefa não está
   mais sob sua responsabilidade!"**. Consequência prática: a superfície *"Integração executada com sucesso
   - Tempo de Execução N s"* só é observável abrindo a tarefa **pela Central de Tarefas**, nunca por URL.
2. **Precisão numérica é decidida em dois lugares** e vale para os casos 1954, 2024 e 2032:
   `listDecimal.default = 6` (valores) e `listDecimal.rateio = 8` (percentuais). Qualquer regressão de
   truncamento aparece primeiro como divergência na casa decimal exibida.
3. **Normalização de código de contrato** (`.trim()`) está aplicada em todas as consultas do Faturamento —
   é a defesa direta contra o defeito 2032, e é o que o teste de regressão deve exercitar.
4. **Testabilidade da Gerência de Compras:** os controles da aba Transferir (+ Detalhes, seletor de
   comprador) usam ids GUID regerados a cada carga e não expõem nome acessível — automatizar esse caso hoje
   exige âncora por posição, que é frágil. Vale como recomendação ao time.

## CT-FSWTBC-2720  (ambos · Concluído · SDCASSI-100)

**Título:** Um fornecedor que já completou e teve o cadastro aprovado **deixa de receber** o e-mail
de cobrança de ajuste cadastral, e o e-mail que ele recebe traz os dados dele preenchidos.

**Origem:** FSWTBC-2720 (incidente 778018) — o fornecedor **TAKING RESULTS E INFORMATICA LTDA**
reclamou formalmente, com e-mail como evidência, que o Fluig envia cobranças de ajuste cadastral
para fornecedores **cujo cadastro já foi totalmente preenchido e aprovado** (processo de cadastro
**45563**). A análise inicial julgou o comportamento correto; o cliente **reabriu** com o requisito
real: *"precisa ser ajustado para validar a **ETAPA** do processo antes do envio da notificação;
hoje só valida os dias e se o processo está aberto"*. Na validação da correção surgiu um **segundo
defeito**: os dados do fornecedor iam como **`undefined`** no e-mail, porque o **dataset** que busca
as informações do formulário **não retornava os campos**. PR 56301 / MUD16418 em 30/09/2025.

**Módulo/Rota:** processo **Cadastro de Fornecedor** — `processId` **`wf_cadastro_fornecedor`**,
rota `/portal/p/1/pageworkflowview?processID=wf_cadastro_fornecedor`, formulário **256830**.
Etapas relevantes: **13 – Completar Cadastro**, **48 – Validar Fornecedor**,
**38 – Notifica Fornecedor**, **21 – Definir Natureza Financeira**, **23 – Integração ERP (fim)**,
**25 – Fim**. Acompanhamento pela aba **Histórico** da instância e pela *Central de Tarefas*.

**Pré-condições**
- Um processo de *Cadastro de Fornecedor* que já **passou** da etapa **13 – Completar Cadastro**
  (dados complementares preenchidos) e teve o cadastro **aprovado** na seção
  **"Homologar Fornecedor"** (campo **Aprovado**).
- O processo **ainda aberto** e com **idade suficiente** para o gatilho de cobrança disparar — as
  duas condições que, sozinhas, causavam o defeito.
- Acesso à caixa de e-mail do fornecedor (ou ao registro do disparo).
- **Bloqueio:** **sim** — não há credencial de fornecedor, e §2 proíbe movimentar o processo de
  cadastro de terceiro. O disparo depende de um **agendamento** que §2 também proíbe executar.

**Passos**
1. Abrir o processo de *Cadastro de Fornecedor* e confirmar, na aba **Informações**, em que **etapa**
   ele está.
2. Confirmar que a seção **"Informações do Fornecedor"** está completa (**Código**, **Loja**,
   **Tipo do Fornecedor**, **CNPJ/CPF**, **Razão social**, **Nome Fantasia**) e que as seções
   **Endereço**, **Contatos** e **Administração/Financeiro** estão preenchidas.
3. Confirmar, na seção **"Homologar Fornecedor"**, que **Aprovado** está marcado e que
   **Responsável**, **E-mail do Responsável**, **Data da Validação** e **Hora da Validação** estão
   preenchidos.
4. Deixar o processo envelhecer além do prazo de cobrança **sem** movimentá-lo.
5. Após o disparo do agendamento de notificação, verificar a caixa do fornecedor
   (endereço do campo **E-mail** da seção **Contatos**).
6. Repetir o cenário com um processo **parado na etapa 13 – Completar Cadastro** (fornecedor
   realmente devendo dados) e verificar o e-mail recebido.
7. No e-mail do passo 6, conferir **campo a campo** os dados do fornecedor.

**Resultado esperado**
- **Passo 5:** o fornecedor com cadastro completo e aprovado **NÃO recebe** cobrança de ajuste
  cadastral. A regra de disparo considera a **etapa** do processo, e não apenas *dias decorridos* +
  *processo aberto*.
- **Passo 6:** o fornecedor **parado na etapa 13 – Completar Cadastro** **recebe** a cobrança —
  a correção não pode ter desligado a notificação legítima.
- **Passo 7:** o e-mail traz **Razão social**, **Nome Fantasia**, **CNPJ/CPF**, **Código**/**Loja**
  e **Nº do Processo** **preenchidos com os valores do formulário**. **Nenhuma ocorrência da
  palavra `undefined`** em nenhum campo do corpo da mensagem.
- A aba **Histórico** da instância registra o envio da notificação com data/hora.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Fornecedor com cadastro **já preenchido e aprovado** recebe cobrança de ajuste cadastral — foi o
  que gerou a **reclamação formal** da TAKING RESULTS E INFORMATICA LTDA (processo **45563**). No
  caso original o e-mail saiu em **25/08** e o processo só foi movimentado para a integração com o
  Protheus em **29/08**: a notificação **antecedeu** a atualização, e o gatilho não olhava a etapa.
- Segundo sintoma, surgido na validação da correção: os dados do fornecedor chegavam ao e-mail como
  **`undefined`**, porque o dataset de leitura do formulário **não retornava os campos**.
- Evidências originais: 8 anexos, incluindo o e-mail do fornecedor e os prints do `undefined` e do
  dataset sem retorno.

**Severidade:** Alta — cobrança indevida a fornecedor é exposição externa da CASSI, com reclamação
formal já registrada; e um e-mail com `undefined` no lugar da razão social é dado corrompido
enviado para fora.

**Preparação de massa:** **dois** processos de *Cadastro de Fornecedor*: um **completo e aprovado**
(passado da etapa 13, com **Aprovado** marcado em *Homologar Fornecedor*) e outro **parado na etapa
13 – Completar Cadastro**, ambos com idade acima do prazo de cobrança. Precisam ser criados com
fornecedores de teste por quem opera o cadastro — **o QA não deve criá-los**, porque o processo
dispara e-mail **para o endereço informado**. É indispensável usar um endereço de teste controlado.
O disparo depende do agendamento de notificação, que **não deve ser executado manualmente** (§2).

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — o processo **`wf_cadastro_fornecedor`**
("Cadastro de Fornecedor") existe e abre; a instância traz as abas **Formulário**, **Informações**,
**Histórico**, **Anexos**, **AdHoc** e **Apontamentos**. O formulário **256830** foi inspecionado e
tem as seções **"Identificação do Processo / Solicitante"** (*Nº do Processo*, *Solicitante*,
*Email do Solicitante*, *Data da Solicitação*, *Hora da Solicitação*), **"Informações do
Fornecedor"** (*Código*, *Loja*, *Tipo do Fornecedor*, *CNPJ/CPF*, *Tipo do Cadastro*, *Tipo de
Prestador*, *Razão social*, *Nome Fantasia*), **"Endereço"**, **"Contatos"** (*Telefone*, *Celular*,
*E-mail*), **"Administração/Financeiro"** (*Banco*, *Agência*, *Conta*, *Tipo de Conta*, *Forma de
Pagamento*), **"Fiscal"**, **"Autônomos"**, **"Outros"**, **"Homologar Fornecedor"** (*Responsável*,
*E-mail do Responsável*, *Data da Validação*, *Hora da Validação*, **Aprovado**, *Justificativa*) e
**"Definir Natureza Financeira"** (*Natureza Financeira*, *Natureza de Serviço*, *Código de
Retenção*, *Optante pela desoneração da folha?*), além da grade `tbGruposProdutos`.
*Lido no fonte publicado* — o `ViewHandler` do form 256830 declara o mapa de atividades
**`{ inicio: 4, integracaoERP: 11, completarCadastro: 13, validarFornecedor: 48,
notificaFornecedor: 38, naturezaFinanceira: 21, integracaoERPFim: 23, fim: 25 }`** — ou seja,
**a etapa que o gatilho precisa consultar é `WKNumState`**, e existe uma atividade dedicada
**38 `notificaFornecedor`**. A leitura do formulário passa pelo `UtilsHandler`, que consulta
`/api/public/ecm/dataset/datasets` e trata falha com
`"Ocorreu um erro ao consultar o dataset. Se o problema persistir, contate a TI."`.
**Divergências encontradas:**
1. **A regra de disparo não está no front-end.** O gatilho de cobrança (dias + status + etapa) é
   servidor/agendamento; **não há tela no Fluig que a exiba ou permita conferi-la**. O caso é
   ancorado no **efeito** (quem recebe o e-mail e o que vem escrito nele) e na **etapa da
   instância**, que é observável na aba *Informações*. Dito explicitamente, sem simular cobertura.
2. **Achado de tela (Baixa):** o cabeçalho do formulário 256830 diz literalmente
   *"Todos os campos com \* são obrigatórios já os campos com \* não são obrigatórios."* — **usa o
   mesmo marcador `*` para as duas metades da frase**, o que a torna contraditória e inútil. Nos
   demais formulários do ambiente o texto é *"Todos os campos com * são de preenchimento
   obrigatório."*.
3. **Achado de código (Média):** em `App.js` do form 256830, `beforeSaveValidate(numState)`
   **não tem `return true`** no caminho de sucesso — retorna `undefined`, e só retorna `false` no
   `catch`. Uma validação de gravação que devolve `undefined` depende do modo como a plataforma
   avalia o retorno; é frágil e vale revisar.
**Dados/massa usados:** nenhum — não submetido; nenhum processo de cadastro foi criado, movimentado
ou aprovado, e **nenhum e-mail foi disparado**.

---

## CT-FSWTBC-2752  (fluig · Concluído · SDCASSI-103)

**Título:** Solicitante cadastra fornecedor informando telefone sem máscara e o processo aceita e normaliza o número.

**Origem:** FSWTBC-2752 — “Cadastro de fornecedor - telefone vindo sem máscara”: cadastros chegavam
ao Fluig com o telefone cru e o processamento quebrava (exemplo: solicitação **53644**). O cliente
propôs duas saídas — validar a máscara antes do envio, ou normalizar o número no processamento; a
correção aparentou seguir a segunda. Mesma família de FSWTBC-2772 (`30.500,00` × `30500.00`).

**Módulo/Rota:** *Processos → Iniciar Solicitações → Cadastro de Fornecedor*
(`/portal/p/1/pageworkflowview?processID=wf_cadastro_fornecedor`) → seção **Informações do
Fornecedor**, campos **Telefone \*** (`txt_tel_infForn`) e **Celular \*** (`txt_cel_infForn`).

**Pré-condições**
- Nenhuma massa prévia: o processo é iniciável pela conta de QA.
- Se o cadastro também entrar por integração/outro canal, ter à mão um payload com telefone cru.
- **Bloqueio:** nenhum para a inspeção do campo. Para provar o **processamento** seria preciso
  submeter o cadastro — evitado por política (registro no Fluig/Protheus não tem exclusão).

**Passos**
1. Iniciar *Cadastro de Fornecedor*.
2. Na seção **Informações do Fornecedor**, digitar no campo **Telefone \*** apenas dígitos, sem
   máscara: `1133334444`.
3. Repetir no campo **Celular \***: `11988887777`.
4. Sair do campo (blur) e observar o valor exibido.
5. Preencher o restante dos obrigatórios e enviar a solicitação.
6. Acompanhar a solicitação até a etapa seguinte e conferir o telefone gravado.

**Resultado esperado**
- O número cru é **aceito** e **normalizado** — o processo não quebra por ausência de máscara.
  (Se a regra adotada tiver sido *validar antes do envio*, o esperado passa a ser uma **crítica
  explícita de formato**, citando o formato aceito — nunca um erro de processamento genérico.)
- Nenhuma exceção nas etapas seguintes por conta do formato do telefone.
- O mesmo tratamento vale para **Telefone** e **Celular**, e para número **com** máscara
  (`(11) 3333-4444`) — os dois formatos precisam terminar no mesmo dado gravado.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O cadastro chega ao Fluig com o telefone sem máscara e o processamento **falha** (solicitação
  **53644**). Mensagem exata `<não documentado>` — os prints do ticket não estão disponíveis nesta
  rodada.

**Severidade:** Média *(bloqueia o fluxo do cadastro; sem impacto financeiro direto)*

**Preparação de massa:** nenhuma — basta iniciar o processo. Para cobrir a fronteira citada no
ticket (“cadastros **chegando** ao Fluig”), é preciso também um cadastro entrando pelo canal de
integração com telefone cru, que a conta de QA não consegue disparar.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário *Cadastro de Fornecedor* (iframe `256830`, 63 campos) foi
aberto. Seções: *Identificação do Processo / Solicitante*, *Informações do Fornecedor*, *Grupos de
Produtos*, *Endereço*, *Contatos*, *Administração/Financeiro*, *Fiscal*, *Autônomos*, *Outros*,
*Homologar Fornecedor*, *Definir Natureza Financeira*. Os campos **Telefone \*** e **Celular \***
foram **exercitados sem submeter**: digitado `1133334444` em *Telefone* → o campo ficou com
`1133334444`, **inalterado após o blur**; digitado `11988887777` em *Celular* → idem. Os valores
foram apagados em seguida.
**Divergências encontradas:** **sim, achado relevante.** Os campos **Telefone** e **Celular** não
têm nenhuma máscara nem restrição declarada — sem `maxlength`, sem `pattern`, sem `data-mask`, com
`placeholder` apenas “Telefone”/“Celular”. No **mesmo formulário**, o campo **CEP** tem
`maxlength="9"` e o **CNPJ/CPF** tem `placeholder="99.999.999/9999-99"`. Ou seja: a entrada crua
**continua sendo aceita sem crítica** na tela de hoje. Isso é exatamente a pendência registrada no
ticket (“se foi validação no envio em vez de normalização no processamento, o defeito reincide por
qualquer outro canal de entrada”) — a correção, se houve, **não está na camada de tela**, e o caso
precisa ser executado até o processamento para valer como regressão.
**Dados/massa usados:** `1133334444` e `11988887777` digitados no formulário de início e apagados;
**nada foi enviado**, nenhuma solicitação criada.

---

## CT-FSWTBC-2930  (fluig · Concluído · SDCASSI-121)

**Título:** Fornecedor envia uma nova proposta pelo Portal do Fornecedor e o envio é aceito na versão publicada do processo de cotação.

**Origem:** FSWTBC-2930 — “Envio de novas propostas pelo fornecedor dando erro” durante a
homologação da DEM10013706. Causa raiz de **gestão de versão**, não de lógica: a versão publicada do
processo de cotação continha **um script a mais, vinculado a outra demanda ainda em
desenvolvimento**. Código de demanda não concluída vazou para a versão usada na homologação de
outra, quebrando o envio de propostas. Corrigido no ambiente de QA empresa 1, no mesmo dia.

**Módulo/Rota:** **Portal do Fornecedor** (`/portal/p/1/portal_fornecedor`) → **Acesso Normal** →
envio de proposta. Contraparte interna: processo **Cotação de Produtos e Serviços**
(`wf_cotacao_produtos_servicos`).

**Pré-condições**
- Cotação enviada ao fornecedor e **dentro da validade** (campos **Validade da Cotação \*** e
  **Validade da Proposta \*** do formulário de cotação).
- Credencial de **fornecedor**: **CNPJ da empresa + CPF do usuário + senha**.
- **Versão do processo de cotação publicada limpa** — sem scripts de demandas em desenvolvimento.
  Esta é a pré-condição que o defeito ensina a verificar, e é de configuração, não de dados.
- **Bloqueio:** sim — **não há credencial de fornecedor** disponível. A tela de acesso foi aberta,
  mas a jornada do fornecedor não é executável nesta rodada.

**Passos**
1. **Antes de testar**, conferir com o time qual **versão** do processo `wf_cotacao_produtos_servicos`
   está publicada no ambiente e se ela contém **apenas** os scripts da demanda em homologação.
2. Abrir `/portal/p/1/portal_fornecedor` e clicar em **Acesso Normal**.
3. Informar **CNPJ da empresa**, **CPF do usuário** e **Senha**; entrar.
4. Localizar a cotação em aberto e preencher uma **nova proposta** (valores e quantidades dos itens).
5. Enviar a proposta.
6. Do lado interno, abrir a cotação e conferir a seção **Verificar Erro**, campo **Erro retornado
   pelo ERP Protheus \***.
7. Conferir a proposta na SC de origem, seção **Validação do Comprador (Definir Negociação)**.

**Resultado esperado**
- O envio da nova proposta é **aceito**, sem erro na tela do fornecedor.
- A proposta aparece do lado interno com **Proposta \***, **Versão \*** e **Fornecedor \***
  corretos; sendo reenvio, a **Versão** incrementa.
- O campo **Erro retornado pelo ERP Protheus \*** fica **vazio**.
- Os totais do formulário de cotação (**Sub Total \***, **Valor total do IPI \***, **Valor total do
  Frete \***, **Valor total de Descontos \***, **Valor total do Pedido \***) refletem a proposta
  enviada.
- A instância **não** volta para a etapa **Correção**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro no envio de novas propostas pelo Portal do Fornecedor durante a homologação (anexo
  `image-20251010-162136.png`, indisponível). Mensagem exata `<não documentado>`.
- **Diagnóstico que o ticket ensina:** antes de investigar a lógica, conferir se a **versão
  publicada do processo** carrega script de outra demanda. Foi essa a causa, e o risco de processo
  segue sem tratamento — não há isolamento entre versões de processo BPM de demandas concorrentes.
- Pista observável hoje: instâncias de *COTAÇÃO DE PRODUTOS E SERVIÇOS* paradas na etapa
  **Correção**.

**Severidade:** Alta *(fornecedor impedido de propor compromete a competitividade da cotação; e a
causa — vazamento de código entre demandas — pode afetar qualquer etapa do processo)*

**Preparação de massa:** uma cotação em aberto e dentro da validade, endereçada a um fornecedor cuja
**credencial esteja disponível ao teste** (CNPJ + CPF + senha), e a confirmação de qual versão do
processo está publicada. Falta hoje a credencial de fornecedor — é limite declarado do projeto.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o **Portal do Fornecedor** foi aberto: título `Cassi - Fluig Plataforma -
Portal do Fornecedor`, headings *Bem vindo ao Portal de Compras e Contratações!*, *Somos a CASSI*,
*Caixa de Assistência dos Funcionários do Banco do Brasil* e *Selecione o tipo de acesso.*, com os
botões **Acesso Normal**, **Acesso Administrador** e **Acesso via Representatividade**. O formulário
de *Cotação de Produtos/Serviços* (58 campos) foi inspecionado: seções *Identificação do Processo /
Solicitante*, *Informações do Fornecedor*, *Endereço*, *Contatos*, *Identificação do(s)
Produto(s)/Serviço(s)*, *Lista de Produtos/Serviços*, *Informações p/ Parecer Técnico*, *Insira os
anexos para envio do Parecer Técnico* e **Verificar Erro** — esta última contendo o campo
`msgerro`, rótulo **“Erro retornado pelo ERP Protheus \*”**, que é a superfície de diagnóstico
recomendada pelo briefing (§5-B).
**Divergências encontradas:** a carga do Portal do Fornecedor sem sessão de fornecedor retorna
**401** em `/cassi_rest/api/rest/cassi/compras/1/verifyAutenticateToken` e **404** em
`ly_portal_fornecedor/resources/js/wcm_widgets_pt_BR.js` — o primeiro é esperado (não há sessão de
fornecedor), o segundo é um recurso de tradução ausente e merece registro à parte. O termo
“proposta” **não aparece** na tela inicial do portal: ela é só a seleção do tipo de acesso.
**Dados/massa usados:** nenhum — nenhum login de fornecedor efetuado, nada enviado.

---

## CT-FSWTBC-3152  (ambos · Concluído · SDCASSI-140)

**Título:** Cadastrar fornecedor pelo Portal e confirmar que CNPJ já existente é barrado antes da gravação e que Razão Social e Nome Fantasia não aceitam acentos nem caracteres especiais.

**Origem:** FSWTBC-3152 — dois incidentes no Cadastro de Fornecedor: (a) gerou **LOJA 002** para o mesmo CNPJ com o mesmo tipo de serviço/material (duplicidade); (b) cadastros vindos do Fluig permitiam **acentuação** (ç) — processos 62886 e 62202. A falha de charset **causou** a duplicidade: o processo caiu na atividade de correção, o colaborador cadastrou por fora, e ao movimentar gerou a loja duplicada. Duas correções (PR 59092 / MUD16769): verificação prévia de existência via `dsProtheus_getFornecedoresCompras_restGetAll` e transliteração automática em Razão Social e Nome Fantasia.

**Módulo/Rota:** `/portal/p/1/cadastro_fornecedor` (auto-cadastro público, título *Cadastro de Fornecedores*) e formulário interno do processo `wf_cadastro_fornecedor` (card **256830**).

**Pré-condições**
- Um CNPJ **já cadastrado** no Protheus (SA2), para o teste de duplicidade.
- Acesso à página pública de cadastro de fornecedor.
- **Bloqueio:** parcial. Não há credencial de **fornecedor** (§5-C) nem tarefa de cadastro de fornecedor na Central de Tarefas da conta de QA. A checagem de duplicidade é **server-side** (o dataset citado no ticket **não aparece em nenhum fonte publicado**), então só se observa o resultado, não a regra. A criação da loja 002 é efeito no Protheus, **sem credencial**.

**Passos**
1. Abrir `/portal/p/1/cadastro_fornecedor`.
2. No campo **`CNPJ *`** (`txt_cnpj`, máscara `99.999.999/9999-99`), informar um CNPJ **já existente** no ERP.
3. No campo **`Razão Social *`** (`txt_razaoSocial`), digitar um texto com cedilha e acento — ex.: `QA CLÍNICA SÃO JOSÉ LTDA`.
4. No campo **`Nome de Fantasia *`** (`txt_nomeFantasia`), digitar `QA SÃO JOSÉ & CIA`.
5. Observar **enquanto digita** o que acontece com os acentos e os caracteres especiais.
6. Preencher o restante e clicar em **Enviar**.
7. Observar o modal de retorno.
8. **Não** repetir o envio caso ele seja aceito; anotar o processo gerado.
9. Se houver acesso à atividade de correção do processo interno (card 256830), repetir o teste de acentuação nos campos **`Razão social *`** (`txt_razSoc_infForn`) e **`Nome Fantasia *`** (`txt_nomeFan_infForn`).

**Resultado esperado**
- Acentos e caracteres especiais **não permanecem** em Razão Social e Nome Fantasia: `Ç`→`C`, `Á`→`A`; o valor final é transliterado e em caixa alta.
- Ao enviar com CNPJ já existente, o cadastro é **barrado antes da gravação**, com modal de erro (título **`Erro ao criar solicitação`**) trazendo a mensagem devolvida pelo serviço — e **nenhuma loja 0002** é criada.
- A mesma regra de acentuação vale no formulário **interno** do processo, não só no auto-cadastro público.

**Resultado se o defeito reincidir**
- O cadastro é aceito com `ç`/acento e o processo cai em atividade de correção; ao ser corrigido e movimentado, gera **LOJA 002** para um CNPJ que já existia, com o mesmo tipo de serviço/material.

**Severidade:** Alta

**Preparação de massa:** um CNPJ sabidamente já cadastrado na SA2 (fornecido por quem tem acesso ao Protheus) e um CNPJ novo para o caminho feliz. Se for necessário concluir o envio, usar prefixo **`QA`** em todo texto livre. **Superfície do Fluig para o efeito:** a página pública de cadastro e o modal de erro; a criação da loja 0002 na SA2 **não tem superfície no Fluig**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a rota `/portal/p/1/cadastro_fornecedor` existe e responde com título *Cassi - Fluig Plataforma - Cadastro de Fornecedores*; o formulário interno do processo `wf_cadastro_fornecedor` corresponde ao card 256830. **A regra de acentuação foi encontrada no fonte publicado e é exatamente a descrita no ticket** — `l023_cf_EventHandler_pt_BR.js:225-234`, com o comentário `//SDCASSI-140`, aplicando `.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-zA-Z0-9 ]/g,'')` no evento `input`, e instalada em **exatamente dois campos** (`txt_razaoSocial`, `txt_nomeFantasia`, linhas 28-29). O envio é por `POST .../java_portal_fornecedorv1/rest-acesso/request/createSupplier` no botão **Enviar**; o erro volta em modal Swal com título fixo `Erro ao criar solicitação`.
**Divergências encontradas:** quatro. (a) A transliteração é **silenciosa** — não há toast, alerta nem log; o caractere some enquanto se digita, e colar também é filtrado. (b) O escopo é **mais largo que o ticket**: `[^a-zA-Z0-9 ]` remove também `.`, `-`, `/`, `&`, `,` — `TOTVS S.A.` vira `TOTVS SA`. (c) **O formulário interno 256830 NÃO tem a regra**: `txt_razSoc_infForn` e `txt_nomeFan_infForn` são `input type="text"` sem listener, de modo que a atividade de correção pode **reintroduzir acento** — que é justamente o encadeamento descrito no ticket. (d) Os rótulos **divergem entre as duas telas**: público `Razão Social *` / `Nome de Fantasia *`; interno `Razão social *` (s minúsculo) / `Nome Fantasia *`. Além disso, `dsProtheus_getFornecedoresCompras_restGetAll` **não existe em nenhum fonte publicado** — a checagem de duplicidade é inteiramente server-side.
**Dados/massa usados:** nenhum — não submetido. Nenhum fornecedor cadastrado.

---

## CT-FSWTBC-3153  (ambos · Concluído · SDCASSI-141)

**Título:** Cadastrar fornecedor pelo Fluig com dados bancários e confirmar que eles são aproveitados na implantação da NF.

**Origem:** FSWTBC-3153 — cadastros de fornecedor abertos pelo Fluig chegavam com `A2_XPREST='999999'` e `A2_XHPREST='999999'`; como a implantação da NF usa esses campos para localizar os dados bancários, nada era encontrado. Correção: enviar os campos **vazios** (PR 59158 / MUD16769). A primeira tentativa falhou — em 28/11 o `999999` ainda era enviado (CNPJ 68.617.894/0001-05, processo Fluig 59274).

**Módulo/Rota:** Processo `wf_cadastro_fornecedor` → formulário interno (card **256830**), bloco de dados bancários; aba **Histórico** da solicitação (integrações `integracaoERP` = 11 e `integracaoERPFim` = 23).

**Pré-condições**
- Processo de cadastro de fornecedor vivo numa atividade que exponha o bloco de dados bancários.
- Uma NF a implantar para esse fornecedor, no Protheus.
- **Bloqueio:** sim, e é o mais severo do lote. (a) Não há tarefa de cadastro de fornecedor para a conta de QA. (b) **Não existe superfície no Fluig que mostre o valor enviado em `A2_XPREST` / `A2_XHPREST`**: o front-end não monta campos `A2_*` — a tradução acontece nas service tasks server-side. (c) A implantação da NF é **exclusivamente Protheus**, sem credencial nesta rodada.

**Passos**
1. Abrir a tarefa do processo de cadastro de fornecedor.
2. Preencher o bloco bancário: **`Banco *`**, **`Agência *`** (+ dígito), **`Conta *`** (+ dígito), **`Tipo de Conta *`**, **`Natureza Financeira *`**, **`Condição de Pagamento *`**, **`Forma de Pagamento *`**, **`Conta Contábil *`**, **`Código Adm. Financeira *`**.
3. Conferir o campo **`Tipo de Prestador *`** (opções `Saúde`, `Serviços/Material`, `Funcionários`, `Saúde/Serviços`, `Judicial/Indenização`).
4. Movimentar o processo até a integração com o ERP.
5. Abrir a aba **Histórico** e conferir o registro da integração.
6. *(Etapa Protheus, fora desta rodada)* Consultar o fornecedor na SA2 e conferir `A2_XPREST` / `A2_XHPREST`.
7. *(Etapa Protheus, fora desta rodada)* Implantar uma NF do fornecedor e conferir se os dados bancários vêm preenchidos.

**Resultado esperado**
- O cadastro integra com sucesso: Histórico com `Integração executada com sucesso - Tempo de Execução N s`.
- Na SA2, `A2_XPREST` e `A2_XHPREST` ficam **vazios** — nunca `999999`.
- Na implantação da NF, os dados bancários do fornecedor (banco, agência, conta) são **trazidos automaticamente**.

**Resultado se o defeito reincidir**
- `A2_XPREST` e `A2_XHPREST` voltam a chegar com **`999999`** e a implantação da NF não traz os dados bancários — sintoma verificado em homologação no processo Fluig 59274 (CNPJ 68.617.894/0001-05).

**Severidade:** Alta

**Preparação de massa:** um processo de cadastro de fornecedor atribuído ao executor, com dados bancários completos, e uma NF do mesmo fornecedor para implantar — esta última **exige analista com acesso ao Protheus**. **Declaração explícita, conforme §5-B:** o efeito central deste defeito (valor gravado em `A2_XPREST`/`A2_XHPREST` e o preenchimento dos dados bancários na implantação da NF) **não tem nenhuma superfície no Fluig**. O Fluig só permite provar que os campos bancários foram preenchidos na origem e que a integração concluiu; a verificação do valor sentinela e do efeito na NF é obrigatoriamente Protheus. Simular cobertura aqui seria falso.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário interno 256830 **tem** o bloco bancário, com os rótulos e ids confirmados no fonte: `Banco *` (`ztxt_banco_infoForn` + hidden `hd_codBanco`), `Agência *` (`txt_agencia_infForn` / `txt_agenciaDgt_infForn`), `Conta *` (`txt_conta_infForn` / `txt_contaDgt_infForn`), `Tipo de Conta *` (`sl_tpCont_infForn`), `Natureza Financeira *`, `Condição de Pagamento *`, `Forma de Pagamento *`, `Conta Contábil *` (dataset `dsProtheus_getContaContabil_restGetAll`), `Código Adm. Financeira *`, e `Tipo de Prestador *` (`sl_tpPrest_infForn`). As atividades de integração do processo são `integracaoERP: 11` e `integracaoERPFim: 23`.
**Divergências encontradas:** (a) **o literal `999999` não existe em nenhum fonte publicado** como valor de campo — as únicas ocorrências são a validação de CPF `cpf == "99999999999"` (11 noves) e o teto de inputmask `max: '999.999.999,999999'`; portanto o valor sentinela é atribuído **server-side** e não é auditável pelo Fluig. (b) `A2_XPREST`/`A2_XHPREST` aparecem **uma única vez** no front-end, em `pc_main.js:82`, e apenas como **lista de campos de leitura** da SA2 no Portal do Comprador — nunca como atribuição. (c) O **auto-cadastro público não tem campos bancários**: eles existem só no formulário interno, o que significa que o fornecedor não os informa. (d) Bug de seletor no mesmo formulário: `consultaCeis()`/`consultaCnep()` leem o CNPJ com `$("#txt_cgc_infForn").text()` — `.text()` num `<input>` é sempre `""`.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3156  (fluig · Concluído)

**Título:** Incluir um novo participante numa cotação já aberta e, em seguida, atualizar a proposta — confirmando que a nova proposta é gravada e aparece para o comprador.

**Origem:** FSWTBC-3156 — o fluxo "incluir participante e depois atualizar proposta" (alteração de quantidade pelo fornecedor, DEM10013738, blocos 300-303) foi implementado de forma incorreta; o erro só foi apontado 6 meses depois da entrega. O ticket **não traz descrição detalhada** — o caso abaixo é de caracterização de caminho.

**Módulo/Rota:** *Portal do Comprador* › **Controle De Cotações** (`/portal/p/1/portal-do-comprador#/controleCotacao`) e **Avaliação de Propostas** (`#/avaliacaoPropostas`); do lado do fornecedor, *Portal do Fornecedor* (`/portal/p/1/portal_fornecedor`).

**Pré-condições**
- Uma cotação **aberta** (em `33 - Processo de Cotação`), com pelo menos um fornecedor já participante e prazo de validade vigente.
- Um segundo fornecedor cadastrado e habilitado a receber convite.
- Credencial de **comprador** (matrícula resolvida no ERP) e credencial de **fornecedor**.
- **Bloqueio:** duplo. (1) a conta de QA não resolve matrícula de comprador — o Portal do Comprador registra `Comprador não encontrado` e as grades voltam vazias; (2) não há credencial de fornecedor para exercer a outra ponta.

**Passos**
1. Abrir **Portal do Comprador › Controle De Cotações** e localizar a cotação em aberto.
2. Incluir um novo participante (fornecedor) na cotação.
3. Confirmar que o novo participante passa a constar na lista de participantes da cotação.
4. Entrar no **Portal do Fornecedor** com a credencial do participante recém-incluído e enviar/atualizar a proposta (valores e quantidades).
5. Voltar ao **Portal do Comprador › Avaliação de Propostas** e localizar a cotação pelas colunas `Núm. Cotação`, `Número da SC` ou `Nº. Proc. Fluig`.
6. Conferir a proposta do novo participante e a atualização enviada, sem definir vencedor.

**Resultado esperado**
- O participante incluído depois da abertura da cotação recebe acesso e consegue enviar proposta.
- A proposta enviada/atualizada pelo participante aparece na *Avaliação de Propostas* com o valor efetivamente enviado (coluna `Valor Final`).
- A atualização de proposta substitui a versão anterior sem apagar as propostas dos demais participantes.
- A inclusão do participante fica registrada no Histórico da solicitação.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `<não documentado>` — o ticket registra apenas *"não foi implementado da maneira correta, incluir participante e depois atualizar proposta"*, sem sintoma nem mensagem. Sinal observável a monitorar: participante incluído após a abertura não recebe a cotação, ou a atualização da proposta não é refletida na *Avaliação de Propostas*.

**Severidade:** Média *(bloqueia a participação de fornecedor numa cotação em curso; com proposta desatualizada visível ao comprador, sobe para Alta)*

**Preparação de massa:** uma cotação em aberto com um participante, mais um segundo fornecedor com credencial de acesso ao Portal do Fornecedor — a ser preparada pelo time da CASSI, junto com um login de comprador com matrícula válida no Protheus.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o *Portal do Comprador* abre e expõe quatro acessos rápidos, com rotas reais `#/validacaoInicial`, `#/controleCotacao`, `#/avaliacaoPropostas` e `#/propostaVencedora`. **Controle De Cotações** carrega com botão *Filtrar* e "Página 1 de 0 — Nenhum dado encontrado". **Avaliação de Propostas** carrega a grade com as colunas `Status`, `Núm. Cotação`, `Filial`, `Número da SC`, `Nº. Proc. Fluig`, `Tip. Documento`, `Parecer Téc.`, `Em Alçada`, `Dt. Validade`, `Valor Final`, também sem dados. O *Portal do Fornecedor* abre com o heading *Bem vindo ao Portal de Compras e Contratações!* e os botões **Acesso Normal**, **Acesso Administrador** e **Acesso via Representatividade**. No formulário da SC existe a seção *Validação do Comprador (Definir Negociação)*, com a grade `Nº Proposta | Nº Versão | Fornecedor | Status Area Dem. | Status Area TI. | Negociação?`.
**Divergências encontradas:** não encontrei, em nenhuma das telas acessíveis, um comando explícito de **"incluir participante"** — o Controle De Cotações não renderizou nenhuma ação por estar sem dados. Com a conta de QA, as chamadas `getQuotesDhuERP` e `getEvalQuotesDhuERP` respondem **404** e o console registra `Comprador não encontrado`, de modo que nenhuma cotação é listada.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3555  (fluig · Concluído)

**Título:** Alterar a quantidade de um item pelo Portal do Fornecedor e confirmar que a quantidade nova aparece para o comprador e no formulário da SC.

**Origem:** FSWTBC-3555 — alteração de quantidade feita no **Portal do Fornecedor** não era refletida no **Portal de Compras**: o comprador continuava vendo o valor antigo e decidia sobre dado desatualizado. Aberto e fechado no mesmo dia (17/12/2025), **sem comentário técnico nem causa raiz**; a evidência são três prints comparando as duas telas.

**Módulo/Rota:** (a) *Portal do Fornecedor* (`/portal/p/1/portal_fornecedor`) › proposta da cotação — formulário *Cotação de Produtos/Serviços*, grade **Lista de Produtos/Serviços**, coluna **Qtde.**; (b) *Portal do Comprador* › **Avaliação de Propostas** (`#/avaliacaoPropostas`) e **Definir Vencedor Cotação** (`#/propostaVencedora`), modal **Definir Quantidade**; (c) *Solicitação de Compras* › seção **Aprovação de Alçada** › card **Itens da Proposta Vencedora**.

**Pré-condições**
- Uma cotação aberta (atividade `33 - Processo de Cotação`) com ao menos um fornecedor participante e prazo de proposta vigente.
- Credencial de **fornecedor** participante da cotação.
- Credencial de **comprador** com matrícula resolvida no ERP (`Y1_USER` válido).
- **Bloqueio:** duplo e conhecido. (1) Não há credencial de fornecedor nesta rodada; (2) a conta de QA não resolve matrícula de comprador — o console do Portal do Comprador registra `Comprador não encontrado` e todas as grades voltam **"Nenhum dado encontrado"**. As duas pontas do caso ficam inacessíveis para execução real.

**Passos**
1. Como **fornecedor**, abrir a cotação no Portal do Fornecedor e, na grade **Lista de Produtos/Serviços**, alterar a **Qtde.** de um item (ex.: de 10 para 8). Anotar item, quantidade anterior e nova.
2. Enviar/atualizar a proposta.
3. Como **comprador**, abrir *Portal do Comprador › Avaliação de Propostas*, localizar a cotação pelas colunas `Núm. Cotação` / `Número da SC` / `Nº. Proc. Fluig` e acionar a ação de linha **Analisar Cotação**.
4. Conferir, no detalhe da proposta do fornecedor, a **Quantidade** do item alterado.
5. Ir a **Definir Vencedor Cotação**, abrir o modal **Definir Quantidade** do item e conferir que o valor exibido é o enviado pelo fornecedor.
6. Abrir a solicitação no Fluig e, na seção **Aprovação de Alçada**, conferir o card **Itens da Proposta Vencedora** (campos *Item*, *Unidade de Medida*, *Quantidade*, *Preço Unitário*, *Vlr. Total*).
7. Não definir vencedor e não movimentar a solicitação.

**Resultado esperado**
- A quantidade exibida ao comprador na *Avaliação de Propostas* é **exatamente** a última enviada pelo fornecedor, sem necessidade de recarregar ou reabrir a cotação.
- O modal **Definir Quantidade** abre com a quantidade vigente do item, não com a original da SC.
- No card **Itens da Proposta Vencedora** da SC, o campo *Quantidade* mostra a **quantidade auditada** quando a alteração foi aprovada (`aprovAuditoria = true` → exibe `qtdAuditoria`) e a quantidade original quando não houve alteração aprovada.
- O *Vlr. Total* do item é recalculado sobre a quantidade nova, e o total da proposta acompanha.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Divergência entre as duas telas: o Portal do Fornecedor mostra a quantidade nova e o Portal de Compras continua exibindo a **quantidade antiga** (é isso que os três anexos do ticket comparam lado a lado). Nenhuma mensagem de erro é apresentada — o comprador não tem como perceber que está vendo dado desatualizado.

**Severidade:** Alta *(decisão de compra tomada sobre quantidade desatualizada de fornecedor externo tem efeito contratual e financeiro direto)*

**Preparação de massa:** uma cotação em aberto com um fornecedor participante e prazo de proposta vigente, mais **duas credenciais** que a conta de QA não possui: um login de fornecedor participante e um login de comprador com matrícula válida no Protheus. Sem as duas, o caso não é executável — nenhuma das pontas do fluxo é acessível.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o *Portal do Fornecedor* abre (`Bem vindo ao Portal de Compras e Contratações!`, botões **Acesso Normal**, **Acesso Administrador**, **Acesso via Representatividade**). O formulário *Cotação de Produtos/Serviços* tem a grade **Lista de Produtos/Serviços** com as colunas `Item | Código | Descrição | Qtde. | Un. Med. | Código do Grupo | Grupo do Produto/Serviço | Dt. Prev. Entrega | Fil. Entrega | Valor Unit. | Desconto | Aliq. IPI | Valor Total | Valor Frete | Observação do fornecedor`. No *Portal do Comprador*, as grades de **Avaliação de Propostas** e **Definir Vencedor Cotação** renderizaram as colunas `Status | Núm. Cotação | Filial | Número da SC | Nº. Proc. Fluig | Tip. Documento | Parecer Téc. | Em Alçada | Dt. Validade | Valor Final`, ambas com **"Nenhum dado encontrado"**. No **código publicado** do widget (bundle `main.js` do Portal do Comprador) estão o modal **Definir Quantidade**, o campo `C8_XQTAUDI` (quantidade auditada) e a flag `C8_XVENC`; e no código do formulário da SC (`sc_App_ViewHandler.js`, `handleMountSupplierItemAuthority`) o card **Itens da Proposta Vencedora** exibe `aprovAuditoria === "true" ? qtdAuditoria : quantidade` — ou seja, a quantidade auditada substitui a original quando a alteração foi aprovada. **Isso foi lido no fonte publicado, não visto renderizado** (não há massa).
**Divergências encontradas:** o ticket fala em "Portal de Compras"; na tela o nome é **Portal do Comprador**. O mecanismo de propagação da alteração de quantidade não é uma cópia direta: existe um par `qtdAuditoria`/`aprovAuditoria` (no ERP, `C8_XQTAUDI`), de modo que a quantidade nova **só** passa a ser exibida depois de aprovada a auditoria — nuance que o ticket não menciona e que muda o resultado esperado do teste.
**Dados/massa usados:** nenhum — não submetido. Leitura de tela do Portal do Fornecedor e do Portal do Comprador (grades vazias) e leitura dos fontes publicados dos widgets/formulários.

---

## CT-FSWTBC-3781  (ambos · Concluído · SDCASSI-233)

**Título:** Conceder a um participante do processo de Recepção de Documentos Fiscais o acesso de apenas visualizar a Documentação Obrigatória, sem poder alterá-la.

**Origem:** FSWTBC-3781 — duas perguntas do cliente: é possível incluir a opção **"visualizar"**? E o
book fica visível para todos os participantes da Recepção do Documento Fiscal ou só para o Fiscal de
Contratos? Resposta: "visualizar" é possível **mas entra como melhoria**; a visibilidade é
**parametrizada pela página no Fluig e no Protheus**, alterável por regra de acesso.

**Módulo/Rota:** Fluig → **Portal do Fornecedor** (`/portal/p/1/portal_fornecedor`) e páginas do
**Portal de Compras e Contratos**; processos **RDFC - Recepção de Documentos Fiscais** (existem
cinco publicados: *Compras*, *Contratos*, *Comprador - Compras*, *Demandantes - Compras*,
*Fiscal - Contratos*). Configuração: **permissões da página** no Fluig.

**Pré-condições**
- Perfil de **administrador do Fluig** para editar as permissões da página.
- Um usuário participante do RDFC que **não** seja Fiscal de Contratos, para testar a leitura.
- **Bloqueio:** não há perfil de administrador nem credencial de fornecedor. E a opção "visualizar"
  **ficou registrada como melhoria, sem ticket correspondente aberto** — então o caso testa o que
  existe (o controle por permissão de página), não uma opção "visualizar" entregue.

**Passos**
1. *(Admin — bloqueado)* Nas permissões da página que exibe a Documentação Obrigatória, conceder a um
   usuário/grupo apenas **leitura**.
2. Entrar com esse usuário e abrir a página.
3. Conferir que a documentação é **exibida**.
4. Tentar acionar qualquer ação de alteração/envio/exclusão de documento.
5. Entrar com o **Fiscal de Contratos** e abrir a mesma página.
6. Entrar com um usuário **sem** permissão nenhuma e abrir a mesma página.

**Resultado esperado**
- Passo 3: o usuário com leitura **vê** a documentação do contrato.
- Passo 4: nenhuma ação de alteração está disponível — e, se estiver visível, é recusada com
  mensagem clara (não silenciosamente).
- Passo 5: o Fiscal de Contratos mantém o acesso completo que já tinha — a parametrização de leitura
  para terceiros **não** pode reduzir o acesso dele.
- Passo 6: o usuário sem permissão **não** vê a documentação (e não recebe tela em branco: recebe
  negativa explícita).

**Resultado se o defeito reincidir**
- *(o ticket não reporta defeito — é consulta de escopo/permissão)* O sintoma a vigiar é o oposto:
  a documentação obrigatória **visível para todos os participantes** do RDFC sem que a permissão da
  página tenha sido concedida, ou um participante com leitura conseguindo **alterar** documento.

**Severidade:** Baixa *(pedido de melhoria e esclarecimento de parametrização; o risco de acesso
indevido, se a parametrização falhar, seria Alto e é o que o passo 6 cobre)*

**Preparação de massa:** um contrato com documentação obrigatória cadastrada, três contas distintas
(leitura, Fiscal de Contratos, sem acesso) e um administrador do Fluig para configurar as permissões
da página. Nenhuma dessas contas está disponível nesta rodada.

**Verificado em tela:** PARCIAL
**O que foi verificado:** os **cinco processos RDFC** estão publicados e aparecem no catálogo com os
nomes *RDFC - Recepção de Documentos Fiscais - Compras*, *- Contratos*, *- Comprador - Compras*,
*- Demandantes - Compras* e *- Fiscal - Contratos*. O **Portal do Fornecedor** abre na tela de
escolha de acesso, com os botões **Acesso Normal**, **Acesso Administrador** e **Acesso via
Representatividade**.
**Divergências encontradas:**
1. **O texto explicativo do Portal do Fornecedor não menciona documentos.** Ele descreve o
   "**Acesso Básico**" e o "Acesso Administrador" como permissões de "envio de cotações, envio de
   negociações e envio de notas" — **não** cita book, documentação obrigatória ou envio de
   documentos, que é o objeto da DEM10014383.
2. O botão diz **"Acesso Normal"** mas o texto acima dele chama o mesmo perfil de **"Acesso
   Básico"** — dois nomes para a mesma coisa, na mesma tela.
3. O terceiro botão, **"Acesso via Representatividade"**, não é descrito em lugar nenhum do texto.
4. A opção "visualizar" **não foi entregue** e não há ticket de melhoria aberto — o caso não pode
   afirmar sobre ela.
**Dados/massa usados:** nenhum — nenhuma permissão alterada, nenhum login de fornecedor feito.

---

## CT-FSWTBC-3782  (ambos · Concluído · SDCASSI-232)

**Título:** Ver, no Portal do Fornecedor, a documentação obrigatória cadastrada no contrato que o fornecedor precisa enviar.

**Origem:** FSWTBC-3782 — o contrato **00005-2023-3501** tem o **book 103** cadastrado, mas ele não
aparecia no Portal do Fornecedor. Sem isso, a automação de envio do book (objeto da DEM10014383) não
funciona para aquele contrato. Corrigido em dois dias com "Ajustado, favor validar", sem causa raiz e
sem varredura por outros contratos afetados.

**Módulo/Rota:** Fluig → **Portal do Fornecedor** (`/portal/p/1/portal_fornecedor`) → **Acesso
Normal** → área de documentação do contrato. Apoio: **Acompanhamento de Contratos** →
ícone **Informações do Contrato**.

**Pré-condições**
- Credencial de **fornecedor** correspondente ao fornecedor do contrato `00005-2023-3501`
  (**11724159 - 0001**).
- Book/documentação obrigatória **103** vinculado ao contrato (campo `CN9_XBOOK` no Protheus).
- **Bloqueio:** não há credencial de fornecedor. A tela do Portal do Fornecedor para no seletor de
  acesso e a chamada `/cassi_rest/api/rest/cassi/compras/1/verifyAutenticateToken` responde
  **401** com a conta de QA. O vínculo `CN9_XBOOK` só é conferível no Protheus.

**Passos**
1. No Fluig, abrir **Acompanhamento de Contratos** e localizar `00005-2023-3501`; confirmar
   **Status = Vigente** e o fornecedor.
2. Abrir o ícone **Informações do Contrato** e conferir os campos da seção de integração
   (*Status da Integração GCT*, *Erro de Integração*, *Fiscal de Serviço*).
3. Abrir o **Portal do Fornecedor** e entrar com a credencial do fornecedor **11724159 - 0001**
   via **Acesso Normal**.
4. Localizar o contrato `00005-2023-3501` na lista de contratos do fornecedor.
5. Abrir a documentação obrigatória do contrato.
6. Repetir os passos 3–5 para pelo menos mais um contrato do mesmo fornecedor **e** para um contrato
   de outro fornecedor com documentação vinculada — a varredura que o ticket não registrou.

**Resultado esperado**
- Passo 4: o contrato `00005-2023-3501` aparece na lista do fornecedor.
- Passo 5: a **documentação obrigatória 103** é exibida, com os documentos que o fornecedor precisa
  enviar.
- Passo 6: nenhum contrato com documentação vinculada fica sem exibi-la no portal.
- Se o contrato não tiver documentação vinculada, o portal informa isso explicitamente — não mostra
  a área vazia sem explicação.

**Resultado se o defeito reincidir**
- O contrato tem o **book 103** cadastrado no Protheus mas **ele não aparece** no Portal do
  Fornecedor (é exatamente o par de prints anexado ao ticket: cadastrado no contrato, ausente no
  portal), e o fornecedor não tem por onde enviar os documentos.

**Severidade:** Média *(bloqueia o fluxo de envio do book para o contrato afetado)*

**Preparação de massa:** credencial do fornecedor **11724159 - 0001** no Portal do Fornecedor e o
book **103** vinculado ao contrato `00005-2023-3501` no `CN9_XBOOK`. Nada disso é criável a partir do
Fluig com a conta disponível — **é o que falta para este caso fechar**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o contrato **existe nesta base**. Linha lida em Acompanhamento de
Contratos: **`3501 | 044 - MAO DE OBRA TERCEIRIZADA | 00005-2023-3501 | 13/03/2023 | 12/03/2028 |
019 | Vigente | 11724159 - 0001`**. O Portal do Fornecedor abre (título do documento *"Cassi - Fluig
Plataforma - Portal do Fornecedor"*) e para na tela **"Selecione o tipo de acesso."**.
**Divergências encontradas:**
1. Baixei e vasculhei os **68 arquivos JS servidos pela página do Portal do Fornecedor** (incluindo
   `PORTAL_FORNECEDOR_TOTVS_V2.js`, 45.982 b): **nenhuma ocorrência de "Book", "Trabalhista",
   "Documentação Obrigatória" ou "XBOOK"** fora do ruído de bibliotecas (`datatables`, `kendo`).
   Ou seja: o que existe antes do login **não** carrega a área de documentação — ela vem depois da
   autenticação do fornecedor, e sem credencial não há como afirmar mais nada.
2. O ticket cita o "book 103"; a tela do Fluig acessível não expõe esse número em lugar nenhum.
**Dados/massa usados:** contrato **00005-2023-3501** — apenas consultado, nada alterado; nenhum
login de fornecedor tentado.

---

## CT-FSWTBC-3789  (ambos · Concluído · SDCASSI-237)

**Título:** Encontrar a nomenclatura "Documentação Obrigatória" nos três pontos onde antes se lia "Book Trabalhista".

**Origem:** FSWTBC-3789 — alterar o nome de **"Book Trabalhista"** para **"Documentação
Obrigatória"** em três pontos: o **Portal de Compras e Contratos (Fluig)**, o **Portal do
Fornecedor** e o campo **CN9_XBOOK** do Protheus. Executado em dois dias, com uma reabertura no dia
seguinte (provavelmente para completar um dos três pontos).

**Módulo/Rota:** Fluig → **Portal de Compras e Contratos** e **Portal do Fornecedor**
(`/portal/p/1/portal_fornecedor`) · Protheus → dicionário, rótulo do campo **CN9_XBOOK**.

**Pré-condições**
- Credencial de fornecedor (para o ponto 2) e acesso ao dicionário do Protheus (para o ponto 3).
- **Bloqueio:** os **três** pontos estão fora de alcance nesta rodada. O ponto 1 exige saber em qual
  página do Portal de Compras e Contratos o rótulo aparece — o ticket não diz; o ponto 2 exige login
  de fornecedor; o ponto 3 exige o Protheus.

**Passos**
1. Abrir as páginas do **Portal de Compras e Contratos** onde a documentação do contrato é exibida e
   procurar o texto **"Documentação Obrigatória"**.
2. Na mesma varredura, procurar o texto antigo **"Book Trabalhista"** (e a palavra "Book" isolada).
3. Entrar no **Portal do Fornecedor** com credencial de fornecedor e repetir 1 e 2 na área de
   documentos.
4. *(Protheus — bloqueado)* No dicionário, conferir o **título e a descrição do campo CN9_XBOOK**.
5. Conferir que a alteração do dicionário foi entregue a **todos** os ambientes (o próprio ticket
   registra que esse é um ponto historicamente frágil neste projeto).

**Resultado esperado**
- Nos três pontos lê-se **"Documentação Obrigatória"**.
- **Nenhuma** ocorrência remanescente de "Book Trabalhista" em rótulo, título de coluna, cabeçalho,
  tooltip, mensagem ou e-mail.
- O rótulo do **CN9_XBOOK** está atualizado em todos os ambientes que receberam o pacote.

**Resultado se o defeito reincidir**
- Alguma das três superfícies volta a exibir **"Book Trabalhista"** — o que induz o usuário a achar
  que só documentos trabalhistas são exigidos, quando o conjunto é mais amplo. É o caso típico de
  correção parcial: dois pontos renomeados e um esquecido (o ticket teve **uma reabertura no dia
  seguinte**, sinal de que isso já aconteceu uma vez).

**Severidade:** Baixa *(apresentação; mas o risco de entrega parcial do dicionário entre ambientes é
o mesmo que causou o FSWTBC-3757)*

**Preparação de massa:** nenhuma massa de negócio; é preciso **acesso** — fornecedor, administrador
do Portal de Compras e Contratos e dicionário do Protheus. E é preciso que alguém informe **em quais
páginas** o rótulo aparece, porque o ticket não lista.

**Verificado em tela:** NÃO
**O que foi verificado:** varri o que está ao alcance e **não encontrei nenhum dos dois nomes**.
Busca sem distinção de maiúsculas por `Book Trabalhista`, `Trabalhista`, `Documentação Obrigatória`,
`CN9_XBOOK` e `XBOOK` em: `form_sc.html`, `form_cot.html`, `form_fat.html`, os fontes publicados dos
formulários **256831/256832/256835/256836**, o bundle do **Portal do Comprador** (`pc_main.js` +
componentes), o `wAcompanhaContratos` e os **68 JS do Portal do Fornecedor** — **zero ocorrências**
de qualquer um dos termos (as ocorrências de "book" são todas de `SheetJS`/`kendo`: `workbook`,
`bookType`, `book_new`).
**Divergências encontradas:**
1. **Não consegui confirmar nem o nome antigo nem o novo em nenhuma superfície acessível.** Isso é
   consistente com duas hipóteses que não sei distinguir sem acesso: ou o rótulo vive **atrás do
   login do fornecedor** (área não servida antes da autenticação), ou vive **no Protheus** e chega ao
   Fluig apenas como dado. **Não afirmo que a correção foi feita nem que não foi** — afirmo que ela
   não é auditável a partir do Fluig com esta conta.
2. O ticket não nomeia a página do Portal de Compras e Contratos onde o rótulo aparecia, o que impede
   escrever um passo específico. Sem isso, o passo 1 é uma varredura, não uma verificação.
**Dados/massa usados:** nenhum — só leitura de fonte publicado.

---

## CT-FSWTBC-4245  (ambos · Concluído · SDCASSI-326)

**Título:** Fornecedor reenvia proposta depois que a SC volta para "Aguarda Finalizar Cotação" por reprovação de parecer, e o comprador ainda vê o Parecer Técnico na nova cotação

**Origem:** FSWTBC-4245 — após reprovação na *Validação do Parecer Técnico*, a SC 10370 voltou a *Aguarda Finalizar Cotação* mas o fornecedor não conseguia enviar cotação no Portal do Fornecedor (regra padrão: participante já incluído só pode enviar NOVA proposta); na nova cotação o botão de Parecer Técnico deixou de ser exibido. Encerrado **Não Contratado** — o ciclo permanece quebrado. **Reprova hoje por causa nunca corrigida.**

**Módulo/Rota:** *Processos › Solicitação de Compras* (`pageworkflowview?processID=wf_solicitacao_compras`, etapa 161 *Aguarda Finalizar Cotação*) › Portal do Fornecedor (`/portal/p/1/portal_fornecedor`) › Portal do Comprador › **Avaliação de Propostas** › cartão da proposta › **Verificar Parecer Técnico**

**Pré-condições**
- Uma SC com cotação disponibilizada no Portal, com ao menos um fornecedor participante que já enviou proposta 01.
- Parecer técnico emitido para essa proposta e **reprovado** na etapa 7 *Validação do Parecer Técnico* do `wf_solicitacao_compras_parecer`.
- Credencial de fornecedor participante e credencial de comprador (grupo de Compras).
- **Bloqueio:** sem credencial de fornecedor (tela *"Selecione o tipo de acesso."* exige token próprio, `verifyAutenticateToken` → 401); conta de QA não é comprador (*"Comprador não encontrado."*); não há como reprovar parecer sem parecerista.

**Passos**
1. No Fluig, abra a SC (Central de Tarefas ou Tracker › *Solicitação de Compras* › **Pesquisar Registro**) e confirme no histórico que a etapa atual é **Aguarda Finalizar Cotação** (seq. 161) logo após o *Fim com cancelamento de processo* (13) do parecer reprovado.
2. Como fornecedor, entre em `/portal/p/1/portal_fornecedor` › **Acesso Normal**, localize a cotação e envie uma **nova proposta (02)** com os mesmos itens.
3. Como comprador, abra *Portal do Comprador › Avaliação de Propostas*, localize a cotação e abra o cartão da proposta 02.
4. Verifique se o botão **Verificar Parecer Técnico** está visível e habilitado no cartão; clique e confirme que o modal *Selecionar Parecer Técnico* lista o processo de parecer.

**Resultado esperado**
- O Portal do Fornecedor aceita a proposta 02 do participante já incluído — sem mensagem de bloqueio de participação repetida.
- A SC sai de *Aguarda Finalizar Cotação* (161) para *Cotação foi Finalizada?* (150) quando o comprador finaliza.
- O cartão da nova proposta exibe **Verificar Parecer Técnico** e abre o parecer vinculado (coluna **Parecer Téc.** = *Sim*).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Fornecedor bloqueado de enviar cotação; SC parada em *Aguarda Finalizar Cotação* "sem saída pela interface".
- Na nova cotação, o botão de Parecer Técnico não é exibido (print de 02/04/2026).

**Severidade:** Alta — bloqueia o fluxo de compra e apaga a etapa de parecer técnico (aprovação).

**Preparação de massa:** uma SC com cotação publicada, proposta 01 enviada por fornecedor de teste e parecer reprovado por um parecerista; criada pelo executor com prefixo `QA` na justificativa. Exige três perfis (solicitante, fornecedor, parecerista/comprador) que a conta de QA não tem.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *visto renderizado* — Portal do Fornecedor (tela de tipo de acesso), Portal do Comprador › Avaliação de Propostas (grade vazia por 404 do `genericQuery` DHU). *Confirmado por dado* — etapa **161 "Aguarda Finalizar Cotação"** existe nas v95/v97/v98 (21 movimentos) e o processo de parecer tem *Emitir Parecer Técnico* (5), *Validação do Parecer Técnico* (7) e *Fim com cancelamento de processo* (13). *Lido no fonte publicado* — botão **Verificar Parecer Técnico** existe no cartão da proposta sob `ngIf` (condição de exibição, não lida), coluna **Parecer Téc.** Sim/Não na grade.
**Divergências encontradas:** o ticket fala em "botão de Parecer Técnico"; na tela o rótulo é **Verificar Parecer Técnico** (cartão) e a coluna é **Parecer Téc.** O status "Aguarda Finalizar Cotação" é o nome da etapa 161 do BPM, não um status do Portal.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4273  (fluig · Concluído · SDCASSI-331)

**Título:** Fazer o fornecedor movimentar a cotação sem alterar valor e confirmar que o portal explica, com mensagem, por que a proposta anterior não pode mais ser validada.

**Origem:** FSWTBC-4273 — erro na negociação da **proposta 02** (sem alteração de valor) e falha na validação da **proposta 01**, na **SC 10504**. O esclarecimento de Paulo Calixto expôs uma característica **de desenho**, não um defeito de código: **toda** movimentação feita pelo Portal do Fornecedor é interpretada pelo Fluig como **nova proposta**, com incremento automático do número. Uma ação do fornecedor que não altera valor nenhum ainda assim cria a "proposta 02", e a validação da proposta 01 passa a falhar porque ela **já não é a corrente**. A Equipe de Compras concluiu que *"não é impacto no processo"* e autorizou o encerramento **sem correção**.

> **Este caso tem polaridade invertida em relação aos demais do lote.** Ele **não** afirma o comportamento desejado — afirma o **comportamento real medido**. Ele fica **verde** enquanto o incremento automático continuar existindo, e fica **vermelho** no dia em que esse comportamento **mudar**, inclusive para melhor. Um vermelho aqui significa **"reabra o assunto"**, nunca "regressão".

**Módulo/Rota:** **Portal do Fornecedor** (`/portal/p/1/portal_fornecedor`) para a movimentação, e **Portal do Comprador** › **Avaliação de Propostas** (`#/avaliacaoPropostas`) para observar o efeito. Processo `wf_negociacao_cotacao_prod_serv`.

**Pré-condições**
- Uma cotação com **proposta 01** já enviada por um fornecedor e ainda pendente de validação pelo comprador.
- **Credencial de fornecedor** para movimentar pelo Portal do Fornecedor.
- Conta de comprador responsável para observar o efeito.
- **Bloqueio:** sim, duplo. (a) **Não há credencial de fornecedor disponível** — é limite declarado da conta. (b) A conta de QA não resolve matrícula de comprador, então a *Avaliação de Propostas* não lista a cotação.

**Passos**
1. Como **comprador**, abrir **Avaliação de Propostas**, localizar a cotação e anotar o número da proposta corrente (**01**).
2. Como **fornecedor**, no Portal do Fornecedor, abrir a cotação e fazer uma movimentação **sem alterar nenhum valor** (reenviar a proposta como está).
3. Como **comprador**, recarregar **Avaliação de Propostas** e abrir a mesma cotação.
4. Conferir qual é agora o número da proposta corrente.
5. Tentar **Validar Proposta** sobre a **proposta 01** (a antiga).
6. Ler a mensagem exibida.
7. Tentar **Negociar** sobre a **proposta 01**.
8. Ler a mensagem exibida.
9. Validar a proposta **corrente** e confirmar que a ação é aceita.

**Resultado esperado** *(comportamento real de hoje, afirmado como está)*
- Passo 4: existe agora a **proposta 02**, criada pela movimentação do fornecedor **mesmo sem alteração de valor**. O incremento é automático e por desenho.
- Passo 6: a tentativa de validar a proposta 01 é recusada **com mensagem explícita**: **"Não é possível aprovar essa proposta, pois existe uma proposta mais recente para esse fornecedor."**
- Passo 8: a tentativa de negociar a proposta 01 é recusada com **"Não é possível negociar essa proposta, pois existe uma proposta mais recente para esse fornecedor."**
- Em **nenhum** dos dois casos há falha silenciosa: o comprador entende **por que** a ação foi barrada e **o que fazer** (atuar sobre a proposta corrente).
- Passo 9: a proposta **corrente** é validada normalmente.

**Resultado se o comportamento mudar** *(o que este caso está protegendo)*
- Se o passo 4 mostrar que **continua na proposta 01** — ou seja, se a movimentação sem alteração de valor deixar de incrementar —, o desenho mudou e este caso deve ser **reavaliado**, não "consertado".
- Se os passos 6 e 8 voltarem a falhar **sem mensagem** (que é o sintoma original do ticket: *"erro na negociação da proposta 02 e falha na validação da proposta 01"*, com o motivo invisível ao usuário), aí sim é **regressão** de usabilidade e deve ser reportada.

**Severidade:** Média *(por si só não corrompe dado — o encerramento pela área de negócio como "sem impacto no processo" é defensável. O risco real é operacional: o comprador trabalha sobre uma proposta que já não é a corrente e não entende a recusa, o que gera chamado recorrente)*

**Preparação de massa:** uma cotação com proposta 01 enviada e pendente de validação, **mais credencial de fornecedor** com acesso àquela cotação no Portal do Fornecedor. **Nada disso está disponível para a conta de QA.** **Pendência de documentação, não de teste:** a análise do ticket registra que este comportamento *"deveria estar em manual de uso"* e não está — enquanto não estiver, o mesmo relato volta de outros usuários, e nenhum caso de teste evita isso.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — `/portal/p/1/portal_fornecedor` abre com a chamada *"Bem vindo ao Portal de Compras e Contratações!"* e os três botões de entrada **Acesso Normal**, **Acesso Administrador** e **Acesso via Representatividade**; a autenticação do portal responde **401** em `/cassi_rest/api/rest/cassi/compras/1/verifyAutenticateToken` para a conta de QA, o que confirma que **não há credencial de fornecedor**. O processo `wf_negociacao_cotacao_prod_serv` existe e abre. *Lido no fonte publicado* — no bundle do Portal do Comprador, tanto `aprovarNegociacao` quanto `enviarPNegociacao` começam chamando `quotesService.isTheLastedProposeSupplier({filial, numQuote, propose: C8_NUMPRO}, {codeSupplier, storeSupplier})` e, **quando a proposta não é a mais recente daquele fornecedor**, interrompem a ação exibindo exatamente as duas mensagens transcritas no resultado esperado. **Nenhuma proposta foi enviada, validada ou negociada.**
**Divergências encontradas:** o ticket foi encerrado **sem investigação** e a pergunta de Paulo sobre **como** a movimentação foi feita nunca foi respondida — então o cenário do passo 2 ("movimentação sem alterar valor") é a **hipótese** registrada no ticket, não um fato reproduzido. Divergência de conteúdo: o ticket descreve o sintoma como "erro" e "falha", sugerindo defeito; o fonte publicado mostra que hoje há **guarda explícita e mensagem clara** para os dois casos. Ou seja, **o que existe hoje é melhor do que o ticket descreve** — o que reforça que este caso deve ser lido como caracterização do comportamento atual, e não como reprodução do defeito.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4298  (ambos · Concluído · SDCASSI-336)

**Título:** Fornecedor aprovado reenvia proposta com valor menor após "Retornar para Negociação" e a nova proposta entra sem erro

**Origem:** FSWTBC-4298 — após reprovação de alçada com retorno para negociação, o fornecedor Paper Shop reenviou proposta com valor menor e o sistema deu erro *"C8_PRODUTO não preenchido"* (chave de busca usando `C8_FORNOME`) e o Fluig recebia `{"result":null}` sem mensagem. Corrigido 16/04/2026 (UCOME031). Ponto extra: anexo na *Validação do Comprador (Alçadas)* entra pelo botão "Anexar documentação pública".

**Módulo/Rota:** `wf_solicitacao_compras` 210 *Validação do Comprador (Alçadas)* → 172 *Aguarda Finalizar Negociação*; `wf_negociacao_cotacao_prod_serv` 6 *Notifica Fornecedor* → 8 *Recepção de Propostas* → 20 *Validação da Proposta*; Portal do Fornecedor; campo **Erro retornado pelo ERP Protheus** (formulário de Negociação).

**Pré-condições**
- SC com alçada **reprovada** e decisão de retornar para negociação; ao menos um fornecedor aprovado com proposta anterior.
- Credencial do fornecedor aprovado.
- **Bloqueio:** sem credencial de fornecedor nem de aprovador de alçada; conta QA não é comprador.

**Passos**
1. Confirme no histórico da SC a etapa **Aguarda Finalizar Negociação** (172) e, na instância de negociação, **Recepção de Propostas** (8).
2. Como fornecedor, no Portal do Fornecedor envie nova proposta com **valor unitário menor** que o anterior.
3. Como comprador, abra a instância de negociação e leia o campo **Erro retornado pelo ERP Protheus**; abra *Portal do Comprador › Avaliação de Propostas* e localize a nova proposta (**Nº Proposta** incrementado).
4. No histórico da negociação, confira a passagem por *Integração com ERP* (10/31) sem *Erro?* (36) → *Correção* (51).

**Resultado esperado**
- Nova proposta gravada com **Nº Proposta** seguinte, **Valor Unit.** menor e **Valor Final** recalculado.
- **Erro retornado pelo ERP Protheus** vazio; histórico sem *Correção*.
- Se a integração falhar por outro motivo, a mensagem do ERP é exibida (nunca `{"result":null}` silencioso).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro *"C8_PRODUTO não preenchido"* ao criar a proposta; Fluig sem mensagem (retorno nulo); negociação parada.

**Severidade:** Alta — trava a renegociação que a alçada existe para provocar.

**Preparação de massa:** SC com alçada reprovada e retorno para negociação; exige aprovador de alçada e fornecedor — não criável pelo executor sozinho.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *confirmado por dado* — etapas 172 (SC) e 6/8/20/22/24 + 10/31/34/36/51 (negociação v25). *Visto renderizado* — Portal do Fornecedor (só tela de acesso) e Avaliação de Propostas (grade vazia). *Lido no fonte publicado* — colunas **Nº Proposta, Quantidade, Valor Unit., Valor Frete, Valor Final**. Não foi aberto o formulário da SC na etapa 210 — o botão **"Anexar documentação pública"** citado no ticket fica `<não documentado>` nesta rodada.
**Divergências encontradas:** o rótulo de opção "Retornar para Negociação" não existe no bundle do Portal; a etapa real é **Aguarda Finalizar Negociação** (172). O campo de erro na Negociação é **Erro retornado pelo ERP Protheus** (na SC seria *Retorno Integração*).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4765  (ambos · Concluído · SDCASSI-453)

**Título:** Após os fornecedores representarem no Portal, conferir que a negociação sai de "Aguarda Movimentação Protheus" e chega à Central de Tarefas do comprador — não fica atribuída a "Administrador Cassi".

**Origem:** FSWTBC-4765 — SC 99106 movimentada para negociação; fornecedores representaram, mas o processo 102296 ficou em "Aguarda Movimentação Protheus" com responsável "Administrador Cassi", invisível na Central de Tarefas do usuário. Causa: erro no processamento da fila do ERP; resolvido por reprocessamento manual.

**Módulo/Rota:** `wf_negociacao_cotacao_prod_serv` (**34** "Aguarda Movimentação Protheus", **36** "Erro?", **20** "Validação da Proposta", **51** "Correção"); Tracker visão *NCPS* (Negociação) e *CPS*; Central de Tarefas → aba **Minhas Tarefas / Tarefas do grupo**; Portal do Fornecedor (`/portal/p/1/portal_fornecedor`).

**Pré-condições**
- SC de QA em negociação, com ≥ 1 fornecedor que já reenviou proposta pelo Portal do Fornecedor.
- **Bloqueio:** sem credencial de fornecedor nem de comprador; a falha de fila do ERP não é induzível a partir do Fluig.

**Passos**
1. Tracker → *Tipo* = NCPS → **Nº do Processo Fluig** da negociação → **Pesquisar Registro**: anotar *Atividade Atual* e *Responsável Atual*.
2. Fornecedor representa no Portal do Fornecedor.
3. Repetir o passo 1 a cada minuto por até 10 min.
4. Como comprador, Central de Tarefas → clicar explicitamente na aba desejada (a sub-aba é guardada por sessão no servidor) → localizar a tarefa **"Validação da Proposta"** da negociação.
5. Abrir a instância → Histórico → procurar "Integração executada com sucesso".

**Resultado esperado**
- "Aguarda Movimentação Protheus" (34) é transitória (minutos); a negociação segue para **Validação da Proposta** (20) com *Responsável Atual* = comprador (e-mail), nunca "Administrador Cassi".
- Se a fila do ERP falhar: gateway "Erro?" (36) leva a **Correção** (51) com responsável de grupo definido e mensagem — a instância não fica órfã numa conta de sistema.
- A tarefa aparece na Central de Tarefas do comprador.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Processo parado em "Aguarda Movimentação Protheus", responsável "Administrador Cassi", ausente da Central de Tarefas; só reprocessamento manual da fila resolve.

**Severidade:** Média

**Preparação de massa:** negociação de QA com fornecedor de teste e comprador de teste — exige credenciais que a conta de QA não tem.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *API* — mapa da negociação sobre 1.800 movimentos: 4 Início, 6 Notifica Fornecedor, 8 Recepção de Propostas, 10 Integração com ERP, **20 Validação da Proposta**, 22 Aprovado, 24 Fim, 31 Intermediário Integração com ERP, **34 Aguarda Movimentação Protheus (117 mov.)**, **36 Erro? (117)**, **51 Correção (1 mov.)**, 67 Continuar Cotação, 73 Enviado Portal?. Instância 102296 hoje: 24 "Aprovado" (Rui da Rocha Miranda Junior, 19/06) → 25 "Fim" (22/06) — recuperada. *Visto renderizado* — Tracker NCPS, *Status* = Abertos: **0 registros** hoje ("Nenhum registro encontrado"), colunas "Nº do Processo Fluig | Ações | Status | Solicitante | Data da Solicitação | Hora da Solicitação | Atividade Atual | Responsável Atual | Código da Filial | Nome da Filial | Nº da Cotação | Comprador | CNPJ/CPF | Razão social | Nome de Fantasia | Loja Fornecedor | Código Fornecedor | Tipo do Frete". Tracker CPS abertos: 3 em "Correção" com `fabricasoftware@totvs.com.br` e 12 em Recepção de Propostas (responsáveis compradores por e-mail).
**Divergências encontradas:** "Aguarda Movimentação Protheus" existe na negociação (34) e na cotação (42), **não** na SC — o ticket fala em "processo 102296" corretamente como negociação. A atividade **Correção (51)** da negociação só foi percorrida 1 vez em 1.800 movimentos: o caminho de erro quase não é exercitado; conferir se tem grupo atribuído (ponto de atenção dos achados).
**Dados/massa usados:** instância 102296, Tracker NCPS/CPS (só leitura).

---

## CT-FSWTBC-4826  (ambos · Concluído · SDCASSI-474)

**Título:** Receber uma proposta com quantidade fracionada mínima para um item inteiro e conferir que a validação usa a unidade/fracionamento do produto e a quantidade da SC — não a última proposta.

**Origem:** FSWTBC-4826 — SC 100813: quantidade do produto 1,000000; o fornecedor enviou 0,000006 na proposta; ao corrigir pelo Portal do Comprador, "ultrapassa a quantidade máxima". Conclusão: a precisão está **fixa em 6 casas** no Portal do Fornecedor; deveria vir de `B1_UM`/`B1_FRACPER`. **Encerrado sem correção.**

**Módulo/Rota:** Portal do Fornecedor (`/portal/p/1/portal_fornecedor`) → proposta → campo de quantidade; Portal do Comprador (`/portal/p/1/gerenciaCompras`) → **Avaliação de Propostas** / negociação → alteração de quantidade.

**Pré-condições**
- SC com item de quantidade 1 cujo produto tem `B1_UM` = UN e `B1_FRACPER` = não fracionável; cotação em *Recepção de Propostas*.
- Credenciais de fornecedor e de comprador.
- **Bloqueio:** sem credencial de fornecedor nem de comprador na conta de QA; **defeito sem correção** — o caso reprova hoje por causa nunca corrigida.

**Passos**
1. *(Fornecedor)* Abrir a proposta e informar quantidade `0,000006` para o item de quantidade 1.
2. *(Fornecedor)* Informar `0,5` no mesmo item (produto não fracionável).
3. *(Fornecedor)* Informar `1` e enviar.
4. *(Comprador)* Avaliação de Propostas → alterar a quantidade do item para `1`.
5. *(Comprador)* Alterar para `2`.

**Resultado esperado**
- Passos 1–2: quantidade recusada — o campo respeita `B1_UM`/`B1_FRACPER` (inteiro para UN não fracionável); a máscara não aceita 6 casas para produto inteiro.
- Passo 4: aceito — o limite é a quantidade da SC/cotação principal (1), não a última proposta (0,000006).
- Passo 5: recusado com mensagem de quantidade máxima (limite = 1).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Portal aceita `0,000006`; ao corrigir para 1 o comprador recebe "ultrapassa a quantidade máxima".

**Severidade:** Alta

**Preparação de massa:** cotação de QA com produto não fracionável e fornecedor de teste; revisão de cadastro `B1_UM`/`B1_FRACPER` pela CASSI (pendência registrada no ticket).

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Lido no fonte publicado* — no bundle do Portal do Comprador (`main.js`, 844.689 bytes) **não há** a string "ultrapassa"/"quantidade máxima": a crítica vem do servidor (dataset/ERP) ou do widget do Portal do Fornecedor; o Faturamento de Contratos (form 256836) usa `listDecimal.default = 6` para quantidade — a mesma precisão fixa de 6 casas do ticket, agora em outro formulário; nenhuma referência a `B1_FRACPER` nos bundles baixados (`main.js` do comprador, `l025_forn_*.js` do fornecedor), isto é, **o fracionamento por produto não é consultado no front**. *API* — SC 100813 encerrada 03/07/2026 ("Fim - Processo de Pagamento de Compras"). Nada renderizado (sem credenciais).
**Divergências encontradas:** a mensagem exata "ultrapassa a quantidade máxima" não foi localizada em fonte publicado do front — `<não documentado>` quanto à origem. Defeito ainda aberto na prática (encerrado "com possibilidade de novo ticket").
**Dados/massa usados:** SC 100813 (só leitura); nenhuma proposta enviada.

---

## Divergências ticket × tela consolidadas (L032)

| Ticket | O registro diz | O ambiente mostra (08/09/2026) |
|---|---|---|
| FSWTBC-4791 | processo 96842 aceitava 6 casas | 96842 é `bpm_recepcao_documentos_fiscais_contratos`, não Faturamento; não aparece na visão FC |
| FSWTBC-4771 | "cotação 100204" | 100204 é o nº do processo Fluig (CPS); a cotação ERP é 000090 |
| FSWTBC-4759/4816 | corrigido (parâmetro + campo na ZZZ) | fila travada hoje (3 FC há 22–25 dias); widget não expõe o campo novo; `genericQuery` 404 |
| FSWTBC-4712 | SC 97223 ficou aberta no Protheus | Tracker SC 97223: CANCELADA, cotação 000013, **Nº da Solicitação ERP vazio** |
| FSWTBC-4822 | campos do contrato não exibidos | SC 112830: campos **preenchidos** no formulário e no Tracker; visibilidade não mensurável pela sonda; SC 113196 com Tipo de Solicitação = `null` no Tracker |
| FSWTBC-4772 | SC 90527 corrigida | SC 90527 há 46 dias em "Aguarda Finalizar Negociação" com "Administrador Cassi" |
| FSWTBC-4765 | — | Correção (51) da negociação percorrida 1 vez em 1.800 movimentos; NCPS abertos = 0 hoje |
| A17-a (briefing) | datasets vazios | hoje os datasets do ERP respondem com dados no GET search; `dsProtheus_getInformaPlanxContrato_restGetAll` (nome "errado") **existe** e devolve `error:"undefined"` |

## CT-FSWTBC-5096  (ambos · Concluído · SDCASSI-524)

**Título:** Proposta com quantidade zero é recusada no ato do envio pelo fornecedor, e a negociação nunca é desviada para tratamento interno na CASSI

**Origem:** FSWTBC-5096 — SC 88408 (negociação com a QUITAQUI): a etapa de negociação era redirecionada a uma colaboradora da CASSI
em vez de voltar ao fornecedor. Uma proposta de 18/05 com `C8_QUANT: 0` (e preço 0,000689) foi aceita e passou a bloquear toda
proposta seguinte ("O campo Quantidade (C8_QUANT) não foi preenchido"); por a recusa só ocorrer no processamento, a etapa ia para
tratamento interno. Correção: recusar **no envio** (`{"code":"400","message":"Item 0002 (produto 04000002): quantidade deve ser
maior que zero…"}`) e corrigir o vínculo `C8_NUMPRO` portal × ERP, que fazia os valores do fornecedor serem descartados sem aviso.

**Módulo/Rota:** Portal do Fornecedor (`/portal/p/1/portal_fornecedor`, envio de proposta — sem credencial); processo
`wf_negociacao_cotacao_prod_serv`: *Notifica Fornecedor* (6) → *Recepção de Propostas* (8) → *Integração com ERP* (10) →
*Aguarda Movimentação Protheus* (34) → **Erro?** (36) → *Correção* (51) / *Validação da Proposta* (20). Formulário de Negociação
(256835): campo **Erro retornado pelo ERP Protheus**, colunas *Valor Unit.*, *Valor Total*, *Valor Frete*; totais *Valor total
do Pedido*, *Valor total de Descontos*.

**Pré-condições**
- Negociação aberta com o fornecedor notificado (*Recepção de Propostas*).
- Credencial de fornecedor para enviar proposta com um item de quantidade 0 — indisponível.
- **Bloqueio:** sem credencial de fornecedor. O efeito (para quem a etapa é direcionada, mensagem de recusa, valores aplicados) é
  observável no Histórico da negociação e no campo *Erro retornado pelo ERP Protheus* — caso de Fluig com bloqueio de perfil.

**Passos**
1. Como fornecedor, enviar proposta com um item de quantidade **0** (e outro válido).
2. Observar a resposta imediata do portal.
3. No Fluig, abrir a negociação em modo leitura → **Histórico**: conferir que a instância permanece em *Recepção de Propostas* (8)
   ou volta ao fornecedor — nunca segue para *Correção* (51) nem é atribuída a colaborador CASSI.
4. Reenviar a proposta corrigida (quantidade > 0) e conferir no formulário de Negociação que *Valor Unit.* / *Valor Total* dos
   itens são **os informados pelo fornecedor** (vínculo `C8_NUMPRO` correto), e que *Erro retornado pelo ERP Protheus* está vazio.
5. Cenário de regressão do vínculo: após uma recusa, o próximo envio válido deve aplicar os valores; se não conseguir, o Histórico
   deve registrar o aviso (a rotina "passa a sinalizar quando não conseguir aplicar os itens recebidos").

**Resultado esperado**
- Envio com quantidade 0 recusado **no ato**, com mensagem identificando item e produto ("Item 0002 (produto 04000002): quantidade
  deve ser maior que zero").
- Nenhuma proposta inválida gravada na cotação; propostas seguintes do mesmo fornecedor não são bloqueadas.
- Etapa nunca redirecionada para colaborador interno por proposta inválida; após reenvio válido, valores aplicados e visíveis no
  formulário da negociação.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Proposta com `C8_QUANT: 0` aceita; envios seguintes recusados com "O campo Quantidade (C8_QUANT) não foi preenchido"; negociação
  presa por meses (20/05 → 06/08) e etapa atribuída a pessoa da CASSI; valores da proposta descartados em silêncio.

**Severidade:** Alta

**Preparação de massa:** negociação aberta + credencial de fornecedor (indisponível). Não criar para forçar.

**Verificado em tela:** PARCIAL
**O que foi verificado:** (a) **agregado por dado** (12.000 movimentos da negociação) — 8 "Recepção de Propostas" (14 ativas),
10 "Integração com ERP", 20 "Validação da Proposta" (55 ativas), 34 "Aguarda Movimentação Protheus", **36 "Erro?"**, **51
"Correção"** (1 movimento, 24/08/2026), 67 "Continuar Cotação"; a seq. 62 tem **3 movimentos em 1 instância** (22/05 → 06/08),
nome não capturado nas 4.000 primeiras linhas; (b) via API, a **SC 88408** do ticket está hoje em *Aguarda Vigência do Contrato*
(332) desde 07/08 — passou por 177 → 309 → 310 → 94 em 07/08, ou seja, destravou após a correção de 07/08; (c) **lido no fonte
publicado** — o formulário de Negociação tem os rótulos *Nº da SC do ERP, Dt. Prev. Entrega, Valor Unit., Valor Total, Valor
Frete, Valor total do IPI, Valor total do Frete, Valor total de Descontos, Valor total do Pedido, **Erro retornado pelo ERP
Protheus***; o JS declara `activitys = { inicio: 4, notificaFornecedor: 6, recepcaoPropostas: 8, integracaoERP: 10,
aguardaMovimentacaoERP: 34, validacaoProposta: 20, validacaoComprador: 53, fimCancelamento: 69, notificaFornecedor2: 56,
ajusteProposta: 62, fim: 24 }`; não há crítica de quantidade zero no front do Fluig (0 ocorrências de "quantidade"/"C8_QUANT"
no HTML/JS da negociação) — a validação é do ERP no envio. Portal do Fornecedor não exercitado.
**Divergências encontradas:** o ticket fala em "ajuste do Fornecedor"; o JS chama a etapa de `ajusteProposta: 62` e a agregação
de hoje encontra a seq. 62 em 1 instância (3 movimentos) — o registro do ACHADOS ("62 não existe em 12.000 movimentos") **não se
sustentou nesta amostra**; o nome da atividade não foi obtido. A mensagem de recusa do ticket não existe no front — é resposta
do ERP ao portal.
**Dados/massa usados:** leitura de 88408 — nenhum — não submetido.

---

## CT-FSWTBC-5117  (fluig · Concluído · SDCASSI-526 · incidente 822551)

**Título:** Confirmar que a atividade de Ajuste de Negociação fica com o responsável gravado na própria proposta, e não sempre com a mesma pessoa.

**Origem:** FSWTBC-5117 / SDCASSI-526 — na SC **88408**, a atividade **"Ajuste de Negociação"** era sempre direcionada para a mesma pessoa (Adriana), quando deveria ser movimentada pelo **Portal do Fornecedor**. A resposta do time foi que o erro ocorreu em **processo antigo** e que o fonte atual, tanto na base TST quanto na master, já possui mecanismo de atribuição por **campo de formulário (`hd_atribuicao`)**. Aberto e concluído entre 10 e 11/08/2026. Complementa o SDCASSI-524, sobre a mesma SC e a mesma etapa.

**Módulo/Rota:** **Portal do Comprador › Avaliação de Propostas** (`#/avaliacaoPropostas`), painel de propostas por fornecedor — botões **Validar**, **Cancelar** e **Negociar** de cada proposta. Processo de negociação vinculado (`wf_solicitacao_compras`, **50 - Processo de Negociação** / **172 - Aguarda Fim Negociação**), e o **Portal do Fornecedor** do lado do fornecedor.

**Pré-condições**
- Uma cotação com processo de **negociação aberto** (status `0`) e o campo `hd_atribuicao` preenchido com o código de um usuário conhecido.
- **Dois** logins de comprador distintos: o atribuído e um não atribuído — sem os dois não se prova que a atribuição discrimina.
- Uma proposta **não cancelada** (`hd_cancelarProposta` diferente de verdadeiro).
- Protheus respondendo.
- **Bloqueio:** **três.** (1) A conta de QA não resolve matrícula de comprador. (2) Não há segundo login de comprador. (3) Não há credencial de **fornecedor**, então o lado do Portal do Fornecedor — que é onde o ticket diz que a atividade *deveria* ser movimentada — não é executável nesta rodada.

**Passos**
1. Abrir **Portal do Comprador › Avaliação de Propostas** com o login **atribuído** (aquele cujo código está em `hd_atribuicao`).
2. Localizar a proposta cujo processo de negociação está aberto.
3. Confirmar que as ações **Validar**, **Cancelar** e **Negociar** estão **habilitadas** para essa proposta.
4. Sair e repetir os passos 1–3 com o login **não atribuído**.
5. Confirmar que, para esse segundo login, as mesmas ações **não** estão habilitadas.
6. Com uma proposta **cancelada**, confirmar que as ações ficam indisponíveis para **ambos**.
7. Repetir com um processo iniciado **antes** da implantação do mecanismo (processo antigo) e registrar o comportamento.
8. Do lado do fornecedor, confirmar que a atividade de **Ajuste de Negociação** é movimentável pelo **Portal do Fornecedor**.
9. Conferir, no **Histórico** da solicitação, o responsável efetivamente registrado na atividade.

**Resultado esperado**
- As ações da proposta são liberadas **apenas** para o usuário cujo código consta em `hd_atribuicao`, e apenas enquanto o processo de negociação está **aberto** e a proposta **não** está cancelada.
- Para qualquer outro comprador, as ações permanecem indisponíveis.
- A atividade **Ajuste de Negociação** cai para o **responsável gravado na proposta**, e não para uma pessoa fixa.
- O lado do fornecedor consegue movimentar a atividade pelo **Portal do Fornecedor**.
- O **Histórico** registra como responsável o mesmo usuário atribuído.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A atividade **"Ajuste de Negociação"** caía **sempre para a mesma pessoa** (no relato, Adriana), passando a exigir tratamento interno na CASSI em vez de ser movimentada pelo fornecedor.

**Severidade:** Média *(bloqueia o fluxo e concentra em uma pessoa trabalho que deveria ser do fornecedor; não altera valor)*

**Preparação de massa:** uma cotação com **negociação aberta**, `hd_atribuicao` preenchido, **dois logins de comprador** e **um login de fornecedor**. Além disso, para o passo 7, é preciso localizar **processos antigos** — e aqui fica registrada uma pendência do próprio ticket: **nunca se levantou quantos processos iniciados antes da correção seguem com a atribuição errada.** Esse inventário é pré-requisito para saber se o caso 7 tem massa, e é trabalho que ainda não foi feito.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **LIDO NO FONTE PUBLICADO (bundle do Portal do Comprador)** — o mecanismo que o time alegou existir **está lá e é legível**. O serviço `getProcessIdNegotiation` pede explicitamente os campos `["txt_razSoc_infForn","txt_cgc_infForn","hd_numProp","txt_codForn_infForn","txt_ljForn_infForn","hd_numSc","**hd_atribuicao**","hd_cancelarProposta"]` (o irmão `getProcessIdQuote` pede a mesma lista **sem** `hd_cancelarProposta`). E em `handlerTableQuotesProposals(e)` a decisão é tomada assim: `let n = this.userService.getActualUser().userCode` (o usuário **logado**); do último processo de negociação aberto extrai `Q = STATUS`, `de = hd_atribuicao`, `B = (hd_cancelarProposta === "true")`; e liga a permissão com `H && Q == "0" && **de == n** && !B && (há proposta correspondente)`. Só então `controleValidar`, `controleCancelar` e `controleNegociar` ficam verdadeiros. Ou seja: **as ações da proposta são gated pela igualdade entre `hd_atribuicao` e o código do usuário logado** — exatamente o "mecanismo de atribuição por campo de formulário" que o ticket cita. **VISTO RENDERIZADO** — a rota `#/avaliacaoPropostas` existe no menu e no Acesso Rápido, mas não exibiu dados (instabilidade do `genericQuery`, §5-B: **ambiente, não defeito**).
**Divergências encontradas:** **duas, e a segunda é um risco aberto.** (a) O ticket trata a atribuição como propriedade da **atividade do workflow**; o que é verificável no front-end é a **liberação das ações da proposta no Portal do Comprador**. São coisas diferentes, e o caso acima separa as duas de propósito (passos 1–6 no Portal, passos 8–9 no workflow/Histórico) — **não** afirmo cobertura do roteamento da atividade pelo front-end, porque o front-end não decide isso. (b) **A condição é uma igualdade estrita.** Se `hd_atribuicao` vier **vazio** — que é o estado dos processos anteriores à implantação do campo —, `de == n` é falso para **todo mundo**, e as ações ficam indisponíveis para **qualquer** comprador. Isso significa que os processos antigos não voltam a funcionar sozinhos: continuam precisando de tratamento manual. É a contrapartida do "resíduo anterior à correção" que o ticket menciona e que nunca recebeu tratamento sistemático — e é justamente o que o passo 7 deste caso vai expor.
**Dados/massa usados:** nenhum — não submetido, nenhuma proposta validada, cancelada ou negociada.

---

## CT-FSWTBC-5257  (ambos · AGUARDANDO INICIO · SDCASSI-563)

**Título:** Cadastrar e autenticar um fornecedor com CNPJ alfanumérico no Portal do Fornecedor

**Origem:** FSWTBC-5257 — o Portal do Fornecedor (Fluig) não aceita CNPJ no novo formato **alfanumérico** (norma da Receita Federal: 12 posições alfanuméricas + 2 DVs numéricos), enquanto o Protheus já aceita. **Aberto, sem responsável**, prioridade "Mais baixo", data esperada 04/09 vencida. Fornecedor com CNPJ alfanumérico fica impedido de se cadastrar e de participar de cotações.

**Módulo/Rota:** Fluig: **Cadastro de Fornecedor** público (`/portal/p/1/cadastro_fornecedor`) → *Pessoa Jurídica* → campo **CNPJ \*** (`txt_cnpj`); **Portal do Fornecedor** (`/portal/p/1/portal_fornecedor`) → *Acesso Normal* → **CNPJ da empresa:** (`txt_cnpj`) + **CPF do usuário:** + **Senha:** → *Entrar*; dentro do portal, telas de *Compras*/*Contratos* (classe `.cnpj`, máscara `00.000.000/0000-00`); *Acesso Administrador* (`libAdministrador`, `validaCnpjAlphanumerico`). Protheus: **Compras** — `SA2` (`A2_CGC`, formato alfanumérico), `MATA020`.

**Pré-condições**
- Um CNPJ alfanumérico **válido** (DVs calculados pelo algoritmo SERPRO, ex.: gerado a partir de `12ABC34501DE` + DVs) — o ticket não traz exemplo; usar gerador oficial.
- Um fornecedor com esse CNPJ cadastrado no Protheus (`SA2`) e credencial de acesso ao portal (CPF do usuário + senha).
- **Bloqueio:** não há credencial de fornecedor nem CNPJ alfanumérico cadastrado; o cadastro público não deve ser concluído (escrita em base do cliente) — os passos de envio ficam declarados, não executados. Sem credencial Protheus para o `SA2`.

**Passos**
1. Abra `/portal/p/1/cadastro_fornecedor`, marque **Pessoa Jurídica** e clique no campo **CNPJ \***.
2. Digite `12.ABC.345/01DE-35` (formato com máscara) e observe o valor exibido; limpe e digite `12ABC34501DE35`.
3. Digite um CNPJ **numérico** válido `12.345.678/0001-95` e observe.
4. Digite um CNPJ alfanumérico com DV errado e saia do campo (blur): observe a crítica.
5. Preencha o restante do cadastro com prefixo `QA` e envie (**só em ambiente autorizado**); confira o retorno.
6. Abra `/portal/p/1/portal_fornecedor` → **Acesso Normal**; em **CNPJ da empresa:** digite o CNPJ alfanumérico, o CPF do usuário e a senha; clique **Entrar**.
7. Dentro do portal, abra uma tela de *Compras* ou *Contratos* onde o CNPJ é exibido/filtrado e confira a apresentação.
8. Em **Acesso Administrador**, informe o mesmo CNPJ e observe a validação.
9. (Protheus) Em `MATA020`, confirme que o `A2_CGC` do fornecedor está gravado com as letras e que a integração devolveu o mesmo valor ao portal.

**Resultado esperado**
- O campo **CNPJ** do cadastro aceita letras nas 12 primeiras posições e dígitos nas 2 últimas, com máscara `AA.AAA.AAA/AAAA-00` funcional (o valor digitado aparece, em maiúsculas).
- CNPJ alfanumérico com DV válido passa; DV inválido dispara *"CNPJ inválido."*; CNPJ numérico continua aceito.
- Login no Portal do Fornecedor com CNPJ alfanumérico autentica (as letras **não** são removidas antes de enviar ao `cassi_rest/.../loginNormal`).
- Telas internas exibem o CNPJ com as letras preservadas; `A2_CGC` no Protheus é igual ao informado.

**Resultado se o defeito reincidir** *(o que se vê hoje — ticket aberto)*
- Portal recusa o CNPJ alfanumérico ("CPF/CNPJ inválido ou fornecedor não cadastrado, efetue o cadastro!" no login; crítica ou campo inutilizável no cadastro), enquanto o Protheus aceita.

**Severidade:** Alta *(conformidade regulatória com prazo externo; bloqueia acesso de fornecedores ao processo de compras)*

**Preparação de massa:** CNPJ alfanumérico válido gerado pelo algoritmo oficial; fornecedor cadastrado no `SA2` com esse CNPJ (por quem tem acesso ao Protheus) e credencial de portal emitida; autorização explícita para concluir um cadastro público de teste (prefixo `QA`).

**Verificado em tela:** PARCIAL
**O que foi verificado:** **Cadastro público** — campo **CNPJ \*** (`txt_cnpj`, placeholder `99.999.999/9999-99`, sem `maxlength`/`pattern`); `AppView_pt_BR.js` já aplica `$('#txt_cnpj').mask('AA.AAA.AAA/AAAA-00', {translation:{'A':{pattern:/[A-Za-z0-9]/, transform: toUpperCase}}})` — **a intenção de aceitar alfanumérico já está no fonte** —, mas a página carrega `jquery.inputmask` e `jquery.mask` e o `$.fn.mask` efetivo é o do **`jquery.maskedinput`** (definições `9`, `a`, `*`), que não conhece `A` nem `0` como coringa: **digitar `1`, `A`, `12345678000195` ou `12.ABC.345/01DE-35` deixa o campo com o literal `AA.AAA.AAA/AAAA-00`**, ou seja, o campo CNPJ do cadastro público está **inutilizável para qualquer CNPJ**, numérico ou não (5 tentativas, dois scripts). O CEP, na mesma tela, mascara normalmente (`70040010` → `70040-010`). **Portal do Fornecedor (login)** — `txt_cnpj` sem máscara, `maxlength=18`: aceita digitar `12.ABC.345/01DE-35` (fica como digitado, sem crítica), mas `loginNormal` faz `_LIB.onlyNumber($("#txt_cnpj").val())` antes de enviar — **as letras são descartadas** e o CNPJ enviado ao backend é outro. `lib_pt_BR.js` tem `validaCnpjAlphanumerico` (algoritmo SERPRO, DVs numéricos) usada **apenas** em `libAdministrador` (*Acesso Administrador*); `libCompras` e `libContratos` aplicam `.cnpj` → `mask('00.000.000/0000-00')` (numérico). Nada foi enviado.
**Divergências encontradas:** (1) o cadastro público tem a máscara alfanumérica **escrita mas quebrada por conflito de plugin** — sintoma mais grave que o do ticket: o campo não aceita CNPJ **nenhum**; (2) o login remove letras via `onlyNumber` mesmo tendo um validador alfanumérico na lib; (3) o suporte alfanumérico existe só no *Acesso Administrador*; (4) `GET /java_portal_fornecedorv1/rest-acesso/request/gruposProduto` → 500 no cadastro público (ambiente); (5) `401 /cassi_rest/.../verifyAutenticateToken` na carga do portal (esperado sem token).
**Dados/massa usados:** nenhum — CNPJs fictícios digitados nos campos e descartados, sem enviar.

**Módulo ERP:** Compras
