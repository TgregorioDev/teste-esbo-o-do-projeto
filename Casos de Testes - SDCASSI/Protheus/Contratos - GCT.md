<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# Contratos - GCT

Casos de teste do Protheus — registrados para execução futura no ERP.

| | |
|---|---|
| Casos neste arquivo | 32 |
| Verificados em tela | 0 total · 1 parcial · 31 não |

> **Como ler.** Estes casos **não são executáveis no Fluig** — o efeito do defeito só aparece
> no Protheus. Estão escritos por completo, do ponto de vista de quem for executá-los no ERP,
> para quando o projeto de testes cobrir o Protheus. Nenhum foi verificado em tela.

---

## CT-FSWTBC-1241  (protheus · Concluído)

**Título:** Editar o valor total (`CNA_VLTOT`) de uma planilha de contrato no GCT sem erro ao abrir o campo

**Origem:** FSWTBC-1241 — "Erro na abertura do campo CNA_VLTOT no contrato". Só título; aberto 28/03/2025 e fechado no mutirão de 16/10 sem movimentação. Mesma família do FSWTBC-1502 (revisão aberta, patch TOTVS). Caso escrito como **caracterização de caminho** do campo no ERP.

**Módulo/Rota:** Protheus → **SIGAGCT** → *Atualizações › Contratos › Contratos* (**CNTA120**) → contrato → aba/planilha → **Planilhas (CNTA100)** → campo **Vlr. Total** (`CNA_VLTOT`). Contraprova no Fluig: *Acompanhamento de Contratos* → ícone **Planilha** da linha; dataset `dsProtheus_getPlanilha_restGetAll`.

**Pré-condições**
- Contrato em **Elaboração (01)** ou **Revisão aberta (09)** com ao menos uma planilha e itens (a planilha de contrato vigente não é editável).
- Usuário do ERP com acesso a CNTA120/CNTA100 na filial do contrato.
- Dicionário atualizado (o FSWTBC-1502 registra que o defeito no `CNA_VLTOT` era de produto e foi corrigido por pacote TOTVS).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: a crítica/tela de erro ao abrir o campo CNA_VLTOT na manutenção da planilha`. Sem credencial do Protheus nesta rodada.

**Passos**
1. No ERP, abrir **CNTA120**, posicionar num contrato em situação **01** (ex.: um dos 19 medidos hoje) ou **09** (ex.: `00006-2022-1101` rev 003) e acionar **Alterar** (ou *Revisão* → *Alterar revisão*).
2. Na aba de planilhas, selecionar a planilha `000001` e abrir os itens (**CNTA100**).
3. Clicar no campo **Vlr. Total** (`CNA_VLTOT`) do cabeçalho da planilha; alterar a quantidade/valor unitário de um item e sair do campo para forçar o recálculo.
4. Confirmar a alteração e reabrir o contrato em modo *Visualizar*.
5. Contraprova no Fluig: em `/portal/p/1/acompanhamentoContrato`, filtrar o contrato, clicar em **Planilha** e comparar o total exibido; ou consultar `dsProtheus_getPlanilha_restGetAll` (`CNA_FILIAL`, `CNA_CONTRA`, `CNA_NUMERO`, `CNA_REVISA`) e ler `CNA_VLTOT`.

**Resultado esperado**
- Passo 3: o campo abre sem *help* de erro e sem `error.log`; o total é recalculado como soma de `CNB_VLTOT` dos itens.
- Passo 4: o valor persistido bate com a soma dos itens e com `CN9_VLATU`/`CN9_VLINI` do contrato conforme a regra do GCT.
- Passo 5: o Fluig exibe o mesmo `CNA_VLTOT` (hoje, para `00001-2023-1101`: **40.753,44**).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro ao abrir/editar o campo `CNA_VLTOT` — mensagem exata `<não documentado>` (ticket só com título); no 1502 o sintoma correlato foi corrigido por pacote TOTVS.

**Severidade:** Alta *(valor total da planilha alimenta saldo, medição e pagamento)*

**Preparação de massa:** um contrato em Elaboração ou Revisão aberta na filial do executor — hoje há 19 em situação 01 e 11 em 09; nada precisa ser criado. O executor do ERP precisa apenas do perfil de GCT.

**Verificado em tela:** NÃO
**Módulo ERP:** `Contratos - GCT`
**O que foi verificado:** apenas a contraprova no Fluig — `dsProtheus_getPlanilha_restGetAll` responde com `CNA_VLTOT`, `CNA_SALDO`, `CNA_CRONOG` (40.753,44 / 18.809,28 / 000006 para `00001-2023-1101`); *Acompanhamento de Contratos* tem a ação **Planilha** por linha. O ERP não foi aberto.
**Divergências encontradas:** nenhuma no ticket (sem conteúdo). Achado colateral: `dsProtheus_getInfoPlanilhaxContrato_restGetAll` devolve `CNA_VLTOT` **nulo** para as mesmas planilhas em que `getPlanilha` devolve valor — os dois datasets não expõem o mesmo campo.
**Dados/massa usados:** nenhum — não submetido; leitura de `00001-2023-1101`.

---

## CT-FSWTBC-1280  (protheus · Concluído)

**Título:** Aplicar realinhamento de preços num contrato vigente e conferir a contabilização das diferenças

**Origem:** FSWTBC-1280 — "DEM10013608 - Realinhamento de preços" (terceiro ticket da mesma DEM, com FSWTBC-56 e 328). Última posição: *"aguardando ajustes da CONTABILIZAÇÃO para testes"*; fechado no mutirão de 16/10 com a pendência contábil em aberto. Caso de regressão do fluxo completo, com a contabilização como ponto de verificação principal.

**Módulo/Rota:** Protheus → **SIGAGCT** → *Atualizações › Contratos › Contratos* (**CNTA120**) → *Revisão* → **Realinhamento de Preços** (rotina customizada da DEM10013608 — nome de menu `<não documentado>` no ticket) → *Medições* (**CNTA121**) → **SIGACTB** › *Lançamentos Contábeis* (CT2). Nenhuma superfície no Fluig.

**Pré-condições**
- Contrato **Vigente (05)** com planilha de valor fixo, ao menos uma medição já contabilizada e cronograma futuro.
- Lançamentos padrão (CTBA080) da realinhamento cadastrados/ajustados — é a pendência declarada no ticket.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: a revisão gerada pelo realinhamento (CN9_REVISA + valor) e os lançamentos contábeis (CT2) das diferenças`. Sem credencial do Protheus.

**Passos**
1. Em **CNTA120**, posicionar num contrato vigente com histórico de medição e acionar a rotina de **Realinhamento de Preços** informando novo valor unitário e data-base retroativa.
2. Confirmar; abrir a revisão gerada (*Revisão* → *Visualizar*) e ler `CN9_REVISA`, `CN9_VLATU`, `CN9_DTREV`.
3. Em **CNTA121**, gerar a medição de diferença (ou a próxima medição) e efetivar.
4. Em **SIGACTB** › *Consultas › Lançamentos* (ou CTBR040 razão), filtrar a data da medição e o histórico do lançamento padrão.
5. Em **SIGAFIN** › *Contas a Pagar*, localizar o título (`E2_NUM`) gerado pela medição.

**Resultado esperado**
- Passo 2: nova revisão com `CN9_REVISA` incrementado e `CN9_VLATU` = valor realinhado; a revisão anterior passa a situação **10 (Revisado)**.
- Passo 3: a medição calcula a diferença retroativa com o valor realinhado.
- Passo 4: lançamentos CT2 gerados pelo lançamento padrão, débito/crédito batendo com o valor da medição, sem lançamento em branco ou duplicado.
- Passo 5: título a pagar com o valor da medição e natureza do contrato.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Contabilização ausente ou incorreta após o realinhamento — detalhe exato `<não documentado>` (a pendência foi registrada como "ajustes da contabilização", sem mensagem).

**Severidade:** Alta *(risco contábil e financeiro)*

**Preparação de massa:** contrato vigente de valor fixo com medição já paga, na filial do executor, e os lançamentos padrão validados pela contabilidade da CASSI (Elaine/Adriana são citadas no ticket). Não pode ser criado pela automação.

**Verificado em tela:** NÃO
**Módulo ERP:** `Contratos - GCT`
**O que foi verificado:** nada no ERP. No Fluig só se confirmou que os campos de reajuste/revisão existem no dataset de contratos (`CN9_REVISA`, `CN9_VLATU`, `CN9_DTREV`, `CN9_VLREAJ` — apenas 3 contratos com `CN9_VLREAJ > 0`).
**Divergências encontradas:** nenhuma. O ticket não nomeia a rotina de menu do realinhamento.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1324  (protheus · Concluído · Não será feito)

**Título:** Aplicar o reajuste periódico de um contrato vigente pelo índice cadastrado e obter nova revisão com valor reajustado

**Origem:** FSWTBC-1324 — "Erro no reajuste de contrato em produção". Resolução **Não será feito**; escalado à matriz TOTVS e encerrado por informação verbal (*"Geise informa via Teams que já foi concluída"*), sem retorno do chamado. Fechado no mesmo dia e pela mesma via que o 1323. Caso de regressão do reajuste, com o cenário original `<não documentado>`.

**Módulo/Rota:** Protheus → **SIGAGCT** → *Atualizações › Contratos › Contratos* (**CNTA120**) → contrato vigente → **Reajuste** (rotina de reajuste do GCT — *Atualizações › Contratos › Reajuste*; código de rotina a confirmar no menu do cliente) → revisão gerada. Cadastros de apoio: *Índices* (`CN9_INDICE`), *Periodicidade* (`CN9_PERI`/`CN9_UNPERI`), *Próx. Reajuste* (`CN9_PROXRJ`). Contraprova no Fluig: dataset de contratos (`CN9_DTREAJ`, `CN9_PROXRJ`, `CN9_VLREAJ`, `CN9_INDICE`, `CN9_REVISA`, `CN9_VLATU`); *Acompanhamento de Contratos* → coluna **Nº Revisão**.

**Pré-condições**
- Contrato **Vigente (05)** com `CN9_INDICE` preenchido (hoje 518 de 860 têm: `001` = 346, `004` = 117, `003` = 31…) e `CN9_PROXRJ` ≤ data do teste (509 contratos com `CN9_PROXRJ` preenchido; ex.: `00001-2023-1101` → 2025-02-12).
- Valor do índice cadastrado para a competência do reajuste.
- Nenhuma revisão aberta (situação 09) no contrato.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: a execução da rotina de reajuste (crítica/erro) e a revisão gerada com o novo valor`. Sem credencial do Protheus.

**Passos**
1. Em **CNTA120**, posicionar num contrato vigente com `CN9_PROXRJ` vencido e sem revisão aberta; anotar `CN9_VLATU`, `CN9_REVISA`, `CN9_INDICE`, `CN9_PROXRJ`.
2. Acionar **Reajuste**; confirmar índice e data-base; processar.
3. Visualizar a revisão gerada e a planilha reajustada (**CNTA100**): `CNA_VLTOT`, `CNA_DTREAJ`, `CNA_PROXRJ`, `CNA_FLREAJ`.
4. Aprovar/efetivar a revisão (se o fluxo do cliente exigir) e reabrir o contrato.
5. Contraprova no Fluig: consultar `dsProtheus_getContratosxFornecedores_restGet` (`CN9_NUMERO`) e ler `CN9_REVISA`, `CN9_VLATU`, `CN9_DTREAJ`, `CN9_PROXRJ`, `CN9_VLREAJ`; no *Acompanhamento de Contratos*, conferir **Nº Revisão**.

**Resultado esperado**
- Passo 2: a rotina conclui sem *help* de erro e sem gravar `error.log`.
- Passo 3: `CNA_VLTOT` = valor anterior × (1 + índice); `CNA_DTREAJ` = data-base; `CNA_PROXRJ` = data-base + periodicidade.
- Passo 4: `CN9_REVISA` incrementado; revisão anterior em situação **10**; `CN9_VLATU` reajustado; `CN9_VLREAJ` = diferença.
- Passo 5: Fluig reflete os mesmos valores (a integração lê o GCT; não há cache).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro na execução do reajuste em produção — mensagem `<não documentado>` (ticket sem conteúdo; encerrado sem diagnóstico).

**Severidade:** Alta *(valor de contrato e pagamento a fornecedor)*

**Preparação de massa:** contrato vigente com índice e `CN9_PROXRJ` vencido, sem revisão aberta, na filial do executor; índice com valor cadastrado para a competência. Existe em quantidade (509 com `CN9_PROXRJ`); nenhuma criação necessária. Só executar em ambiente de teste — reajuste gera revisão irreversível.

**Verificado em tela:** NÃO
**Módulo ERP:** `Contratos - GCT`
**O que foi verificado:** apenas a contraprova: dataset de contratos expõe `CN9_INDICE`, `CN9_DTREAJ`, `CN9_PROXRJ`, `CN9_VLREAJ` (só **3** contratos com `CN9_VLREAJ > 0`: `00152-2023-5303`, `4600004047`, `00180-2023-5303`); `getPlanilha` expõe `CNA_DTREAJ/CNA_PROXRJ/CNA_FLREAJ`. `dsProtheus_getReajusteContrato_restGetAll` **não existe** (500 NPE). ERP não aberto.
**Divergências encontradas:** 509 contratos com `CN9_PROXRJ` preenchido e a maioria com data já vencida (ex.: 2025-02-12, 2025-02-06, 2025-03-20 em contratos vigentes) — ou o reajuste não está sendo aplicado, ou o campo não é atualizado; vale conferir no ERP antes de usar como massa.
**Dados/massa usados:** nenhum — não submetido; leitura de `00001-2023-1101`, `00003-2024-1101`, `00005-2022-1101`.

---

## CT-FSWTBC-1343  (protheus · Concluído)

**Título:** Configurar índice e periodicidade de reajuste num contrato e confirmar que o GCT calcula a próxima data de reajuste

**Origem:** FSWTBC-1343 — "Atendimentos Diversos" (problemas no reajuste de contratos). Atendimento consultivo: a resposta foi indicar o artigo da Central de Atendimento TOTVS sobre configuração e revisão de reajuste no SIGAGCT — dúvida de parametrização, não defeito. O ticket não registra o que foi concluído. Caso escrito como **caracterização de caminho** da parametrização.

**Módulo/Rota:** Protheus → **SIGAGCT** → *Atualizações › Cadastros › Índices* (cadastro de índices de reajuste e seus valores mensais) → *Atualizações › Contratos › Contratos* (**CNTA120**) → campos **Índice** (`CN9_INDICE`), **Periodicidade** (`CN9_PERI`), **Unid. Período** (`CN9_UNPERI`), **Dt. Reajuste**/**Próx. Reajuste** (`CN9_DTREAJ`/`CN9_PROXRJ`); planilha (**CNTA100**): `CNA_INDICE`, `CNA_FLREAJ`.

**Pré-condições**
- Índice de reajuste cadastrado com valores para as competências do período.
- Contrato em **Elaboração (01)** ou em revisão aberta (09) para permitir alterar a parametrização.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: os campos de parametrização de reajuste do contrato/planilha e o cálculo de Próx. Reajuste`. Sem credencial do Protheus.

**Passos**
1. Em *Índices*, abrir um índice (ex.: `001`) e conferir que há valor cadastrado para os últimos 12 meses.
2. Em **CNTA120**, alterar um contrato em Elaboração: informar **Índice** = `001`, **Periodicidade** = 12, **Unid. Período** = meses, **Dt. Reajuste** = data de início; confirmar.
3. Na planilha (**CNTA100**), marcar a planilha como reajustável (`CNA_FLREAJ` = Sim) e informar o índice.
4. Reabrir o contrato e ler **Próx. Reajuste**.
5. Contraprova no Fluig: `dsProtheus_getContratosxFornecedores_restGet` → `CN9_INDICE`, `CN9_PERI`, `CN9_UNPERI`, `CN9_PROXRJ`.

