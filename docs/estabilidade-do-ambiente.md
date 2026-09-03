# Estabilidade do ambiente — a premissa que governa a leitura de qualquer execução

## Por que este documento existe

A skill que rege esta suíte (`playwright-test-creator`) define determinismo assim: *"mesmo código
+ **ambiente controlado** + dados equivalentes = mesmo resultado"*, e lista *"Determinismo >
velocidade artificial"* na ordem de prioridade. A definição pressupõe um ambiente controlado. O
ambiente da Cassi **não é controlado** — a integração com o Protheus oscila por conta própria,
sem relação com o código da suíte — e essa premissa nunca tinha sido declarada por escrito.

A consequência prática, já paga: o mesmo teste passa e falha sem nenhuma mudança de código, e quem
lê o relatório sem saber disto conclui "a suíte está flaky". Está errado. A suíte, do lado dela, é
determinística — `docs/estado-do-gate.md` mede isso em 735 execuções. O que varia é o que ela está
observando.

Este documento declara a premissa: o que a suíte pressupõe do ambiente, o histórico medido de
quando essa premissa não se sustentou, e — o mais importante — como separar, lendo um relatório,
instabilidade de ambiente de defeito de produto e de flakiness real.

---

## O que a suíte pressupõe do ambiente

A suíte fala com dois sistemas externos ao Fluig através de datasets. Para que um resultado seja
interpretável, cada um precisa estar respondendo:

| Integração | Alimenta | Datasets envolvidos |
|---|---|---|
| **Protheus — contratos (CN9)** | grade do Portal de Acompanhamento de Contratos, descoberta de massa (`utils/massa-contratos.js`), ciclo de Faturamento, Solicitação de Compra a partir de contrato | `dsProtheus_getContratosxFornecedores_restGet` |
| **Protheus — tipos e domínios** | combos de filtro da mesma tela (tipo de contrato, situação) | `dsProtheus_getTipoContratos_restGetAll`, `dsProtheus_getCampoCombo_restGetAll` |
| **SIGAJURI (Jurídico)** | os três processos `SIGAJURI_*` (Consultivo, Contencioso, Contrato) | serviço `SIGAJURI` externo ao Fluig e ao Protheus |

Nenhuma dessas integrações é escrita pela suíte — são todas leitura (`get*_restGet[All]`), o que
está provado em `docs/criacao-de-contrato-inviavel.md`. A suíte só pode **observar** o estado em
que elas estão, nunca corrigi-lo nem contorná-lo.

Quando a linha de contratos (CN9) está de pé, a suíte tem ~840 registros para escolher massa por
afinidade de hash (`docs/criacao-de-contrato-inviavel.md`, seção "O que foi feito no lugar"). Sem
ela, `utils/massa-contratos.js` não tem o que escolher, e todo teste que depende de contrato
reprova com `PRÉ-CONDIÇÃO AUSENTE` — não porque o teste ache defeito, mas porque não há dado para
exercitar o cenário.

---

## O histórico medido

**Importante: são três ocorrências observadas em quatro dias (31/08, 01/09 e 03/09/2026), não
uma série histórica.** Não há base para estimar frequência, periodicidade ou causa a partir de
três amostras — o que segue é o que foi medido, com data, e nada além disso.

### 31/08/2026 ~14h20 até 01/09/2026 ~11h38 — contratos zerados, ~21h

`dsProtheus_getContratosxFornecedores_restGet` devolveu `{"columns":[],"values":[]}` com **HTTP
200** — lista vazia, sem erro HTTP, sem exceção. Durante essa janela a grade do Portal de
Acompanhamento de Contratos mostrou 0 contratos. Imediatamente antes e depois da janela: **842
contratos**.

**Descartada a hipótese de queda geral do ERP.** No mesmo instante em que a consulta de contratos
voltava vazia, dois outros datasets do mesmo Protheus respondiam cheios:
`dsProtheus_getTipoContratos_restGetAll` (tipos de contrato) e `dsProtheus_getCampoCombo_restGetAll`
(situações da CN9). Testado também sem filtro de fiscal e sem filtro de situação — zero em todas
as combinações. A falha era pontual daquela consulta, não do serviço.

**Capturado ao vivo por dois testes, sem nenhuma mudança de código entre as execuções:**
- `tests/e2e/seguranca/integracao-protheus-grade-contratos.spec.js:19` (`CT-INT-01-H`) — falhou 2
  vezes seguidas e passou na 3ª tentativa, ~40 minutos depois.
- `tests/e2e/contratos/ciclo-faturamento.spec.js:41` (`CT-FAT-01-H`) — falhou com a grade vazia e
  passou 55 minutos depois.

### 01/09/2026 ~11h57–12h13 — segunda queda do mesmo endpoint, ~16 min

Mesmo sintoma (`dsProtheus_getContratosxFornecedores_restGet` respondendo `values: []` com HTTP
200), mesma ausência de erro nos dois datasets vizinhos. Recuperação sozinha, sem intervenção —
~16 minutos depois a grade voltou a mostrar contratos.

