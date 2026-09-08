# Consultas e Logs — comparação chamados × suíte Playwright

15 casos (FSWTBC) confrontados com `tests/e2e/portais/tracker-compras.spec.js`, `tests/e2e/portais/ciclo-comprador.spec.js`, `tests/e2e/portais/alcadas-orcamentaria.spec.js`, `tests/e2e/compras/validacoes-solicitacao-compras.spec.js`, `tests/e2e/compras/ciclo-solicitacao-compras.spec.js`, `tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js`, `tests/e2e/seguranca/*`, `tests/api/*` e os helpers (`TrackerComprasPage`, `CicloCompradorPage`, `captura-payload.js`). Medido em 08/09/2026.

## Leitura geral

- **Zero COBERTO.** O módulo gira em torno de duas superfícies que a suíte nunca toca: o widget **Logs Protheus** (`/portal/p/1/portal_logs_protheus`, abas Erros CV8 / Solicitacoes ZZY / Medicoes ZZZ — nenhum spec, nenhum Page Object) e as **visões do Tracker além de "Solicitação de Compras"** (`Produtos/Rateio SC`, `Aprovadores SC`, `Faturamento de Contratos`).
- O `genericQuery` das abas responde **404 hoje** (ambiente). Um spec de Logs Protheus deve nascer separando as duas afirmações: *consulta respondeu?* (falha → `faltaPreCondicao`) e *o widget reagiu à falha?* — hoje fica preso em "Consultando logs..." com toasts acumulados (A11-b), o que é defeito reprodutível interceptando o `genericQuery` mesmo com o ambiente fora.
- **Cinco APRIMORAR** concentram-se em dois arquivos de Compras que já preenchem o formulário clássico e já esperam a integração, mas não afirmam o que os chamados pedem: rateio por linha / linha vazia / >100% (3031, 3443), painel orçamentário e falha silenciosa do gestor orçamentário (3488), latência da fila ≤ 2 min (4156, 4828) e rateio 60/40 até o Tracker (4941).
- **A suíte reclassifica lentidão como ambiente**: `CT-ACC-09-H` e `aprovarValidacaoDoGestor` esperam até 150–180 s e chamam `faltaPreCondicao` acima disso; os chamados 4156/4828 fixam **≤ 2 min** como SLA — 3 min 12 s medidos em 04/09 é defeito, não pré-condição.
- **IMPLEMENTAR por bloqueio** (comprador/aprovador/PCO/Protheus): 1503, 4854, 5197, 4456, 3590, 4358. A fatia viável é consultiva via API sobre instâncias orgânicas (SC em 317 com retorno preenchido; nenhuma SC presa em 328/323 há mais de 1 h; cadeia 94→287→…→185 nas finalizadas).
- **4263 é leitura pura sem bloqueio** e ainda rende achado: o estado final 319 chama-se "Fim - Verificar Trava Orçamentária".


## Contagem por status

| Status | Casos |
|---|---|
| COBERTO | 0 |
| APRIMORAR | 6 |
| IMPLEMENTAR | 9 |

## APRIMORAR — o que acrescentar, por arquivo (6 casos)

### `tests/e2e/compras/validacoes-solicitacao-compras.spec.js` — 2 caso(s)

