<!-- Catálogo de casos de teste, versionado no repositório para que a contagem de
cobertura em docs/cobertura.md seja auditável. Fonte: QA — Fábrica de Software TBC. -->

# Casos de Teste — Fluig Cassi

**Ambiente:** `caixade182374.fluig.cloudtotvs.com.br` · TOTVS Fluig **Voyager 2.0.0-260811** (TOTVS Cloud)
**Autor:** QA — Fábrica de Software TBC · **Data-base:** 19/08/2026
**Credencial de referência dos testes exploratórios:** `TOTVS-FS` (perfil de Compras/Contratos, **não-admin**)

---

> 📌 **Atualização (21/08/2026):** a abertura da SC **pelo Portal de Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) e a cadeia ponta a ponta até o comprador agora estão **neste documento**, nas seções **24 (`CT-ACC`)** e **25 (`CT-E2E`)** — 38 casos. O mesmo conteúdo, acrescido do roteiro de execução manual, está em `Casos de teste - Compras E2E via Acompanhamento de Contratos.md`; os resultados da run em `Relatorio de execucao - Compras E2E via Acompanhamento de Contratos.md`.

## Como usar este documento

Cada caso é executável manualmente em tela. Estrutura:

- **ID** — `CT-<MÓDULO>-<Nº>`; o sufixo `-H` indica caminho **feliz** e `-S<n>` caminhos **tristes/alternativos**.
- **Prioridade** — P1 (crítico de negócio/integração/segurança), P2 (importante), P3 (complementar).
- **Tipo** — Funcional · Negativo · Integração · Segurança · UI/Usabilidade.
- **Pré-condições** — estado e perfil necessários **antes** de começar.
- **Massa de dados** — dados de teste sugeridos.
- **Passos** — numerados, do jeito que se clica na tela.
- **Resultado esperado** — critério objetivo de aprovação.
- **Pós-condição / Limpeza** — o que fica no ambiente e como reverter (quando aplicável).

### Convenções e acessos rápidos
> Os passos dos casos usam estes atalhos. Aqui está o "como fazer" detalhado de cada um — todo caso pode se apoiar nesta seção.

- **Entrar no portal:** `https://caixade182374.fluig.cloudtotvs.com.br` → informar login e senha → **Access**.
- **"Iniciar processo X"** — dois caminhos equivalentes:
  - **Interface:** menu lateral esquerdo → **Processos** → no painel que abre → **Iniciar Solicitações** (página `pageprocessstart`) → campo **Buscar** → digitar o nome do processo → clicar nele.
  - **URL direta:** `https://caixade182374.fluig.cloudtotvs.com.br/portal/p/1/pageworkflowview?processID=<processId>`.
  - Tabela de `processId` dos principais processos no rodapé deste documento (**Anexo A**).
- **"Assumir tarefa"** = menu **Central de Tarefas** → **Tarefas em pool** → expandir o grupo → clicar na tarefa → **Assumir**.
- **"Aprovar/Reprovar uma tarefa"** = Central de Tarefas → abrir a tarefa (minha) → preencher o parecer/decisão no formulário → botão **Enviar** (ou **Opções**).
- **Abrir Documentos (GED)** = menu lateral → **Documentos** (`ecmnavigation`).
- Campo **obrigatório** é o marcado com `*` no formulário.
- Toda regra de negócio é validada **no servidor** — validação de navegador é só UX e deve ser reconfirmada no servidor.
- Ícone/estado esperado de bloqueio de permissão: modal **"Erro"** com "não possui permissão para iniciar solicitações do processo".

### Matriz de perfis necessária (pré-requisito de execução)
Vários processos são **segregados por grupo**: o usuário `TOTVS-FS` **não inicia** RH, RDFC nem SIGAJURI restritos. Para cobertura total, provisionar usuários de teste por papel:

| Perfil de teste | Cobre |
|---|---|
| Solicitante de Compras | CT-CMP, CT-COT |
| Comprador / Alçadas | CT-CMP (aprovações), CT-NEG, CT-PAR |
| Fiscal / Gestor de Contrato | CT-FAT, CT-DEL, CT-RDF |
| Colaborador RH + Gestor | CT-FER, CT-BH, CT-DEP, CT-ADM, CT-SUB, CT-OCO |
| Área Jurídica (JUR_001..004) | CT-JUR |
| Fornecedor externo (Normal/Admin/Representatividade) | CT-PFN |
| Administrador da plataforma (`adminUser:true`) | CT-SEG, CT-INT (scheduler) |

### Legenda de status de execução (preenchida na coluna de evidências)
`✅ Passou` · `❌ Falhou` · `⛔ Bloqueado (permissão/ambiente)` · `⏭️ Não executado`

---

## 1. Autenticação & Sessão  (`CT-AUT`)

### CT-AUT-01-H · Login com credenciais válidas
- **Prioridade:** P1 · **Tipo:** Funcional
- **Pré-condições:** usuário ativo e com senha válida; estar deslogado.
- **Massa de dados:** login `TOTVS-FS` / senha válida.
- **Passos:**
  1. Acessar `https://caixade182374.fluig.cloudtotvs.com.br/portal/p/1/home`.
  2. No campo *Enter your login*, digitar o login.
  3. No campo *Enter your password*, digitar a senha.
  4. Clicar em **Access**.
- **Resultado esperado:** redireciona para a Home; título "Cassi - Fluig Plataforma - Home"; carrega "Meus Apps" e os contadores de tarefas; nome do usuário no topo direito.
- **Pós-condição:** sessão autenticada.

### CT-AUT-02-S1 · Login com senha incorreta
- **Prioridade:** P1 · **Tipo:** Negativo/Segurança
- **Passos:** repetir CT-AUT-01 com senha **errada** e clicar em **Access**.
- **Resultado esperado:** mensagem de erro genérica ("usuário ou senha inválidos"); **permanece** na tela de login; **não** expõe se o usuário existe; sem stacktrace.

### CT-AUT-02-S2 · Login com usuário inexistente
- **Prioridade:** P2 · **Tipo:** Negativo/Segurança
- **Passos:** login `nao.existe.999` + qualquer senha → **Access**.
- **Resultado esperado:** mesma mensagem genérica do S1 (não diferenciar de senha errada — evita enumeração de usuários).

### CT-AUT-02-S3 · Campos obrigatórios vazios
- **Prioridade:** P3 · **Tipo:** Negativo
- **Passos:** deixar login e/ou senha em branco → **Access**.
- **Resultado esperado:** bloqueia o envio e sinaliza os campos obrigatórios.

### CT-AUT-03-H · Recuperação de senha — envio de token
- **Prioridade:** P1 · **Tipo:** Funcional
- **Pré-condições:** e-mail válido cadastrado.
- **Passos:**
  1. Na tela de login, clicar em **Forgot your password?**.
  2. Informar login/e-mail válido.
  3. Clicar em **Send**.
- **Resultado esperado:** mensagem "verifique seu e-mail"; e-mail com link/token de redefinição é enviado (chamada `POST /authentication/api/v1/tokens`).

### CT-AUT-03-S1 · Recuperação com e-mail vazio
- **Prioridade:** P3 · **Tipo:** Negativo
- **Passos:** abrir "Forgot your password?", deixar o campo vazio, **Send**.
- **Resultado esperado:** mensagem "informe o login/e-mail"; não dispara requisição.

### CT-AUT-03-S2 · Redefinição com token expirado/ inválido
- **Prioridade:** P1 · **Tipo:** Segurança
- **Pré-condições:** obter um link de redefinição e aguardar expirar (ou adulterar o parâmetro `token`).
- **Passos:** acessar a URL de redefinição com `?token=<expirado/alterado>&user=<x>`.
- **Resultado esperado:** tela "token expirado"; **não** permite trocar a senha (validação `GET /authentication/api/v1/tokens/valid`).

### CT-AUT-03-S3 · Nova senha ≠ confirmação
- **Prioridade:** P2 · **Tipo:** Negativo
- **Pré-condições:** token válido, na tela de nova senha.
- **Passos:** digitar `Senha@123` e confirmação `Senha@124` → **Send**.
- **Resultado esperado:** erro "as senhas não conferem"; senha não é alterada.

### CT-AUT-03-S4 · Nova senha fora da política
- **Prioridade:** P2 · **Tipo:** Negativo/Segurança
- **Passos:** com token válido, informar senha fraca (ex.: `123`) nos dois campos → **Send**.
- **Resultado esperado:** erro "requisitos de senha não atendidos"; senha não é alterada.

### CT-AUT-04-H · Troca de idioma na tela de login
- **Prioridade:** P3 · **Tipo:** UI
- **Passos:** na tela de login, clicar no seletor de idioma (PT/EN/ES).
- **Resultado esperado:** rótulos da tela mudam para o idioma escolhido (`I18NServlet?locale=...`).

### CT-AUT-05-S1 · Expiração/timeout de sessão
- **Prioridade:** P2 · **Tipo:** Segurança
- **Passos:**
  1. Logar; deixar a aba de login aberta por >10 min (ela recarrega sozinha).
  2. Em uma sessão autenticada, ficar inativo além do timeout e tentar uma ação.
- **Resultado esperado:** ação após expiração redireciona para login; nenhuma operação é executada com sessão expirada.

### CT-AUT-06-S1 · Logout invalida a sessão
- **Prioridade:** P2 · **Tipo:** Segurança
- **Passos:** efetuar logout; usar o botão "Voltar" do navegador para uma página interna; tentar recarregar.
- **Resultado esperado:** conteúdo protegido não é reexibido; exige novo login.

---

## 2. Plataforma, Permissão & Navegação  (`CT-PLT`)

### CT-PLT-01-H · Home carrega apps e contadores
- **Prioridade:** P1 · **Tipo:** Funcional/UI
- **Passos:** logar; observar a Home.
- **Resultado esperado:** "Meus Apps" com abas **RH Conecta, Gestão, Compras, Contratos**; painel de contadores (Tarefas Atrasadas, No prazo, Minhas Solicitações, Aprovações, etc.) renderiza sem erro de console.

### CT-PLT-02-H · Menu Processos abre o painel de ações
- **Prioridade:** P2 · **Tipo:** UI
- **Passos:** clicar em **Processos** no menu lateral.
- **Resultado esperado:** painel com **Iniciar Solicitações, Listar Tarefas, Consultar Solicitações, Eliminar Solicitações, Central de Tarefas**; busca de processo funciona.

### CT-PLT-03-H · Usuário COM permissão inicia o processo
- **Prioridade:** P1 · **Tipo:** Funcional/Segurança
- **O que estamos testando:** que um usuário **com** permissão de início consegue abrir o formulário do processo (controle positivo, par do CT-PLT-03-S1).
- **Pré-condições:** logado com usuário do grupo de início (ex.: `G.P.Requisicao_de_Compras_Inicio` para "Solicitação de Compras"; o `TOTVS-FS` atende).
- **Passos:**
  1. Menu lateral → **Processos** → **Iniciar Solicitações**.
  2. No campo **Buscar**, digitar `Solicitação de Compras`.
  3. Clicar no processo **"Solicitação de Compras"** na lista.
  4. *(Alternativa por URL:* `.../portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`.)
- **Resultado esperado:** o formulário abre normalmente (título "Solicitação de Compras", com os blocos Identificação / Entidade / Produtos); **sem** modal de bloqueio de permissão.
- **Evidência:** `evidencias/CT-CMP-01-H_form-solicitacao-compras.png`.

### CT-PLT-03-S1 · Usuário SEM permissão é bloqueado no início
- **Prioridade:** P1 · **Tipo:** Segurança (controle de acesso / segregação por grupo)
- **O que estamos testando:** que a plataforma **impede** um usuário de **iniciar** um processo para o qual ele não tem permissão de início (grupo). É um teste *negativo* — o "sucesso" é o **bloqueio**.
- **Processo-alvo:** **"RDFC - Recepção de Documentos Fiscais - Compras"** — é um processo BPM da categoria **Compras** (`processId` interno: `bpm_recepcao_documentos_fiscais_compras`). Existem 5 variantes de RDFC (Compras, Contratos, Comprador, Demandante, Fiscal); este caso usa a de **Compras**. O início dele é restrito aos grupos de recepção fiscal.
- **Pré-condições:**
  1. Estar **logado** no portal (`https://caixade182374.fluig.cloudtotvs.com.br`).
  2. Usar um usuário que **NÃO** pertence ao grupo de início do RDFC-Compras. O **`TOTVS-FS`** serve: ele tem grupos genéricos de Compras/Contratos (`G.P.Requisicao_de_Compras_*`, `G.Compras.*`), mas **não** o grupo de recepção fiscal — por isso é barrado.
- **Passos — Caminho A (pela interface, recomendado para teste manual):**
  1. No menu lateral esquerdo, clicar em **Processos**.
  2. No painel que se abre à direita do menu, clicar em **Iniciar Solicitações** (isso abre a página de catálogo `pageprocessstart` com os processos que **você tem permissão** de iniciar).
  3. No campo **Buscar** do catálogo, digitar `Recepção de Documentos Fiscais` (ou `RDFC`).
  4. Observar a lista de resultados.
- **Passos — Caminho B (por URL direta, para forçar o acesso):**
  1. Colar na barra de endereço do navegador:
     `https://caixade182374.fluig.cloudtotvs.com.br/portal/p/1/pageworkflowview?processID=bpm_recepcao_documentos_fiscais_compras`
  2. Pressionar Enter e aguardar o carregamento (a página tenta montar o formulário do processo num iframe).
- **Resultado esperado:**
  - **Caminho A:** o processo **"RDFC - Recepção de Documentos Fiscais - Compras" não aparece** na lista de "Iniciar Solicitações" desse usuário (o catálogo já vem filtrado por permissão de início).
  - **Caminho B:** a plataforma exibe o **modal de erro** com o título **"Erro"** e a mensagem **"Usuário TOTVS-FS não possui permissão para iniciar solicitações do processo bpm_recepcao_documentos_fiscais_compras"**, com o botão **"Ok, entendi"** (e um link "Ver detalhes técnicos"). **Nenhum** formulário/campo é carregado.
  - Em ambos: o usuário **não consegue** iniciar uma solicitação do processo.
- **Evidência:** `evidencias/CT-PLT-03-S1_rdfc-bloqueio-permissao.png` *(bloqueio observado em 19/08/2026 com TOTVS-FS).*
- **Por que bloqueia (contexto):** o início do RDFC-Compras é liberado apenas para grupos específicos de recepção fiscal; `TOTVS-FS` não está neles. Esse é o **controle positivo** que prova a segregação de acesso funcionando.
- **Como saber quais grupos PODEM iniciar (apoio / não obrigatório):** um **administrador** consulta em **Painel de Controle → Processos → [RDFC - Recepção de Documentos Fiscais - Compras] → aba de Segurança/Permissões de início**; ou, via API autenticada, `GET /process-management/api/v2/processes/bpm_recepcao_documentos_fiscais_compras` (checar a configuração de segurança do processo).
- **Variação positiva relacionada:** repetir o Caminho B **logado com um usuário que pertence** ao grupo de recepção fiscal → o formulário do RDFC **deve abrir normalmente** (esse é o caminho feliz, executável só com o perfil correto).
- **Pós-condição:** nenhuma; nada é criado no ambiente.

### CT-PLT-04-S1 · Deep-link/refresh de página SPA
- **Prioridade:** P2 · **Tipo:** UI/Negativo
- **Passos:** abrir diretamente (barra do navegador) `.../portal/p/1/principalprocess` e `.../gestao_ferias`.
- **Resultado esperado (comportamento atual):** cai em `errorPage/404`. **Registrar como defeito** se o requisito for permitir bookmark/refresh; confirmar com a Cassi. *(observado)*

### CT-PLT-05-H · Favoritar e acessar via Favoritos
- **Prioridade:** P3 · **Tipo:** Funcional
- **Passos:** favoritar um processo; acessá-lo por **Favoritos**.
- **Resultado esperado:** processo aparece em Favoritos e abre corretamente.

---

## 3. GED / Documentos  (`CT-GED`)

### CT-GED-01-H · Navegar a árvore de pastas
- **Prioridade:** P2 · **Tipo:** Funcional
- **Passos:** menu **Documentos**; expandir as pastas raiz (Meus Documentos, Anexos de Processo de Compras, Compras e Contratação, Modelos de Declaração).
- **Resultado esperado:** listagem carrega com Descrição/Atualização/Código; paginação (30/50/75/100) funciona.