**Resultado esperado**
- Passo 2: campos aceitos sem crítica; índice validado contra o cadastro.
- Passo 4: **Próx. Reajuste** = Dt. Reajuste + 12 meses, calculado automaticamente.
- Passo 5: mesmos valores no Fluig.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Reajuste não calculado ou calculado em data errada por parametrização incompleta — o ticket não descreve o sintoma (`<não documentado>`).

**Severidade:** Baixa *(consultivo; sem defeito confirmado)*

**Preparação de massa:** um contrato em Elaboração na filial do executor (hoje 19 em situação 01) e um índice com valores cadastrados — ambos pré-existentes; nada a criar.

**Verificado em tela:** NÃO
**Módulo ERP:** `Contratos - GCT`
**O que foi verificado:** só a contraprova: distribuição de `CN9_INDICE` na base (`001` 346, vazio 342, `004` 117, `003` 31, `010` 9, `008` 7, `002` 3, `005` 3) e presença de `CN9_PERI/CN9_UNPERI/CN9_PROXRJ` no dataset. ERP não aberto.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1501  (protheus · Concluído)

**Título:** Excluir um cronograma financeiro de planilha de contrato sem travamento e com o saldo a medir recalculado

**Origem:** FSWTBC-1501 — "Sistema trava ao tentar excluir cronograma em produção". Incidente de produção fechado no mesmo dia sem registro técnico. Exclusão de cronograma mexe em medição futura.

**Módulo/Rota:** Protheus → **SIGAGCT** → *Atualizações › Contratos › Contratos* (**CNTA120**) → contrato em revisão/elaboração → planilha (**CNTA100**) → **Cronograma Financeiro** (`CNA_CRONOG` → tabela CNF/CNG; *Atualizações › Cronogramas*) → **Excluir**. Contraprova no Fluig: `dsProtheus_getPlanilha_restGetAll` (`CNA_CRONOG`, `CNA_SALDO`); *Faturamento de Contratos* (256836) → campo **Saldo a Medir**.

**Pré-condições**
- Contrato com planilha vinculada a cronograma (`CNA_CRONOG` preenchido; ex.: `00001-2023-1101` planilha `000001` → `000006`) e **sem parcela do cronograma já medida** (cronograma com medição não pode ser excluído — a crítica esperada).
- Contrato em situação que permita alterar (01 ou 09).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: a exclusão do cronograma (ou sua crítica) e o recálculo de saldo/parcelas`. Sem credencial do Protheus.

**Passos**
1. Em **CNTA120**, posicionar num contrato de teste em revisão aberta (ex.: `00006-2022-1101` rev 003) e abrir a planilha; anotar `CNA_CRONOG` e `CNA_SALDO`.
2. Abrir o **Cronograma Financeiro** vinculado; acionar **Excluir** num cronograma **sem** parcela medida; confirmar.
3. Cronometrar: a tela deve responder em segundos; verificar se o AppServer registra lock (`error.log`, *Monitor* de conexões).
4. Reabrir a planilha: `CNA_CRONOG` vazio (ou novo cronograma), `CNA_SALDO` recalculado.
5. Repetir o passo 2 num cronograma **com** parcela já medida.
6. Contraprova no Fluig: `dsProtheus_getPlanilha_restGetAll` para a planilha → `CNA_CRONOG`/`CNA_SALDO`; iniciar (sem enviar) um *Faturamento de Contratos* para o contrato e ler **Saldo a Medir**.

**Resultado esperado**
- Passos 2–3: exclusão concluída sem travar a sessão nem deixar lock na CNF/CNG; sem *THREAD ERROR*.
- Passo 4: planilha sem cronograma, saldo coerente com os itens.
- Passo 5: crítica clara impedindo excluir cronograma com parcela medida — sem travar.
- Passo 6: Fluig reflete `CNA_CRONOG` vazio e *Saldo a Medir* recalculado.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Sistema **trava** ao tentar excluir o cronograma (sessão presa, sem mensagem) — detalhe `<não documentado>`.

**Severidade:** Alta *(cronograma define parcelas de medição/pagamento; travamento em produção)*

**Preparação de massa:** contrato de teste em revisão aberta com cronograma sem medição — escolher entre os 11 em situação 09 medidos hoje ou criar um contrato `QA` em Elaboração no ERP de teste. Nunca executar em produção.

**Verificado em tela:** NÃO
**Módulo ERP:** `Contratos - GCT`
**O que foi verificado:** só a contraprova: `getPlanilha` devolve `CNA_CRONOG = 000006` e `CNA_SALDO = 18809.28` para `00001-2023-1101`; formulário 256836 tem **Saldo a Medir** (lido na instância 111980, em branco). `dsProtheus_getCronograma*` **não existem** (500 NPE) — não há leitura de cronograma pelo Fluig. ERP não aberto.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1502  (protheus · Concluído)

**Título:** Editar o valor total (`CNA_VLTOT`) da planilha numa revisão aberta de contrato, com o patch TOTVS aplicado

**Origem:** FSWTBC-1502 — "Erro na edição do campo CNA_VLTOT na revisão aberta". **Defeito de produto padrão** confirmado: chamado na TOTVS, pacote enviado; para testar *"realizamos a criação de um novo ambiente em produção e aplicamos o patch"* (prática de risco registrada); ficou aguardando homologação e foi fechado no mutirão de 13/05 sem confirmar a aplicação definitiva em produção.

**Módulo/Rota:** Protheus → **SIGAGCT** → *Atualizações › Contratos › Contratos* (**CNTA120**) → contrato **Vigente** → **Revisão** (abre a revisão — situação 09) → planilha (**CNTA100**) → campo **Vlr. Total** (`CNA_VLTOT`). Contraprova no Fluig: dataset de contratos (`CN9_SITUAC = 09`, `CN9_REVISA`), *Acompanhamento de Contratos* → **Nº Revisão**.

**Pré-condições**
- Contrato vigente com revisão **aberta** (situação 09) — hoje há 11 (`00006-2022-1101` rev 003, `00003-2024-3503` rev 004, `000000000000001` rev 004, `00010.2024.3517` rev 001, `6182-2025-5303` rev 002…).
- Patch TOTVS do FSWTBC-1502 (ou release que o incorpore) aplicado no RPO **do ambiente sob teste** — o ticket não confirma a aplicação em produção; o executor deve anotar a data do RPO.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: a crítica/erro ao editar CNA_VLTOT na planilha de uma revisão aberta`. Sem credencial do Protheus.

**Passos**
1. Registrar versão/data do RPO (*Ajuda › Sobre*) e confirmar a presença do pacote.
2. Em **CNTA120**, posicionar num contrato em situação 09 e acionar *Revisão › Alterar*.
3. Na planilha, alterar quantidade/valor unitário de um item e sair do campo; editar diretamente **Vlr. Total** se o dicionário permitir.
4. Confirmar; reabrir a revisão e ler `CNA_VLTOT`, `CN9_VLATU`.
5. Efetivar a revisão (ambiente de teste) e conferir que a anterior vai para situação 10 e a nova para 05.
6. Contraprova no Fluig: `dsProtheus_getContratosxFornecedores_restGet` → `CN9_SITUAC`, `CN9_REVISA`, `CN9_VLATU`; *Acompanhamento de Contratos* → **Nº Revisão**.

**Resultado esperado**
- Passo 3: sem erro ao abrir/editar o campo; total recalculado.
- Passo 4: valor persistido; `CN9_VLATU` da revisão = `CNA_VLTOT` (planilha única).
- Passo 5: transição 09 → 05 e antiga → 10 sem crítica.
- Passo 6: Fluig mostra a nova revisão e o valor.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro ao editar `CNA_VLTOT` na revisão aberta (mensagem exata `<não documentado>`), resolvido apenas com o pacote da TOTVS.

**Severidade:** Alta *(valor de contrato; risco de patch não aplicado em produção)*

**Preparação de massa:** contrato com revisão aberta — existe (11 hoje). Confirmar com a infraestrutura **em qual ambiente o patch está aplicado** antes de executar; o ticket registra que foi testado num "novo ambiente em produção".

**Verificado em tela:** NÃO
**Módulo ERP:** `Contratos - GCT`
**O que foi verificado:** só a massa: dataset de contratos com `CN9_SITUAC = 09` devolve **11** contratos com `CN9_LOGDAT` entre 22/06 e 25/08/2026 (revisões abertas recentes). ERP não aberto.
**Divergências encontradas:** o ticket deixa em aberto se o patch foi aplicado na produção "oficial" — pré-condição a confirmar.
**Dados/massa usados:** nenhum — não submetido; leitura dos 11 contratos em situação 09.

---

## CT-FSWTBC-1615  (protheus · Concluído)

**Título:** Gerar o cronograma financeiro de um contrato e medi-lo sem produzir chave duplicada na CNF

**Origem:** FSWTBC-1615 — "[Suporte Abril/2025] chave duplicada CNF cronograma financeiro". Resolvido **refazendo o dado** ("o contrato estava com vários erros em seu cadastro; após excluir a medição existente e excluir os cronogramas e refazer o processo, o erro foi corrigido") — a causa da duplicidade **não foi investigada**, então pode reincidir.

**Módulo/Rota:** **Protheus → SIGAGCT → Atualizações → Contratos (CNTA100/CNTA300)** → planilha (CNA) → **Cronograma Financeiro (CNF)**; **Medição (CNTA120)**. Índice único da CNF no **SIX** (Configurador → Índices → CNF). Eco no Fluig, só quando a medição parte do portal: *Faturamento de Contratos* → *Gravar/Encerrar Medição (105)* → *Correção (117)* com a mensagem do ERP no Histórico.

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGAGCT e ao Configurador (leitura do SIX).
- Contrato de homologação com planilha de **≥ 2 parcelas** e cronograma financeiro gerado; contrato prefixado `QA` na descrição.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: violação de chave única na CNF ao gerar/regerar cronograma ou medir; a integridade da tabela não é exposta por dataset`

**Passos**
1. Configurador → SIX → CNF: anotar a chave única (filial + contrato + revisão + planilha + parcela — confirmar na tela).
2. CNTA100/CNTA300 → contrato `QA` → planilha → gerar **Cronograma Financeiro**; consultar a CNF (`SELECT` pelo contrato ou tela de cronograma) e anotar as parcelas.
3. **Regerar** o cronograma da mesma planilha (alterar valor/parcelas e regerar).
4. Gerar uma **revisão** do contrato (aditivo) e regerar o cronograma da revisão.
5. CNTA120 → medir a 1ª parcela; encerrar a medição.
6. Consultar a CNF: parcelas por (contrato, revisão, planilha).

**Resultado esperado**
- Passos 3–5: nenhuma mensagem de **chave duplicada** (`unique constraint`/`chave duplicada` do banco) — a regeração substitui as parcelas antigas ou as reindexa; a revisão cria parcelas sob a **nova** revisão, sem colidir com a anterior.
- Passo 6: exatamente uma linha por (filial, contrato, revisão, planilha, parcela); nenhuma parcela órfã de cronograma excluído.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro de chave duplicada na CNF ao medir/regerar; medição bloqueada até excluir manualmente medição e cronogramas e refazer o processo.

**Severidade:** Alta *(medição bloqueada; correção exige destruir e refazer dados do contrato)*

**Preparação de massa:** contrato `QA` com planilha multi-parcela criado pelo executor no SIGAGCT de homologação (a automação não cria contrato). Não usar contratos reais.

**Verificado em tela:** NÃO
**O que foi verificado:** só o eco no Fluig — as 7 instâncias de Faturamento em *Correção (117)* hoje seguem a cadeia 105 → 182 → 162 → 117, e o Histórico é a única superfície da mensagem do ERP (API de histórico em 500). `dsProtheus_getCronogramaFinanceiro_restGetAll`/`dsProtheus_getCronograma_restGetAll` **não existem** (GET search → 500 NPE) — a CNF não é exposta ao Fluig.
**Divergências encontradas:** nenhuma quanto ao ticket; registrar que a causa da duplicidade continua desconhecida.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-1703  (protheus · Concluído)

**Título:** Emitir o relatório de Conciliação de Contratos (UGCTR001) e obter linhas para um período com medições

**Origem:** FSWTBC-1703 — "[Suporte Maio/2025] Conciliação Contratos - UGCTR001": o relatório não retornava nada. Causa-raiz de **dicionário**: "a tabela genérica **ZB não estava criada no SX5**, ocasionando erro na query e não trazendo nada no relatório". Criada a tabela, o relatório voltou.

**Módulo/Rota:** **Protheus → SIGAGCT → Relatórios → (específicos) → Conciliação de Contratos (`UGCTR001`)**; **Configurador → Ambiente → Cadastros → Tabelas (SX5)** → tabela **ZB**.

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGAGCT (relatório) e ao Configurador (SX5, leitura).
- Ao menos um contrato de homologação com medição encerrada no período que será filtrado.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: relatório vazio e erro de query no console.log; a tabela SX5 ZB não é exposta por dataset nem por tela do Fluig`

**Passos**
1. Configurador → SX5 → localizar a tabela **ZB**: confirmar que existe **na filial/empresa do relatório** e listar os itens (código/descrição).
2. Anotar no console.log do AppServer a última linha antes do teste (para isolar o que o passo 3 produzir).
3. SIGAGCT → Relatórios → **Conciliação Contratos (UGCTR001)** → parâmetros: período que contenha a medição da pré-condição, filial do contrato, demais filtros "Todos" → **Imprimir** (planilha ou tela).
4. Ler o relatório e o console.log.
5. Repetir o passo 3 com um período **sem** medições.

**Resultado esperado**
- Passo 1: tabela ZB presente, com itens (se ausente, parar: é o defeito de dicionário — pacote que levou o fonte sem a SX5).
- Passo 4: relatório com **ao menos a linha** da medição da pré-condição (contrato, medição, valores); **nenhum** erro de query (`Invalid object name`/`coluna inexistente`/`ZB`) no console.log.
- Passo 5: relatório vazio **com aviso explícito** ("Não há registros para os parâmetros") — vazio por filtro tem que ser distinguível de vazio por erro.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Relatório sem linha alguma para qualquer período; erro de query no console.log ao consultar a ZB.

**Severidade:** Média *(relatório de conciliação — controle, não bloqueia fluxo)*

**Preparação de massa:** contrato `QA` com medição encerrada no SIGAGCT de homologação, pelo executor; validação prévia de SX5 pelo administrador do Protheus ao aplicar qualquer pacote que contenha o UGCTR001.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — `UGCTR001` e "ZB" não aparecem em nenhum fonte publicado nem nos nomes de dataset do tenant.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-1962  (protheus · Concluído)

**Título:** Ajustar o fiscal de uma planilha em contrato multifilial e obter a mesma designação na planilha e na revisão vigente

**Origem:** FSWTBC-1962 — "Fiscal multifilial no contrato não permite ajuste - SD763467": ao ajustar, a mensagem dizia que **existe fiscal para a planilha, mas não existe na revisão** — a validação olha um escopo (planilha) e o dado está em outro (revisão). Entregue junto com a virada de versão.

