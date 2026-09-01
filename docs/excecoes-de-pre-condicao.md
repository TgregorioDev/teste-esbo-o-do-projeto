# Exceções formais de pré-condição

## Por que este documento existe

A skill `playwright-test-creator` proíbe, sem meio-termo, dependência de ordem entre testes e
qualquer forma de skip: *"cada teste monta seus próprios pré-requisitos"*. Ela abre exatamente
**uma** saída para quando isso não é possível: *"implementar o cenário, ou tratar como exceção
formal documentada e temporária"*.

Este projeto tem casos que não cabem em "implementar o cenário" — a automação não tem caminho de
escrita para fabricar a massa que eles precisam (prova em
[`docs/criacao-de-contrato-inviavel.md`](criacao-de-contrato-inviavel.md)) ou dependem de um
serviço de terceiro que está fora do ar. Até agora esses casos estavam documentados **em prosa**,
espalhados em comentário de spec e mensagem de `PRÉ-CONDIÇÃO AUSENTE` — o que prova que a exceção
existe, mas não a torna **formal**: sem dono, sem motivo padronizado, sem data de revisão, ela não
é rastreável como dívida — é só um vermelho que alguém precisa reaprender a explicar toda vez que
aparece no relatório.

Este documento é o registro formal. Cada entrada tem: o teste e o ID do catálogo, a pré-condição
que falta, a evidência de que ela não é alcançável pela automação (ou "não verificado", quando não
há prova — ver a nota abaixo), quem destrava, uma data de revisão e o que muda quando a exceção for
resolvida.