### CT-GED-02-H · Upload de documento
- **Prioridade:** P2 · **Tipo:** Funcional
- **Pré-condições:** permissão de escrita na pasta.
- **Massa de dados:** PDF de teste < cota do usuário.
- **Passos:** entrar numa pasta → **Novo/Upload** → selecionar arquivo → salvar.
- **Resultado esperado:** documento criado, versionado (v1000), visível na listagem.

### CT-GED-02-S1 · Upload de tipo/tamanho não permitido
- **Prioridade:** P3 · **Tipo:** Negativo
- **Passos:** tentar subir arquivo acima da cota ou de extensão bloqueada.
- **Resultado esperado:** bloqueio com mensagem clara; nada é gravado.

### CT-GED-03-H · Check-out / Check-in
- **Prioridade:** P3 · **Tipo:** Funcional
- **Passos:** fazer check-out de um documento; editar; check-in com nova versão.
- **Resultado esperado:** documento fica bloqueado durante o check-out; check-in gera nova versão e libera.

### CT-GED-03-S1 · Check-out concorrente
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** com o documento em check-out por um usuário, um segundo usuário tenta check-out.
- **Resultado esperado:** segundo usuário é impedido; mensagem indica quem detém o check-out.

### CT-GED-04-H · Aprovação de documento
- **Prioridade:** P2 · **Tipo:** Funcional
- **Passos:** submeter documento que exige aprovação; aprovar como responsável.
- **Resultado esperado:** documento muda para "aprovado"; aparece/limpa da Central de Tarefas → Documentos.

### CT-GED-05-H · Lixeira — excluir e restaurar
- **Prioridade:** P3 · **Tipo:** Funcional
- **Passos:** excluir um documento; ir em **Lixeira**; restaurar.
- **Resultado esperado:** documento vai para a Lixeira e é restaurado à pasta de origem.

---

## 4. Central de Tarefas  (`CT-TSK`)

### CT-TSK-01-H · Resumo reflete a carga real
- **Prioridade:** P2 · **Tipo:** Funcional
- **Passos:** abrir **Central de Tarefas**; comparar os contadores (Solicitações, Tarefas em pool, Documentos, Consenso) com as listas.
- **Resultado esperado:** números do Resumo batem com as listas; gráficos renderizam.

### CT-TSK-02-H · Assumir tarefa do pool
- **Prioridade:** P1 · **Tipo:** Funcional
- **Pré-condições:** existir tarefa em pool de um grupo do usuário.
- **Passos:** **Tarefas em pool → [grupo] → [tarefa] → Assumir**.
- **Resultado esperado:** tarefa sai do pool e vai para "minhas tarefas" do usuário.

### CT-TSK-02-S1 · Concorrência ao assumir a mesma tarefa
- **Prioridade:** P1 · **Tipo:** Negativo/Integração
- **Passos:** dois usuários do mesmo grupo tentam **Assumir** a mesma tarefa quase simultaneamente.
- **Resultado esperado:** apenas um assume; o outro recebe aviso de que a tarefa já foi assumida (sem duplicar).

### CT-TSK-03-H · Tarefa atrasada é sinalizada
- **Prioridade:** P2 · **Tipo:** Funcional
- **Pré-condições:** existir tarefa com prazo estourado (havia 1 no pool de Compras).
- **Passos:** abrir a Central; localizar a seção de atrasadas.
- **Resultado esperado:** tarefa marcada como **Atrasada**; contador de atrasadas > 0.

### CT-TSK-04-H · Consulta de "Minhas Solicitações"
- **Prioridade:** P3 · **Tipo:** Funcional
- **Passos:** abrir **Solicitações → Solicitadas por mim / Sob minha gerência**; filtrar por status.
- **Resultado esperado:** listas corretas; abrir uma solicitação exibe histórico e andamento.

---

## 5. Compras — Solicitação de Compras  (`CT-CMP`)

### CT-CMP-01-H · Abertura completa e envio (caminho feliz)
- **Prioridade:** P1 · **Tipo:** Funcional/Integração
- **Pré-condições:** Protheus disponível; usuário em `G.P.Requisicao_de_Compras_Inicio`; filiais/produtos cadastrados no ERP.
- **Massa de dados:** Filial "01 - Matriz"; 1 produto; rateio 100%; justificativa "Aquisição de teste QA".
- **Passos:**
  1. Iniciar "Solicitação de Compras".
  2. Conferir bloco **Identificação** pré-preenchido (Nº Processo Fluig, Solicitante, E-mail, Data, Hora).
  3. Preencher **Nº da Solicitação ERP** e **Nº da Cotação ERP**.
  4. Selecionar **Nome da Filial** no combo (carrega do Protheus) — conferir que o **Código da Filial** preenche junto.
  5. Preencher **Data de Emissão** e **Justificativa**.
  6. Em **Produtos/Serviços**, clicar **Adicionar Produto** e preencher item, quantidade e valor.
  7. Preencher o rateio de modo que **some 100%**.
  8. Anexar 1 documento em **Anexar documentação Pública**.
  9. Clicar **Enviar**.
- **Resultado esperado:** solicitação criada com número; sem erro de console; segue para a primeira etapa de aprovação; entrada visível em "Minhas Solicitações".
- **Pós-condição:** existe uma solicitação de teste em andamento (registrar o nº para limpeza).

### CT-CMP-02-S1 · Envio com campos obrigatórios vazios
- **Prioridade:** P1 · **Tipo:** Negativo
- **Passos:** no formulário, deixar **Justificativa** (e/ou Filial) em branco → **Enviar**.
- **Resultado esperado:** bloqueio; campos obrigatórios destacados; solicitação não é criada.

### CT-CMP-02-S2 · Rateio diferente de 100%
- **Prioridade:** P1 · **Tipo:** Negativo
- **Passos:** adicionar produto e preencher rateio somando **90%** (repetir com **110%**) → **Enviar**.
- **Resultado esperado:** validação impede o envio com mensagem clara de que o rateio deve fechar 100%.

### CT-CMP-02-S3 · Upload de planilha de rateio inválida
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** usar **Upload Planilha de Rateio** com arquivo em formato errado / planilha vazia / colunas alteradas.
- **Resultado esperado:** rejeição com mensagem; nenhum rateio importado.

### CT-CMP-02-S4 · Anexo obrigatório ausente
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** preencher tudo, **não** anexar a documentação exigida → **Enviar**.
- **Resultado esperado:** bloqueio informando o anexo obrigatório (Pública/Restrita CASSI conforme regra).

### CT-CMP-03-S1 · Protheus indisponível ao carregar combos  ⭐ teste-mestre
- **Prioridade:** P1 · **Tipo:** Integração/Negativo
- **Pré-condições:** serviço REST do Protheus fora do ar/timeout (ou simular).
- **Passos:** abrir o formulário; abrir o combo **Nome da Filial**; tentar adicionar produto.
- **Resultado esperado:** mensagem clara de indisponibilidade do ERP ao usuário; **não** combo vazio silencioso, **não** tela branca, **não** travar o formulário.

### CT-CMP-04-H · Aprovação — Gestor Imediato (feliz)
- **Prioridade:** P1 · **Tipo:** Funcional
- **Pré-condições:** solicitação de CT-CMP-01-H aguardando o gestor; logar como usuário do grupo `G.P.Requisicao_de_Compras_Gestor_Imediato`.
- **Passos:** Central de Tarefas → abrir a tarefa → revisar → **Aprovar** → confirmar.
- **Resultado esperado:** avança para a **Validação Orçamentária**; histórico registra a aprovação e o aprovador.

### CT-CMP-04-S1 · Reprovação do Gestor gera correção
- **Prioridade:** P1 · **Tipo:** Funcional
- **Passos:** na tarefa do gestor, **Reprovar** com justificativa.
- **Resultado esperado:** solicitação volta para `Requisicao_de_Compras_Correcoes` (solicitante); justificativa registrada; solicitante consegue corrigir e reenviar.

### CT-CMP-05-H · Validação Orçamentária dentro da alçada
- **Prioridade:** P1 · **Tipo:** Funcional/Integração
- **Pré-condições:** valor **dentro** da alçada; usuário `G.P.Requisicao_de_Compras_Validacao_Orcamentaria`.
- **Passos:** abrir a tarefa; validar orçamento; **Aprovar**.
- **Resultado esperado:** segue para Validação de Compradores; alçada conferida com dados do Protheus.

### CT-CMP-05-S1 · Valor acima da alçada sem aprovador
- **Prioridade:** P1 · **Tipo:** Negativo/Integração
- **Pré-condições:** valor acima do teto da alçada configurada.
- **Passos:** avançar a solicitação até a etapa de alçada.
- **Resultado esperado:** exige nível de aprovação superior; se não houver aprovador definido, o processo sinaliza claramente (não fica "preso" silenciosamente).

### CT-CMP-06-H · Aprovação final (Compradores/Alçadas) e conclusão
- **Prioridade:** P1 · **Tipo:** Funcional
- **Passos:** aprovar nas etapas `Validacao_Compradores` e `Validacao_Alcadas`.
- **Resultado esperado:** processo encerra "aprovado"; solicitação some das pendências e consta no histórico como concluída.

---

## 6. Compras — Cotação de Produtos/Serviços  (`CT-COT`)

### CT-COT-01-H · Cotação sem parecer técnico (feliz)
- **Prioridade:** P1 · **Tipo:** Funcional/Integração
- **Pré-condições:** SC de origem existente; comprador definido.
- **Passos:**
  1. Iniciar "Cotação de Produtos/Serviços".
  2. Preencher dados do **Fornecedor** (CNPJ/CPF, razão social, endereço, contato).
  3. Vincular **Nº da Cotação**, **Nº da SC do Fluig** e **Nº da SC do ERP**; selecionar filial e comprador.
  4. Definir **Validade da Cotação/Proposta** e **Tipo de Frete**.
  5. Adicionar itens (código, descrição, qtde, un. med., grupo, valor unit., IPI, frete).
  6. Conferir os **totais** (subtotal, IPI, frete, descontos, total do pedido).
  7. Em "Enviar para parecer técnico?" marcar **Não**; **Enviar**.
- **Resultado esperado:** cotação registrada; totais somam corretamente; segue o fluxo sem parecer.

### CT-COT-01-S1 · Cotação COM parecer técnico
- **Prioridade:** P1 · **Tipo:** Funcional
- **Passos:** repetir CT-COT-01, marcando "Enviar para parecer técnico? **Sim**" → **Enviar**.
- **Resultado esperado:** processo roteia para **Parecer Técnico** (grupo TI); tarefa criada para o parecerista (ver CT-PAR).

### CT-COT-02-S1 · Totais inconsistentes
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** informar itens cujo somatório não bate com os campos de total (ou total do pedido zerado).
- **Resultado esperado:** validação recalcula/impede envio com totais inconsistentes.

### CT-COT-02-S2 · Cotação com validade vencida
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** informar **Validade da Cotação** no passado → **Enviar**.
- **Resultado esperado:** bloqueio ou alerta de data inválida; não permite cotação já vencida.

### CT-COT-02-S3 · CNPJ/CPF do fornecedor inválido
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** informar CNPJ/CPF com dígito inválido.
- **Resultado esperado:** validação de documento barra o envio.

---

## 7. Compras — Negociação de Cotação  (`CT-NEG`)

### CT-NEG-01-H · Validação de proposta — aprovada (feliz)
- **Prioridade:** P1 · **Tipo:** Funcional
- **Pré-condições:** existir cotação em negociação atribuída ao usuário.
- **Passos:** abrir a tarefa de Negociação; revisar itens/valores; na seção **Validação de Proposta**, **Aprovar**; **Enviar**.
- **Resultado esperado:** proposta aprovada; fluxo segue para a próxima etapa; histórico registra.

### CT-NEG-01-S1 · Validação de proposta — reprovada
- **Prioridade:** P2 · **Tipo:** Funcional/Negativo
- **Passos:** na Validação de Proposta, **Reprovar** com justificativa; **Enviar**.
- **Resultado esperado:** proposta marcada reprovada; fluxo retorna/encerra conforme regra; justificativa no histórico.

### CT-NEG-01-S2 · Proposta fora do prazo
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** tentar negociar cotação cuja validade de proposta já expirou.
- **Resultado esperado:** ação bloqueada/alertada por data-limite (`dsSync_verificaDataValidaCotNeg`).

---

## 8. Compras — Parecer Técnico  (`CT-PAR`)

### CT-PAR-01-H · Parecer emitido pelo responsável (feliz)
- **Prioridade:** P1 · **Tipo:** Funcional
- **Pré-condições:** cotação encaminhada a parecer; usuário do grupo `G.P.Parecer_Tecnico_TI`.
- **Passos:** Central de Tarefas → abrir a tarefa de Parecer → preencher parecer → **Aprovar/Concluir**.
- **Resultado esperado:** parecer registrado; processo retorna ao fluxo de compras com o parecer anexado.

### CT-PAR-01-S1 · Parecer sem responsável definido
- **Prioridade:** P1 · **Tipo:** Negativo/Integração
- **Pré-condições:** área/responsável de parecer não configurado.
- **Passos:** encaminhar cotação para parecer técnico.
- **Resultado esperado:** o sistema sinaliza claramente a ausência de responsável (não roteia para o vazio nem "perde" a tarefa).

### CT-PAR-01-S2 · Parecer reprovando a cotação
- **Prioridade:** P2 · **Tipo:** Funcional
- **Passos:** no parecer, emitir posição **desfavorável** com justificativa.
- **Resultado esperado:** cotação segue a regra de reprovação (retorno ao comprador/encerramento); justificativa registrada.

---

## 9. Compras/Contratos — RDFC (Recepção de Documentos Fiscais)  (`CT-RDF`)

> **Pré-condição de perfil:** exige usuário dos grupos de recepção fiscal (Compras/Contratos). `TOTVS-FS` é bloqueado no início (ver CT-PLT-03-S1).

### CT-RDF-01-H · Recepção de NF condizente (feliz)
- **Prioridade:** P1 · **Tipo:** Funcional/Integração
- **Passos:**
  1. Receber a tarefa RDFC de uma NF.
  2. Conferir `numeroNF`, `serieNF`, `emissaoNF`, `vencimentoNF`, `valorNF`, **chave NFe** e forma de pagamento contra o pedido.
  3. Marcar condizência **Financeira = Sim** e **Faturamento = Sim**.
  4. Concluir/encaminhar.
- **Resultado esperado:** documento aceito; segue o fluxo normal; contador `TENTATIVAS_ERRO` não incrementa.

### CT-RDF-01-S1 · NF com inconsistência
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** marcar condizência **Financeira = Não** (ou Faturamento = Não); registrar observação de inconsistência; confirmar; encaminhar à área de retorno.
- **Resultado esperado:** processo roteia para correção; notificação disparada; observação registrada.

### CT-RDF-01-S2 · Violação de segregação fiscal
- **Prioridade:** P1 · **Tipo:** Segurança/Integração
- **Pré-condições:** cenário que viole `dsProtheus_validaSegregacaoFiscal` (ex.: mesmo usuário demandante e fiscal).
- **Passos:** tentar aprovar a NF nessa condição.
- **Resultado esperado:** bloqueio por segregação de função; ação não é permitida.

### CT-RDF-01-S3 · NF duplicada
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** receber/registrar a mesma NF (número+série+fornecedor) já processada.
- **Resultado esperado:** duplicidade detectada e barrada.

---

## 10. Contratos — Faturamento de Contratos (FatCon)  (`CT-FAT`)

### CT-FAT-01-H · Medição + 3 validações (feliz)
- **Prioridade:** P1 · **Tipo:** Funcional/Integração
- **Pré-condições:** contrato ativo com saldo a medir; competência aberta; Protheus disponível.
- **Passos:**
  1. Iniciar "Faturamento de Contratos".
  2. Selecionar **Fornecedor**, **Nº do Contrato**, **Revisão**, **Competência** e **Filial da Medição** (zooms Protheus).
  3. Conferir tipo/situação do contrato, datas e objeto.
  4. Em **Itens da Medição**, lançar quantidades **≤ Saldo a Medir**; conferir Valor Unit./Total.
  5. Em **Rateio**, informar % Rateio, Centro de Custo e Classe de Valor (somando 100%).
  6. Responder "Houve Prestação de Serviço? Sim"; **Enviar**.
  7. Percorrer **Validação CSE → Validação da Medição CSE → Validação do Fiscal de Contrato**, aprovando em cada uma.
