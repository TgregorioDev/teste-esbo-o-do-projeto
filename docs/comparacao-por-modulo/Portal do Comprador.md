# Portal do Comprador — casos dos chamados × suíte Playwright

Total: **147** casos — COBERTO **3** · APRIMORAR **20** · IMPLEMENTAR **124**.

## Leitura que governa a classificação

- Nenhum teste da suíte chega a uma **cotação, proposta ou negociação real**. As três filas do Portal do Comprador (Controle de Cotações, Avaliação de Propostas, Definir Vencedor) vêm vazias para a conta `TOTVS-FS`, que não tem matrícula de comprador na SY1 — `ciclo-cotacao.spec.js` e `negociacao-proposta.spec.js` terminam em `PRÉ-CONDIÇÃO AUSENTE`, e os shells avulsos só afirmam `readonly`. Por isso 124 casos são IMPLEMENTAR: o motivo é massa/credencial, não falta de tela.
- Critério aplicado: caso cujo núcleo é uma **assertion sobre grade/filtro/coluna que um teste já renderiza** → APRIMORAR (arquivo existente). Caso cujo núcleo é uma **ação dentro de modal/fluxo que nenhum teste abre** (Aprovar/Reprovar, Centralizar, Analisar Cotação, Definir Vencedor, cancelamento pelo portal, integração ERP) → IMPLEMENTAR, mesmo que a tela-mãe seja aberta por um teste.
- COBERTO só quando o mesmo comportamento é afirmado (inclusive `@bug` vermelho intencional): FSWTBC-2834, 4417 e 5132.

## Onde nascem os IMPLEMENTAR (por arquivo-alvo)

- `tests/e2e/portais/avaliacao-propostas.spec.js` — 23: 2357, 2387, 3597, 3697, 3714, 3736, 3737, 3767, 3797, 3891, 3911, 4093, 4110, 4145, 4299, 4303, 4311, 4347, 4353, 4458, 4521, 5007, 5067
- `tests/e2e/portais/definir-vencedor.spec.js` — 18: 1432, 2315, 2368, 3636, 3708, 3728, 3738, 4159, 4336, 4337, 4338, 4349, 4468, 4526, 4566, 5057, 5106, 5143
- `tests/e2e/compras/integracao-erp-cotacao.spec.js` — 17: 628, 653, 1323, 1943, 2326, 3598, 3665, 3670, 4232, 4287, 4673, 4709, 4760, 4771, 5016, 5141, 5169
- `tests/e2e/portais/controle-cotacoes.spec.js` — 17: 2023, 3824, 3842, 3883, 4095, 4207, 4302, 4341, 4342, 4359, 4360, 4455, 4457, 4466, 4633, 4772, 4800
- `tests/e2e/portais/validacao-inicial.spec.js` — 12: 2257, 3731, 3733, 3747, 3893, 4128, 4300, 4344, 4461, 5028, 5031, 5033
- `tests/e2e/portais/centralizacao-compras.spec.js` — 11: 2536, 2889, 2988, 3622, 3690, 3884, 3917, 4304, 4305, 4462, 4631
- `tests/e2e/compras/negociacao-proposta.spec.js` — 10: 641, 1823, 2080, 2430, 2677, 2772, 2946, 4557, 4607, 4635
- `tests/e2e/portais/cancelamento-portal-comprador.spec.js` — 6: 3716, 3739, 3750, 4538, 4864, 4965
- `tests/e2e/compras/ciclo-cotacao.spec.js` — 5: 1953, 2073, 2944, 4677, 4768
- `tests/e2e/portais/listas-e-textos-portal-comprador.spec.js` — 2: 4317, 4453
- `tests/e2e/compras/parecer-tecnico.spec.js` — 1: 2532
- `tests/api/gravavencedor-idempotente.spec.js` — 1: 3963
- `tests/e2e/plataforma/orcamento-de-requisicoes.spec.js` — 1: 4178

