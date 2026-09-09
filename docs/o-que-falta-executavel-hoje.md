# O que falta — e o que dá para fazer com a conta atual

Medido em 08–09/09/2026, sobre `Casos de Testes - SDCASSI/` (518 casos de Fluig) e a suíte
(`tests/**`, 246 testes em 09/09/2026). Companheiro de `comparacao-automacao-x-chamados.md`, que é a matriz
caso a caso; este documento responde a pergunta seguinte: **o que dá para fazer agora?**

## Onde estamos

| | |
|---|---|
| Casos de Fluig escritos | 498 |
| Com teste automatizado | **72** *(era 40 em 08/09; +32 nos dois lotes de 09/09)* |
| Restantes | 426 |

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

**Quatro perfis represam a maior parte dos casos.** Nenhuma linha de código destrava isso.

> ⚠️ **Correção de 09/09/2026.** A primeira versão desta tabela trazia uma linha
> "sem bloqueio de perfil — 70 casos". O número estava errado e a categoria também: ele saía de
> um filtro por palavra-chave sobre o resumo da comparação, não sobre o campo **Bloqueio** de
> cada caso, e "sem bloqueio de perfil" não é o mesmo que "executável" — havia ali casos que
> exigem Protheus, massa ou segunda conta. Os números abaixo saem do campo Bloqueio do próprio
> caso, que é a fonte certa.

## O que dá para implementar HOJE, com a conta `TOTVS-FS`

Dois sinais independentes, e a união deles é a fila real:

| Sinal | Casos |
|---|---:|
| O caso declara **`Bloqueio: nenhum`** | 23 |
| O levantamento diz **"viável hoje"** | 18 |
| **União — fila real** | **40** |
| *(campo Bloqueio ausente — estado desconhecido)* | *6* |

Os 6 sem o campo preenchido **não** entram na conta: ausência de declaração não é declaração de
ausência. Precisam ser lidos um a um antes de virarem trabalho.

Atenção à leitura de vários desses 23: o texto diz *"nenhum **para a leitura**"* ou *"nenhum
**para a parte de tela**"*. São **metades executáveis** de casos cuja outra metade continua
bloqueada — o teste nasce cobrindo o que dá, com a lacuna declarada, como já foi feito em
`modais-do-contrato.spec.js` e `fila-faturamento-protheus.spec.js`.

Abaixo, uma seleção dos que já foram lidos e confirmados.

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

## Lote de 09/09/2026 — o que saiu da fila dos 40

Fechados (cada um com reprovação provada, `npm run cobertura` regenerado e execução em primeiro
plano):

| Chamado | Onde | Cor |
|---|---|---|
| 2158, 4804 | `tracker-compras.spec.js` — grade paginada, zero duplicata na chave | verde |
| 1934 | `tracker-compras.spec.js` — medições do disparo nascem utilizáveis | verde |
| 4317 | `portal-comprador.spec.js` — Filial e Produto sem ordenação | **`@bug`** |
| 3884 | `portal-comprador.spec.js` — colunas + crítica de centralização vazia | verde |
| 3715 | `portal-comprador.spec.js` — filtro por Nº do Processo Fluig | verde |
| 5233 | `modal-solicitacao-compra.spec.js` — descrições dos tipos | verde |
| 1906, 1954 | `validacoes-solicitacao-compras.spec.js` — rateio com zeros à direita | verde |
| 4819 | `validacoes-solicitacao-compras.spec.js` — 71 filiais no zoom | verde |
| 4503, 4176 | `datasets-contratos-fiscais.spec.js` — smoke com controle 500 | verde |
| 4537 | `gerencia-compras.spec.js` — colunas das duas abas | verde |
| 4420 | `delegacao-fiscais.spec.js` — "Amarração" não voltou | verde |
| 4820 | `modais-do-contrato.spec.js` — identificação da planilha preenchida | verde |
| 3918 | `delegacao-tarefas.spec.js` — envio sem Data Final não é criticado | **`@bug`** |
| 2752 | `cadastro-fornecedor.spec.js` — telefone cru preservado | verde |
| 1760 | citado em `validacoes-faturamento.spec.js` (metade legível) | — |

### O que foi tentado e NÃO virou teste, com o motivo

