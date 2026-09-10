# Execução completa — 10/09/2026, tarde (com o ERP de volta)

| | |
|---|---|
| **Ambiente** | `https://caixade213859.fluig.cloudtotvs.com.br` · usuário `TOTVS-FS` (não-admin) |
| **Código** | `c0f008e` + a correção da fixture de ritmo |
| **Modo** | 12 fatias em primeiro plano, `--workers=3`, **os dois projetos**, destrutivos incluídos, `PAUSA_DESTRUTIVOS=60000` |
| **Portão do ERP** | passou em todas as fatias — `apiRESTProtheusCompras:SUCCESS` |
| **Resultado** | **295 testes · 148 verdes · 147 vermelhos** · 0 flaky · 0 pulados |

`autenticacao` (10 testes) foi **10/10 verde**. Os outros 285 são o escopo comparável ao
relatório da manhã.

---

## Comparação com a execução da manhã

A da manhã (10h38–11h27, 1 worker, só `e2e`) está em
`docs/execucoes/analise-falhas-2026-09-10.md`. Mesmo escopo, mesmo dia, ambiente diferente no
meio do caminho: **o serviço do ERP voltou**.

| | manhã | tarde | |
|---|---:|---:|---|
| Testes (e2e + api) | 285 | 285 | |
| **Verdes** | **125** | **138** | **+13** |
| **Vermelhos** | **160** | **147** | **−13** |
| Pré-condição ausente, sem tag | 91 | 71 | −20 |
| `@bug`/`@achado` que caíram na pré-condição | 27 | 22 | −5 |
| `@bug` que **chegou à assertion** | 40 | 45 | +5 |
| `@achado` vermelho | 1 | 1 | = |
| Sem tag, lidos como regressão | 2 | 8 | +6 |

Duas leituras que importam mais que o saldo:

**1. Menos pré-condição e mais `@bug` chegando à assertion é ganho, não perda.** Vinte cenários
que de manhã morriam antes de exercitar qualquer coisa agora chegam ao ponto onde afirmam. Cinco
deles reprovam pelo defeito que deveriam reprovar — que é o trabalho do teste.

**2. Os "8 lidos como regressão" não são 8 regressões.** Classificados um a um abaixo: três são
a mesma queda de ambiente sem declarar pré-condição, dois são a suíte, um é rede, e **dois só
existem porque o ERP voltou** — testes que agora avançam mais fundo e falham depois.

---

## Estado do ambiente no fechamento

| | manhã | tarde |
|---|---|---|
| Serviço `apiRESTProtheusCompras` | fora | **no ar** |
| Formulário da SC | faixa de erro do ERP | **monta** |
| Formulário da Cotação | faixa de erro do ERP | **monta** |
| `dsProtheus_getContratos` | 0 linhas | **20 linhas** |
| `dsProtheus_getFornecedores` | 0 linhas | **300 linhas** |
| `dsProtheus_getCompradores` | erro | **erro** (`error: "undefined"`) |
| Acompanhamento de Contratos | não publicado | **não publicado** |

O Acompanhamento de Contratos sozinho responde por **62 dos 147 vermelhos** — 42%. Nenhum deles
é da suíte nem do produto: a página não existe neste tenant.

---

## Os 8 vermelhos sem tag, classificados

| Teste | O que é | Dono |
|---|---|---|
| `acompanhamento-contratos/modais-do-contrato.spec.js` — FSWTBC-1702/4987 | timeout esperando o heading da página **não publicada**; deveria declarar pré-condição em vez de estourar | suíte |
| `compras/ciclo-cotacao.spec.js` — CT-COT | timeout esperando "Acesso Rápido" do Portal do Comprador; o canário mostra a página de pé, então é lentidão do tenant | suíte (prazo) |
| `contratos/validacoes-faturamento.spec.js` — CT-FAT-02-S3 | Page Object preso ao "Mais opções" da Central de Tarefas antiga | suíte (já apontado de manhã) |
| `api/alcada-solicitacao-compras.spec.js` — FSWTBC-5118 | `TypeError: Failed to fetch` — a rede deste ambiente caiu no meio da chamada | ambiente |
| `api/datasets-contratos-fiscais.spec.js` — FSWTBC-4503 | `dsProtheus_getFiscaisPorTipoContrato` responde 500: não publicado | ambiente |
| `compras/validacoes-solicitacao-compras.spec.js` — FSWTBC-4952 | o formulário critica abaixo de **R$ 1,00**; o chamado diz **R$ 0,10** | decisão de regra |
| `rh/banco-horas.spec.js` — CT-BH-01-S2 | **novo, e explicado**: o teste afirma que a tela avisa quando o Protheus está indisponível. Com a integração de volta, não há aviso a observar. A própria mensagem do teste antecipava isso | ambiente (o caso perdeu o alvo) |
| `portais/alcadas-orcamentaria.spec.js` — FSWTBC-622/4821 `@destrutivo` | **novo, e é progresso**: com o formulário da SC funcionando, o teste passou a criar a SC e chegar à Validação do Gestor — e falha ao submeter a aprovação. De manhã ele nem chegava lá | investigar |

Os dois últimos são a evidência mais direta de que o ambiente mudou: **de manhã esses cenários
paravam antes; à tarde eles avançam e falham mais fundo.**

---

## Destrutivos

50 destrutivos rodaram, **com pausa de 60 s após cada um** (`PAUSA_DESTRUTIVOS`, fixture
`ritmoDeEscrita` em `fixtures/fixtures.js`). Saldo: 15 verdes, 35 vermelhos — a maioria dos
vermelhos é pré-condição de Acompanhamento de Contratos e `@bug`.

A pausa é espera por **tempo**, e isso é deliberado: não sincroniza nada, é vazão de escrita — a
única exceção que este projeto admite, e a mesma razão pela qual `semear-massa.mjs` espaça as
criações.

---

## A massa semeada, no fim do dia

As 8 SCs (`96363 96369 96370 96376 96377 96378 96379 96380`) estão **ABERTAS em
*7 Validação do Gestor***. Foram criadas de manhã com o ERP fora, caíram em *236 Correção*, e
`scripts/empurrar-massa.mjs` as reenviou quando o serviço voltou — as oito atravessaram *Grava SC
e Anexos*.

Para chegarem à *257 Gerência de Compras* faltam três validações humanas (Gestor →
Orçamentária → Comprador), todas em pools que esta conta tem.
