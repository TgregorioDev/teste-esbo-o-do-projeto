# Faturamento de Contratos — casos dos chamados × suíte Playwright

Módulo com **104 casos** (CT-FSWTBC). Fonte: `digest/Faturamento de Contratos.txt` e o arquivo completo de casos; suíte lida no corpo dos specs (`tests/e2e/contratos/*`, `tests/e2e/acompanhamento-contratos/*`, Page Objects e `utils/*`).

## Contagem por status

| Status | Casos |
|---|---|
| COBERTO | 0 |
| APRIMORAR | 28 |
| IMPLEMENTAR | 76 |

## Por que zero COBERTO

Os três specs que tocam `wf_faturamento_contratos` (`faturamento-contratos.spec.js`, `ciclo-faturamento.spec.js`, `validacoes-faturamento.spec.js`) param todos na etapa **Início**. O painel `#panel_MeasurementItens` — quantidade, desconto, rateio, "Houve Prestação de Serviço?", download/upload de planilha — só abre com `controlField === 'GRAVA_MED'`, na etapa *Realizar Medição do Contrato*, atribuída ao Fiscal/CSE do contrato no Protheus. A conta da automação não é fiscal de nenhum contrato e não pertence a nenhum grupo de pool de Contratos (provado ao vivo por CT-FAT-02-S3). `MedicaoContratoPage` não expõe, de propósito, nenhum método dessa etapa.

Consequências para a leitura dos chamados:

- **Nenhum teste lê o Histórico da solicitação nem a fila ZZZ/ZZY** — que são a única superfície de erro do formulário 256836 (sem campo de retorno de integração). O único teste que afirma sobre a solicitação criada (`ciclo-faturamento`) lê apenas o nome da atividade atual e afirma `not.toContain('início')`.
- O único `@bug` do módulo é CT-FAT-02-S2 (recusa do Protheus engolida sem aviso). Ele **quase** cobre 1760/2014/2680/1959, mas afirma sobre *qualquer* motivo de recusa, não sobre o motivo específico que cada chamado exige — por isso ficaram em APRIMORAR.
- 0 de 565 contratos vigentes estão totalmente medidos e nenhuma planilha tem ≥100 itens: 1903/5163/1893/1894 nasceriam em `PRÉ-CONDIÇÃO AUSENTE` mesmo com o papel concedido.

## APRIMORAR — o que acrescentar, por arquivo

### `tests/e2e/contratos/ciclo-faturamento.spec.js` (15 casos)

- **FSWTBC-629** (SEV ?) — Abrir uma medição de contrato pelo Faturamento de Contratos e ver a busca automática de dados do contrato concluir sem erro.
  - teste que toca: `CT-FAT-01-H @destrutivo: deve criar uma medição válida a partir de um contrato vigente e roteá-la para a próxima atividade do workflow`
  - acrescentar: O teste cria a medição e só afirma que a atividade atual não é 'Início'. Acrescentar: ler /process-management/api/v2/requests/{id}/tasks da solicitação criada e afirmar que a atividade de serviço 'Busca Informações do Contrato' está COMPLETED com comentário 'Integração executada com sucesso - Tempo de Execução N s', e que a atividade corrente é exatamente 'Realizar Medição do Contrato'. Não procurar a mensagem no formulário (256836 não tem campo de retorno).
- **FSWTBC-639** (SEV Alta) — Fiscal executa a medição de um contrato e os campos herdados do contrato chegam preenchidos e não editáveis.
  - teste que toca: `CT-FAT-01-H @destrutivo: deve criar uma medição válida a partir de um contrato vigente e roteá-la para a próxima atividade do workflow`
  - acrescentar: O comentário do teste diz '34 campos, 0 editáveis — medido' mas nada é afirmado. Após a cadeia de zooms resolver, afirmar: Revisão, Filial do Contrato, Tipo, Situação, Data Início/Fim, Objeto e Nº da Medição vêm preenchidos (não vazios) E readonly/disabled (toHaveAttribute('readonly') ou toBeDisabled), e que pressSequentially num deles não altera o value. Situação = 'Vigente'.
- **FSWTBC-695** (SEV Média) — Iniciar uma medição manual de contrato (Faturamento de Contratos) e chegar ao Fiscal de Serviço com o formulário íntegro
  - teste que toca: `CT-FAT-01-H @destrutivo: deve criar uma medição válida a partir de um contrato vigente e roteá-la para a próxima atividade do workflow`
  - acrescentar: Cobre a criação e o avanço além de 'Início', mas não afirma o que o caso exige: (Passo 2) campos derivados preenchidos e bloqueados + Situação = Vigente antes do Enviar; (Passo 4) atividade corrente == 'Realizar Medição do Contrato', responsável = fiscal nominal (assignee.code ≠ conta de integração), e AUSÊNCIA de 'Correção' no histórico. 'Houve Prestação de Serviço? = Não' e Observações não obrigatório ficam fora (etapa GRAVA_MED).
- **FSWTBC-1696** (SEV Alta) — Carregar os itens do contrato E01-2025-2101 na medição e gravá-la no Protheus sem erro na API
  - teste que toca: `CT-FAT-01-H @destrutivo: deve criar uma medição válida a partir de um contrato vigente e roteá-la para a próxima atividade do workflow`
  - acrescentar: O teste espera ds_fatcon_get_info_medicoes sem diálogo 'Erro:' e envia. Acrescentar: (a) afirmar ausência do toast 'Erro ao buscar as informações da medição.'; (b) ler o corpo da resposta (STATUS SUCCESS) e comparar a quantidade de itens do RESPONSE com a quantidade de itens da planilha em getInfoPlanilhaxContrato (mesmo contrato/planilha). A gravação no Protheus (passos 4+) exige GRAVA_MED → fora.
- **FSWTBC-2012** (SEV Média) — Fiscal seleciona contrato e competência no Faturamento e as informações da medição são carregadas sem erro de API.
  - teste que toca: `CT-FAT-01-H @destrutivo: deve criar uma medição válida a partir de um contrato vigente e roteá-la para a próxima atividade do workflow`
  - acrescentar: Quando a chamada ds_fatcon_get_info_medicoes falha por API (HTTP ≠ 200, RESPONSE não-JSON), o teste trata como descarte e cai em PRÉ-CONDIÇÃO AUSENTE — não distingue recusa de negócio de erro de API. Acrescentar: usar lerVereditoDeMedicao e FALHAR (não pré-condição) quando STATUS=ERROR com mensagem que não é validação de negócio, ou quando a resposta não é 200; afirmar ausência do toast de erro.
- **FSWTBC-2028** (SEV Alta) — Abrir a medição de um contrato cuja filial de medição é diferente da filial do contrato e ver as informações da medição carregarem de forma estável.
  - teste que toca: `CT-FAT-01-H @destrutivo: deve criar uma medição válida a partir de um contrato vigente e roteá-la para a próxima atividade do workflow`
  - acrescentar: selecionarPrimeiraFilialMedicao sempre escolhe a primeira opção — que tende a ser a filial do contrato. Acrescentar: quando o zoom Filial da Medição oferece mais de uma opção, escolher uma DIFERENTE da filial do contrato (contrato.filial vem da grade) e afirmar que Nº da Medição, Nº da Planilha e Competência ficam preenchidos e que ds_fatcon_get_info_medicoes responde SUCCESS de forma estável (repetir a seleção 2× sem erro). Exige selecionarFilialMedicao(rotulo) em MedicaoContratoPage.
