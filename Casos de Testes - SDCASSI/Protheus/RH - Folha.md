<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# RH - Folha

Casos de teste do Protheus — registrados para execução futura no ERP.

| | |
|---|---|
| Casos neste arquivo | 15 |
| Verificados em tela | 0 total · 0 parcial · 15 não |

> **Como ler.** Estes casos **não são executáveis no Fluig** — o efeito do defeito só aparece
> no Protheus. Estão escritos por completo, do ponto de vista de quem for executá-los no ERP,
> para quando o projeto de testes cobrir o Protheus. Nenhum foi verificado em tela.

---

## CT-FSWTBC-654  (protheus · Concluído)

**Título:** Alterar o step salarial de um funcionário pela rotina automática preservando o adicional de insalubridade (RA_ADCINS)

**Origem:** FSWTBC-654 — "[INCIDENTE 750550] Cálculo pró-rata alteração salarial": a alteração automática de step (`UGPEE081.TLPP`) apaga o campo **RA_ADCINS** (possui insalubridade), que a alteração manual preserva. Fechado no mesmo dia, sem evidência de reprocessamento da folha afetada.

**Módulo/Rota:** **Protheus → SIGAGPE → Atualizações → Funcionários (GPEA010)**, aba de dados salariais, campo **Adic. Insalubridade (`RA_ADCINS`)**; rotina customizada **`UGPEE081.TLPP`** (alteração automática de step); histórico salarial **SR7**; cálculo **GPEM020**.

**Módulo ERP:** `RH - Folha` *(módulo real: SIGAGPE — Gestão de Pessoal; a lista de roteamento não prevê RH)*

**Pré-condições**
- Credencial no Protheus com acesso a SIGAGPE.
- Funcionário de teste com `RA_ADCINS` preenchido (grau de insalubridade) e elegível a mudança de step na data de referência.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: o valor de RA_ADCINS no cadastro (GPEA010/SRA) e a verba de insalubridade no cálculo da folha (GPEM020/SRC)`

**Passos**
1. GPEA010: abrir o funcionário e anotar `RA_ADCINS`, salário e step atuais.
2. Executar a rotina automática de alteração de step (`UGPEE081`) para a data/lote que inclui o funcionário — **em base de homologação**, nunca em produção.
3. GPEA010: reabrir o funcionário; ler `RA_ADCINS`, o novo salário/step e o histórico SR7.
4. Repetir o passo 1–3 com a **alteração manual** de step, para comparação.
5. GPEM020: calcular a folha do mês do funcionário e ler a verba de insalubridade.

**Resultado esperado**
- Passo 3: `RA_ADCINS` **inalterado**; salário/step atualizados; SR7 com o registro da alteração.
- Passo 4: o resultado da rotina automática é **idêntico** ao da manual em todos os campos não salariais.
- Passo 5: verba de insalubridade calculada sobre o novo salário, sem zerar.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Após a rotina automática, `RA_ADCINS` em branco; a folha deixa de pagar a insalubridade; a alteração manual não reproduz o problema.

**Severidade:** Alta *(remuneração de colaborador)*

**Preparação de massa:** funcionário de teste com insalubridade e mudança de step programada, criado pelo RH na base de homologação; lote da rotina automática restrito a esse funcionário.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — nenhum processo, widget ou dataset do tenant expõe cadastro salarial.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-656  (protheus · Concluído)

**Título:** Registrar ponto pelo app SouCassi e obter marcação automática, com e-mail resolvido sem distinção de maiúsculas

**Origem:** FSWTBC-656 — "[INCIDENTE 750368] Implementação de acesso e emissão de alertas - Ponto eletrônico": (1) `registrarPonto` gravava a batida como *inclusão manual*; deve gravar **Tipo Reg. = 'O'** (automático) e **Motivo Reg. = 'APP SOU CASSI'**; (2) `consultarRegistrosPonto`, `consultarJornadaTrabalho` e `registrarPonto` comparavam e-mail com **case sensitive**. Causa do item 1: parâmetros **MV_PAPONTA** e **MV_PONMES** em branco (copiados da base TST).

**Módulo/Rota:** **Protheus → SIGAPON → Atualizações → Marcações** (tabela **SP8**), campos *Tipo Reg.* e *Motivo Reg.* (rótulos do ticket); **Configurador → Parâmetros (SX6)**: `MV_PAPONTA`, `MV_PONMES`; API REST do app **SouCassi** (`registrarPonto`, `consultarRegistrosPonto`, `consultarJornadaTrabalho`).

**Módulo ERP:** `RH - Folha` *(módulo real: SIGAPON — Ponto Eletrônico; a API é a superfície)*

**Pré-condições**
- Funcionário de teste com jornada cadastrada e e-mail no SRA gravado em **MAIÚSCULAS** (`RA_EMAIL`).
- `MV_PAPONTA` e `MV_PONMES` preenchidos na base-alvo (conferir antes; o defeito nasceu deles vazios).
- Credencial da API do SouCassi e do Protheus (SIGAPON).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: a marcação gravada na SP8 (tipo/motivo do registro) e a resposta das APIs de ponto; o Fluig só expõe banco de horas já apurado (Portal de Autorização de Horas Extras), não a marcação`

**Passos**
1. SX6: ler `MV_PAPONTA` e `MV_PONMES`; anotar.
2. Chamar `registrarPonto` com o e-mail em **minúsculas** (cadastro em maiúsculas); depois `consultarRegistrosPonto` e `consultarJornadaTrabalho` com a mesma grafia.
3. SIGAPON → Marcações: localizar a batida do passo 2 e ler *Tipo Reg.* e *Motivo Reg.*.
4. Repetir o passo 2 com o e-mail em **maiúsculas** e com **caixa mista**.

**Resultado esperado**
- Passo 2: as três APIs respondem **200** e encontram o funcionário, independentemente da caixa.
- Passo 3: marcação com **Tipo Reg. = 'O'** e **Motivo Reg. = 'APP SOU CASSI'**; não é *inclusão manual*.
- Passo 4: resultados idênticos aos do passo 2.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Marcação gravada como *inclusão manual* (sem tipo 'O'/motivo do app); e-mail em caixa diferente do cadastro → funcionário não encontrado / registro não gravado.

**Severidade:** Alta *(registro de ponto tem peso trabalhista)*

**Preparação de massa:** funcionário de teste no SIGAPON com e-mail em maiúsculas, criado pelo RH; ambiente do app SouCassi apontando para a base de homologação.

