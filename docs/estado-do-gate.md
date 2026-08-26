# Estado do quality gate — medições

Números **medidos**, não estimados. Relatório JSON do Playwright, ambiente real.
Última atualização: 25/08/2026, ao fim das três ondas de implementação.

## Suíte

| | |
|---|---|
| Specs | 65 |
| Testes na execução padrão | 143 (57 arquivos) |
| Testes `@destrutivo`, sob demanda | 34 (16 arquivos) |
| **Total** | **177** |
| Page Objects | 36 |

Conferir os totais:

```bash
npx playwright test --list | tail -1                                    # 143
INCLUIR_DESTRUTIVOS=1 npx playwright test --grep @destrutivo --list | tail -1   # 34
```

## Determinismo — CERTIFICADO do lado do teste

Estudo dedicado, **735 execuções** em `--repeat-each=3 --workers=4`, fatiado por bloco e sempre em
primeiro plano.

**Resultado: em ambiente saudável, todo verde é 3/3 e todo vermelho é 3/3.** Nenhum teste é
flaky **por causa própria** — mas dois testes variam por causa do produto e do ambiente, e
isso aparece no total de uma execução para outra. Ver a seção seguinte antes de comparar
dois relatórios.

O estudo encontrou e corrigiu **um falso verde real**: `CT-ADM-01-H` reprovava isolado mas passava
1 em 3 no conjunto — e o verde é que era falso, num teste que documenta defeito. Causa raiz: o
iframe do formulário navega quatro vezes durante a carga, e `not.toBeVisible()` é satisfeito no
primeiro poll em que o elemento não está lá; um poll caindo numa janela em branco passava sem
observar nada. Corrigido esperando o conteúdo estabilizar. Na verificação, descobriu-se ainda que
o heading usa `U+00A0` em todos os espaços — comparar com literal digitado teria criado um falso
verde permanente.

Também **refutou com medição** quatro hipóteses antes de atribuir 12 falhas ao ambiente: corrida
no carregamento (12/12 cargas limpas), concorrência (24/24 a 8 contextos), invalidação de sessão
por re-login e sessão fria (9/9). E confirmou que **não há vazamento de estado entre suítes** — o
teardown adotado está segurando.

## Duas fontes de vermelho variável que NÃO são flakiness da suíte

**1. Oscilação do Protheus.** O ambiente alterna entre ~855 contratos e resposta vazia. A suíte
rotula corretamente como `PRÉ-CONDIÇÃO AUSENTE`, mas o Playwright conta como falha — então um
relatório isolado ainda não se autoexplica. Na última execução conjunta, **29 dos 54 vermelhos
eram exatamente isto**.

**2. Não-determinismo no produto** (`wf_substituicaocargos`): em 8 cargas sequenciais, sem
concorrência e sem interceptação, o dataset devolveu a mesma resposta nas 8 e **7 bloquearam o
formulário, 1 não**. A suíte está certa em reprovar quando ocorre; estabilizar o teste esconderia
o defeito.

Remedido em 25/08/2026 com `--repeat-each=3`: `CT-SUB` deu **1 verde e 2 vermelhos**, e
`bloqueio-processos-rh` deu **3/3 verde** na mesma janela em que reprovara horas antes. A
proporção muda, o fenômeno não. **Consequência prática: o total de vermelhos da suíte não é
comparável entre execuções sem olhar quais testes são.** É por isso que este documento registra a
lista, não só o número.

## O que falta para carimbar o gate

Uma **medição conjunta numa janela em que o Protheus não oscile**. Todas as tentativas de 24 e
25/08 pegaram o ambiente instável — ele caiu duas vezes e, na última verificação, respondeu 0 de 4.
Não é pendência de código.

## Recomendações de configuração

1. ✅ **Aplicado**: `actionTimeout` explícito (45s). Antes, `locator.waitFor()` usava o default de
   30s do Playwright, que não derivava de nada declarado — era o prazo mais apertado da suíte e
   ninguém o havia escolhido.
2. **Pendente**: `CT-FAT-02-S2` roda até 182s e às vezes estoura o próprio `test.setTimeout`,
   prendendo um worker por 3 minutos. Candidato a projeto isolado.