**Módulo/Rota:** **Protheus → SIGAGCT → Atualizações → Contratos (CNTA300)** → **revisão vigente** → planilha → campo **Fiscal** (customizado: `CNA_XFISCA` na planilha; `CN9_XFISCA` no contrato; `CNA_XAPFIS` = aprovação do fiscal). "Multifilial": o mesmo número de contrato existe em várias filiais (ex.: `000000000000010` em 2101, 2501, 2701, 3104 e 3106). Contraprova no Fluig: `dsProtheus_getInfoPlanilhaxContrato_restGetAll` (colunas `CNA_REVISA`, `CNA_NUMERO`, `CNA_XFISCA`, `CN9_XFISCA`, `CNA_XAPFIS`); **Acompanhamento de Contratos** → modal *Informações Complementares do Contrato* → **Fiscal de Serviço**; processo **Delegação de Fiscais de Contrato/Serviço** (`wf_delegacaoFiscalContratoServico`: *Filial Contrato*, *Número Contrato*, *Filial Planilha*, *Número Planilha*, *Filial Medição*, *Fiscal*).

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGAGCT (manutenção de contrato/planilha) em homologação.
- Contrato `QA` com **≥ 2 revisões** e **≥ 2 planilhas**, cadastrado em **≥ 2 filiais**, com fiscal preenchido na planilha da revisão anterior.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: a crítica "existe fiscal para a planilha, mas não existe na revisão" ao gravar o ajuste; o Fluig só lê o fiscal já gravado`

**Passos**
1. Anotar, para cada filial do contrato `QA`, `CNA_XFISCA` de cada planilha nas revisões anterior e vigente (consulta ou o dataset do Fluig com `BranchId`/`CN9_REVISA`).
2. CNTA300 → filial A → contrato → **revisão vigente** → planilha 000002 → alterar **Fiscal** para outro usuário válido → confirmar planilha e contrato.
3. Repetir na filial B para a mesma planilha.
4. Reabrir cada revisão e conferir o fiscal.
5. Contraprova no Fluig: `GET …datasetId=dsProtheus_getInfoPlanilhaxContrato_restGetAll&filterFields=CorporateId,01,BranchId,<filial>,CN9_NUMERO,<contrato>,CN9_REVISA,<rev vigente>` → `CNA_XFISCA` da 000002; Acompanhamento de Contratos → modal → *Fiscal de Serviço*.

**Resultado esperado**
- Passo 2–3: gravação **sem** crítica; a validação de fiscal considera a **mesma revisão** que está sendo editada.
- Passo 4: revisão vigente com o fiscal novo; revisão anterior **inalterada**; cada filial independente.
- Passo 5: dataset e modal espelham o fiscal novo na revisão vigente.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Mensagem **"existe fiscal para a planilha, mas não existe na revisão"** (texto conforme o ticket) e ajuste bloqueado; fiscal antigo continua recebendo as medições no Fluig.

**Severidade:** Alta *(fiscal é quem aprova a medição — designação errada desvia aprovação)*

**Preparação de massa:** contrato `QA` multifilial com duas revisões e duas planilhas, criado pelo time Protheus em homologação; usuários de fiscal de homologação existentes no Fluig. Não alterar fiscal de contratos reais.

**Verificado em tela:** NÃO
**O que foi verificado:** só a contraprova: E01-2025-2101 rev 007 → 20 planilhas, **todas com `CNA_XFISCA`** (10 pessoas distintas) e `CN9_XFISCA` = `valtair.oliveira@…` em todas (fiscal do contrato ≠ fiscal das planilhas — é a estrutura planilha × contrato do ticket); `ds_get_fiscalServico` → `Cannot read property "cna_xfisca" from undefined`; `dsProtheus_getFiscaisPorTipoContrato` → `[]`; formulário de **Delegação de Fiscais** abre para a conta de QA com os campos de filial de contrato/planilha/medição, mas o processo tem **0 instâncias** e nenhum campo de retorno de integração. Nenhum passo do ERP executado.
**Divergências encontradas:** `ds_get_fiscalServico` (dataset que resolve o fiscal de serviço) está quebrado hoje; Delegação de Fiscais nunca usada neste tenant. Nomes `CNA_XFISCA`/`CN9_XFISCA` são os do dataset — confirmar no SX3.
**Dados/massa usados:** leitura de E01-2025-2101 — nada submetido.

---

## CT-FSWTBC-1998  (protheus · Concluído)

**Título:** Incluir o fiscal de serviço em uma planilha de contrato e obter o fiscal gravado e visível no Fluig

**Origem:** FSWTBC-1998 — "SD764452 - Erro ao incluir o fiscal de serviço": erro ao incluir fiscal de serviço na planilha de contrato; log completo do Protheus anexado (`ERRO - PROTHEUS 11.06.txt`, 242 KB), correção não descrita. Terceira ocorrência da família "fiscal" em duas semanas (1962, 2028).

**Módulo/Rota:** **Protheus → SIGAGCT → Contratos (CNTA300)** → planilha → campo **Fiscal** (`CNA_XFISCA`, customizado) — inclusão em planilha nova ou existente. Contraprova no Fluig: `dsProtheus_getInfoPlanilhaxContrato_restGetAll` (`CNA_XFISCA`, `CNA_XAPFIS`), **Faturamento de Contratos** (a instância é atribuída ao fiscal da planilha — `chosenAssignees` da atividade *Realizar Medição do Contrato*), modal *Informações Complementares do Contrato* → *Fiscal de Serviço*.

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGAGCT em homologação; `console.log`/`error.log` do AppServer acessíveis.
- Contrato `QA` vigente com uma planilha **sem** fiscal.
- Usuário de fiscal de homologação existente no Fluig (o campo grava e-mail/login do Fluig).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: erro (error.log) ao gravar o fiscal na planilha; o Fluig só lê o fiscal já gravado`

**Passos**
1. Anotar a última linha do `error.log` do AppServer.
2. CNTA300 → contrato `QA` → planilha sem fiscal → informar **Fiscal** = usuário de homologação → confirmar.
3. Reabrir a planilha e conferir o campo.
4. Ler o `error.log`: nada novo após a linha do passo 1.
5. Contraprova no Fluig: dataset `dsProtheus_getInfoPlanilhaxContrato_restGetAll` para o contrato/revisão → `CNA_XFISCA` preenchido; Acompanhamento de Contratos → modal → *Fiscal de Serviço*; ao abrir uma medição (manual ou automática) dessa planilha, a instância de Faturamento nasce atribuída a esse fiscal.

**Resultado esperado**
- Passo 2–3: gravação sem erro; fiscal persistido.
- Passo 4: sem entrada nova no `error.log`.
- Passo 5: dataset, modal e atribuição da medição refletem o fiscal.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro ao confirmar a inclusão (tela de erro do Protheus com stack no `error.log`, como no anexo do ticket); planilha sem fiscal → medição sem responsável no Fluig.

**Severidade:** Média *(bloqueia a configuração da planilha; consequência: medição sem fiscal)*

**Preparação de massa:** contrato `QA` com planilha sem fiscal, criado pelo time Protheus em homologação; usuário de fiscal de homologação. Não alterar contratos reais.

**Verificado em tela:** NÃO
**O que foi verificado:** contraprova: `CNA_XFISCA`/`CNA_XAPFIS` expostos no dataset (20 planilhas de E01-2025-2101, todas com fiscal, `CNA_XAPFIS = N`); nas instâncias de Faturamento, *Realizar Medição do Contrato* é atribuída a um usuário específico (`chosenAssignees` com id de pessoa, ex.: 111980/111977/111973). Nenhum passo do ERP executado.
**Divergências encontradas:** nenhuma quanto ao ticket; a correção não está descrita.
**Dados/massa usados:** leitura — nada submetido.

---

## CT-FSWTBC-2025  (protheus · Concluído)

**Título:** Trocar o tipo de planilha de um contrato para "SEMI FIXA" e continuar medindo sem erro

**Origem:** FSWTBC-2025 — "SD764572 - Erro na troca do tipo de planilha": erro ao trocar o tipo de planilha para semi-fixo. Terceira ocorrência do tema (com FSWTBC-340 e 1751, onde o Protheus gerou **código duplicado** ao criar tipo novo). Correção não descrita no ticket.

**Módulo/Rota:** **Protheus → SIGAGCT → Atualizações → Cadastros → Tipos de Planilha** (`CNL` — código de rotina a confirmar no menu do cliente) e **Contratos (CNTA300)** → planilha → campo **Tipo de Planilha** (`CNA_TIPPLA`). Eco no Fluig: `dsProtheus_getTipoPlanContratos_restGetAll` (lista CNL) e `CNA_TIPPLA` em `dsProtheus_getInfoPlanilhaxContrato_restGetAll`; **Faturamento de Contratos** carrega a planilha pelo tipo.

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGAGCT (cadastro de tipos de planilha e manutenção de contrato).
- Contrato `QA` de homologação com planilha do tipo **001 FIXA**, sem medição em aberto.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: a crítica ao gravar a troca do tipo da planilha; o Fluig só lê o tipo já gravado`

**Passos**
1. Tipos de Planilha: listar os tipos e anotar código/descrição — hoje o Fluig lê **001 FIXA, 002 SEMI FIXA, 003 FIXA**.
2. CNTA300 → contrato `QA` → **Alterar** (ou nova revisão, conforme a política do cliente) → planilha → trocar **Tipo de Planilha** de 001 para **002 SEMI FIXA** → confirmar a planilha e o contrato.
3. Reabrir o contrato e conferir o tipo gravado.
4. Contraprova no Fluig: `GET /api/public/ecm/dataset/search?datasetId=dsProtheus_getInfoPlanilhaxContrato_restGetAll&filterFields=CorporateId,01,BranchId,<filial>,CN9_NUMERO,<contrato>,CN9_REVISA,<revisão>` → `CNA_TIPPLA` = `002`; abrir *Faturamento de Contratos* → informar o contrato → a planilha carrega com os itens.
5. Realizar uma medição parcial dessa planilha (CNTA120 ou pelo Fluig) e encerrar.

**Resultado esperado**
- Passo 2: a troca grava **sem** mensagem de erro; nenhuma crítica de tipo/código.
- Passo 3–4: `CNA_TIPPLA = 002` no ERP e no dataset; o Faturamento lista a planilha.
- Passo 5: medição gravada respeitando as regras de semi-fixa (quantidade variável, limite `CNL_LMTMED` se configurado).
- Passo 1 (achado): **não** deve haver dois tipos com a mesma descrição — 001 e 003 hoje se chamam ambos "FIXA".

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro ao confirmar a troca do tipo de planilha (mensagem não registrada no ticket); planilha permanece FIXA.

**Severidade:** Média *(bloqueia a reconfiguração do contrato; família que culminou no saldo zerado do FSWTBC-1397)*

**Preparação de massa:** contrato `QA` com planilha FIXA criado pelo executor no SIGAGCT de homologação; não trocar tipo em contratos reais. O E01-2025-2101 já tem uma planilha SEMI FIXA (000020) e serve para o passo 4 sem alterar nada.

**Verificado em tela:** NÃO
**O que foi verificado:** `dsProtheus_getTipoPlanContratos_restGetAll` (200, 3 linhas, 21 colunas `CNL_*`) e `dsProtheus_getInfoPlanilhaxContrato_restGetAll` para E01-2025-2101 rev 007 (20 planilhas; `CNA_TIPPLA` 001 em 19 e **002** na 000020). Nenhum passo do ERP executado.
**Divergências encontradas:** **dois tipos de planilha com a mesma descrição "FIXA" (001 e 003)** — compatível com o "código duplicado" do FSWTBC-1751; deve ser saneado ou documentado.
**Dados/massa usados:** leitura de E01-2025-2101 — nada submetido.

---

## CT-FSWTBC-2108  (protheus · Concluído · SDCASSI-17)

**Título:** Aprovar um contrato no GCT (de "em aprovação" para "vigente") sem crítica no campo CN9_TPCROC

**Origem:** FSWTBC-2108 — "Erro ao aprovar o contrato": erro no campo `CN9_TPCROC`; resolvido pela TOTVS Matriz após chamado (defeito do produto padrão). Encerrado "Não será feito" pela fábrica.

**Módulo/Rota:** **Protheus → SIGAGCT → Atualizações → Contratos (CNTA300)** → ação **Aprovar** (ou rotina de aprovação de contratos — a confirmar no menu do cliente); campo `CN9_TPCROC` (significado a confirmar no SX3 — Configurador → Dicionário → CN9). Eco no Fluig: **Acompanhamento de Contratos** lista só contratos com `CN9_SITUAC` em 01/05/06/07/08 (hoje 565 vigentes = 05) e o modal *Informações Complementares do Contrato* mostra *Status da Integração GCT*; a SC *Nova Contratação* gera o contrato via **Integração com ERP (287)** e cai em **Verificar retorno Protheus (317)** se o ERP recusar.

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGAGCT e permissão de aprovação de contrato em homologação.
- Contrato `QA` em situação anterior à aprovação (criado por SC *Nova Contratação* do Fluig ou direto no GCT).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: a crítica ao aprovar o contrato (campo CN9_TPCROC); a aprovação não passa pelo Fluig (CN9_APROV/CN9_GRPAPR vazios em 860/860 contratos)`

**Passos**
1. SX3 → `CN9_TPCROC`: tipo, tamanho, obrigatoriedade, validação e valor inicial (`X3_RELACAO`) — anotar.
2. CNTA300 → contrato `QA` → conferir o valor de `CN9_TPCROC` no cadastro (preenchido/vazio).
3. Aprovar o contrato.
4. Reabrir: situação = vigente (05); `CN9_TPCROC` com valor válido.
5. Contraprova no Fluig: Acompanhamento de Contratos → filtrar o contrato → *Status* = Vigente; modal → *Status da Integração GCT* sem erro.

**Resultado esperado**
- Passo 3: aprovação concluída sem mensagem de erro.
- Passo 4: `CN9_SITUAC = 05`; `CN9_TPCROC` preenchido conforme a regra do passo 1.
- Passo 5: contrato na grade com *Status* Vigente.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro ao aprovar citando `CN9_TPCROC` (print no ticket; texto não transcrito); contrato não vira vigente e não aparece como tal no Fluig.

**Severidade:** Alta *(aprovação de contrato bloqueada)*

**Preparação de massa:** contrato `QA` criado em homologação (por SC *Nova Contratação* aprovada pelos perfis de homologação, ou direto no GCT) pelo executor; pacote da TOTVS que corrigiu o padrão aplicado.

**Verificado em tela:** NÃO
**O que foi verificado:** grade de 860 contratos: `CN9_APROV` e `CN9_GRPAPR` vazios em **todos**, situações 05 (565) / 08 (143) / 06 (72) / 07 (61) / 01 (19); `CN9_TPCROC` **não** está entre as 121 colunas devolvidas por `dsProtheus_getContratosxFornecedores_restGet`; Acompanhamento de Contratos com 845 linhas. Nenhum passo do ERP executado.
**Divergências encontradas:** nenhuma quanto ao ticket. Achado colateral: **9 números de contrato repetidos** na grade (ex.: `000000000000010` em 5 filiais, `000000000000004` em 4) — número é único só por filial.
**Dados/massa usados:** leitura — nada submetido.

---

## CT-FSWTBC-2313  (protheus · Concluído · SDCASSI-48)

**Título:** Revisar um contrato por aditivo de quantidade e prazo e conferir que o cronograma contábil reflete o novo valor nas parcelas ainda não apropriadas

**Origem:** FSWTBC-2313 — na revisão 002 do contrato `00081-2022-3507` (aditivo de quantidade e prazo) o valor do cronograma contábil não foi atualizado. Regra de produto confirmada em dois ambientes: **parcela com provisão apropriada (Apropriado = Sim) não é alterada**; contorno vigente: excluir e recriar o cronograma. *Não será feito*; encaminhado à DEM10013608.

