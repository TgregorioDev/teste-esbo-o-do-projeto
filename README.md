# Suíte E2E — TOTVS Fluig Cassi

Automação de testes end-to-end da plataforma Fluig da Cassi, cobrindo autenticação, navegação e
permissões, documentos, central de tarefas, o ciclo de Compras e Contratos, RH, portais e
segurança/integração.

Stack: **Playwright + JavaScript + Node**, verificação estática por `// @ts-check` + JSDoc + `checkJs`.

---

## Como rodar

```bash
npm ci
npx playwright install chromium

cp .env.example .env.test     # preencher; NUNCA commitar
npm test                      # suíte completa, destrutivos incluídos
npm run test:auth             # só autenticação
npm run typecheck             # verificação estática
npm run report                # relatório HTML da última execução
npm run cobertura             # regenera docs/cobertura.md a partir do catálogo e da suíte
PULAR_DESTRUTIVOS=1 npm test  # regressão rápida, sem criar registro novo
```

Reproduzir exatamente a massa de uma execução que falhou (a seed fica anexada ao relatório):

```bash
FAKER_SEED=<valor> npx playwright test
```

---

## Estrutura

```
config/       ambiente, rotas, nomes de dataset e massa de contratos (tudo vindo de env)
factories/    massa fictícia preenchida em tela (faker + sufixo único + prefixo QA)
fixtures/     fixtures do Playwright, evidência automática de falha e autenticação única
pages/        Page Objects (uma rota por arquivo)
components/   componentes reaproveitados entre telas
utils/        interceptação de dataset, trava de escrita e captura de payload
tests/e2e/    specs de interface, agrupadas por área
tests/api/    specs de contrato e controle de acesso via API
docs/         mapa do ambiente confirmado em campo
```

`globalSetup` autentica uma vez e grava o `storageState`; o projeto `autenticacao` roda **sem**
ele, para validar o login de verdade.

📌 **Leia `docs/mapa-do-ambiente.md` antes de escrever qualquer teste novo.** Ele registra o que
foi confirmado em campo — rotas, títulos, datasets, formatos de campo, defeitos reprodutíveis e as
armadilhas de automação já pagas por esta suíte.

---

## Massa de teste

**Não há variável de contrato para preencher** — o `.env.test` pede só `BASE_URL`,
`QA_USERNAME` e `QA_PASSWORD`.

A massa é **descoberta em tempo de execução** a partir da própria grade do portal
(`utils/massa-contratos.js`): o teste declara a característica de que precisa — contrato
vigente, de filial diferente de outro — e a suíte escolhe um que sirva.

Fixar um número de contrato em `.env` criava duas fragilidades: a suíte quebrava no dia em que
alguém finalizasse, cancelasse ou revisasse aquele contrato; e a falha era ilegível, porque um
timeout esperando o filtro não diz "faltou massa". Quando não há massa, a descoberta agora falha
com *"PRÉ-CONDIÇÃO AUSENTE: a grade de contratos não retornou nenhuma linha… isto NÃO é defeito
do produto"*, separando ambiente de defeito no próprio relatório.

### Nenhum teste depende de um contrato específico

Escolher "a primeira linha vigente da grade" era, na prática, escolher sempre o
`000000000000001`: a suíte inteira pendurada num registro só. Desde 30/08/2026 a escolha é feita
por **afinidade de hash** entre a identidade do teste (`titlePath`) e o número do contrato, entre
os **554 vigentes** da base. Propriedades:

- **determinística** — o mesmo teste escolhe sempre o mesmo contrato, em qualquer worker e em
  qualquer ordem; é o que permite reproduzir uma falha;
- **distribuída** — testes diferentes caem em contratos diferentes, então remover um contrato da
  base afeta no máximo os testes que o escolhiam;
- **exclusiva** — o contrato escolhido é reservado contra os outros workers (lock de diretório,
  devolvido pela fixture `evidence` mesmo quando o teste falha), para que dois cenários de
  escrita nunca disputem o mesmo registro sob `fullyParallel`;
- **observável** — o contrato usado vai para o relatório como anotação `contrato-escolhido`.

