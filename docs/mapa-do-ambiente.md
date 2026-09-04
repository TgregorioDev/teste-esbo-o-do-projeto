# Mapa do ambiente — o que já foi confirmado em campo

Tudo aqui foi **observado no ambiente real** (não copiado de documento). Serve para que ninguém
precise redescobrir e para que ninguém escreva teste sobre suposição.

> Regra: se algo neste mapa divergir do ambiente, **o ambiente ganha** — corrija o mapa.

## Plataforma

- TOTVS Fluig **Voyager 2.0.0-260901** (`GET /api/public/wcm/version`, medido em 03/09/2026 —
  em 27/08 era `2.0.0-260811`; a atualização é a causa medida de o catálogo `onlyCanStart` ter
  passado a listar 23 processos em vez de 17, ver `catalogo-invariante.spec.js`). Usuário da
  automação: perfil Compras/Contratos, **não-admin**, 36 grupos, todos de Compras/Contratos.
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
| **D-11 (revisto em 25/08/2026)** | modal com Protheus fora | A leitura anterior ("o mesmo alerta renderiza duas vezes") estava **errada**. Medido isolando os datasets: só `getBranches` fora → **1** alerta; só `getItensPlanilha` fora → **1** alerta; os dois fora → **2** alertas, um por falha. Não há duplicação. O defeito real é o **rótulo**: a falha dos itens da planilha é anunciada como *"Erro ao buscar dados da filial"*, então com o Protheus fora os dois alertas ficam idênticos e indistinguíveis |
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

---

# Atualizações — rodada de implementação das suítes

Tudo abaixo foi observado em campo durante a implementação das 9 suítes. **Onde contradiz a
seção anterior ou o documento de casos de teste, o que vale é isto.**

## Correções ao que estava mapeado

| Ponto | Estava | É |
|---|---|---|
| Título do Banco de Horas | "(sem título)" | `Cassi - Fluig Plataforma - Portal de Autorização de Horas Extras` |
| Aba *Atribuir* da Gerência de Compras | "às vezes não renderiza, reclicar resolve" | **nunca** renderiza dados; reclicar não resolve. A aba *Transferir*, ao lado, carrega (lenta, 20–25s) |
| Seletor de idioma no login | suspeita de controle inacessível | **funciona para o usuário**: clique de mouse na coordenada troca o idioma. A `div.language-spacer` por cima é ruído de CSS, não defeito |

## Premissas do documento de casos que NÃO se confirmaram

O documento afirma que o usuário de Compras/Contratos "não inicia RH, RDFC nem SIGAJURI
restritos". Verificado processo a processo, isso vale para **RDFC** e para apenas **dois**
processos de RH:

| Processo | Início pelo usuário de Compras |
|---|---|
| `bpm_recepcao_documentos_fiscais_compras` | 🔒 bloqueado |
| `wf_solicitacao_ferias` | 🔒 bloqueado |
| `wf_aprovacao_ocorrencia` | 🔒 bloqueado |
| `wf_pagamento_horas_extras` | ⚠️ **abre** |
| `wf_automacao_admissao` | ⚠️ **abre** |
| `wf_substituicaocargos` | ⚠️ **abre** |
| `GestaoDependentes` | ⚠️ **abre** |
| `rh_gbeneficios_planosaude` | ⚠️ **abre** |
| `wf_delegacaoFiscalContratoServico` | ⚠️ **abre** (o roteiro supunha bloqueio) |

> Parte disso pode ser autoatendimento por desenho — Dependentes e Plano de Saúde são coisas
> que qualquer colaborador abre para si. **Pergunta em aberto para a Cassi:** desses, quais
> deveriam exigir grupo de RH? O que sobrar da resposta é defeito de segregação.

Consequência prática: casos marcados "⛔ bloqueado por perfil" no documento podem estar
executáveis hoje. Reavaliar antes de assumir bloqueio.

## Payload de criação da SC — `POST /process-management/api/v2/processes/wf_solicitacao_compras/start`

Interceptar essa requisição, ler o corpo e **abortar** prova defeitos que antes só eram
visíveis na SC já criada — sem gravar nada. É a base de `utils/captura-payload.js`.

Chaves de topo: `targetState`, `targetAssignee`, `subProcessTargetState`, `comment`, `formFields`.
`formFields` tem ~101 campos; itens sufixados `___1`, `___2`, …

Valores confirmados (contrato de R$ 40.560,00, filial 2101):