**Verificado em tela:** NÃO
**O que foi verificado:** apenas que `/portal/p/1/PORTAL_AUTORIZACAO_HORAS_EXTRAS` abre (título *Portal de Autorização de Horas Extras*) e, para a conta de QA, cai no modal *"Ops!"* — a tela mostra banco de horas, não marcação.
**Divergências encontradas:** nenhuma no Fluig; o portal de horas extras não é superfície da marcação.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-657  (protheus · Concluído)

**Título:** Calcular a folha de um colaborador com abono no mês e mudança de step/promoção descontando o dia e pagando-o como abono

**Origem:** FSWTBC-657 — "INC-DEM10011468 Automatização para cálculo pró-rata em mudanças que resultem em ajustes salariais": com abono no mês da mudança de step/promoção, o sistema deixou de descontar o dia do salário ao pagar o abono, pagando **a maior**; afeta também auxílios. Regra declarada: usar abono no mês **desconta um dia de salário e paga como abono**. 86 dias em teste; sem apuração dos valores pagos a maior.

**Módulo/Rota:** **Protheus → SIGAGPE → Cálculo da Folha (GPEM020)**; Funcionários (GPEA010); lançamento de abono/ausência do mês; verbas do cálculo (**SRC**); rotina de pró-rata automática (a mesma família de `UGPEE081`).

**Módulo ERP:** `RH - Folha` *(módulo real: SIGAGPE — Gestão de Pessoal)*

**Pré-condições**
- Funcionário de teste com **mudança de step ou promoção** com vigência no meio do mês (ex.: dia 16) e **um abono** lançado no mesmo mês.
- Funcionário de controle: mesma mudança, **sem** abono.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: as verbas de salário pró-rata, desconto do dia e abono no resultado do GPEM020 (SRC/holerite)`

**Passos**
1. Lançar o abono (1 dia) no mês para o funcionário de teste.
2. GPEM020: calcular a folha do mês dos dois funcionários.
3. Ler, no funcionário de teste: verba de salário (pró-rata das duas faixas), verba de **desconto do dia** e verba de **abono**; ler os auxílios do mês.
4. Comparar com o funcionário de controle.

**Resultado esperado**
- Passo 3: salário = (dias na faixa antiga × salário antigo/30) + (dias na faixa nova × salário novo/30) **menos 1 dia**, e o mesmo dia pago como **abono**; total líquido igual ao do controle (o abono compensa o desconto, não soma a ele).
- Auxílios proporcionalizados com a mesma regra.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Salário pago integral **mais** o abono — um dia pago em dobro; diferença = 1/30 do salário (a maior).

**Severidade:** Alta *(pagamento a maior recorrente)*

**Preparação de massa:** dois funcionários de teste na base de homologação (com e sem abono), promoção no meio do mês, preparados pelo RH.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-1151  (protheus · Concluído)

**Título:** Calcular o desconto do plano Realize Mais na folha sobre a base correta de verbas

**Origem:** FSWTBC-1151 — "[Suporte Fev/2025] Erro no cálculo Realize Mais INC753359": aberto em 26/03/2025, única transição em 16/10/2025 (AGUARDANDO INÍCIO → Concluído) — 204 dias sem movimentação; incidente do cliente fechado sem tratativa registrada. Conteúdo perdido. Irmão do FSWTBC-1207 (INC753358), onde a causa foi parametrização de verbas.

**Módulo/Rota:** **Protheus → SIGAGPE → Cálculo da Folha (GPEM020)**; **Cadastro de Verbas (GPEA040 / SRV)** — marcação das verbas que compõem a **base de desconto do plano previdenciário** (Realize Mais); resultado no **SRC** / holerite do funcionário.

**Módulo ERP:** `RH - Folha` *(módulo real: SIGAGPE — Gestão de Pessoal)*

**Pré-condições**
- Funcionário de teste aderente ao Realize Mais, com percentual/valor de contribuição cadastrado.
- Verbas da base (salário, adicionais, auxílios que entram) marcadas conforme a **MIT010** do projeto.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: o valor da verba de desconto Realize Mais no resultado do GPEM020 e a base que a compõe`

**Passos**
1. GPEA040: listar as verbas com a marcação de "compõe base do plano previdenciário"; comparar com a MIT010.
2. GPEM020: calcular a folha do mês do funcionário.
3. Ler no SRC: verbas da base, soma da base e verba de desconto Realize Mais.
4. Recalcular à mão: base × percentual (ou valor fixo) e comparar.

**Resultado esperado**
- Passo 1: lista igual à MIT010.
- Passos 3–4: desconto = base × percentual, com base **exatamente** igual à soma das verbas marcadas; diferença zero.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `<não documentado>` — conteúdo perdido; no irmão 1207 o sintoma era desconto calculado sobre base incompleta por verbas não marcadas.

**Severidade:** Alta *(desconto previdenciário errado em folha)*

**Preparação de massa:** funcionário de teste aderente ao plano, na base de homologação (RH); MIT010 do projeto em mãos para o passo 1.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig.
**Divergências encontradas:** o ticket foi fechado sem tratativa — este caso é a primeira verificação registrada do INC753359.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-1207  (protheus · Concluído · INCIDENTE 753358)

**Título:** Conferir que todas as verbas previstas na MIT010 estão marcadas para compor a base de desconto do Realize Mais

**Origem:** FSWTBC-1207 — "[CASSI - BH - Suporte Mar/2025 - INCIDENTE 753358] Cálculo Realize Mais": falso defeito bem resolvido — *"as verbas não estavam marcadas para compor o valor base de desconto do plano previdenciário, conforme informado na MIT010"*. Parametrização ausente, não código. Contraponto do 1151.

**Módulo/Rota:** **Protheus → SIGAGPE → Cadastro de Verbas (GPEA040 / SRV)**, atributo de composição da base do plano previdenciário; conferência no **GPEM020**.

**Módulo ERP:** `RH - Folha` *(módulo real: SIGAGPE — Gestão de Pessoal)*