Executáveis **hoje**, com a conta atual, sem massa de comprador: 4178 (contagem de requisições), 4300 (metade 'não é sua responsabilidade'), 3884 (Centralizar sem seleção), 4317 (ordem alfabética das listas), 4453 (inventário de textos).

## APRIMORAR — o que acrescentar, por arquivo de spec

### `tests/e2e/portais/ciclo-comprador.spec.js` (11)

- **FSWTBC-2404** — As quatro telas existirem e abrirem está coberto. Faltam as lacunas da MIT044: mensagem 'Existem vencedores selecionados sem quantidade informada para processar.' ao processar vencedor sem quantidade e os demais gaps — exigem cotação real (ver FSWTBC-5057).
  - teste de partida: `tests/e2e/portais/portal-comprador.spec.js :: deve oferecer as quatro etapas do ciclo de compras no Acesso Rápido | tests/e2e/portais/ciclo-comprador.spec.js :: CT-E2E-08-H — Avaliação de Propostas traz exatamente as colunas Status, Nº Cotação, Filial, Nº SC, Proc. Fluig, Tipo de Documento, Parecer Técnico, Em Alçada, Dt. Validade e Valor Final | tests/e2e/portais/ciclo-comprador.spec.js :: CT-E2E-09-H — Definir Vencedor Cotação traz a mesma grade de acompanhamento de Avaliação de Propostas, hoje sem cotação vencedora disponível para definir`
- **FSWTBC-3612** — A metade 'comprador resolvido no DES' está coberta pelo @bug de console (reprova hoje com 'Comprador não encontrado'). Faltam: com credencial de comprador, cotações/fornecedores/propostas listados pelo nome nas três telas e anexos abrindo.
  - teste de partida: `tests/e2e/plataforma/erros-de-console.spec.js :: CT-PLT-06-S1 @bug: Portal do Comprador (/portal/p/1/portal-do-comprador) deve carregar sem erro de console não catalogado`
- **FSWTBC-3626** — Localizar o processo pelo número da SC do Fluig no Tracker está coberto (CT-E2E-11-H). Falta o painel 'Fornecedores Exclusivos' da seção Validação do Comprador da SC (um cartão por fornecedor com nome, Código e Loja), consultável após a cotação aprovada — exige cotação real.
  - teste de partida: `tests/e2e/portais/ciclo-comprador.spec.js :: @destrutivo CT-E2E-11-H — o Tracker localiza a SC própria pelo Nº do Processo Fluig e exibe a posição atual e o caminho percorrido`
- **FSWTBC-3715** — CT-E2E-07-H afirma os campos do filtro só no Controle de Cotações. Acrescentar a mesma leitura em Avaliação de Propostas e Definir Vencedor (Nº do Processo Fluig ao lado de Nº da Cotação ERP, Filial, Tipo Documento, Parecer Técnico, Em Alçada, Data Validade) — executável hoje — e, com massa, filtrar por um número existente e afirmar a linha devolvida.
  - teste de partida: `tests/e2e/portais/ciclo-comprador.spec.js :: CT-E2E-07-H — a delegação "Atuar como" troca de sessão com sucesso, e o Controle de Cotações expõe o filtro por Nº do Processo/Cotação/Filial/Datas`
- **FSWTBC-3732** — O teste expande o detalhe da linha e só afirma que os rótulos 'Produto/Serviço', 'Quantidade' e 'Vlr. Total Estimado' estão visíveis. Acrescentar: 'Preço Unit. Estimado' e 'Vlr. Total Estimado' (e os demais campos do detalhe) `toBeDisabled()`/`not.toBeEditable()`; usar a SC própria de CT-E2E-06-H para comparar os valores exibidos com o preço/total informados na abertura; recarregar e reafirmar. Executável hoje — a Validação Inicial lista dados reais sem delegação.
  - teste de partida: `tests/e2e/portais/ciclo-comprador.spec.js :: deve listar SCs reais em Validação Inicial, com dados do item visíveis ao expandir a linha, sem exigir delegação`
