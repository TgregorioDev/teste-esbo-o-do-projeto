# Estado do quality gate — medições

Números **medidos**, não estimados. Relatório JSON do Playwright, ambiente real.
Última atualização: 24/08/2026.

## Passada completa

`npx playwright test --workers=4` · 97 testes · 3,8 min

| | |
|---|---|
| Esperados (verdes) | **79** |
| Inesperados (vermelhos) | **18** |
| Flaky | **0** |

Os 18 vermelhos são testes escritos contra o comportamento esperado, que reprovam porque o
produto não o entrega — ver a tabela de defeitos no README. Um deles (`CT-INT-01-H`) não é
defeito de produto: é a integração com o Protheus devolvendo vazio, ver abaixo.

## Determinismo

`npx playwright test --repeat-each=3 --workers=4` · 291 execuções · 15,2 min

| | |
|---|---|
| Esperados | 212 |
| Inesperados | 79 |
| Testes vermelhos distintos | 36 |

Distribuição dos 36:

| Repetições em que falhou | Testes | Leitura |
|---|---|---|
| **3 de 3** | **17** | determinístico — defeito real, sempre pelo mesmo motivo |
| 2 de 3 | 9 | intermitente |
| 1 de 3 | 10 | intermitente |

### As 19 intermitências são do ambiente, não do código

Todas caem em specs que dependem da grade de contratos vinda do Protheus:

| Spec | Intermitentes |
|---|---|
| `acompanhamento-contratos/modal-solicitacao-compra` | 5 |
| `acompanhamento-contratos/validacoes-solicitacao` | 4 |
| `acompanhamento-contratos/payload-solicitacao` | 3 |
| `acompanhamento-contratos/grade-contratos` | 2 |
| `acompanhamento-contratos/indisponibilidade-protheus` | 2 |
| `acompanhamento-contratos/acesso-portal` | 1 |
| `acompanhamento-contratos/erros-no-start` | 1 |
| `seguranca/integracao-protheus-grade-contratos` | 1 |

**Nenhuma** intermitência em autenticação, plataforma, documentos, tarefas, RH, portais ou
segurança — 64 testes que rodaram estáveis nas 3 repetições.

Evidência de que a variável é o ambiente, medida em sequência no mesmo dia:

1. grade com **840 contratos** (estado normal);
2. datasets `dsProtheus_getContratosxFornecedores_restGet` e `dsProtheus_getTipoContratos_restGetAll`
   respondendo **HTTP 200 com 0 colunas e 0 registros**, grade em "Mostrando 0 até 0 de 0 registros"
   (3 amostras seguidas);
3. grade **não carregando**: 5 de 5 amostras estouraram timeout de 60s, com o edge devolvendo 200.

## Determinismo das áreas independentes do Protheus — CERTIFICADO

`--repeat-each=3` sobre auth, plataforma, documentos, tarefas, RH, portais, compras, contratos,
API e LGPD · **189 execuções (63 testes × 3)** · 5,0 min

| | |
|---|---|
| Esperados | 168 |
| Inesperados | 21 |
| **Flaky** | **0** |

Os 21 inesperados são **7 testes falhando 3 de 3** — determinismo perfeito, e todos documentando
defeito real: vazamento do `colleague`, U-01 (duas rotas), NPS 403 na Home, aba *Atribuir* que não
renderiza, U-02 no Banco de Horas e a telemetria ao Google Analytics.

**Nenhuma intermitência.** Isto confirma, por medição independente, que a instabilidade observada
na rodada completa estava isolada na fatia dependente do Protheus.

> Estes 63 testes estão **certificados pelo gate**: executados, determinísticos em 3 repetições,
> com falha real gerando FAIL.

## Conclusão

**O gate está fechado para 63 dos 97 testes.** Seguem pendentes os ~34 dependentes da grade de
contratos, e o motivo é ambiente, não código. Falta uma única coisa, e não envolve mudar código:

> repetir `npx playwright test --repeat-each=3 --workers=4` **na fatia de contratos**, com o
> ambiente estável — as demais áreas já estão certificadas.

Critério para considerar o ambiente pronto: a grade sustentar os ~840 contratos em cinco
amostras seguidas. Se, com ambiente estável, alguma intermitência persistir, aí é defeito de
teste e deve ser corrigido pela causa raiz — nunca aumentando timeout nem repetindo até passar.

## Alerta de produto, independente da suíte

O Portal de Acompanhamento de Contratos oscilou, no mesmo dia, entre 840 contratos, zero
contratos e não carregar. Para o usuário final isso é **indisponibilidade intermitente do fluxo
de abertura de Solicitação de Compra a partir de contrato**. Merece chamado próprio.
