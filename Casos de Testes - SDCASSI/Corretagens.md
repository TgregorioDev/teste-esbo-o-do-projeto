<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# Corretagens

Casos de teste E2E do Fluig — módulo Corretagens.

| | |
|---|---|
| Casos neste arquivo | 8 |
| Verificados em tela | 0 total · 2 parcial · 6 não |

> **Como ler.** Cada caso descreve o comportamento **correto esperado hoje**. A maioria dos
> defeitos de origem já foi corrigida — o caso é de regressão: se reprovar, o defeito voltou.
> Os que reprovam hoje por causa nunca corrigida estão marcados no próprio caso.
> *Verificado em tela* diz o que foi conferido no ambiente de homologação em 08/09/2026;
> **PARCIAL** costuma significar que a conta de QA não tem o perfil necessário (comprador,
> gestor, fiscal, fornecedor), não que o caso seja inválido.

---

## CT-FSWTBC-658  (fluig · Concluído)

**Título:** Usuário abre uma corretora, não altera nada e sai — o sistema não acusa alteração.

**Origem:** FSWTBC-658 — "Falso positivo na alteração de uma corretora". O sistema acusava alteração
que não houve. Faz parte do bloco 658–665, oito defeitos do cadastro de corretoras.

**Módulo/Rota:** cadastro de **Corretoras**, no módulo de **Corretagens**. **Rota não identificável
neste ambiente** — ver a nota de bloqueio.

**Pré-condições**
- Acesso ao ambiente Fluig onde o módulo de Corretagens está publicado.
- Uma corretora cadastrada, **sem** corretagens lançadas, e outra **com** corretagens.
- **Bloqueio:** **sim** — o módulo de Corretagens **não existe no ambiente acessível**. Ver a nota ao
  fim do arquivo: nenhuma rota responde, nenhum app aparece no menu e nenhum dos 34 processos
  publicados tem relação com corretora.

**Passos**
1. Abrir o cadastro de **Corretoras** e localizar uma corretora existente.
2. Abrir a corretora em edição **sem tocar em nenhum campo**.
3. Sair da tela (fechar/voltar/cancelar).
4. Repetir abrindo a corretora, clicando dentro de um campo e saindo **sem digitar**.
5. Repetir alterando um campo e desfazendo a alteração (voltando ao valor original) antes de sair.
6. Conferir o histórico/auditoria da corretora.

**Resultado esperado**
- Sair sem tocar em campo algum **não** dispara aviso de alteração pendente nem grava versão nova.
- Clicar em um campo sem digitar **não** conta como alteração.
- Alterar e desfazer, voltando ao valor original, **não** conta como alteração.
- O histórico/auditoria da corretora não registra evento algum nas três situações.

**Resultado se o defeito reincidir**
- O sistema acusa alteração que não houve — aviso de "alterações não salvas", gravação de versão ou
  registro de auditoria em uma visita que não mudou nada. Mensagem exata `<não documentado>`.

**Severidade:** Média *(polui auditoria e gera retrabalho; sem efeito financeiro direto)*

**Preparação de massa:** duas corretoras cadastradas no ambiente de Corretagens — uma sem corretagens
e outra com corretagens —, criadas pela equipe que administra o módulo. **Nada disso pode ser
preparado a partir do ambiente acessível hoje.**

