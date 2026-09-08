# Achados novos — defeitos encontrados durante a geração dos casos de teste

Não estavam em ticket algum. Descobertos em tela ou no fonte publicado do ambiente
`caixade182374.fluig.cloudtotvs.com.br`, entre 04/09/2026.

---

## A1. "Ver rateio da SC" (DEM10015025) — entrega pela metade: JS publicado, HTML não

**Severidade: Alta** — funcionalidade contratada, paga e inalcançável.

O botão *"Ver rateio da SC"* existe **completo no JavaScript** dos formulários de **Cotação (256834)**
e **Negociação (256835)**: binding, modal `Rateio de Centro de Custo da Solicitação de Compras`,
consulta ao dataset `dsFluig_getRateioSC` (que responde HTTP 200) e montagem da tabela
`% · Centro de Custo · Classe Valor · Conta Contábil`.

**Mas o elemento `#btnVerRateioSC` não existe no HTML publicado desses dois formulários.**
O handler é vinculado a um seletor que casa com **zero** elementos — a funcionalidade é inalcançável.

| Form | Processo | `btnVerRateioSC` no HTML | no ViewHandler.js | `dsFluig_getRateioSC` |
|---|---|---|---|---|
| 256831 | Solicitação de Compras | 0 | 0 | 0 *(tem grade nativa)* |
| **256832** | **Parecer Técnico** | **1 ✅** | 1 | 1 |
| **256834** | **Cotação** | **0 ❌** | 1 | 1 |
| **256835** | **Negociação** | **0 ❌** | 1 | 1 |
| 256836 | Faturamento de Contratos | 0 | 0 | 0 |

Confirmado três vezes de formas independentes: dump de todos os rótulos do formulário em branco
(zero ocorrências de "Rateio"/"Centro de Custo"); fetch do HTML publicado (81.738 bytes, 0
ocorrências da string "rateio"); e abertura de uma **instância real** parada na Recepção de
Propostas (processo 112860) em modo leitura — `btnVerRateioSC: false`, `rateioNoHtml: 0`.

**Ação:** publicar o bloco HTML nos forms 256834 e 256835, como já está no 256832.

---

## A2. Fornecedor removido por código fixo em SEIS pontos, sem ticket algum

**Severidade: Alta** — exclusão silenciosa de participante em processo de compras.

O fornecedor **`85070508` / loja `0001`** é excluído por valor fixo em **seis pontos, de dois
artefatos distintos**:

*Portal do Comprador (widget `wg_portalCompradores`) — 5 pontos:*
- constante `FORNECEDOR_GENERICO`;
- dois `replaceGenericSupplier` que fazem `splice` **antes** do processamento — inclusive no
  caminho que alimenta o **envio de vencedores**;
- dois SQLs.

*Formulário de Parecer Técnico — 1 ponto:*
- `var arFornecedores = new Array("85070508-0001")` — aqui **sem nome, sem constante e sem
  comentário**, com aparência de deduplicação.

**Nenhum ticket documenta essa exclusão.** Num processo de compras, remover um participante
específico por hardcode — e no caminho que decide vencedores — é exatamente o tipo de regra que
auditoria questiona. Se for o "fornecedor genérico" de uso interno, precisa estar documentado e
nomeado; se não for, é defeito grave.

---

## A3. Guarda truthy anula a validação justamente no caso-limite

**Severidade: Alta** — FSWTBC-5198 consta "Concluído/Feito" e o defeito está vivo.

A crítica de valor mínimo roda dentro de `if (value && parseFloat(value) > 0)`. Zero é *falsy* em
JavaScript: **quantidade 0 pula a validação inteira**. Medido hoje — Preço 10,00 + Quantidade 0
não produz mensagem e deixa "Vlr. Total Estimado" vazio; quantidade em branco vira `0`
silenciosamente. A SC 112584 (a do ticket) ainda mostra no Histórico três tentativas falhas com
`AJUDA:OBRIGAT2 … Quantidade da SC`, desviadas para *Correção*.

---

## A2-b. O mesmo hardcode `85070508-0001` INVERTE a lógica em outro ponto

**Severidade: Alta** — FSWTBC-3697, fechado como "Feito" em 12/01/2026, defeito vivo.

Além dos seis pontos do A2 (que **removem** o fornecedor), há um sétimo que faz o oposto:
`handleReceptionProposals()` **esconde** `div#tableAnexoPropostas` para **todo** fornecedor que não
seja o hardcoded `"85070508-0001"`. Ou seja, o anexo da cotação só aparece para esse CNPJ — e
para todos os fornecedores reais fica invisível. É a explicação direta do defeito "anexo da
cotação não é exibido".

