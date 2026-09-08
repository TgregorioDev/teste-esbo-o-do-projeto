# Consolidação — SDCASSI + SUPORTE CASSI

Leitura transversal dos **1.537 tickets** analisados um a um em `analise/analises.jsonl`.
Janela: **dez/2024 a 03/09/2026**. Data de corte: 04/09/2026.

Todo número aqui vem dos dados do Jira ou dos 1.537 registros de análise — nenhum é estimado.

---

## 1. O que foi analisado

| | |
|---|---|
| Tickets | 1.537 (universo SDCASSI + SUPORTE CASSI, deduplicado) |
| Registros de análise | 1.537 (1 por ticket, 1,7 MB, JSON válido, 0 falta / 0 duplicata) |
| Comentários lidos | 6.593 |
| Anexos catalogados | 2.861 |
| Anexos baixados | 2.770 + 84 grandes (logs, traces, .rar/.zip, .docx) |

Cada registro traz: relato original, causa raiz apurada, evidência disponível, leitura do
fluxo (transições, ciclos de homologação, PR/MUD), pendências em aberto e módulo/fontes tocados.

---

## 2. Retrato quantitativo

### Situação

| Situação | Qtd | % |
|---|---:|---:|
| Concluído | 1.374 | 89,4% |
| **Abertos** | **155** | **10,1%** |
| Cancelado / Não contratado / Produção | 8 | 0,5% |

Dos 155 abertos: **67 nunca foram iniciados** (AGUARDANDO INICIO), 37 em homologação,
25 em desenvolvimento, 16 pausados pelo cliente.

### Natureza do trabalho

**718 dos 1.537 são defeito** (645 Bug + 73 Defeito) — **47% da conta é corretiva.**
O restante se divide entre Subtarefa (241), Tarefa (192), Desenvolvimento (64), Epic (52),
Documentação (45), Teste QA (45), Garantia (46), Entrega (35).

### Como os tickets terminam

| Resolução | Qtd |
|---|---:|
| Feito | 1.259 |
| *(aberto, sem resolução)* | 184 |
| Não será feito / Não vai ser feito | 52 |
| Duplicado | 18 |
| Não Contratado | 14 |
| Não é possível reproduzir | 8 |

### Tempo até a resolução (1.353 tickets com data)

Mediana **8 dias** · média 32 · p90 **95 dias** · máximo 585.

| Faixa | Qtd | % |
|---|---:|---:|
| mesmo dia | 237 | 17% |
| 1–7 dias | 401 | 29% |
| 8–30 dias | 380 | 28% |
| 31–90 dias | 193 | 14% |
| 91–180 dias | 73 | 5% |
| **> 180 dias** | **69** | **5%** |

A distribuição é boa na cauda curta e ruim na cauda longa: quase metade resolve em uma semana,
mas 142 tickets levaram mais de três meses.

### Volume por mês de abertura

Média de ~70/mês, com pico em **abril/2026 (135)**. Não há tendência de queda: ago/2026 fechou
com 74 aberturas, praticamente o mesmo patamar de dez/2024 (65).

### Rastro documental

- **683 tickets (44%) não têm um único comentário.**
- **871 tickets (57%) não têm nenhum anexo.**

Isso não é uniforme: os chamados de suporte com causa raiz apurada são bem documentados
(alguns com pareceres técnicos completos); o vazio se concentra nas **subtarefas de análise**,
que repetidamente são abertas com escopo correto e encerradas sem registro do que se descobriu.

---

## 3. As famílias de defeito que se repetem

Contagem = registros de análise em que o tema aparece.

| # | Família | Ocorrências |
|---|---|---:|
| 1 | Divergência de ambiente / RPO / pacote sobrescrito | 294 |
| 2 | Cotação e escolha de vencedor | 273 |
| 3 | Medição de contrato | 231 |
| 4 | Aditivo / renovação / revisão de contrato | 133 |
| 5 | Fila de integração e schedule travado | 128 |
| 6 | Alçada de aprovação | 123 |
| 7 | Contabilização / apropriação / provisão | 89 |
| 8 | Precisão numérica e valor zerado | 79 |
| 9 | Falha silenciosa (retorna sucesso, não sinaliza) | 78 |
| 10 | Rateio / centro de custo | 75 |
| 11 | Performance / timeout / loop | 74 |
| 12 | Parecer técnico | 55 |
| 13 | Cancelamento de SC/processo | 45 |

### 3.1 Divergência entre repositório, pacote e RPO — a maior fonte isolada