- **FSWTBC-2032** (SEV Média) — Contrato cujo código contém espaço gera medição automática normalmente.
  - teste que toca: `CT-FAT-01-H @destrutivo: deve criar uma medição válida a partir de um contrato vigente e roteá-la para a próxima atividade do workflow`
  - acrescentar: Acrescentar critério em utils/massa-contratos.js para descobrir contrato cujo código contém espaço e, no zoom Nº do Contrato, afirmar que ele é listado/selecionável e que as requisições ao ERP (filterFields de ds_fatcon_get_competencia / ds_fatcon_get_info_medicoes, lidas por request.url()) enviam o código sem espaços de borda. A geração automática para esse contrato → medicao-automatica.spec.js. Sem contrato com espaço → PRÉ-CONDIÇÃO AUSENTE.
- **FSWTBC-2634** (SEV Alta) — O fiscal abre uma medição de contrato e a grade "Itens da Medição" carrega os itens e o
  - teste que toca: `CT-FAT-01-H @destrutivo: deve criar uma medição válida a partir de um contrato vigente e roteá-la para a próxima atividade do workflow`
  - acrescentar: A grade tblItensMedicao é oculta em Início, mas o dado que a alimenta já chegou: após a cadeia resolver, ler o RESPONSE de ds_fatcon_get_info_medicoes e afirmar itens.length ≥ 1 e igual ao nº de itens da planilha (getInfoPlanilhaxContrato) — 'nenhum item do contrato fica de fora'. A renderização visível exige GRAVA_MED.
- **FSWTBC-2886** (SEV Alta) — O Fluig gera a medição de contrato e a solicitação "Realizar Medição do Contrato" aparece aberta para o responsável.
  - teste que toca: `CT-FAT-01-H @destrutivo: deve criar uma medição válida a partir de um contrato vigente e roteá-la para a próxima atividade do workflow`
  - acrescentar: Afirma só 'atividade ≠ Início'. Acrescentar: nome da atividade corrente == 'Realizar Medição do Contrato' (toBe, não not.toContain) e assignee nominal (≠ conta de integração, ≠ vazio) via /tasks; Tracker localiza a instância pelo Nº do Processo com essa atividade. A visão da Central de Tarefas do fiscal não é alcançável (outro usuário).
- **FSWTBC-3108** (SEV Média) — Realizar a medição de um contrato pelo Fluig e confirmar que a integração conclui dentro do tempo, sem erro por corte de execução.
  - teste que toca: `CT-FAT-01-H @destrutivo: deve criar uma medição válida a partir de um contrato vigente e roteá-la para a próxima atividade do workflow`
  - acrescentar: Acrescentar afirmação explícita de que nem 'Erro ao buscar as informações da medição.' nem 'Erro ao buscar as informações de Competência de Medição do Contrato' aparecem (toast), e que ds_fatcon_get_info_medicoes responde 200 dentro de um teto (medir e fixar, ex.: 60 s) — falha por corte de execução vira vermelho, não pré-condição. Gravar/encerrar exige GRAVA_MED.
- **FSWTBC-4122** (SEV Alta) — Realizar a medição de um contrato escolhendo uma competência e ter a medição, o saldo e o pedido gerados exatamente nessa competência.
  - teste que toca: `CT-FAT-01-H @destrutivo: deve criar uma medição válida a partir de um contrato vigente e roteá-la para a próxima atividade do workflow`
  - acrescentar: Acrescentar, após a criação: ler formFields (expand=formFields) da solicitação e afirmar medContrCompetencia == competência escolhida no zoom (resultado.competencia). Passo 5 (tela não carrega medição de outra competência) e pedido na competência exigem GRAVA_MED/ciclo completo.
- **FSWTBC-4266** (SEV Alta) — Conferir, antes de a medição seguir, que os dados de faturamento e o e-mail do fornecedor gravados no formulário são os do contrato correto.
  - teste que toca: `CT-FAT-01-H @destrutivo: deve criar uma medição válida a partir de um contrato vigente e roteá-la para a próxima atividade do workflow`
  - acrescentar: Acrescentar após a criação: ler formFields e afirmar emailFornecedor == emailFornecedorPlanilha, ambos não vazios, e que o CNPJ/loja do fornecedor gravado bate com o fornecedor selecionado no zoom (codigo/loja de parseFornecedorDaGrade) — nenhum campo herdado de outro contrato/medição anterior.
- **FSWTBC-4626** (SEV Alta) — Concluir uma medição de contrato cujo pedido foi gerado no Protheus e ver o processo terminar em *Notifica Fornecedor → Fim*, não em *Correção*
  - teste que toca: `CT-FAT-01-H @destrutivo: deve criar uma medição válida a partir de um contrato vigente e roteá-la para a próxima atividade do workflow`
  - acrescentar: Parte 1 é alcançável já: após a cadeia resolver, afirmar campoRevisao (auto-preenchido) == contrato.revisao lido da grade do Acompanhamento (lerLinhasDaGrade já devolve 'Nº Revisão'). Parte 2 ('Pedido:<n>' → Notifica Fornecedor → Fim, não Correção) é leitura de instância orgânica → fila-e-correcao-faturamento.spec.js.
- **FSWTBC-4792** (SEV Alta) — Concluir uma medição e conferir que o "Nº da Medição" gravado no Fluig é o mesmo número gerado no Protheus — e que, se a medição falhar, o card não fica com número divergente.
  - teste que toca: `CT-FAT-01-H @destrutivo: deve criar uma medição válida a partir de um contrato vigente e roteá-la para a próxima atividade do workflow`
  - acrescentar: Acrescentar após a criação: formFields.numMedicao não vazio e igual ao numMedicao devolvido no RESPONSE de ds_fatcon_get_info_medicoes capturado na cadeia (mesmo número nos passos Fluig×dataset). A variante de falha (Correção sem sobrescrever o número) exige GRAVA_MED → fila-e-correcao.
- **FSWTBC-5242** (SEV Alta) — Selecionar a planilha de medição de um contrato corretamente configurado no Protheus e carregar seus itens no Faturamento de Contratos
  - teste que toca: `CT-FAT-01-H @destrutivo: deve criar uma medição válida a partir de um contrato vigente e roteá-la para a próxima atividade do workflow`
  - acrescentar: O teste percorre Fornecedor→Contrato→Competência→Filial→Planilha e trata zoom de planilha vazio como pré-condição (correto sem massa conhecida). Acrescentar: afirmar ausência de toast de erro após selecionar a planilha e que o RESPONSE de ds_fatcon_get_info_medicoes tem STATUS SUCCESS com itens ≥ 1 (hoje só a ausência do diálogo 'Erro:' é verificada). A grade visível exige GRAVA_MED.

### `tests/e2e/contratos/validacoes-faturamento.spec.js` (9 casos)

- **FSWTBC-1753** (SEV Alta) — Medir a parcela restante de um contrato já medido parcialmente, com a quantidade exata do saldo, e ser aceito pelo Protheus
  - teste que toca: `CT-FAT-02-S1: lançar quantidade acima do Saldo a Medir não é alcançável pelo usuário desta automação`
  - acrescentar: Hoje afirma apenas que nenhum input quantidade___N é visível na etapa Início. Acrescentar já agora (Passo 1): comparar saldoMedirQt dos inputs ocultos/da resposta ds_fatcon_get_info_medicoes com a planilha (mesmos decimais) e CXN_VLSALD ≥ soma. Quando a etapa GRAVA_MED for alcançável: quantidade == saldo aceita; saldo + 0,000001 recusada com mensagem 'valor maior que saldo' no formulário.
