<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# Consultas e Logs

Casos de teste E2E do Fluig — módulo Consultas e Logs.

| | |
|---|---|
| Casos neste arquivo | 15 |
| Verificados em tela | 0 total · 15 parcial · 0 não |

> **Como ler.** Cada caso descreve o comportamento **correto esperado hoje**. A maioria dos
> defeitos de origem já foi corrigida — o caso é de regressão: se reprovar, o defeito voltou.
> Os que reprovam hoje por causa nunca corrigida estão marcados no próprio caso.
> *Verificado em tela* diz o que foi conferido no ambiente de homologação em 08/09/2026;
> **PARCIAL** costuma significar que a conta de QA não tem o perfil necessário (comprador,
> gestor, fiscal, fornecedor), não que o caso seja inválido.

---

## CT-FSWTBC-1503  (protheus · Concluído)

**Título:** Enviar uma SC à Validação Orçamentária e confirmar que a trava orçamentária do Protheus (PCO) responde e a SC sai de "Verificar retorno Protheus" com o retorno preenchido

**Origem:** FSWTBC-1503 — "Trava orçamentária". Chamado na TOTVS; última posição *"Geise informa que vão testar na TST"*; fechado no mutirão de 13/05 **sem confirmação do teste**. A trava é o controle que impede comprometer além do orçado — encerrar sem validação é risco de controle. Caso de regressão ancorado no Fluig (o portal é quem consome a trava).

**Módulo/Rota:** Fluig → **Solicitação de Compras** (`wf_solicitacao_compras`, form 256831) → *Validação Orçamentária* (**14** com gestor / **269** pool) → integração PCO → **Verificar retorno Protheus (317)** (antigo "Verificar Trava Orçamentária"; fim real na **319**) → campo **Retorno Integração** (`anLockBudgRetIntErr`) e campos `anLockBudgEnviarParaTreat`, `anLockBudgJustificativaTreat`, `codERPUserAnlyBudgLck`, `matriculaAnlyBudgLck`; aba **Histórico**; **Logs Protheus** → *Erros CV8*. No ERP: **SIGAPCO** › *Orçamento* / consulta de saldo por conta orçamentária; parâmetro de bloqueio.

**Pré-condições**
- SC com item cujo *Gestor Orçamentário* resolve (dataset `dsProtheus_getGestorOrcamentario_restGet` — hoje devolve HTML do ERP; instabilidade).
- Conta orçamentária com saldo **insuficiente** para o cenário negativo e **suficiente** para o positivo (parametrizado no PCO pela área orçamentária).
- **Bloqueio:** parcial — a conta de QA cria SC, mas a *Validação Orçamentária* é do gestor orçamentário (perfil que a conta não tem); a leitura de instâncias existentes é possível. Protheus sem credencial para o passo do PCO.

**Passos**
1. Criar uma SC (`QA` na descrição) com item de valor acima do saldo da conta orçamentária; enviar.
2. (Gestor orçamentário) na Central de Tarefas, abrir *Validação Orçamentária*, aprovar.
3. Abrir a instância → aba **Histórico**: acompanhar *Integração com ERP* → **Verificar retorno Protheus (317)**.
4. Aba **Formulário**: ler **Retorno Integração** e o bloco de análise de trava (*Enviar para*, *Justificativa*, dados do analista).
5. **Logs Protheus** → *Erros CV8*, filtro *"Mensagem, detalhe ou processo"* = nº da SC ERP; **Consultar**.
6. Repetir 1–4 com valor **dentro** do saldo.
7. (ERP) **SIGAPCO** → consultar o saldo da conta antes/depois: comprometido deve refletir a SC aprovada.