Quando todos os candidatos estão ocupados, a falha é `MASSA INSUFICIENTE`, que diz para reduzir
`--workers` ou provisionar mais contratos — nunca um timeout opaco.

### Contrato continua sendo pré-condição de leitura — e isso foi medido

A automação **não pode criar contrato**, e a afirmação deixou de ser premissa: a investigação
está em [`docs/criacao-de-contrato-inviavel.md`](docs/criacao-de-contrato-inviavel.md). Resumo —
o contrato é uma linha da tabela CN9 do Protheus; os 19 datasets do ERP expostos ao portal são
todos `get*`; 20 nomes plausíveis de dataset de escrita foram probados e nenhum existe; nenhum dos
34 processos publicados cria contrato; e um contrato recém-incluído nasce "Em elaboração", só
virando "Vigente" após aprovação de um gestor humano. Como nada é criado, **não há contrato a
cancelar** ao fim da execução.

Já tudo que a automação **preenche** (justificativa, data, tipo) vem de factory com faker, sufixo
único e prefixo `QA`.

> Ao escrever teste novo: **nunca fixe o valor de um contrato numa constante**. Não há oráculo
> externo para o valor total — nem o payload nem a grade o expõem. Afirme sobre a coerência
> interna do payload (itens com quantidades diferentes não podem compartilhar o mesmo total),
> que vale para qualquer contrato.

## Cobertura — medida, não estimada

| | |
|---|---|
| Casos no catálogo (`docs/catalogo-casos.md`) | **163** |
| Casos com teste na suíte | **133** (82%) — os contados por menção em prosa ficam listados na matriz |
| Casos sem nenhum teste | **30** — cada um com motivo medido |
| Testes que **criam ou editam** registro (`@destrutivo`) | **34** — rodam na execução padrão |

**Última execução medida (26/08/2026, 12h18 — suíte inteira, destrutivos incluídos): 178 testes,
131 verdes, 47 vermelhos.** Os 34 `@destrutivo` rodaram **um por vez, com 60s entre cada** — o
Fluig tem proteção contra volume de requisições, e bloqueio de taxa apareceria como vermelho
que parece defeito. A pausa é decisão de quem roda, não código da suíte. Dos 34 `@destrutivo`, 22 verdes e 12 vermelhos. **Nenhum dos 47
reprova por timeout opaco**: 44 trazem mensagem de domínio nomeando o defeito e 3 são
`PRÉ-CONDIÇÃO AUSENTE` nomeando o que falta. ⚠️ **O total de
vermelhos não é comparável entre execuções sem olhar quais testes são**: dois testes variam por
não-determinismo do próprio produto. Detalhe em [`docs/estado-do-gate.md`](docs/estado-do-gate.md). Detalhe e classificação em
[`docs/estado-do-gate.md`](docs/estado-do-gate.md).

**A matriz caso a caso está em [`docs/cobertura.md`](docs/cobertura.md)**, gerada por
`npm run cobertura` — que falha se um teste citar um ID inexistente no catálogo, ou se um caso
ficar sem teste e sem motivo declarado. A ligação é o **ID citado no título do teste** (`CT-AUT-01-H — deve
autenticar…`) — é o que torna o número auditável em vez de declarado. Ao trazer um caso do
catálogo, cite o ID: sem isso ele aparece como lacuna (aconteceu com nove deles).

**"Coberto" não significa sempre "fluxo executado".** Parte dos 132 está coberta como **bloqueio
documentado**: o processo não abre, ou abre e o formulário não monta campo. Esses testes provam a
condição real do ambiente e ficam prontos para exercitar o fluxo no dia em que a pré-condição
existir.

**O que a automação já cria e movimenta de verdade:** Solicitações de Compra pelos dois pontos de
entrada, tarefas assumidas do pool, aprovações e reprovações do Gestor, documentos no GED com
upload e exclusão, favoritos, delegação de fiscais, medição de contrato e processos de Contencioso.
Todos com prefixo `QA` e sufixo único, rastreáveis na base.

## Limpeza da massa criada

**A limpeza é automática.** Ao fim de QUALQUER execução — inclusive `npx playwright test`
rodado direto — o `globalTeardown` cancela as solicitações que aquela invocação criou.