### 03/09/2026 ~16h05–16h09 — terceira queda do mesmo endpoint, ~4 min

Medida durante a execução final do plano de melhoria, com a sonda (`node scripts/sonda-grade.mjs`)
a cada ~1 min: **845 · 845 · 845 · 845 · 845** entre 15h50 e 16h03 (janela saudável, em que as
seis fatias não destrutivas rodaram), depois **0 · 0 · 0 · 0** às 16h05–16h08, e **845** de novo
às 16h09, sustentado por 7 amostras seguidas até 16h15. Os dois primeiros destrutivos da
execução (`ciclo-correcao-reenvio`, `ciclo-gestor`) caíram exatamente na janela e reprovaram com
`PRÉ-CONDIÇÃO AUSENTE: a grade de contratos não retornou nenhuma linha` — foram **descartados e
reexecutados** às 16h15, quando passaram a reprovar pelo motivo real (CT-CMP-08-H e D-01).

O que esta ocorrência acrescenta ao histórico: a queda pode ser **curta** (4 min, contra 21 h e
16 min das anteriores) e cair no meio de uma execução que começou saudável. A sonda antes da
execução não basta; é a anotação `pre-condicao-ausente` de cada teste que diz se um vermelho
específico caiu na janela — e o veredito do gate (`scripts/veredito-do-gate.mjs`) já separa
esses vermelhos das regressões sem que alguém precise cruzar horários à mão.

### SIGAJURI — indisponibilidade independente, contínua

`ServiceNotFoundException: 'SIGAJURI'` — o serviço do módulo Jurídico está fora do ar
independentemente do que acontece com a consulta de contratos. Quando a consulta de contratos
voltou a responder nas duas janelas acima, o SIGAJURI **não** voltou junto. São duas
indisponibilidades de sistemas diferentes, sem relação de causa entre si — não presuma que uma
implica a outra, em nenhuma direção.

---

## Como distinguir, lendo um relatório: ambiente × produto × flaky

Esta é a parte que evita a conclusão errada. Um vermelho no relatório sempre cai em uma destas
três categorias — nunca é ambíguo se a mensagem de falha for lida até o fim:

### 1. Instabilidade de ambiente

**Sintoma no relatório:** a mensagem começa com `PRÉ-CONDIÇÃO AUSENTE`. É a convenção que a
própria suíte usa para declarar "não havia dado para exercitar o cenário" — ver a seção seguinte.

**Como confirmar:** reexecute o teste isolado agora. Se ele passa sem qualquer alteração de
código, a causa era o estado do dado no momento da primeira execução, não o teste. Se a suspeita
for a queda de contratos especificamente, confira a grade do Portal de Acompanhamento de
Contratos manualmente ou via `dsProtheus_getContratosxFornecedores_restGet` — ver o protocolo
abaixo.

**O que NÃO fazer:** não reportar como bug do produto, não reportar como teste flaky, não abrir
investigação de código. O sintoma correto é abrir (ou apontar para) o registro de indisponibilidade
do lado do ambiente — este documento é esse registro para as três ocorrências já medidas.

### 2. Defeito de produto

**Sintoma no relatório:** a mensagem cita o comportamento observado da aplicação — um estado de
workflow inesperado, um alerta que não aparece, um payload incoerente, uma mensagem de erro do
próprio Fluig ou do Protheus **diferente** de lista vazia silenciosa. Muitos desses testes são
vermelhos **de propósito** (seção "Testes vermelhos são intencionais" do `CLAUDE.md`) e citam o
defeito (`D-01`, `D-08`...) em comentário.

**Como confirmar:** o mesmo teste reprova de forma consistente, com a mesma mensagem, em execuções
sucessivas e independente do estado da grade de contratos. `docs/estado-do-gate.md` documenta o
exemplo canônico: `wf_substituicaocargos`, 8 cargas sequenciais sem concorrência, mesma resposta
do dataset nas 8 e comportamento inconsistente do formulário em 7 delas — isso é o produto, não o
ambiente nem o teste.

**O que NÃO fazer:** não "consertar" o teste para ficar verde — isso documentaria o bug como se
fosse comportamento correto.

### 3. Flakiness real da suíte

**Sintoma no relatório:** um teste que reprova sem `PRÉ-CONDIÇÃO AUSENTE`, sem mensagem de domínio
do produto, e que passa a verde numa reexecução idêntica **sem que o estado externo (grade de
contratos, SIGAJURI) tenha mudado**. É o único dos três casos em que o problema está no código do
teste — locator instável, sincronização errada, estado compartilhado entre testes.

**Como confirmar:** `docs/estado-do-gate.md` já fixou o método — `--repeat-each=3 --workers=4`,
comparando se o resultado é 3/3 no mesmo sentido. Em ambiente saudável, a suíte tem **zero**
flakiness própria medida em 735 execuções; o único falso verde encontrado (`CT-ADM-01-H`) tinha
causa raiz identificável (assertion de ausência satisfeita num poll de iframe em branco) e foi
corrigido — não ficou como "flaky conhecido".

