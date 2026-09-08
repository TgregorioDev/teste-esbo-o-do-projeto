<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# Financeiro e Contabil

Casos de teste do Protheus — registrados para execução futura no ERP.

| | |
|---|---|
| Casos neste arquivo | 41 |
| Verificados em tela | 0 total · 3 parcial · 38 não |

> **Como ler.** Estes casos **não são executáveis no Fluig** — o efeito do defeito só aparece
> no Protheus. Estão escritos por completo, do ponto de vista de quem for executá-los no ERP,
> para quando o projeto de testes cobrir o Protheus. Nenhum foi verificado em tela.

---

## CT-FSWTBC-633  (protheus · Concluído)

**Título:** Gerar a fatura a pagar de um documento de prestador cujo percentual por título cabe no campo FKW_PERC

**Origem:** FSWTBC-633 — "[744097] Erro envio do documento 158437409": *"Erro ao gerar fatura... AJUDA:FINM070 FKW_PERC - FWNOWIDTH - Valor atribuido difere do tamanho do campo (Percentual)"*. Mesma classe do FSWTBC-61/329 (largura de campo). Impacto: atraso em pagamentos a prestador. Ver o desfecho no FSWTBC-693 (causa: títulos com valor errado).

**Módulo/Rota:** **Protheus → SIGAFIN → Contas a Pagar → Geração de Fatura (FINM070)**; tabela **FKW** (detalhe/percentual da fatura), campo **FKW_PERC (Percentual)**; dicionário **SX3** (Configurador → Dicionário de Dados → FKW). Entrada do documento: integração de pagamento a prestador (`Payload.txt` do ticket).

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Credencial no Protheus com acesso a SIGAFIN e ao Configurador (leitura do SX3).
- Documento de prestador (equivalente ao 158437409) com N títulos SE2 cujos valores somam o total do documento.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: a fatura (FKW/SE2) não é gerada e a crítica FWNOWIDTH aparece no log/ajuda do FINM070; não há reflexo em nenhuma tela do Fluig`

**Passos**
1. Configurador → Dicionário → tabela FKW → campo **FKW_PERC**: anotar *Tamanho* e *Decimal*.
2. Enviar (pela integração) um documento com 3 títulos de valores 50 %, 30 % e 20 % do total.
3. Enviar um documento com 3 títulos de valores que produzam percentual com mais decimais que o campo aceita (ex.: 33,3333 %) e outro cujo percentual de um título seja **100,00 %**.
4. SIGAFIN → Contas a Pagar → Geração de Fatura (FINM070): gerar a fatura de cada documento.
5. Consultar os títulos gerados (Contas a Pagar → Títulos) e o log da integração.

**Resultado esperado**
- Passo 1: o tamanho de FKW_PERC comporta **100,00** (≥ 6 posições com 2 decimais) — se não comportar, o defeito é de dicionário.
- Passos 2–4: as três faturas geram; o percentual é arredondado para as decimais do campo **antes** de gravar; a soma dos percentuais é 100.
- Nenhuma mensagem `FWNOWIDTH`; a integração devolve sucesso.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `Erro ao gerar fatura... AJUDA:FINM070 FKW_PERC - FWNOWIDTH - Valor atribuido difere do tamanho do campo (Percentual)`; documento não faturado; pagamento ao prestador atrasado.

**Severidade:** Alta *(pagamento a prestador)*

**Preparação de massa:** documentos de prestador de homologação enviados pelo sistema de origem (payload no padrão do `Payload.txt` do ticket), preparados pela equipe financeira/integração da CASSI; dicionário conferido pelo administrador do Protheus.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — a fatura a pagar não passa pelo portal de Compras/Contratos; nenhum dataset ou widget do tenant referencia FKW/FINM070.
**Divergências encontradas:** o FSWTBC-693 conclui que o erro era **consequência de dado** (títulos com valor errado), não de programa — este caso cobre o programa; o 693 cobre o dado.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-693  (protheus · Concluído)

**Título:** Recusar com mensagem de negócio um documento de prestador cujos títulos têm valor inconsistente com o total, antes da geração da fatura

**Origem:** FSWTBC-693 — "[Suporte Fev/2025] [744097 Erro envio do documento 158437409]": reabertura do FSWTBC-633. Conclusão: *"os títulos envolvidos no processo estavam com valor errado, e por isso estava causando erro no cálculo padrão"* — o `FKW_PERC / FWNOWIDTH` era **consequência de dado**, não defeito do programa. Suporte encerrado.

**Módulo/Rota:** **Protheus → SIGAFIN → Contas a Pagar → Títulos (SE2)** e **Geração de Fatura (FINM070)**; validação de entrada da integração de pagamento a prestador (camada que recebe o `Payload.txt`).

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Credencial no Protheus (SIGAFIN) e acesso ao envio da integração de prestador em homologação.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: consistência valor dos títulos × total do documento e a mensagem devolvida pela geração da fatura`

**Passos**
1. Enviar um documento cujos títulos somam **exatamente** o total (caso válido).
2. Enviar um documento com **um título maior que o total** do documento (percentual > 100 %).
3. Enviar um documento cujos títulos somam **menos** que o total.
4. Para cada um: ler a resposta da integração, os títulos SE2 gerados e tentar a geração da fatura (FINM070).

**Resultado esperado**
- Passo 1: títulos gerados e fatura gerada.
- Passos 2–3: a integração (ou a geração de fatura) **recusa com mensagem de negócio** que identifica o documento e a inconsistência (soma dos títulos ≠ total) — **antes** de qualquer crítica de dicionário; nenhum título parcial fica gravado.
- Em nenhum caso aparece `FWNOWIDTH`.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Títulos com valor errado aceitos e a falha só aparecendo na fatura como `AJUDA:FINM070 FKW_PERC - FWNOWIDTH - Valor atribuido difere do tamanho do campo (Percentual)` — erro técnico mascarando erro de dado; 40 dias entre 633 e 693 para chegar à causa.

**Severidade:** Alta *(pagamento a prestador; diagnóstico enganoso)*

**Preparação de massa:** três documentos de prestador de homologação com os três perfis de valor, montados pela equipe financeira/integração da CASSI.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig.
**Divergências encontradas:** o ticket 633 foi tratado como defeito de programa e o 693 como dado — os dois casos coexistem de propósito (programa × validação de entrada).
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-1462  (protheus · Concluído)

**Título:** Emitir o relatório de valores contábeis realizados (despesa de comercialização) e conferir os totais contra o razão

**Origem:** FSWTBC-1462 — título: "[Despesa de comercialização - CASSI RELATÓRIO DE VALORES CONTÁBEIS REALIZADOS] - Erro na geração automática da medição"; o campo *caso* do registro diz "erro no relatório de valores contábeis realizados". Ficou 138 dias em PAUSADO INTERNA (bloqueio da fábrica) e foi fechado em 01/09 sem detalhe. O título e o caso divergem; o caso segue o registro (relatório contábil) e anota o cruzamento com a medição automática.

**Módulo/Rota:** Protheus → **SIGACTB** → *Relatórios* → relatório customizado **"Valores Contábeis Realizados"** (despesa de comercialização — nome de menu/rotina `<não documentado>`) → parâmetros de período/centro de custo; conferência em *Consultas › Razão* (**CTBR040**) / *Balancete* (**CTBR070**). Cruzamento com **SIGAGCT** › *Medições* (**CNTA121**) quando a origem da despesa é medição de contrato. No Fluig, só a medição automática tem superfície (Faturamento de Contratos por `consumerkeycompras`; *Logs Protheus* → *Medicoes ZZZ*) — o relatório não.

**Pré-condições**
- Período contábil com lançamentos de despesa de comercialização já efetivados (medições contabilizadas e/ou lançamentos manuais).
- Relatório customizado compilado no RPO e no menu do usuário.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: os valores impressos pelo relatório contábil e sua conciliação com CT2`. Sem credencial do Protheus.

**Passos**
1. Em **SIGACTB**, abrir o relatório *Valores Contábeis Realizados*, informar período (mês fechado) e o(s) centro(s) de custo de comercialização; emitir em tela/planilha.
2. Em **CTBR040** (razão), filtrar as mesmas contas/CCs e período; somar os lançamentos.
3. Para uma linha do relatório originada de medição de contrato, abrir **CNTA121** e conferir a medição (valor, competência, contabilização).
4. Repetir o passo 1 para um período que contenha uma medição **automática** (gerada pelo robô de madrugada) e conferir se ela aparece.
5. Contraprova no Fluig (só para o passo 4): *Logs Protheus* → *Medicoes ZZZ*, filtro **Contrato**/**Recebimento inicial-final** — ler *Status* e *Msg Medicao* da medição do período.

**Resultado esperado**
- Passo 1: relatório gera sem erro de execução (*THREAD ERROR*, variável não inicializada, coluna fora do range).
- Passo 2: totais do relatório = totais do razão para as mesmas chaves, sem duplicar nem omitir lançamentos.
- Passo 3: valor da linha = valor da medição contabilizada.
- Passo 4: medição automática incluída no realizado do mês da competência.
- Passo 5: registro ZZZ com *Status* `S` para a medição.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro na geração do relatório ou valores divergentes do razão — sintoma exato `<não documentado>`; se o título estiver correto, medição automática não gerada e ausente do realizado.

**Severidade:** Alta *(informação contábil de despesa)*

**Preparação de massa:** mês fechado com despesas de comercialização contabilizadas — pré-existente em produção/teste; nada a criar. Para o passo 4, um contrato com *Dia Med Auto* configurado (ver CT-FSWTBC-618 do lote L037; hoje a instância automática 111977 está viva, mas presa na fila).

**Verificado em tela:** NÃO
**Módulo ERP:** `Financeiro e Contabil`
**O que foi verificado:** só a superfície da medição automática no Fluig: aba *Medicoes ZZZ* presente com filtros *Id Fluig, Filial, Contrato, Status (Todos/P/E/S), Recebimento inicial/final* e colunas *ID Fluig, Contrato, Revisao, Num Med, Filial Medic, Status, Msg Medicao…*; consulta em 404 hoje (ambiente). Instância automática 111977 lida por API (nascida 15/08 03:00 por `consumerkeycompras`, presa na 182). O relatório não tem superfície.
**Divergências encontradas:** o **título** do ticket fala em "geração automática da medição" e o **registro** em "relatório de valores contábeis" — o caso cobre os dois, mas o time deve confirmar qual era o defeito.
**Dados/massa usados:** nenhum — não submetido; leitura de 111977.

---

## CT-FSWTBC-1511  (protheus · Concluído)

**Título:** Excluir o fechamento de uma SOC baixada por arquivo de retorno bancário e conferir que cada título é reaberto na ordem certa, sem travar

**Origem:** FSWTBC-1511 — "[CASSI - BH] Exclusão Fechamento SOC": a exclusão do fechamento travava na baixa bancária por arquivo de retorno. Ata de 28/04 com oito achados; o principal: o layout `brasil.2pr` existe em **quatro pastas, diferentes entre si** (baixas processadas com versões distintas do CNAB). Correção: `UCOME015` passou a chamar `U_UFINE034(,@cMsgExec,(cAliasQry)->R_E_C_N_O_)` e o `UFINE034` corrigiu a **ordem dos ExecAutos com reposicionamento do Recno** após cada processo; criada a opção **Fechamento SOC** no menu do SIGAFIN, com acesso pelo parâmetro **`SC_USRLBFI`**.

**Módulo/Rota:** **Protheus → SIGAFIN → menu customizado "Fechamento SOC"** (`UFINA435`; opção de exclusão do fechamento) → baixas geradas por **arquivo de retorno** (rotinas `FINA080`/`FINA430` conforme o ticket; layout CNAB `brasil.2pr`). Configurador → Parâmetros → **`SC_USRLBFI`**.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGAFIN e ao Configurador; usuário incluído em `SC_USRLBFI`.
- Uma SOC de homologação **fechada** cujos títulos foram **baixados por arquivo de retorno** (`.RET`) — ao menos 3 títulos, para que a ordem de execução dos ExecAutos seja observável.
- Antes de qualquer execução: as cópias de `brasil.2pr` (SYSTEM e demais pastas citadas na ata) comparadas por hash — a pendência do ticket é que a divergência entre as quatro cópias **não consta como resolvida**.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: reabertura (ou travamento) dos títulos SE1/SE5 e mensagem do ExecAuto na exclusão do fechamento; sem credencial do Protheus nesta rodada`

**Passos**
1. Configurador → Parâmetros → `SC_USRLBFI`: confirmar que o usuário de teste consta; com um usuário **fora** do parâmetro, abrir SIGAFIN e verificar que a opção *Fechamento SOC* não é oferecida (ou é negada).
2. Registrar os títulos da SOC (número, valor, situação "baixado", `IDCNAB`) — tela de Contas a Receber/Pagar conforme a natureza da SOC.
3. SIGAFIN → *Fechamento SOC* → selecionar a SOC fechada → **Excluir fechamento**.
4. Aguardar o término e ler a mensagem retornada (`cMsgExec`).
5. Reabrir a consulta dos títulos e dos movimentos bancários (SE5) da SOC.
6. Repetir 3–5 com uma SOC cujo retorno tenha sido processado com o `brasil.2pr` de **outra** pasta (se a divergência ainda existir), e comparar.

**Resultado esperado**
- Passo 1: acesso à opção controlado pelo parâmetro.
- Passos 3–4: a rotina termina **sem travar** e sem `ExecAuto` reportando registro fora de posição; `cMsgExec` vazio ou "processado".
- Passo 5: **todos** os títulos da SOC voltam ao estado anterior ao fechamento — nenhum título "meio revertido" (baixa estornada em um e mantida em outro); os movimentos SE5 correspondentes são estornados.
- Passo 6: resultado idêntico independentemente da pasta de origem do layout — se diferir, a pendência da ata está viva.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Exclusão do fechamento **trava** na etapa de baixa por retorno; ExecAuto executado fora de ordem, perdendo o posicionamento do Recno após o primeiro processo e deixando títulos em estado inconsistente; "nenhuma baixa funciona corretamente na PRIME".

**Severidade:** Alta *(estorno financeiro incompleto; títulos com situação inconsistente)*

**Preparação de massa:** SOC de homologação com ≥ 3 títulos e arquivo de retorno `.RET` processado — preparada pela equipe financeira da CASSI no ambiente PRIME/homologação; hash das cópias de `brasil.2pr` levantado pelo administrador do Protheus. O `.RET` anexado ao ticket não foi baixado nesta análise.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — varrido o fonte publicado dos formulários (256831/2/5/6), do Acompanhamento de Contratos e do Portal do Comprador: nenhuma ocorrência de "SOC", "CNAB", `UFINE034`, `SC_USRLBFI` ou `brasil.2pr`.
**Divergências encontradas:** a ata deixou em aberto qual documento vai na **posição 74 do registro A** (SOC, NumTit ou IDCNAB) — o caso não pode afirmar o valor; registrar como `<não documentado>` até a definição.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-1805  (protheus · Concluído)

**Título:** Gerar o relatório de Valores Contábeis Realizados da Despesa de Comercialização para um período fechado e conferir que ele conclui com totais

**Origem:** FSWTBC-1805 — "[Despesa de comercialização - RELATÓRIO DE VALORES CONTÁBEIS REALIZADOS] Erro na geração de relatórios de valores contábeis"; **sem descrição e sem comentário**, mas com o patch `ajusteRelatorioDespComer.ptm` anexado — a correção existe, o registro do defeito não. Caso escrito como **caracterização de caminho** (§5-D).

