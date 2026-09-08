<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# Parecer Tecnico

Casos de teste E2E do Fluig — módulo Parecer Tecnico.

| | |
|---|---|
| Casos neste arquivo | 17 |
| Verificados em tela | 0 total · 16 parcial · 0 não |

> **Como ler.** Cada caso descreve o comportamento **correto esperado hoje**. A maioria dos
> defeitos de origem já foi corrigida — o caso é de regressão: se reprovar, o defeito voltou.
> Os que reprovam hoje por causa nunca corrigida estão marcados no próprio caso.
> *Verificado em tela* diz o que foi conferido no ambiente de homologação em 08/09/2026;
> **PARCIAL** costuma significar que a conta de QA não tem o perfil necessário (comprador,
> gestor, fiscal, fornecedor), não que o caso seja inválido.

---

## CT-FSWTBC-2186  (fluig · Concluído · SDCASSI-27)

**Título:** A SC dispara os pareceres técnicos previstos e **todos** eles chegam ao parecerista com os anexos das propostas.

**Origem:** FSWTBC-2186 (SD768076) — a SC 34319 disparou **dois** formulários de parecer técnico
(processos 36648 e 36649); só o 36648 carregou o anexo, o 36649 não. Oitava ocorrência de defeito
no parecer técnico. O comentário final registra um efeito colateral **não desdobrado em ticket**:
*"a Geise passou que parou de carregar os gestores orçamentários após a atualização"*.

**Módulo/Rota:** *Solicitação de Compras* → **Identificação da(s) Áreas para Parecer Técnico** →
grade **Áreas para Emissão para Parecer Técnico** (`areasParecerTecnico`, 242) → subprocesso
*Parecer Técnico* (`wf_solicitacao_compras_parecer`, form `256832`, `emitirParecer` 5).

**Pré-condições**
- SC própria em **Validação do Comprador**, com cotação concluída e propostas recebidas **com anexo**.
- Ao menos **duas** áreas cadastradas na grade *Áreas para Emissão para Parecer Técnico*, para
  exercitar o cenário de múltiplas instâncias.
- **Bloqueio:** **sim.** Exige uma SC própria levada até a etapa de parecer, com propostas anexadas
  por fornecedor — e não há credencial de fornecedor. Nenhuma tarefa de parecer está atribuída à
  conta de QA.