3. **Pendente**: portão de pré-condição por execução — as ~34 specs dependentes da grade poderiam
   checar uma vez, no início, se o Protheus responde, e reportar a janela de ambiente como bloco
   em vez de dezenas de vermelhos que parecem flaky.
4. **Pendente**: `test-results/`, `playwright-report/` e o `storageState` por execução, quando
   houver runs concorrentes no mesmo diretório.

## Alerta de ambiente

O Portal de Acompanhamento de Contratos oscilou, em dois dias seguidos, entre 855 contratos, zero
contratos e não carregar. Para o usuário final é indisponibilidade intermitente do fluxo de
abertura de Solicitação de Compra a partir de contrato. Merece chamado próprio, independente da
suíte.

## Medição final — 25/08/2026, 11:00–11:45

Suíte padrão completa (`@destrutivo` fora), fatiada por área, `--workers=4`, sempre em primeiro
plano. As cinco fatias somam exatamente os 143 testes da execução padrão.

| Fatia | Verde | Vermelho |
|---|---|---|
| `tests/api` + `auth` + `plataforma` + `seguranca` | 20 | 9 |
| `acompanhamento-contratos` + `contratos` | 28 | 12 |
| `compras` + `tarefas` | 17 | 7 |
| `documentos` + `fiscal` + `juridico` + `notificacoes` | 12 | 2 |
| `portais` + `rh` + `saude` | 26 | 10 |
| **Total** | **103** | **40** |

### Os 40 vermelhos, classificados

| Classe | Qtde | Natureza |
|---|---|---|
| **Defeito do produto**, já catalogado no README | 35 | vermelho intencional: o teste afirma o comportamento esperado e o produto não entrega |
| **`PRÉ-CONDIÇÃO AUSENTE`** — massa que não existe na base | 3 | `CT-FAT-02-S2` (nenhuma competência bloqueada), `CT-COT` e `CT-NEG` (nenhuma cotação — consequência de D-01) |
| **Sem veredito na hora** | 1 | envio sem anexo — **resolvido depois**, ver abaixo |
| **Não reproduzido** | 1 | `CT-DEL-01-H` — ver abaixo |

### O vermelho sem veredito — RESOLVIDO em 25/08/2026, 11:45–12:20

`CT-CMP-02-S4` (envio sem anexo) ficou sem veredito na medição das 11h porque o ambiente
degradou no meio da apuração. Remedido em janela estável, e o resultado **corrige uma leitura
anterior da suíte**.

**O que a suíte documentava:** o Fluig mostrava uma tela de "Acessar solicitação #NNNNN"
fabricada, com `tentativas() === 0` — ou seja, uma confirmação de sucesso *sem nunca contatar o
servidor*.

**O que foi medido, com a escrita liberada:** a requisição sai
(`POST /ecm/api/rest/ecm/workflowView/send`), o servidor responde **HTTP 200 com
`processInstanceId` real** e **a Solicitação de Compras é criada sem o anexo obrigatório**. A
confirmação não era fabricada — era verdadeira. O defeito é mais grave do que o registrado:
não há validação do anexo **nem no cliente nem no servidor**.

A mudez da tela que aparecia sob o teste (botão Enviar some, nenhum diálogo) era **artefato da
guarda de escrita**, que aborta a requisição — não comportamento do produto. Foi exatamente a
armadilha já registrada no CLAUDE.md ("interceptar muda o comportamento da aplicação"), e é por
isso que o oráculo do teste passou a ser a tentativa de escrita, nunca o que a tela mostra
depois.

**O que mudou na suíte:**

| | |
|---|---|
| `CT-CMP-02-S4` (cliente) | reescrito: falha nomeando o endpoint disparado, em vez de `Nenhum dos 3 locator(s)…`. Determinístico 3/3 |
| `CT-CMP-02-S4 @destrutivo` (servidor) | **novo** — prova que o servidor cria a SC sem anexo. Vermelho de propósito |

Os dois existem porque "o cliente não valida" e "o servidor aceita" têm gravidades diferentes:
se amanhã só o cliente for corrigido, o teste de servidor segue vermelho e mantém visível que a
regra não está onde precisa estar — o cliente é contornável.