```bash
npx playwright test                  # cria e limpa sozinho
PULAR_LIMPEZA=1 npx playwright test  # mantém o resíduo vivo, para depurar

npm run limpar:simular               # lista o que faria, sem tocar em nada
npm run limpar                       # limpeza manual pelo livro-razão

# acumulado de execuções antigas (varre o servidor pelo carimbo QA)
node scripts/limpar-massa.mjs --descobrir --desde=2026-08-25
```

**As evidências não são tocadas.** A limpeza cancela registros no Fluig por HTTP; não abre, não
lê e não apaga arquivo nenhum. Screenshots, trace, vídeo e o `relatorio-falhas.html` ficam
intactos — e cancelar não é apagar: a solicitação continua legível, com formulário, histórico e
anexos. O que se perde é a possibilidade de **movimentá-la**, e é para isso que existe
`PULAR_LIMPEZA=1`.

Medido em 27/08/2026, porque a decisão dependia disso: quando o `globalTeardown` roda, os
artefatos por teste **já estão gravados**; e um teardown que lança exceção **não impede** a
geração do relatório. Ainda assim o teardown nunca lança — falha de limpeza é registrada e a
execução segue.

O filtro é **por invocação**: o livro-razão é append-only, e o corte é o instante em que o
processo começou. Sem isso, no fluxo destrutivo fatiado cada uma das 34 invocações tentaria
recancelar tudo que veio antes. Resíduo de execução interrompida com Ctrl+C não passa pelo
teardown — para esse caso existe o modo `--descobrir`.

Como funciona: a fixture escreve `test-results/criados.jsonl` no instante da criação — não
depois, porque o resíduo que mais interessa limpar é o de teste que **morreu no meio**, e esse
nunca chega ao relatório. O limpador lê esse livro, confirma cada id contra o servidor e
cancela por `POST /api/public/2.0/workflows/cancelInstances`, em lotes espaçados.

**A trava de segurança:** nada é cancelado sem procedência. No modo `--descobrir`, exige-se o
carimbo `QA` nos campos do formulário — a base é compartilhada, e cancelar por janela de data
destruiria trabalho de outras pessoas (medido em 26/08: 402 solicitações abertas na janela, só
324 eram nossas). No modo livro-razão, aceita-se também registro **sem** carimbo, porque nem
tudo pode ser carimbado — a medição de contrato não tem um único campo de texto editável — e
ali a procedência é o próprio livro, escrito pela suíte.

O relatório sai em `limpeza.json`, e a confirmação final é lida **do servidor**, não do retorno
do endpoint: `successCount` é o que ele diz ter feito; `status: CANCELED` é o que aconteceu.

### O que a limpeza não alcança

Documento publicado no GED **não** é cancelável por solicitação — `CT-GED-02-S2` e `CT-GED-02-S1`
publicam alguns por execução em "Meus Documentos", e o `npm run limpar` não os toca (a exclusão é
outra receita, na skill `cassi-fluig-master`). Tarefa assumida de pool também fica: `CT-CMP-08-H`
deixa uma por execução, e não há devolução direta (há por "Transferir" numa atividade de grupo,
mas não é o que esses testes fazem).

Tarefa assumida de pool não tem devolução no Fluig — confirmado por menu, por bundle e pela
ausência de inverso na API. Anexo de Solicitação de Compra vira documento numa pasta que o
produto cria por solicitação, e apagá-lo significa mexer na solicitação. Registro de formulário
e histórico não têm rota de remoção para usuário comum. Detalhes na skill `cassi-fluig-master`.

## Relatório de falhas

Depois de uma execução completa, `relatorio-falhas.html` reúne **todos os testes que reprovaram**
numa página só: o caso, a falha, a classificação da causa e as evidências.

```bash
# 1. execute em fatias, gravando blobs (evita estourar o tempo de uma execução única)
PLAYWRIGHT_BLOB_OUTPUT_DIR=blob-slices/s1 npx playwright test tests/api tests/e2e/auth --reporter=blob
# … demais fatias …

# 2. junte tudo e gere os dois relatórios
mkdir -p blob-todos && cp blob-slices/*/*.zip blob-todos/
npx playwright merge-reports --reporter=html ./blob-todos && npx playwright show-report
npx playwright merge-reports --reporter=json ./blob-todos > /tmp/merged.json
node scripts/relatorio-falhas.mjs /tmp/merged.json
```

