# Suíte E2E — TOTVS Fluig Cassi

Automação de testes end-to-end do **Portal de Acompanhamento de Contratos** e da abertura da
Solicitação de Compra a partir de um contrato — o ponto de entrada que o time pediu para cobrir.

Stack: **Playwright + JavaScript + Node**, verificação estática por `// @ts-check` + JSDoc + `checkJs`.

---

## Como rodar

```bash
npm ci
npx playwright install chromium

cp .env.example .env.test     # preencher; NUNCA commitar
npm test                      # suíte completa
npm run test:auth             # só autenticação
npm run test:e2e              # só os fluxos do portal
npm run typecheck             # verificação estática
npm run report                # abre o relatório HTML da última execução
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
components/   componentes reaproveitados entre telas (modal da Solicitação de Compra)
utils/        interceptação de dataset do Fluig e trava de escrita no ambiente
tests/e2e/    specs, agrupadas por funcionalidade
```

`globalSetup` autentica uma vez e grava o `storageState`; o projeto `autenticacao` roda **sem** ele,
para validar o login de verdade.

---

## Massa de teste

Os contratos usados como pré-condição **não são versionados** — são identificadores do cliente e
vivem em `.env.test`:

| Variável | Papel |
|---|---|
| `CONTRATO_LIMPO` | contrato vigente com 2 itens — caminho feliz |
| `CONTRATO_MEDIO` | contrato vigente com 4 itens |
| `CONTRATO_SERVICO` | contrato de serviço sem quantidade (exercita o fallback do widget) |
| `CONTRATO_VOLUMOSO` | contrato de 177 itens — **declarado para não ser usado** (ver D-03) |

Contrato é pré-condição de leitura. Tudo que a automação **preenche** (justificativa, data, tipo)
vem de `factories/solicitacao-compra.js`, com faker + sufixo único + prefixo `QA`.

---

## Trava de escrita no ambiente do cliente

O ambiente sob teste é o Fluig real da Cassi, integrado ao Protheus. **Uma Solicitação de Compra
criada por engano não tem exclusão disponível** — fica na base do cliente para sempre.

Por isso `utils/guarda-criacao.js` intercepta e bloqueia toda escrita em `process-management`,
contando as tentativas. Ela cumpre dois papéis: impede que um seletor quebrado escreva no
ambiente, e transforma "o sistema não deve criar a solicitação" de presunção em assertion.

Cenários que **precisam** criar registro real ficam marcados `@destrutivo` e estão fora da
execução padrão (`grepInvert` no config). Não é skip — é composição de suíte:

```bash
INCLUIR_DESTRUTIVOS=1 npx playwright test --grep @destrutivo
```

Hoje **não há nenhum cenário destrutivo implementado** — ver *Backlog* abaixo.

---

## O que a suíte cobre

| Arquivo | Casos | Cobre |
|---|---|---|
| `auth/login.spec.js` | CT-AUT-01, CT-AUT-02 | credencial válida, senha errada, usuário inexistente, campos em branco |
| `acompanhamento-contratos/acesso-portal.spec.js` | CT-ACC-01 | acesso autorizado, colunas da grade, acesso negado, falha ao validar permissão, acesso anônimo |
| `acompanhamento-contratos/grade-contratos.spec.js` | CT-ACC-02 | ações da linha, filtro por contrato, legibilidade da situação |
| `acompanhamento-contratos/modal-solicitacao-compra.spec.js` | CT-ACC-03-H | modal vinculado ao contrato, campo protegido, campos em branco, tipos oferecidos, fechar sem criar |
| `acompanhamento-contratos/validacoes-solicitacao.spec.js` | CT-ACC-04-S1 | as quatro combinações de campo obrigatório faltante |
| `acompanhamento-contratos/indisponibilidade-protheus.spec.js` | CT-ACC-03-S2, CT-ACC-04-S2 | aviso de indisponibilidade, duplicidade do aviso, bloqueio de envio sem itens |

Cobertura por categoria: caminho feliz, negativo, validação, autorização, autenticação e
tratamento de erro.

---

## Testes vermelhos por defeito real do produto

Dois testes **reprovam de propósito**. Eles estão escritos contra o comportamento esperado, e o
produto hoje não o entrega. Ajustá-los para passar documentaria o defeito como se fosse regra.

| Teste | Defeito | O que se observa |
|---|---|---|
| `deve exibir a situação do contrato por extenso, sem truncar` | **D-08** | a grade corta o rótulo: `Finali`, `Paralisa`, `Sol.Finali`, `Cancel.` — sem reticências e sem dica ao passar o mouse |
| `deve apresentar o erro de indisponibilidade uma única vez` | **D-11** | o mesmo erro é renderizado **duas vezes**. Medição em campo: cada dataset é chamado **uma** vez, então a duplicação está na renderização do aviso, não em requisição repetida |

