# `test.fail()` para os testes `@bug` — decisão pendente

Este documento resolve a pendência registrada no README (seção "A tag `@bug`") e no
`CLAUDE.md`: adotar `test.fail()` nativo do Playwright para os testes que hoje reprovam de
propósito, documentando defeito de produto. Hoje são **62 testes em 36 arquivos** (medido com
`npx playwright test --grep @bug --list | tail -1`, 01/09/2026).

**Recomendação em uma linha:** não migrar os 62 testes para `test.fail()`; resolver o buraco 1
(bug corrigido passa despercebido) com um passo de CI que leia o `test-results/junit.xml` já
gerado e alerte quando um teste `@bug` passar — chega ao mesmo resultado sem o risco medido no
item 3 abaixo, que é grave e não tem mitigação dentro do próprio `test.fail()`.

Tudo que segue foi **medido em execução real**, não deduzido da documentação. O laboratório fica
fora do repositório, em `/home/dev1/.claude/jobs/ef9c0d11/tmp/lab/` (fora de `tests/`, config e
node_modules próprios, apontando para a mesma instalação do `@playwright/test` do projeto —
versão 1.62.1). Não toquei em nenhum spec real: os quatro casos de laboratório reproduzem o
mecanismo exato de `utils/massa-contratos.js` (a mesma string `PRÉ-CONDIÇÃO AUSENTE:` e o mesmo
padrão de `throw new Error(...)` antes de qualquer `expect`), e o caso com descrição estática cita
um ID de defeito real do projeto (D-10) para provar o ponto sem precisar rodar contra o Fluig.
Evitei editar specs reais porque três outros agentes estão no mesmo worktree, em arquivos
diferentes — mexer em `tests/` era risco de colisão sem necessidade, já que o laboratório
replica o mecanismo com fidelidade.

---

## 1. O que `test.fail()` faz de fato