**Verificado em tela:** NÃO
**O que foi verificado:** apenas a **ausência** do módulo. As rotas `/portal/p/1/corretagens`,
`/portal/p/1/corretoras`, `/portal/p/1/corretagem`, `/portal/p/1/cadastro_corretora` e
`/portal/p/1/apuracao_corretagens` redirecionam todas para `/portal/p/1/errorPage/404` (*"Recurso não
foi encontrado."*). O menu **Meus Apps** da home tem quatro categorias — *RH Conecta*, *Gestão*,
*Compras*, *Contratos* — e nenhum item de corretagem. A API `/process-management/api/v2/processes`
devolve **34** processos publicados, **nenhum** com "corret" no nome ou no id.
**Divergências encontradas:** a mais importante do lote — o módulo de Corretagens do ticket **não está
publicado no Fluig acessível**. Ou vive em outra conta/ambiente da CASSI, ou foi despublicado. Sem
essa informação, os quatro casos de corretagem (658, 660, 661, 663) não são executáveis.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-660  (fluig · Concluído)

**Título:** Usuário edita uma corretora que não tem corretagens e os campos permitidos estão abertos para edição.

**Origem:** FSWTBC-660 — "Campos de edição da corretora fechado para edição mesmo sem corretagens". A
regra de bloqueio era aplicada onde não deveria. É o inverso de FSWTBC-665 (campo aberto quando
deveria estar fechado): a regra de habilitação estava **invertida em dois pontos**.

**Módulo/Rota:** cadastro de **Corretoras**, no módulo de **Corretagens** — rota não identificável
neste ambiente.

**Pré-condições**
- Uma corretora **sem nenhuma corretagem lançada**.
- Uma corretora **com corretagens lançadas** (para o contraste).
- **Bloqueio:** **sim** — módulo ausente do ambiente acessível (ver nota final).

**Passos**
1. Abrir uma corretora **sem corretagens** em modo de edição.
2. Percorrer os campos do cadastro e verificar quais aceitam digitação.
3. Alterar um campo permitido e salvar.
4. Abrir uma corretora **com corretagens** e repetir a verificação.
5. Comparar os dois conjuntos de campos habilitados.

**Resultado esperado**
- Sem corretagens, os campos do cadastro ficam **abertos para edição** — inclusive o **dia do
  vencimento** — e o salvamento conclui.
- Com corretagens lançadas, o **dia do vencimento** (e os demais campos que afetam corretagens já
  apuradas) fica **bloqueado**, e o restante do cadastro segue editável.
- A diferença entre os dois estados é exatamente a existência de corretagens — nenhuma outra condição
  fecha o campo.
- Nenhuma mensagem de erro ao editar o que é permitido.

**Resultado se o defeito reincidir**
- Campos ficam **fechados para edição mesmo sem corretagens**, impedindo a manutenção do cadastro; ou,
  no espelho do defeito (FSWTBC-665), o **dia do vencimento** fica aberto mesmo havendo corretagens.
  Mensagem exata `<não documentado>`.

**Severidade:** Média *(bloqueia manutenção de cadastro; o espelho, campo aberto indevidamente, tocaria
valor já apurado)*

**Preparação de massa:** duas corretoras — uma sem nenhuma corretagem e outra com pelo menos uma
corretagem apurada —, criadas por quem administra o módulo. Fora do alcance do executor.

**Verificado em tela:** NÃO
**O que foi verificado:** somente a ausência do módulo (mesma evidência do CT-FSWTBC-658: cinco rotas
em 404, ausência no menu **Meus Apps** e ausência nos 34 processos publicados).
**Divergências encontradas:** módulo de Corretagens ausente do ambiente acessível.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-661  (fluig · Concluído)

**Título:** Usuário abre uma corretora que tem valor gravado no campo de lookup e o lookup abre já preenchido com esse valor.

**Origem:** FSWTBC-661 — "Campo lookup não está vindo com o valor preenchido, mesmo tendo valor na
corretora". O lookup não resolvia o valor gravado — padrão clássico de zoom no Fluig quando a chave de
busca difere da chave gravada. Par direto de FSWTBC-664 ("Filtro do campo lookup não está funcionando").

**Módulo/Rota:** cadastro de **Corretoras** → campo de **lookup/zoom** do formulário — rota não
identificável neste ambiente.

**Pré-condições**
- Uma corretora com o campo de lookup **preenchido e gravado**.
- O registro referenciado pelo lookup existente e ativo na origem.
- **Bloqueio:** **sim** — módulo ausente do ambiente acessível (ver nota final).

**Passos**
1. Abrir uma corretora que tenha valor gravado no campo de lookup.
2. Conferir se o campo exibe o valor (código **e** descrição) logo ao abrir a tela.
3. Abrir o lookup e conferir se o registro correspondente vem **selecionado**.
4. Digitar parte do código e parte da descrição no filtro do lookup e conferir o resultado.
5. Salvar sem alterar e reabrir a corretora.

**Resultado esperado**
- O campo de lookup abre **já preenchido** com o valor gravado, exibindo código e descrição.
- Ao abrir o zoom, o registro gravado aparece selecionado/destacado.
- O filtro do lookup responde tanto por código quanto por descrição (cobre também FSWTBC-664).
- Salvar sem alterar e reabrir mantém exatamente o mesmo valor — o lookup não se esvazia no ciclo
  gravar/reabrir.

**Resultado se o defeito reincidir**
- O campo de lookup vem **vazio** ao abrir a corretora, mesmo havendo valor gravado, e quem editar o
  cadastro grava por cima com vazio. Mensagem exata `<não documentado>`.

**Severidade:** Média *(o campo vazio induz gravação com perda do valor original)*

**Preparação de massa:** uma corretora com o campo de lookup preenchido e o registro de origem ativo.
Fora do alcance do executor.

**Verificado em tela:** NÃO
**O que foi verificado:** somente a ausência do módulo. Como referência do comportamento **correto** de
zoom/lookup neste Fluig, inspecionei os zooms equivalentes no formulário de *Faturamento de Contratos*
(`zoomFornecedor`, `zoomNumContrato`, `zoomCompetencia`, `zoomFilialMedicao`, `zoomNumPlanilha`): são
`select` com campo de busca acoplado, e os dependentes nascem com a busca **desabilitada** até o
anterior ser escolhido — o encadeamento é a regra da casa.
**Divergências encontradas:** módulo de Corretagens ausente do ambiente acessível; não foi possível
confirmar sequer o rótulo do campo de lookup citado no ticket.
**Dados/massa usados:** nenhum.

---

## CT-FSWTBC-662  (FSWTBC-662 · ambos · Concluído)

**Título:** Executar uma apuração para corretora sem contrato e confirmar que a tela mostra o erro devolvido pelo Protheus, em vez de mensagem de sucesso.

**Origem:** FSWTBC-662 — ao realizar apuração em corretora **sem contrato**, o Protheus gera erro mas a
tela exibe mensagem de **sucesso**. Erro silencioso: a integração falha e o usuário acha que deu certo.

**Módulo/Rota:** Fluig → tela de **apuração** de corretora (rota específica **`<não documentado>`** no
ticket; ver divergências) × Protheus (retorno da API de apuração).

**Pré-condições**
- Corretora cadastrada **sem contrato** vinculado — massa que faz o Protheus recusar a apuração.
- Perfil com acesso à rotina de apuração de corretoras.
- **Bloqueio:** duplo. (1) O ticket **não nomeia a rota** da apuração e não localizei, no portal desta
  conta, tela de apuração de corretoras — o perfil disponível é Compras/Contratos; a rota precisa ser
  confirmada com o time da CASSI antes da execução. (2) A confirmação de que o Protheus **gerou** erro
  exige log/acesso ao ERP — **sem credencial**. Âncora no Fluig: o par de campos
  **"Erro retornado pelo ERP Protheus"** (presente nos formulários de Cotação e Negociação) e o
  **Histórico** da solicitação.

**Passos**
1. Autenticar no Fluig com perfil que acesse a rotina de **apuração** de corretoras.
2. Selecionar uma **corretora sem contrato** vinculado.
3. Executar a **apuração** para o período de referência.
4. Ler a mensagem exibida na tela ao término do processamento.
5. Conferir o resultado no destino da apuração (registro gerado ou ausência dele) e, quando houver,
   o campo de erro retornado pelo ERP.

**Resultado esperado**
- A tela exibe **mensagem de erro**, não de sucesso, quando o Protheus recusa a apuração.
- A mensagem identifica a causa — corretora sem contrato — em texto compreensível ao usuário.
- Nenhum registro de apuração é dado como concluído para essa corretora.
- O erro devolvido pelo ERP fica registrado em campo consultável (ex.: *Erro retornado pelo ERP
  Protheus*) e/ou no Histórico da solicitação.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O Protheus gera erro e **a tela exibe mensagem de sucesso** — o usuário conclui que a apuração
  ocorreu quando não ocorreu.

**Verificado em tela:** PARCIAL
**O que foi verificado:** não encontrei a rotina de apuração de corretoras neste portal — os apps
disponíveis para a conta são, por aba: *RH Conecta* (Substituição de Cargos, Declaração de Múltiplos
Vínculos, Gestão de Férias, Gestão do Banco de Horas e Horas Extras, Gestão de Equipes), *Gestão*,
*Compras* e *Contratos* (Faturamento de Contratos), além dos portais de Comprador, Fornecedor,
Acompanhamento de Contratos e Tracker. **Porém verifiquei o mecanismo do defeito, vivo, em outra
tela**: `/portal/p/1/gestao_equipes` exibe um modal cujo cabeçalho é **"Sucesso:"** e cujo corpo é
**"Usuário não encontrado no ERP Protheus."** — uma falha de integração rotulada como sucesso, que é
exatamente a classe de erro silencioso deste ticket. Confirmei ainda que os formulários de **Cotação**
e de **Negociação de Cotação** possuem o campo **"Erro retornado pelo ERP Protheus *"**, o que mostra
que o padrão correto (superficializar o erro do ERP) existe e está implementado nesses processos.
**Divergências encontradas:** **duas**. (1) A rota da apuração de corretoras não consta do ticket nem
foi localizada no portal desta conta — `<não documentado>`; precisa ser informada pela CASSI para o
caso virar executável. (2) **Achado novo:** a tela *Gestão de Equipes* apresenta hoje um erro de
integração sob o título **"Sucesso:"** — mesma polaridade invertida do defeito 662, em componente
diferente. Recomendo abrir registro próprio.
**Dados/massa usados:** nenhum — não submetido. Somente leitura.

---

## CT-FSWTBC-663  (fluig · Concluído)

**Título:** Usuário tenta apurar corretagem de uma corretora sem contrato e o sistema recusa com mensagem clara, antes de chamar o Protheus.

**Origem:** FSWTBC-663 — "Adicionando regra de validação de contrato no cadastro de corretora". É a
correção estrutural de FSWTBC-662: *"Ao realizar uma apuração em uma corretora que não tem contrato o
Protheus gera erro mas na tela exibe mensagem de sucesso"* — erro silencioso. A validação ficou **159
dias em Aguardando Início** e foi executada e fechada no mesmo dia.

**Módulo/Rota:** cadastro de **Corretoras** (regra de validação de contrato) e a rotina de **apuração
de corretagem** — rota não identificável neste ambiente.

**Pré-condições**
- Uma corretora **sem contrato** vinculado.
- Uma corretora **com contrato** vigente (contraprova).
- **Bloqueio:** **sim** — módulo ausente do ambiente acessível (ver nota final). Ainda que existisse,
  a confirmação do lado do ERP exigiria credencial de Protheus, que não há.

**Passos**
1. Abrir o cadastro de uma corretora **sem contrato** vinculado.
2. Tentar salvar/ativar a corretora e ler a crítica.
3. Tentar executar a **apuração** de corretagem para essa corretora.
4. Ler a mensagem exibida ao fim da apuração.
5. Conferir se algum registro foi gerado no Fluig e no Protheus.
6. Repetir com a corretora **com contrato** vigente e confirmar que a apuração conclui.

**Resultado esperado**
- A validação de contrato dispara **no cadastro**: corretora sem contrato não passa pela regra, com
  mensagem identificando a falta do contrato.
- A **apuração** de corretora sem contrato é **recusada antes** de chamar o Protheus.
- A tela exibe **erro**, nunca "sucesso": a mensagem de retorno reflete o resultado real da integração.
- Nenhum registro de apuração é criado quando a validação recusa.
- Com contrato vigente, a apuração conclui e a mensagem de sucesso corresponde ao que foi gravado no ERP.

**Resultado se o defeito reincidir**
- A apuração de corretora sem contrato **gera erro no Protheus e mensagem de sucesso na tela**
  (sintoma exato de FSWTBC-662): o usuário acredita que apurou e nada foi gravado. Mensagem exata
  `<não documentado>` — o ticket descreve o comportamento, não o texto.

**Severidade:** Alta *(erro silencioso em rotina de apuração financeira — o usuário conclui que pagou/apurou e não apurou)*

**Preparação de massa:** duas corretoras, uma sem contrato e uma com contrato vigente, mais permissão
para executar a apuração. Fora do alcance do executor. **Não execute apuração em corretora de
produção** para reproduzir.

**Verificado em tela:** NÃO
**O que foi verificado:** somente a ausência do módulo. O padrão de defeito que este ticket corrige —
falha de integração anunciada como sucesso — **foi observado vivo em outra tela deste ambiente**: a
widget *Gestão de Equipes* exibe o erro *"Usuário não encontrado no ERP Protheus."* sob o cabeçalho
**"Sucesso:"**. Serve de evidência de que a família de defeito é real aqui, mas **não** é verificação
do caso de corretagem.
**Divergências encontradas:** módulo de Corretagens ausente do ambiente acessível.
**Dados/massa usados:** nenhum.

---

## Nota — o módulo de Corretagens não existe no ambiente acessível

Quatro itens deste lote (658, 660, 661, 663 — e, no universo, também 662, 664, 665) tratam do cadastro
de **corretoras** e da apuração de **corretagens**. Procurei o módulo por quatro caminhos, todos
negativos:

1. **Rotas diretas** — `/portal/p/1/corretagens`, `/portal/p/1/corretoras`, `/portal/p/1/corretagem`,
   `/portal/p/1/cadastro_corretora`, `/portal/p/1/apuracao_corretagens`: **todas** redirecionam para
   `/portal/p/1/errorPage/404` com *"Recurso não foi encontrado."*
2. **Menu do portal** — *Meus Apps* traz quatro categorias (*RH Conecta*, *Gestão*, *Compras*,
   *Contratos*) e os links são: Substituição de Cargos, Declaração de Múltiplos Vínculos, Gestão de
   Férias, Gestão do Banco de Horas e Horas Extras, Gestão de Equipes, Solicitação de Compras e
   Faturamento de Contratos. Nenhum de corretagem.
3. **Processos publicados** — `GET /process-management/api/v2/processes?pageSize=200` devolve **34**
   processos; **nenhum** contém "corret" no id, nome ou descrição.
4. **Páginas do portal** — nenhuma página de corretagem alcançável pela navegação autenticada.

Conclusão honesta: os quatro casos foram escritos com passos e critérios completos, mas **não são
executáveis a partir deste ambiente**. Antes de executá-los, é preciso que a CASSI informe **em qual
conta/ambiente Fluig o módulo de Corretagens está publicado** e forneça acesso.

## CT-FSWTBC-664  (fluig · Concluído)

**Título:** Usuário digita um trecho no campo lookup de uma tela de corretora e a lista traz só os registros que casam com o texto.

**Origem:** FSWTBC-664 — "Filtro do campo lookup não está funcionando". Par de FSWTBC-661
("Campo lookup não está vindo com o valor preenchido, mesmo tendo valor na corretora"), mesma
tela. O ticket **não traz descrição**, só o título — caso escrito como caracterização de caminho.

**Módulo/Rota:** Fluig → tela de **cadastro/edição de Corretora** (módulo de Corretagens), campo
de lookup (zoom) da tela. **Esta tela não está publicada no tenant de homologação** — ver Bloqueio.
Rota substituta, com o mesmo mecanismo de lookup, verificada hoje: *Faturamento de Contratos*
(`/portal/p/1/pageworkflowview?processID=wf_faturamento_contratos`) → campo **Fornecedor \***
(`#zoomFornecedor`).

**Pré-condições**
- Acesso à tela de cadastro de Corretora com permissão de edição.
- Massa: ao menos dois registros na origem do lookup, um deles casando com o texto digitado e
  outro não — sem isso o filtro "passa" por não ter o que descartar.
- **Bloqueio:** **sim.** O módulo de Corretagens **não existe neste ambiente**: das 88 páginas e
  34 processos publicados, nenhum contém "corretora"/"corretagem". O caso não é executável aqui;
  só na instância da CASSI onde o módulo está publicado.

**Passos**
1. Abrir a tela de cadastro/edição de **Corretora** e entrar em modo de edição.
2. Clicar no campo **lookup** apontado pelo defeito e digitar um trecho que exista em **um** dos
   registros da origem (ex.: parte da razão social).
3. Aguardar o retorno da consulta e ler a lista suspensa.
4. Repetir com um trecho que **não** exista em nenhum registro.
5. Selecionar um item da lista e conferir que o valor escolhido fica gravado no campo.

**Resultado esperado**
- Ao digitar, o Fluig dispara a consulta do zoom **enviando o texto digitado como filtro**
  (`GET /ecm/api/rest/ecm/dataset/datasetZoom/{...}?...&pattern=<texto>`), e **não** a lista inteira.
- A lista suspensa exibe **apenas** os registros que casam com o texto.
- Com um trecho inexistente, a lista volta **vazia** — não volta a lista completa.
- O item selecionado preenche o campo e permanece após sair do campo (contraparte de FSWTBC-661).

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- O filtro é ignorado: a lista devolve todos os registros independentemente do que se digita
  (ou não devolve nada). Mensagem/valor exatos `<não documentado>` — o ticket não guarda descrição.

**Severidade:** Média *(bloqueia a seleção do registro correto no fluxo, sem risco financeiro direto)*

**Preparação de massa:** ambiente com o módulo de Corretagens publicado; pelo menos duas
corretoras/registros na origem do lookup, com textos distintos. Quem prepara: administrador Fluig
da CASSI (publicação do módulo) + analista funcional (cadastro dos registros).

**Verificado em tela:** PARCIAL
**O que foi verificado:** (a) o módulo alvo **não existe** — inventário completo de 88 páginas e 34
processos publicados, nenhuma com "corretor*"; (b) o **mecanismo de lookup do Fluig foi exercitado
ao vivo** na rota substituta: no formulário de Faturamento de Contratos, digitar `TOTVS` no campo
de busca do zoom **Fornecedor \*** disparou
`GET /ecm/api/rest/ecm/dataset/datasetZoom/{"searchField":"A2_NOMECGC","filterFields":[],"resultFields":["A2_NOMECGC","A2_COD","A2_LOJA","A2_NOME","A2_CGC","A2_EMAIL"],"datasetId":"dsProtheus_getFornecedores_restGetAll"}?limit=300&offset=0&orderby=A2_CGC_ASC&pattern=TOTVS`
→ HTTP **200 com 1 registro**, e a lista exibiu exatamente
*"NOME E CPF/CNPJ TOTVS S.A - 53113791000122 · CÓDIGO 53113791 · LOJA 0001"*. O filtro do lookup
**funciona hoje** no mecanismo compartilhado. Nada foi selecionado nem submetido.
**Divergências encontradas:** a tela do ticket (corretora) **não existe neste tenant** — o caso só
é executável na instância onde o módulo de Corretagens está publicado.
**Dados/massa usados:** nenhum — apenas o texto `TOTVS` digitado num campo de busca; sem seleção e sem submissão.

---

## CT-FSWTBC-665  (fluig · Concluído)

**Título:** Usuário abre uma corretora que já possui corretagens e o campo "dia do vencimento" vem bloqueado para edição.

**Origem:** FSWTBC-665 — "Campo dia do vencimento aberto quando existe corretagens para a
corretora". Par invertido de FSWTBC-660 ("Campos de edição da corretora fechado para edição mesmo
sem corretagens"): a regra de habilitação estava trocada nos dois sentidos. O ticket **não traz
descrição**, só o título.

**Módulo/Rota:** Fluig → **cadastro/edição de Corretora** (módulo de Corretagens) → campo
**dia do vencimento**. **Não publicado neste tenant** — ver Bloqueio.

**Pré-condições**
- Duas corretoras cadastradas: **(A)** com ao menos uma corretagem lançada, **(B)** sem nenhuma
  corretagem. O par é obrigatório — sem ele não se distingue "bloqueado sempre" de "bloqueado
  corretamente".
- Perfil com permissão de edição do cadastro de corretora.
- **Bloqueio:** **sim.** Módulo de Corretagens ausente do ambiente (88 páginas / 34 processos
  publicados, nenhuma com "corretora"/"corretagem"). Não há tela, campo nem massa para exercitar.

**Passos**
1. Abrir a corretora **(A)**, que **possui** corretagens, em modo de edição.
2. Localizar o campo **dia do vencimento** e tentar alterá-lo (clique + digitação).
3. Abrir a corretora **(B)**, que **não possui** corretagens, em modo de edição.
4. Localizar o mesmo campo **dia do vencimento** e tentar alterá-lo.

**Resultado esperado**
- Na corretora **(A)** (com corretagens): o campo **dia do vencimento** está **bloqueado**
  (`readonly`/`disabled`) e a digitação não altera o valor — alterar a data de vencimento com
  corretagens já apuradas mudaria a base de cálculo de registros existentes.
- Na corretora **(B)** (sem corretagens): o campo está **habilitado** e aceita edição normalmente
  (é o contra-caso de FSWTBC-660).
- A regra vale por corretora, e não globalmente por tela.

**Resultado se o defeito reincidir**
- O campo **dia do vencimento** aparece **aberto para edição mesmo com corretagens existentes**
  para a corretora. Mensagem/valor exatos `<não documentado>` — o ticket não guarda descrição.
- Sintoma irmão a vigiar junto (FSWTBC-660): campos **fechados** numa corretora **sem** corretagens.

**Severidade:** Alta *(dia de vencimento é base de cálculo de corretagem já apurada; edição indevida altera valor devido)*

**Preparação de massa:** ambiente com o módulo de Corretagens publicado; **duas** corretoras —
uma com corretagem lançada e outra sem — criadas por analista funcional da CASSI. A automação de
QA não pode criar corretagem (não há tela nem processo aqui).

**Verificado em tela:** NÃO
**O que foi verificado:** apenas a **ausência** do módulo: inventário completo das 88 páginas
publicadas (`/page-management/api/v2/pages?pageSize=400`) e dos 34 processos
(`/process-management/api/v2/processes?pageSize=300`) — nenhum item de corretora/corretagem.
A tela do ticket, o campo *dia do vencimento* e as duas corretoras nunca puderam ser abertos.
**Divergências encontradas:** o módulo inteiro do ticket não existe neste ambiente de homologação.
**Dados/massa usados:** nenhum — nada aberto, nada submetido.

---

## CT-FSWTBC-2887  (fluig · Concluído · SDCASSI-81)

**Título:** Usuário edita o cadastro da corretora e apenas os campos previstos na documentação ficam habilitados.

**Origem:** FSWTBC-2887 — “[DEM10011184 - Automatização Corretagens] Campos de edição da corretora
não está de acordo com a documentação”: a regra de habilitação/desabilitação de campos da corretora
quebrou. É **reincidência** de FSWTBC-660/665, cinco meses depois. Ticket **sem descrição, sem
anexo e sem comentário**. *(Caso escrito como caracterização de caminho, §5-D.)*

**Módulo/Rota:** **`<não documentado>`** — a funcionalidade de **Corretagens** (DEM10011184) **não
foi localizada** neste ambiente. Ver *Verificado em tela*.

**Pré-condições**
- Acesso à funcionalidade de **Automatização de Corretagens** (DEM10011184) — processo, widget ou
  página, a confirmar com o time da demanda.
- Um cadastro de **corretora** existente, e a **documentação da DEM10011184** que define, campo a
  campo, o que deve estar habilitado em cada situação — sem ela o caso não tem oráculo.
- **Bloqueio:** **sim, total.** A funcionalidade não existe/não está publicada nesta base para esta
  conta (detalhes abaixo). O caso **não é executável** nesta rodada.

**Passos**
1. Abrir a funcionalidade de **Corretagens** (rota a confirmar com o time da DEM10011184).
2. Localizar um cadastro de **corretora** existente e acioná-lo em modo de **edição**.
3. Percorrer todos os campos do formulário anotando quais estão **habilitados**, quais estão
   **somente-leitura** e quais estão **ocultos**.
4. Comparar campo a campo com a matriz da documentação da DEM10011184.
5. Repetir em cada situação/etapa prevista (inclusão × edição × consulta; e por perfil, se a
   documentação distinguir).
6. Tentar digitar em um campo que a documentação define como bloqueado.

**Resultado esperado**
- O conjunto de campos habilitados na edição da corretora é **exatamente** o previsto na
  documentação da DEM10011184 — nem mais, nem menos.
- Campo definido como bloqueado **não aceita digitação** (e não apenas “parece” bloqueado: um campo
  com aparência desabilitada mas editável é o mesmo defeito).
- A regra vale em **todas** as situações previstas (inclusão, edição, consulta) e não depende da
  ordem em que os campos foram preenchidos.

**Resultado se o defeito reincidir** *(o que se via quando o bug existia)*
- Campos da corretora que deveriam estar desabilitados aparecem editáveis (ou o inverso), divergindo
  da documentação. Rótulos e mensagem exata: `<não documentado>` — o ticket não tem descrição nem
  anexo. **Atenção:** já é a **terceira** ocorrência (FSWTBC-660, 665 e este); se reincidir, trate
  como defeito estrutural da regra de habilitação, não como ajuste pontual.

**Severidade:** Média *(campo indevidamente editável permite alterar dado cadastral fora da regra;
sobe para Alta se algum dos campos afetados for financeiro — a documentação da DEM define isso)*

**Preparação de massa:** (1) **a documentação da DEM10011184**, que é o oráculo do caso — sem ela não
há como afirmar o que “deveria” estar habilitado; (2) um cadastro de corretora em cada situação
prevista; (3) a informação de **onde** a funcionalidade está publicada. Os três faltam hoje.

**Verificado em tela:** NÃO
**O que foi verificado:** a busca pela funcionalidade foi feita e deu negativa em três frentes.
(1) **Catálogo completo de processos** (*Iniciar Solicitações → Todos os processos*), percorrido
categoria a categoria — *Categoria sem nome* (1), *ADM* (1), *ADMIN* (1), *Compras* (6), *Contratos*
(2), *Financeiro* (1), *Questionarios* (1), *RH* (5), *Tarefas Gerais* (1), *TOTVS Juridico* (4):
**nenhum processo de corretagem/corretora**. (2) Busca pelo termo “corretagem” no texto da **Home**:
não encontrado. (3) Rotas candidatas `/portal/p/1/corretagem`, `/portal/p/1/corretagens` e
`/portal/p/1/portal_corretagem`: as três redirecionam para `/portal/p/1/errorPage/404`, heading
*“Recurso não foi encontrado.”*
**Divergências encontradas:** **a funcionalidade de Corretagens não está publicada nesta base de
homologação, ou está sob um nome que não contém a palavra.** Antes de executar este caso é preciso
que o time da DEM10011184 informe a rota/artefato — sem isso o caso permanece inexecutável.
**Dados/massa usados:** nenhum.

---