- **FSWTBC-1760** (SEV Média) — Abrir uma medição para uma competência que já foi medida e ser informado com clareza de que a regra é uma medição por competência.
  - teste que toca: `CT-FAT-02-S2: competência recusada pelo Protheus deve bloquear a medição E avisar o usuário (@bug)`
  - acrescentar: O @bug prova que a recusa do Protheus é engolida sem aviso — mesmo defeito, mas para QUALQUER motivo de recusa. O caso exige que a competência JÁ MEDIDA seja recusada com mensagem que nomeie a regra 'uma medição por competência'. Acrescentar variante: em descobrirCompetenciaBloqueada, filtrar mensagemDoServidor por /medi[çc][ãa]o.*(em aberto|já)/ e afirmar que o texto exibido nomeia a regra (não só que apareceu).
- **FSWTBC-1815** (SEV Alta) — Os itens da medição carregam no formulário de Faturamento de Contratos, e uma falha da API é anunciada com mensagem tratada em vez de erro cru.
  - teste que toca: `CT-FAT-02-S2: competência recusada pelo Protheus deve bloquear a medição E avisar o usuário (@bug)`
  - acrescentar: O teste prova o silêncio na recusa de negócio. Acrescentar o ramo de FALHA DE API: interceptar GET …/dataset/search?datasetId=ds_fatcon_get_info_medicoes (page.route, status 500/corpo não-JSON) e afirmar toast/mensagem tratada ('Erro ao buscar as informações da medição.') em vez de erro cru/nenhuma reação. A listagem completa da grade tblItensMedicao exige GRAVA_MED.
- **FSWTBC-1959** (SEV Média) — Fiscal gera medição manual de um contrato que já tem medição automática na competência e o sistema trata as duas sem conflito.
  - teste que toca: `CT-FAT-02-S2: competência recusada pelo Protheus deve bloquear a medição E avisar o usuário (@bug)`
  - acrescentar: Toca a mesma recusa silenciosa. Acrescentar: escolher contrato com instância AUTOMÁTICA aberta na competência (Tracker/API v2) e afirmar que, na medição manual, ou o zoom não oferece essa competência ou a recusa é exibida nomeando a medição em andamento (não silêncio).
- **FSWTBC-2014** (SEV Média) — Abrir uma medição e, quando a planilha não existir para a competência escolhida, receber a mensagem do ERP com o detalhe que permita corrigir o cadastro.
  - teste que toca: `CT-FAT-02-S2: competência recusada pelo Protheus deve bloquear a medição E avisar o usuário (@bug)`
  - acrescentar: Mesmo defeito de superfície (recusa não exibida). Acrescentar variante 'planilha inexistente para a competência': afirmar que a mensagem exibida traz o detalhe do ERP (contrato/competência/planilha) — não a mensagem genérica — e que Nº da Medição, Nº da Planilha ficam vazios.
- **FSWTBC-2026** (SEV Média) — Fiscal localiza o fornecedor pelo nome na busca da medição manual e ele aparece na lista.
  - teste que toca: `(MedicaoContratoPage.selecionarFornecedorPorCodigoLoja, usado por todos os testes do arquivo)`
  - acrescentar: O zoom de Fornecedor só é exercitado digitando o CÓDIGO. Acrescentar teste que, para o fornecedor de um contrato vigente (nome/CNPJ lidos do dataset de contratos), busca por (a) trecho do nome, (b) CNPJ, (c) trecho com caractere especial, e afirma que a opção CÓDIGO/LOJA esperada aparece nas três — e que a chamada datasetZoom usa searchField A2_NOMECGC e devolve as colunas A2_NOMECGC/CÓDIGO/LOJA. Guarda de criação = 0.
- **FSWTBC-2680** (SEV Baixa) — Selecionar na medição uma competência já medida e o sistema explicar por que não há itens, em vez de mostrar tela vazia.
  - teste que toca: `CT-FAT-02-S2: competência recusada pelo Protheus deve bloquear a medição E avisar o usuário (@bug)`
  - acrescentar: Quase coberto pelo @bug S2 (competência recusada → tela deve explicar). Falta garantir que a competência bloqueada escolhida é a JÁ MEDIDA (filtrar mensagemDoServidor por 'medições em aberto'/'já medida') e afirmar que a explicação nomeia isso. Ramo 'competência não medida carrega itens com Saldo a Medir' → ver 2634.
- **FSWTBC-2682** (SEV Alta) — Tentar gravar uma medição cujo rateio não soma 100% e o sistema barrar com crítica explícita.
  - teste que toca: `CT-FAT-02-S4: fechar rateio contábil diferente de 100% não é alcançável pelo usuário desta automação`
  - acrescentar: Hoje afirma só que a[href='#tabRateio'] está oculta em Início. Quando GRAVA_MED for alcançável: rateio 99% → Gravar barrado com crítica explícita ('não fecha 100%') e guarda-criacao = 0; 100% → aceito. Manter o teste atual como sentinela até lá.
- **FSWTBC-4362** (SEV Média) — Iniciar uma medição do contrato 6227-2025-5303 escolhendo a planilha 000002 e ver os itens carregarem — sem "Não existem itens a serem medidos".
  - teste que toca: `(cadeia de zooms de encontrarMedicaoComSaldo / MedicaoContratoPage.selecionarPrimeiraPlanilha)`
  - acrescentar: selecionarPrimeiraPlanilha só escolhe a primeira opção. Acrescentar: para contrato cujo zoom Nº da Planilha oferece > 1 opção (000001/000002/000003), selecionar cada uma das não-primeiras e afirmar ausência do toast 'Não existem itens a serem medidos para a planilha …' e RESPONSE com itens ≥ 1. Exige método selecionarPlanilha(rotulo) em MedicaoContratoPage.

### `tests/e2e/acompanhamento-contratos/grade-contratos.spec.js` (2 casos)

- **FSWTBC-1463** (SEV Média) — Incluir um contrato no GCT com caractere especial no número e verificar que a validação recusa (ou normaliza) e que o Fluig continua resolvendo os contratos legados
  - teste que toca: `deve filtrar a grade pelo número do contrato`
  - acrescentar: Filtra por um contrato vigente qualquer. Acrescentar caso que descobre na grade (lerLinhasDaGrade) contratos com '/', '.' ou espaço no número (ex.: 00006/2022-2901, 00002.2025.3517), filtra por eles, abre Planilha e Informações e afirma que getInfoPlanilhaxContrato responde 200 com linhas (aguardarDataset). Passos 5–6 (inclusão no GCT) não são automatizáveis — cadastro no ERP.
- **FSWTBC-3959** (SEV Alta) — Revisar um contrato com realinhamento de valor e conferir, no Protheus e no Acompanhamento de Contratos, que Quantidade, Quantidade Medida e Saldo dos itens da planilha ficam coere
  - teste que toca: `CT-ACC-02-H — deve oferecer Planilha, Solicitação de Compra e Informações na linha do contrato`
  - acrescentar: Só afirma que o ícone Planilha é visível. Acrescentar abrirPlanilha() em AcompanhamentoContratosPage e um teste que, para contratos vigentes amostrados, afirma o invariante por item: Quantidade Medida ≤ Quantidade e Saldo == Quantidade − Quantidade Medida (vale para qualquer contrato, sem oráculo externo). Passo 5 (Saldo a Medir no Faturamento == saldo lido) cruza com ds_fatcon_get_info_medicoes. Revisão no Protheus (passos 1–3) não automatizável.

