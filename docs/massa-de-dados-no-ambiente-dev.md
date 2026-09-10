# Criar massa no `caixade213859` — o que dá, o que não dá, e onde exatamente trava

Pergunta respondida aqui: **os casos que hoje falham por fila vazia podem ser destravados
criando a massa nós mesmos, já que a base é de DEV?**

Resposta curta: **sim, o caminho existe e foi percorrido de ponta a ponta hoje** — mas ele
esbarra em um ponto, e é um ponto do servidor, não da automação.

Medido em 10/09/2026, com a conta `TOTVS-FS`.

---

## 1. O que ficou provado

| | |
|---|---|
| Criar Solicitação de Compras por API | **funciona** — 8 SCs criadas, ver seção 6 |
| A SC criada percorre o BPMN sozinha | **sim** — *Início* → *Compra Centralizada?* → *Grava SC e Anexos* |
| A conta participa dos pools do fluxo | **sim** — todos, ver seção 3 |
| Assumir tarefa de pool e movimentar | **funciona** — assumido e enviado na SC 96363 |
| A SC chega à *Gerência de Compras* (257) | **ainda não** — trava em *Grava SC e Anexos* (seção 4) |
| Já existe cotação viva no Fluig | **sim, 14 instâncias ativas** — ver seção 5 |

### Como a SC nasce

```
POST /process-management/api/v2/processes/wf_solicitacao_compras/start
{ "targetState": 0, "targetAssignee": "", "comment": "...", "formFields": { ...~40 campos } }
→ 200 { "processInstanceId": 96363, "nextState": 233, "cardId": 632131, "processVersion": 71 }
```

`targetState: 0` é o que faz diferença: o motor decide o destino e a SC segue o fluxo normal.
(A skill `cassi-fluig-master` registra que `targetState: 6` — o `START_EVENT_NORMAL` que o
widget envia — deixa a SC presa em "Início". Confirmado de novo: com `0`, ela anda.)

`targetState: 7` (*Validação do Gestor*) é recusado com
`BPMUserResponsibleNotInformedException`, com `targetAssignee` em qualquer forma testada
(string, array, objeto, `Pool:Group:...`). Ou seja: **não dá para pular a integração
escolhendo a atividade destino** — o motor exige o caminho.

O corpo do `formFields` está em `factories/massa-solicitacao-compra.js`, e os códigos de ERP
(produto, contas contábeis, classe de valor, centro de custo) foram lidos de uma SC real desta
base, a 95753, com `GET /process-management/api/v2/requests/95753?expand=formFields`.

> **`expand=formFields` é a descoberta mais reaproveitável deste dia.** Ela devolve o
> formulário INTEIRO de qualquer solicitação existente — ~400 campos, com os itens, o rateio e
> o histórico de validações. É o molde para qualquer massa futura, sem depender de a tela
> abrir.

### Como ela é movimentada

1. Central de Tarefas → **Mais opções** → **Tarefas em pool** → clique no link do grupo
   (`a[data-node*="Pool:Group:<grupo>"]`; há **duas** cópias no DOM, só uma visível) →
   botão **Assumir** no cartão.
2. Confirmação: *"Você assumiu a solicitação 96363"*.
3. Abrir em modo de movimentação e clicar **Enviar**:
   ```
   /portal/p/1/pageworkflowview
     ?app_ecm_workflowview_processInstanceId=<id>
     &app_ecm_workflowview_currentMovto=<movementSequence da tarefa NOT_COMPLETED>
     &app_ecm_workflowview_taskUserId=TOTVS-FS
     &app_ecm_workflowview_managerMode=false
   ```
   → `POST /ecm/api/rest/ecm/workflowView/send` responde 200 e a tela confirma
   *"Solicitação 96363 movimentada com sucesso"*.

`GET /ecm/api/rest/ecm/workflowView/takeTask/?processInstanceId=…&movementSequence=…` **não**
substitui o passo 1: responde 500 com `javax.persistence.NoResultException: No entity found for
query`. O "Assumir" da interface é tratado no cliente e não passa por essa rota.

---

## 2. O fluxo completo da SC, com os números das atividades

Lido de `GET /process-management/api/v2/processes/wf_solicitacao_compras/activities` — que
devolve o histórico de movimentos de instâncias reais, e com ele o desenho do processo sem
precisar do BPMN:

```
6 Início → 294 Compra Centralizada? → 233 Grava SC e Anexos → 7 Validação do Gestor
  → 9 Sol. Validação do Gestor → 280 Distribuição Gestor Orçamentario → 265 Paralelo
  → 277/267 Itens com/sem Gestor? → 14 Validação Orçamentária → 271 Join
  → 16 Sol. Validação Orçamentária → 254 Distribuição Comprador → 256 Distribuído Comprador?
  → 257 GERÊNCIA DE COMPRAS → 119 Validação do Comprador → 121 → 20 Integração com ERP
  → 328 Aguarda Geração da Cotação → 24 Cotação foi Gerada? → 33 Processo de Cotação
  → 161 Aguarda Finalizar Cotação → 150 → 199 Validação do Comprador (Negociação)
  → 50 Processo de Negociação → … → 94 Aprovação de Alçadas → … → 115/117 Fim
```

Desvio de erro: **233 → 236 Correção → 233** (v70) e **296 → 297 Correção** (v71).

---

## 3. A conta já está em todos os pools do caminho

De `GET /api/public/2.0/users/getCurrent` (33 grupos). Os que importam:

```
G.P.Requisicao_de_Compras_Inicio           ← pode iniciar a SC
G.P.Requisicao_de_Compras_Correcoes        ← atividade 236/297 (tratamento de erro)
G.P.Requisicao_de_Compras_Gestor_Imediato  ← atividade 7
G.P.Requisicao_de_Compras_Validacao_Orcamentaria  ← atividade 14
G.P.Requisicao_de_Compras_Validacao_Compradores   ← atividade 119
G.P.Requisicao_de_Compras_Validacao_Alcadas       ← atividade 94
G.P.Cotacao_de_Produtos_Servicos_Inicio    ← pode iniciar a cotação
G.P.Negociacao_de_Produtos_Servicos_Inicio ← pode iniciar a negociação
```

**Isto é o achado que muda o mapa.** `docs/viabilidade-no-ambiente-213859.md` concluiu que 167
casos dependiam de matrícula de comprador no ERP. Continuam dependendo *para o Portal do
Comprador* — mas o **pool** é um segundo caminho, e ele está aberto: se a SC andar, esta conta
assume as tarefas de Gestor, Orçamentária, Comprador e Alçada sem depender de cadastro no
Protheus.

---

## 4. Onde trava, exatamente

**Atividade 233 — "Grava SC e Anexos"**. É a integração que abre a SC no Protheus e cria a
pasta de anexos no GED. Em nenhuma das 8 SCs semeadas hoje ela concluiu:

| SC | 233 começou | desfecho |
|---|---|---|
| 96363 | 10:18:19 | 10:30:06 → **236 Correção** |
| 96363 (reenviada da Correção) | 10:40 | ~10:59 → **236 Correção** de novo |
| 96369, 96370 | 11:03 | já em **236 Correção** quando medido, às 11:28 |
| 96376 … 96380 | ~11:26 | ainda em 233 às 11:28, no fechamento desta medição |

A SC fica com `numSolCompra` vazio, `pastaAnexo` vazio e `statusSolicitacao: "Iniciado"`. O
ciclo leva de 12 a 19 minutos até cair na Correção — não é instantâneo, e quem for medir
precisa contar com isso.

A segunda tentativa foi feita **depois** do aviso de que o serviço do Protheus tinha sido
restabelecido. Continuou falhando.

### O erro que dá para mostrar ao desenvolvedor

O formulário da SC exibe *"Não foi possível estabelecer comunicação com o ERP"*. Essa faixa é
genérica; a causa medida é específica:

```
POST /api/public/ecm/dataset/datasets   { "name": "ds_protheus_getMatriculaTitular_rest" }
→ HTTP 500
  { "success": false, "message": "WFLYEJB0054: Failed to marshal EJB parameters", "code": 500 }
```

`WFLYEJB0054` é erro de **serialização de parâmetro de EJB no WildFly** — lado Fluig, não
"Protheus fora do ar". Ele não mudou quando o Protheus voltou. É a primeira coisa a levar para
quem mantém o ambiente, junto com a pergunta de por que 233 não grava.