**Módulo/Rota:** Protheus → SIGAGCT → Gestão de Contratos → contrato → **Revisão** (aditivo) → *Cronograma Contábil* (CNW) e *Cronograma Financeiro* (CNF) — nomes de menu a confirmar no cliente. No Fluig, o aditivo nasce em *Solicitação de Compras* com *Tipo de Solicitação* = **Aditivo Contratual**, mas o cronograma não é exibido em nenhuma tela.

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGAGCT e ao SIGACTB (para ler a apropriação).
- Contrato de homologação **criado pelo executor**, com planilha cujo tipo tenha *Cronograma Contábil* = Sim (`CNL_CROCTB`), com ≥ 6 parcelas, sendo **duas já apropriadas** (Apropriado = Sim) e as demais não.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: valor das parcelas do cronograma contábil (CNW) e o flag Apropriado antes/depois da revisão`

**Passos**
1. Anotar, no contrato, cada parcela do cronograma contábil: número, valor, competência e *Apropriado* (Sim/Não).
2. Abrir *Revisão* do contrato; incluir aditivo alterando quantidade de um item e prorrogando o prazo (ex.: +3 meses); confirmar a revisão até *Vigente*.
3. Reabrir o cronograma contábil da nova revisão e comparar parcela a parcela com o passo 1.
4. Abrir o cronograma financeiro e repetir a comparação.
5. Não executar o contorno (excluir/recriar cronograma) — o objetivo é medir o comportamento nativo.

**Resultado esperado**
- Passo 3: as parcelas **não apropriadas** têm o valor redistribuído conforme o novo valor do contrato e novas parcelas cobrem o prazo prorrogado; as **duas apropriadas permanecem inalteradas** (imutabilidade contábil) — e a tela deixa isso visível (flag *Apropriado* = Sim nelas).
- Passo 4: o cronograma financeiro reflete o aditivo integralmente.
- Diferença entre soma do CNW e valor do contrato explicada **somente** pelas parcelas apropriadas.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Cronograma contábil com o valor **anterior** à revisão, inclusive em parcelas não apropriadas; contorno obrigatório de excluir e recriar o cronograma.

**Severidade:** Alta *(valor contábil provisionado errado)*

**Preparação de massa:** contrato de homologação com cronograma contábil de ≥ 6 parcelas, duas apropriadas — criado e apropriado pelo executor com credencial de GCT/CTB (apropriação em base de homologação, nunca em produção). Os contratos do ticket (`00081-2022-3507`) **não existem neste tenant**.

**Verificado em tela:** NÃO
**O que foi verificado:** apenas a ausência de superfície: `dsProtheus_getPlanilha_restGetAll` (colunas `CNA_CRONCT`, `CNA_CRONOG`, `CNA_VLTOT`, `CNA_SALDO`…) e `dsProtheus_getItensPlanilha_restGetAll` (`CNB_*`) não trazem parcelas; nenhum dataset `CNW`/`CNF` é citado no fonte publicado do Acompanhamento nem do Faturamento.
**Divergências encontradas:** contrato `00081-2022-3507` inexistente neste tenant (0 linhas).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2330  (protheus · Concluído · SDCASSI-53)

**Título:** Conferir o valor da amortização de um contrato com realinhamento pelo cronograma financeiro, e reconhecer que o cronograma contábil redistribui proporcionalmente

**Origem:** FSWTBC-2330 — contrato `00151-2023-2301`: a usuária via R$ 38.269,79 e a contabilização trouxe R$ 39.865,71. Conclusão da especialista: **não há defeito** — a amortização segue o cronograma **financeiro** (CNF); a usuária lia o cronograma **contábil** (CNW), que após realinhamento/aditivo redistribui os valores entre todas as parcelas. *Não será feito*; orientação formal: conferir sempre pelo financeiro.

**Módulo/Rota:** Protheus → SIGAGCT → Gestão de Contratos → contrato → *Cronograma Financeiro* e *Cronograma Contábil*; SIGAGCT → *Medição* → amortização; SIGACTB → lançamento da medição — nomes de menu a confirmar no cliente.

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Credencial no Protheus (SIGAGCT + leitura no SIGACTB).
- Contrato de homologação criado pelo executor, com planilha de cronograma contábil, **um realinhamento de preço já aplicado** e pelo menos uma medição amortizada após o realinhamento.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: valor da parcela no CNF × valor redistribuído no CNW e o valor contabilizado da amortização`

**Passos**
1. Abrir o cronograma financeiro (CNF) e anotar o valor da parcela da competência medida.
2. Abrir o cronograma contábil (CNW) e anotar o valor da mesma competência.
3. Abrir a medição da competência e o valor de amortização gerado.
4. Abrir o lançamento contábil da medição.

**Resultado esperado**
- Passo 3 = passo 1: a amortização é **igual à parcela do cronograma financeiro**.
- Passo 2 pode ser diferente do passo 1 após realinhamento — e isso **não é defeito**: o CNW redistribui o valor realinhado proporcionalmente entre todas as parcelas.
- Passo 4: o lançamento contábil da medição usa o valor do passo 3.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Não houve defeito; o sintoma relatado era amortização (R$ 39.865,71) diferente do valor lido no CNW (R$ 38.269,79). Se a amortização vier **diferente do CNF**, aí sim há defeito.

**Severidade:** Média *(risco de interpretação contábil; caso serve de regressão da regra "amortização = CNF")*

**Preparação de massa:** contrato de homologação com realinhamento e medição amortizada — criado pelo executor com credencial de GCT. O contrato `00151-2023-2301` **não existe neste tenant**.

**Verificado em tela:** NÃO
**O que foi verificado:** ausência de superfície: nenhum dataset do fonte publicado devolve parcelas CNF/CNW (ver medições no cabeçalho do lote).
**Divergências encontradas:** contrato do ticket inexistente aqui.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2332  (protheus · Concluído · SDCASSI-54)

**Título:** Executar a Apropriação de Despesa Antecipada para um contrato sem parcelas a apropriar e conferir a mensagem "Valores não encontrados"

**Origem:** FSWTBC-2332 — a rotina customizada de Apropriação de Despesa Antecipada (`UGCTE003`) exibia "operação efetivada" mesmo sem ter apropriado nada. Correção: quando o total a contabilizar é zero, exibir **"Valores não encontrados"**; a mensagem **"Contabilização finalizada"** continua sendo exibida (indica término sem erro) — decisão de desenho explícita. Validado pelo cliente.

**Módulo/Rota:** Protheus → SIGAGCT → menu customizado **Apropriação de Despesa Antecipada** (`UGCTE003`; nome de menu a confirmar no cliente) → parâmetros (filial, contrato, competência) → *Processar*.

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGAGCT e à rotina customizada.
- Dois contratos de homologação criados pelo executor: **A** com despesa antecipada e parcelas **já todas apropriadas** (ou sem parcelas no período); **B** com pelo menos uma parcela a apropriar no período.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: mensagens da rotina e lançamentos CT2 gerados pela apropriação`. A rotina é uma apropriação contábil — executar **somente em base de homologação**, nunca em produção (§2).

**Passos**
1. Executar a rotina para o contrato **A** (nada a apropriar) e ler as mensagens na ordem em que aparecem.
2. Consultar CT2 do contrato A na data — contar lançamentos.
3. Executar a rotina para o contrato **B** e ler as mensagens.
4. Consultar CT2 do contrato B — contar lançamentos e somar valores.
5. Executar novamente para **B** (parcelas já apropriadas no passo 3).

**Resultado esperado**
- Passo 1: aparece **"Valores não encontrados"** e, em seguida, **"Contabilização finalizada"** — nenhuma mensagem de "operação efetivada" isolada.
- Passo 2: zero lançamentos novos.
- Passo 3: sem "Valores não encontrados"; "Contabilização finalizada" ao final.
- Passo 4: lançamentos iguais ao total das parcelas a apropriar.
- Passo 5: mesmo resultado do passo 1 — a rotina não reapropria.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Contrato sem parcelas a apropriar: rotina termina com "operação efetivada" **sem** "Valores não encontrados", induzindo o usuário a crer que houve apropriação.

**Severidade:** Média *(feedback falso; risco de omissão de apropriação passar despercebida)*

**Preparação de massa:** contratos A e B de homologação com despesa antecipada e cronograma contábil, criados pelo executor; competência de teste isolada.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — rotina exclusiva do ERP; sem superfície (nenhum dataset `UGCTE003`/apropriação no fonte publicado).
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2743  (protheus · Concluído · SDCASSI-77)

**Título:** Marcar uma planilha de contrato como "zerar saldos" (CPC 06) e conferir que só ela é zerada, enquanto a planilha recorrente do mesmo contrato mantém o saldo

**Origem:** FSWTBC-2743 — GAP da DEM10013747 (*Melhoria da regra de Zerar Saldos / CPC 06*): a MIT044 original definia a regra por **tipo de contrato** (`CN1_CROCTB='1' .And. CN1_XDESA='S' .And. CN1_VLRPRV='2'`, no ponto de entrada `CN100SIT`), o que impedia o próprio teste. Correção de desenho (MIT044 v2 assinada): retirar a trava por tipo de contrato e criar **um campo no Tipo de Planilha (CNL)** indicando que a planilha é de zerar saldos — um contrato pode ter uma planilha de legado (zerada) e outra recorrente. 140 dias em homologação; concluído em 23/04/2026.

**Módulo/Rota:** Protheus → SIGAGCT → *Tipos de Planilha* (CNL; campo novo "zerar saldos" — nome a confirmar no dicionário do cliente) → Gestão de Contratos → contrato com **duas planilhas** → mudança de situação que dispara `CN100SIT` → saldo por planilha. Fluig (leitura complementar): **Acompanhamento de Contratos** → ícone *Planilha* (tipo `CNL_DESCRI`) e modal *Informações do Contrato* → *Saldo do Contrato* (`CN9_SALDO`); dataset `dsProtheus_getTipoPlanContratos_restGetAll`.

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Credencial no Protheus (SIGAGCT + Configurador para ler o dicionário CNL).
- Um tipo de planilha com o campo "zerar saldos" = Sim e outro = Não (criados pelo executor em homologação).
- Contrato de homologação **criado pelo executor** com duas planilhas: **P1** (tipo zerar saldos) e **P2** (tipo recorrente), ambas com saldo > 0.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: campo novo da CNL e saldo por planilha após o ponto de entrada CN100SIT`. O dataset do Fluig **não expõe o campo novo** (21 colunas, nenhuma `CNL_X*`).

**Passos**
1. No Configurador, confirmar a existência do campo de "zerar saldos" na tabela **CNL** (registrar o nome real).
2. Cadastrar/ajustar os dois tipos de planilha; anotar `CN1_CROCTB/CN1_VLRPRV` do tipo de contrato usado (a regra **não** pode mais depender deles).
3. No contrato de teste, anotar o saldo de P1, de P2 e o *Saldo do Contrato*.
4. Executar a mudança de situação que dispara a regra (conforme MIT044 v2 — ex.: encerramento/ativação, a confirmar).
5. Reler saldos de P1, P2 e do contrato no Protheus.
6. (Fluig, leitura) *Acompanhamento de Contratos* → filtrar o contrato → *Informações do Contrato* → *Saldo do Contrato*; ícone *Planilha* → tipo de cada planilha.
7. Repetir 3–5 com um contrato cujo tipo tenha `CN1_VLRPRV` ≠ '2' — a regra deve funcionar do mesmo jeito (trava por tipo de contrato removida).

**Resultado esperado**
- Passo 5: **P1 zerada; P2 com saldo intacto**; *Saldo do Contrato* = saldo de P2.
- Passo 6: o Fluig reflete o mesmo *Saldo do Contrato* e mostra os dois tipos de planilha.
- Passo 7: comportamento idêntico — a granularidade é a planilha, não o tipo de contrato.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Regra aplicada (ou bloqueada) pelo **tipo de contrato**: ou todas as planilhas do contrato são zeradas juntas, ou nenhuma, porque a condição `CN1_CROCTB='1' .And. CN1_XDESA='S' .And. CN1_VLRPRV='2'` não é satisfeita nos casos reais (valor financeiro já inexistente).

**Severidade:** Alta *(saldo contábil de contrato — CPC 06)*

**Preparação de massa:** dois tipos de planilha e um contrato com duas planilhas, criados pelo executor em homologação; nome do campo novo da CNL levantado no Configurador antes do teste.

**Verificado em tela:** PARCIAL
**O que foi verificado:** `dsProtheus_getTipoPlanContratos_restGetAll` (GET search, com `BRANCHID,5303` e sem filtro): **3 tipos de planilha**, colunas `CNL_CRALM, CNL_CTRFIX, CNL_PLSERV, CNL_TPLMT, CNL_MULMAN, CNL_LMTMED, CNL_VLRPRV, CNL_ALCMED, CNL_MEDEVE, CNL_NIVAGR, CNL_TPMULT, CNL_CROFIS, CNL_CROCTB, CNL_CREAJM, CNL_LMTAVS, CNL_CODAGR, CNL_TPSFIX, CNL_DESCRI, CNL_FILIAL, CNL_CODIGO, CNL_MEDAUT` — **sem campo custom**; `dsProtheus_getTipoContratos_restGetAll` traz `CN1_CROCTB, CN1_VLRPRV`, **não** `CN1_XDESA`. *Acompanhamento de Contratos* mostra *Saldo do Contrato* no modal e o tipo de planilha (`CNL_DESCRI` = "FIXA" no `00013-2026-5303`).
**Divergências encontradas:** a granularidade da MIT v2 (campo na CNL) **não é visível no Fluig** — se o campo existir no ERP, o dataset não o projeta; saldos incoerentes vivos (`00013-2026-5303`: `CN9_SALDO` −45.235,96 na rev. 001; `00050-2026-5303`: saldo 300.926,19 > valor atual 300.000,00) mostram que o *Saldo do Contrato* do Fluig não pode ser usado como oráculo isolado.
**Dados/massa usados:** datasets em leitura; contratos `00013-2026-5303` e `00050-2026-5303` (leitura). Nada submetido.

---

## Resumo do lote

| Key | Superfície | Módulo ERP | Verificado | Bloqueio |
|---|---|---|---|---|
| FSWTBC-2286 | COM | Contratos - GCT | SIM (Fluig) / NÃO (exclusão no ERP) | contraprova de exclusão exige credencial Protheus |
| FSWTBC-2313 | SEM | Contratos - GCT | NÃO | SOMENTE PROTHEUS — parcelas CNW/apropriação |
| FSWTBC-2326 | COM | Compras | PARCIAL | conta de QA sem matrícula de comprador; exclusão de pedido exige Protheus |
| FSWTBC-2330 | SEM | Contratos - GCT | NÃO | SOMENTE PROTHEUS — CNF × CNW e amortização |
| FSWTBC-2331 | SEM | Financeiro e Contabil | NÃO | SOMENTE PROTHEUS — efetivação/lançamento CT2 |
| FSWTBC-2332 | SEM | Contratos - GCT | NÃO | SOMENTE PROTHEUS — mensagens da rotina e CT2 |
| FSWTBC-2333 | SEM | Financeiro e Contabil | NÃO | SOMENTE PROTHEUS — CP/LP no lançamento |
| FSWTBC-2387 | COM | Compras | PARCIAL | conta sem perfil de comprador; `genericQuery` 404; exclusão da genérica exige Protheus |
| FSWTBC-2431 | SEM | Integracao e Filas | NÃO | SOMENTE PROTHEUS/SOC — cadastros no SOC; exige schedule |
| FSWTBC-2531 | SEM | RH - Folha | NÃO | SOMENTE PROTHEUS — SP8/Espelho/Meu RH |
| FSWTBC-2574 | SEM | RH - Folha | NÃO | SOMENTE PROTHEUS — resultado da folha; cálculo batch |
| FSWTBC-2598 | SEM | Integracao e Filas | NÃO | SOMENTE PROTHEUS — retorno da API e registro do documento |
| FSWTBC-2709 | SEM | Financeiro e Contabil (a confirmar) | NÃO | SOMENTE PROTHEUS — relatório; ticket sem descrição |
| FSWTBC-2743 | SEM | Contratos - GCT | PARCIAL | SOMENTE PROTHEUS — campo CNL e saldo por planilha; Fluig só espelha o saldo |

