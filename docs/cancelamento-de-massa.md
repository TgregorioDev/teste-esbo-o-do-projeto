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
