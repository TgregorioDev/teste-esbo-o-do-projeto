# Casos de Testes — SDCASSI e SUPORTE CASSI

Casos de teste manuais escritos a partir dos defeitos reais reportados pela CASSI nos
projetos **SDCASSI** e **SUPORTE CASSI**, analisados um a um e verificados no ambiente de
homologação do Fluig em 08/09/2026.

| | |
|---|---|
| Defeitos no universo analisado | 643 |
| Casos escritos | 643 |
| Executáveis no Fluig | 518 |
| Somente no Protheus (registrados para depois) | 125 |

Dos casos de Fluig: **26** verificados integralmente em tela, **473** parcialmente, **15** não verificados, **4** sem o campo declarado.


## De onde estes casos vieram

Os casos são derivados de uma análise dos 643 chamados, feita antes de qualquer caso ser escrito:

- [`docs/analise-chamados-sdcassi.md`](../docs/analise-chamados-sdcassi.md) — consolidação:
  retrato quantitativo, as famílias de defeito que se repetem, passivos de dado que patch nenhum
  desfaz, e o que funciona bem e vale preservar.
- [`docs/achados-novos-sdcassi.md`](../docs/achados-novos-sdcassi.md) — 31 defeitos encontrados
  durante a análise que **não tinham chamado aberto**.

---

## Fluig — executáveis no ambiente de homologação

| Módulo | Casos | Verificado (total/parcial/não) |
|---|---:|---|
| [Portal do Comprador](<Portal do Comprador.md>) | 147 | 5 / 139 / 2 |
| [Solicitacao de Compras](<Solicitacao de Compras.md>) | 106 | 5 / 99 / 2 |
| [Faturamento de Contratos](<Faturamento de Contratos.md>) | 104 | 1 / 100 / 3 |
| [Contratos](<Contratos.md>) | 61 | 10 / 49 / 0 |
| [Portal do Fornecedor](<Portal do Fornecedor.md>) | 24 | 0 / 23 / 1 |
| [Parecer Tecnico](<Parecer Tecnico.md>) | 17 | 0 / 16 / 0 |
| [Consultas e Logs](<Consultas e Logs.md>) | 15 | 0 / 15 / 0 |
| [Gestao de Equipes](<Gestao de Equipes.md>) | 13 | 2 / 10 / 1 |
| [Gerencia de Compras](<Gerencia de Compras.md>) | 9 | 2 / 7 / 0 |
| [Corretagens](<Corretagens.md>) | 8 | 0 / 2 / 6 |
| [RH e Administrativos](<RH e Administrativos.md>) | 8 | 1 / 7 / 0 |
| [Plataforma](<Plataforma.md>) | 6 | 0 / 6 / 0 |

## Protheus — registrados para execução futura no ERP

Não são executáveis no Fluig: o efeito do defeito só aparece no Protheus. Estão escritos
por completo para quando o projeto cobrir o ERP.

| Módulo do ERP | Casos |
|---|---:|
| [Financeiro e Contabil](<Protheus/Financeiro e Contabil.md>) | 41 |
| [Contratos - GCT](<Protheus/Contratos - GCT.md>) | 32 |
| [Integracao e Filas](<Protheus/Integracao e Filas.md>) | 23 |
| [RH - Folha](<Protheus/RH - Folha.md>) | 15 |
| [Dicionario e Pacote](<Protheus/Dicionario e Pacote.md>) | 8 |
| [Compras](<Protheus/Compras.md>) | 6 |

---

## Índice por defeito

