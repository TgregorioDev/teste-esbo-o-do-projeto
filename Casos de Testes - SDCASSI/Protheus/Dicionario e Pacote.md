<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# Dicionario e Pacote

Casos de teste do Protheus — registrados para execução futura no ERP.

| | |
|---|---|
| Casos neste arquivo | 8 |
| Verificados em tela | 0 total · 0 parcial · 8 não |

> **Como ler.** Estes casos **não são executáveis no Fluig** — o efeito do defeito só aparece
> no Protheus. Estão escritos por completo, do ponto de vista de quem for executá-los no ERP,
> para quando o projeto de testes cobrir o Protheus. Nenhum foi verificado em tela.

---

## CT-FSWTBC-1767  (Protheus · Concluído)

**Título:** Gravar, na base PRIME, um registro com caracteres especiais (ç, ã, é, &, ') pela mesma rotina que falha em produção, depois de confirmar que o RPO da PRIME é o mesmo da produção

**Origem:** FSWTBC-1767 — "[CASSI - BH] - Suporte Maio/2025] - Erro caracter especial na prime". Sem descrição. Comentário de encerramento (14/05/2025): "alguns erros já vistos estão ocorrendo na prime; ao debugar vimos que o fonte na prime está desatualizado, aplicamos a última versão da produção e o erro foi sanado na prime". Terceira confirmação no mês de RPO defasado na PRIME. Caso escrito como **caracterização de caminho** (§5-D): o ticket não diz qual rotina nem qual caractere.

**Módulo/Rota:** Protheus, ambiente **PRIME** → (1) Configurador (SIGACFG) → Ambiente → informações de versão/RPO ("Sobre"/data do RPO — nome exato a confirmar no menu do cliente); (2) a rotina de negócio onde o erro ocorreu (não documentada — usar a rotina reportada no chamado de suporte do mês). Sem superfície no Fluig: o Fluig de QA integra com o Protheus DES, não com a PRIME.

**Pré-condições**
- Acesso ao Protheus PRIME e ao Protheus de produção (só leitura, para comparar versão).
- Identificação da rotina que apresentou o erro (registro do suporte de maio/2025).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: erro de execução da rotina na PRIME e divergência de RPO entre PRIME e produção`. Sem credencial de Protheus.

**Passos**
1. Na PRIME, abrir o Configurador e anotar a data/hora do RPO e a build do AppServer.
2. Em produção, anotar os mesmos dados. Comparar.
3. Se divergirem, registrar a divergência (é o defeito de processo do ticket) e **não** prosseguir até que a PRIME receba a mesma versão.
4. Na PRIME, abrir a rotina reportada e incluir um registro com marcador `QA` cujos campos de texto contenham `ç ã é & '` e um campo com aspas.
5. Confirmar a gravação e reabrir o registro.
6. Se a rotina alimenta relatório ou integração, executar a consulta correspondente para o registro `QA`.

**Resultado esperado**
- RPO/build da PRIME idênticos aos de produção (mesma data de compilação dos fontes customizados).
- O registro com caracteres especiais grava e reabre com os caracteres íntegros; nenhuma tela de erro do AppServer.
- O comportamento na PRIME é o mesmo observado em produção para a mesma entrada.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro na PRIME que não ocorre em produção com a mesma entrada, causado por fonte desatualizado — "falso defeito" que consome suporte (três casos no mês, segundo a análise do lote).

**Severidade:** Média — não é risco financeiro, mas invalida a homologação feita na PRIME.

**Preparação de massa:** nenhuma além do registro `QA` criado pelo executor; a rotina precisa ser identificada com o time de suporte.

**Verificado em tela:** NÃO
**O que foi verificado:** nada no Fluig se aplica — a PRIME não é o ambiente que o Fluig de QA consome.
**Divergências encontradas:** o ticket não nomeia rotina, caractere nem tela; o registro documenta só a causa (RPO defasado).
**Dados/massa usados:** nenhum.

**Módulo ERP:** `Dicionario e Pacote`

---

## CT-FSWTBC-1796  (protheus · Concluído)

**Título:** Abrir Despesas de Comercialização (UCOME031) e executar a consulta sem errorlog de coluna inexistente

**Origem:** FSWTBC-1796 — "Errorlog ZZ7_NOME em UCOME031.PRW": `Invalid column name ZZ7_NOME` (SQL Server) no menu *Compras/Atualizações/Específicos/Despesas de comercialização*. O fonte referenciava um campo que **não existia na base** — pacote que levou o código sem o dicionário. Resolvido com patch do fonte compilado no `cc57go_prod_comp`.

**Módulo/Rota:** **Protheus → SIGACOM → Atualizações → Específicos → Despesas de comercialização (`UCOME031`)**; **Configurador → Dicionário de Dados → tabela ZZ7 → campo `ZZ7_NOME`**.

**Módulo ERP:** `Dicionario e Pacote`

**Pré-condições**
- Credencial no Protheus com acesso ao SIGACOM e ao Configurador (SX3/SX2, leitura); acesso ao console.log/errorlog do AppServer.
- Base com o pacote **mais recente** do UCOME031 aplicado (o ticket mostrou que o compilado divergia da master — conferir a data do fonte no RPO).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: errorlog "Invalid column name ZZ7_NOME" e tela de despesas vazia; ZZ7 não é consumida por nenhum dataset do Fluig`

**Passos**
1. Configurador → SX3 → ZZ7: confirmar que **`ZZ7_NOME`** existe e que a coluna existe fisicamente na tabela (`ZZ7010`/`ZZ7<empresa>`) — conferir com *Atualiza estrutura* ou consulta.
2. Anotar a posição atual do errorlog.
3. SIGACOM → Atualizações → Específicos → **Despesas de comercialização** → abrir a rotina, aplicar o filtro padrão e listar/relatar.
4. Ler o errorlog e o console.log.
5. Repetir 3–4 em uma **segunda filial/empresa** (o defeito é por base: uma empresa pode ter a coluna e outra não).

**Resultado esperado**
- Passo 1: campo no SX3 **e** coluna física presentes em todas as empresas em que a rotina roda.
- Passos 3–4: rotina lista os registros; **nenhum** `Invalid column name` no errorlog; nenhuma tela de erro ao usuário.
- Passo 5: mesmo resultado.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `Invalid column name ZZ7_NOME` no errorlog ao abrir/consultar a rotina; consulta sem dados.

**Severidade:** Média *(bloqueia a rotina de despesas de comercialização)*

**Preparação de massa:** nenhuma massa de negócio — só ambiente: pacote aplicado com dicionário (SX3 ZZ7) e fonte na mesma versão, pelo administrador do Protheus. Checklist de pós-deploy: comparar campos referenciados no fonte com o SX3 (é a mesma classe de defeito do FSWTBC-2157/2244).

**Verificado em tela:** NÃO
**O que foi verificado:** varredura dos fontes publicados do Fluig por `ZZ7` — nenhuma ocorrência; os datasets `dsProtheus_*` do tenant não expõem a tabela.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-3600  (Protheus · Em Execução (Desenvolvimento) · SDCASSI-81)

**Título:** Confirmar que a base DES está compatibilizada para a DEM10011184 (Corretagens): dicionário, RPO e APIs de corretagem publicadas no broker `rest_des`

**Origem:** FSWTBC-3600 — "[CASSI - DEM10011184] - Compatibilização da base DES". Sem descrição. Concluído em 26/12/2025 e **reaberto em 07/05/2026** (Em Execução). O épico FSWTBC-806 registra a cadeia de sintomas em fev–mar/2026: "não identificamos as APIs de Corretagens para seguir a homologação", "indisponibilidade do ambiente Protheus DES" (ambiente travado, reiniciado), "as APIs de Corretagem precisam ser publicadas" e erro no envio do cadastro da corretora. Caso de **regressão de ambiente**: ainda aberto, pode falhar hoje.

**Módulo/Rota:** Protheus DES (`caixade206393.protheus.cloudtotvs.com.br:4010/webapp` e broker REST `:4050/rest_des`) → Configurador (SIGACFG): Ambiente → Dicionário (tabelas/campos custom da corretagem — pelo payload, prefixo `ZZI`, a confirmar) → APIs REST de corretagem no broker. Sem superfície no Fluig: nenhuma tela/dataset do Fluig consome corretagens (GET search de um nome hipotético devolveu 500 NPE, igual ao controle inexistente).

**Pré-condições**
- Acesso ao Protheus DES e ao dicionário de produção (ou pacote da DEM) para comparar.
- Lista dos artefatos da DEM10011184 (fontes, tabelas, campos, APIs) da MIT044.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: presença das tabelas/campos de corretagem no dicionário do DES e resposta das APIs de corretagem no broker rest_des`. Sem credencial de Protheus nem de API.

**Passos**
1. No DES, abrir o Configurador e localizar cada tabela e campo customizado da DEM no dicionário (SX2/SX3); anotar os ausentes.
2. Anotar data/build do RPO do DES e comparar com a do pacote da DEM (ou de produção).
3. No broker `rest_des`, chamar o endpoint de listagem/health das APIs de corretagem (rota conforme MIT044) com credencial válida.
4. Chamar "Envio do Cadastro da Corretora" com o payload de exemplo do épico marcado `QA` e observar o retorno.
5. Chamar "Apurações de corretagens" para os contratos do exemplo.
6. Repetir os passos 3–5 após 30 min para caracterizar a estabilidade do DES (o épico registra ambiente travado).

**Resultado esperado**
- Todas as tabelas/campos da DEM existem no DES com os mesmos tipos/tamanhos do pacote.
- As APIs de corretagem respondem 200 (ou crítica de negócio legível), nunca 404 "rota não publicada".
- O DES permanece disponível durante a bateria; o executor consegue concluir a homologação sem reabrir chamado.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- "Não identificamos as APIs de Corretagens" / "as APIs precisam ser publicadas" (20–24/02/2026); DES indisponível/travado (23/02/2026); erro ao enviar cadastro da corretora e apurações (02/03/2026).
- Ticket reaberto em maio/2026 pelo mesmo motivo — compatibilização que "voltou a dar problema meses depois".

**Severidade:** Média — bloqueia a homologação da DEM (financeira), não afeta produção diretamente.

**Preparação de massa:** nenhuma no ERP além do payload `QA`; o executor precisa da lista de artefatos da DEM (MIT044) como oráculo.

**Verificado em tela:** NÃO
**O que foi verificado:** alcance do broker DES: `:4010/webapp/` → 200; `:4050/rest_des/` → 404 na raiz sem credencial (prova só que o host responde; não prova publicação de API). GET search `dsProtheus_getCorretagens_restGetAll` → 500 NPE (nome hipotético; sem dataset de corretagem no Fluig sob esse nome).
**Divergências encontradas:** o item está **aberto** (reaberto 07/05/2026) embora o lote traga `resolucao=Feito`; resultado esperado pode falhar hoje.
**Dados/massa usados:** nenhum.

**Módulo ERP:** `Dicionario e Pacote`

---

## CT-FSWTBC-3654  (protheus · Concluído · SDCASSI-111)

**Título:** Após uma virada de release do Protheus, conferir que os campos customizados de multa e bonificação da medição de contrato continuam presentes, editáveis e gravando

**Origem:** FSWTBC-3654 — "Adequação conforme virada de base": consequência da virada para a release 12.1.2410, a demanda DEM10015020 (campos de multa/bonificação) precisou de adequação. **O ticket não traz descrição** (só o título e uma linha de análise) — este caso é uma **caracterização de caminho** (§5-D), não um cenário reconstruído.

**Módulo/Rota:** Protheus → SIGAGCT → *Medição de Contratos* (nome de menu; rotina **a confirmar no menu do cliente**) → campos customizados da DEM10015020 (multa / bonificação, prefixo `X`). No Fluig, o formulário de *Faturamento de Contratos* (256836) **não tem** campo de multa nem de bonificação — só *Desconto* — logo não há superfície Fluig.

**Módulo ERP:** `Dicionario e Pacote`

**Pré-condições**
- Release do Protheus recém-atualizada (o cenário é pós-virada) com o pacote da DEM10015020 reaplicado (dicionário SX3 + fontes).
- Um contrato de homologação vigente, com planilha e saldo a medir, para abrir uma medição de teste.
- Usuário do ERP com acesso à rotina de medição.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: presença/gravação dos campos customizados de multa e bonificação na medição`. Sem credencial Protheus nesta rodada.

**Passos**
1. No Protheus, abrir *Configurador* → *Dicionário de Dados* → tabela da medição (CND/CNE, a confirmar) e localizar os campos customizados de multa e bonificação da DEM10015020; anotar nome, tipo, tamanho e se estão com *Usado = Sim*.
2. Abrir SIGAGCT → *Medição de Contratos* → *Incluir* para o contrato de homologação.
3. Localizar os campos de multa e bonificação na tela da medição; informar `QA 1,00` em cada um (valores mínimos) e um item com quantidade 1.
4. Gravar a medição **sem encerrar** (não gerar pedido) e reabrir em *Visualizar*.
5. (Se houver) executar a rotina/relatório customizado que consome esses campos e conferir o valor.

**Resultado esperado**
- Passo 1: os campos existem no dicionário, com *Usado = Sim* e as mesmas propriedades do pacote entregue (não voltaram ao padrão após a virada).
- Passo 3: os campos aparecem na tela da medição, editáveis, com validação de valor numérico.
- Passo 4: os valores gravados são exibidos ao reabrir — não voltam vazios nem zerados.
- Passo 5: o consumidor dos campos lê os mesmos valores.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Campos ausentes da tela ou do dicionário após a virada; ou erro de compilação/`invalid field name` em fonte que os referencia — o ticket não registra mensagem exata (`<não documentado>`).

**Severidade:** Alta — multa/bonificação alteram o valor pago ao fornecedor.

**Preparação de massa:** contrato de homologação com planilha e saldo a medir (existente; leitura). A medição de teste deve ser criada pelo executor com `QA` na observação e **não encerrada**, para não gerar pedido nem lançamento contábil. Exige credencial Protheus.

**Verificado em tela:** NÃO
**O que foi verificado:** apenas a ausência de superfície no Fluig: o HTML publicado do formulário de Faturamento de Contratos (256836) tem 6 ocorrências de *Desconto* e **zero** de "multa" ou "bonificação"; nenhum dataset com esse nome respondeu.
**Divergências encontradas:** o ticket não descreve o sintoma; a ligação com "campos de multa/bonificação" vem só da análise interna.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3788  (protheus · Concluído · SDCASSI-235)

**Título:** Aprovar pela alçada um contrato com "Contabiliza = Sim" e conferir que a aprovação conclui sem erro de campo inexistente (B1_XCPC)

**Origem:** FSWTBC-3788 — ao aprovar contrato com *contabiliza = SIM*: `invalid field name in Alias SB1->B1_XCPC on PROCCNZ(UGCTE001.PRW) linha 549`. Reincidência **exata** do SDCASSI-114 (outubro/2025, linha 536): campo customizado `B1_XCPC` ausente do dicionário (SB1) no ambiente onde o fonte foi compilado. Fechado em 09/04/2026 após criar o campo.

**Módulo/Rota:** Protheus → SIGAGCT → *Contratos* → *Aprovação* (alçada de contratos, `MV_XALCGCT`) — fonte `UGCTE001.PRW` / função `PROCCNZ`; dicionário: *Configurador* → SX3 → SB1 → `B1_XCPC`. Nomes de menu **a confirmar no menu do cliente**. **Não confundir** com a *Aprovação de Alçadas* da SC no Fluig (atividade 94 / grade `tbAlcadas`) — é outra alçada. Sem superfície Fluig: a alçada de contrato roda inteira no ERP.

**Módulo ERP:** `Dicionario e Pacote`

**Pré-condições**
- Campo `B1_XCPC` existente em SB1 no ambiente-alvo (o caso confere), com o pacote da DEM10013766 aplicado.
- Contrato de homologação em aprovação, tipo de contrato com *Contabiliza = Sim*.
- Usuário aprovador da alçada de contratos.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: erro de execução na aprovação do contrato e existência do campo B1_XCPC em SB1`. Sem credencial Protheus.

**Passos**
1. Em *Configurador* → *Dicionário de Dados* → SB1, procurar o campo `B1_XCPC`; anotar tipo/tamanho/*Usado*.
2. Em SIGAGCT, incluir um contrato de homologação (`QA`, valor mínimo) com tipo de contrato *Contabiliza = Sim* e enviar para aprovação.
3. Com o aprovador, aprovar o contrato pela alçada.
4. Verificar a situação do contrato e, no log do AppServer (console.log), se houve `invalid field name`.
5. (Auditoria de pacote) Repetir o passo 1 nos demais ambientes (DES/TST/PRD) — o ticket registra que o campo foi criado só na DES.

**Resultado esperado**
- Passo 1: `B1_XCPC` existe em SB1 em **todos** os ambientes onde `UGCTE001.PRW` está compilado.
- Passo 3: aprovação concluída, contrato passa para a situação seguinte (*Vigente*/*Emitido*), sem tela de erro.
- Passo 4: sem ocorrência de `invalid field name in Alias SB1->B1_XCPC`.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Tela de erro `invalid field name in Alias SB1->B1_XCPC on PROCCNZ(UGCTE001.PRW) linha 549` (ou outra linha, conforme o fonte evolua) e o contrato **não** aprovado.