- **Resultado esperado:** medição gravada; cada validador recebe e aprova; pré-nota gerada no Protheus; fornecedor notificado.

### CT-FAT-02-S1 · Quantidade acima do saldo a medir
- **Prioridade:** P1 · **Tipo:** Negativo
- **Passos:** em Itens da Medição, lançar quantidade **> Saldo a Medir** → avançar.
- **Resultado esperado:** bloqueio; medição não aceita acima do saldo.

### CT-FAT-02-S2 · Competência fechada
- **Prioridade:** P2 · **Tipo:** Negativo/Integração
- **Passos:** selecionar uma **competência já encerrada** e tentar medir.
- **Resultado esperado:** bloqueio informando competência fechada.

### CT-FAT-02-S3 · Reprovação em uma das validações
- **Prioridade:** P1 · **Tipo:** Funcional
- **Passos:** na Validação CSE (ou Fiscal), **Reprovar** com justificativa.
- **Resultado esperado:** medição retorna para ajuste; justificativa registrada; pré-nota **não** é gerada.

### CT-FAT-02-S4 · Rateio ≠ 100%
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** informar rateio somando ≠ 100% → avançar.
- **Resultado esperado:** bloqueio de rateio.

### CT-FAT-03-S1 · Medição automática vs manual
- **Prioridade:** P2 · **Tipo:** Integração
- **Pré-condições:** conhecer que `dsSync_executeMedicaoManual` está **inativo** (U-09).
- **Passos:** validar se a medição automática (`dsSync_executeMedicaoAutomatica`, diária 03:00) gera as medições esperadas e se a manual está de fato desativada por decisão.
- **Resultado esperado:** comportamento coerente com a regra combinada com a Cassi; medição automática roda no horário.

---

## 11. Contratos — Delegação de Fiscais  (`CT-DEL`)

### CT-DEL-01-H · Delegar fiscal válido (feliz)
- **Prioridade:** P2 · **Tipo:** Funcional
- **Passos:** iniciar "Delegação de Fiscais de Contrato/Serviço"; escolher contrato, fiscal substituto e período; **Enviar**.
- **Resultado esperado:** delegação registrada; substituto passa a receber as tarefas do fiscal no período.

### CT-DEL-01-S1 · Substituto inválido / sem permissão
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** escolher substituto sem vínculo/permissão de fiscal.
- **Resultado esperado:** bloqueio; substituto inválido não é aceito.

### CT-DEL-01-S2 · Período sobreposto
- **Prioridade:** P3 · **Tipo:** Negativo
- **Passos:** criar delegação cujo período sobrepõe outra vigente para o mesmo fiscal.
- **Resultado esperado:** alerta/bloqueio de sobreposição.

---

## 12. RH — Solicitação de Férias  (`CT-FER`)

> **Pré-condição de perfil:** colaborador RH + gestor. `TOTVS-FS` é bloqueado no início.

### CT-FER-01-H · Solicitar e aprovar férias (feliz)
- **Prioridade:** P1 · **Tipo:** Funcional/Integração
- **Pré-condições:** colaborador com saldo no Protheus; gestor definido.
- **Passos:**
  1. Iniciar "Solicitação de Férias".
  2. Selecionar período aquisitivo e informar dias.
  3. Definir abono/adiantamento 13º (se aplicável).
  4. **Enviar**; logar como gestor e **Aprovar**.
  5. Confirmar integração de volta à folha (Protheus).
- **Resultado esperado:** recibo/aviso de férias gerado; folha atualizada; histórico com a aprovação.

### CT-FER-01-S1 · Saldo insuficiente
- **Prioridade:** P2 · **Tipo:** Negativo/Integração
- **Passos:** solicitar mais dias que o saldo disponível.
- **Resultado esperado:** bloqueio com mensagem de saldo insuficiente.

### CT-FER-01-S2 · Período em conflito
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** solicitar período que sobrepõe férias já marcadas / bloqueio de calendário.
- **Resultado esperado:** bloqueio/alerta de conflito de período.

### CT-FER-01-S3 · Reprovação do gestor
- **Prioridade:** P2 · **Tipo:** Funcional
- **Passos:** gestor **Reprova** com justificativa.
- **Resultado esperado:** solicitação retorna ao colaborador; sem integração à folha.

### CT-FER-01-S4 · Falha na integração com a folha
- **Prioridade:** P2 · **Tipo:** Integração/Negativo
- **Pré-condições:** Protheus indisponível no momento da integração.
- **Passos:** aprovar férias com o serviço de integração fora.
- **Resultado esperado:** erro tratado (retentativa/estado pendente), sem perder a solicitação nem duplicar lançamento.

---

## 13. RH — Banco de Horas & Horas Extras  (`CT-BH`)

### CT-BH-01-H · Portal carrega e autoriza horas extras (feliz)
- **Prioridade:** P1 · **Tipo:** Funcional/Integração
- **Pré-condições:** parâmetros de servidor do portal **configurados**; usuário com banco de horas no Protheus.
- **Passos:** abrir **Gestão do Banco de Horas e Horas Extras**; conferir visão de saldo e divisão; autorizar horas extras de um subordinado.
- **Resultado esperado:** portal carrega com dados; autorização registrada e integrada.

### CT-BH-01-S1 · Parâmetros de servidor ausentes  ⚠️ defeito conhecido (U-02)
- **Prioridade:** P1 · **Tipo:** Negativo/Config
- **Passos:** abrir o portal no estado atual do ambiente.
- **Resultado esperado (atual):** alerta **"Existem parâmetros não informado para esse servidor, informe o administrador"** — registrar como **defeito de configuração**; portal não deve subir sem parâmetros. *(observado)*

### CT-BH-01-S2 · Autorizar horas acima do limite
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** tentar autorizar quantidade de horas acima do permitido pela política.
- **Resultado esperado:** bloqueio/alerta conforme regra.

---

## 14. RH — Gestão de Dependentes / Plano de Saúde  (`CT-DEP`)

### CT-DEP-01-H · Cadastrar dependente (feliz)
- **Prioridade:** P1 · **Tipo:** Funcional/Integração
- **Pré-condições:** titular com matrícula no Protheus.
- **Massa de dados:** dependente "Filho" — nome, CPF válido, nascimento, sexo, grau de parentesco.
- **Passos:**
  1. Iniciar "Gestão de Dependentes".
  2. Confirmar titular (matrícula/e-mail).
  3. Preencher dependente: nome, CPF, nascimento, sexo, **grau de parentesco**, tipos dep. (IR/eSocial/salário-família) — combos vindos de `ds_static_*`.
  4. Selecionar plano/contrato; **Enviar**.
- **Resultado esperado:** POST ao Protheus cria/atualiza o dependente; retorno de sucesso; dependente aparece vinculado ao titular.

### CT-DEP-01-S1 · Dependente duplicado
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** cadastrar dependente com **CPF já existente** para o titular.
- **Resultado esperado:** bloqueio de duplicidade; nada gravado.

### CT-DEP-01-S2 · Grau de parentesco incompatível
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** informar grau de parentesco inválido para o tipo de dependente (ex.: cônjuge com data de nascimento inconsistente).
- **Resultado esperado:** validação impede; mensagem clara.

### CT-DEP-01-S3 · CPF inválido
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** informar CPF com dígito verificador inválido.
- **Resultado esperado:** bloqueio de CPF inválido.

### CT-DEP-02-S1 · Titular sem matrícula / múltiplos vínculos
- **Prioridade:** P2 · **Tipo:** Integração
- **Passos:** iniciar com titular sem matrícula ou com **múltiplos vínculos** (`ds_protheus_getMultiplosVinculos`).
- **Resultado esperado:** trata o titular sem matrícula (bloqueia/alerta) e permite escolher o vínculo correto quando houver mais de um.

---

## 15. RH — Automação de Admissão  (`CT-ADM`)

### CT-ADM-01-H · Admissão integra novo funcionário (feliz)
- **Prioridade:** P2 · **Tipo:** Funcional/Integração
- **Passos:** disparar admissão com dados completos (cargo, departamento); acompanhar o status até finalização (`dts_validaStatusAutAdmis`/`dts_validaFinlAdms`).
- **Resultado esperado:** funcionário integrado ao Protheus; status "finalizado"; matrícula gerada.

### CT-ADM-01-S1 · Dados obrigatórios ausentes
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** disparar admissão faltando cargo/departamento/documento obrigatório.
- **Resultado esperado:** bloqueio; admissão não finaliza; pendência sinalizada.

### CT-ADM-01-S2 · Reprocessamento após falha
- **Prioridade:** P3 · **Tipo:** Integração
- **Passos:** simular falha na integração e reprocessar a atividade (`dts_movAtvdManualAutAdm`).
- **Resultado esperado:** reprocessa sem duplicar o funcionário.

---

## 16. RH — Substituição de Cargos / Delegação de Tarefas  (`CT-SUB`)

### CT-SUB-01-H · Definir substituto válido (feliz)
- **Prioridade:** P2 · **Tipo:** Funcional
- **Passos:** iniciar "Substituição de Cargos"; buscar substituto (Protheus, `dsp_BuscaSubstitutos`); definir período; **Enviar**.
- **Resultado esperado:** substituição válida; substituto recebe as tarefas no período.

### CT-SUB-01-S1 · Substituto sem vínculo ativo
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** escolher substituto inativo/sem vínculo.
- **Resultado esperado:** apenas substitutos válidos (`dsFluig_getAllValidSubstitute`) são aceitos; bloqueio caso contrário.

### CT-SUB-01-S2 · Período retroativo/ inválido
- **Prioridade:** P3 · **Tipo:** Negativo
- **Passos:** informar período com fim antes do início, ou totalmente no passado.
- **Resultado esperado:** validação de datas impede.

---

## 17. RH — Aprovação de Ocorrência  (`CT-OCO`)

### CT-OCO-01-H · Registrar e aprovar ocorrência (feliz)
- **Prioridade:** P3 · **Tipo:** Funcional
- **Passos:** registrar ocorrência de RH; aprovador aprova.
- **Resultado esperado:** ocorrência aprovada; histórico registrado.

### CT-OCO-01-S1 · Ocorrência sem aprovador
- **Prioridade:** P3 · **Tipo:** Negativo
- **Passos:** registrar ocorrência cujo aprovador não está definido.
- **Resultado esperado:** sistema sinaliza a ausência de aprovador; não roteia para o vazio.

---

## 18. Jurídico — SIGAJURI  (`CT-JUR`)

> **Pré-condição de perfil:** membros das áreas jurídicas (`JUR_001 Contencioso`, `JUR_002 Criminal`, `JUR_003 Administrativo`, `JUR_004 Cade`) e aprovadores configurados.

### CT-JUR-01-H · Consultivo — solicitação → parecer → aprovação (feliz)
- **Prioridade:** P1 · **Tipo:** Funcional
- **Pré-condições:** área e aprovador configurados (`dsAreaSigajuri`, `dsAprovadorSigajuri`).
- **Passos:**
  1. Iniciar "Consultas/Pareceres" (`SIGAJURI_Consultivo`).
  2. Preencher área (`cdAreaSol`), grupo, tipo (`cdTipoSol`), natureza, **assunto jurídico** e descrição.
  3. Encaminhar ao advogado; registrar **parecer** (`sParecerAdvg`).
  4. Aprovar por alçada (`sAprovacao`) com justificativa; conferir vínculo da **pasta do caso** (`sPastaCaso`).
  5. Verificar o prazo (~41 dias, único processo com deadline).
- **Resultado esperado:** roteia solicitante → advogado → aprovador; parecer e aprovação registrados; encerra dentro do prazo.

### CT-JUR-01-S1 · Consultivo sem aprovador na área
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** iniciar consultivo para uma área sem aprovador definido.
- **Resultado esperado:** sinaliza ausência de aprovador; não roteia para o vazio.

### CT-JUR-01-S2 · Prazo estourado
- **Prioridade:** P2 · **Tipo:** Funcional
- **Passos:** deixar uma consulta ultrapassar o deadline (~41 dias) ou simular.
- **Resultado esperado:** processo marca atraso/aciona alerta de prazo.

### CT-JUR-02-S1 · Acesso público indevido  🔒
- **Prioridade:** P2 · **Tipo:** Segurança
- **Pré-condições:** `SIGAJURI_Consultivo` está com `public:true`.
- **Passos:** acessar o processo **sem sessão autenticada**.
- **Resultado esperado:** confirmar com a Cassi se a exposição pública é intencional; **se não**, restringir. Dado jurídico não deve ser acessível por processo público.

### CT-JUR-03-H · Contrato — geração de minuta (feliz)
- **Prioridade:** P2 · **Tipo:** Funcional
- **Passos:** iniciar "Solicitação de Contratos"; preencher tipo e partes; **gerar minuta** (`dsGeraMinutaSIGAJURI`).
- **Resultado esperado:** minuta gerada com os dados corretos; documento anexado ao caso.

### CT-JUR-03-S1 · Contrato sem dados obrigatórios da minuta
- **Prioridade:** P3 · **Tipo:** Negativo
- **Passos:** tentar gerar minuta com campos essenciais vazios.
- **Resultado esperado:** bloqueio; minuta não é gerada incompleta.

### CT-JUR-04-H · Contencioso — roteamento por área (feliz)
- **Prioridade:** P2 · **Tipo:** Funcional
- **Passos:** iniciar Contencioso; informar **parte contrária** e cliente; selecionar área (`JUR_00x`); **Enviar**.
- **Resultado esperado:** tarefa roteia para os membros do grupo da área; caso criado.

### CT-JUR-04-S1 · Contencioso sem parte contrária
- **Prioridade:** P3 · **Tipo:** Negativo
- **Passos:** enviar sem informar a parte contrária.
- **Resultado esperado:** validação exige a parte contrária.

### CT-JUR-05-H · Follow-up de processo jurídico (feliz)
- **Prioridade:** P3 · **Tipo:** Funcional
- **Passos:** registrar follow-up (`dsInsFollowupSIGAJURI`) em um processo; salvar.
- **Resultado esperado:** follow-up gravado e visível no histórico do caso.

---

## 19. Saúde — CliniCASSI (Questionário de Diagnóstico)  (`CT-CLI`)

### CT-CLI-01-H · Iniciar e responder o questionário (feliz)
- **Prioridade:** P2 · **Tipo:** Funcional
- **Pré-condições:** período aberto (`dsQDC001/007`); job `dsQDC000` ativo; unidade CliniCASSI válida.
- **Passos:**
  1. Iniciar o questionário para um participante.
  2. Conferir hierarquia e **último exame** (`dsQDC002`) para respeitar a periodicidade.
  3. Responder as perguntas (`dsPerguntas`) e encerrar.
- **Resultado esperado:** só permite iniciar dentro da janela/periodicidade; resultado gravado e refletido no dashboard (`dsQDC006/008`).

### CT-CLI-01-S1 · Fora da janela / periodicidade não cumprida
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** tentar iniciar novo questionário antes de vencer a periodicidade do último exame.
- **Resultado esperado:** bloqueio informando que ainda não é permitido.

### CT-CLI-01-S2 · Questionário incompleto
- **Prioridade:** P3 · **Tipo:** Negativo
- **Passos:** encerrar deixando perguntas obrigatórias sem resposta.
- **Resultado esperado:** bloqueio; não permite finalizar incompleto.

### CT-CLI-02-S1 · Job de início parado  ⚠️ (U-14)
- **Prioridade:** P2 · **Tipo:** Config
- **Passos:** conferir agendamento de `dsQDC000` (última execução 06/10/2023).
- **Resultado esperado:** definir com a Cassi se o job deve rodar; se sim, reativar e validar a criação automática dos processos.

---

## 20. Portal do Fornecedor (externo)  (`CT-PFN`)

> Página `/portal/p/1/portal_fornecedor` — "Portal de Compras e Contratações". Maior superfície de **segurança**.

### CT-PFN-01-H · Login por nível de acesso (feliz)
- **Prioridade:** P1 · **Tipo:** Funcional/Segurança
- **Massa de dados:** um fornecedor de teste por nível.
- **Passos:** acessar o portal; entrar como **Acesso Normal**, depois **Administrador**, depois **via Representatividade**.
- **Resultado esperado:** cada nível autentica e vê **apenas** o escopo que lhe cabe (Normal ≠ Admin ≠ Representatividade).

