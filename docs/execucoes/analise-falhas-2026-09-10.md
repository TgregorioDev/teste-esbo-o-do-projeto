# Análise das falhas — execução de 10/09/2026 (relatório HTML recebido)

| | |
|---|---|
| **Execução analisada** | 10/09/2026, 10h38–11h27 (BRT) · relatório HTML do Playwright gerado numa máquina Windows |
| **Ambiente** | `https://caixade213859.fluig.cloudtotvs.com.br` · usuário `TOTVS-FS` (não-admin) |
| **Modo** | 1 worker · só o projeto `e2e` · destrutivos incluídos |
| **Resultado** | **285 testes · 125 verdes · 160 vermelhos** · 0 flaky · 0 pulados |
| **Código** | os 160 títulos que falharam existem idênticos em `80df273` |
| **Re-medição** | 10/09/2026, 11h40–12h20, `PW_WORKERS=3` (repetições isoladas com 2) · **64 dos 160** re-executados, um arquivo de spec por vez, em primeiro plano |
| **Canário antes da re-medição** | formulários da SC e da Cotação **ok**; Portal do Comprador, Gerência e Tracker ok; `getContratos` **20** linhas e `getFornecedores` **300** (às 10h38 eram zero); **Compradores fora** (`error: "undefined"`); **Acompanhamento de Contratos: página não publicada** |

## Leitura em uma frase

Os 160 vermelhos têm **seis causas raiz**. As duas maiores são de ambiente: a página de
Acompanhamento de Contratos **não existe** neste tenant (64 testes), e o formulário da SC abre
**sem o ERP** (30 testes). Pelo critério do gate: **91 são pré-condição ausente**, **67 são
defeitos conhecidos** (66 `@bug` + 1 `@achado`) e **2 aparecem como regressão**, mas já são
defeitos documentados no mapa e só estão sem a tag. Na re-execução à tarde, com o ERP de volta,
**21 dos 64 passaram**, **11 `@bug` reproduziram o defeito**, **26 seguem em pré-condição** e **6
reprovam**. Desses seis, **3 são problemas da própria suíte**, **1 é instabilidade sem veredito**,
e as **2 "regressões"** reproduziram idênticas.

## O que "garantir que passem" significa aqui

Esta suíte tem vermelho intencional, e isso muda a resposta. Um teste `@bug` está escrito contra
o comportamento **esperado**. Deixá-lo verde mudando o teste apaga o registro do defeito, e o
`CLAUDE.md` proíbe isso. Então os 160 se dividem assim:

| Situação | Testes | Fica verde quando | Quem age |
|---|---:|---|---|
| Pré-condição ausente (ambiente, massa, cadastro) | 91 | o ambiente entregar a pré-condição | implantação / infraestrutura |
| `@bug` que **chegou à assertion** (defeito reproduzido) | 40 | o **produto** for corrigido | desenvolvimento (Cassi/TBC ou TOTVS) |
| `@bug`/`@achado` que **caíram antes**, na pré-condição | 27 | primeiro o ambiente; depois ele **deve reprovar pelo defeito**, até o produto ser corrigido | ambiente → desenvolvimento |
| Sem tag, lidos como regressão | 2 | o produto for corrigido; **enquanto isso, levar `@bug`** | desenvolvimento + suíte |

A re-medição revelou **ajustes legítimos na suíte**. Nenhum deles mexe em assertion de defeito:
são corrida de detecção, Page Object preso à Central de Tarefas antiga, espera fixa curta demais
para um tenant lento e verde falso. Estão na seção [Suíte](#suíte--este-repositório).

## Por causa raiz

| # | Causa raiz | Testes | No gate | Re-medição (64 re-executados) | Dono |
|---|---|---:|---|---|---|
| C1 | Página `/portal/p/1/acompanhamentoContrato` **não publicada** (*"Recurso não foi encontrado"*) | 64 | 47 pré-condição · 17 `@bug` | canário ainda **fora**; 4 re-executados: 3 pré-condição, 1 vermelho **da suíte** (`validacoes-faturamento:395`) | implantação |
| C2 | Formulário da SC abre com *"Não foi possível estabelecer comunicação com o ERP"* | 30 | 26 pré-condição · 4 `@bug` | **17 verdes** · 8 pré-condição (a maioria agora **mais adiante**: a SC é criada e não chega à Validação do Gestor) · 3 `@bug` reproduzem · 2 vermelhos (`FSWTBC-4952`, `alcadas:237`) | ambiente |
| C3 | Formulário da Cotação com a mesma faixa do ERP | 3 | 2 pré-condição · 1 `@bug` | **2 verdes** · 1 `@bug` reproduz | ambiente |
| C4 | *"Atuar como"* não renderiza: `TOTVS-FS` não é comprador no ERP (SY1/`Y1_USER`) | 6 | 6 pré-condição | 6 pré-condição | cadastro no Protheus |
| C5 | Filas e massa vazias (pool, Faturamento, RH, Central, SIGAJURI) | 16 | 10 pré-condição · 5 `@bug` · 1 `@achado` | 2 verdes · 9 pré-condição · 4 `@bug` reproduzem · 1 vermelho **da suíte** (`validacoes-faturamento:279`) | ambiente / massa |
| C6 | Defeito de produto já catalogado | 41 | 39 `@bug` · **2 regressão** | 5 re-executados: 3 `@bug` reproduzem · as 2 regressões reproduzem idênticas | desenvolvimento |

Os 96 não re-executados são 60 de C1, porque o canário mostrou a página ainda fora e o veredito
seria o mesmo em 3 s, e 36 `@bug` de C6, cujo defeito não depende de ERP nem de massa.

## Os 6 que ainda reprovam depois da re-medição

| Teste | O que é | Ação |
|---|---|---|
| `validacoes-solicitacao-compras.spec.js:142` — **FSWTBC-4952** | o formulário deste ambiente critica abaixo de **R$ 1,00**; o chamado e o teste dizem **R$ 0,10** | **decisão de regra**: confirmar com o desenvolvedor antes de mexer em qualquer lado |
| `validacoes-faturamento.spec.js:279` — CT-FAT-02-S3 | espera o dropdown "Mais opções" da Central de Tarefas **antiga**, que existe oculto | **suíte** |
| `validacoes-faturamento.spec.js:395` — FSWTBC-2143 | `expectPaginaPublicada()` checa a *Error page* uma vez só, cedo demais; sob carga passa em falso e o teste espera 45 s | **suíte** (protege os 64 do lote C1) |
| `alcadas-orcamentaria.spec.js:237` — CT-E2E-04-H | 3 tentativas, 3 pontos de falha diferentes (select2, diálogo de criação, envio da aprovação) | **instabilidade**, sem veredito; **suíte** deve declarar as esperas sem desfecho como infraestrutura |
| `tests/api/alcada-solicitacao-compras.spec.js:48` — **FSWTBC-5118** | instância 95437 com a alçada no pool `G.P.Requisicao_de_Compras_Validacao_Alcadas` | **produto** · suíte: aplicar `@bug` (mapa, defeito 6) |
| `tests/api/datasets-contratos-fiscais.spec.js:37` — **FSWTBC-4503** | `dsProtheus_getFiscaisPorTipoContrato` → 500 `NullPointerException` (não publicado) | **publicação** · suíte: aplicar `@bug` até publicar (mapa, defeito 5) |

## Plano de ação por dono, em ordem de retorno

### Ambiente e implantação (Cassi + TOTVS Cloud)

1. **`ds_protheus_getMatriculaTitular_rest` → HTTP 500 `WFLYEJB0054: Failed to marshal EJB
   parameters`.** É erro de serialização de EJB no WildFly, do lado Fluig. Derruba a montagem do
   formulário da SC (C2), da Cotação (C3) e, por inferência, dos formulários de RH que resolvem
   matrícula (Dependentes, Substituição de Cargos, Gestão de Equipes). Na execução das 10h38 ficou
   fora em **30 de 30** cargas; à tarde, voltou e ainda falhou numa carga isolada. A oscilação
   vem em janelas de dezenas de minutos, então "repita o teste" precisa ser "repita **depois** de
   um canário verde". Detalhe na Parte B, C2.
2. **Atividade 233 "Grava SC e Anexos".** Mudou hoje: às 10h38 nunca concluía. À tarde a SC 96394
   **concluiu, mas sem número de SC no ERP** e com `erroIntegracao` vazio, que é o defeito
   FSWTBC-621/2022/4639. É o que impede a SC criada de chegar à Validação do Gestor (8 testes
   agora param aí). Levar à integração da SC1/MATA110.
3. **Publicar o Portal de Acompanhamento de Contratos**: componente do widget, página WCM com o
   código `acompanhamentoContrato`, os datasets que ela consome e contrato **Vigente** na base.
   Devolve 64 testes. Passo a passo e dependências na Parte A, "Solução".
4. **Cadastrar `TOTVS-FS` como comprador no Protheus** (SY1, `Y1_USER`). Devolve os 6 de C4 e as
   filas do Portal do Comprador.
5. **Publicar `dsProtheus_getFiscaisPorTipoContrato`** (FSWTBC-4503).
6. **Massa que a automação não cria**: Faturamento aberto pelo Usuário Integrador (disparo das
   01h00), solicitação em atraso, UF no SIGAJURI_Contencioso. Um a um na Parte B, C5.

### Produto (desenvolvimento Fluig Cassi/TBC e plataforma TOTVS)

A Parte C tem a correção por teste, com a referência de plataforma que a sustenta. As famílias:

| Família | Testes | Correção |
|---|---:|---|
| GED aceita qualquer extensão e conteúdo | 5 | evento global `validateUpload` com **allowlist** de extensão e checagem do `WKFileMimeType` (pega o executável renomeado) |
| Segurança: datasets sensíveis, BOLA na API v2, processos administrativos no catálogo | 8 | permissão de dataset, despublicar/restringir `bpm_addUserFluig`, `bpm_addUserGroup` e `teste`; isolamento da API v2 escalado à TOTVS |
| Formulários que enviam sem validação (fail-open) | 7 | validação no cliente **e** no servidor (`validateForm`) — os testes exigem zero `send` |
| Plataforma: deep-link 404, NPS 403, CSS pré-Voyager | 4 | rota/publicação da página; widget recompilado para 2.0 |
| APIs de notificação e favoritos | 4 | TOTVS: `limit`/`offset`, `DELETE` anunciado por `canRemove`, 500 em texto no favorito duplicado, widget que some |
| Portais do Fornecedor e do Comprador | 4 | login 500 com JSON cru, redefinição de senha no `cassi_rest` não publicado, máscara de CNPJ, ordenação |
| Jurídico (SIGAJURI) | 3 | serviço `SIGAJURI` e combos vazios; botão "Novo Envolvido" oculto |
| RH, Saúde e integração Protheus | 4 + 4 re-medidos | Banco de Horas, Clínica vazia, cache `_Sync` em erro, `RA_SITFOLH`; Gestão de Equipes anuncia falha sob "Sucesso:" |
| Alçada em pool | 1 | FSWTBC-5118: atribuição nominal, ou ir para Correção quando `CR_USER` falta (FSWTBC-3957) |

### Suíte — este repositório

Nenhum item abaixo altera a assertion de um `@bug`.

1. **`pages/AcompanhamentoContratosPage.js:61`**: esperar o primeiro de dois estados (heading
   *ou* *"Recurso não foi encontrado"*) antes de decidir. Hoje o `isVisible()` imediato deixa
   teste esperar 45 s e sair como TIMEOUT (`validacoes-faturamento:395`).
2. **`validacoes-faturamento.spec.js:340-360`**: navegar no pool pelas abas da Central de Tarefas
   atual, não pelo dropdown "Mais opções".
3. **`selecionarOpcaoSelect2`** (`pages/CicloCompradorPage.js:497`): aguardar a resposta do dataset
   da busca em vez de 15 s fixos. Explica `alcadas:60` e `:108`, que passaram ou mudaram de causa
   quando isolados.
4. **Esperas sem desfecho** no helper de criação e aprovação (`CicloCompradorPage.js:305` e o envio
   da Validação do Gestor): declarar `faltaPreCondicao('(infraestrutura) …')` com a evidência, como
   `ciclo-solicitacao-compras.spec.js:799` já faz. Hoje saem como TIMEOUT e o gate os lê como
   regressão.
5. **Tag `@bug` em FSWTBC-5118 e FSWTBC-4503**, pelo critério do README (defeitos 5 e 6 do mapa).
   No 4503, retirar a tag quando o dataset for publicado, porque ele é smoke.
6. **`portal-comprador.spec.js:41` é verde falso**: conta `tbody tr > 0`, e a linha *No data found*
   conta. Usar `utils/grade.js`.
7. **`favoritos.spec.js`** morre na âncora de carga (o heading some junto com o widget) antes da
   assertion do defeito. Ancorar em "Meus Apps".
8. **Textos desatualizados**: `ciclo-cotacao.spec.js:170` e `negociacao-proposta.spec.js:133` citam
   instâncias e datas do `caixade182374` e atribuem a fila vazia ao D-01, quando o bloqueio real é
   233 + SY1. Também a contagem "54 testes" no Page Object e a anotação `pre-condicao-ausente`
   duplicada em `substituicao-cargos.spec.js`.
9. **Documentos a atualizar**: `docs/mapa-do-ambiente.md` (contratos 20 e fornecedores 300; a
   oscilação do ERP dura janelas longas) e `docs/massa-de-dados-no-ambiente-dev.md` §4 (a 233 agora
   conclui, sem número no ERP).

### Decisões que não são técnicas

- **FSWTBC-4952**: a regra vigente é R$ 1,00 ou R$ 0,10? Muda catálogo e teste juntos, ou vira `@bug`.
- **A suíte está assumindo a massa semeada.** `assumir-tarefa-pool.spec.js` passou às 11h25
  assumindo uma tarefa de pool que, pelo horário, é uma das SCs semeadas em *236 Correção*
  (inferido). A massa "viva de propósito" está sendo consumida pela própria execução.
- **Fora do escopo das falhas, mas importa**: na execução das 10h38, um `@bug` ficou **verde** — o
  reCAPTCHA da entrada do fornecedor. Ou o defeito foi corrigido, e a tag precisa ser revista, ou o
  teste passou por outro motivo.

## Como confirmar depois de cada correção

```bash
npm run canario                                            # o que está de pé agora (~1 min)
PW_WORKERS=3 npx playwright test tests/e2e/compras         # C2/C3 — um diretório por vez
PW_WORKERS=3 npx playwright test tests/e2e/portais
PW_WORKERS=3 npx playwright test tests/e2e/acompanhamento-contratos   # quando a página existir
npx playwright test --grep @bug                            # defeitos: vermelho até o produto mudar
```

Vermelho de C2/C3 só é conclusivo se o canário estava verde **na hora**. Um `@bug` que ficar verde
é boa notícia a confirmar, não teste a consertar.

## Como este documento está organizado

- **Parte A** — os 64 testes do Portal de Acompanhamento de Contratos (C1)
- **Parte B** — os 55 testes de ERP, "Atuar como", filas e massa (C2–C5)
- **Parte C** — os 41 testes de defeito de produto e as 2 regressões (C6)

Cada teste tem um bloco com: o que verifica, por que falhou nesta execução, como solucionar e quem
é o dono, quando fica verde e o que passa a provar, e, para os 64 re-executados, o resultado da
**re-medição**. As afirmações de plataforma citam `fluig-master/references/*` (TDN) ou
`cassi-fluig-master/references/*` (medição de campo). O que é dedução está marcado **(INFERIDO)**.

---


## Lote A — Portal de Acompanhamento de Contratos não publicado (causa `C1-portal-acompanhamento-nao-publicado`)

**64 testes** desta execução (10/09/2026 10:38–11:27 BRT, 1 worker, projeto `e2e`, tenant `caixade213859`) caíram na mesma pré-condição: **47** classificados pelo gate como `pre-condicao` e **17** como `conhecido-bug` (`@bug`). Todos os 64 estão distribuídos em 17 arquivos de spec — 11 do diretório `tests/e2e/acompanhamento-contratos/`, 2 de `tests/e2e/contratos/`, 2 de `tests/e2e/seguranca/` e 2 de `tests/e2e/plataforma/`.

---

### Causa comum

#### O mecanismo, lido do código

1. Todo teste do lote começa navegando ao portal — direta ou indiretamente. O caminho normal é a fixture `contratosPage` (instância de `pages/AcompanhamentoContratosPage.js`) e a chamada `contratosPage.goto()`:

   ```js
   // pages/AcompanhamentoContratosPage.js:42-45
   async goto() {
     await this.page.goto(ROTA_PORTAL_CONTRATOS, { waitUntil: 'domcontentloaded' });
     await this.expectPaginaPublicada();
   }
   ```

   `ROTA_PORTAL_CONTRATOS` é `/portal/p/1/acompanhamentoContrato` (`config/ambiente.js:26`).

2. `expectPaginaPublicada()` (linhas 61-75) procura na página o texto **"Recurso não foi encontrado"** — o corpo da *Error page* do Fluig. Se está visível, chama `faltaPreCondicao('(ambiente): a página … não está publicada neste ambiente — o Fluig responde "Recurso não foi encontrado". …')`.

3. `faltaPreCondicao` (`utils/pre-condicao.js:68`) faz duas coisas: anota `pre-condicao-ausente` no `test.info()` e lança `Error('PRÉ-CONDIÇÃO AUSENTE (ambiente): …')`. É a anotação — não o texto — que `scripts/veredito-do-gate.mjs` lê para classificar o vermelho como **ambiente**. Por isso 62 dos 64 testes reportam `passo: null` e duração de **2,8 a 5,6 s**: morrem no `goto()`, antes de qualquer `test.step`, antes de `expectCarregada()`, antes de `descobrirContratoVigente()` (`utils/massa-contratos.js`), antes de abrir modal, antes da guarda de criação e antes da captura de payload.

4. Dois testes chegaram ao mesmo diagnóstico por caminho próprio, e por isso têm `passo` preenchido:
   - `tests/e2e/plataforma/erros-de-console.spec.js:176` não usa o Page Object; navega e afirma `toHaveTitle('Cassi - Fluig Plataforma - Acompanhamento de Contratos')`. Recebeu **`"Cassi - Fluig Plataforma - Error page"`** durante os 30 s do timeout (62 tentativas do locator) e só então converteu em `PRÉ-CONDIÇÃO AUSENTE` — daí os **34,3 s**, contra ~3 s dos demais.
   - `tests/e2e/seguranca/integracao-protheus-grade-contratos.spec.js:19` estava com um `waitForResponse` do dataset da grade em voo (`passo: Wait for event "response"`) quando o `goto()` lançou.

#### Por que é ambiente e não regressão

- O título e o corpo devolvidos são os da página de erro genérica do Fluig ("Error page" / "Recurso não foi encontrado"). Em `docs/mapa-do-ambiente.md` (seção *TROCA DE AMBIENTE — 09/09/2026*, tabela *O que não existe mais*) isso foi medido e diferenciado: **não é rota renomeada** (12 variações do código da página tentadas, todas Error page) e **não é permissão** — falta de permissão neste portal produz "Acesso negado" / "Você não possui permissão para acessar o Acompanhamento de Contratos", que o próprio Page Object modela (`avisoAcessoNegado`, `alertaAcessoNegado`, linhas 31-34) e que os testes `CT-ACC-01-S1/S2` exercitam.
- O canário (`npm run canario`, `scripts/canario-do-ambiente.mjs:55-60`) usa exatamente o mesmo sinal de queda (`/Recurso não foi encontrado/`) e às ~12h de 10/09 continuava reportando **PÁGINA NÃO PUBLICADA** para esta rota, enquanto `dsProtheus_getContratos_restGetAll` já devolvia 20 linhas e Fornecedores 300 (às 10:38, hora da execução, ambos eram zero). Ou seja: a integração com o Protheus está voltando, mas a **tela** que a suíte usa não existe no tenant.
- Os títulos dos 64 testes existem idênticos no código atual; nenhum foi editado entre a execução e esta análise. O código de detecção foi escrito em 09/09/2026 justamente para que esse lote reprove em segundos com o motivo certo, em vez de 45 s de timeout cada (comentário em `AcompanhamentoContratosPage.js:47-60`).
- No ambiente anterior (`caixade182374`) a mesma família estava fechada e verde — a lista de chamados que "caíram para PRÉ-CONDIÇÃO AUSENTE" na troca está em `docs/viabilidade-no-ambiente-213859.md`, seção *O custo da troca, em número* (4068, 4073, 4076, 4078, 4820, 4982, 4983, 4986, 4987, 5233, 4581…).

#### Solução — o que precisa acontecer no ambiente (dono: implantação Cassi/TOTVS, não a automação)

O portal é uma **página WCM** (`/portal/p/1/<código da página>`) que hospeda um **widget** customizado — grade DataTables alimentada por `dsProtheus_getContratosxFornecedores_restGet`, com modais de Solicitação de Compra, Informações Complementares e Planilhas (`docs/mapa-do-ambiente.md`, seções *Datasets* e *Portal de Acompanhamento de Contratos*). Para a página existir no `caixade213859` são necessárias quatro coisas, nesta ordem:

**1. Publicar o componente do widget no tenant.** Segundo `fluig-master/references/widgets-wcm.md`, um widget WCM é um componente Java web (`wcm/widget/<código>`, com `application.info`, `view.ftl`, `jboss-web.xml`) que precisa ser **deployado na plataforma** antes de poder ser adicionado a uma página. Três regras da mesma referência decidem se o deploy funciona:
   - nome do widget = `context-root` do `jboss-web.xml` = `application.code` do `application.info`, e esse nome tem de ser **único na plataforma** (duplicidade "causa problema no deploy dos componentes");
   - `application.uiwidget=true`, senão o widget existe mas **não aparece na lista** para adicionar à página (também em `armadilhas.md`, linha 60);
   - o artefato deve vir **do fonte/repositório da fábrica ou do pacote deployado no `caixade182374`** — o Fluig Studio importa do servidor dataset, formulário, evento, processo e relatório (`studio-e-deploy.md`, *Artefatos direto do servidor*), mas **não lista widget nem página** entre os importáveis. Logo, quem publica precisa do projeto do widget (ou do WAR), não de um "importar do servidor antigo". (INFERIDO: se a fábrica mantém o widget no padrão TBC Angular + PO-UI, `wg_*`, o pacote de build é o mesmo que o `/fluig:deploy` usa — modo SSH ou REST, `studio-e-deploy.md`, *Deploy — a prática TBC*.)

**2. Criar e publicar a página `acompanhamentoContrato` no WCM.** Fluxo da referência `widgets-wcm.md` (*Anatomia*): *Página → Layout → Slot → Widget*; "menu de configuração → Editar página → selecionar slot → Adicionar uma nova widget → configurar → **Publicar página**". O código da página tem de ser exatamente `acompanhamentoContrato` — é ele que compõe a URL que a suíte, o menu e os favoritos usam. Isto exige perfil de administrador do tenant: a conta da automação não o tem (`/pageadmin` responde Error page para ela — `docs/viabilidade-no-ambiente-213859.md`, item 9). (INFERIDO: se a versão do WCM oferecer exportação/importação de página em pacote, é o caminho mais fiel para trazer parâmetros do widget do ambiente antigo; a referência não confirma esse recurso, então trato-o como hipótese a verificar com quem administra o tenant.)

**3. Garantir que os datasets que a página consome existam e respondam no tenant.** Lista medida em `docs/mapa-do-ambiente.md` (*Datasets*):
   - na carga: `colleagueGroup` (nativo), `dsProtheus_getTipoContratos_restGetAll`, `dsProtheus_getCampoCombo_restGetAll`, `dsProtheus_getContratosxFornecedores_restGet` (a grade);
   - no modal de SC: `dsProtheus_getBranches_restGetAll`, `dsProtheus_getItensPlanilha_restGetAll`, `dsProtheus_getProdutos_restGetAll`, `dsProtheus_getRateiosContratos_restGetAll`, `dsProtheus_getCentroCusto_restGetAll`, `dsFluig_getClasseValor`, `dsProtheus_getPrecoHistorico`; e, após o start, `dsFluig_postProcessesTransfer` (transferência da tarefa ao solicitante, `utils/captura-payload.js`);
   - nas fichas: a segunda fase de carga ("Buscando…", `AcompanhamentoContratosPage.js:214-237`) resolve fiscal e CNPJ — o mapa registra que **`dsProtheus_getFiscaisPorTipoContrato` responde 500 neste tenant** (*Defeitos deste ambiente*, item 5). (INFERIDO: é esse dataset que preenche "Fiscal de Contrato / Fiscal de Serviço" da ficha; se for, o teste FSWTBC-1702/4987 continuará dependente dele mesmo com a página no ar.)
   Datasets **são** importáveis/exportáveis pelo Studio (`studio-e-deploy.md`: *Importar dataset do servidor Fluig* → *Exportar para o servidor Fluig*, marcando **Novo Dataset** na primeira publicação). Os `dsProtheus_*` são wrappers REST sobre o ERP: dependem do serviço REST do Protheus cadastrado no Fluig do tenant — e o canário mostrou que a integração está **parcial e intermitente** (`docs/mapa-do-ambiente.md`, *O ERP dos formulários é INTERMITENTE*).

**4. Ter massa de contrato utilizável no Protheus ligado ao tenant.** A grade lê `dsProtheus_getContratosxFornecedores_restGet`, e a suíte escolhe em runtime um contrato com situação **"Vigente"** (`utils/massa-contratos.js:67, 220-228`), com número inequívoco na busca por substring (linhas 154-164), e — conforme o teste — com planilha, itens com quantidade, rateio fechando 100 %, valores monetários preenchidos. Por `cassi-fluig-master/references/gestao-de-contratos-protheus.md` (seção 5), um contrato só é "Vigente" depois de *Outras Ações > Situação = 05 – Vigente* **e** aprovação do gestor de contratos; "Em elaboração"/"Em aprovação" não aparece como massa útil. A automação **não cria contrato** — verificado em `docs/criacao-de-contrato-inviavel.md`. Às 12h de 10/09 `getContratos_restGetAll` tinha 20 linhas: é um começo, mas a grade usa outro dataset e a suíte exige vigência, então o número útil só se conhece abrindo a página.

**Quem é o dono:** ambiente/implantação (Cassi + TOTVS Cloud/fábrica que mantém o widget). Nada aqui é ação da suíte: a suíte já detecta, classifica e reporta corretamente.

#### O que a suíte deve checar depois que a página for publicada

1. `npm run canario` — a linha *Acompanhamento de Contratos* precisa sair `ok` (sinal de vida `/Mostrando de \d+|Acompanhamento de Contratos/`), e *Contratos* / *Fornecedores* com linhas > 0.
2. Em primeiro plano, com a concorrência medida para este tenant:
   ```bash
   PW_WORKERS=3 npx playwright test tests/e2e/acompanhamento-contratos
   PW_WORKERS=3 npx playwright test tests/e2e/contratos
   PW_WORKERS=3 npx playwright test tests/e2e/seguranca/integracao-protheus-grade-contratos.spec.js tests/e2e/seguranca/lgpd-envio-google-analytics.spec.js
   PW_WORKERS=3 npx playwright test tests/e2e/plataforma/smoke-integracao-erp.spec.js
   PW_WORKERS=3 npx playwright test tests/e2e/plataforma/erros-de-console.spec.js -g "Acompanhamento de Contratos"
   ```
   Se estourar o limite da ferramenta, fatiar por arquivo ou por `-g`.
3. Leitura esperada: os **47 `pre-condicao`** devem ficar verdes **ou** cair numa pré-condição *mais específica* (grade sem linha, nenhum vigente, contrato sem planilha, sem situação truncada…) — todas já escritas com `faltaPreCondicao` e listadas bloco a bloco abaixo. Os **17 `@bug`** devem passar a **reprovar na assertion do defeito** (D-01, D-02, D-04, D-08, D-11, CT-ACC-04-S5, classeValor, CT-CMP-08-H, U-11); se algum ficar verde, o defeito foi corrigido no produto e a tag precisa ser revista — não o contrário.
4. Antes de qualquer leitura de determinismo, aplicar o protocolo de `docs/estabilidade-do-ambiente.md` (a grade sustentando o volume em amostras seguidas), porque o ERP deste tenant alterna.

#### O que a suíte pode melhorar (achados de leitura do código, sem urgência)

- **Contagem desatualizada na mensagem de diagnóstico.** `AcompanhamentoContratosPage.js:56` diz "54 testes"; o canário (`canario-do-ambiente.mjs:57`) diz "~61"; esta execução mediu **64** (o número cresceu com `modais-do-contrato.spec.js`, os FSWTBC-4898/4073/4986 e os de faturamento). Vale citar o diretório em vez de um número, ou regenerar o número junto com `npm run cobertura`.
- **`erros-de-console.spec.js` não reaproveita a detecção do Page Object** e por isso paga 30 s de `toHaveTitle` antes de declarar a pré-condição. Chamar `expectPaginaPublicada()` (ou checar `/Recurso não foi encontrado/`) logo após o `goto` deixaria o veredito em ~3 s, como nos outros 63.
- **O canário sonda `dsProtheus_getContratos_restGetAll`, mas a grade consome `dsProtheus_getContratosxFornecedores_restGet`.** Quando a página voltar, um "Contratos: ok" no canário não garante linha na grade. (INFERIDO) Incluir o dataset da grade — com os mesmos constraints que o widget envia — tornaria o canário fiel ao que a suíte de fato usa.
- **`docs/mapa-do-ambiente.md` (TROCA DE AMBIENTE) ainda afirma "zero linhas" para `getContratos`/`getFornecedores`**; a medição das 12h de 10/09 (20 e 300) já contradiz. Atualizar a seção evita que o próximo leitor atribua vermelho de contrato a "não há massa" quando o problema é só a página.

---

### Testes, arquivo a arquivo

Convenção dos blocos: *Classe no gate* é o que `scripts/veredito-do-gate.mjs` atribuiu nesta execução; *Duração* é a medida no relatório. "Por que falhou" é o mesmo em todos — `goto()` → `expectPaginaPublicada()` → `PRÉ-CONDIÇÃO AUSENTE (ambiente)` — e por isso aparece resumido; o detalhe está na *Causa comum*.

#### tests/e2e/acompanhamento-contratos/acesso-portal.spec.js

Casos CT-ACC-01: o portal libera o painel conforme os grupos do usuário lidos de `colleagueGroup`. Os cenários negativos interceptam esse dataset com `responderDatasetCom`/`derrubarDataset` (`utils/dataset-fluig.js`), porque não há usuário sem grupo provisionado nem como derrubar o serviço do cliente. (O quinto teste do arquivo, "deve exigir autenticação ao abrir o portal sem sessão", **passou**: sem sessão o Fluig serve a tela de Login antes de resolver a página — não está neste lote.)

##### CT-ACC-01-H — deve listar os contratos para usuário com o grupo de acesso
- **Local:** `tests/e2e/acompanhamento-contratos/acesso-portal.spec.js:16` · **Classe no gate:** pre-condicao · **Duração:** 3,3 s
- **O que o teste verifica:** usuário com grupo autorizado vê o heading "Acompanhamento de Contratos", a linha de informação do DataTables no formato `Mostrando de 1 até N de N registros`, o campo Pesquisar, e **nenhum** aviso de acesso negado. Não fixa o total de contratos (varia com a base).
- **Por que falhou:** `goto()` detectou "Recurso não foi encontrado" → `PRÉ-CONDIÇÃO AUSENTE (ambiente): a página /portal/p/1/acompanhamentoContrato não está publicada neste ambiente`.
- **Como solucionar:** Ambiente — publicar widget + página (Causa comum, passos 1-2); a conta `TOTVS-FS` precisa continuar nos grupos que o widget aceita.
- **Quando fica verde e o que ele passa a provar:** é o smoke do portal: página publicada, permissão resolvida por `colleagueGroup`, grade montada com pelo menos 1 registro (`dsProtheus_getContratosxFornecedores_restGet` respondendo). Se a grade vier vazia o teste reprova no `toHaveText(/Mostrando de 1 até \d+/)` — aí é massa, não página.

##### CT-ACC-01-H — deve apresentar as colunas do contrato na ordem definida pelo negócio
- **Local:** `acesso-portal.spec.js:32` · **Classe no gate:** pre-condicao · **Duração:** 3,3 s
- **O que o teste verifica:** os `columnheader` da grade contêm Filial, Tipo Contrato, Contrato, Data Inicio, Data Fim, Nº Revisão, Status, Fornecedor e Ação (o teste afirma presença de cada coluna, não a ordem estrita, apesar do título).
- **Por que falhou:** mesma pré-condição, no `goto()`.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** que o widget publicado no tenant novo é o mesmo layout de grade do anterior — cabeçalhos idênticos. Se a fábrica publicar uma versão diferente do widget, este é o primeiro teste a acusar a diferença de composição.

##### CT-ACC-01-S1 — deve negar o acesso ao painel para usuário fora dos grupos autorizados
- **Local:** `acesso-portal.spec.js:58` · **Classe no gate:** pre-condicao · **Duração:** 2,9 s
- **O que o teste verifica:** com `colleagueGroup` respondendo `values: []` (usuário sem nenhum grupo), o portal exibe o aviso no corpo ("Você não possui permissão para acessar o Acompanhamento de Contratos") **e** o alerta "Acesso negado", e não monta a grade (`toHaveCount(0)` na linha de informação).
- **Por que falhou:** a interceptação foi instalada, mas a página não existe — o `goto()` lançou antes de o widget chamar qualquer dataset.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** que o controle de acesso do widget está ativo neste tenant — e, de quebra, confirma o critério usado para distinguir "não publicada" (Error page) de "sem permissão" (Acesso negado) no diagnóstico deste lote.

##### CT-ACC-01-S2 — deve distinguir falha na validação de permissão de ausência de permissão
- **Local:** `acesso-portal.spec.js:77` · **Classe no gate:** pre-condicao · **Duração:** 3,1 s
- **O que o teste verifica:** com `colleagueGroup` respondendo HTTP 500, o portal mostra "Falha ao validar suas permissões" / "Falha ao validar acesso" — e **não** "Acesso negado". Indisponibilidade comunicada como falta de permissão mandaria o suporte procurar grupo quando o problema é serviço.
- **Por que falhou:** mesma pré-condição, no `goto()`.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** que o widget trata erro do dataset de permissão como erro, não como negativa — comportamento já confirmado no `caixade182374`.

#### tests/e2e/acompanhamento-contratos/grade-contratos.spec.js

Casos CT-ACC-02 e três chamados (FSWTBC-4898, 4073, 4986) sobre a grade. Cinco testes são leitura pura; o sexto é `@bug` (D-08). Todos dependem de `lerLinhasDaGrade()`/`descobrirContratoVigente()`, que só rodam depois de `expectCarregada()`.

##### CT-ACC-02-H — deve oferecer Planilha, Solicitação de Compra e Informações na linha do contrato
- **Local:** `grade-contratos.spec.js:22` · **Classe no gate:** pre-condicao · **Duração:** 2,9 s
- **O que o teste verifica:** após filtrar por um contrato vigente escolhido em runtime, os três ícones da coluna Ação (`title` = Planilha / Solicitação de Compra / Informações do Contrato — âncoras sem nome acessível, ver CLAUDE.md) estão visíveis.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum, passos 1-4 — este já precisa de contrato **Vigente** na grade).
- **Quando fica verde e o que ele passa a provar:** que a linha filtrada expõe as três ações; se não houver vigente, cai em `PRÉ-CONDIÇÃO AUSENTE: a grade trouxe N contrato(s), mas nenhum vigente` (`massa-contratos.js:222`).

##### deve filtrar a grade pelo número do contrato
- **Local:** `grade-contratos.spec.js:36` · **Classe no gate:** pre-condicao · **Duração:** 3,2 s
- **O que o teste verifica:** o campo Pesquisar restringe a grade a `Mostrando de 1 até 1 de 1 registros (Filtrados de N registros)` para um contrato cujo número é inequívoco na busca por substring (`identificaLinhaUnica`, `massa-contratos.js:154`).
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** filtro do DataTables funcional e a premissa da suíte inteira (filtrar → agir sobre "a linha") sustentada no tenant novo.

##### FSWTBC-4898 — toda linha da grade oferece as três ações do contrato
- **Local:** `grade-contratos.spec.js:53` · **Classe no gate:** pre-condicao · **Duração:** 4,3 s
- **O que o teste verifica:** o chamado é sobre linhas **sem** o ícone de Planilha (contrato sem planilha, filial órfã). O teste conta as âncoras por `title` na grade inteira e exige `planilha = solicitacao = informacoes = nº de linhas`; anota `acoes-por-linha`.
- **Por que falhou:** `goto()` → pré-condição da página. (Tem `faltaPreCondicao` própria para grade vazia na linha 61 — não chegou a ela.)
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** que a correção do FSWTBC-4898 vale para **toda** a base carregada no tenant, não só para a primeira linha. Atenção à paginação: conta só as linhas renderizadas na página atual do DataTables.

##### FSWTBC-4073 — a grade não lista o mesmo contrato da mesma filial duas vezes
- **Local:** `grade-contratos.spec.js:102` · **Classe no gate:** pre-condicao · **Duração:** 3,4 s
- **O que o teste verifica:** unicidade do par **(filial, contrato)** na grade — não do número sozinho, que legitimamente se repete entre filiais (comentário das linhas 86-101: grade com 845 linhas sem repetição; dataset com 963 e 9 números repetidos). A contagem de repetidos entre filiais vai para a anotação `unicidade-da-grade`, não para assertion.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** que o widget continua deduplicando o dataset por (filial, contrato) neste tenant. Se o `dsProtheus_getContratosxFornecedores_restGet` do Protheus novo trouxer o mesmo par duas vezes e o widget repassar, reprova — e aí é defeito (widget ou dataset), não ambiente.

##### FSWTBC-4986 — filtrar pela filial restringe a grade às linhas daquela filial
- **Local:** `grade-contratos.spec.js:141` · **Classe no gate:** pre-condicao · **Duração:** 3,0 s
- **O que o teste verifica:** o Pesquisar **restringe**, não só reordena: filtrando por um código de filial numérico descoberto na própria grade, sobra > 0 linha e **toda** linha restante contém o termo em alguma coluna. Anota `filtro-por-filial`.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** a correção do FSWTBC-4986 no tenant novo. Pré-condição secundária própria: precisa de ao menos uma linha com filial `^\d{3,5}$` (linha 154-159), o que com as 71 filiais medidas não deve faltar.