- **FSWTBC-3778** — CT-E2E-07-H abre o painel Filtrar do Controle de Cotações mas não filtra (a grade está vazia). Acrescentar, com massa de comprador: filtrar por um 'Núm. Cotação' e afirmar que todas as linhas têm exatamente esse número; 'Limpar Filtros' restaura a listagem completa.
  - teste de partida: `tests/e2e/portais/ciclo-comprador.spec.js :: CT-E2E-07-H — a delegação "Atuar como" troca de sessão com sucesso, e o Controle de Cotações expõe o filtro por Nº do Processo/Cotação/Filial/Datas`
- **FSWTBC-3896** — CT-E2E-06-H cria uma SC com justificativa conhecida e localiza a linha na Validação Inicial, mas só afirma que o texto contém 'Validação Orçamentária'. Acrescentar: a célula 'Justificativa' exibe o texto integral da massa (toHaveText exato) e não está truncada (sem text-overflow/ellipsis; altura da linha cresce). Executável hoje.
  - teste de partida: `tests/e2e/portais/ciclo-comprador.spec.js :: @destrutivo uma SC própria aparece em Validação Inicial e sua Etapa avança de verdade após a aprovação do Gestor`
- **FSWTBC-4126** — Os cabeçalhos 'Número da SC' e 'Nº. Proc. Fluig' já são afirmados em Avaliação de Propostas e Definir Vencedor (não no Controle de Cotações — acrescentar). Falta afirmar, com linhas, que toda célula dessas colunas tem valor (não vazio/undefined/null) e que o detalhe traz 'Nº do Processo Fluig' — exige comprador.
  - teste de partida: `tests/e2e/portais/ciclo-comprador.spec.js :: CT-E2E-08-H — Avaliação de Propostas traz exatamente as colunas Status, Nº Cotação, Filial, Nº SC, Proc. Fluig, Tipo de Documento, Parecer Técnico, Em Alçada, Dt. Validade e Valor Final | tests/e2e/portais/ciclo-comprador.spec.js :: CT-E2E-09-H — Definir Vencedor Cotação traz a mesma grade de acompanhamento de Avaliação de Propostas, hoje sem cotação vencedora disponível para definir`
- **FSWTBC-4323** — Só o cabeçalho 'Status' é afirmado. Acrescentar, com linhas: status renderizado como etiqueta com cor e ícone e rótulo pertencente ao conjunto fechado (Em andamento, Analisar, Em Cotação, Em Integração, Validação de Propostas, Em Negociação, ...) nas três telas — exige comprador.
  - teste de partida: `tests/e2e/portais/ciclo-comprador.spec.js :: CT-E2E-08-H — Avaliação de Propostas traz exatamente as colunas Status, Nº Cotação, Filial, Nº SC, Proc. Fluig, Tipo de Documento, Parecer Técnico, Em Alçada, Dt. Validade e Valor Final | tests/e2e/portais/ciclo-comprador.spec.js :: CT-E2E-09-H — Definir Vencedor Cotação traz a mesma grade de acompanhamento de Avaliação de Propostas, hoje sem cotação vencedora disponível para definir`
- **FSWTBC-4351** — A ordem das colunas da grade externa (Status … Valor Final) já é afirmada com toEqual. Falta a grade interna de propostas do modal (Nº Proposta · Quantidade · Valor Unit. · Valor Frete · Valor Final · Prev. Entrega · Data Proposta · Validade · Tipo de Frete · Cond. Pgto · Obs. Fornecedor) e todo valor monetário em R$ com 2 casas — exige comprador.
  - teste de partida: `tests/e2e/portais/ciclo-comprador.spec.js :: CT-E2E-08-H — Avaliação de Propostas traz exatamente as colunas Status, Nº Cotação, Filial, Nº SC, Proc. Fluig, Tipo de Documento, Parecer Técnico, Em Alçada, Dt. Validade e Valor Final | tests/e2e/portais/ciclo-comprador.spec.js :: CT-E2E-09-H — Definir Vencedor Cotação traz a mesma grade de acompanhamento de Avaliação de Propostas, hoje sem cotação vencedora disponível para definir`
