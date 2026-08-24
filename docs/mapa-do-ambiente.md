# Mapa do ambiente — o que já foi confirmado em campo

Tudo aqui foi **observado no ambiente real** (não copiado de documento). Serve para que ninguém
precise redescobrir e para que ninguém escreva teste sobre suposição.

> Regra: se algo neste mapa divergir do ambiente, **o ambiente ganha** — corrija o mapa.

## Plataforma

- TOTVS Fluig **Voyager 2.0.0-260811**. Usuário da automação: perfil Compras/Contratos, **não-admin**.
- **A tela de login é traduzida pelo locale do navegador.** O `playwright.config.js` fixa `pt-BR`:
  campos *"Digite seu login"* / *"Digite sua senha"*, botão *"Acessar"*, erro *"Usuário ou senha inválidos"*.
  Em `en-US` a mesma tela usa *"Enter your login"* / *"Access"*.
- **O login é servido na MESMA URL da home** (`/portal/p/1/home`). URL não distingue sessão:
  o critério é o **título** (`Cassi - Fluig Plataforma - Home` autenticado, `Login` anônimo).
- Login inválido faz POST para `/portal/p/1/j_security_check` e volta com a mensagem genérica.

## Rotas confirmadas

| Rota | HTTP | Título | Observação |
|---|---|---|---|
| `/portal/p/1/home` | 200 | `... - Home` | headings *Meus Apps*, *Processos favoritos*; abas RH Conecta/Gestão/Compras/Contratos |
| `/portal/p/1/pageprocessstart` | 200 | `... - Iniciar Solicitações` | headings *Últimos processos iniciados*, *Todos os processos* |
| `/portal/p/1/pagecentraltask` | 200 | `... - Central de Tarefas` | heading *Central de tarefas*; abas *Resumo de Tarefas*, *Tarefas a concluir N*; botão *Você* |
| `/portal/p/1/ecmnavigation` | 200 | `... - Documentos` | colunas *Descrição*, *Atualização*, *Código*; barra *Novo/Copiar/Colar/Recortar/Remover/Filtrar/Mais* |
| `/portal/p/1/acompanhamentoContrato` | 200 | `... - Acompanhamento de Contratos` | grade DataTables; ver seção própria |
| `/portal/p/1/gerenciaCompras` | 200 | `... - Gerencia Compras` | heading *Gerência de Compras*; abas *Atribuir*, *Transferir* |
| `/portal/p/1/portal-do-comprador` | 200 | `... - Portal do Comprador` | heading *Acesso Rápido*; itens *Validação Inicial*, *Controle De Cotações*, *Avaliação de Propostas*, *Definir Vencedor Cotação* |
| `/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS` | 200 | `... - Tracker - Processos Compras/ Contratos` | headings *Filtros*, *Filtrar por - ...* |
| `/portal/p/1/portal_fornecedor` | 200 | `... - Portal do Fornecedor` | **exige sessão da plataforma**; anônimo cai na tela de Login. Autenticado: heading *Bem vindo ao Portal de Compras e Contratações!* e botões *Acesso Normal*, *Acesso Administrador*, *Acesso via Representatividade* |
| `/portal/p/1/PORTAL_AUTORIZACAO_HORAS_EXTRAS` | 200 | *(sem título)* | abas Dashboard/Organograma/Saldo/Autorização; ver defeito U-02 |
| `/portal/p/1/principalprocess` | 200 | `... - Error page` | **redireciona** para `/portal/p/1/errorPage/404`, heading *"Recurso não foi encontrado."* |
| `/portal/p/1/gestao_ferias` | 200 | `... - Error page` | mesmo 404 |
| `/webdesk` | **403** | — | corpo JSON `{"code":"Internal Server Error","success":false,"message":"Forbidden"}` |

## Início de processo por URL

`/portal/p/1/pageworkflowview?processID=<processId>` — título sempre `Cassi - Fluig Plataforma - Movimentar Solicitação`.

- **Permitido** (`wf_solicitacao_compras`, `wf_cotacao_produtos_servicos`, `wf_faturamento_contratos`,
  `wf_cadastro_fornecedor`): heading *Início*, abas *Formulário / Informações / Histórico / Anexos*, botão *Enviar*.
- **Bloqueado** (`bpm_recepcao_documentos_fiscais_compras`, `wf_solicitacao_ferias`): heading ***Erro*** e a
  mensagem *"Usuário &lt;login&gt; não possui permissão para iniciar solicitações do processo &lt;processId&gt;"*,
  com *Ver detalhes técnicos* e botão *Ok, entendi*. **Nenhum** formulário carrega.