##### CT-ACC-02-S1 @bug — deve exibir a situação do contrato por extenso, sem truncar
- **Local:** `grade-contratos.spec.js:182` · **Classe no gate:** conhecido-bug · **Duração:** 3,3 s
- **O que o teste verifica:** defeito **D-08** (README, tabela de defeitos; `docs/mapa-do-ambiente.md`, *Defeitos confirmados em campo*): a coluna Status mostra `Finali`, `Paralisa`, `Sol.Finali`, `Cancel.` — só "Vigente" sai inteiro. O teste lê `lerStatusExibidos()` e exige que toda situação pertença a `SITUACOES_LEGIVEIS` (Em digitação, Vigente, Paralisado, Sol. Finalização, Finalizado, Revisão, Cancelado).
- **Por que falhou:** **não chegou à assertion do defeito** — morreu no `goto()`, na pré-condição da página. O veredito sobre o D-08 nesta base continua **em aberto**: o vermelho desta execução não confirma nem refuta o defeito.
- **Como solucionar:** Ambiente para destravar (Causa comum). O defeito em si é **Produto**.
- **Quando fica verde e o que ele passa a provar:** após a publicação ele deve **reprovar** no `expect(truncados).toEqual([])` enquanto o D-08 persistir — desde que a grade tenha ao menos um contrato não-vigente (só "Vigente" cabe sem corte; grade só com vigentes deixa o teste verde por acidente, que é a armadilha registrada no teste irmão de `modais-do-contrato.spec.js:172-175`). Correção de produto: o teste irmão mediu que a ficha repete o corte, logo **o valor já chega truncado do dataset**, não é CSS (INFERIDO: campo de descrição da situação — `CN9_SITUAC` traduzido — com tamanho curto no dataset `dsProtheus_getContratosxFornecedores_restGet` ou na tabela/`X3_TAMANHO` do Protheus que o alimenta; a correção mora no dataset/ERP, não no widget). Só quando o produto for corrigido este teste fica verde por mérito.

#### tests/e2e/acompanhamento-contratos/modais-do-contrato.spec.js

Modais da coluna "Ação": *Informações Complementares do Contrato*, *Informações da Planilha* e *Detalhes da Planilha*. Tudo leitura. O helper `abrirContrato()` (linhas 46-52) faz `goto()` → `expectCarregada()` → `descobrirContratoVigente()` → `filtrarPorContrato()`. Três fatos do ambiente anterior governam o desenho (cabeçalho do arquivo): `Escape` não fecha os modais, eles empilham, e a ficha usa `-` para vazio — por isso as assertions são sobre **valor**, nunca `toBeVisible()`.

##### CT-ACC-02-H — a ficha abre para a linha filtrada e identifica o MESMO contrato da grade
- **Local:** `modais-do-contrato.spec.js:55` · **Classe no gate:** pre-condicao · **Duração:** 3,0 s
- **O que o teste verifica:** o modal "Informações Complementares do Contrato" mostra `Número do Contrato` e `Filial` iguais à linha filtrada (protege contra o modal abrir sempre o mesmo registro, defeito que já ocorreu com filtro por coluna) e tem > 90 rótulos (protege contra "visível, mas vazio" quando o dataset da ficha não responde).
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum, incl. o dataset da ficha e um contrato vigente).
- **Quando fica verde e o que ele passa a provar:** coerência linha → ficha no tenant novo. Segunda fase de carga ("Buscando…") precisa resolver em até 30 s (`aguardarCargaCompleta`).

##### a ficha traz Fiscal de Contrato e Fiscal de Serviço identificados (FSWTBC-1702, FSWTBC-4987)
- **Local:** `modais-do-contrato.spec.js:77` · **Classe no gate:** pre-condicao · **Duração:** 3,1 s
- **O que o teste verifica:** os dois campos existem na ficha e, quando preenchidos, seguem o formato `Nome (email)` — os chamados reclamam de nome sem e-mail e vice-versa.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum). Atenção: `docs/mapa-do-ambiente.md` registra que **`dsProtheus_getFiscaisPorTipoContrato` responde 500** neste tenant (o defeito do FSWTBC-4503). (INFERIDO) Se esse for o dataset que alimenta os dois campos, mesmo com a página publicada a ficha pode ficar em "Buscando…" e o teste cair no timeout de `aguardarCargaCompleta` — aí o próximo vermelho é dataset, não página.
- **Quando fica verde e o que ele passa a provar:** fiscais identificáveis na ficha, com e-mail. Se ambos vierem `-` o teste passa sem exercitar o formato — leitura que vale registrar como observação, não como cobertura.

##### os valores do contrato saem com máscara monetária pt-BR (FSWTBC-4982)
- **Local:** `modais-do-contrato.spec.js:99` · **Classe no gate:** pre-condicao · **Duração:** 3,3 s
- **O que o teste verifica:** Valor Inicial, Valor Atual, Saldo e Medição Acumulada, quando preenchidos, casam com `R$ 1.234,56` (`MOEDA_BR`). Tem `faltaPreCondicao` própria se os quatro vierem `-`.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum, passo 4: contrato vigente **com valor** — `Vl. Cont` / `Vl Hist Cont` da aba EMPRESA, `gestao-de-contratos-protheus.md`, seção 2).
- **Quando fica verde e o que ele passa a provar:** a correção do FSWTBC-4982 (máscara) no widget publicado aqui.

##### o fornecedor é identificado com CNPJ mascarado e código com loja (FSWTBC-4983, FSWTBC-4076)
- **Local:** `modais-do-contrato.spec.js:126` · **Classe no gate:** pre-condicao · **Duração:** 3,6 s
- **O que o teste verifica:** `CNPJ do Fornecedor` no formato `99.999.999/9999-99` e `Cód. Fornecedor` trazendo código **e loja** (`26628497 / 0001`). Pré-condição própria: CNPJ preenchido.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum). Depende também de `dsProtheus_getFornecedores_restGetAll`/cadastro SA2 no Protheus do tenant — às 10:38 estava em zero linhas, às 12h em 300.
- **Quando fica verde e o que ele passa a provar:** os dois chamados de identificação do fornecedor continuam atendidos no tenant novo.

##### a ficha expõe a superfície de integração com o ERP (Status da Integração GCT e Erro de Integração)
- **Local:** `modais-do-contrato.spec.js:147` · **Classe no gate:** pre-condicao · **Duração:** 3,2 s
- **O que o teste verifica:** os rótulos `Status da Integração GCT` e `Erro de Integração` existem na ficha (única superfície do Fluig onde o resultado da integração de um contrato aparece); anota os valores em `integracao-gct`.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** que o widget publicado é a versão que expõe o diagnóstico de integração — e a anotação passa a registrar, por execução, o status GCT do contrato escolhido.

##### CT-ACC-02-S1 @bug — a situação do contrato também vem truncada DENTRO da ficha, não só na grade
- **Local:** `modais-do-contrato.spec.js:166` · **Classe no gate:** conhecido-bug · **Duração:** 3,2 s
- **O que o teste verifica:** o mesmo D-08, medido na ficha: escolhe **deliberadamente** um contrato cuja situação já aparece truncada na grade (não usa `descobrirContratoVigente`, que só devolve "Vigente" e deixaria o teste verde sem exercitar nada) e exige que `campos['Status']` esteja em `SITUACOES_LEGIVEIS`. Medido em 08/09 no `0000-2025-2501-`: grade "Finali", ficha "Finali" — o corte vem do dataset, não do CSS.
- **Por que falhou:** **não chegou à assertion do defeito** — `goto()` lançou a pré-condição da página. O D-08 na ficha continua **sem veredito** nesta base.
- **Como solucionar:** Ambiente para destravar; o defeito é **Produto** (dataset/ERP, ver bloco CT-ACC-02-S1 de `grade-contratos.spec.js`).
- **Quando fica verde e o que ele passa a provar:** após publicação, deve **reprovar** no `toContain(campos['Status'])` enquanto o D-08 existir. Se a grade do tenant só tiver vigentes, cai na `faltaPreCondicao` da linha 182 ("nenhum contrato da grade está com a situação truncada") — que é o desfecho honesto, não um verde. Verde por mérito só com o dataset devolvendo a descrição inteira.

##### a lista de planilhas do contrato abre com as colunas do negócio (FSWTBC-4068, FSWTBC-4078)
- **Local:** `modais-do-contrato.spec.js:206` · **Classe no gate:** pre-condicao · **Duração:** 3,3 s
- **O que o teste verifica:** o modal "Informações da Planilha" tem exatamente as colunas Filial, Contrato, Planilha, Revisão, Cod. Fornecedor, Fornecedor, Loja Forn., Ações (nessa ordem) e toda planilha listada pertence ao contrato filtrado. Pré-condição própria se o contrato não tiver planilha.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum; contrato vigente com ao menos uma planilha — `gestao-de-contratos-protheus.md`, seção 3).
- **Quando fica verde e o que ele passa a provar:** layout e escopo da lista de planilhas no tenant novo.

##### o detalhe da planilha é coerente com a linha escolhida e traz tipo, valor e saldo
- **Local:** `modais-do-contrato.spec.js:244` · **Classe no gate:** pre-condicao · **Duração:** 3,2 s
- **O que o teste verifica:** "Detalhes da Planilha" (aberto por cima da lista) mostra o mesmo contrato e a mesma planilha da linha clicada, expõe Tipo da Planilha, Valor Total e Saldo, e Valor Total (quando preenchido) vem mascarado. Anota `saldo-da-planilha` (planilha sem medição traz `-`, observação para o dono do produto).
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum; contrato com planilha).
- **Quando fica verde e o que ele passa a provar:** coerência lista → detalhe e presença dos campos que os chamados de medição citam (Padrão × Semifixo decide se Quantidade é editável na medição — `medicao-e-faturamento.md`, Passo 2).

##### FSWTBC-4820 — o detalhe da planilha vem com valor nos campos de identificação, não em branco
- **Local:** `modais-do-contrato.spec.js:295` · **Classe no gate:** pre-condicao · **Duração:** 5,6 s
- **O que o teste verifica:** os sete campos de identificação (Filial do Sistema, Numero do Contrato, Numero da Planilha, Tipo da Planilha, Codigo do Fornecedor, CNPJ Fornecedor, Nome Fornecedor) **não** vêm vazios nem `-` — é o sintoma exato do chamado ("dados da planilha não são carregados"); CNPJ mascarado. Anota `detalhe-da-planilha`.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum; contrato com planilha; datasets de planilha/fornecedor respondendo).
- **Quando fica verde e o que ele passa a provar:** que a correção do FSWTBC-4820 está no widget publicado e que os datasets de planilha deste tenant devolvem a chave da planilha.

#### tests/e2e/acompanhamento-contratos/modal-solicitacao-compra.spec.js

CT-ACC-03-H, o caso-âncora do pedido do desenvolvedor: abertura do modal de Solicitação de Compra a partir da linha do contrato. Todos os testes instalam `bloquearCriacaoDeSolicitacao` (`utils/guarda-criacao.js`) no `beforeEach` — nenhum escreve.

##### deve abrir o modal já vinculado ao contrato de origem
- **Local:** `modal-solicitacao-compra.spec.js:19` · **Classe no gate:** pre-condicao · **Duração:** 3,1 s
- **O que o teste verifica:** clicar "Solicitação de Compra" na linha filtrada abre o dialog com `campoContrato` já valendo o número do contrato escolhido.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** o vínculo contrato → SC no ponto de entrada que difere do formulário em branco de `wf_solicitacao_compras`.

##### deve impedir a digitação do número do contrato no modal
- **Local:** `modal-solicitacao-compra.spec.js:36` · **Classe no gate:** pre-condicao · **Duração:** 2,9 s
- **O que o teste verifica:** `campoContrato` é `disabled` — quem escolhe o contrato é a linha da grade, não o usuário (é a premissa que o `@bug` CT-ACC-04-S5 explora forçando o campo via JS).
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** a trava de UI continua no widget publicado.

##### deve abrir o modal com os campos do solicitante em branco
- **Local:** `modal-solicitacao-compra.spec.js:50` · **Classe no gate:** pre-condicao · **Duração:** 4,6 s
- **O que o teste verifica:** Motivo, Data de Necessidade e Tipo abrem vazios — sem resíduo de abertura anterior.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** estado inicial limpo do modal.

##### deve oferecer os tipos contratuais de solicitação
- **Local:** `modal-solicitacao-compra.spec.js:65` · **Classe no gate:** pre-condicao · **Duração:** 3,0 s
- **O que o teste verifica:** guardião do catálogo: as opções **selecionáveis** do combo Tipo de Solicitação são exatamente `[Aditivo Contratual, Nova Contratação]` (composição confirmada como intencional pela Cassi em 31/08/2026) e o placeholder "Selecione..." existe (verificado por presença, porque o widget o duplica — D-13). Se reprovar, a instrução do próprio teste é confirmar com a Cassi antes de atualizar `TIPO_SOLICITACAO`.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** que o widget publicado no tenant novo tem o **mesmo catálogo de tipos** do anterior. É o teste mais sensível a "publicaram uma versão diferente do widget": vermelho aqui é pergunta para a Cassi, não ajuste de lista.

##### deve fechar o modal sem criar solicitação
- **Local:** `modal-solicitacao-compra.spec.js:108` · **Classe no gate:** pre-condicao · **Duração:** 3,0 s
- **O que o teste verifica:** Fechar esconde o dialog e `guarda.tentativas() === 0` — o caso negativo prova que **não** escreveu, como manda o CLAUDE.md.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** fechar não dispara `/start`.

##### FSWTBC-5233 — o modal descreve Aditivo Contratual e Nova Contratação, sem a nomenclatura antiga
- **Local:** `modal-solicitacao-compra.spec.js:141` · **Classe no gate:** pre-condicao · **Duração:** 3,2 s
- **O que o teste verifica:** os textos explicativos ("Continuidade do contrato existente", "abre revisão aberta", "Geração de um novo contrato", "gera novo contrato igual quando vem de SC") estão no dialog e "Renovação Contratual" **não** reaparece — a ambiguidade entre os dois tipos produziu o SDCASSI-548. Medido em 09/09/2026 no ambiente anterior.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** que a versão do widget publicada aqui **inclui** a entrega do FSWTBC-5233. Vermelho neste teste depois da publicação = widget desatualizado no tenant (regressão de versão, dono: implantação).

#### tests/e2e/acompanhamento-contratos/validacoes-solicitacao.spec.js

CT-ACC-04-S1: travas de campo obrigatório do modal. `abrirModal()` instala a guarda, faz `goto()` → `expectCarregada()` → descobre contrato → abre o modal. Cada teste preenche um subconjunto (massa da factory com prefixo `QA`), clica Confirmar e afirma o alerta `Por favor, preencha: …` **e** `guarda.tentativas() === 0`.

##### deve listar os três campos pendentes quando nada é preenchido
- **Local:** `validacoes-solicitacao.spec.js:32` · **Classe no gate:** pre-condicao · **Duração:** 3,4 s
- **O que o teste verifica:** alerta "Por favor, preencha: Tipo de Solicitação, Motivo da Solicitação, Data de Necessidade", dialog continua aberto, zero tentativas de start.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** validação client-side completa e nenhuma escrita.

##### deve cobrar apenas os campos restantes quando o tipo já foi informado
- **Local:** `validacoes-solicitacao.spec.js:48` · **Classe no gate:** pre-condicao · **Duração:** 3,0 s
- **O que o teste verifica:** com Tipo preenchido, o alerta cita só "Motivo da Solicitação, Data de Necessidade"; zero tentativas.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** o alerta é incremental (cita exatamente o que falta), não genérico.

##### deve cobrar somente o motivo quando tipo e data já foram informados
- **Local:** `validacoes-solicitacao.spec.js:65` · **Classe no gate:** pre-condicao · **Duração:** 3,4 s
- **O que o teste verifica:** alerta "Por favor, preencha: Motivo da Solicitação"; zero tentativas. Data entra em ISO (`<input type="date">`, CLAUDE.md).
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** idem anterior, para a combinação tipo + data.

##### deve cobrar o tipo de solicitação quando somente ele fica sem preencher
- **Local:** `validacoes-solicitacao.spec.js:85` · **Classe no gate:** pre-condicao · **Duração:** 4,3 s
- **O que o teste verifica:** alerta "Por favor, preencha: Tipo de Solicitação"; zero tentativas. O tipo governa o roteamento (aditivo × nova contratação) e não pode ser opcional. É a contraparte client-side do `@bug` D-10 (`criacao-solicitacao.spec.js:323`), que mostra que o **servidor** não valida o mesmo campo.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** a trava de UI do tipo existe — o que torna o D-10 um bypass, não um caminho normal.

#### tests/e2e/acompanhamento-contratos/erros-no-start.spec.js

Reação do widget a respostas **simuladas** do `/start` (`responderEnvioSolicitacaoCom`, `utils/captura-payload.js`): a requisição real nunca sai da máquina. `abrirEPreencher()` faz `goto()` → `expectCarregada()` → descobre contrato → abre e preenche o modal.

##### deve avisar o usuário e permitir nova tentativa quando o start falha
- **Local:** `erros-no-start.spec.js:34` · **Classe no gate:** pre-condicao · **Duração:** 3,1 s
- **O que o teste verifica:** CT-ACC-05-S2: com o start respondendo 500 + `{message}`, o widget mostra um `role=alert` com a mensagem do servidor, mantém o modal aberto com Confirmar habilitado (o usuário não perde o que preencheu), exatamente 1 tentativa, e nenhum "iniciado com sucesso".
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** tratamento de erro do start no widget publicado aqui.

##### @bug deve avisar quando a SC é criada mas não pôde ser atribuída ao solicitante, em vez de anunciar sucesso pleno
- **Local:** `erros-no-start.spec.js:67` · **Classe no gate:** conhecido-bug · **Duração:** 3,1 s
- **O que o teste verifica:** **D-01 (sintoma)** / CT-ACC-05-S1: start respondido com 200 simulado e `dsFluig_postProcessesTransfer` (transferência da tarefa ao solicitante) forçado a 500 → o usuário deveria ver um aviso "não pôde ser atribuída". Medido em 25/08/2026: só o toast "Sucesso! Processo N iniciado com sucesso!" e o modal fecha — o erro é engolido. A leitura é por coleta contínua de `role=alert` (o toast some sozinho), para que o `Received` liste o que o produto de fato mostrou.
- **Por que falhou:** **não chegou à assertion do defeito** — `goto()` lançou a pré-condição da página. O sintoma do D-01 continua **sem veredito** nesta base.
- **Como solucionar:** Ambiente para destravar. Defeito é **Produto**: o widget deve tratar a falha de `dsFluig_postProcessesTransfer` como erro parcial e avisar (mora no JS do widget, INFERIDO pelo fluxo start → transfer que o próprio widget encadeia).
- **Quando fica verde e o que ele passa a provar:** após publicação deve **reprovar** no segundo `expect.poll` (avisos observados ≠ "não pôde ser atribuída") enquanto o widget engolir a falha. Verde só quando o produto avisar a atribuição falha — ou, se a causa-raiz do D-01 (`targetState: 6`, `SKILL.md` fato 6) for corrigida e a transferência deixar de existir, o teste precisa ser reavaliado, porque o cenário simulado deixa de corresponder ao fluxo real.

#### tests/e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js

CT-ACC-03-S2 / CT-ACC-04-S2: o modal com o Protheus fora, simulado derrubando `dsProtheus_getBranches_restGetAll` e/ou `dsProtheus_getItensPlanilha_restGetAll` (`derrubarDataset`). O pior desfecho sob teste é a SC nascer sem filial e sem itens.

##### deve avisar o usuário quando os dados do contrato não podem ser obtidos
- **Local:** `indisponibilidade-protheus.spec.js:41` · **Classe no gate:** pre-condicao · **Duração:** 3,3 s
- **O que o teste verifica:** com os dois datasets fora, o primeiro alerta de erro do modal contém "Erro ao buscar dados da filial".
- **Por que falhou:** `goto()` → pré-condição da página (a interceptação foi instalada, mas o widget nunca chamou dataset algum).
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** o widget publicado reage a falha de dataset com alerta visível.

##### @bug deve exibir um alerta por dado indisponível, nomeando o dado que faltou
- **Local:** `indisponibilidade-protheus.spec.js:54` · **Classe no gate:** conhecido-bug · **Duração:** 4,3 s
- **O que o teste verifica:** **D-11 (revisto)**: derrubando **só** `getItensPlanilha`, o modal exibe exatamente 1 alerta (contagem lida após estabilizar — armadilha do CLAUDE.md) e o **rótulo escrito pelo produto** (trecho antes de "Falha simulada") deveria nomear itens/planilha. Medido: o rótulo é "Erro ao buscar dados da filial" para os dois datasets — não há duplicação de renderização, há alerta mal rotulado.
- **Por que falhou:** **não chegou à assertion do defeito** — `goto()` lançou a pré-condição da página. O D-11 continua **sem veredito** nesta base.
- **Como solucionar:** Ambiente para destravar. Defeito é **Produto** (widget: handler de erro do dataset de itens reutiliza a mensagem do de filial — INFERIDO pela evidência do rótulo idêntico).
- **Quando fica verde e o que ele passa a provar:** após publicação, a primeira assertion (1 alerta) deve passar e a última (`toMatch(/iten|planilha/i)`) deve **reprovar** enquanto o rótulo estiver errado. Verde só quando o widget nomear o dado que faltou.

##### não deve enviar solicitação alguma quando o contrato não trouxe itens
- **Local:** `indisponibilidade-protheus.spec.js:144` · **Classe no gate:** pre-condicao · **Duração:** 3,9 s
- **O que o teste verifica:** com os dois datasets fora, preencher e Confirmar **não** dispara `/start` (`guarda.tentativas() === 0`), o modal permanece aberto e não há "iniciado com sucesso". O aviso "Nenhum item de contrato foi carregado" previsto no roteiro não existe hoje — está em aberto com o time (README, divergências), mas o bloqueio essencial acontece.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** SC vazia não entra no fluxo de aprovação — a assertion que protege o negócio (o Fluig é orquestrador, mas é aqui que a integridade da SC nasce; `regras-de-negocio-compras.md`, seção 1).

#### tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js

Casos **destrutivos** do portal: criam SC de verdade (autorizado, `docs/politica-de-escrita.md`), rastreável por `QA` + sufixo, anotada `sc-criada` e cancelada pelo `global-teardown`. Todos usam `descobrirContratoVigentePequeno` (≤ 50 itens, medido por `fetch` direto a `dsProtheus_getItensPlanilha_restGetAll` antes de abrir modal — proteção contra o D-03). Nesta execução **nenhum criou nada**: todos morreram no `goto()`, então não há resíduo deste arquivo a higienizar.

##### CT-ACC-05-H / D-01 — @destrutivo @bug a SC deveria nascer atribuída ao solicitante logado, não à conta de integração
- **Local:** `criacao-solicitacao.spec.js:142` · **Classe no gate:** conhecido-bug · **Duração:** 3,0 s
- **O que o teste verifica:** **D-01 (causa isolada)**: cria a SC pelo widget, confirma toast e fechamento do modal, localiza a SC em "Solicitadas por mim" (varredura decrescente por id) e exige `colleagueName ≠ "Usuário Integrador Fluig"` e `stateDescription ≠ "Início"`. O widget envia `targetState: 6` + `targetAssignee: consumerkeycompras` e a SC nasce presa (README; `cassi-fluig-master/SKILL.md`, fato 6: com `targetState: 0` o mesmo payload chega ao pool do Gestor).
- **Por que falhou:** **não chegou à assertion do defeito** — `goto()` lançou a pré-condição da página. Nenhuma SC foi criada. O D-01 continua **sem veredito** nesta base.
- **Como solucionar:** Ambiente para destravar. Defeito é **Produto** (widget do portal: o valor de `targetState` enviado no `/start`, provado em 26/08/2026).
- **Quando fica verde e o que ele passa a provar:** após publicação deve **reprovar** nos dois `expect` finais enquanto o widget enviar `targetState: 6`; passa a criar 1 SC por execução (cancelada no teardown). Verde por mérito só quando a SC nascer em etapa de trabalho com o solicitante.

##### CT-ACC-06-S1 — @destrutivo @bug item de quantidade/valor zerado no contrato não deveria virar item extra na SC criada
- **Local:** `criacao-solicitacao.spec.js:254` · **Classe no gate:** conhecido-bug · **Duração:** 5,0 s
- **O que o teste verifica:** contrato de serviços com itens `CNB_QUANT`/`CNB_QTDORI`/`CNB_QTRDRZ` vazios e `CNB_VLUNIT = 1` (medido no `000000000000001`): a cascata `resolveQuant` (R9) fabrica quantidade 1 e o filtro `quant > 0 && vlunit > 0` (R8) aprova o item — a SC nasce com linhas que não existem no contrato. Exige `itensNaSC.length === itensValidos.length`.
- **Por que falhou:** **não chegou à assertion do defeito** — `goto()` lançou a pré-condição da página. Sem veredito nesta base.
- **Como solucionar:** Ambiente para destravar (e a massa específica: contrato vigente pequeno com item zerado — tem `faltaPreCondicao` própria na linha 279). Defeito é **Produto** (serviço que monta os itens da SC: ordem R9 → R8; INFERIDO que mora no JS do widget/serviço de montagem do payload, não no Protheus, porque o dataset devolve os campos vazios corretamente).
- **Quando fica verde e o que ele passa a provar:** após publicação deve **reprovar** (contagem de itens) se a base nova tiver contrato com item zerado; caso contrário declara a pré-condição de massa. Verde por mérito só quando o descarte de item zerado acontecer de fato.

##### CT-ACC-04-S6 / D-10 — @destrutivo @bug o servidor deveria recusar tipoSolicitacao vazio tanto quanto recusa motivoSolCompra vazio
- **Local:** `criacao-solicitacao.spec.js:323` · **Classe no gate:** conhecido-bug · **Duração:** 3,8 s
- **O que o teste verifica:** captura o payload genuíno (abortado), remove a interceptação e dispara dois `/start` diretos via `fetch` com Bearer do cookie `jwt.token`: `tipoSolicitacao = ''` (esperado ≠ 200) e `motivoSolCompra = ''` (esperado 500 — o servidor recusa com "O campo Justificativa para a Solicitação é obrigatório!"). Medido: o tipo vazio é **aceito com 200** e cria SC — validação do modal sem contraparte no servidor (D-10). Anexa `starts-diretos` com os pares requisição/resposta (a screenshot não é oráculo aqui).
- **Por que falhou:** **não chegou à assertion do defeito** — `goto()` lançou a pré-condição da página. Nenhum start direto foi disparado. Sem veredito.
- **Como solucionar:** Ambiente para destravar. Defeito é **Produto**, no **servidor** (validação do `wf_solicitacao_compras/start` — evento/validação do processo no Fluig, INFERIDO: `validateForm`/evento de start do processo, não o widget).
- **Quando fica verde e o que ele passa a provar:** após publicação deve **reprovar** no `not.toBe(200)` enquanto o servidor aceitar tipo vazio — e cria até 1 SC de bypass por execução (anotada, cancelada no teardown). Verde por mérito quando o servidor recusar os dois campos.

##### CT-E2E-12-S1 — @destrutivo @bug o portal deveria alertar sobre a SC já em andamento para o mesmo contrato/revisão
- **Local:** `criacao-solicitacao.spec.js:453` · **Classe no gate:** conhecido-bug · **Duração:** 3,1 s
- **O que o teste verifica:** cria uma SC, reabre o modal do mesmo contrato/revisão e espera algum aviso (id da SC, "em andamento", "já existe", "já possui") em 5 s. Medido: o portal deixa abrir e criar a segunda sem avisar.
- **Por que falhou:** **não chegou à assertion do defeito** — `goto()` lançou a pré-condição da página. Sem veredito.
- **Como solucionar:** Ambiente para destravar. Defeito é **Produto** (widget: não consulta SCs abertas do contrato ao abrir o modal — INFERIDO; poderia usar a mesma API v2 de `requests` que a suíte usa).
- **Quando fica verde e o que ele passa a provar:** após publicação deve **reprovar** no `toBeVisible({ timeout: 5_000 })` enquanto não houver alerta de duplicidade; cria 1 SC. Verde por mérito quando o alerta existir.

##### CT-ACC-06-S2 — item sem quantidade no contrato deve herdar a cascata e o preço real, nunca R$ 1,00
- **Local:** `criacao-solicitacao.spec.js:544` · **Classe no gate:** pre-condicao · **Duração:** 3,9 s
- **O que o teste verifica:** guarda de regressão (verde no ambiente anterior, medido 26/08/2026): item com `CNB_QUANT` vazio e `CNB_QTDORI` preenchido sai no payload com a quantidade da cascata, preço unitário ≠ `1,00` e `total = quantidade × preço`. **Não escreve** — start capturado e abortado.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum + massa: contrato vigente pequeno com item nessa característica — `faltaPreCondicao` própria na linha 554).
- **Quando fica verde e o que ele passa a provar:** que as duas exigências do catálogo continuam atendidas no tenant novo; vermelho aqui após publicação seria regressão real do serviço de montagem de itens.

##### FSWTBC-4581 — @destrutivo cancelar pela Central a própria SC parada em Início deve levá-la a CANCELED
- **Local:** `criacao-solicitacao.spec.js:649` · **Classe no gate:** pre-condicao · **Duração:** 2,8 s
- **O que o teste verifica:** o caminho de saída de que a higienização da suíte depende (quinto defeito de cancelamento em três meses): cria SC, **verifica no servidor** que está ativa e em "Início" (estado que o D-01 entrega de graça), cancela pelo cartão de "Minhas solicitações" e exige `successCount: 1, failCount: 0` **e** `active: false` relido do servidor. Tem `setTimeout(240_000)`.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum). Se o D-01 for corrigido antes, o teste avisa que o cenário "em Início" deixou de ser reproduzível por aqui (assertion da linha 678).
- **Quando fica verde e o que ele passa a provar:** que `POST /api/public/2.0/workflows/cancelInstances` (`cassi-fluig-master/references/cancelamento-de-solicitacoes.md`) continua cancelando SC própria em Início neste tenant — a mesma rota que `utils/cancelamento-fluig.js` usa no teardown.

#### tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js

A técnica de maior valor do projeto (CLAUDE.md): `capturarEnvioSolicitacao` intercepta o `POST …/wf_solicitacao_compras/start`, guarda o corpo (~101 campos, itens `___1`, `___2`…) e **aborta** — nada é criado. `abrirPreencherEConfirmar()` (linhas 42-62) faz `goto()` → `expectCarregada()` → `descobrirContratoVigente(criterio)` → filtra → abre → preenche → Confirmar. Todas as assertions são **relacionais/internas** ao payload, sem valor de contrato fixo.

##### D-01 / CT-E2E-01-H — @bug a SC deve nascer numa etapa de trabalho atribuída ao solicitante, não presa no marco de Início da conta de integração
- **Local:** `payload-solicitacao.spec.js:65` · **Classe no gate:** conhecido-bug · **Duração:** 3,2 s
- **O que o teste verifica:** `payload.targetState ≠ 6` e `payload.targetAssignee === QA_USERNAME`. É a versão **não destrutiva** do D-01: prova a causa (o que o widget envia) sem criar SC.
- **Por que falhou:** **não chegou à assertion do defeito** — `goto()` lançou a pré-condição da página. Sem veredito.
- **Como solucionar:** Ambiente para destravar. Defeito é **Produto** (widget, valor de `targetState`/`targetAssignee` no `/start`).
- **Quando fica verde e o que ele passa a provar:** após publicação deve **reprovar** em `not.toBe(6)` enquanto o widget enviar 6. Verde por mérito quando o widget enviar o gateway (`0`) e o solicitante.

##### itens com quantidades diferentes não devem trazer o mesmo valor total
- **Local:** `payload-solicitacao.spec.js:106` · **Classe no gate:** pre-condicao · **Duração:** 3,0 s
- **O que o teste verifica:** assinatura do **D-02** (valor do contrato replicado por item: R$ 40.560,00 × 2 itens = R$ 81.120,00, README): nenhum par de itens com quantidades diferentes pode ter o mesmo `tbprod_valorTotal`. Pré-condição própria: ao menos duas quantidades distintas (senão verde vazio).
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum). Observação: este teste **não** leva `@bug` embora meça o D-02 — no ambiente anterior o desfecho dependia do contrato sorteado (contratos de item único caem na pré-condição). Se após a publicação ele reprovar de forma consistente, é candidato à tag, decisão do dono (README, *A tag `@bug`*).
- **Quando fica verde e o que ele passa a provar:** que os totais por item são frações do contrato, não o total cheio repetido.

##### não deve existir item de quantidade 1 repetindo o valor total de outro item
- **Local:** `payload-solicitacao.spec.js:163` · **Classe no gate:** pre-condicao · **Duração:** 2,9 s
- **O que o teste verifica:** segunda assinatura do D-02: "item-fantasma" de quantidade 1 com o total de outro item. Pré-condição própria: ≥ 2 itens e um deles com quantidade 1.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum). Mesma observação sobre `@bug` do bloco anterior.
- **Quando fica verde e o que ele passa a provar:** ausência de item-fantasma no payload do contrato sorteado.

##### itens com quantidade e preço diferentes não deveriam compartilhar o mesmo valor total
- **Local:** `payload-solicitacao.spec.js:209` · **Classe no gate:** pre-condicao · **Duração:** 4,0 s
- **O que o teste verifica:** terceira evidência independente do D-02: agrupa itens por `valorTotal` e reprova se um grupo tiver assinaturas `quantidade|preço` distintas. Pré-condição própria: > 1 item e ≥ 2 assinaturas.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** cada item vale a própria fração do contrato.

##### D-04 / CT-ACC-07-S1 — @bug classeOrca, classificação e o descritor deveriam refletir o contrato de origem, não vir fixos para todos
- **Local:** `payload-solicitacao.spec.js:268` · **Classe no gate:** conhecido-bug · **Duração:** 4,7 s
- **O que o teste verifica:** captura dois payloads de contratos de **filiais diferentes** (`filialDiferenteDe`) e exige que `campoDescritor` e o conjunto `classeOrca|classificacao` dos itens **difiram**. Medido: `classeOrca=133017`, `classificacao=Tecnologia` em todo item de todo contrato, `campoDescritor="Sol. Compras - CASSI SEDE"` com filial de São Luís/MA (README, D-04).
- **Por que falhou:** **não chegou à assertion do defeito** — `goto()` lançou a pré-condição da página. Sem veredito.
- **Como solucionar:** Ambiente para destravar (precisa de vigentes em ≥ 2 filiais). Defeito é **Produto** (widget: valores chumbados na montagem do payload — INFERIDO; a classificação orçamentária correta é do Protheus por decisão de projeto, `regras-de-negocio-compras.md`, seção 1, então a correção é o widget consultar o ERP/dataset em vez de fixar).
- **Quando fica verde e o que ele passa a provar:** após publicação deve **reprovar** (`not.toBe`/`not.toEqual`) enquanto os campos vierem fixos. Verde por mérito quando refletirem o contrato de origem.

##### os valores monetários devem ser numericamente coerentes, sem NaN, sem casa perdida e sem inflação
- **Local:** `payload-solicitacao.spec.js:324` · **Classe no gate:** pre-condicao · **Duração:** 3,7 s
- **O que o teste verifica:** CT-ACC-08-S1: para todo item, preço, total e quantidade são finitos e `total ≈ preço × quantidade` (máscara BR não corrompeu casas).
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** conversão BR-money íntegra no payload do tenant novo.

##### as linhas de rateio devem trazer percentual, centro de custo e classe de valor preenchidos, somando 100%
- **Local:** `payload-solicitacao.spec.js:358` · **Classe no gate:** pre-condicao · **Duração:** 3,4 s
- **O que o teste verifica:** CT-ACC-08-S2: cada item tem ≥ 1 linha em `tbprod_jsonrateio`, cada linha com CC, classe de valor e percentual, somando 100 % — a regra que mais gera chamado (`medicao-e-faturamento.md`, seção 4; `gestao-de-contratos-protheus.md`, *Rateio Contábil por Item*).
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum; `dsProtheus_getRateiosContratos_restGetAll`, `getCentroCusto`, `dsFluig_getClasseValor` respondendo).
- **Quando fica verde e o que ele passa a provar:** rateio herdado do contrato íntegro no payload — e é a pré-condição de leitura para entender o CT-CMP-08-H (reenvio recusado por rateio "sem preenchimento").

##### classeValor vazio — @bug classeValor do item deveria vir preenchido junto com classeOrca e classificação
- **Local:** `payload-solicitacao.spec.js:388` · **Classe no gate:** conhecido-bug · **Duração:** 2,9 s
- **O que o teste verifica:** `tbprod_classeValor` **no nível do item** (irmão de `classeOrca`/`classificacao`, distinto da classe de valor de cada linha de rateio, que vem preenchida) chega vazio em todo item — pode travar a Validação Orçamentária (README).
- **Por que falhou:** **não chegou à assertion do defeito** — `goto()` lançou a pré-condição da página. Sem veredito.
- **Como solucionar:** Ambiente para destravar. Defeito é **Produto** (widget: campo não mapeado na montagem do item — INFERIDO, já que a mesma informação existe nas linhas de rateio do próprio payload).
- **Quando fica verde e o que ele passa a provar:** após publicação deve **reprovar** (`toHaveLength(0)` sobre os itens sem classeValor) enquanto o campo vier vazio.

##### FSWTBC-4153 — duplo clique em Confirmar não deve disparar duas requisições de start
- **Local:** `payload-solicitacao.spec.js:414` · **Classe no gate:** pre-condicao · **Duração:** 3,1 s
- **O que o teste verifica:** CT-ACC-04-S3, com a técnica correta da armadilha do CLAUDE.md: **segura** a requisição de `/start` em voo (abortar reabilitaria o botão e destruiria o estado sob teste), aborta as demais escritas de `process-management` na hora, e afirma botão `disabled` + exatamente 1 tentativa.
- **Por que falhou:** `goto()` → pré-condição da página (a rota estava instalada; nada chegou a ser segurado).
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** a trava antiduplo-clique do widget publicado neste tenant.