Da documentação oficial (`https://playwright.dev/docs/api/class-test#test-fail`): *"Marks a test
as 'should fail'. Playwright runs this test and ensures that it is actually failing."* — ele
**executa** o teste (diferente de `fixme()`, que não roda) e **inverte o veredito esperado**: se o
corpo falhar, o resultado final é PASS; se o corpo passar, o resultado final é FAIL ("Expected to
fail, but passed."). Assinaturas disponíveis: `test.fail()`, `test.fail(condition, description)`,
`test.fail(callback, description)`, além das variantes que já declaram o teste inteiro
(`test.fail(title, body)`). A `description` é uma string opcional, decidida **na declaração**, e
aparece no relatório.

### Prova em execução

Quatro testes de laboratório, cada um isolando uma variável:

```js
// Caso A — test.fail() + o corpo FALHA de propósito (simula o defeito ainda existir)
test('@bug A - falha esperada, corpo falha (deveria ficar PASS no relatorio)', async () => {
  test.fail();
  expect(1).toBe(2);
});

// Caso B — test.fail() + o corpo PASSA (simula o defeito ter sido corrigido)
test('@bug B - falha esperada, corpo passa (deveria ficar FAIL no relatorio)', async () => {
  test.fail();
  expect(1).toBe(1);
});

// Caso C — baseline, sem test.fail()
test('@bug C - sem test.fail(), corpo falha (baseline, deve ficar FAIL)', async () => {
  expect(1).toBe(2);
});

// Caso D — test.fail() + um Error QUALQUER antes de qualquer expect,
// simulando literalmente utils/massa-contratos.js (mesma mensagem)
test('@bug D - falha esperada, corpo lanca Error generico (simula pre-condicao ausente)', async () => {
  test.fail();
  throw new Error('PRE-CONDICAO AUSENTE: massa nao disponivel no ambiente de laboratorio');
});
```

Saída real do reporter `list` (`npx playwright test`):

```
  ✘  1 tests/fail-basico.spec.js:28:5 › @bug D - ... (simula pre-condicao ausente) (4ms)
  ✓  3 tests/fail-outros.spec.js:5:5 › E - teste comum verde, sem bug (9ms)
  ✘  2 tests/fail-basico.spec.js:21:5 › @bug C - ... (baseline, deve ficar FAIL) (14ms)     [vermelho]
  ✓  4 tests/fail-basico.spec.js:15:5 › @bug B - ... (deveria ficar FAIL no relatorio) (12ms) [vermelho]
  ✘  5 tests/fail-basico.spec.js:7:5  › @bug A - ... (deveria ficar PASS no relatorio) (15ms)

  1) @bug B ... › Expected to fail, but passed.
  2) @bug C ... › Error: expect(received).toBe(expected) ... Expected: 2 Received: 1

  2 failed (B, C)
  3 passed (A, D, E)
```

Ponto que já salta aos olhos aqui: o símbolo `✘` (falhou) aparece **verde** nos casos A e D — o
Playwright imprime o símbolo do resultado real da execução, mas colore pelo veredito final
(PASS). É fácil ler rápido demais e achar que o teste está vermelho quando na verdade passou.

Confirmado via `--reporter=json` (o mesmo modelo de dados que alimenta o HTML):

```
@bug A ... -> expectedStatus: failed | status: failed | annotations: [{"type":"fail", ...}]
@bug D ... -> expectedStatus: failed | status: failed | annotations: [{"type":"fail", ...}]
```

`status` e `expectedStatus` são **idênticos** nos casos A e D — não há campo, em nenhum reporter,
que carregue *por que* o teste falhou. Isso é o núcleo do item 3.

### JUnit (`test-results/junit.xml`, o que o CI consome)

```xml
<testcase name="@bug A - falha esperada, corpo falha ..." classname="fail-basico.spec.js" time="0.015">
  <properties><property name="fail" value=""></property></properties>
  <system-out><![CDATA[[[ATTACHMENT|.../error-context.md]]]]></system-out>
</testcase>

<testcase name="@bug B - falha esperada, corpo passa ..." classname="fail-basico.spec.js" time="0.012">
  <properties><property name="fail" value=""></property></properties>
  <failure message="... Expected to fail, but passed." type="FAILURE">...</failure>
</testcase>

<testcase name="@bug D - falha esperada, corpo lanca Error generico ..." time="0.004">
  <properties><property name="fail" value=""></property></properties>
  <system-out><![CDATA[[[ATTACHMENT|.../error-context.md]]]]></system-out>
</testcase>
```

Um caso PASS (A ou D) não gera `<failure>` — só a propriedade `fail` (vazia, sem `description`) e
um `system-out` apontando para um anexo. **Qualquer consumidor de JUnit que conta `<failure>` para
decidir vermelho/verde (é assim que a maioria dos dashboards de CI — GitHub Actions, Jenkins,
Azure DevOps — lê JUnit) vê A e D como exatamente o mesmo evento: verde, sem detalhe.**

A mensagem real do erro (`Error: PRE-CONDICAO AUSENTE: ...` no caso D, `expect(1).toBe(2)` no caso
A) **não desaparece** — ela fica gravada no anexo `error-context.md`, dentro de
`test-results/<pasta-do-teste>/`. Mas isso é um arquivo que só se abre se alguém suspeitar de algo
— nenhum reporter a imprime por padrão para um teste que "passou". Compare com o comportamento
**hoje**, sem `test.fail()`: a mesma mensagem aparece **no bloco de falha, no terminal, no HTML e
no `<failure>` do JUnit**, por padrão, em toda execução — que é exatamente o que
`docs/estabilidade-do-ambiente.md` (escrito em paralelo por outro agente nesta mesma entrega)
descreve como o protocolo vigente do projeto para diferenciar `PRÉ-CONDIÇÃO AUSENTE` de defeito de
produto: *"o sintoma correto é ler a mensagem até o fim"*. `test.fail()` **remove esse sintoma do
caminho padrão de leitura** para os 62 testes, exatamente onde o protocolo depende dele.

Com `test.fail(true, description)` a descrição estática também não resolve isso — testei com uma
citando um defeito real (`D-10: servidor aceita tipoSolicitacao vazio`) e um `throw` genérico no
corpo: o JUnit mostrou a `description` do defeito documentado **mesmo o teste nunca tendo chegado
perto do código que exercita D-10**. A descrição é decidida na declaração, não depois de saber por
que o teste realmente falhou — ela pode literalmente mentir sobre a causa.

### Interação com `--grep` / `--grep-invert`

Neutra, como esperado — a tag é texto no título, `test.fail()` é uma chamada em runtime, os dois
não se tocam:

```
--grep-invert @bug  → só o teste comum (E), como hoje
--grep @bug          → só A, B, C, D, com o mesmo veredito PASS/FAIL de sempre
```

### Interação com `retries`

```
--grep "@bug B" --retries=2   → 3 tentativas (0, retry #1, retry #2), as 3 "passam" (bug
                                  sumiu), e AINDA ASSIM o resultado final é FAIL
--grep "@bug A" --retries=2   → 1 tentativa só. status bate com expectedStatus de cara,
                                  Playwright não tenta de novo.
```

Duas consequências práticas: (1) o caso que mais importa observar rápido — "o defeito sumiu" —é
exatamente o que **consome o orçamento de retry inteiro** em CI (`retries: 2` quando `CI=true`,
`playwright.config.js`) antes de reportar; (2) o caso comum (`@bug` continua vermelho, seja por
defeito real ou por pré-condição ausente) **nunca dispara retry**, porque `status === expectedStatus`
já bate na primeira tentativa — não há uma segunda chance de a suíte "perceber" que a causa mudou.

### Interação com `--repeat-each`

`--repeat-each=3` nos casos A e D: as 3 repetições avaliam o veredito de forma independente, todas
"passam" (6/6 verde). Funciona sem erro, mas também não ajuda a distinguir nada — se a
pré-condição estiver ausente nas 3 repetições, as 3 reportam verde do mesmo jeito que 3 repetições
do defeito real reportariam.

---

## 2. O custo da migração

`test.fail()` não conflita com `@bug` no título — são independentes (`@bug` é texto, `test.fail()`
é chamada de runtime) e **convém manter as duas** caso a migração avance: a tag continua sendo o
único jeito de filtrar (`--grep @bug`, `--grep-invert @bug`, os comandos do README), porque nada
indexa "quais testes chamam `test.fail()`" sem abrir o código.

O custo real não é "adicionar uma linha em 62 lugares". É que `test.fail()` marca o **teste
inteiro** como "deveria falhar" — não há como aplicá-lo só ao passo que exercita o defeito e
manter o passo de pré-condição como falha "de verdade". Levantei quantos dos 36 arquivos com
`@bug` chamam `utils/massa-contratos.js` (que lança `PRÉ-CONDIÇÃO AUSENTE`, ver
`utils/massa-contratos.js:247-300`) antes de chegar à assertion do defeito:

```
17 de 36 arquivos com @bug importam/usam utils/massa-contratos.js
≈ 27 dos 62 testes @bug (contagem por arquivo, proxy — nem todo teste do arquivo
  necessariamente passa pela descoberta, mas a maioria dos @destrutivo @bug passa)
```

Exemplo real, sem alterar nada — `tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:112`
(`@destrutivo @bug a SC deveria nascer atribuída ao solicitante logado...`, defeito D-01): o teste
chama `descobrirContratoVigentePequeno` (que por sua vez chama `descobrirContratoVigente`, capaz de
lançar `PRÉ-CONDIÇÃO AUSENTE` em 4 pontos diferentes — `utils/massa-contratos.js:250-293`) e só
depois faz os `expect(...).not.toBe('Usuário Integrador Fluig')` que documentam D-01. Envolver este
teste (e os ~26 parecidos) em `test.fail()` sem separar as duas fases teria exatamente o efeito do
Caso D do laboratório: se a grade de contratos cair (já aconteceu, ver
`docs/estabilidade-do-ambiente.md`, duas janelas em 31/08–01/09/2026) durante essa execução, o
teste "passa" como se D-01 estivesse sendo reproduzido — sem nunca ter chegado perto do código que
reproduz D-01.

Não existe forma nativa de fazer `test.fail()` valer só para a segunda metade do teste. As opções
seriam: (a) aceitar o risco como está (não recomendado — é o item 3); (b) reestruturar cada um dos
~27 testes para isolar a descoberta de massa fora do escopo do `test.fail()` — o que não é uma
mudança mecânica, e sim uma reescrita teste a teste, decidindo caso a caso onde a fronteira fica;
ou (c) aplicar `test.fail()` só nos ~35 testes que não dependem de `massa-contratos.js` (interceptação
de payload, datasets, API) e deixar os ~27 restantes como estão hoje — o que já é, na prática,
abandonar a ideia de "migrar os 62" e faz a suíte carregar duas convenções diferentes para o mesmo
conceito, sem ganho evidente sobre a alternativa da seção 4.

---

## 3. O risco (o ponto mais importante desta análise)

**Medido, não hipotético: `test.fail()` não distingue por que um teste falhou.** O Caso D do
laboratório é a prova — mesma mecânica do `massa-contratos.js` real, resultado idêntico ao Caso A
(defeito real) em `status`, `expectedStatus`, JUnit e reporter `list`. A única diferença sobrevive
num anexo (`error-context.md`) que ninguém abre para um teste "verde".

Isso é grave porque **inverte a polaridade da visibilidade** exatamente nos 62 testes que mais
precisam dela. Hoje, um `@bug` que falha por pré-condição ausente aparece **vermelho, com a
mensagem completa no bloco de falha** — o protocolo que `docs/estabilidade-do-ambiente.md` acabou
de formalizar ("leia a mensagem até o fim: `PRÉ-CONDIÇÃO AUSENTE` é ambiente, não é o defeito")
funciona porque a mensagem está exatamente onde alguém olha por padrão. Com `test.fail()`, o mesmo
evento vira **verde, sem mensagem visível** — a suíte reporta "ok, defeito confirmado" quando na
verdade não confirmou nada, só não teve dado para tentar.

O cenário concreto: a integração com o Protheus já caiu duas vezes em dois dias
(31/08 ~14h20–01/09 ~11h38, e 01/09 ~11h57–12h13, ambas documentadas em
`docs/estabilidade-do-ambiente.md`). Se qualquer uma dessas janelas tivesse coincidido com uma
execução de CI dos 62 `@bug` já migrados, os ~27 testes que dependem de `massa-contratos.js`
teriam reportado **verde** — silenciosamente confirmando defeitos que não foram exercitados. No dia
seguinte, se o Protheus realmente tivesse corrigido o defeito D-01, ninguém teria como diferenciar
"D-01 foi corrigido" de "a grade de contratos caiu de novo" olhando o relatório — as duas produzem
o mesmo verde, sem mensagem.

Isto não é aceitável pela regra de ouro da skill (`playwright-test-creator`): *"Se a aplicação
estiver com defeito real: o teste deve falhar e você reporta o defeito. Não ajuste o teste para
esconder o bug."* — o risco aqui é simétrico e pior: não é o teste escondendo um defeito real, é o
relatório reportando "defeito confirmado" quando o teste não rodou o suficiente para confirmar
nada. Um falso "ainda quebrado" é tão ruim quanto um falso verde: os dois fazem alguém confiar
numa leitura que a execução não sustentou.

---

## 4. A alternativa mais barata

Resolver só o buraco 1 (defeito corrigido passa despercebido) sem tocar no comportamento dos 62
testes: um passo de CI, depois de `npx playwright test` (`.github/workflows/e2e.yml`, que já gera
`test-results/junit.xml` — ver `playwright.config.js`, reporter `junit` habilitado quando `CI`),
que leia o XML e alerte quando um `<testcase>` cujo `name` contenha `@bug` **não tiver**
`<failure>`/`<error>` filho.

Por que isso funciona sem o risco da seção 3: os 62 testes continuam sendo testes comuns, sem
`test.fail()`. Continuam falhando com a mensagem completa visível, no lugar de sempre, para quem
olhar o relatório amanhã do jeito que olha hoje. O único comportamento novo é que, quando um deles
passar — pela primeira vez, por qualquer motivo, inclusive ambiente instável fazendo o defeito não
reproduzir —, alguém é avisado ativamente, em vez de a suíte engolir o verde em silêncio (que é
exatamente o buraco 1 descrito no problema). Um falso positivo do alerta (bug não realmente
corrigido, só não reproduziu numa execução) custa um humano abrir o relatório e ler — o mesmo custo
que já existe hoje para interpretar qualquer vermelho.

| | `@bug` sozinha (hoje) | `test.fail()` nos 62 | as duas juntas | alerta de CI sobre `@bug` |
|---|---|---|---|---|
| Resolve buraco 1 (bug corrigido passa despercebido) | Não | Sim | Sim | Sim |
| Preserva a mensagem de falha no caminho padrão de leitura | Sim | **Não** — vira anexo num teste "verde" | **Não** (mesmo problema) | Sim, sem mudança |
| Distingue defeito real de pré-condição ausente | N/A (o teste falha do mesmo jeito nos dois casos; a mensagem já distingue) | **Não** — medido nos Casos A/D | **Não** (mesmo problema) | N/A, mesma leitura de hoje |
| Custo de implementação | Zero | Alto — ~27 dos 62 testes exigem reestruturar a fronteira pré-condição/assertion, não só adicionar uma linha | Igual ao anterior | Baixo — um script/step de CI, zero mudança nos 62 specs |
| Risco de mascarar defeito real | Nenhum novo | **Alto** — falso "confirmado" em janela de instabilidade do Protheus (já ocorreu 2x em 2 dias) | Igual ao anterior | Nenhum novo — nunca muda o veredito do teste, só observa |
| Consome orçamento de retry do CI de propósito | N/A | Sim, exatamente no caso "bug corrigido" (2 retries extras) | Igual | Não |

---

## Recomendação explícita

**Não migrar os 62 testes `@bug` para `test.fail()`.** Implementar, em vez disso, o alerta de CI
sobre `test-results/junit.xml` (seção 4). Ele resolve o mesmo problema que motivou a pergunta —
bug corrigido passando despercebido — sem o custo de reestruturar ~27 testes e, principalmente,
sem o risco medido na seção 3: `test.fail()` comprovadamente não distingue defeito real de
pré-condição ausente, e o ambiente desta suíte já demonstrou, em dados reais de 31/08–01/09/2026
(`docs/estabilidade-do-ambiente.md`), que essa distinção não é uma preocupação teórica — a
integração com o Protheus caiu duas vezes na mesma semana em que este documento foi escrito.

Manter `@bug` como está hoje preserva a propriedade que mais importa: a mensagem de falha —
inclusive `PRÉ-CONDIÇÃO AUSENTE` — continua visível no caminho padrão de leitura do relatório, que
é o que sustenta o protocolo de `docs/estabilidade-do-ambiente.md`. `test.fail()` retira
justamente essa visibilidade nos 62 casos em que ela é mais necessária, trocando "sei por que
falhou" por "sei que falhou como esperado" — e essas duas frases deixam de significar a mesma
coisa assim que a causa muda sem que o teste saiba.

Deixo como possibilidade secundária, não recomendada agora: se o dono do ambiente decidir mesmo
assim adotar `test.fail()`, o caminho mais seguro é aplicá-lo **só** ao subconjunto dos 62 que
comprovadamente não passa por `utils/massa-contratos.js` nem por qualquer outro ponto que lance
`PRÉ-CONDIÇÃO AUSENTE` antes da assertion do defeito (a minoria, ~35 dos 62) — nunca como política
geral para os 62, e nunca sem, primeiro, o alerta de CI da seção 4 já funcionando (ele continua
necessário mesmo nesse subconjunto, porque `test.fail()` sozinho não avisa **ativamente**; ele só
reprova quando alguém já está olhando o CI).

### O que mudaria se esta recomendação for aceita

1. **Novo**: um passo em `.github/workflows/e2e.yml`, depois de "Executar a suíte", lendo
   `test-results/junit.xml` (já produzido, `playwright.config.js` já habilita o reporter `junit`
   quando `CI=true`) e falhando/alertando se algum `<testcase>` com `@bug` no `name` não tiver
   `<failure>`/`<error>`. Um script pequeno (Node, sem dependência nova — XML já é texto simples,
   dá para casar com regex ou um parser leve) chamado por esse step.
2. **Nenhuma mudança nos 62 specs.** Zero risco de regressão introduzida pela própria mudança —
   diferença central frente à migração para `test.fail()`.
3. **Nenhuma mudança em `utils/`, `factories/`, `pages/`, `README.md` ou `CLAUDE.md`** — quem
   consolidar esta entrega decide se atualiza a seção "A tag `@bug`" do README para registrar a
   decisão tomada aqui (fora do escopo desta entrega, que é só a análise).
4. Ordem sugerida: implementar o alerta de CI primeiro (baixo custo, resolve o buraco 1 hoje);
   só depois, se ainda fizer sentido, avaliar `test.fail()` caso a caso para o subconjunto seguro
   — nunca como o próximo passo automático desta decisão.