**Módulo/Rota:** **Protheus → SIGACOM (ou SIGAFIN) → Relatórios → Específicos → Despesa de Comercialização → Valores Contábeis Realizados** (rotina `<não documentado>` — o ticket só nomeia o relatório). Fonte de dados: lançamentos contábeis (CT2) das despesas de comercialização do período.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Credencial no Protheus com acesso ao módulo que hospeda o relatório e à Contabilidade (consulta).
- Período contábil de homologação com lançamentos de despesa de comercialização já contabilizados.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: geração do relatório (erro/abortagem) e totais contábeis; nenhuma superfície no Fluig`

**Passos**
1. Contabilidade → consultar os lançamentos (CT2) de despesa de comercialização do período; anotar o total por conta.
2. Abrir o relatório *Valores Contábeis Realizados* → parâmetros: período do passo 1, filial, contas "Todas" → **Imprimir**.
3. Ler a saída e o console.log/errorlog.
4. Repetir com um período **sem** lançamentos.
5. Repetir com o período máximo permitido (ex.: 12 meses) para verificar tempo/limite.

**Resultado esperado**
- Passo 3: relatório gerado sem erro; **total por conta igual** ao anotado no passo 1; nenhuma linha "0,00" para conta com movimento.
- Passo 4: relatório vazio com aviso, sem erro.
- Passo 5: conclui (sem estouro de tempo/memória) — se falhar, registrar o limite.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro na geração do relatório (`<não documentado>` — ticket sem descrição); relatório não sai ou sai sem os valores contábeis.

**Severidade:** Alta *(artefato contábil/de auditoria)*

**Preparação de massa:** lançamentos contábeis de despesa de comercialização em período de homologação — massa contábil existente na PRIME, indicada pela contabilidade da CASSI; o executor não cria lançamentos.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — "contabiliz"/"despesa de comercialização" não aparecem em fonte algum do tenant.
**Divergências encontradas:** correção entregue sem descrição do defeito — o caso afirma o comportamento correto genérico.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-1813  (Fluig · Concluído)

**Título:** Recusar uma SC na Aprovação de Alçadas e acompanhar o retorno ao comprador, a regeração da grade de alçada e a nova rodada de aprovação, sem erro de integração

**Origem:** FSWTBC-1813 (incidente 761820) — título real no Jira: "[CASSI - BH] - Suporte 2025] - [CASSI - BH] - Suporte 2025] - [CASSI - BH] - Suporte 2025] - [CASSI - BH] - Suporte Maio/2025] - **Erro no processo de recusa e aprovação de Alçada**". O lote recebeu o título truncado e classificou o item como "defeito de processo do Jira" (prefixo duplicado 4×). O prefixo duplicado é achado de processo (automação de renomeação concatenando a cada movimentação); **o defeito funcional é de Fluig**: recusa/aprovação de alçada na SC. Sem descrição — caso escrito como **caracterização de caminho** (§5-D) sobre o ciclo real observado numa instância viva.

**Módulo/Rota:** Fluig → Central de Tarefas → processo *Solicitação de Compras* (`wf_solicitacao_compras`) → atividade **94 "Aprovação de Alçadas"** (grade `tbAlcadas`, campos "Aprovar? *" e "Justificativa para a Aprovação/Reprovação *") → **Integração com ERP** → gateway **"Sol. Aprovado na Alçada?"** → **210 "Validação do Comprador (Alçadas)"** → "Enviar para" → **309 "Aguarda Geração Alçadas"** → gateway "Alçada foi Gerada?" → **310 "Gerar Grid de Alçada"** → volta à 94. Sequências e nomes confirmados no Histórico da SC 112011 (v94 do processo) e na lista de atividades do formulário.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Uma SC criada pelo executor (marcador `QA` na Justificativa) que chegue à Aprovação de Alçadas — exige Validação do Gestor, Validação Orçamentária e cotação/dispensa concluídas; a conta de QA não resolve matrícula de comprador (§5-C), então a SC precisa ser conduzida por perfil de comprador e de aprovador de alçada.
- Login de um aprovador da grade de alçada da SC e login do comprador responsável.
- **Bloqueio:** conta de QA não é aprovador de alçada nem comprador (perfil que a conta não tem — bloqueio de Fluig, não SOMENTE PROTHEUS). A instância viva 112011 só pode ser observada, nunca movimentada (regra §2).

**Passos**
1. Como aprovador, abrir a tarefa da SC em *Aprovação de Alçadas*; conferir que o formulário exibe a seção "Aprovação de Alçada" com "Total a ser Aprovado (R$) *" e a grade com "Aprovar? *" e "Justificativa para a Aprovação/Reprovação *".
2. Marcar "Aprovar?" = **Não** na linha do aprovador, preencher a justificativa com `QA - recusa de alçada` e enviar.
3. Na aba **Histórico** da SC, verificar as movimentações: Aprovação de Alçadas → Integração com ERP ("Integração executada com sucesso - Tempo de Execução N s") → "Sol. Aprovado na Alçada?" → Validação do Comprador (Alçadas).
4. Como comprador, abrir a tarefa em *Validação do Comprador (Alçadas)*, tratar a recusa (ajustar/reenviar) e enviar.
5. Verificar no Histórico: "Enviar para" → Aguarda Geração Alçadas → "Alçada foi Gerada?" → Gerar Grid de Alçada ("Integração executada com sucesso") → Aprovação de Alçadas.
6. Como aprovador, abrir a nova tarefa em *Aprovação de Alçadas*; conferir que a grade foi regerada (aprovadores corretos, "Total a ser Aprovado (R$)" coerente com a SC) e que o painel de consenso indica "esta atividade requer um consenso de: 100%".
7. Marcar "Aprovar?" = **Sim**, justificar e enviar. Verificar no Histórico que a SC segue para Integração com ERP e sai da etapa de alçada; no formulário, conferir "Retorno Integração" vazio ou com sucesso.
8. Em nenhum momento tocar na SC 112011 (instância real usada só como referência de leitura).

**Resultado esperado**
- A recusa na 94 é registrada com a justificativa e leva a SC ao comprador (210), com "Integração executada com sucesso" no Histórico.
- A regeração da grade (310) recria os aprovadores sem intervenção manual do administrador e devolve a SC à 94.
- A aprovação na segunda rodada conclui a etapa; "Retorno Integração" não exibe erro; nenhuma tarefa fica sem responsável (`chosenAssignees` preenchido) e o SLA da 94 é respeitado.
- A decisão do aprovador **não** é lida como "Reprovado" quando ele apenas não tocou o switcher (ver A3-d): a atividade não deve permitir enviar sem decisão explícita.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro no processo de recusa/aprovação de alçada (ticket sem detalhe): a SC não volta ao comprador, ou a grade não é regerada e o administrador precisa intervir — na SC 112011 o Histórico traz o comentário do Administrador Cassi em *Aguarda Geração Alçadas*: "Erro na geração dos aprovadores corrigido no sistema regerando para validação" (21/08/2026 19:31).
- SC parada na 94 com SLA estourado (112011: em *Aprovação de Alçadas* desde 21/08/2026, prazo 25/08, `slaStatus=EXPIRED`, 18 dias).

**Severidade:** Alta — aprovação/alçada (risco de aprovação indevida ou de compra travada).

**Preparação de massa:** uma SC do executor levada até a alçada por perfis de gestor, comprador e aprovador — a conta de QA não cobre esses perfis. Sem isso o caso só pode ser observado em instâncias de terceiros (leitura).

**Verificado em tela:** PARCIAL
**O que foi verificado:** `GET /process-management/api/v2/requests/112011` → OPEN, `wf_solicitacao_compras`, iniciada 19/08/2026; `/tasks?expand=chosenAssignees` → movimento 43, estado **94 "Aprovação de Alçadas"**, `NOT_COMPLETED` para 2 aprovadores, `slaStatus=EXPIRED`, prazo 25/08/2026. Tela `pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=112011`: título "Movimentar Solicitação", abas Formulário/Informações/Histórico 19/Anexos 0, "Atividade atual: Aprovação de Alçadas (Em progresso)", "esta atividade requer um consenso de: 100%", "Número de aprovações insuficiente para gerar percentual de consenso"; Histórico com o ciclo 94 → Integração com ERP (7 s) → Sol. Aprovado na Alçada? → 210 → Enviar para → 309 → Alçada foi Gerada? → 310 (7 s) → 94, e o comentário do administrador citado acima. Rótulos do formulário: "Aprovação de Alçada", "Total a ser Aprovado (R$) *", "Aprovar? *", "Justificativa para a Aprovação/Reprovação *", "Validação do Comprador (Análise pós Alçadas)"; lista de atividades com "94 - Aprovação de Alçadas", "210 - Validação do Comprador (Alçadas)", "309 - Aguarda Geração Alçadas", "310 - Gerar Grid de Alçada", "216/218 - Intermediário Reiniciar Cotação/Negociação após Alçada". Não executado (conta sem perfil).
**Divergências encontradas:** (1) o lote truncou o título e perdeu o defeito real; (2) título do ticket com o prefixo "[CASSI - BH] - Suporte 2025]" repetido 4× — defeito da automação do Jira, prejudica busca; (3) o formulário tem **quatro** campos "Aprovar? *" — o caso identifica o da grade `tbAlcadas` pela seção "Aprovação de Alçada"; (4) a tela chama a etapa de "Aprovação de Alçadas" (plural) enquanto o briefing/ticket usam "Aprovação de Alçada".
**Dados/massa usados:** SC 112011 (leitura apenas, instância de terceiro) — nada movimentado.

---

## CT-FSWTBC-1819  (protheus · Concluído · incidente 761255)

**Título:** Contabilizar a medição de um contrato com Contabiliza=Sim e Aglutina=Sim e obter um único lançamento aglutinado na CNW

**Origem:** FSWTBC-1819 — "Erro aglutinação da contabilização contratos": com *Contabiliza = Sim* e *Aglutina = Sim*, o sistema gerava **uma linha por parcela na CNW** em vez de aglutinar. **Reincidência declarada pelo cliente** ("já reportada em 2024 e solucionada com o consultor Pablo; voltou a ocorrer em produção e na Prime"), urgência 5-Imediato, contrato de referência **00006-2025-1201**. Entregue em 3 dias sem registro da causa da reincidência.

**Módulo/Rota:** **Protheus → SIGAGCT → Atualizações → Contratos → Medição (CNTA120)** → ao encerrar, contabilização on-line (perguntas *Contabiliza?* / *Aglutina?* / *Mostra lançamento?*); resultado em **CNW** (lançamentos da contabilização de contratos) e em **CT2**; Contabilidade → Lançamentos → consulta por documento/origem.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGAGCT e à Contabilidade (consulta de CT2/CNW).
- Lançamento padrão da medição de contrato configurado (SIGACTB → Lançamentos Padrão) com aglutinação prevista.
- Contrato de homologação com planilha de **≥ 3 parcelas** e cronograma financeiro gerado (mesma família de massa do CT-FSWTBC-1615).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: quantidade de linhas na CNW/CT2 por medição; o Fluig não expõe contabilização`

**Passos**
1. CNTA120 → medir o contrato cobrindo **3 parcelas** na mesma medição; encerrar.
2. Nas perguntas da contabilização, responder **Contabiliza = Sim**, **Aglutina = Sim**, *Mostra lançamento = Sim*.
3. Na tela de lançamento exibida, contar as linhas por conta/histórico.
4. Consultar a **CNW** pela medição (contrato + nº da medição) e a CT2 pelo documento de origem.
5. Repetir 1–4 com **Aglutina = Não** para ter a referência do comportamento não aglutinado.
6. Repetir 1–4 na **Prime** e em **produção** (o ticket registra o defeito nos dois).

**Resultado esperado**
- Passos 3–4 (Aglutina = Sim): **uma linha** por combinação conta/centro de custo/histórico na CNW e na CT2, com o valor = soma das 3 parcelas.
- Passo 5 (Aglutina = Não): 3 linhas, uma por parcela — prova que o parâmetro é lido.
- Passo 6: comportamento idêntico nos dois ambientes.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Com Aglutina = Sim, **uma linha por parcela** na CNW (3 linhas para 3 parcelas), como se o parâmetro fosse ignorado.

**Severidade:** Alta *(contábil; regressão de correção de 2024)*

**Preparação de massa:** contrato `QA` multi-parcela no SIGAGCT de homologação (executor); lançamento padrão conferido pela contabilidade. **Não** usar o 00006-2025-1201 — é contrato real de produção.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — "aglutin"/"contabiliz"/CNW não aparecem em nenhum fonte publicado; o contrato 00006-2025-1201 **não está** entre os 860 devolvidos por `dsProtheus_getContratosxFornecedores_restGet` neste tenant (situações 01/05/06/07/08).
**Divergências encontradas:** contrato de referência ausente da base de homologação — a massa precisa ser criada.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-2230  (protheus · Concluído · SDCASSI-33)

**Título:** Contabilizar um aditivo de contrato e obter parcelas separadas em curto e longo prazo

**Origem:** FSWTBC-2230 — "Erros de contabilização do módulo gestão de contratos": documento do cliente com vários problemas; acordou-se tratar só o item 1. Achado final: "**todos os aditivos e alinhamentos são contabilizados como LONGO PRAZO**, pois a **tabela CNW não realiza a separação entre curto e longo prazo**". Encerrado **"Não será feito"** — limitação de modelagem, nova demanda a abrir.

**Módulo/Rota:** **Protheus → SIGAGCT → Contratos (CNTA300)** → aditivo/revisão → **Contabilização de Contratos** (rotina/LP de contabilização do GCT — código a confirmar no menu do cliente); **SIGACTB → Consultas → Lançamentos Contábeis (CT2)**; tabela **CNW** (parcelas/cronograma contábil).

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGAGCT e ao SIGACTB (consulta CT2).
- Contrato `QA` de homologação com cronograma **≥ 24 meses** (parcelas vencendo dentro e depois de 12 meses), e um aditivo de valor.
- Plano de contas de homologação com contas distintas de **curto prazo** e **longo prazo** para o passivo de contratos (confirmar com a contabilidade do cliente).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: conta contábil (CP × LP) dos lançamentos CT2 gerados pela contabilização do aditivo; nenhum dataset ou tela do Fluig expõe CNW/CT2`

**Passos**
1. Gerar o aditivo do contrato `QA` (revisão) e regerar o cronograma; anotar na **CNW** as parcelas com vencimento ≤ 12 meses e > 12 meses.
2. Executar a contabilização do contrato/aditivo (**em homologação**, para o contrato `QA` apenas).
3. SIGACTB → Lançamentos (CT2) → filtrar pelo contrato/data → listar conta débito/crédito, valor e histórico de cada lançamento.
4. Comparar cada lançamento com a parcela da CNW.

**Resultado esperado**
- Passo 3–4: parcelas com vencimento ≤ 12 meses lançadas na conta de **curto prazo**; > 12 meses na de **longo prazo**; soma dos lançamentos = valor do aditivo.
- *(hoje pode falhar: limitação conhecida — todas as parcelas em longo prazo — enquanto a demanda de melhoria não for implementada; registrar o resultado como "limitação documentada", não como aprovação)*

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Todos os lançamentos do aditivo na conta de longo prazo, independentemente do vencimento; balanço com passivo circulante subestimado.

**Severidade:** Alta *(impacto contábil/balanço)*

**Preparação de massa:** contrato `QA` multi-anual com aditivo, criado pelo executor no SIGAGCT de homologação; contabilização executada só sobre esse contrato, em homologação, com o contador do cliente para validar as contas.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — `dsProtheus_getContabilizacao_restGetAll` e `dsProtheus_getLancamentoPadrao_restGetAll` **não existem** (500 NPE); nenhum fonte publicado referencia CNW/CT2.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-2233  (protheus · Concluído · SDCASSI-34)

**Título:** Cancelar a contabilização de um extrato efetivado no Conciliador BackOffice e obter o estorno com histórico do LP correto

**Origem:** FSWTBC-2233 — "DEM10014130 - O Cancelamento de Contabilização de lançamentos efetivados Conciliador BackOffice não está gravando corretamente o histórico": o estorno contábil ocorria certo, mas o histórico usava o LP oposto (562 "inclusão a pagar" estornando como 563 "inclusão a receber"). Solução colada no ticket: em 562/001 e 563/001 `CT5_VLR01 = IF(SE5->E5_SITUACA != 'C', E5_VALOR, 0)`; em 562/002 e 563/002 o inverso, com `CT5_HIST`/`CT5_HAGLUT` montando `Est.Rec-`/`Est.Pag-` limitado por `MV_XTAMHIS`. Regra do produto registrada: efetivar gera **seq 001** do LP; estornar gera a **seq 002 do OUTRO LP**.

**Módulo/Rota:** **Protheus → SIGAFIN → Conciliação bancária / Conciliador BackOffice** (rotina de efetivação de extrato — código a confirmar no menu do cliente) → **Cancelar efetivação**; **SIGACTB → Cadastros → Lançamentos Padrão (CT5)** LP **562** e **563**; **Consultas → Lançamentos Contábeis (CT2)**; **SE5** (movimento bancário, `E5_SITUACA`).

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGAFIN (conciliador) e SIGACTB (CT5/CT2).
- Extrato bancário de homologação com **um pagamento e um recebimento** ainda não efetivados, identificados `QA` no histórico.
- LPs 562 e 563 com as sequências 001 e 002 conforme o ticket; parâmetro `MV_XTAMHIS` definido (240 no ticket).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: histórico (CT2_HIST) e valor dos lançamentos de estorno; nenhuma superfície do Fluig`

**Passos**
1. CT5: abrir 562/001, 562/002, 563/001, 563/002 e anotar as fórmulas de `CT5_VLR01`, `CT5_HIST` e `CT5_HAGLUT`.
2. Conciliador: **efetivar** o pagamento `QA` → CT2: anotar o lançamento gerado (LP, seq, valor, histórico).
3. Efetivar o recebimento `QA` → idem.
4. **Cancelar a efetivação** do pagamento → CT2: anotar o lançamento de estorno.
5. Cancelar a efetivação do recebimento → idem.

**Resultado esperado**
- Passo 2: lançamento **562/001** com `E5_VALOR` e histórico de inclusão a pagar. Passo 3: **563/001**, recebimento.
- Passo 4: estorno pela **seq 002 do LP 563** com histórico iniciando **`Est.Pag-`** e valor = `E5_VALOR` (pois `E5_SITUACA = 'C'`); passo 5: seq 002 do LP 562 com **`Est.Rec-`**. O histórico identifica sem ambiguidade se o estorno é de pagamento ou recebimento, truncado em `MV_XTAMHIS`.
- Nenhum erro de runtime durante o cancelamento.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Estorno de pagamento com histórico de "inclusão a receber" (ou vice-versa), impossibilitando a contabilidade de identificar os estornos; ou erro **`argument #0 error, expected C->U, function substr … on TRANSLCTA(TRANSLCT.PRG) line 40`** ao cancelar.

**Severidade:** Alta *(contábil — identificação de estornos)*

**Preparação de massa:** extrato bancário de homologação com dois movimentos `QA` (um pagamento, um recebimento) importado/incluído pelo financeiro do cliente; LPs conforme o ticket. Não cancelar efetivações reais.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — CT2/CT5/SE5 e "conciliador" não aparecem em nenhum fonte publicado nem em nome de dataset do tenant.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-2235  (protheus · Concluído · SDCASSI-37)

**Título:** Executar a transferência e contabilização LP→CP (UGCTE002) para um contrato e obter lançamento do LP 150 para todos os contratos elegíveis

**Origem:** FSWTBC-2235 — "Rotina de transf. e contab. LP-CP - UGCTE002": a rotina percorria **todos** os contratos até achar o informado no parâmetro; no debug com a analista contábil descobriu-se que a rotina envia os contratos corretos, mas "o **lançamento padrão (150) não está contemplando todos os contratos**". 63 dias em pausa interna e encerrado com base em informação de terceiro ("tratado pelo Sr. Claudio com sucesso"), sem registro do que mudou — a cobertura do LP 150 **não consta como verificada**.

**Módulo/Rota:** **Protheus → SIGAGCT (ou SIGACTB) → Miscelânea/Rotinas específicas → Transferência e Contabilização LP-CP (`UGCTE002`)** — posição no menu a confirmar no menu do cliente; **SIGACTB → Cadastros → Lançamentos Padrão (CT5)** LP **150**; **Consultas → Lançamentos Contábeis (CT2)**.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Credencial no Protheus com acesso à rotina UGCTE002 e ao SIGACTB.
- Em homologação: **três** contratos `QA` com parcelas de longo prazo que **vencem dentro do próximo período** (passam a curto prazo) e um quarto contrato `QA` sem parcelas elegíveis.
- LP 150 cadastrado com as sequências vigentes (anotar).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: tempo/escopo de processamento da rotina e presença dos lançamentos do LP 150 na CT2; nenhuma superfície do Fluig`

**Passos**
1. CT5 → LP 150: anotar sequências, condições e fórmulas.
2. UGCTE002 → parâmetro contrato = **um** dos três `QA` elegíveis; período = o próximo; executar (em homologação) cronometrando.
3. CT2: filtrar pela data/LP 150 → listar lançamentos por contrato.
4. UGCTE002 → parâmetro contrato = "todos" (ou em branco, conforme a pergunta da rotina) → executar.
5. CT2: repetir o passo 3.

**Resultado esperado**
- Passo 2: a rotina processa **apenas** o contrato informado (log/console sem os demais) e termina em tempo proporcional a um contrato.
- Passo 3: exatamente os lançamentos do contrato informado, valor = parcelas que migram LP→CP.
- Passo 5: um lançamento do LP 150 para **cada** um dos três contratos elegíveis e **nenhum** para o quarto; soma = total transferido no período.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A rotina varre todos os contratos mesmo com um contrato no parâmetro (lenta); e/ou contratos elegíveis **sem** lançamento do LP 150 na CT2.

**Severidade:** Alta *(contábil — classificação CP/LP incompleta)*

**Preparação de massa:** quatro contratos `QA` com cronogramas construídos pelo executor no SIGAGCT de homologação; execução da rotina só em homologação, acompanhada pela contabilidade do cliente. Não executar em produção.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — `UGCTE002` e "LP 150" não aparecem em fonte publicado nem em dataset do tenant.
**Divergências encontradas:** nenhuma; registrar que o desfecho do ticket não descreve a correção.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-2331  (protheus · Concluído · SDCASSI-56)

**Título:** Alterar um contrato, fechar a tela de contabilização sem confirmar e conferir que a movimentação não é efetivada nem contabilizada

**Origem:** FSWTBC-2331 — contrato `00001-2022-3506`: ao alterar o contrato, a usuária **fechou** a tela de contabilização, mas a movimentação foi efetivada mesmo assim e a contabilização não pôde ser refeita — restou excluir o lançamento direto no SIGACTB. A matriz TOTVS classificou como **melhoria de produto** (release 24.10 permite fechar a tela e efetiva). *Não será feito.* No mesmo ticket ficou registrado que o CNW **não separa curto e longo prazo** (mesma raiz de 2330/2333).

**Módulo/Rota:** Protheus → SIGAGCT → Gestão de Contratos → contrato → *Alterar* → tela de **contabilização on-line** (lançamento padrão) → botão fechar/abortar; SIGACTB → Lançamentos → consulta por documento — nomes de menu a confirmar no cliente.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGAGCT e leitura no SIGACTB; parâmetro de contabilização on-line ativo (`MV_CTBFLAG`/lançamento padrão da rotina — a confirmar).
- Contrato de homologação **criado pelo executor** com cronograma contábil, em situação *Vigente*.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: efetivação da revisão do contrato e existência do lançamento contábil (CT2) após abortar a tela de contabilização`