**Severidade:** Alta — bloqueia a aprovação (alçada) e a contabilização de contratos.

**Preparação de massa:** contrato de homologação criado pelo executor no Protheus com tipo *Contabiliza = Sim*; exige credencial e perfil aprovador. Nada a preparar no Fluig.

**Verificado em tela:** NÃO
**O que foi verificado:** nenhuma superfície Fluig aplicável (a aprovação de contrato não passa pelo Fluig). Confirmado apenas que a *Aprovação de Alçadas* visível no Fluig é a da **SC** (instância 112011 parada nela há 18 dias, dado de 08/09), não a do contrato.
**Divergências encontradas:** o ticket usa "aprovação de alçada" sem qualificar; no ambiente há duas alçadas distintas (SC no Fluig; contrato no ERP).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-3876  (protheus · Concluído · SDCASSI-252)

**Título:** Incluir um documento de entrada para um fornecedor após a aplicação do pacote DEM10014951 e conferir que a inclusão não acusa campo inexistente (A2_XNATSRV)

**Origem:** FSWTBC-3876 — após aplicar a DEM10014951: `invalid field name in Alias SA2->A2_XNATSRV on U_UCOME022(UCOME022.TLPP) linha 59` ao incluir documento de entrada. Terceiro caso do padrão "fonte entregue antes do dicionário" (junto de `B1_XCPC` e da tabela ZZZ). Corrigido criando o campo `A2_XNATSRV` (natureza de serviço do fornecedor) na base de compilação; **sem registro** de propagação aos demais ambientes.

