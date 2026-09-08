# Automação existente × casos dos chamados — relatório de cobertura

Comparação dos **518 casos de teste do Fluig**, escritos a partir dos chamados SDCASSI e
SUPORTE CASSI, contra os **198 testes automatizados** da suíte Playwright (81 arquivos de
spec, 658 KB de código). Medido em 08/09/2026.

A comparação foi feita lendo o **corpo de cada teste candidato** e, quando a asserção estava
num Page Object ou helper, abrindo o método. Título de teste não foi aceito como evidência:
na prática ele costuma prometer mais do que o `expect` afirma.

---

## Resultado

| Classificação | Casos | |
|---|---:|---|
| **COBERTO** | 4 | 0% — existe teste que exercita o mesmo cenário **e** afirma o mesmo comportamento |
| **APRIMORAR** | 157 | 30% — existe teste no mesmo fluxo, mas ele não afirma o que o chamado evidencia |
| **IMPLEMENTAR** | 357 | 68% — nenhum teste toca o cenário |
| Total | 518 | |

### Por módulo

| Módulo | Casos | Coberto | Aprimorar | Implementar |
|---|---:|---:|---:|---:|
| Portal do Comprador | 147 | 3 | 20 | 124 |
| Solicitacao de Compras | 106 | 0 | 54 | 52 |
| Faturamento de Contratos | 104 | 0 | 28 | 76 |
| Contratos | 61 | 1 | 25 | 35 |
| Portal do Fornecedor | 24 | 0 | 2 | 22 |
| Parecer Tecnico | 17 | 0 | 7 | 10 |
| Consultas e Logs | 15 | 0 | 6 | 9 |
| Gestao de Equipes | 13 | 0 | 1 | 12 |
| Gerencia de Compras | 9 | 0 | 9 | 0 |
| RH e Administrativos | 8 | 0 | 1 | 7 |
| Corretagens | 8 | 0 | 0 | 8 |
| Plataforma | 6 | 0 | 4 | 2 |

---

## Lido do lado da suíte

- **34 dos 81 arquivos de spec** são citados por algum caso de chamado.
- **47 specs não são tocados** por caso nenhum — cobrem áreas que os chamados não reclamam.
- Os 357 casos a implementar se concentram em **75 arquivos-alvo**,
  a maioria novos.

### Onde aprimorar rende mais (casos por spec)

| Spec | Casos que pedem reforço |
|---|---:|
| `tests/e2e/compras/ciclo-solicitacao-compras.spec.js` | 18 |
| `tests/e2e/contratos/ciclo-faturamento.spec.js` | 16 |
| `tests/e2e/acompanhamento-contratos/grade-contratos.spec.js` | 13 |
| `tests/e2e/portais/alcadas-orcamentaria.spec.js` | 13 |
| `tests/e2e/portais/ciclo-comprador.spec.js` | 13 |
| `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js` | 11 |
| `tests/e2e/contratos/validacoes-faturamento.spec.js` | 10 |
| `tests/e2e/compras/validacoes-solicitacao-compras.spec.js` | 8 |
| `tests/e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js` | 7 |
| `tests/e2e/portais/gerencia-compras.spec.js` | 6 |
| `tests/e2e/plataforma/erros-de-console.spec.js` | 4 |
| `tests/e2e/acompanhamento-contratos/acesso-portal.spec.js` | 4 |

### Maiores destinos de teste novo

| Arquivo proposto | Casos |
|---|---:|
| `tests/e2e/contratos/fila-e-correcao-faturamento.spec.js` | 28 |
| `tests/e2e/portais/avaliacao-propostas.spec.js` | 23 |
| `tests/e2e/compras/aprovacao-alcadas.spec.js` | 21 |
| `tests/e2e/portais/definir-vencedor.spec.js` | 18 |
| `tests/e2e/compras/integracao-erp-cotacao.spec.js` | 17 |
| `tests/e2e/portais/controle-cotacoes.spec.js` | 17 |
| `tests/e2e/contratos/realizar-medicao-itens.spec.js` | 16 |
| `tests/e2e/contratos/rateio-medicao.spec.js` | 14 |
| `tests/e2e/portais/validacao-inicial.spec.js` | 12 |
| `tests/e2e/contratos/medicao-automatica.spec.js` | 12 |
| `tests/e2e/portais/centralizacao-compras.spec.js` | 11 |
| `tests/e2e/portais/proposta-fornecedor.spec.js` | 10 |
| `tests/e2e/compras/pos-alcada-pedido.spec.js` | 10 |