Não é uma classe de bug: é uma falha de gestão de configuração que **fabrica** bugs.
Casos provados nesta base:

- **`CN121ESD` e `UGCTE024` removidos do git continuaram compilados no RPO** e, enquanto
  existiram, *o produto padrão deixou de atualizar saldos no encerramento de medição* —
  com ou sem desconto (SDCASSI-521). "A remoção do fonte não elimina o objeto já compilado."
- **`UCOME024` com data 24/07 na TST e 10/06 na PRD** — o hotfix nunca chegou a um dos RPOs
  (SDCASSI-508).
- **Pacote gerado e nunca aplicado** no ambiente onde o cliente homologava (SDCASSI-521).
- **Pacote do SDCASSI-536 construído sobre versão anterior à correção do SDCASSI-522**,
  desfazendo-a conforme a ordem de aplicação (SDCASSI-539). Resolvido com pacote único.
- **Cluster 483/490/491/498** consolidado em 31/08 exatamente por isso: quatro hotfixes no mesmo
  programa, "para que uma não sobreponha a outra e o ambiente não fique com versões desencontradas".
- **Clone da base apaga a demanda em homologação** e a reaplicação depende de alguém notar
  (SDCASSI-533); refresh de base invalida o card de teste (SDCASSI-517).
- **Fix de RecLock que nunca voltou à branch da demanda**, com o `.ptm` em circulação gerado
  antes dele (FSWTBC-5000) — detectado só por auditoria.

### 3.2 Falha silenciosa — o padrão que mais custa caro

O defeito não é o erro; é o sistema **seguir em frente como se tivesse dado certo**:

- Aditivo não gerado **e mesmo assim retorno de "sucesso" ao Fluig** (SDCASSI-548).
- `_lAditivo` assume falso porque a chave `additive` não veio no JSON → **alçada gerada
  subestimada, em silêncio** (SDCASSI-502).
- Loop no `PE_CN100SIT` matava a execução antes do bloco de alçada → **contratos entraram em
  vigor sem SCR, sem aprovação** (SDCASSI-530).
- Conversão decimal aplicada indistintamente: **`10.50` transmitido como `1050`** ao Protheus
  (SDCASSI-556).
- Campo vazio enviado como a **string literal `"null"`** e gravado no cadastro do ERP (SDCASSI-556).
- Numeração de proposta dessincronizada → **valores do fornecedor deixavam de ser aplicados,
  sem aviso** (SDCASSI-524).
- Medição mensal que não dispara e **não reagenda a competência** (SDCASSI-562).
- Marcação `E2_XDHFLX` gravada em chamadas de *consulta*: uma consulta **"consumia" títulos**,
  que sumiam das remessas seguintes (SDCASSI-172).

A contramedida certa está escrita por um dos próprios analistas, no SDCASSI-502:

> "Incluir validação de obrigatoriedade — quando a cotação for de aditivo e faltar o contrato de
> origem, **retornar erro em vez de gerar alçada subestimada em silêncio**. É o único item que
> depende só de nós e é o que impede o problema de se repetir sem ninguém perceber."

### 3.3 A máquina de estados `C8_X*` — 7 defeitos no mesmo mecanismo

`C8_XALCADA`, `C8_XVENC`, `C8_XAUDIT`, `C8_XLIBERA`, `C8_XPARTEC` concentram a maior densidade
de defeitos da base. Correções sucessivas em: retorno para alçada (SDCASSI-366), notificação a
fornecedor (SDCASSI-448), campos não carregados (SDCASSI-484), regressão por remoção de
`fAprovado()/fMesmoVencedor` (SDCASSI-508), parecer técnico bloqueado (SDCASSI-522), parecer
perdido no reenvio (SDCASSI-523), e-mails contraditórios (SDCASSI-529).

Ponto relevante: no SDCASSI-448 **desistiu-se de confiar nesses campos** — o vencedor passou a
ser inferido por `C8_NUMPED`/`C8_NUMCON` não iniciados por `"XX"`. Ou seja, o defeito de origem
(os campos não são marcados) **foi contornado, não corrigido**, e qualquer outra rotina que
dependa deles segue exposta.

### 3.4 Precisão numérica na fronteira Fluig ↔ Protheus

Fluig trabalha com 6 casas, Protheus com 2. Isso, sozinho, produziu:

- preço `0,000001` → `C1_XVALOR = 0` → SC recusada (SDCASSI-496);
- proposta aceita com `C8_QUANT = 0` **bloqueando o fornecedor por 3 meses** (SDCASSI-524);
- aditivo prosseguindo com quantidade zerada (SDCASSI-555);
- resíduo de arredondamento no rateio acumulando mês a mês até a soma das parcelas apropriadas
  **superar o valor do contrato** (SDCASSI-541);
