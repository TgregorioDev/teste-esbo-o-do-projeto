# Falhas da suíte E2E — TOTVS Fluig Cassi — execução de 02/09/2026

| | |
|---|---|
| **Data** | 02/09/2026, 14h55–15h40 (BRT) |
| **Ambiente** | `https://caixade182374.fluig.cloudtotvs.com.br` · usuário `TOTVS-FS` |
| **Commit** | `aab374b` (branch `emdash/teste-2-jxzxn`) |
| **Runtime** | Playwright 1.62.1 · Node 22.22.2 · Chromium (Desktop Chrome, pt-BR) |
| **Modo** | execução completa, **destrutivos incluídos**, sem retry, 16 fatias sequenciais |
| **Resultado** | **233 testes · 152 verdes · 81 vermelhos** |

> A versão HTML deste documento (`relatorio-falhas-2026-09-02.html`) traz as screenshots, o trecho de código,
> o aria-snapshot e o call log embutidos em cada cartão. Este Markdown tem a mesma análise e aponta os artefatos por caminho.

## Leitura em uma frase

Das **81** falhas, **24** são uma única divergência de ambiente (o combo "Tipo de Solicitação" perdeu a opção
"Renovação Contratual", que a suíte usa) e mascaram o veredito real — reexecutadas com "Aditivo Contratual", **9 passam e
15 reprovam por defeito próprio**. Das demais **57**: **27** defeitos já catalogados no README (vermelhos
intencionais), **16** defeitos não catalogados, **8** pré-condições ausentes (latência do BPMN, filas vazias),
**3** outras divergências de ambiente (catálogo de processos mudou; lista de tipos do modal) e
**3** sem veredito / não determinísticas. Nenhuma falha foi atribuída a erro de código da suíte.

## Por natureza

| Natureza | Testes |
|---|---|
| Divergência ambiente × suíte (o ambiente mudou) | 27 |
| Defeito de produto — já catalogado no README | 27 |
| Defeito de produto — achado desta execução (não catalogado) | 16 |
| Pré-condição ausente (ambiente / massa / latência) | 8 |
| Sem veredito (falhou antes da assertion de domínio) | 2 |
| Comportamento não determinístico do produto | 1 |

## Por causa raiz

| Grupo | Causa raiz | Natureza | Testes |
|---|---|---|---|
| G1 | O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` | Divergência ambiente × suíte (o ambiente mudou) | 24 |
| G2 | D-01 — a SC nasce presa no marco de Início, na conta de integração | Defeito de produto — já catalogado no README | 0 (0 na execução principal — os 6 testes deste grupo foram mascarados por G1; 5 confirmaram D-01 e 1 ficou sem veredito na reexecução com "Aditivo") |
| G3 | Payload da SC — valores, itens fantasma, campos chumbados e revisão vazia (D-02, D-04, CT-ACC-04-S5, CT-ACC-06, classeValor) | Defeito de produto — já catalogado no README | 0 (0 na execução principal — os 6 testes deste grupo foram mascarados por G1 e todos confirmaram o defeito na reexecução com "Aditivo" (outras 3 assertions de D-02 passaram)) |
| G4 | Formulários clássicos aceitam Enviar sem validação — fail-open, SC sem anexo, Cotação, Negociação, Parecer | Defeito de produto — já catalogado no README | 7 (mais 3 mascarados por G1 e confirmados na reexecução: CT-CMP-08-H (beco sem saída da correção), CT-ACC-04-S6 (servidor aceita tipoSolicitacao vazio) e CT-E2E-12-S1 (sem alerta de duplicidade)) |
| G5 | GED aceita qualquer extensão e qualquer conteúdo (CT-GED-02-S1 / S2) | Defeito de produto — já catalogado no README | 5 |
| G6 | Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos | Defeito de produto — já catalogado no README | 8 |
| G7 | Catálogo de processos mudou desde o inventário versionado — 6 processos passaram a ser iniciáveis | Divergência ambiente × suíte (o ambiente mudou) | 2 |
| G8 | Jurídico (SIGAJURI) — combos vazios e parte contrária inalcançável | Defeito de produto — achado desta execução (não catalogado) | 3 |
| G9 | RH — Admissão abre o formulário errado, Banco de Horas sem integração, Substituição de Cargos oscila | Defeito de produto — achado desta execução (não catalogado) | 4 |
| G10 | Contratos de API — notificações, favoritos, reset de senha do fornecedor, medição e delegação de fiscais | Defeito de produto — já catalogado no README | 7 |
| G11 | Plataforma — deep-link 404, erros de console, resíduo `teste`, Aba Atribuir, Clínica vazia, cache _Sync | Defeito de produto — já catalogado no README | 10 |
| G12 | BPMN lento — a SC não sai de "Grava SC e Anexos" dentro dos 180 s do orçamento de espera | Pré-condição ausente (ambiente / massa / latência) | 6 |
| G13 | Filas vazias — nada para operar em Cotação, Negociação e pool de tarefas | Pré-condição ausente (ambiente / massa / latência) | 3 |
| G14 | Divergências pontuais do ambiente e falhas sem veredito | Divergência ambiente × suíte (o ambiente mudou) | 2 |

## Por fatia de execução

| Fatia | Início | Duração | Testes | Verdes | Vermelhos |
|---|---|---|---|---|---|
| `tests/e2e/auth` | 15:35 | 0.2 min | 10 | 10 | 0 |
| `tests/api` | 14:55 | 0.2 min | 4 | 2 | 2 |
| `tests/e2e/acompanhamento-contratos` | 14:55 | 4.3 min | 41 | 14 | 27 |
| `tests/e2e/financeiro` | 15:00 | 0.1 min | 2 | 2 | 0 |
| `tests/e2e/saude` | 15:00 | 0.2 min | 3 | 2 | 1 |
| `tests/e2e/notificacoes` | 15:01 | 0.6 min | 4 | 2 | 2 |
| `tests/e2e/fiscal` | 15:01 | 0.6 min | 5 | 5 | 0 |
| `tests/e2e/juridico` | 15:02 | 0.3 min | 7 | 4 | 3 |
| `tests/e2e/seguranca` | 15:02 | 0.3 min | 9 | 2 | 7 |
| `tests/e2e/contratos` | 15:03 | 1.2 min | 11 | 7 | 4 |
| `tests/e2e/tarefas` | 15:04 | 4.0 min | 12 | 9 | 3 |
| `tests/e2e/documentos` | 15:08 | 1.0 min | 13 | 8 | 5 |
| `tests/e2e/rh` | 15:09 | 1.1 min | 14 | 10 | 4 |
| `tests/e2e/compras` | 15:11 | 4.6 min | 25 | 12 | 13 |
| `tests/e2e/portais` | 15:15 | 4.8 min | 29 | 27 | 2 |
| `tests/e2e/plataforma` | 15:21 | 1.2 min | 44 | 36 | 8 |
| **Total** | | 24.8 min | **233** | **152** | **81** |

## Medições suplementares (fora da execução principal)

- **Reexecução de `acompanhamento-contratos` com tipo "Aditivo Contratual"** (15h23; factory editada temporariamente e revertida, nada commitado): 41 testes, **23 verdes, 18 vermelhos**. Dos 24 mascarados pelo combo, 9 passaram e 15 reprovaram com veredito próprio (ver campo "Reexecução" em cada caso).
- **Reexecução isolada dos 6 testes de pré-condição** (15h35, sem carga concorrente): os 6 reprovaram de novo pelo mesmo motivo (SCs 113187–113191 presas em "Grava SC e Anexos" por 180 s; pool com 0 tarefas).
- **`.bat` (CT-GED-02-S2)**: 1ª execução caiu por `net::ERR_NETWORK_CHANGED` (infra); 2ª esbarrou em linhas residuais do publicador; 3ª **confirmou o defeito** (publicado sem bloqueio).

## Massa criada e limpeza

O livro-razão `test-results/criados.jsonl` registrou 34 registros criados pelos testes destrutivos (SCs #113162–#113191, medição, documentos no GED, favoritos). O `globalTeardown` rodou ao fim de cada invocação e cancelou o que aquela invocação criou; o que o cancelamento não alcança está em `docs/cancelamento-de-massa.md`.

## Causas raiz, em detalhe

### G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption`

*Divergência ambiente × suíte (o ambiente mudou) · 24 teste(s)*

A factory `factories/solicitacao-compra.js` preenche o modal com o tipo padrão "Renovação Contratual". Hoje o ambiente oferece **"Selecione...", "Aditivo Contratual" e "Nova Contratação"**: a opção que a suíte usa sumiu e uma nova entrou (o README já registrava, na pergunta aberta nº 2, que "Nova Solicitação" havia sumido antes; agora foi "Renovação Contratual"). Todo teste que passa pelo `SolicitacaoCompraModal.preencher()` fica preso em `selectOption` até o `actionTimeout` de 45 s e morre com `did not find some options` — **antes de chegar à assertion que dá nome ao teste**. Por isso essas 24 falhas NÃO dizem nada sobre o produto por si só.

**Medição suplementar:** rodei a pasta de novo com a factory apontando para "Aditivo Contratual" (edição temporária, revertida em seguida — nada foi commitado). Resultado: **9 dos 24 passam** e **15 continuam vermelhos**, agora com o veredito real de cada um (registrado cartão a cartão abaixo, no campo "Reexecução com Aditivo").

**Ação sugerida:** confirmar com a Cassi se a remoção de "Renovação Contratual" foi intencional (mesma pergunta aberta nº 2 do README, agora com a lista invertida) e alinhar `TIPO_SOLICITACAO` na factory ao que o ambiente oferece. Até lá, a cobertura real do Portal de Acompanhamento de Contratos está mascarada.

Testes:
- `e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js:242` — CT-CMP-08-H @destrutivo — reprovada e corrigida, a SC deveria voltar para a Validação do Gestor com o contrato de origem íntegro
- `e2e/acompanhamento-contratos/ciclo-gestor.spec.js:36` — @destrutivo estado inicial e responsável deveriam refletir uma etapa de trabalho do solicitante
- `e2e/acompanhamento-contratos/ciclo-gestor.spec.js:109` — @destrutivo aprovada pelo Gestor Imediato, a SC deveria avançar para Validação Orçamentária
- `e2e/acompanhamento-contratos/ciclo-gestor.spec.js:155` — @destrutivo reprovada, a SC deveria voltar para Ajustar Informações com o solicitante, itens e contrato íntegros
- `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:106` — @destrutivo a SC deveria nascer atribuída ao solicitante logado, não à conta de integração
- `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:218` — @destrutivo item de quantidade/valor zerado no contrato não deveria virar item extra na SC criada
- `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:286` — @destrutivo o servidor deveria recusar tipoSolicitacao vazio tanto quanto recusa motivoSolCompra vazio
- `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:416` — @destrutivo o portal deveria alertar sobre a SC já em andamento para o mesmo contrato/revisão
- `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:507` — CT-ACC-06-S2 — item sem quantidade no contrato deve herdar a cascata e o preço real, nunca R$ 1,00
- `e2e/acompanhamento-contratos/erros-no-start.spec.js:34` — deve avisar o usuário e permitir nova tentativa quando o start falha
- `e2e/acompanhamento-contratos/erros-no-start.spec.js:67` — deve avisar quando a SC é criada mas não pôde ser atribuída ao solicitante, em vez de anunciar sucesso pleno
- `e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js:144` — não deve enviar solicitação alguma quando o contrato não trouxe itens
- `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:59` — a SC deve nascer numa etapa de trabalho atribuída ao solicitante, não presa no marco de Início da conta de integração
- `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:100` — itens com quantidades diferentes não devem trazer o mesmo valor total
- `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:142` — não deve existir item de quantidade 1 repetindo o valor total de outro item
- `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:174` — itens com quantidade e preço diferentes não deveriam compartilhar o mesmo valor total
- `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:219` — classeOrca, classificação e o descritor deveriam refletir o contrato de origem, não vir fixos para todos
- `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:275` — os valores monetários devem ser numericamente coerentes, sem NaN, sem casa perdida e sem inflação
- `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:309` — as linhas de rateio devem trazer percentual, centro de custo e classe de valor preenchidos, somando 100%
- `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:339` — classeValor do item deveria vir preenchido junto com classeOrca e classificação
- `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:365` — duplo clique em Confirmar não deve disparar duas requisições de start
- `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:434` — não deve permitir que nrContrato divirja do contrato real da revisão/filial/itens enviados
- `e2e/acompanhamento-contratos/validacoes-solicitacao.spec.js:48` — deve cobrar apenas os campos restantes quando o tipo já foi informado
- `e2e/acompanhamento-contratos/validacoes-solicitacao.spec.js:65` — deve cobrar somente o motivo quando tipo e data já foram informados

### G2 — D-01 — a SC nasce presa no marco de Início, na conta de integração

*Defeito de produto — já catalogado no README · 0 teste(s)*

O widget envia `targetState: 6` (START_EVENT_NORMAL) com `targetAssignee: consumerkeycompras`. A SC é criada, a transferência para o solicitante falha (HTTP 500 em `dsFluig_postProcessesTransfer`) e a tela ainda anuncia "iniciado com sucesso". Consequência em cascata: nada criado pelo portal chega ao Gestor, ao Protheus, à Cotação ou à Negociação. Confirmado hoje pelo payload capturado (`targetState=6`) e pela SC 113182, que nasceu com responsável "Usuário Integrador Fluig".

Testes:
- (nenhum na execução principal)

Testes deste grupo mascarados por G1 na execução principal (veredito da reexecução com "Aditivo Contratual"):
- `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:59` — a SC deve nascer numa etapa de trabalho atribuída ao solicitante, não presa no marco de Início da conta de integração
  - Reexecutado com "Aditivo": o payload capturado traz `targetState: 6` — a SC nasce presa no marco de Início. D-01 (causa isolada) confirmado.
- `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:106` — @destrutivo a SC deveria nascer atribuída ao solicitante logado, não à conta de integração
  - Reexecutado com "Aditivo": a SC 113182 nasceu com responsável "Usuário Integrador Fluig" em vez do solicitante — D-01 confirmado.
- `e2e/acompanhamento-contratos/erros-no-start.spec.js:67` — deve avisar quando a SC é criada mas não pôde ser atribuída ao solicitante, em vez de anunciar sucesso pleno
  - Reexecutado com "Aditivo": com a transferência (`dsFluig_postProcessesTransfer`) forçada a 500, a única mensagem exibida foi "Sucesso! Processo 999999 iniciado com sucesso!". O erro é engolido. D-01 (sintoma) confirmado.
- `e2e/acompanhamento-contratos/ciclo-gestor.spec.js:109` — @destrutivo aprovada pelo Gestor Imediato, a SC deveria avançar para Validação Orçamentária
  - Reexecutado com "Aditivo": a SC 113178 ficou em estado "Início" e nunca chegou à "Validação do Gestor" — D-01 confirmado.
- `e2e/acompanhamento-contratos/ciclo-gestor.spec.js:155` — @destrutivo reprovada, a SC deveria voltar para Ajustar Informações com o solicitante, itens e contrato íntegros
  - Reexecutado com "Aditivo": o poll de 45 s por "Validação do Gestor" estourou — a SC não saiu de Início (D-01).
- `e2e/acompanhamento-contratos/ciclo-gestor.spec.js:36` — @destrutivo estado inicial e responsável deveriam refletir uma etapa de trabalho do solicitante
  - Reexecutado com "Aditivo": estourou `page.waitForResponse` (45 s) na Central de Tarefas ao procurar a SC recém-criada — sem veredito direto. O cabeçalho do arquivo atribui a pré-condição a D-01 (a SC presa em Início não aparece em lista alguma).

### G3 — Payload da SC — valores, itens fantasma, campos chumbados e revisão vazia (D-02, D-04, CT-ACC-04-S5, CT-ACC-06, classeValor)

*Defeito de produto — já catalogado no README · 0 teste(s)*

O serviço que monta o payload do `/wf_solicitacao_compras/start` fabrica quantidade para item sem quantidade (`resolveQuant` → fallback 1), repete o valor cheio em item de qtd 1, fixa `campoDescritor` em "Sol. Compras - CASSI SEDE" para qualquer filial, manda `tbprod_classeValor` vazio em todos os itens e envia `revisaContrato: ""` para um contrato cuja revisão real é "003". Cinco assertions distintas, uma única origem: o montador do payload não lê o contrato de origem com fidelidade. Nesta execução, três assertions de D-02 (valor multiplicado) **passaram** com o contrato sorteado — o defeito depende da composição de itens do contrato.

Testes:
- (nenhum na execução principal)

Testes deste grupo mascarados por G1 na execução principal (veredito da reexecução com "Aditivo Contratual"):
- `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:218` — @destrutivo item de quantidade/valor zerado no contrato não deveria virar item extra na SC criada
  - Reexecutado com "Aditivo": contrato 000000000000001 tem 7 itens (5 com qtd/valor + 2 sem nada) e a SC nasceu com 7 — o serviço fabrica quantidade para os itens vazios (cascata `resolveQuant` → fallback 1) e eles passam pelo filtro `quant > 0`. Quantidades enviadas: [29,1,1,29,29,29,29]. Defeito confirmado.
- `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:507` — CT-ACC-06-S2 — item sem quantidade no contrato deve herdar a cascata e o preço real, nunca R$ 1,00
  - Reexecutado com "Aditivo": contrato 000000000000002 tem `CNB_QUANT` vazio e `CNB_QTDORI=36`; a SC deveria herdar 36 pela cascata e enviou quantidade 1. Defeito confirmado.
