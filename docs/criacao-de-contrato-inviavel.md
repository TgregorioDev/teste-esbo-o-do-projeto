# A automação pode criar um contrato? — investigação e veredicto

**Data da medição:** 30/08/2026 · **Ambiente:** `caixade182374.fluig.cloudtotvs.com.br` ·
**Conta:** `TOTVS-FS` (perfil Compras/Contratos, não-admin)

## Por que este documento existe

O cabeçalho de `utils/massa-contratos.js` afirmava, desde o início do projeto, que *"contrato não
é dado que a automação possa criar"*. A afirmação nunca tinha sido verificada — era premissa
herdada, e servia de justificativa para a suíte inteira depender de contrato pré-existente.

O dono do ambiente pediu a verificação, porque a consequência da premissa era grave: **todos os
testes que precisavam de contrato acabavam no mesmo `000000000000001`**, e apagar aquele registro
derrubaria dezenas de testes de uma vez.

Este documento é o resultado. **A premissa se confirmou** — mas agora com evidência, e com o
escopo exato do que é e do que não é alcançável.

---

## Veredicto

> **Não é viável a automação criar um contrato que apareça na grade do Portal de Acompanhamento
> de Contratos, e portanto também não há contrato para cancelar ao fim da execução.**

O que a automação alcança é o **Fluig**. O contrato **não é um registro do Fluig**: é uma linha da
tabela **CN9 do Protheus**, e este ambiente não expõe nenhuma superfície de escrita para ela.

---

## As cinco evidências

### 1. O que a grade mostra é CN9 do Protheus, cru

A grade é alimentada pelo dataset `dsProtheus_getContratosxFornecedores_restGet`. Consultando-o
direto (`POST /api/public/ecm/dataset/datasets`), a resposta traz **954 registros** com as colunas
**literais da tabela CN9** do Protheus — `CN9_NUMERO`, `CN9_SITUAC`, `CN9_FILIAL`, `CN9_TPCTO`,
`CN9_REVISA`, `CN9_DTFIMP`… mais campos do fornecedor (`A2_NREDUZ`, `A2_EMAIL`).

Não há tradução, não há tabela intermediária no Fluig, não há sincronismo com base local: o Fluig
é uma **janela de leitura** sobre o ERP. Criar uma linha ali é criar um contrato no Protheus.

### 2. Todas as 19 chamadas ao ERP são de LEITURA

Varrendo os **72 bundles JavaScript** servidos pelas páginas que tocam contrato
(`/portal/p/1/acompanhamentoContrato`, `PORTAL_TRACKER_COMPRAS_CONTRATOS`, o formulário de
`wf_faturamento_contratos` e o de `wf_delegacaoFiscalContratoServico`), os únicos datasets do
Protheus referenciados são:

```
dsProtheus_getBranches_restGetAll          dsProtheus_getPlanilha_restGetAll
dsProtheus_getCampoCombo_restGetAll        dsProtheus_getPrecoHistorico
dsProtheus_getCentroCusto_restGetAll       dsProtheus_getProdutos_restGetAll
dsProtheus_getContratos_restGetAll         dsProtheus_getProdxPlanContxContOrc_restGetAll
dsProtheus_getContratosxFornecedores_restGet
dsProtheus_getFornecedores_restGetAll      dsProtheus_getRateiosContratos_restGetAll
dsProtheus_getGestorOrcamentario_restGet   dsProtheus_getSQB_restGetAll
dsProtheus_getInfoPlanilhaxContrato_restGetAll
dsProtheus_getInformaPlanxContrato_restGetAll
dsProtheus_getItensPlanilha_restGetAll     dsProtheus_getTipoContratos_restGetAll
ds_get_fiscalContrato                      ds_get_fiscalServico
```

**Sem exceção: `get…restGet` / `get…restGetAll`.** Nenhum `post`, `put`, `del`, `grava` ou
`inclui`. O único dataset de escrita contra o Protheus que a suíte conhece é
`dsProtheus_delSolicitacoesComprasNFC`, que apaga **solicitação de compra**, não contrato.

### 3. Nenhum dataset de escrita de contrato existe no servidor — probado por nome

O endpoint `GET /api/public/ecm/dataset/search?datasetId=<nome>` distingue dataset existente de
inexistente sem precisar de admin, e a distinção foi **calibrada** antes de ser usada:

| `datasetId` | Resposta |
|---|---|
| `colleague` (existe, interno) | **200** com registros |
| `dsProtheus_getContratos_restGetAll` (existe, customizado) | **200** com registros CN9 |
| `ds_nome_que_nao_existe_qa_123` | **500** `java.lang.NullPointerException` |

Com o oráculo calibrado, 20 nomes plausíveis de escrita de contrato foram probados —
`dsProtheus_postContrato`, `…_restPost`, `setContrato`, `gravaContrato`, `incluiContrato`,
`createContrato`, `putContrato`, `delContrato`, `cancelaContrato`, `encerraContrato`,
`situacaoContrato`, `postPlanilha`, `postItensPlanilha`, e variações em `dsFluig_*` / `ds_*`.

**Os 20 responderam NPE — nenhum existe.**

> Limite declarado desta sonda: a busca é por nome, não exaustiva. Um dataset de escrita com
> nomenclatura fora do padrão do ambiente não seria encontrado por ela. Enumerar datasets de
> verdade exigiria o painel de administração, que responde 403 para esta conta
> (`tests/api/webdesk-acesso-admin.spec.js`), e as rotas de listagem (`loadDatasets`,
> `getAvailableDatasets`, `/api/public/2.0/datasets`) **não existem** neste Voyager 2.0 — todas
> devolvem `NotFoundException`.