**Achados novos deste lote (não estavam em ticket):**
1. **42 contratos com *Via Solicitação Compra?* = 2 e *Número SC Origem* preenchido** nesta base (`CN9_XSC=2` × `CN9_XSCORI` não vazio) — o mesmo número que o FSWTBC-2286 mandou limpar por UPDATE em 2025. Ex.: `6200-2025-5303`→47288, `6182-2025-5303`→34895, `6199-2025-5303`→25895, `6201-2025-5303`→50098, `6237-2025-5303`→66942, `113-2021-5303` rev.004→001183, `00013-2026-5303`→75482, `6254-2025-5303` (situação 01-Cancelado)→45845. E 43 na situação inversa (`XSC=1` com `XSCORI` vazio: `6168-2025-5303`, `6165-2025-5303`, `000000000000214`…). Os dois lados da incoerência estão vivos; a trava de exclusão do ticket reincide em qualquer um dos 42.
2. O ícone **Solicitação de Compra** do *Acompanhamento de Contratos* não navega para a SC de origem — abre o modal de criação (*Aditivo contratual* / *Nova Contratação*). Não há caminho de navegação contrato → SC de origem no Fluig.
3. `00050-2026-5303` (saldo > valor atual) **não tem planilha** em `dsProtheus_getInfoPlanilhaxContrato_restGetAll` (rev. 001 → 0 linhas) — contrato com saldo e sem planilha é outra incoerência a investigar no GCT.

## CT-FSWTBC-2890  (protheus · Concluído · SDCASSI-116)

**Título:** Alterar a situação de um contrato para "Vigente" com a alçada de contratos habilitada e conferir que a aprovação da gestora é exigida antes da vigência

**Origem:** FSWTBC-2890 — o contrato `6173-2025-5303` passou direto a *Vigente* sem a aprovação da gestora. Causa: parâmetro
`MV_XALCGCT` (alçada da Gestão de Contratos) **desabilitado**; ajuste de parâmetro, sem código. Não há registro de por quanto tempo
esteve desligado nem de quantos contratos entraram em vigência sem alçada.

**Módulo/Rota:** SIGACFG → *Parâmetros* → `MV_XALCGCT`; SIGAGCT → *Contratos* → contrato em elaboração → *Outras Ações* → mudança de situação
para *Vigente* (nome da ação a confirmar no menu do cliente) → aprovação do gestor (rotina de alçada de contratos — a confirmar). Pós-condição
consultiva no Fluig: *Acompanhamento de Contratos* (`/portal/p/1/acompanhamentoContrato`) → coluna **Status** e modal *Informações do Contrato*.

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- `MV_XALCGCT` habilitado (conferir o valor **antes** de executar — é a pré-condição de auditoria deste caso).
- Contrato de homologação criado pelo executor, em situação anterior à vigência, com gestor/aprovador de alçada configurado.
- Credencial Protheus do executor e de um gestor aprovador.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: geração da pendência de alçada (aprovação da gestora) na mudança de situação; o Fluig só exibe o status final`.

**Passos**
1. SIGACFG → *Parâmetros* → localizar `MV_XALCGCT`; registrar o valor.
2. SIGAGCT → *Contratos* → selecionar o contrato de homologação → acionar a mudança de situação para *Vigente*.
3. Observar se o sistema gera pendência de aprovação e qual a situação do contrato após confirmar.
4. Com o gestor, aprovar a pendência.
5. Reabrir o contrato e ler a situação.
6. (Fluig, consultivo) *Acompanhamento de Contratos* → *Filtrar* pelo número do contrato → ler **Status**; ícone *Informações do Contrato* → *Dados Gerais*.

**Resultado esperado**
- Passo 1: `MV_XALCGCT` habilitado.
- Passo 3: pendência de alçada gerada; o contrato **não** fica *Vigente* antes da aprovação.
- Passo 5: *Vigente* somente após o passo 4.
- Passo 6: o Fluig mostra *Status* Vigente apenas depois da aprovação; antes, mostra a situação anterior.
- Se `MV_XALCGCT` estiver desabilitado, o sistema deve deixar isso evidente ao operador (hoje não deixa — registrar como lacuna, não como falha do caso).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O contrato muda para *Vigente* imediatamente, sem pendência de aprovação, sem aviso.

**Severidade:** Alta — controle de aprovação/alçada contornado sem rastro.

**Preparação de massa:** contrato de homologação em elaboração, criado pelo executor no SIGAGCT; gestor aprovador cadastrado na alçada; valor de `MV_XALCGCT` conferido pelo administrador.

**Verificado em tela:** NÃO
**O que foi verificado:** apenas a superfície consultiva do Fluig — *Acompanhamento de Contratos* abre com colunas *Filial, Tipo Contrato, Contrato, Data Inicio, Data Fim, Nº Revisão, Status, Fornecedor, Ação* (845 linhas na sonda; 0 no script seguinte — instabilidade). A busca por `6173` ocorreu com a grade vazia: existência do contrato **não confirmada**.
**Divergências encontradas:** o número `6173-2025-5303` não segue o padrão `NNNNN-AAAA-FFFF` do Acompanhamento (provável `06173-2025-5303`); o ticket não nomeia a ação de menu nem a rotina de aprovação.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2951  (protheus · PAUSADO CLIENTE · SDCASSI-124)

**Título:** Incluir uma revisão do tipo "Reajuste" com data retroativa em contrato com planilha de vários itens e conferir que a numeração dos itens permanece única e a revisão é salva

**Origem:** FSWTBC-2951 — revisões do tipo *Reajuste* com **datas retroativas** duplicam a numeração dos itens da planilha e impedem
salvar; as demais regras da revisão ficam corretas. Classificado como defeito de **produto** (rotina padrão do SIGAGCT), chamado na TOTVS
Matriz **sem resposta** desde 11/2025. **Status: PAUSADO CLIENTE — aberto**: o resultado esperado abaixo hoje **falha**.

**Módulo/Rota:** SIGAGCT → *Contratos* → contrato vigente → *Outras Ações* → *Revisão* (tipo **Reajuste**) — nomes de menu a confirmar no
cliente. Pós-condição consultiva no Fluig: *Acompanhamento de Contratos* → coluna **Nº Revisão** e ícone **Planilha** (itens via
`dsProtheus_getItensPlanilha_restGetAll`, campo de item `CNB_ITEM`).

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Contrato de homologação vigente, criado pelo executor, com planilha de **≥ 3 itens** e índice de reajuste cadastrado.
- Uma data-base de reajuste **anterior à data atual** e dentro da vigência.
- Credencial Protheus com permissão de revisão.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: numeração dos itens na grade da revisão e a recusa ao salvar`.

**Passos**
1. SIGAGCT → *Contratos* → selecionar o contrato → *Outras Ações* → *Revisão*.
2. Escolher o tipo **Reajuste**; informar data-base **retroativa** (ex.: 60 dias atrás) e o índice.
3. Antes de confirmar, inspecionar a grade de itens da planilha: coluna *Item* (`CNB_ITEM`) de cada linha.
4. Confirmar a revisão.
5. Reabrir o contrato: conferir *Nº Revisão* incrementado e os valores reajustados.
6. (Controle) Repetir 1–5 com data-base **igual à data atual**.
7. (Fluig, consultivo) *Acompanhamento de Contratos* → filtrar o contrato → *Nº Revisão*; ícone *Planilha* → itens listados uma única vez cada.

**Resultado esperado**
- Passo 3: cada item aparece **uma vez**, com numeração sequencial única (`001, 002, 003…`), tanto com data retroativa quanto atual.
- Passo 4: a revisão é salva sem crítica.
- Passo 5/7: revisão nova vigente; itens únicos; valores reajustados a partir da data-base.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia — e hoje ainda se vê)*
- Com data retroativa, a grade mostra itens com numeração **duplicada** (o mesmo número em duas linhas) e o sistema **não permite salvar** a revisão; com data atual, funciona.

**Severidade:** Alta — impede reajuste contratual retroativo (impacto financeiro e operacional na Gestão de Contratos).

**Preparação de massa:** contrato de homologação com planilha de vários itens e índice de reajuste, criado pelo executor no SIGAGCT. Não usar contrato de produção.

**Verificado em tela:** NÃO
**O que foi verificado:** apenas a superfície de pós-condição no Fluig: existência dos datasets `dsProtheus_getItensPlanilha_restGetAll` e `dsProtheus_getInfoPlanilhaxContrato_restGetAll` (`GET search` → 200) e a coluna *Nº Revisão* do Acompanhamento. `dsRevisaoContratos` existe mas devolve zero colunas (A17).
**Divergências encontradas:** o ticket não nomeia a rotina nem o campo; o Fluig só veria o efeito depois de salvar — exatamente o passo que o defeito impede.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-3014  (protheus · Concluído · SDCASSI-128)

**Título:** Abrir "Outras Ações" na rotina de contratos e conferir que a opção "Est. Refazer Prov. Contabil" está disponível e executa

**Origem:** FSWTBC-3014 — a opção *Est. Refazer Prov. Contabil* não aparecia em *Outras Ações*, contrariando a MIT. Não era lógica: o fonte
existia e **não estava compilado** no RPO do ambiente (quarta ocorrência do mesmo descompasso repositório × RPO no projeto). Resolvido
compilando.

**Módulo/Rota:** SIGAGCT → *Contratos* → selecionar contrato → **Outras Ações** → **Est. Refazer Prov. Contabil** (rótulo conforme o ticket;
menu a confirmar no cliente). Nenhuma superfície no Fluig.

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Contrato de homologação com cronograma contábil e provisão já contabilizada (para a opção ter o que estornar/refazer).
- Credencial Protheus com acesso ao SIGAGCT e permissão na rotina.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: presença e execução de item no menu Outras Ações da rotina de contratos`.

**Passos**
1. SIGAGCT → *Contratos* → selecionar o contrato de homologação.
2. Abrir **Outras Ações** e localizar **Est. Refazer Prov. Contabil**.
3. Executar a opção no contrato de homologação; confirmar.
4. SIGACTB → consultar os lançamentos do contrato: estorno da provisão anterior e nova provisão.
5. (Smoke pós-deploy) Repetir o passo 2 após cada aplicação de patch/compilação no ambiente.

**Resultado esperado**
- Passo 2: a opção **existe** no menu.
- Passo 3: executa sem erro e informa o resultado.
- Passo 4: lançamentos de estorno e de nova provisão com os valores corretos (parcelas ≤ 360 dias — ver CT-FSWTBC-3139).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- *Outras Ações* **sem** a opção *Est. Refazer Prov. Contabil* (print de 20/10/2025), embora o fonte esteja no repositório.

**Severidade:** Média — bloqueia a correção da provisão contábil; não altera dado por si.

**Preparação de massa:** contrato de homologação com provisão contabilizada, preparado pelo executor; confirmação com o administrador de que o RPO do ambiente contém a última compilação entregue.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — não há superfície.
**Divergências encontradas:** nenhuma verificável.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-3355  (protheus · Concluído · SDCASSI-152)

**Título:** Alterar o status de um contrato com campos customizados de provisão (voltar para "Em elaboração") e concluir sem erro de execução

**Origem:** FSWTBC-3355 — Ao alterar o status do contrato (retorno para *Em elaboração*), o Protheus abortava com `THREAD ERROR — type mismatch on * on PROCCNZ(UGCTE001.PRW) linha 528`. Corrigido na base CC54GO_DES em 27/11/2025, sem descrição do ajuste nem homologação registrada. Irmão do FSWTBC-3358 (linha 530) e do FSWTBC-2835 (linha 536) — três falhas no mesmo bloco de cálculo da provisão.

**Módulo/Rota:** Protheus · SIGAGCT · *Contratos > Gestão de Contratos > Contratos* (alteração de situação do contrato; rotina a confirmar no menu do cliente — o padrão é CNTA300 com a ação *Alterar Situação*/*Retornar p/ Elaboração*). Fluig apenas como contraprova: *Acompanhamento de Contratos* (coluna *Status*).

**Pré-condições**
- Usuário Protheus com acesso ao SIGAGCT na filial do contrato e permissão para alterar situação de contrato.
- Um contrato de teste com prefixo `QA` na descrição, já em situação *Emitido*/*Aprovação* (`CN9_SITUAC` 03/04), com planilha financeira preenchida e **todos os campos customizados de provisão** (os `CN9_X*`/`B1_X*` introduzidos pela DEM10013766 — nomes a confirmar no dicionário do cliente) em pelo menos duas variações: (a) todos preenchidos; (b) pelo menos um **vazio** — foi essa combinação que provocou o *type mismatch*.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: a rotina de mudança de situação aborta com THREAD ERROR (PROCCNZ/UGCTE001) e o status do contrato não muda`. Sem credencial Protheus nesta rodada.

**Passos**
1. No SIGAGCT, localizar o contrato `QA` e acionar a ação de alteração de situação, escolhendo o retorno para *Em elaboração*.
2. Confirmar a operação.
3. Repetir com o contrato da variação (b) — campo customizado de provisão vazio.
4. Reabrir o contrato e conferir a situação gravada.
5. Contraprova no Fluig (não é cobertura): abrir *Acompanhamento de Contratos*, filtrar pelo número do contrato `QA` e ler a coluna *Status*; abrir o modal *Informações Complementares do Contrato* e ler *Status da Integração GCT* / *Erro de Integração*.

**Resultado esperado**
- A mudança de situação conclui sem *THREAD ERROR*, nas duas variações; o contrato passa a *Elaboração* (02).
- Campo customizado de provisão vazio não derruba a rotina: ou é tratado como zero, ou a rotina recusa com mensagem de negócio legível (não com erro de execução).
- No Fluig, *Acompanhamento de Contratos* reflete *Elaboração* na próxima carga; *Erro de Integração* permanece vazio.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `THREAD ERROR ... type mismatch on * on PROCCNZ(UGCTE001.PRW) linha 528` e a situação do contrato não é alterada.

**Severidade:** Alta *(bloqueia o ciclo do contrato e é o mesmo bloco que calcula provisão contábil)*

**Preparação de massa:** um contrato `QA` por variação, criado no Protheus pelo próprio executor (o Fluig não cria contrato — é pré-condição de leitura). Confirmar antes com o time quais campos `X` participam do cálculo do PROCCNZ, porque o ticket não os nomeia.

**Verificado em tela:** NÃO
**Módulo ERP:** `Contratos - GCT`
**O que foi verificado:** apenas a contraprova Fluig — *Acompanhamento de Contratos* abre (845 linhas) e expõe *Status* com o mapa de 11 códigos acima; o modal *Informações Complementares do Contrato* tem *Status da Integração GCT* e *Erro de Integração*. Nada do Protheus foi aberto.
**Divergências encontradas:** o mapa de status do Fluig tem **dois códigos com o mesmo rótulo "Cancelado" (01 e 11)** — 9 e 3 contratos respectivamente; um executor não consegue distinguir os dois pela tela. O ticket não informa o contrato de teste nem os campos envolvidos.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3358  (protheus · Concluído · SDCASSI-151)

**Título:** Estornar a última revisão de um contrato e recuperar a revisão anterior sem erro de execução

**Origem:** FSWTBC-3358 — Ao estornar uma revisão de contrato, `THREAD ERROR — type mismatch on - on PROCCNZ(UGCTE001.PRW) linha 530`. Gêmeo do FSWTBC-3355 (mesma função, duas linhas adiante, mesma data, mesma correção em 27/11/2025), fechado com "disponível para validação na base CC54GO_DES", sem homologação registrada.