### `tests/e2e/plataforma/erros-de-console.spec.js` (1 casos)

- **FSWTBC-2074** (SEV Alta) — Aprovador abre a medição de contrato para aprovar e a tela carrega sem erro de JavaScript.
  - teste que toca: `CT-PLT-06-S1: <rota> deve carregar sem erro de console não catalogado`
  - acrescentar: ROTAS_CHAVE não inclui o formulário do Faturamento. Acrescentar a rota /portal/p/1/pageworkflowview?processID=wf_faturamento_contratos (título 'Cassi - Fluig Plataforma - Movimentar Solicitação') e, dentro do iframe, esperar o heading do formulário antes de avaliar pageerror/console.error. As etapas de Validação CSE/Fiscal (com bloco Aprovador/Aprovar?/Justificativa) e a medição sem itens não são alcançáveis pela conta (CT-FAT-02-S3).

### `tests/e2e/compras/ciclo-solicitacao-compras.spec.js` (1 casos)

- **FSWTBC-3107** (SEV Alta) — Enviar planilha de rateio com valor negativo e confirmar que o sistema recusa o arquivo — e que a planilha continua carregando normalmente na medição.
  - teste que toca: `deve rejeitar o upload de planilha de rateio com formato inválido`
  - acrescentar: Cobre só arquivo de FORMATO inválido na SC clássica, e afirma que nada foi importado/criado — sem afirmar mensagem. Acrescentar fixture qa-planilha-rateio-negativa.xlsx: afirmar recusa com crítica que identifica linha/valor, grade não populada com valor negativo, e que a mesma planilha só com valores válidos popula a grade. O lado (b) Faturamento exige GRAVA_MED → rateio-medicao.spec.js.

## IMPLEMENTAR — onde cada grupo deve nascer

Agrupados pelo arquivo proposto. Os dois primeiros grupos são **de leitura** (instâncias orgânicas via Tracker visão *Faturamento de Contratos* e `/process-management/api/v2/requests/{id}` + `/tasks`) e podem ser implementados **hoje**, sem o papel de fiscal; os demais dependem da etapa GRAVA_MED ou de ação no ERP.

### `tests/e2e/contratos/fila-e-correcao-faturamento.spec.js` (21 casos)

- **FSWTBC-646** (SEV Média) — Medição que falha na integração cai para o grupo de correção, e não para todos os usuários do grupo do contrato.
  - Nenhum teste lê tarefas em Correção (117). Leitura: listar instâncias de Faturamento com tarefa NOT_COMPLETED na etapa 'Correção' e afirmar que o assignee/pool é o grupo de correção do faturamento (um único grupo), nunca a lista de usuários do grupo do contrato.
- **FSWTBC-696** (SEV Alta) — Verificar que nenhuma medição fica órfã em "Aguarda processamento Fila Protheus" e que a fila é consumida dentro do SLA
  - Monitor de fila, ainda inexistente. Leitura via Tracker/API v2: nenhuma instância aberta em '182 Aguarda processamento Fila Protheus' há mais de 1 h (comparar startDate da tarefa com agora); toda tarefa em 182 tem assignee efetivo. A parte ZZZ depende do widget Logs Protheus ser alcançável pela conta — medir antes.
- **FSWTBC-1035** (SEV Alta) — O responsável grava a medição no Faturamento de Contratos e a gravação conclui, sem exceção transacional do servidor.
  - Gravar Medição (105/114) não é alcançável pela automação. Como leitura: para instâncias orgânicas que passaram por 105, o comentário da atividade não contém 'TransactionRolledback'/'exception' e a instância avançou para 182/36. Quando o papel for concedido, virar teste destrutivo completo.
- **FSWTBC-1211** (SEV Alta) — O responsável encerra a medição no Faturamento de Contratos e o processo segue para a geração do pedido, sem erro.
  - Encerrar → 36 Criar Pedido → 60 Fim. Leitura de instâncias orgânicas finalizadas: sequência de etapas no /tasks contém 105 → 182 → 162 → 36/41 → 60 (ou 38) sem 117; comentário de encerramento sem 'Falha'.
- **FSWTBC-2248** (SEV Alta) — Ver que uma falha ao encerrar medição produz uma mensagem legível no Fluig, em vez de estourar dentro da própria rotina de erro.
  - Falha ao encerrar → mensagem legível, não exceção dentro da rotina de erro. Leitura: para instâncias orgânicas em Correção (117), o comentário da 182/105 é não vazio, não contém 'Erro desconhecido', 'NullPointer', 'undefined' nem stack trace, e descreve a validação do ERP.
- **FSWTBC-3150** (SEV Alta) — Concluir uma medição no Faturamento de Contratos e conferir, no Histórico, que a atividade "Criar Pedido de Compras" encerra a medição no ERP sem "Falha na Encerrar da Medição"
  - Histórico de 'Gravar Medição' e 'Criar Pedido de Compras' com 'Integração executada com sucesso', sem 'Falha na Encerrar da Medição'. Leitura de instâncias orgânicas finalizadas hoje/ontem.
- **FSWTBC-3549** (SEV Alta) — Encerrar a medição de um contrato e conferir que a integração com o ERP conclui, registrando tempo de execução no histórico.
  - Encerramento via 'Direcionar Processo para' na Validação CSE com Histórico 'Integração executada com sucesso - Tempo de Execução <N> s'. Etapa de validação não alcançável (CT-FAT-02-S3). Leitura de Histórico de instâncias orgânicas.
- **FSWTBC-3599** (SEV Alta) — Concluir uma medição no Fluig e conferir que ela existe no Protheus, cruzando pelo Tracker antes de dar o processo por encerrado.
  - Medição concluída no Fluig existe no Protheus: Tracker lista a medição com Nº Medição e Medição Acumulada/Saldo do Contrato refletem no modal Informações do Contrato. Leitura de instância orgânica finalizada + modal do Acompanhamento (AcompanhamentoContratosPage precisa de abrirInformacoes()).
- **FSWTBC-3956** (SEV **Alta**) — Medir o tempo de geração e encerramento das medições de um contrato de alto volume e confirmar que os demais processos do contrato não ficam bloqueados.
  - Tempo de processamento de contrato com 100+ medições e ausência de bloqueio global. Medição de desempenho do schedule — só como monitor de leitura (tempo entre startDate e Fim das instâncias automáticas do mesmo contrato). Baixa prioridade para suíte E2E.
- **FSWTBC-4121** (SEV Alta) — Acompanhar uma medição de contrato enviada ao Protheus e vê-la sair de "Aguarda processamento Fila Protheus" em minutos, com o retorno visível no Fluig.
  - 182 encerrada e processo em 162 em minutos, retorno visível no Histórico. Leitura de instâncias orgânicas: duração da tarefa 182 (endDate−startDate) ≤ teto; comentário com 'Pedido:<n>' ou mensagem real.