**Módulo/Rota:** Protheus → SIGACOM/SIGAEST → *Documento de Entrada* → *Incluir* (fonte `UCOME022.TLPP`); *Configurador* → SX3 → SA2 → `A2_XNATSRV`. Nomes de menu **a confirmar no menu do cliente**. Contraprova Fluig (**não é cobertura**): o *Cadastro de Fornecedor* (form 256830) tem o campo obrigatório **"Natureza de Serviço"** (`ztxt_natServ`, zoom) e o painel **"Natureza Financeira"** — é a origem do dado que a integração grava em `A2_XNATSRV`; a inclusão do documento de entrada, porém, é só ERP.

**Módulo ERP:** `Dicionario e Pacote`

**Pré-condições**
- Pacote DEM10014951 aplicado (fontes `UCOME022`/`UCOME002` compilados) **e** campo `A2_XNATSRV` criado em SA2 no mesmo ambiente.
- Fornecedor de homologação com natureza de serviço preenchida; produto e TES de homologação para um documento de entrada simples.
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: erro na inclusão do documento de entrada e existência do campo A2_XNATSRV em SA2`. Sem credencial Protheus.

**Passos**
1. Em *Configurador* → SX3 → SA2, localizar `A2_XNATSRV`; anotar tipo/tamanho/*Usado*. Repetir em DES, TST e PRD.
2. Abrir o cadastro do fornecedor de homologação e conferir o valor de *Natureza de Serviço* (`A2_XNATSRV`).
3. Em *Documento de Entrada* → *Incluir*, informar o fornecedor, um item de valor mínimo e a TES de homologação; gravar.
4. Observar se há tela de erro; consultar o log do AppServer por `invalid field name`.
5. (Fluig, contraprova) Abrir *Cadastro de Fornecedor* e conferir que o campo *Natureza de Serviço* existe e é obrigatório; **não** enviar.

**Resultado esperado**
- Passo 1: `A2_XNATSRV` existe em SA2 em **todos** os ambientes onde `UCOME022.TLPP` está compilado.
- Passo 3: documento de entrada gravado, sem erro.
- Passo 4: sem `invalid field name in Alias SA2->A2_XNATSRV`.
- Passo 5: campo presente e obrigatório no Fluig; o valor escolhido é o que aparece no passo 2 após a integração.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- `invalid field name in Alias SA2->A2_XNATSRV on U_UCOME022(UCOME022.TLPP) linha 59` e o documento **não** incluído (`erro_doc_entrada.png`) — "impossibilitando as homologações".

**Severidade:** Alta — bloqueia operação diária (entrada de documentos/fiscal).

**Preparação de massa:** fornecedor, produto e TES de homologação no Protheus (credencial obrigatória); o documento de entrada de teste deve ser estornado/excluído pelo executor após o teste. Nada a criar no Fluig.

**Verificado em tela:** NÃO
**O que foi verificado:** no HTML publicado do *Cadastro de Fornecedor* (form 256830, `form_fornecedor.html`): `<label for="ztxt_natServ">Natureza de Serviço</label>` com `data-required="true"`, e painel *Natureza Financeira* (`panelDefinNatFin`, campos `txt_respNatFin`, `txt_emailNatFin`, `dt_dataNatFin`). Nada do ERP foi aberto.
**Divergências encontradas:** nenhuma.
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4543  (protheus · Concluído · SDCASSI-82)

**Título:** Conferir que o dicionário de dados da DEM10011184 (Despesa de Comercialização) publicado no ambiente do cliente coincide com o projeto recuperado no Gestão de Projetos

**Origem:** FSWTBC-4543 — tarefa de recuperação do projeto de dicionário da DEM10011184, reconstruído e reimportado na base da **fábrica** (grupo `00 - CASSI`, projeto `000013`), com ajuste na ferramenta `SincronizadorDeProjetos`. **Ticket sem descrição** — caso escrito como caracterização de caminho. Não há registro de conferência contra o dicionário efetivamente publicado no cliente.

**Módulo/Rota:** Protheus (cliente) — *Configurador* → Base de Dados → Dicionário (SX2 tabelas, SX3 campos, SIX índices, SX6 parâmetros) da DEM10011184; Protheus (fábrica) — *Gerenciador de Projetos* (`UTBCA012`, a confirmar). Sem superfície no Fluig (rotas de corretora inexistentes — ver CT-FSWTBC-4052).

**Pré-condições**
- Lista de tabelas/campos/índices/parâmetros do projeto `000013 - DEM10011184` exportada da base da fábrica.
- Acesso ao Configurador do ambiente do cliente (DES/COMP/PRD).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: existência e estrutura das tabelas/campos do dicionário`. Sem credencial de Protheus.