- **FSWTBC-2131** (upload de rateio da medição com duas casas decimais) — exige uma medição
  aberta **atribuída ao executor**, e esta conta não é Fiscal nem CSE de contrato nenhum. O
  bloqueio não é suposição: `validacoes-faturamento.spec.js :: CT-FAT-02-S1` já afirma, a cada
  execução, que `#panel_MeasurementItens` permanece inacessível, e `ciclo-faturamento.spec.js ::
  CT-FAT-01-H` cria uma medição de verdade e prova que ela cai para um responsável humano que
  não é esta conta. No dia em que a Cassi conceder a role, esses dois testes reprovam primeiro —
  é o sinal de que o 2131 passou a ser executável.
- **FSWTBC-4300, 692, 4505** (Portal do Comprador) — dependem de matrícula de comprador no ERP,
  de uma segunda conta de comprador e de alterar a composição de um grupo de segurança. Nenhum
  dos três se contorna com este usuário.
- **FSWTBC-4453** — o coração do chamado é a comparação DES × TST; só há acesso a um ambiente.
- **FSWTBC-1932** — as duas visões de negociação do Tracker não devolvem linha para esta conta;
  afirmar sobre grade vazia congelaria ausência de dado como se fosse regra.

### Três erros de oráculo que a exigência de reprovação pegou

Registrados porque a lição vale mais que o teste: **teste verde que nunca foi visto vermelho não
prova nada**.

1. O `@bug` do 4317 **absolvia** a lista mais desordenada das quatro — a lookup de Filial tem uma
   coluna vazia, e coluna vazia é trivialmente "ordenada".
2. O teste do 1906 passava com `99,90` no rateio, isto é, não afirmava nada: com uma linha só, a
   crítica de soma não dispara ao sair do campo. Quem avalia a soma é a validação do **envio**.
3. O do 4819 acusava "uma filial só" porque contava a opção-placeholder `Buscando…` — vermelho de
   sincronização, não defeito.

### Segundo lote de 09/09 — a fila dos 40 fechada

| Chamado | Onde | Cor |
|---|---|---|
| 5118 | `alcada-solicitacao-compras.spec.js` — alçada nominal, nunca pool | verde |
| 4153 | citado no `CT-ACC-04-S3`, que já segurava a requisição em voo | verde |
| 4581 | `criacao-solicitacao.spec.js` — cancelar a própria SC em Início | verde |
| 1985 | `smoke-integracao-erp.spec.js` — três portais trazendo dados do ERP | verde |
| 3617 | `etapa-automatica-distribuicao.spec.js` — nada parado há mais de 30 min | verde |
| 4632 | `ciclo-solicitacao-compras.spec.js` — filial propaga código e CNPJ | verde |
| 4459, 4828 | citados no teste de integração da SC, que já os media | verde |
| 5257 | `cadastro-publico-fornecedor.spec.js` — o campo CNPJ não guarda nada | **`@bug`** |

### O que sobrou bloqueado, e por quê

Nenhum destes se contorna com a conta `TOTVS-FS`:

| Chamado | Bloqueio |
|---|---|
| 4300, 692, 4505 | matrícula de comprador no ERP, segunda conta de comprador, admin de grupo |
| 3957 | exige forçar a falha do `mc_aprovadoresPorAlcadas` — indisponibilizar o ERP do cliente |
| 2131 | medição aberta **atribuída ao executor**; a conta não é Fiscal nem CSE |
| 3030, 4460, 4626 | dependem do ciclo completo de aprovação (gestor, alçada, fiscal) |
| 637 | gestor cujo e-mail no Fluig case com a matrícula no ERP, **e** três bases |
| 4453 | o coração do caso é a comparação DES × TST; só há um ambiente |
| 1932 | as visões de negociação do Tracker não devolvem linha para esta conta |
| 2636 | resolvido como *"Não será feito"*; a única coisa afirmável é a ausência de um recurso, e num formulário recém-aberto "zero anexos" é verdade trivial |

### O achado do lote

**FSWTBC-5257** já estava aberto com severidade Alta e prazo regulatório vencido, relatando que o
Portal recusa CNPJ alfanumérico. A medição mostrou algo maior: com a máscara aplicada, o campo
`#txt_cnpj` do cadastro público **não guarda entrada nenhuma** — nem CNPJ numérico. Nenhum
fornecedor se cadastra por aquela página hoje.

Dois cuidados que sustentam esse vermelho, e que valem como método:

1. **Controle na mesma página** — `#txt_cep` recebe e formata com a mesma digitação. Sem ele, o
   vermelho seria indistinguível de "o teclado do teste não chega ao formulário".
2. **Espera pela máscara** — sem ela o teste reprovava por motivos **opostos** conforme a corrida:
   com a máscara ainda não aplicada, o campo preserva tudo, inclusive o alfanumérico. Foi esse
   contraste que localizou o defeito na máscara, e não na página.

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