## A2-c. Cancelamento anuncia sucesso sobre um 404 — provável CAUSA RAIZ da família inteira

**Severidade: CRÍTICA** — FSWTBC-3716 (fechado 26/02/2026) e FSWTBC-3739/3750. Confirmado por
**dois lotes independentes**, no fonte publicado.

```js
if (status === 404) return [];                      // erro vira array vazio
...
else if (yield handlePurchasesDelet(...)) { /* sucesso */ }   // [] é TRUTHY
```

Um **404** do dataset de cancelamento cai no **ramo de sucesso**. Consequência medida:

- o usuário lê *"no ERP Protheus foi executado com sucesso!"*;
- **o processo é cancelado no Fluig sem o ERP ter cancelado nada.**

Isto é exatamente o caminho de erro que o FSWTBC-3750 existe para proteger — e é, muito
provavelmente, **a causa raiz da família inteira de defeitos de cancelamento desta conta**: nas
análises documentais dos 1.537 tickets, "cancelamento" aparece em **11 defeitos distintos**, quase
sempre com o mesmo sintoma — *cancelado no Protheus e vivo no Fluig*, ou o inverso. Este trecho
produz exatamente essa dessincronização, e produz em silêncio, com mensagem de sucesso.

**Recomendação:** tratar como item próprio e prioritário. Corrigir aqui pode fechar de uma vez
vários chamados que hoje são investigados isoladamente.

## A2-d. Condição sempre verdadeira

**Severidade: Média** — FSWTBC-3614.

`if (tipoInicioProcesso == 'manual' || 'automático')` — a segunda metade é uma string não vazia,
sempre truthy. **A condição nunca é falsa**, então o ramo alternativo é inalcançável.

## A2-e. Centralização gera SC única, não uma por filial

**Severidade: Média** — FSWTBC-3622, fechado em 14/04/2026.

`centralizaSolicitacoes` abre **uma SC única**. O desenho aprovado no ticket — uma SC por filial de
entrega — não está implementado no front desta base.

## A3-a. Rateio de 500% com -400% passa na validação

**Severidade: Alta** — FSWTBC-3443; o próprio ticket deixou o ponto em aberto, e ele segue vivo.

**Não existe validação de rateio por linha.** `handleValidRateio` apenas soma os percentuais e
compara o total com 100 — então `500 + (-400) = 100` **passa**. Três agravantes medidos:

1. o clamp de negativo no `blur` é **código morto**: o `replace` remove o sinal `-` antes do teste;
2. a **importação por CSV** grava o valor cru, sem passar por `blur`, checando só se a soma
   ultrapassa 100;
3. some-se o A3-c (`replaceToMoney` só normaliza com vírgula) e o A3-b (NaN pula a crítica).

## A3-b. Crítica de valor negativo pulada por NaN (mesmo padrão do A3)

**Severidade: Alta** — FSWTBC-2913, importação de medição.

Com `DESCONTO` em branco, `parseFloat("")` devolve `NaN`; `NaN < 0` é `false`; **a crítica
"O valor total não pode ser negativo" é pulada inteira** e o total inválido é gravado. É a mesma
classe do A3 (guarda que não cobre o caso-limite), agora com NaN em vez de zero.

## A3-c. Máscara monetária corrigida pela metade, em três cópias

**Severidade: Alta** — FSWTBC-2772.

`replaceToMoney()` só normaliza **se houver vírgula**. `30.500` cai no `else` e volta intacto —
`Number("30.500")` = **30,5**, um valor 1000× menor. A mesma lógica está **duplicada em três
lugares**, e o defeito continua **vivo** no caminho de importação de medição.

## A3-d. Switcher não tocado é lido como "Reprovado"

**Severidade: Alta** — FSWTBC-2681 / 2690.

O switcher de aprovação não possui estado "não decidido": se o aprovador não tocar no controle, o
processo lê **Reprovado**. Uma decisão de negócio é tomada por omissão, sem confirmação.

## A4. Erro anunciado sob o cabeçalho "Sucesso:"

**Severidade: Média** — achado por dois agentes independentes.