### CT-PFN-01-S1 · Credencial inválida
- **Prioridade:** P1 · **Tipo:** Negativo/Segurança
- **Passos:** tentar login com senha errada e com fornecedor inexistente.
- **Resultado esperado:** mensagem genérica; sem vazar detalhe técnico; sem enumeração.

### CT-PFN-01-S2 · Força bruta / bloqueio
- **Prioridade:** P2 · **Tipo:** Segurança
- **Passos:** repetir várias tentativas de senha errada para o mesmo fornecedor.
- **Resultado esperado:** existe proteção (throttling/bloqueio temporário/captcha) contra força bruta.

### CT-PFN-02-H · Reset de senha — link de uso único (feliz)
- **Prioridade:** P1 · **Tipo:** Segurança
- **Passos:** solicitar "esqueceu a senha" (`ds_esqueceuSenhaFornecedor`); usar o link de redefinição **uma vez**; definir nova senha.
- **Resultado esperado:** senha alterada (refletida no Protheus, `ds_atualizaSenhaPortalFornecedorProtheus`); login com a nova senha funciona.

### CT-PFN-02-S1 · Reutilização do link de reset
- **Prioridade:** P1 · **Tipo:** Segurança
- **Passos:** usar novamente o mesmo link já consumido.
- **Resultado esperado:** link inválido após o primeiro uso.

### CT-PFN-02-S2 · Link de reset expirado/adulterado
- **Prioridade:** P1 · **Tipo:** Segurança
- **Passos:** usar link expirado; alterar o token/hash da URL.
- **Resultado esperado:** recusado; senha não é alterada.

### CT-PFN-03-H · Primeiro Acesso / Cadastro de Fornecedor (feliz)
- **Prioridade:** P2 · **Tipo:** Funcional/Integração
- **Passos:** **Primeiro Acesso** → gerar hash (`dts_syncGeraHashForn`) → validar integração (`dts_validaIntegracaoForn`) → **Completar Cadastro**.
- **Resultado esperado:** fornecedor integrado; hash válido; acesso liberado.

### CT-PFN-03-S1 · Cadastro fora do prazo
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** completar cadastro após a data-limite (`dts_verificaDataLimiteForn`).
- **Resultado esperado:** bloqueio por prazo expirado.

### CT-PFN-04-H · Participação em Cotações (feliz)
- **Prioridade:** P2 · **Tipo:** Funcional
- **Passos:** logado como fornecedor, abrir **Participação em Cotações**; enviar proposta para uma cotação aberta.
- **Resultado esperado:** proposta registrada e visível para o comprador no fluxo interno de Negociação.

### CT-PFN-05-H · Envio de Documentos Fiscais (feliz)
- **Prioridade:** P2 · **Tipo:** Funcional/Integração
- **Passos:** abrir **Envio de Documentos Fiscais**; anexar NF; enviar.
- **Resultado esperado:** documento entra no fluxo RDFC interno.

### CT-PFN-06-S1 · XSS/injeção no chat do fornecedor  🔒
- **Prioridade:** P1 · **Tipo:** Segurança
- **Passos:** no chat, enviar `<script>alert(1)</script>` e HTML; abrir a mensagem no lado interno (destinatários).
- **Resultado esperado:** conteúdo **escapado**; nenhum script executa; fila/notificação (`dsf_chatFornecedor*`) processa sem quebrar.

### CT-PFN-07-S1 · Isolamento entre fornecedores (IDOR)
- **Prioridade:** P1 · **Tipo:** Segurança
- **Passos:** logado como Fornecedor A, tentar acessar cotação/documento/registro de Fornecedor B alterando o identificador na URL/requisição.
- **Resultado esperado:** acesso negado; fornecedor só enxerga os próprios dados.

---

## 21. Notificações  (`CT-NOT`)

### CT-NOT-01-H · Disparo multicanal (feliz)
- **Prioridade:** P2 · **Tipo:** Funcional/Integração
- **Passos:** disparar um evento que notifica (ex.: aprovação/atraso); validar recebimento por **SMS** (`dsEnvioSMS`), **Teams** (`ds_NotificaTeams`) e **e-mail** (`dsEnviarEmailComAnexos`).
- **Resultado esperado:** mensagem chega nos canais e destinatários corretos, com o conteúdo esperado.

### CT-NOT-01-S1 · Falha de canal não derruba o processo
- **Prioridade:** P2 · **Tipo:** Negativo/Integração
- **Passos:** simular gateway SMS fora, webhook Teams inválido e e-mail sem destinatário.
- **Resultado esperado:** falha é registrada (log) e **não** interrompe o processo (evento `after*` não bloqueia); demais canais seguem.

### CT-NOT-02-S1 · Alertas automáticos sem duplicidade
- **Prioridade:** P3 · **Tipo:** Integração
- **Passos:** deixar pendências que acionam `dsSync_disparoAlertaAutomatico`/`dsSync_disparoPendenciasAutomatico`; rodar o job duas vezes na janela.
- **Resultado esperado:** um alerta por pendência; reexecução não duplica avisos.

---

## 22. Integração Protheus  (`CT-INT`)

### CT-INT-01-H · Datasets de consulta retornam dados (feliz)
- **Prioridade:** P1 · **Tipo:** Integração
- **Passos:** exercitar cada família (`dsProtheus_getFornecedores`, `getProdutos`, `getContratos`, `getFuncionarios`, `getDependentes`, etc.) via a tela que a consome.
- **Resultado esperado:** dados corretos e coerentes com o ERP.

### CT-INT-01-S1 · ERP indisponível
- **Prioridade:** P1 · **Tipo:** Integração/Negativo
- **Passos:** com o Protheus fora, abrir telas que dependem dele.
- **Resultado esperado:** mensagem de indisponibilidade; sem combo vazio silencioso nem tela branca (ver CT-CMP-03-S1).

### CT-INT-02-S1 · Sincronização em erro  ⚠️ (U-12)
- **Prioridade:** P1 · **Tipo:** Integração
- **Pré-condições:** acesso admin ao painel de datasets.
- **Passos:** localizar `ds_protheus_getFuncionarios_restGetAll`, `ds_protheus_getFuncoes_restGetAll` e `dsConsulta_Atv_ProcCompra_VerifVigencia_Sync` (status **ERRO**); disparar sincronização manual; ler o log.
- **Resultado esperado:** sincroniza OK ou expõe a causa raiz; dados de RH deixam de ficar defasados.

### CT-INT-03-S1 · Dado defasado de dataset `_Sync`
- **Prioridade:** P2 · **Tipo:** Integração
- **Passos:** alterar um dado no Protheus e consultar antes da próxima sincronização do `_Sync` correspondente.
- **Resultado esperado:** comportamento de cache é conhecido/aceitável; janelas de sincronização documentadas.

---

## 23. Segurança & Administração  (`CT-SEG`)

### CT-SEG-01-S1 · Dataset sem filtro no código (vazamento)  🔒 (observado)
- **Prioridade:** P1 · **Tipo:** Segurança
- **Passos:** executar o dataset `colleague` (ou custom) com constraint de 1 registro:
  `/api/public/ecm/dataset/search?datasetId=colleague&constraintFields=colleagueId&constraintValues=<login>`.
- **Resultado esperado (correto):** retornar **apenas** o registro filtrado.
- **Observado:** a constraint **não** é aplicada — retornou os 3.493 usuários. **Datasets que expõem dado sensível precisam filtrar no próprio código.** Auditar todos os `search` que recebem input.

### CT-SEG-02-S1 · Least-privilege dos administradores  🔒 (U-13)
- **Prioridade:** P1 · **Tipo:** Segurança
- **Pré-condições:** acesso admin.
- **Passos:** listar os 21 usuários admin; identificar contas de serviço (`consumerKey`, `fluig_consumer_key`, "Usuário Integrador Fluig", "Usuario Integracao", "Integracao Juridico").
- **Resultado esperado:** contas de integração **não** devem ter privilégio de admin de plataforma; restringir ao mínimo necessário.

### CT-SEG-03-S1 · Credencial de integração exposta  🔒 (U-03)
- **Prioridade:** P1 · **Tipo:** Segurança
- **Passos:** inspecionar o dataset `ds_Fluig` ("Usuário e Senha usuario de integração").
- **Resultado esperado:** credenciais **não** devem estar em claro num dataset; mover para cofre/parametrização segura.

### CT-SEG-04-S1 · Execução de SQL / injeção  🔒 (U-04)
- **Prioridade:** P1 · **Tipo:** Segurança
- **Passos:** auditar `dsFluig_executeSql`/`dsFluig_getDocumentSql`; testar entrada com caracteres de injeção onde houver parâmetro vindo de formulário.
- **Resultado esperado:** SQL parametrizado; entrada maliciosa não altera a consulta.

### CT-SEG-05-S1 · Acesso admin negado a não-admin  (observado, U-15)
- **Prioridade:** P2 · **Tipo:** Segurança
- **Passos:** como `TOTVS-FS` (não-admin), acessar `/webdesk` e telas do Painel de Controle.
- **Resultado esperado:** **403/negado** — como observado; usuário comum não alcança administração.

### CT-SEG-06-S1 · Vazamento de dados a serviço externo (LGPD)  (U-11)
- **Prioridade:** P2 · **Tipo:** Segurança/Governança
- **Passos:** monitorar a rede ao navegar; observar chamadas a `google-analytics.com` (`G-F0FT6D1NQG`) com URL/título.
- **Resultado esperado:** validar com Privacidade/LGPD se o envio de URLs a serviço externo é aceitável para uma operadora de saúde.

---

---

## 24. Compras — SC aberta pelo Portal de Acompanhamento de Contratos  (`CT-ACC`)

### Por que estes dois módulos existem

O documento `Casos de teste - Cassi.md` cobre a Solicitação de Compras **apenas pelo caminho clássico** (`Processos → Iniciar Solicitações → Solicitação de Compras`, ou `pageworkflowview?processID=wf_solicitacao_compras`). Esse é um **formulário em branco preenchido à mão**.

O que o dev pediu é **outro ponto de entrada, com outro código por trás**: a SC nasce de um **contrato existente**, com o payload montado por JavaScript no widget — filial, itens, rateios, valores e datas vêm do Protheus, não do usuário. Nenhum caso `CT-CMP-*` exercita esse caminho, e nenhum caso do documento exercita a **cadeia completa** até o comprador. Daí dois módulos novos:

| Módulo | Escopo |
|---|---|
| `CT-ACC` | O portal de Acompanhamento de Contratos e o nascimento da SC a partir do contrato |
| `CT-E2E` | A cadeia de compras ponta a ponta, da SC nascida no portal até o vencedor da cotação |

### Mapa técnico do caminho (destrinchado do código do widget)

```
[Grid de 885 contratos: CN9]
   └─ linha → coluna "Ação" → ícone "Solicitação de Compra"  (.btn-solicitacao-compra)
        ├─ solicitacaoGeneration++   (token anti-corrida de duplo clique)
        ├─ buscarDadosFilial()       → dsProtheus_getBranches_restGetAll  (Code = CN9_FILIAL)
        │     └─ mescla filialDescription / filialCgc / filialCode
        ├─ openSolicitacaoCompra()   → modal FTL `solicitacao_compra.ftl`
        │     ├─ campos: tipoSolicitacao · numeroContrato (pré-preenchido) · dtNecessidade · motivoSolCompra
        │     └─ buscarItensPlanilha() → dsProtheus_getItensPlanilha_restGetAll
        │            (CorporateId=01, BranchId, CNB_FILIAL, CNB_CONTRA, CNB_REVISA)
        │            └─ enriquece com produtos (B1_*), rateios (CNZ_*) e preço histórico
        └─ [Confirmar]
              ├─ valida os 4 campos obrigatórios (client-side, no handler)
              ├─ aguarda itensLoadingPromise + exige listProdutos.length > 0
              ├─ POST /process-management/api/v2/processes/wf_solicitacao_compras/start
              │     targetState: 6 · targetAssignee: "consumerkeycompras"
              └─ transferToProcess() → dsFluig_postProcessesTransfer
                    consumerkeycompras → matrícula do usuário
```

### Regras de negócio embutidas no código (fonte dos casos negativos)

| # | Regra observada no código | Caso |
|---|---|---|
| R1 | Acesso restrito a `G.P.Acompanhamento_Renovacao_Contratos` / `G.P.Acompanhamento_Renovacao_contratos_admin` | CT-ACC-01 |
| R2 | Filial não encontrada / dataset em erro → **toast e abre o modal assim mesmo** | CT-ACC-03-S1/S2 |
| R3 | 4 campos obrigatórios validados **só no cliente** | CT-ACC-04-S1 |
| R4 | `listProdutos` vazio → bloqueia o envio | CT-ACC-04-S2 |
| R5 | `submittingProcess` + `disabled` → antiduplo-clique | CT-ACC-04-S3 |
| R6 | `__generation` → protege contra dois cliques em contratos diferentes | CT-ACC-04-S4 |
| R7 | `numeroContrato` tem o atributo **`disabled`** (usuário comum não digita), mas o widget lê o valor com `.val()` e o envia como `nrContrato` **sem revalidação de coerência no servidor** | CT-ACC-04-S5 |
| R8 | Itens com `quant<=0` **ou** `vlunit<=0` são **descartados silenciosamente** (filter + reindex) | CT-ACC-06-S1 |
| R9 | `resolveQuant`: CNB_QUANT → CNB_QTDORI → CNB_QTRDRZ → fallback 1 (serviços) | CT-ACC-06-S2 |
| R10 | Falha do `transferToProcess` é engolida (`console.log`; o toast está **comentado**) | CT-ACC-05-S1 |
| R11 | Valores hardcoded no payload, com `// Verificar de onde vem esse valor` no próprio código | CT-ACC-07-S1 |
| R12 | Valores monetários enviados em BR-money para não corromper a máscara `data-money` do form 256831 | CT-ACC-08-S1 |

### Massa de dados homologada (levantada no ambiente em 20/08/2026)

| Apelido | Filial | Contrato | Rev. | Situação | Itens | Serve para |
|---|---|---|---|---|---|---|
| **M1 — limpo** | 2101 | `000000000000010` | 001 | 05 Vigente | 2 | Caminho feliz (CT-ACC-05-H, CT-E2E) |
| **M2 — médio** | 2801 | `000000000000009` | 002 | 05 Vigente | 4 | Segunda SC / concorrência |
| **M3 — volumoso** | 2901 | `000000000000013` | 009 | 05 Vigente | **177** | Carga/performance do modal |
| **M4 — serviço atípico** | 4101 | `000000000000002` | 001 | 09 Revisão | 2 (`CNB_QUANT` vazio, `CNB_VLUNIT`=1) | Fallback de quantidade e valor (R9) |
| **M5 — sem revisão** | 2501 | `0000-2025-2501-` | *(vazia)* | 08 Finalizado | ? | Contrato finalizado / chave incompleta |

> Situação (`CN9_SITUAC`): `01` Em digitação · `05` Vigente · `06` Paralisado · `07` Sol. Finalização · `08` Finalizado · `09` Revisão · `11` Cancelado. Distribuição atual: 545 vigentes, 141 finalizados, 72 paralisados, 59 sol. finalização, 41/16 iniciais, 7 em revisão, 3 cancelados, 1 outro.

### Perfis necessários

| Perfil | Cobre | Disponível hoje? |
|---|---|---|
| Membro de `G.P.Acompanhamento_Renovacao_Contratos` | CT-ACC-01..08 | ✅ `TOTVS-FS` |
| Gestor imediato (pool de Compras) | CT-E2E-02 | ✅ `TOTVS-FS` |
| Aprovador orçamentário / de alçada (tabela **AL** do Protheus) | CT-E2E-03/04 | ❌ pessoa designada (ex.: Erlon) |
| **Comprador** cadastrado na **SY1/Y1** do Protheus | CT-E2E-05..09 | ❌ 28 compradores cadastrados; `TOTVS-FS` **não** é um deles |

> ⚠️ **Restrição estrutural da run:** `TOTVS-FS` não está na SY1 (compradores) nem na AL (alçadas). O ciclo é executável de ponta a ponta **até a Validação do Gestor Imediato**; das alçadas em diante exige credencial de pessoa designada. Isso não é defeito do sistema — é pré-condição de massa/cadastro no ERP.

### CT-ACC-01-H · Acesso ao portal por usuário autorizado
- **Prioridade:** P1 · **Tipo:** Funcional/Segurança
- **Pré-condições:** usuário em `G.P.Acompanhamento_Renovacao_Contratos` (ou `_admin`).
- **Passos:**
  1. Autenticar no Fluig.
  2. Acessar `/portal/p/1/acompanhamentoContrato`.
  3. Aguardar a carga da grade.