Cada cartão traz, além do que o relatório nativo mostra: o **trecho de código** que falhou (o JSON
do Playwright traz só a localização), o **aria-snapshot** da tela no instante do erro, o *call log*
do que foi esperado, o contexto capturado pela fixture e o **comando de reprodução com a seed**.
Screenshots vão embutidos, então o arquivo abre sozinho. Trace e vídeo ficam no relatório nativo,
linkado por teste.

## Testes vermelhos por defeito real do produto

Estes reprovam **de propósito**. Estão escritos contra o comportamento esperado e o produto hoje
não o entrega. Ajustá-los para passar documentaria o defeito como se fosse regra.

| Defeito | Onde | O que se observa |
|---|---|---|
| **D-01 (causa isolada)** 🔴 | payload da SC | o widget envia `targetState: 6` — o `START_EVENT_NORMAL` do BPMN — com `targetAssignee: consumerkeycompras`, e a SC nasce presa ali. **Provado em 26/08/2026:** o MESMO payload com `targetState: 0` faz a SC percorrer *Compra Centralizada?* → *Grava SC e Anexos* → *Validação do Gestor* e parar no pool do Gestor Imediato, como deveria. Não é limitação do processo: é o valor que o widget envia |
| **D-01 (sintoma)** 🔴 | criação da SC | falha na transferência é anunciada como "iniciado com sucesso" |
| **D-02** 🔴 | payload da SC | contrato de R$ 40.560,00 vira 2 itens de R$ 40.560,00 (**R$ 81.120,00**); em contrato de 4 itens, o valor se repete nos quatro |
| **D-04** 🟠 | payload da SC | `classeOrca=133017` e `classificacao=Tecnologia` fixos em todo item e todo contrato; `campoDescritor="Sol. Compras - CASSI SEDE"` com filial de São Luís/MA |
| **D-08** 🟡 | grade de contratos | situação truncada: `Finali`, `Paralisa`, `Sol.Finali`, `Cancel.` |
| **D-11 (revisto)** 🟠 | modal com Protheus fora | **não há duplicação de renderização** — o widget exibe um alerta por falha. O defeito é o RÓTULO: a falha ao carregar os itens da planilha é anunciada como *"Erro ao buscar dados da filial"*. Com o Protheus fora, as duas falhas trazem o mesmo texto e ficam indistinguíveis — foi isso que se leu antes como "o mesmo alerta duas vezes" |
| **CT-ACC-04-S5** 🟡 | payload da SC | `nrContrato` de um contrato com revisão, filial e itens de outro; sem revalidação no servidor |
| **classeValor vazio** 🟠 | payload da SC | `tbprod_classeValor` em branco, com `classeOrca` e `classificacao` preenchidos ao lado — pode travar a Validação Orçamentária |
| **CT-FAT-02-S2** 🔴 | medição de contrato | o Protheus **recusa** a medição (`STATUS: ERROR` — *"Existe revisão pendente de aprovação para este contrato, não é permitido medir contratos em revisão"*) e a tela **não exibe aviso nenhum**: o painel de itens só não abre. O usuário não sabe por quê. Confirmado interceptando a resposta que o widget recebe |
| **Fail-open no formulário** 🔴 | SC clássica | enquanto o formulário ainda monta (overlay `blockUI` na tela), **o clique em Enviar não é validado**: o Fluig dispara `POST .../workflowView/send` direto e cria a SC de um formulário vazio. Medido em 2 de 9 cargas **sem concorrência**, e de forma persistente quando `ds_protheus_getMatriculaTitular_rest` responde 500 (`WFLYEJB0054: Failed to marshal EJB parameters`) — a montagem nunca termina e o envio continua aceito |
| **CT-GED-02-S1** 🔴 | upload no GED | arquivo `.exe` é **aceito e publicado sem nenhuma validação de extensão** — nenhuma mensagem de bloqueio. Achado que só apareceu quando os testes `@destrutivo` passaram a rodar |
| **CT-CMP-02-S4** 🔴 | SC sem anexo | o anexo obrigatório não é validado **nem no cliente nem no servidor**: o Enviar dispara `POST /ecm/api/rest/ecm/workflowView/send` e o servidor responde 200 com `processInstanceId` real — a SC nasce sem documento |
| **U-01** 🟠 | deep-link SPA | `/principalprocess` e `/gestao_ferias` caem em `errorPage/404` |
| **U-02** 🔴 | banco de horas | `alert()` nativo de configuração de servidor exposto ao usuário final |
| **U-11** 🟠 | qualquer página | 2 requisições por carga para `google-analytics.com` — validar com Privacidade/LGPD |
| **Vazamento `colleague`** 🔴 | `dataset/search` | com e sem constraint: **3.493** registros. O filtro é ignorado e a base de colaboradores é acessível a qualquer sessão autenticada |
| **NPS 403** 🟡 | home | `GET /nps/api/v1/surveys` → 403 em toda carga, gerando erro de console |
| **Aba Atribuir** 🔴 | gerência de compras | a tabela **nunca** renderiza dados; reclicar não resolve. Trava a etapa de atribuir comprador |
| **CT-SEG-07-S1 (BOLA)** 🔴 | API v2 de processos | *(medido 27/08/2026)* a conta `TOTVS-FS` (não-admin, que **nem pode iniciar** o processo) lê `GET /process-management/api/v2/requests/<id>?expand=formFields` de uma instância de que **nunca participou** e recebe **200** com o formulário inteiro — razão social do fornecedor, **CNPJ**, valor, chave da NF. O `processInstanceId` é sequencial: qualquer sessão autenticada enumera a base com um `for`. Isolamento horizontal quebrado (BOLA/IDOR interno) |
| **CT-CMP-08-H** 🔴 | ciclo de retorno da SC | a correção é um **beco sem saída**: gestor reprova → a SC volta para *"Ajustar Informações"* com o solicitante → o reenvio é recusado com *"Existem campos de rateio sem preenchimento"*, num rateio que **veio do contrato e ninguém tocou**. A SC fica presa na caixa do solicitante para sempre. Reproduzido 2/2 |
| **CT-CMP-07-S1 (fail-open determinístico)** 🔴 | SC clássica | a mesma classe do *Fail-open* acima, agora **reproduzível sob demanda**: forçando `ds_protheus_getMatriculaTitular_rest` → 500, o formulário nunca termina de montar e o Enviar continua aceito, criando SC de formulário vazio. Tira o defeito da janela probabilística (2 de 9) e o torna testável |
| **CT-GED-02-S2** 🔴 | upload no GED | a não-validação de extensão é **allowlist ausente, não só o `.exe`**: `.bat`, `.sh`, `.pdf.exe` e um executável **renomeado para `.pdf`** são todos publicados sem nenhuma mensagem de bloqueio. Nem o nome nem o conteúdo são checados |
| **CT-PLT-08-S1** 🔴 | catálogo de processos | o processo `teste` (categoria **admin**, resíduo de desenvolvimento) continua ofertado no catálogo de início — e abri-lo **serve o formulário completo da Solicitação de Compras**, 147 campos, com Validação do Gestor/Orçamentária/Comprador. Superfície administrativa exposta a usuário comum |
| **CT-SEG-08-S1** 🟠 | catálogo de início | `bpm_addUserFluig` e `bpm_addUserGroup` — processos de **criação de usuário e de grupo** — constam do catálogo `onlyCanStart` desta conta não-admin e abrem o formulário. Mesma classe da segregação de RH, com alvo pior |
| **CT-NOT-03-S1** 🟡 | API de notificação | `GET /notification/api/v1/notifications?limit=3` **ignora `limit`** e devolve 707; e `DELETE /notifications/{id}` responde `500 NotFoundException` apesar de cada item declarar `canRemove: true` — a rota de exclusão anunciada não existe |
| **CT-PLT-06-S1** 🟡 | Portal do Comprador | **atualizado 31/08/2026 — 2 → 4 erros**: aos dois já catalogados (`404` em `/style-guide/css/fluig-style-guide.min.css` e `console.error` *"Comprador não encontrado"* na busca do colaborador no Protheus) somaram-se as 2 ocorrências do U-16 (logo 404) abaixo, que agora atingem também esta rota |
| **CT-PLT-07-S1** 🟡 | favoritos | favoritar o mesmo processo duas vezes (duplo clique, duas abas) responde **500 em `text/plain`** *"…já está nos seus favoritos"* — deveria ser 200 idempotente ou erro de negócio em JSON. Quebra qualquer cliente que faça parse do corpo |
| **CT-PFN-02-S2** 🟠 | redefinição de senha do fornecedor | token de redefinição adulterado/expirado é recusado na TELA (aviso genérico *"Senha não foi atualizada!"*), mas o endpoint responde **500** com `{"message": "...", "exception": "java.lang..."}` — vazamento de classe de exceção na camada de rede, visível em qualquer DevTools. Deveria ser erro controlado (4xx) sem detalhe de implementação |
| **U-16** 🟡 | 8 rotas-chave (`erros-de-console.spec.js`) + Home | **NOVO, 31/08/2026 — regressão.** `GET /portal/api/servlet/image/1/custom/logo_image.png` (servlet de imagem do próprio Fluig, branding/logo customizado — não é dataset do ERP) → **404**, duas vezes por carga. Atinge 7 das 8 rotas de `erros-de-console.spec.js` (todas exceto Portal do Comprador, que já tinha erro próprio — ver CT-PLT-06-S1 acima) mais `home.spec.js` (NPS 403 vira 3 erros). Confirmado por `curl` direto (HTTP 404) e por 2 execuções completas do arquivo. Em 27/08/2026 essas 7 rotas carregavam **sem** erro de console — é regressão, não achado antigo |
| **CT-PAR-01-S1 / CT-PAR-01-S2** 🔴 | Parecer Técnico (formulário avulso) | **NOVO, 31/08/2026.** A seção "Aprovação do Parecer Técnico" (Responsável/Email/Data/Hora) nasce `readonly` e vazia, sem caminho de UI para preenchê-la — mas o clique em Enviar completa `POST .../ecm/api/rest/ecm/workflowView/send` mesmo assim (confirmado com `bloquearTodaEscritaNoHost` interceptando qualquer não-GET). O catálogo (`CT-PAR-01-S1`, `docs/catalogo-casos.md:413`) exige que o sistema sinalize a ausência de responsável, não que rotule/perca a tarefa. Mesma família do fail-open já catalogado acima (D-04 / CT-CMP-02-S4 / Fail-open no formulário), instância nova, em processo diferente |