**Módulo/Rota:** Protheus · SIGAGCT · *Contratos > Gestão de Contratos > Contratos* → ação *Estornar Revisão* (nome de menu a confirmar no cliente). Fluig só como contraprova: *Acompanhamento de Contratos* (colunas *Revisão* e *Status*).

**Pré-condições**
- Usuário Protheus com acesso ao SIGAGCT e permissão de estorno de revisão.
- Contrato `QA` **vigente** com pelo menos **uma revisão gerada** (revisão 001) que ainda não tenha medição/parcela apropriada — o estorno padrão recusa revisões com movimentos posteriores.
- Duas variações da revisão: (a) campos customizados de provisão preenchidos; (b) pelo menos um vazio (cenário do *type mismatch*).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: o estorno aborta com THREAD ERROR e a revisão não é desfeita`. Sem credencial Protheus.

**Passos**
1. No SIGAGCT, posicionar no contrato `QA` na revisão 001 e acionar *Estornar Revisão*.
2. Confirmar.
3. Reabrir o contrato: conferir número da revisão corrente e situação.
4. Repetir para a variação (b).
5. Contraprova no Fluig: em *Acompanhamento de Contratos*, filtrar o contrato e conferir a coluna *Revisão* (a linha da revisão estornada não deve mais aparecer como vigente).

**Resultado esperado**
- O estorno conclui sem erro; o contrato volta à revisão anterior (ou à original, sem revisão) com status *Vigente* (05); a revisão estornada deixa de existir ou fica marcada como cancelada, conforme o padrão da rotina.
- Campo customizado vazio não produz erro de execução.
- No Fluig, a grade reflete a revisão corrente na próxima carga.

**Resultado se o defeito reincidir**
- `THREAD ERROR ... type mismatch on - on PROCCNZ(UGCTE001.PRW) linha 530`; a revisão permanece.

**Severidade:** Alta *(sem estorno, uma revisão errada não pode ser desfeita — impacto direto em valor de contrato e provisão)*

**Preparação de massa:** contrato `QA` com uma revisão, criados pelo executor no Protheus. Não usar contrato real: estorno é irreversível.

**Verificado em tela:** NÃO
**Módulo ERP:** `Contratos - GCT`
**O que foi verificado:** contraprova Fluig apenas. `dsRevisaoContratos` **existe** (GET search → 200) mas devolve **zero colunas** com e sem filtro (achado A17) — ou seja, o Fluig não tem hoje superfície de revisão que sirva para conferir o estorno; resta a coluna *Revisão* do Acompanhamento. Conferido no dump de contratos: `E001-2023` tem 6 revisões (rev 005 Vigente, as demais Revisado), `4600004115` tem 9 — há massa real de revisão no tenant, mas é massa de produção, **não usar para estorno**.
**Divergências encontradas:** o ticket não informa contrato nem revisão; a evidência (image-20251117) não foi baixada.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3442  (protheus · Concluído · SDCASSI-164)

**Título:** Visualizar um contrato existente no Protheus (e sua ficha no Fluig) sem erro de dicionário

**Origem:** FSWTBC-3442 — Ao visualizar contrato, o mesmo stack do FSWTBC-3441 (`variable does not exist V`, `PROTHEUSFUNCTIONMVC.PRX` linha 5577). Uma única expressão inválida no SX3 derrubava todas as operações do MVC do contrato. Corrigido em 08/12/2025 sem identificar o campo; registrado sob DEM diferente do gêmeo (10015225 × 10013766).

**Módulo/Rota:** Protheus · SIGAGCT · *Contratos > Gestão de Contratos > Contratos > Visualizar* (CNTA300). Fluig só como contraprova: *Acompanhamento de Contratos* → modal *Informações Complementares do Contrato* (lê via REST, não via MVC — por isso não cobre o defeito).

**Pré-condições**
- Usuário Protheus com acesso de consulta ao SIGAGCT.
- Contratos existentes em pelo menos três situações: *Vigente* (05), *Revisado* (10) e *Elaboração* (02) — o `FWInitCpo` roda em qualquer visualização, então basta um de cada.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: a tela de visualização do contrato aborta com THREAD ERROR antes de renderizar`. Sem credencial Protheus.

**Passos**
1. No SIGAGCT, posicionar num contrato *Vigente* e acionar *Visualizar*.
2. Percorrer as abas do modelo (cabeçalho, planilhas, cronogramas) e fechar.
3. Repetir para um *Revisado* e um em *Elaboração*.
4. Contraprova Fluig: em *Acompanhamento de Contratos*, filtrar os mesmos três contratos, abrir o modal *Informações Complementares do Contrato* e conferir que *Status da Integração GCT* e *Fiscal de Serviço* estão preenchidos.

**Resultado esperado**
- A visualização abre e fecha sem `THREAD ERROR` nas três situações; todos os campos customizados aparecem com valor ou vazios, nunca com erro.
- No Fluig, o modal abre com os três rótulos e sem "undefined".

**Resultado se o defeito reincidir**
- `THREAD ERROR — variable does not exist V on FWInitCpo(...)` ao abrir a visualização; a tela não renderiza.

**Severidade:** Média *(bloqueia consulta; não altera dado)*

**Preparação de massa:** nenhuma a criar — usar contratos existentes por leitura (visualizar não escreve). No Fluig, os contratos são descobertos na grade; no dump de hoje há 230 Vigentes, 591 Revisados e 8 em Elaboração.

**Verificado em tela:** NÃO
**Módulo ERP:** `Contratos - GCT`
**O que foi verificado:** contraprova Fluig — *Acompanhamento de Contratos* abre com 845 linhas e o modal tem os rótulos *Status da Integração GCT*, *Erro de Integração*, *Fiscal de Serviço*. O Protheus não foi aberto.
**Divergências encontradas:** o ticket não informa o contrato nem o campo; sem credencial, a existência de expressão inválida no SX3 do ambiente atual não pode ser afirmada nem negada.
**Dados/massa usados:** nenhum — leitura apenas.

---

## CT-FSWTBC-3491  (protheus · Concluído · SDCASSI-169)

**Título:** Realinhar preços de um contrato marcando a parcela como não apropriada e ver a contabilização das alterações efetivada

**Origem:** FSWTBC-3491 — Contrato E001-2023: o sistema permitiu alterar o campo *Apropriado* para NÃO, alterar a parcela e exibiu a tela de contabilização, mas a contabilização **não foi gerada**. Reincidência declarada do SDCASSI-132 (FSWTBC-3060). Ticket sem reprodução, sem correção identificada e encerrado em 19/06/2026 "para quando a demanda voltar" — **defeito nunca comprovadamente resolvido**.

**Módulo/Rota:** Protheus · SIGAGCT · *Realinhamento de Preços* (rotina do contrato — nome de menu a confirmar) → campo *Apropriado* da parcela → tela de contabilização; verificação em SIGACTB (lançamentos). Fluig: **nenhuma superfície**.

**Pré-condições**
- Usuário Protheus com acesso ao SIGAGCT (realinhamento) e SIGACTB.
- Contrato `QA` vigente com planilha de parcelas em que pelo menos uma parcela esteja **apropriada** (provisionada) e ainda não medida.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: tela de contabilização exibida e nenhum lançamento gerado no SIGACTB`. Sem credencial Protheus.

**Passos**
1. No SIGAGCT, abrir o contrato `QA` e acionar o realinhamento de preços.
2. Na parcela apropriada, alterar *Apropriado* para **NÃO** e alterar o valor da parcela.
3. Confirmar; quando a tela de contabilização for exibida, confirmar a contabilização.
4. No SIGACTB, consultar os lançamentos da data pela origem do contrato.
5. Voltar ao contrato e conferir o campo *Apropriado* e o valor da parcela gravados.

**Resultado esperado**
- Os lançamentos de estorno/ajuste da provisão são gerados e batem com a diferença entre o valor anterior e o realinhado.
- Se a contabilização falhar, a rotina informa o erro e **não** grava a alteração da parcela como concluída.

**Resultado se o defeito reincidir**
- Tela de contabilização aparece, a parcela fica alterada e *Apropriado* = NÃO, mas o SIGACTB não tem lançamento algum.

**Severidade:** Alta *(dado contábil dessincronizado do contrato; defeito com histórico de não resolução)*

**Preparação de massa:** contrato `QA` com parcela apropriada, criado pelo executor. **Não usar E001-2023** (existe no tenant, 6 revisões, rev 005 Vigente — é registro real).

**Verificado em tela:** NÃO
**Módulo ERP:** `Contratos - GCT`
**O que foi verificado:** o contrato do ticket existe: `E001-2023`, tipo 080, revisões 001–005 (005 Vigente, demais Revisado) — massa real, não tocar. `dsRevisaoContratos` devolve zero colunas (A17), então nem a revisão do realinhamento é visível no Fluig.
**Divergências encontradas:** título do ticket vazio de conteúdo ("DEM10015225 - - DEM10015225"); o caso foi montado pela descrição do campo *caso*.
**Dados/massa usados:** nenhum — leitura apenas.

---

## CT-FSWTBC-3601  (Protheus · Concluído · SDCASSI-77)

**Título:** Na base DES replicada, encerrar a situação de um contrato com planilhas de tipos diferentes e conferir que a regra "zerar saldos" (PE CN100SIT) só zera as planilhas parametrizadas

**Origem:** FSWTBC-3601 — "[CASSI - DEM10013747] - REPLICAÇAO DA BASE DES - GAP". Sem descrição; aberto e fechado em 24/12/2025 junto com 3602/3603/3604 (quarteto de GAP de replicação). O épico FSWTBC-714 (DEM10013747 — Melhoria da regra de Zerar Saldos / CPC06) define o efeito: alterar o ponto de entrada **CN100SIT** para zerar o saldo da planilha considerando o tipo de contrato (CN1) ou o tipo de planilha (CNL), aplicando a regra só a algumas planilhas. O gap de replicação se manifesta como **DES sem esse comportamento** (RPO/dicionário defasados). Caso escrito como regressão do efeito da DEM no DES.

**Módulo/Rota:** Protheus DES → Gestão de Contratos (SIGAGCT) → Contratos → alteração de situação do contrato (aciona o PE `CN100SIT`) → planilhas do contrato (CNL) e saldos; parametrização por tipo de contrato (CN1) / tipo de planilha (CNL). Nomes de menu **a confirmar no menu do cliente**. Superfície no Fluig **parcial e indireta**: o modal *Informações Complementares do Contrato* e a visão *Faturamento de Contratos* do Tracker mostram planilhas/saldos vindos do DES, mas não a regra de zerar — por isso o caso é SOMENTE PROTHEUS.

**Pré-condições**
- DES replicado da produção **após** a entrega da DEM10013747 (RPO com o PE CN100SIT atualizado; dicionário com os campos/parâmetros de tipo de planilha).
- Um contrato de teste `QA` no DES com ao menos duas planilhas de tipos diferentes (um tipo parametrizado para zerar, outro não), com saldo > 0 em ambas.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: saldo das planilhas do contrato após a mudança de situação, conforme parametrização do tipo (CN1/CNL)`. Sem credencial de Protheus.

**Passos**
1. No DES, conferir no Configurador que o fonte do PE CN100SIT presente no RPO tem a data da entrega da DEM (comparar com produção).
2. Conferir no dicionário a parametrização de tipo de contrato/planilha usada pela regra (campos citados na MIT044 da DEM).
3. Abrir o contrato `QA` e anotar o saldo de cada planilha.
4. Alterar a situação do contrato para a que dispara a regra (a que o PE trata — a confirmar na MIT044) e confirmar.
5. Reabrir as planilhas e comparar saldos.
6. Repetir em produção (leitura) ou no pacote da DEM para confirmar que o comportamento do DES é o mesmo.

**Resultado esperado**
- Só a planilha do tipo parametrizado tem saldo zerado; a outra mantém o saldo.
- O comportamento no DES é idêntico ao da produção para a mesma parametrização.
- Nenhum erro de compilação/execução do PE (fonte presente e atual no RPO do DES).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- DES sem a regra: todas as planilhas zeradas (comportamento antigo) ou PE ausente — homologação da DEM inválida por ambiente defasado; é o "GAP" que o ticket registra.

**Severidade:** Alta — contábil (provisões/apropriação, CPC06).

**Preparação de massa:** contrato `QA` com duas planilhas de tipos distintos e saldo, criado pelo executor no DES (contrato não pode ser criado pela automação do Fluig).

**Verificado em tela:** NÃO
**O que foi verificado:** apenas que o DES responde aos datasets do Fluig hoje (`dsProtheus_getContratos_restGetAll` GET search → 200 com ~1,9 MB de contratos CN9), o que mostra o DES vivo, não a regra.
**Divergências encontradas:** o ticket é de infraestrutura e não descreve o que replicar; o efeito testável vem do épico.
**Dados/massa usados:** nenhum.

**Módulo ERP:** `Contratos - GCT`

---

## CT-FSWTBC-3787  (protheus · Concluído · SDCASSI-236)

**Título:** Na revisão de um contrato contabilizado, abrir "Outras ações" e conferir que a opção "Estornar e Refazer a provisão contábil" está disponível e executa

**Origem:** FSWTBC-3787 — na revisão, a opção *"Estornar e Refazer a provisão contábil"* não aparecia em *Outras ações*. Reincidência do SDCASSI-128 (FSWTBC-3014), cuja causa foi a funcionalidade **não estar compilada** no ambiente (descompasso repositório × RPO). Encerrado com "solução disponível na base DES", sem homologação registrada.