**Pré-condições**
- MIT010 do Realize Mais com a lista de verbas que compõem a base.
- Credencial no Protheus com acesso ao cadastro de verbas.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: a marcação das verbas no SRV e o valor da base no cálculo`

**Passos**
1. GPEA040: para cada verba da lista da MIT010, abrir e ler o atributo de composição da base do plano previdenciário.
2. Listar verbas **marcadas** que **não** estão na MIT010.
3. Calcular a folha (GPEM020) de um aderente e ler a base do desconto.
4. Após qualquer **atualização de dicionário/pacote ou cópia de base (TST → PRD)**, repetir os passos 1–2.

**Resultado esperado**
- Passo 1: todas marcadas; passo 2: nenhuma a mais.
- Passo 3: base = soma das verbas da MIT010.
- Passo 4: a parametrização sobrevive à atualização/cópia (é o ponto onde ela se perde).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Verbas da MIT010 sem a marcação; base do Realize Mais menor que a devida; desconto a menor.

**Severidade:** Média *(parametrização; efeito financeiro, mas causa documentada e de correção imediata)*

**Preparação de massa:** MIT010 do projeto; um funcionário aderente ao plano na base de homologação (RH).

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig.
**Divergências encontradas:** o ticket está classificado como defeito, mas a resolução o caracteriza como **parametrização** — o caso é de checklist pós-deploy, não de regressão de código.
**Dados/massa usados:** nenhum.

## CT-FSWTBC-2431  (protheus · Concluído · SDCASSI-68)

**Título:** Disparar a integração de plano de saúde Protheus → SOC pelo botão e pelo schedule ao mesmo tempo e conferir que cada colaborador é cadastrado uma única vez

**Origem:** FSWTBC-2431 — cadastros de plano de saúde **duplicados/triplicados** no SOC, de forma intermitente, tanto pelo botão quanto pelo schedule. Diagnóstico no fonte `UGPEA016`: (1) **sem semáforo** — botão e schedule (ou dois schedules) executam em paralelo; (2) **sem verificação de já incluído** no SOC (idempotência). Patch `SDCASSI_68_202508252330.ptm` entregue com recomendação de validar antes de produção — **sem homologação registrada** e sem higienização dos duplicados.

**Módulo/Rota:** Protheus → SIGAGPE → rotina customizada de **integração de Plano de Saúde com o SOC** (`UGPEA016`; botão de integração manual — nome de menu a confirmar no cliente) e o **schedule** correspondente (Configurador → Schedule → agente/tarefa da integração — a confirmar); SOC → cadastro do funcionário → plano de saúde.

**Módulo ERP:** `RH - Folha` *(fonte SIGAGPE; efeito em fila/schedule)*

**Pré-condições**
- Credencial no Protheus (SIGAGPE + Configurador) e acesso de consulta ao **SOC** de homologação.
- Pelo menos 3 colaboradores de homologação com plano de saúde pendente de envio ao SOC.
- Autorização expressa para acionar o schedule em **homologação** (o briefing proíbe rodar schedule sem isso — §2).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP/SOC: quantidade de cadastros de plano de saúde por colaborador no SOC e log da rotina UGPEA016`; exige disparo de schedule (proibido nesta rodada).

**Passos**
1. No SOC, anotar a quantidade de registros de plano de saúde de cada colaborador de teste (esperado 0).
2. Disparar a integração pelo **botão** e, dentro de poucos segundos, forçar a execução do **schedule** (ou dois disparos do botão em sessões distintas).
3. Ler as mensagens/log da rotina em cada execução.
4. No SOC, recontar os registros por colaborador.
5. Disparar o botão novamente com os mesmos colaboradores (já enviados).
6. Recontar no SOC.

**Resultado esperado**
- Passo 3: a segunda execução concorrente é **recusada ou aguarda** (mensagem de rotina em execução — semáforo).
- Passo 4: **exatamente 1** registro por colaborador.
- Passo 5–6: a rotina identifica "já incluído no SOC" e **não** cria registro novo — contagem permanece 1.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Colaborador com 2 ou 3 cadastros de plano de saúde no SOC após execuções sobrepostas; sem padrão reproduzível; erro ocorre tanto só com botão quanto só com schedule.

**Severidade:** Alta *(duplicação de dado cadastral de benefício com efeito financeiro)*

**Preparação de massa:** 3 colaboradores de homologação com plano de saúde pendente — preparados pelo RH/administrador do Protheus; ambiente SOC de homologação; patch `SDCASSI_68` aplicado (verificar antes — a homologação não consta no ticket).

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — integração RH/SOC não passa pelo portal; sem superfície.
**Divergências encontradas:** o ticket fechou no dia da entrega do patch, sem homologação registrada — o caso pode reprovar se o patch não estiver aplicado.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2531  (protheus · Concluído · SDCASSI-71)

**Título:** Registrar uma batida pelo app SouCASSI e conferir que ela aparece em "Batidas do dia" do Meu RH como Automática, sem exigir autorização do gestor

**Origem:** FSWTBC-2531 — batida de entrada feita no SouCASSI não aparecia em *Batidas do dia* (Meu RH), o Protheus a considerava como saída e o Espelho de Ponto mostrava **Manual** em vez de **Automático**. Regras descobertas: batida externa entra como Manual e exige autorização; para ser Automática é obrigatório latitude/longitude — o SouCASSI não envia. Solução: API `UGPEE084.CONTROLLER.TLPP` (`registrarPonto`) grava `P8_FLAG='I'`, `P8_TIPOREG='O'`, lat/long `'0'` (como **string** — corrigido o erro `Invalid data type on (P8_LATITU)`). Liberado pela MUD16309.

**Módulo/Rota:** app **SouCASSI** → registrar ponto; Protheus → SIGAPON → *Marcações* (tabela SP8) e **Espelho de Ponto**; **Meu RH** → *Batidas do dia*; API REST `registrarPonto` (`UGPEE084`) — nomes de menu a confirmar no cliente.

**Módulo ERP:** `RH - Folha`