- **FSWTBC-4192** (SEV Alta) — Encerrar uma medição com serviço prestado e itens medidos e ter o processo terminar em "Fim - Faturamento de Contratos" com pagamento — nunca em "Fim - Sem Pagamento".
  - Com serviço prestado e itens medidos, fim em '60 Fim - Faturamento de Contratos', nunca '38 Fim - Sem Pagamento'. Leitura: instâncias orgânicas finalizadas com valor total > 0 (formFields) terminam em 60 e passam por 192→105→182→162→41.
- **FSWTBC-4551** (SEV Alta) — Faturamento de contrato integra do início ao fim após uma liberação (regressão pós-MUD)
  - Regressão pós-MUD ponta a ponta: 'Integração executada com sucesso' em Busca Informações do Contrato e em Gravar/Encerrar; saída da fila em minutos; Fim. Parte 'Busca Informações' também entra no APRIMORAR do 629 (ciclo); o resto é leitura de instâncias orgânicas.
- **FSWTBC-4552** (SEV Alta) — Medição gravada com sucesso no ERP avança na fila e não cai em *Correção*
  - Retorno 200/'Medicao gravada com sucesso.' ⇒ destino Fim/Pagamento?, nunca Correção. Leitura: instâncias orgânicas cujo comentário da 182 contém 'gravada com sucesso' não têm tarefa na etapa 117.
- **FSWTBC-4670** (SEV Alta) — Gravar uma medição e ver a fila Fluig×Protheus processá-la em minutos — com o erro real gravado quando a gravação falha
  - Fila em minutos; sucesso registra 'Pedido:<n>', falha registra a mensagem real do ERP (não 'Erro desconhecido'). Leitura de instâncias orgânicas em 182/162/117.
- **FSWTBC-4759** (SEV Alta) — Enviar uma medição que o ERP recusa (saldo insuficiente) e conferir que a recusa volta ao Fluig, desvia a solicitação para Correção e mostra a mensagem.
  - Recusa do ERP (saldo insuficiente) volta ao Fluig: sai de 182 em minutos, cai em Correção com mensagem legível no Histórico. Provocar exige GRAVA_MED; observar é leitura de instâncias orgânicas em 117.
- **FSWTBC-4790** (SEV Alta) — Levar uma medição de Faturamento de Contratos à atividade de correção e conferir que ela cai no grupo responsável, com dono definido.
  - Mesmo oráculo do FSWTBC-646: tarefa em Correção com assignee/pool definido (não vazia, não 'admin' sem chosenAssignees).
- **FSWTBC-4829** (SEV Alta) — Verificar que uma medição de contrato sai de "Aguarda processamento Fila Protheus" dentro do SLA (fila de Contratos consumida)
  - Mesmo monitor do FSWTBC-696: nenhuma 182 aberta > 1 h; responsável definido; Histórico com 'Gravar Medição … Integração executada'.
- **FSWTBC-4842** (SEV Alta) — Encerrar uma medição e confirmar que o pedido de compra correspondente foi gerado antes de o fornecedor ser notificado
  - Pedido Gerado? = Sim → Notifica Fornecedor (41) → Fim (60), sem Correção; Msg Medicao com o nº do pedido. Leitura de instâncias orgânicas finalizadas.
- **FSWTBC-5011** (SEV Alta) — Medição encerrada no Fluig gera pedido com número válido no ERP e não fica pendente por número em branco
  - Pedido com número válido no ERP, sem tarefa de Correção; ZZZ processada uma vez. Leitura de instâncias orgânicas + (se acessível) widget ZZZ.
- **FSWTBC-5185** (SEV Alta) — Encerrar uma medição com muitos itens e rateios e ver *Gravar/Encerrar Medição* concluir em segundos — sem
  - Gravar/Encerrar (105) em segundos, sem retentativa, fila em minutos. Leitura: duração das tarefas 105 e 182 de instâncias orgânicas ≤ teto; 105 aparece uma única vez no histórico.
- **FSWTBC-5186** (SEV Alta) — Ter uma medição recusada pelo Protheus (bloqueio PCO, mensagem de várias linhas) e ver o motivo **completo** no Histórico da
  - Mensagem PCO integral (várias linhas: ERROR_PCO, cubo, saldo previsto × realizado, CO, classe) no comentário da 182/117. Leitura de instâncias orgânicas em Correção com ERROR_PCO: comentário não truncado (contém todos os marcadores).

### `tests/e2e/contratos/medicao-automatica.spec.js` (12 casos)

- **FSWTBC-618** (SEV Alta) — Verificar que a medição automática da madrugada abre um processo de Faturamento de Contratos por filial e chega ao Fiscal de Serviço sem parar na fila
  - Nenhum teste lê instâncias abertas pelo robô. Nasce como teste de leitura: Tracker (Filtrar por = Faturamento de Contratos, Data = hoje) + API v2: para cada contrato com instância do Usuário Integrador hoje, uma instância por filial, Atividade Atual = 'Realizar Medição do Contrato', assignee nominal (não admin/pool), Histórico sem linha de erro. Sem massa do dia → PRÉ-CONDIÇÃO AUSENTE.
- **FSWTBC-1689** (SEV Alta) — Verificar que o robô de medição automática abre, na madrugada, um Faturamento de Contratos por filial de cada contrato elegível e que nenhum deles fica preso na fila
  - Idêntico ao FSWTBC-618 acrescido do cruzamento com 'Dia Med Auto' do contrato e das três linhas do Histórico (integração ok). Mesmo teste de leitura.
- **FSWTBC-1777** (SEV Alta) — A medição gerada automaticamente chega ao Fluig com os dados do contrato, e o histórico da solicitação registra a integração bem-sucedida.
  - Medição automática com Nº da Medição/Nº da Planilha preenchidos e itens. Leitura: formFields (expand=formFields) de instância do Usuário Integrador: numMedicao e numPlanilha não vazios, itens___N ≥ 1, Histórico 'Busca Informações do Contrato' com sucesso.
- **FSWTBC-1904** (SEV Alta) — A medição automática chega ao formulário com os dados do contrato e da competência já preenchidos.
  - Mesmo oráculo do FSWTBC-1777: seção Informações da Medição preenchida na instância automática (formFields numContrato, competencia, numMedicao, numPlanilha não vazios).
- **FSWTBC-1933** (SEV Alta) — Conferir que a medição automática de um contrato é disparada no dia configurado na planilha, e não no dia antigo do cabeçalho do contrato.
  - Competência oferecida no zoom e a disparada correspondem ao dia da planilha, não ao cabeçalho. Leitura: ds_fatcon_get_competencia para contrato com dia de planilha ≠ dia do cabeçalho (descoberta via datasets do GCT) vs data de criação da instância automática.
- **FSWTBC-1934** (SEV Alta) — Conferir o disparo automático de medições da madrugada: uma instância de Faturamento por contrato/filial elegível, sem erro
  - tests/e2e/portais/tracker-compras.spec.js só filtra a visão padrão (SC) por Status. Nasce no spec de medição automática, estendendo TrackerComprasPage com filtrarPor('Faturamento de Contratos') e filtro de data; afirmar uma linha por contrato/filial elegível, Solicitante = Usuário Integrador, janela ~03h, atividade 'Realizar Medição do Contrato', Responsável = fiscal.
- **FSWTBC-3007** (SEV Alta) — Medição disparada manualmente calcula a mesma data de vigência da planilha que a medição automática.
  - Data de vigência da planilha idêntica no caminho manual e automático. Leitura: formFields de uma instância automática vs. os campos auto-preenchidos da cadeia manual (ciclo) para o MESMO contrato/planilha — comparar sem gravar (guarda-criacao).