- **FSWTBC-4505** — pages/CicloCompradorPage.atuarComoSubstituto lê o valor default do 'Atuar como' (a própria conta) mas nenhum teste AFIRMA isso. Acrescentar: option selecionada por padrão = usuário autenticado e substituídos ordenados por nome pt-BR (executável hoje). 'Cotações listadas sem substituição cadastrada' exige comprador sem substituto — o @bug de console ('Comprador não encontrado') é o sintoma que a conta atual produz.
  - teste de partida: `tests/e2e/portais/ciclo-comprador.spec.js :: CT-E2E-07-H — a delegação "Atuar como" troca de sessão com sucesso, e o Controle de Cotações expõe o filtro por Nº do Processo/Cotação/Filial/Datas | tests/e2e/portais/portal-comprador.spec.js :: deve exigir delegação em "Atuar como" para listar Controle de Cotações`

### `tests/e2e/compras/negociacao-proposta.spec.js` (1)

- **FSWTBC-692** — O teste abre o shell da Negociação e só afirma readonly. Acrescentar: varrer todos os inputs/labels do shell e afirmar que nenhum exibe o literal 'NaN' (campo numérico vazio deve render '0'/'0,00') — executável hoje sem massa. A metade 'movimentar a negociação e o valor formatado chegar' segue dependendo de negociação real.
  - teste de partida: `tests/e2e/compras/negociacao-proposta.spec.js :: CT-NEG-01-H/S1/S2 (bloqueado) — proposta, fornecedor e validade são readonly; a aprovação real é declarada como responsabilidade do Protheus`

### `tests/e2e/portais/tracker-compras.spec.js` (1)

- **FSWTBC-1932** — O Tracker só é exercitado com 'Filtrar por' padrão + Status. Acrescentar teste que seleciona os dois filtros de negociação ('Negociação de Cotação...' e a visão detalhada por itens), pesquisa e afirma que devolvem o mesmo conjunto de processos — executável hoje, só leitura. A parte 'erro do Protheus em campo próprio' exige negociação real.
  - teste de partida: `tests/e2e/portais/tracker-compras.spec.js :: deve listar processos reais ao filtrar por status`

### `tests/e2e/acompanhamento-contratos/grade-contratos.spec.js` (1)

- **FSWTBC-2286** — Passo 4 coberto (modal só oferece Aditivo Contratual + Nova Contratação e fecha sem criar). Falta: clicar 'Informações do Contrato' (locator acoesDaLinha.informacoes só é afirmado visível) e afirmar a coerência 'Via Solicitação Compra?'=1 ⇔ 'Número SC Origem' preenchido (e =2 ⇔ vazio) para um contrato de cada tipo, mais a auditoria via dataset dsProtheus_getContratosxFornecedores_restGet (zero registros XSC=2 com XSCORI preenchido).
  - teste de partida: `tests/e2e/acompanhamento-contratos/grade-contratos.spec.js :: CT-ACC-02-H — deve oferecer Planilha, Solicitação de Compra e Informações na linha do contrato | tests/e2e/acompanhamento-contratos/modal-solicitacao-compra.spec.js :: deve oferecer os tipos contratuais de solicitação`

### `tests/e2e/compras/ciclo-cotacao.spec.js` (1)

- **FSWTBC-2636** — Os dois shells já são abertos e percorridos. Acrescentar assertion de que NENHUM controle de anexo (botão, input file, lista de documentos) existe nos formulários de Cotação e Negociação, em contraste com a SC (que tem 'Anexar documentação Pública/Restrita') — executável hoje. A metade 'arquivo está no GED' exige proposta de fornecedor.
  - teste de partida: `tests/e2e/compras/ciclo-cotacao.spec.js :: CT-COT-01-H/S1/CT-COT-02-S1/S2/S3 (bloqueado) — fornecedor, vínculos, itens e totais são readonly; só o radio de parecer técnico é editável | tests/e2e/compras/negociacao-proposta.spec.js :: CT-NEG-01-H/S1/S2 (bloqueado) — proposta, fornecedor e validade são readonly; a aprovação real é declarada como responsabilidade do Protheus`