---

## O achado principal não é a cobertura — é a qualidade das asserções

A comparação obrigou a leitura do corpo de 198 testes, e isso expôs um problema independente dos
chamados: **há testes que carregam ID do catálogo no título — e portanto contam como cobertura em
`docs/cobertura.md` — sem afirmar a regra que o título promete.**

Os casos confirmados, com arquivo e linha de raciocínio:

| Teste | O que o título promete | O que o corpo afirma |
|---|---|---|
| `aprovacoes-solicitacao-compras :: Validação Orçamentária alcançável por pool` | alcance da etapa | `expect(true).toBe(true)` |
| `aprovacoes-solicitacao-compras :: pool de Validação dos Compradores` | assumir e movimentar | `expect(true).toBe(true)` quando não há grupo |
| `aprovacoes-solicitacao-compras :: sinalizar quando não há aprovador habilitado` | regra da alçada | `mensagemAlcada \|\| atividadeMudou` — qualquer avanço passa |
| `validacoes-faturamento :: CT-FAT-02-S1 / S4` | quantidade acima do saldo; rateio ≠ 100% | campo oculto na etapa *Início* |
| `validacoes-faturamento :: CT-FAT-02-S3` | regra de medição | lista grupos do pool e afirma que nenhum casa com `/fiscal|cse/` |
| `ciclo-cotacao` e `negociacao-proposta` (8 IDs do catálogo) | ciclo de cotação e negociação | `not.toBeEditable()` num shell fora de contexto |
| `ciclo-comprador :: CT-E2E-08-H / 09-H` | colunas da Avaliação de Propostas | cabeçalhos + `possuiDados() === false` |
| `grade-contratos :: CT-ACC-02-H` | Planilha, Solicitação de Compra e Informações | três `toBeVisible`; nenhum modal é aberto |
| `integracao-protheus-grade-contratos :: CT-INT-01-H` | integridade da grade vinda do ERP | `values.length > 0` |

Dois padrões merecem nome:

**Congelar a ausência de dado como esperado.** `possuiDados() === false` e `toHaveCount(0)` de
"Assumir tarefa" ficam verdes porque a fila do comprador está vazia para a conta de QA. No dia em
que houver dado, o teste reprova por estar certo.

**Ler defeito como ambiente.** `CT-ACC-09-H` reclassifica mais de 150 s em *Grava SC e Anexos* como
`PRÉ-CONDIÇÃO AUSENTE`. Os chamados FSWTBC-4156 e 4828 fixam o SLA em 2 minutos — e foram medidos
3 min 12 s em 04/09. O gate lê como instabilidade o que é o defeito.

### Uma contradição interna da suíte

`portal-comprador :: deve exigir delegação em "Atuar como"` afirma que o combo tem mais de uma
opção. `ciclo-cotacao` e `negociacao-proposta` mediram o mesmo `comboAtuarComo` com contagem **zero**,
na mesma tela, no mesmo dia. **Os dois não podem estar verdes ao mesmo tempo** — um está passando
por acidente.

### Um teste que ficará vermelho pelo motivo errado

O FSWTBC-5030, concluído em 19/08, define que a SC de **Aditivo Contratual deve** parar em
`6 - Início` com o solicitante. `ciclo-gestor :: CT-E2E-01-H` e o D-01 de `payload-solicitacao`
afirmam o contrário (`targetState != 6`). Quando a correção chegar ao ambiente, esses testes
reprovam por estarem desatualizados, não por regressão. A assertion de D-01 precisa virar
"não iniciada por `consumerkeycompras`".

---

## Por que só 4 casos ficaram COBERTO