Custo desta apuração: **três Solicitações de Compra criadas na base** (observadas: #112445 e
#112447), com massa de `criarProdutoCompra()` — prefixo `QA` e sufixo único, rastreáveis.

### Um vermelho não reproduzido

`CT-DEL-01-H` (delegação de fiscais) reprovou uma vez sob `--workers=4` e **passou nas duas
repetições seguintes**, isolado e em paralelo. Na mesma leva havia um
`net::ERR_NETWORK_CHANGED`, o que aponta para a rede da máquina, não para a suíte. Registrado
como **não reproduzido**, não como resolvido.

### A instabilidade do ambiente, medida

Isto não é ruído de fundo — é o principal fator que limita o gate. Em ~45 minutos:

| Hora | Estado |
|---|---|
| 10:59 | grade de contratos sem registros |
| 11:05 | sem registros |
| 11:10 | estável (3 amostras seguidas com dados) |
| 11:05–11:25 | janela boa: as cinco fatias mediram normalmente |
| ~11:30 | degradou: `locator.click` estoura em telas que respondiam 25 min antes |
| 11:37 | fatias que não dependem do Protheus (jurídico, documentos) continuam rápidas e verdes |

O padrão é consistente: **o que depende da integração com o Protheus oscila; o que não depende,
não.** Por isso a suíte falha com `PRÉ-CONDIÇÃO AUSENTE` explícito em vez de timeout opaco —
é o que permite ler o relatório e separar ambiente de defeito sem abrir trace.

## Execução completa — 25/08/2026, 14:00–14:20

Repetição da medição, com o ambiente estável e já com `CT-CMP-02-S4` remedido.

| Fatia | Verde | Vermelho | vs. 11h |
|---|---|---|---|
| `tests/api` + `auth` + `plataforma` + `seguranca` | 20 | 9 | igual |
| `acompanhamento-contratos` + `contratos` | 29 | 11 | +1 verde |
| `compras` + `tarefas` | 17 | 7 | igual |
| `documentos` + `fiscal` + `juridico` + `notificacoes` | 12 | 2 | igual |
| `portais` + `rh` + `saude` | 30 | 6 | +4 verde |
| **Total** | **108** | **35** | **+5 verde** |

**Os +5 não são melhoria de produto nem de suíte.** São as duas fontes de vermelho variável já
descritas acima: `CT-DEL-01-H`, que na medição das 11h caiu junto de um `net::ERR_NETWORK_CHANGED`
da máquina, e os testes de RH sujeitos ao não-determinismo de `wf_substituicaocargos`. Nenhuma
linha de código de produto mudou entre as duas execuções.

A fatia 5 foi executada **duas vezes seguidas** e devolveu 30/6 nas duas — dentro desta janela o
número é reprodutível. Entre janelas, não é, e a seção anterior explica por quê.

Os 35 vermelhos seguem a mesma classificação de sempre: defeito de produto catalogado no README,
`PRÉ-CONDIÇÃO AUSENTE` por massa inexistente, e variância de produto/ambiente. Nenhum é falha de
mecânica da suíte.

## Suíte inteira, destrutivos incluídos — 25/08/2026, 15:15–15:55

A partir de 25/08/2026 a execução padrão **roda tudo**, por decisão do dono do ambiente
(`playwright.config.js`, `grepInvert` invertido). Primeira medição sob a nova regra, com reporter
JSON — as contagens anteriores deste documento vinham de raspagem do texto colorido do reporter
`line`, que se mostrou pouco confiável.

| | Testes | Verde | Vermelho |
|---|---|---|---|
| Execução padrão (sem tag) | 143 | 106 | 37 |
| `@destrutivo` | 34 | 17 | 17 |
| **Total** | **177** | **123** | **54** |

Vermelhos por área: `acompanhamento-contratos` 17 · `compras` 10 · `seguranca` 4 · `documentos` 4
· `rh` 4 · `plataforma` 3 · `contratos` 3 · `juridico` 3 · `api` 2 · `portais` 2 · `tarefas` 1 ·
`saude` 1.

### O que rodar os destrutivos revelou

**Um defeito que a execução "segura" nunca teria produzido:** `CT-GED-02-S1` — o GED **aceita e
publica um arquivo `.exe` sem nenhuma validação de extensão**, sem mensagem de bloqueio. Vermelho
em 3 de 3 execuções.

**Um defeito da própria suíte, corrigido:** dois testes de GED (`CT-GED-02-H` e `CT-GED-04-H`)
reprovavam sob `--workers=4` e passavam sozinhos — falso vermelho. Causa raiz: a área de upload
temporária do GED (`UPLOAD_FOLDER`) é **do usuário no servidor**, não da aba. Dois testes
publicando ao mesmo tempo com a mesma conta enxergam a tabela de arquivos um do outro, e a
limpeza de resíduos de um apaga o arquivo do outro.

Isolar por massa não resolvia (o disputado não é o dado, é a área de staging) e `describe.serial`
também não (a disputa é **entre arquivos**, e serial não atravessa arquivo nem worker). A correção
foi `utils/exclusividade.js`, um lock de diretório no sistema de arquivos — o único canal
compartilhado entre processos do runner — em volta da publicação.

Medição controlada, `tests/e2e/documentos` a `--workers=4`, 3 execuções de cada lado:

| | Vermelhos |
|---|---|
| Sem lock | **4/4 em 3 de 3**: `CT-GED-02-H`, `CT-GED-02-S1`, `CT-GED-04-H`, `CT-GED-05-H` |
| Com lock | **2/2 em 3 de 3**: `CT-GED-02-S1`, `CT-GED-05-H` |

Os dois que sobram são reais: `.exe` aceito, e a Lixeira que leva minutos para indexar a exclusão
(já documentado no cabeçalho de `DocumentosGedPage`).

> ⚠️ Ao medir cobertura ou contar vermelhos, **use o reporter JSON**. Raspar a saída do reporter
> `line` com `grep`/`sort -u` produziu, nesta mesma sessão, dois números errados seguidos.

## Depois da varredura de falsos vermelhos — 25/08/2026, 17:30–17:48

Três agentes investigaram, em arquivos disjuntos, os 10 vermelhos que reprovavam **sem
veredito** (timeout de locator, sem mensagem de domínio). Resultado da suíte inteira depois das
correções:

| | Testes | Verde | Vermelho | antes |
|---|---|---|---|---|
| Execução padrão | 143 | 108 | 35 | 106/37 |
| `@destrutivo` | 34 | 21 | 13 | 17/17 |
| **Total** | **177** | **129** | **48** | **123/54** |

**O número que importa não é o 129 — é o zero:** dos 48 vermelhos, **nenhum** reprova por
timeout opaco. Todos trazem mensagem de domínio dizendo o que o produto fez de errado, ou
`PRÉ-CONDIÇÃO AUSENTE` nomeando o que falta.

### Os 4 `PRÉ-CONDIÇÃO AUSENTE`, um a um — três causas diferentes

Agrupá-los como "falta massa" seria impreciso. Só **um** é isso de verdade:

| Teste | Causa real |
|---|---|
| `CT-COT` — fila "Controle De Cotações" vazia | **Defeito de produto (D-01)**, não massa. Nenhuma Cotação chega a existir porque toda SC fica presa no marco de Início e nunca alcança o Protheus. Some junto com D-01 |
| `CT-NEG` — fila "Avaliação de Propostas" vazia | **Mesma causa**: sem Cotação não há proposta para negociar |
| `CT-FAT-02-S2` — nenhuma competência bloqueada | **Não era massa: era DEFEITO, e o teste não conseguia vê-lo.** Ver abaixo |
| `atribuicao-comprador` — "Movimentar Solicitação" não renderizou | **Ambiente, transitório.** Reexecutado isolado: **passou** (2,5 min). Não é massa nem defeito |

Ou seja: **2 dos 4 são o D-01 vestido de pré-condição** (e o teste diz isso na própria
mensagem), 1 é massa que a base não tem hoje, e 1 foi lentidão do ambiente.

### `CT-FAT-02-S2` — a otimização virou achado de defeito (26/08/2026)

A ideia era só reduzir o tempo: consultar os datasets em vez de navegar contrato por contrato.
Ao capturar os endpoints, apareceu outra coisa.

`GET /api/public/ecm/dataset/search?datasetId=ds_fatcon_get_info_medicoes&filterFields=CNA_CONTRA,
<contrato>,FILIAL_CONTRATO,<filial>,COMPETENCIA_ESCOLHIDA,<mm-aaaa>,FILIAL_ESCOLHIDA,<filial>`
responde, para o contrato 000000000000001:

```
{"content":[{"STATUS":"ERROR","RESPONSE":"… CNTA120_REV:Existe revisão pendente de aprovação
para este contrato, não é permitido medir contratos em revisão. …"}]}
```

E a tela, para a MESMA competência, não exibe diálogo nenhum. Confirmado interceptando a
resposta que o widget recebe (`page.route` + `route.fetch`), não por dedução: o corpo chega com
`STATUS: ERROR` e o usuário não é avisado. O painel de itens não abre — então nada é medido,
e por isso o defeito é de aviso, não de integridade.

**Consequência para a leitura anterior:** o teste concluía "nenhuma competência bloqueada
encontrada" porque o oráculo dele era o **diálogo de erro**. O bloqueio existia em todas as
competências amostradas; o diálogo é que nunca dispara. Não era falta de massa — era um defeito
que o teste não enxergava.

**Ganho de tempo, medido:** 153s → **32-39s** (3 de 3 execuções), sendo que a descoberta da
competência bloqueada custa **0,7s** e a grade de contratos, 8,2s. O resto é dirigir a tela, que
continua necessário: é o que prova que a interface não avisa.

**Hipótese refutada no caminho:** o campo `PAGAMENTO` de `ds_fatcon_get_competencia` NÃO marca
bloqueio. A competência 03-2025 vem com `PAGAMENTO: "true"` e a 04-2025 com `"false"`, e as duas
são recusadas pelo Protheus. Filtrar por ele daria falso negativo — está documentado em
`utils/massa-medicao.js` para ninguém tentar de novo.

### O que era problema NOSSO (e não defeito)

| Causa raiz | Onde batia |
|---|---|
| **Listagens paginam por cursor, `rows=15`, ordem CRESCENTE** — o registro recém-criado tem o maior id e fica fora do lote renderizado. `totalpages`/`totalrecords` não são o total | "Minhas Solicitações" (2 testes) e "Tarefas a concluir" (1). Escondia um vermelho legítimo de D-01 |
| **Grade do GED pagina em 30 por Descrição** — o documento caía na página 1 ou 2 conforme a inicial sorteada pelo faker, daí parecer aleatório | `CT-GED-02-H`, e a 2ª assertion de `CT-GED-02-S1` podia dar falso verde |
| **`afterEach` esperava a grade antes de sair da pasta ruim** — pasta corrente inválida responde 200 e não renderiza grade nenhuma | os 4 testes de GED, com `columnheader` estourando |
| **`expectAberto()` devolvia antes de o formulário montar** — `blockUI` ainda cobrindo o alvo | 3 testes de Compras |
| **Lock de upload solto cedo demais** — liberava no clique em Confirmar, com o `POST saveNewItem` em voo | `CT-GED-04-H` |
| **Guarda de escrita abortava o POST cuja RESPOSTA produz o diálogo de erro** | `CT-DEL-01-S1` |
| **`try/catch` engolindo o motivo de cada contrato descartado** | mensagem de `PRÉ-CONDIÇÃO AUSENTE` saía como `Tentativas: []` |
| **Espera fixa escondendo falha mecânica** — clique interceptado por tooltip virava exceção engolida e reaparecia como "nenhum contrato tem saldo" | `CT-FAT-01-H` (virou verde de verdade, ~35s) |

### Duas coisas que a suíte documentava ERRADO

**D-11 não existe como estava escrito.** Medido isolando os datasets: só `getBranches` fora → 1
alerta; só `getItensPlanilha` fora → 1 alerta; os dois fora → 2 alertas, um por falha. Não há
duplicação de renderização. O defeito real é o **rótulo**: a falha dos itens da planilha é
anunciada como *"Erro ao buscar dados da filial"*, então com o Protheus fora os dois ficam
idênticos. O teste antigo derrubava os dois datasets e exigia um alerta — reprovava medindo o
próprio cenário.

**A "indexação lenta da Lixeira" foi refutada.** Estava registrada como comportamento do
ambiente; corrigidos os problemas reais, o ciclo publicar → excluir → achar → restaurar →
reencontrar fechou **verde em 5/5**, dentro do orçamento que já existia, sem aumentar timeout.

### Defeito de produto novo, achado por rodar os destrutivos

**Fail-open no formulário clássico de SC:** enquanto a montagem não termina (overlay `blockUI` na
tela), o clique em Enviar **não é validado** — o Fluig dispara `POST .../workflowView/send` e
cria a SC de um formulário vazio. Medido em 2 de 9 cargas **sem concorrência**, e de forma
persistente quando `ds_protheus_getMatriculaTitular_rest` responde 500
(`WFLYEJB0054: Failed to marshal EJB parameters`).

### Higiene de suíte adotada

- `utils/exclusividade.js` — lock entre workers para a área de upload do Fluig
  (`/volume/wdk-data/upload/<login>/`), que é **um diretório por usuário** e é compartilhada
  entre o publicador do GED e o anexo da SC. Nome único nos dois pontos
  (`fluig-upload-staging`): nomes diferentes reintroduzem a colisão. Dar nome de arquivo único
  **não** resolve — a disputa é pelo diretório.
- `utils/central-tarefas-paginacao.js` — a varredura paginada, compartilhada pelas duas
  listagens, para as duas não divergirem.
- Ao rodar agentes em paralelo, use `--output=/tmp/pw-<n>`: uma execução limpa `test-results/`
  e leva os traces de quem estiver no meio de uma investigação.

## Execução com ritmo controlado — 26/08/2026, 11:10–12:18

O dono do ambiente pediu **60s entre cada teste destrutivo**: o Fluig tem proteção contra volume
de requisições, e em 25/08 a suíte chegou perto de ser barrada rodando várias vezes seguidas.
Bloqueio de taxa aparece no relatório como vermelho comum — seria confundido com defeito.

O ritmo foi aplicado na **orquestração**, não no código: os 34 destrutivos rodaram um por vez,
cada um numa invocação própria do Playwright, com 60s de intervalo. Os 144 não-destrutivos
rodaram em paralelo, como sempre, porque não escrevem.

| | Testes | Verde | Vermelho | Tempo |
|---|---|---|---|---|
| Não-destrutivos (`--workers=4`) | 144 | 109 | 35 | 7 min |
| `@destrutivo` (um a um, 60s de pausa) | 34 | 22 | 12 | 61 min |
| **Total** | **178** | **131** | **47** | **1h08** |

**Nenhum vermelho sem veredito.** 44 são defeito de produto com mensagem de domínio e 3 são
`PRÉ-CONDIÇÃO AUSENTE`.

### Por que a pausa não virou código da suíte

Chegou a ser implementada como `afterEach` em `fixtures/fixtures.js` e foi **revertida antes de
commitar**: ritmo de execução é decisão de quem roda, não propriedade do teste. Embutir uma
espera de 60s no fixture faria toda execução futura pagar o custo, inclusive as que não precisam,
e esconderia num arquivo compartilhado uma decisão que precisa ser consciente. A convenção
adotada: **quando a execução incluir destrutivos, perguntar antes se a pausa se aplica.**

### O vermelho sem veredito que apareceu, e sumiu

`CT-E2E-02-S1` reprovou com `TimeoutError: page.waitForResponse: Timeout 45000ms exceeded` — o
único da execução sem causa declarada. Era um `waitForResponse` cru esperando o
`POST .../wf_solicitacao_compras/start`: quando estoura, não diz se a SC não foi criada, se o
ambiente engasgou, ou se o widget nem chegou a enviar.

Criado `utils/espera-start.js`, que distingue os dois casos pela contagem de requisições que
saíram: **nenhuma saiu** → o widget não enviou, o problema é anterior ao servidor; **saiu e não
voltou** → o servidor não respondeu no prazo, é ambiente. Os seis pontos da suíte que esperavam
esse start foram migrados. Reexecutado, o teste volta a reprovar pela causa real:
`SC 112674: estado atual "Início" — esperando "Validação do Gestor" (bloqueado por D-01)`.