Quando cada defeito for corrigido, o teste correspondente fica verde sozinho — nenhuma alteração
no código de teste é necessária.

### A tag `@bug`

Todo teste que reprova **de propósito** por um dos defeitos desta tabela (ou por um defeito
catalogado em comentário no próprio spec — nem todos os defeitos autodocumentados chegaram a
entrar nesta tabela, ex. `D-JUR-01` em `sigajuri-consultivo.spec.js`/`sigajuri-contrato.spec.js`,
`D-10` em `criacao-solicitacao.spec.js`, `CT-DEL-01-H`/`CT-DEL-01-S1` em
`delegacao-fiscais-ciclo.spec.js`) leva a tag **`@bug`** no título, na mesma convenção de
`@destrutivo` — um teste pode ter as duas: `@destrutivo @bug`. Hoje são **66 testes** (`npx
playwright test --grep @bug --list | tail -1`).

**Quem recebe:** o teste está escrito contra o comportamento esperado, reprova hoje por um defeito
de produto já identificado, e ficaria verde sozinho no dia em que a TOTVS/Cassi corrigir o
sistema — nenhuma mudança no código de teste seria necessária.

**Quem NÃO recebe**, mesmo parecendo candidato:
- Falha por **ausência de dado do ambiente** (ex.: `dsProtheus_getContratosxFornecedores_restGet`
  vazio, fila de cotação/negociação vazia) — isso é ambiente, não defeito de produto catalogado.