| Defeito | Caso | Módulo | Verificado |
|---|---|---|---|
| FSWTBC-617 | [Fornecedor atualiza a proposta de uma cotação já enviada e o sistema grava a nova versão s](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-618 | [Verificar que a medição automática da madrugada abre um processo de Faturamento de Contrat](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-619 | [SC que atinge a alçada gera a tarefa de aprovação para o aprovador nominal da alçada, não ](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-620 | [Gestor abre a Gestão de Equipes e vê a própria equipe montada a partir da árvore hierárqui](<Gestao de Equipes.md>) | Gestao de Equipes | PAR |
| FSWTBC-621 | [Concluir uma Solicitação de Compras cria a SC no ERP Protheus e devolve o número ao formul](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-622 | [Na etapa do gestor orçamentário, os itens da solicitação são carregados e listados na grad](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-623 | [Abrir uma solicitação de compras antiga (versão anterior do formulário) exibe os itens do ](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-624 | [Criar uma Solicitação de Compras no ambiente de QA conclui sem erro de integração.](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-625 | [A etapa "Validação do Gestor" da SC é atribuída ao gestor imediato do solicitante, nominal](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-626 | [Solicitações abertas antes da correção da hierarquia do gestor orçamentário seguem o fluxo](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-627 | [O rateio por centro de custo de uma solicitação lista todos os centros de custo informados](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-628 | [Verificar que a atualização da cotação no ERP (após a recepção das propostas) conclui sem ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-629 | [Abrir uma medição de contrato pelo Faturamento de Contratos e ver a busca automática de da](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-630 | [Quando a widget Gestão de Equipes falha, o erro é apresentado ao usuário em tela — não fic](<Gestao de Equipes.md>) | Gestao de Equipes | SIM |
| FSWTBC-631 | [Enviar uma negociação de cotação ao Protheus e confirmar que a integração conclui sem erro](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-632 | [Gestor consulta a árvore hierárquica e encontra todos os gestores subordinados que estão c](<Gestao de Equipes.md>) | Gestao de Equipes | PAR |
| FSWTBC-633 | [Gerar a fatura a pagar de um documento de prestador cujo percentual por título cabe no cam](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-634 | [Ao trocar a planilha/competência de uma medição, o rateio da medição anterior é descartado](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-635 | [A widget Gestão de Equipes lista os colaboradores dos departamentos subordinados ao gestor](<Gestao de Equipes.md>) | Gestao de Equipes | PAR |
| FSWTBC-636 | [O formulário de Tarefas Assumidas grava e exibe corretamente os campos do histórico do mês](<Gestao de Equipes.md>) | Gestao de Equipes | NÃO |
| FSWTBC-637 | [A widget Gestão de Equipes monta a árvore hierárquica para qualquer gestor com cadastro co](<Gestao de Equipes.md>) | Gestao de Equipes | SIM |
| FSWTBC-638 | [Criar uma Solicitação de Compra pelo Fluig e confirmar que a SC no Protheus fica com o sol](<Contratos.md>) | Contratos | PAR |
| FSWTBC-639 | [Fiscal executa a medição de um contrato e os campos herdados do contrato chegam preenchido](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-640 | [Usuário movimenta uma solicitação e, se a movimentação falhar, recebe uma mensagem de erro](<Plataforma.md>) | Plataforma | PAR |
| FSWTBC-641 | [Comprador valida a proposta do fornecedor na negociação e o registro da validação é gravad](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-642 | [SC atinge a alçada com o REST do Protheus indisponível e o processo trava em vez de gerar ](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-643 | [Colaborador cujo gestor é um posto vago tem a pendência atribuída ao usuário admin, e não ](<Gestao de Equipes.md>) | Gestao de Equipes | PAR |
| FSWTBC-644 | [Fornecedor tenta enviar proposta com valor zerado no Portal do Fornecedor e o portal recus](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-645 | [Cancelar uma cotação no Protheus e confirmar que o fornecedor deixa de conseguir enviar ne](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-646 | [Medição que falha na integração cai para o grupo de correção, e não para todos os usuários](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-647 | [Gestor abre a Gestão de Equipes e a legenda explica o que cada destaque da árvore signific](<Gestao de Equipes.md>) | Gestao de Equipes | PAR |
| FSWTBC-648 | [Verificar que a árvore hierárquica (Gestão de Equipes) e a resolução de gestor não retorna](<RH e Administrativos.md>) | RH e Administrativos | PAR |
| FSWTBC-649 | [Conferir que a árvore hierárquica exibida no Fluig reproduz exatamente a estrutura cadastr](<Gestao de Equipes.md>) | Gestao de Equipes | PAR |
| FSWTBC-650 | [Consultar a estrutura e confirmar que os postos vagos da visão 37 da RD4 aparecem, inclusi](<Gestao de Equipes.md>) | Gestao de Equipes | PAR |
| FSWTBC-651 | [Gestor abre a Gestão de Equipes e a árvore da equipe carrega em tempo aceitável, sem timeo](<Gestao de Equipes.md>) | Gestao de Equipes | PAR |
| FSWTBC-652 | [Tentar movimentar uma medição sem itens carregados e sem prestação de serviço, e confirmar](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-653 | [Verificar que a atualização da cotação aceita proposta de valor alto (13 inteiros + 2 deci](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-654 | [Alterar o step salarial de um funcionário pela rotina automática preservando o adicional d](<Protheus/RH - Folha.md>) | RH - Folha | NÃO |
| FSWTBC-655 | [Gestor orçamentário abre a SC na Validação Orçamentária e vê os detalhes completos de cada](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-656 | [Registrar ponto pelo app SouCassi e obter marcação automática, com e-mail resolvido sem di](<Protheus/RH - Folha.md>) | RH - Folha | NÃO |
| FSWTBC-657 | [Calcular a folha de um colaborador com abono no mês e mudança de step/promoção descontando](<Protheus/RH - Folha.md>) | RH - Folha | NÃO |
| FSWTBC-658 | [Usuário abre uma corretora, não altera nada e sai — o sistema não acusa alteração.](<Corretagens.md>) | Corretagens | NÃO |
| FSWTBC-659 | [Enviar o payload de cadastro de corretora e apuração de corretagens à API e conferir que c](<Protheus/Integracao e Filas.md>) | Integracao e Filas | NÃO |
| FSWTBC-660 | [Usuário edita uma corretora que não tem corretagens e os campos permitidos estão abertos p](<Corretagens.md>) | Corretagens | NÃO |
| FSWTBC-661 | [Usuário abre uma corretora que tem valor gravado no campo de lookup e o lookup abre já pre](<Corretagens.md>) | Corretagens | NÃO |
| FSWTBC-662 | [Executar uma apuração para corretora sem contrato e confirmar que a tela mostra o erro dev](<Corretagens.md>) | Corretagens | PAR |
| FSWTBC-663 | [Usuário tenta apurar corretagem de uma corretora sem contrato e o sistema recusa com mensa](<Corretagens.md>) | Corretagens | NÃO |
| FSWTBC-664 | [Usuário digita um trecho no campo lookup de uma tela de corretora e a lista traz só os reg](<Corretagens.md>) | Corretagens | PAR |
| FSWTBC-665 | [Usuário abre uma corretora que já possui corretagens e o campo "dia do vencimento" vem blo](<Corretagens.md>) | Corretagens | NÃO |
| FSWTBC-687 | [Executar a rotina de integração "Pulse" para um registro cujo CEP muda e conferir que a al](<Protheus/Integracao e Filas.md>) | Integracao e Filas | NÃO |
| FSWTBC-688 | [Verificar que a consulta de gestor por posto devolve sempre a mesma matrícula, correta, em](<Gestao de Equipes.md>) | Gestao de Equipes | PAR |
| FSWTBC-689 | [Usuário do RH inicia o processo de Aprovação de Ocorrência e a solicitação nasce e chega à](<RH e Administrativos.md>) | RH e Administrativos | PAR |
| FSWTBC-690 | [Iniciar o processo de Aprovação de Ocorrências a partir do Protheus e confirmar que a soli](<RH e Administrativos.md>) | RH e Administrativos | PAR |
| FSWTBC-691 | [O start do processo de Aprovação de Ocorrências, disparado pelo lado Fluig, cria a solicit](<RH e Administrativos.md>) | RH e Administrativos | PAR |
| FSWTBC-692 | [O comprador movimenta um processo de Negociação de Cotação e ele avança com os valores for](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-693 | [Recusar com mensagem de negócio um documento de prestador cujos títulos têm valor inconsis](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-694 | [Ao concluir a Solicitação de Compras, os subprocessos de Cotação e de Negociação nascem a ](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-695 | [Iniciar uma medição manual de contrato (Faturamento de Contratos) e chegar ao Fiscal de Se](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-696 | [Verificar que nenhuma medição fica órfã em "Aguarda processamento Fila Protheus" e que a f](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1035 | [O responsável grava a medição no Faturamento de Contratos e a gravação conclui, sem exceçã](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1151 | [Calcular o desconto do plano Realize Mais na folha sobre a base correta de verbas](<Protheus/RH - Folha.md>) | RH - Folha | NÃO |
| FSWTBC-1207 | [Conferir que todas as verbas previstas na MIT010 estão marcadas para compor a base de desc](<Protheus/RH - Folha.md>) | RH - Folha | NÃO |
| FSWTBC-1211 | [O responsável encerra a medição no Faturamento de Contratos e o processo segue para a gera](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1215 | [Conferir que o número do item de um produto é o mesmo na Solicitação de Compra e na cotaçã](<Contratos.md>) | Contratos | PAR |
| FSWTBC-1241 | [Editar o valor total (`CNA_VLTOT`) de uma planilha de contrato no GCT sem erro ao abrir o ](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-1279 | [Gerar e manter um pedido de compras no Protheus 12.1.2410 a partir de uma SC integrada, se](<Protheus/Compras.md>) | Compras | NÃO |
| FSWTBC-1280 | [Aplicar realinhamento de preços num contrato vigente e conferir a contabilização das difer](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-1323 | [Verificar que o contrato gerado pela integração grava o mesmo número de cotação da SC/nego](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-1324 | [Aplicar o reajuste periódico de um contrato vigente pelo índice cadastrado e obter nova re](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-1343 | [Configurar índice e periodicidade de reajuste num contrato e confirmar que o GCT calcula a](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-1357 | [Executar o job de processamento de beneficiários e obter numeração de lote única, com o sc](<Protheus/Integracao e Filas.md>) | Integracao e Filas | NÃO |
| FSWTBC-1401 | [O colaborador abre a Solicitação de Férias e os campos customizados da CASSI aparecem pree](<RH e Administrativos.md>) | RH e Administrativos | PAR |
| FSWTBC-1432 | [Gerar a alçada de uma cotação e confirmar que os aprovadores são retornados sem erro de in](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-1462 | [Emitir o relatório de valores contábeis realizados (despesa de comercialização) e conferir](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-1463 | [Incluir um contrato no GCT com caractere especial no número e verificar que a validação re](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1495 | [Incluir grupos de produtos para um fornecedor cuja loja não é a primeira e confirmar que o](<Protheus/Compras.md>) | Compras | NÃO |
| FSWTBC-1501 | [Excluir um cronograma financeiro de planilha de contrato sem travamento e com o saldo a me](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-1502 | [Editar o valor total (`CNA_VLTOT`) da planilha numa revisão aberta de contrato, com o patc](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-1503 | [Enviar uma SC à Validação Orçamentária e confirmar que a trava orçamentária do Protheus (P](<Consultas e Logs.md>) | Consultas e Logs | PAR |
| FSWTBC-1504 | [Verificar que uma solicitação de contrato (nova contratação ou aditivo) sobre contrato vig](<Contratos.md>) | Contratos | PAR |
| FSWTBC-1511 | [Excluir o fechamento de uma SOC baixada por arquivo de retorno bancário e conferir que cad](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-1604 | [Classificar um documento de entrada com frete e conferir que o valor do frete e o custo do](<Protheus/Compras.md>) | Compras | NÃO |
| FSWTBC-1615 | [Gerar o cronograma financeiro de um contrato e medi-lo sem produzir chave duplicada na CNF](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-1650 | [A SC que atinge a alçada gera a grade de aprovadores e distribui a tarefa ao aprovador da ](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-1651 | [O usuário informa percentuais de rateio que somam exatamente 100% e o Fluig aceita o envio](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1684 | [O gerente transfere uma solicitação de compra para outro comprador pelo portal e tanto o f](<Gerencia de Compras.md>) | Gerencia de Compras | PAR |
| FSWTBC-1688 | [Ao atribuir uma SC a um comprador pelo portal, o sistema assume a tarefa antes de moviment](<Gerencia de Compras.md>) | Gerencia de Compras | PAR |
| FSWTBC-1689 | [Verificar que o robô de medição automática abre, na madrugada, um Faturamento de Contratos](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1690 | [Medir um contrato importando a planilha de itens preenchida, a partir do modelo baixado na](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1696 | [Carregar os itens do contrato E01-2025-2101 na medição e gravá-la no Protheus sem erro na ](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1702 | [Abrir um contrato/medição e confirmar que os dados do fiscal de serviço vêm preenchidos a ](<Contratos.md>) | Contratos | PAR |
| FSWTBC-1703 | [Emitir o relatório de Conciliação de Contratos (UGCTR001) e obter linhas para um período c](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-1704 | [Incluir participante, incluir nova proposta e atualizar proposta já enviada na mesma cotaç](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-1707 | [Item da medição com quantidade zerada não exige rateio e não impede o envio da medição.](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1728 | [Aprovador orçamentário abre a atividade "Validação Orçamentária (Sem Gestor)" e vê a lista](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-1751 | [Incluir um contrato pela SC de Nova Contratação e conferir que o saldo nasce igual ao valo](<Contratos.md>) | Contratos | PAR |
| FSWTBC-1753 | [Medir a parcela restante de um contrato já medido parcialmente, com a quantidade exata do ](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1760 | [Abrir uma medição para uma competência que já foi medida e ser informado com clareza de qu](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1762 | [A estrutura pai/filho de aprovadores da SC é gerada com uma linha por aprovador, sem dupli](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-1767 | [Gravar, na base PRIME, um registro com caracteres especiais (ç, ã, é, &, ') pela mesma rot](<Protheus/Dicionario e Pacote.md>) | Dicionario e Pacote | NÃO |
| FSWTBC-1777 | [A medição gerada automaticamente chega ao Fluig com os dados do contrato, e o histórico da](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1789 | [SC antiga, criada antes da mudança do modelo de alçadas, conclui a etapa de alçada sem err](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-1790 | [Gestor abre a Gestão de Equipes e a tela carrega os dados da sua equipe vindos da hierarqu](<Gestao de Equipes.md>) | Gestao de Equipes | PAR |
| FSWTBC-1792 | [Os serviços SOAP que o Portal do Fornecedor usa para iniciar processo e consultar arquivos](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-1796 | [Abrir Despesas de Comercialização (UCOME031) e executar a consulta sem errorlog de coluna ](<Protheus/Dicionario e Pacote.md>) | Dicionario e Pacote | NÃO |
| FSWTBC-1805 | [Gerar o relatório de Valores Contábeis Realizados da Despesa de Comercialização para um pe](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-1813 | [Recusar uma SC na Aprovação de Alçadas e acompanhar o retorno ao comprador, a regeração da](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | PAR |
| FSWTBC-1814 | [Ao receber uma tarefa do processo de compras, o responsável é notificado e a notificação a](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-1815 | [Os itens da medição carregam no formulário de Faturamento de Contratos, e uma falha da API](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1816 | [A grade de aprovadores da etapa de alçada é montada uma única vez, sem duplicar linhas e s](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-1819 | [Contabilizar a medição de um contrato com Contabiliza=Sim e Aglutina=Sim e obter um único ](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-1820 | [Exercitar a rotina de análise de cotação do UCOME024 até a linha que limpa o filtro e conf](<Protheus/Compras.md>) | Compras | NÃO |
| FSWTBC-1823 | [Aprovado o parecer técnico das áreas, as propostas dos fornecedores aparecem na grade da e](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-1893 | [Gravar uma medição cujo item tenha muitas linhas de rateio e ver todas chegarem ao ERP com](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1894 | [Encerrar uma medição com mais de 99 linhas de rateio e obter todos os itens gravados no ER](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1903 | [Realizar a medição de um contrato com centenas de itens e ver o processo concluir sem cair](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1904 | [A medição automática chega ao formulário com os dados do contrato e da competência já pree](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1906 | [Rateio por centro de custo cujas parcelas somam exatamente 100% com casas decimais termina](<Solicitacao de Compras.md>) | Solicitacao de Compras | SIM |
| FSWTBC-1907 | [O gestor orçamentário abre sua etapa e vê todos os itens sob sua responsabilidade.](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-1921 | [Abrir um Aditivo Contratual de prazo para um contrato totalmente medido e obter o aditivo ](<Contratos.md>) | Contratos | PAR |
| FSWTBC-1932 | [Caracterização do caminho: a Negociação de Cotação percorre da definição pelo comprador at](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-1933 | [Conferir que a medição automática de um contrato é disparada no dia configurado na planilh](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1934 | [Conferir o disparo automático de medições da madrugada: uma instância de Faturamento por c](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1942 | [Caracterização de caminho: após atualização do ERP Protheus em homologação, as quatro supe](<Plataforma.md>) | Plataforma | PAR |
| FSWTBC-1943 | [Após atualização de release do Protheus, liberar uma cotação e obter o retorno do ERP sem ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-1952 | [Depurar o REST customizado da cotação (liberação/processamento de quote) com pontos de par](<Protheus/Integracao e Filas.md>) | Integracao e Filas | NÃO |
| FSWTBC-1953 | [Comprador abre a cotação gerada por uma SC e vê exatamente os itens daquela SC, da filial ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-1954 | [Solicitante envia SC cujo rateio soma exatamente 100% com casas decimais terminadas em zer](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-1959 | [Fiscal gera medição manual de um contrato que já tem medição automática na competência e o](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-1962 | [Ajustar o fiscal de uma planilha em contrato multifilial e obter a mesma designação na pla](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-1985 | [Após atualização do Protheus, as telas de Compras/Contratos do Fluig continuam carregando ](<Contratos.md>) | Contratos | SIM |
| FSWTBC-1998 | [Incluir o fiscal de serviço em uma planilha de contrato e obter o fiscal gravado e visível](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-2012 | [Fiscal seleciona contrato e competência no Faturamento e as informações da medição são car](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2013 | [Solicitante anexa um documento à solicitação e ele é gravado uma única vez.](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2014 | [Abrir uma medição e, quando a planilha não existir para a competência escolhida, receber a](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2022 | [Solicitante conclui uma Solicitação de Compras e ela é gravada com número da SC no ERP.](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2023 | [Comprador conclui a etapa de liberação/bloqueio de uma cotação e o registro continua exist](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2024 | [Fiscal confere que o valor unitário da medição no Fluig é idêntico ao do contrato, sem tru](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2025 | [Trocar o tipo de planilha de um contrato para "SEMI FIXA" e continuar medindo sem erro](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-2026 | [Fiscal localiza o fornecedor pelo nome na busca da medição manual e ele aparece na lista.](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2028 | [Abrir a medição de um contrato cuja filial de medição é diferente da filial do contrato e ](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2032 | [Contrato cujo código contém espaço gera medição automática normalmente.](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2038 | [Conferir, ao final do dia de medição, que todos os contratos vigentes com dia de medição c](<Contratos.md>) | Contratos | PAR |
| FSWTBC-2043 | [Gerente transfere para outro comprador uma SC que já havia sido assumida.](<Gerencia de Compras.md>) | Gerencia de Compras | PAR |
| FSWTBC-2053 | [Excluir um item de uma SC rejeitada, reenviá-la, e conferir que o item excluído não volta ](<Plataforma.md>) | Plataforma | PAR |
| FSWTBC-2073 | [Comprador envia a cotação para parecer técnico com anexos por proposta e os anexos ficam g](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2074 | [Aprovador abre a medição de contrato para aprovar e a tela carrega sem erro de JavaScript.](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2076 | [Fornecedor pertencente ao grupo de produto da cotação enxerga a cotação no Portal do Forne](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-2080 | [Registrar a segunda proposta de uma negociação de cotação e conferir que ela é integrada a](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2083 | [Alterar o tipo de pagamento de um pedido de compra sem disparar erro de fórmula na regra d](<Protheus/Compras.md>) | Compras | NÃO |
| FSWTBC-2084 | [O comprador conclui a alçada de uma SC e o fornecedor recebe, por e-mail, exatamente o val](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2105 | [O gestor reprova a alçada de uma solicitação antiga e a reprovação é registrada sem erro, ](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2106 | [Enviar uma SC para aprovação quando o gestor de primeiro nível está com o posto vago e con](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2108 | [Aprovar um contrato no GCT (de "em aprovação" para "vigente") sem crítica no campo CN9_TPC](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-2109 | [Gerar um aditivo de valor em contrato já medido e obter o cronograma financeiro gerado com](<Contratos.md>) | Contratos | PAR |
| FSWTBC-2129 | [O usuário faz upload da planilha de rateio e os percentuais permanecem com as 8 casas deci](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2130 | [Enviar repetidamente SCs do mesmo solicitante e conferir que a atribuição do gestor imedia](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2131 | [Subir a planilha de rateio de uma medição com percentuais de duas casas decimais e ver o t](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2141 | [Encerrar uma medição de contrato pelo Faturamento de Contratos e ver o encerramento conclu](<Contratos.md>) | Contratos | PAR |
| FSWTBC-2142 | [O fiscal encerra uma medição cujo rateio fecha 100% e o encerramento é aceito, sem falha d](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2143 | [Abrir as planilhas de um contrato e selecionar a planilha na medição, confirmando que toda](<Contratos.md>) | Contratos | PAR |
| FSWTBC-2157 | [Depois de um deploy do formulário, o upload da planilha de rateio continua funcionando na ](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2158 | [Conferir que um contrato com medição automática gera exatamente um processo de Faturamento](<Contratos.md>) | Contratos | PAR |
| FSWTBC-2186 | [A SC dispara os pareceres técnicos previstos e **todos** eles chegam ao parecerista com os](<Parecer Tecnico.md>) | Parecer Tecnico | PAR |
| FSWTBC-2187 | [Concluir uma cotação no Fluig e confirmar que o processo só é dado por finalizado quando a](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2230 | [Contabilizar um aditivo de contrato e obter parcelas separadas em curto e longo prazo](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-2233 | [Cancelar a contabilização de um extrato efetivado no Conciliador BackOffice e obter o esto](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-2235 | [Executar a transferência e contabilização LP→CP (UGCTE002) para um contrato e obter lançam](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-2236 | [A SC atravessa a integração com o ERP após a negociação sem falha transacional, e a retent](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2237 | [Uma SC com dois gestores orçamentários registra, no histórico, o nome de quem de fato apro](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2238 | [Várias solicitações de compras atravessam a integração com o ERP em paralelo, no serviço d](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2242 | [O parecerista aprova o parecer técnico e o envio conclui sem erro — caracterização do cami](<Parecer Tecnico.md>) | Parecer Tecnico | PAR |
| FSWTBC-2243 | [O parecerista aprova o parecer técnico e recebe confirmação, nunca uma mensagem "undefined](<Parecer Tecnico.md>) | Parecer Tecnico | PAR |
| FSWTBC-2244 | [Ao subir a planilha de rateio, o usuário é avisado na hora se o percentual não fecha 100% ](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2245 | [O aprovador abre a solicitação na etapa de aprovação e o campo de decisão do gestor está c](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2248 | [Ver que uma falha ao encerrar medição produz uma mensagem legível no Fluig, em vez de esto](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2257 | [Abrir o seletor de Centro de Custo e confirmar que qualquer centro de custo da base é enco](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2278 | [Enviar uma SC cujo produto tenha duas contas contábeis e confirmar que a validação orçamen](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2279 | [O comprador devolve a solicitação para negociação e, ao voltar, a grade de alçadas continu](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2286 | [Consultar a origem de um contrato no Fluig e conferir que "Via Solicitação Compra?" e "Núm](<Portal do Comprador.md>) | Portal do Comprador | SIM |
| FSWTBC-2313 | [Revisar um contrato por aditivo de quantidade e prazo e conferir que o cronograma contábil](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-2315 | [Finalizar uma cotação cuja alçada já foi liberada e ver a finalização ser aceita, sem a cr](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2326 | [Excluir um pedido gerado a partir de uma cotação com vencedores incompletos e conferir que](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2330 | [Conferir o valor da amortização de um contrato com realinhamento pelo cronograma financeir](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-2331 | [Alterar um contrato, fechar a tela de contabilização sem confirmar e conferir que a movime](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-2332 | [Executar a Apropriação de Despesa Antecipada para um contrato sem parcelas a apropriar e c](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-2333 | [Realinhar o preço de um contrato de longa duração e conferir a separação do valor contabil](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-2347 | [Enviar uma Solicitação de Compras com muitos itens e a integração com o ERP disparar uma v](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2348 | [Conferir que a Filial de Entrega enviada ao ERP é a filial real do item, e não o valor pad](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2357 | [Liberar a proposta de um fornecedor no Fluig e confirmar que a cotação deixa de estar trav](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2364 | [Um Parecer Técnico que falha ao ser concluído não deixa a Solicitação de Compras de origem](<Parecer Tecnico.md>) | Parecer Tecnico | PAR |
| FSWTBC-2368 | [Percorrer uma cotação de ponta a ponta e confirmar que o parecer técnico só é solicitado d](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2386 | [Anexar a proposta de duas lojas do mesmo fornecedor no Parecer Técnico e ver cada anexo fi](<Parecer Tecnico.md>) | Parecer Tecnico | PAR |
| FSWTBC-2387 | [Enviar propostas de uma cotação após a cotação genérica ter sido excluída e conferir que a](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2388 | [Abrir o Parecer Técnico de uma cotação e ver a grade de fornecedores preenchida — ou, se n](<Parecer Tecnico.md>) | Parecer Tecnico | PAR |
| FSWTBC-2404 | [Percorrer as quatro telas de avaliação de propostas do Portal do Comprador e conferir, uma](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2424 | [Reprovar um Parecer Técnico e a Solicitação de Compras de origem conservar a cotação e os ](<Parecer Tecnico.md>) | Parecer Tecnico | PAR |
| FSWTBC-2430 | [Abrir uma Solicitação de Compras na atividade Validação do Comprador (Negociação) e a grad](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2431 | [Disparar a integração de plano de saúde Protheus → SOC pelo botão e pelo schedule ao mesmo](<Protheus/RH - Folha.md>) | RH - Folha | NÃO |
| FSWTBC-2440 | [Anexar um documento na etapa de Parecer Técnico, movimentar e o anexo continuar lá ao reab](<Parecer Tecnico.md>) | Parecer Tecnico | PAR |
| FSWTBC-2531 | [Registrar uma batida pelo app SouCASSI e conferir que ela aparece em "Batidas do dia" do M](<Protheus/RH - Folha.md>) | RH - Folha | NÃO |
| FSWTBC-2532 | [Finalizar o Parecer Técnico e a Solicitação de Compras avançar para Validação do Comprador](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2536 | [O comprador centraliza solicitações de compra e confirma, no Fluig, que a SC](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2547 | [O aprovador abre uma SC em Aprovação de Alçada cujo fornecedor vencedor tem muitos](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2548 | [Importar na medição uma planilha de rateio que soma exatamente 100% e o Fluig aceitar sem ](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2556 | [Após uma medição ser gravada, o contrato recebe o agendamento da medição seguinte e a](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2574 | [Calcular o pró-rata de um colaborador com mudança de step no mês e um abono de luto e conf](<Protheus/RH - Folha.md>) | RH - Folha | NÃO |
| FSWTBC-2598 | [Enviar do SOC ao Protheus um documento com filial inexistente e conferir que o retorno ide](<Protheus/Integracao e Filas.md>) | Integracao e Filas | NÃO |
| FSWTBC-2634 | [O fiscal abre uma medição de contrato e a grade "Itens da Medição" carrega os itens e o](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2635 | [As medições automáticas do dia são geradas e cada contrato elegível ganha sua instância](<Contratos.md>) | Contratos | PAR |
| FSWTBC-2636 | [Verificar que os processos de Cotação e de Negociação não exibem anexos de proposta — os a](<Portal do Comprador.md>) | Portal do Comprador | ? |
| FSWTBC-2668 | [Quando a API que busca o Gestor Orçamentário falha, a Solicitação de Compras desvia para a](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2677 | [O anexo de uma proposta é aberto a partir da negociação e o documento abre, em vez de](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2680 | [Selecionar na medição uma competência já medida e o sistema explicar por que não há itens,](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2681 | [Uma SC enviada para validação cai para o **gestor imediato** do solicitante, e a grade](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2682 | [Tentar gravar uma medição cujo rateio não soma 100% e o sistema barrar com crítica explíci](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2684 | [Finalizar a compra e o e-mail ao fornecedor vencedor chegar com todos os itens aprovados, ](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2687 | [Abrir a etapa de Parecer Técnico e identificar de imediato o processo Fluig, a filial e o ](<Parecer Tecnico.md>) | Parecer Tecnico | ? |
| FSWTBC-2688 | [Importar na medição uma planilha de rateio com valores formatados como moeda e o sistema i](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2689 | [Comprador devolve a cotação para a Solicitação de Compras e a lista de fornecedores/itens ](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2690 | [O aprovador reprova uma SC na Aprovação de Alçada e a recusa é aceita — inclusive com](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2709 | [Emitir o relatório de corretagem calculada por período de apuração (DOC044) e conferir que](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-2711 | [Fiscal informa o rateio da medição do contrato somando exatamente 100% e o sistema aceita,](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2720 | [Um fornecedor que já completou e teve o cadastro aprovado **deixa de receber** o e-mail](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-2737 | [Gestor orçamentário registra o parecer (justificativa) ao aprovar ou reprovar o item orçam](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2743 | [Marcar uma planilha de contrato como "zerar saldos" (CPC 06) e conferir que só ela é zerad](<Protheus/Contratos - GCT.md>) | Contratos - GCT | PAR |
| FSWTBC-2752 | [Solicitante cadastra fornecedor informando telefone sem máscara e o processo aceita e norm](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-2755 | [A criação em lote das solicitações de medição automática conclui dentro do tempo e cada](<Consultas e Logs.md>) | Consultas e Logs | PAR |
| FSWTBC-2766 | [Sincronização de medição automática roda duas vezes no mesmo dia e o sistema não abre medi](<Protheus/Integracao e Filas.md>) | Integracao e Filas | PAR |
| FSWTBC-2772 | [O comprador informa um valor de negociação na casa dos milhares e o valor chega ao ERP](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2790 | [Comprador assume (atribui a si) uma SC pela aba Atribuir do Portal de Gerência de Compras.](<Gerencia de Compras.md>) | Gerencia de Compras | PAR |
| FSWTBC-2804 | [Liberadas as alçadas pelo processo do Fluig, a integração confirma a liberação e o](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2805 | [Enviar o fechamento SOC → Protheus depois de um processamento interrompido e conferir que ](<Protheus/Integracao e Filas.md>) | Integracao e Filas | NÃO |
| FSWTBC-2833 | [Fiscal repete a medição do contrato recorrente (Uber) com planilha 100% conferida e a vali](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2834 | [Comprador abre o Portal do Comprador (Compras Centralizadas) e as informações carregam por](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2835 | [Um contrato tem a situação alterada para **Vigente** e o Fluig passa a exibi-lo como](<Contratos.md>) | Contratos | PAR |
| FSWTBC-2886 | [O Fluig gera a medição de contrato e a solicitação "Realizar Medição do Contrato" aparece ](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2887 | [Usuário edita o cadastro da corretora e apenas os campos previstos na documentação ficam h](<Corretagens.md>) | Corretagens | NÃO |
| FSWTBC-2889 | [Comprador centraliza SCs de várias filiais sob uma filial centralizadora e o retorno é pro](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2890 | [Alterar a situação de um contrato para "Vigente" com a alçada de contratos habilitada e co](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-2913 | [O fiscal baixa a planilha modelo de itens da medição, preenche as quantidades e importa](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-2914 | [Abrir pela Central de Tarefas uma SC na Aprovação de Alçada e conferir que o aprovador des](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-2930 | [Fornecedor envia uma nova proposta pelo Portal do Fornecedor e o envio é aceito na versão ](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-2943 | [Acompanhar as solicitações de Faturamento de Contratos abertas pela medição automática e c](<Consultas e Logs.md>) | Consultas e Logs | PAR |
| FSWTBC-2944 | [Comprador marca "Não" em "Enviar para parecer técnico?" e o processo volta direto para ele](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2946 | [Conferir, após encerrada a negociação, que só os fornecedores que participaram dela seguem](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-2951 | [Incluir uma revisão do tipo "Reajuste" com data retroativa em contrato com planilha de vár](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-2988 | [Centralizar solicitações pelo Portal do Comprador e conferir que a SC centralizadora nasce](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3007 | [Medição disparada manualmente calcula a mesma data de vigência da planilha que a medição a](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3014 | [Abrir "Outras Ações" na rotina de contratos e conferir que a opção "Est. Refazer Prov. Con](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-3030 | [Conferir que o e-mail de finalização do pedido de compras lista todos os itens da SC e o v](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-3031 | [Tentar enviar uma SC cujo item tenha rateio somando menos de 100% e confirmar que o Fluig ](<Consultas e Logs.md>) | Consultas e Logs | PAR |
| FSWTBC-3060 | [Realinhar o preço de uma parcela de contrato e conferir que o lançamento contábil do reali](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-3100 | [Executar o relatório/rotina contábil ajustada na homologação da DEM10014371 (fontes ERESP2](<Protheus/Integracao e Filas.md>) | Integracao e Filas | NÃO |
| FSWTBC-3107 | [Enviar planilha de rateio com valor negativo e confirmar que o sistema recusa o arquivo — ](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3108 | [Realizar a medição de um contrato pelo Fluig e confirmar que a integração conclui dentro d](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3116 | [Selecionar uma planilha semi-fixa na medição manual e confirmar que os itens carregam, ou ](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3138 | [Excluir um fechamento NDF pela API de Contas a Pagar (bondsPay, método DELETE) e conferir ](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-3139 | [Gerar o cronograma contábil de um contrato novo de 36 meses e conferir que a provisão cont](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-3150 | [Concluir uma medição no Faturamento de Contratos e conferir, no Histórico, que a atividade](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3151 | [Registrar o retorno de um colaborador de férias que já tem outra ausência futura cadastrad](<Protheus/RH - Folha.md>) | RH - Folha | NÃO |
| FSWTBC-3152 | [Cadastrar fornecedor pelo Portal e confirmar que CNPJ já existente é barrado antes da grav](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-3153 | [Cadastrar fornecedor pelo Fluig com dados bancários e confirmar que eles são aproveitados ](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-3156 | [Incluir um novo participante numa cotação já aberta e, em seguida, atualizar a proposta — ](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-3206 | [Antes de solicitar revisão de um contrato, consultar no Fluig se existe processo em aberto](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3216 | [Executar a chamada REST de corretagens (DEM10011184) em homologação e conferir que respond](<Protheus/Integracao e Filas.md>) | Integracao e Filas | NÃO |
| FSWTBC-3264 | [Incluir uma nova revisão em contrato com provisão de curto/longo prazo já contabilizada e ](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-3265 | [Integrar documentos de pagamento de prestador contendo um documento inválido e conferir qu](<Protheus/Integracao e Filas.md>) | Integracao e Filas | NÃO |
| FSWTBC-3266 | [Deixar o disparo automático de medição rodar no dia configurado e confirmar que contratos ](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3312 | [Conferir que a medição automática abriu as solicitações no Fluig para as quatro periodicid](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3355 | [Alterar o status de um contrato com campos customizados de provisão (voltar para "Em elabo](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-3358 | [Estornar a última revisão de um contrato e recuperar a revisão anterior sem erro de execuç](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-3361 | [Gerar o pedido de compras a partir da cotação e confirmar que o Controle de Alçada não rec](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-3362 | [Verificar que as medições automáticas do dia são disparadas para todos os contratos elegív](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3416 | [Percorrer a Requisição de Compra entregue na DEM10013707 conferindo máscaras nos campos de](<Parecer Tecnico.md>) | Parecer Tecnico | PAR |
| FSWTBC-3418 | [Apurar corretagens de um período e ver a corretagem apurada listada com a data de apuração](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-3435 | [Abrir a etapa de validação orçamentária de uma SC e confirmar que os itens são listados e ](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-3441 | [Incluir um contrato (manualmente no Protheus e via SC de Nova Contratação no Fluig) e vê-l](<Contratos.md>) | Contratos | PAR |
| FSWTBC-3442 | [Visualizar um contrato existente no Protheus (e sua ficha no Fluig) sem erro de dicionário](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-3443 | [Conferir que nenhuma SC sai do Fluig com percentual de rateio negativo ou acima de 100% em](<Consultas e Logs.md>) | Consultas e Logs | PAR |
| FSWTBC-3482 | [Acompanhar um contrato recém-gerado pela SC até ficar Vigente, passando obrigatoriamente p](<Contratos.md>) | Contratos | PAR |
| FSWTBC-3488 | [Criar SC cujo gestor orçamentário esteja afastado com substituto cadastrado e confirmar qu](<Consultas e Logs.md>) | Consultas e Logs | PAR |
| FSWTBC-3489 | [Aprovar (sem concluir) na etapa orçamentária e confirmar que a data/hora da aprovação são ](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-3490 | [Aprovar um contrato de Despesa Antecipada e encontrar a contabilização (provisão) gerada j](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-3491 | [Realinhar preços de um contrato marcando a parcela como não apropriada e ver a contabiliza](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-3517 | [Realizar a medição de um contrato de planilha fixa e conferir que a quantidade trazida não](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3529 | [Abrir uma SC na Validação Orçamentária estando o gestor em período de substituição e confe](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-3549 | [Encerrar a medição de um contrato e conferir que a integração com o ERP conclui, registran](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3555 | [Alterar a quantidade de um item pelo Portal do Fornecedor e confirmar que a quantidade nov](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-3573 | [Conferir a regra da flag "Houve Prestação de Serviço?" na medição: com **Não**, a medição ](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3590 | [Integrar documentos de pagamento e localizá-los no Protheus na primeira tentativa, com o r](<Consultas e Logs.md>) | Consultas e Logs | PAR |
| FSWTBC-3597 | [Percorrer a Avaliação de Propostas do Portal do Comprador conferindo a nomenclatura do mod](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3598 | [Gerar contrato a partir de uma cotação vencedora quando já existem contratos com numeração](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3599 | [Concluir uma medição no Fluig e conferir que ela existe no Protheus, cruzando pelo Tracker](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3600 | [Confirmar que a base DES está compatibilizada para a DEM10011184 (Corretagens): dicionário](<Protheus/Dicionario e Pacote.md>) | Dicionario e Pacote | NÃO |
| FSWTBC-3601 | [Na base DES replicada, encerrar a situação de um contrato com planilhas de tipos diferente](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-3602 | [Na base DES replicada, cadastrar um colaborador e um dependente usando as novas composiçõe](<Protheus/RH - Folha.md>) | RH - Folha | NÃO |
| FSWTBC-3603 | [Como fornecedor, enviar o BOOK trabalhista pelo Portal do Fornecedor ("Envio de Documentos](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | PAR |
| FSWTBC-3604 | [Iniciar uma Delegação de Fiscais de Contrato/Serviço no Fluig, selecionando contrato, plan](<Contratos.md>) | Contratos | PAR |
| FSWTBC-3612 | [Como comprador, abrir o Portal do Comprador e avaliar propostas de uma cotação, com compra](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3614 | [Configurar contrato/planilha para medição automática e conferir que o processo de medição ](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3615 | [Incluir um contrato num ambiente onde a fila de medições (ZZZ) tem tabela e índice aplicad](<Contratos.md>) | Contratos | PAR |
| FSWTBC-3617 | [Percorrer uma SC centralizada até a etapa de Distribuição Gestor Orçamentário e conferir q](<Solicitacao de Compras.md>) | Solicitacao de Compras | SIM |
| FSWTBC-3622 | [Centralizar solicitações de compra e conferir que se gera uma SC por filial de entrega, or](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3623 | [Conferir que todos os itens gravados numa SC permanecem nela até o fim do ciclo, comparand](<Contratos.md>) | Contratos | PAR |
| FSWTBC-3624 | [Lançar documento de entrada de serviço de saúde de um fornecedor que recolhe ISS e confirm](<Protheus/Compras.md>) | Compras | NÃO |
| FSWTBC-3625 | [Incluir um contrato num ambiente onde a tabela ZZZ existe fisicamente e está no dicionário](<Contratos.md>) | Contratos | PAR |
| FSWTBC-3626 | [Após a cotação aprovada, conferir na SC quais fornecedores foram marcados como exclusivos ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3636 | [Tentar marcar o vencedor de uma cotação cuja negociação ainda não foi aprovada, confirmand](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3637 | [Concluir o fluxo de compras centralizadas e conferir que o pedido/contrato é gerado e o nú](<Contratos.md>) | Contratos | PAR |
| FSWTBC-3654 | [Após uma virada de release do Protheus, conferir que os campos customizados de multa e bon](<Protheus/Dicionario e Pacote.md>) | Dicionario e Pacote | NÃO |
| FSWTBC-3665 | [Aguardar a geração do contrato a partir da cotação e conferir que o número volta ao Fluig ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3666 | [Abrir uma SC na etapa "Aguarda Geração do Pedido/Contrato" e confirmar que o formulário ca](<Contratos.md>) | Contratos | PAR |
| FSWTBC-3669 | [Receber o repasse da DEM10013021 e executar, no Protheus de homologação, o roteiro de cada](<Protheus/RH - Folha.md>) | RH - Folha | NÃO |
| FSWTBC-3670 | [Conferir que o comprador que conduziu o processo consegue editar o contrato gerado a parti](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3690 | [Centralizar solicitações de compra e confirmar que o agrupamento considera a filial de ent](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3696 | [Revisar um contrato com parcelas classificadas em curto e longo prazo e conferir que a pro](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-3697 | [Enviar anexo em uma proposta de cotação e conferir que ele é exibido na avaliação.](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3707 | [Atribuir um comprador a uma Solicitação de Compras parada na Gerência de Compras e ver o p](<Gerencia de Compras.md>) | Gerencia de Compras | PAR |
| FSWTBC-3708 | [Trocar entre Pedido de Compra e Contrato depois da análise da cotação, sem precisar refaze](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3714 | [Corrigir, na validação do comprador, um valor digitado errado pelo fornecedor — informando](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3715 | [Localizar uma cotação pelo número do processo do Fluig, sem depender do número do ERP.](<Portal do Comprador.md>) | Portal do Comprador | SIM |
| FSWTBC-3716 | [Cancelar uma solicitação de compras pela Avaliação de Propostas e conferir que SC e cotaçõ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3728 | [Gravar o fornecedor vencedor da cotação e conferir que a alçada de aprovação é gerada com ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3731 | [Concluir a Validação do Comprador e conferir que o processo avança para a etapa seguinte s](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3732 | [Conferir que o comprador não consegue alterar o valor estimado da SC, que permanece o que ](<Portal do Comprador.md>) | Portal do Comprador | SIM |
| FSWTBC-3733 | [Conferir que as aprovações já dadas pelo Gestor e pelo Gestor Orçamentário continuam visív](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3735 | [Conferir que o número de tarefas anunciado ao comprador é igual ao número de solicitações ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3736 | [Cancelar a proposta de um fornecedor na avaliação da cotação e conferir que ela realmente ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3737 | [Devolver uma proposta para negociação com justificativa e conferir que o fornecedor é noti](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3738 | [Eleger o fornecedor vencedor da cotação pelo ícone de coroa na tela de definição de venced](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3739 | [Cancelar uma solicitação de compras a partir da Avaliação de Propostas e ser conduzido por](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3746 | [Conferir que o parecer técnico continua sendo exigido e roteado para a área demandante, co](<Parecer Tecnico.md>) | Parecer Tecnico | PAR |
| FSWTBC-3747 | [Ativar a seleção de fornecedores na validação do comprador sem escolher nenhum e conferir ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3749 | [Acompanhar uma SC que ficou aguardando o Protheus e conseguir dizer, pela tela, se ela est](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-3750 | [Cancelar as cotações vinculadas a uma SC quando o cancelamento NÃO é possível, e receber o](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3755 | [Verificar que um contrato vigente com documentação obrigatória cadastrada entra na fila de](<Contratos.md>) | Contratos | PAR |
| FSWTBC-3757 | [Validar, antes de subir para produção, que a tabela de fila de medições ZZZ existe e respo](<Protheus/Integracao e Filas.md>) | Integracao e Filas | PAR |
| FSWTBC-3765 | [Informar desconto no item de uma medição cujo contrato é de planilha fixa, e conseguir con](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3766 | [Digitar um desconto sem vírgula na medição de planilha semi-fixa e conferir que o campo fo](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3767 | [Conferir que texto com acentuação escrito pelo comprador aparece corretamente na etapa de ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3768 | [Aprovar um contrato novo com controle orçamentário e conferir que o PCO recebe o lançament](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-3770 | [Levar uma Solicitação de Compras até a integração com o ERP posterior à alçada e confirmar](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-3771 | [Confirmar que um processo iniciado na base de homologação não dispara e-mail para endereço](<Faturamento de Contratos.md>) | Faturamento de Contratos | NÃO |
| FSWTBC-3778 | [Filtrar o Controle de Cotações por um número de cotação e confirmar que a grade passa a ex](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3781 | [Conceder a um participante do processo de Recepção de Documentos Fiscais o acesso de apena](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-3782 | [Ver, no Portal do Fornecedor, a documentação obrigatória cadastrada no contrato que o forn](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-3787 | [Na revisão de um contrato contabilizado, abrir "Outras ações" e conferir que a opção "Esto](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-3788 | [Aprovar pela alçada um contrato com "Contabiliza = Sim" e conferir que a aprovação conclui](<Protheus/Dicionario e Pacote.md>) | Dicionario e Pacote | NÃO |
| FSWTBC-3789 | [Encontrar a nomenclatura "Documentação Obrigatória" nos três pontos onde antes se lia "Boo](<Portal do Fornecedor.md>) | Portal do Fornecedor | NÃO |
| FSWTBC-3792 | [Cadastrar um tipo de contrato apenas com cronograma contábil (sem cronograma financeiro) e](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-3797 | [Conferir, na Avaliação de Propostas, que o percentual de Saving de cada proposta bate com ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3813 | [Abrir uma SC na etapa de Aprovação de Alçada e confirmar que o aprovador vê o valor da com](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-3815 | [Encerrar a medição mensal de um contrato contabilizado e conferir que o lançamento contábi](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-3824 | [Navegar para a frente e para trás entre as páginas do Controle de Cotações e confirmar que](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3832 | [Aprovar uma medição de contrato com planilha do tipo fixa, sem alterar valores, e confirma](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3840 | [Atribuir um comprador a uma solicitação pela aba Atribuir da Gerência de Compras e confirm](<Gerencia de Compras.md>) | Gerencia de Compras | SIM |
| FSWTBC-3841 | [Concluir uma Solicitação de Compras no Fluig e confirmar, pela própria tela, que ela foi c](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-3842 | [Alterar a data de validade de uma cotação pelo Controle de Cotações e confirmar que a nova](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3860 | [Aprovar duas medições do mesmo contrato quase ao mesmo tempo e conferir que cada processo ](<Faturamento de Contratos.md>) | Faturamento de Contratos | SIM |
| FSWTBC-3863 | [Alterar um contrato para Vigente com a alçada de contratos ligada e conferir que a AKD rec](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-3864 | [Concluir uma medição no Faturamento de Contratos de um contrato que passou por eliminação ](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3869 | [Alterar um contrato vigente para "Em elaboração" e conferir que o cronograma contábil (CNW](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-3875 | [Tentar anexar documento a uma Solicitação de Compras cuja cotação já foi liberada aos forn](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-3876 | [Incluir um documento de entrada para um fornecedor após a aplicação do pacote DEM10014951 ](<Protheus/Dicionario e Pacote.md>) | Dicionario e Pacote | NÃO |
| FSWTBC-3878 | [Tentar enviar uma Solicitação de Compras sem informar o produto e ser barrado no Fluig, co](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-3881 | [Informar desconto numa medição e conferir que ele chega ao Protheus e reduz o saldo do con](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3883 | [Localizar uma cotação centralizada no Controle de Cotações e confirmar que ela aparece em ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3884 | [Abrir uma SC criada por centralização e confirmar que cada item mostra a SC de origem e a ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3891 | [Abrir a etapa de negociação de uma cotação e confirmar que os fornecedores participantes s](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3893 | [Selecionar fornecedores na Validação Inicial de uma SC e confirmar que o sistema exige o n](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3896 | [Ler por inteiro a justificativa de uma solicitação na lista de Validação Inicial do Portal](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3902 | [Apurar o ponto de um funcionário com falta autorizada de meio período, atraso autorizado e](<Protheus/RH - Folha.md>) | RH - Folha | NÃO |
| FSWTBC-3910 | [Confirmar que a rotina "Gera Documento" executou na janela agendada e que os processos que](<Protheus/Integracao e Filas.md>) | Integracao e Filas | PAR |
| FSWTBC-3911 | [Validar uma proposta no Portal do Comprador e conferir que os dados do responsável pela va](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3917 | [Conferir que uma cotação originada de SC centralizada aparece para o fornecedor no Portal ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3918 | [Registrar uma delegação informando o período completo, com data inicial e data final.](<RH e Administrativos.md>) | RH e Administrativos | SIM |
| FSWTBC-3919 | [Delegar fiscal de contrato quando nenhum colaborador atende à exigência de cursos amarrado](<Contratos.md>) | Contratos | PAR |
| FSWTBC-3928 | [Baixar a planilha padrão de itens da medição, preenchê-la e reenviá-la por upload no Fatur](<Faturamento de Contratos.md>) | Faturamento de Contratos | NÃO |
| FSWTBC-3931 | [Acompanhar a fila de integração de uma solicitação parada em "Aguarda Criar Pedido de Comp](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-3935 | [Alterar um pedido de compras emitido no exercício anterior, já no exercício novo, e confer](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-3940 | [Importar a planilha de itens (produtos) na medição de um contrato sem receber crítica inde](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3955 | [Garantir que uma SC já aprovada pelo Gestor Orçamentário não seja cancelada automaticament](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-3956 | [Medir o tempo de geração e encerramento das medições de um contrato de alto volume e confi](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3957 | [Quando o mecanismo de atribuição por alçada não localiza os aprovadores, a SC deve cair nu](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-3959 | [Revisar um contrato com realinhamento de valor e conferir, no Protheus e no Acompanhamento](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3961 | [Abrir uma SC na etapa de Validação Orçamentária e conferir que o valor a aprovar é exibido](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-3963 | [Reexecutar a gravação do vencedor sobre uma cotação já finalizada deve ser ignorada em sil](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-3985 | [Importar a planilha de rateio no Faturamento de Contratos e conferir que as linhas são efe](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3988 | [Após importar a planilha na medição, conferir que os valores dos itens continuam sendo exi](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-3989 | [Acompanhar a fila de medição (ZZZ) drenando de ponta a ponta, com a máquina de estados N→A](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4052 | [Cadastrar uma corretora pela API de Corretoras, apurar a corretagem e gerar o pedido de co](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-4065 | [Confirmar que as medições automáticas do mês nascem para todos os contratos configurados, ](<Protheus/Integracao e Filas.md>) | Integracao e Filas | PAR |
| FSWTBC-4068 | [Medir um contrato com múltiplas planilhas e confirmar que todas as planilhas ficam disponí](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4072 | [Abrir uma nova Solicitação de Compras com item contábil preenchido, sem receber a help cru](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4073 | [Consultar o painel de Acompanhamento de Contratos e conferir que cada contrato aparece uma](<Contratos.md>) | Contratos | SIM |
| FSWTBC-4075 | [Confirmar que o painel de Acompanhamento de Contratos nega acesso a usuário fora do grupo ](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4076 | [Identificar o fornecedor de cada contrato direto na grade de Acompanhamento de Contratos, ](<Contratos.md>) | Contratos | ? |
| FSWTBC-4077 | [Conferir que o painel de Acompanhamento de Contratos lista, para um usuário comum, apenas ](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4078 | [Abrir o modal de planilhas de um contrato pela coluna Ação do Acompanhamento de Contratos.](<Contratos.md>) | Contratos | ? |
| FSWTBC-4093 | [Ordenar a lista de propostas do Portal do Comprador pelo Valor Final, do menor para o maio](<Portal do Comprador.md>) | Portal do Comprador | SIM |
| FSWTBC-4094 | [Consultar, no próprio Fluig, o número do pedido/contrato gerado no Protheus a partir dos d](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4095 | [Conferir que o Controle de Cotações exibe apenas cotações vigentes e sob responsabilidade ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4096 | [Cancelar uma Solicitação de Compras e confirmar que as negociações derivadas dela deixam d](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4110 | [Cancelar uma proposta de negociação e confirmar que o processo principal sai de "Aguarda F](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4115 | [Contabilizar o reajuste de um contrato com juros e localizar o lançamento dos juros na con](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-4121 | [Acompanhar uma medição de contrato enviada ao Protheus e vê-la sair de "Aguarda processame](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4122 | [Realizar a medição de um contrato escolhendo uma competência e ter a medição, o saldo e o ](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4126 | [Conferir que a grade do Portal do Comprador exibe o número da SC e o número do processo Fl](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4127 | [Levar uma SC até o Disparo de E-mails e confirmar que a etapa conclui — e que, se o serviç](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4128 | [Tratar o parecer técnico de uma SC no Portal do Comprador e ter a tela coerente com a opçã](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4145 | [Aprovar, como comprador responsável, a proposta de uma negociação e confirmar que a cotaçã](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4146 | [Definir o vencedor no Portal do Comprador e ver a SC sair de "Aguarda Geração Alçadas" par](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4153 | [Clicar duas vezes seguidas em Confirmar na abertura de uma Solicitação de Compra e confirm](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4156 | [Medir, pelo Fluig, a latência da fila de Compras entre a gravação e o retorno do Protheus,](<Consultas e Logs.md>) | Consultas e Logs | PAR |
| FSWTBC-4157 | [Medir um contrato novo e conferir que o valor da medição coincide com o previsto no Cronog](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-4159 | [Definir o vencedor de uma cotação no Portal do Comprador e receber confirmação de sucesso ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4176 | [Com uma medição em aberto no Fluig, o Protheus deve recusar a abertura de revisão do contr](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4178 | [Medir quantas requisições cada tela de Compras dispara para renderizar, e confirmar que co](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4192 | [Encerrar uma medição com serviço prestado e itens medidos e ter o processo terminar em "Fi](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4198 | [Agendar férias pelo Fluig, receber o aviso de férias para aceite e, após o processamento, ](<RH e Administrativos.md>) | RH e Administrativos | PAR |
| FSWTBC-4207 | [Alterar a data de validade de uma cotação no Portal do Comprador e vê-la refletida na grad](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4213 | [Uma SC sem orçamento deve parar em "Verificar retorno Protheus" sem gerar pedido; com orça](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4229 | [Abrir uma Solicitação de Compras e vê-la integrar com o ERP, chegando à Validação do Gesto](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4230 | [Atribuir um comprador a uma SC na Gerência de Compras sem que a tarefa tenha sido assumida](<Gerencia de Compras.md>) | Gerencia de Compras | PAR |
| FSWTBC-4232 | [Informar a "Data de Validade da Cotação" na validação do comprador e ver a cotação nascer ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4234 | [Quando a liberação do documento no ERP falha, a SC deve exibir a mensagem real do Protheus](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4237 | [Abrir o parecer de uma SC encaminhada a várias áreas e confirmar que as respostas de todas](<Parecer Tecnico.md>) | Parecer Tecnico | PAR |
| FSWTBC-4245 | [Fornecedor reenvia proposta depois que a SC volta para "Aguarda Finalizar Cotação" por rep](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-4247 | [Medição automática agendada para o último dia do mês é gerada e aparece na fila de mediçõe](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4248 | [Gerar um contrato a partir de uma Solicitação de Compras e obter número sequencial válido ](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4263 | [A etapa que espera o retorno do ERP após a geração do pedido/contrato aparece no histórico](<Consultas e Logs.md>) | Consultas e Logs | PAR |
| FSWTBC-4264 | [SC com Tipo de Compra "Contrato" gera contrato no ERP e segue para "Aguarda Vigência do Co](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4266 | [Conferir, antes de a medição seguir, que os dados de faturamento e o e-mail do fornecedor ](<Faturamento de Contratos.md>) | Faturamento de Contratos | NÃO |
| FSWTBC-4273 | [Fazer o fornecedor movimentar a cotação sem alterar valor e confirmar que o portal explica](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-4287 | [Conferir que a lista de itens da SC chega íntegra ao gestor orçamentário na finalização e ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4297 | [Consultar os alertas de Período Fatal de Férias (tabela ZZH) pela rotina de visualização e](<Protheus/RH - Folha.md>) | RH - Folha | NÃO |
| FSWTBC-4298 | [Fornecedor aprovado reenvia proposta com valor menor após "Retornar para Negociação" e a n](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-4299 | [Exportar os dados de uma cotação pelo Portal do Comprador e confirmar que a planilha é ger](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4300 | [Reprovar uma solicitação na Validação Inicial do comprador informando só a justificativa —](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4302 | [Acionar "Ver Solicitação da Compra" durante a cotação e confirmar que a SC abre completa, ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4303 | [Comprador altera valor da proposta e só consegue salvar depois de preencher a justificativ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4304 | [Comprador centraliza SCs selecionadas na Validação Inicial e recebe confirmação, com a SC ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4305 | [SC centralizada aparece para o comprador central no Portal do Comprador e no Tracker](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4306 | [Executar a Transferência LP→CP para todas as filiais com "não ver lançamento" e receber um](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-4307 | [Transferir para Curto Prazo a parcela de um contrato com várias planilhas e obter o valor ](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-4311 | [Comprador confere o prazo de entrega de cada item na tela de cotação e o leva para a plani](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4312 | [Consultar, no formulário da SC, quem aprovou ou reprovou cada linha da alçada e quando.](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4315 | [Executar a Apropriação de Despesa Antecipada em dois meses consecutivos e obter, em cada m](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-4316 | [Busca de produto na SC e nos filtros do Portal do Comprador não oferece itens do grupo 330](<Portal do Comprador.md>) | Portal do Comprador | NÃO |
| FSWTBC-4317 | [Localizar um item numa lista de seleção do Portal do Comprador esperando ordem alfabética.](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4323 | [Comprador identifica pelo farol de status quais SC já podem ser conduzidas pelo Portal, se](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4336 | [Após alçada reprovada com retorno para negociação e escolha de novos valores (proposta 03)](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4337 | [Após alçada reprovada com retorno para cotação e escolha de outro fornecedor participante,](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4338 | [Após alçada reprovada com acionamento do 2º colocado (novo fornecedor), a alçada é regerad](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4341 | [Recolher os itens de uma cotação longa na tela de Controle de Cotação, como já é possível ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4342 | [Abrir a solicitação de compra de origem sem sair da tela de Controle de Cotação.](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4344 | [Selecionar fornecedores de uma UF específica ao montar a cotação.](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4347 | [Garantir que uma SC que já seguiu para alçada não fique disponível para reavaliação de pro](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4348 | [Conferir na SC que a informação de Parecer Técnico reflete o parecer que realmente ocorreu](<Parecer Tecnico.md>) | Parecer Tecnico | PAR |
| FSWTBC-4349 | [Anexar documentação comprobatória e registrar justificativa ao definir o vencedor da cotaç](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4350 | [Após "Retorno para Alçada – Regerar Documento" o processo regera a alçada sozinho, sem nov](<Parecer Tecnico.md>) | Parecer Tecnico | PAR |
| FSWTBC-4351 | [Grades de Definir Vencedor Cotação e Avaliação de Propostas exibem as colunas na ordem def](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4353 | [Usar o comando de visualizar a cotação/negociação em resoluções diferentes sem perder o co](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4354 | [Bloquear novos participantes de uma cotação só depois do envio concluído e só com parecer ](<Parecer Tecnico.md>) | Parecer Tecnico | PAR |
| FSWTBC-4357 | [Abrir uma Solicitação de Compras com preço estimado informado e ver esse preço chegar ínte](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4358 | [Acompanhar na aba "Solicitacoes ZZY" um item de fila com payload inválido e vê-lo marcado ](<Consultas e Logs.md>) | Consultas e Logs | PAR |
| FSWTBC-4359 | [Conferir se os valores exibidos na tela de Controle de Cotação batem para uma SC centraliz](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4360 | [Saber para qual filial vai cada item da proposta, na tela e na planilha, em compra central](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4361 | [Abrir uma nova Solicitação de Compras e conferir que o painel de reaproveitamento lista ap](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4362 | [Iniciar uma medição do contrato 6227-2025-5303 escolhendo a planilha 000002 e ver os itens](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4415 | [Delegar a fiscalização de um contrato e ver a lista de colaboradores elegíveis carregada —](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4416 | [Listar os fiscais elegíveis (FS e FC) para um tipo de contrato com cursos obrigatórios e o](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4417 | [Enviar uma Solicitação de Compras recém-criada e confirmar que a instância sai da primeira](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4418 | [Reprovar uma tarefa de delegação atuando como gestor e confirmar que o histórico registra ](<RH e Administrativos.md>) | RH e Administrativos | PAR |
| FSWTBC-4420 | [Abrir a Delegação de Fiscais e encontrar o campo da filial em que o fiscal mede como "Fili](<Contratos.md>) | Contratos | SIM |
| FSWTBC-4445 | [Encontrar uma SC desviada para "Correção" e ler, no Histórico e no Retorno Integração, o e](<Plataforma.md>) | Plataforma | PAR |
| FSWTBC-4447 | [Abrir uma medição no Fluig para um contrato de planilha SEMI FIXA e obter os itens da plan](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4453 | [Percorrer as telas do Portal do Comprador e do formulário da SC conferindo que nenhum text](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4454 | [Reprovar uma solicitação e conferir que os textos exibidos estão com a concordância corret](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4455 | [Alterar a data de validade de uma cotação e confirmar que datas retroativas não podem ser ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4456 | [Ver uma SC validada pelo comprador sair de "Aguarda Geração da Cotação" em minutos, com o ](<Consultas e Logs.md>) | Consultas e Logs | PAR |
| FSWTBC-4457 | [Conferir na grade de cotações que o status exibido corresponde à etapa real em que o proce](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4458 | [Acionar "Ver Itens" numa cotação e confirmar que a lista de itens é carregada na área infe](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4459 | [Criar uma SC e vê-la nascer com o "Nº da Solicitação ERP" gravado e visível ao comprador —](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4460 | [Levar uma SC aprovada na alçada até o fim e ver o pedido de compras gerado, com "Nº Pedido](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4461 | [Montar uma cotação no Portal do Comprador e ver a lista de fornecedores carregada a partir](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4462 | [Centralizar duas Solicitações de Compras na Validação Inicial e obter uma única SC central](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4466 | [Acionar "Ver Solicitação da Compra" a partir de uma cotação de SC centralizada e confirmar](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4468 | [Definir a proposta vencedora para apenas parte dos itens da cotação e concluir — com os it](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4472 | [Concluir uma SC de Nova Contratação e ver o contrato gerado pela rotina NFC — sem erro de ](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4503 | [Após um deploy, confirmar que o dataset de fiscais existe e responde, e que o Ato de Deleg](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4505 | [Acessar o Portal do Comprador com um comprador que não tenha substituição cadastrada e con](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4521 | [Comprador visualiza os anexos da cotação diretamente em *Avaliação de Propostas* → *Visual](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4526 | [Comprador devolve a cotação para a alçada (regerar documento) e a fila ZZY registra sucess](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4527 | [Gestora imediata abre a SC em *Validação do Gestor* e vê a sua linha de aprovação](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4537 | [Abrir a Gerência de Compras e confirmar que as SCs aguardando distribuição aparecem para a](<Gerencia de Compras.md>) | Gerencia de Compras | SIM |
| FSWTBC-4538 | [Comprador cancela uma SC pelo Portal do Comprador e o processo some da Central de Tarefas ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4540 | [Fiscal registra medição com planilha de rateio sem linha zerada e o pedido nasce com ratei](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4543 | [Conferir que o dicionário de dados da DEM10011184 (Despesa de Comercialização) publicado n](<Protheus/Dicionario e Pacote.md>) | Dicionario e Pacote | NÃO |
| FSWTBC-4550 | [Gestor libera a SC pelo campo *Aprovar?* da grade do gestor](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4551 | [Faturamento de contrato integra do início ao fim após uma liberação (regressão pós-MUD)](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4552 | [Medição gravada com sucesso no ERP avança na fila e não cai em *Correção*](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4557 | [Quantidade do item mantém-se coerente ao voltar da renegociação (proposta 003) para a nego](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4558 | [Transferir de LP para CP a parcela de um contrato com duas planilhas medidas em períodos d](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-4566 | [Escolha do fornecedor vencedor no Fluig chega ao Protheus com saldo e a SC avança para *Ag](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4579 | [Receber a nota fiscal de um fornecedor com documentação obrigatória cadastrada e ter a not](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4580 | [SC enviada sem rateio recebe do ERP um erro estruturado, sem derrubar a integração](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4581 | [Solicitante cancela a própria SC ainda na etapa *Início*](<Plataforma.md>) | Plataforma | PAR |
| FSWTBC-4590 | [Apropriar mensalmente uma parcela que ainda está em Longo Prazo e receber orientação clara](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-4594 | [Contrato gerado a partir de cotação migrada pelo NFC aparece no Acompanhamento de Contrato](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4607 | [Devolver uma proposta para ajuste e confirmar que a tarefa "Ajustes na Proposta" chega ao ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4609 | [Tentar encerrar um processo jurídico com liminar em vigor pelo campo "Andamento" e ser bar](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-4610 | [Tentar encerrar um processo jurídico com um usuário sem vínculo com o Jurídico e ser barra](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-4611 | [Vigorar um contrato com duas planilhas de tipos diferentes e conferir, no Protheus e no Fl](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4612 | [Tipo *999 - INTEGRACAO NFC* é preenchido automaticamente só quando o contrato nasce pela A](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4625 | [Cancelar, no Fluig, uma SC cuja cotação já foi cancelada no Protheus — e ver os dois lados](<Plataforma.md>) | Plataforma | PAR |
| FSWTBC-4626 | [Concluir uma medição de contrato cujo pedido foi gerado no Protheus e ver o processo termi](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4631 | [Abrir Parecer Técnico para uma SC centralizadora e ver um parecer gerado para cada demanda](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4632 | [Criar uma SC e ver a filial preenchida e propagada ao ERP, ao Tracker e ao Portal do Compr](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4633 | [Movimentar uma cotação que ficou marcada como "Em Integração" — o status volta a permitir ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4634 | [Iniciar uma Delegação de Fiscal de Contrato e ver, na lista de fiscais, apenas colaborador](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4635 | [Ajustar o valor de uma proposta com casas decimais em *Validação da Proposta* e ver o valo](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4636 | [Incluir um contrato diretamente no Protheus e um contrato via SC "Nova Contratação" do Flu](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-4639 | [Abrir uma SC e ver a integração com o ERP concluir sem "Campo C1_SIGLA obrigatório não env](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4647 | [Contabilizar um contrato plurianual e conferir que o valor anual lançado é a soma das 12 p](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-4648 | [Informar a quantidade 1.084.017 na medição do contrato e ver o mesmo número no total do fo](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4668 | [Como gestor do processo, cancelar uma SC em qualquer etapa — inclusive numa SC de versão a](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4669 | [Abrir uma SC que exige parecer técnico e ver o fluxo passar por *Emitir Parecer Técnico* s](<Parecer Tecnico.md>) | Parecer Tecnico | PAR |
| FSWTBC-4670 | [Gravar uma medição e ver a fila Fluig×Protheus processá-la em minutos — com o erro real gr](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4673 | [Aprovar uma SC e ver a cotação gerada no Protheus com o número refletido no Fluig — e, se ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4676 | [Assumir, como compradora, a tarefa de uma SC distribuída e confirmar que ela passa a const](<Gerencia de Compras.md>) | Gerencia de Compras | PAR |
| FSWTBC-4677 | [Tentar finalizar um processo de cotação que ainda tem processos filhos em aberto e conferi](<Portal do Comprador.md>) | Portal do Comprador | NÃO |
| FSWTBC-4709 | [Gerar a cotação de uma SC que tem o mesmo produto em quatro itens e conferir que a cotação](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4712 | [Cancelar uma SC própria depois de a cotação existir no ERP e conferir que Fluig, cotação e](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4728 | [Encerrar uma cotação com vencedor parcial (ganha alguns itens, perde outros) e conferir qu](<Protheus/Integracao e Filas.md>) | Integracao e Filas | NÃO |
| FSWTBC-4756 | [Enviar um lote de títulos a pagar pela API bondsPay com um documento inválido e conferir q](<Protheus/Integracao e Filas.md>) | Integracao e Filas | NÃO |
| FSWTBC-4759 | [Enviar uma medição que o ERP recusa (saldo insuficiente) e conferir que a recusa volta ao ](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4760 | [Gerar a cotação a partir da SC e conferir que o número devolvido ao Fluig corresponde a um](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4765 | [Após os fornecedores representarem no Portal, conferir que a negociação sai de "Aguarda Mo](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-4767 | [Abrir uma Solicitação de Compras e conferir que Solicitante e Email do Solicitante são os ](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4768 | [Na etapa de Recepção de Propostas, o comprador consegue ver o rateio da SC que está conduz](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4771 | [Consultar no Tracker os processos de cotação de uma SC e conferir que nenhum fornecedor ap](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4772 | [Abrir no Portal do Comprador uma cotação cuja justificativa (C8_XJUST) contém pontuação e ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4775 | [Submeter uma SC do tipo Contrato com rateio em três centros de custo (dois sem saldo) e co](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4786 | [Após aplicar a release com SSL, chamar a API UCFGA002 e confirmar que ela responde e que o](<Protheus/Dicionario e Pacote.md>) | Dicionario e Pacote | NÃO |
| FSWTBC-4790 | [Levar uma medição de Faturamento de Contratos à atividade de correção e conferir que ela c](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4791 | [Informar quantidade com seis casas decimais na medição de um contrato e conferir que o cam](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4792 | [Concluir uma medição e conferir que o "Nº da Medição" gravado no Fluig é o mesmo número ge](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4800 | [Filtrar fornecedores participantes para uma cotação e conferir que a lista não repete forn](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4804 | [Conferir, no dia do disparo automático, que foi aberta uma solicitação de faturamento para](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4815 | [Provocar gravações concorrentes no mesmo registro em duas sessões do Protheus e conferir q](<Protheus/Integracao e Filas.md>) | Integracao e Filas | NÃO |
| FSWTBC-4816 | [Consultar no widget Logs Protheus a fila de medições e conferir que nenhuma medição está c](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4819 | [Abrir a seleção de filiais da Solicitação de Compras e conferir que ela lista todas as fil](<Solicitacao de Compras.md>) | Solicitacao de Compras | SIM |
| FSWTBC-4820 | [Consultar um contrato no painel de Acompanhamento e conferir que os dados da planilha vinc](<Contratos.md>) | Contratos | SIM |
| FSWTBC-4821 | [Conferir que o campo Total Estimado a Aprovar (R$) da Validação do Item Orçamentário exibe](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4822 | [Abrir uma SC de Aditivo Contratual / Nova Contratação e conferir que os campos do contrato](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4826 | [Receber uma proposta com quantidade fracionada mínima para um item inteiro e conferir que ](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-4827 | [Confirmar que quem está no grupo administrativo enxerga todos os contratos da base, e quem](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4828 | [Verificar que uma SC enviada avança das atividades automáticas de espera sem intervenção m](<Consultas e Logs.md>) | Consultas e Logs | PAR |
| FSWTBC-4829 | [Verificar que uma medição de contrato sai de "Aguarda processamento Fila Protheus" dentro ](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4842 | [Encerrar uma medição e confirmar que o pedido de compra correspondente foi gerado antes de](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-4852 | [Quando a integração pós-alçada falha, a SC deve parar em Correção com o erro legível — nun](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4854 | [Aprovar a alçada de uma SC e confirmar que a integração pós-alçada conclui e dispara os e-](<Consultas e Logs.md>) | Consultas e Logs | PAR |
| FSWTBC-4864 | [Cancelar uma SC pelo Portal do Comprador e confirmar que ERP e Fluig ficam no mesmo estado](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4869 | [Aprovar uma revisão de contrato cujos campos de valor anterior estão zerados e conferir qu](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-4874 | [Na Aprovação de Alçada, a grade só deve abrir com as cotações vencedoras carregadas — sem ](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4898 | [Acionar os três ícones da coluna Ação do Acompanhamento de Contratos e conferir que cada u](<Contratos.md>) | Contratos | SIM |
| FSWTBC-4899 | [Conferir que o Status exibido no Acompanhamento de Contratos é o mesmo do Protheus para um](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4900 | [Confirmar que o fiscal vê no Portal de Acompanhamento exatamente os contratos em que ele é](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4918 | [Aprovar a alçada de uma Solicitação de Compras e conferir que a linha do aprovador vem car](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4920 | [Criar e aprovar uma revisão de contrato e conferir que os campos de valor anterior são gra](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-4930 | [Executar a contabilização de despesa antecipada para várias filiais, algumas sem parcelas,](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-4941 | [Informar rateio de centro de custo na SC e confirmar que ele chega íntegro ao Tracker e à ](<Consultas e Logs.md>) | Consultas e Logs | PAR |
| FSWTBC-4945 | [Abrir uma Solicitação de Compras de Nova Contratação a partir de um contrato e conferir qu](<Contratos.md>) | Contratos | PAR |
| FSWTBC-4952 | [Impedir na SC um item cujo valor total estimado fique abaixo de R$ 0,10 (evita o "401 Tabe](<Solicitacao de Compras.md>) | Solicitacao de Compras | SIM |
| FSWTBC-4964 | [Gerar o cronograma contábil de um contrato de 12 meses e confirmar que nenhuma parcela é c](<Protheus/Integracao e Filas.md>) | Integracao e Filas | NÃO |
| FSWTBC-4965 | [Cancelar a própria SC no Fluig a partir da Validação do Comprador ("Enviar para → Cancelar](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-4982 | [Abrir Informações Complementares do Contrato e conferir que todos os valores financeiros a](<Contratos.md>) | Contratos | SIM |
| FSWTBC-4983 | [Abrir Informações Complementares do Contrato e conferir que nome e CNPJ do fornecedor apar](<Contratos.md>) | Contratos | SIM |
| FSWTBC-4985 | [Abrir SC de Aditivo Contratual e confirmar que a alçada é calculada sobre Valor Vigente do](<Protheus/Integracao e Filas.md>) | Integracao e Filas | PAR |
| FSWTBC-4986 | [Filtrar a tela de Acompanhamento de Contratos pela busca geral e pelos filtros de coluna e](<Contratos.md>) | Contratos | SIM |
| FSWTBC-4987 | [Conferir que Fiscal de Contrato e Fiscal de Serviço aparecem, com nome e e-mail, nos DOIS ](<Contratos.md>) | Contratos | SIM |
| FSWTBC-4989 | [Percorrer uma Solicitação de Compras etapa a etapa como demandante e confirmar que o ratei](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-4998 | [SC cuja consulta de cotação no ERP não retorna dados chega a *Correção* com a causa real n](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | PAR |
| FSWTBC-5005 | [Tarefa *Verificar retorno Protheus* nasce com prazo de um dia útil e aparece como pendênci](<Solicitacao de Compras.md>) | Solicitacao de Compras | SIM |
| FSWTBC-5006 | [Após a alçada aprovada, a SC gera o pedido/contrato e só cai em *Verificar retorno Protheu](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-5007 | [Na escolha do vencedor, o comprador vê todos os itens cotados de uma SC com mais de 100 it](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-5011 | [Medição encerrada no Fluig gera pedido com número válido no ERP e não fica pendente por nú](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-5013 | [Consultar a API de Fluxo de Caixa em modo consulta e em modo envio e conferir que Código/D](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-5016 | [SC barrada por falta de saldo volta a gerar a alçada no Portal do Comprador depois que o s](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-5017 | [Cotação aprovada gera pedido mesmo sem saldo na conta orçamentária, e a SC segue até o fim](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-5028 | [Abrir uma solicitação vinculada a um contrato e confirmar que o valor vigente do contrato ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-5029 | [Aprovar orçamentariamente uma solicitação **direcionada ao pool (sem gestor)** e confirmar](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-5030 | [Abrir uma SC de Aditivo Contratual sobre um contrato com vários itens e confirmar que dá p](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-5031 | [Vincular um contrato a uma solicitação de compra no Portal do Comprador e confirmar que o ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-5033 | [Abrir um Aditivo Contratual sobre o contrato 00067-2023-5303 e confirmar que a tela abre, ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-5034 | [Fazer o Gestor Imediato reprovar uma SC e confirmar que o centro de custo informado contin](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-5035 | [Abrir uma SC na etapa de validação do gestor e confirmar que o nome da filial aparece junt](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-5036 | [Medição encerrada com desconto debita do saldo do contrato apenas o valor líquido e atuali](<Protheus/Integracao e Filas.md>) | Integracao e Filas | NÃO |
| FSWTBC-5057 | [Definir o vencedor de uma cotação no Portal do Comprador e confirmar as travas que a regra](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-5058 | [Disparar a notificação de resultado de cotação ao fornecedor e conferir se o e-mail chega ](<Solicitacao de Compras.md>) | Solicitacao de Compras | NÃO |
| FSWTBC-5059 | [Conferir que o e-mail do fluxo de compras sai no padrão de formatação, sem campo cru nem m](<Solicitacao de Compras.md>) | Solicitacao de Compras | NÃO |
| FSWTBC-5067 | [Após a cotação retornar por rejeição, o comprador volta a conseguir emitir/verificar o par](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-5081 | [Proposta vencedora reenviada pelo portal mantém o parecer técnico, e a geração da alçada n](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-5096 | [Proposta com quantidade zero é recusada no ato do envio pelo fornecedor, e a negociação nu](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-5106 | [Definir Vencedor impede confirmar proposta com valor zerado, e os pedidos gerados após a a](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-5117 | [Confirmar que a atividade de Ajuste de Negociação fica com o responsável gravado na própri](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-5118 | [A tarefa *Aprovação de Alçadas* é atribuída exatamente ao aprovador que o Protheus informo](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-5119 | [Medição processada pelo Fluig é gravada no Protheus como liberada, não como "Bloqueada" à ](<Protheus/Integracao e Filas.md>) | Integracao e Filas | NÃO |
| FSWTBC-5121 | [Finalizar um processo de compras com fornecedor vencedor e conferir que cada fornecedor re](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-5125 | [Incluir um contrato com planilha comum e conferir que a rotina abre, o contrato passa por ](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-5127 | [Abrir a etapa de Aprovação de Alçada e confirmar que todos os campos de valor aparecem em ](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-5128 | [Enviar um fechamento SEM_NF do SOC ao Protheus por HTTPS e confirmar que a resposta chega ](<Protheus/Integracao e Filas.md>) | Integracao e Filas | NÃO |
| FSWTBC-5132 | [Após um clone/refresh de base, confirmar que os artefatos da demanda em homologação contin](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-5141 | [Reprocessar a fila de geração de cotação após interrupção do serviço e ver a SC sair de *A](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-5143 | [Alterar o Tipo de Compra para Contrato no Portal do Comprador ao definir o vencedor e ver ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-5144 | [Conferir, para um colaborador em malha fina, que os rendimentos e retenções informados pel](<Protheus/RH - Folha.md>) | RH - Folha | NÃO |
| FSWTBC-5145 | [Informar um desconto num item da medição de contrato e ver o **Valor Total** recalculado e](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-5146 | [Recepcionar uma NF-e no processo RDFC - Compras cuja descrição traga caractere de controle](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-5148 | [Apropriar todas as competências de um contrato com rateio por centro de custo de percentua](<Protheus/Integracao e Filas.md>) | Integracao e Filas | NÃO |
| FSWTBC-5162 | [Realizar medição de um contrato cujo tipo de planilha foi alterado (*Alterar Tp. Planilha*](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-5163 | [Carregar uma medição com muitos itens e rateios e disparar o encaminhamento sem a tela ent](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-5164 | [Abrir a etapa de Parecer Técnico e visualizar as propostas dos fornecedores — sem "acontec](<Parecer Tecnico.md>) | Parecer Tecnico | PAR |
| FSWTBC-5165 | [Excluir fechamentos de prestador em sequência, com outro usuário consultando a mesma tela,](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-5169 | [Aprovar uma SC pelo comprador e ver a cotação gerada no Protheus em um ciclo da fila — e, ](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-5173 | [Finalizar uma SC de **Aditivo Contratual** (renovação) e ver o Protheus abrir uma **revisã](<Contratos.md>) | Contratos | PAR |
| FSWTBC-5174 | [Abrir uma SC em *Aprovação de Alçadas* como gestor da alçada e ver a grade de aprovação ca](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-5185 | [Encerrar uma medição com muitos itens e rateios e ver *Gravar/Encerrar Medição* concluir e](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-5186 | [Ter uma medição recusada pelo Protheus (bloqueio PCO, mensagem de várias linhas) e ver o m](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-5193 | [Cadastrar o mnemônico, as fórmulas e o roteiro de cálculo do convênio ABRE Estágio (R$ 20,](<Protheus/RH - Folha.md>) | RH - Folha | NÃO |
| FSWTBC-5195 | [Chamar a API de Fluxo de Caixa para a empresa 01 sem filtro de filial e conferir que os tí](<Protheus/Financeiro e Contabil.md>) | Financeiro e Contabil | NÃO |
| FSWTBC-5196 | [Gerar aditivo de contrato a partir de cotação aprovada e ver os valores entrarem conforme ](<Protheus/Contratos - GCT.md>) | Contratos - GCT | NÃO |
| FSWTBC-5197 | [Aprovar uma SC com cotação encerrada e ver o pedido de compras gerado no ERP e refletido n](<Consultas e Logs.md>) | Consultas e Logs | PAR |
| FSWTBC-5198 | [Preencher um item de Solicitação de Compras de Aditivo Contratual com quantidade zerada e ](<Contratos.md>) | Contratos | SIM |
| FSWTBC-5199 | [Enviar uma SC com item sem rateio e com preço no padrão americano e obter a cotação gerada](<Portal do Comprador.md>) | Portal do Comprador | PAR |
| FSWTBC-5233 | [Abrir uma solicitação a partir de um contrato e escolher entre *Aditivo Contratual* e *Nov](<Portal do Comprador.md>) | Portal do Comprador | SIM |
| FSWTBC-5234 | [Cancelar uma Solicitação de Compras parada em Aprovação de Alçadas, informando a justifica](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
| FSWTBC-5240 | [Encerrar uma medição de contrato cuja revisão foi alterada no Protheus depois da abertura ](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-5242 | [Selecionar a planilha de medição de um contrato corretamente configurado no Protheus e car](<Faturamento de Contratos.md>) | Faturamento de Contratos | PAR |
| FSWTBC-5251 | [No dia seguinte ao fechamento do mês, conferir no Fluig que cada contrato vigente de perio](<Protheus/Integracao e Filas.md>) | Integracao e Filas | PAR |
| FSWTBC-5257 | [Cadastrar e autenticar um fornecedor com CNPJ alfanumérico no Portal do Fornecedor](<Portal do Fornecedor.md>) | Portal do Fornecedor | PAR |
| FSWTBC-5262 | [Anexar documentação (pública, restrita e por item) a uma Solicitação de Compras.](<Solicitacao de Compras.md>) | Solicitacao de Compras | PAR |