- **FSWTBC-3031** (SEV Alta) — Tentar enviar uma SC cujo item tenha rateio somando menos de 100% e confirmar que o Fluig barra na origem, sem deixar a crítica para o ERP.
  - teste que toca: `tests/e2e/compras/validacoes-solicitacao-compras.spec.js :: CT-CMP-02-S2 — deve bloquear o envio quando o rateio do item soma menos de 100% (afirma a mensagem literal 'não podem ser inferior a 100%', 'item 0001', '(90%)' e guarda.tentativas()==0)`
  - acrescentar: A soma < 100% está coberta com a mensagem exata. Faltam três resultados do chamado: (1) linha de rateio EM BRANCO ao lado de linhas somando 100 → Enviar deve bloquear com 'Existem campos de rateio sem preenchimento!' (o fonte pula campo vazio com guarda truthy em handleValidRateio — provável @bug; ciclo-correcao-reenvio já viu essa mensagem no reenvio); (2) soma > 100% → o teste hoje documenta que 110 é ajustado para 100 no blur, mas o chamado espera a mensagem 'não podem ultrapassar o limite de 100%' — preencher via setter nativo (preencherCampoMascarado) duas linhas 60+50 para provocar a soma sem passar pelo clamp; (3) auditoria consultiva no Tracker, visão Produtos/Rateio SC por Nº do Processo Fluig: soma de Rateio % por Item == 100 (tracker-compras.spec.js, leitura).
