# Falhas da suíte E2E — TOTVS Fluig Cassi — execução de 03/09/2026

| | |
|---|---|
| **Data** | 03/09/2026, 09h03–11h55 (BRT) |
| **Ambiente** | `https://caixade182374.fluig.cloudtotvs.com.br` · usuário `TOTVS-FS` |
| **Commit** | `eb41213` (branch `emdash/teste-2-jxzxn`, já com as correções de 31/08–03/09) |
| **Runtime** | Playwright 1.62.1 · Node 22.22.2 · Chromium (Desktop Chrome, pt-BR) |
| **Modo** | execução completa, **destrutivos incluídos**, sem retry · 16 fatias não destrutivas + **47 invocações destrutivas, uma por teste, com 60 s de intervalo entre elas** |
| **Resultado** | **233 testes · 162 verdes · 71 vermelhos** |

> A versão HTML deste documento (`relatorio-falhas-2026-09-03.html`) traz as screenshots, o trecho de código,
> o aria-snapshot e o call log embutidos em cada cartão. Este Markdown tem a mesma análise e aponta os artefatos por caminho.

## Leitura em uma frase

Das **71** falhas, **38** são defeitos já catalogados no README (vermelhos intencionais), **18** são defeitos de produto não catalogados, **13** são pré-condição ausente (latência do BPMN, filas vazias e massa inadequada) e **2** são divergência entre o ambiente e o inventário versionado. Nenhuma falha foi atribuída a erro de código da suíte.

**O que mudou em relação a 02/09/2026:** o relatório de ontem tinha **24 falhas em um único ponto** — a factory escolhia sozinha o tipo "Renovação Contratual", que o ambiente já não oferecia, e o `selectOption` morria antes da assertion que dá nome a cada teste. Esta versão do repositório corrigiu a causa: `TIPO_SOLICITACAO` reflete o catálogo vigente, o tipo passou a ser **declarado por intenção do caso** (`QUALQUER_TIPO_VALIDO` ou um literal explícito) e `SolicitacaoCompraModal.selecionarTipo` confere o combo real antes de selecionar. **O grupo G1 de ontem desapareceu por completo**: nenhuma falha desta execução vem do combo. Os 24 testes mascarados agora dão veredito próprio: **9 passam** e **15 reprovam** — 13 pelo defeito real do produto e 2 por pré-condição ausente de massa —, cada um com o cartão detalhado abaixo. O placar saiu de **152 verdes / 81 vermelhos** para **162 verdes / 71 vermelhos**.

## Por natureza

| Natureza | Testes |
|---|---|
| Defeito de produto — já catalogado no README | 38 |
| Defeito de produto — achado desta execução (não catalogado) | 18 |
| Pré-condição ausente (ambiente / massa / latência) | 13 |
| Divergência ambiente × suíte (o ambiente mudou) | 2 |

## Por causa raiz

| Grupo | Causa raiz | Natureza | Testes |
|---|---|---|---|
| G1 | D-01 — a SC nasce presa no marco de Início, na conta de integração | Defeito de produto — já catalogado no README | 6 |
| G2 | Payload da SC — itens fantasma, campos chumbados, classeValor vazio e revisão incoerente (D-02, D-04, CT-ACC-04-S5, CT-ACC-06) | Defeito de produto — já catalogado no README | 4 |
| G3 | Formulários clássicos aceitam Enviar sem validação — fail-open na SC, Cotação, Negociação e Parecer | Defeito de produto — já catalogado no README | 7 |
| G4 | Validação só no cliente — o servidor aceita tipoSolicitação vazio e não alerta duplicidade | Defeito de produto — achado desta execução (não catalogado) | 2 |
| G5 | CT-CMP-08-H — o ciclo de correção é um beco sem saída: a SC reprovada não consegue voltar ao fluxo | Defeito de produto — já catalogado no README | 1 |
| G6 | GED aceita qualquer extensão e qualquer conteúdo (CT-GED-02-S1 / S2) | Defeito de produto — já catalogado no README | 5 |
| G7 | Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos | Defeito de produto — já catalogado no README | 8 |
| G8 | Catálogo de processos mudou desde o inventário versionado | Divergência ambiente × suíte (o ambiente mudou) | 2 |
| G9 | Jurídico (SIGAJURI) — combos vazios e parte contrária inalcançável | Defeito de produto — achado desta execução (não catalogado) | 3 |
| G10 | RH — Admissão abre o formulário errado e o Banco de Horas segue sem integração | Defeito de produto — achado desta execução (não catalogado) | 3 |
| G11 | Contratos de API — notificações, favoritos, reset de senha do fornecedor e delegação de fiscais | Defeito de produto — já catalogado no README | 6 |
| G12 | Plataforma e portais — deep-link 404, erros de console, resíduo `teste`, aba Atribuir, Clínica vazia, cache _Sync e grade truncada | Defeito de produto — já catalogado no README | 11 |
| G13 | BPMN lento — a SC não sai de "Grava SC e Anexos" dentro dos 180 s do orçamento de espera | Pré-condição ausente (ambiente / massa / latência) | 5 |
| G14 | Pré-condição ausente — filas vazias, massa inadequada e integrações que não devolveram dado | Pré-condição ausente (ambiente / massa / latência) | 8 |

## Por fatia de execução

| Fatia | Início | Duração | Testes | Verdes | Vermelhos |
|---|---|---|---|---|---|
| `tests/e2e/auth (não destrutivos)` | 09:03 | 0.2 min | 10 | 10 | 0 |
| `tests/api (não destrutivos)` | 09:04 | 0.2 min | 4 | 2 | 2 |
| `tests/e2e/acompanhamento-contratos (não destrutivos)` | 11:47 | 1.5 min | 33 | 23 | 10 |
| `tests/e2e/financeiro (não destrutivos)` | 09:04 | 0.1 min | 2 | 2 | 0 |
| `tests/e2e/saude (não destrutivos)` | 09:04 | 0.1 min | 1 | 0 | 1 |
| `tests/e2e/notificacoes (não destrutivos)` | 09:04 | 0.6 min | 4 | 2 | 2 |
| `tests/e2e/fiscal (não destrutivos)` | 09:05 | 0.6 min | 5 | 5 | 0 |
| `tests/e2e/juridico (não destrutivos)` | 09:05 | 0.2 min | 4 | 2 | 2 |
| `tests/e2e/seguranca (não destrutivos)` | 09:06 | 0.3 min | 9 | 2 | 7 |
| `tests/e2e/contratos (não destrutivos)` | 11:48 | 1.7 min | 8 | 6 | 2 |
| `tests/e2e/tarefas (não destrutivos)` | 09:18 | 0.3 min | 7 | 7 | 0 |
| `tests/e2e/documentos (não destrutivos)` | 09:11 | 0.9 min | 4 | 4 | 0 |
| `tests/e2e/rh (não destrutivos)` | 11:42 | 0.7 min | 14 | 11 | 3 |
| `tests/e2e/compras (não destrutivos)` | 11:45 | 0.7 min | 17 | 10 | 7 |
| `tests/e2e/portais (não destrutivos)` | 11:44 | 0.8 min | 22 | 20 | 2 |
| `tests/e2e/plataforma (não destrutivos)` | 11:43 | 1.0 min | 42 | 35 | 7 |
| `tests/e2e/acompanhamento-contratos (destrutivos, 1 por invocação, 60 s entre eles)` | 09:37 | 7.5 min | 8 | 0 | 8 |
| `tests/e2e/compras (destrutivos, 1 por invocação, 60 s entre eles)` | 09:50 | 18.1 min | 8 | 2 | 6 |
| `tests/e2e/contratos (destrutivos, 1 por invocação, 60 s entre eles)` | 10:17 | 1.3 min | 3 | 1 | 2 |
| `tests/e2e/documentos (destrutivos, 1 por invocação, 60 s entre eles)` | 10:22 | 5.3 min | 9 | 4 | 5 |
| `tests/e2e/juridico (destrutivos, 1 por invocação, 60 s entre eles)` | 10:44 | 0.4 min | 3 | 1 | 2 |
| `tests/e2e/plataforma (destrutivos, 1 por invocação, 60 s entre eles)` | 10:59 | 0.4 min | 2 | 1 | 1 |
| `tests/e2e/portais (destrutivos, 1 por invocação, 60 s entre eles)` | 11:01 | 16.8 min | 7 | 7 | 0 |
| `tests/e2e/saude (destrutivos, 1 por invocação, 60 s entre eles)` | 11:25 | 0.3 min | 2 | 2 | 0 |
| `tests/e2e/tarefas (destrutivos, 1 por invocação, 60 s entre eles)` | 11:27 | 8.5 min | 5 | 3 | 2 |
| **Total** | | 68.5 min | **233** | **162** | **71** |

## Medições suplementares (fora da execução principal)

- **Janela de rede degradada entre 09h12 e 09h30** — durante a primeira passagem, as fatias `rh`, `plataforma`, `portais` e `compras` acumularam 20 falhas com sintoma de infraestrutura (`page.goto: Timeout 60000ms` e `net::ERR_NETWORK_CHANGED`), e as fatias `acompanhamento-contratos` e `contratos` pegaram a grade do Protheus devolvendo *"Mostrando 0 até 0 de 0 registros"*. `docs/estabilidade-do-ambiente.md` proíbe reportar medição nessa condição. Os JSONs dessa passagem estão preservados em `relatorios-2026-09-03/janela-degradada/` como evidência, e as seis fatias foram **reexecutadas** depois da confirmação de saúde. Efeito: `portais` 18 → 2 vermelhos, `rh` 10 → 3, `plataforma` 12 → 7, `compras` 13 → 7, `acomp` 11 → 10, `contratos` 3 → 2.
- **Confirmação de saúde do ambiente antes da medição final** — `node scripts/sonda-grade.mjs` devolveu **845 contratos em cinco amostras consecutivas**, que é o critério exigido por `CLAUDE.md` e por `docs/estabilidade-do-ambiente.md` antes de interpretar qualquer execução.
- **Dois destrutivos reexecutados na janela saudável** — `ciclo-correcao-reenvio.spec.js:242` (CT-CMP-08-H) e `ciclo-solicitacao-compras.spec.js:815` (CT-ACC-09-H) haviam parado em sintoma de ambiente (grade vazia, widget de Zoom). Reexecutados, **os dois alcançaram a assertion de domínio e confirmaram defeito real** — o beco sem saída do reenvio e a pasta do GED que nunca é criada.
- **Validação das evidências contra o que cada cartão afirma** — a leitura do relatório apontou que vários prints não sustentavam o texto do defeito. A checagem confirmou e mediu: a screenshot do Playwright é sempre "a página no instante da falha", e isso só PROVA o defeito quando ele é visual. Dos 71 cartões, em **23 a screenshot é a evidência** (combo vazio, status truncado, 404, formulário errado, documento publicado sem bloqueio) e em **48 ela é apenas contexto**, porque o oráculo do caso é a resposta de uma API, o corpo do payload interceptado, uma linha de console, uma requisição de rede ou uma tentativa bloqueada pela guarda de escrita — nada disso aparece numa imagem. Cada cartão agora declara em qual dos dois grupos está e, quando é contexto, aponta onde está a prova de verdade. A classificação não foi assumida: cada caso marcado como visual foi conferido contra o aria-snapshot daquela falha, e dois que eu havia marcado como prova (upload de `.exe` no GED e campo "Clínica") caíram na conferência e foram reclassificados. Classificação em `relatorios-2026-09-03/evidencias.mjs`. Dois efeitos colaterais que enganavam quem lia: em `payload-solicitacao` o "Erro ao iniciar processo" ao fundo é o aborto proposital da captura, não o defeito; e no Banco de Horas o `alert()` nativo nunca sai na imagem porque o Playwright o dispensa sozinho.
- **Intervalo de 60 s entre destrutivos** — os 47 cenários `@destrutivo` rodaram **um por invocação**, com espera de 60 s entre eles (`relatorios-2026-09-03/rodar-destrutivos.mjs`; cronologia completa em `destrutivos.log`). Isso remove a disputa pelo pool de tarefas entre testes concorrentes, que em 02/09 era uma das explicações possíveis para as SCs não ficarem assumíveis. Com a disputa eliminada, as 5 falhas de latência do BPMN (G13) **persistiram** — logo a causa é a latência da etapa "Grava SC e Anexos", não a concorrência.

## Massa criada e limpeza

O livro-razão `test-results/criados.jsonl` registrou os registros criados pelos testes destrutivos nesta execução — SCs **#113193–#113226**, medição de contrato, documentos no GED e favoritos. Como cada destrutivo rodou em sua própria invocação, o `globalTeardown` rodou **47 vezes** e cancelou, em cada uma, exatamente o que aquela invocação havia criado (corte por `process.uptime()`). O que o cancelamento não alcança está descrito em `docs/cancelamento-de-massa.md`.

## Causas raiz, em detalhe

### G1 — D-01 — a SC nasce presa no marco de Início, na conta de integração

*Defeito de produto — já catalogado no README · 6 teste(s)*

O widget envia `targetState: 6` (START_EVENT_NORMAL) com `targetAssignee: consumerkeycompras`. A SC é criada, a transferência para o solicitante falha (HTTP 500 em `dsFluig_postProcessesTransfer`) e a tela ainda anuncia "iniciado com sucesso". Confirmado nesta execução pelo payload capturado (`targetState=6`) e pela SC 113198, que nasceu com responsável "Usuário Integrador Fluig".

**Novidade desta execução:** com os 24 testes do combo destravados, este grupo aparece com **veredito próprio em 6 testes** — em 02/09 ele constava com zero, porque todos estavam mascarados. Note também que a SC 113225 (CT-CMP-08-H) **chegou** à Validação do Gestor: o bloqueio de D-01 não é absoluto, oscila.

Testes:
- **CT-E2E-01-H — Etapa 1 — SC nasce no estado correto e com o dono correto · D-01 — a SC nasce presa no marco de Início, na conta de integração**
  - `e2e/acompanhamento-contratos/ciclo-gestor.spec.js:36` — @destrutivo @bug estado inicial e responsável deveriam refletir uma etapa de trabalho do solicitante
- **CT-E2E-02-H — Etapa 2 — Validação do Gestor Imediato (aprovar) · D-01 — a SC nasce presa no marco de Início, na conta de integração**
  - `e2e/acompanhamento-contratos/ciclo-gestor.spec.js:109` — @destrutivo @bug aprovada pelo Gestor Imediato, a SC deveria avançar para Validação Orçamentária
- **CT-E2E-02-S1 — Etapa 2 — Reprovação devolve para correção **preservando os dados do contrato** · D-01 — a SC nasce presa no marco de Início, na conta de integração**
  - `e2e/acompanhamento-contratos/ciclo-gestor.spec.js:155` — @destrutivo @bug reprovada, a SC deveria voltar para Ajustar Informações com o solicitante, itens e contrato íntegros
- **CT-ACC-05-H — Confirmar cria a SC e ela chega ao solicitante ⭐ **caso-âncora do pedido do dev** · D-01 — a SC nasce presa no marco de Início, na conta de integração**
  - `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:112` — @destrutivo @bug a SC deveria nascer atribuída ao solicitante logado, não à conta de integração
- **CT-ACC-05-S1 — Falha na transferência deixa a SC com a conta de integração ⚠️ · D-01 — a SC nasce presa no marco de Início, na conta de integração**
  - `e2e/acompanhamento-contratos/erros-no-start.spec.js:67` — @bug deve avisar quando a SC é criada mas não pôde ser atribuída ao solicitante, em vez de anunciar sucesso pleno
- **CT-E2E-01-H — Etapa 1 — SC nasce no estado correto e com o dono correto · D-01 — a SC nasce presa no marco de Início, na conta de integração**
  - `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:64` — @bug a SC deve nascer numa etapa de trabalho atribuída ao solicitante, não presa no marco de Início da conta de integração

### G2 — Payload da SC — itens fantasma, campos chumbados, classeValor vazio e revisão incoerente (D-02, D-04, CT-ACC-04-S5, CT-ACC-06)

*Defeito de produto — já catalogado no README · 4 teste(s)*

O serviço que monta o payload do `/wf_solicitacao_compras/start` fabrica quantidade para item sem quantidade (cascata `resolveQuant` → fallback 1), fixa `campoDescritor` em "Sol. Compras - CASSI SEDE" para qualquer filial, manda `tbprod_classeValor` vazio em todos os itens e envia `revisaContrato` divergente da revisão real do contrato apontado por `nrContrato`. Quatro assertions distintas, uma única origem: o montador do payload não lê o contrato de origem com fidelidade.

**Novidade desta execução:** os quatro testes deste grupo estavam mascarados em 02/09 e agora reprovam com veredito direto, cada um citando o contrato real sorteado pela grade de massa.

Testes:
- **CT-ACC-06-S1 — Itens zerados são descartados silenciosamente · D-02 — valor total do item multiplicado / repetido no payload**
  - `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:224` — @destrutivo @bug item de quantidade/valor zerado no contrato não deveria virar item extra na SC criada
- **CT-ACC-07-S1 — Valores fixos no payload da SC · D-04 — campos do payload chumbados, sem seguir o contrato de origem**
  - `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:264` — @bug classeOrca, classificação e o descritor deveriam refletir o contrato de origem, não vir fixos para todos
- **classeValor vazio**
  - `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:384` — @bug classeValor do item deveria vir preenchido junto com classeOrca e classificação
- **CT-ACC-04-S5 — Número do contrato alterado à mão no modal**
  - `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:479` — @bug não deve permitir que nrContrato divirja do contrato real da revisão/filial/itens enviados

### G3 — Formulários clássicos aceitam Enviar sem validação — fail-open na SC, Cotação, Negociação e Parecer

*Defeito de produto — já catalogado no README · 7 teste(s)*

Cinco formulários diferentes disparam `POST /ecm/api/rest/ecm/workflowView/send` sem nenhuma validação de cliente: a SC clássica ainda montando (CT-CMP-07-S1), a SC sem anexo obrigatório — que o **servidor também aceita**, e nesta execução criou a SC do teste destrutivo (CT-CMP-02-S4) —, a Cotação sem fornecedor, a Negociação sem proposta e o Parecer Técnico sem responsável. Os que não gravaram só não gravaram porque a `utils/guarda-criacao.js` bloqueou a escrita; o `expect(guarda.tentativas()).toBe(0)` é a prova de que a tentativa saiu do cliente.

Testes:
- **CT-COT — Cotação de Produtos e Serviços — formulário e fila do Portal do Comprador**
  - `e2e/compras/ciclo-cotacao.spec.js:125` — CT-COT (defeito) — o shell aceita Enviar sem nenhuma validação de fornecedor/vínculos obrigatórios @bug
- **CT-CMP-02-S4 — Anexo obrigatório ausente**
  - `e2e/compras/ciclo-solicitacao-compras.spec.js:489` — CT-CMP-02-S4 @bug — deve bloquear o envio quando nenhum anexo é informado
- **CT-CMP-02-S4 — Anexo obrigatório ausente**
  - `e2e/compras/ciclo-solicitacao-compras.spec.js:567` — CT-CMP-02-S4 @destrutivo @bug — o servidor não deve criar a SC quando falta o anexo obrigatório
- **CT-CMP-07-S1 — Regressão do fail-open do formulário clássico de SC**
  - `e2e/compras/fail-open-formulario-sc.spec.js:127` — CT-CMP-07-S1 @destrutivo @bug — Enviar não deveria criar solicitação antes de o formulário terminar de montar
- **CT-NEG — Negociação de Cotação — formulário e fila de Avaliação de Propostas**
  - `e2e/compras/negociacao-proposta.spec.js:97` — CT-NEG @bug — o Enviar do shell sem proposta real vinculada nunca deveria completar uma requisição de escrita
- **CT-PAR-01-S1 — Parecer sem responsável definido**
  - `e2e/compras/parecer-tecnico.spec.js:84` — CT-PAR-01-S1 @bug — parecer sem responsável definido não pode completar uma requisição de escrita ao Enviar
- **CT-PAR-01-S2 — Parecer reprovando a cotação**
  - `e2e/compras/parecer-tecnico.spec.js:112` — CT-PAR-01-S2 @bug — parecer desfavorável (Reprovado/Ajustes) com justificativa também é barrado pela ausência de responsável

### G4 — Validação só no cliente — o servidor aceita tipoSolicitação vazio e não alerta duplicidade

*Defeito de produto — achado desta execução (não catalogado) · 2 teste(s)*

Dois furos de validação de servidor no start da SC pelo portal: o start direto com `tipoSolicitacao` vazio responde **200** (enquanto `motivoSolCompra` vazio é recusado), e abrir o modal de um contrato que já tem SC em andamento não exibe aviso algum de duplicidade. Os dois são contornáveis por quem chame a API direto — a regra existe apenas na tela. Nenhum dos dois está na tabela de defeitos do README.

Testes:
- **CT-ACC-04-S6 — Bypass da validação de cliente · D-10**
  - `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:292` — @destrutivo @bug o servidor deveria recusar tipoSolicitacao vazio tanto quanto recusa motivoSolCompra vazio
- **CT-E2E-12-S1 — Duas SCs para o mesmo contrato/revisão**
  - `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:422` — @destrutivo @bug o portal deveria alertar sobre a SC já em andamento para o mesmo contrato/revisão

### G5 — CT-CMP-08-H — o ciclo de correção é um beco sem saída: a SC reprovada não consegue voltar ao fluxo

*Defeito de produto — já catalogado no README · 1 teste(s)*

Este é o cartão mais importante desta execução, porque em 02/09 ele estava mascarado pelo combo e só foi obtido numa medição suplementar. Agora ele rodou no fluxo normal e reproduziu o defeito ponta a ponta: a SC 113225 percorreu Início → Grava SC e Anexos → Validação do Gestor → reprovação → "Ajustar Informações" e, ao ser reenviada pelo solicitante, o Fluig recusou a movimentação com *"Existem campos de rateio sem preenchimento"* — num rateio que veio do próprio contrato e que ninguém editou. A solicitação fica presa em "Ajustar Informações" com o solicitante, sem caminho de volta.

Testes:
- **CT-CMP-08-H — Fechar o ciclo de retorno: reprovação → Correção → reenvio**
  - `e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js:242` — CT-CMP-08-H @destrutivo @bug — reprovada e corrigida, a SC deveria voltar para a Validação do Gestor com o contrato de origem íntegro
  - Reexecução em janela saudável: Na primeira passagem (09h35) este teste parou em `AcompanhamentoContratosPage.expectCarregada()` porque a grade do Protheus estava devolvendo zero contratos. Reexecutado às 11h51, com a grade sustentando 845 registros, **alcançou a assertion de domínio e confirmou o defeito** — é o veredito que em 02/09 só existia como medição suplementar.

### G6 — GED aceita qualquer extensão e qualquer conteúdo (CT-GED-02-S1 / S2)

*Defeito de produto — já catalogado no README · 5 teste(s)*

`.exe`, `.sh`, `.bat`, `.pdf.exe` e um binário PE renomeado para `.pdf` foram todos publicados sem mensagem de bloqueio. Não há allowlist de extensão nem inspeção de conteúdo (magic bytes). Diferente de 02/09, os cinco casos deram veredito na primeira tentativa — o `.bat` não precisou de reexecução, porque cada destrutivo rodou isolado e não herdou linhas residuais do publicador.

Testes:
- **CT-GED-02-S2 — Bloqueio de extensão: allowlist, não blacklist do `.exe`**
  - `e2e/documentos/bloqueio-extensoes.spec.js:133` — CT-GED-02-S2 @destrutivo @bug — script de lote (.bat) deveria ser rejeitado
  - Reexecução em janela saudável: Diferente de 02/09, este caso deu veredito na primeira tentativa. Naquele dia ele caiu por `net::ERR_NETWORK_CHANGED` e depois esbarrou em linhas residuais do publicador; rodando isolado, o problema não se repetiu.
- **CT-GED-02-S2 — Bloqueio de extensão: allowlist, não blacklist do `.exe`**
  - `e2e/documentos/bloqueio-extensoes.spec.js:149` — CT-GED-02-S2 @destrutivo @bug — shell script (.sh) deveria ser rejeitado
- **CT-GED-02-S2 — Bloqueio de extensão: allowlist, não blacklist do `.exe`**
  - `e2e/documentos/bloqueio-extensoes.spec.js:163` — CT-GED-02-S2 @destrutivo @bug — dupla extensão (.pdf.exe) deveria ser rejeitada
- **CT-GED-02-S2 — Bloqueio de extensão: allowlist, não blacklist do `.exe`**
  - `e2e/documentos/bloqueio-extensoes.spec.js:176` — CT-GED-02-S2 @destrutivo @bug — executável renomeado para .pdf deveria ser rejeitado pelo conteúdo
- **CT-GED-02-S1 — Upload de tipo/tamanho não permitido**
  - `e2e/documentos/gestao-documentos.spec.js:66` — CT-GED-02-S1 upload de extensão bloqueada é rejeitado e nada é gravado @destrutivo @bug

### G7 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos

*Defeito de produto — já catalogado no README · 8 teste(s)*

Oito assertions de segurança reprovam, todas idênticas às de 02/09: o dataset `colleague` devolve 3.493 colaboradores ignorando a constraint; `GET /process-management/api/v2/requests/112009?expand=formFields` entrega 44 campos (razão social, CNPJ) de um processo em que a conta não participa (BOLA); `ds_Fluig` (credencial de integração) e `dsFluig_executeSql`/`dsFluig_getDocumentSql` respondem 200 para sessão não-admin; 6 de 23 administradores têm nome de conta técnica; 2 requisições por carga vão para `google-analytics.com`; e `bpm_addUserFluig`/`bpm_addUserGroup` constam do catálogo de início de um usuário de Compras — o de Grupo chega a abrir o formulário com o botão Enviar visível.

Testes:
- **CT-SEG-01-S1 — Dataset sem filtro no código (vazamento)  🔒 (observado)**
  - `api/dataset-colleague-vazamento.spec.js:22` — deve retornar somente o registro do login filtrado, não a base inteira @bug
- **CT-SEG-02-S1 — Least-privilege dos administradores  🔒 (U-13) · U-13 — contas técnicas com privilégio de administrador**
  - `e2e/seguranca/auditoria-datasets.spec.js:18` — CT-SEG-02-S1 @bug: contas de integração/serviço não devem ter privilégio de administrador
- **CT-SEG-03-S1 — Credencial de integração exposta  🔒 (U-03) · U-03 — dataset de credencial de integração legível sem admin**
  - `e2e/seguranca/auditoria-datasets.spec.js:71` — CT-SEG-03-S1 @bug: dataset de credencial de integração não deve ser legível por sessão sem privilégio admin
- **CT-SEG-04-S1 — Execução de SQL / injeção  🔒 (U-04) · U-04 — executor de SQL alcançável sem admin**
  - `e2e/seguranca/auditoria-datasets.spec.js:103` — CT-SEG-04-S1 @bug: datasets de execução de SQL não devem ser alcançáveis por sessão sem privilégio admin