Em `/portal/p/1/gestao_equipes`, o erro *"Usuário não encontrado no ERP Protheus."* é exibido em
modal com título **"Sucesso:"** e `type:"danger"` — que não é ícone válido do SweetAlert2
(`Unknown icon ... got "danger"`), então nenhum ícone renderiza. Ao fechar, **a página fica em
branco**, sem estado vazio. O ticket original pedia Toast; o que existe é modal bloqueante com
OK/No/Cancel.

---

## A5. Botão que diz o contrário do que faz

**Severidade: Média.** No diálogo de exclusão de item, o botão que **cancela** a exclusão está
rotulado **"Não, excluir item N!"**.

---

## A6. Filtro de coluna busca pelo código e exibe a descrição

**Severidade: Média** — FSWTBC-4986.

Em *Acompanhamento de Contratos*, a coluna *Tipo Contrato* é pesquisável só pelo código:
`DEDETIZACAO`, visível em 63 linhas, devolve **0**; `017` devolve as 63. O `render` de `CN9_TPCTO`
monta a descrição apenas em `type==='display'` e devolve o código cru em `type==='filter'`.
As colunas vizinhas fazem o oposto.

---

## A7. Falha de transferência da SC é silenciosa — o aviso está comentado no fonte

**Severidade: Média** — FSWTBC-4945.

A SC nasce em `consumerkeycompras` e depois é transferida ao solicitante. Se a transferência
falha, o erro vai para `console.log` e **o toast que avisaria o usuário está comentado no código**.

---

## A8. Variável usada em mensagem de erro, atribuída só no ramo de sucesso

**Severidade: Baixa.** Clicar em *Anexar especificações do Produto* num item sem produto devolve
*"…para o item **undefined**"* em vez de `0001`. Em `handleShowCamera`, `item` só é atribuída no
caminho feliz.

---

## A9. Telefone e Celular sem máscara nem crítica

**Severidade: Baixa/Média** — FSWTBC-2752, pendência ainda viva.

No *Cadastro de Fornecedor*, os campos **Telefone** e **Celular** não têm `maxlength`, `pattern`
nem `data-mask`. `1133334444` permanece cru após o blur. No mesmo formulário, CEP tem
`maxlength=9` e CNPJ tem placeholder de máscara.

---

## A10. Instrução que se anula

**Severidade: Baixa.** O formulário de Delegação de Fiscais exibe *"Todos os campos com \* são
obrigatórios já os campos com \* não são obrigatórios"* — mesmo asterisco nas duas metades.

---

## A11. Dado inconsistente vivo na base

Contrato **00067-2023-5303**: Data Fim **31/07/2026** (vencida) com Status **"Vigente"**. A consulta
filtra apenas `CN9_SITUAC`, sem considerar data.

---

## A11-b. Erro indistinguível de vazio no widget Logs Protheus

**Severidade: Média** — FSWTBC-2635 / 2536.

Quando a consulta falha, o widget fica travado em *"Consultando logs..."* e **nunca** exibe
"Nenhum registro encontrado." Além disso, `previousPage` e `nextPage` são **stubs vazios** — a
paginação não funciona.

## A11-c. Nome de arquivo como contrato mudo

**Severidade: Média** — FSWTBC-2913.

Só o nome exato `Planilha de Medicao.xlsx` é importado. `Planilha de Medicao (1).xlsx` — o nome que
o navegador dá ao segundo download — **não faz nada e não avisa**. E o botão ainda se chama
"Planilha de Itens".

## A12. Id de pasta do ECM hardcoded por ambiente

Dois casos confirmados, mesma prática:
- `folderMain = 256821; // prod 256821 | qa 251956 | tst 256821` — formulário de Parecer.
- `const idDoc = 395015; // prod 395015 | qa 256574 | tst 395015` — **em QA, o "Download Planilha
  de Rateio Modelo" baixa o documento errado.**

É a mesma prática que originou o FSWTBC-2157 e a divergência PRD × TST do FSWTBC-2244.

---

## A13. N+1 "corrigido" trocando desempenho por dado incompleto

**Severidade: Média** — FSWTBC-4178 consta "Concluído/Feito".

O laço `getSuppliers` por fornecedor continua; foi apenas contido por
`MAX_CONSULTAS_FORNECEDOR = 10`. Do **11º fornecedor em diante a tela mostra `codigo-loja` em vez
do nome** — e isso não está documentado. Medições: um modal de SC dispara 14 chamadas de dataset
(`getCentroCusto` 3×); o pior caso é o **formulário da SC em branco, com 165 requisições**.

---

## A14. O JS do formulário não conhece 3 das 11 etapas do processo

