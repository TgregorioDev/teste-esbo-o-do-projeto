# Cancelamento da massa criada pela suíte — o que foi levantado em campo

Levantado em 26/08/2026, com sessão real no ambiente e leitura do bundle do Portal do
Comprador (`wg_portalCompradores/resources/js/App/Scripts/browser/main.js`).
**Ainda NÃO validado na prática** — ver "O que falta" no fim.

## O que o Portal do Comprador realmente faz ao cancelar

A ação não é um botão genérico de "cancelar SC": é **`Cancelar Proposta`**, na rota
`#/avaliacaoPropostas`, condicionada pela flag `controleCancelar` que vem no registro da
cotação. O orquestrador é `deletePurchases()`, que confirma num SweetAlert e executa **duas
etapas**, nesta ordem:

### Etapa 1 — cancela a Solicitação de Compra no Protheus

```
GET /api/public/ecm/dataset/search
    ?datasetId=dsProtheus_delSolicitacoesComprasNFC
    &filterFields=CorporateId,<01>,BranchId,<C8_FILIAL>,C1_NUM,<C8_NUMSC>
```

Mensagem de sucesso do produto: *"O cancelamento da solicitação de compras {C8_NUMSC} no ERP
Protheus foi executado com sucesso!"*

⚠️ Os parâmetros vêm da **cotação (tabela C8)**, não da SC: `C8_FILIAL` e `C8_NUMSC`. O código
valida que a filial contenha só dígitos.

### Etapa 2 — cancela o processo no Fluig

```
POST /api/public/ecm/dataset/datasets
{ "name": "dsFluig_postProcessesCancel",
  "constraints": [ processId, taskUserId, comment ] }
```

- `processId` — número do processo Fluig (`C1_XFLUIG`), só dígitos
- `taskUserId` — **o comprador**. É daqui que vem a exigência do desenvolvedor: quem dispara
  precisa ser o comprador ou seu substituto
- `comment` — justificativa registrada no histórico

Mensagem de sucesso: *"O cancelamento do processo {C1_XFLUIG} da solicitação de compras
{C8_NUMSC} no Fluig foi executado com sucesso!"*

O comprador de quem `TOTVS-FS` é substituto é **Arthur de Almeida Santos**, cujo login (valor
da `<option>` em "Atuar como") é `arthur.de.cassi.com.br.1` — já usado por
`pages/CicloCompradorPage.js`.

## Como a autorização realmente funciona — medido em 26/08/2026

Três tentativas reais contra `dsFluig_postProcessesCancel`, cada uma devolvendo um erro
diferente. Juntas, revelam a cadeia inteira:

| `taskUserId` enviado | Resposta do servidor |
|---|---|
| `arthur.de.cassi.com.br.1` | `User not found! User: arthur.de.cassi.com.br.1` |
| `ae73d3260d96404d861fa1c573102b8d` | `Current user ... is not the process manager or requisitioner. The request cannot be canceled!` |
| `TOTVS-FS` | `Usuario consumerkeycompras nao e um substituto valido para o usuario TOTVS-FS!` |

O que cada uma ensina:

1. **`arthur.de.cassi.com.br.1` nao e login.** E o *value* da `<option>` do seletor "Atuar
   como", derivado do e-mail. O login Fluig de **Arthur de Almeida Santos** e o GUID
   `ae73d3260d96404d861fa1c573102b8d` (obtido do dataset `colleague`, `active: true`).
2. **A API exige que o `taskUserId` seja o gestor do processo OU o solicitante.** Arthur nao e
   nenhum dos dois nas SCs que a suite cria — quem as abriu foi `TOTVS-FS`.
3. **O dataset roda no servidor como `consumerkeycompras`** — a mesma conta de integracao do
   D-01 — e *personifica* o `taskUserId`. Para isso, o Fluig exige que `consumerkeycompras`
   seja **substituto cadastrado** daquele usuario.

O erro 2 (para Arthur) e sobre o PAPEL no processo, nao sobre substituicao: a checagem de
substituto **passou** para Arthur. Logo `consumerkeycompras` ja e substituto dele. Para
`TOTVS-FS` a checagem falhou — nao e.

### Por que a opcao de cancelar nao aparece para NENHUMA SC nossa

Verificado em 26/08/2026, e a resposta nao e permissao — e ausencia de dono.

`GET /process-management/api/v2/requests/<id>` devolve, para as SCs que a suite cria:

```
{ "processInstanceId": 112671, "active": true, "status": "OPEN", "requester": null }
```

**`requester: null`.** Conferido em duas SCs criadas por testes diferentes (112671 e 112674):
as duas sem solicitante registrado. Como a API de cancelamento exige *"process manager or
requisitioner"*, e a solicitacao nao tem nem um nem outro, **ninguem** pode cancela-la — nem o
`TOTVS-FS`, que a criou na pratica.

Isso e outra face do **D-01**: a SC nasce da conta de integracao (`consumerkeycompras`) presa no
marco de Inicio, e o campo de solicitante fica vazio. O defeito que impede a SC de andar e o
mesmo que impede que ela seja cancelada.