- **CT-SEG-07-S1 — Isolamento horizontal na API v2 de processos (BOLA/IDOR interno)**
  - `e2e/seguranca/isolamento-horizontal-api-processos.spec.js:59` — CT-SEG-07-S1 @bug — não deve entregar o objeto de um processo em que o usuário não participa
- **U-11 — telemetria enviada ao Google Analytics**
  - `e2e/seguranca/lgpd-envio-google-analytics.spec.js:22` — não deve enviar dados de navegação para o Google Analytics @bug
- **CT-SEG-08-S1 — Processos administrativos abertos a usuário comum**
  - `e2e/seguranca/processos-administrativos-usuario-comum.spec.js:39` — CT-SEG-08-S1 @bug — "bpm_addUserFluig" (Adicionar Usuário) não deve constar do catálogo nem abrir para conta não-admin
- **CT-SEG-08-S1 — Processos administrativos abertos a usuário comum**
  - `e2e/seguranca/processos-administrativos-usuario-comum.spec.js:39` — CT-SEG-08-S1 @bug — "bpm_addUserGroup" (Adicionar Grupo) não deve constar do catálogo nem abrir para conta não-admin

### G8 — Catálogo de processos mudou desde o inventário versionado

*Divergência ambiente × suíte (o ambiente mudou) · 2 teste(s)*

O invariante CT-PLT-10-H acusa que o conjunto `onlyCanStart` desta conta divergiu do inventário versionado, e o teste-irmão registra que `SIGAJURI_Contencioso` **passou** a constar do catálogo — o achado anterior ("cria solicitação mas fica fora do catálogo") mudou de estado. Cada linha é uma **mudança de permissão de início**, não ajuste de dados: cabe à Cassi dizer se foi intencional. O teste-irmão precisa ser reescrito para a nova regra, nunca silenciado.

Testes:
- **CT-PLT-10-H — Invariante do catálogo de processos**
  - `e2e/plataforma/catalogo-invariante.spec.js:149` — CT-PLT-10-H: o conjunto de processos publicados e o de iniciáveis devem bater exatamente com o inventário versionado
- **CT-PLT-10-H — Invariante do catálogo de processos**
  - `e2e/plataforma/catalogo-invariante.spec.js:224` — CT-PLT-10-H: `SIGAJURI_Contencioso` continua fora do catálogo `onlyCanStart` embora crie solicitação — a permissão real diverge do filtro da tela

### G9 — Jurídico (SIGAJURI) — combos vazios e parte contrária inalcançável

*Defeito de produto — achado desta execução (não catalogado) · 3 teste(s)*

"Tipo Consulta" (Consultivo) e "Filial" (Contrato) oferecem uma única opção — o dataset que os alimenta não devolve nada (D-JUR-01). No Contencioso, o botão "Novo Envolvido" fica oculto pela classe `sem-processo-hide` tanto no estado padrão quanto com "Não possui processo" marcado: não há como registrar a parte contrária de uma Liminar. `docs/estabilidade-do-ambiente.md` manda tratar SIGAJURI e contratos como integrações **independentes** — a grade de contratos estar saudável não diz nada sobre o SIGAJURI, e é o caso aqui: a grade sustentou 845 registros enquanto os combos do Jurídico seguiam vazios.

Testes:
- **CT-JUR-01-H — Consultivo — solicitação → parecer → aprovação (feliz) · D-JUR-01 — combos do SIGAJURI vazios (dataset não devolve registros)**
  - `e2e/juridico/sigajuri-consultivo.spec.js:48` — CT-JUR-01-H deveria criar a solicitação de Consultivo e vinculá-la à área informada @destrutivo
- **CT-JUR-04-S1 — Contencioso sem parte contrária**
  - `e2e/juridico/sigajuri-contencioso.spec.js:196` — CT-JUR-04-S1 deveria oferecer campo para registrar a parte contrária em consultas contenciosas @bug
- **CT-JUR-03-H — Contrato — geração de minuta (feliz) · D-JUR-01 — combos do SIGAJURI vazios (dataset não devolve registros)**
  - `e2e/juridico/sigajuri-contrato.spec.js:32` — CT-JUR-03-H deveria permitir montar uma minuta preenchendo Filial e Tipo Contrato @bug

### G10 — RH — Admissão abre o formulário errado e o Banco de Horas segue sem integração

*Defeito de produto — achado desta execução (não catalogado) · 3 teste(s)*

`wf_automacao_admissao` serve o template de `rh_gbeneficios_planosaude` (associação processo↔formulário errada). O Banco de Horas expõe `alert()` nativo "Existem parâmetros não informado para esse servidor" (U-02) e a aba Autorização nunca sai de "Aguarde, processando".

**Diferença em relação a 02/09:** a Substituição de Cargos (`CT-SUB`, marcado `@achado`) **passou** nesta execução, e os cinco processos de RH que abrem sem bloqueio de grupo também. O RH caiu de 4 para 3 vermelhos.

Testes:
- **CT-ADM-01-H — Admissão integra novo funcionário (feliz)**
  - `e2e/rh/admissao.spec.js:36` — CT-ADM-01-H @bug — deveria abrir um formulário de admissão de novo funcionário
- **CT-BH-01-S2 — Autorizar horas acima do limite · U-02 — Banco de Horas sem integração com o Protheus**
  - `e2e/rh/banco-horas-limite.spec.js:38` — CT-BH-01-S2 @bug — autorizar horas acima do limite deve bloquear
- **CT-BH-01-S1 — Parâmetros de servidor ausentes  ⚠️ defeito conhecido (U-02) · U-02 — Banco de Horas sem integração com o Protheus**
  - `e2e/rh/banco-horas.spec.js:14` — CT-BH-01-S1 @bug — não deve alertar o usuário final com erro de configuração de servidor ao abrir o Banco de Horas

### G11 — Contratos de API — notificações, favoritos, reset de senha do fornecedor e delegação de fiscais

*Defeito de produto — já catalogado no README · 6 teste(s)*

`GET /notification/api/v1/notifications?limit=3` devolve 1000 (ignora `limit`) e `DELETE .../notifications/{id}` responde 500 `NotFoundException` apesar de `canRemove: true`; favoritar duas vezes responde 500 em `text/plain`; o reset de senha do Portal do Fornecedor com token adulterado responde **500** em vez de 4xx; e a Delegação de Fiscais, anunciada como iniciável no catálogo, é recusada pelo servidor com "Solicitação só pode ser aberta através do portal de delegação de fiscais!" — portal que não existe em nenhum ponto de navegação desta conta, e cujo formulário nem oferece controle para escolher o substituto.

Testes:
- **CT-DEL-01-H — Delegar fiscal válido (feliz)**
  - `e2e/contratos/delegacao-fiscais-ciclo.spec.js:42` — CT-DEL-01-H @destrutivo @bug: delegar um fiscal substituto para um contrato deve criar a delegação
- **CT-DEL-01-S1 — Substituto inválido / sem permissão**
  - `e2e/contratos/delegacao-fiscais-ciclo.spec.js:82` — CT-DEL-01-S1 @destrutivo @bug: substituto inválido/sem permissão deve ser bloqueado — não há nenhum controle para selecionar um fiscal substituto
- **CT-NOT-03-S1 — Contratos da API de notificação**
  - `e2e/notificacoes/contratos-api-notificacao.spec.js:98` — CT-NOT-03-S1 @bug: `GET /notification/api/v1/notifications` deve respeitar `limit` e `offset`
- **CT-NOT-03-S1 — Contratos da API de notificação**
  - `e2e/notificacoes/contratos-api-notificacao.spec.js:171` — CT-NOT-03-S1 @bug: notificação declara `canRemove: true`, então o verbo REST de remoção deveria existir
- **CT-PLT-07-S1 — `addFavorites` duplicado responde 500 em texto puro**
  - `e2e/plataforma/favoritos-contrato-api.spec.js:126` — CT-PLT-07-S1: favoritar o mesmo processo duas vezes deve responder erro de negócio em JSON (ou 200 idempotente), não 500 em texto puro @destrutivo @bug
- **CT-PFN-02-S2 — Link de reset expirado/adulterado**
  - `e2e/portais/acesso-fornecedor.spec.js:107` — CT-PFN-02-S2 @bug deve recusar um token de redefinição expirado/adulterado sem efetivar a troca

### G12 — Plataforma e portais — deep-link 404, erros de console, resíduo `teste`, aba Atribuir, Clínica vazia, cache _Sync e grade truncada

*Defeito de produto — já catalogado no README · 11 teste(s)*

U-01 (`/principalprocess` e `/gestao_ferias` caem em `errorPage/404` pelo deep-link, embora funcionem pela navegação interna), NPS 403 na Home, 404 do `fluig-style-guide.min.css` + "Comprador não encontrado" no Portal do Comprador, processo `teste` (categoria ADMIN) ofertado no catálogo, aba Atribuir da Gerência de Compras sem dados, campo "Clínica" vazio no Questionário CliniCASSI (U-14), `ds_protheus_getFuncionarios_restGetAll_Sync` respondendo 500 `NullPointerException` (U-12), a situação do contrato truncada na grade ("Finali", "Paralisa") e o alerta de indisponibilidade que nomeia o dataset errado.

Testes:
- **CT-INT-02-S1 — Sincronização em erro  ⚠️ (U-12) · U-12 — variante de cache (_Sync) dos dados de RH em erro**
  - `api/sincronizacao-protheus.spec.js:31` — CT-INT-02-S1 @bug: variantes de cache (_Sync) dos dados de RH e vigência de compra não devem estar em erro
- **CT-ACC-02-S1 — Status do contrato exibido de forma legível · D-08**
  - `e2e/acompanhamento-contratos/grade-contratos.spec.js:45` — CT-ACC-02-S1 @bug — deve exibir a situação do contrato por extenso, sem truncar
- **D-11**
  - `e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js:54` — @bug deve exibir um alerta por dado indisponível, nomeando o dado que faltou
- **CT-ACC-09-H — O caminho FELIZ do anexo da SC nunca foi provado**
  - `e2e/compras/ciclo-solicitacao-compras.spec.js:815` — CT-ACC-09-H @destrutivo — o anexo enviado deveria gerar os dois registros no GED, sob a pasta da solicitação, e ser listado na solicitação
  - Reexecução em janela saudável: Na primeira passagem o teste parou antes, no widget de Zoom do formulário ("Zoom no índice 0 não abriu/confirmou uma opção após 5 tentativas") — sintoma de ambiente, sem veredito. Reexecutado na janela saudável, **alcançou a assertion de domínio e confirmou o defeito**.
- **CT-PLT-04 — Deep-link de rota SPA · U-01 — deep-link de rota SPA cai em errorPage/404**
  - `e2e/plataforma/deep-link-spa.spec.js:19` — acessar /portal/p/1/principalprocess diretamente deve abrir a página, não redirecionar para 404 @bug
- **CT-PLT-04 — Deep-link de rota SPA · U-01 — deep-link de rota SPA cai em errorPage/404**
  - `e2e/plataforma/deep-link-spa.spec.js:19` — acessar /portal/p/1/gestao_ferias diretamente deve abrir a página, não redirecionar para 404 @bug
- **CT-PLT-06-S1 — Erro de console fora da home**
  - `e2e/plataforma/erros-de-console.spec.js:152` — CT-PLT-06-S1 @bug: Portal do Comprador (/portal/p/1/portal-do-comprador) deve carregar sem erro de console não catalogado
- **NPS 403**
  - `e2e/plataforma/home.spec.js:7` — deve carregar os apps e contadores sem erro de console @bug
- **CT-PLT-08-S1 — Processo inativo e resíduo de desenvolvimento visível**
  - `e2e/plataforma/processo-inativo-e-residuo.spec.js:62` — CT-PLT-08-S1 @bug: o processo `teste` (categoria ADMIN) não deveria constar do catálogo de início de um usuário de Compras
- **Aba Atribuir**
  - `e2e/portais/gerencia-compras.spec.js:31` — deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir @bug
- **CT-CLI-02-S1 — Job de início parado  ⚠️ (U-14) · U-14 — campo Clínica vazio no Questionário CliniCASSI**
  - `e2e/saude/questionario-clinicassi.spec.js:217` — Clínica/Unidade deveriam identificar a clínica do diagnóstico e não nascer vazias @bug

### G13 — BPMN lento — a SC não sai de "Grava SC e Anexos" dentro dos 180 s do orçamento de espera

*Pré-condição ausente (ambiente / massa / latência) · 5 teste(s)*

Cinco testes de ciclo (aprovar/reprovar como Gestor, sinalizar ausência de aprovador, "Somente salvar", Transferir) criam a própria SC pelo formulário clássico e esperam até 180 s pelo botão "Assumir tarefa" na Validação do Gestor. As SCs 113203/04/05 e 113221/22 continuavam em "Grava SC e Anexos" ao fim do prazo. A referência de campo é ~76 s.

**O intervalo de 60 s entre destrutivos eliminou uma hipótese.** Em 02/09 não dava para separar "BPMN lento" de "outro teste concorrente assumiu a tarefa primeiro", porque os cenários corriam juntos. Nesta execução cada destrutivo rodou sozinho, com 60 s de folga — e as cinco falhas **persistiram**. A concorrência está descartada: o que não cabe no orçamento é a própria etapa "Grava SC e Anexos". Note que o mesmo caminho funcionou em CT-CMP-08-H, que **chegou** à Validação do Gestor: a latência oscila, não é um travamento fixo.

Testes:
- **CT-CMP-04-H — Aprovação — Gestor Imediato (feliz)**
  - `e2e/compras/aprovacoes-solicitacao-compras.spec.js:317` — @destrutivo deve assumir e aprovar uma tarefa do pool do Gestor Imediato
- **CT-CMP-04-S1 — Reprovação do Gestor gera correção**
  - `e2e/compras/aprovacoes-solicitacao-compras.spec.js:358` — @destrutivo deve assumir e reprovar uma tarefa do pool do Gestor Imediato com justificativa
- **CT-CMP-05-S1 — Valor acima da alçada sem aprovador**
  - `e2e/compras/aprovacoes-solicitacao-compras.spec.js:401` — @destrutivo deve sinalizar explicitamente quando não há aprovador habilitado para a próxima etapa
- **CT-TSK-07-H — "Somente salvar" — salvar sem movimentar**
  - `e2e/tarefas/acoes-da-tarefa.spec.js:184` — CT-TSK-07-H @destrutivo — "Somente salvar" deve persistir o rascunho sem movimentar a atividade
- **CT-TSK-08-H — Transferir atividade**
  - `e2e/tarefas/acoes-da-tarefa.spec.js:297` — CT-TSK-08-H @destrutivo — transferir deve trocar o responsável mantendo a mesma atividade

### G14 — Pré-condição ausente — filas vazias, massa inadequada e integrações que não devolveram dado

*Pré-condição ausente (ambiente / massa / latência) · 8 teste(s)*

Oito testes falham com `PRÉ-CONDIÇÃO AUSENTE`, de propósito, para não confundir ambiente com defeito: as filas de "Controle de Cotações" e "Avaliação de Propostas" estão vazias (consequência de fundo de D-01, que impede qualquer Cotação real de existir); nenhuma competência recusada pelo Protheus foi encontrada nos contratos amostrados; o usuário não tinha tarefa em pool no instante do teste de alcançabilidade; a grade não ofereceu contrato com `CNB_QUANT` vazio nem contrato com itens suficientes para o caso de valor multiplicado; o combo "UF" do Contencioso veio sem nenhuma opção; e o modal da SC não terminou de montar dentro do prazo. Nenhum destes é veredito sobre o produto — é o ambiente não tendo o que a medição exige.

Testes:
- **CT-ACC-06-S2 — Contrato de serviço sem quantidade**
  - `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:513` — CT-ACC-06-S2 — item sem quantidade no contrato deve herdar a cascata e o preço real, nunca R$ 1,00
- **CT-ACC-03-H — Abrir o modal de SC a partir do contrato ⭐ **caso-âncora do pedido do dev****
  - `e2e/acompanhamento-contratos/modal-solicitacao-compra.spec.js:50` — deve abrir o modal com os campos do solicitante em branco
- **CT-ACC-06-S1 — Itens zerados são descartados silenciosamente · D-02 — valor total do item multiplicado / repetido no payload**
  - `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:206` — itens com quantidade e preço diferentes não deveriam compartilhar o mesmo valor total
- **CT-COT-01-H — Cotação sem parecer técnico (feliz)**
  - `e2e/compras/ciclo-cotacao.spec.js:168` — CT-COT — a fila real de "Controle De Cotações" está vazia (pré-condição ausente para qualquer cenário com cotação real)
- **CT-NEG-01 — Negociar uma proposta real de fornecedor**
  - `e2e/compras/negociacao-proposta.spec.js:131` — CT-NEG — a fila real de "Avaliação de Propostas" está vazia (pré-condição ausente para validar/reprovar uma proposta real)
- **CT-FAT-02-S2 — Competência fechada**
  - `e2e/contratos/validacoes-faturamento.spec.js:79` — CT-FAT-02-S2: competência recusada pelo Protheus deve bloquear a medição E avisar o usuário
  - Reexecução em janela saudável: Na primeira passagem este teste estourou o timeout de 120 s do teste (janela degradada). Reexecutado, chegou a percorrer os contratos e reprovou com a pré-condição legível.
- **CT-FAT-02-S3 — Reprovação em uma das validações**
  - `e2e/contratos/validacoes-faturamento.spec.js:254` — CT-FAT-02-S3: reprovar uma validação (Validação CSE / Validação da Medição CSE / Validação do Fiscal de Contrato) não é alcançável — o usuário desta automação não pertence a nenhum grupo dessas etapas
- **CT-JUR-04-H — Contencioso — roteamento por área (feliz) · CT-JUR-06-H — Contencioso: nasce no pool certo?**
  - `e2e/juridico/sigajuri-contencioso.spec.js:113` — CT-JUR-04-H / CT-JUR-06-H deveria criar e rotear a solicitação pela UF e Responsável pela Demanda escolhidos, parando no pool certo @destrutivo


## Os 71 testes que reprovaram, um a um

### 1. deve retornar somente o registro do login filtrado, não a base inteira @bug