##### CT-ACC-04-S5 — @bug não deve permitir que nrContrato divirja do contrato real da revisão/filial/itens enviados
- **Local:** `payload-solicitacao.spec.js:483` · **Classe no gate:** conhecido-bug · **Duração:** 2,8 s
- **O que o teste verifica:** captura o payload genuíno de um contrato de referência; abre o modal de **outro** contrato (filial diferente), força via JS o `campoContrato` (disabled) para o número do primeiro, e exige que revisão, filial e nº de itens enviados sejam os do contrato cujo `nrContrato` vai no payload. Medido: o widget envia a mistura sem revalidar (README, CT-ACC-04-S5).
- **Por que falhou:** **não chegou à assertion do defeito** — `goto()` lançou a pré-condição da página. Sem veredito.
- **Como solucionar:** Ambiente para destravar (vigentes em ≥ 2 filiais). Defeito é **Produto**: o widget monta o payload a partir do valor do input em vez do estado da linha, e o **servidor** não revalida coerência `nrContrato × revisão × filial × itens` (INFERIDO: correção ideal é no servidor — validação no start do processo — porque client-side é contornável por construção, como o próprio teste demonstra).
- **Quando fica verde e o que ele passa a provar:** após publicação deve **reprovar** nas comparações de `revisaContrato`/`codFilial`/nº de itens enquanto a incoerência for aceita. Verde por mérito quando o payload (ou o servidor) rejeitar a mistura.

#### tests/e2e/acompanhamento-contratos/ciclo-gestor.spec.js

Início da cadeia E2E (SC criada pelo portal → Gestor Imediato). O cabeçalho registra o achado que governa o arquivo: SC criada por esta suíte via widget **fica para sempre em "Início"** com "Usuário Integrador Fluig" (efeito downstream do D-01). Os três testes são `@destrutivo @bug`, escritos contra a cadeia completa; nenhum criou SC nesta execução.

##### CT-E2E-01-H — @destrutivo @bug estado inicial e responsável deveriam refletir uma etapa de trabalho do solicitante
- **Local:** `ciclo-gestor.spec.js:36` · **Classe no gate:** conhecido-bug · **Duração:** 3,5 s
- **O que o teste verifica:** cria a SC, localiza-a em "Solicitadas por mim" e exige `stateDescription ≠ "Início"` e `colleagueName ≠ "Usuário Integrador Fluig"`. Anota também o status do `GET /process-management/api/v2/requests/<N>` via `page.request` (403 pelo WAF — documentado, `SKILL.md` fato 5).
- **Por que falhou:** **não chegou à assertion do defeito** — `goto()` lançou a pré-condição da página. Sem veredito.
- **Como solucionar:** Ambiente para destravar. Defeito é **Produto** (D-01, widget).
- **Quando fica verde e o que ele passa a provar:** após publicação deve **reprovar** nos `not.toBe` enquanto o D-01 persistir; cria 1 SC por execução.

##### CT-E2E-02-H — @destrutivo @bug aprovada pelo Gestor Imediato, a SC deveria avançar para Validação Orçamentária
- **Local:** `ciclo-gestor.spec.js:109` · **Classe no gate:** conhecido-bug · **Duração:** 3,0 s
- **O que o teste verifica:** cria a SC, espera 45 s por "Validação do Gestor" (`toPass`), assume do pool, aprova com justificativa `QA…` e espera "Validação Orçamentária" — a cadeia do `regras-de-negocio-compras.md`, seção 3. Hoje reprova na espera pela Validação do Gestor (D-01).
- **Por que falhou:** **não chegou à assertion do defeito** — `goto()` lançou a pré-condição da página. Sem veredito.
- **Como solucionar:** Ambiente para destravar. Defeito é **Produto** (D-01). Observação: a conta `TOTVS-FS` **está** no pool `G.P.Requisicao_de_Compras_Gestor_Imediato` neste tenant (`docs/viabilidade-no-ambiente-213859.md`, item 1), então, corrigido o D-01, o resto do teste tem como rodar aqui.
- **Quando fica verde e o que ele passa a provar:** após publicação deve **reprovar** no `toPass` de 45 s ("estado atual Início — esperando Validação do Gestor") enquanto o D-01 persistir. Se o D-01 for corrigido, passa a exercitar assumir/aprovar de verdade — e aí o CLAUDE.md lembra que hoje a SC não passa da atividade 233 (`ds_protheus_getMatriculaTitular_rest` → 500 `WFLYEJB0054`), o que seria o próximo vermelho de ambiente.

##### CT-E2E-02-S1 — @destrutivo @bug reprovada, a SC deveria voltar para Ajustar Informações com o solicitante, itens e contrato íntegros
- **Local:** `ciclo-gestor.spec.js:155` · **Classe no gate:** conhecido-bug · **Duração:** 2,9 s
- **O que o teste verifica:** idem, com reprovação: espera "Ajustar Informações" e confere que `nrContrato` no formulário devolvido é o mesmo do payload original capturado na criação.
- **Por que falhou:** **não chegou à assertion do defeito** — `goto()` lançou a pré-condição da página. Sem veredito.
- **Como solucionar:** Ambiente para destravar. Defeito é **Produto** (D-01).
- **Quando fica verde e o que ele passa a provar:** após publicação deve **reprovar** na espera pela Validação do Gestor enquanto o D-01 persistir; corrigido o D-01, prova integridade do contrato no retorno ao solicitante.

#### tests/e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js

##### CT-CMP-08-H — @destrutivo @bug reprovada e corrigida, a SC deveria voltar para a Validação do Gestor com o contrato de origem íntegro
- **Local:** `ciclo-correcao-reenvio.spec.js:243` · **Classe no gate:** conhecido-bug · **Duração:** 3,3 s
- **O que o teste verifica:** o ciclo de retorno completo, contornando o D-01 com o **start corrigido** (`targetState: 0`, mesmo payload do widget, disparado por `fetch` na página): SC chega ao pool do Gestor (~75 s), é assumida via `assumeProcessTasks`, reprovada, volta para "Ajustar Informações"/"Correção" com o solicitante, e o **reenvio** deveria voltar à Validação do Gestor com `nrContrato` íntegro. Medido (SC 112762): reenvio **recusado** com "Existem campos de rateio sem preenchimento" num rateio que veio do contrato e ninguém tocou — beco sem saída (README; `SKILL.md`, fato de negócio 6; `regras-de-negocio-compras.md`, seção 10). Orçamento de 600 s; é o caso mais caro da suíte.
- **Por que falhou:** **não chegou à assertion do defeito** — `goto()` lançou a pré-condição da página no passo 1 (massa própria). Nenhuma SC criada, nenhuma tarefa assumida — sem resíduo. Sem veredito.
- **Como solucionar:** Ambiente para destravar. Defeito é **Produto** (validação de rateio no reenvio do formulário da SC — INFERIDO: evento de validação do processo `wf_solicitacao_compras` que exige campos de rateio que a etapa de correção não repovoa a partir do `tbprod_jsonrateio`).
- **Quando fica verde e o que ele passa a provar:** após publicação deve **reprovar** no reenvio enquanto o rateio herdado for recusado — **desde que** o start corrigido seja aceito e a SC chegue ao pool (o CLAUDE.md registra que neste tenant a SC trava na atividade 233 por `WFLYEJB0054`; se isso persistir, o teste cai nas suas próprias `faltaPreCondicao` das linhas 281-329, e o vermelho volta a ser ambiente, não o CT-CMP-08-H). Verde por mérito quando o ciclo reprovar → corrigir → reenviar fechar.

#### tests/e2e/contratos/ciclo-faturamento.spec.js

Faturamento de Contratos (`wf_faturamento_contratos`) **não é** o portal — mas usa a grade do portal como fonte de massa: `new AcompanhamentoContratosPage(page).goto()` → `descobrirContratoVigente()` → `parseFornecedorDaGrade()` → só então `MedicaoContratoPage.goto()`. É por isso que caiu neste lote.

##### CT-FAT-01-H — @destrutivo deve criar uma medição válida a partir de um contrato vigente e roteá-la para a próxima atividade do workflow
- **Local:** `ciclo-faturamento.spec.js:50` · **Classe no gate:** pre-condicao · **Duração:** 3,6 s
- **O que o teste verifica:** a partir de até 3 contratos vigentes, monta a cadeia de 5 zooms (Fornecedor → Contrato → Competência → Filial → Planilha) até achar competência com saldo em aberto, envia a medição e confirma o roteamento para "Realizar Medição do Contrato" (seq 28, `medicao-e-faturamento.md`). Quantidade/rateio ficam fora de alcance: o painel `#panel_MeasurementItens` só abre para o Fiscal/CSE daquele contrato. Cobre também FSWTBC-629/695/2886/4122/4266/4792 (cabeçalho).
- **Por que falhou:** `goto()` do portal → pré-condição da página, antes de tocar o formulário de faturamento.
- **Como solucionar:** Ambiente (Causa comum) — e, além disso, contrato vigente com competência em saldo aberto (`Dia Med Auto`, cronograma financeiro, `gestao-de-contratos-protheus.md`, seções 2-4) e os datasets `ds_fatcon_get_competencia` / `ds_fatcon_get_info_medicoes` (`utils/massa-medicao.js`) publicados no tenant.
- **Quando fica verde e o que ele passa a provar:** cria 1 medição real (cancelada no teardown) e prova que a etapa Início do faturamento integra com o Protheus deste tenant. **Sugestão à suíte (INFERIDO):** o Faturamento não precisa da *página* do portal, só de fornecedor/contrato/filial vigentes; descobrir a massa por `dsProtheus_getContratos_restGetAll` (que já devolvia 20 linhas às 12h) desacoplaria os 5 testes de `tests/e2e/contratos/` de um widget que eles não testam.

#### tests/e2e/contratos/validacoes-faturamento.spec.js

Mesmo acoplamento do arquivo anterior: os quatro testes abrem o portal só para amostrar contratos (`descobrirContratosVigentes(contratosPage, 4)` ou `encontrarMedicaoComSaldo`).

##### CT-FAT-02-S2 — competência recusada pelo Protheus deve bloquear a medição E avisar o usuário
- **Local:** `validacoes-faturamento.spec.js:104` · **Classe no gate:** pre-condicao · **Duração:** 3,3 s
- **O que o teste verifica:** descobre por **consulta** (não por navegação) uma competência que `ds_fatcon_get_info_medicoes` recusa (`STATUS: ERROR`, ex. "Existe revisão pendente de aprovação…"), seleciona-a na tela e exige aviso ao usuário + painel de itens oculto + zero escritas. Defeito catalogado no README (**CT-FAT-02-S2**: a recusa é engolida, nenhum aviso). Também a metade legível do FSWTBC-1760. **Não leva `@bug`** no título apesar de reprovar de propósito no ambiente anterior — inconsistência de tag a revisar pelo dono (README lista o caso como defeito conhecido).
- **Por que falhou:** `goto()` do portal → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum + datasets `ds_fatcon_*` + contrato com competência recusável). Defeito em si é **Produto** (formulário de faturamento: não renderiza a mensagem de negócio do Protheus — INFERIDO: `App/ViewHandler.js` do formulário trata `STATUS: ERROR` sem diálogo).
- **Quando fica verde e o que ele passa a provar:** após a publicação deve **reprovar** no `toBe(true)` do aviso enquanto a tela silenciar a recusa (o próprio teste anota a mensagem do servidor para o relatório). Verde por mérito quando a UI exibir o motivo.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE` (fatia RH/Faturamento/Tarefas): _Error: PRÉ-CONDIÇÃO AUSENTE (ambiente): a página /portal/p/1/acompanhamentoContrato não está publicada neste ambiente — o Fluig responde "Recurso não foi encontrado". Sem o Acompanhamento de Contratos_

##### CT-FAT-02-S1 — lançar quantidade acima do Saldo a Medir não é alcançável pelo usuário desta automação
- **Local:** `validacoes-faturamento.spec.js:206` · **Classe no gate:** pre-condicao · **Duração:** 3,2 s
- **O que o teste verifica:** assertion viva de um bloqueio de pré-condição: com a cadeia de zooms resolvida sem erro, `#panel_MeasurementItens` continua oculto e nenhum `input[id^="quantidade___"]` visível; zero escritas. Se a Cassi conceder Fiscal/CSE à automação, este teste reprova primeiro.
- **Por que falhou:** `goto()` do portal → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum + competência com saldo em aberto — tem `faltaPreCondicao` própria).
- **Quando fica verde e o que ele passa a provar:** que o campo de quantidade segue inalcançável antes de "Realizar Medição do Contrato" para `TOTVS-FS` — e que o cenário completo do catálogo continua bloqueado por perfil (limite real, CLAUDE.md).
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE` (fatia RH/Faturamento/Tarefas): _Error: PRÉ-CONDIÇÃO AUSENTE (ambiente): a página /portal/p/1/acompanhamentoContrato não está publicada neste ambiente — o Fluig responde "Recurso não foi encontrado". Sem o Acompanhamento de Contratos_

##### CT-FAT-02-S4 — fechar rateio contábil diferente de 100% não é alcançável pelo usuário desta automação
- **Local:** `validacoes-faturamento.spec.js:251` · **Classe no gate:** pre-condicao · **Duração:** 3,4 s
- **O que o teste verifica:** idem para a aba "Rateio Contábil" (`a[href="#tabRateio"]` anexada e oculta), com o painel oculto e zero escritas.
- **Por que falhou:** `goto()` do portal → pré-condição da página.
- **Como solucionar:** Ambiente (idem S1).
- **Quando fica verde e o que ele passa a provar:** o bloqueio de etapa do rateio continua valendo para a conta da automação.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE` (fatia RH/Faturamento/Tarefas): _Error: PRÉ-CONDIÇÃO AUSENTE (ambiente): a página /portal/p/1/acompanhamentoContrato não está publicada neste ambiente — o Fluig responde "Recurso não foi encontrado". Sem o Acompanhamento de Contratos_

##### FSWTBC-2143 — todo rótulo de competência do zoom traz separador entre mês e ano
- **Local:** `validacoes-faturamento.spec.js:395` · **Classe no gate:** pre-condicao · **Duração:** 2,9 s
- **O que o teste verifica:** para 4 contratos vigentes amostrados, `listarCompetenciasBrutas` (sem filtrar) e todo rótulo casa `^\d{2}[-/]\d{4}$` — o defeito é `062025` sem separador (um `replace('/', '-')` sem validação). Aceita hífen porque é o que o dataset devolve nativamente. Anota `competencias-lidas`; leitura pura.
- **Por que falhou:** `goto()` do portal → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum + `ds_fatcon_get_competencia` publicado). Não precisa do formulário de faturamento — só do dataset; é outro candidato a desacoplar do portal (INFERIDO).
- **Quando fica verde e o que ele passa a provar:** que o formato de competência continua correto no dataset deste tenant.
- **Re-medição (10/09, 11h40–12h20):** **Mudou de causa: corrida na detecção da própria suíte.** Às 10:38 caiu na pré-condição de página não publicada; à tarde esperou 45 s pelo heading e deu TIMEOUT. Causa em `pages/AcompanhamentoContratosPage.js:61-66`: `expectPaginaPublicada()` faz `isVisible()` **uma única vez** logo após `domcontentloaded`; se a *Error page* ainda não pintou *"Recurso não foi encontrado"*, a checagem passa em falso. **Solução (suíte):** esperar o primeiro de dois estados (`titulo.or(getByText(/Recurso não foi encontrado/))`) e só então decidir. Protege os 64 testes do lote A.

#### tests/e2e/seguranca/integracao-protheus-grade-contratos.spec.js

##### CT-INT-01-H — deve carregar contratos e tipos de contrato consultados no Protheus
- **Local:** `integracao-protheus-grade-contratos.spec.js:19` · **Classe no gate:** pre-condicao · **Duração:** 3,4 s · **Passo:** `Wait for event "response"`
- **O que o teste verifica:** na carga do portal, `dsProtheus_getContratosxFornecedores_restGet` e `dsProtheus_getTipoContratos_restGetAll` respondem 2xx com `columns` e ≥ 1 `values`, e o dado chega à tela (`Mostrando de 1 até N`). Arma `aguardarDataset` (lê o `postData()` do endpoint único de datasets) **antes** do `goto()`.
- **Por que falhou:** `goto()` → pré-condição da página. O `passo` registrado é o `waitForResponse` que ficou pendente enquanto o `goto()` lançava — nenhum dos dois datasets foi chamado, porque não há widget para chamá-los.
- **Como solucionar:** Ambiente (Causa comum, passo 3: os dois datasets publicados e o serviço REST do Protheus respondendo).
- **Quando fica verde e o que ele passa a provar:** é a prova direta de que a **integração da grade** funciona no tenant; se a página existir mas o dataset vier vazio, reprova em "dataset de contratos respondeu sem nenhum registro" — leitura de massa, não de página. **Sugestão à suíte:** mover `dsProtheus_getTipoContratos_restGetAll` para `config/ambiente.js` (`DATASET.TIPOS_CONTRATO` já existe lá — o literal local do spec é duplicação).

##### CT-INT-01-S1 — deve comunicar indisponibilidade quando o Protheus não responde na carga da grade
- **Local:** `integracao-protheus-grade-contratos.spec.js:65` · **Classe no gate:** pre-condicao · **Duração:** 2,9 s
- **O que o teste verifica:** com o dataset da **grade** derrubado (diferente de `indisponibilidade-protheus.spec.js`, que derruba os do modal), a página não trava (heading visível), exibe `role=alert` com heading "ERRO:" e **não** inicializa o DataTables (sem "Mostrando…") — nada de grade vazia fingindo sucesso.
- **Por que falhou:** `goto()` → pré-condição da página.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** tratamento de erro de carga da grade no widget publicado.

#### tests/e2e/seguranca/lgpd-envio-google-analytics.spec.js

##### CT-SEG-06-S1 / U-11 — não deve enviar dados de navegação para o Google Analytics @bug
- **Local:** `lgpd-envio-google-analytics.spec.js:22` · **Classe no gate:** conhecido-bug · **Duração:** 3,1 s
- **O que o teste verifica:** conta requisições a `*.google-analytics.com` durante `contratosPage.goto()` + `expectCarregada()` + `networkidle` e exige 0. Medido: 2 por carga (`G-F0FT6D1NQG`), URL e título enviados — achado **U-11** (README, mapa). Escrito contra "não deve enviar" porque o portal é navegação autenticada de colaboradores de uma operadora de saúde.
- **Por que falhou:** **não chegou à assertion do defeito** — `goto()` lançou a pré-condição da página. O U-11 continua **sem veredito** nesta base — e, note-se, a Error page do Fluig pode ou não carregar o GA; o teste não mediu isso porque lançou antes.
- **Como solucionar:** Ambiente para destravar. Defeito é **Produto/Governança** (tag GA no layout/tema do tenant — INFERIDO: script global do WCM, não do widget, já que o mapa registra o envio em "qualquer página"). Decisão de Privacidade/LGPD da Cassi.
- **Quando fica verde e o que ele passa a provar:** após publicação deve **reprovar** (`toBe(0)`) enquanto o GA estiver ativo. **Sugestão à suíte:** o achado é de "qualquer página" — medir na Home (`/portal/p/1/home`) em vez do portal de contratos tornaria o teste independente deste lote e manteria o U-11 visível mesmo com o portal fora.

#### tests/e2e/plataforma/smoke-integracao-erp.spec.js

##### FSWTBC-1985 — Acompanhamento, Tracker e Gerência de Compras trazem dados do Protheus
- **Local:** `smoke-integracao-erp.spec.js:32` · **Classe no gate:** pre-condicao · **Duração:** 3,3 s
- **O que o teste verifica:** smoke pós-upgrade do Protheus 2410: três telas que consomem o ERP por caminhos distintos (grade CN9, consulta de processos do Tracker, aba Transferir da Gerência de Compras); a assertion é única, no fim, para distinguir "o ERP caiu" (as três sem dado) de "esta tela caiu" (uma só). Zero escritas.
- **Por que falhou:** `goto()` do portal (tela 1) → pré-condição da página; Tracker e Gerência **não foram medidos**.
- **Como solucionar:** Ambiente (Causa comum).
- **Quando fica verde e o que ele passa a provar:** a pergunta "o Protheus está respondendo agora?" respondida em um lugar só. **Sugestão à suíte (INFERIDO):** o desenho do teste é "medir as três e decidir no fim", mas a pré-condição do portal aborta na primeira — capturar a `PRÉ-CONDIÇÃO AUSENTE` do portal como medição ("Acompanhamento: página não publicada") e seguir para as outras duas preservaria o valor de smoke enquanto o portal estiver fora. Até lá, `npm run canario` cumpre esse papel.

#### tests/e2e/plataforma/erros-de-console.spec.js

##### CT-PLT-06-S1 — Portal de Acompanhamento de Contratos (/portal/p/1/acompanhamentoContrato) deve carregar sem erro de console não catalogado
- **Local:** `erros-de-console.spec.js:176` · **Classe no gate:** pre-condicao · **Duração:** 34,3 s · **Passo:** `Expect "toHaveTitle"`
- **O que o teste verifica:** guarda de console por rota: coletor de `console.error`/`pageerror` instalado antes do `goto`, título esperado `Cassi - Fluig Plataforma - Acompanhamento de Contratos`, `networkidle`, e nenhum erro fora de `EXCECOES_CATALOGADAS` (lista nomeada e datada, casada por recurso). Esta rota **não** tem `@bug` (só o Portal do Comprador tem defeito catalogado).
- **Por que falhou:** `toHaveTitle` recebeu **"Cassi - Fluig Plataforma - Error page"** por 30 s (62 leituras) e o `catch` converteu em `PRÉ-CONDIÇÃO AUSENTE: … não abriu a tela esperada — sem a página carregada não há o que medir de console, e um coletor vazio pareceria sucesso`. Único do lote a custar 34 s.
- **Como solucionar:** Ambiente (Causa comum). Suíte: reaproveitar a detecção de "Recurso não foi encontrado" antes do `toHaveTitle` (ver *O que a suíte pode melhorar*).
- **Quando fica verde e o que ele passa a provar:** que o widget publicado carrega sem erro de JS/rede não catalogado. Atenção ao que a `voyager-2-migracao.md` registra: widget pré-Voyager pede `/style-guide/css/fluig-style-guide.min.css`, que responde **404** na 2.0 — se o widget for publicado a partir do pacote antigo sem ajuste, este teste tende a reprovar por esse 404 (mesmo sintoma do Portal do Comprador), e isso seria defeito de produto a catalogar, não ambiente.

---

### Fechamento do lote

| | Quantidade |
|---|---:|
| Testes no lote | **64** |
| Classificados `pre-condicao` | 47 |
| Classificados `conhecido-bug` (`@bug`) | 17 |
| Que chegaram à assertion do defeito que documentam | **0** |
| Que criaram registro no ambiente | **0** (nenhum `@destrutivo` passou do `goto()`) |
| Dono da correção para destravar | **Ambiente/implantação Cassi-TOTVS** — 64/64 |
| Defeitos de produto cujo veredito ficou em aberto nesta base | D-01 (causa e sintoma), D-02 (3 testes sem tag), D-04, D-08 (grade e ficha), D-10, D-11, CT-ACC-04-S5, classeValor, CT-E2E-12-S1, CT-E2E-01-H/02-H/02-S1, CT-CMP-08-H, CT-FAT-02-S2, U-11 |

Leituras que **contradizem ou refinam** as premissas iniciais:

1. O número "54 testes" do Page Object e "~61" do canário está defasado — o lote real é **64** (cresceu com `modais-do-contrato.spec.js`, FSWTBC-4898/4073/4986 e os 5 de `tests/e2e/contratos/`).
2. **Cinco testes de Faturamento e o de LGPD não testam o portal**, mas dependem dele para descobrir massa ou como página de passagem. Desacoplar (dataset `getContratos` para o faturamento; Home para o GA) reduziria o raio de arrasto da próxima queda desta página.
3. **CT-FAT-02-S2 reprova de propósito no ambiente anterior e não leva `@bug`**; três testes de D-02 em `payload-solicitacao.spec.js` idem. Não é erro — depende de massa sorteada — mas é inconsistência de tag que o dono deve decidir.
4. O `docs/mapa-do-ambiente.md` ainda diz "zero linhas" para `getContratos`/`getFornecedores`; a medição das 12h de 10/09 (20 / 300) já é diferente. Massa está voltando; a página não.
5. Mesmo com a página publicada, quatro dependências deste tenant vão reaparecer como vermelho de **ambiente**, não de produto: `dsProtheus_getFiscaisPorTipoContrato` → 500 (ficha/fiscais), `ds_protheus_getMatriculaTitular_rest` → 500 `WFLYEJB0054` (SC trava na 233 — afeta ciclo-gestor e CT-CMP-08-H), `getCompradores` → `error: "undefined"`, e a intermitência do ERP nos formulários. O canário cobre parte disso; o resto aparece nas `faltaPreCondicao` específicas de cada teste.

---


## Parte B — ERP dos formulários, "Atuar como", filas e massa vazias (55 testes)

Execução analisada: 10/09/2026 10:38–11:27 BRT, 1 worker, projeto `e2e`, tenant `caixade213859`,
conta `TOTVS-FS`. Fonte: os dados extraídos do relatório HTML (causas C2, C3, C4, C5) e
`report.json`. Código lido em `80df273` (caminhos relativos à raiz do repositório). A análise
abaixo foi escrita sobre a execução das 10h38; a linha **Re-medição** de cada bloco traz o
resultado da re-execução das 11h40–12h20.

| Causa | Testes | Gate: pré-condição | Gate: conhecido-bug | Gate: conhecido-achado |
|---|---:|---:|---:|---:|
| C2 — formulário da SC sem ERP | 30 | 26 | 4 | 0 |
| C3 — formulário de Cotação sem ERP | 3 | 2 | 1 | 0 |
| C4 — "Atuar como" / matrícula de comprador | 6 | 6 | 0 | 0 |
| C5 — filas e massa vazias | 16 | 10 | 5 | 1 |
| **Total** | **55** | **44** | **10** | **1** |

Nenhum dos 55 é regressão do produto nem flakiness da suíte: os 55 caem na categoria 1 de
`docs/estabilidade-do-ambiente.md` ("a mensagem começa com `PRÉ-CONDIÇÃO AUSENTE`") ou são
`@bug`/`@achado` que **não chegaram à assertion** que os define — com uma exceção,
`tests/e2e/rh/admissao.spec.js:37`, que chegou e reprovou pelo defeito, como deve.

### Leitura transversal — o que esta execução acrescenta às premissas

1. **Nesta janela o ERP do formulário não foi intermitente: esteve fora em 30 de 30 cargas.**
   `docs/mapa-do-ambiente.md` ("O ERP dos formulários é INTERMITENTE") mediu 2 falhas em 3 cargas.
   No `report.json`, os arquivos que abrem o formulário clássico da SC somam **0 `expected`**
   (`abertura-solicitacao-compras` 0/1, `validacoes-solicitacao-compras` 0/6,
   `ciclo-solicitacao-compras` 0/9, `alcadas-orcamentaria` 0/5, `acoes-da-tarefa` 0/2, e os
   destrutivos de `aprovacoes`, `atribuicao-comprador`, `ciclo-comprador`), entre 10:46 e 11:25
   BRT. O canário das ~12h já viu o formulário montar. Ou seja: a intermitência tem janelas de
   dezenas de minutos, não de segundos — uma execução inteira cabe dentro de uma janela ruim, e
   por isso "repita o teste isolado" (regra do mapa) precisa ser "repita **depois** de um canário
   verde", não "repita já".
2. **A própria suíte consome o pool que ela mesma precisa.** Às 10:47 BRT
   `aprovacoes-solicitacao-compras.spec.js:594` leu o pool vazio (`grupos disponíveis: [nenhum]`);
   às 10:55 `validacoes-faturamento.spec.js:279` também não viu "Tarefas em pool"; às 11:25
   `tests/e2e/tarefas/assumir-tarefa-pool.spec.js:35` **passou** (assumiu uma tarefa de pool). O
   que apareceu no pool entre 10:55 e 11:25 (INFERIDO, cruzando com
   `docs/massa-de-dados-no-ambiente-dev.md` §4): as SCs semeadas 96369/96370 (criadas 11:03)
   caindo em **236 Correção** — pool `G.P.Requisicao_de_Compras_Correcoes`, do qual a conta faz
   parte. Consequência: a massa semeada "viva de propósito" está sendo **assumida** por um teste
   da suíte, e o teste que precisa do pool de *Validação dos Compradores* continua sem nada,
   porque Correção não é Validação dos Compradores.