**Passos**
1. Na fábrica, exportar do projeto `000013` a relação de tabelas (SX2), campos (SX3), índices (SIX) e parâmetros (SX6).
2. No cliente, para cada tabela da lista, abrir o Configurador → Dicionário e confirmar existência e campos (tipo, tamanho, decimais, obrigatoriedade).
3. Conferir os índices e parâmetros da lista.
4. Abrir o app *Cadastro de Corretoras* e incluir um registro `QA-<sufixo>` (sem regras) para exercitar o dicionário.
5. Registrar qualquer campo/tabela ausente ou com estrutura diferente.

**Resultado esperado**
- 100% das tabelas, campos, índices e parâmetros do projeto presentes no cliente, com a mesma estrutura.
- Inclusão de teste sem erro de campo inexistente/estrutura.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Projeto de dicionário ausente do Gestão de Projetos (ativo perdido); risco de o cliente ter dicionário divergente do que a fábrica consegue reproduzir.

**Severidade:** Média — gestão de configuração; sem dicionário conferido, qualquer patch da DEM10011184 pode falhar por campo ausente.

**Preparação de massa:** exportação do projeto pela fábrica; nenhum dado de negócio necessário.

**Módulo ERP:** `Dicionario e Pacote`
**Verificado em tela:** NÃO
**O que foi verificado:** Fluig sem qualquer rota ou dataset da DEM10011184 (`corretoras`, `cadastro_corretora`, `apuracao_corretagens` → 404; `dsProtheus_getCorretoras_restGetAll` → 500 NPE).
**Divergências encontradas:** ticket sem descrição (caracterização de caminho).
**Dados/massa usados:** nenhum — não submetido.