- Teste de **pré-condição ausente** (massa/usuário/grupo faltando).
- Teste **verde que só exercita comportamento correto**, inclusive os "ACHADO"/invariante que
  ficam verdes ENQUANTO o comportamento atual (correto ou não) persistir e virariam vermelhos se
  ele mudasse — polaridade oposta à do `@bug` (que é vermelho HOJE, e viraria verde).
- Teste cuja falha **não foi amarrada** a um defeito documentado (comentário do spec ou tabela
  acima) — fica candidato para decisão do dono, não marcado.
- Caso **intermitente**, onde a última medição de campo não reproduziu o defeito (ex.:
  `CT-CLI-01-H`/`D-CLI-01` em `questionario-clinicassi.spec.js`) — nesses casos a incerteza foi
  registrada como pendência em vez de aplicar a tag.

**O que a tag habilita** — a pergunta de regressão do projeto passa a ser:

```bash
npx playwright test --grep-invert @bug        # só o que DEVERIA estar verde
npx playwright test --grep @bug               # só os defeitos conhecidos
PULAR_DESTRUTIVOS=1 npx playwright test --grep-invert @bug   # regressão rápida e limpa
```

**Limite conhecido da tag:** ela marca o que já se sabe quebrado, mas **não avisa quando o
defeito é corrigido** — um teste `@bug` que passa a ficar verde continua rodando e passando,
silenciosamente, sem chamar atenção para o fato de que a tag ficou desatualizada. A alternativa é
o `test.fail()` nativo do Playwright, que inverte o veredito esperado e **reprova** se o teste
passar (em vez de só marcar/filtrar) — sinalizando ativamente quando um defeito foi corrigido.
Adotar `test.fail()` nestes casos é decisão pendente do dono do ambiente; não foi implementado
nesta entrega.