3. **Um verde vizinho é falso e contradiz a leitura "a fila tinha linhas".**
   `tests/e2e/portais/portal-comprador.spec.js:41` ("deve listar as solicitações reais em
   Validação Inicial") passou às 11:16 BRT contando `tbody tr > 0`, três minutos depois de
   `ciclo-comprador.spec.js:40` medir a mesma grade **vazia** com `esperarLinhasReais`. A linha
   do estado vazio (`No data found`) conta como linha — é exatamente a armadilha que o
   `CLAUDE.md` e `utils/grade.js` descrevem. Está fora do escopo desta parte (é um verde), mas
   entra na lista de ajustes da suíte no fim.
4. **Uma única causa raiz do lado Fluig aparece em três famílias.** O dataset
   `ds_protheus_getMatriculaTitular_rest` → HTTP 500 `WFLYEJB0054` (docs/massa §4) derruba a
   montagem do formulário da SC (C2), da Cotação (C3) **e** (INFERIDO pelo nome do dataset e
   pelo sintoma "0 campos no DOM") os formulários de RH que resolvem a matrícula do usuário —
   Gestão de Dependentes, Substituição de Cargos e o widget Gestão de Equipes (parte de C5).
   Um único conserto no ambiente devolve 30 + 3 + 6 testes.

---

### C2 — O formulário clássico da Solicitação de Compras abre com "Não foi possível estabelecer comunicação com o ERP" (30 testes)

#### Mecanismo, lido no código

`pages/FormularioSolicitacaoCompraPage.js`:

- `goto()` (linhas 148–199) registra, **antes** de navegar, três escutas: `errosDeDatasetNaCarga`
  (toda resposta ≥ 400 de `/api/public/ecm/dataset/`, com o nome do dataset lido do
  `postData()`), `inicializacaoConcluida` (`waitForResponse(RESPOSTA_FIM_DA_INICIALIZACAO)`,
  60 s — o sinal positivo de que a montagem terminou) e `falhaDeErpNaCarga` (`getByText(/comunica[çc][ãa]o com o ERP/i)` dentro do iframe, 60 s — o sinal negativo).
- `expectAberto()` (209–257) espera o heading "Início", depois faz `Promise.race` entre o
  heading do formulário e a faixa do ERP. Se a faixa vence, chama
  `faltaPreCondicao('(ambiente): o formulário de Solicitação de Compras abriu com a falha de integração do ERP …')`.
- `expectMontagemConcluida()` (272–316) repete a corrida entre `inicializacaoConcluida` e a
  faixa. Só no ramo "a resposta de fim de montagem não chegou em 60 s" a mensagem inclui
  `errosDeDatasetNaCarga` — **no ramo `erp-fora`, não inclui**.

O passo registrado nos 30 casos é `Wait for event "response"`: é o `waitForResponse` da
inicialização ainda pendente no instante em que a faixa apareceu (~8 s após a carga, conforme o
comentário do próprio Page Object) e a corrida resolveu `erp-fora`. Daí as durações de 8–29 s
em vez dos 60 s do timeout — a suíte falhou rápido, de propósito.

Todos os 30 passam por esse ponto, direta ou indiretamente: os smokes e validações chamam
`formulario.goto(); formulario.expectAberto()`; os `@destrutivo` de aprovação/alçada/tarefa
passam por `criarSolicitacaoCompraClassica` (`pages/CicloCompradorPage.js:256`) ou
`criarEAssumirNoPoolGestorImediato` (`aprovacoes-solicitacao-compras.spec.js:283`,
`acoes-da-tarefa.spec.js:75`), que chamam exatamente os mesmos dois métodos.

#### Por que é ambiente, não produto nem suíte

- A faixa é renderizada pelo script do próprio formulário quando a chamada de inicialização ao
  ERP falha. A causa medida em `docs/massa-de-dados-no-ambiente-dev.md` §4:
  `POST /api/public/ecm/dataset/datasets {"name":"ds_protheus_getMatriculaTitular_rest"}` →
  `HTTP 500 {"message":"WFLYEJB0054: Failed to marshal EJB parameters"}`. `WFLYEJB0054` é código
  do subsistema EJB do WildFly (servidor de aplicação do Fluig): a chamada nem chega ao
  Protheus — falhou ao serializar os parâmetros do EJB que executa o dataset. Não muda quando o
  Protheus é restabelecido (medido, mesmo doc).
- Enquanto isso, `getBranches` (71 filiais), `getProdutos` (3.100) e `getFuncionarios` (72.369)
  respondem — a integração está **parcial** (`docs/viabilidade-no-ambiente-213859.md` §2). É
  um dataset específico, não "Protheus fora".
- Sem a montagem não há validação de cliente, não há combos, não há Enviar: nada do que os 30
  testes afirmam é observável. Declarar `PRÉ-CONDIÇÃO AUSENTE` é a leitura correta de
  `docs/estabilidade-do-ambiente.md` (categoria 1).

#### O que acontece quando o formulário voltar a montar — leia antes de comemorar

A faixa é só a **primeira** barreira. `docs/massa` §4 mostra que, com o formulário montando (ou
com a SC criada por API), a atividade **233 "Grava SC e Anexos"** não conclui e a SC cai em
**236 Correção** após 12–19 min. Efeito por teste, quando C2 destravar:

- **Voltam a passar sozinhos** os que só precisam da tela montada: smoke de abertura,
  CT-CMP-02-S1/S2/S3, FSWTBC-4952, FSWTBC-1906/1954, FSWTBC-4819, FSWTBC-4632, CT-CMP-03-S1 —
  11 testes.
- **Passam a reprovar pela assertion, e isso é o teste fazendo o trabalho dele:**
  `ciclo-solicitacao-compras.spec.js:443` (SLA de 233 ≤ 2 min, sem Correção) — **não tem
  `@bug`**, então vira `REGRESSÃO` no gate; é a leitura certa, porque mede exatamente o defeito
  de integração vivo hoje (FSWTBC-4459/4828). O `@bug` de `:581` (numSolCompra vazio) reprova
  pela assertion do defeito, como deve.
- **Continuam em pré-condição, agora por outro motivo:** os 15 `@destrutivo` que precisam da
  SC **em "Validação do Gestor"** (aprovações ×3, alçadas ×5, atribuição, ciclo-comprador
  83/293, ações da tarefa ×2, CT-ACC-09-H) — `aguardarAtividadeAtual` /
  `criarEAssumirNoPoolGestorImediato` esperam 180 s por uma etapa que hoje leva 12–19 min para
  falhar. Eles só voltam quando **233 gravar**.

#### Solução, por dono

**Ambiente (Fluig da Cassi / infra TOTVS) — é o que destrava de verdade:**

1. **`WFLYEJB0054` em `ds_protheus_getMatriculaTitular_rest`.** Pedir o `server.log` do WildFly no
   horário de uma carga (qualquer uma das 30, ex. 10:46:08 BRT) — a linha `WFLYEJB0054` vem com
   a stack do EJB e o tipo que não serializou. Causas típicas desse código (INFERIDO — não há
   referência específica na skill `fluig-master`, cujo `infraestrutura.md` não trata EJB): dataset
   que invoca um **serviço registrado** (Painel de Controle → Serviços) cujo artefato mudou de
   versão/assinatura depois de um deploy, ou parâmetro não serializável passado ao serviço. A
   skill `fluig-master/references/datasets.md` recomenda confinar a integração num único
   `buscarX()` — é onde olhar. Critério de aceite objetivo: o `POST` acima responder 200 com a
   matrícula de `TOTVS-FS` (ou uma resposta de negócio "não localizado", que é diferente de 500).
2. **Atividade 233 "Grava SC e Anexos".** É a *atividade de serviço* que abre a SC no Protheus e
   cria a pasta no GED; 233 → 236 é o **evento de captura de erro** que a modelagem exige
   (`fluig-master/references/processos-modelagem.md`, "Atividade de serviço — Regras
   estruturais"). O script da atividade recebe `(attempt, message)` — o `message` da tentativa
   que falhou está no histórico da SC e no log; é a segunda coisa a pedir. Provável (INFERIDO)
   que o script leia a matrícula do solicitante pelo mesmo dataset de (1), o que explicaria os
   dois sintomas terem a mesma origem. Aceite: `node scripts/semear-massa.mjs --quantidade=1
   --acompanhar` mostrando a SC em **7 Validação do Gestor** em ≤ 2 min (o SLA que
   FSWTBC-4828 define).
3. Manter `npm run canario` como porta de entrada da execução: ele diz em ~1 min se (1) está de
   pé **naquele momento**, e esta execução prova que uma janela ruim dura mais que a suíte.

**Automação — o que já está pronto e o que pode mudar de desenho:**

- Com (1) e (2) resolvidos, **nada precisa ser escrito**: `scripts/semear-massa.mjs` +
  `factories/massa-solicitacao-compra.js` levam massa até 257 pelo caminho já provado (pools +
  `workflowView/send`, docs/massa §1 e §3).
- Melhoria de desenho legítima, sem enfraquecer nada: nos 15 testes em que a SC é **apenas
  pré-condição** (alçadas, atribuição, ciclo do comprador 83/293/312, ações da tarefa,
  aprovações), criar a SC por API (`/start` com `targetState: 0`) em vez de pelo formulário.
  Desacopla 15 testes da faixa do ERP e reduz ~2 min por teste de preenchimento de combos.
  Fica **fora** dessa mudança tudo que mede o formulário em si (CT-CMP-01-H, 02-S*, 03-S1,
  FSWTBC-4632/4819/4952/1906/4941 e os dois CT-CMP-02-S4): ali o formulário é o objeto, e o D-01
  já mostrou que o payload do widget difere do da API (`targetState` 6 × 0, skill
  `cassi-fluig-master`, SKILL.md item 6). Continua gated por 233 — não destrava nada hoje, mas
  encurta a cauda quando destravar.

**Suíte — ajustes que melhoram a leitura, sem contornar o defeito:**

- `FormularioSolicitacaoCompraPage.expectAberto()/expectMontagemConcluida()`: no ramo
  `erp-fora`, anexar `errosDeDatasetNaCarga` à mensagem (hoje só o ramo "sem resposta" faz
  isso). O relatório passaria a dizer `ds_protheus_getMatriculaTitular_rest → HTTP 500` em cada
  um dos 30 vermelhos, em vez de exigir a consulta ao doc. É informação que a escuta já coleta.
- Registrar em `docs/mapa-do-ambiente.md` a duração da janela medida aqui (≥ 40 min contínuos)
  ao lado do "2 em 3 cargas".

---

### C3 — O formulário de Cotação abre com a mesma faixa do ERP (3 testes)

#### Mecanismo

`pages/FormularioCotacaoPage.js:82–108` (`expectSemFalhaDeErp`) e `pages/CotacaoPage.js:87–118`:
depois dos quatro headings, esperam **até 30 s** pela faixa `/comunica[çc][ãa]o com o ERP/i`
dentro do iframe; se ela aparece, `faltaPreCondicao('(ambiente): o formulário de Cotação abriu
com a falha de integração do ERP …')`. O comentário do Page Object registra por que a espera é
longa: a faixa chega ~8 s depois dos headings, e ler a tela antes disso fazia o teste reprovar
pelo sintoma (Sub Total `""` em vez de `"0,00"`), que parecia defeito de cálculo. Durações
medidas de 5,9–7,0 s: a faixa veio rápido.

#### Por que é ambiente

Mesma causa de C2 (o formulário de Cotação também resolve o usuário no ERP na carga —
INFERIDO pela mensagem idêntica e pelo mesmo momento de falha). A skill `cassi-fluig-master`
(`references/regras-de-negocio-compras.md`) coloca a Cotação como etapa **derivada** da SC no
Protheus — o formulário avulso (`wf_cotacao_produtos_servicos` fora de contexto) é um *shell*
cujos totais nascem do ERP; sem ERP, os oito campos de total ficam vazios e nada é observável.

#### Solução

- **Ambiente:** o mesmo item (1) de C2. Não há ação separada.
- **Automação:** nenhuma. Quando C2 destravar, `abertura-cotacao:27` e `ciclo-cotacao:88`
  voltam a passar; `ciclo-cotacao:127` (`@bug`) volta a **reprovar pela assertion do defeito**
  (o shell aceita Enviar sem fornecedor/vínculos), até o produto validar.
- **Suíte:** o texto da mensagem de `CotacaoPage` ("os campos de total nascem vazios") é
  preciso; nada a mudar. Há uma diferença de custo entre os dois Page Objects — `FormularioCotacaoPage` gasta 30 s inteiros quando o formulário está **saudável** (espera a faixa não aparecer), enquanto `FormularioSolicitacaoCompraPage` corre a faixa contra o sinal positivo. Vale replicar a corrida na Cotação (sinal positivo = totais preenchidos com `0,00`); é ganho de tempo, não de veredito.

---

### C4 — "Atuar como" não é renderizado: a conta não é comprador no ERP (6 testes)

#### Mecanismo

`pages/PortalCompradorPage.js:55–63` (`expectSeletorAtuarComoDisponivel`): `comboAtuarComo =
page.locator('select')`; se `count() === 0`, `faltaPreCondicao('(ambiente): o seletor "Atuar
como" não é renderizado no Portal do Comprador deste ambiente …')`. Quatro testes passam por aí
(`ciclo-comprador` 173/210/254 via `atuarComoSubstituto`, `portal-comprador:63`). Os outros dois
(`ciclo-cotacao:170`, `negociacao-proposta:133`) afirmam o oposto — `expect(comboAtuarComo).toHaveCount(0)` —, conferem o estado vazio da grade e terminam com um `faltaPreCondicao`
**incondicional**: são testes que existem para registrar a fila vazia, não para passar.

#### Por que é ambiente (cadastro), não produto

As três filas delegadas do Portal do Comprador (Controle de Cotações, Avaliação de Propostas,
Definir Vencedor) são montadas a partir do **código de comprador do Protheus** (`Y1_USER` na
SY1) vinculado ao login Fluig; "Atuar como" lista os compradores que delegaram ao usuário.
`TOTVS-FS` não tem registro na SY1 (`dsProtheus_getCompradores_restGetAll` responde uma linha
`{"error": …}` — `docs/viabilidade` §1, `docs/massa` §4; o canário das 12h ainda o vê FORA).
Sem comprador e sem delegação, o widget não tem o que listar no `<select>` e não o renderiza
(INFERIDO: no `caixade182374` o mesmo widget renderizava o seletor com "Arthur de Almeida
Santos" como opção — a diferença entre os dois tenants é o cadastro, não o código do portal).

Duas coisas que **não** são o bloqueio, para não perseguir a pista errada:

- **Não é falta de cotação.** Há **14 cotações ATIVAS** em `wf_cotacao_produtos_servicos`
  neste tenant (7 em *Recepção de Propostas*, 6 em *Validação do Comprador*, 1 em *Notifica
  Fornecedor*), nenhuma com `TOTVS-FS` responsável (`docs/massa` §5, item 3).
- **Não é o D-01.** As mensagens de `ciclo-cotacao:170` e `negociacao-proposta:133` ainda dizem
  que "toda SC criada por esta suíte fica presa no marco de Início" — isso era o widget com
  `targetState: 6` no tenant antigo. Aqui a SC por API anda até 233 (docs/massa §1); o que a
  impede de virar cotação é 233, e o que impede a conta de **ver** a cotação é a SY1. São dois
  bloqueios distintos, e o texto atual mistura os dois.

#### Solução

- **Ambiente/cliente:** cadastrar `TOTVS-FS` na **SY1** com `Y1_USER` = login Fluig (é o item
  4 de `docs/viabilidade` "O que destravaria mais" e o item 2 de `docs/massa` §7). Alternativa
  de menor alçada: um comprador real conceder delegação "Atuar como" a `TOTVS-FS` — devolve a
  visão sem tornar a conta compradora. Com qualquer uma das duas, as 14 cotações existentes
  aparecem nas filas e os 6 testes voltam a ter o que medir **sem depender de 233**.
- **Automação:** nada a criar — cotação nasce da SC no Protheus (`regras-de-negocio-compras.md`),
  e o pool (`G.P.Cotacao_de_Produtos_Servicos_Inicio`) só permite *iniciar* o processo, não
  vinculá-lo a um comprador. Caminho alternativo já provado para Validação do Comprador (119) é
  o **pool** `G.P.Requisicao_de_Compras_Validacao_Compradores` (docs/massa §3), que não passa
  pelo Portal — serve a `aprovacoes:594`, não a estes seis.
- **Suíte (ajustes concretos):**
  1. `PortalCompradorPage.comboAtuarComo = page.locator('select')` é genérico demais: qualquer
     `<select>` que o portal venha a renderizar (um filtro, por exemplo) satisfaz a pré-condição
     e `atuarComoSubstituto()` operaria o controle errado. Ancorar pelo rótulo ("Atuar como:") —
     é o gancho estável que o próprio comentário do arquivo (linhas 19–27) descreve.
  2. `ciclo-cotacao.spec.js:170` e `negociacao-proposta.spec.js:133`: atualizar a mensagem.
     Remover as instâncias (113002, 112860, 112839, 113025, 112994), assignees e a data
     01/09/2026 do tenant `caixade182374`; substituir por uma frase e um ponteiro
     (`docs/excecoes-de-pre-condicao.md` casos 5–6 e `docs/massa` §5), que é onde a investigação
     já vive e é versionada. Corrigir a atribuição ao D-01 pelo par "233 + SY1".
  3. Os dois mesmos testes têm uma polaridade escondida: `expect(comboAtuarComo).toHaveCount(0)`
     vem **antes** do `faltaPreCondicao`. No dia em que a delegação for configurada, eles
     reprovam por essa assertion (sem anotação) e o gate lê `REGRESSÃO`. Ou recebem `@achado`
     (é o que eles são: afirmam o estado real), ou trocam a assertion por
     `expectSeletorAtuarComoDisponivel()` como os outros quatro. Não há valor em manter dois
     testes cujo único desfecho possível é vermelho.

---

### C5 — Filas e massa vazias (16 testes), subdivididos pelo motivo real

O rótulo agrupa cinco situações diferentes, com donos diferentes:

| Sub-causa | Testes | Motivo real |
|---|---:|---|
| C5-a — pool/fila da SC vazia | 3 | nenhuma SC passa de 233; o pool que enche é o de Correção |
| C5-b — Faturamento de Contratos sem massa | 4 | zero FC aberta; o disparo automático não rodou nos meses medidos |
| C5-c — formulários de RH que não montam / widget sem desfecho | 6 | mesma causa de C2 (matrícula no ERP); um deles é o `@bug` de Admissão, que **montou** e reprovou certo |
| C5-d — Central de Tarefas mudou de versão | 2 | Page Object preso a uma chamada que a nova Central não faz; nenhum cartão atrasado |
| C5-e — cadastro do SIGAJURI | 1 | combo "UF" sem nenhuma opção |

#### C5-a — o pool que a conta alcança está vazio da SC certa (3 testes)

**Mecanismo.** `aprovacoes:594` — `CentralTarefasComprasPage.abrirTarefasEmPool()` +
`listarGrupos()` devolvem `[]` e o teste chama `faltaPreCondicao('nenhuma tarefa no pool de
Validação dos Compradores …')`; o painel "Tarefas em pool (N)" só vira link quando N > 0
(comentário nas linhas 70–79 do Page Object). `ciclo-comprador:40` — `esperarLinhasReais`
(`utils/grade.js`) espera até 40 s por uma linha que não seja `No data found` e devolve 0 →
`faltaPreCondicao('(ambiente): a Validação Inicial não trouxe nenhuma solicitação …')`
(54 s de duração: 40 s de espera + navegação). `etapa-automatica-distribuicao:46` — varre
`/process-management/api/v2/requests` (até 400 itens), acha **1** SC visível à conta e nenhuma
com passagem por "Distribuição Gestor Or…" → pré-condição.

**Por que é ambiente.** Os três precisam de SC que tenha passado de 233 (para 119, para a fila
de Validação Inicial do comprador designado, e para 280). Hoje nenhuma passa (`docs/massa` §4).
A única SC visível à conta às 10:40 era a 96363, semeada às 10:18 e presa em 233. Além disso,
Validação Inicial lista a fila do **comprador designado** — que, sem SY1, nunca é `TOTVS-FS`.

**O que a execução mostrou a mais (leitura transversal, item 2).** O pool não estava vazio o
tempo todo: às 11:25 `assumir-tarefa-pool` assumiu uma tarefa. É o pool de **Correção** (236)
recebendo as semeadas que falharam em 233 — útil para CT-TSK-02-H, inútil para
`Validação dos Compradores`. E há um efeito colateral: a massa semeada, que deveria "ficar viva"
para o desenvolvedor medir 233, está sendo assumida por um teste que não sabe que ela é massa.

**Solução.** Ambiente: item (2) de C2 (233). Automação: com 233 gravando, `semear-massa.mjs`
deixa SC em 7 e a conta a leva por pool até 119 — `aprovacoes:594` passa a exercitar de
verdade. Para `ciclo-comprador:40` é preciso **também** SY1 (C4). Suíte: (a) em
`assumir-tarefa-pool.spec.js`, ignorar grupos de Correção quando o cartão trouxer a marca
`QA-MASSA` — ou, ao menos, anotar qual solicitação assumiu, para o desenvolvedor saber que a
massa foi tocada; (b) `portal-comprador.spec.js:41` (o verde falso, item 3 da leitura
transversal) deve usar `esperarLinhasReais`, senão continuará contradizendo `ciclo-comprador:40`
no mesmo relatório.

#### C5-b — Faturamento de Contratos sem instância nem disparo automático (4 testes)

**Mecanismo.** `fila-faturamento-protheus:49` (`@bug`) lista `wf_faturamento_contratos` com
`expand=currentMovements` em até 10 páginas de 200: zero instâncias abertas →
`faltaPreCondicao('(ambiente): nenhuma instância aberta de Faturamento de Contratos para
inspecionar')` — **a assertion do `@bug` (nenhuma presa em "Aguarda processamento Fila
Protheus") não foi avaliada**. `tracker-compras:220` e `:340` filtram o Tracker (visão
Faturamento de Contratos) no mês corrente e no anterior e ficam com **0 FC do Usuário
Integrador não cancelada** (anotação: agosto tinha 1 FC, não do Integrador) → pré-condição.
`validacoes-faturamento:279` precisa ler "Tarefas em pool" para afirmar que **não** existe grupo
de Fiscal/CSE/Medição; sem tarefa no pool o link não existe e o teste declara que não conseguiu
ler (mensagem: "Entradas oferecidas agora: … Tarefas a concluir 1 | Solicitações 3 …").

**Por que é ambiente.** Faturamento de Contratos nasce de duas formas
(`cassi-fluig-master/references/medicao-e-faturamento.md`): o **disparo automático** do
Protheus (schedule, um processo por filial do contrato com `CN1_MEDAUT`) e a abertura manual
pelo fiscal. Neste tenant não havia contrato até 09/09 (zero em `getContratos`; o canário das
12h já vê 20) e não há FC alguma. Sem contrato não há medição, sem medição não há fila, e sem
disparo não há duplicata a procurar. É a mesma classe da exceção 7 de
`docs/excecoes-de-pre-condicao.md`.

**Solução.** Ambiente: (i) contratos vigentes com medição automática na base (já começaram a
aparecer — confirmar com `dsProtheus_getContratosxFornecedores_restGet` sustentando o número
em cinco amostras, protocolo de `docs/estabilidade`); (ii) o schedule do disparo rodando neste
tenant — o Tracker mostrará FCs do "Usuário Integrador" no dia seguinte; (iii) para
`validacoes-faturamento:279`, qualquer tarefa em pool basta (233 resolvido já basta). Automação:
nada — o disparo é do Protheus, e abrir FC manual exige perfil de fiscal que a conta não tem
(`docs/viabilidade` §5). Suíte: a mensagem de `:279` ainda diz "o menu Mais opções não ofereceu
Tarefas em pool" — "Mais opções" não existe mais aqui (mapa, tabela do topo); e o parágrafo de
investigação embutido (01/09, SC 112679, "targetState diferente de 6 … nunca confirmado como
reprodutível") ficou **falso**: `targetState: 0` foi reproduzido oito vezes em 10/09. Atualizar
os dois textos e apontar para `docs/massa`.

#### C5-c — formulários de RH que não montam e o widget que não responde (6 testes)

**Mecanismo, teste a teste.**

- `dependentes:34` — `DependentesPage.lerDesfechoDaIdentificacao()` procura o bloqueio "não foi
  possível determinar a matrícula do titular" e conta `input/select/textarea` no iframe:
  `bloqueado=false · 0 campo(s) visível(is) de 0 no DOM`. O teste espera **ou** o bloqueio
  (o que o caso CT-DEP-02-S1 mede) **ou** os 39 campos medidos em 09/09; recebeu um iframe
  vazio e declarou pré-condição. 3,8 s.
- `substituicao-cargos:33` (`@achado`) — `lerAcessoAosCamposDeSubstituto()` devolve
  `motivo: nenhum · 0 campo(s) de substituto no DOM`: nem a faixa do ERP, nem "Funcionário não
  localizado", nem campo algum — iframe em branco → `faltaPreCondicao`. **O achado não mudou;
  ele não foi observado.**
- `gestao-equipes:70/103/120` (`@bug` ×3) — `abrirGestaoDeEquipes()` espera até 45 s por um
  SweetAlert2 que **não** seja o de "Carregando…"; recebeu nenhum (ou só o de carregamento) →
  `faltaPreCondicao('o widget não exibiu diálogo de desfecho em 45s …')`. ~50 s cada. **A
  assertion do defeito (título "Sucesso:" numa falha, ícone `danger`, tela em branco) não foi
  avaliada.**
- `admissao:37` (`@bug`) — **diferente dos outros cinco**: `lerTituloDoFormularioInterno()`
  esperou o formulário montar, leu o título e a assertion reprovou:
  `Expected: not "Gestão de Benefícios - Plano de Saúde"`. O processo de Admissão continua
  servindo o template de Plano de Saúde. É o `@bug` fazendo o que deve.

**Por que é ambiente (cinco) e produto (um).** Os três formulários de RH e o widget resolvem a
**matrícula do usuário no ERP** na carga — é a identificação do titular/solicitante que
`dependentes.spec.js` e `substituicao-cargos.spec.js` descrevem, e o "Usuário não encontrado no
ERP Protheus" que `gestao-equipes.spec.js` documenta. O dataset que faz isso é, pelo nome,
`ds_protheus_getMatriculaTitular_rest` — o mesmo que responde `WFLYEJB0054` (INFERIDO: não há
captura de rede desses três specs nesta execução; a inferência vem do nome do dataset, do
sintoma idêntico "0 campos" e da própria nota de `substituicao-cargos.spec.js:61–66`, que já
registra a faixa do ERP alternando com carga em branco neste tenant). Quando um `displayFields`
ou o script de carga do formulário falha antes de renderizar, o iframe fica sem campos — é o
comportamento descrito em `fluig-master/references/formularios.md` para `displayFields` ("o único
que altera antes da renderização"). Admissão é produto: associação processo↔formulário errada,
independente de ERP.

**Sobre as duas anotações `pre-condicao-ausente` em `substituicao-cargos` e a leitura do gate.**
Os três specs de RH empilham, no início do teste, uma anotação **estática** com
`type: ANOTACAO_PRE_CONDICAO` descrevendo os subcasos que não são alcançáveis (CT-SUB-01-H/S1/S2,
CT-DEP-01-H/S1/S2/S3, CT-ADM-01-S1/S2) — o docstring de `utils/pre-condicao.js:7–11` registra
isso como intencional ("anotam a pré-condição e PASSAM"). Quando o teste depois chama
`faltaPreCondicao`, uma **segunda** anotação do mesmo tipo é empurrada, com o motivo real. Não é
defeito que mude o veredito — `scripts/veredito-do-gate.mjs:101` testa `@bug|@achado` **antes**
de olhar anotações, então `admissao` e `substituicao-cargos` são `conhecido` de qualquer forma,
e `dependentes` (sem tag) cai em `pre-condicao` porque `.find()` acha a primeira. Mas é um
defeito de **legibilidade** da suíte: qualquer ferramenta que leia a primeira anotação exibe o
texto sobre subcasos, não o motivo da falha (foi o que `falhas-detalhadas.jsonl` fez ao
colapsar as duas num dicionário — só a última sobreviveu). Ajuste: dar à anotação estática um
tipo próprio (`subcasos-nao-alcancaveis`, por exemplo) nos três arquivos. Para `admissao`, o
ponto a deixar explícito no relatório: **a anotação de pré-condição está lá e o teste reprovou
pela assertion do defeito ao mesmo tempo — é intencional; a anotação fala dos subcasos S1/S2, o
vermelho é o CT-ADM-01-H; `@bug` tem precedência no gate.**

**Solução.** Ambiente: item (1) de C2 — é o mesmo dataset. Depois disso: `dependentes` volta a
ver 39 campos (e continua em pré-condição, porque o caso exige titular **sem** matrícula e a
conta resolve a dela aqui — reavaliar CT-DEP-01-H/S1/S2/S3, que podem ter ficado exercitáveis);
`substituicao-cargos` volta a observar seus 16 campos de substituto e afirma se seguem
inacionáveis; `gestao-equipes` volta a receber o "Sucesso: Usuário não encontrado no ERP" e os
três `@bug` **reprovam pelo defeito** até FSWTBC-630 ser corrigido. Produto: Admissão — corrigir
a associação do processo `wf_automacao_admissao` ao formulário de admissão. Suíte: o tipo da
anotação estática (acima); e em `gestao-equipes:70` o `return` silencioso quando a mensagem não
é de erro — se um dia `TOTVS-FS` ganhar matrícula, o cenário do FSWTBC-630 deixa de ocorrer e o
teste passa **sem medir nada**; trocar por anotação explícita ("cenário não ocorreu: usuário
resolvido no ERP") mantém o verde honesto.

#### C5-d — a Central de Tarefas deste tenant é outra versão (2 testes)

**Mecanismo.** `cancelamento-solicitacao:132` criou a própria massa (questionário
`prc_questionario_v2`, `processInstanceId=96374`, anotado — o teardown a recolhe), confirmou
`OPEN/active` no servidor e, ao abrir "Minhas solicitações", esperou 20 s por
`/ecm/api/rest/ecm/centralTasks/getTasks/requests/`; a chamada não saiu →
`faltaPreCondicao('(ambiente): abrir "Minhas solicitações" não disparou … nesta versão da
Central …')` (`pages/MinhasSolicitacoesPage.js:80–100`; a Cancelamento reaproveita a mesma
abertura). 42,9 s. `minhas-solicitacoes:14` abriu a lista (6 cartões), nenhum com "Atrasada há"
→ pré-condição.

**Por que é ambiente — e, no primeiro, também suíte.** O mapa registra que a Central mudou
("Mais opções" e "Você" não existem; categorias são abas diretas). A rota que o Page Object
escuta é da versão antiga. O cancelamento em si **funciona** neste tenant:
`CT-TSK-05-S1` (`:247`, o mesmo endpoint por API) passou. Quanto ao atraso: cartão "Atrasada há"
exige tarefa com prazo vencido para esta conta; as 6 solicitações abertas são recentes.

**Solução.** Suíte (dono principal para `:132`): medir que chamada a nova Central faz ao abrir
"Minhas solicitações" (o `page.on('response')` de uma carga manual basta) e trocar a escuta; o
Page Object já localiza o cartão por `task-card-component[data-process-key^="<id>."]`, então a
dependência do corpo da resposta pode ser substituída pela ordenação + cartão no DOM. Não é
enfraquecer: a assertion final continua sendo `status: CANCELED` lido no servidor. Ambiente
(`:14`): manter ao menos uma solicitação com prazo vencido para `TOTVS-FS` na homologação —
ou, INFERIDO como alternativa de automação, criar uma solicitação em processo com prazo curto e
esperar o vencimento (custa tempo de execução; decidir com o dono do ambiente).

#### C5-e — o combo "UF" do SIGAJURI_Contencioso não oferece opção alguma (1 teste)

**Mecanismo.** `SigajuriPage.selecionarComPreCondicao()` (`pages/SigajuriPage.js:151–166`) lista
as opções reais do `<select>` antes de escolher; `MA` não está entre elas — a lista é
`(nenhuma opção)` → `faltaPreCondicao`, com a instrução explícita de **não** trocar o valor
pedido no teste.

**Por que é ambiente.** Em 27/08 (tenant antigo) o combo tinha MA/SP/RJ/DF (docstring do
spec). Aqui vem vazio. O mapa (linha 353) registra que o serviço **SIGAJURI não está
registrado** neste Fluig (`ServiceNotFoundException` nos combos de Consultivo/Contrato); a UF do
Contencioso vem, provavelmente, de dataset alimentado pelo mesmo serviço (INFERIDO — o teste
`:196` do mesmo arquivo, `@bug`, é sobre outro campo). `docs/excecoes-de-pre-condicao.md` 9–10
já formaliza essa dependência como ausência de **serviço**, não de massa.

**Solução.** Ambiente: registrar o serviço SIGAJURI em Painel de Controle → Serviços (ou a
TOTVS restabelecer a integração). Aceite: `POST /api/public/ecm/dataset/datasets` para o
dataset da UF responder linhas com siglas. Automação: nenhuma — serviço externo. Suíte: nada a
mudar; a mensagem já diz o certo.

---

## Blocos por teste

Convenções dos blocos: **Classe no gate** é a coluna `gate` de `falhas-detalhadas.jsonl`
(`pre-condicao` | `conhecido-bug` | `conhecido-achado`), que coincide com o que
`scripts/veredito-do-gate.mjs` produziria. Quando o mecanismo é o de uma seção de causa, o
bloco aponta para ela em vez de repetir.

### C2 — formulário da SC sem ERP

#### tests/e2e/compras/abertura-solicitacao-compras.spec.js

##### CT-CMP-01-H (metade "render") — deve abrir completo, com Identificação pré-preenchida, Entidade/Filial e Produtos/Serviços
- **Local:** `tests/e2e/compras/abertura-solicitacao-compras.spec.js:36` · **Classe no gate:** pre-condicao · **Duração:** 11,2 s
- **O que o teste verifica:** smoke de render do formulário clássico: Nº do Processo com placeholder "Gerado ao Movimentar", Solicitante/e-mail/data/hora pré-preenchidos pelo Fluig, bloco Entidade (Nº SC ERP, Nº Cotação ERP, Código da Filial, Data de Emissão, Justificativa) visível, bloco Produtos com botão "Adicionar". A guarda de escrita prova que abrir não escreve (`tentativas() === 0`).
- **Por que falhou:** em `expectAberto()` a faixa "Não foi possível estabelecer comunicação com o ERP" venceu a corrida contra o heading do formulário (passo `Wait for event "response"`) → `PRÉ-CONDIÇÃO AUSENTE (ambiente): … Nenhum campo é montado`. Mecanismo em C2.
- **Como solucionar:** Ambiente — `WFLYEJB0054` em `ds_protheus_getMatriculaTitular_rest` (C2, item 1). Suíte — incluir `errosDeDatasetNaCarga` na mensagem do ramo `erp-fora`.
- **Quando fica verde e o que passa a provar:** na primeira carga em que a faixa não aparece e `RESPOSTA_FIM_DA_INICIALIZACAO` chega; prova que o formulário monta com os campos de identificação resolvidos pelo Fluig. É o teste mais barato para confirmar o destrave de C2 (`-g "deve abrir completo, com Identificação"`).
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia SC (1)). O destrave do formulário/fila bastou.

#### tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js

##### CT-CMP-04-H (+ FSWTBC-2681/5035/4527) — assumir e aprovar tarefa do pool do Gestor Imediato
- **Local:** `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js:332` · **Classe no gate:** pre-condicao · **Duração:** 10,9 s
- **O que o teste verifica:** cria a SC pelo formulário, espera-a chegar ao pool `G.P.Requisicao_de_Compras_Gestor_Imediato`, assume, lê a grade `tbManager` via `/requests/{id}?expand=formFields` (estado antes da decisão — os três chamados), aprova com justificativa e confirma no Histórico que a atividade saiu de "Validação do Gestor".
- **Por que falhou:** `criarEAssumirNoPoolGestorImediato` → `expectAberto()` → faixa do ERP. Nem a SC foi criada.
- **Como solucionar:** Ambiente — C2 item 1 **e** item 2 (233): sem 233 gravar, a SC não chega ao pool em 180 s. Automação — massa por API (`semear-massa.mjs`) quando 233 gravar; o caminho pool → assumir → `workflowView/send` já está provado (docs/massa §1).
- **Quando fica verde e o que passa a provar:** SC criada, em "Validação do Gestor" em ≤ 2 min, assumida e aprovada pela conta; Histórico com a decisão. Enquanto 233 falhar, passará de pré-condição "ERP" para pré-condição "não chegou ao pool em 180 s" — leitura diferente, mesma família.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE`, mas **mais adiante**: o formulário montou e o teste criou a SC #96382, que não chegou assumível à Validação do Gestor em 180 s. O bloqueio saiu do formulário e foi para o BPMN (atividade 233); destrava junto com ela.

##### CT-CMP-04-S1 — assumir e reprovar com justificativa
- **Local:** `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js:444` · **Classe no gate:** pre-condicao · **Duração:** 9,1 s
- **O que o teste verifica:** mesma pré-condição de CT-CMP-04-H; reprova (Não + justificativa) e afirma que a atividade atual deixa de ser "Validação do Gestor" (anota se parece Correção).
- **Por que falhou:** idêntico ao anterior — faixa do ERP em `expectAberto()`.
- **Como solucionar:** como CT-CMP-04-H.
- **Quando fica verde e o que passa a provar:** que a reprovação do Gestor tira a SC da etapa e registra a justificativa.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE`, mas **mais adiante**: o formulário montou e o teste criou a SC #96381, que não chegou assumível à Validação do Gestor em 180 s. O bloqueio saiu do formulário e foi para o BPMN (atividade 233); destrava junto com ela.

##### CT-CMP-05-S1 — sinalizar explicitamente quando não há aprovador habilitado
- **Local:** `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js:487` · **Classe no gate:** pre-condicao · **Duração:** 8,4 s
- **O que o teste verifica:** cria SC de R$ 25.000.000,00 (500 × 50.000) para tentar cruzar alçada, aprova no Gestor e afirma a condição incondicional: **ou** a mensagem "Não foi encontrado nenhum usuário habilitado…" aparece, **ou** a atividade avança — nunca trava silenciosa.
- **Por que falhou:** faixa do ERP em `expectAberto()`.
- **Como solucionar:** como CT-CMP-04-H. Observação: a massa de alto valor é preenchida no formulário; na variante por API, o mesmo override cabe em `factories/massa-solicitacao-compra.js`.
- **Quando fica verde e o que passa a provar:** ausência de trava silenciosa na transição Gestor → Orçamentária.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE`, mas **mais adiante**: o formulário montou e o teste criou a SC #96383, que não chegou assumível à Validação do Gestor em 180 s. O bloqueio saiu do formulário e foi para o BPMN (atividade 233); destrava junto com ela.

#### tests/e2e/compras/ciclo-solicitacao-compras.spec.js

##### CT-CMP-01-H — criar e enviar a SC com todos os campos válidos
- **Local:** `tests/e2e/compras/ciclo-solicitacao-compras.spec.js:348` · **Classe no gate:** pre-condicao · **Duração:** 25,0 s
- **O que o teste verifica:** caminho feliz completo pelo formulário (filial no zoom, justificativa `QA…`, produto, quantidade/preço, rateio 100%, anexo), Enviar, e prova de existência real: segue o link "Acessar solicitação #N", confere URL com `processInstanceId` e a justificativa desta execução no detalhe.
- **Por que falhou:** `criarSolicitacaoCompletaEEnviar` → `expectAberto()` → faixa do ERP.
- **Como solucionar:** Ambiente — C2 item 1. **Este teste deve continuar pelo formulário** (o formulário é o objeto). Não migrar para API.
- **Quando fica verde e o que passa a provar:** que o formulário cria a SC de verdade — independe de 233 (a assertion para no detalhe da solicitação). É o segundo teste a rodar após um canário verde.
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia ciclo da SC). O destrave do formulário/fila bastou.

##### FSWTBC-4156 / 4229 / 4639 / 4459 / 4828 — a integração conclui dentro do SLA, sem Correção e sem falha no Histórico
- **Local:** `tests/e2e/compras/ciclo-solicitacao-compras.spec.js:443` · **Classe no gate:** pre-condicao · **Duração:** 15,7 s
- **O que o teste verifica:** cria a SC e, por API de dentro da página, espera até 200 s a tarefa "Grava SC e Anexos" concluir; afirma SLA (≤ 2 min, FSWTBC-4828), `numSolCompra` preenchido, ausência de desvio para Correção (FSWTBC-4459) e nenhum registro de falha no Histórico.
- **Por que falhou:** faixa do ERP antes de criar a SC.
- **Como solucionar:** Ambiente — C2 itens 1 e 2. Não tem `@bug`: **quando o formulário montar e 233 continuar caindo em Correção (12–19 min), este teste reprova pela assertion e o gate marca `REGRESSÃO`** — é o desfecho correto, porque é a medição viva do defeito de integração (mesmo sintoma que `docs/massa` §4 descreve). Não adicionar `@bug` preventivamente: ele mede SLA de uma etapa que já falhou antes (SC 103685, seis ciclos 233↔236, no docstring de FSWTBC-4952) e o objetivo do caso 4459 é ser smoke pós-deploy.
- **Quando fica verde e o que passa a provar:** 233 concluindo em ≤ 2 min com número de SC no ERP; é o critério de aceite do item 2 de C2.
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia ciclo da SC). O destrave do formulário/fila bastou.

##### FSWTBC-621 / 2022 / 4639 @bug — a SC que concluiu "Grava SC e Anexos" volta com o número da SC no ERP
- **Local:** `tests/e2e/compras/ciclo-solicitacao-compras.spec.js:581` · **Classe no gate:** conhecido-bug · **Duração:** 22,3 s
- **O que o teste verifica:** após 233 concluir (`COMPLETED`), `numSolCompra` não pode estar vazio — oráculo escolhido porque `erroIntegracao` fica vazio mesmo quando a integração falha (medido em três SCs).
- **Por que falhou:** faixa do ERP; **a assertion do defeito não foi avaliada** — o `@bug` caiu em pré-condição, e o gate o classifica `conhecido` pela tag antes de olhar a anotação (`veredito-do-gate.mjs:101`).
- **Como solucionar:** Ambiente — C2 itens 1 e 2. Suíte — nada; não ajustar a assertion.
- **Quando fica verde e o que passa a provar:** só quando o produto gravar o número; **após o destrave de C2 deve voltar a REPROVAR pelo defeito** (com 233 caindo em Correção, o loop de 200 s expira e `numSolCompra` vem `""`) até a integração ser corrigida.
- **Re-medição (10/09, 11h40–12h20):** **Chegou à assertion do defeito, e isso é informação nova:** a SC 96394 **concluiu** *Grava SC e Anexos* (atividade 233), que `docs/massa-de-dados-no-ambiente-dev.md` §4 registrava como nunca concluída, e voltou **sem número de SC no ERP**, com `erroIntegracao` vazio. FSWTBC-621/2022/4639 reproduz neste ambiente, e o documento de massa precisa ser atualizado.

##### CT-CMP-02-S3 — rejeitar upload de planilha de rateio com formato inválido
- **Local:** `tests/e2e/compras/ciclo-solicitacao-compras.spec.js:648` · **Classe no gate:** pre-condicao · **Duração:** 16,2 s
- **O que o teste verifica:** com guarda estreita (só criação/movimentação de processo), sobe um `.xlsx` inválido pelo botão "Upload Planilha de Rateio" e afirma que a seção "Rateio por Centro de Custo" **não** nasce da planilha (`headingRateio` count 0); registra como anotação se nenhum aviso apareceu (lacuna de UX, não falha).
- **Por que falhou:** faixa do ERP em `expectAberto()`.
- **Como solucionar:** Ambiente — C2 item 1. Só precisa do formulário montado.
- **Quando fica verde e o que passa a provar:** que planilha inválida nunca é importada para o rateio.
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia ciclo da SC). O destrave do formulário/fila bastou.

##### CT-CMP-02-S4 @bug — bloquear o envio quando nenhum anexo é informado (cliente)
- **Local:** `tests/e2e/compras/ciclo-solicitacao-compras.spec.js:721` · **Classe no gate:** conhecido-bug · **Duração:** 15,0 s
- **O que o teste verifica:** formulário completo sem anexo + Enviar; espera (por condição observável) até um dos três desfechos e afirma que **nenhuma** tentativa de escrita saiu (`guarda.tentativas() === 0`) e que um diálogo de validação apareceu. Hoje o produto envia sem validar o anexo — vermelho intencional.
- **Por que falhou:** faixa do ERP; a assertion do defeito não foi avaliada.
- **Como solucionar:** Ambiente — C2 item 1. Suíte — nada.
- **Quando fica verde e o que passa a provar:** só quando o cliente validar o anexo obrigatório; **após C2 deve voltar a reprovar pelo defeito** (a guarda registra a tentativa de `/start`).
- **Re-medição (10/09, 11h40–12h20):** **reproduziu o defeito** (chegou à assertion) (fatia ciclo da SC): _Error: defeito: o envio sem anexo deveria ser recusado no cliente, sem gerar nenhuma requisição de escrita — em vez disso tentou: POST https://caixade213859.fluig.cloudtotvs.com.br/ecm/api/rest/ecm/wo_

##### CT-CMP-02-S4 @destrutivo @bug — o servidor não deve criar a SC quando falta o anexo obrigatório
- **Local:** `tests/e2e/compras/ciclo-solicitacao-compras.spec.js:799` · **Classe no gate:** conhecido-bug · **Duração:** 14,8 s
- **O que o teste verifica:** a mesma ação sem guarda: escuta as respostas de `workflowView/send|process-management` e afirma que nenhuma devolve 200 com `processInstanceId` — a regra precisa estar no servidor, onde o cliente é contornável. Escuta `requestfailed` para não confundir queda de rede com resposta ausente.
- **Por que falhou:** faixa do ERP; a assertion do defeito não foi avaliada.
- **Como solucionar:** Ambiente — C2 item 1. Suíte — nada.
- **Quando fica verde e o que passa a provar:** só quando o servidor recusar; **após C2 deve voltar a reprovar** (HTTP 200 com id real, SC criada sem anexo — e essa SC entra no livro-razão e é cancelada pelo teardown).
- **Re-medição (10/09, 11h40–12h20):** A requisição de criação morreu em `net::ERR_NETWORK_CHANGED`; o teste declarou `PRÉ-CONDIÇÃO AUSENTE (infraestrutura)` corretamente. Sem veredito.

##### CT-CMP-03-S1 — sinalizar indisponibilidade em vez de combo vazio quando a filial falha ao carregar
- **Local:** `tests/e2e/compras/ciclo-solicitacao-compras.spec.js:892` · **Classe no gate:** pre-condicao · **Duração:** 13,1 s
- **O que o teste verifica:** intercepta `datasetZoom/…getBranches` com 500 simulado, digita no searchbox "Nome" e afirma que a tela dá mensagem clara (dialog/alerta/aviso no combo), não combo vazio nem tela branca.
- **Por que falhou:** faixa do ERP em `expectAberto()` — o formulário precisa montar **antes** de o teste simular a queda de um combo. Ironia registrada: o ambiente produziu, na carga, exatamente o tipo de sinalização que o teste exige do combo — mas em outra camada e sem deixar o teste chegar ao seu ponto.
- **Como solucionar:** Ambiente — C2 item 1.
- **Quando fica verde e o que passa a provar:** que a falha do zoom de filiais é comunicada ao usuário.
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia ciclo da SC). O destrave do formulário/fila bastou.

##### CT-ACC-09-H — o anexo enviado gera os dois registros no GED sob a pasta da solicitação
- **Local:** `tests/e2e/compras/ciclo-solicitacao-compras.spec.js:1047` · **Classe no gate:** pre-condicao · **Duração:** 13,3 s
- **O que o teste verifica:** cria a SC com anexo, espera "Validação do Gestor" (até 180 s — a cadeia de pastas só existe depois de 233), e via dataset `document` confirma pasta "Processo N - data" + documento com o nome informado, listado na aba Anexos da solicitação.
- **Por que falhou:** faixa do ERP antes de criar a SC.
- **Como solucionar:** Ambiente — C2 itens 1 **e 2** (a pasta é criada por 233; o próprio docstring mede que SCs presas em "Grava SC e Anexos" não a têm). O teste já reclassifica "não chegou em 180 s" como pré-condição, então continuará vermelho-ambiente até 233 gravar.
- **Quando fica verde e o que passa a provar:** integridade do anexo no GED após a etapa de serviço.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE`, mas **mais adiante**: o formulário montou e o teste criou a SC #96396, que não chegou assumível à Validação do Gestor em 180 s. O bloqueio saiu do formulário e foi para o BPMN (atividade 233); destrava junto com ela.

##### FSWTBC-4632 — escolher a filial no zoom preenche código e CNPJ da filial
- **Local:** `tests/e2e/compras/ciclo-solicitacao-compras.spec.js:1253` · **Classe no gate:** pre-condicao · **Duração:** 11,5 s
- **O que o teste verifica:** `campoCodigoFilial` vazio antes; após escolher `FILIAL_PADRAO` no zoom "Nome", código e CNPJ preenchidos. Guarda prova que nada é enviado.
- **Por que falhou:** faixa do ERP em `expectAberto()`.
- **Como solucionar:** Ambiente — C2 item 1 (o zoom de filiais em si responde: `getBranches` = 71).
- **Quando fica verde e o que passa a provar:** que a SC não nasce sem filial (sintoma do chamado).
- **Re-medição (10/09, 11h40–12h20):** Na fatia caiu de novo na faixa do ERP; **isolado, passou** em 12 s. Confirma o mapa: vermelho desta família não é conclusivo numa execução só. <sub>[fatia ciclo da SC: PRE → repetição isolada: VERDE]</sub>

#### tests/e2e/compras/validacoes-solicitacao-compras.spec.js

##### CT-CMP-02-S1 — bloquear o envio e reportar o obrigatório pendente com formulário vazio
- **Local:** `tests/e2e/compras/validacoes-solicitacao-compras.spec.js:43` · **Classe no gate:** pre-condicao · **Duração:** 16,4 s
- **O que o teste verifica:** Enviar com tudo vazio → diálogo "Erro ao validar as informações do formulário para movimentação" citando "ao menos um produto"; após OK, a tela continua "Movimentar Solicitação"; `tentativas() === 0`.
- **Por que falhou:** faixa do ERP em `expectAberto()` — sem montagem, o Fluig não valida no cliente (é literalmente o que a mensagem da pré-condição diz).
- **Como solucionar:** Ambiente — C2 item 1.
- **Quando fica verde e o que passa a provar:** validação de obrigatórios antes de qualquer escrita.
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia SC (1)). O destrave do formulário/fila bastou.

##### CT-CMP-02-S2 — bloquear o envio quando o rateio soma menos de 100%
- **Local:** `tests/e2e/compras/validacoes-solicitacao-compras.spec.js:90` · **Classe no gate:** pre-condicao · **Duração:** 13,4 s
- **O que o teste verifica:** produto + centro de custo com 90% → Enviar → dois diálogos sequenciais ("não podem ser inferior a 100%" no host; "deve ser igual a 100%" no iframe), ambos citando "item 0001" e "(90%)"; nenhuma escrita.
- **Por que falhou:** faixa do ERP.
- **Como solucionar:** Ambiente — C2 item 1.
- **Quando fica verde e o que passa a provar:** a crítica de soma do rateio, nos dois diálogos.
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia SC (1)). O destrave do formulário/fila bastou.

##### FSWTBC-4952 — item com Vlr. Total Estimado abaixo de R$ 0,10 é recusado na tela
- **Local:** `tests/e2e/compras/validacoes-solicitacao-compras.spec.js:142` · **Classe no gate:** pre-condicao · **Duração:** 15,1 s
- **O que o teste verifica:** 1 × 0,01 → no blur, SweetAlert "Erro:" com a mensagem literal do mínimo de R$ 0,10 (origem: `C1_XVALOR` zerado no MATA110, "401 Tabela SC1"); nada enviado.
- **Por que falhou:** faixa do ERP.
- **Como solucionar:** Ambiente — C2 item 1.
- **Quando fica verde e o que passa a provar:** a regra do mínimo, com a mensagem que diz ao usuário o que ajustar. O chamado segue com reincidências reportadas; este é o regressivo.
- **Re-medição (10/09, 11h40–12h20):** **Mudou de causa: agora reprova de verdade, e sem `@bug`.** O formulário montou e a crítica apareceu, mas com outro mínimo: *"O Vlr. Total Estimado não pode ser inferior a **R$ 1,00**!"*. O teste espera **R$ 0,10**, que é o que o chamado especifica (`Casos de Testes - SDCASSI/Solicitacao de Compras.md`, CT-FSWTBC-4952) e o que foi medido em 08/09 no `caixade182374`. O formulário publicado no `caixade213859` traz outra versão da regra. **Não troque o valor no teste sem confirmação:** se a regra vigente for R$ 1,00, catálogo e teste mudam juntos, citando a decisão; se for R$ 0,10, o formulário deste ambiente diverge do chamado e o teste ganha `@bug`.

##### FSWTBC-4941 @bug — o item deve aceitar rateio em dois centros de custo somando 100%
- **Local:** `tests/e2e/compras/validacoes-solicitacao-compras.spec.js:215` · **Classe no gate:** conhecido-bug · **Duração:** 13,5 s
- **O que o teste verifica:** duas linhas de rateio (60/40); afirma que o formulário preserva os valores **e** não critica a soma — hoje critica (defeito de agregação), por isso `@bug`.
- **Por que falhou:** faixa do ERP; a assertion do defeito não foi avaliada.
- **Como solucionar:** Ambiente — C2 item 1. Suíte — nada.
- **Quando fica verde e o que passa a provar:** só quando o produto somar as linhas corretamente; **após C2 deve voltar a reprovar pelo defeito**.
- **Re-medição (10/09, 11h40–12h20):** **reproduziu o defeito** (chegou à assertion) (fatia SC (1)): _Error: com 60% + 40% = 100% o formulário não deveria criticar a soma do rateio — hoje critica, e com isso impede a distribuição entre centros de custo pela tela_

##### FSWTBC-1906 / 1954 — rateio "100,00" fecha os 100% sem crítica de soma
- **Local:** `tests/e2e/compras/validacoes-solicitacao-compras.spec.js:289` · **Classe no gate:** pre-condicao · **Duração:** 28,9 s
- **O que o teste verifica:** uma linha com "100,00" → Enviar → a crítica que aparecer (há outras obrigatórias pendentes) **não** pode ser sobre a soma do rateio; anota a crítica devolvida; nada enviado.
- **Por que falhou:** faixa do ERP.
- **Como solucionar:** Ambiente — C2 item 1.
- **Quando fica verde e o que passa a provar:** que zeros à direita não quebram a soma (o chamado literal).
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia SC (1)). O destrave do formulário/fila bastou.

##### FSWTBC-4819 — o zoom "Nome da Filial" lista várias filiais, não só a 1101
- **Local:** `tests/e2e/compras/validacoes-solicitacao-compras.spec.js:347` · **Classe no gate:** pre-condicao · **Duração:** 18,1 s
- **O que o teste verifica:** abre o zoom, espera passar do placeholder "Buscando…", extrai os códigos `FILIAL (\d{3,})` e afirma diversidade (> 1 filial distinta).
- **Por que falhou:** faixa do ERP — o zoom em si funcionaria (`getBranches` responde 71), mas o formulário não chega a montá-lo.
- **Como solucionar:** Ambiente — C2 item 1.
- **Quando fica verde e o que passa a provar:** que a seleção lista a CASSI inteira.
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia SC (1)). O destrave do formulário/fila bastou.

#### tests/e2e/portais/alcadas-orcamentaria.spec.js

Os cinco seguem o mesmo roteiro: `criarSolicitacaoCompraClassica` (formulário) → `aprovarValidacaoDoGestor` (pool) → `aguardarAtividadeAtual(['Validação Orçamentária'], 90 s)` → assertion própria. Todos morreram no primeiro passo (faixa do ERP), durações 8,3–12,1 s. Destrave: C2 itens 1 e 2; candidatos à criação por API (a SC é só pré-condição). Além disso, dependem de a Validação Orçamentária (14) continuar sendo o teto da conta — o que `docs/massa` §3 põe em dúvida ao listar `G.P.Requisicao_de_Compras_Validacao_Orcamentaria` entre os grupos da conta (INFERIDO: se o pool de 14 passar a ser alcançável neste tenant, o `@achado` de `aprovacoes:553` acende e estes cinco precisam ser reavaliados, não só reexecutados).

##### CT-E2E-03-H — SC própria aprovada no Gestor para em Validação Orçamentária, sem ação para a conta
- **Local:** `tests/e2e/portais/alcadas-orcamentaria.spec.js:39` · **Classe no gate:** pre-condicao · **Duração:** 12,1 s
- **O que o teste verifica:** a SC chega a "Validação Orçamentária" e não há botão "Assumir tarefa" para `TOTVS-FS` (alçada nominal AL/DHL).
- **Por que falhou:** faixa do ERP ao criar a SC.
- **Como solucionar:** Ambiente — C2 itens 1 e 2.
- **Quando fica verde e o que passa a provar:** o ponto exato em que a alçada barra a conta, com massa própria.
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia SC (2)). O destrave do formulário/fila bastou.