- **Resultado esperado:** título "Acompanhamento de Contratos"; grade carregada com as colunas **Filial · Tipo Contrato · Contrato · Data Início · Data Fim · Nº Revisão · Status · Fornecedor · Ação**; seletor de página (Todos/10/25/50/75/100) e busca funcionam; **sem** o alerta de acesso negado.

### CT-ACC-01-S1 · Acesso negado a usuário fora dos grupos
- **Prioridade:** P1 · **Tipo:** Segurança
- **Pré-condições:** usuário **sem** os dois grupos.
- **Passos:** acessar `/portal/p/1/acompanhamentoContrato`.
- **Resultado esperado:** toast **"Acesso negado — Você não possui permissão para acessar este painel."** e o corpo do widget substituído pelo alerta *"Você não possui permissão para acessar o Acompanhamento de Contratos."*; **nenhum contrato é listado**; nenhuma ação de SC disponível.

### CT-ACC-01-S2 · Falha ao validar a permissão (dataset `colleagueGroup` indisponível)
- **Prioridade:** P2 · **Tipo:** Negativo/Integração
- **Passos:** simular erro no `POST /api/public/ecm/dataset/datasets` para `colleagueGroup` e recarregar a página.
- **Resultado esperado:** mensagem **distinta** de "acesso negado" — *"Falha ao validar suas permissões. Recarregue a página…"*. O sistema **não** pode tratar erro de rede como ausência de permissão (o código separa os dois; o teste protege essa separação).

### CT-ACC-02-H · Ações disponíveis na linha do contrato
- **Prioridade:** P2 · **Tipo:** UI/Funcional
- **Passos:** localizar um contrato (busca por número); observar a coluna **Ação**.
- **Resultado esperado:** exatamente 3 ações com *tooltip*: **Planilha**, **Solicitação de Compra**, **Informações do Contrato**. Cada uma abre seu respectivo modal.

### CT-ACC-02-S1 · Status do contrato exibido de forma legível
- **Prioridade:** P3 · **Tipo:** UI
- **Passos:** filtrar por diferentes status; conferir a coluna **Status**.
- **Resultado esperado:** o código do ERP é traduzido (05 → *Vigente*, 08 → *Finalizado*, 11 → *Cancelado*…), e a busca encontra tanto pelo código quanto pela descrição. Códigos novos configurados no ERP não podem aparecer crus.

### CT-ACC-03-H · Abrir o modal de SC a partir do contrato ⭐ **caso-âncora do pedido do dev**
- **Prioridade:** P1 · **Tipo:** Funcional/Integração
- **Pré-condições:** massa **M1** (2101 / `000000000000010` / rev 001).
- **Passos:**
  1. No portal, buscar `000000000000010`.
  2. Na coluna **Ação**, clicar no ícone **Solicitação de Compra**.
  3. Aguardar o carregamento (busca de filial e itens).
- **Resultado esperado:**
  - modal **"Solicitação de Compra"** abre;
  - campo **Contrato** já vem preenchido com `000000000000010` (vindo de `CN9_NUMERO`);
  - **Tipo de Solicitação** oferece *Renovação Contratual · Aditivo Contratual · Nova Solicitação*;
  - **Data de Necessidade** e **Motivo da Solicitação** vazios;
  - ações **Confirmar** e **Fechar**;
  - a filial do contrato é resolvida via `dsProtheus_getBranches_restGetAll` (código, descrição e CGC ficam disponíveis para o payload);
  - os itens do contrato são carregados via `dsProtheus_getItensPlanilha_restGetAll` **sem** erro no console.

### CT-ACC-03-S1 · Filial do contrato não encontrada
- **Prioridade:** P2 · **Tipo:** Negativo/Integração
- **Passos:** acionar a SC em um contrato cuja `CN9_FILIAL` não exista no cadastro de filiais do Protheus.
- **Resultado esperado (comportamento atual):** toast de aviso *"Nenhum dado de filial encontrado. Abrindo modal sem informações complementares."* e o modal **abre mesmo assim**.
- **Ponto de decisão:** a SC nascerá com `cgcFilial`, `zoomNomeFilial` e `zoomCodNomeFilial` vazios/parciais. **Confirmar com a Cassi** se prosseguir é aceitável ou se deve bloquear.

### CT-ACC-03-S2 · Protheus indisponível ao abrir a SC
- **Prioridade:** P1 · **Tipo:** Integração/Negativo
- **Passos:** com o serviço REST do Protheus fora, clicar em **Solicitação de Compra**.
- **Resultado esperado:** toast **"ERRO: Erro ao buscar dados da filial: …"** com a causa; o modal abre sem os dados da filial; ao tentar **Confirmar**, o bloqueio de *"Nenhum item de contrato foi carregado"* impede a criação de uma SC vazia. **Não pode** haver tela branca, modal travado ou SC criada sem itens.

### CT-ACC-03-S3 · Contrato volumoso (177 itens)
- **Prioridade:** P2 · **Tipo:** Performance/Funcional
- **Pré-condições:** massa **M3** (2901 / `000000000000013` / rev 009).
- **Passos:** abrir a SC a partir desse contrato e aguardar o carregamento completo.
- **Resultado esperado:** o *loading* é exibido enquanto carrega; todos os itens elegíveis são carregados antes de habilitar o envio; o navegador não trava; a SC criada contém todos os itens válidos.

### CT-ACC-04-S1 · Confirmar com campos obrigatórios vazios
- **Prioridade:** P1 · **Tipo:** Negativo
- **Passos:** com o modal aberto (M1), clicar **Confirmar** sem preencher nada.
- **Resultado esperado:** toast **"Campos Obrigatórios — Por favor, preencha: Tipo de Solicitação, Motivo da Solicitação, Data de Necessidade"**; **nenhuma** requisição de start é disparada; nenhuma SC é criada.
- **Variações:** repetir omitindo **um** campo por vez e conferir que a mensagem cita **exatamente** o campo faltante.
- **Observação de risco:** os campos **não** têm `required` no HTML — a validação vive só no handler do botão. Conferir que a regra é reforçada no servidor/fluxo (ver CT-ACC-04-S6).

### CT-ACC-04-S2 · Contrato sem itens elegíveis
- **Prioridade:** P1 · **Tipo:** Negativo
- **Passos:** abrir a SC em um contrato sem itens de planilha (ou com todos os itens zerados), preencher os 4 campos e **Confirmar**.
- **Resultado esperado:** toast **"Aguarde — Nenhum item de contrato foi carregado. Verifique se o contrato possui itens e tente novamente."**; o botão **Confirmar** volta a ficar habilitado; **nenhuma SC é criada**.

### CT-ACC-04-S3 · Duplo clique em Confirmar não duplica a SC
- **Prioridade:** P1 · **Tipo:** Negativo/Concorrência
- **Passos:** preencher o modal (M1) e clicar **Confirmar** duas vezes em rápida sucessão.
- **Resultado esperado:** o botão é desabilitado no primeiro clique; **exatamente uma** requisição de start; **uma única** SC criada. Conferir em *Minhas Solicitações* que não há SC gêmea.

### CT-ACC-04-S4 · Dois contratos abertos em sequência rápida
- **Prioridade:** P2 · **Tipo:** Negativo/Concorrência
- **Passos:** clicar no ícone de SC do contrato **M1** e, antes de terminar de carregar, clicar no do contrato **M2**.
- **Resultado esperado:** o modal que permanece exibe os itens do **último** contrato clicado (M2) — a resposta atrasada do primeiro **não** pode contaminar a lista (proteção `__generation`). A SC criada deve conter os itens de M2 e `nrContrato` de M2.

### CT-ACC-04-S5 · Número do contrato alterado à mão no modal 🔎
- **Prioridade:** P2 · **Tipo:** Negativo/Integridade
- **Passos:** abrir a SC no contrato **M1**; no campo **Contrato**, apagar e digitar o número de **M2**; preencher o resto; **Confirmar**.
- **Resultado esperado:** o campo tem o atributo **`disabled`** — a UI impede a digitação pelo usuário comum (**reverificado em 21/08/2026**: `disabled: true`, `readOnly: false`). Forçando o valor pelo console, porém, a SC nasce com `nrContrato` de um contrato e **itens, filial e revisão de outro**: não há revalidação de coerência no servidor. Severidade baixa (exige devtools).
- **Reteste 21/08/2026:** SC **112121** criada declarando `nrContrato` `000000000000009`, mas com `revisaContrato` `001`, filial `2101` e itens do contrato `000000000000010`.

### CT-ACC-04-S6 · Bypass da validação de cliente
- **Prioridade:** P2 · **Tipo:** Segurança
- **Passos:** com o modal aberto, remover via console o bloqueio de validação (ou disparar o `POST .../wf_solicitacao_compras/start` diretamente) com `motivoSolCompra` e `tipoSolicitacao` vazios.
- **Resultado esperado:** o processo **não** deve prosseguir com campos de negócio vazios — o formulário precisa rejeitar. Toda validação de cliente é UX; a regra tem de existir no servidor.
- **Resultado observado (21/08/2026) — parcial:**
  - `motivoSolCompra` vazio → **HTTP 500**, rejeitado: *"O campo \"Justificativa para a Solicitação\" é obrigatório!"* ✅
  - `tipoSolicitacao` vazio → **HTTP 200**, SC **112123 criada** ❌ — o servidor **não** valida este campo (defeito **D-10**).

### CT-ACC-05-H · Confirmar cria a SC e ela chega ao solicitante ⭐ **caso-âncora do pedido do dev**
- **Prioridade:** P1 · **Tipo:** Funcional/Integração
- **Pré-condições:** massa **M1**; usuário autorizado.
- **Massa de dados:** Tipo = *Renovação Contratual* · Data de Necessidade = hoje + 30 dias · Motivo = `QA TBC - teste E2E via Acompanhamento de Contratos`.
- **Passos:**
  1. Abrir a SC a partir do contrato (CT-ACC-03-H).
  2. Preencher **Tipo de Solicitação**, **Data de Necessidade** e **Motivo da Solicitação**.
  3. Clicar **Confirmar**.
- **Resultado esperado:**
  - toast **"Sucesso! Processo &lt;N&gt; iniciado com sucesso!"** com o número da solicitação;
  - `POST /process-management/api/v2/processes/wf_solicitacao_compras/start` retorna **200** com `processInstanceId`;
  - em seguida ocorre a **transferência** de `consumerkeycompras` para a matrícula do solicitante;
  - o modal fecha;
  - a solicitação aparece em **Central de Tarefas → Solicitações → Solicitadas por mim** e a tarefa está com o **usuário**, não com a conta de integração.
- **Pós-condição:** registrar o número da SC criada para rastreio e limpeza.

### CT-ACC-05-S1 · Falha na transferência deixa a SC com a conta de integração ⚠️
- **Prioridade:** P1 · **Tipo:** Negativo/Integração
- **Contexto:** no código, o erro do `transferToProcess` só faz `console.log` — o toast de aviso está **comentado** e o modal fecha do mesmo jeito.
- **Passos:** provocar falha na transferência (ex.: indisponibilizar `dsFluig_postProcessesTransfer`) e criar a SC.
- **Resultado esperado (correto):** o usuário é avisado de que a solicitação foi criada **mas não pôde ser atribuída a ele**, com o número da SC.
- **Resultado provável (atual):** o usuário vê apenas *"Processo N iniciado com sucesso"*, o modal fecha e a tarefa **fica presa com `consumerkeycompras`** — invisível para o solicitante. **Registrar como defeito** se confirmado.

### CT-ACC-05-S2 · Erro no start do processo
- **Prioridade:** P1 · **Tipo:** Negativo/Integração
- **Passos:** provocar erro no endpoint de start (ex.: revogar permissão de início) e **Confirmar**.
- **Resultado esperado:** toast **"Erro! …"** com a mensagem retornada; o botão **Confirmar** é reabilitado para nova tentativa; nenhuma SC parcial é deixada para trás.

### CT-ACC-06-S1 · Itens zerados são descartados silenciosamente 🔎
- **Prioridade:** P1 · **Tipo:** Negativo/Integridade
- **Contexto:** o serviço filtra `quant > 0 && vlunit > 0` e **reindexa** os itens, sem avisar o usuário.
- **Passos:** abrir a SC em um contrato que tenha itens com quantidade **ou** valor unitário zerados; **Confirmar**; abrir a SC criada.
- **Resultado esperado (a validar com a Cassi):** o usuário deve ser informado de quantos itens do contrato **não** entraram na SC. Nascer com menos itens do que o contrato, em silêncio, é risco de compra incompleta.

### CT-ACC-06-S2 · Contrato de serviço sem quantidade
- **Prioridade:** P2 · **Tipo:** Negativo/Integração
- **Pré-condições:** massa **M4** (4101 / `000000000000002` / rev 001 — `CNB_QUANT` vazio, `CNB_VLUNIT` = 1).
- **Passos:** abrir a SC nesse contrato; **Confirmar**; conferir os itens na SC criada.
- **Resultado esperado:** a quantidade é resolvida pela cadeia `CNB_QUANT → CNB_QTDORI → CNB_QTRDRZ → 1`; o valor do item **não** pode nascer como `R$ 1,00` quando o contrato tem valor atual relevante — deve usar o valor rateado ou o total do item. Divergência aqui contamina a **Validação Orçamentária** (Total Estimado a Aprovar).

### CT-ACC-07-S1 · Valores fixos no payload da SC 🔎
- **Prioridade:** P2 · **Tipo:** Integridade/Governança
- **Contexto:** o serviço grava valores constantes, alguns com o comentário `// Verificar de onde vem esse valor` no próprio código.
- **Passos:** criar SCs a partir de contratos de **tipos diferentes** (ex.: 091 Elevadores e 017 Dedetização) e comparar os campos gerados.
- **Campos a conferir:** `tbprod_classeOrca` (`133017`), `tbprod_classificacao` (`Tecnologia`), `campoDescritor` (`Sol. Compras - CASSI SEDE`), `masterid` (`3590`), `documentid` (`262649`), `cardid` (`251962`), `codEmpresa` (`01`), `numRevProcesso` (`001`), `ignorarSolicitante` (`Sim`).
- **Resultado esperado:** **confirmar com a Cassi** quais desses são legitimamente fixos. Classificar todo contrato como *Tecnologia* e usar uma única classe orçamentária para qualquer tipo de contrato é candidato a defeito de negócio.

### CT-ACC-08-H · Rastreabilidade contrato ↔ SC
- **Prioridade:** P1 · **Tipo:** Funcional
- **Passos:** abrir a SC criada em CT-ACC-05-H e inspecionar o formulário.
- **Resultado esperado:** `nrContrato` = número do contrato de origem; `revisaContrato` = `CN9_REVISA`; `codFilial`/`zoomCodNomeFilial` = filial do contrato no formato `CÓDIGO - DESCRIÇÃO`; `tipoSolicitacao` e `motivoSolCompra` conforme digitado; solicitante = usuário que clicou; itens com código, descrição, unidade, grupo e conta contábil do contrato.

### CT-ACC-08-S1 · Máscara monetária não corrompe os valores
- **Prioridade:** P1 · **Tipo:** Negativo/Integridade
- **Contexto:** o form 256831 tem máscara `data-money`; valores em formato US corrompem o valor cru.
- **Passos:** criar SC a partir de contrato com item de valor alto (≥ R$ 1.000.000,00); abrir a SC e conferir **Preço Unitário** e **Valor Total** na tela **e** o valor cru no formulário; avançar até a **Validação Orçamentária** e conferir o **Total Estimado a Aprovar**.
- **Resultado esperado:** o valor exibido e o valor cru são o **mesmo número**; o total estimado bate com a soma dos itens. Sem "R$ NaN" e sem valor inflado por casa decimal perdida.

### CT-ACC-08-S2 · Rateio do contrato chega íntegro na SC
- **Prioridade:** P2 · **Tipo:** Funcional/Integração
- **Passos:** usar um contrato com rateio configurado (múltiplos centros de custo); criar a SC; abrir o painel de rateio dos itens.
- **Resultado esperado:** cada item traz suas linhas de rateio com **% Rateio, Centro de Custo (código - descrição) e Classe de Valor (código - descrição)**; o cabeçalho indica *"Item N da Solicitação"* correto; percentuais somam o previsto no contrato; nenhuma linha de rateio vazia.

---