```
targetState              = 6                      ← marco de Início do BPMN (D-01)
targetAssignee           = consumerkeycompras     ← conta de integração (D-01)
tbprod_quantidade___1    = 48    tbprod_valorTotal___1 = 40.560,00
tbprod_quantidade___2    = 1     tbprod_valorTotal___2 = 40.560,00   ← soma 81.120,00 (D-02)
tbprod_classeOrca___N    = 133017        (igual em todo item e todo contrato — D-04)
tbprod_classificacao___N = Tecnologia    (idem — contrato é manutenção de elevador)
tbprod_classeValor___N   = (vazio)       ← achado novo
campoDescritor           = Sol. Compras - CASSI SEDE   (filial real: São Luís/MA — D-04)
```

No contrato de 4 itens, o valor de R$ 48.160,00 se repete nos **quatro**.

## Defeitos confirmados nesta rodada (além dos já mapeados)

| Achado | Onde | Evidência |
|---|---|---|
| **Vazamento do `colleague`** | `GET /api/public/ecm/dataset/search?datasetId=colleague` | com e sem `constraintFields`: **3.493** registros. O filtro é ignorado |
| **NPS 403 na Home** | toda carga de `/portal/p/1/home` | `GET /nps/api/v1/surveys?productLine=TOTVS%20Fluig` → 403, gera `console.error` |
| **Aba Atribuir não renderiza** | `/portal/p/1/gerenciaCompras` | 2 chamadas a `ds_getSolicsGerenciaCompras` (`etapa=257`, `etapa=119`) na carga, nenhuma no clique; tabela fica em "Nenhum dado encontrado" |
| **`tbprod_classeValor` vazio** | payload da SC | vazio nos itens, com `classeOrca` e `classificacao` preenchidos ao lado |
| **Envio a Google Analytics** | qualquer página | 2 requisições por carga para `google-analytics.com` (`G-F0FT6D1NQG`) |

## Acessibilidade — três ocorrências do mesmo problema

Controles sem nome acessível ou fora da árvore de acessibilidade. Levar ao time como um item só:

1. **Ícones da coluna "Ação"** (grade de contratos): âncoras vazias, sem texto e sem `aria-label`.
2. **Seletor de idioma** (login): `<img data-language>` sem `alt` nem `aria-label`.
3. **Abas de categoria da Home**: `<a role="tab">` contendo `<div><li>` — bloco dentro de inline,
   HTML inválido; o Chromium calcula bounding box **0×0** para a âncora, que fica inalcançável
   por teclado e leitor de tela.

Os três estão absorvidos, com arquivo:linha, atributo recomendado e destinatário — ver
`docs/recomendacoes-de-testabilidade.md`.

## Comportamentos de tela que decidem o desenho do teste

- **Central de Tarefas guarda a sub-aba por sessão no servidor** — um `goto()` novo pode
  aterrissar em "Minhas Solicitações". A pré-condição precisa clicar na aba desejada.
- **Campo de rateio limita silenciosamente**: digitar `110` vira `100` no blur. O caso
  "rateio acima de 100%" não é reproduzível; só o abaixo de 100%.
- **Formulário de Cotação avulso**: `txt_cgc_infForn` (CNPJ) e `txt_valid_infForn` (validade)
  são `readonly` e não há busca de fornecedor. Casos de CNPJ inválido/validade vencida não são
  alcançáveis por essa rota.
- **Faturamento**: "Itens da Medição" e "Rateio" existem no DOM ocultos e só aparecem após
  encadear Fornecedor → Contrato → Competência → Filial nos zooms do Protheus.
- **Delegação de Fiscais** aberta direto não oferece fiscal substituto nem período — só campos
  somente leitura. Indica processo disparado por um pai, não iniciado sozinho.
- **"Atuar como"** existe em 3 das 4 sub-telas do Portal do Comprador; a *Validação Inicial*
  não tem o seletor e lista SCs reais direto.
- **Recuperação de senha**: o link é `/portal/p/1/home?token=<token>&user=<login>`, validado por
  `GET /authentication/api/v1/tokens/valid`. Token fabricado permite testar a recusa **sem**
  consumir token real nem trocar a senha do usuário de teste.
- **Banco de Horas** dispara um `alert()` **nativo** — o Playwright dispensa diálogo
  automaticamente, então é obrigatório registrar `page.on('dialog')` **antes** de navegar, ou o
  alerta some e o teste conclui, erradamente, que ele não existe.

## Armadilhas de automação aprendidas aqui

- **Interceptar muda o comportamento.** A proteção antiduplo-clique do widget é desabilitar o
  botão; um segundo clique com `force: true` fura a própria proteção sob teste e produz um
  vermelho que é artefato, não defeito. Nunca force o clique que valida uma trava de UI.
- **Contagem lida cedo demais passa por acidente.** A contagem de alertas do modal só é confiável depois
  que o modal termina de abrir; afirmar antes disso dá falso verde.
- **Estado global mutável não paralela.** Favoritar processo é estado de conta única e
  `describe.serial` não serializa entre repetições do `--repeat-each` — o caso foi removido.