**Passos**
1. Na SC, abrir a seção **Identificação da(s) Áreas para Parecer Técnico** e conferir a grade
   **Áreas para Emissão para Parecer Técnico** (colunas **# \***, **Área \***, **Responsável \***).
2. Cadastrar duas áreas distintas com responsáveis distintos e movimentar a SC.
3. Anotar os números dos processos de parecer gerados (campos `nrProcParecerSolic` e
   `nrProcParecerAreas` da SC) e conferir a quantidade contra o número de áreas cadastradas.
4. Abrir **cada** instância de parecer gerada.
5. Em cada uma, na seção **6. Conclusão**, conferir a grade `tbProposta` (colunas *Empresas*,
   *Não atende o solicitado \**, *A proposta possui pontos acima do solicitado \**,
   *Atende plenamente \**) e os botões de anexo por proposta.
6. Clicar em **Anexos** (seção *5. Parecer* → *Anexar tabelas e gráficos que subsidiem a análise*)
   e conferir a lista de anexos da cotação.
7. Voltar à SC e conferir os campos **Situação Par. Area Dem. \*** e **Situação Par. Areas \***.

**Resultado esperado**
- A quantidade de instâncias de parecer geradas é **exatamente** a prevista pelo desenho (parecer do
  solicitante + uma por área cadastrada) — nenhuma instância a mais, nenhuma órfã.
- **Todas** as instâncias carregam os anexos das propostas. Nenhuma exibe *"Sem Anexo para
  Proposta"* quando a proposta correspondente tem anexo.
- Nenhuma exibe *"Erro ao buscar as informações dos anexos das cotações. Por favor, tente
  novamente."* nem *"Não foi possível carregar as informações dos 'Anexos'."*
- Na SC, **Situação Par. Area Dem. \*** e **Situação Par. Areas \*** refletem o estado real de cada
  parecer.
- **Regressão citada no ticket, a verificar junto:** a seção **Validação do Item Orçamentário**
  continua carregando os gestores orçamentários (grade `tbitorc_*` populada, campo
  `itensSemGestOrcament` vazio).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Duas instâncias de parecer para a mesma SC, e **uma delas sem o anexo** — a 36649 do ticket abria
  sem o documento que a 36648 trazia.
- Efeito colateral registrado no ticket e nunca desdobrado: os **gestores orçamentários param de
  carregar** após a atualização.

**Severidade:** Alta *(decisão técnica de compra tomada sem o documento que a fundamenta; e a
regressão dos gestores orçamentários atinge a cadeia de aprovação)*

**Preparação de massa:** uma SC do executor com cotação encerrada e **ao menos duas propostas de
fornecedores diferentes, ambas com anexo**, e duas áreas cadastradas para parecer. Exige o Portal do
Fornecedor (sem credencial) ou que um comprador anexe as propostas. Quem prepara: comprador +
fornecedores de homologação.

**Verificado em tela:** PARCIAL
**O que foi verificado:** O formulário de Parecer Técnico (`256832`) abre e traz as seções
numeradas *1. Assunto* … *7. Aprovação do Parecer Técnico*, com **PARECER Nº:**, **Data:**,
**Nº da SC do Fluig**, **Nº da SC do ERP**, **Código da Filial**, **Nome da Filial**,
**Justificativa da Solicitação**, o botão **Ver rateio da SC**, o campo **Descreva as informações do
parecer técnico. \***, o botão **Anexos** e as grades `tbPNAProposta`, `tbPSProposta` e `tbProposta`
(esta com *Empresas*, *Não atende o solicitado \**, *A proposta possui pontos acima do solicitado \**,
*Atende plenamente \**). Na SC (`256831`), a seção **Identificação da(s) Áreas para Parecer
Técnico** existe com a grade **Áreas para Emissão para Parecer Técnico** (**# \***, **Área \***,
**Responsável \***). A mensagem *"Sem Anexo para Proposta"* está no `ViewHandler.js` do parecer
(linha 569), e as mensagens de erro de anexo em `DataHandler.js` (linhas 192–233) e
`EventHandler.js` (linhas 103–182).
**Divergências encontradas:** **sim, e muda a leitura do ticket.** A SC tem **dois** campos
distintos de instância de parecer — `nrProcParecerSolic` e `nrProcParecerAreas` — e **dois** campos
de status — **Situação Par. Area Dem. \*** e **Situação Par. Areas \*** (`statusParecerSolic` /
`statusParecerAreas`), além da grade de N áreas. Ou seja, **mais de uma instância de parecer por SC
é comportamento de desenho**, não duplicação. O ticket trata os processos 36648/36649 como
"duplicação do subprocesso"; pela tela de hoje, o defeito real é apenas **o anexo faltando em uma
das instâncias**. Recomendo confirmar esse ponto com quem atendeu o chamado antes de tratar
"duas instâncias" como sintoma.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2242  (fluig · Concluído)

**Título:** O parecerista aprova o parecer técnico e o envio conclui sem erro — caracterização do caminho de aprovação do parecer.

**Origem:** FSWTBC-2242 (SD769458) — *"Erro 'undefined' ao aprovar Parecer Técnico. nº 39747,
38726."* **Este item não tem descrição própria**: foi fechado no mesmo dia como duplicata
(*"duplicado correto 2243"*), registro criado por engano no fluxo interno enquanto o chamado do
cliente entrava pelo service desk. O campo `sdcassi` vem vazio e a evidência é "nenhuma". Escrito
aqui como **caracterização de caminho**, espelhando o CT-FSWTBC-2243, que é o registro correto do
mesmo defeito.

**Módulo/Rota:** *Parecer Técnico* (`/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras_parecer`,
form `256832`) → seção **7. Aprovação do Parecer Técnico** → atividade `emitirParecer` (5) →
`aprovadoParecer` (9).

**Pré-condições**
- Tarefa de *Parecer Técnico* atribuída ao executor, gerada por uma SC própria.
- **Bloqueio:** **sim.** Não há tarefa de parecer atribuída à conta de QA — as 11 tarefas a concluir
  estão em *Correção* e *Validação do Gestor*, e são de terceiros. Aprovar parecer de terceiro é
  vedado.

**Passos**
1. Abrir a tarefa de *Parecer Técnico* pela Central de Tarefas → aba **Tarefas a concluir**.
2. Conferir que o cabeçalho carrega **PARECER Nº:**, **Data:**, **Nº da SC do Fluig**,
   **Nº da SC do ERP**, **Código da Filial** e **Nome da Filial** — todos preenchidos, nenhum vazio.
3. Preencher **Descreva as informações do parecer técnico. \*** (seção *5. Parecer*).
4. Na grade da seção *6. Conclusão*, marcar, para cada empresa, uma das colunas
   **Não atende o solicitado \*** / **A proposta possui pontos acima do solicitado \*** /
   **Atende plenamente \***.
5. Na seção **7. Aprovação do Parecer Técnico**, conferir **Responsável \***,
   **Email do Responsável \***, **Data da Validação \*** e **Hora da Validação \*** preenchidos, e
   marcar **Emitir Parecer? \*** = **Aprovado**.
6. Clicar em **Enviar**.

**Resultado esperado**
- O envio conclui e a instância vai para `aprovadoParecer` (9).
- **Nenhuma** mensagem contendo a palavra `undefined` aparece, em tela ou no console.
- Todos os campos `readonly` do cabeçalho trazem valor real — nenhum exibe vazio, `undefined` ou `null`.
- A SC de origem passa a refletir o parecer em **Situação Par. Area Dem. \*** / **Situação Par. Areas \***.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Ao aprovar o parecer técnico, o sistema exibe erro **`undefined`** (a mensagem literal, sem texto
  útil) e a aprovação não conclui. Processos citados: **39747** e **38726**.

**Severidade:** Média *(bloqueia a conclusão do parecer e, por consequência, a sequência da SC)*

**Preparação de massa:** uma SC do executor levada até a etapa de parecer, com o próprio executor
como **Responsável** da área na grade *Áreas para Emissão para Parecer Técnico*. Quem prepara:
comprador que monta a SC.

**Verificado em tela:** PARCIAL
**O que foi verificado:** O mesmo do CT-FSWTBC-2243 — formulário `256832` aberto, seção **7.
Aprovação do Parecer Técnico** presente com **Responsável \***, **Email do Responsável \***,
**Data da Validação \***, **Hora da Validação \***, **Emitir Parecer? \*** e os dois rádios
`parecerAprovadoSim` (**Aprovado**) / `parecerAprovadoNao` (**Reprovado/Ajustes**). Atividades
`emitirParecer: 5`, `aprovadoParecer: 9`, `recusadoParecer: 13` declaradas no `ViewHandler.js`.
**Divergências encontradas:** o registro **não tem descrição, evidência nem SDCASSI** — é duplicata
administrativa de FSWTBC-2243. O caso acima é caracterização de caminho, conforme §5-D do briefing;
não há cenário próprio a inventar. Para execução, use o CT-FSWTBC-2243, que é o mesmo cenário com o
registro completo.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2243  (fluig · Concluído · SDCASSI-40)

**Título:** O parecerista aprova o parecer técnico e recebe confirmação, nunca uma mensagem "undefined".

**Origem:** FSWTBC-2243 (SD769458) — erro **`undefined`** ao aprovar parecer técnico (processos
39747 e 38726). **Nona** ocorrência de defeito no parecer técnico e a **segunda** com a mensagem
`undefined` (a primeira foi FSWTBC-1458, em abril). Corrigido em 4 dias, sem registro da causa nas
duas vezes — e `undefined` é sintoma de **dado não carregado**, não de lógica, o que sugere a mesma
raiz nas duas ocorrências.

**Módulo/Rota:** *Parecer Técnico* (form `256832`) → seção **7. Aprovação do Parecer Técnico** →
`emitirParecer` (5) → `aprovadoParecer` (9) / `recusadoParecer` (13).

**Pré-condições**
- Tarefa de *Parecer Técnico* atribuída ao executor, oriunda de uma SC com cotação e propostas.
- A SC de origem com **Nº da SC do ERP** já preenchido (é um dos campos que o parecer herda).
- **Bloqueio:** **sim.** Não há tarefa de parecer atribuída à conta de QA; aprovar parecer de
  terceiro é vedado. O formulário só monta os campos herdados quando aberto a partir da instância
  real — aberto em modo de início (`WDNrDocto=0`), os campos `readonly` vêm vazios por desenho.

**Passos**
1. Abrir a tarefa de *Parecer Técnico* pela Central de Tarefas → aba **Tarefas a concluir**.
2. Na seção *1. Assunto*, conferir **Nº da SC do Fluig**, **Nº da SC do ERP**, **Código da Filial**,
   **Nome da Filial** e **Justificativa da Solicitação** — todos com valor.
3. Clicar em **Ver rateio da SC** e conferir que o rateio da solicitação é exibido.
4. Preencher **Descreva as informações do parecer técnico. \***.
5. Preencher a grade de *6. Conclusão* para cada empresa.
6. Em **7. Aprovação do Parecer Técnico**, marcar **Emitir Parecer? \*** = **Aprovado** e clicar em
   **Enviar**.
7. Repetir o cenário marcando **Reprovado/Ajustes**, com outra instância.

**Resultado esperado**
- A aprovação conclui e a instância vai para `aprovadoParecer` (9); a reprovação vai para
  `recusadoParecer` (13).
- **Nenhuma mensagem `undefined`** — nem em modal, nem em toast, nem no console. Toda crítica exibida
  tem texto em português legível.
- Os campos herdados da SC (**Responsável \***, **Email do Responsável \***, **Data da Validação \***,
  **Hora da Validação \***) vêm preenchidos, e os ocultos de identidade (`matriculaRespParecer`,
  `matriculaValidParecer`, `dataValidacaoParecer`, `horaValidacaoParecer`, `tipoParecer`) têm valor.
- A SC de origem reflete o resultado em **Situação Par. Area Dem. \*** / **Situação Par. Areas \***
  e sai de `aguardaFimParecer` (245).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Ao clicar em aprovar, aparece a mensagem literal **`undefined`** e a aprovação não conclui.
  Processos afetados no ticket: **39747** e **38726**. Precedente idêntico: FSWTBC-1458, em abril.

**Severidade:** Média *(bloqueia a conclusão do parecer e a sequência da SC; sem perda de dado)*

**Preparação de massa:** uma SC do executor levada até *Áreas para Emissão para Parecer Técnico*,
com o executor cadastrado como **Responsável \*** de uma das áreas, e propostas de cotação já
recebidas (o parecer lê os anexos das cotações na carga). Quem prepara: comprador + fornecedores de
homologação.

**Verificado em tela:** PARCIAL
**O que foi verificado:** O formulário de Parecer Técnico (`256832`) abre pela rota
`/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras_parecer` (heading *Início*, sem
bloqueio de permissão). A seção **7. Aprovação do Parecer Técnico** existe, com **Responsável \***
(`parecerResponsavelValida`, readonly), **Email do Responsável \*** (`parecerEmailResponsavel`,
readonly), **Data da Validação \*** (`parecerDataValidacao`, `input[type=date]`, readonly),
**Hora da Validação \*** (`parecerHoraValidacao`, `input[type=time]`, readonly), **Emitir Parecer? \***
e os rádios `parecerAprovadoSim` (**Aprovado**) e `parecerAprovadoNao` (**Reprovado/Ajustes**).
Campos ocultos de identidade presentes: `matriculaRespParecer`, `matriculaValidParecer`,
`dataValidacaoParecer`, `horaValidacaoParecer`, `tipoParecer`. Atividades `inicio 4 / emitirParecer 5
/ aprovadoParecer 9 / recusadoParecer 13` declaradas.
**Divergências encontradas:** aberto em modo de início, **todos** os campos `readonly` do cabeçalho
(*PARECER Nº:*, *Data:*, *Nº da SC do Fluig*, *Nº da SC do ERP*, *Código da Filial*, *Nome da
Filial*, *Justificativa da Solicitação*) vêm **vazios**, porque só são preenchidos pelo processo
pai. Isso é comportamento de desenho, **mas** é exatamente a condição que produz `undefined` quando
o pai não entrega o dado — e sustenta a leitura do ticket de que a raiz é dado não carregado. Ponto
a observar em regressão: se qualquer um desses campos vier vazio numa instância **real**, o
`undefined` está a um passo.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2364  (fluig · Concluído · SDCASSI-60)

**Título:** Um Parecer Técnico que falha ao ser concluído não deixa a Solicitação de Compras de origem já movimentada.

**Origem:** FSWTBC-2364 — SD773366. O processo de Parecer Técnico movimentava a **solicitação pai antes
de finalizar a si mesmo**: o parecer 44754 movimentou a SC 44339 e em seguida deu erro, ficando
irrecuperável — o pai não podia ser movimentado de novo e o parecer não podia ser concluído. Falta de
transacionalidade/compensação entre processo filho e pai.

**Módulo/Rota:** Parecer Técnico — `/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras_parecer`,
atividade **Emitir Parecer Técnico** → **Validação do Parecer Técnico**. Pai: Solicitação de Compras,
seções *Identificação da(s) Áreas para Parecer Técnico* e *Áreas para Emissão para Parecer Técnico*.

**Pré-condições**
- Uma SC que tenha chegado à etapa em que se solicita parecer, com ao menos uma **Área** preenchida em
  *Identificação da(s) Áreas para Parecer Técnico*.
- O processo de Parecer Técnico instanciado a partir dessa SC (não iniciado avulso).
- Uma condição de falha reproduzível na conclusão do parecer (indisponibilidade do ERP, campo obrigatório
  rejeitado no servidor, ou queda de integração).
- **Bloqueio:** **sim** — o cenário exige (a) uma SC submetida até a etapa de parecer e (b) provocar uma
  falha deliberada na conclusão do parecer, ambos escrita em processo real. Além disso, **não há hoje
  parecer instanciado a partir de SC**: a base tem **uma única** instância de `wf_solicitacao_compras_parecer`
  (112329) e ela tem `parentRequestId: null`.

**Passos**
1. Na SC, informar a **Área *** em *Identificação da(s) Áreas para Parecer Técnico* e movimentar, gerando
   o processo de Parecer Técnico.
2. Anotar o `processInstanceId` da SC e o do parecer, e a atividade atual de cada um.
3. Abrir o parecer na atividade **Emitir Parecer Técnico**, preencher *Descreva as informações do parecer
   técnico. \** e marcar **Emitir Parecer? \*** = *Aprovado*.
4. Provocar a falha na conclusão (ex.: indisponibilidade do ERP no momento do envio) e enviar.
5. Após o erro, voltar à **SC pai** e ler a atividade atual dela na aba *Histórico* (ou em
   `GET /process-management/api/v2/requests/<id da SC>?expand=activities`).
6. Voltar ao parecer e verificar se ele ainda pode ser reenviado.

**Resultado esperado**
- Com o parecer **falhando**, a SC pai **permanece na mesma atividade** em que estava antes do passo 4 —
  nenhum movimento novo aparece no histórico dela.
- O processo de parecer permanece **na atividade Emitir Parecer Técnico**, reenviável, com os campos
  preenchidos preservados.
- Na conclusão bem-sucedida, a ordem é: o parecer finaliza (**Validação do Parecer Técnico** → **Fim**)
  **e só então** a SC pai avança.
- Nenhum dos dois processos precisa ser cancelado para sair do estado.

**Resultado se o defeito reincidir**
- A SC pai aparece **já movimentada** no histórico, com data/hora anterior ao erro do parecer, enquanto o
  parecer permanece com erro e não pode ser refeito — exatamente o par *parecer 44754 / SC 44339* do ticket.
- O único caminho de saída é **cancelar o processo de parecer**, porque o pai já avançou. Mensagem de erro
  exata do parecer: `<não documentado>` (o ticket traz o print *"Erro parecer.png"*, não o texto).

**Severidade:** Alta *(estado inconsistente irrecuperável entre dois processos; obriga cancelamento e
compromete a trilha de aprovação)*

**Preparação de massa:** uma SC criada pelo executor, levada até a etapa de solicitação de parecer, com
Área preenchida; e um meio controlado de derrubar a integração no instante do envio do parecer (janela de
indisponibilidade do Protheus ou apoio do time Fluig). Nada disso a conta de QA cria sozinha.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário do Parecer Técnico (iframe 256832) abre completo, com as seções
*Gerência / Divisão Requisitante*, *Gerência de Tecnologia da Informação*, *1. Assunto*, *Rateio de Centro
de Custo da Solicitação*, *2. Referência e informação*, *3. Pontos que não atendem a especificação*,
*4. Pontos que superam a especificação*, *5. Parecer*, *6. Conclusão* e *7. Aprovação do Parecer Técnico*;
campos **PARECER Nº:**, **Data:**, **Nº da SC do Fluig** (`numProcessoPai`), **Nº da SC do ERP**
(`numReqCompra`), **Código da Filial**, **Nome da Filial**, *Justificativa da Solicitação*, *Descreva as
informações do parecer técnico. \**, *Responsável \**, *Data/Hora da Validação* e **Emitir Parecer? \***
com as opções **Aprovado** e **Reprovado/Ajustes**; botões *Ver rateio da SC* e *Anexos*. As três
atividades do processo foram lidas na instância 112329: **Início → Emitir Parecer Técnico → Validação do
Parecer Técnico → Fim**. Na SC, as duas seções de parecer existem (*Identificação da(s) Áreas para Parecer
Técnico*, *Áreas para Emissão para Parecer Técnico*, com label **Área \*** e campo de dataset `QB_DEPTO`).
**Divergências encontradas:** o ticket descreve o parecer como **subprocesso da SC**, mas o vínculo
pai–filho **não é observável hoje**: a única instância de parecer da base (112329) tem `parentRequestId:
null`, e em 34 instâncias de SC amostradas **não aparece nenhuma atividade "Processo de Parecer"** — os
únicos disparos de subprocesso vistos são **Processo de Cotação** e **Processo de Negociação**. O campo do
parecer que aponta o pai chama-se **"Nº da SC do Fluig"** (`numProcessoPai`), não "processo pai".
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2386  (ambos · Concluído · SDCASSI-64)

**Título:** Anexar a proposta de duas lojas do mesmo fornecedor no Parecer Técnico e ver cada anexo ficar na sua própria loja.

**Origem:** FSWTBC-2386 — o processo 45151 de parecer não permitia anexar a proposta de um
fornecedor de **BH** cujo **CNPJ tem o mesmo início** de outro (SC 36426, filial 3106, cotação
`000018`). Causa-raiz apontada pelo próprio relator: a chave de vínculo do anexo era a concatenação
**(nº da cotação + código do fornecedor)**, fazendo **duas lojas do mesmo fornecedor colidirem na
mesma chave**. A chave correta é **(nº da cotação + código do fornecedor + LOJA)** — no Protheus,
fornecedor é `A2_COD` **+** `A2_LOJA`; ignorar a loja é erro clássico de modelagem. O caso de BH é
sintoma: matriz e filial com o mesmo CNPJ raiz.

**Módulo/Rota:** Fluig → **Processos** → **Parecer Técnico**
(`processID=wf_solicitacao_compras_parecer`), aba **Formulário**, grade de propostas e **Anexos**.

**Pré-condições**
- Uma cotação com **duas lojas do mesmo fornecedor** participando (ex.: `A2_COD` igual, `A2_LOJA`
  `0001` e `0002`), ambas com `C8_XPARTEC = "S"`.
- Um arquivo de proposta distinto para cada loja.
- **Bloqueio:** duplo. (a) **Sem credencial Protheus** — não posso montar nem confirmar as duas
  lojas na SA2/SC8. (b) O caso exige **anexar arquivo** e, para valer, **duas propostas distintas**;
  não anexei nada (regra §2) e não há massa com duas lojas do mesmo fornecedor disponível para mim.

**Passos**
1. Abrir **Processos → Parecer Técnico** para a cotação que tem duas lojas do mesmo fornecedor.
2. Na aba **Formulário**, conferir a grade de propostas: cada linha deve trazer **Cód. Fornecedor**,
   **Loja** e **Nº da Proposta**.
3. Conferir que aparecem **duas linhas** — uma por loja — e não uma só.
4. Anexar a proposta da **loja 0001** e, em seguida, a proposta da **loja 0002**.
5. Abrir a visualização de anexos de **cada** linha.
6. Conferir qual arquivo é oferecido em cada uma.
7. Repetir com um fornecedor de **loja única**, para o contraste.

**Resultado esperado**
- A grade lista **uma linha por (fornecedor, loja)** — duas lojas do mesmo fornecedor produzem
  **duas** linhas distintas.
- O **Nº da Proposta** de cada linha é formado por **cotação + fornecedor + loja**
  (`C8_NUM-C8_FORNECE-C8_LOJA`), de modo que as duas lojas nunca compartilham a mesma chave.
- Cada anexo aparece **somente** na linha da loja a que pertence; anexar na loja 0002 não sobrescreve
  nem esconde o anexo da loja 0001.
- A pasta de anexos criada no ECM identifica a loja: `Processo <nº> FORN: <CNPJ> LOJA: <loja>` e,
  dentro dela, `FORNECEDOR: <CNPJ> - <razão social>`.
- Nenhuma mensagem *"Não foi possível carregar as…"* ao abrir os anexos.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O parecer **não permite anexar** a proposta do fornecedor de BH cujo CNPJ tem início igual ao de
  outro (processo 45151, SC 36426, filial 3106, cotação `000018`); as duas lojas colidem na mesma
  chave e uma sobrescreve/oculta a outra. Evidência original: `parecerAnexosErroLoja.png` — o nome
  do arquivo já nomeia a causa.

**Severidade:** Alta — proposta de fornecedor perdida ou inacessível dentro de um processo de
concorrência; afeta diretamente a decisão de compra e é risco de questionamento do fornecedor
preterido.

**Preparação de massa:** uma cotação de homologação com **duas lojas do mesmo fornecedor**
participando (`C8_XPARTEC = "S"` em ambas) e dois arquivos de proposta distintos. **Não posso criar
nem localizar essa massa** — depende de cadastro na SA2 e de cotação com dois participantes.
**Além disso, verifique com o time se houve tratamento retroativo:** o ticket não registra
migração dos anexos **já gravados** com a chave antiga, que podem continuar inacessíveis.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri o processo **Parecer Técnico** (abre em *Início*, abas *Formulário /
Informações / Histórico / Anexos*) — sem massa, a grade não popula. A verificação real foi **no
fonte publicado** do formulário `256832`, e ela **confirma que a correção está aplicada**:

```js
let checkForn = `${data.C8_FORNECE}-${data.C8_LOJA}`          // chave de deduplicação COM loja
numProposta: data.C8_NUM + "-" + data.C8_FORNECE + "-" + data.C8_LOJA   // cotação + fornecedor + LOJA
lojFornecedor: data.C8_LOJA                                    // a loja é levada para a grade
```

e as pastas do ECM são nomeadas
``Processo ${NUM_PROCES} FORN: ${txt_cgc_infForn} LOJA: ${txt_ljForn_infForn}`` e
``FORNECEDOR: ${txt_cgc_infForn} - ${txt_razSoc_infForn}`` — CNPJ **e** loja no nome. A grade tem os
campos `tbProposta_codFornecedor`, `tbProposta_lojFornecedor` e `tbProposta_numProposta`.
**Divergências encontradas:** **achado residual — a colisão não foi eliminada por completo.** A
chave da proposta foi corrigida (passou a incluir a loja), **mas a ligação anexo → proposta continua
sendo feita por casamento de substring do NOME do fornecedor**:

```js
if (data.anexos[anx].documentDescription.indexOf(data.propostas[key].fornecedor) != -1) { ... }
```

`indexOf` sobre `documentDescription` procura o **nome** (`C8_FORNOME`) dentro da descrição do
documento. Dois fornecedores cujo nome seja **prefixo um do outro** (o caso "matriz e filial de BH"
é exatamente esse) voltam a colidir — agora na exibição do anexo, não mais na chave. Recomendo casar
o anexo pelo `numProposta` (que já é único) em vez do nome. Registro também a exclusão por hardcode
do fornecedor `85070508-0001` nesta mesma função (ver o achado transversal no topo do arquivo).
**Dados/massa usados:** nenhum — não submetido, **nenhum arquivo anexado**.

---

## CT-FSWTBC-2388  (ambos · Concluído · SDCASSI-65)

**Título:** Abrir o Parecer Técnico de uma cotação e ver a grade de fornecedores preenchida — ou, se não houver proposta elegível, uma mensagem dizendo por quê.

**Origem:** FSWTBC-2388 — o parecer técnico nº 43655 **não trouxe os dados do fornecedor** na tela de
aprovação. **Não era defeito de código:** o campo customizado `C8_XPARTEC` (flag que indica que a
cotação exige parecer técnico) estava com valor **`N`**, e o formulário **só monta a grade de
fornecedores quando o flag está ligado**. Classificado como Bug e resolvido como Feito, mas a
natureza real é **configuração/uso**. Pendência declarada: quando `C8_XPARTEC = N` **a tela aparece
vazia, sem nenhuma mensagem explicando** — o comportamento silencioso é o que gerou o chamado, e
**nada foi feito para torná-lo explícito**.

**Módulo/Rota:** Fluig → **Processos** → **Parecer Técnico**
(`processID=wf_solicitacao_compras_parecer`), aba **Formulário**, grade de propostas. Campo de
origem: **"Enviar para parecer técnico?"**, no formulário de **Cotação de Produtos/Serviços**.

**Pré-condições**
- Uma cotação com pelo menos um fornecedor cujo **"Enviar para parecer técnico?"** esteja como
  **Sim** (`C8_XPARTEC = "S"`), para o caminho positivo.
- Uma segunda cotação com **todos** os fornecedores em `C8_XPARTEC = "N"`, para o caminho negativo.
- **Bloqueio:** duplo. (a) **Sem credencial Protheus** — não posso ler nem alterar `C8_XPARTEC`.
  (b) Sem massa de parecer disponível para esta conta, a grade não popula. A **condição de ativação**
  foi confirmada no fonte publicado (abaixo), o que permite escrever o resultado esperado com
  precisão mesmo sem executar.

**Passos**
1. Abrir a **Cotação de Produtos/Serviços** da cotação sob teste e conferir o campo **"Enviar para
   parecer técnico?"** de cada fornecedor.
2. Para a cotação com pelo menos um **Sim**, abrir **Processos → Parecer Técnico** do processo
   correspondente.
3. Conferir a aba **Formulário**: a grade de propostas deve listar os fornecedores.
4. Conferir, em cada linha, **Cód. Fornecedor**, **Loja**, **Nº da Proposta**, **Versão**,
   **Emissão** e **Nome do Fornecedor**.
5. Repetir os passos 2–4 para a cotação em que **todos** os fornecedores estão como **Não**.
6. Observar o que a tela exibe nesse segundo caso.

**Resultado esperado**
- Para a cotação com pelo menos um fornecedor marcado **Sim**, a grade lista **exatamente** os
  fornecedores com o flag ligado, com todos os campos preenchidos (nenhuma célula em branco).
- Fornecedores com o flag **Não** **não** aparecem — isso é o comportamento correto, não uma falta.
- Para a cotação em que **todos** estão como **Não**, a tela exibe uma **mensagem explicando** que
  não há proposta sujeita a parecer técnico. **Ela não pode simplesmente aparecer vazia.**
- A data de **Emissão** é exibida em formato brasileiro (`dd/mm/aaaa`).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O parecer técnico nº 43655 abre **sem nenhum dado de fornecedor**, sem mensagem e sem indicação de
  causa — o usuário conclui que o sistema falhou, quando na verdade `C8_XPARTEC` estava como `N`.

**Severidade:** Média — não há perda de dado nem risco financeiro; o custo é de diagnóstico (abriu
chamado por comportamento silencioso) e de bloqueio percebido do fluxo.

**Preparação de massa:** duas cotações — uma com `C8_XPARTEC = "S"` em ao menos um fornecedor e outra
com todos em `"N"` —, ambas com processo de parecer aberto. **Não posso configurar o flag** (é campo
do Protheus, alterável pelo comprador na cotação). O caminho barato: peça ao comprador que, ao criar
a cotação de teste, marque **"Enviar para parecer técnico?" = Não** para todos os itens de uma delas.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri o processo **Parecer Técnico**; ele carrega em *Início* com as abas
*Formulário / Informações / Histórico / Anexos*, e a grade não popula sem massa. **Confirmei a
condição de ativação diretamente no fonte publicado** (form `256832`, `App/EventHandler.js`,
`handleListQuotes`):

```js
if (arFornecedores.indexOf(checkForn) == -1) {
    if (data.C8_XPARTEC == "S") {          // ← a grade SÓ recebe fornecedor com o flag em "S"
        arFornecedores.push(checkForn);
        propostas.push({ ... });
    }
}
```

Não há `else`: quando **nenhum** fornecedor tem `C8_XPARTEC == "S"`, `propostas` volta como array
vazio e **a tela é montada em branco, em silêncio** — exatamente a pendência descrita no ticket,
**ainda presente no fonte publicado hoje**. O único `console.error` do método (*"Não foi possível
prosseguir com o carregamento das informações das cotações."*) dispara em outro ramo (lista de
cotações vazia), não neste. Confirmei também o campo de origem **"Enviar para parecer técnico?"** no
formulário de Cotação.
**Divergências encontradas:** **três.** (1) O ticket foi classificado como *Bug* e resolvido como
*Feito*, mas **nada foi alterado** — a natureza é configuração, e a ausência de mensagem persiste.
**Este caso, no passo 6, reprova hoje**: a tela continua vazia sem explicação. (2) O rótulo do
ticket é `C8_XPARTEC` (campo do ERP); **na tela o nome é "Enviar para parecer técnico?"** — quem
procurar por "XPARTEC" na interface não encontra. (3) A mesma função exclui por hardcode o
fornecedor `85070508-0001` (achado transversal, topo do arquivo): se a única proposta com
`C8_XPARTEC = "S"` for a do Fornecedor Genérico, a grade fica vazia **mesmo com o flag ligado** — um
segundo caminho para o mesmo sintoma, que o ticket não considerou.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2424  (fluig · Concluído · SDCASSI-66)

**Título:** Reprovar um Parecer Técnico e a Solicitação de Compras de origem conservar a cotação e os demais campos.

**Origem:** FSWTBC-2424 — SD773864. No parecer **36649**, ao marcar a **reprovação**, a **cotação era
apagada**. Causa raiz: rotina de **limpeza de campos** executada no retorno do parecer para a SC, que
varria campos que deveriam ser preservados, inclusive os que amarram a cotação. Corrigido readicionando
os campos; produção pela **MUD16218** — a mesma mudança do FSWTBC-2532.

**Módulo/Rota:** Parecer Técnico (`wf_solicitacao_compras_parecer`) → seção **7. Aprovação do Parecer
Técnico**, campo **Emitir Parecer? \*** = **Reprovado/Ajustes**. Efeito a conferir na SC:
*Identificação do Processo / Solicitante* → **Nº da Cotação ERP \*** e seção **Validação do Comprador
(Definir Negociação)**.

**Pré-condições**
- Uma SC que já **tenha cotação gerada** — campo *Nº da Cotação ERP \** preenchido — e que tenha
  solicitado parecer técnico.
- O processo de parecer aberto na atividade **Emitir Parecer Técnico**, ainda não concluído.
- Registro, **antes** do passo de reprovação, dos valores atuais de *Nº da Solicitação ERP*, *Nº da Cotação
  ERP* e das linhas da grade de propostas.
- **Bloqueio:** **sim** — exige SC submetida com cotação gerada e a conclusão (reprovando) de um parecer
  real. Não há hoje parecer vinculado a SC na base (única instância, 112329, com `parentRequestId: null`),
  e a massa de contrato está indisponível.

**Passos**
1. Abrir a SC e **anotar** os valores de **Nº da Solicitação ERP \***, **Nº da Cotação ERP \*** e as linhas
   da grade da seção *Validação do Comprador (Definir Negociação)* (colunas **Nº Proposta**, **Nº Versão**,
   **Fornecedor**, **Status Area Dem.**, **Status Area TI.**, **Negociação?**).
2. Abrir o processo de **Parecer Técnico** correspondente na atividade **Emitir Parecer Técnico**.
3. Preencher *Descreva as informações do parecer técnico. \** e, em **7. Aprovação do Parecer Técnico**,
   marcar **Emitir Parecer? \*** = **Reprovado/Ajustes**.
4. Enviar o parecer.
5. Reabrir a **SC** e reler exatamente os mesmos campos do passo 1.
6. Conferir também *Nº da SC do ERP* e a grade de propostas do próprio parecer (tabela `tbProposta`,
   colunas *Empresas*, *Não atende o solicitado \**, *A proposta possui pontos acima do solicitado \**,
   *Atende plenamente \**).

**Resultado esperado**
- **Nº da Cotação ERP \*** continua com **o mesmo valor** de antes da reprovação — não fica vazio.
- **Nº da Solicitação ERP \*** continua preenchido.
- A grade de *Validação do Comprador (Definir Negociação)* mantém **todas** as linhas e valores das colunas
  **Nº Proposta**, **Nº Versão**, **Fornecedor**, **Status Area Dem.**, **Status Area TI.** e **Negociação?**.
- A SC segue o caminho de reprovação (retorno para ajuste) **com os dados íntegros**; a reprovação altera
  o *fluxo*, não o *conteúdo* do formulário.
- O mesmo vale para a aprovação: reprovar e aprovar devem preservar exatamente o mesmo conjunto de campos.

**Resultado se o defeito reincidir**
- Após marcar **Reprovado/Ajustes** e enviar, a SC volta com o campo da **cotação vazio** — "a cotação
  sumiu" — e a grade de propostas perde as linhas. Caso concreto do ticket: **parecer 36649**.
- Mensagem de erro: **nenhuma** — o defeito é silencioso, os campos simplesmente voltam em branco. É por
  isso que o passo 1 (anotar antes) é obrigatório.

**Severidade:** Alta *(perda de dado que amarra a cotação à SC; compromete a trilha de aprovação e a
rastreabilidade com o ERP)*

**Preparação de massa:** uma SC do próprio executor levada até ter **cotação gerada** (passa por *Aguarda
Geração da Cotação* → *Cotação foi Gerada?*) **e** com parecer técnico solicitado e ainda pendente. Nenhuma
das duas condições existe na base hoje; ambas exigem envio da SC e a integração com o Protheus ativa.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no formulário do parecer, a seção **7. Aprovação do Parecer Técnico** com
**Emitir Parecer? \*** e os dois radios **Aprovado** (`parecerAprovadoSim`) e **Reprovado/Ajustes**
(`parecerAprovadoNao`); a tabela `tbProposta` com as colunas *Empresas*, *Não atende o solicitado \**,
*A proposta possui pontos acima do solicitado \**, *Atende plenamente \**, e as tabelas auxiliares
`tbPNAProposta` e `tbPSProposta` (labels **Proposta Nº**, **Nome Forn.**, **Empresa**). Na SC, os campos
**Nº da Solicitação ERP \*** (`numSolCompra`) e **Nº da Cotação ERP \*** (`numCotacao`) — ambos `readonly`,
preenchidos pela integração — e a seção **Validação do Comprador (Definir Negociação)** com a grade de
propostas.
**Divergências encontradas:** o ticket fala em "a cotação é apagada"; na tela o que se perde é o
**conteúdo do campo `numCotacao` ("Nº da Cotação ERP")** e as linhas da grade — a cotação como processo
(`wf_cotacao_produtos_servicos`) continua existindo. A distinção importa para não procurar o defeito no
lugar errado.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2440  (fluig · Concluído · SDCASSI-69)

**Título:** Anexar um documento na etapa de Parecer Técnico, movimentar e o anexo continuar lá ao reabrir.

**Origem:** FSWTBC-2440 — SD774457. Anexos não ficavam salvos na etapa de parecer técnico. Diagnóstico do
próprio cliente: o **dataset que consulta as cotações tem uma trava de data**; cotações fora da janela não
eram retornadas, o vínculo do anexo não se estabelecia e o arquivo se perdia. O ticket registra a suspeita,
não tratada, de que *"provavelmente a trava é utilizada em outras partes do processo"*.

**Módulo/Rota:** Parecer Técnico (`wf_solicitacao_compras_parecer`) — botão **Anexos** dentro do
formulário e aba **Anexos** da plataforma. Campos de anexo do formulário: *Anexar tabelas que subsidiem a
análise* (seções 3 e 4) e *Anexar tabelas e gráficos que subsidiem a análise* (seção 5).

**Pré-condições**
- Um processo de Parecer Técnico na atividade **Emitir Parecer Técnico**, originado de uma SC com cotação.
- Um arquivo de teste nomeado com prefixo **`QA`** (ex.: `QA-parecer-anexo.pdf`).
- Cotação de origem **dentro** da janela de data do dataset e, para o teste de contorno, uma cotação
  **fora** dessa janela.
- **Bloqueio:** **sim** — não há hoje parecer instanciado a partir de SC (única instância, 112329, com
  `parentRequestId: null`), e criar um exige enviar SC até a etapa de parecer. A janela exata da trava de
  data **não está documentada em lugar nenhum** — o ticket não a registra e o fechamento não diz se ela foi
  removida ou ajustada.

**Passos**
1. Abrir o Parecer Técnico na atividade **Emitir Parecer Técnico**.
2. Clicar em **Anexos** (botão do formulário) e anexar `QA-parecer-anexo.pdf`; anexar também pelos campos
   *Anexar tabelas e gráficos que subsidiem a análise* da seção **5. Parecer**.
3. Confirmar que a aba **Anexos** da plataforma passa a exibir contagem maior que 0.
4. Preencher *Descreva as informações do parecer técnico. \**, marcar **Emitir Parecer? \*** = *Aprovado* e
   **movimentar** o parecer para **Validação do Parecer Técnico**.
5. Reabrir o parecer na nova atividade e conferir a aba **Anexos** e os campos de anexo.
6. Repetir com uma SC cuja **cotação seja antiga** (fora da janela de data do dataset de cotações).
7. Repetir na SC pai: anexar pelos botões **Anexar documentação Pública** e **Anexar documentação Restrita
   CASSI**, movimentar e reabrir.

**Resultado esperado**
- Após a movimentação, a aba **Anexos** continua exibindo **o mesmo arquivo**, com o mesmo nome, e ele é
  baixável.
- O anexo continua visível para o **próximo responsável** (na atividade *Validação do Parecer Técnico*),
  não só para quem anexou.
- O comportamento é **idêntico** para cotação recente e cotação antiga — a idade da cotação **não** decide
  se o anexo sobrevive.
- Os anexos das seções 3, 4 e 5 do formulário permanecem vinculados aos respectivos campos.

**Resultado se o defeito reincidir**
- Após movimentar, a aba **Anexos** volta a **0** e o arquivo não está em lugar nenhum — perda silenciosa,
  sem mensagem de erro (`<não documentado>`; o ticket traz 5 prints de 18/08/2025 documentando a perda).
- A perda ocorre seletivamente, conforme a **data da cotação** de origem: cotações fora da janela do
  dataset perdem o anexo, cotações recentes não. **Este é o discriminante que confirma a reincidência da
  causa raiz e não outro defeito de anexo.**

**Severidade:** Alta *(perda de dado, silenciosa, em documento que fundamenta parecer técnico de compra)*

**Preparação de massa:** um parecer técnico vivo originado de SC — que hoje não existe — **e**, para o
passo 6, uma SC cuja cotação esteja fora da janela de data do dataset. Alguém do time Fluig precisa
informar **qual é a janela** (o ticket não registra) para que o passo 6 seja executável, e informar se a
trava foi removida ou apenas ajustada.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário do Parecer Técnico expõe o botão **Anexos** dentro do iframe e os
campos de anexo *Anexar tabelas que subsidiem a análise* (seções 3 e 4) e *Anexar tabelas e gráficos que
subsidiem a análise* (seção 5); a plataforma mostra a aba **Anexos** com contador (0 no formulário em
branco). Na SC, os botões **Anexar documentação Pública** e **Anexar documentação Restrita CASSI** existem,
e a atividade de serviço **Grava SC e Anexos** — que é onde os anexos da SC são persistidos — foi medida em
22 instâncias (11–326 s, média 97,7 s).
**Divergências encontradas:** o ticket atribui a causa a um "dataset que consulta as cotações"; o
formulário do parecer, aberto em branco, dispara **apenas** `ds_protheus_getMatriculaTitular_rest` — o
dataset de cotações só é chamado quando o parecer nasce de uma SC, então **não foi possível identificar
qual dataset carrega a trava de data**, e o ticket também não o nomeia.
**Dados/massa usados:** nenhum — nenhum arquivo foi anexado, nenhum processo foi movimentado.

---

## CT-FSWTBC-2687  (fluig · Concluído · SDCASSI-95)

**Título:** Abrir a etapa de Parecer Técnico e identificar de imediato o processo Fluig, a filial e o número da SC no ERP.

**Origem:** FSWTBC-2687 — SD778257. Melhoria pedida: exibir o **número do processo Fluig da SC** e a
**filial** na etapa de Parecer Técnico, e marcar o número da Solicitação de Compras do **Protheus** com o
rótulo **"ERP"** ao lado, como já se faz no processo de solicitação de compras — o parecerista precisava
saber a qual processo e filial o parecer pertence e distinguir o número do Fluig do número do ERP. Durante
a homologação apareceram **dois defeitos colaterais**: (a) ao **retornar do parecer**, a **área
demandante** não era carregada; (b) após **enviar o parecer adiante**, o processo **permanecia na mesma
etapa**. Ajustados por Paulo Calixto; **PR 56109 / MUD16387**.

**Módulo/Rota:** Parecer Técnico — `/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras_parecer`,
cabeçalho do formulário (acima da seção **1. Assunto**).

**Pré-condições**
- Para a verificação da **exibição**: nenhuma — basta abrir o formulário do Parecer Técnico.
- Para os **colaterais**: um parecer originado de uma SC, com **Área** preenchida na SC, na atividade
  **Emitir Parecer Técnico**.
- **Bloqueio:** **parcial** — a exibição foi verificada e está correta. Os dois colaterais exigem um
  parecer vinculado a SC e a sua movimentação; não há parecer com pai na base (única instância, 112329,
  `parentRequestId: null`) e movimentar é escrita.

**Passos**
1. Abrir o processo **Parecer Técnico**.
2. No cabeçalho do formulário, ler os campos **PARECER Nº:**, **Data:**, **Nº da SC do Fluig**,
   **Nº da SC do ERP**, **Código da Filial** e **Nome da Filial**.
3. Conferir que **Nº da SC do Fluig** e **Nº da SC do ERP** são **dois campos distintos e rotulados**,
   e que os valores batem com a SC de origem (campos **Nº do Processo Fluig \*** e **Nº da Solicitação
   ERP \*** da SC).
4. Conferir que **Código da Filial** e **Nome da Filial** batem com os da SC.
5. *(Colateral a)* Retornar o parecer para a SC e verificar se a **Área** informada em *Identificação da(s)
   Áreas para Parecer Técnico* continua carregada.
6. *(Colateral b)* Enviar o parecer adiante e verificar, no **Histórico**, se ele **muda de atividade**
   (**Emitir Parecer Técnico** → **Validação do Parecer Técnico**).

**Resultado esperado**
- O cabeçalho do parecer exibe, preenchidos e somente-leitura: **Nº da SC do Fluig**, **Nº da SC do ERP**,
  **Código da Filial** e **Nome da Filial**.
- O número do ERP é **inequivocamente distinguível** do número do Fluig pelo rótulo — o parecerista não
  precisa adivinhar qual é qual.
- Os valores **coincidem** com os da SC de origem.
- *(Colateral a)* Ao retornar do parecer, a **Área** da SC continua carregada.
- *(Colateral b)* Após o envio, o parecer **avança de atividade** e não fica preso em **Emitir Parecer
  Técnico**.

**Resultado se o defeito reincidir**
- O cabeçalho do parecer volta a **não** mostrar o processo Fluig e/ou a filial, e o número da SC aparece
  **sem distinção** entre Fluig e ERP — o parecerista não sabe a qual processo o parecer pertence.
- *(Colateral a)* Ao retornar do parecer, a **área demandante** volta em branco na SC.
- *(Colateral b)* Após enviar, o processo **permanece na mesma etapa** — a tarefa não sai da caixa.
- Mensagens de erro exatas: `<não documentado>` — a evidência do ticket são prints e imagens de WhatsApp
  encaminhadas.

**Severidade:** Média *(o pedido original é usabilidade/rastreabilidade — Baixa; mas o colateral (b),
processo travado na mesma etapa, bloqueia o fluxo, e o colateral (a) é perda de dado. A severidade do
caso é a do pior sintoma que ele cobre)*

**Preparação de massa:** para os passos 1–4, **nenhuma** — foram executados. Para os passos 5 e 6: um
parecer técnico originado de uma SC com **Área** preenchida, na atividade *Emitir Parecer Técnico*,
criado pelo time de Compras.

**Verificado em tela:** **SIM (total)** *(para o pedido original do ticket — a exibição. Os dois colaterais
não foram exercitados; ver Bloqueio)*
**O que foi verificado:** o formulário do Parecer Técnico (iframe 256832) exibe, no cabeçalho, **exatamente
os quatro campos pedidos**: **Nº da SC do Fluig** (`numProcessoPai`), **Nº da SC do ERP** (`numReqCompra`),
**Código da Filial** (`codFilial`) e **Nome da Filial** (`nomeFilial`) — todos `input[text]` **readonly** —
além de **PARECER Nº:** (`numParecer`), **Data:** (`dataHoraParecer`) e **Justificativa da Solicitação**
(`motivoReqCompra`). A distinção Fluig × ERP está feita **no rótulo do campo**. A contraparte na SC também
foi confirmada: **Nº do Processo Fluig \***, **Nº da Solicitação ERP \*** e **Nº da Cotação ERP \***, e nas
seções de validação o rótulo **Nº SC Origem ERP \***. O cabeçalho do parecer traz ainda a seção
**Gerência / Divisão Requisitante**, exibindo hoje **Gerência de Tecnologia da Informação**.
**Divergências encontradas:** duas, ambas de nomenclatura. (1) O ticket pede *"marcar o número da SC do
Protheus com o rótulo 'ERP' ao lado"*; a implementação **não** colocou um selo/badge ao lado de um campo —
criou **dois campos rotulados**, *Nº da SC do Fluig* e *Nº da SC do ERP*. O objetivo foi atendido, a forma
é outra. (2) O colateral (a) fala em **"Área Demandante"**; **não existe campo com esse rótulo** no
formulário do parecer. O mais próximo é, na SC, a seção *Identificação da(s) Áreas para Parecer Técnico*
com o rótulo **Área \*** (dataset `QB_DEPTO`); no parecer, a área aparece como o **título de seção**
*Gerência / Divisão Requisitante*. Quem for executar o passo 5 precisa saber que o campo a observar
chama-se **Área**, na SC — não "Área Demandante", no parecer.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3416  (ambos · Concluído · SDCASSI-161)

**Título:** Percorrer a Requisição de Compra entregue na DEM10013707 conferindo máscaras nos campos de valor, a filial ao lado dos produtos e o tempo de processamento do schedule.

**Origem:** FSWTBC-3416 — cinco pontos de atenção levantados na apresentação de entrega da DEM10013707: (1) movimentação — deve abrir a Central de Tarefas, não movimentar automaticamente; (2) **faltam máscaras nos campos de valor**; (3) estrutura de busca do parecer técnico; (4) **adicionar a filial ao lado dos produtos**; (5) **PRIORIDADE — lentidão do schedule**: um teste levou **28 minutos** por uma thread que travou a fila e outros dois passaram de **15 minutos**. Os pontos (2) e (4) viraram defeitos corrigidos (FSWTBC-3431 e FSWTBC-3429); (1) e (3) foram classificados como **"Não Contratado"**; (5) foi delegado e fechado **sem número de tempo pós-correção**.

**Módulo/Rota:** Formulário da **Solicitação de Compras** → grade de itens **`tbProdutos`**; Tracker visão **Parecer Técnico** (`PT`); aba **Histórico** da solicitação (tempo de execução).

**Pré-condições**
- SC com ao menos um item, em atividade que permita ver os campos de valor.
- Uma SC recém-movimentada, para medir o tempo do schedule pelo Histórico.
- **Bloqueio:** parcial. Os pontos (2) e (4) são verificáveis por leitura de tela e foram verificados. O ponto (5) exige movimentar uma SC própria e cronometrar — não há SC própria disponível. Os pontos (1) e (3) foram declarados **"Não Contratado"** pelo fornecedor e, portanto, **não têm comportamento correto acordado** para servir de resultado esperado; ficam registrados como pendência de aceite, não como asserção.

**Passos**
1. Abrir uma SC e localizar a grade de itens **`tbProdutos`**.
2. Conferir a máscara de **`Vlr. Total Estimado`**: deve exibir separador de milhar e duas casas (`#.##0,00`).
3. Conferir a máscara de **`Preço Unit. Estimado`** e de **`Quantidade`**.
4. Conferir a máscara de **`Média Histórica`**.
5. No bloco de suplementação de contrato, conferir a máscara de **`Valor fixo`**.
6. Conferir se a grade de itens exibe a **filial ao lado de cada produto**.
7. No Tracker, escolher *Filtrar por* = **Parecer Técnico**, informar um filtro e conferir que a visão responde.
8. Após uma movimentação, abrir a aba **Histórico** e ler o **`Tempo de Execução N s`** registrado.

**Resultado esperado**
- **Todos** os campos de valor da grade de itens exibem máscara monetária brasileira consistente — incluindo **`Média Histórica`** e **`Valor fixo`**.
- A grade de itens mostra a **filial** ao lado de cada produto.
- Ao movimentar, a **Central de Tarefas é aberta** e o processo **não** avança sozinho.
- O tempo de processamento registrado no Histórico fica em **segundos**, não em dezenas de minutos, e nenhuma thread trava a fila.

**Resultado se o defeito reincidir**
- Campos de valor sem máscara; produtos sem indicação de filial; e processamento de **15 a 28 minutos**, com thread travando a fila e liberação manual necessária — exatamente os números registrados na apresentação de entrega.

**Severidade:** Média *(as máscaras isoladamente seriam Baixa; a lentidão do schedule, marcada como PRIORIDADE pelo cliente e fechada sem número pós-correção, sustenta Média)*

**Preparação de massa:** uma SC própria com itens, e uma movimentação controlada para cronometrar o schedule. Para o ponto (5) é preciso, além disso, acesso ao monitoramento da fila — que o Fluig não expõe ao usuário comum; o único proxy é o `Tempo de Execução N s` do Histórico.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **ponto (4) verificado diretamente em tela** — no formulário real da SC 112830 os 15 rótulos por item da grade `tbProdutos` são `Item`, `Produto/Serviço`, `Unidade de Medida`, `Conta Desp ADM`, `Conta Desp BAS`, `Conta Imobilizado`, `Grupo do Produto/Serviço`, `Data de Emissão`, `Data de Necessidade`, `Quantidade`, `Média Histórica`, `Preço Unit. Estimado`, `Vlr. Total Estimado`, `Tipo de Solicitação`, `Observação` — **nenhum é filial**. Nos 76 rótulos únicos do formulário, "filial" só aparece no cabeçalho (`Código da Filial`, `Nome da Filial`) e nos painéis de aprovação (`Cód. Filial Origem`). **Ponto (2) verificado no fonte publicado:** `handleMaskMoneyFields()` (`sc_App_ViewHandler.js:2608-2635`) aplica `mask('#.##0,00')` apenas aos campos `data-money`; para os `data-moneys` a chamada de máscara está **comentada** (`:2624`). O inventário de `form_sc.html` dá `tbprod_valorTotal` (com máscara), `tbprod_quantidade` e `tbprod_precoUnitario` (com `maskMoney`), e **`tbprod_mediaHistorica` e `_suplContValorFixo` sem máscara nenhuma**. Tracker: a visão **Parecer Técnico** (`PT`) existe no combo *Filtrar por*. Central de Tarefas aberta: 10 tarefas a concluir, 246 solicitações, 213 tarefas sob gerência.
**Divergências encontradas:** duas, relevantes. (a) **A filial continua ausente ao lado dos produtos** no formulário renderizado hoje (card 707233, versão de formulário 5000) — o ticket registra o ponto (4) como defeito corrigido em FSWTBC-3429, mas o ambiente de homologação não o exibe; o único lugar em que filial aparece junto do produto é o datatable de SCs centralizadas, e só quando `solCentralizadora == 'Sim'`. Registro como observação, não como prova de que a correção não existe — pode ser questão de versão publicada neste ambiente. (b) `handleMaskMoneyFields()` **não roda nos estados de digitação** (0, 6 *Início* e 11 *Ajustar Informações*), por causa da guarda em `sc_App_ViewHandler.js:105-106` — ou seja, é exatamente enquanto o usuário digita que as máscaras faltam, que é a queixa original. Há ainda **5 blocos de máscara comentados** (`:974`, `:1017`, `:2095`, `:2098`, `:2101`, `:2165`, `:2624`), dois deles `.each()` de corpo inteiramente comentado.
**Dados/massa usados:** leitura do processo 112830 e consulta ao Tracker. Nada digitado, nada movimentado.

---

## CT-FSWTBC-3746  (fluig · Concluído/**Não Contratado** · SDCASSI-221)

**Título:** Conferir que o parecer técnico continua sendo exigido e roteado para a área demandante, com um responsável por área.

**Origem:** FSWTBC-3746 — pedido do cliente para **retirar a obrigatoriedade** de envio do parecer ao Demandante (a decisão passaria ao comprador) e permitir **vincular mais de uma pessoa por centro de custo**. Foi a reapresentação de um pedido já recusado em FSWTBC-3428 e **foi recusado de novo**: resolução **"Não Contratado"**, com a justificativa de que se trata de **melhoria** e que, *"devido à complexidade da solução requerida, não será possível seguir nesse momento sem a execução do fluxo de levantamento e detalhamento"*. O pedido foi canalizado para a V2 da demanda (FSWTBC-3591, MIT044 *"Melhoria de definição do parecer técnico via portal"*), que em agosto/2026 seguia em desenvolvimento sem prazo.

**Módulo/Rota:** Formulário da **Solicitação de Compras**, seção **Identificação da(s) Áreas para Parecer Técnico** (tabela `tbAreasDist`); e **Portal do Comprador** › **Controle De Cotações** › **Parecer Técnico** / **Bloquear Novos Participantes**.

**Pré-condições**
- Uma SC que exija parecer técnico, na etapa em que as áreas são informadas.
- Uma cotação em andamento, para exercitar o bloqueio de novos participantes.
- **Bloqueio:** sim. Este é um caso de **comportamento atual deliberadamente mantido** (pedido recusado). A parte do portal não é executável com a conta de QA — a grade de *Controle De Cotações* volta vazia (404 em `genericQuery`).

**Passos**
1. Abrir o formulário da **Solicitação de Compras** e localizar a seção **Identificação da(s) Áreas para Parecer Técnico**.
2. Conferir que a linha da tabela exige **Área** e **Responsável** e que os dois são **obrigatórios**.
3. Tentar informar **mais de um responsável** para a mesma área/centro de custo.
4. No **Portal do Comprador** › **Controle De Cotações**, abrir uma cotação e acionar **Parecer Técnico**.
5. No modal **Definir Fornecedores para Parecer Técnico**, **sem selecionar nenhum fornecedor**, acionar **Enviar**.
6. Selecionar um ou mais fornecedores e acionar **Enviar**.
7. Voltar à cotação e acionar **Bloquear Novos Participantes** **antes** de o parecer estar concluído.
8. Acompanhar o roteamento: conferir que a solicitação vai para a etapa de parecer da **área demandante** e que o status do demandante aparece no acompanhamento das propostas.

**Resultado esperado**
- A seção **Identificação da(s) Áreas para Parecer Técnico** exige **Área** e **Responsável**, ambos obrigatórios, com **um responsável por linha/área** — a vinculação de mais de uma pessoa por centro de custo **não** está disponível (pedido não contratado).
- O modal **Definir Fornecedores para Parecer Técnico** recusa envio sem seleção, com o alerta **"Nenhum fornecedor selecionado."** e a mensagem **"Verifique a seleção dos fornecedores para enviar ao parecer."**.
- Acionar **Bloquear Novos Participantes** sem o parecer informado é recusado com o alerta **"Parecer Técnico Obrigatório"** e a mensagem **"Antes de bloquear a cotação para novos participantes, é obrigatório informar o parecer técnico."**, e o portal **abre a definição do parecer** em vez de bloquear.
- O parecer **continua sendo roteado à área demandante** — o processo passa pela etapa de parecer técnico da área demandante e o status dela fica visível no acompanhamento das propostas.
- A coluna **Parecer Téc.** da grade de cotações reflete o estado (**Sim**/**Não**).

**Resultado se o defeito reincidir**
- Não há sintoma prévio: o comportamento descrito **é** o atual e foi mantido por decisão. O que este caso protege é o inverso — se algum dia o parecer deixar de ser exigido, ou passar a ser dispensável pelo comprador, **isso não é correção: é a entrega da V2 (FSWTBC-3591)** e precisa ser confirmado como intencional antes de ser aceito como bom.

**Severidade:** Média *(bloqueia o fluxo de cotação enquanto o parecer não é informado; não há risco financeiro direto, mas o parecer é a defesa técnica da escolha do fornecedor)*

**Preparação de massa:** uma SC que exija parecer técnico com áreas informadas, e uma cotação em andamento com fornecedores participantes. Exige matrícula de comprador. Para conferir apenas a estrutura do formulário (passos 1 a 3), o formulário em branco basta.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário da SC (documento 256831) tem a seção **Identificação da(s) Áreas para Parecer Técnico**, com a tabela filha `tbAreasDist` e os campos **Área** (`tbarea_areaTecnica`) e **Responsável** (`tbarea_responsavelArea`), ambos marcados como **obrigatórios**, **um por linha**. O formulário também traz, na tabela de propostas, o campo **Status Área Dem.** (`tbProposta_statusDemandante`), e o script da SC identifica a atividade **68** como **"Parecer Técnico (Área Demandante)"** — ou seja, o roteamento ao demandante segue existindo. No Portal do Comprador estão implementados, com estes textos exatos, o modal **"Definir Fornecedores para Parecer Técnico"** com o botão **Enviar**, a recusa **"Nenhum fornecedor selecionado."** e o bloqueio **"Parecer Técnico Obrigatório"** antes de **Bloquear Novos Participantes**. A parte do portal não foi exercitada (grade vazia).
**Divergências encontradas:** o ticket fala em **"mais de uma pessoa por centro de custo"**; em tela o vínculo é por **Área** (com um **Responsável** por linha), não por centro de custo — o *Centro de Custo* aparece como filtro na *Validação Inicial* e no rateio da SC, em estrutura separada. Além disso, atenção ao ler o resultado deste ticket: **"Não Contratado" significa que o pedido do cliente NÃO foi atendido** — o caso acima afirma o comportamento **atual e mantido**, não o pedido.
**Dados/massa usados:** nenhum — formulário em branco, não submetido.

---

## CT-FSWTBC-4237  (fluig · Concluído · SDCASSI-325)

**Título:** Abrir o parecer de uma SC encaminhada a várias áreas e confirmar que as respostas de todas as áreas aparecem, não só a do parecer principal.

**Origem:** FSWTBC-4237 — quando a SC tem parecer e é encaminhada para **múltiplas áreas**, o botão de Parecer exibia **apenas o parecer principal**, sem as respostas das demais áreas envolvidas. O comprador decidia sem ver justamente a informação que motivou o encaminhamento múltiplo. Corrigido em menos de 24h, **sem comentário técnico**.

**Módulo/Rota:** dois pontos, e o caso precisa cobrir os **dois**:
(a) **Portal do Comprador** › **Avaliação de Propostas** › cartão da proposta › botão **Verificar Parecer Técnico**;
(b) formulário da SC (`wf_solicitacao_compras`), grade de propostas — colunas de status por área. No BPM: `242 - Áreas para Emissão de Parecer Técnico`, `243 - Emitir Parecer Técnico`, `245 - Aguarda Fim Parecer`.

**Pré-condições**
- Uma SC com **parecer técnico solicitado a três ou mais áreas distintas**, com **pelo menos duas** já respondidas e **uma ainda sem resposta** (para provar que a área pendente aparece como pendente, e não some).
- As respostas devem incluir mais de um veredito (*atende*, *supera*, *não atende*), para conferir que cada área mostra o **seu**.
- **Bloqueio:** sim — a conta de QA não resolve matrícula de comprador, então o cartão da proposta (onde fica o botão) não é alcançável, e não há SC com parecer multiárea disponível para esta conta.

**Passos**
1. Abrir **Portal do Comprador** › **Avaliação de Propostas** e abrir a cotação da SC preparada.
2. No cartão da proposta, clicar em **Verificar Parecer Técnico**.
3. Observar o que abre: com **um** processo de parecer, abre direto a instância; com **vários**, deve abrir um seletor.
4. No seletor, conferir que **cada** processo de parecer aparece como uma linha **Processo Nº ⟨número⟩** com a respectiva **Data**.
5. Abrir cada linha e conferir que é o parecer da área correspondente.
6. Voltar ao formulário da SC e, na grade de propostas, conferir a coluna de status por área.
7. Conferir que a área **sem resposta** aparece com o texto **"Sem Parecer"**, nomeada, e não some da lista.
8. Conferir que cada área aparece com **o nome da área/grupo em destaque** seguido do seu veredito.

**Resultado esperado**
- Passo 3/4: havendo **mais de um** processo de parecer, abre o seletor **"Selecionar Parecer Técnico"**, listando **um item por processo**, no formato **Processo Nº ⟨número⟩** com **Data: ⟨data da solicitação⟩**. Nenhuma área fica de fora.
- Havendo **exatamente um**, ele abre direto, sem seletor intermediário.
- Não havendo nenhum, aparece o aviso **"Nenhum processo encontrado para essa cotação!"** — e **não** uma tela em branco.
- Passo 6/8: a grade da SC mostra, **por proposta**, o parecer do **Solicitante** (parecer principal) **e** uma linha para **cada** área consultada, com o nome da área em negrito seguido do seu veredito.
- Passo 7: área ainda não respondida aparece nomeada com **"Sem Parecer"**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O botão de Parecer exibe **apenas o parecer principal**; as respostas das demais áreas consultadas **não aparecem em lugar nenhum** da tela do comprador (evidência do ticket: 4 prints da abertura mostrando o parecer principal isolado).

**Severidade:** Alta *(o comprador decide a proposta vencedora sem enxergar as respostas técnicas das áreas consultadas — a informação que justifica o encaminhamento múltiplo. É decisão de compra tomada com menos informação do que o processo pressupõe)*

**Preparação de massa:** uma SC com parecer técnico encaminhado a **3+ áreas**, com vereditos diferentes entre si e **uma área pendente**, cujo comprador responsável seja o executor. Exige perfis das áreas técnicas para responder os pareceres. **Não criável pela conta de QA.** **Recomendação de processo, tirada do próprio ticket:** Paulo Calixto pediu, no mesmo dia, *"que não sejam cancelados os processos nos quais foram identificados erros, a fim de garantir insumos para a análise"* — a prática de cancelar o processo defeituoso vinha destruindo a evidência. Preserve a instância de massa deste caso.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — a grade de **Avaliação de Propostas** tem a coluna **"Parecer Téc."**; o Portal do Comprador e a rota abrem. Nenhum cartão de proposta foi alcançado (grade vazia). *Lido no fonte publicado* — no bundle do Portal do Comprador existe o botão **"Verificar Parecer Técnico"** (`p-icon: an an-hard-hat`) no cartão da proposta, além de **"Parecer Técnico"** e do modal **"Definir Fornecedores para Parecer Técnico"**. A função `viewFluigTechnicalOpinion` consulta `getProcessIdTechnical({numFilial, numQuote, numSCompra, process: "parecer_tecnico"})` e trata **explicitamente os três casos**: zero → aviso *"Nenhum processo encontrado para essa cotação!"*; **um** → abre direto em `/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=…&app_ecm_workflowview_taskLoadViewMode=true`; **vários** → monta o seletor **"Selecionar Parecer Técnico"** com um item `Processo Nº ⟨N⟩` / `Data: ⟨…⟩` por processo. **É esta ramificação de "vários" que corresponde à correção do ticket.** No widget do formulário da SC (`sc_App_ViewHandler.js`), `handleTreatChild` percorre **todos** os registros de parecer que não são o `parecerAdm` (o principal) e concatena `<b>⟨área⟩</b>: ⟨atende|supera|naoAtende⟩` — ou `<b>⟨área⟩</b>: Sem Parecer` — numa única célula, alimentando `tbProposta_statusTI`, ao lado de `tbProposta_statusDemandante`, que carrega o parecer principal. **Nenhum parecer real foi aberto.**
**Divergências encontradas:** duas. (1) O ticket diz "botão de Parecer"; na tela de hoje o rótulo é **"Verificar Parecer Técnico"**, e há outros dois controles com nome parecido — **"Parecer Técnico"** e **"Definir Fornecedores para Parecer Técnico"** —, o que exige precisão ao executar o caso manualmente. (2) **Achado no fonte:** o campo que carrega **as respostas de todas as áreas** chama-se `tbProposta_statusTI` e é montado por uma chamada literal `handleTreatChild(data, proposta.numProposta, **"TI"**)`. O nome sugere "parecer da área de TI", mas o conteúdo é a **concatenação de todas as áreas**. É nome enganoso herdado, e quem for automatizar ou depurar este caso vai tropeçar nele — vale renomear.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4348  (fluig · Concluído · SDCASSI-362)

**Título:** Conferir na SC que a informação de Parecer Técnico reflete o parecer que realmente ocorreu.

**Origem:** FSWTBC-4348 — na SC 10681 a informação de Parecer Técnico aparecia na aba principal como se o parecer não tivesse ocorrido, embora a SC tivesse passado pelo processo.

**Módulo/Rota:** duas superfícies: (a) formulário da **Solicitação de Compras** (documento 256831) — bloco de propostas (`tbProposta`), campos **Status Area Dem.** e **Status Area TI.**; (b) Portal do Comprador → **Avaliação de Propostas** (`#/avaliacaoPropostas`), coluna **Parecer Téc.** e filtro **Parecer Técnico**.

**Pré-condições**
- Uma SC que tenha passado pelo processo de **Parecer Técnico** (atividades 242 — Áreas Parecer Técnico, 243 — Emitir Parecer Técnico, 245 — Aguarda Fim do Parecer), com parecer emitido para pelo menos um fornecedor.
- **Bloqueio:** conta de QA sem matrícula de comprador (grade vazia) e sem SC própria em etapa de parecer. Não foi aberta SC real para não movimentar processo de terceiros.

**Passos**
1. Abrir a instância da SC em modo consulta e localizar o bloco de propostas do formulário.
2. Conferir, para o fornecedor que recebeu parecer, os campos **Status Area Dem.** e **Status Area TI.**.
3. Abrir `#/avaliacaoPropostas`, filtrar por **Nº do Processo Fluig** dessa SC e conferir a coluna **Parecer Téc.**.
4. Abrir a proposta desse fornecedor e acionar **Verificar Parecer Técnico**.

**Resultado esperado**
- Quando houve parecer, o formulário da SC **não** exibe "Sem Parecer" para o fornecedor avaliado — o texto "Sem Parecer" só é gravado quando o campo de controle `ignorarParecer` está como **"Sim"**.
- Na grade da Avaliação de Propostas, a coluna **Parecer Téc.** mostra a etiqueta **Sim** (verde) para a cotação cujo item tem `C8_XPARTEC = "S"`, e **Não** (vermelho) quando não tem.
- O botão **Verificar Parecer Técnico** encontra o processo do parecer e abre `pageworkflowview` em nova aba; havendo mais de um, apresenta a lista **"Selecionar Parecer Técnico"** com "Processo Nº \<n\>" e a data da solicitação.
- Quando não há processo de parecer, o portal avisa **"Nenhum processo encontrado para essa cotação!"** — e não afirma que houve parecer.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A aba principal da SC informava que não houve parecer técnico embora ele tivesse ocorrido, levando o comprador a pedir novo parecer ou a desconsiderar a avaliação técnica.

**Severidade:** Alta (decisão de compra tomada sobre informação de estado divergente do processo real)

**Preparação de massa:** uma SC com processo de Parecer Técnico concluído para ao menos um fornecedor e um segundo fornecedor sem parecer, para contraste. Depende do time de Compras.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *visto renderizado* — na grade de `#/avaliacaoPropostas` e `#/propostaVencedora` a coluna **Parecer Téc.** existe e o filtro **Parecer Técnico** aparece no painel de filtros. *Lido no fonte publicado* — no bundle, a coluna `{property:"parecerTec",label:"Parecer Téc.",type:"label",labels:[{value:"S",label:"Sim",type:Success},{value:"N",label:"Não",type:Danger}]}`, e `getItems()` derivando `parecerTec` de `C8_XPARTEC` (`"S"` se algum item tiver `C8_XPARTEC = "S"`); a ação `verifyTechnicalOpinion` / `viewFluigTechnicalOpinion` com o aviso "Nenhum processo encontrado para essa cotação!" e o modal "Selecionar Parecer Técnico". No formulário da SC: `ignorarParecer === "Sim"` grava a proposta como `"Sem Parecer","Sem Parecer"`; a leitura do parecer usa os datasets `dsFluig_getProcessoParecerTecSql` e `dsForm_ParecerTecnico`.
**Divergências encontradas:** o ticket fala em "aba principal da SC"; o formulário publicado **não tem abas** (`data-toggle="tab"` não ocorre) — é um formulário de blocos contínuos, e a informação de parecer aparece nos campos **Status Area Dem.** e **Status Area TI.** do bloco de propostas. Fica também registrada a pendência do próprio ticket: o comentário de correção de 18/04 descreve inclusão de legendas (texto idêntico ao do SDCASSI-352), não a sincronização do parecer — não é possível, pelo registro, saber o que foi alterado.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4350  (ambos · Concluído · SDCASSI-366)

**Título:** Após "Retorno para Alçada – Regerar Documento" o processo regera a alçada sozinho, sem nova ação no Portal do Comprador, e o Parecer Técnico segue visível

**Origem:** FSWTBC-4350 — 1º cenário: após o ajuste na Central de Tarefas (só anexo, sem troca de vencedor), o sistema exigia nova ação em *Definir Vencedor Cotação*. Cinco rodadas (SCR preservado como histórico; `C8_XLIBERA` mantido 'S'; UGCTE017 lock); concluído 21/07/2026 (96 dias). Aceito com ressalva: **após o 3º cenário o botão de Parecer Técnico não fica ativo** — reprova hoje por causa nunca corrigida.

**Módulo/Rota:** `wf_solicitacao_compras` 94 → 210 **Validação do Comprador (Alçadas)** → 309 → 225 → 310 → 94; Portal do Comprador › **Definir Vencedor Cotação** (não deve ser necessário) › cartão › **Verificar Parecer Técnico**

**Pré-condições**
- SC com alçada reprovada por motivo documental (falta de anexo), mesmo vencedor.
- **Bloqueio:** exige aprovador de alçada e comprador; conta QA não é comprador.

**Passos**
1. Na tarefa **Validação do Comprador (Alçadas)** (210), anexe o documento e escolha a opção de regerar documento (`<rótulo não documentado>`); envie.
2. **Não** acesse o Portal do Comprador. Acompanhe o histórico por até 10 min.
3. Confirme 309 → 225 (= Sim) → 310 → **94** com a mesma grade de vencedor.
4. Abra *Avaliação de Propostas* › cartão da proposta vencedora › **Verificar Parecer Técnico**.
5. Variante (ressalva): execute o 3º cenário (CT-FSWTBC-4337) e repita o passo 4.

**Resultado esperado**
- Passos 2–3: a SC volta a *Aprovação de Alçadas* **sem** tarefa pendente em *Definir Vencedor Cotação*; nenhuma instância em *Correção* (236); sem 400 *"Nenhum documento SCR encontrado…"*.
- Passo 4: botão **Verificar Parecer Técnico** visível e abrindo o parecer.
- Passo 5: idem — hoje **pode falhar** (ressalva de 17/07/2026: "o ideal é ter o botão sendo exibido").

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC 94165 "parada no Portal" aguardando ação em Definir Vencedor; ou 400 "Nenhum documento SCR encontrado para gerar alcada da cotacao 000500"; botão de Parecer Técnico inativo após o 3º cenário.

**Severidade:** Alta — alçada; e perda de rastro do parecer técnico.

**Preparação de massa:** SC `QA` com alçada reprovada por documento; aprovador e comprador reais. Para a variante, também o cenário 3.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *confirmado por dado* — etapa **210 "Validação do Comprador (Alçadas)"** e o ciclo 309/225/310/94 (reentrada de alçada existe no BPM publicado). *Visto renderizado* — Definir Vencedor Cotação e Avaliação de Propostas abrem. *Lido no fonte publicado* — botão **Verificar Parecer Técnico** sob `ngIf` (condição não lida — provável `C8_XPARTEC`, que o Portal usa como filtro); "Regerar"/"Regenerar" **não existem** no bundle do Portal.
**Divergências encontradas:** o rótulo "Retorno para Alçada – Regerar Documento" não está no Portal do Comprador; deve estar no formulário da SC (210) — `<não documentado>`. A ressalva do botão de Parecer Técnico é **defeito aberto** apesar do status Concluído.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4354  (fluig · Concluído · SDCASSI-368)

**Título:** Bloquear novos participantes de uma cotação só depois do envio concluído e só com parecer técnico informado.

**Origem:** FSWTBC-4354 — o comprador conseguia acionar "Bloquear Fornecedor" durante o envio da cotação, antes de o fornecedor recebê-la, inviabilizando a proposta; e o botão de Parecer não era obrigatório.

**Módulo/Rota:** Portal do Comprador → **Controle De Cotações** (`#/controleCotacao`) → rodapé do cartão da cotação: **Bloquear Novos Participantes**, **Parecer Técnico**, **Notificar Fornecedores**, **Alterar Data de Validade**, **Exportar Dados**.

**Pré-condições**
- Uma cotação recém-disparada, cujo processo esteja em uma das atividades de integração com o ERP (status **Em Integração**).
- Uma segunda cotação já integrada, com fornecedores convidados e **sem** parecer técnico informado (`C8_XPARTEC` vazio).
- **Bloqueio:** conta de QA sem matrícula de comprador — o cartão não é renderizado. **Não executar o bloqueio em cotação real de terceiros**: o passo 4 grava no ERP (`.../cotacao/bloqueiacotacao/<nº>`) e não é reversível pelo portal.

**Passos**
1. Abrir `#/controleCotacao` e localizar a cotação cujo status seja **Em Integração**.
2. Conferir quais botões aparecem no rodapé desse cartão.
3. Localizar a segunda cotação (já integrada, com fornecedores, sem parecer) e acionar **Bloquear Novos Participantes**.
4. Observar o diálogo apresentado — **não confirmar**.

**Resultado esperado**
- Enquanto o status é **Em Integração**, os botões **Bloquear Novos Participantes** e **Parecer Técnico** **não são exibidos** — a condição de exibição é `status.code !== "integracao"` combinada a haver fornecedores na cotação. Também não aparecem quando a cotação não tem nenhum fornecedor.
- Na cotação sem parecer técnico, ao acionar **Bloquear Novos Participantes** aparece o alerta de título **"Parecer Técnico Obrigatório"** com a mensagem **"Antes de bloquear a cotação para novos participantes, é obrigatório informar o parecer técnico."**, botão **Ok**, e o fluxo é desviado para a definição de fornecedores para parecer — **o bloqueio não é executado**.
- Com o parecer já informado, o fluxo pede confirmação em **"Bloquear Novos Participantes — Deseja bloquear novos participantes para a cotação selecionada?"** (Sim/Não); só após o **Sim** a chamada de bloqueio é disparada, e o sucesso é confirmado por **"Participantes Bloqueados — Novos participantes foram bloqueados para a cotação selecionada."**.
- A notificação de erro/aviso aparece centralizada na tela.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O botão de bloqueio ficava ativo durante o envio da cotação, e bloquear nesse intervalo inviabilizava a proposta antes de ela existir; o parecer não era exigido antes do bloqueio; e a notificação de erro aparecia fora do centro da tela ao clicar direto em bloquear participantes.

**Severidade:** Alta (bloqueio em janela indevida trava o processo de compra adiante)

**Preparação de massa:** duas cotações — uma capturada durante a integração com o ERP e outra já integrada, com fornecedores e sem parecer técnico. O instante de integração só o time de Compras/Integração produz. **Massa que o QA não pode criar nem consumir sem escrever no ERP.**

**Verificado em tela:** PARCIAL
**O que foi verificado:** *lido no fonte publicado* — no template do cartão, `*ngIf` de **Bloquear Novos Participantes** = `btnBloquear && status.code!=="integracao" && FORNECEDORES.length>0` e de **Parecer Técnico** = `btnParecer && status.code!=="integracao" && FORNECEDORES.length>0`; `handlerAcessButtons()` deriva `btnBloquear`/`btnParecer` de `c8_xlibera` e `c8_xpartec` (com tratamento do fornecedor genérico `85070508`); `bloquearNovosParticipantes()` consulta primeiro `buildFilter()` = `SC8.C8_FILIAL='…' AND SC8.C8_NUM='…' AND SC8.C8_XPARTEC='' AND SC8.C8_FORNECE != '85070508'` e, havendo itens sem parecer, dispara o alerta "Parecer Técnico Obrigatório" e **retorna sem bloquear**; só então vem `confirmBloqueio()` e `blockQuote()`. O status "integracao" é atribuído por `handlerStatus()` quando o processo está em `NUM_SEQ_ESTADO` 9, 25, 42, 46, 53, 73, 74, 75 ou 78. *Visto renderizado* — apenas que `#/controleCotacao` abre, com "Nenhum dado encontrado".
**Divergências encontradas:** o ticket chama a ação de **"Bloquear Fornecedor"**; na tela o rótulo é **"Bloquear Novos Participantes"**. Não há, no fonte publicado nem no ticket, registro de qual foi a decisão sobre a obrigatoriedade do Parecer levantada pelo cliente — o que existe hoje é a **exigência incondicional** do parecer antes do bloqueio.
**Dados/massa usados:** nenhum — não submetido; nenhum bloqueio foi acionado.

---

## CT-FSWTBC-4669  (ambos · Concluído · SDCASSI-440)

**Título:** Abrir uma SC que exige parecer técnico e ver o fluxo passar por *Emitir Parecer Técnico* sem `"dsTechnicalProcess" is not defined`

**Origem:** FSWTBC-4669 — SC 99403 em produção: `dsTechnicalProcess is not defined`. Erro de JavaScript no BPM por artefato ausente/não
publicado (8ª ocorrência de artefato Fluig faltando). Corrigido em um dia.

**Módulo/Rota:** Fluig → **Solicitação de Compras** → *Áreas para Emissão de Parecer Técnico (242)* → *Emitir Parecer Técnico (243)* (service
task que cria `wf_solicitacao_compras_parecer`) → *Aguarda Finalizar Parecer (245)* · Histórico da SC · datasets `dsFluig_getProcessoParecerTecSql`,
`dsForm_ParecerTecnico` · smoke test: `GET /api/public/ecm/dataset/search?datasetId=<nome>`.

**Pré-condições**
- SC `QA` cujo item/área exija parecer técnico; usuário das áreas para emitir.
- **Bloqueio:** o caminho de parecer exige comprador/áreas (conta de QA não tem); pode-se executar só o smoke test dos datasets.

**Passos**
1. Chamar `GET /api/public/ecm/dataset/search?datasetId=dsTechnicalProcess`, `…=dsFluig_getProcessoParecerTecSql`, `…=dsForm_ParecerTecnico`
   no navegador logado e anotar o status de cada um.
2. Levar a SC até *Emitir Parecer Técnico* e ler o Histórico.
3. Abrir o processo de Parecer criado (`Processo número: <n>` no Histórico) e o Tracker visão *Parecer Técnico*.

**Resultado esperado**
- Passo 1: todo dataset que o BPM referencia responde **200** (`[]` ou dados); nenhum responde `500 java.lang.NullPointerException`.
- Passo 2: "Geração do processo de Parecer Técnico no Fluig executada com sucesso! Processo número: <n>" e "Integração executada com
  sucesso"; nada de `is not defined`.
- Passo 3: parecer listado no Tracker com *Nº Parecer*, *Tipo Parecer*, *Status da Aprovação*.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Histórico: "Falha ao executar evento de serviço … Erro … `dsTechnicalProcess` is not defined" e SC em *Correção (244)*.

**Severidade:** Média

**Preparação de massa:** SC `QA` com parecer exigido, por comprador; o smoke test não exige massa.

**Verificado em tela:** PARCIAL
**O que foi verificado:** Histórico da **99403** (visto renderizado, 15 entradas): *Emitir Parecer Técnico* em 09/06 17:16 → *Aguarda
Finalizar Parecer* → "Processo movimentado automaticamente através de Serviço de finalização do processo de parecer técnico" → … →
fim em 12/06 em *Fim - Processo de Pagamento de Compras* — o caminho funcionou após a correção. Smoke test **hoje**: `dsTechnicalProcess`
→ **500 NullPointerException** (não existe como dataset); `dsFluig_getProcessoParecerTecSql` → 200 (3 registros); `dsForm_ParecerTecnico` →
200; controle inexistente → 500. Processo *Parecer Técnico* com 263 movimentos em *Emitir Parecer Técnico (5)* nas versões 25–27.
**Divergências encontradas:** `dsTechnicalProcess` **não existe como dataset** neste ambiente e mesmo assim o parecer funciona — portanto
o nome do ticket é, muito provavelmente, uma **variável** do script BPM (`dsTechnicalProcess = DatasetFactory…`) e não um dataset publicado;
"not defined" é `ReferenceError` de variável. O smoke test por GET search não detecta esse tipo de regressão — só o Histórico.
**Dados/massa usados:** nenhum — não submetido; leitura de 99403.

---

## CT-FSWTBC-5164  (ambos · Concluído · SDCASSI-544)

**Título:** Abrir a etapa de Parecer Técnico e visualizar as propostas dos fornecedores — sem "aconteceu um erro inesperado"

**Origem:** FSWTBC-5164 — SCs 109131, 109569 e 110567: propostas não disponíveis na etapa de parecer e, após ajustes, "aconteceu um erro inesperado.
Entre em contato com o administrador". Terceiro defeito do ciclo do parecer em duas semanas (522, 523). Corrigido sem causa raiz registrada.

**Módulo/Rota:** Fluig → Solicitação de Compras → *Áreas para Emissão de Parecer Técnico (242)* → *Emitir Parecer Técnico (243)* → subprocesso
**Parecer Técnico** (`wf_solicitacao_compras_parecer`, formulário 256832) → atividade **Emitir Parecer Técnico (5)** → grade de propostas
(`Proposta_empresa`, `Proposta_codFornecedor`, `Proposta_lojFornecedor`, `Proposta_atende`/`Proposta_naoAtende`, `Proposta_anexo`) ·
datasets `dsFluig_getProcessoCotacoes_ParecerSql`, `dsProtheus_getCotacoes_restGetAll`, `dsProtheus_getEncerramentoCotacoes_restGetAll` ·
Tracker → visão *Parecer Técnico*.

**Pré-condições**
- SC `QA` com cotação finalizada e área de parecer atribuída ao executor; ao menos duas propostas recebidas com anexo.
- **Bloqueio:** a conta de QA não é comprador nem área de parecer — nenhuma instância de parecer atribuída a ela. Não movimentar pareceres alheios.

**Passos**
1. Na Central de Tarefas, abrir a tarefa *Emitir Parecer Técnico* do subprocesso.
2. Aguardar a carga e contar as linhas da grade de propostas; abrir o anexo de uma proposta.
3. Marcar *Atende* / *Não atende* numa linha e salvar sem concluir.
4. No Tracker → *Parecer Técnico*, filtrar pelo processo pai e conferir o registro.

**Resultado esperado**
- Passo 2: todas as propostas da cotação aparecem (fornecedor, código, loja), com anexos abrindo no modal do Fluig.
- Nenhum "aconteceu um erro inesperado. Entre em contato com o administrador".
- Passo 4: o parecer consta no Tracker vinculado ao `numProcessoPai`.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Grade de propostas vazia na etapa de parecer; após ajuste, "**aconteceu um erro inesperado. Entre em contato com o administrador**".

**Severidade:** Média

**Preparação de massa:** SC `QA` levada até 242/243 (comprador) e área de parecer em que o executor esteja; propostas com anexo.

**Verificado em tela:** PARCIAL
**O que foi verificado:** datasets **`dsFluig_getProcessoCotacoes_ParecerSql`** (200, com dados: `NUM_PROCES, STATUS, txt_nCot_infForn,
NR_DOCUMENTO_PAI…`), **`dsProtheus_getCotacoes_restGetAll`** (200) e **`dsProtheus_getEncerramentoCotacoes_restGetAll`** (200) existem; campos
`Proposta_*` lidos no fonte publicado `js_256832_App_ViewHandler.js`; atividades **242/243/245/45** vistas renderizadas no `/tasks` das SCs 104276 e
112222; subprocesso `wf_solicitacao_compras_parecer` v27 com atividades 4/5/7/9/13 (1.000 movimentos). Instâncias do ticket hoje: **109131** = SC
`CANCELED` (14/08) em *Aguarda Finalizar Cotação*; **109569 → 404**; **110567** = **Faturamento de Contratos** `FINALIZED` (04/08). Tela do parecer
não aberta (sem tarefa atribuída).
**Divergências encontradas:** das três SCs do ticket, **nenhuma** está em parecer neste tenant: 109569 não existe, 110567 é um Faturamento e 109131
foi cancelada. O ticket cita as instâncias de outro ambiente.
**Dados/massa usados:** nenhum — não submetido.

---