**Pré-condições**
- Colaborador de homologação com credencial no SouCASSI e no Meu RH; credencial no Protheus (SIGAPON) para consultar SP8 e Espelho de Ponto; acesso à API (Postman) para o cenário direto.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP/Meu RH: campos P8_FLAG/P8_TIPOREG/P8_LATITU/P8_LONGIT da marcação, Espelho de Ponto e "Batidas do dia"`

**Passos**
1. No SouCASSI, registrar uma batida de **entrada** às `HH:MM`.
2. No Meu RH → *Batidas do dia*, ler a lista.
3. No SIGAPON, localizar a marcação do colaborador na data (SP8) e ler `P8_FLAG`, `P8_TIPOREG`, `P8_LATITU`, `P8_LONGIT` e o tipo (entrada/saída) atribuído.
4. Abrir o Espelho de Ponto do dia e ler a origem da marcação.
5. (API) Enviar `registrarPonto` **sem** latitude/longitude e repetir 3.
6. (Regressão de tipagem) Enviar `registrarPonto` com lat/long numéricos e com string `"0"`; ler a resposta.

**Resultado esperado**
- Passo 2: a batida aparece em *Batidas do dia* **imediatamente**, sem depender de autorização do gestor.
- Passo 3: `P8_FLAG='I'`, `P8_TIPOREG='O'`, lat/long = `'0'`; a marcação é a **entrada** (não uma saída).
- Passo 4: origem **Automático** (não Manual).
- Passo 5: mesma gravação (lat/long `'0'` assumido pela API) — sem rejeição.
- Passo 6: nenhuma resposta `Invalid data type on (P8_LATITU)`.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Batida ausente em *Batidas do dia*; Protheus a trata como **saída**; Espelho de Ponto mostra **Manual**; API devolve `Invalid data type on (P8_LATITU)` (UGPEE084.CONTROLLER.TLPP linha 346).

**Severidade:** Alta *(registro de ponto — dado trabalhista; o contorno grava geolocalização "0", que é um dado falso e deve constar em auditoria)*

**Preparação de massa:** colaborador de homologação ativo no SIGAPON com escala válida na data; app SouCASSI apontado ao ambiente de homologação — preparado pelo RH/administrador. Não usar colaborador real de produção.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — ponto eletrônico não passa pelo portal; sem superfície.
**Divergências encontradas:** o ticket registra pendência não resolvida: a entrega anterior (SD 750368, 03/2025) cobria a mesma necessidade e não estava em produção — o caso deve ser reexecutado após cada promoção de release.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2574  (protheus · Concluído · SDCASSI-79)

**Título:** Calcular o pró-rata de um colaborador com mudança de step no mês e um abono de luto e conferir que o afastamento com verba é descontado dos dias úteis trabalhados

**Origem:** FSWTBC-2574 — "ERRO PRORATA - Abono Luto": o cálculo proporcional por alteração de step pagou **menos dias** por não identificar a ausência por luto. Achado: a rotina só considera afastamento o que está registrado nos afastamentos **e** tem **verba** associada; o abono luto não tinha verba. Correção funcional (afastamento ajustado com verba). Regra confirmada contra a MIT assinada: o pró-rata usa **dias úteis trabalhados**, descontando afastamentos, que são calculados automaticamente e não rateados. Nova demanda se a CASSI quiser outro critério.

**Módulo/Rota:** Protheus → SIGAGPE → *Afastamentos* (cadastro com verba) → *Cálculo da folha* (pró-rata por alteração de step — rotina customizada, nome de menu a confirmar) → *Resultado/Contracheque*.

**Módulo ERP:** `RH - Folha`

**Pré-condições**
- Credencial no Protheus (SIGAGPE) em base de homologação; verba de abono luto cadastrada e associada ao tipo de afastamento.
- Colaborador de homologação com **mudança de step no meio do mês** e um **afastamento por luto de N dias** (ex.: 2) no mesmo mês.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: dias e valor do pró-rata no resultado da folha`; exige rodar cálculo de folha (rotina batch — só em homologação, com autorização).

**Passos**
1. Registrar o afastamento por luto **com** a verba associada; anotar dias úteis do mês, data do step e dias de afastamento.
2. Calcular a folha do colaborador (somente em homologação).
3. Ler no resultado as verbas do pró-rata (antes e depois do step) e a verba do afastamento.
4. Repetir 1–3 com o afastamento **sem** verba associada e comparar.

**Resultado esperado**
- Passo 3: dias do pró-rata = dias úteis trabalhados em cada step, **descontando** os dias de luto; o abono luto aparece na própria verba, calculado automaticamente — soma de dias (pró-rata + afastamento) = dias úteis do mês.
- Passo 4: o sistema deve **criticar** o afastamento sem verba (ou o caso fica registrado como parametrização incompleta) — o total pago não pode ficar menor que no passo 3.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Pró-rata calculado sem reconhecer o luto, pagando **menos dias** do que o devido; afastamento sem verba ignorado silenciosamente.

**Severidade:** Alta *(valor de folha pago a menor)*

**Preparação de massa:** colaborador de homologação com step alterado no mês e afastamento por luto — cadastrado pelo RH em base de homologação; verba de abono luto parametrizada. A pendência do ticket é de **parametrização** (qualquer abono sem verba reincide).

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — cálculo de folha; sem superfície.
**Divergências encontradas:** nenhuma; o ticket cita alteração anterior de 23/12/2024 no mesmo cálculo — reexecutar a cada mudança da rotina.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3151  (protheus · Concluído · SDCASSI-143)

**Título:** Registrar o retorno de um colaborador de férias que já tem outra ausência futura cadastrada e conferir que o desbloqueio ocorre na data do retorno

**Origem:** FSWTBC-3151 — colaboradores voltavam de férias/abono e permaneciam **bloqueados**: a rotina `UGPEE012` (bloqueio/desbloqueio por
ausência) lia **todos** os afastamentos e tomava a maior data-fim — um abono **futuro** (21/11) estendia o bloqueio de quem voltou em 30/10.
Correção: devolver só os afastamentos **do dia**. Patch entregue sem registro de homologação nem de desbloqueio retroativo.

**Módulo/Rota:** SIGAGPE → *Afastamentos* / *Férias* / *Abonos* (cadastro de ausências); rotina `UGPEE012` de bloqueio/desbloqueio (schedule ou
execução manual — a confirmar no menu do cliente); situação de bloqueio do colaborador (cadastro do funcionário ou usuário — campo a confirmar).
Nenhuma superfície no Fluig.

**Módulo ERP:** `RH - Folha`

