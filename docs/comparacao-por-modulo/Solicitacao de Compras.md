# Solicitação de Compras — comparação chamados × suíte Playwright

106 casos (FSWTBC) confrontados com o corpo dos testes de `tests/e2e/compras/`, `tests/e2e/acompanhamento-contratos/`, `tests/e2e/tarefas/`, `tests/e2e/portais/` e helpers (`utils/captura-payload.js`, `utils/guarda-criacao.js`, `pages/CentralTarefasComprasPage.js`, `pages/CicloCompradorPage.js`, `pages/TarefaSolicitacaoCompraPage.js`, `pages/FormularioSolicitacaoCompraPage.js`). Medido em 08/09/2026.

## Contagem por status

| Status | Casos |
|---|---|
| COBERTO | 0 |
| APRIMORAR | 54 |
| IMPLEMENTAR | 52 |

**Nenhum caso é COBERTO pelo critério estrito** (mesmo cenário + mesma assertion). Os mais próximos — FSWTBC-4357 (`Vlr. Total = qtd × preço` está afirmado em `preencherFormularioCompleto`), FSWTBC-2013 (CT-ACC-09-H afirma `toHaveCount(1)` do anexo na solicitação) e FSWTBC-3617 (CT-E2E-04-H vê `Distribuição Gestor Orçamentario` no Histórico) — ficam em APRIMORAR porque a metade de valor do chamado (ERP/comprador, triplicação na pasta do GED, `Integração executada com sucesso`) não é afirmada.

## Onde a suíte para, e por que metade do módulo é IMPLEMENTAR

A SC própria (formulário clássico) percorre `Início → Compra Centralizada? → Grava SC e Anexos → Validação do Gestor (pool) → Distribuição Gestor Orçamentario → Validação Orçamentária` e **para aí**: a Validação Orçamentária é consenso nominal (AL/DHL) e a conta `TOTVS-FS` não resolve comprador na SY1. Tudo que o chamado situa em **Aprovação de Alçadas (94)**, **Integração com ERP (177/287)**, **Verificar retorno Protheus (317)**, **Disparo de E-mails (185)**, cotação/negociação real e pedido gerado é IMPLEMENTAR com bloqueio de **cadastro/credencial**, não de código. Já a Validação Orçamentária é **legível** pelo solicitante (aba Formulário) — e é aí que mora o maior lote de APRIMORAR barato.

## APRIMORAR — o que acrescentar, por arquivo (54 casos)

### `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js` — 13 caso(s)

- **FSWTBC-624** — A chegada à 'Validação do Gestor' é esperada, mas Nº ERP não é lido e a queda em 'Correção' vira PRÉ-CONDIÇÃO AUSENTE (faltaPreCondicao no timeout), não defeito. Acrescentar: ler numSolCompra via formFields; se a atividade atual for 'Correção', reprovar como DEFEITO citando o Histórico ('Falha ao executar evento de serviço…'), não como ambiente.
  - teste existente: tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js :: @destrutivo deve assumir e aprovar uma tarefa do pool do Gestor Imediato (chega à Central com etapa/responsável)
- **FSWTBC-625** — A suíte só mede o FALLBACK ao pool (TOTVS-FS não tem gestor cadastrado). O caso exige gestor nominal + grade tbManager resolvida. Acrescentar em aprovacoes: após assumir, afirmar 1 linha visível em tbManager com tbmanag_codERPUserValid, Nº SC Origem ERP e Aprovador preenchidos. O lado 'nominal' exige requerente com superior cadastrado no ERP (cadastro, fora da automação) — registrar como pré-condição.
  - teste existente: tests/e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js :: CT-CMP-08-H (afirma responsavel == Pool:Group:G.P.Requisicao_de_Compras_Gestor_Imediato); tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js (assume do pool)
- **FSWTBC-1728** — O teste é um no-op: só anota se o grupo Orçamentária existe. Acrescentar: quando o grupo existir, abrir a tarefa (sem assumir) e afirmar tbItemOrcamentario com uma linha por item e 'Total Estimado a Aprovar (R$)' preenchido; quando não existir, faltaPreCondicao em vez de verde vazio.
  - teste existente: tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js :: deve verificar se a Validação Orçamentária está alcançável por pool para o usuário de automação (assertion é expect(true).toBe(true))
- **FSWTBC-2130** — Determinismo da atribuição não é afirmado. Acrescentar teste que cria 3–5 SCs do mesmo solicitante e lê o assignee da tarefa 'Validação do Gestor' de cada uma (API v2 tasks): todos idênticos. Hoje o valor esperado é o pool (sem gestor cadastrado); com gestor nominal exige cadastro no ERP.
  - teste existente: tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js :: @destrutivo deve assumir e aprovar uma tarefa do pool do Gestor Imediato (uma SC por teste)
- **FSWTBC-2245** — Cobre 'Aprovar?' utilizável só na Validação do Gestor via pool. Acrescentar assertions explícitas: Aprovador, Email do Aprovador, Data/Hora da Aprovação, Nº SC Origem ERP preenchidos; radio enabled; Justificativa passa a obrigatória ao marcar Não. Aprovação de Alçada (94) segue bloqueada.
  - teste existente: tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js :: @destrutivo deve assumir e aprovar… (decidirEEnviar espera radio 'Sim' visível e o marca)
- **FSWTBC-2681** — Ninguém conta linhas da grade Gestor Imediato. Acrescentar: após assumir, afirmar exatamente 1 linha visível em tbManager (tbmanag_historico === 'false') e que o aprovador da linha é o responsável da tarefa (assignee via API v2).
  - teste existente: tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js :: @destrutivo deve assumir e aprovar uma tarefa do pool do Gestor Imediato; tests/e2e/tarefas/acoes-da-tarefa.spec.js :: CT-TSK-07-H (abre a mesma tela)
- **FSWTBC-4229** — Nas specs do formulário clássico, cair em 'Correção' vira PRÉ-CONDIÇÃO AUSENTE (faltaPreCondicao) — o defeito deste caso seria classificado como ambiente. Acrescentar: afirmar explicitamente que o histórico NÃO contém ':Correção|' e contém 'Integração executada com sucesso' em 'Grava SC e Anexos'; Retorno Integração vazio.
  - teste existente: tests/e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js :: CT-CMP-08-H (esperarEtapa afirma etapa == 'Validação do Gestor' com Histórico na mensagem); tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js; tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: CT-ACC-09-H