- valor multiplicado por 100 pela conversão de separador (SDCASSI-556).

O contorno adotado foi um piso arbitrário (R$ 1,00 → R$ 0,10). Ele reduz a chance, não elimina:
para quantidades fracionadas o produto ainda arredonda para zero.

### 3.5 Fila de integração: falha em um item para a fila inteira

Dois mecanismos concretos, ambos documentados:

- **Erro não tratado → reprocessamento infinito.** O schedule morria antes de atualizar o status;
  o registro ficava pendente e voltava a cada 5 min, indefinidamente, **sem nada no log**
  (SDCASSI-546). Corrigido com proteção que libera o semáforo e segue para o próximo item.
- **Falta de idempotência.** Cotação já criada no ERP → reprocessamento recusado → tarefa parada
  em "Aguarda Geração da Cotação" mesmo havendo cotação (SDCASSI-536).

Efeito medido: **quatro filiais presas no mesmo registro, uma delas há mais de 22 horas**;
represamento de 16h entre entrada e processamento (SDCASSI-508); e o caso extremo —
**thread viva por ~114 horas** em laço ocupado dentro de `GetNumSC7` (SDCASSI-554).

Achado lateral no mesmo log e nunca tratado: **a rotina de aviso de férias da Gestão de Pessoal
está derrubando thread do schedule de produção** (SDCASSI-536). Prometeu-se chamado específico;
ele não existe nesta base.

---

## 4. Passivos de dado — o que patch nenhum desfaz

**81 registros** têm pendência de acerto de dado ou levantamento retroativo; **19 ainda em
tickets abertos**. Os materiais:

| Passivo | Origem | Situação |
|---|---|---|
| **Contratos vigentes sem passar pela alçada** (SCR nunca gerado) | SDCASSI-530 — loop no `PE_CN100SIT` | Declarado: "precisam ser **retornados ao fluxo de aprovação**". Não executado. |
| **Contratos contabilizados a maior** entre 29/04 e a correção do `PE_CNTA300` | SDCASSI-490 | Fora do escopo do chamado. Exige apuração em produção + decisão contábil. Chamado novo nunca aberto. |
| **Medições encerradas sem baixa de saldo** enquanto `CN121ESD`/`UGCTE024` estavam no RPO | SDCASSI-521 | Relação levantada pela TOTVS e **oferecida ao cliente**; acerto não autorizado. |
| **SCs com valor multiplicado por 100** e cadastros gravados com `"null"` | SDCASSI-556 | Nenhum levantamento feito. |
| **Parcela classificada Curto Prazo sem lançamento correspondente** | SDCASSI-498 | "Acerto de dado, não é feito pelo pacote." |
| **Medições de agosto/2026 que não dispararam em 31/08** | SDCASSI-562 | Correção trata o agendamento futuro; a competência perdida exige disparo manual. Nenhum levantamento de quantos contratos. |
| **Lançamentos contábeis duplicados** por 3 meses na apropriação de despesa antecipada | SDCASSI-348 | Sem registro de estorno. |
| **Fornecedores com `A2_XPREST`/`A2_XHPREST` = 999999** cadastrados pelo Fluig antes da correção | SDCASSI-141 | Continuarão sem dados bancários na implantação de NF. Sem correção retroativa. |
| **SCs centralizadas sem `C1_CODCOMP`** (invisíveis ao comprador) | SDCASSI-342 | Sem script de saneamento. |
| **Documentos com retenção de ISS incorreta** (12–23/12/2025) | SDCASSI-… (ISS saúde) | Sem tratamento fiscal retroativo. |
| **Pedidos que passaram pela trava orçamentária desligada por ~1 mês** | SDCASSI-107 | Sem levantamento. |
| **557 de 558 naturezas financeiras sem Código do Fluxo** | DEM10009555 | Trabalho do cliente; sem ele a integração de Fluxo de Caixa segue incompleta. |

Além desses, três pedidos explícitos do cliente por **varredura do legado** para achar outros
registros afetados (SDCASSI-305, SDCASSI-310, SDCASSI-490) **nunca foram atendidos**.

---

## 5. Itens de risco externo parados — exigem decisão, não análise

Ordenados por consequência fora da TI.