### `tests/e2e/tarefas/resumo-tarefas.spec.js` (1)

- **FSWTBC-3735** — O teste afirma total do painel = soma de 'No prazo + Próx. a vencer + Atrasadas' — NÃO compara com os cartões listados, que é o que o caso pede. Acrescentar: clicar explicitamente na sub-aba 'Tarefas a concluir', contar os cartões (paginação via utils/central-tarefas-paginacao.js) e afirmar igualdade com o marcador; concluir uma tarefa própria e afirmar que o marcador desce em 1. A metade 'Somente Minha Responsabilidade' na Validação Inicial exige comprador.
  - teste de partida: `tests/e2e/tarefas/resumo-tarefas.spec.js :: "Tarefas a concluir": total do painel deve bater com a soma de No prazo + Próx. a vencer + Atrasadas`

### `tests/api/sincronizacao-protheus.spec.js` (1)

- **FSWTBC-4316** — A suíte só seleciona um produto conhecido no combo da SC e mede datasets _Sync de RH. Acrescentar em tests/api: consultar dsProtheus_getProdutos_restGetAll e dsProtheus_getGrupoDeProduto_restGetAll com filtro B1_GRUPO/BM_GRUPO=3300 e afirmar zero registros; comparar código/descrição do produto padrão (00000003) entre o dataset sincronizado e o genericQuery ao vivo (SB1 JOIN SBM) para detectar defasagem. Executável hoje, sem massa.
  - teste de partida: `tests/api/sincronizacao-protheus.spec.js :: CT-INT-02-S1 @bug: variantes de cache (_Sync) dos dados de RH e vigência de compra não devem estar em erro | tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: @destrutivo deve criar e enviar a Solicitação de Compras com todos os campos válidos`

### `tests/e2e/tarefas/cancelamento-solicitacao.spec.js` (1)

- **FSWTBC-4668** — O cancelamento coberto é o do próprio solicitante, via cartão de 'Minhas solicitações', sobre um questionário CliniCASSI. Acrescentar variante com SC própria (wf_solicitacao_compras) em 'Validação do Gestor' cancelada pelo botão 'Cancelar Solicitação' da tela de detalhe (pageworkflowview), afirmando Histórico 'Processo cancelado por' e Tracker Status=CANCELADA. Perfil de gestor do processo, SC convertida de versão antiga e SC em Negociação estão fora do alcance da conta.
  - teste de partida: `tests/e2e/tarefas/cancelamento-solicitacao.spec.js :: CT-TSK-05-H @destrutivo — cancelar pela Central de Tarefas deve levar a solicitação a CANCELED no servidor`

### `tests/e2e/compras/ciclo-solicitacao-compras.spec.js` (1)

- **FSWTBC-5199** — A suíte só usa preço '100,00' (BR) e sempre fecha rateio 100% ou <100% (bloqueado). Acrescentar: item com Preço Unitário '10.50' (ponto) → 'Vlr. Total Estimado' 21,00 e, capturando o POST workflowView/send, tbprod_precoUnitario chega como 10,50 (não 1050) e campos vazios vão como '' (nunca 'null'); item SEM linha de rateio não derruba 'Grava SC e Anexos' (aguardarAtividadeAtual até 'Validação do Gestor' e 'Retorno Integração' vazio). A conferência de C1_VUNIT no Protheus fica fora.
  - teste de partida: `tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: @destrutivo deve criar e enviar a Solicitação de Compras com todos os campos válidos | tests/e2e/compras/validacoes-solicitacao-compras.spec.js :: CT-CMP-02-S2 — deve bloquear o envio quando o rateio do item soma menos de 100%`