**O que NÃO fazer:** a skill `playwright-test-creator` proíbe explicitamente aumentar timeout ou
adicionar retry para "consertar" uma falha assim, e o `playwright.config.js` limita retry a CI,
para instabilidade de infraestrutura — não para mascarar uma causa raiz não investigada. Se um
teste parece flaky, a investigação primeiro elimina as categorias 1 e 2 (isto é o que este
documento existe para permitir fazer rápido); só resta flakiness real se as duas foram descartadas.

### A regra prática para decidir rápido

```
A mensagem começa com "PRÉ-CONDIÇÃO AUSENTE"?
├─ SIM → categoria 1 (ambiente). Confirme olhando a grade agora; não investigue código.
└─ NÃO → o teste reprova de novo, sem mudança de código, com a MESMA mensagem?
    ├─ SIM → categoria 2 (defeito de produto). Veja se já está documentado como vermelho
    │        intencional (README) antes de abrir investigação nova.
    └─ NÃO, o resultado muda entre execuções idênticas → categoria 3 (flaky real).
             Investigue causa raiz: assertion → locator → estado → dados → sincronização.
```

---

## O protocolo: antes de interpretar uma execução

1. **Verifique se a grade lista contratos** antes de tratar qualquer vermelho relacionado a
   contrato como defeito ou como flaky. Duas formas, da mais rápida à mais completa:
   - Abrir o Portal de Acompanhamento de Contratos e olhar a linha *"Mostrando de 1 até N de N
     registros"*.
   - Consultar o dataset direto (mesma chamada usada em
     `docs/criacao-de-contrato-inviavel.md`): `POST /api/public/ecm/dataset/datasets` com
     `dsProtheus_getContratosxFornecedores_restGet` no corpo, via `page.evaluate` + `fetch` (não
     `page.request` — leva 403 do WAF).
2. **Aplique o critério que `CLAUDE.md` já cita para o gate**: a grade precisa **sustentar os
   ~840 registros em cinco amostras seguidas** antes de uma medição de determinismo ser
   considerada válida como medição final. Uma amostra só, mesmo que mostre 842, não basta —
   as duas quedas medidas duraram de 16 minutos a ~21 horas, e uma leitura pontual no meio de
   uma janela saudável não garante que a janela inteira foi saudável.
3. **Não meça, e não reporte, cobertura ou determinismo durante uma janela em que a grade não
   sustentou o critério acima.** Um relatório gerado durante a queda de 31/08–01/09 teria vermelhos
   reais de `PRÉ-CONDIÇÃO AUSENTE` que nenhuma mudança de código resolveria — medir "flakiness"
   nesse relatório mediria o Protheus, não a suíte.
4. **Trate SIGAJURI e contratos como independentes.** Confirmar que um voltou não é evidência
   sobre o outro — verifique cada um pelo seu próprio sintoma.

---

## O que a suíte já faz para proteger a leitura

A convenção `PRÉ-CONDIÇÃO AUSENTE` (grep em `utils/massa-contratos.js`, `utils/espera-start.js`,
`utils/captura-payload.js` e diversas specs) existe **especificamente** por causa do comportamento
medido acima: o endpoint de contratos não devolve erro quando não tem dado — devolve **HTTP 200**
com `values: []`. Sem essa convenção, uma queda do Protheus e uma grade genuinamente vazia por
regra de negócio seriam indistinguíveis no relatório, e as duas apareceriam como "o teste não
achou o que esperava" — o mesmo formato de mensagem que um defeito real de produto produziria.

A convenção separa isso na origem: quando a suíte não encontra massa para o cenário, a mensagem de
falha diz `PRÉ-CONDIÇÃO AUSENTE` em vez de descrever um sintoma de produto. É a diferença entre
"a base não tinha o que eu precisava" e "a aplicação fez algo errado com o que a base tinha" — e é
essa distinção, lida diretamente na mensagem, que torna as duas quedas medidas acima
interpretáveis como o que são (silêncio do Protheus) em vez de aparecerem como 12, 29 ou qualquer
outro número de "vermelhos sem explicação" num relatório isolado. `docs/estado-do-gate.md` mede
isto concretamente: numa execução conjunta, 29 dos 54 vermelhos eram exatamente oscilação do
Protheus rotulada como `PRÉ-CONDIÇÃO AUSENTE` — sem a convenção, teriam sido lidos como 29 falhas
de suíte.

## Ver também

- `docs/estado-do-gate.md` — as medições de determinismo do lado do teste, e a lista de vermelhos
  por causa em cada execução conjunta.
- `docs/criacao-de-contrato-inviavel.md` — por que contrato é pré-condição de leitura que a
  automação não pode criar, e como a escolha de massa foi desenhada para não depender de um
  registro específico.
- `docs/mapa-do-ambiente.md` — datasets confirmados no ambiente e os defeitos de produto já
  catalogados.