**Módulo/Rota:** Protheus → SIGAGCT → *Contratos* → selecionar contrato → *Revisão* → menu *Outras ações* → *Estornar e Refazer a provisão contábil* (customização DEM10015225). Nome de menu **a confirmar no menu do cliente** (o anexo `refazer_prov_contabil_MIT.png` compara o menu real com a MIT). Sem superfície Fluig: o Acompanhamento de Contratos não expõe ações do ERP.

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Contrato de homologação com *Contabiliza = Sim* e pelo menos uma provisão já apropriada (para haver o que estornar).
- Contrato em situação que admite revisão (*Vigente*).
- Fonte da DEM10015225 compilado no RPO do ambiente-alvo (é justamente o que o caso confere).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: presença da opção no menu Outras ações e o estorno/regeração da provisão (CT2)`. Sem credencial Protheus.

**Passos**
1. Abrir SIGAGCT → *Contratos*, posicionar no contrato de homologação e entrar em *Revisão*.
2. Abrir o menu *Outras ações* e listar as opções.
3. Acionar *Estornar e Refazer a provisão contábil*; informar a competência já apropriada e confirmar.
4. Em SIGACTB, consultar os lançamentos da competência para o contrato.
5. (Auditoria de pacote) Comparar a data/hora do fonte no RPO com a do repositório entregue.

**Resultado esperado**
- Passo 2: a opção *Estornar e Refazer a provisão contábil* está listada, com o mesmo rótulo da MIT.
- Passo 3: a rotina executa sem erro e informa o resultado.
- Passo 4: os lançamentos originais aparecem **estornados** e uma nova provisão é gerada com os valores da revisão vigente (total igual ao cronograma contábil).
- Passo 5: o RPO contém o fonte da DEM10015225 na versão entregue.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Menu *Outras ações* **sem** a opção (print `imagem (20).png`) — sintoma de fonte não compilado no ambiente.

**Severidade:** Média — bloqueia o fluxo de correção contábil (o estorno tem de ser feito à mão).

**Preparação de massa:** contrato de homologação contabilizado com uma provisão apropriada, preparado pelo executor no Protheus (credencial obrigatória); usar competência de homologação para o estorno.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig se aplica — o Acompanhamento de Contratos (aberto) não oferece ações do ERP; não há dataset de provisão (GET search → 500).
**Divergências encontradas:** nenhuma (o ticket não cita rótulos do Fluig).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3792  (protheus · Concluído · SDCASSI-238)

**Título:** Cadastrar um tipo de contrato apenas com cronograma contábil (sem cronograma financeiro) e conferir que a opção existe e que o contrato desse tipo nasce sem exigência de saldo financeiro

**Origem:** FSWTBC-3792 — na base DES não funcionava o cadastro de tipo de contrato **somente com Cronograma Contábil** (sem Cronograma Financeiro), pré-requisito para tipos "legados" (sem saldo financeiro, com saldo contábil). Causa achada pelo cliente (29/01): a regra do ponto de entrada `PE_CNTA021` **depende silenciosamente** dos campos de contabilização preenchidos — sem eles a funcionalidade simplesmente não aparece, sem mensagem. Fechado como "Não será feito" (não era defeito).

**Módulo/Rota:** Protheus → SIGAGCT → *Cadastros* → *Tipos de Contrato* (rotina padrão CNTA021 + PE `PE_CNTA021`) e *Contratos* → *Incluir* → *Planilha*. Nomes de menu **a confirmar no menu do cliente**. Contraprova possível no Fluig (**não é cobertura**): em *Acompanhamento de Contratos* → detalhe da planilha, o widget exibe os indicadores da planilha ligados a `CNA_CRONOG` (cronograma financeiro), `CNA_ESPEL` (espelho) e `CNA_CRONCT` (cronograma contábil) — ids `#plan-cronog`, `#plan-espel`, `#plan-cronct`; rótulos em tela **a confirmar**.

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Usuário com acesso ao cadastro de tipos de contrato.
- Conhecer quais campos de contabilização o `PE_CNTA021` exige (o ticket não os lista — `<não documentado>`; obter com o time de sustentação).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: disponibilidade da opção "somente cronograma contábil" no cadastro de tipo de contrato e o comportamento da planilha resultante`. Sem credencial Protheus.

**Passos**
1. Em *Tipos de Contrato* → *Incluir*, preencher código/descrição `QA LEGADO CONTABIL` **sem** preencher os campos de contabilização; observar se a opção de cronograma **somente contábil** aparece.
2. Preencher os campos de contabilização exigidos pelo `PE_CNTA021`; observar de novo a opção.
3. Marcar cronograma contábil = Sim e cronograma financeiro = Não; gravar.
4. Incluir um contrato de homologação (`QA`) com esse tipo, uma planilha de um item e valor mínimo; gravar sem aprovar.
5. Abrir a planilha do contrato e ler os indicadores de cronograma financeiro / espelho / cronograma contábil.
6. (Fluig, contraprova) *Acompanhamento de Contratos* → filtrar pelo contrato → abrir o detalhe da planilha e ler os mesmos indicadores.

**Resultado esperado**
- Passo 1: **ou** a opção aparece independentemente da contabilização, **ou** a tela informa de forma explícita quais campos faltam — nunca omite a opção em silêncio (achado de usabilidade do ticket).
- Passo 3: o tipo é gravado com cronograma contábil = Sim e financeiro = Não.
- Passo 5/6: planilha com cronograma contábil marcado e financeiro desmarcado; o contrato não exige saldo financeiro e pode ter saldo contábil.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Cadastro de tipo de contrato sem a opção de cronograma somente contábil (print `DEM10013747.png`), sem nenhuma mensagem explicando o porquê.

**Severidade:** Média — bloqueia o cadastro de tipos legados e, por consequência, os testes da regra de zerar saldos.

**Preparação de massa:** tipo de contrato e contrato de homologação criados pelo executor no Protheus (credencial obrigatória), ambos com `QA` na descrição; o contrato **não** deve ser aprovado.

**Verificado em tela:** NÃO
**O que foi verificado:** no Fluig, *Acompanhamento de Contratos* abre (845 linhas) e o fonte publicado `wAcompanhaContratos_pt_BR.js` preenche `#plan-cronog/#plan-espel/#plan-cronct` a partir de `CNA_CRONOG/CNA_ESPEL/CNA_CRONCT` — os rótulos do modal não foram lidos em tela nesta rodada.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3869  (protheus · Concluído · SDCASSI-220)

**Título:** Alterar um contrato vigente para "Em elaboração" e conferir que o cronograma contábil (CNW) das competências já fechadas é preservado ou que o sistema avisa antes de apagá-lo, mantendo o contrato disponível para apropriação

**Origem:** FSWTBC-3869 / incidente 795719 — o contrato `00010-2026-5303` não aparecia para apropriação contábil. Diagnóstico em três camadas: hipótese de regra LP com `CN1_VLRPRV = 2` (UGCTE003); constatação de que "o contrato não tem a competência 12/2025 para contabilizar"; e a causa final por auditoria: o contrato foi alterado para **Em elaboração** em 19/01, o que **deletou os registros da CNW** (cronograma contábil 12/2025). Encerrado por decurso; achado não tratado: não há proteção nem alerta.

**Módulo/Rota:** Protheus → SIGAGCT → *Contratos* → *Alterar situação* / *Em elaboração*; *Cronograma Contábil* (CNW); apropriação pela rotina customizada `UGCTE003` (nome de menu **a confirmar no menu do cliente**); SIGACTB para o lançamento. Contraprova Fluig (**não é cobertura**): *Acompanhamento de Contratos* mostra a situação (`02 Elaboração` / `05 Vigente`) e a existência do contrato; **não existe** dataset de cronograma no Fluig (GET search → 500).

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Contrato de homologação vigente, tipo com contabilização, cronograma contábil com uma competência **já fechada/apropriada** e outra em aberto.
- Usuário com permissão de alterar a situação do contrato e de rodar a apropriação.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: registros da CNW (cronograma contábil) e a lista de contratos elegíveis na rotina de apropriação`. Sem credencial Protheus. O contrato do ticket existe aqui (sit. 05 Vigente), mas **não deve ser alterado**.

**Passos**
1. Abrir o cronograma contábil do contrato de homologação e anotar as competências e valores (CNW), inclusive a já apropriada.
2. Rodar a apropriação (UGCTE003) para a competência em aberto e confirmar que o contrato **aparece** na seleção.
3. Alterar a situação do contrato para *Em elaboração*; observar se há confirmação/alerta sobre o cronograma.
4. Reabrir o cronograma contábil e comparar com o passo 1.
5. Voltar o contrato a *Vigente* (reaprovar) e rodar a apropriação de novo.
6. (Fluig) *Acompanhamento de Contratos* → filtrar pelo número → ler a situação em cada etapa.

**Resultado esperado**
- Passo 3: o sistema **avisa** que a alteração afeta o cronograma contábil e exige confirmação — ou preserva as competências já apropriadas.
- Passo 4: competências já fechadas/apropriadas **permanecem** na CNW.
- Passo 5: o contrato volta a aparecer na apropriação para as competências em aberto; nenhuma competência fechada "some".
- Passo 6: situação no Fluig acompanha a do ERP.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Alteração para *Em elaboração* sem aviso; CNW **sem** a competência 12/2025 (prints da auditoria da CNW); rotina de apropriação não lista o contrato ("não aparece para fazer a apropriação").

**Severidade:** Alta — perda silenciosa de dado contábil e apropriação impossibilitada.

**Preparação de massa:** contrato de homologação com cronograma contábil de ≥ 2 competências e uma já apropriada, preparado pelo executor no Protheus (credencial obrigatória, `QA`). **Não** usar o `00010-2026-5303`: é dado real e a alteração de situação é destrutiva.

**Verificado em tela:** NÃO
**O que foi verificado:** dataset de contratos (GET search): `00010-2026-5303` existe — filial 5303, situação **05 Vigente**, tipo 111, vigência 14/08/2025 → 14/08/2026, valor = saldo = R$ 3.003,90, `CN9_XSC = 2`. *Acompanhamento de Contratos* aberto (845 linhas). Datasets de cronograma não existem (500 NPE).
**Divergências encontradas:** o contrato está *Vigente* aqui; o estado "Em elaboração" de 19/01 já foi revertido ou é de outra base.
**Dados/massa usados:** leitura do dataset de contratos — nada submetido.

---

## CT-FSWTBC-4157  (protheus · Concluído · SDCASSI-310)

**Título:** Medir um contrato novo e conferir que o valor da medição coincide com o previsto no Cronograma Financeiro

**Origem:** FSWTBC-4157 — o valor da medição não respeitava o valor previsto no Cronograma Financeiro (contrato 00020-2026-5303). Causa: divergência de **casas decimais** entre `CNF_VLPREV/CNF_VLREAL/CNF_SALDO`, `CNE_VLUNIT`, `CNB_VLUNIT/CNB_VLTOTR` (TDN GCT0017). Correção só vale **para contratos novos**; legado sem saneamento.

**Módulo/Rota:** Protheus — GCT → contrato → *Cronograma Financeiro* (CNF) e *Medição* (CNE); *Configurador* → dicionário SX3 (casas decimais dos campos citados). Nomes de menu a confirmar no menu do cliente.

**Pré-condições**
- Dicionário com o mesmo número de casas decimais em `CNF_VLPREV`, `CNF_VLREAL`, `CNF_SALDO`, `CNE_VLUNIT`, `CNB_VLUNIT`, `CNB_VLTOTR` (conferir no SX3 antes de medir).
- Um contrato **novo**, cadastrado após a correção, com planilha cujo item tenha valor unitário com 4 casas decimais (ex.: `0,1234`) e quantidade que gere arredondamento.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: valor previsto do cronograma (CNF_VLPREV) × valor calculado na medição (CNE)`. O Fluig só mostra o valor unitário do item e o valor medido; não expõe o cronograma.

**Passos**
1. No Configurador, anotar as casas decimais dos seis campos acima.
2. Cadastrar contrato `QA-<sufixo>` com planilha de 1 item, valor unitário `0,1234`, quantidade 3 e cronograma financeiro mensal.
3. Abrir o Cronograma Financeiro e anotar `CNF_VLPREV` da parcela.
4. Registrar a medição integral da parcela e anotar o valor da medição.
5. Repetir com um contrato **legado** (ex.: `00020-2026-5303`, o do ticket) e comparar.

**Resultado esperado**
- Passo 1: os seis campos com o mesmo número de casas decimais.
- Passo 4: valor da medição **igual** a `CNF_VLPREV` da parcela, sem diferença de centavos.
- Passo 5: se houver diferença no legado, ela é registrada como passivo de dado (a correção não saneia contratos antigos), e não como reincidência.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Medição com valor diferente do previsto no cronograma, sem qualquer erro, num contrato criado após a correção.

**Severidade:** Alta — financeiro (pagamento com valor diferente do previsto).

**Preparação de massa:** contrato novo criado no GCT pelo executor; nada criável pelo Fluig.

**Módulo ERP:** `Contratos - GCT`
**Verificado em tela:** NÃO
**O que foi verificado:** contraprova parcial no Fluig — `00020-2026-5303` existe (rev "" `CN9_SITUAC=10`, rev 001 `CN9_SITUAC=05`, `CN9_SALDO` 7.765.054,41 → 0,01), com planilhas 000001 e 000002 (tipo 001 FIXA); `dsProtheus_getItensPlanilha_restGetAll` devolve `CNB_VLUNIT` com valores como `0.0001` e `1e-05` em outros contratos, ou seja, o campo carrega **5 casas decimais** nesta base — indício da heterogeneidade de precisão que o ticket descreve. O cronograma (CNF) não é exposto por nenhum dataset ou tela do Fluig.
**Divergências encontradas:** para `00020-2026-5303` o dataset de itens devolve **vazio** (com e sem filtro de filial), embora as planilhas existam — observação, não conclusão.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4636  (ambos · Concluído · SDCASSI-434)

**Título:** Incluir um contrato diretamente no Protheus e um contrato via SC "Nova Contratação" do Fluig — só o segundo chega com Tipo de Contrato 999 (INTEGRACAO NFC) preenchido automaticamente

**Origem:** FSWTBC-4636 — "NFC não está trazendo contrato 999" (reabertura do SDCASSI-425). Esclarecido em sala: o processo executado era
**direto pelo Protheus**, onde o padrão abre a tela com os campos obrigatórios para preenchimento **manual**; o tipo de contrato 999 e
os demais obrigatórios só são preenchidos automaticamente quando o contrato é gerado **pela API do Fluig**. Não é defeito; é limite da
customização.

**Módulo/Rota:** Protheus → SIGAGCT → Gestão de Contratos → *Contratos* (CN9) → Incluir · tipo de contrato **999 - INTEGRACAO NFC** (CN1) ·

**Módulo ERP:** `Contratos - GCT`
contraponto Fluig: SC com **Tipo de Solicitação = Nova Contratação** e *Tipo de Compra = Contrato* → *Aguarda Geração do Pedido/Contrato
(323)* → *Aguarda Vigência do Contrato (332)* → Acompanhamento de Contratos (coluna **Tipo Contrato**) e modal *Informações do Contrato*.

**Pré-condições**
- Credencial Protheus com acesso ao SIGAGCT e ao cadastro CN1 (tipo 999 existente).
- Uma SC `QA` de *Nova Contratação* aprovada até a geração do contrato pela integração (comprador + alçada).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: preenchimento (manual × automático) do tipo de contrato 999 e dos campos obrigatórios na inclusão do contrato em Gestão de Contratos (CN9/CN1)`

**Passos**
1. No Protheus, SIGAGCT → Contratos → **Incluir**; observar os campos obrigatórios abertos (Tipo de Contrato, Fornecedor, Vigência…).
2. Deixar Tipo de Contrato vazio e tentar confirmar; depois preencher **999** manualmente e confirmar.
3. No Fluig, abrir uma SC de *Nova Contratação* que já passou por *Aguarda Geração do Pedido/Contrato* e anotar o número do contrato
   no Histórico/Tracker (colunas *Número do Contrato*, *Revisão do Contrato*).
4. No Protheus, consultar esse contrato em CN9 e conferir o campo Tipo de Contrato.
5. No Fluig, *Acompanhamento de Contratos* → localizar o contrato → coluna **Tipo Contrato** e modal *Informações do Contrato*.

**Resultado esperado**
- Passo 2: na inclusão manual o ERP **exige** o preenchimento (crítica de obrigatório) e não sugere 999 sozinho — comportamento padrão.
- Passos 3–5: o contrato gerado pela integração chega com **Tipo de Contrato = 999 - INTEGRACAO NFC** e os obrigatórios preenchidos, sem
  intervenção; no Acompanhamento de Contratos a coluna **Tipo Contrato** mostra `999`.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Expectativa de que o tipo 999 viesse preenchido no caminho manual (não é defeito); ou — regressão real — contrato gerado pela API
  do Fluig **sem** tipo 999/obrigatórios, travando em *Aguarda Geração do Pedido/Contrato*.

**Severidade:** Média

**Preparação de massa:** tipo 999 cadastrado em CN1; SC `QA` de Nova Contratação levada até a geração do contrato (comprador + alçada);
credencial Protheus para o passo 1–2 e 4.

**Verificado em tela:** NÃO
**O que foi verificado:** apenas o contraponto Fluig: *Acompanhamento de Contratos* renderizou 845 contratos às 09:15 (colunas *Filial,
Tipo Contrato, Contrato, Data Inicio, Data Fim, Nº Revisão, Status, Fornecedor, Ação*), com tipos `015/030/017/074/064/048/016/044…` nas
65 primeiras linhas e **nenhuma linha com 999** nessa amostra; às 09:30 a tabela veio vazia (instabilidade do ERP);
`dsProtheus_getTipoContratos_restGetAll` existe (200, colunas `CN1_*`). O caminho Protheus não foi executado (sem credencial).
**Divergências encontradas:** o ticket fala em "NFC não traz contrato 999"; o que existe é o **tipo de contrato** 999 preenchido pela API.
"Nova Solicitação de Contrato" na tela é **"Nova Contratação"** (combo *Tipo de Solicitação*).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4930  (protheus · Em Homologação · SDCASSI-491)

**Título:** Executar a contabilização de despesa antecipada para várias filiais, algumas sem parcelas, e conferir que a rotina processa todas sem pop-up por filial e fecha sozinha ao final com uma única mensagem

**Origem:** FSWTBC-4930 — em `UGCTE003` (*Contabilização de Despesa Antecipada*), com *Seleciona Filiais* (`MV_PAR01=1`) a rotina exibia pop-up bloqueante "Nao foram encontradas parcelas…" **por filial vazia** e só fechava sozinha se a **última** filial tivesse parcelas. Correção (patch 14/07): processamento silencioso por filial, uma mensagem ao final, fechamento incondicional, logs preservados. A "lista de contratos a apropriar" lembrada pela usuária **nunca existiu** (provado na base DEV congelada). **Aberto** no cluster 483/490/491/498.

**Módulo/Rota:** Protheus → Gestão de Contratos → **Contabilização de Despesa Antecipada** (`UGCTE003` — *posição no menu a confirmar*) → parâmetros → *Seleciona Filiais* = Sim.

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Três filiais de homologação: **F1** com parcelas a apropriar no período; **F2** e **F3** sem parcelas (F3 por último na seleção — o caso que não fechava).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: mensagens da rotina, fechamento da tela, log U_GravaLog e lançamentos CT2`. Sem credencial; a rotina é uma apropriação contábil (não executada nesta rodada).