- **FSWTBC-4454** — Só o rótulo é implicitamente afirmado, e só no bloco do gestor. Acrescentar: placeholder e title iguais ao rótulo, maxlength=400, rótulo passa a text-danger ao marcar Não; nos outros três blocos (tbitorc_*, buyer*, tbalcada_*) ler os atributos no DOM oculto em abertura-solicitacao-compras.spec.js.
  - teste existente: tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js :: @destrutivo deve assumir e reprovar… (localiza a textarea pelo nome acessível 'Justificativa para a Aprovação/Reprovação')
- **FSWTBC-4527** — Acrescentar (@achado, polaridade invertida): para a SC própria, o Histórico CONTÉM o aviso e a tarefa cai no pool — é o lado negativo medido. O lado positivo (gestora nominal com e-mail igual ERP×Fluig) exige requerente com superior cadastrado — pré-condição de cadastro.
  - teste existente: tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js :: cabeçalho documenta o comentário 'Atenção! Não foi possivel obter as informações do Superior Responsável…' como fallback ao pool, mas nenhum teste o afirma
- **FSWTBC-4550** — Acrescentar: linha de tbManager visível com 'Data da Validação'/'Hora da Validação' preenchidas automaticamente antes de qualquer toque; alternar Aprovado→Reprovado→Aprovado e afirmar o valor de managerAprovadoValidacao acompanhando (sem Enviar, com guarda).
  - teste existente: tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js :: @destrutivo deve assumir e aprovar / reprovar… (marca o radio 'Sim'/'Não' e o processo movimenta)
- **FSWTBC-4639** — Acrescentar: Histórico sem 'Falha ao executar evento de serviço' e sem 'C1_SIGLA'; 'Retorno Integração' vazio; numSolCompra preenchido (mesmo bloco de FSWTBC-621).
  - teste existente: tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js; tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: CT-ACC-09-H (esperam 'Validação do Gestor')
- **FSWTBC-5029** — Acrescentar: na atividade 269 (pool 'Sem Gestor'), abrir a tarefa e afirmar 'Total Estimado a Aprovar (R$)' preenchido, igual a quantidade × preço (uma vez, sem dobrar) e formatado; substituir o verde vazio por faltaPreCondicao quando não houver tarefa no grupo.
  - teste existente: tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js :: deve verificar se a Validação Orçamentária está alcançável por pool… (expect(true).toBe(true)); tests/e2e/portais/alcadas-orcamentaria.spec.js :: CT-E2E-03-H
- **FSWTBC-5035** — Acrescentar: no painel 'Identificação da Entidade / Solicitação', zoomCodNomeFilial exibindo '<código> - <nome>' (ex.: '5303 - CASSI SEDE'), igual à filial da massa; SC antiga (fallback) exige instância anterior a 30/07/2026 — leitura.
  - teste existente: tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js :: @destrutivo deve assumir e aprovar… (abre o formulário na Validação do Gestor)

### `tests/e2e/portais/alcadas-orcamentaria.spec.js` — 11 caso(s)

- **FSWTBC-622** — A SC própria chega à Validação Orçamentária e o solicitante pode ler a aba Formulário. Acrescentar: abrir a aba Formulário no detalhe, contar linhas visíveis de tbItemOrcamentario (== nº de itens da SC, sem linha em branco), afirmar tbitorc_numSolCompra___N preenchido e zero erros de console (page.on('pageerror')).
  - teste existente: tests/e2e/portais/alcadas-orcamentaria.spec.js :: @destrutivo CT-E2E-03-H — SC própria aprovada … para em Validação Orçamentária (só afirma ausência de 'Assumir tarefa')
- **FSWTBC-655** — Mesma superfície de FSWTBC-622: aba Formulário na Validação Orçamentária. Acrescentar por item: Produto, Quantidade, Preço Unit., Vlr. Total preenchidos e painel 'Rateio por Centro de Custo — Item N' com as linhas informadas na criação (comparar com a massa da factory).
  - teste existente: tests/e2e/portais/alcadas-orcamentaria.spec.js :: @destrutivo CT-E2E-03-H
- **FSWTBC-1907** — Acrescentar na aba Formulário da Validação Orçamentária: linhas de tbItemOrcamentario == itens da SC e 'Total Estimado a Aprovar (R$)' == soma dos Vlr. Total (massa da factory: 2 × 100,00 = 200,00). Partição entre gestores exige produto com duas contas (ver FSWTBC-2278).
  - teste existente: tests/e2e/portais/alcadas-orcamentaria.spec.js :: @destrutivo CT-E2E-03-H
- **FSWTBC-2278** — Acrescentar variante com produto de DUAS contas contábeis (descoberto por dataset, nunca fixado) e afirmar na aba Formulário duas linhas de aprovador em tbItemOrcamentario, uma por setor, e texto de consenso coerente.
  - teste existente: tests/e2e/portais/alcadas-orcamentaria.spec.js :: @destrutivo CT-E2E-03-S1 (consenso de 100%)
- **FSWTBC-2737** — Acrescentar na aba Formulário da Validação Orçamentária: campo 'Justificativa para a Aprovação/Reprovação *' presente na seção Validação do Item Orçamentário com data-required. Editabilidade real e gravação do parecer exigem conta de gestor orçamentário (alçada nominal).
  - teste existente: tests/e2e/portais/alcadas-orcamentaria.spec.js :: @destrutivo CT-E2E-03-H
- **FSWTBC-3435** — Acrescentar: grade tbItemOrcamentario com todos os itens; 'Total Estimado a Aprovar (R$)' == soma dos Vlr. Total; aprovador identificado na linha e status ATIVO (consultar dataset colleague pelo login do aprovador — leitura).
  - teste existente: tests/e2e/portais/alcadas-orcamentaria.spec.js :: @destrutivo CT-E2E-03-H / CT-E2E-03-S1 (consenso)
