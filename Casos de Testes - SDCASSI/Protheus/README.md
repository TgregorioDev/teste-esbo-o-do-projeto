# Casos de Teste — Protheus

Casos cujo efeito **não é observável em nenhuma tela do Fluig**. Foram escritos por
completo mesmo assim — com rotina, tela ou relatório do ERP onde o efeito aparece —
para que o time não precise refazer a análise quando o projeto de testes cobrir o
Protheus.

| Módulo | Casos |
|---|---:|
| [Financeiro e Contabil](<Financeiro e Contabil.md>) | 41 |
| [Contratos - GCT](<Contratos - GCT.md>) | 32 |
| [Integracao e Filas](<Integracao e Filas.md>) | 23 |
| [RH - Folha](<RH - Folha.md>) | 15 |
| [Dicionario e Pacote](<Dicionario e Pacote.md>) | 8 |
| [Compras](<Compras.md>) | 6 |

| Defeito | Caso | Módulo |
|---|---|---|
| FSWTBC-633 | [Gerar a fatura a pagar de um documento de prestador cujo percentual por título cabe no cam](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-654 | [Alterar o step salarial de um funcionário pela rotina automática preservando o adicional d](<RH - Folha.md>) | RH - Folha |
| FSWTBC-656 | [Registrar ponto pelo app SouCassi e obter marcação automática, com e-mail resolvido sem di](<RH - Folha.md>) | RH - Folha |
| FSWTBC-657 | [Calcular a folha de um colaborador com abono no mês e mudança de step/promoção descontando](<RH - Folha.md>) | RH - Folha |
| FSWTBC-659 | [Enviar o payload de cadastro de corretora e apuração de corretagens à API e conferir que c](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-687 | [Executar a rotina de integração "Pulse" para um registro cujo CEP muda e conferir que a al](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-693 | [Recusar com mensagem de negócio um documento de prestador cujos títulos têm valor inconsis](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-1151 | [Calcular o desconto do plano Realize Mais na folha sobre a base correta de verbas](<RH - Folha.md>) | RH - Folha |
| FSWTBC-1207 | [Conferir que todas as verbas previstas na MIT010 estão marcadas para compor a base de desc](<RH - Folha.md>) | RH - Folha |
| FSWTBC-1241 | [Editar o valor total (`CNA_VLTOT`) de uma planilha de contrato no GCT sem erro ao abrir o ](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-1279 | [Gerar e manter um pedido de compras no Protheus 12.1.2410 a partir de uma SC integrada, se](<Compras.md>) | Compras |
| FSWTBC-1280 | [Aplicar realinhamento de preços num contrato vigente e conferir a contabilização das difer](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-1324 | [Aplicar o reajuste periódico de um contrato vigente pelo índice cadastrado e obter nova re](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-1343 | [Configurar índice e periodicidade de reajuste num contrato e confirmar que o GCT calcula a](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-1357 | [Executar o job de processamento de beneficiários e obter numeração de lote única, com o sc](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-1462 | [Emitir o relatório de valores contábeis realizados (despesa de comercialização) e conferir](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-1495 | [Incluir grupos de produtos para um fornecedor cuja loja não é a primeira e confirmar que o](<Compras.md>) | Compras |
| FSWTBC-1501 | [Excluir um cronograma financeiro de planilha de contrato sem travamento e com o saldo a me](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-1502 | [Editar o valor total (`CNA_VLTOT`) da planilha numa revisão aberta de contrato, com o patc](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-1511 | [Excluir o fechamento de uma SOC baixada por arquivo de retorno bancário e conferir que cad](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-1604 | [Classificar um documento de entrada com frete e conferir que o valor do frete e o custo do](<Compras.md>) | Compras |
| FSWTBC-1615 | [Gerar o cronograma financeiro de um contrato e medi-lo sem produzir chave duplicada na CNF](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-1703 | [Emitir o relatório de Conciliação de Contratos (UGCTR001) e obter linhas para um período c](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-1767 | [Gravar, na base PRIME, um registro com caracteres especiais (ç, ã, é, &, ') pela mesma rot](<Dicionario e Pacote.md>) | Dicionario e Pacote |
| FSWTBC-1796 | [Abrir Despesas de Comercialização (UCOME031) e executar a consulta sem errorlog de coluna ](<Dicionario e Pacote.md>) | Dicionario e Pacote |
| FSWTBC-1805 | [Gerar o relatório de Valores Contábeis Realizados da Despesa de Comercialização para um pe](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-1813 | [Recusar uma SC na Aprovação de Alçadas e acompanhar o retorno ao comprador, a regeração da](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-1819 | [Contabilizar a medição de um contrato com Contabiliza=Sim e Aglutina=Sim e obter um único ](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-1820 | [Exercitar a rotina de análise de cotação do UCOME024 até a linha que limpa o filtro e conf](<Compras.md>) | Compras |
| FSWTBC-1952 | [Depurar o REST customizado da cotação (liberação/processamento de quote) com pontos de par](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-1962 | [Ajustar o fiscal de uma planilha em contrato multifilial e obter a mesma designação na pla](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-1998 | [Incluir o fiscal de serviço em uma planilha de contrato e obter o fiscal gravado e visível](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-2025 | [Trocar o tipo de planilha de um contrato para "SEMI FIXA" e continuar medindo sem erro](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-2083 | [Alterar o tipo de pagamento de um pedido de compra sem disparar erro de fórmula na regra d](<Compras.md>) | Compras |
| FSWTBC-2108 | [Aprovar um contrato no GCT (de "em aprovação" para "vigente") sem crítica no campo CN9_TPC](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-2230 | [Contabilizar um aditivo de contrato e obter parcelas separadas em curto e longo prazo](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-2233 | [Cancelar a contabilização de um extrato efetivado no Conciliador BackOffice e obter o esto](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-2235 | [Executar a transferência e contabilização LP→CP (UGCTE002) para um contrato e obter lançam](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-2313 | [Revisar um contrato por aditivo de quantidade e prazo e conferir que o cronograma contábil](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-2330 | [Conferir o valor da amortização de um contrato com realinhamento pelo cronograma financeir](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-2331 | [Alterar um contrato, fechar a tela de contabilização sem confirmar e conferir que a movime](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-2332 | [Executar a Apropriação de Despesa Antecipada para um contrato sem parcelas a apropriar e c](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-2333 | [Realinhar o preço de um contrato de longa duração e conferir a separação do valor contabil](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-2431 | [Disparar a integração de plano de saúde Protheus → SOC pelo botão e pelo schedule ao mesmo](<RH - Folha.md>) | RH - Folha |
| FSWTBC-2531 | [Registrar uma batida pelo app SouCASSI e conferir que ela aparece em "Batidas do dia" do M](<RH - Folha.md>) | RH - Folha |
| FSWTBC-2574 | [Calcular o pró-rata de um colaborador com mudança de step no mês e um abono de luto e conf](<RH - Folha.md>) | RH - Folha |
| FSWTBC-2598 | [Enviar do SOC ao Protheus um documento com filial inexistente e conferir que o retorno ide](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-2709 | [Emitir o relatório de corretagem calculada por período de apuração (DOC044) e conferir que](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-2743 | [Marcar uma planilha de contrato como "zerar saldos" (CPC 06) e conferir que só ela é zerad](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-2766 | [Sincronização de medição automática roda duas vezes no mesmo dia e o sistema não abre medi](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-2805 | [Enviar o fechamento SOC → Protheus depois de um processamento interrompido e conferir que ](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-2890 | [Alterar a situação de um contrato para "Vigente" com a alçada de contratos habilitada e co](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-2951 | [Incluir uma revisão do tipo "Reajuste" com data retroativa em contrato com planilha de vár](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-3014 | [Abrir "Outras Ações" na rotina de contratos e conferir que a opção "Est. Refazer Prov. Con](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-3060 | [Realinhar o preço de uma parcela de contrato e conferir que o lançamento contábil do reali](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-3100 | [Executar o relatório/rotina contábil ajustada na homologação da DEM10014371 (fontes ERESP2](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-3138 | [Excluir um fechamento NDF pela API de Contas a Pagar (bondsPay, método DELETE) e conferir ](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-3139 | [Gerar o cronograma contábil de um contrato novo de 36 meses e conferir que a provisão cont](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-3151 | [Registrar o retorno de um colaborador de férias que já tem outra ausência futura cadastrad](<RH - Folha.md>) | RH - Folha |
| FSWTBC-3216 | [Executar a chamada REST de corretagens (DEM10011184) em homologação e conferir que respond](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-3264 | [Incluir uma nova revisão em contrato com provisão de curto/longo prazo já contabilizada e ](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-3265 | [Integrar documentos de pagamento de prestador contendo um documento inválido e conferir qu](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-3355 | [Alterar o status de um contrato com campos customizados de provisão (voltar para "Em elabo](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-3358 | [Estornar a última revisão de um contrato e recuperar a revisão anterior sem erro de execuç](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-3418 | [Apurar corretagens de um período e ver a corretagem apurada listada com a data de apuração](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-3442 | [Visualizar um contrato existente no Protheus (e sua ficha no Fluig) sem erro de dicionário](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-3490 | [Aprovar um contrato de Despesa Antecipada e encontrar a contabilização (provisão) gerada j](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-3491 | [Realinhar preços de um contrato marcando a parcela como não apropriada e ver a contabiliza](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-3600 | [Confirmar que a base DES está compatibilizada para a DEM10011184 (Corretagens): dicionário](<Dicionario e Pacote.md>) | Dicionario e Pacote |
| FSWTBC-3601 | [Na base DES replicada, encerrar a situação de um contrato com planilhas de tipos diferente](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-3602 | [Na base DES replicada, cadastrar um colaborador e um dependente usando as novas composiçõe](<RH - Folha.md>) | RH - Folha |
| FSWTBC-3603 | [Como fornecedor, enviar o BOOK trabalhista pelo Portal do Fornecedor ("Envio de Documentos](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-3624 | [Lançar documento de entrada de serviço de saúde de um fornecedor que recolhe ISS e confirm](<Compras.md>) | Compras |
| FSWTBC-3654 | [Após uma virada de release do Protheus, conferir que os campos customizados de multa e bon](<Dicionario e Pacote.md>) | Dicionario e Pacote |
| FSWTBC-3669 | [Receber o repasse da DEM10013021 e executar, no Protheus de homologação, o roteiro de cada](<RH - Folha.md>) | RH - Folha |
| FSWTBC-3696 | [Revisar um contrato com parcelas classificadas em curto e longo prazo e conferir que a pro](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-3757 | [Validar, antes de subir para produção, que a tabela de fila de medições ZZZ existe e respo](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-3768 | [Aprovar um contrato novo com controle orçamentário e conferir que o PCO recebe o lançament](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-3787 | [Na revisão de um contrato contabilizado, abrir "Outras ações" e conferir que a opção "Esto](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-3788 | [Aprovar pela alçada um contrato com "Contabiliza = Sim" e conferir que a aprovação conclui](<Dicionario e Pacote.md>) | Dicionario e Pacote |
| FSWTBC-3792 | [Cadastrar um tipo de contrato apenas com cronograma contábil (sem cronograma financeiro) e](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-3815 | [Encerrar a medição mensal de um contrato contabilizado e conferir que o lançamento contábi](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-3863 | [Alterar um contrato para Vigente com a alçada de contratos ligada e conferir que a AKD rec](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-3869 | [Alterar um contrato vigente para "Em elaboração" e conferir que o cronograma contábil (CNW](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-3876 | [Incluir um documento de entrada para um fornecedor após a aplicação do pacote DEM10014951 ](<Dicionario e Pacote.md>) | Dicionario e Pacote |
| FSWTBC-3902 | [Apurar o ponto de um funcionário com falta autorizada de meio período, atraso autorizado e](<RH - Folha.md>) | RH - Folha |
| FSWTBC-3910 | [Confirmar que a rotina "Gera Documento" executou na janela agendada e que os processos que](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-3935 | [Alterar um pedido de compras emitido no exercício anterior, já no exercício novo, e confer](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-4052 | [Cadastrar uma corretora pela API de Corretoras, apurar a corretagem e gerar o pedido de co](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-4065 | [Confirmar que as medições automáticas do mês nascem para todos os contratos configurados, ](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-4115 | [Contabilizar o reajuste de um contrato com juros e localizar o lançamento dos juros na con](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-4157 | [Medir um contrato novo e conferir que o valor da medição coincide com o previsto no Cronog](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-4297 | [Consultar os alertas de Período Fatal de Férias (tabela ZZH) pela rotina de visualização e](<RH - Folha.md>) | RH - Folha |
| FSWTBC-4306 | [Executar a Transferência LP→CP para todas as filiais com "não ver lançamento" e receber um](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-4307 | [Transferir para Curto Prazo a parcela de um contrato com várias planilhas e obter o valor ](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-4315 | [Executar a Apropriação de Despesa Antecipada em dois meses consecutivos e obter, em cada m](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-4543 | [Conferir que o dicionário de dados da DEM10011184 (Despesa de Comercialização) publicado n](<Dicionario e Pacote.md>) | Dicionario e Pacote |
| FSWTBC-4558 | [Transferir de LP para CP a parcela de um contrato com duas planilhas medidas em períodos d](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-4590 | [Apropriar mensalmente uma parcela que ainda está em Longo Prazo e receber orientação clara](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-4609 | [Tentar encerrar um processo jurídico com liminar em vigor pelo campo "Andamento" e ser bar](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-4610 | [Tentar encerrar um processo jurídico com um usuário sem vínculo com o Jurídico e ser barra](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-4636 | [Incluir um contrato diretamente no Protheus e um contrato via SC "Nova Contratação" do Flu](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-4647 | [Contabilizar um contrato plurianual e conferir que o valor anual lançado é a soma das 12 p](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-4728 | [Encerrar uma cotação com vencedor parcial (ganha alguns itens, perde outros) e conferir qu](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-4756 | [Enviar um lote de títulos a pagar pela API bondsPay com um documento inválido e conferir q](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-4786 | [Após aplicar a release com SSL, chamar a API UCFGA002 e confirmar que ela responde e que o](<Dicionario e Pacote.md>) | Dicionario e Pacote |
| FSWTBC-4815 | [Provocar gravações concorrentes no mesmo registro em duas sessões do Protheus e conferir q](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-4869 | [Aprovar uma revisão de contrato cujos campos de valor anterior estão zerados e conferir qu](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-4920 | [Criar e aprovar uma revisão de contrato e conferir que os campos de valor anterior são gra](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-4930 | [Executar a contabilização de despesa antecipada para várias filiais, algumas sem parcelas,](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-4964 | [Gerar o cronograma contábil de um contrato de 12 meses e confirmar que nenhuma parcela é c](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-4985 | [Abrir SC de Aditivo Contratual e confirmar que a alçada é calculada sobre Valor Vigente do](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-4998 | [SC cuja consulta de cotação no ERP não retorna dados chega a *Correção* com a causa real n](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-5013 | [Consultar a API de Fluxo de Caixa em modo consulta e em modo envio e conferir que Código/D](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-5036 | [Medição encerrada com desconto debita do saldo do contrato apenas o valor líquido e atuali](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-5119 | [Medição processada pelo Fluig é gravada no Protheus como liberada, não como "Bloqueada" à ](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-5125 | [Incluir um contrato com planilha comum e conferir que a rotina abre, o contrato passa por ](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-5128 | [Enviar um fechamento SEM_NF do SOC ao Protheus por HTTPS e confirmar que a resposta chega ](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-5144 | [Conferir, para um colaborador em malha fina, que os rendimentos e retenções informados pel](<RH - Folha.md>) | RH - Folha |
| FSWTBC-5148 | [Apropriar todas as competências de um contrato com rateio por centro de custo de percentua](<Integracao e Filas.md>) | Integracao e Filas |
| FSWTBC-5165 | [Excluir fechamentos de prestador em sequência, com outro usuário consultando a mesma tela,](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-5193 | [Cadastrar o mnemônico, as fórmulas e o roteiro de cálculo do convênio ABRE Estágio (R$ 20,](<RH - Folha.md>) | RH - Folha |
| FSWTBC-5195 | [Chamar a API de Fluxo de Caixa para a empresa 01 sem filtro de filial e conferir que os tí](<Financeiro e Contabil.md>) | Financeiro e Contabil |
| FSWTBC-5196 | [Gerar aditivo de contrato a partir de cotação aprovada e ver os valores entrarem conforme ](<Contratos - GCT.md>) | Contratos - GCT |
| FSWTBC-5251 | [No dia seguinte ao fechamento do mês, conferir no Fluig que cada contrato vigente de perio](<Integracao e Filas.md>) | Integracao e Filas |