**Passos**
1. Anotar revisão atual, valor e situação do contrato; anotar a quantidade de lançamentos CT2 associados ao contrato.
2. Acionar *Alterar* no contrato; alterar um valor que gere contabilização; confirmar até a tela de contabilização abrir.
3. **Fechar a tela de contabilização sem confirmar** (X / Cancelar / Abortar, conforme a versão).
4. Reabrir o contrato e comparar com o passo 1.
5. Consultar os lançamentos CT2 do contrato/data.
6. Se a movimentação tiver sido efetivada, tentar *Contabilizar* novamente pela rotina (sem excluir nada no SIGACTB).

**Resultado esperado**
- Passo 4: o contrato permanece **como no passo 1** — abortar a contabilização aborta a movimentação (transação única), **ou** o sistema bloqueia o fechamento da tela avisando que a contabilização é obrigatória.
- Passo 5: nenhum lançamento novo, nem lançamento "fantasma" sem movimentação.
- Passo 6 (se aplicável): a rotina permite refazer a contabilização da movimentação sem recorrer à exclusão manual no SIGACTB.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Tela de contabilização fechada, movimentação **efetivada** mesmo assim; contabilização não pode ser refeita pela rotina; a única saída é excluir direto no módulo contábil (contabilização fantasma).

**Severidade:** Alta *(risco contábil: lançamento inconsistente com a movimentação)*

**Preparação de massa:** contrato de homologação com cronograma contábil, criado pelo executor. O contrato do ticket (`00001-2022-3506`) **não existe neste tenant**. Não executar em base compartilhada com fechamento contábil em curso.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — a alteração de contrato não passa pelo portal; sem superfície.
**Divergências encontradas:** o ticket trata como defeito; a matriz TOTVS classificou como melhoria — o caso afirma o comportamento correto e hoje **pode reprovar** por decisão de produto.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2333  (protheus · Concluído · SDCASSI-55)

**Título:** Realinhar o preço de um contrato de longa duração e conferir a separação do valor contabilizado entre curto prazo (12 primeiras parcelas) e longo prazo

**Origem:** FSWTBC-2333 — contrato `00151-2023-2301`, realinhamento de R$ 2.497,81 em 161 parcelas: o sistema registrou R$ 239.184,82 como valor presente de longo prazo; o cliente calculou R$ 412.403,69 (LP, parcelas 13–161) e R$ 33.213,72 (CP, parcelas 1–12). Análise: o sistema contabiliza o **total integralmente em longo prazo** — não há separação CP/LP. Exige nova DEM (mesma raiz de 2330/2331; ref. SD-CASSI-33). *Não será feito.*

**Módulo/Rota:** Protheus → SIGAGCT → Gestão de Contratos → contrato → *Realinhamento de preço* → contabilização; SIGACTB → consulta do lançamento (contas de curto e longo prazo) — nomes de menu a confirmar no cliente.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Credencial no Protheus (SIGAGCT + leitura no SIGACTB); lançamento padrão do realinhamento configurado com contas CP e LP distintas (se a DEM tiver sido implementada) — a confirmar.
- Contrato de homologação criado pelo executor com cronograma contábil de **≥ 24 parcelas** mensais.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: valores do lançamento contábil do realinhamento por conta (curto × longo prazo) e o cronograma CNW`

**Passos**
1. Anotar as parcelas do CNW (número, competência, valor).
2. Aplicar realinhamento de preço de valor conhecido `V` por parcela, a partir da próxima competência.
3. Calcular manualmente: CP = soma das 12 primeiras parcelas realinhadas; LP = soma das demais (valor presente, se a política do cliente exigir).
4. Abrir o lançamento contábil gerado e ler os valores por conta.
5. Reabrir o CNW e comparar com o passo 1.

**Resultado esperado**
- Passo 4: o lançamento traz **dois** valores — curto prazo = CP do passo 3 e longo prazo = LP do passo 3 — e a soma é igual ao total do realinhamento.
- Passo 5: cada parcela do CNW aumentou exatamente `V` (ou a distribuição proporcional documentada), sem alterar parcelas apropriadas.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Valor total do realinhamento lançado **100 % em longo prazo** (ex.: R$ 239.184,82 registrado como LP sem parcela de CP), sem separação das 12 primeiras parcelas.

**Severidade:** Alta *(classificação contábil CP/LP incorreta — demonstrações financeiras)*

**Preparação de massa:** contrato de homologação com ≥ 24 parcelas contábeis, criado pelo executor. Contrato do ticket inexistente neste tenant. **Hoje este caso deve reprovar** — a separação CP/LP depende de DEM não aberta até o fechamento do ticket.

**Verificado em tela:** NÃO
**O que foi verificado:** ausência de superfície no Fluig (nenhuma tela ou dataset expõe CNW ou lançamentos contábeis).
**Divergências encontradas:** o ticket cita o valor de LP como R$ 412.403,69 na descrição e "R$ 412.403,00" na análise — o caso não afirma valor absoluto, só a regra.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2709  (protheus · Em Homologação · SDCASSI-82)

**Título:** Emitir o relatório de corretagem calculada por período de apuração (DOC044) e conferir que o valor por período fecha com os lançamentos-base

**Origem:** FSWTBC-2709 — "[DEM10011184] DOC044 - 02 - Relatório de Corretagem calculada conforme período de apuração — erros durante a homologação do cliente". **Sem descrição** no ticket; **em homologação desde 18/09/2025** (~1 ano). Caso escrito como **caracterização de caminho** (§5-D).

**Módulo/Rota:** Protheus → relatório customizado **"Corretagem calculada conforme período de apuração"** (DOC044 da DEM10011184; módulo e nome de menu **a confirmar no menu do cliente** — provavelmente SIGAFIN/SIGACTB) → parâmetros de período de apuração → impressão/planilha.

**Módulo ERP:** `Financeiro e Contabil` *(a confirmar)*

**Pré-condições**
- Credencial no Protheus com acesso ao relatório; MIT044/DOC044 da DEM10011184 em mãos para os critérios de cálculo.
- Base de homologação com corretagens lançadas em **dois períodos de apuração** consecutivos, incluindo um lançamento **na fronteira** entre eles.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: conteúdo e totais do relatório de corretagem`; ticket sem descrição — os erros de homologação não estão documentados.

**Passos**
1. Emitir o relatório para o período **P1** (data inicial/final conforme parâmetro).
2. Somar manualmente as corretagens-base de P1 (consulta dos lançamentos/títulos de origem).
3. Emitir para **P2** e repetir a soma.
4. Emitir para **P1+P2** num único intervalo.
5. Verificar o lançamento da fronteira (último dia de P1) — em qual período o relatório o classifica.

**Resultado esperado**
- Passo 1 = passo 2 e passo 3 = soma de P2: totais do relatório iguais à base.
- Passo 4: total = P1 + P2, sem duplicar nem omitir o lançamento da fronteira.
- Passo 5: o lançamento é classificado conforme o critério de "período de apuração" da DOC044 (`<não documentado>` no ticket — registrar o critério observado).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `<não documentado>` — o ticket não descreve os erros; registrar qualquer divergência entre total do relatório e a base como reincidência.

**Severidade:** Alta *(relatório contábil/financeiro; item aberto há um ano)*

**Preparação de massa:** corretagens em dois períodos de apuração em homologação, incluindo lançamento de fronteira — preparadas pela área financeira da CASSI; especificação DOC044 anexa à DEM10011184.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — relatório do ERP; sem superfície.
**Divergências encontradas:** ticket sem descrição e sem evidência; status *Em Homologação* — o caso está **aberto** e pode reprovar hoje.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3060  (protheus · Concluído · SDCASSI-132)

**Título:** Realinhar o preço de uma parcela de contrato e conferir que o lançamento contábil do realinhamento é efetivado

**Origem:** FSWTBC-3060 — o realinhamento de preços permitia alterar o valor da parcela e **apresentava** a tela de contabilização, mas o
lançamento **não era efetivado**. Encerrado com *"Ajuste efetuado. Disponível na base DES"*, sem descrição técnica, sem homologação
registrada e sem subida a produção — confirmar em qual ambiente a correção está.

**Módulo/Rota:** SIGAGCT → *Contratos* → contrato vigente → *Outras Ações* → *Realinhamento de Preços* (nome a confirmar no cliente) →
tela de contabilização (Lançamentos Padrão) → SIGACTB → *Lançamentos* (consulta). Nenhuma superfície no Fluig.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Contrato de homologação vigente com cronograma financeiro/contábil e parcela em aberto; Lançamento Padrão do realinhamento configurado.
- Credencial Protheus no SIGAGCT e SIGACTB.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: existência do lançamento contábil do realinhamento`.

**Passos**
1. SIGAGCT → *Contratos* → selecionar o contrato → *Outras Ações* → *Realinhamento de Preços*.
2. Alterar o valor de uma parcela (ex.: +100,00) e confirmar.
3. Na tela de contabilização, conferir o lançamento proposto (contas, valor = diferença) e **confirmar** (não fechar a tela).
4. SIGACTB → *Lançamentos* → filtrar pela data e pelo documento/contrato.
5. Reabrir o contrato: conferir o novo valor da parcela e o saldo.
6. (Controle negativo) Repetir 1–2 e **fechar** a tela de contabilização sem confirmar; conferir se a alteração da parcela foi ou não efetivada.

**Resultado esperado**
- Passo 3: lançamento apresentado com o valor da diferença.
- Passo 4: lançamento **gravado** no CTB, com o valor e as contas do passo 3.
- Passo 5: parcela e saldo coerentes com o lançamento.
- Passo 6: comportamento consistente — ou a movimentação é desfeita junto com a contabilização, ou é bloqueada; nunca "parcela alterada sem lançamento" (mesma família do FSWTBC-2331).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A tela de contabilização aparece, a parcela é alterada, mas **nenhum lançamento** existe no SIGACTB.

**Severidade:** Alta — divergência entre contrato e contabilidade.

**Preparação de massa:** contrato de homologação com parcela em aberto e LP configurado, preparado pelo executor; **não** usar contrato de produção.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — não há superfície.
**Divergências encontradas:** nenhuma verificável; o ticket não confirma que a correção saiu da base DES.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-3138  (protheus · Concluído · SDCASSI-139)

**Título:** Excluir um fechamento NDF pela API de Contas a Pagar (bondsPay, método DELETE) e conferir que o título é removido e a resposta é de sucesso

**Origem:** FSWTBC-3138 — a exclusão de fechamento do tipo **NDF** pelo serviço `UCOMA001/bondsPay` (DELETE, MIT072 *API Contas a Pagar
NDF_CP_AVULSO e CR_AVULSO*) falhava; patch entregue no mesmo dia, sem causa raiz registrada e **sem validação confirmada** pelo cliente.
Log analisado: `type mismatch on +` em `U_UFINE020 (UFINE020.PRW)` linha 119 — operação aritmética sobre valor não numérico.

**Módulo/Rota:** serviço REST `bondsPay` (fonte `UCOMA001`), método **DELETE**; SIGAFIN → *Contas a Pagar* → título NDF avulso (consulta);
log do REST (`console.log` do AppServer REST). Nenhuma superfície no Fluig.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Credencial REST do Protheus de homologação e a especificação MIT072 (payload do POST e do DELETE).
- Título NDF avulso **criado pelo executor** via POST na mesma API (não excluir título pré-existente).
- Acesso ao log do REST.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: resposta do DELETE, existência do título no Contas a Pagar e log do REST`.

**Passos**
1. `POST bondsPay` com um fechamento NDF de homologação; guardar o identificador retornado.
2. SIGAFIN → *Contas a Pagar* → confirmar o título.
3. `DELETE bondsPay` com o identificador do passo 1; ler status HTTP e corpo.
4. SIGAFIN → *Contas a Pagar* → consultar o título.
5. Ler o log do REST após o DELETE.
6. (Negativo) `DELETE` com identificador inexistente e com título já baixado.

**Resultado esperado**
- Passo 3: HTTP 2xx e corpo de sucesso conforme MIT072.
- Passo 4: título **não existe mais** (ou marcado como excluído, conforme MIT072).
- Passo 5: sem `type mismatch on +` nem outro erro em `UFINE020`.
- Passo 6: erro de negócio legível (4xx), sem erro de execução.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- DELETE responde erro (5xx) e o título permanece; log com `type mismatch on + … U_UFINE020(UFINE020.PRW) linha 119`.

**Severidade:** Alta — fechamentos precisam ser excluídos antes do fechamento do período contábil.

**Preparação de massa:** título NDF de homologação criado pelo executor via POST; credencial REST e MIT072 fornecidas pelo cliente.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — não há superfície (o processo *Rejeições de Pagamentos* do tenant é de retorno bancário, não desta API).
**Divergências encontradas:** o ticket não diz qual sistema consome o DELETE; a validação do patch não consta.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-3139  (protheus · Concluído · SDCASSI-138)

**Título:** Gerar o cronograma contábil de um contrato novo de 36 meses e conferir que a provisão contabiliza apenas as parcelas com vencimento até 360 dias

**Origem:** FSWTBC-3139 — o contrato `6175-2025-5303`, com cronograma contábil de 36 meses, contabilizou o **total do contrato** em vez da
parcela anual. Causa: o flag `CNW_XPROV` (*não provisionar*, regra da DEM10013766 / PE `CNTA300`) não era respeitado pela rotina de
provisão `UGCTE01A`. Liberado "para validação na base DES"; em 18/11 o cliente **ainda via** a provisão pelo total (ver FSWTBC-3264).

**Módulo/Rota:** SIGAGCT → *Contratos* → incluir contrato (vigência 3 anos) → cronograma contábil (CNW) → campo *Provisionar?*
(`CNW_XPROV`) → rotina de provisão (`UGCTE01A`, nome de menu a confirmar) → tela de contabilização → SIGACTB → *Lançamentos*.
Nenhuma superfície no Fluig (o Acompanhamento e os datasets do Fluig não expõem parcelas CNW).

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Contrato de homologação criado pelo executor com vigência de 36 meses e cronograma contábil mensal.
- Credencial Protheus no SIGAGCT e SIGACTB.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: valor do lançamento de provisão e o flag CNW_XPROV das parcelas`.

**Passos**
1. SIGAGCT → incluir o contrato de homologação (36 parcelas mensais) e gerar o cronograma contábil.
2. Abrir o cronograma: ler *Provisionar?* (`CNW_XPROV`) parcela a parcela.
3. Executar a rotina de provisão para o contrato; na tela de contabilização, ler o valor total proposto; confirmar.
4. SIGACTB → *Lançamentos* → localizar a provisão do contrato.
5. Repetir 3–4 no mês seguinte (nova parcela entra na janela de 360 dias).

**Resultado esperado**
- Passo 2: parcelas com vencimento **até 360 dias** = `S`; além de 360 dias = `N`.
- Passo 3/4: valor provisionado = **soma das parcelas com `S`** (≈ 12 meses), nunca o total do contrato.
- Passo 5: provisão incremental da parcela que entrou na janela.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Provisão contabilizada pelo **valor total do contrato** (36 meses), ignorando `CNW_XPROV = N` (prints de 04/11/2025).

**Severidade:** Alta — contabilização incorreta de provisão.

**Preparação de massa:** contrato de homologação de 36 meses criado pelo executor; **não** usar `6175-2025-5303`.

**Verificado em tela:** NÃO
**O que foi verificado:** apenas que o Fluig não expõe parcelas CNW: o dataset de contratos não tem coluna `CNW*`/`PROV` (medição do L041; hoje o dataset volta vazio) e `dsProtheus_getProvisao_restGetAll` **não existe** (500 NPE).
**Divergências encontradas:** contrato `6175-2025-5303` não confirmado neste tenant (grade do Acompanhamento vazia no momento da busca).
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-3264  (protheus · Concluído · SDCASSI-146)

**Título:** Incluir uma nova revisão em contrato com provisão de curto/longo prazo já contabilizada e conferir que a provisão segue a revisão vigente em cada competência e que todas as contabilizações constam no contrato

**Origem:** FSWTBC-3264 — o contrato `00011-2022-1501` tinha valores no contábil que **não constavam no contrato**. Causa: a provisão de
Curto/Longo Prazo era calculada pela **nova** revisão em vez da **vigente**. Patch em 17/11; o teste do cliente em 18/11 **falhou**
("provisão gerada no valor total do contrato", contrato `6209-2025-5303`, 36 meses) — confusão documentada entre este ticket (produção) e o
SDCASSI-138 (homologação); sem MUD registrada.

**Módulo/Rota:** SIGAGCT → *Contratos* → *Revisão*; rotina de provisão CP/LP (nome a confirmar); SIGACTB → *Lançamentos*; consulta de
contabilizações por contrato (rotina/relatório a confirmar no cliente). Nenhuma superfície no Fluig.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Contrato de homologação com revisão `001` vigente e provisões CP/LP contabilizadas em pelo menos duas competências anteriores.
- Credencial Protheus no SIGAGCT e SIGACTB.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: valores da provisão CP/LP por competência e a lista de contabilizações do contrato`.