**Severidade: Média** — Cadastro de Fornecedor (form 256830).

`this.activitys` declara `{inicio:4, integracaoERP:11, completarCadastro:13, validarFornecedor:48,
notificaFornecedor:38, naturezaFinanceira:21, integracaoERPFim:23, fim:25}` — **não conhece as
etapas 17 (Aprovação), 32 e 45 (Verificar Integração)**. Não há tratamento de tela para elas.

## A15. Ciclo reentrante silencioso no Cadastro de Fornecedor

**Severidade: Média.** O par *Notifica Fornecedor → Completar Cadastro* é **reentrante**: a
instância 109459 passou **duas vezes** por *Notifica Fornecedor* (29/07 e 04/08/2026), já tendo
sido preenchida e validada em cada ciclo. A agregação confirma o padrão: *Completar Cadastro* com
**960** ocorrências contra **638** de *Integrar com ERP (Criar Fornecedor)* — ou seja, o
fornecedor é recobrado mesmo depois de completar o cadastro.

Campo relacionado: `txt_emailNatFin` ("E-mail do Responsável" da Natureza Financeira) estava
**vazio** na instância medida — candidato direto ao `undefined` relatado no ticket de e-mail.

## Correções ao registro (tickets com informação errada)

| Ticket | O registro diz | O ambiente mostra |
|---|---|---|
| **SDCASSI-247** | medições com numeração trocada entre os itens | **o ticket inverteu os fatos**: 81192 tem `numMedicao=000193` no item 001 e 81193 tem `000191` no item 003 — **não houve troca de item**. Concorrência medida: gravaram com **19 s** de diferença e saíram da fila no mesmo tick do job. A regra real é "o número segue o instante de gravação, não o número do processo" — e **nada em tela diz isso** |
| FSWTBC-3749 | atividade "Aguarda Movimentação Protheus" | **não existe na SC nem no Faturamento** (6.000 movimentos, 59 sequências) — mas **existe na Cotação, seq. 42**. Na SC o que existe é "Aguarda Geração da Cotação", seq. 328 |
| FSWTBC-4234 e afins | "Verificar Trava Orçamentária" | na tela chama-se **"Verificar retorno Protheus" (317)**. E o JS da SC declara `fimVerificaTravaOrcamentaria: 104` — **a 104 não existe**; o fim real é a **319** |
|---|---|---|
| FSWTBC-4075 | grupo `G.Compras.Acompanhamento_Contratos` | grupo **não existe**; os reais são `G.P.Acompanhamento_Renovacao_Contratos` e `..._admin` |
| FSWTBC-4342 | "Não Contratado" | botão **existe em produção**: *"Ver Solicitação da Compra"* |
| SDCASSI-514 | passaria a existir só o tipo "Revisão Aberta" | **zero ocorrências**; só *Nova Contratação* e *Aditivo Contratual* |
| FSWTBC-2131 | corrigido | `listDecimal = { rateio: 8 }` **ainda no fonte**, em dois arquivos |
| — | "Ajustes na Proposta (62)" | sequência 62 **não existe** em 12.000 movimentos |
| SDCASSI-460 | usertask 117/123/124, versões 42→46 | processo está na **v52**; só a **117** existe nas instâncias — 123 e 124 nunca percorridas em 165 instâncias. **A correção funciona**: `Correção` (seq 117) atribuída a `Pool:Group:G.P.FatConCorrecaoIntegraca`, confirmado em 7 instâncias abertas, já desde a v50 |

---

## A15-b. O ticket erra sobre a própria retentativa — e o campo de erro fica vazio

**Severidade: Alta** — SC **113196**, em *Correção* desde 03/09/2026, reproduzindo hoje o sintoma
dos SDCASSI-380/389.

Estado medido: `Nº da Solicitação ERP` **vazio** após **3 falhas** em *Grava SC e Anexos*, com a
mensagem real `Cannot convert NaN to java.lang.Integer (servicetask233#267)`.

Três correções ao registro:
1. a mensagem **não** é "undefined" — é específica e aponta a linha;
2. **o Fluig TEM retentativa automática** (3 tentativas, ~9 min) — o FSWTBC-4445 afirma que não há;
3. **o campo `Retorno Integração` fica VAZIO apesar do erro** — só o Histórico explica o desvio.
   Ou seja, o campo que existe justamente para mostrar a falha ao usuário não é preenchido.

## A16. A fila do Faturamento continua travando — medido em 04/09/2026

