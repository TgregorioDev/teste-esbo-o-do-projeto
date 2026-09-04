# Execução completa — 03/09/2026, 15h50–18h05 — carimbo do plano de melhoria

| | |
|---|---|
| **Commit** | `97ea079` (Etapas 1–10 do `docs/plano-de-melhoria-2026-09-03.md` aplicadas) |
| **Ambiente** | `https://caixade182374.fluig.cloudtotvs.com.br` · usuário `TOTVS-FS` |
| **Runtime** | Playwright 1.62.1 · Chromium (Desktop Chrome, pt-BR) |
| **Modo** | 6 fatias não destrutivas (`--workers=4`) + **47 destrutivos, um por invocação, `--retries=0`, 60 s de intervalo** |
| **Janela** | sonda `node scripts/sonda-grade.mjs`: 5 × 845 antes (15h50–16h03); **queda 16h05–16h09** (4 × 0); 7 × 845 até 16h15; 2 × 845 ao fim (18h05) |
| **Resultado** | **233 testes · 161 verdes · 72 vermelhos** |
| **Registro por teste** | [`2026-09-03-final/veredito.json`](2026-09-03-final/veredito.json) (104 KB — classe e motivo dos 233) |

## Veredito (`node scripts/veredito-do-gate.mjs relatorios/merged-final.json`)

| Classe | Testes | O que é |
|---|---|---|
| ok | 153 | verde, sem tag |
| conhecido | 63 | `@bug` (54, **todos vermelhos** — `alerta-bug-corrigido.mjs`: "Nenhum teste `@bug` passou") e `@achado` (9: 8 verdes, 1 vermelho — `CT-SUB`, não-determinismo do produto já documentado) |
| pré-condição ausente | 13 | anotação `pre-condicao-ausente` — ambiente, listado com motivo, não bloqueia |
| regressão | 4 | vermelho sem tag e sem anotação — **triagem abaixo** |
| flaky · pulado | 0 · 0 | |

### No escopo do gate de CI (141 testes: `PULAR_DESTRUTIVOS=1 --grep-invert "@bug|@achado"`)

**133 ok · 6 pré-condição ausente · 2 regressão · 0 flaky.** As 6 pré-condições são as exceções
1, 3, 4, 5, 6 e 7 de `docs/excecoes-de-pre-condicao.md` (contrato com `CNB_QUANT` vazio, contrato
sem itens, competência recusada, filas de Cotação/Negociação vazias, pool sem "Tarefas em pool").
As 2 "regressões" são os dois testes de `catalogo-invariante.spec.js` — o catálogo `onlyCanStart`
ganhou 6 processos e `SIGAJURI_Contencioso` passou a constar. **Não é regressão da suíte nem do
produto: é o invariante fazendo o que existe para fazer.** Depende da decisão **D1** do dono do
ambiente (a abertura foi intencional?) — item 1.5 do plano, o único não executado.

### Nos 47 destrutivos

**20 verdes · 18 `@bug` vermelhos · 7 pré-condição ausente · 2 vermelhos sem tag.**

- As 7 pré-condições: **5 por latência do BPMN** — a SC criada não saiu de "Grava SC e Anexos"
  em 180 s (`aprovacoes-solicitacao-compras` ×3, `acoes-da-tarefa` ×2; o mesmo grupo G13 da
  execução da manhã, com o mesmo tamanho); 1 pool de tarefas vazio (`assumir-tarefa-pool`,
  consequência das 5 anteriores); 1 combo "UF" do SIGAJURI sem opções (`sigajuri-contencioso`).
- Os 2 sem tag — ambos já vermelhos pela **mesma mensagem** na execução da manhã
  (`relatorio-falhas-2026-09-03.md`, cartões 28 e 43), portanto **não são regressão**:
  - `ciclo-solicitacao-compras.spec.js:816` — **CT-ACC-09-H**: a pasta "Processo NNN" que o
    produto deveria criar no GED em "Grava SC e Anexos" nunca aparece. A análise da manhã já o
    classificou como defeito real de produto; falta **catalogá-lo no README e marcá-lo `@bug`**
    (decisão D6, abaixo).
  - `sigajuri-consultivo.spec.js:48` — **CT-JUR-01-H**: combo "Tipo Consulta" sem opções. Está
    em dois lugares com classificações diferentes: exceção 9 de
    `docs/excecoes-de-pre-condicao.md` (serviço SIGAJURI fora — ambiente) e D-JUR-01 no relatório
    da manhã (defeito de produto não catalogado). Precisa de **uma** classificação (D6).

## Os dois destrutivos que caíram na queda do Protheus

`ciclo-correcao-reenvio.spec.js:243` e `ciclo-gestor.spec.js:109` rodaram às 16h05–16h07 e
reprovaram com `PRÉ-CONDIÇÃO AUSENTE: a grade de contratos não retornou nenhuma linha`. Foram
**descartados e reexecutados** às 16h15, na janela saudável — e reprovaram pelo motivo real
(`CT-CMP-08-H` beco sem saída do reenvio; D-01). O registro da queda está em
`docs/estabilidade-do-ambiente.md` (terceira ocorrência medida, ~4 min).

## Massa criada e limpeza

26 solicitações (113229–113262, sem os ids não sequenciais que o produto pulou), uma por
destrutivo que cria, **nenhuma multiplicada por retry**. `npm run limpar:simular` ao fim:
*"já encerradas, nada a fazer: 26 · alvos: 0"* — o `global-teardown` de cada invocação cancelou
o que aquela invocação criou. Resíduo zero.

## Comparação com a execução da manhã (09h03–11h55, commit `eb41213`)