- **FSWTBC-3266** (SEV Alta) — Deixar o disparo automático de medição rodar no dia configurado e confirmar que contratos fora da vigência não recebem medição
  - Contratos fora da vigência não recebem medição automática. Leitura: cruzar instâncias automáticas de hoje (Tracker/API) com a grade do Acompanhamento — nenhuma para contrato com Status Finalizado/Cancelado/Data Fim < hoje; contrato vigente de controle tem a sua.
- **FSWTBC-3312** (SEV Alta) — Conferir que a medição automática abriu as solicitações no Fluig para as quatro periodicidades antes de os jobs do Protheus serem executados.
  - Quatro periodicidades abertas no Fluig antes dos jobs: instâncias com Solicitante = Usuário Integrador e competência correta por periodicidade. Leitura via Tracker/API; massa descoberta por CNA_XPERIOD (dataset).
- **FSWTBC-3362** (SEV Alta) — Verificar que as medições automáticas do dia são disparadas para todos os contratos elegíveis, em todas as filiais.
  - Uma medição por contrato elegível em todas as filiais, sem duplicidade. Leitura: agrupar instâncias automáticas do dia por contrato+filial → contagem 1; conjunto == elegíveis.
- **FSWTBC-3614** (SEV Alta) — Configurar contrato/planilha para medição automática e conferir que o processo de medição é aberto na competência esperada.
  - Configuração CNA_XPERIOD/XFREQU/XMULTI é no SIGAGCT (não automatizável). Parte observável: competência atual/passada geram instância; futura não; contrato sem saldo não gera — cruzando datasets do GCT com instâncias automáticas.
- **FSWTBC-4247** (SEV Alta) — Medição automática agendada para o último dia do mês é gerada e aparece na fila de medições do Fluig
  - Medição automática no último dia do mês (schedule 04:00). Leitura no primeiro dia útil seguinte: instância automática do contrato com Data Recb Me = último dia; ZZZ Status S (widget). Dependente de calendário — declarar pré-condição de data.

### `tests/e2e/contratos/realizar-medicao-itens.spec.js` (16 casos)

- **FSWTBC-652** (SEV ?) — Tentar movimentar uma medição sem itens carregados e sem prestação de serviço, e confirmar que o Fluig barra e não integra valor zero ao Protheus.
  - Exige a aba Itens vazia e 'Houve Prestação de Serviço? = Não' em Realizar Medição (GRAVA_MED). Afirmar recusa do Enviar com crítica de ausência de itens e guarda-criacao/captura do start = 0 tentativas de gravar valor zero.
- **FSWTBC-1690** (SEV Média) — Medir um contrato importando a planilha de itens preenchida, a partir do modelo baixado na própria tela
  - Download do modelo + upload de planilha de itens: botões só existem no painel GRAVA_MED. Afirmar download com nome exato via page.waitForEvent('download'), toast 'Importado N registros válidos.', grade refletindo quantidade/desconto e Valor Total recalculado.
- **FSWTBC-1903** (SEV Alta) — Realizar a medição de um contrato com centenas de itens e ver o processo concluir sem cair por tempo ou transação.
  - Medição com centenas de itens. Além de GRAVA_MED, hoje NENHUMA planilha tem ≥100 itens (medido) → nasceria em PRÉ-CONDIÇÃO AUSENTE. Registrar o critério de massa em utils/massa-contratos.js (planilha ≥ N itens) para o dia em que existir.
- **FSWTBC-2913** (SEV Alta) — O fiscal baixa a planilha modelo de itens da medição, preenche as quantidades e importa
  - Download 'Planilha de Medicao.xlsx' com cinco colunas e células protegidas; preencher quantidades e importar. Exige GRAVA_MED; parse do xlsx baixado para afirmar colunas/proteção.
- **FSWTBC-3116** (SEV Média) — Selecionar uma planilha semi-fixa na medição manual e confirmar que os itens carregam, ou que o usuário é avisado quando não há item.
  - Planilha semi-fixa: itens carregam com Saldo a Medir e Valor Unitário, Quantidade editável, botões de planilha habilitados; ou aviso quando sem item. Exige GRAVA_MED. Massa: contrato com CNL_CTRFIX=3 descoberto por dataset.
- **FSWTBC-3573** (SEV Alta) — Conferir a regra da flag "Houve Prestação de Serviço?" na medição: com **Não**, a medição segue com valores zerados; com **Sim**, ao menos um item precisa ter quantidade diferente
  - Regra da flag 'Houve Prestação de Serviço?': Não → aceita com total 0; Sim + todos zerados → barra exigindo item ≠ 0. O rádio vive no painel GRAVA_MED. Capturar o start/movimento e afirmar aceitação/recusa + guarda = 0 no ramo negativo.
- **FSWTBC-3765** (SEV Alta) — Informar desconto no item de uma medição cujo contrato é de planilha fixa, e conseguir concluir a medição com o desconto aplicado.
  - Desconto em planilha fixa: Quantidade readonly, Valor Desconto editável, medição conclui com desconto. Exige GRAVA_MED.
- **FSWTBC-3766** (SEV Alta) — Digitar um desconto sem vírgula na medição de planilha semi-fixa e conferir que o campo formata o valor corretamente ao sair.
  - Máscara do desconto no blur: '5' → '5,00', '1500' → '1.500,00'. Campo só existe em GRAVA_MED. Exige tarefa na etapa.
- **FSWTBC-3881** (SEV Alta) — Informar desconto numa medição e conferir que ele chega ao Protheus e reduz o saldo do contrato.
  - Desconto reduz Medição Acumulada/Saldo pelo valor líquido. Exige GRAVA_MED + ciclo completo até Fim + releitura do modal Informações do Contrato. Bloqueado por etapa.
- **FSWTBC-3928** (SEV Média) — Baixar a planilha padrão de itens da medição, preenchê-la e reenviá-la por upload no Faturamento de Contratos.
  - Botão de download produz arquivo (não inerte), arquivo contém os produtos, upload importa com confirmação. Exige GRAVA_MED; usar page.waitForEvent('download') e parse do xlsx.
- **FSWTBC-3940** (SEV Média) — Importar a planilha de itens (produtos) na medição de um contrato sem receber crítica indevida de campos obrigatórios.
  - Importar planilha de itens sem crítica indevida de obrigatórios; grade populada. Exige GRAVA_MED.
- **FSWTBC-3988** (SEV Alta) — Após importar a planilha na medição, conferir que os valores dos itens continuam sendo exibidos.
  - Após importar planilha, Saldo a Medir/Quantidade/Valor Unitário/Desconto/Total não zerados; Total = Qtd × Unit − Desc. Exige GRAVA_MED. Regressão de correção emergencial — alta prioridade quando a etapa for alcançável.
- **FSWTBC-4648** (SEV Alta) — Informar a quantidade 1.084.017 na medição do contrato e ver o mesmo número no total do formulário e na medição gravada
  - Quantidade 1.084.017 com máscara pt-BR e Valor Total coerente; '1.084,017' → total 1.084,02. Campo só existe em GRAVA_MED.
- **FSWTBC-4791** (SEV Alta) — Informar quantidade com seis casas decimais na medição de um contrato e conferir que o campo aceita, o total acompanha a precisão e o comportamento é o mesmo em qualquer processo.
  - Quantidade com 6 casas: '1,234567' mantido, 7ª casa rejeitada, '1234,5' → '1.234,500000'. Campo só existe em GRAVA_MED.