Quando esses defeitos forem corrigidos, os testes ficam verdes sozinhos — nenhuma alteração de
código de teste é necessária.

---

## Divergências em aberto (precisam de confirmação do time)

1. **Tipo de Solicitação perdeu uma opção.** O roteiro de 20/08 registrava *Renovação Contratual*,
   *Aditivo Contratual* e *Nova Solicitação*. O ambiente hoje oferece apenas as duas primeiras.
   Enquanto não se confirma se a remoção foi intencional, a assertion cobre o que é regra estável
   (o placeholder e os dois tipos contratuais) em vez de fixar a lista inteira.

2. **Confirmar sem itens não dá retorno ao usuário.** Com o Protheus indisponível, o clique em
   *Confirmar* **não envia nada** (comprovado pela trava de escrita: zero tentativas) — mas também
   não exibe a mensagem *"Nenhum item de contrato foi carregado"* que o roteiro previa. O bloqueio,
   que é o essencial, acontece; o aviso ao usuário está em aberto.

---

## Decisões técnicas que valem registro

**Locale fixado em `pt-BR`.** A tela de login do Fluig é traduzida pelo locale do navegador:
em `pt-BR` os campos são *"Digite seu login" / "Acessar"*, em `en-US` são *"Enter your login" /
"Access"*. Sem fixar o locale, a suíte quebraria conforme a máquina que a executasse.

**Autenticação não se valida por URL.** O Fluig serve a tela de login na **mesma URL da home**
(`/portal/p/1/home`). O critério de sessão é o título do documento somado à ausência do formulário.

**Os ícones da coluna "Ação" não têm nome acessível.** São âncoras vazias, sem texto e sem
`aria-label`; `getByRole('link', { name })` não os resolve. O único gancho estável hoje é o
atributo `title`, e é o que a suíte usa.
> 📌 **Recomendação ao time de desenvolvimento:** adicionar `aria-label` (ou `data-testid`) aos três
> ícones. Além de destravar o locator preferencial, é ganho de acessibilidade real — hoje um leitor
> de tela não anuncia essas ações.

**O campo de data é `<input type="date">`.** Só aceita ISO (`aaaa-mm-dd`); preencher em `dd/mm/aaaa`
devolve *Malformed value*. A factory já entrega no formato correto.

**Interceptação de dataset.** No Fluig, todo dataset é executado pelo **mesmo** endpoint
(`POST /api/public/ecm/dataset/datasets`), com o nome no corpo. Não dá para interceptar por URL —
`utils/dataset-fluig.js` lê o corpo da requisição para decidir.

**Exceção justificada na varredura de anti-patterns.** `utils/dataset-fluig.js` tem um `catch` sem
rethrow: ele apenas classifica se o corpo da requisição é JSON de dataset. Corpo não-JSON não é
chamada de dataset e segue o fluxo normal. Não há assertion envolvida — nenhum erro de teste é
engolido ali.

---

## Backlog — identificado e não automatizado

| Cenário | Por que não entrou |
|---|---|
| `CT-ACC-05-H` criação da SC e `CT-E2E-01-H` (defeito **D-01**) | criam registro real e sem exclusão na base do cliente. Exigem autorização explícita e uma política de higienização acordada antes de rodarem |
| `CT-ACC-06-S1/S2` valor multiplicado (**D-02**) | o defeito só é observável na SC já criada — mesmo bloqueio acima |
| `CT-ACC-04-S3` duplo clique e `CT-E2E-12-S1` SC duplicada (**D-12**) | idem |
| `CT-ACC-03-S3` contrato de 177 itens (**D-03**) | congela o navegador por completo; a aba não fecha e não navega. Rodar em suíte trava o worker |
| `CT-E2E-03` a `CT-E2E-10` | dependem de cadastro no Protheus (aprovador de alçada na **AL/DHL** e comprador na **SY1**) que o usuário da automação não possui |
| Camada de API | os datasets do portal são chamados por um endpoint único autenticado por sessão. Vale cobrir contrato de dados dos datasets críticos numa etapa seguinte, com os payloads reais já mapeados em `config/ambiente.js` |

---

## CI

`.github/workflows/e2e.yml` roda a suíte em push e pull request, e publica o relatório HTML e o
JUnit como artefato. Os segredos vêm de *repository secrets* — nunca do repositório.