## 25. Compras — Ciclo ponta a ponta a partir do contrato  (`CT-E2E`)

> **Cadeia sob teste:** SC nascida no portal → Gestor Imediato → Validação Orçamentária → Compradores/Alçadas → Gerência de Compras (atribuição) → Portal do Comprador (Validação Inicial → Controle de Cotações → Avaliação de Propostas → Definir Vencedor) → Pedido no Protheus.
> Cada etapa é um caso, para que a run possa parar na etapa bloqueada sem invalidar as anteriores.

### CT-E2E-01-H · Etapa 1 — SC nasce no estado correto e com o dono correto
- **Prioridade:** P1 · **Tipo:** Integração
- **Pré-condições:** SC criada em CT-ACC-05-H.
- **Passos:** consultar a solicitação (Central de Tarefas → Solicitações, e/ou `GET /process-management/api/v2/requests/<N>`).
- **Resultado esperado:** processo `wf_solicitacao_compras` ativo; estado inicial conforme o desenho do fluxo (o portal inicia com `targetState: 6`); responsável = **solicitante** (após a transferência), **não** `consumerkeycompras`; formulário com os dados do contrato.

### CT-E2E-02-H · Etapa 2 — Validação do Gestor Imediato (aprovar)
- **Prioridade:** P1 · **Tipo:** Funcional
- **Pré-condições:** SC de CT-E2E-01-H aguardando o gestor; usuário no pool de gestores de Compras.
- **Passos:** Central de Tarefas → **Tarefas em pool** → assumir a tarefa da SC → conferir os dados herdados do contrato → **Aprovar** → confirmar.
- **Resultado esperado:** a SC avança para a **Validação Orçamentária**; o histórico registra aprovador, data e comentário.

### CT-E2E-02-S1 · Etapa 2 — Reprovação devolve para correção **preservando os dados do contrato**
- **Prioridade:** P1 · **Tipo:** Funcional/Negativo
- **Passos:** na tarefa do gestor, **Reprovar** com justificativa; logar como solicitante e abrir a tarefa de correção.
- **Resultado esperado:** a SC volta para `Requisicao_de_Compras_Correcoes`; a justificativa aparece; **os itens, rateios, contrato e revisão vindos do portal continuam íntegros** (o retorno não pode zerar o que veio do contrato); é possível corrigir e reenviar.

### CT-E2E-03-H · Etapa 3 — Validação Orçamentária
- **Prioridade:** P1 · **Tipo:** Funcional/Integração
- **Pré-condições:** aprovador orçamentário designado (tabela **AL** do Protheus); consenso configurado.
- **Passos:** logar como aprovador designado; abrir a tarefa; conferir o **Total Estimado a Aprovar** contra a soma dos itens; **Aprovar**.
- **Resultado esperado:** total confere com os itens vindos do contrato (ver CT-ACC-08-S1); a SC segue para a validação de compradores/alçadas; consenso registrado.

### CT-E2E-03-S1 · Etapa 3 — Valor acima da alçada
- **Prioridade:** P1 · **Tipo:** Negativo/Integração
- **Pré-condições:** SC originada de contrato de valor alto (ex.: M3, R$ 11,9 mi).
- **Passos:** levar a SC até a etapa de alçada.
- **Resultado esperado:** o sistema exige o nível de aprovação correspondente à faixa; se não houver aprovador para a faixa, sinaliza **explicitamente** — a SC não pode ficar parada em silêncio.

### CT-E2E-04-H · Etapa 4 — Validação de Compradores / Alçadas
- **Prioridade:** P1 · **Tipo:** Funcional
- **Passos:** aprovar nas etapas `Validacao_Compradores` e `Validacao_Alcadas`.
- **Resultado esperado:** a SC é liberada para atribuição a um comprador; histórico completo.

### CT-E2E-05-H · Etapa 5 — Gerência de Compras atribui a SC a um comprador
- **Prioridade:** P1 · **Tipo:** Funcional
- **Pré-condições:** SC liberada; acesso a `/portal/p/1/gerenciaCompras`.
- **Passos:** abrir **Gerência de Compras** → aba **Atribuir** → localizar a SC → selecionar um dos compradores cadastrados → confirmar.
- **Resultado esperado:** a SC passa a constar para o comprador escolhido; a aba **Transferir** permite trocar o comprador depois.
- **Observação:** o combo de compradores vem da **SY1/Y1** do Protheus (28 pessoas). Usuário fora dessa tabela **não** é selecionável — comportamento correto, mas limita quem pode executar as etapas seguintes.

### CT-E2E-06-H · Etapa 6 — Portal do Comprador: Validação Inicial
- **Prioridade:** P1 · **Tipo:** Funcional
- **Pré-condições:** logar como o **comprador designado**.
- **Passos:** `/portal/p/1/portal-do-comprador` → **Validação Inicial** → localizar a SC → validar os dados herdados do contrato → avançar.
- **Resultado esperado:** a SC aparece para o comprador designado (e **só** para ele); os dados do contrato de origem estão visíveis; a validação avança para a cotação.

### CT-E2E-07-H · Etapa 7 — Controle de Cotações
- **Prioridade:** P1 · **Tipo:** Funcional/Integração
- **Passos:** no Portal do Comprador → **Controle De Cotações** → gerar/abrir a cotação da SC → conferir itens e quantidades.
- **Resultado esperado:** a cotação nasce com os itens da SC (que vieram do contrato); número de cotação gerado; fornecedores podem ser convidados.

### CT-E2E-08-H · Etapa 8 — Avaliação de Propostas
- **Prioridade:** P1 · **Tipo:** Funcional
- **Passos:** no Portal do Comprador → **Avaliação de Propostas** → localizar a linha da SC → abrir a análise.
- **Resultado esperado:** a grade traz **Status, Nº Cotação, Filial, Nº SC, Proc. Fluig, Tipo de Documento, Parecer Técnico, Em Alçada, Dt. Validade e Valor Final**; a SC criada pelo portal é rastreável até aqui pelo **Nº SC / Proc. Fluig**; propostas dos fornecedores são comparáveis.

### CT-E2E-09-H · Etapa 9 — Definir Vencedor da Cotação
- **Prioridade:** P1 · **Tipo:** Funcional
- **Passos:** Portal do Comprador → **Definir Vencedor Cotação** → escolher a proposta vencedora → confirmar.
- **Resultado esperado:** vencedor registrado; a SC segue para geração do pedido; histórico com o critério de escolha.

### CT-E2E-10-H · Etapa 10 — Encerramento e retorno ao ERP
- **Prioridade:** P1 · **Tipo:** Integração
- **Passos:** acompanhar a conclusão do processo até o pedido de compra.
- **Resultado esperado:** processo encerrado; pedido gerado no Protheus vinculado à SC; a SC sai das pendências; **o contrato de origem permanece rastreável** a partir do pedido.

### CT-E2E-11-H · Rastreio transversal pelo Tracker
- **Prioridade:** P2 · **Tipo:** Funcional
- **Passos:** abrir `/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS` e localizar a SC criada pelo portal.
- **Resultado esperado:** o tracker mostra a posição atual da SC e o caminho percorrido, coerente com o histórico do processo.

### CT-E2E-12-S1 · Duas SCs para o mesmo contrato/revisão
- **Prioridade:** P2 · **Tipo:** Negativo
- **Passos:** criar uma segunda SC a partir do **mesmo** contrato e revisão de M1.
- **Resultado esperado (a validar com a Cassi):** o portal deve alertar sobre a SC já existente/em andamento para aquele contrato. Duplicar renovação de contrato em silêncio é risco de compra em duplicidade.

---

## 26. Registro de execução (preencher ao rodar)

Execução parcial em **19/08/2026** por QA (via Playwright MCP), com o login **TOTVS-FS** (perfil Compras/Contratos, não-admin). Screenshots na pasta `evidencias/`.

| ID | Status | Evidência | Observações |
|---|---|---|---|
| CT-PLT-01-H | ✅ Passou | `CT-PLT-01-H_home.png` | Home carrega Meus Apps e contadores |
| CT-CMP-01-H | ✅ Passou (form) | `CT-CMP-01-H_form-solicitacao-compras.png` | Formulário abre completo (3 blocos + produtos/rateio); **não** submetido |
| CT-COT-01-H | ✅ Passou (form) | `CT-COT-01-H_form-cotacao.png` | Formulário de cotação renderiza |
| CT-FAT-01-H | ✅ Passou (form) | `CT-FAT-01-H_form-faturamento-contratos.png` | Form com 3 estágios de validação |
| CT-FOR-01-H | ✅ Passou (form) | `CT-FOR-01-H_form-cadastro-fornecedor.png` | Form espelha SA2 Protheus |
| CT-GED-01-H | ✅ Passou | `CT-GED-01-H_documentos-ged.png` | Árvore de pastas do GED |
| CT-TSK-01-H | ✅ Passou | `CT-TSK-01-H_central-tarefas.png` | Resumo + pools + solicitações |
| CT-PFN-01-H | ✅ Passou (landing) | `CT-PFN-01-H_portal-fornecedor.png` | Portal com 3 níveis de acesso |
| CT-PLT-03-S1 | ✅ Passou (defesa) | `CT-PLT-03-S1_rdfc-bloqueio-permissao.png` | Bloqueio de início por permissão — **segregação funciona** |
| CT-PLT-04-S1 | ❌ Defeito | `CT-PLT-04-S1_deeplink-gestao-ferias-404.png` | Deep-link cai em errorPage/404 |
| CT-BH-01-S1 | ❌ Defeito (U-02) | `CT-BH-01-S1_horas-extras-sem-parametros.png` | Alerta "parâmetros não informados" |
| CT-SEG-05-S1 | ✅ Passou (defesa) | `CT-SEG-05-S1_webdesk-403-nao-admin.png` | `/webdesk` → 403 para não-admin |
| CT-SEG-01-S1 | ❌ Defeito (segurança) | (via API, log) | Constraint não filtra — `colleague` devolveu 3.493 registros |

**⛔ Bloqueados por perfil (exigem usuário do papel):** todos os `-H` de RH (CT-FER/BH/DEP/ADM/SUB/OCO), RDFC (CT-RDF), SIGAJURI restritos (CT-JUR Contrato/Contencioso/Follow-up) e Portal do Fornecedor logado (CT-PFN-02..07) — `TOTVS-FS` não tem os grupos.
**⏭️ Não executados (exigem escrita / admin / massa específica):** aprovações e caminhos que criam dado (CT-CMP-04..06, CT-FAT-02*, etc.), scheduler (CT-INT-02), e casos que dependem de derrubar o Protheus (CT-CMP-03-S1, CT-INT-01-S1).

> Os demais casos deste documento são executáveis manualmente em tela seguindo os passos; anexar o screenshot correspondente em `evidencias/` ao rodar.

---

## Anexo A — `processId` dos processos (para URL direta e busca)

Use no lugar de `<processId>` em `.../pageworkflowview?processID=<processId>`, ou pelo nome no campo Buscar de "Iniciar Solicitações".

| Nome exibido (Buscar por) | `processId` | Categoria |
|---|---|---|
| Solicitação de Compras | `wf_solicitacao_compras` | Compras |
| Parecer Técnico | `wf_solicitacao_compras_parecer` | Compras |
| Cotação de Produtos e Serviços | `wf_cotacao_produtos_servicos` | Compras |
| Negociação de Cotação de Produtos e Serviços | `wf_negociacao_cotacao_prod_serv` | Compras |
| Cadastro de Fornecedor | `wf_cadastro_fornecedor` | Compras |
| RDFC - Recepção de Documentos Fiscais - Compras | `bpm_recepcao_documentos_fiscais_compras` | Compras |
| RDFC - Comprador - Compras | `bpm_recepcao_documentos_fiscais_comprador_compras` | Compras |
| RDFC - Demandantes - Compras | `bpm_recepcao_documentos_fiscais_demandante_compras` | Compras |
| Delegação de Tarefas | `wf_SubstituiçãoCargosFluig` | Compras |
| Faturamento de Contratos | `wf_faturamento_contratos` | Contratos |
| Delegação de Fiscais de Contrato/Serviço | `wf_delegacaoFiscalContratoServico` | Contratos |
| RDFC - Contratos | `bpm_recepcao_documentos_fiscais_contratos` | Contratos |
| RDFC - Fiscal - Contratos | `bpm_recepcao_documentos_fiscais_fiscais_contratos` | Contratos |
| Rejeições de Pagamentos | `bpm_financeiro_rejeicoes_bancarias` | Financeiro |
| Solicitação de Férias | `wf_solicitacao_ferias` | RH |
| Solicitação de Pagamento de Horas Extras | `wf_pagamento_horas_extras` | RH |
| Automação Admissão | `wf_automacao_admissao` | RH |
| Substituição de Cargos | `wf_substituicaocargos` | RH |
| Aprovação de Ocorrência | `wf_aprovacao_ocorrencia` | RH |
| Gestão de Dependentes | `GestaoDependentes` | RH |
| Plano de Saúde | `rh_gbeneficios_planosaude` | RH |
| Consultas/Pareceres (SIGAJURI) | `SIGAJURI_Consultivo` | Jurídico |
| Contencioso (SIGAJURI) | `SIGAJURI_Contencioso` | Jurídico |
| Solicitação de Contratos (SIGAJURI) | `SIGAJURI_Contrato` | Jurídico |
| Atividades SIGAJURI | `SIGAJURI_AprovaFU` | Jurídico |
| Questionário de diagnóstico CliniCASSI V2 | `prc_questionario_v2` | Questionários |

**Páginas/portais (não são "Iniciar Solicitações", acessa por URL ou pelo launcher "Meus Apps"):**

| Página | URL |
|---|---|
| Portal do Fornecedor | `/portal/p/1/portal_fornecedor` |
| Banco de Horas / Horas Extras | `/portal/p/1/PORTAL_AUTORIZACAO_HORAS_EXTRAS` |
| Gestão de Equipes | `/portal/p/1/gestao_equipes` |
| Declaração de Múltiplos Vínculos | `/portal/p/1/declaracao-de-multiplos-vinculos` |
| Gestão de Férias (app) | `/portal/p/1/gestao_ferias` *(hoje retorna 404 — ver CT-PLT-04-S1)* |

---

## Anexo B — Portais de Compras & mecanismo "Atuar como"  *(validado em campo, 2026-08-20)*

> **Correção importante de navegação.** O acesso funcional ao ciclo de Compras **não** é pelo caminho "cru" (Processos → Iniciar Solicitações), e sim pelos **portais customizados**. O launcher `/app_UX` ("Aplicativos") está **quebrado** ("Experiências de Uso estão Desabilitadas"); por isso os portais não aparecem lá. Use o menu **Páginas → "Portal de Compras e Contratos"** (grupo com 13 páginas).

### B.1 — Portais (URLs reais)

| Portal | URL | Função |
|---|---|---|
| Portal do Comprador | `/portal/p/1/portal-do-comprador` | Ciclo do comprador: Validação Inicial, Controle de Cotações, Avaliação de Propostas, Definir Vencedor Cotação |
| Gerência de Compras | `/portal/p/1/gerenciaCompras` | Atribuir/Transferir SC a um comprador |
| Tracker Compras/Contratos | `/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS` | Rastreio dos processos |
| Acompanhamento de Contratos | `/portal/p/1/acompanhamentoContrato` | Gestão de contratos |
| Portal do Fornecedor v2 | `/portal/p/1/portal_fornecedores_v2` | Portal externo do fornecedor |
| Redefinir Senha Fornecedor | `/portal/p/1/portal_fornecedores_senha` | Reset de senha |
| Cópia de Solicitações | `/portal/p/1/portal_copia_sc` | Duplicar SC |
| Logs Protheus | `/portal/p/1/portal_logs_protheus` | Logs de integração |

### B.2 — Mecanismo "Atuar como" (delegação de comprador)

O Portal do Comprador tem um seletor **"Atuar como:"** no topo. O usuário de teste **TOTVS-FS** ("Usuário TBC") está cadastrado como **substituto do comprador Arthur de Almeida Santos**. Selecionando-o, todo o ciclo de comprador passa a listar dados reais (cotações 000556/000557, propostas). Sem a delegação, as abas vêm vazias ("No data found").

- Compradores válidos = **28 pessoas** do dataset `ds_getCompradores` (tabela **SY1** do Protheus). TOTVS-FS **não** está entre eles — opera **por delegação**.
- **Pré-requisito para os casos CT-COT / CT-NEG / Validação do Comprador:** entrar no Portal do Comprador e selecionar **"Atuar como: Arthur de Almeida Santos"** antes de executar.