---

## CT-FSWTBC-4786  (protheus · Concluído · SDCASSI-459)

**Título:** Após aplicar a release com SSL, chamar a API UCFGA002 e confirmar que ela responde e que o endereço interno usado pelo UCFGE003 é HTTPS e igual ao fonte versionado

**Origem:** FSWTBC-4786 — erro em produção na API `UCFGA002` após a release 12.1.2510: `UCFGE003.tlpp` (chamado pelo UCFGA002) tinha **URL `http://` fixa** e a release passou a exigir SSL. Suspeita adicional: fonte com data de 2024, possivelente **desatualizado na branch master** (alterações não commitadas). Concluído em 29/07 **sem registro do desfecho**.

**Módulo/Rota:** Protheus → serviço REST (endpoint publicado por `UCFGA002` — *rota a confirmar no fonte/serviço do cliente*); Configurador → *Ambiente* → repositório/RPO (data de compilação do `UCFGE003`); repositório TFS/Git (branch master).

**Módulo ERP:** `Dicionario e Pacote`

**Pré-condições**
- Acesso ao fonte `UCFGE003.tlpp` na master e ao RPO de produção/homologação (comparar data/hash).
- Credencial do serviço REST de homologação já em **HTTPS** (release 12.1.2510).
- **Bloqueio:** `SOMENTE PROTHEUS — efeito só observável no ERP: resposta da API UCFGA002 e o endereço usado internamente pelo UCFGE003`. Sem credencial nesta rodada.

