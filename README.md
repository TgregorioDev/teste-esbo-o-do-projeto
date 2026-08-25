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

Contrato é pré-condição de **leitura**: a automação não pode criá-lo, porque nasce no Protheus
por processo de negócio que esta suíte está proibida de executar. Já tudo que a automação
**preenche** (justificativa, data, tipo) vem de factory com faker, sufixo único e prefixo `QA`.

> Ao escrever teste novo: **nunca fixe o valor de um contrato numa constante**. Não há oráculo
> externo para o valor total — nem o payload nem a grade o expõem. Afirme sobre a coerência
> interna do payload (itens com quantidades diferentes não podem compartilhar o mesmo total),
> que vale para qualquer contrato.

## Cobertura — medida, não estimada

| | |
|---|---|
| Casos no catálogo (`docs/catalogo-casos.md`) | **163** |
| Casos com teste na suíte | **132** (81%) |
| Casos sem nenhum teste | **31** — cada um com motivo medido |
| Testes que **criam ou editam** registro (`@destrutivo`) | **34** — rodam na execução padrão |

**Última execução medida (25/08/2026, 15h — suíte inteira, destrutivos incluídos): 177 testes,
123 verdes, 54 vermelhos.** Dos 34 `@destrutivo`, 17 verdes e 17 vermelhos. ⚠️ **O total de
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

## Testes vermelhos por defeito real do produto

Estes reprovam **de propósito**. Estão escritos contra o comportamento esperado e o produto hoje
não o entrega. Ajustá-los para passar documentaria o defeito como se fosse regra.

| Defeito | Onde | O que se observa |
|---|---|---|
| **D-01** 🔴 | payload da SC | `targetState: 6` (marco de Início do BPMN) e `targetAssignee: consumerkeycompras` — a SC nasce presa na conta de integração e nunca chega ao Protheus |
| **D-01 (sintoma)** 🔴 | criação da SC | falha na transferência é anunciada como "iniciado com sucesso" |
| **D-02** 🔴 | payload da SC | contrato de R$ 40.560,00 vira 2 itens de R$ 40.560,00 (**R$ 81.120,00**); em contrato de 4 itens, o valor se repete nos quatro |
| **D-04** 🟠 | payload da SC | `classeOrca=133017` e `classificacao=Tecnologia` fixos em todo item e todo contrato; `campoDescritor="Sol. Compras - CASSI SEDE"` com filial de São Luís/MA |
| **D-08** 🟡 | grade de contratos | situação truncada: `Finali`, `Paralisa`, `Sol.Finali`, `Cancel.` |
| **D-11** 🟡 | modal com Protheus fora | o mesmo alerta renderiza duas vezes (cada dataset é chamado uma vez — a duplicação é de renderização) |
| **CT-ACC-04-S5** 🟡 | payload da SC | `nrContrato` de um contrato com revisão, filial e itens de outro; sem revalidação no servidor |
| **classeValor vazio** 🟠 | payload da SC | `tbprod_classeValor` em branco, com `classeOrca` e `classificacao` preenchidos ao lado — pode travar a Validação Orçamentária |
| **CT-GED-02-S1** 🔴 | upload no GED | arquivo `.exe` é **aceito e publicado sem nenhuma validação de extensão** — nenhuma mensagem de bloqueio. Achado que só apareceu quando os testes `@destrutivo` passaram a rodar |
| **CT-CMP-02-S4** 🔴 | SC sem anexo | o anexo obrigatório não é validado **nem no cliente nem no servidor**: o Enviar dispara `POST /ecm/api/rest/ecm/workflowView/send` e o servidor responde 200 com `processInstanceId` real — a SC nasce sem documento |
| **U-01** 🟠 | deep-link SPA | `/principalprocess` e `/gestao_ferias` caem em `errorPage/404` |
| **U-02** 🔴 | banco de horas | `alert()` nativo de configuração de servidor exposto ao usuário final |
| **U-11** 🟠 | qualquer página | 2 requisições por carga para `google-analytics.com` — validar com Privacidade/LGPD |
| **Vazamento `colleague`** 🔴 | `dataset/search` | com e sem constraint: **3.493** registros. O filtro é ignorado e a base de colaboradores é acessível a qualquer sessão autenticada |
| **NPS 403** 🟡 | home | `GET /nps/api/v1/surveys` → 403 em toda carga, gerando erro de console |
| **Aba Atribuir** 🔴 | gerência de compras | a tabela **nunca** renderiza dados; reclicar não resolve. Trava a etapa de atribuir comprador |

Quando cada defeito for corrigido, o teste correspondente fica verde sozinho — nenhuma alteração
no código de teste é necessária.

---

## Perguntas em aberto para a Cassi

1. **Segregação de RH.** Dos seis processos verificados, só `wf_aprovacao_ocorrencia` e
   `wf_solicitacao_ferias` bloqueiam. `wf_pagamento_horas_extras`, `wf_automacao_admissao`,
   `wf_substituicaocargos`, `GestaoDependentes` e `rh_gbeneficios_planosaude` **abrem** para um
   usuário de Compras. Parte pode ser autoatendimento por desenho. **Quais deveriam exigir grupo
   de RH?** O que sobrar é defeito de segregação.
2. **Tipo de Solicitação.** O roteiro registrava *Renovação Contratual*, *Aditivo Contratual* e
   *Nova Solicitação*. O ambiente hoje oferece só as duas primeiras. A remoção foi intencional?
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

## Backlog — os 31 casos sem teste

Lista completa, com o motivo de cada um, em [`docs/cobertura.md`](docs/cobertura.md). Agrupados:

| Motivo | Casos |
|---|---|
| **Falta usuário de RH** (matrícula ativa no Protheus **e** grupo de RH) | 11 — `CT-DEP` (3), `CT-FER` (5), `CT-SUB` (2), `CT-ADM-01-S2` |
| **Falta credencial de fornecedor** de homologação | 4 — `CT-PFN-02-H` a `CT-PFN-05-H` |
| **Ataque real, que não se executa aqui** (decisão) | 3 — força bruta, XSS, IDOR |
| **Protocolo fora do navegador** | 2 — `CT-GED-03-H/S1`, check-out por `dav4:`/WebDAV |
| **Sem caixa postal** para o token de redefinição | 2 — `CT-AUT-03-S3/S4` |
| **Processo inoperante ou dataset inativo no produto** | 4 — `CT-JUR-05-H`, `CT-OCO-01-H/S1`, `CT-FAT-03-S1` |
| **Massa inexistente na base** | 2 — `CT-ACC-03-S1` (filial órfã), `CT-ACC-06-S2` (serviço sem quantidade) |
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