**Passos**
1. Registrar os lançamentos de provisão CP/LP das competências anteriores do contrato (valores e datas).
2. SIGAGCT → incluir a revisão `002` (aditivo de valor) com vigência a partir da competência atual.
3. Executar a provisão da competência atual; confirmar a contabilização.
4. SIGACTB → conferir: lançamentos anteriores **inalterados**; lançamento atual calculado pela revisão vigente na competência.
5. Abrir a consulta de contabilizações do contrato: todos os lançamentos do passo 1 e o do passo 3 aparecem.
6. Conferir a classificação CP × LP (parcelas ≤ 360 dias no CP).

**Resultado esperado**
- Passo 4: nada recalculado retroativamente; provisão atual = parcelas da revisão vigente, limitada a 360 dias (ver CT-FSWTBC-3139), **não** o total do contrato.
- Passo 5: contabilizações e contrato **coincidem** — nenhum lançamento "órfão".

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Valores no contábil que não constam no contrato; provisão recalculada pela nova revisão; provisão gerada pelo **valor total** (teste de 18/11/2025).

**Severidade:** Alta — divergência contábil.

**Preparação de massa:** contrato de homologação com histórico de provisões, preparado pelo executor; **não** usar `00011-2022-1501` nem `6209-2025-5303`.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — não há superfície (sem parcelas/lançamentos nos datasets).
**Divergências encontradas:** contratos `00011-2022-1501` e `6209-2025-5303` não confirmados neste tenant (grade vazia no momento da busca); o ticket mistura o ambiente de produção com a homologação da DEM10013766.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-3418  (protheus · Concluído · SDCASSI-81)

**Título:** Apurar corretagens de um período e ver a corretagem apurada listada com a data de apuração preenchida

**Origem:** FSWTBC-3418 — Título fala de "fluxo de apresentação das mensagens", mas o comentário técnico revela defeito de dado: a rotina de apuração (fonte `UFINE026.tlpp`) apurava e **não gravava `ZZ7_DTAPUR`**; como a listagem filtra `WHERE zz7_dtapur != ''`, a corretagem apurada ficava invisível. A query transcrita no ticket faz INNER JOIN com `CN9` exigindo `cn9_situac = '05'` — corretagem de contrato não vigente também some. Sem registro de causa nem de tratamento retroativo.

**Módulo/Rota:** Protheus · SIGAFIN (customização) · *Rotina de Apuração de Corretagens* (rotina customizada da DEM10011184 — nome de menu e código a confirmar no cliente; tabelas `ZZ7` corretagens apuradas, `ZZ5` corretoras).

**Pré-condições**
- Usuário Protheus com acesso à rotina customizada de apuração de corretagens.
- Uma corretora `QA` cadastrada (`ZZ5`) vinculada a um contrato **vigente** (`CN9_SITUAC = 05`) e a um cliente (`SA1`), com centro de custo e classe de valor válidos — as junções da listagem são INNER JOIN em todas essas tabelas.
- Um período de competência com base de cálculo que gere pelo menos uma corretagem para essa corretora.
- Variação de controle: uma corretora `QA2` ligada a contrato **não vigente** (ex.: Revisado 10) — para caracterizar o comportamento da listagem.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: registro ZZ7 gravado sem ZZ7_DTAPUR e ausente da listagem da rotina`. Sem credencial Protheus. A apuração é rotina de processamento — executar **somente** em base de homologação.

**Passos**
1. Abrir a *Rotina de Apuração de Corretagens*, informar o período e a corretora `QA`, e executar a apuração.
2. Ler cada mensagem exibida durante o processamento (o ticket pede que o fluxo de mensagens seja coerente: início, resultado, fim).
3. Ao final, abrir a listagem de corretagens apuradas da própria rotina e localizar a corretora `QA` no período.
4. Consultar a `ZZ7` do registro gerado (via browse da tabela ou relatório) e conferir `ZZ7_DTAPUR`.
5. Repetir os passos 1–3 para `QA2` (contrato não vigente).

**Resultado esperado**
- A apuração termina com mensagem de conclusão única e coerente (sem mensagem de erro seguida de sucesso, e sem "silêncio").
- O registro `ZZ7` gerado tem `ZZ7_DTAPUR` **preenchido** com a data da apuração.
- A corretagem `QA` **aparece** na listagem da rotina imediatamente após a apuração.
- Para `QA2`: o comportamento hoje é **não listar** (INNER JOIN com `cn9_situac='05'`). Registrar o observado; se a regra de negócio exige listar corretagem de contrato encerrado, é defeito a abrir — o ticket não decide isso.

**Resultado se o defeito reincidir**
- A rotina informa apuração concluída, mas a corretora não aparece na listagem; na `ZZ7`, `ZZ7_DTAPUR` está vazio.

**Severidade:** Alta *(valor financeiro apurado e invisível — pagamento de corretagem pode ser omitido ou duplicado)*

**Preparação de massa:** corretora `QA` e contrato `QA` vigente criados pelo executor no Protheus; base de cálculo do período configurada pelo time financeiro. Verificar antes se há registros históricos com `ZZ7_DTAPUR` vazio (o ticket não tratou o retroativo) — eles continuam invisíveis.

**Verificado em tela:** NÃO
**Módulo ERP:** `Financeiro e Contabil`
**O que foi verificado:** não há superfície no Fluig. Sondado por GET search: `dsProtheus_getCorretagens_restGetAll` e `dsProtheus_getApuracaoCorretagem_restGetAll` respondem **500 NPE** (não existem — nomes conjecturados; nenhum dataset com `corret` aparece nos fontes publicados baixados pelos lotes anteriores). `GET /api/public/ecm/dataset/datasets` (lista completa) respondeu 500 hoje, então a inexistência de qualquer dataset de corretagem é inferida, não provada.
**Divergências encontradas:** o título do ticket ("apresentação das mensagens") não descreve o defeito real (data de apuração não gravada). O caso cobre os dois.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3490  (protheus · Concluído · SDCASSI-168)

**Título:** Aprovar um contrato de Despesa Antecipada e encontrar a contabilização (provisão) gerada junto com a planilha financeira e o cronograma contábil

**Origem:** FSWTBC-3490 — Contrato 6203-2025-5303 (Despesa Antecipada – Licenciamento): planilha financeira e cronograma contábil gerados corretamente, mas a **contabilização (provisão) não foi gerada**. Quarto defeito consecutivo de provisão na DEM10013766 (rotina customizada `UGCTE01A`). Ajuste liberado em 09/01/2026 com um mês de atraso, **sem causa raiz documentada**.

**Módulo/Rota:** Protheus · SIGAGCT · *Contratos > Gestão de Contratos > Contratos* (aprovação/vigência do contrato, que dispara a rotina customizada de provisão `UGCTE01A`) e SIGACTB · *Consultas > Lançamentos Contábeis* / *Movimentos > Lançamento Contábil* (a confirmar no menu do cliente). Fluig: **nenhuma superfície** — contabilização não é exposta por dataset (`dsProtheus_getContabilizacao_restGetAll`: 500, inexistente; `dsProtheus_getCronograma_restGetAll`: 500).

**Pré-condições**
- Usuário Protheus com acesso ao SIGAGCT (aprovar contrato) e ao SIGACTB (consultar lançamentos).
- Contrato `QA` do tipo **Despesa Antecipada** (tipo de contrato equivalente ao 007 usado pelo 6203-2025-5303 — a confirmar), com planilha financeira e cronograma contábil gerados, em situação *Aprovação*.
- Parâmetros contábeis da provisão (lançamento padrão customizado) configurados no ambiente.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: ausência dos lançamentos de provisão no SIGACTB após a aprovação do contrato`. Sem credencial Protheus.

**Passos**
1. No SIGAGCT, abrir o contrato `QA` em *Aprovação* e conferir as abas *Planilha Financeira* e *Cronograma Contábil* (ambas preenchidas).
2. Aprovar o contrato (torná-lo *Vigente*).
3. Verificar se a tela/rotina de contabilização é apresentada e concluí-la.
4. No SIGACTB, consultar os lançamentos contábeis pelo documento/origem do contrato na data da aprovação.
5. Conferir valor total provisionado × valor do contrato e a segregação por parcela (CP/LP conforme o cronograma).

**Resultado esperado**
- Os lançamentos de provisão existem no SIGACTB para o contrato, na data da aprovação, com o total igual ao do cronograma contábil.
- A rotina não termina "com sucesso" sem gerar lançamento.

**Resultado se o defeito reincidir**
- Planilha e cronograma corretos, situação *Vigente*, e **nenhum** lançamento de provisão na contabilidade.

**Severidade:** Alta *(provisão contábil ausente — impacto direto em fechamento)*

**Preparação de massa:** contrato `QA` de Despesa Antecipada criado pelo executor no Protheus, com planilha e cronograma gerados; contas/lançamento padrão da provisão validados pelo contábil antes da execução. Não usar o 6203-2025-5303 (registro real, hoje em *Elaboração*).

**Verificado em tela:** NÃO
**Módulo ERP:** `Financeiro e Contabil`
**O que foi verificado:** o contrato do ticket **existe** no tenant: `6203-2025-5303`, tipo 007, origem SC (cotação 000257), situação *Elaboração* (02), vigência 21/09/2025–20/09/2030 — ou seja, **nunca chegou a Vigente** neste ambiente; nada de contabilidade é visível pelo Fluig.
**Divergências encontradas:** o ticket descreve o contrato como aprovado com planilha e cronograma; aqui ele está em *Elaboração*. O ambiente do ticket (DES) não é este.
**Dados/massa usados:** nenhum — leitura apenas.

---

## CT-FSWTBC-3603  (Fluig · Concluído · SDCASSI-28)

**Título:** Como fornecedor, enviar o BOOK trabalhista pelo Portal do Fornecedor ("Envio de Documentos Fiscais") e acompanhar a recepção no processo de documentos fiscais de contratos, com os dados do contrato vindos do Protheus DES

**Origem:** FSWTBC-3603 — "[CASSI - DEM10014383] - REPLICAÇAO DA BASE DES - GAP". Sem descrição; quarteto de 24/12/2025. O épico FSWTBC-2188 (DEM10014383) automatiza o envio do BOOK trabalhista (comprovação de obrigações trabalhistas dos terceirizados) **através do Portal do Fornecedor** — superfície Fluig. O gap de replicação se manifesta como o portal/processo não encontrando no DES os contratos/fornecedores necessários.

**Módulo/Rota:** Fluig → `/portal/p/1/portal_fornecedor` ("Portal do Fornecedor"; menu *Envio de Documentos Fiscais*) → processos `bpm_recepcao_documentos_fiscais_contratos` / `..._fiscais_contratos` (recepção pelo fiscal) / `..._compras`; dados de contrato/fornecedor via datasets `dsProtheus_*` sobre o Protheus DES.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Credencial de **fornecedor** ("Acesso Normal" ou "Acesso Administrador" do portal) vinculada a um fornecedor com contrato vigente no DES.
- Credencial de fiscal do contrato para a recepção.
- Um BOOK de teste (PDF) nomeado com prefixo `QA`.
- **Bloqueio:** sem credencial de fornecedor nem de fiscal (perfil que a conta de QA não tem); o início de `bpm_recepcao_documentos_fiscais_contratos` pela conta de QA devolve modal **"Erro"** (sem permissão) e `getDefinitionProcess` → 500. Bloqueio de Fluig, **não** SOMENTE PROTHEUS.

**Passos**
1. Abrir `/portal/p/1/portal_fornecedor`; conferir a página "Bem vindo ao Portal de Compras e Contratações!" com "Selecione o tipo de acesso." e as opções **Acesso Normal / Acesso Administrador / Acesso via Representatividade**, e o menu com **Envio de Documentos Fiscais**.
2. Entrar como fornecedor (Acesso Normal) e abrir *Envio de Documentos Fiscais*.
3. Selecionar o contrato vigente (lista vinda do DES) e a competência; anexar o BOOK `QA`; enviar.
4. Como fiscal, abrir a tarefa do processo de recepção de documentos fiscais de contratos e conferir os dados do contrato e o anexo.
5. Aprovar/recepcionar e verificar no Histórico da solicitação a conclusão.
6. Repetir o passo 3 com um contrato **encerrado** para confirmar que o portal não o lista.

**Resultado esperado**
- O portal lista os contratos vigentes do fornecedor (dados do DES) e aceita o BOOK.
- O processo de recepção é criado com o anexo e o fiscal o recebe; o envio fica rastreável (data, competência, anexo) — o objetivo declarado da DEM.
- Nenhum dataset do DES devolve vazio silencioso para fornecedor com contrato (ver A17-a).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Portal sem contratos ou processo sem dados do contrato porque o DES não foi replicado com fornecedores/contratos/dicionário da DEM — o "GAP"; o envio volta a ser manual por e-mail.

**Severidade:** Média — bloqueia o fluxo de conformidade trabalhista.

**Preparação de massa:** fornecedor de teste com contrato vigente no DES e credencial de portal (pelo dono do ambiente); BOOK `QA` criado pelo executor.

**Verificado em tela:** PARCIAL
**O que foi verificado:** `/portal/p/1/portal_fornecedor` → título "Cassi - Fluig Plataforma - Portal do Fornecedor"; rótulos "Bem vindo ao Portal de Compras e Contratações!", "Selecione o tipo de acesso.", "Acesso Normal", "Acesso Administrador", "Acesso via Representatividade", menu "Menu de Treinamentos | Primeiro Acesso | Cadastro do Fornecedor | Completar Cadastro | Participação em Cotações | Envio de Documentos Fiscais"; chamada `POST /cassi_rest/api/rest/cassi/compras/1/geratoken` → 200; 404 em `ly_portal_fornecedor/resources/js/wcm_widgets_pt_BR.js` (recurso de layout, ruído). `pageworkflowview?processID=bpm_recepcao_documentos_fiscais_contratos` → modal "Erro" / "Ok, entendi" e `getDefinitionProcess` → 500 (sem permissão para a conta de QA — coerente com o mapa). Não entrou no portal (sem credencial de fornecedor).
**Divergências encontradas:** o ticket é de infraestrutura Protheus, mas a DEM é entregue no Portal do Fornecedor (Fluig) — classificado como Fluig. O menu do portal chama a função de "Envio de Documentos Fiscais", não "BOOK trabalhista".
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3696  (protheus · Concluído · SDCASSI-204)

**Título:** Revisar um contrato com parcelas classificadas em curto e longo prazo e conferir que a provisão contábil da competência seguinte mantém a separação CP/LP herdada da revisão anterior

**Origem:** FSWTBC-3696 / incidente 794722 — o contrato `00012-2022-3301`, após reajuste na competência 12/25, contabilizou a provisão **inteiramente em longo prazo**. Causa (16/01/2026): "a revisão não traz as informações de LP/CP que foram definidas na revisão anterior". Reincidência do SDCASSI-146; encerrado por redirecionamento ao SDCASSI-84 / DEM10013766, **sem correção confirmada**.

**Módulo/Rota:** Protheus → SIGAGCT → *Contratos* → *Revisão* (reajuste) → *Outras Ações* → provisão contábil; conferência em SIGACTB → *Lançamentos Contábeis* (CT2). Nomes de menu **a confirmar no menu do cliente**. Não há superfície Fluig para CT2: o *Acompanhamento de Contratos* mostra apenas número, revisão (`CN9_REVISA`) e situação (*Revisão* / *Revisado*).

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Contrato de homologação com cronograma **contábil** de pelo menos 13 competências futuras, de modo que existam parcelas classificadas como curto prazo (≤ 12 meses) e longo prazo (> 12 meses).
- Provisão da competência anterior já apropriada e conferida (linha de base: valores CP e LP anotados).
- Tipo de contrato com *Contabiliza = Sim*.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: classificação CP/LP dos lançamentos de provisão (CT2) após a revisão`. Sem credencial Protheus; o contrato do ticket **não existe neste tenant**.

**Passos**
1. Anotar, no contrato de homologação, a classificação CP/LP de cada parcela do cronograma contábil na revisão vigente (campo *Apropriado* e a marcação LP/CP, conforme a tela).
2. Executar uma *Revisão* de reajuste (ex.: +5 %) e efetivá-la, mantendo as mesmas competências.
3. Reabrir o cronograma contábil da **nova** revisão e comparar a classificação CP/LP parcela a parcela com o passo 1.
4. Apropriar a provisão da competência seguinte (rotina de apropriação/provisão — ver CT-FSWTBC-3869 para o nome da rotina).
5. Em SIGACTB, consultar os lançamentos gerados para o contrato/competência e ler as contas de débito/crédito de cada parcela.

**Resultado esperado**
- Passo 3: a nova revisão **herda** a classificação CP/LP da revisão anterior; nenhuma parcela muda de CP para LP só por ter sido reajustada.
- Passo 5: as parcelas com vencimento ≤ 12 meses lançam nas contas de **curto prazo** e as demais nas de **longo prazo**; o total provisionado = CP + LP, com o valor reajustado.
- O campo *Apropriado* das parcelas já apropriadas permanece marcado após a revisão.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Toda a provisão da competência (ex.: 12/25) lançada **em longo prazo**, sem separação; o campo *Apropriado* zerado/perdido na nova revisão.

**Severidade:** Alta — distorce o balanço (CP × LP) e a provisão.

**Preparação de massa:** contrato de homologação com cronograma contábil ≥ 13 competências e uma provisão já apropriada, criado/preparado pelo executor no Protheus com `QA` na descrição. Exige credencial Protheus e alinhamento com Contabilidade, pois apropriar gera lançamento (usar período de homologação).

**Verificado em tela:** NÃO
**O que foi verificado:** o contrato `00012-2022-3301` **não consta** entre as 963 linhas de `dsProtheus_getContratos_restGetAll`; não existe dataset de cronograma/contabilização no Fluig (GET search → 500 NPE).
**Divergências encontradas:** o ticket cita a TST; a base de homologação ligada a este Fluig não tem o contrato.
**Dados/massa usados:** nenhum — leitura do dataset de contratos.

---

## CT-FSWTBC-3768  (protheus · Concluído · SDCASSI-228)

**Título:** Aprovar um contrato novo com controle orçamentário e conferir que o PCO recebe o lançamento de empenho (saldo 51 — Empenhado Contratos) na efetivação

**Origem:** FSWTBC-3768 — após a sala de entrega de 20/01/2026, os novos contratos cadastrados e aprovados **não geraram lançamento no PCO** (objeto central da DEM10011808). Encerrado como "Não será feito", com a validação transferida para depois da migração à release 2510 — **sem confirmação** de que o lançamento passou a ocorrer. Ver também CT-FSWTBC-3863 (mesma falha, com o parâmetro de alçada desligado).

**Módulo/Rota:** Protheus → SIGAGCT → *Contratos* → *Incluir* → *Aprovar/Efetivar* (alçada, parâmetro `MV_XALCGCT`); conferência em SIGAPCO → *Consulta de Saldos / Movimentos* (tabela AKD, tipo de saldo 51). Nomes de menu **a confirmar no menu do cliente**. Superfície Fluig adjacente (não é cobertura): *Acompanhamento de Contratos* mostra a situação do contrato passar a **Vigente**, e o Histórico do *Faturamento de Contratos* mostra bloqueio do PCO na **medição** (`ERROR_PCO` → *Correção*) — ponto diferente do empenho na efetivação.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Produto com classe orçamentária (`B1_XCTAC`, cf. FSWTBC-3863) e centro de custo com saldo na planilha orçamentária do **exercício corrente**.
- Parâmetro de alçada de contratos (`MV_XALCGCT`) **ligado**; tipo de contrato com controle orçamentário.
- Usuário aprovador da alçada de contratos.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: registro na AKD (saldo 51 Empenhado Contratos) e consumo do saldo da classe orçamentária`. Sem credencial Protheus.