1. **SDCASSI-537 — DIRF com valores divergentes da Receita.** Colaboradores **já em malha fina**.
   Aberto 14/08/2026. `AGUARDANDO INICIO`, 21 dias, **zero comentários, zero anexos, nenhuma
   transição**. Prioridade cadastrada: "Mais baixo".
2. **SDCASSI-563 — Portal do Fornecedor recusa CNPJ alfanumérico**, que o Protheus já aceita.
   É norma da Receita, não melhoria. **Sem responsável.** Data de entrega esperada (04/09) vencida.
   Enquanto durar, fornecedor com CNPJ novo **não consegue se cadastrar nem cotar**.
3. **SDCASSI-551 — convênio ABRE Estágio.** Contrato **já assinado** pela CASSI; falta mnemônico,
   fórmulas e roteiro de cálculo na folha. Sem responsável, nunca iniciado.
4. **SDCASSI-511 — agenda FGTS / eConsignado / Contabilização / Alelo.** Pedido do cliente,
   38 dias, nunca respondido no ticket.
5. **FSWTBC-4278 (DEM10016177) e FSWTBC-4446 (DEM10013714)** — demandas com **MIT044 assinada**,
   uma delas **originada de recomendação de auditoria interna**, congeladas pela decisão de
   30/06 ("demandas novas pausadas até a fila de suporte ser finalizada"). A pergunta
   "permanecemos com essa recomendação ou iniciamos?" ficou **sem resposta**.
6. **SDCASSI-124** — revisões de reajuste com data retroativa impossibilitadas desde out/2025,
   aguardando a TOTVS Matriz. Última interação da Fábrica: *"Podemos encerrar o ticket?"* (01/06/2026),
   sem resposta.

**Padrão:** os quatro primeiros são de **RH/Folha**. A frente de Gestão de Pessoal desta conta
está efetivamente descoberta enquanto Compras e Contratos consomem todo o esforço.

---

## 6. O ciclo formal de entrega não fecha

Este é o achado estrutural mais consequente da leitura transversal.

| Tipo de ticket | Total | Abertos | % aberto |
|---|---:|---:|---:|
| **Teste QA** | 50 | **22** | 44% |
| **Garantia** (60 dias) | 46 | **19** | 41% |
| **Entrega técnica** | 35 | **16** | 46% |

**66 dos 155 tickets abertos não têm responsável** — e sua composição é reveladora:
18 Garantia, 18 Teste QA, 14 Entrega, 8 Desenvolvimento.

Ou seja: as demandas são desenvolvidas e vão para produção, mas **QA, entrega técnica formal e
garantia de 60 dias ficam abertos indefinidamente, sem dono**. Sete deles há **mais de um ano**;
outros 26 entre 6 meses e 1 ano.

Consequências visíveis nos próprios tickets:

- FSWTBC-2777 (entrega da DEM10013716): marcado *Concluído*, mas **checklist e critérios de aceite
  não marcados**, incluindo "MIT010 assinado" e "Termo de aceite formal" — e a garantia
  (FSWTBC-2774) continua em `AGUARDANDO INICIO`, coerente com um aceite que nunca ocorreu.
- FSWTBC-3698 (widget de Acompanhamento de Contratos, 66h): **cinco critérios de aceite não
  marcados**, sete meses de calendário, mais de 140 dias em pausa.
- FSWTBC-2840: resolução "Feito" **com status "Em Homologação"** — o ticket deixa de servir como
  indicador de progresso.

Isso explica boa parte da seção 4: **sem QA e sem garantia formal, o defeito volta como chamado
de suporte** — e é por isso que 47% da conta é corretiva.

---

## 7. Segurança

Achados encontrados **dentro dos dados analisados** (não são vulnerabilidades que eu explorei):

| Achado | Onde |
|---|---|
| Credencial em texto claro na descrição do ticket (`Usuário TOTVS-FS / Senha: «redigido — ver .env.test»`) | FSWTBC-4608 |
| Senha `«redigido — ver .env.test»` **hardcoded** na função `YGCTE027` | `UGCTE027.prw` |
| Hardcode de HTTP após habilitação de SSL na 12.1.2510 | `UCFGE003.tlpp` |
| **URLs e credenciais de ambiente não produtivo mantidas no fonte**, com alerta explícito de que em produção apontariam para ambiente errado | `UGPEE069` (item 7.3 do handoff FSWTBC-4944) |
| Correção aplicada em produção (MUD17729) **sem fontes versionados** | FSWTBC-4813 |
| Injeção de SQL por concatenação de parâmetro de usuário (débito de 2023, mantido por decisão de escopo) | `RPCOR001` |
| Portal de acompanhamento **aberto a qualquer usuário**; encerrado com o cliente dizendo "ainda não está funcionando" | FSWTBC-4075 |
| Filtro por fiscal vazando contratos de outros responsáveis | SDCASSI-487 |