- **Arquivo:** `api/dataset-colleague-vazamento.spec.js:22` · **Suíte:** Vazamento de dados — dataset colleague sem aplicar constraint · **Duração:** 1.9 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-SEG-01-S1 — Dataset sem filtro no código (vazamento)  🔒 (observado)
- **Causa raiz:** G7 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos
- **O que acontece:** `POST /api/public/ecm/dataset/datasets` com constraint `colleagueId = <login>` devolve 3.493 registros — o mesmo total obtido sem nenhuma constraint.
- **Por que falha:** O dataset `colleague` ignora a constraint; qualquer sessão autenticada lê a base inteira de colaboradores.
- **Onde falha:** `expect(comFiltro).toBe(1)` em `dataset-colleague-vazamento.spec.js`. (local exato: `tests/api/dataset-colleague-vazamento.spec.js:60`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a resposta do dataset com e sem constraint. Este teste **não dirige interface** — a página nunca saiu de `about:blank`, por isso não há screenshot.

**Mensagem da falha:**

```
Error: a constraint 'colleagueId' não filtrou o resultado: retornou 3493 registros, o MESMO total obtido sem nenhuma constraint (3493). O endpoint expõe a base inteira de colaboradores. Ver CT-SEG-01-S1 / mapa-do-ambiente.md.

expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 3493
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/api/api-dataset-colleague-vaza-80913-rado-não-a-base-inteira-bug-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/api/api-dataset-colleague-vaza-80913-rado-não-a-base-inteira-bug-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/api/api-dataset-colleague-vaza-80913-rado-não-a-base-inteira-bug-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/api/api-dataset-colleague-vaza-80913-rado-não-a-base-inteira-bug-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=524963 npx playwright test tests/api/dataset-colleague-vazamento.spec.js -g "deve retornar somente o registro do login filtrado, não a base inteira @bug"`

---

### 2. CT-INT-02-S1 @bug: variantes de cache (_Sync) dos dados de RH e vigência de compra não devem estar em erro

- **Arquivo:** `api/sincronizacao-protheus.spec.js:31` · **Suíte:** Integração Protheus — sincronização e cache · **Duração:** 0.7 s · **Tags:** bug:
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-INT-02-S1 — Sincronização em erro  ⚠️ (U-12) · U-12 — variante de cache (_Sync) dos dados de RH em erro
- **Causa raiz:** G12 — Plataforma e portais — deep-link 404, erros de console, resíduo `teste`, aba Atribuir, Clínica vazia, cache _Sync e grade truncada
- **O que acontece:** `ds_protheus_getFuncionarios_restGetAll_Sync` e `ds_protheus_getFuncoes_restGetAll_Sync` respondem HTTP 500 `java.lang.NullPointerException` (ECMException).
- **Por que falha:** As variantes de cache/sincronização dos dados de RH estão quebradas; dado de RH e vigência de compra ficam defasados sem aviso.
- **Onde falha:** `expect(ok).toBe(true)` em `sincronizacao-protheus.spec.js`, iterando as variantes `_Sync`. (local exato: `tests/api/sincronizacao-protheus.spec.js:60`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a resposta HTTP 500 de cada variante `_Sync`, transcrita na mensagem. Teste de API, sem tela.

**Mensagem da falha:**

```
Error: dataset de sincronização 'ds_protheus_getFuncionarios_restGetAll_Sync' respondeu 500: {"content":"ERROR","message":{"message":"java.lang.NullPointerException","detail":"java.lang.NullPointerException","type":"ERROR","param":null,"errorCode":"ECMException"}}. Sincronização em erro deixa dado de RH/vigência de compra defasado sem aviso. Ver CT-INT-02-S1 / achado U-12.

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/api/api-sincronizacao-protheus-45c5a-pra-não-devem-estar-em-erro-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/api/api-sincronizacao-protheus-45c5a-pra-não-devem-estar-em-erro-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/api/api-sincronizacao-protheus-45c5a-pra-não-devem-estar-em-erro-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/api/api-sincronizacao-protheus-45c5a-pra-não-devem-estar-em-erro-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=326633 npx playwright test tests/api/sincronizacao-protheus.spec.js -g "CT-INT-02-S1 @bug: variantes de cache (_Sync) dos dados de RH e vigência de compra não devem estar em erro"`

---

### 3. CT-CMP-08-H @destrutivo @bug — reprovada e corrigida, a SC deveria voltar para a Validação do Gestor com o contrato de origem íntegro

- **Arquivo:** `e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js:242` · **Suíte:** Ciclo de retorno da SC: reprovação → Correção → reenvio (CT-CMP-08-H) · **Duração:** 112.9 s · **Tags:** destrutivo, bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-CMP-08-H — Fechar o ciclo de retorno: reprovação → Correção → reenvio
- **Causa raiz:** G5 — CT-CMP-08-H — o ciclo de correção é um beco sem saída: a SC reprovada não consegue voltar ao fluxo
- **O que acontece:** A SC 113225 percorreu Início → "Grava SC e Anexos" → Validação do Gestor → reprovação → "Ajustar Informações". Ao reenviar depois de corrigida, o Fluig recusou a movimentação com *"Existem campos de rateio sem preenchimento. Preencha todos os campos e tente novamente."*
- **Por que falha:** O rateio veio do próprio contrato de origem e não foi editado por ninguém — mesmo assim a validação de movimentação o considera incompleto. A SC fica presa em "Ajustar Informações" com o solicitante, sem caminho de volta ao fluxo. Histórico completo de movimentações no cartão.
- **Onde falha:** `expect` do estado após o reenvio em `ciclo-correcao-reenvio.spec.js`. (local exato: `tests/e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js:406`)
- **Reexecução em janela saudável:** Na primeira passagem (09h35) este teste parou em `AcompanhamentoContratosPage.expectCarregada()` porque a grade do Protheus estava devolvendo zero contratos. Reexecutado às 11h51, com a grade sustentando 845 registros, **alcançou a assertion de domínio e confirmou o defeito** — é o veredito que em 02/09 só existia como medição suplementar.
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: DEFEITO (CT-CMP-08-H): a SC 113225 não pode ser reenviada depois de corrigida. O Fluig RECUSOU a movimentação da etapa "Ajustar Informações" com: "× Close Erro Erro ao validar as informações do formulário para movimentação. Error: Error: Existem campos de rateio sem preenchimento. Preencha todos os campos e tente novamente. Ok, entendi". A SC continua em "Ajustar Informações" com "TOTVS-FS" — ou seja, o caminho de retorno é um beco sem saída: o gestor reprova, a solicitação volta para o solicitante e ele não consegue devolvê-la ao fluxo. Histórico: ["mov1|294:Compra Centralizada?|COMPLETED|TOTVS-FS","mov2|233:Grava SC e Anexos|COMPLETED|System:Auto","mov3|7:Validação do Gestor|COMPLETED|System:Auto","mov4|7:Validação do Gestor|TRANSFERRED|Pool:Group:G.P.Requisicao_de_Compras_Gestor_Imediato","mov4|9:Sol. Validação do Gestor|COMPLETED|TOTVS-FS","mov5|11:Ajustar Informações|COMPLETED|System:Auto","mov6|11:Ajustar Informações|NOT_COMPLETED|TOTVS-FS"]
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/01/e2e-acompanhamento-contrat-6513b--contrato-de-origem-íntegro-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/01/e2e-acompanhamento-contrat-6513b--contrato-de-origem-íntegro-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/01/e2e-acompanhamento-contrat-6513b--contrato-de-origem-íntegro-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/01/e2e-acompanhamento-contrat-6513b--contrato-de-origem-íntegro-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=60050 npx playwright test tests/e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js -g "CT-CMP-08-H @destrutivo @bug — reprovada e corrigida, a SC deveria voltar para a Validação do Gestor com o contrato de origem íntegro"`

---

### 4. @destrutivo @bug estado inicial e responsável deveriam refletir uma etapa de trabalho do solicitante

- **Arquivo:** `e2e/acompanhamento-contratos/ciclo-gestor.spec.js:36` · **Suíte:** A SC criada nasce no estado e no dono corretos (CT-E2E-01-H) · **Duração:** 24.8 s · **Tags:** destrutivo, bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-E2E-01-H — Etapa 1 — SC nasce no estado correto e com o dono correto · D-01 — a SC nasce presa no marco de Início, na conta de integração
- **Causa raiz:** G1 — D-01 — a SC nasce presa no marco de Início, na conta de integração
- **O que acontece:** A SC criada nasce com estado "Início" — o marco de início do BPMN — em vez de uma etapa de trabalho do solicitante.
- **Por que falha:** Consequência direta de D-01: o widget envia `targetState: 6` e a transferência para o solicitante falha, deixando a SC no marco de início sob a conta de integração.
- **Onde falha:** `expect` do estado inicial em `ciclo-gestor.spec.js`. (local exato: `tests/e2e/acompanhamento-contratos/ciclo-gestor.spec.js:98`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a etapa em que a solicitação realmente parou, lida no detalhe do processo e citada na mensagem da falha.

**Mensagem da falha:**

```
Error: estado inicial "Início" — deveria ser uma etapa de trabalho, não o marco de Início do BPMN

expect(received).not.toBe(expected) // Object.is equality

Expected: not "Início"
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/02/e2e-acompanhamento-contrat-107c0--de-trabalho-do-solicitante-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/02/e2e-acompanhamento-contrat-107c0--de-trabalho-do-solicitante-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/02/e2e-acompanhamento-contrat-107c0--de-trabalho-do-solicitante-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/02/e2e-acompanhamento-contrat-107c0--de-trabalho-do-solicitante-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=872137 npx playwright test tests/e2e/acompanhamento-contratos/ciclo-gestor.spec.js -g "@destrutivo @bug estado inicial e responsável deveriam refletir uma etapa de trabalho do solicitante"`

---

### 5. @destrutivo @bug aprovada pelo Gestor Imediato, a SC deveria avançar para Validação Orçamentária

- **Arquivo:** `e2e/acompanhamento-contratos/ciclo-gestor.spec.js:109` · **Suíte:** Gestor Imediato assume do pool e aprova (CT-E2E-02-H) · **Duração:** 66.1 s · **Tags:** destrutivo, bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-E2E-02-H — Etapa 2 — Validação do Gestor Imediato (aprovar) · D-01 — a SC nasce presa no marco de Início, na conta de integração
- **Causa raiz:** G1 — D-01 — a SC nasce presa no marco de Início, na conta de integração
- **O que acontece:** A SC 113195 ficou em estado "Início" e nunca chegou à "Validação do Gestor", então não há tarefa para o Gestor Imediato assumir e aprovar.
- **Por que falha:** D-01 mantém a solicitação presa no marco de início; ela não entra em pool algum, e a etapa seguinte do ciclo fica inalcançável.
- **Onde falha:** Poll por "Validação do Gestor" em `ciclo-gestor.spec.js`. (local exato: `tests/e2e/acompanhamento-contratos/ciclo-gestor.spec.js:139`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a etapa em que a solicitação realmente parou, lida no detalhe do processo e citada na mensagem da falha.

**Mensagem da falha:**

```
Error: SC 113195: estado atual "Início" — esperando "Validação do Gestor" (bloqueado por D-01: a SC nasce presa no marco de Início e não chega a nenhuma etapa de trabalho, logo nunca aparece em pool algum)

expect(received).toBe(expected) // Object.is equality

Expected: "Validação do Gestor"
Received: "Início"

Call Log:
- Timeout 45000ms exceeded while waiting on the predicate
```

**Evidências:**
- (teste de API — sem tela; a evidência é a resposta do endpoint na mensagem acima)
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/03/e2e-acompanhamento-contrat-1b32f-para-Validação-Orçamentária-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/03/e2e-acompanhamento-contrat-1b32f-para-Validação-Orçamentária-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/03/e2e-acompanhamento-contrat-1b32f-para-Validação-Orçamentária-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=681895 npx playwright test tests/e2e/acompanhamento-contratos/ciclo-gestor.spec.js -g "@destrutivo @bug aprovada pelo Gestor Imediato, a SC deveria avançar para Validação Orçamentária"`

---

### 6. @destrutivo @bug reprovada, a SC deveria voltar para Ajustar Informações com o solicitante, itens e contrato íntegros

- **Arquivo:** `e2e/acompanhamento-contratos/ciclo-gestor.spec.js:155` · **Suíte:** Gestor Imediato reprova com justificativa (CT-E2E-02-S1) · **Duração:** 63.4 s · **Tags:** destrutivo, bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-E2E-02-S1 — Etapa 2 — Reprovação devolve para correção **preservando os dados do contrato** · D-01 — a SC nasce presa no marco de Início, na conta de integração
- **Causa raiz:** G1 — D-01 — a SC nasce presa no marco de Início, na conta de integração
- **O que acontece:** A SC 113197 ficou em "Início" — o cenário de reprovar com justificativa e devolver a SC para "Ajustar Informações" não é alcançável.
- **Por que falha:** Mesma causa de D-01. O cabeçalho do arquivo já registra a dependência.
- **Onde falha:** Poll por "Validação do Gestor" em `ciclo-gestor.spec.js`. (local exato: `tests/e2e/acompanhamento-contratos/ciclo-gestor.spec.js:192`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a etapa em que a solicitação realmente parou, lida no detalhe do processo e citada na mensagem da falha.

**Mensagem da falha:**

```
Error: SC 113197: estado atual "Início" — esperando "Validação do Gestor" (bloqueado por D-01, ver cabeçalho do arquivo)

expect(received).toBe(expected) // Object.is equality

Expected: "Validação do Gestor"
Received: "Início"

Call Log:
- Timeout 45000ms exceeded while waiting on the predicate
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/04/e2e-acompanhamento-contrat-ee43f-e-itens-e-contrato-íntegros-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/04/e2e-acompanhamento-contrat-ee43f-e-itens-e-contrato-íntegros-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/04/e2e-acompanhamento-contrat-ee43f-e-itens-e-contrato-íntegros-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/04/e2e-acompanhamento-contrat-ee43f-e-itens-e-contrato-íntegros-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=692884 npx playwright test tests/e2e/acompanhamento-contratos/ciclo-gestor.spec.js -g "@destrutivo @bug reprovada, a SC deveria voltar para Ajustar Informações com o solicitante, itens e contrato íntegros"`

---

### 7. @destrutivo @bug a SC deveria nascer atribuída ao solicitante logado, não à conta de integração

- **Arquivo:** `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:112` · **Suíte:** Confirmar cria a SC e ela deveria chegar ao solicitante (CT-ACC-05-H / D-01) · **Duração:** 27.0 s · **Tags:** destrutivo, bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-ACC-05-H — Confirmar cria a SC e ela chega ao solicitante ⭐ **caso-âncora do pedido do dev** · D-01 — a SC nasce presa no marco de Início, na conta de integração
- **Causa raiz:** G1 — D-01 — a SC nasce presa no marco de Início, na conta de integração
- **O que acontece:** A SC 113198 nasceu com responsável "Usuário Integrador Fluig" em vez do solicitante logado.
- **Por que falha:** A transferência (`dsFluig_postProcessesTransfer`) falha e a SC permanece na conta de integração — a evidência mais direta de D-01, medida na solicitação já criada.
- **Onde falha:** `expect` do responsável da SC criada em `criacao-solicitacao.spec.js`. (local exato: `tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:181`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é o responsável da SC criada, consultado no servidor e citado na mensagem ("Usuário Integrador Fluig").

**Mensagem da falha:**

```
Error: a SC 113198 nasceu com responsável "Usuário Integrador Fluig" — deveria ser o solicitante logado (ou uma etapa/pool legítima), não a conta de integração

expect(received).not.toBe(expected) // Object.is equality

Expected: not "Usuário Integrador Fluig"
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/05/e2e-acompanhamento-contrat-a35b5-o-não-à-conta-de-integração-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/05/e2e-acompanhamento-contrat-a35b5-o-não-à-conta-de-integração-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/05/e2e-acompanhamento-contrat-a35b5-o-não-à-conta-de-integração-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/05/e2e-acompanhamento-contrat-a35b5-o-não-à-conta-de-integração-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=880895 npx playwright test tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js -g "@destrutivo @bug a SC deveria nascer atribuída ao solicitante logado, não à conta de integração"`

---

### 8. @destrutivo @bug item de quantidade/valor zerado no contrato não deveria virar item extra na SC criada

- **Arquivo:** `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:224` · **Suíte:** Item sem quantidade e sem valor no contrato não pode virar item da SC (CT-ACC-06-S1) · **Duração:** 17.4 s · **Tags:** destrutivo, bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-ACC-06-S1 — Itens zerados são descartados silenciosamente · D-02 — valor total do item multiplicado / repetido no payload
- **Causa raiz:** G2 — Payload da SC — itens fantasma, campos chumbados, classeValor vazio e revisão incoerente (D-02, D-04, CT-ACC-04-S5, CT-ACC-06)
- **O que acontece:** No contrato 00002-2026-3201 o Protheus tem 3 itens (1 com quantidade e valor, 2 sem nenhum dos dois) e a SC nasceu com os 3. Quantidades enviadas: `[1,48,1]`.
- **Por que falha:** O serviço FABRICA quantidade para os itens vazios (cascata `resolveQuant` → fallback 1 em contrato de serviços) e com isso eles passam pelo filtro `quant > 0` que deveria descartá-los.
- **Onde falha:** `expect` da contagem de itens da SC criada em `criacao-solicitacao.spec.js`. (local exato: `tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:287`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é o corpo do `POST /wf_solicitacao_compras/start` interceptado por `utils/captura-payload.js` — anexado a este cartão e citado na mensagem da falha. Nenhum campo de payload é visível numa screenshot.

**Mensagem da falha:**

```
Error: contrato 00002-2026-3201: o Protheus tem 3 itens (1 com quantidade e valor + 2 sem nenhum dos dois), mas a SC nasceu com 3. Os itens sem quantidade não foram descartados: o serviço FABRICA quantidade para eles (cascata `resolveQuant` → fallback 1 em contrato de serviços) e com isso eles passam pelo filtro `quant > 0`. Quantidades enviadas: [1,48,1]

expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 3
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/06/e2e-acompanhamento-contrat-38f02-rar-item-extra-na-SC-criada-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/06/e2e-acompanhamento-contrat-38f02-rar-item-extra-na-SC-criada-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/06/e2e-acompanhamento-contrat-38f02-rar-item-extra-na-SC-criada-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/06/e2e-acompanhamento-contrat-38f02-rar-item-extra-na-SC-criada-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=719915 npx playwright test tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js -g "@destrutivo @bug item de quantidade/valor zerado no contrato não deveria virar item extra na SC criada"`

---

### 9. @destrutivo @bug o servidor deveria recusar tipoSolicitacao vazio tanto quanto recusa motivoSolCompra vazio

- **Arquivo:** `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:292` · **Suíte:** Bypass da validação de cliente no start direto (CT-ACC-04-S6 / D-10) · **Duração:** 17.8 s · **Tags:** destrutivo, bug
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-ACC-04-S6 — Bypass da validação de cliente · D-10
- **Causa raiz:** G4 — Validação só no cliente — o servidor aceita tipoSolicitação vazio e não alerta duplicidade
- **O que acontece:** Um start direto com `tipoSolicitacao` vazio respondeu **HTTP 200** e criou a solicitação. O mesmo servidor recusa `motivoSolCompra` vazio.
- **Por que falha:** A obrigatoriedade do tipo existe apenas na validação de tela; quem chamar a API direto contorna a regra. Assimetria com o motivo, que é validado no servidor.
- **Onde falha:** `expect(status)` da resposta do start em `criacao-solicitacao.spec.js`. (local exato: `tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:411`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é o **HTTP 200** devolvido ao start com `tipoSolicitacao` vazio, com o corpo da resposta na mensagem da falha.

**Mensagem da falha:**

```
Error: tipoSolicitacao vazio deveria ser recusado pelo servidor (como motivoSolCompra vazio é), mas respondeu 200: {"possibleAssignees":[],"toShowPossibleAssignees":false,"jointActivity":false,"reachedPercentageForJointActivity":null,"highestTaskForJointActivity":null,"highestAssigneeForJointActivity":null,"nextState":0,"nextGateway":null,"nextStateName":null,"gatewayComment":null,"gatewayCondition":0,"useManage

expect(received).not.toBe(expected) // Object.is equality

Expected: not 200
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/07/e2e-acompanhamento-contrat-9061f-ecusa-motivoSolCompra-vazio-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/07/e2e-acompanhamento-contrat-9061f-ecusa-motivoSolCompra-vazio-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/07/e2e-acompanhamento-contrat-9061f-ecusa-motivoSolCompra-vazio-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/07/e2e-acompanhamento-contrat-9061f-ecusa-motivoSolCompra-vazio-e2e/error-context.md`
- anexo do teste `starts-diretos`:

  ```json
  {
    "o que este teste mede": "se o SERVIDOR valida os campos que o modal marca como obrigatórios, quando o start é disparado direto, sem passar pela tela",
    "atenção": "a screenshot deste teste mostra um alerta de erro do passo de captura, que foi abortado de propósito. Ela não é evidência do resultado.",
    "tipoSolicitacao vazio": {
      "status": 200,
      "esperado": "recusa (4xx/5xx)",
      "corpo": "{\"possibleAssignees\":[],\"toShowPossibleAssignees\":false,\"jointActivity\":false,\"reachedPercentageForJointActivity\":null,\"highestTaskForJointActivity\":null,\"highestAssigneeForJointActivity\":null,\"nextState\":0,\"nextGateway\":null,\"nextStateName\":null,\"gatewayComment\":null,\"gatewayCondition\":0,\"useManagerAssignees\":false,\"conversionLog\":null,\"conversionSequence\":null,\"cardId\":708371,\"cardVersion\":1000,\"subProcessRequests\":[],\"processId\":\"wf_solicitacao_compras\",\"processVersion\":98,\"processInstanceId\":113200,\"_expandables\":[\"possibleAssignees\"]}"
    },
    "motivoSolCompra vazio": {
      "status": 500,
      "esperado": 500,
      "corpo": "{Erro ao salvar dados de formulário: \n\n<br/><b class=\"text-danger fs-font-bold\">- O campo \"Justificativa par
  ```
**Reproduzir:** `FAKER_SEED=233010 npx playwright test tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js -g "@destrutivo @bug o servidor deveria recusar tipoSolicitacao vazio tanto quanto recusa motivoSolCompra vazio"`

---

### 10. @destrutivo @bug o portal deveria alertar sobre a SC já em andamento para o mesmo contrato/revisão

- **Arquivo:** `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:422` · **Suíte:** Segunda SC para o mesmo contrato/revisão sem alerta de duplicidade (CT-E2E-12-S1) · **Duração:** 38.9 s · **Tags:** destrutivo, bug
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-E2E-12-S1 — Duas SCs para o mesmo contrato/revisão
- **Causa raiz:** G4 — Validação só no cliente — o servidor aceita tipoSolicitação vazio e não alerta duplicidade
- **O que acontece:** Com a solicitação 113202 já em andamento para o contrato 00007-2023-2301, reabrir o modal do mesmo contrato/revisão não exibe aviso algum de duplicidade.
- **Por que falha:** Não há verificação de solicitação em andamento para o par contrato/revisão — nada impede duas SCs concorrentes para o mesmo objeto.
- **Onde falha:** Busca pelo aviso de duplicidade em `criacao-solicitacao.spec.js`. (local exato: `tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:457`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a AUSÊNCIA de aviso de duplicidade — o print mostra o modal reaberto e sem alerta, mas quem sustenta a afirmação é a solicitação 113202 já em andamento, citada na mensagem.

**Mensagem da falha:**

```
Error: nenhum aviso apareceu ao reabrir a SC do contrato 00007-2023-2301, mesmo já existindo a solicitação 113202 em andamento para o mesmo contrato/revisão

expect(locator).toBeVisible() failed

Locator: getByText(/113202|em andamento|já existe|já possui/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/08/e2e-acompanhamento-contrat-c3ced-ra-o-mesmo-contrato-revisão-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/08/e2e-acompanhamento-contrat-c3ced-ra-o-mesmo-contrato-revisão-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/08/e2e-acompanhamento-contrat-c3ced-ra-o-mesmo-contrato-revisão-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/08/e2e-acompanhamento-contrat-c3ced-ra-o-mesmo-contrato-revisão-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=540413 npx playwright test tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js -g "@destrutivo @bug o portal deveria alertar sobre a SC já em andamento para o mesmo contrato/revisão"`

---

### 11. CT-ACC-06-S2 — item sem quantidade no contrato deve herdar a cascata e o preço real, nunca R$ 1,00

- **Arquivo:** `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:513` · **Suíte:** Quantidade e valor em contrato de serviço sem CNB_QUANT (CT-ACC-06-S2) · **Duração:** 33.0 s
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Caso de teste:** CT-ACC-06-S2 — Contrato de serviço sem quantidade
- **Causa raiz:** G14 — Pré-condição ausente — filas vazias, massa inadequada e integrações que não devolveram dado
- **O que acontece:** Nenhum contrato vigente pequeno com item de `CNB_QUANT` vazio e `CNB_QTDORI` preenchido foi encontrado em 15 tentativas da grade.
- **Por que falha:** Sem essa massa não há como exercitar a cascata de quantidade. O teste reprova com `PRÉ-CONDIÇÃO AUSENTE` de propósito, para não ser lido como defeito.
- **Onde falha:** `utils/massa-contratos.js` após 15 tentativas, em `criacao-solicitacao.spec.js`. (local exato: `tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:527`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a varredura de 15 contratos da grade sem encontrar a massa exigida, relatada na mensagem. Não há o que mostrar em tela.

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: nenhum contrato vigente pequeno com item de `CNB_QUANT` vazio e `CNB_QTDORI` preenchido foi encontrado em 15 tentativas — sem essa massa não há como exercitar a cascata de quantidade. Não é defeito do produto.

expect(received).toBeTruthy()

Received: null
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-feea0-e-o-preço-real-nunca-R-1-00-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-feea0-e-o-preço-real-nunca-R-1-00-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-feea0-e-o-preço-real-nunca-R-1-00-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-feea0-e-o-preço-real-nunca-R-1-00-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=319543 npx playwright test tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js -g "CT-ACC-06-S2 — item sem quantidade no contrato deve herdar a cascata e o preço real, nunca R$ 1,00"`

---

### 12. @bug deve avisar quando a SC é criada mas não pôde ser atribuída ao solicitante, em vez de anunciar sucesso pleno

- **Arquivo:** `e2e/acompanhamento-contratos/erros-no-start.spec.js:67` · **Suíte:** Sucesso simulado com falha na transferência da tarefa (D-01 / CT-ACC-05-S1) · **Duração:** 33.2 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-ACC-05-S1 — Falha na transferência deixa a SC com a conta de integração ⚠️ · D-01 — a SC nasce presa no marco de Início, na conta de integração
- **Causa raiz:** G1 — D-01 — a SC nasce presa no marco de Início, na conta de integração
- **O que acontece:** Com a transferência (`dsFluig_postProcessesTransfer`) forçada a HTTP 500, a única mensagem exibida foi o toast de sucesso — nenhum aviso de que a SC não pôde ser atribuída ao solicitante.
- **Por que falha:** O erro da transferência é engolido pelo widget: a tarefa fica na conta de integração e o usuário sai da tela achando que está tudo certo. É o sintoma de D-01 do ponto de vista de quem usa.
- **Onde falha:** Predicado que procura um aviso de falha entre todos os avisos exibidos, em `erros-no-start.spec.js`. (local exato: `tests/e2e/acompanhamento-contratos/erros-no-start.spec.js:141`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a lista de TODOS os avisos que a aplicação exibiu depois do erro forçado — está na mensagem da falha. O print pega um instante; a lista cobre a janela inteira.

**Mensagem da falha:**

```
Error: defeito D-01 (sintoma): a transferência da tarefa falhou (dsFluig_postProcessesTransfer → HTTP 500) e a aplicação deveria avisar que a SC não pôde ser atribuída ao solicitante. Abaixo, TODOS os avisos que ela exibiu — se aparecer apenas o toast de sucesso, o erro foi engolido e a tarefa fica presa na conta de integração sem o usuário saber

defeito D-01 (sintoma): a transferência da tarefa falhou (dsFluig_postProcessesTransfer → HTTP 500) e a aplicação deveria avisar que a SC não pôde ser atribuída ao solicitante. Abaixo, TODOS os avisos que ela exibiu — se aparecer apenas o toast de sucesso, o erro foi engolido e a tarefa fica presa na conta de integração sem o usuário saber

expect(received).toEqual(expected) // deep equality

Expected: ArrayContaining [StringMatching /n(ã|a)o p(ô|o)de ser atribu(í|i)da/i]
Received: ["Sucesso! Processo 999999 iniciado com sucesso! × Close"]

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-03fa6-z-de-anunciar-sucesso-pleno-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-03fa6-z-de-anunciar-sucesso-pleno-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-03fa6-z-de-anunciar-sucesso-pleno-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-03fa6-z-de-anunciar-sucesso-pleno-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=202397 npx playwright test tests/e2e/acompanhamento-contratos/erros-no-start.spec.js -g "@bug deve avisar quando a SC é criada mas não pôde ser atribuída ao solicitante, em vez de anunciar sucesso pleno"`

---

### 13. CT-ACC-02-S1 @bug — deve exibir a situação do contrato por extenso, sem truncar

- **Arquivo:** `e2e/acompanhamento-contratos/grade-contratos.spec.js:45` · **Suíte:** Grade de contratos · **Duração:** 16.0 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-ACC-02-S1 — Status do contrato exibido de forma legível · D-08
- **Causa raiz:** G12 — Plataforma e portais — deep-link 404, erros de console, resíduo `teste`, aba Atribuir, Clínica vazia, cache _Sync e grade truncada
- **O que acontece:** A coluna "Situação" da grade exibe `Finali`, `Paralisa`, `Sol.Finali`, `Cancel.` — textos truncados em vez de "Finalizado", "Paralisado", "Solicitação de Finalização", "Cancelado".
- **Por que falha:** O widget renderiza o valor bruto do Protheus (ou corta por largura) sem mapear para o rótulo por extenso.
- **Onde falha:** `expect(truncadas).toEqual([])` em `grade-contratos.spec.js`, após ler todas as células da coluna. (local exato: `tests/e2e/acompanhamento-contratos/grade-contratos.spec.js:62`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: situações exibidas de forma truncada/ilegível na grade: ["Finali","Paralisa","Sol.Finali","Cancel."]

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 6

- Array []
+ Array [
+   "Finali",
+   "Paralisa",
+   "Sol.Finali",
+   "Cancel.",
+ ]
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-1ba8f-ato-por-extenso-sem-truncar-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-1ba8f-ato-por-extenso-sem-truncar-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-1ba8f-ato-por-extenso-sem-truncar-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-1ba8f-ato-por-extenso-sem-truncar-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=80743 npx playwright test tests/e2e/acompanhamento-contratos/grade-contratos.spec.js -g "CT-ACC-02-S1 @bug — deve exibir a situação do contrato por extenso, sem truncar"`

---

### 14. @bug deve exibir um alerta por dado indisponível, nomeando o dado que faltou

- **Arquivo:** `e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js:54` · **Suíte:** Indisponibilidade do Protheus ao abrir a Solicitação de Compra · **Duração:** 13.8 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** D-11
- **Causa raiz:** G12 — Plataforma e portais — deep-link 404, erros de console, resíduo `teste`, aba Atribuir, Clínica vazia, cache _Sync e grade truncada
- **O que acontece:** Com o dataset `dsProtheus_getItensPlanilha_restGetAll` derrubado (simulação via `derrubarDataset`), o alerta exibido é "Erro ao buscar dados da filial" — o rótulo de outro dataset.
- **Por que falha:** O handler de erro dos itens da planilha reutiliza a mensagem da filial. Com o Protheus fora, os dois avisos ficam idênticos — é a origem da leitura de que o "mesmo alerta aparece duas vezes".
- **Onde falha:** `expect(texto).toMatch(/iten|planilha/i)` em `indisponibilidade-protheus.spec.js`. (local exato: `tests/e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js:141`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: defeito: o alerta não nomeia o dado que faltou — a falha do dataset `dsProtheus_getItensPlanilha_restGetAll` (itens da planilha do contrato) é anunciada ao usuário com o rótulo "Erro ao buscar dados da filial". Rótulo errado, e é a origem da leitura de que o "mesmo alerta aparece duas vezes" quando os dois datasets caem juntos

expect(received).toMatch(expected)

Expected pattern: /iten|planilha/i
Received string:  "ERRO: Erro ao buscar dados da filial: "
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-ea1ad--nomeando-o-dado-que-faltou-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-ea1ad--nomeando-o-dado-que-faltou-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-ea1ad--nomeando-o-dado-que-faltou-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-ea1ad--nomeando-o-dado-que-faltou-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=693637 npx playwright test tests/e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js -g "@bug deve exibir um alerta por dado indisponível, nomeando o dado que faltou"`

---

### 15. deve abrir o modal com os campos do solicitante em branco

- **Arquivo:** `e2e/acompanhamento-contratos/modal-solicitacao-compra.spec.js:50` · **Suíte:** Abertura da Solicitação de Compra a partir do contrato · **Duração:** 47.5 s
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Caso de teste:** CT-ACC-03-H — Abrir o modal de SC a partir do contrato ⭐ **caso-âncora do pedido do dev**
- **Causa raiz:** G14 — Pré-condição ausente — filas vazias, massa inadequada e integrações que não devolveram dado
- **O que acontece:** O modal da Solicitação de Compra não terminou de montar: a espera pelo estado carregado estourou 45 s.
- **Por que falha:** A montagem do modal encadeia sete datasets no Protheus; quando um deles demora além do orçamento, o teste aborta antes de qualquer assertion sobre os campos do solicitante. Não é veredito sobre o produto.
- **Onde falha:** `AcompanhamentoContratosPage.expectCarregada()` — `pages/AcompanhamentoContratosPage.js:51`. (local exato: `pages/AcompanhamentoContratosPage.js:51`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
TimeoutError: locator.waitFor: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-096b6-os-do-solicitante-em-branco-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-096b6-os-do-solicitante-em-branco-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-096b6-os-do-solicitante-em-branco-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-096b6-os-do-solicitante-em-branco-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=334797 npx playwright test tests/e2e/acompanhamento-contratos/modal-solicitacao-compra.spec.js -g "deve abrir o modal com os campos do solicitante em branco"`

---

### 16. @bug a SC deve nascer numa etapa de trabalho atribuída ao solicitante, não presa no marco de Início da conta de integração

- **Arquivo:** `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:64` · **Suíte:** Payload de start — targetState e targetAssignee (D-01 / CT-E2E-01-H) · **Duração:** 15.0 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-E2E-01-H — Etapa 1 — SC nasce no estado correto e com o dono correto · D-01 — a SC nasce presa no marco de Início, na conta de integração
- **Causa raiz:** G1 — D-01 — a SC nasce presa no marco de Início, na conta de integração
- **O que acontece:** O payload capturado no `/wf_solicitacao_compras/start` traz `targetState: 6` — a SC nasce presa no marco de Início do BPMN.
- **Por que falha:** É a causa de D-01 isolada no próprio payload, sem depender do que acontece depois. Interceptar e ler o corpo prova o defeito sem gravar nada.
- **Onde falha:** `expect` sobre `targetState` do payload capturado, em `payload-solicitacao.spec.js`. (local exato: `tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js:79`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é o corpo do `POST /wf_solicitacao_compras/start` interceptado por `utils/captura-payload.js` — anexado a este cartão e citado na mensagem da falha. Nenhum campo de payload é visível numa screenshot. O "Erro ao iniciar processo" visível ao fundo é efeito do próprio aborto da requisição pela técnica de captura — **não é o defeito**.

**Mensagem da falha:**

```
Error: a SC nasceu presa no marco de Início do BPMN (targetState=6)

expect(received).not.toBe(expected) // Object.is equality

Expected: not 6
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-83210-ício-da-conta-de-integração-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-83210-ício-da-conta-de-integração-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-83210-ício-da-conta-de-integração-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-83210-ício-da-conta-de-integração-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=682407 npx playwright test tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js -g "@bug a SC deve nascer numa etapa de trabalho atribuída ao solicitante, não presa no marco de Início da conta de integração"`

---

### 17. itens com quantidade e preço diferentes não deveriam compartilhar o mesmo valor total

- **Arquivo:** `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:206` · **Suíte:** Payload de start — valor multiplicado (D-02 / CT-ACC-06-S1) · **Duração:** 45.8 s
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Caso de teste:** CT-ACC-06-S1 — Itens zerados são descartados silenciosamente · D-02 — valor total do item multiplicado / repetido no payload
- **Causa raiz:** G14 — Pré-condição ausente — filas vazias, massa inadequada e integrações que não devolveram dado
- **O que acontece:** Passaram-se 30 s desde o Confirmar e a requisição de start nunca foi disparada (0 capturadas).
- **Por que falha:** O widget só envia quando o contrato traz ITENS. A planilha do contrato sorteado veio sem produtos ou sem rateios, então o Confirmar corretamente não faz nada — é massa inadequada para este caso, não defeito.
- **Onde falha:** `utils/captura-payload.js:128`, chamado de `payload-solicitacao.spec.js`. (local exato: `utils/captura-payload.js:128`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a ausência de qualquer requisição de start em 30 s, contada por `utils/captura-payload.js`.

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: passaram-se 30000ms desde o Confirmar e a requisição de start de índice 0 nunca foi disparada (0 capturada(s) até aqui). O widget só envia quando o contrato traz ITENS: se a planilha do contrato escolhido vier sem produtos ou sem rateios, o modal abre, aceita o preenchimento e o Confirmar não faz nada — comportamento correto, já documentado em indisponibilidade-protheus.spec.js. Isto NÃO é defeito do produto nem falha da automação: é massa inadequada para este caso. Confira os itens do contrato antes de interpretar o resultado.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-671c9-rtilhar-o-mesmo-valor-total-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-671c9-rtilhar-o-mesmo-valor-total-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-671c9-rtilhar-o-mesmo-valor-total-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-671c9-rtilhar-o-mesmo-valor-total-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=140803 npx playwright test tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js -g "itens com quantidade e preço diferentes não deveriam compartilhar o mesmo valor total"`

---

### 18. @bug classeOrca, classificação e o descritor deveriam refletir o contrato de origem, não vir fixos para todos

- **Arquivo:** `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:264` · **Suíte:** Payload de start — campos chumbados (D-04 / CT-ACC-07-S1) · **Duração:** 30.1 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-ACC-07-S1 — Valores fixos no payload da SC · D-04 — campos do payload chumbados, sem seguir o contrato de origem
- **Causa raiz:** G2 — Payload da SC — itens fantasma, campos chumbados, classeValor vazio e revisão incoerente (D-02, D-04, CT-ACC-04-S5, CT-ACC-06)
- **O que acontece:** `campoDescritor` vem "Sol. Compras - CASSI SEDE" tanto para a filial UNIDADE - CLINICASSI FORTALEZA - CE quanto para UNIDADE - CLINICASSI FLORIANOPOLIS - SC.
- **Por que falha:** O campo é chumbado no montador do payload e não acompanha a filial do contrato de origem — dois contratos de filiais diferentes produzem o mesmo descritor.
- **Onde falha:** `expect` comparando o descritor de dois contratos de filiais distintas, em `payload-solicitacao.spec.js`. (local exato: `tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js:301`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é o corpo do `POST /wf_solicitacao_compras/start` interceptado por `utils/captura-payload.js` — anexado a este cartão e citado na mensagem da falha. Nenhum campo de payload é visível numa screenshot.

**Mensagem da falha:**

```
Error: campoDescritor não acompanha a filial: LIMPO="Sol. Compras - CASSI SEDE" (UNIDADE - CLINICASSI FORTALEZA - CE), MEDIO="Sol. Compras - CASSI SEDE" (UNIDADE - CLINICASSI FLORIANOPOLIS - SC)

expect(received).not.toBe(expected) // Object.is equality

Expected: not "Sol. Compras - CASSI SEDE"
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-72dbf-em-não-vir-fixos-para-todos-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-72dbf-em-não-vir-fixos-para-todos-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-72dbf-em-não-vir-fixos-para-todos-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-72dbf-em-não-vir-fixos-para-todos-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=485215 npx playwright test tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js -g "@bug classeOrca, classificação e o descritor deveriam refletir o contrato de origem, não vir fixos para todos"`

---

### 19. @bug classeValor do item deveria vir preenchido junto com classeOrca e classificação

- **Arquivo:** `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:384` · **Suíte:** Payload de start — integridade dos valores e do rateio (CT-ACC-08-S1 / CT-ACC-08-S2) · **Duração:** 19.4 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** classeValor vazio
- **Causa raiz:** G2 — Payload da SC — itens fantasma, campos chumbados, classeValor vazio e revisão incoerente (D-02, D-04, CT-ACC-04-S5, CT-ACC-06)
- **O que acontece:** `tbprod_classeValor` vem vazio nos itens, enquanto `classeOrca` e `classificacao` vêm preenchidos no mesmo item.
- **Por que falha:** O montador do payload não resolve a classe de valor do item, embora resolva os dois campos vizinhos — o dado chega incompleto ao Protheus.
- **Onde falha:** `expect` sobre `tbprod_classeValor` do item, em `payload-solicitacao.spec.js`. (local exato: `tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js:405`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é o corpo do `POST /wf_solicitacao_compras/start` interceptado por `utils/captura-payload.js` — anexado a este cartão e citado na mensagem da falha. Nenhum campo de payload é visível numa screenshot.

**Mensagem da falha:**

```
Error: tbprod_classeValor do item veio vazio (classeOrca e classificacao vieram preenchidos no mesmo item)

expect(received).toHaveLength(expected)

Expected length: 0
Received length: 4
Received array:  ["#1", "#2", "#3", "#4"]
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-71dd2--classeOrca-e-classificação-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-71dd2--classeOrca-e-classificação-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-71dd2--classeOrca-e-classificação-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-71dd2--classeOrca-e-classificação-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=202835 npx playwright test tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js -g "@bug classeValor do item deveria vir preenchido junto com classeOrca e classificação"`

---

### 20. @bug não deve permitir que nrContrato divirja do contrato real da revisão/filial/itens enviados

- **Arquivo:** `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:479` · **Suíte:** Payload de start — número de contrato incoerente (CT-ACC-04-S5) · **Duração:** 29.5 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-ACC-04-S5 — Número do contrato alterado à mão no modal
- **Causa raiz:** G2 — Payload da SC — itens fantasma, campos chumbados, classeValor vazio e revisão incoerente (D-02, D-04, CT-ACC-04-S5, CT-ACC-06)
- **O que acontece:** `nrContrato` aponta para um contrato cuja revisão real é vazia, mas `revisaContrato` enviado foi "001".
- **Por que falha:** O servidor não revalida a coerência entre número de contrato, revisão, filial e itens enviados — o payload pode apontar para um objeto que não corresponde ao que foi realmente escolhido.
- **Onde falha:** `expect` de coerência entre `nrContrato` e `revisaContrato`, em `payload-solicitacao.spec.js`. (local exato: `tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js:532`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é o corpo do `POST /wf_solicitacao_compras/start` interceptado por `utils/captura-payload.js` — anexado a este cartão e citado na mensagem da falha. Nenhum campo de payload é visível numa screenshot.

**Mensagem da falha:**

```
Error: nrContrato aponta para o MEDIO (revisão real ""), mas revisaContrato enviado foi "001"

expect(received).toBe(expected) // Object.is equality

Expected: ""
Received: "001"
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-01bba-visão-filial-itens-enviados-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-01bba-visão-filial-itens-enviados-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-01bba-visão-filial-itens-enviados-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/acomp/e2e-acompanhamento-contrat-01bba-visão-filial-itens-enviados-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=46538 npx playwright test tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js -g "@bug não deve permitir que nrContrato divirja do contrato real da revisão/filial/itens enviados"`

---

### 21. @destrutivo deve assumir e aprovar uma tarefa do pool do Gestor Imediato

- **Arquivo:** `e2e/compras/aprovacoes-solicitacao-compras.spec.js:317` · **Suíte:** Validação do Gestor Imediato (Tarefas em pool) · **Duração:** 218.2 s · **Tags:** destrutivo
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Caso de teste:** CT-CMP-04-H — Aprovação — Gestor Imediato (feliz)
- **Causa raiz:** G13 — BPMN lento — a SC não sai de "Grava SC e Anexos" dentro dos 180 s do orçamento de espera
- **O que acontece:** A SC #113203, criada pelo próprio teste, não ficou assumível ("Assumir tarefa") na Validação do Gestor dentro de 180 s. A atividade observada na tela de detalhe ainda era "Grava SC e Anexos".
- **Por que falha:** Latência do BPMN acima do orçamento (referência de campo ~76 s). Com 60 s de isolamento entre destrutivos, a hipótese de disputa concorrente pelo pool está descartada.
- **Onde falha:** Poll `toPass({ timeout: 180_000 })` por `botaoAssumirTarefaAtual()` — `aprovacoes-solicitacao-compras.spec.js:291`. (local exato: `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js:290`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a etapa em que a solicitação realmente parou, lida no detalhe do processo e citada na mensagem da falha.

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: a SC #113203, criada por este teste, não ficou assumível ("Assumir tarefa") na Validação do Gestor dentro de 180s. Isto NÃO é defeito do produto confirmado — pode ser lentidão do BPMN acima do observado em campo (~76s), ou a tarefa ter sido assumida por outra execução concorrente que pega a primeira do pool (tests/e2e/tarefas/assumir-tarefa-pool.spec.js). Atividade atual observada na tela de detalhe: "Grava SC e Anexos". Causa do polling: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Assumir tarefa' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/09/e2e-compras-aprovacoes-sol-65f42--do-pool-do-Gestor-Imediato-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/09/e2e-compras-aprovacoes-sol-65f42--do-pool-do-Gestor-Imediato-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/09/e2e-compras-aprovacoes-sol-65f42--do-pool-do-Gestor-Imediato-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/09/e2e-compras-aprovacoes-sol-65f42--do-pool-do-Gestor-Imediato-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=523630 npx playwright test tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js -g "@destrutivo deve assumir e aprovar uma tarefa do pool do Gestor Imediato"`

---

### 22. @destrutivo deve assumir e reprovar uma tarefa do pool do Gestor Imediato com justificativa

- **Arquivo:** `e2e/compras/aprovacoes-solicitacao-compras.spec.js:358` · **Suíte:** Validação do Gestor Imediato (Tarefas em pool) · **Duração:** 214.0 s · **Tags:** destrutivo
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Caso de teste:** CT-CMP-04-S1 — Reprovação do Gestor gera correção
- **Causa raiz:** G13 — BPMN lento — a SC não sai de "Grava SC e Anexos" dentro dos 180 s do orçamento de espera
- **O que acontece:** A SC #113204 não ficou assumível na Validação do Gestor dentro de 180 s; atividade atual "Grava SC e Anexos". O cenário de reprovar com justificativa não chega a ser exercitado.
- **Por que falha:** Mesma latência de BPMN do caso anterior, medida em invocação isolada.
- **Onde falha:** Poll `toPass({ timeout: 180_000 })` em `aprovacoes-solicitacao-compras.spec.js:291`. (local exato: `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js:290`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a etapa em que a solicitação realmente parou, lida no detalhe do processo e citada na mensagem da falha.

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: a SC #113204, criada por este teste, não ficou assumível ("Assumir tarefa") na Validação do Gestor dentro de 180s. Isto NÃO é defeito do produto confirmado — pode ser lentidão do BPMN acima do observado em campo (~76s), ou a tarefa ter sido assumida por outra execução concorrente que pega a primeira do pool (tests/e2e/tarefas/assumir-tarefa-pool.spec.js). Atividade atual observada na tela de detalhe: "Grava SC e Anexos". Causa do polling: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Assumir tarefa' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/10/e2e-compras-aprovacoes-sol-3aeac--Imediato-com-justificativa-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/10/e2e-compras-aprovacoes-sol-3aeac--Imediato-com-justificativa-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/10/e2e-compras-aprovacoes-sol-3aeac--Imediato-com-justificativa-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/10/e2e-compras-aprovacoes-sol-3aeac--Imediato-com-justificativa-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=179909 npx playwright test tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js -g "@destrutivo deve assumir e reprovar uma tarefa do pool do Gestor Imediato com justificativa"`

---

### 23. @destrutivo deve sinalizar explicitamente quando não há aprovador habilitado para a próxima etapa

- **Arquivo:** `e2e/compras/aprovacoes-solicitacao-compras.spec.js:401` · **Suíte:** Validação do Gestor Imediato (Tarefas em pool) · **Duração:** 239.4 s · **Tags:** destrutivo
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Caso de teste:** CT-CMP-05-S1 — Valor acima da alçada sem aprovador
- **Causa raiz:** G13 — BPMN lento — a SC não sai de "Grava SC e Anexos" dentro dos 180 s do orçamento de espera
- **O que acontece:** A SC #113205 não ficou assumível na Validação do Gestor dentro de 180 s; atividade atual "Grava SC e Anexos".
- **Por que falha:** Mesma latência de BPMN. O cenário "não há aprovador habilitado para a próxima etapa" fica inalcançável.
- **Onde falha:** Poll `toPass({ timeout: 180_000 })` em `aprovacoes-solicitacao-compras.spec.js:291`. (local exato: `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js:290`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a etapa em que a solicitação realmente parou, lida no detalhe do processo e citada na mensagem da falha.

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: a SC #113205, criada por este teste, não ficou assumível ("Assumir tarefa") na Validação do Gestor dentro de 180s. Isto NÃO é defeito do produto confirmado — pode ser lentidão do BPMN acima do observado em campo (~76s), ou a tarefa ter sido assumida por outra execução concorrente que pega a primeira do pool (tests/e2e/tarefas/assumir-tarefa-pool.spec.js). Atividade atual observada na tela de detalhe: "Grava SC e Anexos". Causa do polling: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Assumir tarefa' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

**Evidências:**
- (teste de API — sem tela; a evidência é a resposta do endpoint na mensagem acima)
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/11/e2e-compras-aprovacoes-sol-6e79e-litado-para-a-próxima-etapa-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/11/e2e-compras-aprovacoes-sol-6e79e-litado-para-a-próxima-etapa-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/11/e2e-compras-aprovacoes-sol-6e79e-litado-para-a-próxima-etapa-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=975656 npx playwright test tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js -g "@destrutivo deve sinalizar explicitamente quando não há aprovador habilitado para a próxima etapa"`

---

### 24. CT-COT (defeito) — o shell aceita Enviar sem nenhuma validação de fornecedor/vínculos obrigatórios @bug

- **Arquivo:** `e2e/compras/ciclo-cotacao.spec.js:125` · **Suíte:** Cotação de Produtos e Serviços — formulário avulso (shell fora de contexto) · **Duração:** 12.5 s · **Tags:** bug
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-COT — Cotação de Produtos e Serviços — formulário e fila do Portal do Comprador
- **Causa raiz:** G3 — Formulários clássicos aceitam Enviar sem validação — fail-open na SC, Cotação, Negociação e Parecer
- **O que acontece:** No shell do formulário de Cotação, clicar em Enviar sem fornecedor e sem vínculos não abre diálogo de erro e dispara a criação do processo.
- **Por que falha:** O formulário de Cotação não tem validação de obrigatórios no cliente (a SC clássica tem). A escrita só não chegou ao servidor porque a `guarda-criacao` bloqueou.
- **Onde falha:** `expect(dialogoErro).toBeVisible()` em `ciclo-cotacao.spec.js`. (local exato: `tests/e2e/compras/ciclo-cotacao.spec.js:157`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a tentativa de escrita registrada por `utils/guarda-criacao.js` e citada na mensagem da falha (`expect(guarda.tentativas()).toBe(0)`). A requisição foi bloqueada antes de chegar ao servidor, então a tela não muda — é justamente esse o desenho do caso.

**Mensagem da falha:**

```
Error: defeito: o Fluig deveria recusar o envio da Cotação sem fornecedor/vínculos (como faz a Solicitação de Compras), mas o shell aceita e tenta criar um processo real sem nenhuma validação — só não chegou ao servidor porque este teste bloqueia toda escrita no host

expect(locator).toBeVisible() failed

Locator: getByRole('dialog').filter({ hasText: 'Erro' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-ciclo-cotacao--70b4d-r-vínculos-obrigatórios-bug-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-ciclo-cotacao--70b4d-r-vínculos-obrigatórios-bug-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-ciclo-cotacao--70b4d-r-vínculos-obrigatórios-bug-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-ciclo-cotacao--70b4d-r-vínculos-obrigatórios-bug-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=328484 npx playwright test tests/e2e/compras/ciclo-cotacao.spec.js -g "CT-COT (defeito) — o shell aceita Enviar sem nenhuma validação de fornecedor/vínculos obrigatórios @bug"`

---

### 25. CT-COT — a fila real de "Controle De Cotações" está vazia (pré-condição ausente para qualquer cenário com cotação real)

- **Arquivo:** `e2e/compras/ciclo-cotacao.spec.js:168` · **Suíte:** Cotação de Produtos e Serviços — ponto de entrada real (Portal do Comprador) · **Duração:** 7.3 s
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Caso de teste:** CT-COT-01-H — Cotação sem parecer técnico (feliz)
- **Causa raiz:** G14 — Pré-condição ausente — filas vazias, massa inadequada e integrações que não devolveram dado
- **O que acontece:** A fila "Controle De Cotações" do Portal do Comprador não tem nenhuma Cotação para operar.
- **Por que falha:** Nenhuma SC da suíte chega ao Protheus (consequência de fundo de D-01) e não há massa pré-existente. O teste falha com `PRÉ-CONDIÇÃO AUSENTE` de propósito.
- **Onde falha:** Verificação da fila em `ciclo-cotacao.spec.js`. (local exato: `tests/e2e/compras/ciclo-cotacao.spec.js:188`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: a fila de "Controle De Cotações" do Portal do Comprador não tem nenhuma Cotação para operar. Isto NÃO é defeito do produto sob teste isolado — é consequência de D-01 (toda Solicitação de Compra criada por esta suíte fica presa no marco de Início do BPMN e nunca chega ao Protheus, então nunca gera uma Cotação real) somada à ausência de massa pré-existente na base. CT-COT-01-H, CT-COT-01-S1, CT-COT-02-S1, CT-COT-02-S2 e CT-COT-02-S3 continuam bloqueados até D-01 ser corrigido e/ou existir uma Cotação real nesta fila. 

Investigação de viabilidade de MASSA (reconfirmada ao vivo em 01/09/2026, consulta direta à API v2 + navegação real, sem presumir): a base TEM cotações reais em aberto agora mesmo (ex.: processInstanceId 113002, 112860, 112839 — todas `wf_cotacao_produtos_servicos`, `status:OPEN`), então a fila do PRODUTO não está vazia — o que está vazio é o que ESTA CONTA enxerga. Essas cotações nascem vinculadas a um comprador nominal do Protheus (SY1) e só aparecem no Portal do Comprador de quem é esse comprador ou tem "Atuar como" delegado a ele; `TOTVS-FS` não é um dos ~28 compradores cadastrados. Confirmado agora mesmo: `comboAtuarComo` tem contagem 0 tanto em "Controle De Cotações" quanto em "Avaliação de Propostas" — não há delegação disponível para operar em nome de um comprador real hoje (nota: `pages/PortalCompradorPage.js`, arquivo de outra suíte, documenta delegação a "Arthur de Almeida Santos" numa medição anterior — a medição de agora, repetida duas vezes, não encontrou nenhum `<select>` nessas duas telas; o ambiente pode ter mudado 
…
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-ciclo-cotacao--3eec7-r-cenário-com-cotação-real--e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-ciclo-cotacao--3eec7-r-cenário-com-cotação-real--e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-ciclo-cotacao--3eec7-r-cenário-com-cotação-real--e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-ciclo-cotacao--3eec7-r-cenário-com-cotação-real--e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=442820 npx playwright test tests/e2e/compras/ciclo-cotacao.spec.js -g "CT-COT — a fila real de \"Controle De Cotações\" está vazia (pré-condição ausente para qualquer cenário com cotação real)"`

---

### 26. CT-CMP-02-S4 @bug — deve bloquear o envio quando nenhum anexo é informado

- **Arquivo:** `e2e/compras/ciclo-solicitacao-compras.spec.js:489` · **Suíte:** Ciclo de criação da Solicitação de Compras (formulário clássico) · **Duração:** 36.6 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-CMP-02-S4 — Anexo obrigatório ausente
- **Causa raiz:** G3 — Formulários clássicos aceitam Enviar sem validação — fail-open na SC, Cotação, Negociação e Parecer
- **O que acontece:** Enviar a SC clássica sem anexo dispara `POST /ecm/api/rest/ecm/workflowView/send` — a tentativa de escrita foi capturada pela guarda.
- **Por que falha:** O cliente não valida o anexo obrigatório antes de submeter.
- **Onde falha:** `expect(guarda.tentativas()).toBe(0)` em `ciclo-solicitacao-compras.spec.js`. (local exato: `tests/e2e/compras/ciclo-solicitacao-compras.spec.js:530`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a tentativa de escrita registrada por `utils/guarda-criacao.js` e citada na mensagem da falha (`expect(guarda.tentativas()).toBe(0)`). A requisição foi bloqueada antes de chegar ao servidor, então a tela não muda — é justamente esse o desenho do caso.

**Mensagem da falha:**

```
Error: defeito: o envio sem anexo deveria ser recusado no cliente, sem gerar nenhuma requisição de escrita — em vez disso tentou: POST https://caixade182374.fluig.cloudtotvs.com.br/ecm/api/rest/ecm/workflowView/send

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-ciclo-solicita-25e99-do-nenhum-anexo-é-informado-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-ciclo-solicita-25e99-do-nenhum-anexo-é-informado-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-ciclo-solicita-25e99-do-nenhum-anexo-é-informado-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-ciclo-solicita-25e99-do-nenhum-anexo-é-informado-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=311570 npx playwright test tests/e2e/compras/ciclo-solicitacao-compras.spec.js -g "CT-CMP-02-S4 @bug — deve bloquear o envio quando nenhum anexo é informado"`

---

### 27. CT-CMP-02-S4 @destrutivo @bug — o servidor não deve criar a SC quando falta o anexo obrigatório

- **Arquivo:** `e2e/compras/ciclo-solicitacao-compras.spec.js:567` · **Suíte:** Ciclo de criação da Solicitação de Compras (formulário clássico) · **Duração:** 38.3 s · **Tags:** destrutivo, bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-CMP-02-S4 — Anexo obrigatório ausente
- **Causa raiz:** G3 — Formulários clássicos aceitam Enviar sem validação — fail-open na SC, Cotação, Negociação e Parecer
- **O que acontece:** Sem a guarda, o servidor aceitou o envio sem anexo e **criou a SC** (registrada no livro-razão e cancelada no teardown).
- **Por que falha:** A regra do anexo obrigatório não existe nem no cliente nem no servidor — o cliente é contornável e o servidor não cobre a lacuna.
- **Onde falha:** `expect(criadas).toEqual([])` em `ciclo-solicitacao-compras.spec.js`. (local exato: `tests/e2e/compras/ciclo-solicitacao-compras.spec.js:646`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a SC efetivamente criada no servidor sem anexo — o número dela está no livro-razão `test-results/criados.jsonl` e na mensagem da falha.

**Mensagem da falha:**

```
Error: defeito: o servidor aceitou e CRIOU a Solicitação de Compras sem o anexo obrigatório — a regra do catálogo (CT-CMP-02-S4) não está implementada nem no cliente nem no servidor, e o cliente é contornável

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "#113207 via /ecm/api/rest/ecm/workflowView/send",
+ ]
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/14/e2e-compras-ciclo-solicita-9f63e-o-falta-o-anexo-obrigatório-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/14/e2e-compras-ciclo-solicita-9f63e-o-falta-o-anexo-obrigatório-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/14/e2e-compras-ciclo-solicita-9f63e-o-falta-o-anexo-obrigatório-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/14/e2e-compras-ciclo-solicita-9f63e-o-falta-o-anexo-obrigatório-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=741261 npx playwright test tests/e2e/compras/ciclo-solicitacao-compras.spec.js -g "CT-CMP-02-S4 @destrutivo @bug — o servidor não deve criar a SC quando falta o anexo obrigatório"`

---

### 28. CT-ACC-09-H @destrutivo — o anexo enviado deveria gerar os dois registros no GED, sob a pasta da solicitação, e ser listado na solicitação

- **Arquivo:** `e2e/compras/ciclo-solicitacao-compras.spec.js:815` · **Suíte:** Anexo da Solicitação de Compras chega íntegro ao GED (CT-ACC-09-H) · **Duração:** 150.9 s · **Tags:** destrutivo
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-ACC-09-H — O caminho FELIZ do anexo da SC nunca foi provado
- **Causa raiz:** G12 — Plataforma e portais — deep-link 404, erros de console, resíduo `teste`, aba Atribuir, Clínica vazia, cache _Sync e grade truncada
- **O que acontece:** A SC 113226 foi criada com anexo, mas nenhuma pasta "Processo 113226 - …" existe no GED.
- **Por que falha:** O produto cria essa cadeia sozinho na etapa "Grava SC e Anexos"; sem ela o anexo não tem onde ser navegado e o aprovador não o alcança.
- **Onde falha:** `expect(pasta).not.toBeNull()` em `ciclo-solicitacao-compras.spec.js` (poll de 120 s). (local exato: `tests/e2e/compras/ciclo-solicitacao-compras.spec.js:886`)
- **Reexecução em janela saudável:** Na primeira passagem o teste parou antes, no widget de Zoom do formulário ("Zoom no índice 0 não abriu/confirmou uma opção após 5 tentativas") — sintoma de ambiente, sem veredito. Reexecutado na janela saudável, **alcançou a assertion de domínio e confirmou o defeito**.
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: nenhuma pasta "Processo 113226 - ..." existe no GED. O produto cria essa cadeia sozinho na etapa "Grava SC e Anexos"; sem ela o anexo não tem onde ser navegado e o aprovador não o alcança

expect(received).not.toBeNull()

Received: null

Call Log:
- Timeout 120000ms exceeded while waiting on the predicate
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/15/e2e-compras-ciclo-solicita-2c166--ser-listado-na-solicitação-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/15/e2e-compras-ciclo-solicita-2c166--ser-listado-na-solicitação-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/15/e2e-compras-ciclo-solicita-2c166--ser-listado-na-solicitação-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/15/e2e-compras-ciclo-solicita-2c166--ser-listado-na-solicitação-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=837885 npx playwright test tests/e2e/compras/ciclo-solicitacao-compras.spec.js -g "CT-ACC-09-H @destrutivo — o anexo enviado deveria gerar os dois registros no GED, sob a pasta da solicitação, e ser listado na solicitação"`

---

### 29. CT-CMP-07-S1 @destrutivo @bug — Enviar não deveria criar solicitação antes de o formulário terminar de montar

- **Arquivo:** `e2e/compras/fail-open-formulario-sc.spec.js:127` · **Suíte:** Fail-open do formulário clássico de Solicitação de Compras (CT-CMP-07-S1) · **Duração:** 7.9 s · **Tags:** destrutivo, bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-CMP-07-S1 — Regressão do fail-open do formulário clássico de SC
- **Causa raiz:** G3 — Formulários clássicos aceitam Enviar sem validação — fail-open na SC, Cotação, Negociação e Parecer
- **O que acontece:** Com `ds_protheus_getMatriculaTitular_rest` forçado a 500, o formulário nunca termina de montar e o clique em Enviar dispara `workflowView/send` sem validação alguma.
- **Por que falha:** Fail-open no cliente: o botão Enviar não espera a montagem terminar. O servidor recusou esta submissão (HTTP 500, "Nome da Filial é obrigatório") apenas porque o formulário estava vazio — quando os campos já têm valor, a mesma janela cria SC de verdade.
- **Onde falha:** `expect` de zero requisições de criação em `fail-open-formulario-sc.spec.js`. (local exato: `tests/e2e/compras/fail-open-formulario-sc.spec.js:266`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a tentativa de escrita registrada por `utils/guarda-criacao.js` e citada na mensagem da falha (`expect(guarda.tentativas()).toBe(0)`). A requisição foi bloqueada antes de chegar ao servidor, então a tela não muda — é justamente esse o desenho do caso. A resposta 500 do servidor citada na mensagem é acidental (o formulário estava vazio) e não prova proteção.

**Mensagem da falha:**

```
Error: DEFEITO (fail-open, CT-CMP-07-S1): o Fluig aceitou submeter um formulário de Solicitação de Compras que ainda NÃO terminou de montar — nenhuma validação de cliente rodou e 1 requisição(ões) de criação saíram para `\/ecm\/api\/rest\/ecm\/workflowView\/send$`. O servidor recusou esta submissão (HTTP 500, corpo: "{\"content\":\"ERROR\",\"message\":{\"message\":\"Erro ao salvar dados de formulário: \\n\\n<br/><b class=\\\"text-danger fs-font-bold\\\">- O campo \\\"Nome da Filial\\\" é obrigatório!\\n Favor preencher o campo e tentar novamente.</b>\",\"detail\":\"FLUIG INFO\\nHora: 2026-09-03 10:16:20\\nVersão Fluig: TOTVS Fluig Plataf") e NENHUMA solicitação nasceu desta execução — o defeito documentado aqui é do CLIENTE: ele submeteu um formulário não montado sem rodar validação nenhuma. A recusa do servidor é acidental (o formulário estava vazio); quando a montagem falha depois de os campos já terem valor, a MESMA janela cria a SC de verdade — foi assim que o defeito foi descoberto (ver `docs/estado-do-gate.md`). Não trate a recusa como se o produto estivesse protegido. O esperado é ZERO: enquanto a montagem não termina, o Enviar tem de ficar inerte (ou desabilitado), e submissão de formulário não montado nunca pode ser aceita

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/16/e2e-compras-fail-open-form-37e46-rmulário-terminar-de-montar-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/16/e2e-compras-fail-open-form-37e46-rmulário-terminar-de-montar-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/16/e2e-compras-fail-open-form-37e46-rmulário-terminar-de-montar-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/16/e2e-compras-fail-open-form-37e46-rmulário-terminar-de-montar-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=207571 npx playwright test tests/e2e/compras/fail-open-formulario-sc.spec.js -g "CT-CMP-07-S1 @destrutivo @bug — Enviar não deveria criar solicitação antes de o formulário terminar de montar"`

---

### 30. CT-NEG @bug — o Enviar do shell sem proposta real vinculada nunca deveria completar uma requisição de escrita

- **Arquivo:** `e2e/compras/negociacao-proposta.spec.js:97` · **Suíte:** Negociação de Cotação — formulário avulso (shell fora de contexto) · **Duração:** 8.0 s · **Tags:** bug
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-NEG — Negociação de Cotação — formulário e fila de Avaliação de Propostas
- **Causa raiz:** G3 — Formulários clássicos aceitam Enviar sem validação — fail-open na SC, Cotação, Negociação e Parecer
- **O que acontece:** Enviar no shell de Negociação de Cotação, sem proposta vinculada, disparou `POST /ecm/api/rest/ecm/workflowView/send`.
- **Por que falha:** Sem validação de cliente; a guarda bloqueou a escrita antes de chegar ao servidor.
- **Onde falha:** `expect(guarda.tentativas()).toBe(0)` em `negociacao-proposta.spec.js`. (local exato: `tests/e2e/compras/negociacao-proposta.spec.js:126`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a tentativa de escrita registrada por `utils/guarda-criacao.js` e citada na mensagem da falha (`expect(guarda.tentativas()).toBe(0)`). A requisição foi bloqueada antes de chegar ao servidor, então a tela não muda — é justamente esse o desenho do caso.

**Mensagem da falha:**

```
Error: o clique em Enviar deveria ter sido recusado no cliente, sem gerar nenhuma requisição de escrita — em vez disso tentou: POST https://caixade182374.fluig.cloudtotvs.com.br/ecm/api/rest/ecm/workflowView/send

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-negociacao-pro-191cb-r-uma-requisição-de-escrita-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-negociacao-pro-191cb-r-uma-requisição-de-escrita-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-negociacao-pro-191cb-r-uma-requisição-de-escrita-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-negociacao-pro-191cb-r-uma-requisição-de-escrita-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=182099 npx playwright test tests/e2e/compras/negociacao-proposta.spec.js -g "CT-NEG @bug — o Enviar do shell sem proposta real vinculada nunca deveria completar uma requisição de escrita"`

---

### 31. CT-NEG — a fila real de "Avaliação de Propostas" está vazia (pré-condição ausente para validar/reprovar uma proposta real)

- **Arquivo:** `e2e/compras/negociacao-proposta.spec.js:131` · **Suíte:** Negociação de Cotação — ponto de entrada real (Portal do Comprador) · **Duração:** 7.9 s
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Caso de teste:** CT-NEG-01 — Negociar uma proposta real de fornecedor
- **Causa raiz:** G14 — Pré-condição ausente — filas vazias, massa inadequada e integrações que não devolveram dado
- **O que acontece:** A fila "Avaliação de Propostas" do Portal do Comprador não tem nenhuma cotação, com ou sem proposta de fornecedor.
- **Por que falha:** Mesmo bloqueio de fundo de CT-COT: D-01 impede qualquer Cotação real de existir, então não há proposta para validar ou reprovar.
- **Onde falha:** Verificação da fila em `negociacao-proposta.spec.js:150`. (local exato: `tests/e2e/compras/negociacao-proposta.spec.js:150`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: a fila de "Avaliação de Propostas" do Portal do Comprador não tem nenhuma cotação, com ou sem proposta de fornecedor. Isto NÃO é defeito isolado do produto — é o mesmo bloqueio de fundo que impede CT-COT: D-01 mantém toda Solicitação de Compra presa na conta de integração, então nenhuma Cotação real chega a existir para negociar. CT-NEG-01-H, CT-NEG-01-S1 e CT-NEG-01-S2 continuam bloqueados até D-01 ser corrigido e/ou existir uma proposta real nesta fila. 

Investigação de viabilidade de MASSA (reconfirmada ao vivo em 01/09/2026, mesma rodada de `ciclo-cotacao.spec.js`): não é falta de massa no PRODUTO — a base tem cotações reais em aberto agora (ex. processInstanceId 113025 em "Validação do Comprador", assignee `fernanda.smartins.cassi.com.br.1`; 112994 em "Aguarda Finalizar Cotação", requester `geise.matias.cassi.com.br.1`). O bloqueio é que essas cadeias pertencem a compradores nominais reais da SY1, não a TOTVS-FS, e o "Atuar como" que permitiria operar em nome deles está com `comboAtuarComo` em contagem 0 nesta tela agora — sem delegação, sem visibilidade. Mesmo que a automação corrigisse D-01 e levasse sua PRÓPRIA SC até virar Cotação, o comprador designado ainda seria um nominal diferente de TOTVS-FS: o teto é cadastro no ERP (comprador na SY1), o mesmo limite que `CLAUDE.md` já reconhece como fora do alcance da automação — não presunção, medição repetida hoje. Candidato a exceção formal, mesmo padrão de `docs/criacao-de-contrato-inviavel.md`.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-negociacao-pro-dfdaa-reprovar-uma-proposta-real--e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-negociacao-pro-dfdaa-reprovar-uma-proposta-real--e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-negociacao-pro-dfdaa-reprovar-uma-proposta-real--e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-negociacao-pro-dfdaa-reprovar-uma-proposta-real--e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=729976 npx playwright test tests/e2e/compras/negociacao-proposta.spec.js -g "CT-NEG — a fila real de \"Avaliação de Propostas\" está vazia (pré-condição ausente para validar/reprovar uma proposta real)"`

---

### 32. CT-PAR-01-S1 @bug — parecer sem responsável definido não pode completar uma requisição de escrita ao Enviar

- **Arquivo:** `e2e/compras/parecer-tecnico.spec.js:84` · **Suíte:** Parecer Técnico — formulário avulso · **Duração:** 5.7 s · **Tags:** bug
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-PAR-01-S1 — Parecer sem responsável definido
- **Causa raiz:** G3 — Formulários clássicos aceitam Enviar sem validação — fail-open na SC, Cotação, Negociação e Parecer
- **O que acontece:** Parecer Técnico sem responsável definido: o clique em Enviar disparou `workflowView/send`.
- **Por que falha:** O formulário nasce sem Responsável e não impede o envio.
- **Onde falha:** `expect(guarda.tentativas()).toBe(0)` em `parecer-tecnico.spec.js`. (local exato: `tests/e2e/compras/parecer-tecnico.spec.js:109`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a tentativa de escrita registrada por `utils/guarda-criacao.js` e citada na mensagem da falha (`expect(guarda.tentativas()).toBe(0)`). A requisição foi bloqueada antes de chegar ao servidor, então a tela não muda — é justamente esse o desenho do caso.

**Mensagem da falha:**

```
Error: um parecer sem responsável definido não deveria gerar nenhuma requisição de escrita — em vez disso tentou: POST https://caixade182374.fluig.cloudtotvs.com.br/ecm/api/rest/ecm/workflowView/send

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-parecer-tecnic-0b8a7-isição-de-escrita-ao-Enviar-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-parecer-tecnic-0b8a7-isição-de-escrita-ao-Enviar-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-parecer-tecnic-0b8a7-isição-de-escrita-ao-Enviar-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-parecer-tecnic-0b8a7-isição-de-escrita-ao-Enviar-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=663915 npx playwright test tests/e2e/compras/parecer-tecnico.spec.js -g "CT-PAR-01-S1 @bug — parecer sem responsável definido não pode completar uma requisição de escrita ao Enviar"`

---

### 33. CT-PAR-01-S2 @bug — parecer desfavorável (Reprovado/Ajustes) com justificativa também é barrado pela ausência de responsável

- **Arquivo:** `e2e/compras/parecer-tecnico.spec.js:112` · **Suíte:** Parecer Técnico — formulário avulso · **Duração:** 5.9 s · **Tags:** bug
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-PAR-01-S2 — Parecer reprovando a cotação
- **Causa raiz:** G3 — Formulários clássicos aceitam Enviar sem validação — fail-open na SC, Cotação, Negociação e Parecer
- **O que acontece:** Parecer desfavorável (Reprovado/Ajustes) com justificativa, mas sem responsável: Enviar também disparou `workflowView/send`.
- **Por que falha:** Mesma ausência de validação do cenário S1 — a justificativa preenchida não muda o comportamento.
- **Onde falha:** `expect(guarda.tentativas()).toBe(0)` em `parecer-tecnico.spec.js`. (local exato: `tests/e2e/compras/parecer-tecnico.spec.js:134`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a tentativa de escrita registrada por `utils/guarda-criacao.js` e citada na mensagem da falha (`expect(guarda.tentativas()).toBe(0)`). A requisição foi bloqueada antes de chegar ao servidor, então a tela não muda — é justamente esse o desenho do caso.

**Mensagem da falha:**

```
Error: um parecer reprovado sem responsável definido não deveria gerar nenhuma requisição de escrita — em vez disso tentou: POST https://caixade182374.fluig.cloudtotvs.com.br/ecm/api/rest/ecm/workflowView/send

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-parecer-tecnic-fdc32-ela-ausência-de-responsável-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-parecer-tecnic-fdc32-ela-ausência-de-responsável-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-parecer-tecnic-fdc32-ela-ausência-de-responsável-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/compras/e2e-compras-parecer-tecnic-fdc32-ela-ausência-de-responsável-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=370095 npx playwright test tests/e2e/compras/parecer-tecnico.spec.js -g "CT-PAR-01-S2 @bug — parecer desfavorável (Reprovado/Ajustes) com justificativa também é barrado pela ausência de responsável"`

---

### 34. CT-DEL-01-H @destrutivo @bug: delegar um fiscal substituto para um contrato deve criar a delegação

- **Arquivo:** `e2e/contratos/delegacao-fiscais-ciclo.spec.js:42` · **Suíte:** Delegação de Fiscais de Contrato/Serviço — ciclo completo · **Duração:** 25.7 s · **Tags:** destrutivo, bug:
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-DEL-01-H — Delegar fiscal válido (feliz)
- **Causa raiz:** G11 — Contratos de API — notificações, favoritos, reset de senha do fornecedor e delegação de fiscais
- **O que acontece:** O processo `wf_delegacaoFiscalContratoServico` consta do catálogo como iniciável e abre o formulário, mas ao Enviar o servidor responde 500: "Solicitação só pode ser aberta através do portal de delegação de fiscais!".
- **Por que falha:** O evento do processo exige um portal de origem que não existe em nenhum menu, atalho ou rota alcançável por esta conta. Catálogo e regra do processo se contradizem.
- **Onde falha:** `expect` da mensagem de sucesso em `delegacao-fiscais-ciclo.spec.js`. (local exato: `tests/e2e/contratos/delegacao-fiscais-ciclo.spec.js:77`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: a Delegação de Fiscais deveria ser criável a partir do catálogo de processos (onde é anunciada como iniciável), mas o formulário recusa o envio exigindo um "portal de delegação de fiscais" inalcançável — ver comentário da suíte para a investigação completa

expect(locator).toBeVisible() failed

Locator: getByText(/iniciada com sucesso\./)
Expected: visible
Timeout: 15000ms
Error: element(s) not found
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/18/e2e-contratos-delegacao-fi-41339-rato-deve-criar-a-delegação-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/18/e2e-contratos-delegacao-fi-41339-rato-deve-criar-a-delegação-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/18/e2e-contratos-delegacao-fi-41339-rato-deve-criar-a-delegação-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/18/e2e-contratos-delegacao-fi-41339-rato-deve-criar-a-delegação-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=120767 npx playwright test tests/e2e/contratos/delegacao-fiscais-ciclo.spec.js -g "CT-DEL-01-H @destrutivo @bug: delegar um fiscal substituto para um contrato deve criar a delegação"`

---

### 35. CT-DEL-01-S1 @destrutivo @bug: substituto inválido/sem permissão deve ser bloqueado — não há nenhum controle para selecionar um fiscal substituto

- **Arquivo:** `e2e/contratos/delegacao-fiscais-ciclo.spec.js:82` · **Suíte:** Delegação de Fiscais de Contrato/Serviço — ciclo completo · **Duração:** 5.9 s · **Tags:** destrutivo, bug:
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-DEL-01-S1 — Substituto inválido / sem permissão
- **Causa raiz:** G11 — Contratos de API — notificações, favoritos, reset de senha do fornecedor e delegação de fiscais
- **O que acontece:** O formulário não oferece nenhum controle (searchbox/combobox) para informar o fiscal substituto.
- **Por que falha:** Inexequível pela interface atual: não há entrada de dado para exercitar "substituto inválido". Mesma causa de CT-DEL-01-H.
- **Onde falha:** `expect(controles).toBeGreaterThan(0)` em `delegacao-fiscais-ciclo.spec.js`. (local exato: `tests/e2e/contratos/delegacao-fiscais-ciclo.spec.js:180`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: CT-DEL-01-S1 é INEXEQUÍVEL pela interface atual: o formulário de Delegação de Fiscais não oferece nenhum controle (searchbox/combobox) para informar um fiscal substituto, então não há entrada de dado para exercitar "substituto inválido". O único caminho de escrita (Enviar) é recusado pelo servidor — HTTP 500 em /ecm/api/rest/ecm/workflowView/send: Erro ao salvar dados de formulário: Solicitação só pode ser aberta através do portal de delegação de fiscais! — e esse portal não foi encontrado em nenhum ponto de navegação alcançável por este usuário (ver CT-DEL-01-H)

expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/19/e2e-contratos-delegacao-fi-84516-cionar-um-fiscal-substituto-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/19/e2e-contratos-delegacao-fi-84516-cionar-um-fiscal-substituto-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/19/e2e-contratos-delegacao-fi-84516-cionar-um-fiscal-substituto-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/19/e2e-contratos-delegacao-fi-84516-cionar-um-fiscal-substituto-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=288042 npx playwright test tests/e2e/contratos/delegacao-fiscais-ciclo.spec.js -g "CT-DEL-01-S1 @destrutivo @bug: substituto inválido/sem permissão deve ser bloqueado — não há nenhum controle para selecionar um fiscal substituto"`

---

### 36. CT-FAT-02-S2: competência recusada pelo Protheus deve bloquear a medição E avisar o usuário

- **Arquivo:** `e2e/contratos/validacoes-faturamento.spec.js:79` · **Suíte:** Faturamento de Contratos — validações e bloqueios · **Duração:** 101.3 s
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Caso de teste:** CT-FAT-02-S2 — Competência fechada
- **Causa raiz:** G14 — Pré-condição ausente — filas vazias, massa inadequada e integrações que não devolveram dado
- **O que acontece:** Nenhuma competência recusada pelo Protheus foi encontrada nos contratos vigentes consultados (25-2022-5303, E002-2023, 00121-2023-4306, 00141-2022-5303).
- **Por que falha:** No momento da execução todas as competências amostradas estavam liberadas para medir. Sem uma recusa real não há como verificar se a tela avisa o usuário. Não é veredito sobre o produto.
- **Onde falha:** Busca por competência recusada em `validacoes-faturamento.spec.js:123`. (local exato: `tests/e2e/contratos/validacoes-faturamento.spec.js:123`)
- **Reexecução em janela saudável:** Na primeira passagem este teste estourou o timeout de 120 s do teste (janela degradada). Reexecutado, chegou a percorrer os contratos e reprovou com a pré-condição legível.
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a varredura das competências dos quatro contratos amostrados, listada na mensagem da falha.

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: nenhuma competência recusada pelo Protheus foi encontrada nos contratos vigentes consultados (25-2022-5303, E002-2023, 00121-2023-4306, 00141-2022-5303). Isto NÃO é defeito do produto sob teste: significa que, no momento desta execução, todas as competências amostradas estavam liberadas para medir.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/contratos/e2e-contratos-validacoes-f-7dd87--medição-E-avisar-o-usuário-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/contratos/e2e-contratos-validacoes-f-7dd87--medição-E-avisar-o-usuário-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/contratos/e2e-contratos-validacoes-f-7dd87--medição-E-avisar-o-usuário-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/contratos/e2e-contratos-validacoes-f-7dd87--medição-E-avisar-o-usuário-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=763494 npx playwright test tests/e2e/contratos/validacoes-faturamento.spec.js -g "CT-FAT-02-S2: competência recusada pelo Protheus deve bloquear a medição E avisar o usuário"`

---

### 37. CT-FAT-02-S3: reprovar uma validação (Validação CSE / Validação da Medição CSE / Validação do Fiscal de Contrato) não é alcançável — o usuário desta automação não pertence a nenhum grupo dessas etapas

- **Arquivo:** `e2e/contratos/validacoes-faturamento.spec.js:254` · **Suíte:** Faturamento de Contratos — validações e bloqueios · **Duração:** 7.0 s
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Caso de teste:** CT-FAT-02-S3 — Reprovação em uma das validações
- **Causa raiz:** G14 — Pré-condição ausente — filas vazias, massa inadequada e integrações que não devolveram dado
- **O que acontece:** O menu "Mais opções" não ofereceu "Tarefas em pool" — o usuário estava sem nenhuma tarefa em pool, e o painel só é renderizado quando há ao menos uma.
- **Por que falha:** Sem ler o pool não é possível afirmar que o usuário não pertence a nenhum grupo de Fiscal/CSE/Medição, que é o que o caso quer demonstrar.
- **Onde falha:** Verificação das entradas do menu em `validacoes-faturamento.spec.js:288`. (local exato: `tests/e2e/contratos/validacoes-faturamento.spec.js:288`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: o menu "Mais opções" não ofereceu "Tarefas em pool" — o usuário está sem nenhuma tarefa em pool neste momento, e o painel só é renderizado quando há ao menos uma. Sem ler o pool não é possível afirmar que não existe grupo de Fiscal/CSE/Medição. Isto NÃO é defeito do produto nem falha da automação. Entradas oferecidas agora: Lixeira | Fechar menu | Resumo de Tarefas | Mais opções | Tarefas a concluir 13 | Solicitações 123 | Documentos 29 | Nova solicitação. 

Investigação de viabilidade de MASSA (medida ao vivo em 01/09/2026, mesma rodada de `tests/e2e/tarefas/assumir-tarefa-pool.spec.js` — ver lá o detalhe completo): esta automação não consegue criar seu próprio item de pool para popular este menu. A base tem atividade orgânica intensa hoje (20+ SCs reais abertas), mas nenhuma cai em pool de TOTVS-FS — Gestor Imediato/Comprador de cada uma resolve para pessoa nominal real (RH do Protheus). O único caminho conhecido para a automação colocar algo em pool é contornar D-01 com um `targetState` diferente de 6 direto na API de `/start` — funcionou uma vez no passado (SC 112679) mas nunca foi confirmado como reprodutível, e replicá-lo às cegas arriscaria fabricar massa corrompida numa base compartilhada só para contornar um defeito do produto. A pré-condição desta fila (qualquer grupo de pool, não só Fiscal/CSE/Medição) é de leitura de atividade orgânica, mesma natureza da exceção já formalizada para Contrato em `docs/criacao-de-contrato-inviavel.md`.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/contratos/e2e-contratos-validacoes-f-0a493--nenhum-grupo-dessas-etapas-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/contratos/e2e-contratos-validacoes-f-0a493--nenhum-grupo-dessas-etapas-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/contratos/e2e-contratos-validacoes-f-0a493--nenhum-grupo-dessas-etapas-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/contratos/e2e-contratos-validacoes-f-0a493--nenhum-grupo-dessas-etapas-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=756764 npx playwright test tests/e2e/contratos/validacoes-faturamento.spec.js -g "CT-FAT-02-S3: reprovar uma validação (Validação CSE / Validação da Medição CSE / Validação do Fiscal de Contrato) não é alcançável — o usuário desta automação não pertence a nenhum grupo dessas etapas"`

---

### 38. CT-GED-02-S2 @destrutivo @bug — script de lote (.bat) deveria ser rejeitado

- **Arquivo:** `e2e/documentos/bloqueio-extensoes.spec.js:133` · **Suíte:** GED — allowlist de extensão, não lista negra do .exe (CT-GED-02-S2) · **Duração:** 40.2 s · **Tags:** destrutivo, bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-GED-02-S2 — Bloqueio de extensão: allowlist, não blacklist do `.exe`
- **Causa raiz:** G6 — GED aceita qualquer extensão e qualquer conteúdo (CT-GED-02-S1 / S2)
- **O que acontece:** `qa-script-lote.bat` foi publicado no GED sem nenhuma mensagem de bloqueio.
- **Por que falha:** Não há allowlist de extensão: um `.bat` é executável no Windows e não pertence a nenhuma allowlist razoável de um GED documental.
- **Onde falha:** `expect(mensagemDeBloqueio).toBeVisible()` em `bloqueio-extensoes.spec.js`. (local exato: `tests/e2e/documentos/bloqueio-extensoes.spec.js:119`)
- **Reexecução em janela saudável:** Diferente de 02/09, este caso deu veredito na primeira tentativa. Naquele dia ele caiu por `net::ERR_NETWORK_CHANGED` e depois esbarrou em linhas residuais do publicador; rodando isolado, o problema não se repetiu.
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: esperada uma mensagem de bloqueio ao publicar "qa-script-lote.bat": um .bat é executável no Windows e não pertence a nenhuma allowlist razoável de um GED documental. Nenhuma mensagem de bloqueio foi exibida — o GED não valida extensão (mesmo defeito que CT-GED-02-S1 documenta para o .exe). Uma correção que só coloque ".exe" numa lista negra deixa este caso vermelho, que é exatamente o ponto dele

expect(locator).toBeVisible() failed

Locator: getByText(/extensão não permitida|tipo de arquivo não permitido|arquivo não permitido/i)
Expected: visible
Timeout: 30000ms
Error: element(s) not found
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/20/e2e-documentos-bloqueio-ex-e8d88-e-bat-deveria-ser-rejeitado-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/20/e2e-documentos-bloqueio-ex-e8d88-e-bat-deveria-ser-rejeitado-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/20/e2e-documentos-bloqueio-ex-e8d88-e-bat-deveria-ser-rejeitado-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/20/e2e-documentos-bloqueio-ex-e8d88-e-bat-deveria-ser-rejeitado-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=687631 npx playwright test tests/e2e/documentos/bloqueio-extensoes.spec.js -g "CT-GED-02-S2 @destrutivo @bug — script de lote (.bat) deveria ser rejeitado"`

---

### 39. CT-GED-02-S2 @destrutivo @bug — shell script (.sh) deveria ser rejeitado

- **Arquivo:** `e2e/documentos/bloqueio-extensoes.spec.js:149` · **Suíte:** GED — allowlist de extensão, não lista negra do .exe (CT-GED-02-S2) · **Duração:** 38.3 s · **Tags:** destrutivo, bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-GED-02-S2 — Bloqueio de extensão: allowlist, não blacklist do `.exe`
- **Causa raiz:** G6 — GED aceita qualquer extensão e qualquer conteúdo (CT-GED-02-S1 / S2)
- **O que acontece:** `qa-script-shell.sh` foi publicado no GED sem nenhuma mensagem de bloqueio.
- **Por que falha:** Mesma ausência de allowlist. Uma correção que apenas coloque ".exe" numa lista negra deixa este caso vermelho — que é exatamente o ponto dele.
- **Onde falha:** `expect(mensagemDeBloqueio).toBeVisible()` em `bloqueio-extensoes.spec.js`. (local exato: `tests/e2e/documentos/bloqueio-extensoes.spec.js:119`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: esperada uma mensagem de bloqueio ao publicar "qa-script-shell.sh": um .sh é executável e não pertence a uma allowlist de documentos. Nenhuma mensagem de bloqueio foi exibida — o GED não valida extensão (mesmo defeito que CT-GED-02-S1 documenta para o .exe). Uma correção que só coloque ".exe" numa lista negra deixa este caso vermelho, que é exatamente o ponto dele

expect(locator).toBeVisible() failed

Locator: getByText(/extensão não permitida|tipo de arquivo não permitido|arquivo não permitido/i)
Expected: visible
Timeout: 30000ms
Error: element(s) not found
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/21/e2e-documentos-bloqueio-ex-bc9f2-pt-sh-deveria-ser-rejeitado-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/21/e2e-documentos-bloqueio-ex-bc9f2-pt-sh-deveria-ser-rejeitado-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/21/e2e-documentos-bloqueio-ex-bc9f2-pt-sh-deveria-ser-rejeitado-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/21/e2e-documentos-bloqueio-ex-bc9f2-pt-sh-deveria-ser-rejeitado-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=710815 npx playwright test tests/e2e/documentos/bloqueio-extensoes.spec.js -g "CT-GED-02-S2 @destrutivo @bug — shell script (.sh) deveria ser rejeitado"`

---

### 40. CT-GED-02-S2 @destrutivo @bug — dupla extensão (.pdf.exe) deveria ser rejeitada

- **Arquivo:** `e2e/documentos/bloqueio-extensoes.spec.js:163` · **Suíte:** GED — allowlist de extensão, não lista negra do .exe (CT-GED-02-S2) · **Duração:** 38.7 s · **Tags:** destrutivo, bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-GED-02-S2 — Bloqueio de extensão: allowlist, não blacklist do `.exe`
- **Causa raiz:** G6 — GED aceita qualquer extensão e qualquer conteúdo (CT-GED-02-S1 / S2)
- **O que acontece:** `qa-relatorio.pdf.exe` foi publicado no GED sem nenhuma mensagem de bloqueio.
- **Por que falha:** É o disfarce clássico: o nome sugere um PDF e a extensão real é `.exe`. Uma validação que olhe só o começo do nome, ou que procure ".pdf" em qualquer posição, deixa passar.
- **Onde falha:** `expect(mensagemDeBloqueio).toBeVisible()` em `bloqueio-extensoes.spec.js`. (local exato: `tests/e2e/documentos/bloqueio-extensoes.spec.js:119`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: esperada uma mensagem de bloqueio ao publicar "qa-relatorio.pdf.exe": é o disfarce clássico — o nome sugere um PDF, a extensão REAL é .exe, e uma validação que olhe só o começo do nome (ou que procure ".pdf" em qualquer posição) deixa passar. Nenhuma mensagem de bloqueio foi exibida — o GED não valida extensão (mesmo defeito que CT-GED-02-S1 documenta para o .exe). Uma correção que só coloque ".exe" numa lista negra deixa este caso vermelho, que é exatamente o ponto dele

expect(locator).toBeVisible() failed

Locator: getByText(/extensão não permitida|tipo de arquivo não permitido|arquivo não permitido/i)
Expected: visible
Timeout: 30000ms
Error: element(s) not found
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/22/e2e-documentos-bloqueio-ex-bbf4a-f-exe-deveria-ser-rejeitada-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/22/e2e-documentos-bloqueio-ex-bbf4a-f-exe-deveria-ser-rejeitada-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/22/e2e-documentos-bloqueio-ex-bbf4a-f-exe-deveria-ser-rejeitada-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/22/e2e-documentos-bloqueio-ex-bbf4a-f-exe-deveria-ser-rejeitada-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=387616 npx playwright test tests/e2e/documentos/bloqueio-extensoes.spec.js -g "CT-GED-02-S2 @destrutivo @bug — dupla extensão (.pdf.exe) deveria ser rejeitada"`

---

### 41. CT-GED-02-S2 @destrutivo @bug — executável renomeado para .pdf deveria ser rejeitado pelo conteúdo

- **Arquivo:** `e2e/documentos/bloqueio-extensoes.spec.js:176` · **Suíte:** GED — allowlist de extensão, não lista negra do .exe (CT-GED-02-S2) · **Duração:** 38.3 s · **Tags:** destrutivo, bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-GED-02-S2 — Bloqueio de extensão: allowlist, não blacklist do `.exe`
- **Causa raiz:** G6 — GED aceita qualquer extensão e qualquer conteúdo (CT-GED-02-S1 / S2)
- **O que acontece:** `qa-executavel-disfarcado.pdf` — nome `.pdf`, conteúdo começando com os magic bytes `MZ` de um executável PE/DOS — foi publicado sem mensagem.
- **Por que falha:** Nem o nome nem o conteúdo são inspecionados. Este caso continuará vermelho mesmo se uma allowlist por extensão for implementada, e é assim que se distingue "valida o nome" de "valida o arquivo".
- **Onde falha:** `expect(mensagemDeBloqueio).toBeVisible()` em `bloqueio-extensoes.spec.js`. (local exato: `tests/e2e/documentos/bloqueio-extensoes.spec.js:209`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: esperada mensagem de bloqueio ao publicar "qa-executavel-disfarcado.pdf": o nome diz ".pdf" mas o conteúdo começa com os magic bytes "MZ" de um executável PE/DOS. Nenhuma mensagem foi exibida. ⚠️ LEITURA CORRETA DESTE VERMELHO: se os outros três casos de CT-GED-02-S2 estiverem VERDES e só este reprovar, a allowlist foi implementada mas valida apenas a EXTENSÃO DO NOME — nunca o conteúdo —, e renomear o arquivo continua sendo suficiente para subir um binário ao GED

expect(locator).toBeVisible() failed

Locator: getByText(/extensão não permitida|tipo de arquivo não permitido|arquivo não permitido|conteúdo não corresponde|arquivo inválido/i)
Expected: visible
Timeout: 30000ms
Error: element(s) not found
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/23/e2e-documentos-bloqueio-ex-ca6a4-ser-rejeitado-pelo-conteúdo-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/23/e2e-documentos-bloqueio-ex-ca6a4-ser-rejeitado-pelo-conteúdo-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/23/e2e-documentos-bloqueio-ex-ca6a4-ser-rejeitado-pelo-conteúdo-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/23/e2e-documentos-bloqueio-ex-ca6a4-ser-rejeitado-pelo-conteúdo-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=481705 npx playwright test tests/e2e/documentos/bloqueio-extensoes.spec.js -g "CT-GED-02-S2 @destrutivo @bug — executável renomeado para .pdf deveria ser rejeitado pelo conteúdo"`

---

### 42. CT-GED-02-S1 upload de extensão bloqueada é rejeitado e nada é gravado @destrutivo @bug

- **Arquivo:** `e2e/documentos/gestao-documentos.spec.js:66` · **Suíte:** Documentos — upload (CT-GED-02) · **Duração:** 38.8 s · **Tags:** destrutivo, bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-GED-02-S1 — Upload de tipo/tamanho não permitido
- **Causa raiz:** G6 — GED aceita qualquer extensão e qualquer conteúdo (CT-GED-02-S1 / S2)
- **O que acontece:** Upload de `.exe` aceito e publicado sem nenhuma mensagem de bloqueio.
- **Por que falha:** Ausência de validação de extensão no GED — o caso-base do qual os quatro cenários de CT-GED-02-S2 derivam.
- **Onde falha:** `expect(mensagemDeBloqueio).toBeVisible()` em `gestao-documentos.spec.js`. (local exato: `tests/e2e/documentos/gestao-documentos.spec.js:93`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a ausência da mensagem de bloqueio, verificada pelo locator do teste, somada ao documento efetivamente publicado. Este cartão não tem sequer snapshot de tela gravado — a captura saiu vazia —, então a imagem não sustenta nada por si.

**Mensagem da falha:**

```
Error: esperada mensagem de bloqueio para extensão não permitida — nenhuma mensagem de bloqueio foi exibida (defeito confirmado: o upload de .exe é aceito sem validação)

expect(locator).toBeVisible() failed

Locator: getByText(/extensão não permitida|tipo de arquivo não permitido|arquivo não permitido/i)
Expected: visible
Timeout: 30000ms
Error: element(s) not found
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/25/e2e-documentos-gestao-docu-d21af-da-é-gravado-destrutivo-bug-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/25/e2e-documentos-gestao-docu-d21af-da-é-gravado-destrutivo-bug-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/25/e2e-documentos-gestao-docu-d21af-da-é-gravado-destrutivo-bug-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/25/e2e-documentos-gestao-docu-d21af-da-é-gravado-destrutivo-bug-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=164343 npx playwright test tests/e2e/documentos/gestao-documentos.spec.js -g "CT-GED-02-S1 upload de extensão bloqueada é rejeitado e nada é gravado @destrutivo @bug"`

---

### 43. CT-JUR-01-H deveria criar a solicitação de Consultivo e vinculá-la à área informada @destrutivo

- **Arquivo:** `e2e/juridico/sigajuri-consultivo.spec.js:48` · **Suíte:** SIGAJURI_Consultivo — solicitação, D-JUR-01 · **Duração:** 4.8 s · **Tags:** destrutivo
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-JUR-01-H — Consultivo — solicitação → parecer → aprovação (feliz) · D-JUR-01 — combos do SIGAJURI vazios (dataset não devolve registros)
- **Causa raiz:** G9 — Jurídico (SIGAJURI) — combos vazios e parte contrária inalcançável
- **O que acontece:** O combo "Tipo Consulta" do `SIGAJURI_Consultivo` oferece uma única opção (só o placeholder).
- **Por que falha:** O dataset que alimenta os tipos de consulta não devolve registros — não dá para criar uma consulta vinculada a uma área.
- **Onde falha:** `expect(opcoes).toBeGreaterThan(1)` em `sigajuri-consultivo.spec.js`. (local exato: `tests/e2e/juridico/sigajuri-consultivo.spec.js:66`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: Tipo Consulta deveria oferecer mais de uma opção (tipos reais de consulta)

expect(received).toBeGreaterThan(expected)

Expected: > 1
Received:   1
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/29/e2e-juridico-sigajuri-cons-c671a-à-área-informada-destrutivo-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/29/e2e-juridico-sigajuri-cons-c671a-à-área-informada-destrutivo-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/29/e2e-juridico-sigajuri-cons-c671a-à-área-informada-destrutivo-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/29/e2e-juridico-sigajuri-cons-c671a-à-área-informada-destrutivo-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=390140 npx playwright test tests/e2e/juridico/sigajuri-consultivo.spec.js -g "CT-JUR-01-H deveria criar a solicitação de Consultivo e vinculá-la à área informada @destrutivo"`

---

### 44. CT-JUR-04-H / CT-JUR-06-H deveria criar e rotear a solicitação pela UF e Responsável pela Demanda escolhidos, parando no pool certo @destrutivo

- **Arquivo:** `e2e/juridico/sigajuri-contencioso.spec.js:113` · **Suíte:** SIGAJURI_Contencioso — roteamento por área e parte contrária · **Duração:** 4.2 s · **Tags:** destrutivo
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Caso de teste:** CT-JUR-04-H — Contencioso — roteamento por área (feliz) · CT-JUR-06-H — Contencioso: nasce no pool certo?
- **Causa raiz:** G14 — Pré-condição ausente — filas vazias, massa inadequada e integrações que não devolveram dado
- **O que acontece:** O caso precisa de "MA" no combo "UF" e o ambiente não ofereceu **nenhuma** opção.
- **Por que falha:** O cadastro do SIGAJURI não devolveu as UFs. A mensagem instrui explicitamente a não contornar trocando o valor pedido no teste: é sinal de que o cadastro mudou, e deve ser confirmado com o dono do ambiente.
- **Onde falha:** Seleção da UF em `sigajuri-contencioso.spec.js`. (local exato: `pages/SigajuriPage.js:162`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: o caso precisa de "MA" no combo "UF", mas o ambiente hoje só oferece: (nenhuma opção). Não é para ser contornado trocando o valor pedido no teste — é sinal de que o cadastro do SIGAJURI mudou; confirme com o dono do ambiente antes de ajustar o teste.

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/31/e2e-juridico-sigajuri-cont-9ba50-do-no-pool-certo-destrutivo-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/31/e2e-juridico-sigajuri-cont-9ba50-do-no-pool-certo-destrutivo-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/31/e2e-juridico-sigajuri-cont-9ba50-do-no-pool-certo-destrutivo-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/31/e2e-juridico-sigajuri-cont-9ba50-do-no-pool-certo-destrutivo-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=538884 npx playwright test tests/e2e/juridico/sigajuri-contencioso.spec.js -g "CT-JUR-04-H / CT-JUR-06-H deveria criar e rotear a solicitação pela UF e Responsável pela Demanda escolhidos, parando no pool certo @destrutivo"`

---

### 45. CT-JUR-04-S1 deveria oferecer campo para registrar a parte contrária em consultas contenciosas @bug

- **Arquivo:** `e2e/juridico/sigajuri-contencioso.spec.js:196` · **Suíte:** SIGAJURI_Contencioso — roteamento por área e parte contrária · **Duração:** 5.4 s · **Tags:** bug
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-JUR-04-S1 — Contencioso sem parte contrária
- **Causa raiz:** G9 — Jurídico (SIGAJURI) — combos vazios e parte contrária inalcançável
- **O que acontece:** Numa consulta do tipo "Liminar", o botão "Novo Envolvido" fica oculto (classe `sem-processo-hide`) tanto no estado padrão quanto com "Não possui processo." marcado.
- **Por que falha:** A regra de exibição esconde o único caminho para registrar a parte contrária — testado nos dois estados possíveis do formulário.
- **Onde falha:** `expect(visivel).toBe(true)` em `sigajuri-contencioso.spec.js`. (local exato: `tests/e2e/juridico/sigajuri-contencioso.spec.js:230`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: deveria existir um caminho visível para registrar a parte contrária (botão "Novo Envolvido") em uma consulta do tipo "Liminar" — testado com o formulário no estado padrão e com "Não possui processo." marcado, o botão fica oculto (classe CSS `sem-processo-hide`) nos dois casos

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/juridico/e2e-juridico-sigajuri-cont-03354--consultas-contenciosas-bug-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/juridico/e2e-juridico-sigajuri-cont-03354--consultas-contenciosas-bug-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/juridico/e2e-juridico-sigajuri-cont-03354--consultas-contenciosas-bug-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/juridico/e2e-juridico-sigajuri-cont-03354--consultas-contenciosas-bug-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=949956 npx playwright test tests/e2e/juridico/sigajuri-contencioso.spec.js -g "CT-JUR-04-S1 deveria oferecer campo para registrar a parte contrária em consultas contenciosas @bug"`

---

### 46. CT-JUR-03-H deveria permitir montar uma minuta preenchendo Filial e Tipo Contrato @bug

- **Arquivo:** `e2e/juridico/sigajuri-contrato.spec.js:32` · **Suíte:** SIGAJURI_Contrato — geração de minuta, D-JUR-01 · **Duração:** 4.7 s · **Tags:** bug
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-JUR-03-H — Contrato — geração de minuta (feliz) · D-JUR-01 — combos do SIGAJURI vazios (dataset não devolve registros)
- **Causa raiz:** G9 — Jurídico (SIGAJURI) — combos vazios e parte contrária inalcançável
- **O que acontece:** O combo "Filial" do `SIGAJURI_Contrato` oferece uma única opção.
- **Por que falha:** Dataset de filiais vazio para esta conta/processo; não é possível montar a minuta.
- **Onde falha:** `expect(opcoes).toBeGreaterThan(1)` em `sigajuri-contrato.spec.js`. (local exato: `tests/e2e/juridico/sigajuri-contrato.spec.js:48`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: Filial deveria oferecer mais de uma opção (filiais reais)

expect(received).toBeGreaterThan(expected)

Expected: > 1
Received:   1
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/juridico/e2e-juridico-sigajuri-cont-c0c8e--Filial-e-Tipo-Contrato-bug-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/juridico/e2e-juridico-sigajuri-cont-c0c8e--Filial-e-Tipo-Contrato-bug-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/juridico/e2e-juridico-sigajuri-cont-c0c8e--Filial-e-Tipo-Contrato-bug-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/juridico/e2e-juridico-sigajuri-cont-c0c8e--Filial-e-Tipo-Contrato-bug-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=328114 npx playwright test tests/e2e/juridico/sigajuri-contrato.spec.js -g "CT-JUR-03-H deveria permitir montar uma minuta preenchendo Filial e Tipo Contrato @bug"`

---

### 47. CT-NOT-03-S1 @bug: `GET /notification/api/v1/notifications` deve respeitar `limit` e `offset`

- **Arquivo:** `e2e/notificacoes/contratos-api-notificacao.spec.js:98` · **Suíte:** Notificações — contratos da API (CT-NOT-03-S1) · **Duração:** 30.7 s · **Tags:** bug:
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-NOT-03-S1 — Contratos da API de notificação
- **Causa raiz:** G11 — Contratos de API — notificações, favoritos, reset de senha do fornecedor e delegação de fiscais
- **O que acontece:** `GET /notification/api/v1/notifications?limit=3` devolveu 1000 itens; `offset` também não altera o resultado.
- **Por que falha:** O servidor ignora `limit` e `offset`. Todo cliente recebe a lista inteira hoje; no dia em que a paginação passar a valer, esses clientes mudam de comportamento sem nenhum aviso.
- **Onde falha:** `expect(quantidade).toBe(3)` em `contratos-api-notificacao.spec.js`. (local exato: `tests/e2e/notificacoes/contratos-api-notificacao.spec.js:162`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é o par requisição/resposta do endpoint, transcrito na mensagem da falha.

**Mensagem da falha:**

```
Error: `GET /notification/api/v1/notifications?limit=3` deveria devolver 3 notificações e devolveu 1000: o parâmetro `limit` é ignorado pelo servidor. Todo cliente recebe a lista inteira hoje; no dia em que a paginação passar a valer, esses clientes mudam de comportamento sem nenhum aviso.

expect(received).toBe(expected) // Object.is equality

Expected: 3
Received: 1000
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/notificacoes/e2e-notificacoes-contratos-a3bad-e-respeitar-limit-e-offset--e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/notificacoes/e2e-notificacoes-contratos-a3bad-e-respeitar-limit-e-offset--e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/notificacoes/e2e-notificacoes-contratos-a3bad-e-respeitar-limit-e-offset--e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/notificacoes/e2e-notificacoes-contratos-a3bad-e-respeitar-limit-e-offset--e2e/error-context.md`
- anexo do teste `paginacao-de-notificacoes`:

  ```json
  {
    "semParametro": {
      "status": 200,
      "quantidade": 1000,
      "primeiroId": 3328684,
      "texto": ""
    },
    "limite3": {
      "status": 200,
      "quantidade": 1000,
      "primeiroId": 3328684,
      "texto": ""
    },
    "segundaPagina": {
      "status": 200,
      "quantidade": 1000,
      "primeiroId": 3328684,
      "texto": ""
    }
  }
  ```
**Reproduzir:** `FAKER_SEED=84122 npx playwright test tests/e2e/notificacoes/contratos-api-notificacao.spec.js -g "CT-NOT-03-S1 @bug: `GET /notification/api/v1/notifications` deve respeitar `limit` e `offset`"`

---

### 48. CT-NOT-03-S1 @bug: notificação declara `canRemove: true`, então o verbo REST de remoção deveria existir

- **Arquivo:** `e2e/notificacoes/contratos-api-notificacao.spec.js:171` · **Suíte:** Notificações — contratos da API (CT-NOT-03-S1) · **Duração:** 14.1 s · **Tags:** bug:
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-NOT-03-S1 — Contratos da API de notificação
- **Causa raiz:** G11 — Contratos de API — notificações, favoritos, reset de senha do fornecedor e delegação de fiscais
- **O que acontece:** Cada notificação declara `canRemove: true`, mas `DELETE /notification/api/v1/notifications/{id}` responde 500 `NotFoundException` — ou seja, a rota não existe (a coleção responde `NotAllowedException`).
- **Por que falha:** A remoção real vive em `POST /globalalertapi/api/rest/alert/removeAlerts`, em outro módulo e sem nenhuma referência no recurso que promete ser removível.
- **Onde falha:** Sondagem das rotas de remoção em `contratos-api-notificacao.spec.js`. (local exato: `tests/e2e/notificacoes/contratos-api-notificacao.spec.js:259`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é o par requisição/resposta do endpoint, transcrito na mensagem da falha.

**Mensagem da falha:**

```
Error: as notificações declaram `canRemove: true`, mas `DELETE /notification/api/v1/notifications/{id}` responde 500 `NotFoundException` — neste ambiente isso significa que a ROTA NÃO EXISTE (a coleção existe e responde `NotAllowedException`; uma rota inventada responde `NotFoundException`, como o controle acima confirma). A remoção real só existe em `POST /globalalertapi/api/rest/alert/removeAlerts`, em outro módulo e sem nenhuma referência no recurso que promete ser removível.

expect(received).not.toBe(expected) // Object.is equality

Expected: not "NotFoundException"
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/notificacoes/e2e-notificacoes-contratos-49475--de-remoção-deveria-existir-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/notificacoes/e2e-notificacoes-contratos-49475--de-remoção-deveria-existir-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/notificacoes/e2e-notificacoes-contratos-49475--de-remoção-deveria-existir-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/notificacoes/e2e-notificacoes-contratos-49475--de-remoção-deveria-existir-e2e/error-context.md`
- anexo do teste `sondagem-de-rotas-de-remocao`:

  ```json
  {
    "lista": {
      "status": 200,
      "total": 1000,
      "removiveis": 1000
    },
    "deleteComId": {
      "status": 500,
      "code": "NotFoundException",
      "corpo": "{\"code\":\"NotFoundException\",\"message\":\"\",\"detailedMessage\":\"\",\"helpUrl\":null,\"details\":[]}"
    },
    "deleteNaColecao": {
      "status": 500,
      "code": "NotAllowedException",
      "corpo": "{\"code\":\"NotAllowedException\",\"message\":\"\",\"detailedMessage\":\"\",\"helpUrl\":null,\"details\":[]}"
    },
    "removeAlerts": {
      "status": 500,
      "code": "NotAllowedException",
      "corpo": "{\"code\":\"NotAllowedException\",\"detailedMessage\":\"\",\"details\":[],\"message\":\"\"}"
    },
    "controleRotaInexistente": {
      "status": 500,
      "code": "NotFoundException",
      "corpo": "{\"code\":\"NotFoundException\",\"detailedMessage\":\"\",\"details\":[],\"message\":\"\"}"
    }
  }
  ```
**Reproduzir:** `FAKER_SEED=268335 npx playwright test tests/e2e/notificacoes/contratos-api-notificacao.spec.js -g "CT-NOT-03-S1 @bug: notificação declara `canRemove: true`, então o verbo REST de remoção deveria existir"`

---

### 49. CT-PLT-10-H: o conjunto de processos publicados e o de iniciáveis devem bater exatamente com o inventário versionado

- **Arquivo:** `e2e/plataforma/catalogo-invariante.spec.js:149` · **Suíte:** Plataforma — invariante do catálogo de processos · **Duração:** 4.9 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Caso de teste:** CT-PLT-10-H — Invariante do catálogo de processos
- **Causa raiz:** G8 — Catálogo de processos mudou desde o inventário versionado
- **O que acontece:** O catálogo "Iniciar Solicitações" (`onlyCanStart=true`) desta conta divergiu do inventário versionado.
- **Por que falha:** Mudança de permissão de início no ambiente. O invariante existe para acusar exatamente isso; cabe à Cassi dizer se cada linha foi intencional. Não é ajuste de dados — é acesso.
- **Onde falha:** `expect(diff).toEqual({entraram:[], sairam:[]})` em `catalogo-invariante.spec.js`. (local exato: `tests/e2e/plataforma/catalogo-invariante.spec.js:221`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a lista de processos devolvida pelo catálogo (`onlyCanStart`), transcrita na íntegra na mensagem da falha.

**Mensagem da falha:**

```
Error: o catálogo "Iniciar Solicitações" (`onlyCanStart=true`) mudou para esta conta. Processo que ENTRA passou a ser iniciável por um usuário de Compras; processo que SAI deixou de ser oferecido. Este é o ponto de controle de permissão de início — trate cada linha como mudança de acesso, não como ajuste de dados.

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 8

  Object {
-   "entraram": Array [],
+   "entraram": Array [
+     "GestaoDependentes",
+     "SIGAJURI_AprovaFU",
+     "SIGAJURI_Contencioso",
+     "SIGAJURI_Contrato",
+     "rh_gbeneficios_planosaude",
+     "wf_substituicaocargos",
+   ],
    "sairam": Array [],
  }
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-catalogo-in-d60cf-com-o-inventário-versionado-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-catalogo-in-d60cf-com-o-inventário-versionado-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-catalogo-in-d60cf-com-o-inventário-versionado-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-catalogo-in-d60cf-com-o-inventário-versionado-e2e/error-context.md`
- anexo do teste `inventario-lido-do-servidor`:

  ```json
  {
    "totalPublicados": 34,
    "ativos": [
      "FLUIGADHOC",
      "FLUIGADHOCPROCESS",
      "GestaoDependentes",
      "SIGAJURI_AprovaFU",
      "SIGAJURI_Consultivo",
      "SIGAJURI_Contencioso",
      "SIGAJURI_Contrato",
      "bpm_addUserFluig",
      "bpm_addUserGroup",
      "bpm_financeiro_rejeicoes_bancarias",
      "bpm_recepcao_documentos_fiscais_comprador_compras",
      "bpm_recepcao_documentos_fiscais_compras",
      "bpm_recepcao_documentos_fiscais_contratos",
      "bpm_recepcao_documentos_fiscais_demandante_compras",
      "bpm_recepcao_documentos_fiscais_fiscais_contratos",
      "prc_questionario_v2",
      "rh_gbeneficios_planosaude",
      "teste",
      "wf_SubstituiçãoCargosFluig",
      "wf_aprovacao_ocorrencia",
      "wf_automacao_admissao",
      "wf_cadastro_fornecedor",
      "wf_cotacao_produtos_servicos",
      "wf_delegacaoFiscalContratoServico",
      "wf_faturamento_contratos",
      "wf_negociacao_cotacao_prod_serv",
      "wf_pagamento_horas_extras",
      "wf_solicitacao_compras",
      "wf_solicitacao_compras_parecer",
      "wf_solicitacao_ferias",
      "wf_substituicaocargos"
    ],
    "inativos": [
      "sumula",
      "sumulas_analise_intervenientes",
      "testePRODUTO"
    ],
    "iniciaveis": [
      "FLUIG
  ```
**Reproduzir:** `FAKER_SEED=262672 npx playwright test tests/e2e/plataforma/catalogo-invariante.spec.js -g "CT-PLT-10-H: o conjunto de processos publicados e o de iniciáveis devem bater exatamente com o inventário versionado"`

---

### 50. CT-PLT-10-H: `SIGAJURI_Contencioso` continua fora do catálogo `onlyCanStart` embora crie solicitação — a permissão real diverge do filtro da tela

- **Arquivo:** `e2e/plataforma/catalogo-invariante.spec.js:224` · **Suíte:** Plataforma — invariante do catálogo de processos · **Duração:** 4.9 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Caso de teste:** CT-PLT-10-H — Invariante do catálogo de processos
- **Causa raiz:** G8 — Catálogo de processos mudou desde o inventário versionado
- **O que acontece:** `SIGAJURI_Contencioso` **passou** a constar do catálogo `onlyCanStart` — o achado anterior ("cria solicitação mas fica fora do catálogo") mudou de estado.
- **Por que falha:** A permissão de início parece ter sido alinhada ao filtro da tela. O teste, por desenho, acusa a mudança e pede reescrita para a nova regra — nunca silenciamento.
- **Onde falha:** `expect(catalogo).not.toContain("SIGAJURI_Contencioso")` em `catalogo-invariante.spec.js`. (local exato: `tests/e2e/plataforma/catalogo-invariante.spec.js:265`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a lista de processos devolvida pelo catálogo (`onlyCanStart`), transcrita na íntegra na mensagem da falha.

**Mensagem da falha:**

```
Error: a divergência mudou: `SIGAJURI_Contencioso` PASSOU a constar do catálogo `onlyCanStart`. Se a permissão de início foi alinhada ao filtro da tela, o achado foi resolvido e este teste deve ser reescrito para a nova regra — não silenciado.

expect(received).not.toContain(expected) // indexOf

Expected value: not "SIGAJURI_Contencioso"
Received array:     ["bpm_addUserGroup", "bpm_addUserFluig", "teste", "wf_cadastro_fornecedor", "wf_cotacao_produtos_servicos", "wf_negociacao_cotacao_prod_serv", "wf_solicitacao_compras", "wf_solicitacao_compras_parecer", "wf_SubstituiçãoCargosFluig", "wf_delegacaoFiscalContratoServico", "wf_faturamento_contratos", "bpm_financeiro_rejeicoes_bancarias", "prc_questionario_v2", "GestaoDependentes", "rh_gbeneficios_planosaude", "wf_automacao_admissao", "wf_pagamento_horas_extras", "wf_substituicaocargos", "FLUIGADHOC", "SIGAJURI_AprovaFU", "SIGAJURI_Consultivo", "SIGAJURI_Contencioso", "SIGAJURI_Contrato"]
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-catalogo-in-31ece-l-diverge-do-filtro-da-tela-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-catalogo-in-31ece-l-diverge-do-filtro-da-tela-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-catalogo-in-31ece-l-diverge-do-filtro-da-tela-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-catalogo-in-31ece-l-diverge-do-filtro-da-tela-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=846641 npx playwright test tests/e2e/plataforma/catalogo-invariante.spec.js -g "CT-PLT-10-H: `SIGAJURI_Contencioso` continua fora do catálogo `onlyCanStart` embora crie solicitação — a permissão real diverge do filtro da tela"`

---

### 51. acessar /portal/p/1/principalprocess diretamente deve abrir a página, não redirecionar para 404 @bug

- **Arquivo:** `e2e/plataforma/deep-link-spa.spec.js:19` · **Suíte:** Deep-link de rota SPA (defeito U-01) · **Duração:** 36.7 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-PLT-04 — Deep-link de rota SPA · U-01 — deep-link de rota SPA cai em errorPage/404
- **Causa raiz:** G12 — Plataforma e portais — deep-link 404, erros de console, resíduo `teste`, aba Atribuir, Clínica vazia, cache _Sync e grade truncada
- **O que acontece:** Abrir `/portal/p/1/principalprocess` direto pela URL termina em `/portal/p/1/errorPage/404`.
- **Por que falha:** A rota existe e funciona pela navegação interna da SPA; o deep-link quebra — link salvo, favorito e compartilhamento de endereço não funcionam.
- **Onde falha:** `expect(page).not.toHaveURL(/errorPage\/404/)` em `deep-link-spa.spec.js`. (local exato: `tests/e2e/plataforma/deep-link-spa.spec.js:32`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: defeito U-01: abrir /portal/p/1/principalprocess diretamente pela URL cai em errorPage/404. A rota existe e funciona quando alcançada pela navegação interna da SPA — o que quebra é o deep-link, então link salvo, favorito e compartilhamento de endereço não funcionam

expect(page).not.toHaveURL(expected) failed

Expected pattern: not /errorPage\/404/
Received string: "https://caixade182374.fluig.cloudtotvs.com.br/portal/p/1/errorPage/404"
Timeout: 30000ms
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-deep-link-s-dd0b2-o-redirecionar-para-404-bug-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-deep-link-s-dd0b2-o-redirecionar-para-404-bug-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-deep-link-s-dd0b2-o-redirecionar-para-404-bug-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-deep-link-s-dd0b2-o-redirecionar-para-404-bug-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=215327 npx playwright test tests/e2e/plataforma/deep-link-spa.spec.js -g "acessar /portal/p/1/principalprocess diretamente deve abrir a página, não redirecionar para 404 @bug"`

---

### 52. acessar /portal/p/1/gestao_ferias diretamente deve abrir a página, não redirecionar para 404 @bug

- **Arquivo:** `e2e/plataforma/deep-link-spa.spec.js:19` · **Suíte:** Deep-link de rota SPA (defeito U-01) · **Duração:** 36.5 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-PLT-04 — Deep-link de rota SPA · U-01 — deep-link de rota SPA cai em errorPage/404
- **Causa raiz:** G12 — Plataforma e portais — deep-link 404, erros de console, resíduo `teste`, aba Atribuir, Clínica vazia, cache _Sync e grade truncada
- **O que acontece:** Abrir `/portal/p/1/gestao_ferias` direto pela URL termina em `/portal/p/1/errorPage/404`.
- **Por que falha:** Mesma quebra de deep-link da rota irmã: a SPA resolve a rota internamente, mas não a partir de uma URL digitada ou salva.
- **Onde falha:** `expect(page).not.toHaveURL(/errorPage\/404/)` em `deep-link-spa.spec.js`. (local exato: `tests/e2e/plataforma/deep-link-spa.spec.js:32`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: defeito U-01: abrir /portal/p/1/gestao_ferias diretamente pela URL cai em errorPage/404. A rota existe e funciona quando alcançada pela navegação interna da SPA — o que quebra é o deep-link, então link salvo, favorito e compartilhamento de endereço não funcionam

expect(page).not.toHaveURL(expected) failed

Expected pattern: not /errorPage\/404/
Received string: "https://caixade182374.fluig.cloudtotvs.com.br/portal/p/1/errorPage/404"
Timeout: 30000ms
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-deep-link-s-4eca1-o-redirecionar-para-404-bug-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-deep-link-s-4eca1-o-redirecionar-para-404-bug-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-deep-link-s-4eca1-o-redirecionar-para-404-bug-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-deep-link-s-4eca1-o-redirecionar-para-404-bug-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=271210 npx playwright test tests/e2e/plataforma/deep-link-spa.spec.js -g "acessar /portal/p/1/gestao_ferias diretamente deve abrir a página, não redirecionar para 404 @bug"`

---

### 53. CT-PLT-06-S1 @bug: Portal do Comprador (/portal/p/1/portal-do-comprador) deve carregar sem erro de console não catalogado

- **Arquivo:** `e2e/plataforma/erros-de-console.spec.js:152` · **Suíte:** Plataforma — erro de console nas rotas-chave (CT-PLT-06-S1) · **Duração:** 17.7 s · **Tags:** bug:
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-PLT-06-S1 — Erro de console fora da home
- **Causa raiz:** G12 — Plataforma e portais — deep-link 404, erros de console, resíduo `teste`, aba Atribuir, Clínica vazia, cache _Sync e grade truncada
- **O que acontece:** O Portal do Comprador carrega com 2 erros de console não catalogados: 404 em `/style-guide/css/fluig-style-guide.min.css` e `console.error` "Erro ao buscar as informações do colaborador… Comprador não encontrado".
- **Por que falha:** CSS ausente no deploy e a busca do comprador no Protheus não encontra a conta `TOTVS-FS` (que não está na SY1). Erro de JS/rede na carga degrada o widget em silêncio.
- **Onde falha:** `expect(naoCatalogados).toEqual([])` em `erros-de-console.spec.js`. (local exato: `tests/e2e/plataforma/erros-de-console.spec.js:210`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é as mensagens de console capturadas durante a carga, transcritas na mensagem da falha — console não aparece em screenshot.

**Mensagem da falha:**

```
Error: 2 erro(s) de console NÃO catalogado(s) em /portal/p/1/portal-do-comprador (Portal do Comprador): [{"mensagem":"Failed to load resource: the server responded with a status of 404 (Not Found)","recurso":"https://caixade182374.fluig.cloudtotvs.com.br/style-guide/css/fluig-style-guide.min.css"},{"mensagem":"Erro ao buscar as informações do colaborador na lista de usuários do ERP Protheus. Error: Error: Comprador não encontrado.","recurso":"https://caixade182374.fluig.cloudtotvs.com.br/wg_portalCompradores/resources/js/App/Scripts/browser/main.js"}]. Erro de JS/rede na carga degrada o widget em silêncio — a tela continua "abrindo" e só quebra na função que ninguém testou. Se o erro for conhecido e aceito, catalogue-o em EXCECOES_CATALOGADAS com id, data e motivo, e registre-o na tabela de defeitos do README; nunca alargue um filtro para calá-lo.

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 10

- Array []
+ Array [
+   Object {
+     "mensagem": "Failed to load resource: the server responded with a status of 404 (Not Found)",
+     "recurso": "https://caixade182374.fluig.cloudtotvs.com.br/style-guide/css/fluig-style-guide.min.css",
+   },
+   Object {
+     "mensagem": "Erro ao buscar as informações do colaborador na lista de usuários do ERP Protheus. Error: Error: Comprador não encontrado.",
+     "recurso": "https://caixade182374.fluig.cloudtotvs.com.br/wg_portalCompradores/resources/js/App/Scripts/browser/main.js",
+   },
+ ]
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-erros-de-co-10d01-o-de-console-não-catalogado-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-erros-de-co-10d01-o-de-console-não-catalogado-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-erros-de-co-10d01-o-de-console-não-catalogado-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-erros-de-co-10d01-o-de-console-não-catalogado-e2e/error-context.md`
- anexo do teste `console-observado`:

  ```json
  {
    "rota": "/portal/p/1/portal-do-comprador",
    "todosOsErros": [
      {
        "mensagem": "Failed to load resource: the server responded with a status of 404 (Not Found)",
        "recurso": "https://caixade182374.fluig.cloudtotvs.com.br/style-guide/css/fluig-style-guide.min.css"
      },
      {
        "mensagem": "Erro ao buscar as informações do colaborador na lista de usuários do ERP Protheus. Error: Error: Comprador não encontrado.",
        "recurso": "https://caixade182374.fluig.cloudtotvs.com.br/wg_portalCompradores/resources/js/App/Scripts/browser/main.js"
      },
      {
        "mensagem": "Failed to load resource: the server responded with a status of 403 (Forbidden)",
        "recurso": "https://caixade182374.fluig.cloudtotvs.com.br/nps/api/v1/surveys?productLine=TOTVS%20Fluig&_=1788446602678"
      }
    ],
    "catalogados": [
      "NPS 403 (desde 26/08/2026)"
    ],
    "naoCatalogados": [
      {
        "mensagem": "Failed to load resource: the server responded with a status of 404 (Not Found)",
        "recurso": "https://caixade182374.fluig.cloudtotvs.com.br/style-guide/css/fluig-style-guide.min.css"
      },
      {
        "mensagem": "Erro ao buscar as informações do colaborador na lista de usuár
  ```
**Reproduzir:** `FAKER_SEED=551261 npx playwright test tests/e2e/plataforma/erros-de-console.spec.js -g "CT-PLT-06-S1 @bug: Portal do Comprador (/portal/p/1/portal-do-comprador) deve carregar sem erro de console não catalogado"`

---

### 54. CT-PLT-07-S1: favoritar o mesmo processo duas vezes deve responder erro de negócio em JSON (ou 200 idempotente), não 500 em texto puro @destrutivo @bug

- **Arquivo:** `e2e/plataforma/favoritos-contrato-api.spec.js:126` · **Suíte:** Plataforma — contrato de `addFavorites` (CT-PLT-07-S1) @destrutivo · **Duração:** 3.9 s · **Tags:** destrutivo, destrutivo, bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-PLT-07-S1 — `addFavorites` duplicado responde 500 em texto puro
- **Causa raiz:** G11 — Contratos de API — notificações, favoritos, reset de senha do fornecedor e delegação de fiscais
- **O que acontece:** Favoritar `SIGAJURI_Contencioso` duas vezes: a 2ª chamada responde **500** em `text/plain` com "Processo SIGAJURI_Contencioso já está nos seus favoritos.".
- **Por que falha:** Condição de negócio trivial (duplo clique, duas abas, retentativa de rede) tratada como erro de servidor, em texto puro — quebra qualquer cliente que faça parse do corpo.
- **Onde falha:** Verificação do par requisição/resposta em `favoritos-contrato-api.spec.js`. (local exato: `tests/e2e/plataforma/favoritos-contrato-api.spec.js:180`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é o par requisição/resposta do endpoint, transcrito na mensagem da falha.

**Mensagem da falha:**

```
Error: favoritar duas vezes o mesmo processo é condição de negócio trivial (duplo clique, duas abas, retentativa de rede) e o servidor responde 500 com corpo em text/plain;charset=UTF-8: "Processo SIGAJURI_Contencioso já está nos seus favoritos.". Deveria ser 200 idempotente ou erro de negócio em JSON — 500 com texto puro quebra qualquer cliente que faça parse do corpo e transforma uma mensagem clara em "erro inesperado" na tela.

expect(received).toEqual(expected) // deep equality

- Expected  - 2
+ Received  + 2

  Object {
-   "contentType": StringContaining "application/json",
-   "status": 200,
+   "contentType": "text/plain;charset=UTF-8",
+   "status": 500,
  }
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/32/e2e-plataforma-favoritos-c-835e7-m-texto-puro-destrutivo-bug-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/32/e2e-plataforma-favoritos-c-835e7-m-texto-puro-destrutivo-bug-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/32/e2e-plataforma-favoritos-c-835e7-m-texto-puro-destrutivo-bug-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/32/e2e-plataforma-favoritos-c-835e7-m-texto-puro-destrutivo-bug-e2e/error-context.md`
- anexo do teste `contrato-addFavorites`:

  ```json
  {
    "processo": "SIGAJURI_Contencioso",
    "primeiro": {
      "status": 200,
      "contentType": "application/json",
      "corpo": "{\"content\":\"OK\",\"message\":null}"
    },
    "duplicado": {
      "status": 500,
      "contentType": "text/plain;charset=UTF-8",
      "corpo": "Processo SIGAJURI_Contencioso já está nos seus favoritos."
    },
    "remocao": {
      "status": 200,
      "contentType": "application/json",
      "corpo": "{\"content\":\"OK\",\"message\":null}"
    },
    "favoritosAoFinal": [
      "bpm_addUserGroup",
      "SIGAJURI_Consultivo",
      "wf_automacao_admissao",
      "wf_faturamento_contratos",
      "wf_pagamento_horas_extras"
    ]
  }
  ```
**Reproduzir:** `FAKER_SEED=255320 npx playwright test tests/e2e/plataforma/favoritos-contrato-api.spec.js -g "CT-PLT-07-S1: favoritar o mesmo processo duas vezes deve responder erro de negócio em JSON (ou 200 idempotente), não 500 em texto puro @destrutivo @bug"`

---

### 55. deve carregar os apps e contadores sem erro de console @bug

- **Arquivo:** `e2e/plataforma/home.spec.js:7` · **Suíte:** Home da plataforma · **Duração:** 11.7 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** NPS 403
- **Causa raiz:** G12 — Plataforma e portais — deep-link 404, erros de console, resíduo `teste`, aba Atribuir, Clínica vazia, cache _Sync e grade truncada
- **O que acontece:** A Home carrega com "Failed to load resource: 403 (Forbidden)" no console.
- **Por que falha:** `GET /nps/api/v1/surveys` responde 403 em toda carga da Home.
- **Onde falha:** `expect(erros).toEqual([])` em `home.spec.js`. (local exato: `tests/e2e/plataforma/home.spec.js:39`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é as mensagens de console capturadas durante a carga, transcritas na mensagem da falha — console não aparece em screenshot.

**Mensagem da falha:**

```
Error: erro(s) de console na Home: ["Failed to load resource: the server responded with a status of 403 (Forbidden)"]

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "Failed to load resource: the server responded with a status of 403 (Forbidden)",
+ ]
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-home-Home-d-d062e-res-sem-erro-de-console-bug-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-home-Home-d-d062e-res-sem-erro-de-console-bug-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-home-Home-d-d062e-res-sem-erro-de-console-bug-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-home-Home-d-d062e-res-sem-erro-de-console-bug-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=258029 npx playwright test tests/e2e/plataforma/home.spec.js -g "deve carregar os apps e contadores sem erro de console @bug"`

---

### 56. CT-PLT-08-S1 @bug: o processo `teste` (categoria ADMIN) não deveria constar do catálogo de início de um usuário de Compras

- **Arquivo:** `e2e/plataforma/processo-inativo-e-residuo.spec.js:62` · **Suíte:** Plataforma — processo inativo e resíduo de desenvolvimento (CT-PLT-08-S1) · **Duração:** 5.6 s · **Tags:** bug:
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-PLT-08-S1 — Processo inativo e resíduo de desenvolvimento visível
- **Causa raiz:** G12 — Plataforma e portais — deep-link 404, erros de console, resíduo `teste`, aba Atribuir, Clínica vazia, cache _Sync e grade truncada
- **O que acontece:** O processo `teste` (categoria ADMIN, resíduo de desenvolvimento, nunca iniciado) continua ofertado em "Iniciar Solicitações" para um usuário de Compras.
- **Por que falha:** Falta de governança de publicação; abri-lo serve o formulário completo da SC — o teste-irmão marcado `@achado` passa, confirmando o comportamento.
- **Onde falha:** Leitura do catálogo em `processo-inativo-e-residuo.spec.js`. (local exato: `tests/e2e/plataforma/processo-inativo-e-residuo.spec.js:116`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a lista de processos devolvida pelo catálogo (`onlyCanStart`), transcrita na íntegra na mensagem da falha.

**Mensagem da falha:**

```
Error: o processo `teste` (categoria ADMIN, resíduo de desenvolvimento, nunca iniciado) continua sendo oferecido na tela "Iniciar Solicitações" de um usuário de Compras. É falta de governança de publicação: um processo de teste administrativo não deveria ser iniciável por perfil de negócio. Catálogo lido: [{"processId":"bpm_addUserGroup","categoria":""},{"processId":"bpm_addUserFluig","categoria":"ADM"},{"processId":"teste","categoria":"ADMIN"},{"processId":"wf_cadastro_fornecedor","categoria":"Compras"},{"processId":"wf_cotacao_produtos_servicos","categoria":"Compras"},{"processId":"wf_negociacao_cotacao_prod_serv","categoria":"Compras"},{"processId":"wf_solicitacao_compras","categoria":"Compras"},{"processId":"wf_solicitacao_compras_parecer","categoria":"Compras"},{"processId":"wf_SubstituiçãoCargosFluig","categoria":"Compras"},{"processId":"wf_delegacaoFiscalContratoServico","categoria":"Contratos"},{"processId":"wf_faturamento_contratos","categoria":"Contratos"},{"processId":"bpm_financeiro_rejeicoes_bancarias","categoria":"Financeiro"},{"processId":"prc_questionario_v2","categoria":"Questionarios"},{"processId":"GestaoDependentes","categoria":"RH"},{"processId":"rh_gbeneficios_planosaude","categoria":"RH"},{"processId":"wf_automacao_admissao","categoria":"RH"},{"processId":"wf_pagamento_horas_extras","categoria":"RH"},{"processId":"wf_substituicaocargos","categoria":"RH"},{"processId":"FLUIGADHOC","categoria":"Tarefas Gerais"},{"processId":"SIGAJURI_AprovaFU","categoria":"TOTVS Juridico"},{"processId":"SIGAJURI_Consultivo","categoria":"TOTVS Juridico"},{"processId":"SI
…
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-processo-in-3d365-io-de-um-usuário-de-Compras-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-processo-in-3d365-io-de-um-usuário-de-Compras-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-processo-in-3d365-io-de-um-usuário-de-Compras-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/plataforma/e2e-plataforma-processo-in-3d365-io-de-um-usuário-de-Compras-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=273659 npx playwright test tests/e2e/plataforma/processo-inativo-e-residuo.spec.js -g "CT-PLT-08-S1 @bug: o processo `teste` (categoria ADMIN) não deveria constar do catálogo de início de um usuário de Compras"`

---

### 57. CT-PFN-02-S2 @bug deve recusar um token de redefinição expirado/adulterado sem efetivar a troca

- **Arquivo:** `e2e/portais/acesso-fornecedor.spec.js:107` · **Suíte:** Redefinição de senha do fornecedor — link de reset · **Duração:** 5.1 s · **Tags:** bug
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-PFN-02-S2 — Link de reset expirado/adulterado
- **Causa raiz:** G11 — Contratos de API — notificações, favoritos, reset de senha do fornecedor e delegação de fiscais
- **O que acontece:** Enviar um token de redefinição de senha adulterado/expirado ao endpoint do Portal do Fornecedor responde **HTTP 500**.
- **Por que falha:** O endpoint não trata token inválido como erro controlado (4xx) — crasha. A troca não se efetiva, mas o comportamento é de exceção não tratada.
- **Onde falha:** `expect(status).toBeLessThan(500)` em `acesso-fornecedor.spec.js`. (local exato: `tests/e2e/portais/acesso-fornecedor.spec.js:134`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é o par requisição/resposta do endpoint, transcrito na mensagem da falha.

**Mensagem da falha:**

```
Error: endpoint deveria devolver um erro controlado (4xx), não crashar com 500

expect(received).toBeLessThan(expected)

Expected: < 500
Received:   500
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/portais/e2e-portais-acesso-fornece-d2706-terado-sem-efetivar-a-troca-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/portais/e2e-portais-acesso-fornece-d2706-terado-sem-efetivar-a-troca-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/portais/e2e-portais-acesso-fornece-d2706-terado-sem-efetivar-a-troca-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/portais/e2e-portais-acesso-fornece-d2706-terado-sem-efetivar-a-troca-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=974439 npx playwright test tests/e2e/portais/acesso-fornecedor.spec.js -g "CT-PFN-02-S2 @bug deve recusar um token de redefinição expirado/adulterado sem efetivar a troca"`

---

### 58. deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir @bug

- **Arquivo:** `e2e/portais/gerencia-compras.spec.js:31` · **Suíte:** Gerência de Compras · **Duração:** 36.6 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** Aba Atribuir
- **Causa raiz:** G12 — Plataforma e portais — deep-link 404, erros de console, resíduo `teste`, aba Atribuir, Clínica vazia, cache _Sync e grade truncada
- **O que acontece:** A aba "Atribuir" da Gerência de Compras nunca lista SCs (só o cabeçalho) em 30 s de poll; a aba "Transferir", com o mesmo mecanismo, lista dados reais.
- **Por que falha:** A grade de Atribuir não renderiza dados para esta conta; reclicar não resolve. O contraste com Transferir é o que separa "sem massa" de "grade quebrada".
- **Onde falha:** `expect(linhas).toBeGreaterThan(1)` em `gerencia-compras.spec.js`. (local exato: `tests/e2e/portais/gerencia-compras.spec.js:58`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: aba Atribuir deveria listar as SCs pendentes de atribuição

aba Atribuir deveria listar as SCs pendentes de atribuição

expect(received).toBeGreaterThan(expected)

Expected: > 1
Received:   1

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/portais/e2e-portais-gerencia-compr-b9d06-ao-abrir-a-aba-Atribuir-bug-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/portais/e2e-portais-gerencia-compr-b9d06-ao-abrir-a-aba-Atribuir-bug-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/portais/e2e-portais-gerencia-compr-b9d06-ao-abrir-a-aba-Atribuir-bug-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/portais/e2e-portais-gerencia-compr-b9d06-ao-abrir-a-aba-Atribuir-bug-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=415388 npx playwright test tests/e2e/portais/gerencia-compras.spec.js -g "deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir @bug"`

---

### 59. CT-ADM-01-H @bug — deveria abrir um formulário de admissão de novo funcionário

- **Arquivo:** `e2e/rh/admissao.spec.js:36` · **Suíte:** Automação Admissão · **Duração:** 17.3 s · **Tags:** bug
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-ADM-01-H — Admissão integra novo funcionário (feliz)
- **Causa raiz:** G10 — RH — Admissão abre o formulário errado e o Banco de Horas segue sem integração
- **O que acontece:** Iniciar `wf_automacao_admissao` abre o formulário "Gestão de Benefícios - Plano de Saúde" (template de `rh_gbeneficios_planosaude`).
- **Por que falha:** Associação processo↔formulário incorreta na publicação do processo. CT-ADM-01-S1 e S2 ficam inexequíveis por consequência.
- **Onde falha:** `expect(titulo).not.toBe("Gestão de Benefícios - Plano de Saúde")` em `admissao.spec.js`. (local exato: `tests/e2e/rh/admissao.spec.js:81`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: defeito: o processo de Admissão (wf_automacao_admissao) abre o formulário de Plano de Saúde (mesmo template de rh_gbeneficios_planosaude) em vez de um formulário de admissão — associação processo↔formulário incorreta

expect(received).not.toBe(expected) // Object.is equality

Expected: not "Gestão de Benefícios - Plano de Saúde"
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/rh/e2e-rh-admissao-Automação--26af2-dmissão-de-novo-funcionário-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/rh/e2e-rh-admissao-Automação--26af2-dmissão-de-novo-funcionário-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/rh/e2e-rh-admissao-Automação--26af2-dmissão-de-novo-funcionário-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/rh/e2e-rh-admissao-Automação--26af2-dmissão-de-novo-funcionário-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=789371 npx playwright test tests/e2e/rh/admissao.spec.js -g "CT-ADM-01-H @bug — deveria abrir um formulário de admissão de novo funcionário"`

---

### 60. CT-BH-01-S2 @bug — autorizar horas acima do limite deve bloquear

- **Arquivo:** `e2e/rh/banco-horas-limite.spec.js:38` · **Suíte:** Portal de Autorização de Horas Extras — limite de autorização · **Duração:** 39.7 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-BH-01-S2 — Autorizar horas acima do limite · U-02 — Banco de Horas sem integração com o Protheus
- **Causa raiz:** G10 — RH — Admissão abre o formulário errado e o Banco de Horas segue sem integração
- **O que acontece:** A aba Autorização do Banco de Horas fica em "Aguarde, processando" por 30 s ou mais e nenhum campo aparece.
- **Por que falha:** Integração com o Protheus não configurada para o widget (mesma causa de U-02); o cenário "acima do limite" não é alcançável por esta rota.
- **Onde falha:** `expect(getByText("Aguarde, processando")).toBeHidden()` em `banco-horas-limite.spec.js`. (local exato: `tests/e2e/rh/banco-horas-limite.spec.js:71`)
- **Valor da screenshot:** **é a evidência** — o defeito é visível na captura.

**Mensagem da falha:**

```
Error: defeito: a aba Autorização do Banco de Horas nunca sai do estado "Aguarde, processando" — mesma causa raiz de U-02 (integração com o Protheus fora do ar). Nenhum campo de autorização de horas aparece, então "autorizar acima do limite deve bloquear" não é executável por esta rota.

expect(locator).toBeHidden() failed

Locator:  getByText('Aguarde, processando')
Expected: hidden
Received: visible
Timeout:  30000ms
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/rh/e2e-rh-banco-horas-limite--39157-ima-do-limite-deve-bloquear-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/rh/e2e-rh-banco-horas-limite--39157-ima-do-limite-deve-bloquear-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/rh/e2e-rh-banco-horas-limite--39157-ima-do-limite-deve-bloquear-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/rh/e2e-rh-banco-horas-limite--39157-ima-do-limite-deve-bloquear-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=641464 npx playwright test tests/e2e/rh/banco-horas-limite.spec.js -g "CT-BH-01-S2 @bug — autorizar horas acima do limite deve bloquear"`

---

### 61. CT-BH-01-S1 @bug — não deve alertar o usuário final com erro de configuração de servidor ao abrir o Banco de Horas

- **Arquivo:** `e2e/rh/banco-horas.spec.js:14` · **Suíte:** Portal de Autorização de Horas Extras · **Duração:** 6.4 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-BH-01-S1 — Parâmetros de servidor ausentes  ⚠️ defeito conhecido (U-02) · U-02 — Banco de Horas sem integração com o Protheus
- **Causa raiz:** G10 — RH — Admissão abre o formulário errado e o Banco de Horas segue sem integração
- **O que acontece:** Ao abrir o Banco de Horas, um `alert()` nativo diz "Existem parâmetros não informado para esse servidor, informe o administrador".
- **Por que falha:** Erro de configuração de servidor exposto ao usuário final. Capturado com `page.on("dialog")` registrado ANTES da navegação — sem isso o Playwright dispensa o diálogo e a falha some.
- **Onde falha:** `expect(dialogos).toEqual([])` em `banco-horas.spec.js`. (local exato: `tests/e2e/rh/banco-horas.spec.js:33`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é o `alert()` nativo capturado por `page.on("dialog")` ANTES da navegação. O Playwright dispensa o diálogo sozinho, então ele **nunca** aparece na screenshot — o texto está na mensagem da falha.

**Mensagem da falha:**

```
Error: o widget não deveria expor erro de configuração de servidor ao usuário final via alert() nativo — ver defeito U-02

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 6

- Array []
+ Array [
+   Object {
+     "message": "Existem parâmetros não informado para esse servidor, informe o administrador",
+     "type": "alert",
+   },
+ ]
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/rh/e2e-rh-banco-horas-Portal--3605c-r-ao-abrir-o-Banco-de-Horas-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/rh/e2e-rh-banco-horas-Portal--3605c-r-ao-abrir-o-Banco-de-Horas-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/rh/e2e-rh-banco-horas-Portal--3605c-r-ao-abrir-o-Banco-de-Horas-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/rh/e2e-rh-banco-horas-Portal--3605c-r-ao-abrir-o-Banco-de-Horas-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=760064 npx playwright test tests/e2e/rh/banco-horas.spec.js -g "CT-BH-01-S1 @bug — não deve alertar o usuário final com erro de configuração de servidor ao abrir o Banco de Horas"`

---

### 62. Clínica/Unidade deveriam identificar a clínica do diagnóstico e não nascer vazias @bug

- **Arquivo:** `e2e/saude/questionario-clinicassi.spec.js:217` · **Suíte:** Questionário CliniCASSI — contexto da clínica (CT-CLI-02-S1, achado U-14) · **Duração:** 5.3 s · **Tags:** bug
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-CLI-02-S1 — Job de início parado  ⚠️ (U-14) · U-14 — campo Clínica vazio no Questionário CliniCASSI
- **Causa raiz:** G12 — Plataforma e portais — deep-link 404, erros de console, resíduo `teste`, aba Atribuir, Clínica vazia, cache _Sync e grade truncada
- **O que acontece:** O campo "Clínica" do Questionário CliniCASSI nasce vazio em vez de identificar a clínica do diagnóstico.
- **Por que falha:** Sintoma compatível com o job `dsQDC000` parado (U-14); sem acesso admin a suíte só confirma o sintoma, não a causa.
- **Onde falha:** `expect(clinica).not.toBe("")` em `questionario-clinicassi.spec.js`. (local exato: `tests/e2e/saude/questionario-clinicassi.spec.js:232`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é o valor lido do campo "Clínica" pelo teste, citado na mensagem da falha. Na captura o campo não está enquadrado: o texto "CliniCASSI" que aparece é o título do questionário, não o campo vazio.

**Mensagem da falha:**

```
Error: o campo "Clínica" deveria vir preenchido com a clínica do diagnóstico — sintoma compatível com o achado U-14 (job dsQDC000 parado); sem acesso admin, a suíte não confirma a causa, só o sintoma

expect(received).not.toBe(expected) // Object.is equality

Expected: not ""
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/saude/e2e-saude-questionario-cli-e351b-ico-e-não-nascer-vazias-bug-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/saude/e2e-saude-questionario-cli-e351b-ico-e-não-nascer-vazias-bug-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/saude/e2e-saude-questionario-cli-e351b-ico-e-não-nascer-vazias-bug-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/saude/e2e-saude-questionario-cli-e351b-ico-e-não-nascer-vazias-bug-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=945260 npx playwright test tests/e2e/saude/questionario-clinicassi.spec.js -g "Clínica/Unidade deveriam identificar a clínica do diagnóstico e não nascer vazias @bug"`

---

### 63. CT-SEG-02-S1 @bug: contas de integração/serviço não devem ter privilégio de administrador

- **Arquivo:** `e2e/seguranca/auditoria-datasets.spec.js:18` · **Suíte:** Segurança — auditoria de datasets sem acesso admin · **Duração:** 1.3 s · **Tags:** bug:
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-SEG-02-S1 — Least-privilege dos administradores  🔒 (U-13) · U-13 — contas técnicas com privilégio de administrador
- **Causa raiz:** G7 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos
- **O que acontece:** 6 de 23 administradores da plataforma têm login/nome de conta de integração/serviço (`consumerkey`, `fluig_consumer`, `integr`…).
- **Por que falha:** Contas técnicas com privilégio de administrador — menor privilégio violado.
- **Onde falha:** `expect(tecnicasAdmin).toBe(0)` em `auditoria-datasets.spec.js`. (local exato: `tests/e2e/seguranca/auditoria-datasets.spec.js:68`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a resposta HTTP do dataset, transcrita na mensagem da falha.

**Mensagem da falha:**

```
Error: 6 de 23 administradores da plataforma têm login/nome compatível com conta de integração/serviço (padrões: consumerkey, consumer_key, fluig_consumer, integr). Contas técnicas não deveriam ter privilégio de administrador de plataforma — menor privilégio violado. Ver CT-SEG-02-S1 / achado U-13.

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 6
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-auditoria-da-54221-privilégio-de-administrador-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-auditoria-da-54221-privilégio-de-administrador-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-auditoria-da-54221-privilégio-de-administrador-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-auditoria-da-54221-privilégio-de-administrador-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=312571 npx playwright test tests/e2e/seguranca/auditoria-datasets.spec.js -g "CT-SEG-02-S1 @bug: contas de integração/serviço não devem ter privilégio de administrador"`

---

### 64. CT-SEG-03-S1 @bug: dataset de credencial de integração não deve ser legível por sessão sem privilégio admin

- **Arquivo:** `e2e/seguranca/auditoria-datasets.spec.js:71` · **Suíte:** Segurança — auditoria de datasets sem acesso admin · **Duração:** 0.6 s · **Tags:** bug:
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-SEG-03-S1 — Credencial de integração exposta  🔒 (U-03) · U-03 — dataset de credencial de integração legível sem admin
- **Causa raiz:** G7 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos
- **O que acontece:** O dataset `ds_Fluig` ("Usuário e Senha usuario de integração") responde 200 (1 registro, 3 colunas) para a sessão não-admin.
- **Por que falha:** Dataset de credencial sem restrição de acesso; `/webdesk` nega (403) mas o dataset não. A evidência é estrutural — o conteúdo nunca é lido pelo teste.
- **Onde falha:** `expect(status).toBe(403)` em `auditoria-datasets.spec.js`. (local exato: `tests/e2e/seguranca/auditoria-datasets.spec.js:100`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a resposta HTTP do dataset, transcrita na mensagem da falha. Só a forma da resposta é lida (1 registro, 3 colunas) — o conteúdo da credencial nunca é aberto.

**Mensagem da falha:**

```
Error: dataset 'ds_Fluig' (descrito no ambiente como "Usuário e Senha usuario de integração") respondeu 200 para uma sessão sem privilégio administrativo — deveria negar acesso (403), como acontece em /webdesk (CT-SEG-05-S1). Evidência estrutural, nunca o conteúdo: 1 registro(s), 3 coluna(s) na resposta. Ver CT-SEG-03-S1 / achado U-03.

expect(received).toBe(expected) // Object.is equality

Expected: 403
Received: 200
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-auditoria-da-1e968-sessão-sem-privilégio-admin-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-auditoria-da-1e968-sessão-sem-privilégio-admin-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-auditoria-da-1e968-sessão-sem-privilégio-admin-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-auditoria-da-1e968-sessão-sem-privilégio-admin-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=783690 npx playwright test tests/e2e/seguranca/auditoria-datasets.spec.js -g "CT-SEG-03-S1 @bug: dataset de credencial de integração não deve ser legível por sessão sem privilégio admin"`

---

### 65. CT-SEG-04-S1 @bug: datasets de execução de SQL não devem ser alcançáveis por sessão sem privilégio admin

- **Arquivo:** `e2e/seguranca/auditoria-datasets.spec.js:103` · **Suíte:** Segurança — auditoria de datasets sem acesso admin · **Duração:** 0.7 s · **Tags:** bug:
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Caso de teste:** CT-SEG-04-S1 — Execução de SQL / injeção  🔒 (U-04) · U-04 — executor de SQL alcançável sem admin
- **Causa raiz:** G7 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos
- **O que acontece:** `dsFluig_executeSql` e `dsFluig_getDocumentSql` (executores de SQL) respondem 200 para a sessão não-admin.
- **Por que falha:** Executor de SQL alcançável sem privilégio elevado. A auditoria de injeção real está fora de escopo; esta assertion cobre só a alcançabilidade, que já basta.
- **Onde falha:** `expect(status).toBe(403)` em `auditoria-datasets.spec.js`. (local exato: `tests/e2e/seguranca/auditoria-datasets.spec.js:130`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a resposta HTTP do dataset, transcrita na mensagem da falha.

**Mensagem da falha:**

```
Error: dataset 'dsFluig_executeSql' (executor de SQL, achado U-04) respondeu 200 para sessão sem perfil admin — deveria exigir privilégio elevado (403). Auditoria de injeção real está fora de escopo (ver comentário no topo do teste); esta assertion cobre só a alcançabilidade.

expect(received).toBe(expected) // Object.is equality

Expected: 403
Received: 200
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-auditoria-da-3b81e-sessão-sem-privilégio-admin-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-auditoria-da-3b81e-sessão-sem-privilégio-admin-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-auditoria-da-3b81e-sessão-sem-privilégio-admin-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-auditoria-da-3b81e-sessão-sem-privilégio-admin-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=111503 npx playwright test tests/e2e/seguranca/auditoria-datasets.spec.js -g "CT-SEG-04-S1 @bug: datasets de execução de SQL não devem ser alcançáveis por sessão sem privilégio admin"`

---

### 66. CT-SEG-07-S1 @bug — não deve entregar o objeto de um processo em que o usuário não participa

- **Arquivo:** `e2e/seguranca/isolamento-horizontal-api-processos.spec.js:59` · **Suíte:** Segurança — isolamento horizontal na API v2 de processos (BOLA) · **Duração:** 5.1 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-SEG-07-S1 — Isolamento horizontal na API v2 de processos (BOLA/IDOR interno)
- **Causa raiz:** G7 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos
- **O que acontece:** `TOTVS-FS` — que não é requisitante, responsável nem participante da instância 112009 de `bpm_recepcao_documentos_fiscais_compras` (8 tarefas inspecionadas, nenhuma sua), processo que a conta nem pode iniciar — recebe HTTP 200 com 44 `formFields`, incluindo razão social e CNPJ.
- **Por que falha:** Isolamento horizontal quebrado na API v2 de processos; o `processInstanceId` é sequencial, então qualquer sessão autenticada enumera a base inteira de documentos fiscais.
- **Onde falha:** Verificação do status e dos `formFields` em `isolamento-horizontal-api-processos.spec.js`. (local exato: `tests/e2e/seguranca/isolamento-horizontal-api-processos.spec.js:177`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é o HTTP 200 com 44 `formFields` da instância 112009, resumido na mensagem da falha.

**Mensagem da falha:**

```
Error: BOLA / isolamento horizontal violado: a conta 'TOTVS-FS' (que NÃO é requisitante, responsável nem participante — 8 tarefa(s) da instância inspecionadas, nenhuma sua) leu o objeto da instância 112009 do processo 'bpm_recepcao_documentos_fiscais_compras' — um processo que esta conta nem sequer pode INICIAR. Esperado: 403/404, ou 200 com formFields:null. Obtido: HTTP 200 com 44 formField(s) do formulário completo (que inclui razão social e CNPJ do fornecedor). A ausência de 403 aqui significa que qualquer sessão autenticada enumera a base inteira de documentos fiscais pelo processInstanceId sequencial. Vermelho intencional — ver CT-SEG-07-S1.

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-isolamento-h-4e892-que-o-usuário-não-participa-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-isolamento-h-4e892-que-o-usuário-não-participa-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-isolamento-h-4e892-que-o-usuário-não-participa-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-isolamento-h-4e892-que-o-usuário-não-participa-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=506363 npx playwright test tests/e2e/seguranca/isolamento-horizontal-api-processos.spec.js -g "CT-SEG-07-S1 @bug — não deve entregar o objeto de um processo em que o usuário não participa"`

---

### 67. não deve enviar dados de navegação para o Google Analytics @bug

- **Arquivo:** `e2e/seguranca/lgpd-envio-google-analytics.spec.js:22` · **Suíte:** LGPD — telemetria enviada a serviço externo · **Duração:** 14.3 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** U-11 — telemetria enviada ao Google Analytics
- **Causa raiz:** G7 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos
- **O que acontece:** 2 requisições de navegação para `google-analytics.com` (medição `G-F0FT6D1NQG`) numa única carga.
- **Por que falha:** Telemetria externa ativa. A pergunta aberta nº 3 do README pede posição da área de Privacidade/LGPD sobre isso.
- **Onde falha:** `expect(envios).toBe(0)` em `lgpd-envio-google-analytics.spec.js`. (local exato: `tests/e2e/seguranca/lgpd-envio-google-analytics.spec.js:45`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é as 2 requisições de rede para `google-analytics.com` capturadas na carga — tráfego de rede não aparece em screenshot.

**Mensagem da falha:**

```
Error: 2 requisição(ões) de navegação enviada(s) a google-analytics.com (medição G-F0FT6D1NQG). Ver achado U-11 / mapa-do-ambiente.md.

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 2
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-lgpd-envio-g-ebcf1-para-o-Google-Analytics-bug-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-lgpd-envio-g-ebcf1-para-o-Google-Analytics-bug-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-lgpd-envio-g-ebcf1-para-o-Google-Analytics-bug-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-lgpd-envio-g-ebcf1-para-o-Google-Analytics-bug-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=625560 npx playwright test tests/e2e/seguranca/lgpd-envio-google-analytics.spec.js -g "não deve enviar dados de navegação para o Google Analytics @bug"`

---

### 68. CT-SEG-08-S1 @bug — "bpm_addUserFluig" (Adicionar Usuário) não deve constar do catálogo nem abrir para conta não-admin

- **Arquivo:** `e2e/seguranca/processos-administrativos-usuario-comum.spec.js:39` · **Suíte:** Segurança — processos administrativos não devem abrir para usuário comum · **Duração:** 8.0 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-SEG-08-S1 — Processos administrativos abertos a usuário comum
- **Causa raiz:** G7 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos
- **O que acontece:** `bpm_addUserFluig` (Adicionar Usuário) consta do catálogo `onlyCanStart` da conta não-admin, e abri-lo não exibe o diálogo de erro de permissão.
- **Por que falha:** Processo de criação de usuário iniciável por perfil de Compras — segregação de função violada.
- **Onde falha:** Leitura do catálogo e abertura do processo em `processos-administrativos-usuario-comum.spec.js`. (local exato: `tests/e2e/seguranca/processos-administrativos-usuario-comum.spec.js:88`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a lista de processos devolvida pelo catálogo (`onlyCanStart`), transcrita na íntegra na mensagem da falha.

**Mensagem da falha:**

```
Error: o processo administrativo 'bpm_addUserFluig' consta do catálogo de início desta conta não-admin. Um processo de criação de usuário/grupo na plataforma não deveria ser iniciável por um perfil de Compras — segregação de função violada. Ver CT-SEG-08-S1.

expect(received).not.toContain(expected) // indexOf

Expected value: not "bpm_addUserFluig"
Received array:     ["bpm_addUserGroup", "bpm_addUserFluig", "teste", "wf_cadastro_fornecedor", "wf_cotacao_produtos_servicos", "wf_negociacao_cotacao_prod_serv", "wf_solicitacao_compras", "wf_solicitacao_compras_parecer", "wf_SubstituiçãoCargosFluig", "wf_delegacaoFiscalContratoServico", "wf_faturamento_contratos", "bpm_financeiro_rejeicoes_bancarias", "prc_questionario_v2", "GestaoDependentes", "rh_gbeneficios_planosaude", "wf_automacao_admissao", "wf_pagamento_horas_extras", "wf_substituicaocargos", "FLUIGADHOC", "SIGAJURI_AprovaFU", "SIGAJURI_Consultivo", "SIGAJURI_Contencioso", "SIGAJURI_Contrato"]
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-processos-ad-417ae--abrir-para-conta-não-admin-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-processos-ad-417ae--abrir-para-conta-não-admin-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-processos-ad-417ae--abrir-para-conta-não-admin-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-processos-ad-417ae--abrir-para-conta-não-admin-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=68282 npx playwright test tests/e2e/seguranca/processos-administrativos-usuario-comum.spec.js -g "CT-SEG-08-S1 @bug — \"bpm_addUserFluig\" (Adicionar Usuário) não deve constar do catálogo nem abrir para conta não-admin"`

---

### 69. CT-SEG-08-S1 @bug — "bpm_addUserGroup" (Adicionar Grupo) não deve constar do catálogo nem abrir para conta não-admin

- **Arquivo:** `e2e/seguranca/processos-administrativos-usuario-comum.spec.js:39` · **Suíte:** Segurança — processos administrativos não devem abrir para usuário comum · **Duração:** 7.0 s · **Tags:** bug
- **Natureza:** Defeito de produto — já catalogado no README
- **Caso de teste:** CT-SEG-08-S1 — Processos administrativos abertos a usuário comum
- **Causa raiz:** G7 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos
- **O que acontece:** `bpm_addUserGroup` (Adicionar Grupo) consta do catálogo da conta não-admin **e o formulário de início carregou com o botão "Enviar" visível** — o processo administrativo abriu de fato.
- **Por que falha:** É a superfície da escalada de privilégio: não só o processo é ofertado, como a tela de criação de grupo fica operável para um perfil de negócio.
- **Onde falha:** Verificação do botão Enviar em `processos-administrativos-usuario-comum.spec.js`. (local exato: `tests/e2e/seguranca/processos-administrativos-usuario-comum.spec.js:88`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a lista de processos devolvida pelo catálogo (`onlyCanStart`), transcrita na íntegra na mensagem da falha. Neste caso o print ajuda: mostra o formulário de Adicionar Grupo aberto, com o botão Enviar visível.

**Mensagem da falha:**

```
Error: o processo administrativo 'bpm_addUserGroup' consta do catálogo de início desta conta não-admin. Um processo de criação de usuário/grupo na plataforma não deveria ser iniciável por um perfil de Compras — segregação de função violada. Ver CT-SEG-08-S1.

expect(received).not.toContain(expected) // indexOf

Expected value: not "bpm_addUserGroup"
Received array:     ["bpm_addUserGroup", "bpm_addUserFluig", "teste", "wf_cadastro_fornecedor", "wf_cotacao_produtos_servicos", "wf_negociacao_cotacao_prod_serv", "wf_solicitacao_compras", "wf_solicitacao_compras_parecer", "wf_SubstituiçãoCargosFluig", "wf_delegacaoFiscalContratoServico", "wf_faturamento_contratos", "bpm_financeiro_rejeicoes_bancarias", "prc_questionario_v2", "GestaoDependentes", "rh_gbeneficios_planosaude", "wf_automacao_admissao", "wf_pagamento_horas_extras", "wf_substituicaocargos", "FLUIGADHOC", "SIGAJURI_AprovaFU", "SIGAJURI_Consultivo", "SIGAJURI_Contencioso", "SIGAJURI_Contrato"]
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-processos-ad-1c78e--abrir-para-conta-não-admin-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-processos-ad-1c78e--abrir-para-conta-não-admin-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-processos-ad-1c78e--abrir-para-conta-não-admin-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/seguranca/e2e-seguranca-processos-ad-1c78e--abrir-para-conta-não-admin-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=332790 npx playwright test tests/e2e/seguranca/processos-administrativos-usuario-comum.spec.js -g "CT-SEG-08-S1 @bug — \"bpm_addUserGroup\" (Adicionar Grupo) não deve constar do catálogo nem abrir para conta não-admin"`

---

### 70. CT-TSK-07-H @destrutivo — "Somente salvar" deve persistir o rascunho sem movimentar a atividade

- **Arquivo:** `e2e/tarefas/acoes-da-tarefa.spec.js:184` · **Suíte:** Ações da tarefa — Somente salvar e Transferir (CT-TSK-07/08) · **Duração:** 221.7 s · **Tags:** destrutivo
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Caso de teste:** CT-TSK-07-H — "Somente salvar" — salvar sem movimentar
- **Causa raiz:** G13 — BPMN lento — a SC não sai de "Grava SC e Anexos" dentro dos 180 s do orçamento de espera
- **O que acontece:** A SC #113221, criada pelo próprio teste, não ficou assumível em Validação do Gestor Imediato dentro de 180 s; atividade observada: "Grava SC e Anexos".
- **Por que falha:** Latência do BPMN acima do orçamento. O teste aborta antes de exercitar "Somente salvar", que é a ação sob teste.
- **Onde falha:** Poll `toPass({ timeout: 180_000 })` em `acoes-da-tarefa.spec.js:87`. (local exato: `tests/e2e/tarefas/acoes-da-tarefa.spec.js:86`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a etapa em que a solicitação realmente parou, lida no detalhe do processo e citada na mensagem da falha.

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: a SC #113221, criada por este teste, não ficou assumível ("Assumir tarefa") em Validação do Gestor Imediato dentro de 180s. Isto NÃO é defeito da ação sob teste (Somente salvar / Transferir) — pode ser lentidão do BPMN acima do observado em campo (~76s), ou a tarefa ter sido assumida por outra execução concorrente que pega a primeira do pool (tests/e2e/tarefas/assumir-tarefa-pool.spec.js). Atividade atual observada: "Grava SC e Anexos". Causa do polling: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Assumir tarefa' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/43/e2e-tarefas-acoes-da-taref-4de7b--sem-movimentar-a-atividade-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/43/e2e-tarefas-acoes-da-taref-4de7b--sem-movimentar-a-atividade-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/43/e2e-tarefas-acoes-da-taref-4de7b--sem-movimentar-a-atividade-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/43/e2e-tarefas-acoes-da-taref-4de7b--sem-movimentar-a-atividade-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=222238 npx playwright test tests/e2e/tarefas/acoes-da-tarefa.spec.js -g "CT-TSK-07-H @destrutivo — \"Somente salvar\" deve persistir o rascunho sem movimentar a atividade"`

---

### 71. CT-TSK-08-H @destrutivo — transferir deve trocar o responsável mantendo a mesma atividade

- **Arquivo:** `e2e/tarefas/acoes-da-tarefa.spec.js:297` · **Suíte:** Ações da tarefa — Somente salvar e Transferir (CT-TSK-07/08) · **Duração:** 215.9 s · **Tags:** destrutivo
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Caso de teste:** CT-TSK-08-H — Transferir atividade
- **Causa raiz:** G13 — BPMN lento — a SC não sai de "Grava SC e Anexos" dentro dos 180 s do orçamento de espera
- **O que acontece:** A SC #113222 não ficou assumível em Validação do Gestor Imediato dentro de 180 s; atividade observada: "Grava SC e Anexos".
- **Por que falha:** Mesma latência de BPMN. O teste aborta antes de exercitar Transferir.
- **Onde falha:** Poll `toPass({ timeout: 180_000 })` em `acoes-da-tarefa.spec.js:87`. (local exato: `tests/e2e/tarefas/acoes-da-tarefa.spec.js:86`)
- **Valor da screenshot:** **contexto, não prova** — o defeito não é visualmente observável. A prova é a etapa em que a solicitação realmente parou, lida no detalhe do processo e citada na mensagem da falha.

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: a SC #113222, criada por este teste, não ficou assumível ("Assumir tarefa") em Validação do Gestor Imediato dentro de 180s. Isto NÃO é defeito da ação sob teste (Somente salvar / Transferir) — pode ser lentidão do BPMN acima do observado em campo (~76s), ou a tarefa ter sido assumida por outra execução concorrente que pega a primeira do pool (tests/e2e/tarefas/assumir-tarefa-pool.spec.js). Atividade atual observada: "Grava SC e Anexos". Causa do polling: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Assumir tarefa' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/44/e2e-tarefas-acoes-da-taref-63925--mantendo-a-mesma-atividade-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/44/e2e-tarefas-acoes-da-taref-63925--mantendo-a-mesma-atividade-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/44/e2e-tarefas-acoes-da-taref-63925--mantendo-a-mesma-atividade-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results-0903/destrutivos/44/e2e-tarefas-acoes-da-taref-63925--mantendo-a-mesma-atividade-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=930608 npx playwright test tests/e2e/tarefas/acoes-da-tarefa.spec.js -g "CT-TSK-08-H @destrutivo — transferir deve trocar o responsável mantendo a mesma atividade"`

