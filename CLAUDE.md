# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Suíte de testes E2E do **TOTVS Fluig da Cassi** (Playwright + JavaScript). A suíte é software de
produção: arquitetura, isolamento, paralelismo e observabilidade valem aqui como valem na aplicação.

---

## Comandos

> **Execução é sempre em PRIMEIRO PLANO.** Nunca mande a suíte para segundo plano, nunca use
> Monitor, nunca encerre o turno "aguardando notificação" — o turno acaba antes do processo e a
> espera nunca chega. Se uma execução estourar o limite de tempo da ferramenta, **fatie**: um
> arquivo de spec por vez, ou um teste por vez com `-g "trecho do título"`. Muitas execuções
> curtas e síncronas valem mais que uma longa em background. Demorar é aceitável; entregar sem
> execução comprovada não é.


```bash
npm ci && npx playwright install chromium
cp .env.example .env.test          # preencher; NUNCA commitar

npm test                            # suíte completa (ambos os projetos)
npm run test:auth                   # projeto "autenticacao" (sem storageState)
npm run test:e2e                    # projeto "e2e" (com storageState)
npm run typecheck                   # tsc --noEmit -p jsconfig.json
npm run report                      # abre o relatório HTML da última execução

npx playwright test tests/e2e/plataforma/home.spec.js          # um arquivo
npx playwright test -g "trecho do título do teste"             # um teste
npx playwright test --repeat-each=3 --workers=4                # determinismo
FAKER_SEED=<valor> npx playwright test                         # reproduz a massa de uma execução
PULAR_DESTRUTIVOS=1 npx playwright test                         # regressão rápida, sem gerar massa
```

Antes de afirmar que um teste falha por defeito, rode `node --check <arquivo>` — um erro de
sintaxe faz o Playwright reportar "No tests found", que é fácil confundir com filtro errado.

---

## Regra que governa todo o resto: escrita é esperada, mas rastreável

O alvo é uma **base de homologação** da Cassi, mantida para validar implementações — não é usada
pelo cliente. Criar, movimentar e aprovar registros é autorizado e é o propósito do ambiente.
`docs/politica-de-escrita.md` é a fonte da verdade sobre isto.

O que se exige em troca:

- **Todo dado escrito nasce identificável**: prefixo `QA` + sufixo único, vindo de `factories/*`.
  Registro criado no Fluig/Protheus em geral não tem exclusão disponível, então a rastreabilidade
  é o que permite higienizar depois.
- **Cada teste cria a própria massa** — nada de reaproveitar registro de outro teste ou depender
  de ordem. Contrato é a exceção **verificada**: não há como a automação criá-lo, e a prova está
  em `docs/criacao-de-contrato-inviavel.md`. Ele é **descoberto em tempo de execução**
  (`utils/massa-contratos.js`), nunca fixado em `.env` — e desde 30/08/2026 a escolha é
  **distribuída entre os 554 vigentes da base** e reservada por teste, de modo que nenhum
  registro específico é ponto único de falha.
- **Cenário que escreve leva a tag `@destrutivo`** — mas **roda na execução padrão**. Decisão do
  dono do ambiente (25/08/2026): *"sempre rode tudo, não me importa se serão testes destrutivos, a
  base de testes é pra isso"*. A tag serve para mirar (`--grep @destrutivo`) e para a regressão
  rápida de quem não quer gerar massa (`PULAR_DESTRUTIVOS=1`), nunca para encolher a medição.
  **Não reporte cobertura medindo só a execução sem destrutivos** — foi assim que 34 testes
  ficaram fora do número por semanas.
- **Caso negativo continua provando que NÃO escreveu**: `utils/guarda-criacao.js` intercepta a
  criação e `expect(guarda.tentativas()).toBe(0)` é a assertion. "Não deve criar" só é
  demonstrável assim.

Autorização não resolve **cadastro no ERP** (alçada na AL/DHL, comprador na SY1), **credencial de
fornecedor** nem **perfil de administrador**. Esses seguem sendo limites reais — mas
**verifique antes de declarar bloqueio**: o documento de casos afirmava que processos de RH eram
barrados e, medindo, cinco de seis abrem normalmente.

---

## Limpeza da massa

`fixtures/global-teardown.js` cancela, ao fim de QUALQUER invocação, as solicitações que ela
criou. `PULAR_LIMPEZA=1` desliga, para depurar com o resíduo vivo.

Isto contraria uma decisão anterior deste projeto, que mantinha a limpeza fora do teardown. A
premissa era que uma falha ali derrubaria o relatório — medido em 27/08/2026 e **refutado**:
quando o teardown roda, trace e screenshot já estão gravados, e teardown que lança exceção não
impede a geração do relatório. Mesmo assim o arquivo nunca lança.

O corte é **por invocação** (`process.uptime()`), porque o livro-razão é append-only e no fluxo
destrutivo fatiado cada invocação recancelaria tudo que veio antes.