Os dois últimos são de **controle de acesso** e nenhum tem evidência registrada de que o
bloqueio passou a funcionar.

---

## 8. O que funciona bem — e vale preservar

A leitura não é só de problema. Há prática de alto nível nesta base, concentrada em alguns
analistas, que merece virar padrão:

- **Pareceres com causa raiz provada, não suposta.** SDCASSI-490 demonstra a fórmula do erro
  **ao centavo em 5 contratos**, com um caso limite (diferença real zero e R$ 160 mil
  contabilizados) e uma **contraprova** (contrato anterior à alteração, contabilizado certo).
- **Refutação de premissa com medição.** SDCASSI-532: o relator afirmava que o erro não ocorria
  em HTTP; mediu-se que **HTTP nem sequer é atendido naquela porta**, e que HTTPS trafega 933 KB
  em 4,98 s sem falha — movendo o diagnóstico para timeout do cliente.
- **Pilha de execução completa** até a rotina padrão do produto, com tempo e taxa de instruções
  (SDCASSI-554: `UCOME036 → … → GetNumSC7 → ChkNumSC7`, ~114 h, ~37 mil instr/s).
- **Instrumentação de banco quando o resto falhou** — trace do DBAccess resolvendo um lock
  intermitente que três semanas de tentativa e erro não resolveram (SDCASSI-545).
- **Pedir a evidência certa em vez de adivinhar** — a lista de cinco itens exigida em 13/08
  (contrato, vigência, print das parcelas, quantidade, data dos fontes) destravou o SDCASSI-498.
- **Autocrítica registrada mesmo quando não é a causa** — SDCASSI-554: "no `UCOME036` a rotina
  `GERADOCUMENTO` é chamada direto na thread do schedule, sem `StartJob` e sem guarda de tempo.
  Não é a causa, mas é o que faz um travamento prender a fila por tempo indeterminado."
- **Handoff completo** (FSWTBC-4944): critério de escopo defensável, procedência verificada no
  histórico do repositório, débito antigo registrado e não corrigido, e a regra essencial de que
  correção de defeito surgida na branch intermediária **volta para a branch de origem**.

---

## 9. Recomendações, na ordem em que eu faria

**Imediato (dias)**
1. Escalonar **SDCASSI-537 (DIRF)** e **SDCASSI-563 (CNPJ alfanumérico)** — risco fora da TI,
   ambos sem responsável.
2. Atribuir dono aos **66 tickets abertos sem responsável**, começando pelos 7 com mais de um ano.
3. Responder a pergunta de 01/07 sobre o congelamento das demandas novas — duas MIT044 assinadas
   estão paradas, uma vinda de auditoria.

**Curto prazo (semanas)**
4. Abrir **um chamado por passivo de dado** da seção 4, cada um com escopo de levantamento
   (quantos registros) antes de discutir correção. Hoje eles vivem em comentários de tickets fechados.
5. Aplicar e validar o pacote consolidado `SDCASSI_498_P2510_20260902_1843.ptm` **na ordem
   obrigatória** (parâmetros → pacote → fórmulas). Uma fórmula digitada errado **não gera erro:
   lança valor zero.**
6. Blindar o `UCOME036` (`StartJob` + guarda de tempo), como o próprio time recomendou.

**Estrutural (meses)**
7. **Fechar o ciclo QA → Entrega → Garantia.** É a causa raiz do volume corretivo. Enquanto QA
   ficar 44% aberto, o defeito continuará chegando como suporte.
8. **Política de hotfix concorrente**: um pacote por fonte, consolidação obrigatória antes da
   liberação, e verificação de que o objeto foi *removido do RPO* — não só do git.
9. **Camada única de validação numérica** na fronteira Fluig↔Protheus (quantidade, preço,
   valor, casas decimais) — substitui os pisos arbitrários espalhados.
10. **Converter falha silenciosa em erro explícito** onde já está mapeado: retorno de aditivo,
    `_lAditivo` sem contrato de origem, marcação de parcela processada sem lançamento.
11. Rotacionar as credenciais expostas e remover os hardcodes de `UGCTE027`, `UCFGE003` e `UGPEE069`
    **antes** de qualquer nova subida a produção.

---

*Base: `analise/analises.jsonl` (1.537 registros) · anexos em `anexos/` · lotes brutos em `lotesR/`.*