**Regra de honestidade que este documento segue** (`CLAUDE.md` já paga o preço de não seguir isto
uma vez: *"o documento de casos afirmava que processos de RH eram barrados e, medindo, cinco de
seis processos abriam normalmente"*): nenhuma linha abaixo classifica um caso como inalcançável
sem citar a evidência que prova isso. Onde a evidência não existe ainda, a linha diz **"não
verificado"** — é mais útil do que uma afirmação sem prova, e foi exatamente essa disciplina que,
nesta própria investigação, corrigiu um dos dez casos recebidos (ver a nota na exceção 10).

**Datas de revisão são propostas, não decisão.** Nenhuma tem critério técnico único e objetivo
para "quando revisar" — são a estimativa de quem escreveu este documento, **a confirmar com o dono
do ambiente**. Uma exceção sem data de revisão é uma exceção permanente por omissão, que é
precisamente o que a skill proíbe ao exigir "temporária"; por isso toda linha tem uma, mesmo
sabendo que pode estar errada.

---

## Resumo

| # | Categoria | Teste | Catálogo | Estado |
|---|---|---|---|---|
| 1 | Massa de contrato rara | `tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:513` | `CT-ACC-06-S2` | ✅ exceção confirmada |
| 2 | Massa de contrato rara | `tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js:161` | `CT-ACC-06-S1` | ✅ exceção confirmada |
| 3 | Massa de contrato rara | `tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js:206` | `CT-ACC-06-S1` | ✅ exceção confirmada |
| 4 | Massa de contrato rara | `tests/e2e/contratos/validacoes-faturamento.spec.js:79` | `CT-FAT-02-S2` | ✅ exceção confirmada (evidência parcial — ver nota) |
| 5 | Fila vazia | `tests/e2e/compras/ciclo-cotacao.spec.js:168` | `CT-COT-01-H` | 🟡 em verificação |
| 6 | Fila vazia | `tests/e2e/compras/negociacao-proposta.spec.js:131` | `CT-NEG-01-H` | 🟡 em verificação |
| 7 | Fila vazia | `tests/e2e/contratos/validacoes-faturamento.spec.js:254` | `CT-FAT-02-S3` | 🟡 em verificação |
| 8 | Fila vazia | `tests/e2e/tarefas/assumir-tarefa-pool.spec.js:34` | `CT-TSK-02-H` | 🟡 em verificação |
| 9 | Serviço externo fora | `tests/e2e/juridico/sigajuri-consultivo.spec.js:48` | `CT-JUR-01-H` | ✅ exceção confirmada |
| 10 | Serviço externo fora | `tests/e2e/juridico/sigajuri-contrato.spec.js:32` *(corrigido — ver nota)* | `CT-JUR-03-H` | ✅ exceção confirmada |

---

## Correção ao levantamento recebido — leia antes do resto

O caso 10 chegou apontado para `tests/e2e/juridico/sigajuri-contencioso.spec.js:113`, como o
segundo teste bloqueado por SIGAJURI fora do ar. **Verificado e refutado.** O docstring do
próprio arquivo, escrito em campo, diz o oposto do que se presumia:

> *"Diferente dos outros três processos SIGAJURI, este formulário é FUNCIONAL: `UF`, `Responsável
> pela Demanda`... e `Tipo da Consulta` vêm populados com valores reais — nenhum
> `ServiceNotFoundException` aqui. Confirmado em campo: submeter com dados válidos responde `200
> OK`... processo criado de verdade"* (`sigajuri-contencioso.spec.js:78-83`).

O teste em `sigajuri-contencioso.spec.js:113` (`CT-JUR-04-H`/`CT-JUR-06-H`) não só não é
bloqueado: é `@destrutivo`, cria um processo real e verifica o roteamento pelo pool
`GRUPO_GEJUR_9`, medido ao vivo na instância 112737. Marcá-lo como exceção de pré-condição
documentaria um bloqueio que não existe.

O caso real de "SIGAJURI fora do ar" no processo de Contrato está em
`tests/e2e/juridico/sigajuri-contrato.spec.js:32` (`CT-JUR-03-H`), cujo próprio docstring
(linhas 12-16) descreve o **mesmo defeito D-JUR-01** do Consultivo: `Filial`, `Área Solicitante` e
`Tipo Contrato` nascem com uma única opção — o texto de
`ServiceNotFoundException: Não foi possível encontrar o serviço 'SIGAJURI'`. É esse teste que
substitui o caso 10 na tabela acima. A entrada abaixo já reflete a correção.

Isto é exatamente o padrão que o `CLAUDE.md` já registra uma vez com RH: "verificado, não
presumido" — e a mesma checagem, feita aqui, mudou o resultado.

---

## 1–4. Massa de contrato com característica rara

Pré-condição comum às quatro: um contrato vigente com uma característica específica de itens ou
de competência de medição precisa existir na base do Protheus **no momento da execução**. Nenhuma
delas é fabricável pela automação — a prova geral está em
[`docs/criacao-de-contrato-inviavel.md`](criacao-de-contrato-inviavel.md): o contrato é uma linha
da tabela CN9 do Protheus; os 19 datasets do ERP expostos ao portal são todos `get*`/leitura; 20
nomes plausíveis de dataset de escrita foram probados e nenhum existe; nenhum dos 34 processos
publicados do Fluig cria ou revisa contrato; e mesmo que existisse uma via de escrita, um contrato
recém-incluído nasce "Em elaboração" e só vira "Vigente" (ou entra em revisão, no caso do item 4)
depois de um gestor humano aprovar — não há atalho de API para isso a partir do Fluig.

O que muda entre os quatro casos é **qual característica**, e o quanto essa característica já foi
medida como rara versus apenas comprovadamente fora de alcance.

### 1. `CT-ACC-06-S2` — item de serviço com `CNB_QUANT` vazio e `CNB_QTDORI` preenchido

**Teste:** `tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:513`

**Pré-condição ausente:** um contrato vigente com ao menos um item de serviço em que `CNB_QUANT`
(quantidade) venha vazio do Protheus e `CNB_QTDORI` (quantidade original) venha preenchido — a
combinação que exercita a cascata `CNB_QUANT → CNB_QTDORI → CNB_QTRDRZ → 1 (serviços)` descrita no
catálogo (`docs/catalogo-casos.md:1108`, massa de referência **M4** — contrato
`000000000000002`, filial `4101`, revisão `001`).

**Por que não é alcançável pela automação:** a busca de campo é feita em tempo de execução, por
característica (`descobrirContratoComCascataDeQuantidade`, no próprio spec) — a automação não fixa
um número de contrato porque contrato pode ser finalizado/revisado a qualquer momento. **Medido:
15 tentativas consecutivas, sem sucesso**, sobre a amostra disponível no momento da última
verificação (comentário no próprio teste, `criacao-solicitacao.spec.js:474-491`). Combinado com a
prova geral acima (automação não escreve em CN9), a característica só existe se já estiver
presente em algum dos contratos que o Protheus mantém — e a amostra testada não a continha.

**Quem destrava:** o cliente (dono do ambiente Cassi), garantindo que a base de homologação inclua
ao menos um contrato de serviço vigente com essa combinação de campos — via inclusão/edição real
no Protheus, fora do alcance desta automação.

**Data de revisão proposta:** 01/10/2026 — a confirmar com o dono do ambiente. Trinta dias porque
a única forma de destravar é um cadastro humano no ERP, que compete a outro time.

**O que muda quando destravar:** o teste deixa de reportar `PRÉ-CONDIÇÃO AUSENTE` e passa a
afirmar de fato as duas exigências do catálogo — que a quantidade resolve pela cascata e que o
item não nasce valendo R$ 1,00 quando o contrato tem valor relevante. Hoje ele é guarda de
regressão só quando a massa aparece; sem massa, não roda o cenário nenhuma vez.

**Estado atual:** exceção confirmada.

---

### 2. `CT-ACC-06-S1` — item-fantasma de quantidade 1 repetindo o total de outro item

**Teste:** `tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js:161`

**Pré-condição ausente:** um contrato vigente que traga, no payload de start, **pelo menos dois
itens**, sendo um deles de quantidade exatamente 1 — a forma que permite ao "item-fantasma" (item
de qtd=1 replicando o valor total de outro item, sintoma do defeito D-02) existir ou não existir.

**Por que não é alcançável pela automação:** mesma prova geral — o conjunto de itens de um
contrato vem de leitura pura do Protheus (planilha/rateio da CN9), sem via de escrita. A seleção de
contrato passou a ser distribuída por hash entre os vigentes da base
(`docs/criacao-de-contrato-inviavel.md`, seção "O que foi feito no lugar") exatamente para não
prender a suíte a um único registro, mas isso tem um efeito colateral aceito e declarado no
próprio teste (`payload-solicitacao.spec.js:186-189`): a amostra sorteada pode não ter a
combinação de quantidades exigida por este caso específico, e "sem um item de quantidade 1, ou com
um único item no payload, o cenário é inalcançável". Não há medição numérica de frequência
registrada no código para este caso específico (diferente do caso 1, que tem "15 tentativas"
citadas) — o que está confirmado é o mecanismo e a impossibilidade de forçar a característica.

**Quem destrava:** o cliente, mantendo na base contratos vigentes com múltiplos itens de
quantidades variadas (incluindo algum de quantidade 1) — cadastro/edição no Protheus, fora do
alcance desta automação.

**Data de revisão proposta:** 01/10/2026 — a confirmar com o dono do ambiente, mesmo prazo do
caso 1 pelo mesmo motivo (depende de cadastro humano no ERP).

**O que muda quando destravar:** o teste passa a exercitar a checagem de item-fantasma de fato —
hoje ele só chega a essa checagem quando a amostra sorteada calha de conter a combinação.

**Estado atual:** exceção confirmada.

---

### 3. `CT-ACC-06-S1` — contrato precisa trazer itens no payload

**Teste:** `tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js:206`

**Pré-condição ausente:** este teste tem duas camadas de pré-condição, e é importante não
confundi-las.

A camada **de fundo**, compartilhada por todo teste que usa `capturarEnvioSolicitacao` +
`aguardarPayload` (não só este arquivo), é que o contrato sorteado precise ter itens de planilha
**e** rateio — sem isso o widget corretamente não dispara o `POST .../start`, e a captura nunca
recebe payload. A camada **local** deste teste específico (linha 232) exige mais que isso: pelo
menos duas assinaturas distintas de quantidade/preço entre os itens, para que uma coincidência de
total possa ser evidência do defeito D-02.

**Por que não é alcançável pela automação:** para a camada de fundo, há evidência de campo direta,
citada no próprio código-base (`utils/captura-payload.js:113-116`, não editado por esta entrega):
*"o contrato `00044-2023-5303` traz 1 item de planilha mas ZERO produtos e ZERO rateios, o modal
renderiza nenhum item, e o widget CORRETAMENTE não envia"*. Isto é comportamento correto do
produto (mesma conclusão que `indisponibilidade-protheus.spec.js` documenta para o caso geral de
contrato sem itens elegíveis, `CT-ACC-04-S2`), não defeito — e é exatamente o tipo de contrato que
existe na base ao lado dos que têm itens completos. Como a seleção de massa é por afinidade de
hash sobre TODOS os vigentes, a automação não escolhe evitar esse tipo de contrato — só descobre
em tempo de execução se calhou nele. Para a camada local (duas assinaturas distintas), vale a
mesma prova de leitura-pura de CN9 do caso 2.

**Quem destrava:** o cliente. Duas frentes possíveis, não mutuamente exclusivas: (a) garantir que
a distribuição de contratos vigentes tenha uma proporção suficiente de contratos com planilha e
rateio completos, de modo que a amostragem por hash raramente calhe num contrato vazio como o
`00044-2023-5303`; (b) se o objetivo fosse eliminar a variabilidade por completo, seria necessário
que a suíte pudesse excluir contratos "vazios" de antemão — o que exigiria um novo critério de
descoberta em `utils/massa-contratos.js` (aí sim, "nós implementando"), não coberto por esta
entrega.

**Data de revisão proposta:** 01/10/2026 — a confirmar com o dono do ambiente. Mesma janela dos
casos 1 e 2; se a proporção de contratos vazios na base for alta o suficiente para tornar este
teste cronicamente `PRÉ-CONDIÇÃO AUSENTE`, a revisão deveria também considerar a opção (b) acima.

**O que muda quando destravar:** com um contrato de itens completos e ao menos duas assinaturas
distintas de quantidade/preço, o teste passa a comparar totais de fato — hoje ele só chega lá
quando a amostra sorteada serve.

**Estado atual:** exceção confirmada.

---

### 4. `CT-FAT-02-S2` — competência de medição recusada pelo Protheus

**Teste:** `tests/e2e/contratos/validacoes-faturamento.spec.js:79`

**Correção ao enunciado recebido:** o levantamento original descrevia a pré-condição como
"competência com saldo a medir". **Verificado e é o oposto**: lendo o teste (linhas 96-172), a
pré-condição real é uma competência que o Protheus **recuse** medir — resposta
`{"STATUS":"ERROR", ...}` do dataset `ds_fatcon_get_info_medicoes`, com mensagem de negócio tipo
*"Existe revisão pendente de aprovação para este contrato, não é permitido medir contratos em
revisão"* (`utils/massa-medicao.js:22-24`). Uma competência com saldo aberto normal não serve a
este caso — serve ao caso 4 do próprio catálogo por outra via (`CT-FAT-02-S3`/`S4`, categoria
"fila vazia" abaixo, que usam `encontrarMedicaoComSaldo`, uma função diferente).

**Pré-condição ausente:** ao menos um dos contratos vigentes amostrados (até 4, por
`descobrirContratosVigentes`) precisa ter, no momento da execução, uma competência de medição que
o Protheus recuse.

**Por que não é alcançável pela automação:** a mesma prova geral de leitura-pura de CN9 se aplica
— "competência em revisão" é estado do contrato no Protheus, sem via de escrita da automação para
provocá-lo. Diferente do caso 1, **não há aqui uma medição de frequência registrada** (tipo "N
tentativas sem achar") — o que está confirmado é o mecanismo de descoberta (`massa-medicao.js`,
consulta direta a dois datasets, sem navegar, ~0,7s por contrato) e a mensagem de
`PRÉ-CONDIÇÃO AUSENTE` que dispara quando os 4 contratos amostrados vêm todos liberados. Frequência
real de contratos com competência bloqueada na base **não verificado** nesta entrega — marcar como
"raro" seria presumir, não medir.

**Quem destrava:** o cliente, ou a passagem do tempo natural do ciclo de revisão de contratos no
Protheus (contratos entram e saem de revisão como parte do processo normal do ERP) — não é um
cadastro pontual como nos casos 1-3, é um estado transitório que pode ou não estar presente.

**Data de revisão proposta:** 01/10/2026 — mesma janela, mas com uma ressalva: como o estado é
transitório (não depende de um cadastro único), vale medir a frequência real antes dessa data —
rodar a descoberta isolada (`descobrirCompetenciaBloqueada`) algumas vezes ao longo de setembro e
registrar quantas vezes achou, para transformar "não verificado" em número.

**O que muda quando destravar:** nada muda estruturalmente — este teste já roda toda execução e
já é vermelho **de propósito** quando encontra o caso (documenta o defeito de UI que engole a
recusa do Protheus em silêncio, tabela de defeitos do README). "Destravar" aqui significa apenas
"a amostra encontrou o estado" — a diferença entre `PRÉ-CONDIÇÃO AUSENTE` e o teste efetivamente
rodar e (esperadamente) reprovar por D-04.

**Estado atual:** exceção confirmada (mecanismo e ausência de via de escrita), evidência de
frequência **não verificada**.

---

## 5–8. Fila vazia (Portal do Comprador / Central de Tarefas)

**Status coletivo: em verificação — não fechar como exceção definitiva.** No momento em que este
documento foi escrito, outro agente está medindo, ao vivo, se a suíte consegue produzir a massa
que faltaria a estes quatro casos (por exemplo, se rodar o ciclo completo de Compras até a etapa
de Cotação/Negociação alimenta as filas que estes testes leem). Registrar aqui como "exceção
confirmada" antes desse veredito repetiria o erro que este próprio documento corrige no caso 10 —
afirmar bloqueio sem medir. As quatro entradas abaixo deixam a estrutura pronta (teste, catálogo,
o que falta, quem destravaria em cada hipótese) para serem fechadas assim que o veredito chegar.

### 5. `CT-COT-01-H` — fila de "Controle De Cotações" vazia

**Teste:** `tests/e2e/compras/ciclo-cotacao.spec.js:168`

**Pré-condição ausente:** ao menos uma cotação real na fila "Controle De Cotações" do Portal do
Comprador, para validar/reprovar uma cotação de verdade (em vez do formulário avulso
`wf_cotacao_produtos_servicos`, testado à parte como shell fora de contexto).

**Por que não é alcançável pela automação — hoje:** confirmado ao vivo (comentário no teste,
`ciclo-cotacao.spec.js:180-181`) que esta sub-tela não expõe "Atuar como" — não há delegação para
tentar antes de concluir que a fila está vazia. O que **não está verificado ainda** é se a fila
fica vazia porque nada no ciclo real de Compras chega a essa etapa a partir da conta desta
automação, ou porque a automação simplesmente não executou o ciclo completo (SC → cotação →
negociação) recentemente o bastante para popular a fila. É essa segunda hipótese que a
investigação em andamento está medindo.

**Quem destrava — a definir pelo veredito:** se o ciclo completo de Compras alimentar a fila real
ao rodar, destrava **nós implementando** (encadear o teste ao ciclo já existente em
`ciclo-solicitacao-compras.spec.js`/`ciclo-comprador.spec.js`). Se a fila depender de um passo
fora do alcance da automação (ex.: fornecedor real lançando proposta), destrava o **cliente**
(processo operacional, fora do Fluig) ou fica como limite permanente, a redigir como tal quando o
veredito chegar.

**Data de revisão proposta:** 08/09/2026 — prazo curto porque a investigação já está em curso;
reavaliar assim que o resultado dela estiver disponível e, se não houver resposta até essa data,
reabrir esta linha com nova data em vez de deixá-la vencer em silêncio.

**O que muda quando destravar:** o teste passa a validar/reprovar uma cotação real, cobrindo o
caminho feliz e negativo de `CT-COT-01-H`/`S1` fora do shell avulso.

**Estado atual:** em verificação.

---

### 6. `CT-NEG-01-H` — fila de "Avaliação de Propostas" vazia

**Teste:** `tests/e2e/compras/negociacao-proposta.spec.js:131`

**Pré-condição ausente:** ao menos uma proposta de fornecedor real na fila "Avaliação de
Propostas", para aprovar/reprovar de verdade (em vez do shell avulso testado à parte).

**Por que não é alcançável pela automação — hoje:** mesma classe do caso 5 — a fila lida em
`negociacao-proposta.spec.js:131-140` está vazia no momento observado. Não verificado ainda se
isso é limite estrutural (precisa de proposta lançada por um fornecedor real, fora do alcance —
`docs/politica-de-escrita.md` já lista "credencial de fornecedor externo" como bloqueio conhecido)
ou consequência de o ciclo de Cotação (caso 5) nunca ter avançado a ponto de gerar proposta a
avaliar. As duas filas são etapas adjacentes do mesmo ciclo (Cotação → Negociação), e é provável
que o veredito de uma informe o da outra — por isso ambas entram na mesma investigação em
andamento.

**Quem destrava — a definir pelo veredito:** se depender de proposta de fornecedor real,
**cliente** (ou é limite permanente — Portal do Fornecedor exige credencial que não existe em
homologação, `docs/politica-de-escrita.md`). Se depender só de rodar o ciclo interno até essa
etapa, **nós implementando**.

**Data de revisão proposta:** 08/09/2026 — mesma janela do caso 5, pela mesma dependência.

**O que muda quando destravar:** o teste passa a validar/reprovar uma proposta real de
`CT-NEG-01-H`/`S1`/`S2`.

**Estado atual:** em verificação.

---

### 7. `CT-FAT-02-S3` — pool de tarefas de Fiscal/CSE/Medição vazio

**Teste:** `tests/e2e/contratos/validacoes-faturamento.spec.js:254`

**Pré-condição ausente:** o menu "Mais opções" da Central de Tarefas de Compras precisa oferecer
"Tarefas em pool" para que o teste consiga LER se existe algum grupo relacionado a
Fiscal/CSE/Medição de Contrato — hoje ele às vezes não oferece, porque **o usuário está sem
nenhuma tarefa em pool naquele momento**, e o painel só renderiza quando há ao menos uma
(`validacoes-faturamento.spec.js:287-291`).

**Por que não é alcançável pela automação — hoje:** o teste já distingue "não consegui ler o pool"
de "li o pool e não achei o grupo" — é a diferença entre esta pré-condição ausente e a assertion
de negócio que o teste faz quando consegue ler (`grupos.length > 0` e nenhum bate
Fiscal/CSE/Medição). O que fica vazio é o pool de tarefas **em geral** do usuário TOTVS-FS, que
outros testes desta mesma suíte populam e esvaziam ao longo de uma execução (ex.:
`assumir-tarefa-pool.spec.js`, caso 8 abaixo). Não verificado se isso é regra de negócio (o
usuário genuinamente não pertence a nenhum grupo com tarefas de pool na maior parte do tempo) ou
efeito de quando, na execução, este teste específico roda em relação aos que consomem pool — é
essa dependência de estado compartilhado entre pools que a investigação em andamento está
avaliando.

**Quem destrava — a definir pelo veredito:** se for timing entre testes da mesma suíte, é questão
de desenho de teste, **nós implementando** (ex.: não depender do estado do pool geral, e sim medir
diretamente se existe grupo de Fiscal/CSE, por outro caminho que não a UI de "Mais opções"). Se for
ausência genuína de vínculo do usuário a esses grupos, é o **cliente** quem decide se deveria
existir tal vínculo — pergunta já registrada como aberta no README ("Perguntas em aberto para a
Cassi", item de segregação).

**Data de revisão proposta:** 08/09/2026 — mesma janela dos casos 5 e 6.

**O que muda quando destravar:** nada na assertion de negócio muda — o teste já teria seu
resultado de qualquer forma. O que se resolve é a variabilidade artificial da mensagem
`PRÉ-CONDIÇÃO AUSENTE`, que hoje trava a leitura e não a assertion de fato.

**Estado atual:** em verificação.

---

### 8. `CT-TSK-02-H` — pool geral de tarefas vazio

**Teste:** `tests/e2e/tarefas/assumir-tarefa-pool.spec.js:34`

**Pré-condição ausente:** ao menos uma tarefa disponível em algum grupo de pool do usuário
TOTVS-FS ("Validação do Gestor Imediato" ou "Validação dos Compradores", conforme o docstring do
próprio spec) no momento da execução — sem isso o "Resumo de Tarefas" anuncia "Tarefas em pool
(0)" e não há o que assumir.

**Por que não é alcançável pela automação — hoje:** a pré-condição é **de leitura**, por desenho
explícito do teste (docstring, linhas 14-16): *"o teste não pode inventar massa"*. O pool se
alimenta de solicitações que avançaram até a etapa de Validação do Gestor/Compradores vindas de
QUALQUER origem (não só desta suíte) — inclusive de outras execuções da própria suíte, já que ela
roda `@destrutivo` na execução padrão e cria SCs de verdade (`CT-CMP-01-H` e outros). Não
verificado se a suíte, ao criar SCs reais no seu próprio ciclo, alimenta esse pool de forma
suficiente e confiável para nunca ficar vazia — é justamente essa pergunta que a investigação em
andamento está respondendo (se a suíte consegue "criar a própria massa" de tarefa de pool
encadeando o ciclo de Compras, ou se depende de volume externo).

**Quem destrava — a definir pelo veredito:** se o próprio ciclo de Compras da suíte alimentar o
pool de forma confiável, **nós implementando** (ex.: rodar antes um teste do ciclo que garanta uma
SC parada em Validação do Gestor, sem violar isolamento entre testes — a se desenhar). Se depender
de volume de terceiros ou de timing entre execuções fora do controle de um teste isolado, é
**cliente**/operação — mantendo o pool populado como parte do uso normal do ambiente de
homologação.

**Data de revisão proposta:** 08/09/2026 — mesma janela dos casos 5-7; os quatro casos de fila
vazia compartilham a mesma investigação em andamento e deveriam ser revisados juntos.

**O que muda quando destravar:** o teste passa a assumir uma tarefa real de pool e mover para
"Tarefas a concluir" — hoje ele só chega lá quando o pool não está vazio no instante da execução.

**Estado atual:** em verificação.

---

## 9–10. Serviço externo SIGAJURI fora do ar

Pré-condição comum: o serviço "SIGAJURI", que alimenta os combos de `Filial`/`Área
Solicitante`/`Tipo Consulta`/`Tipo Contrato` dos três processos jurídicos, está fora do ar —
`com.totvs.technology.foundation.dataservice.exception.ServiceNotFoundException: Não foi possível
encontrar o serviço 'SIGAJURI'`. É um sistema **distinto** do Protheus: quando o endpoint de
contratos (CN9) voltou a responder depois da queda medida em
[`docs/estabilidade-do-ambiente.md`](estabilidade-do-ambiente.md), o SIGAJURI **não** voltou junto
— o próprio documento registra as duas indisponibilidades como independentes, sem relação de causa
entre si.

Diferente das exceções 1-8, esta não é ausência de **massa** — é ausência de **serviço**. A
automação não tem nenhum caminho, por mais indireto, de restabelecer um serviço externo ao Fluig e
ao Protheus. Por isso os dois testes abaixo já estão hoje escritos como vermelho **intencional**
(tag `@bug`, defeito `D-JUR-01` no README) em vez de lançar `PRÉ-CONDIÇÃO AUSENTE` — a diferença de
convenção em relação aos casos 1-8 é proposital: o time decidiu, ao escrever estes testes, que
"combo alimentado por serviço externo indisponível, sem opções reais" é observável e estável o
bastante para ser tratado como defeito documentado, não como pré-condição transitória. Este
documento não muda essa convenção — só formaliza a exceção por trás dela.

### 9. `CT-JUR-01-H` — Consultivo, combos de Área/Tipo Consulta sem opções reais

**Teste:** `tests/e2e/juridico/sigajuri-consultivo.spec.js:48`

**Pré-condição ausente:** o serviço SIGAJURI precisa responder para que `Tipo Consulta` e
`Filial` ofereçam opções reais (hoje oferecem uma única opção: o texto do erro).

**Por que não é alcançável pela automação:** evidência de campo no próprio docstring
(`sigajuri-consultivo.spec.js:19-24`) — reproduzido com QUALQUER valor de `Área Solicitante`, a
única combo com opções reais deste formulário; a falha "não muda com a área", confirmando que é o
serviço, não uma configuração pontual de uma área específica. O clique em Enviar chega a
`POST .../workflowView/send` e o servidor responde 500 porque a etapa BPM não consegue determinar
responsável a partir de campos que nunca chegam a ter valor. Não há ação possível do lado do Fluig
ou do Protheus para contornar isso — é um terceiro serviço.

**Quem destrava:** TOTVS, restabelecendo o serviço SIGAJURI (ou reconfigurando a integração, se o
problema for de configuração do lado deles) — fora do alcance do time Cassi e desta automação.

**Data de revisão proposta:** 30/09/2026 — a confirmar com quem tem visibilidade do lado da TOTVS
sobre a causa e o prazo de restabelecimento; um mês é estimativa sem informação de causa raiz.

**O que muda quando destravar:** os dois testes hoje `@bug` (este e o caso 10) passam a exercitar
o caminho feliz real do Consultivo/Contrato — criação de processo, roteamento a advogado/aprovador
e (para o Contrato) geração de minuta — em vez de documentar a ausência de opções nos combos.

**Estado atual:** exceção confirmada.

---

### 10. `CT-JUR-03-H` — Contrato (geração de minuta), combos de Filial/Área/Tipo Contrato sem opções reais

**Teste:** `tests/e2e/juridico/sigajuri-contrato.spec.js:32` — **substitui**
`sigajuri-contencioso.spec.js:113`, apontado no levantamento original; ver a seção "Correção ao
levantamento recebido" no topo deste documento para a evidência da correção.

**Pré-condição ausente:** mesma do caso 9 — o serviço SIGAJURI precisa responder para que
`Filial`, `Área Solicitante` e `Tipo Contrato` ofereçam opções reais.

**Por que não é alcançável pela automação:** evidência de campo no próprio docstring
(`sigajuri-contrato.spec.js:12-24`) — mesmo defeito D-JUR-01 do Consultivo, confirmado nos três
combos deste formulário. Aqui o Enviar nasce `disabled` por uma segunda camada de validação
client-side (bloco "Envolvidos"), o que na prática impede até de saber se preencher "Envolvidos"
sozinho bastaria — não há como escolher um `Tipo Contrato` válido para chegar lá. `CT-JUR-03-S1`
(Enviar desabilitado sem dados obrigatórios) já está coberto como caminho negativo válido, porque
não depende do SIGAJURI para ser demonstrado.

**Quem destrava:** TOTVS — mesmo serviço do caso 9, mesma dependência externa.

**Data de revisão proposta:** 30/09/2026 — mesma janela do caso 9; os dois deveriam ser revistos
juntos, já que dependem do mesmo serviço.

**O que muda quando destravar:** o teste deixa de ser `@bug` e passa a exercitar
`CT-JUR-03-H` de verdade — montar minuta preenchendo Filial e Tipo Contrato reais.

**Estado atual:** exceção confirmada.

---

## Como manter este documento vivo

- **Toda data de revisão vencida sem reavaliação vira pergunta para o dono do ambiente**, não
  motivo para apagar a linha em silêncio. Uma exceção que passou da data proposta e ninguém
  reavaliou é o sintoma exato que a skill quis evitar ao exigir "temporária".
- **As quatro linhas "em verificação" (5-8) precisam ser fechadas** — para "exceção confirmada"
  (com a evidência que faltar) ou para "não é mais exceção" (se a investigação em andamento provar
  que a suíte consegue montar a própria massa) — assim que o veredito da investigação em paralelo
  estiver disponível. Não usar este documento para declarar esse veredito antes dele existir.
- **Este documento não substitui a mensagem `PRÉ-CONDIÇÃO AUSENTE` no relatório** — ele é o
  registro formal por trás dela. A mensagem no teste continua sendo a fonte imediata de por que um
  vermelho específico aconteceu numa execução específica; este documento é o porquê estrutural, com
  dono e prazo.