- `fixtures/fixtures.js` escreve `test-results/criados.jsonl` a cada teste, lendo as anotações
  `*-criada`/`*-criado` que os testes destrutivos já produzem. Escrever no instante da criação é
  o ponto: o resíduo que mais importa é o de teste que morreu no meio, e esse nunca chega ao
  relatório.
- `utils/cancelamento-fluig.js` tem o contrato: `POST /api/public/2.0/workflows/cancelInstances`,
  só cookie, `cancelText` obrigatório, aceita lote. **Sempre via `page.evaluate` + `fetch`** —
  `page.request` leva 403 do WAF por falta de `User-Agent` e `Referer` de navegador.
- Procedência é obrigatória: com `--descobrir`, só cancela o que tem carimbo `QA` no formulário;
  no modo livro-razão, aceita também sem carimbo, porque a medição de contrato não tem campo de
  texto para carimbar.

Conhecimento de campo sobre o ambiente (cancelamento, catálogo de processos, APIs, o que é
reversível) está na skill **`cassi-fluig-master`**. Consulte antes de investigar de novo.

## Arquitetura

### Dois projetos no `playwright.config.js`

| Projeto | Escopo | storageState |
|---|---|---|
| `autenticacao` | `tests/e2e/auth/**` | **não** — valida o login de verdade |
| `e2e` | todo o resto | sim, gravado pelo `globalSetup` |

`fixtures/global-setup.js` autentica **uma vez** reaproveitando o `LoginPage` (não duplica
seletores) e persiste o estado. Falha explicitamente se faltar variável de ambiente — setup
silencioso faz a suíte inteira falhar pelo motivo errado.

### `fixtures/fixtures.js` — a base compartilhada

Exporta `test`/`expect` para **todas** as specs. Traz:
- a **seed do faker**, fixada por execução e anexada ao relatório (sem ela, massa variável gera
  falha irreproduzível);
- a fixture `evidence` com `{ auto: true }`, que em toda falha anexa screenshot, URL, título do
  teste, mensagem do erro e o comando de reprodução com a seed.

Specs **não** adicionam fixtures aqui. Page Objects próprios são instanciados direto no teste
(`new MinhaPage(page)`) — foi o que permitiu nove suítes serem escritas em paralelo sem colisão.

### `utils/` — as três ferramentas que a suíte gira em torno

**`dataset-fluig.js`** — No Fluig, **todo** dataset é executado pelo *mesmo* endpoint
(`POST /api/public/ecm/dataset/datasets`), com o nome no corpo. Não dá para interceptar por URL:
é preciso ler o `postData()`. Daí `responderDatasetCom`, `derrubarDataset` e `aguardarDataset`.
É o que permite reproduzir "usuário sem grupo" e "Protheus fora do ar" sem provisionar usuário
nem derrubar serviço do cliente.

**`guarda-criacao.js`** — a trava de escrita descrita acima.

**`captura-payload.js`** — a técnica de maior valor do projeto. Ao clicar em Confirmar, o widget
faz `POST .../wf_solicitacao_compras/start` com o payload completo da SC (~101 campos, itens
sufixados `___1`, `___2`…). Interceptar, **ler o corpo e abortar** prova defeitos que antes só
eram visíveis na SC já criada — sem gravar nada. É assim que D-01, D-02, D-04 e a incoerência de
contrato viraram testes normais em vez de destrutivos.

### `config/`

`ambiente.js` centraliza rotas, nomes de dataset e títulos, com `envObrigatoria()` falhando alto
quando falta configuração.

**Não existe variável de contrato.** A massa é descoberta em tempo de execução pela grade
(`utils/massa-contratos.js`): o teste declara a característica de que precisa e a suíte escolhe
um contrato que sirva; sem massa, falha com `PRÉ-CONDIÇÃO AUSENTE`, separando ambiente de
defeito no relatório.

A escolha é **por afinidade de hash** entre a identidade do teste (`titlePath`) e o número do
contrato, e o contrato escolhido é **reservado** contra os outros workers (lock de diretório,
devolvido pela fixture `evidence`). Determinística — o mesmo teste escolhe sempre o mesmo
contrato, em qualquer worker, o que é a condição para reproduzir uma falha. Nunca ordene por
posição (`vigentes[0]`, `vigentes.slice(0, N)`): é assim que a suíte inteira acaba dependendo do
`000000000000001` de novo.

Contrato é pré-condição de leitura, e isso foi **verificado, não assumido**: ver
`docs/criacao-de-contrato-inviavel.md`. Em uma linha — o contrato é uma linha da CN9 do Protheus,
todos os 19 datasets do ERP expostos ao portal são `get*`, nenhum dos 34 processos publicados cria
contrato, e um contrato recém-incluído nasce "Em elaboração" (não serve para SC) até um gestor
humano aprová-lo. Não há, portanto, contrato para cancelar ao fim da execução.

Corolário ao escrever teste novo: **nunca fixe o valor de um contrato numa constante**. Não há
oráculo externo para o valor total, então afirme sobre a coerência interna do payload (itens com
quantidades diferentes não podem compartilhar o mesmo total), que vale para qualquer contrato.