Dois vizinhos, para contexto: `dsProtheus_getCompradores_restGetAll` responde 200 com uma linha
`{"error": "Unexpected token: c"}` (era `"undefined"` até ontem — mudou, então alguém mexeu), e
`dsProtheus_getContratos_restGetAll` / `getFornecedores` respondem 200 com zero linhas, enquanto
`getBranches` (71), `getProdutos` (3.100) e `getFuncionarios` (72.369) respondem normalmente.

---

## 5. Sobre os cinco pontos do desenvolvedor

| Ponto | O que a medição diz |
|---|---|
| 1. Portal de Acompanhamento de Contratos não está neste ambiente | Confirmado: `/portal/p/1/acompanhamentoContrato` responde *"Recurso não foi encontrado"*. Arrasta ~61 testes. |
| 2. Ausência do serviço (em verificação) | O sintoma preciso é o `WFLYEJB0054` acima. |
| 3. "Tem que ter cotação no Fluig e no Protheus" | **Há cotação no Fluig**: 14 instâncias ATIVAS de `wf_cotacao_produtos_servicos` — 7 em *Recepção de Propostas*, 6 em *Validação do Comprador*, 1 em *Notifica Fornecedor*. Nenhuma tem `TOTVS-FS` como responsável. O que falta não é a cotação: é o **vínculo da conta com um comprador do ERP** (`Y1_USER`), que é o que liga a fila ao usuário. |
| 4. Erro no portal de fornecedores | Pendente com o desenvolvedor. Do nosso lado, o reCAPTCHA recusa o domínio e a redefinição de senha depende do `cassi_rest`, que não está publicado aqui. |
| 5. "Gerência de Compras não traz nada; tem que ter processo na etapa" | A grade **traz 17 linhas** — e **todas são de solicitações CANCELADAS**, encerradas em bloco às 10:25 de 09/09/2026. O dataset `ds_getSolicsGerenciaCompras` (filtro `etapa,257`) devolve instância com `END_DATE` preenchido, ou seja, não filtra processo encerrado. Isso é um defeito do widget, separado da falta de massa — e vale reportar por si só. O teste `FSWTBC-3707 FSWTBC-3840` passou a conferir `active` em `/requests/{id}` antes de afirmar qualquer coisa. |

---

## 6. Como usar o semeador

```bash
node scripts/semear-massa.mjs --quantidade=3   # cria N SCs marcadas QA-MASSA-<uuid>
node scripts/semear-massa.mjs --acompanhar     # diz em que atividade cada uma parou
```

O livro fica em `test-results/massa-semeada.jsonl` — que é **ignorado pelo git e apagado por
qualquer execução da suíte**. Por isso o que semeamos em 10/09/2026 fica registrado aqui, e é
esta lista que sobrevive:

```
96363  96369  96370  96376  96377  96378  96379  96380
```

Oito solicitações, todas ABERTAS no fim do dia, esperando a atividade 233 gravar. Se o livro
sumir, `node scripts/limpar-massa.mjs --descobrir` continua achando todas pela marca `QA` no
formulário — é para isso que a marca existe.

**A massa fica viva de propósito.** Ela não passa pelo `global-teardown` e não é cancelada ao
fim da execução — foi a decisão do dono do ambiente ("sem se preocupar em apagar no final,
tageando como massa de dados"). O rastro é a marca `QA-MASSA-<uuid>`, gravada na justificativa
da solicitação **e** na observação do item; quem quiser higienizar depois usa
`node scripts/limpar-massa.mjs --descobrir --desde=aaaa-mm-dd`.

---

## 7. O que falta para os testes voltarem a rodar

1. **Destravar a atividade 233.** É o único passo entre "SC criada" e "SC na Gerência de
   Compras". Com ela funcionando, o semeador leva a massa até 257 sem nada de novo — o resto do
   caminho já está provado (pools + `workflowView/send`).
2. **Matrícula de comprador (`Y1_USER`) para `TOTVS-FS`.** Liga as 14 cotações que já existem à
   conta e devolve o Portal do Comprador.
3. **Publicar o Acompanhamento de Contratos** e ter contrato na base (hoje: zero).

Nada disso é trabalho de automação — os três são do ambiente. O que era trabalho de automação
está feito: existe um caminho provado para criar e movimentar massa assim que o servidor
gravar.