**Passos**
1. Comparar `UCFGE003.tlpp` da master com o compilado (data/hash) — registrar divergência.
2. Procurar no fonte qualquer URL fixa `http://`; registrar de onde a URL é lida (parâmetro/constante).
3. Chamar `UCFGA002` em homologação por HTTPS com payload válido.
4. Ler status e corpo; ler o console do appserver na janela da chamada.
5. Repetir a chamada com o serviço destino apenas em HTTPS (HTTP desligado).

**Resultado esperado**
- Passo 1: fonte da master **igual** ao compilado.
- Passo 2: nenhuma URL `http://` fixa; endereço lido de parâmetro (nome a registrar).
- Passos 3–5: resposta de sucesso; console sem erro de conexão/SSL; tráfego interno em **HTTPS**.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Erro na chamada da API em produção (print `ucfga002.jpg`; texto `<não documentado>`); chamada interna em HTTP recusada pelo destino com SSL.

**Severidade:** Alta *(API de produção indisponível e dado de integração em HTTP)*

**Preparação de massa:** nenhuma de negócio; obter do time a rota e o payload do UCFGA002 e o número do patch aplicado em 29/07 (não consta no ticket).

**Verificado em tela:** NÃO
**O que foi verificado:** apenas a ausência de superfície: grep por `UCFGA`/`cfga002` nos bundles e formulários publicados do Fluig baixados nesta e em rodadas anteriores — **zero ocorrências reais** (a única era blob base64). O Fluig fala com o Protheus por `apiRESTProtheus_CASSI`, não por essa API.
**Divergências encontradas:** o ticket foi concluído sem dizer se o HTTP virou HTTPS nem se o fonte foi sincronizado — os dois viram passos 1–2 deste caso.
**Dados/massa usados:** nenhum — não submetido.

---
