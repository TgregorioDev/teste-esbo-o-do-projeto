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
npm test                      # suíte completa
npm run test:auth             # só autenticação
npm run typecheck             # verificação estática
npm run report                # relatório HTML da última execução
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

## Cobertura

| Área | Specs | Cobre |
|---|---|---|
| **Autenticação** (`auth/`) | 3 | login válido/inválido, usuário inexistente, campos vazios, recuperação de senha, token adulterado, troca de idioma, sessão inválida, logout |
| **Plataforma** (`plataforma/`) | 5 | home e contadores, catálogo de processos e busca, início permitido, bloqueio por permissão, deep-link de rota SPA |
| **Contratos — portal** (`acompanhamento-contratos/`) | 7 | acesso e negação, colunas e ações da grade, filtro, modal da SC, campos obrigatórios, indisponibilidade do Protheus, **payload da criação** e erros no start |
| **Compras** (`compras/`) | 3 | abertura da SC clássica e da Cotação, campos obrigatórios, rateio abaixo de 100% |
| **Contratos — processos** (`contratos/`) | 3 | faturamento, cadastro de fornecedor, delegação de fiscais |
| **Documentos** (`documentos/`) | 1 | árvore de pastas, paginação, ações da barra, navegação e retorno |
| **Tarefas** (`tarefas/`) | 2 | coerência dos contadores, tarefa atrasada, minhas solicitações e filtro |
| **RH** (`rh/`) | 2 | banco de horas, indisponibilidade do Protheus, segregação de início dos processos de RH |
| **Portais** (`portais/`) | 4 | gerência de compras, portal do comprador, tracker, portal do fornecedor e controle de acesso |
| **Segurança e integração** (`seguranca/`, `api/`) | 4 | vazamento por constraint, acesso admin negado, telemetria externa, datasets do Protheus e indisponibilidade |

Categorias exercitadas: caminho feliz, negativo, validação, borda, autenticação, autorização,
tratamento de erro e integração.

---

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

## Regra inegociável: o ambiente é do cliente

Registro criado no Fluig/Protheus **não tem exclusão disponível**. Por isso:

- `utils/guarda-criacao.js` bloqueia toda escrita em `process-management` e conta as tentativas.
  "O sistema não deve criar X" vira assertion: `expect(guarda.tentativas()).toBe(0)`.
- `utils/captura-payload.js` intercepta a criação da SC, **lê o corpo e aborta** — o que permite
  provar D-01, D-02, D-04 e a incoerência de contrato **sem gravar nada**.
- Cenário que precise escrever de fato é marcado `@destrutivo` e fica fora da execução padrão:
  `INCLUIR_DESTRUTIVOS=1 npx playwright test --grep @destrutivo`. Hoje não há nenhum.

**Nenhuma Solicitação de Compra foi criada durante o desenvolvimento desta suíte.**

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

## Backlog — identificado e não automatizado

| Motivo | Casos |
|---|---|
| **Escreve no ambiente** | GED: upload, check-out/in, aprovação, lixeira · Central de Tarefas: assumir do pool, concorrência · Gerência de Compras: atribuir comprador · Portal do Comprador: validar, avaliar, definir vencedor · criação real de SC ponta a ponta |
| **Exige cadastro no Protheus** | `CT-E2E-03` a `CT-E2E-10` — aprovador de alçada (**AL/DHL**) e comprador (**SY1**), que o usuário da automação não possui |
| **Exige perfil administrativo** | `CT-SEG-02/03/04` (admins, credencial em dataset, auditoria de SQL) · `CT-INT-02` (disparar sincronização) |
| **Exige credencial de fornecedor** | `CT-PFN-01-S1/S2`, `CT-PFN-02` a `CT-PFN-05` |
| **Seria ataque real** | `CT-PFN-06` (XSS no chat), `CT-PFN-07` (IDOR) — não se executa contra ambiente de cliente |
| **Não alcançável por essa rota** | `CT-FAT-02-S1/S4` (cadeia de zooms contra dado real, sem resultado determinístico) · `CT-COT-02-S2/S3` (campos `readonly`, sem busca de fornecedor) · `CT-CMP-02-S2` acima de 100% (o campo limita a 100 no blur) |
| **Destrutivo para a execução** | `CT-ACC-03-S3` — contrato de 177 itens congela o navegador (D-03); rodar em suíte trava o worker |
| **Removido por não paralelizar** | `CT-PLT-05-H` favoritos |

---

## CI

`.github/workflows/e2e.yml` roda a suíte em push e pull request e publica o relatório HTML e o
JUnit como artefato. Segredos vêm de *repository secrets* — nunca do repositório.