- **FSWTBC-5145** (SEV Média) — Informar um desconto num item da medição de contrato e ver o **Valor Total** recalculado em tela na hora
  - Desconto recalcula Valor Total em tela (Qtd × Unit − Desc) e aviso 'O valor do desconto não pode ser maior que o valor total.' uma vez por linha. Campo só existe em GRAVA_MED.
- **FSWTBC-5163** (SEV Alta) — Carregar uma medição com muitos itens e rateios e disparar o encaminhamento sem a tela entrar em varredura contínua
  - Carga com muitos itens/rateios sem varredura contínua (um rescan, tela responsiva, um único aviso). Exige GRAVA_MED e massa de planilha grande (hoje nenhuma com ≥100 itens).

### `tests/e2e/contratos/rateio-medicao.spec.js` (14 casos)

- **FSWTBC-634** (SEV ?) — Ao trocar a planilha/competência de uma medição, o rateio da medição anterior é descartado e recarregado.
  - A grade de Rateio só existe na etapa GRAVA_MED; MedicaoContratoPage não expõe rateio. Cenário: carregar planilha A, ler linhas de rateio, trocar competência/planilha B, afirmar que a grade tem SÓ as linhas de B (nenhuma de A, sem soma) e que a soma volta a 100%.
- **FSWTBC-1651** (SEV Alta) — O usuário informa percentuais de rateio que somam exatamente 100% e o Fluig aceita o envio, sem resíduo de ponto flutuante.
  - Rateio = 100% aceito sem resíduo de ponto flutuante. CT-CMP-02-S2 cobre o análogo na SC clássica, não no Faturamento. Exige GRAVA_MED: informar 33,33/33,33/33,34 e 3×33,33333333+… e afirmar que o Enviar é aceito (start capturado com o rateio) sem 'A soma dos percentuais de rateio diferem de 100%'.
- **FSWTBC-1707** (SEV Alta) — Item da medição com quantidade zerada não exige rateio e não impede o envio da medição.
  - Item com quantidade 0 não exige rateio; item medido continua exigindo 100%. Exige GRAVA_MED. Afirmar envio aceito com um item zerado sem rateio e recusado quando o item medido está < 100%.
- **FSWTBC-1893** (SEV Alta) — Gravar uma medição cujo item tenha muitas linhas de rateio e ver todas chegarem ao ERP com o sequencial correto.
  - Mais de 99 linhas de rateio num item, sequencial correto e gravação ok. Exige GRAVA_MED + planilha de rateio com 100+ linhas em fixtures/anexos/. Afirmar grade com N linhas e Histórico 'Integração executada com sucesso'.
- **FSWTBC-1894** (SEV Alta) — Encerrar uma medição com mais de 99 linhas de rateio e obter todos os itens gravados no ERP, sem chave duplicada
  - Variante de encerramento do 1893: não cair em Correção (117); Msg Medicao sem 'duplicate key'. Exige GRAVA_MED e leitura do Histórico/ZZZ.
- **FSWTBC-2131** (SEV Média) — Subir a planilha de rateio de uma medição com percentuais de duas casas decimais e ver o total fechar 100% sem exigir precisão artificial.
  - Rateio com duas casas somando 100 aceito, sem exigir precisão artificial. Exige GRAVA_MED + upload de planilha de rateio.
- **FSWTBC-2142** (SEV Alta) — O fiscal encerra uma medição cujo rateio fecha 100% e o encerramento é aceito, sem falha de soma em ponto flutuante.
  - 33,33333333+33,33333333+33,33333334 reconhecido como 100% no encerramento. Exige GRAVA_MED (etapa Fiscal). Variante do 1651.
- **FSWTBC-2244** (SEV Média) — Ao subir a planilha de rateio, o usuário é avisado na hora se o percentual não fecha 100% — não só quando tenta gravar a medição.
  - Crítica no ato do upload da planilha de rateio ('Item excedeu 100%' com percentual; zerado/em branco), antes de gravar. Exige GRAVA_MED. Guarda de criação = 0 para provar que nada foi gravado.
- **FSWTBC-2548** (SEV Alta) — Importar na medição uma planilha de rateio que soma exatamente 100% e o Fluig aceitar sem acusar divergência.
  - Importar planilha de rateio que soma exatamente 100% e não acusar divergência; célula a célula igual ao arquivo. Exige GRAVA_MED.
- **FSWTBC-2688** (SEV Alta) — Importar na medição uma planilha de rateio com valores formatados como moeda e o sistema interpretá-los sem erro de classe de valor.
  - Planilha de rateio com valores formatados como moeda (R$, ponto de milhar, vírgula) importa sem 'erro de classe de valor'; Classe de Valor preenchida por linha. Exige GRAVA_MED + fixtures em variantes de formatação.
- **FSWTBC-2711** (SEV Alta) — Fiscal informa o rateio da medição do contrato somando exatamente 100% e o sistema aceita, sem acusar divergência.
  - Rateio digitado somando exatamente 100% aceito sem 'A soma dos percentuais de rateio diferem de 100%'. Exige GRAVA_MED. Mesma família de 1651/2142.
- **FSWTBC-2833** (SEV Alta) — Fiscal repete a medição do contrato recorrente (Uber) com planilha 100% conferida e a validação de rateio não acusa divergência.
  - Reincidência do 2711 num contrato recorrente em duas competências. Mesmo teste parametrizado por competência.
- **FSWTBC-3985** (SEV Alta) — Importar a planilha de rateio no Faturamento de Contratos e conferir que as linhas são efetivamente registradas.
  - Linhas da planilha de rateio efetivamente registradas: uma linha na grade por linha do arquivo com Item/%/CC/Classe. Exige GRAVA_MED.
- **FSWTBC-4540** (SEV Alta (contábil)) — Fiscal registra medição com planilha de rateio sem linha zerada e o pedido nasce com rateio completo
  - Linha de rateio com 0 recusada na origem; soma exata 100 por item; item zerado não enviado ao ERP; pedido com mesmo nº de linhas. Exige GRAVA_MED + leitura do pedido no Tracker.

### `tests/api/faturamento-datasets.spec.js` (3 casos)

- **FSWTBC-2024** (SEV Alta) — Fiscal confere que o valor unitário da medição no Fluig é idêntico ao do contrato, sem truncar casas decimais.
  - Valor Unitário com 6 casas na grade: a grade só é visível em GRAVA_MED. O que dá para afirmar hoje sem UI: no RESPONSE de ds_fatcon_get_info_medicoes, valorUnitario de cada item == CNE_VLUNIT da planilha (getInfoPlanilhaxContrato) sem truncamento (comparar como string/6 casas).
- **FSWTBC-3517** (SEV Alta) — Realizar a medição de um contrato de planilha fixa e conferir que a quantidade trazida não excede o saldo a medir.
  - Planilha fixa: Quantidade readonly = CNE_QUANT ≤ Saldo a Medir; botões desabilitados. UI exige GRAVA_MED. Parte sem UI: no RESPONSE de ds_fatcon_get_info_medicoes, quantidade ≤ saldoMedirQt para todo item de contrato fixo (CNL_CTRFIX=0 tipo fixo).