- **FSWTBC-3489** — A metade 'itens visíveis ao aprovador' cabe na aba Formulário (ver FSWTBC-622). A metade 'Data/Hora da Validação gravadas após aprovar' exige conta de gestor orçamentário — registrar como pré-condição de credencial.
  - teste existente: tests/e2e/portais/alcadas-orcamentaria.spec.js :: @destrutivo CT-E2E-03-H
- **FSWTBC-3529** — Acrescentar: Preço Unit. Estimado e Vlr. Total Estimado preenchidos (≠ vazio, ≠ 0,00) em toda linha de tbItemOrcamentario e Total Estimado a Aprovar == soma. O cenário 'gestor em substituição' exige substituição cadastrada (fora do alcance).
  - teste existente: tests/e2e/portais/alcadas-orcamentaria.spec.js :: @destrutivo CT-E2E-03-H
- **FSWTBC-3617** — Falta afirmar o texto 'Integração executada com sucesso' imediatamente após 'Distribuição Gestor Orçamentario' e o ramo tomado em 'Compra Centralizada?' (a massa padrão precisa ser centralizada para o caso valer).
  - teste existente: tests/e2e/portais/alcadas-orcamentaria.spec.js :: @destrutivo CT-E2E-04-H (Histórico exibe 'Distribuição Gestor Orçamentario' e chega a Validação Orçamentária)
- **FSWTBC-3961** — Acrescentar 'Total Estimado a Aprovar (R$) *' visível, > 0 e igual ao somatório dos Vlr. Total dos itens (massa: 200,00).
  - teste existente: tests/e2e/portais/alcadas-orcamentaria.spec.js :: @destrutivo CT-E2E-03-H
- **FSWTBC-4821** — Acrescentar: 'Total Estimado a Aprovar (R$)' no padrão #.##0,00 (regex /^\d{1,3}(\.\d{3})*,\d{2}$/) e igual à soma dos itens do aprovador; com valor > 999 (override da massa) para exercitar o separador de milhar.
  - teste existente: tests/e2e/portais/alcadas-orcamentaria.spec.js :: @destrutivo CT-E2E-03-H

### `tests/e2e/compras/ciclo-solicitacao-compras.spec.js` — 10 caso(s)

- **FSWTBC-621** — Ninguém lê numSolCompra/dtEmissaoSolCompra/erroIntegracao depois de 'Grava SC e Anexos'. Acrescentar: após aguardarAtividadeAtual('Validação do Gestor'), ler formFields via /process-management/api/v2/requests/<id>?expand=formFields (helper lerEstado de ciclo-correcao-reenvio) e afirmar numSolCompra != '', dtEmissaoSolCompra != '' e erroIntegracao == ''; Histórico com 'Integração executada com sucesso'.
  - teste existente: tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: CT-ACC-09-H @destrutivo — o anexo enviado deveria gerar os dois registros no GED… (espera 'Validação do Gestor'); tests/e2e/portais/alcadas-orcamentaria.spec.js :: CT-E2E-04-H (Histórico com 'Grava SC e Anexos')
- **FSWTBC-627** — Só o caminho NEGATIVO do upload é testado; o rateio válido do payload vem do contrato (modal), não da planilha. Acrescentar: fixture fixtures/anexos/qa-planilha-rateio-valida.xlsx com N centros de custo; upload no formulário clássico e afirmar N linhas na grade 'Rateio por Centro de Custo', soma == 100 e, no payload (interceptar workflowView/send), tbprod_jsonrateio___1 com N linhas.
  - teste existente: tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: deve rejeitar o upload de planilha de rateio com formato inválido; tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js :: as linhas de rateio devem trazer percentual, centro de custo e classe de valor preenchidos, somando 100%
- **FSWTBC-2013** — A cópia navegável é achada com Array.find — triplicação na pasta passaria despercebida. Acrescentar: filter(conteudo por nomeDoAnexo).length === 1; repetir para 'Anexar documentação Restrita CASSI' (contador 0→1→2) e reler após recarregar.
  - teste existente: tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: CT-ACC-09-H @destrutivo — o anexo enviado deveria gerar os dois registros no GED… (afirma toHaveCount(1) do item na lista de anexos e 1 registro tipo 7)
- **FSWTBC-2022** — Falta o Nº ERP e o 'nenhum obrigatório reclamado'. Acrescentar após 'Grava SC e Anexos': numSolCompra preenchido via formFields e Histórico com 'Integração executada com sucesso' (mesmo acréscimo de FSWTBC-621).
  - teste existente: tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: @destrutivo deve criar e enviar a Solicitação de Compras com todos os campos válidos (prova nº Fluig e justificativa); tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js (chega à Validação do Gestor)
- **FSWTBC-2129** — Acrescentar upload VÁLIDO com 33,33333333/33,33333333/33,33333334 e afirmar tbRatCC_Rateio___1_N com as 8 casas (toHaveValue exato), maxlength='8', soma 100 e ausência da crítica '(99,99%)'.
  - teste existente: tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: deve rejeitar o upload de planilha de rateio com formato inválido
