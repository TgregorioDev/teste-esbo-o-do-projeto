<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# Portal do Comprador

Casos de teste E2E do Fluig — módulo Portal do Comprador.

| | |
|---|---|
| Casos neste arquivo | 147 |
| Verificados em tela | 5 total · 139 parcial · 2 não |

> **Como ler.** Cada caso descreve o comportamento **correto esperado hoje**. A maioria dos
> defeitos de origem já foi corrigida — o caso é de regressão: se reprovar, o defeito voltou.
> Os que reprovam hoje por causa nunca corrigida estão marcados no próprio caso.
> *Verificado em tela* diz o que foi conferido no ambiente de homologação em 08/09/2026;
> **PARCIAL** costuma significar que a conta de QA não tem o perfil necessário (comprador,
> gestor, fiscal, fornecedor), não que o caso seja inválido.

---

## CT-FSWTBC-628  (protheus · Concluído)

**Título:** Verificar que a atualização da cotação no ERP (após a recepção das propostas) conclui sem erro de rotina padrão e a negociação avança para Validação da Proposta

**Origem:** FSWTBC-628 — "[DEM10009644] Erro na atualização da Cotação": `POST /api/v1/fluig/compras/cotacao/atualiza/000064` devolvia `array out of bounds (1 of 0)`; stack `MAFISTG (MATXFIS.PRX:13565) ← A150GRAVA/A150DIGITA/MATA150 via MSEXECAUTO ← UCOME031` (camadas DATA/SERVICES/CONTROLLER). Diagnóstico: bug do padrão TOTVS (`aNfItem` vazio; `MaFisTG` chamada sem checar o gerenciador de atributos), disparado pela existência da tabela **F2D** após o acumulado; corrigido com o pacote **DMANMAT02-50462** (atualiza MATA150). Conclusão do dev: "atualização aplicada em produção sem os devidos testes".

**Módulo/Rota:** Fluig → **Negociação de Cotação de Produtos e Serviços** (`wf_negociacao_cotacao_prod_serv`, form 256835) e **Cotação de Produtos/Serviços** (256834) → atividades *Recepção de Propostas* → **Integração com ERP** → *Validação da Proposta*; campo **Erro retornado pelo ERP Protheus**; aba **Histórico**; **Logs Protheus** → *Erros CV8*. No ERP: **MATA150 (Cotações)**, `UCOME031`.

**Pré-condições**
- SC aprovada pelo comprador, cotação gerada pelo Protheus (`Nº da Cotação` preenchido) e pelo menos uma proposta enviada pelo Portal do Fornecedor.
- Pacote DMANMAT02-50462 (ou superior) aplicado no RPO; tabela F2D presente (é o gatilho do defeito).
- **Bloqueio:** a conta de QA não tem matrícula de comprador nem credencial de fornecedor — a integração só é acionada por esses perfis. Leitura de instâncias existentes é possível.

**Passos**
1. (Fornecedor) Enviar a proposta no Portal do Fornecedor; (Comprador) movimentar *Recepção de Propostas* pela Central de Tarefas.
2. Abrir a instância da negociação → aba **Histórico**: localizar a entrada da atividade **Integração com ERP** e ler a mensagem.
3. Na aba **Formulário**, ler o campo **Erro retornado pelo ERP Protheus**.
4. Abrir **Logs Protheus** → *Erros CV8*, filtro *"Mensagem, detalhe ou processo"* = nº da cotação, **Consultar**.
5. (Protheus) Compras → Cotações (**MATA150**): abrir a cotação e conferir os itens/preços da proposta.

**Resultado esperado**
- Passo 2: *"Integração executada com sucesso - Tempo de Execução N s"* e a próxima atividade é **Validação da Proposta**.
- Passo 3: campo **vazio**.
- Passo 4: nenhuma linha CV8 com `array out of bounds` / `MAFISTG` / `MATXFIS` para a cotação.
- Passo 5: cotação com os valores da proposta gravados.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Histórico com falha na *Integração com ERP*; campo **Erro retornado pelo ERP Protheus** = `array out of bounds (1 of 0)` (origem `MAFISTG` em `MATXFIS.PRX` linha 13565); instância desviada para *Correção*; propostas inseridas à mão no ERP.

**Severidade:** Alta *(bloqueia toda cotação com proposta; regressão típica de pacote de atualização)*

**Preparação de massa:** uma SC do próprio executor levada a cotação por um comprador e uma proposta de fornecedor de homologação — quem prepara: comprador da CASSI + fornecedor de teste. **Após qualquer atualização de RPO/pacote**, este caso deve ser o primeiro a rodar (é regressão de pacote).

**Verificado em tela:** PARCIAL
**O que foi verificado:** formulários 256834 e 256835 abertos em branco (atividade *Início*): cabeçalho *Nº da Cotação, Nº da SC do Fluig, Nº da SC do ERP, Código da Filial, Comprador, Validade da Cotação, Validade da Proposta, Tipo de Frete* e grade de itens. Logs Protheus aberto com a aba *Erros CV8* e o campo *"Mensagem, detalhe ou processo"* (404 na consulta — ambiente).
**Divergências encontradas:** o rótulo **"Erro retornado pelo ERP Protheus"** não é visível na atividade *Início* dos dois formulários (só nas atividades de integração — §5-B); o endpoint `cotacao/atualiza` não aparece nos fontes de formulário baixados — a chamada é feita pelo dataset/evento no servidor, não pelo front.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-641  (fluig · Concluído)

**Título:** Comprador valida a proposta do fornecedor na negociação e o registro da validação é gravado sem erro.

**Origem:** FSWTBC-641 — "[745992] Erro ao validar a proposta do fornecedor". O ticket veio no
template padrão, **sem conteúdo técnico**: registra apenas os participantes da sala. Não há mensagem
de erro nem causa registrada.

**Módulo/Rota:** *Negociação de Cotação de Produtos e Serviços*
(`/portal/p/1/pageworkflowview?processID=wf_negociacao_cotacao_prod_serv`, iframe `256835`), seção
**Validação de Proposta**. Contraparte de consulta: **Portal do Comprador**
(`/portal/p/1/portal-do-comprador`) → *Avaliação de Propostas*.

**Pré-condições**
- Cotação enviada ao fornecedor e proposta recebida (instância de negociação criada pela integração —
  ela nasce por `consumerkeycompras`, não por início manual).
- Instância parada na etapa de **Recepção/Validação de Propostas**, atribuída ao **comprador real** da
  cotação.
- **Bloqueio:** **sim** — a conta de QA `TOTVS-FS` **não resolve matrícula de comprador**
  (`dsProtheus_getCompradores_restGetAll` é chamado com `Y1_USER = "undefined"`), o que barra a
  família cotação/alçada para este login. É limitação de conta, não defeito.

**Passos**
1. Abrir a instância de *Negociação de Cotação de Produtos/Serviços* pela Central de Tarefas.
2. Conferir o bloco **Lista de Produtos/Serviços** e os totais **Sub Total**, **Valor total do IPI**,
   **Valor total do Frete**, **Valor total de Descontos**, **Valor total do Pedido**.
3. Na seção **Validação de Proposta**, marcar **Proposta Validada?** = **Sim**.
4. Preencher **Justificativa**.
5. Acionar **Enviar**.
6. Reabrir a solicitação e ler a aba **Histórico**.

**Resultado esperado**
- A seção **Validação de Proposta** grava sem erro: **Responsável**, **Email do Solicitante**,
  **Data da Validação** e **Hora da Validação** vêm preenchidos automaticamente e permanecem
  somente leitura.
- **Proposta Validada?** aceita *Sim* e *Não*; **Justificativa** é obrigatória e aceita texto.
- O aviso **"A aprovação da negociação deve ser realizada pelo Protheus."** continua visível — a
  validação no Fluig **não** substitui a aprovação no ERP.
- O Histórico registra a movimentação com usuário, atividade origem e destino.
- Nenhuma mensagem de erro; a instância **não** volta para *Correção*.

**Resultado se o defeito reincidir**
- Erro ao acionar a validação da proposta; a validação não é gravada. Mensagem exata
  `<não documentado>` — o ticket não registrou texto de erro nem evidência.
- Pista observável hoje: instâncias de *COTAÇÃO DE PRODUTOS E SERVIÇOS* paradas em **Correção**
  (há três na Central de Tarefas desta conta: 112113, 112311, 112312).

**Severidade:** Média *(bloqueia o fluxo de negociação; não decide valor sozinho, pois a aprovação é no Protheus)*

**Preparação de massa:** uma negociação viva (SC → cotação → proposta do fornecedor) e uma conta de
**comprador** cadastrada no Protheus (`Y1_USER` resolvível). Nada disso é criável pelo executor com a
conta atual: depende do fornecedor enviar proposta e do cadastro de comprador no ERP.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de *Negociação de Cotação de Produtos/Serviços* foi aberto
(iframe `256835`) e a seção **Validação de Proposta** existe, com os campos `txt_respValid`
(**Responsável**), `txt_emailResp` (**Email do Solicitante**), `txt_validData` (**Data da Validação**),
`txt_horaValid` (**Hora da Validação**) — os quatro **somente leitura** —, os rádios
`propostaValidada` (**Proposta Validada?** *Sim*/*Não*, editáveis) e a textarea `txta_justiValid`
(**Justificativa**, editável). O texto **"A aprovação da negociação deve ser realizada pelo Protheus."**
está na tela. Confirmado também que **CNPJ/CPF**, **Razão social**, **Comprador**, **Validade da
Cotação**, **Validade da Proposta** e todos os totais são `readonly` — o único outro editável é
**Tipo de Frete** (`sl_tipoDeFrete`).
**Divergências encontradas:** o ticket fala em "proposta do fornecedor"; na tela o rótulo é
**Validação de Proposta**, dentro do processo de **Negociação** (não da Cotação, que é onde o módulo
do ticket foi classificado). O formulário de *Cotação* (`256834`) **não** tem seção de validação de
proposta — ele traz *Informações p/ Parecer Técnico*.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-653  (protheus · Concluído)

**Título:** Verificar que a atualização da cotação aceita proposta de valor alto (13 inteiros + 2 decimais em C8_TOTAL) e que erro de domínio não volta como HTTP 401

**Origem:** FSWTBC-653 — "Erro na atualização da cotação": `code: 401 ... Data width error - Field: C8_TOTAL Value: 123456789123.449997`. Prova do custo da ampliação de casas decimais do FSWTBC-61 (C8_TOTAL para 13+2) aplicada de forma inconsistente; o ERP devolve **401** para erro de negócio (o mesmo 401 reaparece no SDCASSI-496). Parado 62 dias, fechado em lote.

**Módulo/Rota:** Fluig → **Negociação de Cotação** / **Cotação** → atividade **Integração com ERP**, campo **Erro retornado pelo ERP Protheus**, aba **Histórico**; **Portal do Comprador** → *Avaliação de Propostas* (coluna **Valor Final** = `C8_TOTAL`, `type:"currency"`). No ERP: **SX3 → SC8 → C8_TOTAL** (tamanho/decimais), **MATA150**.

**Pré-condições**
- Dicionário com **C8_TOTAL = 13 inteiros + 2 decimais** (e os campos-irmãos `C8_PRECO`, `C8_VALIPI`, `C8_VLDESC`, `C8_VALFRE` compatíveis).
- Cotação gerada com proposta cujo item tenha quantidade × preço ≥ **1.000.000.000,00**.
- **Bloqueio:** sem comprador/fornecedor na conta de QA; sem credencial de Protheus para o SX3.

**Passos**
1. (Fornecedor) Enviar proposta com um item de `Qtde. × Valor Unit.` = **9.999.999.999,99**.
2. (Comprador) Movimentar *Recepção de Propostas*; abrir **Histórico** e o campo **Erro retornado pelo ERP Protheus**.
3. Portal do Comprador → *Avaliação de Propostas*: ler **Valor Final** da proposta.
4. Repetir com um total que **exceda** o campo (14 inteiros) e ler a resposta.

**Resultado esperado**
- Passos 1–3: integração com sucesso; **Valor Final** = `R$ 9.999.999.999,99`, sem truncar nem arredondar; campo de erro vazio.
- Passo 4: a recusa vem como **erro de negócio legível** (mensagem que cita o campo e o limite) e com status HTTP de erro de cliente/servidor coerente (**400/422/500**), **nunca 401**; a instância vai para *Correção* com o texto no campo de erro.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `code: 401 ... Data width error - Field: C8_TOTAL Value: 123456789123.449997` no campo de erro; o 401 leva o diagnóstico para "sessão/credencial" em vez de "tamanho de campo".

**Severidade:** Alta *(proposta de alto valor rejeitada; dicionário inconsistente entre bases)*

**Preparação de massa:** SC + cotação + proposta de valor alto, preparadas por comprador e fornecedor de homologação; conferência do SX3 pelo administrador do Protheus.

**Verificado em tela:** PARCIAL
**O que foi verificado:** formulários 256834/256835 abertos em branco; Tracker com o campo *Nº da Cotação*; conhecimento do fonte publicado do Portal do Comprador (lotes anteriores): coluna `C8_TOTAL` = *Valor Final*, `type:"currency", format:"BRL"`, e o total da proposta calculado como `C8_PRECO × C8_XQTAUDI` ou `C8_TOTAL` menos IPI/desconto mais frete.
**Divergências encontradas:** o Portal do Comprador está sem dados hoje (`genericQuery` 404 — ambiente). O rótulo *Erro retornado pelo ERP Protheus* não está visível na atividade *Início*.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-692  (fluig · Concluído)

**Título:** O comprador movimenta um processo de Negociação de Cotação e ele avança com os valores formatados, sem "NaN" em nenhum campo.

**Origem:** FSWTBC-692 — "[Suporte Fev/2025 - DEM10009644] - Erro processo de negociação não
movimenta". Seis processos afetados (**6291, 5631, 4057, 5080, 6261, 5162**), com o erro **`NaN`**
entregue ao usuário — cálculo sobre valor não numérico (campo vazio convertido sem validação).
Ticket pai das subtarefas 707/708/709; fechado em 1 dia sem registro da causa.

**Módulo/Rota:** *Negociação de Cotação de Produtos e Serviços*
(`wf_negociacao_cotacao_prod_serv`, formulário `256835`) → seções **Lista de Produtos/Serviços** e
**Validação de Proposta**. Operação real pelo **Portal do Comprador**
(`/portal/p/1/portal-do-comprador`) com **"Atuar como"** o comprador titular.

**Pré-condições**
- Uma instância de Negociação viva, gerada a partir de uma Cotação com proposta de fornecedor
  lançada (a Negociação é subprocesso; não nasce sozinha).
- Ao menos um item com campo numérico **vazio ou zerado** (valor unitário, desconto, alíquota de
  IPI ou frete) — é exatamente a condição que produzia `NaN`.
- Perfil de comprador (ou delegação "Atuar como") para movimentar.
- **Bloqueio:** **parcial.** A conta de QA não resolve matrícula de comprador
  (`dsProtheus_getCompradores_restGetAll` é chamado com `Y1_USER = "undefined"`) — limitação
  conhecida da conta, não defeito. Além disso, movimentar uma negociação real é **escrita em
  processo de terceiro**, vedada nesta rodada. O formulário e seus campos foram inspecionados
  sem submissão.

**Passos**
1. Abrir o Portal do Comprador e selecionar **"Atuar como"** o comprador titular da negociação.
2. Localizar a negociação e abri-la (ou abrir a solicitação pela **Central de Tarefas**).
3. Na seção **Lista de Produtos/Serviços**, deixar um campo numérico do item vazio
   (**Valor Unit.**, **Desconto**, **Alíq. IPI** ou **Valor do Frete**).
4. Ler os totais do bloco de fornecedor: **Sub Total \***, **Valor total do IPI \***,
   **Valor total do Frete \***, **Valor total de Descontos \***, **Valor total do Pedido \***.
5. Preencher **Validação de Proposta**: marcar **Sim/Não** e escrever a **Justificativa \***.
6. Movimentar a solicitação (**Enviar**).
7. Ler a aba **Histórico** e o campo **Erro retornado pelo ERP Protheus** (`#msgerro`).

**Resultado esperado**
- Nenhum campo de tela exibe o literal **`NaN`** — campo numérico vazio é tratado como **0** e
  formatado no padrão pt-BR (`0,00`).
- Os totais são calculados e exibidos como número; **Valor total do Pedido** é coerente com
  Sub Total + IPI + Frete − Descontos.
- A movimentação **conclui**: a instância sai da etapa atual e o Histórico registra a transição.
- O campo **Erro retornado pelo ERP Protheus** fica **vazio** no caminho feliz; havendo falha de
  integração, ele traz a mensagem do ERP em texto legível — nunca `NaN`.

**Resultado se o defeito reincidir**
- O processo **não movimenta** e o usuário recebe **`NaN`** (mensagem literal do ticket).
  Reprodução histórica nos processos **6291, 5631, 4057, 5080, 6261, 5162**.

**Severidade:** Alta *(trava a negociação e o valor exibido ao comprador deixa de ser confiável — decisão de compra sobre número inválido)*

**Preparação de massa:** uma Negociação em etapa movimentável, oriunda de Cotação **com proposta
lançada pelo fornecedor**, e com pelo menos um item de valor zerado/vazio. Quem prepara: comprador
CASSI (ciclo de cotação) + fornecedor (lançamento da proposta) — a conta de QA não faz nenhum dos
dois. Alternativa mais barata: pedir à CASSI um processo de homologação já nesse estado.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de *Negociação de Cotação de Produtos/Serviços* (iframe
`256835`) abre completo, com as seções **Identificação do Processo / Solicitante**, **Informações
do Fornecedor**, **Endereço**, **Contatos**, **Identificação do(s) Produto(s)/Serviço(s)**,
**Lista de Produtos/Serviços** e **Validação de Proposta**. Confirmados em tela os campos de
total **Sub Total \***, **Valor total do IPI \***, **Valor total do Frete \***, **Valor total de
Descontos \*** e **Valor total do Pedido \*** (todos `readonly` na abertura avulsa), os campos de
item `txt_valorUni`, `txt_desconto`, `txt_aliqIpi`, `txt_valorTot`, `txt_vlrFrete`, e o campo
**"Erro retornado pelo ERP Protheus \*"** (`textarea#msgerro`) — a superfície de erro de
integração citada no briefing. Estado vivo: das 100 instâncias mais recentes de
`wf_negociacao_cotacao_prod_serv`, **nenhuma está aberta**; 50 chegaram a *24 - Fim*, 39 estão em
*20 - Validação da Proposta* e 11 em *8 - Recepção de Propostas* — ou seja, **negociações vêm
movimentando** nesta base.
**Divergências encontradas:** o formulário aberto avulso é um *shell* fora de contexto — CNPJ/CPF,
Validade da Cotação e Validade da Proposta vêm `readonly` e a lista de produtos vem vazia; o ponto
de entrada real é o Portal do Comprador. Os seis números do ticket (6291, 5631, …) são de outra
base/numeração: as instâncias atuais estão na casa de **112.9xx–113.2xx**.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1323  (protheus · Concluído · Não será feito)

**Título:** Verificar que o contrato gerado pela integração grava o mesmo número de cotação da SC/negociação de origem

**Origem:** FSWTBC-1323 — "Erro número de cotação nos contratos em produção". Resolução **Não será feito**: *"ainda não foi descoberto qual cenário ocorre o erro"*; proposta de instrumentar (*log do campo*) não executada; encerrado por informação verbal. **Defeito intermitente sem cenário conhecido** — o caso serve de rede de detecção, não de reprodução.

**Módulo/Rota:** Fluig → **Tracker** (`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`) → *Filtrar por* = Solicitação de Compras, filtros **Nº da Cotação** e **Número do Contrato**; **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) → ação **Solicitação de Compra** da linha; dataset `dsProtheus_getContratosxFornecedores_restGet` (`CN9_NUMCOT`). No ERP: **CNTA120** → campo *Nº Cotação* (`CN9_NUMCOT`).

**Pré-condições**
- Contrato gerado pela integração Fluig → GCT (SC de *Tipo de Compra* = Contrato, *Tipo de Solicitação* = Nova Contratação) com cotação vencedora.
- Conta com acesso ao Tracker e ao Acompanhamento de Contratos (a conta de QA tem).
- **Bloqueio:** parcial — o dataset de contratos e o Tracker respondem para a conta de QA; a **geração** de contrato novo exige comprador/alçada (perfis que a conta não tem). Verificação sobre massa existente é possível.

**Passos**
1. No **Acompanhamento de Contratos**, filtrar um contrato *Vigente* nascido do Fluig e clicar em **Solicitação de Compra** na coluna *Ação*; anotar o nº do processo Fluig e o **Nº da Cotação** exibido na SC.
2. No **Tracker**, *Filtrar por* = Solicitação de Compras, **Número do Contrato** = o contrato; **Pesquisar Registro**; ler a coluna de cotação da linha.
3. Repetir com *Filtrar por* = Negociação de Cotação de Produtos e Serviços, **Nº da Cotação** = o número lido; confirmar que a negociação devolvida é a do mesmo contrato/fornecedor.
4. Consultar `dsProtheus_getContratosxFornecedores_restGet` (`BranchId`, `CN9_NUMERO`) e ler `CN9_NUMCOT`.
5. (ERP) Em **CNTA120**, visualizar o contrato e ler *Nº Cotação*; em **MATA150**, conferir que a cotação `C8_NUM` = `CN9_NUMCOT` tem o mesmo fornecedor/loja do contrato.

**Resultado esperado**
- Passos 1–4: **um único número de cotação** em todas as telas — SC, negociação, dataset (`CN9_NUMCOT`, 6 dígitos) — e ele pertence ao mesmo fornecedor do contrato.
- Passo 5: `CN9_NUMCOT` = `C8_NUM` da cotação vencedora; `C8_FORNECE/C8_LOJA` = `CN9_FORNEC/CN9_LJFORN`.
- Contratos gerados manualmente no ERP podem ter `CN9_NUMCOT` vazio — isso não é defeito.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Contrato em produção com número de cotação diferente do da negociação de origem (ou de outro processo) — cenário e mensagem `<não documentado>` (o próprio ticket registra que o cenário nunca foi identificado).

**Severidade:** Média *(rastreabilidade compra → contrato; não altera valor)*

**Preparação de massa:** nenhuma a criar — usar contratos com `CN9_NUMCOT` preenchido (137 hoje; ex.: `00002-2025-1501` → `000017`, `00001-2025-1501` → `000028`, `00051-2026-5303` → `000521`). Recomenda-se ao time executar a **instrumentação sugerida no ticket** (log de alteração de `CN9_NUMCOT`) para capturar o cenário intermitente.

**Verificado em tela:** PARCIAL
**O que foi verificado:** Tracker aberto com os filtros **Nº da Cotação** e **Número do Contrato** presentes; Acompanhamento de Contratos aberto (845 linhas) com a ação **Solicitação de Compra** por linha; dataset de contratos lido — `CN9_NUMCOT` preenchido em 137 de 860, sempre com 6 dígitos, e `CN9_XCOT` vazio em todos. Não foi possível fechar o cruzamento SC × contrato por dataset: `dsForm_RequisicaoCompraContratacao` filtrado por `numContrato`/`nrContrato` devolveu 0 linhas para os quatro contratos testados (numa chamada anterior devolveu 2 linhas com `numCotacao = 000550` para `00056-2026-5303` — inconsistente, tratado como instabilidade).
**Divergências encontradas:** o contrato `00056-2026-5303`, que a SC 112961 declara gerado (`pedidoContratoGerado = Sim`), **não é devolvido pelo dataset de contratos em nenhuma situação (01–10)**, enquanto `00051-2026-5303` (situação 04) é. Ou a integração gravou o contrato numa filial fora de `BranchId=*`, ou o número no formulário não corresponde ao do ERP — vale conferir no CNTA120.
**Dados/massa usados:** nenhum — não submetido; leitura de 00002-2025-1501, 00001-2025-1501, 00051-2026-5303, 00056-2026-5303 e da instância 112961.

---

## CT-FSWTBC-1432  (FSWTBC-1432 · ambos · Concluído)

**Título:** Gerar a alçada de uma cotação e confirmar que os aprovadores são retornados sem erro de integração.

**Origem:** FSWTBC-1432 — erro ao gerar alçada de cotação. Encerrado com a frase que resume a
instabilidade do ambiente: *"o chamado pode ser encerrado, pois **voltou a funcionar sem necessidade de
manutenções**"*. Falha transitória, provavelmente do REST do Protheus, sem causa investigada; ficou 32
dias em PAUSADO CLIENTE.

**Módulo/Rota:** Fluig → **Portal do Comprador** → *Avaliação de Propostas* / *Definir Vencedor Cotação*;
processo **Cotação de Produtos e Serviços**; conferência dos aprovadores pelo **Tracker → Aprovadores SC**.

**Pré-condições**
- Cotação com propostas recebidas, pronta para a etapa de alçada.
- Alçadas cadastradas no Protheus (AL/DHL) e comprador cadastrado na SY1.
- Integração REST do Protheus no ar.
- **Bloqueio:** (1) o cadastro de alçada vive no **Protheus** (AL/DHL) — **sem credencial** e fora do
  alcance da automação; (2) a conta de QA **não resolve matrícula de comprador**, então não há cotação
  para levar à alçada; (3) sendo falha **transitória**, o caso não reproduz sob demanda: ele vale como
  **verificação de disponibilidade**, a ser executada em janela saudável e repetida quando houver
  suspeita. Âncora no Fluig: campo **"Erro retornado pelo ERP Protheus"** e **Tracker → Aprovadores SC**.

**Passos**
1. Autenticar no Fluig com o perfil de **comprador**.
2. Abrir o **Portal do Comprador** e, em *Acesso Rápido*, escolher **Avaliação de Propostas**.
3. Selecionar a cotação de referência e prosseguir até a etapa que **gera a alçada** de aprovação
   (*Definir Vencedor Cotação*).
4. Aguardar o retorno da integração que monta a lista de aprovadores.
5. Abrir o **Tracker**, marcar **Aprovadores SC** e pesquisar pelo **Nº do Processo Fluig** correspondente.
6. Conferir o campo **Erro retornado pelo ERP Protheus** no formulário da cotação.

**Resultado esperado**
- A alçada é gerada e a lista de **aprovadores** é retornada e exibida, coerente com o valor da cotação.
- Nenhuma mensagem de erro de integração aparece na tela.
- O campo **Erro retornado pelo ERP Protheus** permanece **vazio**.
- No **Tracker → Aprovadores SC**, os aprovadores do processo aparecem listados.
- O processo avança para a etapa de aprovação, sem ficar preso na geração da alçada.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro ao gerar a alçada de cotação, impedindo o avanço do processo. O ticket não registra a mensagem
  exata — `<mensagem não documentada>` — e a falha se resolveu sozinha, sem manutenção.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o **Portal do Comprador** abre com o bloco *Acesso Rápido* e os quatro itens
**Validação Inicial**, **Controle De Cotações**, **Avaliação de Propostas** e **Definir Vencedor
Cotação** — o caminho do caso existe. Consegui navegar até **Controle De Cotações** (rota
`#/controleCotacao`, botão **Filtrar**), que retornou **"Página 1 de 0 / Nenhum dado encontrado"**; os
outros três itens não responderam ao clique dentro do tempo de espera e permaneceram na rota `#/`. Na
carga, o portal executa `dsProtheus_getUser_restGetByEmail`, `dsProtheus_getCompradores_restGetAll` e
`GET /api/public/ecm/dataset/search?datasetId=dsCount_validInicialCompras&filterFields=matriculaComprador,TOTVS-FS`.
Confirmei ainda que o **Tracker** oferece o filtro **Aprovadores SC**, que é onde a alçada gerada se
torna observável no Fluig.
**Divergências encontradas:** **duas**. (1) `dsProtheus_getCompradores_restGetAll` é chamado com
**`Y1_USER = "undefined"`** para a conta TOTVS-FS — a conta não tem matrícula de comprador resolvida,
o que explica a lista vazia e **impede** executar o caso com este login. (2) Os itens *Validação
Inicial*, *Avaliação de Propostas* e *Definir Vencedor Cotação* não navegaram ao clique (permaneceram
em `#/`), enquanto *Controle De Cotações* navegou normalmente — pode ser efeito da ausência de
matrícula de comprador, mas fica registrado como divergência a confirmar com um login de comprador real.
**Dados/massa usados:** nenhum — não submetido. Somente leitura.

---

## CT-FSWTBC-1823  (fluig · Concluído)

**Título:** Aprovado o parecer técnico das áreas, as propostas dos fornecedores aparecem na grade da etapa de negociação do comprador.

**Origem:** FSWTBC-1823 — "[CASSI - BH] - Suporte Maio/2025] - Não carregou as propostas dos
fornecedores após aprovação do Parecer das áreas. Nº 26498". Quebra no elo entre a **aprovação do
parecer** e a **exibição das propostas**, o que impede a análise da cotação. O ticket cita a
solicitação nº 26498 e não traz mais descrição.

**Módulo/Rota:** Solicitação de Compras → seção **Validação do Comprador (Definir Negociação)**
(`panelApprovalBuyer`), tabela `tbProposta`. Etapa **199** (`validacaoCompradorNegociacao`),
imediatamente após **245** (`aguardaFimParecer`) e **243** (`emitirParecerTecnico`).

**Pré-condições**
- SC com cotação gerada e **propostas enviadas por pelo menos dois fornecedores**.
- Áreas de parecer técnico distribuídas (seção **Áreas para Emissão para Parecer Técnico**,
  tabela `tbAreasDist`) e **pareceres emitidos e aprovados**.
- Executor autenticado como o **comprador** responsável.
- **Bloqueio:** **sim** — a conta de QA não resolve matrícula de comprador
  (`Comprador não encontrado.`), o que fecha a etapa de comprador para este login; e o cenário exige
  percorrer cotação e parecer, que envolvem submissão e credencial de fornecedor.

**Passos**
1. Concluir a emissão e a aprovação do **parecer técnico** de todas as áreas distribuídas.
2. Abrir a SC na etapa **Validação do Comprador (Definir Negociação)**.
3. Expandir a seção e conferir a grade de propostas.
4. Conferir as colunas **Proposta**, **Versão**, **Fornecedor**, **Situação Par. Area Dem.**,
   **Situação Par. Areas** e **Enviar para Negociação?**.
5. Conferir que **cada fornecedor que enviou proposta** tem linha na grade.
6. Marcar **Enviar para Negociação?** e preencher **Observações** — sem enviar.

**Resultado esperado**
- A grade `tbProposta` é **repovoada** ao entrar na etapa e lista **uma linha por proposta recebida**.
- **Situação Par. Area Dem.** e **Situação Par. Areas** refletem o parecer aprovado de cada área —
  e não ficam em branco.
- Nenhum fornecedor que enviou proposta fica de fora da grade.
- As colunas **Proposta** e **Versão** trazem os números vindos do ERP.
- O comprador consegue marcar **Enviar para Negociação?** por linha.

**Resultado se o defeito reincidir**
- Após a aprovação do parecer das áreas, a grade de propostas **não carrega** — fica vazia — e a
  análise da cotação não pode prosseguir. Mensagem exata `<não documentado>`; o ticket registra a
  ocorrência na solicitação **nº 26498**.

**Severidade:** Média *(bloqueia a etapa de negociação do comprador; o dado da proposta não se perde,
apenas não é exibido)*

**Preparação de massa:** uma SC com cotação enviada a **dois ou mais** fornecedores, propostas
efetivamente recebidas, áreas de parecer distribuídas e **pareceres aprovados**. Exige credencial de
fornecedor (para as propostas) e conta de comprador válida no ERP — dois itens que faltam nesta rodada.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a seção **Validação do Comprador (Definir Negociação)** existe no
formulário, oculta, com a tabela `tbProposta` e os cabeçalhos **Proposta \***, **Versão \***,
**Fornecedor \***, **Situação Par. Area Dem. \***, **Situação Par. Areas \*** e
**Enviar para Negociação? \***, além dos campos **Responsável \***, **Email do Responsável \***,
**Data da Validação \***, **Hora da Validação \*** e **Observações \***. Existe também a seção
**Identificação da(s) Áreas para Parecer Técnico** / **Áreas para Emissão para Parecer Técnico**
(`tbAreasDist`, colunas **# \***, **Área \***, **Responsável \***), que é a origem do parecer.
Confirmado no código que, **e somente** na etapa 199, a grade de propostas é **limpa e reconstruída**
a partir do cruzamento entre o parecer técnico e a lista de cotações — o que explica por que a falha
do ticket aparece exatamente "após a aprovação do parecer". Há um desvio alternativo quando o campo
de controle `ignorarParecer` vale `"Sim"`: nesse caso a grade é montada direto das cotações, com as
situações preenchidas como **"Sem Parecer"**.
**Divergências encontradas:** **sim, achado novo.** No ramo `ignorarParecer = "Sim"`, a rotina começa
a montagem com uma lista de fornecedores já considerados que vem **pré-carregada com o código fixo
`85070508-0001`** (fornecedor + loja). O efeito prático é que **esse fornecedor específico nunca
recebe linha na grade de propostas** nesse caminho, por estar marcado como "já incluído" antes de o
laço começar. Pode ser exclusão deliberada (a própria CASSI, por exemplo), mas está **codificada
fixamente no formulário**, sem rótulo nem configuração — e um fornecedor sumindo da grade é
exatamente o sintoma que este ticket descreve. Vale confirmar a intenção com o time.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1932  (fluig · Concluído · SD 763260)

**Título:** Caracterização do caminho: a Negociação de Cotação percorre da definição pelo comprador até o retorno do ERP, e um erro do Protheus é exibido em campo próprio.

**Origem:** FSWTBC-1932 — título registrado como
"[CASSI - BH] - Suporte 2025] - [CASSI - BH] - Suporte 2025] - [CASSI - BH] - Suporte 2025] -
[CASSI - BH] - Suporte Junho/2025] - Erro no processo de negociação".
**O ticket não traz descrição** — e o título foi destruído por um defeito da automação de renomeação
do Jira (prefixo repetido quatro vezes; mesmo problema de FSWTBC-1813). Sobra apenas *"Erro no
processo de negociação"*. Este caso é, portanto, de **caracterização de caminho**: percorre a
negociação e afirma o comportamento observável hoje, sem inventar o cenário do defeito.

**Módulo/Rota:** Solicitação de Compras → **Validação do Comprador (Definir Negociação)**
(`panelApprovalBuyer`, etapa **199**) → **Processo de Negociação** (etapa **50**) →
**Aguarda Finalizar Negociação** (**172**) → **Integração com o ERP** (**177**).
Formulário de Cotação (`wf_cotacao_produtos_servicos`) → seção **Verificar Erro** (`panelError`).
Consulta transversal: **Tracker** → filtros **Negociação de Cotação de Produtos/Serviços** e
**Negociação de Cotação de Produtos/Serviços(Detalhado Itens)**.

**Pré-condições**
- SC com cotação concluída e propostas recebidas, chegando à etapa de definição de negociação.
- Executor autenticado como o **comprador** responsável.
- **Bloqueio:** **sim** — a conta de QA não resolve matrícula de comprador
  (`Comprador não encontrado.`), fechando as etapas de comprador; e o ticket não descreve o cenário,
  então não há defeito específico a reproduzir.

**Passos**
1. Abrir `/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`.
2. Em **Filtrar por:**, escolher **Negociação de Cotação de Produtos/Serviços**; definir
   **Status = Abertos** e clicar em **Pesquisar Registro**.
3. Repetir com **Negociação de Cotação de Produtos/Serviços(Detalhado Itens)** e comparar: o
   detalhado deve abrir a mesma negociação por item.
4. Abrir uma SC na etapa **Validação do Comprador (Definir Negociação)** e conferir a grade de
   propostas com a coluna **Enviar para Negociação?**.
5. Acompanhar a instância até a **Integração com o ERP** e abrir a aba **Histórico**.
6. No formulário de **Cotação de Produtos/Serviços**, conferir a seção **Verificar Erro** e o campo
   **Erro retornado pelo ERP Protheus**.

**Resultado esperado**
- Os dois filtros de negociação do Tracker respondem e trazem os mesmos processos, o segundo com
  detalhamento por item.
- Na etapa 199, marcar **Enviar para Negociação? = Sim** encaminha a proposta à negociação.
- A aba **Histórico** registra a integração no padrão
  `Integração executada com sucesso - Tempo de Execução N s`.
- Havendo falha na integração, o texto do erro aparece no campo **Erro retornado pelo ERP Protheus**
  (somente leitura) da seção **Verificar Erro** — e **não** apenas no console ou num log inacessível.
- A negociação não fica presa sem sinalização: ou avança, ou exibe o erro do ERP em tela.

**Resultado se o defeito reincidir**
- `<não documentado>` — o ticket não registra sintoma, mensagem nem evidência; o título foi
  corrompido pela automação de renomeação e sobrou apenas "Erro no processo de negociação".
  Qualquer falha observada nos passos acima deve ser tratada como achado novo e redocumentada.

**Severidade:** Média *(o processo de negociação define preço final da compra, mas sem descrição do
defeito não há como afirmar impacto financeiro; classificado por bloqueio de fluxo)*

**Preparação de massa:** uma SC com cotação concluída e ao menos duas propostas, parada na etapa
**Validação do Comprador (Definir Negociação)**, e uma conta de **comprador** válida no ERP. Para
exercitar o passo 6 é preciso, além disso, uma instância cuja integração com o Protheus tenha
**falhado** — não deve ser provocada, apenas localizada se existir.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no **Tracker**, confirmado em tela que **Negociação de Cotação de
Produtos/Serviços** e **Negociação de Cotação de Produtos/Serviços(Detalhado Itens)** são duas das
9 opções do seletor **Filtrar por:** (as demais: *Solicitação de Compras*, *Cotação de
Produtos/Serviços*, *Faturamento de Contratos*, *Parecer Técnico*, *Recepção de Documentos Fiscais*,
*Produtos/Rateio SC*, *Aprovadores SC*), com os botões **Pesquisar Registro** e **Limpar** e o
seletor **Status** com as opções *Todos / Abertos / Finalizados / Cancelados*. No formulário de
**Cotação de Produtos/Serviços** (iframe `256834`), confirmada a seção **Verificar Erro**
(`panelError`, oculta) contendo o campo de rótulo **"Erro retornado pelo ERP Protheus \*"** —
uma `textarea` **somente leitura** de nome `msgerro` — e, ao lado, o par de opções **Sim/Não** do
controle `sw_devolveForn` (devolução ao fornecedor). Na SC, confirmada a seção **Verificar Retorno
Protheus** (`panelBudgetLock`) com o campo **"Retorno Integração \*"** (`anLockBudgRetIntErr`,
também somente leitura). São as duas superfícies em que um erro do ERP fica visível ao usuário.
**Divergências encontradas:** **sim — no próprio ticket, não na tela.** O título registrado no Jira
está corrompido: o prefixo *"[CASSI - BH] - Suporte 2025]"* aparece **três vezes** antes de
*"[CASSI - BH] - Suporte Junho/2025]"*, e o conteúdo real do defeito se resume a quatro palavras.
Sem descrição, sem evidência e sem fluxo registrado, **o defeito original é irrecuperável pelo
registro** — este caso cobre o caminho, não a falha específica.
**Dados/massa usados:** nenhum — não submetido; as pesquisas do Tracker não foram disparadas contra
processo de terceiros.

---

## CT-FSWTBC-1943  (protheus · Concluído)

**Título:** Após atualização de release do Protheus, liberar uma cotação e obter o retorno do ERP sem erro (smoke de regressão da integração de cotações)

**Origem:** FSWTBC-1943 — "Acompanhamento e correções no ambiente TST da homologação para atualização do ERP Protheus" (12.1.2410): a virada quebrou a cotação e exigiu o `hotfix/mig2410_errocotacao`. Sem descrição do erro — **caracterização de caminho** da integração de cotação, para rodar a cada atualização de release.

**Módulo/Rota:** Fluig → **Portal do Comprador** (`/portal/p/1/portal_comprador` ou rota equivalente — widget `wg_portalCompradores`) → *Controle de Cotações* → liberar/atualizar cotação (REST `…/api/v1/fluig/compras/cotacao/atualiza/{id}`); processo **Cotação de Produtos e Serviços** → **Aguarda Movimentação Protheus (42)** → …; erro → **Correção (72)** com o campo **Erro retornado pelo ERP Protheus**; **Logs Protheus › Erros CV8**. No ERP: cotação (SC8) e rotinas `UCOME024`/`UCOME031` (nomes conforme tickets 1796/1820).

**Pré-condições**
- Release do Protheus recém-atualizada em TST/homologação; RPO com os fontes customizados recompilados.
- Comprador de homologação com matrícula válida no `dsProtheus_getCompradores_restGetAll`; SC `QA` aprovada até a cotação.
- **Bloqueio:** a conta de QA (`TOTVS-FS`) **não resolve matrícula de comprador** (`Y1_USER = "undefined"`, §5-C) — a família cotação não é executável por este login; `genericQuery` do Logs Protheus em 404 hoje (ambiente).

**Passos**
1. Antes da liberação: Logs Protheus › **Erros CV8** → *Data inicial* = hoje → **Consultar**; anotar a contagem.
2. Portal do Comprador → *Controle de Cotações* → cotação `QA` → liberar (dispara `cotacao/atualiza/{id}`).
3. Instância da Cotação → **Histórico**: ler a integração e a saída de *Aguarda Movimentação Protheus (42)*.
4. Se cair em **Correção (72)**: abrir o formulário e ler **Erro retornado pelo ERP Protheus**.
5. Logs Protheus › Erros CV8 → consultar de novo; comparar com o passo 1.
6. *(com credencial)* Protheus → SC8: cotação criada/atualizada com os fornecedores da proposta.

**Resultado esperado**
- Passo 3: a cotação sai da 42 e segue o fluxo normal; **nenhuma** entrada em 72.
- Passo 4: campo vazio.
- Passo 5: nenhum registro CV8 novo para a cotação.
- Passo 6: SC8 coerente com o portal.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Cotação em *Correção (72)* com erro do ERP após a virada de release (erro não transcrito no ticket); CV8 com novos registros; hotfix necessário.

**Severidade:** Média *(bloqueia o fluxo de cotação após upgrade)*

**Preparação de massa:** SC `QA` levada até a cotação pelo comprador de homologação; ambiente TST atualizado. Executar **antes** de promover a release para produção.

**Verificado em tela:** PARCIAL
**O que foi verificado:** movimentos reais da Cotação: **42 *Aguarda Movimentação Protheus*** (64 ocorrências) e **72 *Correção*** (6) nos 1.000 mais recentes; chamada `…/api/v1/fluig/compras/cotacao/atualiza/${id}` no fonte publicado do Portal do Comprador; Logs Protheus com aba *Erros CV8* e filtros (consulta em 404). Rótulo *Erro retornado pelo ERP Protheus* confirmado em lote anterior na Cotação 112312 (Correção). Não liberei cotação (perfil).
**Divergências encontradas:** o ticket não descreve o erro nem a tela; o caso é de caracterização.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-1953  (fluig · Concluído)

**Título:** Comprador abre a cotação gerada por uma SC e vê exatamente os itens daquela SC, da filial daquela SC.

**Origem:** FSWTBC-1953 — itens que não constam da solicitação apareciam na cotação; o sistema
trocava itens entre filiais diferentes que compartilhavam o mesmo nº de cotação (cotação
`000021-2901`, SC `29995`).

**Módulo/Rota:** Processo *Cotação de Produtos e Serviços* (`wf_cotacao_produtos_servicos`) →
seção **Lista de Produtos/Serviços**. Conferência cruzada em *Solicitação de Compras*
(`wf_solicitacao_compras`) → **Produtos/Serviços da Solicitação**, e no
**Tracker - Processos Compras/Contratos** (cruza *Número da Solicitação* × *Nº da Cotação*).

**Pré-condições**
- Duas SCs de **filiais diferentes** cujo número de cotação no ERP coincida (é o cenário que
  disparava a troca) — ou, na falta disso, uma SC com cotação gerada e itens conhecidos.
- SC já integrada ao Protheus (campo **Nº da Solicitação ERP** preenchido).
- Perfil de comprador com a cotação sob sua responsabilidade.
- **Bloqueio:** massa. Não há, na base de homologação acessível à conta de QA, duas SCs de filiais
  distintas com o mesmo nº de cotação. As duas cotações existentes (112113 e 112311) estão na etapa
  **Correção** e pertencem à própria conta de QA.

**Passos**
1. Abrir a SC de origem e anotar **Nº da Solicitação ERP**, **Código da Filial** e a lista completa de
   **Produtos/Serviços da Solicitação** (colunas *Item*, *Produto/Serviço*, *Quantidade*, *Preço Unit. Estimado*).
2. Abrir a cotação gerada a partir dessa SC (Central de Tarefas → *COTAÇÃO DE PRODUTOS E SERVIÇOS*).
3. Na seção **Identificação do(s) Produto(s)/Serviço(s)**, conferir **Nº da Cotação**, **Nº da SC do Fluig**,
   **Nº da SC do ERP**, **Código da Filial** e **Nome da Filial**.
4. Comparar item a item a **Lista de Produtos/Serviços** da cotação com a lista anotada no passo 1.
5. Repetir os passos 1–4 para a SC da **outra filial** que compartilha o mesmo nº de cotação.
6. No **Tracker**, filtrar por *Nº da Cotação* e conferir que cada linha traz o *Número da Solicitação* e
   o *Solicitante* corretos.

**Resultado esperado**
- A cotação lista **somente** os itens da SC que a originou — mesma quantidade de linhas, mesmos códigos.
- Nenhum item de outra filial aparece, mesmo com o nº de cotação repetido.
- **Código da Filial** e **Nome da Filial** da cotação são os da SC de origem.
- A carga dos itens é feita pelo dataset `dsProtheus_getCotacoes_restGetAll` filtrando **simultaneamente**
  por `C8_NUMSC` (nº da SC) **e** `BranchId` (filial) — o filtro de filial é o que impede a mistura.
- No Tracker, o par *Nº da Cotação* × *Número da Solicitação* é consistente com o que a tela mostra.

**Resultado se o defeito reincidir**
- A cotação exibe itens que não constam da SC; itens de duas filiais aparecem misturados sob o mesmo
  nº de cotação (relato original: cotação `000021-2901` da SC `29995`).

**Severidade:** Alta

**Preparação de massa:** duas SCs em filiais distintas (ex.: `2901` e uma outra) que gerem cotações
com o mesmo número no ERP, ambas integradas e com itens diferentes entre si — criadas pela equipe
de Compras, porque a conta de QA não resolve matrícula de comprador.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de Cotação foi aberto e inspecionado (iframe `256834`): existem
os campos **Nº da Cotação**, **Nº da SC do Fluig**, **Nº da SC do ERP**, **Código da Filial**, **Nome da
Filial** e a seção **Lista de Produtos/Serviços** com as colunas ocultas `txt_item`, `txt_cod`, `txt_desc`,
`txt_qtd`, `txt_valorUni`, `txt_valorTot`. Confirmado no fonte do formulário que a carga usa
`GET /api/public/ecm/dataset/search?datasetId=dsProtheus_getCotacoes_restGetAll&filterFields=C8_NUMSC,<hd_numSc>,CorporateId,01,BranchId,<hd_numFilial>&limit=10000`
— ou seja, o filtro por filial está presente hoje. Na Central de Tarefas há 2 cotações (112113, 112311),
ambas em **Correção**.
**Divergências encontradas:** o ticket identifica a cotação como "000021-2901" (número + filial concatenados);
a tela separa isso em dois campos distintos, **Nº da Cotação** e **Código da Filial**.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2023  (ambos · Concluído)

**Título:** Comprador conclui a etapa de liberação/bloqueio de uma cotação e o registro continua existindo e consultável.

**Origem:** FSWTBC-2023 — "Deletando cotação após liberação do FLUIG": cotações sendo **deletadas**
ao serem liberadas no Fluig. Defeito de alta gravidade, perda de dado em produção, resolvido em 2
dias sem registro da causa. O ticket nomeia o endpoint
`/api/v1/fluig/compras/cotacao/libera/{numCotacao}/{codProposta}/{codFornecedor}`.

**Módulo/Rota:** Fluig → **Portal do Comprador** (`/portal/p/1/portal-do-comprador`) → módulo de
**Cotações**. Conferência: **Tracker** → *Filtrar por:* **Cotação de Produtos/Serviços**.

**Pré-condições**
- Login com **matrícula de comprador** resolvida no Protheus (`SY1`).
- Uma cotação em estado que permita a ação, com propostas recebidas e **parecer técnico informado**
  (é pré-requisito da ação — ver Divergências).
- **Bloqueio: duplo.** (1) A conta de QA **não resolve matrícula de comprador** — o Portal do
  Comprador registrou hoje *"Erro ao buscar as informações do colaborador na lista de usuários do ERP
  Protheus. Error: Error: Comprador não encontrado."* e não lista cotação nenhuma (limitação de
  conta, §5-C). (2) A regra §2 proíbe executar a ação sobre **cotação pré-existente que não seja
  minha** — e este caso é justamente sobre uma ação destrutiva. **Portanto a ação NÃO foi executada
  e não deve ser executada para "reproduzir".**

**Passos**
1. Autenticar com login de **comprador**.
2. Abrir o **Portal do Comprador** e acessar o módulo de **Cotações**.
3. Localizar a cotação alvo e **anotar** o número da cotação, o fornecedor e a loja.
4. Antes de agir: abrir o **Tracker**, escolher **Cotação de Produtos/Serviços**, pesquisar pelo
   **Nº da Cotação** anotado e **registrar o resultado** (existe, status, solicitante).
5. Voltar ao Portal do Comprador e informar o **Parecer Técnico** da cotação, se ainda não houver.
6. Acionar **Bloquear Novos Participantes** (ver Divergências — este é o rótulo real).
7. Confirmar no diálogo **"Bloquear Novos Participantes"**, que pergunta
   *"Deseja bloquear novos participantes para a cotação selecionada?"*, clicando em **Sim**.
8. Após a confirmação de sucesso, **repetir a consulta do passo 4 no Tracker**, com o mesmo número.
9. Conferir também no modal **"Informações Complementares do Contrato"** (se a cotação já originou
   contrato) os campos **Número da Cotação** e **Código da Proposta**.

**Resultado esperado**
- A ação conclui com o diálogo de sucesso **"Participantes Bloqueados"** /
  *"Novos participantes foram bloqueados para a cotação selecionada."*.
- **No passo 8, o Tracker continua retornando a cotação** com o mesmo número, fornecedor e loja — o
  registro **não** foi apagado.
- É esperado e correto que a cotação **saia da listagem do Portal do Comprador**, porque a listagem
  só exibe cotações ainda abertas a participantes. Sair da lista **não** é o mesmo que ser excluída,
  e o Tracker é quem prova a diferença.
- Nenhuma proposta vinculada é perdida.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Após a liberação no Fluig, a cotação era **deletada** — deixava de existir, e não apenas de ser
  listada. O ticket aponta a chamada
  `/api/v1/fluig/compras/cotacao/libera/{numCotacao}/{codProposta}/{codFornecedor}` como a operação
  envolvida.

**Severidade:** Alta *(perda de dado em produção)*

**Preparação de massa:** uma **credencial de comprador** da CASSI (matrícula na SY1) e uma cotação
**criada para o teste**, com propostas e parecer técnico, **nunca uma cotação real de produção** —
a ação é irreversível pela tela. Quem prepara: administrador do Fluig + área de Compras.
**Este caso não é executável sem a credencial de comprador.**

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri `/portal/p/1/portal-do-comprador`. A página carrega com o título
**"Portal do Comprador"**, mas exibe apenas **"Acesso Rápido"**, sem nenhuma lista de cotações, e o
console registra hoje *"Erro ao buscar as informações do colaborador na lista de usuários do ERP
Protheus. Error: Error: Comprador não encontrado."*. Procurei o texto **"Bloquear Novos
Participantes"** na tela: **não encontrado** — porque a lista não chega a ser montada para esta conta.
Confirmei no **Tracker** que o tipo **Cotação de Produtos/Serviços** existe como filtro e que há
campo **Nº da Cotação**, o que sustenta os passos 4 e 8.
**Divergências encontradas:** três, e a primeira **muda o passo a passo do ticket**:
(1) **o endpoint `/api/v1/fluig/compras/cotacao/libera/` NÃO existe em nenhum fonte JS publicado.**
O que existe é **`cotacao/bloqueiacotacao`**, em duas versões que convivem: `blockQuote` com
**`PUT /api/v2/fluig/compras/cotacao/bloqueiacotacao/{num}`** e `blockPropose` com
**`POST /api/v1/fluig/compras/cotacao/bloqueiacotacao/{num}`** — mesma rota, verbos e versões
diferentes. Ambas enviam `{bloqueia:"S"}`. **Não existe botão "Liberar" ou "Liberação" em nenhum
HTML publicado**; o rótulo real do `po-button` é **"Bloquear Novos Participantes"** (ícone `an an-lock`).
Isto é **lido no fonte publicado**, não visto renderizado — a conta não permitiu ver a tela.
(2) **Achado que provavelmente explica o defeito relatado:** a listagem de cotações filtra por
`(C8_XLIBERA='' OR C8_XLIBERA='N')`. Ao bloquear, `C8_XLIBERA` passa a `'S'` e **a cotação
desaparece da listagem do widget**. Pela UI, "sumiu da tela" é indistinguível de "foi deletada" — é
exatamente a superfície do sintoma "cotação deletada após liberação". Por isso o passo 8 deste caso
(reconsultar no **Tracker**) é o que de fato distingue as duas hipóteses, e por isso o Resultado
Esperado afirma que sair da lista é correto.
(3) há um pré-requisito não citado no ticket: a ação recusa com
**"Parecer Técnico Obrigatório"** / *"Antes de bloquear a cotação para novos participantes, é
obrigatório informar o parecer técnico."*. Registro ainda que a mensagem de erro é genérica
(**"Algum erro aconteceu!"**, repassando `message` do Protheus) e que o filtro de elegibilidade
carrega um fornecedor genérico fixo no código (`C8_FORNECE != '85070508'`).
**Dados/massa usados:** nenhum — nenhuma cotação foi listada, aberta, liberada ou bloqueada.

---

## CT-FSWTBC-2073  (fluig · Concluído · SDCASSI-8)

**Título:** Comprador envia a cotação para parecer técnico com anexos por proposta e os anexos ficam gravados.

**Origem:** FSWTBC-2073 — `765947`: erro no envio da cotação, anexos não estavam sendo gravados (SC 17965);
dois CNPJs de fornecedor afetados. Corrigido e aplicado em produção pela MUD15897.

**Módulo/Rota:** *Cotação de Produtos e Serviços* (`wf_cotacao_produtos_servicos`) → seção
**Informações p/ Parecer Técnico** → **Insira os anexos para envio do Parecer Técnico**.

**Pré-condições**
- Cotação com **propostas recebidas e analisadas no ERP Protheus** — sem proposta analisada o formulário
  bloqueia o envio.
- Perfil de comprador responsável pela cotação.
- Arquivo `QA…` para anexar por proposta.
- **Bloqueio:** **sim** — (a) a conta de QA **não resolve matrícula de comprador** (limitação conhecida:
  `dsProtheus_getCompradores_restGetAll` recebe `Y1_USER = "undefined"`); (b) confirmar a gravação exige
  **enviar** a cotação.

**Passos**
1. Abrir a cotação sob responsabilidade do comprador (Central de Tarefas → *COTAÇÃO DE PRODUTOS E SERVIÇOS*).
2. Conferir a seção **Informações do Fornecedor** (CNPJ/CPF, Razão social) e a **Lista de Produtos/Serviços**.
3. Em **Enviar para parecer técnico?**, marcar **Sim**.
4. Para **cada** proposta listada, clicar no botão de anexo da linha e selecionar um arquivo `QA…`.
5. Conferir que cada linha da tabela de anexos mostra o arquivo vinculado à proposta e ao fornecedor certos.
6. Clicar em **Enviar** e confirmar a pergunta de anexos.
7. Reabrir a solicitação e conferir a aba **Anexos** e a tabela de anexos por proposta.

**Resultado esperado**
- Cada anexo fica vinculado à **sua** proposta, identificado como
  `Anexo Proposta: <nº> - Forn.: <código>-<nome> - Loja.: <loja>`.
- Ao enviar, o sistema pergunta *"Foram incluidos todos os anexos para as propostas? Caso confirme e o
  sistema identifique que existem pendencias o mesmo não seguirá sendo necessária novamente interação com
  processo."* — e, confirmando, o envio conclui.
- Depois do envio, **todos** os anexos continuam listados na solicitação — nenhum é perdido.
- Sem proposta analisada no ERP, o envio é barrado com *"Não foram identificadas propostas analisadas no
  ERP Protheus, por favor realize a análise e a marcação das propostas que devem ou não ser enviadas para
  o 'Parecer Técnico'."*
- Sem proposta a enviar, o aviso é *"Não foram identificadas propostas à serem enviadas para o 'Parecer
  Técnico'. Caso confirme o sistema será direcionada para 'Negociação sem passar pelo Parecer Técnico'."*

**Resultado se o defeito reincidir**
- O envio da cotação dá erro e/ou os anexos das propostas não são gravados — a solicitação segue sem eles
  (relato: SC 17965, dois CNPJs de fornecedor afetados).

**Severidade:** Alta *(perda de dado — o anexo é a evidência da proposta)*

**Preparação de massa:** uma cotação com pelo menos **duas** propostas já analisadas no Protheus,
atribuída a um comprador com matrícula resolvida no ERP, e dois arquivos `QA…`. Nada disso é alcançável
pela conta de QA atual.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de Cotação foi aberto e traz a seção **Informações p/ Parecer
Técnico** com o rádio **Enviar para parecer técnico? \*** (Sim/Não) e a área **Insira os anexos para envio
do Parecer Técnico**; a tabela de anexos (`tbAnexoPropostas`) e os botões `btnAdicionarAnexo___N` existem
no DOM, ocultos enquanto não há proposta. As quatro mensagens citadas foram lidas literalmente no fonte do
formulário. Na Central de Tarefas há duas cotações (112113 e 112311), ambas na etapa **Correção**.
**Divergências encontradas:** neste formulário aberto avulso, **CNPJ/CPF**, **Validade da Cotação** e
**Validade da Proposta** são `readonly` e não há busca de fornecedor — a jornada real do caso só existe
sobre uma cotação já instanciada.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2080  (ambos · Concluído · SDCASSI-13)

**Título:** Registrar a segunda proposta de uma negociação de cotação e conferir que ela é integrada ao ERP com os valores corretos.

**Origem:** FSWTBC-2080 — a proposta 02 da negociação não aparecia no Protheus
(Fluig 34377 / SC 000084 / Cotação 000055 / Filial 2101). O caso mais bem escalado do backlog:
escalado à TOTVS Matriz (ticket 23940437), passou por MATA150 e MATXFIS, e o diagnóstico definitivo
veio do debug com os arrays `aCab`/`aItens`: (1) **`C8_ALIIPI` deve ser preenchido APENAS SE o valor
for maior que zero**, por conta das validações do `valid` do campo e das rotinas do fiscal; (2)
**`C8_VALIDA` estava trazendo as barras da data**, sem aspas e sem tratamento com `CtoD`/`StoD`.
Solução final: **bypass paliativo na rotina MATA150** (MUD16035). Um mês e cinco dias de impacto,
durante os quais as propostas eram inseridas à mão.

**Módulo/Rota:** Fluig → **Processos → Negociação de Cotação de Produtos e Serviços**
(`wf_negociacao_cotacao_prod_serv`) → atividades **Recepção de Propostas** → **Integração com ERP**
→ **Validação da Proposta**.
Conferência: **Tracker** → *Filtrar por:* **Negociação de Cotação de Produtos/Serviços(Detalhado Itens)**.

**Pré-condições**
- Uma negociação em curso, com a **proposta 01** já registrada (é a linha de base do cálculo).
- Fornecedor apto a enviar a **proposta 02**.
- Itens cujo **valor de IPI seja zero** em pelo menos um caso e **maior que zero** em outro — é essa
  a fronteira do defeito.
- Um item com **data de validade da proposta** preenchida.
- **Bloqueio: duplo.** (1) Não há **credencial de fornecedor** nem de **comprador** nesta rodada
  (§5-C) — a recepção de propostas não é executável. (2) A confirmação de que a proposta chegou à
  `SC8` do Protheus exige o ERP — **sem credencial**. Ancorado no Fluig por: (a) a atividade
  **Integração com ERP** no **Histórico**; (b) o campo **"Erro retornado pelo ERP Protheus"** do
  formulário de Cotação; (c) o **Tracker** no tipo detalhado de itens.

**Passos**
1. Abrir a negociação e confirmar, na aba **Histórico**, que a **proposta 01** foi integrada.
2. Registrar a **proposta 02** para o mesmo fornecedor/loja, com um item de **IPI zero** e um de
   **IPI maior que zero**, e com a **data de validade** preenchida.
3. Movimentar de **Recepção de Propostas** para **Integração com ERP**.
4. Reabrir a solicitação em modo leitura e abrir a aba **Histórico**.
5. Conferir se a atividade **Integração com ERP** registrou
   *"Integração executada com sucesso - Tempo de Execução N s"*.
6. Abrir o formulário da Cotação e conferir o campo **"Erro retornado pelo ERP Protheus"**.
7. Abrir o **Tracker**, tipo **Negociação de Cotação de Produtos/Serviços(Detalhado Itens)**, e
   pesquisar pelo **Nº do Processo Fluig**, conferindo que os itens da proposta 02 aparecem.
8. Conferir o **total exibido da proposta 02** contra a soma manual dos itens.

**Resultado esperado**
- A **proposta 02** é integrada e o **Histórico** registra a **Integração com ERP** com sucesso.
- O campo **"Erro retornado pelo ERP Protheus"** permanece **vazio**.
- A proposta 02 aparece no **Tracker**, no tipo detalhado, com todos os seus itens.
- A integração conclui **tanto** para itens com IPI zero **quanto** para itens com IPI maior que zero.
- A **data de validade** é aceita sem erro de conversão.
- O total exibido da proposta é **coerente** com a composição dos itens (ver Divergências sobre a
  fórmula — o IPI é **subtraído**, e isso precisa ser conferido contra a regra de negócio da CASSI).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A proposta 02 **não aparecia no Protheus** (Fluig 34377 / SC 000084 / Cotação 000055 / Filial 2101),
  com falso positivo na rotina padrão do ERP. O payload enviava `C8_ALIIPI` mesmo quando zero, e
  `C8_VALIDA` ia com as **barras da data**, sem `CtoD`/`StoD` — e a MATA150/MATXFIS falhava em
  silêncio. Enquanto durou, as propostas eram inseridas manualmente.

**Severidade:** Alta *(proposta de compra perdida; risco financeiro e de decisão de compra sobre base incompleta)*

**Preparação de massa:** uma negociação com **proposta 01 integrada** e capacidade de registrar a
**proposta 02**, contendo itens com IPI zero e não-zero. Quem prepara: comprador da CASSI +
fornecedor (ou o comprador registrando pelo portal). **Nenhuma das duas credenciais existe nesta
rodada** — este é o caso menos executável do lote pelo lado de credencial.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o processo **34377 existe nesta base** e o abri em modo leitura:
**Histórico (14)**, **Anexos (10)**, breadcrumb *Central de Tarefas → Negociação de Cotação de
Produtos e Serviços*, atividade atual **"Solicitação finalizada"**. O histórico mostra a conversão do
processo `wf_negociacao_cotacao_prod_serv` **da versão 9 para a versão 10** e o mapa de atividades:
**4 - Início, 6 - Notifica Fornecedor, 8 - Recepção de Propostas, 10 - Integração com ERP,
12 - Intermediário, 13 - Correção, 16 - Intermediário, 17 - Correção, 20 - Validação da Proposta**.
Também registra *"Ugo Leonardo Silva Gaieski de Anhaia movimentou a atividade Validação da Proposta
para a atividade Aprovado"* em 30/06/2025 e o encerramento em *Fim*. **A atividade nº 10, "Integração
com ERP", é a âncora exata deste caso.** Confirmei no fonte publicado que o formulário de Cotação tem
o campo **"Erro retornado pelo ERP Protheus"** (`form_cot.html:838`, `id="msgerro"`), e que o Tracker
oferece o tipo **Negociação de Cotação de Produtos/Serviços(Detalhado Itens)**.
**Divergências encontradas:** quatro, uma delas potencialmente importante para a área de Compras:
(1) **A fórmula do total da proposta SUBTRAI o IPI.** Lida no fonte publicado do widget de Compras
(`handlerSumProposals`, caso `"total"`): a base é `C8_PRECO × C8_XQTAUDI` quando a quantidade
auditada é maior que zero, senão `C8_TOTAL`; em seguida **`s -= C8_VALIPI`**, **`s -= C8_VLDESC`** e
**`s += C8_VALFRE`**. Ou seja, **IPI e desconto são subtraídos e o frete é somado**. Isso é
candidato direto a divergência de valores entre a proposta exibida no Fluig e o valor no ERP, e
**precisa ser confirmado contra a regra de negócio da CASSI** — não afirmo que está errado, afirmo
que está assim no fonte publicado.
(2) **`C8_ALIIPI` (a alíquota) aparece na lista de campos trafegados mas não é usado em nenhum
cálculo** — só `C8_VALIPI` entra na conta. Consistente com o diagnóstico da TOTVS de que o campo era
enviado sem necessidade.
(3) **`C8_VALIDA` é um campo de DATA**, rotulado **"Dt. Validade"** (`type:"date"`,
`format:"dd/MM/yyyy"`), e é usado como filtro de intervalo. **Não é flag de validação.** Isso
corrobora exatamente o diagnóstico "estava trazendo as barras da data" — quem for reproduzir deve
olhar a **data de validade da proposta**, não um campo booleano, e é por isso que o passo 2 pede a
data preenchida.
(4) **a string "Proposta 02" não existe no fonte** — a proposta é `C8_NUMPRO`, com **"01" como linha
de base** (o cálculo de *saving* é sempre contra a `"01"`). Além disso, o rótulo diverge entre telas:
no widget de Compras `numProposta` é o próprio `C8_NUMPRO`, enquanto no formulário da SC
`numProposta` é montado como `cotação-fornecedor-loja` e o `C8_NUMPRO` vira **`versao`**. Quem
executar o caso precisa saber que "proposta 02" é a **versão 02** da cotação.
Registro por fim que os campos **"Aliq. IPI"** (`txt_aliqIpi`) e **"Valor total do IPI"**
(`txt_vlIpi_infForn`) existem no formulário de Cotação, ambos **`readonly`**, e **nenhum JS publicado
os lê ou escreve** — são preenchidos apenas pelo ERP.
**Dados/massa usados:** leitura do processo 34377. Nenhuma proposta registrada, nenhuma movimentação.

---

## CT-FSWTBC-2257  (ambos · Concluído · SDCASSI-44)

**Título:** Abrir o seletor de Centro de Custo e confirmar que qualquer centro de custo da base é encontrado, inclusive além do limite de página do dataset.

**Origem:** FSWTBC-2257 — centros de custo não apareciam na configuração do parecer técnico. Dois
achados num só diagnóstico: (1) a consulta usava **`QB_RESPONS`** para buscar o responsável, e essa
tabela **não é mais atualizada** pela equipe CASSI — consulta apoiada em dado morto; (2) removida a
condição, descobriu-se que **a paginação de retorno estava em 1000 registros enquanto a consulta
trazia mais de 3000** — o limite silencioso cortava os centros de custo. Corrigido ajustando o
dataset.

**Módulo/Rota:** Fluig → **Portal do Comprador** (`/portal/p/1/portal-do-comprador`) → **Validação
Inicial** (`#/validacaoInicial`) → campo **Centro de Custo** (*"Selecione o Centro de Custo"*); e o
mesmo seletor no modal de **Centralizar Solicitações**. Consumidor equivalente na SC: dataset
`dsProtheus_getCentroCusto_restGetAll`.

**Pré-condições**
- Base com **mais de 1000 centros de custo** ativos (o incidente cita mais de 3000) — é a condição
  que faz o limite de paginação aparecer.
- Perfil de **comprador** válido no ERP (a Validação Inicial é tela de comprador).
- **Bloqueio:** duplo. (a) **A conta de QA não resolve comprador** (`Comprador não encontrado`,
  §5-C) — a tela monta mas não carrega dados de cotação. (b) `genericQuery` estava respondendo
  **404** durante a execução, deixando a grade vazia — instabilidade de ambiente. Sem credencial
  Protheus, também não dá para contar quantos centros de custo existem do outro lado.

**Passos**
1. Abrir o **Portal do Comprador** e, no menu lateral, clicar em **Validação Inicial**.
2. No campo **Centro de Custo**, com o texto de apoio *"Selecione o Centro de Custo"*, abrir o
   seletor.
3. Conferir as colunas da lista: **Código** (`CTT_CUSTO`) e **Descrição** (`CTT_DESC01`).
4. Rolar a lista até o fim e usar *carregar mais* / paginação, contando quantos registros chegam.
5. Digitar no filtro o **código de um centro de custo que esteja depois do milésimo registro** em
   ordem de código.
6. Repetir a busca por **descrição parcial**.
7. Repetir os passos 2–6 no seletor de **Centro de Custo** do modal **Centralizar Solicitações**.

**Resultado esperado**
- O seletor **encontra qualquer centro de custo ativo da base**, inclusive os que estão além do
  milésimo registro — a busca é feita no servidor, não sobre uma página já baixada.
- A lista pagina até o fim sem parar em um múltiplo redondo (1000) e sem mensagem de erro.
- Os resultados trazem **Código** e **Descrição** preenchidos; nenhuma linha com descrição vazia.
- A lista de centros de custo **não depende de `QB_RESPONS`** — remover/ignorar o responsável não
  reduz o conjunto retornado.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Centros de custo **não aparecem** na configuração do parecer técnico. Ou a lista "acaba" em 1000
  registros, ou um centro de custo específico nunca é encontrado pela busca — sem mensagem alguma
  indicando truncamento.

**Severidade:** Média — bloqueia o preenchimento (o usuário não consegue escolher o centro de custo
correto), sem risco financeiro direto, mas com risco de escolher o CC errado por indisponibilidade
do certo.

**Preparação de massa:** nenhuma a criar — o cenário depende do **volume já existente** de centros de
custo (>1000). O que falta é saber **qual** CC está além do limite: isso exige listar a CTT no
Protheus, o que **não tenho como fazer**. Sem esse dado, o passo 5 não é executável com precisão;
executar por amostragem (buscar 10 CCs de códigos altos) é a alternativa viável.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri o **Portal do Comprador** e a rota **`#/validacaoInicial`**. A tela
monta com os botões **Buscar** e **Centralizar Solicitações** e cinco campos: *Selecione a Filial*,
*Selecione o Produto*, *Selecione o Grupo de Produto*, ***Selecione o Centro de Custo*** e
*justificativa*. Confirmei no bundle publicado que o seletor de CC usa as colunas
`{property:"CTT_CUSTO", label:"Código"}` e `{property:"CTT_DESC01", label:"Descrição"}`, e que o
filtro é servidor (`&filterFields=CTT_CUSTO,<valor>`). **Não** consegui abrir a lista com dados:
`genericQuery` retornou 404 e a conta não resolve comprador.
**Divergências encontradas:** **duas, e a primeira muda o roteiro.** (1) **Não existe hoje nenhuma
tela chamada "configuração do parecer técnico"**, como diz o ticket. O que existe é: o seletor de
**Centro de Custo** na *Validação Inicial* e no modal *Centralizar Solicitações*; e uma ação
**Parecer Técnico** dentro de *Controle de Cotações*, que abre o diálogo *"Deseja inserir parecer
técnico para a cotação selecionada?"* — sem qualquer configuração de centro de custo. O caso foi
escrito contra o seletor de CC, que é o mecanismo do defeito. (2) **Outro limite silencioso, no
mesmo widget:** o Portal do Comprador tem `this.MAX_CONSULTAS_FORNECEDOR = 10` fixo no fonte, e o
formulário da SC consulta `dsProtheus_getCentroCusto_restGetAll` com **`limit=300`**. São teto e
página codificados, da mesma família do 1000 que causou este defeito — merecem a mesma revisão.
**Dados/massa usados:** nenhum — não submetido, nenhum filtro aplicado com dados reais.

---

## CT-FSWTBC-2286  (protheus · Concluído · SDCASSI-47)

**Título:** Consultar a origem de um contrato no Fluig e conferir que "Via Solicitação Compra?" e "Número SC Origem" são coerentes entre si, para que a exclusão no Protheus siga a rota certa

**Origem:** FSWTBC-2286 — o Protheus recusava excluir um contrato com a mensagem *"a exclusão só pode ser realizada através da rotina de solicitação de compras"*. Causa: trava no campo `CN9_XSCORI`, alimentado na geração do contrato via cotação; contratos legados carregavam o campo preenchido sem terem vindo de SC. Desfecho (*Não será feito*): **42 registros limpos por UPDATE** na base, sem GMUD registrada.

**Módulo/Rota:** Fluig → **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) → coluna *Ação* → ícone **Informações do Contrato** → modal *Informações Complementares do Contrato* → grupo **Processos, Cotações e Integração** (campos *Via Solicitação Compra?* e *Número SC Origem*; ao lado, *Número da Cotação*, *Contrato Origem*, *Status da Integração GCT*, *Erro de Integração*). Contraprova no ERP: SIGAGCT → Gestão de Contratos → *Excluir* (nome de menu a confirmar no cliente).

**Módulo ERP:** `Contratos - GCT`

**Pré-condições**
- Sessão no Fluig com acesso ao widget *Acompanhamento de Contratos* (a conta de QA tem).
- Um contrato **gerado por cotação** (ex.: `6197-2025-5303`, *Via Solicitação Compra?* = `1`, *Número SC Origem* = `31571`) e um contrato **cadastrado direto no ERP** (qualquer um com *Via Solicitação Compra?* = `2`).
- Para a contraprova de exclusão: credencial do Protheus com permissão de exclusão em contrato de homologação criado pelo próprio executor. **Não excluir contrato pré-existente.**
- **Bloqueio:** contraprova de exclusão exige credencial do Protheus (ausente nesta rodada); a parte Fluig executa integralmente.

**Passos**
1. Abrir *Acompanhamento de Contratos*; na busca (`Filtrar`), digitar `6197-2025-5303`; confirmar 1 linha (*Status* Vigente, *Nº Revisão* 002).
2. Clicar no ícone **Informações do Contrato** da linha; no modal, localizar o grupo *Processos, Cotações e Integração*.
3. Ler *Via Solicitação Compra?* e *Número SC Origem*.
4. Fechar; clicar no ícone **Solicitação de Compra** da mesma linha: abre o modal *Solicitação de Compra* com as opções **Aditivo contratual** ("Protheus = abre revisão aberta e FC irá editar o contrato") e **Nova Contratação** — **fechar sem escolher** (é o início de uma SC nova, não a SC de origem).
5. Repetir 1–3 com um contrato cadastrado direto no ERP (*Via Solicitação Compra?* = `2`).
6. (Auditoria da regra) Executar a consulta abaixo pelo dataset — sem escrever nada — e contar os registros com *Via Solicitação Compra?* = `2` **e** *Número SC Origem* preenchido:
   `POST /api/public/ecm/dataset/datasets {"name":"dsProtheus_getContratosxFornecedores_restGet","constraints":null}` → agrupar `CN9_XSC` × `CN9_XSCORI`.
7. (Somente com credencial Protheus) Em contrato de homologação criado pelo executor **sem** SC de origem, acionar *Excluir* no SIGAGCT.

**Resultado esperado**
- Passo 3: contrato vindo de cotação mostra *Via Solicitação Compra?* = `1` **e** *Número SC Origem* preenchido com a SC que o gerou.
- Passo 4: o modal oferece só *Aditivo contratual* e *Nova Contratação*; nada é criado ao fechar. (Não há navegação do contrato para a SC de origem — o vínculo é apenas o texto de *Número SC Origem*.)
- Passo 5: contrato direto no ERP mostra *Via Solicitação Compra?* = `2` **e** *Número SC Origem* vazio (`-`).
- Passo 6: **zero** registros com `XSC=2` e `XSCORI` preenchido — a combinação é exatamente o dado residual que gerou o ticket.
- Passo 7: a exclusão é permitida no ERP; a mensagem *"a exclusão só pode ser realizada através da rotina de solicitação de compras"* aparece **apenas** para contrato com *Número SC Origem* preenchido.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Contrato sem SC de origem com `CN9_XSCORI` preenchido; ao excluir no Protheus, *"a exclusão só pode ser realizada através da rotina de solicitação de compras"* — e a SC (bloqueada) também não permite, criando impasse.

**Severidade:** Média *(bloqueia exclusão; o desfecho foi UPDATE em massa sem GMUD — risco de dado)*

**Preparação de massa:** nenhuma para os passos 1–6 (usa contratos existentes em leitura). Para o passo 7, um contrato de homologação criado pelo executor no SIGAGCT, sem SC de origem.

**Verificado em tela:** SIM (total) *para a parte Fluig; passo 7 NÃO (sem credencial Protheus)*
**O que foi verificado:** widget aberto com 845 linhas; filtro `6197-2025-5303` → 1 linha (`5303 | 104 - EVENTOS, FESTIVIDADES | 6197-2025-5303 | 26/09/2025 | 26/09/2026 | 002 | Vigente | 06317779 - 0001`); ícones da linha com `title` *Planilha*, *Solicitação de Compra*, *Informações do Contrato*; modal com os 8 grupos e, em *Processos, Cotações e Integração*, os rótulos *Número da Cotação, Revisão da Proposta, Status da Integração GCT, Erro de Integração, Via Solicitação Compra?, Número SC Origem, Num Revisão do Contrato, Contrato Origem, Eliminado por Remanescente, Usuário Gerador da Revisão*; valores lidos: `#info-xsc`=`1`, `#info-xscori`=`31571`, `#info-xctori`=`-`. Dataset agregado: 957 linhas.
**Divergências encontradas:** o ícone *Solicitação de Compra* do Acompanhamento **não abre a SC de origem** — abre o modal de criação de nova SC (*Aditivo contratual* / *Nova Contratação*), medido em `l041/c.mjs`; **o dado residual do ticket está vivo nesta base — 42 registros com `CN9_XSC=2` e `CN9_XSCORI` preenchido** (ex.: `6200-2025-5303`→47288, `6182-2025-5303`→34895, `6199-2025-5303`→25895, `6201-2025-5303`→50098, `113-2021-5303` rev.004→001183, `00013-2026-5303`→75482). É o mesmo número (42) que o ticket mandou limpar; se esta base é cópia da produção, a limpeza não chegou aqui ou reincidiu. Há ainda 43 registros na situação inversa (`XSC=1` com `XSCORI` vazio, ex.: `6168-2025-5303`, `6165-2025-5303`). O rótulo do ticket ("campo CN9_XSCORI") aparece na tela como *Número SC Origem*.
**Dados/massa usados:** contrato `6197-2025-5303` (leitura); dataset em leitura. Nada submetido.

---

## CT-FSWTBC-2315  (ambos · Concluído · SDCASSI-51)

**Título:** Finalizar uma cotação cuja alçada já foi liberada e ver a finalização ser aceita, sem a crítica de "cotação em aprovação".

**Origem:** FSWTBC-2315 — ao finalizar a cotação `000223-5303` (processo 38726) o sistema exibia
*"Cotação em aprovação não pode ser alterada"*, mesmo com a alçada liberada no Protheus
(`C8_XALCADA = .T.`). Causa: houve uma **duplicidade no Fluig** e, **após intervenção manual**, foi
enviada a tag de **rejeição** ao Protheus enquanto no Fluig ficou como **aprovação** — os dois
sistemas em estados opostos. O desfecho foi **outra** intervenção manual (liberar o documento no
Protheus).

**Módulo/Rota:** Fluig → **Portal do Comprador** → **Controle de Cotações** (rota real
`#/controleCotacao`), filtro **Em Alçada**; e Fluig → **Processos** → **Cotação de
Produtos/Serviços** (`processID=wf_cotacao_produtos_servicos`), etapa **Aprovação de Alçada**
(atividade 94, grade `tbAlcadas`).

**Pré-condições**
- Uma cotação que já passou pela **Aprovação de Alçada** e teve a alçada **liberada**
  (`C8_XALCADA` verdadeiro no Protheus).
- Nenhuma intervenção manual pendente sobre essa cotação nos dois sistemas.
- **Bloqueio:** triplo. (a) **Sem credencial Protheus** — `C8_XALCADA` não é inspecionável por mim.
  (b) **A conta de QA não resolve comprador** (§5-C): não consigo operar *Controle de Cotações*.
  (c) O ticket é sobre **estado divergente causado por intervenção manual**; reproduzir exigiria
  provocar a divergência, o que é proibido em base do cliente.

**Passos**
1. Abrir o **Portal do Comprador** → **Controle de Cotações**.
2. Nos filtros, selecionar **Em Alçada** = *Sim* e informar a **Filial** e o **Tipo Documento** da
   cotação; clicar em **Filtrar**.
3. Localizar a cotação e conferir a coluna de status/etapa.
4. Acionar a finalização/validação da cotação (**Validar Proposta**, em *Avaliação de Propostas*).
5. Observar a mensagem retornada.
6. Abrir a **Cotação de Produtos/Serviços** correspondente e ler o campo **"Erro retornado pelo ERP
   Protheus"** do formulário.
7. Abrir o **Tracker**, filtro *Filtrar por:* = **Cotação de Produtos/Serviços**, e conferir o
   **Nº da Cotação ERP** e o **Status** do processo.

**Resultado esperado**
- Com a alçada liberada, a finalização é **aceita**: nenhuma mensagem *"Cotação em aprovação não
  pode ser alterada"*.
- O campo **"Erro retornado pelo ERP Protheus"** (formulário de Cotação/Negociação) fica **vazio**.
- O estado no Fluig e o estado no Protheus **coincidem**: uma cotação aprovada no Fluig não pode
  estar rejeitada no ERP, e vice-versa.
- Não existe, para a mesma SC/filial, **mais de uma** cotação em duplicidade — o Tracker mostra um
  único **Nº da Cotação ERP** por processo.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Ao finalizar a cotação `000223-5303` (processo 38726): *"Cotação em aprovação não pode ser
  alterada"*, mesmo com `C8_XALCADA = .T.` no Protheus — travando o fluxo e exigindo que alguém
  libere o documento manualmente no ERP.

**Severidade:** Alta — trava a aprovação de alçada e, pior, o estado divergente entre os dois
sistemas significa que uma decisão de aprovação/rejeição pode valer diferente em cada lado.

**Preparação de massa:** uma cotação com alçada liberada, criada pelo executor, **e** uma conta com
perfil de comprador que resolva no ERP. Para o cenário do defeito seria preciso uma cotação em
estado divergente — **não crie**: se aparecer naturalmente, documente. **A pendência declarada no
ticket ("intervenções manuais sem controle transacional") não é testável por caso de teste** — é
risco de processo, e cada intervenção manual pode desalinhar mais.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri o **Portal do Comprador** e confirmei o item de menu **Controle de
Cotações**. No bundle publicado, confirmei que a tela tem os filtros **Filial**, **Tipo Documento**,
**Parecer Técnico**, **Em Alçada** e **Data Validade**, com os botões **Limpar Filtros** e
**Filtrar**, e que **Em Alçada** consulta o campo `SC8.C8_XALCADA` — ou seja, **o estado da alçada
que o ticket cita é filtrável pelo Fluig**, sem o ERP. Confirmei também que a *Avaliação de
Propostas* oferece as ações **Validar Proposta**, **Negociar**, **Cancelar Proposta**, **Verificar
Parecer Técnico**, **Salvar Valores Atualizados**, **Visualizar Anexos** e **Visualizar
Cotação/Negociação**. **Não** acionei nenhuma delas.
**Divergências encontradas:** (1) a rota publicada é **`#/controleCotacao`** (singular) — a variante
plural devolve `NG04002` e uma tela em branco; o menu, porém, exibe "Controle de Cotações". (2) O
ticket trata "alçada" como uma etapa só; na tela são **duas grades diferentes** — **`tbAlcadas`** é
a da *Aprovação de Alçada* (atividade 94) e **`tbForneceAlcadas`** é a da *Empresa Vencedora*.
Como o formulário tem **quatro** campos rotulados "Aprovar?", citar o rótulo sem dizer a grade não
identifica o campo; o passo 3 deste caso se refere a **`tbAlcadas`**.
**Dados/massa usados:** nenhum — não submetido, nenhuma cotação filtrada com dados reais
(`genericQuery` 404).

---

## CT-FSWTBC-2326  (protheus · Concluído · SDCASSI-52)

**Título:** Excluir um pedido gerado a partir de uma cotação com vencedores incompletos e conferir que a cotação volta a "em análise" no Portal do Comprador para ser refeita

**Origem:** FSWTBC-2326 — o comprador não selecionou todos os vencedores, pediu exclusão do pedido para regerar, e a cotação não voltou ao status "em análise". Causa: na exclusão do pedido o campo `C8_NUMPED` (SC8) não era limpo; a cotação seguia "processada". Ajuste feito e validado — sem registro de fonte/patch (dúvida de reincidência).

**Módulo/Rota:** Fluig → **Portal do Comprador** (`/portal/p/1/portal-do-comprador`) → *Controle de Cotações* (status da cotação: `Em Cotação`, `Validação de Propostas`, `Em Negociação`, `Gerar Alçada`, `Aprovação de Alçadas`, **`Geração Pedido/Contrato`**, **`Analisado`**) e *Definir Vencedor Cotação*; processo Fluig *Cotação de Produtos/Serviços* (atividade **Aguarda Movimentação Protheus**, seq. 42); Tracker visão *Cotação de Produtos/Serviços*. Protheus → SIGACOM → Pedidos de Compra → *Excluir* (nome de menu a confirmar).

**Módulo ERP:** `Compras`

**Pré-condições**
- Credencial de **comprador** cadastrado na SY1 (a conta de QA não é — `Y1_USER = "undefined"`).
- Uma cotação de homologação **criada pelo executor** com ≥ 2 itens e ≥ 2 fornecedores, em que **apenas um** item teve vencedor definido e o pedido foi gerado.
- Credencial do Protheus para a exclusão do pedido (o pedido a excluir é o gerado pelo próprio executor).
- **Bloqueio:** conta de QA sem matrícula de comprador (limitação de conta, §5-C); exclusão do pedido exige credencial Protheus.

**Passos**
1. No *Portal do Comprador* → *Controle de Cotações*, localizar a cotação e anotar o status (esperado `Geração Pedido/Contrato` ou `Analisado`) e o número do pedido.
2. No Tracker (`PORTAL_TRACKER_COMPRAS_CONTRATOS`, visão *Cotação de Produtos/Serviços*), pesquisar a cotação e anotar a atividade atual do processo Fluig.
3. No Protheus, excluir o pedido gerado (somente o do executor).
4. Voltar ao *Controle de Cotações* e recarregar; abrir *Definir Vencedor Cotação* para a mesma cotação.
5. Repetir o passo 2.

**Resultado esperado**
- Passo 4: a cotação **volta a aparecer como pendente de análise** (status anterior à geração do pedido — `Validação de Propostas`/`Em Negociação`, conforme a etapa), e *Definir Vencedor Cotação* permite selecionar os vencedores que faltavam; os itens da SC voltam a ser listados (a consulta do portal filtra `SC1.C1_PEDIDO = ''`).
- Passo 5: o processo Fluig sai de *Aguarda Movimentação Protheus* / retorna à etapa de vencedores; não fica travado.
- No Protheus, `C8_NUMPED` da cotação está vazio após a exclusão (conferir na tela da cotação, coluna *Pedido*).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Cotação continua com status de processada (`Analisado`), ainda referenciando um pedido inexistente; *Definir Vencedor Cotação* não a oferece; processo Fluig parado sem forma de refazer.

**Severidade:** Média *(bloqueia o fluxo de compra; exige correção manual de dado)*

**Preparação de massa:** cotação de homologação com vencedores parciais e pedido gerado — criada pelo comprador executor a partir de uma SC `QA…`. A cotação do ticket (`000017`, filial `3201`) não foi localizada neste tenant e **não deve ser usada**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** rota do *Portal do Comprador* abre (título "Portal do Comprador", tela *Acesso Rápido*), mas a conta de QA recebe `Comprador não encontrado`; lista de status de cotação lida no fonte publicado (`pc_main.js`: `Em andamento, Analisar, Em Cotação, Em Integração, Validação de Propostas, Em Negociação, Gerar Alçada, Aprovação de Alçadas, Geração Pedido/Contrato, Analisado`); consulta do portal no mesmo fonte com `SC1.C1_PEDIDO='' AND SC1.C1_XNUMCT=''` (itens com pedido somem da lista). Tracker abre com o select das 9 visões.
**Divergências encontradas:** o ticket fala em status "em análise"; os rótulos do portal são *Analisar* / *Analisado* / *Validação de Propostas* — o caso usa os da tela. A atividade Fluig do ticket não é citada; a existente na Cotação é *Aguarda Movimentação Protheus* (seq. 42).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2357  (ambos · Concluído · SDCASSI-59)

**Título:** Liberar a proposta de um fornecedor no Fluig e confirmar que a cotação deixa de estar travada em aprovação.

**Origem:** FSWTBC-2357 — o título do ticket cita erro de controle de alçada na SC 34621 / cotação
`000045-5301` (*"Cotação em aprovação não pode ser alterada"*), **mas o relator corrigiu o
enunciado**: o caso real é a **proposta 01 dos fornecedores Methabio e Vap**, que **não atualizou o
campo "Libera Fluig"** no Protheus, na cotação `000017-3106` da SC 33907. Falha de integração
Fluig → Protheus: o retorno da liberação no Fluig não gravou o flag, deixando a cotação travada em
aprovação. Resolvido por **ajuste pontual de dado** e um procedimento paliativo ensinado ao cliente
— **não por correção de fonte**.

**Módulo/Rota:** Fluig → **Portal do Comprador** → **Controle de Cotações** (`#/controleCotacao`) e
**Avaliação de Propostas** (`#/avaliacaoPropostas`), ação **Validar Proposta**. Campo do ERP
envolvido: `C8_XLIBERA` ("Libera Fluig").

**Pré-condições**
- Uma cotação com **mais de um fornecedor participante** e propostas registradas.
- Perfil de **comprador** válido no ERP.
- **Bloqueio:** triplo. (a) **Sem credencial Protheus** — `C8_XLIBERA` não é inspecionável
  diretamente. (b) **A conta de QA não resolve comprador** (§5-C). (c) `genericQuery` respondendo
  **404** durante a execução: *Avaliação de Propostas* ficou sem dados. Verificável no Fluig de
  forma **indireta**, pela habilitação das ações (ver Resultado esperado).

**Passos**
1. Abrir o **Portal do Comprador** → **Avaliação de Propostas**.
2. Localizar a cotação e expandir os fornecedores participantes.
3. Acionar **Validar Proposta** para a proposta do fornecedor.
4. Aguardar o retorno e observar a notificação exibida.
5. Voltar a **Controle de Cotações** e refiltrar a mesma cotação.
6. Conferir se as ações **Parecer Técnico** e **Bloquear Novos Participantes** continuam
   habilitadas para aquela cotação.
7. Abrir a **Cotação de Produtos/Serviços** no Fluig e ler o campo **"Erro retornado pelo ERP
   Protheus"**.

**Resultado esperado**
- A validação da proposta conclui e a notificação de sucesso é exibida.
- Depois da liberação, a cotação **muda de estado na lista**: ela deixa de ser oferecida como
  pendente de liberação. (No fonte publicado, a habilitação das ações depende de
  `c8_xlibera == "" || (c8_xlibera == "N" && fornecedor == FORNECEDOR_GENERICO)` — ou seja, uma
  cotação **liberada** não deve mais satisfazer essa condição.)
- O campo **"Erro retornado pelo ERP Protheus"** permanece **vazio**.
- Nenhuma mensagem *"Cotação em aprovação não pode ser alterada"* ao operar a cotação depois da
  liberação.
- A liberação vale para **cada fornecedor participante**, não só para o primeiro: validar Methabio
  e Vap deve liberar as duas propostas.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A liberação no Fluig "passa", mas o campo **Libera Fluig** (`C8_XLIBERA`) **não é atualizado** no
  Protheus e a cotação segue travada em aprovação — foi o caso das propostas 01 de **Methabio** e
  **Vap** na cotação `000017-3106` (SC 33907). O sintoma visível ao usuário era a crítica *"Cotação
  em aprovação não pode ser alterada"*.

**Severidade:** Alta — a cotação trava e a única saída documentada é intervenção manual no ERP; e o
paliativo foi transmitido **verbalmente**, sem correção de causa.

**Preparação de massa:** uma cotação com **dois fornecedores** e propostas registradas, criada pelo
executor, mais uma conta com perfil de comprador válido no ERP. **Não consigo montar nenhum dos
dois.** Peça ao time CASSI uma cotação de homologação nesse estado antes de executar.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri **Avaliação de Propostas** (`#/avaliacaoPropostas`) e **Controle de
Cotações**; as telas montam com *Pesquisar*, *Gerenciador de colunas* e *Carregar mais resultados*,
mas **sem dados** (404 no `genericQuery`). No bundle publicado confirmei que `C8_XLIBERA` é um dos
campos consultados pela tela e que ele decide a habilitação das ações **Parecer Técnico** e
**Bloquear Novos Participantes** — que é a superfície do Fluig onde o efeito da liberação aparece
**sem** o ERP. Confirmei o rótulo **"Erro retornado pelo ERP Protheus"** no formulário de Cotação.
**Divergências encontradas:** (1) **o título do ticket permanece errado no Jira** — ele descreve a SC
34621 / cotação `000045-5301`, enquanto o caso real é a cotação `000017-3106` da SC 33907. Quem
buscar o defeito pelo título não o encontra; a divergência é do ticket, não da tela. (2) O ticket
foi encerrado com **paliativo**, não com correção de fonte: *"expliquei ao João Paulo como
proceder"*. **Portanto este caso pode reprovar hoje**, e um vermelho aqui não é regressão — é a
causa nunca corrigida. (3) Na condição de habilitação encontrada no fonte há a exceção codificada ao
**Fornecedor Genérico `85070508`** (ver o achado transversal no topo deste arquivo), que não consta
de nenhum ticket.
**Dados/massa usados:** nenhum — não submetido, nenhuma proposta validada.

---

## CT-FSWTBC-2368  (ambos · Concluído · SDCASSI-62)

**Título:** Percorrer uma cotação de ponta a ponta e confirmar que o parecer técnico só é solicitado depois que a alçada aprovou.

**Origem:** FSWTBC-2368 — após um ajuste feito na **MATA150** (rotina padrão de aprovação de
documentos do Protheus), o **parecer técnico passou a ser solicitado ANTES da alçada**. A ordem
correta é **alçada primeiro, parecer depois**. Regressão introduzida por ajuste próprio em rotina
padrão. Gerou a subtarefa FSWTBC-2377, fechada apenas com *"Acompanhamento Protheus finalizado"*,
**sem descrição do ajuste corretivo**.

**Módulo/Rota:** Fluig → **Portal do Comprador** → **Controle de Cotações** (`#/controleCotacao`),
ações **Parecer Técnico** e **Bloquear Novos Participantes**; Fluig → **Processos** → **Parecer
Técnico** (`processID=wf_solicitacao_compras_parecer`); e Fluig → **Tracker**, filtros *Filtrar
por:* = **Parecer Técnico** e **Cotação de Produtos/Serviços**.

**Pré-condições**
- Uma cotação cujo valor **exija aprovação de alçada** e que também **exija parecer técnico**
  (`C8_XPARTEC = "S"` em pelo menos um fornecedor).
- Perfil de **comprador** e um **aprovador de alçada** disponíveis.
- **Bloqueio:** triplo. (a) **Sem credencial Protheus** — a ordem de execução na MATA150 não é
  observável por mim. (b) **A conta de QA não resolve comprador** nem é aprovador de alçada.
  (c) Exige percorrer um fluxo completo de aprovação, o que não fiz. Verificável no Fluig pela
  **ordem cronológica** dos processos (ver Resultado esperado).

**Passos**
1. Abrir o **Tracker** e, em *Filtrar por:*, selecionar **Cotação de Produtos/Serviços**.
2. Informar o **Nº da Cotação ERP** (ou o **Nº do Processo Fluig**) da cotação sob teste e anotar a
   **Data da Solicitação**.
3. Trocar *Filtrar por:* para **Parecer Técnico** e localizar o processo de parecer vinculado à
   mesma cotação; anotar a data de abertura.
4. Abrir a **Cotação de Produtos/Serviços** e conferir, na aba **Histórico**, o instante em que a
   atividade **Aprovação de Alçada** (grade `tbAlcadas`, atividade 94) foi concluída.
5. Comparar: **data/hora da conclusão da alçada** × **data/hora de abertura do processo de Parecer
   Técnico**.
6. No **Controle de Cotações**, conferir que a ação **Parecer Técnico** só está disponível para
   cotações que já passaram pela alçada.

**Resultado esperado**
- O processo de **Parecer Técnico** é aberto **depois** da conclusão da **Aprovação de Alçada** —
  a data/hora do passo 3 é posterior à do passo 4, sempre.
- Nenhuma cotação apresenta processo de parecer técnico aberto enquanto a alçada ainda está pendente.
- No **Controle de Cotações**, a ação **Parecer Técnico** não é oferecida antes da alçada.
- O ajuste na MATA150 não altera a ordem das duas etapas: alçada → parecer.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O parecer técnico é solicitado no Protheus **antes** da alçada — invertendo a ordem do fluxo
  (evidência original: anexo `Parecer+tecnico+apos+alcada.png`). Na prática, o parecerista é
  acionado para uma compra que a alçada ainda pode reprovar.

**Severidade:** Alta — é regressão de **ordem de aprovação**: parecer emitido antes da alçada
significa esforço técnico gasto em compra não autorizada e, pior, um parecer pode ser usado para
justificar a alçada que deveria vir antes dele.

**Preparação de massa:** uma cotação que **simultaneamente** ultrapasse o limite de alçada e exija
parecer técnico, criada pelo executor, mais um aprovador de alçada disponível. Não consigo montar
esse cenário (sem perfil de comprador nem de aprovador). **Alternativa executável hoje:** rodar
apenas os passos 1–5 sobre cotações **já concluídas** — é auditoria retroativa, não exige perfil
nenhum e detecta a inversão igualmente.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri o processo **Parecer Técnico**
(`processID=wf_solicitacao_compras_parecer`): a tela abre como *Movimentar Solicitação*, com o
título de atividade **Início** e as abas *Formulário / Informações / Histórico / Anexos* — ou seja,
**o processo existe e é iniciável**. No **Tracker**, confirmei em tela que *Filtrar por:* oferece
**Parecer Técnico** e **Cotação de Produtos/Serviços** na mesma lista, com *Data da Solicitação
(De)/(Até)* — que é o que torna a comparação cronológica do passo 5 possível **sem** o Protheus. No
bundle do Portal do Comprador, confirmei a ação **Parecer Técnico** dentro de *Controle de
Cotações*, com o diálogo *"Deseja inserir parecer técnico para a cotação selecionada?"* (Sim/Não).
**Divergências encontradas:** o ticket e a subtarefa FSWTBC-2377 **fecham sem qualquer registro
técnico do que foi corrigido** — apenas "acompanhamento finalizado". Não há como saber se a ordem
foi restabelecida por ajuste na MATA150, por configuração ou por customização paralela; **este caso
é a única evidência disponível de que a ordem está correta hoje**. Registro ainda o sinal estrutural
apontado no próprio ticket: a customização de alçada está acoplada a uma **rotina padrão**
(MATA150), sem teste de regressão — o que significa que **qualquer** próximo ajuste na MATA150 pode
reinverter a ordem sem aviso.
**Dados/massa usados:** nenhum — não submetido, nenhum processo de parecer iniciado.

---

## CT-FSWTBC-2387  (protheus · Concluído · SDCASSI-63)

**Título:** Enviar propostas de uma cotação após a cotação genérica ter sido excluída e conferir que a proposta não chega zerada na Avaliação de Propostas

**Origem:** FSWTBC-2387 — cotação `000011` filial `3503`, proposta 02 com valores **zerados**. Causa: `C8_SCORI`, `C8_ITEMSC` e `C8_IDENT` são preenchidos a partir da **cotação genérica**; quando a proposta foi enviada, a genérica **já tinha sido excluída** e os campos ficaram vazios. Correção 100 % manual (restauração da genérica, exclusão e reenvio da proposta). **Sem tratamento preventivo** — reincidência provável.

**Módulo/Rota:** Fluig → **Portal do Comprador** → *Avaliação de Propostas* e *Definir Vencedor Cotação* (dados via `getEvalQuotesDhuERP`); processo *Negociação de Cotação de Produtos/Serviços* (formulário 256835, campo **Erro retornado pelo ERP Protheus**); Tracker visão **Negociação de Cotação de Produtos/Serviços (Detalhado Itens)**; *Logs Protheus* → aba *Erros CV8*. Protheus → SIGACOM → Cotações → cotação genérica → *Excluir* (nome de menu a confirmar).

**Módulo ERP:** `Compras`

**Pré-condições**
- Credencial de **comprador** (SY1) para o Portal do Comprador; credencial do Protheus para excluir a cotação genérica **criada pelo executor**.
- Cotação de homologação criada pelo executor (SC `QA…` → cotação) com ≥ 2 fornecedores e propostas **ainda não enviadas** ao Protheus.
- **Bloqueio:** conta de QA sem matrícula de comprador (§5-C); `getEvalQuotesDhuERP` responde 404 por instabilidade hoje; exclusão da genérica exige credencial Protheus.

**Passos**
1. No Protheus, anotar a cotação genérica ligada à cotação de teste (número, itens, `C8_SCORI/C8_ITEMSC/C8_IDENT`).
2. **Excluir a cotação genérica** (a do executor) antes de enviar as propostas.
3. No fluxo Fluig, enviar/registrar as propostas dos fornecedores (etapa de Negociação → integração).
4. No Portal do Comprador → *Avaliação de Propostas*, abrir a cotação e ler os valores unitário/total de cada proposta.
5. Abrir a instância de Negociação no Fluig (Tracker → visão *Detalhado Itens* / *Histórico*) e ler *Erro retornado pelo ERP Protheus*.
6. Abrir *Logs Protheus* → *Erros CV8* filtrando a data.

**Resultado esperado**
- Ou o sistema **impede** a exclusão da genérica enquanto há propostas pendentes de envio (passo 2 bloqueado com crítica), ou
- o envio no passo 3 **falha explicitamente** — *Erro retornado pelo ERP Protheus* preenchido e registro em *Erros CV8* — e nenhuma proposta é gravada com valores zerados.
- Passo 4: nenhuma proposta com valor 0,00 quando o fornecedor informou preço; itens com `C8_SCORI/C8_ITEMSC` coerentes com a SC.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Proposta gravada com **valores zerados** na Avaliação de Propostas (cotação `000011`/`3503`, proposta 02); campos de origem vazios; sem mensagem de erro; correção só por restauração manual da genérica.

**Severidade:** Alta *(decisão de compra sobre proposta com valor errado; sem proteção no sistema)*

**Preparação de massa:** SC `QA…` → cotação com ≥ 2 fornecedores, propostas pendentes, criada pelo comprador executor; cotação genérica correspondente identificada antes do passo 2. A cotação do ticket (`000011`/`3503`) **não deve ser usada**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Portal do Comprador* abre (título "Portal do Comprador"), mas a conta de QA não é comprador (`Comprador não encontrado`); no fonte publicado, o dataset da cotação lista `C8_NUMSC, C8_ITEMSC, C8_IDENT, C8_NUMPED` entre os campos lidos e `getEvalQuotesDhuERP` é chamado em 4 pontos; *Logs Protheus* abre com a aba *Erros CV8* (consulta em 404 hoje — ambiente). Rótulo *Erro retornado pelo ERP Protheus* confirmado em lotes anteriores para Cotação/Negociação.
**Divergências encontradas:** o fonte do portal não referencia `C8_SCORI` (usa `SC1.C1_SCORI` na junção) — o caso cita os campos do ticket como campos do ERP, não da tela.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2404  (ambos · Concluído)

**Título:** Percorrer as quatro telas de avaliação de propostas do Portal do Comprador e conferir, uma a uma, quais lacunas da MIT044 a entrega cobriu.

**Origem:** FSWTBC-2404 — GAPs identificados durante o desenvolvimento da **DEM10013707** (tela de
avaliação de propostas via Fluig). Quatro levantados, três confirmados: **(1)** a MIT044 prevê
exclusão completa de **cotação e de solicitação de compras**, mas o Protheus só expõe API de
exclusão da **SC** — não há API especificada para excluir a cotação; **(2)** a API de fornecedores
eleitos prevê enviar os vencedores, mas a MIT044 **não detalha como enviar a quantidade atendida por
fornecedor** nem quais produtos cada um venceu; **(3)** a MIT044 **não especifica a reestruturação
assíncrona** da integração (Protheus receber, enfileirar, processar e só então movimentar o processo
no Fluig). O quarto item (MATA151 → Novo Fluxo de Compras / PGCA010) foi avaliado e marcado
explicitamente como **não é gap**. São gaps de **especificação**, não de código. Duplica FSWTBC-2272
e FSWTBC-2273.

**Módulo/Rota:** Fluig → **Portal do Comprador** (`/portal/p/1/portal-do-comprador`) → **Validação
Inicial** (`#/validacaoInicial`), **Controle de Cotações** (`#/controleCotacao`), **Avaliação de
Propostas** (`#/avaliacaoPropostas`) e **Definir Vencedor Cotação** (`#/propostaVencedora`).

**Pré-condições**
- Perfil de **comprador** válido no ERP (todas as quatro telas são de comprador).
- Cotações em aberto, com propostas de mais de um fornecedor.
- **Bloqueio:** triplo. (a) **A conta de QA não resolve comprador** (`Comprador não encontrado`,
  §5-C) — nenhuma das quatro telas carrega dados para este login. (b) `genericQuery` respondendo
  **404** durante a execução. (c) **Sem credencial Protheus** para confirmar o outro lado das APIs.
  As telas **montam** e os controles são inspecionáveis; os dados, não.

**Passos**
1. Abrir o **Portal do Comprador** e conferir que o menu lateral oferece **Validação Inicial**,
   **Controle de Cotações**, **Avaliação de Propostas** e **Definir Vencedor Cotação**.
2. Abrir **Validação Inicial** e conferir os filtros (*Filial*, *Produto*, *Grupo de Produto*,
   *Centro de Custo*, *justificativa*) e os botões **Buscar** e **Centralizar Solicitações**.
3. Abrir **Controle de Cotações** e conferir os filtros **Filial**, **Tipo Documento**, **Parecer
   Técnico**, **Em Alçada** e **Data Validade**, e as ações **Exportar Dados**, **Bloquear Novos
   Participantes** e **Parecer Técnico**.
4. **(gap 1 — exclusão)** Procurar, nas quatro telas, qualquer ação de **excluir cotação** ou
   **excluir solicitação de compras**.
5. Abrir **Avaliação de Propostas** e conferir as ações **Validar Proposta**, **Negociar**,
   **Cancelar Proposta**, **Verificar Parecer Técnico**, **Salvar Valores Atualizados**,
   **Visualizar Anexos** e **Visualizar Cotação/Negociação**.
6. **(gap 2 — quantidade atendida)** Abrir **Definir Vencedor Cotação**, marcar um fornecedor como
   vencedor **sem informar a quantidade** e acionar o processamento.
7. Marcar os vencedores **com** quantidade e processar; observar a notificação.
8. **(gap 3 — assíncrono)** Observar o comportamento da tela durante o passo 7: ela fica bloqueada
   aguardando o retorno do ERP, ou devolve o controle e acompanha o processamento depois?

**Resultado esperado**
- As **quatro** telas existem no menu e abrem.
- **(gap 2 — coberto)** Ao processar vencedores sem quantidade, o sistema recusa com a mensagem
  **"Existem vencedores selecionados sem quantidade informada para processar."**; com nenhum
  vencedor, **"Nenhum vencedor encontrado para processar."**; com tudo certo, **"A cotação foi
  atualizada com os vencedores!"**; em falha, **"Ocorreu uma falha na atualização do vencedor!"** ou
  **"Erro inesperado na atualização da cotação!"**. A quantidade atendida por fornecedor **é**
  enviada (campo `C8_XQTAUDI`, junto do flag de vencedor `C8_XVENC`).
- **(gap 1 — em aberto)** Se a exclusão de cotação **não** foi incorporada ao escopo, **não deve
  haver** ação de exclusão em nenhuma das quatro telas — e isso precisa estar registrado como
  decisão, não como esquecimento.
- **(gap 3 — em aberto)** Se a fila assíncrona não foi implementada, a tela **bloqueia** durante a
  chamada ao ERP; o critério de aceite deve dizer qual dos dois comportamentos é o esperado.
- **Bloquear Novos Participantes** exige parecer técnico antes: a tela avisa **"Parecer Técnico
  Obrigatório — Antes de bloquear a cotação para novos participantes, é obrigatório informar o
  parecer técnico."** e só depois pergunta **"Deseja bloquear novos participantes para a cotação
  selecionada?"**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Não há sintoma de tela: o "defeito" é a **MIT044 aprovada incompleta**, descoberta durante o
  desenvolvimento. O que reincide é entregar contra especificação que não define contrato de dados
  (quais produtos cada vencedor levou, em que quantidade) nem o modelo de integração.

**Severidade:** Média — não bloqueia o uso hoje; o risco é de escopo e de contrato de dados, que se
manifesta como retrabalho e como divergência de expectativa com o cliente.

**Preparação de massa:** uma cotação com **pelo menos dois fornecedores** e propostas registradas, e
uma conta com **perfil de comprador** válido no ERP. Sem a conta de comprador **nenhum dos passos
6–8 é executável**. Os passos 1–5 (existência de telas, filtros e ações) rodam com qualquer conta e
já respondem ao gap 1.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri as **quatro** telas. O menu lateral do Portal do Comprador lista
**Validação Inicial, Controle de Cotações, Avaliação de Propostas, Definir Vencedor Cotação**, e o
bloco *Acesso Rápido* repete os quatro. **Validação Inicial** montou com os botões **Buscar** e
**Centralizar Solicitações** e os campos *Selecione a Filial / o Produto / o Grupo de Produto / o
Centro de Custo* e *justificativa*. **Avaliação de Propostas** e **Definir Vencedor Cotação**
montaram com *Pesquisar*, *Gerenciador de colunas* e *Carregar mais resultados*, **sem dados**
(`genericQuery` 404 — ambiente). Sobre os três gaps, o que apurei no bundle publicado:

- **Gap 2 (quantidade atendida por fornecedor) — COBERTO.** `sendWinningProposals` valida
  `C8_XVENC && Number(C8_XQTAUDI) <= 0` e recusa com *"Existem vencedores selecionados sem
  quantidade informada para processar."*; o envio vai para
  `POST <protheus>/api/v2/fluig/compras/cotacao/gravaVencedor/<...>` com `tenantId: "01,<filial>"`.
  Os campos `C8_XVENC`, `C8_XQTAUDI` e `C8_XAUDIT` estão na lista consultada. **O contrato de dados
  que a MIT044 não detalhava existe e está implementado.**
- **Gap 1 (exclusão de cotação e de SC) — NÃO IMPLEMENTADO.** Procurei por ação de exclusão nas
  quatro telas e **no bundle inteiro**: não há nenhuma. O que existe é **"Cancelar Proposta"**
  (cancela a proposta, não exclui a cotação) e **"Bloquear Novos Participantes"** (`blockQuote`).
  **Confirma-se o gap: a exclusão prevista na MIT044 não chegou à tela.**
- **Gap 3 (integração assíncrona / fila) — NÃO IMPLEMENTADO.** Nenhum indício de enfileiramento,
  polling ou acompanhamento de processamento diferido no bundle; as chamadas ao Protheus são
  **síncronas**, com a tela em `po-loading-overlay` e `p-screen-lock` durante a espera. É coerente
  com o histórico: **o timeout síncrono é exatamente a causa do CT-FSWTBC-2141 deste mesmo lote**, e
  a solução definitiva foi remetida à DEM10014371. Os dois tickets descrevem o mesmo problema
  estrutural por ângulos diferentes.

**Divergências encontradas:** (1) a rota publicada de Controle de Cotações é **`#/controleCotacao`**
(singular), enquanto o menu exibe *"Controle de Cotações"*; a variante plural devolve `NG04002`.
(2) O ticket fecha como **"Feito"** sem registrar **como** cada gap foi resolvido; medindo o fonte
publicado, **um dos três gaps foi implementado (o 2) e dois continuam abertos (o 1 e o 3)** —
"Feito" aqui significa "levantamento concluído", não "gaps resolvidos". Os 81 dias em execução e a
triplicidade do registro (2272/2273/2404) reforçam que houve negociação de escopo não documentada.
(3) Achado extra, sem ticket: o fornecedor **`85070508` / loja `0001`** é removido por hardcode
(`replaceGenericSupplier`, `FORNECEDOR_GENERICO`) das listas **antes** do processamento, inclusive no
caminho que alimenta o envio de vencedores — ver o achado transversal no topo deste arquivo.
**Dados/massa usados:** nenhum — não submetido, nenhum vencedor marcado, nenhuma cotação bloqueada.

---

## Resumo do lote

| # | Caso | Verificado | Bloqueio principal |
|---|---|---|---|
| 1 | CT-FSWTBC-2141 | PARCIAL | sem credencial Protheus + exige medição real na atividade de encerramento |
| 2 | CT-FSWTBC-2143 | PARCIAL | sem credencial Protheus (CNF não inspecionável) |
| 3 | CT-FSWTBC-2158 | PARCIAL | exige rotina batch/schedule + causa-raiz (tipagem no dicionário) **sem superfície de front-end** |
| 4 | CT-FSWTBC-2187 | PARCIAL | reprodução exige forçar erro na ExecAuto; auditoria via Tracker é o caminho viável |
| 5 | CT-FSWTBC-2248 | PARCIAL | efeito central (pedido de compra não gerado) **sem superfície de front-end** |
| 6 | CT-FSWTBC-2257 | PARCIAL | conta não resolve comprador + `genericQuery` 404 |
| 7 | CT-FSWTBC-2278 | PARCIAL | massa (produto com duas contas contábeis) não identificável sem o ERP |
| 8 | CT-FSWTBC-2315 | PARCIAL | conta não resolve comprador; reproduzir exigiria provocar estado divergente |
| 9 | CT-FSWTBC-2348 | PARCIAL | fechar até o RDFC exige nota fiscal; passo 3 é executável e já detecta |
| 10 | CT-FSWTBC-2357 | PARCIAL | conta não resolve comprador + `genericQuery` 404 |
| 11 | CT-FSWTBC-2368 | PARCIAL | exige perfil de comprador e de aprovador de alçada; auditoria retroativa é viável |
| 12 | CT-FSWTBC-2386 | PARCIAL | massa (duas lojas do mesmo fornecedor) inexistente para esta conta |
| 13 | CT-FSWTBC-2388 | PARCIAL | `C8_XPARTEC` só é configurável no Protheus |
| 14 | CT-FSWTBC-2404 | PARCIAL | conta não resolve comprador + `genericQuery` 404 |

**Casos que hoje podem reprovar (a causa nunca foi corrigida, e um vermelho não é regressão):**
CT-FSWTBC-2388 (tela vazia sem mensagem quando `C8_XPARTEC = N` — confirmado no fonte publicado),
CT-FSWTBC-2357 (encerrado com paliativo manual, sem correção de fonte) e CT-FSWTBC-2348 (não há
registro técnico de que o default `'01'` tenha sido removido).

**Casos sem superfície de front-end para o efeito principal (3):** CT-FSWTBC-2158 (tipagem do campo
de dia da medição no dicionário e agendamento da rotina), CT-FSWTBC-2248 (geração do pedido de
compra a partir da medição) e, parcialmente, CT-FSWTBC-2141 (o comportamento de timeout da API — só
o sintoma é observável, pelo Histórico e pelo campo *Erro de Integração*).

## CT-FSWTBC-2430  (fluig · Concluído · SDCASSI-67)

**Título:** Abrir uma Solicitação de Compras na atividade Validação do Comprador (Negociação) e a grade listar os fornecedores das propostas.

**Origem:** FSWTBC-2430 — SD774169. A **SC 31120** não carregava os fornecedores na etapa **Validação do
Comprador (Negociação)**. O ticket foi fechado como *Feito* **sem nenhum comentário técnico** de causa ou
correção — não é auditável. Pelo contexto dos tickets vizinhos (2440, 2532, 2547), a família de falhas
dessa etapa gira em torno de dataset de cotação com trava de data e de perda de campos no retorno do parecer.

**Módulo/Rota:** Solicitação de Compras, atividade **Validação do Comprador (Negociação)** — seção
**Validação do Comprador (Definir Negociação)** do formulário 256831. Acesso pela **Central de Tarefas**
(`/portal/p/1/pagecentraltask`) → aba **Tarefas a concluir**.

**Pré-condições**
- Uma SC que já passou por **Aguarda Finalizar Cotação** → **Cotação foi Finalizada?** e está parada em
  **Validação do Comprador (Negociação)**.
- Ao menos uma proposta de fornecedor recebida na cotação de origem.
- O executor precisa ser o responsável pela tarefa (ou tê-la sob sua gerência).
- **Bloqueio:** **sim** — nenhuma das 11 *Tarefas a concluir* da conta de QA hoje está nessa etapa (estão
  em *Validação do Gestor*, *Correção* e *Acompanhamento Status*), e chegar até lá exige enviar uma SC e
  concluir uma cotação com proposta de fornecedor — para o que não há credencial de fornecedor.

**Passos**
1. Abrir **Central de Tarefas** → clicar explicitamente na aba **Tarefas a concluir** (a Central guarda a
   sub-aba por sessão no servidor; não confie no estado herdado).
2. Localizar a solicitação cuja **Localização** seja **Validação do Comprador (Negociação)** e clicar em
   **Selecionar**.
3. No formulário, rolar até a seção **Validação do Comprador (Definir Negociação)**.
4. Ler a grade de propostas.
5. Conferir, na seção **Verificar Retorno Protheus**, o campo **Retorno Integração\***.

**Resultado esperado**
- A grade exibe **uma linha por proposta recebida**, com as colunas preenchidas: **Nº Proposta**,
  **Nº Versão**, **Fornecedor**, **Status Area Dem.**, **Status Area TI.** e **Negociação?**.
- A coluna **Fornecedor** traz o nome de cada fornecedor — **não** fica em branco nem a grade vazia.
- O campo **Enviar para Negociação? \*** é acionável para cada linha.
- **Retorno Integração\*** não acusa erro de busca das propostas.

**Resultado se o defeito reincidir**
- A grade de *Validação do Comprador (Definir Negociação)* aparece **sem os fornecedores** (linhas
  ausentes ou coluna *Fornecedor* vazia), impedindo definir quem vai para negociação — caso concreto
  do ticket: **SC 31120**. Mensagem de erro exata: `<não documentado>` (o ticket traz apenas o print
  `image-20250815-202802.png`).

**Severidade:** Média *(bloqueia o fluxo: sem fornecedor listado o comprador não consegue definir a
negociação)*

**Preparação de massa:** uma SC do próprio executor levada até **Validação do Comprador (Negociação)**,
com pelo menos **duas** propostas de fornecedores distintos recebidas na cotação (duas para que a ausência
de uma delas seja visível). Depende de credencial de fornecedor no Portal do Fornecedor, que não existe
nesta rodada, ou do apoio de quem opere a Recepção de Propostas.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **Validação do Comprador (Negociação)** é um nome real de atividade do BPM —
observado em 2 das 34 instâncias de SC amostradas (**112854** e **112163**), com duração de 210 s e 64 s,
sempre logo após *Cotação foi Finalizada?* e antes de *Processo de Negociação*. No formulário da SC, a
seção **Validação do Comprador (Definir Negociação)** existe, com as colunas **Nº Proposta**, **Nº Versão**,
**Fornecedor**, **Status Area Dem.**, **Status Area TI.**, **Negociação?** e o rótulo **Enviar para
Negociação? \***; e a seção **Verificar Retorno Protheus** com o campo **Retorno Integração\***. A Central
de Tarefas abre com as abas *Resumo de Tarefas*, **Tarefas a concluir 11**, *Solicitações 121* (*Minhas
solicitações 34*, *Tarefas sob minha gerência 87*), *Documentos 30*, e filtro de prazo *Todos / Atrasadas /
No prazo / Próximas a vencer*.
**Divergências encontradas:** duas. (1) A atividade do BPM chama-se **"Validação do Comprador
(Negociação)"** mas a seção correspondente **no formulário** chama-se **"Validação do Comprador (Definir
Negociação)"** — nome diferente para a mesma coisa, entre a Central de Tarefas e o formulário. (2) O
ticket fala em "carregar os fornecedores"; a grade real é de **propostas**, e o fornecedor é **uma coluna**
dela — não há grade de fornecedores separada.
**Dados/massa usados:** nenhum — não submetido; nenhuma tarefa de terceiro foi aberta.

---

## CT-FSWTBC-2532  (fluig · Concluído · SDCASSI-72)

**Título:** Finalizar o Parecer Técnico e a Solicitação de Compras avançar para Validação do Comprador (Negociação) listando os pareceres e mantendo número da SC, cotação e pareceres.

**Origem:** FSWTBC-2532 — SD775507. Dois sintomas encadeados na **SC 19699**: (1) **divergência de
revisão** — a SC na revisão *001* e os pareceres na *002*; como a listagem casa por número de revisão, os
pareceres não apareciam; (2) **perda de dados na movimentação** — ao finalizar o parecer, *número da
solicitação*, *cotação* e *números dos pareceres* desapareciam do formulário. O relator provou por
versionamento: na versão **9000** do formulário os dados existiam, na **10000** (gerada pela movimentação
do parecer) sumiram. Mesma causa e mesma MUD do FSWTBC-2424 (**MUD16218**).

**Módulo/Rota:** Solicitação de Compras, atividade **Validação do Comprador (Negociação)** → seção
**Validação do Comprador (Definir Negociação)**; e Parecer Técnico, atividade **Validação do Parecer
Técnico**.

**Pré-condições**
- Uma SC com **cotação gerada** e **pelo menos dois pareceres técnicos** solicitados (para que a listagem
  tenha o que mostrar).
- A SC precisa ter sofrido **ao menos uma revisão** depois de os pareceres serem gerados — é essa
  divergência de número de revisão que o defeito explorava.
- Registro, **antes** de finalizar o parecer, do número da versão do formulário da SC.
- **Bloqueio:** **sim** — exige SC submetida, cotação gerada, dois pareceres solicitados e uma revisão
  intercalada. Nada disso existe na base hoje (1 parecer, sem pai; grade de contratos vazia).

**Passos**
1. Abrir a SC e **anotar**: **Nº da Solicitação ERP \***, **Nº da Cotação ERP \***, as linhas da grade
   *Validação do Comprador (Definir Negociação)* (com a coluna **Nº Versão**) e o **número da revisão** da SC.
2. Anotar o número de revisão registrado em **cada** parecer aberto.
3. Finalizar o(s) parecer(es) — atividade **Validação do Parecer Técnico** → **Fim**.
4. Aguardar a SC avançar e abri-la na atividade **Validação do Comprador (Negociação)**.
5. Reler todos os campos do passo 1 e contar as linhas da grade.
6. Conferir, na aba **Informações**, o número da versão do formulário antes e depois da movimentação.

**Resultado esperado**
- **Todos os pareceres emitidos aparecem** na listagem da SC, **independentemente** de a revisão da SC ter
  avançado em relação à revisão gravada no parecer. A listagem casa por **identidade da SC**, não por
  número de revisão.
- **Nº da Solicitação ERP \***, **Nº da Cotação ERP \*** e os números dos pareceres continuam **com os
  mesmos valores** após a movimentação.
- A grade *Validação do Comprador (Definir Negociação)* mantém as linhas, incluindo a coluna **Nº Versão**
  de cada proposta.
- O avanço da versão do formulário (ex.: 9000 → 10000) **não** apaga campo algum.

**Resultado se o defeito reincidir**
- Os pareceres **não aparecem** na Validação do Comprador (Negociação) quando a SC está na revisão *001* e
  os pareceres na *002* — listagem vazia sem mensagem de erro.
- Após a finalização do parecer, o formulário da SC volta com **número da solicitação, cotação e números
  dos pareceres em branco**. O discriminante é o versionamento: comparar a versão anterior (dados
  presentes) com a nova (dados ausentes) — v9000 × v10000 no caso original.

**Severidade:** Alta *(perda de dado + trilha de parecer invisível na decisão de negociação; risco de
aprovação sem o parecer técnico devido)*

**Preparação de massa:** uma SC do executor com cotação gerada, **dois** pareceres técnicos solicitados e
uma **revisão da SC feita depois** de os pareceres nascerem — para que a divergência 001×002 exista. Só o
time que opera Compras consegue montar isso; a conta de QA não.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a atividade **Validação do Comprador (Negociação)** foi confirmada como nome
real do BPM em 2 instâncias (112854, 112163). Na SC, a seção **Validação do Comprador (Definir
Negociação)** traz a coluna **Nº Versão** — o campo que o defeito usa para casar SC e parecer — além de
**Nº Proposta**, **Fornecedor**, **Status Area Dem.**, **Status Area TI.** e **Negociação?**. Os campos
**Nº da Solicitação ERP \*** e **Nº da Cotação ERP \*** existem e são `readonly`. No formulário da SC há
também os campos **Número do Contrato** e **Revisão do Contrato**. A aba **Informações** existe na
plataforma, ao lado de *Formulário / Histórico / Anexos*.
**Divergências encontradas:** o ticket fala em "listar os pareceres"; a grade real da seção
*Validação do Comprador (Definir Negociação)* **não tem coluna de número de parecer** — o status dos
pareceres aparece condensado em **Status Area Dem.** e **Status Area TI.**. Além disso, a **Revisão**
visível no formulário da SC é a **"Revisão do Contrato"**; a "revisão 001/002" do ticket (revisão da
própria SC) não tem campo com esse rótulo na tela.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2536  (ambos · Concluído)

**Título:** O comprador centraliza solicitações de compra e confirma, no Fluig, que a SC
centralizadora nasceu com as SCs de origem e os fornecedores gravados.

**Origem:** FSWTBC-2536 — compatibilização da versão de *Compras Centralizadas* (DEM10013706) com
a produção. O ticket não descreve defeito próprio; o conteúdo útil é o contrato herdado do épico:
atividade de serviço "Abre Solicitação de Compra no ERP", integração com **3 tentativas
automáticas**, centralização pelo Portal do Comprador e **gravação dos fornecedores no formulário
da SC**. Foi para Concluído, **reaberto em 04/09/2025 sem motivo documentado** e refeito.

**Módulo/Rota:** *Menu inicial › Portais de Compras e Contratos › Portal do Comprador*
(`/portal/p/1/portal-do-comprador`) para centralizar; efeito no processo **Solicitação de
Compras** (`/portal/p/1/pageworkflowview?processID=wf_solicitacao_compras`, form **256831**),
seções **"Identificação do(s) Produto(s)/Serviço(s) - Solicitações Centralizadas"** e
**"Produtos/Serviços das Solicitações Centralizadas"**; diagnóstico da integração em
*Logs Protheus* › aba **Solicitacoes ZZY**.

**Pré-condições**
- Duas ou mais SCs abertas, de filiais diferentes, elegíveis a centralização.
- Conta com **matrícula de comprador** resolvida no ERP (`Y1_USER`).
- **Bloqueio:** **sim** — a conta de QA `TOTVS-FS` **não resolve matrícula de comprador**: o Portal
  do Comprador registra em console `"Erro ao buscar as informações do colaborador na lista de
  usuários do ERP Protheus. Error: Error: Comprador não encontrado."` (limitação de conta, §5-C,
  **não** defeito). Some-se o 404 do `genericQuery` na aba ZZY.

**Passos**
1. Abrir o Portal do Comprador e centralizar duas SCs de origem numa empresa/filial centralizadora.
2. Abrir a SC centralizadora resultante em *Solicitação de Compras*.
3. Na seção **"Produtos/Serviços das Solicitações Centralizadas"**, conferir a grade
   `tbProdutosCentralizados`: deve haver **uma linha por SC de origem**, com
   *Nº SC Origem* (`tbprodcent_numSCOrigem`), *Nº do Processo* (`tbprodcent_numProcesso`),
   solicitante (`tbprodcent_codSolicitante` / `tbprodcent_mailSolicitante`) e filial de entrega
   (`tbprodcent_filEntrega`).
4. Conferir que os fornecedores selecionados para cotação aparecem como **cartões de fornecedor**
   no painel da SC (montados a partir do campo `listaFornecedores`, no formato `código-loja`
   separado por `;`).
5. Abrir a aba **Histórico** da solicitação e localizar o registro da atividade de serviço
   **"Abre Solicitação de Compra no ERP"**.
6. Abrir *Logs Protheus* › **Solicitacoes ZZY**, filtrar pela *Filial* e pela *Chave* da SC e
   clicar **Consultar**.

**Resultado esperado**
- A grade `tbProdutosCentralizados` traz **uma linha por SC de origem**, nenhuma faltando e
  nenhuma duplicada; os campos ocultos `solCentralizadora = "Sim"`, `nrSolCentralizadora`,
  `codFilialSolCentral`, `dataCentralizacao`, `horaCentralizacao` e `matriculaCentralizacao` estão
  preenchidos.
- Os fornecedores gravados em `listaFornecedores` aparecem como cartões; nenhum cartão em branco.
- O **Histórico** registra a integração concluída (padrão do ambiente:
  `Integração executada com sucesso - Tempo de Execução N s`).
- Na aba **Solicitacoes ZZY**, a linha da SC tem *Status Proth* e *Status Fluig* de sucesso e
  **`Qtd T.Env Fl` ≤ 3** — a política de retry é de **três** tentativas; um valor maior indica que
  o limite não está sendo respeitado.
- Havendo falha, ela é **identificável**: a coluna *Msg Ret Flui* / *Json Retorno* traz causa, e a
  SC não fica indistinguível de "nenhum resultado".

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Ticket sem sintoma registrado (tarefa de merge, sem anexo e sem comentário). O risco declarado
  na análise é o **contrato de erro da API de centralização**
  (`/api/v1/fluig/integracao/compras/solicitacao/centraliz`): **erro devolve `items` vazio, sem
  código nem mensagem** — o consumidor não distingue "falhou" de "nada encontrado".
- Sintoma correspondente no Fluig: a SC centralizadora abre com a grade
  `tbProdutosCentralizados` **vazia** e **sem nenhuma mensagem de erro**.

**Severidade:** Alta — centralização perdida silenciosamente afeta o valor consolidado que segue
para cotação e alçada.

**Preparação de massa:** duas SCs abertas em filiais distintas, elegíveis a centralização, e uma
conta com matrícula de comprador cadastrada no Protheus (`Y1_USER`). **Não pode ser criada pelo
executor de QA** — depende de cadastro de comprador no ERP, fora do alcance desta conta.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — `/portal/p/1/portal-do-comprador` abre
(título *"Cassi - Fluig Plataforma - Portal do Comprador"*, cabeçalho **Acesso Rápido**) e falha
com `Comprador não encontrado`; `/portal/p/1/portal_logs_protheus` abre com a aba
**Solicitacoes ZZY** e os filtros *Filial*, *Chave*, *Rotina*, *Status* (`Todos/P/E/S`),
*Data inicial*, *Data final* e o botão **Consultar**; ao consultar, `genericQuery` responde **404**
e sai o toast *"Logs Protheus: Nao foi possivel consultar o dataset de logs."*.
*Lido no fonte publicado* — no formulário da SC (`form 256831`) existem as seções
*"Identificação do(s) Produto(s)/Serviço(s) - Solicitações Centralizadas"* e
*"Produtos/Serviços das Solicitações Centralizadas"*, a grade `tbProdutosCentralizados` e os campos
`solCentralizadora`, `nrSolCentralizadora`, `codFilialSolCentral`, `dataCentralizacao`,
`horaCentralizacao`, `matriculaCentralizacao`, `listaFornecedores`; o `ViewHandler` abre
`#collapseProductsCenter` e chama `handleMountObjDTableCenterSC()` quando
`solCentralizadora == 'Sim'`; o BPM tem a atividade **307 `fimCompraCentralizada`** e a atividade
de correção **297 "Correção - Abre Solicitação de Compra no ERP"**, que é a citada no ticket.
**Divergências encontradas:** (a) o rótulo do ticket é *"Portal do Comprador"* e o menu bate, mas
os quatro itens do *Acesso Rápido* **não expõem nome acessível** — não são alcançáveis por texto;
(b) **achado**: o widget *Logs Protheus* **não estava catalogado** entre as superfícies do §5-B e é
a única forma de observar o contador de retry (`Qtd T.Env Fl`) sem entrar no Protheus.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2636  (fluig · Concluído · Não será feito · SDCASSI-87)

**Título:** Verificar que os processos de Cotação e de Negociação não exibem anexos de proposta — os arquivos do Portal do Fornecedor ficam no GED, por desenho.

**Origem:** FSWTBC-2636 — SD777284. *"Anexos do Processo não Aparecem na Negociação"* (exemplo: processo
**43665**). **Não é defeito**: é **funcionalidade inexistente**. Esclarecimento de Paulo Calixto — nem o
processo de cotação nem o de negociação exibem anexos, porque os anexos das propostas enviadas pelo
**Portal do Fornecedor** são armazenados **direto na pasta do GED** e nunca chegam ao processo BPM.
Encaminhado para a fila de **melhorias**; resolução **"Não será feito"**, com concordância do cliente.

**Módulo/Rota:** Negociação de Cotação de Produtos/Serviços
(`/portal/p/1/pageworkflowview?processID=wf_negociacao_cotacao_prod_serv`) e Cotação de Produtos/Serviços
(`…processID=wf_cotacao_produtos_servicos`). Contraparte: **Documentos** (`/portal/p/1/ecmnavigation`) —
o GED.

**Pré-condições**
- Nenhuma para a caracterização do formulário.
- Para a parte do GED: um fornecedor que tenha enviado proposta com anexo pelo Portal do Fornecedor, e o
  caminho da pasta do GED onde esses arquivos são depositados.
- **Bloqueio:** **parcial** — a metade "formulário não exibe anexo" é executável e foi executada. A metade
  "o arquivo está no GED" exige saber o caminho da pasta (**não documentado no ticket**) e uma proposta com
  anexo enviada por fornecedor, para o que não há credencial de fornecedor.

**Passos**
1. Abrir o processo **Negociação de Cotação de Produtos/Serviços** pela rota de início.
2. Percorrer as seções do formulário: *Identificação do Processo / Solicitante*, *Informações do
   Fornecedor*, *Endereço*, *Contatos*, *Identificação do(s) Produto(s)/Serviço(s)*, *Lista de
   Produtos/Serviços*, *Validação de Proposta*.
3. Procurar qualquer controle de anexo dentro do formulário (botão, campo de arquivo, lista de documentos).
4. Repetir no processo **Cotação de Produtos/Serviços** (seções até *Verificar Erro*).
5. Comparar com o formulário da **Solicitação de Compras**, que tem controles de anexo.
6. Abrir **Documentos** (`/portal/p/1/ecmnavigation`) e localizar a pasta do GED onde o Portal do
   Fornecedor deposita os anexos de proposta.

**Resultado esperado**
- Os formulários de **Cotação** e de **Negociação** **não têm** controle de anexo próprio — comportamento
  correto e documentado, não falha.
- Em contraste, a **Solicitação de Compras** tem os botões **Anexar documentação Pública** e **Anexar
  documentação Restrita CASSI**, e o **Parecer Técnico** tem o botão **Anexos** — ou seja, a ausência na
  Cotação/Negociação é **específica**, não uma limitação geral da plataforma.
- O arquivo enviado pelo fornecedor é localizável **no GED**, em **Documentos**.
- Se um dia a funcionalidade for implementada (a demanda de melhoria ainda não foi aberta), este caso
  passa a reprovar — e é isso que se quer: o dia em que o comportamento mudar, alguém precisa decidir se
  a mudança foi intencional.

**Resultado se o defeito reincidir** *(aqui: se o entendimento se perder)*
- O usuário abre a Negociação procurando o anexo da proposta, não encontra, e abre chamado — foi o que
  originou este e o **FSWTBC-2677 (SDCASSI-89)**, que tem o **mesmo título** mas causa técnica diferente
  (bloqueio de iFrame no Protheus). **Não confunda os dois.** Exemplo do ticket: processo **43665**.

**Severidade:** Baixa *(apresentação/usabilidade e descontinuidade de projeto entre GED e BPM; não há
perda de dado — o arquivo existe, só não está onde se procura)*

**Preparação de massa:** para a parte executada, **nenhuma**. Para fechar o caso por inteiro: uma proposta
com anexo enviada por fornecedor real pelo Portal do Fornecedor, e o **caminho da pasta do GED**, que o
time Fluig precisa informar — o ticket não o registra.

**Verificado em tela:** **SIM (total)** *(para a afirmação central do caso: os formulários de Cotação e
Negociação não expõem anexo)*
**O que foi verificado:** o formulário de **Negociação de Cotação de Produtos/Serviços** (iframe 256835)
foi aberto e inspecionado por completo — seções *Negociação de Cotação de Produtos/Serviços*,
*Identificação do Processo / Solicitante*, *Informações do Fornecedor*, *Endereço*, *Contatos*,
*Identificação do(s) Produto(s)/Serviço(s)*, *Lista de Produtos/Serviços* e *Validação de Proposta* —
e **não há um único botão, campo de arquivo ou lista de anexos** nele (lista de botões visíveis do iframe:
vazia). O formulário de **Cotação de Produtos/Serviços** (iframe 256834) também não tem controle de anexo:
suas seções terminam em *Informações p/ Parecer Técnico* e *Verificar Erro*. O contraste foi confirmado no
mesmo dia: a **SC** expõe *Anexar documentação Pública* e *Anexar documentação Restrita CASSI*, e o
**Parecer Técnico** expõe *Anexos*. A rota **Documentos** (`/portal/p/1/ecmnavigation`) responde 200.
**Divergências encontradas:** o ticket diz "anexos do processo não aparecem na Negociação", o que sugere
que existiriam e não estariam sendo exibidos; a tela mostra que **não existe superfície de anexo alguma**
nesses dois formulários — a diferença entre "não exibe" e "não tem onde exibir" é justamente o que
transformou o chamado em melhoria. Observação adicional: a plataforma oferece a aba **Anexos** por cima do
formulário em **todos** os processos, inclusive Cotação e Negociação; ela existe, mas não é alimentada
pelo Portal do Fornecedor.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2677  (ambos · Concluído · SDCASSI-89)

**Título:** O anexo de uma proposta é aberto a partir da negociação e o documento abre, em vez de
falhar com conexão recusada.

**Origem:** FSWTBC-2677 (incidente 777691) — anexos do processo não apareciam na negociação, com
mensagem de que a **conexão com o Fluig foi recusada** (filial **5303**, cotação **000242**). O
cliente precisou o sintoma: *"no Protheus não abre o anexo, se eu pegar a URL no campo e abrir no
navegador funciona"*. Causa raiz (com apoio da doc TDN de `TWebEngine:Navigate`): o Protheus abria o
anexo **dentro de um iFrame** na própria tela e o Fluig **recusava a conexão** (cabeçalhos
`X-Frame-Options` / `CSP frame-ancestors`). Solução: abrir em **nova aba** do navegador, fora da
tela do Protheus. MUD16370 / PR 55941 em 23/09/2025.

**Módulo/Rota:** **Negociação** (`wf_negociacao_cotacao_prod_serv`, form **256835**) e a
**Solicitação de Compras** de origem — aba **Anexos** da instância e os botões de anexo do
formulário; o documento em si vive no **GED do Fluig**, servido por
`/webdesk/webdownload?documentId=<id>&version=<v>&tenantId=<tenant>`.

**Pré-condições**
- Uma cotação com **proposta anexada pelo fornecedor**, levada à negociação.
- **Bloqueio:** **sim** — não há credencial de fornecedor para anexar a proposta, e a conta de QA
  não resolve matrícula de comprador (§5-C). **Além disso, o defeito acontecia do lado do Protheus**
  (comando de abertura do `TWebEngine`): **o Fluig não tem superfície para o comportamento do
  iFrame do Protheus**. O que se verifica no Fluig é a **outra metade** do caso — que o documento
  existe, é acessível e a URL funciona quando aberta diretamente no navegador.

**Passos**
1. Na instância do processo (SC ou negociação), abrir a aba **Anexos** e confirmar que o anexo da
   proposta está listado.
2. Clicar no anexo e confirmar que ele **abre** — em **nova aba**, não embutido.
3. Copiar a URL do documento (padrão
   `/webdesk/webdownload?documentId=<id>&version=<versão>&tenantId=<tenant>`) e abri-la
   **diretamente no navegador**: deve abrir o mesmo documento.
4. *(No Protheus, por quem tem acesso — fora do escopo desta rodada)* na tela de negociação,
   acionar a visualização do anexo da proposta.
5. Observar **onde** o documento abre.

**Resultado esperado**
- O anexo da proposta está listado na aba **Anexos** da instância e **abre** ao ser clicado.
- A abertura acontece em **nova aba do navegador** (`target="_blank"`), **nunca embutida** num
  iFrame dentro de outra aplicação.
- A URL `/webdesk/webdownload?documentId=…` aberta diretamente entrega o documento — ou seja, o
  problema **não é** de permissão nem de existência do arquivo.
- **Nenhuma** mensagem de conexão recusada.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Na negociação, o anexo **não aparece**, com mensagem de que a **conexão com o Fluig foi recusada**
  (filial **5303**, cotação **000242**). A pista que identifica o defeito é a assimetria relatada
  pelo cliente: **a mesma URL, colada no navegador, funciona** — o bloqueio é do
  `X-Frame-Options`/`CSP frame-ancestors` contra a abertura em iFrame, não do documento.
- Evidências originais: `imagem (2).jpg`, `visualizar_anexo_proposta.png` e duas gravações `.rar`.

**Severidade:** Média — bloqueia a análise da proposta na negociação, mas há contorno (abrir a URL
no navegador) e não há risco de dado.

**Preparação de massa:** uma cotação com **proposta anexada pelo fornecedor** e levada à negociação.
Exige credencial de fornecedor — **não disponível**. A verificação do passo 4 exige acesso ao
Protheus — **também não disponível nesta rodada**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — toda instância de processo abre com a aba **Anexos**
(vista em `wf_faturamento_contratos`, ao lado de *Formulário*, *Informações* e *Histórico*).
*Lido no fonte publicado* — no formulário da SC (256831), `handleChangesAttachments()` é chamado em
**dez** atividades diferentes e liga os botões `.btnAdicionarAnexoPublico` e
`.btnAdicionarAnexoRestrito`, que categorizam o documento como
**`PUBLICA - Documentação - <nome>`** ou **`RESTRITO-CASSI - Documentação - <nome>`** — ou seja, o
anexo de proposta pode ser **restrito**, o que é relevante para diagnosticar "não aparece".
Confirmei também que **o próprio Fluig já adota o padrão da correção**: os downloads de documento do
GED são feitos com
`window.open('/webdesk/webdownload?documentId=' + idDoc + '&version=…&tenantId=…', "_blank")` —
**`_blank`, nova aba**, exatamente a solução aplicada no Protheus.
**Divergências encontradas:** **o efeito central deste defeito não tem superfície no Fluig** — o
comportamento do `TWebEngine` do Protheus ao abrir conteúdo em iFrame só é observável no Protheus.
Está dito aqui explicitamente, e o caso cobre a metade que o Fluig responde (documento existe,
categoria do anexo, URL do GED e abertura em nova aba). Registro reutilizável levantado pelo próprio
ticket: **qualquer** abertura de conteúdo Fluig dentro do Protheus via `TWebEngine` em iFrame está
sujeita ao mesmo bloqueio; o padrão é abrir em aba externa.
**Dados/massa usados:** nenhum — não submetido; nenhum anexo foi adicionado ou removido.

---

## CT-FSWTBC-2772  (ambos · Concluído · SDCASSI-106)

**Título:** O comprador informa um valor de negociação na casa dos milhares e o valor chega ao ERP
com a mesma grandeza — sem truncar no separador de milhar.

**Origem:** FSWTBC-2772 (SD780675) — quantidades de propostas de negociação se perdiam quando havia
negativa, e o valor chegava incorreto ao Protheus. Causa reproduzida pelo próprio cliente: é a
**máscara numérica** enviada pelo Fluig — **`30500.00` funciona; `30.500,00` dá erro**, porque o
formato brasileiro é interpretado errado no destino, truncando no primeiro ponto. Mesma raiz de
FSWTBC-2752 (telefone) e FSWTBC-2688 (classe de valor na planilha): **falta de normalização de
formato na fronteira Fluig↔Protheus**. SC 44732-5303, negociação 52947. PR 56306 / MUD16418.

**Módulo/Rota:** **Negociação** (`wf_negociacao_cotacao_prod_serv`, form **256835**) e o retorno na
**Solicitação de Compras** — seção **"Validação do Comprador (Definir Negociação)"**, grade
`tbProposta`; conferência final na **Aprovação de Alçada** (atividade **94**), campos
`tbprodalc_quantidade`, `tbprodalc_precoUnitario`, `tbprodalc_valorTotal` e o rótulo
**"Valor da Compras (R$)"** da grade `tbForneceAlcadas`.

**Pré-condições**
- Uma negociação em curso cujo item tenha valor **acima de mil** (para haver separador de milhar) —
  este é o ponto: com valores de três dígitos o defeito **não aparece**.
- Ao menos um item com **negativa** do fornecedor (é o gatilho do relato original).
- **Bloqueio:** **sim** — não há credencial de fornecedor e a conta de QA não resolve matrícula de
  comprador (§5-C); não é possível conduzir uma negociação real.

**Passos**
1. Abrir a negociação e informar, num item, quantidade e valor **na casa dos milhares** —
   por exemplo `30.500,00`.
2. Registrar a **negativa** do fornecedor em outro item da mesma negociação.
3. Movimentar a negociação e voltar à SC de origem.
4. Na seção **"Validação do Comprador (Definir Negociação)"**, ler a grade `tbProposta`
   (colunas **Proposta**, **Versão**, **Fornecedor**, **Situação Par. Area Dem.**,
   **Situação Par. Areas**, **Enviar para Negociação?**) e conferir a quantidade dos itens.
5. Seguir a SC até a **Aprovação de Alçada** e conferir **"Valor da Compras (R$)"** na grade da
   **Empresa Vencedora**.
6. Conferir o mesmo valor no campo **"Retorno Integração"** e, se disponível, em *Logs Protheus* ›
   **Solicitacoes ZZY**, coluna **Json Entrada**.

**Resultado esperado**
- O valor informado como `30.500,00` chega ao ERP como **trinta mil e quinhentos** — e **não** como
  `30,5`.
- A quantidade dos itens **não se perde** quando há negativa em outro item da mesma negociação:
  a grade `tbProposta` mantém todos os itens com suas quantidades.
- **"Valor da Compras (R$)"** na alçada é igual ao valor negociado.
- **Json Entrada** (ZZY) mostra o valor **normalizado** (ponto decimal, sem separador de milhar),
  e não o texto formatado em pt-BR.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Valor de negociação incorreto no Protheus e **quantidade de propostas se perdendo quando há
  negativa** — SC **44732-5303**, negociação **52947**.
- Comportamento exato descrito no ticket: **`30500.00` funciona; `30.500,00` dá erro**, truncando
  no primeiro ponto.

**Severidade:** Alta — erro de três ordens de grandeza no valor de uma compra.

**Preparação de massa:** uma cotação com proposta de fornecedor em valores **acima de mil**, levada
até a negociação, com **uma negativa** registrada. Exige credencial de fornecedor e matrícula de
comprador — **nenhuma das duas disponível**; a massa precisa ser preparada por quem opera o
processo.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Lido no fonte publicado* — este é o achado mais forte do lote e **explica
por que o defeito é da família "máscara"**. No `UtilsHandler` do formulário da SC:

```js
static replaceToMoney(value = null) {
    if (value.indexOf(',') != -1) {          // <-- só normaliza SE HOUVER VÍRGULA
        value = value.split(".").join("");   // tira o milhar
        value = value.split(",").join(".");  // vírgula -> ponto
        return value;
    } else {
        return value;                        // <-- devolve INTACTO
    }
}
```

A normalização vive **inteiramente dentro de um ramo truthy**: um valor com separador de milhar mas
**sem casas decimais** — `30.500` — cai no `else` e é devolvido **como está**;
`Number("30.500")` é **30.5**. A correção do ticket cobriu o caminho **com** vírgula; o caminho
**sem** vírgula continua truncando no primeiro ponto, que é exatamente o defeito descrito.
A **mesma lógica está duplicada inline** em `App.js` sob `numState == 94` (Aprovação de Alçada),
para `tbprodalc_quantidade___*`, `tbprodalc_precoUnitario___*` e `tbprodalc_valorTotal___*`:
`if (value.indexOf(',') != -1) {…}; value = (isNaN(value) ? "0.00" : value);` — e `isNaN("30.500")`
é **false**, então o valor passa adiante como `30.5` **sem crítica nenhuma**. No mesmo trecho,
`isNaN("")` também é `false`, de modo que **campo vazio não vira `"0.00"`** como o autor pretendia.
Ainda em `handleMaskMoneyFields()`: `if (value && parseFloat(value) > 0) { $(o).val(value).trigger('input'); }
else { $(o).val(0); }` — para valor **zero ou vazio** o campo é **forçado a `0`** e o
`trigger('input')` **não dispara**, então os totais dependentes **não são recalculados**; e o
`replace(/[^\d,\,\.]/g,"")` anterior **remove o sinal de menos**, tornando um valor negativo
positivo em silêncio. `numberToCurrencyFormat` tem o mesmo vício: `if (value && prefix == true)` —
com `value = 0` (falsy) o prefixo `R$` é perdido mesmo quando pedido.
*Visto renderizado* — `wf_negociacao_cotacao_prod_serv` existe; no form 256831 estão a grade
`tbProposta` (colunas confirmadas) e o rótulo **"Valor da Compras (R$)"** na grade
`tbForneceAlcadas`.
**Divergências encontradas:** (a) o ticket diz "Valor da Compra (R$)" — na grade da alçada o rótulo
real é **"Valor da Compras (R$)"**, com erro de concordância, e a grafia correta existe **na mesma
tela**, no painel principal; (b) **achado principal**: a normalização de máscara é **condicional à
presença de vírgula** e está **duplicada em três lugares** (`replaceToMoney`, o bloco inline do
`numState 94` e `handleMaskMoneyFields`) — a "camada única de normalização" que a análise do ticket
recomendou implicitamente **não existe**, e o caminho `30.500` (sem decimais) continua vulnerável.
**Dados/massa usados:** nenhum — não submetido; nenhuma negociação foi conduzida.

---

## CT-FSWTBC-2834  (fluig · Concluído · SDCASSI-113)

**Título:** Comprador abre o Portal do Comprador (Compras Centralizadas) e as informações carregam por completo, sem erro.

**Origem:** FSWTBC-2834 — “DEM10013706 - Compras centralizadas”: durante a homologação houve
**problema no carregamento das informações**. O ticket não detalha o defeito; seu valor está na
reclamação de processo formalizada pelo cliente — que a TBC faça um **primeiro teste na base de
homologação antes de liberar para a equipe CASSI**. Fechado sem comentário técnico, com 30 dias de
atraso. *(Ticket praticamente sem descrição — caso escrito como caracterização de caminho, conforme
§5-D do briefing.)*

**Módulo/Rota:** **Portal do Comprador** (`/portal/p/1/portal-do-comprador`) — heading **Acesso
Rápido**, com os itens *Validação Inicial*, *Controle De Cotações*, *Avaliação de Propostas* e
*Definir Vencedor Cotação*.

**Pré-condições**
- Conta com **matrícula de comprador resolvida no ERP Protheus** (é o que o portal consulta na
  carga).
- SCs disponíveis nas filas dos quatro itens do *Acesso Rápido*.
- **Bloqueio:** sim — a conta de QA **não** resolve matrícula de comprador; o portal carrega o
  esqueleto mas não os dados do comprador.

**Passos**
1. Abrir `/portal/p/1/portal-do-comprador` com uma conta de comprador válida.
2. Aguardar a carga completa e abrir o console do navegador (F12 → Console).
3. Conferir que o heading **Acesso Rápido** e os quatro itens são exibidos.
4. Entrar em cada um dos quatro: **Validação Inicial**, **Controle De Cotações**, **Avaliação de
   Propostas**, **Definir Vencedor Cotação**.
5. Em cada tela, conferir que a listagem popula (ou exibe um vazio explícito, não um erro).

**Resultado esperado**
- A página carrega **sem erro no console** relativo a dados do comprador.
- Os quatro itens do *Acesso Rápido* abrem e listam os registros correspondentes ao comprador
  autenticado.
- Fila vazia é apresentada como mensagem de vazio, **nunca** como falha de carregamento.
- Nenhuma requisição da carga retorna ≥ 400 (exceto os ruídos conhecidos de ambiente — ver
  divergências).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- “Problema no carregamento das informações” do Portal do Comprador durante a homologação da
  DEM10013706. Mensagem exata `<não documentado>` — o ticket traz só o anexo
  `image-20251006-185435.png`, indisponível nesta rodada.

**Severidade:** Média *(bloqueia o comprador de operar o portal; sem efeito financeiro direto)*

**Preparação de massa:** credencial de **comprador** com matrícula ativa no Protheus e SCs nas filas
dos quatro itens. Nada disso é provisionável pelo executor. **Recomendação de processo, do próprio
ticket:** antes de liberar a base para a CASSI, rodar este caso como *smoke test* — é literalmente o
que o cliente pediu e que não teve resposta registrada.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o Portal do Comprador foi aberto: título `Cassi - Fluig Plataforma - Portal
do Comprador`, heading **Acesso Rápido** presente, página renderizada.
**Divergências encontradas:** **sim.** Na carga, o console registra
`Erro ao buscar as informações do colaborador na lista de usuários do ERP Protheus. Error: Error:
Comprador não encontrado.` — isto é a **limitação conhecida da conta de QA** (§5-C do briefing) e
**não** deve ser lido como o defeito do ticket. Há também um 404 de recurso estático
(`/style-guide/css/fluig-style-guide.min.css`), ruído de ambiente. Os quatro itens do *Acesso
Rápido* não são clicáveis por texto (não têm nome acessível), o que dificulta a automação do caso.
Consequência honesta: **com esta conta não é possível distinguir “carregamento correto” de “falha de
carregamento” — o caso precisa ser reexecutado com credencial de comprador.**
**Dados/massa usados:** nenhum — apenas leitura.

---

## CT-FSWTBC-2889  (fluig · Concluído · SDCASSI-115)

**Título:** Comprador centraliza SCs de várias filiais sob uma filial centralizadora e o retorno é processado sem erro.

**Origem:** FSWTBC-2889 — “Erro após centralizar as SC's”: falha no passo central da DEM10013706, em
que o comprador agrupa SCs de várias filiais sob uma filial centralizadora via
`POST /api/v1/fluig/integracao/compras/solicitacao/centraliz`. O erro ocorre **após** a
centralização, o que aponta para o retorno ou o processamento subsequente. Sem comentário técnico —
só o print. Agravante conhecido: o contrato de erro dessa API devolve `items` **vazio, sem código
nem mensagem** (FSWTBC-2536), o que torna qualquer falha difícil de diagnosticar.

**Módulo/Rota:** **Portal do Comprador** (`/portal/p/1/portal-do-comprador`) → fluxo de **Compras
Centralizadas**; efeito na *Solicitação de Compras* (`wf_solicitacao_compras`), seções
**Identificação do(s) Produto(s)/Serviço(s) - Solicitações Centralizadas** e **Produtos/Serviços das
Solicitações Centralizadas**.

**Pré-condições**
- **Duas ou mais SCs de filiais diferentes**, no mesmo grupo de produto, elegíveis à centralização.
- Conta de **comprador** com matrícula resolvida no Protheus.
- Protheus disponível (a centralização é integrada).
- **Bloqueio:** sim — a conta de QA não resolve matrícula de comprador, e a centralização **escreve**
  e altera SCs de terceiros. Não executado.

**Passos**
1. Abrir o **Portal do Comprador** com credencial de comprador e ir ao fluxo de **Compras
   Centralizadas**.
2. Selecionar **duas ou mais SCs de filiais distintas** e informar a **filial centralizadora**.
3. Confirmar a centralização e **acompanhar o retorno da chamada** (F12 → Network, endpoint
   `.../compras/solicitacao/centraliz`).
4. Abrir a SC centralizadora e conferir a seção **Produtos/Serviços das Solicitações Centralizadas**.
5. Abrir cada SC de origem e conferir seu novo estado.
6. Conferir no **Tracker** o cruzamento *Nº da Solicitação ERP* × *Solicitante* × *Filial*.

**Resultado esperado**
- A centralização conclui **sem erro após a confirmação** — a tela seguinte carrega normalmente.
- A SC centralizadora lista, em **Produtos/Serviços das Solicitações Centralizadas**, os itens de
  **todas** as SCs agrupadas, sem item duplicado nem faltante.
- Cada SC de origem fica em estado coerente (vinculada à centralizadora), sem SC “órfã”.
- Havendo falha, ela vem com **código e mensagem legíveis** — nunca `items` vazio e silencioso
  (esse é o defeito irmão FSWTBC-2536 e deve ser verificado junto).
- O **Histórico** da SC centralizadora registra a operação.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro exibido **após** a centralização das SCs (anexo `image-20251007-161832.png`, indisponível
  nesta rodada). Mensagem exata `<não documentado>`. Sintoma diagnóstico esperado: retorno da API
  com `items` vazio, sem código nem mensagem — o que torna a falha muda.

**Severidade:** Alta *(a centralização reescreve o vínculo de várias SCs de uma vez; falha no
pós-processamento pode deixar SCs órfãs ou itens duplicados)*

**Preparação de massa:** ao menos **três SCs em filiais distintas**, mesmo grupo de produto, criadas
pelo próprio executor e elegíveis à centralização, mais a credencial de comprador. Como a operação é
de escrita e afeta várias SCs, **não deve ser executada sobre SCs de terceiros**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário de *Solicitação de Compras* tem, confirmadas, as duas seções
dedicadas à centralização: **Identificação do(s) Produto(s)/Serviço(s) - Solicitações
Centralizadas** e **Produtos/Serviços das Solicitações Centralizadas** — o destino da operação
existe na tela. O **Portal do Comprador** abre (heading *Acesso Rápido*). O **Tracker** oferece os
filtros necessários à conferência posterior: *Nº do Processo Fluig*, *Solicitante*, *Status*,
*Nº da Solicitação ERP*, *Nº da Cotação ERP*, *Filial*, *Número do Contrato*.
**Divergências encontradas:** o fluxo de **Compras Centralizadas** não aparece nomeado assim no
*Acesso Rápido* do Portal do Comprador, que lista apenas *Validação Inicial*, *Controle De
Cotações*, *Avaliação de Propostas* e *Definir Vencedor Cotação* — a entrada da centralização
precisa ser confirmada com o time da DEM10013706. O portal não carrega dados para esta conta
(`Comprador não encontrado.`).
**Dados/massa usados:** nenhum — nenhuma SC foi centralizada.

---

## CT-FSWTBC-2944  (fluig · Concluído · SDCASSI-120)

**Título:** Comprador marca "Não" em "Enviar para parecer técnico?" e o processo volta direto para ele, sem passar pela área técnica.

**Origem:** FSWTBC-2944 — durante a homologação da DEM10013706, Geise reportou que **ao marcar “sem
parecer” o processo não retornou para o comprador**. Defeito de roteamento no BPM; a correção
registrada é só *“atribuição do campo estava errada”*, sem dizer qual campo nem em que ponto.
Tratado na mesma frente do FSWTBC-2930, o que sugere que os dois sintomas vieram da **mesma versão
publicada com problema**.

**Módulo/Rota:** processo **Cotação de Produtos e Serviços** (`wf_cotacao_produtos_servicos`) →
seção **Informações p/ Parecer Técnico**, campo **Enviar para parecer técnico? \*** (radio
`sw_parecerTecnico`, opções **Sim** / **Não**). Contraparte na SC: seções *Identificação da(s)
Áreas para Parecer Técnico* / *Áreas para Emissão para Parecer Técnico*.

**Pré-condições**
- Uma cotação na etapa em que o comprador decide sobre o parecer técnico.
- Conta de **comprador** responsável pela tarefa.
- **Bloqueio:** sim — a conta de QA não resolve matrícula de comprador e não há cotação nessa etapa
  sob esta conta (a única cotação em tarefa hoje, 112113, está em *Correção*). Movimentar processo
  de terceiro é vedado.

**Passos**
1. Abrir a cotação na etapa de decisão do parecer técnico.
2. Rolar até a seção **Informações p/ Parecer Técnico**.
3. Marcar **Não** em **Enviar para parecer técnico? \***.
4. Observar que a área de anexos **Insira os anexos para envio do Parecer Técnico** deixa de ser
   exigida.
5. Movimentar a tarefa.
6. Abrir a **Central de Tarefas** do **comprador** e conferir onde o processo parou.
7. Repetir marcando **Sim**, para confirmar o outro ramo.

**Resultado esperado**
- Com **Não**, o processo **retorna imediatamente ao comprador** — a tarefa reaparece na Central de
  Tarefas dele e **nenhuma** tarefa é criada para área técnica.
- Nenhuma área é gravada em *Áreas para Emissão para Parecer Técnico* quando a resposta é **Não**.
- Com **Sim**, o processo segue para a(s) área(s) técnica(s) e o anexo do parecer é exigido —
  os dois ramos precisam funcionar, senão o teste do “Não” passa por acidente.
- O **Histórico** registra a etapa de destino coerente com a opção marcada.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Marcada a opção de dispensar o parecer técnico, o fluxo **não volta ao comprador** — fica parado
  ou segue para destino errado (anexo `image-20251010-140512.png`, indisponível). Mensagem exata
  `<não documentado>`.
- **Diagnóstico que o ticket ensina:** a causa foi *“atribuição do campo estava errada”* na versão
  publicada do processo — conferir a versão publicada antes de investigar a lógica de roteamento,
  como em CT-FSWTBC-2930.

**Severidade:** Alta *(roteamento de etapa de aprovação: o processo trava ou desvia da alçada
correta)*

**Preparação de massa:** uma cotação conduzida até a etapa de decisão do parecer técnico pelo próprio
executor, com credencial de comprador. Recomenda-se preparar **duas**, para exercitar o ramo *Sim* e
o ramo *Não* sem reaproveitar instância.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no formulário de *Cotação de Produtos/Serviços* estão confirmados: a seção
**Informações p/ Parecer Técnico**, o campo **“Enviar para parecer técnico? \*”** como par de
`radio` `sw_parecerTecnico` com as opções **Sim** e **Não** (habilitados, não somente-leitura), e a
área **Insira os anexos para envio do Parecer Técnico** (tabela `tbAnexoPropostas`, botão
**Anexar**). Do lado da SC, confirmadas as seções **Identificação da(s) Áreas para Parecer Técnico**
e **Áreas para Emissão para Parecer Técnico** (campos `tbarea_item`, `tbarea_areaTecnica`,
`tbarea_responsavelArea`). Existe também o processo **Parecer Técnico**
(`wf_solicitacao_compras_parecer`) publicado no catálogo, categoria *Compras*.
**Divergências encontradas:** o ticket fala em “marcar **sem parecer**”; o rótulo real da tela é
**“Enviar para parecer técnico? \*”** com opções **Sim/Não** — “sem parecer” corresponde a marcar
**Não**. O roteamento em si não é observável sem movimentar a tarefa.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-2946  (ambos · Concluído · SDCASSI-122)

**Título:** Conferir, após encerrada a negociação, que só os fornecedores que participaram dela seguem vinculados à cotação, e que a geração do pedido não é travada por fornecedor remanescente.

**Origem:** FSWTBC-2946 — na SC 55667 (cotações 000023-3301 e 000336-5303), um fornecedor que **não** foi para a negociação continuou vinculado à cotação e travou a geração do pedido no Protheus. Encerrado sem causa raiz registrada — e reincidiu em FSWTBC-3361 (caso CT-FSWTBC-3361 deste mesmo lote).

**Módulo/Rota:** Tracker → *Filtrar por* = **Negociação de Cotação de Produtos/Serviços(Detalhado Itens)** (`NCPSP`) e **Negociação de Cotação de Produtos/Serviços** (`NCPS`); formulário da **Cotação** (card 256834), campo **`Erro retornado pelo ERP Protheus`**; Histórico da solicitação.

**Pré-condições**
- Uma SC cuja cotação tenha **mais de um fornecedor** e em que ao menos um **não** tenha seguido para a negociação.
- Negociação encerrada (`procNegociacaoFim`) e integração 2 (`integracaoERP2`, atividade **177**) executada.
- **Bloqueio:** sim. (a) §5-C — a conta `TOTVS-FS` não resolve matrícula de comprador (`dsProtheus_getCompradores_restGetAll` com `Y1_USER = "undefined"`), o que inviabiliza a família cotação/negociação para este login; o Portal do Comprador abriu hoje só com *Acesso Rápido* e erro de console `Erro ao buscar as informações do colaborador na lista de usuários do ERP Protheus. Error: Error: Comprador não encontrado.` (b) A geração do pedido em si é do Protheus, **sem credencial** nesta rodada.

**Passos**
1. Abrir o Tracker e escolher em *Filtrar por* a visão **Negociação de Cotação de Produtos/Serviços(Detalhado Itens)**.
2. Informar ao menos um filtro (**Nº do Processo Fluig** da SC alvo) — sem filtro a grade não é montada.
3. Clicar em **Pesquisar Registro** e listar os fornecedores/itens que a negociação registrou.
4. Trocar para a visão **Negociação de Cotação de Produtos/Serviços** e repetir para o mesmo processo, comparando o conjunto de fornecedores.
5. Abrir o formulário da **Cotação** do processo e ler o campo **`Erro retornado pelo ERP Protheus`**.
6. Abrir a aba **Histórico** da solicitação e localizar o registro da integração posterior à negociação (`integracaoERP2`, atividade 177).

**Resultado esperado**
- As duas visões de negociação listam **o mesmo conjunto de fornecedores** — nenhum fornecedor que ficou fora da negociação aparece ainda vinculado.
- O campo **`Erro retornado pelo ERP Protheus`** da Cotação está **vazio**.
- O Histórico traz `Integração executada com sucesso - Tempo de Execução N s` para a atividade 177, e o processo segue para a geração do pedido sem parar em atividade de erro.

**Resultado se o defeito reincidir**
- Fornecedor que não participou da negociação continua listado na cotação e a geração do pedido no Protheus é travada; o processo fica retido e o campo de retorno da integração exibe o erro do ERP.

**Severidade:** Média

**Preparação de massa:** uma SC com cotação multi-fornecedor em que a negociação exclua ao menos um fornecedor, criada por conta **com matrícula de comprador válida** — que esta rodada não tem. **Superfície do Fluig para o efeito:** Tracker (visões `NCPS`/`NCPSP`), campo `Erro retornado pelo ERP Protheus` da Cotação e Histórico. O vínculo residual na tabela do ERP (família `C8_NUMPED` / `C8_SCORI`) **não tem superfície no Fluig** — só o sintoma é observável, não a causa.

**Verificado em tela:** PARCIAL
**O que foi verificado:** as duas visões de negociação existem no combo *Filtrar por* do Tracker e foram abertas; a visão `NCPSP` traz filtro próprio **`sl_tipoDeFrete`** com opções `Selecione / CIF / FOB / Sem Frete`. O rótulo **`Erro retornado pelo ERP Protheus`** foi confirmado em `form_cot.html` (lista de `control-label` da Cotação). Portal do Comprador aberto e confirmada a limitação §5-C. O literal `Integração executada com sucesso - Tempo de Execução N s` é o registrado no Histórico (padrão já medido em lotes anteriores).
**Divergências encontradas:** o rótulo do retorno da integração **não é o mesmo nas duas telas** — na Cotação é `Erro retornado pelo ERP Protheus`, na SC é `Retorno Integração`. A linha da tabela do briefing que manda substituir um pelo outro só se aplica à SC.
**Dados/massa usados:** nenhum — não submetido. Nenhuma cotação aberta para escrita.

---

## CT-FSWTBC-2988  (ambos · Concluído · SDCASSI-76)

**Título:** Centralizar solicitações pelo Portal do Comprador e conferir que a SC centralizadora nasce completa, sem erro de alteração de solicitação de outra filial.

**Origem:** FSWTBC-2988 — o endpoint `/api/v1/fluig/integracao/compras/solicitacao/manutencao` devolvia HTTP 401 com `AJUDA:COMCEN — "Esta solicitação não poderá ser alterada pois atende a uma solicitação de outra filial"`. Causa: o MATA110 proíbe alterar SC centralizadora com `C1_SCORI` preenchido. Correção arquitetural: passar a **criar a SC já completa** (fonte `UCOME033.tlpp`, endpoint `/solicitacao/centralizar`).

**Módulo/Rota:** `/portal/p/1/portal-do-comprador` (centralização) → SC gerada, painel **Identificação do(s) Produto(s)/Serviço(s) - Solicitações Centralizadas** (grade `tbProdutosCentralizados`); Tracker visão **SC** (colunas *Código da Filial* / *Nome da Filial*).

**Pré-condições**
- Duas ou mais SCs de **filiais diferentes**, aptas a centralização, do mesmo grupo de produto.
- Conta com **matrícula de comprador** válida no ERP.
- **Bloqueio:** sim. O Portal do Comprador não opera nesta conta (§5-C): abriu hoje somente com o título *Acesso Rápido*, zero tabelas, e erro de console `Error: Comprador não encontrado.`. Sem isso não há como disparar a centralização. A validação do MATA110 é do Protheus, **sem credencial**.

**Passos**
1. Abrir `/portal/p/1/portal-do-comprador` autenticado como comprador.
2. Selecionar duas SCs de filiais distintas e acionar a centralização.
3. Anotar o número do processo Fluig da SC **centralizadora** gerada.
4. Abrir o formulário dessa SC e conferir que o painel **Identificação do(s) Produto(s)/Serviço(s) - Solicitações Centralizadas** está exibido, com os itens das SCs de origem e a filial de entrega ao lado de cada um.
5. Nos painéis de aprovação, conferir os campos **`Nº SC Origem ERP`** e **`Cód. Filial Origem`**.
6. Ler o campo **`Retorno Integração`** (painel *Verificar Retorno Protheus*, atividade 317).
7. Abrir o **Histórico** e conferir a integração da criação.
8. No Tracker (visão **SC**, filtro *Nº do Processo Fluig*), conferir *Código da Filial* e *Nome da Filial* da centralizadora.

**Resultado esperado**
- A SC centralizadora é criada **em uma única operação**, já com produtos, rateio, itens orçamentários e SCs filhas — sem etapa posterior de alteração.
- O campo **`Retorno Integração`** fica **vazio**; não aparece `AJUDA:COMCEN` nem HTTP 401.
- O Histórico registra `Integração executada com sucesso - Tempo de Execução N s`.
- As SCs filhas são finalizadas e a centralizadora referencia corretamente `Nº SC Origem ERP` e `Cód. Filial Origem`.

**Resultado se o defeito reincidir**
- A integração falha com `Esta solicitação não poderá ser alterada pois atende a uma solicitação de outra filial` (`AJUDA:COMCEN`, HTTP 401), e a SC centralizadora fica incompleta.

**Severidade:** Média

**Preparação de massa:** SCs de ao menos duas filiais distintas prontas para centralizar, e uma conta de comprador com `Y1_USER` resolvível — que esta rodada não tem. Quem prepara: dono do ambiente. **Superfície do Fluig para o efeito:** `Retorno Integração` na SC, Histórico e a grade de produtos centralizados. O bloqueio do MATA110 por `C1_SCORI` **não tem superfície no Fluig** — só o retorno de erro é observável.

**Verificado em tela:** PARCIAL
**O que foi verificado:** formulário real da SC 112830 aberto — existem os rótulos **`Nº SC Origem ERP *`** e **`Cód. Filial Origem *`**, e os campos `solCentralizadora`, `codFilialSolCentral`, `nrSolCentralizadora`, `matriculaCentralizacao`, `dataCentralizacao`, `horaCentralizacao`. Rótulo **`Retorno Integração`** confirmado no formulário da SC. Portal do Comprador aberto e inoperante para esta conta. No fonte do widget de centralização (`pc_main.js`, `iniciaSolicitacao`) o processo já nasce com `solCentralizadora:"Sim"`, produtos agrupados, rateio consolidado, filhas e `targetState: gatewayCompraCentralizada`, com `comment: "Iniciado via centralização no Portal de Compradores."` — ou seja, **criação completa**, coerente com a correção descrita.
**Divergências encontradas:** (a) `solCentralizadora` é `input type="hidden"` **sem `<label>`** — não existe rótulo em tela indicando que a SC é centralizadora; o único indício visual é o painel de produtos centralizados aparecer; (b) os endpoints citados no ticket (`/solicitacao/manutencao`, `/solicitacao/centralizar`) **não existem em nenhum fonte publicado do Fluig** — a centralização no front-end roda por dataset (`ds_postStartProcess`, `ds_postFinalizaSolicCompra`); os endpoints são server-side.
**Dados/massa usados:** nenhum — não submetido. Nenhuma centralização disparada.

---

## CT-FSWTBC-3597  (fluig · Concluído · SDCASSI-181)

**Título:** Percorrer a Avaliação de Propostas do Portal do Comprador conferindo a nomenclatura do modal de análise e o funcionamento do botão de notificação de fornecedores.

**Origem:** FSWTBC-3597 — ticket **guarda-chuva** dos erros levantados por Geise na homologação da DEM10013706 (Portal do Comprador), com seis subtarefas (FSWTBC-3627 a 3632). Duas identificadas: **3627** — nomenclatura do modal *"Editando Cotação"* na tela de Avaliação de Propostas; **3628** — botão de notificação de fornecedores não funciona. O ticket pai **não consolida** quais foram os seis erros nem o desfecho de cada um.

**Módulo/Rota:** *Portal do Comprador* (`/portal/p/1/portal-do-comprador`) › **Avaliação de Propostas** (`#/avaliacaoPropostas`) e **Controle De Cotações** (`#/controleCotacao`).

**Pré-condições**
- Ao menos uma cotação listada na *Avaliação de Propostas* (status que permita análise) com fornecedores participantes e e-mails válidos.
- Credencial de **comprador** com matrícula resolvida no ERP.
- **Bloqueio:** sim — a conta de QA não resolve matrícula de comprador (`dsProtheus_getCompradores_restGetAll` chamado com `Y1_USER = "undefined"`); as grades carregam as colunas mas retornam **"Nenhum dado encontrado"**, de modo que nenhuma ação de linha e nenhum modal podem ser acionados. É limitação de conta, não defeito.

**Passos**
1. Abrir **Portal do Comprador › Avaliação de Propostas**.
2. Localizar uma cotação na grade (`Status | Núm. Cotação | Filial | Número da SC | Nº. Proc. Fluig | Tip. Documento | Parecer Téc. | Em Alçada | Dt. Validade | Valor Final`).
3. Abrir o menu de ações da linha e conferir os rótulos das ações disponíveis.
4. Acionar **Analisar Cotação** e conferir o **título do modal** que abre.
5. Fechar o modal e, em **Controle De Cotações**, acionar **Notificar Fornecedores** numa cotação aberta.
6. Confirmar no diálogo *"Deseja notificar os fornecedores que a cotação está aberta para propostas?"*.
7. Conferir o retorno de sucesso e, com o time, que os fornecedores da cotação receberam o e-mail de assunto **NOVA COTAÇÃO**.
8. Não bloquear participantes, não cancelar solicitação e não alterar data de validade.

**Resultado esperado**
- A ação de linha se chama **Analisar Cotação** e o modal aberto tem título **"Analisar Cotação &lt;nº da cotação&gt;"** — **não** *"Editando Cotação"*. *(Correção de FSWTBC-3627: o comprador está analisando, não editando.)*
- O botão **Notificar Fornecedores** está habilitado numa cotação aberta, abre o diálogo de confirmação e, ao confirmar, dispara o e-mail para os fornecedores com endereço válido, com retorno de sucesso na tela. *(Correção de FSWTBC-3628.)*
- Nenhum e-mail é disparado se o usuário cancelar o diálogo.
- As demais ações do portal continuam disponíveis e rotuladas: **Alterar Data de Validade**, **Ver Itens**, **Cancelar Solicitação**, **Bloquear Novos Participantes**, **Parecer Técnico**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O modal da tela de Avaliação de Propostas volta a se chamar **"Editando Cotação"**, sugerindo edição onde a operação é de análise (FSWTBC-3627).
- O botão de notificação de fornecedores **não funciona**: não dispara e-mail e/ou não retorna feedback (FSWTBC-3628) — o que quebra um requisito declarado do portal desde o épico (*"bloquear novos participantes, alterar data de validade e notificar fornecedores"*).

**Severidade:** Média *(a nomenclatura é apresentação; a notificação de fornecedores é funcional e bloqueia a divulgação da cotação — sem ela, fornecedor não sabe que há cotação aberta e a concorrência é prejudicada)*

**Preparação de massa:** uma cotação em aberto, com fornecedores participantes de e-mail válido, e um login de comprador com matrícula no Protheus. **Pendência a levantar antes de executar:** o ticket pai cita **seis** erros e só dois estão identificados — para cobrir o lote é preciso abrir as subtarefas FSWTBC-3629 a 3632 e escrever os casos correspondentes; sem isso, quatro erros de homologação ficam sem regressão.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o *Portal do Comprador* abre (título *Cassi - Fluig Plataforma - Portal do Comprador*) e o menu **Acesso Rápido** lista **Validação Inicial**, **Controle De Cotações**, **Avaliação de Propostas** e **Definir Vencedor Cotação**. As rotas `#/avaliacaoPropostas` e `#/propostaVencedora` renderizam a grade com as dez colunas citadas, e `#/controleCotacao` traz "Página 1 de 0 — Nenhum dado encontrado"; todas com botão **Filtrar**. No **fonte publicado** do widget (bundle `main.js`) confirmei: as ações de linha da cotação são **Alterar Data de Validade**, **Analisar Cotação**, **Ver Itens** e **Cancelar Solicitação**; o título do modal é montado como `"Analisar Cotação " + <nº>`; **não existe nenhuma ocorrência da palavra "Editando" no bundle** — a nomenclatura de FSWTBC-3627 foi de fato corrigida. Existe o botão **Notificar Fornecedores** (ícone `an an-bell-simple`), com o diálogo *"Notificar Fornecedores — Deseja notificar os fornecedores que a cotação está aberta para propostas?"*, que envia e-mail de assunto **NOVA COTAÇÃO** aos endereços dos fornecedores que contenham `@`. **Nada disso foi acionado**: sem linha na grade, nenhum modal abre.
**Divergências encontradas:** o rótulo do ticket (*"Editando Cotação"*) **não existe mais**; hoje é **Analisar Cotação**. O ticket também trata "notificação de fornecedores" genericamente — na tela há **dois** comandos distintos e vizinhos, **Notificar Fornecedores** e **Bloquear Novos Participantes**, além de **Alterar Data de Validade**; o caso precisa nomear qual está sob teste. Por fim, o ticket pai é inauditável como está: seis erros declarados, dois rastreáveis.
**Dados/massa usados:** nenhum — não submetido, nenhum e-mail disparado, nenhuma cotação alterada.

---

## CT-FSWTBC-3598  (protheus · Concluído · SDCASSI-184)

**Título:** Gerar contrato a partir de uma cotação vencedora quando já existem contratos com numeração alfanumérica e emissão posterior a MV_DATASEQ

**Origem:** FSWTBC-3598 / incidente 793407 — Ao gerar contrato a partir da cotação 000312 (filial 5303, SC 49710): `JAGRAVADO CNA_NUMERO - Já existe registro com esta informação`, sem contrato com `CN9_NUMCOT = 000312`. Causa: um contrato **com letra** no número e `CN9_DATEMI` maior que `MV_DATASEQ` (08/05/2025) fazia a numeração sequencial calcular um número já usado. Contornado apagando a data; a interação (parâmetro × numeração alfanumérica × validação do padrão pós-atualização de novembro/2025) ficou "para acompanhamento".

**Módulo/Rota:** Protheus · SIGACOM/SIGAGCT · geração de contrato a partir da cotação (rotina a confirmar no menu: cotação → *Gerar Contrato*), parâmetro `MV_DATASEQ` (Configurador). **Fluig:** *Solicitação de Compras* (Tipo de Compra = Contrato) → *Cotação de Produtos/Serviços* → campo **Erro retornado pelo ERP Protheus** (formulário da Cotação) e atividade *Correção* (72) / *Aguarda Movimentação Protheus* (42); na SC, *Retorno Integração* e *Verificar retorno Protheus* (317). Contraprova: *Acompanhamento de Contratos* (`CN9_NUMCOT` vem no dataset, não na grade).

**Pré-condições**
- Ambiente com pelo menos um contrato de número **alfanumérico** (hoje há **71** com letra, ex.: `E002-2023`, `4600003813.TA`) cujo `CN9_DATEMI` seja **posterior** a `MV_DATASEQ` — condição do defeito; se não houver, criar um `QA` no Protheus.
- Uma cotação `QA` vencedora, vinculada a SC de Tipo de Compra = Contrato, pronta para gerar contrato.
- **Bloqueio:** a geração do contrato e a leitura de `MV_DATASEQ`/`CN9_DATEMI` são no Protheus (sem credencial). Pelo Fluig, a conta de QA não chega à etapa de comprador (limitação de conta), então o caminho SC → cotação → contrato não é percorrível nesta rodada.

**Passos**
1. Protheus: anotar `MV_DATASEQ` e identificar um contrato alfanumérico com `CN9_DATEMI` > `MV_DATASEQ` (ou criar `QA`).
2. Fluig: concluir a cotação `QA` com vencedor e deixar o processo seguir para o ERP.
3. Se a cotação parar em *Correção* (72) ou a SC em *Verificar retorno Protheus* (317), ler **Erro retornado pelo ERP Protheus** (Cotação) / **Retorno Integração** (SC).
4. Protheus: gerar o contrato a partir da cotação (quando o fluxo for manual) e ler a mensagem.
5. *Acompanhamento de Contratos*: filtrar pelo número gerado; confirmar que ele é único entre filiais (hoje há **9 números repetidos** entre filiais — passivo conhecido).

**Resultado esperado**
- O contrato é gerado com número sequencial **inédito**, independentemente de existirem contratos alfanuméricos com emissão fora da faixa de `MV_DATASEQ`.
- Nenhum campo de erro é preenchido no Fluig; o número do contrato aparece na SC/cotação.

**Resultado se o defeito reincidir**
- `JAGRAVADO CNA_NUMERO - Já existe registro com esta informação` ao salvar; no Fluig, o texto chega em *Erro retornado pelo ERP Protheus* / *Retorno Integração* e o processo vai para *Correção*.

**Severidade:** Alta *(bloqueia contratação e indica colisão de chave CNA/CN9)*

**Preparação de massa:** cotação `QA` completa até vencedor — exige perfil de comprador (a conta de QA não tem); contrato alfanumérico `QA` com `DATEMI` recente, criado pelo executor no Protheus.

**Verificado em tela:** PARCIAL
**O que foi verificado:** por dado: a cotação **000312** do ticket **existe** e hoje tem contrato — `6251-2025-5303` (3 revisões, rev 002 Vigente, emissão 29/12/2025, `CN9_NUMCOT = 000312`), coerente com o desfecho do ticket (contrato criado após o contorno). Contagem de números com letra: **71** de 957. Rótulos *Erro retornado pelo ERP Protheus* (Cotação) e *Retorno Integração* (SC) já confirmados por lotes anteriores; atividades 42/72 da cotação confirmadas por dado. O fluxo de geração **não** foi exercitado.
**Divergências encontradas:** a grade de *Acompanhamento de Contratos* não exibe o número da cotação (`CN9_NUMCOT` só no dataset) — o executor precisa do número do contrato para localizar; `MV_DATASEQ` e `CN9_DATEMI` não são visíveis no Fluig.
**Dados/massa usados:** leitura do dump de contratos; nenhum registro criado.

---

## CT-FSWTBC-3612  (Fluig · Concluído · SDCASSI-31)

**Título:** Como comprador, abrir o Portal do Comprador e avaliar propostas de uma cotação, com compradores, fornecedores e cotações resolvidos no Protheus DES

**Origem:** FSWTBC-3612 — "[CASSI - DEM10013707] - [CASSI - DEM10013707] - REPLICAÇAO DA BASE DES - GAP". Sem descrição; comentário interno de encerramento (08/01/2026): "atividades de replicação e atualização da base DES, garantindo que o ambiente de desenvolvimento permaneça alinhado e consistente para testes e evoluções". O épico FSWTBC-821 (DEM10013707 — Tela para avaliação de propostas via Fluig / Portal do Comprador) é a maior DEM do universo (423 menções). O gap se manifesta como o Portal do Comprador sem dados do DES. Replicação **pontual**, sem periodicidade registrada — os sintomas voltaram (FSWTBC-2838, jun/2026).

**Módulo/Rota:** Fluig → `/portal/p/1/portal-do-comprador` ("Portal do Comprador"; widget `wg_portalCompradores`) → Controle de Cotações → Avaliação de Propostas → Definir Vencedor; datasets DES `dsProtheus_getUser_restGetByEmail`, `dsProtheus_getCompradores_restGetAll`, `dsCount_validInicialCompras`, e `genericQuery` (`getQuotesDhuERP`/`getEvalQuotesDhuERP`).

**Pré-condições**
- Login de **comprador** com matrícula cadastrada na SY1 do DES (a conta de QA não é: "Comprador não encontrado.", §5-C).
- Uma cotação no DES com propostas recebidas, ligada a uma SC do Fluig em etapa de comprador.
- **Bloqueio:** conta de QA não é comprador (limitação de conta — bloqueio de Fluig); `genericQuery` do widget pode responder 404 (instabilidade — marcar PARCIAL, não defeito).

**Passos**
1. Abrir `/portal/p/1/portal-do-comprador`; conferir título "Portal do Comprador" e que a tela **não** exibe "Comprador não encontrado." para o login de comprador.
2. Abrir *Controle de Cotações*; conferir a lista de cotações do comprador (dados do DES) — não deve ficar em "Nenhum dado encontrado" para comprador com cotações.
3. Abrir *Avaliação de Propostas* da cotação de teste; conferir fornecedores participantes com nome resolvido (não `codigo-loja`, ver A13) e valores.
4. Clicar "Visualizar Anexos" e conferir que o anexo abre no modal "Anexos".
5. Em *Definir Vencedor Cotação*, marcar o vencedor de um item, **sem confirmar** o envio ao ERP.
6. Voltar à SC no Fluig e conferir no Histórico que ela está na etapa de comprador correspondente ("Aguarda Geração do Pedido/Contrato" ou equivalente da v52).

**Resultado esperado**
- Comprador, cotações, fornecedores e propostas resolvidos a partir do DES; nenhuma lista vazia por dataset com nome errado ou DES defasado (ver A17-a).
- Os fornecedores aparecem pelo nome; anexos abrem.
- O fluxo do comprador (pendência de gerar pedido/contrato) existe e é alcançável — objetivo declarado da DEM.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Portal sem cotações/propostas ou "Comprador não encontrado." para comprador válido porque o DES não foi replicado (SY1/cotações/dicionário) — o GAP; homologação da DEM impossível no ambiente de desenvolvimento.

**Severidade:** Média — bloqueia a etapa de comprador em homologação.

**Preparação de massa:** comprador cadastrado na SY1 do DES (cadastro no ERP — não criável pela automação) e cotação com propostas no DES, providos pelo dono do ambiente.

**Verificado em tela:** PARCIAL
**O que foi verificado:** `/portal/p/1/portal-do-comprador` → título "Cassi - Fluig Plataforma - Portal do Comprador"; chamadas na carga: `dsProtheus_getUser_restGetByEmail` (200), `dsProtheus_getCompradores_restGetAll` (200, 0 colunas), `dsCount_validInicialCompras` (GET search, `matriculaComprador=TOTVS-FS`), `centralTasks/getValidReplacedUsers`; 404 em `/style-guide/css/fluig-style-guide.min.css` (ruído). GET search: `dsProtheus_getUser_restGetByEmail` → 200 com dados (11 KB); `dsProtheus_getCompradores_restGetAll` → 200 com `"error":"undefined"` e a lista de campos `Y1_*` (matrícula de comprador não resolvida para a conta — limitação §5-C). A rota `/portal/p/1/portal_comprador` (com underscore) **não existe** ("Recurso não foi encontrado."); `/portal/p/1/gerenciaCompras` é outra tela ("Gerência de Compras": filtros Filial/Valor Estimado/Grupo de Produto, "Atribuir em lote", "Transferir em Lote"; dataset `ds_getSolicsGerenciaCompras` etapa 257). Não navegado além da home do portal (sem perfil de comprador).
**Divergências encontradas:** (1) ticket de infraestrutura Protheus cuja DEM é tela Fluig — classificado como Fluig; (2) o título do ticket repete o prefixo "[CASSI - DEM10013707]" (mesma automação do Jira do FSWTBC-1813); (3) erro de comprador chega como HTTP 200 com `"error":"undefined"` — vazio indistinguível de erro (classe A17-a).
**Dados/massa usados:** nenhum — nada submetido.

---

## CT-FSWTBC-3622  (ambos · Concluído · SDCASSI-76)

**Título:** Centralizar solicitações de compra e conferir que se gera uma SC por filial de entrega, originada na filial centralizadora, com cotação única.

**Origem:** FSWTBC-3622 — GAP de desenho: a centralização **deve gerar uma SC por filial de entrega**, mas com a SC **originada na filial centralizadora**, e o **agrupamento deve ocorrer na cotação**, gerando uma **única cotação** para todas as SCs centralizadas. Levou 105 dias para ser fechado (30/12/2025 → 14/04/2026), sem registro do resultado nem de validação.

**Módulo/Rota:** Fluig → **Portal do Comprador** (`/portal/p/1/portal-do-comprador#/validacaoInicial`) → botão **Centralizar Solicitações**; efeito na **Solicitação de Compras**, painéis *Identificação do(s) Produto(s)/Serviço(s) - Solicitações Centralizadas* e *Produtos/Serviços das Solicitações Centralizadas*.

**Pré-condições**
- Pelo menos **duas** SCs **previamente aprovadas**, de **filiais de entrega diferentes**, aparecendo na lista da *Validação Inicial*.
- Uma filial centralizadora definida e justificativa de centralização.
- **Bloqueio:** centralizar **escreve** (abre SC nova no Fluig e finaliza as SCs de origem no ERP). Não executado, conforme a regra do lote. A conferência foi feita nos rótulos da tela e no fonte publicado.

**Passos**
1. Abrir **Portal do Comprador → Validação Inicial**.
2. Selecionar duas ou mais solicitações **aprovadas**, de **filiais de entrega distintas**, na grade (colunas *Nº Solic*, *Solicitante*, *Data Solicitação*, *Cod. Filial*, *Filial*, *Data Emissão*, *Nº Solic ERP*, *Justificativa*, *Etapa*, *Status*).
3. Clicar em **Centralizar Solicitações**.
4. No modal, preencher **Cód Filial Centralizadora**, **Nome da Filial** e **Justificativa da Centralização**, e confirmar em **Centralizar**.
5. Anotar o(s) número(s) de SC informado(s) na mensagem de retorno.
6. Abrir a(s) SC(s) gerada(s) e conferir, no painel *Produtos/Serviços das Solicitações Centralizadas*, as colunas **NºProcesso Fluig**, **Nº SC Origem ERP** e **Cód. Filial Origem**.
7. Seguir o fluxo até a cotação e conferir quantas cotações foram geradas.

**Resultado esperado** *(conforme o desenho aprovado no ticket)*
- É gerada **uma SC por filial de entrega**, e não uma SC única.
- Cada SC gerada tem como **origem a filial centralizadora**.
- Na cotação, todas as SCs centralizadas são **agrupadas em uma única cotação**.
- A rastreabilidade do destino é preservada: cada item mostra a filial de entrega correspondente.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Uma **única** SC centralizadora agrupando itens de várias filiais, perdendo o vínculo com a filial de entrega — modelo que também explicava o bloqueio do MATA110 ao alterar SC com `C1_SCORI` preenchido.

**Severidade:** Alta *(o desenho errado quebra a rastreabilidade do destino da compra e trava a alteração da SC no ERP)*

**Preparação de massa:** duas ou mais SCs aprovadas, de filiais de entrega diferentes, disponíveis na Validação Inicial. Hoje a lista tem 4 processos, mas **todos em `Validação do Comprador / Pronto p/ Validação`** e concentrados em duas filiais (5303 e 3517) — é preciso alguém preparar SCs aprovadas de filiais de entrega distintas para exercitar o caso de verdade.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri **Portal do Comprador → Validação Inicial** e confirmei o botão **Centralizar Solicitações**, a grade com as colunas *Nº Solic, Solicitante, Data Solicitação, Cod. Filial, Filial, Data Emissão, Nº Solic ERP, Justificativa, Etapa, Status*, e os filtros *Filial, Produto, Grupo de Produto, Centro de Custo, Justificativa, Somente Minha Responsabilidade*. Na SC confirmei os painéis **Identificação do(s) Produto(s)/Serviço(s) - Solicitações Centralizadas** e **Produtos/Serviços das Solicitações Centralizadas**, com os campos **NºProcesso Fluig \***, **Nº SC Origem ERP \*** e **Cód. Filial Origem \***. No modal do contrato existe também **Número SC Origem:**. No histórico de 112832 existe o gateway **`Compra Centralizada?`**.
**Divergências encontradas:** **a mais importante do lote.** (1) **O fonte publicado hoje gera UMA SC única centralizadora, não uma por filial de entrega.** A função `centralizaSolicitacoes` (`pc_main.js`) chama `iniciaSolicitacao(...)` **uma só vez**, produz **um** `processId`, e a mensagem literal de sucesso é `"As solicitações foram centralizadas.  Foi aberta a SC: <id>, como centralizadora!"`; em seguida todas as SCs de origem são finalizadas contra essa SC única. O cabeçalho recebe **uma** `codFilialCentralizadora` e o agrupamento de produtos (`agrupaProdutos`) usa como chave **apenas o produto/serviço** — a filial **não entra na chave**. **Com todas as letras: o desenho descrito no ticket como o correto, fechado como "Feito" em 14/04/2026, não está implementado no front publicado nesta base de homologação.** (2) A filial de entrega sobrevive só como linha da grade filha, no campo **`tbprodcent_filEntrega`, que é `type="hidden"`** — não é exibido na SC centralizadora; o que aparece rotulado é **Cód. Filial Origem**, que é outra coisa. (3) `C1_SCORI` citado no contexto do ticket não existe no fonte do Fluig; o equivalente é `tbprodcent_numSCOrigem`. (4) Críticas literais da centralização, para o passo 3: `"Não foi identificado nenhuma solicitação selecionada, por favor selecione para que possa ser centralizada!"`, `"As solicitações <n> não foram previamente aprovadas!"` e `"É necessário informar a justificativa para centralização."`.
**Dados/massa usados:** processos 112902, 112848, 112845, 112832 apenas **lidos** na grade. **Nada centralizado, nada submetido.**

---

## CT-FSWTBC-3626  (fluig · Concluído · SDCASSI-192)

**Título:** Após a cotação aprovada, conferir na SC quais fornecedores foram marcados como exclusivos e localizar o processo pelo número da SC do Fluig.

**Origem:** FSWTBC-3626 — duas necessidades do comprador: **(a)** conferir, depois de aprovada a cotação, se houve indicação de **fornecedor exclusivo** e quais foram (lacuna de auditoria: fornecedor exclusivo indica cotação dirigida, sujeita a justificativa); **(b)** incluir **filtro por número da SC do Fluig**, já que o número do Fluig e o do ERP são distintos e localizar o processo era difícil. Ambos implementados no mesmo dia; subtarefas FSWTBC-3633 e 3634.

**Módulo/Rota:** (a) *Solicitação de Compras* › seção **Validação do Comprador** › campos **Dispensa Cotação? \***, **Justificativa da Dispensa Cotação \*** e painel **Fornecedores Exclusivos**; (b) *Portal do Comprador* › **Filtrar** (campo **Nº do Processo Fluig**) e colunas **Número da SC** / **Nº. Proc. Fluig** das grades; também *Tracker - Processos Compras/ Contratos* › filtros **Nº do Processo Fluig** e **Dispensa Cotação**.

**Pré-condições**
- Uma SC cuja **Validação do Comprador** tenha sido concluída com **Dispensa Cotação? = Sim** e ao menos um fornecedor indicado como exclusivo (campo `listaFornecedores` preenchido no formato `código-loja;código-loja`).
- Uma segunda SC com **Dispensa Cotação? = Não**, para o contraste.
- Credencial de comprador com matrícula no ERP, para a parte (b) no Portal do Comprador.
- **Bloqueio:** parcial. A parte (a) é observável no formulário da SC por qualquer perfil que consiga abrir a solicitação — mas **não há, na conta de QA, nenhuma SC com fornecedor exclusivo indicado** para abrir. A parte (b) no Portal do Comprador está bloqueada pela matrícula de comprador não resolvida (grades vazias); o mesmo filtro no **Tracker** é acessível.

**Passos**
1. Abrir a SC com dispensa de cotação e ir à seção **Validação do Comprador**.
2. Conferir que **Dispensa Cotação?** está marcado como **Sim** e que a **Justificativa da Dispensa Cotação** está preenchida e legível.
3. Conferir que o painel **Fornecedores Exclusivos** está **visível** e lista um cartão por fornecedor indicado, com o nome e as linhas **Codigo:** e **Loja:**.
4. Conferir que a lista de exclusivos permanece visível **depois** da aprovação da cotação (reabrir a solicitação em etapa posterior e repetir a leitura).
5. Abrir a SC de contraste (**Dispensa Cotação? = Não**) e conferir que o painel **Fornecedores Exclusivos** **não** aparece.
6. No **Portal do Comprador**, abrir **Filtrar**, informar o **Nº do Processo Fluig** da SC e pesquisar.
7. Conferir que o registro é retornado e que as colunas **Número da SC** e **Nº. Proc. Fluig** exibem, respectivamente, o número do ERP e o do Fluig.
8. Repetir a busca no **Tracker**, campo **Nº do Processo Fluig**, e conferir o mesmo registro.

**Resultado esperado**
- O painel **Fornecedores Exclusivos** aparece sempre que houver fornecedor indicado, com **um cartão por fornecedor**, contendo nome, **Codigo** e **Loja** — e continua consultável **depois** da aprovação da cotação (é esse o pedido do ticket: conferir *a posteriori*).
- Sem fornecedor indicado, o painel permanece oculto (não aparece vazio).
- A **Justificativa da Dispensa Cotação** é obrigatória e fica visível junto da indicação, ligando a cotação dirigida à sua justificativa.
- O filtro por **Nº do Processo Fluig** localiza o processo tanto no Portal do Comprador quanto no Tracker, e as duas numerações (Fluig e ERP) aparecem em colunas distintas e rotuladas, sem ambiguidade.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Não havia como o comprador conferir, depois de aprovada a cotação, **se** houve indicação de fornecedor exclusivo e **quais** foram — a informação existia no fluxo mas não era recuperável, deixando a cotação dirigida sem trilha de auditoria.
- Não havia filtro pelo número da SC do Fluig, obrigando o comprador a procurar o processo por outro critério, com o agravante de o número do Fluig e o do ERP serem distintos.

**Severidade:** Média *(rastreabilidade e usabilidade; sobe para Alta se a ausência do registro de fornecedor exclusivo impedir auditar uma compra dirigida)*

**Preparação de massa:** uma SC com **Dispensa Cotação? = Sim** e ao menos dois fornecedores exclusivos indicados, e uma SC com **Dispensa Cotação? = Não**, ambas já passadas pela Validação do Comprador — a conta de QA não chega a essa etapa, então a massa precisa vir do time da CASSI. Para a parte (b) no Portal do Comprador, um login de comprador com matrícula válida no Protheus.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no formulário da *Solicitação de Compras*, a seção **Validação do Comprador** contém **Dispensa Cotação? \*** (rádios `Sim`/`Não`, campo `buyerDispensaCotacao`), **Justificativa da Dispensa Cotação \*** (`buyerJustDispensaCotacao`, textarea obrigatória de até 400 caracteres) e o cabeçalho **Fornecedores Exclusivos** (`textBuyerListaFornecedor`) com o contêiner `buyerListaFornecedor` — **ambos ocultos por padrão** (`fs-display-none`). No fonte publicado do formulário (`sc_App_ViewHandler.js`) confirmei a regra: quando o campo `listaFornecedores` está preenchido (formato `código-loja` separado por `;`), o painel é revelado e recebe **um cartão por fornecedor** com o nome resolvido e as linhas `Codigo:` e `Loja:`; quando está vazio, o painel é escondido. No **Portal do Comprador**, o bundle publicado tem os campos de filtro rotulados **Nº do Processo Fluig**, **Nº da Solicitação ERP**, **Nº da Cotação ERP**, **Nº do Contrato**, **Dispensa Cotação**, **Filial**, **Tipo de Solicitação** e **Justificativa para Dispensa da Cotação**; as grades de **Avaliação de Propostas** e **Definir Vencedor Cotação** renderizaram, em tela, as colunas **Número da SC** e **Nº. Proc. Fluig** lado a lado. No **Tracker**, os filtros **Nº do Processo Fluig**, **Nº da Solicitação ERP**, **Nº da Cotação ERP** e **Dispensa Cotação** existem e estão rotulados. **O painel de exclusivos não foi visto populado** (não há SC com `listaFornecedores` preenchido acessível à conta).
**Divergências encontradas:** o ticket pede "filtro por número da SC do Fluig"; na tela o rótulo é **Nº do Processo Fluig** (e a coluna, **Nº. Proc. Fluig**) — "SC do Fluig" e "processo Fluig" são o mesmo número, mas o teste precisa usar o rótulo real. Nas colunas das grades, **Número da SC** é o número do **ERP**, não o do Fluig: quem ler literalmente troca os dois. E, no formulário da SC, os "fornecedores exclusivos" aparecem sob o par **Dispensa Cotação? / Justificativa da Dispensa Cotação** — o ticket trata os dois assuntos como separados, mas na tela a indicação de exclusivos é consequência da dispensa.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3636  (fluig · Concluído · SDCASSI-193)

**Título:** Tentar marcar o vencedor de uma cotação cuja negociação ainda não foi aprovada, confirmando que o sistema não permite — e medir o tempo até a grade de alçadas ser gerada.

**Origem:** FSWTBC-3636 — a **SC 7931** permitiu **marcar o vencedor sem que a negociação tivesse sido aprovada** (inversão da ordem de decisão: risco de comprar de fornecedor cuja negociação foi recusada) e, além disso, ficou **22 minutos aguardando a geração de alçadas**. O segundo sintoma **não foi tratado neste ticket** e reaparece em agosto/2026 no FSWTBC-3657, onde a causa raiz da fila travada é identificada (laço infinito na numeração do pedido).

**Módulo/Rota:** (a) *Portal do Comprador* › **Definir Vencedor Cotação** (`#/propostaVencedora`) e *Solicitação de Compras* › seção **Validação do Comprador (Definir Negociação)**; formulário *Negociação de Cotação de Produtos/Serviços* › **Validação de Proposta** › **Proposta Validada?**. (b) Atividades `309 - Aguarda Geração Alçadas` → `310 - Gerar Grid de Alçada` → `94 - Aprovação de Alçadas`, medidas pela aba **Histórico**.

**Pré-condições**
- Uma cotação com negociação **em curso e ainda não aprovada** (a proposta do fornecedor negociada, mas sem validação concluída).
- Uma segunda cotação com negociação **já aprovada**, para o caminho positivo.
- Credencial de comprador com matrícula resolvida no ERP.
- **Bloqueio:** sim. A conta de QA não resolve matrícula de comprador — **Definir Vencedor Cotação** carrega as colunas e devolve "Nenhum dado encontrado", então a tentativa de marcar vencedor não é sequer acionável. Não há SC nas atividades `309`/`310`/`94` na Central de Tarefas da conta. O item (b) exige, ainda, massa que percorra a fila de integração, que o briefing veda forçar.

**Passos**
1. **Caminho negativo.** Abrir **Portal do Comprador › Definir Vencedor Cotação** e localizar a cotação cuja negociação **não** foi aprovada.
2. Selecionar o fornecedor e tentar gravar como vencedor.
3. Observar a recusa e a mensagem apresentada, **sem** insistir.
4. Conferir, no formulário da SC, seção **Validação do Comprador (Definir Negociação)**, que a grade `Nº Proposta | Nº Versão | Fornecedor | Status Area Dem. | Status Area TI. | Negociação?` reflete a negociação ainda pendente, e que no formulário de negociação o campo **Proposta Validada?** ainda não está respondido.
5. **Caminho positivo.** Repetir na cotação com negociação **aprovada** e conferir que a gravação do vencedor é aceita.
6. **Tempo de alçada.** Para uma SC que tenha seguido para alçadas, abrir a aba **Histórico** e anotar os horários de entrada em `309 - Aguarda Geração Alçadas`, `310 - Gerar Grid de Alçada` e `94 - Aprovação de Alçadas`.
7. Conferir que a seção **Aprovação de Alçada** do formulário está populada (campos **Empresa Vencedora**, **CNPJ/CPF**, **Valor da Compras (R$)**, **Valor do Frete (R$)**, **Total a ser Aprovado (R$)**) e que a grade de alçadas foi gerada.

**Resultado esperado**
- Com a negociação **não aprovada**, o sistema **recusa** a marcação do vencedor e informa o motivo; nenhum vencedor é gravado e a cotação permanece no mesmo status.
- Com a negociação **aprovada**, a gravação do vencedor é aceita e a tela retorna o sucesso (*"A cotação foi atualizada com os vencedores!"*).
- Uma cotação que já tenha uma gravação de vencedor **na fila de processamento** não aceita nova tentativa enquanto a fila não drenar — não há duplicidade de vencedor.
- A transição de `309 - Aguarda Geração Alçadas` para a grade de alçadas gerada acontece em tempo compatível com uso interativo; **22 minutos, ou qualquer valor da ordem de dezenas de minutos, reprova o caso**.
- O Histórico registra a sequência `309 → 310 → 94` com horários, permitindo medir o tempo sem instrumentação extra.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O vencedor é gravado **antes** de a negociação ser aprovada, invertendo a ordem de decisão do fluxo de compras (relato original: SC 7931).
- A SC fica **22 minutos** parada aguardando a geração de alçadas — mesma faixa de lentidão de FSWTBC-3432 (15 a 28 minutos), cuja causa raiz (laço infinito na numeração do pedido, fila travada) só foi identificada meses depois em FSWTBC-3657.

**Severidade:** Alta *(marcar vencedor antes da aprovação da negociação é falha de governança do fluxo de compras — permite contratar fornecedor cuja negociação foi recusada)*

**Preparação de massa:** **duas** cotações em estados distintos — uma com negociação em curso e não aprovada, outra com negociação aprovada — e um login de comprador com matrícula no Protheus. Para o item (b), uma SC que chegue a `309 - Aguarda Geração Alçadas`. Nada disso é criável pela conta de QA; é massa de time. **Observação a carregar para a execução:** o segundo sintoma (tempo de alçada) é de **fila de integração**, não do formulário — se reprovar, a apuração é no schedule/fila, não na tela, e o ticket correlato a consultar é FSWTBC-3657.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a rota **Definir Vencedor Cotação** (`#/propostaVencedora`) abre e renderiza a grade `Status | Núm. Cotação | Filial | Número da SC | Nº. Proc. Fluig | Tip. Documento | Parecer Téc. | Em Alçada | Dt. Validade | Valor Final`, com **"Nenhum dado encontrado"**. No formulário da SC existem a seção **Validação do Comprador (Definir Negociação)** — grade `Nº Proposta | Nº Versão | Fornecedor | Status Area Dem. | Status Area TI. | Negociação?` — e a seção **Aprovação de Alçada**, com **Empresa Vencedora**, **CNPJ/CPF**, **Valor da Compras (R$)**, **Valor do Frete (R$)**, **Nº Pedido**, **Nº Contrato**, **Total a ser Aprovado (R$)**, **Valor Vigente do Contrato (R$)** e **Total com Aditivo (R$)**. No formulário de *Negociação de Cotação de Produtos/Serviços* está o campo **Proposta Validada?** (Sim/Não) com o aviso em tela **"A aprovação da negociação deve ser realizada pelo Protheus."**. No histórico da solicitação 112146 estão mapeadas as atividades `309 - Aguarda Geração Alçadas`, `310 - Gerar Grid de Alçada`, `317 - Verificar retorno Protheus` e `94 - Aprovação de Alçadas`. No fonte publicado do Portal do Comprador confirmei que a gravação do vencedor chama `POST .../api/v2/fluig/compras/cotacao/gravaVencedor/<chave>` e que existe uma **guarda de fila** antes de habilitar a marcação: a tela consulta a fila de processamento (`service: "gravaVencedor"`, `status: "N"`) e, havendo item pendente, não deixa marcar de novo. **A recusa por negociação não aprovada não foi observada** — sem cotação na grade, nada é acionável.
**Divergências encontradas:** o aviso do próprio formulário — **"A aprovação da negociação deve ser realizada pelo Protheus"** — indica que o estado que deveria travar a marcação do vencedor **é mantido no ERP**, não no Fluig; isso explica como o defeito original foi possível e é informação que o ticket não traz. A guarda que encontrei no fonte do portal é sobre **fila de processamento** (evitar gravação duplicada), **não** sobre "negociação aprovada" — não localizei, no lado Fluig, uma verificação explícita do status da negociação antes de gravar o vencedor. Isso pode ser validação de servidor, mas fica registrado como ponto a confirmar com o time: se a trava for só do lado do ERP, o cenário do ticket continua possível quando a integração oscilar.
**Dados/massa usados:** nenhum — não submetido, nenhum vencedor marcado.

---

## CT-FSWTBC-3665  (ambos · Concluído · SDCASSI-196)

**Título:** Aguardar a geração do contrato a partir da cotação e conferir que o número volta ao Fluig e o processo encerra.

**Origem:** FSWTBC-3665 / SD794513 — a cotação `000381-5303` não retornou ao Fluig o número do contrato gerado (SC `8554`). O processo ficou parado na etapa **"9311 - Aguarda Geração do Pedido/Contrato"** e, mesmo depois de o contrato ser posto como **Vigente** no ERP, o processo Fluig não encerrou. Fechado em um dia; o sintoma persistiu por mais de três semanas e migrou para o SDCASSI-223 ("o problema ocorreu no schedule").

**Módulo/Rota:** Fluig → **Solicitação de Compras** → atividade **Aguarda Geração da Pedido/Contrato** → painel **Verificar Retorno Protheus**; conferência em **Acompanhamento de Contratos** → *Informações do Contrato* → **Status da Integração GCT** / **Erro de Integração**; e no **Portal do Comprador**, status **Geração Pedido/Contrato**.

**Pré-condições**
- Uma SC com cotação finalizada e contrato em geração no Protheus.
- Schedule de retorno do ERP em execução.
- **Bloqueio:** pôr um contrato como Vigente exige o Protheus, sem credencial nesta rodada. A âncora no Fluig é o modal *Informações Complementares do Contrato* (campos de integração GCT) mais o Histórico do processo. Não executado.

**Passos**
1. Abrir a SC parada na atividade **Aguarda Geração da Pedido/Contrato**.
2. Abrir o **Histórico** e conferir há quanto tempo o processo está nessa atividade e qual foi a última atividade de serviço executada.
3. Abrir **Acompanhamento de Contratos**, localizar o contrato gerado e clicar no ícone `title="Informações do Contrato"`.
4. Na seção **Outros** do modal, ler **Status da Integração GCT:** e **Erro de Integração:**; na mesma seção, conferir **Via Solicitação Compra?:** e **Número SC Origem:**.
5. Voltar à SC e conferir se o campo **Nº Contrato** da grade da Empresa Vencedora foi preenchido.
6. Conferir no **Portal do Comprador** se a solicitação saiu do status **Geração Pedido/Contrato**.

**Resultado esperado**
- Assim que o contrato é gerado no ERP, o número volta ao Fluig e preenche **Nº Contrato**.
- O processo **sai** da atividade *Aguarda Geração da Pedido/Contrato* e segue até o encerramento.
- No modal, **Status da Integração GCT** indica sucesso e **Erro de Integração** fica vazio.
- **Número SC Origem** do modal bate com o número da SC do processo.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Processo parado indefinidamente em "Aguarda Geração do Pedido/Contrato", **sem** número de contrato, **mesmo com o contrato já Vigente no ERP** (cotação 000381-5303, SC 8554).

**Severidade:** Alta *(processo travado indefinidamente com o contrato já válido no ERP — descasamento entre os dois sistemas)*

**Preparação de massa:** uma SC com cotação finalizada aguardando geração de contrato, mais a geração efetiva do contrato no Protheus. Depende da família cotação/alçada, bloqueada para a conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei no modal **Informações Complementares do Contrato** os campos literais **Status da Integração GCT:**, **Erro de Integração:**, **Via Solicitação Compra?:** e **Número SC Origem:** (todos com valor `-` no contrato `0000-2025-2501-` consultado), na seção **Outros**. Na SC confirmei o painel **Verificar Retorno Protheus** e o combo **Enviar para** com a opção **`Retornar para Aguardar Geração`** — que é justamente o tratamento manual deste cenário.
**Divergências encontradas:** (1) **A atividade "9311" do ticket não existe** — não há nenhuma ocorrência de `9311` no fonte publicado. As atividades reais são **86** e **89** (*Aguarda Geração da Pedido/Contrato*, com esse texto exato, incluindo o "da" no lugar de "do") e **323** `aguardaGeraPedContrato` / **332** `aguardaVigenciaContrato`. Quem procurar "9311" no Fluig não acha nada. (2) O rótulo de status no Portal do Comprador é **"Geração Pedido/Contrato"**, e ele é derivado **apenas da sequência de estado** (323 ou 332) — **não olha se o número do contrato chegou**. Ou seja, um processo com contrato já vigente no ERP e sem retorno continua exibindo o mesmo status, sem nenhum sinal de anomalia. (3) O ticket cita "Nova Solicitação de Contrato"; no combo *Tipo de Solicitação* da tela as opções são **`Aditivo Contratual`** e **`Nova Contratação`**.
**Dados/massa usados:** contrato `0000-2025-2501-` (filial 2501) apenas consultado no modal. Nada alterado.

---

## CT-FSWTBC-3670  (ambos · Concluído · SDCASSI-199)

**Título:** Conferir que o comprador que conduziu o processo consegue editar o contrato gerado a partir da sua cotação.

**Origem:** FSWTBC-3670 — o contrato `00002-2026-5303`, gerado pela compradora Mariana, não permitia alterar a cotação `000381` (filial 5303, SC 8554). Duas coisas se sobrepunham: (a) por definição do produto **não se altera a cotação de um contrato** — é preciso excluir o contrato para reabrir a cotação; (b) o defeito real era de **permissão**: "no padrão, como a tela do contrato é aberta para digitação, fica registrado o usuário que **finalizou a cotação**" — e como quem finaliza é o usuário de integração/gestora, o comprador perde o acesso de edição. Homologado em 18/03/2026, **reprovado em 27/03** com novo caso (comprador Arthur, SC 10262, cotação 000025, filial 1701), ajustado em 01/04 e homologado em 08/04/2026.

**Módulo/Rota:** Protheus **SIGAGCT** (permissão de edição do contrato / usuário criador) → efeito observável em Fluig → **Acompanhamento de Contratos** → ícone `title="Informações do Contrato"`; e **Portal do Comprador → Controle De Cotações**.

**Pré-condições**
- Um contrato gerado **a partir de uma cotação conduzida por um comprador identificado**, cuja finalização tenha sido feita pelo usuário de integração.
- Login **do próprio comprador** que conduziu o processo.
- **Bloqueio: duplo e declarado.** (a) Sem credencial Protheus não é possível abrir a tela do contrato no SIGAGCT nem tentar editá-la. (b) **Não existe superfície no Fluig para permissão de edição de contrato** — o Fluig não mostra quem é o usuário criador do contrato nem testa permissão de edição. O que o Fluig oferece é apenas contexto: o modal do contrato e a origem (SC/cotação). **Digo explicitamente: a asserção central deste caso só se verifica no Protheus.**

**Passos**
1. *(Fluig)* Abrir **Acompanhamento de Contratos**, localizar o contrato gerado e clicar no ícone `title="Informações do Contrato"`.
2. Na seção **Outros**, ler **Via Solicitação Compra?:** e **Número SC Origem:**, confirmando que o contrato veio de uma SC/cotação.
3. Anotar **Número do Contrato**, **Filial** e **Fiscal de Contrato**.
4. *(Protheus, por quem tem acesso)* Autenticar **com o usuário do comprador que conduziu a cotação**.
5. Abrir o contrato no SIGAGCT e tentar **editá-lo**.
6. Conferir quem consta como usuário **criador** do contrato.
7. Conferir a regra padrão: tentar alterar a **cotação** de um contrato já gerado.

**Resultado esperado**
- O **comprador que conduziu o processo** consta como usuário criador do contrato e **consegue editá-lo**, mesmo que a finalização da cotação tenha sido feita pelo usuário de integração.
- A regra padrão do produto continua valendo: **não é possível alterar a cotação de um contrato já gerado**; para isso é preciso excluir o contrato e reabrir a cotação. Isso é comportamento correto, **não** defeito.
- No Fluig, o contrato aparece em *Acompanhamento de Contratos* com **Via Solicitação Compra?** e **Número SC Origem** coerentes com a SC de origem.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- "O comprador que conduziu o processo está **sem acesso** para alterar o contrato. Somente a gestora de contratos tem o acesso." Casos originais: contrato 00002-2026-5303 (compradora Mariana, cotação 000381, SC 8554, filial 5303) e, na reprovação da homologação, comprador Arthur (SC 10262, cotação 000025, filial 1701).

**Severidade:** Alta *(acesso indevido/negado sobre documento contratual — o responsável pelo processo não consegue mantê-lo)*

**Preparação de massa:** um contrato recém-gerado a partir de cotação conduzida por um comprador nomeado, **mais a credencial desse comprador no Protheus**. Nenhum dos dois é obtenível nesta rodada. Sem isso o caso morre — e isso está declarado, não simulado.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri **Acompanhamento de Contratos** e confirmei a grade (colunas *Filial, Tipo Contrato, Contrato, Data Inicio, Data Fim, Nº Revisão, Status, Fornecedor, Ação*) e os três ícones da coluna **Ação**, cujo gancho estável é o `title`: **Planilha**, **Solicitação de Compra**, **Informações do Contrato**. Abri o modal **Informações Complementares do Contrato** e confirmei as seções *Dados Gerais*, *Datas*, *Valores Financeiros*, *Reajustes e Aditivos*, *Outros* e os campos **Via Solicitação Compra?:**, **Número SC Origem:**, **Fiscal de Contrato:**, **Fiscal de Serviço:**, **Status da Integração GCT:**, **Erro de Integração:**.
**Divergências encontradas:** **sem superfície no Fluig para o objeto do ticket** — o modal do contrato **não exibe usuário criador, comprador responsável nem qualquer indicação de permissão de edição**. O contrato `00002-2026-5303` do ticket não existe nesta base. Registro ainda que os ícones da coluna Ação continuam sendo **âncoras vazias sem nome acessível**: `getByRole('link', {name})` não os resolve, só o atributo `title`.
**Dados/massa usados:** contratos `0000-2025-2501-`, `000000000000001`, `000000000000002`, `000000000000003` apenas listados/consultados. Nada alterado.

---

## CT-FSWTBC-3690  (fluig · Concluído · SDCASSI-76)

**Título:** Centralizar solicitações de compra e confirmar que o agrupamento considera a filial de entrega e que os itens das SCs de origem aparecem estruturados na SC centralizadora.

**Origem:** FSWTBC-3690 — evolução das **Compras Centralizadas**: a centralização precisou passar a considerar a **filial de entrega**, e os itens precisaram ficar estruturados no formulário do Fluig. Coerente com o campo `tbprodcent_filEntrega`, criado lá em FSWTBC-319 — *a regra existia no campo, mas não no agrupamento*. GAP de 73 dias entre janeiro e março de 2026; o ticket **não traz descrição detalhada nem evidência**, então o caso abaixo é escrito como caracterização de caminho sobre o comportamento correto declarado.

**Módulo/Rota:** *Portal do Comprador* › botão **Centralizar Solicitações** › modal **Centralizando Solicitações**; *Solicitação de Compras* (SC centralizadora) › seção **Identificação do(s) Produto(s)/Serviço(s) - Solicitações Centralizadas** › grade **Produtos/Serviços das Solicitações Centralizadas**; atividades `301` / `303 - Intermediário Compra Centralizada`.

**Pré-condições**
- Ao menos **três** SCs elegíveis à centralização, sendo **duas com a mesma filial de entrega** e **uma com filial de entrega diferente**, e todas com o mesmo produto/serviço — é essa a massa que distingue "agrupou por filial de entrega" de "agrupou por qualquer coisa".
- Credencial de comprador com matrícula resolvida no ERP.
- **Bloqueio:** sim. A conta de QA não resolve matrícula de comprador; o Portal do Comprador não lista SC alguma (**"Nenhum dado encontrado"**), então o comando **Centralizar Solicitações** não é acionável. Além disso, montar as três SCs com filiais de entrega controladas é criação de massa em volume, que o briefing pede para não forçar.

**Passos**
1. Abrir o **Portal do Comprador** e acionar **Centralizar Solicitações**.
2. No diálogo *"Selecione as solicitações desejadas:"*, selecionar as três SCs preparadas.
3. Conferir a lista apresentada em *"Verifique as solicitações selecionadas:"* antes de confirmar.
4. No modal **Centralizando Solicitações**, conferir os campos **Cód Filial Centralizadora**, **Nome da Filial Centralizadora** e **Justificativa da Centralização**.
5. Confirmar a centralização apenas se a massa for de teste; caso contrário, **cancelar aqui** — o restante do caso pode ser verificado numa SC centralizadora já existente.
6. Abrir a SC **centralizadora** e ir à seção **Identificação do(s) Produto(s)/Serviço(s) - Solicitações Centralizadas**.
7. Conferir a grade **Produtos/Serviços das Solicitações Centralizadas**, coluna a coluna: **Nº Processo**, **SC Origem**, **Item**, **Produto/Serviço**, **Grupo Prod./Serv.**, **Fil. Entrega**, **Dt. Necessidade**, **Qtd.**
8. Conferir que cada linha traz a **filial de entrega da SC de origem** (formato `código - nome da filial`) e que a rastreabilidade até a SC de origem (**Nº Processo** / **SC Origem**) está preservada item a item.
9. Conferir os campos de controle da centralização preenchidos: **Nº SC Origem ERP**, **Cód. Filial Origem**, além da data/hora e matrícula de quem centralizou.

**Resultado esperado**
- A centralização **agrupa por filial de entrega**: SCs com filiais de entrega diferentes não são fundidas num mesmo agrupamento de entrega, e a coluna **Fil. Entrega** distingue as origens dentro da SC centralizadora.
- A grade **Produtos/Serviços das Solicitações Centralizadas** lista **um registro por item de cada SC de origem** (estruturação item a item, não um bloco por SC), com produto, grupo, data de necessidade e quantidade preservados da origem.
- Cada linha permite voltar à origem pelo **Nº Processo** e pela **SC Origem**.
- A **Justificativa da Centralização** fica registrada, e a filial centralizadora aparece identificada por código e nome.
- Nenhuma quantidade é somada entre filiais de entrega diferentes.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `<não documentado>` — o ticket não descreve sintoma nem traz evidência. O sinal observável a monitorar, derivado do próprio pedido: SCs de **filiais de entrega distintas** agrupadas como se fossem a mesma entrega, e/ou a grade de itens centralizados sem a coluna **Fil. Entrega** preenchida (ou sem estrutura item a item), fazendo o comprador perder de vista para onde cada quantidade deve ir.

**Severidade:** Média *(agrupamento sem a filial de entrega leva material para o destino errado; é falha operacional que só aparece na entrega — sobe para Alta se houver soma de quantidades entre filiais distintas)*

**Preparação de massa:** **três SCs elegíveis à centralização** — duas com a mesma filial de entrega e uma com filial diferente, todas com o mesmo produto — mais um login de comprador com matrícula no Protheus. O executor **não** deve criar essa massa sozinho: são SCs completas que precisam chegar ao ponto de centralização. Alternativa realista para regressão: pedir ao time uma **SC centralizadora já existente** e executar apenas os passos 6 a 9 (conferência da grade), que é onde a regra de filial de entrega é observável.

**Verificado em tela:** PARCIAL
**O que foi verificado:** no formulário da *Solicitação de Compras* existe a seção **Identificação do(s) Produto(s)/Serviço(s) - Solicitações Centralizadas** com o título de grade **Produtos/Serviços das Solicitações Centralizadas** (contêineres `panelProductsCenter` / `targetProductsCenter`) e os campos de controle `solCentralizadora`, `nrSolCentralizadora`, `codFilialSolCentral`, `dataCentralizacao`, `horaCentralizacao`, `matriculaCentralizacao`, além dos campos da tabela filha `tbprodcent_numSCOrigem`, **`tbprodcent_filEntrega`**, `tbprodcent_matSolicitante`, `tbprodcent_codSolicitante`, `tbprodcent_mailSolicitante` e `tbprodcent_numProcesso`. No fonte publicado (`sc_App_ViewHandler.js`) a grade é montada com as colunas exatamente nesta ordem — **Nº Processo | SC Origem | Item | Produto/Serviço | Grupo Prod./Serv. | Fil. Entrega | Dt. Necessidade | Qtd.** — e o valor de *Fil. Entrega* é composto como `código da filial - nome da filial`, vindo do dataset `dsFluig_getProcessosProjetoComprasSql` filtrado por `nrSolCentralizadora`. No bundle do **Portal do Comprador** existem o botão **Centralizar Solicitações**, o modal **Centralizando Solicitações** com **Cód Filial Centralizadora** (desabilitado), **Nome da Filial Centralizadora** e **Justificativa da Centralização**, e os diálogos *"Compra Centralizada"*, *"Selecione as solicitações desejadas:"* e *"Verifique as solicitações selecionadas:"*. As atividades `301` e `303 - Intermediário Compra Centralizada` constam do mapa do processo. **Nada foi acionado e nenhuma SC centralizadora foi aberta** — não há massa.
**Divergências encontradas:** o ticket fala em "centralização de SC por filial de entrega"; na tela a filial de entrega aparece como coluna **Fil. Entrega** da grade de itens centralizados, enquanto o modal de centralização pede a **Filial Centralizadora** — são duas filiais diferentes no mesmo fluxo (a que recebe e a que centraliza) e o caso precisa nomear as duas para não ser ambíguo. Além disso, **a regra de agrupamento em si não é observável em tela**: o Fluig mostra o **resultado** (a grade com a coluna *Fil. Entrega*), não o critério — se o agrupamento voltar a ignorar a filial de entrega, isso só será percebido comparando as SCs de origem manualmente. É a limitação principal deste caso.
**Dados/massa usados:** nenhum — não submetido, nenhuma solicitação centralizada.

---

## CT-FSWTBC-3697  (ambos · Concluído · SDCASSI-203)

**Título:** Enviar anexo em uma proposta de cotação e conferir que ele é exibido na avaliação.

**Origem:** FSWTBC-3697 — o anexo enviado na cotação não era exibido, embora tivesse sido efetivamente enviado (processo 9043). Quinta ocorrência da família de anexos do fluxo de compras, cada uma com causa distinta. Devolvido para validação em 12/01/2026 e encerrado **no mesmo dia em que se pediu "favor validar novamente"**, sem confirmação de validação registrada.

**Módulo/Rota:** Fluig → **Portal do Comprador → Avaliação de Propostas** → ação **Analisar Cotação** → botões **Visualizar Anexos** / **Ver todos Anexos**; e formulário de **Cotação de Produtos/Serviços**, tabela de anexos das propostas.

**Pré-condições**
- Uma cotação com ao menos uma proposta de fornecedor **com anexo enviado** e gravado no GED, vinculado ao processo.
- **Bloqueio:** *Avaliação de Propostas* está sem dados — `GET /java_portal_comprador/.../genericQuery` responde **404** e a grade mostra "Nenhum dado encontrado". Conforme §5-B isso é **instabilidade de ambiente, não defeito**. Não há credencial de fornecedor para enviar anexo. Caso marcado PARCIAL e seguido pelo fonte publicado.

**Passos**
1. Abrir **Portal do Comprador → Avaliação de Propostas** e filtrar a cotação desejada (filtros: *Status, Núm. Cotação, Filial, Número da SC, Nº. Proc. Fluig, Tip. Documento, Parecer Téc., Em Alçada, Dt. Validade, Valor Final*).
2. Na linha da cotação, acionar a ação **Analisar Cotação**.
3. Clicar em **Visualizar Anexos** (card da proposta) ou **Ver todos Anexos** (rodapé do modal).
4. Conferir que o modal **Anexos** abre e exibe o(s) arquivo(s) enviado(s).
5. Repetir com uma proposta de **outro fornecedor**, para garantir que a exibição não depende de qual fornecedor é.
6. No formulário de **Cotação de Produtos/Serviços**, conferir a tabela de anexos das propostas.

**Resultado esperado**
- O modal **Anexos** abre e exibe o(s) anexo(s) enviado(s) pelo fornecedor.
- A exibição funciona **para qualquer fornecedor**, não apenas para um.
- Não aparece a mensagem *"Não há anexos ligados a essa proposta."* quando existe anexo enviado.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Anexo enviado e gravado, mas **não exibido** na cotação (processo 9043) — ou a mensagem `"Não há anexos ligados a essa proposta."` / `"Não foram localizados processos ligados a essa proposta."` com anexo existente.

**Severidade:** Média *(bloqueia a análise da proposta — o comprador decide sem ver a documentação)*

**Preparação de massa:** uma cotação aberta com propostas de **dois fornecedores diferentes**, cada uma com anexo. Exige credencial de fornecedor (inexistente nesta rodada) ou que a CASSI prepare a massa.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri **Portal do Comprador → Avaliação de Propostas** (`#/avaliacaoPropostas`) e confirmei a grade com as colunas literais **Status, Núm. Cotação, Filial, Número da SC, Nº. Proc. Fluig, Tip. Documento, Parecer Téc., Em Alçada, Dt. Validade, Valor Final**, o botão **Filtrar** e **Carregar mais resultados**. A grade exibiu **"Nenhum dado encontrado"** e a rede registrou o **404** em `java_portal_comprador/tbc/protheus/api/framework/v1/genericQuery` — instabilidade conhecida do ambiente. No Histórico do processo 112832 confirmei que a etapa de anexos existe e conclui: `Grava SC e Anexos Executando atividade de serviço do sistema` → **`Integração executada com sucesso - Tempo de Execução 115 s`**.
**Divergências encontradas:** **achado grave, e digo com todas as letras: o defeito de anexo não exibido continua no fonte publicado hoje, embora o ticket esteja fechado como "Feito" desde 12/01/2026.** No formulário de cotação, `cot_App_ViewHandler.handleReceptionProposals()` contém uma **lista branca com um único fornecedor hardcoded**:
`const arFornecedor = new Array("85070508-0001");` … `if (arFornecedor.indexOf(asFornecedor) == -1) { $("div#tableAnexoPropostas").hide(); }`
— ou seja, **a tabela de anexos das propostas é escondida para todo fornecedor que não seja o `85070508-0001`**. Segundo achado, no widget: `isSafeAttachmentUrl` descarta silenciosamente qualquer `URL_Arquivo` que não seja `https:` **e** do mesmo hostname, caindo em `"Não há anexos ligados a essa proposta."` mesmo havendo anexo no GED. Terceiro: os dois pontos de entrada divergem — no modal de avaliação a lista é a **união** de cotação + negociação (datasets `dsConsultaAnexos_Cotacao` e `dsConsultaAnexosNegociacao`), mas no card da proposta só **uma** das fontes é consultada. Divergência de rótulo: o ticket fala em "anexo da cotação"; na tela os botões são **"Visualizar Anexos"** e **"Ver todos Anexos"**, e o modal se chama **"Anexos"**.
**Dados/massa usados:** nenhum — grade vazia por instabilidade de ambiente. Nada enviado.

---

## CT-FSWTBC-3708  (fluig · Concluído · SDCASSI-205)

**Título:** Trocar entre Pedido de Compra e Contrato depois da análise da cotação, sem precisar refazer a solicitação.

**Origem:** FSWTBC-3708 — dúvida de **paridade funcional** levantada pelo cliente na homologação: no processo atual a Análise de Cotação permite **trocar o pedido/contrato**; onde essa opção ficaria no novo desenho? O ticket foi encerrado como "disponibilizado para homologação", **sem resposta escrita**.

**Módulo/Rota:** **Portal do Comprador** › **Validação Inicial** (modal de aprovação, campo *Tipo de Compra*) e **Portal do Comprador** › **Definir Vencedor Cotação** (modal de definição de quantidade/vencedor, combo *Pedido de Compra / Contrato*).

**Pré-condições**
- Uma SC na etapa **Validação do Comprador** atribuída ao comprador autenticado (a grade só age sobre solicitação da própria responsabilidade).
- Para o segundo ponto de troca: uma cotação com propostas recebidas, visível em *Definir Vencedor Cotação*.
- **Bloqueio:** sim. A conta de QA não resolve matrícula de comprador (`Comprador não encontrado`), então nenhuma linha é sua responsabilidade e as grades de cotação voltam vazias (404 em `genericQuery`). Os dois modais não puderam ser abertos com dados.

**Passos**
1. Abrir **Portal do Comprador** › **Validação Inicial**.
2. Localizar a SC pela coluna **Nº Solic** e acionar a ação **Aprovar** da linha.
3. No modal de aprovação, localizar o campo **Tipo de Compra** e conferir que ele oferece **Pedido** e **Contrato**.
4. Selecionar **Contrato** e observar que o formulário passa a exigir **Tipo de Solicitação** (*Nova Contratação* / *Aditivo Contratual*) e, para aditivo, **Nº do Contrato** com fornecedor.
5. Voltar para **Pedido** e conferir que os campos de contrato deixam de ser exigidos.
6. Sair do modal **sem confirmar**.
7. Abrir **Portal do Comprador** › **Definir Vencedor Cotação**, abrir a cotação e, no cabeçalho dos itens, conferir o combo com **Pedido de Compra** e **Contrato**.
8. Alternar a opção e observar que o portal recalcula/reapresenta o cabeçalho.
9. Nas grades de **Avaliação de Propostas** e **Definir Vencedor Cotação**, conferir a coluna **Tip. Documento** e o filtro **Tipo Documento**.

**Resultado esperado**
- A escolha entre **Pedido** e **Contrato** existe em **dois momentos**: na *Validação Inicial* (campo **Tipo de Compra**) e na tela de **Definir Vencedor Cotação** (combo **Pedido de Compra / Contrato**), e é **obrigatória** — sem ela a aprovação é recusada com **"É necessário informar o tipo de compra."**.
- Escolher **Contrato** obriga a informar **Tipo de Solicitação**; recusa com **"É necessário informar o tipo de solicitação para compras do tipo Contrato."** quando faltar.
- Para **Aditivo Contratual**, o contrato precisa ser escolhido pela consulta de contratos; recusa com **"É necessário selecionar o contrato para Nova Contratação ou Aditivo Contratual."** e **"É necessário selecionar o contrato pela consulta de contratos."**.
- A grade reflete a escolha na coluna **Tip. Documento**, com os valores **Pedido de Compra** e **Contrato**, e o filtro **Tipo Documento** separa os dois.

**Resultado se o defeito reincidir**
- Não há, em nenhuma tela do novo portal, controle para escolher ou trocar entre pedido e contrato — a decisão fica presa ao que foi definido na abertura da SC, e mudar exige refazer a solicitação. É a regressão funcional que a pergunta do cliente antecipava.

**Severidade:** Média *(não perde dado nem burla alçada, mas obrigar a refazer a SC para trocar pedido↔contrato trava operação corrente de compras)*

**Preparação de massa:** uma SC na etapa *Validação do Comprador* atribuída ao executor **e** uma cotação com pelo menos uma proposta recebida, para exercitar os dois pontos de troca. Depende de perfil de comprador com matrícula válida no Protheus — que a conta de QA não tem.

**Verificado em tela:** PARCIAL
**O que foi verificado:** em **Avaliação de Propostas** e **Definir Vencedor Cotação** a coluna **Tip. Documento** existe na grade e o modal **Filtrar** traz o campo **Tipo Documento** (`name=tipoDocumento`) — ambos confirmados em tela. No JavaScript servido do portal (`wg_portalCompradores/.../main.js`) estão as duas ofertas de escolha: o combo do cabeçalho de itens com `{label:"Pedido de Compra",value:1}` / `{label:"Contrato",value:2}`, ligado a um campo **obrigatório** `tipoCompra`, e as opções `{label:"Pedido",value:"1"}` / `{label:"Contrato",value:"2"}` do formulário de aprovação da *Validação Inicial*. As validações citadas no resultado esperado são as mensagens literais da função de validação da aprovação. Nenhum dos dois modais foi aberto com dados reais.
**Divergências encontradas:** o ticket fala em trocar o pedido/contrato **"na Análise de Cotação"**; hoje não existe tela com esse nome. A escolha migrou para **dois** lugares: **Validação Inicial** (campo *Tipo de Compra*, na aprovação do comprador) e **Definir Vencedor Cotação** (combo *Pedido de Compra / Contrato*). Registre-se também que a pergunta do cliente permanece **sem resposta escrita** no ticket — a paridade existe, mas não foi comunicada.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3714  (fluig · Concluído · SDCASSI-207)

**Título:** Corrigir, na validação do comprador, um valor digitado errado pelo fornecedor — informando justificativa — e ver o saving recalculado.

**Origem:** FSWTBC-3714 — pergunta do cliente: onde ficaria a opção de **ajustar o valor** enviado pelo fornecedor na cotação, na etapa de validação do comprador, para que um erro de digitação do fornecedor não distorça o **saving**? Passou por duas rodadas (concluído 23/01, reaberto 26/01, concluído 30/01/2026) e foi encerrado **sem resposta escrita** e sem registro de qual controle foi implementado.

**Módulo/Rota:** **Portal do Comprador** › **Avaliação de Propostas** › cotação › card da proposta do fornecedor (campos *Valor Unitário* e *Valor Frete*), botão **Salvar Valores Atualizados**.

**Pré-condições**
- Uma cotação com proposta recebida de fornecedor, atribuída ao comprador autenticado.
- Conhecer o valor correto para comparar com o digitado pelo fornecedor.
- **Bloqueio:** sim. A conta de QA não resolve matrícula de comprador e as grades de cotação voltam vazias (404 em `genericQuery`); nenhuma proposta pôde ser aberta.

**Passos**
1. Abrir **Portal do Comprador** › **Avaliação de Propostas**.
2. Localizar a cotação (filtro **Nº do Processo Fluig** ou **Nº da Cotação ERP**) e abrir as propostas do fornecedor.
3. Anotar o **Saving** exibido para a proposta e a cor/estado atual (positivo, negativo ou neutro).
4. Alterar o campo **Valor Unitário** do item para o valor correto.
5. **Sem preencher justificativa**, acionar **Salvar Valores Atualizados**.
6. Preencher o campo **Justificar Alteração de Valor \*** com o motivo da correção (usar prefixo `QA`).
7. Acionar **Salvar Valores Atualizados** novamente.
8. Repetir os passos 4 a 7 alterando o campo **Valor Frete**.
9. Reabrir a proposta e conferir o valor gravado, o **Saving** e a justificativa registrada.

**Resultado esperado**
- Os campos **Valor Unitário** e **Valor Frete** da proposta são **editáveis** pelo comprador nessa etapa.
- Alterar qualquer um dos dois torna a justificativa **obrigatória**: salvar sem preenchê-la é recusado com o alerta **"Campo Obrigatório não preenchido!"** e a mensagem **"A Justificativa é obrigatória para atualização de valores!"**, e **nada é gravado**.
- Com a justificativa preenchida, o valor é gravado e a **coluna Saving** é recalculada sobre o novo valor, mudando de estado (positivo/negativo/neutro) conforme o resultado.
- A justificativa fica **associada à proposta** e visível ao reabrir (é o mesmo campo de observação do comprador exibido na proposta).
- O **Valor Final** da grade passa a refletir o valor corrigido.

**Resultado se o defeito reincidir**
- Ou não há como o comprador corrigir o valor (o erro de digitação do fornecedor entra no saving e o distorce), ou a correção é aceita **sem justificativa** — que é o risco oposto: alteração de proposta de fornecedor sem trilha de auditoria.

**Severidade:** Alta *(o campo alimenta o indicador de saving da área de compras e altera valor de proposta de terceiro; sem trilha, é alteração de proposta sem rastro)*

**Preparação de massa:** uma cotação em *Avaliação de Propostas* com **proposta já recebida de fornecedor**, atribuída ao executor, contendo pelo menos um item com valor unitário e frete preenchidos. Exige credencial de fornecedor (para enviar a proposta) e matrícula de comprador — nenhuma das duas disponível.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a rota **Avaliação de Propostas** abre e a grade traz as colunas **Valor Final** e **Nº. Proc. Fluig**; nenhuma proposta pôde ser aberta (grade vazia por 404 do ERP). No JavaScript do portal estão, com estes rótulos exatos: o botão **"Salvar Valores Atualizados"**, o campo **"Justificar Alteração de Valor \*"**, os campos decimais de *Valor Unitário* e *Valor Frete* que marcam a linha como "exige justificativa" ao serem alterados, o bloqueio literal **"Campo Obrigatório não preenchido!" / "A Justificativa é obrigatória para atualização de valores!"**, e a coluna **Saving** com os três estados de apresentação (negativo/positivo/padrão).
**Divergências encontradas:** o ticket pergunta apenas **onde** ficaria a opção; a implementação foi além e amarrou a alteração a uma **justificativa obrigatória por item** — controle que o ticket não pede e que não está registrado em lugar nenhum do Jira. Vale documentar, porque é exatamente o controle cuja ausência a pendência apontava. Também confirma-se que o comprador **pode** alterar valor de proposta de fornecedor — decisão sensível que ficou sem registro escrito.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3715  (fluig · Concluído · SDCASSI-208)

**Título:** Localizar uma cotação pelo número do processo do Fluig, sem depender do número do ERP.

**Origem:** FSWTBC-3715 — pedido do cliente: colocar um filtro pelo **nº da SC do Fluig** no portal de avaliação de propostas. É o mesmo pedido de FSWTBC-3626/3634, feito antes para o outro portal — a dificuldade de achar processo pelo número do Fluig atravessava os dois. Atendido no mesmo dia.

**Módulo/Rota:** **Portal do Comprador** › **Avaliação de Propostas** e **Definir Vencedor Cotação** › botão **Filtrar**.

**Pré-condições**
- Ao menos uma cotação visível na grade, e o número do processo Fluig correspondente (o mesmo que aparece na coluna **Nº. Proc. Fluig**).
- **Bloqueio:** parcial. O modal de filtro abre normalmente e seus campos são verificáveis; o **efeito** do filtro sobre resultados não pôde ser medido porque a grade está vazia para a conta de QA (404 do ERP).

**Passos**
1. Abrir **Portal do Comprador** › **Avaliação de Propostas**.
2. Conferir que a grade tem a coluna **Nº. Proc. Fluig** e anotar o valor de um registro.
3. Acionar **Filtrar**.
4. No modal, conferir a existência do campo **Nº do Processo Fluig**.
5. Digitar o número anotado e acionar **Filtrar**.
6. Acionar **Limpar Filtros** e confirmar que a grade volta ao conjunto completo.
7. Repetir os passos 3 a 6 em **Definir Vencedor Cotação**.
8. Informar um número de processo inexistente e filtrar.

**Resultado esperado**
- O modal de filtro traz o campo **Nº do Processo Fluig**, ao lado de **Nº da Cotação ERP**, **Filial**, **Tipo Documento**, **Parecer Técnico**, **Em Alçada** e **Data Validade**.
- Filtrar por um número existente devolve **exatamente** os registros cuja coluna **Nº. Proc. Fluig** é aquele número.
- **Limpar Filtros** restaura a grade completa.
- Número inexistente devolve **"Nenhum dado encontrado"** — sem erro de console e sem grade quebrada.
- O mesmo filtro existe nas **duas** telas (*Avaliação de Propostas* e *Definir Vencedor Cotação*), com o mesmo rótulo.

**Resultado se o defeito reincidir**
- O modal de filtro só oferece **Nº da Cotação ERP**, obrigando o usuário a descobrir antes o número do ERP para achar um processo que ele conhece pelo número do Fluig.

**Severidade:** Baixa *(usabilidade/localização; não afeta valor, alçada nem dado gravado)*

**Preparação de massa:** ao menos uma cotação listada na grade de avaliação de propostas — o que depende da ponte com o ERP responder e de a conta ter matrícula de comprador. Para verificar apenas a **existência** do campo, não é preciso massa nenhuma.

**Verificado em tela:** SIM (total, para o que o caso afirma sobre a existência do filtro)
**O que foi verificado:** o botão **Filtrar** foi acionado nas **duas** telas. Em ambas o modal abriu com os rótulos, nesta ordem: **Nº do Processo Fluig** (campo `processoFluig`), **Nº da Cotação ERP** (`cotacao`), **Filial** (lookup), **Tipo Documento**, **Parecer Técnico**, **Em Alçada** e **Data Validade** (par de datas), mais os botões **Limpar Filtros** e **Filtrar**. As grades das duas telas trazem a coluna **Nº. Proc. Fluig**. O comportamento do filtro sobre resultados **não** foi exercitado — a grade está vazia para esta conta.
**Divergências encontradas:** o ticket pede filtro pelo **"nº da SC Fluig"**; o rótulo em tela é **"Nº do Processo Fluig"** e a coluna correspondente é **"Nº. Proc. Fluig"** (a grade tem ainda uma coluna separada **"Número da SC"**, que é a SC do ERP — não confundir as duas ao escrever o passo).
**Dados/massa usados:** nenhum — apenas abertura do modal de filtro, que não escreve.

---

## CT-FSWTBC-3716  (ambos · Concluído · SDCASSI-209)

**Título:** Cancelar uma solicitação de compras pela Avaliação de Propostas e conferir que SC e cotações são efetivamente excluídas.

**Origem:** FSWTBC-3716 — "a opção de cancelar não executa nada nesta tela". Na verificação de 20/02/2026: "fiz novo teste e o erro ainda persiste, **executa a exclusão das cotações porém não exclui a SC**. Ex: SC 000033, filial 1401, cotação 000016" — cancelamento **parcial**, deixando SC órfã no ERP. Levou 45 dias; entregue em 24/02/2026 sem descrição da correção.

**Módulo/Rota:** Fluig → **Portal do Comprador → Avaliação de Propostas** → ação de linha **Cancelar Solicitação**. Caminho alternativo na SC: painel do comprador, combo **Enviar para** → opção **Cancelar Solicitação**.

**Pré-condições**
- Uma SC **criada pelo próprio executor**, com cotação aberta, aparecendo na Avaliação de Propostas.
- **Bloqueio: absoluto para a execução.** A regra do lote proíbe cancelar registro pré-existente, e a grade está vazia por instabilidade de ambiente (404 no `genericQuery`). **Não executei nenhum cancelamento.** A verificação foi feita nos rótulos e no fonte publicado.

**Passos**
1. Abrir **Portal do Comprador → Avaliação de Propostas** e localizar a SC **criada pelo executor**.
2. Na coluna de ações da linha, acionar **Cancelar Solicitação**.
3. No primeiro diálogo (**"Confirmação" — "Tem certeza que deseja cancelar a solicitação de compras?"**), confirmar em **"Sim, cancelar!"**.
4. No segundo diálogo (**"Justificativa" — "Qual a justificativa para cancelar a solicitação de compras?"**), preencher a justificativa com prefixo `QA` e confirmar em **"Enviar"**.
5. Ler as notificações de retorno.
6. Conferir no **Tracker - Processos Compras/ Contratos** (*Solicitação de Compras*) que a SC não aparece mais como aberta, filtrando por **Nº da Solicitação ERP**.
7. Conferir que a **cotação** vinculada também foi excluída/cancelada, filtrando por **Nº da Cotação ERP**.
8. Conferir no **Histórico** que o processo Fluig foi cancelado com o comentário da justificativa.

**Resultado esperado**
- A ação **executa** — não é botão inerte.
- **Ambos** os documentos são tratados: a **SC** é excluída no ERP **e** a **cotação** vinculada também. Nenhum dos dois fica órfão.
- O processo Fluig é cancelado, com o comentário `Processo cancelado por "<usuário>" - Justificativa: "<texto>"`.
- As notificações de sucesso só aparecem se a exclusão realmente ocorreu.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Clicar em cancelar e **nada acontecer**; ou o cancelamento **parcial** — "executa a exclusão das cotações porém não exclui a SC" (SC 000033, filial 1401, cotação 000016), deixando SC órfã no ERP.

**Severidade:** Alta *(documento órfão no ERP e mensagem de sucesso enganosa — o operador acredita ter cancelado e não cancelou)*

**Preparação de massa:** uma SC com cotação criada pelo **próprio executor** (prefixo `QA`), descartável. **Nunca usar registro de terceiro** — este é exatamente o caso em que reproduzir o defeito em massa alheia causa dano irreversível.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a tela **Avaliação de Propostas** abre, com a grade e o botão **Filtrar**, mas sem linhas ("Nenhum dado encontrado" + 404 no `genericQuery`) — logo, **não** foi possível ver nem acionar a ação de linha. Na SC confirmei o combo **Enviar para** do comprador (`buyerEnviarParaTreat`) com as opções literais `Selecione...`, `Retornar para Alçada - (Regerar Documento)`, `Retornar para Alçada - (Novo Fornecedor)`, `Retornar para Cotação`, `Retornar para Negociação`, **`Cancelar Solicitação`**.
**Divergências encontradas:** **três achados, e o segundo é grave — digo com todas as letras: há defeito ativo no fonte publicado hoje, com o ticket fechado como "Feito" desde 26/02/2026.**
(1) **Rótulo:** o ticket fala em "opção de cancelar"; na tela a ação se chama **"Cancelar Solicitação"** (ícone `an an-file-x`), ao lado de *Alterar Data de Validade*, *Analisar Cotação* e *Ver Itens*.
(2) **Sucesso falso:** `handlePurchasesDelet` trata 404 devolvendo `[]` — e `[]` é **truthy** em JavaScript. O chamador faz `else if (yield this.handlePurchasesDelet(...))`, entra no ramo de sucesso e exibe `"O cancelamento da solicitação de compras <n> no ERP Protheus foi executado com sucesso!"` **sem ter excluído nada**. É exatamente o sintoma "não executa nada" do ticket, com a agravante de anunciar sucesso.
(3) **Assimetria da exclusão, invertida em relação ao ticket:** o fonte publicado chama **duas** operações — `dsProtheus_delSolicitacoesComprasNFC` (exclui a **SC**, filtrando `C1_NUM`) e `dsFluig_postProcessesCancel` (cancela o **processo Fluig**) — e **nenhuma delas exclui a cotação**. Não existe `delCotacao`/`excluirCotacao`/`cancelaCotacao` nem qualquer `method:"delete"` no fonte; a rota `/cotacao/solicitacaoCompra/:numSC` citada no histórico do ticket **não** aparece. O ticket relatava o oposto (excluía cotação e não a SC); hoje o fonte exclui SC e **não** cotação. **De um jeito ou de outro, o par continua assimétrico e um dos dois documentos fica órfão.** Registro ainda que, se `C8_NUMSC` vier vazio, o filtro `C1_NUM` não é aplicado e a chamada segue apenas com `BranchId`.
**Dados/massa usados:** nenhum — **nenhum cancelamento executado**, nem em registro próprio nem de terceiro.

---

## CT-FSWTBC-3728  (ambos · Concluído · SDCASSI-210)

**Título:** Gravar o fornecedor vencedor da cotação e conferir que a alçada de aprovação é gerada com aprovadores.

**Origem:** FSWTBC-3728 — o processo 9098 **não gerou alçada**: o fluxo avançou sem criar os documentos de aprovação, deixando a compra sem controle de alçada. Encerrado no dia seguinte, sem comentário técnico.

**Módulo/Rota:** Fluig → **Portal do Comprador → Definir Vencedor Cotação** (gravação do vencedor) → atividade automática **Integração com ERP geracao Alcada** → **Solicitação de Compras**, painel **Aprovação de Alçada**, grade `tbAlcadas`. Conferência na **Avaliação de Propostas**, coluna **Em Alçada**.

**Pré-condições**
- Cotação com propostas analisadas e vencedor definível.
- Valor de compra que caia em faixa de alçada configurada no ERP.
- **Bloqueio:** a família cotação/alçada está **bloqueada para a conta de QA** (§5-C: `dsProtheus_getCompradores_restGetAll` chamado com `Y1_USER = "undefined"`, "Comprador não encontrado"). Gravar vencedor **escreve**. Não executado.

**Passos**
1. Abrir **Portal do Comprador → Definir Vencedor Cotação** e selecionar o fornecedor vencedor.
2. Gravar o vencedor.
3. Abrir o **Histórico** do processo e localizar a atividade automática **Integração com ERP geracao Alcada**.
4. Ler a linha de retorno da integração dessa atividade.
5. Abrir a SC e ir ao painel **Aprovação de Alçada**.
6. Conferir que a grade `tbAlcadas` foi **preenchida com pelo menos uma linha de aprovador** (campos *Aprovar?*, *Justificativa para a Aprovação/Reprovação*, código do validador e matrícula).
7. Voltar à **Avaliação de Propostas** e conferir a coluna **Em Alçada** para a cotação (valores `Sim`/`Não`).

**Resultado esperado**
- A gravação do vencedor devolve `"A cotação foi atualizada com os vencedores!"`.
- O **Histórico** registra a atividade **Integração com ERP geracao Alcada** com integração executada com sucesso.
- A grade **`tbAlcadas`** vem com **pelo menos uma linha de aprovador**; a coluna **Em Alçada** da Avaliação de Propostas passa a **Sim**.
- **O processo não avança da Aprovação de Alçada com a grade vazia.**

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Processo avança sem gerar alçada — grade de aprovação vazia e compra sem controle de alçada (processo 9098).

**Severidade:** Alta *(compra sem passar por alçada = aprovação indevida, risco financeiro direto)*

**Preparação de massa:** uma cotação com propostas analisadas, valor dentro de faixa de alçada e um comprador com matrícula resolvida na SY1. **A conta de QA não resolve matrícula de comprador**, então o caso precisa ser executado por um comprador real da CASSI.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei na **Avaliação de Propostas** a coluna e o filtro **Em Alçada** (tipo booleano, rótulos `Sim`/`Não`, campo `C8_XALCADA`). Na SC confirmei o painel **Aprovação de Alçada** e os campos **Aprovar? \*** e **Justificativa para a Aprovação/Reprovação \***. Confirmei também os painéis **Validação do Comprador (Análise pós Alçadas)** e a grade da **Empresa Vencedora** com **Valor da Compras (R$) \***.
**Divergências encontradas:** **achado no fonte publicado: uma alçada vazia não gera crítica nenhuma.** Na validação de envio da atividade **94** (*Aprovação de Alçada*), `sc_App_App.js` percorre `tbalcada_codERPValid___*` montando os arrays `alcadaAprov`/`alcadaReprov`; se a grade `tbAlcadas` estiver **vazia** — ou se todas as linhas tiverem `tbalcada_historico == "true"` — **nenhum `throw` é lançado**, `authorityStatusValidacao` conserva o valor anterior e **o processo avança**. Não há tratamento algum para os estados `210`, `309`, `310` ou `323` nesse validador. **Ou seja: exatamente o sintoma do ticket (processo segue sem alçada) não tem barreira no front.** Divergência de nomenclatura importante para escrever o passo: existem **duas** grades de alçada e o formulário tem **quatro** campos rotulados "Aprovar?" — **`tbAlcadas`** (campos `tbalcada_*`) é a da *Aprovação de Alçada*, de onde sai "Aprovar? - Linha 1"; **`tbForneceAlcadas`** é a da *Empresa Vencedora*. Citar o rótulo sem dizer a grade não identifica o campo. Registro ainda o pool de aprovadores hardcoded no fonte: `Pool:Group:G.P.Requisicao_de_Compras_Validacao_Alcadas`.
**Dados/massa usados:** nenhum — nada gravado. Grade da Avaliação de Propostas vazia por instabilidade de ambiente.

---

## CT-FSWTBC-3731  (ambos · Concluído · SDCASSI-214)

**Título:** Concluir a Validação do Comprador e conferir que o processo avança para a etapa seguinte sem erro de integração.

**Origem:** FSWTBC-3731 — "após a Validação do Comprador deu erro" (erro em anexo). Produto marcado como Protheus-Fluig, indicando falha na integração e não só na interface. Aberto e encerrado no mesmo dia, com o único registro sendo o print do erro; nenhum comentário técnico. Faz parte da rajada de 12 tickets de homologação da DEM10013707 abertos entre 12 e 14/01/2026, quase todos fechados no mesmo dia sem registro técnico.

**Módulo/Rota:** Fluig → **Portal do Comprador → Validação Inicial** (lista das solicitações em *Validação do Comprador*) → **Solicitação de Compras**, painel **Validação do Comprador** → conferência no **Histórico da solicitação** e no painel **Verificar Retorno Protheus**.

**Pré-condições**
- Uma SC posicionada na etapa **Validação do Comprador**, com status **Pronto p/ Validação**.
- Comprador com matrícula resolvida na SY1 (`Y1_USER`).
- **Bloqueio:** concluir a validação **movimenta o processo** e dispara integração — não executado, conforme a regra do lote. Além disso, a conta de QA **não resolve matrícula de comprador** (§5-C).

**Passos**
1. Abrir **Portal do Comprador → Validação Inicial** e localizar uma solicitação com **Etapa = Validação do Comprador** e **Status = Pronto p/ Validação**.
2. Abrir a SC correspondente e ir ao painel **Validação do Comprador**.
3. Preencher os campos da validação (**Tipo de Compra**, **Validade da Cotação**, **Resumo**, **Dispensa Cotação?** e, se aplicável, **Justificativa da Dispensa Cotação**).
4. Movimentar o processo.
5. Abrir o **Histórico** e conferir a atividade de serviço disparada logo após a validação, lendo o tempo de execução da integração.
6. Se o processo parar, abrir o painel **Verificar Retorno Protheus** e ler o campo **Retorno Integração**.
7. Conferir que os **anexos** do processo continuam acessíveis após a movimentação (aba *Anexos*).

**Resultado esperado**
- O processo avança da **Validação do Comprador** para a etapa seguinte sem erro.
- O **Histórico** registra a atividade de serviço subsequente com `Integração executada com sucesso - Tempo de Execução <N> s`.
- O campo **Retorno Integração** permanece sem mensagem de erro.
- Os anexos do processo continuam listados e abríveis depois da movimentação.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro imediatamente após a conclusão da Validação do Comprador, com o processo parado (evidência do ticket: `imagem (11).png`, com a mensagem de erro; o ticket não transcreve o texto — `<não documentado>`).

**Severidade:** Média *(bloqueia o fluxo na etapa central do novo desenho, sem risco financeiro direto)*

**Preparação de massa:** uma SC em Validação Orçamentária aprovada, que chegue à Validação do Comprador, e um comprador com matrícula na SY1. **Existe massa disponível hoje** — ver abaixo — mas ela pertence a terceiros e não deve ser movimentada; o executor precisa da sua própria.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri **Portal do Comprador → Validação Inicial** e encontrei **4 solicitações reais exatamente nesta etapa**, com **Etapa = "Validação do Comprador"** e **Status = "Pronto p/ Validação"**: `112902` (Cód. Filial **3517** – CASSI - CENTRAL DE ATENDIMENTO, Nº Solic ERP `000075`), `112848` (**5303** – CASSI SEDE, `001191`, "TESTE - ABERTURA DE RENOVAÇÃO DYAD"), `112845` (5303, `001190`) e `112832` (5303, `001188`, "SDCASSI-548"). No **Histórico do 112832** li a atividade atual literal: `Atividade atual: Validação do Comprador (Em progresso) — Responsável: Fernanda Silva Martins | Prazo: Desde 31/08/2026 18:00:00`, e a movimentação anterior `Geise Campos Silva Matias movimentou a atividade Gerência de Compras para a atividade Validação do Comprador`, com o comentário `Movimentado via Portal de Gerência de compras.`. Na SC confirmei o painel **Validação do Comprador** e os campos **Tipo de Compra \*** (`Pedido`/`Contrato`), **Validade da Cotação \***, **Resumo \***, **Dispensa Cotação? \***, **Justificativa da Dispensa Cotação \***. **A pré-condição é satisfazível: a etapa existe, está povoada e é alcançável.**
**Divergências encontradas:** (1) O painel existe em **três** variantes na mesma SC — **Validação do Comprador**, **Validação do Comprador (Definir Negociação)** e **Validação do Comprador (Análise pós Alçadas)** (atividades 119, 199 e 210) — citar "Validação do Comprador" sem dizer qual não identifica a etapa. (2) **Achado no fonte publicado:** o hook de validação de envio da atividade 119 está **vazio** (`sc_App_App.js`: `if (numState == 119) { }`), isto é, não há nenhuma crítica de front nessa etapa. (3) **Achado ligado à limitação de conta, mas que é código:** em `pc_main.js`, `getCurrentUserBuyer` faz `let i = String(a?.id)` — o optional chaining evita a exceção mas **não** o `undefined`, e `String(undefined)` produz a **string literal `"undefined"`**, que é enviada como `Y1_USER: "undefined"` ao dataset `dsProtheus_getCompradores_restGetAll`, resultando em `"Comprador não encontrado."`. O erro é engolido (`return null`) e o comprador fica em branco **sem nenhuma notificação ao usuário**. Além disso a busca do comprador é feita **sempre na filial fixa `5303`** (`BranchId:"5303"`), independentemente da filial do usuário — o que é um problema real para a solicitação `112902`, que é da filial **3517**.
**Dados/massa usados:** processos 112902, 112848, 112845, 112832 apenas **lidos**. **Nada movimentado, nada submetido.**

---

## Observações transversais do lote

**Defeitos ainda presentes no fonte publicado, com o ticket fechado como corrigido — digo com todas as letras:**

1. **Anexos da cotação (FSWTBC-3697, fechado "Feito" em 12/01/2026):** `cot_App_ViewHandler.handleReceptionProposals()` esconde `div#tableAnexoPropostas` para **todo** fornecedor que não seja o hardcoded `"85070508-0001"`.
2. **Cancelamento (FSWTBC-3716, fechado "Feito" em 26/02/2026):** o 404 é convertido em `[]`, que é truthy, e a tela anuncia `"...foi executado com sucesso!"` sem ter excluído nada; e a operação continua assimétrica — exclui a SC e o processo Fluig, **não** a cotação.
3. **Centralização (FSWTBC-3622, fechado "Feito" em 14/04/2026):** `centralizaSolicitacoes` abre **uma** SC centralizadora única; o desenho aprovado no ticket (uma SC por filial de entrega) **não está no front publicado desta base**.
4. **Rateio com 8 casas decimais — confirmado, segue lá:** `listDecimal = { rateio: 8, default: 6 }` nos formulários de SC e de Faturamento, e `padDecimal = { rateio: 8, money: 6, default: 2 }` no widget do Portal do Comprador, com valores monetários formatados em 6 casas (`R$ 1.234,560000`).
5. **`if (tipoInicioProcesso == 'manual' || 'automático')`** (`fat_App_ViewHandler.js`) — condição **sempre verdadeira** por precedência; o front nunca distingue medição manual de automática.
6. **`Y1_USER: "undefined"`** por `String(a?.id)` e busca de comprador presa à filial `5303`.
7. **Sem validação de Quantidade × Saldo a Medir** na medição; `saldoMedirQtd___N` é escrito e nunca lido.
8. **Hooks vazios** nas atividades de gravação da medição (114/115/105/117) e na Validação do Comprador (119); **alçada vazia não gera crítica** na atividade 94.

**Instabilidades de ambiente observadas (não são defeito):**
- `GET /java_portal_comprador/tbc/protheus/api/framework/v1/genericQuery` → **404**, deixando *Avaliação de Propostas* com "Nenhum dado encontrado".
- `GET /nps/api/v1/surveys` → **403** em todas as páginas (ruído do produto).
- `GET /portal/api/servlet/image/1/custom/logo_image.png` → **404** nos formulários.
- `GET /style-guide/css/fluig-style-guide.min.css` → **404** no Portal do Comprador.

**Achado de comportamento do Tracker:** com *Filtrar por:* em **Faturamento de Contratos**, **Solicitação de Compras** ou **Cotação de Produtos/Serviços** e nenhum filtro preenchido, o botão **Pesquisar Registro** **não dispara requisição alguma** e não renderiza tabela nem mensagem — verificado em três execuções independentes, com 25-30 s de espera cada. O botão é `<button data-filter="" class="btn btn-block btn-primary">` sem `onclick`. Isso limita o Tracker como superfície de conferência quando não se conhece um filtro específico.

## CT-FSWTBC-3732  (fluig · Concluído · SDCASSI-212)

**Título:** Conferir que o comprador não consegue alterar o valor estimado da SC, que permanece o que o solicitante declarou na abertura.

**Origem:** FSWTBC-3732 — pedido de controle: **bloquear o campo Valor Estimado** para que ele reflita o valor informado na abertura da SC. O estimado é a referência contra a qual a cotação (e o saving) é medida; deixá-lo editável depois da abertura destruiria a base de comparação. A decisão teve efeito colateral documentado: FSWTBC-3733 foi encerrado por causa dela.

**Módulo/Rota:** **Portal do Comprador** › **Validação Inicial** › expandir a linha da solicitação (detalhe dos itens).

**Pré-condições**
- Uma SC listada na **Validação Inicial** com pelo menos um item de produto/serviço e valor estimado preenchido na abertura.
- Conhecer o **Preço Unit. Estimado** e o **Vlr. Total Estimado** informados na abertura da SC, para comparar.
- **Bloqueio:** nenhum para o cenário principal. A grade da *Validação Inicial* lista solicitações reais e o detalhe do item abre para qualquer usuário do portal.

**Passos**
1. Abrir **Portal do Comprador** › **Validação Inicial**.
2. Localizar a SC pela coluna **Nº Solic** e expandir a linha (seta de detalhe à esquerda).
3. No painel de detalhe do item, localizar os campos **Preço Unit. Estimado** e **Vlr. Total Estimado**.
4. Tentar clicar em cada um deles e digitar um valor diferente.
5. Conferir que os valores exibidos batem com o que foi informado na abertura da SC (comparar com a seção *Identificação do(s) Produto(s)/Serviço(s)* do formulário da solicitação, campos **Preço Unit. Estimado** e **Vlr. Total Estimado**).
6. Conferir também os demais campos do detalhe: **Item**, **Produto/Serviço**, **Unidade de Medida**, **Conta Desp ADM**, **Conta Desp BAS**, **Conta Imobilizado**, **Grupo de Produto/Serviço**, **Data de Emissão**, **Data de Necessidade**, **Quantidade** e **Observação**.
7. Recarregar a tela e conferir que nada mudou.

**Resultado esperado**
- **Preço Unit. Estimado** e **Vlr. Total Estimado** estão **desabilitados**: não recebem foco, não aceitam digitação e não têm cursor de edição.
- Os valores exibidos são **idênticos** aos informados na abertura da SC.
- Os demais campos do detalhe do item também estão desabilitados nessa etapa — o painel é de conferência, não de edição.
- Nenhuma alteração é persistida; recarregar a tela mostra os mesmos valores.

**Resultado se o defeito reincidir**
- O campo de valor estimado volta a aceitar digitação na tela do comprador, e o estimado gravado passa a divergir do declarado na abertura da SC — quebrando a base de comparação do saving e, pelo vetor descrito em FSWTBC-3733, sobrescrevendo dados do formulário na gravação via API.

**Severidade:** Alta *(o estimado é a referência de comparação da cotação e do saving; alterado depois da abertura, invalida a medição de economia e a justificativa da despesa)*

**Preparação de massa:** uma SC com item de produto/serviço e valor estimado preenchido, visível na *Validação Inicial*. Em 04/09/2026 havia 24 solicitações reais na grade — massa suficiente, sem precisar criar nada.

**Verificado em tela:** SIM (total)
**O que foi verificado:** na **Validação Inicial**, expandindo a primeira linha da grade, o painel de detalhe do item apareceu com os rótulos **Item, Produto/Serviço, Unidade de Medida, Conta Desp ADM, Conta Desp BAS, Conta Imobilizado, Grupo de Produto/Serviço, Data de Emissão, Data de Necessidade, Quantidade, Preço Unit. Estimado, Vlr. Total Estimado, Observação**. Todos os campos correspondentes vieram com `disabled=true` — inclusive **`prcUniEst`** (*Preço Unit. Estimado*) e **`vlrTotEst`** (*Vlr. Total Estimado*), que são exatamente os campos do ticket. O JavaScript do portal confirma: o componente de itens declara `p-disabled: "true"` em todos eles.
**Divergências encontradas:** o ticket fala em **"campo Valor Estimado"**, no singular; em tela são **dois** campos com rótulos distintos — **Preço Unit. Estimado** e **Vlr. Total Estimado** — e os dois estão bloqueados. Registre-se ainda que o bloqueio foi **mais amplo** do que o pedido: o painel inteiro de detalhe do item está desabilitado, inclusive **Observação** — o que não estava no escopo do ticket e vale confirmar com o cliente se é intencional.
**Dados/massa usados:** solicitações reais já existentes na grade da Validação Inicial (leitura apenas, nada digitado, nada submetido).

---

## CT-FSWTBC-3733  (fluig · Concluído · SDCASSI-213)

**Título:** Conferir que as aprovações já dadas pelo Gestor e pelo Gestor Orçamentário continuam visíveis depois de o comprador atuar na solicitação.

**Origem:** FSWTBC-3733 — as etapas aprovadas do **Gestor** e do **Gestor Orçamentário** não carregavam, e o comprador não via quem já havia aprovado. Diagnóstico registrado: *"é um erro proveniente da atualização dos dados do formulário via API"* — quando a API reescrevia o formulário, as aprovações já registradas eram sobrescritas. Encerrado **sem correção própria**, por dependência do bloqueio pedido em FSWTBC-3732: com o campo bloqueado, a API deixa de atualizar aquele conjunto de campos.

**Módulo/Rota:** Formulário da **Solicitação de Compras**, seções **Validação do Gestor** (tabela *Gestor Imediato*) e **Validação do Item Orçamentário** (tabela *Item Orçamentário*) — alcançável por **Central de Tarefas** › a solicitação, ou pelo **Portal do Comprador** › ação **Ver Solicitação da Compra**.

**Pré-condições**
- Uma SC que **já passou** pela *Validação do Gestor* **e** pela *Validação Orçamentária*, com as duas aprovações registradas.
- A mesma SC precisa ter chegado à etapa do comprador, para que o portal atue sobre ela.
- **Bloqueio:** sim. É preciso comparar o formulário **antes e depois** da atuação do comprador, e a conta de QA não atua como comprador (`Comprador não encontrado`; com *Somente Minha Responsabilidade* a grade vem vazia). Não há credencial de gestor nem de gestor orçamentário para produzir as aprovações.

**Passos**
1. Abrir o formulário da SC (Central de Tarefas › solicitação, aba **Formulário**).
2. Rolar até a seção **Validação do Gestor** e anotar o conteúdo da linha: **Gestor Imediato**, **Aprovador**, **Data da Aprovação** e o indicador de aprovado.
3. Rolar até **Validação do Item Orçamentário** e anotar, para cada item: **Item Orçamentário**, **Total Estimado a Aprovar (R$)**, **Aprovador**, **Data da Aprovação** e o indicador de aprovado.
4. No **Portal do Comprador** › **Validação Inicial**, atuar sobre a mesma SC (aprovar, reprovar ou apenas centralizar).
5. Reabrir o formulário da SC.
6. Comparar as duas seções com o que foi anotado nos passos 2 e 3.
7. Conferir também o **Histórico** da solicitação, que deve listar as passagens por *Validação do Gestor* e *Validação Orçamentária* com os respectivos responsáveis.

**Resultado esperado**
- Depois da atuação do comprador, as seções **Validação do Gestor** e **Validação do Item Orçamentário** continuam **preenchidas e idênticas** ao que estavam antes: mesmo aprovador, mesma data/hora, mesmo indicador de aprovação, mesmo valor por item orçamentário.
- Nenhuma linha das duas tabelas fica em branco, é removida ou é substituída por valor do comprador.
- O **Histórico da solicitação** continua registrando as passagens pelas duas etapas de aprovação com os responsáveis originais.
- A gravação feita pelo portal atinge **apenas** os itens de produto da solicitação — não as tabelas de aprovação.

**Resultado se o defeito reincidir**
- Ao reabrir o formulário depois da atuação do comprador, as seções **Validação do Gestor** e **Validação do Item Orçamentário** aparecem **vazias ou incompletas**, e o comprador não consegue mais ver quem já aprovou nem quando.

**Severidade:** Alta *(perda do registro de quem aprovou e quando é perda de trilha de alçada: sem ela não se prova que a despesa foi autorizada, e o próprio comprador decide no escuro)*

**Preparação de massa:** uma SC que já tenha as duas aprovações registradas (**Gestor** e **Orçamentária**) e esteja na etapa do comprador, atribuída ao executor. Exige credencial de gestor, de gestor orçamentário e de comprador — nenhuma das três disponível. **Sem essa massa o caso não roda**: é o item mais dependente de perfis externos deste lote.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o formulário da Solicitação de Compras (documento **256831**) tem, confirmadas, as seções **Validação do Gestor** — tabela filha `tbManager`, coluna **Gestor Imediato**, com o indicador de aprovação `managerAprovadoValidacao` — e **Validação do Item Orçamentário** — tabela filha `tbItemOrcamentario`, coluna **Item Orçamentário**, com os campos de **Aprovador**, **Data da Aprovação**, responsável, e-mail, hora e **Total Estimado a Aprovar (R$)**. No JavaScript do Portal do Comprador, a leitura do formulário busca o **card pai ativo mais recente** da solicitação e devolve **apenas os campos do comprador** (tipo de compra, tipo de solicitação, contrato, validade, resumo, justificativa, dispensa, fornecedores); a gravação via API grava **apenas as linhas da tabela de produtos** da SC. As tabelas de aprovação são lidas, nunca reescritas por esse caminho — que é exatamente a causa apontada no diagnóstico do ticket. O ciclo antes/depois **não** foi executado.
**Divergências encontradas:** (a) o ticket diz **"Gestor Orçamentário"**; na tela a seção do formulário chama-se **"Validação do Item Orçamentário"** e a atividade do workflow, **"Validação Orçamentária"**. (b) A pendência do ticket continua válida: ele foi **encerrado por dependência** de FSWTBC-3732, **sem validação própria** de que as etapas de aprovação voltaram a aparecer — este caso de teste é justamente a validação que nunca foi feita.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3735  (fluig · Concluído · SDCASSI-215)

**Título:** Conferir que o número de tarefas anunciado ao comprador é igual ao número de solicitações que ele de fato pode tratar.

**Origem:** FSWTBC-3735 — dúvida do cliente: tendo **apenas 1 SC** sob sua responsabilidade, o marcador apontava **2**. Encerrado no mesmo dia, **sem comentário técnico** e sem dizer se o contador foi ajustado ou se a divergência foi explicada como esperada. A causa provável registrada na análise: o contador não aplicava o mesmo filtro de responsabilidade/estado que a listagem.

**Módulo/Rota:** **Central de Tarefas** (`/portal/p/1/pagecentraltask`, aba **Tarefas a concluir**) e **Portal do Comprador** › **Validação Inicial** (filtro **Somente Minha Responsabilidade**).

**Pré-condições**
- Conta com pelo menos uma tarefa pendente, e com número **conhecido** de solicitações sob sua responsabilidade.
- Ideal: uma conta que tenha acabado de concluir uma tarefa, porque é aí que o contador costuma descolar da lista.
- **Bloqueio:** parcial. O contador da **Central de Tarefas** é verificável com qualquer conta. Já o recorte "SCs sob minha responsabilidade" do Portal do Comprador não é exercitável com a conta de QA, que não resolve matrícula de comprador.

**Passos**
1. Abrir **Central de Tarefas** e clicar explicitamente na sub-aba **Tarefas a concluir** (a Central guarda a sub-aba por sessão no servidor — não confie no estado herdado).
2. Anotar o número exibido no marcador ao lado de **Tarefas a concluir**.
3. Contar os cartões de tarefa efetivamente listados abaixo.
4. Comparar os dois números.
5. Abrir **Portal do Comprador** › **Validação Inicial** e acionar **Buscar** sem filtro; anotar o total de linhas.
6. Marcar **Somente Minha Responsabilidade** e acionar **Buscar** de novo; anotar o total.
7. Conferir que o total do passo 6 é igual ao número de solicitações que a conta realmente pode tratar (as que aceitam a ação **Aprovar** sem recusa).
8. Concluir uma tarefa, recarregar a Central de Tarefas e repetir os passos 2 a 4.

**Resultado esperado**
- O marcador de **Tarefas a concluir** é **exatamente igual** ao número de cartões listados.
- Na *Validação Inicial*, o total com **Somente Minha Responsabilidade** marcado é igual ao número de solicitações cujo comprador é o usuário autenticado.
- Solicitação que não é do usuário é recusada com **"A solicitação não é sua responsabilidade!"**, e solicitação fora da etapa é recusada com **"Não é possível aprovar solicitações que ainda não estão na etapa de validação do comprador."** — ou seja, o que a lista mostra como acionável é o que o sistema aceita.
- Depois de concluir uma tarefa, o marcador **desce em 1** e continua igual à lista.

**Resultado se o defeito reincidir**
- O marcador aponta um número **maior** que a lista (no relato original: marcador **2** para **1** SC sob responsabilidade), levando o comprador a procurar uma tarefa que não existe.

**Severidade:** Baixa *(apresentação; não altera valor nem alçada — mas corrói a confiança no portal como fila de trabalho e faz perder tempo procurando tarefa inexistente)*

**Preparação de massa:** uma conta com número **conhecido e controlado** de tarefas pendentes — de preferência criadas pelo próprio executor com prefixo `QA` — para que a comparação contador × lista seja inequívoca. Para o recorte de comprador, é preciso uma conta com matrícula de comprador válida no Protheus e SCs atribuídas a ela.

**Verificado em tela:** PARCIAL
**O que foi verificado:** na **Central de Tarefas**, a sub-aba **Tarefas a concluir** exibiu o marcador **10** e a lista trouxe **exatamente 10** cartões (processos 112113, 112146, 112171, 112311, 112312, 112556, 112584, 112829, 112830, 113196) — **o contador bate com a lista hoje**. Na **Validação Inicial**, sem filtro a grade trouxe **24 linhas**; marcando **Somente Minha Responsabilidade** e acionando **Buscar**, o resultado foi **"Nenhum dado encontrado"** (0 de 24), consistente com a conta de QA não resolver matrícula de comprador. As duas mensagens de recusa citadas no resultado esperado são as literais do portal.
**Divergências encontradas:** **não existe hoje, em nenhuma tela do Portal do Comprador, um marcador numérico de "SCs sob minha responsabilidade"** — o único contador visível é o da **Central de Tarefas** da plataforma, e o recorte de responsabilidade no portal é feito por **filtro** (*Somente Minha Responsabilidade*), não por contador. Ou o marcador do ticket foi removido, ou ficava numa tela que não existe mais. Como o ticket foi encerrado sem comentário técnico, não é possível saber qual das duas — e este caso, tal como escrito, cobre a coerência contador × lista onde ela ainda é observável.
**Dados/massa usados:** tarefas e solicitações reais já existentes (apenas contagem e filtro; nada submetido, nenhuma tarefa concluída — o passo 8 não foi executado).

---

## CT-FSWTBC-3736  (fluig · Concluído · SDCASSI-217)

**Título:** Cancelar a proposta de um fornecedor na avaliação da cotação e conferir que ela realmente sai da lista de propostas acionáveis.

**Origem:** FSWTBC-3736 — a etapa permitiu **cancelar a proposta** e exibiu a mensagem de cancelamento, **mas a proposta continuou na lista**. É o padrão mais perigoso do conjunto: mensagem de sucesso dissociada do resultado real, com o usuário seguindo o fluxo acreditando que a ação ocorreu (mesmo padrão de FSWTBC-2332, 2836 e 3716). Encerrado em dois dias **sem causa raiz nem descrição de correção**.

**Módulo/Rota:** **Portal do Comprador** › **Avaliação de Propostas** › propostas do fornecedor › botão **Cancelar Proposta**.

**Pré-condições**
- Uma cotação com **proposta recebida** de fornecedor, atribuída ao comprador autenticado, com a proposta ainda ativa.
- **Bloqueio:** sim, duplo. (1) A conta de QA não resolve matrícula de comprador e as grades de cotação voltam vazias (404 em `genericQuery`). (2) **O briefing proíbe executar cancelamento em processo real** — este caso não pode ser reproduzido com massa de terceiros; exige proposta criada pelo próprio executor.

**Passos**
1. Abrir **Portal do Comprador** › **Avaliação de Propostas**.
2. Localizar a cotação (filtro **Nº do Processo Fluig**) e abrir as propostas do fornecedor.
3. Anotar o número da proposta e conferir que os botões **Validar Proposta**, **Negociar**, **Cancelar Proposta** e **Verificar Parecer Técnico** estão disponíveis para ela.
4. Acionar **Cancelar Proposta**.
5. No primeiro diálogo (**Confirmação** — *"Tem certeza que deseja cancelar a proposta?"*), escolher **Sim, cancelar!**.
6. No diálogo **Justificativa** (*"Qual a justificativa para cancelar a proposta?"*), deixar o campo **vazio** e acionar **Enviar**.
7. Repetir o passo 4 e, desta vez, preencher a justificativa (prefixo `QA`) e acionar **Enviar**.
8. Fechar e reabrir a cotação; conferir a lista de propostas.
9. Abrir o **Histórico da solicitação** da cotação no Fluig.

**Resultado esperado**
- O cancelamento pede **duas** confirmações e, em seguida, uma **justificativa**.
- Justificativa vazia é recusada com **"A justificativa para cancelar a proposta deve ser informada!"** e **nada é cancelado**.
- Com justificativa, a mensagem **"A proposta foi cancelada!"** só aparece **se a movimentação do processo tiver de fato ocorrido**; se a movimentação falhar, o portal exibe **"Ocorreu uma falha no cancelamento da proposta recebida!"** — nunca sucesso.
- Ao reabrir a cotação, a proposta cancelada **não é mais oferecida para ação** (os botões *Validar Proposta*, *Negociar* e *Cancelar Proposta* deixam de aparecer para ela) — o portal marca a proposta como cancelada e passa a ignorá-la.
- O **Histórico da solicitação** registra a movimentação com o comentário **"Cancelamento da proposta recebida! Justificativa: \<texto informado\>"**.

**Resultado se o defeito reincidir**
- A mensagem de cancelamento aparece, mas a proposta **continua na lista** e continua acionável — exatamente o relato do ticket. Pior: outras propostas ficam marcadas como canceladas sem terem sido, e não há registro de tratamento para elas.

**Severidade:** Alta *(mensagem de sucesso sem efeito real faz o comprador seguir o fluxo com uma proposta que ele acredita eliminada; a proposta pode acabar vencendo a cotação)*

**Preparação de massa:** uma cotação **criada pelo próprio executor**, com proposta de fornecedor recebida e ainda ativa. Exige credencial de fornecedor (para enviar a proposta) e matrícula de comprador. **Não use proposta pré-existente**: cancelar registro de terceiro é proibido e irreversível.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a rota **Avaliação de Propostas** abre; nenhuma proposta pôde ser aberta (grade vazia por 404 do ERP). No JavaScript do portal, o conjunto de botões da proposta é, com estes rótulos exatos: **Validar Proposta**, **Negociar**, **Cancelar Proposta**, **Verificar Parecer Técnico**, **Salvar Valores Atualizados**, **Visualizar Anexos** e **Visualizar Cotação/Negociação**. O fluxo de cancelamento está implementado com a dupla confirmação, a justificativa obrigatória e as mensagens literais citadas acima; a mensagem de sucesso é emitida **condicionada ao retorno da movimentação do processo**, e a proposta cancelada passa a carregar uma marca (`hd_cancelarProposta`) que a **exclui** do conjunto de propostas acionáveis ao recarregar. Nada foi cancelado.
**Divergências encontradas:** o ticket descreve o cancelamento como um clique único; hoje são **três interações** (confirmar → confirmar → justificar), e a **justificativa é obrigatória** — controle que o ticket não menciona. A pendência registrada continua aberta: **não há registro de tratamento das propostas que ficaram marcadas como canceladas sem terem sido** no período do defeito.
**Dados/massa usados:** nenhum — não submetido, nada cancelado.

---

## CT-FSWTBC-3737  (fluig · Concluído · SDCASSI-218)

**Título:** Devolver uma proposta para negociação com justificativa e conferir que o fornecedor é notificado e que a justificativa fica registrada para auditoria.

**Origem:** FSWTBC-3737 — dúvida do cliente: ao clicar em **Negociar** abre-se uma tela de justificativa; é disparado e-mail para o fornecedor? Onde fica salva essa justificativa? Foi respondida por escrito, e a resposta é o critério deste caso: **(1) sim**, o e-mail ao fornecedor é disparado automaticamente quando a solicitação é direcionada para a etapa de negociação; **(2)** a justificativa é gravada no campo de justificativa do processo de Negociação de Cotações de Produtos e Serviços, *"permanecendo disponível para consulta e auditoria dentro do fluxo do processo"*.

**Módulo/Rota:** **Portal do Comprador** › **Avaliação de Propostas** › propostas do fornecedor › botão **Negociar**; verificação no **Histórico da solicitação** e no formulário do processo de **Negociação de Cotação de Produtos/Serviços**.

**Pré-condições**
- Uma cotação com **proposta recebida** de fornecedor, atribuída ao comprador autenticado, e que seja a **proposta mais recente** daquele fornecedor.
- Acesso à caixa de e-mail do fornecedor (ou ao log de disparo) para confirmar a notificação.
- **Bloqueio:** sim. A conta de QA não resolve matrícula de comprador (grades vazias, 404 do ERP) e **não há credencial de fornecedor nem acesso à caixa postal do fornecedor** — a confirmação do e-mail depende de terceiro.

**Passos**
1. Abrir **Portal do Comprador** › **Avaliação de Propostas** e abrir as propostas do fornecedor.
2. Acionar **Negociar** na proposta.
3. No diálogo **Justificativa** (*"Qual a justificativa para enviar para negociação?"*), deixar o campo **vazio** e acionar **Enviar**.
4. Repetir o passo 2 e preencher a justificativa (prefixo `QA`, texto identificável), depois **Enviar**.
5. Abrir o **Histórico da solicitação** da cotação e localizar o comentário da movimentação.
6. Abrir o formulário do processo de **Negociação de Cotação de Produtos/Serviços** e localizar o campo de **Justificativa** da validação.
7. Confirmar com o fornecedor (ou na caixa de e-mail configurada) o recebimento da notificação de negociação.
8. Tentar acionar **Negociar** numa proposta que **não** seja a mais recente daquele fornecedor.

**Resultado esperado**
- **Negociar** abre um diálogo de **Justificativa** e a justificativa é **obrigatória**: enviar em branco é recusado com **"A justificativa para devolução da proposta da cotação para negociação deve ser informada!"** e nada é movimentado.
- Com justificativa preenchida, o portal confirma com **"A cotação foi enviada para o fornecedor!"** — e essa mensagem só aparece se a movimentação tiver ocorrido; caso contrário exibe **"Ocorreu uma falha na devolução da cotação para negociação!"**.
- O **e-mail ao fornecedor é disparado automaticamente** pelo direcionamento à etapa de negociação — o comprador não precisa acionar nada além do **Negociar**.
- A justificativa fica gravada em **dois lugares consultáveis**: o **campo de justificativa da validação** no formulário do processo de negociação, e o **comentário da movimentação** no **Histórico da solicitação** (*"Enviado para recepção de nova proposta de negociação."*).
- Proposta que não é a mais recente do fornecedor é recusada com **"Não é possível negociar essa proposta, pois existe uma proposta mais recente para esse fornecedor."**.

**Resultado se o defeito reincidir**
- Não é o caso de um sintoma prévio: o ticket é dúvida, não defeito. A reincidência a vigiar é **a justificativa deixar de ser gravada** (o campo do formulário de negociação vem vazio, ou o histórico não traz o comentário) ou **o e-mail deixar de ser disparado** com a proposta voltando ao fornecedor sem aviso — nos dois casos a auditoria da negociação fica sem lastro.

**Severidade:** Alta *(a justificativa de negociação é elemento auditável do processo de compras, e o disparo é comunicação externa automática a fornecedor — falhar em qualquer dos dois compromete a defensabilidade da negociação)*

**Preparação de massa:** uma cotação criada pelo próprio executor, com proposta de fornecedor recebida e ativa, mais um endereço de e-mail de fornecedor sob controle do time de teste, para poder confirmar o disparo sem depender do fornecedor real.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a rota **Avaliação de Propostas** abre e o botão **Negociar** consta do conjunto de ações da proposta; nenhuma proposta pôde ser aberta (grade vazia, 404 do ERP). No JavaScript do portal, o fluxo do **Negociar** está implementado exatamente como descrito: verificação de proposta mais recente com a mensagem literal citada, diálogo **Justificativa** *"Qual a justificativa para enviar para negociação?"*, recusa literal quando vazia, e movimentação do processo com a justificativa gravada **no campo de justificativa da validação do formulário** e, simultaneamente, como **comentário da movimentação**. O disparo do e-mail é feito pelo próprio workflow ao entrar na etapa de negociação — **não há passo manual de envio na tela do comprador**, o que confirma o "automático" da resposta ao cliente. O disparo do e-mail em si **não** foi observado.
**Divergências encontradas:** nenhuma quanto ao comportamento. Uma precisão de rótulo para quem for executar: a resposta do ticket diz que a justificativa é gravada "no campo de justificativa do processo de Negociação"; em tela ela aparece em **dois** lugares — o campo de justificativa da validação **e** o comentário da movimentação no **Histórico da solicitação**. Vale conferir os dois, porque o segundo é o que sobrevive a qualquer regravação do formulário.
**Dados/massa usados:** nenhum — não submetido, nenhuma proposta negociada.

---

## CT-FSWTBC-3738  (fluig · Concluído · SDCASSI-219)

**Título:** Eleger o fornecedor vencedor da cotação pelo ícone de coroa na tela de definição de vencedor.

**Origem:** FSWTBC-3738 — **não aparecia mais a coroa** para marcar o fornecedor vencedor. Regressão de interface no controle mais importante da tela: sem ele a etapa não pode ser concluída. Provável efeito colateral das várias alterações feitas na mesma tela naquela semana (doze tickets de homologação entre 12 e 14/01/2026). Corrigido no mesmo dia, **sem causa raiz registrada**.

**Módulo/Rota:** **Portal do Comprador** › **Definir Vencedor Cotação** (`#/propostaVencedora`) › cotação › tabela de fornecedores do item, coluna **Definir Vencedor**.

**Pré-condições**
- Uma cotação com **propostas de mais de um fornecedor** para o mesmo item, atribuída ao comprador autenticado, ainda sem vencedor definido.
- **Bloqueio:** sim. A conta de QA não resolve matrícula de comprador e a grade de *Definir Vencedor Cotação* volta **"Nenhum dado encontrado"** (404 em `genericQuery`); nenhuma cotação pôde ser aberta.

**Passos**
1. Abrir **Portal do Comprador** e conferir, no menu **Acesso Rápido**, a entrada **Definir Vencedor Cotação** com o ícone de **coroa**.
2. Abrir **Definir Vencedor Cotação**.
3. Localizar a cotação (filtro **Nº do Processo Fluig**) e abri-la.
4. Para cada item, conferir a tabela de fornecedores e a coluna **Definir Vencedor**.
5. Passar o mouse sobre o ícone de coroa de uma linha e conferir o tooltip **Vencedor**.
6. Clicar na coroa do fornecedor escolhido.
7. Informar a quantidade quando solicitado e conferir as críticas de quantidade.
8. Conferir que a coroa fica destacada apenas para o fornecedor eleito.
9. Clicar novamente na coroa do mesmo fornecedor e conferir que a marcação é desfeita.

**Resultado esperado**
- O menu **Acesso Rápido** apresenta **Definir Vencedor Cotação** com o ícone de coroa.
- A tabela de fornecedores de cada item traz a coluna **Definir Vencedor** com o **ícone de coroa clicável** por linha, e o tooltip do ícone é **Vencedor**.
- Clicar na coroa marca aquele fornecedor como vencedor do item e o destaque visual muda apenas para ele.
- A quantidade definida é criticada: não numérica é recusada com **"A quantidade para a proposta da cotação deve ser numérica!"**; em branco, com **"A quantidade para a proposta da cotação deve ser informada!"**; acima da quantidade da cotação, com **"A quantidade para a proposta da cotação não pode ser maior que \<quantidade\>!"**; e a soma entre fornecedores acima do disponível é recusada com **"A quantidade total definida (\<X\>) excede a quantidade disponível na cotação (\<Y\>). Por favor, ajuste a quantidade."**.
- Quando a quantidade é recusada, a **marcação de vencedor é desfeita** — não fica um vencedor eleito com quantidade inválida.
- Clicar de novo na coroa do mesmo fornecedor desfaz a marcação.

**Resultado se o defeito reincidir**
- A coluna de definição de vencedor aparece **sem o ícone de coroa** (ou a coluna some), o comprador não tem como eleger o fornecedor e a etapa de cotação fica **impossível de concluir** pela tela.

**Severidade:** Alta *(é o controle que conclui a cotação; sem ele o processo de compra para na etapa, e o defeito só foi percebido pelo cliente em homologação)*

**Preparação de massa:** uma cotação com **pelo menos dois fornecedores** com proposta para o mesmo item, criada pelo executor, ainda sem vencedor definido. Exige credencial de fornecedor e matrícula de comprador.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a rota **Definir Vencedor Cotação** (`#/propostaVencedora`) existe, abre e traz a grade com as colunas **Status, Núm. Cotação, Filial, Número da SC, Nº. Proc. Fluig, Tip. Documento, Parecer Téc., Em Alçada, Dt. Validade, Valor Final**, além dos botões **Filtrar**, **Gerenciador de colunas** e **Carregar mais resultados**. O menu **Acesso Rápido** lista a entrada **Definir Vencedor Cotação** com o ícone **`an an-crown`** (coroa). No JavaScript do portal, a coluna da tabela de fornecedores está declarada como propriedade `winnerIcon`, rótulo **"Definir Vencedor"**, tipo ícone, ícone **`an an-crown`** e **tooltip "Vencedor"**, com a ação de definir vencedor ligada a ela — ou seja, **a coroa está de volta e é o gancho da eleição**. As mensagens de crítica de quantidade citadas são as literais do portal. Nenhuma cotação pôde ser aberta, então **o ícone não foi visto renderizado na grade de fornecedores**.
**Divergências encontradas:** o ícone **não tem nome acessível** — é um ícone de fonte (`an an-crown`) sem `aria-label`; o gancho estável para automação e para instrução ao analista é o **tooltip/`title` "Vencedor"** e o rótulo da coluna **"Definir Vencedor"**, não o texto do link. Note também que "coroa" é o nome informal do cliente: **em tela o rótulo da coluna é "Definir Vencedor"**.
**Dados/massa usados:** nenhum — não submetido, nenhum vencedor definido.

---

## CT-FSWTBC-3739  (ambos · Concluído · SDCASSI-216)

**Título:** Cancelar uma solicitação de compras a partir da Avaliação de Propostas e ser conduzido por confirmação, justificativa obrigatória e mensagem de retorno.

**Origem:** FSWTBC-3739 — na etapa de Avaliação de Propostas o botão *Cancelar Solicitação* podia
ser clicado, não fazia nada e não avisava. A entrega foi maior que o pedido: confirmação para ações
críticas, justificativa obrigatória e mensagem de retorno, integrando Protheus e Fluig.

**Módulo/Rota:** Fluig → **Portal do Comprador** (`/portal/p/1/portal-do-comprador`) → menu
**Avaliação de Propostas** (rota interna `/avaliacaoPropostas`) → menu de ações da linha da cotação
→ **Cancelar Solicitação** (ícone `an an-file-x`).

**Pré-condições**
- Conta com **matrícula de comprador** cadastrada no Protheus (o Portal resolve o comprador por ela).
- Uma cotação listada na Avaliação de Propostas, **criada pelo próprio executor**, ainda cancelável,
  com `C8_NUMSC` (Nº da SC) e `C1_XFLUIG` (nº do processo Fluig) preenchidos.
- **Bloqueio:** a conta de QA (`TOTVS-FS`) não resolve matrícula de comprador (§5-C), então a grade
  da Avaliação de Propostas não lista nada para ela. Além disso, **executar o cancelamento é
  proibido pelo §2** — o caso é escrito para ser executado por um comprador em massa própria.

**Passos**
1. Abrir **Portal do Comprador** e escolher **Avaliação de Propostas** (o mesmo item existe no
   painel *Acesso Rápido* e no menu lateral).
2. Localizar a linha da cotação da SC própria e abrir o menu de ações da linha. Conferir que ele
   traz **Alterar Data de Validade**, **Analisar Cotação**, **Ver Itens** e **Cancelar Solicitação**.
3. Clicar em **Cancelar Solicitação**.
4. No primeiro modal, conferir o título **"Confirmação"** e a pergunta **"Tem certeza que deseja
   cancelar a solicitação de compras?"**, com os botões **"Sim, cancelar!"** e **"Não"**.
5. Clicar em **"Não"** — e observar a mensagem de aborto.
6. Repetir o passo 3 e clicar em **"Sim, cancelar!"**.
7. No segundo modal, conferir o título **"Justificativa"** e a pergunta **"Qual a justificativa para
   cancelar a solicitação de compras?"**, com campo de entrada e botões **"Enviar"** e **"Fechar"**.
8. Deixar o campo **vazio** (ou só com espaços) e clicar em **Enviar**.
9. Repetir e informar uma justificativa iniciada por `QA `, clicando em **Enviar**.

**Resultado esperado**
- O menu de ações da linha exibe **Cancelar Solicitação** com o ícone `an an-file-x`.
- Passo 4: o modal **"Confirmação"** aparece **antes** de qualquer chamada ao ERP — nada é cancelado
  enquanto ele estiver aberto.
- Passo 5: nada é cancelado e é exibida a informação **"O cancelamento da solicitação de compras
  {Nº da SC} foi abortado!"**.
- Passo 7: o modal **"Justificativa"** só aparece depois do "Sim, cancelar!".
- Passo 8: é exibido o erro **"A justificativa para cancelar a proposta deve ser informada!"** e
  **nada é cancelado** — nem no ERP nem no Fluig.
- Passo 9, quando o ERP aceita: sucesso **"O cancelamento da solicitação de compras {Nº da SC} no
  ERP Protheus foi executado com sucesso!"**, seguido de **"O cancelamento do processo {nº Fluig} da
  solicitação de compras {Nº da SC} no Fluig foi executado com sucesso!"**.
- Passo 9, quando o ERP recusa: erro **"Não foi possível executar o cancelamento da solicitação de
  compras {Nº da SC}!"** e **o processo no Fluig permanece aberto** (não pode ser cancelado se o ERP
  não cancelou).
- No Fluig, o histórico do processo cancelado passa a trazer o comentário
  **`Processo cancelado por "{nome do usuário}" - Justificativa: "{texto informado}"`**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Clicar em **Cancelar Solicitação** não produz efeito nenhum: sem modal, sem *toast*, sem mudança
  de status — "o sistema deixa eu clicar em Cancelar Solicitação" e nada acontece.

**Severidade:** Alta

**Preparação de massa:** uma cotação em Avaliação de Propostas pertencente ao executor, com SC e
processo Fluig vinculados, e uma conta de comprador cadastrada no Protheus. Para exercitar o ramo de
erro do ERP é preciso um caso em que a exclusão seja recusada — o que **não** se deve forçar em
registro de terceiro.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmei em tela que o Portal do Fornecedor/Comprador abre e que a
conta de QA não resolve comprador. No **fonte publicado** (`pc_main.js`, 844.628 b) confirmei: (a) a
tabela de rotas `[{path:"avaliacaoPropostas", component: oh}, ...]`, e que o componente `oh` é o
mesmo reaproveitado por `/propostaVencedora` com `definindoVencedor=true`; (b) que é o componente
`oh` que declara a ação `{action:this.cancelQuotes, icon:"an an-file-x", label:"Cancelar Solicitação"}`
— ou seja, **a ação está mesmo na Avaliação de Propostas, como o ticket diz**; (c) toda a cadeia de
`deletePurchases`, com as **sete mensagens literais** transcritas acima.
**Divergências encontradas:**
1. **Achado de risco, ainda vivo no fonte publicado** — a decisão de sucesso é uma **guarda truthy
   que engole o caso-limite**: `else if (yield this.handlePurchasesDelet({...}))`. E
   `handlePurchasesDelet` faz, no `catch`, `if (i.status === 404) return []`. Em JavaScript **`[]` é
   truthy**. Logo, um **404 do dataset de exclusão** cai no ramo de SUCESSO: o usuário lê
   *"…no ERP Protheus foi executado com sucesso!"* e, em seguida, **o processo no Fluig é cancelado
   mesmo sem o ERP ter cancelado nada**. O retorno também não é inspecionado (compare com
   `confirmEdition`, que lê `n.status` e escolhe entre `poNotification.success` e `.error`).
2. O erro de justificativa vazia diz **"para cancelar a proposta"** enquanto os outros seis textos
   dizem "solicitação de compras" — vocabulário inconsistente na mesma sequência de modais.
3. Depois do erro de justificativa vazia **o fluxo termina**: não há nova tentativa, o usuário
   precisa reabrir o menu e recomeçar.
4. O seletor do componente é `app-avalicao-propostas` — grafia errada ("avalicao") no fonte.
5. `ngOnInit` do componente carrega a grade com **`codFilial:"5303"` fixo em código**.
**Dados/massa usados:** nenhum — nada submetido, nada cancelado.

---

## CT-FSWTBC-3747  (fluig · Concluído · SDCASSI-222)

**Título:** Ativar a seleção de fornecedores na validação do comprador sem escolher nenhum e conferir que o processo não avança.

**Origem:** FSWTBC-3747 — ao acionar **"Selecionar Fornecedor"** e **não selecionar nenhum**, o sistema permitia seguir com o processo. O cliente pediu trava para não avançar quando a opção estivesse ativada. Mesmo padrão de validação ausente de FSWTBC-3031 (rateio abaixo de 100% passando): o Fluig deixa passar e o problema aparece adiante — no caso, a cotação seguiria **sem participantes**. Corrigido no mesmo dia, com print da trava implementada anexado ao ticket.

**Módulo/Rota:** **Portal do Comprador** › **Validação Inicial** › ação **Aprovar** da solicitação › modal de aprovação, switcher **Selecionar Fornecedores** + campo **Fornecedores**.

**Pré-condições**
- Uma SC na etapa **Validação do Comprador**, atribuída ao comprador autenticado (o portal recusa solicitação de terceiros com *"A solicitação não é sua responsabilidade!"*).
- Fornecedores disponíveis na lista para a filial/grupo de produto da solicitação.
- **Bloqueio:** sim. A conta de QA não resolve matrícula de comprador; com **Somente Minha Responsabilidade** marcado a grade vem vazia, então o modal de aprovação não abre para nenhuma linha.

**Passos**
1. Abrir **Portal do Comprador** › **Validação Inicial**.
2. Localizar a SC pela coluna **Nº Solic** e acionar a ação **Aprovar** da linha.
3. No modal de aprovação, ligar o switcher **Selecionar Fornecedores** (posição **Sim**) e conferir que o campo **Fornecedores** é habilitado.
4. **Sem escolher nenhum fornecedor**, preencher os demais campos obrigatórios (**Tipo de Compra**, **Data Validade** e **Resumo**) e acionar **Aprovar**.
5. Escolher **um** fornecedor e acionar **Aprovar** de novo.
6. Escolher **três** fornecedores e acionar **Aprovar**.
7. Repetir os passos 3 a 5 com o switcher **Dispensa Cotação** ligado.
8. Desligar o switcher **Selecionar Fornecedores** e conferir que a lista de fornecedores é **limpa**.
9. Tentar informar mais de 75 fornecedores.
10. Sair do modal **sem confirmar** nos cenários em que a aprovação seria aceita.

**Resultado esperado**
- Com **Selecionar Fornecedores** ligado e **nenhum** fornecedor escolhido, a aprovação é **recusada** e o processo **não avança**.
- Sem dispensa de cotação, o mínimo é **três**: menos que isso é recusado com **"É necessário informar ao menos 3 fornecedores quando a flag estiver ativa."**.
- Com **Dispensa Cotação** ligada, o mínimo é **um**: nenhum é recusado com **"É necessário informar ao menos 1 fornecedor quando a flag de dispensa de cotação estiver ativa."**.
- Desligar o switcher **limpa** a lista de fornecedores selecionados, evitando que uma escolha antiga siga escondida no formulário.
- Acima de 75 fornecedores, recusa com **"A lista de fornecedores excede o limite máximo de 75 Fornecedores. Por favor, reduza a lista e tente novamente."**.
- Em todos os casos recusados, **nada é gravado e o processo permanece na mesma etapa**.

**Resultado se o defeito reincidir**
- A aprovação é aceita com o switcher **Selecionar Fornecedores** ligado e **zero fornecedores**, e a cotação segue adiante **sem participantes** — o problema só aparece na etapa seguinte, quando não há a quem cotar.

**Severidade:** Alta *(cotação sem participantes avança a alçada e consome prazo; e a regra de mínimo de 3 fornecedores é controle de concorrência, não detalhe de tela)*

**Preparação de massa:** uma SC na etapa *Validação do Comprador* atribuída ao executor, com filial e grupo de produto que tenham **pelo menos 3 fornecedores** disponíveis na lista — necessário para exercitar os limites de 0, 1 e 3. Exige matrícula de comprador válida.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a rota **Validação Inicial** abre e lista 24 solicitações reais; o modal de aprovação **não** pôde ser aberto (nenhuma linha é responsabilidade da conta de QA). No JavaScript do portal, o switcher **"Selecionar Fornecedores"** (`swFornecedores`, rótulos **Sim**/**Não**) habilita o campo **Fornecedores**, e a validação da aprovação está implementada com as **quatro** mensagens literais citadas acima; desligar o switcher dispara a limpeza da lista de fornecedores. A validação roda **antes** da movimentação do processo e, quando falha, o modal permanece aberto sem gravar.
**Divergências encontradas:** o ticket fala em **"Selecionar Fornecedor"**, no singular; o rótulo em tela é **"Selecionar Fornecedores"**, no plural, e é um **switcher Sim/Não**, não um botão. Mais importante: **a trava implementada é mais rígida do que o pedido** — o cliente pediu apenas que não avançasse com zero, e a regra hoje exige **mínimo de 3 fornecedores** (ou **1**, se a dispensa de cotação estiver ativa) e **máximo de 75**. Esses limites não constam do ticket e precisam entrar no roteiro de quem for testar, ou o teste vai reprovar por engano ao usar 1 ou 2 fornecedores.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3750  (ambos · Concluído · SDCASSI-31)

**Título:** Cancelar as cotações vinculadas a uma SC quando o cancelamento NÃO é possível, e receber o motivo em vez de um erro na gravação do log.

**Origem:** FSWTBC-3750 — erro ao executar o cancelamento de cotações vinculadas à SC. A causa: na
**geração do log**, depois das tratativas do cancelamento, enviava-se um JSON a um parâmetro que
esperava um caractere — e isso só ocorria **quando a exclusão não era possível**. O tratamento do
erro quebrava ao registrar o próprio erro, mascarando a causa original.

**Módulo/Rota:** Fluig → **Portal do Comprador** → **Avaliação de Propostas** → ação **Cancelar
Solicitação**. Verificação: **Logs Protheus** → aba **Erros CV8**.

**Pré-condições**
- Conta de comprador que enxergue a cotação.
- Uma SC **cujas cotações não possam ser canceladas** (já processadas / com pedido gerado) — é o
  cenário exato do defeito.
- **Bloqueio:** (a) sem matrícula de comprador para a conta de QA; (b) o cenário exige tentar
  cancelar, e o §2 proíbe cancelar registro de terceiro; (c) a API citada no ticket é do Protheus,
  sem credencial; (d) a aba **Erros CV8** não responde hoje (`genericQuery` 404).

**Passos**
1. Abrir **Avaliação de Propostas** e localizar a SC cujas cotações não são canceláveis.
2. Acionar **Cancelar Solicitação**, confirmar em **"Sim, cancelar!"** e informar uma justificativa
   `QA ...`.
3. Ler a mensagem devolvida na tela.
4. Abrir **Logs Protheus** → aba **Erros CV8**, filtrar por **Id Fluig** = nº do processo (ou por
   **Texto** = trecho da mensagem) e clicar em **Consultar**.
5. Na linha do erro, ler as colunas **Mensagem**, **Detalhes**, **Processo**, **Sub Processo** e
   **Tipo Ocor.**
6. Voltar ao Fluig e conferir o **status do processo** da SC.

**Resultado esperado**
- Passo 3: a tela informa **"Não foi possível executar o cancelamento da solicitação de compras
  {Nº da SC}!"** — uma recusa explícita, não um sucesso e não uma tela travada.
- Passo 4/5: o log **CV8 é gravado sem quebrar**, com **Mensagem** legível e **Detalhes** contendo o
  retorno da API (o botão de JSON deve dizer "Ver JSON", não "JSON invalido").
- Passo 6: **o processo da SC no Fluig permanece aberto** — não pode ser cancelado no Fluig quando o
  ERP recusou.
- Nenhuma tela fica em branco e nenhuma exceção aparece no console do navegador.

**Resultado se o defeito reincidir**
- O cancelamento falha com erro técnico genérico na chamada
  `DELETE {base_url}/api/v2/fluig/compras/cotacao/solicitacaoCompra/{numSC}` (o anexo do ticket é o
  arquivo `Excluir_Cotacoes-1768873188881.json`, com a chamada e o retorno), **sem** que o motivo
  real da impossibilidade chegue ao usuário — porque a rotina de log quebra ao receber um JSON onde
  esperava um caractere.

**Severidade:** Alta *(um cancelamento que erra ao registrar o erro pode deixar Fluig e Protheus em
estados divergentes)*

**Preparação de massa:** uma SC com cotações **não canceláveis**, criada pelo executor. Não existe
como produzir esse estado sem submeter e avançar uma SC própria — e forçá-lo em registro alheio é
vedado.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a cadeia de cancelamento inteira no fonte publicado (`pc_main.js`) e a
existência da aba **Erros CV8** com as colunas *Mensagem*, *Detalhes*, *Processo*, *Tipo Ocor.*,
*Sub Processo*, *ID Movtos* e os filtros *Id Fluig*, *Filial*, *Data inicial/final* e *Texto*
(placeholder "Mensagem, detalhe ou processo").
**Divergências encontradas:**
1. **O front do Fluig não chama a API citada no ticket.** O ticket fala em
   `DELETE .../api/v2/fluig/compras/cotacao/solicitacaoCompra/{numSC}`; o Portal do Comprador chama,
   por **GET**, o dataset **`dsProtheus_delSolicitacoesComprasNFC`** com
   `filterFields=CorporateId,{...},BranchId,{C8_FILIAL},C1_NUM,{C8_NUMSC}` (+`offset`/`limit`). O
   DELETE existe do lado do ERP; do lado do Fluig o ponto de teste é o dataset. Um caso escrito com
   a URL do ticket não exercita o caminho de hoje. *(Para comparação: `blockQuote` usa
   `PUT .../api/v2/fluig/compras/cotacao/bloqueiacotacao/{n}` e `gravaVencedor` usa
   `POST .../api/v2/fluig/compras/cotacao/gravaVencedor/{n}` — a família v2 está lá, só não para o
   cancelamento.)*
2. **O mesmo achado do CT-3739 vale aqui, e é mais grave neste cenário:** como
   `handlePurchasesDelet` devolve `[]` no HTTP 404 e `[]` é truthy, **o caminho de erro pode ser
   lido como sucesso** — exatamente o caminho que este ticket existe para proteger.
3. A aba **Erros CV8** não retorna hoje (404 do `genericQuery`) — ambiente.
**Dados/massa usados:** nenhum — nenhum cancelamento executado.

---

## CT-FSWTBC-3767  (fluig · Concluído · SDCASSI-227)

**Título:** Conferir que texto com acentuação escrito pelo comprador aparece corretamente na etapa de negociação.

**Origem:** FSWTBC-3767 — **texto com acentuação não carregou corretamente** na etapa de negociação. É o terceiro problema de acentuação do projeto (com FSWTBC-3152, cadastro de fornecedor com "ç" quebrando a integração, e o registro de que *"a CASSI está configurada para não ter caracteres especiais e acentuação"*). Aqui o defeito é de **exibição**, não de gravação: o texto foi salvo com acento e apareceu corrompido. Corrigido no mesmo dia, com print do resultado anexado.

**Módulo/Rota:** **Portal do Comprador** › **Avaliação de Propostas** › proposta do fornecedor › campo de observação/justificativa do comprador; e **Definir Vencedor Cotação**, no mesmo card de proposta.

**Pré-condições**
- Uma cotação com proposta recebida, atribuída ao comprador autenticado.
- Um texto de justificativa/observação contendo acentuação e cedilha — por exemplo: `QA - Correção de preço unitário: negociação de serviço técnico, avaliação à vista, ação não onerosa`.
- **Bloqueio:** sim. A conta de QA não resolve matrícula de comprador e as grades de cotação voltam vazias (404 em `genericQuery`); nenhuma proposta pôde ser aberta para gravar e reler o texto.

**Passos**
1. Abrir **Portal do Comprador** › **Avaliação de Propostas** e abrir as propostas do fornecedor.
2. Alterar o **Valor Unitário** de um item para disparar a exigência de justificativa.
3. No campo **Justificar Alteração de Valor \***, digitar o texto acentuado da pré-condição, incluindo **á é í ó ú ã õ ç â ê ô à**.
4. Acionar **Salvar Valores Atualizados**.
5. Recarregar a tela e reabrir a mesma proposta; conferir o texto exibido.
6. Acionar **Negociar** e informar uma justificativa também acentuada.
7. Abrir a mesma cotação em **Definir Vencedor Cotação** e conferir o texto do comprador exibido no card da proposta.
8. Abrir o **Histórico da solicitação** e conferir o comentário da movimentação.
9. Exportar os dados da proposta (botão **Exportar**) e conferir a acentuação no arquivo gerado.
10. Repetir o passo 3 com um texto contendo **tags HTML** (ex.: `<b>teste</b>`).

**Resultado esperado**
- O texto acentuado é exibido **exatamente como digitado** em todas as telas onde reaparece: card da proposta em *Avaliação de Propostas*, card em *Definir Vencedor Cotação*, comentário do **Histórico da solicitação** e arquivo exportado.
- **Não** aparecem sequências corrompidas do tipo `Ã§`, `Ã£`, `Ã©`, `Â` — o portal detecta texto lido como Latin-1 e o **redecodifica como UTF-8** antes de exibir.
- Texto **sem** acentuação passa intacto, sem qualquer alteração.
- Eventual marcação HTML embutida no texto é **removida** na exibição, e não renderizada nem exibida como código.
- A observação enviada pelo **fornecedor** também é exibida corretamente ao lado da do comprador.

**Resultado se o defeito reincidir**
- O texto gravado com acento reaparece corrompido na etapa de negociação (`negociação` exibido como `negociaÃ§Ã£o`), tornando a justificativa ilegível justamente no elemento que serve de auditoria da negociação.

**Severidade:** Média *(é apresentação, não perda de dado — o texto continua gravado corretamente; mas a justificativa ilegível compromete a leitura de um elemento auditável e a apresentação ao fornecedor)*

**Preparação de massa:** uma cotação com proposta de fornecedor recebida, criada pelo executor, onde seja possível gravar e reler um texto acentuado. Exige credencial de fornecedor e matrícula de comprador.

**Verificado em tela:** PARCIAL
**O que foi verificado:** as rotas **Avaliação de Propostas** e **Definir Vencedor Cotação** abrem; nenhuma proposta pôde ser aberta (grade vazia, 404 do ERP). No JavaScript do portal existe um tratamento de codificação aplicado **especificamente ao texto de observação/justificativa do comprador** da proposta — o mesmo campo em que a justificativa da negociação é gravada. Ele faz duas coisas, nesta ordem: **remove marcação HTML** do texto e, quando detecta a assinatura de bytes UTF-8 lidos como Latin-1 (os prefixos `Â`/`Ã`/`Å`/`Æ` seguidos de byte de continuação), **redecodifica o texto como UTF-8**; se o texto não tiver essa assinatura, é devolvido intacto. É exatamente a correção deste ticket. O mesmo tratamento é aplicado às mensagens de erro devolvidas pelo ERP. A gravação e releitura de texto acentuado **não** foram exercitadas.
**Divergências encontradas:** o ticket localiza o problema *"na etapa de negociação"*; o campo tratado é o de **observação/justificativa do comprador da proposta**, que aparece em **mais de uma tela** (*Avaliação de Propostas*, *Definir Vencedor Cotação* e a exportação) — o roteiro acima cobre as três, porque a correção vale para todas e uma regressão pode reaparecer em só uma delas. Registre-se também que **não há padronização de encoding entre as telas do processo**: a correção é pontual, aplicada campo a campo, o que é a pendência que o próprio ticket deixou registrada.
**Dados/massa usados:** nenhum — não submetido.

## CT-FSWTBC-3778  (fluig · Concluído · SDCASSI-31)

**Título:** Filtrar o Controle de Cotações por um número de cotação e confirmar que a grade passa a exibir somente aquela cotação.

**Origem:** FSWTBC-3778 — *"Cotação 000035 não está sendo filtrada"*: o filtro por número de cotação na tela de avaliação/controle não restringia a lista. Ticket sem descrição além do título (§5-D do briefing).

**Módulo/Rota:** **Portal do Comprador** › **Controle De Cotações** (`/portal/p/1/portal-do-comprador#/controleCotacao`) e **Avaliação de Propostas** (`#/avaliacaoPropostas`) — painel lateral **Filtrar**.

**Pré-condições**
- Perfil de comprador com matrícula resolvida no ERP (`Y1_USER`).
- Pelo menos **duas** cotações visíveis na grade, sendo uma delas a de número conhecido a filtrar.
- Integração com o Protheus respondendo — a grade é alimentada por `genericQuery` do `java_portal_comprador`.
- **Bloqueio:** **sim** — hoje a grade está vazia para a conta de QA por dois motivos somados: a conta não resolve matrícula de comprador (limitação §5-C) e o endpoint `genericQuery` do Portal do Comprador está respondendo **404** (instabilidade de ambiente). Sem ao menos duas cotações na grade, o filtro não é demonstrável.

**Passos**
1. Abrir **Portal do Comprador › Controle De Cotações**.
2. Confirmar que a grade traz mais de uma cotação (colunas **Status**, **Núm. Cotação**, **Filial**, **Número da SC**, **Nº. Proc. Fluig**, **Tip. Documento**, **Parecer Téc.**, **Em Alçada**, **Dt. Validade**, **Valor Final**), e anotar o total de linhas.
3. Clicar em **Filtrar**.
4. No campo **Nº Cotação ERP**, informar o número **exatamente como aparece na coluna Núm. Cotação** — inclusive os zeros à esquerda, ex.: `000035`.
5. Acionar **Filtrar**.
6. Conferir a grade.
7. Acionar **Limpar Filtros** e conferir que a lista volta ao total original.
8. Repetir o passo 4 informando o mesmo número **sem os zeros à esquerda** (`35`) e observar o resultado.

**Resultado esperado**
- Após filtrar por `000035`, a grade exibe **somente** linhas cuja coluna **Núm. Cotação** seja `000035`.
- Nenhuma outra cotação permanece listada.
- **Limpar Filtros** restaura a listagem completa.
- Ao informar `35` (sem zeros), o comportamento é **determinístico e comunicado**: ou a tela normaliza o valor e encontra a cotação, ou devolve lista vazia com aviso — o que **não** pode acontecer é a grade voltar **completa, como se nenhum filtro tivesse sido aplicado**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Ao filtrar pela cotação `000035`, a grade continua exibindo todas as cotações — o filtro é ignorado silenciosamente, sem mensagem.

**Severidade:** Média *(não corrompe dado, mas inviabiliza a operação do comprador em base com muitas cotações; e o modo de falha "silencioso" faz o usuário confiar numa lista errada)*

**Preparação de massa:** duas ou mais cotações vigentes visíveis para o comprador autenticado, uma delas com número conhecido. Não é criável pela conta de QA (a criação de cotação depende de SC aprovada e de comprador com matrícula no ERP).

**Verificado em tela:** PARCIAL
**O que foi verificado:** as rotas `#/controleCotacao` e `#/avaliacaoPropostas` abrem, com o painel **Filtrar** e a grade de colunas **Status | Núm. Cotação | Filial | Número da SC | Nº. Proc. Fluig | Tip. Documento | Parecer Téc. | Em Alçada | Dt. Validade | Valor Final** (lidas em tela e confirmadas no código, método `getQuotesColumns()`). Ambas exibiram **"Nenhum dado encontrado"**, com `getQuotesDhuERP`/`getEvalQuotesDhuERP` retornando **404**. Li o código que monta o filtro: os campos do formulário são `cotacao`, `filial`/`codFilial`, `numSc`, `tipoDocumento`, `parecerTec`, `alcada`, `dataValidade` e `processoFluig`, com botões **Filtrar** e **Limpar Filtros**.
**Divergências encontradas:** **duas, ambas relevantes para escrever o passo certo.** (1) O filtro por cotação é montado como **igualdade exata** — `SC8.C8_NUM = '<valor digitado>'`, sem `LIKE` e **sem normalização de zeros à esquerda**. Portanto digitar `35` em vez de `000035` não encontra a cotação: é preciso informar o número no formato do ERP. (2) Antes de montar a cláusula, o código aplica o sanitizador `/^[a-zA-Z0-9_#]+$/` a cada valor; **se o valor não casar (espaço, hífen, barra ou acento), a cláusula é descartada em silêncio** e a consulta vai ao ERP **sem aquele filtro** — a grade volta completa e o usuário lê isso como "não está filtrando". Este é, muito provavelmente, o mecanismo do defeito original, e é o passo 8 do caso.
**Dados/massa usados:** nenhum — não submetido; a grade estava vazia.

---

## CT-FSWTBC-3797  (fluig · Concluído · SDCASSI-239)

**Título:** Conferir, na Avaliação de Propostas, que o percentual de Saving de cada proposta bate com a economia real sobre a primeira proposta — e que saving negativo aparece em vermelho.

**Origem:** FSWTBC-3797 — na SC 9327 o saving deveria ser **33,11%** e o sistema apresentou **32,89%**. Na validação de 04/02 o cliente pediu ainda que **saving negativo** fosse exibido em **vermelho**; atendido no mesmo dia.

**Módulo/Rota:** **Portal do Comprador** › **Avaliação de Propostas** (`#/avaliacaoPropostas`) — cartão de cada proposta, campo **Saving**. O mesmo valor aparece na planilha gerada por **Exportar Dados**, na coluna **Saving** da aba de propostas.

**Pré-condições**
- Uma cotação com **duas ou mais propostas** do mesmo ou de fornecedores distintos, sendo a proposta `01` a de referência.
- Itens com valores que permitam conferência manual (quantidade, preço unitário, IPI, desconto e frete conhecidos).
- **Bloqueio:** **sim** — a Avaliação de Propostas está vazia hoje (conta sem matrícula de comprador + `genericQuery` em 404). Não há cotação com múltiplas propostas disponível para a conta de QA.

**Passos**
1. Abrir **Portal do Comprador › Avaliação de Propostas**.
2. Localizar uma cotação com mais de uma proposta e expandir o cartão da cotação.
3. Anotar, para a **Proposta Nº 01**, os campos **Valor Total** e **Valor do Frete Total**, e a lista de itens (**Quantidade**, **Valor Unitário**, **Val. Total Item**).
4. Anotar os mesmos campos para a **Proposta Nº 02**.
5. Ler o campo **Saving** exibido no cartão da Proposta Nº 02.
6. Calcular à mão: `Saving % = (Total da Proposta 01 − Total da Proposta 02) ÷ Total da Proposta 01 × 100`, onde o total de cada proposta é a soma, item a item, de `Preço × Quantidade` (ou `Valor Total do item`, quando não houver quantidade auditada) **menos IPI**, **menos desconto**, **mais frete**.
7. Comparar o valor calculado com o exibido, com **duas casas decimais**.
8. Localizar (ou provocar, em massa de teste) uma proposta cujo total seja **maior** que o da proposta 01 e observar a cor do percentual.
9. Acionar **Exportar Dados** e conferir que a coluna **Saving** da planilha traz o mesmo percentual da tela.

**Resultado esperado**
- O **Saving** da Proposta Nº 01 é sempre **`0 %`** (ela é a referência).
- O Saving das demais propostas é igual ao cálculo manual do passo 6, com duas casas decimais e sufixo ` %`.
- Saving **negativo** (proposta mais cara que a de referência) é exibido em **vermelho**; saving **positivo** em **verde**; o valor neutro/referência em **azul**.
- O valor da planilha exportada é idêntico ao da tela.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Divergência entre o percentual exibido e a conferência manual — no relato original, **32,89%** exibido contra **33,11%** esperado na SC 9327 (evidência `Screenshot_1.png`).
- Saving negativo exibido na mesma cor dos demais, sem sinalização.

**Severidade:** Média *(o saving é indicador gerencial de desempenho de compras, auditável e reportado; 0,22 p.p. importa por precisão, não por magnitude — mas o valor não decide a compra por si)*

**Preparação de massa:** uma cotação com pelo menos duas propostas, itens com IPI, desconto e frete preenchidos (para exercitar todas as parcelas da fórmula), e uma proposta deliberadamente mais cara que a 01 (para o teste de cor). Criável apenas por comprador com matrícula no ERP e fornecedores respondendo à cotação — fora do alcance da conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a rota `#/avaliacaoPropostas` abre com a grade correta, mas **sem dados** (404 no ERP). O cálculo, porém, foi lido **diretamente do código servido** (`handlerSavingAccounting` / `handlerSumProposals`, no bundle do `wg_portalCompradores`): a proposta `"01"` retorna literalmente `"0 %"`; para as demais, `saving = (total01 − totalN) ÷ total01 × 100`, formatado com `toFixed(2)` e sufixo ` %`; se `total01` for zero, o resultado é `0` (quando totalN também é zero) ou `-100`. O total de cada proposta soma, por item: `C8_PRECO × C8_XQTAUDI` quando há quantidade auditada, senão `C8_TOTAL`; **subtrai** `C8_VALIPI` e `C8_VLDESC`; e **soma** `C8_VALFRE`. As cores estão no CSS do próprio widget: `.saving-negative` → `#c0392b` (vermelho), `.saving-positive` → `#27ae60` (verde), `.saving-default` → `#0019fd` (azul), todos com `font-weight:600`. Também confirmei o rótulo **Saving** entre os campos do cartão e na exportação (cabeçalho `Data Proposta, Validade, Valor do Frete Total, Saving, Tipo de Frete, Cond. Pgto, Valor Total`).
**Divergências encontradas:** o ticket trata "saving" como um número único, mas a fórmula em vigor tem **duas convenções que precisam constar do roteiro para a conferência manual bater**: (a) a **proposta 01 é a referência fixa** — não é a menor proposta nem a média; (b) o **frete entra somando** no total comparado, enquanto **IPI e desconto entram subtraindo**. Uma conferência manual que ignore qualquer uma das duas vai divergir do sistema sem que haja defeito. Recomendo publicar esta fórmula junto ao indicador — é exatamente a pendência apontada no ticket ("sem registro da fórmula corrigida").
**Dados/massa usados:** nenhum — não submetido; grade vazia.

---

## CT-FSWTBC-3824  (fluig · Concluído · SDCASSI-76)

**Título:** Navegar para a frente e para trás entre as páginas do Controle de Cotações e confirmar que voltar traz de volta exatamente os registros da página anterior.

**Origem:** FSWTBC-3824 — a paginação do controle de cotações **não funcionava ao retroceder**: avançar página funcionava, voltar não, obrigando o comprador a refazer a busca. Corrigido em três dias; ticket sem descrição da correção.

**Módulo/Rota:** **Portal do Comprador** › **Controle De Cotações** (`/portal/p/1/portal-do-comprador#/controleCotacao`) — rodapé de paginação.

**Pré-condições**
- Grade com registros suficientes para gerar **ao menos três páginas**.
- Comprador com matrícula resolvida no ERP.
- **Bloqueio:** **sim** — hoje a grade traz "Nenhum dado encontrado" (`genericQuery` em 404 + conta sem matrícula de comprador), e o rodapé mostra **"Página 1 de 0"**. Sem massa, a navegação entre páginas não é exercitável.

**Passos**
1. Abrir **Portal do Comprador › Controle De Cotações**.
2. Conferir o rodapé: deve exibir **"Página 1 de N"** e quatro controles de navegação — **primeira** (`«`), **anterior** (`‹`), **próxima** (`›`) e **última** (`»`).
3. Na página 1, anotar o número da **primeira** e da **última** cotação exibidas (coluna **Núm. Cotação**).
4. Confirmar que, na página 1, os controles **primeira** e **anterior** estão **desabilitados**.
5. Clicar em **próxima** (`›`) e anotar os registros da página 2.
6. Clicar em **próxima** de novo, chegando à página 3.
7. Clicar em **anterior** (`‹`).
8. Comparar a lista exibida com o que foi anotado na página 2.
9. Clicar em **anterior** de novo e comparar com a página 1.
10. Clicar em **última** (`»`) e depois em **primeira** (`«`).
11. Repetir os passos 5 a 9 **com um filtro ativo** (por exemplo, uma **Filial**), para confirmar que o filtro é preservado ao retroceder.

**Resultado esperado**
- O indicador **"Página X de N"** acompanha cada navegação.
- Retroceder da página 3 para a 2 exibe **exatamente** os mesmos registros vistos antes na página 2, na mesma ordem.
- Retroceder da 2 para a 1 exibe os registros originais da página 1.
- Na página 1, **primeira** e **anterior** ficam desabilitados; na última, **próxima** e **última** ficam desabilitados.
- O filtro aplicado é mantido em todas as navegações — retroceder **não** obriga a refazer a busca.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Ao clicar em **anterior**, a grade não retorna à página anterior: fica na mesma página, vem vazia, ou perde o filtro — e a única saída é refazer a busca do zero.

**Severidade:** Média *(bloqueia a operação de conferência do comprador em base grande; não corrompe dado)*

**Preparação de massa:** cotações suficientes para três páginas na grade do comprador autenticado (o tamanho de página em vigor determina o mínimo). Não criável pela conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** abri `#/controleCotacao` e inspecionei o rodapé. O componente **existe e está renderizado**: `<app-paginator>` com o texto **"Página 1 de 0"** e quatro ícones — `an-arrow-line-left`, `an-arrow-left`, `an-arrow-right` e `an-arrow-line-right`. **Os dois primeiros (primeira e anterior) estão com a classe `disable` aplicada**, ou seja, o estado de desabilitação na primeira página está correto hoje. No código do componente, `previousPageEmit()` só decrementa quando `page > 1` e chama `updateDisabledState()` antes de emitir — a guarda de retrocesso existe e é estado-consciente. Não pude exercitar a navegação real por ausência de dados.
**Divergências encontradas:** **três.** (1) O rodapé exibe **"Página 1 de 0"** quando não há registros — combinação incoerente (página 1 de zero páginas); o correto seria "Página 0 de 0" ou suprimir o paginador. (2) Os quatro controles são elementos `<i>` **sem `title`, sem texto e sem `aria-label`** — não têm nome acessível e não são alcançáveis por teclado; o roteiro tem de descrevê-los por posição/ícone, e um leitor de tela não os anuncia. É a mesma classe de problema já registrada nos ícones da coluna "Ação" do Acompanhamento de Contratos. (3) **A paginação não é a mesma nas quatro telas do portal:** *Controle De Cotações* usa o paginador de páginas numeradas, enquanto **Avaliação de Propostas** e **Definir Vencedor Cotação** usam o botão **"Carregar mais resultados"** (rolagem incremental, **sem** qualquer forma de retroceder). Se o ticket original se referia a uma dessas duas, o caso muda de natureza — não há para onde voltar por desenho. Vale confirmar com o cliente a qual tela o relato se referia.
**Dados/massa usados:** nenhum — não submetido; grade vazia.

---

## CT-FSWTBC-3842  (fluig · Concluído · SDCASSI-76)

**Título:** Alterar a data de validade de uma cotação pelo Controle de Cotações e confirmar que a nova data é gravada e passa a aparecer na grade.

**Origem:** FSWTBC-3842 — *"não está permitindo alterar a data de validade da cotação"*: ao selecionar a nova data e confirmar, o registro não era atualizado. É requisito explícito do Portal do Comprador desde o épico ("bloquear novos participantes, **alterar data de validade** e notificar fornecedores") e mais um caso do padrão recorrente de "ação que confirma sem efeito".

**Módulo/Rota:** **Portal do Comprador** › **Controle De Cotações** (`#/controleCotacao`) › ação **Alterar Data de Validade** da linha da cotação → modal **"Alterar Data de Validade da Cotação &lt;nº&gt; - &lt;filial&gt;"**.

**Pré-condições**
- Uma cotação **em aberto**, ainda não encerrada, visível na grade do comprador.
- Comprador com matrícula resolvida no ERP.
- **Bloqueio:** **sim** — a grade do Controle de Cotações está vazia hoje (404 no `genericQuery` + conta sem matrícula de comprador), então não há linha sobre a qual acionar a ação. Além disso, alterar a validade de uma cotação **pré-existente** seria alteração de registro de terceiro, vedada pelo briefing — o caso exige cotação criada pelo próprio executor.

**Passos**
1. Abrir **Portal do Comprador › Controle De Cotações**.
2. Localizar a cotação de teste e anotar o valor atual da coluna **Dt. Validade**.
3. Abrir o menu de ações da linha e escolher **Alterar Data de Validade** (ícone de calendário).
4. Conferir o modal: título **"Alterar Data de Validade da Cotação &lt;nº&gt; - &lt;filial&gt;"**, a pergunta **"Qual a validade desejada para a cotação?"** e o campo obrigatório **Data de Validade**, com o texto de apoio *"Informe a nova data de validade da cotação"*.
5. Tentar confirmar **com o campo vazio** e observar a crítica de obrigatoriedade. **Não prosseguir.**
6. Tentar informar uma data **anterior a hoje** e observar o comportamento do seletor.
7. Informar uma data futura válida e clicar em **Confirmar**.
8. Ler a notificação exibida.
9. Conferir a coluna **Dt. Validade** da linha, **sem** recarregar a página manualmente.
10. Recarregar a tela e conferir de novo, para confirmar que a alteração persistiu no ERP e não só na tela.

**Resultado esperado**
- O modal abre com a data de validade **atual** já preenchida no campo (ou com a data de hoje, se a validade atual já estiver vencida).
- O campo **Data de Validade** é obrigatório: confirmar vazio não prossegue.
- O seletor **não permite escolher data anterior a hoje**.
- Ao confirmar, aparece uma **notificação de sucesso** com a mensagem devolvida pelo serviço.
- A grade é **recarregada automaticamente** e a coluna **Dt. Validade** passa a exibir a nova data.
- Após recarregar a página, a nova data **permanece** — a alteração foi gravada no ERP, não apenas na tela.
- Em caso de falha, aparece **notificação de erro** com a mensagem do serviço — nunca sucesso silencioso.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Seleciona-se a nova data, confirma-se, e o registro **não é atualizado**: a coluna **Dt. Validade** continua com a data antiga (evidência `image-20260204-133507.png`). Fornecedores seguem impedidos de enviar proposta porque a validade não foi prorrogada.

**Severidade:** Média *(trava a negociação — sem prorrogar a validade os fornecedores não conseguem propor; sem efeito financeiro direto, mas é requisito contratado que não entregava)*

**Preparação de massa:** uma cotação em aberto **criada pelo próprio executor**, com data de validade próxima do vencimento. Não use cotação de produção: a alteração de validade em cotação de terceiros muda as regras de uma concorrência em curso.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a rota `#/controleCotacao` abre com a grade e o painel **Filtrar**, mas sem dados. No código servido do widget confirmei todo o caminho da funcionalidade: a lista de ações por linha é **`Alterar Data de Validade`** (ícone `an-calendar`), **`Analisar Cotação`**, **`Ver Itens`** e **`Cancelar Solicitação`**. A ação chama `editQuotes()`, que abre o modal com título **"Alterar Data de Validade da Cotação "** concatenado a `<C8_NUM> - <C8_FILIAL>`, exibindo o texto **"Qual a validade desejada para a cotação?"** e o campo `newDateQuote`, com `p-label="Data de Validade"`, `p-placeholder="Informe a nova data de validade da cotação"`, `p-required="true"` e **`p-min-date`** fixado na data de hoje. O campo é pré-carregado com a validade atual da cotação quando ela ainda não venceu, e com a data de hoje quando já venceu. Ao clicar em **Confirmar**, o widget chama `quotesService.editQuote()`, que faz **`PUT {protheus}/api/v2/fluig/compras/cotacao/vencimento/{nºCotação}`** com corpo `{"expirationdate": "<aaaa-MM-dd>"}` e cabeçalho `tenantId: "01,<filial>"`; se o retorno for positivo emite **notificação de sucesso** e **recarrega a grade a partir da página 1**, senão emite **notificação de erro** com a mensagem do serviço. Nenhuma alteração foi executada.
**Divergências encontradas:** nenhuma de rótulo — a ação existe com o nome que o ticket usa. Duas observações úteis ao roteiro: (1) o rótulo do **campo** dentro do modal é **"Data de Validade"**, enquanto a **coluna** da grade é **"Dt. Validade"** e o **filtro** lateral é **"Data Validade"** — três grafias para o mesmo dado, na mesma tela; (2) o passo 6 do roteiro (data anterior a hoje) é coberto por desenho pelo `p-min-date`, então o esperado ali é o seletor **impedir** a escolha, não criticar depois.
**Dados/massa usados:** nenhum — não submetido; nenhuma cotação foi alterada.

---

## CT-FSWTBC-3883  (fluig · Concluído · SDCASSI-258)

**Título:** Localizar uma cotação centralizada no Controle de Cotações e confirmar que ela aparece em uma única linha, com as SCs agrupadas.

**Origem:** FSWTBC-3883 — a cotação, **quando centralizada**, aparecia **várias vezes** na tela de Controle de Cotação. Como uma cotação centralizada agrupa N solicitações (uma por filial de entrega), a listagem produzia uma linha por SC em vez de uma por cotação, poluindo a tela e sugerindo cotações duplicadas. Corrigido em dois dias e validado pelo cliente em 13/02/2026.

**Módulo/Rota:** **Portal do Comprador** › **Controle De Cotações** (`#/controleCotacao`).

**Pré-condições**
- Uma cotação **centralizada**, isto é, gerada a partir de solicitações de **mais de uma filial** agrupadas pela ação *Centralizar Solicitações*.
- Comprador com matrícula resolvida no ERP.
- **Bloqueio:** **sim** — grade vazia hoje (404 no `genericQuery` + conta sem matrícula de comprador). Não há cotação centralizada disponível para a conta de QA.

**Passos**
1. Abrir **Portal do Comprador › Controle De Cotações**.
2. Localizar a cotação centralizada de teste pelo número, usando o filtro **Nº Cotação ERP** (informando o número no formato do ERP, com zeros à esquerda).
3. Contar quantas linhas a grade exibe para esse número de cotação.
4. Ler a coluna **Número da SC** dessa linha.
5. Abrir a ação **Analisar Cotação** e conferir quantas SCs de origem estão vinculadas.
6. Comparar a quantidade de SCs vinculadas com a quantidade de linhas da grade.
7. Repetir a conferência **sem filtro**, rolando a lista, para garantir que a mesma cotação não reaparece em outra posição.

**Resultado esperado**
- A cotação centralizada aparece em **exatamente uma linha** da grade.
- O cabeçalho da linha identifica a cotação como **"Cotação Nº: &lt;número&gt; - &lt;filial&gt;"**.
- A coluna **Número da SC** apresenta **todas** as SCs agrupadas naquela cotação, **sem repetição**, concatenadas.
- O número de linhas da grade para aquela cotação é **1**, independentemente de quantas SCs ela agrupa.
- A mesma cotação não reaparece em outro ponto da listagem.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A mesma cotação aparece repetida — uma linha por SC agrupada — dando a impressão de cotações duplicadas (evidência `Screenshot_8.png`).

**Severidade:** Baixa *(apresentação: polui a tela e induz o comprador a erro de leitura, mas não altera dado nem trava o fluxo)*

**Preparação de massa:** uma cotação centralizada agrupando **três ou mais** SCs de filiais diferentes — o defeito não é visível com uma só SC. Depende de comprador com matrícula no ERP executando *Centralizar Solicitações* na Validação Inicial.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a rota abre com a grade correta e vazia. **O agrupamento está implementado e é verificável no código servido:** ao montar cada linha da lista, o widget define `c1_num` como **`[...new Set( <SCs da cotação>.map(k => k.C8_NUMSC).filter(Boolean) )].join(" - ")`** — ou seja, os números de SC são **deduplicados por `Set`** e concatenados com `" - "` **dentro de uma única linha**, cujo nome é montado como **`Cotação Nº: ${dhu_num} - ${dhu_filial}`**. É exatamente a correção que o ticket descreve sem detalhar: uma linha por cotação, N SCs no campo. Confirmei também os rótulos ligados à centralização no mesmo widget: **Centralizar Solicitações**, **Cód Filial Centralizadora**, **Nome da Filial Centralizadora** e **Justificativa da Centralização**.
**Divergências encontradas:** nenhuma de rótulo. Registro uma observação para quem for automatizar: como a deduplicação é feita **no front**, por `Set` sobre o resultado do ERP, a assertion correta é **"uma linha por cotação"** (contagem de linhas), e **não** "a consulta retorna registros distintos" — o backend pode continuar devolvendo repetição sem que o defeito reapareça em tela. Uma regressão aqui só é detectável contando linhas da grade.
**Dados/massa usados:** nenhum — não submetido; grade vazia.

---

## CT-FSWTBC-3884  (fluig · Concluído · SDCASSI-259)

**Título:** Abrir uma SC criada por centralização e confirmar que cada item mostra a SC de origem e a filial de entrega.

**Origem:** FSWTBC-3884 — pedido do cliente: quando a SC nasce da **centralização**, trazer o **número da SC original** e a **filial**, para identificar as aprovações já realizadas. É o ticket que efetivamente implementou o pedido (FSWTBC-3880 foi fechado como duplicado deste). Validado pelo cliente no mesmo dia da entrega.

**Módulo/Rota:** **Portal do Comprador** › **Validação Inicial** (`#/validacaoInicial`) › **Centralizar Solicitações**; e, no formulário da **Solicitação de Compras** centralizadora, a grade de produtos das solicitações centralizadas.

**Pré-condições**
- Duas ou mais SCs de **filiais diferentes**, na etapa de Validação Inicial, elegíveis para centralização.
- Comprador com acesso à Validação Inicial (a conta de QA tem — a tela carrega).
- **Bloqueio:** parcial. A tela de Validação Inicial **funciona** e lista solicitações reais, mas **concluir uma centralização é ação de escrita sobre SCs de terceiros** (as 24 solicitações listadas são de outros solicitantes) — vedado pelo briefing. O caso só é executável de ponta a ponta com SCs criadas pelo próprio executor.

**Passos**
1. Abrir **Portal do Comprador › Validação Inicial**.
2. Conferir a grade: **Nº Solic**, **Solicitante**, **Data Solicitação**, **Cod. Filial**, **Filial**, **Data Emissão**, **Nº Solic ERP**, **Justificativa**, **Etapa**, **Status**.
3. Acionar **Centralizar Solicitações** **sem selecionar nada** e observar a crítica. **Fechar sem prosseguir.**
4. Selecionar duas ou mais solicitações de **filiais diferentes** (criadas pelo executor) e acionar **Centralizar Solicitações**.
5. No formulário de centralização, preencher **Cód Filial Centralizadora**, **Nome da Filial Centralizadora**, **Justificativa da Centralização**, **Tipo de Compra**, **Validade da Cotação** e **Resumo**.
6. Confirmar a centralização.
7. Abrir a **SC centralizadora** resultante.
8. Localizar a grade de produtos das solicitações centralizadas e conferir as colunas exibidas para cada item.
9. Conferir que cada item traz a SC de origem e a filial de entrega corretas, batendo com as SCs selecionadas no passo 4.
10. Percorrer as etapas de aprovação e confirmar que essa identificação continua visível ao aprovador.

**Resultado esperado**
- Acionar **Centralizar Solicitações** sem seleção exibe crítica e **não** centraliza nada.
- A grade de itens da SC centralizadora traz, por item, as colunas **Nº Processo**, **SC Origem**, **Item**, **Produto/Serviço**, **Grupo Prod./Serv.**, **Fil. Entrega**, **Dt. Necessidade** e **Qtd.**.
- **SC Origem** apresenta o número da solicitação original de cada item — não o número da SC centralizadora.
- **Fil. Entrega** apresenta o código e o nome da filial de origem daquele item.
- Itens vindos de SCs diferentes exibem **SC Origem** e **Fil. Entrega** diferentes, permitindo relacionar cada aprovação já realizada.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A SC centralizadora exibe os itens **sem** identificar de qual SC e de qual filial cada um veio (evidência `Screenshot_9.png`), impedindo o aprovador de relacionar as aprovações anteriores.

**Severidade:** Média *(rastreabilidade de aprovação: sem a origem, o aprovador da SC centralizadora não consegue relacionar o que já foi aprovado em cada filial — não corrompe dado, mas degrada o controle)*

**Preparação de massa:** duas ou mais SCs **do próprio executor**, em filiais diferentes, ambas na etapa de Validação Inicial. Não use as solicitações de terceiros que a tela lista.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **esta é a tela que melhor carregou nesta sessão.** `#/validacaoInicial` abriu com **24 solicitações reais** e as colunas **Nº Solic | Solicitante | Data Solicitação | Cod. Filial | Filial | Data Emissão | Nº Solic ERP | Justificativa | Etapa | Status** (ex.: `113193` · *Geise Campos Silva Matias* · `03/09/2026` · `5303` · *CASSI SEDE* · `001284` · *Validação do Gestor* · *Em Andamento*; `113025` · `3517` · *CASSI - CENTRAL DE ATENDIMENTO* · `000076` · *Validação do Comprador* · *Pronto p/ Validação*). Filtros: **Filial**, **Produto**, **Grupo de Produto**, **Centro de Custo**, **Justificativa** e o switcher **Somente Minha Responsabilidade**, com botão **Buscar**. **Exercitei a validação com segurança:** cliquei em **Centralizar Solicitações** **sem selecionar nenhuma linha** e o sistema exibiu o diálogo **"Selecione as solicitações desejadas:"** com a mensagem *"Não foi identificado nenhuma solicitação selecionada, por favor selecione para que possa ser centralizada!"* e botão **OK** — nada foi centralizado. No código do formulário da SC confirmei a implementação do pedido do ticket: `handleMountObjDTableCenterSC` monta a tabela `#targetProductsCenter` com os cabeçalhos exatos **"Nº Processo"**, **"SC Origem"**, **"Item"**, **"Produto/Serviço"**, **"Grupo Prod./Serv."**, **"Fil. Entrega"**, **"Dt. Necessidade"** e **"Qtd."**, sendo `Fil. Entrega` montada como `${codFilial} - ${zoomNomeFilial}`. E no widget do portal, o campo de origem de cada item é resolvido como **`numSolCompra: c1_scori || c1_num`** — isto é, **prioriza a SC de origem** (`c1_scori`) e só cai na SC corrente quando não há origem. Também confirmei os rótulos do formulário de centralização: **Cód Filial Centralizadora**, **Nome da Filial Centralizadora**, **Justificativa da Centralização**, **Selecionar Fornecedores**, **Fornecedores**, **Tipo de Compra**, **Validade da Cotação**, **Resumo**, **Dispensa Cotação** e **Justificativa para Dispensa da Cotação**.
**Divergências encontradas:** o ticket pede "o nº da SC original e a Filial"; na tela os rótulos entregues são **"SC Origem"** e **"Fil. Entrega"** — semanticamente corretos, mas com nomes diferentes dos do ticket, e é por eles que o roteiro deve procurar. Observação adicional: o campo cai para o número da SC corrente quando `c1_scori` vem vazio, então uma SC **não** centralizada exibirá o próprio número em "SC Origem" — comportamento esperado, mas que pode ser lido como defeito por quem não conhece a regra. Registro ainda um erro de concordância na crítica de centralização: *"Não foi identificado nenhuma solicitação selecionada"*.
**Dados/massa usados:** nenhum — nenhuma solicitação foi selecionada nem centralizada; apenas o clique no botão sem seleção, que só produz a crítica.

---

## CT-FSWTBC-3891  (fluig · Concluído · SDCASSI-260)

**Título:** Abrir a etapa de negociação de uma cotação e confirmar que os fornecedores participantes são listados para seleção.

**Origem:** FSWTBC-3891 — a cotação **9468** não trouxe os fornecedores para seleção na etapa de negociação, impedindo o comprador de escolher com quem negociar. Terceira ocorrência da mesma família (com FSWTBC-2430 e FSWTBC-3666), corrigida em um dia, sem comentário técnico nem causa raiz.

**Módulo/Rota:** **Portal do Comprador** › **Avaliação de Propostas** (`#/avaliacaoPropostas`) → ação **Negociar** da proposta; e o formulário **Negociação de Produtos/Serviços**, painel **Informações do Fornecedor**, na atividade `50 - Processo de Negociação` do `wf_solicitacao_compras`.

**Pré-condições**
- Uma cotação **encerrada** com propostas recebidas de **mais de um fornecedor**.
- A cotação precisa ter processo de negociação apto a ser iniciado.
- Comprador com matrícula resolvida no ERP.
- **Bloqueio:** **sim** — a Avaliação de Propostas está vazia hoje (404 no `genericQuery` + conta sem matrícula de comprador). Sem propostas listadas, a ação **Negociar** não fica disponível.

**Passos**
1. Abrir **Portal do Comprador › Avaliação de Propostas**.
2. Localizar a cotação de teste e expandir seus cartões de proposta.
3. Conferir que cada cartão traz **Fornecedor**, **Data Proposta**, **Validade**, **Valor do Frete Total**, **Saving**, **Tipo Frete**, **Cond. Pgto** e **Valor Total**.
4. Contar quantos fornecedores enviaram proposta para aquela cotação.
5. Acionar a ação **Negociar**.
6. Na tela de negociação, conferir a **lista de fornecedores disponíveis para seleção**.
7. Comparar essa lista com a contagem do passo 4.
8. Abrir a solicitação correspondente na atividade `50 - Processo de Negociação` e conferir o painel **Informações do Fornecedor** do formulário **Negociação de Produtos/Serviços**.
9. Conferir também o painel **Validação de Proposta** do mesmo formulário.

**Resultado esperado**
- **Todos** os fornecedores que enviaram proposta para a cotação aparecem na seleção da negociação.
- A quantidade de fornecedores selecionáveis é igual à quantidade de propostas recebidas na cotação.
- Cada fornecedor exibe razão social e CNPJ, permitindo identificá-lo sem ambiguidade.
- O painel **Informações do Fornecedor** do formulário de negociação vem preenchido — não em branco.
- Se, por regra, algum fornecedor for excluído da negociação, o motivo é visível — a lista **não** pode simplesmente vir vazia ou incompleta sem explicação.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A etapa de negociação abre **sem fornecedor algum** para seleção (relato original: cotação 9468, evidência `Screenshot_10.png`) — o comprador não consegue escolher com quem negociar e o processo trava.

**Severidade:** Alta *(trava o fluxo na negociação após a cotação já ter sido concluída, e é a terceira reincidência de falha de carga de fornecedores em etapas diferentes, sem diagnóstico consolidado)*

**Preparação de massa:** uma cotação encerrada com propostas de **três** fornecedores distintos (número mínimo da regra de concorrência), apta a seguir para negociação. Depende de comprador com matrícula no ERP e de fornecedores respondendo à cotação — fora do alcance da conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a rota `#/avaliacaoPropostas` abre com a grade e o painel de filtros, mas sem dados (404 no ERP). No código do widget confirmei que a lista de fornecedores de cada cotação é carregada por **`supplierService.getSupplierByQuote({ numCot, numFilial, limit: "1000", page: "1" })`** e exposta no campo `FORNECEDORES` de cada linha, e que as ações por proposta são governadas pelos flags `controleValidar`, **`controleNegociar`**, `controleCancelar` e `controleParecer` — ou seja, **o botão Negociar só aparece quando a proposta é a última do fornecedor e existe processo Fluig associado**. Também confirmei os rótulos do cartão de proposta (**Data Proposta**, **Validade**, **Valor do Frete Total**, **Saving**, **Tipo Frete**, **Cond. Pgto**, **Valor Total**) e, no formulário servido do processo de negociação (`Negociação de Produtos/Serviços - Form`), os painéis **Identificação do Processo / Solicitante**, **Identificação do(s) Produto(s)/Serviço(s)**, **Informações do Fornecedor**, **Validação de Proposta** e **Verificar Erro**.
**Divergências encontradas:** **uma, importante para reproduzir.** O ticket diz que "a cotação não trouxe os fornecedores para seleção na etapa de negociação", como se fosse uma tela só. Na verdade há **duas superfícies distintas** e o roteiro precisa distinguir qual falhou: (a) a **lista de fornecedores da cotação** no Portal do Comprador, carregada por `getSupplierByQuote`; e (b) o painel **Informações do Fornecedor** do formulário de negociação, que é outro processo, com carga própria. Além disso, o botão **Negociar** é **condicional** (`controleNegociar`): se o flag for falso, a ação simplesmente não aparece — sintoma que um observador descreveria como "não trouxe os fornecedores", mas cuja causa é outra. Recomendo que o caso registre explicitamente qual das duas se observou.
**Dados/massa usados:** nenhum — não submetido; grade vazia.

---

## CT-FSWTBC-3893  (fluig · Concluído · Não é possível reproduzir · SDCASSI-261)

**Título:** Selecionar fornecedores na Validação Inicial de uma SC e confirmar que o sistema exige o número mínimo antes de gerar a cotação.

**Origem:** FSWTBC-3893 — *"Erro no processo de Cotação 9447: a SC 9414 teve somente **um** fornecedor na cotação"*. Encerrado no dia seguinte como **"Não é possível reproduzir"**, sem nenhum registro de tentativa de reprodução. Se a cotação de fato saiu com um único participante, a SC seguiu para negociação **sem concorrência**, o que exigiria justificativa formal de dispensa.

**Módulo/Rota:** **Portal do Comprador** › **Validação Inicial** (`#/validacaoInicial`) — switcher **Selecionar Fornecedores**, campo **Fornecedores**, switcher **Dispensa Cotação** e campo **Justificativa para Dispensa da Cotação**. O mesmo conjunto aparece no formulário de **Centralizar Solicitações**.

**Pré-condições**
- Uma SC do próprio executor na etapa de **Validação Inicial** (Validação do Comprador), pronta para ter os fornecedores definidos.
- Fornecedores cadastrados e ativos para o grupo de produto da SC.
- **Bloqueio:** parcial. A tela **abre e lista solicitações**, mas as 24 listadas são de **terceiros** — concluir a validação de qualquer uma delas é escrita em processo alheio, vedada. O caso exige SC criada pelo próprio executor.

**Passos**
1. Abrir **Portal do Comprador › Validação Inicial** e localizar a SC de teste.
2. Abrir a validação da solicitação.
3. Ativar o switcher **Selecionar Fornecedores**.
4. Selecionar **um único** fornecedor no campo **Fornecedores** e tentar confirmar.
5. Ler a crítica exibida. **Não prosseguir.**
6. Selecionar **dois** fornecedores e tentar confirmar de novo; ler a crítica.
7. Selecionar **três** fornecedores e confirmar que a validação passa (sem concluir o envio, se possível).
8. Ativar também o switcher **Dispensa Cotação**, voltar a **um** fornecedor e tentar confirmar.
9. Com a Dispensa ativa, deixar **Justificativa para Dispensa da Cotação** em branco e tentar confirmar; ler a crítica.
10. **Caso de contorno:** deixar o switcher **Selecionar Fornecedores** **desligado** e confirmar; depois, acompanhar quantos fornecedores entraram na cotação gerada.

**Resultado esperado**
- Com **Selecionar Fornecedores** ativo e **Dispensa Cotação** inativa, informar **menos de três** fornecedores é recusado com a mensagem *"É necessário informar ao menos 3 fornecedores quando a flag estiver ativa."*
- Com **Selecionar Fornecedores** e **Dispensa Cotação** ambos ativos, o mínimo cai para **um**, e informar zero é recusado com *"É necessário informar ao menos 1 fornecedor quando a flag de dispensa de cotação estiver ativa."*
- Com **Dispensa Cotação** ativa e justificativa em branco, a confirmação é recusada com *"É necessário informar a justificativa para dispensa de cotação quando a flag estiver ativa."*
- Com três ou mais fornecedores, a validação passa e a cotação é gerada **com todos os fornecedores selecionados** — a quantidade de participantes da cotação é igual à quantidade selecionada.
- Nenhuma cotação chega à negociação com **um único participante** sem que exista **Dispensa Cotação** ativa e justificada.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A cotação é gerada com **um só fornecedor** (relato: cotação 9447, SC 9414, evidência `Screenshot_11.png`), embora vários tenham sido selecionados — e a SC segue para negociação sem concorrência real.

**Severidade:** Alta *(cotação com participante único elimina a concorrência; sem dispensa formalizada e justificada, é falha de governança de compra, com efeito sobre preço e sobre auditoria)*

**Preparação de massa:** uma SC do próprio executor em Validação Inicial, com grupo de produto que tenha **pelo menos quatro** fornecedores ativos cadastrados (para exercitar 1, 2 e 3 seleções). Para o passo 10 é preciso acompanhar a cotação gerada até a etapa de propostas, o que depende de comprador com matrícula no ERP.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a tela **Validação Inicial** abriu e listou **24 solicitações** reais, com filtros **Filial**, **Produto**, **Grupo de Produto**, **Centro de Custo**, **Justificativa**, switcher **Somente Minha Responsabilidade** e botões **Buscar** e **Centralizar Solicitações**. Nenhuma validação foi concluída. As regras foram lidas no código servido do widget, nas funções `validateAprovacao()` e `validateCentralizacao()`, e são estas, literalmente: com `swFornecedores` ativo e menos de 3 fornecedores, se `swDispensaCotacao` também estiver ativo e houver menos de 1 fornecedor → *"É necessário informar ao menos 1 fornecedor quando a flag de dispensa de cotação estiver ativa."*; se a dispensa **não** estiver ativa e houver menos de 3 → *"É necessário informar ao menos 3 fornecedores quando a flag estiver ativa."*. As demais críticas da mesma função, úteis ao roteiro: *"É necessário informar o tipo de compra."*, *"É necessário informar a validade da cotação."*, *"A validade da cotação está vencida. Informe uma data igual ou posterior à data de hoje."*, *"É necessário informar o resumo."*, *"É necessário informar a justificativa para dispensa de cotação quando a flag estiver ativa."*, *"É necessário informar o tipo de solicitação para compras do tipo Contrato."*, *"É necessário selecionar o contrato para Nova Contratação ou Aditivo Contratual."* e *"É necessário informar a filial centralizadora."*
**Divergências encontradas:** **a divergência que provavelmente explica o "não é possível reproduzir".** A regra de mínimo de fornecedores é **condicionada ao switcher `swFornecedores` ("Selecionar Fornecedores")**: ela **só é avaliada quando o comprador liga o switcher e escolhe os fornecedores manualmente**. Com o switcher **desligado** — que é o caminho em que o sistema resolve os participantes sozinho — **não existe validação de mínimo nenhuma**, e nada impede que a cotação resultante saia com um único fornecedor. Ou seja: quem tentou reproduzir o defeito ligando o switcher encontrou a trava funcionando e concluiu, corretamente para aquele caminho, que não reproduzia; mas o caminho relatado no incidente é provavelmente o **outro**, onde a trava não se aplica. Recomendo reabrir o assunto com essa distinção explícita — e, se a regra de negócio for "toda cotação precisa de 3 participantes ou dispensa justificada", ela precisa valer **também** com o switcher desligado, o que hoje não acontece.
**Dados/massa usados:** nenhum — nenhuma validação concluída; nenhuma SC de terceiro foi movimentada.

## CT-FSWTBC-3896  (fluig · Concluído · SDCASSI-262)

**Título:** Ler por inteiro a justificativa de uma solicitação na lista de Validação Inicial do Portal do Comprador.

**Origem:** FSWTBC-3896 — a coluna "Justificativa" da aba Validação Inicial não quebrava a linha, e justificativas
longas ficavam ilegíveis, comprometendo a auditabilidade da decisão de compra naquela etapa.

**Módulo/Rota:** Portal do Comprador → Acesso Rápido → **Validação Inicial**
(`/portal/p/1/portal-do-comprador#/validacaoInicial`)

**Pré-condições**
- Usuário com perfil de comprador que resolva matrícula no ERP (grupo `G.P.Requisicao_de_Compras_Validacao_Compradores`).
- Existir ao menos uma SC em Validação Inicial cuja **Justificativa da Solicitação tenha mais de ~90 caracteres**
  (o suficiente para exceder a largura de 576 px da coluna).
- **Bloqueio:** a base de homologação não tem, hoje, nenhuma justificativa longa o bastante nas 24 linhas
  listadas — a maior tem 71 caracteres. Criar uma SC só para forçar o cenário foi descartado (regra §2 do briefing).

**Passos**
1. Acessar o Fluig e abrir **Portal do Comprador** pelo menu lateral.
2. No bloco **Acesso Rápido**, abrir **Validação Inicial** (ou navegar direto para `#/validacaoInicial`).
3. Aguardar a grade carregar. Conferir o cabeçalho: `Nº Solic | Solicitante | Data Solicitação | Cod. Filial | Filial | Data Emissão | Nº Solic ERP | Justificativa | Etapa | Status`.
4. Localizar a linha cuja **Justificativa** seja o texto longo preparado.
5. Ler o conteúdo da célula **Justificativa** sem usar rolagem horizontal e sem abrir a solicitação.

**Resultado esperado**
- A célula **Justificativa** exibe o texto integral, quebrando em mais de uma linha (a altura da linha da
  grade cresce para acomodar o texto) **ou** oferece um recurso explícito de leitura integral (tooltip
  com o texto completo, ou expansão da linha) acionável sem sair da grade.
- Nenhum caractere do texto é perdido: o que está gravado na solicitação é o que se consegue ler.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A justificativa aparece cortada no limite da largura da coluna, em uma única linha, sem reticências
  informativas nem tooltip — impossível saber o porquê da aprovação/recusa sem abrir a solicitação.

**Severidade:** Média *(não é risco financeiro direto, mas apaga a trilha de decisão de uma etapa de aprovação)*

**Preparação de massa:** uma Solicitação de Compras em etapa de Validação Inicial, criada pelo próprio
executor, com o campo **Justificativa da Solicitação** preenchido com um texto de 200+ caracteres
(prefixo `QA`). Não existe hoje na base; nenhum outro pré-requisito.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a rota `#/validacaoInicial` **abre** e a grade carrega com **24 linhas**. A coluna
**Justificativa** existe (10ª coluna). Os filtros da tela são **Filial, Produto, Grupo de Produto, Centro de
Custo, Justificativa, Somente Minha Responsabilidade**, com os botões **Buscar** e **Centralizar Solicitações**.
Medi o estilo computado das células da coluna: `white-space: nowrap`, `overflow: hidden`, com
`text-overflow: ellipsis` no elemento interno, largura de célula 576 px e altura fixa de 50 px. Com as
justificativas hoje em base (a maior com 71 caracteres, "Aditivo Contratual por mais 10 meses aumentado o
valor para…") nada é visivelmente cortado, porque o texto cabe na largura. Não consegui, portanto,
demonstrar a quebra de linha.
**Divergências encontradas:** o ticket fala em "aba Validação Inicial"; na tela **não é uma aba** — é um item
do bloco **Acesso Rápido** do Portal do Comprador, que só navega por URL com hash (`#/validacaoInicial`);
o clique no cartão não navegou. Além disso, a configuração CSS da coluna hoje é de **linha única com
reticências**, não de quebra de linha — o que não contradiz a homologação do cliente (pode ter sido
resolvido por largura ou tooltip), mas significa que **o cenário do defeito continua não coberto por
evidência**: sem uma justificativa longa em base, ninguém sabe se ela seria legível.
**Dados/massa usados:** nenhum — apenas leitura da grade; nada submetido.

---

## CT-FSWTBC-3911  (fluig · Concluído · SDCASSI-76)

**Título:** Validar uma proposta no Portal do Comprador e conferir que os dados do responsável pela validação são gravados.

**Origem:** FSWTBC-3911 — ao preencher as informações da proposta no Portal do Comprador, os dados do
**responsável pela validação** não carregavam, deixando a validação sem identificação de quem validou.
Defeito achado pelo QA interno, sem causa raiz registrada.

**Módulo/Rota:** Portal do Comprador → **Avaliação de Propostas** (`#/avaliacaoPropostas`) → ação de validar
a proposta; o efeito é gravado no formulário de **Negociação de Cotação de Produtos e Serviços**
(`wf_negociacao_cotacao_prod_serv`, form 256835), seção **Validação de Proposta**.

**Pré-condições**
- Usuário comprador que resolva matrícula no ERP (ver limitação de conta na abertura deste lote).
- Uma cotação com proposta recebida, atribuída ao comprador logado, apta a ser validada.
- **Bloqueio:** a conta de QA não resolve matrícula de comprador — a grade de Avaliação de Propostas
  retorna "Nenhum dado encontrado". Sem isso não há proposta para validar e a ação não pode ser exercida.

**Passos**
1. Abrir **Portal do Comprador** → **Avaliação de Propostas**.
2. Localizar a cotação desejada na grade (colunas `Status | Núm. Cotação | Filial | Número da SC | Nº. Proc. Fluig | Tip. Documento | Parecer Téc. | Em Alçada | Dt. Validade | Valor Final`) e abri-la.
3. Preencher a análise da proposta e informar a **Justificativa para a aprovação** (ou **para a reprovação**, conforme a decisão).
4. Confirmar a validação da proposta.
5. Abrir a solicitação de **Negociação** correspondente e ir até a seção **Validação de Proposta**.

**Resultado esperado**
- Os campos **Responsável \*** e **Email do Solicitante \*** (ids `txt_respValid` e `txt_emailResp`) vêm
  **preenchidos com o nome e o e-mail do usuário que executou a validação** — não vazios, não com o
  solicitante da SC.
- Os campos de data e hora da validação (`txt_validData`, `txt_horaValid`) também vêm preenchidos, com a
  data/hora do momento da validação.
- O valor gravado em **Responsável** é o mesmo usuário autenticado que clicou em validar.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Os campos do responsável pela validação aparecem **em branco** na seção Validação de Proposta, deixando
  a proposta validada sem identificação de quem validou.

**Severidade:** Alta *(perda da trilha de quem aprovou/reprovou uma proposta — risco de governança de aprovação)*

**Preparação de massa:** uma cotação com pelo menos uma proposta de fornecedor recebida, atribuída ao
comprador que executará o teste, em etapa de avaliação de propostas. Depende de credencial de comprador
com matrícula válida no Protheus, que a equipe de QA não possui — precisa ser provida pelo cliente.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a rota `#/avaliacaoPropostas` abre e a grade renderiza com as 10 colunas acima,
porém **sem dados** ("Nenhum dado encontrado"), pela limitação de conta. No formulário de Negociação
(256835) confirmei a seção **Validação de Proposta** e os campos `txt_respValid` (label **"Responsável \*"**,
`readonly`) e `txt_emailResp`. No bundle Angular do Portal do Comprador está o trecho que popula esses
campos na movimentação: `txt_respValid: this.userService.getActualUser().user`,
`txt_emailResp: ...getActualUser().userEmail`, junto de `txt_validData` e `txt_horaValid` — ou seja, hoje o
responsável é obtido do **usuário autenticado**, e não de um dado carregado da proposta. Essa é a evidência
mais forte de que a correção está no lugar.
**Divergências encontradas:** **duas.** (1) O ticket fala em "dados do RESPONSÁVEL PELA VALIDAÇÃO"; esse
rótulo não existe na tela — o campo se chama **"Responsável \*"**, dentro da seção **Validação de Proposta**.
(2) **Achado novo:** o campo vizinho, cujo id é `txt_emailResp` e cujo tooltip diz literalmente
`title="Email do Responsável ."`, é exibido com o rótulo **"Email do Solicitante \*"**. Rótulo visível e
identidade do campo se contradizem — quem lê a tela conclui que ali está o e-mail do solicitante da SC,
quando o valor gravado é o do responsável pela validação. Vale abrir como apontamento próprio.
**Dados/massa usados:** nenhum — nenhuma proposta foi validada; nada submetido.

---

## CT-FSWTBC-3917  (fluig · Concluído · SDCASSI-266)

**Título:** Conferir que uma cotação originada de SC centralizada aparece para o fornecedor no Portal do Fornecedor.

**Origem:** FSWTBC-3917 — a SC 9567, criada a partir da **centralização**, não exibia sua cotação (000040,
filial 2501) no Portal do Fornecedor. A cotação existia, mas nenhum fornecedor a via, então ela morria sem
propostas e sem que a causa fosse perceptível.

**Módulo/Rota:** Portal do Comprador → **Validação Inicial** → botão **Centralizar Solicitações** (origem da
massa) · e **Portal do Fornecedor** (`/portal/p/1/portal_fornecedor`) → **Acesso Normal** (verificação).

**Pré-condições**
- Uma SC gerada pela **centralização** de solicitações (não uma SC comum), já transformada em cotação.
- Ao menos um fornecedor convidado para essa cotação, com cadastro ativo e credencial de acesso ao portal.
- Credencial de fornecedor: **CNPJ da empresa + CPF do usuário + senha**.
- **Bloqueio:** **não há credencial de fornecedor disponível para o QA.** A tela de acesso do Portal do
  Fornecedor foi aberta e confirmada, mas é impossível passar dela. Esse é o bloqueio central do caso.

**Passos**
1. No Portal do Comprador → **Validação Inicial**, selecionar as solicitações desejadas e acionar
   **Centralizar Solicitações**; anotar o número da SC centralizada gerada e sua filial.
2. Levar a SC centralizada até a geração da cotação; anotar o **número da cotação** e os fornecedores convidados.
3. Abrir `/portal/p/1/portal_fornecedor` e escolher **Acesso Normal**.
4. Informar **CNPJ da empresa**, **CPF do usuário** e **Senha** de um fornecedor convidado e clicar em **Entrar**.
5. Localizar a cotação pelo número anotado na lista de cotações disponíveis do fornecedor.

**Resultado esperado**
- A cotação originada da SC **centralizada** aparece na lista do fornecedor convidado, exatamente como
  apareceria uma cotação originada de SC comum.
- O número da cotação e a filial exibidos batem com os anotados no passo 2.
- O fornecedor consegue abrir a cotação e chegar à tela de envio de proposta (com o campo
  **Validade da Proposta**, `dt_validadeCotacao`), sem mensagem de indisponibilidade.
- Como contraprova no Fluig: em **Portal do Comprador → Controle De Cotações**, a mesma cotação aparece
  listada para o comprador responsável.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A cotação **não aparece** na lista do Portal do Fornecedor, embora exista no Fluig e no ERP. O fornecedor
  não envia proposta e a cotação encerra sem participantes, sem nenhuma mensagem de erro que aponte a causa.

**Severidade:** Alta *(impacto externo — impede a participação de fornecedores e frustra a cotação inteira, silenciosamente)*

**Preparação de massa:** (a) uma SC **centralizada** com cotação gerada e fornecedor convidado, criada pelo
executor; (b) **credencial de fornecedor** (CNPJ + CPF + senha) de um fornecedor convidado nessa cotação —
esta precisa ser provida pelo cliente ou pela equipe que administra o Portal do Fornecedor. Sem (b) o caso
não é executável em nenhuma rodada.

**Verificado em tela:** PARCIAL
**O que foi verificado:** `/portal/p/1/portal_fornecedor` abre com o título de documento
`Cassi - Fluig Plataforma - Portal do Fornecedor` e os textos **"Bem vindo ao Portal de Compras e
Contratações!"**, **"Somos a CASSI"**, **"Selecione o tipo de acesso."**, com os três botões
**Acesso Normal**, **Acesso Administrador** e **Acesso via Representatividade** — a tela de entrada existe e
responde. Na carga aparece `401` em
`/cassi_rest/api/rest/cassi/compras/1/verifyAutenticateToken`, coerente com "sem sessão de fornecedor".
Do lado do comprador, confirmei que **Centralizar Solicitações** existe como botão na tela de Validação
Inicial (é o ponto de origem da massa citada no ticket) e que **Controle De Cotações** (`#/controleCotacao`)
abre — mas devolve "Página 1 de 0 / Nenhum dado encontrado" para esta conta.
**Divergências encontradas:** os números do ticket (SC 9567, cotação 000040) são de outra base/numeração —
as instâncias atuais deste ambiente estão na faixa 112.9xx–113.2xx. O cenário precisa ser reconstruído com
massa nova, não localizado pelos números originais.
**Dados/massa usados:** nenhum — não houve login de fornecedor nem centralização de solicitações.

---

## CT-FSWTBC-3963  (ambos · Concluído · SDCASSI-31)

**Título:** Reexecutar a gravação do vencedor sobre uma cotação já finalizada deve ser ignorada em silêncio, não virar erro.

**Origem:** FSWTBC-3963 — ao executar a rotina **`gravavencedor`** pelo **schedule**, aparecia a
mensagem **"cotação já finalizada"**. Defeito de **idempotência**: a rotina é reexecutada sobre uma
cotação já fechada e **falha em vez de ignorar**. Consequência direta do modelo de fila com
retentativa — se a primeira execução concluiu mas o retorno não foi registrado, a fila tenta de novo
e encontra a cotação fechada. Mesma família de FSWTBC-2357 e 2690 ("Cotação em aprovação não pode
ser alterada"). Aberto **internamente** (Alessandro Porta), não pelo cliente.

**Módulo/Rota:** endpoint `POST /api/v2/fluig/compras/cotacao/gravavencedor` chamado pelo schedule ·
superfícies no Fluig: **Logs Protheus → aba `Erros CV8`** e o campo
**"Erro retornado pelo ERP Protheus"** no formulário de **Negociação de Cotação de Produtos e
Serviços** (na SC o campo equivalente chama-se *Retorno Integração* — são telas diferentes).

**Pré-condições**
- Uma cotação já **finalizada** com vencedor gravado.
- A fila reprocessando o mesmo registro (retentativa), ou a mesma chamada disparada duas vezes.
- **Bloqueio:** exige disparar/observar schedule Protheus (proibido pelo briefing) e credencial
  Protheus para reexecutar a rotina. A conta de QA também não resolve matrícula de comprador (§5-C),
  o que fecha a família cotação para este login.

**Passos**
1. Identificar uma cotação **já finalizada**, com vencedor gravado.
2. Provocar a reexecução de `gravavencedor` sobre ela (retentativa da fila ou reenvio da chamada).
3. Abrir **Logs Protheus → `Erros CV8`**, filtrar filial e o dia, e **Consultar**.
4. Procurar por ocorrências com a mensagem **"cotação já finalizada"** no campo
   *"Mensagem, detalhe ou processo"*.
5. Abrir o formulário da **Negociação** correspondente e ler o campo
   **"Erro retornado pelo ERP Protheus"**.
6. Conferir no Histórico do processo se houve nova movimentação indevida.

**Resultado esperado**
- A segunda execução é **idempotente**: reconhece que o vencedor já está gravado e **encerra sem
  erro**, deixando (no máximo) um log informativo.
- **Nenhum** registro em `Erros CV8` com a mensagem **"cotação já finalizada"**.
- O campo **"Erro retornado pelo ERP Protheus"** da Negociação permanece **vazio**.
- O vencedor gravado **não é alterado** pela reexecução, e nenhum processo é movimentado de novo.

**Resultado se o defeito reincidir**
- A rotina retorna **"cotação já finalizada"** como **erro**, a fila registra falha e o registro
  volta para retentativa — mesmo tendo a operação sido concluída com sucesso na primeira vez.

**Severidade:** Média *(não corrompe dado, mas polui a fila com falha falsa e mascara erro real —
retentativa infinita sobre operação já concluída)*

**Preparação de massa:** uma cotação de teste levada até a definição do vencedor e finalizada, e
acesso ao disparo controlado do schedule. Exige o time Protheus.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a aba **`Erros CV8`** e o filtro *"Mensagem, detalhe ou processo"* existem
no widget *Logs Protheus* — é a superfície certa para o passo 4. A reexecução não foi feita.
**Divergências encontradas:** o rótulo do campo de erro **muda conforme a tela** e o ticket não
distingue: na **SC** é *Retorno Integração*; na **Cotação e na Negociação** é *"Erro retornado pelo
ERP Protheus"*; o **Faturamento de Contratos não tem nenhum dos dois**. Além disso, a grade de
`Erros CV8` **não carrega hoje** (`genericQuery` 404 — ambiente).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4093  (fluig · Concluído · Não Contratado · SDCASSI-292)

**Título:** Ordenar a lista de propostas do Portal do Comprador pelo Valor Final, do menor para o maior.

**Origem:** FSWTBC-4093 — pedido para que a tabela de análise de cotação viesse **ordenada por "Valor Final"
em ordem crescente**, exibindo primeiro os menores valores. Encerrado como **"Não Contratado"**: a TBC
respondeu que a funcionalidade não estava no escopo inicial e exigiria levantamento; o cliente autorizou o
encerramento em 30/03, dizendo que validaria com a área de negócio. **Registrado como Bug, mas é melhoria
de usabilidade.**

**Módulo/Rota:** Portal do Comprador → **Avaliação de Propostas** (`#/avaliacaoPropostas`) e
**Definir Vencedor Cotação** (`#/propostaVencedora`)

**Pré-condições**
- Usuário comprador que resolva matrícula no ERP.
- Ao menos três cotações com **Valor Final** distinto na grade, para tornar a ordenação observável.
- **Bloqueio:** a conta de QA não resolve matrícula de comprador — a grade retorna "Nenhum dado
  encontrado". A ordenação foi verificada pela mecânica do cabeçalho, não sobre dados.

**Passos**
1. Abrir **Portal do Comprador** → **Avaliação de Propostas**.
2. Aguardar a grade carregar e observar a **ordem inicial** das linhas, lendo a coluna **Valor Final**.
3. Clicar uma vez no cabeçalho **Valor Final**.
4. Ler a coluna **Valor Final** de cima para baixo.
5. Clicar novamente no mesmo cabeçalho e reler a coluna.
6. Repetir os passos 2 a 5 em **Definir Vencedor Cotação**.

**Resultado esperado**
*(este item não foi contratado — o esperado abaixo descreve o que existe hoje, que é o comportamento a ser
protegido de regressão; o pedido original do ticket está registrado logo em seguida)*
- O cabeçalho **Valor Final** é clicável e apresenta indicador de ordenação.
- O primeiro clique ordena a grade por **Valor Final crescente** (menores primeiro); o segundo inverte para
  decrescente.
- A ordenação respeita o **valor numérico** da moeda, não a ordem alfabética do texto formatado
  (R$ 1.000,00 vem antes de R$ 9,00 seria erro).
- *Pedido original, não entregue:* a grade **abriria** já ordenada por Valor Final crescente, sem depender
  de clique.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Como o item não foi entregue, o comportamento do ticket persiste por decisão: a grade **não abre**
  ordenada por Valor Final — abre na ordem devolvida pela consulta, e cabe ao comprador clicar no
  cabeçalho. Uma regressão aqui seria o cabeçalho **deixar de ser clicável**, aí sim tornando impossível
  ordenar por valor.

**Severidade:** Baixa *(usabilidade da análise de cotação; não impede a operação, apenas a torna mais lenta e sujeita a erro humano)*

**Preparação de massa:** ao menos três cotações em fase de avaliação de propostas, atribuídas ao comprador
executor, com **Valor Final** diferente entre si. Depende de credencial de comprador com matrícula válida.

**Verificado em tela:** SIM (total, quanto ao que é verificável sem dados)
**O que foi verificado:** as duas rotas abrem e a grade renderiza com as colunas
`Status | Núm. Cotação | Filial | Número da SC | Nº. Proc. Fluig | Tip. Documento | Parecer Téc. | Em Alçada | Dt. Validade | Valor Final`
— a coluna **Valor Final** existe nas duas telas. Inspecionei o cabeçalho "Valor Final": classe
`po-table-header-ellipsis po-frozen-column po-clickable`, `cursor: pointer`, com o ícone de ordenação
`an an-arrows-down-up` em estado `po-table-header-icon-unselected`. Ou seja, **a ordenação manual por
clique está disponível e nenhuma coluna vem pré-ordenada**. Na definição de colunas do bundle Angular, a
coluna é `{ property: "C8_TOTAL", label: "Valor Final", type: "currency", format: "BRL" }` — tipada como
moeda (o que garante ordenação numérica, não alfabética) e **sem nenhuma diretiva de ordenação padrão**,
coerente com a resolução "Não Contratado". A grade estava vazia, então a ordem das linhas não pôde ser
observada sobre dados reais.
**Divergências encontradas:** o ticket trata o item como **Bug**, mas trata-se de **melhoria de
usabilidade** — a distorção já apontada na análise, de pedidos de evolução entrarem como defeito. Registro
ainda que a mesma coluna **Valor Final** aparece em **duas** telas (Avaliação de Propostas e Definir
Vencedor Cotação); o ticket menciona apenas "a tabela de análise de cotação", então, se a demanda for
retomada, é preciso decidir se a ordenação padrão vale para as duas.
**Dados/massa usados:** nenhum — grade vazia; nada submetido.

---

## CT-FSWTBC-4095  (fluig · Concluído · SDCASSI-294)

**Título:** Conferir que o Controle de Cotações exibe apenas cotações vigentes e sob responsabilidade do comprador logado.

**Origem:** FSWTBC-4095 — o Controle de Cotações deveria exibir somente as cotações **vigentes** e **de
responsabilidade do comprador**. Foram **três reprovações sucessivas**: (1) 24/03 — cotações **canceladas** e
de **outros compradores** ainda apareciam; (2) 01/04 — SCs **finalizadas** continuavam sendo exibidas;
(3) 06/04 — SCs **canceladas** ainda apareciam. O padrão é de filtro construído por exclusão pontual em vez
de definição positiva de "vigente", misturando duas dimensões: **situação do documento** e **titularidade**.

**Módulo/Rota:** Portal do Comprador → **Controle De Cotações** (`#/controleCotacao`)

**Pré-condições**
- Usuário comprador que resolva matrícula no ERP.
- Massa que cubra as **duas dimensões** do defeito, simultaneamente:
  - situação: ao menos uma cotação **vigente**, uma **cancelada** e uma **finalizada**;
  - titularidade: ao menos uma cotação **de outro comprador** e uma **do comprador logado**.
- **Bloqueio:** a conta de QA não resolve matrícula de comprador; a grade abre vazia
  ("Página 1 de 0 / Nenhum dado encontrado"). Sem credencial de comprador com cotações atribuídas, nenhuma
  das duas dimensões pode ser exercida.

**Passos**
1. Abrir **Portal do Comprador** → **Controle De Cotações**.
2. Acionar **Filtrar** sem restringir nada, para trazer o conjunto máximo que a tela oferece.
3. Percorrer a listagem e classificar cada linha por **situação do documento** (vigente / cancelada / finalizada).
4. Percorrer a listagem e classificar cada linha por **comprador responsável**.
5. Conferir especificamente as cotações preparadas como cancelada, como finalizada e como de outro comprador.

**Resultado esperado**
- A grade exibe **apenas** cotações **vigentes**: nenhuma linha com situação **cancelada** e nenhuma com
  situação **finalizada**.
- A grade exibe **apenas** cotações **do comprador logado**: nenhuma cotação cujo responsável seja outro
  comprador, e nenhuma de processo do qual o comprador logado não tenha participado.
- O critério é aplicado como **definição positiva de vigente** — um estado novo de documento
  (por exemplo, suspensa ou revisada) que não seja "vigente" **não aparece** por omissão. *(Este é o risco
  residual apontado no próprio ticket: como "vigente" nunca foi escrito explicitamente, um estado novo
  pode vazar e reabrir o defeito pela quarta vez.)*
- As mesmas regras valem consistentemente com as demais telas do Portal do Comprador.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Cotações **canceladas** e/ou **finalizadas** aparecem na lista, e cotações de **outros compradores** são
  exibidas para quem não participou do processo — o resumo do próprio responsável pelo ticket foi
  *"Exibindo cotações canceladas e finalizadas"*.

**Severidade:** Média *(não movimenta valor, mas leva o comprador a agir sobre documento morto e expõe carteira alheia)*

**Preparação de massa:** um conjunto de **cinco** cotações preparado especificamente: vigente do comprador
logado; cancelada do comprador logado; finalizada do comprador logado; vigente de outro comprador; e uma de
processo do qual o comprador logado não participou. Sem cobrir as duas dimensões ao mesmo tempo, o caso
repete o erro histórico de validar uma faceta e deixar a outra passar. Depende de credencial de comprador.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a rota `#/controleCotacao` **abre** e a tela renderiza com o botão **Filtrar**,
retornando **"Página 1 de 0"** e **"Nenhum dado encontrado"** para esta conta. A grade é alimentada pelo
dataset `dsFluig_getProcessosProjetoComprasSql`, e no bundle Angular confirmei que os campos requisitados
incluem **`hd_cancelarProposta`**, `hd_numProp`, `hd_numSc` e `hd_atribuicao` — isto é, o estado de
cancelamento e a atribuição são carregados junto de cada linha, que é a matéria-prima das duas dimensões
do filtro. Confirmei também que há um conceito de "processo aberto" no código (`isProcessOpen`, que consulta
com `statusProcesso: { value: "0" }`). Não pude observar nenhuma linha, e portanto **não pude verificar o
filtro em si**.
**Divergências encontradas:** o ticket chama a tela de "Controle de Cotações"; na tela a grafia é
**"Controle De Cotações"**, com "De" maiúsculo. Registro também que a tela **não expõe rótulo de "situação
do documento"** entre os controles visíveis — só um botão **Filtrar** genérico —, de modo que o testador não
tem, na interface, como declarar qual noção de "vigente" está sendo aplicada. Isso sustenta o risco
residual apontado no ticket: a regra é implícita e invisível ao usuário.
**Dados/massa usados:** nenhum — grade vazia; nada submetido.

---

## CT-FSWTBC-4110  (fluig · Concluído · SDCASSI-297)

**Título:** Cancelar uma proposta de negociação e confirmar que o processo principal sai de "Aguarda Finalizar Negociação" em vez de ficar travado.

**Origem:** FSWTBC-4110 — na *Avaliação de Propostas*, a proposta de negociação **9962** foi cancelada e **não atualizou o processo principal 9946**, que ficou parado em *"Aguarda Finalizar Negociação"*, sem caminho de destrave pela interface. Espelho do SDCASSI-295 (lá o cancelamento do pai não descia para os filhos; aqui o do filho não sobe para o pai).

**Módulo/Rota:** **Portal do Comprador** (`/portal/p/1/portal-do-comprador`) › **Avaliação de Propostas** (`#/avaliacaoPropostas`) › abrir a cotação › no cartão da proposta, botão **Cancelar Proposta**. Conferência do efeito na aba **Histórico** do processo principal (`wf_solicitacao_compras`), atividade **`172 - Aguarda Finalizar Negociação`**.

**Pré-condições**
- Conta com **matrícula de comprador resolvida no ERP** e que seja a **responsável** pela cotação.
- Uma SC que tenha chegado a `50 - Processo de Negociação`, com o processo principal parado em `172 - Aguarda Finalizar Negociação` e **pelo menos duas** instâncias-filhas de negociação (para provar que o pai só destrava quando a última fecha).
- Ao menos uma proposta de fornecedor recebida na cotação.
- **Bloqueio:** sim. (a) A conta de QA `TOTVS-FS` não resolve matrícula de comprador — o portal registra *"Comprador não encontrado"* e as grades vêm vazias; (b) o cenário exige **cancelar** uma proposta de um processo real, o que o briefing proíbe (§2) e o próprio ticket desaconselha (Paulo Calixto, 01/04: *"solicitamos que não sejam cancelados os processos nos quais foram identificados erros, a fim de garantir insumos para a análise"*).

**Passos**
1. Abrir **Portal do Comprador** › **Avaliação de Propostas**.
2. Localizar a cotação na grade pelas colunas **Núm. Cotação** / **Número da SC** / **Nº. Proc. Fluig** e abri-la.
3. **Antes** de cancelar, anotar o **Nº. Proc. Fluig** do processo principal e conferir no Histórico dele que a atividade corrente é `172 - Aguarda Finalizar Negociação`.
4. No cartão da proposta, clicar em **Cancelar Proposta**.
5. No primeiro alerta (*Atenção*), com a mensagem **"Você está cancelando esse item e o restante da cotação! Deseja confirmar essa ação?"**, clicar em **Confirmar**.
6. No segundo alerta (*Confirmação*), **"Tem certeza que deseja cancelar a proposta?"**, clicar em **Sim, cancelar!**.
7. No terceiro alerta (*Justificativa*), **"Qual a justificativa para cancelar a proposta?"**, deixar o campo **vazio** e clicar em **Enviar** — observar a crítica.
8. Repetir, agora preenchendo a justificativa com `QA cancelamento de proposta - teste de regressao SDCASSI-297`, e clicar em **Enviar**.
9. Abrir o **processo principal** pelo Nº. Proc. Fluig anotado no passo 3 e ler a aba **Histórico**.
10. Repetir os passos 4 a 8 para a **segunda** instância de negociação e reler o Histórico do pai.

**Resultado esperado**
- Passo 7: a operação é recusada com **"A justificativa para cancelar a proposta deve ser informada!"** e **nada é movimentado**.
- Passo 8: é exibida a notificação de sucesso **"A proposta foi cancelada!"**.
- A instância-filha de negociação é movimentada (estado destino **22**), com o comentário **"Cancelamento da proposta recebida! Justificativa: QA cancelamento de proposta - teste de regressao SDCASSI-297"** registrado no Histórico dela.
- Passo 10: quando a **última** negociação pendente é cancelada, o **processo principal sai de `172 - Aguarda Finalizar Negociação`** e o Histórico registra a transição para a atividade seguinte. O processo **não** permanece parado em 172.
- Em nenhum momento aparecem **"Ocorreu uma falha no cancelamento da proposta recebida!"** ou **"Ocorreu uma falha na movimentação da cotação!"**.
- A cotação deixa de aparecer como pendente na *Avaliação de Propostas* do comprador.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A proposta de negociação (ex.: **9962**) é cancelada com sucesso, mas o processo principal (ex.: **9946**) **continua em "Aguarda Finalizar Negociação"** indefinidamente, sem nenhuma ação disponível na interface para destravá-lo — deadlock de fluxo.
- Variante mais grave relatada na homologação (26/03, SC **10266**): o comprador consegue **bloquear novos participantes sem nenhuma cotação enviada** por fornecedor, o processo avança para a cotação **10274** e trava; e a tentativa de **cancelar a SC pelo próprio comprador dá erro**.

**Severidade:** Alta *(processo travado sem saída pela interface bloqueia a compra e obriga intervenção manual no banco/servidor; e a válvula de escape — o cancelamento — também falhava)*

**Preparação de massa:** uma SC em `172 - Aguarda Finalizar Negociação` com **duas ou mais** instâncias-filhas de negociação vivas, cujo comprador responsável seja a conta do executor, criada por quem tenha perfil de comprador na gerência de compras da CASSI. **Não é criável pela conta de QA.** Recomenda-se criar a massa do zero (SC nova com prefixo `QA`) em vez de reaproveitar processo real, porque o teste **destrói** a proposta ao cancelá-la.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — o Portal do Comprador abre, o atalho **Avaliação de Propostas** existe e a rota `#/avaliacaoPropostas` renderiza a grade com as dez colunas listadas no cabeçalho deste lote; a grade está vazia ("Nenhum dado encontrado"). *Lido no fonte publicado* (`main.js` do `wg_portalCompradores`) — o botão **"Cancelar Proposta"** (`p-icon: an an-x`) existe ao lado de **"Validar Proposta"**, **"Negociar"** e **"Verificar Parecer Técnico"**; a função `cancelarNegociacao` encadeia exatamente os três alertas e a crítica de justificativa citados nos passos, e conclui chamando `handlerMoveProcProposals(..., procTaskNegotiation = 22, "Cancelamento da proposta recebida! Justificativa: …")`, que obtém a instância por `getProcessIdNegotiation({numFilial, numQuote, numPropQuote, codeSupplier, storeSupplier})` e movimenta **apenas essa** instância. **O cancelamento não foi executado.**
**Divergências encontradas:** (1) O ticket fala em "cancelamento da proposta de negociação"; o rótulo real do botão é **"Cancelar Proposta"**. (2) **Achado de arquitetura, não corrigido no fonte que está publicado:** `handlerMoveProcProposals` movimenta **somente a instância-filha** — não há, no widget, nenhuma chamada que movimente o processo pai. A sincronização pai→filho, portanto, **depende inteiramente de um evento server-side do BPM**, que não é observável pelo front-end. Isso é coerente com a pendência estrutural registrada no próprio ticket (a subtarefa V2 **FSWTBC-4104**, de unificar a movimentação num único ponto, **parada desde março**) e significa que este caso **precisa obrigatoriamente** validar o Histórico do pai — validar só a mensagem "A proposta foi cancelada!" daria falso verde.
**Dados/massa usados:** nenhum — nada submetido, nada cancelado.

---

## CT-FSWTBC-4126  (fluig · Concluído · SDCASSI-302)

**Título:** Conferir que a grade do Portal do Comprador exibe o número da SC e o número do processo Fluig de cada cotação.

**Origem:** FSWTBC-4126 — no Portal de Compradores, o **nº da SC Fluig não era exibido** na etapa de cotação/negociação, deixando o comprador sem a ligação entre a cotação que analisa e a solicitação que a originou. Correção feita **fora do escopo da fábrica**, no Portal do Fornecedor (responsável Sr. Willian, outra equipe) — não há registro técnico do que foi alterado.

**Módulo/Rota:** **Portal do Comprador** (`/portal/p/1/portal-do-comprador`) › **Controle De Cotações** (`#/controleCotacao`), **Avaliação de Propostas** (`#/avaliacaoPropostas`) e **Definir Vencedor Cotação** (`#/propostaVencedora`).

**Pré-condições**
- Conta com matrícula de comprador resolvida e ao menos uma cotação sob sua responsabilidade em cada uma das três telas.
- **Bloqueio:** sim — a conta de QA não resolve matrícula de comprador, as três grades vêm vazias. As **colunas** foram conferidas; os **valores**, não.

**Passos**
1. Abrir **Portal do Comprador**; no painel **Acesso Rápido**, clicar em **Controle De Cotações**.
2. Conferir que a grade traz, no cabeçalho, **Número da SC** e **Nº. Proc. Fluig**, e que ambas as colunas vêm **preenchidas** em cada linha.
3. Voltar e repetir nos atalhos **Avaliação de Propostas** e **Definir Vencedor Cotação**.
4. Abrir uma cotação e conferir, no detalhe, os campos **Nº do Processo Fluig**, **Nº da Solicitação ERP** e **Nº da Cotação ERP**.
5. Anotar o valor de **Nº. Proc. Fluig** e abri-lo em `/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=<valor>` — conferir que é mesmo a SC daquela cotação.
6. Usar o botão **Gerenciador de colunas** e confirmar que **Número da SC** e **Nº. Proc. Fluig** não estão ocultas por padrão.

**Resultado esperado**
- As colunas **Número da SC** e **Nº. Proc. Fluig** aparecem no cabeçalho das três grades e trazem valor em **toda** linha — nenhuma vazia, nenhum `undefined`, nenhum `null`.
- No detalhe da cotação, **Nº do Processo Fluig**, **Nº da Solicitação ERP** e **Nº da Cotação ERP** estão preenchidos.
- O número do passo 5 abre a **SC correspondente** àquela cotação — a rastreabilidade fecha sem sair do portal.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A coluna/campo do número da SC Fluig aparece **em branco** na etapa de cotação/negociação, e o comprador precisa sair do portal para descobrir qual solicitação originou a cotação.

**Severidade:** Média *(não corrompe dado, mas quebra a rastreabilidade e obriga conferência fora da ferramenta; sem ela o comprador analisa propostas sem saber a que solicitação pertencem)*

**Preparação de massa:** ao menos uma cotação em **cada** um dos três estados (em controle, em avaliação de propostas e em definição de vencedor), atribuída ao comprador executor. Como o defeito original nasceu **no Portal do Fornecedor**, a massa ideal inclui uma cotação cuja proposta tenha sido enviada **pelo Portal do Fornecedor** — é o caminho em que o campo era perdido.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — em `#/avaliacaoPropostas` e em `#/propostaVencedora` o cabeçalho da grade traz, lado a lado, **"Número da SC"** e **"Nº. Proc. Fluig"**, junto de *Status, Núm. Cotação, Filial, Tip. Documento, Parecer Téc., Em Alçada, Dt. Validade, Valor Final*; o botão **Gerenciador de colunas** existe. Em `#/controleCotacao` a grade renderizou *Página 1 de 0* / "Nenhum dado encontrado", sem cabeçalho visível. *Lido no fonte publicado* — os rótulos **"Nº do Processo Fluig"**, **"Nº da Solicitação ERP"** e **"Nº da Cotação ERP"** existem como `p-label` no bundle do portal. **Nenhum valor foi visto**, porque a grade está vazia por limitação da conta.
**Divergências encontradas:** o ticket trata "Nº da SC Fluig" como **um** dado; na tela de hoje são **dois campos distintos e ambos necessários** — **"Número da SC"** (a solicitação no ERP) e **"Nº. Proc. Fluig"** (a instância do processo no Fluig). Um caso de regressão que conferisse só um dos dois deixaria metade do defeito descoberta. Além disso, o ticket foi resolvido no **Portal do Fornecedor**, sistema de terceiro, e a fronteira de quais campos cada lado expõe **continua sem contrato explícito** — este caso não protege contra uma mudança unilateral daquele lado.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4128  (ambos · Concluído · SDCASSI-303)

**Título:** Tratar o parecer técnico de uma SC no Portal do Comprador e ter a tela coerente com a opção escolhida — sem observação órfã e sem erro ao manter "Não".

**Origem:** FSWTBC-4128 — SC 10049 marcada "não haverá parecer" seguia exibindo observação de parecer;
SC 10045 sem dispensa e mantida em "Não" dava erro e travava. Depois surgiram (a) erro intermitente só
para a compradora Mariana (SCs 10318/10379/10398), nunca reproduzido, e (b) **fornecedor enviou proposta
em cotação bloqueada** (SC 10572) — empurrado para tratativa interna.

**Módulo/Rota:** Fluig → **Portal do Comprador** (`/portal/p/1/portal-do-comprador`) → **Validação do
Comprador** da SC (formAprovacao) e **Avaliação de Propostas** (coluna **Parecer Téc.** Sim/Não; ação de
parecer abre o modal **"Selecionar Parecer Técnico"**).

**Pré-condições**
- Conta com **matrícula de comprador** no Protheus.
- Duas SCs próprias em Validação do Comprador: uma **com** parecer técnico já emitido e outra **sem**.
- **Bloqueio:** a conta de QA não resolve comprador (`Comprador não encontrado.` no console) — grade
  vazia. O cenário (b) exige credencial de **fornecedor** — não há.

**Passos**
1. Abrir a SC **sem** parecer na Validação do Comprador; manter a opção de parecer em **Não** e
   prosseguir.
2. Abrir a SC **com** parecer; marcar que **não haverá** parecer e salvar.
3. Em **Avaliação de Propostas**, localizar as duas SCs e ler a coluna **Parecer Téc.**.
4. Na SC com parecer, acionar a ação de parecer da linha.
5. Repetir os passos 1–2 numa **segunda** SC na mesma sessão, sem recarregar a página (é o padrão
   "a segunda falha" do relato da compradora).

**Resultado esperado**
- Passo 1: o fluxo segue **sem erro**; nenhum modal de falha.
- Passo 2: a observação/bloco de parecer **deixa de ser exibido** e não volta ao reabrir.
- Passo 3: **Parecer Téc.** mostra **Sim** só na SC que tem parecer; **Não** na outra.
- Passo 4: o modal **"Selecionar Parecer Técnico"** lista o processo de parecer; na SC sem parecer, o
  aviso **"Nenhum processo encontrado…"**.
- Passo 5: a segunda SC se comporta **igual à primeira** — sem estado residual entre operações.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC marcada "não haverá parecer" continua apresentando observação de parecer; manter "Não" produz erro
  e impede o fluxo; a partir da 2ª SC aberta na sessão, falha recorrente.

**Severidade:** Média (o sub-caso (b), proposta em cotação bloqueada, é **Alta** e fica fora deste caso
por exigir o Portal do Fornecedor).

**Preparação de massa:** duas SCs do próprio comprador, uma com Parecer Técnico emitido
(`wf_solicitacao_compras_parecer`) — criadas pelo executor com prefixo `QA`.

**Verificado em tela:** PARCIAL
**O que foi verificado:** Portal do Comprador abre (título "Portal do Comprador", painel **Acesso
Rápido**); console loga `Comprador não encontrado.` para a conta de QA. No `pc_main.js`: coluna
`{property:"parecerTec", label:"Parecer Téc.", labels:[{value:"S",label:"Sim"},{value:"N",label:"Não"}]}`,
ação `controleParecer`, modal `"Selecionar Parecer Técnico"`, aviso `"Nenhum processo encontrado…"`, e
o parâmetro `process:"parecer_tecnico"` com campos `tipoParecer`, `numRevProcesso`, `matriculaRespParecer`.
**Divergências encontradas:** (1) o Portal tem **switch de dispensa de COTAÇÃO** (`swDispensaCotacao`,
com justificativa automática *"Processo conduzido por dispensa de Cotação de acordo com o Normativo NR
10.0001…"*) — o ticket fala em "dispensa" de **parecer**; são controles diferentes e o ticket não diz
qual; (2) `bloqueioDispensaCotacao` depende de `contratoTravado` — a dispensa fica desabilitada por
estado do contrato, sem aviso; (3) o erro "só para a Mariana" nunca foi reproduzido — este caso cobre
o padrão (2ª SC na mesma sessão), não a causa.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4145  (fluig · Concluído · SDCASSI-308)

**Título:** Aprovar, como comprador responsável, a proposta de uma negociação e confirmar que a cotação é finalizada.

**Origem:** FSWTBC-4145 — no Portal de Compradores, na validação do comprador (negociação), **não era possível aprovar a negociação mesmo sendo o comprador responsável**. Terceiro defeito do mesmo eixo no épico (com FSWTBC-4077 e FSWTBC-4095): a correlação entre a conta autenticada e o comprador do documento não era confiável **em nenhuma das duas direções**. Homologado **sem nenhum registro técnico** do que foi alterado.

**Módulo/Rota:** **Portal do Comprador** › **Avaliação de Propostas** (`#/avaliacaoPropostas`) › abrir a cotação › no cartão da proposta, botão **Validar Proposta**. No BPM corresponde à atividade **`199 - Validação do Comprador (Negociação)`**.

**Pré-condições**
- Conta autenticada cuja **matrícula de comprador** (`userCode`) seja a **mesma** gravada como responsável da cotação.
- Uma cotação em negociação, com proposta de fornecedor recebida, e **instância de negociação viva** para a tripla (filial, cotação, SC) — é o que o portal procura antes de liberar a ação.
- A proposta a aprovar precisa ser a **mais recente** daquele fornecedor.
- **Bloqueio:** sim — a conta de QA não resolve matrícula de comprador (*"Comprador não encontrado"*), então a grade não lista cotação alguma e a ação não pode ser exercida.

**Passos**
1. Abrir **Portal do Comprador** › **Avaliação de Propostas**.
2. Abrir a cotação sob responsabilidade da conta autenticada.
3. No cartão da proposta do fornecedor, clicar em **Validar Proposta**.
4. No alerta *Atenção* — **"Você está aprovando esse item e o restante da cotação! Deseja confirmar essa ação?"** — clicar em **Confirmar**.
5. Observar a notificação de resultado e conferir que o modal fecha.
6. Abrir o **Nº. Proc. Fluig** da SC e ler a aba **Histórico**.
7. *(Contraprova de responsabilidade)* Repetir o passo 3 com uma conta que **não** seja a responsável pela cotação.

**Resultado esperado**
- A ação é **aceita** para o comprador responsável: aparece a notificação de sucesso **"A cotação foi finalizada!"** e o modal fecha.
- **Não** aparece **"Não é possível prosseguir, pois a proposta ainda não está apta para execução desta ação."** — essa é exatamente a mensagem que trava o titular legítimo quando a correlação usuário↔comprador falha.
- **Não** aparece **"Ocorreu uma falha na aprovação da cotação!"**.
- O Histórico registra a saída de `199 - Validação do Comprador (Negociação)` e a movimentação da instância de negociação com o comentário **"Enviada a aprovação da proposta recebida."**.
- Passo 7: a conta **não responsável** é barrada — e barrada **com mensagem**, não com botão inerte.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O comprador **responsável** clica em aprovar e a ação não se completa; a negociação não avança. Texto do erro original `<não documentado>` — o ticket traz apenas o print da abertura (19/03), sem transcrição.

**Severidade:** Alta *(bloqueia a aprovação de uma negociação pelo próprio titular, travando o ciclo de compra numa etapa de decisão; e o eixo do defeito — identificação do comprador — já produziu, no mesmo épico, o oposto: cotações de outros compradores visíveis)*

**Preparação de massa:** uma cotação em negociação com proposta recebida, cujo campo de comprador responsável seja a **matrícula da conta executora**, mais uma segunda conta de comprador para a contraprova do passo 7. Exige perfil de comprador da gerência de compras da CASSI e um fornecedor que tenha efetivamente enviado proposta pelo Portal do Fornecedor. **Não criável pela conta de QA.**

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — a rota `#/avaliacaoPropostas` abre e renderiza a grade e seus controles; nenhuma cotação foi listada. *Lido no fonte publicado* — o botão **"Validar Proposta"** (`p-icon: an an-check`, `p-kind: primary`) existe no cartão da proposta; `handlerApproveNegotiation` primeiro chama `getProcessIdNegotiation({numFilial: C8_FILIAL, numQuote: C8_NUM, numSCompra: C8_NUMSC})` e, **se a lista voltar vazia**, exibe *"Não é possível prosseguir, pois a proposta ainda não está apta para execução desta ação."* e **não faz nada** — é exatamente a forma do defeito relatado. Passando a guarda, `aprovarNegociacao` verifica `isTheLastedProposeSupplier`, mostra o alerta de confirmação e movimenta para o estado **22**, notificando *"A cotação foi finalizada!"* ou *"Ocorreu uma falha na aprovação da cotação!"*. **A aprovação não foi executada.**
**Divergências encontradas:** (1) O ticket fala em "aprovar a negociação"; o rótulo do botão é **"Validar Proposta"**, e a ação vizinha **"Negociar"** é a que devolve a proposta ao fornecedor — nomes que confundem facilmente na execução manual. (2) O ticket foi homologado **sem registrar qual critério de identificação do comprador ficou valendo**; o fonte publicado mostra **dois mecanismos distintos** convivendo hoje — a busca da instância de negociação (`getProcessIdNegotiation`) aqui, e a comparação direta `matriculaComprador !== userService.getActualUser().userCode` na tela de *Validação Inicial*. **Não há um ponto único**, o que é a recomendação estrutural registrada no próprio ticket e segue pendente.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4159  (ambos · Concluído · SDCASSI-311)

**Título:** Definir o vencedor de uma cotação no Portal do Comprador e receber confirmação de sucesso — ou uma mensagem que diga por que falhou.

**Origem:** FSWTBC-4159 — "Ocorreu uma falha na atualização do vencedor" ao definir vencedor (etapa
GRAVAVENCEDOR, UCOME034). Homologado sem causa registrada; a mesma etapa tem histórico de três defeitos
distintos (falha, reprocessamento não idempotente, fila travada).

**Módulo/Rota:** Fluig → **Portal do Comprador** → **Definir Vencedor Cotação** (rota interna
`/propostaVencedora`, mesmo componente da Avaliação de Propostas com `definindoVencedor=true`) → botão de
envio dos vencedores.

**Pré-condições**
- Conta com matrícula de comprador; cotação própria com propostas recebidas e vigente.
- **Bloqueio:** conta de QA não resolve comprador; `getEvalQuotesDhuERP` responde 404 (ambiente) —
  grade vazia.

**Passos**
1. Abrir **Definir Vencedor Cotação**, localizar a cotação, marcar o fornecedor vencedor por item.
2. Confirmar o envio.
3. Ler a notificação.
4. Abrir o **Histórico** da SC e a aba **Solicitacoes ZZY** do Logs Protheus filtrando pela SC.
5. Reenviar o **mesmo** vencedor (teste de idempotência).

**Resultado esperado**
- Passo 3: notificação **"…foi atualizada com os vencedores!"** (sucesso).
- Passo 4: SC sai de **"Aguarda Finalizar Cotação" (161)** para a etapa seguinte; ZZY com
  **Rotina = GRAVAVENCEDOR** e status processado.
- Passo 5: reenvio **não** gera erro genérico; ou é aceito como no-op ou exibe mensagem específica
  ("cotação já finalizada").
- Em qualquer falha, a mensagem **identifica a causa** (regra de negócio × integração × fila).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro **"Ocorreu uma falha na atualização do vencedor!"** sem detalhe, para qualquer causa.

**Severidade:** Alta

**Preparação de massa:** cotação do executor com ≥ 1 proposta — exige fornecedor cooperante (Portal do
Fornecedor sem credencial).

**Verificado em tela:** PARCIAL
**O que foi verificado:** no `pc_main.js`, o par literal
`"…foi atualizada com os vencedores!"` / `poNotification.error("Ocorreu uma falha na atualização do
vencedor!")`, no mesmo `catch`; e o par irmão para valores da cotação (*"Ocorreu uma falha na
atualização os valores da cotação!"*). Portal aberto; conta sem comprador.
**Divergências encontradas:** (1) a mensagem real termina em **"!"** (o ticket não traz); (2) o
`catch` é **único** — regra, integração e fila caem no mesmo texto: o caso reprova por desenho se a
causa não for exibida; (3) texto irmão com erro de concordância ("atualização **os** valores").
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4178  (fluig · Concluído · SDCASSI-313 · incidente SD804867)

**Título:** Medir quantas requisições cada tela de Compras dispara para renderizar, e confirmar que consultas idênticas não são repetidas.

**Origem:** FSWTBC-4178 — a tela estava gerando **mais de 400 requisições**; o cliente (CAST) pediu refatoração em dois níveis: **reaproveitar** o resultado de consultas já feitas com o mesmo filtro, e, **quando os filtros diferirem mas a filial for a mesma, fazer uma única consulta com todos os filtros** e distribuir o retorno. A fábrica respondeu em 24h que *"é item a ser tratado como MELHORIA, por gentileza abrir a solicitação como melhoria"* e o ticket foi **encerrado por reclassificação, não por correção**. **Não há, nesta base, ticket subsequente com essa refatoração — as 400+ requisições permanecem.**

**Módulo/Rota:** telas de Compras que consomem dataset por item: **Portal do Comprador** (`/portal/p/1/portal-do-comprador` e suas rotas), **Gerência de Compras** (`/portal/p/1/gerenciaCompras`), **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) e seu modal **Solicitação de Compra**, e o formulário `wf_solicitacao_compras`.

**Pré-condições**
- Navegador com a aba **Rede** (DevTools) aberta e o filtro limpo antes de cada carga.
- Conta com matrícula de comprador resolvida, para que as grades **venham populadas** — é a condição em que o volume aparece. Com a grade vazia, o número medido é o **piso**, não o cenário do ticket.
- Massa de **volume**: filial com muitos fornecedores/itens, e uma cotação com vários fornecedores participantes.
- **Bloqueio:** parcial — a conta de QA não popula as grades do Portal do Comprador, então o número do ticket (400+) **não é reprodutível com esta conta**. Os pisos foram medidos e estão abaixo.

**Passos**
1. Abrir DevTools › **Rede**, limpar, e carregar `/portal/p/1/acompanhamentoContrato`. Anotar o total de requisições e quantas são `POST /api/public/ecm/dataset/datasets`.
2. Na coluna **Ação**, abrir **um** modal de **Solicitação de Compra**. Anotar quantas requisições **adicionais** a abertura de um único modal dispara.
3. No corpo das chamadas de dataset do passo 2, ler o campo `name` de cada uma e **contar repetições do mesmo nome de dataset**.
4. Limpar a rede e carregar `/portal/p/1/portal-do-comprador`; repetir para `#/controleCotacao`, `#/avaliacaoPropostas` e `#/propostaVencedora`.
5. Limpar e carregar `/portal/p/1/gerenciaCompras`; alternar entre as abas **Atribuir** e **Transferir** e anotar as requisições de cada alternância.
6. Limpar e abrir o formulário `wf_solicitacao_compras` em branco. Anotar o total.
7. Na **Validação Inicial** do Portal do Comprador, abrir uma solicitação com **mais de 10 fornecedores** e conferir se todos os fornecedores aparecem identificados (razão social/CNPJ) ou se, a partir do décimo primeiro, aparece apenas o **código bruto** `codigo-loja`.

**Resultado esperado**
- Nenhuma tela dispara **400 ou mais** requisições para renderizar.
- **Nenhum dataset é chamado duas vezes com o mesmo filtro** na mesma renderização — consulta idêntica é reaproveitada (memoização por filtro, nível 1 do pedido do cliente).
- Consultas que diferem só no filtro **mas compartilham a filial** são agrupadas em **uma** chamada, e o retorno é distribuído (nível 2 do pedido do cliente).
- Passo 7: **todos** os fornecedores aparecem identificados, independentemente da quantidade — não há corte silencioso.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia — e que, neste caso, nunca deixou de existir)*
- A tela dispara **mais de 400 requisições** para renderizar (evidência do ticket: prints `10144.png` e `10148.png`, aba de rede do navegador), com lentidão percebida pelo usuário e pressão sobre o servidor de datasets — o que ajuda a explicar a lentidão geral relatada em outros tickets do mesmo período.

**Severidade:** Média *(não corrompe dado e não bloqueia o fluxo, mas degrada um ambiente compartilhado e a percepção de uso; a classificação da fábrica como "melhoria" é defensável contratualmente e discutível tecnicamente — 400 requisições por tela é defeito de desempenho)*

**Preparação de massa:** uma filial com **volume alto** de itens/fornecedores e uma cotação com **mais de 10 fornecedores participantes** (para o passo 7), sob responsabilidade do comprador executor. Sem volume, o teste mede o piso e passa por acidente. **Antes de executar, defina com o time o limite aceitável** — hoje não existe número acordado, e sem ele o caso não tem critério de reprovação objetivo.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Medido nesta sessão, com a grade do comprador vazia (portanto, o piso):*

| Tela | Requisições | Chamadas de dataset |
|---|---|---|
| `/portal/p/1/acompanhamentoContrato` (845 linhas) | **96** | 4 |
| **+ abrir 1 modal de Solicitação de Compra** | **+15** | **+14** |
| `/portal/p/1/portal-do-comprador` (grade vazia) | **107** | 2 |
| `/portal/p/1/gerenciaCompras` | **97** | 0 na carga |
| `wf_solicitacao_compras` — formulário **em branco** | **165** | 2 |
| `wf_faturamento_contratos` — formulário **em branco** | **163** | — |

Nas **14 chamadas de dataset** disparadas ao abrir **um único** modal de Solicitação de Compra, três datasets foram chamados **mais de uma vez**: `dsProtheus_getCentroCusto_restGetAll` **3×**, `dsProtheus_getProdutos_restGetAll` **2×** e `dsProtheus_getRateiosContratos_restGetAll` **2×**. *Lido no fonte publicado* — no bundle do Portal do Comprador existe a constante **`MAX_CONSULTAS_FORNECEDOR = 10`**, usada num laço `for (let a = 0; a < n.length; a++)` que chama `supplierService.getSuppliers({codeSupplier, storeSupplier})` **uma vez por fornecedor**, e **só para os 10 primeiros**; do 11º em diante o registro fica com o identificador bruto `codigo-loja`. Não há qualquer estrutura de cache/memoização no bundle (a palavra `cache` aparece 4 vezes, nenhuma como cache de consulta).
**Divergências encontradas:** três, todas relevantes. (1) **O ticket está marcado "Concluído / Feito", mas nada foi corrigido** — foi encerrado com o pedido de reabrir como melhoria. O caso acima, portanto, **hoje reprova**, e isso é esperado. (2) O padrão **N+1 continua no fonte publicado**: uma consulta por fornecedor dentro de um laço. O que existe **não é** nenhuma das duas soluções pedidas pelo cliente — é um **corte em 10**, que troca o problema de desempenho por um problema de **dado incompleto** (do 11º fornecedor em diante o usuário vê `codigo-loja` em vez de nome), e isso **não está documentado em lugar nenhum**. Recomendo tratar esse corte como achado próprio, a confirmar com o time. (3) O ticket diz "a tela" sem identificar qual; a medição acima mostra que **o pior caso não é o Portal do Comprador**, e sim o **formulário da SC em branco, com 165 requisições sem nenhum dado carregado**.
**Dados/massa usados:** nenhum — só carga de tela e abertura de um modal em leitura; nada submetido.

---

## CT-FSWTBC-4207  (ambos · Concluído · SDCASSI-318)

**Título:** Alterar a data de validade de uma cotação no Portal do Comprador e vê-la refletida na grade sem esperar a sincronização.

**Origem:** FSWTBC-4207 — o vencimento alterado só aparecia após a execução do dataset sincronizado
(1 h). Paliativo: intervalo reduzido para **15 min**; tempo real ficou como melhoria não aberta.

**Módulo/Rota:** Fluig → **Portal do Comprador** → **Avaliação de Propostas** → menu de ações da linha →
**Alterar Data de Validade** · coluna de validade da proposta na grade.

**Pré-condições**
- Conta com matrícula de comprador; cotação própria vigente.
- **Bloqueio:** conta de QA sem comprador; `getEvalQuotesDhuERP` 404 (ambiente).

**Passos**
1. Anotar a validade exibida na grade para a cotação.
2. **Alterar Data de Validade** para D+7 e confirmar.
3. Recarregar a grade imediatamente; anotar o valor e a hora.
4. Recarregar a cada 5 min até 20 min.

**Resultado esperado**
- Passo 3: mensagem de sucesso da alteração.
- A grade exibe **D+7** em **no máximo 15 minutos** (comportamento documentado hoje); o ideal, e o que
  o caso deve registrar como pendência, é **imediato**.
- Enquanto o valor antigo persistir, a tela **avisa** que o dado pode estar defasado
  (`<não documentado>` — hoje não há aviso).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Validade antiga permanece por até 1 h; cotação aparece vencida/vigente ao contrário do real
  (SC 10261 cot. 000022 fil. 4203; SC 10262 cot. 000025 fil. 220).

**Severidade:** Média

**Preparação de massa:** cotação do executor em Avaliação de Propostas.

**Verificado em tela:** PARCIAL
**O que foi verificado:** ação **"Alterar Data de Validade"** presente no menu da linha no fonte do
Portal (`pc_main.js`), ao lado de *Analisar Cotação*, *Ver Itens*, *Cancelar Solicitação*; campo
`validadeCotacao` no `formAprovacao`. Portal aberto; conta sem comprador.
**Divergências encontradas:** (1) a defasagem de até 15 min é **característica não documentada** para
o usuário — nada na tela indica que o dado é sincronizado; (2) o intervalo é configuração de dataset,
não verificável pela conta de QA (`pageschedulers` 404).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4232  (ambos · Concluído · SDCASSI-323)

**Título:** Informar a "Data de Validade da Cotação" na validação do comprador e ver a cotação nascer com exatamente essa data.

**Origem:** FSWTBC-4232 — a cotação abria com data diferente da informada: a rotina padrão só gravava
validade no envio de novas propostas, não na inclusão. Correção em `UCOME021.data.tlpp` (C8_VALIDA
gravado no mesmo RecLock de C8_TPDOC, só se não vazio).

**Módulo/Rota:** Fluig → **Portal do Comprador** → **Validação do Comprador** da SC (campo
`validadeCotacao`) → após **Aguarda Geração da Cotação (328)**, **Avaliação de Propostas** (coluna de
validade da proposta) e **Tracker**, *Filtrar por* = **Cotação de Produtos/Serviços**, filtro
**Nº da Cotação**.

**Pré-condições**
- Conta com matrícula de comprador; SC própria em **Validação do Comprador (119)**.
- **Bloqueio:** conta de QA sem comprador; `getQuotesDhuERP` 404 (ambiente).

**Passos**
1. Na Validação do Comprador, informar **Data de Validade da Cotação** = D+10 e concluir.
2. Acompanhar o Histórico até sair de **"Aguarda Geração da Cotação" (328)**.
3. Em **Avaliação de Propostas**, ler a validade exibida para a cotação gerada.
4. No Tracker, filtrar a cotação pelo **Nº da Cotação** e conferir a data.
5. Repetir deixando a data **em branco**.

**Resultado esperado**
- Passos 3–4: validade = **D+10** — não a data default do ERP.
- Passo 5: cotação com a validade default do ERP, sem erro (regra "só grava se não vazio").
- O tipo de documento da cotação permanece correto (C8_TPDOC gravado junto).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Cotação aberta com data divergente da informada pelo comprador.

**Severidade:** Média

**Preparação de massa:** SC do executor em Validação do Comprador.

**Verificado em tela:** PARCIAL
**O que foi verificado:** `validadeCotacao` no `formAprovacao` do Portal (fonte publicado); grade com
`validProposta: formatDate(...)` e `emissaoCotacao`; **328 "Aguarda Geração da Cotação"** por dado (52
movimentos). Tracker aberto com **Nº da Cotação** e *Filtrar por* incluindo **Cotação de
Produtos/Serviços**.
**Divergências encontradas:** (1) a etapa aparece como **"Aguarda Geração da Cotação"** — o ticket não
a nomeia; (2) a data só é conferível no Fluig via grade/Tracker (dado sincronizado com até 15 min de
atraso — ver CT-FSWTBC-4207); (3) rótulo exato do campo na tela do Portal não confirmado (grade não
renderiza para a conta de QA).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4287  (fluig · Concluído · SDCASSI-333)

**Título:** Conferir que a lista de itens da SC chega íntegra ao gestor orçamentário na finalização e que o fornecedor recebe apenas os itens da cotação de que participa.

**Origem:** FSWTBC-4287 — duas inconsistências **espelhadas** nos templates de e-mail: no e-mail de **finalização da compra** enviado ao **gestor orçamentário** os **itens não aparecem**; no e-mail de **Participação de Cotação** enviado ao **fornecedor** há exibição incorreta de **múltiplos itens**. Mesma raiz: a montagem da lista de itens no template — num caso o laço não produz nenhuma linha, no outro produz linhas demais. Francisco registrou que *"ajustou a lógica das funções e enviou o arquivo para o Calixto publicar"*, **sem detalhar quais funções nem qual template**. Subtarefa FSWTBC-4313.

**Módulo/Rota:** `wf_solicitacao_compras` — atividade **`185 - Disparo de E-mails`**, com captura em `187 - Captura de Erro - Disparo de E-mails`. Origem dos dados: seção *Identificação do(s) Produto(s)/Serviço(s)* › grade **Produtos/Serviços da Solicitação** do formulário da SC; e, para o e-mail ao fornecedor, a cotação e seus participantes.

> **Sem superfície de front-end para o artefato defeituoso.** O que está errado é o **corpo do e-mail**, e o Fluig **não expõe** visualizador de mensagem enviada, prévia de template nem caixa de saída consultável pela interface. O caso ancora no que **é** observável no Fluig — a grade de itens do formulário (a fonte da lista), a composição de participantes da cotação e o Histórico da atividade 185 — e a conferência final do corpo do e-mail **só pode ser feita fora do Fluig**, na caixa do destinatário.

**Pré-condições**
- **(a)** Uma SC com **três ou mais itens de valores distintos**, levada até a finalização da compra, com **gestor orçamentário** definido.
- **(b)** Uma cotação com **pelo menos dois fornecedores participantes**, cada um convidado para um **subconjunto diferente** de itens — é a única configuração que expõe o defeito de "itens demais".
- Acesso às caixas postais do gestor orçamentário e dos fornecedores (ou cópia dos disparos) — **fora do Fluig**.
- **Bloqueio:** sim. A conta de QA não conclui o ciclo até `185 - Disparo de E-mails` (depende de gestor, alçada e integração com o ERP), não tem credencial de fornecedor e não tem acesso a caixa postal alguma. Nenhuma das duas metades é executável ponta a ponta por esta conta.

**Passos**
1. Abrir a SC preparada e, na seção *Identificação do(s) Produto(s)/Serviço(s)*, **anotar a lista completa** da grade **Produtos/Serviços da Solicitação**: item, produto/serviço, quantidade, preço unitário e valor total de cada linha.
2. Levar a SC até a finalização da compra (atividade `185 - Disparo de E-mails`).
3. Na aba **Histórico**, confirmar a passagem por `185 - Disparo de E-mails` **sem** registro em `187 - Captura de Erro - Disparo de E-mails`.
4. **Fora do Fluig:** abrir o e-mail de **finalização da compra** recebido pelo **gestor orçamentário**.
5. Comparar a lista de itens do e-mail, **linha a linha**, com o que foi anotado no passo 1.
6. Na cotação preparada em (b), anotar **quais itens** foram atribuídos a **cada** fornecedor participante.
7. **Fora do Fluig:** abrir o e-mail de **Participação de Cotação** recebido por **cada** fornecedor.
8. Comparar os itens listados em cada e-mail com o subconjunto anotado no passo 6.

**Resultado esperado**
- Passo 3: `185 - Disparo de E-mails` conclui, sem entrada em `187 - Captura de Erro`.
- Passo 5: o e-mail ao gestor orçamentário lista **todos** os itens da SC — **mesma quantidade de linhas** da grade do formulário —, cada linha com produto, quantidade e valor idênticos aos do formulário. **Nenhum e-mail de finalização sai sem itens.**
- Passo 8: cada fornecedor recebe **exatamente** os itens da sua participação — **nem a mais, nem a menos**. Nenhum item de outro fornecedor ou de outra cotação aparece.
- Nenhuma linha duplicada em nenhum dos dois e-mails.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- E-mail de **finalização da compra** ao gestor orçamentário **sem nenhum item listado** — justamente quem precisa da informação para a conferência orçamentária recebe a mensagem vazia.
- E-mail de **Participação de Cotação** ao fornecedor com **múltiplos itens exibidos incorretamente** — fornecedor com proposta não ganhadora recebendo itens que não correspondem à sua participação, o que é pior por ser **comunicação externa**, com risco de expor itens de outra cotação.

**Severidade:** Alta *(o e-mail ao fornecedor é comunicação externa e pode expor itens de outra cotação; e o gestor orçamentário aprova sem enxergar o que está sendo comprado — os dois lados têm efeito fora do sistema)*

**Preparação de massa:** **(a)** uma SC com 3+ itens de valores distintos levada até o disparo de e-mail, com gestor orçamentário definido; **(b)** uma cotação com 2+ fornecedores, cada um em um subconjunto **diferente** de itens; **(c)** acesso às caixas postais de gestor e fornecedores. Nada disso é criável ou acessível pela conta de QA. **Risco de entrega registrado no ticket e que este caso não cobre:** a correção foi publicada como **arquivo de template enviado por uma pessoa para outra publicar manualmente**, e **não há registro de quais funções/templates foram alterados nem de onde ficaram versionados**. Se o template for republicado a partir de outra origem, **a correção se perde sem aviso** — e nenhum teste de e-mail detecta isso antes do próximo disparo real. Recomendo perguntar ao time onde esses templates estão versionados.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — o processo `wf_solicitacao_compras` abre e traz as abas **Formulário / Informações / Histórico / Anexos**; a aba **Histórico**, onde se lê o resultado do passo 3, existe. *Lido no fonte publicado* — o mapa de atividades do widget da SC confirma **`disparoEmails: 185`**, e a grade de propostas por fornecedor (`tbProposta_*`, com `numCotacao`, `codFornecedor`, `lojFornecedor`, `nomFornecedor`, `numProposta`) é a estrutura que liga fornecedor a proposta. **Nenhum e-mail foi aberto e nenhuma SC chegou a 185 nesta sessão.**
**Divergências encontradas:** o ticket trata "os templates" como uma coisa só; são **dois destinatários e dois momentos diferentes do fluxo** — finalização da compra ao **gestor orçamentário** e Participação de Cotação ao **fornecedor** —, e o caso precisa de **massa distinta** para cada um (a segunda metade exige dois fornecedores em subconjuntos diferentes de itens, coisa que o ticket não menciona). Executar só a primeira metade e dar o caso por coberto deixaria descoberto justamente o lado de **comunicação externa**, que é o mais grave dos dois.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4299  (fluig · Concluído · SDCASSI-337)

**Título:** Exportar os dados de uma cotação pelo Portal do Comprador e confirmar que a planilha é gerada — e que, não havendo dados, o usuário é avisado em vez de nada acontecer.

**Origem:** FSWTBC-4299 — o botão **"Exportar"** não funcionava na **SC 9966**: ao acionar, **nenhuma ação ocorria**, impedindo a extração das informações. **Falha silenciosa de interface** — do ponto de vista do usuário, indistinguível de lentidão ou de clique não registrado, o que atrasa o reporte. Corrigido no mesmo dia, **sem nenhum comentário técnico**: não há registro de causa nem do que foi alterado.

**Módulo/Rota:** **Portal do Comprador** — dois controles distintos, e o caso cobre os **dois**:
(a) **Controle De Cotações** (`#/controleCotacao`) › botão **Exportar Dados**;
(b) **Avaliação de Propostas** (`#/avaliacaoPropostas`) e **Definir Vencedor Cotação** (`#/propostaVencedora`) › ao abrir a cotação, botão **Exportar**.

**Pré-condições**
- Conta com matrícula de comprador resolvida e cotações listadas nas grades.
- Uma cotação **com** propostas de fornecedor recebidas (caminho feliz) **e** uma cotação **sem** nenhuma proposta recebida (caminho de dado ausente).
- Navegador com download permitido para o domínio.
- **Bloqueio:** sim — a conta de QA não resolve matrícula de comprador; as três grades vêm vazias e os botões de exportação não são alcançáveis a partir de uma linha.

**Passos**
1. Abrir **Portal do Comprador** › **Controle De Cotações** e clicar em **Exportar Dados**.
2. Confirmar que um arquivo é baixado e abri-lo.
3. Abrir **Avaliação de Propostas**, abrir uma cotação **com propostas recebidas** e clicar em **Exportar**.
4. Abrir a planilha baixada e conferir o conteúdo.
5. Conferir que há **uma aba/bloco por proposta**, cada um encabeçado por **"Proposta Nº: ⟨número⟩"**.
6. Conferir o cabeçalho de resumo de cada proposta: **Data Proposta · Validade · Valor do Frete Total · Saving · Tipo de Frete · Cond. Pgto · Valor Total**.
7. Conferir as colunas de itens: **Item · Produto · Descrição · Grupo · Unid. Medida · Quantidade · Valor Referência SC · Val. Unit. Cotado** (e demais).
8. Conferir que a quantidade de linhas de item bate com a quantidade de itens da cotação em tela.
9. Repetir o passo 3 numa cotação **sem nenhuma proposta recebida** e observar o que acontece.
10. Repetir o passo 3 e, **durante** a exportação, simular perda de conexão (modo offline do DevTools); observar o que acontece.

**Resultado esperado**
- Passos 1 a 4: o clique **produz efeito visível** — indicador de carregamento e, em seguida, download de uma planilha. **Em nenhuma hipótese o botão fica inerte.**
- Passos 5 a 8: a planilha traz um bloco por proposta com o título **"Proposta Nº: ⟨número⟩"**, o cabeçalho de resumo e as colunas de itens acima, e os valores conferem com os exibidos em tela.
- Passo 9: **não havendo propostas**, aparece a caixa **"Nenhum dado encontrado"** com a mensagem **"Não foram encontradas propostas para este fornecedor na cotação selecionada."** — o usuário é **avisado**, e nenhum arquivo vazio é baixado.
- Passo 10: falhando a comunicação, aparece a caixa **"Erro ao exportar"** com **"Não foi possível comunicar com o servidor. Verifique sua conexão e tente novamente."**
- O indicador de carregamento é **desligado em todos os desfechos**, inclusive nos de erro — a tela não fica travada.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Clicar em **Exportar** e **nada acontecer**: sem download, sem mensagem, sem erro visível (relatado na **SC 9966**). O usuário não distingue defeito de lentidão, e o problema só vira chamado quando alguém repara.

**Severidade:** Baixa *(é apresentação/usabilidade: não corrompe dado, não bloqueia o fluxo da compra e há caminho alternativo para obter a informação. A gravidade real está no **padrão** — ação de interface que falha sem mensagem —, que se repete em toda esta base)*

**Preparação de massa:** duas cotações sob responsabilidade do comprador executor: **uma com** propostas de fornecedor recebidas e **uma sem** nenhuma. A segunda é a que prova a correção da falha silenciosa e é a que costuma faltar. **Não criável pela conta de QA.**

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — as rotas `#/controleCotacao`, `#/avaliacaoPropostas` e `#/propostaVencedora` abrem; nenhuma linha foi listada, então **nenhum botão de exportação foi acionado**. *Lido no fonte publicado* — existem **dois** rótulos distintos, ambos com o ícone `an an-microsoft-excel-logo`: **"Exportar"** (`p-kind: primary`, dentro do modal da cotação, ao lado de *Ver Solicitação da Compra* e *Ver todos Anexos*) e **"Exportar Dados"** (na barra de ações do Controle de Cotações, ao lado de *Alterar Data de Validade* e *Bloquear Novos Participantes*). A função `exportDataSupplierQuotes` monta a planilha com a biblioteca de XLSX (`book_new` / `aoa_to_sheet`), um bloco por proposta com o título `Proposta Nº: ⟨C8_NUMPRO⟩`, o cabeçalho `Data Proposta | Validade | Valor do Frete Total | Saving | Tipo de Frete | Cond. Pgto | Valor Total` e as colunas de item `Item | Produto | Descrição | Grupo | Unid. Medida | Quantidade | Valor Referência SC | Val. Unit. Cotado …`. A função chamadora `exportDataQuoteSupplier` trata **os dois desfechos de falha** com as caixas literais transcritas nos passos 9 e 10, e desliga o indicador de carregamento num bloco `finally`. **Nenhuma exportação foi executada.**
**Divergências encontradas:** o ticket fala de **"o botão Exportar"**, no singular; hoje existem **dois** controles com rótulos diferentes e em telas diferentes — **"Exportar"** e **"Exportar Dados"** —, e o ticket não diz qual deles falhava na SC 9966. Um caso de regressão que exercitasse só um dos dois deixaria o outro descoberto; por isso os passos cobrem ambos. Observação favorável: o tratamento explícito de "sem dados" e de "falha de comunicação" que está no fonte publicado **é exatamente o antídoto da falha silenciosa** relatada, ainda que nenhum comentário do ticket o registre.
**Dados/massa usados:** nenhum — não submetido, nenhum arquivo baixado.

---

## CT-FSWTBC-4300  (fluig · Concluído · SDCASSI-338)

**Título:** Reprovar uma solicitação na Validação Inicial do comprador informando só a justificativa — e confirmar que quem não é o responsável recebe mensagem em vez de um botão inerte.

**Origem:** FSWTBC-4300 — a ação de **reprovação** não funcionava na **SC 10675**, impedindo a continuidade do fluxo; e pedido adicional de **remover campos desnecessários** da etapa de reprovação. O ticket reúne **dois problemas distintos**, ambos esclarecidos por Paulo Calixto: **(1)** a movimentação não ocorria porque o responsável (Arthur) havia sido **removido do grupo `G.P.Requisicao_de_Compras_Validacao_Compradores`**, o que o impedia de atuar como comprador — **não era defeito, mas o sistema não informava o motivo**, deixando o usuário diante de um botão que não faz nada; **(2)** o popup de reprovação **exigia o preenchimento de todos os campos** para concluir (confirmado por João Vitor na SC 10678), vários deles sem sentido numa reprovação — os campos foram removidos do popup.

**Módulo/Rota:** **Portal do Comprador** › **Validação Inicial** (`#/validacaoInicial`) › ações **Aprovar** / **Reprovar** da solicitação › modal de confirmação. No BPM corresponde à atividade **`119 - Validação do Comprador`**.

**Pré-condições**
- Uma SC em `119 - Validação do Comprador`, com **status "pronto"** (na etapa de validação do comprador) e **matrícula de comprador igual** à da conta executora.
- Uma **segunda** conta de comprador, **não responsável** por essa SC, para a contraprova.
- Uma terceira SC atribuída a um usuário que tenha sido **removido** do grupo `G.P.Requisicao_de_Compras_Validacao_Compradores`, para reproduzir o cenário (1).
- **Bloqueio:** sim. (a) A conta de QA não resolve matrícula de comprador, então a *Validação Inicial* não lista solicitação alguma. (b) O cenário (1) exige **alterar a composição de um grupo de segurança**, o que requer perfil de administrador — **não disponível** — e não deve ser feito num grupo real de produção.

**Passos**
1. Abrir **Portal do Comprador** › **Validação Inicial**.
2. Conferir que a solicitação preparada aparece na lista e que o contador (badge) do menu **Validação Inicial** reflete a quantidade pendente.
3. Selecionar a solicitação e acionar a ação **Reprovar**.
4. No modal que abre, conferir que o campo de justificativa está rotulado **"Justificativa para a reprovação"** — e não "…para a aprovação".
5. Conferir **quais campos o modal exibe**: numa **reprovação**, os campos que só fazem sentido numa aprovação (tipo de compra, resumo do fornecedor, validade da cotação, dispensa de cotação, seleção de fornecedores) **não devem estar presentes**.
6. Deixar a **justificativa vazia** e tentar confirmar — observar a crítica, **sem** concluir.
7. Preencher a justificativa com `QA reprovacao - regressao SDCASSI-338` e confirmar (o botão de confirmação deve estar rotulado **Reprovar**).
8. Observar a mensagem de resultado e conferir que a solicitação sai da lista de pendentes.
9. Acionar **Aprovar** em outra solicitação e conferir que o rótulo do campo muda para **"Justificativa para a aprovação"**, que os campos de aprovação **reaparecem** e que o botão de confirmação passa a **Aprovar**.
10. **(Contraprova de responsabilidade)** Com a **segunda** conta, não responsável, acionar **Reprovar** na mesma solicitação e ler a mensagem.
11. **(Cenário 1)** Com o usuário **removido do grupo**, acionar **Reprovar** e ler a mensagem.
12. **(Contraprova de etapa)** Acionar **Reprovar** numa solicitação que **ainda não chegou** à validação do comprador e ler a mensagem.

**Resultado esperado**
- Passo 4/9: o rótulo **e** o placeholder do campo alternam entre **"Justificativa para a reprovação"** e **"Justificativa para a aprovação"** conforme a ação, e o botão de confirmação alterna entre **Reprovar** e **Aprovar**.
- Passo 5: na reprovação o modal exibe **apenas** o que é necessário para reprovar — a justificativa. Os campos exclusivos de aprovação **não são exibidos** e, portanto, **não podem ser exigidos**.
- Passo 6: a confirmação é recusada enquanto a justificativa estiver vazia, e **nada é movimentado**.
- Passo 7/8: a reprovação conclui e aparece a caixa **"Sucesso!"** com **"A solicitação foi reprovada!"**; a solicitação sai da lista e o contador do menu é atualizado.
- Passo 10 e 11: a conta que **não é a responsável** é barrada **com mensagem**: caixa **"Ops!"** com **"A solicitação não é sua responsabilidade!"**. **O botão nunca fica inerte.**
- Passo 12: solicitação fora da etapa é barrada com **"Não é possível reprovar solicitações que ainda não estão na etapa de validação do comprador."** (e, simetricamente, *"…aprovar…"* na ação de aprovação).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- **(1)** A ação de reprovação **não produz efeito nenhum** e o fluxo não continua (relatado na **SC 10675**) — sem mensagem, sem indicação de que a causa é a ausência do usuário no grupo `G.P.Requisicao_de_Compras_Validacao_Compradores`. Configuração de acesso indistinguível de defeito de sistema.
- **(2)** O popup de reprovação **exige o preenchimento de todos os campos** para concluir (confirmado na SC 10678), inclusive de campos que não fazem sentido numa reprovação — o que leva o usuário a preencher qualquer coisa só para conseguir sair.

**Severidade:** Alta *(é uma etapa de decisão do fluxo de compras: a reprovação travada bloqueia a SC, e a exigência de preencher campos irrelevantes para reprovar induz o usuário a inserir dado falso num registro de aprovação/alçada)*

**Preparação de massa:** três solicitações em `119 - Validação do Comprador`: uma para a conta executora reprovar, uma para aprovar (passo 9) e uma para a contraprova de responsabilidade (passo 10); mais **duas contas de comprador distintas**. Para o passo 11, é preciso um usuário **fora** do grupo `G.P.Requisicao_de_Compras_Validacao_Compradores`, o que exige **administrador** e deve ser feito com **grupo e usuário de teste**, nunca alterando a composição de um grupo real. Para o passo 12, uma SC ainda **antes** da validação do comprador. **Nada disso é criável pela conta de QA.**

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — o Portal do Comprador abre e o painel **Acesso Rápido** traz o atalho **Validação Inicial**; o item também aparece no menu lateral do widget, com **badge de contagem**. Nenhuma solicitação foi listada (limitação de conta), então **nenhuma reprovação foi acionada**. *Lido no fonte publicado* — a rota `validacaoInicial` existe (uma das quatro do widget, ao lado de `controleCotacao`, `avaliacaoPropostas` e `propostaVencedora`); as ações da lista são **`{label: "Aprovar", icon: "an an-check"}`** e **`{label: "Reprovar", icon: "po-icon an an-minus"}`**, ambas chamando `processar(item, true|false)`. Em `processar`, **antes** de abrir o modal, há **duas guardas com mensagem explícita**: se `status !== "pronto"` → caixa *"Ops!"* com *"Não é possível ⟨aprovar|reprovar⟩ solicitações que ainda não estão na etapa de validação do comprador."*; e se `matriculaComprador !== userService.getActualUser().userCode` → caixa *"Ops!"* com **"A solicitação não é sua responsabilidade!"**. O rótulo e o placeholder do campo de justificativa são ligados à expressão `responseAprove ? "Justificativa para a aprovação" : "Justificativa para a reprovação"`, e **vários campos do modal estão sob `*ngIf="responseAprove"`** — ou seja, **são renderizados apenas na aprovação** —, o que é a implementação da remoção de campos pedida no item (2) do ticket. O rótulo do botão de confirmação é `this.confirmAprovacao.label = this.responseAprove ? "Aprovar" : "Reprovar"`. A conclusão notifica *"Sucesso!"* com *"A solicitação foi ⟨aprovada|reprovada⟩!"*. **Nada foi aprovado nem reprovado.**
**Divergências encontradas:** duas. (1) O ticket fala em "campos da etapa de reprovação"; na tela de hoje esses campos **não foram removidos do formulário** — eles são **condicionalmente ocultados** na reprovação (`*ngIf` sobre `responseAprove`) e continuam existindo na aprovação. A distinção importa para quem for executar: o passo 5 deve conferir **ausência na reprovação e presença na aprovação**, não ausência absoluta. (2) O item (1) do ticket — o usuário removido do grupo — **hoje tem mensagem**, e ela é a comparação direta de matrícula (`"A solicitação não é sua responsabilidade!"`), não uma verificação de pertencimento ao grupo `G.P.Requisicao_de_Compras_Validacao_Compradores`. **São coisas diferentes:** um usuário fora do grupo pode continuar tendo sua matrícula gravada como responsável na SC, e nesse caso a guarda do portal **passa**, e o bloqueio volta a ocorrer mais adiante, no Fluig, possivelmente de novo em silêncio. **Recomendo confirmar esse cenário específico com o time** — ele é o que o ticket relatou e é o que a guarda atual **não** cobre.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4302  (fluig · Concluído · SDCASSI-340)

**Título:** Acionar "Ver Solicitação da Compra" durante a cotação e confirmar que a SC abre completa, nas duas telas onde a ação existe.

**Origem:** FSWTBC-4302 — na etapa de cotação, a ação **"Ver Solicitação de Compra"** não exibia a SC com todas as informações. Lacuna de contexto para quem decide: o comprador, ao cotar, precisa ver a solicitação completa (itens, quantidades, justificativa, centro de custo) para avaliar as propostas. O aceite do cliente confirma a correção em **duas telas distintas** — *Controle de Cotação* e *Avaliação de Propostas* —, o que indica que a visualização completa foi padronizada nos dois pontos. Homologado **sem registro do que foi alterado**.

**Módulo/Rota:** **Portal do Comprador** › **Controle De Cotações** (`#/controleCotacao`) **e** **Avaliação de Propostas** (`#/avaliacaoPropostas`) › ao abrir a cotação, botão **Ver Solicitação da Compra**. A ação abre a SC em nova aba, em `/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=⟨nº⟩&app_ecm_workflowview_taskLoadViewMode=true`.

**Pré-condições**
- Conta com matrícula de comprador resolvida e uma cotação em cada uma das duas telas.
- A SC de origem precisa ter **conteúdo suficiente para provar completude**: **vários itens**, justificativa preenchida, **rateio por centro de custo** e anexos.
- Navegador com **pop-ups permitidos** para o domínio — a ação abre em nova aba.
- **Bloqueio:** sim — a conta de QA não resolve matrícula de comprador; as grades vêm vazias e nenhuma cotação pode ser aberta.

**Passos**
1. Abrir **Portal do Comprador** › **Controle De Cotações** e abrir uma cotação.
2. Clicar em **Ver Solicitação da Compra**.
3. Confirmar que **abre uma nova aba** com a solicitação, e não uma janela em branco.
4. Na SC aberta, conferir a presença das abas **Formulário**, **Informações**, **Histórico** e **Anexos**.
5. No **Formulário**, conferir a seção *Identificação do(s) Produto(s)/Serviço(s)* e a grade **Produtos/Serviços da Solicitação** com **todos** os itens (item, produto/serviço, quantidade, preço unitário estimado, valor total estimado).
6. Conferir a **justificativa** da solicitação e a seção **Rateio por Centro de Custo**.
7. Conferir que a SC abre em **modo de visualização** — somente leitura, sem permitir movimentar ou alterar a solicitação a partir dali.
8. Conferir que o número da instância aberta é **o mesmo** que aparece na coluna **Nº. Proc. Fluig** da grade da cotação.
9. Repetir os passos 1 a 8 a partir de **Avaliação de Propostas**, e conferir que o resultado é **idêntico** ao do Controle de Cotações.
10. Repetir a partir de **Definir Vencedor Cotação**, onde o mesmo botão existe.

**Resultado esperado**
- A ação **abre a SC em nova aba**, em modo de visualização (`taskLoadViewMode`), sem permitir alteração.
- A SC abre **completa**: todos os itens da grade, justificativa, rateio por centro de custo, e as abas *Informações*, *Histórico* e *Anexos* acessíveis. **Nada de visualização parcial.**
- A instância aberta corresponde ao **Nº. Proc. Fluig** exibido na grade daquela cotação.
- O comportamento é **o mesmo** nas telas de *Controle De Cotações*, *Avaliação de Propostas* e *Definir Vencedor Cotação* — a padronização confirmada no aceite do cliente se mantém.
- Se a cotação **não tiver** SC vinculada, o sistema **não abre aba em branco**: ou não oferece a ação, ou avisa.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A ação abre a SC com **visualização incompleta** — parte das informações (itens, quantidades, justificativa, centro de custo) não é apresentada —, e o comprador avalia as propostas com menos contexto do que o processo pressupõe. Evidência do ticket: 2 prints da abertura mostrando a visualização incompleta; o aceite traz um print do *Controle Cotação* e outro da *Avaliação de Propostas*.

**Severidade:** Média *(não corrompe dado e não trava o fluxo, mas o comprador decide a proposta vencedora com informação parcial — mesma família de FSWTBC-4237, parecer incompleto, e FSWTBC-4287, e-mail sem itens: informação que existe na origem e não chega íntegra ao ponto de decisão)*

**Preparação de massa:** uma cotação alcançável nas três telas, cuja SC de origem tenha **vários itens**, justificativa preenchida, **rateio por centro de custo** e **anexos** — sem isso, uma visualização parcial passa despercebida, porque não há o que faltar. **Não criável pela conta de QA.**

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — as rotas `#/controleCotacao`, `#/avaliacaoPropostas` e `#/propostaVencedora` abrem; a grade traz a coluna **Nº. Proc. Fluig**, que é o dado usado no passo 8. Nenhuma cotação foi listada, então **o botão não foi acionado**. *Lido no fonte publicado* — o botão **"Ver Solicitação da Compra"** (`p-icon: an an-eye`) aparece em **dois** blocos distintos do bundle, um ao lado de *Ver todos Anexos* e *Exportar*, outro junto de *Exportar* e do modal *Definir Fornecedores para Parecer Técnico* — coerente com a padronização em mais de uma tela. A função `viewFluigPurschase` usa **`c1_xfluig`** (o número do processo Fluig gravado na SC) e, **se ele estiver vazio**, cai num plano B: consulta o dataset **`dsForm_RequisicaoCompraContratacao`** por `{codFilial, numCotacao}` para recuperar `numProcesso`. Em ambos os caminhos, valida que o número é **só dígitos** e abre `/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=⟨nº⟩&app_ecm_workflowview_taskLoadViewMode=true` por `openSafeUrl`, que **só abre URL `https:`**. **Nenhuma SC foi aberta por esta via.**
**Divergências encontradas:** duas. (1) **Rótulo:** o ticket diz **"Ver Solicitação *de* Compra"**; o rótulo real na tela é **"Ver Solicitação *da* Compra"**. Quem procurar pelo texto do ticket não acha o botão. (2) **Comportamento não documentado no ticket, relevante para o caso:** quando `c1_xfluig` está vazio, a ação **não avisa nada** — ela tenta silenciosamente o plano B pelo dataset e, se este também não retornar um número válido, **simplesmente nada acontece**, sem mensagem ao usuário. É a mesma família de falha silenciosa do CT-FSWTBC-4299, e é por isso que o último item do resultado esperado cobre explicitamente a cotação sem SC vinculada — cenário que o ticket não menciona e que hoje é indistinguível de um clique não registrado.
**Dados/massa usados:** nenhum — não submetido.

---

## Fechamento do lote

**14 casos escritos, um por item do lote — nenhum item ficou de fora.**

| Verificado em tela | Qtd | Casos |
|---|---|---|
| SIM (total) | **0** | — |
| PARCIAL | **13** | 4110, 4126, 4127, 4145, 4153, 4178, 4230, 4237, 4273, 4287, 4299, 4300, 4302 |
| NÃO | **1** | 4266 |

**Por que nenhum SIM:** todos os 14 defeitos deste lote vivem no ciclo de Compras a partir da etapa do **comprador** — cotação, negociação, parecer, alçada, disparo de e-mail. A conta de QA `TOTVS-FS` **não resolve matrícula de comprador**, e sem isso **nenhuma grade do Portal do Comprador lista uma única linha**. Todo caminho, todo rótulo e toda coluna foram confirmados; **nenhum dado**. Marcar qualquer um destes casos como totalmente verificado seria falso.

**Dois itens deste lote estão marcados "Concluído/Feito" no Jira sem que exista correção:** **FSWTBC-4178** (encerrado por reclassificação como melhoria — e a medição desta sessão mostra que o padrão N+1 **continua no fonte publicado**) e **FSWTBC-4266** (encerrado a pedido do cliente, com a correção da branch `hotfix/SDCASSI-330` **nunca promovida nem descartada**). **FSWTBC-4127** foi encerrado por ausência de reincidência, sem causa identificada. Os casos correspondentes reprovam hoje, e isso é esperado.

## CT-FSWTBC-4303  (ambos · Concluído · SDCASSI-339)

**Título:** Comprador altera valor da proposta e só consegue salvar depois de preencher a justificativa, que é exibida com acentuação íntegra

**Origem:** FSWTBC-4303 — tornar a justificativa obrigatória quando o comprador altera o valor da cotação, e corrigir a acentuação do campo (texto chegava corrompido). Homologado 13/04/2026. Não esclarecido se a corrupção era só de exibição ou também de gravação.

**Módulo/Rota:** Portal do Comprador › **Avaliação de Propostas** › cartão da proposta › campos **Valor Frete** / valor unitário › **"Justificar Alteração de Valor \*"** › botão **Salvar Valores Atualizados**

**Pré-condições**
- Uma cotação com proposta recebida, visível na Avaliação de Propostas para o comprador logado.
- **Bloqueio:** conta QA não é comprador (*"Comprador não encontrado."*) e `genericQuery` DHU responde 404 — grade vazia.

**Passos**
1. Abra *Avaliação de Propostas*, localize a cotação e abra o cartão da proposta.
2. Altere o **Valor Unit.** (ou **Valor Frete**) de um item, deixe **Justificar Alteração de Valor \*** vazio e clique em **Salvar Valores Atualizados**.
3. Preencha a justificativa com texto acentuado, ex.: `QA — justificativa com acentuação: ação, ções, ê, ã` e salve.
4. Reabra o cartão e leia o texto salvo; abra a instância no Fluig e leia o mesmo campo (`C8_XJUST`) na grade.

**Resultado esperado**
- Passo 2: alerta **"Campo Obrigatório não preenchido!"** — *"A Justificativa é obrigatória para atualização de valores!"*; nada é enviado ao ERP.
- Passo 3: salva com sucesso; **Valor Final** recalculado.
- Passo 4: texto exibido **idêntico** ao digitado (`ação`, `ções`, `ê`, `ã`), tanto no Portal quanto na instância.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Valor alterado salvo sem justificativa; texto exibido com caracteres corrompidos (ex.: `aÃ§Ã£o`).

**Severidade:** Alta — alteração de valor sem rastro de motivo é lacuna de auditoria.

**Preparação de massa:** cotação de teste com proposta enviada por fornecedor de teste (`QA`), para não alterar valor de proposta real; exige comprador e fornecedor.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *visto renderizado* — Avaliação de Propostas abre (grade vazia). *Lido no fonte publicado* — textarea **"Justificar Alteração de Valor \*"** (`name="justicaAlteracaoValor"`, `p-required`, `p-maxlength`), botão **Salvar Valores Atualizados**, e a crítica exata *"Campo Obrigatório não preenchido!" / "A Justificativa é obrigatória para atualização de valores!"* disparada quando `requiredJustify` e `C8_XJUST` vazio.
**Divergências encontradas:** o ticket fala em "campo de justificativa"; o rótulo real é **Justificar Alteração de Valor \***. A obrigatoriedade está no front (`p-required` + verificação antes de `sendUpdateProposals`) — a verificação de gravação com acento só é possível com massa.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4304  (ambos · Concluído · SDCASSI-341)

**Título:** Comprador centraliza SCs selecionadas na Validação Inicial e recebe confirmação, com a SC centralizada nascendo no fluxo "Compra Centralizada?"

**Origem:** FSWTBC-4304 — erro ao centralizar SC (API de centralização); correção liberada em 24 h sem causa documentada. Homologado 15/04/2026. Par com SDCASSI-342.

**Módulo/Rota:** Portal do Comprador › **Validação Inicial** (`#/validacaoInicial`) › seleção de linhas › botão **Centralizar Solicitações**

**Pré-condições**
- Duas ou mais SCs de filiais distintas em *Validação do Comprador*, com produtos em comum, visíveis para o comprador central.
- **Bloqueio:** conta QA não é comprador; **não centralizar SC real de terceiros** (§2) — só SCs `QA` criadas pelo executor.

**Passos**
1. Abra *Validação Inicial*, filtre por **Produto**/**Filial** e marque **Somente Minha Responsabilidade** se aplicável; **Buscar**.
2. Selecione as SCs `QA` e clique em **Centralizar Solicitações**.
3. Leia a mensagem retornada.
4. No Tracker › *Solicitação de Compras* pesquise a nova SC; abra a instância e confira o histórico (etapa **Compra Centralizada?**, 294) e o número da SC de origem.

**Resultado esperado**
- Mensagem **"As solicitações foram centralizadas."** com o número da nova SC.
- Nova instância de `wf_solicitacao_compras` criada, passando por *Compra Centralizada?* (294); as SCs de origem referenciadas (SC de origem = `C1_SCORI`).
- Nenhum erro HTTP/toast de falha da API de centralização.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro ao clicar em Centralizar (prints de 10/04/2026); nenhuma SC nova criada.

**Severidade:** Média — bloqueia o fluxo de Compras Centralizadas.

**Preparação de massa:** ≥2 SCs `QA` de filiais diferentes com o mesmo produto, criadas pelo executor e levadas até *Validação do Comprador* — exige gestor aprovando (7/14).

**Verificado em tela:** PARCIAL
**O que foi verificado:** *visto renderizado por lotes anteriores (04/09)* — Validação Inicial com 24 SCs, filtros *Filial/Produto/Grupo de Produto/Centro de Custo/Justificativa/Somente Minha Responsabilidade* e botões **Buscar** e **Centralizar Solicitações**; nesta sessão a rota estourou o tempo (45 s de `networkidle`). *Lido no fonte publicado* — botão **Centralizar Solicitações** e função `centralizaSolicitacoes` (`agrupaProdutos` → `iniciaSolicitacao`) com mensagem *"As solicitações foram centralizadas. "*. *Confirmado por dado* — gateway **294 "Compra Centralizada?"** em 341 movimentos.
**Divergências encontradas:** achado **A2-e**: `centralizaSolicitacoes` abre **uma SC única**, não uma por filial de entrega como desenhado — se o critério do executor for "uma por filial", o caso reprova por causa não corrigida.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4305  (ambos · Concluído · SDCASSI-342)

**Título:** SC centralizada aparece para o comprador central no Portal do Comprador e no Tracker

**Origem:** FSWTBC-4305 — SC centralizada (10698) não era exibida ao comprador porque foi gravada **sem o código correto do comprador**. Corrigido o fluxo em 15/04/2026; as SCs centralizadas antes **permanecem inválidas** ("será necessário criar novas"). **Massa antiga reprova hoje por causa nunca saneada.**

**Módulo/Rota:** Portal do Comprador › **Validação Inicial** / **Controle De Cotações** (filtro **Somente Minha Responsabilidade** = `matriculaComprador`); Tracker › *Solicitação de Compras* › **Número da Solicitação**

**Pré-condições**
- Uma SC centralizada **após 15/04/2026** pelo comprador central logado.
- **Bloqueio:** conta QA não é comprador (`Y1_USER = "undefined"`); grade vazia por 404 do `genericQuery`.

**Passos**
1. Logado como o comprador que centralizou, abra *Validação Inicial*, ative **Somente Minha Responsabilidade** e **Buscar**.
2. Localize a SC centralizada pelo **Nº Solic**; confira colunas **Solicitante**, **Filial**, **Etapa**, **Status**.
3. Desative o filtro e repita; compare.
4. No Tracker, pesquise a SC pelo **Número da Solicitação** e confira o campo de comprador/responsável.
5. **Caso legado:** repita 1–2 com uma SC centralizada **antes de 15/04/2026** (ex.: 10698).

**Resultado esperado**
- Passos 1–4: a SC centralizada aparece com e sem o filtro de responsabilidade; o comprador gravado é o que centralizou.
- Passo 5: se a SC antiga **não** aparecer, registrar como resíduo conhecido (não é regressão) — a menos que tenha havido script de saneamento.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC centralizada ausente da lista do comprador (prints de 10/04/2026); processo sem continuidade.

**Severidade:** Média — bloqueia a continuidade após centralização.

**Preparação de massa:** uma centralização `QA` feita pelo comprador central (ver CT-FSWTBC-4304); para o caso legado, o número de uma SC centralizada antes da correção (10698 citada no ticket).

**Verificado em tela:** PARCIAL
**O que foi verificado:** *visto renderizado* — Controle De Cotações e Avaliação de Propostas abrem com **Filtrar** e grade vazia; console *"Comprador não encontrado."* prova que a lista é filtrada por matrícula de comprador. *Lido no fonte publicado* — parâmetro `matriculaComprador` só é enviado quando *Somente Minha Responsabilidade* está ativo; `numSolCompra = c1_scori || c1_num` para SC centralizada.
**Divergências encontradas:** nenhuma de rótulo. Resíduo declarado no ticket (SCs antigas sem código do comprador) **não tem script registrado** — o passo 5 existe para medi-lo.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4311  (fluig · Concluído · SDCASSI-346)

**Título:** Comprador confere o prazo de entrega de cada item na tela de cotação e o leva para a planilha exportada.

**Origem:** FSWTBC-4311 — a coluna "Prev. Entrega" não era exibida na aba de Controle de Cotação, o campo não saía na exportação e a ordem das colunas exportadas não batia com a da tela.

**Módulo/Rota:** Portal do Comprador → cartão **Controle De Cotações** (`/portal/p/1/portal-do-comprador#/controleCotacao`) e **Avaliação de Propostas** (`#/avaliacaoPropostas`) → modal de propostas do fornecedor → botão **Exportar** / **Exportar Dados**.

**Pré-condições**
- Usuário autenticado no Fluig **com matrícula de comprador resolvida no Protheus** (`Y1_USER`), sem o que a grade não carrega.
- Ao menos uma cotação com fornecedor que já tenha enviado proposta com data de entrega preenchida (`C8_PRAZO`).
- **Bloqueio:** a conta de QA (`TOTVS-FS`) não resolve matrícula de comprador e `getQuotesDhuERP` responde 404 — a grade fica em "Página 1 de 0 / Nenhum dado encontrado". Sem conta de comprador, o caso não é executável até o fim.

**Passos**
1. Abrir `/portal/p/1/portal-do-comprador` e clicar no cartão **Controle De Cotações**.
2. Na cotação desejada, localizar a tabela de itens do cartão e conferir o cabeçalho.
3. Abrir a proposta de um fornecedor (linha da tabela de fornecedores) — o modal abre com o título **"Cotações Fornecedor \<nome\>"**.
4. Conferir o cabeçalho da tabela de itens da proposta.
5. Acionar **Exportar** no rodapé do modal (ou **Exportar Dados** no rodapé do cartão) e abrir a planilha gerada.

**Resultado esperado**
- Na tabela de itens da proposta existe a coluna **Prev. Entrega** (rótulo exato, propriedade `isDelivery`).
- A planilha da proposta é gerada com o nome `Cotação <nº> Filial <filial> - Fornecedor <cod> - <loja>.xlsx`, uma aba por proposta chamada `Proposta Nº <n>`.
- Na planilha, a partir da linha 7, as colunas saem **nesta ordem**: `Item | Produto | Descrição | Grupo | Unid. Medida | Quantidade | Valor Referência SC | Val. Unit. Cotado | Val. Frete | Val. Total Item | Necessidade | Prev. Entrega | Fil. Entrega | Obs. Fornecedor | Obs. Comprador` — a mesma sequência da tela a partir de "Item".
- **Prev. Entrega** aparece preenchida na planilha, não em branco.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A aba de Controle de Cotação exibia apenas valor, sem coluna de previsão de entrega; a planilha exportada saía sem o campo e com as colunas em ordem diferente da tela, obrigando conferência manual.

**Severidade:** Média

**Preparação de massa:** uma cotação aberta, atribuída ao comprador executor, com pelo menos um fornecedor que tenha respondido a proposta informando prazo de entrega. Depende do time de Compras da CASSI (ou de conta com matrícula de comprador na base de homologação).

**Verificado em tela:** PARCIAL
**O que foi verificado:** *visto renderizado* — a rota `#/controleCotacao` abre, exibe o botão **Filtrar**, "Página 1 de 0" e "Nenhum dado encontrado"; o painel de filtros traz **Nº do Processo Fluig, Nº da Cotação ERP, Filial, Data Solicitação, Data Validade** e os botões **Limpar Filtros** e **Filtrar**. *Lido no fonte publicado* — as duas definições de colunas contendo `{property:"isDelivery",label:"Prev. Entrega"}` (`getCardQuoteColumns()` e `columsSuppliersQuote()`) e o mapeamento da exportação em `exportDataSupplierQuotes()`, com a ordem de colunas citada acima.
**Divergências encontradas:** o ticket diz "aba Controle de Cotação"; na tela o rótulo é **Controle De Cotações** (plural, "De" maiúsculo) e não é aba, é cartão do bloco **Acesso Rápido**. Além disso o mesmo par de colunas aparece em **duas** telas (Controle De Cotações e Avaliação de Propostas/Definir Vencedor Cotação), não em uma.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4316  (ambos · Concluído · SDCASSI-350)

**Título:** Busca de produto na SC e nos filtros do Portal do Comprador não oferece itens do grupo 3300 e mostra o código atual do cadastro

**Origem:** FSWTBC-4316 — o dataset de produtos trazia itens do grupo `B1_GRUPO` 3300 (filtrados na origem) e com **outro código**: cópia sincronizada desatualizada; resolvido com ressincronização do dataset em 16/04/2026, confirmado 12/05/2026. Risco estrutural: nada dispara a ressincronização.

**Módulo/Rota:** *Processos › Solicitação de Compras* › formulário › busca de **Produto** (`dsProtheus_getProdutos_restGetAll`); Portal do Comprador › filtros **Produto** e **Grupo de Produto** (`dsProtheus_getGrupoDeProduto_restGetAll`)

**Pré-condições**
- Conhecer ao menos um produto do grupo 3300 e um produto cujo código/descrição mudou recentemente no Protheus.
- **Bloqueio:** os produtos do grupo 3300 **não estão nomeados no ticket** (`<não documentado>`); a comparação com o cadastro exige Protheus (sem credencial).

**Passos**
1. Abra uma nova *Solicitação de Compras* e, no item, pesquise o produto do grupo 3300 por código e por descrição.
2. No Portal do Comprador › Validação Inicial, abra o filtro **Grupo de Produto** e procure `3300`; abra **Produto** e pesquise o mesmo item.
3. Pesquise um produto alterado recentemente no ERP e compare **código** e **descrição** com o cadastro (Postman/Protheus, por quem tiver acesso).
4. Registre data/hora da última sincronização do dataset (administrador Fluig › Datasets), se disponível.

**Resultado esperado**
- Nenhum produto do grupo 3300 é retornado em 1 nem em 2.
- Código e descrição exibidos no Fluig **iguais** aos do cadastro SB1 (não um código antigo).
- Divergência, se houver, deve ser atribuída à defasagem da sincronização (registrar a hora), não ao filtro.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Item do grupo 3300 listado no Fluig **com código diferente** do cadastro, enquanto a mesma consulta no Postman o filtra.

**Severidade:** Média — produto indevido oferecido para compra.

**Preparação de massa:** lista de produtos do grupo 3300 e de um produto alterado recentemente, fornecida por quem acessa o Protheus; nenhuma criação.

**Verificado em tela:** NÃO
**O que foi verificado:** *lido no fonte publicado* apenas — o Portal consome `dsProtheus_getProdutos_restGetAll` (`filterFields=B1_COD,<texto>`) e `dsProtheus_getGrupoDeProduto_restGetAll` (`filterFields=BM_GRUPO`), além de um `genericQuery` com `SB1 JOIN SBM ON BM_GRUPO = B1_GRUPO`. O formulário da SC não foi aberto e nenhum dataset foi executado nesta sessão.
**Divergências encontradas:** o ticket fala em "dataset de consulta de produtos"; no Fluig são **dois** datasets sincronizados (produtos e grupos) e mais uma consulta direta ao ERP — o filtro de grupo pode divergir entre eles após uma sincronização parcial.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-4317  (fluig · Concluído · SDCASSI-349)

**Título:** Localizar um item numa lista de seleção do Portal do Comprador esperando ordem alfabética.

**Origem:** FSWTBC-4317 — a "lista de classificação" não seguia nenhum padrão de ordenação, dificultando localizar e selecionar o item. O ticket não identifica a tela nem o nome do campo.

**Módulo/Rota:** Portal do Comprador (`/portal/p/1/portal-do-comprador`) — listas de seleção das telas **Validação Inicial** e **Controle De Cotações**.

**Pré-condições**
- Usuário autenticado no Portal do Comprador.
- Listas com volume suficiente para julgar ordenação (>10 entradas).
- **Bloqueio:** **não existe, hoje, nenhuma lista rotulada "Classificação" no Portal do Comprador** — nem como campo, nem como coluna, nem como combo. Sem isso, o alvo do ticket não é identificável e o caso vira caracterização de caminho (§5-D do briefing).

**Passos**
1. Abrir `/portal/p/1/portal-do-comprador#/validacaoInicial` e abrir, uma a uma, as listas de seleção: **Filial**, **Produto**, **Grupo de Produto**, **Centro de Custo**.
2. Abrir o seletor de usuário do cabeçalho do portal (lista de usuários/substitutos).
3. Abrir `#/controleCotacao`, clicar em **Filtrar** e abrir a lista **Filial**.
4. Em cada lista, verificar se as entradas estão em ordem alfabética crescente pelo texto exibido.

**Resultado esperado**
- Toda lista de seleção do portal apresenta as entradas em ordem alfabética crescente pelo rótulo, com comparação sensível a acentuação do português (ex.: "Ávila" ordenado junto de "Avila", não no fim).
- A ordenação é estável entre recargas da tela.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A lista aparecia sem padrão de ordenação, obrigando varredura visual item a item para encontrar e selecionar a entrada desejada.

**Severidade:** Baixa (usabilidade)

**Preparação de massa:** nenhuma além de massa cadastral existente (filiais, produtos, grupos, centros de custo). Para tornar o caso auditável, é preciso que o time confirme **qual** lista o ticket chamava de "classificação".

**Verificado em tela:** PARCIAL
**O que foi verificado:** *visto renderizado* — as rotas `#/validacaoInicial`, `#/controleCotacao`, `#/avaliacaoPropostas` e `#/propostaVencedora` abrem; nenhuma exibe campo, coluna ou combo chamado "Classificação". *Lido no fonte publicado* — a **única** ordenação alfabética implementada no bundle é a da lista de usuários/substitutos do cabeçalho: `n.sort((a,i)=>a.label.localeCompare(i.label,"pt-BR",{sensitivity:"base"}))`. As demais listas (Filial, Produto, Grupo de Produto, Centro de Custo) são lookups servidos pelo ERP (`p-filter-service`) e **não têm ordenação aplicada no cliente**; a única outra ordenação do bundle é numérica, por filial de entrega e SC de origem, na montagem de solicitações centralizadas.
**Divergências encontradas:** o rótulo "lista de classificação" do ticket **não existe** na tela nem no fonte publicado. O que mais se aproxima é o campo interno `tbprod_classificacao` do formulário da SC — que é `input type="hidden"`, recebe valores como "Outros" e **não é uma lista selecionável**. O ticket é inauditável como está escrito.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4323  (fluig · Concluído · SDCASSI-352)

**Título:** Comprador identifica pelo farol de status quais SC já podem ser conduzidas pelo Portal, sem abrir a Central de Tarefas.

**Origem:** FSWTBC-4323 — não havia indicação visual, no Portal de Compras, de que a SC já podia ser movimentada; o comprador precisava conferir a Central de Tarefas e, movimentando na hora errada, "gerava falhas nas integrações".

**Módulo/Rota:** Portal do Comprador → **Controle De Cotações** (`#/controleCotacao`), **Avaliação de Propostas** (`#/avaliacaoPropostas`) e **Definir Vencedor Cotação** (`#/propostaVencedora`).

**Pré-condições**
- Cotações em estados diferentes (em cotação, em integração, em negociação, em alçada, concluída) visíveis para o comprador.
- **Bloqueio:** conta de QA sem matrícula de comprador; grades vazias (`getQuotesDhuERP` / `getEvalQuotesDhuERP` → 404). Não é possível observar a cor/rótulo de nenhuma linha real.

**Passos**
1. Abrir `#/controleCotacao` e observar, no cartão de cada cotação, a etiqueta de status ao lado dos dados de cabeçalho.
2. Abrir `#/avaliacaoPropostas` e conferir a coluna **Status** da grade.
3. Abrir `#/propostaVencedora` e conferir a mesma coluna **Status**.
4. Para uma cotação que esteja em integração com o ERP, conferir quais botões do cartão continuam disponíveis.

**Resultado esperado**
- As três telas exibem status como etiqueta com **cor e ícone**, não só texto.
- Os rótulos possíveis são exatamente: **Em andamento**, **Analisar**, **Em Cotação**, **Em Integração**, **Validação de Propostas**, **Em Negociação**, **Gerar Alçada**, **Aprovação de Alçadas**, **Geração Pedido/Contrato**, **Analisado**.
- **Em Integração** é destacado em vermelho (`rgb(204, 0, 10)`) com ícone de relógio — é o sinal de "não movimente agora".
- Enquanto o status é **Em Integração**, os botões **Bloquear Novos Participantes** e **Parecer Técnico** **não são exibidos** no cartão.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A SC aparecia no Portal sem qualquer sinal de prontidão; o comprador só descobria o momento correto abrindo a Central de Tarefas, e movimentava fora de hora, gerando falha de integração.

**Severidade:** Alta (movimentação fora de hora produz falha de integração declarada pelo próprio cliente)

**Preparação de massa:** cotações em pelo menos três estados distintos, incluindo uma em integração com o ERP no momento do teste — só o time de Compras/Integração consegue produzir esse instante.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *visto renderizado* — `#/avaliacaoPropostas` e `#/propostaVencedora` desenham a grade com as 10 colunas `Status | Núm. Cotação | Filial | Número da SC | Nº. Proc. Fluig | Tip. Documento | Parecer Téc. | Em Alçada | Dt. Validade | Valor Final`, com a coluna **Status** em primeiro lugar (grade sem linhas). *Lido no fonte publicado* — o getter `STATUS_LABELS` com os 10 pares rótulo/cor/ícone; `getCustonStatus()` resolvendo o código para a etiqueta; no template do cartão de Controle De Cotações, um `po-tag` recebendo `p-color`, `p-value` e `p-icon` de `status`; e as condições `btnBloquear && status.code!=="integracao" && FORNECEDORES.length>0` e `btnParecer && status.code!=="integracao" && FORNECEDORES.length>0`.
**Divergências encontradas:** o ticket fala em "Portal de Compras" e em "legenda"; na tela o nome é **Portal do Comprador** e o elemento é uma **etiqueta de status colorida** (`po-tag`), não uma legenda explicativa — não existe quadro-legenda decodificando as cores. As três telas citadas no ticket ("Controle de Cotação, Avaliação de Propostas e Definição de Vencedor") aparecem hoje como **Controle De Cotações**, **Avaliação de Propostas** e **Definir Vencedor Cotação**.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4336  (ambos · Concluído · SDCASSI-355)

**Título:** Após alçada reprovada com retorno para negociação e escolha de novos valores (proposta 03), a SC conclui até o pedido/contrato

**Origem:** FSWTBC-4336 — 4º cenário de reprovação de alçada ("Retornar para Negociação"): a SC 10721 não finalizou após escolha da proposta 03. Causa comum tratada no SDCASSI-353 (estado da cotação não revertido no ERP). Homologado 29/04/2026.

**Módulo/Rota:** `wf_solicitacao_compras` 94 *Aprovação de Alçadas* → 96 *Sol. Aprovado na Alçada?* → 210 *Validação do Comprador (Alçadas)* → 172 *Aguarda Finalizar Negociação* → 76 → 309 → 225 → 310 → 94 → 323 → 87; Portal do Comprador › **Avaliação de Propostas** / **Definir Vencedor Cotação**; coluna **Em Alçada**

**Pré-condições**
- SC com alçada reprovada e decisão do comprador de retornar para negociação; fornecedor reenvia proposta 03.
- **Bloqueio:** exige aprovador de alçada (reprovar), comprador e fornecedor — nenhum disponível; grade do Portal vazia (404 DHU).

**Passos**
1. Após a reprovação em *Aprovação de Alçadas* (94), abra a tarefa **Validação do Comprador (Alçadas)** (210) e escolha a opção de retorno para negociação (`<rótulo não documentado — ver formulário da etapa 210>`).
2. Confirme no histórico a etapa **Aguarda Finalizar Negociação** (172); na *Avaliação de Propostas* confira que a cotação mostra **Em Alçada = Não**.
3. Fornecedor envia proposta 03; comprador **Validar Proposta** e, em *Definir Vencedor Cotação*, define o vencedor com os novos valores.
4. Acompanhe o histórico: 76 → 309 *Aguarda Geração Alçadas* → 225 → 310 → **94** (nova alçada) → aprovação → 287 → 323 → 87.

**Resultado esperado**
- Em 2, **Em Alçada** = *Não* (o ERP liberou a cotação para nova rodada).
- Em 3, o vencedor é aceito sem *"Cotação já aprovada, não pode mudar o vencedor"*.
- Em 4, a SC chega a *Pedido/Contrato foi Gerado?* = Sim e finaliza; sem passagem por *Correção* (236).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC 10721 parada após a escolha da proposta 03, sem finalizar; mensagem do ERP *"Cotação já aprovada, não pode mudar o vencedor"* no retorno da integração.

**Severidade:** Alta — alçada/aprovação e conclusão da compra.

**Preparação de massa:** SC `QA` com 3 propostas e alçada acima do limite do aprovador para forçar reprovação; três perfis externos à conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *confirmado por dado* — cadeia 94/96/210/172/76/309/225/310 nas v95/v97/v98 (**210 "Validação do Comprador (Alçadas)"** existe; é onde o cenário é escolhido). *Visto renderizado* — Avaliação de Propostas e Definir Vencedor Cotação abrem. *Lido no fonte publicado* — coluna **Em Alçada** (`C8_XALCADA`, Sim/Não) na grade de cotações, que é a superfície Fluig do reset de `C8_XALCADA`.
**Divergências encontradas:** "Retornar para Negociação" não é rótulo do Portal; a etapa real é **Aguarda Finalizar Negociação** (172). Rótulo da opção na etapa 210: `<não documentado>` (formulário não aberto).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4337  (ambos · Concluído · SDCASSI-354)

**Título:** Após alçada reprovada com retorno para cotação e escolha de outro fornecedor participante, a SC conclui até o pedido/contrato

**Origem:** FSWTBC-4337 — 3º cenário ("Retornar para Cotação"): a SC 10720 não finalizou; o Protheus devolvia *"Cotação já aprovada, não pode mudar o vencedor"* porque a cotação continuava aprovada no ERP após a reprovação no Fluig. Corrigido no SDCASSI-353 (zerar `C8_XALCADA/C8_XVENC/C8_XLIBERA`). Homologado 28/04/2026.

**Módulo/Rota:** `wf_solicitacao_compras` 94 → 210 *Validação do Comprador (Alçadas)* → **161 Aguarda Finalizar Cotação** → 150 → … → 309 → 94 → 323; Portal do Comprador › **Definir Vencedor Cotação** (`#/propostaVencedora`); coluna **Em Alçada**

**Pré-condições**
- SC com alçada reprovada; cotação com ≥2 fornecedores participantes com proposta válida.
- **Bloqueio:** exige aprovador de alçada e comprador; conta QA não é comprador; 404 no `genericQuery` DHU.

**Passos**
1. Na tarefa **Validação do Comprador (Alçadas)** (210) escolha a opção de retorno para cotação (`<rótulo não documentado>`).
2. Confirme no histórico **Aguarda Finalizar Cotação** (161) e, na grade de cotações, **Em Alçada = Não**.
3. Em *Definir Vencedor Cotação*, selecione o **2º colocado** como vencedor e envie.
4. Acompanhe 150 → 309 *Aguarda Geração Alçadas* → 225 → 310 → **94** → aprovação → 287 → 323 → 87.

**Resultado esperado**
- Envio do novo vencedor aceito, sem *"Cotação já aprovada, não pode mudar o vencedor"*.
- Nova grade de alçada gerada (310) refletindo o novo fornecedor; SC finaliza.
- Nenhuma passagem por *Correção* (236) nem *Erro retornado pelo ERP Protheus* preenchido na cotação.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro do ERP *"Cotação já aprovada, não pode mudar o vencedor"* (prints de 20/04/2026); SC 10720 parada.

**Severidade:** Alta — alçada e conclusão da compra.

**Preparação de massa:** SC `QA` com ≥2 propostas e alçada reprovada; perfis de aprovador, comprador e fornecedores.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *confirmado por dado* — **161 "Aguarda Finalizar Cotação"** e 210 existem; ciclo 309/225/310/94 reentrante nas versões 95–98. *Visto renderizado* — Definir Vencedor Cotação abre (grade vazia). *Lido no fonte publicado* — coluna **Em Alçada** e regra `sendWinningProposals` (lote anterior: aborta se algum fornecedor com `C8_XVENC` marcado tiver `C8_XQTAUDI <= 0`).
**Divergências encontradas:** "Retornar para Cotação" não é rótulo do Portal; etapa real **Aguarda Finalizar Cotação** (161). A tela **não expõe** `C8_XVENC`/`C8_XLIBERA` — só `C8_XALCADA` (Em Alçada); o reset dos outros dois só é observável pelo sucesso do passo 3.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4338  (ambos · Concluído · SDCASSI-353)

**Título:** Após alçada reprovada com acionamento do 2º colocado (novo fornecedor), a alçada é regerada e a SC conclui

**Origem:** FSWTBC-4338 — 2º cenário ("Retorno para Alçada com Novo Fornecedor"): SC 10719 não finalizou. Duas rodadas: `C8_XALCADA=.F.` na rejeição (16/04); depois zerar `C8_XALCADA/C8_XVENC/C8_XLIBERA`, `MaAlcDoc(op=3)` em todos os SCR e remoção de `StartJob` em IPC no `fGravaVencedor` (28/04). Homologado 05/05/2026. Ticket que concentrou a correção dos três cenários.

**Módulo/Rota:** `wf_solicitacao_compras` 94 *Aprovação de Alçadas* → 96 → 210 → 309 *Aguarda Geração Alçadas* → 225 *Alçada foi Gerada?* → 310 *Gerar Grid de Alçada* → 94; Portal do Comprador › **Definir Vencedor Cotação**; formulário da SC grade **tbAlcadas** ("Aprovar? - Linha N")

**Pré-condições**
- SC com alçada reprovada; cotação com 2º colocado válido.
- **Bloqueio:** exige aprovador de alçada, comprador; conta QA não é comprador; 404 DHU.

**Passos**
1. Na tarefa 210 escolha a opção de novo fornecedor (`<rótulo não documentado>`).
2. Em *Definir Vencedor Cotação*, marque o 2º colocado e envie vencedores.
3. Acompanhe o histórico: 309 → 225 (= Sim) → 310 → **94** com a grade **tbAlcadas** montada para o novo fornecedor/valor.
4. Repita a sequência **3 vezes** em SCs distintas (o crash do `StartJob` era intermitente).
5. Aprovador aprova; acompanhe 287 → 323 → 87 → fim.

**Resultado esperado**
- 225 *Alçada foi Gerada?* = Sim em **todas** as repetições; nunca 400 *"Nenhum documento SCR encontrado para gerar alçada da cotação NNNNNN"*.
- Grade **tbAlcadas** exibe o novo fornecedor com **Valor da Compra (R$)** atualizado; após aprovação a SC finaliza.
- Sem passagem por *Correção* (236) e sem *Retorno Integração* de erro.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC 10719 parada após escolher novo fornecedor; erro intermitente (type mismatch por `StartJob` NIL); *"Cotação já aprovada, não pode mudar o vencedor"*; ou 400 "Nenhum documento SCR encontrado".

**Severidade:** Alta — alçada.

**Preparação de massa:** 3 SCs `QA` com ≥2 propostas e alçada reprovada; três perfis externos à conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *confirmado por dado* — ciclo **309 → 225 → 310 → 94** com contagens iguais (4/4/4/4 na v98; 8/6/4/4 na v95 — 8 entradas em 309 contra 4 saídas em 310 sugerem regeneração repetida ou parada). *Visto renderizado* — Definir Vencedor Cotação abre. *Lido no fonte publicado* — coluna **Em Alçada**; grade `tbAlcadas`/"Valor da Compra (R$)" citadas do §5-B (formulário não aberto).
**Divergências encontradas:** "Novo Fornecedor" não existe como rótulo no Portal; a 225 chama-se **"Alçada foi Gerada?"** e a grade é **"Gerar Grid de Alçada"** (310). Observação de dado: na v95 há 8 movimentos em *Aguarda Geração Alçadas* para 6 em *Alçada foi Gerada?* — vale checar as instâncias que entraram e não saíram.
**Dados/massa usados:** nenhum — leitura por API.

---

## CT-FSWTBC-4341  (fluig · Concluído/Não Contratado · SDCASSI-357)

**Título:** Recolher os itens de uma cotação longa na tela de Controle de Cotação, como já é possível na compra centralizada.

**Origem:** FSWTBC-4341 — pedido de incluir opção de **ocultar itens** na tela de Controle de Cotação, a exemplo do que já existe na compra centralizada. Encerrado como **Não Contratado** em 22/05/2026 por falta do número da demanda de melhoria.

**Módulo/Rota:** Portal do Comprador → **Controle De Cotações** (`#/controleCotacao`), tabela de itens do cartão da cotação.

**Pré-condições**
- Cotação com muitos itens (o desconforto só aparece a partir de ~15 itens).
- **Bloqueio:** dois. (1) Conta de QA sem matrícula de comprador — grade vazia. (2) **Funcionalidade não entregue**: o ticket foi encerrado como Não Contratado, logo este caso **reprova hoje** por decisão comercial, não por defeito de código. Executá-lo serve para provar que a lacuna persiste.

**Passos**
1. Abrir `#/controleCotacao` e localizar uma cotação com muitos itens.
2. Procurar, no cartão da cotação, um controle de recolher/expandir a tabela de itens (seta de linha, "ocultar", "mostrar detalhes" ou equivalente).
3. Para comparação, abrir `#/validacaoInicial` (fluxo da compra centralizada) e verificar se ali a tabela oferece recolher/expandir linha.

**Resultado esperado**
- O cartão do Controle De Cotações oferece um controle para recolher a tabela de itens, com o mesmo comportamento disponível na tela usada na compra centralizada.
- O estado recolhido/expandido não altera nenhum dado da cotação.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Todos os itens da cotação permanecem sempre expandidos, empurrando os botões de ação para fora da área visível e obrigando rolagem longa para comparar propostas. **É o comportamento de hoje.**

**Severidade:** Baixa (usabilidade)

**Preparação de massa:** uma cotação com pelo menos 15 itens atribuída ao comprador executor. Depende do time de Compras.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *visto renderizado* — `#/controleCotacao` abre com "Nenhum dado encontrado"; não há botão de recolher itens entre os controles visíveis (só **Filtrar**). *Lido no fonte publicado* — no componente `app-controle-cotacoes` / `app-card-controle-cotacao`, a tabela de itens é um `po-table` simples com `p-hide-columns-manager="true"` e **sem** `p-table-row-template`; já no componente da **Validação Inicial** (onde vive **Centralizar Solicitações**) e no `app-card-cotacao` da Avaliação de Propostas a tabela **tem** `p-table-row-template` com `p-table-row-template-arrow-direction` e `p-table-row-template-show`, isto é, linha expansível. O contraste apontado pelo cliente é real e está no código.
**Divergências encontradas:** o ticket chama de "compra centralizada" a tela que hoje se chama **Validação Inicial** (o botão é **Centralizar Solicitações**). Nas telas **Avaliação de Propostas** e **Definir Vencedor Cotação** existe um **Gerenciador de colunas** (visto renderizado) — que oculta **colunas**, não itens, e não atende ao pedido.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4342  (fluig · Concluído/Não Contratado · SDCASSI-356)

**Título:** Abrir a solicitação de compra de origem sem sair da tela de Controle de Cotação.

**Origem:** FSWTBC-4342 — pedido de incluir o botão "Ver Solicitação de Compra" na tela de Controle de Cotação, para consultar a SC vinculada durante a condução da cotação. Encerrado como **Não Contratado** em 22/05/2026.

**Módulo/Rota:** Portal do Comprador → **Controle De Cotações** (`#/controleCotacao`) → modal **"Cotações Fornecedor \<nome\>"**.

**Pré-condições**
- Cotação vinculada a uma SC com processo Fluig gerado (`C1_XFLUIG` preenchido).
- **Bloqueio:** conta de QA sem matrícula de comprador — grade vazia, modal não abre.

**Passos**
1. Abrir `#/controleCotacao` e localizar a cotação.
2. Na tabela de fornecedores do cartão, acionar a ação que abre as propostas do fornecedor — abre o modal **"Cotações Fornecedor \<nome\>"**.
3. No rodapé do modal, acionar **Ver Solicitação da Compra**.
4. Repetir a partir de `#/avaliacaoPropostas`: abrir a proposta e acionar **Ver Solicitação da Compra** no rodapé.

**Resultado esperado**
- O botão **Ver Solicitação da Compra** existe no rodapé do modal, com ícone de olho.
- Ao acioná-lo, abre-se **nova aba** com a visualização do processo da SC: `.../pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=<nº do processo>&app_ecm_workflowview_taskLoadViewMode=true`.
- A abertura é somente sobre URL `https:` e com `noopener,noreferrer`; a SC abre em **modo consulta** (`taskLoadViewMode=true`), sem permitir movimentar a tarefa.
- Quando a cotação não traz o número do processo, o portal resolve a SC pelo dataset `dsForm_RequisicaoCompraContratacao` (constraints `codFilial` + `numCotacao`) antes de abrir.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Não havia como chegar à SC de origem a partir da cotação; o comprador precisava sair da tela e procurar a solicitação por outro caminho.

**Severidade:** Média

**Preparação de massa:** uma cotação com fornecedor e proposta, ligada a uma SC com processo Fluig. Depende do time de Compras.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *lido no fonte publicado* — o botão `["p-label","Ver Solicitação da Compra","p-icon","an an-eye",3,"p-click"]` aparece em **dois** rodapés de modal: no `app-card-controle-cotacao` (Controle De Cotações), chamando `viewPurchase(quoteDetail)`, e no `app-avalicao-propostas` (Avaliação de Propostas / Definir Vencedor), chamando `viewPurchaseProposal(selectedData)`; ambos desembocam em `viewFluigPurschase()`, que monta a URL de `pageworkflowview` e chama `openSafeUrl()` (só `https:`, `window.open(...,"noopener,noreferrer")`). *Visto renderizado* — nada além da rota abrir: sem linhas na grade, o modal não pode ser aberto.
**Divergências encontradas:** **divergência relevante** — o ticket foi encerrado como *Não Contratado*, mas o botão **existe hoje** no Controle De Cotações; o rótulo real é **"Ver Solicitação da Compra"** (não "Ver Solicitação de Compra") e ele fica no **rodapé do modal de propostas do fornecedor**, não na linha da tela principal. Vale confirmar com o time se a entrega veio junto de outro item do épico (o FSWTBC-4302/SDCASSI-340 corrigiu a mesma ação na etapa de cotação).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4344  (fluig · Concluído/Não Contratado · SDCASSI-359)

**Título:** Selecionar fornecedores de uma UF específica ao montar a cotação.

**Origem:** FSWTBC-4344 — pedido de filtro de busca de fornecedores por **UF** na cotação, para distribuir cotações por região. Encerrado como **Não Contratado** em 22/05/2026.

**Módulo/Rota:** Portal do Comprador → busca/seleção de fornecedores (usada na cotação e no modal **Centralizar Solicitações**, campo **Fornecedores**).

**Pré-condições**
- Base de fornecedores (SA2) com endereços em UFs distintas.
- **Bloqueio:** dois. (1) Conta de QA sem matrícula de comprador. (2) **Funcionalidade não entregue** — o caso reprova hoje por decisão comercial.

**Passos**
1. Abrir `/portal/p/1/portal-do-comprador#/validacaoInicial`, selecionar solicitações e acionar **Centralizar Solicitações**.
2. No modal **Centralizando Solicitações**, ligar **Selecionar Fornecedores** e abrir a lista **Fornecedores**.
3. Procurar um campo/filtro de **UF** (ou "Estado") na busca de fornecedores.
4. Conferir se a grade de fornecedores exibe alguma coluna de UF.

**Resultado esperado**
- A busca de fornecedores oferece filtro por **UF**, e o resultado traz apenas fornecedores da UF escolhida.
- A grade de fornecedores exibe a UF como coluna, para conferência antes de convidar.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A busca só aceita código, loja e CNPJ/CPF; o comprador convida fornecedores sem critério geográfico, o que concentra cotações e produz propostas inviáveis por frete/prazo. **É o comportamento de hoje.**

**Severidade:** Média (impacto de negócio: competitividade, frete e prazo — é o mais relevante dos cinco itens recusados)

**Preparação de massa:** fornecedores ativos em pelo menos duas UFs distintas, com o mesmo grupo de produto. Cadastro é do time da CASSI (SA2 no Protheus) — fora do alcance do QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *lido no fonte publicado* — `getSuppliers()` monta o filtro **apenas** com `A2_COD`, `A2_LOJA` e `A2_CGC`; `getSuppliersColumns()` devolve só `Código | Loja | Fornecedor | CGC | TIPO`. Ao mesmo tempo, a consulta ao ERP (`getSuppliersERP` → `restCallGenericQuery` sobre a tabela **SA2**) **já traz** os campos `A2_EST` e `A2_ESTADO` no `fields`. Ou seja: o dado da UF chega ao navegador e é descartado — falta só o filtro e a coluna. *Visto renderizado* — nada da busca de fornecedores: sem comprador resolvido, o fluxo não abre.
**Divergências encontradas:** o ticket fala em "filtro de busca de fornecedores por UF na cotação"; hoje não há **nenhum** campo de UF/estado em ponto algum do Portal do Comprador. Registro adicional para o time: implementar o filtro é barato, porque `A2_EST`/`A2_ESTADO` já vêm na resposta.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4347  (fluig · Concluído/Não Contratado · SDCASSI-363)

**Título:** Garantir que uma SC que já seguiu para alçada não fique disponível para reavaliação de propostas.

**Origem:** FSWTBC-4347 — a SC 10681, já na etapa "Aguarda Geração Alçadas", continuava sendo exibida na tela de avaliação de propostas, confundindo o comprador. Encerrado como **Não Contratado** em 22/05/2026.

**Módulo/Rota:** Portal do Comprador → **Avaliação de Propostas** (`#/avaliacaoPropostas`), coluna **Status** e filtro **Em Alçada**.

**Pré-condições**
- Uma SC/cotação cujo processo esteja na atividade **309 — Aguarda Geração Alçadas** (ou **310 — Gera Grid Alçadas**).
- **Bloqueio:** dois. (1) Conta de QA sem matrícula de comprador — grade vazia. (2) **Regra não implementada**: o pedido foi recusado, então o caso, executado hoje, tende a reprovar no resultado 1.

**Passos**
1. Identificar uma cotação cujo processo Fluig esteja em "Aguarda Geração Alçadas".
2. Abrir `#/avaliacaoPropostas` e procurar essa cotação na grade.
3. Conferir o valor da coluna **Status** dessa linha.
4. Clicar em **Filtrar**, definir **Em Alçada = Sim** e conferir o resultado; repetir com **Em Alçada = Não**.
5. Abrir a proposta dessa cotação e verificar quais ações ficam disponíveis (Validar Proposta / Negociar / Cancelar Proposta).

**Resultado esperado**
- A cotação cujo processo está em "Aguarda Geração Alçadas" **não é oferecida para reavaliação de propostas**, ou, no mínimo, é exibida com o status **Gerar Alçada** e com as ações de decisão (Validar Proposta / Negociar) desabilitadas.
- O filtro **Em Alçada** separa corretamente as duas populações.
- Nenhuma ação sobre proposta pode ser concluída para documento que já avançou de etapa.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A SC 10681 aparecia simultaneamente em "Aguarda Geração Alçadas" e listada na avaliação de propostas, permitindo ação sobre documento em etapa posterior — o mesmo tipo de movimentação fora de hora que o cliente associou a falhas de integração no SDCASSI-352.

**Severidade:** Alta (ação sobre documento em etapa posterior, com risco de quebrar a integração e a trilha de aprovação)

**Preparação de massa:** uma cotação parada na atividade 309/310 no momento do teste. Só o time de Compras/Integração produz esse estado; QA não pode criar sem movimentar processo real.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *visto renderizado* — `#/avaliacaoPropostas` desenha as 10 colunas, incluindo **Em Alçada**, e o painel de filtros traz **Tipo Documento, Parecer Técnico, Em Alçada, Data Validade** além de Nº do Processo Fluig, Nº da Cotação ERP e Filial. *Lido no fonte publicado* — `getQuotes()` monta o filtro apenas por chaves (`C8_FILIAL`, `C8_NUMSC`, `C8_NUM`, `C8_NUMPRO`, `C8_ITEM`, `C8_PRODUTO`, `C1_CODCOMP`, `C8_TPDOC`, `C8_XPARTEC`, `C8_XALCADA`, `C1_XFLUIG`) e **não exclui** nenhum estado do processo; a etapa só é traduzida depois, por `handlerStatus()`, que mapeia `NUM_SEQ_ESTADO === 309` para o status **"alcada" / "Gerar Alçada"**. Ou seja: a informação existe e é exibida, mas **não filtra a listagem**.
**Divergências encontradas:** o ticket trata como problema de exibição, mas o mecanismo hoje é outro — a linha continua listada e apenas **muda de status para "Gerar Alçada"**; a exclusão pedida não existe. Registro para o time: o mesmo princípio (filtrar por situação do documento) foi tratado como **defeito** no SDCASSI-294 (FSWTBC-4095) e como **melhoria recusada** aqui.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4349  (fluig · Concluído/Não Contratado · SDCASSI-364)

**Título:** Anexar documentação comprobatória e registrar justificativa ao definir o vencedor da cotação.

**Origem:** FSWTBC-4349 — pedido de incluir campo de **anexo** e campo de **justificativa** na etapa de definição do vencedor, para enviar documentação à alçada que aprova/reprova. O cliente registrou que a funcionalidade **já existe em produção**. Encerrado como **Não Contratado** em 22/05/2026.

**Módulo/Rota:** Portal do Comprador → **Definir Vencedor Cotação** (`#/propostaVencedora`) → modal **"Analisar Cotação \<nº\>"** → proposta do fornecedor.

**Pré-condições**
- Uma cotação com propostas recebidas, pronta para definição de vencedor.
- **Bloqueio:** dois. (1) Conta de QA sem matrícula de comprador — grade vazia. (2) **Funcionalidade não entregue** — o caso reprova hoje por decisão comercial; executá-lo serve para provar que a regressão em relação à produção persiste.

**Passos**
1. Abrir `#/propostaVencedora` e abrir a cotação — o modal se chama **"Analisar Cotação \<nº\>"**.
2. Abrir a proposta do fornecedor que se pretende declarar vencedor.
3. Procurar, nessa etapa, um controle de **anexar arquivo** e um campo de **justificativa da escolha do vencedor**.
4. Verificar quais campos de texto e de anexo estão realmente disponíveis nesta etapa.

**Resultado esperado**
- A etapa de definição do vencedor oferece **campo de anexo** (upload de documentação comprobatória) e **campo de justificativa** da escolha, ambos gravados junto da decisão e visíveis para quem aprova a alçada.
- A documentação anexada nessa etapa fica acessível a partir da SC/alçada, compondo a trilha de auditoria da decisão.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Na nova versão não há como anexar arquivo nem registrar justificativa ao definir o vencedor; quem aprova ou reprova a alçada decide sem a documentação comprobatória e sem trilha de auditoria — comportamento que **existe em produção** e se perdeu. **É o comportamento de hoje.**

**Severidade:** Alta (decisão de alçada sem documentação de suporte; perda de trilha de auditoria e regressão frente à produção)

**Preparação de massa:** uma cotação com pelo menos duas propostas válidas, pronta para definição de vencedor, e um documento comprobatório para anexar. Depende do time de Compras.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *lido no fonte publicado* — no componente da proposta (`app-card-cotacao`, usado tanto na Avaliação de Propostas quanto no Definir Vencedor Cotação) existem: **Visualizar Anexos** (apenas leitura, monta a lista por `dsConsultaAnexos_Cotacao` / `dsConsultaAnexosNegociacao` e valida a URL com `isSafeAttachmentUrl`), **Ver todos Anexos** no rodapé do modal, e um único campo de texto obrigatório — **"Justificar Alteração de Valor *"** — que se refere à alteração de valor unitário/frete, **não** à escolha do vencedor. **Não existe nenhum controle de upload de arquivo** nem campo de justificativa da decisão de vencedor em todo o bundle do widget. *Visto renderizado* — `#/propostaVencedora` abre com a mesma grade da Avaliação de Propostas (10 colunas) e sem linhas.
**Divergências encontradas:** o rótulo do ticket ("definição do vencedor da cotação") corresponde hoje a **Definir Vencedor Cotação**, que no código é o **mesmo componente** da Avaliação de Propostas com `definindoVencedor = true` — os dois fluxos compartilham a tela e, portanto, a ausência de anexo/justificativa. Fica também registrada a pendência do ticket: o acordo de 17/04 (usar os campos na etapa de **Validação da Proposta / Negociação**) não tem, no fonte publicado do Portal do Comprador, nenhum vestígio de implementação.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4351  (ambos · Concluído · SDCASSI-365)

**Título:** Grades de Definir Vencedor Cotação e Avaliação de Propostas exibem as colunas na ordem definida e todos os valores monetários em R$

**Origem:** FSWTBC-4351 — organizar a tabela de *Definir Vencedor Cotação* (e *Avaliação de Propostas*) em ordem específica e exibir valores sempre em R$. Homologado 23/04/2026. O pedido original era um print; a ordem exata não está transcrita no ticket.

**Módulo/Rota:** Portal do Comprador › **Definir Vencedor Cotação** (`#/propostaVencedora`) e **Avaliação de Propostas** (`#/avaliacaoPropostas`) › cartão da cotação › grade de propostas e grade de itens › **Gerenciador de colunas**

**Pré-condições**
- Ao menos uma cotação com propostas visível ao comprador.
- **Bloqueio:** conta QA não é comprador; 404 no `genericQuery` DHU (grade vazia).

**Passos**
1. Abra *Definir Vencedor Cotação*, expanda uma cotação e leia a ordem dos cabeçalhos da grade de **propostas**.
2. Leia a ordem da grade de **itens** da proposta.
3. Repita em *Avaliação de Propostas*.
4. Para cada coluna de valor, leia o formato exibido (prefixo `R$`, separador de milhar `.`, decimal `,`, 2 casas).
5. Abra **Gerenciador de colunas** e confirme que a ordem padrão é a definida (sem reordenação salva pelo usuário).

**Resultado esperado**
- Grade de propostas (ordem lida no fonte): **Nº Proposta · Quantidade · Valor Unit. · Valor Frete · Valor Final · Prev. Entrega · Data Proposta · Validade Proposta · Tipo de Frete · Cond. Pgto · Obs. Fornecedor**.
- Grade de itens: **Valor Referência SC · Val. Unit. Cotado · Val. Frete · Val. Total Item · Necessidade · Prev. Entrega · Fil. Entrega · Obs. Fornecedor · Obs. Comprador · Qtd. Definida · Código · Loja · Fornecedor** (precedidas por Núm. Cotação/Item/Produto).
- **Valor Final / Val. Total Item** em `R$ 1.234,56`; **Valor Unit. / Val. Unit. Cotado / Valor Frete / Val. Frete / Valor Referência SC** também em R$ com 2 casas (ver divergência).
- Mesma ordem nas duas telas.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Colunas fora da ordem pedida; valores sem `R$` (número cru, casas decimais ambíguas).

**Severidade:** Baixa — apresentação; risco de leitura errada de decimais.

**Preparação de massa:** nenhuma — leitura sobre cotação existente com comprador real.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *visto renderizado* — as duas rotas abrem com **Filtrar**, **Gerenciador de colunas**, **Pesquisar**, **Carregar mais resultados**; "R$" **não encontrado** na tela porque a grade está vazia (404). *Lido no fonte publicado* — as duas listas de colunas acima, na ordem em que estão declaradas; **apenas `C8_TOTAL` ("Valor Final"/"Val. Total Item") é `type:"currency", format:"BRL"`**; `unitPrice`, `freight` e `refePrice` são `type:"string"` (formatados antes por `handlerFullPrice()` em pt-BR/BRL com 2 casas, segundo lote anterior; quantidade e referência usam 6 casas).
**Divergências encontradas:** o ticket pede "sempre R$"; no fonte só uma coluna por grade é monetária nativa — as demais dependem de pré-formatação em string, o que o passo 4 precisa confirmar em tela. A ordem "específica" do ticket não foi transcrita (era imagem): a ordem esperada acima é a **publicada**, não a pedida.
**Dados/massa usados:** nenhum — não submetido.

## CT-FSWTBC-4353  (fluig · Concluído · SDCASSI-367)

**Título:** Usar o comando de visualizar a cotação/negociação em resoluções diferentes sem perder o controle da tela.

**Origem:** FSWTBC-4353 — ajuste de responsividade do campo "Ver cotação/negociação", para adaptação a diferentes resoluções e dispositivos.

**Módulo/Rota:** Portal do Comprador → **Avaliação de Propostas** (`#/avaliacaoPropostas`) e **Definir Vencedor Cotação** (`#/propostaVencedora`) → modal **"Analisar Cotação \<nº\>"** → rodapé de botões da proposta.

**Pré-condições**
- Uma cotação com proposta de fornecedor, com processo de cotação ou de negociação associado.
- **Bloqueio:** conta de QA sem matrícula de comprador — a grade não carrega e o modal não abre.

**Passos**
1. Abrir `#/avaliacaoPropostas` e abrir uma cotação, depois uma proposta.
2. Localizar o botão **Visualizar Cotação/Negociação** (ícone de olho) na faixa de botões da proposta.
3. Redimensionar a janela para larguras de desktop, tablet e celular (por exemplo 1920, 1024, 768 e 375 px) e, em cada uma, verificar se o botão continua inteiro, legível e clicável, sem sobrepor outro controle.
4. Acionar o botão e conferir o que abre.

**Resultado esperado**
- Em todas as larguras testadas o botão **Visualizar Cotação/Negociação** permanece visível, com o rótulo completo, dentro da área da tela e sem sobreposição com **Validar Proposta**, **Negociar**, **Cancelar Proposta**, **Verificar Parecer Técnico**, **Salvar Valores Atualizados** e **Visualizar Anexos**.
- Ao acionar, abre em nova aba a visualização do processo de **cotação** (se houver processo de cotação para o fornecedor) ou de **negociação** (caso contrário), em `pageworkflowview` com `taskLoadViewMode=true`.
- Não havendo nenhum dos dois, aparece o aviso **"Nenhum processo encontrado para essa cotação!"** — e nada é aberto.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O campo quebrava o layout em resoluções menores, escondendo informação ou deixando o controle inacessível — situação que, neste mesmo épico, já se confundiu com "ação que não funciona" (ver FSWTBC-4350).

**Severidade:** Baixa (apresentação/usabilidade)

**Preparação de massa:** uma cotação com proposta e processo de cotação ou negociação vinculado. Depende do time de Compras.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *lido no fonte publicado* — o botão é declarado como `["p-label","Visualizar Cotação/Negociação","p-icon","an an-eye",1,"po-md-3",3,"p-click"]`, dentro de um contêiner `po-row po-mb-1 po-pull-right`; a ação (`viewFluigQuote`) busca primeiro `getProcessIdQuote` e, se não achar, `getProcessIdNegotiation`, abrindo por `openSafeUrl` — e avisando "Nenhum processo encontrado para essa cotação!" quando não há nenhum. O modal de visualização usa `iframe` com `width="100%"` e `height="600"` **fixo**. *Visto renderizado* — nada do botão: sem linhas na grade, o modal não abre.
**Divergências encontradas:** duas. (1) O rótulo do ticket ("Ver cotação/negociação") **não é** o da tela; hoje é **"Visualizar Cotação/Negociação"**. (2) Ponto de atenção para reteste: os botões dessa faixa declaram **apenas** a classe `po-md-3`, sem variantes `po-sm-*`, `po-lg-*` ou `po-xl-*` — a adaptação abaixo de *medium* depende do comportamento padrão do PO-UI, e a altura do iframe é fixa em 600 px. Vale exercitar o passo 3 nas duas pontas de resolução.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4359  (fluig · Concluído · SDCASSI-372)

**Título:** Conferir se os valores exibidos na tela de Controle de Cotação batem para uma SC centralizada.

**Origem:** FSWTBC-4359 — valores divergentes na tela Controle de Cotação para a SC 10814 (centralizada). O ticket foi homologado **sem causa nem correção documentadas**.

**Módulo/Rota:** Portal do Comprador → **Controle De Cotações** (`#/controleCotacao`) → tabela de **itens** e tabela de **fornecedores** do cartão; e o modal **"Cotações Fornecedor \<nome\>"**.

**Pré-condições**
- Uma cotação originada de **SC centralizada** (várias SC de origem, itens de mais de uma filial de entrega).
- Propostas recebidas de pelo menos dois fornecedores.
- **Bloqueio:** conta de QA sem matrícula de comprador — grade vazia. Sem acesso ao Protheus, o confronto final com a SC8/SC1 do ERP não é executável nesta rodada; a conferência abaixo é **interna à tela**, que é o que o Fluig permite provar.

**Passos**
1. Abrir `#/controleCotacao` e localizar a cotação da SC centralizada.
2. Na tabela de **itens** do cartão, anotar `Qtd. SC`, `Valor Referência SC` e `Fil. Entrega` de cada linha, e conferir a coluna **Nº SC Origem**.
3. Na tabela de **fornecedores**, anotar **Valor Total Cotação** de cada fornecedor.
4. Abrir o modal de propostas do fornecedor e anotar **Valor Total**, **Valor do Frete Total** e **Saving** do cabeçalho, além dos valores de cada item.
5. Recompor o Valor Total à mão a partir dos itens e comparar com o exibido.
6. Acionar **Exportar Dados** no cartão e conferir os mesmos números nas abas **Cabeçalho**, **Fornecedores** e **Produtos** da planilha.

**Resultado esperado**
- Todos os valores monetários são apresentados no padrão pt-BR/BRL, com 2 casas decimais.
- O **Valor Total** da proposta corresponde à soma, item a item, de: (quantidade definida × preço unitário) quando há quantidade definida (`C8_XQTAUDI` > 0), ou o valor total do item quando não há; **menos** IPI, **menos** desconto, **mais** frete.
- O **Valor do Frete Total** é a soma simples dos fretes dos itens.
- Em SC centralizada, a coluna **Nº SC Origem** identifica a SC de origem de cada item (não repete a SC centralizadora) e o cabeçalho do cartão traz as SC vinculadas concatenadas.
- Os valores da tela, do modal e das três abas da planilha são **idênticos** entre si.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A tela Controle de Cotação exibia, para a SC 10814 (centralizada), valores divergentes entre si e/ou em relação à composição das propostas — sem que se possa dizer, pelo registro do ticket, se a divergência era de cálculo, de agregação por filial ou de formatação.

**Severidade:** Alta (valor exibido é o critério de escolha do vencedor)

**Preparação de massa:** uma cotação de **SC centralizada** com itens de pelo menos duas filiais de entrega, propostas de dois fornecedores, e ao menos um item com **quantidade definida** (`C8_XQTAUDI`) diferente da quantidade cotada, para exercitar os dois ramos da fórmula. Depende do time de Compras.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *lido no fonte publicado* — a composição do total (`handlerSumProposals`): para cada item, `C8_XQTAUDI > 0 ? C8_PRECO × C8_XQTAUDI : C8_TOTAL`, subtraindo `C8_VALIPI` e `C8_VLDESC` e somando `C8_VALFRE`; o total do frete como soma de `C8_VALFRE`; a formatação por `handlerFullPrice()` em `pt-BR/BRL` com 2 casas (aceitando tanto "1.234,56" quanto "1234,56" na entrada), enquanto quantidade e valor de referência usam **6** casas (`padDecimal.money`); `numSolCompra = c1_scori || c1_num` (SC de origem em compra centralizada) e `c1_num` do cabeçalho montado como a lista de `C8_NUMSC` distintos unida por `" - "`. **Ponto de atenção levantado na leitura:** a consulta dos itens usa `C1_FILIAL='<filial da cotação>' AND C1_COTACAO='<nº>'`, ou seja, filtra por **uma** filial — candidato natural a divergência em compra centralizada, que por definição atende várias. *Visto renderizado* — apenas que a rota abre, sem linhas.
**Divergências encontradas:** o ticket diz "tela Controle de Cotação"; o rótulo é **Controle De Cotações**. Achado próprio a levar ao time: o **IPI é subtraído** do total da proposta (`s -= C8_VALIPI`) — regra que merece confirmação de negócio, porque o comportamento usual seria somá-lo ou tratá-lo à parte.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4360  (fluig · Concluído · SDCASSI-371)

**Título:** Saber para qual filial vai cada item da proposta, na tela e na planilha, em compra centralizada.

**Origem:** FSWTBC-4360 — a filial de entrega não era exibida nos Detalhes da Proposta do Fornecedor (aba Controle de Cotação) nem contemplada na exportação da planilha, na SC 10813 (centralizada).

**Módulo/Rota:** Portal do Comprador → **Controle De Cotações** (`#/controleCotacao`) → tabela de itens do cartão e modal **"Cotações Fornecedor \<nome\>"** → botões **Exportar** (modal) e **Exportar Dados** (cartão).

**Pré-condições**
- Cotação de **SC centralizada**, com itens destinados a mais de uma filial de entrega (`C1_FILENT` / `C8_FILENT` preenchidos e distintos).
- Proposta recebida de ao menos um fornecedor.
- **Bloqueio:** conta de QA sem matrícula de comprador — grade vazia, modal não abre e exportação não pode ser disparada.

**Passos**
1. Abrir `#/controleCotacao` e localizar a cotação da SC centralizada.
2. Conferir a tabela de itens do cartão — cabeçalho e valores da coluna de filial de entrega.
3. Abrir a proposta do fornecedor (modal **"Cotações Fornecedor \<nome\>"**) e conferir a coluna de filial de entrega na tabela de itens da proposta.
4. Acionar **Exportar Dados** no cartão e conferir a aba **Produtos** da planilha.
5. Acionar **Exportar** no rodapé do modal e conferir a planilha da proposta.

**Resultado esperado**
- A tabela de itens do cartão traz a coluna **Fil. Entrega** (propriedade `c1_filent`), junto de `Filial | Nº SC Origem | Produto | Descrição | Qtd. SC | Valor Referência SC | Necessidade`.
- A tabela de itens da proposta traz **Fil. Entrega** (propriedade `C8_FILENT`), ao lado de **Prev. Entrega**.
- A planilha do cartão (`SC_<nº da cotação>.xlsx`) tem três abas — **Cabeçalho**, **Fornecedores** e **Produtos** — e a aba **Produtos** traz as colunas `Filial | Nº SC Origem | Produto | Descrição | Qtd. SC | Valor Referência SC | Necessidade | Fil. Entrega`.
- A planilha da proposta traz **Fil. Entrega** na sequência de colunas do item, logo após **Prev. Entrega**.
- Em compra centralizada, itens de filiais diferentes exibem valores **diferentes** em Fil. Entrega — a coluna não repete a filial da cotação.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Nem os Detalhes da Proposta do Fornecedor nem a planilha exportada mostravam a filial de entrega, de modo que, numa cotação que atende várias filiais, não se sabia para onde iria cada item — inviabilizando avaliar frete, prazo e logística da proposta.

**Severidade:** Média

**Preparação de massa:** cotação de SC centralizada com itens de pelo menos duas filiais de entrega distintas e uma proposta recebida. Depende do time de Compras.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *lido no fonte publicado* — `columsItens` do cartão de Controle De Cotações incluindo `{property:"c1_filent",label:"Fil. Entrega"}`; `getCardQuoteColumns()` incluindo `{property:"C8_FILENT",label:"Fil. Entrega"}`; a exportação do cartão (`exportar()`) montando as três abas **Cabeçalho / Fornecedores / Produtos** com o cabeçalho `["Filial","Nº SC Origem","Produto","Descrição","Qtd. SC","Valor Referência SC","Necessidade","Fil. Entrega"]` e arquivo `SC_<dhu_num>.xlsx`; e a exportação da proposta (`exportDataSupplierQuotes()`) mapeando `"Fil. Entrega": p.C8_FILENT`. *Visto renderizado* — apenas que a rota abre, com "Nenhum dado encontrado".
**Divergências encontradas:** duas. (1) O ticket fala em "Detalhes da Proposta do Fornecedor (aba Controle de Cotação)"; hoje o caminho é o **modal "Cotações Fornecedor \<nome\>"**, aberto a partir do cartão da tela **Controle De Cotações**. (2) A coluna **Fil. Entrega** está presente na tabela de itens da proposta (`getCardQuoteColumns`), mas **não** na tabela de propostas por fornecedor (`columsSuppliersQuote`, que traz Prev. Entrega e não traz Fil. Entrega) — se a conferência do cliente for feita naquela segunda tabela, a informação continua ausente. Vale reteste dirigido a esse ponto.
**Dados/massa usados:** nenhum — não submetido.

---

## Resumo do lote

| # | Chave | SDCASSI | Resolução | Verificado | Severidade |
|---|---|---|---|---|---|
| 1 | FSWTBC-4311 | 346 | Feito | PARCIAL | Média |
| 2 | FSWTBC-4312 | 347 | Feito | PARCIAL | Alta |
| 3 | FSWTBC-4317 | 349 | Feito | PARCIAL | Baixa |
| 4 | FSWTBC-4323 | 352 | Feito | PARCIAL | Alta |
| 5 | FSWTBC-4341 | 357 | Não Contratado | PARCIAL | Baixa |
| 6 | FSWTBC-4342 | 356 | Não Contratado | PARCIAL | Média |
| 7 | FSWTBC-4344 | 359 | Não Contratado | PARCIAL | Média |
| 8 | FSWTBC-4347 | 363 | Não Contratado | PARCIAL | Alta |
| 9 | FSWTBC-4348 | 362 | Feito | PARCIAL | Alta |
| 10 | FSWTBC-4349 | 364 | Não Contratado | PARCIAL | Alta |
| 11 | FSWTBC-4353 | 367 | Feito | PARCIAL | Baixa |
| 12 | FSWTBC-4354 | 368 | Feito | PARCIAL | Alta |
| 13 | FSWTBC-4359 | 372 | Feito | PARCIAL | Alta |
| 14 | FSWTBC-4360 | 371 | Feito | PARCIAL | Média |

## CT-FSWTBC-4417  (fluig · Concluído · SDCASSI-377)

**Título:** Enviar uma Solicitação de Compras recém-criada e confirmar que a instância sai da primeira etapa e assume a atividade seguinte.

**Origem:** FSWTBC-4417 — Solicitações de Compra não avançavam da primeira etapa do fluxo. Encerrado como **"Não será feito"**: o cliente identificou que era **parametrização de pasta** feita internamente (Geise e Calixto), não defeito de código. Não há registro de qual parametrização era, nem confirmação de que as SCs travadas foram destravadas.

**Módulo/Rota:** Processos → **Solicitação de Compras** (`wf_solicitacao_compras`) → botão **Enviar**; verificação em **Portal do Comprador → Validação Inicial** (coluna **Etapa**) e na aba **Histórico** do processo.

**Pré-condições**
- Perfil solicitante com permissão de abrir SC e com **pasta do GED de destino publicada e parametrizada** (é a variável que causou o incidente).
- Massa mínima de item: Filial, Grupo de Produto, Produto, Centro de Custo e Data de Necessidade válidos.
- **Bloqueio:** o caso **exige submeter** uma SC (`POST .../wf_solicitacao_compras/start`), o que não foi feito nesta sessão por decisão de escopo (§2 do briefing: preferir não submeter). A parametrização de pasta citada no ticket **não é auditável pelo front-end** — não existe tela no Fluig que mostre "qual pasta o processo grava".

**Passos**
1. Abrir **Processos → Solicitação de Compras** e preencher os campos obrigatórios (marcados com `*`; o formulário anuncia *"Todos os campos com * são de preenchimento obrigatório."*), usando prefixo **QA** em todo texto livre.
2. Clicar em **Enviar**.
3. Na tela de confirmação, anotar o **número do processo** gerado.
4. Abrir o processo recém-criado e ir à aba **Histórico**.
5. Abrir **Portal do Comprador → Validação Inicial** e localizar o número da solicitação na coluna **Nº Solic**.
6. Ler as colunas **Etapa** e **Status** dessa linha.

**Resultado esperado**
- O envio conclui sem erro e o processo recebe número.
- No **Histórico**, além do movimento de **Início** (sequência 6), existe um movimento para a atividade seguinte — hoje **Validação do Gestor** (sequência **7**), ou **Validação Orçamentária** (14) / **Validação do Comprador** (119) conforme o roteamento do item.
- Na **Validação Inicial**, a linha da SC exibe **Etapa** diferente de "Início" — os valores legítimos observados hoje são **Validação do Gestor**, **Validação do Comprador** e **Validação Orçamentária** — e **Status** em **Em Andamento** ou **Pronto p/ Validação**.
- Se houver falha de gravação no GED, a plataforma apresenta erro **explícito** na movimentação; a SC **não** deve ficar parada silenciosamente na etapa inicial.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A SC permanecia **na primeira etapa** mesmo após as ações necessárias, **sem mensagem de erro** — sintoma idêntico ao de vários defeitos reais desta base, o que torna impossível distinguir configuração de ambiente de defeito de produto só pelo comportamento.

**Severidade:** Média

**Preparação de massa:** ambiente com a **pasta do GED de destino do `wf_solicitacao_compras` publicada e parametrizada** (responsável: administrador Fluig da CASSI — foi exatamente esta a ação interna que encerrou o chamado). Sem isso, o teste mede a parametrização, não o produto.

**Verificado em tela:** PARCIAL
**O que foi verificado:** formulário `wf_solicitacao_compras` abre normalmente (título do documento *Movimentar Solicitação*, aba **Formulário**, botão **Enviar**); a superfície de verificação do avanço existe e está povoada — **Validação Inicial com 24 linhas** exibindo Etapa/Status reais. O mapa de atividades da versão **98** do processo foi lido via REST e confirma as sequências citadas (6 Início, 7 Validação do Gestor, 14 Validação Orçamentária, 119 Validação do Comprador).
**Divergências encontradas:** o ticket não nomeia a "primeira etapa". No fluxo publicado hoje, a primeira etapa **humana** é **Validação do Gestor** (sequência 7); a sequência 6 é o evento **Início**. Nenhuma tela do Fluig expõe a parametrização de pasta apontada como causa — este ponto **não tem superfície de front-end**.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4453  (fluig · Concluído · SDCASSI-383)

**Título:** Percorrer as telas do Portal do Comprador e do formulário da SC conferindo que nenhum texto instrui o usuário a usar controle inexistente.

**Origem:** FSWTBC-4453 — ajuste de textos nas telas do ambiente **TST**: remoção de termos que referenciam funcionalidades ou opções **inexistentes**, o que fazia o usuário procurar um controle que não existe e concluir que o sistema estava com defeito. Homologado — mas o aceite foi dado **"na DES"**, enquanto o problema reportado era do **TST**.

**Módulo/Rota:** **Portal do Comprador** (`/portal/p/1/portal-do-comprador`) — abas *Validação Inicial, Controle De Cotações, Avaliação de Propostas, Definir Vencedor Cotação* — e formulário **Solicitação de Compras**.

**Pré-condições**
- Acesso ao ambiente que se quer auditar (**DES**, **TST** e **PRD** separadamente — o ponto do ticket é justamente a divergência entre eles).
- **Bloqueio:** só há acesso a **um** ambiente (`caixade182374.fluig.cloudtotvs.com.br`). A comparação DES × TST, que é o coração do chamado, **não é executável** com o acesso disponível.

**Passos**
1. Abrir o **Portal do Comprador** e percorrer, uma a uma, as quatro entradas do painel **Acesso Rápido**.
2. Em cada tela, ler **todo** texto de instrução, título de card, tooltip, placeholder e mensagem de vazio.
3. Para cada texto que **cite um controle** (botão, aba, opção, ícone), localizar esse controle na tela.
4. Abrir o painel **Filtrar** de cada grade e repetir a conferência nos rótulos dos campos.
5. Abrir o formulário da **Solicitação de Compras** e repetir a leitura em cada seção.
6. Registrar toda citação sem controle correspondente, com o texto literal e a tela.
7. Repetir o roteiro no outro ambiente e comparar os textos item a item.

**Resultado esperado**
- Todo texto de instrução cita **apenas** controles que existem naquela tela, naquele ambiente.
- Os mesmos textos aparecem **iguais** em DES, TST e PRD — divergência entre ambientes é achado.
- No formulário da SC, o texto de abertura é *"Todos os campos com \* são de preenchimento obrigatório."* e todos os campos marcados com `*` são de fato obrigatórios.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Telas do TST exibindo termos que referenciam **funcionalidades ou opções inexistentes** — resquício de versão anterior ou de outro ambiente — levando o usuário a procurar um controle que não está lá. O ticket não transcreve os termos removidos; os anexos (2 prints) não estão disponíveis aqui.

**Severidade:** Baixa

**Preparação de massa:** nenhuma massa de dados. Exige **acesso simultâneo a DES e TST** e um inventário dos textos de cada tela (não existe hoje) para servir de baseline.

**Verificado em tela:** PARCIAL
**O que foi verificado:** os textos de instrução hoje renderizados foram lidos nas telas listadas na seção A. **Achado desta sessão:** o formulário **Delegação de Fiscais de Contratos e Serviços** exibe, no lugar do cabeçalho padrão, o texto *"Todos os campos com \* são obrigatórios já os campos com \* não são obrigatórios"* — a frase distingue dois marcadores usando **o mesmo caractere `*` nas duas metades**, o que a torna impossível de seguir. É exatamente a família de problema tratada neste ticket, num formulário diferente do citado. Para comparação, o formulário da SC traz a versão correta: *"Todos os campos com \* são de preenchimento obrigatório."*
**Divergências encontradas:** o ticket é do **TST** e o aceite foi registrado **na DES** — não há confirmação de que o ajuste chegou ao ambiente onde o defeito foi visto; nesta sessão não foi possível verificar nenhum dos dois. Achado adicional: a frase confusa do formulário de Delegação de Fiscais (acima).
**Dados/massa usados:** nenhum — apenas leitura de tela.

---

## CT-FSWTBC-4455  (fluig · Concluído · SDCASSI-385)

**Título:** Alterar a data de validade de uma cotação e confirmar que datas retroativas não podem ser selecionadas em nenhuma das telas que oferecem a ação.

**Origem:** FSWTBC-4455 — impedir a seleção de datas **retroativas** em "Alterar data de validade" da cotação. Na primeira entrega a regra valeu em duas telas e faltou numa: *"em Controle de Cotação ainda está trazendo retroativo"*, enquanto *"em Avaliação e Definir Vencedor está ok"*.

**Módulo/Rota:** **Portal do Comprador** → **Controle De Cotações** (`#/controleCotacao`), **Avaliação de Propostas** (`#/avaliacaoPropostas`) e **Definir Vencedor Cotação** (`#/propostaVencedora`) → ação de linha **Alterar Data de Validade**.

**Pré-condições**
- Comprador com **matrícula resolvida no ERP** e ao menos uma cotação visível em **cada** uma das três telas.
- Cotações em dois estados: uma com **Dt. Validade futura** e outra com **Dt. Validade já vencida**.
- **Bloqueio:** a conta `TOTVS-FS` não resolve matrícula de comprador e o `genericQuery` do Portal responde **404** — as três grades exibem **"Nenhum dado encontrado"**, portanto **o modal não pôde ser aberto**. Limitação de conta + instabilidade de ambiente (§5-C), não defeito.

**Passos**
1. Abrir **Portal do Comprador → Controle De Cotações**.
2. Numa linha com **Dt. Validade futura**, acionar a ação **Alterar Data de Validade** (ícone `an an-calendar`).
3. Conferir o título do modal: **"Alterar Data de Validade da Cotação `<nº da cotação>` - `<filial>`"** e a pergunta **"Qual a validade desejada para a cotação?"**.
4. Abrir o seletor do campo **Data de Validade** (placeholder *"Informe a nova data de validade da cotação"*) e tentar selecionar **ontem** e uma data anterior à validade atual.
5. Registrar quais datas o calendário deixa selecionar.
6. Fechar o modal pelo botão **Fechar**, **sem** clicar em **Confirmar**.
7. Repetir os passos 2–6 em **Avaliação de Propostas** e em **Definir Vencedor Cotação**.
8. Repetir o roteiro numa cotação com **Dt. Validade já vencida**.

**Resultado esperado**
- Nas **três** telas o comportamento é idêntico — a correção parcial é o modo de falha que este ticket documenta.
- Toda data **anterior a hoje** aparece **desabilitada** no calendário e não pode ser escolhida.
- Se a validade atual da cotação for **futura**, a data mínima selecionável é a **própria validade atual** (não se pode encurtar a janela para trás).
- Se a validade atual já estiver **vencida**, a data mínima selecionável é **hoje**.
- O campo **Data de Validade** é obrigatório (`p-required`), e o modal só oferece **Confirmar** e **Fechar**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Em **Controle de Cotação** o calendário ainda oferecia datas retroativas ("ainda está trazendo retroativo"), enquanto Avaliação e Definir Vencedor já bloqueavam — permitindo tornar a cotação vencida no instante da alteração, fechando a janela de proposta e, no limite, dirigindo o resultado da cotação.

**Severidade:** Alta

**Preparação de massa:** duas cotações visíveis ao comprador executor — uma com **Dt. Validade futura** e outra **vencida** — presentes nas três telas. Depende de matrícula de comprador válida no ERP e do `genericQuery` do Portal respondendo. Quem prepara: área de Compras + suporte de ambiente.

**Verificado em tela:** PARCIAL
**O que foi verificado:** as três rotas abrem e renderizam cabeçalho e coluna **Dt. Validade**, mas com **"Nenhum dado encontrado"** (`404` em `genericQuery`). No **fonte publicado** do widget, os dois componentes que oferecem a ação (`editQuotes`, usado em Avaliação/Definir Vencedor, e `editCotacao`, usado em Controle de Cotação) calculam a data mínima **da mesma forma**: `startDate = (validade atual for posterior a hoje) ? validade atual : hoje`, e esse `startDate` é ligado ao **`p-min-date`** do `po-datepicker` do campo `newDateQuote`. Os textos citados nos passos (`"Alterar Data de Validade"`, `"Alterar Data de Validade da Cotação ..."`, `"Qual a validade desejada para a cotação?"`, `"Data de Validade"`, `"Informe a nova data de validade da cotação"`, `Confirmar`, `Fechar`) foram todos lidos no fonte publicado.
**Divergências encontradas:** o ticket escreve "Alterar data de validade"; o rótulo real é **"Alterar Data de Validade"**. O ticket fala em três telas sem nomeá-las com precisão; hoje a ação está em **dois componentes distintos** do widget, ambos com a mesma regra de mínimo — a correção parcial relatada não é mais visível no fonte.
**Dados/massa usados:** nenhum — nenhum modal submetido, nenhuma validade alterada.

---

## CT-FSWTBC-4457  (fluig · Concluído · SDCASSI-387)

**Título:** Conferir na grade de cotações que o status exibido corresponde à etapa real em que o processo está.

**Origem:** FSWTBC-4457 — o status exibido não refletia a etapa: onde deveria constar **Validação da proposta** aparecia **negociação**, e onde deveria constar **Aprovação de Alçadas** aparecia **analisado**. O comprador lia um status de outra fase e agia fora de hora — movimentar processo no momento errado já foi associado, no mesmo épico, a falhas nas integrações (SDCASSI-352).

**Módulo/Rota:** **Portal do Comprador** → **Controle De Cotações / Avaliação de Propostas / Definir Vencedor Cotação** → coluna **Status** da grade.

**Pré-condições**
- Cotações visíveis ao comprador em pelo menos dois estados distintos: uma com o processo de **negociação** parado em **Validação da Proposta** (sequência **20** de `wf_negociacao_cotacao_prod_serv`) e outra com a SC em **Aprovação de Alçada** (sequência **94** de `wf_solicitacao_compras`).
- **Bloqueio:** grades vazias para esta conta (matrícula de comprador não resolvida + `genericQuery` 404). Nenhum valor de status pôde ser lido na grade de cotações.

**Passos**
1. Abrir **Portal do Comprador → Controle De Cotações**.
2. Para cada linha, ler o valor da coluna **Status**.
3. Anotar o **Nº. Proc. Fluig** da linha e abrir esse processo (Processos ou Tracker).
4. Na aba **Histórico**, identificar a **atividade atualmente ativa** da instância (e das instâncias filhas de cotação/negociação).
5. Comparar o status da grade com a atividade real, usando a tabela de correspondência abaixo.
6. Repetir em **Avaliação de Propostas** e em **Definir Vencedor Cotação**.

**Resultado esperado**
- O status exibido corresponde à etapa real, segundo o mapeamento publicado hoje:
  - processo de negociação parado na atividade **20 — Validação da Proposta** → status **"Validação de Propostas"**;
  - negociação nas atividades **10 / 34 / 51 / 53 / 56 / 58 / 62** → status **"Em Integração"**;
  - demais estados de negociação → status **"Em Negociação"**;
  - SC na atividade **309** → **"Gerar Alçada"**; nas atividades **94 ou 210** → **"Aprovação de Alçadas"**; nas atividades **323 ou 332** → **"Geração Pedido/Contrato"**; nas atividades **185 ou 191** → **"Analisado"**; nenhuma delas → **"Em andamento"**.
- Os dez rótulos possíveis da coluna Status são exatamente: **Em andamento, Analisar, Em Cotação, Em Integração, Validação de Propostas, Em Negociação, Gerar Alçada, Aprovação de Alçadas, Geração Pedido/Contrato, Analisado**.
- Uma cotação em **Validação da Proposta** nunca exibe "Em Negociação"; uma SC em **Aprovação de Alçadas** nunca exibe "Analisado".

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Onde deveria constar **"Validação da proposta"** a grade mostrava **"negociação"** (confundindo com a etapa inicial de negociação), e onde deveria constar **"Aprovação de Alçadas"** mostrava **"analisado"** (confundindo com a etapa inicial de validação de propostas).

**Severidade:** Média

**Preparação de massa:** ao menos uma cotação com negociação parada em **Validação da Proposta** e uma SC em **Aprovação de Alçada**, visíveis ao comprador executor. Depende de matrícula de comprador válida. Quem prepara: área de Compras.

**Verificado em tela:** PARCIAL
**O que foi verificado:** a coluna **Status** existe e é a primeira da grade nas três telas (visto renderizado), mas sem linhas. A lista completa dos dez rótulos e a regra que deriva o status a partir de `NUM_SEQ_ESTADO` foram **lidas no fonte publicado** (`STATUS_LABELS` e `handlerStatus`). O nome real das atividades foi **confirmado por REST** contra o histórico de movimentos: em `wf_negociacao_cotacao_prod_serv` a **sequência 20 é literalmente "Validação da Proposta"** e a **10 é "Integração com ERP"** — o que fecha exatamente o par citado no ticket. Uma segunda superfície de status **foi vista com dados**: a grade **Validação Inicial**, cuja coluna **Etapa** exibe hoje *Validação do Gestor*, *Validação do Comprador* e *Validação Orçamentária*, com **Status** *Em Andamento* / *Pronto p/ Validação* — todos coerentes com as atividades 7, 119 e 14 do `wf_solicitacao_compras`.
**Divergências encontradas:** o ticket escreve **"Validação da proposta"**; o rótulo do status na tela é **"Validação de Propostas"** (a **atividade** do BPM é que se chama "Validação da Proposta"). O ticket escreve "Aprovação de Alcadas"; o rótulo é **"Aprovação de Alçadas"**. As sequências 53, 56, 58 e 62 usadas na regra de status **não aparecem** nos 12.000 movimentos lidos de `wf_negociacao_cotacao_prod_serv` (versões 24/25) — ou são de versão anterior, ou não foram percorridas no período.
**Dados/massa usados:** nenhum — apenas leitura.

---

## CT-FSWTBC-4458  (fluig · Concluído · SDCASSI-386)

**Título:** Acionar "Ver Itens" numa cotação e confirmar que a lista de itens é carregada na área inferior da tela.

**Origem:** FSWTBC-4458 — a opção **"Ver Itens"** não carregava as informações na parte inferior da tela, impedindo a visualização dos itens e a análise do processo. Falha silenciosa: o usuário aciona, nada acontece e não há mensagem. Corrigido sem causa documentada.

**Módulo/Rota:** **Portal do Comprador** → **Avaliação de Propostas** / **Definir Vencedor Cotação** → ação de linha **Ver Itens** (ícone `an an-info`).

**Pré-condições**
- Comprador com matrícula resolvida no ERP e ao menos uma cotação listada, com **itens cadastrados** (SC com produtos).
- **Bloqueio:** grades vazias para esta conta (`genericQuery` 404 + matrícula de comprador não resolvida). A ação de linha **não pôde ser acionada**.

**Passos**
1. Abrir **Portal do Comprador → Avaliação de Propostas**.
2. Selecionar uma linha de cotação e acionar a ação **Ver Itens**.
3. Observar a **área inferior** da tela (painel de detalhe com rolagem própria).
4. Conferir que a tabela de itens é preenchida e ler seus cabeçalhos.
5. Conferir que os valores batem com a cotação selecionada (número da cotação e filial exibidos no cabeçalho do detalhe, no formato `<nº cotação> - <filial>`).
6. Repetir numa cotação com **vários itens** e rolar a lista até o fim.
7. Repetir a ação em **Definir Vencedor Cotação**.

**Resultado esperado**
- Ao acionar **Ver Itens**, a área inferior é carregada com a tabela de itens da cotação selecionada.
- Os cabeçalhos da tabela são: **Núm. Cotação · Item · Produto · Descrição · Grupo · Quantidade · Unid. Medida · Dt. Necessidade**.
- Enquanto carrega, há indicação de carregamento; ao terminar, a área fica com **rolagem vertical própria** e altura fixa, sem empurrar o resto da página.
- Se a cotação não tiver itens ou a consulta falhar, é exibida **mensagem explícita** — nunca área em branco silenciosa.
- Nenhum erro aparece no console do navegador durante a ação.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A opção **"Ver Itens"** não carregava as informações na parte inferior da tela: a área ficava **vazia**, sem mensagem, privando o comprador da lista de itens no momento da análise da cotação.

**Severidade:** Média

**Preparação de massa:** uma cotação com **pelo menos 2 itens** visível ao comprador executor nas telas de Avaliação de Propostas e Definir Vencedor. Quem prepara: área de Compras. Depende de o `genericQuery` do Portal voltar a responder.

**Verificado em tela:** PARCIAL
**O que foi verificado:** as telas abrem e renderizam a grade e o botão **Filtrar**, mas com **"Nenhum dado encontrado"** — nenhuma ação de linha ficou acessível. No **fonte publicado** do widget confirmam-se: a ação **`{icon:"an an-info", label:"Ver Itens"}`** apontando para `detailsItens()`; que `detailsItens` define o painel de detalhe com `height: 30rem` e `overflow-y: auto` (a "área inferior" do ticket), marca `loadTableProducts = true`, chama `handlerTableProducts()` e usa indicador de carregamento (`loadingProducts`); e os oito cabeçalhos citados acima (`getItensColumns`). As ações vizinhas na mesma linha são **Ver Propostas**, **Verificar Parecer** e **Alterar Data de Validade**.
**Divergências encontradas:** nenhuma no rótulo — **"Ver Itens"** é exatamente o texto do fonte publicado. O ticket diz "parte inferior da tela"; no fonte, trata-se de um painel de detalhe com altura fixa e rolagem própria.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4461  (ambos · Concluído · SDCASSI-390)

**Título:** Montar uma cotação no Portal do Comprador e ver a lista de fornecedores carregada a partir do ERP.

**Origem:** FSWTBC-4461 — listagem de fornecedores **não carregava** no Portal do Comprador (TST), após a
aplicação dos pacotes. Encerrado como "liberado e homologado na SALA DE GUERRA" (28/04/2026), **sem registro
técnico** da causa ou correção.

**Módulo/Rota:** Fluig → **Portal do Comprador** (`/portal/p/1/portal-do-comprador`) → **Validação Inicial** /
*Validação do Comprador* da SC → seleção de fornecedores da cotação · datasets
`dsProtheus_getGrupProdxFornece_PortalComp_restGetAll` e `dsProtheus_getFornecedores_restGetAll`.

**Pré-condições**
- Usuário **comprador** (matrícula SY1 resolvida).
- SC em *Validação do Comprador* com produto de um grupo que tenha fornecedores amarrados (tabela AD).
- **Bloqueio:** a conta de QA **não resolve comprador** (`Comprador não encontrado.`), então a tela de seleção
  não carrega para ela. Executável por comprador real.

**Passos**
1. Como comprador, abrir **Validação Inicial**, escolher uma SC e avançar para a montagem da cotação.
2. Abrir a seleção de fornecedores (por grupo de produto).
3. Contar/ler os fornecedores listados; selecionar dois.
4. Em paralelo, chamar `GET /api/public/ecm/dataset/search?datasetId=dsProtheus_getGrupProdxFornece_PortalComp_restGetAll`
   e comparar com a lista da tela.
5. Tentar confirmar sem selecionar nenhum.

**Resultado esperado**
- A lista de fornecedores carrega com os mesmos registros que o dataset devolve (nome, CNPJ, loja, e-mail).
- Sem seleção, a mensagem **"Nenhum fornecedor selecionado."** aparece e a cotação não avança.
- Protheus fora: erro explícito, não lista vazia.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Lista de fornecedores **vazia** (prints de 27/04/2026); impossível montar a cotação.

**Severidade:** Média *(trava o fluxo na origem da cotação)*

**Preparação de massa:** SC `QA` em Validação do Comprador; comprador real.

**Verificado em tela:** PARCIAL
**O que foi verificado:** `dsProtheus_getGrupProdxFornece_PortalComp_restGetAll` → **200 com 1.000 itens** hoje
(ex.: `BANCO DO BRASIL SA` 00000000/0001 e /4945, `TARGET ENGENHARIA E CONSULTORIA S/C LTDA` 00000028/0001,
colunas `A2_NOME, A2_CGC, AD_FORNECE, AD_LOJA, A2_LOJA, A2_COD, A2_NREDUZ, A2_EMAIL`);
`dsProtheus_getFornecedores_restGetAll` → 200 (10, paginado). Portal do Comprador em *Validação Inicial* com
24 SCs, filtros *Selecione a Filial / o Produto / o Grupo de Produto / o Centro de Custo*; console
`Erro ao buscar as informações do colaborador na lista de usuários do ERP Protheus. Error: Comprador não
encontrado.` A mensagem `Nenhum fornecedor selecionado.` existe no bundle `pc_main.js`.
**Divergências encontradas:** o ticket não diz qual tela nem qual dataset; a fonte de fornecedores do Portal é
`…GrupProdxFornece_PortalComp…`, que hoje responde. O fornecedor `85070508-0001` é removido por hardcode
(A2) — ao comparar tela × dataset, ele estará no dataset e não na tela.
**Dados/massa usados:** nenhum — leitura de datasets.

---

## CT-FSWTBC-4462  (ambos · PAUSADO CLIENTE · SDCASSI-393)

**Título:** Centralizar duas Solicitações de Compras na Validação Inicial e obter uma única SC centralizadora com os itens agrupados, as originais finalizadas e — ao reenviar — nenhuma duplicata.

**Origem:** FSWTBC-4462 — cotações **não eram centralizadas**. Cadeia: duplicate key na SC8 (dado), typos
`oReponse` engolindo exceções, idempotência (`alreadyCentralized`), falha com 100/350 itens, refatoração com
rollback por compensação e processamento **assíncrono** via fila ZZY (endpoint v2 `…/centralizadora/inbound`,
`servicetask296.js`). **EM ABERTO** — desenvolvimento em DES, homologação pendente (bloqueio TOTVS Matriz
30141651). **Hoje o caso pode reprovar.**

**Módulo/Rota:** Fluig → **Portal do Comprador → Validação Inicial** → botão **Centralizar Solicitações** →
modal *Centralizando Solicitações* (**Cód Filial Centralizadora**, botão **Centralizar**) → SC centralizadora
(campos `nrSolCentralizadora`, `tbprodcent_numSCOrigem`, gateway **294 Compra Centralizada?**, service task
**296**) · **Tracker** · **Logs Protheus → Solicitacoes ZZY** (rotina CENTRALIZADORA).

**Pré-condições**
- Usuário **comprador**; duas ou mais SCs **próprias** (`QA`) na *Validação Inicial*, mesma filial, produtos iguais.
- Para o cenário de volume: SC com 100 e com 350 itens (planilha de rateio).
- **Bloqueio:** centralizar SCs de terceiros altera registro pré-existente — **não executado**. A conta de QA não
  resolve comprador. Só um comprador com SCs próprias pode rodar.

**Passos**
1. Em **Validação Inicial**, marcar as duas SCs `QA` e clicar **Centralizar Solicitações**.
2. No modal, informar **Cód Filial Centralizadora** e clicar **Centralizar**.
3. Ler a mensagem de retorno; anotar o número da SC centralizadora.
4. Abrir a SC centralizadora: itens agrupados (`tbProdutosCentralizados` com *Nº SC Origem ERP* por linha),
   `nrSolCentralizadora` preenchido; **Histórico** passando por *Compra Centralizada?*.
5. No **Tracker**, as SCs de origem aparecem como finalizadas; a centralizadora segue para cotação com
   **Nº da Cotação ERP** preenchido.
6. **Idempotência:** repetir o envio (reenviar a centralizadora de *Correção*, se cair): nenhuma segunda cotação;
   o número existente é devolvido.
7. **Volume:** repetir 1–5 com a SC de 350 itens.

**Resultado esperado**
- Mensagem **"As solicitações foram centralizadas. Foi aberta a SC: <n>, como centralizadora!"** e, para as
  originais, **"Solicitações finalizadas com sucesso!"**.
- Uma única SC centralizadora, com todos os itens das origens e uma cotação no ERP.
- Reenvio não cria segunda cotação nem SC duplicada; erro parcial desfaz a centralização (rollback) e restaura
  as originais.
- 350 itens processados sem erro.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro de duplicate key na SC8; "SC já centralizada" ao reenviar; falha com 100/350 itens; exceção engolida
  sem mensagem (`oReponse`).

**Severidade:** Alta *(pode duplicar cotação/SC ou deixar SCs originais órfãs — perda/duplicidade de dado)*

**Preparação de massa:** duas SCs `QA` do próprio comprador na Validação Inicial; uma delas com 350 itens via
*Upload Planilha de Rateio Preenchida*. Sem comprador real não há como preparar.

**Verificado em tela:** PARCIAL
**O que foi verificado:** botão **Centralizar Solicitações** renderizado ao lado de **Buscar** em *Validação
Inicial*, sobre grade com **24** SCs; no bundle `pc_main.js`: `centralizaSolicitacoes` → `agrupaProdutos` →
`iniciaSolicitacao` → `finalizaSolicitacoes` (dataset `ds_postFinalizaSolicCompra`), mensagens literais
acima, rótulo **Cód Filial Centralizadora**, título **Centralizando Solicitações**. Formulário da SC tem os
campos ocultos `nrSolCentralizadora`, `solCentralizadora`, `dataCentralizacao`, `tbprodcent_numSCOrigem`.
REST: gateway **294 Compra Centralizada?** confirmado na 113196 ("Decisão tomada conforme condição 2").
Nada centralizado.
**Divergências encontradas:** ticket **aberto** — resultado esperado descreve o desenho, não o entregue. A
centralização no front abre **uma SC única** (A2-e), não uma por filial. A migração para o endpoint v2/assíncrono
citada em 02/07 não é verificável pelo front sem executar.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4466  (fluig · Concluído · SDCASSI-394)

**Título:** Acionar "Ver Solicitação da Compra" a partir de uma cotação de SC centralizada e confirmar que o processo da solicitação abre.

**Origem:** FSWTBC-4466 — o botão **"Ver Solicitação de Compra"** não funcionava quando a SC estava no modelo **centralizado**. A SC centralizadora agrupa várias SCs de origem (`C1_SCORI`), então "ver a solicitação" deixa de ser referência única; código escrito para o fluxo simples falhava no cenário centralizado. Liberado em produção pelo **PR67586**.

**Módulo/Rota:** **Portal do Comprador** → **Controle De Cotações** (e detalhe da cotação) → botão **Ver Solicitação da Compra** (ícone `an an-eye`). A centralização é criada em **Portal do Comprador → Validação Inicial → Centralizar Solicitações**.

**Pré-condições**
- Uma **SC centralizadora** já criada, agrupando **duas ou mais** SCs de origem, com cotação gerada e visível ao comprador.
- **Bloqueio:** a criação de SC centralizada exigiria acionar **Centralizar Solicitações** sobre solicitações de terceiros na Validação Inicial — **proibido pelo escopo** (não alterar registro pré-existente). E as grades de cotação estão vazias para esta conta. O botão **não pôde ser acionado**.

**Passos**
1. Abrir **Portal do Comprador → Controle De Cotações** e localizar a cotação vinculada à **SC centralizadora**.
2. Acionar **Ver Solicitação da Compra**.
3. Conferir que uma nova aba abre com o processo da solicitação em **modo de visualização** (a URL termina em `app_ecm_workflowview_taskLoadViewMode=true`).
4. Conferir que o processo aberto é o da SC correta e que o formulário carrega os itens.
5. Repetir a ação a partir de uma cotação de **SC simples (não centralizada)**, para comparar.
6. Se a centralizadora agrupar várias origens e houver mais de um processo candidato, registrar como o sistema resolve a escolha.
7. Fechar a aba sem movimentar nada.

**Resultado esperado**
- O botão abre o processo da solicitação **também** quando a SC é centralizada — não fica inerte nem abre em branco.
- Quando o item de cotação já traz o número do processo Fluig (`C1_XFLUIG`), a solicitação é aberta diretamente por esse número.
- Quando o item **não** traz o número do processo — situação típica da SC centralizada, cujas origens carregam a referência —, o sistema resolve o processo consultando o dataset **`dsForm_RequisicaoCompraContratacao`** por **filial + número da cotação**, e abre o processo encontrado.
- A abertura só ocorre por URL **https**; nada é movimentado (modo somente leitura).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O botão **"Ver Solicitação de Compra"** não funcionava para SC **centralizada** — nada abria, sem mensagem de erro (quarta ocorrência do mesmo botão nesta base).

**Severidade:** Média

**Preparação de massa:** uma **SC centralizadora** agrupando ≥ 2 SCs de origem (`C1_SCORI` preenchido), com cotação gerada, visível ao comprador executor. Quem prepara: comprador da CASSI, usando **Centralizar Solicitações** na Validação Inicial — o QA **não pode** criar esta massa porque isso alteraria solicitações de terceiros.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o botão **"Centralizar Solicitações"** foi **visto renderizado** na tela **Validação Inicial**, ao lado de **Buscar**, sobre uma grade com 24 solicitações selecionáveis — o caminho da centralização existe e está ativo (nada foi selecionado nem centralizado). Por REST confirmou-se que a versão 98 de `wf_solicitacao_compras` tem a atividade **294 — "Compra Centralizada?"**, exatamente o `gatewayCompraCentralizada: 294` configurado no widget do Portal do Comprador (lido no fonte publicado) — o desenho da centralização está publicado e coerente. O comportamento do botão (incluindo o fallback por `dsForm_RequisicaoCompraContratacao`) foi **lido no fonte publicado** (`viewFluigPurschase`), não exercitado.
**Divergências encontradas:** o rótulo do ticket é **"Ver Solicitação de Compra"**; o `p-label` real é **"Ver Solicitação da Compra"** (com "da"). Além disso, o fonte publicado mostra que, quando mais de um processo é candidato, o widget usa um **modal de seleção de processo** — padrão hoje implementado para Parecer Técnico (*"Selecionar Parecer Técnico"*); não há modal equivalente nomeado para a Solicitação de Compra, o que merece atenção no cenário centralizado com múltiplas origens.
**Dados/massa usados:** nenhum — nada foi selecionado, centralizado ou aberto em modo de edição.

---

## CT-FSWTBC-4468  (ambos · Concluído · SDCASSI-395)

**Título:** Definir a proposta vencedora para apenas parte dos itens da cotação e concluir — com os itens escolhidos refletidos na SC e no ERP.

**Origem:** FSWTBC-4468 — o portal exigia **todos os itens** selecionados para aprovar a proposta vencedora (o
Protheus não exige); a crítica reaparecia ao reabrir; e a seleção parcial **não refletia no ERP** (26/05).
Aceite 27/05 com contrato 00001-2026-1701 gerado pela SC 94285, fornecedor vencendo metade dos itens (PR67985).

**Módulo/Rota:** Fluig → **Portal do Comprador → Definir Vencedor Cotação** (`#/propostaVencedora`, endpoint
`…/api/v2/fluig/compras/cotacao/gravaVencedor/{n}`) → SC: **Formulário**, seção *Empresa Vencedora* (grade
`tbForneceAlcadas`) → **Aprovação de Alçada** → **Aguarda Geração do Pedido/Contrato** → **Nº Pedido**/**Nº
Contrato** · **Acompanhamento de Contratos** (modal *Informações Complementares do Contrato*).

**Pré-condições**
- Cotação com ≥ 2 itens e ≥ 2 propostas; usuário **comprador**.
- **Bloqueio:** conta de QA não resolve comprador e o `genericQuery` (DHU) está em 404 — a grade vem vazia.
  Executável por comprador real com Protheus no ar.

**Passos**
1. Em **Definir Vencedor Cotação**, abrir a cotação; marcar o fornecedor A como vencedor **só do item 1**,
   deixando o item 2 sem vencedor.
2. Confirmar.
3. Reabrir a mesma cotação e marcar o fornecedor B para o item 2; confirmar.
4. Abrir a SC: seção *Empresa Vencedora* deve listar A (item 1) e B (item 2) com quantidades e valores.
5. Seguir a alçada; após *Aguarda Geração do Pedido/Contrato*, ler **Nº Pedido**/**Nº Contrato**.
6. Variante: marcar vencedor **sem quantidade** e confirmar.

**Resultado esperado**
- Passo 2: sucesso — **"A cotação foi atualizada com os vencedores!"**; nenhuma exigência de todos os itens.
- Passo 3: sem crítica residual; a segunda escolha soma-se à primeira.
- Passo 4–5: a SC e o pedido/contrato refletem exatamente a seleção parcial (itens, quantidades, fornecedor).
- Passo 6: **"Existem vencedores selecionados sem quantidade informada para processar."** e nada gravado.
- Sem nenhuma seleção: **"Selecione as propostas vencedoras antes de confirmar."**

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Mensagem de falha ao confirmar sem todos os itens; mensagem persistindo ao reabrir; seleção parcial não
  chegando ao Protheus (pedido/contrato com itens errados).

**Severidade:** Alta *(decisão de vencedor e alçada; risco de pedido/contrato com item errado)*

**Preparação de massa:** cotação `QA` com dois itens e duas propostas — exige comprador e credencial de
fornecedor (não há).

**Verificado em tela:** PARCIAL
**O que foi verificado:** rota **Definir Vencedor Cotação** abre (botões *Filtrar*, *Gerenciador de colunas*,
*Carregar mais resultados*), grade vazia por `getEvalQuotesDhuERP … 404` (ambiente) e `Comprador não
encontrado.` (conta). No bundle: mensagens literais acima, `gravaVencedor`, `definindoVencedor`,
`Nenhum vencedor encontrado para processar.`, `Erro ao enviar vencedores:`. Formulário da SC com a seção
*Empresa Vencedora \*** / *CNPJ/CPF \** / *Valor da Compras (R$) \** / *Valor do Frete (R$) \**.
**Divergências encontradas:** o bundle não contém nenhuma mensagem exigindo "todos os itens" — coerente com a
correção; a propagação parcial ao ERP não é verificável sem executar. O caminho de vencedores passa pelo
`replaceGenericSupplier` (A2) que remove `85070508-0001` antes do envio.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-4505  (fluig · Concluído · SDCASSI-399)

**Título:** Acessar o Portal do Comprador com um comprador que não tenha substituição cadastrada e confirmar que as cotações dele são listadas.

**Origem:** FSWTBC-4505 (incidente **SD809888**) — no Portal do Comprador, o comprador **sem substituição lançada** não conseguia visualizar as cotações: a exceção (existir substituto) tinha virado pré-requisito. Quinto defeito da base envolvendo a correlação entre usuário autenticado e comprador do documento. Liberado em produção pelo **PR67582**.

**Módulo/Rota:** **Portal do Comprador** (`/portal/p/1/portal-do-comprador`) → **Controle De Cotações**, **Avaliação de Propostas**, **Definir Vencedor Cotação**; e o seletor de perfil/usuário do menu do portal.

**Pré-condições**
- Um comprador com matrícula no ERP, com cotações atribuídas a ele, **sem nenhuma substituição cadastrada** no processo **Delegação de Tarefas**.
- Um segundo comprador, **com** substituição cadastrada, para comparação.
- **Bloqueio:** não há credencial de comprador disponível. A conta `TOTVS-FS` não resolve matrícula de comprador (`dsProtheus_getCompradores_restGetAll` é chamado com o `Y1_USER` do usuário e responde vazio, gerando `Error: Comprador não encontrado.`), e o `genericQuery` do Portal responde **404**. Duas causas de ambiente somadas, nenhuma delas defeito.

**Passos**
1. Autenticar com o comprador **sem substituição cadastrada**.
2. Abrir **Portal do Comprador** e aguardar a carga do painel **Acesso Rápido**.
3. Conferir o seletor de usuário do portal: qual nome vem selecionado por padrão.
4. Abrir **Controle De Cotações** e conferir se as cotações do comprador são listadas.
5. Repetir em **Avaliação de Propostas** e **Definir Vencedor Cotação**.
6. Conferir o contador (badge) do item **Validação Inicial** no menu.
7. Repetir todo o roteiro com o comprador **que tem** substituição cadastrada e comparar.

**Resultado esperado**
- O comprador **sem** substituição cadastrada vê suas cotações normalmente nas três telas — ter substituto é **opcional** e nunca pré-requisito de visualização.
- O seletor de usuário do portal vem preenchido com o **próprio usuário autenticado**, independentemente de a lista de substituídos estar vazia.
- Quando existem substituídos, eles aparecem como opções **adicionais** na lista, ordenadas por nome (pt-BR).
- O badge de **Validação Inicial** reflete o total do próprio usuário.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O comprador **sem substituição lançada** — o caso normal — abria o Portal do Comprador e **não via nenhuma cotação**; a lista vinha vazia, sem mensagem que explicasse o motivo.

**Severidade:** Média

**Preparação de massa:** dois compradores com matrícula ERP válida e cotações atribuídas — um **sem** e outro **com** substituição vigente cadastrada no processo Delegação de Tarefas. Quem prepara: administrador Fluig + área de Compras. O QA não tem credencial de comprador.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o Portal do Comprador carrega e renderiza o painel **Acesso Rápido** com os quatro atalhos; as três grades de cotação exibem **"Nenhum dado encontrado"** por causa do `404` em `genericQuery` e da matrícula de comprador não resolvida (ambos registrados no console nesta sessão). Por **REST somente leitura**, o endpoint que alimenta a lista de substituídos — `GET /ecm/api/rest/ecm/centralTasks/getValidReplacedUsers` — respondeu **200** e trouxe **o próprio usuário** (`TOTVS-FS` → *Usuário TBC (TOTVS)*) além de um substituído. No **fonte publicado** confirma-se o ponto que corrige o defeito: a lista de substituídos só é montada **se** houver substituídos (`if (Object.keys(...).length > 0)`), mas o `patchValue({ user: <usuário autenticado> })` é executado **fora** desse `if` — ou seja, o usuário autenticado é sempre o valor corrente, mesmo com a lista vazia.
**Divergências encontradas:** o ticket diz "não consegue visualizar as cotações"; a tela não emite mensagem alguma nesse caso — apenas exibe **"Nenhum dado encontrado"**, que é indistinguível de "não há cotações". Vale como recomendação de usabilidade.
**Dados/massa usados:** nenhum — apenas leitura.

---

## CT-FSWTBC-4521  (ambos · Concluído · SDCASSI-402)

**Título:** Comprador visualiza os anexos da cotação diretamente em *Avaliação de Propostas* → *Visualizar Anexos*

**Origem:** FSWTBC-4521 — os anexos da cotação não eram exibidos em Avaliação de Propostas / Visualizar Anexos; só apareciam
abrindo a cotação pelo botão ao lado. Causa: datasets `dsConsultaAnexos_Cotacao` e `dsConsultaAnexosNegociacao` ausentes no
ambiente (5ª ocorrência de artefato faltando). Liberado via PR67511.

**Módulo/Rota:** Portal do Comprador → *Acesso Rápido* → **Avaliação de Propostas**
(`/portal/p/1/portal-do-comprador#/avaliacaoPropostas`)

**Pré-condições**
- Usuário com matrícula de comprador resolvida no ERP (a conta de QA não tem — §5-C).
- Uma cotação em avaliação cujo fornecedor tenha anexado proposta (pasta GED `Anexos de Processo de Compras` →
  `Negociação de Cotação de Produtos e Serviços` → `Processo <n> FORN: <cnpj> LOJA: <loja> PROP: <nn>`).
- Integração `genericQuery` (`getEvalQuotesDhuERP`) respondendo — hoje responde 404.
- **Bloqueio:** conta de QA sem matrícula de comprador + `genericQuery` 404 (ambiente). A grade abre vazia.

**Passos**
1. Abrir o Portal do Comprador e clicar em **Avaliação de Propostas**.
2. Na grade (colunas *Status, Núm. Cotação, Filial, Número da SC, Nº. Proc. Fluig, Tip. Documento, Parecer Téc., Em Alçada,
   Dt. Validade, Valor Final*), localizar a cotação da pré-condição e abri-la.
3. Na proposta do fornecedor, clicar em **Visualizar Anexos** (ícone olho).
4. Observar o modal `Anexos` (po-modal) e seus slides (`<iframe>`).
5. Comparação de controle: clicar em **Visualizar Cotação/Negociação** e conferir que os mesmos arquivos aparecem ali.

**Resultado esperado**
- O modal *Anexos* lista os arquivos da proposta, obtidos de `dsConsultaAnexos_Cotacao` (cotação) ou
  `dsConsultaAnexosNegociacao` (negociação), com `CONST_ID_PROCESSO`, `CONST_FORNECEDOR` e `CONST_LOJA` informados.
- Cada arquivo abre no iframe (URL `/volume/stream/private/...`, mesma origem, com cookie de sessão).
- O conjunto exibido em *Visualizar Anexos* é o mesmo de *Visualizar Cotação/Negociação*.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Modal *Anexos* vazio (ou erro de dataset inexistente no console) enquanto os anexos aparecem só ao abrir a cotação pelo
  botão ao lado.

**Severidade:** Média

**Preparação de massa:** cotação com proposta anexada por fornecedor (exige credencial de fornecedor — não disponível) e
login de comprador com matrícula no ERP. Não criar para forçar.

**Verificado em tela:** PARCIAL
**O que foi verificado:** (a) rota `#/avaliacaoPropostas` abre com a grade e as 10 colunas acima, mas "Nenhum dado
encontrado" — console: `Comprador não encontrado` e `getEvalQuotesDhuERP … 404` (ambiente); (b) **lido no fonte publicado**:
o bundle traz os botões `Visualizar Anexos` (an-eye), `Visualizar Cotação/Negociação`, `Salvar Valores Atualizados` e
`Verificar Parecer Técnico`, e `viewFluigAttachment()` consulta exatamente `dsConsultaAnexosNegociacao` (com
`CONST_PROPOSTA` opcional) ou `dsConsultaAnexos_Cotacao`; (c) **os dois datasets existem hoje**: POST
`/api/public/ecm/dataset/datasets` responde 200 — `dsConsultaAnexos_Cotacao` devolve
`STATUS_RETORNO:"ALERTA" / STATUS_MSG:"CONST_ID_PROCESSO ou CONST_FORNECEDOR não informado"` quando só o processo é
informado (comportamento coerente), `dsConsultaAnexosNegociacao` devolve `values:[]`.
**Divergências encontradas:** nenhuma de rótulo. Registro relacionado: ACHADOS A2-b (formulário de Cotação esconde
`div#tableAnexoPropostas` para todo fornecedor ≠ `85070508-0001`) — outra superfície, não reinvestigada aqui.
**Dados/massa usados:** processo 112860 como constraint de leitura; nada submetido.

---

## CT-FSWTBC-4526  (ambos · Concluído · SDCASSI-403)

**Título:** Comprador devolve a cotação para a alçada (regerar documento) e a fila ZZY registra sucesso sem desfazer a liberação do Fluig

**Origem:** FSWTBC-4526 — erro ao retornar cotação no cenário "Retorno para Alçada (Regerar Documento)", SC 92871. A fila
ZZY (rotina `gravaVencedor`) devolvia `statuscode 400 / "Cotacao nao passou pelos processos de validacao do Fluig"` porque o
reset da SC8 apagava `C8_XLIBERA`. Correção no UCOME036/UCOME021 preserva `C8_XLIBERA='S'`. Ficou registrado o problema de
**encoding** ("CotaÃ§Ã£o nÃ£o passou") na gravação da mensagem no cardindex.

**Módulo/Rota:** Portal do Comprador → **Definir Vencedor Cotação** (`#/propostaVencedora`); Logs Protheus →
aba **Solicitacoes ZZY** (`/portal/p/1/portal_logs_protheus`); formulário da Cotação, campo **Erro retornado pelo ERP Protheus**

**Pré-condições**
- Cotação já validada pelo Fluig, com vencedor definido e documento de alçada gerado (`docAlcadaGerada`).
- Comprador com matrícula no ERP.
- `genericQuery` das abas ZZY respondendo (hoje 404).
- **Bloqueio:** conta de QA sem matrícula de comprador; ZZY indisponível (ambiente); não há como "retornar para alçada"
  sem alterar registro pré-existente — o caso é de regressão para o executor com perfil de comprador.

**Passos**
1. Em *Definir Vencedor Cotação*, localizar a cotação e acionar a ação de retorno para alçada com regeração do documento
   (rótulo exato do botão: `<não documentado>` — a string "Regerar" não existe no bundle publicado).
2. Abrir *Logs Protheus* → **Solicitacoes ZZY**, filtrar por *Rotina* = `gravaVencedor` e *Status* = `E`/`S`, período do dia.
3. Localizar a chave do registro (`zzy_chave` no formato `<cotação>_<aaaammdd>_<hhmmss>`), ler o JSON de retorno.
4. Abrir a solicitação da Cotação no Fluig (Central de Tarefas → *Formulário*) e ler **Erro retornado pelo ERP Protheus**.
5. Abrir *Histórico* da Cotação e da SC.

**Resultado esperado**
- O registro ZZY termina com *Status* `S` (sucesso) e `Qtd T.Env Fl` sem retentativas anômalas.
- *Erro retornado pelo ERP Protheus* permanece vazio; a SC avança sem passar por *Correção*.
- Qualquer mensagem gravada no Fluig aparece com acentuação correta ("Cotação não passou…", nunca "CotaÃ§Ã£o").

**Resultado se o defeito reincidir**
- ZZY com `status E`, `statuscode 400` e `msgerro "Cotacao nao passou pelos processos de validacao do Fluig"`; a cotação
  cai em *Correção* e o campo de erro exibe o texto (possivelmente com acentuação corrompida).

**Severidade:** Alta (alçada/aprovação)

**Preparação de massa:** SC com cotação concluída, vencedor definido e alçada gerada, por um comprador real — não
reproduzível pela conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** rota `#/propostaVencedora` abre a grade (mesmas 10 colunas de Avaliação) vazia por 404/ambiente;
widget *Logs Protheus* renderiza as abas **Erros CV8 / Solicitacoes ZZY / Medicoes ZZZ**, filtros *Filial, Chave, Rotina,
Status (Todos/P/E/S), Data inicial/final, Registros por pagina* e botão **Consultar**, mas fica em "Consultando logs..."
(`genericQuery` 404 — ACHADOS A11-b); na Cotação 112312 (Correção) o rótulo **Erro retornado pelo ERP Protheus \*** existe
(campo `msgerro`, readonly) — visto renderizado, valor vazio.
**Divergências encontradas:** o nome do cenário do ticket ("Retorno para Alçada (Regerar Documento)") não aparece no
bundle publicado — o rótulo real da ação fica `<não documentado>`.
**Dados/massa usados:** Cotação 112312 (leitura); nada submetido.

---

## CT-FSWTBC-4538  (ambos · Concluído · SDCASSI-406)

**Título:** Comprador cancela uma SC pelo Portal do Comprador e o processo some da Central de Tarefas e do Protheus

**Origem:** FSWTBC-4538 — o Portal avisava "cancelado", mas a SC 94106 continuava viva e acionável na Central de Tarefas,
sem mensagem de erro. Causas: dataset `dsFluig_postProcessesCancel` ausente no ambiente (7ª ocorrência) **e** processos
legados presos a versão antiga do fluxo (precisaram de **conversão**); depois disso, SC 94260 ainda não excluía do
Protheus. Homologado em 11/06/2026.

**Módulo/Rota:** Portal do Comprador → *Validação Inicial* / *Controle De Cotações* (ação de cancelamento da SC);
Central de Tarefas; *Histórico* da solicitação

**Pré-condições**
- SC **própria** (prefixo `QA`), integrada ao ERP (`numSolCompra` preenchido), em etapa que admita cancelamento pelo comprador.
- Login com matrícula de comprador.
- **Bloqueio:** conta de QA não é comprador; **não cancelar registro pré-existente** — usar apenas SC criada pelo executor.

**Passos**
1. No Portal do Comprador, localizar a SC própria e acionar o cancelamento; informar justificativa (`QA …`); confirmar.
2. Ler as notificações exibidas, na ordem.
3. Abrir *Central de Tarefas* → *Minhas solicitações* e procurar a SC.
4. Abrir a solicitação (`pageworkflowview?...ProcessInstanceID=<n>`) → *Histórico*.
5. Se a SC for legada, verificar antes no *Histórico* se há linha "Converteu o processo wf_solicitacao_compras da versão X para a versão Y".

**Resultado esperado**
- Notificações: "O cancelamento da solicitação de compras <N> no ERP Protheus foi executado com sucesso!" **e** "O
  cancelamento do processo <P> da solicitação de compras <N> no Fluig foi executado com sucesso!".
- Histórico mostra "Processo cancelado por: …" e atividade atual **Solicitação cancelada**; a SC deixa de aparecer em
  *Tarefas a concluir*.
- Em caso de falha no ERP, a mensagem é de erro ("Não foi possível executar o cancelamento da solicitação de compras
  <N>!") e **o processo Fluig não é cancelado**.

**Resultado se o defeito reincidir**
- Mensagem de sucesso, porém a SC continua em *Tarefas a concluir* e/ou continua ativa no Protheus; nenhum erro exibido.

**Severidade:** Alta (ação que informa sucesso sem efeito)

**Preparação de massa:** SC própria, criada pelo executor, integrada ao ERP. Se o ambiente tiver instâncias legadas,
listar quantas ainda estão em versão antiga (Histórico) — nada nesta base documenta a conversão em massa.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **lido no fonte publicado** (bundle do Portal do Comprador): `handlePurchasesDelet` → toast de
sucesso no ERP → `handlePurchasesProcessDelet` chama `dsFluig_postProcessesCancel` com `processId`,
`taskUserId="consumerKeyCompras"` e `comment="Processo cancelado por \"<usuário>\" - Justificativa: \"…\""`, e só emite
erro se `u[0].error` vier preenchido — as três mensagens acima são as strings reais. **Visto renderizado**: o Histórico da
SC 112830 registra "Converteu o processo wf_solicitacao_compras da versão 97 para a versão 98" com a tabela
*Atividades Origem : Atividades Destino* — a conversão de legado citada no ticket é visível ao usuário; a SC 113237 mostra
"Processo cancelado por: … - QA limpeza automatizada pos-execucao" e atividade atual **Solicitação cancelada**.
**Divergências encontradas:** nenhuma de rótulo. Referência: ACHADOS A2-c (404 do dataset tratado como `[]` truthy →
ramo de sucesso) explica o sintoma "sucesso sem efeito" — não reinvestigado.
**Dados/massa usados:** SCs 112830 e 113237 (leitura); nenhum cancelamento executado.

---

## CT-FSWTBC-4557  (ambos · Concluído/Não será feito · SDCASSI-411)

**Título:** Quantidade do item mantém-se coerente ao voltar da renegociação (proposta 003) para a negociação

**Origem:** FSWTBC-4557 — cotação 000021 / filial 3105 / SC 91220: ao retornar da renegociação, `C8_QTDISP` do item 001
foi gravado invertido (só na proposta 003), gerando `DHV_SALDO` inconsistente. Atribuído ao **produto padrão TOTVS**;
encerrado sem correção conhecida — **pode falhar hoje**.

**Módulo/Rota:** Processo **Negociação de Cotação de Produtos/Serviços** → *Validação da Proposta* (atividade 20) /
*Recepção de Propostas* → grade de propostas, coluna **Qtde.**; Tracker → *Negociação de Cotação de Produtos/Serviços*

**Pré-condições**
- Cotação com três rodadas: proposta 001 (Cotação), 002 (Negociação) e 003 (Renegociação) para o mesmo item.
- **Bloqueio:** `C8_QTDISP`/`DHV_SALDO` só são visíveis no Protheus (sem credencial); não há instância de renegociação
  identificada nesta base (39 em *Validação da Proposta*, 11 em *Recepção de Propostas* — número da proposta não exposto na lista).

**Passos**
1. Abrir a negociação no Fluig → *Formulário*; ler **Qtde.** do item 001 na proposta 003.
2. Comparar com **Quantidade** do item 001 na SC de origem (*Formulário* da SC) e com a Qtde. das propostas 001 e 002.
3. No Tracker, visão *Negociação…*, filtrar pelo nº da cotação e comparar as quantidades exibidas.
4. (Protheus, bloqueado) conferir `C8_QTDISP` e `DHV_SALDO` da proposta 003.

**Resultado esperado**
- **Qtde.** do item 001 é a mesma nas três propostas e igual à quantidade da SC.
- Saldo disponível no ERP igual à quantidade cotada.

**Resultado se o defeito reincidir**
- Proposta 003 com quantidade invertida/divergente; saldo inconsistente no ERP.

**Severidade:** Alta (financeiro)

**Preparação de massa:** cotação com renegociação real, conduzida por comprador e fornecedor — não criável pela conta de QA.

**Verificado em tela:** PARCIAL
**O que foi verificado:** rótulo **Qtde.** (`txt_qtd`, readonly, `data-money-price`) e **Proposta \*** confirmados no
formulário da Cotação 112312; formulário de Negociação (256835) publicado com o mesmo campo `txt_qtd`; lista de
instâncias da negociação obtida por API (`Fim 50 / Validação da Proposta 39 / Recepção de Propostas 11`).
**Divergências encontradas:** nenhuma de rótulo. Superfície Fluig cobre só o valor exibido; a inversão de `C8_QTDISP` não
tem superfície no Fluig — dito explicitamente.
**Dados/massa usados:** Cotação 112312 (leitura); nada submetido.

---

## CT-FSWTBC-4566  (ambos · Concluído · SDCASSI-413)

**Título:** Escolha do fornecedor vencedor no Fluig chega ao Protheus com saldo e a SC avança para *Aguarda Geração do Pedido/Contrato*

**Origem:** FSWTBC-4566 — cotação 000064 / filial 2301: ao definir o vencedor no Fluig, o saldo do vencedor ficava zerado
no Protheus; em 26/05, SC 94254 foi para *Aguarda Geração do Pedido/Contrato* sem refletir a escolha no ERP. Liberado via
PR67986 sem causa documentada.

**Módulo/Rota:** Portal do Comprador → **Definir Vencedor Cotação** (`#/propostaVencedora`); SC → *Histórico* e campo
**Retorno Integração**; Logs Protheus → **Solicitacoes ZZY** (rotina `gravaVencedor`)

**Pré-condições**
- Cotação avaliada, com propostas válidas e comprador com matrícula no ERP.
- **Bloqueio:** conta de QA não é comprador; ZZY 404; definir vencedor altera registro pré-existente — só em cotação de QA.

**Passos**
1. Em *Definir Vencedor Cotação*, selecionar a cotação de QA e marcar o fornecedor vencedor; confirmar.
2. Abrir a SC vinculada → *Histórico*: confirmar a atividade atual.
3. Na aba *Formulário* da SC, ler **Retorno Integração**.
4. Em ZZY, localizar o registro `gravaVencedor` da cotação e ler *Status* e JSON de retorno.

**Resultado esperado**
- SC em **Aguarda Geração do Pedido/Contrato** **e** ZZY `gravaVencedor` com Status `S` (escolha refletida no ERP).
- **Retorno Integração** vazio; nenhuma passagem por *Correção*.

**Resultado se o defeito reincidir**
- SC avança para *Aguarda Geração do Pedido/Contrato* mas o ZZY mostra erro/saldo zerado, ou nada é gravado no ERP.

**Severidade:** Alta (alçada/compra)

**Preparação de massa:** cotação de QA completa até a avaliação, conduzida por comprador real.

**Verificado em tela:** PARCIAL
**O que foi verificado:** rota `#/propostaVencedora` abre a grade vazia (404/ambiente); atividade **Aguarda Geração do
Pedido/Contrato** existe no mapa de atividades da SC (confirmado no mapa extraído de instâncias); campo **Retorno
Integração** localizado na SC (input `anLockBudgRetIntErr`, vazio na 112830); widget ZZY renderiza os filtros.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** SC 112830 (leitura); nada submetido.

---

## CT-FSWTBC-4607  (fluig · Concluído · SDCASSI-420)

**Título:** Devolver uma proposta para ajuste e confirmar que a tarefa "Ajustes na Proposta" chega ao responsável correto, e não a um usuário qualquer.

**Origem:** FSWTBC-4607 (incidente **SD812406**) — a atividade **"Ajustes na Proposta (62)"** do processo de negociação estava **sem mecanismo de atribuição** definido, e o Fluig caía no comportamento padrão: entregar a tarefa ao **primeiro usuário em ordem crescente**. Liberado em produção pelo **PR67853**. O ticket registra também a necessidade de validar o **Portal do Fornecedor**, já que a atividade 62 é do fluxo de negociação com o fornecedor.

**Módulo/Rota:** **Negociação de Cotação de Produtos e Serviços** (`wf_negociacao_cotacao_prod_serv`) → atividade **Ajustes na Proposta (62)**; verificação na **Central de tarefas** (`/portal/p/1/pagecentraltask`) e na aba **Histórico** do processo.

**Pré-condições**
- Uma negociação em andamento cuja proposta precise de ajuste, de modo a rotear para a atividade 62.
- Conhecer o **responsável esperado** pela atividade (a regra de atribuição correta) — esta definição **não está documentada** no ticket.
- **Bloqueio:** (a) não há credencial de **fornecedor** nem de **comprador**; (b) devolver uma proposta é **movimentação de processo real**, proibida pelo escopo; (c) **o mecanismo de atribuição de uma atividade não tem superfície de front-end** — só é visível no Fluig Studio / diagrama do processo, com perfil de administrador, que o QA não possui.

**Passos**
1. Como comprador, abrir a negociação e acionar a devolução da proposta para ajuste (ação que roteia para **Ajustes na Proposta**).
2. Anotar data, hora e o processo movimentado.
3. Abrir a aba **Histórico** do processo e ler, no movimento recém-criado, a atividade de destino e o **responsável atribuído**.
4. Autenticar como o **responsável esperado** e conferir que a tarefa **aparece** na Central de tarefas (aba *Tarefas a concluir*), com o card do processo e o nome da atividade.
5. Autenticar como um usuário **sem relação** com a proposta (por exemplo, o primeiro da lista em ordem alfabética) e conferir que a tarefa **não** está na Central dele.
6. Verificar no **Portal do Fornecedor** que a proposta aparece como pendente de ajuste para o fornecedor correto.

**Resultado esperado**
- A tarefa **Ajustes na Proposta** é atribuída ao responsável definido pela regra do processo — e o **Histórico** registra esse responsável explicitamente.
- A tarefa **não** cai para um usuário arbitrário (o primeiro em ordem crescente), nem fica sem responsável.
- O card da tarefa, na Central de tarefas do responsável, exibe o **nome da atividade** e o campo **Responsável** com o nome correto (é assim que a Central exibe hoje: card com número do processo, nome do processo, nome da atividade e *Responsável*).
- No **Portal do Fornecedor**, a proposta correspondente fica disponível para ajuste ao fornecedor da negociação.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A atividade **"Ajustes na Proposta (62)"** ficava **sem atribuição** e o Fluig direcionava a tarefa para o **primeiro usuário em ordem crescente** — alguém sem relação com a proposta —, com atraso no fluxo e risco de ação indevida.

**Severidade:** Alta

**Preparação de massa:** uma negociação ativa com proposta recebida, passível de devolução para ajuste, e as credenciais de **comprador**, do **responsável esperado** e de **fornecedor** (Portal do Fornecedor). Além disso, é preciso que alguém **documente qual é a regra de atribuição correta** da atividade 62 — sem isso o caso não tem oráculo. Quem prepara: área de Compras + administrador Fluig.

**Verificado em tela:** PARCIAL
**O que foi verificado:** o processo **`wf_negociacao_cotacao_prod_serv` — "Negociação de Cotação de Produtos e Serviços"** (categoria *Compras*) consta entre os **34 processos publicados** e seu formulário abre, com a seção **Validação de Proposta**. Foi montado, por REST, o mapa *sequência → nome de atividade* a partir de **12.000 movimentos** desse processo: **a sequência 62 não aparece** nesses movimentos (as versões percorridas são a 24 e a 25) — ou a atividade não foi percorrida no período, ou pertence a versão anterior. No **fonte publicado** do Portal do Comprador, a sequência **62** é de fato referenciada: entra no conjunto de estados de negociação que o portal classifica junto com 10/34/51/53/56/58 ao derivar o status da cotação. A **Central de tarefas** foi vista renderizada (aba *Tarefas a concluir 10*, card do processo 112113 exibindo a atividade **Correção** e o campo **Responsável**), confirmando a superfície onde o responsável se verifica.
**Divergências encontradas:** o nome **"Ajustes na Proposta"** **não foi confirmado** em nenhuma fonte acessível — nem no histórico de movimentos (12.000 lidos), nem no fonte publicado do widget. O nome vem apenas do ticket. As atividades de fato observadas na negociação são: 4 Início, 6 Notifica Fornecedor, 8 Recepção de Propostas, 10 Integração com ERP, 20 Validação da Proposta, 22 Aprovado, 24 Fim, 31 Intermediário Integração com ERP, 34 Aguarda Movimentação Protheus, 36 Erro?, 51 Correção, 67 Continuar Cotação, 73 Enviado Portal?. **Antes de usar o nome "Ajustes na Proposta (62)" num caso oficial, confirme-o no diagrama do processo.**
**Dados/massa usados:** nenhum — nenhuma proposta foi devolvida, nenhuma tarefa movimentada.

---

## CT-FSWTBC-4631  (ambos · Em Homologação · SDCASSI-429)

**Título:** Abrir Parecer Técnico para uma SC centralizadora e ver um parecer gerado para cada demandante/SC de origem

**Origem:** FSWTBC-4631 — a Compra Centralizada 97821 não gerou parecer para os demandantes: o Parecer Técnico não contemplava SC
**centralizadora** (várias SCs de origem agrupadas). Adaptação em curso: `mc_respParecerTecnico.js` (tipoParecer `Solicitante_<processo>`),
versionamento do parecer na atividade 242 (`numRevProcesso`), `DataHandler.js` do form 256832 detectando `numReqCompra` com várias SCs
separadas por `;` e filtrando por `C1_XFLUIG`/`numProcessoPai`, dataset `dsFluig_getProcessoParecerTecSql` com `#_IN`, novo dataset
`dsProtheus_getCotacaoxSolicitacao_restGetAll`. **Ainda em homologação** (subtarefa FSWTBC-4963), bloqueado pelo SDCASSI-393.

**Módulo/Rota:** Portal do Comprador → *Validação Inicial* → **Centralizar Solicitações** · SC centralizadora (`wf_solicitacao_compras`,
atividades 301/303 *Intermediário Compra Centralizada*, 242 *Áreas para Emissão de Parecer Técnico*, 243 *Emitir Parecer Técnico*) ·
processo **Parecer Técnico** (`wf_solicitacao_compras_parecer`: 5 *Emitir Parecer Técnico* → 7 *Validação do Parecer Técnico* → 9 *Fim*) ·
Tracker visão **Parecer Técnico** (colunas *Nº Solicitação de Compras, Nº Parecer, Tipo Parecer, Descrição, Status da Aprovação*).

**Pré-condições**
- Comprador com matrícula resolvida no ERP (a conta de QA não tem — §5-C).
- Duas ou mais SCs `QA` de filiais/demandantes distintos, na *Validação Inicial*, centralizadas em uma SC única pelo botão
  **Centralizar Solicitações**; a centralizadora com parecer técnico exigido (áreas definidas em 242).
- **Bloqueio:** conta sem matrícula de comprador; correção **não entregue** (em homologação) — o caso pode reprovar hoje.

**Passos**
1. No Portal do Comprador → *Validação Inicial*, marcar as SCs de origem e clicar **Centralizar Solicitações**.
2. Abrir a SC centralizadora e conferir o campo `numReqCompra` (várias SCs separadas por `;`) e `numProcessoPai`.
3. Deixar o fluxo chegar a *Áreas para Emissão de Parecer Técnico (242)* e definir as áreas; seguir para *Emitir Parecer Técnico (243)*.
4. No Tracker, visão **Parecer Técnico**, filtrar pelo número da centralizadora e depois por cada SC de origem.
5. Abrir cada parecer gerado e conferir *Tipo Parecer*, *Descrição* e anexos; conferir `GET …/dataset/search?datasetId=dsFluig_getProcessoParecerTecSql&filterFields=numProcessoPai,<centralizadora>`.

**Resultado esperado**
- É gerado **um processo de Parecer Técnico por demandante/SC de origem** (tipoParecer `Solicitante_<processo>`), cada um roteado à
  matrícula responsável (`matriculaRespParecer`), com formulário completo e anexos.
- O Tracker *Parecer Técnico* lista os pareceres com `Nº Solicitação de Compras` de cada origem; `dsFluig_getProcessoParecerTecSql`
  filtrado por `numProcessoPai` devolve os mesmos registros.
- A centralizadora só avança em *Aguarda Finalizar Parecer (245)* depois que todos os pareceres terminam.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Nenhum parecer gerado para os demandantes (print de 28/05); depois, parecer gerado "sem formulário completo e sem anexos" (11/06);
  SCs 95279/95284 sem cotação (25/06).

**Severidade:** Alta

**Preparação de massa:** ≥2 SCs `QA` de demandantes diferentes centralizadas por um comprador real; áreas de parecer definidas. Sem
comprador, o caso morre no passo 1.

**Verificado em tela:** PARCIAL
**O que foi verificado:** botão **Centralizar Solicitações** visto renderizado no Portal do Comprador → *Validação Inicial* (25 SCs
listadas hoje); Tracker visão *Parecer Técnico* para 97821 → **"Nenhum registro encontrado"** (04/09); `dsFluig_getProcessoParecerTecSql`
filtrado por `numProcessoPai=97821` → **200, 0 registros** (existe, mas não há parecer ligado à centralizadora — o sintoma do ticket
continua visível no dado); `dsFluig_getProcessosProjetoComprasSql` com `nrSolCentralizadora=97821` → 4 SCs filhas (97215/97217/97219/97221,
`DES_ESTADO=Fim - Compra Centralizada`); **`dsProtheus_getCotacaoxSolicitacao_restGetAll` existe hoje** (200, com colunas `C8_*`) — parte da
entrega já publicada; Histórico da 97821: 16 entradas, conversão 75→77 em 14/07 e fim em 24/07/2026 em *Fim - Processo de Faturamento de
Contratos*; no fonte publicado do form 256832 (`f_par_256832_App_DataHandler.js`) o tratamento `WKNumProcessParent`/`numProcessoPai`
(marcado `[DEM10015025]`) está presente; a instância **95284 responde 404** (não existe neste tenant).
**Divergências encontradas:** nomes de atividade citados na análise ("atividade 242") confirmados pela conversão registrada no Histórico
(242 *Áreas para Emissão de Parecer Técnico*), mas 242/243/245 **não aparecem** nos 1.000 movimentos mais recentes de v98 — o caminho
de parecer é raro na base atual. Tipo de parecer `Solicitante_<processo>` só existe na descrição técnica; nenhum parecer com esse tipo
foi encontrado. Reprova hoje por **causa nunca corrigida** (em homologação).
**Dados/massa usados:** nenhum — não submetido; leitura de 97821 e datasets `get*`.

---

## CT-FSWTBC-4633  (ambos · Concluído · SDCASSI-432)

**Título:** Movimentar uma cotação que ficou marcada como "Em Integração" — o status volta a permitir ação quando a integração termina ou falha

**Origem:** FSWTBC-4633 — SC 96966: a cotação apresentava erro por estar "em integração" e não podia ser movimentada. Fechado como
"Feito" sem comentário técnico; em 03/06 o cliente pediu reabertura ("ainda ocorre o erro — ticket SDCASSI-439").

**Módulo/Rota:** Portal do Comprador → *Controle de Cotações* / *Avaliação de Propostas* → coluna **Status** com o valor **"Em Integração"**
(código `integracao`; no fonte é derivado de `NUM_SEQ_ESTADO` da SC ∈ {46, 53, 75, 78} ou da Negociação em *Integração com ERP (10)* /
*Aguarda Movimentação Protheus*). Com `status.code === "integracao"` os botões **Bloquear**/**Parecer** são ocultados.

**Pré-condições**
- Comprador com matrícula resolvida no ERP (a conta de QA não tem).
- Uma cotação `QA` que acabou de ser enviada ao ERP (SC na atividade *Integração com ERP* / *Aguarda Movimentação Protheus*).
- `genericQuery` (`getQuotesDhuERP`) respondendo — hoje 404.
- **Bloqueio:** conta sem matrícula de comprador; `genericQuery` 404 (ambiente).

**Passos**
1. Abrir *Controle de Cotações* e filtrar pela cotação da pré-condição; anotar o **Status**.
2. Enquanto o Status for **Em Integração**, tentar as ações da linha (Analisar Cotação / Ver Itens / Cancelar Solicitação).
3. Abrir o Histórico da SC/negociação correspondente e aguardar a linha "Integração executada com sucesso - Tempo de Execução N s" (ou a
   falha com "Nova tentativa em …" e, após 3 tentativas, *Correção*).
4. Recarregar o Portal do Comprador e reler o Status.
5. Se a integração falhou, verificar o campo **Erro retornado pelo ERP Protheus** na cotação/negociação e a atividade *Correção*.

**Resultado esperado**
- "Em Integração" é **transitório**: dura o tempo da service task (SLA típico de segundos a minutos) e some quando o Histórico registra
  sucesso ou quando o processo cai em *Correção* após as 3 tentativas automáticas.
- Em sucesso, o Status muda (Em Cotação / Validação da Proposta / Negociação) e as ações voltam.
- Em falha, o usuário tem caminho: *Correção* com o erro legível no Histórico e no campo **Erro retornado pelo ERP Protheus**.
- Nunca: cotação presa em "Em Integração" sem linha nova no Histórico por mais de uma hora.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Cotação da SC 96966 travada "em integração", nenhuma ação possível, sem erro no formulário.

**Severidade:** Média

**Preparação de massa:** cotação `QA` recém-integrada, por comprador real.

**Verificado em tela:** PARCIAL
**O que foi verificado:** rótulo **"Em Integração"** (código `integracao`, cor `rgb(204,0,10)`, ícone `an-clock-user`) e a regra de
derivação por `NUM_SEQ_ESTADO` **lidos no fonte publicado** `pc_main.js`; ocultação de *Bloquear*/*Parecer* sob `status.code!=="integracao"`
idem; a **96966** hoje: `FINALIZED`, v72, 41 tarefas, fim 10/06/2026 em *Fim - Processo de Pagamento de Compras* (a cotação foi
destravada); Histórico da cotação **112312** (viva, em *Correção 72*) mostra o comportamento em falha: 3 tentativas com "Nova tentativa em
…" e "Falha na Integração com ERP. Não foi possível recuperar as informações do Fornecedor". Portal do Comprador não renderiza cotações
para esta conta.
**Divergências encontradas:** "em integração" no ticket é o **status calculado no Portal do Comprador**, não uma atividade do workflow —
o nome não existe no mapa de atividades. O ticket foi fechado com o erro persistindo (reaberto como SDCASSI-439).
**Dados/massa usados:** nenhum — não submetido; leitura de 96966 e 112312.

---

## CT-FSWTBC-4635  (ambos · Concluído · SDCASSI-430)

**Título:** Ajustar o valor de uma proposta com casas decimais em *Validação da Proposta* e ver o valor aceito e integrado sem erro

**Origem:** FSWTBC-4635 — erro ao ajustar o valor da proposta no Fluig quando o valor tinha **casas decimais** (SC 98117). Família de
precisão numérica na fronteira Fluig/Protheus (CNF/CNE/CNB, C1_QUANT×C1_QUJE, R$ no rateio). Corrigido em um dia, sem descrição.

**Módulo/Rota:** Fluig → **Negociação de Cotação de Produtos e Serviços** (`wf_negociacao_cotacao_prod_serv`), atividade **Validação da
Proposta (20)** → grade de itens (**Valor Unit.**, **Desconto**, **Valor Total**) e totais (**Valor total do Pedido \***, **Valor total de
Descontos \***, **Valor total do Frete \***, **Valor total do IPI \***), campo **Proposta Validada? \*** · campo **Erro retornado pelo ERP
Protheus** · Histórico (*Integração com ERP (10)* → *Aguarda Movimentação Protheus (34)* → *Erro? (36)*).

**Pré-condições**
- Comprador com matrícula resolvida no ERP e negociação `QA` em *Validação da Proposta* com proposta recebida.
- **Bloqueio:** conta de QA sem matrícula de comprador ("Comprador não encontrado"); `genericQuery` 404 hoje.

**Passos**
1. Abrir a tarefa *Validação da Proposta* da negociação.
2. Ajustar **Valor Unit.** de um item para um valor com decimais (ex.: `12,345` e `1.234,56`) e sair do campo.
3. Conferir **Valor Total** do item e **Valor total do Pedido \***.
4. Marcar **Proposta Validada? = Sim** e movimentar.
5. Ler o Histórico até "Integração executada com sucesso - Tempo de Execução N s" e conferir **Erro retornado pelo ERP Protheus** vazio.

**Resultado esperado**
- O campo aceita separador decimal `,` e milhar `.` (pt-BR); o total recalcula corretamente (`12,345 × qtd`).
- A integração conclui sem erro; **Erro retornado pelo ERP Protheus** permanece vazio; o processo segue para *Aprovado (22)*.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro ao salvar/movimentar a proposta com valor decimal (mensagem não transcrita no ticket); negociação em *Correção (51)* com erro de
  conversão numérica.

**Severidade:** Alta

**Preparação de massa:** negociação `QA` com proposta de fornecedor (exige credencial de fornecedor) e comprador real.

**Verificado em tela:** PARCIAL
**O que foi verificado:** rótulos **Valor Unit.**, **Desconto**, **Valor Total**, **Proposta Validada? \***, **Validade da Proposta \***,
**Valor total do Pedido \*** etc. lidos no HTML publicado do form 256835; atividade **20 Validação da Proposta** confirmada em 107 movimentos
(v24/25); a **98117** (SC do ticket) hoje `FINALIZED`, 40 tarefas, fim 28/05/2026 em *Fim - Processo de Pagamento de Compras*. Nenhuma
negociação em *Validação da Proposta* é acessível a esta conta.
**Divergências encontradas:** nenhuma de rótulo. O fonte do form 256835 baixado (`ViewHandler`/`UtilsHandler`) **não contém** máscara
monetária nos campos de valor da proposta (busca por `mask|money|toFixed` sem resultado) — a normalização decimal ocorre em outro
ponto (Portal do Comprador ou servidor); ver achado **A3-c** (`replaceToMoney` só normaliza com vírgula).
**Dados/massa usados:** nenhum — não submetido; leitura de 98117.

---

## CT-FSWTBC-4668  (ambos · Concluído · SDCASSI-438)

**Título:** Como gestor do processo, cancelar uma SC em qualquer etapa — inclusive numa SC de versão antiga do processo

**Origem:** FSWTBC-4668 — erro ao cancelar SC mesmo sendo gestor (SC 99938). Regra alinhada: **o gestor do processo pode cancelar em
qualquer etapa**. Barreiras encontradas: (1) bloqueio indevido; (2) **versão do processo** — processo antigo sem a tratativa, exige
conversão; (3) em *Negociação* (79163/79168) a exclusão só pelo Portal do Comprador; (4) dado — 78317 com nº de SC sem SC no Protheus TST.

**Módulo/Rota:** Fluig → solicitação (`pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=<n>`) → botão **Cancelar
Solicitação** · Histórico ("Converteu o processo wf_solicitacao_compras da versão X para a versão Y", "Processo cancelado por: …") ·
Portal do Comprador → *Controle de Cotações* → **Cancelar Solicitação**.

**Pré-condições**
- Usuário **gestor do processo** `wf_solicitacao_compras`.
- Três SCs `QA` do executor: uma na versão atual (v98) em *Validação do Gestor*; uma **convertida de versão antiga** (Histórico com
  "Converteu o processo …"); uma em *Processo de Negociação (50)*.
- **Bloqueio:** a conta de QA não é gestora do processo; não cancelar registro pré-existente.

**Passos**
1. Abrir a SC v98 e clicar **Cancelar Solicitação**; justificar com `QA …`; confirmar.
2. Abrir a SC convertida e repetir.
3. Abrir a SC em negociação e repetir; se recusada, cancelar pelo Portal do Comprador → **Cancelar Solicitação**.
4. Em cada uma, reler o Histórico e o Tracker (`Status`).

**Resultado esperado**
- Passos 1–2: cancelamento concluído; Histórico "Processo cancelado por: Gestor …"; Tracker `Status=CANCELADA`; ERP sincronizado (SC/cotação
  canceladas — mensagens do Portal do Comprador citadas no CT-FSWTBC-4625).
- Passo 3: em negociação, o caminho suportado é o Portal do Comprador ("rotina responsável pela remoção completa do fluxo"); pelo botão do
  processo, mensagem clara de orientação — nunca erro genérico.
- SC convertida se comporta como a atual.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro ao cancelar sendo gestor (prints de 05/06 e 09/06 para 78317, 79163, 79168); necessidade de "conversão para a versão atual do
  processo" antes de conseguir cancelar.

**Severidade:** Alta

**Preparação de massa:** SC própria em três estados (atual, convertida, negociação) + perfil de gestor do processo.

**Verificado em tela:** PARCIAL
**O que foi verificado:** botão **Cancelar Solicitação** visto renderizado em 5 solicitações (modo leitura); Histórico da **112830** com
"Converteu o processo wf_solicitacao_compras da versão 97 para a versão 98" e da **64267** com 72→75→77 (a mecânica de conversão existe e
é registrada); pela API hoje: **99938** `FINALIZED` (fim em *Fim - Validação Orçamentária*, 12 tarefas — foi liberada em 11/06);
**79163** `FINALIZED` v77 com uma tarefa `NOT_COMPLETED` em *Aguarda Vigência do Contrato (332)*; **79168** `FINALIZED` v77; **78317**
`CANCELED` v55 (última tarefa *Validação do Comprador* `TRANSFERRED`). Portal do Comprador: ação **"Cancelar Solicitação"** na lista
`actions` de *Controle de Cotações* lida no fonte.
**Divergências encontradas:** 79163 consta `FINALIZED` **com tarefa aberta** em 332 — estado inconsistente (finalizado com pendência),
mesma família do A11. A regra "gestor cancela em qualquer etapa" convive com a exceção declarada para negociação (melhoria não aberta).
**Dados/massa usados:** nenhum — não submetido; leitura de 99938, 79163, 79168, 78317, 112830, 64267.

---

## CT-FSWTBC-4673  (ambos · Concluído · SDCASSI-441)

**Título:** Aprovar uma SC e ver a cotação gerada no Protheus com o número refletido no Fluig — e, se a instância Fluig cair, ver a falha registrada e retentada

**Origem:** FSWTBC-4673 — cotações não geradas no Protheus (SCs 97283 e 98626). Atribuído a **infraestrutura**: "erro de comunicação entre
o Protheus e o Fluig, ocasionado por problema de acesso em uma das instâncias do Fluig"; "não é a primeira ocorrência"; sem governança
sobre as instâncias (T-Cloud). Encerrado como "Não Contratado".

**Módulo/Rota:** Fluig → **Solicitação de Compras** → *Integração com ERP (20)* → *Cotação foi Gerada? (24)* → *Aguarda Geração da Cotação
(328)* → *Processo de Cotação (33)* · Histórico ("Integração executada com sucesso", "Geração do processo de … executada com sucesso!
Processo número: N") · Tracker visão *Solicitação de Compras* (**Nº da Solicitação ERP**, **Nº da Cotação ERP**) · Logs Protheus → *Erros CV8*.

**Pré-condições**
- SC `QA` aprovada por gestor/orçamento e chegando a *Integração com ERP (20)* (exige perfis de gestor/orçamento).
- **Bloqueio:** conta de QA sem perfis de aprovação; queda de instância não é provocável (infra).

**Passos**
1. Após as validações, acompanhar o Histórico em *Integração com ERP* e *Cotação foi Gerada?*.
2. No Tracker, ler **Nº da Solicitação ERP** e **Nº da Cotação ERP**.
3. Se a cotação não vier: ler a decisão de *Cotação foi Gerada?* (condição), a atividade seguinte (*Aguarda Geração da Cotação (328)* ou
   *Captura de Erro - Integração com ERP (129)* → *Correção*) e o campo **Retorno Integração**.
4. Logs Protheus → *Erros CV8* → filtrar pela data.
5. Amostragem: Tracker sem filtro, linhas com *Atividade Atual = Aguarda Geração da Cotação* e sua *Data da Solicitação*.

**Resultado esperado**
- Cotação gerada: Histórico com "Integração executada com sucesso - Tempo de Execução N s" e o Tracker com **Nº da Cotação ERP**
  preenchido (ex.: 97283 → `000530`).
- Em falha de comunicação: a falha é **registrada** (Histórico "Falha ao executar evento de serviço … Nova tentativa em …", 3 tentativas)
  e depois cai em *Correção* com o erro em **Retorno Integração**/CV8 — nunca silêncio em *Aguarda Geração da Cotação* por dias.
- Zero SCs em 328 com mais de 1 dia.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SCs (97283, 98626) sem cotação no Protheus, sem erro visível; causa só encontrada por análise da instância.

**Severidade:** Alta

**Preparação de massa:** SC `QA` aprovada até a integração (gestor + orçamento). O ramo de queda de instância só se observa por
amostragem.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **97283** hoje `FINALIZED` (fim 09/07/2026 em *Fim - Processo de Faturamento de Contratos*); Tracker:
`Nº da Solicitação ERP=000881`, `Nº da Cotação ERP=000530`, `Dispensa Cotação=Nao` — a cotação acabou gerada; Histórico da 97283 **visto
renderizado** com "Geração do processo de Negociação de Cotação no Fluig executada com sucesso! Processo número: 103587" e "Integração
executada com sucesso - Tempo de Execução 22 s"; **98626** `FINALIZED`, 45 tarefas. Nos 1.000 movimentos mais recentes de v98 há **1**
instância em *Aguarda Geração da Cotação (328)* e 1 em *Cotação foi Gerada? (24)*. Aba *Erros CV8* existe, `genericQuery` 404.
**Divergências encontradas:** o ticket não cita atividade; o ponto de decisão real é **Cotação foi Gerada? (24)** com espera em **Aguarda
Geração da Cotação (328)**. Queda de instância Fluig não deixa rastro nas superfícies do usuário — só ausência de linha no Histórico;
por isso o caso inclui a amostragem (passo 5) como critério.
**Dados/massa usados:** nenhum — não submetido; leitura de 97283, 98626.

## CT-FSWTBC-4677  (fluig · Concluído · SDCASSI-443)

**Título:** Tentar finalizar um processo de cotação que ainda tem processos filhos em aberto e conferir que o bloqueio é explicado ao usuário.

**Origem:** FSWTBC-4677 (incidente **814014**) — na SC **99083**, o processo de cotação de produtos e serviços apresentou **"Não será possível finalizar o processo pois existem outros processos em aberto!"**. A regra funciona (barra a finalização), mas o usuário **não tem como saber quais** processos estão em aberto nem chegar a eles pela mensagem, o que transforma um bloqueio legítimo em chamado de suporte. Resolvido "em sala", sem registro do que estava pendente.

**Módulo/Rota:** **Cotação de Produtos e Serviços** (`wf_cotacao_produtos_servicos`) → movimentação de finalização; conferência dos processos filhos no **Tracker - Processos Compras/Contratos** (`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`) e na aba **Histórico**.

**Pré-condições**
- Uma cotação com **pelo menos um processo filho em aberto** (negociação ou parecer técnico), atribuída ao usuário do teste.
- **Bloqueio:** finalizar processo é **escrita** em processo real — proibido pelo escopo (a única tarefa disponível para esta conta é uma **Correção** do processo 112113, e ela não foi movimentada). O caso não foi executado.

**Passos**
1. Abrir a tarefa da **Cotação de Produtos e Serviços** que se quer finalizar.
2. Antes de movimentar, abrir o **Tracker - Processos Compras/Contratos** e filtrar por **Nº do Processo Fluig** da cotação, para inventariar os processos relacionados (Negociação de Cotação de Produtos/Serviços, Parecer Técnico, Recepção de Documentos Fiscais).
3. Registrar quais desses processos estão **em aberto**.
4. Voltar à tarefa e acionar a finalização.
5. Ler a mensagem apresentada, **literalmente**.
6. Conferir se a mensagem permite identificar quais processos impedem a finalização.
7. Encerrar os processos filhos e repetir a finalização.

**Resultado esperado**
- Havendo processo filho em aberto, a finalização é **bloqueada** — o comportamento correto é barrar.
- A mensagem apresentada é **"Não será possível finalizar o processo pois existem outros processos em aberto!"**.
- *(Melhoria recomendada no próprio ticket, ainda não implementada:)* a mensagem deveria **listar ou linkar** os processos em aberto que impedem a finalização.
- Encerrados os processos filhos, a mesma ação **conclui** a cotação, e o **Histórico** registra o movimento de fim.
- O bloqueio não deixa a tarefa em estado inconsistente: após a mensagem, a tarefa continua disponível ao usuário.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Na SC **99083**, a mensagem **"Não será possível finalizar o processo pois existem outros processos em aberto!"** aparecia sem qualquer indicação de **quais** processos estavam pendentes — o usuário não tinha caminho para resolver sozinho e abria chamado.

**Severidade:** Média

**Preparação de massa:** uma cotação com **um processo filho comprovadamente em aberto** (negociação ou parecer técnico) e atribuída ao executor do teste — mais o par de controle, com todos os filhos encerrados, para provar que a finalização passa. Quem prepara: área de Compras. O QA não pode montar isso sem movimentar processos reais.

**Verificado em tela:** NÃO
**O que foi verificado:** a mensagem **não existe em nenhum artefato de front-end publicado** que se pôde ler — foi procurada, sem ocorrência, no bundle do Portal do Comprador, no widget da Gerência de Compras e nos fontes publicados dos formulários de **Solicitação de Compras**, **Cotação**, **Negociação** e **Faturamento de Contratos**. Conclusão: a crítica é emitida por **evento server-side do workflow** (não publicado no front-end) e só aparece na **tentativa real de movimentação** — que o escopo proíbe. As superfícies de conferência **existem e foram vistas**: o **Tracker - Processos Compras/Contratos** abre com os filtros *Nº do Processo Fluig, Solicitante, Status, Data da Solicitação (De/Até), Nº da Solicitação ERP, Nº da Cotação ERP, Filial, Dispensa Cotação, Tipo de Solicitação, Número do Contrato* e cobre os tipos *Solicitação de Compras, Cotação de Produtos/Serviços, Negociação de Cotação de Produtos/Serviços, Faturamento de Contratos, Parecer Técnico, Recepção de Documentos Fiscais*; e a **Central de tarefas** exibe a tarefa de Cotação com o botão **Enviar**. Por REST confirmou-se que `wf_cotacao_produtos_servicos` é um processo ativo (versão corrente 25) e que `wf_negociacao_cotacao_prod_serv` e `wf_solicitacao_compras_parecer` (Parecer Técnico) são os processos filhos candidatos.
**Divergências encontradas:** o ticket atribui a mensagem à "SC 99083", mas o texto fala em **finalizar o processo** — pelo desenho publicado, quem tem processos filhos (negociação, parecer técnico) é o **processo de Cotação**, não a SC. O número citado é o da SC; a movimentação bloqueada é a da cotação vinculada.
**Dados/massa usados:** nenhum — nenhuma finalização foi tentada.

---

## Resumo do lote

| Caso | Verificado | Bloqueio principal |
|---|---|---|
| CT-FSWTBC-4361 | PARCIAL | conta de QA sem SC reprovada (dataset responde `[]`) |
| CT-FSWTBC-4417 | PARCIAL | exige submeter SC; parametrização de pasta sem superfície de front-end |
| CT-FSWTBC-4418 | PARCIAL | sem credencial de gestor/substituto; regra não documentada |
| CT-FSWTBC-4453 | PARCIAL | só um ambiente acessível (o chamado é sobre DES × TST) |
| CT-FSWTBC-4454 | PARCIAL | sem tarefa de aprovação de SC atribuída à conta |
| CT-FSWTBC-4455 | PARCIAL | grades de cotação vazias (`genericQuery` 404 + matrícula de comprador) |
| CT-FSWTBC-4457 | PARCIAL | idem — status lido no fonte e confirmado por REST |
| CT-FSWTBC-4458 | PARCIAL | idem — ação de linha inacessível |
| CT-FSWTBC-4466 | PARCIAL | exigiria centralizar SC de terceiros (proibido) |
| CT-FSWTBC-4505 | PARCIAL | sem credencial de comprador |
| CT-FSWTBC-4537 | **SIM** (leitura) | nenhum para leitura; atribuição não executada por escopo |
| CT-FSWTBC-4607 | PARCIAL | mecanismo de atribuição não tem superfície de front-end |
| CT-FSWTBC-4676 | PARCIAL | sem credencial de comprador; assumir tarefa é escrita |
| CT-FSWTBC-4677 | **NÃO** | mensagem é de evento server-side; finalizar é escrita |

## CT-FSWTBC-4709  (protheus · Concluído · SDCASSI-446)

**Título:** Gerar a cotação de uma SC que tem o mesmo produto em quatro itens e conferir que a cotação mantém quatro itens separados, no Protheus e nas telas de cotação do Fluig

**Origem:** FSWTBC-4709 — ao gerar cotação (MATA131), itens da mesma SC com mesmo produto e filial eram **aglutinados** na DHV (SC 000030: 4 itens do produto 04000161, quantidades 6/3/3/1, viravam 1 item com 13). Corrigido com os pontos de entrada `MA131KEY`/`MA131QSC` (chave e quebra por `C1_ITEM`, `UCOME042.tlpp`), homologado com MIT010 (SCs 99045–99047). Colateral de produção no mesmo ticket: `UCOME038` com default `TB_ENVSCHD = CC54GO_DES_SCHED` disparando o job `FILANFC` no ambiente de desenvolvimento — corrigido com `GetEnvServer()`.

**Módulo/Rota:** Fluig → **Solicitação de Compras** (`wf_solicitacao_compras`) → aprovação → Protheus → Compras → *Geração de Cotação* (MATA131 — *nome de menu a confirmar*) → cadastro da cotação (itens DHV). Leitura no Fluig: **Portal do Comprador → Controle de Cotações** (itens via `getQuotesDhuERP`, DHU/DHV); **Tracker** → *Filtrar por: Cotação de Produtos/Serviços* → *Nº do Processo*; formulário da **Cotação** (`wf_cotacao_produtos_servicos`).

**Módulo ERP:** `Compras`

**Pré-condições**
- SC criada pela conta de QA com **quatro itens do mesmo produto** (quantidades 6, 3, 3 e 1) na mesma filial — permitido: prefixo `QA` na descrição/observação.
- Perfil para aprovar a SC até a geração da cotação (gestor + comprador com matrícula) e credencial no Protheus para gerar a cotação.
- **Bloqueio:** conta de QA **sem matrícula de comprador** (§5-C) e sem credencial de gestor/Protheus — a SC pode ser criada, mas não levada até a cotação nesta rodada; `genericQuery` do Portal do Comprador em **404** hoje (instabilidade).

**Passos**
1. (Fluig) Criar a SC com os quatro itens do mesmo produto; anotar o nº do processo e o *Nº da Solicitação ERP* após a integração.
2. Aprovar até *Aguarda Geração da Cotação*; (Protheus) gerar a cotação pelo MATA131 para essa SC.
3. (Protheus) Abrir a cotação gerada e contar os itens e quantidades.
4. (Fluig) *Portal do Comprador → Controle de Cotações* → abrir a cotação → contar itens e quantidades; conferir que cada item referencia seu `C1_ITEM` de origem.
5. (Fluig) *Tracker → Cotação de Produtos/Serviços* → filtrar pelo nº do processo → conferir a grade.
6. (Protheus, verificação do colateral) Confirmar que o parâmetro `TB_ENVSCHD` existe no ambiente de produção **ou** que `UCOME038` usa `GetEnvServer()`; conferir no log do schedule que o job `FILANFC` roda no próprio ambiente sem erro a cada 5 min.

**Resultado esperado**
- Passos 3–5: **4 itens**, quantidades **6, 3, 3 e 1**, cada um ligado ao seu item da SC; total 13 apenas como soma.
- Passo 6: job no ambiente correto, sem falha recorrente.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Cotação com **1 item, quantidade 13** (SC 000030 / 98958 na reprovação de 17/06); rastreabilidade item a item perdida e impossibilidade de cotar cada linha.
- Colateral: `FILANFC` falhando a cada 5 minutos no schedule de produção por apontar para `CC54GO_DES_SCHED`.

**Severidade:** Alta *(perda de dado por item — rateio/aprovação por item deixam de existir)*

**Preparação de massa:** uma SC `QA` com quatro itens do mesmo produto, criada pelo executor; aprovação e geração da cotação por comprador com matrícula válida.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Portal do Comprador* abre em *Acesso Rápido* e registra `Comprador não encontrado` para a conta de QA; no bundle publicado, os itens de cotação são lidos por `getQuotesDhuERP` (DHU/DHV) — a superfície do defeito; *Tracker* com a visão *Cotação de Produtos/Serviços* no combo *Filtrar por* e dataset `dsFluig_getProcessoCotacoesSql_CASSI` existente (GET 200). Não foi possível abrir uma cotação (perfil) nem gerar uma (Protheus).
**Divergências encontradas:** os números do ticket (SC 000030, 98958, 99045–99047, 000053) são numerações do Protheus (`C1_NUM`), não nº de processo Fluig — não localizáveis pelo portal com esta conta.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4760  (ambos · Concluído · SDCASSI-452)

**Título:** Gerar a cotação a partir da SC e conferir que o número devolvido ao Fluig corresponde a uma cotação consultável no ERP antes de o fluxo avançar.

**Origem:** FSWTBC-4760 — erro de integração ao abrir a cotação da SC 101889: o Protheus criou a cotação, devolveu o número e depois **desfez a transação**; o Fluig, corretamente, bloqueou a movimentação, mas o estado só se recuperou apagando a fila no ERP e criando um retorno no fluxo. Encerrado por tratativa pontual, sem correção estrutural.

**Módulo/Rota:** `wf_solicitacao_compras` → *Validação do Comprador* (119) → geração da cotação (integração **20** `integracaoERP`); Tracker visão *SC* (coluna **Nº da Cotação ERP**, atividades "Aguarda Geração da Cotação" 328 → "Aguarda Finalizar Cotação" 161); Tracker visão *CPS* (`wf_cotacao_produtos_servicos`: "Aguarda Movimentação Protheus" **42**, gateway "Erro?" **60**, "Correção" **72**); formulário da SC, campo **Retorno Integração**; formulário da Cotação, campo **Erro retornado pelo ERP Protheus**.

**Pré-condições**
- SC de QA com *Dispensa Cotação* = Não, aprovada pelo gestor e na Validação do Comprador.
- Usuário com papel de comprador.
- **Bloqueio:** a conta de QA não resolve matrícula de comprador; o rollback do ERP não é reproduzível a partir do Fluig — o caso vale como regressão do caminho feliz e da observabilidade do erro.

**Passos**
1. Como comprador, na *Validação do Comprador*, gerar a cotação.
2. Tracker SC (**Nº do Processo Fluig**): coluna **Nº da Cotação ERP** preenchida; *Atividade Atual* evolui de "Aguarda Geração da Cotação" para "Aguarda Finalizar Cotação".
3. Tracker CPS (**Nº da Cotação** = número obtido): um processo por fornecedor, *Atividade Atual* = "Recepção de Propostas" (7).
4. Abrir a SC → Histórico: "Integração executada com sucesso - Tempo de Execução N s"; campo **Retorno Integração** vazio.
5. Portal do Comprador → **Controle de Cotações**: a cotação aparece com seus itens.
6. Simulação do rollback (só com apoio do ERP): tornar a cotação inexistente/indisponível na API do Protheus e movimentar o CPS.

**Resultado esperado**
- Passos 2–5: número devolvido ao Fluig é consultável no ERP e no Portal do Comprador; nenhum CPS em "Aguarda Movimentação Protheus"/"Erro?"/"Correção".
- Passo 6: o Fluig bloqueia a movimentação **e informa** (Retorno Integração / Erro retornado pelo ERP Protheus / atividade Correção com mensagem) — nunca trava em silêncio; a recuperação deve ser possível pela interface (Correção → reprocessar), sem apagar registro de fila no ERP.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- "Erro na integração ao abrir a cotação"; o Fluig referencia uma cotação que o ERP não tem; contorno: "deletamos da tabela de fila do Protheus e criamos um retorno no fluxo".

**Severidade:** Média

**Preparação de massa:** SC de QA pronta para cotação, criada pelo executor; papel de comprador para gerar a cotação; para o passo 6, apoio de alguém com acesso ao Protheus/fila.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *API* — mapa de atividades do `wf_cotacao_produtos_servicos` montado sobre 1.800 movimentos reais: 4 Início, 5 Grava Info. Forn e Integra com o GED, 7 Recepção de Propostas, 9 Integração com ERP, 11 Fim, 21 Disponibiliza Portal?, 25 Notifica Fornecedor, 32 Intermediário, **42 Aguarda Movimentação Protheus (130 mov.)**, **60 Erro? (130)**, 65 Forn. Generico?, **72 Correção (6)**. SC 101889 (a do ticket) hoje: encerrada em 21/07/2026 ("Contrato?" 339 → "Fim - Processo de Faturamento de Contratos" 117) — foi recuperada. *Visto renderizado* — Tracker SC tem a coluna **Nº da Cotação ERP**; Tracker CPS abertos hoje: 15 registros (12 em Recepção de Propostas, **3 em "Correção" com responsável `fabricasoftware@totvs.com.br`**). *Lido no fonte publicado* — `form_sc.html`: campo **"Retorno Integração *"** (`anLockBudgRetIntErr`); `form_cot.html`/negociação: rótulo **"Erro retornado pelo ERP Protheus"** (`hd_erroProtheus`, `msgerro`, `panelError`).
**Divergências encontradas:** o ticket chama de "erro ao gerar cotação"; a SC 101889 terminou como **contrato** (Fim - Processo de Faturamento de Contratos), não como pedido. Há hoje 3 cotações em *Correção* atribuídas à conta da fábrica — candidatas a este mesmo sintoma.
**Dados/massa usados:** SC 101889, CPS abertos (só leitura); nada gerado.

---

## CT-FSWTBC-4768  (fluig · Concluído · SDCASSI-454)

**Título:** Na etapa de Recepção de Propostas, o comprador consegue ver o rateio da SC que está conduzindo — sem depender de nenhum fornecedor ter enviado proposta.

**Origem:** FSWTBC-4768 — "Rateio não é exibido na etapa 'Recepção de Propostas' na visão do
Comprador". O cliente argumentou que, embora a etapa seja de recebimento, é nela que o comprador tem
acesso ao processo para analisar — inclusive conferir centros de custo e percentuais antes de
conduzir a cotação —, e pediu que a visualização da SC ficasse disponível também no Portal do
Comprador / Controle de Cotações, sem depender do envio de propostas. O esclarecimento técnico do
desenvolvedor no ticket é a chave do caso: *"o print está referenciado ao formulário de **Cotação**;
o rateio se encontra no formulário de **Requisição de Compras**"* — são formulários distintos, e
trazer o rateio para a visão da cotação exige **consulta cruzada**.

**Módulo/Rota:** **Cotação de Produtos e Serviços**, etapa **Recepção de Propostas** (visão do
Comprador), e o **Portal do Comprador / Controle de Cotações**. O rateio de origem vive no formulário
da **Solicitação de Compras** (iframe `/webdesk/streamcontrol/256831/`), na grade
`tbRateioItens___<item>` de cada item.

**Pré-condições**
- Uma SC que já tenha gerado **cotação** e esteja na etapa **Recepção de Propostas**.
- A SC de origem precisa ter **rateio preenchido** — de preferência em **dois ou mais centros de
  custo**, para que a soma dos percentuais seja verificável.
- O executor precisa ser o **comprador** responsável pela cotação.
- **Bloqueio:** sim. A conta de QA `TOTVS-FS` **não resolve matrícula de comprador** — o dataset
  `dsProtheus_getCompradores_restGetAll` é chamado com `Y1_USER = "undefined"` —, o que fecha a
  família cotação/alçada para este login (limitação de conta documentada, **não** defeito do
  produto). Some-se a isso que o endpoint `genericQuery` do Portal do Comprador vem respondendo
  **404** (instabilidade de ambiente). Não há, portanto, como assumir a visão do comprador nesta
  rodada.

**Passos**
1. Autenticar com o usuário **comprador** e abrir a cotação na etapa **Recepção de Propostas**, pela
   Central de Tarefas.
2. **Antes de qualquer proposta ter sido enviada por fornecedor**, procurar na tela o rateio da SC de
   origem: percentual, centro de custo e classe de valor, item a item.
3. Anotar, para cada item, os pares *centro de custo × percentual* exibidos.
4. Abrir em paralelo a **Solicitação de Compras** de origem e, no painel de cada item, ler a grade de
   rateio (**Item**, **Rateio**, **Classe Valor**, **Centro de Custo**).
5. Comparar os dois conjuntos: têm de ser idênticos.
6. Conferir que, para cada item, a soma dos percentuais de rateio fecha em **100%**.
7. Repetir a consulta pelo **Portal do Comprador / Controle de Cotações**, confirmando que a
   visualização da SC está disponível ali também, sem depender de proposta enviada.
8. Sair sem movimentar a cotação.

**Resultado esperado**
- O rateio da SC é visível ao comprador **na etapa Recepção de Propostas**, com **centro de custo**,
  **classe de valor** e **percentual** por item.
- A informação aparece **antes** de qualquer fornecedor enviar proposta — a visualização não é
  condicionada ao recebimento.
- Os valores exibidos na cotação **coincidem** com os do rateio da Solicitação de Compras de origem
  (é consulta cruzada, não redigitação).
- A soma dos percentuais de rateio de cada item fecha em **100%**.
- A mesma consulta está disponível pelo **Portal do Comprador / Controle de Cotações**.
- Nenhum passo do caso exige movimentar a cotação — é tudo consulta.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A etapa **Recepção de Propostas** sem qualquer exibição do rateio na visão do comprador,
  obrigando-o a conduzir a cotação sem enxergar centros de custo e percentuais, e a consulta à SC só
  ficando disponível **depois** que algum fornecedor envia proposta. O ticket não registra mensagem —
  a evidência é o print da etapa sem o rateio.

**Severidade:** Média — não há risco financeiro direto, mas o comprador decide sem a informação de
rateio à vista, e a conferência de centro de custo fica para depois da cotação, quando corrigir custa
mais.

**Preparação de massa:** uma SC com rateio em **dois ou mais centros de custo**, levada até a cotação
e parada em **Recepção de Propostas**, com o executor como comprador responsável. Exige um login com
**matrícula de comprador resolvida no ERP** (`Y1_USER`), que esta rodada não tem — precisa ser
providenciado por quem administra o cadastro de compradores no Protheus.

**Verificado em tela:** PARCIAL
**O que foi verificado:** confirmou-se **onde o rateio realmente vive**, que é o ponto técnico do
ticket. **Visto renderizado** — o formulário da **Solicitação de Compras** (256831) abre e traz, por
item, o painel de rateio (`divTbRateioItens` / `tbodyRateioItens___<item>`), com os botões
**Adicionar Produto**, **Adicionar Itens**, **Importar Planilha** e **Baixar Modelo de Planilha**.
**Lido no fonte publicado** (`App/ViewHandler.js` do formulário 256831), a grade de rateio é montada
dinamicamente com os campos, todos obrigatórios: **Item** (`tbRatCC_item`, readonly), **Rateio**
(`tbRatCC_Rateio`, percentual, máx. 8), **Classe Valor** (`tbRatCC_classeValor`, zoom sobre o dataset
`dsFluig_getClasseValor`, exibindo `CTH_IDDESC`) e **Centro de Custo** (`tbRatCC_centroCusto`); há
ainda a exportação **"Rateio e Centro de Custo.csv"**. O mesmo rateio é o que a abertura de SC a
partir de contrato transporta, sob as chaves `tbRatCC_centroCusto___<item>_<n>`,
`tbRatCC_classeValor___<item>_<n>` e `tbprod_jsonrateio___<item>`. **A visão do comprador na etapa
Recepção de Propostas não pôde ser aberta** — ver Bloqueio. Sobre as superfícies do Fluig que
existiriam para ancorar o efeito: o **Tracker - Processos Compras/ Contratos**
(`/portal/p/1/PORTAL_TRACKER_COMPRAS_CONTRATOS`) abre e cruza *Solicitação de Compras / Cotação de
Produtos·Serviços / Negociação de Cotação* com *Número da Solicitação*, *Nº da Cotação*,
*Solicitante* e *Número do Contrato* — **mas não expõe rateio**; e a **Gerência de Compras**
(`/portal/p/1/gerenciaCompras`) abre com as abas **Atribuir** e **Transferir**, também sem rateio.
No painel de **Acompanhamento de Contratos**, o único dado de rateio é o **indicador** *Rateio?*
(`CNA_RATEIO`) no modal *Detalhes da Planilha* — um sinalizador, não o detalhe por centro de custo.
**Não há, hoje, superfície de front-end acessível a este login onde o rateio apareça na visão da
cotação**; a asserção central do caso depende de um login de comprador.
**Divergências encontradas:** uma, de escopo, e é a do próprio ticket: o print anexado referia-se ao
formulário de **Cotação**, mas o rateio pertence ao formulário de **Requisição de Compras / Solicitação
de Compras** — são artefatos distintos (a SC é o formulário `256831`). Quem executar o caso precisa
ter isso claro, sob pena de procurar o campo no lugar errado e concluir "ausente" o que na verdade
está em outro formulário.
**Dados/massa usados:** nenhum — formulário da SC aberto em branco; Tracker e Gerência de Compras
abertos em leitura; nada submetido.

---

## CT-FSWTBC-4771  (ambos · Concluído · SDCASSI-457)

**Título:** Consultar no Tracker os processos de cotação de uma SC e conferir que nenhum fornecedor aparece com erro de integração "O campo Produto (C8_PRODUTO) não foi preenchido".

**Origem:** FSWTBC-4771 — na SC 96526, a cotação (processo 100204, fornecedor Specto) aparecia no Tracker com erro 401 "O campo Produto (C8_PRODUTO) nao foi preenchido". Não reproduzido em TST, cessou em PRD; encerrado sem causa, com tratamento pontual das afetadas.

**Módulo/Rota:** Tracker visões *SC* e *CPS*; formulário da Cotação, campo **Erro retornado pelo ERP Protheus**; Portal do Comprador → **Controle de Cotações**.

**Pré-condições**
- SC com cotação gerada (Dispensa Cotação = Não) e ≥ 1 fornecedor participante.
- **Bloqueio:** erro intermitente sem reprodução conhecida; *Controle de Cotações* depende do `genericQuery`, que responde 404 hoje (ambiente).

**Passos**
1. Tracker → SC → **Nº do Processo Fluig** → anotar **Nº da Cotação ERP**.
2. Tracker → CPS → **Nº da Cotação** (`txt_nCot_infForn`) = número anotado → **Pesquisar Registro**.
3. Conferir uma linha por fornecedor (colunas *CNPJ/CPF, Razão social, Nome de Fantasia, Loja Fornecedor, Código Fornecedor*), *Atividade Atual* e *Responsável Atual*.
4. Abrir cada CPS (**Visualizar Solicitação**) → Histórico e campo **Erro retornado pelo ERP Protheus**.
5. Portal do Comprador → Controle de Cotações → mesma cotação: itens com produto preenchido.

**Resultado esperado**
- Nenhum CPS em "Erro?"/"Correção"; todos em "Recepção de Propostas" ou posterior.
- Histórico sem "401" e sem "O campo Produto (C8_PRODUTO) nao foi preenchido"; **Erro retornado pelo ERP Protheus** vazio.
- Todos os itens da cotação com código de produto no Controle de Cotações.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Cotação do fornecedor listada no Tracker com erro **401 "O campo Produto (C8_PRODUTO) nao foi preenchido"**.

**Severidade:** Média

**Preparação de massa:** SC de QA com cotação gerada — exige papel de comprador. Para regressão passiva, basta a massa existente (CPS abertos).

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Visto renderizado* — Tracker CPS, **Nº do Processo Fluig** = 100204: 1 registro, *Status* **FINALIZADA**, *Solicitante* "Portal de fornecedores", 03/06/2026, *Atividade* "Fim", filial 3501, **Nº da Cotação 000090**, *Comprador* Dayane Madeira da Fonseca, CNPJ **95849642000176 SPECTO PAINEIS ELETRONICOS LTDA**, loja 0001, código 95849642, frete "C". *API* — 100204 é `wf_cotacao_produtos_servicos`: 50 "Notifica Fornecedor" → 51 "Fim" em 22/06/2026; SC 96526 encerrada 26/06 ("Fim - Processo de Pagamento de Compras"). *Lido no fonte publicado* — `form_cot.html`: rótulo "Erro retornado pelo ERP Protheus" (`hd_erroProtheus`/`msgerro`/`panelError`).
**Divergências encontradas:** "cotação 100204" no ticket é o **nº do processo Fluig** de cotação; o nº da cotação ERP é **000090**. Não há coluna de erro no Tracker CPS — o "erro 401" do ticket é visto ao abrir a instância, não na grade.
**Dados/massa usados:** CPS 100204, SC 96526 (só leitura).

---

## CT-FSWTBC-4772  (ambos · Concluído · SDCASSI-456)

**Título:** Abrir no Portal do Comprador uma cotação cuja justificativa (C8_XJUST) contém pontuação e acentos e conferir que todos os fornecedores e produtos carregam, com o texto legível.

**Origem:** FSWTBC-4772 — a SC 90527 não carregava os produtos de alguns fornecedores por pontuação na justificativa `C8_XJUST`. Correção ampla: `isCentralized_utilities()`, `throw e` em vez de `throw new Error(e)`, dataset novo `dsProtheus_getGrupProdxFornece_PortalComp_restGetAll`, `handlerEncoding` com `TextDecoder('utf-8',{fatal:true})`, `beforeCancelProcess` migrado para `DELETE /api/v1/fluig/integracao/compras/solicitacao/manutencao/{num}`, Faturamento v42→46 com grupo `G.P.FatConCorrecaoIntegraca`.

**Módulo/Rota:** Portal do Comprador (`/portal/p/1/gerenciaCompras`) → **Controle de Cotações** (`#/controleCotacao`) → **Avaliação de Propostas** (`#/avaliacaoPropostas`).

**Pré-condições**
- Cotação com ≥ 2 fornecedores em que a justificativa de um item contenha `; ' " % ( )` e acentos (ex.: `QA: aprovação "urgente"; 100% — não`).
- Usuário com papel de comprador.
- **Bloqueio:** a conta de QA não resolve matrícula de comprador (`Y1_USER="undefined"`) — o portal lista vazio para este login; `genericQuery` 404 hoje.

**Passos**
1. Portal do Comprador → Controle de Cotações → localizar a cotação.
2. Expandir: contar fornecedores e, para cada um, os produtos.
3. Avaliação de Propostas → abrir o fornecedor com a justificativa pontuada → ler o texto da justificativa/observação do comprador.
4. Repetir com um texto que já venha em UTF-8 correto e com um em mojibake (`aprovaÃ§Ã£o`).
5. Abrir o console do navegador durante os passos 2–4.

**Resultado esperado**
- Todos os fornecedores e todos os produtos carregam, independentemente do conteúdo da justificativa.
- Texto exibido sem mojibake (`Ã£` → `ã`), sem `undefined`, sem URIError; texto já em UTF-8 permanece intacto.
- Console sem exceção não tratada.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Produtos de alguns fornecedores não aparecem; erro silencioso (a UI cai sem mensagem) ou `URIError` em textos como "ão".

**Severidade:** Média

**Preparação de massa:** cotação de QA com justificativas contendo pontuação/acentos, criada pelo executor com papel de comprador; um fornecedor de teste.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Lido no fonte publicado* — `wg_portalCompradores/.../main.js` (844.689 bytes, baixado 04/09): `handlerEncoding(e)` remove tags, detecta mojibake pela regex `/[Â-ÃÅÆ][-¿]/` e converte com `new TextDecoder("utf-8",{fatal:!0})`, devolvendo o original em caso de erro — bate com a correção; `obsComprador: this.utilsService.handlerEncoding(String(v.C8_XJUST??""))` em dois pontos (cotação e negociação); busca de fornecedores por `handleUrlSearch('dsProtheus_getGrupProdxFornece_PortalComp_restGetAll&filterFields=…')`. *API (GET search, hoje)* — esse dataset **existe e responde 200 com dados** (`A2_NOME "BANCO DO BRASIL SA"`, `A2_CGC`, `AD_FORNECE`, `AD_LOJA`, `AD_FILIAL`, `A2_LOJA`…). SC 90527 hoje: em "Aguarda Finalizar Negociação" (172) desde 24/07, responsável "Administrador Cassi" — ainda viva. Nada renderizado no portal (limitação da conta).
**Divergências encontradas:** a SC 90527 do ticket está há 46 dias em "Aguarda Finalizar Negociação" atribuída a "Administrador Cassi" — o mesmo padrão de órfão do CT-FSWTBC-4765. Os scripts de servidor alterados (utilities, servicetasks, beforeCancelProcess) não são legíveis pela conta de QA.
**Dados/massa usados:** SC 90527 (só leitura); dataset consultado em modo leitura.

---

## CT-FSWTBC-4800  (ambos · Concluído · SDCASSI-463)

**Título:** Filtrar fornecedores participantes para uma cotação e conferir que a lista não repete fornecedor, diferencia loja e mostra só prestadores de Serviço/Material.

**Origem:** FSWTBC-4800 — na filtragem de fornecedores participantes (SC 100071) a lista trazia registros duplicados e o total divergia; a 1ª correção colapsou fornecedores de mesmo CNPJ sem diferenciar a **loja**; requisito adicional: exibir só Tp.Prestad = Serviço/Material. Corrigido (PR 70070).

**Módulo/Rota:** Portal do Comprador (`/portal/p/1/gerenciaCompras`) → **Controle de Cotações** → cotação → seleção de fornecedores participantes (grade com colunas **Código / Loja / Fornecedor / CGC / TIPO**); rótulo exato do botão de filtragem: `<não documentado>`.

**Pré-condições**
- Cotação em *Recepção de Propostas* do comprador.
- No cadastro do ERP: um fornecedor com **duas lojas** (mesmo código, lojas 0001 e 0002) no grupo de produto da cotação; um fornecedor do mesmo grupo com Tp.Prestad diferente de Serviço/Material.
- **Bloqueio:** a conta de QA não é comprador — a grade não é alcançável com este login.

**Passos**
1. Abrir a seleção de fornecedores participantes e filtrar pelo grupo de produto.
2. Contar as linhas e comparar com o total exibido pela grade.
3. Localizar o fornecedor de duas lojas.
4. Procurar qualquer par (Código, Loja) repetido.
5. Procurar o fornecedor com Tp.Prestad fora de Serviço/Material.
6. Procurar o fornecedor genérico 85070508 / 0001.

**Resultado esperado**
- Total exibido = nº de linhas = nº de pares (Código, Loja) distintos.
- O fornecedor de duas lojas aparece **duas vezes**, com *Loja* 0001 e 0002.
- Nenhum par repetido.
- O fornecedor com Tp.Prestad fora de Serviço/Material **não** aparece.
- O genérico 85070508-0001 não aparece (regra fixa no fonte — A2; deve estar documentada).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Registros duplicados e total maior que o nº real de empresas; ou lojas diferentes do mesmo CNPJ colapsadas numa só linha.

**Severidade:** Média

**Preparação de massa:** cotação de QA do comprador; cadastro no ERP de fornecedor com duas lojas no grupo de produto (SA2/AD) — a automação não cria.

**Verificado em tela:** PARCIAL
**O que foi verificado:** *Lido no fonte publicado* (`wg_portalCompradores` `main.js`): grade de fornecedores com colunas `A2_COD "Código"`, `A2_LOJA "Loja"`, `A2_NOME "Fornecedor"`, `A2_CGC "CGC"`, `A2_TIPO "TIPO"` (rótulos F = Físico etc.); consulta via `dsProtheus_getGrupProdxFornece_PortalComp_restGetAll` com `filterFields`; `replaceGenericSupplier` faz `splice` de `{A2_COD:"85070508",A2_LOJA:"0001"}`; `MAX_CONSULTAS_FORNECEDOR = 10`. *API (GET search, hoje)* — o dataset existe e devolve `A2_NOME, A2_CGC, AD_FORNECE, AD_LOJA, AD_FILIAL, A2_LOJA…` (a loja vem na resposta). SC 100071 do ticket: encerrada 16/07/2026. Nada renderizado (limitação da conta).
**Divergências encontradas:** não encontrei no bundle do portal nenhum filtro por "Tp.Prestad"/`A2_TIPO` restrito a Serviço/Material — se existe, está no dataset (servidor), logo `<não documentado>` no front. A deduplicação também não é visível no front: depende do dataset novo.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4864  (ambos · Concluído · SDCASSI-482)

**Título:** Cancelar uma SC pelo Portal do Comprador e confirmar que ERP e Fluig ficam no mesmo estado (cancelados os dois, ou nenhum)

**Origem:** FSWTBC-4864 — planilha de SCs canceladas no Protheus que **não permitiam cancelar o processo no Fluig**; fechado em 2 dias sem um comentário. Nono defeito de cancelamento da base; A2-c aponta a causa mecânica provável (404 tratado como sucesso).

**Módulo/Rota:** `/portal/p/1/portal-do-comprador` → cancelamento da solicitação (mensagens *"O cancelamento da solicitação de compras N no ERP Protheus foi executado com sucesso!"* / *"…processo N … no Fluig foi executado com sucesso!"*); Tracker → *Solicitação de Compras* (coluna *Status*); formulário da SC, campos ocultos `matriculaCancelamento / dataCancelamento / horaCancelamento / obsCancelamento`

**Pré-condições**
- SC **própria** (`QA-4864`) já gravada no ERP (*Nº da Solicitação ERP* preenchido) e ainda aberta no Fluig.
- Executor com matrícula de comprador (o Portal do Comprador resolve `Y1_USER`).
- **Bloqueio:** a conta de QA não tem matrícula de comprador (§5-C: *"Comprador não encontrado"*), e **não se cancela registro pré-existente**.

**Passos**
1. No Portal do Comprador, localizar a SC `QA-4864` e acionar o cancelamento; informar a justificativa.
2. Ler as notificações exibidas (ERP e Fluig, nesta ordem).
3. Abrir Tracker → *Solicitação de Compras* → filtrar pelo processo; ler *Status* e *Atividade Atual*.
4. Repetir 1 com uma SC cuja gravação no ERP **falhou** (ex.: SC parada em *Correção* sem *Nº da Solicitação ERP*).

**Resultado esperado**
- Passo 2: sem justificativa, *"A justificativa para cancelar a proposta deve ser informada!"*; com justificativa, **as duas** mensagens de sucesso.
- Passo 3: *Status* = **CANCELADA**; no formulário, `dataCancelamento/horaCancelamento/obsCancelamento` preenchidos.
- Passo 4: quando o ERP responde erro/404, o Fluig **não** cancela o processo e exibe *"Não foi possível executar o cancelamento da solicitação de compras N!"* — nunca "sucesso" com o processo cancelado só de um lado.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC cancelada no Protheus e processo **vivo** no Fluig (ou o inverso), sem mensagem de erro — em escala de planilha.

**Severidade:** Alta

**Preparação de massa:** uma SC `QA-4864` do executor, gravada no ERP; uma segunda SC sem gravação no ERP para o passo 4. Nenhuma SC de terceiros.

**Verificado em tela:** PARCIAL
**O que foi verificado:** mensagens e fluxo do cancelamento lidos no **fonte publicado** do Portal do Comprador (`pc_main.js`, `handlePurchasesDelet` → `handlePurchasesProcessDelet`); `if (status === 404) return []` e o `[]` truthy no ramo de sucesso (A2-c). Tracker *Solicitação de Compras* renderizado hoje mostrando **103685 = CANCELADA** com *Nº da Solicitação ERP* vazio. Por API: 103685, 103944, 106375, 103965 e 95519 todas `CANCELED` com `endDate` **14/08/2026 10:30:00** — um cancelamento em lote, sem cancelamento correspondente legível no Fluig (a última tarefa humana de cada uma ficou `NOT_COMPLETED`).
**Divergências encontradas:** a "planilha em anexo" do ticket não está disponível; o lote de 14/08 mostra que o contorno operacional continua sendo cancelar em massa por fora do fluxo.
**Dados/massa usados:** nenhum — nada cancelado.

---

## CT-FSWTBC-4965  (ambos · Concluído · SDCASSI-499)

**Título:** Cancelar a própria SC no Fluig a partir da Validação do Comprador ("Enviar para → Cancelar Solicitação") e confirmar o encerramento coerente

**Origem:** FSWTBC-4965 — erro ao cancelar a SC 103965 no Fluig; encerrado pelo cliente ("resolvido internamente") sem que as cinco perguntas do desenvolvedor fossem respondidas. Décimo defeito de cancelamento da base.

**Módulo/Rota:** *Solicitação de Compras* → Validação do Comprador (119 / 211 *Enviar para*) → select **Enviar para \*** (`buyerEnviarParaTreat`: *Retornar para Alçada - (Regerar Documento) / Retornar para Alçada - (Novo Fornecedor) / Retornar para Cotação / Retornar para Negociação / **Cancelar Solicitação***); Tracker → *Solicitação de Compras*; Histórico

**Pré-condições**
- SC **própria** `QA-4965` em Validação do Comprador, com *Nº da Solicitação ERP* preenchido; e uma segunda SC própria **sem** SC no ERP (em *Correção*).
- Executor com perfil de comprador.
- **Bloqueio:** conta de QA sem matrícula de comprador — não chega a *Validação do Comprador*; e não se cancela registro pré-existente (103965 é de terceiro e já está `CANCELED`).

**Passos**
1. Abrir a tarefa; em **Enviar para \*** escolher **Cancelar Solicitação**; preencher a justificativa; enviar.
2. Ler a mensagem exibida e o **Histórico**.
3. Abrir Tracker → *Solicitação de Compras* → filtrar pelo processo; ler *Status* e *Atividade Atual*.
4. Repetir 1 na SC sem número no ERP.
5. Repetir 1 com o ERP indisponível (interceptar o dataset de cancelamento).

**Resultado esperado**
- Passo 2–3: processo **CANCELADA** no Tracker; Histórico com o cancelamento no ERP registrado (*Integração executada com sucesso*) e os campos `dataCancelamento/horaCancelamento/obsCancelamento` preenchidos no formulário.
- Passo 4: cancela só no Fluig, **sem** tentar cancelar no ERP e sem erro.
- Passo 5: mensagem de erro clara e o processo **permanece aberto** (não cancela de um lado só).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro ao cancelar (print de 38 KB do ticket, mensagem não transcrita) e SC cancelada num sistema e viva no outro.

**Severidade:** Alta

**Preparação de massa:** duas SCs `QA-4965` do executor; comprador. Nunca a 103965.

**Verificado em tela:** PARCIAL
**O que foi verificado:** select **Enviar para \*** com a opção **Cancelar Solicitação** lido no fonte publicado (`form_sc.html:1900-1920`, `buyerEnviarParaTreat`); campos ocultos de cancelamento (`matriculaCancelamento`, `dataCancelamento`, `horaCancelamento`, `obsCancelamento`) presentes; atividade **211 Enviar para** confirmada por dado (95519, 19/06→02/07). Por API hoje: **103965** está `CANCELED` (14/08/2026 10:30, no mesmo lote das demais), com a última tarefa **161 Aguarda Finalizar Cotação** `NOT_COMPLETED` desde 10/07 — o cancelamento não passou pelo formulário.
**Divergências encontradas:** a mensagem de erro do ticket não é transcrita (só print) — `<não documentado>`; o cancelamento de 103965 ocorreu em lote administrativo, não pela tela.
**Dados/massa usados:** leitura de 103965 — nada cancelado.

---

## CT-FSWTBC-5007  (ambos · Concluído · SDCASSI-509)

**Título:** Na escolha do vencedor, o comprador vê todos os itens cotados de uma SC com mais de 100 itens, com a proposta de cada fornecedor

**Origem:** FSWTBC-5007 — SC 100122: na etapa de análise da cotação não apareciam os itens 0007–0012 e 00012–00018 embora tivessem
proposta no Protheus. Refinado para "solicitações com mais de 100 itens não carregam todos os itens na definição de vencedor".
Primeira correção (PR 71582) causou ausências esparsas (item 10 sem a proposta da JOAB RIO, itens 11–13 e 41–44 ocultos, item 45
sem a METHABIO); segunda correção no PR 71789, **sem homologação registrada**.

**Módulo/Rota:** Portal do Comprador (`/portal/p/1/portal-do-comprador`) → **Avaliação de Propostas** (`#/avaliacaoPropostas`) →
abrir a cotação → **Definir Vencedor** (rota `#/propostaVencedora`; coluna "Definir Vencedor", tooltip "Defina a Quantidade").

**Pré-condições**
- Login com matrícula de comprador resolvida no ERP (`SY1`) — a conta de QA não tem.
- Uma cotação vinculada a SC com **mais de 100 itens**, todos com proposta de ao menos um fornecedor, na etapa de escolha do vencedor.
- Integração `genericQuery` (`getEvalQuotesDhuERP`) respondendo — hoje 404.
- **Bloqueio:** conta de QA sem matrícula de comprador + `genericQuery` 404 (ambiente) + massa de >100 itens inexistente para
  esta conta. Caso de Fluig com bloqueio declarado.

**Passos**
1. Abrir **Avaliação de Propostas**, localizar a cotação da SC de >100 itens e abri-la.
2. Contar os itens exibidos na grade de itens da cotação e comparar com o total de itens da SC (aba de itens da SC no Fluig ou
   Tracker → *Produtos/Rateio SC*).
3. Para cada item, expandir os fornecedores e confirmar que cada proposta recebida aparece (colunas *Val. Unit. Cotado*, *Val.
   Frete*, *Val. Total Item*).
4. Rolar/paginar até o último item (se houver "Carregar mais resultados", acionar até esgotar).
5. Conferir especificamente os itens de fronteira: 100, 101, o último, e itens no meio da lista (o defeito residual era esparso).

**Resultado esperado**
- Quantidade de itens exibidos = quantidade de itens da SC.
- Cada item lista todas as propostas dos fornecedores que cotaram; nenhum fornecedor vencedor "some" de um item.
- Nenhum item aparece sem proposta quando o ERP tem proposta para ele.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Blocos de itens ausentes (0007–0012…) ou ausências esparsas (itens 11–13, 41–44; item 10 sem a proposta vencedora) — o comprador
  decide sobre um subconjunto.

**Severidade:** Alta

**Preparação de massa:** SC com >100 itens cotada por ≥2 fornecedores (exige credencial de fornecedor ou massa Protheus) e
comprador com matrícula. Não criar para forçar.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **visto renderizado** — `#/avaliacaoPropostas` e `#/propostaVencedora` abrem com a grade, botões
*Filtrar*, *Gerenciador de colunas*, *Carregar mais resultados* e campo *Pesquisar*, mas com "Nenhum dado encontrado"; console:
"Comprador não encontrado" e `getEvalQuotesDhuERP - Erro ao buscar cotações: Erro HTTP: 404`. **Lido no fonte publicado** —
`getQuotesDhuERP` usa `limit: e.limit ? e.limit : 100` e `page` (paginação de 100 na listagem de cotações); a consulta de itens
(`SC8010 SC8 JOIN SC1010 SC1`) traz `C8_ITEM, C8_PRODUTO, C8_NUMPRO, C8_PRECO, C8_TOTAL, C8_XVENC, C8_XQTAUDI, C8_XPARTEC…`; a
grade tem a coluna "Definir Vencedor" e a validação "A quantidade para a proposta da cotação deve ser informada!". Nada com
>100 itens foi exercitado.
**Divergências encontradas:** o ticket chama a etapa de "Análise de Cotação"; na tela são **Avaliação de Propostas** e **Definir
Vencedor**. Nenhuma outra.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-5016  (ambos · Em Homologação · SDCASSI-513)

**Título:** SC barrada por falta de saldo volta a gerar a alçada no Portal do Comprador depois que o saldo é reposto, sem ficar congelada em *Aguarda Geração Alçadas*

**Origem:** FSWTBC-5016 — SC 96291: bloqueada por falta de saldo, o status não atualizou no Portal do Comprador após o saldo ser
colocado, e a alçada não foi gerada. O defeito não foi reproduzido pela fábrica ("nenhum teste caiu no erro") e está **em
homologação desde 30/07 sem correção identificada**.

**Módulo/Rota:** Portal do Comprador → **Avaliação de Propostas** (colunas *Parecer Téc.*, **Em Alçada** = `C8_XALCADA`);
`wf_solicitacao_compras` → **Aguarda Geração Alçadas** (309) → gateway *Alçada foi Gerada?* → *Gerar Grid de Alçada* (310) →
*Aprovação de Alçadas* (94); widget **Logs Protheus → Solicitacoes ZZY** (`Qtd T.Env Fl`).

**Pré-condições**
- SC com vencedor definido cuja conta orçamentária esteja **sem saldo** no momento da geração da alçada; depois, saldo reposto no PCO.
- Login de comprador com matrícula (a conta de QA não tem).
- **Bloqueio:** saldo orçamentário é preparado só no Protheus (sem credencial); conta sem comprador; `genericQuery` 404. O efeito
  é observável no Fluig (Histórico da SC em 309 e coluna *Em Alçada*), portanto caso de Fluig com bloqueio de massa.

**Passos**
1. Com a SC em *Aguarda Geração Alçadas* (Histórico: "Integração com ERP movimentou … para a atividade Aguarda Geração Alçadas"),
   confirmar no Histórico a razão do bloqueio (retorno do ERP sobre saldo) e, em **Logs Protheus → Solicitacoes ZZY**, o registro
   da SC com `Qtd T.Env Fl`.
2. Pedir ao time Protheus a reposição do saldo na conta.
3. Aguardar o próximo ciclo da fila ZZY (SLA da 309 medido hoje: prazo de 1 dia; saída normal em minutos — 112855: 15:14 → 15:26).
4. No Histórico, verificar "Administrador Cassi movimentou a atividade Aguarda Geração Alçadas para a atividade Alçada foi
   Gerada?" → "Decisão tomada conforme condição 2" → *Gerar Grid de Alçada* → *Aprovação de Alçadas*.
5. Em **Avaliação de Propostas**, conferir que a cotação passa a exibir **Em Alçada = Sim**.

**Resultado esperado**
- Após a reposição do saldo, a fila reprocessa a SC sem intervenção manual e a alçada é gerada (Histórico com 309 → 310 → 94).
- O Portal do Comprador reflete o novo estado (*Em Alçada = Sim*, `numDocAlcada` preenchido no formulário).
- A SC não permanece em 309 com `slaStatus = EXPIRED` depois que a condição foi resolvida.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC congelada em *Aguarda Geração Alçadas* e Portal do Comprador com status antigo, mesmo com saldo reposto — só destrava com
  intervenção manual.

**Severidade:** Alta

**Preparação de massa:** SC com vencedor definido + conta orçamentária sem saldo e depois com saldo — só o time Protheus prepara.
Não criar para forçar. Para observar o sintoma, usar as instâncias vivas em 309.

**Verificado em tela:** PARCIAL
**O que foi verificado:** (a) **agregado por dado** — 309 = "Aguarda Geração Alçadas": 95 movimentos, 80 instâncias, **3 ativas
hoje**, todas `EXPIRED` e atribuídas a `admin`: **112593** (desde 26/08 01:51, prazo 26/08 18:00), **108618** (desde 10/08),
**107681** (desde 07/08); (b) **visto renderizado** — Histórico da 112593: "Atividade atual: Aguarda Geração Alçadas (Em
progresso) · Responsável: Administrador Cassi | Prazo: Desde 26/08/2026 18:00:00" e, antes, "Alçada foi Gerada? … Decisão tomada
conforme condição 1" (a condição de "não gerada", que devolve à 309); formulário com `docAlcadaGerada = Não`, `numDocAlcada`
vazio; (c) a SC **96291** do ticket existe no Fluig só até a seq. 7 (3 tasks em 08/05/2026) — o número do ticket é a SC do ERP,
não a instância; (d) Portal do Comprador `#/avaliacaoPropostas` abre a grade (coluna *Em Alçada* **lida no fonte publicado**,
`C8_XALCADA` com Sim/Não), vazia por "Comprador não encontrado"/404; (e) Logs Protheus ZZY indisponível (404 no `genericQuery`).
A reposição de saldo não foi exercitada.
**Divergências encontradas:** o sintoma que o ticket descreve (SC presa em geração de alçada, status congelado) está **vivo em três
instâncias hoje**, 13 a 32 dias paradas — coerente com o ticket seguir sem correção. O ticket não nomeia a atividade; na tela é
**Aguarda Geração Alçadas** (309). Este caso é candidato à lista de "reprova hoje", mas a causa das três instâncias (saldo ou
parecer) não é legível pelo Fluig: o campo *Retorno Integração* está vazio na 112593 e o log ZZY está indisponível.
**Dados/massa usados:** leitura de 112593, 108618, 107681, 96291 — nenhum — não submetido.

---

## CT-FSWTBC-5028  (fluig · Concluído · SDCASSI-515)

**Título:** Abrir uma solicitação vinculada a um contrato e confirmar que o valor vigente do contrato chega à tela, em vez de a SC herdar só o número do contrato.

**Origem:** FSWTBC-5028 / SDCASSI-515 — o campo de preço estimado não apresentava o valor vigente do contrato ao gerar uma solicitação vinculada a ele. Faz par com o SDCASSI-502 (a alçada não somava o valor do contrato no aditivo): o vínculo SC↔contrato transportava a referência, mas não os valores. Testado na solicitação 99909, homologado 10/08/2026.

**Módulo/Rota:** Portal do Comprador › **Validação Inicial** (`/portal/p/1/portal-do-comprador#/validacaoInicial`) → ação de aprovação → **Tipo de Compra = Contrato**, **Tipo de Solicitação**, **Nº do Contrato** (consulta de contratos). Efeito no formulário `wf_solicitacao_compras`: campos **"Valor Vigente do Contrato (R$)"** (`authorityVlrContratoOriginal`) e **"Valor Total com Aditivo (Contrato + SC) (R$)"** (`authorityVlrTotalComAditivo`), visíveis na etapa **94 - Aprovação de Alçadas**.

**Pré-condições**
- Um contrato **vigente** na base, com `CN9_VLATU` (valor atual) diferente de zero e conhecido de antemão.
- Uma SC em **Validação Inicial** que o executor possa aprovar como comprador.
- Protheus respondendo — a consulta de contratos é `genericQuery` sobre a tabela `CN9`.
- **Bloqueio:** a conta de QA **não resolve matrícula de comprador** (`Comprador não encontrado.` no console), então a ação de aprovação da Validação Inicial não é exercitável por este login. Além disso não há credencial de aprovador de alçada para chegar à etapa 94, onde os campos de valor do contrato aparecem.

**Passos**
1. Abrir **Portal do Comprador › Validação Inicial** e selecionar uma solicitação.
2. Acionar **Aprovar** e, no formulário de aprovação, marcar **Tipo de Compra = Contrato**.
3. Confirmar que os campos **Tipo de Solicitação** e **Nº do Contrato** passam a ser exibidos.
4. Clicar no campo **Nº do Contrato** para abrir a **consulta de contratos** e anotar, na coluna **"Valor Atual"**, o valor do contrato escolhido. Clicar em **Selecionar**.
5. Concluir a validação e acompanhar a SC até a etapa **94 - Aprovação de Alçadas**.
6. Abrir o formulário da SC e ler os campos **"Valor Vigente do Contrato (R$)"** e **"Valor Total com Aditivo (Contrato + SC) (R$)"**.
7. Ler também, no item, os campos **"Preço Unit. Estimado"** e **"Vlr. Total Estimado"**.

**Resultado esperado**
- A consulta de contratos exibe a coluna **"Valor Atual"** preenchida (origem: `CN9_VLATU`), formatada em real brasileiro.
- O campo **"Valor Vigente do Contrato (R$)"** da SC traz **exatamente** o valor lido no passo 4 — não zero, não em branco.
- **"Valor Total com Aditivo (Contrato + SC) (R$)"** é maior que o valor vigente do contrato sempre que a SC tiver valor, e é ele — não o valor da SC isolado — que determina a faixa de alçada.
- Os dois campos aparecem formatados como moeda (separador de milhar e duas casas), pela mesma rotina dos demais valores de alçada.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O valor vigente do contrato **não** chegava à tela: a SC exibia apenas o número do contrato, e o valor estimado ficava com a estimativa manual do demandante, sem relação com o contrato. Efeito gêmeo no SDCASSI-502: a alçada era calculada **sem** somar o valor do contrato, aprovando aditivo em faixa inferior à devida.

**Severidade:** Alta *(risco de alçada — o nível de aprovação de um aditivo depende do valor total; subestimá-lo faz o aditivo ser aprovado por quem não teria competência)*

**Preparação de massa:** um contrato vigente com valor atual conhecido e não-zero, mais uma SC em Validação Inicial passível de aprovação. Precisa ser preparada por alguém com **matrícula de comprador no ERP** — a conta de QA não serve. Para exercitar o efeito na alçada, é preciso ainda um aprovador de alçada.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **LIDO NO FONTE PUBLICADO (bundle do Portal do Comprador)** — o serviço de contratos executa `restCallGenericQuery` sobre `tables:"CN9"` pedindo os campos `CN9_FILIAL, CN9_NUMERO, CN9_REVISA, CN9_TPCTO, CN9_DESCRI, CN9_DTINIC, CN9_DTFIM, **CN9_VLATU**, CN9_SITUAC, CN9_XCODFO, CN9_XLOJAF`, com `where: D_E_L_E_T_!='*' AND CN9_SITUAC IN(01,05,06,07,08)`. A grade da consulta declara as colunas `{CN9_NUMERO:"Nº Contrato"}, {CN9_REVISA:"Revisão"}, {CN9_TPCTO:"Tipo"}, {CN9_DESCRI:"Descrição"}, {CN9_DTINIC:"Início"}, {CN9_DTFIM:"Fim"}, **{CN9_VLATU:"Valor Atual"}**, {CN9_XCODFO:"Fornecedor"}`, com ação primária **"Selecionar"**, e o valor é renderizado por `hanbleFormatMoneyBRL(+CN9_VLATU)`. **LIDO NO HTML DA SC** — existem os campos `authorityVlrContratoOriginal` (rótulo **"Valor Vigente do Contrato (R$)"**) e `authorityVlrTotalComAditivo` (rótulo **"Valor Total com Aditivo (Contrato + SC) (R$)"**), ambos tratados por `handleMoneyValidAuthority` com o comentário `//COMMENT NOTE: ** Campos do Aditivo Contratual — mesma formatação R$ dos demais valores de alçada **`.
**Divergências encontradas:** **três.** (a) **Não existe campo chamado "Preço Estimado".** Os rótulos publicados são **"Preço Unit. Estimado"** (`tbprod_precoUnitario`, obrigatório, editável) e **"Vlr. Total Estimado"** (`tbprod_valorTotal`, obrigatório, **readonly**, calculado como quantidade × preço unitário). O caso precisa citar esses dois, não o do ticket. (b) A análise do ticket **supunha** que o campo lido seria `CN9_VLATU` — **está confirmado no fonte publicado**; deixa de ser hipótese. (c) **Não encontrei, no fonte do front-end, nenhum trecho que escreva `CN9_VLATU` dentro de `tbprod_precoUnitario`.** O valor do contrato desemboca nos campos **de alçada** (`authorityVlrContratoOriginal` / `authorityVlrTotalComAditivo`), não no preço estimado do item. Se a expectativa do cliente for ver o valor do contrato no *item*, isso hoje **não** acontece pelo front-end — é ponto a confirmar com o time antes de dar o caso por aprovado.
**Dados/massa usados:** nenhum — não submetido. Consulta de contratos não foi aberta em tela (exigiria a ação de aprovação).

---

## CT-FSWTBC-5031  (fluig · Concluído · SDCASSI-516)

**Título:** Vincular um contrato a uma solicitação de compra no Portal do Comprador e confirmar que o vínculo é exigido, trava o fornecedor e ativa a dispensa de cotação.

**Origem:** FSWTBC-5031 / SDCASSI-516 — não havia forma de vincular um contrato a uma SC já aberta nem durante a criação. O motivo é de **auditoria**, registrado pelo próprio cliente: *"o principal ponto de atenção da auditoria é garantir a rastreabilidade dos contratos vigentes e vincendos, assegurando a identificação de quais contratos já possuem Solicitação de Compra aberta"*. O desenho final (19/08, acordado em reunião) previu, no Portal do Comprador: campos **Tipo de Solicitação**, **Número Contrato** e **Revisão Contrato**, exibidos condicionalmente; consulta a todos os contratos; **bloqueio da seleção de fornecedor** com marcação do fornecedor principal do contrato (CN9); e **ativação da dispensa de cotação**. Concluído 28/08/2026.

**Módulo/Rota:** **Portal do Comprador › Validação Inicial** (`/portal/p/1/portal-do-comprador#/validacaoInicial`) → selecionar solicitação → **Aprovar** → formulário de aprovação.

**Pré-condições**
- Login com **matrícula de comprador** resolvida no ERP.
- Ao menos uma solicitação listada em Validação Inicial.
- Contratos disponíveis na consulta (`CN9_SITUAC` em 01, 05, 06, 07 ou 08).
- **Bloqueio:** a conta de QA **não resolve matrícula de comprador** — o console registra `Comprador não encontrado.` ao abrir o Portal. A ação **Aprovar** não é exercitável por este login, e portanto o formulário de aprovação (onde vivem todos os campos deste caso) não pôde ser aberto.

**Passos**
1. Abrir **Portal do Comprador › Validação Inicial**. Confirmar a grade e as colunas.
2. Selecionar uma solicitação e acionar **Aprovar**.
3. Deixar **Tipo de Compra** vazio e tentar processar. Ler a crítica.
4. Escolher **Tipo de Compra = Pedido**. Observar se os campos de contrato aparecem.
5. Trocar para **Tipo de Compra = Contrato**. Observar de novo.
6. Com Tipo de Compra = Contrato e **Tipo de Solicitação** vazio, tentar processar. Ler a crítica.
7. Escolher **Tipo de Solicitação = Aditivo Contratual** e tentar processar **sem** informar contrato. Ler a crítica.
8. Clicar no campo **"Nº do Contrato"** para abrir a **consulta de contratos**; conferir as colunas, filtrar por número e clicar em **Selecionar**.
9. Observar o que acontece com a **seleção de fornecedores** e com a flag de **dispensa de cotação** e sua justificativa.
10. Voltar **Tipo de Solicitação** para **Nova Contratação** e observar se a exigência de contrato, a trava de fornecedor e a dispensa mudam de comportamento.
11. **Não** concluir a aprovação: sair sem processar.

**Resultado esperado**
- Sem tipo de compra: **"É necessário informar o tipo de compra."**
- Com **Tipo de Compra = Pedido**, os campos de contrato **não** são exibidos — o vínculo é exclusivo de compra do tipo Contrato.
- Com **Tipo de Compra = Contrato** e sem tipo de solicitação: **"É necessário informar o tipo de solicitação para compras do tipo Contrato."**
- Em **Aditivo Contratual** sem contrato: **"É necessário selecionar o contrato para Nova Contratação ou Aditivo Contratual."**; e se o contrato tiver sido digitado sem passar pela consulta: **"É necessário selecionar o contrato pela consulta de contratos."**
- A consulta de contratos abre com as colunas **Nº Contrato, Revisão, Tipo, Descrição, Início, Fim, Valor Atual, Fornecedor** e ação **Selecionar**.
- Selecionado o contrato em **Aditivo Contratual**: a **seleção de fornecedores fica bloqueada** e pré-marcada com o fornecedor principal do contrato (`CN9_XCODFO - CN9_XLOJAF`), e a **dispensa de cotação é ligada** com a justificativa preenchida automaticamente.
- Ao **aprovar**, os campos `tipoSolicitacao`, `nrContrato`, `revisaContrato`, `cgcFornecedorContrato` e `nomFornecedorContrato` são gravados no formulário da SC — é o que sustenta a rastreabilidade pedida pela auditoria.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- **Nenhum** campo de contrato no formulário de aprovação: não havia como vincular contrato a uma SC nem na abertura nem depois, e não havia como saber quais contratos já tinham SC aberta.

**Severidade:** Alta *(é requisito de auditoria declarado pelo cliente — a rastreabilidade contrato↔SC — e, na ponta, define fornecedor e dispensa de cotação)*

**Preparação de massa:** uma solicitação em Validação Inicial + contratos vigentes na CN9, e um login de **comprador com matrícula no ERP**. Nada disso é criável pela conta de QA. **Dependência declarada no ticket:** o *encerramento de SC por medição de contrato* foi transferido para a demanda **DEM10013730** e **não faz parte** deste caso.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **VISTO RENDERIZADO** — a rota `#/validacaoInicial` carregou **24 solicitações**, com as colunas **Nº Solic · Solicitante · Data Solicitação · Cod. Filial · Filial · Data Emissão · Nº Solic ERP · Justificativa · Etapa · Status**, filtros **Filial, Produto, Grupo de Produto, Centro de Custo, Justificativa, Somente Minha Responsabilidade** e botões **Buscar** e **Centralizar Solicitações**. O formulário de aprovação **não** foi aberto (bloqueio acima). **LIDO NO FONTE PUBLICADO (bundle do Portal)** — todos os rótulos e críticas citados no resultado esperado são texto literal do bundle: `p-label:"Tipo de Compra"`, `p-label:"Tipo de Solicitação"` com `tipoSolicitacaoOptions=[Selecione.., Nova Contratação, Aditivo Contratual]`, `p-label:"Nº do Contrato"` (`formControlName:"nrContrato"`, `p-placeholder:"Selecione o contrato"`, **`p-disabled:"true"`** — só se preenche pela consulta), e as quatro mensagens de validação. Os getters `bloqueioFornecedores` e `bloqueioDispensaCotacao` são ambos `contratoTravado && tipoSolicitacao === "Aditivo Contratual"`. `reaplicaDispensaContrato()` liga `swDispensaCotacao` e monta a justificativa `Processo conduzido por dispensa de Cotação para {tipoSolicitacao} do Contrato Nº {nrContrato} para o fornecedor {cod/loja}`. A justificativa padrão de dispensa (sem contrato) é literalmente `Processo conduzido por dispensa de Cotação de acordo com o Normativo NR 10.0001, item 71, alínea "A". Alçada Decisória - Item 5.1 do Manual de Competências e Alçadas. - Divisão de Compras e Contratações - Gerente de Equipe (até R$ 20.000,00).`. Se o contrato não for localizado no ERP, o código avisa `Contrato {n} não localizado no ERP; fornecedor do contrato não pôde ser pré-selecionado.`
**Divergências encontradas:** **quatro, e a primeira vale como o achado do caso.**
 (a) **A regra só é avaliada com `Tipo de Compra = Contrato` (`"2"`) e fora de solicitação centralizada.** Todo o bloco de validação está sob `tipoCompra === "2" && !solicitacaoCentralizada`, e o payload só carrega os campos de contrato sob `aprovado && tipoCompra === "2" && tipoSolicitacao`. **Quem testar com Tipo de Compra = Pedido, ou numa solicitação centralizada, não verá campo nem crítica nenhuma** e concluirá que a funcionalidade não existe. É o caminho errado, não a ausência da regra.
 (b) **A crítica mente sobre o próprio gatilho.** A mensagem **"É necessário selecionar o contrato para Nova Contratação ou Aditivo Contratual."** está **dentro** do bloco `if (tipoSolicitacao === "Aditivo Contratual")`. Ou seja: em **Nova Contratação o contrato NÃO é exigido**, apesar de a mensagem afirmar que é. O desenho de 17/08 registrado no ticket dizia que o campo seria **obrigatório para renovação ou aditivo** — a implementação obriga **só em aditivo**. Divergência real entre regra acordada e código publicado.
 (c) Mesma coisa para a **trava de fornecedor** e a **dispensa de cotação**: os dois getters exigem `tipoSolicitacao === "Aditivo Contratual"`. Em **Nova Contratação** o fornecedor **não** é travado e a dispensa **não** é reaplicada, embora o desenho previsse o comportamento para renovação/aditivo.
 (d) **Rótulos.** O ticket diz "Número Contrato" e "Revisão Contrato"; na tela o campo é **"Nº do Contrato"**, e **`revisaContrato` não tem rótulo visível** no Portal — é derivado do contrato escolhido na consulta e viaja escondido no payload. E, como já anotado no CT-FSWTBC-5030, **"Renovação" não existe como opção**.
**Dados/massa usados:** nenhum — não submetido, nenhuma solicitação aprovada ou reprovada.

---

## CT-FSWTBC-5033  (fluig · Concluído · SDCASSI-518)

**Título:** Abrir um Aditivo Contratual sobre o contrato 00067-2023-5303 e confirmar que a tela abre, em vez de falhar para esse registro.

**Origem:** FSWTBC-5033 / SDCASSI-518 — erro ao abrir Aditivo Contratual para o contrato **00067-2023-5303**, impedindo o acesso ao processo de aditivo. Falha específica daquele registro, o que sugere condição de dado (nº de itens, planilha, revisão ou característica do fornecedor). Corrigido e testado na solicitação 99903, homologado 10/08/2026. **Sem causa raiz registrada** — o que impede saber se outros contratos com a mesma característica seguem afetados.

**Módulo/Rota:** **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) para localizar o registro; **Portal do Comprador › Validação Inicial › Aprovar › Tipo de Compra = Contrato › Tipo de Solicitação = Aditivo Contratual › Nº do Contrato** para abrir o aditivo.

**Pré-condições**
- O contrato **00067-2023-5303** presente e consultável.
- Login com matrícula de comprador.
- Protheus respondendo (a consulta de contratos é `genericQuery` sobre a CN9).
- **Bloqueio:** a abertura do aditivo depende da ação **Aprovar** da Validação Inicial, indisponível para a conta de QA (matrícula de comprador não resolve). A **localização e leitura** do contrato, essa sim, foi feita.

**Passos**
1. Abrir **Acompanhamento de Contratos** e filtrar por `00067`. Anotar a linha completa.
2. Abrir **Portal do Comprador › Validação Inicial**, selecionar uma solicitação e acionar **Aprovar**.
3. Marcar **Tipo de Compra = Contrato** e **Tipo de Solicitação = Aditivo Contratual**.
4. Abrir a **consulta de contratos**, filtrar por `00067` e selecionar **00067-2023-5303**, revisão **001**.
5. Observar se a tela conclui a seleção sem erro: fornecedor pré-selecionado, dispensa de cotação ligada, justificativa montada.
6. Repetir com **outro** contrato do mesmo **Tipo 043 - MAO DE OBRA TEMPORARIA**, para checar se a característica se repete.
7. Sair sem processar.

**Resultado esperado**
- O contrato **00067-2023-5303** é listado na consulta e pode ser **selecionado sem erro**.
- Após a seleção, o fornecedor do contrato (`CN9_XCODFO - CN9_XLOJAF` = **11749530 - 0001**) é pré-marcado e a seleção de fornecedores fica bloqueada.
- A dispensa de cotação é ligada e a justificativa exibe o número do contrato e o fornecedor.
- Nenhum erro de console e nenhuma requisição com status ≥ 400 durante a seleção.
- O mesmo vale para outro contrato do tipo 043 — a correção não pode ter sido pontual para um número.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- **Erro ao abrir o Aditivo Contratual** para esse contrato, impedindo o acesso ao processo. O ticket não registra a mensagem exata: `<não documentado>`.

**Severidade:** Média *(bloqueia o fluxo de aditivo para o contrato afetado; não há risco de valor errado, mas sem causa raiz registrada não se sabe o alcance)*

**Preparação de massa:** o contrato 00067-2023-5303 **já existe na base** (ver abaixo) e não precisa ser criado. Falta apenas uma solicitação em Validação Inicial e um login de comprador com matrícula no ERP. Para o passo 6, levantar previamente outros contratos de tipo **043 - MAO DE OBRA TEMPORARIA**.

**Verificado em tela:** PARCIAL
**O que foi verificado:** **VISTO RENDERIZADO** — abri **Acompanhamento de Contratos**, que carregou **845 linhas** com as colunas **Filial · Tipo Contrato · Contrato · Data Início · Data Fim · Nº Revisão · Status · Fornecedor · Ação**, e localizei o registro do ticket, com estes valores exatos: `5303 | 043 - MAO DE OBRA TEMPORARIA | **00067-2023-5303** | 02/06/2023 | **31/07/2026** | 001 | **Vigente** | 11749530 - 0001`. **LIDO NO FONTE PUBLICADO** — a consulta de contratos do Portal filtra apenas por `D_E_L_E_T_!='*' AND CN9_SITUAC IN(01,05,06,07,08)`, com filtro opcional `CN9_NUMERO LIKE '{termo}%'` restrito ao padrão `^[a-zA-Z0-9#-]+$`; **não há filtro por data de vigência**.
**Divergências encontradas:** **uma, encontrada ao verificar e que muda o teste.** O contrato 00067-2023-5303 tem **Data Fim 31/07/2026** — que **já passou** (hoje é 04/09/2026) — e mesmo assim o **Status continua "Vigente"** no Acompanhamento de Contratos, e ele **continua elegível** na consulta do Portal, porque o filtro olha só `CN9_SITUAC`, nunca `CN9_DTFIM`. Consequência prática: **executar este caso hoje sobre esse contrato exercita o caminho de contrato com vigência encerrada**, que não é o cenário original do ticket. Ou se escolhe um contrato com Data Fim futura, ou se assume conscientemente o cenário vencido. Pergunta que fica para o time e que este lote não resolve: **aditivo sobre contrato com vigência encerrada deveria ser permitido?**
**Dados/massa usados:** nenhum — apenas leitura da grade de Acompanhamento de Contratos. Nenhum contrato foi aberto, alterado ou selecionado.

---

## CT-FSWTBC-5057  (fluig · Concluído)

**Título:** Definir o vencedor de uma cotação no Portal do Comprador e confirmar as travas que a regra aplica antes de gravar.

**Origem:** FSWTBC-5057 — **o ticket traz apenas o título**, "Ajuste na Regra de identificação do vencedor", sem descrição, sem passo a passo e sem evidência. É um dos três ajustes (5057/5058/5059) feitos em 30/07/2026 para fechar o caso do e-mail duplicado ao fornecedor (FSWTBC-4908). Por isso este é um caso de **caracterização de caminho** (§5-D do briefing): percorre a funcionalidade citada no título e afirma o comportamento **observável hoje**, lido no fonte publicado.

**Módulo/Rota:** **Portal do Comprador › Definir Vencedor Cotação** (`/portal/p/1/portal-do-comprador#/propostaVencedora`; no menu, o item tem o ícone de coroa).

**Pré-condições**
- Uma cotação com propostas de **mais de um fornecedor** para o mesmo item, e outra com **um fornecedor só**, para separar o comportamento de auditoria.
- Login com **matrícula de comprador** resolvida no ERP.
- Protheus respondendo — a tela é alimentada por `genericQuery` sobre a cotação.
- **Bloqueio:** **dois.** (1) a conta de QA não resolve matrícula de comprador; (2) o `genericQuery` do Portal segue instável e deixa *Definir Vencedor Cotação* sem dados (**é ambiente, não defeito**, §5-B do briefing).

**Passos**
1. Abrir **Portal do Comprador › Definir Vencedor Cotação**.
2. Selecionar uma cotação e listar as propostas por item.
3. Sem marcar **nenhum** vencedor, acionar o processamento. Ler a mensagem.
4. Marcar um vencedor e **deixar a quantidade zerada**. Processar. Ler a mensagem.
5. Preencher a quantidade e processar. Ler a mensagem de conclusão.
6. Numa cotação com **dois fornecedores vencedores no mesmo item**, repetir e observar se o processo é marcado para auditoria.
7. Numa cotação cuja SC de origem seja de **Aditivo Contratual**, repetir e conferir que o contrato original e a revisão acompanham o envio.
8. Conferir, no **Histórico** da solicitação, que o processo avançou para a geração da grade de alçadas.

**Resultado esperado**
- Sem vencedor marcado: **"Nenhum vencedor encontrado para processar."**
- Vencedor marcado com quantidade zerada ou negativa: **"Existem vencedores selecionados sem quantidade informada para processar."** — e **nada é gravado**.
- Se a cotação não estiver vinculada a um processo Fluig: **"Processo de compra não encontrado. Verifique o vínculo da cotação com o processo Fluig."**
- Com tudo preenchido: **"A cotação foi atualizada com os vencedores!"**; em falha do ERP: **"Ocorreu uma falha na atualização do vencedor!"**
- **Mais de um vencedor no mesmo item marca o envio para auditoria**; um único vencedor, não.
- Quando a SC de origem for **Aditivo Contratual**, o envio carrega o **contrato original** e a **revisão de origem**; quando não for, esses dados não vão.
- A solicitação avança para a etapa de **geração da grade de alçadas**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `<não documentado>` — o ticket não descreve o sintoma. O contexto (fechamento do FSWTBC-4908, e-mail duplicado ao fornecedor) sugere que a identificação errada do vencedor gerava notificação a fornecedor indevido, mas isso **não** está escrito no ticket e **não** deve ser afirmado como se estivesse.

**Severidade:** Alta *(define qual fornecedor é contratado e com que quantidade; erro aqui vira pedido/contrato errado e notificação a fornecedor indevido)*

**Preparação de massa:** uma cotação com propostas de **três fornecedores**, sendo **dois** marcáveis como vencedores no mesmo item (para o passo 6), e uma segunda cotação originada de SC de **Aditivo Contratual** (para o passo 7). Exige comprador com matrícula no ERP e o Protheus de pé. **Nada disso é preparável pela conta de QA.**

**Verificado em tela:** PARCIAL
**O que foi verificado:** **VISTO RENDERIZADO** — o item **"Definir Vencedor Cotação"** existe no *Acesso Rápido* e no menu do Portal do Comprador, e a rota é `#/propostaVencedora`. A tela **não** exibiu dados (bloqueio de ambiente acima). **LIDO NO FONTE PUBLICADO (bundle do Portal)** — a regra está toda em `sendWinningProposals`, e as quatro mensagens acima são texto literal dela. As travas, na ordem em que o código as avalia: (1) lista vazia → aborta; (2) **qualquer fornecedor com `C8_XVENC` marcado e `C8_XQTAUDI <= 0`** → aborta; (3) `getProcessIdPurchase` sem retorno → aborta. Depois monta o payload com `additive = (tipoSolicitacao === "Aditivo Contratual")` e, quando `additive`, acrescenta `originalContract = nrContrato` e `sourceReview = revisaContrato`; `audit` é ligado quando o item tem **mais de um** fornecedor com `C8_XVENC`; quando o tipo de documento é contrato, monta a lista de contratos com `cn9_tpcto:"999"`. O envio é `POST .../api/v2/fluig/compras/cotacao/gravaVencedor/{nºCotação}-{aaaammdd_hhmmss}` com destino ao gateway de **alçada gerada**.
**Divergências encontradas:** **duas, ambas achadas na leitura do código.** (a) **Há um fornecedor excluído por código fixo no fonte.** Antes de processar, o bundle executa `findIndex(lista, {C8_FORNECE:"85070508", C8_LOJA:"0001"})` e, se encontrar, **remove a linha** da lista. Ou seja, o fornecedor **85070508/0001 nunca pode ser marcado vencedor** por esta tela, e isso não está documentado em ticket nenhum deste lote. É regra de negócio embutida em constante — vale confirmar com o time se é intencional e, se for, documentar. (b) O ticket fala em "regra de identificação do **vencimento**" no corpo, mas o título diz "**vencedor**"; a funcionalidade publicada é **vencedor de cotação** (`C8_XVENC`), não vencimento de prazo. O corpo do ticket está errado.
**Dados/massa usados:** nenhum — não submetido, nenhuma cotação processada.

---

## CT-FSWTBC-5067  (ambos · Concluído · SDCASSI-522)

**Título:** Após a cotação retornar por rejeição, o comprador volta a conseguir emitir/verificar o parecer técnico das propostas no Portal do Comprador

**Origem:** FSWTBC-5067 — o Portal do Comprador não apresentava a opção "emitir parecer técnico" após uma cotação voltar por
rejeição: a marcação de parecer (`C8_XPARTEC`) era limpa, mas a permissão de emitir continuava bloqueada da rodada anterior; o
fornecedor padrão, retirado já na liberação da proposta, escapava da limpeza. Correções: a rejeição libera novamente a emissão
junto com a limpeza; o fornecedor padrão só é retirado na geração do pedido/contrato. Patch SDCASSI-522, PR 72278.

**Módulo/Rota:** Portal do Comprador → **Avaliação de Propostas** (`#/avaliacaoPropostas`) → cotação → botão **Verificar Parecer
Técnico** (ícone `an-hard-hat`) → modal **Selecionar Parecer Técnico** (abre a solicitação de Parecer Técnico em modo leitura);
coluna **Parecer Téc.** (Sim/Não, de `C8_XPARTEC`). Processo de Parecer Técnico: `wf_solicitacao_compras` → *Áreas Parecer
Técnico* (242) → *Emitir Parecer Técnico* (243) → *Aguarda Fim Parecer* (245), formulário 256832.

**Pré-condições**
- Login de comprador com matrícula no ERP.
- Uma cotação que já teve parecer técnico emitido e que foi **rejeitada** (retornou ao comprador), agora aguardando novo parecer.
- `genericQuery` respondendo.
- **Bloqueio:** conta de QA sem matrícula de comprador; `genericQuery` 404; massa "cotação rejeitada após parecer" exige fluxo com
  fornecedor e aprovador (credenciais indisponíveis). Caso de Fluig com bloqueio de massa/perfil.

**Passos**
1. Em **Avaliação de Propostas**, localizar a cotação rejeitada; ler a coluna **Parecer Téc.** (esperado **Não** após a limpeza).
2. Abrir a cotação e verificar que os botões *Aprovar*, *Negociar*, *Cancelar Proposta* e **Verificar Parecer Técnico** estão
   presentes e habilitados.
3. Clicar em **Verificar Parecer Técnico** → confirmar que abre a solicitação de Parecer Técnico (ou o modal "Selecionar Parecer
   Técnico" quando há mais de um processo) e **não** a mensagem "Não é possível prosseguir, pois a proposta ainda não está apta
   para execução desta ação."
4. Na solicitação de Parecer Técnico, emitir o parecer (perfil da área técnica) e voltar à cotação.
5. Confirmar **Parecer Téc. = Sim** e que o fluxo (Definir Vencedor → alçada) prossegue.
6. Conferir que o fornecedor padrão da cotação **ainda participa** da lista na rodada pós-rejeição (é retirado apenas na geração
   do pedido/contrato).

**Resultado esperado**
- A rejeição zera a marcação de parecer **e** libera a emissão: o botão funciona e a solicitação abre.
- Novo parecer registrado → *Parecer Téc. = Sim*; a geração de alçada não é recusada por "Cotação sem parecer Técnico.".
- Fornecedor padrão presente até a geração do pedido/contrato.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Coluna *Parecer Téc. = Não* e nenhuma forma de emitir: botão ausente/inerte ou mensagem de "não apta" — cotação em impasse.

**Severidade:** Alta

**Preparação de massa:** cotação com parecer emitido e depois rejeitada — exige comprador, área técnica e fornecedor (3 perfis).
Não criar para forçar.

**Verificado em tela:** PARCIAL
**O que foi verificado:** (a) **visto renderizado** — `#/avaliacaoPropostas` abre; a sonda encontrou o texto "Parecer" na página
(coluna *Parecer Téc.* no gerenciador de colunas), grade vazia por "Comprador não encontrado" + 404; (b) **lido no fonte
publicado** — botões `Aprovar` / `Negociar` / `Cancelar Proposta` / **`Verificar Parecer Técnico`** (`verifyTechnicalOpinion`),
mensagem de bloqueio "Não é possível prosseguir, pois a proposta ainda não está apta para execução desta ação.", modal
"Selecionar Parecer Técnico" listando `Processo Nº <n>` e abrindo `pageworkflowview?...taskLoadViewMode=true`; coluna
`parecerTec` = "S" se algum `C8_XPARTEC = S`; filtro de busca por `SC8.C8_XPARTEC`; (c) **agregado por dado** — 242 "Áreas
Parecer Técnico" (11 mov.), 243 "Emitir Parecer Técnico" (11), 245 "Aguarda Fim Parecer" (11, 1 ativa: 105351 desde 05/08);
(d) formulário de Parecer (256832) publicado com `btnVerRateioSC` e campos `matriculaRespParecer` / `matriculaValidParecer`;
(e) o dataset `dsProtheus_getParecerTecnico_restGetAll` (nome suposto) **não existe** — GET search devolve 500
`NullPointerException`, o que apenas confirma que o parecer é lido pela consulta `genericQuery` (`C8_XPARTEC`), não por dataset.
O fluxo de rejeição não foi exercitado.
**Divergências encontradas:** o ticket fala em opção "emitir parecer técnico"; na tela o botão é **Verificar Parecer Técnico**
(o parecer em si é emitido no processo *Emitir Parecer Técnico*, 243, não no Portal). O ticket não cita a mensagem de bloqueio;
a única existente no fonte é "…a proposta ainda não está apta para execução desta ação."
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-5106  (ambos · Em Homologação · SDCASSI-525)

**Título:** Definir Vencedor impede confirmar proposta com valor zerado, e os pedidos gerados após a alçada trazem cada item com o seu fornecedor vencedor e o frete

**Origem:** FSWTBC-5106 — SC 104258: após retorno da alçada, dos pedidos automáticos 009020–009023 três saíram inconsistentes
(CLORETO no pedido do ARCANJO, SERINGA no pedido da VAP) e frete de R$ 110,00 não transportado. Atribuído a "o comprador
selecionou proposta com valor zerado" (item 0020, produto 02001110, fornecedor 48903593, `quantityOrder 30, winner:true,
Proposal:'01'`) e orientada nova SC. A análise Protheus (FSWTBC-5115) **nunca foi iniciada**; a troca de itens e o frete perdido
seguem sem explicação. Em homologação desde 11/08.

**Módulo/Rota:** Portal do Comprador → **Definir Vencedor** (`#/propostaVencedora`; coluna *Definir Vencedor* → modal *Defina a
Quantidade*; botão de confirmação dos vencedores); `wf_solicitacao_compras` → *Aprovação de Alçadas* (94) → *Integração com ERP*
(287) → *Aguarda Geração do Pedido/Contrato* (323) → **Pedido/Contrato foi Gerado?**; formulário da SC: grade da empresa vencedora
(`tbForneceAlcadas`, colunas *Fornecedor*, **Nº Pedido\***, *Valor da Compras (R$)*); Tracker → *Aprovadores SC*.

**Pré-condições**
- Cotação com ≥2 fornecedores vencedores em itens distintos, um deles com frete informado (*Val. Frete*), e uma proposta com
  *Val. Unit. Cotado* = 0 disponível para o teste negativo.
- Comprador com matrícula; `genericQuery` respondendo.
- **Bloqueio:** conta de QA sem matrícula; `genericQuery` 404; a conferência item × fornecedor × frete de cada pedido (SC7) só é
  completa no Protheus (MATA121). No Fluig confere-se a validação do valor zerado e a coluna *Nº Pedido* por fornecedor — caso de
  Fluig com bloqueio de perfil/ambiente.

**Passos**
1. Em **Definir Vencedor**, marcar como vencedora uma proposta com *Val. Unit. Cotado* **0,00** e informar quantidade.
2. Confirmar os vencedores; observar a crítica.
3. Marcar vencedores válidos (fornecedor A para itens 1–2, fornecedor B para item 3 com frete) e confirmar.
4. Após a aprovação da alçada, abrir a SC em modo leitura → Histórico: "Pedido/Contrato foi Gerado?" com a condição de sucesso.
5. No formulário, ler a grade da empresa vencedora: um **Nº Pedido** por fornecedor, cada um diferente.
6. (Protheus, quando houver credencial) Em MATA121, abrir cada pedido e conferir itens e valor de frete.

**Resultado esperado**
- Proposta com valor zerado **não** pode ser confirmada como vencedora — o Portal bloqueia com mensagem explícita, como já faz
  para quantidade ("Existem vencedores selecionados sem quantidade informada para processar.").
- Um pedido por fornecedor vencedor, cada item no pedido do **seu** fornecedor; frete do fornecedor B transportado para o pedido dele.
- Nenhuma SC nova precisa ser aberta para corrigir pedidos.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Vencedor com valor zerado aceito; pedidos cruzados (item de A no pedido de B) e frete de R$ 110,00 ausente; orientação de abrir
  nova SC.

**Severidade:** Alta

**Preparação de massa:** cotação com dois fornecedores vencedores e frete, mais uma proposta zerada — exige credenciais de
fornecedor e comprador. Não criar para forçar.

**Verificado em tela:** PARCIAL
**O que foi verificado:** (a) **visto renderizado** — `#/propostaVencedora` abre a grade (vazia: "Comprador não encontrado" +
`getEvalQuotesDhuERP` 404); (b) **lido no fonte publicado** — `defineVencedor()` alterna `winner`/`C8_XVENC` e abre *Defina a
Quantidade*; ao confirmar, as únicas críticas são "Nenhum vencedor encontrado para processar.", "Existem vencedores selecionados
sem quantidade informada para processar." (`C8_XQTAUDI <= 0`) e "A quantidade para a proposta da cotação deve ser informada!";
**não existe crítica para `C8_PRECO`/`C8_TOTAL` = 0** — o payload enviado (`winner, Proposal: C8_NUMPRO, item, productcode,
supplier, store, quantityOrder: C8_XQTAUDI`) é exatamente o do ticket; o frete é somado por proposta (`C8_VALFRE`) e exibido em
*Val. Frete*; (c) via API, a **SC 104258** encerrou em 05/08 (87 → 185 → 339 → 115, fim) — o formulário não foi aberto; (d) grade
`tbForneceAlcadas` com **Nº Pedido\*** e *Valor da Compras (R$)* no HTML da SC.
**Divergências encontradas:** **a validação de valor zerado que o encerramento do ticket pressupõe não existe no Portal do
Comprador** (lido no fonte, 08/09): o comprador continua podendo confirmar proposta a R$ 0,00 — o passo 2 deste caso **reprova
hoje** por causa nunca corrigida (registrado na seção final). "Valor da Compras (R$)" (com erro de concordância) segue na grade.
**Dados/massa usados:** leitura de 104258 — nenhum — não submetido.

---

## CT-FSWTBC-5132  (fluig · Concluído · SDCASSI-533)

**Título:** Após um clone/refresh de base, confirmar que os artefatos da demanda em homologação continuam publicados e respondendo, antes de retomar os testes.

**Origem:** FSWTBC-5132 / SDCASSI-533 — depois do clone da base em 10/08 e da liberação da demanda em 11/08, a **demanda não estava disponível na base DES** para continuidade da homologação. Resolvido em um dia com "reaplicada a demanda na base DES". É sintoma recorrente e caro nesta conta: o **clone da base apaga os artefatos das demandas em homologação**, e a reaplicação depende de alguém perceber e pedir. Mesma família do FSWTBC-5029 (refresh de base invalidando o card de teste 99886), do SDCASSI-508 (RPO de produção com fonte defasado), do SDCASSI-521 (pacote gerado e não aplicado) e do SDCASSI-530 (versões incompatíveis convivendo). Concluído 14/08/2026.

**Módulo/Rota:** ambiente Fluig — publicação de artefatos. Superfícies de verificação acessíveis a um usuário comum: **Processos › Iniciar Solicitações**, o **formulário publicado** do processo, o **Portal do Comprador** e os **datasets** que ele consome.

**Pré-condições**
- Ter ocorrido um **clone / refresh** da base em questão, com data conhecida.
- Saber **quais** artefatos a demanda em homologação inclui (processo, formulário, widget, dataset) — sem essa lista o teste não tem alvo.
- **Bloqueio:** **dois.** (1) A base **DES** citada no ticket **não é a base acessível nesta rodada** — o que está disponível é `caixade182374`, a base de homologação/QA. O caso foi escrito para ser executado em qualquer base após um clone, mas **não foi executado na DES**. (2) A verificação definitiva (data de publicação e versão de cada artefato) fica em **Painel de Controle › Processos / Formulários**, que exige **perfil de administrador** — indisponível.

**Passos**
1. Registrar a data do clone e a lista de artefatos da demanda em homologação.
2. Abrir **Processos › Iniciar Solicitações** e confirmar que o processo da demanda está **listado**.
3. Abrir o formulário do processo e confirmar que ele **renderiza**, com os campos que a demanda introduziu presentes em tela.
4. Abrir o **Portal do Comprador** e confirmar que os quatro itens de *Acesso Rápido* carregam — **Validação Inicial**, **Controle De Cotações**, **Avaliação de Propostas** e **Definir Vencedor Cotação**.
5. Abrir **Validação Inicial** e confirmar que a grade **traz linhas** (dataset respondendo), não "Nenhum dado encontrado".
6. Abrir **Acompanhamento de Contratos** e confirmar que a grade traz linhas.
7. Conferir o console do navegador: nenhum erro de recurso **não encontrado** para os artefatos da demanda.
8. Só então retomar a execução dos casos de homologação.
9. Se algum artefato faltar, **abrir chamado de reaplicação antes de reportar qualquer defeito funcional** — sem isso, toda falha subsequente será atribuída ao código errado.

**Resultado esperado**
- O processo da demanda aparece em **Iniciar Solicitações** e o formulário renderiza com os campos novos.
- O Portal do Comprador carrega e suas telas trazem dados.
- O Acompanhamento de Contratos traz linhas.
- Nenhum erro de artefato ausente no console.
- Em caso de ausência, a conclusão registrada é **"artefato não reaplicado após clone"** — e **não** um defeito funcional.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- A demanda **não disponível** na base após o clone: o processo/formulário da homologação simplesmente não está lá, e a homologação para até alguém pedir a reaplicação manual.

**Severidade:** Média *(não corrompe dado, mas paralisa a homologação e — pior — faz falhas de ambiente serem reportadas como defeito de produto, custo que este lote inteiro atesta)*

**Preparação de massa:** nenhuma massa de negócio. Exige a **lista dos artefatos da demanda**, fornecida pelo time de desenvolvimento, e a data do clone. **Recomendação que decorre deste ticket e dos quatro irmãos citados na origem:** transformar os passos 2–7 em um **checklist fixo de pós-clone**, executado automaticamente antes de liberar a base para homologação. Hoje a reaplicação depende de alguém perceber, e essa dependência já custou tempo em pelo menos cinco chamados desta base.

**Verificado em tela:** PARCIAL
**O que foi verificado:** executei os passos 4, 5, 6 e 7 **na base acessível** (`caixade182374`), como demonstração de que o checklist é executável por um usuário comum, e o resultado foi: **Portal do Comprador** abre (título *"Cassi - Fluig Plataforma - Portal do Comprador"*) com o *Acesso Rápido*; **Validação Inicial** trouxe **24 linhas**; **Acompanhamento de Contratos** trouxe **845 linhas**; **Central de Tarefas** trouxe **10 tarefas**; e os artefatos servidos responderam — o bundle `/wg_portalCompradores/resources/js/App/Scripts/browser/main.js` retornou **HTTP 200 com 844.689 bytes**, e o formulário do `wf_solicitacao_compras` foi servido completo. Ou seja, **nesta base, hoje, os artefatos estão publicados**. Erros de console observados e que **não** indicam artefato ausente: `404` em `/style-guide/css/fluig-style-guide.min.css` (recurso de tema da plataforma) e `Comprador não encontrado.` (limitação da conta, §5-C).
**Divergências encontradas:** **uma, e é de escopo.** O ticket é sobre a base **DES**, que **não faz parte do ambiente disponível nesta rodada** — o caso, portanto, **não foi executado onde o defeito ocorreu**. Ele foi escrito de forma independente de base, para valer como checklist de pós-clone em qualquer uma, e foi **ensaiado** na base acessível para provar que os passos são executáveis sem perfil de administrador. Registro também que a verificação **completa** (data de publicação e versão de cada artefato) não é possível sem administrador: o que um usuário comum consegue afirmar é *"o artefato responde"*, não *"o artefato está na versão X"*.
**Dados/massa usados:** nenhum — apenas leitura de rotas e download autenticado de fontes publicados.

---

## Resumo do lote L017

| # | Caso | Verificado | Bloqueio principal |
|---|---|---|---|
| 1 | CT-FSWTBC-4989 | PARCIAL | conta não é demandante de nenhuma SC |
| 2 | CT-FSWTBC-5028 | PARCIAL | matrícula de comprador não resolve |
| 3 | CT-FSWTBC-5029 | PARCIAL | não é membro do pool de Validação Orçamentária |
| 4 | CT-FSWTBC-5030 | PARCIAL | abertura de SC de aditivo exige comprador |
| 5 | CT-FSWTBC-5031 | PARCIAL | matrícula de comprador não resolve |
| 6 | CT-FSWTBC-5033 | PARCIAL | abertura do aditivo exige comprador |
| 7 | CT-FSWTBC-5034 | PARCIAL | exige segunda conta (Gestor Imediato) |
| 8 | CT-FSWTBC-5035 | PARCIAL | sem credencial de gestor |
| 9 | CT-FSWTBC-5057 | PARCIAL | comprador + instabilidade do `genericQuery` |
| 10 | CT-FSWTBC-5058 | **NÃO** | sem admin, sem caixa postal, sem padrão definido |
| 11 | CT-FSWTBC-5059 | **NÃO** | idem |
| 12 | CT-FSWTBC-5117 | PARCIAL | comprador, 2º login e fornecedor |
| 13 | CT-FSWTBC-5127 | PARCIAL | sem perfil de aprovador de alçada |
| 14 | CT-FSWTBC-5132 | PARCIAL | base DES fora do ambiente desta rodada |

**Total: 14 casos · SIM 0 · PARCIAL 12 · NÃO 2.**

Nenhum caso foi marcado SIM porque **nenhum** dos 14 cenários é executável de ponta a ponta com a
conta disponível: doze deles dependem de um perfil que a conta de QA não tem (comprador com
matrícula no ERP, gestor, aprovador orçamentário, aprovador de alçada, fornecedor,
administrador), e dois dependem de superfície que não existe no front-end.

## CT-FSWTBC-5141  (ambos · Concluído · SDCASSI-536)

**Título:** Reprocessar a fila de geração de cotação após interrupção do serviço e ver a SC sair de *Aguarda Geração da Cotação* com o número da
cotação já existente — sem "Este item de solicitação de compra já sofreu cotação"

**Origem:** FSWTBC-5141 — cotações travadas em *Aguarda Geração da Cotação* após parada do processamento (10:00–11:46) e reinício do serviço; o
reprocessamento tentou gerar de novo cotações que já existiam no Protheus e devolveu `{"result":false,"statusCode":400,…,"message":"type mismatch
on + Item 1 … AJUDA:HASQUOTATION Este item de solicitacao de compra ja sofreu cotacao."}` (mensagem truncada). Correção: a etapa reconhece a
cotação existente e devolve o número ao Fluig (idempotência) + logs de acompanhamento. Pendências: represadas exigiram movimentação manual; rotina
de aviso de férias derrubando thread do schedule; causa da parada não identificada.

**Módulo/Rota:** Fluig → Solicitação de Compras → *Sol. Validação do Comprador (121)* → **Integração com ERP (20)** → **Aguarda Geração da Cotação
(328)** → *Cotação foi Gerada? (24)* → *Processo de Cotação (33)* · Histórico da solicitação · campo **Retorno Integração** do formulário da SC ·
Tracker (visão *Solicitação de Compras*, coluna *Nº da Cotação ERP*) · Logs Protheus → aba **Solicitacoes ZZY** (coluna `Qtd T.Env Fl`).

**Pré-condições**
- SC `QA` aprovada pelo comprador, em *Aguarda Geração da Cotação*, com a cotação **já gerada** no Protheus mas sem retorno ao Fluig (simulado
  por interrupção controlada do schedule/serviço no ambiente de homologação, com o dono do ambiente).
- **Bloqueio:** a conta de QA não é comprador (não chega à 121); interromper/reiniciar serviço exige administrador do ambiente; Logs Protheus
  (ZZY) com `genericQuery` 404 hoje. Não movimentar instâncias represadas de terceiros.

**Passos**
1. Aprovar a SC no *Portal do Comprador* (perfil comprador) e confirmar no Histórico a entrada em *Aguarda Geração da Cotação*.
2. Com a cotação gerada no ERP e o retorno interrompido, deixar a fila reprocessar (ciclo de 5 min) após o reinício do serviço.
3. Abrir a SC → **Histórico** e ler o comentário de *Administrador Cassi* em *Aguarda Geração da Cotação* e a decisão de *Cotação foi Gerada?*.
4. No formulário da SC, ler o campo **Retorno Integração**; no Tracker, ler *Nº da Cotação ERP*.
5. Em Logs Protheus → *Solicitacoes ZZY*, filtrar pela SC e ler *Status* e `Qtd T.Env Fl`.

**Resultado esperado**
- Passo 3: a fila reconhece a cotação existente e movimenta para *Cotação foi Gerada?* → *Processo de Cotação*; nenhum registro em Status=Erro.
- Passo 4: *Retorno Integração* vazio ou com sucesso; *Nº da Cotação ERP* preenchido com a cotação **já existente** (não uma segunda).
- Passo 5: `Qtd T.Env Fl` não cresce indefinidamente; sem `HASQUOTATION`.
- Mensagens de erro, quando houver, chegam **completas** (não "type mismatch on +").

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC parada em *Aguarda Geração da Cotação* com registro Status=Erro `"type mismatch on + Item 1 … AJUDA:HASQUOTATION Este item de solicitacao
  de compra ja sofreu cotacao."`, apesar de a cotação existir no ERP.

**Severidade:** Alta

**Preparação de massa:** SC `QA` aprovada pelo comprador; janela combinada com o dono do ambiente para interromper e reiniciar o serviço da
fila; acesso ao widget Logs Protheus funcionando.

**Verificado em tela:** PARCIAL
**O que foi verificado:** sequência **20 → 328 → 24 → 33** vista no Histórico/`/tasks` das SCs 106390, 112011, 112441, 112816 (todas passaram por
*Aguarda Geração da Cotação* no mesmo minuto da integração); hoje **0** instâncias ativas em 328 nos 1.000 movimentos mais recentes (desde 31/08);
widget **Logs Protheus** visto renderizado com abas *Erros CV8 / Solicitacoes ZZY / Medicoes ZZZ*, campos filial, data inicial/final, "Mensagem,
detalhe ou processo" e tamanho de página — porém `genericQuery` **404** (ambiente). Datasets `dsProtheus_getCotacoes_restGetAll` e
`dsProtheus_getCotacaoxProdxGrupProd_restGetAll` existem (200). Reprocessamento não exercitado.
**Divergências encontradas:** o ticket fala em status "Aguarda Geração da Cotação" na fila; no Fluig é a **atividade 328** do processo. O par
"reprocessamento infinito" deste ticket e do SDCASSI-546 (CT-FSWTBC-5169) tem hoje o mesmo sintoma vivo na fila do **Faturamento** (A16), não na de
cotação.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-5143  (ambos · Concluído · SDCASSI-539)

**Título:** Alterar o Tipo de Compra para Contrato no Portal do Comprador ao definir o vencedor e ver a SC seguir o caminho de contrato — sem cair
no grupo de correção de pedido

**Origem:** FSWTBC-5143 — SC 104276 (contrato) caiu no grupo de correção como se fosse pedido. (1) Ao alterar o Tipo de Compra no Portal do
Comprador o ERP era atualizado mas o campo `buyerTipoCompra` do formulário Fluig não — etapas seguintes usavam o valor antigo. Correção: sincronizar
na definição do vencedor (`buyerTipoCompra` = 1 Pedido / 2 Contrato) antes de prosseguir. (2) Colisão de pacotes: o pacote do SDCASSI-536 sobrescreveu
a correção do SDCASSI-522 (reprovar alçada impedia reemitir parecer e travava em *Aguarda Geração Alçadas*); consolidado em pacote único.

**Módulo/Rota:** Fluig → *Portal do Comprador* → **Definir Vencedor Cotação** (alterar *Tipo de Compra*) → formulário da SC, campo **Tipo de Compra \***
(`buyerTipoCompra`, opções `Selecione… | Pedido | Contrato`) → *Integração com ERP (177)* → **Aguarda Geração Alçadas (309)** → *Aprovação de Alçadas (94)*
→ *Aguarda Geração do Pedido/Contrato (323)* → *Contrato? (339)* · Histórico · Tracker (visão *Solicitação de Compras*).

**Pré-condições**
- SC `QA` com cotação encerrada, aberta como *Pedido*, e comprador que vai alterar para *Contrato* ao definir o vencedor.
- Segunda SC `QA` para o cenário (2): alçada **reprovada** e necessidade de reemitir parecer técnico.
- **Bloqueio:** a conta de QA não é comprador (5-C: `Y1_USER = "undefined"`, "Comprador não encontrado") nem gestor de alçada.

**Passos**
1. No Portal do Comprador → *Definir Vencedor Cotação*, abrir a SC, alterar **Tipo de Compra** de *Pedido* para *Contrato* e definir o vencedor.
2. Abrir a SC (modo leitura) e ler o campo **Tipo de Compra \*** do painel do comprador.
3. Acompanhar no Histórico: *Integração com ERP (177)* → *Aguarda Geração Alçadas* → *Aprovação de Alçadas*; aprovar (gestor).
4. Após *Aguarda Geração do Pedido/Contrato*, ler a decisão de **Contrato?** e a atividade seguinte.
5. Cenário (2): na segunda SC, **reprovar** a alçada; verificar que a opção de reemitir o parecer técnico aparece e que a SC não fica em
   *Aguarda Geração Alçadas*.

**Resultado esperado**
- Passo 2: o campo mostra **Contrato** (valor `2`) imediatamente após a definição do vencedor — Fluig e ERP iguais.
- Passo 4: *Contrato?* segue o ramo de contrato (*Aguarda Vigência do Contrato (332)* / geração de contrato), **não** o grupo de correção de pedido.
- Passo 5: reprovação de alçada libera a reemissão do parecer; sem travamento em *Aguarda Geração Alçadas*.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- ERP com *Contrato* e formulário com *Pedido de Compras*; SC de contrato cai no grupo de correção de pedido após a aprovação (SC 104276).
- Cenário (2): SC travada em *Aguarda Geração Alçadas* após reprovação de alçada.

**Severidade:** Alta

**Preparação de massa:** duas SCs `QA` (uma para virar contrato, outra para reprovar alçada); comprador, gestor de alçada e área de parecer.

**Verificado em tela:** PARCIAL
**O que foi verificado:** campo **"Tipo de Compra \*"** `select[name=buyerTipoCompra]` com opções `Selecione... | Pedido (1) | Contrato (2)` lido no
fonte publicado do formulário 256831; atividades **309 Aguarda Geração Alçadas → 225 Alçada foi Gerada? → 310 Gerar Grid de Alçada → 94** vistas
renderizadas no Histórico das SCs 106390/112011/112441/112816; ramo de contrato **332 Aguarda Vigência do Contrato** visto nas SCs 112102/112222/112583.
SC **104276** hoje: `CANCELED` v77 (encerrada 14/08), última atividade *Aguarda Finalizar Negociação* — não é possível observar o desvio original.
Portal do Comprador aberto: "Comprador não encontrado" para a conta de QA.
**Divergências encontradas:** o ticket fala em "grupo de correção"; no processo existem **seis** atividades chamadas *Correção* (127, 135, 138, 183,
191, 236 no mapa 93→94) — o caso precisa do número. A instância 104276 foi **cancelada** em 14/08, antes da entrega final (03/09).
**Dados/massa usados:** nenhum — não submetido; leitura de 104276.

---

## CT-FSWTBC-5169  (ambos · Concluído · SDCASSI-546)

**Título:** Aprovar uma SC pelo comprador e ver a cotação gerada no Protheus em um ciclo da fila — e, se um registro falhar, a fila registrar,
liberar o semáforo e seguir para o próximo em vez de reprocessar o mesmo item a cada 5 minutos

**Origem:** FSWTBC-5169 — SCs 112849 e 113197 aprovadas pelo comprador não geraram cotação e ficaram em *Aguarda Geração da Cotação*. Causa: o log
adicionado pelo SDCASSI-536 (`UCOME036.prw`) ficou **antes** da abertura do ambiente na thread — a thread morria na primeira instrução, o schedule
estourava ao ler o retorno, morria antes de atualizar o status e o registro era reprocessado a cada 5 min, **sem nenhum erro no log**; quatro
filiais presas, uma há 22 h. Correção: log após a abertura do ambiente + proteção na leitura do retorno (registra, libera o semáforo, segue).

**Módulo/Rota:** Fluig → Solicitação de Compras → *Sol. Validação do Comprador (121)* → *Integração com ERP (20)* → **Aguarda Geração da Cotação (328)**
→ *Cotação foi Gerada? (24)* · Histórico · campo **Retorno Integração** · Tracker (*Nº da Cotação ERP*) · Logs Protheus → **Solicitacoes ZZY**
(`Qtd T.Env Fl`) · Protheus: schedule da fila de cotações (marcador de fim por filial).

**Pré-condições**
- SC `QA` aprovada pelo comprador em cada uma das filiais que o schedule atende; Protheus respondendo (`dsProtheus_getBranches_restGetAll` 200).
- **Bloqueio:** a conta de QA não é comprador; Logs Protheus com `genericQuery` 404 hoje; sem credencial Protheus para o log do schedule.

**Passos**
1. Aprovar a SC no Portal do Comprador e anotar o horário de entrada em *Aguarda Geração da Cotação* (Histórico).
2. Aguardar até 2 ciclos da fila (≤ 10 min) e reabrir o Histórico.
3. Ler *Nº da Cotação ERP* no Tracker e o campo **Retorno Integração** no formulário.
4. Em Logs Protheus → *Solicitacoes ZZY*, filtrar pela SC: *Status* e `Qtd T.Env Fl`.
5. (Negativo, com o dono do ambiente) Introduzir um registro inválido na fila e repetir 2–4 para uma SC válida enfileirada **depois** dele.

**Resultado esperado**
- Passo 2: "Administrador Cassi movimentou a atividade Aguarda Geração da Cotação para a atividade Cotação foi Gerada?" dentro de ~7 min (SLA
  medido na 113249 para a fila do Faturamento; para a de cotação, as SCs 106390/112011/112441/112816 saíram de 328 **no mesmo minuto**).
- Passo 3: número da cotação preenchido; *Retorno Integração* sem erro.
- Passo 4: `Qtd T.Env Fl` ≤ 1; sem registro pendente eterno.
- Passo 5: o registro inválido fica pendente **com ocorrência registrada**, e a SC válida seguinte **é processada** — uma falha não para a fila.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- SC parada em *Aguarda Geração da Cotação* indefinidamente; nenhum erro no log da aplicação; marcador de fim do schedule ausente; filiais presas
  no mesmo registro por horas; `Qtd T.Env Fl` crescendo a cada 5 min.

**Severidade:** Alta

**Preparação de massa:** SC `QA` por filial, aprovada pelo comprador; janela com o dono do ambiente para o passo 5.

**Verificado em tela:** PARCIAL
**O que foi verificado:** atividade **328 Aguarda Geração da Cotação** e a saída por *Administrador Cassi* → *Cotação foi Gerada?* vistas renderizadas
no Histórico de 106390, 112011, 112441 e 112816 (todas no mesmo minuto da integração); hoje **0** instâncias ativas em 328 nos 1.000 movimentos mais
recentes; Logs Protheus aberto (abas visíveis) com `genericQuery` **404**; `dsProtheus_getBranches_restGetAll` 200. Instâncias do ticket: **112849 →
404** (não existe neste tenant); **113197** = SC `CANCELED` no *Início* em 03/09.
**Divergências encontradas:** nenhuma das duas SCs do ticket está em *Aguarda Geração da Cotação* neste tenant (uma não existe, a outra foi cancelada
no Início). O sintoma de "fila reprocessando sem sair" está vivo hoje **na fila do Faturamento** (111980/111977/111973, 22–25 dias — A16), não na de
cotação.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-5199  (ambos · Concluído · SDCASSI-556)

**Título:** Enviar uma SC com item sem rateio e com preço no padrão americano e obter a cotação gerada com os valores íntegros no ERP

**Origem:** FSWTBC-5199 — ao gerar a cotação, `java.lang.exception: unexpected token in object literal`; o script fazia `JSON.parse` de `tbprod_jsonrateio___N` sem checar se estava preenchido (item sem rateio derrubava a movimentação, restando só o registro inicial na CV8). A correção também: devolve `''` em vez de `null`/`"null"` para campo vazio (antes gravado como conteúdo no Protheus), exige `C1_PRODUTO/C1_QUANT/C1_SOLICIT`, valida `C1_DATPRF/C1_EMISSAO`, bloqueia POST sem itens, e corrige a conversão decimal que transformava `10.50` em `1050` (×100). Pendência: nenhum levantamento das SCs com valor ×100 nem dos cadastros com `"null"`.

**Módulo/Rota:** Fluig: *Solicitação de Compras* (formulário 256831) → grade de itens → **Rateio** do item; movimentação *Grava SC e Anexos* (233) → *Integração com ERP* (20, `integracaoERP`) → *Aguarda Geração da Cotação* (328); campo **Retorno Integração**; aba *Histórico*; widget *Logs Protheus* → *Erros CV8*. Protheus: **Compras** — `SC1` (SC), `SC8` (cotação), CV8.

**Pré-condições**
- Usuário solicitante com filial e produto válidos.
- Pelo menos um item **sem rateio informado** (campo oculto `tbprod_jsonrateio___N` vazio) e outro **com rateio**.
- Um item com **Preço Unitário** digitado `10.50` (ponto como decimal) e outro `10,50`.
- Acesso de leitura ao Protheus para conferir `C1_VUNIT`/`C1_TOTAL` da SC gerada.
- **Bloqueio:** sem credencial Protheus para o passo de conferência no ERP; o payload pode ser lido no Fluig pela técnica de captura do `POST …/start` (sem gravar).

**Passos**
1. Abra *Solicitação de Compras* → *Nova solicitação*. Preencha o cabeçalho (Tipo de Compra = *Pedido*).
2. Item 1: informe produto, quantidade `2`, **Preço Unitário** `10.50` e **não** preencha o rateio.
3. Item 2: informe produto, quantidade `1`, Preço Unitário `10,50` e rateio 100% num centro de custo.
4. Confira em tela o **Vlr. Total Estimado** dos dois itens (deve ser `21,00` e `10,50`).
5. Envie a solicitação (ou, para não gravar, capture o `POST …/wf_solicitacao_compras/start` e leia o payload).
6. Deixe o processo passar por *Grava SC e Anexos* (233) e *Integração com ERP* (20). Abra a solicitação pela *Central de Tarefas* → *Histórico*.
7. Leia o campo **Retorno Integração** e o **Nº da Solicitação ERP**.
8. No Protheus (`SC1`), confira `C1_VUNIT` dos dois itens e que nenhum campo texto contém a string `null`.
9. (Negativo) Repita com quantidade em branco no item 1 e tente enviar.

**Resultado esperado**
- O item sem rateio **não** derruba a movimentação: a SC é gravada, a integração executa e o Histórico registra `Integração executada com sucesso - Tempo de Execução N s`; a cotação é gerada (SC chega a *Aguarda Geração da Cotação* e depois *Processo de Cotação*).
- `C1_VUNIT` = **10,50** nos dois itens — o valor digitado com ponto **não** vira 1050.
- Campos vazios chegam ao ERP como vazio, nunca como `null`/`"null"`.
- No passo 9 a movimentação é interrompida com mensagem indicando **qual campo** está em branco (obrigatoriedade de `C1_QUANT`), e nada é enviado ao ERP.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro `java.lang.exception: unexpected token in object literal` na integração; cotação não gerada; CV8 só com o registro inicial.
- `10.50` transmitido como `1050` (valor ×100 no ERP); campos vazios gravados no Protheus como `null`.

**Severidade:** Alta *(corrupção silenciosa de valor ×100 na SC e dado inválido gravado no ERP — risco financeiro)*

**Preparação de massa:** o próprio executor cria a SC (prefixo `QA` na descrição/justificativa). Para o passo 8 é preciso alguém com acesso de leitura ao `SC1` no Protheus. Para verificar o passivo (SCs anteriores com valor ×100), consulta SQL em `SC1` por `C1_VUNIT >= 100 * preço de referência` — fora do escopo deste caso.

**Verificado em tela:** PARCIAL
**O que foi verificado:** formulário 256831 publicado (231.832 b) contém os campos ocultos `tbprod_jsonrateio` (2 ocorrências) e, no `ViewHandler.js`, `JSON.parse($('[name=tbprod_jsonrateio___N]').val())` — o `JSON.parse` do lado do navegador **ainda é chamado sem guarda em `handleMountObjDTable`** (a correção do ticket foi no script do processo, servidor, que não é legível por esta conta). `UtilsHandler.replaceToMoney` no fonte publicado só normaliza quando há vírgula (`if (value.indexOf(',') != -1)`) — mesma classe do A3-c. Rótulo **"Retorno Integração"** presente na SC. A instância 103476 citada no ticket **existe, mas é uma Cotação** (`wf_cotacao_produtos_servicos`, `FINALIZED` em 24/06/2026, passou por *Erro?* 60 com `admin` por 5 min) — não é uma SC nesta base. Tracker → *Solicitação de Compras* 103476: "Nenhum registro encontrado".
**Divergências encontradas:** o ticket diz "SC 103476"; aqui 103476 é uma **Cotação**. No fonte do navegador o parse de `tbprod_jsonrateio___N` segue sem guarda (a correção descrita é server-side). `replaceToMoney` do formulário só trata vírgula — o `10.50` do navegador continua dependendo da conversão server-side corrigida. Sem acesso ao `wf_solicitacao_compras.utilities.js` (script de processo) para confirmar `formCardValues_utilities`/`requireCardValue_utilities`.
**Dados/massa usados:** nenhum — não submetido.

**Módulo ERP:** Compras

---

## CT-FSWTBC-5233  (ambos · Concluído · SDCASSI-558)

**Título:** Abrir uma solicitação a partir de um contrato e escolher entre *Aditivo Contratual* e *Nova Contratação* com a explicação de cada opção na tela

**Origem:** FSWTBC-5233 — trocar a nomenclatura "Renovação Contratual" por **"Nova Contratação"** e incluir descrição de cada opção: *Aditivo Contratual* = continuidade do contrato existente (quantidade ou vigência, sempre com alçada de valor) → revisão aberta no Protheus para o FC editar; *Nova Contratação* = contrato novo (mesmo fornecedor ou outro, podendo usar contrato como referência) → contrato novo como quando vem de SC. Resolve a ambiguidade que produziu o SDCASSI-548.

**Módulo/Rota:** Fluig: **Acompanhamento de Contratos** (`/portal/p/1/acompanhamentoContrato`) → ícone **Solicitação de Compra** (coluna Ações, atributo `title`) → modal **"Solicitação de Compra"** → combo **Tipo de Solicitação**; formulário da SC (256831) campo `_tipoSolicitacao`; Portal do Comprador (aprovação) `tipoSolicitacaoOptions`. Protheus: **Contratos - GCT** — `CNTA300` (revisão do contrato) × contrato novo.

**Pré-condições**
- Usuário nos grupos `G.P.Acompanhamento_Renovacao_Contratos` ou `..._admin` (a conta TOTVS-FS está).
- Grade do Acompanhamento carregada (integração com o Protheus no ar — hoje oscila entre 845 linhas e vazio).
- Um contrato vigente na grade.
- **Bloqueio:** nenhum para a parte de tela; o efeito no Protheus (revisão aberta × contrato novo) exige credencial do ERP.

**Passos**
1. Abra *Acompanhamento de Contratos* e aguarde a grade (`Mostrando de 1 até N de N registros`).
2. Na linha de um contrato, clique no ícone **Solicitação de Compra** (coluna Ações).
3. No modal **"Solicitação de Compra"**, leia os textos explicativos acima do combo.
4. Abra o combo **Tipo de Solicitação** e liste as opções.
5. Selecione **Aditivo Contratual**; depois **Nova Contratação**. Observe se o texto de cada opção continua visível/coerente.
6. Clique em **Fechar** (não confirme).
7. (Protheus, opcional) Para uma solicitação já enviada como *Aditivo Contratual*, conferir em `CNTA300` que existe **revisão aberta** do contrato; para *Nova Contratação*, que foi criado **contrato novo**.

**Resultado esperado**
- O combo *Tipo de Solicitação* tem exatamente **Aditivo Contratual** e **Nova Contratação** (além de *Selecione...*). **Não** existe "Renovação Contratual" nem "Revisão Aberta".
- O modal exibe os dois textos: *"Aditivo contratual — Continuidade do contrato existente (aumento de quantidade de itens ou aumento da vigência sempre envolvendo alçada de valor). Protheus = abre revisão aberta e FC irá editar o contrato."* e *"Nova Contratação — Geração de um novo contrato, podendo ser com o fornecedor atual ou diferente. Aqui pode usar um contrato como referência. Protheus = gera novo contrato igual quando vem de SC."*
- Confirmar sem escolher o tipo dispara a crítica de campo obrigatório citando **"Tipo de Solicitação"**.
- No ERP, *Aditivo* abre revisão; *Nova Contratação* cria contrato.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Opção "Renovação Contratual" no combo, sem descrição — usuário escolhia "renovação" esperando prorrogar e o Protheus gerava contrato novo (SDCASSI-548).

**Severidade:** Média *(nomenclatura, mas a escolha errada produz documento jurídico distinto no ERP)*

**Preparação de massa:** nenhuma para a tela — basta a grade carregar. Para o passo 7, uma solicitação de cada tipo já integrada, e leitura no `CNTA300`.

**Verificado em tela:** SIM (total) *(parte Fluig)*
**O que foi verificado:** `/portal/p/1/acompanhamentoContrato` com **845 linhas**; ícone *Solicitação de Compra* abre o modal **"Solicitação de Compra"** com os dois textos explicativos exatamente como transcritos acima, combo `tipoSolicitacao` com opções `Selecione...`, `Aditivo Contratual`, `Nova Contratação`, campos *Contrato*, *Data de Necessidade*, *Motivo da Solicitação*, botões *Confirmar*/*Fechar*; selecionadas as duas opções e o modal fechado sem confirmar. No fonte `wAcompanhaContratos_pt_BR.js` a validação do *Confirmar* empilha `'Tipo de Solicitação'` em `camposInvalidos` quando vazio. Formulário da SC 256831: combo `_tipoSolicitacao` com *Aditivo Contratual* e *Nova Contratação* (0 ocorrências de "Renova"). Bundle do Portal do Comprador: `tipoSolicitacaoOptions = [Selecione.., Nova Contratação, Aditivo Contratual]` e `TIPO_ADITIVO="Aditivo Contratual"`.
**Divergências encontradas:** o texto do modal grafa **"Aditivo contratual"** (c minúsculo) no título explicativo e **"Aditivo Contratual"** na opção do combo; no combo há **dois `Selecione...`** (um `<option>` duplicado). Na primeira tentativa a grade veio vazia (`Mostrando 0 até 0 de 0`) — instabilidade do Protheus, não defeito. O formulário da SC mostra o combo `disabled` quando aberto em branco (preenchido só pelo fluxo do Acompanhamento).
**Dados/massa usados:** nenhum — modal aberto e fechado sem confirmar.

**Módulo ERP:** Contratos - GCT

---