### B.3 — BPMN real `wf_solicitacao_compras` (v90)

`Início → Validação do Gestor (POOL) → [Ajustar Informações] → Validação Orçamentária (DESIGNADO) → Integração ERP (auto) → Distribuição Comprador (auto) → Gerência de Compras → Validação do Comprador → Áreas p/ Parecer Técnico → Processo de Cotação → Processo de Negociação → Validação do Comprador (Negociação) → Aprovação de Alçadas (DESIGNADO, por faixa de valor) → Gerar Grid de Alçada → Pedido/Contrato → Faturamento de Contratos`. Ramo paralelo "Sem Gestor": **Validação Orçamentária (Sem Gestor)**.

- **POOL** (`Pool:Group:G.P.Requisicao_de_Compras_Gestor_Imediato`) → assumível por qualquer membro (é o "assumir para aprovar").
- **DESIGNADO** → roteado a aprovador **nominal** pela **classe orçamentária** do item (`tbprod_classeOrca`) e por **faixa de valor** (tabelas **AL/DHL** do Protheus). Ex.: Erlon Cesar Dengo (ERP 004445). **Não** é pool.

### B.4 — Matriz de capacidade do usuário TOTVS-FS

| Ação / etapa | Mecanismo | TOTVS-FS? |
|---|---|---|
| Abrir/enviar SC · corrigir (Ajustar Informações) | Solicitante | ✔ Sim |
| Validação do Gestor Imediato | Pool (assumir) | ✔ Sim |
| Gerência de Compras — atribuir/transferir comprador | Portal `/gerenciaCompras` | ✔ Sim |
| Ciclo do Comprador (Cotação, Propostas, Vencedor, Parecer) | Portal do Comprador + **"Atuar como" Arthur** | ✔ Sim (delegação) |
| Validação Orçamentária / (Sem Gestor) | Designado (classe orçamentária, AL/DHL) | ✘ Não (nominal) |
| Aprovação de Alçadas | Designado (faixa de valor, DHL) | ✘ Não (salvo cadastro) |
| Ser comprador "de fato" | Cadastro SY1 Protheus | ✘ Não |

Para executar orçamentária/alçada "de fato", cadastrar o TOTVS-FS no Protheus (AL como aprovador + faixa DHL) **ou** registrá-lo como substituto do aprovador — como já existe para o comprador Arthur.

**Evidências:** `evidencias/PORTAL_comprador-validacao-inicial-atuar-como.png`, `PORTAL_comprador-controle-cotacoes-atuar-como-arthur.png`, `PORTAL_comprador-avaliacao-propostas-atuar-como-arthur.png`, `PORTAL_gerencia-compras-atribuir.png`, `CT-CMP-05-H_consenso-aprovador-designado.png`.

---

## Anexo C — Run de execução em tela (Orçamentária/Alçada · Cotação · Negociação)  *(2026-08-20, via Playwright MCP, usuário TOTVS-FS)*

Contexto confirmado ao vivo na Central de Tarefas: o TOTVS-FS pertence **apenas** aos pools **"Validação do Gestor Imediato"** e **"Validação dos Compradores"**. **Não** há pool de Orçamentária nem de Alçada para ele → essas etapas são **designadas** (aprovador nominal, ex.: Erlon).

| Caso | Resultado | Evidência / observação |
|---|---|---|
| **CT-CMP-05-H** · Validação Orçamentária dentro da alçada | ⛔ **Não executável pelo TOTVS-FS** | Etapa **designada** ao aprovador orçamentário (matrícula nominal, ex.: Erlon 004445), definida pela classe orçamentária via AL/DHL. Não aparece em nenhum pool do TOTVS-FS. Requer cadastro no Protheus ou ser substituto do aprovador. |
| **CT-CMP-05-S1** · Valor acima da alçada / sem aprovador | ✅ **Comportamento correto confirmado** | Ao mover a tarefa sem responsável habilitado, o sistema **bloqueou com erro claro**: *"Não foi encontrado nenhum usuário habilitado para ser movimentada a tarefa Validação do Comprador. Verifique o mecanismo de atribuição: Campo Formulário."* Não trava em silêncio. Evidência: `CT-CMP-05-S1_erro-sem-usuario-habilitado-validacao-comprador.png`. |
| **CT-CMP-06-H** · Aprovação final (Compradores/Alçadas) | 🟡 **Parcial — parte de Compradores EXECUTADA** | Assumi o pool "Validação dos Compradores" (SC 112003) → *"Você assumiu a solicitação 112003"*; abri a tela de decisão (Aprovado/Reprovado, Tipo de Compra, Dispensa Cotação); atribuí o comprador **Arthur de Almeida Santos** pelo portal `/gerenciaCompras` → `distribuicaoManual=Sim` gravado e SC saiu da fila. A **Aprovação de Alçadas** final permanece designada (não executável pelo TOTVS-FS). Evidências: `CT-CMP-06-H_assumir-validacao-comprador-112003.png`, `..._decisao-comprador-movimentar-112003.png`, `..._gerencia-compras-atribuido-arthur-112003.png`. |
| **CT-COT-01-H** · Cotação sem parecer técnico | 🟡 **Telas validadas; conclusão depende de proposta** | Cotação real é sub-processo spawnado pelo SC/ERP e operada no **Portal do Comprador** (atuando como Arthur). Abri "Analisar Cotação 000556" (abas Fornecedor/Produto). O formulário avulso `wf_cotacao_produtos_servicos` abre mas é **shell fora de contexto** (atribuição=admin) — não é ponto de entrada real. |
| **CT-COT-01-S1** · Cotação COM parecer técnico | 🟡 **Mapeado** | Form avulso tem o controle **"Enviar para parecer técnico? Sim/Não"** (`sw_parecerTecnicoSim/Nao`), roteando para o processo de Parecer Técnico. No fluxo real, o parecer é acionado pelo comprador no portal. |
| **CT-COT-02-S1** · Totais inconsistentes | 🟡 **Validação é no Enviar (server/ERP)** | Campos de totais são de entrada manual (`txt_subTot/_vlIpi/_vlFret/_vlTotDes/_vlTotPed`); não há recálculo automático nem bloqueio em tela na digitação. |
| **CT-COT-02-S2** · Validade vencida | 🟡 **Sem bloqueio client-side** | `txt_valid_infForn`/`dt_validadeCotacao` são texto; não bloqueiam data no passado no cliente. Validação, se houver, ocorre na integração ERP. |
| **CT-COT-02-S3** · CNPJ/CPF inválido | 🐞 **Sem validação de dígito** | CNPJ inválido (`11.111.111/1111-11`) no blur **não** dispara erro nem lookup do fornecedor (razão social não é preenchida). Não há validação de dígito verificador em tela. |
| **CT-NEG-01-H** · Validação de proposta — aprovada | 🟡 **Tela do comprador operante; sem proposta p/ aprovar** | Atuando como Arthur, "Analisar Cotação" abre com campos de proposta (Fornecedor, CGC, Nº Proposta, Quantidade, Valor Unit., Valor Frete, Validade Proposta, Cond. Pgto). As cotações da base (000556/000557) estão "Em Cotação" **sem propostas de fornecedor** → não há o que aprovar até o fornecedor lançar (Portal do Fornecedor/ERP). Evidência: `CT-NEG-01-H_analisar-cotacao-000556.png`. |
| **CT-NEG-01-S1** · Validação de proposta — reprovada | 🟡 **Mesma dependência** | Reprovar exige proposta lançada; indisponível na base atual. |
| **CT-NEG-01-S2** · Proposta fora do prazo | 🟡 **Regra existe (dsSync_verificaDataValidaCotNeg)** | Depende de proposta com validade vencida; não reproduzível sem proposta lançada. |

**Conclusões da run:** (1) Orçamentária e Alçada **não** são executáveis pelo TOTVS-FS (designadas por Protheus AL/DHL) — e o sistema **sinaliza corretamente** quando não há aprovador. (2) A parte de **Compradores é executável**: assumir pool + atribuir comprador via portal — executado de ponta a ponta no SC 112003. (3) **Cotação/Negociação** são operadas no Portal do Comprador (atuando como Arthur); as telas funcionam, mas a conclusão (aprovar proposta / definir vencedor) depende de **propostas de fornecedor**, que na base de teste ainda não existem. (4) Achado de qualidade: o formulário de Cotação **não valida CNPJ (dígito), validade vencida nem totais no cliente** — depende do ERP.
, sempre siga os padrões, regras e estruturas da skill /playwright-test-creator e todos os seus conhecimentos sobre o sistema fluig no /fluig-master


---

# Casos acrescentados em 27/08/2026 — análise de regressivo

Levantados por varredura do que a suíte automatizada **não** cobria, cruzando o catálogo de
processos publicados com os testes existentes. A investigação completa, com as medições que
sustentam cada caso, está em `docs/lacunas-do-regressivo.md` — aqui fica só a especificação.

Três casos daquela análise **não** entraram neste catálogo, e o motivo de cada um está
registrado em `docs/lacunas-do-regressivo.md`: um depende de etapa fora do alcance da conta de
automação, outro exigiria dependência nova no projeto, e o terceiro está bloqueado pelo D-01.
Os IDs deles não são citados aqui de propósito — a contagem de cobertura conta menção de ID em
qualquer lugar deste arquivo, e citá-los criaria três casos fantasma sem teste.

> ⚠️ Estes casos mudam o denominador da cobertura: de 163 para 187. As medições anteriores a
> 27/08/2026 usaram a régua de 163 — `docs/cobertura.md` reporta as duas origens em separado
> para a comparação continuar honesta.


## Plataforma

### CT-PLT-04-S2 · Deep-link além das duas rotas de hoje
- **Prioridade:** P2 · **Tipo:** Regressão
- **Pré-condições:** nenhuma.
- **Passos:** estender a lista parametrizada de `deep-link-spa.spec.js` com as rotas SPA navegáveis restantes, descobertas pelo menu (inclusive `notificationcenter`).
- **Resultado esperado:** nenhuma cai em `errorPage/404`. Vermelho intencional enquanto o U-01 viver.
- **Viabilidade:** alcançável hoje, é praticamente só dados. O trabalho real é **inventariar** as rotas SPA pelo menu — meia hora de navegação de leitura.

### CT-PLT-06-S1 · Erro de console fora da home
- **Prioridade:** P2 · **Tipo:** Funcional / Regressão
- **Pré-condições:** nenhuma.
- **Passos:** teste parametrizado sobre as rotas-chave (home, catálogo, Central de Tarefas, Portal de Contratos, Portal do Comprador, Gerência de Compras, Tracker, GED), coletando `pageerror` e `console.error` durante a carga.
- **Resultado esperado:** zero erro de console não catalogado. Os conhecidos (NPS 403) entram numa **lista de exceções nomeada e datada** no próprio teste — não num filtro genérico por regex, que esconderia os novos.
- **Viabilidade:** alcançável hoje, leitura pura. Cuidado: a suíte tem `google-analytics` a bloquear (`CT-SEG-06-S1`) — o ruído de rede precisa ser separado do ruído de JS.

### CT-PLT-10-H · Invariante do catálogo de processos
- **Prioridade:** P2 · **Tipo:** Integração (contrato) / Regressão
- **Pré-condições:** nenhuma.
- **Passos:** `GET /process-management/api/v2/processes?pageSize=200` e `GET /ecm/api/rest/ecm/process-category/processes?...&onlyCanStart=true`; comparar contra a lista esperada, versionada no teste.
- **Resultado esperado:** o conjunto de `processId` publicados e o conjunto de iniciáveis batem exatamente com o esperado. Diferença → falha nomeando **qual** processo entrou ou saiu (não "34 ≠ 35"). Documentar no teste a divergência já conhecida: `SIGAJURI_Contencioso` **cria solicitação sem constar do catálogo `onlyCanStart`** — a permissão real diverge do filtro da tela, e isso é achado, não ruído.
- **Viabilidade:** alcançável hoje, leitura pura, 2 GETs. Manutenção: a lista esperada precisa ser atualizada conscientemente a cada publicação — que é exatamente o objetivo.

### CT-PLT-07-S1 · `addFavorites` duplicado responde 500 em texto puro
- **Prioridade:** P3 · **Tipo:** Funcional
- **Resultado esperado:** duplicidade deve responder erro de negócio **em JSON** (ou 200 idempotente), não 500 com texto. Vermelho intencional.
- **Viabilidade:** alcançável, `@destrutivo` e reversível (`removeFavorites`). ⚠️ Favorito é **estado global de conta única** — a suíte já removeu um caso por isso (`describe.serial` não serializa entre repetições do `--repeat-each`). Este teste **precisa** do mesmo tipo de lock de `utils/exclusividade.js`, ou não dev…

### CT-PLT-08-S1 · Processo inativo e resíduo de desenvolvimento visível
- **Prioridade:** P3 · **Tipo:** Funcional
- **Resultado esperado:** `testePRODUTO` recusa com a mensagem de inativo; `teste` **não deveria constar** do catálogo de um usuário de Compras (vermelho intencional, com anotação de achado).
- **Viabilidade:** alcançável hoje. Cobre bem junto com `CT-PLT-10-H`, que é o mesmo assunto numa camada acima.

### CT-PLT-09-S1 · Fechar a matriz dos 9 bloqueios duros
- **Prioridade:** P3 · **Tipo:** Funcional
- **Passos:** estender a lista parametrizada existente; a mensagem esperada é literal e idêntica para todos: *"Usuário `<login>` não possui permissão para iniciar solicitações do processo `<id>`"*.
- **Resultado esperado:** os 9 bloqueiam, nenhum formulário monta, `guarda.tentativas() === 0`.
- **Viabilidade:** alcançável hoje, leitura pura, **é quase só dados** — o Page Object e o padrão já existem. Melhor razão esforço/cobertura do documento.


## Central de Tarefas

### CT-TSK-05-H · Cancelar solicitação — o fluxo do produto, nunca testado
- **Prioridade:** P1 · **Tipo:** Funcional (e infraestrutura da própria suíte)
- **Pré-condições:** uma solicitação criada **pelo próprio teste** (nunca reaproveitar id de outro teste — regra de independência), em estado `OPEN`.
- **Passos:** 1. Criar uma SC com massa `QA` de factory. 2. Abrir Central de Tarefas → *Minhas solicitações*, localizar o card pela paginação por cursor (reusar `utils/central-tarefas-paginacao.js` — a listagem é crescente e `rows=15`, armadilha já mapeada). 3. Acionar **Cancelar**, informar o motivo (prefixo `QA`). 4. Reler o estado **no servidor**: `GET /process-management/api/v2/requests/<id>` e `GET /requests/<id>/tasks?pageSize=60`.
- **Resultado esperado:** `status: CANCELED`, `active: false`, a tarefa da etapa corrente com status `CANCELED`, e o card ausente da listagem de abertas. A confirmação vem **do servidor**, não do toast — mesma disciplina já adotada em `scripts/limpar-massa.mjs` (`successCount` é o que ele diz ter feito; `status: CANCELED` é o que aconteceu).
- **Viabilidade:** alcançável hoje, `@destrutivo`. Custo de massa: 1 SC por execução — que o teste já destrói ele mesmo, então é o destrutivo **mais barato** da suíte em resíduo.

---

### CT-TSK-05-S1 · Cancelamento sem motivo derruba com NPE 500
- **Prioridade:** P2 · **Tipo:** Negativo / Integração
- **Pré-condições:** uma solicitação criada pelo teste (pode ser a mesma de `CT-TSK-05-H`, em outro teste independente que cria a sua própria).
- **Passos:** `POST /api/public/2.0/workflows/cancelInstances` com `cancelText: null`, depois reler o estado no servidor.
- **Resultado esperado:** resposta de erro **de negócio** (4xx com mensagem nomeando o campo obrigatório), não 500 de NPE; e a solicitação **permanece `OPEN`**. A segunda metade é a que importa: o teste falha se o estado mudar.
- **Viabilidade:** alcançável hoje. `@destrutivo` pela criação da massa, mas a chamada em si não escreve.