- **FSWTBC-3443** (SEV Alta) — Conferir que nenhuma SC sai do Fluig com percentual de rateio negativo ou acima de 100% em qualquer linha, mesmo que a soma do item feche em 100%.
  - teste que toca: `tests/e2e/compras/validacoes-solicitacao-compras.spec.js :: CT-CMP-02-S2 (comentário registra que valor > 100 é clampado no blur; nada afirma sobre negativo, nem sobre a combinação 500/-400)`
  - acrescentar: Acrescentar: (1) duas linhas de rateio com 500 e -400 (a máscara Z##9V### aceita o sinal; o clamp de negativo no blur é código morto) → Enviar deve BLOQUEAR mesmo somando 100 — hoje handleValidRateio só acumula a soma, então este teste nasce @bug; (2) importação por CSV (fixtures/anexos/ já tem qa-planilha-rateio-invalida.xlsx — criar uma válida com -400/500) via botaoUploadPlanilhaRateio → o valor cru gravado sem blur deve ser rejeitado no Enviar (@bug provável); (3) auditoria consultiva no Tracker Produtos/Rateio SC sobre massa orgânica: nenhuma célula Rateio % < 0 ou > 100 e soma por Item == 100 (tracker-compras.spec.js, leitura, botão Excel presente). Efeitos MSGETDAD/PCO/P002 são Protheus, sem superfície.

### `tests/e2e/compras/ciclo-solicitacao-compras.spec.js` — 2 caso(s)

- **FSWTBC-4156** (SEV Alta) — Medir, pelo Fluig, a latência da fila de Compras entre a gravação e o retorno do Protheus, e confirmar que dois processos de filiais diferentes não se bloqueiam.
  - teste que toca: `tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: CT-ACC-09-H @destrutivo (aguardarAtividadeAtual('Validação do Gestor', 180s) e reclassifica >180s como PRÉ-CONDIÇÃO 'ambiente'); tests/e2e/portais/alcadas-orcamentaria.spec.js (mesma espera, 150s em aprovarValidacaoDoGestor)`
  - acrescentar: A suíte ESPERA a integração mas nunca afirma latência — e trata >180 s como ambiente, quando o chamado fixa SLA ≤ 2 min (limite aceito no 3749). Acrescentar: ler /requests/{id}/tasks e calcular o intervalo entre a conclusão de 'Compra Centralizada?' e a conclusão de 'Grava SC e Anexos' (ou entre o start e a tarefa 7 NOT_COMPLETED) e afirmar ≤ 120 s — medido 3 min 12 s em 04/09, logo nasce @bug; criar DUAS SCs em filiais diferentes (hoje só FILIAL_PADRAO '5303 - CASSI SEDE' na factory) e afirmar que a segunda não espera a primeira (intervalos sobrepostos). A leitura de Qtd T.Env Fl na ZZY fica para o spec de Logs Protheus (404 hoje).
- **FSWTBC-4941** (SEV Alta) — Informar rateio de centro de custo na SC e confirmar que ele chega íntegro ao Tracker e à SC do ERP
  - teste que toca: `tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: @destrutivo deve criar e enviar a Solicitação de Compras (um centro de custo, rateio 100%); tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js :: as linhas de rateio devem trazer percentual, centro de custo e classe de valor preenchidos, somando 100% (rateio herdado do contrato, não informado)`
  - acrescentar: Nenhum teste informa rateio em DOIS centros de custo nem lê a visão Produtos/Rateio SC do Tracker. Acrescentar em ciclo-solicitacao-compras: adicionarCentroCusto() duas vezes, preencherRateio 60 e 40 (selecionarNoZoomDoRateio para CC/Classe de cada linha); capturar o corpo do POST /ecm/api/rest/ecm/workflowView/send (o formulário clássico NÃO usa process-management — captura-payload.js não o vê; escutar page.on('request')) e afirmar duas linhas tbRatCC_Rateio___1_1=60 e ___1_2=40; depois de enviar, Tracker → Produtos/Rateio SC → Nº do Processo Fluig: exatamente duas linhas para o item, Rateio % 60 e 40, C. Custo e Classe Valor preenchidos (dataset dsFluig_produtosSC_Sql_CASSI). Passo 5 (SCH do pedido) é Protheus, sem superfície.

### `tests/e2e/portais/alcadas-orcamentaria.spec.js` — 1 caso(s)

- **FSWTBC-3488** (SEV Alta) — Criar SC cujo gestor orçamentário esteja afastado com substituto cadastrado e confirmar que a validação orçamentária é encaminhada ao substituto.
  - teste que toca: `tests/e2e/portais/alcadas-orcamentaria.spec.js :: @destrutivo CT-E2E-03-H — SC própria aprovada na Validação do Gestor para em Validação Orçamentária (só afirma toHaveCount(0) de 'Assumir tarefa'); CT-E2E-03-S1 (texto de consenso)`
  - acrescentar: O encaminhamento ao SUBSTITUTO exige gestor orçamentário afastado com substituição vigente (cadastro Protheus AK6_XGESTO + Fluig) — bloqueio real de massa. O que dá para afirmar já: (a) ao chegar em Validação Orçamentária, ler formFields via API (helper lerEstado de ciclo-correcao-reenvio) e afirmar que o painel Validação do Item Orçamentário foi montado: tbitorc_totalEstimado___N, Aprovador e Email do Aprovador preenchidos, itensSemGestOrcament vazio; (b) novo teste no formulário clássico derrubando dsProtheus_getGestorOrcamentario_restGet (datasetZoom/search — interceptação própria, como CT-CMP-03-S1) e afirmando aviso visível ao usuário — hoje o fonte só faz console.error em três camadas e a SC segue sem aprovador → nasce @bug; (c) Tracker visão Aprovadores SC por nº do processo: coluna Aprovador Item Orçamentário coerente (vazia antes da etapa).

### `tests/e2e/portais/ciclo-comprador.spec.js` — 1 caso(s)

- **FSWTBC-4828** (SEV Alta) — Verificar que uma SC enviada avança das atividades automáticas de espera sem intervenção manual (fila de Compras consumida)
  - teste que toca: `tests/e2e/portais/ciclo-comprador.spec.js :: @destrutivo CT-E2E-11-H — o Tracker localiza a SC própria pelo Nº do Processo Fluig (afirma só toContainText(numeroProcesso) e o diálogo 'Rastro do Processo'); tests/e2e/portais/alcadas-orcamentaria.spec.js :: CT-E2E-04-H (Histórico com 'Compra Centralizada?' e 'Grava SC e Anexos' visíveis)`
  - acrescentar: O avanço automático até Validação do Gestor é exercitado, mas nada é afirmado sobre o que o chamado pede: (1) no Tracker, ler as colunas Atividade Atual (≠ 'Correção'), Responsável Atual (humano/pool, não admin) e Nº da Solicitação ERP (6 dígitos) — TrackerComprasPage precisa de leitura de colunas; (2) no Histórico, o texto 'Integração executada com sucesso - Tempo de Execução N s' na atividade 233 e latência ≤ 2 min (ver FSWTBC-4156); (3) via API, formField numSolCompra != '' após a 233. As esperas 328/309/323 exigem comprador — bloqueio real.

## IMPLEMENTAR — onde deveria nascer (9 casos)

### `tests/e2e/consultas/logs-protheus.spec.js (novo)` — 3 caso(s)

- **FSWTBC-2755** (SEV Alta — mesma consequência da FSWTBC-2635: medição não criada é faturamento perdido.) — A criação em lote das solicitações de medição automática conclui dentro do tempo e cada
  - motivo/desenho: Nenhum teste abre /portal/p/1/portal_logs_protheus. Nasceria em um spec do widget: aba Solicitacoes ZZY, Status=Todos, Data inicial/final ISO (input type=date), Consultar; afirmar rodapé 'Total encontrado: N registro(s).' ou 'Nenhum registro encontrado.' (nunca 'Consultando logs...' preso — A11-b), Status=P cai a zero na janela, Qtd T.Env Fl <= 3 em toda linha, Json Retorno/Msg Ret Flui preenchidos nas concluídas. genericQuery responde 404 hoje: o teste deve reprovar como ambiente (faltaPreCondicao) só se a consulta não responder, e como DEFEITO se responder e o rodapé ficar em 'Consultando logs...'. Achado do fonte a virar @bug: botões page-prev/page-next são stubs — com >pageSize registros a paginação não avança.
- **FSWTBC-3590** (SEV Alta *(pagamento não integrado com resposta de sucesso; risco de duplicidade no reenvio)*) — Integrar documentos de pagamento e localizá-los no Protheus na primeira tentativa, com o retorno da integração identificando a thread
  - motivo/desenho: Integração de documentos de pagamento é originada pela integração web da CASSI e conferida no Protheus — sem superfície de escrita no Fluig e sem credencial. A única fatia Fluig é a aba Erros CV8 do widget Logs Protheus (404 hoje), e nenhum teste a abre. Nasceria no spec de Logs Protheus como smoke consultivo: Erros CV8 com Data inicial/final e filtro 'Mensagem, detalhe ou processo' → grade responde (nunca presa em 'Consultando logs...'); JSON válido/thread e duplicidade de reenvio ficam fora do alcance.
- **FSWTBC-4358** (SEV Média *(observabilidade da fila; o efeito é diagnóstico errado e processo parado)*) — Acompanhar na aba "Solicitacoes ZZY" um item de fila com payload inválido e vê-lo marcado como Erro com mensagem — nunca parado em "Não processado" sem explicação.
  - motivo/desenho: Item de fila com payload inválido só o Protheus produz, e a superfície (Solicitacoes ZZY) está 404. Nenhum teste abre o widget. Fatia executável quando a fila voltar: Logs Protheus → ZZY, Id Fluig = nº de uma SC própria criada por ciclo-correcao-reenvio (start corrigido) → registro sai de 'Não processado' em minutos, Qtd T.Env Fl = 1, Histórico com 'Integração executada com sucesso'. Enquanto isso, o spec deve provar que o widget distingue 'consulta falhou' de 'vazio' (hoje não — A11-b, @bug com genericQuery interceptado em 500).

### `tests/e2e/portais/tracker-compras.spec.js` — 2 caso(s)

- **FSWTBC-2943** (SEV Alta — medição automática alimenta pagamento e contabilização de contratos.) — Acompanhar as solicitações de Faturamento de Contratos abertas pela medição automática e conferir que os dados da medição chegam íntegros ao ERP (Logs Protheus → Medicoes ZZZ)
  - motivo/desenho: Nenhum teste usa a visão Faturamento de Contratos do Tracker nem a aba Medicoes ZZZ. Fatia executável hoje (Tracker responde, 241 FC de setembro abertas por consumerkeycompras): TrackerComprasPage precisa de filtrarPor('Faturamento de Contratos'), Solicitante='Usuário Integrador'/consumerkeycompras, Data da Solicitação De/Até=hoje (ids dataSolicitacaoDeFC/AteFC, ISO) e leitura das colunas Nº Contrato / Atividade Atual / Competência; afirmar: uma linha por Nº Contrato (sem duplicata), Atividade Atual ∉ {Correção, Aguarda processamento Fila Protheus} para FC de hoje, Competência = mês corrente. A conferência ZZZ (Qtd T.Env Fl = 1, Msg Medicao sem erro) fica no spec de Logs Protheus e falha como ambiente enquanto o genericQuery estiver 404.
- **FSWTBC-4456** (SEV Média *(trava o fluxo de compras na origem; sem perda de dado)*) — Ver uma SC validada pelo comprador sair de "Aguarda Geração da Cotação" em minutos, com o Nº da Cotação ERP preenchido.
  - motivo/desenho: Nenhum teste observa a atividade 328 'Aguarda Geração da Cotação'. ciclo-comprador CT-E2E-07-H afirma 'Nenhum dado encontrado' no Controle de Cotações (polaridade invertida: documenta que nenhuma SC chega à cotação). Sem comprador a suíte não leva SC até a 119/328. Fatia consultiva possível hoje: varrer SCs abertas via API e afirmar que nenhuma tem tarefa NOT_COMPLETED na seq 328 há mais de 1 h (comparar task.startDate com agora) e que toda SC que já saiu da 328 tem formField numCotacao preenchido; no Tracker SC/Abertos, linhas com Atividade Atual = 'Aguarda Geração da Cotação' devem ser zero ou recentes. Distinguir da 'Aguarda Finalizar Cotação' (161), que é espera humana.

### `tests/api/retorno-integracao-sc.spec.js (novo)` — 1 caso(s)

- **FSWTBC-1503** (SEV Alta *(controle orçamentário)*) — Enviar uma SC à Validação Orçamentária e confirmar que a trava orçamentária do Protheus (PCO) responde e a SC sai de "Verificar retorno Protheus" com o retorno preenchido
  - motivo/desenho: Trava orçamentária do PCO e a SC em 'Verificar retorno Protheus' (317) com Retorno Integração preenchido. A suíte para em Validação Orçamentária (alcadas-orcamentaria.spec.js: só afirma ausência de 'Assumir tarefa' e o texto de consenso) — a aprovação orçamentária é do gestor AL/DHL e o PCO é Protheus. Fatia automatizável hoje, só leitura: varrer /process-management/api/v2/requests?processId=wf_solicitacao_compras (técnica de isolamento-horizontal-api-processos.spec.js) e, para toda SC com tarefa NOT_COMPLETED na seq 317, ler formFields (?expand=formFields) e afirmar buyerRetIntTreat/anLockBudgRetIntErr != '' (A15-b: nunca 317 com Retorno vazio) e responsável != admin. A SC 112855 é massa viva.

### `tests/api/nomes-de-atividades-sc.spec.js (novo)` — 1 caso(s)

- **FSWTBC-4263** (SEV Baixa — apresentação; reduz erro de diagnóstico.) — A etapa que espera o retorno do ERP após a geração do pedido/contrato aparece no histórico como "Verificar retorno Protheus"
  - motivo/desenho: Nenhum teste lê nomes de atividade da SC. Caso de leitura pura, sem bloqueio: varrer /process-management/api/v2/requests?processId=wf_solicitacao_compras&pageSize=100 (page=0 é a base inteira — armadilha já paga) e /requests/{id}/tasks, afirmar que toda tarefa com state.sequence 317 tem stateName 'Verificar retorno Protheus' e que nenhuma tarefa de instância nova (v98) tem stateName contendo 'Verificar Trava Orçamentária'. Atenção: o estado final 319 chama-se 'Fim - Verificar Trava Orçamentária' (SC 112441 FINALIZED em 27/08) — o teste vai reprovar aí, e é achado a levar ao time. Tracker (coluna Atividade Atual) confere a segunda superfície.

### `tests/api/cadeia-pos-alcada-sc.spec.js (novo)` — 1 caso(s)

- **FSWTBC-4854** (SEV Alta) — Aprovar a alçada de uma SC e confirmar que a integração pós-alçada conclui e dispara os e-mails
  - motivo/desenho: Aprovação de Alçadas (94) exige aprovador nominal — a conta não chega lá (alcadas-orcamentaria prova a parada em Validação Orçamentária). E-mails não são observáveis pela suíte (disparo-multicanal CT-NOT-01-H declara isso). Fatia consultiva possível: para SCs FINALIZED via API, afirmar a sequência de tarefas 94 → 287 → 96 → 323 → 87 → 185 → 115 (o 99257 já a percorreu) e que 287 tem status COMPLETED em minutos; no Tracker visão Aprovadores SC, Status = Finalizado com datas de aprovação preenchidas. A unicidade do e-mail (SDCASSI-448) só é auditável na caixa postal.

### `tests/api/geracao-pedido-contrato-sc.spec.js (novo)` — 1 caso(s)

- **FSWTBC-5197** (SEV Alta *(bloqueia geração de pedido, prende a fila da unidade inteira e compromete saldo — risco financeiro)*) — Aprovar uma SC com cotação encerrada e ver o pedido de compras gerado no ERP e refletido na SC do Fluig
  - motivo/desenho: Geração do pedido pelo schedule GERADOCUMENTO após alçada: exige comprador + aprovadores + Protheus — a conta não resolve matrícula de comprador (erros-de-console documenta 'Comprador não encontrado'); ciclo-comprador CT-E2E-10-H afirma o OPOSTO (nenhum 'Pedido de Compra' no Histórico antes da alçada). Fatia consultiva viável: varrer via API SCs com formField pedidoContratoGerado='Sim' e afirmar _numPedido (tipoCompra=1) com 6 caracteres ou numContrato (tipoCompra=2) preenchido, e nenhuma SC com tarefa NOT_COMPLETED na 323 há mais de 1 h. CV8 'Fim' fica no spec de Logs Protheus (404 hoje).

## Testes mais fracos do que o título sugere (neste módulo)

- `tracker-compras.spec.js :: deve listar processos reais ao filtrar por status` — `count() > 0`; nenhuma coluna (Atividade Atual, Nº da Solicitação ERP, Nº da Cotação ERP, Rateio %) é lida em teste algum.
- `ciclo-comprador.spec.js :: CT-E2E-11-H — o Tracker localiza a SC própria… e exibe a posição atual e o caminho percorrido` — afirma `toContainText(numeroProcesso)` e o título do diálogo de rastro; "posição atual" não é lida.
- `ciclo-comprador.spec.js :: CT-E2E-10-H — retorno ao ERP` — afirma a AUSÊNCIA de "Pedido de Compra" antes da alçada; documenta o bloqueio, não o retorno.
- `alcadas-orcamentaria.spec.js :: CT-E2E-03-H` — chega à Validação Orçamentária e só afirma `toHaveCount(0)` de "Assumir tarefa"; o painel Validação do Item Orçamentário (Total Estimado a Aprovar, Aprovador) nunca é lido, embora seja legível pelo solicitante via `formFields`.
- `validacoes-solicitacao-compras.spec.js :: CT-CMP-02-S2` — cobre só soma < 100%; o comentário do próprio teste registra que > 100 é clampado no blur e para aí — negativo, linha vazia e CSV ficam sem assertion.
- `payload-solicitacao.spec.js :: as linhas de rateio devem trazer percentual… somando 100%` — o rateio vem do contrato; nunca um rateio INFORMADO (60/40) é verificado ponta a ponta.