##### CT-E2E-03-S1 — a Validação Orçamentária se anuncia como consenso de aprovadores nominais
- **Local:** `tests/e2e/portais/alcadas-orcamentaria.spec.js:60` · **Classe no gate:** pre-condicao · **Duração:** 9,2 s
- **O que o teste verifica:** textos "esta atividade requer um consenso de: 100%" e "Número de aprovações insuficiente…", e o painel "Tarefas em consenso" da Central vazio para a conta.
- **Por que falhou:** faixa do ERP ao criar a SC.
- **Como solucionar:** Ambiente — C2 itens 1 e 2.
- **Quando fica verde e o que passa a provar:** que a etapa é *atividade conjunta* por consenso (`processos-modelagem.md`, "Individual × Conjunta"), não pool — e que a conta não é aprovadora nominal.
- **Re-medição (10/09, 11h40–12h20):** Reprovou na fatia com 3 workers (TIMEOUT de 15 s esperando *5303 - CASSI SEDE* no select2 de Filial) e **passou isolado** (84 s). `selecionarOpcaoSelect2` (`pages/CicloCompradorPage.js:497-507`) dá 15 s fixos para a busca resolver, e a busca é um dataset do ERP que o tenant atende devagar sob carga. **Solução (suíte):** esperar a resposta do dataset da busca (`utils/dataset-fluig.js`, `aguardarDataset`) em vez do orçamento fixo. <sub>[fatia SC (2): VERMELHO → repetição isolada: VERDE]</sub>

##### FSWTBC-622 / 4821 — a grade orçamentária identifica o aprovador e o Total Estimado soma os itens (pt-BR)
- **Local:** `tests/e2e/portais/alcadas-orcamentaria.spec.js:108` · **Classe no gate:** pre-condicao · **Duração:** 8,8 s
- **O que o teste verifica:** em modo consulta, `tbItemOrcamentario` tem linha de aprovador e o total bate com a soma dos itens lida da própria tela (coerência interna, sem constante).
- **Por que falhou:** faixa do ERP ao criar a SC.
- **Como solucionar:** Ambiente — C2 itens 1 e 2.
- **Quando fica verde e o que passa a provar:** o gestor orçamentário vê o que aprova, com valor coerente.
- **Re-medição (10/09, 11h40–12h20):** Na fatia, mesmo sintoma do select2: a opção destacada era *1101 - CLINICASSI PORTO VELHO*, a primeira da lista, porque a busca ainda não tinha filtrado. Isolado, criou a SC 96400, mas o próprio BPMN a desviou para *Ajustar Informações*, e o teste declarou `PRÉ-CONDIÇÃO AUSENTE` corretamente (ramo intermitente já documentado, ~1 em 6 SCs). <sub>[fatia SC (2): VERMELHO → repetição isolada: PRE]</sub>

##### FSWTBC-3489 / 2737 — a etapa orçamentária expõe trilha de auditoria e campo de parecer
- **Local:** `tests/e2e/portais/alcadas-orcamentaria.spec.js:193` · **Classe no gate:** pre-condicao · **Duração:** 9,0 s
- **O que o teste verifica:** existência dos campos Data/Hora da Validação e Justificativa do gestor (não o preenchimento — SC recém-chegada tem data vazia, e isso é o correto).
- **Por que falhou:** faixa do ERP ao criar a SC.
- **Como solucionar:** Ambiente — C2 itens 1 e 2.
- **Quando fica verde e o que passa a provar:** regressão dos dois chamados corrigidos.
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia SC (2)). O destrave do formulário/fila bastou.

##### CT-E2E-04-H — o histórico da SC permanece rastreável até o bloqueio de alçada
- **Local:** `tests/e2e/portais/alcadas-orcamentaria.spec.js:237` · **Classe no gate:** pre-condicao · **Duração:** 8,3 s
- **O que o teste verifica:** no Histórico: "iniciou a solicitação N", "Compra Centralizada?", "Grava SC e Anexos", "assumiu a tarefa Validação do Gestor", "Usuário TBC (TOTVS) movimentou…", "Distribuição Gestor Orçamentario", "Atividade atual: Validação Orçamentária".
- **Por que falhou:** faixa do ERP ao criar a SC.
- **Como solucionar:** Ambiente — C2 itens 1 e 2.
- **Quando fica verde e o que passa a provar:** rastreabilidade completa do BPMN até o ponto de bloqueio.
- **Re-medição (10/09, 11h40–12h20):** **Três tentativas, três pontos de falha diferentes:** (1) select2 de Filial em 15 s; (2) `waitForFunction` de 30 s esperando *"iniciada com sucesso|Erro"* depois do Enviar (`CicloCompradorPage.js:305`); (3) *"Falha ao submeter a aprovação da Validação do Gestor após 1 tentativa(s) (resultado: nenhum)"*. Sem veredito sobre CT-E2E-04-H: é um fluxo destrutivo de ~100 s que atravessa três integrações instáveis. **Solução (suíte):** as esperas sem desfecho do helper de criação/aprovação deveriam declarar `faltaPreCondicao('(infraestrutura) …')` com a evidência, como `ciclo-solicitacao-compras.spec.js:799` já faz para `net::ERR_NETWORK_CHANGED`. Hoje saem como TIMEOUT, e o gate os lê como regressão. <sub>[fatia SC (2): VERMELHO → repetição isolada: VERMELHO → 2ª repetição isolada: VERMELHO]</sub>

#### tests/e2e/portais/atribuicao-comprador.spec.js

##### CT-E2E-05-H — SC própria aprovada no Gestor para em Validação Orçamentária, sem chegar à fila de Atribuir
- **Local:** `tests/e2e/portais/atribuicao-comprador.spec.js:97` · **Classe no gate:** pre-condicao · **Duração:** 7,8 s
- **O que o teste verifica:** mesmo roteiro das alçadas + confirma que a SC recém-criada **não** aparece na aba Atribuir da Gerência de Compras (nunca avançou até 257).
- **Por que falhou:** faixa do ERP ao criar a SC. O irmão `:50` (`@achado`, só leitura) passou às 11:12 — a aba Atribuir continua sem SC para a conta.
- **Como solucionar:** Ambiente — C2 itens 1 e 2.
- **Quando fica verde e o que passa a provar:** coerência entre o bloqueio de alçada e a fila de atribuição.
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia SC (2)). O destrave do formulário/fila bastou.

#### tests/e2e/portais/ciclo-comprador.spec.js (os três de C2; os outros quatro estão em C4 e C5-a)

##### CT-E2E-06-H (+ FSWTBC-3896/4357/3732) — SC própria aparece em Validação Inicial e a Etapa avança após o Gestor
- **Local:** `tests/e2e/portais/ciclo-comprador.spec.js:83` · **Classe no gate:** pre-condicao · **Duração:** 9,8 s
- **O que o teste verifica:** cria, aprova no Gestor, espera Orçamentária; na Validação Inicial do Portal do Comprador a linha da SC aparece com a Etapa já refletindo a aprovação; no detalhe, Justificativa integral, Preço/Vlr. Total iguais aos informados e nenhum campo editável.
- **Por que falhou:** faixa do ERP ao criar a SC.
- **Como solucionar:** Ambiente — C2 itens 1 e 2 **e** C4 (SY1): a Validação Inicial lista a fila do comprador designado, que hoje nunca é `TOTVS-FS`. Sem SY1 este teste troca de pré-condição, não de cor.
- **Quando fica verde e o que passa a provar:** o comprador vê a SC com os valores do solicitante e sem poder alterá-los.
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia Cotação/Comprador). O destrave do formulário/fila bastou.

##### CT-E2E-10-H — a SC própria não gera pedido no Protheus antes de vencer a alçada
- **Local:** `tests/e2e/portais/ciclo-comprador.spec.js:293` · **Classe no gate:** pre-condicao · **Duração:** 24,5 s
- **O que o teste verifica:** em Validação Orçamentária, o Histórico não menciona "Pedido de Compra".
- **Por que falhou:** faixa do ERP ao criar a SC.
- **Como solucionar:** Ambiente — C2 itens 1 e 2.
- **Quando fica verde e o que passa a provar:** que nada é integrado ao ERP antes da alçada.
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia Cotação/Comprador). O destrave do formulário/fila bastou.

##### CT-E2E-11-H — o Tracker localiza a SC própria pelo Nº do Processo e exibe o rastro
- **Local:** `tests/e2e/portais/ciclo-comprador.spec.js:312` · **Classe no gate:** pre-condicao · **Duração:** 17,5 s
- **O que o teste verifica:** cria a SC, filtra o Tracker por "Nº do Processo Fluig", uma linha, e o ícone `.flaticon-organogram` abre "Rastro do Processo N".
- **Por que falhou:** faixa do ERP ao criar a SC. O Tracker em si está de pé (cinco testes de `tracker-compras` passaram).
- **Como solucionar:** Ambiente — C2 item 1. **Não depende de 233**: basta a SC existir. É o candidato mais claro à criação por API — com `semear-massa` a pré-condição já é satisfazível hoje.
- **Quando fica verde e o que passa a provar:** busca e rastro do Tracker para uma SC própria.
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia Cotação/Comprador). O destrave do formulário/fila bastou.

#### tests/e2e/tarefas/acoes-da-tarefa.spec.js

##### CT-TSK-07-H — "Somente salvar" persiste o rascunho sem movimentar
- **Local:** `tests/e2e/tarefas/acoes-da-tarefa.spec.js:185` · **Classe no gate:** pre-condicao · **Duração:** 17,0 s
- **O que o teste verifica:** com a tarefa do Gestor assumida, preenche a justificativa, Somente salvar, reabre: valor persistido (não perde) e etapa/sequência iguais no servidor (não movimenta).
- **Por que falhou:** `criarEAssumirNoPoolGestorImediato` → faixa do ERP.
- **Como solucionar:** Ambiente — C2 itens 1 e 2.
- **Quando fica verde e o que passa a provar:** as duas metades do caso (salva e não move).
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE`, mas **mais adiante**: o formulário montou e o teste criou a SC #96387, que não chegou assumível à Validação do Gestor em 180 s. O bloqueio saiu do formulário e foi para o BPMN (atividade 233); destrava junto com ela.

##### CT-TSK-08-H — transferir troca o responsável mantendo a mesma atividade
- **Local:** `tests/e2e/tarefas/acoes-da-tarefa.spec.js:298` · **Classe no gate:** pre-condicao · **Duração:** 22,2 s
- **O que o teste verifica:** pré-condições lidas no servidor (responsável = conta, `currentMovto > 1`), Transferir, e o par (atividade preservada, responsável trocado — `Pool:Group:…Gestor_Imediato`) relido por API.
- **Por que falhou:** faixa do ERP ao criar a SC.
- **Como solucionar:** Ambiente — C2 itens 1 e 2.
- **Quando fica verde e o que passa a provar:** transferência numa atividade de grupo devolve a tarefa ao pool na mesma etapa (o que `cassi-fluig-master` SKILL.md item 7 registra como a via de devolução).
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE`, mas **mais adiante**: o formulário montou e o teste criou a SC #96388, que não chegou assumível à Validação do Gestor em 180 s. O bloqueio saiu do formulário e foi para o BPMN (atividade 233); destrava junto com ela.

### C3 — formulário de Cotação sem ERP

#### tests/e2e/compras/abertura-cotacao.spec.js

##### CT-COT (smoke de render) — deve abrir completo, com Fornecedor, itens e totais
- **Local:** `tests/e2e/compras/abertura-cotacao.spec.js:27` · **Classe no gate:** pre-condicao · **Duração:** 7,0 s
- **O que o teste verifica:** título "Movimentar Solicitação", blocos Fornecedor (CNPJ/CPF, Razão Social, Nome Fantasia), Nº da Cotação, Validade, lista de produtos e Sub Total / Valor Total do Pedido em `0,00`; guarda prova que abrir não escreve.
- **Por que falhou:** `FormularioCotacaoPage.expectSemFalhaDeErp()` viu a faixa do ERP → `PRÉ-CONDIÇÃO AUSENTE (ambiente): … os oito campos de total nascem vazios`. Mecanismo em C3.
- **Como solucionar:** Ambiente — C2 item 1 (mesmo dataset). Suíte — opcional: correr a faixa contra o sinal positivo (totais `0,00`) para não gastar 30 s em tela sadia.
- **Quando fica verde e o que passa a provar:** o shell da Cotação monta com totais zerados vindos do ERP.
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia Cotação/Comprador). O destrave do formulário/fila bastou.

#### tests/e2e/compras/ciclo-cotacao.spec.js (os dois de C3; o terceiro está em C4)

##### CT-COT-01-H/S1, CT-COT-02-S1/S2/S3 (bloqueado) — fornecedor, vínculos, itens e totais são readonly; só o radio de parecer técnico é editável
- **Local:** `tests/e2e/compras/ciclo-cotacao.spec.js:88` · **Classe no gate:** pre-condicao · **Duração:** 6,6 s
- **O que o teste verifica:** documenta **por que** os cinco casos do catálogo não são provocáveis pelo shell avulso: todos os campos de negócio são readonly e vazios/`0,00`; só o radio "parecer técnico" é editável; nada é escrito.
- **Por que falhou:** `CotacaoPage.expectAberto()` → faixa do ERP → `… o estado dos campos de negócio não é observável`.
- **Como solucionar:** Ambiente — C2 item 1.
- **Quando fica verde e o que passa a provar:** o mapa de readonly do shell — que continua sendo a justificativa de os cinco casos exigirem cotação real (C4).
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia Cotação/Comprador). O destrave do formulário/fila bastou.