Confirmado tambem que a opcao nao existe na interface: varredura nos 12.275 elementos da
Validacao Inicial do Portal do Comprador nao encontrou nenhum controle de cancelamento. O unico
que existe no bundle e **"Cancelar Proposta"**, na rota `#/avaliacaoPropostas`, condicionado pela
flag `controleCancelar` que vem no registro da COTACAO — estagio que as SCs da suite nunca
alcancam.

**Consequencia para o cleanup:** enquanto o D-01 existir, cancelar as SCs criadas pela suite e
impossivel por qualquer via — UI ou API. Dar dono a solicitacao (seja o solicitante real, seja
um comprador) e pre-requisito, nao detalhe.

### Experimento: dar dono a SC NAO resolve (refutado em 26/08/2026)

Hipotese testada: se a SC nascer com dono — `targetAssignee` = usuario logado em vez de
`consumerkeycompras` — o `requester` deixaria de ser nulo e o cancelamento passaria a ser
possivel. Disparo direto do start, com o payload genuino capturado como template:

| Variante enviada | Resultado |
|---|---|
| `targetAssignee=TOTVS-FS`, `targetState=6` | **400 `BPMUserCanNotReceiveTaskException`** — *"Usuario selecionado nao esta apto para receber a tarefa! Usuario: TOTVS-FS"* |
| `targetAssignee=TOTVS-FS`, `targetState=0` | **200**, SC 112679 criada — mas `requester` **continua null** |

E cancelando a 112679, os MESMOS dois erros de antes:

- `taskUserId=TOTVS-FS` → *"consumerkeycompras nao e um substituto valido para TOTVS-FS"*
- `taskUserId=<GUID do Arthur>` → *"is not the process manager or requisitioner"*

**Conclusoes:**

1. O `requester` **nao vem de `targetAssignee`**. Sao coisas distintas: um e o responsavel pela
   tarefa, outro e o autor da solicitacao. Preencher o primeiro nao preenche o segundo.
2. O marco de Inicio (state 6) so aceita `consumerkeycompras` — o servidor recusa qualquer outro
   usuario ali. Isso confirma que o `targetState: 6` do D-01 nao e escolha do widget: e imposicao
   do desenho do processo.
3. Portanto **nao ha nada que a automacao possa fazer no payload** para tornar suas SCs
   cancelaveis. A correcao e no processo (quem preenche o solicitante) ou na configuracao de
   substitutos — as duas fora do alcance da suite.

O experimento foi revertido; nenhum teste da suite foi alterado. Custo: 1 SC criada (112679),
que — pela propria conclusao acima — nao pode ser cancelada.

### Os dois caminhos possiveis

**Caminho A — cadastrar `consumerkeycompras` como substituto de `TOTVS-FS`.** Configuracao
unica no Fluig (Substitutos). Depois disso a suite cancela as proprias SCs diretamente, porque
`TOTVS-FS` ja e o solicitante. Nao depende de Arthur nem de tela nenhuma.

**Caminho B — o que o desenvolvedor sugeriu:** colocar as SCs sob Arthur, de quem
`consumerkeycompras` ja e substituto. Custa uma etapa extra por SC e depende da aba "Atribuir"
da Gerencia de Compras, que hoje **nunca renderiza dados** — defeito ja catalogado nesta suite.

**Recomendacao: Caminho A.**

## A restrição que o levantamento revelou

O cancelamento é ancorado em **cotação (C8)**, e a maior parte das SCs que a suíte cria **não
chega a gerar cotação**. Medido na Validação Inicial em 26/08/2026: as SCs `QA` estão em
"Validação Orçamentária" e "Validação do Gestor", com `Nº Solic ERP` preenchido — antes da
etapa de cotação.

Duas leituras possíveis, e **nenhuma foi confirmada ainda**:

1. A etapa 2 (`dsFluig_postProcessesCancel`) funciona sozinha para qualquer processo, e a
   etapa 1 só é necessária quando existe SC no ERP a estornar. Se for isso, o cleanup é
   viável para tudo que a suíte cria.
2. O dataset de cancelamento exige o vínculo com a cotação e recusa processos anteriores a
   ela. Se for isso, só uma fatia da massa é cancelável por esta via.

Uma tentativa de chamar `dsProtheus_delSolicitacoesComprasNFC` com os dados de uma SC em
Validação Orçamentária (`BranchId=5303, C1_NUM=001151`) respondeu `200` com
`{"content":[{"ITEMS":"[ ]"}]}` e **a SC permaneceu na grade, inalterada** — consistente com a
hipótese 2 para a etapa 1, ou simplesmente com filtro errado (os campos corretos são os da C8).

## O que falta

- **Executar o cancelamento de ponta a ponta uma vez**, numa SC `QA`, e observar as duas
  respostas. A tentativa foi bloqueada pela trava de permissão do ambiente de automação, que
  barra POST de escrita disparado fora dos testes — é preciso liberação explícita.
- Confirmar se a etapa 2 cancela processo que ainda não virou cotação.
- Levantar o equivalente para os outros processos que a suíte cria (Jurídico, Faturamento,
  Cotação), que não passam pelo Portal do Comprador.