**Pré-condições**
- Colaborador de homologação com: férias de 01/10 a 29/10 (retorno 30/10) **e** abono futuro de 15/11 a 21/11 já cadastrado.
- Possibilidade de executar `UGPEE012` em homologação com data-base controlada (ou aguardar o schedule).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: situação de bloqueio do colaborador após a rotina de desbloqueio`. Rotina em lote — executar **só em homologação**.

**Passos**
1. SIGAGPE → cadastrar as duas ausências do colaborador de homologação.
2. Com data-base 02/10, executar a rotina: ler a situação do colaborador.
3. Com data-base 30/10 (retorno), executar a rotina: ler a situação.
4. Com data-base 15/11, executar: ler a situação.
5. Com data-base 22/11, executar: ler a situação.
6. (Controle) Colaborador sem ausência futura: passos 2–3.

**Resultado esperado**
- Passo 2: **bloqueado** (férias vigentes).
- Passo 3: **desbloqueado** — o abono futuro não é considerado.
- Passo 4: bloqueado; passo 5: desbloqueado.
- Passo 6: mesmo comportamento do colaborador com ausência futura.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- No passo 3 o colaborador continua **bloqueado**, com data-fim entendida como 21/11 (a do abono futuro).

**Severidade:** Alta — acesso negado a colaboradores ativos (e, no inverso, risco de acesso indevido).

**Preparação de massa:** colaborador de homologação com as duas ausências, cadastrado pelo RH/executor no SIGAGPE.

**Verificado em tela:** NÃO
**O que foi verificado:** *Gestão de Equipes* (`/portal/p/1/gestao_equipes`) lê o ERP mas responde *"Usuário não encontrado no ERP Protheus."* para a conta de QA (modal com título "Sucesso:" — A4) e não exibe situação de bloqueio; `dsProtheus_getFuncionarios_restGetAll` existe (200), `dsProtheus_getAfastamentos_restGetAll` não existe (500 NPE).
**Divergências encontradas:** o ticket não diz onde o bloqueio é visível (funcionário × usuário).
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-3602  (Protheus · Concluído · SDCASSI-49)

**Título:** Na base DES replicada, cadastrar um colaborador e um dependente usando as novas composições de filiação e os campos de identidade de gênero/orientação sexual da DEM10013021

**Origem:** FSWTBC-3602 — "[CASSI - DEM10013021] - REPLICAÇAO DA BASE DES - GAP". Sem descrição; parte do quarteto de 24/12/2025. O épico FSWTBC-2320 (DEM10013021 — Alterações ERP Administrativo) define o efeito: registro de colaboradores e dependentes com composições familiares diversas (filiação não limitada a "pai"/"mãe") e campos específicos de identidade de gênero e orientação sexual. O gap de replicação se manifesta como DES sem esses campos/opções.

**Módulo/Rota:** Protheus DES → Gestão de Pessoal (SIGAGPE) → Atualizações → Funcionários (SRA) e Dependentes (SRB) — campos customizados da DEM (nomes **a confirmar no dicionário do cliente**). No Fluig **não há superfície**: `/portal/p/1/rh_dependentes` → "Recurso não foi encontrado." para a conta de QA; nenhum processo dos 34 trata cadastro de dependente.

**Pré-condições**
- DES replicado após a entrega da DEM10013021 (dicionário SX3 com os campos novos e SX5/tabelas genéricas com as novas opções de filiação).
- Perfil de RH no Protheus DES.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: campos e opções de filiação/gênero no cadastro de funcionários e dependentes (SIGAGPE)`. Sem credencial de Protheus.

**Passos**
1. No DES, abrir o Configurador e localizar no dicionário os campos criados pela DEM em SRA/SRB (lista na MIT044); anotar ausentes.
2. Em Funcionários, incluir um colaborador `QA` preenchendo identidade de gênero e orientação sexual com opções da tabela.
3. Em Dependentes, incluir dois dependentes do colaborador `QA` com filiação em composição não tradicional (ex.: duas mães).
4. Gravar, reabrir e conferir os valores.
5. Executar a consulta/relatório que a DEM alterou (a confirmar na MIT044) e conferir que os campos aparecem.
6. Comparar as opções disponíveis nos combos com as de produção.

**Resultado esperado**
- Os campos existem no DES com as mesmas opções de produção; a inclusão grava e reabre íntegra.
- Nenhuma validação legada bloqueia a composição familiar não tradicional.
- Relatórios/consultas da DEM exibem os novos campos.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Campos ausentes ou combos sem as novas opções no DES — a homologação da DEM não pode ser feita no ambiente de desenvolvimento (o GAP).

**Severidade:** Média — bloqueia homologação; dado sensível (diversidade) exige cadastro correto.

**Preparação de massa:** colaborador e dependentes `QA` criados pelo executor no DES; nada pré-existente é alterado.

**Verificado em tela:** NÃO
**O que foi verificado:** ausência de superfície no Fluig (`rh_dependentes` → Error page 404 para a conta de QA; `rh_beneficios` não sondada).
**Divergências encontradas:** o título do épico diz "ERP Administrativo", mas o escopo é cadastro de RH (SIGAGPE) — o módulo do caso segue o escopo, não o título.
**Dados/massa usados:** nenhum.

**Módulo ERP:** `RH - Folha`

---

## CT-FSWTBC-3669  (Processo · Concluído · SDCASSI-49)

**Título:** Receber o repasse da DEM10013021 e executar, no Protheus de homologação, o roteiro de cadastro de colaborador/dependente com as novas composições familiares até reproduzir os resultados esperados da MIT010

**Origem:** FSWTBC-3669 — "[CASSI - DEM10013021] - Repasse dos desenvolvimentos com o time responsável pela homologação com a área de negocio". Tipo "Gaps"; sem descrição; aberto e fechado em 07/01/2026. Não é defeito de software: é a passagem de bastão para homologação. Caso escrito como **checklist de repasse** verificável (§5-D): o que o time de homologação precisa ter em mãos e conseguir executar sem o desenvolvedor.

**Módulo/Rota:** Protheus (ambiente de homologação/PRIME) → Gestão de Pessoal (SIGAGPE) → Funcionários / Dependentes (rotinas da DEM — a confirmar na MIT044); artefatos: MIT044, MIT010, pacote/patch aplicado, roteiro de testes. Sem superfície no Fluig (ver CT-FSWTBC-3602).