---

# Atualizações — onda 3 (25/08/2026)

## Premissas do documento de casos que caíram (terceira e quarta vez)

| Módulo | Documento diz | Medido |
|---|---|---|
| **SIGAJURI** (4 processos) | exige perfil jurídico | **nenhum é bloqueado por perfil** — todos abrem o formulário completo |
| **RDFC** (5 variantes) | exige grupo de recepção fiscal | **confirmado**: as 5 bloqueiam, com o mesmo modal de erro |
| **RH** (6 processos) | é barrado | a tela abre em 5, mas o formulário **não monta campos** — a conta não é funcionário no Protheus |

Regra que emerge disso: **distinga três coisas diferentes** antes de declarar bloqueio —
(1) bloqueio de permissão de início (modal "Erro" com mensagem de permissão);
(2) tela que abre mas cujo formulário não monta campo (pré-condição de dado, não de perfil);
(3) formulário funcional.

## Defeitos novos confirmados

| Achado | Onde | Evidência |
|---|---|---|
| **Serviço SIGAJURI não registrado** | `SIGAJURI_Consultivo`, `SIGAJURI_Contrato` | combos `Tipo Consulta`/`Filial`/`Tipo Contrato` têm **uma única opção, e ela é uma exceção Java**: `ServiceNotFoundException: Não foi possível encontrar o serviço ' SIGAJURI '`. Envio → HTTP 500. Os dois processos estão inoperantes |
| **Parte contrária inalcançável** | `SIGAJURI_Contencioso` | botão `Novo Envolvido` existe no DOM e fica **sempre oculto por CSS** (`sem-processo-hide`) |
| **Questionário CliniCASSI inoperante** | `prc_questionario_v2` | envio sempre HTTP 500: *"A pergunta >>001<< não tem nenhuma ação cadastrada!!"* — idêntico com 1, 4 ou 10 respostas |
| **Admissão serve o formulário errado** | `wf_automacao_admissao` | entrega o template de `rh_gbeneficios_planosaude` |
| **Vazamento de exceção no reset de senha** | `PUT .../redefinirPassPUT` (Portal do Fornecedor) | HTTP **500** com `{"exception":"java.lang.IllegalArgumentException: ..."}` no corpo |
| **Datasets sensíveis alcançáveis sem admin** | `ds_Fluig`, `dsFluig_executeSql`, `dsFluig_getDocumentSql` | HTTP **200** para sessão comum. Conteúdo NUNCA foi lido — a exposição foi provada por alcançabilidade e metadados |
| **Sincronizações em erro** | `ds_protheus_getFuncionarios_restGetAll_Sync`, `getFuncoes_restGetAll_Sync` | HTTP **500** `java.lang.NullPointerException` |
| **Cache de colaboradores muito defasado** | `dsp_colaboradorProtheusSync` | 133.968 registros; defasagem **média 237 dias**, **máxima 1.259 dias** |
| **Não-determinismo no produto** | `wf_substituicaocargos` | 8 cargas sequenciais, mesma resposta do dataset (0 registros): **7 bloqueiam, 1 libera o formulário**. Solicitante não identificado pelo ERP recebe formulário aberto |

## Questão de segurança FECHADA

`SIGAJURI_Consultivo` tem `public:true` no metadado. Medido com contexto anônimo: a rota devolve a
tela de **Login**, e a API que traria o payload responde com um script de redirecionamento — sem
`formHtml`, sem dado do caso. **O metadado público não se traduz em vazamento** por nenhuma das
duas rotas testadas.

## Armadilhas de automação descobertas nesta onda

- **O iframe do formulário navega VÁRIAS vezes durante a carga** (medido: 3× `about:blank`, depois
  o formulário real por volta de 5,5s). Uma assertion do tipo `not.toBeVisible()` é satisfeita no
  **primeiro poll** em que o elemento não está lá — e um poll caindo numa janela em branco passa
  **sem observar nada**. Isto produziu um falso verde real. Espere o conteúdo **estabilizar** e
  compare o valor, em vez de esperar por ausência.
- **Headings usam `U+00A0` em todos os espaços.** Comparar com literal digitado nunca casa —
  normalize o espaço em branco, ou o teste vira falso verde permanente.
- **Widgets escondem uma linha-modelo no DOM.** Contar `input`/`select` dentro de um grupo pode
  devolver campos da linha oculta, inalcançáveis pelo usuário. Teste a visibilidade do controle
  real, não a contagem de elementos.
- **`SIGAJURI_AprovaFU` e `Delegação de Fiscais` só têm campos `readonly`**, com os campos reais em
  `input hidden` atrás. São processos disparados por um pai, não iniciáveis isolados.