---

## Perguntas em aberto para a Cassi

1. **Segregação de RH.** Dos seis processos verificados, só `wf_aprovacao_ocorrencia` e
   `wf_solicitacao_ferias` bloqueiam. `wf_pagamento_horas_extras`, `wf_automacao_admissao`,
   `wf_substituicaocargos`, `GestaoDependentes` e `rh_gbeneficios_planosaude` **abrem** para um
   usuário de Compras. Parte pode ser autoatendimento por desenho. **Quais deveriam exigir grupo
   de RH?** O que sobrar é defeito de segregação.
2. **Tipo de Solicitação.** O roteiro registrava *Renovação Contratual*, *Aditivo Contratual* e
   *Nova Solicitação*. **Medido de novo em 30/08/2026 e a lista mudou outra vez**: o combo agora
   oferece *Aditivo Contratual* e ***Nova Contratação***, e **"Renovação Contratual" sumiu**.
   Confirmado como **independente do contrato** — o `000000000000001` e outros dois vigentes
   escolhidos ao acaso devolvem exatamente a mesma lista —, então não é efeito da distribuição de
   massa. Consequência hoje: três testes reprovam por isso, dois deles porque
   `factories/solicitacao-compra.js` usa *Renovação Contratual* como tipo padrão e o
   `selectOption` não acha a opção. **Qual é a lista correta?** Sem essa resposta, mudar o padrão
   da factory seria adivinhar.
3. **Telemetria externa.** O envio de URL e título a serviço externo é aceitável para uma
   operadora de saúde? O teste está escrito contra "não deve enviar".
4. **Confirmar sem itens.** O envio é corretamente bloqueado, mas o usuário não recebe mensagem
   nova. Qual deve ser o aviso?
5. **Campos fixos no payload** (D-04): quais são legitimamente fixos?

---

## Política de escrita

Base de **homologação**, mantida para validar implementações — não é usada pelo cliente. Criar,
movimentar e aprovar registros é autorizado. Detalhes em `docs/politica-de-escrita.md`.

- Todo registro criado nasce com prefixo `QA` e sufixo único: o resíduo é identificável, o que
  importa porque registro no Fluig/Protheus em geral não tem exclusão disponível.
- Cada teste cria a própria massa; nada depende de ordem de execução.
- Cenário que escreve leva `@destrutivo` e fica fora da execução padrão:
  `INCLUIR_DESTRUTIVOS=1 npx playwright test --grep @destrutivo`.
- Caso negativo segue provando que **não** escreveu: `utils/guarda-criacao.js` intercepta a
  criação e `expect(guarda.tentativas()).toBe(0)` é a assertion.