**Passos**
1. Em SIGAPCO, consultar e anotar o saldo da classe orçamentária/centro de custo do produto para o mês corrente (disponível, empenhado 51).
2. Em SIGAGCT, incluir um contrato de homologação (`QA` na descrição) com uma planilha de um item, valor pequeno (ex.: R$ 100,00), no produto/CC do passo 1.
3. Enviar para aprovação e aprovar pela alçada.
4. Conferir a situação do contrato (deve ficar *Vigente*/*Emitido*, conforme o tipo).
5. Em SIGAPCO, repetir a consulta do passo 1; abrir os movimentos (AKD) filtrando pelo contrato.
6. (Fluig, contraprova) Abrir *Acompanhamento de Contratos*, filtrar pelo número e ler a coluna de situação.

**Resultado esperado**
- Passo 5: existe movimento na AKD para o contrato com **tipo de saldo 51** e valor igual ao contrato; o saldo *disponível* da classe caiu no mesmo valor e o *empenhado* subiu.
- Passo 4/6: contrato *Vigente* no ERP e no Fluig; sem contrato vigente **sem** empenho.
- Se não houver saldo orçamentário, a aprovação é **recusada** com mensagem citando classe/centro de custo (não aprova sem empenhar).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Contrato aprovado e vigente, **AKD sem nenhuma linha** para ele (print `AKD.png` do ticket: tabela vazia); saldo da classe intacto.

**Severidade:** Alta — empenho orçamentário não registrado (risco financeiro/orçamentário).

**Preparação de massa:** contrato de homologação criado pelo executor (valor mínimo, `QA`), produto/CC com saldo orçamentário no exercício corrente e alçada ligada — tudo no Protheus, com credencial. Não usar contrato pré-existente.

**Verificado em tela:** NÃO
**O que foi verificado:** superfícies Fluig adjacentes abertas: *Acompanhamento de Contratos* (845 linhas, coluna de situação com mapa `05 = Vigente`, `02 = Elaboração`, `04 = Aprovação`); estado do Faturamento com 7 instâncias em *Correção* por `ERROR_PCO` (dado de 08/09, não remedido). Nenhuma delas mostra a AKD.
**Divergências encontradas:** nenhuma quanto a rótulos; o ticket não indica a tela de consulta da AKD usada.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3815  (protheus · Concluído · SDCASSI-242)

**Título:** Encerrar a medição mensal de um contrato contabilizado e conferir que o lançamento contábil sai com tipo de saldo 1 e contas de débito/crédito preenchidas

**Origem:** FSWTBC-3815 / incidente 797579 — a parcela 11/2025 do contrato `00003-2022-5001` foi contabilizada com **tipo de saldo 9** (não contabiliza) e `CT2_DEBITO`/`CT2_CREDITO` = *Cta vza* (conta vazia), enquanto as demais parcelas saíram com tipo 1. Não reproduzido pelo analista (estorno + novo encerramento saíram corretos); encerrado **sem causa raiz**, com contorno manual. Não há monitoramento que detecte CT2 com contas vazias.

**Módulo/Rota:** Protheus → SIGAGCT → *Medição de Contratos* → *Encerrar* (gera pedido e contabiliza); conferência em SIGACTB → *Lançamentos Contábeis* (CT2: `CT2_TPSALD`, `CT2_DEBITO`, `CT2_CREDITO`). Nomes de menu **a confirmar no menu do cliente**. Superfície Fluig adjacente (**não é cobertura**): quando a medição é feita pelo Fluig, o Histórico do *Faturamento de Contratos* registra `Integração executada com sucesso` na atividade *Gravar/Encerrar Medição* (105) — mas **não** mostra o lançamento.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Contrato de homologação vigente, tipo com *Contabiliza = Sim*, lançamento padrão configurado, com pelo menos duas competências a medir.
- Produto com contas contábeis preenchidas (débito/crédito resolvidas pelo lançamento padrão).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: tipo de saldo e contas do lançamento CT2 gerado no encerramento da medição`. Sem credencial Protheus; o contrato do ticket **não existe neste tenant**.

**Passos**
1. Encerrar a medição da competência N do contrato de homologação (pela rotina do ERP ou pelo Fluig, *Faturamento de Contratos*).
2. Em SIGACTB, localizar os lançamentos gerados (filtrar por contrato/medição ou pelo histórico do lançamento).
3. Ler `CT2_TPSALD`, `CT2_DEBITO`, `CT2_CREDITO`, valor e histórico de **cada** linha.
4. Encerrar a medição da competência N+1 e repetir 2–3.
5. (Monitoramento) Rodar uma consulta em CT2 do período filtrando `CT2_DEBITO` vazio **ou** `CT2_CREDITO` vazio **ou** `CT2_TPSALD = 9` para lançamentos com origem em contratos.

**Resultado esperado**
- Passos 3–4: todas as linhas com **tipo de saldo 1**, débito e crédito preenchidos com as contas do lançamento padrão, valor igual à parcela.
- Consistência entre competências: N e N+1 usam as mesmas contas e o mesmo tipo de saldo.
- Passo 5: a consulta devolve **zero** linhas para o período.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Uma parcela isolada com `CT2_TPSALD = 9` e `CT2_DEBITO`/`CT2_CREDITO` = *Cta vza*, sem erro na tela e sem registro no Histórico do Fluig.

**Severidade:** Alta — integridade contábil (lançamento que não contabiliza passa despercebido).

**Preparação de massa:** contrato de homologação contabilizado com ≥ 2 competências a medir, preparado pelo executor no Protheus; se a medição for aberta pelo Fluig, o executor precisa ser fiscal do contrato (a conta de QA não é). Encerramento gera pedido e lançamento — só em competência de homologação.

**Verificado em tela:** NÃO
**O que foi verificado:** o contrato `00003-2022-5001` não consta nas 963 linhas do dataset de contratos; a atividade que encerra a medição hoje chama-se **"Gravar/Encerrar Medição" (105)** na v52 do `wf_faturamento_contratos` (1.000 movimentos lidos).
**Divergências encontradas:** nenhuma quanto ao ticket; anotação: o Fluig não expõe CT2 em nenhuma tela.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3863  (protheus · Concluído · SDCASSI-250)

**Título:** Alterar um contrato para Vigente com a alçada de contratos ligada e conferir que a AKD recebe o empenho (saldo 51) na classe orçamentária do produto

**Origem:** FSWTBC-3863 — contratos alterados para *Vigente* **não geraram lançamento na AKD**: `00001-2023-1101` (contabiliza = Não) e `000000000000219` fil. 5303 (contabiliza = Sim). Dois achados: (1) o parâmetro de alçada `MV_XALCGCT` estava **desligado**, então o contrato nem entrava em aprovação (mesmo que FSWTBC-2890); (2) o lançamento sensibilizava a classe 441193 quando deveria ser 441063 (`B1_XCTAC`), dúvida deixada em aberto. Encerrado "Não será feito", **sem validação**.

**Módulo/Rota:** Protheus → *Configurador* → *Parâmetros* → `MV_XALCGCT`; SIGAGCT → *Contratos* → *Aprovar/Efetivar*; SIGAEST/SIGACOM → *Produtos* → `B1_XCTAC`; SIGAPCO → *Movimentos* (AKD). Nomes de menu **a confirmar no menu do cliente**. Contraprova Fluig (**não é cobertura**): *Acompanhamento de Contratos* mostra a situação (`02 Elaboração` → `04 Aprovação` → `05 Vigente`) — dá para ver **se** o contrato passou por *Aprovação*, sinal de que a alçada estava ligada.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- `MV_XALCGCT` **ligado** (conferir antes; foi encontrado desligado duas vezes).
- Produto de homologação com `B1_XCTAC` = classe orçamentária esperada (ex.: 441063) e centro de custo com saldo no exercício corrente.
- Contrato de homologação em *Elaboração* com esse produto — pode ser o `000000000000219` (fil. 5303, sit. 02, tipo 058, R$ 37.593,64), que **existe neste tenant**, desde que o dono do ambiente autorize.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: linha na AKD com tipo de saldo 51 e a classe orçamentária sensibilizada`. Sem credencial Protheus.

**Passos**
1. Ler `MV_XALCGCT`; se desligado, registrar e ligar (com autorização).
2. Anotar em SIGAPCO o saldo da classe `B1_XCTAC` do produto e da classe "errada" citada (441193).
3. Enviar o contrato para aprovação e aprovar; conferir que passou por *Aprovação* e ficou *Vigente*.
4. Em SIGAPCO, listar os movimentos da AKD do contrato: tipo de saldo, classe, centro de custo, valor.
5. Repetir com um segundo contrato de tipo *Contabiliza = Não* (a AKD não depende da CT2 — o ticket testou os dois).
6. (Fluig) *Acompanhamento de Contratos* → filtrar pelo número → ler a situação.

**Resultado esperado**
- Passo 3: com a alçada ligada, o contrato **passa** por *Aprovação* antes de *Vigente*.
- Passo 4: uma linha na AKD com **tipo de saldo 51**, na classe **`B1_XCTAC` do produto** (441063 no exemplo), CC do rateio, valor do contrato; a classe 441193 **não** é sensibilizada.
- Passo 5: o empenho ocorre igualmente com *Contabiliza = Não*.
- Passo 6: situação *Vigente* no Fluig, coerente com o ERP.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Contrato *Vigente* e AKD **vazia** para ele (`AKD.png`); ou empenho na classe 441193 em vez de 441063; ou contrato indo direto a *Vigente* sem *Aprovação* (parâmetro desligado).

**Severidade:** Alta — empenho orçamentário ausente ou na classe errada.

**Preparação de massa:** produto de homologação com `B1_XCTAC` preenchido e contrato em *Elaboração* (criado pelo executor com `QA`, ou o `000000000000219` mediante autorização, pois aprová-lo é irreversível). Exige credencial Protheus e perfil aprovador.

**Verificado em tela:** NÃO
**O que foi verificado:** via dataset `dsProtheus_getContratos_restGetAll` (GET search, 963 linhas): `000000000000219` existe (filial 5303, situação **02 Elaboração**, tipo 058, início 24/03/2025, fim 24/03/2026, valor = saldo = 37.593,64, `CN9_XSC = 2`); `00001-2023-1101` e `00001-2026-5304` **não existem**. Mapa de situação lido do fonte publicado (`statusFallbackMap`: 02 Elaboração, 04 Aprovação, 05 Vigente).
**Divergências encontradas:** o contrato 219 continua em *Elaboração* neste tenant — a alteração para Vigente relatada não está refletida aqui.
**Dados/massa usados:** leitura do dataset de contratos — nada submetido.

---

## CT-FSWTBC-3935  (protheus · Concluído · SDCASSI-274)

**Título:** Alterar um pedido de compras emitido no exercício anterior, já no exercício novo, e conferir que a trava orçamentária consulta a planilha do exercício corrente e libera a alteração quando há saldo

**Origem:** FSWTBC-3935 / incidente 800032 — não era possível alterar o pedido `002840` (filial 3514): "não há saldo nas classes e contas orçamentárias", embora o saldo existisse; o cliente notou que "o Protheus está olhando para a planilha de **2025**, mesmo o produto sendo alterado em **2026**". Resolvido em call, **sem registro do que foi feito** ("aparentemente está OK"); a virada de exercício se repete todo ano.

**Módulo/Rota:** Protheus → SIGACOM → *Pedido de Compras* → *Alterar* (trava orçamentária do PCO) e SIGAPCO → *Planilha Orçamentária* por exercício / *Movimentos* (AKD); rotinas da DEM10011808 de processamento de empenhos do novo exercício e migração de empenhos não baixados. Nomes de menu **a confirmar no menu do cliente**. Superfície Fluig adjacente (**não é cobertura**): o bloqueio do PCO na geração do **pedido pela medição** aparece só no Histórico do *Faturamento de Contratos* (`ERROR_PCO` → *Correção* 117 — 7 instâncias hoje); a alteração de pedido é só ERP.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Planilha orçamentária do exercício corrente cadastrada, com saldo na classe/CC do produto do pedido.
- Pedido de compras de homologação **emitido no exercício anterior**, em aberto (não recebido), com empenho na AKD do exercício anterior.
- Rotina de virada/migração de empenhos executada conforme o procedimento do cliente (registrar qual).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: mensagem da trava orçamentária e o exercício da planilha consultada (AKD)`. Sem credencial Protheus.

**Passos**
1. Em SIGAPCO, anotar o saldo da classe/CC do produto nos exercícios anterior e corrente.
2. Em *Pedido de Compras* → *Alterar*, abrir o pedido de homologação e aumentar a quantidade de um item em 1 unidade; confirmar.
3. Ler a mensagem da trava (se houver): classe, conta, exercício citado.
4. Em SIGAPCO → *Movimentos* (AKD), listar os movimentos do pedido após a alteração: exercício/competência, tipo de saldo, valor.
5. Repetir o passo 2 com um valor que **exceda** o saldo do exercício corrente.

**Resultado esperado**
- Passo 2: alteração aceita quando há saldo no **exercício corrente**.
- Passo 4: o empenho da diferença cai na competência/exercício **corrente**; o exercício anterior não é consultado nem movimentado.
- Passo 5: a trava recusa citando classe/conta **e o exercício corrente**, com o saldo real.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Mensagem de falta de saldo nas classes/contas orçamentárias (`Screenshot_19.png`) com saldo disponível no exercício corrente — a consulta lendo a planilha do exercício anterior.

**Severidade:** Alta — bloqueio indevido de compras e empenho no exercício errado.

**Preparação de massa:** pedido de homologação emitido no exercício anterior (ou base com data de sistema ajustada em homologação) e planilha orçamentária do exercício corrente com saldo — preparados pelo executor no Protheus com credencial; `QA` na observação do pedido.

**Verificado em tela:** NÃO
**O que foi verificado:** não há dataset de pedidos no Fluig (`dsProtheus_getPedidos_restGetAll` e `dsProtheus_getPedidoCompra_restGetAll` → 500 NPE no GET search); a única manifestação de trava do PCO no Fluig é o `ERROR_PCO` no Histórico do Faturamento (estado de 08/09, não remedido).
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4052  (protheus · Em Homologação · SDCASSI-287)

**Título:** Cadastrar uma corretora pela API de Corretoras, apurar a corretagem e gerar o pedido de compra da medição na data correta

**Origem:** FSWTBC-4052 — DEM10011184 Despesas de Comercialização: cascata de sete defeitos na API de Corretora (obrigatoriedade indevida de `M02ZZ6`; cadastro gravado incompleto; duplicidade de handle aceita; alteração não concluía; "não foram encontradas corretoras para o período" por saldo zerado quando *quantidade de meses a apropriar* ficava vazia; pedido gerado pela medição com a data da competência e não a do dia; listagem abrindo vazia por empresa/filial em branco). Ticket ainda **Em Homologação**.

**Módulo/Rota:** Protheus — app web *Cadastro de Corretoras* (repositório de objetos), rotina *Despesas a Apropriar* e apuração de corretagem da DEM10011184 (nomes de menu a confirmar no menu do cliente). No Fluig **não existe** rota: `/portal/p/1/corretoras`, `/cadastro_corretora` e `/apuracao_corretagens` respondem *Recurso não foi encontrado* (404).

**Pré-condições**
- Acesso ao Protheus na base DES/COMP com o pacote de 26/08 aplicado em `CC54GO_DES` e `CC54GO_DES_REST` **e AppServer reiniciado** (o ticket registra que sem o restart a homologação não vale).
- Um contrato GCT vigente para vincular à corretora; uma competência com corretagens apuradas.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: registro da corretora (tabelas da DEM10011184), saldo a apropriar e data de emissão do pedido de compra gerado pela medição`. Sem credencial de Protheus nesta rodada.

**Passos**
1. Abrir o app *Cadastro de Corretoras* diretamente pela listagem (não pela tela de edição) e confirmar que a lista carrega com empresa/filial preenchidos.
2. Incluir uma corretora `QA-<sufixo>` com `handle` inédito, **sem** preencher `M02ZZ6`, informando regras de pagamento, contrato GCT vinculado e *quantidade de meses a apropriar* = 1.
3. Reabrir o registro e conferir que regras de pagamento e contrato vinculado foram persistidos.
4. Tentar incluir uma segunda corretora com o **mesmo** `handle`.
5. Alterar a corretora (qualquer campo) e salvar.
6. Tentar incluir outra corretora com *quantidade de meses a apropriar* vazia ou zero.
7. Executar a apuração de corretagem na competência e, em seguida, *Despesas a Apropriar* no mesmo período.
8. Gerar a medição/pedido de compra numa data diferente da competência apurada (ex.: medição em 20 do mês para competência de 01) e abrir o pedido gerado.

**Resultado esperado**
- Passo 1: listagem abre com registros; nenhum HTTP 500 sem mensagem.
- Passo 2: inclusão aceita sem exigir `M02ZZ6`; passo 3: regras de pagamento e contrato vinculado presentes.
- Passo 4: recusa com `Corretora com o codigo handle ja cadastrada`.
- Passo 5: alteração concluída e refletida na consulta.
- Passo 6: recusa explícita informando o valor mínimo aceito para *quantidade de meses a apropriar*.
- Passo 7: *Despesas a Apropriar* encontra a corretora do período; saldo a apropriar diferente de zero.
- Passo 8: o pedido de compra nasce com a **data do dia da medição**, não com a data da competência.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Inclusão barrada por obrigatoriedade de `M02ZZ6`; cadastro gravado sem regras/contrato; segunda inclusão com o mesmo `handle` aceita; alteração não concluída.
- `nao foram encontradas corretoras para o periodo` mesmo com corretagens apuradas (saldo gravado zerado em silêncio).
- Medição em 20/08 gerando pedido datado de 01/08.
- Tela de corretoras abrindo vazia com HTTP 500 sem mensagem.

**Severidade:** Alta — apropriação de despesa e data de pedido de compra (efeito contábil/financeiro).

**Preparação de massa:** corretora `QA-*` criada pelo próprio executor no Protheus; contrato GCT vigente já existente; competência com corretagem apurada. Nada disso é criável pelo Fluig.

**Módulo ERP:** `Financeiro e Contabil`
**Verificado em tela:** NÃO
**O que foi verificado:** sondado o Fluig por rotas `corretoras`, `cadastro_corretora`, `apuracao_corretagens` — todas 404 (*Recurso não foi encontrado*); `GET search` de `dsProtheus_getCorretoras_restGetAll` → 500 `NullPointerException` (dataset inexistente). Confirma que a funcionalidade não tem superfície no Fluig.
**Divergências encontradas:** nenhuma no Fluig (funcionalidade inteira no ERP).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4115  (protheus · Concluído · SDCASSI-298)

**Título:** Contabilizar o reajuste de um contrato com juros e localizar o lançamento dos juros na consulta contábil

**Origem:** FSWTBC-4115 — reajuste de fevereiro de R$ 18.682,56 aparecia com apenas R$ 16.434,87 contabilizado no contrato 0001-2021-3509. Não faltava valor: o histórico do LP **69G** (`CT5_HIST`, seq. 001/002) provocava **quebra de linha na CT2**, e o lançamento dos juros não era localizado na consulta. Correção feita pelo cliente ajustando o `CT5_HIST`.

**Módulo/Rota:** Protheus — *Contabilidade Gerencial* → consulta de lançamentos (CT2) / *Configurador* → Lançamentos Padrão (LP 69G); GCT → reajuste de contrato. Nomes de menu a confirmar no menu do cliente.

**Pré-condições**
- Contrato GCT com **juros cadastrados** e reajuste programado na competência.
- LP 69G com sequências 001 e 002 ativas; parâmetro de contabilização on-line habilitado.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: linhas da CT2 geradas pelo LP 69G e o conteúdo de CT5_HIST`. O contrato do ticket (`0001-2021-3509`) **não existe** neste tenant.

**Passos**
1. No GCT, aplicar o reajuste da competência ao contrato (rotina de reajuste do menu do cliente).
2. Na consulta de lançamentos contábeis, filtrar pela data/competência do reajuste e pelo contrato.
3. Somar os lançamentos gerados pelo LP 69G (reajuste + juros).
4. Abrir o histórico (`CT2_HIST`) de cada linha e verificar se o texto ocupa **uma única linha**, sem caractere de quebra.
5. Comparar o total com o valor do reajuste esperado (principal + juros).

**Resultado esperado**
- Existem lançamentos distintos para reajuste e para juros, ambos localizáveis pela consulta.
- Histórico de cada lançamento em uma linha, sem quebra.
- Soma dos lançamentos = valor total do reajuste com juros (no ticket: R$ 18.682,56).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Consulta mostrando apenas o principal (R$ 16.434,87); os juros (R$ 2.247,69) "não encontrados" por quebra de linha no histórico do LP 69G.

**Severidade:** Alta — contábil.

**Preparação de massa:** contrato com juros e reajuste na competência, criado/ajustado no GCT pelo executor ou pela equipe de contratos. Sem criação possível pelo Fluig.

**Módulo ERP:** `Financeiro e Contabil`
**Verificado em tela:** NÃO
**O que foi verificado:** `dsProtheus_getContratos_restGetAll` (963 linhas) não contém `0001-2021-3509`, `00001-2021-3509` nem qualquer número com `3509`; `dsProtheus_getReajusteContrato_restGetAll` é conhecido de lotes anteriores, mas não expõe lançamento contábil. Sem superfície.
**Divergências encontradas:** contrato do ticket inexistente neste tenant.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4306  (protheus · Concluído · SDCASSI-343)

**Título:** Executar a Transferência LP→CP para todas as filiais com "não ver lançamento" e receber uma única mensagem consolidada ao final

**Origem:** FSWTBC-4306 — na rotina de apropriação/transferência LP→CP (`UGCTE002`), a mensagem `nao foram encontradas parcelas para o processamento` era exibida **a cada filial** sem parcelas quando se selecionava todas, parando o lote a cada clique. Correção: mensagem única após todas as filiais; `ProcRegua`/`DbSelectArea('CNW')` só quando há dados; variáveis `lLancCtb/lAglutina/nSepPor` locais.

**Módulo/Rota:** Protheus — GCT → rotina *Transferência LP-CP* / apropriação de parcelas (`UGCTE002`; nome de menu a confirmar no menu do cliente).

**Pré-condições**
- Empresa com várias filiais, a maioria **sem** parcelas de Longo Prazo elegíveis na competência, e ao menos uma **com** parcelas.
- Parâmetro/opção *não ver lançamento* disponível na tela da rotina.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: caixas de mensagem da rotina e lançamentos CNW/CT2 gerados`. Sem credencial de Protheus. Rotina em lote: executar apenas em base de homologação e com aval do dono do ambiente.

**Passos**
1. Abrir a rotina de transferência LP→CP e selecionar **todas** as filiais.
2. Marcar a opção *não ver lançamento* e confirmar.
3. Cronometrar e contar as caixas de mensagem exibidas até o fim.
4. Repetir com a opção *ver lançamento* marcada.
5. Conferir na consulta contábil que as parcelas da filial com dados foram transferidas.

**Resultado esperado**
- Passo 3: **uma** mensagem de conclusão ao final, consolidando as filiais sem parcelas; nenhuma parada intermediária.
- Passo 4: lançamentos exibidos só para as filiais que geraram movimento.
- Passo 5: transferência efetivada apenas onde havia parcelas; filiais sem parcelas sem lançamento.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `nao foram encontradas parcelas para o processamento` uma vez **por filial**, exigindo um clique cada e alongando o processamento.

**Severidade:** Média — bloqueia/atrasa o fechamento em lote.

**Preparação de massa:** parcelas LP em uma filial na competência (equipe de contratos); demais filiais sem parcelas. Não criável pelo Fluig.

**Módulo ERP:** `Financeiro e Contabil`
**Verificado em tela:** NÃO
**O que foi verificado:** nenhuma superfície: o Fluig não expõe parcelas LP/CP nem a rotina (datasets `dsProtheus_getParcelasContrato_restGetAll` / `getCronogramaFinanceiro` não existem — GET search 500 NPE).
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4307  (protheus · Concluído · SDCASSI-344)

**Título:** Transferir para Curto Prazo a parcela de um contrato com várias planilhas e obter o valor da medição atual de cada planilha

**Origem:** FSWTBC-4307 — contrato 0328-102024, parcela 0023 (R$ 27.921,88) transferida com R$ 2.915,00. O valor reportado estava **correto** (planilha 0003, produto de R$ 3.300,00 com 88% de participação, retirado das despesas antecipadas na revisão 003); o defeito real era outro: produto da planilha 0001 deixou de ser contabilizado porque `ProcCNZ` (`UGCTE003`) filtrava por `!Empty(CNZ_NUMMED)` e não pela medição atual de **cada planilha** (`GetMedPlanilha` = `MAX(CNE_NUMMED)` por `CNZ_CODPLA`). Um patch intermediário **impediu revisão em todos os contratos** (rollback em COMP); depois o 00016-2024-5303 "dobrou na apropriação".

**Módulo/Rota:** Protheus — GCT → *Transferência LP-CP* / apropriação de despesa antecipada (`UGCTE003`); *Revisão de Contrato*; consulta contábil (CT2). Nomes de menu a confirmar no menu do cliente.

**Pré-condições**
- Contrato com **≥ 2 planilhas** com rateio CNZ, medidas em competências diferentes, com produtos marcados como despesa antecipada (`CNW_XDA`).
- `MV_CTBFLAG = .T.`.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: valor transferido para CP por parcela e lançamentos por planilha (CT2/CNW)`. Sem credencial de Protheus. O contrato do ticket existe neste tenant (`0328-102024`, rev 003 vigente).

**Passos**
1. No GCT, abrir o contrato e anotar, por planilha, o número da última medição (`CNE_NUMMED`) e os produtos com rateio (CNZ).
2. Executar a transferência LP→CP da parcela da competência.
3. Na consulta contábil, listar os lançamentos gerados e agrupá-los por planilha.
4. Comparar cada valor com: valor do produto × % de participação (CNZ_PERC) da **medição atual daquela planilha**.
5. Abrir o mesmo contrato em *Revisão de Contrato* e iniciar (sem salvar) uma nova revisão.
6. Executar a apropriação do mês seguinte e conferir que nenhum valor sai em dobro.

**Resultado esperado**
- Passo 3/4: todas as planilhas com produtos de despesa antecipada geram lançamento, cada uma pela **sua** medição atual; nenhuma planilha ausente.
- Passo 5: a revisão abre normalmente (sem a mensagem que bloqueou todos os contratos em 18/06).
- Passo 6: valores iguais aos da competência anterior (sem dobra).
- Não há `GravaCV8` de performance por transação aberta (`Begin Transaction` removido).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Produto da planilha 0001 fora da contabilização; valor transferido menor que o esperado (no ticket, R$ 2.915,00 lido como erro).
- Mensagem impedindo revisão em todos os contratos (regressão do patch).
- Valor dobrando na apropriação (00016-2024-5303).

**Severidade:** Alta — contábil.

**Preparação de massa:** contrato multi-planilha com CNZ e despesa antecipada (equipe de contratos). Contraprova de estrutura disponível no Fluig (abaixo).

**Módulo ERP:** `Financeiro e Contabil`
**Verificado em tela:** NÃO
**O que foi verificado:** contraprova de massa no Fluig — `0328-102024` existe com revisões "", 001, 002 (`CN9_SITUAC=10`) e 003 (`CN9_SITUAC=05`, `CN9_SALDO` 155.100,00, fiscal `FERNANDA.MELO@...`); `dsProtheus_getItensPlanilha_restGetAll` (rev 003) devolve planilha 000001 (5 itens, produto 04001237), 000002 (2 itens, 00000579) e **000003 com produtos 00000712, 04001388 e 04001396 a R$ 3.300,00** — o produto/valor citados no ticket. Efeito contábil não observável no Fluig.
**Divergências encontradas:** o ticket cita "parcela 0023"; o Fluig não expõe parcelas.
**Dados/massa usados:** leitura de dataset; nenhum registro criado.

---

## CT-FSWTBC-4315  (protheus · Concluído · SDCASSI-348)

**Título:** Executar a Apropriação de Despesa Antecipada em dois meses consecutivos e obter, em cada mês, apenas o valor da competência

**Origem:** FSWTBC-4315 — contrato 00016-2024-5303 rev 001: R$ 85.094,03 a apropriar em 03/2026 contabilizados como **R$ 170.188,06** (LP 154 seq. 001). `ProcCNZ` (`UGCTE003`) filtrava por `!Empty(CNZ_NUMMED)` e recontabilizava todo o histórico da CNZ a cada mês. Correção: `CNZ_NUMMED == GetUltMed(...)`. O patch de log intermediário gerou `type mismatch on unary +` em `DOCTBDA` (linha 165).

**Módulo/Rota:** Protheus — GCT → *Apropriação de Despesa Antecipada* (`UGCTE003`); consulta contábil (CT2) filtrando LP 154. Nomes de menu a confirmar no menu do cliente.

**Pré-condições**
- Contrato com despesa antecipada e **CNZ acumulando medições de ≥ 2 competências** (exatamente o cenário do 00016-2024-5303).
- Competência anterior já apropriada.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: lançamentos LP 154 seq. 001 (CT5_VLR01) e log da rotina`. Sem credencial de Protheus.

**Passos**
1. Anotar o valor a apropriar da competência (contrato, revisão, planilha).
2. Executar a apropriação da competência.
3. Na consulta contábil, filtrar LP 154 / seq. 001 do contrato na competência e somar.
4. Executar a apropriação da competência **seguinte** e repetir o passo 3.
5. Abrir o log da rotina (arquivo de log da UGCTE003) e procurar `type mismatch` / `THREAD ERROR`.

**Resultado esperado**
- Passo 3: soma **igual** ao valor a apropriar (no ticket, R$ 85.094,03), um lançamento por planilha/medição atual.
- Passo 4: apenas a nova competência; medições históricas não são recontabilizadas.
- Passo 5: log com início/fim/contratos processados e **sem** erro de tipagem.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Valor em dobro (R$ 170.188,06) e, com mais meses acumulados, em triplo.
- `type mismatch on unary +` em `DOCTBDA(UGCTE003.PRW)` linha 165.

**Severidade:** Alta — contábil (duplicação mensal de lançamento).

**Preparação de massa:** contrato com CNZ multi-competência (equipe de contratos). Não criável pelo Fluig.

**Módulo ERP:** `Financeiro e Contabil`
**Verificado em tela:** NÃO
**O que foi verificado:** contraprova de massa — `00016-2024-5303` existe (rev "" `CN9_SITUAC=10`, `CN9_SALDO` 1.122.906,67; rev 001 `CN9_SITUAC=05`, saldo 21.692,54; tipo 080; vigência 22/02/2024–22/02/2027), com planilhas 000001 e 000002 (002 SEMI FIXA) e 000003 (001 FIXA, produto 04000346, R$ 1.021.128,33 × 2). Lançamento contábil não observável no Fluig.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** leitura de dataset; nenhum registro criado.

---

## CT-FSWTBC-4558  (protheus · Concluído · SDCASSI-412)

**Título:** Transferir de LP para CP a parcela de um contrato com duas planilhas medidas em períodos diferentes e obter a soma das duas

**Origem:** FSWTBC-4558 — a transferência LP→CP (`UGCTE002`) considerava apenas a primeira planilha: soma das planilhas 1 e 2 = 146.018,30 (129.417,57 + 16.600,73, contrato 00020-2026-5303/001), mas só a planilha com a medição mais recente entrava. Causa: "última medição do **contrato**" em vez de "última medição de **cada planilha**" (mesmo erro conceitual do `UGCTE003`, SDCASSI-344).

**Módulo/Rota:** Protheus — GCT → *Transferência LP-CP* (`UGCTE002`); *Medição* por planilha (CNE); consulta contábil. Nomes de menu a confirmar no menu do cliente.

**Pré-condições**
- Contrato com **duas planilhas**, cada uma com medição em competência diferente, parcela LP na competência de transferência.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: valor transferido para CP (CNW/CT2) por planilha`. Sem credencial de Protheus. O contrato do ticket existe neste tenant (`00020-2026-5303`, planilhas 000001 e 000002).

**Passos**
1. No GCT, anotar por planilha a última medição (`CNE_NUMMED`) e o valor medido.
2. Executar a transferência LP→CP da parcela.
3. Na consulta contábil, somar os lançamentos da parcela.
4. Comparar com a soma dos valores das planilhas.
5. Repetir a verificação nas rotinas irmãs (`UGCTE001`/`UGCTE003`) para a mesma parcela — o ticket recomenda varrer o padrão.

**Resultado esperado**
- Passo 3 = passo 4 (no ticket: 146.018,30); ambas as planilhas presentes, cada uma pela sua própria última medição.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Só a planilha com a medição mais recente transferida (129.417,57 em vez de 146.018,30).

**Severidade:** Alta — contábil (transferência a menor).

**Preparação de massa:** contrato duas planilhas com medições em competências distintas (equipe de contratos).

**Módulo ERP:** `Financeiro e Contabil`
**Verificado em tela:** NÃO
**O que foi verificado:** contraprova de massa — `dsProtheus_getInfoPlanilhaxContrato_restGetAll` (`CNA_CONTRA=00020-2026-5303`) devolve planilhas **000001** (rev "" e 001) e **000002** (rev 001), tipo 001 FIXA, fiscal `elington.morais@cassi.com.br`; `CN9_SALDO` da rev 001 = 0,01. O dataset **não expõe** valor medido/transferido.
**Divergências encontradas:** `dsProtheus_getItensPlanilha_restGetAll` devolve vazio para este contrato (com e sem filial), embora as planilhas existam — observação.
**Dados/massa usados:** leitura de dataset; nenhum registro criado.

---

## CT-FSWTBC-4590  (protheus · Concluído · SDCASSI-418)

**Título:** Apropriar mensalmente uma parcela que ainda está em Longo Prazo e receber orientação clara em vez de "não foram encontradas parcelas"

**Origem:** FSWTBC-4590 — a parcela 04/2026 do contrato 0328-102024 não entrava na apropriação mensal (`Nao foram encontradas parcelas para o processamento`). Não era defeito: a parcela estava em **L-Longo Prazo** e a apropriação só processa CP — é preciso transferir via `UGCTE002` antes. A mesma mensagem cobre causas distintas (parcela LP, ausência real, filtro de saldo). Achado colateral: a **revisão que deveria substituir um produto apenas incluiu outro**, deixando os dois ativos na planilha 0003 — sem ticket de acompanhamento.

**Módulo/Rota:** Protheus — GCT → *Apropriação mensal* / *Transferência LP-CP* (`UGCTE002`); *Revisão de Contrato* (planilha 0003). Nomes de menu a confirmar no menu do cliente. Contraprova no Fluig: *Acompanhamento de Contratos* → *Planilha* do contrato / `dsProtheus_getItensPlanilha_restGetAll`.

**Pré-condições**
- Contrato com uma parcela classificada **L** na competência e saldo disponível.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: classificação LP/CP da parcela e lançamentos da apropriação`. Sem credencial de Protheus.

**Passos**
1. Executar a apropriação mensal da competência com a parcela ainda em **L**.
2. Anotar a mensagem exibida.
3. Executar a transferência LP→CP da parcela e repetir a apropriação.
4. Conferir o valor apropriado por planilha contra os produtos que **devem** contabilizar.
5. Em *Revisão de Contrato*, substituir um produto da planilha por outro e salvar; reabrir a planilha.

**Resultado esperado**
- Passo 2: a mensagem distingue a causa — parcela em Longo Prazo (orientar transferência) ≠ ausência de parcelas (comportamento correto esperado, hoje pode falhar: mensagem única genérica).
- Passo 3: parcela apropriada.
- Passo 4: valor apenas dos produtos vigentes.
- Passo 5: o produto substituído **sai** da planilha; apenas o novo permanece.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `Nao foram encontradas parcelas para o processamento` sem indicar que a parcela é LP.
- Valor apropriado incorreto por produto que deveria ter sido substituído e ficou ativo (0328-102024, planilha 0003).

**Severidade:** Alta — contábil (valor apropriado com produto indevido); a mensagem genérica é Média.

**Preparação de massa:** contrato com parcela LP (equipe de contratos); revisão de teste em contrato `QA-*` no GCT.

**Módulo ERP:** `Financeiro e Contabil`
**Verificado em tela:** NÃO
**O que foi verificado:** contraprova **viva** do achado colateral no Fluig — `dsProtheus_getItensPlanilha_restGetAll` para `0328-102024`: na revisão "" a planilha **000003 tinha 1 produto** (`00000712`, qtd 60, R$ 3.300,00); na revisão **003 tem 3 produtos** (`00000712` qtd 7, `04001388` qtd 3, `04001396` qtd 50, todos R$ 3.300,00), mesmo total R$ 198.000,00 — a revisão **incluiu** produtos em vez de substituir, exatamente como descrito. Parcelas LP/CP não são expostas no Fluig.
**Divergências encontradas:** o ticket fala em "produto incorreto que deveria ter sido trocado"; a base mostra três produtos coexistindo na planilha 0003 da rev 003 vigente (`CN9_SITUAC=05`).
**Dados/massa usados:** leitura de dataset; nenhum registro criado.

## CT-FSWTBC-4609  (protheus · Concluído · SDCASSI-423)

**Título:** Tentar encerrar um processo jurídico com liminar em vigor pelo campo "Andamento" e ser barrado pela mesma trava do caminho principal de encerramento

**Origem:** FSWTBC-4609 — a trava de "Liminar em vigor" impede o encerramento só no caminho principal; pelo campo *Andamento* o processo é encerrado sem crítica. Resolução **"Não será feito"** (01/06/2026): a fábrica classificou como item complementar e pediu nova demanda. O furo continua aberto — este caso reprova hoje por desenho.

**Módulo/Rota:** Protheus → **SIGAJURI (Jurídico)** → cadastro de processos do Contencioso → processo → aba/rotina de andamentos → campo **Andamento** (ato de encerramento) — *nomes de menu e código de rotina a confirmar no menu do cliente*.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGAJURI e pertencente ao grupo autorizado a executar o ato de encerramento (o controle atual é por grupo interno — ver FSWTBC-4610).
- Processo de homologação com **liminar cadastrada e em vigor** (o status/flag que a trava lê — registrar o nome real do campo no cliente).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: crítica do ato de encerramento e situação final do processo jurídico`. Sem credencial nesta rodada.

**Passos**
1. Abrir o processo com liminar em vigor.
2. Executar o encerramento pelo **caminho principal** (o que possui a trava) e registrar o texto exato da mensagem de bloqueio (o ticket só o traz em print — `<não documentado>` em texto).
3. Voltar ao processo e, pelo campo **Andamento**, incluir o andamento/ato que encerra o processo.
4. Confirmar a gravação.
5. Reabrir o processo e ler a situação e a lista de andamentos.

**Resultado esperado**
- Passo 4: gravação **barrada** com a mesma crítica do passo 2.
- Passo 5: processo continua **ativo**; nenhum andamento de encerramento gravado.
- Com a liminar revogada/encerrada, os passos 3–4 devem passar (a trava é pela liminar, não pelo caminho).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Andamento de encerramento gravado sem crítica; processo encerrado com liminar em vigor. **É o estado atual** — resolução "Não será feito".

**Severidade:** Alta *(controle jurídico contornável — risco de descumprimento de liminar)*

**Preparação de massa:** processo jurídico e liminar em vigor criados pelo executor em homologação; identificar o grupo autorizado ao ato (escopo da DEM10013599) e o nome do campo/flag de "liminar em vigor" que a trava lê.

**Verificado em tela:** NÃO
**O que foi verificado:** somente a ausência de superfície: os processos `SIGAJURI_Contencioso`, `SIGAJURI_Consultivo`, `SIGAJURI_Contrato` e `SIGAJURI_AprovaFU` existem no Fluig como **pedidos ao Jurídico** (Consultivo/Contrato inoperantes — `ServiceNotFoundException: SIGAJURI`, conforme catálogo da skill); nenhum expõe *Andamento* nem ato de encerramento.
**Divergências encontradas:** o ticket não traz o texto da mensagem de bloqueio (só prints) — registrar no passo 2.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4610  (protheus · Concluído · SDCASSI-422)

**Título:** Tentar encerrar um processo jurídico com um usuário sem vínculo com o Jurídico e ser barrado, enquanto o usuário do Jurídico consegue

**Origem:** FSWTBC-4610 — o ato de encerramento está disponível para usuários sem vínculo com a área. A fábrica esclareceu que o controle é **por grupo de usuários interno** (escopo da DEM10013599), não por vínculo com o Jurídico, e pediu que o cliente definisse o critério. Resolução **"Não será feito"**; sem nova demanda registrada.

**Módulo/Rota:** Protheus → **SIGAJURI** → processo → ato/andamento de encerramento; Configurador → usuários e grupos (grupo interno autorizado) — *menu a confirmar no cliente*.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Dois usuários de homologação: **U-JUR** (vinculado ao Jurídico e no grupo autorizado) e **U-EXT** (de outra área, mas no mesmo grupo interno genérico que hoje libera o ato).
- Um processo ativo sem liminar.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: disponibilidade do ato de encerramento por usuário e situação do processo`. Sem credencial nesta rodada.

**Passos**
1. Logar como **U-EXT**; abrir o processo; tentar executar o ato de encerramento.
2. Registrar se o ato aparece habilitado e o que acontece ao confirmar.
3. Logar como **U-JUR**; repetir no mesmo processo.
4. Confirmar em qual critério o sistema decidiu (grupo × vínculo): remover U-EXT do grupo interno e repetir o passo 1.

**Resultado esperado**
- Passo 1–2: **U-EXT barrado** (ato indisponível ou crítica de permissão), processo permanece ativo.
- Passo 3: **U-JUR encerra** normalmente.
- Passo 4: o critério que decide é o **vínculo com o Jurídico** (critério a ser definido pelo cliente — hoje `<não documentado>`).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- U-EXT, por estar no grupo interno, encerra o processo. **É o estado atual** ("Não será feito"): o caso reprova até que o critério seja definido e implementado.

**Severidade:** Alta *(acesso indevido a ato sensível)*

**Preparação de massa:** dois usuários e o processo criados pelo executor em homologação; obter do cliente o critério de "vinculado ao Jurídico" (atributo, lista fixa ou grupo) — sem isso o passo 4 não tem oráculo.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — permissão de ato do SIGAJURI não passa pelo portal.
**Divergências encontradas:** nenhuma verificável.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4647  (protheus · Em Homologação · SDCASSI-436)

**Título:** Contabilizar um contrato plurianual e conferir que o valor anual lançado é a soma das 12 primeiras parcelas contadas da data de início do contrato, sem desconto da apropriação mensal

**Origem:** FSWTBC-4647 — a contabilização registrava a parcela anual já descontada da apropriação mensal (faltou exatamente R$ 466.666,67 = 5.600.000/12). Análise de 15/06 achou duas causas: base temporal = **data do sistema** em vez da **data de início do contrato**, e apropriação do **valor total** quando a MIT044 veda parcelas após 360 dias. **Aberto** (em homologação desde 03/08/2026) — hoje o caso pode reprovar.

**Módulo/Rota:** Protheus → Gestão de Contratos → rotina customizada de contabilização/apropriação de contratos (família `UGCTE001` — *nome de menu a confirmar no cliente*) → Contabilidade Gerencial → *Lançamentos Contábeis* (CT2) / consulta do lote do contrato; cronograma contábil (CNW) do contrato.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Contrato de homologação de **24 meses**, valor de **R$ 5.600.000,00 nos 12 primeiros meses** (parcela mensal R$ 466.666,67), cronograma contábil com 24 parcelas, **data de início diferente da data do sistema** (ex.: início 01/03, contabilizar em 15/05).
- Nenhuma parcela apropriada antes do teste.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: valor do lançamento contábil (CT2) da apropriação anual e o cronograma CNW`. Sem credencial nesta rodada; exige rodar a apropriação (rotina batch — não executada nesta rodada por regra).

**Passos**
1. Cadastrar o contrato e conferir o cronograma contábil (24 parcelas, datas a partir do início do contrato).
2. Rodar a contabilização do contrato com a data do sistema deslocada em relação ao início.
3. Abrir os lançamentos do lote do contrato (CT2) e somar os valores do lançamento "anual".
4. Conferir, no cronograma, quais parcelas ficaram marcadas como apropriadas/contabilizadas.
5. (Fluig, contraprova) *Acompanhamento de Contratos* → *Informações do Contrato* → *Datas* (*Data Início*) e *Valores Financeiros* (*Valor Inicial/Atual*) — os dois valores de referência da conta.

**Resultado esperado**
- Passo 3: lançamento anual = **R$ 5.600.000,00** (12 parcelas a partir da **data de início do contrato**).
- Passo 4: nenhuma parcela **além de 360 dias** do início apropriada; nenhuma parcela mensal descontada do anual.
- Passo 5: a *Data Início* lida no Fluig é a base usada no passo 3.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Lançamento de **R$ 5.133.333,33** (falta uma parcela, R$ 466.666,67); parcelas contadas a partir da data do sistema; valor total do contrato apropriado (parcelas > 360 dias).

**Severidade:** Alta *(resultado contábil; maior valor unitário do lote)*

**Preparação de massa:** contrato plurianual criado pelo executor em homologação com os valores acima; alinhar com a Contabilidade da CASSI o lançamento esperado antes de rodar (o oráculo é a MIT044 da DEM10013766).

**Verificado em tela:** NÃO
**O que foi verificado:** apenas a contraprova disponível: o modal *Informações do Contrato* expõe *Data Início* e *Valor Inicial/Atual/Presente* (contrato 00186-2022-5303: início 06/05/2022, *Valor Atual R$ 19.781.111,71*). Nenhuma tela ou dataset do Fluig traz CT2 ou parcelas CNW.
**Divergências encontradas:** nenhuma verificável no Fluig.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4869  (protheus · Em Execução (Desenvolvimento) · SDCASSI-483)

**Título:** Aprovar uma revisão de contrato cujos campos de valor anterior estão zerados e conferir que a apropriação contábil lança apenas o incremento da revisão, sem estouro e sem reapropriar parcelas já apropriadas

**Origem:** FSWTBC-4869 — contrato 00186-2022-5303 REV-005 apropriava ~**R$ 150 milhões** para um contrato de ~R$ 22 milhões: na apropriação de contratos em revisão (`UGCTE001/UGCTE01A`, fórmula `MV_X69P002`), com `CNB_XVLANT/CNW_XVLANT` zerados os itens residuais entravam com valor cheio divididos pelo incremento pequeno. Correção reconstitui o valor anterior a partir de CNB/CNW, protege revisões que reduzem valor e usa `nVlItAnt/nVlPcAnt`; validado (rev. 007 → R$ 2.000.000,00 = `CN9_VLATU` 007 − 006). Log posterior mostra `variable does not exist NVLITANT` (linha 520) — caminho descoberto. `MV_X69P001/002` não existiam na base em 10/07. **Aberto**, consolidado no SDCASSI-498.

**Módulo/Rota:** Protheus → Gestão de Contratos → *Contratos* → *Revisão* → aprovar revisão (`CNTA300` → `PE_CN100SIT` → `U_UGCTE001`) → rotina de apropriação contábil de contratos (*nome de menu a confirmar*) → Contabilidade → lançamentos do lote `000GCT`, LP `69P`, histórico `D.A:CP <contrato>REV-<nnn>`; Configurador → parâmetros `MV_X69P001`, `MV_X69P002`.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Contrato de homologação com ≥ 2 revisões aprovadas e apropriadas; na revisão anterior, `CNB_XVLANT`/`CNW_XVLANT` **zerados** (simula contrato anterior à gravação desses campos).
- Revisão nova **N** que aumenta o valor em um incremento pequeno (ex.: R$ 2.000.000,00) e outra revisão **N+1** que **reduz** o valor.
- Parâmetros `MV_X69P001` e `MV_X69P002` existentes.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: valor do lançamento contábil 69P e flag de apropriação das parcelas`. Sem credencial; a apropriação é rotina batch (não executada nesta rodada).

**Passos**
1. Conferir a existência e o conteúdo de `MV_X69P001`/`MV_X69P002` (fórmula com `nVlItAnt`/`nVlPcAnt`).
2. Anotar `CN9_VLATU` da revisão N−1 e da revisão N (no Fluig: *Informações do Contrato → Valor Atual*, antes e depois).
3. Aprovar a revisão N.
4. Rodar a apropriação contábil do contrato; abrir o lançamento 69P do lote.
5. Rodar a apropriação de novo, sem nova revisão.
6. Aprovar a revisão N+1 (redução) e rodar a apropriação.
7. Ler o `console.log`/log da rotina após cada execução.

**Resultado esperado**
- Passo 4: valor apropriado = **`CN9_VLATU`(N) − `CN9_VLATU`(N−1)** (no exemplo, R$ 2.000.000,00); parcelas com flag de apropriação = 1.
- Passo 5: "Encerrado a Apropriacao contabil sem Movimento" — nada reapropriado.
- Passo 6: revisão que reduz **não** gera reapropriação.
- Passo 7: sem `variable does not exist NVLITANT` (PROCCNZ linha 520) nem `argument #0 error … round` (linha 530).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Apropriação de **~R$ 150.000.000,00** para um incremento de R$ 2.000.000,00 (itens residuais com valor cheio ÷ incremento); ou abortada com `variable does not exist NVLITANT`.

**Severidade:** Alta *(maior desvio contábil da conta)*

**Preparação de massa:** contrato com revisões e campos `*_XVLANT` zerados, montado pelo executor em homologação (com apoio da fábrica para zerar os campos); parâmetros `MV_X69P00x` cadastrados antes.

**Verificado em tela:** NÃO
**O que foi verificado:** contraprova disponível no Fluig: o contrato **00186-2022-5303 existe neste tenant** — *Acompanhamento de Contratos* filtrado (1 linha, *Nº Revisão 006*, *Vigente*), modal *Informações do Contrato* com *Valor Inicial R$ 19.730.288,43*, *Valor Atual R$ 19.781.111,71*, *Valor Presente R$ 133.384,95*, *Saldo R$ 11.144.085,87*; dataset com `CN9_VLATU` por revisão (rev 003 19.730.288,43 → 004 19.730.288,42 → 005 e 006 19.781.111,71) — é o oráculo "VLATU(N) − VLATU(N−1)" do ticket, legível sem o ERP. Nenhuma superfície para o lançamento 69P.
**Divergências encontradas:** as revisões **007 e 008** (R$ 21.781.111,71 / R$ 22.781.111,71) citadas no ticket **não existem** neste tenant (última = 006, R$ 19.781.111,71) — a base do Fluig não é a TST do chamado; *Status da Integração GCT* e *Erro de Integração* aparecem como "-" mesmo em contrato integrado.
**Dados/massa usados:** contrato `00186-2022-5303`, leitura apenas — nada submetido.

---

## CT-FSWTBC-4920  (protheus · Em Homologação · SDCASSI-490)

**Título:** Criar e aprovar uma revisão de contrato e conferir que os campos de valor anterior são gravados e que a LP 69G contabiliza apenas a diferença de valor presente entre as revisões

**Origem:** FSWTBC-4920 — contrato 00002-2021-2201 (locação CPC06) contabilizou R$ 469.742,16 para um aditivo de R$ 456.000,00. Causa: alteração de 29/04/2026 no `PE_CNTA300` com referência de tabela errada desligou o bloco que grava `CN9_XVLPRE/CN9_XVJURO`, `CNW_XVLANT/CNW_XVJURO/CNW_XCPLP` e `CNB_XVLANT`; a revisão nova herdava os valores e a LP 69G (`CN9_VLPRES − CN9_XVLPRE`) contabilizava o delta anterior de novo. Caso-limite: 00001-2021-5002 rev. 002 com diferença zero contabilizou R$ 144.352,72 + R$ 16.447,28. Log de 14/08: `argument #0 error, expected N->U, function round` (PROCCNZ linha 530) — mesma causa. **Aberto** (cluster 483/490/491/498); **passivo** de contratos gravados entre 29/04 e a correção fora do escopo.

**Módulo/Rota:** Protheus → Gestão de Contratos → *Contratos* → *Revisão* (inclusão) → *Aprovar Revisão* (`CN300APROV` → `PE_CNTA300`) → Contabilidade → lançamento LP `69G` do contrato; dicionário/dados: `CN9_XVLPRE`, `CN9_XVJURO`, `CNW_XVLANT`, `CNW_XVJURO`, `CNW_XCPLP`, `CNB_XVLANT`.

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Contrato de homologação **vigente com `CN9_VLPRES` > 0** e cronograma contábil.
- Pacote `SDCASSI-490-498_P2510_20260821` aplicado no ambiente de teste.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: campos de valor anterior gravados e valor do lançamento 69G`. Sem credencial; `CN9_XVLPRE` não é projetado no Fluig; o contrato do ticket não existe no tenant do Fluig.

**Passos**
1. Anotar `CN9_VLPRES` e `CN9_VLATU` da revisão atual (N−1).
2. Incluir a revisão N com aditivo de **R$ 456.000,00**.
3. Aprovar a revisão N (`Aprovar Revisão`); observar se há erro.
4. Conferir `CN9_XVLPRE`(N) = `CN9_VLPRES`(N−1), `CN9_XVJURO`, e `CNW_XVLANT`/`CNB_XVLANT` preenchidos com os valores da revisão anterior.
5. Abrir o lançamento 69G gerado.
6. Caso-limite: incluir e aprovar a revisão N+1 **sem alterar** o valor presente; abrir o lançamento.
7. Não usar contrato novo sem revisão como cenário — não aciona o trecho corrigido (lição de 13/08).

**Resultado esperado**
- Passo 3: aprovação sem erro (`round` recebe numérico).
- Passo 4: campos de valor anterior **gravados** (não copiados da revisão anterior).
- Passo 5: 69G = **`CN9_VLPRES`(N) − `CN9_XVLPRE`(N)** = R$ 456.000,00.
- Passo 6: diferença **zero** → nenhum valor contabilizado.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- 69G de R$ 469.742,16 (delta anterior somado); revisão sem alteração contabilizando R$ 144.352,72 + R$ 16.447,28; erro `argument #0 error, expected N->U, function round … PROCCNZ(UGCTE001.PRW) line 530` na aprovação.

**Severidade:** Alta *(duplicidade contábil; passivo em produção de tamanho desconhecido)*

**Preparação de massa:** contrato vigente com valor presente, criado pelo executor; registrar o levantamento dos contratos atingidos entre 29/04 e a correção como chamado próprio (fora deste caso).

**Verificado em tela:** NÃO
**O que foi verificado:** contraprova: *Valor Presente* é exibido no modal *Informações do Contrato* (00186-2022-5303: R$ 133.384,95, rev. 006; dataset `CN9_VLPRES` 82.919,96 na rev. 004 e 133.384,95 nas 005–006), mas **nenhuma das 121 colunas** do dataset de contratos é `CN9_XVLPRE`/`XVJURO` — o valor anterior não é observável no Fluig.
**Divergências encontradas:** contratos `00002-2021-2201`, `00001-2021-5002` e `00001-2021-3503` → **0 linhas** neste tenant (963 contratos lidos) — a massa do ticket é de outra base.
**Dados/massa usados:** contrato `00186-2022-5303`, leitura apenas — nada submetido.

---

## CT-FSWTBC-4998  (ambos · Concluído · SDCASSI-506)

**Título:** SC cuja consulta de cotação no ERP não retorna dados chega a *Correção* com a causa real no Histórico e em *Retorno Integração*, e não com um erro de programação

**Origem:** FSWTBC-4998 — SC 101431 travou na *Integração com ERP* pós-negociação (servicetask177) com a mensagem
`"codFornecedor" is not defined`. Causa: o bloco de exceção de `getQuotesData_servicetask177` usava variáveis que só existiam
no escopo de `getQuotesProcessData_servicetask177`; quando esta não retornava dados, o tratamento de erro quebrava e mascarava
a causa. Correção: criar as variáveis para a tratativa exibir a informação correta (PR 71452). A causa de a consulta não
retornar dados **não** foi explicada no ticket.

**Módulo/Rota:** Central de Tarefas → solicitação `wf_solicitacao_compras` → aba **Histórico**; formulário da SC, painel

**Módulo ERP:** `Financeiro e Contabil`
**Verificar Retorno Protheus** → campo **Retorno Integração** (`anLockBudgRetIntErr`). Atividade **177 – Integração com ERP**
(`integracaoERP2`, após *Aguarda Finalizar Negociação* 172).

**Pré-condições**
- Uma SC que tenha concluído a negociação (Histórico com "Processo movimentado automaticamente através de Serviço de
  finalização do processo de negociação") e cuja cotação **não** seja encontrada pela consulta do ERP na atividade 177 — por
  exemplo, cotação excluída/renumerada no Protheus após a negociação.
- Acesso de leitura à solicitação (a conta de QA abre qualquer instância em modo leitura).
- **Bloqueio:** a condição "consulta sem retorno" não é reproduzível pelo Fluig — depende de massa alterada no Protheus
  (sem credencial). Massa ausente, não "somente Protheus": o efeito é observável no Histórico e no campo *Retorno Integração*.

**Passos**
1. Abrir a SC em modo leitura (`pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=<nº>&app_ecm_workflowview_taskLoadViewMode=true`).
2. Na aba **Histórico**, localizar o bloco "Integração com ERP Executando atividade de serviço do sistema" que sucede
   "Negociação foi Finalizada? Tarefa Automática".
3. Ler a linha de resultado da integração (hoje, no caminho feliz: `Integração executada com sucesso - Tempo de Execução N s`).
4. Se a SC foi desviada, abrir a tarefa em **Correção** (236) e ler o campo **Retorno Integração** no painel *Verificar Retorno Protheus*.
5. Conferir que a mensagem identifica a cotação/fornecedor não encontrados (código do fornecedor, loja e nº da cotação) — e não
   um nome de variável JavaScript.

**Resultado esperado**
- O Histórico da atividade 177 registra uma mensagem de negócio (cotação/fornecedor não localizados no ERP), com o número da SC
  ERP e o fornecedor envolvidos.
- O campo **Retorno Integração** da tarefa de Correção traz a mesma mensagem, legível para o comprador.
- Em nenhum ponto aparece `is not defined`, `ReferenceError` ou nome de variável (`codFornecedor`, `lojaFornecedor`).
- A SC segue para **Correção (236)** com o grupo `G.P.Requisicao_de_Compras_Correcoes` (pool observado hoje em 112830/113196).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Histórico/retorno com `"codFornecedor" is not defined`, a SC parada sem que se soubesse que a consulta ao ERP voltou vazia;
  a alçada de cotação não era gerada.

**Severidade:** Média

**Preparação de massa:** uma SC pós-negociação cuja cotação foi removida/alterada no Protheus antes da atividade 177 — só o
time Protheus consegue preparar. Não criar para forçar. Para o caminho feliz (regressão do texto), qualquer SC que tenha
passado pela 177 serve: **112855** e **112816** têm o registro hoje.

**Verificado em tela:** PARCIAL
**O que foi verificado:** (a) **visto renderizado** — Histórico da SC 112855: "Integração com ERP Executando atividade de
serviço do sistema · 28/08/2026 15:14:07 · Integração executada com sucesso - Tempo de Execução 1 s", precedido de "Negociação
foi Finalizada? Tarefa Automática" (a 177 é a integração pós-negociação, confirmado pela ordem 172 → 177 → 309 nas tasks da API);
(b) **visto renderizado** — painel *Verificar Retorno Protheus* do formulário com os campos *Responsável, Email do Responsável,
Data da Validação, Hora da Validação, Retorno Integração\*, Enviar para (Selecione... / Retornar para Aguardar Geração /
Encerrar Solicitação), Justificativa\**; (c) **agregado por dado** — seq. 177 = "Integração com ERP", 84 movimentos, 0 ativas
hoje (nenhuma SC presa nela); (d) **lido no fonte publicado** — o JS da SC (`App/ViewHandler.js`) declara `integracaoERP2: 177`;
os campos `txt_codForn_infForn`/`txt_ljForn_infForn` citados no ticket **não existem no HTML da SC** (0 ocorrências) — são
campos do lado servidor (script do processo), não do formulário. O caminho de erro não foi exercitado.
**Divergências encontradas:** os nomes de campo do ticket (`txt_codForn_infForn`, `txt_ljForn_infForn`) não estão no formulário
publicado da SC; o que o usuário vê é o campo rotulado **Retorno Integração**. O ticket chama a etapa de "servicetask177"; na
tela ela é **Integração com ERP** (o mesmo nome da 20 e da 287 — só a posição no Histórico distingue).
**Dados/massa usados:** leitura das SCs 112855 e 112816 — nenhum — não submetido.

---

## CT-FSWTBC-5013  (protheus · Concluído · SDCASSI-172)

**Título:** Consultar a API de Fluxo de Caixa em modo consulta e em modo envio e conferir que Código/Descrição do Fluxo vêm da natureza do título e que só o envio marca o título como enviado

**Origem:** FSWTBC-5013 — bug interno da DEM10009555 (API de Fluxo de Caixa): *Código* e *Descrição do Fluxo* vinham vazios para todos os títulos por **tratamento de filial** entre as tabelas ao localizar a natureza (SED). Achado adicional: a marcação "título já enviado" (`E2_XDHFLX`) era gravada em **toda chamada**, inclusive consulta (`cFluxo='N'`) — consulta consumia títulos. Corrigido (patch 30/07); só marca em `cFluxo='S'`. Pendência do cliente: das 558 naturezas, só a 2050101 tem *Cod. Fluxo*. Ticket sem descrição — cenário reconstruído do comentário técnico.

**Módulo/Rota:** Protheus REST → API de Fluxo de Caixa (`UFINA013`/`UFINE045` — *rota e parâmetro `cFluxo` a confirmar no serviço*) → Financeiro → *Naturezas* (SED, campos *Cod. Fluxo* `ED_XCODFLX` / `ED_XDSCFLX`) → *Codigos de Lancamentos para Fluxo de Caixa* → *Contas a Pagar* (SE2, `E2_XDHFLX`).

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Natureza **2050101** com *Cod. Fluxo* `000002` ("Teste 2"); natureza **X** sem código.
- Títulos SE2: **T1** (natureza 2050101), **T2** (natureza X), **T3** (natureza 2050101, em **outra filial** que a do cadastro consultado) — nenhum marcado em `E2_XDHFLX`.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: payload da API e campo E2_XDHFLX`. Sem credencial.

**Passos**
1. Chamar a API com `cFluxo='N'`; localizar T1, T2 e T3 no retorno.
2. Consultar `E2_XDHFLX` dos três títulos.
3. Chamar de novo com `cFluxo='N'`.
4. Chamar com `cFluxo='S'`; consultar `E2_XDHFLX`.
5. Chamar novamente com `cFluxo='S'`.

**Resultado esperado**
- Passo 1: T1 e **T3** com natureza 2050101, código `000002`, descrição "Teste 2"; T2 com código/descrição vazios (natureza sem cadastro — esperado).
- Passo 2: `E2_XDHFLX` **vazio** nos três (consulta não marca).
- Passo 3: os três títulos **voltam** no retorno.
- Passo 4: títulos retornados e **marcados**.
- Passo 5: títulos já enviados **não** retornam.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Código e descrição vazios para **todos** os títulos, mesmo com natureza cadastrada; títulos consumidos na consulta (somem das remessas seguintes).

**Severidade:** Alta *(perda silenciosa de títulos no fluxo de caixa)*

**Preparação de massa:** natureza com *Cod. Fluxo* e três títulos criados pelo executor; cadastrar os códigos das demais naturezas é pendência do cliente, fora deste caso.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — API financeira sem superfície no portal.
**Divergências encontradas:** ticket sem descrição (§5-D); o cenário vem integralmente do comentário técnico de 04/08.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-5165  (protheus · Aguardando Retorno de Homologação · SDCASSI-545)

**Título:** Excluir fechamentos de prestador em sequência, com outro usuário consultando a mesma tela, e confirmar que cada exclusão termina sem lock no banco e remove o fechamento e seus títulos de forma consistente

**Origem:** FSWTBC-5165 — a função **Exclui Fechamento(s)** em *[06 - Financeiro] › Atualizações › Específicos › Prestador vs Fechamento* causava **lock no banco**, de forma **intermitente** ("o mesmo registro que trava em uma tentativa, exclui em outra"; fechamento `1780342` travou "literalmente quando saímos da call"). No RPO de debug da TST excluía sem lock, o que levantou a hipótese de Ponto de Entrada/fonte divergente entre `CC54GO_TST` e `CC54GO_TST_COMP`. A causa só foi localizada com **trace do DBAccess** (`DBTrace_4592_T057850511.trc`): thread `UCOMA004 - TCPIP`, **53 de 54 tabelas abertas**, self-join em `DHQ010` (`DHQ INNER JOIN DHQ010 CON ON CON.DHQ_IDENT = DHQ.DHQ_IDENT`, filial 5303, doc 000000001, série 999, fornecedor 17741911) e **SE2 acessada 30 vezes**. Correção na **MUD18408**; o cliente confirmou em 28/08 e 03/09, mas o ticket segue sem fechamento administrativo e **sem registro do que foi corrigido**.

**Módulo/Rota:** Protheus → *[06 - Financeiro]* → *Atualizações* → *Específicos* → **Prestador vs Fechamento** → ação **Exclui Fechamento(s)** (caminho como o ticket descreve; rotina customizada — o trace a identifica como `UCOMA004`; **a confirmar no menu do cliente**). Monitoramento: DBAccess Monitor / locks do SGBD (MSSQL).

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Credencial no Protheus de homologação (`CC54GO_TST`, **RPO compilado com a MUD18408** — não o RPO de debug, que mascarou o defeito) para **dois** usuários.
- Acesso ao DBAccess Monitor (ou ao monitor de locks do MSSQL) durante o teste.
- Pelo menos **5 fechamentos de prestador** de homologação criados pelo executor (via SOC de homologação ou pela própria rotina), com títulos (SE2) vinculados, do mesmo padrão do trace: mesma filial, série `999`.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: conclusão da rotina de exclusão, locks em DHQ010/SE2 no monitor do banco e o estado final do fechamento e dos títulos`. Sem credencial nesta rodada. **Nunca** excluir fechamento de produção.

**Passos**
1. Usuário B abre *Prestador vs Fechamento* e deixa a lista posicionada no fechamento que A vai excluir (simula o cenário da call).
2. Usuário A seleciona o 1º fechamento e aciona **Exclui Fechamento(s)**; cronometrar até a mensagem final.
3. Enquanto A executa, ler no DBAccess Monitor a thread de A: número de tabelas abertas e existência de lock em `DHQ010`/`SE2` por mais de alguns segundos.
4. Repetir 2–3 para os outros 4 fechamentos, **sem** reiniciar a sessão (a intermitência apareceu entre tentativas na mesma sessão).
5. Após cada exclusão, consultar o fechamento (DHQ) e os títulos vinculados (SE2): existência, status e vínculo.
6. Usuário B, durante os passos 2–4, executa uma consulta/filtro na mesma tela e registra se a interface respondeu.

**Resultado esperado**
- Passos 2 e 4: as **5** exclusões terminam com a mensagem de sucesso, em tempo semelhante entre si — nenhuma fica presa, nenhuma exige reinício de sessão.
- Passo 3: nenhum lock persistente em `DHQ010`/`SE2`; a thread **não** chega ao limite de tabelas abertas (o trace mostrou 53/54 — operar no limite é sinal de alerta mesmo sem lock).
- Passo 5: fechamento removido **e** títulos vinculados removidos/estornados de forma coerente — nada parcialmente excluído.
- Passo 6: o usuário B não fica bloqueado em nenhum momento.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Rotina presa em "Exclui Fechamento(s)" com **lock no banco**; outros usuários bloqueados; o mesmo registro trava numa tentativa e exclui na seguinte; no trace, thread `UCOMA004 - TCPIP` com 53/54 tabelas abertas, self-join em `DHQ010` e SE2 lida 30 vezes; risco de fechamento meio excluído.

**Severidade:** Alta *(financeiro: bloqueia outros usuários e pode deixar fechamento/títulos inconsistentes)*

**Preparação de massa:** 5+ fechamentos de prestador de homologação, criados pelo executor, com títulos SE2 vinculados; dois usuários Protheus; acesso ao monitor do DBAccess/SGBD; confirmação de que o RPO da base é o compilado com a MUD18408.

**Verificado em tela:** NÃO
**O que foi verificado:** apenas a ausência de superfície: varredura dos fontes publicados do Fluig sem nenhuma ocorrência de "fechamento", "prestador vs" ou `DHQ` (os únicos "dhq" encontrados são fragmentos de strings minificadas, falsos positivos); o catálogo de processos tem `bpm_recepcao_documentos_fiscais_*` e `bpm_financeiro_rejeicoes_bancarias`, que tratam documentos fiscais de contratos/compras e rejeições bancárias — não fechamento de prestador (a confirmar com o cliente, mas nada no fonte liga os dois).
**Divergências encontradas:** o ticket chama a função de "Exclui Fechamento(s)"; o trace identifica a rotina como `UCOMA004` — nome de menu e fonte precisam ser confirmados no cliente. O comentário final do ticket ("correções realizadas, aplicar o patch abaixo e validar") **não diz o que foi corrigido** — o caso testa o sintoma, não a causa.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-5195  (protheus · Em Execução (Desenvolvimento) · SDCASSI-552)

**Título:** Chamar a API de Fluxo de Caixa para a empresa 01 sem filtro de filial e conferir que os títulos de todas as filiais são exportados, com os totais por filial iguais aos do Contas a Pagar/Receber

**Origem:** FSWTBC-5195 (DEM10009555) — o Fluxo de Caixa exporta **apenas** títulos da filial **5303** (Sede). Teste do cliente: alterar um título da filial **2101** para 5303 fez o título ser enviado — isola a variável "filial". Da mesma API, o FSWTBC-5013 (SDCASSI-172) já teve causa em "tratamento de filial entre as tabelas" (cadastro de Naturezas). A investigação pediu os parâmetros da chamada ("principalmente o `tenantId`") e em 31/08 o time Web orientou "utilizar apenas empresa 01 e retirar o código natureza" — causa ainda não determinada (filtro de filial na rotina × `tenantId` × escopo de empresa).

**Módulo/Rota:** Protheus → serviço REST customizado de **Fluxo de Caixa** (o ticket cita `UFINA013`/`UFINE045` — **a confirmar no fonte do cliente**), consumido por sistema externo (time Web). Conferência no SIGAFIN → *Contas a Pagar* / *Contas a Receber* → consultas por filial (nomes de menu a confirmar).

**Módulo ERP:** `Financeiro e Contabil`

**Pré-condições**
- Credencial REST do Protheus e os **parâmetros exatos** que o consumidor usa (`tenantId`, período, código de natureza) — anotados antes do teste.
- Títulos em aberto no período em **pelo menos três filiais** da empresa 01, incluindo **5303** e **2101** (a do ticket) e uma terceira; para o passo 6, uma natureza cadastrada em filial ≠ 5303.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: conteúdo da resposta da API (títulos por filial) contra SE1/SE2 por filial`. Sem credencial REST/Protheus nesta rodada.

**Passos**
1. No SIGAFIN, para o período do teste, anotar **quantidade e soma** dos títulos em aberto **por filial** (5303, 2101, terceira).
2. Chamar a API com `tenantId` = **empresa 01 sem filial** (`01`), **sem** código de natureza, mesmo período; salvar a resposta.
3. Agrupar a resposta por filial: quantidade e soma.
4. Chamar a API com `tenantId` = `01,2101` (empresa + filial); agrupar.
5. Chamar a API com `tenantId` = `01,5303`; agrupar.
6. Chamar a API com filtro de **natureza** cadastrada numa filial ≠ 5303; agrupar.
7. (Controle do ticket) Escolher um título da filial 2101 presente no passo 1 e localizá-lo na resposta do passo 2 pelo número/prefixo/parcela.

**Resultado esperado**
- Passo 3: **todas** as filiais do passo 1 aparecem, e quantidade/soma por filial batem com o SIGAFIN.
- Passo 4: só títulos de 2101; passo 5: só de 5303 — o escopo segue o `tenantId` informado, e não um valor fixo.
- Passo 6: o filtro de natureza funciona também para filial ≠ 5303 (regressão do FSWTBC-5013).
- Passo 7: o título de 2101 está na resposta **sem** precisar mudar sua filial.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Resposta contendo **apenas** títulos da filial 5303, com qualquer `tenantId`; o título de 2101 só aparece depois de alterado para 5303. Fluxo de caixa consolidado incompleto.

**Severidade:** Alta *(risco financeiro — fluxo de caixa consolidado incompleto desde que a integração entrou em uso)*

**Preparação de massa:** títulos em aberto em três filiais no período (se não existirem em homologação, criados pelo executor no SIGAFIN); natureza em filial ≠ 5303; parâmetros da chamada fornecidos pelo consumidor; credencial REST.

**Verificado em tela:** NÃO
**O que foi verificado:** apenas a ausência de superfície: varredura dos fontes publicados do Fluig sem ocorrência de "fluxo de caixa", `fluxoCaixa`, `UFINA013` ou `UFINE045`; nenhum processo do catálogo trata fluxo de caixa.
**Divergências encontradas:** nenhuma entre ticket e tela. Registrar que o caso cobre as **três hipóteses** ainda abertas no ticket (filtro fixo de filial, `tenantId`, escopo de empresa) pelos passos 2, 4 e 5 — quando a causa for identificada, o passo correspondente vira a regressão principal.
**Dados/massa usados:** nenhum — não submetido.

---
