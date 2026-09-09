# O que falta — e o que dá para fazer com a conta atual

Medido em 08–09/09/2026, sobre `Casos de Testes - SDCASSI/` (518 casos de Fluig) e a suíte
(`tests/**`, 225 testes). Companheiro de `comparacao-automacao-x-chamados.md`, que é a matriz
caso a caso; este documento responde a pergunta seguinte: **o que dá para fazer agora?**

## Onde estamos

| | |
|---|---|
| Casos de Fluig escritos | 498 |
| Com teste automatizado | **40** |
| Restantes | 458 |

## Por que os 458 não estão feitos

Não é fila de trabalho — é cadastro. A classificação abaixo sai do campo *Bloqueio* de cada caso:

| Bloqueio | Casos | |
|---|---:|---|
| Perfil de **comprador** (matrícula na SY1) | 221 | 48% |
| Perfil de **fiscal/CSE** (etapa `GRAVA_MED`) | 54 | 12% |
| Efeito só observável no **Protheus** | 52 | 11% |
| Perfil de **gestor/aprovador de alçada** | 39 | 9% |
| Credencial de **fornecedor** | 15 | 3% |
| Módulo **ausente** do ambiente (Corretagens) | 5 | 1% |
| Schedule/evento não provocável | 2 | — |
| **Sem bloqueio de perfil** | **70** | 15% |

**Quatro perfis represam 329 casos (72%).** Nenhuma linha de código destrava isso.

## O que dá para implementar HOJE, com a conta `TOTVS-FS`

Vinte casos cujo próprio levantamento declara viabilidade com esta conta. Todos de leitura ou de
crítica de tela — nenhum exige perfil novo.

### Leitura de API — nascem rápido, sem UI

| Caso | O que afirma | Onde |
|---|---|---|
| FSWTBC-4263 | nomes de atividade da SC vindos do dado, não do ticket | `tests/api/` (novo) |
| FSWTBC-4669 | datasets do BPM de parecer respondem 200, não 500 | `tests/api/` (novo) |
| FSWTBC-4316 | datasets de produtos e grupo de produto respondem com dados | `tests/api/sincronizacao-protheus.spec.js` |
| FSWTBC-1792 | os três WSDL SOAP do Portal do Fornecedor respondem | `tests/api/` (novo) |
| FSWTBC-626 | instâncias antigas sem responsável após remediação da hierarquia | `tests/e2e/compras/` (novo) |
| FSWTBC-690 | instâncias de `wf_aprovacao_ocorrencia` (hoje zero) | `tests/api/` (novo) |

### Consulta no Tracker — só leitura

| Caso | O que afirma | Onde |
|---|---|---|
| FSWTBC-2158 | uma FC por (contrato, competência), sem duplicata | `tracker-compras.spec.js` |
| FSWTBC-1932 | as duas visões de negociação devolvem grade coerente | `tracker-compras.spec.js` |
| FSWTBC-1215 | itens da SC × cotação | `tracker-compras.spec.js` |

### Tela, sem escrever

| Caso | O que afirma | Onde |
|---|---|---|
| FSWTBC-4899 | Status no modal igual ao da grade, por extenso | `grade-contratos.spec.js` |
| FSWTBC-4626 | revisão auto-preenchida == revisão do contrato | `ciclo-faturamento.spec.js` |
| FSWTBC-3884 | Centralizar sem seleção → crítica, zero escrita | `portais/` (novo) |
| FSWTBC-4300 | Reprovar SC de terceiro → "não é sua responsabilidade" | `portais/` (novo) |
| FSWTBC-4317 | listas de seleção do Portal do Comprador | `portais/` (novo) |
| FSWTBC-4453 | inventário dos textos de instrução e de estado vazio | `portais/` (novo) |
| FSWTBC-4505 | "Atuar como" traz a própria conta por padrão | `ciclo-comprador.spec.js` |
| FSWTBC-3715 | filtros em Avaliação de Propostas e Definir Vencedor | `ciclo-comprador.spec.js` |
| FSWTBC-692 | nenhum `undefined`/`NaN` no shell da Negociação | `negociacao-proposta.spec.js` |
| FSWTBC-2636 | ausência de controle de anexo nos shells de cotação | `ciclo-cotacao.spec.js` |
| FSWTBC-5233 | textos explicativos do modal de Solicitação de Compra | `modal-solicitacao-compra.spec.js` |
| FSWTBC-637 | matrícula não resolvida é comunicada como erro | `rh/gestao-equipes.spec.js` |
| FSWTBC-5257 | CNPJ alfanumérico no auto-cadastro público (`@bug`) | `contratos/` (novo) |

## O que destrava mais, por ordem de retorno

1. **Matrícula de comprador na SY1 para `TOTVS-FS`** — destrava **221 casos**. É o item de maior
   retorno isolado do projeto, e por larga margem. Hoje o dataset é chamado com
   `Y1_USER = "undefined"` e as três filas do Portal do Comprador vêm vazias.
2. **Cadastrar a conta como Fiscal ou CSE de ao menos um contrato** — destrava **54 casos** ao
   abrir a etapa `GRAVA_MED` (quantidade, rateio, Gravar/Encerrar medição).
3. **Um login com perfil de gestor/aprovador de alçada** — destrava **39 casos**.
4. **Uma credencial de fornecedor** — destrava **15 casos** do Portal do Fornecedor.

Os 52 de efeito só no Protheus **não** se resolvem com perfil: precisam de acesso ao ERP, e já
estão escritos e arquivados em `Casos de Testes - SDCASSI/Protheus/` para quando isso existir.