## Datasets

Todo dataset — interno ou customizado — é executado pelo **mesmo** endpoint:
`POST /api/public/ecm/dataset/datasets`, com o nome no corpo (`{"name": "..."}`).
Não dá para interceptar por URL; use `utils/dataset-fluig.js`, que lê o corpo.

Datasets do Portal de Acompanhamento de Contratos:

| Momento | Datasets |
|---|---|
| Carga da página | `colleagueGroup` (permissão), `dsProtheus_getTipoContratos_restGetAll`, `dsProtheus_getCampoCombo_restGetAll`, `dsProtheus_getContratosxFornecedores_restGet` (grade) |
| Abertura do modal de SC | `dsProtheus_getBranches_restGetAll`, `dsProtheus_getItensPlanilha_restGetAll`, `dsProtheus_getProdutos_restGetAll`, `dsProtheus_getRateiosContratos_restGetAll`, `dsProtheus_getCentroCusto_restGetAll`, `dsFluig_getClasseValor`, `dsProtheus_getPrecoHistorico` |

Resposta de `colleagueGroup`: `{"content":{"columns":[...],"values":[{"colleagueGroupPK.groupId": "...", ...}]}}`.
Devolver `values: []` reproduz "usuário sem grupo"; devolver 500 reproduz indisponibilidade.

Há também o endpoint de busca **`GET /api/public/ecm/dataset/search?datasetId=...`**, que devolve
`{"content": [ ...registros... ], "message": null}`.

## Portal de Acompanhamento de Contratos

- Grade DataTables com **três** elementos `table` (cabeçalho, corpo e rodapé de rolagem) —
  `getByRole('table')` é ambíguo; ancore por texto/atributo.
- `searchbox` **"Pesquisar"**; `combobox` **"Exibir resultados por página"**; linha de informação em
  `role=status`: *"Mostrando de 1 até N de N registros"* (e *"(Filtrados de N registros)"* com filtro ativo).
- **Os três ícones da coluna "Ação" não têm nome acessível** — âncoras vazias, sem texto e sem `aria-label`.
  `getByRole('link', { name })` **não** os resolve. Gancho estável: atributo `title`
  (*Planilha*, *Solicitação de Compra*, *Informações do Contrato*).
- Modal: heading *Solicitação de Compra*; `combobox` *Tipo de Solicitação*; `textbox` *Contrato* (**disabled**);
  `textbox` *Data de Necessidade* (**`<input type="date">` — só aceita ISO `aaaa-mm-dd`**);
  `textbox` *Motivo da Solicitação*; botões *Confirmar* e *Fechar*.
- Alerta de campo obrigatório (fora do dialog, na raiz da página): `role=alert` com *"Campos Obrigatórios"* e
  *"Por favor, preencha: ..."*, citando exatamente os campos que faltam.

## Defeitos confirmados em campo (testes escritos contra o esperado REPROVAM)

| Defeito | Onde | O que se observa |
|---|---|---|
| **D-08** | grade de contratos | situação truncada: `Finali`, `Paralisa`, `Sol.Finali`, `Cancel.` (só *Vigente* sai inteiro) |
| **D-11** | modal com Protheus fora | o mesmo alerta de erro renderiza **duas vezes**. Cada dataset é chamado **uma** vez — a duplicação é de renderização |
| **U-01** | `/gestao_ferias`, `/principalprocess` | deep-link/refresh cai em `errorPage/404` |
| **U-02** | Banco de Horas | `alert()` nativo: *"Existem parâmetros não informado para esse servidor, informe o administrador"*, e em seguida *"Ops! Não foi possivel se comunicar com o Protheus, base offline."* |
| **U-11** | qualquer página do portal | envia URL e título para `google-analytics.com` (`G-F0FT6D1NQG`) |
| **CT-SEG-01-S1** | `GET .../dataset/search?datasetId=colleague` | **a constraint NÃO é aplicada**: com e sem `constraintFields` retorna os mesmos **3.493** registros |

## Regra inegociável deste projeto

O ambiente é o do cliente, integrado ao Protheus. **Registro criado não tem exclusão disponível.**

- Toda spec que abre o modal de Solicitação de Compra instala `bloquearCriacaoDeSolicitacao(page)`
  (`utils/guarda-criacao.js`), que bloqueia escrita em `process-management` e conta as tentativas.
- "O sistema não deve criar X" vira assertion: `expect(guarda.tentativas()).toBe(0)`.
- Cenário que **precisa** escrever é marcado `@destrutivo` e fica fora da execução padrão (`grepInvert`).