---

## Particularidades do Fluig que decidem o desenho dos testes

Estas custaram caro para descobrir. Ignorá-las produz teste que passa por acidente:

- **O login é servido na MESMA URL da home** (`/portal/p/1/home`). Validar sessão por URL passa
  mesmo sem sessão — o critério é o **título** do documento.
- **A tela de login é traduzida pelo locale do navegador.** O config fixa `pt-BR`; sem isso a
  suíte quebra conforme a máquina que a executa.
- **Diálogo nativo some sozinho.** O Playwright dispensa `alert()` automaticamente. Para observar
  o alerta do Banco de Horas é obrigatório registrar `page.on('dialog')` **antes** de navegar.
- **Ícones sem nome acessível.** Os três da coluna "Ação" são âncoras vazias sem `aria-label`;
  `getByRole('link', { name })` não resolve. Gancho estável: atributo `title`.
- **Campo de data é `<input type="date">`** — só aceita ISO (`aaaa-mm-dd`).
- **A Central de Tarefas guarda a sub-aba por sessão no servidor** — a pré-condição precisa clicar
  na aba desejada em vez de confiar no estado herdado.

Mais em `docs/mapa-do-ambiente.md`, que é a fonte da verdade sobre o ambiente. **Leia antes de
escrever teste novo** e atualize quando o ambiente divergir — se o mapa contradiz o ambiente, o
ambiente ganha.

---

## Testes vermelhos são intencionais

Parte da suíte **reprova de propósito**: são testes escritos contra o comportamento esperado que
o produto não entrega. Cada um cita o defeito em comentário. A tabela dos defeitos está no README.

**Não "conserte" um teste vermelho para ficar verde** — isso documenta o bug como se fosse regra.
Se o defeito for corrigido no produto, o teste fica verde sozinho.

**Todo teste nessa situação leva a tag `@bug` no título** (mesma convenção de `@destrutivo`; um
teste pode ter as duas — `@destrutivo @bug`). Ela separa "o que deveria estar verde" de "defeito
já conhecido" na regressão:

```bash
npx playwright test --grep-invert @bug        # só o que DEVERIA estar verde
npx playwright test --grep @bug               # só os defeitos conhecidos
PULAR_DESTRUTIVOS=1 npx playwright test --grep-invert @bug   # regressão rápida e limpa
```

Critério completo (quem recebe, quem não recebe, limite conhecido da tag e a alternativa
`test.fail()` ainda pendente de decisão) está no README, seção "A tag `@bug`".

---

## Armadilhas já pagas (não repita)

**Interceptar muda o comportamento da aplicação.** A trava antiduplo-clique desabilita o botão
enquanto a criação está em voo. Abortar a requisição faz o widget reabilitar na hora, e `force: true`
fura a própria trava sob teste — as duas coisas produzem vermelho que é **artefato, não defeito**.
O teste correto **segura a requisição em voo** e afirma sobre o estado real. Só assim se confirmou
que a proteção funciona.

**Não segure toda escrita em `process-management`** — o portal faz chamadas de contagem na carga e
a página nunca termina. Filtre pelo endpoint de `/start`.

**Contagem lida cedo demais passa por acidente.** A contagem de alertas do modal só estabiliza depois que o
modal termina de abrir; afirmar antes disso dá falso verde.

**`force: true` prova só que o handler existe**, não que a pessoa consegue acionar o controle.
Quando houver sobreposição de CSS, use clique de mouse na coordenada (`page.mouse.click`).

**Estado global mutável não paraleliza.** `describe.serial` não serializa entre repetições do
`--repeat-each`; caso que disputa recurso de conta única vira flaky garantido.

---

## Estado do quality gate

`docs/estado-do-gate.md` guarda as medições de determinismo. Critério para a medição final: a
grade de contratos sustentar os ~840 registros em cinco amostras seguidas — a integração com o
Protheus oscilou entre 855 contratos, zero registros e indisponibilidade nos últimos dois dias, e
medir instabilidade de ambiente como flakiness de teste seria conclusão errada.

## Cobertura

`docs/cobertura.md` é a matriz caso a caso, **medida** sobre `docs/catalogo-casos.md` (o catálogo
de 163 casos, versionado aqui) e sobre `tests/`. Hoje: **132 cobertos, 31 sem teste**, cada
lacuna com motivo.

A ligação é o **ID no título do teste**. Ao implementar um caso do catálogo, **cite o ID** — sem
isso a cobertura existe mas não é auditável, e o caso aparece como lacuna. Depois de adicionar
casos, regenere:

```bash
npm run cobertura
```

O script reprova em dois casos, de propósito: **ID citado que não existe no catálogo** (ou o
teste está errado, ou o caso precisa entrar no catálogo) e **caso sem teste e sem motivo
declarado** em `scripts/gerar-cobertura.mjs`. Lacuna sem motivo é indistinguível de esquecimento,
e uma matriz que envelhece em silêncio é pior que nenhuma.