### 4. Nenhum dos 34 processos publicados cria contrato

Do catálogo medido (skill `cassi-fluig-master`, `references/catalogo-de-processos.md`), os
processos que tocam contrato são três, e nenhum cria:

| Processo | O que faz | Por que não serve |
|---|---|---|
| `wf_faturamento_contratos` | **mede** um contrato que já existe | consome contrato, não produz |
| `wf_delegacaoFiscalContratoServico` | trocaria o fiscal | abre só leitura; Enviar recusado com *"Solicitação só pode ser aberta através do portal de delegação de fiscais!"*, e o tal portal não existe em nenhum ponto de navegação |
| `SIGAJURI_Contrato` | "Solicitação de Contratos" | inoperante (`ServiceNotFoundException: SIGAJURI`) — e, ainda que funcionasse, é registro do módulo **Jurídico**, não uma linha de CN9: não apareceria na grade |

Na navegação, a home expõe exatamente **dois** pontos de entrada de contrato: a categoria
*Contratos* (que leva ao Portal de Acompanhamento) e *Faturamento de Contratos*. O Portal, por
sua vez, oferece **três** ações por linha — *Planilha*, *Solicitação de Compra* e *Informações do
Contrato* — todas sobre contrato existente. **Não há "Incluir".**

### 5. A rota documentada de nascimento do contrato está fora de alcance

O *Manual de Gestão de Contratos* do cliente descreve duas origens (skill `cassi-fluig-master`,
`references/gestao-de-contratos-protheus.md`):

1. **Pelo ciclo de compras** — a SC percorre cotação, negociação e alçadas até virar contrato.
   Está bloqueado para a automação por **cadastro no ERP**, não por permissão: a *Validação
   Orçamentária* e as *Alçadas* são atribuídas a aprovador **nominal** (tabelas AL/DHL), e a conta
   da automação não recebe a tarefa (`docs/politica-de-escrita.md`). Mesmo destravado, seria um
   ciclo de dias com aprovações humanas — inviável como pré-requisito de um teste.
2. **À mão no ERP** — *Manutenção > Contratos > Incluir*, depois *Outras Ações > Situação →
   "05 – Vigente"*, e então **aprovação pelo gestor de contratos** em *Atualizações > Aprovações >
   Documentos*. Três telas do Protheus mais um aprovador humano. A conta `TOTVS-FS` **não tem
   acesso ao ERP**: `.env.test` tem um único host, o do Fluig, e a suíte nunca falou com o
   Protheus a não ser através dos datasets do item 2.

E o corolário que fecha o caso: **contrato só vira "Vigente" depois da aprovação do gestor**. Um
contrato recém-incluído nasce *"Em elaboração"* → *"Em aprovação"*, e nesse estado **não serve**
para abrir Solicitação de Compra nem entra no robô de medição. Mesmo com uma via de escrita
hipotética, o contrato criado seria inútil para os testes sem um aprovador humano no meio.

---

## Consequência: cancelamento ao fim da execução

**Não se aplica.** Não há contrato criado pela suíte, logo não há contrato para cancelar. A
limpeza de fim de execução (`fixtures/global-teardown.js`) continua cancelando o que a suíte
realmente cria — solicitações de processo — pelo endpoint
`POST /api/public/2.0/workflows/cancelInstances`.

Vale registrar o que existiria, **se** um contrato pudesse ser criado: o encerramento no Protheus
é uma mudança de situação (*Outras Ações > Situação*) e depende de **não haver medição
registrada** — nada disso alcançável por API a partir do Fluig.

---

## O que foi feito no lugar

A dependência que **era** eliminável foi eliminada: a de um contrato **específico**.

`utils/massa-contratos.js` passou a distribuir a escolha entre os **554 contratos vigentes**
medidos na base (de 842 exibidos na grade; os demais estão Finalizado, Paralisado,
Sol. Finalização ou Cancelado), por **afinidade de hash** entre a identidade do teste e o número
do contrato, com **reserva exclusiva** entre workers. Detalhes e justificativa no cabeçalho do
próprio módulo.

Resultado: nenhum teste depende mais do `000000000000001`, e apagar qualquer contrato da base
afeta no máximo os testes que o escolhiam — não a suíte.

**O que isto NÃO resolve, e é honesto dizer:** a suíte continua dependendo de a base ter contratos
vigentes. Ela não cria a própria massa de contrato, porque não há como. Se o Protheus ficar sem
contrato vigente, os testes falham — mas falham como `PRÉ-CONDIÇÃO AUSENTE`, com mensagem que
distingue ausência de massa de defeito do produto.

---

## Como reproduzir estas medições

```js
// dentro de page.evaluate(), com sessão do storageState — page.request leva 403 do WAF
// 1. o universo de contratos e suas colunas CN9
await fetch('/api/public/ecm/dataset/datasets', {
  method: 'POST', credentials: 'include',
  headers: { 'Content-Type': 'application/json', Referer: `${location.origin}/portal/p/1/home` },
  body: JSON.stringify({ name: 'dsProtheus_getContratosxFornecedores_restGet',
                         fields: [], constraints: [], order: [] }),
});

// 2. oráculo de existência de dataset (200 = existe · 500 NPE = não existe)
await fetch('/api/public/ecm/dataset/search?datasetId=<nome>', { credentials: 'include' });
```

⚠️ O oráculo do item 2 **executa** o dataset. Use-o apenas com nomes cuja semântica de leitura
seja conhecida, ou aceitando que um nome de escrita que responda 200 já terá sido invocado.