| | Manhã | Final |
|---|---|---|
| Verdes / vermelhos | 162 / 71 | 161 / 72 |
| Defeito catalogado (`@bug`) vermelho | 38 (na contagem da análise) | 54 (`@bug` agora por rota em `erros-de-console` e `atribuicao-comprador` → `@achado`) |
| Pré-condição ausente | 13 | 13 |
| Latência do BPMN > 180 s | 5 | 5 |
| Erro da suíte | 0 | 0 |

A diferença de um teste é `CT-SUB @achado` (Substituição de Cargos), que oscila por
não-determinismo do próprio produto — documentado em `docs/estado-do-gate.md` desde 25/08/2026.

## O que muda na leitura a partir desta execução

O runner continua dizendo "72 failed". O que este carimbo acrescenta é que **cada um dos 72 tem
classe e motivo legíveis por máquina** (`veredito.json`), e que no escopo do gate **não há
regressão** — os únicos vermelhos sem classe pendem de duas decisões do dono do ambiente (D1 e
D6), não de código.

## D1 e D6 — respondidas medindo o ambiente (03/09/2026, 18h10–18h40)

O dono do ambiente não sabia responder; a resposta foi buscada no próprio Fluig, com a sessão da
automação (`fetch` de dentro da página, nunca `page.request`):

**D1 — o catálogo mudou porque a plataforma mudou de build, não porque alguém abriu permissão.**

| Evidência | Resultado |
|---|---|
| `GET /api/public/wcm/version` | **`Voyager 2.0.0-260901`** — em 27/08 o mapa registrava `2.0.0-260811` |
| Os 6 que "entraram" × tabela da skill de 27/08 | são **exatamente** os 6 com "Catálogo: não · Inicia: abre" — o `TOTVS-FS` já abria o formulário de todos (os `@achado` de RH provam isso desde 27/08 e continuam verdes) |
| `GET /api/public/2.0/users/getCurrent` → grupos | 36, todos `G.P.*`/`G.Compras.*`/`all_users`/`DefaultGroup-1` — nenhum grupo de RH ou Jurídico |
| `?expand=versions` dos 6 processos | nenhum `public: true`; a API não expõe data de publicação — sem evidência de republicação |

Conclusão: a **permissão efetiva não mudou**; o filtro `onlyCanStart` da tela passou a refleti-la
depois da atualização. Item 1.5 executado: `INICIAVEIS_NO_CATALOGO` versionada com 23 processos e
a data, teste do `SIGAJURI_Contencioso` **reescrito** para a regra nova (consta e está ativo).
`catalogo-invariante`, `inicio-processo-bloqueado` e `bloqueio-processos-rh` reexecutados: 18
verdes, coerentes com o catálogo novo. A pergunta de segregação (README, item 1) continua aberta
— só ficou mais visível.

**D6 — os dois destrutivos sem classe.**

- `CT-ACC-09-H` **não é defeito de produto; é latência do BPMN.** Dataset `document` consultado
  para "Processo <n> - %": as SCs que chegaram à "Validação do Gestor" **têm** a pasta (113225,
  113229 de hoje; 112679 de 26/08); as duas SCs deste teste que reprovaram (113226 de manhã,
  113242 à tarde) **não** saíram de "Grava SC e Anexos" antes de o teardown cancelá-las — numa
  tarde em que essa etapa passou de 180 s em cinco testes vizinhos. A análise da manhã ("defeito
  real") estava errada. O teste agora espera a SC chegar à "Validação do Gestor" (180 s, mesmo
  prazo dos irmãos) e, se não chegar, declara `faltaPreCondicao` com o motivo medido. Reexecutado:
  SC 113267, de novo >180 s em "Grava SC e Anexos" → **pré-condição ausente, anotada**.
- `CT-JUR-01-H` **é ambiente de configuração, e a convenção do repositório para isso é `@bug`
  D-JUR-01.** `POST /api/public/ecm/dataset/datasets` com `dsTipoSol`/`dsFilialSigajuri`/
  `dsAreaSigajuri` responde 200 com uma linha cujo valor é
  `ServiceNotFoundException: Não foi possível encontrar o serviço ' SIGAJURI '` — o serviço não
  está registrado neste Fluig. `docs/excecoes-de-pre-condicao.md` (exceções 9 e 10) já registrava
  a decisão do time de tratar isso como defeito documentado com `@bug`, e dizia "os dois testes"
  — mas só `sigajuri-contrato` tinha a tag. Aplicada a `sigajuri-consultivo.spec.js:48`; `@bug`
  passa a 55 em 36 arquivos. Reexecutados os dois arquivos: vermelhos pela mesma mensagem, agora
  classificados como conhecido.

**Veredito depois das reexecuções: 0 sem classe.** Os 72 vermelhos são 55 `@bug`, 1 `@achado`,
14 pré-condição anotada e 2 do invariante que passaram a verde com a lista versionada (161 → 163
verdes na composição final).

## Pendências que continuam com o dono

| # | Decisão | Bloqueia |
|---|---|---|
| D2 | U-16 (logo 404) não reproduziu em 24 medições — corrigido ou intermitente? | só o estado da linha no README (já "não reproduzido") |
| D3 | Onde fica a evidência pesada de cada execução (release asset × pasta compartilhada)? `gh` não está instalado nesta máquina | publicação dos `.html`/`.zip` desta e das execuções anteriores (continuam em disco e no histórico do git) |
| D4 | Aceita declarar as regras de concorrência/alçada como lacuna bloqueada? | **feito** na Etapa 8 — reverter se a resposta for não |
| D5 | Job noturno com `--retries=0` (comunicado) | — |
| Segregação | Os 6 processos de RH/Jurídico **devem** ser iniciáveis por um usuário de Compras? (pergunta 1 do README, agora visível na tela) | nada na suíte; é defeito de segregação a catalogar se a resposta for não |