### `tests/e2e/acompanhamento-contratos/modal-solicitacao-compra.spec.js` (1)

- **FSWTBC-5233** — Combo exatamente [Aditivo Contratual, Nova Contratação] e crítica de 'Tipo de Solicitação' obrigatório já estão afirmados. Falta afirmar os dois textos explicativos do modal ('Aditivo contratual — Continuidade do contrato existente ... abre revisão aberta ...' e 'Nova Contratação — Geração de um novo contrato ...') visíveis e coerentes ao alternar a opção — executável hoje; o efeito no CNTA300 exige Protheus.
  - teste de partida: `tests/e2e/acompanhamento-contratos/modal-solicitacao-compra.spec.js :: deve oferecer os tipos contratuais de solicitação | tests/e2e/acompanhamento-contratos/validacoes-solicitacao.spec.js :: deve cobrar o tipo de solicitação quando somente ele fica sem preencher`

## COBERTO

- **FSWTBC-2834** — `tests/e2e/plataforma/erros-de-console.spec.js :: CT-PLT-06-S1 @bug: Portal do Comprador (/portal/p/1/portal-do-comprador) deve carregar sem erro de console não catalogado | tests/e2e/portais/portal-comprador.spec.js :: deve oferecer as quatro etapas do ciclo de compras no Acesso Rápido | tests/e2e/portais/portal-comprador.spec.js :: deve listar as solicitações reais em Validação Inicial, sem exigir delegação | tests/e2e/portais/portal-comprador.spec.js :: deve exigir delegação em "Atuar como" para listar Controle de Cotações`
  - O @bug de console afirma exatamente 'sem erro de console relativo a dados do comprador' (hoje vermelho: 'Comprador não encontrado'); os quatro itens do Acesso Rápido abrem; fila vazia aparece como 'Nenhum dado encontrado', não como falha.
- **FSWTBC-4417** — `tests/e2e/portais/alcadas-orcamentaria.spec.js :: @destrutivo CT-E2E-04-H — o histórico da SC permanece integralmente rastreável até o ponto em que a alçada bloqueia a conta autenticada | tests/e2e/portais/ciclo-comprador.spec.js :: @destrutivo uma SC própria aparece em Validação Inicial e sua Etapa avança de verdade após a aprovação do Gestor`
  - CT-E2E-04-H cria a SC pelo formulário clássico e afirma no Histórico 'iniciou a solicitação', 'Compra Centralizada?', 'Grava SC e Anexos' e 'assumiu a tarefa Validação do Gestor' (movimento além do Início, sequência 7); CT-E2E-06-H afirma que a linha da SC na Validação Inicial exibe Etapa ≠ Início ('Validação Orçamentária'). A parametrização de pasta não tem superfície de front-end.
- **FSWTBC-5132** — `tests/e2e/plataforma/catalogo-invariante.spec.js :: CT-PLT-10-H: o conjunto de processos publicados e o de iniciáveis devem bater exatamente com o inventário versionado | tests/e2e/compras/abertura-solicitacao-compras.spec.js :: deve abrir completo, com Identificação pré-preenchida, Entidade/Filial e Produtos/Serviços | tests/e2e/portais/portal-comprador.spec.js :: deve oferecer as quatro etapas do ciclo de compras no Acesso Rápido | tests/e2e/portais/portal-comprador.spec.js :: deve listar as solicitações reais em Validação Inicial, sem exigir delegação | tests/e2e/acompanhamento-contratos/acesso-portal.spec.js :: CT-ACC-01-H — deve listar os contratos para usuário com o grupo de acesso | tests/e2e/plataforma/erros-de-console.spec.js :: CT-PLT-06-S1 @bug: Portal do Comprador (/portal/p/1/portal-do-comprador) deve carregar sem erro de console não catalogado`
  - Checklist pós-clone coberto por composição: processo listado (invariante do catálogo), formulário renderiza, quatro itens do Acesso Rápido, Validação Inicial com linhas, Acompanhamento com linhas, console sem erro não catalogado. Não há como afirmar 'campos novos da demanda' sem a lista de artefatos.