Não é rigor excessivo de leitura. É uma consequência estrutural, e ela se repete em três módulos:

- **Faturamento de Contratos** — os três specs que tocam `wf_faturamento_contratos` param todos na
  atividade *Início*. Tudo que os chamados discutem (quantidade, desconto, rateio, planilha,
  Gravar/Encerrar, fila 182, Correção 117) vive no painel que só abre em *Realizar Medição do
  Contrato*, sob `controlField === 'GRAVA_MED'`. A conta de automação não pertence a nenhum grupo
  de Fiscal/CSE — e há um teste na suíte que prova isso ao vivo.
- **Portal do Comprador** — nenhum teste chega a uma cotação, proposta ou negociação real. As três
  filas vêm vazias para `TOTVS-FS`, que não tem matrícula de comprador na SY1.
- **Solicitação de Compras** — a SC própria chega até *Validação Orçamentária* e para. Alçada,
  integração 177/287, retorno 317 e disparo de e-mails ficam fora de alcance.

Ou seja: **a suíte cobre bem o que a conta de QA alcança, e os chamados são majoritariamente sobre
o que ela não alcança.** Isso não é falha de quem escreveu a suíte — é o mesmo teto de perfil que
limitou a verificação em tela dos 518 casos.

---

## O que fazer primeiro

**1. Corrigir as asserções vazias antes de escrever teste novo.** Os `expect(true).toBe(true)` e as
asserções em OU estão contando como cobertura hoje. Enquanto existirem, qualquer número de
cobertura deste projeto está inflado. É a mudança mais barata e a de maior efeito sobre a confiança
no gate.

**2. Os quatro testes que nascem hoje, sem perfil nenhum, só com leitura:**

- **FSWTBC-648** (Alta) — `dsProtheus_getArvoreHierarquica_restGetAll` não deve retornar nó com
  `RA_SITFOLH='D'`. Aprovação roteada para pessoa desligada. O tratamento de `'D'` está comentado
  no front, então, se a exclusão existe, ela vive só no dataset — que é o que o teste mede.
- **FSWTBC-4816** — nenhuma instância de Faturamento com tarefa `NOT_COMPLETED` em *Aguarda
  processamento Fila Protheus* por mais de 30 minutos. Hoje há três presas há 22–25 dias: o teste
  nasce vermelho, apontando defeito real.
- **FSWTBC-630** — na Gestão de Equipes o erro aparece em modal titulado **"Sucesso:"** com
  `type:"danger"`, e a página fica em branco após o OK. Reproduz em segundos com a conta de QA.
- **FSWTBC-4178** — guarda de desempenho contando `POST dataset/datasets` por rota; o defeito de
  400+ requisições nunca foi corrigido.

**3. Abrir os modais do Acompanhamento de Contratos.** Um único spec —
`grade-contratos.spec.js` — é o gargalo de **13 casos**, porque hoje afirma apenas que os três
ícones estão visíveis, sem nunca abrir *Planilha*, *Informações do Contrato* ou *Detalhes da
Planilha*. É trabalho de leitura, sem escrita e sem perfil.

**4. Só então pedir os perfis.** A maior parte dos 357 casos a implementar depende de matrícula de
comprador, perfil de gestor/alçada, fiscal ou credencial de fornecedor — a mesma lista que limita a
execução manual.

---

## Limites deste relatório

- A classificação foi feita por leitura de código, não por execução. Nenhum teste foi rodado nem
  alterado nesta análise.
- Duas classificações são de fronteira e ficaram como APRIMORAR por decisão declarada do analista:
  **FSWTBC-651** (o teste de deep-link é smoke de rota, discutivelmente não "toca" o cenário de
  desempenho) e **FSWTBC-2388** (só o ramo negativo é alcançável sem `C8_XPARTEC=S` no Protheus).
- A separação entre "implementável hoje" e "bloqueado por perfil" nos 357 casos não foi calculada
  automaticamente com confiança suficiente para virar número — as listas acima são curadas caso a
  caso. Tratar o total como estimativa, não como medição.