**Resultado esperado**
- Cenário sem saldo (1–5): SC desviada para **317** com **Retorno Integração** preenchido com a mensagem da trava do PCO (texto legível, com conta e valor), tarefa atribuída ao analista de trava (não `admin`), e registro CV8 correspondente.
- Cenário com saldo (6): SC **não** para na 317; Histórico com `Integração executada com sucesso`; **Retorno Integração** vazio; SC segue para *Validação do Comprador*/*Distribuição*.
- Passo 7: comprometido do PCO = valor da SC aprovada; sem comprometer quando a trava barrou.
- Em nenhum cenário a SC fica em 317 com **Retorno Integração vazio** (A15-b).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Trava não respondendo ou respondendo errado — sintoma exato `<não documentado>`; SC comprometendo orçamento sem saldo, ou barrada sem mensagem.

**Severidade:** Alta *(controle orçamentário)*

**Preparação de massa:** conta orçamentária de teste com saldo conhecido (área orçamentária/PCO) e gestor orçamentário disponível. Massa viva para os passos 3–5: **112855** está na 317 desde 28/08 com *Retorno Integração* = `Nao foi possivel ativar o modelo CNTA300 para gerar o aditivo.` — é retorno de **aditivo**, não de trava, mas exercita a mesma superfície.

**Verificado em tela:** PARCIAL
**O que foi verificado:** instância **112855** aberta em modo leitura: rótulo **Retorno Integração\*** com o valor acima, campos `numPedido`/`numContrato` vazios, *Pedido/Contrato foi Gerado?* = Não; por API está na seq **317** (`NOT_COMPLETED`, Fernanda Silva Martins) desde 28/08. Dataset do formulário confirma a família `anLockBudg*` / `codERPUserAnlyBudgLck` / `matriculaAnlyBudgLck`. *Logs Protheus* aberto (aba *Erros CV8* com filtros *Filial, Data inicial, Data final, "Mensagem, detalhe ou processo"*), consulta em **404** (ambiente). `dsProtheus_getGestorOrcamentario_restGet` devolvendo HTML (`Unexpected token: <`); `dsProtheus_getSaldoOrcamentario_restGetAll` e `dsProtheus_getTravaOrcamentaria_restGetAll` **não existem**. SC não criada.
**Divergências encontradas:** a atividade que os tickets chamam "Verificar Trava Orçamentária" hoje é **"Verificar retorno Protheus" (317)** e recebe qualquer erro de integração (o 112855 está lá por falha de aditivo CNTA300, não por trava) — a tela não distingue trava orçamentária de outro erro do ERP.
**Dados/massa usados:** nenhum — não submetido; leitura de 112855.

---

## CT-FSWTBC-2755  (ambos · Concluído · SDCASSI-75)

**Título:** A criação em lote das solicitações de medição automática conclui dentro do tempo e cada
solicitação entra na fila, sem ficar presa aguardando resposta do ERP.

**Origem:** FSWTBC-2755 — "Timeout na criação de solicitações de medição automática", defeito
interno da DEM10014371. É a **motivação declarada da própria DEM**: no modelo **síncrono** o Fluig
envia e **aguarda** a resposta do Protheus, e o volume (contratos CAST e de telefonia) estoura o
tempo. Solução especificada: **assincronismo com fila** (tabela ZZZ), atividades *"Aguarda Gravar
Medição"* e *"Aguarda Criar Pedido de Compras"* e gateways *"Medição Gravada?"* / *"Pedido
Gerado?"*. **Fechado no mesmo dia, sem registro de correção** — o que deixa dúvida se foi resolvido
ou apenas absorvido pelo escopo da demanda.

**Módulo/Rota:** *Logs Protheus* › abas **Solicitacoes ZZY** e **Medicoes ZZZ**;
**Faturamento de Contratos** (`wf_faturamento_contratos`) — abas **Histórico** e **Informações** da
instância.

**Pré-condições**
- Uma janela em que a rotina de criação automática tenha rodado sobre **muitos** contratos.
- **Bloqueio:** **sim** — §2 proíbe disparar rotina batch/schedule; o caso **observa** o resultado.
  Adicionalmente, `genericQuery` responde **404** hoje, então nenhuma linha de fila pôde ser lida.

**Passos**
1. Abrir *Logs Protheus* › **Solicitacoes ZZY**; deixar *Status* em **Todos**, preencher
   *Data inicial* e *Data final* com o dia da carga (ISO `aaaa-mm-dd`) e clicar **Consultar**.
2. Anotar o total exibido no rodapé (**"Total encontrado: N registro(s)."**).
3. Filtrar *Status* = **P** (pendente) na mesma janela e anotar o total.
4. Abrir a coluna **Json Retorno** de uma linha em **Ver JSON** e conferir que há retorno gravado.
5. Conferir a coluna **`Qtd T.Env Fl`** das linhas da janela.
6. Abrir uma das instâncias de *Faturamento de Contratos* criadas e, na aba **Histórico**, conferir
   o registro da integração e o **tempo de execução**.

**Resultado esperado**
- A carga do dia aparece **inteira** em **Solicitacoes ZZY**: o total do passo 2 corresponde ao
  número de contratos elegíveis do dia.
- O total de linhas em *Status* = **P** **cai a zero** dentro do intervalo de processamento — a
  fila **anda**; não há acúmulo de pendentes de um dia para o outro.
- **Json Retorno** e **Msg Ret Flui** estão preenchidos para as linhas concluídas (retorno gravado,
  não vazio).
- **`Qtd T.Env Fl` ≤ 3** — dentro da política de três tentativas.
- No **Histórico** da instância, a integração é registrada como concluída (padrão do ambiente:
  `Integração executada com sucesso - Tempo de Execução N s`), **sem** o processo ter ficado parado
  aguardando o ERP.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Timeout na criação das solicitações de medição automática: a chamada síncrona ao Protheus não
  retorna a tempo e **parte das solicitações não é criada**. Mensagem exata `<não documentado>` —
  o ticket não tem anexo nem comentário; o sintoma herdado do épico é o **estouro de tempo por
  volume**.
- No Fluig: linhas presas em *Status* = **P** em **Solicitacoes ZZY**, `Qtd T.Env Fl` subindo, e
  contratos do dia **sem** instância de *Faturamento de Contratos*.

**Severidade:** Alta — mesma consequência da FSWTBC-2635: medição não criada é faturamento perdido.

**Preparação de massa:** nenhuma a criar — o caso observa uma carga real. Para exercitar o limite é
preciso um dia com **volume alto de contratos elegíveis**, o que só o dono do ambiente prepara.
**Não** disparar a rotina para forçar.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — *Logs Protheus* › **Solicitacoes ZZY** abre com os
filtros *Filial*, *Chave*, *Rotina*, *Status* (`Todos/P/E/S`), *Data inicial*, *Data final* e o
botão **Consultar**; `genericQuery` responde **404** para `ZZY`, com o toast *"Logs Protheus: Nao
foi possivel consultar o dataset de logs."* — **nenhuma linha lida**. `wf_faturamento_contratos`
abre com as abas *Formulário / Informações / Histórico / Anexos*.
*Lido no fonte publicado* — o `ZZYController` declara as colunas **Filial, Chave, Rotina, Data,
Hora, Status Proth, Status Fluig, Json Entrada, Json Retorno, Json Env Flg, Msg Ret Flui, Data
Integ, Hora Integ, Dt.Atu.Fluig, Hr.Atu.Fluig, `Qtd T.Env Fl`**; os rótulos de rodapé são
**"Total encontrado: N registro(s)."** / **"Nenhum registro encontrado."** e a mensagem de grade
vazia é **"Nenhum log encontrado para os filtros informados."**.
**Divergências encontradas:** (a) o ticket fala das atividades *"Aguarda Gravar Medição"* e
*"Aguarda Criar Pedido de Compras"* e dos gateways *"Medição Gravada?"* / *"Pedido Gerado?"* — **não
consegui confirmar esses nomes em tela**, porque exigem uma instância viva na etapa; ficam como
`<não confirmado em tela>`; (b) **achado, do fonte**: os botões de **paginação** do widget *Logs
Protheus* (`page-prev` / `page-next`) estão ligados a `previousPage()` e `nextPage()`, que são
**stubs vazios** — só chamam `event.preventDefault()` e nunca alteram `currentPage`. Com volume
alto de log (justamente o cenário deste ticket) **não é possível passar de página**.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2943  (protheus · Concluído · SDCASSI-75)

**Título:** Acompanhar as solicitações de Faturamento de Contratos abertas pela medição automática e conferir que os dados da medição chegam íntegros ao ERP (Logs Protheus → Medicoes ZZZ)

**Origem:** FSWTBC-2943 — "correção de bug em `UGCTE001.DATA.TLPP`" (dados da medição automática, DEM10014371), resolvida incluindo
`CanSetValue` e recompilando, com o próprio autor registrando *"resolveu (???)"*. **O ticket não descreve o erro** — este caso é uma
**caracterização de caminho** da medição automática.

**Módulo/Rota:** Fluig → *Logs Protheus* (`/portal/p/1/portal_logs_protheus`) → aba **Medicoes ZZZ** → *Consultar*; *Tracker*
(`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`) → visão **Faturamento de Contratos**; *Detalhes da Solicitação* das instâncias
abertas por `consumerkeycompras`. ERP: rotina de medição automática do GCT (`UGCTE001`, schedule) — nome de menu a confirmar.

**Módulo ERP:** `Integracao e Filas`

**Pré-condições**
- Rodada da medição automática já executada pelo schedule (hoje: 202 instâncias abertas 03:07–03:08 por `consumerkeycompras`) — **não disparar o schedule**.
- Contratos com planilha de medição automática (`CNL_MEDAUT`) vigentes.
- **Bloqueio:** `genericQuery` das abas ZZY/ZZZ em 404 hoje (ambiente); a conta de QA não é fiscal e não abre a tarefa 25.

**Passos**
1. Abrir *Logs Protheus* → aba **Medicoes ZZZ** → filtrar *Filial* e a data de hoje → **Consultar**.
2. Para uma linha, ler *Contrato*, *Revisao*, *Num Med*, *Json Medicao*, *Msg Medicao*, *Status Proth*, *Status Fluig*, **Qtd T.Env Fl** e *ID Fluig*.
3. Abrir o *Tracker* → visão *Faturamento de Contratos* → filtro *Solicitante* = `consumerkeycompras` e *Data de Solicitação* = hoje → *Pesquisar Registro*; contar linhas e ler *Atividade Atual*.
4. Abrir uma dessas solicitações (*Detalhes da Solicitação*) → aba *Formulário*: conferir *Competência do Contrato*, *Filial da Medição*, *Nº da Medição*, *Itens da Medição*, *Saldo a Medir* preenchidos; aba *Histórico*.
5. Comparar a contagem do passo 3 com a quantidade de contratos com medição automática vigente (dataset `ds_fatcon_get_busca_contratos` ou consulta no ERP).

**Resultado esperado**
- Passo 2: *Status Proth* de sucesso, *Msg Medicao* sem erro, **Qtd T.Env Fl = 1** (sem retentativa), *Json Medicao* com contrato/revisão/itens coerentes com a planilha.
- Passo 3: uma solicitação por contrato com medição automática, todas em *Realizar Medição do Contrato* (25) ou adiante — nenhuma em *Correção* (117) nem em *Aguarda processamento Fila Protheus* (182) por mais de minutos.
- Passo 4: formulário íntegro e Histórico sem `Falha`.
- Passo 5: contagens iguais.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `<não documentado>` — o ticket não registra o sintoma. Sinais compatíveis com a correção aplicada (`CanSetValue` = valor recusado pelo campo): *Msg Medicao* com erro de tipo/tamanho, *Qtd T.Env Fl* crescente, contrato com medição automática **sem** solicitação no Fluig, ou solicitação em *Correção*.

**Severidade:** Alta — medição automática alimenta pagamento e contabilização de contratos.

**Preparação de massa:** nenhuma a criar — usa a rodada diária do schedule. Se for preciso um contrato novo com medição automática, cadastrá-lo no SIGAGCT (credencial Protheus) e esperar a rodada seguinte.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Logs Protheus* abre com as abas *Erros CV8 / Solicitacoes ZZY / Medicoes ZZZ* e o botão *Consultar* (grade vazia — 404 do `genericQuery`); as colunas ZZZ vêm do fonte publicado (`lp_ZZZController_pt_BR.js`); a visão *Faturamento de Contratos* do Tracker tem os filtros `numProcesso`, `usuarioSolicitante`, `status`, `numContrato`, `zoomCompetencia`, `numMedicao`, `situacaoMedicao` e devolveu a 62119; dos últimos 1.000 movimentos do processo, **744 são de `consumerkeycompras`**; o form 256836 lê `tipoInicioProcesso` em `if (tipoInicioProcesso == 'manual' || 'automático')` (sempre verdadeiro — A2-d).
**Divergências encontradas:** o ticket não cita tela nem sintoma; a condição de início automático no front é inócua (o ramo alternativo é inalcançável); ativos por estado hoje incluem **seq. 28 = 113 instâncias** (nome não capturado pelo endpoint) e **117 = 7** em Correção.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3031  (ambos · Concluído · SDCASSI-131)

**Título:** Tentar enviar uma SC cujo item tenha rateio somando menos de 100% e confirmar que o Fluig barra na origem, sem deixar a crítica para o ERP.

**Origem:** FSWTBC-3031 — a SC 60665 permitiu envio com rateio **abaixo de 100%** e o ERP recusou a integração com `Falha na Integração com ERP. code: 401 message: AJUDA:A103TOTRAT Valor a ser rateado nao confere com o total.` Corrigido via PR 59089 / MUD16769.

**Módulo/Rota:** Formulário da SC → painel de itens (grade `tbProdutos`) → sub-grade de rateio **`tbRateioItens___<n>`** (coluna **`Rateio %`**, campo `tbRatCC_Rateio___<item>_<linha>`); conferência consultiva no Tracker, visão **Produtos/Rateio SC**.

**Pré-condições**
- SC **própria** em atividade de digitação: **Início** (0/6) ou **Ajustar Informações** (11) — são os únicos estados em que a validação de envio roda.
- Um item com ao menos duas linhas de rateio por centro de custo.
- **Bloqueio:** parcial. Para exercitar a crítica é preciso uma SC **criada pelo próprio executor**; as 10 tarefas da conta hoje são de terceiros (atividades *Correção* e *Validação do Gestor*) e o briefing proíbe alterar registro alheio. A conferência **consultiva** (Tracker) foi feita e é executável sem escrever nada.

**Passos**
1. Abrir a SC própria em *Início* ou *Ajustar Informações*.
2. No item 1, abrir a sub-grade de rateio e preencher os centros de custo somando **menos de 100%** (ex.: `60` e `30`).
3. Clicar em **Enviar**.
4. Observar o modal de crítica (SweetAlert2, título **`Erro:`**).
5. Corrigir para somar exatamente `100` e conferir que o envio deixa de ser barrado — **sem concluir**: fechar o formulário sem movimentar.
6. Repetir deixando **uma linha de rateio em branco** ao lado de outras que somem 100.
7. Consultiva: no Tracker, *Filtrar por* = **Produtos/Rateio SC**, informar o **Nº do Processo Fluig**, clicar em **Pesquisar Registro** e somar a coluna **`Rateio %`** por `Item`.

**Resultado esperado**
- Com soma < 100%, o envio é **bloqueado** com a mensagem `A soma dos percentuais de rateio não podem ser inferior a 100%. Por favor, verifique o item ...`.
- Com soma > 100%, a mensagem é `A soma dos percentuais de rateio não podem ultrapassar o limite de 100%. ...`.
- Com linha de rateio em branco, o envio também é bloqueado (`Existem campos de rateio sem preenchimento! Favor preencher todos os campos e tente novamente.`).
- Nenhuma SC chega ao ERP com rateio ≠ 100%: o campo **`Retorno Integração`** nunca exibe `A103TOTRAT`.
- No Tracker, **toda** SC listada soma exatamente `100` por item na coluna `Rateio %`.

**Resultado se o defeito reincidir**
- A SC é enviada com rateio incompleto e o processo para com `Falha na Integração com ERP. code: 401 message: AJUDA:A103TOTRAT Valor a ser rateado nao confere com o total.`

**Severidade:** Alta

**Preparação de massa:** uma SC criada pelo próprio executor, em *Início* ou *Ajustar Informações*, com um item rateado em 2 centros de custo. **Superfície do Fluig para o efeito:** a crítica no próprio formulário e, de forma consultiva e sem escrita, a coluna `Rateio %` da visão *Produtos/Rateio SC* do Tracker.

**Verificado em tela:** PARCIAL
**O que foi verificado:** Tracker, visão **Produtos/Rateio SC** aberta e exercitada (`table-scd`, dataset `dsFluig_produtosSC_Sql_CASSI`, constraint `W.NUM_PROCES`): retornou **247 linhas** para o processo 112830, com colunas `Item / Rateio % / C. Custo / Classe Valor`; nas linhas lidas o `Rateio %` é **`100`** por item (itens 0001, 0002, 0003, C. Custo `AS00 - PLANOS DE ASSOCIADOS`, Classe `7003 - IMOBILIZADO CORRENTE - GAC`). No formulário real da SC 112830 a sub-grade de rateio está presente (`table_rateioItens`, cabeçalhos `# / Item / Rateio % / C. Custo / Classe Valor`). No fonte publicado, `sc_App_ViewHandler.js:1841-1858` (`handleValidRateio`) confirma as duas mensagens de bloqueio literais e a comparação contra `100` com `toFixed(8)`, e `sc_App_App.js:88,125` mostra que ela só é chamada nos estados 0/6 e 11.
**Divergências encontradas:** duas, ambas do fonte publicado. (a) **O caminho de Salvar não bloqueia**: `sc_App_App.js:290,299,311,316` (e o bloco duplicado em 344-370) apenas faz `console.error("A soma de todos os valores de rateio deve ser igual a 100%. ...")` e segue — só *Enviar* barra. (b) **Guarda truthy**: `if ($(ox).val())` em `sc_App_ViewHandler.js:1798` e `:1845` faz o campo vazio ser **pulado da soma** em vez de reprovado, de modo que uma linha em branco ao lado de outras somando 100 passa pela `handleValidRateio`.
**Dados/massa usados:** consulta ao processo 112830 no Tracker. Nada digitado, nada enviado.

---

## CT-FSWTBC-3443  (ambos · Concluído · SDCASSI-165)

**Título:** Conferir que nenhuma SC sai do Fluig com percentual de rateio negativo ou acima de 100% em qualquer linha, mesmo que a soma do item feche em 100%.

**Origem:** FSWTBC-3443 — erro ao alterar pedido de compra (`argument #0 error, expected C->U, function rtrim` em MSGETDAD.PRW). Achado principal: o lançamento no PCO saía com valor divergente porque o **rateio do pedido tinha percentuais inválidos — um registro com 500% e outro com -400%, somando 100%**; como o PCO não gera lançamento com valor negativo, o valor final ficava errado. Segundo ajuste: a regra de lançamento P002 não considerava frete e despesas extras. **Ponto explicitamente deixado em aberto** por Daniel: "verificar o caso do rateio negativo e maior que 100%" — a correção atuou na regra de lançamento, **não na validação do rateio**. Também sem resposta: item sem saldo que não bloqueou a geração do pedido (SC 59883).

**Módulo/Rota:** Tracker → *Filtrar por* = **Produtos/Rateio SC** (`SCD`), coluna **`Rateio %`**; formulário da SC → sub-grade de rateio (`tbRateioItens___<n>`, campo `tbRatCC_Rateio___<item>_<linha>`).

**Pré-condições**
- SCs com itens rateados em mais de um centro de custo.
- Para o cenário de risco: uma SC própria em *Início* / *Ajustar Informações*, na qual seja possível tentar informar `500` e `-400`.
- **Bloqueio:** parcial. A **auditoria consultiva** (Tracker) é totalmente executável e foi executada. O **cenário de digitação** exige SC própria — as tarefas disponíveis são de terceiros. Os efeitos citados no ticket (MSGETDAD, PCO, regra P002, frete e despesas extras, tabelas AK8/AKA/AKB/AKC/AKH/AKI/ZP3) são **exclusivamente Protheus**, sem credencial.

**Passos**
1. Abrir o Tracker e escolher em *Filtrar por* a visão **Produtos/Rateio SC**.
2. Informar um filtro — **`Nº do Processo Fluig`** de uma SC com rateio, ou **`Grupo de Produto.`** — e clicar em **Pesquisar Registro**.
3. Na grade, agrupar mentalmente por **`Item`** e somar a coluna **`Rateio %`**.
4. Procurar, linha a linha, qualquer valor **negativo** ou **maior que 100**.
5. Exportar pelo botão **Excel** para auditar um volume maior.
6. Repetir para outras SCs, variando o filtro.
7. Cenário de digitação (só em SC própria): num item, informar `500` numa linha de rateio e `-400` em outra, e clicar em **Enviar**.
8. Repetir o passo 7 informando os valores por **importação de planilha CSV**, em vez de digitar.

**Resultado esperado**
- Nenhuma linha da coluna **`Rateio %`** apresenta valor **negativo** ou **maior que 100**.
- A soma por item é exatamente **100**.
- Na digitação, o percentual é limitado ao intervalo **0 a 100** por linha, e a combinação `500` / `-400` é **rejeitada no Enviar**, mesmo somando 100.
- A importação por CSV é submetida às **mesmas** regras da digitação.

**Resultado se o defeito reincidir**
- Uma SC/pedido carrega linhas de rateio com **500%** e **-400%** que somam 100% e passam pela validação; no PCO o lançamento sai com valor divergente porque valores negativos não geram lançamento.

**Severidade:** Alta

**Preparação de massa:** para a auditoria consultiva, basta massa existente — não é preciso criar nada. Para o cenário de digitação, uma SC criada pelo próprio executor com um item rateado em 2 centros de custo, mais um CSV de rateio com valores fora do intervalo. **Declaração explícita, conforme §5-B:** o erro `MSGETDAD.PRW`, os lançamentos do PCO, a regra P002 e o tratamento de frete/despesas extras **não têm nenhuma superfície no Fluig**. O que o Fluig permite verificar — e é o ponto que o ticket deixou em aberto — é a **origem do dado inválido**: o percentual de rateio. A coluna `Rateio %` da visão *Produtos/Rateio SC* é a única superfície consultiva para isso.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a auditoria dos passos 1 a 4 foi **executada**. Tracker, visão **Produtos/Rateio SC**, filtro `Nº do Processo Fluig = 112830`: grade `table-scd`, dataset `dsFluig_produtosSC_Sql_CASSI` (constraint `W.NUM_PROCES`), **247 linhas**, colunas `... | Item | Rateio % | C. Custo | Classe Valor`. Nas linhas lidas, `Rateio %` = **`100`** por item (itens `0001`, `0002`, `0003`), C. Custo `AS00 - PLANOS DE ASSOCIADOS`, Classe Valor `7003 - IMOBILIZADO CORRENTE - GAC` — **nenhum valor negativo nem acima de 100 nesta amostra**. O botão **Excel** de exportação está presente na grade.
**Divergências encontradas:** o achado é forte e confirma o ponto que o ticket deixou aberto. (a) **Não existe validação por linha no envio**: `handleValidRateio` (`sc_App_ViewHandler.js:1841-1858`) apenas **acumula** os percentuais e compara a soma com 100 — não há `if (v < 0)` nem `if (v > 100)` por linha, de modo que `500 + (-400) = 100` **passa**. (b) O único limite por linha está no `blur` (`:1788-1793`) e o ramo negativo é **código morto**: o `replace(/[^\d,\,\.]/g,"")` já removeu o sinal `-` antes do teste `parseFloat(value) < 0`. (c) A máscara **aceita o sinal** (`mask('Z##9V########')`, com `Z` = `/[\-\+]/` opcional). (d) O caminho de **importação por CSV** grava o valor cru sem passar por `blur` (`sc_App_EventHandler.js:857`) e só verifica se a soma ultrapassa 100 (`:843`) — **nunca se é negativa**. Ou seja, o cenário do ticket continua alcançável hoje pelo CSV.
**Dados/massa usados:** consulta ao processo 112830 no Tracker. Nada digitado, nada importado, nada enviado.

---

## CT-FSWTBC-3488  (ambos · Concluído · SDCASSI-171)

**Título:** Criar SC cujo gestor orçamentário esteja afastado com substituto cadastrado e confirmar que a validação orçamentária é encaminhada ao substituto.

**Origem:** FSWTBC-3488 — SCs não buscavam o gestor orçamentário lançado como **substituto** (Regina substituindo Leonardo); exemplos SC 68855, 69232 e 69403. É o **terceiro** ticket sobre resolução de gestor orçamentário em pouco mais de três meses, cada um com causa distinta (FSWTBC-2681: dois superiores sem data-fim na RCX; FSWTBC-3435: dataset retornando usuário inativo; este: substituto não considerado). Entregue como patch; **o patch chegou ao cliente por WhatsApp, fora da trilha de auditoria**, e não há registro de aplicação nem de validação.

**Módulo/Rota:** Formulário da SC → painel **Validação do Item Orçamentário** (grade `tbItemOrcamentario`), campo **`Total Estimado a Aprovar (R$)`**; Central de Tarefas, atividade **Validação Orçamentária**; Tracker visão **Aprovadores SC**, coluna **`Aprovador Item Orçamentário`**.

**Pré-condições**
- Produto/serviço cujo gestor orçamentário esteja cadastrado no ERP (`AK6_XGESTO`).
- Substituição vigente cadastrada para esse gestor.
- SC que chegue à **Validação Orçamentária**.
- **Bloqueio:** parcial. Não há tarefa em *Validação Orçamentária* para a conta de QA (as 10 pendências são *Correção* e *Validação do Gestor*), e não há credencial de **gestor** (§5-C). O cadastro de substitutos e o campo `AK6_XGESTO` são do Protheus, **sem credencial**. **Atenção de escopo:** conforme a tabela do briefing, vários defeitos desta família vivem **só na atividade 269** (*Validação Orçamentária sem gestor / pool*); testar apenas na **14** não exercita a correção — o caso deve ser executado **nas duas**.

**Passos**
1. Criar/abrir SC com item cujo gestor orçamentário tenha substituto vigente.
2. Levar a SC até a **Validação Orçamentária**.
3. Na Central de Tarefas, entrar com a conta do **substituto** e clicar explicitamente na aba **Tarefas a concluir**.
4. Conferir que a tarefa da SC aparece para o substituto.
5. Abrir a tarefa e localizar o painel **Validação do Item Orçamentário**.
6. Na grade `tbItemOrcamentario`, conferir **`Aprovador`**, **`Email do Aprovador`**, **`Total Estimado a Aprovar (R$)`**, **`Nº SC Origem ERP`** e **`Cód. Filial Origem`**, e que os controles **`Aprovar?`** e **`Justificativa para a Aprovação/Reprovação`** estão habilitados.
7. Repetir na atividade **269** (Validação Orçamentária sem gestor / pool).
8. No Tracker, visão **Aprovadores SC**, filtrar pelo **`Nº do Processo Fluig`** e ler **`Aprovador Item Orçamentário`** e **`Email Aprovador Item Orçamentário`**.
9. Sair sem aprovar.

**Resultado esperado**
- A tarefa de Validação Orçamentária **chega ao substituto** quando o titular está substituído.
- O painel **Validação do Item Orçamentário** é montado, com **`Total Estimado a Aprovar (R$)`** preenchido, tanto na atividade **14** quanto na **269**.
- Os controles **`Aprovar?`** e **`Justificativa`** ficam habilitados para o substituto.
- Quando a resolução do gestor **falha**, o usuário recebe mensagem explícita — a SC não segue silenciosamente sem aprovador.
- No Tracker, **`Aprovador Item Orçamentário`** reflete quem de fato aprovou.

**Resultado se o defeito reincidir**
- A SC não busca o gestor orçamentário lançado como substituto: a tarefa não chega a ele e a validação orçamentária fica parada ou sem aprovador — como nas SCs 68855, 69232 e 69403.

**Severidade:** Alta

**Preparação de massa:** um produto com `AK6_XGESTO` apontando gestor com **substituição vigente** (cadastro no Protheus + substituição no Fluig) e uma SC que alcance a Validação Orçamentária, nas duas variantes (com gestor / pool). Quem prepara: administrador do Fluig e analista com acesso ao Protheus — **nenhum dos dois disponível nesta rodada**. **Superfície do Fluig para o efeito:** o painel *Validação do Item Orçamentário*, a Central de Tarefas e a coluna *Aprovador Item Orçamentário* do Tracker. O cadastro de substitutos no ERP **não tem superfície no Fluig**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** formulário real da SC 112830 — os rótulos **`Total Estimado a Aprovar (R$) *`**, **`Aprovador *`**, **`Email do Aprovador *`**, **`Nº SC Origem ERP *`**, **`Cód. Filial Origem *`**, **`Aprovar? *`** e **`Justificativa para a Aprovação/Reprovação *`** estão presentes; os campos de controle `itensSemGestOrcament` e `itensGestOrcamentario` existem no formulário. Tracker visão **Aprovadores SC** (`table-sca`, dataset `dsFluig_aprovadoresSC_Sql_CASSI`) aberta para o processo 112830: retornou 1 linha com as colunas `Aprovador Gestor / Email Aprovador Gestor / Data Aprovação Gestor / Hora Aprovação Gestor / Aprovador Comprador / ... / Aprovador Item Orçamentário / Email Aprovador Item Orçamentário / Data Aprovação Item Orçamentário / Hora Aprovação Item Orçamentário` — todas **vazias**, coerente com a SC estar em *Validação do Gestor*, antes da etapa orçamentária. Tracker visão SC confirmou existir massa em **Validação Orçamentária** (processo 111951, responsável `erlon.dengo@cassi.com.br`). Central de Tarefas: nenhuma tarefa de Validação Orçamentária para esta conta.
**Divergências encontradas:** três achados de fonte, todos apontando para a fragilidade que o ticket descreve. (a) **O front-end não resolve substituto de gestor orçamentário em momento algum**: o dataset é `dsProtheus_getGestorOrcamentario_restGet` e traz apenas `AK6_XGESTO` (titular); a substituição só é tratada em tempo de **aprovação**, via `dsFluig_getAllValidSubstitute`/`WKSubstituteUser`, **nunca** na **resolução** de quem é o aprovador. (b) **A chamada é feita com assinatura errada**: `handleBudgetItemApprover` é declarada como `async handleBudgetItemApprover({ codProduto = null })` (`sc_App_EventHandler.js:406`) mas é invocada com uma string em `sc_App_EventHandler.js:1038` (`handleBudgetItemApprover(codProduto)`), de modo que o default `null` prevalece e a URL sai com `productID,null`; a forma correta aparece em `:565`. (c) **Falha silenciosa em três camadas**: `.catch((err) => { response = null; })` (`:430-432`), `console.error('Erro ao buscar o Gestor Orçamentário do produto ...'); return null;` (`sc_App_DataHandler.js:409-410`) e `console.error('Erro ao atualizar as informações do gestor orçamentário ...')` (`:1059`) — **nenhum toast** em todo o caminho, então a SC segue sem aprovador sem que ninguém seja avisado. Registro adicional: a rastreabilidade do próprio ticket é frágil (patch entregue por WhatsApp, sem registro de aplicação nem de validação).
**Dados/massa usados:** consulta ao processo 112830 e ao Tracker. Nada aprovado, nada movimentado.

---

# Relato do lote

- **Itens no arquivo:** **14** (conferido: `json.load(...)` → `len == 14`). **Casos escritos: 14** — nenhum item ficou de fora.
- **Verificado em tela:** **SIM (total): 0 · PARCIAL: 14 · NÃO: 0.**
  Todo item do lote tem `sistema: "ambos"`, e em **todos** o desfecho do defeito acontece no Protheus (geração de pedido, gravação na SA2/CNA, lançamento no PCO, bloqueio do MATA110, execução de job). Nenhum caso é integralmente executável só pelo Fluig, o que impede marcar SIM com honestidade. Em compensação, **todos os 14 estão ancorados em pelo menos uma superfície do §5-B**, e em 6 deles (3031, 3206, 3312, 3416, 3443, 3488) a parte Fluig do roteiro foi **efetivamente executada** contra dados reais.
- **Sem superfície de front-end no Fluig — declarado explicitamente:** **1 caso** de forma total (**FSWTBC-3153** — o valor de `A2_XPREST`/`A2_XHPREST` e o preenchimento dos dados bancários na implantação da NF não são observáveis em nenhuma tela do Fluig) e **4 casos** de forma parcial, com a parte inobservável nomeada: **FSWTBC-3108** (apontamento de RPO e timeout do serviço REST), **FSWTBC-3116** (campo de cronograma financeiro na CNA), **FSWTBC-3312** (`CNA_XULMED` / `CNA_XPRMED`) e **FSWTBC-3443** (MSGETDAD, lançamentos do PCO, regra P002).

## Bloqueios encontrados
1. **Sem credencial Protheus** — atinge os 14 itens no desfecho.
2. **§5-C, matrícula de comprador** — o Portal do Comprador abriu só com *Acesso Rápido* e erro de console `Erro ao buscar as informações do colaborador na lista de usuários do ERP Protheus. Error: Error: Comprador não encontrado.` Bloqueia a família cotação/negociação/alçada (2946, 2988, 3361).
3. **Massa de tarefas restrita** — as 10 pendências da Central de Tarefas são todas de SC, nas atividades *Correção* e *Validação do Gestor*. **Não há** tarefa em *Aprovação de Alçadas*, *Validação Orçamentária*, *Realizar Medição do Contrato* nem de cadastro de fornecedor. Atinge 2914, 3108, 3116, 3152, 3153, 3361, 3488.
4. **Proibição de mexer em registro alheio** — a massa existe (79 SCs e 126 faturamentos abertos), mas sob outros responsáveis; nenhum foi movimentado, aprovado ou cancelado.
5. **Proibição de rodar batch/schedule** — impede executar os jobs `UGCTE016/017/018` (3312).
6. **Sem credencial de fornecedor, gestor ou administrador** — impede o auto-cadastro real (3152) e a validação orçamentária pelo substituto (3488).

## Divergências entre ticket e tela de hoje
1. **Os dois rótulos de retorno de integração coexistem, em telas diferentes** — `Retorno Integração` na **SC** (`form_sc.html`) e `Erro retornado pelo ERP Protheus` na **Cotação** (`form_cot.html`). A linha da tabela do briefing que manda substituir um pelo outro só vale para a SC. *(Confirma a atualização feita no §5-B durante esta execução.)*
2. **`Aprovação de Alçadas` (plural)** na coluna *Atividade Atual* do Tracker × **`Aprovação de Alçada`** (singular) no título do painel do formulário.
3. **`Valor da Compra (R$)` e `Valor da Compras (R$)` coexistem no mesmo formulário** — confirmado nos 76 rótulos únicos da SC 112830.
4. **A visão `Aprovadores SC` do Tracker não tem coluna de aprovador de alçada** — só Gestor, Comprador e Item Orçamentário. O Tracker não responde à pergunta central de FSWTBC-2914.
5. **A filial continua ausente ao lado dos produtos** na grade `tbProdutos` do formulário renderizado hoje, embora FSWTBC-3429 conste como corrigido.
6. **`Média Histórica` e `Valor fixo` não têm máscara monetária alguma**, e `handleMaskMoneyFields()` nem sequer roda nos estados de digitação (0, 6, 11) — que é exatamente quando a queixa original aparece.
7. **`solCentralizadora` é hidden e sem `<label>`** — não há rótulo em tela indicando que a SC é centralizadora.
8. **Os endpoints `/solicitacao/manutencao` e `/solicitacao/centralizar` não existem em nenhum fonte publicado do Fluig**; a centralização roda por dataset (`ds_postStartProcess`, `ds_postFinalizaSolicCompra`).
9. **`dsProtheus_getFornecedoresCompras_restGetAll` e `dsSync_executeMedicaoAutomatica` não existem no front-end publicado** — ambos são server-side, contrariando a leitura de que seriam verificáveis pelo navegador.
10. **O filtro de contrato tem id diferente por visão do Tracker** (`nrContratoSC` na SC, `numContrato` na FC); usar o errado devolve todos os registros **sem aviso**.
11. **A regra anti-acentuação existe só no auto-cadastro público**, não no formulário interno 256830 — a atividade de correção pode reintroduzir o caractere que originou o defeito.
12. **Rótulos de fornecedor divergem entre as duas telas**: `Razão Social *` / `Nome de Fantasia *` (público) × `Razão social *` / `Nome Fantasia *` (interno).

## Falha silenciosa — o padrão confirmado neste lote
Em linha com o alerta do briefing, e todos lidos no fonte publicado:
- **Rateio ≠ 100% passa no Salvar**: `sc_App_App.js:290,299,311,316` só faz `console.error`; apenas o *Enviar* barra.
- **Sem validação de rateio por linha**: `500` + `-400` somam 100 e passam; o clamp de negativo no `blur` é **código morto**, e o caminho de **importação CSV** não checa negativo.
- **Guarda truthy** `if ($(ox).val())` (`sc_App_ViewHandler.js:1798`, `:1845`) faz a linha vazia ser pulada da soma em vez de reprovada.
- **Resolução do gestor orçamentário engolida em três camadas**, sem nenhum toast.
- **Grade de itens da medição pode ficar vazia sem mensagem** por dois caminhos console-only (`js/fat_App_EventHandler.js:1404`, `:1499`).
- **Toast comentado em caminho de erro**: `l012_resources_js_wAcompanhaContratos_pt_BR.js:2370-2375` — a SC é criada, a transferência falha, o modal fecha como se tivesse dado certo.
- **SC criada sem rateio e sem aviso**: `console.warn('[rateio] Nenhum CNZ retornado para contrato ... - SC será criada sem rateio.')` (mesmo arquivo, `:2039`).
- **O Tracker sem filtro não renderiza grade nem mensagem.**
- **Transliteração de Razão Social/Nome Fantasia é silenciosa** e mais agressiva que o declarado (remove também `.`, `-`, `/`, `&`, `,`).

## Instabilidade de ambiente observada (não é defeito)
- O Portal de Acompanhamento de Contratos devolveu `Nenhum registro encontrado` numa execução e os **845 contratos** minutos depois, sem qualquer mensagem de erro.
- Erros HTTP recorrentes e inócuos: `403` em `/nps/api/v1/surveys` e `404` em `/style-guide/css/fluig-style-guide.min.css`.

## Nota de conduta
Nenhum registro pré-existente foi criado, alterado, aprovado, atribuído ou cancelado. Nenhum formulário foi submetido. Nenhuma rotina batch, schedule ou apropriação foi executada. Nenhuma senha foi impressa em qualquer saída. Todo o trabalho no worktree foi de **leitura**.

## CT-FSWTBC-3590  (protheus · Concluído · SDCASSI-183)

**Título:** Integrar documentos de pagamento e localizá-los no Protheus na primeira tentativa, com o retorno da integração identificando a thread

**Origem:** FSWTBC-3590 / incidente 793234 — Segunda reincidência da família SDCASSI-80 → 147 → 183: quatro documentos (164983822, 164984079, 164984261, 164984501) responderam como integrados e não existiam no Protheus; reenviados, integraram. Achado: a tabela **CV8** (log de integração) com "muitos registros, o que trava as consultas". Correção (16/01/2026): devolver o **número da thread** no retorno para identificar rollback do TCloud — o `\nThread:` quebrou o consumidor (`Expected BEGIN_OBJECT but was BEGIN_ARRAY`) e exigiu três patches até 03/02. A causa (CV8 sobrecarregada, rollbacks) **não foi tratada**.

**Módulo/Rota:** Fluig · **Logs Protheus** (`/portal/p/1/portal_logs_protheus`) → aba **Erros CV8** (colunas *Filial, Data, Hora, Usuario, Mensagem, Detalhes, Processo, Tipo Ocor., Sub Processo, ID Movtos*; filtros *Filial*, *Data inicial/final*, *Mensagem, detalhe ou processo*; botão *Consultar*). Protheus: consulta do documento de entrada/título gerado (SIGACOM/SIGAFIN — a confirmar) e o serviço REST de integração de documentos (`apiRESTProtheus_CASSI`).

**Pré-condições**
- Um lote de documentos de pagamento `QA` enviado pela integração web da CASSI (o remetente é o time de integração do cliente — o Fluig **não** origina esses documentos).
- Acesso ao retorno bruto da API (o consumidor precisa capturar o corpo da resposta).
- **Bloqueio:** o envio depende da integração web da CASSI; a leitura no Protheus depende de credencial (não há). No Fluig, a aba *Erros CV8* é a superfície — hoje seu `genericQuery` responde **404** (ambiente).

**Passos**
1. Enviar o lote `QA` pela integração e guardar, para cada documento, o corpo da resposta.
2. Conferir no corpo da resposta: (a) é JSON válido, parseável pelo consumidor; (b) contém o identificador de thread no campo/formato acordado em 03/02/2026 (não como texto solto `\nThread:` dentro da mensagem).
3. Logs Protheus → *Erros CV8* → filtrar pela data e por "documento"/número do documento em *Mensagem, detalhe ou processo* → *Consultar*.
4. Para cada documento respondido como sucesso, confirmar no Protheus que o documento existe (consulta do documento de entrada/título) — quando houver credencial.
5. Reenviar propositalmente um documento já integrado e ler a resposta.

**Resultado esperado**
- Documento respondido como integrado **existe** no Protheus na primeira tentativa; a CV8 não registra erro para ele.
- A resposta é JSON válido com o número da thread em campo próprio; nenhum `BEGIN_OBJECT/BEGIN_ARRAY` no consumidor.
- Reenvio de documento já integrado é recusado como duplicado (não gera segundo documento).
- Quando o TCloud desfizer a transação, a CV8 tem registro com a thread, permitindo correlacionar.

**Resultado se o defeito reincidir**
- Retorno de sucesso e documento ausente no Protheus; reenvio integra "normalmente" (duplicidade potencial). Ou retorno malformado (`\nThread:`) derrubando o parser do consumidor.

**Severidade:** Alta *(pagamento não integrado com resposta de sucesso; risco de duplicidade no reenvio)*

**Preparação de massa:** documentos `QA` gerados pelo time de integração da CASSI em homologação; volume da CV8 aferido antes (o ticket aponta a tabela cheia como gatilho — sem expurgo, o teste reproduz a condição de produção).

**Verificado em tela:** PARCIAL
**O que foi verificado:** o widget Logs Protheus abre com as três abas e os filtros acima; a aba *Erros CV8* dispara `GET /java_generico_protheus/tbc/api/framework/v1/genericQuery?...tables=CV8` que respondeu **404** — a grade fica vazia ("0 tabelas, 0 linhas"), e o widget não mostra estado de erro (achado A11-b). Colunas confirmadas pelo fonte publicado `CV8Controller`. Nenhum documento enviado.
**Divergências encontradas:** a mensagem "Mensagem, detalhe ou processo" é o único filtro textual — não há filtro por número de documento; a correlação com os documentos do ticket depende de a mensagem da CV8 carregar o número.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4156  (ambos · Concluído · SDCASSI-31)

**Título:** Medir, pelo Fluig, a latência da fila de Compras entre a gravação e o retorno do Protheus, e confirmar que dois processos de filiais diferentes não se bloqueiam.

**Origem:** FSWTBC-4156 — lentidão do JOB do NFC. Análise achou `nTimeout = 1` segundo no lock do
UCOME036 (60 s comentado, "descomentar depois dos testes"), `Sleep(3000)` incondicional no envio ao
Fluig (até 9 s por registro) e `LockByName` global entre filiais. Encerrado "Não vai ser feito" sem
nenhuma das quatro recomendações aplicadas.

**Módulo/Rota:** **Logs Protheus** (`/portal/p/1/portal_logs_protheus`) → aba **Solicitacoes ZZY**
(colunas **Data / Hora** × **Data Integ / Hora Integ** × **Dt.Atu.Fluig / Hr.Atu.Fluig**,
**Qtd T.Env Fl**, **Status Proth / Status Fluig**) · aba **Histórico** da SC (*"Integração executada
com sucesso - Tempo de Execução N s"*).

**Pré-condições**
- Duas SCs próprias, em **filiais diferentes**, movimentadas para a mesma etapa de integração
  (ex.: ambas aprovadas na Validação do Gestor no mesmo minuto).
- `genericQuery` do widget respondendo (hoje 404).
- **Bloqueio:** o valor de `nTimeout`, o `Sleep` e o escopo do lock só se verificam no fonte Protheus —
  o Fluig mostra o **efeito** (latência e retries), não a causa.

**Passos**
1. Aprovar as duas SCs com diferença inferior a 1 minuto.
2. Em **Solicitacoes ZZY**, filtrar por **Chave** de cada SC; anotar **Data/Hora** (recepção),
   **Data Integ/Hora Integ** (processamento) e **Dt.Atu.Fluig/Hr.Atu.Fluig** (retorno).
3. Ler **Qtd T.Env Fl** de cada registro.
4. Nos dois Históricos, ler o *Tempo de Execução* da integração.
5. Repetir com 5 SCs em sequência na mesma filial.

**Resultado esperado**
- Passo 2: latência recepção → retorno **≤ 2 minutos** por registro (limite aceito no FSWTBC-3749, "só
  em homologação"); as duas filiais processam **em paralelo** — a segunda não espera a primeira.
- Passo 3: `Qtd T.Env Fl` = **1** no caminho feliz (sem retry).
- Passo 5: o tempo total cresce **linearmente** e sem registros presos em **Status Proth = N**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Registros ficam em `status='N'` indefinidamente (lock de 1 s abortando); latência de ≥ 9 s só no envio
  ao Fluig; filiais distintas serializadas pelo lock global.

**Severidade:** Alta

**Preparação de massa:** duas SCs em filiais diferentes, do executor, com prefixo `QA`, aprovadas por
gestor cooperante.

**Verificado em tela:** PARCIAL
**O que foi verificado:** widget aberto com as três abas e, no fonte publicado do `ZZYController`, as
colunas literais **Data / Hora / Status Proth / Status Fluig / Data Integ / Hora Integ / Dt.Atu.Fluig /
Hr.Atu.Fluig / Qtd T.Env Fl** (`zzy_qdenfl`). **Consultar** → `404 /java_generico_protheus/.../genericQuery`
(ambiente). Medi, na SC 113267 criada hoje pela conta de QA, **"Grava SC e Anexos" em 3 min 12 s**
(09:40:02 → 09:43:14) — referência de latência atual da 1ª integração.
**Divergências encontradas:** (1) o ticket não tem descrição — o caso é de **caracterização de
latência**; (2) 3 min 12 s numa `TASK_SERVICE` de gravação já ultrapassa o limite de 2 min do 3749;
(3) o widget trava em *"Consultando logs..."* quando a consulta falha (A11-b) — não dá para separar
"fila vazia" de "widget quebrado".
**Dados/massa usados:** SC 113267 (leitura de atividades).

---

## CT-FSWTBC-4263  (ambos · Concluído · SDCASSI-272)

**Título:** A etapa que espera o retorno do ERP após a geração do pedido/contrato aparece no histórico como "Verificar retorno Protheus"

**Origem:** FSWTBC-4263 — renomear a etapa "Verificar Trava Orçamentária" para "Verificar retorno Protheus", porque ela verifica qualquer retorno do Protheus e o nome antigo induzia a interpretar erro de outro tipo como trava orçamentária. Homologado 02/04/2026.

**Módulo/Rota:** *Processos › Solicitação de Compras* › instância › **Histórico** / fluxograma; Tracker › *Solicitação de Compras* coluna de etapa; Central de Tarefas.

**Pré-condições**
- Qualquer SC que já tenha passado por *Aguarda Geração do Pedido/Contrato* (323) — há 13 instâncias v95 e 4 v97 nesse trecho.
- **Bloqueio:** nenhum.

**Passos**
1. No Tracker, selecione *Solicitação de Compras*, status **Finalizados**, **Pesquisar Registro**, e abra uma SC que gerou pedido/contrato.
2. Abra a instância (`pageworkflowview`) e a aba de **histórico**; localize a movimentação após *Pedido/Contrato foi Gerado?* (87).
3. Leia o nome da etapa exibido para a sequência **317**.
4. Repita a leitura nas listas onde o nome da etapa aparece (Tracker, Central de Tarefas, e-mail de notificação, se houver).

**Resultado esperado**
- A etapa 317 é exibida como **"Verificar retorno Protheus"** em todas as superfícies.
- Não existe mais nenhuma ocorrência de "Verificar Trava Orçamentária" em instância nova.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Etapa rotulada "Verificar Trava Orçamentária" recebendo erros que não são de orçamento (ex.: *"Valor atribuido difere da lista de valores validos (Tp. Doc.)"*, FSWTBC-4213).

**Severidade:** Baixa — apresentação; reduz erro de diagnóstico.

**Preparação de massa:** nenhuma — usar instância finalizada existente, somente leitura.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *confirmado por dado* (API `activities`, 3.200 movimentos) — sequência **317 = "Verificar retorno Protheus"** nas versões **95 e 97**; **zero** ocorrências de "Verificar Trava Orçamentária". Não foi aberta a tela de histórico de uma instância (não visto renderizado).
**Divergências encontradas:** nenhuma no nome. Observação: na v98 (atual, 195 inícios lidos) ainda **não há movimento** na 317 — as instâncias v98 não chegaram a esse trecho; o nome na v98 fica a confirmar quando a primeira chegar. O ticket cita DEM10013706/DEM10013738 sem confirmação de aplicação — não verificável aqui.
**Dados/massa usados:** nenhum — leitura por API.

---

## CT-FSWTBC-4358  (ambos · Concluído · SDCASSI-370)

**Título:** Acompanhar na aba "Solicitacoes ZZY" um item de fila com payload inválido e vê-lo marcado como Erro com mensagem — nunca parado em "Não processado" sem explicação.

**Origem:** FSWTBC-4358 — item da fila ZZY com erro de JSON **não mudava o status para E** e ficava em **N**,
"gerando a falsa sensação que o schedule não estava funcionando". Homologado 23/04/2026.

**Módulo/Rota:** Fluig → **Logs Protheus** (`/portal/p/1/portal_logs_protheus`) → aba **Solicitacoes ZZY**
(filtros *Id Fluig / Filial / Data inicial / Data final / Texto*, botão **Consultar**, coluna `Qtd T.Env Fl`) ·
**Tracker** (Atividade Atual) · aba **Histórico** da SC.

**Pré-condições**
- Uma SC recém-enviada ao ERP (qualquer SC do executor, com `QA` na justificativa) para ter registro na ZZY.
- Para o cenário negativo, um item de fila com JSON inválido — **só o Protheus consegue produzi-lo**.
- **Bloqueio:** hoje o `genericQuery` das abas responde **404** (ambiente); e não há como injetar payload inválido
  pelo Fluig. Executável quando a fila voltar; o cenário negativo depende do time Protheus.

**Passos**
1. Abrir **Logs Protheus** → aba **Solicitacoes ZZY**; informar *Id Fluig* = nº do processo da SC e **Consultar**.
2. Ler status e `Qtd T.Env Fl` do registro. Repetir após 5 min.
3. Cruzar com o **Tracker** (*Atividade Atual*) e com a aba **Histórico** do processo.
4. *(Com o time Protheus)* provocar um item com JSON inválido para outra SC e repetir 1–3.

**Resultado esperado**
- Item saudável: sai de "Não processado" em minutos; o Histórico registra `Integração executada com sucesso`.
- Item com payload inválido: status **E (Erro)** com **mensagem preenchida** já na primeira passagem do schedule;
  o Tracker/Histórico mostram o processo desviado para *Correção* com o erro legível.
- Nunca: item em **N** por mais de um ciclo do schedule sem mensagem.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Registro permanecia em **N**, sem mensagem, indistinguível de "schedule parado" — investigações abertas no
  lugar errado (SDCASSI-286, 288, 300, 309).

**Severidade:** Média *(observabilidade da fila; o efeito é diagnóstico errado e processo parado)*

**Preparação de massa:** SC criada pelo executor; o item inválido precisa ser gerado pelo time Protheus
(não é possível pelo portal).

**Verificado em tela:** PARCIAL
**O que foi verificado:** widget aberto com título **Logs Protheus**, abas **Erros CV8 / Solicitacoes ZZY /
Medicoes ZZZ**, botão **Consultar**, filtros por id/filial/datas/texto e paginação 10/25/50/100. A consulta da
CV8 respondeu **404** (`java_generico_protheus/.../genericQuery?tables=CV8`) — ambiente. Fila real: SC
113196 falhou **antes** da ZZY (no Fluig, `NaN` na servicetask233), o que mostra que há falhas que nunca chegam
à fila e só aparecem no Histórico.
**Divergências encontradas:** a ferramenta de diagnóstico da fila está indisponível (A16/A11-b); paginação do
widget são stubs (A11-b).
**Dados/massa usados:** nenhum — só leitura.

---

## CT-FSWTBC-4456  (ambos · Concluído · SDCASSI-388)

**Título:** Ver uma SC validada pelo comprador sair de "Aguarda Geração da Cotação" em minutos, com o Nº da Cotação ERP preenchido.

**Origem:** FSWTBC-4456 — processos travados em **"Aguarda Geração da Cotação"** (TST) por parâmetros inválidos
(`MV_XNFCFL2`, `TB_ENVSCHD` etc. — os 16 parâmetros do NFC, MIT010 pp. 38–39). Homologado 29/04/2026. Risco
declarado: repetir a parametrização em produção.

**Módulo/Rota:** Fluig → **Tracker** (*Filtrar por* = Solicitação de Compras, Status = Abertos, colunas
**Atividade Atual** e **Nº da Cotação ERP**) · *Detalhes da Solicitação* → **Histórico** · **Portal do
Comprador → Controle De Cotações** · **Logs Protheus → Solicitacoes ZZY**.

**Pré-condições**
- Uma SC do executor que já passou por *Validação do Comprador* (atividade 119) sem dispensa de cotação.
- Usuário comprador para a validação; Protheus e schedule `UCOME036` no ar.
- **Bloqueio:** os parâmetros só são conferíveis no Protheus (sem credencial); a conta de QA não é comprador.
  O caso mede o **efeito** (tempo de permanência na 328), não a causa.

**Passos**
1. No **Tracker**, filtrar Solicitação de Compras / Abertos e **Pesquisar Registro**; anotar processos com
   *Atividade Atual* = **Aguarda Geração da Cotação** e a hora de entrada (Histórico).
2. Abrir cada um e ler o **Histórico**: última entrada e horário.
3. Aguardar 10 min e repetir o passo 1.
4. Para um processo que saiu, conferir **Nº da Cotação ERP** no Tracker/Formulário e a cotação em **Controle
   De Cotações**.
5. Para um processo que **não** saiu, abrir **Logs Protheus → Solicitacoes ZZY** com o *Id Fluig* e ler status
   e `Qtd T.Env Fl`.

**Resultado esperado**
- Nenhum processo permanece em **Aguarda Geração da Cotação** por mais de um ciclo do schedule (minutos).
- Ao sair, **Nº da Cotação ERP** está preenchido e a cotação aparece no Portal do Comprador.
- Se a fila falhar, o registro ZZY mostra status de erro com mensagem — não "Não processado" indefinido.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SCs paradas em "Aguarda Geração da Cotação" por dias, sem mensagem, com a fila sem workers
  (`TB_ENVSCHD` apontando para ambiente errado).

**Severidade:** Média *(trava o fluxo de compras na origem; sem perda de dado)*

**Preparação de massa:** SC `QA` levada até a Validação do Comprador por um comprador real.

**Verificado em tela:** PARCIAL
**O que foi verificado:** Tracker consultado com *Filtrar por* = Solicitação de Compras e Status = Abertos: grade
`table-sc` com **Atividade Atual**, **Nº da Solicitação ERP**, **Nº da Cotação ERP**; primeira página com
*Aguarda Finalizar Cotação* (5, ex. 111943 / SC ERP `000094`), *Validação Orçamentária* (2), *Aprovação de
Alçadas* (2), *Validação do Comprador* (1). A atividade **328 "Aguarda Geração da Cotação"** consta no mapa por
dado do L027 (6.000 movimentos). Widget Logs Protheus aberto (aba ZZY existe; consulta 404 hoje).
**Divergências encontradas:** o mapa da SC tem duas esperas com nomes parecidos — **Aguarda Geração da Cotação
(328)** e **Aguarda Finalizar Cotação** (visível hoje) — o ticket cita só a primeira; o executor precisa ler o
nome exato. "Aguarda Movimentação Protheus" existe só na Cotação (seq 42), não na SC.
**Dados/massa usados:** nenhum — leitura do Tracker.

---

## CT-FSWTBC-4828  (ambos · Concluído · SDCASSI-473)

**Título:** Verificar que uma SC enviada avança das atividades automáticas de espera sem intervenção manual (fila de Compras consumida)

**Origem:** FSWTBC-4828 — processos não movimentavam na base DES, impedindo a homologação da DEM10015025; causa: **servidor de schedule parado** (reiniciado 2×). O ticket é de ambiente, mas o efeito é visível no Fluig: instâncias paradas em atividades de espera cuja saída depende da fila.

**Módulo/Rota:** Processos → *Solicitação de Compras* (`wf_solicitacao_compras`) → aba **Histórico**; Tracker → *Solicitação de Compras*; widget **Logs Protheus** → aba *Solicitacoes ZZY*

**Pré-condições**
- Usuário com permissão de iniciar SC (conta de QA serve).
- Um produto cadastrado no ERP para montar 1 item; rateio 100 % em 1 centro de custo.
- Referência de SLA: *Grava SC e Anexos* (233) leva **≤ 2 min** quando a fila está viva (A16 mediu 3 min 12 s em 04/09).
- **Bloqueio:** nenhum para as etapas até *Validação do Gestor*; as esperas **328 Aguarda Geração da Cotação / 309 Aguarda Geração Alçadas / 323 Aguarda Geração do Pedido/Contrato** só se alcançam com comprador/gestor — a conta de QA não tem.

**Passos**
1. Abrir *Solicitação de Compras*, clicar **Adicionar Produto**, preencher *Produto/Serviço*, *Quantidade* = 1, *Preço Unit. Estimado* = 10,00, *Observação* = `QA-4828 fila`; rateio 100 %.
2. Enviar e anotar o *Nº do Processo Fluig*.
3. Abrir a instância em modo detalhe → aba **Histórico**; cronometrar *Grava SC e Anexos* (233).
4. Abrir Tracker → *Solicitação de Compras* → filtrar por *Nº do Processo Fluig*; ler *Atividade Atual*, *Responsável Atual* e *Nº da Solicitação ERP*.
5. Abrir **Logs Protheus** → *Solicitacoes ZZY*, filtrar por *Chave* = nº da SC no ERP; ler *Status Fluig*, *Data Integ/Hora Integ* e *Qtd T.Env Fl*.
6. (Com perfil de comprador) repetir a leitura do Histórico quando a instância passar por **328 → 24 Cotação foi Gerada?** e **309 → 225 Alçada foi Gerada?**.

**Resultado esperado**
- Passo 3: *Grava SC e Anexos* conclui em ≤ 2 min e o Histórico traz *"Integração executada com sucesso - Tempo de Execução N s"*; a próxima atividade é **Validação do Gestor (7)** com responsável humano.
- Passo 4: *Nº da Solicitação ERP* preenchido (6 dígitos, ex.: `001194`), *Atividade Atual* ≠ *Correção*.
- Passo 5: registro ZZY com *Status Fluig* de sucesso e *Qtd T.Env Fl* = 1 (sem retentativa).
- Passo 6: cada espera automática é atravessada em minutos; nenhuma instância fica em 328/309/323 por mais de uma hora.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Instâncias estacionadas nas atividades de espera por dias, sem responsável humano e sem erro — "fila parada é indistinguível de 'não há nada a processar'" (texto do ticket); o print de 25/06 mostrava os processos parados.

**Severidade:** Alta

**Preparação de massa:** uma SC criada pelo próprio executor (prefixo `QA`); para os passos 6, um comprador que gere a cotação e a alçada. Nenhum registro pré-existente é tocado.

**Verificado em tela:** PARCIAL
**O que foi verificado:** mapa de atividades por dado (24 sequências da SC, entre elas *233 Grava SC e Anexos*, *328 Aguarda Geração da Cotação*, *309 Aguarda Geração Alçadas*, *323 Aguarda Geração do Pedido/Contrato*, *236/255 Correção*); Tracker *Solicitação de Compras* respondendo hoje com as colunas *Atividade Atual / Responsável Atual / Nº da Solicitação ERP*; formulário de SC aberto e preenchido até *Vlr. Total Estimado* sem enviar; widget Logs Protheus aberto — aba ZZY com filtros *Filial, Chave, Rotina, Status, Data inicial/final*.
**Divergências encontradas:** o widget Logs Protheus está **indisponível hoje** (genericQuery 404 → *"Nao foi possivel consultar o dataset de logs."*) — instabilidade de ambiente, não defeito; a única instância de SC ativa em espera/correção nos últimos 1.000 movimentos é a 113196 (*Correção*), ou seja, hoje não há SC parada em 328/309/323 para servir de evidência do sintoma.
**Dados/massa usados:** nenhum — não submetido; leitura de 113196/112830 e do Tracker.

---

## CT-FSWTBC-4854  (ambos · Concluído · SDCASSI-481)

**Título:** Aprovar a alçada de uma SC e confirmar que a integração pós-alçada conclui e dispara os e-mails

**Origem:** FSWTBC-4854 — o par "canônico" do 4852: THREAD ERROR HTTP 500 na integração pós-alçada impedia o processo de chegar à `servicetask185`; encerrado como "problema finalizado" sem diagnóstico.

**Módulo/Rota:** Central de Tarefas → *Solicitação de Compras* em **Aprovação de Alçadas (94)** → **287 Integração com ERP** → **185 Disparo de E-mails**; aba **Histórico**; Tracker → *Aprovadores SC*

**Pré-condições**
- SC com alçada gerada (*225 Alçada foi Gerada?* = Sim, *310 Gerar Grid de Alçada* concluída), executor como aprovador da grade.
- **Bloqueio:** a conta de QA não é aprovadora (§5-C).

**Passos**
1. Abrir a tarefa em *Aprovação de Alçadas*; na grade `tbAlcadas` (*Aprovador / Email do Aprovador / Aprovar?*), marcar *Aprovar?* = Sim e preencher *Justificativa* = `QA-4854`.
2. Enviar; abrir o **Histórico** e acompanhar 287.
3. Abrir Tracker → *Aprovadores SC* → filtrar pelo processo; ler as colunas de aprovação.
4. Verificar a caixa de e-mail do solicitante e do fornecedor vencedor.

**Resultado esperado**
- Passo 2: 287 conclui com *"Integração executada com sucesso - Tempo de Execução N s"* em minutos; sequência **96 → 323 → 87 Pedido/Contrato foi Gerado? → 185 Disparo de E-mails → 339 Contrato? → 115 Fim**.
- Passo 3: Tracker *Aprovadores SC* mostra *Status* = Finalizado e as datas/horas de aprovação preenchidas.
- Passo 4: **um** e-mail por destinatário (não dois — SDCASSI-448).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- *Falha na Integração, code 500, Internal Server Error, THREAD ERROR ([5816]…)* em 287; processo nunca chega a 185; print `95449_TST.png`.

**Severidade:** Alta

**Preparação de massa:** SC `QA-4854` conduzida até a alçada por comprador; aprovador disponível.

**Verificado em tela:** PARCIAL
**O que foi verificado:** Tracker *Aprovadores SC* para **99257**: *Status* Finalizado, *Atividade Atual* "Fim - Processo de Pagamento…", *Aprovador Comprador* Fabio Garcia do Nascimento (08/06 12:06), *Aprovador Item Orçamentário* Janaina Rodrigues Cardoso (01/06 10:14:47); cadeia 310 → 94 → 287 → 96 → 323 → 87 → **185 Disparo de E-mails** confirmada por dado no 99257 (03/07). Rótulos da grade lidos no fonte publicado.
**Divergências encontradas:** o Tracker *Aprovadores SC* **não tem coluna para o aprovador de alçada** (só Gestor, Comprador e Item Orçamentário) — a aprovação de alçada é legível apenas no formulário (`tbAlcadas`) e no Histórico. Ver também a divergência do nº 95449 no CT-4852.
**Dados/massa usados:** leitura de 99257 — nada aprovado.

---

## CT-FSWTBC-4941  (ambos · Concluído · SDCASSI-492)

**Título:** Informar rateio de centro de custo na SC e confirmar que ele chega íntegro ao Tracker e à SC do ERP

**Origem:** FSWTBC-4941 — o rateio informado na abertura da SC não foi transportado para o pedido de compra; investigação inviabilizada por log indisponível; cliente lançou o rateio direto no pedido e encerrou.

**Módulo/Rota:** *Solicitação de Compras* → item da grade de produtos → rateio (`tbprod_jsonrateio`; botões **Download Planilha de Rateio Modelo** / **Upload Planilha de Rateio Preenchida**); Tracker → **Produtos/Rateio SC** (`table-scd`: *Item, **Rateio %**, **C. Custo**, **Classe Valor***); payload `POST …/wf_solicitacao_compras/start` (técnica `captura-payload`)

**Pré-condições**
- Produto e dois centros de custo válidos; classe de valor e conta contábil do item.
- **Bloqueio:** o efeito final (rateio no **pedido**, SC7/SCH) só é legível no Protheus; no Fluig chega-se até a SC gravada no ERP e ao Tracker.

**Passos**
1. Abrir *Solicitação de Compras*, **Adicionar Produto**, preencher item; informar rateio **60 % / 40 %** em dois centros de custo (pela planilha de rateio ou pela grade).
2. Antes de enviar, capturar o payload de `/start` e ler o rateio do item (`___1`).
3. Enviar; abrir Tracker → *Produtos/Rateio SC* → filtrar pelo processo.
4. (Comprador) seguir até *Aguarda Geração do Pedido/Contrato (323)* → *Pedido/Contrato foi Gerado?* (87).
5. (Protheus) Compras → *Pedidos de Compra* → item → rateio (SCH): comparar percentuais e centros de custo.

**Resultado esperado**
- Passo 2: o payload traz as duas linhas de rateio com 60 e 40, somando 100.
- Passo 3: duas linhas para o item no Tracker, *Rateio %* = 60 e 40, *C. Custo* e *Classe Valor* preenchidos.
- Passo 5: o pedido reproduz o mesmo rateio (percentual, centro de custo, classe de valor); nada em branco.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Pedido gerado **sem** o rateio da SC (rateio em branco no ERP), obrigando lançamento manual.

**Severidade:** Alta

**Preparação de massa:** SC `QA-4941` do executor com rateio em 2 centros de custo; comprador para gerar cotação/pedido. Sem Protheus, o passo 5 fica registrado como pendente.

**Verificado em tela:** PARCIAL
**O que foi verificado:** Tracker *Produtos/Rateio SC* respondeu hoje para **112830** com **10 linhas** (uma por item), *Rateio % = 100*, *C. Custo = AS00 - PLANOS DE ASSOCIADO*, *Classe Valor = 7003 - IMOBILIZADO CORRENT…*, *Nº da Solicitação ERP = 001194*; formulário em branco com os botões **Download Planilha de Rateio Modelo** e **Upload Planilha de Rateio Preenchida** e o campo `tbprod_jsonrateio` por item; `dsFluig_getRateioSC` existe (GET search 200).
**Divergências encontradas:** o rateio **de mais de um centro de custo** não pôde ser exercitado sem submeter; o transporte até o **pedido** não tem superfície no Fluig (A1: o botão *Ver rateio da SC* da Cotação/Negociação não está no HTML publicado).
**Dados/massa usados:** leitura de 112830 — nada submetido.

---

## CT-FSWTBC-5197  (ambos · Concluído · SDCASSI-554)

**Título:** Aprovar uma SC com cotação encerrada e ver o pedido de compras gerado no ERP e refletido na SC do Fluig

**Origem:** FSWTBC-5197 — SC 106121 (filial 3301) aprovada em 14/08 não gerou pedido e ficou em *Aguarda Geração do Pedido/Contrato*; a thread do schedule (`U_UCOME036 → GERADOCUMENTO → … → GetNumSC7/ChkNumSC7`) ficou ~114 h em laço ocupado porque a numeração SXE do `C7_NUM` da filial passou a gerar número de um só caractere e, com `MV_PCFILEN` desligado, o `dbSeek` por chave parcial casa por prefixo e nunca acha número livre; `DHV_SALDO` zerado por leitura suja da transação aberta. Cliente normalizou a numeração em 31/08 e o pedido saiu. Pendência técnica aberta: blindar o `UCOME036` (StartJob + guarda de tempo).

**Módulo/Rota:** Fluig: *Central de Tarefas* → processo **Solicitação de Compras** → aba *Histórico* / campo **Nº Pedido** (`_numPedido`) do formulário; *Tracker* → *Solicitação de Compras*; widget **Logs Protheus** → aba *Erros CV8*. Protheus: **Compras** — `SIGACOM` → *Atualizações* → *Pedidos de Compra* (`MATA121`), *Configurador* → numeração sequencial (SXE/SX6: `MV_PCFILEN`, `MV_PCMDNUM`), monitor de schedule.

**Pré-condições**
- SC do tipo *Pedido* com cotação encerrada e proposta vencedora definida, aprovada em todas as alçadas, aguardando o `geraDocumento` do schedule.
- Filial da SC com a numeração do `C7_NUM` (SXE) íntegra — o próprio ticket mostra que a numeração "perdida" da filial 3301 é a causa; para regressão, o executor precisa de uma filial cujo próximo número seja conhecido.
- Acesso ao Protheus (Compras + Configurador) e ao log do ambiente `SCHEDULE`.
- **Bloqueio:** sem credencial Protheus; a conta de QA (TOTVS-FS) não resolve matrícula de comprador, então não conduz a SC até a aprovação; a SC 106121 já está `CANCELED` neste tenant (não serve como massa viva).

**Passos**
1. No Protheus (Compras), anote o **próximo número de pedido** da filial (Configurador → numeração do `C7_NUM`) e confirme que ele tem o tamanho padrão (6 caracteres), não um único caractere.
2. No Fluig, conduza uma SC de *Pedido* da filial até a aprovação final (após *Aprovação de Alçadas*, seq. 94) e deixe-a chegar em **Aguarda Geração do Pedido/Contrato**.
3. Aguarde a execução do schedule (`U_UCOME036`, rotina `GERADOCUMENTO`). Cronometre.
4. No Fluig, abra a SC pela *Central de Tarefas* (ou pelo *Tracker* → *Solicitação de Compras*, filtrando pelo nº do processo) e leia o campo **Nº Pedido** e o **Histórico**.
5. No widget **Logs Protheus** → *Erros CV8*, filtre por *Id Fluig* = nº do processo e leia as linhas do processamento (`Processando` / `Fim`).
6. No Protheus, abra `MATA121` e localize o pedido pelo número lido no passo 4; confira que `DHV_SALDO` do item da cotação não está zerado indevidamente e que não há registro bloqueado.
7. (Regressão da blindagem) Com o pedido gerado, confira no log do `SCHEDULE` que a thread do `GERADOCUMENTO` terminou em tempo compatível com o SLA da fila (minutos, não horas) e não há instrução `TC_Eof - NO CONNECTION`.

**Resultado esperado**
- A SC sai de *Aguarda Geração do Pedido/Contrato* em minutos; o campo **Nº Pedido** da SC é preenchido com o número gerado na SXE (6 caracteres) e o Histórico registra `Integração executada com sucesso`.
- Na CV8 aparece o registro de **Fim** do processamento, não só o de início.
- No Protheus o pedido existe em `MATA121` com o número esperado; `DHV_SALDO` reflete o saldo real.
- Uma única execução do schedule; a thread não permanece viva por horas.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC parada em *Aguarda Geração do Pedido/Contrato* por dias (17 dias no ticket); CV8 só com o registro inicial (`Processando`), dez execuções sem `Fim`.
- `DHV_SALDO` zerado e registro DHV "bloqueado pelo schedule"; ao ajustar manualmente, volta a zerar.
- Log do schedule com a thread viva ~114 h (~37 mil instruções/s) terminando em `TC_Eof - NO CONNECTION`; pilha `GetNumSC7 → ChkChaveSC7 → ChkNumSC7`.

**Severidade:** Alta *(bloqueia geração de pedido, prende a fila da unidade inteira e compromete saldo — risco financeiro)*

**Preparação de massa:** uma SC de *Pedido* aprovada, numa filial com numeração `C7_NUM` íntegra, conduzida por comprador real (a conta de QA não chega lá). Para reproduzir o cenário de causa (opcional, só em base de teste): ajustar a SXE do `C7_NUM` da filial para um número de um caractere já usado como prefixo e observar o laço — **não fazer em produção**. Acesso ao log do ambiente `SCHEDULE`.

**Verificado em tela:** PARCIAL
**O que foi verificado:** SC 106121 existe neste tenant (`GET /requests/106121/tasks` → v77, `CANCELED` em 14/08/2026 10:30, 23 tarefas, última *Aguarda Finalizar Cotação* 161 `NOT_COMPLETED` com `admin`); no Tracker → *Solicitação de Compras*: `Status=CANCELADA`, `Nº da Solicitação ERP=000060`, `Nº da Cotação ERP=000034`, `Código da Filial=3301` — a filial bate com o ticket. Formulário 256831 publicado tem o campo **"Nº Pedido"** (`_numPedido`) e `_pedidoContratoGerado`, e o rótulo **"Retorno Integração"**. Widget *Logs Protheus* com aba *Erros CV8* existe (rota `/portal/p/1/portal_logs_protheus`), mas o `genericQuery` responde 404 hoje.
**Divergências encontradas:** a atividade *Aguarda Geração do Pedido/Contrato* citada no ticket **não aparece nas 23 tarefas da 106121 neste tenant** — a instância daqui parou em *Aguarda Finalizar Cotação* (161) e foi cancelada em 14/08 (data em que o ticket diz que foi *aprovada*); ou seja, o nº 106121 do ticket é de produção e não corresponde a esta base. A CV8 do widget está indisponível (404 do `genericQuery`, ambiente).
**Dados/massa usados:** nenhum — não submetido; só leitura da 106121.

**Módulo ERP:** Compras

---