- `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:142` — não deve existir item de quantidade 1 repetindo o valor total de outro item
  - Reexecutado com "Aditivo": dois itens-fantasma de qtd 1 (#1 e #3, valorTotal 1,00) no contrato 000000000000001 — itens que não existem com valor no Protheus entram no payload como produto próprio. Defeito confirmado.
- `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:219` — classeOrca, classificação e o descritor deveriam refletir o contrato de origem, não vir fixos para todos
  - Reexecutado com "Aditivo": `campoDescritor` = "Sol. Compras - CASSI SEDE" tanto para a filial CASSI - CENTRAL DE ATENDIMENTO quanto para UNIDADE - CLINICASSI CURITIBA - PR. Campo chumbado. D-04 confirmado.
- `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:339` — classeValor do item deveria vir preenchido junto com classeOrca e classificação
  - Reexecutado com "Aditivo": `tbprod_classeValor` vazio nos 7 itens, com `classeOrca` e `classificacao` preenchidos ao lado. Defeito confirmado (README: "classeValor vazio").
- `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:434` — não deve permitir que nrContrato divirja do contrato real da revisão/filial/itens enviados
  - Reexecutado com "Aditivo": `nrContrato` aponta para um contrato cuja revisão real é "003", mas `revisaContrato` foi enviado vazio. O servidor não revalida. Defeito confirmado (README: CT-ACC-04-S5).

### G4 — Formulários clássicos aceitam Enviar sem validação — fail-open, SC sem anexo, Cotação, Negociação, Parecer

*Defeito de produto — já catalogado no README · 7 teste(s)*

Cinco formulários diferentes disparam `POST /ecm/api/rest/ecm/workflowView/send` sem nenhuma validação de cliente: a SC clássica ainda montando (CT-CMP-07-S1), a SC sem anexo obrigatório — que o **servidor também aceita** e criou a SC #113167 (CT-CMP-02-S4) —, a Cotação sem fornecedor, a Negociação sem proposta e o Parecer Técnico sem responsável. Os três últimos só não gravaram porque a `guarda-criacao` bloqueou a escrita; o `expect(guarda.tentativas()).toBe(0)` é a prova de que a tentativa saiu.

Testes:
- `e2e/compras/ciclo-cotacao.spec.js:125` — CT-COT (defeito) — o shell aceita Enviar sem nenhuma validação de fornecedor/vínculos obrigatórios
- `e2e/compras/ciclo-solicitacao-compras.spec.js:489` — CT-CMP-02-S4 — deve bloquear o envio quando nenhum anexo é informado
- `e2e/compras/ciclo-solicitacao-compras.spec.js:567` — CT-CMP-02-S4 @destrutivo — o servidor não deve criar a SC quando falta o anexo obrigatório
- `e2e/compras/fail-open-formulario-sc.spec.js:127` — CT-CMP-07-S1 @destrutivo — Enviar não deveria criar solicitação antes de o formulário terminar de montar
- `e2e/compras/negociacao-proposta.spec.js:97` — CT-NEG — o Enviar do shell sem proposta real vinculada nunca deveria completar uma requisição de escrita
- `e2e/compras/parecer-tecnico.spec.js:84` — CT-PAR-01-S1 — parecer sem responsável definido não pode completar uma requisição de escrita ao Enviar
- `e2e/compras/parecer-tecnico.spec.js:112` — CT-PAR-01-S2 — parecer desfavorável (Reprovado/Ajustes) com justificativa também é barrado pela ausência de responsável

Testes deste grupo mascarados por G1 na execução principal (veredito da reexecução com "Aditivo Contratual"):
- `e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js:242` — CT-CMP-08-H @destrutivo — reprovada e corrigida, a SC deveria voltar para a Validação do Gestor com o contrato de origem íntegro
  - Reexecutado com "Aditivo": a SC 113180 percorreu Início → Grava SC → Validação do Gestor → reprovação → "Ajustar Informações" e, ao reenviar, o Fluig recusou com "Existem campos de rateio sem preenchimento" — num rateio que veio do contrato e ninguém tocou. Beco sem saída confirmado (README: CT-CMP-08-H). Histórico completo no cartão.
- `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:286` — @destrutivo o servidor deveria recusar tipoSolicitacao vazio tanto quanto recusa motivoSolCompra vazio
  - Reexecutado com "Aditivo": start direto com `tipoSolicitacao` vazio respondeu **200** (o servidor recusa `motivoSolCompra` vazio, mas não o tipo). Validação só no cliente — contornável. Defeito confirmado, não catalogado no README.
- `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:416` — @destrutivo o portal deveria alertar sobre a SC já em andamento para o mesmo contrato/revisão
  - Reexecutado com "Aditivo": com a SC 113185 já em andamento para o contrato 000000000000001, reabrir o modal do mesmo contrato não exibe aviso algum de duplicidade. Defeito confirmado, não catalogado no README.

### G5 — GED aceita qualquer extensão e qualquer conteúdo (CT-GED-02-S1 / S2)

*Defeito de produto — já catalogado no README · 5 teste(s)*

`.exe`, `.sh`, `.bat`, `.pdf.exe` e um binário PE renomeado para `.pdf` foram todos publicados sem mensagem de bloqueio. Não há allowlist de extensão nem inspeção de conteúdo (magic bytes). O caso `.bat` caiu na execução principal por `net::ERR_NETWORK_CHANGED` (infra), tentou de novo e esbarrou em linhas residuais do publicador deixadas pela tentativa abortada, e na terceira reexecução **confirmou o mesmo defeito** dos irmãos.

Testes:
- `e2e/documentos/bloqueio-extensoes.spec.js:133` — CT-GED-02-S2 @destrutivo — script de lote (.bat) deveria ser rejeitado
- `e2e/documentos/bloqueio-extensoes.spec.js:149` — CT-GED-02-S2 @destrutivo — shell script (.sh) deveria ser rejeitado
- `e2e/documentos/bloqueio-extensoes.spec.js:163` — CT-GED-02-S2 @destrutivo — dupla extensão (.pdf.exe) deveria ser rejeitada
- `e2e/documentos/bloqueio-extensoes.spec.js:176` — CT-GED-02-S2 @destrutivo — executável renomeado para .pdf deveria ser rejeitado pelo conteúdo
- `e2e/documentos/gestao-documentos.spec.js:66` — CT-GED-02-S1 upload de extensão bloqueada é rejeitado e nada é gravado @destrutivo

### G6 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos

*Defeito de produto — já catalogado no README · 8 teste(s)*

Sete assertions de segurança reprovam: dataset `colleague` devolve 3.493 colaboradores ignorando a constraint; `GET /process-management/api/v2/requests/112009?expand=formFields` entrega 44 campos (razão social, CNPJ) de um processo em que a conta não participa (BOLA); `ds_Fluig` (credencial de integração) e `dsFluig_executeSql` respondem 200 para sessão não-admin; 6 de 23 administradores têm nome de conta técnica; 2 requisições por carga vão para `google-analytics.com`; e `bpm_addUserFluig`/`bpm_addUserGroup` constam do catálogo de início de um usuário de Compras. Os três de datasets/admin (U-03, U-04, U-13) não estão na tabela do README.

Testes:
- `api/dataset-colleague-vazamento.spec.js:22` — deve retornar somente o registro do login filtrado, não a base inteira
- `e2e/seguranca/auditoria-datasets.spec.js:18` — CT-SEG-02-S1: contas de integração/serviço não devem ter privilégio de administrador
- `e2e/seguranca/auditoria-datasets.spec.js:71` — CT-SEG-03-S1: dataset de credencial de integração não deve ser legível por sessão sem privilégio admin
- `e2e/seguranca/auditoria-datasets.spec.js:103` — CT-SEG-04-S1: datasets de execução de SQL não devem ser alcançáveis por sessão sem privilégio admin
- `e2e/seguranca/isolamento-horizontal-api-processos.spec.js:59` — CT-SEG-07-S1 — não deve entregar o objeto de um processo em que o usuário não participa
- `e2e/seguranca/lgpd-envio-google-analytics.spec.js:22` — não deve enviar dados de navegação para o Google Analytics
- `e2e/seguranca/processos-administrativos-usuario-comum.spec.js:39` — CT-SEG-08-S1 — "bpm_addUserFluig" (Adicionar Usuário) não deve constar do catálogo nem abrir para conta não-admin
- `e2e/seguranca/processos-administrativos-usuario-comum.spec.js:39` — CT-SEG-08-S1 — "bpm_addUserGroup" (Adicionar Grupo) não deve constar do catálogo nem abrir para conta não-admin

### G7 — Catálogo de processos mudou desde o inventário versionado — 6 processos passaram a ser iniciáveis

*Divergência ambiente × suíte (o ambiente mudou) · 2 teste(s)*

`GestaoDependentes`, `SIGAJURI_AprovaFU`, `SIGAJURI_Contencioso`, `SIGAJURI_Contrato`, `rh_gbeneficios_planosaude` e `wf_substituicaocargos` entraram no catálogo `onlyCanStart` desta conta. O invariante CT-PLT-10-H existe exatamente para acusar isso: cada linha é uma **mudança de permissão de início**, não ajuste de dados. Dois dos seis são processos de RH que a pergunta aberta nº 1 do README já questionava. O teste-irmão que afirmava "SIGAJURI_Contencioso fica fora do catálogo" precisa ser reescrito para a nova regra — não silenciado.

Testes:
- `e2e/plataforma/catalogo-invariante.spec.js:149` — CT-PLT-10-H: o conjunto de processos publicados e o de iniciáveis devem bater exatamente com o inventário versionado
- `e2e/plataforma/catalogo-invariante.spec.js:224` — CT-PLT-10-H: `SIGAJURI_Contencioso` continua fora do catálogo `onlyCanStart` embora crie solicitação — a permissão real diverge do filtro da tela

### G8 — Jurídico (SIGAJURI) — combos vazios e parte contrária inalcançável

*Defeito de produto — achado desta execução (não catalogado) · 3 teste(s)*

"Tipo Consulta" (Consultivo) e "Filial" (Contrato) oferecem uma única opção — o dataset que os alimenta não devolve nada (D-JUR-01). No Contencioso, o botão "Novo Envolvido" fica oculto pela classe `sem-processo-hide` tanto no estado padrão quanto com "Não possui processo" marcado: não há como registrar a parte contrária de uma Liminar.

Testes:
- `e2e/juridico/sigajuri-consultivo.spec.js:48` — CT-JUR-01-H deveria criar a solicitação de Consultivo e vinculá-la à área informada @destrutivo
- `e2e/juridico/sigajuri-contencioso.spec.js:196` — CT-JUR-04-S1 deveria oferecer campo para registrar a parte contrária em consultas contenciosas
- `e2e/juridico/sigajuri-contrato.spec.js:32` — CT-JUR-03-H deveria permitir montar uma minuta preenchendo Filial e Tipo Contrato

### G9 — RH — Admissão abre o formulário errado, Banco de Horas sem integração, Substituição de Cargos oscila

*Defeito de produto — achado desta execução (não catalogado) · 4 teste(s)*

`wf_automacao_admissao` serve o template de `rh_gbeneficios_planosaude` (associação processo↔formulário errada). O Banco de Horas expõe `alert()` nativo "Existem parâmetros não informado para esse servidor" (U-02) e a aba Autorização nunca sai de "Aguarde, processando". A Substituição de Cargos, com a MESMA resposta do ERP, ora bloqueia ora libera os 8 campos — hoje liberou, e o teste, escrito contra o bloqueio, reprovou.

Testes:
- `e2e/rh/admissao.spec.js:36` — CT-ADM-01-H — deveria abrir um formulário de admissão de novo funcionário
- `e2e/rh/banco-horas-limite.spec.js:38` — CT-BH-01-S2 — autorizar horas acima do limite deve bloquear
- `e2e/rh/banco-horas.spec.js:14` — CT-BH-01-S1 — não deve alertar o usuário final com erro de configuração de servidor ao abrir o Banco de Horas
- `e2e/rh/substituicao-cargos.spec.js:32` — CT-SUB — bloqueia a identificação do solicitante antes de expor campos de substituto

### G10 — Contratos de API — notificações, favoritos, reset de senha do fornecedor, medição e delegação de fiscais

*Defeito de produto — já catalogado no README · 7 teste(s)*

`GET /notification/api/v1/notifications?limit=3` devolve 1000 (ignora `limit`; eram 707 em 27/08) e `DELETE .../notifications/{id}` responde 500 `NotFoundException` apesar de `canRemove: true`; favoritar duas vezes responde 500 em `text/plain`; o reset de senha do Portal do Fornecedor com token adulterado responde **500** em vez de 4xx (achado novo); o Protheus recusa a medição ("Existe revisão pendente") e a tela não avisa; e a Delegação de Fiscais, anunciada como iniciável no catálogo, é recusada pelo servidor com "Solicitação só pode ser aberta através do portal de delegação de fiscais!" — portal que não existe em nenhum ponto de navegação desta conta.

Testes:
- `e2e/contratos/delegacao-fiscais-ciclo.spec.js:42` — CT-DEL-01-H @destrutivo: delegar um fiscal substituto para um contrato deve criar a delegação
- `e2e/contratos/delegacao-fiscais-ciclo.spec.js:82` — CT-DEL-01-S1 @destrutivo: substituto inválido/sem permissão deve ser bloqueado — não há nenhum controle para selecionar um fiscal substituto
- `e2e/contratos/validacoes-faturamento.spec.js:76` — CT-FAT-02-S2: competência recusada pelo Protheus deve bloquear a medição E avisar o usuário
- `e2e/notificacoes/contratos-api-notificacao.spec.js:98` — CT-NOT-03-S1: `GET /notification/api/v1/notifications` deve respeitar `limit` e `offset`
- `e2e/notificacoes/contratos-api-notificacao.spec.js:171` — CT-NOT-03-S1: notificação declara `canRemove: true`, então o verbo REST de remoção deveria existir
- `e2e/plataforma/favoritos-contrato-api.spec.js:126` — CT-PLT-07-S1: favoritar o mesmo processo duas vezes deve responder erro de negócio em JSON (ou 200 idempotente), não 500 em texto puro @destrutivo
- `e2e/portais/acesso-fornecedor.spec.js:107` — CT-PFN-02-S2 deve recusar um token de redefinição expirado/adulterado sem efetivar a troca

### G11 — Plataforma — deep-link 404, erros de console, resíduo `teste`, Aba Atribuir, Clínica vazia, cache _Sync

*Defeito de produto — já catalogado no README · 10 teste(s)*

U-01 (`/principalprocess` e `/gestao_ferias` caem em `errorPage/404`), NPS 403 na Home, 404 do `fluig-style-guide.min.css` + "Comprador não encontrado" no Portal do Comprador, processo `teste` (categoria ADMIN) ofertado no catálogo, aba Atribuir da Gerência de Compras sem dados, campo "Clínica" vazio no Questionário CliniCASSI (U-14) e `ds_protheus_getFuncionarios_restGetAll_Sync` respondendo 500 `NullPointerException` (U-12).

Testes:
- `e2e/acompanhamento-contratos/grade-contratos.spec.js:45` — CT-ACC-02-S1 — deve exibir a situação do contrato por extenso, sem truncar
- `e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js:54` — deve exibir um alerta por dado indisponível, nomeando o dado que faltou
- `api/sincronizacao-protheus.spec.js:31` — CT-INT-02-S1: variantes de cache (_Sync) dos dados de RH e vigência de compra não devem estar em erro
- `e2e/plataforma/deep-link-spa.spec.js:19` — acessar /portal/p/1/principalprocess diretamente deve abrir a página, não redirecionar para 404
- `e2e/plataforma/deep-link-spa.spec.js:19` — acessar /portal/p/1/gestao_ferias diretamente deve abrir a página, não redirecionar para 404
- `e2e/plataforma/erros-de-console.spec.js:152` — CT-PLT-06-S1: Portal do Comprador (/portal/p/1/portal-do-comprador) deve carregar sem erro de console não catalogado
- `e2e/plataforma/home.spec.js:7` — deve carregar os apps e contadores sem erro de console
- `e2e/plataforma/processo-inativo-e-residuo.spec.js:62` — CT-PLT-08-S1: o processo `teste` (categoria ADMIN) não deveria constar do catálogo de início de um usuário de Compras
- `e2e/portais/gerencia-compras.spec.js:31` — deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir
- `e2e/saude/questionario-clinicassi.spec.js:217` — Clínica/Unidade deveriam identificar a clínica do diagnóstico e não nascer vazias

### G12 — BPMN lento — a SC não sai de "Grava SC e Anexos" dentro dos 180 s do orçamento de espera

*Pré-condição ausente (ambiente / massa / latência) · 6 teste(s)*

Cinco testes de ciclo (aprovar/reprovar como Gestor, sinalizar ausência de aprovador, Somente salvar, Transferir) criam a própria SC pelo formulário clássico e esperam até 180 s pelo botão "Assumir tarefa" na Validação do Gestor. Nas duas rodadas de hoje (com carga e isolados) as SCs 113162/63/65/66/68 e depois 113187/88/89/90/91 continuavam em "Grava SC e Anexos" ao fim do prazo. A referência de campo era ~76 s. O mesmo caminho, em `portais/*.spec.js` (helper `aprovarValidacaoDoGestor`, que espera até 150 s pelo "Assumir tarefa"), **chegou** à Validação do Gestor e à Orçamentária em 5 testes entre 15h16 e 15h20 — logo o fluxo funciona e a latência oscila ao longo da tarde (lenta 15h04–15h15, rápida 15h16–15h20, lenta de novo 15h35). É latência de ambiente, não defeito da ação sob teste. A falha `CT-ACC-09-H` (pasta "Processo N" não aparece no GED em 120 s) é criada nessa mesma etapa e muito provavelmente tem a mesma causa.

Testes:
- `e2e/compras/aprovacoes-solicitacao-compras.spec.js:317` — @destrutivo deve assumir e aprovar uma tarefa do pool do Gestor Imediato
- `e2e/compras/aprovacoes-solicitacao-compras.spec.js:358` — @destrutivo deve assumir e reprovar uma tarefa do pool do Gestor Imediato com justificativa
- `e2e/compras/aprovacoes-solicitacao-compras.spec.js:401` — @destrutivo deve sinalizar explicitamente quando não há aprovador habilitado para a próxima etapa
- `e2e/compras/ciclo-solicitacao-compras.spec.js:815` — CT-ACC-09-H @destrutivo — o anexo enviado deveria gerar os dois registros no GED, sob a pasta da solicitação, e ser listado na solicitação
- `e2e/tarefas/acoes-da-tarefa.spec.js:184` — CT-TSK-07-H @destrutivo — "Somente salvar" deve persistir o rascunho sem movimentar a atividade
- `e2e/tarefas/acoes-da-tarefa.spec.js:297` — CT-TSK-08-H @destrutivo — transferir deve trocar o responsável mantendo a mesma atividade

### G13 — Filas vazias — nada para operar em Cotação, Negociação e pool de tarefas

*Pré-condição ausente (ambiente / massa / latência) · 3 teste(s)*

"Controle de Cotações" e "Avaliação de Propostas" do Portal do Comprador estão vazias porque nenhuma SC criada pela suíte chega ao Protheus (consequência de D-01) e não há massa pré-existente; o Resumo de Tarefas mostrava "Tarefas em pool (0)" no momento do teste de assumir do pool. Os testes falham com `PRÉ-CONDIÇÃO AUSENTE` de propósito, para não confundir ambiente com defeito.

Testes:
- `e2e/compras/ciclo-cotacao.spec.js:168` — CT-COT — a fila real de "Controle De Cotações" está vazia (pré-condição ausente para qualquer cenário com cotação real)
- `e2e/compras/negociacao-proposta.spec.js:131` — CT-NEG — a fila real de "Avaliação de Propostas" está vazia (pré-condição ausente para validar/reprovar uma proposta real)
- `e2e/tarefas/assumir-tarefa-pool.spec.js:34` — assumir a primeira tarefa disponível de um grupo do pool deve movê-la para "Tarefas a concluir"

### G14 — Divergências pontuais do ambiente e falhas sem veredito

*Divergência ambiente × suíte (o ambiente mudou) · 2 teste(s)*

O teste que lista os tipos do modal reprova porque "Renovação Contratual" não existe mais; `CT-FAT-02-S3` estourou 45 s clicando em "Tarefas em pool" antes de qualquer assertion de domínio.

Testes:
- `e2e/acompanhamento-contratos/modal-solicitacao-compra.spec.js:65` — deve oferecer os tipos contratuais de solicitação
- `e2e/contratos/validacoes-faturamento.spec.js:252` — CT-FAT-02-S3: reprovar uma validação (Validação CSE / Validação da Medição CSE / Validação do Fiscal de Contrato) não é alcançável — o usuário desta automação não pertence a nenhum grupo dessas etapas


## Os 81 testes que reprovaram, um a um

### 1. deve retornar somente o registro do login filtrado, não a base inteira

- **Arquivo:** `api/dataset-colleague-vazamento.spec.js:22` · **Suíte:** Vazamento de dados — dataset colleague sem aplicar constraint · **Duração:** 1.7 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G6 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos · **Referência:** CT-SEG-01-S1 / Vazamento colleague
- **O que acontece:** `POST /api/public/ecm/dataset/datasets` com constraint `colleagueId = <login>` devolve 3.493 registros — o mesmo total sem constraint.
- **Por que falha:** O dataset `colleague` ignora a constraint; qualquer sessão autenticada lê a base inteira de colaboradores.
- **Onde falha:** `expect(comFiltro).toBe(1)` em `dataset-colleague-vazamento.spec.js:60`. (local exato: `tests/api/dataset-colleague-vazamento.spec.js:60`)

**Mensagem da falha:**

```
Error: a constraint 'colleagueId' não filtrou o resultado: retornou 3493 registros, o MESMO total obtido sem nenhuma constraint (3493). O endpoint expõe a base inteira de colaboradores. Ver CT-SEG-01-S1 / mapa-do-ambiente.md.

expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 3493
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/api/api-dataset-colleague-vaza-37679-filtrado-não-a-base-inteira-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/api/api-dataset-colleague-vaza-37679-filtrado-não-a-base-inteira-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/api/api-dataset-colleague-vaza-37679-filtrado-não-a-base-inteira-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/api/api-dataset-colleague-vaza-37679-filtrado-não-a-base-inteira-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=958184 npx playwright test tests/api/dataset-colleague-vazamento.spec.js -g "deve retornar somente o registro do login filtrado, não a base inteira"`

---

### 2. CT-INT-02-S1: variantes de cache (_Sync) dos dados de RH e vigência de compra não devem estar em erro

- **Arquivo:** `api/sincronizacao-protheus.spec.js:31` · **Suíte:** Integração Protheus — sincronização e cache · **Duração:** 0.6 s
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Causa raiz:** G11 — Plataforma — deep-link 404, erros de console, resíduo `teste`, Aba Atribuir, Clínica vazia, cache _Sync · **Referência:** CT-INT-02-S1 / U-12
- **O que acontece:** `ds_protheus_getFuncionarios_restGetAll_Sync` responde HTTP 500 `java.lang.NullPointerException` (ECMException).
- **Por que falha:** A variante de cache/sincronização dos dados de RH está quebrada; dado de RH e vigência de compra ficam defasados sem aviso.
- **Onde falha:** `expect(ok).toBe(true)` em `sincronizacao-protheus.spec.js:60`, iterando as variantes `_Sync`. (local exato: `tests/api/sincronizacao-protheus.spec.js:60`)

**Mensagem da falha:**

```
Error: dataset de sincronização 'ds_protheus_getFuncionarios_restGetAll_Sync' respondeu 500: {"content":"ERROR","message":{"message":"java.lang.NullPointerException","detail":"java.lang.NullPointerException","type":"ERROR","param":null,"errorCode":"ECMException"}}. Sincronização em erro deixa dado de RH/vigência de compra defasado sem aviso. Ver CT-INT-02-S1 / achado U-12.

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/api/api-sincronizacao-protheus-33486-pra-não-devem-estar-em-erro-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/api/api-sincronizacao-protheus-33486-pra-não-devem-estar-em-erro-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/api/api-sincronizacao-protheus-33486-pra-não-devem-estar-em-erro-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/api/api-sincronizacao-protheus-33486-pra-não-devem-estar-em-erro-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=461800 npx playwright test tests/api/sincronizacao-protheus.spec.js -g "CT-INT-02-S1: variantes de cache (_Sync) dos dados de RH e vigência de compra não devem estar em erro"`

---

### 3. CT-CMP-08-H @destrutivo — reprovada e corrigida, a SC deveria voltar para a Validação do Gestor com o contrato de origem íntegro

- **Arquivo:** `e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js:242` · **Suíte:** Ciclo de retorno da SC: reprovação → Correção → reenvio (CT-CMP-08-H) · **Duração:** 74.9 s · **Tags:** destrutivo
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-CMP-08-H
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": a SC 113180 percorreu Início → Grava SC → Validação do Gestor → reprovação → "Ajustar Informações" e, ao reenviar, o Fluig recusou com "Existem campos de rateio sem preenchimento" — num rateio que veio do contrato e ninguém tocou. Beco sem saída confirmado (README: CT-CMP-08-H). Histórico completo no cartão.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-83cb9--contrato-de-origem-íntegro-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-83cb9--contrato-de-origem-íntegro-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-83cb9--contrato-de-origem-íntegro-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-83cb9--contrato-de-origem-íntegro-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=756242 npx playwright test tests/e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js -g "CT-CMP-08-H @destrutivo — reprovada e corrigida, a SC deveria voltar para a Validação do Gestor com o contrato de origem íntegro"`

---

### 4. @destrutivo estado inicial e responsável deveriam refletir uma etapa de trabalho do solicitante

- **Arquivo:** `e2e/acompanhamento-contratos/ciclo-gestor.spec.js:36` · **Suíte:** A SC criada nasce no estado e no dono corretos (CT-E2E-01-H) · **Duração:** 82.8 s · **Tags:** destrutivo
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-E2E-01-H / D-01
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": estourou `page.waitForResponse` (45 s) na Central de Tarefas ao procurar a SC recém-criada — sem veredito direto. O cabeçalho do arquivo atribui a pré-condição a D-01 (a SC presa em Início não aparece em lista alguma).

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-34a78--de-trabalho-do-solicitante-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-34a78--de-trabalho-do-solicitante-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-34a78--de-trabalho-do-solicitante-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-34a78--de-trabalho-do-solicitante-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=459867 npx playwright test tests/e2e/acompanhamento-contratos/ciclo-gestor.spec.js -g "@destrutivo estado inicial e responsável deveriam refletir uma etapa de trabalho do solicitante"`

---

### 5. @destrutivo aprovada pelo Gestor Imediato, a SC deveria avançar para Validação Orçamentária

- **Arquivo:** `e2e/acompanhamento-contratos/ciclo-gestor.spec.js:109` · **Suíte:** Gestor Imediato assume do pool e aprova (CT-E2E-02-H) · **Duração:** 73.7 s · **Tags:** destrutivo
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-E2E-02-H / D-01
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": a SC 113178 ficou em estado "Início" e nunca chegou à "Validação do Gestor" — D-01 confirmado.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-88df8-para-Validação-Orçamentária-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-88df8-para-Validação-Orçamentária-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-88df8-para-Validação-Orçamentária-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-88df8-para-Validação-Orçamentária-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=15260 npx playwright test tests/e2e/acompanhamento-contratos/ciclo-gestor.spec.js -g "@destrutivo aprovada pelo Gestor Imediato, a SC deveria avançar para Validação Orçamentária"`

---

### 6. @destrutivo reprovada, a SC deveria voltar para Ajustar Informações com o solicitante, itens e contrato íntegros

- **Arquivo:** `e2e/acompanhamento-contratos/ciclo-gestor.spec.js:155` · **Suíte:** Gestor Imediato reprova com justificativa (CT-E2E-02-S1) · **Duração:** 73.6 s · **Tags:** destrutivo
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-E2E-02-S1 / D-01
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": o poll de 45 s por "Validação do Gestor" estourou — a SC não saiu de Início (D-01).

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-1d8e7-e-itens-e-contrato-íntegros-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-1d8e7-e-itens-e-contrato-íntegros-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-1d8e7-e-itens-e-contrato-íntegros-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-1d8e7-e-itens-e-contrato-íntegros-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=979780 npx playwright test tests/e2e/acompanhamento-contratos/ciclo-gestor.spec.js -g "@destrutivo reprovada, a SC deveria voltar para Ajustar Informações com o solicitante, itens e contrato íntegros"`

---

### 7. @destrutivo a SC deveria nascer atribuída ao solicitante logado, não à conta de integração

- **Arquivo:** `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:106` · **Suíte:** Confirmar cria a SC e ela deveria chegar ao solicitante (CT-ACC-05-H / D-01) · **Duração:** 78.3 s · **Tags:** destrutivo
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-ACC-05-H / D-01
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": a SC 113182 nasceu com responsável "Usuário Integrador Fluig" em vez do solicitante — D-01 confirmado.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-b4b5d-o-não-à-conta-de-integração-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-b4b5d-o-não-à-conta-de-integração-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-b4b5d-o-não-à-conta-de-integração-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-b4b5d-o-não-à-conta-de-integração-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=698490 npx playwright test tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js -g "@destrutivo a SC deveria nascer atribuída ao solicitante logado, não à conta de integração"`

---

### 8. @destrutivo item de quantidade/valor zerado no contrato não deveria virar item extra na SC criada

- **Arquivo:** `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:218` · **Suíte:** Item sem quantidade e sem valor no contrato não pode virar item da SC (CT-ACC-06-S1) · **Duração:** 80.4 s · **Tags:** destrutivo
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-ACC-06-S1
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": contrato 000000000000001 tem 7 itens (5 com qtd/valor + 2 sem nada) e a SC nasceu com 7 — o serviço fabrica quantidade para os itens vazios (cascata `resolveQuant` → fallback 1) e eles passam pelo filtro `quant > 0`. Quantidades enviadas: [29,1,1,29,29,29,29]. Defeito confirmado.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-f48c7-rar-item-extra-na-SC-criada-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-f48c7-rar-item-extra-na-SC-criada-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-f48c7-rar-item-extra-na-SC-criada-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-f48c7-rar-item-extra-na-SC-criada-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=228675 npx playwright test tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js -g "@destrutivo item de quantidade/valor zerado no contrato não deveria virar item extra na SC criada"`

---

### 9. @destrutivo o servidor deveria recusar tipoSolicitacao vazio tanto quanto recusa motivoSolCompra vazio

- **Arquivo:** `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:286` · **Suíte:** Bypass da validação de cliente no start direto (CT-ACC-04-S6 / D-10) · **Duração:** 68.5 s · **Tags:** destrutivo
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-ACC-04-S6 / D-10
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": start direto com `tipoSolicitacao` vazio respondeu **200** (o servidor recusa `motivoSolCompra` vazio, mas não o tipo). Validação só no cliente — contornável. Defeito confirmado, não catalogado no README.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-6847d-ecusa-motivoSolCompra-vazio-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-6847d-ecusa-motivoSolCompra-vazio-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-6847d-ecusa-motivoSolCompra-vazio-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-6847d-ecusa-motivoSolCompra-vazio-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=95168 npx playwright test tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js -g "@destrutivo o servidor deveria recusar tipoSolicitacao vazio tanto quanto recusa motivoSolCompra vazio"`

---

### 10. @destrutivo o portal deveria alertar sobre a SC já em andamento para o mesmo contrato/revisão

- **Arquivo:** `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:416` · **Suíte:** Segunda SC para o mesmo contrato/revisão sem alerta de duplicidade (CT-E2E-12-S1) · **Duração:** 58.4 s · **Tags:** destrutivo
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-E2E-12-S1
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": com a SC 113185 já em andamento para o contrato 000000000000001, reabrir o modal do mesmo contrato não exibe aviso algum de duplicidade. Defeito confirmado, não catalogado no README.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-daaae-ra-o-mesmo-contrato-revisão-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-daaae-ra-o-mesmo-contrato-revisão-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-daaae-ra-o-mesmo-contrato-revisão-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-daaae-ra-o-mesmo-contrato-revisão-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=875768 npx playwright test tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js -g "@destrutivo o portal deveria alertar sobre a SC já em andamento para o mesmo contrato/revisão"`

---

### 11. CT-ACC-06-S2 — item sem quantidade no contrato deve herdar a cascata e o preço real, nunca R$ 1,00

- **Arquivo:** `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js:507` · **Suíte:** Quantidade e valor em contrato de serviço sem CNB_QUANT (CT-ACC-06-S2) · **Duração:** 59.3 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-ACC-06-S2
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": contrato 000000000000002 tem `CNB_QUANT` vazio e `CNB_QTDORI=36`; a SC deveria herdar 36 pela cascata e enviou quantidade 1. Defeito confirmado.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-feea0-e-o-preço-real-nunca-R-1-00-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-feea0-e-o-preço-real-nunca-R-1-00-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-feea0-e-o-preço-real-nunca-R-1-00-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-feea0-e-o-preço-real-nunca-R-1-00-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=728859 npx playwright test tests/e2e/acompanhamento-contratos/criacao-solicitacao.spec.js -g "CT-ACC-06-S2 — item sem quantidade no contrato deve herdar a cascata e o preço real, nunca R$ 1,00"`

---

### 12. deve avisar o usuário e permitir nova tentativa quando o start falha

- **Arquivo:** `e2e/acompanhamento-contratos/erros-no-start.spec.js:34` · **Suíte:** Erro no start — HTTP 500 (CT-ACC-05-S2) · **Duração:** 58.5 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-ACC-05-S2
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": **PASSOU** — com HTTP 500 no start, o widget avisa e permite nova tentativa.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-a92c9-tativa-quando-o-start-falha-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-a92c9-tativa-quando-o-start-falha-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-a92c9-tativa-quando-o-start-falha-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-a92c9-tativa-quando-o-start-falha-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=68752 npx playwright test tests/e2e/acompanhamento-contratos/erros-no-start.spec.js -g "deve avisar o usuário e permitir nova tentativa quando o start falha"`

---

### 13. deve avisar quando a SC é criada mas não pôde ser atribuída ao solicitante, em vez de anunciar sucesso pleno

- **Arquivo:** `e2e/acompanhamento-contratos/erros-no-start.spec.js:67` · **Suíte:** Sucesso simulado com falha na transferência da tarefa (D-01 / CT-ACC-05-S1) · **Duração:** 58.9 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-ACC-05-S1 / D-01 (sintoma)
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": com a transferência (`dsFluig_postProcessesTransfer`) forçada a 500, a única mensagem exibida foi "Sucesso! Processo 999999 iniciado com sucesso!". O erro é engolido. D-01 (sintoma) confirmado.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-df25b-z-de-anunciar-sucesso-pleno-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-df25b-z-de-anunciar-sucesso-pleno-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-df25b-z-de-anunciar-sucesso-pleno-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-df25b-z-de-anunciar-sucesso-pleno-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=12202 npx playwright test tests/e2e/acompanhamento-contratos/erros-no-start.spec.js -g "deve avisar quando a SC é criada mas não pôde ser atribuída ao solicitante, em vez de anunciar sucesso pleno"`

---

### 14. CT-ACC-02-S1 — deve exibir a situação do contrato por extenso, sem truncar

- **Arquivo:** `e2e/acompanhamento-contratos/grade-contratos.spec.js:45` · **Suíte:** Grade de contratos · **Duração:** 13.3 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G11 — Plataforma — deep-link 404, erros de console, resíduo `teste`, Aba Atribuir, Clínica vazia, cache _Sync · **Referência:** CT-ACC-02-S1 / D-08
- **O que acontece:** A coluna "Situação" da grade exibe `Finali`, `Paralisa`, `Sol.Finali`, `Cancel.` — textos truncados em vez de "Finalizado", "Paralisado", "Solicitação de Finalização", "Cancelado".
- **Por que falha:** O widget renderiza o valor bruto do Protheus (ou corta por largura) sem mapear para o rótulo por extenso.
- **Onde falha:** Assertion `expect(truncadas).toEqual([])` em `grade-contratos.spec.js:62`, após ler todas as células da coluna. (local exato: `tests/e2e/acompanhamento-contratos/grade-contratos.spec.js:62`)

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
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-c76ec-ato-por-extenso-sem-truncar-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-c76ec-ato-por-extenso-sem-truncar-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-c76ec-ato-por-extenso-sem-truncar-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-c76ec-ato-por-extenso-sem-truncar-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=217948 npx playwright test tests/e2e/acompanhamento-contratos/grade-contratos.spec.js -g "CT-ACC-02-S1 — deve exibir a situação do contrato por extenso, sem truncar"`

---

### 15. deve exibir um alerta por dado indisponível, nomeando o dado que faltou

- **Arquivo:** `e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js:54` · **Suíte:** Indisponibilidade do Protheus ao abrir a Solicitação de Compra · **Duração:** 14.3 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G11 — Plataforma — deep-link 404, erros de console, resíduo `teste`, Aba Atribuir, Clínica vazia, cache _Sync · **Referência:** D-11 (revisto)
- **O que acontece:** Com o dataset `dsProtheus_getItensPlanilha_restGetAll` derrubado (simulação via `derrubarDataset`), o alerta exibido é "ERRO: Erro ao buscar dados da filial:" — o rótulo de outro dataset.
- **Por que falha:** O handler de erro dos itens da planilha reutiliza a mensagem da filial. Com o Protheus fora, os dois avisos ficam idênticos — foi isso que se leu antes como "mesmo alerta duas vezes".
- **Onde falha:** `expect(texto).toMatch(/iten|planilha/i)` em `indisponibilidade-protheus.spec.js:141`. (local exato: `tests/e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js:141`)

**Mensagem da falha:**

```
Error: defeito: o alerta não nomeia o dado que faltou — a falha do dataset `dsProtheus_getItensPlanilha_restGetAll` (itens da planilha do contrato) é anunciada ao usuário com o rótulo "Erro ao buscar dados da filial". Rótulo errado, e é a origem da leitura de que o "mesmo alerta aparece duas vezes" quando os dois datasets caem juntos

expect(received).toMatch(expected)

Expected pattern: /iten|planilha/i
Received string:  "ERRO: Erro ao buscar dados da filial: "
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-f4f44--nomeando-o-dado-que-faltou-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-f4f44--nomeando-o-dado-que-faltou-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-f4f44--nomeando-o-dado-que-faltou-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-f4f44--nomeando-o-dado-que-faltou-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=415502 npx playwright test tests/e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js -g "deve exibir um alerta por dado indisponível, nomeando o dado que faltou"`

---

### 16. não deve enviar solicitação alguma quando o contrato não trouxe itens

- **Arquivo:** `e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js:144` · **Suíte:** Indisponibilidade do Protheus ao abrir a Solicitação de Compra · **Duração:** 59.6 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** —
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": **PASSOU** — sem itens do contrato, nenhum start é enviado.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-49513-o-contrato-não-trouxe-itens-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-49513-o-contrato-não-trouxe-itens-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-49513-o-contrato-não-trouxe-itens-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-49513-o-contrato-não-trouxe-itens-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=484695 npx playwright test tests/e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js -g "não deve enviar solicitação alguma quando o contrato não trouxe itens"`

---

### 17. deve oferecer os tipos contratuais de solicitação

- **Arquivo:** `e2e/acompanhamento-contratos/modal-solicitacao-compra.spec.js:65` · **Suíte:** Abertura da Solicitação de Compra a partir do contrato · **Duração:** 10.9 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G14 — Divergências pontuais do ambiente e falhas sem veredito · **Referência:** pergunta aberta nº 2 do README
- **O que acontece:** O combo do modal lista `["Selecione...", "Selecione...", "Aditivo Contratual", "Nova Contratação"]`. A suíte espera "Renovação Contratual".
- **Por que falha:** O ambiente mudou a lista de tipos (removeu "Renovação Contratual", incluiu "Nova Contratação"). Não há registro de que a mudança foi intencional. Note também o placeholder "Selecione..." duplicado.
- **Onde falha:** `expect(opcoes).toContain(TIPO_SOLICITACAO.RENOVACAO)` em `modal-solicitacao-compra.spec.js:82`. (local exato: `tests/e2e/acompanhamento-contratos/modal-solicitacao-compra.spec.js:82`)

**Mensagem da falha:**

```
Error: expect(received).toContain(expected) // indexOf

Expected value: "Renovação Contratual"
Received array: ["Selecione...", "Selecione...", "Aditivo Contratual", "Nova Contratação"]
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-78362--contratuais-de-solicitação-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-78362--contratuais-de-solicitação-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-78362--contratuais-de-solicitação-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-78362--contratuais-de-solicitação-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=619281 npx playwright test tests/e2e/acompanhamento-contratos/modal-solicitacao-compra.spec.js -g "deve oferecer os tipos contratuais de solicitação"`

---

### 18. a SC deve nascer numa etapa de trabalho atribuída ao solicitante, não presa no marco de Início da conta de integração

- **Arquivo:** `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:59` · **Suíte:** Payload de start — targetState e targetAssignee (D-01 / CT-E2E-01-H) · **Duração:** 57.6 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-E2E-01-H / D-01 (causa)
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": o payload capturado traz `targetState: 6` — a SC nasce presa no marco de Início. D-01 (causa isolada) confirmado.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-09e58-ício-da-conta-de-integração-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-09e58-ício-da-conta-de-integração-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-09e58-ício-da-conta-de-integração-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-09e58-ício-da-conta-de-integração-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=900670 npx playwright test tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js -g "a SC deve nascer numa etapa de trabalho atribuída ao solicitante, não presa no marco de Início da conta de integração"`

---

### 19. itens com quantidades diferentes não devem trazer o mesmo valor total

- **Arquivo:** `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:100` · **Suíte:** Payload de start — valor multiplicado (D-02 / CT-ACC-06-S1) · **Duração:** 58.8 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-ACC-06-S1 / D-02
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": **PASSOU** — itens com quantidades diferentes trouxeram totais diferentes no contrato sorteado.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-ffc0e--trazer-o-mesmo-valor-total-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-ffc0e--trazer-o-mesmo-valor-total-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-ffc0e--trazer-o-mesmo-valor-total-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-ffc0e--trazer-o-mesmo-valor-total-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=619774 npx playwright test tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js -g "itens com quantidades diferentes não devem trazer o mesmo valor total"`

---

### 20. não deve existir item de quantidade 1 repetindo o valor total de outro item

- **Arquivo:** `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:142` · **Suíte:** Payload de start — valor multiplicado (D-02 / CT-ACC-06-S1) · **Duração:** 58.4 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-ACC-06-S1 / D-02
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": dois itens-fantasma de qtd 1 (#1 e #3, valorTotal 1,00) no contrato 000000000000001 — itens que não existem com valor no Protheus entram no payload como produto próprio. Defeito confirmado.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-1a3e7-o-valor-total-de-outro-item-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-1a3e7-o-valor-total-de-outro-item-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-1a3e7-o-valor-total-de-outro-item-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-1a3e7-o-valor-total-de-outro-item-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=965754 npx playwright test tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js -g "não deve existir item de quantidade 1 repetindo o valor total de outro item"`

---

### 21. itens com quantidade e preço diferentes não deveriam compartilhar o mesmo valor total

- **Arquivo:** `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:174` · **Suíte:** Payload de start — valor multiplicado (D-02 / CT-ACC-06-S1) · **Duração:** 60.0 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-ACC-06-S1 / D-02
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": **PASSOU**.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-671c9-rtilhar-o-mesmo-valor-total-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-671c9-rtilhar-o-mesmo-valor-total-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-671c9-rtilhar-o-mesmo-valor-total-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-671c9-rtilhar-o-mesmo-valor-total-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=589297 npx playwright test tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js -g "itens com quantidade e preço diferentes não deveriam compartilhar o mesmo valor total"`

---

### 22. classeOrca, classificação e o descritor deveriam refletir o contrato de origem, não vir fixos para todos

- **Arquivo:** `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:219` · **Suíte:** Payload de start — campos chumbados (D-04 / CT-ACC-07-S1) · **Duração:** 59.4 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-ACC-07-S1 / D-04
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": `campoDescritor` = "Sol. Compras - CASSI SEDE" tanto para a filial CASSI - CENTRAL DE ATENDIMENTO quanto para UNIDADE - CLINICASSI CURITIBA - PR. Campo chumbado. D-04 confirmado.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-bfe19-em-não-vir-fixos-para-todos-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-bfe19-em-não-vir-fixos-para-todos-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-bfe19-em-não-vir-fixos-para-todos-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-bfe19-em-não-vir-fixos-para-todos-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=72787 npx playwright test tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js -g "classeOrca, classificação e o descritor deveriam refletir o contrato de origem, não vir fixos para todos"`

---

### 23. os valores monetários devem ser numericamente coerentes, sem NaN, sem casa perdida e sem inflação

- **Arquivo:** `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:275` · **Suíte:** Payload de start — integridade dos valores e do rateio (CT-ACC-08-S1 / CT-ACC-08-S2) · **Duração:** 58.3 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-ACC-08-S1
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": **PASSOU** — valores numericamente coerentes.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-b79e1-casa-perdida-e-sem-inflação-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-b79e1-casa-perdida-e-sem-inflação-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-b79e1-casa-perdida-e-sem-inflação-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-b79e1-casa-perdida-e-sem-inflação-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=23067 npx playwright test tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js -g "os valores monetários devem ser numericamente coerentes, sem NaN, sem casa perdida e sem inflação"`

---

### 24. as linhas de rateio devem trazer percentual, centro de custo e classe de valor preenchidos, somando 100%

- **Arquivo:** `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:309` · **Suíte:** Payload de start — integridade dos valores e do rateio (CT-ACC-08-S1 / CT-ACC-08-S2) · **Duração:** 60.4 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-ACC-08-S2
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": **PASSOU** — rateio soma 100% com CC e classe de valor.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-c9330-or-preenchidos-somando-100--e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-c9330-or-preenchidos-somando-100--e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-c9330-or-preenchidos-somando-100--e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-c9330-or-preenchidos-somando-100--e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=151642 npx playwright test tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js -g "as linhas de rateio devem trazer percentual, centro de custo e classe de valor preenchidos, somando 100%"`

---

### 25. classeValor do item deveria vir preenchido junto com classeOrca e classificação

- **Arquivo:** `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:339` · **Suíte:** Payload de start — integridade dos valores e do rateio (CT-ACC-08-S1 / CT-ACC-08-S2) · **Duração:** 59.0 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** classeValor vazio
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": `tbprod_classeValor` vazio nos 7 itens, com `classeOrca` e `classificacao` preenchidos ao lado. Defeito confirmado (README: "classeValor vazio").

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-67bb6--classeOrca-e-classificação-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-67bb6--classeOrca-e-classificação-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-67bb6--classeOrca-e-classificação-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-67bb6--classeOrca-e-classificação-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=995887 npx playwright test tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js -g "classeValor do item deveria vir preenchido junto com classeOrca e classificação"`

---

### 26. duplo clique em Confirmar não deve disparar duas requisições de start

- **Arquivo:** `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:365` · **Suíte:** Payload de start — duplo clique (CT-ACC-04-S3) · **Duração:** 58.5 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-ACC-04-S3
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": **PASSOU** — a trava antiduplo-clique segura a segunda requisição.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-c45b4-r-duas-requisições-de-start-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-c45b4-r-duas-requisições-de-start-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-c45b4-r-duas-requisições-de-start-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-c45b4-r-duas-requisições-de-start-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=613197 npx playwright test tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js -g "duplo clique em Confirmar não deve disparar duas requisições de start"`

---

### 27. não deve permitir que nrContrato divirja do contrato real da revisão/filial/itens enviados

- **Arquivo:** `e2e/acompanhamento-contratos/payload-solicitacao.spec.js:434` · **Suíte:** Payload de start — número de contrato incoerente (CT-ACC-04-S5) · **Duração:** 58.2 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** CT-ACC-04-S5
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": `nrContrato` aponta para um contrato cuja revisão real é "003", mas `revisaContrato` foi enviado vazio. O servidor não revalida. Defeito confirmado (README: CT-ACC-04-S5).

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-1b0f5-visão-filial-itens-enviados-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-1b0f5-visão-filial-itens-enviados-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-1b0f5-visão-filial-itens-enviados-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-1b0f5-visão-filial-itens-enviados-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=33346 npx playwright test tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js -g "não deve permitir que nrContrato divirja do contrato real da revisão/filial/itens enviados"`

---

### 28. deve cobrar apenas os campos restantes quando o tipo já foi informado

- **Arquivo:** `e2e/acompanhamento-contratos/validacoes-solicitacao.spec.js:48` · **Suíte:** Campos obrigatórios da Solicitação de Compra · **Duração:** 59.2 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** —
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": **PASSOU**.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-693f4-ndo-o-tipo-já-foi-informado-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-693f4-ndo-o-tipo-já-foi-informado-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-693f4-ndo-o-tipo-já-foi-informado-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-693f4-ndo-o-tipo-já-foi-informado-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=535650 npx playwright test tests/e2e/acompanhamento-contratos/validacoes-solicitacao.spec.js -g "deve cobrar apenas os campos restantes quando o tipo já foi informado"`

---

### 29. deve cobrar somente o motivo quando tipo e data já foram informados

- **Arquivo:** `e2e/acompanhamento-contratos/validacoes-solicitacao.spec.js:65` · **Suíte:** Campos obrigatórios da Solicitação de Compra · **Duração:** 58.4 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G1 — O combo "Tipo de Solicitação" perdeu a opção "Renovação Contratual" — 24 testes caem no mesmo `selectOption` · **Referência:** —
- **O que acontece:** O teste preenche o modal da Solicitação de Compra com a factory padrão (tipo "Renovação Contratual"). O `selectOption` no combo "Tipo de Solicitação" não encontra a opção, tenta por 45 s (`actionTimeout`) e falha com `did not find some options`.
- **Por que falha:** O ambiente não oferece mais "Renovação Contratual" (oferece "Aditivo Contratual" e "Nova Contratação"). A falha ocorre antes da assertion que dá nome ao teste — não é veredito sobre o produto.
- **Onde falha:** `components/SolicitacaoCompraModal.js` → `campoTipo.selectOption(...)`, chamado de `preencher()`. (local exato: `components/SolicitacaoCompraModal.js:50`)
- **Reexecução com "Aditivo Contratual":** Reexecutado com "Aditivo": **PASSOU**.

**Mensagem da falha:**

```
TimeoutError: locator.selectOption: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-543d4--e-data-já-foram-informados-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-543d4--e-data-já-foram-informados-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-543d4--e-data-já-foram-informados-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/acomp/e2e-acompanhamento-contrat-543d4--e-data-já-foram-informados-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=684246 npx playwright test tests/e2e/acompanhamento-contratos/validacoes-solicitacao.spec.js -g "deve cobrar somente o motivo quando tipo e data já foram informados"`

---

### 30. @destrutivo deve assumir e aprovar uma tarefa do pool do Gestor Imediato

- **Arquivo:** `e2e/compras/aprovacoes-solicitacao-compras.spec.js:317` · **Suíte:** Validação do Gestor Imediato (Tarefas em pool) · **Duração:** 230.8 s · **Tags:** destrutivo
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Causa raiz:** G12 — BPMN lento — a SC não sai de "Grava SC e Anexos" dentro dos 180 s do orçamento de espera · **Referência:** PRÉ-CONDIÇÃO AUSENTE
- **O que acontece:** A SC #113166, criada pelo próprio teste, não apareceu com "Assumir tarefa" na Validação do Gestor em 180 s; a atividade atual ainda era "Grava SC e Anexos". O teste aborta antes de exercitar aprovar como Gestor.
- **Por que falha:** Latência do BPMN acima do orçamento (referência de campo: ~76 s). Reexecutado isolado (15h35–15h40) com o mesmo resultado (SCs 113187–113191). O mesmo caminho em `portais/*.spec.js` (helper `aprovarValidacaoDoGestor`, espera de 150 s) chegou à Validação do Gestor em 5 testes entre 15h16 e 15h20 — o fluxo funciona; a latência oscila.
- **Onde falha:** Poll `toPass({ timeout: 180_000 })` por `botaoAssumirTarefaAtual()` — `aprovacoes-solicitacao-compras.spec.js:281` / `acoes-da-tarefa.spec.js:83`. (local exato: `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js:290`)

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: a SC #113166, criada por este teste, não ficou assumível ("Assumir tarefa") na Validação do Gestor dentro de 180s. Isto NÃO é defeito do produto confirmado — pode ser lentidão do BPMN acima do observado em campo (~76s), ou a tarefa ter sido assumida por outra execução concorrente que pega a primeira do pool (tests/e2e/tarefas/assumir-tarefa-pool.spec.js). Atividade atual observada na tela de detalhe: "Grava SC e Anexos". Causa do polling: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Assumir tarefa' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-aprovacoes-sol-65f42--do-pool-do-Gestor-Imediato-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-aprovacoes-sol-65f42--do-pool-do-Gestor-Imediato-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-aprovacoes-sol-65f42--do-pool-do-Gestor-Imediato-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-aprovacoes-sol-65f42--do-pool-do-Gestor-Imediato-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=569526 npx playwright test tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js -g "@destrutivo deve assumir e aprovar uma tarefa do pool do Gestor Imediato"`

---

### 31. @destrutivo deve assumir e reprovar uma tarefa do pool do Gestor Imediato com justificativa

- **Arquivo:** `e2e/compras/aprovacoes-solicitacao-compras.spec.js:358` · **Suíte:** Validação do Gestor Imediato (Tarefas em pool) · **Duração:** 224.6 s · **Tags:** destrutivo
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Causa raiz:** G12 — BPMN lento — a SC não sai de "Grava SC e Anexos" dentro dos 180 s do orçamento de espera · **Referência:** PRÉ-CONDIÇÃO AUSENTE
- **O que acontece:** A SC #113165, criada pelo próprio teste, não apareceu com "Assumir tarefa" na Validação do Gestor em 180 s; a atividade atual ainda era "Grava SC e Anexos". O teste aborta antes de exercitar reprovar com justificativa.
- **Por que falha:** Latência do BPMN acima do orçamento (referência de campo: ~76 s). Reexecutado isolado (15h35–15h40) com o mesmo resultado (SCs 113187–113191). O mesmo caminho em `portais/*.spec.js` (helper `aprovarValidacaoDoGestor`, espera de 150 s) chegou à Validação do Gestor em 5 testes entre 15h16 e 15h20 — o fluxo funciona; a latência oscila.
- **Onde falha:** Poll `toPass({ timeout: 180_000 })` por `botaoAssumirTarefaAtual()` — `aprovacoes-solicitacao-compras.spec.js:281` / `acoes-da-tarefa.spec.js:83`. (local exato: `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js:290`)

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: a SC #113165, criada por este teste, não ficou assumível ("Assumir tarefa") na Validação do Gestor dentro de 180s. Isto NÃO é defeito do produto confirmado — pode ser lentidão do BPMN acima do observado em campo (~76s), ou a tarefa ter sido assumida por outra execução concorrente que pega a primeira do pool (tests/e2e/tarefas/assumir-tarefa-pool.spec.js). Atividade atual observada na tela de detalhe: "Grava SC e Anexos". Causa do polling: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Assumir tarefa' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-aprovacoes-sol-3aeac--Imediato-com-justificativa-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-aprovacoes-sol-3aeac--Imediato-com-justificativa-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-aprovacoes-sol-3aeac--Imediato-com-justificativa-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-aprovacoes-sol-3aeac--Imediato-com-justificativa-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=537244 npx playwright test tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js -g "@destrutivo deve assumir e reprovar uma tarefa do pool do Gestor Imediato com justificativa"`

---

### 32. @destrutivo deve sinalizar explicitamente quando não há aprovador habilitado para a próxima etapa

- **Arquivo:** `e2e/compras/aprovacoes-solicitacao-compras.spec.js:401` · **Suíte:** Validação do Gestor Imediato (Tarefas em pool) · **Duração:** 237.3 s · **Tags:** destrutivo
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Causa raiz:** G12 — BPMN lento — a SC não sai de "Grava SC e Anexos" dentro dos 180 s do orçamento de espera · **Referência:** PRÉ-CONDIÇÃO AUSENTE
- **O que acontece:** A SC #113168, criada pelo próprio teste, não apareceu com "Assumir tarefa" na Validação do Gestor em 180 s; a atividade atual ainda era "Grava SC e Anexos". O teste aborta antes de exercitar sinalizar ausência de aprovador.
- **Por que falha:** Latência do BPMN acima do orçamento (referência de campo: ~76 s). Reexecutado isolado (15h35–15h40) com o mesmo resultado (SCs 113187–113191). O mesmo caminho em `portais/*.spec.js` (helper `aprovarValidacaoDoGestor`, espera de 150 s) chegou à Validação do Gestor em 5 testes entre 15h16 e 15h20 — o fluxo funciona; a latência oscila.
- **Onde falha:** Poll `toPass({ timeout: 180_000 })` por `botaoAssumirTarefaAtual()` — `aprovacoes-solicitacao-compras.spec.js:281` / `acoes-da-tarefa.spec.js:83`. (local exato: `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js:290`)

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: a SC #113168, criada por este teste, não ficou assumível ("Assumir tarefa") na Validação do Gestor dentro de 180s. Isto NÃO é defeito do produto confirmado — pode ser lentidão do BPMN acima do observado em campo (~76s), ou a tarefa ter sido assumida por outra execução concorrente que pega a primeira do pool (tests/e2e/tarefas/assumir-tarefa-pool.spec.js). Atividade atual observada na tela de detalhe: "Grava SC e Anexos". Causa do polling: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Assumir tarefa' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-aprovacoes-sol-6e79e-litado-para-a-próxima-etapa-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-aprovacoes-sol-6e79e-litado-para-a-próxima-etapa-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-aprovacoes-sol-6e79e-litado-para-a-próxima-etapa-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-aprovacoes-sol-6e79e-litado-para-a-próxima-etapa-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=244022 npx playwright test tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js -g "@destrutivo deve sinalizar explicitamente quando não há aprovador habilitado para a próxima etapa"`

---

### 33. CT-COT (defeito) — o shell aceita Enviar sem nenhuma validação de fornecedor/vínculos obrigatórios

- **Arquivo:** `e2e/compras/ciclo-cotacao.spec.js:125` · **Suíte:** Cotação de Produtos e Serviços — formulário avulso (shell fora de contexto) · **Duração:** 14.6 s
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Causa raiz:** G4 — Formulários clássicos aceitam Enviar sem validação — fail-open, SC sem anexo, Cotação, Negociação, Parecer · **Referência:** CT-COT (defeito)
- **O que acontece:** No shell do formulário de Cotação, clicar em Enviar sem fornecedor/vínculos não abre diálogo de erro e dispara a criação do processo.
- **Por que falha:** O formulário de Cotação não tem validação de obrigatórios no cliente (a SC clássica tem). A escrita só não chegou ao servidor porque a `guarda-criacao` bloqueou.
- **Onde falha:** `expect(dialogoErro).toBeVisible()` em `ciclo-cotacao.spec.js:157`. (local exato: `tests/e2e/compras/ciclo-cotacao.spec.js:157`)

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
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-cotacao--52edc-cedor-vínculos-obrigatórios-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-cotacao--52edc-cedor-vínculos-obrigatórios-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-cotacao--52edc-cedor-vínculos-obrigatórios-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-cotacao--52edc-cedor-vínculos-obrigatórios-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=724484 npx playwright test tests/e2e/compras/ciclo-cotacao.spec.js -g "CT-COT (defeito) — o shell aceita Enviar sem nenhuma validação de fornecedor/vínculos obrigatórios"`

---

### 34. CT-COT — a fila real de "Controle De Cotações" está vazia (pré-condição ausente para qualquer cenário com cotação real)

- **Arquivo:** `e2e/compras/ciclo-cotacao.spec.js:168` · **Suíte:** Cotação de Produtos e Serviços — ponto de entrada real (Portal do Comprador) · **Duração:** 9.6 s
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Causa raiz:** G13 — Filas vazias — nada para operar em Cotação, Negociação e pool de tarefas · **Referência:** CT-COT-01/02
- **O que acontece:** A fila "Controle De Cotações" do Portal do Comprador está vazia.
- **Por que falha:** Nenhuma SC da suíte chega ao Protheus (D-01) e não há massa pré-existente. O teste falha com `PRÉ-CONDIÇÃO AUSENTE` de propósito.
- **Onde falha:** `ciclo-cotacao.spec.js:188`. (local exato: `tests/e2e/compras/ciclo-cotacao.spec.js:188`)

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: a fila de "Controle De Cotações" do Portal do Comprador não tem nenhuma Cotação para operar. Isto NÃO é defeito do produto sob teste isolado — é consequência de D-01 (toda Solicitação de Compra criada por esta suíte fica presa no marco de Início do BPMN e nunca chega ao Protheus, então nunca gera uma Cotação real) somada à ausência de massa pré-existente na base. CT-COT-01-H, CT-COT-01-S1, CT-COT-02-S1, CT-COT-02-S2 e CT-COT-02-S3 continuam bloqueados até D-01 ser corrigido e/ou existir uma Cotação real nesta fila.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-cotacao--3eec7-r-cenário-com-cotação-real--e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-cotacao--3eec7-r-cenário-com-cotação-real--e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-cotacao--3eec7-r-cenário-com-cotação-real--e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-cotacao--3eec7-r-cenário-com-cotação-real--e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=829088 npx playwright test tests/e2e/compras/ciclo-cotacao.spec.js -g "CT-COT — a fila real de \"Controle De Cotações\" está vazia (pré-condição ausente para qualquer cenário com cotação real)"`

---

### 35. CT-CMP-02-S4 — deve bloquear o envio quando nenhum anexo é informado

- **Arquivo:** `e2e/compras/ciclo-solicitacao-compras.spec.js:489` · **Suíte:** Ciclo de criação da Solicitação de Compras (formulário clássico) · **Duração:** 30.5 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G4 — Formulários clássicos aceitam Enviar sem validação — fail-open, SC sem anexo, Cotação, Negociação, Parecer · **Referência:** CT-CMP-02-S4
- **O que acontece:** Enviar a SC clássica sem anexo dispara `POST /ecm/api/rest/ecm/workflowView/send` (1 tentativa capturada pela guarda).
- **Por que falha:** O cliente não valida o anexo obrigatório.
- **Onde falha:** `expect(guarda.tentativas()).toBe(0)` em `ciclo-solicitacao-compras.spec.js:530`. (local exato: `tests/e2e/compras/ciclo-solicitacao-compras.spec.js:530`)

**Mensagem da falha:**

```
Error: defeito: o envio sem anexo deveria ser recusado no cliente, sem gerar nenhuma requisição de escrita — em vez disso tentou: POST https://caixade182374.fluig.cloudtotvs.com.br/ecm/api/rest/ecm/workflowView/send

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-solicita-0f2a5-do-nenhum-anexo-é-informado-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-solicita-0f2a5-do-nenhum-anexo-é-informado-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-solicita-0f2a5-do-nenhum-anexo-é-informado-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-solicita-0f2a5-do-nenhum-anexo-é-informado-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=243157 npx playwright test tests/e2e/compras/ciclo-solicitacao-compras.spec.js -g "CT-CMP-02-S4 — deve bloquear o envio quando nenhum anexo é informado"`

---

### 36. CT-CMP-02-S4 @destrutivo — o servidor não deve criar a SC quando falta o anexo obrigatório

- **Arquivo:** `e2e/compras/ciclo-solicitacao-compras.spec.js:567` · **Suíte:** Ciclo de criação da Solicitação de Compras (formulário clássico) · **Duração:** 32.7 s · **Tags:** destrutivo
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G4 — Formulários clássicos aceitam Enviar sem validação — fail-open, SC sem anexo, Cotação, Negociação, Parecer · **Referência:** CT-CMP-02-S4
- **O que acontece:** Sem a guarda, o servidor aceitou o envio sem anexo e criou a SC **#113167** (registrada no livro-razão e cancelada no teardown).
- **Por que falha:** A regra do anexo obrigatório não existe nem no cliente nem no servidor.
- **Onde falha:** `expect(criadas).toEqual([])` em `ciclo-solicitacao-compras.spec.js:646`. (local exato: `tests/e2e/compras/ciclo-solicitacao-compras.spec.js:646`)

**Mensagem da falha:**

```
Error: defeito: o servidor aceitou e CRIOU a Solicitação de Compras sem o anexo obrigatório — a regra do catálogo (CT-CMP-02-S4) não está implementada nem no cliente nem no servidor, e o cliente é contornável

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "#113167 via /ecm/api/rest/ecm/workflowView/send",
+ ]
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-solicita-ab1e2-o-falta-o-anexo-obrigatório-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-solicita-ab1e2-o-falta-o-anexo-obrigatório-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-solicita-ab1e2-o-falta-o-anexo-obrigatório-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-solicita-ab1e2-o-falta-o-anexo-obrigatório-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=111220 npx playwright test tests/e2e/compras/ciclo-solicitacao-compras.spec.js -g "CT-CMP-02-S4 @destrutivo — o servidor não deve criar a SC quando falta o anexo obrigatório"`

---

### 37. CT-ACC-09-H @destrutivo — o anexo enviado deveria gerar os dois registros no GED, sob a pasta da solicitação, e ser listado na solicitação

- **Arquivo:** `e2e/compras/ciclo-solicitacao-compras.spec.js:815` · **Suíte:** Anexo da Solicitação de Compras chega íntegro ao GED (CT-ACC-09-H) · **Duração:** 158.5 s · **Tags:** destrutivo
- **Natureza:** Sem veredito (falhou antes da assertion de domínio)
- **Causa raiz:** G12 — BPMN lento — a SC não sai de "Grava SC e Anexos" dentro dos 180 s do orçamento de espera · **Referência:** CT-ACC-09-H
- **O que acontece:** A SC 113169 foi criada com anexo, mas nenhuma pasta "Processo 113169 - …" apareceu no GED em 120 s.
- **Por que falha:** A pasta é criada pelo produto na etapa "Grava SC e Anexos" — exatamente a etapa em que todas as SCs desta tarde ficaram presas além de 180 s (G12). Provável latência de BPMN, não defeito do anexo; precisa de reexecução em ambiente responsivo para veredito.
- **Onde falha:** `expect(pasta).not.toBeNull()` em `ciclo-solicitacao-compras.spec.js:886` (poll de 120 s). (local exato: `tests/e2e/compras/ciclo-solicitacao-compras.spec.js:886`)

**Mensagem da falha:**

```
Error: nenhuma pasta "Processo 113169 - ..." existe no GED. O produto cria essa cadeia sozinho na etapa "Grava SC e Anexos"; sem ela o anexo não tem onde ser navegado e o aprovador não o alcança

expect(received).not.toBeNull()

Received: null

Call Log:
- Timeout 120000ms exceeded while waiting on the predicate
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-solicita-2c166--ser-listado-na-solicitação-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-solicita-2c166--ser-listado-na-solicitação-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-solicita-2c166--ser-listado-na-solicitação-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-ciclo-solicita-2c166--ser-listado-na-solicitação-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=148997 npx playwright test tests/e2e/compras/ciclo-solicitacao-compras.spec.js -g "CT-ACC-09-H @destrutivo — o anexo enviado deveria gerar os dois registros no GED, sob a pasta da solicitação, e ser listado na solicitação"`

---

### 38. CT-CMP-07-S1 @destrutivo — Enviar não deveria criar solicitação antes de o formulário terminar de montar

- **Arquivo:** `e2e/compras/fail-open-formulario-sc.spec.js:127` · **Suíte:** Fail-open do formulário clássico de Solicitação de Compras (CT-CMP-07-S1) · **Duração:** 8.6 s · **Tags:** destrutivo
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G4 — Formulários clássicos aceitam Enviar sem validação — fail-open, SC sem anexo, Cotação, Negociação, Parecer · **Referência:** CT-CMP-07-S1
- **O que acontece:** Com `ds_protheus_getMatriculaTitular_rest` forçado a 500, o formulário nunca termina de montar e o clique em Enviar dispara `workflowView/send` sem validação alguma. O servidor recusou (500 "Nome da Filial é obrigatório") só porque o formulário estava vazio.
- **Por que falha:** Fail-open no cliente: o botão Enviar não espera a montagem terminar. Quando os campos já têm valor, a mesma janela cria SC de verdade (foi assim que o defeito foi descoberto).
- **Onde falha:** `fail-open-formulario-sc.spec.js:266`. (local exato: `tests/e2e/compras/fail-open-formulario-sc.spec.js:266`)

**Mensagem da falha:**

```
Error: DEFEITO (fail-open, CT-CMP-07-S1): o Fluig aceitou submeter um formulário de Solicitação de Compras que ainda NÃO terminou de montar — nenhuma validação de cliente rodou e 1 requisição(ões) de criação saíram para `\/ecm\/api\/rest\/ecm\/workflowView\/send$`. O servidor recusou esta submissão (HTTP 500, corpo: "{\"content\":\"ERROR\",\"message\":{\"message\":\"Erro ao salvar dados de formulário: \\n\\n<br/><b class=\\\"text-danger fs-font-bold\\\">- O campo \\\"Nome da Filial\\\" é obrigatório!\\n Favor preencher o campo e tentar novamente.</b>\",\"detail\":\"FLUIG INFO\\nHora: 2026-09-02 15:11:41\\nVersão Fluig: TOTVS Fluig Plataf") e NENHUMA solicitação nasceu desta execução — o defeito documentado aqui é do CLIENTE: ele submeteu um formulário não montado sem rodar validação nenhuma. A recusa do servidor é acidental (o formulário estava vazio); quando a montagem falha depois de os campos já terem valor, a MESMA janela cria a SC de verdade — foi assim que o defeito foi descoberto (ver `docs/estado-do-gate.md`). Não trate a recusa como se o produto estivesse protegido. O esperado é ZERO: enquanto a montagem não termina, o Enviar tem de ficar inerte (ou desabilitado), e submissão de formulário não montado nunca pode ser aceita

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-fail-open-form-bb578-rmulário-terminar-de-montar-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-fail-open-form-bb578-rmulário-terminar-de-montar-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-fail-open-form-bb578-rmulário-terminar-de-montar-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-fail-open-form-bb578-rmulário-terminar-de-montar-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=754216 npx playwright test tests/e2e/compras/fail-open-formulario-sc.spec.js -g "CT-CMP-07-S1 @destrutivo — Enviar não deveria criar solicitação antes de o formulário terminar de montar"`

---

### 39. CT-NEG — o Enviar do shell sem proposta real vinculada nunca deveria completar uma requisição de escrita

- **Arquivo:** `e2e/compras/negociacao-proposta.spec.js:97` · **Suíte:** Negociação de Cotação — formulário avulso (shell fora de contexto) · **Duração:** 5.9 s
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Causa raiz:** G4 — Formulários clássicos aceitam Enviar sem validação — fail-open, SC sem anexo, Cotação, Negociação, Parecer · **Referência:** CT-NEG
- **O que acontece:** Enviar no shell de Negociação de Cotação, sem proposta vinculada, disparou `workflowView/send`.
- **Por que falha:** Sem validação de cliente; a guarda bloqueou a escrita.
- **Onde falha:** `expect(guarda.tentativas()).toBe(0)` em `negociacao-proposta.spec.js:126`. (local exato: `tests/e2e/compras/negociacao-proposta.spec.js:126`)

**Mensagem da falha:**

```
Error: o clique em Enviar deveria ter sido recusado no cliente, sem gerar nenhuma requisição de escrita — em vez disso tentou: POST https://caixade182374.fluig.cloudtotvs.com.br/ecm/api/rest/ecm/workflowView/send

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-negociacao-pro-c3542-r-uma-requisição-de-escrita-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-negociacao-pro-c3542-r-uma-requisição-de-escrita-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-negociacao-pro-c3542-r-uma-requisição-de-escrita-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-negociacao-pro-c3542-r-uma-requisição-de-escrita-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=24107 npx playwright test tests/e2e/compras/negociacao-proposta.spec.js -g "CT-NEG — o Enviar do shell sem proposta real vinculada nunca deveria completar uma requisição de escrita"`

---

### 40. CT-NEG — a fila real de "Avaliação de Propostas" está vazia (pré-condição ausente para validar/reprovar uma proposta real)

- **Arquivo:** `e2e/compras/negociacao-proposta.spec.js:131` · **Suíte:** Negociação de Cotação — ponto de entrada real (Portal do Comprador) · **Duração:** 6.0 s
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Causa raiz:** G13 — Filas vazias — nada para operar em Cotação, Negociação e pool de tarefas · **Referência:** CT-NEG-01
- **O que acontece:** A fila "Avaliação de Propostas" está vazia.
- **Por que falha:** Mesmo bloqueio de fundo de CT-COT: D-01 impede qualquer Cotação real de existir.
- **Onde falha:** `negociacao-proposta.spec.js:150`. (local exato: `tests/e2e/compras/negociacao-proposta.spec.js:150`)

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: a fila de "Avaliação de Propostas" do Portal do Comprador não tem nenhuma cotação, com ou sem proposta de fornecedor. Isto NÃO é defeito isolado do produto — é o mesmo bloqueio de fundo que impede CT-COT: D-01 mantém toda Solicitação de Compra presa na conta de integração, então nenhuma Cotação real chega a existir para negociar. CT-NEG-01-H, CT-NEG-01-S1 e CT-NEG-01-S2 continuam bloqueados até D-01 ser corrigido e/ou existir uma proposta real nesta fila.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-negociacao-pro-dfdaa-reprovar-uma-proposta-real--e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-negociacao-pro-dfdaa-reprovar-uma-proposta-real--e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-negociacao-pro-dfdaa-reprovar-uma-proposta-real--e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-negociacao-pro-dfdaa-reprovar-uma-proposta-real--e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=237007 npx playwright test tests/e2e/compras/negociacao-proposta.spec.js -g "CT-NEG — a fila real de \"Avaliação de Propostas\" está vazia (pré-condição ausente para validar/reprovar uma proposta real)"`

---

### 41. CT-PAR-01-S1 — parecer sem responsável definido não pode completar uma requisição de escrita ao Enviar

- **Arquivo:** `e2e/compras/parecer-tecnico.spec.js:84` · **Suíte:** Parecer Técnico — formulário avulso · **Duração:** 6.5 s
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Causa raiz:** G4 — Formulários clássicos aceitam Enviar sem validação — fail-open, SC sem anexo, Cotação, Negociação, Parecer · **Referência:** CT-PAR-01-S1
- **O que acontece:** Parecer Técnico sem responsável definido: Enviar disparou `workflowView/send`.
- **Por que falha:** O formulário nasce sem Responsável e não impede o envio.
- **Onde falha:** `parecer-tecnico.spec.js:109`. (local exato: `tests/e2e/compras/parecer-tecnico.spec.js:109`)

**Mensagem da falha:**

```
Error: um parecer sem responsável definido não deveria gerar nenhuma requisição de escrita — em vez disso tentou: POST https://caixade182374.fluig.cloudtotvs.com.br/ecm/api/rest/ecm/workflowView/send

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-parecer-tecnic-a35a5-isição-de-escrita-ao-Enviar-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-parecer-tecnic-a35a5-isição-de-escrita-ao-Enviar-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-parecer-tecnic-a35a5-isição-de-escrita-ao-Enviar-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-parecer-tecnic-a35a5-isição-de-escrita-ao-Enviar-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=543862 npx playwright test tests/e2e/compras/parecer-tecnico.spec.js -g "CT-PAR-01-S1 — parecer sem responsável definido não pode completar uma requisição de escrita ao Enviar"`

---

### 42. CT-PAR-01-S2 — parecer desfavorável (Reprovado/Ajustes) com justificativa também é barrado pela ausência de responsável

- **Arquivo:** `e2e/compras/parecer-tecnico.spec.js:112` · **Suíte:** Parecer Técnico — formulário avulso · **Duração:** 6.6 s
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Causa raiz:** G4 — Formulários clássicos aceitam Enviar sem validação — fail-open, SC sem anexo, Cotação, Negociação, Parecer · **Referência:** CT-PAR-01-S2
- **O que acontece:** Parecer desfavorável com justificativa, sem responsável: Enviar também disparou `workflowView/send`.
- **Por que falha:** Mesma ausência de validação de S1.
- **Onde falha:** `parecer-tecnico.spec.js:134`. (local exato: `tests/e2e/compras/parecer-tecnico.spec.js:134`)

**Mensagem da falha:**

```
Error: um parecer reprovado sem responsável definido não deveria gerar nenhuma requisição de escrita — em vez disso tentou: POST https://caixade182374.fluig.cloudtotvs.com.br/ecm/api/rest/ecm/workflowView/send

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-parecer-tecnic-d0574-ela-ausência-de-responsável-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-parecer-tecnic-d0574-ela-ausência-de-responsável-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-parecer-tecnic-d0574-ela-ausência-de-responsável-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/compras/e2e-compras-parecer-tecnic-d0574-ela-ausência-de-responsável-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=200992 npx playwright test tests/e2e/compras/parecer-tecnico.spec.js -g "CT-PAR-01-S2 — parecer desfavorável (Reprovado/Ajustes) com justificativa também é barrado pela ausência de responsável"`

---

### 43. CT-DEL-01-H @destrutivo: delegar um fiscal substituto para um contrato deve criar a delegação

- **Arquivo:** `e2e/contratos/delegacao-fiscais-ciclo.spec.js:42` · **Suíte:** Delegação de Fiscais de Contrato/Serviço — ciclo completo · **Duração:** 33.3 s · **Tags:** destrutivo:
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Causa raiz:** G10 — Contratos de API — notificações, favoritos, reset de senha do fornecedor, medição e delegação de fiscais · **Referência:** CT-DEL-01-H
- **O que acontece:** O processo `wf_delegacaoFiscalContratoServico` consta do catálogo como iniciável, abre o formulário, mas ao Enviar o servidor responde 500: "Solicitação só pode ser aberta através do portal de delegação de fiscais!".
- **Por que falha:** O evento do processo exige um portal de origem que não existe em nenhum menu, atalho ou rota alcançável por esta conta. Catálogo e regra do processo se contradizem.
- **Onde falha:** `expect(getByText(/iniciada com sucesso/)).toBeVisible()` em `delegacao-fiscais-ciclo.spec.js:77`. (local exato: `tests/e2e/contratos/delegacao-fiscais-ciclo.spec.js:77`)

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
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/contratos/e2e-contratos-delegacao-fi-3304a-rato-deve-criar-a-delegação-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/contratos/e2e-contratos-delegacao-fi-3304a-rato-deve-criar-a-delegação-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/contratos/e2e-contratos-delegacao-fi-3304a-rato-deve-criar-a-delegação-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/contratos/e2e-contratos-delegacao-fi-3304a-rato-deve-criar-a-delegação-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=675195 npx playwright test tests/e2e/contratos/delegacao-fiscais-ciclo.spec.js -g "CT-DEL-01-H @destrutivo: delegar um fiscal substituto para um contrato deve criar a delegação"`

---

### 44. CT-DEL-01-S1 @destrutivo: substituto inválido/sem permissão deve ser bloqueado — não há nenhum controle para selecionar um fiscal substituto

- **Arquivo:** `e2e/contratos/delegacao-fiscais-ciclo.spec.js:82` · **Suíte:** Delegação de Fiscais de Contrato/Serviço — ciclo completo · **Duração:** 11.9 s · **Tags:** destrutivo:
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Causa raiz:** G10 — Contratos de API — notificações, favoritos, reset de senha do fornecedor, medição e delegação de fiscais · **Referência:** CT-DEL-01-S1
- **O que acontece:** O formulário não oferece nenhum controle para informar o fiscal substituto (0 searchbox/combobox).
- **Por que falha:** Inexequível pela interface atual: não há entrada para exercitar "substituto inválido". Mesma causa de CT-DEL-01-H.
- **Onde falha:** `expect(controles).toBeGreaterThan(0)` em `delegacao-fiscais-ciclo.spec.js:180`. (local exato: `tests/e2e/contratos/delegacao-fiscais-ciclo.spec.js:180`)

**Mensagem da falha:**

```
Error: CT-DEL-01-S1 é INEXEQUÍVEL pela interface atual: o formulário de Delegação de Fiscais não oferece nenhum controle (searchbox/combobox) para informar um fiscal substituto, então não há entrada de dado para exercitar "substituto inválido". O único caminho de escrita (Enviar) é recusado pelo servidor — HTTP 500 em /ecm/api/rest/ecm/workflowView/send: Erro ao salvar dados de formulário: Solicitação só pode ser aberta através do portal de delegação de fiscais! — e esse portal não foi encontrado em nenhum ponto de navegação alcançável por este usuário (ver CT-DEL-01-H)

expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/contratos/e2e-contratos-delegacao-fi-772a7-cionar-um-fiscal-substituto-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/contratos/e2e-contratos-delegacao-fi-772a7-cionar-um-fiscal-substituto-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/contratos/e2e-contratos-delegacao-fi-772a7-cionar-um-fiscal-substituto-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/contratos/e2e-contratos-delegacao-fi-772a7-cionar-um-fiscal-substituto-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=793470 npx playwright test tests/e2e/contratos/delegacao-fiscais-ciclo.spec.js -g "CT-DEL-01-S1 @destrutivo: substituto inválido/sem permissão deve ser bloqueado — não há nenhum controle para selecionar um fiscal substituto"`

---

### 45. CT-FAT-02-S2: competência recusada pelo Protheus deve bloquear a medição E avisar o usuário

- **Arquivo:** `e2e/contratos/validacoes-faturamento.spec.js:76` · **Suíte:** Faturamento de Contratos — validações e bloqueios · **Duração:** 42.0 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G10 — Contratos de API — notificações, favoritos, reset de senha do fornecedor, medição e delegação de fiscais · **Referência:** CT-FAT-02-S2
- **O que acontece:** O Protheus recusou a medição ("CNTA120_REV: Existe revisão pendente de aprovação para este contrato…") e a tela não exibiu aviso nenhum — o painel de itens só não abre.
- **Por que falha:** O widget engole o `STATUS: ERROR` do dataset de medição. Confirmado interceptando a resposta recebida.
- **Onde falha:** `expect(avisou).toBe(true)` em `validacoes-faturamento.spec.js:170`. (local exato: `tests/e2e/contratos/validacoes-faturamento.spec.js:170`)

**Mensagem da falha:**

```
Error: defeito: o Protheus recusou a medição com "Id do submodelo de erro:CNDMASTER - Id do campo de erro:CND_CONTRA - mensagem do erro: CNTA120_REV:Existe revisão pendente de aprovação para este contrato, não ", mas a tela não exibiu nenhum aviso ao usuário — a recusa é engolida silenciosamente

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/contratos/e2e-contratos-validacoes-f-7dd87--medição-E-avisar-o-usuário-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/contratos/e2e-contratos-validacoes-f-7dd87--medição-E-avisar-o-usuário-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/contratos/e2e-contratos-validacoes-f-7dd87--medição-E-avisar-o-usuário-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/contratos/e2e-contratos-validacoes-f-7dd87--medição-E-avisar-o-usuário-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=153365 npx playwright test tests/e2e/contratos/validacoes-faturamento.spec.js -g "CT-FAT-02-S2: competência recusada pelo Protheus deve bloquear a medição E avisar o usuário"`

---

### 46. CT-FAT-02-S3: reprovar uma validação (Validação CSE / Validação da Medição CSE / Validação do Fiscal de Contrato) não é alcançável — o usuário desta automação não pertence a nenhum grupo dessas etapas

- **Arquivo:** `e2e/contratos/validacoes-faturamento.spec.js:252` · **Suíte:** Faturamento de Contratos — validações e bloqueios · **Duração:** 52.6 s
- **Natureza:** Sem veredito (falhou antes da assertion de domínio)
- **Causa raiz:** G14 — Divergências pontuais do ambiente e falhas sem veredito · **Referência:** CT-FAT-02-S3
- **O que acontece:** `locator.click` estourou 45 s esperando o link "Tarefas em pool" da Central de Tarefas.
- **Por que falha:** Falhou na navegação, antes da verificação de alcançabilidade que dá nome ao teste. A Central de Tarefas estava sob carga (4 testes de ciclo em paralelo); é o único teste da execução que não chegou à assertion de domínio por motivo de tela.
- **Onde falha:** `validacoes-faturamento.spec.js:264`. (local exato: `tests/e2e/contratos/validacoes-faturamento.spec.js:264`)

**Mensagem da falha:**

```
TimeoutError: locator.click: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/contratos/e2e-contratos-validacoes-f-0a493--nenhum-grupo-dessas-etapas-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/contratos/e2e-contratos-validacoes-f-0a493--nenhum-grupo-dessas-etapas-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/contratos/e2e-contratos-validacoes-f-0a493--nenhum-grupo-dessas-etapas-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/contratos/e2e-contratos-validacoes-f-0a493--nenhum-grupo-dessas-etapas-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=397826 npx playwright test tests/e2e/contratos/validacoes-faturamento.spec.js -g "CT-FAT-02-S3: reprovar uma validação (Validação CSE / Validação da Medição CSE / Validação do Fiscal de Contrato) não é alcançável — o usuário desta automação não pertence a nenhum grupo dessas etapas"`

---

### 47. CT-GED-02-S2 @destrutivo — script de lote (.bat) deveria ser rejeitado

- **Arquivo:** `e2e/documentos/bloqueio-extensoes.spec.js:133` · **Suíte:** GED — allowlist de extensão, não lista negra do .exe (CT-GED-02-S2) · **Duração:** 7.5 s · **Tags:** destrutivo
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G5 — GED aceita qualquer extensão e qualquer conteúdo (CT-GED-02-S1 / S2) · **Referência:** CT-GED-02-S2 (.bat)
- **O que acontece:** Execução principal: `page.goto` caiu com `net::ERR_NETWORK_CHANGED` (a rede da máquina de execução oscilou) — infraestrutura, sem veredito. 2ª tentativa: a tabela de upload do publicador guardou linhas residuais da tentativa abortada e o page object desistiu após 10 remoções. **3ª tentativa: reprovou pelo defeito real** — `qa-script-lote.bat` publicado sem mensagem de bloqueio.
- **Por que falha:** Não há allowlist de extensão no GED.
- **Onde falha:** Principal: `DocumentosPage.js:92` (goto). 3ª tentativa: `bloqueio-extensoes.spec.js:119`. (local exato: `pages/DocumentosPage.js:92`)

**Mensagem da falha:**

```
Error: page.goto: net::ERR_NETWORK_CHANGED at https://caixade182374.fluig.cloudtotvs.com.br/portal/p/1/ecmnavigation
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-bloqueio-ex-30386-e-bat-deveria-ser-rejeitado-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-bloqueio-ex-30386-e-bat-deveria-ser-rejeitado-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-bloqueio-ex-30386-e-bat-deveria-ser-rejeitado-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-bloqueio-ex-30386-e-bat-deveria-ser-rejeitado-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=474961 npx playwright test tests/e2e/documentos/bloqueio-extensoes.spec.js -g "CT-GED-02-S2 @destrutivo — script de lote (.bat) deveria ser rejeitado"`

---

### 48. CT-GED-02-S2 @destrutivo — shell script (.sh) deveria ser rejeitado

- **Arquivo:** `e2e/documentos/bloqueio-extensoes.spec.js:149` · **Suíte:** GED — allowlist de extensão, não lista negra do .exe (CT-GED-02-S2) · **Duração:** 55.6 s · **Tags:** destrutivo
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G5 — GED aceita qualquer extensão e qualquer conteúdo (CT-GED-02-S1 / S2) · **Referência:** CT-GED-02-S2 (.sh)
- **O que acontece:** `qa-script-shell.sh` foi publicado no GED sem nenhuma mensagem de bloqueio.
- **Por que falha:** Não há allowlist de extensão: uma correção que só coloque ".exe" numa lista negra deixa este caso vermelho.
- **Onde falha:** `expect(mensagemDeBloqueio).toBeVisible()` em `bloqueio-extensoes.spec.js:119`. (local exato: `tests/e2e/documentos/bloqueio-extensoes.spec.js:119`)

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
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-bloqueio-ex-d2ab4-pt-sh-deveria-ser-rejeitado-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-bloqueio-ex-d2ab4-pt-sh-deveria-ser-rejeitado-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-bloqueio-ex-d2ab4-pt-sh-deveria-ser-rejeitado-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-bloqueio-ex-d2ab4-pt-sh-deveria-ser-rejeitado-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=929833 npx playwright test tests/e2e/documentos/bloqueio-extensoes.spec.js -g "CT-GED-02-S2 @destrutivo — shell script (.sh) deveria ser rejeitado"`

---

### 49. CT-GED-02-S2 @destrutivo — dupla extensão (.pdf.exe) deveria ser rejeitada

- **Arquivo:** `e2e/documentos/bloqueio-extensoes.spec.js:163` · **Suíte:** GED — allowlist de extensão, não lista negra do .exe (CT-GED-02-S2) · **Duração:** 47.9 s · **Tags:** destrutivo
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G5 — GED aceita qualquer extensão e qualquer conteúdo (CT-GED-02-S1 / S2) · **Referência:** CT-GED-02-S2 (.pdf.exe (dupla extensão))
- **O que acontece:** `qa-relatorio.pdf.exe` foi publicado no GED sem nenhuma mensagem de bloqueio.
- **Por que falha:** Não há allowlist de extensão: uma correção que só coloque ".exe" numa lista negra deixa este caso vermelho.
- **Onde falha:** `expect(mensagemDeBloqueio).toBeVisible()` em `bloqueio-extensoes.spec.js:119`. (local exato: `tests/e2e/documentos/bloqueio-extensoes.spec.js:119`)

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
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-bloqueio-ex-f98c4-f-exe-deveria-ser-rejeitada-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-bloqueio-ex-f98c4-f-exe-deveria-ser-rejeitada-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-bloqueio-ex-f98c4-f-exe-deveria-ser-rejeitada-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-bloqueio-ex-f98c4-f-exe-deveria-ser-rejeitada-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=471797 npx playwright test tests/e2e/documentos/bloqueio-extensoes.spec.js -g "CT-GED-02-S2 @destrutivo — dupla extensão (.pdf.exe) deveria ser rejeitada"`

---

### 50. CT-GED-02-S2 @destrutivo — executável renomeado para .pdf deveria ser rejeitado pelo conteúdo

- **Arquivo:** `e2e/documentos/bloqueio-extensoes.spec.js:176` · **Suíte:** GED — allowlist de extensão, não lista negra do .exe (CT-GED-02-S2) · **Duração:** 46.0 s · **Tags:** destrutivo
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G5 — GED aceita qualquer extensão e qualquer conteúdo (CT-GED-02-S1 / S2) · **Referência:** CT-GED-02-S2 (conteúdo)
- **O que acontece:** `qa-executavel-disfarcado.pdf` — nome `.pdf`, conteúdo começa com os magic bytes `MZ` de um executável PE — foi publicado sem mensagem.
- **Por que falha:** Nem o nome nem o conteúdo são inspecionados. Este caso continuará vermelho mesmo se uma allowlist por extensão for implementada.
- **Onde falha:** `bloqueio-extensoes.spec.js:209`. (local exato: `tests/e2e/documentos/bloqueio-extensoes.spec.js:209`)

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
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-bloqueio-ex-4fb72-ser-rejeitado-pelo-conteúdo-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-bloqueio-ex-4fb72-ser-rejeitado-pelo-conteúdo-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-bloqueio-ex-4fb72-ser-rejeitado-pelo-conteúdo-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-bloqueio-ex-4fb72-ser-rejeitado-pelo-conteúdo-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=943592 npx playwright test tests/e2e/documentos/bloqueio-extensoes.spec.js -g "CT-GED-02-S2 @destrutivo — executável renomeado para .pdf deveria ser rejeitado pelo conteúdo"`

---

### 51. CT-GED-02-S1 upload de extensão bloqueada é rejeitado e nada é gravado @destrutivo

- **Arquivo:** `e2e/documentos/gestao-documentos.spec.js:66` · **Suíte:** Documentos — upload (CT-GED-02) · **Duração:** 58.1 s · **Tags:** destrutivo
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G5 — GED aceita qualquer extensão e qualquer conteúdo (CT-GED-02-S1 / S2) · **Referência:** CT-GED-02-S1
- **O que acontece:** Upload de `.exe` aceito e publicado sem nenhuma mensagem de bloqueio.
- **Por que falha:** Ausência de validação de extensão no GED.
- **Onde falha:** `gestao-documentos.spec.js:93`. (local exato: `tests/e2e/documentos/gestao-documentos.spec.js:93`)

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
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-gestao-docu-9bcb1-e-nada-é-gravado-destrutivo-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-gestao-docu-9bcb1-e-nada-é-gravado-destrutivo-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-gestao-docu-9bcb1-e-nada-é-gravado-destrutivo-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/documentos/e2e-documentos-gestao-docu-9bcb1-e-nada-é-gravado-destrutivo-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=850318 npx playwright test tests/e2e/documentos/gestao-documentos.spec.js -g "CT-GED-02-S1 upload de extensão bloqueada é rejeitado e nada é gravado @destrutivo"`

---

### 52. CT-JUR-01-H deveria criar a solicitação de Consultivo e vinculá-la à área informada @destrutivo

- **Arquivo:** `e2e/juridico/sigajuri-consultivo.spec.js:48` · **Suíte:** SIGAJURI_Consultivo — solicitação, D-JUR-01 · **Duração:** 6.4 s · **Tags:** destrutivo
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Causa raiz:** G8 — Jurídico (SIGAJURI) — combos vazios e parte contrária inalcançável · **Referência:** CT-JUR-01-H / D-JUR-01
- **O que acontece:** O combo "Tipo Consulta" do SIGAJURI_Consultivo oferece 1 opção (só o placeholder).
- **Por que falha:** O dataset que alimenta os tipos de consulta não devolve registros — não dá para criar uma consulta vinculada a uma área.
- **Onde falha:** `expect(opcoes).toBeGreaterThan(1)` em `sigajuri-consultivo.spec.js:66`. (local exato: `tests/e2e/juridico/sigajuri-consultivo.spec.js:66`)

**Mensagem da falha:**

```
Error: Tipo Consulta deveria oferecer mais de uma opção (tipos reais de consulta)

expect(received).toBeGreaterThan(expected)

Expected: > 1
Received:   1
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/juridico/e2e-juridico-sigajuri-cons-c671a-à-área-informada-destrutivo-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/juridico/e2e-juridico-sigajuri-cons-c671a-à-área-informada-destrutivo-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/juridico/e2e-juridico-sigajuri-cons-c671a-à-área-informada-destrutivo-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/juridico/e2e-juridico-sigajuri-cons-c671a-à-área-informada-destrutivo-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=340681 npx playwright test tests/e2e/juridico/sigajuri-consultivo.spec.js -g "CT-JUR-01-H deveria criar a solicitação de Consultivo e vinculá-la à área informada @destrutivo"`

---

### 53. CT-JUR-04-S1 deveria oferecer campo para registrar a parte contrária em consultas contenciosas

- **Arquivo:** `e2e/juridico/sigajuri-contencioso.spec.js:196` · **Suíte:** SIGAJURI_Contencioso — roteamento por área e parte contrária · **Duração:** 7.5 s
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Causa raiz:** G8 — Jurídico (SIGAJURI) — combos vazios e parte contrária inalcançável · **Referência:** CT-JUR-04-S1
- **O que acontece:** Numa consulta do tipo "Liminar", o botão "Novo Envolvido" fica oculto (classe `sem-processo-hide`) tanto no estado padrão quanto com "Não possui processo." marcado.
- **Por que falha:** A regra de exibição esconde o único caminho para registrar a parte contrária.
- **Onde falha:** `expect(visivel).toBe(true)` em `sigajuri-contencioso.spec.js:230`. (local exato: `tests/e2e/juridico/sigajuri-contencioso.spec.js:230`)

**Mensagem da falha:**

```
Error: deveria existir um caminho visível para registrar a parte contrária (botão "Novo Envolvido") em uma consulta do tipo "Liminar" — testado com o formulário no estado padrão e com "Não possui processo." marcado, o botão fica oculto (classe CSS `sem-processo-hide`) nos dois casos

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/juridico/e2e-juridico-sigajuri-cont-5eff7-a-em-consultas-contenciosas-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/juridico/e2e-juridico-sigajuri-cont-5eff7-a-em-consultas-contenciosas-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/juridico/e2e-juridico-sigajuri-cont-5eff7-a-em-consultas-contenciosas-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/juridico/e2e-juridico-sigajuri-cont-5eff7-a-em-consultas-contenciosas-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=206423 npx playwright test tests/e2e/juridico/sigajuri-contencioso.spec.js -g "CT-JUR-04-S1 deveria oferecer campo para registrar a parte contrária em consultas contenciosas"`

---

### 54. CT-JUR-03-H deveria permitir montar uma minuta preenchendo Filial e Tipo Contrato

- **Arquivo:** `e2e/juridico/sigajuri-contrato.spec.js:32` · **Suíte:** SIGAJURI_Contrato — geração de minuta, D-JUR-01 · **Duração:** 7.0 s
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Causa raiz:** G8 — Jurídico (SIGAJURI) — combos vazios e parte contrária inalcançável · **Referência:** CT-JUR-03-H / D-JUR-01
- **O que acontece:** O combo "Filial" do SIGAJURI_Contrato oferece 1 opção.
- **Por que falha:** Dataset de filiais vazio para esta conta/processo; não é possível montar a minuta.
- **Onde falha:** `sigajuri-contrato.spec.js:48`. (local exato: `tests/e2e/juridico/sigajuri-contrato.spec.js:48`)

**Mensagem da falha:**

```
Error: Filial deveria oferecer mais de uma opção (filiais reais)

expect(received).toBeGreaterThan(expected)

Expected: > 1
Received:   1
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/juridico/e2e-juridico-sigajuri-cont-f999c-endo-Filial-e-Tipo-Contrato-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/juridico/e2e-juridico-sigajuri-cont-f999c-endo-Filial-e-Tipo-Contrato-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/juridico/e2e-juridico-sigajuri-cont-f999c-endo-Filial-e-Tipo-Contrato-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/juridico/e2e-juridico-sigajuri-cont-f999c-endo-Filial-e-Tipo-Contrato-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=922064 npx playwright test tests/e2e/juridico/sigajuri-contrato.spec.js -g "CT-JUR-03-H deveria permitir montar uma minuta preenchendo Filial e Tipo Contrato"`

---

### 55. CT-NOT-03-S1: `GET /notification/api/v1/notifications` deve respeitar `limit` e `offset`

- **Arquivo:** `e2e/notificacoes/contratos-api-notificacao.spec.js:98` · **Suíte:** Notificações — contratos da API (CT-NOT-03-S1) · **Duração:** 30.9 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G10 — Contratos de API — notificações, favoritos, reset de senha do fornecedor, medição e delegação de fiscais · **Referência:** CT-NOT-03-S1
- **O que acontece:** `GET /notification/api/v1/notifications?limit=3` devolveu 1000 itens; `offset` também não altera o primeiro id (3328180 nas três chamadas).
- **Por que falha:** O servidor ignora `limit`/`offset`. Em 27/08 eram 707 — a lista cresce e todo cliente recebe tudo.
- **Onde falha:** `expect(quantidade).toBe(3)` em `contratos-api-notificacao.spec.js:162`. Sondagem completa no anexo `paginacao-de-notificacoes`. (local exato: `tests/e2e/notificacoes/contratos-api-notificacao.spec.js:162`)

**Mensagem da falha:**

```
Error: `GET /notification/api/v1/notifications?limit=3` deveria devolver 3 notificações e devolveu 1000: o parâmetro `limit` é ignorado pelo servidor. Todo cliente recebe a lista inteira hoje; no dia em que a paginação passar a valer, esses clientes mudam de comportamento sem nenhum aviso.

expect(received).toBe(expected) // Object.is equality

Expected: 3
Received: 1000
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/notificacoes/e2e-notificacoes-contratos-70a93-e-respeitar-limit-e-offset--e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/notificacoes/e2e-notificacoes-contratos-70a93-e-respeitar-limit-e-offset--e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/notificacoes/e2e-notificacoes-contratos-70a93-e-respeitar-limit-e-offset--e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/notificacoes/e2e-notificacoes-contratos-70a93-e-respeitar-limit-e-offset--e2e/error-context.md`
- anexo do teste `paginacao-de-notificacoes`:

  ```json
  {
    "semParametro": {
      "status": 200,
      "quantidade": 1000,
      "primeiroId": 3328180,
      "texto": ""
    },
    "limite3": {
      "status": 200,
      "quantidade": 1000,
      "primeiroId": 3328180,
      "texto": ""
    },
    "segundaPagina": {
      "status": 200,
      "quantidade": 1000,
      "primeiroId": 3328180,
      "texto": ""
    }
  }
  ```
**Reproduzir:** `FAKER_SEED=506007 npx playwright test tests/e2e/notificacoes/contratos-api-notificacao.spec.js -g "CT-NOT-03-S1: `GET /notification/api/v1/notifications` deve respeitar `limit` e `offset`"`

---

### 56. CT-NOT-03-S1: notificação declara `canRemove: true`, então o verbo REST de remoção deveria existir

- **Arquivo:** `e2e/notificacoes/contratos-api-notificacao.spec.js:171` · **Suíte:** Notificações — contratos da API (CT-NOT-03-S1) · **Duração:** 14.2 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G10 — Contratos de API — notificações, favoritos, reset de senha do fornecedor, medição e delegação de fiscais · **Referência:** CT-NOT-03-S1
- **O que acontece:** Cada notificação declara `canRemove: true`, mas `DELETE /notification/api/v1/notifications/{id}` responde 500 `NotFoundException` (a coleção responde `NotAllowedException`, então a rota com id simplesmente não existe).
- **Por que falha:** A remoção real vive em `POST /globalalertapi/api/rest/alert/removeAlerts`, sem referência no recurso.
- **Onde falha:** `contratos-api-notificacao.spec.js:259`. Sondagem no anexo `sondagem-de-rotas-de-remocao`. (local exato: `tests/e2e/notificacoes/contratos-api-notificacao.spec.js:259`)

**Mensagem da falha:**

```
Error: as notificações declaram `canRemove: true`, mas `DELETE /notification/api/v1/notifications/{id}` responde 500 `NotFoundException` — neste ambiente isso significa que a ROTA NÃO EXISTE (a coleção existe e responde `NotAllowedException`; uma rota inventada responde `NotFoundException`, como o controle acima confirma). A remoção real só existe em `POST /globalalertapi/api/rest/alert/removeAlerts`, em outro módulo e sem nenhuma referência no recurso que promete ser removível.

expect(received).not.toBe(expected) // Object.is equality

Expected: not "NotFoundException"
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/notificacoes/e2e-notificacoes-contratos-fc8f3--de-remoção-deveria-existir-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/notificacoes/e2e-notificacoes-contratos-fc8f3--de-remoção-deveria-existir-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/notificacoes/e2e-notificacoes-contratos-fc8f3--de-remoção-deveria-existir-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/notificacoes/e2e-notificacoes-contratos-fc8f3--de-remoção-deveria-existir-e2e/error-context.md`
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
**Reproduzir:** `FAKER_SEED=491719 npx playwright test tests/e2e/notificacoes/contratos-api-notificacao.spec.js -g "CT-NOT-03-S1: notificação declara `canRemove: true`, então o verbo REST de remoção deveria existir"`

---

### 57. CT-PLT-10-H: o conjunto de processos publicados e o de iniciáveis devem bater exatamente com o inventário versionado

- **Arquivo:** `e2e/plataforma/catalogo-invariante.spec.js:149` · **Suíte:** Plataforma — invariante do catálogo de processos · **Duração:** 7.1 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G7 — Catálogo de processos mudou desde o inventário versionado — 6 processos passaram a ser iniciáveis · **Referência:** CT-PLT-10-H
- **O que acontece:** Seis processos ENTRARAM no catálogo `onlyCanStart` desta conta desde o inventário versionado: `GestaoDependentes`, `SIGAJURI_AprovaFU`, `SIGAJURI_Contencioso`, `SIGAJURI_Contrato`, `rh_gbeneficios_planosaude`, `wf_substituicaocargos`. Nenhum saiu. Total publicado: 34.
- **Por que falha:** Mudança de permissão de início no ambiente. O invariante existe para acusar exatamente isso; cabe à Cassi dizer se cada linha foi intencional (dois deles são processos de RH da pergunta aberta nº 1).
- **Onde falha:** `expect(diff).toEqual({entraram:[], sairam:[]})` em `catalogo-invariante.spec.js:221`. Inventário lido no anexo. (local exato: `tests/e2e/plataforma/catalogo-invariante.spec.js:221`)

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
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-catalogo-in-d60cf-com-o-inventário-versionado-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-catalogo-in-d60cf-com-o-inventário-versionado-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-catalogo-in-d60cf-com-o-inventário-versionado-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-catalogo-in-d60cf-com-o-inventário-versionado-e2e/error-context.md`
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
**Reproduzir:** `FAKER_SEED=25340 npx playwright test tests/e2e/plataforma/catalogo-invariante.spec.js -g "CT-PLT-10-H: o conjunto de processos publicados e o de iniciáveis devem bater exatamente com o inventário versionado"`

---

### 58. CT-PLT-10-H: `SIGAJURI_Contencioso` continua fora do catálogo `onlyCanStart` embora crie solicitação — a permissão real diverge do filtro da tela

- **Arquivo:** `e2e/plataforma/catalogo-invariante.spec.js:224` · **Suíte:** Plataforma — invariante do catálogo de processos · **Duração:** 6.7 s
- **Natureza:** Divergência ambiente × suíte (o ambiente mudou)
- **Causa raiz:** G7 — Catálogo de processos mudou desde o inventário versionado — 6 processos passaram a ser iniciáveis · **Referência:** CT-PLT-10-H
- **O que acontece:** `SIGAJURI_Contencioso` passou a constar do catálogo `onlyCanStart` — o achado anterior ("cria solicitação mas fica fora do catálogo") mudou.
- **Por que falha:** A permissão de início foi alinhada ao filtro da tela. O teste, por desenho, acusa a mudança e pede reescrita para a nova regra.
- **Onde falha:** `expect(catalogo).not.toContain("SIGAJURI_Contencioso")` em `catalogo-invariante.spec.js:265`. (local exato: `tests/e2e/plataforma/catalogo-invariante.spec.js:265`)

**Mensagem da falha:**

```
Error: a divergência mudou: `SIGAJURI_Contencioso` PASSOU a constar do catálogo `onlyCanStart`. Se a permissão de início foi alinhada ao filtro da tela, o achado foi resolvido e este teste deve ser reescrito para a nova regra — não silenciado.

expect(received).not.toContain(expected) // indexOf

Expected value: not "SIGAJURI_Contencioso"
Received array:     ["bpm_addUserGroup", "bpm_addUserFluig", "teste", "wf_cadastro_fornecedor", "wf_cotacao_produtos_servicos", "wf_negociacao_cotacao_prod_serv", "wf_solicitacao_compras", "wf_solicitacao_compras_parecer", "wf_SubstituiçãoCargosFluig", "wf_delegacaoFiscalContratoServico", "wf_faturamento_contratos", "bpm_financeiro_rejeicoes_bancarias", "prc_questionario_v2", "GestaoDependentes", "rh_gbeneficios_planosaude", "wf_automacao_admissao", "wf_pagamento_horas_extras", "wf_substituicaocargos", "FLUIGADHOC", "SIGAJURI_AprovaFU", "SIGAJURI_Consultivo", "SIGAJURI_Contencioso", "SIGAJURI_Contrato"]
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-catalogo-in-31ece-l-diverge-do-filtro-da-tela-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-catalogo-in-31ece-l-diverge-do-filtro-da-tela-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-catalogo-in-31ece-l-diverge-do-filtro-da-tela-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-catalogo-in-31ece-l-diverge-do-filtro-da-tela-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=680097 npx playwright test tests/e2e/plataforma/catalogo-invariante.spec.js -g "CT-PLT-10-H: `SIGAJURI_Contencioso` continua fora do catálogo `onlyCanStart` embora crie solicitação — a permissão real diverge do filtro da tela"`

---

### 59. acessar /portal/p/1/principalprocess diretamente deve abrir a página, não redirecionar para 404

- **Arquivo:** `e2e/plataforma/deep-link-spa.spec.js:19` · **Suíte:** Deep-link de rota SPA (defeito U-01) · **Duração:** 38.2 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G11 — Plataforma — deep-link 404, erros de console, resíduo `teste`, Aba Atribuir, Clínica vazia, cache _Sync · **Referência:** CT-PLT-04 / U-01
- **O que acontece:** Abrir `/portal/p/1/principalprocess` direto pela URL termina em `/portal/p/1/errorPage/404`.
- **Por que falha:** A rota existe e funciona pela navegação interna da SPA; o deep-link quebra — link salvo, favorito e compartilhamento de endereço não funcionam.
- **Onde falha:** `expect(page).not.toHaveURL(/errorPage\/404/)` em `deep-link-spa.spec.js:32`. (local exato: `tests/e2e/plataforma/deep-link-spa.spec.js:32`)

**Mensagem da falha:**

```
Error: defeito U-01: abrir /portal/p/1/principalprocess diretamente pela URL cai em errorPage/404. A rota existe e funciona quando alcançada pela navegação interna da SPA — o que quebra é o deep-link, então link salvo, favorito e compartilhamento de endereço não funcionam

expect(page).not.toHaveURL(expected) failed

Expected pattern: not /errorPage\/404/
Received string: "https://caixade182374.fluig.cloudtotvs.com.br/portal/p/1/errorPage/404"
Timeout: 30000ms
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-deep-link-s-c8c22-a-não-redirecionar-para-404-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-deep-link-s-c8c22-a-não-redirecionar-para-404-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-deep-link-s-c8c22-a-não-redirecionar-para-404-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-deep-link-s-c8c22-a-não-redirecionar-para-404-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=135581 npx playwright test tests/e2e/plataforma/deep-link-spa.spec.js -g "acessar /portal/p/1/principalprocess diretamente deve abrir a página, não redirecionar para 404"`

---

### 60. acessar /portal/p/1/gestao_ferias diretamente deve abrir a página, não redirecionar para 404

- **Arquivo:** `e2e/plataforma/deep-link-spa.spec.js:19` · **Suíte:** Deep-link de rota SPA (defeito U-01) · **Duração:** 37.4 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G11 — Plataforma — deep-link 404, erros de console, resíduo `teste`, Aba Atribuir, Clínica vazia, cache _Sync · **Referência:** CT-PLT-04 / U-01
- **O que acontece:** Abrir `/portal/p/1/gestao_ferias` direto pela URL termina em `/portal/p/1/errorPage/404`.
- **Por que falha:** A rota existe e funciona pela navegação interna da SPA; o deep-link quebra — link salvo, favorito e compartilhamento de endereço não funcionam.
- **Onde falha:** `expect(page).not.toHaveURL(/errorPage\/404/)` em `deep-link-spa.spec.js:32`. (local exato: `tests/e2e/plataforma/deep-link-spa.spec.js:32`)

**Mensagem da falha:**

```
Error: defeito U-01: abrir /portal/p/1/gestao_ferias diretamente pela URL cai em errorPage/404. A rota existe e funciona quando alcançada pela navegação interna da SPA — o que quebra é o deep-link, então link salvo, favorito e compartilhamento de endereço não funcionam

expect(page).not.toHaveURL(expected) failed

Expected pattern: not /errorPage\/404/
Received string: "https://caixade182374.fluig.cloudtotvs.com.br/portal/p/1/errorPage/404"
Timeout: 30000ms
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-deep-link-s-e66bc-a-não-redirecionar-para-404-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-deep-link-s-e66bc-a-não-redirecionar-para-404-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-deep-link-s-e66bc-a-não-redirecionar-para-404-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-deep-link-s-e66bc-a-não-redirecionar-para-404-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=998175 npx playwright test tests/e2e/plataforma/deep-link-spa.spec.js -g "acessar /portal/p/1/gestao_ferias diretamente deve abrir a página, não redirecionar para 404"`

---

### 61. CT-PLT-06-S1: Portal do Comprador (/portal/p/1/portal-do-comprador) deve carregar sem erro de console não catalogado

- **Arquivo:** `e2e/plataforma/erros-de-console.spec.js:152` · **Suíte:** Plataforma — erro de console nas rotas-chave (CT-PLT-06-S1) · **Duração:** 18.7 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G11 — Plataforma — deep-link 404, erros de console, resíduo `teste`, Aba Atribuir, Clínica vazia, cache _Sync · **Referência:** CT-PLT-06-S1
- **O que acontece:** O Portal do Comprador carrega com 2 erros de console não catalogados: 404 em `/style-guide/css/fluig-style-guide.min.css` e `console.error` "Erro ao buscar as informações do colaborador… Comprador não encontrado" em `wg_portalCompradores/.../main.js`.
- **Por que falha:** CSS ausente no deploy e a busca do comprador no Protheus não encontra a conta `TOTVS-FS` (que não está na SY1).
- **Onde falha:** `expect(naoCatalogados).toEqual([])` em `erros-de-console.spec.js:210`. (local exato: `tests/e2e/plataforma/erros-de-console.spec.js:210`)

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
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-erros-de-co-20672-o-de-console-não-catalogado-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-erros-de-co-20672-o-de-console-não-catalogado-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-erros-de-co-20672-o-de-console-não-catalogado-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-erros-de-co-20672-o-de-console-não-catalogado-e2e/error-context.md`
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
        "recurso": "https://caixade182374.fluig.cloudtotvs.com.br/nps/api/v1/surveys?productLine=TOTVS%20Fluig&_=1788373289681"
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
**Reproduzir:** `FAKER_SEED=960256 npx playwright test tests/e2e/plataforma/erros-de-console.spec.js -g "CT-PLT-06-S1: Portal do Comprador (/portal/p/1/portal-do-comprador) deve carregar sem erro de console não catalogado"`

---

### 62. CT-PLT-07-S1: favoritar o mesmo processo duas vezes deve responder erro de negócio em JSON (ou 200 idempotente), não 500 em texto puro @destrutivo

- **Arquivo:** `e2e/plataforma/favoritos-contrato-api.spec.js:126` · **Suíte:** Plataforma — contrato de `addFavorites` (CT-PLT-07-S1) @destrutivo · **Duração:** 5.8 s · **Tags:** destrutivo, destrutivo
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G10 — Contratos de API — notificações, favoritos, reset de senha do fornecedor, medição e delegação de fiscais · **Referência:** CT-PLT-07-S1
- **O que acontece:** Favoritar `SIGAJURI_Contencioso` duas vezes: a 2ª chamada responde **500** `text/plain` "Processo SIGAJURI_Contencioso já está nos seus favoritos."
- **Por que falha:** Condição de negócio trivial tratada como erro de servidor, em texto puro — quebra qualquer cliente que faça parse do corpo.
- **Onde falha:** `favoritos-contrato-api.spec.js:180`. Par requisição/resposta no anexo `contrato-addFavorites`. (local exato: `tests/e2e/plataforma/favoritos-contrato-api.spec.js:180`)

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
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-favoritos-c-e6283-00-em-texto-puro-destrutivo-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-favoritos-c-e6283-00-em-texto-puro-destrutivo-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-favoritos-c-e6283-00-em-texto-puro-destrutivo-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-favoritos-c-e6283-00-em-texto-puro-destrutivo-e2e/error-context.md`
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
**Reproduzir:** `FAKER_SEED=613921 npx playwright test tests/e2e/plataforma/favoritos-contrato-api.spec.js -g "CT-PLT-07-S1: favoritar o mesmo processo duas vezes deve responder erro de negócio em JSON (ou 200 idempotente), não 500 em texto puro @destrutivo"`

---

### 63. deve carregar os apps e contadores sem erro de console

- **Arquivo:** `e2e/plataforma/home.spec.js:7` · **Suíte:** Home da plataforma · **Duração:** 13.2 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G11 — Plataforma — deep-link 404, erros de console, resíduo `teste`, Aba Atribuir, Clínica vazia, cache _Sync · **Referência:** NPS 403
- **O que acontece:** A Home carrega com "Failed to load resource: 403 (Forbidden)" no console.
- **Por que falha:** `GET /nps/api/v1/surveys` responde 403 em toda carga.
- **Onde falha:** `expect(erros).toEqual([])` em `home.spec.js:39`. (local exato: `tests/e2e/plataforma/home.spec.js:39`)

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
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-home-Home-d-67cff-tadores-sem-erro-de-console-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-home-Home-d-67cff-tadores-sem-erro-de-console-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-home-Home-d-67cff-tadores-sem-erro-de-console-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-home-Home-d-67cff-tadores-sem-erro-de-console-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=306574 npx playwright test tests/e2e/plataforma/home.spec.js -g "deve carregar os apps e contadores sem erro de console"`

---

### 64. CT-PLT-08-S1: o processo `teste` (categoria ADMIN) não deveria constar do catálogo de início de um usuário de Compras

- **Arquivo:** `e2e/plataforma/processo-inativo-e-residuo.spec.js:62` · **Suíte:** Plataforma — processo inativo e resíduo de desenvolvimento (CT-PLT-08-S1) · **Duração:** 4.9 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G11 — Plataforma — deep-link 404, erros de console, resíduo `teste`, Aba Atribuir, Clínica vazia, cache _Sync · **Referência:** CT-PLT-08-S1
- **O que acontece:** O processo `teste` (categoria ADMIN, resíduo de desenvolvimento) continua ofertado em "Iniciar Solicitações" para um usuário de Compras.
- **Por que falha:** Falta de governança de publicação; abri-lo serve o formulário completo da SC (o teste-irmão "ACHADO" passa, confirmando).
- **Onde falha:** `processo-inativo-e-residuo.spec.js:116`. (local exato: `tests/e2e/plataforma/processo-inativo-e-residuo.spec.js:116`)

**Mensagem da falha:**

```
Error: o processo `teste` (categoria ADMIN, resíduo de desenvolvimento, nunca iniciado) continua sendo oferecido na tela "Iniciar Solicitações" de um usuário de Compras. É falta de governança de publicação: um processo de teste administrativo não deveria ser iniciável por perfil de negócio. Catálogo lido: [{"processId":"bpm_addUserGroup","categoria":""},{"processId":"bpm_addUserFluig","categoria":"ADM"},{"processId":"teste","categoria":"ADMIN"},{"processId":"wf_cadastro_fornecedor","categoria":"Compras"},{"processId":"wf_cotacao_produtos_servicos","categoria":"Compras"},{"processId":"wf_negociacao_cotacao_prod_serv","categoria":"Compras"},{"processId":"wf_solicitacao_compras","categoria":"Compras"},{"processId":"wf_solicitacao_compras_parecer","categoria":"Compras"},{"processId":"wf_SubstituiçãoCargosFluig","categoria":"Compras"},{"processId":"wf_delegacaoFiscalContratoServico","categoria":"Contratos"},{"processId":"wf_faturamento_contratos","categoria":"Contratos"},{"processId":"bpm_financeiro_rejeicoes_bancarias","categoria":"Financeiro"},{"processId":"prc_questionario_v2","categoria":"Questionarios"},{"processId":"GestaoDependentes","categoria":"RH"},{"processId":"rh_gbeneficios_planosaude","categoria":"RH"},{"processId":"wf_automacao_admissao","categoria":"RH"},{"processId":"wf_pagamento_horas_extras","categoria":"RH"},{"processId":"wf_substituicaocargos","categoria":"RH"},{"processId":"FLUIGADHOC","categoria":"Tarefas Gerais"},{"processId":"SIGAJURI_AprovaFU","categoria":"TOTVS Juridico"},{"processId":"SIGAJURI_Consultivo","categoria":"TOTVS Juridico"},{"processId":"SI
…
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-processo-in-789dc-io-de-um-usuário-de-Compras-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-processo-in-789dc-io-de-um-usuário-de-Compras-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-processo-in-789dc-io-de-um-usuário-de-Compras-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/plataforma/e2e-plataforma-processo-in-789dc-io-de-um-usuário-de-Compras-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=919144 npx playwright test tests/e2e/plataforma/processo-inativo-e-residuo.spec.js -g "CT-PLT-08-S1: o processo `teste` (categoria ADMIN) não deveria constar do catálogo de início de um usuário de Compras"`

---

### 65. CT-PFN-02-S2 deve recusar um token de redefinição expirado/adulterado sem efetivar a troca

- **Arquivo:** `e2e/portais/acesso-fornecedor.spec.js:107` · **Suíte:** Redefinição de senha do fornecedor — link de reset · **Duração:** 6.6 s
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Causa raiz:** G10 — Contratos de API — notificações, favoritos, reset de senha do fornecedor, medição e delegação de fiscais · **Referência:** CT-PFN-02-S2
- **O que acontece:** Enviar um token de redefinição de senha adulterado/expirado ao endpoint do Portal do Fornecedor responde **HTTP 500**.
- **Por que falha:** O endpoint não trata token inválido como erro controlado (4xx) — crasha. A troca não se efetiva, mas o comportamento é de exceção não tratada.
- **Onde falha:** `expect(status).toBeLessThan(500)` em `acesso-fornecedor.spec.js:134`. (local exato: `tests/e2e/portais/acesso-fornecedor.spec.js:134`)

**Mensagem da falha:**

```
Error: endpoint deveria devolver um erro controlado (4xx), não crashar com 500

expect(received).toBeLessThan(expected)

Expected: < 500
Received:   500
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/portais/e2e-portais-acesso-fornece-303b3-terado-sem-efetivar-a-troca-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/portais/e2e-portais-acesso-fornece-303b3-terado-sem-efetivar-a-troca-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/portais/e2e-portais-acesso-fornece-303b3-terado-sem-efetivar-a-troca-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/portais/e2e-portais-acesso-fornece-303b3-terado-sem-efetivar-a-troca-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=992164 npx playwright test tests/e2e/portais/acesso-fornecedor.spec.js -g "CT-PFN-02-S2 deve recusar um token de redefinição expirado/adulterado sem efetivar a troca"`

---

### 66. deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir

- **Arquivo:** `e2e/portais/gerencia-compras.spec.js:31` · **Suíte:** Gerência de Compras · **Duração:** 47.4 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G11 — Plataforma — deep-link 404, erros de console, resíduo `teste`, Aba Atribuir, Clínica vazia, cache _Sync · **Referência:** Aba Atribuir
- **O que acontece:** A aba "Atribuir" da Gerência de Compras nunca lista SCs (1 linha = cabeçalho) em 30 s de poll; a aba "Transferir", com o mesmo mecanismo, lista dados reais.
- **Por que falha:** A grade de Atribuir não renderiza dados para esta conta; reclicar não resolve.
- **Onde falha:** `expect(linhas).toBeGreaterThan(1)` em `gerencia-compras.spec.js:58`. (local exato: `tests/e2e/portais/gerencia-compras.spec.js:58`)

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
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/portais/e2e-portais-gerencia-compr-c2071-ção-ao-abrir-a-aba-Atribuir-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/portais/e2e-portais-gerencia-compr-c2071-ção-ao-abrir-a-aba-Atribuir-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/portais/e2e-portais-gerencia-compr-c2071-ção-ao-abrir-a-aba-Atribuir-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/portais/e2e-portais-gerencia-compr-c2071-ção-ao-abrir-a-aba-Atribuir-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=99639 npx playwright test tests/e2e/portais/gerencia-compras.spec.js -g "deve listar as solicitações pendentes de atribuição ao abrir a aba Atribuir"`

---

### 67. CT-ADM-01-H — deveria abrir um formulário de admissão de novo funcionário

- **Arquivo:** `e2e/rh/admissao.spec.js:36` · **Suíte:** Automação Admissão · **Duração:** 15.1 s
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Causa raiz:** G9 — RH — Admissão abre o formulário errado, Banco de Horas sem integração, Substituição de Cargos oscila · **Referência:** CT-ADM-01-H
- **O que acontece:** Iniciar `wf_automacao_admissao` abre o formulário "Gestão de Benefícios - Plano de Saúde" (template de `rh_gbeneficios_planosaude`).
- **Por que falha:** Associação processo↔formulário incorreta na publicação do processo. CT-ADM-01-S1/S2 ficam inexequíveis por consequência.
- **Onde falha:** `expect(titulo).not.toBe("Gestão de Benefícios - Plano de Saúde")` em `admissao.spec.js:81`. (local exato: `tests/e2e/rh/admissao.spec.js:81`)

**Mensagem da falha:**

```
Error: defeito: o processo de Admissão (wf_automacao_admissao) abre o formulário de Plano de Saúde (mesmo template de rh_gbeneficios_planosaude) em vez de um formulário de admissão — associação processo↔formulário incorreta

expect(received).not.toBe(expected) // Object.is equality

Expected: not "Gestão de Benefícios - Plano de Saúde"
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/rh/e2e-rh-admissao-Automação--0f2fc-dmissão-de-novo-funcionário-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/rh/e2e-rh-admissao-Automação--0f2fc-dmissão-de-novo-funcionário-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/rh/e2e-rh-admissao-Automação--0f2fc-dmissão-de-novo-funcionário-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/rh/e2e-rh-admissao-Automação--0f2fc-dmissão-de-novo-funcionário-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=515384 npx playwright test tests/e2e/rh/admissao.spec.js -g "CT-ADM-01-H — deveria abrir um formulário de admissão de novo funcionário"`

---

### 68. CT-BH-01-S2 — autorizar horas acima do limite deve bloquear

- **Arquivo:** `e2e/rh/banco-horas-limite.spec.js:38` · **Suíte:** Portal de Autorização de Horas Extras — limite de autorização · **Duração:** 39.5 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G9 — RH — Admissão abre o formulário errado, Banco de Horas sem integração, Substituição de Cargos oscila · **Referência:** CT-BH-01-S2 / U-02
- **O que acontece:** A aba Autorização do Banco de Horas fica em "Aguarde, processando" por 30 s+ e nenhum campo aparece.
- **Por que falha:** Integração com o Protheus não configurada para o widget (mesma causa de U-02); o cenário "acima do limite" não é alcançável por esta rota.
- **Onde falha:** `expect(getByText("Aguarde, processando")).toBeHidden()` em `banco-horas-limite.spec.js:71`. (local exato: `tests/e2e/rh/banco-horas-limite.spec.js:71`)

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
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/rh/e2e-rh-banco-horas-limite--19579-ima-do-limite-deve-bloquear-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/rh/e2e-rh-banco-horas-limite--19579-ima-do-limite-deve-bloquear-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/rh/e2e-rh-banco-horas-limite--19579-ima-do-limite-deve-bloquear-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/rh/e2e-rh-banco-horas-limite--19579-ima-do-limite-deve-bloquear-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=792681 npx playwright test tests/e2e/rh/banco-horas-limite.spec.js -g "CT-BH-01-S2 — autorizar horas acima do limite deve bloquear"`

---

### 69. CT-BH-01-S1 — não deve alertar o usuário final com erro de configuração de servidor ao abrir o Banco de Horas

- **Arquivo:** `e2e/rh/banco-horas.spec.js:14` · **Suíte:** Portal de Autorização de Horas Extras · **Duração:** 6.4 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G9 — RH — Admissão abre o formulário errado, Banco de Horas sem integração, Substituição de Cargos oscila · **Referência:** CT-BH-01-S1 / U-02
- **O que acontece:** Ao abrir o Banco de Horas, um `alert()` nativo diz "Existem parâmetros não informado para esse servidor, informe o administrador".
- **Por que falha:** Erro de configuração de servidor exposto ao usuário final (capturado com `page.on("dialog")` registrado antes da navegação).
- **Onde falha:** `expect(dialogos).toEqual([])` em `banco-horas.spec.js:33`. (local exato: `tests/e2e/rh/banco-horas.spec.js:33`)

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
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/rh/e2e-rh-banco-horas-Portal--5f289-r-ao-abrir-o-Banco-de-Horas-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/rh/e2e-rh-banco-horas-Portal--5f289-r-ao-abrir-o-Banco-de-Horas-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/rh/e2e-rh-banco-horas-Portal--5f289-r-ao-abrir-o-Banco-de-Horas-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/rh/e2e-rh-banco-horas-Portal--5f289-r-ao-abrir-o-Banco-de-Horas-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=208814 npx playwright test tests/e2e/rh/banco-horas.spec.js -g "CT-BH-01-S1 — não deve alertar o usuário final com erro de configuração de servidor ao abrir o Banco de Horas"`

---

### 70. CT-SUB — bloqueia a identificação do solicitante antes de expor campos de substituto

- **Arquivo:** `e2e/rh/substituicao-cargos.spec.js:32` · **Suíte:** Substituição de Cargos · **Duração:** 54.4 s
- **Natureza:** Comportamento não determinístico do produto
- **Causa raiz:** G9 — RH — Admissão abre o formulário errado, Banco de Horas sem integração, Substituição de Cargos oscila · **Referência:** CT-SUB
- **O que acontece:** O formulário NÃO apresentou o bloqueio "Funcionário não localizado": 8 campos visíveis e utilizáveis. O teste esperava o bloqueio (a conta de automação não é funcionário ativo no Protheus).
- **Por que falha:** Não determinismo conhecido do produto (comentado em `SubstituicaoCargosPage`): com a mesma resposta do ERP, a tela ora bloqueia ora libera. Hoje liberou. Há dois comportamentos possíveis e o correto precisa ser definido pela Cassi.
- **Onde falha:** `SubstituicaoCargosPage.js:88` (`waitFor` de 45 s pelo texto de bloqueio). (local exato: `pages/SubstituicaoCargosPage.js:88`)

**Mensagem da falha:**

```
Error: o formulário NÃO apresentou o bloqueio de identificação do solicitante. Estado observado: SEM bloqueio algum, 8 campo(s) visível(is) e utilizável(is). Não-determinismo conhecido do produto (ver comentário em SubstituicaoCargosPage): com a MESMA resposta do ERP, a tela às vezes bloqueia e às vezes libera os campos. Erro original: locator.waitFor: Timeout 45000ms exceeded.
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/rh/e2e-rh-substituicao-cargos-9738d--expor-campos-de-substituto-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/rh/e2e-rh-substituicao-cargos-9738d--expor-campos-de-substituto-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/rh/e2e-rh-substituicao-cargos-9738d--expor-campos-de-substituto-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/rh/e2e-rh-substituicao-cargos-9738d--expor-campos-de-substituto-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=316257 npx playwright test tests/e2e/rh/substituicao-cargos.spec.js -g "CT-SUB — bloqueia a identificação do solicitante antes de expor campos de substituto"`

---

### 71. Clínica/Unidade deveriam identificar a clínica do diagnóstico e não nascer vazias

- **Arquivo:** `e2e/saude/questionario-clinicassi.spec.js:217` · **Suíte:** Questionário CliniCASSI — contexto da clínica (CT-CLI-02-S1, achado U-14) · **Duração:** 6.9 s
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Causa raiz:** G11 — Plataforma — deep-link 404, erros de console, resíduo `teste`, Aba Atribuir, Clínica vazia, cache _Sync · **Referência:** CT-CLI-02-S1 / U-14
- **O que acontece:** O campo "Clínica" do Questionário CliniCASSI nasce vazio em vez de identificar a clínica do diagnóstico.
- **Por que falha:** Sintoma compatível com o job `dsQDC000` parado (U-14); sem acesso admin a suíte só confirma o sintoma.
- **Onde falha:** `expect(clinica).not.toBe("")` em `questionario-clinicassi.spec.js:232`. (local exato: `tests/e2e/saude/questionario-clinicassi.spec.js:232`)

**Mensagem da falha:**

```
Error: o campo "Clínica" deveria vir preenchido com a clínica do diagnóstico — sintoma compatível com o achado U-14 (job dsQDC000 parado); sem acesso admin, a suíte não confirma a causa, só o sintoma

expect(received).not.toBe(expected) // Object.is equality

Expected: not ""
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/saude/e2e-saude-questionario-cli-06cf3-nóstico-e-não-nascer-vazias-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/saude/e2e-saude-questionario-cli-06cf3-nóstico-e-não-nascer-vazias-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/saude/e2e-saude-questionario-cli-06cf3-nóstico-e-não-nascer-vazias-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/saude/e2e-saude-questionario-cli-06cf3-nóstico-e-não-nascer-vazias-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=344394 npx playwright test tests/e2e/saude/questionario-clinicassi.spec.js -g "Clínica/Unidade deveriam identificar a clínica do diagnóstico e não nascer vazias"`

---

### 72. CT-SEG-02-S1: contas de integração/serviço não devem ter privilégio de administrador

- **Arquivo:** `e2e/seguranca/auditoria-datasets.spec.js:18` · **Suíte:** Segurança — auditoria de datasets sem acesso admin · **Duração:** 1.6 s
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Causa raiz:** G6 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos · **Referência:** CT-SEG-02-S1 / U-13
- **O que acontece:** 6 de 23 administradores da plataforma têm login/nome de conta de integração/serviço (`consumerkey`, `fluig_consumer`, `integr`…).
- **Por que falha:** Contas técnicas com privilégio de administrador — menor privilégio violado.
- **Onde falha:** `expect(tecnicasAdmin).toBe(0)` em `auditoria-datasets.spec.js:68`. (local exato: `tests/e2e/seguranca/auditoria-datasets.spec.js:68`)

**Mensagem da falha:**

```
Error: 6 de 23 administradores da plataforma têm login/nome compatível com conta de integração/serviço (padrões: consumerkey, consumer_key, fluig_consumer, integr). Contas técnicas não deveriam ter privilégio de administrador de plataforma — menor privilégio violado. Ver CT-SEG-02-S1 / achado U-13.

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 6
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-auditoria-da-ca1b7-privilégio-de-administrador-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-auditoria-da-ca1b7-privilégio-de-administrador-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-auditoria-da-ca1b7-privilégio-de-administrador-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-auditoria-da-ca1b7-privilégio-de-administrador-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=3281 npx playwright test tests/e2e/seguranca/auditoria-datasets.spec.js -g "CT-SEG-02-S1: contas de integração/serviço não devem ter privilégio de administrador"`

---

### 73. CT-SEG-03-S1: dataset de credencial de integração não deve ser legível por sessão sem privilégio admin

- **Arquivo:** `e2e/seguranca/auditoria-datasets.spec.js:71` · **Suíte:** Segurança — auditoria de datasets sem acesso admin · **Duração:** 0.7 s
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Causa raiz:** G6 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos · **Referência:** CT-SEG-03-S1 / U-03
- **O que acontece:** O dataset `ds_Fluig` ("Usuário e Senha usuario de integração") responde 200 (1 registro, 3 colunas) para a sessão não-admin.
- **Por que falha:** Dataset de credencial sem restrição de acesso; `/webdesk` nega (403) mas o dataset não.
- **Onde falha:** `expect(status).toBe(403)` em `auditoria-datasets.spec.js:100`. Evidência estrutural — o conteúdo nunca é lido. (local exato: `tests/e2e/seguranca/auditoria-datasets.spec.js:100`)

**Mensagem da falha:**

```
Error: dataset 'ds_Fluig' (descrito no ambiente como "Usuário e Senha usuario de integração") respondeu 200 para uma sessão sem privilégio administrativo — deveria negar acesso (403), como acontece em /webdesk (CT-SEG-05-S1). Evidência estrutural, nunca o conteúdo: 1 registro(s), 3 coluna(s) na resposta. Ver CT-SEG-03-S1 / achado U-03.

expect(received).toBe(expected) // Object.is equality

Expected: 403
Received: 200
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-auditoria-da-8427e-sessão-sem-privilégio-admin-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-auditoria-da-8427e-sessão-sem-privilégio-admin-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-auditoria-da-8427e-sessão-sem-privilégio-admin-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-auditoria-da-8427e-sessão-sem-privilégio-admin-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=134429 npx playwright test tests/e2e/seguranca/auditoria-datasets.spec.js -g "CT-SEG-03-S1: dataset de credencial de integração não deve ser legível por sessão sem privilégio admin"`

---

### 74. CT-SEG-04-S1: datasets de execução de SQL não devem ser alcançáveis por sessão sem privilégio admin

- **Arquivo:** `e2e/seguranca/auditoria-datasets.spec.js:103` · **Suíte:** Segurança — auditoria de datasets sem acesso admin · **Duração:** 1.0 s
- **Natureza:** Defeito de produto — achado desta execução (não catalogado)
- **Causa raiz:** G6 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos · **Referência:** CT-SEG-04-S1 / U-04
- **O que acontece:** `dsFluig_executeSql` (executor de SQL) responde 200 para a sessão não-admin.
- **Por que falha:** Executor de SQL alcançável sem privilégio elevado.
- **Onde falha:** `auditoria-datasets.spec.js:130`. (local exato: `tests/e2e/seguranca/auditoria-datasets.spec.js:130`)

**Mensagem da falha:**

```
Error: dataset 'dsFluig_executeSql' (executor de SQL, achado U-04) respondeu 200 para sessão sem perfil admin — deveria exigir privilégio elevado (403). Auditoria de injeção real está fora de escopo (ver comentário no topo do teste); esta assertion cobre só a alcançabilidade.

expect(received).toBe(expected) // Object.is equality

Expected: 403
Received: 200
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-auditoria-da-ef798-sessão-sem-privilégio-admin-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-auditoria-da-ef798-sessão-sem-privilégio-admin-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-auditoria-da-ef798-sessão-sem-privilégio-admin-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-auditoria-da-ef798-sessão-sem-privilégio-admin-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=523953 npx playwright test tests/e2e/seguranca/auditoria-datasets.spec.js -g "CT-SEG-04-S1: datasets de execução de SQL não devem ser alcançáveis por sessão sem privilégio admin"`

---

### 75. CT-SEG-07-S1 — não deve entregar o objeto de um processo em que o usuário não participa

- **Arquivo:** `e2e/seguranca/isolamento-horizontal-api-processos.spec.js:59` · **Suíte:** Segurança — isolamento horizontal na API v2 de processos (BOLA) · **Duração:** 4.8 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G6 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos · **Referência:** CT-SEG-07-S1 (BOLA)
- **O que acontece:** `TOTVS-FS` — que não é requisitante, responsável nem participante da instância 112009 de `bpm_recepcao_documentos_fiscais_compras`, processo que nem pode iniciar — recebe HTTP 200 com 44 `formFields` (razão social, CNPJ).
- **Por que falha:** Isolamento horizontal quebrado na API v2 de processos; `processInstanceId` sequencial permite enumerar a base.
- **Onde falha:** `isolamento-horizontal-api-processos.spec.js:177`. (local exato: `tests/e2e/seguranca/isolamento-horizontal-api-processos.spec.js:177`)

**Mensagem da falha:**

```
Error: BOLA / isolamento horizontal violado: a conta 'TOTVS-FS' (que NÃO é requisitante, responsável nem participante — 8 tarefa(s) da instância inspecionadas, nenhuma sua) leu o objeto da instância 112009 do processo 'bpm_recepcao_documentos_fiscais_compras' — um processo que esta conta nem sequer pode INICIAR. Esperado: 403/404, ou 200 com formFields:null. Obtido: HTTP 200 com 44 formField(s) do formulário completo (que inclui razão social e CNPJ do fornecedor). A ausência de 403 aqui significa que qualquer sessão autenticada enumera a base inteira de documentos fiscais pelo processInstanceId sequencial. Vermelho intencional — ver CT-SEG-07-S1.

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-isolamento-h-b78d0-que-o-usuário-não-participa-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-isolamento-h-b78d0-que-o-usuário-não-participa-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-isolamento-h-b78d0-que-o-usuário-não-participa-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-isolamento-h-b78d0-que-o-usuário-não-participa-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=992985 npx playwright test tests/e2e/seguranca/isolamento-horizontal-api-processos.spec.js -g "CT-SEG-07-S1 — não deve entregar o objeto de um processo em que o usuário não participa"`

---

### 76. não deve enviar dados de navegação para o Google Analytics

- **Arquivo:** `e2e/seguranca/lgpd-envio-google-analytics.spec.js:22` · **Suíte:** LGPD — telemetria enviada a serviço externo · **Duração:** 15.2 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G6 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos · **Referência:** U-11
- **O que acontece:** 2 requisições de navegação para `google-analytics.com` (medição `G-F0FT6D1NQG`) numa carga.
- **Por que falha:** Telemetria externa ativa; a pergunta aberta nº 3 do README pede posição da Privacidade/LGPD.
- **Onde falha:** `expect(envios).toBe(0)` em `lgpd-envio-google-analytics.spec.js:45`. (local exato: `tests/e2e/seguranca/lgpd-envio-google-analytics.spec.js:45`)

**Mensagem da falha:**

```
Error: 2 requisição(ões) de navegação enviada(s) a google-analytics.com (medição G-F0FT6D1NQG). Ver achado U-11 / mapa-do-ambiente.md.

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 2
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-lgpd-envio-g-8024f-ção-para-o-Google-Analytics-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-lgpd-envio-g-8024f-ção-para-o-Google-Analytics-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-lgpd-envio-g-8024f-ção-para-o-Google-Analytics-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-lgpd-envio-g-8024f-ção-para-o-Google-Analytics-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=885294 npx playwright test tests/e2e/seguranca/lgpd-envio-google-analytics.spec.js -g "não deve enviar dados de navegação para o Google Analytics"`

---

### 77. CT-SEG-08-S1 — "bpm_addUserFluig" (Adicionar Usuário) não deve constar do catálogo nem abrir para conta não-admin

- **Arquivo:** `e2e/seguranca/processos-administrativos-usuario-comum.spec.js:39` · **Suíte:** Segurança — processos administrativos não devem abrir para usuário comum · **Duração:** 8.7 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G6 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos · **Referência:** CT-SEG-08-S1
- **O que acontece:** `bpm_addUserFluig` (Adicionar Usuário) consta do catálogo `onlyCanStart` da conta não-admin e abre o formulário de início.
- **Por que falha:** Processo de criação de usuário/grupo iniciável por perfil de Compras — segregação de função violada.
- **Onde falha:** `processos-administrativos-usuario-comum.spec.js:88`. (local exato: `tests/e2e/seguranca/processos-administrativos-usuario-comum.spec.js:88`)

**Mensagem da falha:**

```
Error: o processo administrativo 'bpm_addUserFluig' consta do catálogo de início desta conta não-admin. Um processo de criação de usuário/grupo na plataforma não deveria ser iniciável por um perfil de Compras — segregação de função violada. Ver CT-SEG-08-S1.

expect(received).not.toContain(expected) // indexOf

Expected value: not "bpm_addUserFluig"
Received array:     ["bpm_addUserGroup", "bpm_addUserFluig", "teste", "wf_cadastro_fornecedor", "wf_cotacao_produtos_servicos", "wf_negociacao_cotacao_prod_serv", "wf_solicitacao_compras", "wf_solicitacao_compras_parecer", "wf_SubstituiçãoCargosFluig", "wf_delegacaoFiscalContratoServico", "wf_faturamento_contratos", "bpm_financeiro_rejeicoes_bancarias", "prc_questionario_v2", "GestaoDependentes", "rh_gbeneficios_planosaude", "wf_automacao_admissao", "wf_pagamento_horas_extras", "wf_substituicaocargos", "FLUIGADHOC", "SIGAJURI_AprovaFU", "SIGAJURI_Consultivo", "SIGAJURI_Contencioso", "SIGAJURI_Contrato"]
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-processos-ad-01f4b--abrir-para-conta-não-admin-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-processos-ad-01f4b--abrir-para-conta-não-admin-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-processos-ad-01f4b--abrir-para-conta-não-admin-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-processos-ad-01f4b--abrir-para-conta-não-admin-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=879765 npx playwright test tests/e2e/seguranca/processos-administrativos-usuario-comum.spec.js -g "CT-SEG-08-S1 — \"bpm_addUserFluig\" (Adicionar Usuário) não deve constar do catálogo nem abrir para conta não-admin"`

---

### 78. CT-SEG-08-S1 — "bpm_addUserGroup" (Adicionar Grupo) não deve constar do catálogo nem abrir para conta não-admin

- **Arquivo:** `e2e/seguranca/processos-administrativos-usuario-comum.spec.js:39` · **Suíte:** Segurança — processos administrativos não devem abrir para usuário comum · **Duração:** 7.7 s
- **Natureza:** Defeito de produto — já catalogado no README
- **Causa raiz:** G6 — Segurança — privilégio, isolamento horizontal, datasets sensíveis, telemetria e processos administrativos · **Referência:** CT-SEG-08-S1
- **O que acontece:** `bpm_addUserGroup` (Adicionar Grupo) consta do catálogo `onlyCanStart` da conta não-admin e abre o formulário de início.
- **Por que falha:** Processo de criação de usuário/grupo iniciável por perfil de Compras — segregação de função violada.
- **Onde falha:** `processos-administrativos-usuario-comum.spec.js:88`. (local exato: `tests/e2e/seguranca/processos-administrativos-usuario-comum.spec.js:88`)

**Mensagem da falha:**

```
Error: o processo administrativo 'bpm_addUserGroup' consta do catálogo de início desta conta não-admin. Um processo de criação de usuário/grupo na plataforma não deveria ser iniciável por um perfil de Compras — segregação de função violada. Ver CT-SEG-08-S1.

expect(received).not.toContain(expected) // indexOf

Expected value: not "bpm_addUserGroup"
Received array:     ["bpm_addUserGroup", "bpm_addUserFluig", "teste", "wf_cadastro_fornecedor", "wf_cotacao_produtos_servicos", "wf_negociacao_cotacao_prod_serv", "wf_solicitacao_compras", "wf_solicitacao_compras_parecer", "wf_SubstituiçãoCargosFluig", "wf_delegacaoFiscalContratoServico", "wf_faturamento_contratos", "bpm_financeiro_rejeicoes_bancarias", "prc_questionario_v2", "GestaoDependentes", "rh_gbeneficios_planosaude", "wf_automacao_admissao", "wf_pagamento_horas_extras", "wf_substituicaocargos", "FLUIGADHOC", "SIGAJURI_AprovaFU", "SIGAJURI_Consultivo", "SIGAJURI_Contencioso", "SIGAJURI_Contrato"]
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-processos-ad-fe359--abrir-para-conta-não-admin-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-processos-ad-fe359--abrir-para-conta-não-admin-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-processos-ad-fe359--abrir-para-conta-não-admin-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/seguranca/e2e-seguranca-processos-ad-fe359--abrir-para-conta-não-admin-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=413213 npx playwright test tests/e2e/seguranca/processos-administrativos-usuario-comum.spec.js -g "CT-SEG-08-S1 — \"bpm_addUserGroup\" (Adicionar Grupo) não deve constar do catálogo nem abrir para conta não-admin"`

---

### 79. CT-TSK-07-H @destrutivo — "Somente salvar" deve persistir o rascunho sem movimentar a atividade

- **Arquivo:** `e2e/tarefas/acoes-da-tarefa.spec.js:184` · **Suíte:** Ações da tarefa — Somente salvar e Transferir (CT-TSK-07/08) · **Duração:** 225.4 s · **Tags:** destrutivo
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Causa raiz:** G12 — BPMN lento — a SC não sai de "Grava SC e Anexos" dentro dos 180 s do orçamento de espera · **Referência:** PRÉ-CONDIÇÃO AUSENTE
- **O que acontece:** A SC #113163, criada pelo próprio teste, não apareceu com "Assumir tarefa" na Validação do Gestor em 180 s; a atividade atual ainda era "Grava SC e Anexos". O teste aborta antes de exercitar "Somente salvar".
- **Por que falha:** Latência do BPMN acima do orçamento (referência de campo: ~76 s). Reexecutado isolado (15h35–15h40) com o mesmo resultado (SCs 113187–113191). O mesmo caminho em `portais/*.spec.js` (helper `aprovarValidacaoDoGestor`, espera de 150 s) chegou à Validação do Gestor em 5 testes entre 15h16 e 15h20 — o fluxo funciona; a latência oscila.
- **Onde falha:** Poll `toPass({ timeout: 180_000 })` por `botaoAssumirTarefaAtual()` — `aprovacoes-solicitacao-compras.spec.js:281` / `acoes-da-tarefa.spec.js:83`. (local exato: `tests/e2e/tarefas/acoes-da-tarefa.spec.js:86`)

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: a SC #113163, criada por este teste, não ficou assumível ("Assumir tarefa") em Validação do Gestor Imediato dentro de 180s. Isto NÃO é defeito da ação sob teste (Somente salvar / Transferir) — pode ser lentidão do BPMN acima do observado em campo (~76s), ou a tarefa ter sido assumida por outra execução concorrente que pega a primeira do pool (tests/e2e/tarefas/assumir-tarefa-pool.spec.js). Atividade atual observada: "Grava SC e Anexos". Causa do polling: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Assumir tarefa' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/tarefas/e2e-tarefas-acoes-da-taref-4de7b--sem-movimentar-a-atividade-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/tarefas/e2e-tarefas-acoes-da-taref-4de7b--sem-movimentar-a-atividade-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/tarefas/e2e-tarefas-acoes-da-taref-4de7b--sem-movimentar-a-atividade-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/tarefas/e2e-tarefas-acoes-da-taref-4de7b--sem-movimentar-a-atividade-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=15227 npx playwright test tests/e2e/tarefas/acoes-da-tarefa.spec.js -g "CT-TSK-07-H @destrutivo — \"Somente salvar\" deve persistir o rascunho sem movimentar a atividade"`

---

### 80. CT-TSK-08-H @destrutivo — transferir deve trocar o responsável mantendo a mesma atividade

- **Arquivo:** `e2e/tarefas/acoes-da-tarefa.spec.js:297` · **Suíte:** Ações da tarefa — Somente salvar e Transferir (CT-TSK-07/08) · **Duração:** 220.1 s · **Tags:** destrutivo
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Causa raiz:** G12 — BPMN lento — a SC não sai de "Grava SC e Anexos" dentro dos 180 s do orçamento de espera · **Referência:** PRÉ-CONDIÇÃO AUSENTE
- **O que acontece:** A SC #113162, criada pelo próprio teste, não apareceu com "Assumir tarefa" na Validação do Gestor em 180 s; a atividade atual ainda era "Grava SC e Anexos". O teste aborta antes de exercitar Transferir.
- **Por que falha:** Latência do BPMN acima do orçamento (referência de campo: ~76 s). Reexecutado isolado (15h35–15h40) com o mesmo resultado (SCs 113187–113191). O mesmo caminho em `portais/*.spec.js` (helper `aprovarValidacaoDoGestor`, espera de 150 s) chegou à Validação do Gestor em 5 testes entre 15h16 e 15h20 — o fluxo funciona; a latência oscila.
- **Onde falha:** Poll `toPass({ timeout: 180_000 })` por `botaoAssumirTarefaAtual()` — `aprovacoes-solicitacao-compras.spec.js:281` / `acoes-da-tarefa.spec.js:83`. (local exato: `tests/e2e/tarefas/acoes-da-tarefa.spec.js:86`)

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: a SC #113162, criada por este teste, não ficou assumível ("Assumir tarefa") em Validação do Gestor Imediato dentro de 180s. Isto NÃO é defeito da ação sob teste (Somente salvar / Transferir) — pode ser lentidão do BPMN acima do observado em campo (~76s), ou a tarefa ter sido assumida por outra execução concorrente que pega a primeira do pool (tests/e2e/tarefas/assumir-tarefa-pool.spec.js). Atividade atual observada: "Grava SC e Anexos". Causa do polling: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Assumir tarefa' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/tarefas/e2e-tarefas-acoes-da-taref-63925--mantendo-a-mesma-atividade-e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/tarefas/e2e-tarefas-acoes-da-taref-63925--mantendo-a-mesma-atividade-e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/tarefas/e2e-tarefas-acoes-da-taref-63925--mantendo-a-mesma-atividade-e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/tarefas/e2e-tarefas-acoes-da-taref-63925--mantendo-a-mesma-atividade-e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=819977 npx playwright test tests/e2e/tarefas/acoes-da-tarefa.spec.js -g "CT-TSK-08-H @destrutivo — transferir deve trocar o responsável mantendo a mesma atividade"`

---

### 81. assumir a primeira tarefa disponível de um grupo do pool deve movê-la para "Tarefas a concluir"

- **Arquivo:** `e2e/tarefas/assumir-tarefa-pool.spec.js:34` · **Suíte:** Central de Tarefas — assumir tarefa do pool (CT-TSK-02-H) @destrutivo · **Duração:** 9.7 s · **Tags:** destrutivo
- **Natureza:** Pré-condição ausente (ambiente / massa / latência)
- **Causa raiz:** G13 — Filas vazias — nada para operar em Cotação, Negociação e pool de tarefas · **Referência:** CT-TSK-02-H
- **O que acontece:** O Resumo de Tarefas anunciava "Tarefas em pool (0)" — nada para assumir.
- **Por que falha:** Sem massa nos pools "Validação do Gestor Imediato" e "Validação dos Compradores" no instante do teste (as SCs dos testes de ciclo ainda não tinham chegado lá — G12). Reexecutado isolado às 15h35: mesmo resultado.
- **Onde falha:** `assumir-tarefa-pool.spec.js:46`. (local exato: `tests/e2e/tarefas/assumir-tarefa-pool.spec.js:46`)

**Mensagem da falha:**

```
Error: PRÉ-CONDIÇÃO AUSENTE: o Resumo de Tarefas anuncia "Tarefas em pool (0)" no momento da execução. Não há tarefa de pool disponível para assumir agora — isto NÃO é defeito do produto sob teste. Reexecute quando houver massa (o usuário TOTVS-FS pertence aos pools "Validação do Gestor Imediato" e "Validação dos Compradores").
```

**Evidências:**
- screenshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/tarefas/e2e-tarefas-assumir-tarefa-538fe-la-para-Tarefas-a-concluir--e2e/test-failed-1.png`
- trace: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/tarefas/e2e-tarefas-assumir-tarefa-538fe-la-para-Tarefas-a-concluir--e2e/trace.zip`
- vídeo: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/tarefas/e2e-tarefas-assumir-tarefa-538fe-la-para-Tarefas-a-concluir--e2e/video.webm`
- aria-snapshot: `/home/dev1/emdash/worktrees/teste-esbo-o-do-projeto-a4e20f05/emdash-teste-2-jxzxn/test-results/tarefas/e2e-tarefas-assumir-tarefa-538fe-la-para-Tarefas-a-concluir--e2e/error-context.md`

**Reproduzir:** `FAKER_SEED=585433 npx playwright test tests/e2e/tarefas/assumir-tarefa-pool.spec.js -g "assumir a primeira tarefa disponível de um grupo do pool deve movê-la para \"Tarefas a concluir\""`