- **FSWTBC-4447** (SEV Média) — Abrir uma medição no Fluig para um contrato de planilha SEMI FIXA e obter os itens da planilha liberados para informar quantidade
  - Planilha SEMI FIXA: itens liberados com quantidade editável. UI exige GRAVA_MED. Sem UI: dataset de tipo de planilha devolve CNL_CTRFIX=3 para o tipo 002 e 0 para 001/003.

### `tests/e2e/contratos/logs-protheus-zzz.spec.js` (2 casos)

- **FSWTBC-2556** (SEV Alta) — Após uma medição ser gravada, o contrato recebe o agendamento da medição seguinte e a
  - Após gravar, nova linha em Medicoes ZZZ com a competência seguinte. Depende do widget Logs Protheus (ZZZ) ser alcançável pela conta — nenhum Page Object o modela. Medir acesso antes; se alcançável, nasce em tests/e2e/contratos/logs-protheus-zzz.spec.js.
- **FSWTBC-3989** (SEV **Alta**) — Acompanhar a fila de medição (ZZZ) drenando de ponta a ponta, com a máquina de estados N→A→M→F→P e erro visível.
  - Máquina de estados da fila ZZZ (N→A→M→F→P, E com erro). Depende do widget Logs Protheus; nenhum Page Object o modela. Medir acesso antes.

### `bloqueado: exige ação no Protheus` (7 casos)

- **FSWTBC-3206** (SEV Alta) — Antes de solicitar revisão de um contrato, consultar no Fluig se existe processo em aberto para ele e confirmar que a revisão é bloqueada enquanto houver medição em andamento.
  - A revisão é ação no SIGAGCT (não automatizável). Parte observável: Tracker visão FC filtrando por Número do Contrato + Status Abertos lista o processo em andamento (extensão de TrackerComprasPage). Recusa da revisão e Nº Revisão inalterado → bloqueado por ERP.
- **FSWTBC-3832** (SEV Alta) — Aprovar uma medição de contrato com planilha do tipo fixa, sem alterar valores, e confirmar que o processo avança.
  - Aprovação (27) de medição de planilha fixa sem editar: campos readonly e aprovação conclui sem 'informar valor em ao menos um item'. Etapa de aprovação não alcançável (CT-FAT-02-S3 prova que a conta não está em nenhum grupo).
- **FSWTBC-3860** (SEV Alta) — Aprovar duas medições do mesmo contrato quase ao mesmo tempo e conferir que cada processo ficou com o seu número de medição e com o seu item.
  - Duas aprovações quase simultâneas → números de medição distintos, sem troca de item. Exige papel de aprovador em duas instâncias + leitura de numMedicao/itens por formFields. Bloqueado por papel.
- **FSWTBC-3864** (SEV Alta) — Concluir uma medição no Faturamento de Contratos de um contrato que passou por eliminação de resíduo e revisão, e conferir no Histórico que a medição encerra e o pedido é gerado
  - Eliminação de resíduo + revisão são ações no Protheus. Parte observável (Histórico 'Integração executada com sucesso' em Gravar/Encerrar e pedido gerado) → leitura de instância orgânica do contrato revisado.
- **FSWTBC-4775** (SEV Alta) — Submeter uma SC do tipo Contrato com rateio em três centros de custo (dois sem saldo) e conferir que a trava orçamentária não bloqueia o contrato e, ao bloquear um Pedido, lista to
  - SC tipo Contrato não bloqueada por PCO; trava só na medição, listando todos os CCs sem saldo. tests/e2e/portais/alcadas-orcamentaria.spec.js prova que a SC própria para na Validação Orçamentária sem controle para a conta — a etapa 'Verificação orçamentária' e a medição são inalcançáveis. Parte observável: instâncias orgânicas em 117 com ERROR_PCO listam mais de um CC na mensagem.
- **FSWTBC-5162** (SEV Alta) — Realizar medição de um contrato cujo tipo de planilha foi alterado (*Alterar Tp. Planilha*) e ver os itens da planilha disponíveis —
  - 'Alterar Tp. Planilha' é ação no SIGAGCT. Parte observável: ambas as planilhas do contrato alterado listam itens com Saldo a Medir > 0 no zoom/dataset (ds_fatcon_get_info_medicoes) sem 'Não existem itens a serem medidos'.
- **FSWTBC-5240** (SEV Alta) — Encerrar uma medição de contrato cuja revisão foi alterada no Protheus depois da abertura da solicitação de Faturamento
  - Revisão alterada no Protheus depois da abertura → numRevisao atualizado pelo dataset sem mudar de atividade. Exige alterar revisão no SIGAGCT. Parte observável: instâncias orgânicas cujo Histórico traz a observação de ajuste mantêm a mesma atividade/responsável.

### `sem arquivo viável hoje — lacuna documentada em docs/cobertura.md; se o widget de e-mail/log ficar acessível, tests/e2e/notificacoes/` (1 casos)

- **FSWTBC-3771** (SEV Alta) — Confirmar que um processo iniciado na base de homologação não dispara e-mail para endereço de fornecedor externo.
  - tests/e2e/notificacoes/disparo-multicanal.spec.js declara que e-mail não é verificável (sem caixa/SMTP/admin) e o próprio caso diz que o ticket fechou sem descrever a correção. Sem oráculo: só seria testável com log de envio (webdesk/admin) ou caixa de captura. Registrar como lacuna com motivo em docs/cobertura.md.

## Testes existentes mais fracos do que o título sugere

- `ciclo-faturamento.spec.js :: CT-FAT-01-H @destrutivo: deve criar uma medição válida … e roteá-la para a próxima atividade` — a única assertion de negócio é `nomeAtividade.toLowerCase() not.toContain('início')`. Não afirma qual atividade, quem é o responsável, nem lê o Histórico (onde "Busca Informações do Contrato" registra sucesso/erro). A medição "válida" é presumida pela ausência do diálogo `Erro:`; falha de API (não-negócio) vira PRÉ-CONDIÇÃO AUSENTE em vez de vermelho.
- `faturamento-contratos.spec.js :: CT-FAT-01-H: deve abrir com os campos de seleção do Protheus` — só `toBeVisible` nos cinco zooms + painel oculto. Cobre abertura, não o caso CT-FAT-01-H do catálogo (medição + 3 validações).
- `validacoes-faturamento.spec.js :: CT-FAT-02-S1 / CT-FAT-02-S4` — os títulos citam "quantidade acima do saldo" e "rateio ≠ 100%", mas o corpo afirma apenas que o campo/aba está oculto na etapa Início. São sentinelas de alcance, não testes das regras.
- `validacoes-faturamento.spec.js :: CT-FAT-02-S3` — não reprova validação nenhuma: lê o menu "Tarefas em pool" e afirma que nenhum grupo casa com /fiscal|cse|medição|contrato/.
- `tracker-compras.spec.js` — "deve listar processos reais ao filtrar por status" só conta linhas > 0 na visão padrão (SC). `TrackerComprasPage` não sabe trocar "Filtrar por" para Faturamento de Contratos nem filtrar por contrato/data.
- `grade-contratos.spec.js :: CT-ACC-02-H — deve oferecer Planilha, Solicitação de Compra e Informações` — três `toBeVisible` em ícones; nunca abre a Planilha, logo Quantidade/Quantidade Medida/Saldo (3959, 3599) não têm oráculo.
- `notificacoes/disparo-multicanal.spec.js :: CT-NOT-01-H` — o próprio título admite: e-mail não é verificável; só consulta o Global Alert API. Não serve para 3771.