## Testes existentes mais fracos do que o título sugere

- `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js :: @destrutivo deve assumir e movimentar uma tarefa do pool de Validação dos Compradores quando disponível`
  - Sem grupo no pool: `expect(true).toBe(true)` e retorna. Com grupo: assume a PRIMEIRA tarefa de qualquer SC e só afirma que a atividade seguinte tem nome. Nunca afirma o efeito da Validação do Comprador (integração, cotação gerada, 'Enviar para').
- `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js :: deve verificar se a Validação Orçamentária está alcançável por pool para o usuário de automação`
  - Só anota o achado e passa com `expect(true).toBe(true)` — não é teste, é sonda.
- `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js :: @destrutivo deve sinalizar explicitamente quando não há aprovador habilitado para a próxima etapa`
  - Assertion em OU (mensagem de alçada OU atividade avançou): passa sempre que a aprovação simplesmente avança, o que é o caso medido — nunca exercita a alçada.
- `tests/e2e/portais/ciclo-comprador.spec.js :: CT-E2E-08-H / CT-E2E-09-H`
  - Afirma os cabeçalhos e `possuiDados() === false` — congela a AUSÊNCIA de dados como esperado; se um dia a fila listar cotações, o teste fica vermelho sem defeito.
- `tests/e2e/portais/ciclo-comprador.spec.js :: CT-E2E-07-H`
  - 'expõe o filtro' = cinco labels visíveis + 'Nenhum dado encontrado'; nenhum filtro é aplicado.
- `tests/e2e/portais/ciclo-comprador.spec.js :: @destrutivo CT-E2E-10-H — a SC própria não gera pedido no Protheus antes de vencer a alçada`
  - Afirma que o texto 'Pedido de Compra' não aparece no Histórico de uma SC parada em Validação Orçamentária — trivialmente verdadeiro; não observa o ERP.
- `tests/e2e/compras/ciclo-cotacao.spec.js :: CT-COT-01-H/S1/CT-COT-02-S1/S2/S3 (bloqueado) e tests/e2e/compras/negociacao-proposta.spec.js :: CT-NEG-01-H/S1/S2 (bloqueado)`
  - Citam cinco/três IDs do catálogo no título (o script de cobertura os conta como cobertos), mas só afirmam `not.toBeEditable()` num shell fora de contexto.
- `tests/e2e/portais/portal-comprador.spec.js :: deve exigir delegação em "Atuar como" para listar Controle de Cotações`
  - Afirma combo com >1 opção e grade vazia. Contradiz `ciclo-cotacao.spec.js`/`negociacao-proposta.spec.js`, que mediram `comboAtuarComo` com contagem 0 na mesma tela em 01/09/2026 — as duas specs não podem estar verdes ao mesmo tempo.
- `tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: deve rejeitar o upload de planilha de rateio com formato inválido`
  - O upload é ACEITO como anexo genérico sem aviso (registrado só em annotation); a assertion é que a seção de rateio não nasce e que nenhum processo foi criado.
- `tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: @destrutivo deve criar e enviar a Solicitação de Compras com todos os campos válidos`
  - O oráculo 'Minhas Solicitações' foi rebaixado para `identificadores.length > 0` porque a lista não pagina — a SC criada não é procurada lá.
- `tests/e2e/tarefas/resumo-tarefas.spec.js :: "Tarefas a concluir": total do painel deve bater com a soma…`
  - Compara o total com a soma dos três sub-contadores do mesmo painel, não com os cartões listados (FSWTBC-3735).
- `tests/e2e/portais/tracker-compras.spec.js :: deve listar processos reais ao filtrar por status`
  - Só `count() > 0`; nenhuma coluna, filtro específico ou visão de negociação é afirmada.