**Pré-condições**
- MIT044 e MIT010 da DEM10013021 disponíveis ao time de homologação e à área de negócio.
- Patch da DEM aplicado no ambiente de homologação (RPO e dicionário) — ver CT-FSWTBC-3602 para a verificação de alinhamento.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: execução do roteiro de homologação nas rotinas de cadastro de colaboradores/dependentes (SIGAGPE)`. Sem credencial de Protheus.

**Passos**
1. Conferir a existência e a versão dos artefatos do repasse: MIT044 aprovada, MIT010 com cenários e resultados esperados, evidência do patch aplicado no ambiente de homologação.
2. Conferir que cada cenário da MIT010 tem: rotina/menu, massa necessária, passos e resultado esperado — sem isso o repasse está incompleto.
3. Executar, sem apoio do desenvolvedor, o cenário de inclusão de colaborador `QA` com identidade de gênero/orientação sexual preenchidos.
4. Executar o cenário de dependentes com filiação não tradicional.
5. Executar o cenário de relatório/consulta alterado pela DEM.
6. Registrar para cada cenário: passou / falhou / não executável (faltou massa, menu ou permissão) e devolver a lista ao desenvolvimento.

**Resultado esperado**
- Todos os cenários da MIT010 são executáveis pelo time de homologação com os artefatos repassados, e os resultados batem com os esperados.
- Nenhum cenário depende de conhecimento não documentado (menu, parâmetro, massa).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Homologação parada por falta de artefato, de patch aplicado ou de massa — "repasse tratado como escopo adicional" (análise do lote); retrabalho de análise que este caso existe para evitar.

**Severidade:** Baixa — processo; o risco funcional está coberto pelo CT-FSWTBC-3602.

**Preparação de massa:** colaborador e dependentes `QA` criados pelo próprio executor no ambiente de homologação.

**Verificado em tela:** NÃO
**O que foi verificado:** nada aplicável no Fluig (`rh_dependentes` → 404 para a conta de QA).
**Divergências encontradas:** ticket de processo sem descrição; o lote o marcou "indefinido" — classificado aqui como processo com efeito verificável só no Protheus.
**Dados/massa usados:** nenhum.

**Módulo ERP:** `RH - Folha`

---

## Achados desta rodada (não estavam em ticket)

- **Automação do Jira duplica o prefixo do título** a cada movimentação: FSWTBC-1813 ("[CASSI - BH] - Suporte 2025]" ×4) e FSWTBC-3612 ("[CASSI - DEM10013707]" ×2). Prejudica busca e **fez este lote perder o defeito real do 1813** (o título truncado escondia "Erro no processo de recusa e aprovação de Alçada").
- **Erro de dataset Protheus chega como HTTP 200 com texto de erro no conteúdo**: `ds_protheus_getMatriculaTitular_rest` → `{"error":"Erro 401 --> Funcionario não localizado..."}`; `dsProtheus_getCompradores_restGetAll` → `"error":"undefined"`. Para a tela, é indistinguível de "sem dados" (mesma classe do A17-a).
- **Fluig de QA ↔ Protheus DES**: o host que o Fluig consome é o mesmo que o épico FSWTBC-806 chama de DES. Toda "replicação da base DES" tem efeito direto nas telas do Fluig que dependem de `dsProtheus_*` — vale um smoke test pós-replicação sobre esses datasets (GET search), como recomendado no A17-a.
- **SC 112011**: em *Aprovação de Alçadas* desde 21/08/2026 com SLA vencido em 25/08 e comentário do administrador "Erro na geração dos aprovadores corrigido no sistema regerando para validação" — evidência viva de intervenção manual no ciclo de alçada que o FSWTBC-1813 reportou.

## CT-FSWTBC-3902  (protheus · Concluído · SDCASSI-264)

**Título:** Apurar o ponto de um funcionário com falta autorizada de meio período, atraso autorizado e HE 50% inter-BH e conferir que esses eventos não creditam o banco de horas e que o adicional noturno apurado na FIP chega à folha

**Origem:** FSWTBC-3902 / incidentes 799257 e 799181 — agenda consultiva (8 h, 02/03/2026) para dois problemas de RH: (a) eventos **008** (falta autorizada meio período), **012** (atraso autorizado) e **057** (HE 50% inter BH) subindo **indevidamente** ao banco de horas; (b) **adicional noturno** de janeiro calculado na FIP mas **não integrado à folha** (prejuízo à funcionária, sem verba ATN). Entregue: orientação de S-1210/eSocial e ajuste do Ponto para gravar as verbas de ATN após 22h. **Pendente:** o relatório para achar *outros* casos de ATN não pago.

**Módulo/Rota:** Protheus → SIGAPON (*Apuração de Ponto*, *Banco de Horas*, cadastro de *Eventos* — flag de banco de horas) e SIGAGPE (*Cálculo da Folha*, *Fichas Financeiras*, verba de ATN); integração Ponto → Folha. Nomes de menu **a confirmar no menu do cliente**. Contraprova Fluig (**não é cobertura**): o *Portal de Autorização de Horas Extras* (`/portal/p/1/PORTAL_AUTORIZACAO_HORAS_EXTRAS`, links *Saldo*, *Autorização*, *Dashboard*, *Organograma*) lê o saldo do banco de horas do ERP — hoje abre com o modal *"Ops!"* (base offline, defeito U-02).

**Módulo ERP:** `RH - Folha`

**Pré-condições**
- Funcionário de homologação com jornada noturna (trabalho após 22h) e banco de horas ativo.
- Marcações de teste no período: uma falta autorizada de meio período (008), um atraso autorizado (012), uma HE 50% inter-BH (057) e horas após 22h.
- Cadastro dos eventos 008/012/057 com a configuração de banco de horas conforme a orientação da agenda (não creditar).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: movimentos do banco de horas por evento e verba de adicional noturno na ficha financeira`. Sem credencial Protheus; o Portal de Horas Extras do Fluig está com o Protheus offline (U-02).

**Passos**
1. Em SIGAPON → *Eventos*, ler a configuração de 008, 012 e 057 (participa do banco de horas? sinal?).
2. Lançar as marcações de teste e rodar a *Apuração de Ponto* do período para o funcionário.
3. Abrir o *Banco de Horas* do funcionário e listar os movimentos gerados pela apuração.
4. Abrir a FIP/resultado da apuração e ler as horas de adicional noturno (após 22h), separando horas normais de extras.
5. Integrar Ponto → Folha e rodar o *Cálculo da Folha* do mês; abrir a *Ficha Financeira*.
6. (Abrangência) Rodar/obter o relatório que lista funcionários com ATN apurado no Ponto e sem verba de ATN na folha — pedido explícito do ticket.
7. (Fluig, contraprova) Abrir o *Portal de Autorização de Horas Extras* → *Saldo* e comparar com o passo 3.

**Resultado esperado**
- Passo 3: **nenhum** crédito/débito no banco de horas originado dos eventos 008, 012 e 057.
- Passo 4: horas noturnas apuradas com a verba correta (normal × extra).
- Passo 5: ficha financeira com a verba de adicional noturno igual ao apurado (não zero).
- Passo 6: o relatório existe e retorna zero divergências para o mês de teste.
- Passo 7: saldo exibido no Fluig igual ao do ERP.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Eventos 008/012/057 aparecendo como movimentos do banco de horas; ATN calculado na FIP e **ausente** da folha (doc *"Inconsistência no cálculo do adicional noturno Janeiro"*).