**Severidade: Alta** — não é histórico, é o estado de hoje.

Instâncias **111980, 111977 e 111973** paradas em *"Aguarda processamento Fila Protheus"* desde
**14–17/08/2026** — 18 a 21 dias. Mais **7 em "Correção"**. É o sintoma exato dos SDCASSI-450, 462
e 536, todos com correção entregue; o SDCASSI-300 também consta fechado.

Dois agravantes medidos:
- na **111980** a tarefa em espera está `NOT_COMPLETED` **sem responsável** — ninguém é dono dela;
- o **SLA real** de saída dessa atividade é de **7 minutos** (medido na instância 113249). Ou seja,
  18 dias não é lentidão: é travamento.

Medição colateral: a SC **113267**, criada pela conta de QA hoje, levou **3 min 12 s** em
"Grava SC e Anexos" — acima do limite de 2 min considerado aceitável no FSWTBC-3749.

O widget **Logs Protheus** (abas ZZY/ZZZ, coluna `Qtd T.Env Fl` = contador de retry) é a
superfície para acompanhar isso, mas hoje o `genericQuery` dessas abas responde 404 — ou seja,
**a ferramenta de diagnóstico da fila está indisponível justamente enquanto a fila trava**.

## A17-a. Dataset com nome errado devolve HTTP 200 vazio — e isso mascara defeitos

**Severidade: Alta** — mecanismo geral, não caso isolado.

Medido: **o endpoint de dataset do Fluig não erra quando o nome do dataset não existe** — devolve
`HTTP 200` com `{"columns":[],"values":[]}`. Ou seja, **errar o nome de um dataset é
indistinguível de "não há dados"**, em silêncio.

Consequência concreta, encontrada em `wAcompanhaContratos_pt_BR.js`: os **dois** nomes do
FSWTBC-4078 coexistem no fonte publicado —

| Função | Dataset chamado | Resposta |
|---|---|---|
| `searchPlanilha` | `dsProtheus_getInfoPlanilhaxContrato_restGetAll` (corrigido) | **200, 22 colunas com dados** |
| `loadPlanilhasDisponiveis` | `dsProtheus_getInformaPlanxContrato_restGetAll` (**errado**) | **200, vazio, sem mensagem** |

A correção foi aplicada em **um dos dois pontos de chamada**. O outro devolve zero planilhas de
forma indistinguível de "contrato sem planilha" — que é **literalmente a frase do FSWTBC-4068**
("não existe planilha disponível" num contrato que tem três). Esse chamado foi **encerrado por
decurso, sem registro de causa**; este é um candidato mecânico direto.

**Como detectar — método confirmado (refinamento do L029):** os dois verbos se comportam de forma
diferente, e só um serve:

| Chamada | Dataset EXISTENTE | Dataset INEXISTENTE |
|---|---|---|
| `POST /api/public/ecm/dataset/datasets` | `{}` / 200 vazio | `{}` / 200 vazio — **não distingue** |
| **`GET` search do dataset** | **200 `[]`** | **500 `NullPointerException`** ✅ |

Ou seja: **use o GET search, não o POST**, para verificar se um dataset existe. Isso dá um
**smoke test pós-deploy** reutilizável — varrer os nomes de dataset citados no fonte publicado e
sinalizar os que devolvem 500. É o único jeito de achar esses defeitos, que não deixam rastro em
log.

**Recomendação:** rodar essa varredura sobre todos os nomes de dataset do fonte publicado.

## A17. Datasets devolvendo lixo em vez de erro

**Severidade: Média.**
- `ds_fatcon_get_competencia` devolve a **string literal `"undefined"`** nos campos `CODE` e
  `COMPETENCIA`, com `STATUS:"ERROR"` — é a mesma classe do "Erro: undefined" do FSWTBC-4234.
- `dsRevisaoContratos` devolve **zero colunas**, com e sem filtro — indistinguível do modo de
  falha que o SDCASSI-312 atribuiu à ML do formulário.

## Ponto de atenção para o time

O padrão de atividade `Correção` (`TASK_USER`) foi replicado nos processos irmãos —
`wf_cotacao_produtos_servicos` seq **72**, `wf_negociacao_cotacao_prod_serv` seq **51**,
`wf_solicitacao_compras` v98 seq **236**. Vale confirmar se **todas** receberam grupo atribuído,
como a 117 do Faturamento recebeu. Uma delas sem pool vira tarefa órfã.