##### CT-COT (defeito) @bug — o shell aceita Enviar sem nenhuma validação de fornecedor/vínculos
- **Local:** `tests/e2e/compras/ciclo-cotacao.spec.js:127` · **Classe no gate:** conhecido-bug · **Duração:** 5,9 s
- **O que o teste verifica:** marca "parecer técnico = Não", arma bloqueio de toda escrita **imediatamente antes** do clique e afirma que o Fluig recusa com diálogo de erro e zero tentativas de escrita — hoje o shell tenta criar processo sem validar (vermelho intencional; a primeira investigação criou #112312 por engano).
- **Por que falhou:** faixa do ERP em `expectAberto()`; **a assertion do defeito não foi avaliada**.
- **Como solucionar:** Ambiente — C2 item 1. Suíte — nada.
- **Quando fica verde e o que passa a provar:** só quando o shell validar; **após C2 deve voltar a reprovar pelo defeito** (a guarda ampla registra o POST abortado).
- **Re-medição (10/09, 11h40–12h20):** **reproduziu o defeito** (chegou à assertion) (fatia Cotação/Comprador): _Error: defeito: o Fluig deveria recusar o envio da Cotação sem fornecedor/vínculos (como faz a Solicitação de Compras), mas o shell aceita e tenta criar um processo real sem nenhuma validação — só não_

### C4 — "Atuar como" / matrícula de comprador

#### tests/e2e/compras/ciclo-cotacao.spec.js

##### CT-COT — a fila real de "Controle De Cotações" está vazia (pré-condição declarada)
- **Local:** `tests/e2e/compras/ciclo-cotacao.spec.js:170` · **Classe no gate:** pre-condicao · **Duração:** 7,6 s
- **O que o teste verifica:** abre Controle De Cotações, afirma que **não há** `<select>` "Atuar como" (`toHaveCount(0)`), vê `No data found`, prova só leitura e termina com `faltaPreCondicao` incondicional — é um registro de fila vazia, não um teste que possa passar.
- **Por que falhou:** pelo desenho. A mensagem cita D-01 e instâncias 113002/112860/112839 de 01/09/2026 do tenant `caixade182374` — texto desatualizado (C4, "Não é o D-01").
- **Como solucionar:** Ambiente/cliente — SY1 (`Y1_USER` para `TOTVS-FS`) ou delegação de um comprador real; as 14 cotações ativas passam a aparecer. Suíte — (1) reescrever a mensagem apontando para `docs/excecoes-de-pre-condicao.md` 5 e `docs/massa` §5, sem ids nem datas do tenant antigo; (2) resolver a polaridade: `toHaveCount(0)` antes do `faltaPreCondicao` fará o teste reprovar como `REGRESSÃO` no dia em que a delegação existir — trocar por `expectSeletorAtuarComoDisponivel()` ou marcar `@achado`; (3) `comboAtuarComo` ancorado por rótulo.
- **Quando fica verde e o que passa a provar:** hoje **nunca** fica verde (termina em `faltaPreCondicao`). Se reescrito para exercitar a fila com delegação, prova CT-COT-01-H/S1 numa cotação real.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE` (fatia Cotação/Comprador): _Error: PRÉ-CONDIÇÃO AUSENTE: a fila de "Controle De Cotações" do Portal do Comprador não tem nenhuma Cotação para operar. Isto NÃO é defeito do produto sob teste isolado — é consequência de D-01 (toda_

#### tests/e2e/compras/negociacao-proposta.spec.js

##### CT-NEG — a fila real de "Avaliação de Propostas" está vazia (pré-condição declarada)
- **Local:** `tests/e2e/compras/negociacao-proposta.spec.js:133` · **Classe no gate:** pre-condicao · **Duração:** 6,6 s
- **O que o teste verifica:** o mesmo desenho do anterior para Avaliação de Propostas (`toHaveCount(0)` no select, tabela com `No data found`, só leitura, `faltaPreCondicao` incondicional).
- **Por que falhou:** pelo desenho; mensagem cita 113025/112994 e assignees de 01/09/2026 (tenant antigo) e atribui a D-01.
- **Como solucionar:** idêntico ao bloco anterior (SY1/delegação; reescrever mensagem; corrigir polaridade). O irmão `:61` (shell readonly) passou — a tela avulsa monta; o que falta é a fila.
- **Quando fica verde e o que passa a provar:** hoje nunca; reescrito, prova CT-NEG-01-H/S1/S2 numa proposta real.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE` (fatia Cotação/Comprador): _Error: PRÉ-CONDIÇÃO AUSENTE: a fila de "Avaliação de Propostas" do Portal do Comprador não tem nenhuma cotação, com ou sem proposta de fornecedor. Isto NÃO é defeito isolado do produto — é o mesmo blo_

#### tests/e2e/portais/ciclo-comprador.spec.js

##### CT-E2E-07-H — a delegação "Atuar como" troca de sessão e o Controle de Cotações expõe os filtros
- **Local:** `tests/e2e/portais/ciclo-comprador.spec.js:173` · **Classe no gate:** pre-condicao · **Duração:** 6,6 s
- **O que o teste verifica:** `expectSeletorAtuarComoDisponivel()` → escolhe um substituto → reabre a etapa → botão Filtrar expõe Nº do Processo Fluig, Nº da Cotação ERP, Filial, Data Solicitação, Data Validade; registra o estado vazio da grade (não o afirma como esperado).
- **Por que falhou:** `comboAtuarComo.count() === 0` → `PRÉ-CONDIÇÃO AUSENTE (ambiente): o seletor "Atuar como" não é renderizado …` (mecanismo em C4).
- **Como solucionar:** Ambiente/cliente — SY1 ou delegação. Suíte — locator por rótulo.
- **Quando fica verde e o que passa a provar:** que a delegação troca a visão e o filtro do Controle de Cotações está completo.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE` (fatia Cotação/Comprador): _Error: PRÉ-CONDIÇÃO AUSENTE (ambiente): o seletor "Atuar como" não é renderizado no Portal do Comprador deste ambiente. A operação por delegação — e as filas que dependem dela (Controle de Cotações, A_

##### CT-E2E-08-H — Avaliação de Propostas traz exatamente as dez colunas
- **Local:** `tests/e2e/portais/ciclo-comprador.spec.js:210` · **Classe no gate:** pre-condicao · **Duração:** 10,4 s
- **O que o teste verifica:** após delegar, `lerColunas()` igual a [Status, Núm. Cotação, Filial, Número da SC, Nº. Proc. Fluig, Tip. Documento, Parecer Téc., Em Alçada, Dt. Validade, Valor Final]; ausência de dados só anotada.
- **Por que falhou:** `atuarComoSubstituto()` → seletor ausente.
- **Como solucionar:** como CT-E2E-07-H. Observação: as colunas em si são observáveis **sem** delegação (o teste `portal-comprador:248` lê a mesma grade e passou); a dependência de `atuarComoSubstituto()` aqui é herdada do desenho no tenant antigo — vale separar "colunas" (sem delegação) de "dados" (com delegação) para não perder a assertion de colunas por uma pré-condição que não a afeta.
- **Quando fica verde e o que passa a provar:** o contrato de colunas da grade.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE` (fatia Cotação/Comprador): _Error: PRÉ-CONDIÇÃO AUSENTE (ambiente): o seletor "Atuar como" não é renderizado no Portal do Comprador deste ambiente. A operação por delegação — e as filas que dependem dela (Controle de Cotações, A_

##### CT-E2E-09-H — Definir Vencedor Cotação traz a mesma grade de acompanhamento
- **Local:** `tests/e2e/portais/ciclo-comprador.spec.js:254` · **Classe no gate:** pre-condicao · **Duração:** 9,5 s
- **O que o teste verifica:** as mesmas dez colunas na etapa Definir Vencedor; ausência de cotação vencedora anotada.
- **Por que falhou:** seletor "Atuar como" ausente.
- **Como solucionar:** como CT-E2E-08-H (inclusive a separação colunas × dados).
- **Quando fica verde e o que passa a provar:** o contrato de colunas de Definir Vencedor.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE` (fatia Cotação/Comprador): _Error: PRÉ-CONDIÇÃO AUSENTE (ambiente): o seletor "Atuar como" não é renderizado no Portal do Comprador deste ambiente. A operação por delegação — e as filas que dependem dela (Controle de Cotações, A_

#### tests/e2e/portais/portal-comprador.spec.js

##### Portal do Comprador — deve exigir delegação em "Atuar como" para listar Controle de Cotações
- **Local:** `tests/e2e/portais/portal-comprador.spec.js:63` · **Classe no gate:** pre-condicao · **Duração:** 7,0 s
- **O que o teste verifica:** o seletor existe, tem mais de uma opção, e no default (própria conta) a fila é `No data found` — "opera por delegação".
- **Por que falhou:** `expectSeletorAtuarComoDisponivel()` → seletor ausente.
- **Como solucionar:** Ambiente/cliente — SY1 ou delegação. Suíte — locator por rótulo.
- **Quando fica verde e o que passa a provar:** o mecanismo de delegação do portal para esta conta. Os outros cinco testes do arquivo passaram (Acesso Rápido, filtros FSWTBC-3715/3884) — o portal está de pé; falta o cadastro.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE` (fatia Cotação/Comprador): _Error: PRÉ-CONDIÇÃO AUSENTE (ambiente): o seletor "Atuar como" não é renderizado no Portal do Comprador deste ambiente. A operação por delegação — e as filas que dependem dela (Controle de Cotações, A_

### C5 — filas e massa vazias

#### tests/api/etapa-automatica-distribuicao.spec.js

##### FSWTBC-3617 — a Distribuição Gestor Orçamentário não deixa solicitação parada
- **Local:** `tests/api/etapa-automatica-distribuicao.spec.js:46` · **Classe no gate:** pre-condicao · **Duração:** 4,7 s
- **O que o teste verifica:** por API (`fetch` de dentro da página), varre até 400 solicitações, seleciona SCs, lê `/requests/{id}/tasks` e afirma que nenhuma passagem por "Distribuição Gestor Or…" (280) ficou aberta por mais de 30 min — a etapa automática não pode virar fila.
- **Por que falhou:** `nenhuma das 1 solicitações inspecionadas passou por uma atividade começando em "Distribuição Gestor Or"`. Às 10:40 BRT a única SC visível à conta era a 96363 (semeada 10:18), presa em 233 — nunca chegou a 280. Sub-causa C5-a.
- **Como solucionar:** Ambiente — 233 (C2 item 2); com a SC passando por 7 → 9 → 280, a passagem existe. Automação — `semear-massa.mjs` gera a passagem assim que 233 gravar. Suíte — nada; a mensagem já diz quantas inspecionou.
- **Quando fica verde e o que passa a provar:** que a etapa automática 280 conclui sozinha (sem SC parada > 30 min).
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE` (fatia API): _Error: PRÉ-CONDIÇÃO AUSENTE (ambiente): nenhuma das 8 solicitações inspecionadas passou por uma atividade começando em "Distribuição Gestor Or" — sem passagem não há o que verificar._

#### tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js

##### CT-CMP-06-H — assumir e movimentar uma tarefa do pool de Validação dos Compradores quando disponível
- **Local:** `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js:594` · **Classe no gate:** pre-condicao · **Duração:** 4,8 s
- **O que o teste verifica:** Central → Tarefas em pool → grupo `GRUPO_COMPRADOR` → assume a primeira tarefa e movimenta (decisão padrão quando aplicável). Não cria massa: é leitura do pool + ação real quando há tarefa.
- **Por que falhou:** `listarGrupos()` devolveu `[]` às 10:47 BRT → anotação `alcancabilidade-validacao-compradores: NÃO ALCANÇÁVEL agora` + `PRÉ-CONDIÇÃO AUSENTE: nenhuma tarefa no pool de Validação dos Compradores … grupos disponíveis: [nenhum]`. O pool encheu depois (11:25, `assumir-tarefa-pool` passou), mas com Correção (236), não com 119 — C5-a.
- **Como solucionar:** Ambiente — 233; **e** a SC precisa atravessar 14 (Validação Orçamentária), que hoje é consenso de aprovadores nominais (alçadas). Ou seja, mesmo com 233 gravando, chegar a 119 exige um aprovador orçamentário humano (AL/DHL) — ou que o pool de 14 seja alcançável pela conta, como `docs/massa` §3 sugere e `aprovacoes:553` (`@achado`) nega. Registrar isso como dependência dupla. Automação — nada além do semeador. Suíte — nada.
- **Quando fica verde e o que passa a provar:** que a conta assume e movimenta uma tarefa real de Validação do Comprador por pool, sem Portal e sem SY1.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE` (fatia SC (1)): _Error: PRÉ-CONDIÇÃO AUSENTE: nenhuma tarefa no pool de Validação dos Compradores no momento da execução — grupos disponíveis: [nenhum]. Destrava quem puder deixar uma SC parada nessa etapa antes da ex_

#### tests/e2e/contratos/fila-faturamento-protheus.spec.js

##### FSWTBC-4816 @bug — nenhuma instância pode ficar presa em "Aguarda processamento Fila Protheus"
- **Local:** `tests/e2e/contratos/fila-faturamento-protheus.spec.js:49` · **Classe no gate:** conhecido-bug · **Duração:** 23,5 s
- **O que o teste verifica:** lista `wf_faturamento_contratos` com `expand=currentMovements` em até 10 páginas de 200 e afirma que nenhuma instância aberta está na sequência da fila Protheus há mais que o limite — a família SDCASSI-300/450/462/536 consta fechada, mas a fila travava (por isso `@bug`).
- **Por que falhou:** `PRÉ-CONDIÇÃO AUSENTE (ambiente): nenhuma instância aberta de Faturamento de Contratos para inspecionar`. **A assertion do `@bug` não foi avaliada** — zero FC aberta neste tenant (C5-b). O gate o mantém `conhecido` pela tag.
- **Como solucionar:** Ambiente — contratos com medição automática + disparo do Protheus (C5-b). Automação — nenhuma (exige fiscal ou schedule). Suíte — nada; não ajustar.
- **Quando fica verde e o que passa a provar:** só quando houver FCs e nenhuma presa; **quando houver FC, deve reprovar pelo defeito se a fila voltar a travar** — até lá, é vermelho-ambiente que não mede o bug.
- **Re-medição (10/09, 11h40–12h20):** 1ª tentativa: `TypeError: Failed to fetch` no `page.evaluate` (onda de rede). 2ª: `PRÉ-CONDIÇÃO AUSENTE`, porque não há instância aberta de Faturamento para inspecionar. O defeito segue sem veredito. <sub>[fatia RH/Faturamento/Tarefas: REDE → repetição isolada: PRE]</sub>

#### tests/e2e/contratos/validacoes-faturamento.spec.js

##### CT-FAT-02-S3 — reprovar uma validação (CSE / Medição CSE / Fiscal) não é alcançável: a conta não pertence a esses grupos
- **Local:** `tests/e2e/contratos/validacoes-faturamento.spec.js:279` · **Classe no gate:** pre-condicao · **Duração:** 4,4 s
- **O que o teste verifica:** lê os grupos de "Tarefas em pool" e afirma que nenhum casa Fiscal/CSE/Medição — distinguindo "não consegui ler o pool" (pré-condição) de "li e não há grupo" (assertion).
- **Por que falhou:** o link "Tarefas em pool" não existe quando o usuário não tem tarefa em pool; às 10:55 BRT não tinha (`Entradas oferecidas agora: … Tarefas a concluir 1 | Solicitações 3 …`). C5-b/C5-a.
- **Como solucionar:** Ambiente — qualquer tarefa em pool para a conta (233 resolvido basta; as semeadas em Correção também servem — às 11:25 já havia). Suíte — (1) a mensagem diz "o menu Mais opções não ofereceu…" e "Mais opções" não existe neste tenant (mapa); (2) o parágrafo de investigação (01/09, SC 112679, "`targetState` diferente de 6 … nunca confirmado como reprodutível") está superado por `docs/massa` (8 SCs com `targetState: 0`); (3) melhoria já anotada em `docs/excecoes` 7: medir a existência do grupo por outro caminho (`/api/public/2.0/users/getCurrent` devolve os 33 grupos da conta — `docs/massa` §3 — sem depender de haver tarefa no pool). Não enfraquece: a assertion continua sendo "nenhum grupo de Fiscal/CSE".
- **Quando fica verde e o que passa a provar:** que a conta não pertence aos grupos de validação do Faturamento — hoje só é observável quando o pool tem algo.
- **Re-medição (10/09, 11h40–12h20):** **Mudou de causa: virou defeito da SUÍTE.** Às 10:38 a conta não tinha tarefa em pool e o teste declarou pré-condição. À tarde o link de pool existia (a massa semeada caiu em *236 Correção*, pool da conta) e o teste avançou até esperar a legenda *"Tarefas para grupos e papéis que você está associado."* em `[id^="more-options-pool_"]`. O elemento existe, mas **oculto** (92 resoluções, todas `hidden`): é o dropdown "Mais opções" da Central de Tarefas antiga, que o mapa registra como inexistente neste tenant. **Solução (suíte):** reescrever essa navegação (`validacoes-faturamento.spec.js:340-360`) para as abas da Central atual, como os Page Objects já fazem desde `27ae435`.

#### tests/e2e/juridico/sigajuri-contencioso.spec.js

##### CT-JUR-04-H / CT-JUR-06-H — criar e rotear pela UF e Responsável escolhidos, parando no pool certo
- **Local:** `tests/e2e/juridico/sigajuri-contencioso.spec.js:113` · **Classe no gate:** pre-condicao · **Duração:** 6,7 s
- **O que o teste verifica:** preenche `UF=MA`, `Responsável=CASSI Sede`, `Tipo=Orientação processual`, envia, exige 200 com `processInstanceId`, e (CT-JUR-06-H) confere no servidor a coerência `grupo` do formulário × pool da tarefa — o oráculo que pega BPM que ignora a escolha.
- **Por que falhou:** `SigajuriPage.selecionarComPreCondicao(comboUF, 'MA')` → `o caso precisa de "MA" no combo "UF", mas o ambiente hoje só oferece: (nenhuma opção)`. C5-e.
- **Como solucionar:** Ambiente — registrar o serviço SIGAJURI / alimentar o cadastro de UF (mapa linha 353; `docs/excecoes` 9–10). Suíte — nada; **não trocar "MA"** por outro valor (a mensagem já proíbe).
- **Quando fica verde e o que passa a provar:** criação real do Contencioso e roteamento ao pool `GRUPO_GEJUR_*` coerente com o Responsável.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE` (fatia RH/Faturamento/Tarefas): _Error: PRÉ-CONDIÇÃO AUSENTE: o caso precisa de "MA" no combo "UF", mas o ambiente hoje só oferece: (nenhuma opção). Não é para ser contornado trocando o valor pedido no teste — é sinal de que o cadast_

#### tests/e2e/portais/ciclo-comprador.spec.js

##### CT-E2E-06-H (leitura) — listar SCs reais em Validação Inicial, com dados do item ao expandir, sem delegação
- **Local:** `tests/e2e/portais/ciclo-comprador.spec.js:40` · **Classe no gate:** pre-condicao · **Duração:** 54,2 s
- **O que o teste verifica:** Validação Inicial sem seletor "Atuar como", tabela visível, ao menos uma linha **real** (`esperarLinhasReais`), expande e vê Produto/Serviço, Quantidade, Vlr. Total Estimado.
- **Por que falhou:** `esperarLinhasReais` esperou ~40 s e só viu `No data found` → `PRÉ-CONDIÇÃO AUSENTE (ambiente): a Validação Inicial não trouxe nenhuma solicitação para esta conta`. Três minutos depois, `portal-comprador.spec.js:41` "passou" na mesma grade contando a linha do estado vazio — verde falso (leitura transversal, item 3).
- **Como solucionar:** Ambiente — SY1 (C4) **e** SC passando de 233 e do Gestor (a fila é do comprador designado). Suíte — `portal-comprador.spec.js:41` deve usar `esperarLinhasReais`; enquanto não usar, o relatório terá um verde e um vermelho dizendo coisas opostas sobre a mesma tela.
- **Quando fica verde e o que passa a provar:** que a Validação Inicial lista SCs reais para a conta e expõe os dados do item.
- **Re-medição (10/09, 11h40–12h20):** Reprovou na fatia (heading *Acesso Rápido* não apareceu em 45 s, com destrutivos em paralelo) e **passou isolado** em 13 s. É a degradação do tenant sob carga, a mesma que levou a concorrência para 3. <sub>[fatia Cotação/Comprador: VERMELHO → repetição isolada: VERDE]</sub>

#### tests/e2e/portais/tracker-compras.spec.js

##### FSWTBC-2158 / 4804 — o disparo automático não abre Faturamento duplicado no período
- **Local:** `tests/e2e/portais/tracker-compras.spec.js:220` · **Classe no gate:** pre-condicao · **Duração:** 7,6 s
- **O que o teste verifica:** Tracker, visão Faturamento de Contratos, mês corrente e anterior, paginando; só FCs do "Usuário Integrador" não canceladas; chave (Nº Contrato, Competência, Filial da Medição, Nº Planilha) sem repetição.
- **Por que falhou:** anotação `faturamento-no-periodo: 2026-08-01..2026-08-31: 1 FC no período, 0 abertas pelo Usuário Integrador` → `PRÉ-CONDIÇÃO AUSENTE (ambiente): nenhuma FC aberta pelo Usuário Integrador nos meses …`. C5-b.
- **Como solucionar:** Ambiente — contratos com `CN1_MEDAUT` e o schedule do disparo rodando neste tenant. Automação — nenhuma (disparo é do Protheus). Suíte — nada.
- **Quando fica verde e o que passa a provar:** ausência de duplicata no disparo mensal (não a completude — declarado no docstring).
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE` (fatia RH/Faturamento/Tarefas): _Error: PRÉ-CONDIÇÃO AUSENTE (ambiente): nenhuma FC aberta pelo Usuário Integrador nos meses 2026-09-01..2026-09-10 e 2026-08-01..2026-08-31 — sem massa do disparo automático não há duplicata a procura_

##### FSWTBC-1934 — as medições do disparo automático nascem na etapa do fiscal, com responsável e número
- **Local:** `tests/e2e/portais/tracker-compras.spec.js:340` · **Classe no gate:** pre-condicao · **Duração:** 9,2 s
- **O que o teste verifica:** as FCs do Integrador nascem em "Realizar Medição do Contrato", com responsável, Nº Medição e Fiscal preenchidos (caracterização, medida em 09/09 com 151 FCs do disparo de 03/09 — no tenant antigo).
- **Por que falhou:** mesma varredura, zero FC do Integrador → pré-condição. C5-b.
- **Como solucionar:** como o anterior.
- **Quando fica verde e o que passa a provar:** que o disparo abre medições utilizáveis, não resíduo.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE` (fatia RH/Faturamento/Tarefas): _Error: PRÉ-CONDIÇÃO AUSENTE (ambiente): nenhuma FC aberta pelo Usuário Integrador no mês corrente nem no anterior — sem massa do disparo automático não há o que caracterizar._

#### tests/e2e/rh/admissao.spec.js

##### CT-ADM-01-H @bug — deveria abrir um formulário de admissão de novo funcionário
- **Local:** `tests/e2e/rh/admissao.spec.js:37` · **Classe no gate:** conhecido-bug · **Duração:** 11,6 s
- **O que o teste verifica:** o processo `wf_automacao_admissao` abre; o título do formulário interno, lido **depois** de montado (`lerTituloDoFormularioInterno`, que espera heading + campos para escapar das janelas `about:blank`), não pode ser "Gestão de Benefícios - Plano de Saúde".
- **Por que falhou:** **pela assertion do defeito** — `expect(received).not.toBe(expected) … Expected: not "Gestão de Benefícios - Plano de Saúde"`. O formulário **montou** (único dos seis de RH nesta execução), e continua sendo o template de Plano de Saúde. Passo registrado: `defeito: o processo de Admissão … abre o formulário de Plano de Saúde …`.
- **Sobre a anotação `pre-condicao-ausente` presente ao mesmo tempo:** é a anotação **estática** das linhas 46–53, que descreve os subcasos CT-ADM-01-S1/S2 como inalcançáveis por consequência deste defeito — empurrada no início, antes de qualquer verificação. Intencional (docstring de `utils/pre-condicao.js`). Como o gate lê: `@bug` no título tem precedência (`veredito-do-gate.mjs:101`) → classe `conhecido`; a anotação não é consultada. Se alguém ler só a anotação, verá "pré-condição"; se ler o erro, verá o defeito — os dois estão certos, sobre coisas diferentes (S1/S2 × 01-H).
- **Como solucionar:** Produto — corrigir a associação processo↔formulário de `wf_automacao_admissao`. Suíte — dar à anotação estática um tipo próprio (C5-c) para que ferramentas não a confundam com o motivo da falha.
- **Quando fica verde e o que passa a provar:** só quando o processo servir um formulário de admissão; aí `criarAdmitido()` (`factories/pessoa.js`) já tem a massa pronta e S1/S2 destravam.
- **Re-medição (10/09, 11h40–12h20):** **reproduziu o defeito** (chegou à assertion) (fatia RH/Faturamento/Tarefas): _Error: defeito: o processo de Admissão (wf_automacao_admissao) abre o formulário de Plano de Saúde (mesmo template de rh_gbeneficios_planosaude) em vez de um formulário de admissão — associação proces_

#### tests/e2e/rh/dependentes.spec.js

##### CT-DEP-02-S1 — bloqueia a gestão de dependentes quando o titular não tem matrícula localizada
- **Local:** `tests/e2e/rh/dependentes.spec.js:34` · **Classe no gate:** pre-condicao · **Duração:** 3,8 s
- **O que o teste verifica:** o processo abre; a identificação do titular **bloqueia** ("não foi possível determinar a matrícula do titular") e nenhum campo de cadastro é montado (`camposVisiveis === 0`).
- **Por que falhou:** `desfecho-da-identificacao: bloqueado=false · 0 campo(s) visível(is) de 0 no DOM` → `PRÉ-CONDIÇÃO AUSENTE (ambiente): o formulário … montou 0 campo(s) sem exibir o bloqueio`. Nem bloqueio, nem os 39 campos de 09/09: iframe vazio. Mesma família de C2 (INFERIDO — dataset de matrícula do titular, C5-c).
- **Como solucionar:** Ambiente — C2 item 1. Depois dele, o caso continua em pré-condição por outro motivo: a conta **resolve** a matrícula neste tenant (09/09), então "titular sem matrícula" não é reproduzível com ela — e CT-DEP-01-H/S1/S2/S3 podem ter ficado exercitáveis (o docstring já pede reavaliação). Suíte — tipo da anotação estática (C5-c).
- **Quando fica verde e o que passa a provar:** só com uma conta sem matrícula; com esta conta, o valor está em reavaliar os quatro subcasos.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE` (fatia RH/Faturamento/Tarefas): _Error: PRÉ-CONDIÇÃO AUSENTE (ambiente): o formulário de Gestão de Dependentes montou 0 campo(s) sem exibir o bloqueio por titular sem matrícula. O cenário deste caso — titular SEM matrícula localizada_

#### tests/e2e/rh/gestao-equipes.spec.js

Os três testes chamam `abrirGestaoDeEquipes()`, que espera até 45 s por um SweetAlert2 que não seja "Carregando…". Nesta execução nenhum apareceu (~50 s cada) e os três declararam pré-condição **antes** das assertions do FSWTBC-630 — os três `@bug` ficaram sem medir o defeito. Causa: o widget consulta a matrícula do usuário no ERP e, com o dataset em 500, fica no "Carregando" (INFERIDO, C5-c). Quando C2 item 1 estiver resolvido, o desfecho esperado volta a ser "Sucesso: Usuário não encontrado no ERP Protheus." (a conta não tem matrícula) e os três **reprovam pelo defeito** até FSWTBC-630 ser corrigido.

##### FSWTBC-630 @bug — uma falha não pode ser anunciada sob o cabeçalho "Sucesso:"
- **Local:** `tests/e2e/rh/gestao-equipes.spec.js:70` · **Classe no gate:** conhecido-bug · **Duração:** 50,3 s
- **O que o teste verifica:** se a mensagem do diálogo tem sinal de erro ("não encontrado", "erro", "falha"…), o título não pode casar `/sucesso/i`.
- **Por que falhou:** `PRÉ-CONDIÇÃO AUSENTE: o widget não exibiu diálogo de desfecho em 45s (só o de carregamento, ou nenhum)` — assertion não avaliada.
- **Como solucionar:** Ambiente — C2 item 1. Produto — FSWTBC-630. Suíte — o `return` silencioso quando a mensagem não é de erro (linhas 91–94) vira verde sem medir se a conta ganhar matrícula; trocar por anotação explícita.
- **Quando fica verde e o que passa a provar:** só com o rótulo corrigido; **após C2 deve voltar a reprovar pelo defeito**.
- **Re-medição (10/09, 11h40–12h20):** **reproduziu o defeito** (chegou à assertion) (fatia RH/Faturamento/Tarefas): _Error: o diálogo comunica uma FALHA ("Sucesso: Usuário não encontrado no ERP Protheus. OK") sob um cabeçalho de sucesso. Quem lê o título acredita que a operação deu certo — é o oposto do que acontece_

##### FSWTBC-630 @bug — o diálogo de erro deve usar um ícone que a biblioteca reconhece
- **Local:** `tests/e2e/rh/gestao-equipes.spec.js:103` · **Classe no gate:** conhecido-bug · **Duração:** 49,8 s
- **O que o teste verifica:** nenhum erro de console `SweetAlert2: Unknown icon!` (o código passa `danger`).
- **Por que falhou:** mesma pré-condição (sem diálogo de desfecho).
- **Como solucionar:** como o anterior.
- **Quando fica verde e o que passa a provar:** ícone válido; **após C2 deve voltar a reprovar**.
- **Re-medição (10/09, 11h40–12h20):** **reproduziu o defeito** (chegou à assertion) (fatia RH/Faturamento/Tarefas): _Error: o widget pediu um ícone que o SweetAlert2 não conhece, então nenhum ícone é renderizado. Aceitos: success, error, warning, info, question_

##### FSWTBC-630 @bug — após fechar o aviso, a tela deve oferecer algum caminho
- **Local:** `tests/e2e/rh/gestao-equipes.spec.js:120` · **Classe no gate:** conhecido-bug · **Duração:** 49,8 s
- **O que o teste verifica:** depois do OK, `{tabelas, ações}` não pode ser `{0, 0}`.
- **Por que falhou:** mesma pré-condição.
- **Como solucionar:** como os anteriores.
- **Quando fica verde e o que passa a provar:** a tela não fica em branco; **após C2 deve voltar a reprovar**.
- **Re-medição (10/09, 11h40–12h20):** **reproduziu o defeito** (chegou à assertion) (fatia RH/Faturamento/Tarefas): _Error: depois do OK a área do widget ficou sem conteúdo e sem ação: a tela deveria oferecer ao menos uma mensagem explicando o que fazer, ou um caminho de volta_

#### tests/e2e/rh/substituicao-cargos.spec.js

##### CT-SUB @achado — bloqueia a identificação do solicitante antes de expor campos de substituto
- **Local:** `tests/e2e/rh/substituicao-cargos.spec.js:33` · **Classe no gate:** conhecido-achado · **Duração:** 5,2 s
- **O que o teste verifica (polaridade invertida):** afirma o comportamento **real**: os 16 campos de substituto existem no DOM e **nenhum** é acionável (`acionaveis === []`), porque a identificação do solicitante bloqueia antes. Vermelho aqui significa "reabra o assunto", não regressão.
- **Por que falhou:** `campos-de-substituto: motivo do bloqueio: nenhum · 0 campo(s) de substituto no DOM, 0 acionável(is)` → `PRÉ-CONDIÇÃO AUSENTE (ambiente): … não renderizou campo algum de substituto no DOM`. **O achado não mudou — não foi observado.** Iframe sem faixa, sem "Funcionário não localizado" e sem campo: carga em branco (C5-c; o próprio docstring, linhas 61–66, registra que neste tenant a tela alterna entre a faixa do ERP e uma carga sem aviso).
- **Sobre a anotação `pre-condicao-ausente` DUPLICADA:** duas anotações do mesmo tipo — a estática (linhas 42–49, sobre CT-SUB-01-H/S1/S2) e a de runtime do `faltaPreCondicao` (linha 80). Não é defeito de veredito: `@achado` tem precedência no gate e a classe é `conhecido` de qualquer forma. É defeito de **legibilidade** da suíte: um leitor que pegue a primeira anotação lê o texto sobre subcasos e não o motivo real. Correção: tipo próprio para a anotação estática (nos três specs de RH). Ver C5-c.
- **Como solucionar:** Ambiente — C2 item 1. Suíte — o tipo da anotação. **Não** "consertar" o achado.
- **Quando fica verde e o que passa a provar:** com o formulário montando, o teste volta a observar os 16 campos; verde = continuam inacionáveis (achado mantido); vermelho pela assertion = a identificação passou a resolver e CT-SUB-01-H/S1/S2 precisam ser reavaliados.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE` (fatia RH/Faturamento/Tarefas): _Error: PRÉ-CONDIÇÃO AUSENTE (ambiente): o formulário de Substituição de Cargos não renderizou campo algum de substituto no DOM. Sem eles não dá para afirmar se estão ou não acionáveis, que é o que est_

#### tests/e2e/tarefas/cancelamento-solicitacao.spec.js

##### CT-TSK-05-H (FSWTBC-4581) — cancelar pela Central de Tarefas leva a solicitação a CANCELED no servidor
- **Local:** `tests/e2e/tarefas/cancelamento-solicitacao.spec.js:132` · **Classe no gate:** pre-condicao · **Duração:** 42,9 s
- **O que o teste verifica:** cria massa própria (questionário `prc_questionario_v2`), confirma `OPEN/active` no servidor, abre "Minhas solicitações" ordenada por Solicitação decrescente, exige o cartão e o botão "Cancelar", cancela com motivo, afirma o contrato da resposta (`successCount`) e relê `status: CANCELED`.
- **Por que falhou:** massa criada (`solicitacao-criada: processInstanceId=96374` — o teardown a recolhe) e estado inicial conferido; ao abrir "Minhas solicitações", a resposta de `/ecm/api/rest/ecm/centralTasks/getTasks/requests/` não veio em 20 s → `PRÉ-CONDIÇÃO AUSENTE (ambiente): abrir "Minhas solicitações" não disparou … nesta versão da Central`. C5-d. O irmão `:247` (mesmo endpoint de cancelamento, por API) **passou** — o cancelamento funciona; é a navegação da Central que mudou.
- **Como solucionar:** **Suíte** (dono principal) — medir a chamada que a nova Central faz e trocar a escuta em `CentralTarefasPage`/`MinhasSolicitacoesPage`; ou localizar o cartão só pelo DOM (`task-card-component[data-process-key^="96374."]`), que o Page Object já sabe fazer. A assertion final (servidor) não muda. Ambiente — nada.
- **Quando fica verde e o que passa a provar:** que o botão "Cancelar" continua na Central e leva a `CANCELED` no servidor — o risco do chamado 4581.
- **Re-medição (10/09, 11h40–12h20):** **passou** (fatia RH/Faturamento/Tarefas). O destrave do formulário/fila bastou.

#### tests/e2e/tarefas/minhas-solicitacoes.spec.js

##### CT-TSK-03-H — sinalizar visualmente a solicitação atrasada
- **Local:** `tests/e2e/tarefas/minhas-solicitacoes.spec.js:14` · **Classe no gate:** pre-condicao · **Duração:** 8,6 s
- **O que o teste verifica:** ao menos um cartão com a marca de atraso e o texto "Atrasada há".
- **Por que falhou:** `"Minhas solicitações" tem 6 cartão(ões), mas nenhum marcado como atrasado`. C5-d: as solicitações abertas da conta são recentes; nenhuma tarefa com prazo vencido. O irmão `:44` (filtro de status) passou — a lista funciona.
- **Como solucionar:** Ambiente/operação — manter uma solicitação com prazo vencido para `TOTVS-FS` na homologação. Automação (INFERIDO, a decidir): criar solicitação em processo com prazo curto e esperar vencer — custa tempo de execução. Suíte — nada; o docstring já explica por que não é assertion condicional.
- **Quando fica verde e o que passa a provar:** a sinalização visual de atraso na Central.
- **Re-medição (10/09, 11h40–12h20):** continua `PRÉ-CONDIÇÃO AUSENTE` (fatia RH/Faturamento/Tarefas): _Error: PRÉ-CONDIÇÃO AUSENTE (ambiente): "Minhas solicitações" tem 15 cartão(ões), mas nenhum marcado como atrasado — sem solicitação em atraso não há sinalização a conferir._

---

## Ajustes na suíte consolidados (nenhum contorna defeito nem enfraquece assertion)

| # | Onde | O quê | Efeito |
|---|---|---|---|
| 1 | `pages/FormularioSolicitacaoCompraPage.js` ramo `erp-fora` | anexar `errosDeDatasetNaCarga` à mensagem | os 30 vermelhos de C2 passam a nomear `ds_protheus_getMatriculaTitular_rest → HTTP 500` |
| 2 | `pages/PortalCompradorPage.js:35` | `comboAtuarComo` por rótulo "Atuar como:", não `locator('select')` | evita falso "disponível" e operar o select errado |
| 3 | `ciclo-cotacao.spec.js:170`, `negociacao-proposta.spec.js:133` | remover ids/datas do tenant antigo e a atribuição a D-01; apontar para `docs/excecoes` 5–6 e `docs/massa` §5; resolver a polaridade do `toHaveCount(0)` (`@achado` ou `expectSeletorAtuarComoDisponivel`) | mensagem verdadeira; sem `REGRESSÃO` falsa no dia da delegação |
| 4 | `validacoes-faturamento.spec.js:279` | trocar "menu Mais opções" e o parágrafo sobre `targetState` "nunca reprodutível"; opcional: ler grupos por `users/getCurrent` | mensagem coerente com o tenant e com `docs/massa` |
| 5 | `rh/admissao.spec.js`, `rh/dependentes.spec.js`, `rh/substituicao-cargos.spec.js` | tipo próprio para a anotação estática de subcasos (não `pre-condicao-ausente`) | acaba a duplicidade; o gate já não depende disso |
| 6 | `rh/gestao-equipes.spec.js:91` | anotação explícita em vez de `return` silencioso quando a mensagem não é de erro | verde honesto se a conta ganhar matrícula |
| 7 | `pages/CentralTarefasPage.js` / `MinhasSolicitacoesPage.js` | escutar a chamada que a nova Central faz, ou localizar pelo DOM | destrava CT-TSK-05-H sem mudar a assertion de servidor |
| 8 | `portais/portal-comprador.spec.js:41` (verde falso, fora do escopo) | usar `esperarLinhasReais` em vez de `tbody tr > 0` | para de contradizer `ciclo-comprador:40` |
| 9 | `tarefas/assumir-tarefa-pool.spec.js` | anotar qual solicitação assumiu; opcional: pular cartões `QA-MASSA` de Correção | a massa semeada para o desenvolvedor não é consumida sem rastro |
| 10 | 15 `@destrutivo` em que a SC é só pré-condição (alçadas ×5, atribuição, ciclo-comprador 83/293/312, ações ×2, aprovações ×3, CT-ACC-09-H) | criar a SC por API (`/start`, `targetState: 0`) | desacopla da faixa do ERP; continua gated por 233. **Não** aplicar aos que medem o formulário |
| 11 | `docs/mapa-do-ambiente.md` | registrar que a janela ruim do ERP durou ≥ 40 min contínuos em 10/09 | "repita" só depois de canário verde |

---


## Parte C — Defeitos de produto e regressões (causa `C6-defeito-ou-regressao`)

Execução de 10/09/2026, 10:38–11:27 BRT, 1 worker, projeto `e2e`, ambiente `caixade213859`
(Fluig Voyager 2.0), conta `TOTVS-FS` (não-admin). Escopo desta parte: **41 testes** — 39 com a
tag `@bug` (vermelho intencional que chegou à assertion do defeito) e 2 sem tag que o gate
classificou como **REGRESSÃO** (`FSWTBC-5118` e `FSWTBC-4503`).

Convenção que governa tudo abaixo: um teste `@bug` está escrito **contra o comportamento
esperado** e fica verde sozinho quando o **produto** for corrigido. "Garantir que passe" significa
corrigir produto, configuração ou publicação — nunca a assertion. Os casos em que este documento
conclui que o teste (e não o produto) precisa mudar estão marcados explicitamente como
**exceção**, com a evidência.

Fontes de plataforma citadas: `fluig-master/references/*.md` (TDN destilado) e
`cassi-fluig-master/references/*.md` (medição de campo). Dedução própria está marcada **(INFERIDO)**.

### Tabela-resumo (41 testes)

Tipos: **config** = configuração de ambiente · **publicação** = publicação de artefato ·
**código** = código de widget/formulário/dataset/evento · **permissão** = permissão/segurança ·
**suíte** = ação no repositório de testes (nunca a assertion de um `@bug`).

| # | Teste (arquivo:linha) | Defeito | Dono da correção | Tipo |
|---|---|---|---|---|
| 1 | CT-GED-02-S1 `.exe` — `documentos/gestao-documentos.spec.js:66` | CT-GED-02-S1 | dev Fluig Cassi/TBC (evento `validateUpload`) | código |
| 2 | CT-GED-02-S2 `.bat` — `documentos/bloqueio-extensoes.spec.js:133` | CT-GED-02-S2 | idem | código |
| 3 | CT-GED-02-S2 `.sh` — `bloqueio-extensoes.spec.js:149` | CT-GED-02-S2 | idem | código |
| 4 | CT-GED-02-S2 `.pdf.exe` — `bloqueio-extensoes.spec.js:163` | CT-GED-02-S2 | idem | código |
| 5 | CT-GED-02-S2 exe renomeado `.pdf` — `bloqueio-extensoes.spec.js:176` | CT-GED-02-S2 | dev Fluig Cassi/TBC (`validateUpload` com `WKFileMimeType`) | código |
| 6 | CT-SEG-02-S1 admins de serviço — `seguranca/auditoria-datasets.spec.js:18` | U-13 | admin Fluig Cassi | permissão |
| 7 | CT-SEG-03-S1 `ds_Fluig` — `auditoria-datasets.spec.js:71` | U-03 | dev Fluig Cassi + admin | código + permissão |
| 8 | CT-SEG-04-S1 `dsFluig_executeSql` — `auditoria-datasets.spec.js:103` | U-04 | dev Fluig Cassi | código |
| 9 | CT-SEG-07-S1 BOLA API v2 — `seguranca/isolamento-horizontal-api-processos.spec.js:60` | CT-SEG-07-S1 | Cassi (config do processo) → TOTVS (plataforma) | permissão |
| 10 | CT-SEG-08-S1 `bpm_addUserFluig` — `seguranca/processos-administrativos-usuario-comum.spec.js:39` | CT-SEG-08-S1 | admin/dono do processo Cassi | permissão |
| 11 | CT-SEG-08-S1 `bpm_addUserGroup` — idem `:39` | CT-SEG-08-S1 | idem | permissão |
| 12 | CT-PLT-08-S1 processo `teste` — `plataforma/processo-inativo-e-residuo.spec.js:63` | CT-PLT-08-S1 | admin Fluig Cassi | publicação (despublicar) |
| 13 | CT-SEG-01-S1 `colleague` — `tests/api/dataset-colleague-vazamento.spec.js:22` | Vazamento `colleague` | admin Fluig Cassi → TOTVS | permissão |
| 14 | CT-CMP-07-S1 fail-open SC — `compras/fail-open-formulario-sc.spec.js:128` | Fail-open / CT-CMP-07-S1 | dev formulário `wf_solicitacao_compras` (Cassi/TBC) | código |
| 15 | CT-NEG shell envia — `compras/negociacao-proposta.spec.js:99` | família CT-PAR-01 | dev processo (Cassi/TBC) | código |
| 16 | CT-PAR-01-S1 — `compras/parecer-tecnico.spec.js:84` | CT-PAR-01-S1/S2 | idem | código |
| 17 | CT-PAR-01-S2 — `parecer-tecnico.spec.js:112` | CT-PAR-01-S1/S2 | idem | código |
| 18 | FSWTBC-3918 Data Final — `rh/delegacao-tarefas.spec.js:137` | FSWTBC-3918 (regrediu/não publicado) | dev TBC do 3918 + Cassi (publicação) | código + publicação |
| 19 | CT-DEL-01-H — `contratos/delegacao-fiscais-ciclo.spec.js:42` | CT-DEL-01-H | Cassi/TBC (portal de delegação) | publicação |
| 20 | CT-DEL-01-S1 — `delegacao-fiscais-ciclo.spec.js:82` | CT-DEL-01-S1 | idem | publicação |
| 21 | U-01 `/principalprocess` — `plataforma/deep-link-spa.spec.js:19` | U-01 | admin WCM Cassi | config / publicação |
| 22 | U-01 `/gestao_ferias` — idem `:19` | U-01 (aqui: página não publicada) | admin WCM Cassi | publicação |
| 23 | CT-PLT-01-H Home NPS 403 — `plataforma/home.spec.js:7` | NPS 403 | TOTVS Cloud | config |
| 24 | CT-PLT-06-S1 Portal do Comprador CSS 404 — `plataforma/erros-de-console.spec.js:176` | CT-PLT-06-S1 | dev widget `wg_portalCompradores` (TBC) | código |
| 25 | CT-NOT-03-S1 `limit`/`offset` — `notificacoes/contratos-api-notificacao.spec.js:99` | CT-NOT-03-S1 | TOTVS | código (plataforma) |
| 26 | CT-NOT-03-S1 `canRemove` sem DELETE — idem `:174` | CT-NOT-03-S1 | TOTVS | código (plataforma) |
| 27 | CT-PLT-07-S1 `addFavorites` 500 texto — `plataforma/favoritos-contrato-api.spec.js:127` | CT-PLT-07-S1 | TOTVS | código (plataforma) |
| 28 | CT-PLT-05-H widget de favoritos some — `plataforma/favoritos.spec.js:53` | mapa nº 4 | TOTVS · suíte: âncora de carga em `FavoritosPage.abrirHome` | código (plataforma) + suíte |
| 29 | CT-PFN-01-S1 login 500 + JSON cru — `portais/acesso-fornecedor.spec.js:51` | mapa nº 1 | Cassi/TOTVS Cloud (credencial) + dev portal TBC | config + código |
| 30 | CT-PFN-02-S1/S2 tela vazia (`cassi_rest`) — `acesso-fornecedor.spec.js:126` | mapa nº 2 / CT-PFN-02-S2 | dev portal TBC + Cassi (publicação) | publicação + código |
| 31 | FSWTBC-5257 máscara CNPJ — `portais/cadastro-publico-fornecedor.spec.js:58` | FSWTBC-5257 (aberto) | dev portal TBC | código |
| 32 | FSWTBC-4317 lookups sem ordem — `portais/portal-comprador.spec.js:114` | FSWTBC-4317 (reabrir) | dev widget/dataset TBC | código |
| 33 | CT-JUR-01-H Consultivo — `juridico/sigajuri-consultivo.spec.js:63` | D-JUR-01 | admin Cassi (serviço `SIGAJURI`) + TOTVS Jurídico | config + código |
| 34 | CT-JUR-03-H Contrato — `juridico/sigajuri-contrato.spec.js:32` | D-JUR-01 | idem | config + código |
| 35 | CT-JUR-04-S1 Novo Envolvido oculto — `juridico/sigajuri-contencioso.spec.js:196` | mapa "Parte contrária inalcançável" | TOTVS Jurídico / template do formulário | código |
| 36 | CT-BH-01-S2 aba Autorização — `rh/banco-horas-limite.spec.js:38` | U-02 (causa raiz) | admin Cassi (parâmetros) + dev widget TBC | config + código |
| 37 | CT-CLI-02-S1 Clínica vazia — `saude/questionario-clinicassi.spec.js:217` | U-14 (job `dsQDC000`) | admin Fluig Cassi (Agendador) | config (ressalva: pode ser dado da conta) |
| 38 | CT-INT-02-S1 `_Sync` 500 — `tests/api/sincronizacao-protheus.spec.js:31` | U-12 | admin Fluig Cassi / TOTVS Cloud | config (sincronização) |
| 39 | FSWTBC-648 `RA_SITFOLH` vazio — `tests/api/arvore-hierarquica-demitidos.spec.js:98` | FSWTBC-648 | dev integração Protheus (TBC) · suíte: nó sem `RA_MAT` = pré-condição | código + suíte |
| 40 | **FSWTBC-5118** alçada em pool — `tests/api/alcada-solicitacao-compras.spec.js:48` (REGRESSÃO) | mapa nº 6 (3957/5118) | dev processo TBC · suíte: aplicar `@bug` | código + suíte |
| 41 | **FSWTBC-4503** dataset ausente — `tests/api/datasets-contratos-fiscais.spec.js:37` (REGRESSÃO) | mapa nº 5 | Cassi/TBC (promoção de artefato) · suíte: aplicar `@bug` até publicar | publicação + suíte |

---

### Família 1 — GED sem allowlist de extensão (5 testes)

**Causa comum.** O publicador do GED (`POST /ecm/api/rest/ecm/documentPublisher/saveNewItem`,
contrato medido em `cassi-fluig-master/references/artefatos-nao-processo.md` §1) aceita qualquer
arquivo: não há lista de tipos permitidos nem inspeção de conteúdo. Os cinco testes esperam a
mensagem de bloqueio (`/extensão não permitida|tipo de arquivo não permitido|arquivo não permitido/i`)
por até 30s e ela nunca vem — por isso cada um dura ~40s. **Não é lentidão: os 30s de espera são
o próprio defeito** (o toast que aparece é o de sucesso, "Novo documento publicado"). O manual do
cliente declara que anexos ficam no GED "aplicando regras de segurança e pastas restritas"
(`regras-de-negocio-compras.md` §1 e §10) — é essa regra que a suíte cobra.

Ponto provável da correção, em duas camadas:

1. **Allowlist por nome — evento global de documento `validateUpload`.** Contrato confirmado no
   TDN (*Eventos de Documentos*, disponível a partir da **1.8.1 Silver Mist**; atualizações 1.8.0):
   *"sempre é disparado antes de realizar upload de arquivo para a plataforma, seja por API Rest,
   Soap/Webservices ou FTP… é possível validar o MIMEType ou Extensão do arquivo… e poder
   bloquear. O evento não recebe parâmetros, porém temos acesso à função `getValue`"* — com
   `WKFileName`, `WKFileSize`, `WKFilePath`, `WKFileMimeType` e `WKUser`; **`throw` devolve a
   mensagem na tela** e, desde a 1.8.0, o arquivo inconsistente é removido da pasta de upload. É
   exatamente o "mensagem de bloqueio" que os cinco testes esperam. A regra a implementar é
   **lista de permitidos** (pdf, docx, xlsx, png…) avaliando a **última** extensão de
   `WKFileName`; o exemplo oficial do TDN é uma lista negra (`/.*\.(sh|exe|msi|bat|app)/i`) e
   **não deve ser copiado como está** — lista negra é o que `bloqueio-extensoes.spec.js` existe
   para reprovar (`.pdf.exe` até passaria no regex do exemplo, mas `.ps1`, `.vbs`, `.jar`…
   não). Não há parâmetro pronto de "extensões permitidas" no Painel de Controle; o que existe de
   configuração é tamanho máximo de upload (`max-post-size` no `standalone.xml`). Dono:
   **desenvolvedor Fluig da Cassi/TBC**, publicado com a permissão "Configurar Eventos Globais"
   (`eventos-globais.md`). **(INFERIDO: a doc cita REST/SOAP/FTP; o publicador web usa a REST
   `documentPublisher/saveNewItem` + `widgetpartupload`, logo deve estar coberto — o teste
   CT-GED-02-S1 é a confirmação.)**
2. **Validação por conteúdo (magic bytes) — o mesmo evento.** `WKFileMimeType` é *"MimeType dos
   bytes do arquivo, ou seja, independente da extensão"*; o exemplo oficial bloqueia
   `application/x-*` (executáveis: um binário `MZ` é detectado como `application/x-dosexec` /
   `application/x-msdownload`) e `application/octet-stream`. A allowlist deve, portanto, cruzar
   **extensão permitida × mimetype coerente** (`.pdf` só com `application/pdf`). Não é pedido de
   infraestrutura: é código Cassi no mesmo evento. A leitura do relatório depois da correção é
   que valida a implementação: se só o caso "renomeado para .pdf" continuar vermelho, a regra
   olhou `WKFileName` e ignorou `WKFileMimeType`.

Resíduo: enquanto o defeito existir, cada execução publica 5 documentos `QA…` em "Meus
Documentos"; a limpeza é manual (`navigation/removeDoc` → `recycleBin/removeDocument`).

##### CT-GED-02-S1 — upload de extensão bloqueada é rejeitado e nada é gravado (.exe)
- **Local:** `tests/e2e/documentos/gestao-documentos.spec.js:66` · **Classe no gate:** conhecido-bug · **Duração:** 41s · **Defeito:** CT-GED-02-S1 (README)
- **O que o teste verifica:** publica `fixtures/anexos/arquivo-bloqueado.exe` em "Meus Documentos" com `esperaPublicacao:false` e exige (a) mensagem de bloqueio de extensão e (b) que a pasta inteira (varredura paginada) não contenha o documento. Regra: catálogo CT-GED-02-S1 e política de "pastas restritas" do manual.
- **Por que falhou:** `expect(locator).toBeVisible()` — `element(s) not found` em 30s. O `.exe` foi aceito e publicado com o toast de sucesso normal; o mecanismo é a ausência de qualquer filtro de tipo no `documentPublisher/saveNewItem`.
- **Como solucionar:** evento global de documento `validateUpload` com allowlist de extensões (ver causa comum), valendo para toda a empresa — inclui "Meus Documentos" e as pastas de anexo de processo `Anexos de Processo de Compras`. Dono: **desenvolvedor Fluig da Cassi/TBC**; publicação pelo administrador (permissão "Configurar Eventos Globais", `eventos-globais.md`).
- **Como garantir que fique verde:** re-executar `npx playwright test tests/e2e/documentos/gestao-documentos.spec.js -g "CT-GED-02-S1"`; verde exige mensagem de bloqueio **e** pasta sem o documento. Se a mensagem do produto vier com outro texto (ex.: em inglês, como o estado vazio das grades neste tenant), o regex do teste precisa absorvê-la — isso é atualização de mensagem, não de assertion. Nada mais muda na suíte.

##### CT-GED-02-S2 — script de lote (.bat) deveria ser rejeitado
- **Local:** `tests/e2e/documentos/bloqueio-extensoes.spec.js:133` · **Classe no gate:** conhecido-bug · **Duração:** 40s · **Defeito:** CT-GED-02-S2 (README)
- **O que o teste verifica:** o mesmo fluxo com `qa-script-lote.bat` gerado em diretório temporário; afirma que a regra é **allowlist** — um `.bat` não pertence a nenhuma lista razoável de documentos.
- **Por que falhou:** nenhuma mensagem em 30s; o `.bat` foi publicado. Mesmo mecanismo do S1.
- **Como solucionar:** a mesma allowlist da família. Uma correção que só bloqueie `.exe` deixa este caso vermelho — e é esse o propósito dele.
- **Como garantir que fique verde:** `-g "script de lote"`; sem mudança na suíte.

##### CT-GED-02-S2 — shell script (.sh) deveria ser rejeitado
- **Local:** `tests/e2e/documentos/bloqueio-extensoes.spec.js:149` · **Classe no gate:** conhecido-bug · **Duração:** 39s · **Defeito:** CT-GED-02-S2
- **O que o teste verifica:** idem, com `qa-script-shell.sh` (`#!/bin/sh`).
- **Por que falhou:** publicado sem bloqueio.
- **Como solucionar:** allowlist (a lista de permitidos cobre o caso por construção; lista negra teria de lembrar de `.sh`, `.ps1`, `.vbs`, `.js`…).
- **Como garantir que fique verde:** `-g "shell script"`; sem mudança na suíte.

##### CT-GED-02-S2 — dupla extensão (.pdf.exe) deveria ser rejeitada
- **Local:** `tests/e2e/documentos/bloqueio-extensoes.spec.js:163` · **Classe no gate:** conhecido-bug · **Duração:** 39s · **Defeito:** CT-GED-02-S2
- **O que o teste verifica:** `qa-relatorio.pdf.exe` com cabeçalho `MZ`. Cobre a implementação errada que procura `.pdf` em qualquer posição do nome ou olha só a primeira extensão.
- **Por que falhou:** publicado sem bloqueio.
- **Como solucionar:** a allowlist precisa avaliar a **última** extensão do nome (`.exe`). Configuração de plataforma cobre isso; se for implementado em código customizado, o teste é o critério de aceite.
- **Como garantir que fique verde:** `-g "dupla extensão"`; sem mudança na suíte.

##### CT-GED-02-S2 — executável renomeado para .pdf deveria ser rejeitado pelo conteúdo
- **Local:** `tests/e2e/documentos/bloqueio-extensoes.spec.js:176` · **Classe no gate:** conhecido-bug · **Duração:** 39s · **Defeito:** CT-GED-02-S2
- **O que o teste verifica:** `qa-executavel-disfarcado.pdf` cujo conteúdo começa com os magic bytes `MZ`. Regex ampliado (`conteúdo não corresponde|arquivo inválido`). É o único caso que uma allowlist correta **não** pega.
- **Por que falhou:** publicado sem bloqueio — nem nome nem conteúdo são checados.
- **Como solucionar:** no mesmo `validateUpload`, exigir coerência entre a extensão permitida e `WKFileMimeType` (lido dos bytes pela plataforma): `.pdf` só passa com `application/pdf`; `application/x-*` e `application/octet-stream` são recusados como no exemplo oficial do TDN. Dono: **desenvolvedor Fluig da Cassi/TBC**. Leitura correta do relatório depois da allowlist: se os quatro anteriores ficarem verdes e só este continuar vermelho, a implementação olhou só `WKFileName`.
- **Como garantir que fique verde:** `-g "renomeado para .pdf"`; sem mudança na suíte. Se a mensagem do produto para bloqueio por conteúdo for outra, atualizar apenas o regex de mensagem.

---

### Família 2 — Segurança: datasets sensíveis, isolamento de objeto e processos administrativos (8 testes)

**Causa comum.** Três mecanismos distintos, todos no lado de permissão:

- **Datasets alcançáveis por qualquer sessão.** `GET /api/public/ecm/dataset/search?datasetId=<nome>`
  responde para qualquer dataset cujo nome se conheça. Em dataset **avançado** (JavaScript) o
  produto **não aplica constraints nem permissão** — `datasets.md`: *"constraints podem ser
  utilizadas apenas para Datasets internos… o tratamento de filtros deve ser feito na codificação"*
  e *"alguns datasets retornam dados sensíveis… é altamente recomendado que apenas os usuários
  responsáveis tenham acesso"*, com o padrão oficial de validar `WKUser` contra `colleagueGroup`
  dentro do `createDataset`. Nenhum dos datasets sensíveis da Cassi faz isso.
- **Permissão de início de processo.** Em evento inicial *Comum*, *"permissão pelo mecanismo de
  atribuição da atividade; processo público = qualquer usuário"* (`workflow-bpm.md`, "Eventos
  iniciais"). Os processos administrativos estão com a atividade inicial aberta a todos.
- **Isolamento horizontal na API v2** — `apis-de-workflow.md`: *"nenhum endpoint retornou 403 para
  TOTVS-FS em toda a varredura"*; a superfície de leitura do motor responde 200 para o usuário
  comum. O manual do cliente exige "trava rígida" na alçada (`regras-de-negocio-compras.md` §8) e a
  divergência já está catalogada em §10.

##### CT-SEG-02-S1 — contas de integração/serviço não devem ter privilégio de administrador
- **Local:** `tests/e2e/seguranca/auditoria-datasets.spec.js:18` · **Classe no gate:** conhecido-bug · **Duração:** 2s · **Defeito:** achado U-13 (comentário do spec; não está na tabela do README)
- **O que o teste verifica:** lê o dataset interno `colleague` e conta registros com `adminUser=true` cujo login/nome case com `consumerkey|consumer_key|fluig_consumer|integr`. Espera 0 (menor privilégio). Só contagens saem na mensagem.
- **Por que falhou:** `Expected: 0 / Received: 2` — **2 de 5** administradores da plataforma são contas técnicas.
- **Como solucionar:** retirar o flag de administrador das contas de integração e conceder as permissões específicas de que precisam (Painel de Controle → Permissões; para SOAP/REST, a lógica invertida de `integracao-apis.md` "Segurança — três camadas"). **Ressalva de produto:** `eventos-globais.md` ("Chamar a API pública de dentro de um evento") diz que *"o usuário aplicativo precisa ser administrador"* para `oauthUtil` — se uma das duas contas for o usuário do OAuth App usado pelos eventos, a remoção precisa ser validada com a TOTVS ou substituída por conta dedicada com escopo mínimo. Dono: **administrador Fluig da Cassi**.
- **Como garantir que fique verde:** `-g "CT-SEG-02-S1"`. Suíte inalterada. Se sobrar exatamente uma conta admin por exigência documentada do produto, o caminho é registrar a exceção no README e, aí sim, o dono decidir se o teste passa a aceitar 1 — decisão de negócio, não ajuste silencioso.

##### CT-SEG-03-S1 — dataset de credencial de integração não deve ser legível sem privilégio admin
- **Local:** `tests/e2e/seguranca/auditoria-datasets.spec.js:71` · **Classe no gate:** conhecido-bug · **Duração:** 1s · **Defeito:** achado U-03 (spec; mapa "Datasets sensíveis alcançáveis sem admin")
- **O que o teste verifica:** `GET /api/public/ecm/dataset/search?datasetId=ds_Fluig` (descrito no ambiente como "Usuário e Senha usuario de integração") deve responder 403 para sessão comum. O conteúdo nunca é lido — só `status`, quantidade de registros e de colunas.
- **Por que falhou:** `Expected: 403 / Received: 200` — 1 registro, 3 colunas devolvidos a `TOTVS-FS`.
- **Como solucionar:** duas ações, na ordem: (1) **credencial não deve sair de dataset** — mover usuário/senha de integração para um *Serviço cadastrado* (Painel de Controle → Desenvolvimento → Serviços, `integracao-apis.md` "Serviço REST com OAuth 2.0"/JDBC), consumido server-side por `ServiceManager`, e despublicar `ds_Fluig`; (2) se o dataset precisar existir, aplicar o padrão oficial de `datasets.md` "Permissionamento dentro do dataset" (validar `WKUser` em `colleagueGroup` e devolver linha `ERROR` "sem permissão"). Dono: **desenvolvedor Fluig da Cassi** (código de dataset) + administrador.
- **Como garantir que fique verde:** `-g "CT-SEG-03-S1"`. Atenção à assertion: ela exige **403**. Um dataset que passe a devolver 200 com linha `ERROR` (padrão TDN) continua vermelho — nesse caso a decisão correta é **despublicar** `ds_Fluig` (o `search` de dataset inexistente não devolve 200 com dado) ou registrar no README que a proteção escolhida é a linha `ERROR` e ajustar o critério **com decisão do dono**, porque o esperado do catálogo é "negar acesso", e 200+ERROR também nega.

##### CT-SEG-04-S1 — datasets de execução de SQL não devem ser alcançáveis sem privilégio admin
- **Local:** `tests/e2e/seguranca/auditoria-datasets.spec.js:103` · **Classe no gate:** conhecido-bug · **Duração:** 1s · **Defeito:** achado U-04 (spec; mapa)
- **O que o teste verifica:** `dsFluig_executeSql` e `dsFluig_getDocumentSql` devem responder 403 a sessão comum (`expect.soft` por dataset). Nenhum payload de injeção é enviado — só alcançabilidade.
- **Por que falhou:** `Expected: 403 / Received: 200` em `dsFluig_executeSql` (o segundo não chegou a ser reportado separadamente na mensagem, mas o `soft` cobre ambos).
- **Como solucionar:** um "executor de SQL" exposto como dataset é superfície de defesa em profundidade nula. Correção: **remover** `dsFluig_executeSql` do ambiente e substituir cada uso por dataset específico com SQL parametrizado (`datasets.md` "Boas práticas TBC": SQL dinâmico validado, integração confinada); se houver dependência que não possa ser removida de imediato, cercar com a validação de grupo dentro do `createDataset`. Dono: **desenvolvedor Fluig da Cassi**.
- **Como garantir que fique verde:** `-g "CT-SEG-04-S1"`. Mesma nota do S1 sobre 403 vs 200+`ERROR`: despublicar é o que deixa verde sem tocar na suíte.

##### CT-SEG-07-S1 — não deve entregar o objeto de um processo em que o usuário não participa (BOLA)
- **Local:** `tests/e2e/seguranca/isolamento-horizontal-api-processos.spec.js:60` · **Classe no gate:** conhecido-bug · **Duração:** 4s · **Defeito:** CT-SEG-07-S1 (BOLA) (README)
- **O que o teste verifica:** descobre em runtime uma instância de RDFC (processo que a conta **não pode nem iniciar**), confirma por `/requests/{id}/tasks` que `TOTVS-FS` não é assignee nem requester de nenhuma tarefa, e exige que `GET /process-management/api/v2/requests/{id}?expand=formFields` negue (403/404 ou `formFields:null`).
- **Por que falhou:** instância **95611** de `bpm_recepcao_documentos_fiscais_compras`, 24 tarefas inspecionadas, nenhuma da conta → **HTTP 200 com 123 formFields** (razão social e CNPJ do fornecedor incluídos). `processInstanceId` é sequencial: enumeração trivial.
- **Como solucionar:** o motor `process-management/api/v2` não aplica autorização por objeto para usuário autenticado (`apis-de-workflow.md`, "O que exige admin — separando 403 de 404"). Dois níveis: (1) **configuração do processo** — verificar na aba Segurança do editor de processos se a visualização de solicitações está aberta a todos os usuários e restringi-la a participantes/gestor **(INFERIDO: o efeito dessa opção sobre a API v2 precisa ser medido; o teste é o instrumento)**; (2) se a API ignorar a configuração, é **defeito de plataforma** — abrir chamado na TOTVS com a evidência do teste (id, processo, 200+123 campos). Dono: **Cassi (config) → TOTVS (produto)**.
- **Como garantir que fique verde:** `-g "CT-SEG-07-S1"`. O teste depende de existir ao menos uma instância RDFC de outra conta (havia nesta execução — 95611); sem massa ele declara `PRÉ-CONDIÇÃO AUSENTE`, não verde. Suíte inalterada.

##### CT-SEG-08-S1 — "bpm_addUserFluig" (Adicionar Usuário) não deve constar do catálogo nem abrir para conta não-admin
- **Local:** `tests/e2e/seguranca/processos-administrativos-usuario-comum.spec.js:39` · **Classe no gate:** conhecido-bug · **Duração:** 5s · **Defeito:** CT-SEG-08-S1 (README)
- **O que o teste verifica:** o catálogo `process-category/processes?onlyCanStart=true` não deve listar o processo, e `pageworkflowview?processID=bpm_addUserFluig` deve abrir o diálogo "Erro" de permissão (como Férias/Ocorrência/RDFC), sem botão Enviar. Nunca clica em Enviar; `guarda.tentativas()` = 0 é assertion dura.
- **Por que falhou:** o processo consta do catálogo (`Received array: ["bpm_addUserGroup","bpm_addUserFluig","teste",…]`) e o formulário abre com Enviar visível (asserções `soft`).
- **Como solucionar:** no editor de processos, mecanismo de atribuição da **atividade inicial** restrito a um grupo/papel de administração (não "qualquer pessoa"/público) e **liberar nova versão** (`workflow-bpm.md` "Eventos iniciais"; `armadilhas.md` "Mudança no processo não teve efeito → liberar versão"). Alternativa mais simples se o processo não é usado: despublicar/inativar. Dono: **administrador/dono do processo na Cassi**.
- **Como garantir que fique verde:** `-g "bpm_addUserFluig"`. Verde exige as duas condições (fora do catálogo **e** diálogo de erro ao abrir por URL) — inativar sem restringir deixaria a mensagem como "não está mais ativo", que satisfaz `headingErro`. Suíte inalterada.

##### CT-SEG-08-S1 — "bpm_addUserGroup" (Adicionar Grupo) não deve constar do catálogo nem abrir para conta não-admin
- **Local:** `tests/e2e/seguranca/processos-administrativos-usuario-comum.spec.js:39` · **Classe no gate:** conhecido-bug · **Duração:** 6s · **Defeito:** CT-SEG-08-S1
- **O que o teste verifica:** idem, para `bpm_addUserGroup` (categoria vazia/uuid no catálogo).
- **Por que falhou:** consta do catálogo e abre o formulário.
- **Como solucionar:** mesma correção; observar que este processo aparece com categoria vazia no catálogo — sinal de publicação sem governança (`catalogo-de-processos.md`, linha `bpm_addUserGroup | (uuid)`).
- **Como garantir que fique verde:** `-g "bpm_addUserGroup"`. Suíte inalterada.

##### CT-PLT-08-S1 — o processo `teste` (categoria ADMIN) não deveria constar do catálogo de início de um usuário de Compras
- **Local:** `tests/e2e/plataforma/processo-inativo-e-residuo.spec.js:63` · **Classe no gate:** conhecido-bug · **Duração:** 3s · **Defeito:** CT-PLT-08-S1 (README)
- **O que o teste verifica:** o catálogo `onlyCanStart` não deve conter `teste`. O irmão `@achado` do mesmo arquivo registra que abri-lo serve o formulário completo da Solicitação de Compras (147 campos).
- **Por que falhou:** `teste` (categoria ADMIN, "Último iniciado: Nunca") continua no catálogo — o array recebido o lista em terceiro lugar.
- **Como solucionar:** governança de publicação — **despublicar** o resíduo (ou, no mínimo, inativá-lo como `testePRODUTO` já está e restringir a atividade inicial). Dono: **administrador Fluig da Cassi**.
- **Como garantir que fique verde:** `-g "não deveria constar do catálogo"`. Efeito colateral esperado e desejado: o teste `@achado` do mesmo arquivo (`abrir o processo teste serve o formulário da SC`) ficará **vermelho** — é a polaridade invertida do `@achado`, e alguém deve então removê-lo com a decisão registrada. `catalogo-invariante.spec.js` também muda.

##### CT-SEG-01-S1 — deve retornar somente o registro do login filtrado, não a base inteira (dataset `colleague`)
- **Local:** `tests/api/dataset-colleague-vazamento.spec.js:22` · **Classe no gate:** conhecido-bug · **Duração:** 2s · **Defeito:** "Vazamento `colleague`" (README; mapa CT-SEG-01-S1)
- **O que o teste verifica:** `GET /api/public/ecm/dataset/search?datasetId=colleague&constraintFields=colleagueId&constraintValues=<login>` deve devolver 1 registro. Compara só contagens (dado pessoal nunca vai ao relatório).
- **Por que falhou:** `Expected: 1 / Received: 3449` — o mesmo total sem constraint (3449; era 3.493 no ambiente anterior). A base inteira de colaboradores é servida a qualquer sessão autenticada.
- **Como solucionar:** `colleague` é dataset **interno**, onde `datasets.md` afirma que constraints *"são aplicadas pela plataforma"* — logo, ou o endpoint `search` (GET com `constraintFields/constraintValues`) não traduz esses parâmetros em constraints nesta release, ou a proteção precisa vir de outro lugar. Independentemente do filtro, **a exposição real é o acesso irrestrito ao dataset de colaboradores**: restringir a consulta de `colleague` à API pública para perfis administrativos/integração (Painel de Controle → Permissões, serviço de dataset — lógica invertida: *"para bloquear os usuários comuns, o administrador precisa dar permissão a alguém"*, `integracao-apis.md`) e, para as telas que precisam de busca de pessoas, expor um dataset avançado próprio que filtre por `WKUser`/constraint no código. Base legal citada pelo manual: LGPD art. 7º, V (`regras-de-negocio-compras.md` §11) — um dump de 3.449 registros não se sustenta nela. Dono: **administrador Fluig da Cassi**; se a permissão de serviço não alcançar a REST pública, **TOTVS**.
- **Como garantir que fique verde:** `npx playwright test tests/api/dataset-colleague-vazamento.spec.js`. **Ressalva sobre a suíte:** a assertion exige exatamente **1** com constraint e `ok()` nas duas chamadas; se a correção for negar o dataset (403), o teste passa a falhar em `status inesperado` — comportamento correto do ponto de vista de segurança, mas o teste precisaria então aceitar 403 como êxito. Registrar isso como decisão quando a correção for escolhida; até lá a assertion fica como está.

---

### Família 3 — Validação só no cliente / fail-open em formulários de processo (7 testes)

**Causa comum.** Nos formulários clássicos do Fluig, o botão Enviar do widget de movimentação
dispara `POST /ecm/api/rest/ecm/workflowView/send` (contrato medido em
`artefatos-nao-processo.md` §3 e `apis-de-workflow.md`, nota de 27/08). A validação que impede
esse envio tem dois lugares possíveis: no navegador (`beforeSendValidate`/`beforeMovementOptions`,
que rodam **só se o script do formulário já estiver carregado e a tela de movimentação abrir**) e
no servidor (`validateForm` e `beforeTaskSave`, que são *"a autoridade"* — `formularios.md`, "Os
dois eventos que rodam no navegador": *"o client é conveniência; o servidor é a autoridade"*;
`workflow-bpm.md`: *"`beforeTaskSave` é o gate de validação de movimentação"*). Os sete casos
abaixo mostram o mesmo padrão: **a regra só existe no cliente, ou não existe em lugar algum**, e o
`send` sai. A suíte prova a saída da requisição (contagem de tentativas ou resposta do servidor),
nunca o resultado na tela — porque abortar o `send` muda o comportamento do widget (CLAUDE.md,
"Armadilhas já pagas"). O manual da Cassi exige "trava rígida contra manipulação client-side"
(`regras-de-negocio-compras.md` §1) — validação só no navegador é, por definição, o contrário
disso.

##### CT-CMP-07-S1 — Enviar não deveria criar solicitação antes de o formulário terminar de montar
- **Local:** `tests/e2e/compras/fail-open-formulario-sc.spec.js:128` · **Classe no gate:** conhecido-bug · **Duração:** 11s · **Defeito:** "Fail-open no formulário" / "CT-CMP-07-S1 (fail-open determinístico)" (README)
- **O que o teste verifica:** força `ds_protheus_getMatriculaTitular_rest` → 500 (`derrubarDataset`), o que impede a montagem da SC de terminar (a resposta `ds_getFormDistribuicaoAreas…tbAreasDist` nunca chega), confirma que o heading e o botão Enviar apareceram, clica e conta as requisições `POST …/workflowView/send`. Espera **zero**: Enviar inerte ou desabilitado até a montagem concluir.
- **Por que falhou:** 1 requisição saiu. O servidor recusou (HTTP 500, *"O campo 'Nome da Filial' é obrigatório!"*) e nenhuma SC nasceu nesta execução — mas a mensagem do teste é explícita: a recusa é acidente do formulário vazio; quando a montagem falha depois de os campos terem valor, a mesma janela cria SC (é como o defeito foi descoberto). Mecanismo: o handler de Enviar do widget não espera a inicialização assíncrona do formulário (os datasets da carga), e a validação de cliente ainda não está registrada quando o clique acontece. Neste tenant o gatilho real é frequente: `ds_protheus_getMatriculaTitular_rest` responde 500 `WFLYEJB0054` por conta própria (CLAUDE.md, "Semeadura de massa"), logo o fail-open é o **estado normal** aqui, não uma janela de 2 em 9.
- **Como solucionar:** duas correções complementares. (1) **Formulário da SC (código Cassi):** desabilitar/ocultar Enviar até o fim da inicialização (o script já sabe qual é a última resposta) e falhar visivelmente quando um dataset da carga responde erro — em vez de deixar a tela "montada" sem pista visual (o `blockUI` já saiu, medido no cabeçalho do spec). (2) **Servidor (autoridade):** `validateForm`/`beforeTaskSave` rejeitando movimentação da atividade inicial sem os campos mínimos — a recusa "Nome da Filial é obrigatório" prova que **alguma** validação server-side existe, mas ela não cobre produto, justificativa, rateio e anexo (CT-CMP-02-S4 mostra a SC nascendo sem anexo). Dono: **desenvolvedor do formulário `wf_solicitacao_compras` (Cassi/TBC)**. A instabilidade do EJB (`WFLYEJB0054`) é assunto separado, do lado TOTVS/Protheus, e resolvê-la **não** fecha este caso — o teste força o 500 de propósito.
- **Como garantir que fique verde:** `npx playwright test tests/e2e/compras/fail-open-formulario-sc.spec.js`. Verde exige que, com o dataset em 500, nenhum `send` saia. Suíte inalterada. Se a correção for "Enviar desabilitado", `formulario.enviar()` vai clicar num botão desabilitado e o `poll` de 45s vai falhar em vez de dar verde — nesse cenário o teste precisa de ajuste de **mecânica** (aceitar botão desabilitado como desfecho correto), não de polaridade; registrar quando ocorrer.

##### CT-NEG — o Enviar do shell sem proposta real vinculada nunca deveria completar uma requisição de escrita
- **Local:** `tests/e2e/compras/negociacao-proposta.spec.js:99` · **Classe no gate:** conhecido-bug · **Duração:** 6s · **Defeito:** mesma família de CT-PAR-01 (README); não tem linha própria na tabela
- **O que o teste verifica:** abre `wf_negociacao_cotacao_prod_serv` a frio (shell fora de contexto: fornecedor, cotação, itens e totais `readonly` e vazios), marca "proposta validada" com justificativa, arma `bloquearTodaEscritaNoHost` (aborta todo não-GET) e clica Enviar. Espera zero escritas — o cliente deveria recusar, como a SC faz com campos obrigatórios.
- **Por que falhou:** `POST …/ecm/api/rest/ecm/workflowView/send` foi tentado (1). O formulário não tem validação de "há proposta/fornecedor vinculado" no cliente; o próprio HTML avisa que *"a aprovação da negociação deve ser realizada pelo Protheus"*, ou seja, o formulário existe para ser movimentado por integração, não iniciado por pessoa — mas está no catálogo `onlyCanStart` (`catalogo-de-processos.md`).
- **Como solucionar:** (1) `validateForm` (servidor) rejeitando o envio quando os campos de vínculo (`hd_numSc`, cotação, fornecedor) estão vazios — vale para qualquer origem, inclusive API; (2) retirar o processo do catálogo de início do usuário comum (atribuição da atividade inicial restrita à conta de integração `consumerkeycompras`), já que instâncias reais nascem por integração (`regras-de-negocio-compras.md` §7). Dono: **desenvolvedor do processo (Cassi/TBC)**.
- **Como garantir que fique verde:** `-g "CT-NEG @bug"`. Se a correção for a (2), o teste passa a cair em `expectAberto()` com diálogo de permissão — o caso fica **inalcançável**, não verde, e deve ser reclassificado (o mesmo que CT-NEG-01-H/S1/S2 já são). Se for a (1), a assertion pede zero requisições de **cliente** — uma validação apenas server-side deixa o `send` sair e o teste continua vermelho; então o critério da suíte precisaria de decisão do dono (aceitar "send saiu e servidor recusou sem criar" como correto, como faz CT-DEL-01-S1). Deixar registrado: **a assertion atual exige validação no cliente**, o que é mais forte que o manual pede.
- **Re-medição (10/09, 11h40–12h20):** **reproduziu o defeito** (chegou à assertion) (fatia Cotação/Comprador): _Error: o clique em Enviar deveria ter sido recusado no cliente, sem gerar nenhuma requisição de escrita — em vez disso tentou: POST https://caixade213859.fluig.cloudtotvs.com.br/ecm/api/rest/ecm/workf_

##### CT-PAR-01-S1 — parecer sem responsável definido não pode completar uma requisição de escrita ao Enviar
- **Local:** `tests/e2e/compras/parecer-tecnico.spec.js:84` · **Classe no gate:** conhecido-bug · **Duração:** 5s · **Defeito:** CT-PAR-01-S1 / CT-PAR-01-S2 (README, 31/08/2026)
- **O que o teste verifica:** em `wf_solicitacao_compras_parecer` a frio, a seção "7. Aprovação do Parecer Técnico" (Responsável/Email/Data/Hora) nasce `readonly` e vazia; o teste preenche o que é editável (observação, decisão "Aprovado"), arma o bloqueio de escrita e clica Enviar. Catálogo CT-PAR-01-S1: *"o sistema deve sinalizar a ausência de responsável, não rotear para o vazio"*. Manual: os responsáveis técnicos são "postos" cadastrados no Protheus, e o sistema deve **emitir aviso** se a área técnica não tiver distribuição (`regras-de-negocio-compras.md` §6).
- **Por que falhou:** `POST …/workflowView/send` tentado (1). Nenhuma validação de responsável no cliente.
- **Como solucionar:** `validateForm`/`beforeTaskSave` do processo lançando *"Responsável pelo parecer não definido"* quando o campo está vazio ao completar a tarefa (`WKCompletTask == 'true'`); e, como em CT-NEG, restringir o início manual (instâncias reais nascem por integração, `consumerkeycompras` → parecerista). Dono: **desenvolvedor do processo (Cassi/TBC)**.
- **Como garantir que fique verde:** `-g "CT-PAR-01-S1"`. Mesma ressalva de CT-NEG: a assertion exige zero escrita **do cliente**; validação apenas server-side não a satisfaz e pede decisão do dono sobre o critério.

##### CT-PAR-01-S2 — parecer desfavorável (Reprovado/Ajustes) com justificativa também é barrado pela ausência de responsável
- **Local:** `tests/e2e/compras/parecer-tecnico.spec.js:112` · **Classe no gate:** conhecido-bug · **Duração:** 6s · **Defeito:** CT-PAR-01-S1 / S2 (README)
- **O que o teste verifica:** o mesmo cenário com decisão "Reprovado/Ajustes" — prova que a ausência de responsável barra qualquer polaridade de parecer.
- **Por que falhou:** `send` tentado (1), idêntico ao S1.
- **Como solucionar:** a mesma validação server-side; não há regra específica de reprovação a acrescentar.
- **Como garantir que fique verde:** `-g "CT-PAR-01-S2"`; mesma ressalva.

##### FSWTBC-3918 — o envio deveria ser recusado na tela com "Data Final" em branco (Delegação de Tarefas)
- **Local:** `tests/e2e/rh/delegacao-tarefas.spec.js:137` · **Classe no gate:** conhecido-bug · **Duração:** 51s · **Defeito:** não catalogado na tabela do README (chamado FSWTBC-3918, corrigido 26/02 e homologado 18/03/2026 segundo o spec)
- **O que o teste verifica:** em `wf_SubstituiçãoCargosFluig` (Delegação de Tarefas, categoria Compras) preenche só Data Inicial, deixa Data Final vazia, clica Enviar e espera crítica em tela **sem** tentativa de escrita (`guarda.tentativas() === 0`). O `poll` de 30s espera "ou crítica, ou escrita".
- **Por que falhou:** anotação `delegacao-sem-data-final`: *"crítica em tela: (nenhuma crítica em tela) · escritas tentadas: [POST …/workflowView/send]"*. A guarda da suíte impediu a delegação de nascer, não a tela. Os 51s são a carga do formulário (~15s neste tenant) + o `poll` + o `expectAberto`; não é o defeito.
- **Por que isto é regressão de chamado, não achado novo:** o FSWTBC-3918 entregou exatamente a obrigatoriedade da data final. Ou a correção ficou só em máscara/`required` visual que o widget não honra, ou foi publicada numa versão do processo que não é a vigente neste tenant (`editores-processo.md`: *"publicar só afeta solicitações novas"* e a versão ativa é a que conta), ou nunca chegou a `caixade213859`. **(INFERIDO: a segunda hipótese é a mais provável dado que o ambiente foi trocado em 09/09.)**
- **Como solucionar:** conferir a versão publicada do processo neste tenant contra a entrega do 3918; garantir `validateForm` com `throw` quando `dataFinal` vazia (autoridade no servidor) além de `beforeSendValidate` no cliente. Dono: **desenvolvedor responsável pelo FSWTBC-3918 (TBC) + Cassi para publicação**.
- **Como garantir que fique verde:** `-g "FSWTBC-3918"`. A assertion exige zero escrita (validação no cliente); com validação apenas no servidor o teste continua vermelho e a suíte precisaria de um oráculo de resposta (como CT-DEL-01-S1) — o spec já declara esse limite ("não se sabe se o servidor recusaria"). Enquanto o chamado é reaberto, a tag `@bug` está correta.

##### CT-DEL-01-H — delegar um fiscal substituto para um contrato deve criar a delegação
- **Local:** `tests/e2e/contratos/delegacao-fiscais-ciclo.spec.js:42` · **Classe no gate:** conhecido-bug · **Duração:** 29s · **Defeito:** CT-DEL-01-H/S1 (comentário do spec; README "A tag @bug" o cita nominalmente)
- **O que o teste verifica:** `wf_delegacaoFiscalContratoServico` consta do catálogo de início ("Último iniciado: Nunca", confirmado no próprio teste), abre; o teste clica Enviar e espera a confirmação *"iniciada com sucesso."* em 15s.
- **Por que falhou:** o servidor recusa com HTTP 500 *"Erro ao salvar dados de formulário: Solicitação só pode ser aberta através do portal de delegação de fiscais!"* — mensagem de `validateForm`/`beforeTaskSave` do processo. Esse "portal" não foi encontrado em nenhum ponto de navegação, e o Portal de Acompanhamento de Contratos (candidato natural a hospedá-lo) **não está publicado neste tenant** (mapa, "O que não existe mais").
- **Como solucionar:** este é o caso em que o servidor **faz** a validação certa — o defeito é de **publicação/navegação**: (1) publicar a página WCM do portal de delegação (ou o widget dentro do Acompanhamento de Contratos) e ligá-la ao menu/Home; (2) retirar o processo do catálogo de início manual (atividade inicial atribuída ao usuário de integração ou ao grupo do portal), porque hoje ele anuncia uma ação que sempre falha. Dono: **Cassi (publicação de artefato WCM) / desenvolvedor do portal (TBC)**.
- **Como garantir que fique verde:** `-g "CT-DEL-01-H"`. **Atenção:** o teste inicia pelo formulário a frio; se a correção for (2) sem (1), ele passa a ver diálogo de permissão e vira inalcançável; se for (1), o caminho correto passa a ser o portal, e o teste precisará ser **reescrito** para entrar por ele — isso é mudança legítima de cenário (o caso é "delegar um fiscal", não "enviar o formulário a frio"), a ser feita junto com a publicação, nunca antes.

##### CT-DEL-01-S1 — substituto inválido/sem permissão deve ser bloqueado — não há nenhum controle para selecionar um fiscal substituto
- **Local:** `tests/e2e/contratos/delegacao-fiscais-ciclo.spec.js:82` · **Classe no gate:** conhecido-bug · **Duração:** 9s · **Defeito:** CT-DEL-01-S1 (spec)
- **O que o teste verifica:** conta controles `searchbox|combobox` com nome `/substitut/` no iframe (espera > 0), clica Enviar **sem** guarda (a guarda produzia vermelho-artefato, medido em 25/08) e observa a resposta do servidor: nada pode nascer (`status < 400 && instanceId` → lista vazia).
- **Por que falhou:** `Expected: > 0 / Received: 0` — não existe campo de fiscal substituto; a única escrita é recusada pelo servidor (500, mesma mensagem do H). Nada foi criado (a assertion de "nada nasceu" passou).
- **Como solucionar:** o caso é **inexequível pela interface atual**: o formulário a frio não é a entrada do processo. A correção é a mesma do H (portal publicado); o campo de substituto deve existir no portal, não neste formulário somente-leitura (que só tem `dataSolicitacao` e carimbos de resposta — confirmado por CT-DEL-01-S2, verde). Dono: **Cassi/TBC (portal)**.
- **Como garantir que fique verde:** só com o portal publicado e o teste reescrito para entrar por ele. Até lá, a leitura correta deste vermelho é "pré-condição de artefato não publicado" — o gate o classifica como `conhecido-bug` porque leva `@bug`, o que é aceitável enquanto o portal for tratado como defeito de publicação; se a Cassi declarar que o portal não existirá, o caso deve ser reclassificado como não-automatizável (e a tag removida), com registro no README.

---

### Família 4 — Plataforma: rotas, console e Voyager (4 testes)

**Causa comum.** Três sintomas distintos de plataforma: (a) páginas WCM referenciadas pelo menu
que não existem com aquele código (`widgets-wcm.md`: "Página → Layout → Slot → Widget"; um
código de página sem página publicada cai no `errorPage/404` do portal); (b) o serviço de NPS
da plataforma respondendo 403 em toda carga; (c) widget pré-Voyager carregando CSS por caminho
removido na 2.0 (`voyager-2-migracao.md`: `/style-guide/css/fluig-style-guide.min.css` → **404**;
oficial é `…-flat.min.css`).

##### CT-PLT-04-S1 (U-01) — acessar /portal/p/1/principalprocess diretamente deve abrir a página, não redirecionar para 404
- **Local:** `tests/e2e/plataforma/deep-link-spa.spec.js:19` · **Classe no gate:** conhecido-bug · **Duração:** 35s · **Defeito:** U-01 (README e mapa)
- **O que o teste verifica:** `goto` na rota e `not.toHaveURL(/errorPage\/404/)` + ausência do heading "Recurso não foi encontrado.".
- **Por que falhou:** URL final `…/portal/p/1/errorPage/404`. CT-PLT-04-S2 (verde, mesmo arquivo) prova que as outras 14 rotas navegáveis abrem por deep-link — o defeito é específico destas duas, não do roteador.
- **Como solucionar:** `principalprocess` parece ser código de página da linha 1.x; no Voyager o catálogo de processos vive em `pageprocessstart` (que abre, verde em S2). Correção: ou publicar uma página com o código `principalprocess` (redirecionando para o catálogo), ou corrigir os links internos/menu que ainda apontam para ela **(INFERIDO: qual dos dois depende de onde o link é gerado — tema customizado ou widget "Meus Apps")**. Dono: **administrador WCM da Cassi**.
- **Como garantir que fique verde:** `-g "principalprocess"`. Suíte inalterada.

##### CT-PLT-04-S1 (U-01) — acessar /portal/p/1/gestao_ferias diretamente deve abrir a página, não redirecionar para 404
- **Local:** `tests/e2e/plataforma/deep-link-spa.spec.js:19` · **Classe no gate:** conhecido-bug · **Duração:** 34s · **Defeito:** U-01
- **O que o teste verifica:** idem.
- **Por que falhou:** 404. **Ressalva deste tenant:** o mapa (09/09) mede que `gestao_ferias` **não está publicada** em `caixade213859` — *"idem, embora o menu lateral ofereça o link"*. Ou seja, aqui não é deep-link quebrado: é página ausente com link vivo no menu. O comportamento esperado do teste continua válido (o menu oferece, logo deve abrir).
- **Como solucionar:** publicar a página `gestao_ferias` (com o widget de RH correspondente) ou remover o item do menu até que exista. Dono: **administrador WCM da Cassi**.
- **Como garantir que fique verde:** `-g "gestao_ferias"`. Suíte inalterada; se a decisão for remover o link, o caso deixa de ter comportamento esperado e o teste deve ser removido com registro — não "consertado".

##### CT-PLT-01-H — deve carregar os apps e contadores sem erro de console (Home)
- **Local:** `tests/e2e/plataforma/home.spec.js:7` · **Classe no gate:** conhecido-bug · **Duração:** 11s · **Defeito:** NPS 403 (README)
- **O que o teste verifica:** Home carrega (headings "Meus Apps" e favoritos, abas RH Conecta/Gestão/Compras/Contratos) e, após `networkidle`, zero `console.error`.
- **Por que falhou:** `["Failed to load resource: the server responded with a status of 403 ()"]` — `GET /nps/api/v1/surveys?productLine=TOTVS%20Fluig`, determinístico em toda carga.
- **Como solucionar:** o NPS é recurso nativo do Voyager que depende de acesso a `https://api-fluig.totvs.app` (`voyager-2-migracao.md`, "Pré-requisitos"/"Novidades funcionais"); um 403 no endpoint do próprio tenant indica serviço não autorizado/não provisionado para esta empresa **(INFERIDO)**. Abrir chamado no TOTVS Cloud para habilitar ou desligar o NPS para o tenant — não há configuração Cassi. Dono: **TOTVS Cloud**.
- **Como garantir que fique verde:** `npx playwright test tests/e2e/plataforma/home.spec.js`. Suíte inalterada. Observação: `erros-de-console.spec.js` já cataloga o `NPS 403` por recurso (`EXCECOES_CATALOGADAS`), enquanto `home.spec.js` não — são duas guardas com critérios diferentes para o mesmo erro; é decisão registrada (o `home.spec.js` é o oráculo do NPS), não inconsistência a corrigir.

##### CT-PLT-06-S1 — Portal do Comprador (/portal/p/1/portal-do-comprador) deve carregar sem erro de console não catalogado
- **Local:** `tests/e2e/plataforma/erros-de-console.spec.js:176` · **Classe no gate:** conhecido-bug · **Duração:** 11s · **Defeito:** CT-PLT-06-S1 (README, atualizado 03/09)
- **O que o teste verifica:** abre a rota, confirma o título, espera `networkidle` e exige lista vazia de erros **não catalogados** (catálogo por recurso, com id/data/motivo; o NPS 403 está catalogado).
- **Por que falhou:** 1 erro não catalogado: `404` em `https://caixade213859.fluig.cloudtotvs.com.br/style-guide/css/fluig-style-guide.min.css`. O segundo erro do README (`console.error "Comprador não encontrado"` no `main.js` do `wg_portalCompradores`) **não apareceu nesta execução** — coerente com o Protheus intermitente (a busca do comprador só falha quando o ERP responde). O 404 é o sintoma documentado de widget pré-Voyager em plataforma 2.0.
- **Como solucionar:** no widget `wg_portalCompradores`, trocar o `<link>` para `/style-guide/css/fluig-style-guide-flat.min.css` (ou, em widget, remover o import manual — `voyager-2-migracao.md` §4: em widgets a importação de estilos da plataforma é automática) e fazer a varredura do checklist de migração (CKEDITOR, `fluigicon`). Dono: **desenvolvedor do widget (TBC)**; publicação pela Cassi.
- **Como garantir que fique verde:** `-g "Portal do Comprador"` em `erros-de-console.spec.js`. Depois de corrigido, remover a rota de `ROTAS_COM_DEFEITO_CATALOGADO` e a linha do README (é assim que a tag `@bug` sai — mecanismo já previsto no spec). Enquanto o "Comprador não encontrado" continuar intermitente, ele voltará a reprovar a rota nos dias em que o Protheus responder — isso é achado separado (conta sem matrícula de comprador na SY1, limite conhecido do CLAUDE.md), e a decisão de catalogá-lo ou não é do dono.

---

### Família 5 — APIs de notificação e favoritos (4 testes)

**Causa comum.** Contratos REST internos do portal (`/notification/api/v1`, `/ecm/api/rest/ecm/processStart`,
widget `EcmProcessFavorites`) que não seguem o próprio formato: paginação ignorada, verbo
anunciado que não existe, erro de negócio como 500 em `text/plain`, e um widget que some com dado.
Todos são **produto TOTVS** (nenhum artefato Cassi envolvido), medidos em
`artefatos-nao-processo.md` §2, §5 e §7.

##### CT-NOT-03-S1 — `GET /notification/api/v1/notifications` deve respeitar `limit` e `offset`
- **Local:** `tests/e2e/notificacoes/contratos-api-notificacao.spec.js:99` · **Classe no gate:** conhecido-bug · **Duração:** 4s · **Defeito:** CT-NOT-03-S1 (README)
- **O que o teste verifica:** `?limit=3&offset=0` deve devolver 3 itens e `offset=3` deve começar em id diferente. Pré-condição: mais de 3 notificações na conta (havia 21).
- **Por que falhou:** `Expected: 3 / Received: 21` — `limit` ignorado (era 707/654 no tenant anterior; aqui a conta é nova e tem 21). A segunda assertion (offset) nem chegou a rodar.
- **Como solucionar:** defeito da API de notificações da plataforma — chamado TOTVS com a evidência anexada pelo teste (`paginacao-de-notificacoes`). Sem workaround Cassi. Dono: **TOTVS**.
- **Como garantir que fique verde:** `-g "respeitar \`limit\`"`. Suíte inalterada. Nota: com 21 notificações a segunda assertion (`offset`) só é significativa se `limit` funcionar — o teste está desenhado nessa ordem.

##### CT-NOT-03-S1 — notificação declara `canRemove: true`, então o verbo REST de remoção deveria existir
- **Local:** `tests/e2e/notificacoes/contratos-api-notificacao.spec.js:174` · **Classe no gate:** conhecido-bug · **Duração:** 6s · **Defeito:** CT-NOT-03-S1
- **O que o teste verifica:** sondagem por método (técnica de `apis-de-workflow.md`, "Como o ambiente sinaliza existência de rota"): `DELETE /notifications/{id fictício}` não deve responder `NotFoundException`; controles: coleção responde `NotAllowedException`, `removeAlerts` existe (é POST), rota inventada responde `NotFoundException`. Nada é escrito.
- **Por que falhou:** `Expected: not "NotFoundException"` — a rota `DELETE /{id}` não existe; a remoção real é `POST /globalalertapi/api/rest/alert/removeAlerts` (outro módulo). Os três controles passaram.
- **Como solucionar:** contrato da plataforma (`canRemove` sem verbo correspondente no mesmo recurso) — chamado TOTVS. Dono: **TOTVS**.
- **Como garantir que fique verde:** `-g "canRemove"`. Suíte inalterada. Se a TOTVS publicar o `DELETE`, o id fictício `999999999` passa a devolver 404 de negócio — que o teste já aceita.

##### CT-PLT-07-S1 — favoritar o mesmo processo duas vezes deve responder erro de negócio em JSON (ou 200 idempotente), não 500 em texto puro
- **Local:** `tests/e2e/plataforma/favoritos-contrato-api.spec.js:127` · **Classe no gate:** conhecido-bug · **Duração:** 4s · **Defeito:** CT-PLT-07-S1 (README)
- **O que o teste verifica:** sob lock de exclusividade, `addFavorites` em `SIGAJURI_Contencioso` duas vezes; restaura (`removeFavorites`) **antes** das assertions; exige que a segunda resposta seja 200 com `application/json`.
- **Por que falhou:** `500` · `text/plain;charset=UTF-8` · *"Processo SIGAJURI_Contencioso já está nos seus favoritos."*. A primeira chamada e a limpeza responderam 200 (assertions anteriores passaram).
- **Como solucionar:** endpoint nativo `processStart/addFavorites` — idempotência ou erro 4xx em JSON é correção de plataforma. Dono: **TOTVS**.
- **Como garantir que fique verde:** `-g "CT-PLT-07-S1"`. Suíte inalterada; a limpeza é interna ao teste.

##### CT-PLT-05-H — favoritar um processo deve torná-lo acessível pelo widget "Processos favoritos" da Home
- **Local:** `tests/e2e/plataforma/favoritos.spec.js:53` · **Classe no gate:** conhecido-bug · **Duração:** 64s · **Defeito:** mapa, "Defeitos deste ambiente" nº 4 (favoritar faz o widget sumir) — não está na tabela do README
- **O que o teste verifica:** favorita um candidato determinístico do catálogo, confirma `data-favorite-process="true"`, abre a Home, exige a linha `[data-open-favorite-process=<id>]` no widget e navega por ela até `pageworkflowview?processID=<id>`.
- **Por que falhou:** `TimeoutError: locator.waitFor: Timeout 45000ms exceeded` esperando `getByRole('heading', { name: /Processos favoritos|Nenhum processo favorito/ })`. **Este é o único TimeoutError real do escopo — e é o defeito, não lentidão:** com um favorito gravado o widget `EcmProcessFavorites` desaparece inteiro da Home (headings passam de `["Meus Apps","Processos","Nenhum processo favorito"]` para `["Meus Apps","Processos"]`, reproduzido fora da suíte em 09/09). Sem widget não há heading, e a âncora de carga de `FavoritosPage.abrirHome()` (linhas 91–93) estoura.
- **Leitura precisa — o teste morre ANTES da sua assertion.** A assertion que descreve o defeito ("widget deveria listar `<id>`", linha 72–75) nunca roda: quem falha é a espera de carga do Page Object, com um TimeoutError sem mensagem de negócio. O veredito está correto (é o defeito), mas o relatório não se explica sozinho e o `finally` desfavorita normalmente. **Recomendação de suíte (não altera a polaridade):** em `FavoritosPage.abrirHome()` ancorar a carga num elemento que não dependa do widget (ex.: heading "Meus Apps", já usado por `home.spec.js`) e deixar a assertion da linha do favorito reprovar com a mensagem própria; opcionalmente anotar os headings presentes, como o comentário do spec já faz à mão.
- **Como solucionar (produto):** widget nativo da Home do Voyager — erro de renderização quando a lista tem itens (provavelmente exceção no template ao montar a grade; o 403 do NPS foi descartado como causa). Chamado TOTVS com a reprodução do mapa. Dono: **TOTVS**.
- **Como garantir que fique verde:** `npx playwright test tests/e2e/plataforma/favoritos.spec.js`. Além da correção do produto, aplicar a mudança de âncora acima para que um eventual novo vermelho apareça com a mensagem certa. Também vale acrescentar este defeito à tabela do README (hoje só está no mapa).

---

### Família 6 — Portais externos: Fornecedor e Comprador (4 testes)

**Causa comum.** Os portais são aplicações **fora do motor de processos** (`regras-de-negocio-compras.md`
§1: Portal do Comprador em Angular, Portal do Fornecedor com acesso por CNPJ) servidas por
páginas WCM e por aplicações Java (`java_gestao_contrato`, `cassi_rest`) registradas no tenant. A
troca de ambiente (09/09) trouxe uma **migração pela metade**: a landing do fornecedor usa
`java_gestao_contrato/rest-acesso`, a redefinição de senha ainda chama `cassi_rest`, que **não está
publicada** aqui (`500 "Could not find application key"` é `ApplicationKeyNotFoundException` do
SDK — a aplicação não está registrada para esta empresa; `plataforma.md`, "Central de componentes:
o controle é por empresa"). Os outros dois são defeitos de front-end (máscara jQuery, ordenação de
lookup) do lado TBC.

##### CT-PFN-01-S1 — deve recusar credencial inválida com mensagem genérica, sem vazar detalhe técnico
- **Local:** `tests/e2e/portais/acesso-fornecedor.spec.js:51` · **Classe no gate:** conhecido-bug · **Duração:** 8s · **Defeito:** mapa, "Defeitos deste ambiente" nº 1 (não está na tabela do README)
- **O que o teste verifica:** login com CNPJ fictício (DV válido) e senha aleatória em `POST /java_gestao_contrato/rest-acesso/request/loginV2` deve responder **401**, exibir o diálogo "Ops! Usuário ou senha inválido!" e não conter `exception|java.lang|stacktrace` nem no corpo nem na tela.
- **Por que falhou:** `Expected: 401 / Received: 500` (primeira assertion; as demais não rodaram). Corpo medido em 09/09: `java.io.IOException: Server returned HTTP response code: 401 for URL: …/api/public/ecm/dataset/datasets` — **a aplicação de login, ao consultar o dataset do Fluig, é ela própria rejeitada com 401**, ou seja, a credencial de integração de `java_gestao_contrato` para este tenant está inválida/ausente; e a tela exibe esse JSON cru ao lado do aviso amigável.
- **Como solucionar:** dois defeitos independentes. (1) **Configuração:** credencial (OAuth app/usuário integrador) que `java_gestao_contrato` usa contra `/api/public/ecm/dataset/datasets` neste tenant (`integracao-apis.md`, "API pública REST + OAuth: cadastrar OAuth App + usuário integrador"). Dono: **Cassi/TOTVS Cloud** (quem registrou a aplicação). (2) **Código:** o serviço deve mapear falha de integração para erro controlado (5xx sem `IOException` no corpo) e credencial inválida para 401; o front não deve renderizar o corpo de erro. Dono: **desenvolvedor do portal (TBC)**. Com (1) resolvido, o teste ainda reprovaria se um fornecedor inexistente continuar produzindo 500 — medir depois.
- **Como garantir que fique verde:** `-g "CT-PFN-01-S1"`. Suíte inalterada. Observação: o reCAPTCHA recusando o domínio (mapa nº 3) é outro bloqueio do mesmo portal e não está neste escopo.

##### CT-PFN-02-S1 / CT-PFN-02-S2 — a tela de redefinição de senha precisa montar para quem chega pelo link
- **Local:** `tests/e2e/portais/acesso-fornecedor.spec.js:126` · **Classe no gate:** conhecido-bug · **Duração:** 4s · **Defeito:** mapa nº 2; CT-PFN-02-S2 (README) descreve o vazamento no endpoint antigo
- **O que o teste verifica:** abre `/portal/p/1/portal_fornecedores_senha` com token fabricado e exige que a página tenha **algum** conteúdo (heading, campo ou erro). S1/S2 (recusa de token e ausência de vazamento) só são exercitáveis quando a tela montar.
- **Por que falhou:** anotação: `conteúdo da página: "" · serviço de token antigo: 500 {"message":"Could not find application key","exception":"com.fluig.sdk.exception.ApplicationKeyNotFoundException…"}`. A página chama `POST /cassi_rest/api/rest/cassi/compras/1/geratoken`; a aplicação `cassi_rest` não existe neste tenant e o front não trata a falha — renderiza vazio.
- **Como solucionar:** (1) migrar a página de redefinição para `/java_gestao_contrato/rest-acesso/request/geratoken` e `verifyAutenticateToken` (mapa, "Serviços que mudaram de caminho") — mesma correção já feita na landing; ou publicar `cassi_rest` no tenant, o que só faz sentido se ela ainda for mantida. (2) Tratar erro de `geratoken` com mensagem visível em vez de página em branco. Dono: **desenvolvedor do portal (TBC)**; publicação pela Cassi. Tipo: publicação de artefato + código de widget.
- **Como garantir que fique verde:** `-g "CT-PFN-02"`. Ao montar, este teste fica verde e os cenários S1/S2 originais devem ser **reescritos** (o spec já registra isso). Suíte: nenhuma mudança antes da correção.

##### FSWTBC-5257 — o campo CNPJ deve guardar o que foi digitado, numérico ou alfanumérico
- **Local:** `tests/e2e/portais/cadastro-publico-fornecedor.spec.js:58` · **Classe no gate:** conhecido-bug · **Duração:** 8s · **Defeito:** chamado FSWTBC-5257 / SDCASSI-563 (aberto, severidade Alta; não está na tabela do README)
- **O que o teste verifica:** em `/portal/p/1/cadastro_fornecedor` (Pessoa Jurídica), espera a máscara do `#txt_cnpj` inicializar (`rawMaskFn`), digita CNPJ numérico e alfanumérico pelo teclado e exige que o campo preserve os caracteres; o CEP é o controle de que a digitação chega ao formulário.
- **Por que falhou:** anotação: `numérico 52174208280069 → "__.___.___/____-__" · alfanumérico 12ABC34501DE35 → "__.___.___/____-__" · controle CEP → "23456-780"`. O CEP funciona; o CNPJ devolve o molde literal — a máscara nova (`AA.AAA.AAA/AAAA-00`) trata `A` como literal e não como marcador. **Nenhum** CNPJ entra, numérico incluído — pior que o chamado descreve.
- **Como solucionar:** na página de cadastro, definir a *translation* do jQuery Mask para `A` (`{ pattern: /[0-9A-Za-z]/ }`) e manter `0` numérico nos DVs; validar DV alfanumérico conforme a Receita. Dono: **desenvolvedor do portal (TBC)**, chamado já aberto. Tipo: código de widget.
- **Como garantir que fique verde:** `-g "FSWTBC-5257"`. Suíte inalterada.

##### FSWTBC-4317 — as listas de busca da Validação Inicial vêm ordenadas por alguma coluna (Portal do Comprador)
- **Local:** `tests/e2e/portais/portal-comprador.spec.js:114` · **Classe no gate:** conhecido-bug · **Duração:** 9s · **Defeito:** chamado FSWTBC-4317 (Concluído; não está na tabela do README)
- **O que o teste verifica:** as quatro lookups do painel *Buscar* (Filial, Produto, Grupo de Produto, Centro de Custo) devem estar ordenadas por **alguma** coluna não vazia (oráculo generoso), julgando a primeira página.
- **Por que falhou:** anotações: Filial `13 entradas; ordenada por: NENHUMA` (`1501, 3501…5302, 1101, 1201…`), Produto `11 entradas; NENHUMA` (`…04000014, 00000212, 00000218`); Grupo de Produto e Centro de Custo ordenados por Código. O padrão — ordem quebrando no fim da página — sugere concatenação de dois blocos sem reordenar.
- **Como solucionar:** ordenar na origem: `sortFields` no dataset (`datasets.md`: `createDataset(fields, constraints, sortFields)` — o dataset avançado precisa aplicá-los no código) ou `ORDER BY` na API REST do Protheus que alimenta a lookup; alternativamente ordenar no widget antes de renderizar. Dono: **desenvolvedor do widget `wg_portalCompradores`/dataset (TBC)** — reabrir o 4317 com a evidência das anotações. Tipo: código de widget/dataset.
- **Como garantir que fique verde:** `-g "FSWTBC-4317"`. Depende do Protheus responder (as lookups leem o ERP; sem dado o teste declara pré-condição ausente). Suíte inalterada.
- **Re-medição (10/09, 11h40–12h20):** **reproduziu o defeito** (chegou à assertion) (fatia Cotação/Comprador): _Error: lista de seleção do Portal do Comprador sem ordenação por nenhuma de suas colunas — localizar a entrada exige varredura visual item a item (FSWTBC-4317)_

---

### Família 7 — Jurídico SIGAJURI (3 testes)

**Causa comum.** Os processos `SIGAJURI_*` (categoria "TOTVS Juridico") alimentam seus combos por
datasets (`dsTipoSol`, `dsFilialSigajuri`, `dsAreaSigajuri`) que chamam um **serviço cadastrado
chamado `SIGAJURI`**, e o Fluig responde `ServiceNotFoundException: Não foi possível encontrar o
serviço ' SIGAJURI '` — o serviço **não está registrado** em Painel de Controle → Serviços
(`integracao-apis.md`, "Serviços cadastrados"; `eventos-globais.md`: `ServiceManager.getServiceInstance`).
`docs/estabilidade-do-ambiente.md` §"SIGAJURI" registra que a indisponibilidade é **contínua e
independente** do Protheus. Dois defeitos secundários agravam: o dataset devolve o texto da exceção
como **linha de dado** (em vez da linha `ERROR` do padrão TDN), e o formulário renderiza essa linha
como opção do combo.

##### CT-JUR-01-H — deveria criar a solicitação de Consultivo e vinculá-la à área informada
- **Local:** `tests/e2e/juridico/sigajuri-consultivo.spec.js:63` · **Classe no gate:** conhecido-bug · **Duração:** 6s · **Defeito:** D-JUR-01 (spec; citado no README "A tag @bug")
- **O que o teste verifica:** o combo Tipo Consulta deve ter mais de uma opção; depois preenche e envia, esperando 200. `@destrutivo` porque o envio, se aceito, cria solicitação.
- **Por que falhou:** `Expected: > 1 / Received: 1` — a única opção é o texto da exceção. O teste parou na primeira assertion; nada foi enviado nem criado.
- **Como solucionar:** (1) cadastrar o serviço `SIGAJURI` (SOAP/REST) apontando para o módulo Jurídico (SIGAJURI é módulo do Protheus) com credencial válida — Painel de Controle → Desenvolvimento → Serviços; (2) nos datasets, `try/catch` devolvendo linha `ERROR` (`datasets.md`, "Permissionamento"/"Boas práticas": nunca a exceção como registro); (3) no formulário, não popular o combo quando a resposta traz `ERROR`. Dono: **administrador Fluig da Cassi (serviço) + TOTVS Jurídico/desenvolvedor dos templates (datasets/formulário)**. Tipo: config de ambiente + código de dataset/formulário.
- **Como garantir que fique verde:** `-g "CT-JUR-01-H"`. Verde exige o serviço no ar **e** o envio aceito (200) — a `beforeStateEntry` que hoje lança "Não foi possível determinar o responsável" passa a resolver o responsável por `cdTipoSol/cdFilialNS7/cdAreaSol`. Suíte inalterada; quando ficar verde, a tag sai.

##### CT-JUR-03-H — deveria permitir montar uma minuta preenchendo Filial e Tipo Contrato
- **Local:** `tests/e2e/juridico/sigajuri-contrato.spec.js:32` · **Classe no gate:** conhecido-bug · **Duração:** 6s · **Defeito:** D-JUR-01
- **O que o teste verifica:** combos Filial e Tipo Contrato com mais de uma opção; Enviar habilitando após preenchimento. Só leitura (`bloquearEscritaNoAmbiente`).
- **Por que falhou:** `Filial: Expected: > 1 / Received: 1`. Mesmo serviço ausente. O irmão CT-JUR-03-S1 (Enviar nasce desabilitado) está verde — a trava client-side funciona.
- **Como solucionar:** idêntico ao CT-JUR-01-H.
- **Como garantir que fique verde:** `-g "CT-JUR-03-H"`; suíte inalterada.

##### CT-JUR-04-S1 — deveria oferecer campo para registrar a parte contrária em consultas contenciosas
- **Local:** `tests/e2e/juridico/sigajuri-contencioso.spec.js:196` · **Classe no gate:** conhecido-bug · **Duração:** 6s · **Defeito:** mapa, "Parte contrária inalcançável" (onda 3); não está na tabela do README
- **O que o teste verifica:** em `SIGAJURI_Contencioso` com Tipo "Liminar", o botão "Novo Envolvido" (`wdkAddChild` da tabela `tabEnvolvidos`) deve estar visível no estado padrão **ou** com "Não possui processo." marcado.
- **Por que falhou:** `Expected: true / Received: false` — o botão existe no DOM e fica oculto pela classe `sem-processo-hide` nos dois estados. Diferente dos outros dois SIGAJURI, este processo **cria solicitação normalmente** (CT-JUR-04-H verde) — o defeito é só do formulário.
- **Como solucionar:** no `displayFields`/JS do formulário do Contencioso, a regra que aplica `sem-processo-hide` deve liberar o botão de envolvidos quando o tipo é contencioso (ou sempre — parte contrária não depende de haver número de processo). `formularios.md`: visibilidade decidida em `displayFields` só vale em inclusão/modificação — conferir se a classe é aplicada por CSS estático. Dono: **TOTVS Jurídico / desenvolvedor do template do Contencioso**. Tipo: código de formulário.
- **Como garantir que fique verde:** `-g "CT-JUR-04-S1"`; suíte inalterada.
- **Re-medição (10/09, 11h40–12h20):** **reproduziu o defeito** (chegou à assertion) (fatia RH/Faturamento/Tarefas): _Error: deveria existir um caminho visível para registrar a parte contrária (botão "Novo Envolvido") em uma consulta do tipo "Liminar" — testado com o formulário no estado padrão e com "Não possui proc_

---

### Família 8 — RH e Saúde: integrações que não terminam de carregar (2 testes)

**Causa comum.** Widgets de portal que dependem de parâmetros de servidor e de jobs de
sincronização: sem eles, a tela fica num estado intermediário (spinner eterno, campos vazios) em
vez de falhar visivelmente. `datasets.md` ("Sincronização"): *"a periodicidade vive no Agendador de
tarefas"*; `armadilhas.md` ("Ambiente"): *"Sincronização ou fluxo automático parado → porta 4099 +
jobs no Agendador"*.

##### CT-BH-01-S2 — autorizar horas acima do limite deve bloquear (Banco de Horas)
- **Local:** `tests/e2e/rh/banco-horas-limite.spec.js:38` · **Classe no gate:** conhecido-bug · **Duração:** 38s · **Defeito:** U-02 (README/mapa) — causa raiz compartilhada; o sintoma específico (aba Autorização não carrega) está só no spec
- **O que o teste verifica:** em `PORTAL_AUTORIZACAO_HORAS_EXTRAS`, captura o `alert()` nativo (U-02) antes do `goto`, fecha o aviso "Protheus base offline", clica na aba Autorização e exige que "Aguarde, processando" **desapareça** dando lugar ao formulário onde o limite seria validado.
- **Por que falhou:** `expect(locator).toBeHidden()` — `Aguarde, processando` continua visível após 30s; nenhuma requisição nova sai depois da chamada inicial de dataset (medido no cabeçalho do spec). Os 38s são a carga + os 30s de espera pela condição correta — não é lentidão.
- **Como solucionar:** dois níveis: (1) **configuração** — o `alert()` *"Existem parâmetros não informado para esse servidor, informe o administrador"* (mapa U-02) diz que o widget não tem seus parâmetros de servidor preenchidos neste tenant (parâmetros do widget/página WCM — `widgets-wcm.md`, `edit.ftl`/parâmetros de instância); e a integração com o Protheus de RH precisa responder; (2) **código do widget** — falha de dataset deve encerrar o estado "processando" com mensagem, nunca girar para sempre, e não usar `alert()` nativo. Dono: **administrador Cassi (parâmetros) + desenvolvedor do widget (TBC)**. Tipo: config de ambiente + código de widget.
- **Como garantir que fique verde:** `-g "CT-BH-01-S2"`, **com o ERP respondendo** — o mapa registra o Protheus dos formulários como intermitente, então repetir isolado antes de concluir. Verde exige que o formulário de autorização apareça; o caso de "acima do limite" só poderá ser escrito então. Suíte inalterada.

##### CT-CLI-02-S1 — Clínica/Unidade deveriam identificar a clínica do diagnóstico e não nascer vazias
- **Local:** `tests/e2e/saude/questionario-clinicassi.spec.js:217` · **Classe no gate:** conhecido-bug · **Duração:** 7s · **Defeito:** achado U-14 (job `dsQDC000` parado desde 06/10/2023) — spec; não está na tabela do README
- **O que o teste verifica:** em `prc_questionario_v2`, os campos Clínica e Unidade (contexto do diagnóstico) devem vir preenchidos após a carga. Só leitura.
- **Por que falhou:** `Expected: not ""` — Clínica vazia. O spec é honesto: é **sintoma compatível** com o job parado, não prova de causa (a conta não alcança o Agendador).
- **Como solucionar:** no Painel de Controle → Gerais → Agendador de Tarefas, verificar o job `dsQDC000` (status, última execução, erro) e reativá-lo/sincronizar o dataset que alimenta clínica/unidade (`datasets.md`, "Sincronizar agora"/"Editar agendamento"). Dono: **administrador Fluig da Cassi**. Tipo: config de ambiente. **Ressalva:** o campo pode também depender de a conta `TOTVS-FS` estar vinculada a uma clínica no cadastro — hipótese de **ausência de dado** que, pelo critério do README, não receberia `@bug`. Como o spec amarra o caso ao achado documentado U-14, a tag é defensável, mas a confirmação exige o painel admin; se a causa for cadastro da conta, reclassificar como pré-condição (`faltaPreCondicao`) e retirar a tag.
- **Como garantir que fique verde:** `-g "Clínica/Unidade"`; suíte inalterada até a causa ser confirmada.

---

### Família 9 — Integração/sincronização Protheus (2 testes)

**Causa comum.** Dados do ERP chegando ao Fluig por datasets avançados (`ds_protheus_*`) e por suas
variantes de cache sincronizado (`*_Sync`). `datasets.md` ("Sincronização"): *"desligar destrói —
as tabelas… serão removidas e todos os dados sincronizados serão perdidos"*; um tenant novo que não
recebeu as tabelas de sincronização responde erro na variante `_Sync` enquanto o REST ao vivo
responde normalmente — exatamente o padrão medido.

##### CT-INT-02-S1 — variantes de cache (_Sync) dos dados de RH e vigência de compra não devem estar em erro
- **Local:** `tests/api/sincronizacao-protheus.spec.js:31` · **Classe no gate:** conhecido-bug · **Duração:** 2s · **Defeito:** achado U-12 (spec/mapa "Sincronizações em erro"); não está na tabela do README
- **O que o teste verifica:** `GET /api/public/ecm/dataset/search` em `ds_protheus_getFuncionarios_restGetAll_Sync`, `ds_protheus_getFuncoes_restGetAll_Sync` e `dsConsulta_Atv_ProcCompra_VerifVigencia_Sync` deve responder 2xx (`expect.soft` por dataset).
- **Por que falhou:** `ds_protheus_getFuncionarios_restGetAll_Sync` → 500 `{"content":"ERROR","message":{"message":"java.lang.NullPointerException"… "errorCode":"ECMException"}}` (o de Funções tem o mesmo sintoma segundo o cabeçalho; o de Vigência responde 200). Os datasets ao vivo (`ds_protheus_getFuncionarios_restGetAll`, 72.369 registros no mapa) funcionam.
- **Como solucionar:** Painel de Controle → Datasets → coluna Sincronização dos dois datasets de RH: conferir se a sincronização está ligada e o agendamento existe; "Sincronizar agora"; se as tabelas não existirem neste tenant, religar a sincronização (que recria as tabelas). Dono: **administrador Fluig da Cassi**, com TOTVS Cloud se a migração do tenant não trouxe as tabelas. Tipo: config de ambiente. **Ressalva (INFERIDO):** o mesmo `500 NullPointerException` é o que `datasets-contratos-fiscais.spec.js` calibra como "dataset **inexistente**" — logo os nomes `_Sync` podem simplesmente não estar publicados aqui, e não "em erro". As duas leituras têm a mesma correção (publicar/sincronizar), mas a mensagem do teste ("sincronização em erro") deve ser lida com essa reserva.
- **Como garantir que fique verde:** `npx playwright test tests/api/sincronizacao-protheus.spec.js`; suíte inalterada.

##### FSWTBC-648 — todo nó da árvore deve declarar a situação na folha, senão excluir desligados não é verificável
- **Local:** `tests/api/arvore-hierarquica-demitidos.spec.js:98` · **Classe no gate:** conhecido-bug · **Duração:** 2s · **Defeito:** chamado FSWTBC-648 (severidade Alta) — o spec mede que 70% dos nós vinham sem `RA_SITFOLH` em 08/09; não está na tabela do README
- **O que o teste verifica:** todo nó de `dsProtheus_getArvoreHierarquica_restGetAll` deve trazer `RA_SITFOLH` preenchido (A/F/D…); sem isso a guarda "nenhum desligado na árvore" (teste irmão, verde) é cega.
- **Por que falhou:** `1 de 1 nós não declaram RA_SITFOLH` — e o único nó é `"? ?"` (sem `RA_MAT` nem `RA_NOME`). No tenant anterior eram 27 nós (19 vazios).
- **Como solucionar:** a API REST do Protheus (ou o mapeamento no dataset) deve devolver `RA_SITFOLH` da SRA em todo nó — a decisão "vazio = ativo" não pode ficar como convenção não escrita (o spec diz isso). Dono: **desenvolvedor Protheus/Fluig da integração (TBC)**. Tipo: código de dataset/API.
- **Ressalva sobre a suíte (exceção):** um único nó `"? ?"` não é uma árvore — é um objeto sem matrícula, possivelmente uma linha de erro ou um registro vazio da conta `TOTVS-FS` (que não tem matrícula no ERP, CLAUDE.md). Nesse estado o teste irmão passa **por vazio** e este reprova por um motivo que não é o do chamado. Recomendação: `lerArvore` tratar nó sem `RA_MAT` como pré-condição ausente (`faltaPreCondicao`), para que o vermelho volte a significar "campo não declarado" e não "não há árvore para esta conta". Isso é refinamento de pré-condição, não afrouxamento da assertion.
- **Como garantir que fique verde:** `npx playwright test tests/api/arvore-hierarquica-demitidos.spec.js`, com uma conta que tenha árvore (ou massa de RH que a produza) e o ERP respondendo.

---

### Família 10 — As duas "regressões" do gate (2 testes sem `@bug`)

Os dois testes abaixo não levam `@bug`, e por isso `scripts/veredito-do-gate.mjs` os classifica
como **REGRESSÃO** — a categoria que, por contrato do gate, deveria estar sempre vazia. Os dois
defeitos já estão documentados em `docs/mapa-do-ambiente.md` ("Defeitos deste ambiente", itens 5 e
6), medidos em 09/09/2026. Pelo critério do README ("A tag `@bug` — quem recebe": *escrito contra o
esperado, reprova hoje por defeito já identificado, fica verde sozinho quando corrigido*) **os dois
qualificam para a tag**, e aplicá-la é a ação do lado da suíte — com as ressalvas abaixo. A
alternativa (deixá-los como regressão para manter a pressão sobre a publicação) é decisão do dono;
o custo dela é o gate reportar regressão de suíte em toda execução por um defeito de ambiente.

##### FSWTBC-4503 — o dataset `dsProtheus_getFiscaisPorTipoContrato` existe e responde
- **Local:** `tests/api/datasets-contratos-fiscais.spec.js:37` · **Classe no gate:** **regressao** · **Duração:** 1s · **Defeito:** mapa nº 5 ("`dsProtheus_getFiscaisPorTipoContrato` responde 500 — o dataset não está publicado, que é exatamente o defeito do FSWTBC-4503")
- **O que o teste verifica:** smoke de artefato: `GET /api/public/ecm/dataset/search?datasetId=dsProtheus_getFiscaisPorTipoContrato` deve responder 200 (lista vazia é aceitável) sem `NullPointerException` no corpo. O teste de controle do mesmo arquivo (nome inexistente → 500 NPE) **passou**, e `dsRevisaoContratos` (FSWTBC-4176) **passou** — o endpoint distingue existente de ausente nesta execução.
- **Por que falhou:** anotação: `dsProtheus_getFiscaisPorTipoContrato: 500 · {"content":"ERROR","message":{"message":"java.lang.NullPointerException"…`. Pela calibração do próprio arquivo, o dataset **não está publicado** em `caixade213859` — a mesma classe de falha que o chamado 4503 descreve (artefato faltando no deploy; o Ato de Delegação lista zero fiscais).
- **Como solucionar:** publicar o dataset no tenant (Painel de Controle → Datasets → importar, ou deploy pelo Studio — `datasets.md`, "Importar/exportar… é o caminho oficial de promoção"; `studio-e-deploy.md`). Dono: **Cassi/TBC — quem promove artefatos para este tenant**. Tipo: publicação de artefato. **Ressalva (INFERIDO):** o `500 NPE` do endpoint `search` também é o que a família 9 vê em datasets que existem mas cujo cache está quebrado; antes de afirmar "não publicado", confirmar no painel de Datasets (ou por `POST /api/public/ecm/dataset/datasets`, que devolve mensagem diferente para dataset avançado que falha ao chamar o ERP). A correção não muda: em qualquer das leituras o artefato precisa estar publicado e funcional.
- **Como garantir que fique verde:** `npx playwright test tests/api/datasets-contratos-fiscais.spec.js`. **Suíte:** aplicar `@bug` ao título (`FSWTBC-4503 @bug — …`) com comentário apontando o item 5 do mapa e a data — e **retirar a tag no dia da publicação**, porque este teste é um smoke que precisa voltar a ser regressão dura. Não há assertion a mudar.
- **Re-medição (10/09, 11h40–12h20):** Reproduziu idêntico: 500 `NullPointerException`, enquanto o controle do mesmo arquivo (nome inexistente → 500) e `dsRevisaoContratos` → 200 passaram. O dataset continua não publicado.

##### FSWTBC-5118 — toda tarefa aberta de alçada tem responsável nominal, nunca um pool
- **Local:** `tests/api/alcada-solicitacao-compras.spec.js:48` · **Classe no gate:** **regressao** · **Duração:** 56s · **Defeito:** mapa nº 6 ("Alçada atribuída a pool, não a aprovador nominal (FSWTBC-5118)")
- **O que o teste verifica:** varre até 15 páginas de `/process-management/api/v2/requests?expand=currentMovements` procurando solicitações em "Aprovação de Alçadas", inspeciona até 5 (`/tasks?expand=chosenAssignees`) e exige que toda tarefa **aberta** dessa etapa tenha `assignee` com `login` e `mail` e sem prefixo `Pool:`. Regra: `regras-de-negocio-compras.md` §8 (aprovadores sincronizados do Protheus; consenso 100% por alçada nominal) e o próprio FSWTBC-5118, apurado como não-defeito porque o Protheus devolveu `CR_USER` e o Fluig atribuiu à pessoa. Os 56s são a varredura paginada — não é defeito.
- **Por que falhou:** anotação: `95437: abertas=[Grupo de Compras - Validação das Alçadas de Valores da Req. de Compras (SEM login/mail)] escolhidos=[Pool:Group:G.P.Requisicao_de_Compras_Validacao_Alcadas]`. Uma única instância em alçada aberta, atribuída ao pool do grupo. O teste enumera as duas leituras: (a) o Protheus não devolveu `CR_USER` e o mecanismo caiu no grupo — o comportamento que o FSWTBC-3957 classifica como indevido (*"amplia o público envolvido"*) e que deveria mandar a SC para Correção; (b) a atribuição individual do 5118 regrediu.
- **Como solucionar:** inspecionar a instância 95437 (`?expand=formFields` — campos de aprovador/`CR_USER`; histórico de tarefas) para decidir entre (a) e (b). Em (a), a correção é a do 3957: o mecanismo de atribuição personalizado `mc_aprovadoresPorAlcadas` (`workflow-bpm.md`, "Mecanismo de atribuição personalizado") não deve devolver o grupo como fallback; a decisão "sem aprovador → Correção" precisa de gateway/`beforeStateEntry` antes da atividade de alçada **(INFERIDO)**. Em (b), reabrir o 5118. Em ambos, o Protheus intermitente deste tenant (`ds_protheus_getMatriculaTitular_rest` → 500 `WFLYEJB0054`) é o gatilho provável de `CR_USER` nulo. Dono: **desenvolvedor do processo `wf_solicitacao_compras` (TBC)**; a instabilidade do ERP é TOTVS/Protheus. Tipo: código de evento/mecanismo de atribuição.
- **Como garantir que fique verde:** `npx playwright test tests/api/alcada-solicitacao-compras.spec.js`. Verde exige que **nenhuma** alçada aberta esteja em pool — instâncias antigas presas no grupo continuam reprovando até serem movimentadas/canceladas, então, além da correção, a massa residual (95437) precisa ser tratada. **Suíte:** aplicar `@bug` com referência ao item 6 do mapa e aos dois chamados; a assertion e o invariante ficam como estão. Ressalva: a conta `TOTVS-FS` está em todos os pools da SC, inclusive o de Validação de Alçadas (CLAUDE.md) — é por isso que ela **vê** a tarefa em pool; isso não muda o veredito, mas explica por que a suíte tem visibilidade de um estado que um usuário comum não teria.
- **Re-medição (10/09, 11h40–12h20):** Reproduziu idêntico: a mesma instância **95437** segue com a tarefa de alçada no pool `G.P.Requisicao_de_Compras_Validacao_Alcadas`. Não é oscilação.

---