**Severidade:** Alta — pagamento incorreto a funcionário e reflexo em eSocial/DIRF.

**Preparação de massa:** funcionário e marcações de homologação criados pelo executor no Protheus (credencial e perfil de RH obrigatórios), em competência de homologação; nada a criar no Fluig.

**Verificado em tela:** NÃO
**O que foi verificado:** `/portal/p/1/PORTAL_AUTORIZACAO_HORAS_EXTRAS` abre com título *"Cassi - Fluig Plataforma - Portal de Autorização de Horas Extras"*, títulos *Substitutos* / *Ops!* e botão *OK* (modal de base offline); page object do projeto confirma os links *Saldo*, *Autorização*, *Dashboard*, *Organograma*. `dsProtheus_getBancoHoras` **não existe** (GET search → 500).
**Divergências encontradas:** o ticket não menciona o Fluig; o portal de horas extras é a única superfície e está inoperante hoje (ambiente).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4297  (protheus · Concluído · SDCASSI-335)

**Título:** Consultar os alertas de Período Fatal de Férias (tabela ZZH) pela rotina de visualização e confirmar que o job só notifica quem não tem férias programadas

**Origem:** FSWTBC-4297 — a rotina *Período Fatal de Férias* (DEM10008870) não funcionava: o fonte `UGPEA032` indicado na MIT010 fora sobrescrito por outra demanda (BB Previdência/Realize+). Solução: novo `UGPEA033.tlpp` (MVC de **visualização** da ZZH, sem disparar e-mail/JOB) que exige cadastro manual no menu (`TBC.FSW.DEM10008870.U_UGPEA033`). Pendências registradas: UGPEA033 não confirmado em produção; `UGPEE063` compilado em produção e fora do GIT.

**Módulo/Rota:** Protheus — SIGAGPE → rotina de visualização *Alerta Período Fatal* (`U_UGPEA033`, nome de menu a confirmar no menu do cliente); job de notificação (`UGPEE063`); *Programação de Férias* (SRF). Sem qualquer superfície no Fluig: `/portal/p/1/gestao_ferias` responde 404; o processo `wf_solicitacao_ferias` existe, mas é a solicitação do empregado, não o alerta.

**Pré-condições**
- Menu do SIGAGPE com a rotina `U_UGPEA033` cadastrada (a MIT013 previa `UGPEA032`, que hoje pertence à BB Previdência).
- Ao menos um empregado com período aquisitivo próximo do limite (registro na ZZH) **sem** programação na SRF, e outro **com** programação (`RF_DATAINI`/`RF_DFEPRO1` preenchidos).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: linhas da ZZH (Dt Prg 1º Env), programação SRF e e-mail do job`. Sem credencial de Protheus.

**Passos**
1. No SIGAGPE, abrir a rotina de visualização do Alerta Período Fatal pelo menu e confirmar que ela abre (sem pedido de compilação de fonte).
2. Localizar os dois empregados da pré-condição e anotar a coluna *Dt Prg 1º Env*.
3. Confirmar que a rotina **não** possui ação de envio (é somente visualização).
4. Após a execução programada do job, verificar quem recebeu e-mail de alerta.
5. Conferir no Configurador/inspector que `UGPEA033` está no RPO de produção e que `UGPEA032` continua respondendo pela BB Previdência.

**Resultado esperado**
- Rotina abre e lista a ZZH sem erro de fonte inexistente.
- Somente o empregado **sem** programação de férias na SRF recebe o alerta; o que tem programação (qualquer um dos três períodos SRF) **não** é notificado, mesmo com data retroativa em *Dt Prg 1º Env*.
- `UGPEA032` (BB Previdência) permanece íntegro.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Rotina pedindo compilação do fonte / não abrindo; `UGPEA032` sobrescrito por outra demanda.
- Notificação indevida para empregado com férias já programadas.

**Severidade:** Média — bloqueia rotina de RH; risco de notificação indevida.

**Preparação de massa:** dois empregados na ZZH (com e sem SRF), preparados pela equipe de RH/folha; execução do job pelo administrador do ERP (não executar batch pela conta de QA).

**Módulo ERP:** `RH - Folha`
**Verificado em tela:** NÃO
**O que foi verificado:** sondado `/portal/p/1/gestao_ferias` → 404 (*Recurso não foi encontrado*); lista de processos do tenant (34) contém `wf_solicitacao_ferias` (solicitação do empregado). Nenhuma tela ou dataset do Fluig expõe ZZH/SRF.
**Divergências encontradas:** nenhuma no Fluig.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-5144  (protheus · AGUARDANDO INICIO · SDCASSI-537)

**Título:** Conferir, para um colaborador em malha fina, que os rendimentos e retenções informados pelo Protheus à Receita batem com o Informe de Rendimentos e com a folha do ano-calendário

**Origem:** FSWTBC-5144 — pedido de agenda para tratar "problemas na DIRF": colaboradores caindo em **malha fina** porque o sistema apura valores diferentes dos do governo. Incidente 823220. O ticket **não traz descrição, comentário nem anexo** e nunca saiu de *Aguardando início* — este caso é uma **caracterização de caminho** (§5-D), não a reprodução de um defeito descrito.

**Módulo/Rota:** Protheus → SIGAGPE (Gestão de Pessoal) → *Miscelânea* → *Anuais* → geração da **DIRF** / *Informe de Rendimentos* (nomes de menu **a confirmar no menu do cliente**; não se afirma código de rotina). Confirmar também com o cliente **qual arquivo** originou a divergência: a DIRF propriamente dita ou os eventos do eSocial/EFD-Reinf que vêm substituindo a DIRF — o ticket só diz "DIRF".

**Módulo ERP:** `RH - Folha`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGAGPE, ao ano-calendário em questão e às rotinas anuais.
- Lista de **matrículas** dos colaboradores notificados pela Receita, com a **notificação de malha** de cada um (qual rubrica diverge: rendimento tributável, IRRF retido, previdência oficial, dependentes, plano de saúde, 13º).
- Para cada um, o **Informe de Rendimentos** emitido pelo Protheus e o extrato da Receita (e-CAC / DIRPF) **com consentimento do colaborador**.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: valores gerados pela rotina anual (DIRF/Informe de Rendimentos) contra os acumulados da folha (rubricas de IR do ano-calendário)`. Sem credencial nesta rodada; o dado é sensível (pessoa física) — executar só com o RH do cliente.