### CT-TSK-07-H · "Somente salvar" — salvar sem movimentar
- **Prioridade:** P2 · **Tipo:** Funcional
- **Pré-condições:** uma tarefa aberta do próprio usuário (a SC do próprio teste, em etapa dele).
- **Passos:** abrir a tarefa, alterar um campo com valor `QA` identificável, *Somente salvar*, **recarregar a página** e reabrir a tarefa.
- **Resultado esperado:** o valor persiste **e a etapa não mudou** (a solicitação segue na mesma atividade, com o mesmo responsável, confirmado por `/requests/<id>?expand=currentMovements`). As duas metades importam: salvar que movimenta é tão defeito quanto salvar que perde.
- **Viabilidade:** alcançável hoje, `@destrutivo`.

### CT-TSK-08-H · Transferir atividade
- **Prioridade:** P2 · **Tipo:** Funcional
- **Pré-condições:** tarefa do próprio usuário com `currentMovto > 1` e sem `avoidTransfer` (é o que faz a opção aparecer); um usuário-destino válido, descoberto em execução.
- **Passos:** abrir a tarefa → *Transferir* → escolher o destino → confirmar → reler `/requests/<id>?expand=currentMovements`.
- **Resultado esperado:** a solicitação permanece **na mesma atividade** e o `assignee` passa a ser o destino. A confirmação vem do servidor.
- **Viabilidade:** alcançável, `@destrutivo`, **mas com custo assimétrico**: depois de transferir, a conta da automação **perde a tarefa** e não consegue trazê-la de volta (a mensagem do servidor é *"Esta tarefa não está mais sob sua responsabilidade!"*). A solicitação continua cancelável pelo teardown, então o resídu…


## Segurança

### CT-SEG-07-S1 · Isolamento horizontal na API v2 de processos (BOLA/IDOR interno)
- **Prioridade:** P1 · **Tipo:** Segurança (controle de acesso horizontal / BOLA — *Broken Object Level Authorization*)
- **Pré-condições:** sessão autenticada de `TOTVS-FS`; um `processInstanceId` de um processo em que a conta comprovadamente **não** participa e que ela **não** tem permissão de iniciar. O teste deve **descobrir** esse id em tempo de execução (varrer `/requests?pageSize=100` procurando `processId` começando por `bpm_recepcao_documentos_fiscais`), nunca fixá-lo numa constante — a regra de massa da suíte vale aqui igual.
- **Passos:** 1. Autenticar com `storageState` e abrir uma página do portal (o WAF barra `page.request`). 2. Via `page.evaluate` + `fetch`, listar `/process-management/api/v2/requests?pageSize=100` e selecionar a primeira instância de um processo bloqueado por permissão para a conta. 3. Confirmar a não-participação: `GET /requests/<id>/tasks?pageSize=60` não traz nenhum `assignee.code` nem `requester.code` igual ao login da automação. 4. `GET /requests/<id>?expand=formFields`.
- **Resultado esperado:** (critério objetivo):** o passo 4 deve responder **403** (ou 404, ou 200 com `formFields: null`) para uma instância em que o usuário não é requisitante, responsável atual nem participante histórico. **Hoje responde 200 com o formulário inteiro — o teste reprova de propósito**, como os demais vermelhos intencionais da suíte. A assertion não pode ser sobre "não contém CNPJ": tem de ser sobre o *status* e a ausência do objeto, senão vira teste de string.
- **Viabilidade:** **alcançável hoje, sem provisionamento nenhum.** Leitura pura, ~3 GETs, segundos de execução, sem `@destrutivo`. É o melhor retorno por linha de código do documento inteiro. Recomendo abrir chamado de segurança em paralelo, sem esperar o teste.

---

### CT-SEG-08-S1 · Processos administrativos abertos a usuário comum
- **Prioridade:** P1 · **Tipo:** Segurança (segregação de função)
- **Pré-condições:** nenhuma além da sessão.
- **Passos:** 1. `GET /ecm/api/rest/ecm/process-category/processes?...&onlyCanStart=true` e verificar a presença dos dois ids. 2. Abrir `/portal/p/1/pageworkflowview?processID=bpm_addUserFluig` e o mesmo para `bpm_addUserGroup`. 3. Com `utils/guarda-criacao.js` ativo, afirmar `guarda.tentativas() === 0`. **Nunca clicar em Enviar** — criar usuário na base é escrita fora da política, mesmo em homologação.
- **Resultado esperado:** os dois processos **não** devem constar do catálogo de início da conta e **não** devem abrir formulário — devem responder com o diálogo *Erro* e a mensagem de permissão, como `wf_solicitacao_ferias` e os RDFC. Hoje abrem → vermelho intencional, com `testInfo.annotations` de achado, no mesmo padrão do teste de RH.
- **Viabilidade:** alcançável hoje, leitura pura, minutos de implementação. Reaproveita integralmente `FormularioProcessoPage` e o padrão parametrizado que já existe em `bloqueio-processos-rh.spec.js`.

---

# P2 — o que fecha os buracos estruturais

### CT-SEG-10-S1 · ACL dos documentos que a SC cria sozinha no GED
- **Prioridade:** P2 · **Tipo:** Segurança
- **Pré-condições:** uma SC com anexo criada pelo teste (compartilha o setup de `CT-ACC-09-H`, criando a sua própria).
- **Passos:** localizar os dois documentos gerados; ler as permissões por `GET /api/public/2.0/documents/getDocument/<id>` e pelo dataset `document`; comparar com o esperado.
- **Resultado esperado:** os documentos e a pasta da solicitação **não** são legíveis por perfil genérico — a permissão é restrita aos participantes do processo. Se o critério do negócio ainda não estiver definido, **pergunte antes de codificar**: assertion frouxa aqui é pior que ausência de teste.
- **Viabilidade:** a leitura é alcançável hoje. ⚠️ **O critério de aprovação não está definido** — este caso precisa de uma decisão da Cassi sobre qual é a ACL correta antes de virar teste. Entra na lista de "Perguntas em aberto para a Cassi" do README.


## Compras (formulário clássico)

### CT-CMP-07-S1 · Regressão do fail-open do formulário clássico de SC
- **Prioridade:** P1 · **Tipo:** Regressão / Negativo
- **Pré-condições:** conta da automação; `page.route` interceptando `ds_protheus_getMatriculaTitular_rest` para responder **500** — é isso que torna a janela **determinística** em vez de 2-em-9. Sem essa interceptação o teste é flaky por construção e não deve ser escrito.
- **Passos:** 1. Interceptar `ds_protheus_getMatriculaTitular_rest` → HTTP 500 (o erro real observado). 2. Abrir o formulário clássico de `wf_solicitacao_compras`. 3. **Sem preencher nada**, e com o `blockUI` ainda visível, clicar em Enviar. 4. Contar as requisições que saíram para `**/workflowView/send`.
- **Resultado esperado:** **zero** requisições de start. O produto deve manter o Enviar inerte (ou desabilitado) enquanto a montagem não terminar, e nunca aceitar submissão de formulário não montado. Hoje o `send` sai e o servidor devolve `processInstanceId` real → **vermelho intencional**.
- **Viabilidade:** alcançável hoje. Leva `@destrutivo` porque, com o defeito presente, o teste **cria uma SC** — que o `globalTeardown` cancela pelo livro-razão. Cuidado registrado: abortar o `send` mudaria o comportamento do widget (armadilha já paga por esta suíte); o oráculo correto é **contar a tentativa**, deixan…

### CT-CMP-08-H · Fechar o ciclo de retorno: reprovação → Correção → reenvio
- **Prioridade:** P1 · **Tipo:** Funcional (caminho de exceção completo)
- **Pré-condições:** SC criada pelo teste; a conta precisa conseguir assumir o pool do Gestor Imediato (`G.P.Requisicao_de_Compras_Gestor_Imediato`) — **já provado alcançável** pelos testes de `ciclo-gestor.spec.js`. Só é executável pela rota de start corrigido (`targetState` de gateway); pela rota do widget, o D-01 prende a SC no Início e o cenário não existe.
- **Passos:** 1. Criar a SC e levá-la até *Validação do Gestor*. 2. Assumir do pool e **reprovar** com justificativa `QA`. 3. Confirmar que a SC voltou para a etapa de Correção **com o solicitante**. 4. Abrir a tarefa de Correção, alterar um campo identificável (ex.: justificativa `QA-CORR-<sufixo>`). 5. Reenviar. 6. Reler estado e histórico no servidor.
- **Resultado esperado:** depois do reenvio a SC volta para *Validação do Gestor* (não para "Início"), o campo alterado persiste, e **os dados do contrato de origem continuam íntegros** — nº do contrato, revisão, filial e itens iguais aos do start. O histórico registra a passagem pela Correção.
- **Viabilidade:** alcançável hoje, `@destrutivo`, mas é o caso **mais caro** da lista: ~4 movimentações e uma tarefa assumida de pool que **não tem devolução** (resíduo permanente na caixa "Tarefas a concluir" — custo do cenário, não algo a desfazer no teardown). Vale o preço.

---


## Documentos / GED

### CT-GED-02-S2 · Bloqueio de extensão: allowlist, não blacklist do `.exe`
- **Prioridade:** P2 · **Tipo:** Regressão / Segurança
- **Pré-condições:** as mesmas de `CT-GED-02-S1`, incluindo o lock `fluig-upload-staging` de `utils/exclusividade.js` — a área de upload é **por usuário no servidor**, não por aba.
- **Passos:** publicar, um por vez, arquivos de factory com extensões `.bat`, `.sh`, `.pdf.exe` e um `.exe` renomeado para `.pdf` (conteúdo com os magic bytes `MZ`), cada um em seu próprio teste.
- **Resultado esperado:** todos rejeitados **com mensagem de bloqueio**, e nada gravado (`guarda.tentativas() === 0` ou ausência do documento na pasta). O caso do `.exe` renomeado é separado: se o produto validar só a extensão do nome, ele passa — e a assertion deve dizer isso na mensagem de falha, para que o leitor do relatório saiba que a validação é sintática.
- **Viabilidade:** alcançável hoje, `@destrutivo`. Custo de massa: cada arquivo aceito vira documento a limpar por `navigation/removeDoc` → `recycleBin/removeDocument`.

### CT-GED-04-S1 · Rejeitar documento — o caminho e o `msgId` que mente
- **Prioridade:** P3 · **Tipo:** Funcional
- **Pré-condições:** documento publicado pelo teste em pasta com aprovação (`Compras e Contratação > Parecer Técnico`, id 343011), autodesignando-se aprovador.
- **Passos:** publicar → Central de Tarefas → *Documentos a aprovar* → **Rejeitar** com justificativa `QA` → confirmar o sumiço por rota de leitura.
- **Resultado esperado:** o documento deixa de existir (`NotFoundException`), **e não está na Lixeira**. Assertion explícita de que o oráculo é o estado do documento, com comentário no teste registrando que o `msgId` não serve.
- **Viabilidade:** alcançável hoje, `@destrutivo`, e é a limpeza **perfeita** — rejeitar não deixa resíduo nenhum. ⚠️ Precisa do lock `fluig-upload-staging`. ⚠️ Abrir "Documentos a aprovar" **muda estado de sessão no servidor** (`setAttribute centralTaskType=toapprove`) e pode fazer a Central aterrissar noutra sub-aba…


## Acompanhamento de Contratos

### CT-ACC-09-H · O caminho FELIZ do anexo da SC nunca foi provado
- **Prioridade:** P2 · **Tipo:** Funcional / Integração
- **Pré-condições:** SC criada pelo teste, com um anexo de factory (`QA-anexo-<sufixo>.pdf`).
- **Passos:** criar a SC com anexo → ler o nº da solicitação → consultar o dataset `document` com constraint pelo nome do anexo → verificar os dois registros e a cadeia de pastas → abrir a solicitação e confirmar o anexo listado na aba Anexos.
- **Resultado esperado:** os dois registros existem, a cópia navegável está sob a pasta da solicitação criada, e o anexo é listado na tarefa. Nomes com o sufixo único, para não colidir com os **140 registros** de anexo já acumulados na base.
- **Viabilidade:** alcançável hoje, `@destrutivo`. **Resíduo permanente**: anexo de SC e sua cadeia de pastas não podem ser apagados (apagá-los é mexer na solicitação). Um por execução.


## Recepção de Documentos Fiscais

### CT-RDF-02-H · Rastreabilidade pai↔filho do RDFC
- **Prioridade:** P2 · **Tipo:** Integração (contrato de dados)
- **Pré-condições:** existir ao menos um par pai/filho na base — o teste **descobre** o par varrendo `/requests`, não fixa ids.
- **Passos:** para cada filho RDFC encontrado, ler `WKNumProcesPai`; ler o pai correspondente e conferir que ele lista o filho em `*_SOLICITACAO_FLUIG___n`; conferir que a etapa "Atualiza solicitação principal" do filho está `COMPLETED` quando o filho está finalizado.
- **Resultado esperado:** o elo é **bidirecional e consistente** para todo par encontrado. Se a base não tiver nenhum par, falhar com `PRÉ-CONDIÇÃO AUSENTE` nomeando o que falta — nunca passar vazio (o padrão de falso verde que o estudo de determinismo já pegou uma vez).
- **Viabilidade:** alcançável hoje, leitura pura, sem provisionamento. ⚠️ Depende do `CT-SEG-07-S1`: **se o isolamento horizontal for corrigido, este teste perde o acesso** e passa a exigir uma conta com perfil fiscal. Registre a dependência ao implementar.


## Jurídico

### CT-JUR-06-H · Contencioso: nasce no pool certo?
- **Prioridade:** P2 · **Tipo:** Funcional
- **Pré-condições:** as mesmas do teste de Contencioso que já existe.
- **Passos:** após a criação, `GET /requests/<id>?expand=currentMovements` e `GET /requests/<id>/tasks?pageSize=60`.
- **Resultado esperado:** etapa `7-Resposta`, `assignee.code` = `Pool:Group:GRUPO_GEJUR_9`, e o grupo **corresponde à UF escolhida** no formulário (se houver mais de um grupo por UF, esta é a assertion que prova o roteamento).
- **Viabilidade:** alcançável hoje — é **acréscimo de assertion** a um teste destrutivo que já roda, custo de massa **zero**. Um dos melhores custo/benefício da lista.


## Financeiro

### CT-FIN-01-H · Rejeições de Pagamentos — uma área inteira sem cobertura
- **Prioridade:** P2 · **Tipo:** Funcional
- **Pré-condições:** nenhuma para a abertura.
- **Passos:** abrir o formulário de início, inventariar os campos obrigatórios, e afirmar sobre a estrutura (mesmo padrão de `cadastro-fornecedor.spec.js` e `parecer-tecnico.spec.js`: abre, espelha os campos, **não** envia).
- **Resultado esperado:** o formulário monta com os campos do domínio. Se montar vazio, ou servir template de outro processo (como `wf_automacao_admissao` faz hoje), isso é o achado.
- **Viabilidade:** alcançável hoje, leitura pura. ⚠️ Antes de investir no **ciclo** deste processo, confirme com a Cassi se ele está em escopo — nunca foi iniciado por ninguém, e pode ser publicação órfã. O caso de abertura é barato o bastante para valer de qualquer jeito.


## Delegação de Tarefas

### CT-SUB-02-H · Delegação de Tarefas (`wf_SubstituiçãoCargosFluig`)
- **Prioridade:** P2 · **Tipo:** Funcional
- **Pré-condições:** nenhuma. ⚠️ **O `processId` tem cedilha e til** — precisa de `encodeURIComponent` na URL; sem isso o teste falha por 404 e parece defeito.
- **Passos:** abrir o formulário de início e afirmar sobre os campos (delegante, delegado, período).
- **Resultado esperado:** formulário monta com os campos de delegação. "Último iniciado: Nunca" é contexto, não critério.
- **Viabilidade:** alcançável hoje, leitura pura.

---

# P3 — barato, ou de valor menor


## Notificações

### CT-NOT-03-S1 · Contratos da API de notificação
- **Prioridade:** P3 · **Tipo:** Funcional
- **Resultado esperado:** `limit=3` devolve 3 itens (hoje devolve tudo → vermelho intencional); e `removeAlerts` remove de verdade, confirmado por releitura.
- **Viabilidade:** alcançável hoje. ⚠️ A remoção é escrita — `@destrutivo`, e só sobre notificações que a **própria execução** gerou.


## CliniCASSI

### CT-CLI-03-H · Questionário: estado pós-criação nunca verificado
- **Prioridade:** P3 · **Tipo:** Funcional
- **Resultado esperado:** etapa 5, `assignee` = o solicitante, `status: OPEN`.
- **Viabilidade:** acréscimo de assertion a um destrutivo existente, custo de massa zero.