- **FSWTBC-2157** — Acrescentar: download do modelo + upload válido montam a grade na primeira tentativa; page.on('response') sem status ≥ 400 em /webdesk/streamcontrol/256831/** e App/*.js; incluir pageworkflowview?processID=wf_solicitacao_compras em ROTAS_CHAVE de erros-de-console.
  - teste existente: tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: deve rejeitar o upload de planilha de rateio com formato inválido; tests/e2e/plataforma/erros-de-console.spec.js :: CT-PLT-06-S1 (rota do formulário de SC NÃO está na lista)
- **FSWTBC-2238** — O paralelismo acontece por acidente dos workers; nenhum teste afirma sobre o LOTE. Acrescentar teste que dispara 5 starts (payload capturado, targetState 0 — técnica de ciclo-correcao-reenvio) e afirma que as 5 chegam à Validação do Gestor com Histórico 'Integração executada com sucesso' e sem 'could not prepare statement'.
  - teste existente: tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: CT-ACC-09-H; tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js; tests/e2e/portais/alcadas-orcamentaria.spec.js (várias SCs criadas em paralelo por workers, cada uma esperando 'Validação do Gestor')
- **FSWTBC-2347** — Acrescentar SC com 3+ itens e contar no Histórico as entradas 'Integração executada com sucesso' de 'Grava SC e Anexos' (== 1, não == nº de itens). A atividade 177 do ticket segue inalcançável (pós-negociação).
  - teste existente: tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: CT-ACC-09-H (SC de 1 item)
- **FSWTBC-4072** — Nenhuma assertion sobre ausência de help crua. Acrescentar: durante o preenchimento e após 'Grava SC e Anexos', nenhum diálogo/texto começando por 'AJUDA:' e erroIntegracao vazio; item contábil inválido exige domínio da contabilidade (pré-condição de massa).
  - teste existente: tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: @destrutivo deve criar e enviar a Solicitação de Compras com todos os campos válidos (preenche Classe Valor/Centro de Custo pelo zoom)
- **FSWTBC-5262** — Acrescentar: nome vazio → 'Não foi informado nenhum nome para o arquivo.' sem abrir filechooser; botão Restrita e 'Anexar especificações do Produto' (sem produto → crítica cita 'item undefined' hoje — @bug: deveria citar 0001); descrição nasce com prefixo 'PUBLICA - Documentação - '/'RESTRITO-CASSI - Documentação - '; nenhuma resposta ≥ 400 no upload.
  - teste existente: tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: CT-ACC-09-H (anexo público end-to-end: diálogo 'Informe o nome do arquivo', lista de anexos, GED)

### `tests/e2e/compras/validacoes-solicitacao-compras.spec.js` — 6 caso(s)

- **FSWTBC-1906** — Falta o caso POSITIVO com zeros à direita. Acrescentar: dois 'Adicionar Centro de Custo', 50,00/50,00 (e 25,00/75,00; 33,30/33,30/33,40) → nenhum diálogo no blur e, ao Enviar com guarda, a crítica exibida NÃO pode ser de rateio; contraprova 90,00/20,00 → campo limpo + 'não podem ultrapassar o limite de 100%'.
  - teste existente: tests/e2e/compras/validacoes-solicitacao-compras.spec.js :: CT-CMP-02-S2 — deve bloquear o envio quando o rateio do item soma menos de 100% (só < 100)
- **FSWTBC-1954** — Mesmo acréscimo de FSWTBC-1906 (par 50,00/50,00 aceito) mais o caminho pela planilha: upload de fixture com percentuais terminados em zero somando 100 e afirmar grade montada sem crítica.
  - teste existente: tests/e2e/compras/validacoes-solicitacao-compras.spec.js :: CT-CMP-02-S2
- **FSWTBC-3878** — O caso é LINHA existente com Produto/Serviço vazio. Acrescentar: Adicionar Produto, preencher quantidade/preço/data e rateio 100, deixar Produto vazio, Enviar → crítica citando 'Produto/Serviço' em linguagem de negócio e guarda.tentativas() == 0; ao escolher produto, 'Grupo do Produto/Serviço' preenchido (readonly).
  - teste existente: tests/e2e/compras/validacoes-solicitacao-compras.spec.js :: deve bloquear o envio e reportar o obrigatório pendente quando o formulário está vazio ('informar ao menos um produto'); CT-CMP-02-S2 (linha de produto vazia, mas a crítica lida é a de rateio)
- **FSWTBC-4580** — O caso é grade de rateio VAZIA (sem 'Adicionar Centro de Custo'). Acrescentar: produto real selecionado, quantidade/preço, nenhum centro de custo → Enviar com guarda: crítica de rateio e tentativas() == 0. Se o cliente deixar passar, o lado servidor (HTTP 500 estruturado + Correção) vira teste @destrutivo.
  - teste existente: tests/e2e/compras/validacoes-solicitacao-compras.spec.js :: CT-CMP-02-S2 — deve bloquear o envio quando o rateio do item soma menos de 100% (grade COM linha de 90%)
- **FSWTBC-4632** — Acrescentar em validacoes: 'Adicionar Produto' sem filial → toast 'Atenção! A Filial não foi selecionada!…' e nenhuma linha criada; em ciclo: 'Cód. Filial Origem' == código escolhido e codFilial/zoomNomeFilial no payload de workflowView/send; no Tracker da SC própria, colunas Código/Nome da Filial preenchidas.
  - teste existente: tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: preencherFormularioCompleto (seleciona filial e confirma campoCodigoFilial preenchido); tests/e2e/compras/abertura-solicitacao-compras.spec.js (só visibilidade de Código da Filial)
- **FSWTBC-4952** — Nenhum teste toca o mínimo de R$ 0,10. Acrescentar: qtd 1 × preço 0,01 → diálogo 'O Vlr. Total Estimado não pode ser inferior a R$ 0,10!…item 0001'; após OK, campo limpo (hoje NÃO limpa — vira @bug); 0,10 sem crítica; qtd 0,001 × 10,00 mesma crítica; Enviar bloqueado com guarda.
  - teste existente: tests/e2e/compras/validacoes-solicitacao-compras.spec.js :: CT-CMP-02-S2 (usa 'Adicionar Produto' + rateio); tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: preencherCampoMascarado (quantidade/preço)

### `tests/e2e/portais/tracker-compras.spec.js` — 3 caso(s)

- **FSWTBC-2187** — Auditoria só-leitura possível no Tracker. Acrescentar: filtrar Finalizados, ler colunas 'Nº da Solicitação ERP'/'Nº da Cotação ERP' de todas as linhas e afirmar nenhuma linha Finalizada com cotação vazia.
  - teste existente: tests/e2e/portais/tracker-compras.spec.js :: deve listar processos reais ao filtrar por status (só Abertos, só count > 0)
- **FSWTBC-3749** — Só leitura no Tracker: filtrar Abertos e, nas linhas cuja atividade contém 'Aguarda', afirmar que o nome é um dos quatro reais ('Aguarda Geração da Cotação', '…do Pedido/Contrato', '…Alçadas', '…Vigência') e que há tempo/‘Retorno Integração’ legível no rastro.
  - teste existente: tests/e2e/portais/tracker-compras.spec.js :: deve listar processos reais ao filtrar por status; tests/e2e/portais/ciclo-comprador.spec.js :: CT-E2E-11-H (Rastro do Processo)
- **FSWTBC-3955** — Auditoria só-leitura: filtrar Cancelados no período, abrir o rastro/Histórico de cada SC cancelada e afirmar que nenhuma tem aprovação em Validação Orçamentária anterior ao cancelamento (cruzar com a visão 'Aprovadores SC'). Reprodução do temporizador não é possível.
  - teste existente: tests/e2e/portais/tracker-compras.spec.js :: deve listar processos reais ao filtrar por status

### `tests/e2e/portais/ciclo-comprador.spec.js` — 3 caso(s)

- **FSWTBC-3841** — Acrescentar no Tracker: coluna 'Nº da Solicitação ERP' preenchida para a SC própria após 'Grava SC e Anexos'; 'Retorno Integração' vazio no formulário; Histórico com 'Grava SC e Anexos' encerrada. Fila ZZY (genericQuery 404) fica fora.
  - teste existente: tests/e2e/portais/ciclo-comprador.spec.js :: @destrutivo CT-E2E-11-H — o Tracker localiza a SC própria (só afirma que a linha contém o nº do processo)
- **FSWTBC-4357** — A parte 'Vlr. Total = qtd × preço' está coberta. Acrescentar: no teste @destrutivo de CT-E2E-06-H, localizar a SC própria, expandir e afirmar Preço Unit. == massa.precoUnitario e Vlr. Total == massa.valorTotalEsperado (nunca 0,00); e tbprod_precoUnitario___1 nos formFields após 'Grava SC e Anexos'.
  - teste existente: tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: preencherFormularioCompleto (afirma 'Valor Total Estimado' == quantidade × preço); tests/e2e/portais/ciclo-comprador.spec.js :: CT-E2E-06-H (expande a primeira linha da Validação Inicial e só confere rótulos)
- **FSWTBC-4459** — Acrescentar: 'Nº da Solicitação ERP' preenchido no formulário e no Tracker; coluna 'Nº Solic ERP' preenchida na linha da SC própria em Validação Inicial; SC ausente do pool G.P.Requisicao_de_Compras_Correcoes.
  - teste existente: tests/e2e/portais/ciclo-comprador.spec.js :: @destrutivo CT-E2E-06-H (SC própria aparece na Validação Inicial); tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js

### `tests/e2e/compras/abertura-solicitacao-compras.spec.js` — 3 caso(s)

- **FSWTBC-4361** — Acrescentar coerência do card 'Solicitações de Compras Reprovadas': interceptar dsFluig_getProcReqComprasReprovadoSql (constraint matriculaSolicitante == QA_USERNAME, STATUS 2) e afirmar card oculto ⇔ content vazio; com content, cada botão listado corresponde a SC reprovada. Massa 'SC finalizada com pedido' depende do Protheus (fora do alcance).
  - teste existente: tests/e2e/compras/abertura-solicitacao-compras.spec.js :: deve abrir completo, com Identificação pré-preenchida…
- **FSWTBC-4767** — Acrescentar: Solicitante == nome da conta ('Usuário TBC (TOTVS)'), Email == e-mail da conta (ler de .env), ambos readonly (not.toBeEditable) e #matriculaSolicitante == QA_USERNAME; no caminho por contrato, afirmar matriculaSolicitante do payload em payload-solicitacao.spec.js.
  - teste existente: tests/e2e/compras/abertura-solicitacao-compras.spec.js :: deve abrir completo, com Identificação pré-preenchida… (afirma Solicitante ≠ '' e e-mail casa /.+@.+/)
- **FSWTBC-4819** — Acrescentar em abertura/validacoes: abrir o searchbox 'Nome' sem termo e com 'CASSI' → options reais (exclui 'Filtrar colunas') ≥ 10, com códigos distintos; buscar por código (ex.: 3517) encontra; selecionar → 'Código da Filial' recebe o código.
  - teste existente: tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: deve sinalizar indisponibilidade… (conta opções == 0 sob 500); preencherFormularioCompleto (busca 'CASSI SEDE')

### `tests/e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js` — 2 caso(s)

- **FSWTBC-4989** — Acrescentar, em cada etapa aberta: painel 'Rateio por Centro de Custo — Item N' visível e centros de custo/classe de valor/percentuais iguais aos do start (tbprod_jsonrateio___N nos formFields) — inclusive na Validação Orçamentária pela aba Formulário.
  - teste existente: tests/e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js :: CT-CMP-08-H (abre a tarefa em Validação do Gestor e em Ajustar Informações; compara só contrato/revisão/filial/itens); tests/e2e/portais/alcadas-orcamentaria.spec.js (Validação Orçamentária)
- **FSWTBC-5034** — Acrescentar em CT-CMP-08-H: guardar tbprod_jsonrateio___N no start (idealmente item com DOIS centros de custo) e, em Ajustar Informações, afirmar painel 'Rateio por Centro de Custo' visível e conteúdo idêntico (código, classe de valor, percentual); campos editáveis e 'Adicionar Centro de Custo' disponível.
  - teste existente: tests/e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js :: CT-CMP-08-H (reprova → Ajustar Informações; compara nrContrato/revisão/filial/itens); tests/e2e/acompanhamento-contratos/ciclo-gestor.spec.js :: CT-E2E-02-S1 (compara só nrContrato)

### `tests/e2e/notificacoes/disparo-multicanal.spec.js` — 1 caso(s)

- **FSWTBC-1814** — Não liga alerta a tarefa de compras. Acrescentar: criar SC própria (criarSolicitacaoCompraClassica), esperar chegar ao pool do Gestor Imediato (a conta pertence ao grupo) e afirmar em /globalalertapi/api/rest/alert/listAlerts um alerta com place.objectId == processInstanceId e contador do sino > 0.
  - teste existente: tests/e2e/notificacoes/disparo-multicanal.spec.js :: CT-NOT-01-H (só afirma que EXISTE algum alerta required)

### `tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js` — 1 caso(s)

- **FSWTBC-2348** — O payload é capturado mas a filial de ENTREGA do item não é afirmada. Acrescentar: codFilialOrigem == codFilial da SC e campo de filial de entrega de cada item ≠ '01' quando a filial da SC não é 01 (ler pelo sufixo ___N com extrairItens).
  - teste existente: tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js :: @bug classeOrca, classificação e o descritor deveriam refletir o contrato de origem (afirma codFilial ≠ entre contratos)

### `tests/e2e/acompanhamento-contratos/ciclo-gestor.spec.js` — 1 caso(s)

- **FSWTBC-5030** — CONFLITO: o caso (concluído 19/08) diz que a SC de Aditivo Contratual DEVE parar em '6 - Início' COM o solicitante, editável; a suíte trata 'Início' como defeito (D-01), sem distinguir dono. Acrescentar: tipo Aditivo explícito, afirmar Início com assignee == QA_USERNAME (não consumerkeycompras), linhas excluíveis, Quantidade/Preço editáveis, Vlr. Total recalculado, e após Enviar 'Validação do Gestor' apenas com o item mantido. Revisar a assertion 'not Início' de D-01 para 'não com a conta de integração'.
  - teste existente: tests/e2e/acompanhamento-contratos/ciclo-gestor.spec.js :: @destrutivo @bug estado inicial e responsável deveriam refletir uma etapa de trabalho do solicitante (afirma stateDescription != 'Início'); tests/e2e/acompanhamento-contratos/payload-solicitacao.spec.js :: @bug targetState != 6

## IMPLEMENTAR — onde nasceria (52 casos)

### `tests/e2e/compras/aprovacao-alcadas.spec.js (novo)` — 21 caso(s)

- **FSWTBC-619** — Tarefa da alçada ao aprovador nominal (não ao pool). Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código. Nasceria em tests/e2e/compras/aprovacao-alcadas.spec.js (novo), lendo assignee da tarefa 94 via /process-management/api/v2/requests/<id>/tasks (técnica de ciclo-correcao-reenvio.lerEstado).
- **FSWTBC-642** — Alçada com REST do Protheus indisponível não pode avançar. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código. A falha é server-side (evento de serviço), não interceptável por page.route.
- **FSWTBC-1650** — Grade de alçadas por faixa, ordem de aprovadores. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-1762** — Estrutura pai/filho de aprovadores sem duplicar. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-1789** — SC antiga conclui alçada; linhas tbalcada_historico ocultas. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-1816** — Grade de aprovadores montada uma única vez. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-2105** — Reprovar alçada em SC antiga sem erro. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-2279** — Devolver para negociação sem duplicar grade de alçadas. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-2547** — Grade da Empresa Vencedora com muitos itens. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-2690** — Reprovação na alçada aceita, authorityStatusValidacao='Reprovado'. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-2914** — Aprovador designado se vê como titular em tbAlcadas. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-3813** — Valor da compra e frete preenchidos na alçada. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-3957** — Aprovadores não localizados → Correção, não Grupo Gestor. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-4146** — Definir vencedor tira a SC de 'Aguarda Geração Alçadas' em minutos. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-4312** — Quem aprovou/reprovou cada linha da alçada e quando. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-4874** — Grade de alçada só abre com vencedoras carregadas. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-4918** — Linha 1 do aprovador carregada na alçada. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-5081** — Proposta reenviada mantém parecer; alçada gerada sem prender em 309. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-5118** — Aprovação de Alçadas atribuída ao CR_USER do Protheus. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-5127** — Campos de valor da alçada em formato moeda; vazio permanece vazio. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.
- **FSWTBC-5174** — Grade de aprovação carregada com 'Aprovar?' na alçada. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.

### `tests/e2e/compras/pos-alcada-pedido.spec.js (novo)` — 10 caso(s)

- **FSWTBC-2804** — Liberação das alçadas confirmada pela integração. Etapas pós-alçada (287 Integração com ERP, 317 Verificar retorno Protheus, geração de pedido) são inalcançáveis: a SC própria para em Validação Orçamentária. Só leitura do Tracker/Histórico de SCs de terceiros seria possível, e o caso exige massa própria.
- **FSWTBC-3361** — Pedido gerado sem 'Controle de Alçada' em Retorno Integração. Etapas pós-alçada (287 Integração com ERP, 317 Verificar retorno Protheus, geração de pedido) são inalcançáveis: a SC própria para em Validação Orçamentária. Só leitura do Tracker/Histórico de SCs de terceiros seria possível, e o caso exige massa própria.
- **FSWTBC-3770** — Integração 287 conclui e mensagem de falha não é 'undefined'. Etapas pós-alçada (287 Integração com ERP, 317 Verificar retorno Protheus, geração de pedido) são inalcançáveis: a SC própria para em Validação Orçamentária. Só leitura do Tracker/Histórico de SCs de terceiros seria possível, e o caso exige massa própria.
- **FSWTBC-4094** — Nº do pedido/contrato visível no Fluig. Etapas pós-alçada (287 Integração com ERP, 317 Verificar retorno Protheus, geração de pedido) são inalcançáveis: a SC própria para em Validação Orçamentária. Só leitura do Tracker/Histórico de SCs de terceiros seria possível, e o caso exige massa própria.
- **FSWTBC-4213** — SC sem orçamento para em 317 com mensagem legível. Etapas pós-alçada (287 Integração com ERP, 317 Verificar retorno Protheus, geração de pedido) são inalcançáveis: a SC própria para em Validação Orçamentária. Só leitura do Tracker/Histórico de SCs de terceiros seria possível, e o caso exige massa própria.
- **FSWTBC-4234** — Falha de liberação exibe mensagem real do Protheus, nunca 'Erro: undefined'. Etapas pós-alçada (287 Integração com ERP, 317 Verificar retorno Protheus, geração de pedido) são inalcançáveis: a SC própria para em Validação Orçamentária. Só leitura do Tracker/Histórico de SCs de terceiros seria possível, e o caso exige massa própria.
- **FSWTBC-4852** — Integração pós-alçada falha → Correção com erro legível. Etapas pós-alçada (287 Integração com ERP, 317 Verificar retorno Protheus, geração de pedido) são inalcançáveis: a SC própria para em Validação Orçamentária.
- **FSWTBC-5005** — Tarefa 317 com prazo de 1 dia útil e vencida na Central. Etapas pós-alçada (287 Integração com ERP, 317 Verificar retorno Protheus, geração de pedido) são inalcançáveis: a SC própria para em Validação Orçamentária.
- **FSWTBC-5006** — Pedido/contrato gerado ou 317 com causa real. Etapas pós-alçada (287 Integração com ERP, 317 Verificar retorno Protheus, geração de pedido) são inalcançáveis: a SC própria para em Validação Orçamentária.
- **FSWTBC-5017** — Pedido gerado mesmo sem saldo orçamentário. Etapas pós-alçada (287 Integração com ERP, 317 Verificar retorno Protheus, geração de pedido) são inalcançáveis: a SC própria para em Validação Orçamentária.

### `tests/e2e/compras/disparo-emails.spec.js (novo)` — 7 caso(s)

- **FSWTBC-2084** — E-mail ao fornecedor com valor igual ao gravado. Sem caixa de e-mail observável e etapa pós-alçada inalcançável (comprador SY1). Nasceria em tests/e2e/compras/disparo-emails.spec.js, lendo o Histórico da atividade 185 e o dataset de e-mails enviados, quando houver massa.
- **FSWTBC-2684** — E-mail ao fornecedor com N itens aprovados, sem resíduo de rodadas anteriores. Disparo de E-mails (185) é pós-alçada e o conteúdo do e-mail não é observável pela suíte (sem caixa postal; datasets de envio rodam no servidor).
- **FSWTBC-3030** — E-mail de finalização lista todos os itens e total. Disparo de E-mails (185) é pós-alçada e o conteúdo do e-mail não é observável pela suíte (sem caixa postal; datasets de envio rodam no servidor).
- **FSWTBC-4127** — Disparo de E-mails 185 conclui / 187 trata indisponibilidade. Disparo de E-mails (185) é pós-alçada e o conteúdo do e-mail não é observável pela suíte (sem caixa postal; datasets de envio rodam no servidor).
- **FSWTBC-5058** — E-mail de resultado de cotação no layout institucional. Disparo de E-mails (185) é pós-alçada e o conteúdo do e-mail não é observável pela suíte (sem caixa postal; datasets de envio rodam no servidor).
- **FSWTBC-5059** — E-mail com valores no padrão brasileiro e datas dd/mm/aaaa. Disparo de E-mails (185) é pós-alçada e o conteúdo do e-mail não é observável pela suíte (sem caixa postal; datasets de envio rodam no servidor).
- **FSWTBC-5121** — Um único e-mail por fornecedor, coerente com o resultado. Disparo de E-mails (185) é pós-alçada e o conteúdo do e-mail não é observável pela suíte (sem caixa postal; datasets de envio rodam no servidor).

### `tests/e2e/compras/integracao-negociacao.spec.js (novo)` — 2 caso(s)

- **FSWTBC-631** — Negociação enviada ao Protheus sem erro. tests/e2e/compras/negociacao-proposta.spec.js só prova que o shell avulso é readonly e a fila real está vazia (PRÉ-CONDIÇÃO AUSENTE). Bloqueio: comprador nominal na SY1. Nasceria em tests/e2e/compras/integracao-negociacao.spec.js quando houver credencial de comprador.
- **FSWTBC-2236** — Integração 177 após negociação sem falha transacional. Nenhum teste chega à atividade 94 (Aprovação de Alçadas): a SC própria para em Validação Orçamentária (consenso AL/DHL) e a conta TOTVS-FS não resolve comprador na SY1. Pré-condição de cadastro no ERP, não de código.

### `tests/e2e/compras/compatibilidade-formulario-antigo.spec.js (novo)` — 1 caso(s)

- **FSWTBC-623** — Compatibilidade com instância ANTIGA do formulário (versão anterior): nenhum teste abre SC antiga. Nasceria em tests/e2e/compras/compatibilidade-formulario-antigo.spec.js: descobrir em Minhas Solicitações (ordenação crescente) a SC própria mais antiga de wf_solicitacao_compras, abrir em modo consulta, afirmar sem pageerror, tbItemOrcamentario e tbProdutos com linhas. Massa de leitura, sem escrita.

### `tests/e2e/compras/auditoria-responsaveis-abertos.spec.js (novo)` — 1 caso(s)

- **FSWTBC-626** — Auditoria de instâncias antigas após remediação da hierarquia do gestor orçamentário: nenhum teste. Nasceria em tests/e2e/compras/auditoria-responsaveis-abertos.spec.js: Tracker (Abertos) → para cada SC em Validação Orçamentária/Distribuição, afirmar responsável não vazio e grade carregada. Só leitura.

### `tests/e2e/compras/subprocessos-cotacao.spec.js (novo)` — 1 caso(s)

- **FSWTBC-694** — Subprocessos Cotação/Negociação nascem da SC concluída. tests/e2e/portais/ciclo-comprador.spec.js CT-E2E-07-H afirma 'Nenhum dado encontrado' (ausência medida). Bloqueio: SC própria para em Validação Orçamentária; comprador SY1. Nasceria em tests/e2e/compras/subprocessos-cotacao.spec.js.

### `tests/e2e/compras/atribuicao-gestor-hierarquia.spec.js (novo)` — 1 caso(s)

- **FSWTBC-2106** — N1 vago → SC sobe ao N2. Exige requerente com hierarquia cadastrada no ERP (N1 vago, N2 ativo); TOTVS-FS não tem superior e sempre cai no pool. Nasceria em tests/e2e/compras/atribuicao-gestor-hierarquia.spec.js com massa de cadastro fornecida pela Cassi.

### `tests/e2e/compras/validacao-orcamentaria-dois-gestores.spec.js (novo)` — 1 caso(s)

- **FSWTBC-2237** — Dois gestores orçamentários no Histórico. Exige duas contas de gestor orçamentário (alçada nominal AL/DHL). Nasceria em tests/e2e/compras/validacao-orcamentaria-dois-gestores.spec.js com credenciais adicionais.

### `tests/e2e/compras/distribuicao-gestor-orcamentario.spec.js (novo)` — 1 caso(s)

- **FSWTBC-2668** — Falha da API do Gestor Orçamentário deve desviar para Correção. A atividade 'Distribuição Gestor Orçamentario' é evento de serviço no servidor — page.route não a alcança; derrubarDataset só cobre chamadas do navegador. Nasceria em tests/e2e/compras/distribuicao-gestor-orcamentario.spec.js, mas exige mecanismo de injeção de falha no servidor (não disponível).

### `tests/e2e/compras/retorno-cotacao.spec.js (novo)` — 1 caso(s)

- **FSWTBC-2689** — Comprador devolve cotação → regravação da lista sem erro/null. Exige comprador SY1 e cotação real (fila vazia para TOTVS-FS — ciclo-cotacao.spec.js documenta como PRÉ-CONDIÇÃO AUSENTE). Nasceria em tests/e2e/compras/retorno-cotacao.spec.js.

### `tests/e2e/compras/anexo-apos-cotacao.spec.js (novo)` — 1 caso(s)

- **FSWTBC-3875** — Recusa de anexo por perfil não gestor após cotação liberada. Exige SC pós-cotação (inalcançável) e segundo perfil. Nasceria em tests/e2e/compras/anexo-apos-cotacao.spec.js.

### `tests/e2e/compras/logs-protheus-zzy.spec.js (novo)` — 1 caso(s)

- **FSWTBC-3931** — Fila 'Solicitacoes ZZY' responde e muda de estado. O widget Logs Protheus responde 404 em genericQuery hoje e a etapa 'Aguarda Criar Pedido' é pós-alçada. Nasceria em tests/e2e/compras/logs-protheus-zzy.spec.js quando o widget responder.

### `tests/e2e/compras/cancelamento-com-derivadas.spec.js (novo)` — 1 caso(s)

- **FSWTBC-4096** — Cancelar SC encerra negociações derivadas. tests/e2e/tarefas/cancelamento-solicitacao.spec.js cobre o contrato de cancelInstances (massa: questionário), mas não há SC com negociações derivadas (cotação inalcançável). Nasceria em tests/e2e/compras/cancelamento-com-derivadas.spec.js.

### `tests/e2e/fiscal/pre-nota-caractere-controle.spec.js (novo)` — 1 caso(s)

- **FSWTBC-5146** — RDFC com caractere de controle → Pré-Nota criada. tests/e2e/fiscal/recepcao-documentos-fiscais.spec.js prova que as 5 variantes de RDFC BLOQUEIAM para TOTVS-FS ('não possui permissão para iniciar'). Exige perfil fiscal/comprador. Nasceria em tests/e2e/fiscal/pre-nota-caractere-controle.spec.js.

### `tests/e2e/compras/cancelamento-na-alcada.spec.js (novo)` — 1 caso(s)

- **FSWTBC-5234** — Cancelar SC em Aprovação de Alçadas (combo 'Enviar para' → Cancelar Solicitação) sem 'Cannot read property "0" from null'. tests/e2e/tarefas/cancelamento-solicitacao.spec.js cobre OUTRO caminho (cartão da Central, questionário). A etapa 94/210 é inalcançável (comprador SY1). Nasceria em tests/e2e/compras/cancelamento-na-alcada.spec.js.

## Testes existentes mais fracos do que o título sugere

- `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js :: deve verificar se a Validação Orçamentária está alcançável por pool para o usuário de automação` — a única assertion é `expect(true).toBe(true)`; só anota. Vale zero como cobertura de 1728/5029.
- `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js :: @destrutivo deve assumir e movimentar uma tarefa do pool de Validação dos Compradores quando disponível` — sem grupo no pool, `expect(true).toBe(true)` e retorna verde.
- `tests/e2e/compras/aprovacoes-solicitacao-compras.spec.js :: @destrutivo deve sinalizar explicitamente quando não há aprovador habilitado` — afirma `mensagemAlcada || atividadeMudou`: qualquer avanço passa, a alçada nunca é exercitada de fato.
- `tests/e2e/portais/ciclo-comprador.spec.js :: CT-E2E-06-H (não destrutivo)` — expande a primeira linha e afirma só os rótulos `Produto/Serviço`, `Quantidade`, `Vlr. Total Estimado` (toBeVisible); nenhum valor. Por isso 4357/4459 não são cobertos.
- `tests/e2e/portais/ciclo-comprador.spec.js :: CT-E2E-11-H` — no Tracker afirma só que a linha contém o nº do processo; `Nº da Solicitação ERP` (o dado do chamado 3841/4459) não é lido.
- `tests/e2e/portais/alcadas-orcamentaria.spec.js :: CT-E2E-03-H` — chega à Validação Orçamentária e afirma apenas ausência de `Assumir tarefa`; a aba Formulário (tbItemOrcamentario, Total Estimado a Aprovar) nunca é aberta — é o que 622/655/1907/3435/3529/3961/4821 pedem.
- `tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: CT-ACC-09-H` e `pages/CicloCompradorPage.js :: aguardarAtividadeAtual` — cair em **Correção** vira `PRÉ-CONDIÇÃO AUSENTE` (ambiente), quando 4229/4459/4639 dizem que isso é o defeito.
- `tests/e2e/compras/ciclo-solicitacao-compras.spec.js :: CT-CMP-01-H` — o oráculo "Minhas Solicitações" é só `identificadores.length > 0` (a SC específica é apenas anotada).
- `tests/e2e/compras/ciclo-cotacao.spec.js` / `negociacao-proposta.spec.js` / `parecer-tecnico.spec.js` — os testes "(bloqueado)" afirmam readonly de um shell fora de contexto; nenhum caso de cotação/negociação real do módulo é tocado.
- `tests/e2e/acompanhamento-contratos/ciclo-gestor.spec.js :: CT-E2E-01-H` — afirma `stateDescription != 'Início'`; FSWTBC-5030 (concluído 19/08) diz que o Aditivo Contratual **deve** parar em Início com o solicitante. A assertion precisa virar "não com `consumerkeycompras`".