**Passos**
1. Escolher **um** colaborador notificado e anotar, da notificação da Receita, as rubricas e valores que a Receita considera.
2. No Protheus, emitir o *Informe de Rendimentos* do ano-calendário para a matrícula e anotar as mesmas rubricas.
3. Gerar (ou abrir o arquivo já gerado) a DIRF do ano-calendário e localizar o registro do colaborador; anotar as rubricas.
4. Extrair da folha os acumulados anuais do colaborador (rendimento tributável, IRRF retido mês a mês, previdência, dependentes, plano de saúde, 13º) e somar.
5. Montar uma tabela com 4 colunas por rubrica: **Receita × Informe × DIRF × Folha**.
6. Repetir 1–5 para um colaborador **sem** notificação (controle).

**Resultado esperado**
- Passo 5: para cada rubrica, **Informe = DIRF = Folha** (o Protheus é internamente consistente) e **= Receita** (o que foi transmitido é o que a Receita tem). Qualquer diferença aparece na tabela com a rubrica nomeada.
- Passo 6: o colaborador de controle fecha em todas as colunas — prova que o método está correto antes de concluir algo sobre os notificados.
- Se houver diferença só na coluna *Receita*, o problema é de **transmissão** (arquivo/evento enviado ≠ gerado); se houver diferença entre *Informe/DIRF* e *Folha*, o problema é de **apuração** no Protheus — o caso separa as duas hipóteses.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `<não documentado>` no ticket. O único sintoma registrado: colaboradores em malha fina porque "o sistema está apurando valores diferentes dos do governo".

**Severidade:** Alta *(dano a terceiros — os próprios empregados —, prazo fiscal, não reversível por correção de sistema apenas)*

**Preparação de massa:** nenhuma a criar — o caso usa dados reais do ano-calendário. Precisa de: lista de matrículas notificadas (RH), notificações da Receita, consentimento dos colaboradores para uso do extrato e-CAC, e um colaborador de controle sem notificação.

**Verificado em tela:** NÃO
**O que foi verificado:** apenas a ausência de superfície no Fluig: o catálogo dos 34 processos publicados (`GET /process-management/api/v2/processes`, listado pelo L027) tem só `wf_solicitacao_ferias`, `wf_pagamento_horas_extras`, `rh_gbeneficios_planosaude`, `wf_automacao_admissao`, `wf_substituicaocargos` e `bpm_financeiro_rejeicoes_bancarias` na área de RH/financeiro — nenhum expõe IR, DIRF ou informe de rendimentos.
**Divergências encontradas:** o ticket não tem descrição — o caso é caracterização de caminho. Registrar com o cliente qual obrigação está em jogo (DIRF × eSocial/EFD-Reinf), porque muda a rotina a executar.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-5193  (ambos · AGUARDANDO INICIO · SDCASSI-551)

**Título:** Cadastrar o mnemônico, as fórmulas e o roteiro de cálculo do convênio ABRE Estágio (R$ 20,94) e calcular a folha de um estagiário
vinculado, conferindo o valor no cálculo

**Origem:** FSWTBC-5193 — a CASSI firmou contrato com a ABRE Estágio (atuação nacional, semelhante ao CIEE) e pede criação do mnemônico e montagem das
fórmulas e do roteiro de cálculo, com valor R$ 20,94. Ticket **sem responsável, sem comentários, sem anexos, nunca iniciado**. Demanda de Gestão de
Pessoal (SIGAGPE), não de Compras.

**Módulo/Rota:** Protheus → **SIGAGPE** (Gestão de Pessoal) → Atualizações → Definições de Cálculo → **Mnemônicos** (RCB) · **Fórmulas** (RCC) ·

**Módulo ERP:** `RH - Folha`
**Roteiros de Cálculo** (RCH/RCI) · Miscelânea → Cálculos → **Cálculo da Folha** · Relatórios → **Folha de Pagamento / Demonstrativo**.

**Pré-condições**
- Credencial Protheus com acesso ao SIGAGPE e permissão para manter definições de cálculo no ambiente de homologação.
- Um funcionário `QA` categoria estagiário com vínculo ao convênio ABRE Estágio (cadastro de estagiário/agente de integração) e período de
  cálculo aberto.
- Verba (SRV) associada ao convênio, definida pela CASSI.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: existência do mnemônico/fórmula/roteiro no SIGAGPE e o valor R$ 20,94 calculado na folha do estagiário`
- **Módulo ERP:** `Financeiro e Contabil` *(ressalva: a taxonomia disponível não tem lugar para Gestão de Pessoal/Folha; escolhido o mais próximo — o
  arquivamento correto seria "Gestão de Pessoal (SIGAGPE)")*

**Passos**
1. Em *Mnemônicos*, incluir o mnemônico do convênio ABRE (nome, tipo numérico, conteúdo `20.94`, descrição com prefixo `QA`).
2. Em *Fórmulas*, incluir a fórmula que usa o mnemônico e a verba do convênio; validar a sintaxe.
3. Em *Roteiros de Cálculo*, incluir/alterar o roteiro (FOL) adicionando a linha que chama a fórmula na sequência correta (após base, antes de líquido).
4. Executar *Cálculo da Folha* para o funcionário `QA` estagiário, filial e período de teste.
5. Abrir o *Demonstrativo de Pagamento* / consulta de cálculo (RGB) do funcionário.
6. Executar o mesmo cálculo para um funcionário CLT `QA` (controle).

**Resultado esperado**
- Passos 1–3: registros gravados sem crítica; fórmula compila; roteiro lista a nova linha.
- Passo 5: a verba do convênio aparece com **R$ 20,94** (ou o valor proporcional definido pela CASSI) no demonstrativo do estagiário.
- Passo 6: o CLT **não** recebe a verba.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Não há defeito de produto: o ticket é demanda nunca iniciada — mnemônico inexistente e folha do estagiário sem a verba ABRE.

**Severidade:** Média

**Preparação de massa:** funcionário estagiário `QA` vinculado ao convênio ABRE, verba definida pela CASSI, período de cálculo de teste; credencial
Protheus com SIGAGPE.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig — não há processo, widget ou dataset de folha neste portal (o catálogo de 34 processos da skill
`cassi-fluig-master` não tem Gestão de Pessoal/Folha). Protheus sem credencial.
**Divergências encontradas:** o ticket vem classificado como "ambos" mas é integralmente SIGAGPE; a taxonomia de Módulo ERP não contempla folha.
**Dados/massa usados:** nenhum.

---