- `utils/captura-payload.js` intercepta a criação da SC, **lê o corpo e aborta** — prova D-01,
  D-02 e D-04 sem depender de gravar. Continua sendo o caminho preferido quando serve.

Seguem bloqueados por pré-condição que autorização não resolve: cadastro de aprovador de alçada
(AL/DHL) e de comprador (SY1) no Protheus, credencial de fornecedor externo e perfil de
administrador. **Verifique antes de declarar bloqueio** — o documento de casos afirmava que RH
era barrado e cinco de seis processos abrem.

---

## Decisões técnicas que valem registro

**Locale fixado em `pt-BR`.** A tela de login é traduzida pelo navegador; sem fixar, a suíte
quebraria conforme a máquina.

**Sessão não se valida por URL.** O Fluig serve o login na mesma URL da home; o critério é o
título somado à ausência do formulário.

**Ícones sem nome acessível.** Os da coluna "Ação" são ancorados por `title`. Ver a seção de
acessibilidade no mapa do ambiente — são três ocorrências do mesmo problema, com recomendação
consolidada ao time de desenvolvimento.

**Interceptar muda o comportamento — cuidado ao afirmar defeito.** A proteção antiduplo-clique
desabilita o botão enquanto a criação está em voo. Abortar a requisição faz o widget reabilitar
na hora, e forçar o clique fura a própria trava: as duas coisas produzem vermelho que é artefato,
não defeito. O teste correto **segura a requisição em voo** e afirma sobre o estado real — e com
isso se confirmou que **a proteção funciona**.

**Estado global mutável não paraleliza.** Favoritar processo é estado de conta única e
`describe.serial` não serializa entre repetições do `--repeat-each`. O caso foi removido em vez de
virar flaky.

---

## Backlog — os 30 casos sem teste

Lista completa, com o motivo de cada um, em [`docs/cobertura.md`](docs/cobertura.md). Agrupados:

| Motivo | Casos |
|---|---|
| **Falta usuário de RH** (matrícula ativa no Protheus **e** grupo de RH) | 11 — `CT-DEP` (3), `CT-FER` (5), `CT-SUB` (2), `CT-ADM-01-S2` |
| **Falta credencial de fornecedor** de homologação | 4 — `CT-PFN-02-H` a `CT-PFN-05-H` |
| **Ataque real, que não se executa aqui** (decisão) | 3 — força bruta, XSS, IDOR |
| **Protocolo fora do navegador** | 2 — `CT-GED-03-H/S1`, check-out por `dav4:`/WebDAV |
| **Sem caixa postal** para o token de redefinição | 2 — `CT-AUT-03-S3/S4` |
| **Processo inoperante ou dataset inativo no produto** | 4 — `CT-JUR-05-H`, `CT-OCO-01-H/S1`, `CT-FAT-03-S1` |
| **Massa inexistente na base** | 1 — `CT-ACC-03-S1` (filial órfã) |
| **Consequência de defeito aberto** | 2 — `CT-ACC-03-S3` (D-03 congela o navegador), `CT-ACC-08-H` (D-01 prende a SC) |
| **Não observável sem admin** | 1 — `CT-NOT-01-S1`, datasets de canal invocados server-side |

### Os dois pedidos de provisionamento

**1. Um usuário de teste com matrícula ativa no Protheus e no grupo de RH.** Hoje a conta da
automação abre as telas de RH mas o formulário **nunca monta campo** — Dependentes falha com
*"não foi possível determinar a matrícula do titular"*, Substituição com *"Funcionário não
localizado"*. Férias e Ocorrência barram antes disso, por grupo. Destrava 11 casos.

**2. Uma credencial de fornecedor de homologação.** O Portal do Fornecedor autentica com
CNPJ/CPF/senha, separado da plataforma. Destrava 4 casos.

Os 16 restantes não dependem de provisionamento: são decisão de escopo, limitação de protocolo,
defeito aberto do produto ou massa que não existe na base.

## CI

`.github/workflows/e2e.yml` roda a suíte em push e pull request e publica o relatório HTML e o
JUnit como artefato. Segredos vêm de *repository secrets* — nunca do repositório.