**Passos**
1. Abrir a rotina; `MV_PAR01` = *Seleciona Filiais*; marcar F1, F2, F3 (nessa ordem); confirmar.
2. Observar se surge alguma mensagem **durante** o processamento.
3. Ao final, ler a mensagem exibida e se a tela fechou sozinha.
4. Repetir marcando **apenas F2 e F3**.
5. Ler o log (`U_GravaLog`) — uma entrada por filial.
6. Conferir na Contabilidade os lançamentos de F1 e a ausência em F2/F3.

**Resultado esperado**
- Passo 2: **nenhum pop-up** por filial.
- Passo 3: uma única mensagem "finalizada com sucesso"; tela **fecha automaticamente**.
- Passo 4: uma única mensagem "não foram encontradas parcelas"; tela fecha.
- Passo 5–6: log por filial; lançamentos só de F1 (cálculo/LP inalterados).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Pop-up "Nao foram encontradas parcelas…" a cada filial vazia, exigindo fechar para seguir; tela aberta ao final quando a última filial não tem parcelas.

**Severidade:** Média *(bloqueia o fluxo operacional; sem efeito contábil)*

**Preparação de massa:** parcelas de despesa antecipada em F1 para o período, criadas pelo executor. Registrar no relatório que a "lista de contratos" **não é critério** deste caso (nunca existiu na customização).

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — rotina exclusiva do ERP, sem dataset correspondente no fonte publicado.
**Divergências encontradas:** nenhuma verificável.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-5125  (protheus · Em Homologação · SDCASSI-530)

**Título:** Incluir um contrato com planilha comum e conferir que a rotina abre, o contrato passa por "Aprovação" com a alçada (SCR) gerada antes de ficar Vigente, e que o saldo e o lock do registro ficam corretos

**Origem:** FSWTBC-5125 — rotina de inclusão de contratos encerrava ao abrir na base DES (versões incompatíveis de dois programas). A análise interna (19/08) achou **regressão da própria demanda** (PR 71655): no `PE_CN100SIT`, o `CNA->(DbSkip())` foi movido para dentro do `IF` do tipo de planilha — com planilha comum (001/002) o laço não avançava, a execução morria antes do bloco de alçada (`UGCTE004`) e o **contrato ficava Vigente sem SCR**. Dos 41 contratos de 2026 vigentes na DES, os 2 últimos não têm SCR. Correção: regra do zera-saldo movida para `UGCTE030` com `DbSkip` fora do `IF` e `RecLock/MsUnLock` pareados. Pendência crítica: contratos vigentes sem alçada precisam **voltar ao fluxo**.

**Módulo/Rota:** Protheus → Gestão de Contratos → *Contratos* → *Incluir* (`CNTA300`) → confirmar → mudança de situação (`PE_CN100SIT` → `UGCTE030` → `UGCTE004`) → *Aprovação de alçadas* (SCR — *rotina a confirmar*) → situação `05 Vigente`. Fluig (contraprova): **Acompanhamento de Contratos** → *Status* (`04 Aprovação` / `05 Vigente`) e *Informações do Contrato → Data do Ultimo Status*.

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Pacote `DEM10013766_P2510_20260818_1722` aplicado (CC54GO_DES e CC54GO_DES_REST).
- Tipos de planilha `001`/`002` (comum) e `003` (zera saldo); fornecedor e produto válidos; filial 4010 ou 5303.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: abertura da rotina, registro SCR da alçada e lock do CNA`. Sem credencial; o Fluig mostra apenas o *Status*.

**Passos**
1. Abrir *Contratos → Incluir* — a rotina deve abrir e permanecer aberta.
2. Incluir contrato **C1** com planilha tipo `001`, 2 itens com saldo; confirmar.
3. Ler a situação de C1 e consultar as alçadas pendentes (SCR) do contrato.
4. (Fluig) *Acompanhamento de Contratos* → filtrar C1 → *Status*; *Informações do Contrato → Data do Ultimo Status*.
5. Aprovar a alçada; reler situação (Protheus e Fluig).
6. Repetir 2–5 com **C2**, planilha tipo `003` (zera saldo).
7. Alterar um contrato cujo saldo já é zero e confirmar; em outra sessão, abrir o mesmo contrato.
8. Regularização: listar contratos de 2026 (espécie 1) vigentes **sem SCR** e confirmar que foram retornados ao fluxo de aprovação.

**Resultado esperado**
- Passo 1: rotina abre sem encerrar.
- Passo 3: situação **`04 Aprovação`**; **SCR gerado**; saldo preservado.
- Passo 4: Fluig com *Status* **Aprovação**.
- Passo 5: só após a aprovação → **Vigente** (Protheus e Fluig).
- Passo 6: mesmo caminho; saldo tratado conforme o tipo.
- Passo 7: sem registro travado (a segunda sessão abre normalmente).
- Passo 8: nenhum contrato vigente sem SCR remanescente.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Rotina encerrada ao abrir; contrato indo **direto a Vigente sem SCR** (loop no `CNA` com planilha comum); registro CNA travado quando o saldo já era zero.

**Severidade:** Alta *(contratos em vigor sem aprovação de alçada)*

**Preparação de massa:** dois contratos (planilha `001` e `003`) criados pelo executor no Protheus após o pacote; levantamento dos contratos vigentes sem SCR do período 11/08 → aplicação do pacote, para o passo 8.

**Verificado em tela:** NÃO
**O que foi verificado:** contraprova no Fluig: o mapa de *Status* do *Acompanhamento de Contratos* tem `04 = Aprovação` e `05 = Vigente`; hoje **1 contrato** está em `04` (`00051-2026-5303`, início 01/09/2026, R$ 4.500.000,00) e 43 dos 73 contratos com início em 2026 estão `Vigente`; o contrato **`00049-2026-5303` do TC02 do zip de evidências existe** (`02 Elaboração`, planilha 000001 tipo `003 FIXA`, *Valor Total* 115.828,00 — mesmo valor do print). O SCR não é observável no Fluig.
**Divergências encontradas:** o ticket chama a situação de "04 - Em Aprovacao"; o rótulo no Fluig é **"Aprovação"**; tipos `001` e `003` compartilham a descrição **"FIXA"** — o executor deve escolher pelo código.
**Dados/massa usados:** contratos `00051-2026-5303` e `00049-2026-5303`, leitura apenas — nada submetido.

---

## Resumo do lote

| Key | Superfície | Módulo ERP | Verificado | Bloqueio |
|---|---|---|---|---|
| FSWTBC-4609 | SEM | Outros (SIGAJURI) | NÃO | SOMENTE PROTHEUS — crítica do ato e situação do processo jurídico |
| FSWTBC-4610 | SEM | Outros (SIGAJURI) | NÃO | SOMENTE PROTHEUS — disponibilidade do ato por usuário |
| FSWTBC-4611 | COM (parcial) | Contratos - GCT | PARCIAL | massa (tipos de planilha e contrato) só criável no Protheus; `CNL_XZERSL` não projetado; POST de datasets instável |
| FSWTBC-4647 | SEM | Financeiro e Contabil | NÃO | SOMENTE PROTHEUS — CT2 e cronograma CNW; rotina batch |
| FSWTBC-4709 | COM | Compras | PARCIAL | conta sem matrícula de comprador; sem gestor/Protheus; `genericQuery` 404 |
| FSWTBC-4756 | SEM | Integracao e Filas | NÃO | SOMENTE PROTHEUS — resposta do bondsPay e SE2 |
| FSWTBC-4775 | COM | Compras | PARCIAL | sem gestor/comprador/Protheus para disparar a trava; Protheus instável |
| FSWTBC-4786 | SEM | Dicionario e Pacote | NÃO | SOMENTE PROTHEUS — resposta do UCFGA002 e URL interna |
| FSWTBC-4815 | SEM | Outros (infra) | NÃO | SOMENTE PROTHEUS — mensagem de lock e log do DBAccess; ticket sem descrição |
| FSWTBC-4869 | SEM | Financeiro e Contabil | NÃO | SOMENTE PROTHEUS — lançamento 69P e flag de apropriação; batch |
| FSWTBC-4920 | SEM | Financeiro e Contabil | NÃO | SOMENTE PROTHEUS — campos de valor anterior e 69G; contrato do ticket inexistente no tenant |
| FSWTBC-4930 | SEM | Contratos - GCT | NÃO | SOMENTE PROTHEUS — mensagens/fechamento da rotina e CT2 |
| FSWTBC-5013 | SEM | Financeiro e Contabil | NÃO | SOMENTE PROTHEUS — payload da API e E2_XDHFLX |
| FSWTBC-5125 | SEM | Contratos - GCT | NÃO | SOMENTE PROTHEUS — abertura da rotina, SCR e lock; Fluig só mostra o Status |

**Divergências ticket × ambiente (consolidado):** revisões 007/008 do 00186-2022-5303 e contratos 00002-2021-2201 / 00001-2021-5002 / 00001-2021-3503 **não existem** neste tenant (é outra base); "trava orçamentária" = atividade *Verificar retorno Protheus (317)* / campo *Retorno Integração*, e o bloqueio do PCO no Faturamento aparece **só no Histórico**; "04 - Em Aprovacao" é **"Aprovação"** no Fluig; tipos de planilha `001` e `003` com a mesma descrição "FIXA"; `CNL_XZERSL` e `CN9_XVLPRE` não são projetados por nenhum dataset; saldo de planilha nova vem **vazio**, não `0,00`; *Status da Integração GCT* / *Erro de Integração* exibem "-" em contrato integrado.

## CT-FSWTBC-5196  (ambos · Concluído · SDCASSI-553)

**Título:** Gerar aditivo de contrato a partir de cotação aprovada e ver os valores entrarem conforme o tipo da planilha — item (quantidade × unitário)
na planilha **fixa** e **Valor Total** (CNA_VLTOT) somado na planilha **semi-fixa**, tanto na planilha reaproveitada quanto na nova

**Origem:** FSWTBC-5196 — no aditivo, o valor aprovado na cotação era registrado **apenas no item**, sem compor o Valor Total da planilha (CNA_VLTOT)
quando o aditivo reaproveitava planilha existente. Correção: planilha fixa → quantidade e valor unitário no item; semi-fixa → soma no CNA_VLTOT
(medição é por valor). Testado na SC 112222, contrato 000000000000255. Pacote aplicado em DES por canal informal; publicação na branch pendente.

**Módulo/Rota:** Protheus → SIGAGCT → Gestão de Contratos → **Contratos** → contrato de origem → **Revisões** (CN9 revisão gerada pelo aditivo) →

**Módulo ERP:** `Contratos - GCT`
**Planilhas** (CNA: *Tipo de Planilha* CNA_TIPPLA, **Valor Total** CNA_VLTOT) → **Itens** (CNB: quantidade, valor unitário, saldo) · Cadastros →
**Tipos de Planilha** (CNL: `CNL_CTRFIX`, `CNL_TPSFIX`) · Fluig (complementar): SC de *Aditivo Contratual* → *Aguarda Vigência do Contrato (332)*;
*Acompanhamento de Contratos* → *Nº Revisão*; Faturamento → **Saldo a Medir \*** da planilha.

**Pré-condições**
- Contrato `QA` com duas planilhas: uma **fixa** e uma **semi-fixa**, ambas com itens e valor total conhecidos, sem medições pendentes.
- Duas SCs `QA` de *Aditivo Contratual* aprovadas até a geração da revisão: uma reaproveitando planilha existente, outra criando planilha nova.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: composição do Valor Total da planilha (CNA_VLTOT) e dos itens (CNB) na revisão gerada pelo aditivo, por tipo de planilha`
- **Módulo ERP:** `Contratos - GCT`

**Passos**
1. Anotar, na revisão vigente, o *Valor Total* e os itens das planilhas fixa e semi-fixa.
2. Concluir a SC de aditivo que reaproveita a planilha **fixa** (valor aprovado V1, quantidade Q1).
3. Abrir a nova revisão do contrato → planilha fixa → itens.
4. Concluir a SC de aditivo que reaproveita a planilha **semi-fixa** (valor aprovado V2).
5. Abrir a nova revisão → planilha semi-fixa → *Valor Total*.
6. Repetir 4–5 com aditivo que cria planilha semi-fixa **nova**.
7. No Fluig, abrir um Faturamento do contrato e ler **Saldo a Medir \*** da planilha semi-fixa (complementar).

**Resultado esperado**
- Passo 3: item acrescentado/ajustado com Q1 e valor unitário coerentes com V1; *Valor Total* da planilha fixa = soma dos itens.
- Passo 5: *Valor Total* da semi-fixa = valor anterior **+ V2**.
- Passo 6: planilha nova com *Valor Total* = V2.
- Passo 7: *Saldo a Medir* reflete o total aditivado (medição por valor).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Planilha semi-fixa com o item aditivado mas **Valor Total inalterado** — saldo de medição menor que o contratado.

**Severidade:** Alta

**Preparação de massa:** contrato `QA` com planilhas fixa e semi-fixa; duas/três SCs de aditivo aprovadas (comprador + alçada); credencial Protheus
SIGAGCT.

**Verificado em tela:** NÃO
**O que foi verificado:** apenas o contraponto Fluig: SC **112222** (a do teste do ticket) hoje `OPEN` em *Aguarda Vigência do Contrato (332)* desde
24/08; datasets `dsProtheus_getInfoPlanilhaxContrato_restGetAll` (com `CNA_TIPPLA`), `dsProtheus_getItensPlanilha_restGetAll` (`CNB_QUANT, CNB_SLDREC…`)
e `dsProtheus_getTipoPlanContratos_restGetAll` (`CNL_CTRFIX`, `CNL_TPSFIX`) existem (200) — **nenhum expõe `CNA_VLTOT`**. Protheus não acessado.
**Divergências encontradas:** o ticket usa "contrato 000000000000255"; o Fluig exibe contratos no formato `NNNNN-AAAA-FFFF` (ex.: 00001-2022-5304) —
formatos diferentes para o mesmo CN9_NUMERO. Sem outras.
**Dados/massa usados:** nenhum — não submetido; leitura de 112222.
